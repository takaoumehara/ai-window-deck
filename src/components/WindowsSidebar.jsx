import React from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslation } from "@/lib/i18n";

export function WindowsSidebar({ lang, windows, canvasSlots = [], onOpenAddModal, onEditWindow, onDeleteWindow }) {
  const t = (key) => getTranslation(lang, key);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify([item]));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-72 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 max-h-[660px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-100">{t("windowsHeader")}</h3>
          <span className="text-[10px] text-zinc-500 font-mono">({windows.length})</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenAddModal}
          title={t("regTitleAdd")}
          className="h-7 w-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] rounded-full border-zinc-700 bg-zinc-900 hover:bg-blue-600 hover:border-blue-500 hover:text-white p-0 flex items-center justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-[10px] text-zinc-500 px-1 -mt-1">{t("windowsHint")}</p>

      <div className="flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar flex-1">
        {windows.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6 px-2">
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
                className={`group relative flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all shadow-sm cursor-grab active:cursor-grabbing ${
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
                      {item.name || "Untitled"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isPlaced && (
                      <span className="text-[9px] font-bold text-blue-300 bg-blue-500/20 border border-blue-500/40 px-1.5 py-0.2 rounded">
                        {t("inCanvasTag")}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
                      {urlLines.length} urls
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWindow(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {urlLines.slice(0, 2).map((url, i) => (
                    <div key={i} className="text-[10px] text-zinc-400 truncate bg-zinc-950/60 px-1.5 py-0.5 rounded font-mono">
                      tab {i + 1}: {url.replace(/^https?:\/\//i, "")}
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
