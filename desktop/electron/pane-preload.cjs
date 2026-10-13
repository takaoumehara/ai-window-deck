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
