import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const { DISABLED_CHROMIUM_FEATURES, applyChromiumFlags } = createRequire(import.meta.url)("../electron/crash-guards.cjs");
const main = fs.readFileSync(new URL("../electron/main.cjs", import.meta.url), "utf8");

test("FedCM is disabled before any window exists", () => {
  assert.ok(DISABLED_CHROMIUM_FEATURES.includes("FedCm"));
  assert.ok(DISABLED_CHROMIUM_FEATURES.includes("FedCmButtonMode"));
  const switches = [];
  applyChromiumFlags({
    appendSwitch(name, value) {
      switches.push([name, value]);
    },
  });
  assert.deepEqual(switches, [["disable-features", "FedCm,FedCmButtonMode"]]);

  const flags = main.indexOf("applyChromiumFlags(app.commandLine)");
  const ready = main.indexOf("app.whenReady");
  assert.ok(flags > 0 && flags < ready);
});

test("a Google sign-in window is not created inside a navigation, and no window is parented to the deck", () => {
  assert.match(main, /function scheduleSignInWindow\(target, paneId, url, strategy, into = null\)/);
  assert.match(main, /event\.preventDefault\(\);\s*scheduleSignInWindow\(target, paneId, event\.url\);/);
  assert.match(main, /event\.preventDefault\(\);\s*scheduleSignInWindow\(target, null, event\.url, undefined, contents\);/);
  assert.equal(main.includes("parent:"), false);
});
