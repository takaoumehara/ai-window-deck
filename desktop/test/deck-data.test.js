import test from "node:test";
import assert from "node:assert/strict";
import { extractUrls, mergeUrls, parseExtensionExport, parsePastedList, urlKey, urlList } from "../src/lib/deck-data.js";

test("imports an extension JSON backup with the active layout's windows first", () => {
  const backup = {
    version: "2.0.0",
    state: { activePreset: 0, presets: [{ name: "A", slots: [] }] },
    registeredWindows: [
      { id: "win-1", name: "Research", urls: "https://example.com/a\nhttps://example.com/b" },
      { id: "win-2", name: "Chat AI", urls: "https://claude.ai" },
      { id: "win-3", name: "Spare", urls: "https://example.org" },
    ],
    canvasSlots: [
      { id: "slot-1", registeredWindowId: "win-2", name: "Chat AI", urls: "https://claude.ai" },
      { id: "slot-2", registeredWindowId: "win-1", name: "Research", urls: "https://example.com/a" },
    ],
  };
  const windows = parseExtensionExport(JSON.stringify(backup));
  assert.deepEqual(windows.map((w) => [w.id, w.visible]), [["win-2", true], ["win-1", true], ["win-3", false]]);
  assert.equal(windows[1].urls, "https://example.com/a\nhttps://example.com/b");
});

test("falls back to the active preset's slots when canvasSlots is missing", () => {
  const backup = {
    state: { activePreset: 1, presets: [{ slots: [] }, { slots: [{ registeredWindowId: "win-b" }] }] },
    registeredWindows: [{ id: "win-a", name: "A", urls: "https://a.test" }, { id: "win-b", name: "B", urls: "https://b.test" }],
  };
  assert.deepEqual(parseExtensionExport(JSON.stringify(backup)).map((w) => [w.id, w.visible]), [["win-b", true], ["win-a", false]]);
});

test("imports the extension's .txt window list", () => {
  const text = "Research\nhttps://example.com/a\nhttps://example.com/b\n\nChat AI\nhttps://claude.ai\n";
  const windows = parseExtensionExport(text);
  assert.deepEqual(windows.map((w) => [w.name, w.urls]), [
    ["Research", "https://example.com/a\nhttps://example.com/b"],
    ["Chat AI", "https://claude.ai"],
  ]);
  assert.ok(windows.every((w) => w.visible));
});

test("rejects malformed JSON", () => {
  assert.throws(() => parseExtensionExport("{nope"));
});

test("urlList trims blank lines and adds a missing scheme", () => {
  assert.deepEqual(urlList({ urls: " claude.ai \n\nhttps://chatgpt.com" }), ["https://claude.ai", "https://chatgpt.com"]);
});

test("pasted bare URLs become one window per URL, named by host", () => {
  const { windows, named } = parsePastedList("https://www.notion.so/team\n\n- claude.ai\n2. https://github.com/a/b\n");
  assert.equal(named, false);
  assert.deepEqual(windows.map((w) => [w.name, w.urls, w.visible]), [
    ["notion.so", "https://www.notion.so/team", true],
    ["claude.ai", "https://claude.ai", true],
    ["github.com", "https://github.com/a/b", true],
  ]);
  assert.equal(new Set(windows.map((w) => w.id)).size, 3);
});

test("pasted bare URLs can go into one window as tabs", () => {
  const { windows } = parsePastedList("https://a.test/1\nhttps://b.test/2", { together: true });
  assert.deepEqual(windows.map((w) => [w.name, w.urls]), [["a.test", "https://a.test/1\nhttps://b.test/2"]]);
});

test("a pasted list with names keeps the extension's grouping", () => {
  const text = "Research\nhttps://example.com/a\nexample.com/b\n\nhttps://solo.test\n\nEmpty\n\nChat\nhttps://claude.ai";
  const { windows, named } = parsePastedList(text, { together: true });
  assert.equal(named, true);
  assert.deepEqual(windows.map((w) => [w.name, w.urls]), [
    ["Research", "https://example.com/a\nhttps://example.com/b"],
    ["solo.test", "https://solo.test"],
    ["Chat", "https://claude.ai"],
  ]);
});

test("a pasted JSON backup is read like an imported file", () => {
  const { windows } = parsePastedList(JSON.stringify([{ id: "w1", name: "A", urls: "https://a.test" }, { id: "w2", name: "No URLs" }]));
  assert.deepEqual(windows.map((w) => w.id), ["w1"]);
  assert.deepEqual(parsePastedList("   ").windows, []);
});

test("URLs come out of any pasted text: lines, prose, commas, Markdown, bare domains", () => {
  const text = [
    "Look at https://claude.ai/code/session_011 and moime.app, also www.horn-tanz.at/.",
    "- https://paywithpeppermint.com/",
    "1. http://the-alphabet.co.uk/",
    "[Duten](https://www.duten.com/en/) | README.md | e.g. v2.0 | node.js | 1.5",
    "詳しくはmoime.appへ、https://ja.wikipedia.org/wiki/東京（日本）を参照。",
    "mail me: a@b.com, mailto:x@y.z, localhost:5173/x 192.168.1.4:8080 (see https://en.wikipedia.org/wiki/Foo_(bar)).",
    "https://MOIME.app https://claude.ai/code/session_011#top",
  ].join("\n");
  assert.deepEqual(extractUrls(text), [
    "https://claude.ai/code/session_011",
    "https://moime.app",
    "https://www.horn-tanz.at",
    "https://paywithpeppermint.com",
    "http://the-alphabet.co.uk",
    "https://www.duten.com/en/",
    "https://ja.wikipedia.org/wiki/東京",
    "http://localhost:5173/x",
    "http://192.168.1.4:8080",
    "https://en.wikipedia.org/wiki/Foo_(bar)",
    "https://claude.ai/code/session_011#top",
  ]);
  assert.deepEqual(extractUrls("a.com,b.com c.com\tb.com"), ["https://a.com", "https://b.com", "https://c.com"]);
  assert.deepEqual(extractUrls("no links here, just words. 3.14"), []);
  assert.deepEqual(extractUrls(""), []);
});

test("pasted URLs append without repeats, or replace the list", () => {
  assert.equal(urlKey("https://Example.com/"), "https://example.com");
  assert.equal(urlKey("https://example.com/a/"), "https://example.com/a/");
  const current = ["https://moime.app/", "claude.ai", ""];
  assert.deepEqual(mergeUrls(current, ["https://moime.app", "https://claude.ai", "https://x.com"]), {
    urls: ["https://moime.app/", "claude.ai", "https://x.com"],
    added: 1,
    duplicates: 2,
  });
  assert.deepEqual(mergeUrls(current, ["https://x.com", "https://y.com"], "replace"), { urls: ["https://x.com", "https://y.com"], added: 2, duplicates: 0 });
});
