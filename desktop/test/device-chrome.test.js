import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromeAppearance, chromeScrollIntent, deviceChromeCss, hostOf } = require("../electron/device-chrome.cjs");

test("phones get a bottom Safari bar, tablets a top one, and Android a top Chrome bar", () => {
  assert.deepEqual(chromeAppearance({ os: "ios", type: "phone", radius: 62 }), { edge: "bottom", kind: "safari", home: true });
  assert.deepEqual(chromeAppearance({ os: "ios", type: "phone", radius: 0 }), { edge: "bottom", kind: "safari", home: false });
  assert.deepEqual(chromeAppearance({ os: "ipados", type: "tablet", radius: 18 }), { edge: "top", kind: "safari", home: false });
  assert.deepEqual(chromeAppearance({ os: "android", type: "phone", radius: 36 }), { edge: "top", kind: "chrome", home: false });
  assert.equal(chromeAppearance(null), null);
});

test("the address bar hides on a real scroll down and comes back on the way up or at the top", () => {
  assert.equal(chromeScrollIntent(0, 4, { canScroll: true }), null);
  assert.equal(chromeScrollIntent(0, 40, { canScroll: true }), "collapse");
  assert.equal(chromeScrollIntent(200, 160, { canScroll: true }), "expand");
  assert.equal(chromeScrollIntent(200, 40, { atTop: true, canScroll: true }), "expand");
  assert.equal(chromeScrollIntent(0, 80, { canScroll: false }), "expand");
});

test("the injected stylesheet fades the scrollbar and eases the bar", () => {
  const css = deviceChromeCss();
  assert.match(css, /scrollbar-width:none/);
  assert.match(css, /cubic-bezier\(0\.32,0\.72,0,1\)/);
  assert.match(css, /data-collapsed="true"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.equal(hostOf("https://www.apple.com/iphone"), "apple.com");
  assert.equal(hostOf("not a url"), "");
});
