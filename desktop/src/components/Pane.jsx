import React from "react";
import { ArrowLeft, ArrowRight, RotateCw, Maximize2, Minimize2, Expand, X, AlertTriangle } from "lucide-react";
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

export const Pane = React.forwardRef(function Pane(
  { t, item, urls, index, rect, focused, mode, compact, activeTab, meta, error, onHeaderClick, onSelectTab, onNavigate, onSpotlight, onFill, onHide },
  bodyRef
) {
  const tabMeta = meta?.[activeTab];
  const title = tabMeta?.title || item.name;
  const enlarged = focused && mode !== "grid";

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
          {!compact && title && title !== item.name && (
            <span className={`min-w-0 truncate text-xs ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{title}</span>
          )}
          {tabMeta?.loading && <span className={`cie-loader cie-loader--xs shrink-0 ${focused ? "cie-loader--ink" : ""}`} aria-hidden="true" />}
          {error && (
            <span title={`${t("loadFailed")}: ${error.description}`} className="flex shrink-0 items-center">
              <AlertTriangle className="h-3.5 w-3.5" aria-label={t("loadFailed")} />
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {urls.length > 1 && (
              <div role="tablist" aria-label={item.name} className="mr-1.5 flex items-center gap-1">
                {urls.map((url, tabIndex) => {
                  const selected = tabIndex === activeTab;
                  return (
                    <button
                      key={tabIndex}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectTab(tabIndex);
                      }}
                      title={url}
                      className={`register cie-tap ink-swap max-w-[9rem] truncate rounded-pill border px-2 py-0.5 ${
                        selected
                          ? focused ? "border-ink bg-ink text-paper" : "border-paper bg-paper text-ink"
                          : focused ? "border-ink/25 hover:border-ink/60" : "border-paper/25 text-ink-mute hover:border-paper/60 hover:text-paper"
                      }`}
                    >
                      {compact ? tabIndex + 1 : hostLabel(meta?.[tabIndex]?.url || url)}
                    </button>
                  );
                })}
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
        <div ref={bodyRef} data-radius="inner" className="relative h-full w-full rounded-[calc(var(--cie-r)-5px)] bg-paper/5">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-center">
            <span className="cie-loader cie-loader--sm" aria-hidden="true" />
            <span className="register truncate uppercase text-ink-mute">{hostLabel(urls[activeTab] || "")}</span>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
});
