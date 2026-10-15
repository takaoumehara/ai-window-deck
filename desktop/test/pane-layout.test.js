import test from "node:test";
import assert from "node:assert/strict";
import { computePaneRects, cycleIndex, nextModeForFocusView, FOCUS_VIEW_SHARE } from "../src/lib/pane-layout.js";

const area = (rects) => rects.filter((r) => r.visible).reduce((sum, r) => sum + r.w * r.h, 0);

test("grid fills the deck for every pane count", () => {
  for (let count = 1; count <= 12; count += 1) {
    const rects = computePaneRects({ count, mode: "grid" });
    assert.equal(rects.length, count);
    assert.ok(rects.every((r) => r.visible));
    assert.ok(area(rects) <= 1 + 1e-9, `count ${count} overlaps`);
  }
});

test("focusView gives the focused pane the large slot and keeps the rest on the rail", () => {
  const rects = computePaneRects({ count: 4, mode: "focusView", focusIndex: 2 });
  assert.deepEqual(rects[2], { x: 0, y: 0, w: FOCUS_VIEW_SHARE, h: 1, visible: true });
  for (const i of [0, 1, 3]) {
    assert.ok(Math.abs(rects[i].x - FOCUS_VIEW_SHARE) < 1e-9);
    assert.ok(Math.abs(rects[i].h - 1 / 3) < 1e-9);
  }
  assert.ok(Math.abs(area(rects) - 1) < 1e-9);
});

test("a long focusView rail splits into two columns", () => {
  const rects = computePaneRects({ count: 8, mode: "focusView", focusIndex: 0 });
  const rail = rects.slice(1);
  assert.equal(new Set(rail.map((r) => r.x.toFixed(4))).size, 2);
  assert.ok(Math.abs(area(rects) - 1) < 1e-9);
});

test("fill shows only the focused pane", () => {
  const rects = computePaneRects({ count: 3, mode: "fill", focusIndex: 1 });
  assert.deepEqual(rects.map((r) => r.visible), [false, true, false]);
  assert.deepEqual(rects[1], { x: 0, y: 0, w: 1, h: 1, visible: true });
});

test("focus index is clamped and a single pane always fills", () => {
  assert.equal(computePaneRects({ count: 3, mode: "focusView", focusIndex: 9 })[2].w, FOCUS_VIEW_SHARE);
  assert.deepEqual(computePaneRects({ count: 1, mode: "focusView" }), [{ x: 0, y: 0, w: 1, h: 1, visible: true }]);
  assert.deepEqual(computePaneRects({ count: 0 }), []);
});

test("focusView toggles, and swaps instead of closing when a side pane is picked", () => {
  assert.equal(nextModeForFocusView("grid"), "focusView");
  assert.equal(nextModeForFocusView("focusView"), "grid");
  assert.equal(nextModeForFocusView("fill"), "grid");
  assert.equal(nextModeForFocusView("focusView", { targetIsFocused: false }), "focusView");
});

test("cycleIndex wraps both ways", () => {
  assert.equal(cycleIndex(3, 4, 1), 0);
  assert.equal(cycleIndex(0, 4, -1), 3);
  assert.equal(cycleIndex(0, 0, 1), 0);
});
