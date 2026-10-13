import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Download, Keyboard, LayoutGrid, Maximize2, PanelLeft, Expand } from "lucide-react";
import { Sheet, SHEET_MS } from "@desktop/components/ui/Sheet";
import { Button, IconButton } from "@desktop/components/ui/controls";
import { Pane } from "@desktop/components/Pane";
import { Sidebar } from "@desktop/components/Sidebar";
import { WindowEditor } from "@desktop/components/WindowEditor";
import { deck, isElectron } from "@desktop/lib/bridge";
import { DEFAULT_WINDOWS, parseExtensionExport, urlList } from "@desktop/lib/deck-data";
import { computePaneRects, cycleIndex, layoutMoves, nextModeForSpotlight } from "@desktop/lib/pane-layout";
import { addressToUrl, insertTab, removeTab, stepZoom, tabForNumber } from "@desktop/lib/tabs";
import { LANGUAGES, resolveLanguage, translator } from "@desktop/lib/strings";

// --cie-t-move (360ms) for the .deck-pane transition, plus a few frames of slack.
const LAYOUT_ANIMATION_MS = 420;
// A layout change waits at most this long for page snapshots before animating.
const SNAPSHOT_TIMEOUT_MS = 160;
// Snapshots stay under the live pages briefly so a page that repaints late never shows a gap.
const SNAPSHOT_LINGER_MS = 160;
const COMPACT_PANE_PX = 380;
const CLOSED_TABS_KEPT = 25;

