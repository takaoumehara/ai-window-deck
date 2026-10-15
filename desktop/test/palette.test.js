import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { ASK_AI_URLS, featureGuide, formatAccelerator, normalize, paletteEntries, searchPalette } from "../src/lib/palette.js";
import { LANGUAGES, STRINGS, translator } from "../src/lib/strings.js";

const require = createRequire(import.meta.url);
const catalog = require("../electron/commands.json");
const { matchCommand } = require("../electron/commands.cjs");

const entriesIn = (lang, options = {}) => paletteEntries(catalog, { t: translator(lang), tEnglish: translator("en"), isMac: true, ...options });
const ids = (results) => results.map((entry) => entry.id);

test("every command has a label and keywords in every language", () => {
  const groups = new Set(catalog.groups);
  for (const command of catalog.commands) {
    assert.ok(groups.has(command.group), `${command.id} group`);
    for (const { code } of LANGUAGES) {
      assert.ok(STRINGS[code][command.label], `${code}.${command.label}`);
      for (const keywords of [command.keywords].flat()) assert.ok(STRINGS[code][keywords], `${code}.${keywords}`);
    }
  }
  assert.equal(new Set(catalog.commands.map((command) => command.id)).size, catalog.commands.length);
});

test("phone words in any script find the mobile preview first", () => {
  const ja = entriesIn("ja");
  for (const query of ["スマホ", "すまほ", "iPhone", "mobile", "モバイル", "ｽﾏﾎ", "アイフォン"]) {
    assert.equal(searchPalette(ja, query)[0]?.id, "device-toggle", query);
  }
  assert.equal(searchPalette(entriesIn("en"), "iphone")[0]?.id, "device-toggle");
  assert.equal(searchPalette(entriesIn("de"), "handy")[0]?.id, "device-toggle");
});

test("search matches the UI language, English and synonyms, and needs every word", () => {
  const ja = entriesIn("ja");
  assert.ok(ids(searchPalette(ja, "戻る")).includes("page-back"));
  assert.ok(ids(searchPalette(ja, "back")).includes("page-back"));
  assert.ok(ids(searchPalette(ja, "並べ替え")).includes("tab-move-left"));
  assert.ok(ids(searchPalette(ja, "グーグル")).includes("signin-google"));
  assert.deepEqual(searchPalette(ja, "スマホ 回転").map((entry) => entry.id)[0], "device-rotate");
  const aiCommands = ["ask-ai-claude", "ask-ai-chatgpt", "ai-next", "ai-broadcast"];
  assert.deepEqual(new Set(ids(searchPalette(ja, "AI")).slice(0, 4)), new Set(aiCommands));
  assert.deepEqual(new Set(ids(searchPalette(entriesIn("en"), "ai")).slice(0, 4)), new Set(aiCommands));
  assert.equal(searchPalette(ja, "通知")[0]?.id, "ai-next");
  assert.equal(searchPalette(ja, "一斉送信")[0]?.id, "ai-broadcast");
  assert.deepEqual(searchPalette(ja, "zzzz"), []);
  assert.equal(searchPalette(ja, "  ").length, ja.length);
});

test("pane commands are left out while no pane has focus; the palette never lists itself", () => {
  const all = entriesIn("en");
  const deckOnly = entriesIn("en", { hasPane: false });
  assert.ok(!ids(all).includes("open-palette"));
  assert.ok(ids(all).includes("page-back"));
  assert.ok(!ids(deckOnly).includes("page-back"));
  assert.ok(ids(deckOnly).includes("toggle-spotlight"));
});

test("shortcuts read like the keyboard on each platform", () => {
  assert.equal(formatAccelerator("CmdOrCtrl+Shift+M", true), "⌘⇧M");
  assert.equal(formatAccelerator("CmdOrCtrl+Shift+M", false), "Ctrl+Shift+M");
  assert.equal(formatAccelerator("Alt+X", true), "⌥X");
  assert.equal(formatAccelerator("CmdOrCtrl+[", true), "⌘[");
  assert.equal(formatAccelerator("Ctrl+Shift+Tab", true), "⌃⇧Tab");
  assert.equal(formatAccelerator(undefined, true), "");
  assert.equal(normalize("ＰＤＦ スマホ"), "pdf すまほ");
});

const CODES = { ",": "Comma", "=": "Equal", "-": "Minus", Tab: "Tab" };
function inputFor(accelerator) {
  const parts = accelerator.split("+");
  const last = parts.pop();
  const has = (name) => parts.includes(name);
  const code = CODES[last] ?? (/^\d$/.test(last) ? `Digit${last}` : /^[A-Z]$/.test(last) ? `Key${last}` : "");
  return { type: "keyDown", code, key: last, meta: has("CmdOrCtrl"), control: has("Ctrl"), alt: has("Alt"), shift: has("Shift") };
}

test("the shortcut each palette row shows is the one the app answers to", () => {
  for (const command of catalog.commands) {
    if (!command.accelerator || command.menuAccelerator === false) continue;
    assert.equal(matchCommand(inputFor(command.accelerator), "darwin"), command.id, command.accelerator);
  }
});

test("Ask AI opens a prefilled chat with a guide in English, answered in the user's language", () => {
  const entries = entriesIn("en");
  const guide = featureGuide(entries, { language: "Japanese", groupLabel: (group) => group });
  assert.match(guide, /AI Window Deck/);
  assert.match(guide, /answer in Japanese/);
  assert.match(guide, /Mobile preview on \/ off.*\(⌘⇧M\)/);
  assert.match(guide, /wait for my question/);
  const asked = featureGuide(entries, { language: "English", groupLabel: (group) => group, question: "How do I rotate?" });
  assert.match(asked, /My question: How do I rotate\?$/);
  assert.ok(ASK_AI_URLS.claude(asked).startsWith("https://claude.ai/new?q="));
  assert.equal(decodeURIComponent(ASK_AI_URLS.chatgpt("a b&c").split("?q=")[1]), "a b&c");
  assert.ok(ASK_AI_URLS.claude(guide).length < 8000);
});
