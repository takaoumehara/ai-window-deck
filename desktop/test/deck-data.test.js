import test from "node:test";
import assert from "node:assert/strict";
import { parseExtensionExport, urlList } from "../src/lib/deck-data.js";

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
