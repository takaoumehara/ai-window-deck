import React, { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Maximize2, Minimize2, Expand, X, AlertTriangle, Plus, Search, Globe, ChevronUp, ChevronDown } from "lucide-react";
import { hostLabel } from "@desktop/lib/deck-data";

function HeaderButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="cie-tap grid h-6 w-6 place-items-center rounded-pill transition-colors duration-fast hover:bg-btn disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// Address bar (⌘L / ⌘T) and find bar (⌘F) share the header's title slot.
function HeaderField({ t, field, focused, found, onChange, onSubmit, onCancel }) {
  const inputRef = useRef(null);
  const isFind = field.kind === "find";
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [field.kind, field.token]);
  const tone = focused ? "border-ink/30 text-ink placeholder:text-ink/40" : "border-paper/30 text-paper placeholder:text-paper/40";
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

export const Pane = React.forwardRef(function Pane(
  {
    t, item, urls, index, rect, focused, mode, compact, activeTab, meta, error, snapshot, field, found,
    onHeaderClick, onSelectTab, onCloseTab, onNewTab, onNavigate, onSpotlight, onFill, onHide, onResetZoom,
    onFieldChange, onFieldSubmit, onFieldCancel,
  },
  bodyRef
) {
  const tabMeta = meta?.[activeTab];
  const title = tabMeta?.title || item.name;
  const enlarged = focused && mode !== "grid";
  const zoom = tabMeta?.zoom ?? 1;
  const showTabs = urls.length > 1 || !compact;

  return (
    <div
      className={`deck-pane absolute p-1 ${rect.visible ? "" : "is-away"}`}
      style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
      aria-hidden={!rect.visible}
    >
      <section
        aria-label={item.name}
        className={`ink-swap flex h-full w-full flex-col overflow-hidden rounded-block border ${focused ? "border-paper bg-paper" : "border-paper/15 bg-ink"}`}
      >
        <header
          role="button"
          tabIndex={rect.visible ? 0 : -1}
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
          title={enlarged ? t("shrink") : t("enlarge")}
          className={`ink-swap weight-hover flex h-9 shrink-0 cursor-pointer select-none items-center gap-2.5 px-3 ${
            focused ? "bg-paper text-ink" : "bg-ink text-paper hover:bg-paper/5"
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
          ) : (
            !compact && title && title !== item.name && (
              <span className={`min-w-0 truncate text-xs ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{title}</span>
            )
          )}
          {tabMeta?.loading && <span className={`cie-loader cie-loader--xs shrink-0 ${focused ? "cie-loader--ink" : ""}`} aria-hidden="true" />}
          {error && (
            <span title={`${t("loadFailed")}: ${error.description}`} className="flex shrink-0 items-center">
              <AlertTriangle className="h-3.5 w-3.5" aria-label={t("loadFailed")} />
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
                className={`register cie-tap mr-1 rounded-pill border px-2 py-0.5 tabular-nums ${focused ? "border-ink/30 hover:border-ink" : "border-paper/30 hover:border-paper"}`}
              >
                {Math.round(zoom * 100)}%
              </button>
            )}
            {showTabs && (
              <div role="tablist" aria-label={item.name} className="mr-1.5 flex items-center gap-1">
                {urls.length > 1 && urls.map((url, tabIndex) => {
                  const selected = tabIndex === activeTab;
                  const label = meta?.[tabIndex]?.title || hostLabel(meta?.[tabIndex]?.url || url);
                  return (
                    <span
                      key={`${tabIndex}-${url}`}
                      className={`group/tab ink-swap flex max-w-[10rem] items-center rounded-pill border ${
                        selected
                          ? focused ? "border-ink bg-ink text-paper" : "border-paper bg-paper text-ink"
                          : focused ? "border-ink/25 hover:border-ink/60" : "border-paper/25 text-ink-mute hover:border-paper/60 hover:text-paper"
                      }`}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectTab(tabIndex);
                        }}
                        onAuxClick={(event) => {
                          if (event.button !== 1) return;
                          event.stopPropagation();
                          onCloseTab(tabIndex);
                        }}
                        title={`${label}\n${meta?.[tabIndex]?.url || url}`}
                        className={`register cie-tap min-w-0 truncate py-0.5 pl-2 ${compact ? "pr-2" : "pr-1"}`}
                      >
                        {compact ? tabIndex + 1 : hostLabel(meta?.[tabIndex]?.url || url)}
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
                          className={`mr-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-pill transition-opacity duration-fast hover:bg-btn ${
                            selected ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover/tab:opacity-70 focus:opacity-100"
                          }`}
                        >
                          <X className="h-2.5 w-2.5" aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  );
                })}
                {!compact && (
                  <HeaderButton label={t("newTab")} onClick={onNewTab}>
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </HeaderButton>
                )}
              </div>
            )}
            {!compact && (
              <>
                <HeaderButton label={t("back")} disabled={!tabMeta?.canGoBack} onClick={() => onNavigate("back")}>
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </HeaderButton>
                <HeaderButton label={t("forward")} disabled={!tabMeta?.canGoForward} onClick={() => onNavigate("forward")}>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </HeaderButton>
                <HeaderButton label={t("reload")} onClick={() => onNavigate("reload")}>
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
        <div className="min-h-0 flex-1 p-1 pt-0">
        <div ref={bodyRef} data-radius="inner" className="relative h-full w-full overflow-hidden rounded-[calc(var(--cie-r)-5px)] bg-paper/5">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-center">
            <span className="cie-loader cie-loader--sm" aria-hidden="true" />
            <span className="register truncate uppercase text-ink-mute">{hostLabel(urls[activeTab] || "")}</span>
          </div>
          {snapshot && <img src={snapshot} alt="" draggable={false} className="pane-snapshot" />}
        </div>
        </div>
      </section>
    </div>
  );
});
