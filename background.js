const DEFAULTS = {
  columns: 4,
  rows: 2,
  gap: 8,
  spotlightSize: "full",   // full | height | tall | half | custom
  spotlightWidth: 70,      // percent of the work area, custom only
  spotlightHeight: 90,
  spotlightAnchor: "keep", // keep | center
  language: "auto",
  // Saved arrangements. Each is { name, columns, rows, slots: [{name, urls}] }.
  presets: [],
  activePreset: 0,
  slots: [],               // legacy single arrangement, migrated on first read
  skipMinimized: true,
  keepOrder: true,
  targetDisplay: "focused",  // legacy single choice, migrated on read
  targetDisplays: [],        // empty means "wherever I am working"; otherwise display ids
  sameDisplayOnly: true,
  groupTabs: true,
  openEmpty: true,
};

// Chrome's own tab-group palette. A slot set to "auto" takes the next one, so
// a freshly built deck is colour-coded without anyone choosing anything.
const GROUP_COLORS = ["blue", "purple", "green", "orange", "pink", "cyan", "red", "yellow"];

// Percent of the work area each preset occupies. "full" is a real OS maximize,
// and "height" keeps whatever width the window already has.
const PRESETS = { tall: [50, 100], half: [50, 50], threeFourths: [75, 75], full: [100, 100] };

const UNDO_LIMIT = 10;

// The service worker is torn down after a short idle, so anything that has to
// survive between two shortcut presses lives in session storage, not a Map.
async function session(key, fallback) {
  const { [key]: value } = await chrome.storage.session.get(key);
  return value ?? fallback;
}

async function settings() {
  try {
    const stored = await chrome.storage.sync.get(null); // Get ALL stored values
    const merged = { ...DEFAULTS, ...stored };
    
    console.log('[AI Window Deck] Settings loaded:', {
      spotlightSize: merged.spotlightSize,
      spotlightWidth: merged.spotlightWidth,
      spotlightHeight: merged.spotlightHeight,
      spotlightAnchor: merged.spotlightAnchor,
      targetDisplays: merged.targetDisplays,
      fromStorage: {
        spotlightSize: stored.spotlightSize,
        spotlightWidth: stored.spotlightWidth,
        spotlightHeight: stored.spotlightHeight,
        spotlightAnchor: stored.spotlightAnchor,
      }
    });
    
    // Validate spotlight settings
    if (merged.spotlightSize && !['full', 'height', 'tall', 'half', 'threeFourths', 'custom'].includes(merged.spotlightSize)) {
      console.warn('[AI Window Deck] Invalid spotlightSize:', merged.spotlightSize, '- resetting to "full"');
      merged.spotlightSize = 'full';
    }
    
    if (merged.spotlightAnchor && !['keep', 'center'].includes(merged.spotlightAnchor)) {
      console.warn('[AI Window Deck] Invalid spotlightAnchor:', merged.spotlightAnchor, '- resetting to "keep"');
      merged.spotlightAnchor = 'keep';
    }
    
    return merged;
  } catch (error) {
    console.error('[AI Window Deck] Error reading settings:', error);
    return { ...DEFAULTS };
  }
}

// The arrangement in use, whichever storage generation it was written by. A
// profile saved before named sets existed keeps working: its single grid
// becomes the first set.
function activeArrangement(config) {
  const preset = config.presets?.[config.activePreset] ?? config.presets?.[0];
  const normalise = (slot) => (typeof slot === "string"
    ? { name: "", urls: slot, color: "auto" }
    : { name: "", urls: "", color: "auto", ...slot });
  if (preset) {
    return {
      columns: preset.columns ?? config.columns,
      rows: preset.rows ?? config.rows,
      cells: preset.cells ?? null,
      slots: (preset.slots ?? []).map(normalise),
    };
  }
  return {
    columns: config.columns,
    rows: config.rows,
    slots: (config.slots ?? []).map(normalise),
  };
}

const centreOf = (window) => ({
  x: (window.left ?? 0) + (window.width ?? 0) / 2,
  y: (window.top ?? 0) + (window.height ?? 0) / 2,
});

const contains = (display, point) =>
  point.x >= display.bounds.left && point.x < display.bounds.left + display.bounds.width &&
  point.y >= display.bounds.top && point.y < display.bounds.top + display.bounds.height;

async function displayFor(window) {
  const displays = await chrome.system.display.getInfo();
  return displays.find((display) => contains(display, centreOf(window)))
    ?? displays.find(({ isPrimary }) => isPrimary) ?? displays[0];
}

// The screens everything lands on, left to right. Pinning them matters with
// more than one monitor: the window that happened to be focused is often the
// settings panel, not the deck. An empty choice follows the focused window.
async function targetDisplays(config) {
  const displays = await chrome.system.display.getInfo();
  const wanted = config.targetDisplays?.length
    ? config.targetDisplays
    : (config.targetDisplay && config.targetDisplay !== "focused" ? [config.targetDisplay] : []);
  const chosen = wanted
    .map((id) => displays.find((display) => display.id === id))
    .filter(Boolean);
  if (!chosen.length) return [await displayFor(await chrome.windows.getLastFocused())];
  return chosen.sort((a, b) => a.bounds.left - b.bounds.left || a.bounds.top - b.bounds.top);
}

// Rows are detected by banding the y coordinate: two windows whose tops are
// within a band are treated as the same visual row, so a roughly-tidy screen
// keeps its reading order instead of being reshuffled by window id.
const ROW_BAND = 120;
function inReadingOrder(windows) {
  return [...windows].sort((a, b) =>
    Math.round((a.top ?? 0) / ROW_BAND) - Math.round((b.top ?? 0) / ROW_BAND)
    || (a.left ?? 0) - (b.left ?? 0));
}

// ---- the Deck's own tab ------------------------------------------------
//
// The panel used to be the toolbar popup, which is not a window: "the last
// focused window" was always the browser window the user was working in, and
// arranging never touched the panel. The panel is now an ordinary tab, so the
// window showing it would otherwise be tiled, enlarged and cycled through
// like any other — moving the page out from under the click that asked for it.
//
// Rule: a window whose *active* tab is one of our pages (the Deck tab, the
// floating controller) is "showing the Deck" and is left alone by Arrange,
// Retile, focus cycling and the window list. A window where the Deck tab sits
// in the background is a normal window again. Commands that act on "the
// current window" (Spotlight, Restore, Full screen, Next/Previous) act on the
// window the user was last working in, exactly as they did from the popup.
const isOwnPage = (tab) => (tab?.url || tab?.pendingUrl || "").startsWith(chrome.runtime.getURL(""));

function showsDeck(window) {
  const tabs = window?.tabs ?? [];
  if (!tabs.length) return false;
  const active = tabs.find((tab) => tab.active) ?? tabs[0];
  return isOwnPage(active) || tabs.every(isOwnPage);
}

