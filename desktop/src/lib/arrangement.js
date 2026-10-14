// A set's grid arrangement: a shape (how panes split into rows or columns)
// and the sizes the user dragged them to. Stored on the set as
// `layout: { shape, sizes, spotlight }` and undoable like the window list.
//
// A shape resolves to tracks stacked along one direction: with dir "rows"
// each track is a row and its panes sit side by side; with dir "cols" each
// track is a column and its panes stack. Sizes are fractions (each list sums
// to 1) keyed to that structure, so a shape or pane-count change falls back
// to equal sizes instead of misapplying old ones.

export const SHAPES = ["auto", "columns", "rows", "grid2", "grid3", "hero-left", "hero-top"];

export const SPOTLIGHT_SHARE = 0.72;
export const SPOTLIGHT_RANGE = [0.4, 0.85];

const AUTO_ROWS = { 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [3, 3], 7: [4, 3], 8: [4, 4] };

function chunk(count, size) {
  const tracks = [];
  for (let left = count; left > 0; left -= size) tracks.push(Math.min(size, left));
  return tracks;
}

export function normalizeShape(shape) {
  return SHAPES.includes(shape) ? shape : "auto";
}

export function shapeStructure(shape, count) {
  if (count <= 0) return { dir: "rows", tracks: [] };
  if (count === 1) return { dir: "rows", tracks: [1] };
  switch (normalizeShape(shape)) {
    case "columns":
      return { dir: "rows", tracks: [count] };
    case "rows":
      return { dir: "cols", tracks: [count] };
    case "grid2":
      return { dir: "rows", tracks: chunk(count, 2) };
    case "grid3":
      return { dir: "rows", tracks: chunk(count, 3) };
    case "hero-left":
      return { dir: "cols", tracks: [1, count - 1] };
    case "hero-top":
      return { dir: "rows", tracks: [1, count - 1] };
    default:
      return { dir: "rows", tracks: AUTO_ROWS[count] ?? chunk(count, Math.ceil(Math.sqrt(count))) };
  }
}

export const structureKey = (structure) => `${structure.dir}:${structure.tracks.join(",")}`;

const equal = (n) => Array.from({ length: n }, () => 1 / n);

function normalized(list) {
  const total = list.reduce((sum, value) => sum + value, 0);
  return list.map((value) => value / total);
}

const validList = (list, length) =>
  Array.isArray(list) && list.length === length && list.every((value) => Number.isFinite(value) && value > 0);

export function equalSizes(structure) {
  return { key: structureKey(structure), tracks: equal(structure.tracks.length), items: structure.tracks.map(equal) };
}

/** The stored sizes when they fit this structure, otherwise equal ones. */
export function resolveSizes(structure, sizes) {
  const key = structureKey(structure);
  if (
    sizes?.key !== key ||
    !validList(sizes.tracks, structure.tracks.length) ||
    !Array.isArray(sizes.items) ||
    !structure.tracks.every((n, index) => validList(sizes.items[index], n))
  ) {
    return equalSizes(structure);
  }
  return { key, tracks: normalized(sizes.tracks), items: sizes.items.map(normalized) };
}

/** Fractional rects (0..1 of the deck) in pane order. */
export function arrangedRects(structure, sizes) {
  const { tracks, items } = resolveSizes(structure, sizes);
  const rects = [];
  let offset = 0;
  structure.tracks.forEach((n, t) => {
    const span = tracks[t];
    let cross = 0;
    for (let j = 0; j < n; j += 1) {
      const size = items[t][j];
      rects.push(structure.dir === "rows" ? { x: cross, y: offset, w: size, h: span } : { x: offset, y: cross, w: span, h: size });
      cross += size;
    }
    offset += span;
  });
  return rects;
}

/**
 * Draggable boundaries. `axis` is the coordinate a handle moves along ("x":
 * a vertical line, col-resize). `before` / `after` are the pane indexes on
 * either side, for labels. `value` is the share of the first side, 0..1.
 */
