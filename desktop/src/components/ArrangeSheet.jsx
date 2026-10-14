import React from "react";
import { Sheet } from "@desktop/components/ui/Sheet";
import { Button } from "@desktop/components/ui/controls";
import { SHAPES, arrangedRects, shapeStructure } from "@desktop/lib/arrangement";

const SHAPE_LABELS = {
  auto: "shapeAuto",
  columns: "shapeColumns",
  rows: "shapeRows",
  grid2: "shapeGrid2",
  grid3: "shapeGrid3",
  "hero-left": "shapeHeroLeft",
  "hero-top": "shapeHeroTop",
};
export const shapeLabel = (shape) => SHAPE_LABELS[shape];

// Each option previews the shape with this set's own pane count.
function ShapePreview({ shape, count }) {
  const rects = arrangedRects(shapeStructure(shape, count));
  const width = 72;
  const height = 46;
  const gap = 1.5;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="shrink-0">
      {rects.map((rect, index) => (
        <rect
          key={index}
          x={rect.x * width + gap}
          y={rect.y * height + gap}
          width={Math.max(0, rect.w * width - gap * 2)}
          height={Math.max(0, rect.h * height - gap * 2)}
          rx="2"
          className={index === 0 ? "fill-current" : "fill-current opacity-40"}
        />
      ))}
    </svg>
  );
}

export function ArrangeSheet({ t, open, onClose, count, shape, onShape, customSizes, onResetSizes, paletteKey }) {
  const shown = Math.max(count, 2);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("arrangeTitle")}
      closeLabel={t("close")}
      wide
      footer={
        <>
          <Button onClick={onResetSizes} disabled={!customSizes} className="mr-auto">{t("cmdResetSizes")}</Button>
          <Button tone="ink" onClick={onClose}>{t("arrangeDone")}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="register uppercase text-paper-mute">{t("arrangeShapeLabel")}</h3>
          <div role="radiogroup" aria-label={t("arrangeShapeLabel")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SHAPES.map((option) => {
              const selected = option === shape;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onShape(option)}
                  className={`cie-tap ink-swap deck-focus-ring flex flex-col items-center gap-2 rounded-block border px-2 py-3 text-xs ${
                    selected ? "border-ink bg-ink text-paper" : "border-ink-edge hover:border-ink"
                  }`}
                >
                  <ShapePreview shape={option} count={shown} />
                  {t(SHAPE_LABELS[option])}
                </button>
              );
            })}
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <h3 className="register uppercase text-paper-mute">{t("arrangeHowTitle")}</h3>
          <p className="text-[13px] leading-relaxed">{t("arrangeHowResize")}</p>
          <p className="text-[13px] leading-relaxed">{t("arrangeHowMove", { palette: paletteKey })}</p>
        </section>
      </div>
    </Sheet>
  );
}
