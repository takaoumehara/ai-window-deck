import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Download, Keyboard, LayoutGrid, Maximize2, PanelLeft, Expand } from "lucide-react";
import { Sheet, SHEET_MS } from "@desktop/components/ui/Sheet";
import { Button, IconButton } from "@desktop/components/ui/controls";
import { Pane } from "@desktop/components/Pane";
import { Sidebar } from "@desktop/components/Sidebar";
import { WindowEditor } from "@desktop/components/WindowEditor";
import { deck } from "@desktop/lib/bridge";
import { DEFAULT_WINDOWS, parseExtensionExport, urlList } from "@desktop/lib/deck-data";
import { computePaneRects, cycleIndex, nextModeForSpotlight } from "@desktop/lib/pane-layout";
import { LANGUAGES, resolveLanguage, translator } from "@desktop/lib/strings";

// --cie-t-move (360ms) for the .deck-pane transition, plus a few frames of slack.
const LAYOUT_ANIMATION_MS = 420;
const COMPACT_PANE_PX = 380;

const MODE_OPTIONS = [
  { id: "grid", icon: LayoutGrid, label: "modeGrid" },
  { id: "spotlight", icon: Maximize2, label: "modeSpotlight" },
  { id: "fill", icon: Expand, label: "modeFill" },
];