const MODE_OPTIONS = [
  { id: "grid", icon: LayoutGrid, label: "modeGrid" },
  { id: "spotlight", icon: Maximize2, label: "modeSpotlight" },
  { id: "fill", icon: Expand, label: "modeFill" },
];

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function App() {
  const [loaded, setLoaded] = useState(false);
  const [platform, setPlatform] = useState("browser");
  const [appVersion, setAppVersion] = useState("");
  const [updateReady, setUpdateReady] = useState(null);
  const [windows, setWindows] = useState([]);
  const [mode, setMode] = useState("grid");
  const [focusedId, setFocusedId] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [lang, setLang] = useState("ja");
  const [activeTabs, setActiveTabs] = useState({});
  const [paneMeta, setPaneMeta] = useState({});
  const [paneErrors, setPaneErrors] = useState({});
  const [editor, setEditor] = useState({ open: false, item: null });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deckSize, setDeckSize] = useState({ width: 0, height: 0 });
  const [snapshots, setSnapshots] = useState({});
  const [field, setField] = useState(null);
  const [found, setFound] = useState({});

  const deckRef = useRef(null);
  const bodyRefs = useRef(new Map());
  const closedTabs = useRef([]);
  const lastFind = useRef({});
  const t = useMemo(() => translator(lang), [lang]);
  const isMac = platform === "darwin";
  const keyLabel = useCallback((key) => (isMac ? `⌥${key}` : `Alt+${key}`), [isMac]);
  const primaryLabel = useCallback((key) => (isMac ? `⌘${key}` : `Ctrl+${key}`), [isMac]);

  useEffect(() => {
    Promise.all([deck.info(), deck.load()]).then(([info, saved]) => {
      setPlatform(info.platform);
      setAppVersion(info.version || "");
      const settings = saved?.settings || {};
      setWindows(Array.isArray(saved?.windows) ? saved.windows : DEFAULT_WINDOWS);
      setMode(settings.mode || "grid");
      setFocusedId(settings.focusedId || null);
      setSidebarExpanded(settings.sidebarOpen !== false);
      setActiveTabs(settings.activeTabs || {});
      setLang(settings.lang || resolveLanguage(info.locale));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    deck.save({ version: 1, windows, settings: { mode, focusedId, sidebarOpen: sidebarExpanded, activeTabs, lang } });
  }, [loaded, windows, mode, focusedId, sidebarExpanded, activeTabs, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const deckPanes = useMemo(
    () => windows.filter((item) => item.visible !== false && urlList(item).length > 0),
    [windows]
  );
  const deckOrder = useMemo(() => deckPanes.map((item) => item.id), [deckPanes]);
  const focusIndex = Math.max(0, deckOrder.indexOf(focusedId));
  const effectiveFocusId = deckOrder[focusIndex] ?? null;
  const rects = useMemo(
    () => computePaneRects({ count: deckPanes.length, mode, focusIndex }),
    [deckPanes.length, mode, focusIndex]
  );

  const noticeTimer = useRef(0);
  const showNotice = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
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

  const overlayOpen = editor.open || shortcutsOpen;
  // Pages come back only after the sheet has finished its close animation.
  useEffect(() => {
    if (overlayOpen) {
      deck.setOverlay(true);
      return undefined;
    }
    const timer = window.setTimeout(() => deck.setOverlay(false), SHEET_MS);
    return () => window.clearTimeout(timer);
  }, [overlayOpen]);

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
      }))
    );
    return followLayout();
  }, [loaded, deckPanes, activeTabs, rects, sidebarExpanded, measure, followLayout]);

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
  // the newly shown tab takes it over.
  const focusedTabUrl = urlList(deckPanes.find((item) => item.id === effectiveFocusId))[activeTabs[effectiveFocusId] ?? 0];
  useEffect(() => {
    if (effectiveFocusId) deck.focusPane(effectiveFocusId);
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
  }, [transition]);

  const toggleVisible = useCallback((id) => {
    const item = windows.find((entry) => entry.id === id);
    if (item) setVisible(id, item.visible === false);
  }, [windows, setVisible]);

  const setActiveTab = useCallback((paneId, tabIndex) => {
    setActiveTabs((tabs) => ({ ...tabs, [paneId]: tabIndex }));
  }, []);

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
      showNotice(t("paneClosedMsg", { name: item.name || t("untitledWindow"), key: primaryLabel("⇧T") }));
      return;
    }
    remember({ kind: "tab", paneId, index: tabIndex, url: urls[tabIndex] });
    setWindows((list) => list.map((entry) => (entry.id === paneId ? removeTab(entry, tabIndex) : entry)));
    const active = activeTabs[paneId] ?? 0;
    setActiveTab(paneId, tabIndex < active ? active - 1 : Math.min(active, urls.length - 2));
    const shift = (byTab = {}) => {
      const next = {};
      for (const [key, value] of Object.entries(byTab)) {
        const index = Number(key);
        if (index < tabIndex) next[index] = value;
        else if (index > tabIndex) next[index - 1] = value;
      }
      return next;
    };
    setPaneMeta((meta) => (meta[paneId] ? { ...meta, [paneId]: shift(meta[paneId]) } : meta));
  }, [windows, activeTabs, setActiveTab, setVisible, showNotice, t, primaryLabel]);

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
  }, [windows, setVisible, focusPane, setActiveTab, showNotice, t]);

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
  }, [field, windows, setActiveTab, closeField]);

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

  const runCommand = useCallback((command) => {
    if (overlayOpen) return;
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
    }
  }, [overlayOpen, deckOrder, windows, activeTabs, paneMeta, changeLayout, openField, closeTab, reopenTab, setActiveTab, zoomPane]);

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

  const favicons = useMemo(() => {
    const icons = {};
    for (const item of windows) icons[item.id] = paneMeta[item.id]?.[activeTabs[item.id] ?? 0]?.favicon || null;
    return icons;
  }, [windows, paneMeta, activeTabs]);

  const saveWindow = ({ id, name, urls }) => {
    if (id) {
      setWindows((list) => list.map((item) => (item.id === id ? { ...item, name, urls } : item)));
    } else {
      const created = { id: `win-${Date.now()}`, name, urls, visible: true };
      setWindows((list) => [...list, created]);
      setFocusedId(created.id);
    }
  };

  const deleteWindow = (id) => setWindows((list) => list.filter((item) => item.id !== id));

  const importBackup = async () => {
    const file = await deck.importBackup();
    if (!file) return;
    try {
      const imported = parseExtensionExport(file.text);
      if (!imported.length) throw new Error("empty");
      const ids = new Set(windows.map((item) => item.id));
      const added = imported.filter((item) => !ids.has(item.id));
      setWindows((list) => [...list, ...added]);
      showNotice(t("importedMsg", { count: added.length }));
    } catch {
      showNotice(t("importFailedMsg"));
    }
  };

  if (!loaded) return <div className="h-full bg-ink" aria-busy="true" />;

  const shortcutGroups = [
    {
      title: "kbGroupDeck",
      rows: [
        ["kbSpotlight", [keyLabel("X")]],
        ["kbHome", [keyLabel("Z")]],
        ["kbFill", [keyLabel("Q")]],
        ["kbFocus", [keyLabel("1"), "–", keyLabel("8")]],
        ["kbCycle", [keyLabel("Tab"), keyLabel("⇧Tab")]],
        ["kbSidebar", [keyLabel("B")]],
      ],
    },
    {
      title: "kbGroupTabs",
      rows: [
        ["kbNewTab", [primaryLabel("T")]],
        ["kbCloseTab", [primaryLabel("W")]],
        ["kbReopenTab", [primaryLabel("⇧T")]],
        ["kbNextTab", [isMac ? "⌃Tab" : "Ctrl+Tab", isMac ? "⌃⇧Tab" : "Ctrl+Shift+Tab"]],
        ["kbJumpTab", [primaryLabel("1"), "–", primaryLabel("8")]],
        ["kbLastTab", [primaryLabel("9")]],
      ],
    },
    {
      title: "kbGroupPage",
      rows: [
        ["kbAddress", [primaryLabel("L")]],
        ["kbFind", [primaryLabel("F")]],
        ["kbBackForward", [primaryLabel("["), primaryLabel("]")]],
        ["kbReload", [primaryLabel("R"), primaryLabel("⇧R")]],
        ["kbZoom", [primaryLabel("+"), primaryLabel("−"), primaryLabel("0")]],
      ],
    },
  ];
  const mouseRows = [
    ["mouseForward", isMac ? "⌥Tab" : "Alt+Tab"],
    ["mouseBack", isMac ? "⌥⇧Tab" : "Alt+Shift+Tab"],
    ["mouseGesture", `${keyLabel("X")} / ${keyLabel("Z")}`],
    ["mouseTop", keyLabel("Q")],
  ];

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className={`app-drag flex h-14 shrink-0 items-center gap-4 pr-3 ${isMac ? "pl-20" : "pl-4"}`}>
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="shrink-0 text-lg font-light tracking-[-0.03em]">{t("appTitle")}</h1>
          <span className="hidden truncate text-xs text-ink-mute lg:inline">{t("appSubtitle")}</span>
        </div>

        {/* Page views are drawn above the DOM, so messages live in the title bar, not over the deck. */}
        <div aria-live="polite" aria-atomic="true" className="min-w-0">
          {notice && <div className="cie-pop register truncate rounded-pill bg-paper px-3 py-1.5 uppercase text-ink">{notice}</div>}
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
            onClick={() => setShortcutsOpen(true)}
            aria-label={t("shortcuts")}
            title={t("shortcuts")}
            className="cie-chip"
          >
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
            {keyLabel("X")}
          </button>

          <select
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            aria-label={t("languageLabel")}
            className="cie-chip cursor-pointer appearance-none border-0 text-paper focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code} className="bg-ink text-paper">{label}</option>
            ))}
          </select>
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
          onAdd={() => setEditor({ open: true, item: null })}
          onEdit={(item) => setEditor({ open: true, item })}
          onDelete={deleteWindow}
          onToggleVisible={toggleVisible}
          onFocus={focusPane}
          onReveal={(id) => setVisible(id, true)}
          onImport={importBackup}
          onExpand={() => changeLayout({ sidebarExpanded: true })}
          expandLabel={`${t("sidebarExpand")} (${keyLabel("B")})`}
        />

        <main className="relative min-w-0 flex-1 pb-2 pl-1 pr-2">
          <div ref={deckRef} className="relative h-full w-full">
            {deckPanes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-block border border-dashed border-paper/20 text-center">
                <p className="text-2xl font-light tracking-[-0.03em]">{t("emptyDeck")}</p>
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
                    onHeaderClick={() => spotlightPane(item.id)}
                    onSelectTab={(tabIndex) => {
                      setActiveTab(item.id, tabIndex);
                      focusPane(item.id);
                    }}
                    onCloseTab={(tabIndex) => closeTab(item.id, tabIndex)}
                    onNewTab={() => {
                      focusPane(item.id);
                      openField(item.id, "new");
                    }}
                    onNavigate={(action) => deck.navigate(item.id, action)}
                    onSpotlight={() => spotlightPane(item.id)}
                    onFill={() => fillPane(item.id)}
                    onHide={() => setVisible(item.id, false)}
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
      />

      <Sheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title={t("shortcuts")} closeLabel={t("close")}>
        <div className="flex flex-col gap-5">
          {shortcutGroups.map(({ title, rows }) => (
            <section key={title}>
              <h3 className="register mb-1 uppercase text-paper-mute">{t(title)}</h3>
              <dl className="cie-stagger flex flex-col">
                {rows.map(([label, keys]) => (
                  <div key={label} className="cie-rise flex items-center justify-between gap-6 border-t border-ink/10 py-2">
                    <dt className="text-sm">{t(label)}</dt>
                    <dd className="flex items-center gap-1">
                      {keys.map((key, index) => (key === "–" ? <span key={index} className="text-paper-mute">–</span> : <kbd key={index} className="key">{key}</kbd>))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <section>
            <h3 className="register mb-1 uppercase text-paper-mute">{t("mouseTitle")}</h3>
            <p className="mb-2 text-xs leading-5 text-paper-mute">{t("mouseHint")}</p>
            <dl className="flex flex-col">
              {mouseRows.map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between gap-6 border-t border-ink/10 py-2">
                  <dt className="text-sm">{t(label)}</dt>
                  <dd><kbd className="key">{keys}</kbd></dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs leading-5 text-paper-mute">{t("mouseNative")}</p>
          </section>
        </div>
        {appVersion && (
          <div className="mt-4 flex items-center justify-between gap-6 border-t border-ink/10 pt-4">
            <span className="register text-paper-mute">{t("versionLabel", { version: appVersion })}</span>
            <Button
              tone="ink"
              onClick={() => {
                setShortcutsOpen(false);
                deck.checkForUpdates();
              }}
            >
              {t("checkUpdates")}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
