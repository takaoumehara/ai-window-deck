import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const sleep = require("../electron/pane-sleep.cjs");
const ai = require("../electron/ai-status.cjs");

const idle = { displayed: false, idleMs: 31 * 60_000, limitMs: 30 * 60_000, url: "https://example.com/" };
const quiet = { media: false, draft: false };

test("sleep settings: on, 30 minutes, only known lengths", () => {
  assert.deepEqual(sleep.sleepSettingsOf(undefined), { enabled: true, minutes: 30 });
  assert.deepEqual(sleep.sleepSettingsOf({ enabled: false, minutes: 60 }), { enabled: false, minutes: 60 });
  assert.deepEqual(sleep.sleepSettingsOf({ enabled: "yes", minutes: 7 }), { enabled: false, minutes: 30 });
});

test("only a hidden page idle past the limit, with nothing going on, may sleep", () => {
  assert.equal(sleep.sleepBlocker(idle, quiet), null);
  assert.equal(sleep.sleepBlocker({ ...idle, displayed: true }, quiet), "shown");
  assert.equal(sleep.sleepBlocker({ ...idle, idleMs: 29 * 60_000 }, quiet), "recent");
  assert.equal(sleep.sleepBlocker({ ...idle, keepAwake: true, displayed: true }, quiet), "keep-awake");
});

test("AI work, sound, sign-in, loading and unsent text keep a page awake", () => {
  for (const status of ["working", "needs-you", "done", "error"]) assert.equal(sleep.sleepBlocker({ ...idle, aiStatus: status }, quiet), "ai");
  assert.equal(sleep.sleepBlocker({ ...idle, audible: true }, quiet), "audio");
  assert.equal(sleep.sleepBlocker({ ...idle, authPage: true }, quiet), "sign-in");
  assert.equal(sleep.sleepBlocker({ ...idle, popupOpen: true }, quiet), "sign-in");
  assert.equal(sleep.sleepBlocker({ ...idle, loading: true }, quiet), "loading");
  assert.equal(sleep.sleepBlocker({ ...idle, url: "about:blank" }, quiet), "not-web");
  assert.equal(sleep.sleepBlocker(idle, null), "unknown", "the page didn't answer");
  assert.equal(sleep.sleepBlocker(idle, { media: true, draft: false }), "media");
  assert.equal(sleep.sleepBlocker(idle, { media: false, draft: true }), "draft");
});

test("the page report finds playing media, unsent text and the scroll position", () => {
  const run = (html) => sleep.pageReport(new JSDOM(html, { pretendToBeVisual: true }).window.document, ai.hasDraft);
  assert.deepEqual(run("<p>Hello</p>"), { media: false, draft: false, scrollX: 0, scrollY: 0 });
  const form = new JSDOM(readFileSync(new URL("./fixtures/ai/draft.html", import.meta.url), "utf8")).window.document;
  assert.equal(sleep.pageReport(form, ai.hasDraft).draft, false);
  form.querySelector("textarea").value = "half-written reply";
  assert.equal(sleep.pageReport(form, ai.hasDraft).draft, true);
  const dom = new JSDOM("<video></video>");
  const video = dom.window.document.querySelector("video");
  Object.defineProperties(video, { paused: { value: false, configurable: true }, ended: { value: false }, readyState: { value: 4 } });
  assert.equal(sleep.pageReport(dom.window.document, ai.hasDraft).media, true);
  Object.defineProperty(video, "paused", { value: true });
  assert.equal(sleep.pageReport(dom.window.document, ai.hasDraft).media, false);
});

test("scripts are self-contained and scroll values are sanitised", () => {
  assert.doesNotThrow(() => new Function(sleep.reportScript(ai.hasDraft)));
  assert.match(sleep.restoreScrollScript(12.4, 800), /scrollLeft = 12; s\.scrollTop = 800;/);
  assert.match(sleep.restoreScrollScript(NaN, -5), /scrollLeft = 0; s\.scrollTop = 0;/);
});

test("sleeping tabs follow their URL when tabs move, and are dropped with it", () => {
  const record = (name) => ({ name });
  const sleeping = new Map([[0, record("a")], [2, record("c")]]);
  const moved = sleep.regroupSleeping(sleeping, ["a", "b", "c"], ["c", "a", "b"], new Set([2]));
  assert.deepEqual([...moved].map(([tab, value]) => [tab, value.name]), [[0, "c"], [1, "a"]]);
  const closed = sleep.regroupSleeping(sleeping, ["a", "b", "c"], ["b", "c"], new Set([0]));
  assert.deepEqual([...closed].map(([tab, value]) => [tab, value.name]), [[1, "c"]]);
  assert.equal(sleep.regroupSleeping(sleeping, ["a", "b", "c"], ["a", "b", "c"], new Set([0, 2])).size, 0, "a live page wins its tab");
});
