(() => {
  const cloneCells = (cells) => cells.map((cell) => ({ ...cell }));
  const even = (count, columns) => Array.from({ length: count }, (_, index) => ({
    x: index % columns, y: Math.floor(index / columns), w: 1, h: 1,
  }));

  const evenLayouts = [
    { cols: 2, rows: 1 }, { cols: 3, rows: 1 }, { cols: 2, rows: 2 },
    { cols: 3, rows: 2 }, { cols: 4, rows: 2 }, { cols: 3, rows: 3 },
  ].map(({ cols, rows }) => ({
    id: `${cols}x${rows}`, cols, rows, cells: even(cols * rows, cols), uneven: false,
  }));

  const shapedLayouts = [
    { id: "5-center", key: "shape_5_center", cols: 4, rows: 2, cells: [
      { x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 1, w: 1, h: 1 },
      { x: 1, y: 0, w: 2, h: 2 },
      { x: 3, y: 0, w: 1, h: 1 }, { x: 3, y: 1, w: 1, h: 1 }] },
    { id: "3-left", key: "shape_3_left", cols: 3, rows: 2, cells: [
      { x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 0, w: 1, h: 1 }, { x: 2, y: 1, w: 1, h: 1 }] },
    { id: "4-top", key: "shape_4_top", cols: 3, rows: 2, cells: [
      { x: 0, y: 0, w: 3, h: 1 },
      { x: 0, y: 1, w: 1, h: 1 }, { x: 1, y: 1, w: 1, h: 1 }, { x: 2, y: 1, w: 1, h: 1 }] },
    { id: "6-center", key: "shape_6_center", cols: 4, rows: 2, cells: [
      { x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 1, w: 1, h: 1 },
      { x: 1, y: 0, w: 2, h: 1 }, { x: 1, y: 1, w: 2, h: 1 },
      { x: 3, y: 0, w: 1, h: 1 }, { x: 3, y: 1, w: 1, h: 1 }] },
  ].map((layout) => ({ ...layout, uneven: true }));

  const layouts = [...evenLayouts, ...shapedLayouts];
  const byId = (id) => layouts.find((layout) => layout.id === id);

  function selectedLayoutId(preset) {
    if (preset.layoutId === "custom" || byId(preset.layoutId)) return preset.layoutId;
    if (byId(preset.shape)) return preset.shape;
    const matchingEven = evenLayouts.find((layout) =>
      layout.cols === preset.columns && layout.rows === preset.rows);
    return matchingEven?.id ?? "custom";
  }

  function applyLayout(preset, id) {
    const layout = byId(id);
    if (!layout) throw new RangeError(`Unknown layout: ${id}`);
    Object.assign(preset, {
      layoutId: layout.id,
      columns: layout.cols,
      rows: layout.rows,
      shape: layout.uneven ? layout.id : null,
      cells: layout.uneven ? cloneCells(layout.cells) : null,
    });
    return preset;
  }

  function applyCustomGrid(preset, columns, rows) {
    Object.assign(preset, {
      layoutId: "custom",
      columns: Number(columns),
      rows: Number(rows),
      shape: null,
      cells: null,
    });
    return preset;
  }

  function applyBulkLayout(preset, count) {
    const selected = byId(selectedLayoutId(preset));
    if (selected?.uneven) return preset;
    const layout = evenLayouts.find((entry) => entry.cells.length === count)
      ?? evenLayouts.find((entry) => entry.cells.length >= count);
    if (layout) return applyLayout(preset, layout.id);
    const columns = Math.min(6, Math.ceil(Math.sqrt(count)));
    return applyCustomGrid(preset, columns, Math.ceil(count / columns));
  }

  function layoutCells(preset) {
    if (preset.cells?.length) return cloneCells(preset.cells);
    const columns = Math.max(1, Number(preset.columns) || 1);
    const rows = Math.max(1, Number(preset.rows) || 1);
    return even(columns * rows, columns);
  }

  function boardOf(cells, columns) {
    return {
      cols: Math.max(columns, ...cells.map((cell) => cell.x + cell.w)),
      rows: Math.max(1, ...cells.map((cell) => cell.y + cell.h)),
    };
  }

  function computeDynamicLayout(count, mode = "blank") {
    if (count <= 0) return { cols: 1, rows: 1, cells: [], uneven: false };

    // Try finding exact or best fit pre-defined shaped layout if mode is 'hero'
    if (mode === "hero") {
      const heroMatch = shapedLayouts.find((layout) => layout.cells.length === count);
      if (heroMatch) {
        return {
          id: heroMatch.id,
          cols: heroMatch.cols,
          rows: heroMatch.rows,
          cells: cloneCells(heroMatch.cells),
          uneven: true,
        };
      }
      if (count === 3) {
        return {
          id: "dyn-hero-3",
          cols: 3, rows: 2,
          cells: [{ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 0, w: 1, h: 1 }, { x: 2, y: 1, w: 1, h: 1 }],
          uneven: true,
        };
      }
      if (count === 4) {
        return {
          id: "dyn-hero-4",
          cols: 3, rows: 2,
          cells: [{ x: 0, y: 0, w: 3, h: 1 }, { x: 0, y: 1, w: 1, h: 1 }, { x: 1, y: 1, w: 1, h: 1 }, { x: 2, y: 1, w: 1, h: 1 }],
          uneven: true,
        };
      }
      if (count === 7) {
        return {
          id: "dyn-hero-7",
          cols: 4, rows: 2,
          cells: [
            { x: 1, y: 0, w: 2, h: 1 },
            { x: 0, y: 0, w: 1, h: 1 }, { x: 3, y: 0, w: 1, h: 1 },
            { x: 0, y: 1, w: 1, h: 1 }, { x: 1, y: 1, w: 1, h: 1 }, { x: 2, y: 1, w: 1, h: 1 }, { x: 3, y: 1, w: 1, h: 1 },
          ],
          uneven: true,
        };
      }
    }

    // Dynamic clean grid calculation:
    if (count === 1) return { id: "dyn-1", cols: 1, rows: 1, cells: [{ x: 0, y: 0, w: 1, h: 1 }], uneven: false };
    if (count === 2) return { id: "dyn-2", cols: 2, rows: 1, cells: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 1, y: 0, w: 1, h: 1 }], uneven: false };
    if (count === 3) return { id: "dyn-3", cols: 3, rows: 1, cells: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 1, y: 0, w: 1, h: 1 }, { x: 2, y: 0, w: 1, h: 1 }], uneven: false };
    if (count === 4) return { id: "dyn-4", cols: 2, rows: 2, cells: even(4, 2), uneven: false };

    if (count === 5) {
      // 3 top (w:2), 2 bottom (w:3), total cols=6
      return {
        id: "dyn-5",
        cols: 6, rows: 2,
        cells: [
          { x: 0, y: 0, w: 2, h: 1 }, { x: 2, y: 0, w: 2, h: 1 }, { x: 4, y: 0, w: 2, h: 1 },
          { x: 0, y: 1, w: 3, h: 1 }, { x: 3, y: 1, w: 3, h: 1 },
        ],
        uneven: true,
      };
    }

    if (count === 6) return { id: "dyn-6", cols: 3, rows: 2, cells: even(6, 3), uneven: false };

    if (count === 7) {
      // 4 top (w:3), 3 bottom (w:4), total cols=12
      return {
        id: "dyn-7",
        cols: 12, rows: 2,
        cells: [
          { x: 0, y: 0, w: 3, h: 1 }, { x: 3, y: 0, w: 3, h: 1 }, { x: 6, y: 0, w: 3, h: 1 }, { x: 9, y: 0, w: 3, h: 1 },
          { x: 0, y: 1, w: 4, h: 1 }, { x: 4, y: 1, w: 4, h: 1 }, { x: 8, y: 1, w: 4, h: 1 },
        ],
        uneven: true,
      };
    }

    if (count === 8) return { id: "dyn-8", cols: 4, rows: 2, cells: even(8, 4), uneven: false };
    if (count === 9) return { id: "dyn-9", cols: 3, rows: 3, cells: even(9, 3), uneven: false };

    // Default 'blank' or even fallback for larger counts:
    const cols = Math.min(6, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    const cells = even(count, cols);

    return {
      id: `dyn-even-${count}`,
      cols,
      rows,
      cells,
      uneven: false,
    };
  }

  const api = {
    layouts,
    evenLayouts,
    shapedLayouts,
    applyLayout,
    applyCustomGrid,
    applyBulkLayout,
    selectedLayoutId,
    layoutCells,
    boardOf,
    computeDynamicLayout,
  };

  globalThis.AIWindowDeckLayout = api;
  if (typeof module !== "undefined") module.exports = api;
  return api;
})();

