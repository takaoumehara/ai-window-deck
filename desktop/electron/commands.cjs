// Matched on KeyboardEvent.code so they still fire on macOS, where Option turns
// letters into other characters (Option+X types "≈").
const ALT_CODES = {
  KeyX: "toggle-spotlight",
  KeyZ: "restore-home",
  KeyA: "restore-home",
  KeyQ: "toggle-fullscreen",
  BracketRight: "focus-next",
  BracketLeft: "focus-previous",
  KeyB: "toggle-sidebar",
  KeyS: "sets-open",
};
for (let n = 1; n <= 8; n += 1) ALT_CODES[`Digit${n}`] = `focus-tile-${n}`;

// Chrome's own keys, applied to the focused pane. ⌘ on macOS, Ctrl elsewhere.
const PRIMARY_CODES = {
  KeyT: "tab-new",
  KeyW: "tab-close",
  KeyL: "address-focus",
  KeyF: "find",
  KeyR: "reload-pane",
  Equal: "zoom-in",
  NumpadAdd: "zoom-in",
  Minus: "zoom-out",
  NumpadSubtract: "zoom-out",
  Digit0: "zoom-reset",
  Numpad0: "zoom-reset",
  KeyN: "new-window",
  Comma: "open-settings",
  KeyK: "open-palette",
  KeyJ: "ai-next",
};
for (let n = 1; n <= 9; n += 1) PRIMARY_CODES[`Digit${n}`] = `tab-${n}`;

const PRIMARY_SHIFT_CODES = {
  KeyT: "tab-reopen",
  KeyR: "reload-hard",
  Equal: "zoom-in",
  KeyM: "device-toggle",
};

// Brackets differ by layout (JIS puts "[" on BracketRight), so ⌘[ / ⌘] use the
// typed character, which ⌘ leaves untouched.
const PRIMARY_KEYS = { "[": "page-back", "]": "page-forward" };
const PRIMARY_SHIFT_KEYS = { "{": "tab-previous", "}": "tab-next", "[": "tab-previous", "]": "tab-next" };

// commands.json lists every command once, for the app menu here and the
// command palette in the shell (src/lib/palette.js).
const CATALOG = require("./commands.json");

// Menu accelerators. ⌘Z stays with the Edit menu's own undo, so the deck's
// undo has none there.
const COMMAND_ACCELERATORS = Object.fromEntries(
  CATALOG.commands.filter((command) => command.accelerator && command.menuAccelerator !== false).map((command) => [command.id, command.accelerator])
);

function matchCommand(input, platform = process.platform) {
  if (input.type !== "keyDown") return null;
  const mac = platform === "darwin";
  const { alt, shift, control, meta, code, key } = input;
  const repeatable = (command) => (input.isAutoRepeat && !/^(tab-next|tab-previous|zoom-)/.test(command ?? "") ? null : command ?? null);

  if (code === "F1" && !alt && !shift && !control && !meta) return repeatable("open-palette");

  // ⌥Tab / ⌥⇧Tab cycle panes on every keyboard layout, which suits mouse
  // buttons mapped to a keystroke (Logi Options+).
  if (alt && !control && !meta && code === "Tab") return repeatable(shift ? "focus-previous" : "focus-next");
  if (!mac && alt && !control && !meta && !shift && (code === "ArrowLeft" || code === "ArrowRight")) {
    return repeatable(code === "ArrowLeft" ? "page-back" : "page-forward");
  }
  if (alt && !control && !meta && !shift) return repeatable(ALT_CODES[code]);

  if (control && !meta && !alt && code === "Tab") return repeatable(shift ? "tab-previous" : "tab-next");
  if (control && !meta && !alt && !shift && (code === "PageDown" || code === "PageUp")) {
    return repeatable(code === "PageDown" ? "tab-next" : "tab-previous");
  }

  const primary = mac ? meta && !control : control && !meta;
  // Sets 1–9: ⌘⌥ on macOS (⌘⇧3–5 are screenshots there), Ctrl+Shift elsewhere
  // (Ctrl+Alt is AltGr on many layouts).
  if (primary && /^Digit[1-9]$/.test(code) && (mac ? alt && !shift : shift && !alt)) return repeatable(`set-${code.slice(5)}`);
  if (mac && primary && alt && !shift && (code === "ArrowRight" || code === "ArrowLeft")) {
    return repeatable(code === "ArrowRight" ? "tab-next" : "tab-previous");
  }
  if (!primary || alt) return null;
  if (shift) return repeatable(PRIMARY_SHIFT_KEYS[key] ?? PRIMARY_SHIFT_CODES[code]);
  return repeatable(PRIMARY_KEYS[key] ?? PRIMARY_CODES[code]);
}

module.exports = { matchCommand, COMMAND_ACCELERATORS, ALT_CODES, CATALOG };
