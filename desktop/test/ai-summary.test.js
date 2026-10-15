import test from "node:test";
import assert from "node:assert/strict";
import { aiSettingsOf, broadcastTargets, nextAttention, summarize } from "../src/lib/ai-summary.js";

test("AI settings default to on with notifications and no sound", () => {
  assert.deepEqual(aiSettingsOf(undefined), { enabled: true, notify: true, sound: false, off: [] });
  assert.deepEqual(aiSettingsOf({ enabled: false, notify: false, sound: true, off: ["claude", 3] }), { enabled: false, notify: false, sound: true, off: ["claude"] });
});

test("top-bar counts and the ⌘J jump order", () => {
  const statuses = { a: { status: "working" }, b: { status: "done" }, c: { status: "needs-you" }, e: { status: "needs-you" } };
  assert.deepEqual(summarize(Object.values(statuses)), { working: 1, "needs-you": 2, done: 1, error: 0 });
  const order = ["a", "b", "c", "d", "e"];
  assert.equal(nextAttention(order, statuses, "a"), "c");
  assert.equal(nextAttention(order, statuses, "c"), "e");
  assert.equal(nextAttention(order, statuses, "e"), "c");
  assert.equal(nextAttention(order, { ...statuses, c: undefined, e: undefined }, "b"), null, "only Working and the current pane are left");
  assert.equal(nextAttention(order, { a: { status: "working" } }, "b"), null, "Working panes are not jumped to");
  assert.equal(nextAttention(order, { b: { status: "done" } }, null), "b");
  assert.equal(nextAttention(order, { b: { status: "done" }, d: { status: "error" } }, null), "d", "errors before finished panes");
});

test("broadcast lists AI panes in deck order", () => {
  assert.deepEqual(broadcastTargets(["a", "b", "c"], { c: { id: "claude" }, a: { id: "chatgpt" } }), ["a", "c"]);
});
