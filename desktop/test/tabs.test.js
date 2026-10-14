import test from "node:test";
import assert from "node:assert/strict";
import {
  addressToUrl, deviceSwitchTarget, deviceTabsToOpen, insertTab, removeTab, resolvePreviewDevices, stepZoom, tabDevicesOf, tabForNumber, withTabDevice, withUrls,
} from "../src/lib/tabs.js";
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

test("a tab keeps its own device, and a pane-level device still covers every tab", () => {
  const legacy = { urls: "https://a.com\nhttps://b.com", device: { id: "iphone-17-pro", landscape: true } };
  assert.deepEqual(tabDevicesOf(legacy), [
    { id: "iphone-17-pro", landscape: true },
    { id: "iphone-17-pro", landscape: true },
  ]);
  const changed = withTabDevice(legacy, 1, null);
  assert.equal(changed.device, undefined);
  assert.deepEqual(changed.tabDevices, [
    { id: "iphone-17-pro", landscape: true },
    null,
  ]);
  const inserted = insertTab(changed, 1, "https://c.com", { id: "ipad-air-11" });
  assert.deepEqual(inserted.tabDevices.map((device) => device?.id ?? null), ["iphone-17-pro", "ipad-air-11", null]);
  assert.deepEqual(removeTab(inserted, 0).tabDevices.map((device) => device?.id ?? null), ["ipad-air-11", null]);
  const edited = withUrls(inserted, "https://b.com\nhttps://c.com/extra\nhttps://a.com");
  assert.deepEqual(edited.tabDevices, [null, null, { id: "iphone-17-pro", landscape: true }]);
  assert.equal(insertTab({ urls: "https://a.com" }, 1, "https://b.com").tabDevices, undefined);
});

test("the device switch reuses a tab of the same page, and opening the others skips devices already shown", () => {
  const urls = ["https://a.com", "https://a.com", "https://b.com"];
  const devices = [null, { id: "iphone-17-pro", landscape: false }, null];
  assert.deepEqual(deviceSwitchTarget(urls, devices, 0, "iphone-17-pro"), { type: "select", index: 1 });
  assert.deepEqual(deviceSwitchTarget(urls, devices, 1, null), { type: "select", index: 0 });
  assert.deepEqual(deviceSwitchTarget(urls, devices, 1, "iphone-17-pro"), { type: "keep" });
  assert.deepEqual(deviceSwitchTarget(urls, devices, 0, "ipad-air-11"), { type: "assign" });
  assert.deepEqual(deviceTabsToOpen(urls, devices, 0, ["iphone-17-pro", "ipad-air-11"]), [
    { url: "https://a.com", device: { id: "ipad-air-11", landscape: false } },
  ]);
  assert.deepEqual(deviceTabsToOpen(urls, devices, 2, ["iphone-17-pro"]), [
    { url: "https://b.com", device: { id: "iphone-17-pro", landscape: false } },
  ]);
});

test("the preview list keeps known devices, and falls back to iPhone and iPad", () => {
  const catalog = [{ id: "iphone-17-pro" }, { id: "ipad-air-11" }, { id: "pixel-9" }];
  assert.deepEqual(resolvePreviewDevices(catalog).map((device) => device.id), ["iphone-17-pro", "ipad-air-11"]);
  assert.deepEqual(resolvePreviewDevices(catalog, ["pixel-9", "pixel-9", "missing", "iphone-17-pro"]).map((device) => device.id), ["pixel-9", "iphone-17-pro"]);
  assert.deepEqual(resolvePreviewDevices(catalog, []), []);
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