export function App() {
  const [loaded, setLoaded] = useState(false);
  const [platform, setPlatform] = useState("browser");
  const [appVersion, setAppVersion] = useState("");
  const [updateReady, setUpdateReady] = useState(null);
  const [windows, setWindows] = useState([]);
  const [mode, setMode] = useState("grid");
  const [focusedId, setFocusedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lang, setLang] = useState("ja");
  const [activeTabs, setActiveTabs] = useState({});
  const [paneMeta, setPaneMeta] = useState({});
  const [paneErrors, setPaneErrors] = useState({});
  const [editor, setEditor] = useState({ open: false, item: null });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deckSize, setDeckSize] = useState({ width: 0, height: 0 });

  const deckRef = useRef(null);
  const bodyRefs = useRef(new Map());
  const t = useMemo(() => translator(lang), [lang]);
  const isMac = platform === "darwin";
  const keyLabel = useCallback((key) => (isMac ? `⌥${key}` : `Alt+${key}`), [isMac]);

  useEffect(() => {
    Promise.all([deck.info(), deck.load()]).then(([info, saved]) => {
      setPlatform(info.platform);
      setAppVersion(info.version || "");
      const settings = saved?.settings || {};
      setWindows(Array.isArray(saved?.windows) ? saved.windows : DEFAULT_WINDOWS);
      setMode(settings.mode || "grid");
      setFocusedId(settings.focusedId || null);
      setSidebarOpen(settings.sidebarOpen !== false);
      setActiveTabs(settings.activeTabs || {});
      setLang(settings.lang || resolveLanguage(info.locale));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    deck.save({ version: 1, windows, settings: { mode, focusedId, sidebarOpen, activeTabs, lang } });
  }, [loaded, windows, mode, focusedId, sidebarOpen, activeTabs, lang]);

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

  // Native page views can't follow a CSS transition, so while panes animate
  // their measured boxes are streamed to the main process every frame.
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
  }, [loaded, deckPanes, activeTabs, rects, sidebarOpen, measure, followLayout]);

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

  useEffect(() => {
    if (effectiveFocusId) deck.focusPane(effectiveFocusId);
  }, [effectiveFocusId, mode]);

  const focusPane = useCallback((id) => setFocusedId(id), []);

  const spotlightPane = useCallback((id) => {
    const targetIsFocused = id === effectiveFocusId;
    setFocusedId(id);
    setMode((current) => nextModeForSpotlight(current, { targetIsFocused }));
  }, [effectiveFocusId]);

  const fillPane = useCallback((id) => {
    const targetIsFocused = id === effectiveFocusId;
    setFocusedId(id);
    setMode((current) => (current === "fill" && targetIsFocused ? "grid" : "fill"));
  }, [effectiveFocusId]);

  const toggleVisible = useCallback((id) => {
    setWindows((list) => list.map((item) => (item.id === id ? { ...item, visible: item.visible === false } : item)));
  }, []);

  const runCommand = useCallback((command) => {
    if (overlayOpen) return;
    const count = deckOrder.length;
    if (command === "toggle-spotlight") {
      if (count) setMode((current) => nextModeForSpotlight(current));
    } else if (command === "restore-home") {
      setMode("grid");
    } else if (command === "toggle-fullscreen") {
      if (count) setMode((current) => (current === "fill" ? "grid" : "fill"));
    } else if (command === "focus-next" || command === "focus-previous") {
      if (count) setFocusedId(deckOrder[cycleIndex(focusIndex, count, command === "focus-next" ? 1 : -1)]);
    } else if (command.startsWith("focus-tile-")) {
      const target = deckOrder[Number(command.slice("focus-tile-".length)) - 1];
      if (target) setFocusedId(target);
    } else if (command === "toggle-sidebar") {
      setSidebarOpen((open) => !open);
    } else if (command === "reload-pane") {
      if (effectiveFocusId) deck.navigate(effectiveFocusId, "reload");
    }
  }, [overlayOpen, deckOrder, focusIndex, effectiveFocusId]);

  const runCommandRef = useRef(runCommand);
  runCommandRef.current = runCommand;

  useEffect(() => {
    const unsubscribers = [
      deck.onCommand((command) => runCommandRef.current(command)),
      deck.onPaneFocused(({ paneId }) => setFocusedId(paneId)),
      deck.onPaneState(({ paneId, tabIndex, ...state }) => {
        setPaneMeta((meta) => ({ ...meta, [paneId]: { ...meta[paneId], [tabIndex]: state } }));
        if (state.loading) setPaneErrors((errors) => (errors[paneId] ? { ...errors, [paneId]: null } : errors));
      }),
      deck.onPaneError(({ paneId, tabIndex, description, url }) => {
        setPaneErrors((errors) => ({ ...errors, [paneId]: { tabIndex, description, url } }));
      }),
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

  const shortcutRows = [
    ["kbSpotlight", [keyLabel("X")]],
    ["kbHome", [keyLabel("Z")]],
    ["kbFill", [keyLabel("Q")]],
    ["kbFocus", [keyLabel("1"), "–", keyLabel("8")]],
    ["kbCycle", [keyLabel("]"), keyLabel("[")]],
    ["kbSidebar", [keyLabel("B")]],
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
            onClick={() => setSidebarOpen((open) => !open)}
            pressed={sidebarOpen}
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
                onClick={() => setMode(id)}
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
        {sidebarOpen && (
          <Sidebar
            t={t}
            windows={windows}
            deckOrder={deckOrder}
            focusedId={effectiveFocusId}
            onAdd={() => setEditor({ open: true, item: null })}
            onEdit={(item) => setEditor({ open: true, item })}
            onDelete={deleteWindow}
            onToggleVisible={toggleVisible}
            onFocus={focusPane}
            onImport={importBackup}
          />
        )}

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
                    onHeaderClick={() => spotlightPane(item.id)}
                    onSelectTab={(tabIndex) => {
                      setActiveTabs((tabs) => ({ ...tabs, [item.id]: tabIndex }));
                      setFocusedId(item.id);
                    }}
                    onNavigate={(action) => deck.navigate(item.id, action)}
                    onSpotlight={() => spotlightPane(item.id)}
                    onFill={() => fillPane(item.id)}
                    onHide={() => toggleVisible(item.id)}
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
        <dl className="cie-stagger flex flex-col">
          {shortcutRows.map(([label, keys]) => (
            <div key={label} className="cie-rise flex items-center justify-between gap-6 border-t border-ink/10 py-2.5">
              <dt className="text-sm">{t(label)}</dt>
              <dd className="flex items-center gap-1">
                {keys.map((key) => (key === "–" ? <span key={key} className="text-paper-mute">–</span> : <kbd key={key} className="key">{key}</kbd>))}
              </dd>
            </div>
          ))}
        </dl>
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
