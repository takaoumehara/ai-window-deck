import test from "node:test";
import assert from "node:assert/strict";
import {
  SHAPES,
  arrangedRects,
  arrangementHandles,
  clampSpotlight,
  dropZone,
  equalSizes,
  insertAround,
  normalizeLayout,
  resizeArrangement,
  resolveSizes,
  shapeStructure,
  swapItems,
} from "../src/lib/arrangement.js";
import { computePaneRects, layoutMoves } from "../src/lib/pane-layout.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;
const area = (rects) => rects.reduce((sum, r) => sum + r.w * r.h, 0);
const overlaps = (a, b) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;

test("every shape tiles the deck exactly, for 1–12 panes", () => {
  for (const shape of SHAPES) {
    for (let count = 1; count <= 12; count += 1) {
      const structure = shapeStructure(shape, count);
      assert.equal(structure.tracks.reduce((a, b) => a + b, 0), count, `${shape} ${count}`);
      const rects = arrangedRects(structure);
      assert.equal(rects.length, count);
      assert.ok(close(area(rects), 1), `${shape} ${count} leaves a gap`);
      rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => assert.ok(!overlaps(a, b), `${shape} ${count} overlaps`)));
    }
  }
});

test("auto keeps the familiar rows: 4 is 2×2, 5 is 3 over 2, 7 is 4 over 3", () => {
  assert.deepEqual(shapeStructure("auto", 4), { dir: "rows", tracks: [2, 2] });
  assert.deepEqual(shapeStructure("auto", 5), { dir: "rows", tracks: [3, 2] });
  assert.deepEqual(shapeStructure("auto", 7), { dir: "rows", tracks: [4, 3] });
  assert.deepEqual(shapeStructure("auto", 10), { dir: "rows", tracks: [4, 4, 2] });
  assert.deepEqual(shapeStructure("nonsense", 3), shapeStructure("auto", 3));
});

test("hero shapes give the first pane a whole column or row", () => {
  const left = arrangedRects(shapeStructure("hero-left", 4));
  assert.deepEqual(left[0], { x: 0, y: 0, w: 0.5, h: 1 });
  assert.ok(left.slice(1).every((r) => close(r.x, 0.5) && close(r.h, 1 / 3)));
  const top = arrangedRects(shapeStructure("hero-top", 3));
  assert.deepEqual(top[0], { x: 0, y: 0, w: 1, h: 0.5 });
});

test("sizes that don't match the structure fall back to equal ones", () => {
  const four = shapeStructure("auto", 4);
  const sizes = resizeArrangement(four, null, "track:0", 0.2);
  assert.ok(close(resolveSizes(four, sizes).tracks[0], 0.7));
  const five = shapeStructure("auto", 5);
  assert.deepEqual(resolveSizes(five, sizes), equalSizes(five));
  assert.deepEqual(resolveSizes(four, { key: sizes.key, tracks: [1, -1], items: sizes.items }), equalSizes(four));
});

test("dragging a column boundary in one row only resizes that row", () => {
  const structure = shapeStructure("auto", 4);
  const sizes = resizeArrangement(structure, null, "item:1:0", 0.1);
  const rects = arrangedRects(structure, sizes);
  assert.ok(close(rects[0].w, 0.5) && close(rects[1].w, 0.5));
  assert.ok(close(rects[2].w, 0.6) && close(rects[3].w, 0.4));
});

test("a resize never squeezes a pane below the minimum", () => {
  const structure = shapeStructure("columns", 3);
  const sizes = resizeArrangement(structure, null, "item:0:0", 0.9, 0.1);
  const rects = arrangedRects(structure, sizes);
  assert.ok(close(rects[1].w, 0.1));
  assert.ok(close(area(rects), 1));
  const back = resizeArrangement(structure, sizes, "item:0:0", -5, 0.1);
  assert.ok(close(arrangedRects(structure, back)[0].w, 0.1));
});

test("handles sit on every inner boundary and name the panes beside them", () => {
  const structure = shapeStructure("auto", 5);
  const handles = arrangementHandles(structure);
  assert.deepEqual(handles.map((h) => h.id).sort(), ["item:0:0", "item:0:1", "item:1:0", "track:0"]);
  const row = handles.find((h) => h.id === "track:0");
  assert.equal(row.axis, "y");
  assert.ok(close(row.position, 0.5));
  assert.deepEqual([row.before, row.after], [0, 3]);
  const bottom = handles.find((h) => h.id === "item:1:0");
  assert.equal(bottom.axis, "x");
  assert.deepEqual([bottom.before, bottom.after], [3, 4]);
  assert.ok(close(bottom.start, 0.5) && close(bottom.length, 0.5));
  assert.equal(arrangementHandles(shapeStructure("auto", 1)).length, 0);
});

test("grid panes follow the set's layout; spotlight follows its share", () => {
  const layout = { shape: "rows" };
  const rects = computePaneRects({ count: 3, mode: "grid", layout });
  assert.ok(rects.every((r) => close(r.w, 1) && close(r.h, 1 / 3)));
  const spot = computePaneRects({ count: 3, mode: "spotlight", focusIndex: 0, layout: { spotlight: 0.5 } });
  assert.ok(close(spot[0].w, 0.5) && close(spot[1].x, 0.5));
  assert.ok(layoutMoves(3, { mode: "grid", focusIndex: 0 }, { mode: "grid", focusIndex: 0, layout }));
  assert.equal(clampSpotlight(2), 0.85);
});

test("normalizeLayout keeps known fields only", () => {
  assert.equal(normalizeLayout(null), null);
  assert.deepEqual(normalizeLayout({ shape: "zigzag", spotlight: 0.1, junk: 1 }), { shape: "auto", spotlight: 0.4 });
});

test("swap and insert reorder windows by id", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  assert.deepEqual(swapItems(list, "a", "c").map((w) => w.id), ["c", "b", "a", "d"]);
  assert.equal(swapItems(list, "a", "zz"), list);
  assert.deepEqual(insertAround(list, "a", "c").map((w) => w.id), ["b", "a", "c", "d"]);
  assert.deepEqual(insertAround(list, "d", "a", false).map((w) => w.id), ["d", "a", "b", "c"]);
  assert.deepEqual(insertAround(list, "a", "d", true).map((w) => w.id), ["b", "c", "d", "a"]);
  assert.equal(insertAround(list, "a", "b"), list);
});

test("drop zones: the middle swaps, the outer quarters insert", () => {
  const wide = { left: 0, top: 0, width: 400, height: 200 };
  assert.equal(dropZone(wide, 50, 100), "left");
  assert.equal(dropZone(wide, 200, 100), "swap");
  assert.equal(dropZone(wide, 390, 10), "right");
  const tall = { left: 0, top: 0, width: 200, height: 400 };
  assert.equal(dropZone(tall, 100, 20), "top");
  assert.equal(dropZone(tall, 100, 380), "bottom");
});
