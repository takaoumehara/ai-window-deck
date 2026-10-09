import React from "react";
import { ArrowLeft, ArrowRight, RotateCw, Maximize2, Minimize2, Expand, X, Loader2, AlertTriangle } from "lucide-react";
import { hostLabel } from "@desktop/lib/deck-data";

function HeaderButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      {children}
    </button>
  );
}

export const Pane = React.forwardRef(function Pane(
  { t, item, urls, index, rect, focused, mode, compact, activeTab, meta, error, keyLabel, onHeaderClick, onSelectTab, onNavigate, onSpotlight, onFill, onHide },
  bodyRef
) {
  const tabMeta = meta?.[activeTab];
  const title = tabMeta?.title || item.name;
  const enlarged = focused && mode !== "grid";
  const shortcut = index < 8 ? keyLabel(String(index + 1)) : null;

  return (
    <div
      className={`spotlight-preview-target absolute p-1 ${rect.visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
      aria-hidden={!rect.visible}
    >
      <section
        aria-label={item.name}
        className={`flex h-full w-full flex-col overflow-hidden rounded-lg border bg-zinc-900 transition-[border-color,box-shadow] duration-150 ${
          focused ? "border-blue-500/70 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]" : "border-zinc-800"
        }`}
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
          className={`flex h-8 shrink-0 cursor-pointer select-none items-center gap-2 border-b px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${
            focused ? "border-blue-500/30 bg-blue-950/30" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/70"
          }`}
        >
          {shortcut && <span className="key-cap shrink-0 !px-1.5 !py-0 !text-[10px]">{shortcut}</span>}
          <span className={`shrink-0 text-xs font-bold ${focused ? "text-white" : "text-zinc-200"}`}>{item.name}</span>
          {!compact && title && title !== item.name && (
            <span className="min-w-0 truncate text-[11px] text-zinc-400">{title}</span>
          )}
          {tabMeta?.loading && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-zinc-400" aria-hidden="true" />}
          {error && (
            <span title={`${t("loadFailed")}: ${error.description}`} className="flex shrink-0 items-center">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-label={t("loadFailed")} />
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {urls.length > 1 && (
              <div role="tablist" aria-label={item.name} className="mr-1 flex items-center gap-1">
                {urls.map((url, tabIndex) => (
                  <button
                    key={tabIndex}
                    type="button"
                    role="tab"
                    aria-selected={tabIndex === activeTab}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTab(tabIndex);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    title={url}
                    className={`max-w-[9rem] truncate rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                      tabIndex === activeTab
                        ? "border-blue-500/40 bg-blue-500/20 text-blue-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {compact ? tabIndex + 1 : hostLabel(meta?.[tabIndex]?.url || url)}
                  </button>
                ))}
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
        <div ref={bodyRef} className="relative min-h-0 flex-1 bg-zinc-950">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center">
            <span className="text-xs font-semibold text-zinc-300">{item.name}</span>
            <span className="truncate font-mono text-[11px] text-zinc-500">{hostLabel(urls[activeTab] || "")}</span>
          </div>
        </div>
      </section>
    </div>
  );
});
