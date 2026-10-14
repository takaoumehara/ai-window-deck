import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Download, Keyboard, LayoutGrid, Maximize2, PanelLeft, Expand, Search, Settings, Undo2 } from "lucide-react";
import { SHEET_MS } from "@desktop/components/ui/Sheet";
import { IconButton } from "@desktop/components/ui/controls";
import { Pane } from "@desktop/components/Pane";
import { Sidebar } from "@desktop/components/Sidebar";
import { WindowEditor } from "@desktop/components/WindowEditor";
import { PasteListSheet } from "@desktop/components/PasteListSheet";
import { SettingsSheet } from "@desktop/components/SettingsSheet";
import { SetsSheet } from "@desktop/components/SetsSheet";
import { ShortcutsSheet } from "@desktop/components/ShortcutsSheet";
import { CommandPalette } from "@desktop/components/CommandPalette";
import { TipsSheet } from "@desktop/components/TipsSheet";
import { deck, isElectron } from "@desktop/lib/bridge";
import { ASK_AI_URLS, featureGuide, paletteEntries } from "@desktop/lib/palette";
import commandCatalog from "../electron/commands.json";
import { DEFAULT_WINDOWS, hostLabel, parseExtensionExport, urlList } from "@desktop/lib/deck-data";
import { EMPTY_HISTORY, diffSets, record, redo, storePatchBetween, undo } from "@desktop/lib/history";
import { computePaneRects, cycleIndex, layoutMoves, nextModeForSpotlight } from "@desktop/lib/pane-layout";
import { addressToUrl, indexAfterMove, insertTab, metaByUrl, moveTab, removeTab, stepZoom, tabForNumber } from "@desktop/lib/tabs";
import { resolveLanguage, translator } from "@desktop/lib/strings";
import { deviceForPane, findDevice, paneDeviceOf, togglePaneDevice } from "@desktop/lib/device-frame";

// --cie-t-move (360ms) for the .deck-pane transition, plus a few frames of slack.
const LAYOUT_ANIMATION_MS = 420;
// A layout change waits at most this long for page snapshots before animating.
const SNAPSHOT_TIMEOUT_MS = 160;
// Snapshots stay under the live pages briefly so a page that repaints late never shows a gap.
const SNAPSHOT_LINGER_MS = 160;
const COMPACT_PANE_PX = 380;
const DEFAULT_DEVICE = "iphone-17-pro";
const CLOSED_TABS_KEPT = 25;
const NOTICE_MS = 3200;
const UNDO_NOTICE_MS = 6000;
const ASK_AI_WINDOW = "win-ask-ai";
const GROUP_LABELS = { help: "groupHelp", mobile: "groupMobile", page: "groupPage", layout: "groupLayout", tabs: "groupTabs", windows: "groupWindows" };
const LANGUAGE_NAMES = {
  ja: "Japanese", en: "English", "zh-Hans": "Simplified Chinese", "zh-Hant": "Traditional Chinese", ko: "Korean",
  es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
};
const tEnglish = translator("en");
const SHEET_COMMANDS = new Set(["sets-open", "open-settings", "open-shortcuts", "paste-list", "show-tips", "edit-window", "add-window"]);

