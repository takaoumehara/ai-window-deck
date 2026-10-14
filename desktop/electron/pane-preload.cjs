// Runs in an isolated world inside each page view; the page itself gets no API.
// Chrome handles the mouse's back / forward buttons in the browser UI, which
// Electron doesn't have, so they are forwarded to the main process here.
const { ipcRenderer } = require("electron");

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