// Remember the last window the user worked in that is not showing the Deck,
// so a button pressed inside the Deck tab still reaches that window.
async function noteWorkWindow(windowId) {
  if (windowId == null || windowId === chrome.windows.WINDOW_ID_NONE) return;
  try {
    const window = await chrome.windows.get(windowId, { populate: true });
    if (window.type === "normal" && !showsDeck(window)) {
      await chrome.storage.session.set({ workWindowId: window.id });
    }
  } catch {
    // The window closed before we could look at it.
  }
}

chrome.windows.onFocusChanged?.addListener((windowId) => { noteWorkWindow(windowId); });
chrome.tabs.onActivated?.addListener(({ windowId }) => { noteWorkWindow(windowId); });

// The window an action on "the current window" should act on: the focused
// one, unless that is the Deck itself, in which case the window the user was
// in before opening the Deck. Null when there is no such window.
async function workingWindow() {
  const last = await chrome.windows.getLastFocused({ populate: true });
  if (!showsDeck(last)) return last;
  const id = await session("workWindowId", null);
  if (id != null && id !== last.id) {
    try {
      const window = await chrome.windows.get(id, { populate: true });
      if (window.type === "normal" && !showsDeck(window)) return window;
    } catch {
      // Closed since; fall through.
    }
  }
  // Nothing remembered (fresh service worker): only guess when there is
  // exactly one candidate, never pick an arbitrary window to resize.
  const others = (await chrome.windows.getAll({ populate: true })).filter((window) =>
    window.type === "normal" && window.state !== "minimized" && !showsDeck(window));
  return others.length === 1 ? others[0] : null;
}

async function normalWindows(config, displays) {
  let windows = (await chrome.windows.getAll({ populate: true })).filter(
    (window) => window.type === "normal"
      && !(config.skipMinimized && window.state === "minimized")
      && !showsDeck(window)
  );
  if (displays?.length && config.sameDisplayOnly) {
    windows = windows.filter((window) =>
      displays.some((display) => contains(display, centreOf(window))));
  }
  return config.keepOrder ? inReadingOrder(windows) : windows;
}

async function deckWindows(config, displays) {
  const ids = new Set(await session("deckWindowIds", []));
  if (!ids.size) return [];
  return (await normalWindows(config, displays)).filter((window) => ids.has(window.id));
}

// ---- undo -------------------------------------------------------------

const snapshotOf = (window) => ({
  id: window.id,
  left: window.left, top: window.top, width: window.width, height: window.height,
  state: window.state,
});

async function pushUndo(windows) {
  if (!windows.length) return;
  const stack = await session("undoStack", []);
  stack.push(windows.map(snapshotOf));
  await chrome.storage.session.set({ undoStack: stack.slice(-UNDO_LIMIT) });
}

async function undoLayout() {
  const stack = await session("undoStack", []);
  const frame = stack.pop();
  if (!frame) return { ok: false, reason: "empty" };
  await chrome.storage.session.set({ undoStack: stack });

  const alive = new Set((await chrome.windows.getAll()).map((window) => window.id));
  for (const shot of frame) {
    if (!alive.has(shot.id)) continue;
    if (shot.state === "maximized" || shot.state === "fullscreen") {
      await chrome.windows.update(shot.id, { state: shot.state });
      continue;
    }
    await chrome.windows.update(shot.id, { state: "normal" });
    await chrome.windows.update(shot.id, {
      left: shot.left, top: shot.top, width: shot.width, height: shot.height,
    });
  }
  return { ok: true, restored: frame.length };
}

// ---- window close tracking ------------------------------------------------

// Track windows opened by the extension so we can offer to close only those.
// Uses session storage (cleared when browser closes) so we don't need sessions permission.
async function trackExtensionWindow(windowId) {
  const tracked = await session("extensionOpenedWindows", []);
  if (!tracked.includes(windowId)) {
    tracked.push(windowId);
    await chrome.storage.session.set({ extensionOpenedWindows: tracked });
    console.log('[AI Window Deck] Tracking window:', windowId);
  }
}

async function untrackExtensionWindow(windowId) {
  const tracked = await session("extensionOpenedWindows", []);
  const filtered = tracked.filter(id => id !== windowId);
  await chrome.storage.session.set({ extensionOpenedWindows: filtered });
  console.log('[AI Window Deck] Untracked window:', windowId);
}

async function getTrackedWindows() {
  const tracked = await session("extensionOpenedWindows", []);
  // Filter out windows that no longer exist
  const allWindows = await chrome.windows.getAll();
  const existingIds = new Set(allWindows.map(w => w.id));
  const validTracked = tracked.filter(id => existingIds.has(id));
  
  // Update session if any windows were removed
  if (validTracked.length !== tracked.length) {
    await chrome.storage.session.set({ extensionOpenedWindows: validTracked });
  }
  
  return validTracked;
}

async function closeExtensionWindows(windowIds) {
  const results = { closed: [], failed: [] };
  for (const windowId of windowIds) {
    try {
      await chrome.windows.remove(windowId);
      await untrackExtensionWindow(windowId);
      results.closed.push(windowId);
    } catch (error) {
      console.error('[AI Window Deck] Failed to close window:', windowId, error);
      results.failed.push(windowId);
    }
  }
  return results;
}

// ---- layout -----------------------------------------------------------

// A layout is a list of cells on a cols x rows board: {x, y, w, h} in board
// units. An even split is just the case where every cell is 1x1, which is why
// "8 equal windows" and "five windows with a big middle" go through the same
// code instead of being two features.
function evenCells(count, columns) {
  const cols = Math.min(columns, count);
  return Array.from({ length: count }, (_, index) => ({
    x: index % cols, y: Math.floor(index / cols), w: 1, h: 1,
  }));
}

function boardOf(cells, columns) {
  return {
    cols: Math.max(columns, ...cells.map((cell) => cell.x + cell.w)),
    rows: Math.max(...cells.map((cell) => cell.y + cell.h)),
  };
}

function cellFrames(cells, workArea, columns, gap) {
  if (!cells.length) return [];
  const { cols, rows } = boardOf(cells, columns);
  const unitW = (workArea.width - gap * (cols - 1)) / cols;
  const unitH = (workArea.height - gap * (rows - 1)) / rows;
  return cells.map((cell) => ({
    left: Math.round(workArea.left + cell.x * (unitW + gap)),
    top: Math.round(workArea.top + cell.y * (unitH + gap)),
    width: Math.round(cell.w * unitW + (cell.w - 1) * gap),
    height: Math.round(cell.h * unitH + (cell.h - 1) * gap),
  }));
}

function gridFrames(count, workArea, columns, gap) {
  return cellFrames(evenCells(count, columns), workArea, columns, gap);
}

