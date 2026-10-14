import test from "node:test";
import assert from "node:assert/strict";
import { addressToUrl, insertTab, removeTab, stepZoom, tabForNumber } from "../src/lib/tabs.js";
import { layoutMoves } from "../src/lib/pane-layout.js";

test("address bar: URLs open, words search", () => {
  assert.equal(addressToUrl("claude.ai"), "https://claude.ai");
  assert.equal(addressToUrl("https://x.com/a b"), "https://x.com/a b");
  assert.equal(addressToUrl("localhost:5173"), "http://localhost:5173");
  assert.equal(addressToUrl("best ai tools"), "https://www.google.com/search?q=best%20ai%20tools");
  assert.equal(addressToUrl("   "), null);
});

test("tabs insert and close inside a window's URL list", () => {
  const item = { id: "w", urls: "https://a.com\nhttps://b.com" };
  assert.equal(insertTab(item, 1, "https://c.com").urls, "https://a.com\nhttps://c.com\nhttps://b.com");
  assert.equal(removeTab(item, 0).urls, "https://b.com");
});

test("⌘1–8 pick a tab, ⌘9 the last one", () => {
  assert.equal(tabForNumber(2, 3), 1);
  assert.equal(tabForNumber(5, 3), null);
  assert.equal(tabForNumber(9, 3), 2);
});

test("zoom walks Chrome-like steps", () => {
  assert.equal(stepZoom(1, 1), 1.1);
  assert.equal(stepZoom(1, -1), 0.9);
  assert.equal(stepZoom(1.3, 0), 1);
  assert.equal(stepZoom(3, 1), 3);
});

test("focus changes in grid don't count as a layout move", () => {
  assert.equal(layoutMoves(4, { mode: "grid", focusIndex: 0 }, { mode: "grid", focusIndex: 2 }), false);
  assert.equal(layoutMoves(4, { mode: "grid", focusIndex: 0 }, { mode: "fill", focusIndex: 0 }), true);
  assert.equal(layoutMoves(4, { mode: "spotlight", focusIndex: 0 }, { mode: "spotlight", focusIndex: 1 }), true);
});

test("reordering URLs: move, drop gaps, and indexes that follow the move", async () => {
  const { moveItem, dropTarget, indexAfterMove, moveTab } = await import("../src/lib/tabs.js");
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 3, 0), ["d", "a", "b", "c"]);
  assert.deepEqual(moveItem(["a", "b"], 1, 9), ["a", "b"]);
  const same = ["a", "b"];
  assert.equal(moveItem(same, 1, 1), same);
  assert.equal(moveItem(same, 0, -1), same);

  assert.equal(dropTarget(0, 3), 2);
  assert.equal(dropTarget(3, 0), 0);
  assert.equal(dropTarget(1, 2), 1);

  const list = ["a", "b", "c", "d"];
  const moved = moveItem(list, 0, 2);
  for (let index = 0; index < list.length; index += 1) assert.equal(moved[indexAfterMove(index, 0, 2)], list[index]);
  const back = moveItem(list, 3, 1);
  for (let index = 0; index < list.length; index += 1) assert.equal(back[indexAfterMove(index, 3, 1)], list[index]);

  const item = { id: "w", urls: "https://claude.ai\nvercel.com\nhttps://moime.app" };
  assert.equal(moveTab(item, 2, 0).urls, "https://moime.app\nhttps://claude.ai\nhttps://vercel.com");
  assert.equal(moveTab(item, 1, 1), item);
});
