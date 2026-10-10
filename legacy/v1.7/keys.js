// Chrome reports a shortcut in whatever notation the platform uses: "⌃⇧Space"
// on macOS, "Ctrl+Shift+Space" on Windows, Linux and ChromeOS. Both forms are
// reduced to a list of key names so the popup can spell them out in words —
// the symbols alone are unreadable for anyone who has not memorised them.
const MAC_SYMBOLS = { "⌃": "Control", "⇧": "Shift", "⌘": "Command", "⌥": "Option" };
const NAMED_KEYS = { Ctrl: "Control", MacCtrl: "Control", Command: "Command", Search: "Search" };
const ARROWS = { "→": "Right", "←": "Left", "↑": "Up", "↓": "Down" };

function platformName() {
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  if (/mac/i.test(platform)) return "mac";
  if (/win/i.test(platform)) return "windows";
  if (/cros|chrome\s?os/i.test(platform)) return "chromeos";
  return "linux";
}

function shortcutKeys(shortcut) {
  if (!shortcut) return [];
  if (shortcut.includes("+")) {
    return shortcut.split("+").map((key) => NAMED_KEYS[key] ?? ARROWS[key] ?? key);
  }
  const keys = [];
  let rest = shortcut;
  while (rest && MAC_SYMBOLS[rest[0]]) {
    keys.push(MAC_SYMBOLS[rest[0]]);
    rest = rest.slice(1);
  }
  if (rest) keys.push(ARROWS[rest] ?? rest);
  return keys;
}

// The words are always shown; the native form only when it looks different,
// so Windows and Linux do not get the same string printed twice.
function shortcutForms(shortcut) {
  const words = shortcutKeys(shortcut).join(" + ");
  const compact = shortcut ?? "";
  return { words, native: compact.replace(/\+/g, " + ") === words ? "" : compact };
}
