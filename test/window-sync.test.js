import assert from "node:assert/strict";
import test from "node:test";
import { applyCanvasWindowEdit, resolveRegisteredWindowId } from "../src/lib/window-sync.js";

test("resolves a dropped canvas slot to its registered window through its source ID", () => {
  const windows = [{ id: "win-research", name: "Research", urls: "https://docs.example" }];
  const slot = { id: "slot-1", registeredWindowId: "win-research", name: "Research", urls: "https://docs.example" };

  assert.equal(resolveRegisteredWindowId(slot, windows), "win-research");
});

test("falls back to a legacy matching record and saves a canvas edit in both locations", () => {
  const windows = [{ id: "win-research", name: "Research", urls: "https://docs.example" }];
  const canvasSlots = [{ id: "slot-1", name: "Research", urls: "https://docs.example", gridX: 0, gridY: 0, gridW: 6, gridH: 12 }];

  const result = applyCanvasWindowEdit({
    windows,
    canvasSlots,
    editingItem: canvasSlots[0],
    name: "Research & API",
    urls: "https://docs.example\nhttps://api.example",
  });

  assert.deepEqual(result.windows, [{
    id: "win-research",
    name: "Research & API",
    urls: "https://docs.example\nhttps://api.example",
  }]);
  assert.deepEqual(result.canvasSlots, [{
    id: "slot-1",
    registeredWindowId: "win-research",
    name: "Research & API",
    urls: "https://docs.example\nhttps://api.example",
    gridX: 0,
    gridY: 0,
    gridW: 6,
    gridH: 12,
  }]);
});
