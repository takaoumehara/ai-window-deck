// Runs in an isolated world inside each page view; the page itself gets no API.
// Chrome handles the mouse's back / forward buttons in the browser UI, which
// Electron doesn't have, so they are forwarded to the main process here.
const { contextBridge, ipcRenderer } = require("electron");

// Electron has no passkey (Touch ID, iCloud Keychain, phone) prompt: a page's
// navigator.credentials request for one waits silently. The request goes
// ahead untouched (a USB security key may still answer it); the page tells
// this preload, which asks the deck to explain. Autofill requests
// (mediation "conditional") ask nothing of the user and are left alone.
// Google's sign-in inspects the browser's own functions, so its pages keep
// them untouched.
if (!/^accounts\.google\.|^accounts\.youtube\.com$/.test(location.hostname)) contextBridge.executeInMainWorld({
  func: () => {
    const container = globalThis.CredentialsContainer?.prototype;
    if (!container) return;
    for (const name of ["get", "create"]) {
      const original = container[name];
      if (typeof original !== "function") continue;
      Object.defineProperty(container, name, {
        configurable: true,
        writable: true,
        value: {
          [name](options) {
            if (options?.publicKey && options.mediation !== "conditional") window.dispatchEvent(new Event("deck-passkey-request"));
            return original.apply(this, arguments);
          },
        }[name],
      });
    }
  },
});

let lastPasskeyNotice = 0;
window.addEventListener("deck-passkey-request", () => {
  if (Date.now() - lastPasskeyNotice < 15000) return;
  lastPasskeyNotice = Date.now();
  ipcRenderer.send("pane:passkey");
});

window.addEventListener(
  "mouseup",
  (event) => {
    if (event.button !== 3 && event.button !== 4) return;
    event.preventDefault();
    ipcRenderer.send("pane:mouse-nav", event.button === 3 ? "back" : "forward");
  },
  true
);

// ⌘← / ⌘→ go back and forward in Chrome on macOS, except in a text field,
// where they move the caret. Only the page knows what has focus, so these
// are matched here rather than with the deck's other shortcuts.
const isEditable = (element) =>
  element instanceof Element && (element.isContentEditable || Boolean(element.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")));

if (process.platform === "darwin") {
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || !event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (isEditable(event.composedPath()[0]) || isEditable(document.activeElement)) return;
    event.preventDefault();
    ipcRenderer.send("pane:key-nav", event.key === "ArrowLeft" ? "back" : "forward");
  });
}
