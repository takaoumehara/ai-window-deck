import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Maximize2, Minimize2, Expand, X, AlertTriangle, Plus, Search, Globe, ChevronUp, ChevronDown, Smartphone } from "lucide-react";
import { DeviceStage } from "@desktop/components/DeviceStage";
import { hostLabel } from "@desktop/lib/deck-data";
import { dropTarget } from "@desktop/lib/tabs";
import { dropZone } from "@desktop/lib/arrangement";

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
// tab or press ⇧←/→ on it to reorder, middle-click or × to close.
function TabStrip({ t, name, urls, meta, activeTab, focused, compact, onSelectTab, onCloseTab, onNewTab, onMoveTab }) {
  const [draggedTab, setDraggedTab] = useState(null);
  const [tabGap, setTabGap] = useState(null);
  const endTabDrag = () => {
    setDraggedTab(null);
    setTabGap(null);
  };
  const marker = `absolute bottom-1 top-1 z-10 w-0.5 rounded-pill ${focused ? "bg-ink" : "bg-paper"}`;
  return (
    <div
      role="tablist"
      aria-label={name}
      className="deck-tabs flex min-w-0 flex-1 items-end"
      onDragLeave={(event) => event.currentTarget === event.target && setTabGap(null)}
    >
      {urls.map((url, tabIndex) => {
        const selected = tabIndex === activeTab;
        const tabMeta = meta?.[tabIndex];
        const host = hostLabel(tabMeta?.url || url);
        const label = tabMeta?.title || host;
        return (
          <span
            key={`${tabIndex}-${url}`}
            draggable
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
            className={`deck-tab group/tab flex min-w-0 cursor-grab items-center active:cursor-grabbing ${
              compact ? "flex-none" : "w-44 min-w-[4.5rem] shrink"
            } ${selected ? "is-active" : ""} ${draggedTab === tabIndex ? "opacity-40" : ""}`}
          >
            {tabIndex > 0 && !selected && tabIndex - 1 !== activeTab && <span className="deck-tab__sep" aria-hidden="true" />}
            {draggedTab != null && tabGap === tabIndex && <span className={`${marker} -left-[2px]`} aria-hidden="true" />}
            {draggedTab != null && tabGap === tabIndex + 1 && tabIndex === urls.length - 1 && <span className={`${marker} -right-[2px]`} aria-hidden="true" />}
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              aria-keyshortcuts="Shift+ArrowLeft Shift+ArrowRight"
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
              title={`${label}\n${tabMeta?.url || url}\n${t("tabReorderHint")}`}
              aria-label={compact ? `${tabIndex + 1}. ${label}` : undefined}
              className={`cie-tap deck-focus-ring flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-t-[7px] text-xs ${compact ? "px-2.5" : "pl-2.5 pr-1"}`}
            >
              {compact ? (
                <span className="register tabular-nums">{tabIndex + 1}</span>
              ) : (
                <>
                  <TabIcon meta={tabMeta} loading={tabMeta?.loading} ink={focused} />
                  <span className={`min-w-0 truncate ${selected ? "font-medium" : ""}`}>{label}</span>
                </>
              )}
            </button>
            {!compact && (
              <button
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
              </button>
            )}
          </span>
        );
      })}
      {!compact && (
        <span className="ml-1 self-center">
          <HeaderButton label={t("newTab")} onClick={onNewTab}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </HeaderButton>
        </span>
      )}
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
    t, item, urls, index, rect, focused, mode, compact, activeTab, meta, error, snapshot, field, found, device, devices, keys,
    onHeaderClick, onSelectTab, onCloseTab, onNewTab, onNavigate, onSpotlight, onFill, onHide, onResetZoom,
    onFieldChange, onFieldSubmit, onFieldCancel, onToggleDevice, onDeviceChange, onRotateDevice, onAddDevice, onMoveTab,
    paneDragging, dropHint, onPaneDragStart, onPaneDragEnd, onPaneDragOver, onPaneDrop,
  },
  bodyRef
) {
  const tabMeta = meta?.[activeTab];
  const enlarged = focused && mode !== "grid";
  const zoom = tabMeta?.zoom ?? 1;
  const showTabs = urls.length > 1 || !compact;
  const pageBody = (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-center">
        <span className={`cie-loader cie-loader--sm ${focused ? "cie-loader--ink" : ""}`} aria-hidden="true" />
        <span className={`register truncate uppercase ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{hostLabel(urls[activeTab] || "")}</span>
      </div>
      {snapshot && <img src={snapshot.src} alt="" draggable={false} className="pane-snapshot" style={{ width: `${snapshot.width}px` }} />}
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
          <span className="weight shrink-0 text-[13px] tracking-[-0.01em]" style={{ "--w": focused ? 600 : 400 }}>{item.name}</span>
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
              activeTab={activeTab}
              focused={focused}
              compact={compact}
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
            focused={focused}
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
        {dropHint && <DropOverlay t={t} zone={dropHint} />}
      </section>
    </div>
  );
});
