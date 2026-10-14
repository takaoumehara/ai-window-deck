import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { bezelOf, deviceForPane, deviceMetrics, deviceViewport, findDevice, fitDevice } from "../src/lib/device-frame.js";

const require = createRequire(import.meta.url);
const { normalizeCatalog, normalizeDevice, mergeCatalogs, isNewer } = require("../electron/devices.cjs");
const { deviceIdentity, clientHintHeaders } = require("../electron/identity.cjs");

const bundledRaw = JSON.parse(readFileSync(new URL("../electron/devices.json", import.meta.url), "utf8"));
const siteRaw = JSON.parse(readFileSync(new URL("../../site/devices.json", import.meta.url), "utf8"));
const bundled = normalizeCatalog(bundledRaw);

test("the bundled and website catalogs are valid, and the site has every bundled device", () => {
  assert.equal(bundled.devices.length, bundledRaw.devices.length);
  const site = normalizeCatalog(siteRaw);
  assert.equal(site.devices.length, siteRaw.devices.length);
  assert.ok(!isNewer(bundled, site), "the website's catalog is at least as new as the bundled one");
  const siteIds = new Set(site.devices.map((device) => device.id));
  for (const device of bundled.devices) assert.ok(siteIds.has(device.id), device.id);
  for (const os of ["ios", "ipados", "android"]) assert.ok(bundled.devices.some((device) => device.os === os), os);
  assert.ok(bundled.devices.some((device) => device.id === "iphone-se"));
  assert.ok(bundled.devices.some((device) => /Pro Max/.test(device.name)));
});

test("invalid devices are dropped and fields are normalized", () => {
  const ok = { id: "x-1", name: " X ", os: "android", width: 400.4, height: 800, dpr: 2.5, ua: "UA" };
  assert.deepEqual(normalizeDevice(ok), {
    id: "x-1", name: "X", os: "android", type: "phone", width: 400, height: 800, dpr: 2.5, ua: "UA",
    cutout: "none", radius: 0, model: "", approx: false, hidden: false,
  });
  assert.equal(normalizeDevice({ ...ok, os: "symbian" }), null);
  assert.equal(normalizeDevice({ ...ok, id: "Bad Id" }), null);
  assert.equal(normalizeDevice({ ...ok, width: 20 }), null);
  assert.equal(normalizeDevice({ ...ok, dpr: 9 }), null);
  assert.equal(normalizeDevice({ ...ok, ua: "" }), null);
  const catalog = normalizeCatalog({ version: 2, updated: "2027-01-01", devices: [ok, { ...ok, name: "dup" }, null, "x"] });
  assert.equal(catalog.devices.length, 1);
  assert.equal(normalizeCatalog({ devices: [] }), null);
  assert.equal(normalizeCatalog("nope"), null);
});

test("a newer remote catalog adds and retires devices, and keeps ones only the app knows", () => {
  const remote = normalizeCatalog({
    version: 1,
    updated: "2099-01-01",
    devices: [
      { id: "iphone-99", name: "iPhone 99", os: "ios", width: 430, height: 930, dpr: 3, ua: "UA" },
      { ...bundledRaw.devices.find((device) => device.id === "pixel-9"), name: "Pixel 9 (renamed)" },
      { ...bundledRaw.devices.find((device) => device.id === "iphone-se"), hidden: true },
    ],
  });
  const merged = mergeCatalogs(remote, bundled);
  assert.equal(merged.updated, "2099-01-01");
  assert.equal(merged.devices[0].id, "iphone-99");
  assert.equal(merged.devices.find((device) => device.id === "pixel-9").name, "Pixel 9 (renamed)");
  assert.ok(!merged.devices.some((device) => device.id === "iphone-se"));
  assert.ok(merged.devices.some((device) => device.id === "iphone-17-pro"));
  assert.deepEqual(mergeCatalogs(bundled, remote).devices.map((device) => device.id), merged.devices.map((device) => device.id));
  const stale = { ...remote, updated: "2000-01-01" };
  assert.equal(mergeCatalogs(stale, bundled).updated, bundled.updated);
  assert.equal(mergeCatalogs(null, bundled).devices.length, bundled.devices.length);
  assert.equal(mergeCatalogs(null, null), null);
});

test("device identities: Safari without client hints, Android as mobile Chrome", () => {
  const iphone = deviceIdentity(findDevice(bundled.devices, "iphone-17-pro"), { chromeVersion: "140.0.7339.249" });
  assert.match(iphone.userAgent, /iPhone; CPU iPhone OS .* Mobile\/15E148 Safari\/604\.1$/);
  assert.equal(iphone.platform, "iPhone");
  assert.equal(iphone.metadata, null);
  assert.deepEqual(clientHintHeaders(iphone.metadata), {});
  const pixel = deviceIdentity(findDevice(bundled.devices, "pixel-9"), { chromeVersion: "140.0.7339.249" });
  assert.equal(pixel.userAgent, "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36");
  const hints = clientHintHeaders(pixel.metadata);
  assert.equal(hints["sec-ch-ua-mobile"], "?1");
  assert.equal(hints["sec-ch-ua-platform"], '"Android"');
  assert.equal(hints["sec-ch-ua-model"], '"Pixel 9"');
  assert.match(hints["sec-ch-ua"], /"Google Chrome";v="140"/);
  const ipad = deviceIdentity(findDevice(bundled.devices, "ipad-air-11"), { chromeVersion: "140.0.7339.249" });
  assert.equal(ipad.platform, "MacIntel");
});

