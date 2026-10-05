import React, { useMemo } from "react";
import { computeDynamicLayout } from "@/lib/layout-model";
import { getTranslation } from "@/lib/i18n";

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function previewSlots(slots) {
  const layout = computeDynamicLayout(Math.max(slots.length, 1), "blank");
  return slots.map((slot, index) => {
    if ([slot.gridX, slot.gridY, slot.gridW, slot.gridH].every(Number.isFinite)) {
      return { left: slot.gridX / 12 * 100, top: slot.gridY / 12 * 100, width: slot.gridW / 12 * 100, height: slot.gridH / 12 * 100 };
    }
    const cell = layout.cells[index] ?? { x: 0, y: 0, w: 1, h: 1 };
    return { left: cell.x / layout.cols * 100, top: cell.y / layout.rows * 100, width: cell.w / layout.cols * 100, height: cell.h / layout.rows * 100 };
  });
}

function targetSize(size, state, base) {
  if (size === "height") return { width: base.width, height: 100 };
  if (size === "half") return { width: 50, height: 50 };
  if (size === "tall") return { width: 50, height: 100 };
  if (size === "threeFourths") return { width: 75, height: 75 };
  if (size === "custom") return { width: state.spotlightWidth ?? 70, height: state.spotlightHeight ?? 90 };
  return { width: 100, height: 100 };
}

export function SpotlightPreview({ lang, state, canvasSlots, targetAspectRatio }) {
  const t = (key) => getTranslation(lang, key);
  const slots = useMemo(() => previewSlots(canvasSlots), [canvasSlots]);
  const base = slots[0] ?? { left: 25, top: 25, width: 50, height: 50 };
  const size = targetSize(state.spotlightSize || "full", state, base);
  const width = clamp(size.width, 20, 100);
  const height = clamp(size.height, 20, 100);
  const centered = state.spotlightAnchor === "center";
  const left = centered ? (100 - width) / 2 : clamp(base.left + base.width / 2 - width / 2, 0, 100 - width);
  const top = centered ? (100 - height) / 2 : clamp(base.top + base.height / 2 - height / 2, 0, 100 - height);

  return (
    <div className="flex flex-col gap-2.5 rounded-lg p-3" style={{
      border: '1px solid var(--cie-stroke)',
      background: 'var(--cie-btn)',
      borderRadius: 'var(--cie-r)'
    }}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--cie-sans)' }}>{t("spotlightPreviewTitle")}</span>
        <span style={{ color: 'var(--cie-ink-mute)', fontFamily: 'var(--cie-sans)' }}>{t("spotlightPreviewCount").replace("{count}", String(canvasSlots.length))}</span>
      </div>
      <div className="mx-auto w-full max-w-[360px] rounded-md p-1.5" style={{ 
        aspectRatio: targetAspectRatio,
        border: '1px solid var(--cie-stroke)',
        background: 'var(--card)'
      }}>
        <div className="relative h-full w-full overflow-hidden rounded-sm" style={{
          background: 'var(--cie-btn)'
        }}>
          {slots.map((slot, index) => (
            <div key={index} className="absolute" style={{ 
              left: `${slot.left}%`, 
              top: `${slot.top}%`, 
              width: `${slot.width}%`, 
              height: `${slot.height}%`,
              border: '1px solid var(--cie-stroke)',
              background: 'var(--card)',
              opacity: 0.7
            }} />
          ))}
          <div className="spotlight-preview-target absolute" style={{ 
            left: `${left}%`, 
            top: `${top}%`, 
            width: `${width}%`, 
            height: `${height}%`,
            border: '2px solid var(--cie-ink)',
            background: 'var(--primary)',
            opacity: 0.15
          }}>
            <span className="absolute left-1 top-1 rounded px-1 py-0.5 text-[10px] font-semibold" style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: 'var(--cie-sans)',
              borderRadius: 'calc(var(--cie-r) / 3)'
            }}>{t("spotlightPreviewActive")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
