import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Globe, Keyboard, LayoutGrid, Maximize2, PanelLeft, Expand } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Pane } from "@desktop/components/Pane";
import { Sidebar } from "@desktop/components/Sidebar";
import { WindowEditor } from "@desktop/components/WindowEditor";
import { deck } from "@desktop/lib/bridge";
import { DEFAULT_WINDOWS, parseExtensionExport, urlList } from "@desktop/lib/deck-data";
import { computePaneRects, cycleIndex, nextModeForSpotlight } from "@desktop/lib/pane-layout";
import { LANGUAGES, resolveLanguage, translator } from "@desktop/lib/strings";

// Matches the .spotlight-preview-target transition in the extension's CSS, plus a frame.
const LAYOUT_ANIMATION_MS = 400;
const COMPACT_PANE_PX = 380;

const MODE_OPTIONS = [
  { id: "grid", icon: LayoutGrid, label: "modeGrid" },
  { id: "spotlight", icon: Maximize2, label: "modeSpotlight" },
  { id: "fill", icon: Expand, label: "modeFill" },
];

export function App() {
  const [loaded, setLoaded] = useState(false);
  const [platform, setPlatform] = useState("browser");
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
      list.push({ id, bounds: { x: box.left, y: box.top, width: box.width, height: box.height } });
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
  useEffect(() => {
    deck.setOverlay(overlayOpen);
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

  if (!loaded) return <div className="h-full bg-zinc-950" aria-busy="true" />;

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100 selection:bg-blue-600/30">
      <header className={`app-drag flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800/80 pr-3 ${isMac ? "pl-20" : "pl-3"}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-blue-400/30 bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
            <div className="absolute right-1 top-1 h-1.5 w-1.5 rounded-sm bg-zinc-900" />
          </div>
          <h1 className="shrink-0 text-sm font-semibold tracking-[-0.01em] text-white">{t("appTitle")}</h1>
          <span className="hidden truncate text-xs text-zinc-400 lg:inline">{t("appSubtitle")}</span>
        </div>

        {/* Page views are drawn above the DOM, so messages live in the title bar, not over the deck. */}
        <div aria-live="polite" aria-atomic="true" className="min-w-0">
          {notice && (
            <div className="truncate rounded-lg border border-blue-500/50 bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-100 animate-in fade-in">
              {notice}
            </div>
          )}
        </div>

        <div className="app-no-drag ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-pressed={sidebarOpen}
            aria-label={t("sidebarToggle")}
            title={`${t("sidebarToggle")} (${keyLabel("B")})`}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
              sidebarOpen ? "border-zinc-700 bg-zinc-800 text-zinc-100" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            <PanelLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <div role="radiogroup" aria-label={t("modeLabel")} className="flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            {MODE_OPTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => setMode(id)}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                  mode === id ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="key-cap">{keyLabel("X")}</span>
          </button>

          <div className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5">
            <Globe className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value)}
              aria-label={t("languageLabel")}
              className="cursor-pointer rounded bg-transparent text-xs font-medium text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              {LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code} className="bg-zinc-900 text-zinc-200">{label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <Sidebar
            t={t}
            windows={windows}
            deckOrder={deckOrder}
            focusedId={effectiveFocusId}
            keyLabel={keyLabel}
            onAdd={() => setEditor({ open: true, item: null })}
            onEdit={(item) => setEditor({ open: true, item })}
            onDelete={deleteWindow}
            onToggleVisible={toggleVisible}
            onFocus={focusPane}
            onImport={importBackup}
          />
        )}

        <main className="relative min-w-0 flex-1 p-1.5">
          <div ref={deckRef} className="relative h-full w-full">
            {deckPanes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800 text-center">
                <p className="text-sm font-semibold text-zinc-200">{t("emptyDeck")}</p>
                <p className="text-xs text-zinc-400">{t("emptyDeckHint")}</p>
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
                    keyLabel={keyLabel}
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
        onClose={() => setEditor({ open: false, item: null })}
        onSave={saveWindow}
      />

      <Dialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-zinc-100">{t("shortcuts")}</DialogTitle>
        </DialogHeader>
        <DialogClose onClick={() => setShortcutsOpen(false)} label={t("close")} />
        <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 text-sm">
          {[
            ["kbSpotlight", [keyLabel("X")]],
            ["kbHome", [keyLabel("Z")]],
            ["kbFill", [keyLabel("Q")]],
            ["kbFocus", [keyLabel("1"), "…", keyLabel("8")]],
            ["kbCycle", [keyLabel("]"), keyLabel("[")]],
            ["kbSidebar", [keyLabel("B")]],
          ].map(([label, keys]) => (
            <React.Fragment key={label}>
              <dt className="text-zinc-300">{t(label)}</dt>
              <dd className="flex items-center justify-end gap-1">
                {keys.map((key) => (key === "…" ? <span key={key} className="text-zinc-500">–</span> : <span key={key} className="key-cap">{key}</span>))}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </Dialog>
    </div>
  );
}
