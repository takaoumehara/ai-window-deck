import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

const ai = createRequire(import.meta.url)("../electron/ai-status.cjs");

const page = (name) => new JSDOM(readFileSync(new URL(`./fixtures/ai/${name}.html`, import.meta.url), "utf8"), { pretendToBeVisual: true }).window.document;
const rules = (url) => ai.rulesFor(ai.siteFor(url));
const probe = (name, url, busy = false) => ai.probePage(page(name), rules(url), busy);

test("the catalog is well formed", () => {
  const ids = new Set();
  for (const site of ai.catalog.sites) {
    assert.match(site.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(site.id), `duplicate ${site.id}`);
    ids.add(site.id);
    assert.ok(site.name && site.hosts?.length, site.id);
    for (const key of ["working", "needsYou", "error", "input", "submit"]) {
      for (const rule of site[key] ?? []) {
        const selector = typeof rule === "string" ? rule : rule.selector;
        assert.doesNotThrow(() => new JSDOM("").window.document.querySelectorAll(selector), `${site.id}.${key}: ${selector}`);
        if (typeof rule !== "string" && rule.text) assert.doesNotThrow(() => new RegExp(rule.text, "i"));
      }
    }
  }
});

test("pages map to their site; paths win, other pages get nothing", () => {
  assert.equal(ai.siteFor("https://claude.ai/chat/123").id, "claude");
  assert.equal(ai.siteFor("https://claude.ai/code/session_1").id, "claude");
  assert.equal(ai.siteFor("https://chatgpt.com/c/abc").id, "chatgpt");
  assert.equal(ai.siteFor("https://chatgpt.com/codex/tasks/task_1").id, "codex");
  assert.equal(ai.siteFor("https://chatgpt.com/codexical").id, "chatgpt");
  assert.equal(ai.siteFor("https://gemini.google.com/app/1").id, "gemini");
  assert.equal(ai.siteFor("https://www.perplexity.ai/search/x").id, "perplexity");
  assert.equal(ai.siteFor("https://cursor.com/agents/bc-1").id, "cursor");
  assert.equal(ai.siteFor("https://cursor.com/pricing"), null, "only Cursor's agents");
  assert.equal(ai.siteFor("https://example.com/"), null);
  assert.equal(ai.siteFor("http://claude.ai/"), null);
  assert.equal(ai.siteFor("https://notclaude.ai/"), null);
});

test("adapters read working, idle, needs you and error from real-shaped pages", () => {
  assert.equal(probe("claude-working", "https://claude.ai/chat/1"), "working");
  assert.equal(probe("claude-idle", "https://claude.ai/chat/1"), "idle");
  assert.equal(probe("claude-code-permission", "https://claude.ai/code/s"), "needs-you");
  assert.equal(probe("chatgpt-working", "https://chatgpt.com/c/1"), "working");
  assert.equal(probe("chatgpt-idle", "https://chatgpt.com/c/1"), "idle", "a hidden stop button doesn't count");
  assert.equal(probe("chatgpt-error", "https://chatgpt.com/c/1"), "error");
  assert.equal(probe("gemini-working", "https://gemini.google.com/app"), "working");
  assert.equal(probe("codex-working", "https://chatgpt.com/codex"), "working");
});

test("fails safe: unknown pages, banners and hidden controls give no status", () => {
  assert.equal(probe("login-page", "https://claude.ai/login"), null);
  assert.equal(probe("cookie-banner", "https://chatgpt.com/"), "idle", "'Allow all' on a cookie banner is not an approval");
  assert.equal(probe("hidden-stop", "https://claude.ai/"), "idle");
  assert.equal(probe("claude-idle", "https://claude.ai/", true), "idle", "the activity fallback is opt-in per site");
  assert.equal(probe("chatgpt-textarea", "https://chatgpt.com/codex", true), "working", "Codex opts into it");
});

test("readings settle before they count; leaving Working waits longest", () => {
  let state = ai.settleStatus(null, "idle", 0);
  assert.equal(state.reported, null);
  state = ai.settleStatus(state, "idle", 1000);
  assert.equal(state.reported, "idle");
  state = ai.settleStatus(state, "working", 1100);
  state = ai.settleStatus(state, "working", 1600);
  assert.equal(state.reported, "working");
  state = ai.settleStatus(state, "idle", 2000);
  state = ai.settleStatus(state, "working", 3000);
  state = ai.settleStatus(state, "idle", 3500);
  state = ai.settleStatus(state, "idle", 5000);
  assert.equal(state.reported, "working", "a 2 s gap between steps stays Working");
  state = ai.settleStatus(state, "idle", 6100);
  assert.equal(state.reported, "idle");
});

