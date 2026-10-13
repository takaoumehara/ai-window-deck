const { app, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_SIZE = { width: 1440, height: 900 };
const statePath = () => path.join(app.getPath("userData"), "window-state.json");

function intersects(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

// The saved frame is reused only while it still overlaps a connected display,
// so a window left on a monitor that is gone opens on the main one.
function placeFrame(saved) {
  const frame = { x: saved?.x, y: saved?.y, width: saved?.width, height: saved?.height };
  if (![frame.x, frame.y, frame.width, frame.height].every(Number.isFinite)) return { ...DEFAULT_SIZE };
  const onScreen = screen.getAllDisplays().some((display) => intersects(frame, display.workArea));
  return onScreen ? frame : { ...DEFAULT_SIZE };
}

/** Deck windows open at the last quit: [{ setId, x, y, width, height, maximized }]. */
function loadWindowStates() {
  try {
    const saved = JSON.parse(fs.readFileSync(statePath(), "utf8"));
    // Before deck windows had sets, the file held a single frame.
    const list = Array.isArray(saved.windows) ? saved.windows : [saved];
    return list.map((entry) => ({ setId: entry.setId || null, ...placeFrame(entry), maximized: Boolean(entry.maximized) }));
  } catch {
    return [];
  }
}

function saveWindowStates(list) {
  try {
    fs.writeFileSync(statePath(), JSON.stringify({ windows: list }));
  } catch {
    // A missing frame only means the next launch opens at the default size.
  }
}

function frameOf(window) {
  return { ...window.getNormalBounds(), maximized: window.isMaximized() };
}

// A new deck window opens a step down and right of the one it came from.
function cascadeFrom(window) {
  if (!window || window.isDestroyed()) return { ...DEFAULT_SIZE };
  const { x, y, width, height } = window.getNormalBounds();
  return placeFrame({ x: x + 32, y: y + 32, width, height });
}

module.exports = { loadWindowStates, saveWindowStates, frameOf, cascadeFrom, DEFAULT_SIZE };