export function arrangementHandles(structure, sizes) {
  const { tracks, items } = resolveSizes(structure, sizes);
  const trackAxis = structure.dir === "rows" ? "y" : "x";
  const itemAxis = trackAxis === "y" ? "x" : "y";
  const firstPane = [];
  structure.tracks.reduce((index, n) => (firstPane.push(index), index + n), 0);
  const handles = [];
  let offset = 0;
  structure.tracks.forEach((n, t) => {
    const span = tracks[t];
    let cross = 0;
    for (let j = 0; j < n - 1; j += 1) {
      cross += items[t][j];
      handles.push({
        id: `item:${t}:${j}`,
        axis: itemAxis,
        position: cross,
        start: offset,
        length: span,
        before: firstPane[t] + j,
        after: firstPane[t] + j + 1,
        value: items[t][j] / (items[t][j] + items[t][j + 1]),
      });
    }
    offset += span;
    if (t < structure.tracks.length - 1) {
      handles.push({
        id: `track:${t}`,
        axis: trackAxis,
        position: offset,
        start: 0,
        length: 1,
        before: firstPane[t],
        after: firstPane[t + 1],
        value: tracks[t] / (tracks[t] + tracks[t + 1]),
      });
    }
  });
  return handles;
}

function shift(list, index, delta, min) {
  const a = list[index];
  const b = list[index + 1];
  const floor = Math.min(min, (a + b) / 2);
  const d = Math.max(floor - a, Math.min(b - floor, delta));
  const next = [...list];
  next[index] = a + d;
  next[index + 1] = b - d;
  return next;
}

/** Sizes after moving one handle by `delta` (a fraction of the deck), keeping each side ≥ min. */
export function resizeArrangement(structure, sizes, handleId, delta, min = 0.1) {
  const current = resolveSizes(structure, sizes);
  const [kind, first, second] = handleId.split(":").map((part, index) => (index ? Number(part) : part));
  if (kind === "track" && first < structure.tracks.length - 1) {
    return { ...current, tracks: shift(current.tracks, first, delta, min) };
  }
  if (kind === "item" && second < structure.tracks[first] - 1) {
    const items = current.items.map((list, index) => (index === first ? shift(list, second, delta, min) : list));
    return { ...current, items };
  }
  return current;
}

export function clampSpotlight(share) {
  const [low, high] = SPOTLIGHT_RANGE;
  return Number.isFinite(share) ? Math.min(high, Math.max(low, share)) : SPOTLIGHT_SHARE;
}

export function normalizeLayout(layout) {
  if (!layout || typeof layout !== "object") return null;
  const next = { shape: normalizeShape(layout.shape) };
  if (layout.sizes && typeof layout.sizes === "object") next.sizes = layout.sizes;
  if (Number.isFinite(layout.spotlight)) next.spotlight = clampSpotlight(layout.spotlight);
  return next;
}

/** Swaps two windows in the list, by id. */
export function swapItems(list, aId, bId) {
  const a = list.findIndex((item) => item.id === aId);
  const b = list.findIndex((item) => item.id === bId);
  if (a < 0 || b < 0 || a === b) return list;
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/** Moves window `id` to just before (or after) `targetId`. */
export function insertAround(list, id, targetId, after = false) {
  const from = list.findIndex((item) => item.id === id);
  if (from < 0 || id === targetId || !list.some((item) => item.id === targetId)) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  const at = next.findIndex((item) => item.id === targetId) + (after ? 1 : 0);
  next.splice(at, 0, moved);
  return next.every((item, index) => item === list[index]) ? list : next;
}

/**
 * Where a dragged pane lands on another: the middle swaps, the outer quarters
 * along the pane's longer side insert before or after it.
 */
export function dropZone(box, x, y) {
  const horizontal = box.width >= box.height;
  const ratio = horizontal ? (x - box.left) / box.width : (y - box.top) / box.height;
  if (ratio < 0.25) return horizontal ? "left" : "top";
  if (ratio > 0.75) return horizontal ? "right" : "bottom";
  return "swap";
}
