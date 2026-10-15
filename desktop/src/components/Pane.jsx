import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Maximize2, Minimize2, Expand, X, AlertTriangle, Plus, Search, Globe, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Smartphone, Moon } from "lucide-react";
import { SearchList } from "@desktop/components/ui/SearchList";
import { DeviceStage } from "@desktop/components/DeviceStage";
import { hostLabel } from "@desktop/lib/deck-data";
import { dropTarget } from "@desktop/lib/tabs";
import { dropZone } from "@desktop/lib/arrangement";
import { AiBadge } from "@desktop/components/AiBadge";

function HeaderButton({ label, shortcut, onClick, disabled, pressed, focused, children }) {
  const pressedTone = focused ? "bg-ink text-paper hover:bg-ink/85" : "bg-paper text-ink hover:bg-paper/85";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`cie-tap grid h-6 w-6 place-items-center rounded-pill transition-colors duration-fast disabled:pointer-events-none disabled:opacity-40 ${
        pressed ? pressedTone : "hover:bg-btn"
      }`}
    >
      {children}
    </button>
  );
}

// Address bar (⌘L / ⌘T) and find bar (⌘F) take the tab strip's place in the header.
function HeaderField({ t, field, focused, found, onChange, onSubmit, onCancel }) {
  const inputRef = useRef(null);
  const isFind = field.kind === "find";
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [field.kind, field.token]);
  const tone = focused ? "border-ink-edge text-ink placeholder:text-ink-hint" : "border-paper-edge text-paper placeholder:text-paper-hint";
  const Icon = isFind ? Search : Globe;
  return (
    <form
      className="flex min-w-0 flex-1 items-center gap-1.5"
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ backwards: false });
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
      <input
        ref={inputRef}
        value={field.value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          } else if (event.key === "Enter" && event.shiftKey && isFind) {
            event.preventDefault();
            onSubmit({ backwards: true });
          }
        }}
        onBlur={() => !isFind && onCancel({ refocus: false })}
        spellCheck={false}
        autoComplete="off"
        aria-label={t(isFind ? "findLabel" : field.kind === "new" ? "newTabLabel" : "addressLabel")}
        placeholder={t(isFind ? "findLabel" : "addressPlaceholder")}
        className={`h-6 min-w-0 flex-1 rounded-pill border bg-transparent px-2.5 text-xs outline-none focus:border-current ${tone}`}
      />
      {isFind && (
        <>
          <span className={`register shrink-0 tabular-nums ${focused ? "text-paper-mute" : "text-ink-mute"}`} aria-live="polite">
            {field.value ? `${found?.active ?? 0}/${found?.matches ?? 0}` : ""}
          </span>
          <HeaderButton label={t("findPrevious")} onClick={() => onSubmit({ backwards: true })}>
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          </HeaderButton>
          <HeaderButton label={t("findNext")} onClick={() => onSubmit({ backwards: false })}>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </HeaderButton>
          <HeaderButton label={t("close")} onClick={onCancel}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </HeaderButton>
        </>
      )}
    </form>
  );
}

function TabIcon({ meta, loading, ink }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [meta?.favicon]);
  if (loading) return <span className={`cie-loader cie-loader--xs shrink-0 ${ink ? "cie-loader--ink" : ""}`} aria-hidden="true" />;
  if (meta?.favicon && !broken) {
    return <img src={meta.favicon} alt="" draggable={false} onError={() => setBroken(true)} className="h-3.5 w-3.5 shrink-0 rounded-[3px] object-contain" />;
  }
  return <Globe className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />;
}