const MODE_OPTIONS = [
  { id: "grid", icon: LayoutGrid, label: "modeGrid" },
  { id: "spotlight", icon: Maximize2, label: "modeSpotlight" },
  { id: "fill", icon: Expand, label: "modeFill" },
];

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const newSetId = () => `set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const makeSet = (name, windows = [], mode = "grid") => ({ id: newSetId(), name, windows, mode, focusedId: null, activeTabs: {} });

// ⌘Z belongs to the deck only outside text fields; page views never send keys here.
const isEditable = (element) =>
  element instanceof Element && (element.isContentEditable || Boolean(element.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")));

export function App() {
  const [loaded, setLoaded] = useState(false);
  const [platform, setPlatform] = useState("browser");
  const [appVersion, setAppVersion] = useState("");
  const [updateReady, setUpdateReady] = useState(null);
  const [sets, setSets] = useState([]);
  const [setId, setSetId] = useState(null);
  const [openElsewhere, setOpenElsewhere] = useState([]);
  const [mode, setMode] = useState("grid");
  const [focusedId, setFocusedId] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [lang, setLang] = useState("ja");
  const [defaultMode, setDefaultMode] = useState("grid");
  const [defaultDevice, setDefaultDevice] = useState(DEFAULT_DEVICE);
  const [catalog, setCatalog] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});
  const [paneMeta, setPaneMeta] = useState({});
  const [paneErrors, setPaneErrors] = useState({});
  const [editor, setEditor] = useState({ open: false, item: null });
  const [sheet, setSheet] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deckSize, setDeckSize] = useState({ width: 0, height: 0 });
  const [snapshots, setSnapshots] = useState({});
  const [field, setField] = useState(null);
  const [found, setFound] = useState({});

  const deckRef = useRef(null);
  const bodyRefs = useRef(new Map());
  const closedTabs = useRef([]);
  const lastFind = useRef({});
  // Edits read and write these synchronously, so several edits in one event
  // (or one arriving mid-transition) each build on the last.
  const setsRef = useRef([]);
  const setIdRef = useRef(null);
  const openElsewhereRef = useRef([]);
  const historyRef = useRef(EMPTY_HISTORY);
  const loadStarted = useRef(false);
  const t = useMemo(() => translator(lang), [lang]);
  const isMac = platform === "darwin";
  const keyLabel = useCallback((key) => (isMac ? `⌥${key}` : `Alt+${key}`), [isMac]);
  const primaryLabel = useCallback((key) => (isMac ? `⌘${key}` : `Ctrl+${key}`), [isMac]);
  const setKeyLabel = useCallback((n) => (isMac ? `⌘⌥${n}` : `Ctrl+Shift+${n}`), [isMac]);
  const setLabel = useCallback((set) => set?.name || t("defaultSetName"), [t]);
  const paneKeys = useMemo(() => ({
    back: isMac ? "⌘[ / ⌘←" : "Ctrl+[ / Alt+←",
    forward: isMac ? "⌘] / ⌘→" : "Ctrl+] / Alt+→",
    reload: primaryLabel("R"),
    device: primaryLabel(isMac ? "⇧M" : "Shift+M"),
  }), [isMac, primaryLabel]);

  const currentSet = sets.find((set) => set.id === setId) ?? null;
  const windows = useMemo(() => currentSet?.windows ?? [], [currentSet]);

  useEffect(() => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    Promise.all([deck.info(), deck.load(), deck.devices().catch(() => null)]).then(async ([info, saved, devices]) => {
      const store = saved?.store;
      const openSetIds = saved?.openSetIds ?? [];
      const settings = store?.settings || {};
      const language = settings.lang || resolveLanguage(info.locale);
      const tr = translator(language);
      const startMode = settings.defaultMode || "grid";
      let list = Array.isArray(store?.sets) ? store.sets : [];
      const added = [];
      if (!list.length) added.push(makeSet(tr("defaultSetName"), DEFAULT_WINDOWS, startMode));
      list = [...list, ...added];
      let chosen = list.some((set) => set.id === saved?.setId) ? saved.setId : null;
      if (!chosen) chosen = list.find((set) => !openSetIds.includes(set.id))?.id ?? null;
      if (!chosen) {
        const extra = makeSet(tr("setN", { n: list.length + 1 }), [], startMode);
        added.push(extra);
        list = [...list, extra];
        chosen = extra.id;
      }
      if (added.length) await deck.applyStore({ put: added });
      if (chosen !== saved?.setId) await deck.claimSet(chosen);
      const current = list.find((set) => set.id === chosen);
      setsRef.current = list;
      setIdRef.current = chosen;
      openElsewhereRef.current = openSetIds;
      setSets(list);
      setSetId(chosen);
      setOpenElsewhere(openSetIds);
      setPlatform(info.platform);
      setAppVersion(info.version || "");
      setMode(current.mode || "grid");
      setFocusedId(current.focusedId || null);
      setActiveTabs(current.activeTabs || {});
      setSidebarExpanded(settings.sidebarOpen !== false);
      setDefaultMode(startMode);
      if (settings.defaultDevice) setDefaultDevice(settings.defaultDevice);
      if (!settings.tipsSeen) setSheet("tips");
      setCatalog(devices);
      setLang(language);
      setLoaded(true);
    });
  }, []);

  // Every change to the sets goes through here: it updates the screen, records
  // content changes for undo, and sends the main process only what changed.
  const commitSets = useCallback((next, { record: recordable = true } = {}) => {
    const prev = setsRef.current;
    if (next === prev) return;
    setsRef.current = next;
    setSets(next);
    if (recordable) historyRef.current = record(historyRef.current, diffSets(prev, next));
    const patch = storePatchBetween(prev, next);
    if (patch) deck.applyStore(patch);
  }, []);

  const setWindows = useCallback((update) => {
    const id = setIdRef.current;
    commitSets(setsRef.current.map((set) => (set.id === id ? { ...set, windows: update(set.windows) } : set)));
  }, [commitSets]);

  useEffect(() => {
    if (!loaded) return;
    const id = setIdRef.current;
    const current = setsRef.current.find((set) => set.id === id);
    if (!current || (current.mode === mode && current.focusedId === focusedId && current.activeTabs === activeTabs)) return;
    commitSets(setsRef.current.map((set) => (set.id === id ? { ...set, mode, focusedId, activeTabs } : set)), { record: false });
  }, [loaded, mode, focusedId, activeTabs, commitSets]);

  useEffect(() => {
    if (!loaded) return;
    deck.applyStore({ settings: { lang, sidebarOpen: sidebarExpanded, defaultMode, defaultDevice } });
  }, [loaded, lang, sidebarExpanded, defaultMode, defaultDevice]);

  // Another deck window changed the store. This window's own set stays as it
  // is here (only its name can change elsewhere), so an edit still on its way
  // to the main process is never rolled back.
  useEffect(() => {
    const unsubscribers = [
      deck.onStoreChanged((store) => {
        const mine = setsRef.current.find((set) => set.id === setIdRef.current);
        const incoming = store.sets.map((set) => (mine && set.id === mine.id ? { ...mine, name: set.name } : set));
        if (mine && !incoming.some((set) => set.id === mine.id)) incoming.push(mine);
        setsRef.current = incoming;
        setSets(incoming);
        if (store.settings?.lang) setLang(store.settings.lang);
        if (store.settings?.defaultMode) setDefaultMode(store.settings.defaultMode);
        if (store.settings?.defaultDevice) setDefaultDevice(store.settings.defaultDevice);
      }),
      deck.onDevicesChanged(setCatalog),
      deck.onOpenSets((ids) => {
        openElsewhereRef.current = ids;
        setOpenElsewhere(ids);
      }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    if (loaded) document.title = `${setLabel(currentSet)} — ${t("appTitle")}`;
  }, [loaded, currentSet, setLabel, t]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const deckPanes = useMemo(
    () => windows.filter((item) => item.visible !== false && urlList(item).length > 0),
    [windows]
  );
  const deckOrder = useMemo(() => deckPanes.map((item) => item.id), [deckPanes]);
  const devices = useMemo(() => catalog?.devices ?? [], [catalog]);
  const paneDevices = useMemo(() => {
    const map = {};
    for (const item of deckPanes) map[item.id] = paneDeviceOf(devices, item);
    return map;
  }, [deckPanes, devices]);
  const focusIndex = Math.max(0, deckOrder.indexOf(focusedId));
  const effectiveFocusId = deckOrder[focusIndex] ?? null;
  const rects = useMemo(
    () => computePaneRects({ count: deckPanes.length, mode, focusIndex }),
    [deckPanes.length, mode, focusIndex]
  );

  const noticeTimer = useRef(0);
  const showNotice = useCallback((message, { undoable = false } = {}) => {
    setNotice({ message, undoable, id: Date.now() });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), undoable ? UNDO_NOTICE_MS : NOTICE_MS);
  }, []);

  const measure = useCallback(() => {
    const list = [];
    for (const [id, element] of bodyRefs.current) {
      if (!element) continue;
      const box = element.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
      list.push({ id, bounds: { x: box.left, y: box.top, width: box.width, height: box.height, radius } });
    }
    return list;
  }, []);

  // Outside a snapshot transition (window resize, panes added) native views
  // follow the CSS transition by having their boxes streamed every frame.
  const followLayout = useCallback(() => {
    const until = performance.now() + LAYOUT_ANIMATION_MS;
    let frame;
    const step = () => {
      deck.setBounds(measure());
      if (performance.now() < until) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [measure]);

  // Live pages re-laying out every frame is what makes a resize judder. For a
  // layout change the panes animate still snapshots instead, and the pages
  // reappear once, already at their final size.
  const snapshotCache = useRef({});
  const transitionState = useRef({ ready: null, timer: 0 });
  const transition = useCallback(async (apply) => {
    if (!isElectron || prefersReducedMotion()) {
      apply();
      return;
    }
    const state = transitionState.current;
    if (!state.ready) {
      state.ready = (async () => {
        const capture = deck.snapshot().catch(() => ({})).then(async (taken) => {
          // A frame still decoding paints as an empty pane once the views hide.
          await Promise.all(Object.values(taken).map(({ src }) => {
            const image = new Image();
            image.src = src;
            return image.decode().catch(() => {});
          }));
          return taken;
        });
        const shots = await Promise.race([capture, wait(SNAPSHOT_TIMEOUT_MS).then(() => ({}))]);
        snapshotCache.current = { ...snapshotCache.current, ...shots };
        setSnapshots(snapshotCache.current);
        await nextFrame();
        await nextFrame();
        deck.setTransition(true);
      })();
    }
    await state.ready;
    apply();
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => {
      state.ready = null;
      deck.setBounds(measure());
      deck.setTransition(false);
      window.setTimeout(() => {
        if (!transitionState.current.ready) setSnapshots({});
      }, SNAPSHOT_LINGER_MS);
    }, LAYOUT_ANIMATION_MS);
  }, [measure]);

  // Commands can arrive faster than a transition starts; each one builds on
  // the layout the previous one asked for, not the one still on screen.
  const layoutRef = useRef(null);
  const pendingLayout = useRef(null);
  layoutRef.current = { mode, focusId: effectiveFocusId, sidebarExpanded, order: deckOrder };
  const changeLayout = useCallback((next) => {
    const current = pendingLayout.current ?? layoutRef.current;
    const target = { ...current, ...next };
    const count = current.order.length;
    const indexOf = (id) => Math.max(0, current.order.indexOf(id));
    const moves =
      target.sidebarExpanded !== current.sidebarExpanded ||
      layoutMoves(count, { mode: current.mode, focusIndex: indexOf(current.focusId) }, { mode: target.mode, focusIndex: indexOf(target.focusId) });
    const apply = () => {
      if (target.mode !== current.mode) setMode(target.mode);
      if (target.focusId !== current.focusId) setFocusedId(target.focusId);
      if (target.sidebarExpanded !== current.sidebarExpanded) setSidebarExpanded(target.sidebarExpanded);
      if (pendingLayout.current === target) pendingLayout.current = null;
    };
    if (!moves) {
      apply();
      return;
    }
    pendingLayout.current = target;
    transition(apply);
  }, [transition]);
  const currentLayout = () => pendingLayout.current ?? layoutRef.current;

  const overlayOpen = editor.open || sheet !== null;
  const overlayRef = useRef(overlayOpen);
  overlayRef.current = overlayOpen;
  // Pages come back only after the sheet has finished its close animation.
  useEffect(() => {
    if (overlayOpen) {
      deck.setOverlay(true);
      return undefined;
    }
    const timer = window.setTimeout(() => deck.setOverlay(false), SHEET_MS);
    return () => window.clearTimeout(timer);
  }, [overlayOpen]);

  // Tab titles, favicons and history follow their URL whenever a window's list
  // changes (editor, tab drag, close, undo), before the pages are told.
  const tabUrls = useRef({});
  useLayoutEffect(() => {
    const previous = tabUrls.current;
    const changed = [];
    tabUrls.current = {};
    for (const item of windows) {
      const urls = urlList(item);
      tabUrls.current[item.id] = urls;
      const before = previous[item.id];
      if (before && before.join("\n") !== urls.join("\n")) changed.push([item.id, before, urls]);
    }
    if (!changed.length) return;
    setPaneMeta((meta) => {
      let next = meta;
      for (const [id, before, after] of changed) if (next[id]) next = { ...next, [id]: metaByUrl(next[id], before, after) };
      return next;
    });
  }, [windows]);

  useLayoutEffect(() => {
    if (!loaded) return;
    const bounds = new Map(measure().map(({ id, bounds: box }) => [id, box]));
    deck.syncPanes(
      deckPanes.map((item, index) => ({
        id: item.id,
        urls: urlList(item),
        activeTab: activeTabs[item.id] ?? 0,
        visible: rects[index]?.visible ?? false,
        bounds: bounds.get(item.id),
        device: deviceForPane(paneDevices[item.id], item.device?.landscape),
      }))
    );
    return followLayout();
  }, [loaded, deckPanes, paneDevices, activeTabs, rects, sidebarExpanded, measure, followLayout]);

  useEffect(() => {
    const element = deckRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setDeckSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      deck.setBounds(measure());
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loaded, measure]);

  // Switching or closing tabs detaches the view that had keyboard focus, so
  // the newly shown tab takes it over. Undo and redo keep the keyboard in the
  // deck instead, so ⌘Z can be pressed again rather than landing in the page
  // that just came back.
  const keepShellFocusUntil = useRef(0);
  const focusedTabUrl = urlList(deckPanes.find((item) => item.id === effectiveFocusId))[activeTabs[effectiveFocusId] ?? 0];
  useEffect(() => {
    if (effectiveFocusId && performance.now() > keepShellFocusUntil.current) deck.focusPane(effectiveFocusId);
  }, [effectiveFocusId, mode, focusedTabUrl]);

  const focusPane = useCallback((id) => changeLayout({ focusId: id }), [changeLayout]);

  const spotlightPane = useCallback((id) => {
    const current = currentLayout();
    changeLayout({ focusId: id, mode: nextModeForSpotlight(current.mode, { targetIsFocused: id === current.focusId }) });
  }, [changeLayout]);

  const fillPane = useCallback((id) => {
    const current = currentLayout();
    changeLayout({ focusId: id, mode: current.mode === "fill" && id === current.focusId ? "grid" : "fill" });
  }, [changeLayout]);

  const setVisible = useCallback((id, visible) => {
    transition(() => {
      setWindows((list) => list.map((item) => (item.id === id ? { ...item, visible } : item)));
      if (visible) setFocusedId(id);
    });
  }, [transition, setWindows]);

  const hideWindow = useCallback((id) => {
    const item = windows.find((entry) => entry.id === id);
    if (!item) return;
    setVisible(id, false);
    showNotice(t("windowHiddenMsg", { name: item.name || t("untitledWindow") }), { undoable: true });
  }, [windows, setVisible, showNotice, t]);

  const toggleVisible = useCallback((id) => {
    const item = windows.find((entry) => entry.id === id);
    if (!item) return;
    if (item.visible === false) setVisible(id, true);
    else hideWindow(id);
  }, [windows, setVisible, hideWindow]);

  const setActiveTab = useCallback((paneId, tabIndex) => {
    setActiveTabs((tabs) => ({ ...tabs, [paneId]: tabIndex }));
  }, []);

  // Mobile preview is part of a window, so undo covers it like any other edit.
  const setPaneDevice = useCallback((id, update) => {
    transition(() => {
      setWindows((list) => list.map((item) => {
        if (item.id !== id) return item;
        const next = update(item.device ?? null);
        if (next) return { ...item, device: next };
        const { device, ...rest } = item;
        return rest;
      }));
    });
  }, [transition, setWindows]);

  const toggleDevice = useCallback((id) => {
    const fallback = findDevice(devices, defaultDevice)?.id ?? defaultDevice;
    transition(() => {
      setWindows((list) => list.map((item) => (item.id === id ? togglePaneDevice(item, fallback) : item)));
    });
  }, [transition, setWindows, devices, defaultDevice]);

  const addDevicePane = useCallback((id) => {
    const item = windows.find((entry) => entry.id === id);
    if (!item?.device || !devices.length) return;
    const tab = activeTabs[id] ?? 0;
    const url = paneMeta[id]?.[tab]?.url || urlList(item)[tab];
    const at = devices.findIndex((device) => device.id === item.device.id);
    const used = new Set(windows.filter((entry) => entry.device).map((entry) => entry.device.id));
    const next = [...devices.slice(at + 1), ...devices.slice(0, at + 1)].find((device) => !used.has(device.id)) ?? devices[(at + 1) % devices.length];
    const created = { id: `win-${Date.now()}`, name: next.name, urls: [url], visible: true, device: { id: next.id, landscape: false } };
    transition(() => {
      setWindows((list) => {
        const index = list.findIndex((entry) => entry.id === id);
        return [...list.slice(0, index + 1), created, ...list.slice(index + 1)];
      });
      setFocusedId(created.id);
    });
  }, [windows, devices, activeTabs, paneMeta, transition, setWindows]);

  // Ask AI ships no API key: it opens Claude or ChatGPT in a pane of the deck
  // with a guide to the app (and the question, if any) already filled in.
  const askAi = useCallback((service, question = "") => {
    const entries = paletteEntries(commandCatalog, { t: tEnglish, tEnglish, isMac });
    const prompt = featureGuide(entries, { language: LANGUAGE_NAMES[lang] ?? "English", groupLabel: (group) => tEnglish(GROUP_LABELS[group]), question });
    const name = t("askAiWindowName", { service: service === "claude" ? "Claude" : "ChatGPT" });
    transition(() => {
      setWindows((list) => {
        const existing = list.find((item) => item.id === ASK_AI_WINDOW);
        const next = { ...existing, id: ASK_AI_WINDOW, name, urls: [ASK_AI_URLS[service](prompt)], visible: true };
        return existing ? list.map((item) => (item.id === ASK_AI_WINDOW ? next : item)) : [...list, next];
      });
      setActiveTab(ASK_AI_WINDOW, 0);
      setFocusedId(ASK_AI_WINDOW);
    });
  }, [isMac, lang, t, transition, setWindows, setActiveTab]);

  const pickDevice = useCallback((id) => {
    const item = windows.find((entry) => entry.id === id);
    if (!item) return;
    if (!item.device) toggleDevice(id);
    window.setTimeout(() => {
      const select = document.querySelector(`[data-pane="${id}"] select`);
      if (!select) return;
      deck.focusShell();
      select.focus();
      try {
        select.showPicker?.();
      } catch {
        // showPicker needs a user gesture in some versions; focus alone still works.
      }
    }, item.device ? 0 : LAYOUT_ANIMATION_MS);
  }, [windows, toggleDevice]);

  const openField = useCallback((paneId, kind, value = "") => {
    if (!paneId) return;
    deck.focusShell();
    setField({ paneId, kind, value, token: Date.now() });
  }, []);

  const fieldRef = useRef(field);
  fieldRef.current = field;
  const closeField = useCallback(({ refocus = true } = {}) => {
    const current = fieldRef.current;
    if (!current) return;
    fieldRef.current = null;
    if (current.kind === "find") deck.stopFind(current.paneId);
    if (refocus) deck.focusPane(current.paneId);
    setField(null);
  }, []);

  const closeTab = useCallback((paneId, tabIndex) => {
    const item = windows.find((entry) => entry.id === paneId);
    if (!item) return;
    const urls = urlList(item);
    const remember = (entry) => {
      closedTabs.current = [...closedTabs.current, entry].slice(-CLOSED_TABS_KEPT);
    };
    // Like closing a window's last tab in Chrome, but the window stays in the
    // sidebar, so ⌘⇧T (or the eye toggle) brings it straight back.
    if (urls.length <= 1) {
      remember({ kind: "pane", paneId });
      setVisible(paneId, false);
      showNotice(t("paneClosedMsg", { name: item.name || t("untitledWindow"), key: primaryLabel("⇧T") }), { undoable: true });
      return;
    }
    remember({ kind: "tab", paneId, index: tabIndex, url: urls[tabIndex] });
    const closedTitle = paneMeta[paneId]?.[tabIndex]?.title || hostLabel(urls[tabIndex]);
    showNotice(t("tabClosedMsg", { name: closedTitle }), { undoable: true });
    setWindows((list) => list.map((entry) => (entry.id === paneId ? removeTab(entry, tabIndex) : entry)));
    const active = activeTabs[paneId] ?? 0;
    setActiveTab(paneId, tabIndex < active ? active - 1 : Math.min(active, urls.length - 2));
  }, [windows, activeTabs, paneMeta, setActiveTab, setVisible, setWindows, showNotice, t, primaryLabel]);

  // The tab strip and the window editor reorder the same urls list, so undo
  // covers both. The shown tab and the pages' titles follow their URL.
  const moveTabTo = useCallback((paneId, from, to) => {
    const item = windows.find((entry) => entry.id === paneId);
    const count = urlList(item).length;
    if (!item || from === to || from < 0 || to < 0 || from >= count || to >= count) return;
    setWindows((list) => list.map((entry) => (entry.id === paneId ? moveTab(entry, from, to) : entry)));
    setActiveTab(paneId, indexAfterMove(activeTabs[paneId] ?? 0, from, to));
  }, [windows, activeTabs, setActiveTab, setWindows]);

  const reopenTab = useCallback(() => {
    while (closedTabs.current.length) {
      const entry = closedTabs.current[closedTabs.current.length - 1];
      closedTabs.current = closedTabs.current.slice(0, -1);
      const item = windows.find((candidate) => candidate.id === entry.paneId);
      if (!item) continue;
      if (entry.kind === "pane") {
        if (item.visible === false) setVisible(item.id, true);
        else focusPane(item.id);
        return;
      }
      const count = urlList(item).length;
      const index = Math.min(entry.index, count);
      setWindows((list) => list.map((candidate) => (candidate.id === item.id ? insertTab(candidate, index, entry.url) : candidate)));
      setActiveTab(item.id, index);
      if (item.visible === false) setVisible(item.id, true);
      else focusPane(item.id);
      return;
    }
    showNotice(t("nothingToReopen"));
  }, [windows, setVisible, setWindows, focusPane, setActiveTab, showNotice, t]);

  const submitField = useCallback(({ backwards }) => {
    if (!field) return;
    const { paneId, kind, value } = field;
    if (kind === "find") {
      if (value) deck.find(paneId, value, { forward: !backwards, newSearch: false });
      return;
    }
    const url = addressToUrl(value);
    if (!url) {
      closeField();
      return;
    }
    if (kind === "address") {
      deck.navigate(paneId, "load", url);
    } else {
      const item = windows.find((entry) => entry.id === paneId);
      if (!item) return;
      const count = urlList(item).length;
      setWindows((list) => list.map((entry) => (entry.id === paneId ? insertTab(entry, count, url) : entry)));
      setActiveTab(paneId, count);
    }
    setField(null);
    // The new tab's page view is created on the next sync.
    window.setTimeout(() => deck.focusPane(paneId), 60);
  }, [field, windows, setWindows, setActiveTab, closeField]);

  const changeField = useCallback((value) => {
    setField((current) => (current ? { ...current, value } : current));
    if (field?.kind === "find") {
      lastFind.current[field.paneId] = value;
      deck.find(field.paneId, value, { forward: true, newSearch: true });
    }
  }, [field]);

  const zoomPane = useCallback(async (paneId, direction) => {
    const active = activeTabs[paneId] ?? 0;
    const current = paneMeta[paneId]?.[active]?.zoom ?? (await deck.getZoom(paneId));
    const applied = await deck.setZoom(paneId, stepZoom(current, direction));
    if (applied == null) return;
    setPaneMeta((meta) => ({ ...meta, [paneId]: { ...meta[paneId], [active]: { ...meta[paneId]?.[active], zoom: applied } } }));
    showNotice(t("zoomMsg", { percent: Math.round(applied * 100) }));
  }, [activeTabs, paneMeta, showNotice, t]);

  const applySet = useCallback((id) => {
    const target = setsRef.current.find((set) => set.id === id);
    if (!target) return;
    setIdRef.current = id;
    pendingLayout.current = null;
    setSetId(id);
    setMode(target.mode || "grid");
    setFocusedId(target.focusedId || null);
    setActiveTabs(target.activeTabs || {});
    setPaneErrors({});
    setFound({});
    setField(null);
  }, []);

  // A set open in another deck window brings that window forward instead.
  const switchSet = useCallback(async (id) => {
    if (!id || id === setIdRef.current || !setsRef.current.some((set) => set.id === id)) return;
    if (await deck.claimSet(id)) applySet(id);
  }, [applySet]);

  const createSet = useCallback(async (name, contents = []) => {
    const created = makeSet(name || t("setN", { n: setsRef.current.length + 1 }), contents, defaultMode);
    commitSets([...setsRef.current, created]);
    if (await deck.claimSet(created.id)) applySet(created.id);
    return created;
  }, [t, defaultMode, commitSets, applySet]);

  const renameSet = useCallback((id, name) => {
    commitSets(setsRef.current.map((set) => (set.id === id ? { ...set, name } : set)));
  }, [commitSets]);

  const duplicateSet = useCallback((id) => {
    const list = setsRef.current;
    const index = list.findIndex((set) => set.id === id);
    if (index < 0) return;
    const copy = { ...list[index], id: newSetId(), name: t("copyName", { name: setLabel(list[index]) }) };
    commitSets([...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
  }, [t, setLabel, commitSets]);

  const deleteSet = useCallback(async (id) => {
    const target = setsRef.current.find((set) => set.id === id);
    if (!target) return;
    if (openElsewhereRef.current.includes(id)) {
      showNotice(t("setCantDeleteOpen", { name: setLabel(target) }));
      return;
    }
    if (id === setIdRef.current) {
      const fallback = setsRef.current.find((set) => set.id !== id && !openElsewhereRef.current.includes(set.id));
      if (!fallback || !(await deck.claimSet(fallback.id))) {
        showNotice(t("setCantDeleteLast"));
        return;
      }
      applySet(fallback.id);
    }
    commitSets(setsRef.current.filter((set) => set.id !== id));
    showNotice(t("setDeletedMsg", { name: setLabel(target) }), { undoable: true });
  }, [t, setLabel, commitSets, applySet, showNotice]);

  const stepHistory = useCallback(async (direction) => {
    const step = direction === "undo" ? undo : redo;
    const result = step(historyRef.current, setsRef.current, new Set(openElsewhereRef.current));
    if (!result) {
      showNotice(t(direction === "undo" ? "nothingToUndo" : "nothingToRedo"));
      return;
    }
    historyRef.current = result.history;
    keepShellFocusUntil.current = performance.now() + LAYOUT_ANIMATION_MS;
    const windowsBefore = setsRef.current.find((set) => set.id === setIdRef.current)?.windows ?? [];
    commitSets(result.sets, { record: false });
    const windowsAfter = result.sets.find((set) => set.id === setIdRef.current)?.windows ?? [];
    setActiveTabs((tabs) => {
      let next = tabs;
      for (const item of windowsAfter) {
        const before = urlList(windowsBefore.find((candidate) => candidate.id === item.id));
        const shown = before[tabs[item.id] ?? 0];
        const at = urlList(item).indexOf(shown);
        if (at >= 0 && at !== (tabs[item.id] ?? 0)) next = { ...next, [item.id]: at };
      }
      return next;
    });
    const touched = Object.keys(result.entry.sets);
    const elsewhere = touched.length === 1 && touched[0] !== setIdRef.current ? result.sets.find((set) => set.id === touched[0]) : null;
    showNotice(direction === "redo" ? t("redoneMsg") : elsewhere ? t("undoneInSetMsg", { name: setLabel(elsewhere) }) : t("undoneMsg"));
    if (!result.sets.some((set) => set.id === setIdRef.current)) {
      const fallback = result.sets.find((set) => !openElsewhereRef.current.includes(set.id));
      if (fallback && (await deck.claimSet(fallback.id))) applySet(fallback.id);
    }
  }, [t, setLabel, commitSets, applySet, showNotice]);

  const stepHistoryRef = useRef(stepHistory);
  stepHistoryRef.current = stepHistory;
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.altKey) return;
      const primary = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (!primary) return;
      if (isMac && !event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        if (overlayRef.current || isEditable(event.target)) return;
        event.preventDefault();
        runCommandRef.current(event.key === "ArrowLeft" ? "page-back" : "page-forward");
        return;
      }
      const undoKey = event.code === "KeyZ" && !event.shiftKey;
      const redoKey = (event.code === "KeyZ" && event.shiftKey) || (!isMac && event.code === "KeyY" && !event.shiftKey);
      if ((!undoKey && !redoKey) || overlayRef.current || isEditable(event.target)) return;
      event.preventDefault();
      stepHistoryRef.current(undoKey ? "undo" : "redo");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMac]);

  const importBackup = useCallback(async () => {
    const file = await deck.importBackup();
    if (!file) return;
    try {
      const imported = parseExtensionExport(file.text);
      if (!imported.length) throw new Error("empty");
      const ids = new Set(setsRef.current.find((set) => set.id === setIdRef.current)?.windows.map((item) => item.id));
      const added = imported.filter((item) => !ids.has(item.id));
      setWindows((list) => [...list, ...added]);
      showNotice(t("importedMsg", { count: added.length }), { undoable: added.length > 0 });
    } catch {
      showNotice(t("importFailedMsg"));
    }
  }, [setWindows, showNotice, t]);

  const pasteWindows = useCallback(async ({ windows: pasted, newSetName }) => {
    if (newSetName) {
      const created = await createSet(newSetName, pasted);
      setFocusedId(pasted.find((item) => item.visible !== false)?.id ?? null);
      showNotice(t("pastedMsg", { count: pasted.length }), { undoable: Boolean(created) });
      return;
    }
    const ids = new Set(setsRef.current.find((set) => set.id === setIdRef.current)?.windows.map((item) => item.id));
    const stamp = Date.now();
    const fresh = pasted.map((item, index) => (ids.has(item.id) ? { ...item, id: `win-${stamp}-${index}` } : item));
    setWindows((list) => [...list, ...fresh]);
    const first = fresh.find((item) => item.visible !== false);
    if (first) setFocusedId(first.id);
    showNotice(t("pastedMsg", { count: fresh.length }), { undoable: true });
  }, [createSet, setWindows, showNotice, t]);

  const moveWindow = useCallback((id, toIndex) => {
    setWindows((list) => {
      const from = list.findIndex((item) => item.id === id);
      if (from < 0) return list;
      let to = Math.max(0, Math.min(toIndex, list.length));
      if (to > from) to -= 1;
      if (to === from) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, [setWindows]);

  const runCommand = useCallback((command) => {
    if (command === "deck-undo" || command === "deck-redo") {
      if (!overlayOpen) stepHistory(command === "deck-undo" ? "undo" : "redo");
      return;
    }
    // ⌘K / F1 also switches from another sheet to the palette, and closes it again.
    if (command === "open-palette") {
      if (editor.open) return;
      deck.focusShell();
      setSheet((current) => (current === "palette" ? null : "palette"));
      return;
    }
    if (overlayOpen) return;
    // The key may come from a page, which keeps the keyboard until the shell takes it back.
    if (SHEET_COMMANDS.has(command)) deck.focusShell();
    const count = deckOrder.length;
    const current = currentLayout();
    const paneId = current.focusId;
    const focusedItem = windows.find((item) => item.id === paneId);
    const tabCount = urlList(focusedItem).length;
    const activeTab = paneId ? activeTabs[paneId] ?? 0 : 0;
    const currentIndex = Math.max(0, deckOrder.indexOf(paneId));

    if (command === "toggle-spotlight") {
      if (count) changeLayout({ mode: nextModeForSpotlight(current.mode) });
    } else if (command === "restore-home") {
      changeLayout({ mode: "grid" });
    } else if (command === "toggle-fullscreen") {
      if (count) changeLayout({ mode: current.mode === "fill" ? "grid" : "fill" });
    } else if (command === "focus-next" || command === "focus-previous") {
      if (count) changeLayout({ focusId: deckOrder[cycleIndex(currentIndex, count, command === "focus-next" ? 1 : -1)] });
    } else if (command.startsWith("focus-tile-")) {
      const target = deckOrder[Number(command.slice("focus-tile-".length)) - 1];
      if (target) changeLayout({ focusId: target });
    } else if (command === "toggle-sidebar") {
      changeLayout({ sidebarExpanded: !current.sidebarExpanded });
    } else if (command === "tab-new") {
      if (paneId) openField(paneId, "new");
      else setEditor({ open: true, item: null });
    } else if (command === "tab-close") {
      if (paneId) closeTab(paneId, activeTab);
    } else if (command === "tab-reopen") {
      reopenTab();
    } else if (command === "tab-next" || command === "tab-previous") {
      if (tabCount > 1) setActiveTab(paneId, cycleIndex(activeTab, tabCount, command === "tab-next" ? 1 : -1));
    } else if (command === "tab-move-left" || command === "tab-move-right") {
      if (paneId) moveTabTo(paneId, activeTab, activeTab + (command === "tab-move-left" ? -1 : 1));
    } else if (/^tab-\d$/.test(command)) {
      const target = tabForNumber(Number(command.slice(4)), tabCount);
      if (target != null) setActiveTab(paneId, target);
    } else if (command === "address-focus") {
      if (paneId) openField(paneId, "address", paneMeta[paneId]?.[activeTab]?.url || urlList(focusedItem)[activeTab] || "");
    } else if (command === "find") {
      if (paneId) openField(paneId, "find", lastFind.current[paneId] || "");
    } else if (command === "page-back" || command === "page-forward") {
      if (paneId) deck.navigate(paneId, command === "page-back" ? "back" : "forward");
    } else if (command === "reload-pane" || command === "reload-hard") {
      if (paneId) deck.navigate(paneId, command === "reload-pane" ? "reload" : "reload-hard");
    } else if (command === "zoom-in" || command === "zoom-out" || command === "zoom-reset") {
      if (paneId) zoomPane(paneId, command === "zoom-in" ? 1 : command === "zoom-out" ? -1 : 0);
    } else if (/^set-\d$/.test(command)) {
      switchSet(setsRef.current[Number(command.slice(4)) - 1]?.id);
    } else if (command === "sets-open") {
      setSheet("sets");
    } else if (command === "open-settings") {
      setSheet("settings");
    } else if (command === "open-shortcuts") {
      setSheet("shortcuts");
    } else if (command === "paste-list") {
      setSheet("paste");
    } else if (command === "import-backup") {
      importBackup();
    } else if (command === "device-toggle") {
      if (paneId) toggleDevice(paneId);
    } else if (command === "device-pick") {
      if (paneId) pickDevice(paneId);
    } else if (command === "device-rotate" || command === "device-add") {
      if (!focusedItem) return;
      if (!focusedItem.device) toggleDevice(paneId);
      else if (command === "device-add") addDevicePane(paneId);
      else setPaneDevice(paneId, (device) => ({ ...device, landscape: !device?.landscape }));
    } else if (command === "hide-pane") {
      if (paneId) hideWindow(paneId);
    } else if (command === "edit-window") {
      if (focusedItem) setEditor({ open: true, item: focusedItem });
    } else if (command === "add-window") {
      setEditor({ open: true, item: null });
    } else if (command === "show-tips") {
      setSheet("tips");
    } else if (command === "check-updates") {
      deck.checkForUpdates();
    } else if (command === "signin-google") {
      deck.googleSignIn();
    } else if (command === "new-window") {
      deck.openWindow();
    } else if (command === "ask-ai-claude" || command === "ask-ai-chatgpt") {
      askAi(command === "ask-ai-claude" ? "claude" : "chatgpt");
    }
  }, [overlayOpen, editor.open, deckOrder, windows, activeTabs, paneMeta, changeLayout, openField, closeTab, reopenTab, setActiveTab, moveTabTo, zoomPane, stepHistory, switchSet, importBackup, toggleDevice, pickDevice, addDevicePane, setPaneDevice, hideWindow, askAi]);

  const runCommandRef = useRef(runCommand);
  runCommandRef.current = runCommand;
  const focusPaneRef = useRef(focusPane);
  focusPaneRef.current = focusPane;

  useEffect(() => {
    const unsubscribers = [
      deck.onCommand((command) => runCommandRef.current(command)),
      deck.onPaneFocused(({ paneId }) => focusPaneRef.current(paneId)),
      deck.onPaneState(({ paneId, tabIndex, ...state }) => {
        setPaneMeta((meta) => ({ ...meta, [paneId]: { ...meta[paneId], [tabIndex]: state } }));
        if (state.loading) setPaneErrors((errors) => (errors[paneId] ? { ...errors, [paneId]: null } : errors));
      }),
      deck.onPaneError(({ paneId, tabIndex, description, url }) => {
        setPaneErrors((errors) => ({ ...errors, [paneId]: { tabIndex, description, url } }));
      }),
      deck.onFound(({ paneId, active, matches }) => setFound((list) => ({ ...list, [paneId]: { active, matches } }))),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  // Background checks stay silent; a check started from the menu or the
  // shortcuts sheet reports its outcome in the title bar.
  useEffect(() => deck.onUpdateState(({ status, version, manual }) => {
    if (status === "ready") setUpdateReady(version);
    if (!manual) return;
    if (status === "checking") showNotice(t("updateChecking"));
    else if (status === "downloading" && version) showNotice(t("updateDownloading", { version }));
    else if (status === "current") showNotice(t("updateCurrent", { version }));
    else if (status === "error") showNotice(t("updateFailed"));
  }), [t, showNotice]);

  useEffect(() => deck.onGoogleSignIn(({ status, reloaded }) => {
    if (status === "signed-in") showNotice(t("googleSignedInMsg", { count: reloaded ?? 0 }));
    else if (status === "signed-out") showNotice(t("googleSignedOutMsg"));
    else if (status === "rejected") showNotice(t("googleRejectedMsg"));
  }), [t, showNotice]);

  const favicons = useMemo(() => {
    const icons = {};
    for (const item of windows) icons[item.id] = paneMeta[item.id]?.[activeTabs[item.id] ?? 0]?.favicon || null;
    return icons;
  }, [windows, paneMeta, activeTabs]);

  const saveWindow = ({ id, name, urls }) => {
    if (id) {
      const before = urlList(windows.find((item) => item.id === id));
      const after = urlList({ urls });
      const shown = before[activeTabs[id] ?? 0];
      setWindows((list) => list.map((item) => (item.id === id ? { ...item, name, urls } : item)));
      const at = after.indexOf(shown);
      if (at >= 0 && at !== (activeTabs[id] ?? 0)) setActiveTab(id, at);
    } else {
      const created = { id: `win-${Date.now()}`, name, urls, visible: true };
      setWindows((list) => [...list, created]);
      setFocusedId(created.id);
    }
  };

  const deleteWindow = (id) => {
    const item = windows.find((entry) => entry.id === id);
    if (!item) return;
    setWindows((list) => list.filter((entry) => entry.id !== id));
    showNotice(t("windowDeletedMsg", { name: item.name || t("untitledWindow") }), { undoable: true });
  };

  const paletteItems = useMemo(
    () => paletteEntries(commandCatalog, { t, tEnglish, isMac, hasPane: Boolean(effectiveFocusId) }),
    [t, isMac, effectiveFocusId]
  );

  if (!loaded) return <div className="h-full bg-ink" aria-busy="true" />;

  const closeSheet = () => setSheet(null);
  const focusedName = effectiveFocusId ? windows.find((item) => item.id === effectiveFocusId)?.name || t("untitledWindow") : "";

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className={`app-drag flex h-14 shrink-0 items-center gap-4 pr-3 ${isMac ? "pl-20" : "pl-4"}`}>
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="deck-display shrink-0 text-lg">{t("appTitle")}</h1>
          <span className="hidden truncate text-xs text-ink-mute lg:inline">{t("appSubtitle")}</span>
        </div>

        {/* Page views are drawn above the DOM, so messages live in the title bar, not over the deck. */}
        <div aria-live="polite" aria-atomic="true" className="app-no-drag flex min-w-0 items-center">
          {notice && (
            <div key={notice.id} className="cie-pop flex min-w-0 items-center gap-1 rounded-pill bg-paper py-1 pl-3 pr-1 text-ink">
              <span className="register truncate py-0.5 uppercase">{notice.message}</span>
              {notice.undoable ? (
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    stepHistory("undo");
                  }}
                  className="register cie-tap ink-swap flex shrink-0 items-center gap-1 rounded-pill bg-ink px-2.5 py-0.5 uppercase text-paper hover:bg-ink/85"
                >
                  <Undo2 className="h-3 w-3" aria-hidden="true" />
                  {t("undo")}
                </button>
              ) : (
                <span className="w-2" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="app-no-drag ml-auto flex items-center gap-2">
          {updateReady && (
            <button
              type="button"
              onClick={() => deck.installUpdate()}
              className="cie-chip cie-pop ink-swap bg-paper text-ink hover:bg-paper/85"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {t("updateReady", { version: updateReady })}
            </button>
          )}

          <IconButton
            onClick={() => changeLayout({ sidebarExpanded: !currentLayout().sidebarExpanded })}
            pressed={sidebarExpanded}
            aria-label={t("sidebarToggle")}
            title={`${t("sidebarToggle")} (${keyLabel("B")})`}
          >
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          <div role="radiogroup" aria-label={t("modeLabel")} className="flex items-center gap-1">
            {MODE_OPTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => changeLayout({ mode: id })}
                className={`cie-chip ink-swap ${mode === id ? "bg-paper text-ink hover:bg-paper" : ""}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSheet("palette")}
            aria-keyshortcuts={isMac ? "Meta+K F1" : "Control+K F1"}
            title={`${t("paletteTitle")} (${primaryLabel("K")})`}
            className="cie-chip ink-swap"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            {t("paletteButton")}
            <kbd className="key border-ink-edge text-paper" aria-hidden="true">{primaryLabel("K")}</kbd>
          </button>

          <IconButton onClick={() => setSheet("shortcuts")} aria-label={t("shortcuts")} title={t("shortcuts")}>
            <Keyboard className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton onClick={() => setSheet("settings")} aria-label={t("settings")} title={`${t("settings")} (${primaryLabel(",")})`}>
            <Settings className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          t={t}
          collapsed={!sidebarExpanded}
          windows={windows}
          deckOrder={deckOrder}
          focusedId={effectiveFocusId}
          favicons={favicons}
          switcher={{
            sets,
            currentSetId: setId,
            openElsewhere,
            setLabel,
            onSwitchSet: switchSet,
            onOpenSets: () => setSheet("sets"),
            setsKey: keyLabel("S"),
          }}
          onAdd={() => setEditor({ open: true, item: null })}
          onEdit={(item) => setEditor({ open: true, item })}
          onDelete={deleteWindow}
          onToggleVisible={toggleVisible}
          onFocus={focusPane}
          onReveal={(id) => setVisible(id, true)}
          onMove={moveWindow}
          onExpand={() => changeLayout({ sidebarExpanded: true })}
          expandLabel={`${t("sidebarExpand")} (${keyLabel("B")})`}
        />

        <main className="relative min-w-0 flex-1 pb-2 pl-1 pr-2">
          <div ref={deckRef} className="relative h-full w-full">
            {deckPanes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-block border border-dashed border-paper/20 text-center">
                <p className="deck-display text-2xl">{t("emptyDeck")}</p>
                <p className="text-sm text-ink-mute">{t("emptyDeckHint")}</p>
              </div>
            ) : (
              deckPanes.map((item, index) => {
                const rect = rects[index];
                const paneField = field?.paneId === item.id ? field : null;
                return (
                  <Pane
                    key={item.id}
                    ref={(element) => {
                      if (element) bodyRefs.current.set(item.id, element);
                      else bodyRefs.current.delete(item.id);
                    }}
                    t={t}
                    item={item}
                    urls={urlList(item)}
                    index={index}
                    rect={rect}
                    mode={mode}
                    focused={item.id === effectiveFocusId}
                    compact={rect.w * deckSize.width < COMPACT_PANE_PX}
                    activeTab={activeTabs[item.id] ?? 0}
                    meta={paneMeta[item.id]}
                    error={paneErrors[item.id]}
                    snapshot={snapshots[item.id]}
                    field={paneField}
                    found={found[item.id]}
                    device={paneDevices[item.id]}
                    devices={devices}
                    keys={paneKeys}
                    onToggleDevice={() => toggleDevice(item.id)}
                    onDeviceChange={(deviceId) => setPaneDevice(item.id, (current) => ({ ...current, id: deviceId }))}
                    onRotateDevice={() => setPaneDevice(item.id, (current) => ({ ...current, landscape: !current?.landscape }))}
                    onAddDevice={() => addDevicePane(item.id)}
                    onHeaderClick={() => spotlightPane(item.id)}
                    onSelectTab={(tabIndex) => {
                      setActiveTab(item.id, tabIndex);
                      focusPane(item.id);
                    }}
                    onCloseTab={(tabIndex) => closeTab(item.id, tabIndex)}
                    onMoveTab={(from, to) => moveTabTo(item.id, from, to)}
                    onNewTab={() => {
                      focusPane(item.id);
                      openField(item.id, "new");
                    }}
                    onNavigate={(action) => deck.navigate(item.id, action)}
                    onSpotlight={() => spotlightPane(item.id)}
                    onFill={() => fillPane(item.id)}
                    onHide={() => hideWindow(item.id)}
                    onResetZoom={() => zoomPane(item.id, 0)}
                    onFieldChange={changeField}
                    onFieldSubmit={submitField}
                    onFieldCancel={(options) => closeField(options)}
                  />
                );
              })
            )}
          </div>
        </main>
      </div>

      <WindowEditor
        t={t}
        open={editor.open}
        item={editor.item}
        onClose={() => setEditor((current) => ({ ...current, open: false }))}
        onSave={saveWindow}
        onPasteList={() => {
          setEditor((current) => ({ ...current, open: false }));
          setSheet("paste");
        }}
      />

      <PasteListSheet t={t} open={sheet === "paste"} currentSetName={setLabel(currentSet)} onClose={closeSheet} onSubmit={pasteWindows} />

      <SettingsSheet
        t={t}
        open={sheet === "settings"}
        onClose={closeSheet}
        lang={lang}
        onLang={setLang}
        defaultMode={defaultMode}
        onDefaultMode={setDefaultMode}
        modeOptions={MODE_OPTIONS}
        devices={devices}
        devicesUpdated={catalog?.updated || ""}
        defaultDevice={findDevice(devices, defaultDevice)?.id ?? defaultDevice}
        onDefaultDevice={setDefaultDevice}
        appVersion={appVersion}
        keys={{ sets: keyLabel("S") }}
        onPasteList={() => setSheet("paste")}
        onImport={() => {
          closeSheet();
          importBackup();
        }}
        onManageSets={() => setSheet("sets")}
        onShortcuts={() => setSheet("shortcuts")}
        onCheckUpdates={() => {
          closeSheet();
          deck.checkForUpdates();
        }}
      />

      <SetsSheet
        t={t}
        open={sheet === "sets"}
        onClose={closeSheet}
        sets={sets}
        currentSetId={setId}
        openElsewhere={openElsewhere}
        setLabel={setLabel}
        setKey={setKeyLabel}
        newWindowKey={primaryLabel("N")}
        onSwitch={switchSet}
        onCreate={(name) => createSet(name).then((created) => created && showNotice(t("setCreatedMsg", { name: created.name }), { undoable: true }))}
        onRename={renameSet}
        onDuplicate={duplicateSet}
        onDelete={deleteSet}
        onOpenWindow={(id) => deck.openWindow(id)}
      />

      <ShortcutsSheet t={t} open={sheet === "shortcuts"} onClose={closeSheet} isMac={isMac} />

      <CommandPalette
        t={t}
        open={sheet === "palette"}
        onClose={closeSheet}
        entries={paletteItems}
        groups={commandCatalog.groups}
        groupLabel={(group) => t(GROUP_LABELS[group])}
        targetName={focusedName}
        onRun={(id) => {
          closeSheet();
          window.setTimeout(() => runCommandRef.current(id), 0);
        }}
        onAskAi={(question) => {
          closeSheet();
          askAi("claude", question);
        }}
      />

      <TipsSheet
        t={t}
        open={sheet === "tips"}
        onClose={() => {
          closeSheet();
          deck.applyStore({ settings: { tipsSeen: true } });
        }}
        keys={{ palette: primaryLabel("K"), device: paneKeys.device, back: paneKeys.back, spotlight: keyLabel("X") }}
      />
    </div>
  );
}
