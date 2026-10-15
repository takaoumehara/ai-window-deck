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
  assert.equal(layoutMoves(4, { mode: "focusView", focusIndex: 0 }, { mode: "focusView", focusIndex: 1 }), true);
});
