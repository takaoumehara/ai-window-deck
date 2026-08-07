// Layout Model Grid Mathematics for AI Window Deck
export function computeDynamicLayout(count, oddMode = "blank") {
  if (count <= 0) return { cols: 1, rows: 1, cells: [] };

  if (count === 1) {
    return { cols: 1, rows: 1, cells: [{ x: 0, y: 0, w: 1, h: 1 }] };
  }

  if (count === 2) {
    return {
      cols: 2,
      rows: 1,
      cells: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
      ],
    };
  }

  if (count === 3) {
    if (oddMode === "hero") {
      return {
        cols: 2,
        rows: 2,
        cells: [
          { x: 0, y: 0, w: 2, h: 1 },
          { x: 0, y: 1, w: 1, h: 1 },
          { x: 1, y: 1, w: 1, h: 1 },
        ],
      };
    }
    return {
      cols: 3,
      rows: 1,
      cells: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 2, y: 0, w: 1, h: 1 },
      ],
    };
  }

  if (count === 4) {
    return {
      cols: 2,
      rows: 2,
      cells: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 0, y: 1, w: 1, h: 1 },
        { x: 1, y: 1, w: 1, h: 1 },
      ],
    };
  }

  if (count === 5) {
    return {
      cols: 6,
      rows: 2,
      cells: [
        { x: 0, y: 0, w: 2, h: 1 },
        { x: 2, y: 0, w: 2, h: 1 },
        { x: 4, y: 0, w: 2, h: 1 },
        { x: 0, y: 1, w: 3, h: 1 },
        { x: 3, y: 1, w: 3, h: 1 },
      ],
    };
  }

  if (count === 6) {
    return {
      cols: 3,
      rows: 2,
      cells: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 2, y: 0, w: 1, h: 1 },
        { x: 0, y: 1, w: 1, h: 1 },
        { x: 1, y: 1, w: 1, h: 1 },
        { x: 2, y: 1, w: 1, h: 1 },
      ],
    };
  }

  if (count === 7) {
    return {
      cols: 12,
      rows: 2,
      cells: [
        { x: 0, y: 0, w: 3, h: 1 },
        { x: 3, y: 0, w: 3, h: 1 },
        { x: 6, y: 0, w: 3, h: 1 },
        { x: 9, y: 0, w: 3, h: 1 },
        { x: 0, y: 1, w: 4, h: 1 },
        { x: 4, y: 1, w: 4, h: 1 },
        { x: 8, y: 1, w: 4, h: 1 },
      ],
    };
  }

  if (count === 8) {
    return {
      cols: 4,
      rows: 2,
      cells: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 2, y: 0, w: 1, h: 1 },
        { x: 3, y: 0, w: 1, h: 1 },
        { x: 0, y: 1, w: 1, h: 1 },
        { x: 1, y: 1, w: 1, h: 1 },
        { x: 2, y: 1, w: 1, h: 1 },
        { x: 3, y: 1, w: 1, h: 1 },
      ],
    };
  }

  // Fallback for N > 8
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cells = [];
  for (let i = 0; i < count; i++) {
    cells.push({
      x: i % cols,
      y: Math.floor(i / cols),
      w: 1,
      h: 1,
    });
  }
  return { cols, rows, cells };
}
