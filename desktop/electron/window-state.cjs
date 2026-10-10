const { app, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_SIZE = { width: 1440, height: 900 };
const statePath = () => path.join(app.getPath("userData"), "window-state.json");

function intersects(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

// The saved frame is reused only while it still overlaps a connected display.
function loadWindowState() {
  try {
    const saved = JSON.parse(fs.readFileSync(statePath(), "utf8"));
    const frame = { x: saved.x, y: saved.y, width: saved.width, height: saved.height };
    if (![frame.x, frame.y, frame.width, frame.height].every(Number.isFinite)) throw new Error("bad state");
    const onScreen = screen.getAllDisplays().some((display) => intersects(frame, display.workArea));
    return onScreen ? { ...frame, maximized: Boolean(saved.maximized) } : { ...DEFAULT_SIZE, maximized: Boolean(saved.maximized) };
  } catch {
    return { ...DEFAULT_SIZE, maximized: false };
  }
}

function trackWindowState(window) {
  let timer = null;
  const save = () => {
    clearTimeout(timer);
    if (window.isDestroyed()) return;
    const frame = window.getNormalBounds();
    try {
      fs.writeFileSync(statePath(), JSON.stringify({ ...frame, maximized: window.isMaximized() }));
    } catch {
      // A missing frame only means the next launch opens at the default size.
    }
  };
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(save, 400);
  };
  window.on("resize", later);
  window.on("move", later);
  window.on("close", save);
}

module.exports = { loadWindowState, trackWindowState };
