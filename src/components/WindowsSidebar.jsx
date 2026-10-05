import React from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslation } from "@/lib/i18n";

export function WindowsSidebar({ lang, windows, canvasSlots = [], onOpenAddModal, onEditWindow, onDeleteWindow, showGuide = false }) {
  const t = (key, values) => getTranslation(lang, key, values);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify([item]));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="flex max-h-[660px] w-72 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-100">{t("windowsHeader")}</h3>
          <span className="font-mono text-[11px] text-zinc-400">({windows.length})</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenAddModal}
          aria-label={t("regTitleAdd")}
          title={t("regTitleAdd")}
          className="h-8 w-8 min-h-[32px] min-w-[32px] max-h-[32px] max-w-[32px] shrink-0 rounded-full border-zinc-700 bg-zinc-900 p-0 hover:border-blue-500 hover:bg-blue-600 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="-mt-1 px-1 text-[11px] leading-4 text-zinc-400">{t("windowsHint")}</p>
      {showGuide && <p className="-mt-1 rounded-md border border-blue-400/60 bg-blue-500/15 px-2 py-1.5 text-[11px] font-semibold leading-4 text-blue-100"><span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">3</span>{t("guideStep3Description")}</p>}

      <div className="flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar flex-1">
        {windows.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6 px-2">
            {t("noWindows")}
          </p>
        ) : (
          windows.map((item) => {
            const urlLines = (item.urls || "").split("\n").filter(Boolean);
            const isPlaced = canvasSlots.some(
              (slot) =>
                (slot.id && slot.id === item.id) ||
                (slot.name && item.name && slot.name === item.name) ||
                (slot.urls && item.urls && slot.urls === item.urls)
            );

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDoubleClick={() => onEditWindow(item)}
                tabIndex={0}
                role="button"
                aria-label={t("editItem", { name: item.name || t("untitledWindow") })}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onEditWindow(item);
                  } else if (e.key === "Delete") {
                    e.preventDefault();
                    onDeleteWindow(item.id);
                  }
                }}
                className={`group relative flex cursor-grab flex-col gap-2 rounded-lg border p-3 transition-[background-color,border-color,box-shadow] active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                  isPlaced
                    ? "border-blue-500/60 bg-blue-950/20 hover:border-blue-400"
                    : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 hover:bg-zinc-850"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isPlaced && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-zinc-200 truncate">
                      {item.name || t("untitledWindow")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isPlaced && (
                      <span className="rounded border border-blue-500/40 bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                        {t("inCanvasTag")}
                      </span>
                    )}
                    <span className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                      {urlLines.length} {t(urlLines.length === 1 ? "urlSingular" : "urlsCount")}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWindow(item.id);
                      }}
                      aria-label={t("deleteItem", { name: item.name || t("untitledWindow") })}
                      title={t("deleteItem", { name: item.name || t("untitledWindow") })}
                      className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {urlLines.slice(0, 2).map((url, i) => (
                    <div key={i} className="truncate rounded bg-zinc-950/60 px-1.5 py-1 font-mono text-[11px] leading-4 text-zinc-400">
                      {t("tabLabel", { n: i + 1 })}: {url.replace(/^https?:\/\//i, "")}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
