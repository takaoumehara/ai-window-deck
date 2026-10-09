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
};
for (let n = 1; n <= 8; n += 1) ALT_CODES[`Digit${n}`] = `focus-tile-${n}`;

const COMMAND_ACCELERATORS = {
  "toggle-spotlight": "Alt+X",
  "restore-home": "Alt+Z",
  "toggle-fullscreen": "Alt+Q",
  "focus-next": "Alt+]",
  "focus-previous": "Alt+[",
  "toggle-sidebar": "Alt+B",
  "reload-pane": "CmdOrCtrl+R",
};

function matchCommand(input) {
  if (input.type !== "keyDown" || input.isAutoRepeat) return null;
  if (input.alt && !input.control && !input.meta && !input.shift) return ALT_CODES[input.code] ?? null;
  const primary = process.platform === "darwin" ? input.meta && !input.control : input.control && !input.meta;
  if (primary && !input.alt && !input.shift && input.code === "KeyR") return "reload-pane";
  return null;
}

module.exports = { matchCommand, COMMAND_ACCELERATORS, ALT_CODES };