// Bounds and `state` must not travel in the same chrome.windows.update call:
// Chrome treats the state change as a restore and re-applies the window's
// remembered size, discarding the bounds sent with it. Un-maximise first, then
// place.
async function place(windowId, currentState, bounds) {
  if (currentState && currentState !== "normal") {
    await chrome.windows.update(windowId, { state: "normal" });
  }
  await chrome.windows.update(windowId, bounds);
}

// Windows are shared out across the chosen screens in order, each screen
// getting its own grid, so picking three monitors spreads the deck over all
// three rather than cramming it onto one.
function spreadFrames(count, displays, columns, gap, cells) {
  // An uneven shape is drawn for one screen; spreading it over several would
  // mean inventing a different shape per screen, so it stays on the first.
  if (cells?.length) return cellFrames(cells.slice(0, count), displays[0].workArea, columns, gap);
  const frames = [];
  displays.forEach((display, index) => {
    const share = Math.floor(count / displays.length) + (index < count % displays.length ? 1 : 0);
    if (share) frames.push(...gridFrames(share, display.workArea, columns, gap));
  });
  return frames;
}

async function layOut(windows, displays, columns, gap, cells) {
  if (!windows.length) return;
  const frames = spreadFrames(windows.length, displays, columns, gap, cells);
  await Promise.all(windows.map((window, index) => place(window.id, window.state, frames[index])));
}

async function tileWindows(options = {}) {
  const config = { ...(await settings()), ...(options || {}) };
  const displays = await targetDisplays(config);
  const windows = options.deckOnly
    ? await deckWindows(config, displays)
    : await normalWindows(config, displays);
  if (!windows.length) return { ok: false, reason: options.deckOnly ? "deck-empty" : "empty" };
  await pushUndo(windows);
  const shape = options?.preset
    ? {
        columns: options.preset.columns ?? config.columns,
        rows: options.preset.rows ?? config.rows,
        cells: options.preset.cells ?? null,
      }
    : activeArrangement(config);
  await layOut(windows, displays, shape.columns, config.gap, shape.cells);
  return { ok: true, arranged: windows.length, screens: displays.length };
}

// Puts each window's tabs into a Chrome tab group carrying the window's name
// and colour, so the strip itself says which deck slot you are looking at.
async function groupWindows(windows, slots) {
  await Promise.all(windows.map(async (window, index) => {
    const tabIds = (window.tabs ?? []).map((tab) => tab.id).filter((id) => id != null);
    if (!tabIds.length) return;
    const slot = slots[index];
    const color = slot.color && slot.color !== "auto"
      ? slot.color
      : GROUP_COLORS[slot.index % GROUP_COLORS.length];
    try {
      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: window.id } });
      await chrome.tabGroups.update(groupId, {
        title: slot.name?.trim() || `${index + 1}`,
        color,
      });
    } catch {
      // Grouping is a nicety; a window that refuses it still opens and tiles.
    }
  }));
}

// Opens one window per non-empty slot, each with its own list of URLs as tabs,
// then tiles only those windows so an existing unrelated window is left alone.
async function launchDeck(options = {}) {
  const config = { ...(await settings()), ...(options || {}) };
  const arrangement = options?.preset
    ? {
        columns: options.preset.columns ?? config.columns,
        rows: options.preset.rows ?? config.rows,
        cells: options.preset.cells ?? null,
        slots: (options.preset.slots ?? []).map((slot) => (
          typeof slot === "string"
            ? { name: "", urls: slot, color: "auto" }
            : { name: "", urls: "", color: "auto", ...slot }
        )),
      }
    : activeArrangement(config);

  const all = arrangement.slots.map((slot, index) => ({
    ...slot,
    index,
    urls: (Array.isArray(slot.urls) ? slot.urls : String(slot.urls ?? "").split("\n"))
      .map((line) => line.trim())
      .filter(Boolean),
  }));

  // Choosing an eight-way split and getting three windows is a surprise, so by
  // default every square opens — an empty one just gets a new tab.
  const planned = config.openEmpty ? all : all.filter((slot) => slot.urls.length);
  if (!planned.length) return { ok: false, reason: "empty" };

  const displays = await targetDisplays(config);
  const frames = spreadFrames(planned.length, displays, arrangement.columns, config.gap, arrangement.cells);

  const created = [];
  for (const [index, slot] of planned.entries()) {
    created.push(await chrome.windows.create({
      ...(slot.urls.length ? { url: slot.urls } : {}),
      focused: false, ...frames[index],
    }));
  }

  if (config.groupTabs) await groupWindows(created, planned);
  const liveIds = new Set((await chrome.windows.getAll()).map((window) => window.id));
  const deckSlotMap = Object.fromEntries(Object.entries(await session("deckSlotMap", {}))
    .filter(([id]) => liveIds.has(Number(id))));
  created.forEach((window, i) => {
    deckSlotMap[window.id] = { presetIndex: options.presetIndex ?? null,
      slotId: planned[i].id ?? null, slotIndex: planned[i].index };
  });
  await chrome.storage.session.set({ deckSlotMap });
  await chrome.storage.session.set({ deckWindowIds: created.map((window) => window.id) });

  // A window keeps settling for a moment after it is created, and Chrome
  // re-applies its remembered size over anything set before that finishes.
  // Measured: bounds given to create() are lost on every window, and a single
  // immediate update loses whichever window was created last. Two delayed
  // passes hold on all of them.
  for (let pass = 0; pass < 2; pass++) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await Promise.all(created.map((window, index) => chrome.windows.update(window.id, frames[index])));
  }

  if (created[0]) await chrome.windows.update(created[0].id, { focused: true });
  return { ok: true, opened: created.length };
}