// Chrome-style strip on the bar's bottom edge (.deck-tab in index.css): drag a
// tab or press ⇧←/→ on it to reorder, middle-click or × to close. Tabs shrink
// to a minimum width, then the strip scrolls sideways (a vertical wheel scrolls
// it too) with faded edges and arrows; the active tab is kept in view. Narrow
// panes show only the active tab. The list button opens every tab with search.
function TabStrip({ t, name, urls, meta, sleeping = [], activeTab, focused, compact, menuOpen, menuButtonRef, onToggleMenu, onSelectTab, onCloseTab, onNewTab, onMoveTab }) {
  const [draggedTab, setDraggedTab] = useState(null);
  const [tabGap, setTabGap] = useState(null);
  const [edges, setEdges] = useState({ overflow: false, start: false, end: false });
  const scrollerRef = useRef(null);
  const endTabDrag = () => {
    setDraggedTab(null);
    setTabGap(null);
  };

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      const next = { overflow: scrollWidth > clientWidth + 1, start: scrollLeft > 1, end: scrollLeft + clientWidth < scrollWidth - 1 };
      setEdges((current) => (current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next));
    };
    const onWheel = (event) => {
      if (scroller.scrollWidth <= scroller.clientWidth + 1 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      scroller.scrollLeft += event.deltaY;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    for (const child of scroller.children) observer.observe(child);
    scroller.addEventListener("scroll", update, { passive: true });
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
      scroller.removeEventListener("wheel", onWheel);
    };
  }, [urls.length, compact]);

  // scrollIntoView would also scroll the clipped header, so only the strip moves.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const tab = scroller?.querySelector(".deck-tab.is-active");
    if (!scroller || !tab) return;
    const fade = 28;
    const left = tab.offsetLeft - fade;
    const right = tab.offsetLeft + tab.offsetWidth + fade;
    if (left < scroller.scrollLeft) scroller.scrollLeft = left;
    else if (right > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = right - scroller.clientWidth;
  }, [activeTab, urls.length, compact]);

  const page = (direction) => {
    const scroller = scrollerRef.current;
    scroller?.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" });
  };

  const marker = `absolute bottom-1 top-1 z-10 w-0.5 rounded-pill ${focused ? "bg-ink" : "bg-paper"}`;
  const shown = compact ? [activeTab] : urls.map((_, index) => index);
  const listButton = compact ? urls.length > 1 : edges.overflow;
  return (
    <div className={`deck-tabs flex flex-1 items-end ${compact ? "min-w-[6.25rem]" : "min-w-0"}`}>
      {edges.overflow && !compact && (
        <StripArrow label={t("tabsScrollLeft")} disabled={!edges.start} onClick={() => page(-1)}>
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </StripArrow>
      )}
      <div className="relative flex h-full min-w-0 flex-1 items-end">
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label={name}
        className="deck-tabs__scroller flex min-w-0 flex-1 items-end"
        onDragLeave={(event) => event.currentTarget === event.target && setTabGap(null)}
      >
        {shown.map((tabIndex) => {
          const url = urls[tabIndex];
          const selected = tabIndex === activeTab;
          const tabMeta = meta?.[tabIndex];
          const host = hostLabel(tabMeta?.url || url);
          const label = tabMeta?.title || host;
          const asleep = sleeping.includes(tabIndex) && !selected;
          return (
            <span
              key={`${tabIndex}-${url}`}
              draggable={!compact}
              onDragStart={(event) => {
                event.stopPropagation();
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", tabMeta?.url || url);
                setDraggedTab(tabIndex);
              }}
              onDragOver={(event) => {
                if (draggedTab == null) return;
                event.preventDefault();
                const box = event.currentTarget.getBoundingClientRect();
                setTabGap(event.clientX < box.left + box.width / 2 ? tabIndex : tabIndex + 1);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (draggedTab != null && tabGap != null) onMoveTab(draggedTab, dropTarget(draggedTab, tabGap));
                endTabDrag();
              }}
              onDragEnd={endTabDrag}
              className={`deck-tab group/tab flex items-center ${compact ? "min-w-[2.25rem] flex-1" : "w-44 min-w-[6.5rem] shrink-0 cursor-grab active:cursor-grabbing"} ${
                selected ? "is-active" : ""
              } ${draggedTab === tabIndex ? "opacity-40" : ""}`}
            >
              {!compact && tabIndex > 0 && !selected && tabIndex - 1 !== activeTab && <span className="deck-tab__sep" aria-hidden="true" />}
              {draggedTab != null && tabGap === tabIndex && <span className={`${marker} -left-[2px]`} aria-hidden="true" />}
              {draggedTab != null && tabGap === tabIndex + 1 && tabIndex === urls.length - 1 && <span className={`${marker} -right-[2px]`} aria-hidden="true" />}
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                aria-keyshortcuts="Shift+ArrowLeft Shift+ArrowRight"
                aria-posinset={tabIndex + 1}
                aria-setsize={urls.length}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectTab(tabIndex);
                }}
                onKeyDown={(event) => {
                  if (!event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) return;
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  event.stopPropagation();
                  const to = tabIndex + (event.key === "ArrowLeft" ? -1 : 1);
                  if (to < 0 || to >= urls.length) return;
                  onMoveTab(tabIndex, to);
                  const strip = event.currentTarget.closest("[role=tablist]");
                  requestAnimationFrame(() => strip?.querySelectorAll("[role=tab]")[to]?.focus());
                }}
                onAuxClick={(event) => {
                  if (event.button !== 1) return;
                  event.stopPropagation();
                  onCloseTab(tabIndex);
                }}
                title={`${label}${asleep ? ` · ${t("sleepingLabel")}` : ""}\n${tabMeta?.url || url}\n${t("tabReorderHint")}`}
                className={`cie-tap deck-focus-ring flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-t-[7px] pl-2.5 text-xs ${compact ? "pr-2.5" : "pr-1"}`}
              >
                <TabIcon meta={tabMeta} loading={tabMeta?.loading} ink={focused} />
                <span className={`min-w-0 truncate ${selected ? "font-medium" : ""}`}>{label}</span>
                {asleep && (
                  <>
                    <Moon className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
                    <span className="sr-only">{t("sleepingLabel")}</span>
                  </>
                )}
              </button>
              {!compact && <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tabIndex);
                }}
                aria-label={t("closeTab", { name: label })}
                title={t("closeTab", { name: label })}
                className="deck-tab__close deck-focus-ring mr-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-pill transition-opacity duration-fast hover:bg-btn"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>}
            </span>
          );
        })}
      </div>
      {edges.start && <span className={`pointer-events-none absolute inset-y-0 left-0 z-[2] w-7 bg-gradient-to-r to-transparent ${focused ? "from-paper" : "from-ink"}`} aria-hidden="true" />}
      {edges.end && <span className={`pointer-events-none absolute inset-y-0 right-0 z-[2] w-7 bg-gradient-to-l to-transparent ${focused ? "from-paper" : "from-ink"}`} aria-hidden="true" />}
      </div>
      {edges.overflow && !compact && (
        <StripArrow label={t("tabsScrollRight")} disabled={!edges.end} onClick={() => page(1)}>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </StripArrow>
      )}
      <span className="ml-0.5 flex shrink-0 items-center gap-0.5 self-center">
        <HeaderButton label={t("newTab")} onClick={onNewTab}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </HeaderButton>
        {listButton && (
          <button
            ref={menuButtonRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-label={t("tabsAll", { count: urls.length })}
            title={t("tabsAll", { count: urls.length })}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu();
            }}
            className={`cie-tap deck-focus-ring flex h-6 shrink-0 items-center gap-0.5 rounded-pill px-1.5 transition-colors duration-fast ${menuOpen ? "bg-btn" : "hover:bg-btn"}`}
          >
            <span className="register tabular-nums">{urls.length}</span>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  );
}

