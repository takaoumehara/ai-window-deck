import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadBackground({ windows, sessionValues = {} }) {
  const source = await readFile(new URL("../background.js", import.meta.url), "utf8");
  const listeners = {};
  const updates = [];
  const session = { undoStack: [], ...sessionValues };
  const display = {
    id: "display-1",
    bounds: { left: 0, top: 0, width: 1440, height: 900 },
    workArea: { left: 0, top: 0, width: 1440, height: 860 },
    isPrimary: true,
  };
  const chrome = {
    storage: {
      session: {
        get: async (key) => ({ [key]: session[key] }),
        set: async (value) => Object.assign(session, value),
      },
      sync: {
        get: async (defaults) => ({ ...defaults }),
        set: async () => {},
      },
    },
    system: { display: { getInfo: async () => [display] } },
    windows: {
      getAll: async () => windows,
      getLastFocused: async () => windows[0],
      update: async (id, changes) => updates.push({ id, changes }),
      onBoundsChanged: { addListener: () => {} },
      create: async () => { throw new Error("tile must not create windows"); },
    },
    tabs: { group: async () => 1, query: async () => [] },
    tabGroups: { query: async () => [], update: async () => {} },
    runtime: {
      getURL: (path = "") => `chrome-extension://deck/${path}`,
      onMessage: { addListener: (handler) => { listeners.message = handler; } },
    },
    commands: { onCommand: { addListener: () => {} } },
  };
  vm.runInNewContext(source, { chrome, console, setTimeout, clearTimeout, Promise });
  return { listeners, updates };
}

test("deck-only retile updates only windows launched by the deck", async () => {
  const deckWindow = { id: 10, type: "normal", state: "normal", left: 0, top: 0, width: 500, height: 400, tabs: [] };
  const settingsWindow = { id: 20, type: "normal", state: "normal", left: 600, top: 0, width: 500, height: 400, tabs: [{ url: "chrome-extension://deck/dist/index.html" }] };
  const unrelatedWindow = { id: 30, type: "normal", state: "normal", left: 900, top: 0, width: 500, height: 400, tabs: [{ url: "https://example.com" }] };
  const { listeners, updates } = await loadBackground({
    windows: [deckWindow, settingsWindow, unrelatedWindow],
    sessionValues: { deckWindowIds: [10] },
  });

  await new Promise((resolve) => {
    listeners.message({
      type: "tile",
      deckOnly: true,
      targetDisplays: ["display-1"],
      sameDisplayOnly: true,
      preset: { columns: 1, rows: 1, cells: [{ x: 0, y: 0, w: 1, h: 1 }] },
    }, {}, resolve);
  });

  assert.deepEqual(updates.map(({ id }) => id), [10]);
});