// ---- spotlight --------------------------------------------------------

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Grows the window around its own centre so it stays where the eye expects it,
// then pulls it back inside the work area.
function spotlightBounds(workArea, window, config) {
  console.log('[AI Window Deck] spotlightBounds called with:', {
    workArea,
    windowState: { left: window.left, top: window.top, width: window.width, height: window.height },
    config: {
      spotlightSize: config.spotlightSize,
      spotlightWidth: config.spotlightWidth,
      spotlightHeight: config.spotlightHeight,
      spotlightAnchor: config.spotlightAnchor,
    }
  });
  
  let width;
  let height;
  if (config.spotlightSize === "height") {
    width = window.width ?? workArea.width;   // leave the width exactly as it is
    height = workArea.height;
    console.log('[AI Window Deck] Using "height" mode: keeping width', width, 'setting height to', height);
  } else {
    const preset = PRESETS[config.spotlightSize];
    const [percentW, percentH] = preset ?? [config.spotlightWidth, config.spotlightHeight];
    
    console.log('[AI Window Deck] Size calculation:', {
      spotlightSize: config.spotlightSize,
      foundPreset: !!preset,
      percentW,
      percentH,
      workAreaWidth: workArea.width,
      workAreaHeight: workArea.height,
    });
    
    width = Math.round(workArea.width * clamp(percentW, 20, 100) / 100);
    height = Math.round(workArea.height * clamp(percentH, 20, 100) / 100);
  }
  width = Math.min(width, workArea.width);
  height = Math.min(height, workArea.height);

  console.log('[AI Window Deck] Calculated dimensions:', { width, height });

  if (config.spotlightAnchor === "center") {
    const bounds = {
      left: workArea.left + Math.round((workArea.width - width) / 2),
      top: workArea.top + Math.round((workArea.height - height) / 2),
      width,
      height,
    };
    console.log('[AI Window Deck] Using "center" anchor, final bounds:', bounds);
    return bounds;
  }
  const { x: centerX, y: centerY } = centreOf(window);
  const bounds = {
    left: clamp(Math.round(centerX - width / 2), workArea.left, workArea.left + workArea.width - width),
    top: clamp(Math.round(centerY - height / 2), workArea.top, workArea.top + workArea.height - height),
    width,
    height,
  };
  console.log('[AI Window Deck] Using "keep" anchor, centered on window, final bounds:', bounds);
  return bounds;
}

const SNAP = 8; // px of slack, so a window nudged by the OS still counts as placed
const STACK_LIMIT = 8;

const isAt = (window, bounds) => bounds
  && Math.abs(window.left - bounds.left) <= SNAP
  && Math.abs(window.top - bounds.top) <= SNAP
  && Math.abs(window.width - bounds.width) <= SNAP
  && Math.abs(window.height - bounds.height) <= SNAP;

// Enlarging is a stack, not a single slot. Tile, then enlarge, then go full
// screen, and each step remembers what it covered up; pressing back walks the
// whole way home instead of stopping one step short. A single slot meant the
// full-screen step overwrote the memory of the tiled square.
async function geometry(windowId) {
  const saved = await session("previousBounds", {});
  return { saved, stack: saved[windowId] ?? [] };
}

async function stepInto(window, saved, stack, previous, applied, appliedState) {
  stack.push({ ...previous, applied, appliedState });
  saved[window.id] = stack.slice(-STACK_LIMIT);
  await chrome.storage.session.set({ previousBounds: saved });
}

async function stepBack(window, saved, stack) {
  const entry = stack.pop();
  if (stack.length) saved[window.id] = stack; else delete saved[window.id];
  await chrome.storage.session.set({ previousBounds: saved });
  if (entry.state === "maximized" || entry.state === "fullscreen") {
    await chrome.windows.update(window.id, { state: entry.state, focused: true });
    return;
  }
  await place(window.id, window.state, { ...entry.bounds, focused: true });
}

// Where the window really ended up after an enlarge. The OS or window manager
// may refuse the exact frame (a menu bar, a title bar kept on screen, Chrome's
// minimum width), so the next press compares against both the frame asked for
// and the frame that landed; otherwise a nudged window would enlarge again
// instead of going back.
async function noteLanded(windowId, saved, stack) {
  const top = stack[stack.length - 1];
  const actual = await chrome.windows.get(windowId).catch(() => null);
  if (!top || !actual || actual.state !== "normal") return;
  top.landed = { left: actual.left, top: actual.top, width: actual.width, height: actual.height };
  saved[windowId] = stack.slice(-STACK_LIMIT);
  await chrome.storage.session.set({ previousBounds: saved });
}

const snapshotGeometry = (window) => ({
  bounds: { left: window.left, top: window.top, width: window.width, height: window.height },
  state: window.state,
});

// ---- focus view (per layout) ------------------------------------------
//
// Step ③ of the setup flow saves `preset.focus` on a layout:
//   { size: fill | large | half | height | custom, side: left | right | here,
//     origin: keep | center, width, height (custom, %), others: leave | strip | hide }
// (v1.10 stored size "center": read as large + center.)
// A window opened by that layout then enlarges the way the layout says, inside
// the layout's own launch display. A window that belongs to no layout follows
// `focusOutside` when step ③ set it; otherwise, like a layout without `focus`,
// it keeps the shared behaviour above (spotlightSize & co., an OS maximize by
// default), so nothing changes for anyone who never opens step ③.
// Mirrored for the preview in src/lib/focus-view.js.

const FOCUS_SIZES = ["fill", "large", "half", "height", "custom"];
const FOCUS_SIDES = ["left", "right", "here"];
const FOCUS_ORIGINS = ["keep", "center"];
const FOCUS_OTHERS = ["leave", "strip", "hide"];
const FOCUS_LARGE_RATIO = 0.8;
const FOCUS_STRIP = { ratio: 0.18, min: 120, max: 220 };

const focusPercent = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(20, Math.min(100, Math.round(number))) : fallback;
};

function normaliseFocus(focus) {
  if (!focus || typeof focus !== "object") return null;
  const legacyCenter = focus.size === "center";
  return {
    size: legacyCenter ? "large" : FOCUS_SIZES.includes(focus.size) ? focus.size : "fill",
    side: FOCUS_SIDES.includes(focus.side) ? focus.side : "left",
    origin: legacyCenter ? "center" : FOCUS_ORIGINS.includes(focus.origin) ? focus.origin : "center",
    width: focusPercent(focus.width, 70),
    height: focusPercent(focus.height, 90),
    others: FOCUS_OTHERS.includes(focus.others) ? focus.others : "leave",
  };
}

