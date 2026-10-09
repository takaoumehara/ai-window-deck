import { computeDynamicLayout } from "../../../src/lib/layout-model.js";

export const MODES = ["grid", "spotlight", "fill"];

// Width of the focused pane in spotlight mode; the rest share the side rail.
export const SPOTLIGHT_SHARE = 0.72;

const FULL = { x: 0, y: 0, w: 1, h: 1 };

function gridRects(count) {
  const { cols, rows, cells } = computeDynamicLayout(count);
  return cells.map((cell) => ({
    x: cell.x / cols,
    y: cell.y / rows,
    w: cell.w / cols,
    h: cell.h / rows,
  }));
}

function spotlightRects(count, focusIndex) {
  const others = count - 1;
  // Past five side panes a single rail gets too short to read, so it splits in two.
  const railCols = others > 5 ? 2 : 1;
  const railRows = Math.ceil(others / railCols);
  const railWidth = 1 - SPOTLIGHT_SHARE;
  const rects = [];
  let slot = 0;
  for (let i = 0; i < count; i += 1) {
    if (i === focusIndex) {
      rects.push({ x: 0, y: 0, w: SPOTLIGHT_SHARE, h: 1 });
      continue;
    }
    const col = slot % railCols;
    const row = Math.floor(slot / railCols);
    const spansRail = slot === others - 1 && col === 0;
    rects.push({
      x: SPOTLIGHT_SHARE + (col * railWidth) / railCols,
      y: row / railRows,
      w: spansRail ? railWidth : railWidth / railCols,
      h: 1 / railRows,
    });
    slot += 1;
  }
  return rects;
}

/**
 * Fractional rectangles (0..1 of the deck area) for each pane, in pane order.
 * Hidden panes keep a rectangle so they can animate back in.
 */
export function computePaneRects({ count, mode = "grid", focusIndex = 0 }) {
  if (count <= 0) return [];
  const focus = Math.min(Math.max(focusIndex, 0), count - 1);
  if (count === 1) return [{ ...FULL, visible: true }];
  if (mode === "fill") {
    return Array.from({ length: count }, (_, i) => ({ ...FULL, visible: i === focus }));
  }
  if (mode === "spotlight") {
    return spotlightRects(count, focus).map((rect) => ({ ...rect, visible: true }));
  }
  return gridRects(count).map((rect) => ({ ...rect, visible: true }));
}

// Alt+X on the focused pane: grid -> spotlight; spotlight or fill -> grid.
// Pressing it on a side pane in spotlight swaps that pane into the large slot.
export function nextModeForSpotlight(mode, { targetIsFocused = true } = {}) {
  if (mode === "grid") return "spotlight";
  if (mode === "spotlight" && !targetIsFocused) return "spotlight";
  return "grid";
}

export function cycleIndex(current, count, step) {
  if (count <= 0) return 0;
  return (((current + step) % count) + count) % count;
}
