import React from "react";
import { Plus, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { urlList, hostLabel } from "@desktop/lib/deck-data";

export function Sidebar({ t, windows, deckOrder, focusedId, keyLabel, onAdd, onEdit, onDelete, onToggleVisible, onFocus, onImport }) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 border-r border-zinc-800/80 bg-zinc-950 p-3.5" aria-label={t("windowsHeader")}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-zinc-100">{t("windowsHeader")}</h2>
          <span className="font-mono text-[11px] text-zinc-400">({windows.length})</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onAdd}
          aria-label={t("addWindow")}
          title={t("addWindow")}
          className="h-8 w-8 shrink-0 rounded-full border-zinc-700 bg-zinc-900 p-0 hover:border-blue-500 hover:bg-blue-600 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="-mt-1 px-1 text-[11px] leading-4 text-zinc-400">{t("windowsHint")}</p>

      <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {windows.map((item) => {
          const urls = urlList(item);
          const order = deckOrder.indexOf(item.id);
          const inDeck = order >= 0;
          const focused = item.id === focusedId && inDeck;
          return (
            <div
              key={item.id}
              tabIndex={0}
              role="button"
              aria-label={`${t("editWindow")}: ${item.name || t("untitledWindow")}`}
              onClick={() => inDeck && onFocus(item.id)}
              onDoubleClick={() => onEdit(item)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onEdit(item);
                } else if (event.key === "Delete" || event.key === "Backspace") {
                  event.preventDefault();
                  onDelete(item.id);
                }
              }}
              className={`group relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                focused
                  ? "border-blue-400 bg-blue-950/30"
                  : inDeck
                    ? "border-blue-500/50 bg-blue-950/15 hover:border-blue-400"
                    : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {inDeck && order < 8 && <span className="key-cap shrink-0 !px-1.5 !py-0 !text-[10px]">{keyLabel(String(order + 1))}</span>}
                  <span className={`truncate text-xs font-bold ${inDeck ? "text-zinc-100" : "text-zinc-400"}`}>{item.name || t("untitledWindow")}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                    {urls.length} {t(urls.length === 1 ? "urlSingular" : "urlsCount")}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleVisible(item.id);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    aria-pressed={item.visible !== false}
                    aria-label={t(item.visible !== false ? "hidePane" : "showPane", { name: item.name })}
                    title={t(item.visible !== false ? "hidePane" : "showPane", { name: item.name })}
                    className={`rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                      item.visible !== false ? "text-blue-300 hover:text-blue-200" : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {item.visible !== false ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item.id);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    aria-label={t("deleteItem", { name: item.name || t("untitledWindow") })}
                    title={t("deleteItem", { name: item.name || t("untitledWindow") })}
                    className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:text-red-400 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {urls.slice(0, 2).map((url, index) => (
                  <div key={index} className="truncate rounded bg-zinc-950/60 px-1.5 py-1 font-mono text-[11px] leading-4 text-zinc-400">
                    {hostLabel(url)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onImport}
        className="flex items-center gap-2.5 rounded-lg border border-dashed border-zinc-700 px-3 py-2.5 text-left transition-colors hover:border-blue-500/60 hover:bg-blue-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      >
        <Upload className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <span className="flex flex-col">
          <span className="text-xs font-semibold text-zinc-200">{t("importBackup")}</span>
          <span className="text-[11px] leading-4 text-zinc-400">{t("importHint")}</span>
        </span>
      </button>
    </aside>
  );
}