// target: bounds for the enlarged window, or null for a real OS maximize.
// strip: bounds for each other window when they line up along the bottom.
// current: the window's bounds now; "grow in place" centres the new size on
// it and pulls it back inside, so it grows toward the side with room.
function focusLayout(workArea, focus, otherCount = 0, gap = 8, minWidth = 0, current = null) {
  const f = normaliseFocus(focus) ?? normaliseFocus({});
  const useStrip = f.others === "strip" && otherCount > 0;
  const stripHeight = useStrip
    ? Math.min(FOCUS_STRIP.max, Math.max(FOCUS_STRIP.min, Math.round(workArea.height * FOCUS_STRIP.ratio)))
    : 0;
  const region = {
    left: workArea.left, top: workArea.top, width: workArea.width,
    height: useStrip ? workArea.height - stripHeight - gap : workArea.height,
  };
  const at = current && Number.isFinite(current.left) && Number.isFinite(current.width) ? current : null;
  const cx = at ? at.left + at.width / 2 : region.left + region.width / 2;
  const cy = at ? at.top + at.height / 2 : region.top + region.height / 2;
  const sized = (width, height) => {
    width = Math.min(width, region.width);
    height = Math.min(height, region.height);
    if (f.origin === "center" || !at) {
      return {
        left: region.left + Math.round((region.width - width) / 2),
        top: region.top + Math.round((region.height - height) / 2),
        width, height,
      };
    }
    return {
      left: clamp(Math.round(cx - width / 2), region.left, region.left + region.width - width),
      top: clamp(Math.round(cy - height / 2), region.top, region.top + region.height - height),
      width, height,
    };
  };
  let target = null;
  if (f.size === "fill") {
    target = useStrip ? { ...region } : null;
  } else if (f.size === "large") {
    target = sized(Math.round(region.width * FOCUS_LARGE_RATIO), Math.round(region.height * FOCUS_LARGE_RATIO));
  } else if (f.size === "custom") {
    target = sized(Math.round(region.width * f.width / 100), Math.round(region.height * f.height / 100));
  } else if (f.size === "height") {
    target = sized(at ? Math.round(at.width) : Math.round(region.width * 0.5), region.height);
  } else {
    const width = Math.round(region.width / 2);
    const side = f.side === "here" ? (cx >= region.left + region.width / 2 ? "right" : "left") : f.side;
    target = {
      left: side === "right" ? region.left + region.width - width : region.left,
      top: region.top, width, height: region.height,
    };
  }
  const strip = [];
  if (useStrip) {
    const top = workArea.top + workArea.height - stripHeight;
    const natural = (workArea.width - gap * (otherCount - 1)) / otherCount;
    const width = Math.max(natural, Math.min(minWidth, workArea.width));
    const step = otherCount > 1
      ? (natural >= width ? width + gap : (workArea.width - width) / (otherCount - 1))
      : 0;
    for (let i = 0; i < otherCount; i++) {
      strip.push({ left: Math.round(workArea.left + i * step), top, width: Math.round(width), height: stripHeight });
    }
  }
  return { target, strip };
}

