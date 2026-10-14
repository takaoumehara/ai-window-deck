import { SPOTLIGHT_SHARE, arrangedRects, clampSpotlight, shapeStructure } from "./arrangement.js";

export { SPOTLIGHT_SHARE };

export const MODES = ["grid", "spotlight", "fill"];

const FULL = { x: 0, y: 0, w: 1, h: 1 };

// share: width of the focused pane in spotlight mode; the rest share the side rail.
function spotlightRects(count, focusIndex, share) {
  const others = count - 1;
  // Past five side panes a single rail gets too short to read, so it splits in two.
  const railCols = others > 5 ? 2 : 1;
  const railRows = Math.ceil(others / railCols);
  const railWidth = 1 - share;
  const rects = [];
  let slot = 0;
  for (let i = 0; i < count; i += 1) {
    if (i === focusIndex) {
      rects.push({ x: 0, y: 0, w: share, h: 1 });
      continue;
    }
    const col = slot % railCols;
    const row = Math.floor(slot / railCols);
    const spansRail = slot === others - 1 && col === 0;
    rects.push({
      x: share + (col * railWidth) / railCols,
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
 * Hidden panes keep a rectangle so they can animate back in. `layout` is the
 * set's arrangement (lib/arrangement.js): grid shape and sizes, spotlight share.
 */
export function computePaneRects({ count, mode = "grid", focusIndex = 0, layout = null }) {
  if (count <= 0) return [];
  const focus = Math.min(Math.max(focusIndex, 0), count - 1);
  if (count === 1) return [{ ...FULL, visible: true }];
  if (mode === "fill") {
    return Array.from({ length: count }, (_, i) => ({ ...FULL, visible: i === focus }));
  }
  if (mode === "spotlight") {
    const share = layout?.spotlight == null ? SPOTLIGHT_SHARE : clampSpotlight(layout.spotlight);
    return spotlightRects(count, focus, share).map((rect) => ({ ...rect, visible: true }));
  }
  return arrangedRects(shapeStructure(layout?.shape, count), layout?.sizes).map((rect) => ({ ...rect, visible: true }));
}

// Alt+X on the focused pane: grid -> spotlight; spotlight or fill -> grid.
// Pressing it on a side pane in spotlight swaps that pane into the large slot.
export function nextModeForSpotlight(mode, { targetIsFocused = true } = {}) {
  if (mode === "grid") return "spotlight";
  if (mode === "spotlight" && !targetIsFocused) return "spotlight";
  return "grid";
}

// Whether moving between two layouts moves any pane (focus alone, in grid, doesn't).
export function layoutMoves(count, from, to) {
  const before = computePaneRects({ count, mode: from.mode, focusIndex: from.focusIndex, layout: from.layout });
  const after = computePaneRects({ count, mode: to.mode, focusIndex: to.focusIndex, layout: to.layout });
  return before.some((rect, index) => {
    const next = after[index];
    return !next || rect.visible !== next.visible || ["x", "y", "w", "h"].some((key) => Math.abs(rect[key] - next[key]) > 1e-6);
  });
}

export function cycleIndex(current, count, step) {
  if (count <= 0) return 0;
  return (((current + step) % count) + count) % count;
}
