import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { matchCommand } = createRequire(import.meta.url)("../electron/commands.cjs");
const key = (code, modifiers = {}, extra = {}) => ({ type: "keyDown", code, key: "", alt: false, shift: false, control: false, meta: false, ...modifiers, ...extra });

test("Chrome tab keys use ⌘ on macOS and Ctrl elsewhere", () => {
  assert.equal(matchCommand(key("KeyT", { meta: true }), "darwin"), "tab-new");
  assert.equal(matchCommand(key("KeyT", { control: true }), "darwin"), null);
  assert.equal(matchCommand(key("KeyT", { control: true }), "win32"), "tab-new");
  assert.equal(matchCommand(key("KeyW", { meta: true }), "darwin"), "tab-close");
  assert.equal(matchCommand(key("KeyT", { meta: true, shift: true }), "darwin"), "tab-reopen");
  assert.equal(matchCommand(key("Digit3", { meta: true }), "darwin"), "tab-3");
  assert.equal(matchCommand(key("Digit9", { control: true }), "linux"), "tab-9");
});

test("Ctrl+Tab cycles tabs on every platform, ⌥Tab cycles panes", () => {
  assert.equal(matchCommand(key("Tab", { control: true }), "darwin"), "tab-next");
  assert.equal(matchCommand(key("Tab", { control: true, shift: true }), "win32"), "tab-previous");
  assert.equal(matchCommand(key("ArrowRight", { meta: true, alt: true }), "darwin"), "tab-next");
  assert.equal(matchCommand(key("Tab", { alt: true }), "darwin"), "focus-next");
  assert.equal(matchCommand(key("Tab", { alt: true, shift: true }), "darwin"), "focus-previous");
});

test("⌘[ / ⌘] follow the typed bracket, so JIS keyboards match too", () => {
  assert.equal(matchCommand(key("BracketRight", { meta: true }, { key: "[" }), "darwin"), "page-back");
  assert.equal(matchCommand(key("Backslash", { meta: true }, { key: "]" }), "darwin"), "page-forward");
  assert.equal(matchCommand(key("BracketRight", { meta: true, shift: true }, { key: "}" }), "darwin"), "tab-next");
});

test("held keys repeat only for tab cycling and zoom", () => {
  assert.equal(matchCommand(key("Tab", { control: true }, { isAutoRepeat: true }), "darwin"), "tab-next");
  assert.equal(matchCommand(key("Equal", { meta: true }, { isAutoRepeat: true }), "darwin"), "zoom-in");
  assert.equal(matchCommand(key("KeyW", { meta: true }, { isAutoRepeat: true }), "darwin"), null);
});

test("existing Option shortcuts still match", () => {
  assert.equal(matchCommand(key("KeyX", { alt: true }), "darwin"), "toggle-spotlight");
  assert.equal(matchCommand(key("Digit2", { alt: true }), "darwin"), "focus-tile-2");
  assert.equal(matchCommand(key("KeyR", { meta: true }), "darwin"), "reload-pane");
  assert.equal(matchCommand(key("KeyA"), "darwin"), null);
});

test("sets, new deck window and settings have their own keys", () => {
  assert.equal(matchCommand(key("Digit2", { meta: true, alt: true }), "darwin"), "set-2");
  assert.equal(matchCommand(key("Digit2", { control: true, shift: true }), "win32"), "set-2");
  assert.equal(matchCommand(key("Digit2", { control: true, alt: true }), "win32"), null);
  assert.equal(matchCommand(key("Digit3", { meta: true, shift: true }), "darwin"), null);
  assert.equal(matchCommand(key("KeyS", { alt: true }), "darwin"), "sets-open");
  assert.equal(matchCommand(key("KeyN", { meta: true }), "darwin"), "new-window");
  assert.equal(matchCommand(key("Comma", { control: true }), "linux"), "open-settings");
});

test("undo keys are never taken from pages", () => {
  assert.equal(matchCommand(key("KeyZ", { meta: true }), "darwin"), null);
  assert.equal(matchCommand(key("KeyZ", { meta: true, shift: true }), "darwin"), null);
  assert.equal(matchCommand(key("KeyY", { control: true }), "win32"), null);
});

test("⌘K and F1 open the palette, ⌘⇧M toggles the mobile preview", () => {
  assert.equal(matchCommand(key("KeyK", { meta: true }), "darwin"), "open-palette");
  assert.equal(matchCommand(key("KeyK", { control: true }), "win32"), "open-palette");
  assert.equal(matchCommand(key("F1"), "darwin"), "open-palette");
  assert.equal(matchCommand(key("F1", { shift: true }), "darwin"), null);
  assert.equal(matchCommand(key("KeyM", { meta: true, shift: true }), "darwin"), "device-toggle");
  assert.equal(matchCommand(key("KeyM", { meta: true }), "darwin"), null);
});

test("Alt+← / Alt+→ go back and forward on Windows and Linux, not on macOS", () => {
  assert.equal(matchCommand(key("ArrowLeft", { alt: true }), "win32"), "page-back");
  assert.equal(matchCommand(key("ArrowRight", { alt: true }), "linux"), "page-forward");
  assert.equal(matchCommand(key("ArrowLeft", { alt: true }), "darwin"), null);
});
