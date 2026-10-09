import React from "react";
import { Plus, Minus, Eye, EyeOff, Upload } from "lucide-react";
import { IconButton } from "@desktop/components/ui/controls";
import { urlList, hostLabel } from "@desktop/lib/deck-data";

export function Sidebar({ t, windows, deckOrder, focusedId, onAdd, onEdit, onDelete, onToggleVisible, onFocus, onImport }) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 py-4 pl-4 pr-3" aria-label={t("windowsHeader")}>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-light tracking-[-0.03em]">{t("windowsHeader")}</h2>
          <span className="register text-ink-mute">{String(windows.length).padStart(2, "0")}</span>
        </div>
        <IconButton onClick={onAdd} aria-label={t("addWindow")} title={t("addWindow")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      <p className="text-xs leading-5 text-ink-mute">{t("windowsHint")}</p>

      <ul className="cie-stagger -mr-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {windows.map((item) => {
          const urls = urlList(item);
          const order = deckOrder.indexOf(item.id);
          const inDeck = order >= 0;
          const focused = item.id === focusedId && inDeck;
          const visible = item.visible !== false;
          return (
            <li key={item.id} className="cie-rise">
              <div
                tabIndex={0}
                role="button"
                aria-label={`${t("editWindow")}: ${item.name || t("untitledWindow")}`}
                aria-current={focused ? "true" : undefined}
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
                className={`ink-swap weight-hover cie-lift group flex cursor-pointer flex-col gap-2 rounded-block border p-3 ${
                  focused
                    ? "border-paper bg-paper text-ink"
                    : inDeck
                      ? "border-paper/30 bg-ink hover:border-paper/60"
                      : "border-paper/10 bg-ink text-ink-mute hover:border-paper/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`register w-5 shrink-0 ${focused ? "text-paper-mute" : "text-ink-mute"}`}>
                    {inDeck ? String(order + 1).padStart(2, "0") : "—"}
                  </span>
                  <span className="weight min-w-0 flex-1 truncate text-sm" style={{ "--w": focused ? 600 : inDeck ? 450 : 350 }}>
                    {item.name || t("untitledWindow")}
                  </span>
                  <span className={`register shrink-0 ${focused ? "text-paper-mute" : "text-ink-mute"}`}>
                    {urls.length} {t(urls.length === 1 ? "urlSingular" : "urlsCount")}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleVisible(item.id);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    aria-pressed={visible}
                    aria-label={t(visible ? "hidePane" : "showPane", { name: item.name })}
                    title={t(visible ? "hidePane" : "showPane", { name: item.name })}
                    className="cie-tap grid h-6 w-6 shrink-0 place-items-center rounded-pill transition-colors duration-fast hover:bg-btn"
                  >
                    {visible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
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
                    className="cie-tap grid h-6 w-6 shrink-0 place-items-center rounded-pill opacity-0 transition-[opacity,background-color] duration-fast hover:bg-btn focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 pl-7">
                  {urls.slice(0, 2).map((url, index) => (
                    <span key={index} className={`register truncate ${focused ? "text-paper-mute" : "text-ink-mute"}`}>{hostLabel(url)}</span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onImport}
        className="cie-tap ink-swap flex items-center gap-3 rounded-block border border-dashed border-paper/30 px-3 py-3 text-left hover:border-paper/70"
      >
        <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm">{t("importBackup")}</span>
          <span className="text-xs text-ink-mute">{t("importHint")}</span>
        </span>
      </button>
    </aside>
  );
}