test("rotating swaps the viewport and turns the bezel with it", () => {
  const se = findDevice(bundled.devices, "iphone-se");
  assert.deepEqual(deviceViewport(se), { width: 375, height: 667 });
  assert.deepEqual(deviceViewport(se, true), { width: 667, height: 375 });
  assert.deepEqual(bezelOf(se), { top: 64, right: 12, bottom: 64, left: 12 });
  assert.deepEqual(bezelOf(se, true), { top: 12, right: 64, bottom: 12, left: 64 });
  const pro = findDevice(bundled.devices, "iphone-17-pro");
  assert.deepEqual(bezelOf(pro), { top: 12, right: 12, bottom: 12, left: 12 });
  assert.equal(deviceMetrics(pro), "402×874 · 3×");
  assert.equal(deviceMetrics(findDevice(bundled.devices, "pixel-9"), true), "923×412 · 2.625×");
});

test("the frame fits the stage, keeps the screen's aspect, and never enlarges", () => {
  const pro = findDevice(bundled.devices, "iphone-17-pro");
  const roomy = fitDevice({ width: 2000, height: 2000 }, pro);
  assert.equal(roomy.scale, 1);
  assert.deepEqual(roomy.screen, { width: 402, height: 874 });
  const tight = fitDevice({ width: 600, height: 500 }, pro);
  const outerHeight = tight.screen.height + tight.bezel.top + tight.bezel.bottom;
  assert.ok(outerHeight <= 500 - 32 + 1);
  assert.ok(Math.abs(tight.screen.width / tight.screen.height - 402 / 874) < 0.01);
  assert.equal(tight.radius, Math.round(62 * tight.scale));
  const narrow = fitDevice({ width: 300, height: 2000 }, pro, { landscape: true });
  assert.ok(narrow.screen.width + narrow.bezel.left + narrow.bezel.right <= 300 - 32 + 1);
  assert.ok(narrow.screen.width > narrow.screen.height);
  assert.ok(fitDevice({ width: 0, height: 0 }, pro).scale > 0);
});

test("panes get the device fields the main process emulates, or nothing", () => {
  const pixel = findDevice(bundled.devices, "pixel-9");
  assert.deepEqual(deviceForPane(pixel, true), {
    id: "pixel-9", os: "android", type: "phone", width: 412, height: 923, dpr: 2.625, ua: pixel.ua, model: "Pixel 9", landscape: true,
  });
  assert.equal(deviceForPane(null, false), null);
  assert.equal(findDevice(bundled.devices, "gone", "pixel-9").id, "pixel-9");
  assert.equal(findDevice(bundled.devices, "gone", "also-gone").id, bundled.devices[0].id);
  assert.equal(findDevice([], "x"), null);
});

test("each window keeps its own device; Settings only seeds a window's first preview", async () => {
  const { togglePaneDevice, paneDeviceOf } = await import("../src/lib/device-frame.js");
  const { applyStorePatch, migrateStore } = require("../electron/store.cjs");
  const devices = bundled.devices;
  const [first, second, third] = devices;
  let item = { id: "w", name: "W", urls: "https://example.com" };
  item = togglePaneDevice(item, first.id);
  assert.deepEqual(item.device, { id: first.id, landscape: false });
  item = { ...item, device: { id: second.id, landscape: true } };
  item = togglePaneDevice(item, third.id);
  assert.equal(item.device, undefined);
  assert.deepEqual(item.lastDevice, { id: second.id, landscape: true });
  item = togglePaneDevice(item, third.id);
  assert.deepEqual(item.device, { id: second.id, landscape: true });
  assert.equal(item.lastDevice, undefined);

  assert.equal(paneDeviceOf(devices, item).id, second.id);
  assert.equal(paneDeviceOf(devices, { device: { id: "gone" } }).id, first.id);
  assert.equal(paneDeviceOf(devices, { lastDevice: { id: second.id } }), null);

  const other = { id: "v", name: "V", urls: "https://example.org", device: { id: third.id, landscape: false } };
  const saved = applyStorePatch(migrateStore(null), { put: [{ id: "s", windows: [item, other] }] });
  const reloaded = migrateStore(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(reloaded.sets[0].windows.map((entry) => entry.device), [item.device, other.device]);
});
