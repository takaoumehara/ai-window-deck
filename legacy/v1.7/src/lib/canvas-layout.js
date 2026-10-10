const GRID = 12;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const LAYOUT_FAMILIES = [
  { id: "auto", label: "Auto" },
  { id: "stack", label: "Vertical" },
  { id: "row", label: "Horizontal" },
  { id: "grid", label: "Grid" },
  { id: "custom", label: "Freeform" },
];

function gridDimensions(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  const cols = Math.ceil(Math.sqrt(count));
  return { cols, rows: Math.ceil(count / cols) };
}

function cellsFor(count, family) {
  if (!count) return [];
  if (family === "stack") return Array.from({ length: count }, (_, index) => ({ x: 0, y: index, w: 1, h: 1, cols: 1, rows: count }));
  if (family === "row") return Array.from({ length: count }, (_, index) => ({ x: index, y: 0, w: 1, h: 1, cols: count, rows: 1 }));

  if (family === "hero" && count >= 3) {
    const cells = [{ x: 0, y: 0, w: 2, h: 2, cols: 3, rows: 2 }];
    for (let index = 1; index < count; index += 1) {
      const position = index - 1;
      cells.push({ x: 2 + (position % 1), y: position % 2, w: 1, h: 1, cols: 3, rows: Math.max(2, Math.ceil((count + 1) / 2)) });
    }
    return cells;
  }

  const { cols, rows } = gridDimensions(count);
  return Array.from({ length: count }, (_, index) => ({ x: index % cols, y: Math.floor(index / cols), w: 1, h: 1, cols, rows }));
}

export function applyLayoutFamily(slots, family = "auto") {
  if (family === "custom") return slots.map((slot) => ({ ...slot }));
  const cells = cellsFor(slots.length, family);
  return slots.map((slot, index) => {
    const cell = cells[index];
    const gridW = Math.max(1, Math.round((cell.w / cell.cols) * GRID));
    const gridH = Math.max(1, Math.round((cell.h / cell.rows) * GRID));
    return {
      ...slot,
      gridX: clamp(Math.round((cell.x / cell.cols) * GRID), 0, GRID - gridW),
      gridY: clamp(Math.round((cell.y / cell.rows) * GRID), 0, GRID - gridH),
      gridW,
      gridH,
    };
  });
}

export function makeBlankSlot(index) {
  return { id: `slot-${Date.now()}-${index}`, name: `Window ${index + 1}`, urls: "", color: "auto" };
}

export function slotsWithCount(slots, count, family) {
  const next = slots.slice(0, count).map((slot) => ({ ...slot }));
  while (next.length < count) next.push(makeBlankSlot(next.length));
  return applyLayoutFamily(next, family);
}

export function appendSlot(slots, item, family) {
  const next = [...slots.map((slot) => ({ ...slot })), {
    ...item,
    id: `slot-${Date.now()}-${slots.length}`,
    registeredWindowId: item.id,
  }];
  return applyLayoutFamily(next, family === "custom" ? "auto" : family);
}

export function replaceSlot(slots, index, item) {
  return slots.map((slot, slotIndex) => (
    slotIndex === index
      ? { ...slot, ...item, id: slot.id, registeredWindowId: item.id }
      : { ...slot }
  ));
}

function isBlankSlot(slot) {
  const urls = Array.isArray(slot.urls) ? slot.urls : String(slot.urls ?? "").split("\n");
  return !urls.some((url) => String(url).trim());
}

// A visible gap can belong to an occupied tile's outer hit area. Treat every
// occupied target as an append so a saved card is never blocked by that hit area.
export function placeDroppedSlot(slots, index, item, family) {
  if (Number.isInteger(index) && index >= 0 && index < slots.length && isBlankSlot(slots[index])) {
    return replaceSlot(slots, index, item);
  }
  return appendSlot(slots, item, family);
}
