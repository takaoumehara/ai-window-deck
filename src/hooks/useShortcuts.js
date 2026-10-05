import { useEffect, useState } from "react";

// Chrome writes Alt+X as ⌥X on macOS; show the label the user's keyboard has.
const isMac = typeof navigator !== "undefined"
  && /mac/i.test(navigator.userAgentData?.platform || navigator.platform || "");

const DEFAULT_SHORTCUTS = {
  "toggle-spotlight": isMac ? "⌥ X" : "Alt+X",
  "restore-home": isMac ? "⌥ Z" : "Alt+Z",
};

// The shortcuts actually assigned in chrome://extensions/shortcuts, which the
// user may have changed, falling back to the manifest's suggested keys.
export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.commands?.getAll) return;
    chrome.commands.getAll((commands) => {
      const next = { ...DEFAULT_SHORTCUTS };
      (commands || []).forEach((command) => {
        if (command.name in next && command.shortcut) next[command.name] = command.shortcut;
      });
      setShortcuts(next);
    });
  }, []);

  return shortcuts;
}
