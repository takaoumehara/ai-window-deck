import assert from "node:assert/strict";
import test from "node:test";
import { appendSlot, applyLayoutFamily, placeDroppedSlot, replaceSlot, slotsWithCount } from "../src/lib/canvas-layout.js";

test("stack layout makes four full-width vertical tiles", () => {
  const slots = slotsWithCount([], 4, "stack");
  assert.deepEqual(slots.map(({ gridX, gridY, gridW, gridH }) => ({ gridX, gridY, gridW, gridH })), [
    { gridX: 0, gridY: 0, gridW: 12, gridH: 3 },
    { gridX: 0, gridY: 3, gridW: 12, gridH: 3 },
    { gridX: 0, gridY: 6, gridW: 12, gridH: 3 },
    { gridX: 0, gridY: 9, gridW: 12, gridH: 3 },
  ]);
});

test("grid layout makes nine 3 by 3 tiles", () => {
  const slots = slotsWithCount([], 9, "grid");
  assert.equal(new Set(slots.map((slot) => slot.gridW)).size, 1);
  assert.deepEqual(slots[8], { ...slots[8], gridX: 8, gridY: 8, gridW: 4, gridH: 4 });
});

test("background append increases count and empty-slot replacement keeps count and position", () => {
  const original = applyLayoutFamily([{ id: "slot-a", name: "Empty", urls: "" }], "grid");
  const appended = appendSlot(original, { id: "win-a", name: "Docs", urls: "https://docs.example" }, "grid");
  const replaced = replaceSlot(original, 0, { id: "win-a", name: "Docs", urls: "https://docs.example" });
  assert.equal(appended.length, 2);
  assert.equal(replaced.length, 1);
  assert.deepEqual(replaced[0], { ...original[0], registeredWindowId: "win-a", name: "Docs", urls: "https://docs.example" });
});

test("an empty canvas accepts a background append", () => {
  const slots = appendSlot([], { id: "win-first", name: "First", urls: "https://first.example" }, "auto");
  assert.equal(slots.length, 1);
  assert.equal(slots[0].registeredWindowId, "win-first");
  assert.deepEqual([slots[0].gridX, slots[0].gridY, slots[0].gridW, slots[0].gridH], [0, 0, 12, 12]);
});

test("dropping on an occupied tile or its visible gutter appends a new slot", () => {
  const filled = applyLayoutFamily([{ id: "slot-a", name: "Existing", urls: "https://existing.example" }], "grid");
  const result = placeDroppedSlot(filled, 0, { id: "win-next", name: "Next", urls: "https://next.example" }, "grid");

  assert.equal(result.length, 2);
  assert.equal(result[0].name, "Existing");
  assert.equal(result[1].registeredWindowId, "win-next");
});

test("dropping on a blank tile replaces that tile without increasing the count", () => {
  const blank = applyLayoutFamily([{ id: "slot-a", name: "Empty", urls: "" }], "grid");
  const result = placeDroppedSlot(blank, 0, { id: "win-next", name: "Next", urls: "https://next.example" }, "grid");

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "slot-a");
  assert.equal(result[0].registeredWindowId, "win-next");
});
