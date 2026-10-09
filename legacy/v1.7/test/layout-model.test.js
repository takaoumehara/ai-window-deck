import assert from "node:assert/strict";
import test from "node:test";
import "../layout-model.js";
const layout = globalThis.AIWindowDeckLayout;

test("an uneven layout keeps its concrete unequal cells", () => {
  const preset = {};

  layout.applyLayout(preset, "3-left");

  assert.equal(preset.layoutId, "3-left");
  assert.deepEqual(preset.cells, [
    { x: 0, y: 0, w: 2, h: 2 },
    { x: 2, y: 0, w: 1, h: 1 },
    { x: 2, y: 1, w: 1, h: 1 },
  ]);
});

test("custom even grid clears an uneven layout selection and cells", () => {
  const preset = {};
  layout.applyLayout(preset, "3-left");

  layout.applyCustomGrid(preset, 3, 1);

  assert.equal(preset.layoutId, "custom");
  assert.equal(preset.shape, null);
  assert.equal(preset.cells, null);
  assert.deepEqual([preset.columns, preset.rows], [3, 1]);
});

test("bulk URL entry preserves a selected uneven layout", () => {
  const preset = {};
  layout.applyLayout(preset, "5-center");

  layout.applyBulkLayout(preset, 3);

  assert.equal(preset.layoutId, "5-center");
  assert.equal(preset.cells.length, 5);
  assert.deepEqual([preset.columns, preset.rows], [4, 2]);
});

test("bulk URL entry chooses an even layout when no uneven shape is selected", () => {
  const preset = { layoutId: "custom", columns: 4, rows: 2, cells: null };

  layout.applyBulkLayout(preset, 3);

  assert.notEqual(preset.layoutId, "custom");
  assert.equal(preset.cells, null);
  assert.equal(preset.columns * preset.rows >= 3, true);
});

test("computeDynamicLayout correctly computes grid for odd and even counts with blank and hero modes", () => {
  const even3 = layout.computeDynamicLayout(3, "blank");
  assert.equal(even3.cols, 3);
  assert.equal(even3.cells.length, 3);

  const hero3 = layout.computeDynamicLayout(3, "hero");
  assert.equal(hero3.uneven, true);
  assert.equal(hero3.cells[0].w, 2);

  const hero7 = layout.computeDynamicLayout(7, "hero");
  assert.equal(hero7.cols, 4);
  assert.equal(hero7.cells.length, 7);
  assert.equal(hero7.uneven, true);
});