// The same URL comparison the panel uses to match open windows to slots.
function comparableUrl(value) {
  let text = String(value ?? "").trim();
  if (!text) return "";
  if (/^[^/:?#]+:\d+(?:[/?#]|$)/.test(text)) text = `http://${text}`;
  else if (!/^[a-z][a-z\d+.-]*:/i.test(text)) text = `https://${text}`;
  try {
    const url = new URL(text);
    if (!/^https?:$/.test(url.protocol)) return "";
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.href.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

const slotUrls = (slot) => (Array.isArray(slot?.urls) ? slot.urls : String(slot?.urls ?? "").split("\n"))
  .map(comparableUrl).filter(Boolean);
const windowUrls = (window) => (window.tabs ?? [])
  .map((tab) => comparableUrl(tab.url || tab.pendingUrl)).filter(Boolean);

// Which saved layout a window belongs to: the slot map written at launch, or,
// after a browser restart (session storage is gone), the first layout one of
// whose windows has a URL the window has open. Null for any other window.
function layoutIndexOf(window, config, slotMap) {
  const presets = config.presets ?? [];
  const recorded = slotMap[window.id]?.presetIndex;
  if (Number.isInteger(recorded) && presets[recorded]) return recorded;
  const urls = windowUrls(window);
  if (!urls.length) return null;
  const index = presets.findIndex((preset) => (preset?.slots ?? []).some((slot) =>
    slotUrls(slot).some((prefix) => urls.some((url) => url === prefix || url.startsWith(prefix)))));
  return index >= 0 ? index : null;
}

// The layout's launch display (by id, then by identical bounds); a saved
// display that is gone means the primary one, as at launch. Null = automatic.
function layoutDisplay(preset, displays) {
  const saved = preset?.launchDisplay;
  if (!saved) return null;
  return displays.find((display) => display.id === saved.id)
    ?? displays.find((display) => saved.bounds
      && ["left", "top", "width", "height"].every((key) => display.bounds[key] === saved.bounds[key]))
    ?? displays.find(({ isPrimary }) => isPrimary) ?? displays[0] ?? null;
}

// The other open windows of the same layout, on screen and not minimised.
async function layoutSiblings(window, index, config, slotMap) {
  const all = await chrome.windows.getAll({ populate: true });
  return inReadingOrder(all.filter((other) => other.id !== window.id
    && other.type === "normal" && other.state !== "minimized" && !showsDeck(other)
    && layoutIndexOf(other, config, slotMap) === index));
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Chrome will not make a window narrower than its own minimum (about 500 px),
// so a strip of many windows can come out wider than planned. Measure what the
// OS actually gave them and spread them so the row still ends at the edge.
async function settleStrip(others, frames, workArea) {
  const actual = await Promise.all(others.map((other) => chrome.windows.get(other.id).catch(() => null)));
  const width = Math.max(...actual.map((entry) => entry?.width ?? 0));
  const planned = frames[0]?.width ?? 0;
  if (!(width > planned + SNAP) || others.length < 2) return frames;
  const step = (workArea.width - width) / (others.length - 1);
  const settled = frames.map((frame, i) => ({ ...frame, left: Math.round(workArea.left + i * step), width }));
  await Promise.all(others.map((other, i) => chrome.windows.update(other.id, settled[i])));
  return settled;
}

// index: the window's layout, or null for a window outside every layout
// (then only the window itself moves, on the display it is on).
async function enterFocusView(window, saved, stack, config, index, focus, slotMap) {
  const displays = await chrome.system.display.getInfo();
  const display = (index == null ? null : layoutDisplay(config.presets[index], displays)) ?? await displayFor(window);
  const { workArea } = display;
  const others = focus.others === "leave" || index == null ? [] : await layoutSiblings(window, index, config, slotMap);
  const previous = snapshotGeometry(window);
  // "Grow in place" and "the half it is on" start from the window as a window,
  // not from the whole screen a maximised window happens to cover.
  let current = window;
  if (focus.size !== "fill" && window.state !== "normal") {
    await chrome.windows.update(window.id, { state: "normal" });
    current = await chrome.windows.get(window.id);
  }
  const onDisplay = contains(display, centreOf(current)) ? current : null;
  const { target, strip } = focusLayout(workArea, focus, others.length, config.gap ?? 8, 0, onDisplay);

  await pushUndo([window, ...others]);

  // The others first, so the enlarged window ends up in front of them.
  if (others.length) {
    const memory = await session("focusOthers", {});
    memory[window.id] = others.map(snapshotGeometry).map((entry, i) => ({ id: others[i].id, ...entry }));
    await chrome.storage.session.set({ focusOthers: memory });
    if (focus.others === "hide") {
      await Promise.all(others.map((other) => chrome.windows.update(other.id, { state: "minimized" })));
    } else {
      await Promise.all(others.map((other, i) => place(other.id, other.state, strip[i])));
    }
  }

  if (!target) {
    // Fill without a strip is today's OS maximize, on the layout's display.
    if (!contains(display, centreOf(window))) {
      await place(window.id, window.state, {
        left: workArea.left + Math.round(workArea.width * 0.1), top: workArea.top + Math.round(workArea.height * 0.1),
        width: Math.round(workArea.width * 0.8), height: Math.round(workArea.height * 0.8),
      });
    }
    await stepInto(window, saved, stack, previous, null, "maximized");
    await chrome.windows.update(window.id, { state: "maximized", focused: true });
    return { ok: true, restored: false, focus };
  }

  if (window.state !== "normal") await chrome.windows.update(window.id, { state: "normal" });
  await stepInto(window, saved, stack, previous, target, null);
  await chrome.windows.update(window.id, { ...target, focused: true });
  // The OS can nudge a window straight after a resize; one repeat makes it stick.
  await pause(250);
  await chrome.windows.update(window.id, target);
  if (focus.others === "strip" && others.length) {
    await Promise.all(others.map((other, i) => chrome.windows.update(other.id, strip[i])));
    await settleStrip(others, strip, workArea);
    await chrome.windows.update(window.id, { focused: true });
  }
  await noteLanded(window.id, saved, stack);
  return { ok: true, restored: false, focus };
}

// Put back the windows a focus view moved or minimised, then return focus to
// the window that was enlarged.
async function restoreOthers(windowId) {
  const memory = await session("focusOthers", {});
  const entries = memory[windowId];
  if (!entries?.length) return;
  delete memory[windowId];
  await chrome.storage.session.set({ focusOthers: memory });
  const alive = new Set((await chrome.windows.getAll()).map((window) => window.id));
  await Promise.all(entries.filter((entry) => alive.has(entry.id)).map(async (entry) => {
    if (entry.state === "maximized" || entry.state === "fullscreen") {
      await chrome.windows.update(entry.id, { state: entry.state });
      return;
    }
    const current = await chrome.windows.get(entry.id).catch(() => null);
    await place(entry.id, current?.state, entry.bounds);
  }));
  await chrome.windows.update(windowId, { focused: true }).catch(() => {});
}

async function toggleSpotlight() {
  let window = await workingWindow();
  if (!window) return { ok: false, reason: "empty" };
  const config = await settings();
  const { saved, stack } = await geometry(window.id);
  const top = stack[stack.length - 1];

  // One key, two stops: the tile you started from and the size you chose.
  // Full screen used to be a third stop on the way round, which meant that
  // anyone who mostly wanted "a bit bigger" had to pass through losing the
  // rest of the screen to get back — a stop you did not ask for costs a press
  // every single lap. It has its own key now, and this one always lands on one
  // of two sizes.
  const enlarged = window.state === "fullscreen"
    || (window.state === "maximized" && top?.appliedState === "maximized")
    || isAt(window, top?.applied)
    || isAt(window, top?.landed);
  if (stack.length && enlarged) {
    await goHome(window, saved, stack);
    return { ok: true, restored: true, home: true };
  }

  // A window opened by a layout with its own Focus view follows that layout;
  // a window outside every layout follows step ③'s "outside" choice, if made.
  const slotMap = await session("deckSlotMap", {});
  const index = layoutIndexOf(window, config, slotMap);
  const focus = index == null ? normaliseFocus(config.focusOutside) : normaliseFocus(config.presets?.[index]?.focus);
  if (focus) return enterFocusView(window, saved, stack, config, index, index == null ? { ...focus, others: "leave" } : focus, slotMap);

  await pushUndo([window]);
  const previous = snapshotGeometry(window);

  if (config.spotlightSize === "full") {
    await stepInto(window, saved, stack, previous, null, "maximized");
    await chrome.windows.update(window.id, { state: "maximized", focused: true });
    return { ok: true, restored: false };
  }

  // Measure the window as a window: "keep the current width" cannot mean the
  // width of the whole screen it happens to be covering.
  if (window.state !== "normal") {
    await chrome.windows.update(window.id, { state: "normal" });
    window = await chrome.windows.get(window.id);
  }
  const spotlight = spotlightBounds((await displayFor(window)).workArea, window, config);
  console.log('[AI Window Deck] Applying spotlight bounds:', spotlight, 'with config:', {
    size: config.spotlightSize,
    width: config.spotlightWidth,
    height: config.spotlightHeight,
    anchor: config.spotlightAnchor,
  });
  await stepInto(window, saved, stack, previous, spotlight, null);
  await chrome.windows.update(window.id, { ...spotlight, focused: true });
  // The OS can nudge a window straight after a resize; one repeat makes it stick.
  await new Promise((resolve) => setTimeout(resolve, 250));
  await chrome.windows.update(window.id, spotlight);
  await noteLanded(window.id, saved, stack);
  return { ok: true, restored: false };
}

// The bottom of the stack is where this window was before any of this began.
async function goHome(window, saved, stack) {
  const first = stack[0];
  delete saved[window.id];
  await chrome.storage.session.set({ previousBounds: saved });
  if (first.state === "maximized" || first.state === "fullscreen") {
    await chrome.windows.update(window.id, { state: first.state, focused: true });
  } else {
    await place(window.id, window.state, { ...first.bounds, focused: true });
  }
  // A focus view may also have moved or hidden the layout's other windows.
  await restoreOthers(window.id);
}

// The window's own tile in its layout: the slot it was launched into (slot
// map), or the first slot whose URLs it has open. Same frames as launchDeck:
// the panel launches every slot of a 12 × 12 board, on the layout's display
// (automatic = the display the window is on now). Null outside every layout.
async function slotFrame(window, config, slotMap) {
  const urls = windowUrls(window);
  const active = config.activePreset ?? 0;
  const activeMatches = (config.presets?.[active]?.slots ?? []).some((slot) =>
    slotUrls(slot).some((prefix) => urls.some((url) => url === prefix || url.startsWith(prefix))));
  // Shared windows follow the active layout, even if they were launched by
  // another layout or the browser restart discarded their launch record.
  const index = activeMatches ? active : layoutIndexOf(window, config, slotMap);
  if (index == null) return null;
  const preset = config.presets[index];
  const slots = preset?.slots ?? [];
  const recorded = slotMap[window.id];
  let position = -1;
  if (recorded?.presetIndex === index) {
    position = recorded.slotId != null ? slots.findIndex((slot) => slot?.id === recorded.slotId) : -1;
    if (position < 0 && Number.isInteger(recorded.slotIndex) && recorded.slotIndex < slots.length) position = recorded.slotIndex;
  }
  if (position < 0) {
    const urls = windowUrls(window);
    position = slots.findIndex((slot) => slotUrls(slot).some((prefix) => urls.some((url) => url === prefix || url.startsWith(prefix))));
  }
  if (position < 0) return null;
  const cells = slots.map((slot, i) => ({
    x: slot?.gridX ?? (i % 2) * 6, y: slot?.gridY ?? Math.floor(i / 2) * 6,
    w: slot?.gridW ?? 6, h: slot?.gridH ?? 6,
  }));
  const displays = await chrome.system.display.getInfo();
  const display = layoutDisplay(preset, displays) ?? await displayFor(window);
  return cellFrames(cells, display.workArea, 12, config.gap ?? 8)[position] ?? null;
}

// ⌥Z: the focused window goes back to its tile in its layout, whatever was
// done to it since (enlarged, moved or resized by hand); a focus view's other
// windows come back too. A window outside every layout only undoes an
// enlarge, if there is one, and otherwise nothing happens (no error).
async function restoreHome() {
  const window = await workingWindow();
  if (!window) return { ok: false, reason: "empty" };
  const config = await settings();
  const { saved, stack } = await geometry(window.id);
  const frame = await slotFrame(window, config, await session("deckSlotMap", {}));
  if (frame) {
    await pushUndo([window]);
    if (stack.length) {
      delete saved[window.id];
      await chrome.storage.session.set({ previousBounds: saved });
    }
    await place(window.id, window.state, { ...frame, focused: true });
    // The OS can nudge a window straight after a resize; one repeat makes it stick.
    await pause(250);
    await chrome.windows.update(window.id, frame);
    await restoreOthers(window.id);
    return { ok: true, slot: true };
  }
  if (!stack.length) return { ok: false, reason: "empty" };
  await goHome(window, saved, stack);
  return { ok: true };
}

// Jump straight to the nth window in the order they sit on screen, so a deck
// of eight is reachable without stepping through it.
async function focusTile(index) {
  const config = await settings();
  const displays = config.sameDisplayOnly ? await targetDisplays(config) : null;
  const windows = await normalWindows(config, displays);
  const target = windows[index - 1];
  if (!target) return { ok: false, reason: "empty" };
  await chrome.windows.update(target.id, { focused: true, state: target.state === "minimized" ? "normal" : undefined });
  return { ok: true };
}

async function toggleFullscreen() {
  const window = await workingWindow();
  if (!window) return { ok: false, reason: "empty" };
  const { saved, stack } = await geometry(window.id);

  if (window.state === "fullscreen" && stack.length) {
    await stepBack(window, saved, stack);
    return { ok: true, restored: true };
  }

  await pushUndo([window]);
  await stepInto(window, saved, stack, snapshotGeometry(window), null, "fullscreen");
  await chrome.windows.update(window.id, { state: "fullscreen" });
  return { ok: true, restored: false };
}

// ---- focus ------------------------------------------------------------

async function step(offset) {
  const config = await settings();
  const displays = config.sameDisplayOnly ? await targetDisplays(config) : null;
  const windows = await normalWindows(config, displays);
  if (!windows.length) return { ok: false, reason: "empty" };
  const current = await workingWindow();
  const index = windows.findIndex((window) => window.id === current?.id);
  const next = ((index < 0 ? 0 : index + offset) + windows.length) % windows.length;
  await chrome.windows.update(windows[next].id, { focused: true });
  return { ok: true };
}

const focusNext = () => step(1);
const focusPrevious = () => step(-1);

// ---- wiring -----------------------------------------------------------

const ACTIONS = {
  tile: tileWindows,
  spotlight: toggleSpotlight,
  next: focusNext,
  prev: focusPrevious,
  launch: launchDeck,
  undo: undoLayout,
  fullscreen: toggleFullscreen,
  home: restoreHome,
};

const COMMANDS = {
  "toggle-spotlight": toggleSpotlight,
  "tile-windows": () => tileWindows({ deckOnly: true }),
  "focus-next": focusNext,
  "focus-previous": focusPrevious,
  "undo-layout": undoLayout,
  "toggle-fullscreen": toggleFullscreen,
  "restore-home": restoreHome,
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) =>
    [`focus-tile-${i + 1}`, () => focusTile(i + 1)])),
};

// Bounds handed to windows.create do not stick — Chrome re-applies its
// remembered size once the window settles. Measured in tools: only a delayed
// second pass holds. Same trick the launcher uses.
async function createSized(options, bounds) {
  const window = await chrome.windows.create({ ...options, ...bounds });
  await new Promise((resolve) => setTimeout(resolve, 400));
  await chrome.windows.update(window.id, bounds).catch(() => {});
  return window;
}

// A tall, narrow window meant to be parked at the edge of the desktop. Chrome
// gives extensions no way to keep a window above other applications, so this
// stays where it is put and can be covered — that limitation is stated in the
// panel rather than pretended away.
async function openDock() {
  const url = chrome.runtime.getURL("dist/index.html?mode=dock");
  const existing = (await chrome.tabs.query({})).find(
    (tab) => tab.url?.startsWith(chrome.runtime.getURL("dist/index.html")) && tab.url.includes("mode=dock")
  );
  if (existing) {
    await chrome.windows.update(existing.windowId, { focused: true });
    return { ok: true, reused: true };
  }
  const saved = (await chrome.storage.sync.get({ dockWindow: null })).dockWindow;
  const { workArea } = (await targetDisplays(await settings()))[0];
  const width = 360;
  const height = Math.round(workArea.height * 0.85);
  const window = await createSized({ url, type: "normal", focused: true }, saved ?? {
    width, height,
    left: workArea.left + workArea.width - width - 24,
    top: workArea.top + Math.round((workArea.height - height) / 2),
  });
  await chrome.storage.session.set({ dockWindowId: window.id });
  return { ok: true, opened: window.id };
}

// Whatever size the user settles on is the size it opens at next time.
chrome.windows.onBoundsChanged?.addListener(async (window) => {
  if (window.state !== "normal") return;
  const bounds = {
    left: window.left, top: window.top, width: window.width, height: window.height,
  };
  if (window.id === await session("dockWindowId", null)) {
    await chrome.storage.sync.set({ dockWindow: bounds });
  }
});

// One row per open window for the control panel: what it is, which screen it
// is on, and what it looks like it is doing.
async function listWindows() {
  const [windows, groups, focused] = await Promise.all([
    chrome.windows.getAll({ populate: true }),
    chrome.tabGroups.query({}).catch(() => []),
    chrome.windows.getLastFocused(),
  ]);
  const displays = await chrome.system.display.getInfo();
  const ordered = [...displays].sort((a, b) => a.bounds.left - b.bounds.left || a.bounds.top - b.bounds.top);

  return inReadingOrder(windows.filter((window) =>
    window.type === "normal" && !showsDeck(window)
  )).map((window) => {
    const active = window.tabs.find((tab) => tab.active) ?? window.tabs[0];
    const group = groups.find((entry) => entry.windowId === window.id);
    const screen = ordered.findIndex((display) => contains(display, centreOf(window)));
    return {
      id: window.id,
      title: group?.title || active?.title || "",
      url: active?.url ?? "",
      favIconUrl: active?.favIconUrl ?? "",
      color: group?.color ?? null,
      tabs: window.tabs.length,
      urls: window.tabs.map((tab) => tab.url || tab.pendingUrl || ""),
      screen: screen < 0 ? null : screen + 1,
      minimized: window.state === "minimized",
      isFocused: window.id === focused.id,
      status: window.id === focused.id ? "here" : "idle",
    };
  });
}

// Reads the windows that are open right now back into the shape an
// arrangement is stored in, so a layout arrived at by hand can be kept.
async function captureWindows() {
  const config = await settings();
  const displays = await targetDisplays(config);
  const windows = await normalWindows(config, displays);
  if (!windows.length) return { ok: false, reason: "empty" };
  const groups = await chrome.tabGroups.query({}).catch(() => []);
  const own = chrome.runtime.getURL("");
  const slots = windows.map((window) => {
    const group = groups.find((entry) => entry.windowId === window.id);
    const urls = window.tabs
      .map((tab) => tab.url || tab.pendingUrl || "")
      .filter((url) => /^https?:\/\//i.test(url) && !url.startsWith(own));
    const active = window.tabs.find((tab) => tab.active);
    return {
      name: group?.title || (active?.title ?? "").slice(0, 40),
      urls: urls.join("\n"),
      color: group?.color ?? "auto",
    };
  });
  return { ok: true, slots };
}

// Everything the panel needs to describe a monitor in words: the arrangement
// (bounds), whether it is the built-in laptop screen, whether it is mirroring
// another, and which one currently holds the focused window.
async function describeDisplays() {
  const displays = await chrome.system.display.getInfo();
  const ordered = [...displays].sort((a, b) => a.bounds.left - b.bounds.left || a.bounds.top - b.bounds.top);
  const lastWin = await chrome.windows.getLastFocused().catch(() => null);
  const focused = lastWin ? await displayFor(lastWin).catch(() => null) : null;
  return ordered.map((display, index) => ({
    id: display.id,
    number: index + 1,
    name: display.name,
    bounds: display.bounds,
    workArea: display.workArea,
    isPrimary: display.isPrimary,
    isInternal: display.isInternal,
    isEnabled: display.isEnabled,
    isMirrored: Boolean(display.mirroringSourceId),
    isFocused: display.id === focused?.id,
  }));
}

// Flashes a big number on one screen, the way macOS does in Arrangement, so
// "Display 2" stops being a guess.
async function flashDisplay(displayId, number, label) {
  const displays = await chrome.system.display.getInfo();
  const display = displays.find((entry) => entry.id === displayId);
  if (!display) return;
  const { left, top, width, height } = display.workArea;
  const url = chrome.runtime.getURL(
    `identify.html?n=${encodeURIComponent(number ?? "")}&label=${encodeURIComponent(label ?? "")}`);
  const window = await chrome.windows.create({
    url, type: "popup", focused: true,
    left: left + Math.round(width * 0.2),
    top: top + Math.round(height * 0.2),
    width: Math.round(width * 0.6),
    height: Math.round(height * 0.6),
  });
  // The page closes itself; this is the belt to that pair of braces.
  setTimeout(() => chrome.windows.remove(window.id).catch(() => {}), 2600);
}

// Chrome cannot rebind a command from inside an extension, so the best the
// popup can do is put the user on the page that can — and make sure the tab
// it opens is actually the one they end up looking at.
async function openShortcutSettings() {
  const tab = await chrome.tabs.create({ url: "chrome://extensions/shortcuts", active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
}

// ---- toolbar icon -----------------------------------------------------

// The toolbar icon (and the _execute_action shortcut, which fires the same
// event when no popup is set) opens the Deck as a full tab. One Deck tab: if
// it is already open anywhere, bring that tab and its window forward instead
// of opening another. The floating controller (?mode=dock) is not the Deck tab.
const DECK_PAGE = "dist/index.html";

const isDeckTab = (tab) => {
  const url = tab?.url || tab?.pendingUrl || "";
  return url.startsWith(chrome.runtime.getURL(DECK_PAGE)) && !/[?&]mode=dock\b/.test(url);
};

async function openDeckTab(fromTab) {
  const existing = (await chrome.tabs.query({})).find(isDeckTab);
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    const host = await chrome.windows.get(existing.windowId).catch(() => null);
    await chrome.windows.update(existing.windowId,
      host?.state === "minimized" ? { focused: true, state: "normal" } : { focused: true });
    return { ok: true, reused: true, tabId: existing.id };
  }
  // Remember where the user was, so Focus view from the Deck reaches it.
  if (fromTab?.windowId != null) await noteWorkWindow(fromTab.windowId);
  const url = chrome.runtime.getURL(DECK_PAGE);
  let tab;
  try {
    // Next to the tab the user clicked from, in that window.
    tab = await chrome.tabs.create(fromTab?.windowId != null && fromTab.index != null
      ? { url, active: true, windowId: fromTab.windowId, index: fromTab.index + 1 }
      : { url, active: true });
  } catch {
    // That window cannot hold tabs (an app or popup window): let Chrome pick.
    tab = await chrome.tabs.create({ url, active: true });
  }
  await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  return { ok: true, opened: tab.id };
}

chrome.action?.onClicked?.addListener((tab) => { openDeckTab(tab); });

chrome.commands.onCommand.addListener((command) => {
  COMMANDS[command]?.();
});

// Every branch that returns true must call sendResponse, or the sender is left
// holding an open port that never settles.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "launch") {
    launchDeck(message).then((result) => sendResponse(result ?? { ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  const action = ACTIONS[message.type];
  if (action) {
    // `tile` receives a transient canvas layout and display selection from the
    // React panel. Other actions deliberately ignore this extra argument.
    action(message).then((result) => sendResponse(result ?? { ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "shortcuts") {
    openShortcutSettings().then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "dock") {
    openDock().then((result) => sendResponse(result), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "displays") {
    describeDisplays().then(
      (displays) => sendResponse({ ok: true, displays }),
      () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "identify") {
    flashDisplay(message.displayId, message.number, message.label).then(
      () => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "capture") {
    captureWindows().then((result) => sendResponse(result), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "windowList") {
    listWindows().then((windows) => sendResponse({ ok: true, windows }), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "closeWindows") {
    Promise.all((message.windowIds ?? []).map((id) => chrome.windows.remove(id).catch(() => {})))
      .then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === "focusWindow") {
    chrome.windows.update(message.windowId, { focused: true, state: "normal" })
      .then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  return false;
});