test("pane status: Done after work, kept until seen; Error only after work", () => {
  assert.equal(ai.nextStatus(null, "working"), "working");
  assert.equal(ai.nextStatus("working", "idle", { workedMs: 5000 }), "done");
  assert.equal(ai.nextStatus("working", "idle", { workedMs: 500 }), null, "a blip isn't a finished task");
  assert.equal(ai.nextStatus("working", "idle", { workedMs: 5000, seen: true }), null, "finished while you watched");
  assert.equal(ai.nextStatus("done", "idle"), "done");
  assert.equal(ai.nextStatus("done", "idle", { seen: true }), null);
  assert.equal(ai.nextStatus("working", "needs-you"), "needs-you");
  assert.equal(ai.nextStatus("needs-you", "working"), "working");
  assert.equal(ai.nextStatus("working", "error"), "error");
  assert.equal(ai.nextStatus(null, "error"), null, "an old error on a freshly loaded page");
  assert.equal(ai.nextStatus("error", "error", { seen: true }), null);
  assert.equal(ai.nextStatus("done", null), "done", "navigating away keeps the news until seen");
});

test("pane summary, counts and the jump order", () => {
  assert.deepEqual(ai.paneStatus([{ status: "working" }, { status: "done", tab: 2 }, null]), { status: "done", tab: 2 });
  assert.equal(ai.paneStatus([null, { status: null }]), null);
  const statuses = { a: { status: "working" }, b: { status: "done" }, c: { status: "needs-you" }, d: null, e: { status: "needs-you" } };
  assert.deepEqual(ai.summarize(Object.values(statuses)), { working: 1, "needs-you": 2, done: 1, error: 0 });
  const order = ["a", "b", "c", "d", "e"];
  assert.equal(ai.nextAttention(order, statuses, "a"), "c");
  assert.equal(ai.nextAttention(order, statuses, "c"), "e");
  assert.equal(ai.nextAttention(order, statuses, "e"), "c");
  assert.equal(ai.nextAttention(order, { a: { status: "working" } }, "b"), null, "Working panes are not jumped to");
  assert.equal(ai.nextAttention(order, { b: { status: "done" } }, null), "b");
});

test("prompts go into textareas and editors; Send is pressed only when asked", async () => {
  const dom = new JSDOM(readFileSync(new URL("./fixtures/ai/chatgpt-textarea.html", import.meta.url), "utf8"));
  const { document } = dom.window;
  let inputs = 0;
  let clicks = 0;
  document.querySelector("textarea").addEventListener("input", () => (inputs += 1));
  document.querySelector("button").addEventListener("click", () => (clicks += 1));
  const r = rules("https://chatgpt.com/");
  assert.deepEqual(await ai.insertPrompt(document, r, "Compare these two plans", false), { ok: true, reason: "inserted" });
  assert.equal(document.querySelector("textarea").value, "Compare these two plans");
  assert.equal(inputs, 1);
  assert.equal(clicks, 0);
  assert.deepEqual(await ai.insertPrompt(document, r, "Second prompt", true), { ok: true, reason: "sent" });
  assert.equal(document.querySelector("textarea").value, "Second prompt", "replaces what was there");
  assert.equal(clicks, 1);

  const editor = page("claude-idle");
  assert.deepEqual(await ai.insertPrompt(editor, rules("https://claude.ai/"), "Hello", false), { ok: true, reason: "inserted" });
  assert.equal(editor.querySelector(".ProseMirror").textContent, "Hello");
  assert.deepEqual(await ai.insertPrompt(page("login-page"), rules("https://claude.ai/"), "Hello", true), { ok: false, reason: "no-input" });
});

test("unsent text is noticed; untouched fields are not", () => {
  const document = page("draft");
  assert.equal(ai.hasDraft(document), false, "a preset value and empty editors are not drafts");
  document.querySelector("textarea").value = "half-written reply";
  assert.equal(ai.hasDraft(document), true);
  document.querySelector("textarea").value = "";
  document.querySelector("[contenteditable]").textContent = "typing";
  assert.equal(ai.hasDraft(document), true);
});

test("injected scripts are self-contained", () => {
  const r = rules("https://claude.ai/");
  for (const script of [ai.monitorScript(r), ai.insertScript(r, "hi \"there\"", true), ai.draftScript()]) {
    assert.doesNotThrow(() => new Function(script));
  }
  const dom = new JSDOM(readFileSync(new URL("./fixtures/ai/claude-working.html", import.meta.url), "utf8"), { runScripts: "outside-only" });
  const reports = [];
  dom.window.__deckAiReport = (status) => reports.push(status);
  dom.window.eval(ai.monitorScript(r));
  dom.window.__deckAiMonitor.stop();
  assert.deepEqual(reports, [], "nothing is reported before a reading settles");
});
