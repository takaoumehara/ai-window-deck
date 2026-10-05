import React from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export function WindowsSidebar({ lang, windows, canvasSlots = [], onOpenAddModal, onEditWindow, onDeleteWindow, showGuide = false }) {
  const t = (key, values) => getTranslation(lang, key, values);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify([item]));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="flex max-h-[660px] w-72 flex-col gap-3 rounded-xl p-3.5" style={{
      border: '1px solid var(--cie-stroke)',
      background: 'var(--cie-btn)',
      borderRadius: 'var(--cie-r)'
    }}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--cie-ink)', fontFamily: 'var(--cie-sans)' }}>{t("windowsHeader")}</h3>
          <span className="text-[11px]" style={{ fontFamily: 'var(--cie-mono)', color: 'var(--cie-ink-mute)' }}>({windows.length})</span>
        </div>
        <button
          onClick={onOpenAddModal}
          aria-label={t("regTitleAdd")}
          title={t("regTitleAdd")}
          className="h-8 w-8 min-h-[32px] min-w-[32px] max-h-[32px] max-w-[32px] shrink-0 rounded-full p-0 flex items-center justify-center"
          style={{
            border: '1px solid var(--cie-stroke)',
            background: 'var(--cie-btn)',
            color: 'var(--cie-ink)',
            borderRadius: 'var(--cie-r-pill)',
            cursor: 'pointer',
            transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      <p className="-mt-1 px-1 text-[11px] leading-4" style={{ color: 'var(--cie-ink-mute)', fontFamily: 'var(--cie-sans)' }}>{t("windowsHint")}</p>
      {showGuide && <p className="-mt-1 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-4" style={{
        border: '1px solid var(--cie-stroke)',
        background: 'var(--cie-btn-hover)',
        color: 'var(--cie-ink)',
        fontFamily: 'var(--cie-sans)',
        borderRadius: 'calc(var(--cie-r) / 2)'
      }}><span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]" style={{
        background: 'var(--cie-ink)',
        color: 'var(--cie-paper)'
      }}>3</span>{t("guideStep3Description")}</p>}

      <div className="flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar flex-1">
        {windows.length === 0 ? (
          <p className="text-xs text-center py-6 px-2" style={{ color: 'var(--cie-ink-mute)', fontFamily: 'var(--cie-sans)' }}>
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
                className="group relative flex cursor-grab flex-col gap-2 rounded-lg p-3 transition-all active:cursor-grabbing focus-visible:outline-none"
                style={{
                  border: isPlaced ? '2px solid var(--cie-ink)' : '1px solid var(--cie-stroke)',
                  background: isPlaced ? 'var(--cie-ink)' : 'var(--cie-paper)',
                  color: isPlaced ? 'var(--cie-paper)' : 'var(--cie-ink)',
                  borderRadius: 'var(--cie-r)',
                  transition: `all var(--cie-t-snap) var(--cie-ease-expo)`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isPlaced && (
                      <CheckCircle2 style={{ width: '14px', height: '14px', flexShrink: 0, color: 'inherit' }} />
                    )}
                    <span className="text-xs font-bold truncate" style={{ fontFamily: 'var(--cie-sans)' }}>
                      {item.name || t("untitledWindow")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isPlaced && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{
                        border: '1px solid var(--cie-paper)',
                        background: 'transparent',
                        color: 'var(--cie-paper)',
                        fontFamily: 'var(--cie-sans)',
                        borderRadius: 'calc(var(--cie-r) / 3)'
                      }}>
                        {t("inCanvasTag")}
                      </span>
                    )}
                    <span className="rounded px-1.5 py-0.5 text-[10px]" style={{
                      border: '1px solid var(--cie-stroke)',
                      background: isPlaced ? 'rgba(0,0,0,0.15)' : 'var(--cie-btn)',
                      fontFamily: 'var(--cie-mono)',
                      color: isPlaced ? 'var(--cie-paper)' : 'var(--cie-ink-mute)',
                      borderRadius: 'calc(var(--cie-r) / 3)'
                    }}>
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
                      className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:outline-none"
                      style={{
                        color: isPlaced ? 'var(--cie-paper)' : 'var(--cie-ink-mute)',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {urlLines.slice(0, 2).map((url, i) => (
                    <div key={i} className="truncate rounded px-1.5 py-1 text-[11px] leading-4" style={{
                      background: isPlaced ? 'rgba(0,0,0,0.15)' : 'var(--cie-btn)',
                      fontFamily: 'var(--cie-mono)',
                      color: isPlaced ? 'var(--cie-paper-mute)' : 'var(--cie-ink-mute)',
                      borderRadius: 'calc(var(--cie-r) / 3)'
                    }}>
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
