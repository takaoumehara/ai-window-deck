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
    <div className="flex flex-col gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-zinc-200">{t("spotlightPreviewTitle")}</span>
        <span className="text-zinc-500">{t("spotlightPreviewCount").replace("{count}", String(canvasSlots.length))}</span>
      </div>
      <div className="mx-auto w-full max-w-[360px] rounded-md border border-zinc-700 bg-zinc-950 p-1.5" style={{ aspectRatio: targetAspectRatio }}>
        <div className="relative h-full w-full overflow-hidden rounded-sm bg-zinc-900">
          {slots.map((slot, index) => (
            <div key={index} className="absolute border border-zinc-700 bg-zinc-800/80" style={{ left: `${slot.left}%`, top: `${slot.top}%`, width: `${slot.width}%`, height: `${slot.height}%` }} />
          ))}
          <div className="spotlight-preview-target absolute border-2 border-blue-300 bg-blue-500/30 shadow-[0_0_0_1px_rgba(96,165,250,0.35)]" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}>
            <span className="absolute left-1 top-1 rounded bg-blue-500 px-1 py-0.5 text-[10px] font-semibold text-white">{t("spotlightPreviewActive")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