function StripArrow({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="cie-tap mb-1 grid h-6 w-5 shrink-0 place-items-center self-end rounded-pill transition-colors duration-fast hover:bg-btn disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// Every tab of the window, searchable. Opens below the bar, over the page.
function TabMenu({ t, urls, meta, activeTab, focused, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const items = urls
    .map((url, index) => {
      const tabMeta = meta?.[index];
      const address = tabMeta?.url || url;
      const label = tabMeta?.title || hostLabel(address);
      return { index, address, label, tabMeta };
    })
    .filter(({ address, label }) => words.every((word) => `${label} ${address}`.toLowerCase().includes(word)))
    .map(({ index, address, label, tabMeta }) => ({
      id: String(index),
      label: `${index + 1}. ${label}`,
      detail: hostLabel(address),
      title: address,
      icon: <TabIcon meta={tabMeta} loading={false} ink={false} />,
      selected: index === activeTab,
    }));
  return (
    <div
      className={`deck-popover absolute right-2 top-10 z-20 flex max-h-[min(440px,calc(100%-48px))] w-[min(360px,calc(100%-16px))] flex-col overflow-hidden rounded-block border bg-ink text-paper ${focused ? "border-paper/40" : "border-paper/20"}`}
      onClick={(event) => event.stopPropagation()}
    >
      <SearchList
        label={t("tabsAll", { count: urls.length })}
        placeholder={t("tabsSearch")}
        query={query}
        onQuery={setQuery}
        groups={[{ key: "tabs", label: "", items }]}
        onPick={(id) => onPick(Number(id))}
        onEscape={onClose}
        emptyLabel={t("tabsNone")}
        tone="ink"
      />
    </div>
  );
}

export const PANE_DRAG_TYPE = "application/x-deck-pane";

const EDGE = {
  left: "left-0 top-0 bottom-0 w-1/4",
  right: "right-0 top-0 bottom-0 w-1/4",
  top: "left-0 right-0 top-0 h-1/4",
  bottom: "left-0 right-0 bottom-0 h-1/4",
};

// Where the dragged pane will land: the whole pane (swap) or one edge (insert).
function DropOverlay({ t, zone }) {
  const swap = zone === "swap";
  return (
    <div className={`pointer-events-none absolute z-10 p-2 ${swap ? "inset-0" : EDGE[zone]}`} aria-hidden="true">
      <div className="flex h-full w-full items-start justify-center rounded-block border-2 border-dashed border-paper bg-ink/70 pt-6">
        <span className="register rounded-pill bg-paper px-2.5 py-1 uppercase text-ink">{t(swap ? "dropSwap" : "dropInsert")}</span>
      </div>
    </div>
  );
}

export const Pane = React.forwardRef(function Pane(
  {
    t, item, urls, index, rect, focused, ai, sleep, mode, compact, activeTab, meta, error, snapshot, field, found, device, devices, keys,
    onHeaderClick, onSelectTab, onCloseTab, onNewTab, onNavigate, onSpotlight, onFill, onHide, onResetZoom,
    onFieldChange, onFieldSubmit, onFieldCancel, onToggleDevice, onDeviceChange, onRotateDevice, onAddDevice, onMoveTab,
    paneDragging, dropHint, onPaneDragStart, onPaneDragEnd, onPaneDragOver, onPaneDrop, recentDevices, onPopover,
  },
  bodyRef
) {
  const [tabMenu, setTabMenu] = useState(false);
  const shellRef = useRef(null);
  const menuButtonRef = useRef(null);
  const popoverRef = useRef(onPopover);
  popoverRef.current = onPopover;
  const toggleTabMenu = (open, { refocus = true } = {}) => {
    setTabMenu(open);
    popoverRef.current?.(open);
    if (!open && refocus) menuButtonRef.current?.focus();
  };
  const tabMenuOpen = tabMenu && !field && urls.length > 1;
  useEffect(() => {
    if (tabMenu && !tabMenuOpen) toggleTabMenu(false, { refocus: false });
  });
  useEffect(() => {
    if (!tabMenuOpen) return undefined;
    const onPointer = (event) => {
      const menu = shellRef.current?.querySelector(".deck-popover");
      if (!menu?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) toggleTabMenu(false, { refocus: false });
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  });
  const menuOpenRef = useRef(false);
  menuOpenRef.current = tabMenuOpen;
  useEffect(() => () => {
    if (menuOpenRef.current) popoverRef.current?.(false);
  }, []);
  const tabMeta = meta?.[activeTab];
  const enlarged = focused && mode !== "grid";
  const zoom = tabMeta?.zoom ?? 1;
  const showTabs = urls.length > 1 || !compact;
  const waking = sleep?.waking?.find((entry) => entry.tab === activeTab);
  const pageBody = (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-center">
        <span className={`cie-loader cie-loader--sm ${focused ? "cie-loader--ink" : ""}`} aria-hidden="true" />
        <span className={`register truncate uppercase ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{hostLabel(urls[activeTab] || "")}</span>
      </div>
      {snapshot && <img src={snapshot.src} alt="" draggable={false} className="pane-snapshot" style={{ width: `${snapshot.width}px` }} />}
      {waking && (
        <>
          {waking.snapshot && <img src={waking.snapshot} alt="" draggable={false} className="pane-sleep-snapshot" />}
          <span className="register absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-pill bg-ink px-3 py-1 uppercase text-paper" role="status">
            <Moon className="h-3 w-3" aria-hidden="true" />
            {t("wakingLabel")}
          </span>
        </>
      )}
    </>
  );

  return (
    <div
      className={`deck-pane absolute p-[2px] ${rect.visible ? "" : "is-away"}`}
      // Above the panes Fill pushes away, so leaving Fill uncovers them instead of
      // fading them in on top of the page.
      style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%`, zIndex: focused ? 1 : 0 }}
      aria-hidden={!rect.visible}
      data-pane={item.id}
      onDragOver={(event) => {
        if (!paneDragging || paneDragging === item.id || !event.dataTransfer.types.includes(PANE_DRAG_TYPE)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onPaneDragOver(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
      }}
      onDrop={(event) => {
        if (!paneDragging || paneDragging === item.id) return;
        event.preventDefault();
        onPaneDrop(dropZone(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY));
      }}
    >
      <section
        ref={shellRef}
        aria-label={item.name}
        className={`ink-swap deck-pane-shell relative flex h-full w-full flex-col overflow-hidden border ${paneDragging === item.id ? "opacity-50" : ""} ${focused ? "is-focused border-paper" : "border-paper/10"}`}
      >
        <header
          role="button"
          tabIndex={rect.visible ? 0 : -1}
          draggable={rect.visible && !field}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(PANE_DRAG_TYPE, item.id);
            event.dataTransfer.setData("text/plain", item.name);
            onPaneDragStart();
          }}
          onDragEnd={onPaneDragEnd}
          onClick={onHeaderClick}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onHeaderClick();
            }
          }}
          aria-pressed={enlarged}
          aria-label={`${item.name} — ${enlarged ? t("shrink") : t("enlarge")}`}
          title={`${enlarged ? t("shrink") : t("enlarge")} · ${t("dragPaneHint")}`}
          className={`ink-swap weight-hover flex h-9 shrink-0 cursor-pointer select-none items-center gap-2.5 border-b pl-3 pr-2 ${
            focused ? "border-ink/15 bg-paper text-ink" : "border-paper/10 bg-ink text-paper hover:bg-paper/5"
          }`}
        >
          <span className={`register shrink-0 ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{String(index + 1).padStart(2, "0")}</span>
          <span className={`weight truncate ${compact ? "min-w-[2.5rem] max-w-[32%] shrink" : "min-w-0 max-w-[40%] shrink-0"} text-[13px] tracking-[-0.01em]`} style={{ "--w": focused ? 600 : 400 }}>{item.name}</span>
          {ai && <AiBadge t={t} status={ai.status} site={ai.site} iconOnly={compact} className="shrink-0" />}
          {field ? (
            <HeaderField
              t={t}
              field={field}
              focused={focused}
              found={found}
              onChange={onFieldChange}
              onSubmit={onFieldSubmit}
              onCancel={onFieldCancel}
            />
          ) : showTabs ? (
            <TabStrip
              t={t}
              name={item.name}
              urls={urls}
              meta={meta}
              sleeping={sleep?.tabs}
              activeTab={activeTab}
              focused={focused}
              compact={compact}
              menuOpen={tabMenuOpen}
              menuButtonRef={menuButtonRef}
              onToggleMenu={() => toggleTabMenu(!tabMenuOpen)}
              onSelectTab={onSelectTab}
              onCloseTab={onCloseTab}
              onNewTab={onNewTab}
              onMoveTab={onMoveTab}
            />
          ) : (
            tabMeta?.loading && <span className={`cie-loader cie-loader--xs shrink-0 ${focused ? "cie-loader--ink" : ""}`} aria-hidden="true" />
          )}
          {error && (
            <span title={`${t("loadFailed")}: ${error.description}`} className="flex shrink-0 items-center">
              <AlertTriangle className="h-3.5 w-3.5" role="img" aria-label={t("loadFailed")} />
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {Math.abs(zoom - 1) > 0.001 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onResetZoom();
                }}
                title={t("zoomReset")}
                aria-label={`${t("zoomReset")} (${Math.round(zoom * 100)}%)`}
                className={`register cie-tap mr-1 rounded-pill border px-2 py-0.5 tabular-nums ${focused ? "border-ink-edge hover:border-ink" : "border-paper-edge hover:border-paper"}`}
              >
                {Math.round(zoom * 100)}%
              </button>
            )}
            {(!compact || device) && (
              <HeaderButton label={t(device ? "deviceExit" : "deviceEnter")} shortcut={keys?.device} pressed={Boolean(device)} focused={focused} onClick={onToggleDevice}>
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              </HeaderButton>
            )}
            {!compact && (
              <>
                <HeaderButton label={t("back")} shortcut={keys?.back} disabled={!tabMeta?.canGoBack} onClick={() => onNavigate("back")}>
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </HeaderButton>
                <HeaderButton label={t("forward")} shortcut={keys?.forward} disabled={!tabMeta?.canGoForward} onClick={() => onNavigate("forward")}>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </HeaderButton>
                <HeaderButton label={t("reload")} shortcut={keys?.reload} onClick={() => onNavigate("reload")}>
                  <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                </HeaderButton>
              </>
            )}
            <HeaderButton label={enlarged ? t("shrink") : t("enlarge")} onClick={onSpotlight}>
              {enlarged ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />}
            </HeaderButton>
            {!compact && (
              <HeaderButton label={t("fill")} onClick={onFill}>
                <Expand className="h-3.5 w-3.5" aria-hidden="true" />
              </HeaderButton>
            )}
            <HeaderButton label={t("hide")} onClick={onHide}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </HeaderButton>
          </div>
        </header>

        {/* The page itself is a native view that main.cjs lays over this box. */}
        {device ? (
          <DeviceStage
            ref={bodyRef}
            t={t}
            device={device}
            landscape={Boolean(item.device?.landscape)}
            devices={devices}
            recent={recentDevices}
            focused={focused}
            onPopover={onPopover}
            onChange={onDeviceChange}
            onRotate={onRotateDevice}
            onAddDevice={onAddDevice}
          >
            {pageBody}
          </DeviceStage>
        ) : (
          <div className="deck-pane-page min-h-0 flex-1">
            <div ref={bodyRef} className="relative h-full overflow-hidden">
              {pageBody}
            </div>
          </div>
        )}
        {tabMenuOpen && (
          <TabMenu
            t={t}
            urls={urls}
            meta={meta}
            activeTab={activeTab}
            focused={focused}
            onPick={(tabIndex) => {
              onSelectTab(tabIndex);
              toggleTabMenu(false);
            }}
            onClose={() => toggleTabMenu(false)}
          />
        )}
        {dropHint && <DropOverlay t={t} zone={dropHint} />}
      </section>
    </div>
  );
});
