const DEFAULTS = {
  columns: 4,
  rows: 2,
  spotlightSize: "full",
  spotlightWidth: 70,
  spotlightHeight: 90,
  spotlightAnchor: "keep",
  language: "auto",
  presets: [],
  activePreset: 0,
  slots: [],
  skipMinimized: true,
  keepOrder: true,
  targetDisplay: "focused",
  sameDisplayOnly: true,
  groupTabs: true,
  openEmpty: true,
};

// Chrome's tab-group palette, with the swatch colours it paints them in.
const GROUP_COLORS = [
  ["blue", "#1a73e8"], ["purple", "#a142f4"], ["green", "#188038"], ["orange", "#fa903e"],
  ["pink", "#d01884"], ["cyan", "#007b83"], ["red", "#d93025"], ["yellow", "#f9ab00"],
];

const {
  evenLayouts: EVEN_LAYOUTS,
  shapedLayouts: SHAPED_LAYOUTS,
  applyLayout,
  applyCustomGrid,
  applyBulkLayout,
  selectedLayoutId,
  layoutCells,
  boardOf,
} = globalThis.AIWindowDeckLayout;

// A small diagram of the cells, used both to choose a shape and to show which
// one is chosen. Drawn from the same data the windows are placed with.
function shapeDiagram(layout) {
  const board = document.createElement("span");
  board.className = "diagram";
  board.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;
  for (const cell of layout.cells) {
    const box = document.createElement("i");
    box.style.gridColumn = `${cell.x + 1} / span ${cell.w}`;
    box.style.gridRow = `${cell.y + 1} / span ${cell.h}`;
    board.append(box);
  }
  return board;
}

const COMMAND_LABELS = {
  "toggle-spotlight": "cmd_spotlight",
  "restore-home": "cmd_home",
  "tile-windows": "cmd_tile",
  "focus-next": "cmd_next",
  "focus-previous": "cmd_prev",
  "undo-layout": "cmd_undo",
  "toggle-fullscreen": "cmd_fullscreen",
  _execute_action: "cmd_popup",
};

const $ = (selector) => document.querySelector(selector);

// One door for every message to the worker, so "what happens when the answer
// never comes" is written once instead of eleven times.
//
// The orphan check is belt and braces, not a fix: measured, Chrome closes
// every extension page of ours the moment the extension reloads — deck.html in
// a tab and the dock's own window both go — so this page cannot outlive its
// own bridge the way a content script does. It costs one property read.
const orphaned = () => !globalThis.chrome?.runtime?.id;

async function ask(message) {
  if (orphaned()) return null;
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return null;
  }
}

const send = async (type) => (await ask({ type })) ?? { ok: false };
const save = (values) => {
  if (orphaned()) return Promise.resolve();
  try {
    return chrome.storage.sync.set(values);
  } catch {
    return Promise.resolve();
  }
};

let t = translator("en");
let state = { ...DEFAULTS };

function note(text) {
  $("#status").textContent = text;
  clearTimeout(say.timer);
  say.timer = setTimeout(() => { $("#status").textContent = ""; }, 5000);
}

function say(key) { note(t(key)); }

// A profile saved before named sets existed keeps its single arrangement: it
// becomes the first set rather than being thrown away.
function ensurePresets() {
  if (state.presets?.length) return;
  state.presets = [{
    name: `${t("preset_default")} 1`,
    columns: state.columns,
    rows: state.rows,
    slots: (state.slots ?? []).map((slot) =>
      (typeof slot === "string" ? { name: "", urls: slot } : { name: "", urls: "", ...slot })),
  }];
  state.activePreset = 0;
}

const current = () => state.presets[state.activePreset] ?? state.presets[0];

async function savePresets() {
  await save({ presets: state.presets, activePreset: state.activePreset });
  say("saved");
}

// A line that starts with a scheme is an address; anything else is the name of
// the window. That single rule is enough for a list a person types by hand,
// and it survives names that look like domains ("takaoumehara.com").
// One rule, statable in a sentence: a line with a scheme is an address, and
// every other line is a name. Guessing that a bare "example.com" meant an
// address made it impossible to name a window after a domain.
const isUrl = (line) => /^https?:\/\//i.test(line);

function parsePastedList(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .map((lines) => {
      const urls = lines.filter(isUrl);
      const name = lines.filter((line) => !isUrl(line)).join(" ").trim();
      return { name, urls: urls.join("\n") };
    })
    .filter(Boolean);
}

// A dropdown, not tabs: the page already has tabs for "which screen am I on",
// and a second row of them for "which data am I editing" made both ambiguous.
function paintPresetTabs() {
  const select = $("#presetSelect");
  if (!select) return;
  select.textContent = "";
  state.presets.forEach((preset, index) => {
    const filled = (preset.slots ?? []).filter((slot) => (slot?.urls ?? "").trim()).length;
    const name = preset.name || t("preset_untitled");
    select.append(new Option(`${name} · ${filled} ${t("windows_count")}`, String(index),
      false, index === state.activePreset));
  });
}

function paintPreview() {
  const preset = current();
  const preview = $("#preview");
  if (!preview) return;
  const cells = layoutCells(preset);
  const board = boardOf(cells, preset.columns);
  preview.style.gridTemplateColumns = `repeat(${board.cols}, 1fr)`;
  preview.style.gridTemplateRows = `repeat(${board.rows}, 1fr)`;
  preview.textContent = "";
  cells.forEach((cell) => {
    const box = document.createElement("i");
    box.style.gridColumn = `${cell.x + 1} / span ${cell.w}`;
    box.style.gridRow = `${cell.y + 1} / span ${cell.h}`;
    preview.append(box);
  });
}

// "2 — 2 × 1" meant nothing at a glance. Say how many windows first, in words,
// and keep the grid shape as the parenthetical.
function splitLabel(cols, rows) {
  const count = cols * rows;
  const shape = `${cols} × ${rows}`;
  return document.documentElement.lang.startsWith("ja")
    ? `${count}${t("split_into")}（${shape}）`
    : `Split into ${count} ${t("split_into")} (${shape})`;
}

function currentLayoutId() {
  return selectedLayoutId(current());
}

// Layouts are chosen from diagrams drawn out of the same cell data the windows
// are placed with, so the picture cannot disagree with the result.
function paintLayoutOptions() {
  const host = $("#shapes");
  if (!host) return;
  const chosen = currentLayoutId();
  host.textContent = "";
  for (const [key, layouts] of [["shape_even", EVEN_LAYOUTS], ["shape_special", SHAPED_LAYOUTS]]) {
    const title = document.createElement("h3");
    title.className = "shape-group";
    title.textContent = t(key);
    host.append(title);
    const row = document.createElement("div");
    row.className = "shape-row";
    for (const layout of layouts) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shape";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(layout.id === chosen));
      const label = layout.key ? t(layout.key) : splitLabel(layout.cols, layout.rows);
      button.setAttribute("aria-label", label);
      const caption = document.createElement("small");
      caption.textContent = layout.key ? label : String(layout.cells.length);
      button.append(shapeDiagram(layout), caption);
      button.addEventListener("click", async () => {
        applyLayout(current(), layout.id);
        customDetails?.removeAttribute("open");
        customDetails?.classList.remove("selected");
        paintLayoutOptions();
        paintPreview();
        paintSlots();
        await savePresets();
      });
      row.append(button);
    }
    host.append(row);
  }
}

// The layout with one cell lit: this card is that square. Without it a card is
// only "the third box", and on an uneven shape which box is third is a guess.
function positionDiagram(cells, index, columns) {
  const cols = Math.max(columns, ...cells.map((cell) => cell.x + cell.w));
  const rows = Math.max(...cells.map((cell) => cell.y + cell.h));
  const board = document.createElement("span");
  board.className = "diagram mini";
  board.setAttribute("aria-hidden", "true");
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  cells.forEach((cell, at) => {
    const box = document.createElement("i");
    box.style.gridColumn = `${cell.x + 1} / span ${cell.w}`;
    box.style.gridRow = `${cell.y + 1} / span ${cell.h}`;
    if (at === index) box.className = "here";
    board.append(box);
  });
  return board;
}

// The squares are fixed containers, so dropping one card on another exchanges
// the two. Inserting instead would push every later card along: one dragged
// card would silently change where seven windows open.
async function swapSlots(from, to, focus) {
  const preset = current();
  if (from === to || !preset.slots?.[from] || !preset.slots?.[to]) return;
  [preset.slots[from], preset.slots[to]] = [preset.slots[to], preset.slots[from]];
  paintSlots();
  await savePresets();
  note(`${t("swapped")} ${from + 1} ↔ ${to + 1}`);
  if (!focus) return;
  // The cards were rebuilt, so the key that did the move has to be handed back
  // its focus at the square the card moved to, not left on the document.
  const card = $("#slots").children[to];
  const moved = card?.querySelector(`.move-${focus}`);
  (moved && !moved.disabled ? moved : card?.querySelector(".move:not([disabled])"))?.focus();
}

// One card per grid position, each with a name and its own list of URLs. Text
// already typed is preserved when the grid grows or shrinks, so switching
// layouts to compare does not lose work.
function paintSlots() {
  const preset = current();
  const container = $("#slots");
  container.textContent = "";
  const cells = layoutCells(preset);
  const count = cells.length;
  preset.slots = Array.from({ length: count }, (_, i) => ({
    name: "", urls: "", color: "auto", ...(preset.slots[i] ?? {}),
  }));

  const commit = () => { savePresets(); };
  for (let i = 0; i < count; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = String(i);

    // Only this strip is draggable. Making the whole card draggable would take
    // the mouse away from selecting text inside its own textarea.
    const head = document.createElement("div");
    head.className = "slot-head";
    head.draggable = true;
    head.title = t("reorder_drag");

    const grip = document.createElement("span");
    grip.className = "grip";
    grip.setAttribute("aria-hidden", "true");
    grip.textContent = "⠿";

    const number = document.createElement("b");
    number.className = "slot-num";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(i + 1);

    // Drag is not reachable from a keyboard or a screen reader, so the same
    // move exists as two ordinary buttons.
    const moves = document.createElement("span");
    moves.className = "slot-moves";
    for (const [dir, glyph, key, target] of [
      ["prev", "◂", "move_prev", i - 1],
      ["next", "▸", "move_next", i + 1],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `move move-${dir}`;
      button.textContent = glyph;
      button.disabled = target < 0 || target >= count;
      button.title = t(key);
      button.setAttribute("aria-label",
        button.disabled ? t(key) : `${t(key)} ${i + 1} ↔ ${target + 1}`);
      button.addEventListener("click", () => swapSlots(i, target, dir));
      moves.append(button);
    }

    head.append(grip, positionDiagram(cells, i, preset.columns), number, moves);
    head.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", String(i));
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setDragImage(slot, 28, 28);
      slot.classList.add("dragging");
    });
    head.addEventListener("dragend", () => {
      for (const card of container.children) card.classList.remove("dragging", "over");
    });
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (!slot.classList.contains("dragging")) slot.classList.add("over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("over");
      const from = Number(event.dataTransfer.getData("text/plain"));
      if (Number.isInteger(from)) swapSlots(from, i);
    });

    const name = document.createElement("input");
    name.type = "text";
    name.className = "slot-name";
    name.value = preset.slots[i].name ?? "";
    name.placeholder = `${t("window_label")} ${i + 1}`;
    name.setAttribute("aria-label", `${t("window_name")} ${i + 1}`);
    name.addEventListener("change", () => { preset.slots[i].name = name.value.trim(); commit(); });

    const area = document.createElement("textarea");
    area.rows = 4;
    area.spellcheck = false;
    area.value = preset.slots[i].urls ?? "";
    area.placeholder = "https://claude.ai";
    area.setAttribute("aria-label", `${t("urls_label")} ${i + 1}`);
    area.addEventListener("change", () => { preset.slots[i].urls = area.value; commit(); });

    const swatches = document.createElement("div");
    swatches.className = "swatches";
    swatches.setAttribute("role", "radiogroup");
    swatches.setAttribute("aria-label", `${t("color_label")} ${i + 1}`);
    for (const [value, hex] of [["auto", null], ...GROUP_COLORS]) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = value === "auto" ? "swatch auto" : "swatch";
      dot.setAttribute("role", "radio");
      dot.setAttribute("aria-checked", String((preset.slots[i].color ?? "auto") === value));
      dot.setAttribute("aria-label", value === "auto" ? t("color_auto") : value);
      dot.title = value === "auto" ? t("color_auto") : value;
      if (hex) dot.style.setProperty("--dot", hex);
      dot.addEventListener("click", () => {
        preset.slots[i].color = value;
        for (const other of swatches.children) other.setAttribute("aria-checked", String(other === dot));
        commit();
      });
      swatches.append(dot);
    }

    slot.append(head, name, area, swatches);
    container.append(slot);
  }
}

function renderKeycaps(container, shortcut) {
  if (!container) return;
  container.textContent = "";
  if (!shortcut) {
    const unset = document.createElement("span");
    unset.className = "unset";
    unset.textContent = t("unset");
    container.append(unset);
    return;
  }
  const keys = shortcutKeys(shortcut);
  keys.forEach((key, index) => {
    if (index > 0) {
      const plus = document.createElement("span");
      plus.className = "key-plus";
      plus.textContent = " + ";
      container.append(plus);
    }
    const kbd = document.createElement("kbd");
    kbd.className = "key-cap";
    let icon = "";
    if (key === "Alt" || key === "Option") icon = "⌥ ";
    else if (key === "Command" || key === "Cmd") icon = "⌘ ";
    else if (key === "Shift") icon = "⇧ ";
    else if (key === "Control" || key === "Ctrl") icon = "⌃ ";
    kbd.textContent = `${icon}${key}`;
    container.append(kbd);
  });
}

async function paintShortcuts() {
  if (orphaned()) return;
  const commands = await chrome.commands.getAll();
  paintInlineShortcuts(commands);
  const list = $("#shortcutList");
  if (!list) return;
  list.textContent = "";
  const labels = { ...COMMAND_LABELS };
  for (let i = 1; i <= 8; i++) labels[`focus-tile-${i}`] = null;
  for (const [name, key] of Object.entries(labels)) {
    const command = commands.find((entry) => entry.name === name);
    if (!command) continue;
    const term = document.createElement("dt");
    term.textContent = key ? t(key) : `${t("cmd_tile_n")} ${name.replace("focus-tile-", "")}`;
    const value = document.createElement("dd");
    renderKeycaps(value, command.shortcut);
    list.append(term, value);
  }
}

// Monitors are drawn where they actually sit, at the same relative scale, so
// the picker is the arrangement rather than a list of indistinguishable names.
// Each one can be flashed, the way macOS does in Arrangement.
async function paintDisplayOptions() {
  const container = $("#screensGrid");
  const response = await ask({ type: "displays" });
  const displays = response?.displays ?? [];
  if (container) container.textContent = "";
  if (!displays.length) return;

  const activeDisplay = displays.find((d) => String(d.id) === state.targetDisplay)
    || displays.find((d) => d.isFocused)
    || displays[0];

  if (activeDisplay?.bounds) {
    const { width, height } = activeDisplay.bounds;
    const canvas = $("#launchCanvas");
    if (canvas && width && height) {
      canvas.style.aspectRatio = `${width} / ${height}`;
    }
  }

  displays.forEach((display, idx) => {
    const card = document.createElement("div");
    const isThisScreen = display.isFocused || idx === 0;
    const isSelected = (state.targetDisplay === String(display.id)) || (state.targetDisplay === "focused" && isThisScreen);
    card.className = isSelected ? "screen-card active" : "screen-card";
    
    const icon = document.createElement("div");
    icon.className = "screen-monitor-icon";

    const title = document.createElement("span");
    title.className = "screen-title";
    title.textContent = `screen ${idx + 1}${isThisScreen ? ` (${t("screen_this")})` : ""}`;

    const deviceName = document.createElement("span");
    deviceName.className = "screen-device-name";
    deviceName.textContent = display.name ? display.name : "";

    card.append(icon, title, deviceName);

    card.addEventListener("click", async () => {
      state.targetDisplay = String(display.id);
      await save({ targetDisplay: state.targetDisplay });
      await paintDisplayOptions();
      note(`screen ${idx + 1} を選択しました`);
    });

    container?.append(card);
  });
}

function paintLanguageOptions() {
  const language = $("#language");
  language.textContent = "";
  language.append(new Option(t("lang_auto"), "auto", false, state.language === "auto"));
  for (const locale of availableLocales()) {
    language.append(new Option(LOCALE_NAMES[locale] ?? locale, locale, false, state.language === locale));
  }
}

const SIZE_SHAPES = {
  full:   { w: 100, h: 100, x: 0,  y: 0 },
  height: { w: 46,  h: 100, x: 27, y: 0 },
  tall:   { w: 50,  h: 100, x: 0,  y: 0 },
  half:   { w: 50,  h: 50,  x: 0,  y: 0 },
  custom: { w: 70,  h: 90,  x: 15, y: 5 },
};
const SIZE_KEYS = ["full", "height", "tall", "half", "custom"];

// The shape is easier to read than the sentence. The frame slides to the new
// shape so the difference between "full height" and "half" is felt, not parsed.
function paintSizes() {
  const host = $("#sizes");
  if (!host) return;
  host.textContent = "";
  for (const key of SIZE_KEYS) {
    const shape = SIZE_SHAPES[key];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "size";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(state.spotlightSize === key));
    const screen = document.createElement("span");
    screen.className = "size-screen";
    const win = document.createElement("i");
    win.style.width = `${shape.w}%`;
    win.style.height = `${shape.h}%`;
    win.style.left = `${shape.x}%`;
    win.style.top = `${shape.y}%`;
    screen.append(win);
    const label = document.createElement("small");
    label.textContent = t(`size_${key}`);
    button.append(screen, label);
    button.addEventListener("click", async () => {
      state = { ...state, spotlightSize: key };
      await save({ spotlightSize: key });
      paintSizes();
      paintResize();
      say("saved");
    });
    host.append(button);
  }
}

function paintResize() {
  const anchorInput = document.querySelector(`input[name=anchor][value="${state.spotlightAnchor}"]`);
  if (anchorInput) {
    anchorInput.setAttribute("checked", "checked");
    anchorInput.checked = true;
  }
  const spW = $("#spotlightWidth"); if (spW) spW.value = state.spotlightWidth;
  const wVal = $("#widthValue"); if (wVal) wVal.value = `${state.spotlightWidth}%`;
  const spH = $("#spotlightHeight"); if (spH) spH.value = state.spotlightHeight;
  const hVal = $("#heightValue"); if (hVal) hVal.value = `${state.spotlightHeight}%`;
  const cSize = $("#customSize"); if (cSize) cSize.hidden = state.spotlightSize !== "custom";
  const aCard = $("#anchorCard"); if (aCard) aCard.hidden = state.spotlightSize === "full";
}

// The same page is the toolbar popup and the full-page options screen. In a
// popup chrome.tabs.getCurrent resolves to undefined, which is the only
// reliable way to tell the two apart.
async function markSurface() {
  const tab = await chrome.tabs.getCurrent().catch(() => undefined);
  document.body.classList.add(tab ? "as-page" : "as-popup");
}

const INLINE_KEYS = {
  spotlight: "toggle-spotlight",
  home: "restore-home",
  prev: "focus-previous",
  next: "focus-next",
  tile: "tile-windows",
  undo: "undo-layout",
  fullscreen: "toggle-fullscreen",
};

function paintInlineShortcuts(commands) {
  for (const [id, name] of Object.entries(INLINE_KEYS)) {
    const node = $(`#${id}Keys`);
    if (!node) continue;
    const command = commands.find((entry) => entry.name === name);
    if (!command?.shortcut) {
      node.textContent = (id === "undo" || id === "fullscreen") ? "" : t("unset");
    } else {
      renderKeycaps(node, command.shortcut);
    }
  }
}

async function render() {
  const locale = resolveLocale(state.language);
  t = translator(locale);
  document.documentElement.lang = locale;
  applyTranslations(document, t);
  ensurePresets();
  document.querySelectorAll(".card.step > h2 > .num").forEach((node, index) => {
    node.textContent = `${t("step_word")} ${index + 1}`;
  });

  const preset = current();
  const cols = $("#cols"); if (cols) cols.value = preset.columns;
  const colsVal = $("#colsValue"); if (colsVal) colsVal.value = preset.columns;
  const rows = $("#rows"); if (rows) rows.value = preset.rows;
  const rowsVal = $("#rowsValue"); if (rowsVal) rowsVal.value = preset.rows;
  const customDetails = $("#customGrid")?.closest("details");
  if (customDetails) {
    customDetails.open = currentLayoutId() === "custom";
    customDetails.classList.toggle("selected", currentLayoutId() === "custom");
  }
  const sMin = $("#skipMinimized"); if (sMin) sMin.checked = state.skipMinimized;
  const kOrd = $("#keepOrder"); if (kOrd) kOrd.checked = state.keepOrder;
  const sDisp = $("#sameDisplayOnly"); if (sDisp) sDisp.checked = state.sameDisplayOnly;
  const gTabs = $("#groupTabs"); if (gTabs) gTabs.checked = state.groupTabs;
  const oEmp = $("#openEmpty"); if (oEmp) oEmp.checked = state.openEmpty;

  const bulk = $("#bulkText");
  if (bulk) { bulk.placeholder = t("bulk_placeholder"); paintBulkPreview(); }
  paintPresetTabs();
  const noSaved = $("#noSaved");
  if (noSaved) {
    noSaved.hidden = state.presets.some((preset) =>
      (preset.slots ?? []).some((slot) => (slot?.urls ?? "").trim()));
  }
  paintLayoutOptions();
  paintPreview();
  paintSlots();
  paintLanguageOptions();
  paintSizes();
  paintResize();
  await paintDisplayOptions();
  await paintShortcuts();
  await paintFullscreen();
  syncTrayFromPreset();
  renderLibraryTray();
  renderLaunchCanvas();
}

let listTimer;
function watchWindowList(on) {
  clearInterval(listTimer);
  if (on) listTimer = setInterval(paintWindowList, 2000);
}

function selectTab(id) {
  for (const tab of document.querySelectorAll('.tabs [role="tab"]')) {
    const on = tab.id === id;
    tab.setAttribute("aria-selected", String(on));
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
  }
  // Switching tabs should show the top of the new tab, not wherever the last
  // one happened to be scrolled to.
  document.querySelector(".scroll")?.scrollTo(0, 0);
  const live = id === "tab-windows";
  if (live) paintWindowList();
  watchWindowList(live);
}
document.querySelectorAll('.tabs [role="tab"]').forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab.id));
});

const customDetails = $("#customGrid")?.closest("details");
customDetails?.addEventListener("toggle", async () => {
  if (!customDetails.open || currentLayoutId() === "custom") return;
  applyCustomGrid(current(), current().columns, current().rows);
  customDetails.classList.add("selected");
  paintLayoutOptions();
  paintPreview();
  paintSlots();
  await savePresets();
});

for (const id of ["cols", "rows"]) {
  const input = $(`#${id}`);
  input?.addEventListener("input", () => { const o = $(`#${id}Value`); if (o) o.value = input.value; });
  input?.addEventListener("change", async () => {
    applyCustomGrid(current(), $("#cols")?.value || 4, $("#rows")?.value || 2);
    customDetails?.classList.add("selected");
    paintLayoutOptions();
    paintPreview();
    paintSlots();
    await savePresets();
  });
}

$("#presetSelect")?.addEventListener("change", async (event) => {
  state.activePreset = Number(event.target.value);
  await save({ activePreset: state.activePreset });
  await render();
});

$("#presetNew")?.addEventListener("click", async () => {
  state.presets.push({
    name: `${t("preset_default")} ${state.presets.length + 1}`,
    layoutId: "2x2", columns: 2, rows: 2, cells: null, shape: null, slots: [],
  });
  state.activePreset = state.presets.length - 1;
  await savePresets();
  await render();
  startRename();
});

// Renaming happens in the page. A browser prompt() arrives with the browser's
// own chrome and always reads as something that escaped from elsewhere.
function startRename() {
  const field = $("#presetName");
  const select = $("#presetSelect");
  if (!field || !select) return;
  field.value = current().name ?? "";
  field.hidden = false;
  select.hidden = true;
  field.focus();
  field.select();
}

async function endRename(keep) {
  const field = $("#presetName");
  const select = $("#presetSelect");
  if (!field || field.hidden) return;
  if (keep) {
    const name = field.value.trim();
    if (name) { current().name = name; await savePresets(); }
  }
  field.hidden = true;
  select.hidden = false;
  paintPresetTabs();
}

$("#presetRename")?.addEventListener("click", startRename);
$("#presetName")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") endRename(true);
  if (event.key === "Escape") endRename(false);
});
$("#presetName")?.addEventListener("blur", () => endRename(true));

$("#presetCapture")?.addEventListener("click", async () => {
  const result = await ask({ type: "capture" });
  if (!result?.ok) { say("capture_none"); return; }
  const preset = { name: `${t("preset_default")} ${state.presets.length + 1}`, slots: result.slots };
  applyBulkLayout(preset, result.slots.length);
  state.presets.push(preset);
  state.activePreset = state.presets.length - 1;
  await savePresets();
  await render();
  say("captured");
});

$("#presetDelete")?.addEventListener("click", async () => {
  if (state.presets.length <= 1) { say("preset_last"); return; }
  state.presets.splice(state.activePreset, 1);
  state.activePreset = Math.max(0, state.activePreset - 1);
  await savePresets();
  await render();
});

for (const [id, key] of [["spotlightWidth", "spotlightWidth"], ["spotlightHeight", "spotlightHeight"]]) {
  const input = $(`#${id}`);
  const output = id === "spotlightWidth" ? $("#widthValue") : $("#heightValue");
  input?.addEventListener("input", () => { if (output) output.value = `${input.value}%`; });
  input?.addEventListener("change", async () => {
    state = { ...state, [key]: Number(input.value) };
    await save({ [key]: Number(input.value) });
    say("saved");
  });
}

document.querySelectorAll("input[name=size]").forEach((radio) => {
  radio.addEventListener("change", async () => {
    state = { ...state, spotlightSize: radio.value };
    await save({ spotlightSize: radio.value });
    paintResize();
    say("saved");
  });
});
document.querySelectorAll("input[name=anchor]").forEach((radio) => {
  radio.addEventListener("change", async () => {
    state = { ...state, spotlightAnchor: radio.value };
    await save({ spotlightAnchor: radio.value });
    say("saved");
  });
});

for (const id of ["skipMinimized", "keepOrder", "sameDisplayOnly", "groupTabs", "openEmpty"]) {
  $(`#${id}`)?.addEventListener("change", async (event) => {
    state = { ...state, [id]: event.target.checked };
    await save({ [id]: event.target.checked });
    say("saved");
  });
}

$("#language")?.addEventListener("change", async (event) => {
  state = { ...state, language: event.target.value };
  await save({ language: event.target.value });
  await render();
});

const launch = async () => {
  say("launching");
  const result = await send("launch");
  say(result?.ok ? "launched" : "nothing_to_launch");
};
for (const id of ["launch", "launch2"]) $(`#${id}`)?.addEventListener("click", launch);
for (const id of ["retile", "retile2"]) $(`#${id}`)?.addEventListener("click", () => send("tile"));
$("#spotlight")?.addEventListener("click", () => send("spotlight"));
$("#prev")?.addEventListener("click", () => send("prev"));
$("#home")?.addEventListener("click", () => send("home"));
$("#fullscreenWindow")?.addEventListener("click", () => send("fullscreen"));
$("#next")?.addEventListener("click", () => send("next"));
$("#editShortcuts")?.addEventListener("click", () => send("shortcuts"));
$("#undo")?.addEventListener("click", async () => {
  const result = await send("undo");
  say(result?.ok ? "undone" : "undo_none");
});

const STATUS_KEYS = { busy: "status_busy", done: "status_done", idle: "status_idle", here: "status_here" };

// The control panel: every open window as a button that brings it forward,
// with the colour of its tab group and a read on what it is doing.
async function paintWindowList() {
  const list = $("#windowList");
  // Same guard as the standing window: a reloaded extension must not leave a
  // timer throwing behind it.
  if (orphaned()) { watchWindowList(false); return; }
  const response = await ask({ type: "windowList" });
  if (!response && orphaned()) { watchWindowList(false); return; }
  const windows = response?.windows ?? [];
  list.textContent = "";
  if (!windows.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("no_windows");
    list.append(empty);
    return;
  }
  for (const window of windows) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `win-row status-${window.status}`;
    row.addEventListener("click", async () => {
      await ask({ type: "focusWindow", windowId: window.id });
      await paintWindowList();
    });

    const dot = document.createElement("span");
    dot.className = "win-dot";
    if (window.color) dot.dataset.color = window.color;

    const body = document.createElement("span");
    body.className = "win-body";
    const title = document.createElement("b");
    title.textContent = window.title || window.url || "—";
    const meta = document.createElement("small");
    const bits = [
      `${window.tabs} ${t("tabs_count")}`,
      window.screen ? `${t("screen_word")} ${window.screen}` : null,
      window.minimized ? t("status_min") : null,
    ].filter(Boolean);
    meta.textContent = bits.join(" · ");
    body.append(title, meta);

    const badge = document.createElement("em");
    badge.className = "win-status";
    badge.textContent = t(STATUS_KEYS[window.status] ?? "status_idle");

    const close = document.createElement("span");
    close.className = "win-close";
    close.setAttribute("role", "button");
    close.setAttribute("tabindex", "0");
    close.title = t("close_window");
    close.setAttribute("aria-label", `${t("close_window")} ${window.title || ""}`.trim());
    close.textContent = "✕";
    const shut = async (event) => {
      event.stopPropagation();
      await ask({ type: "closeWindows", windowIds: [window.id] });
      paintWindowList();
    };
    close.addEventListener("click", shut);
    close.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") shut(event);
    });

    row.append(dot, body, badge, close);
    list.append(row);
  }
}

// Every "i" reveals the paragraph it points at. Kept as a disclosure rather
// than a tooltip so the text can be long, selectable and read by a screen
// reader in place.
document.querySelectorAll(".info").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
  });
});

function paintBulkPreview() {
  const preview = $("#bulkPreview");
  if (!preview) return;
  const parsed = parsePastedList($("#bulkText").value);
  preview.textContent = "";
  if (!parsed.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("bulk_preview_empty");
    preview.append(empty);
    return;
  }
  parsed.forEach((slot, index) => {
    const row = document.createElement("div");
    row.className = "pv-row";
    const name = document.createElement("b");
    name.textContent = slot.name || t("unnamed");
    if (!slot.name) name.classList.add("unset");
    const urls = document.createElement("small");
    const lines = slot.urls.split("\n").filter(Boolean);
    urls.textContent = lines.join("  ·  ");
    const n = document.createElement("i");
    n.textContent = String(index + 1);
    row.append(n, name, urls);
    preview.append(row);
  });
}

$("#bulkText")?.addEventListener("input", paintBulkPreview);
$("#bulkExample")?.addEventListener("click", () => {
  $("#bulkText").value = t("bulk_placeholder");
  paintBulkPreview();
  $("#bulkText").focus();
});

// --- Interactive Deck Canvas & Tray State ---
let trayItems = [];
let canvasSlots = [];
let selectedTrayIndices = new Set();
let canvasHistory = [];
let splitMode = "auto";
let oddMode = "blank";
let editingItem = null;
let editingSource = null;

function normalizeUrls(urlsStr) {
  return String(urlsStr || "").split("\n").map((line) => line.trim().toLowerCase()).filter(Boolean).sort().join("\n");
}

function isDuplicateWindow(name, urls, list, excludeId = null) {
  const normName = String(name || "").trim().toLowerCase();
  const normUrls = normalizeUrls(urls);
  return list.some((item) => {
    if (excludeId && item.id === excludeId) return false;
    const existingName = String(item.name || "").trim().toLowerCase();
    const existingUrls = normalizeUrls(item.urls);
    return existingName === normName && existingUrls === normUrls;
  });
}

function pushCanvasHistory() {
  canvasHistory.push(JSON.stringify(canvasSlots));
  if (canvasHistory.length > 20) canvasHistory.shift();
}

function popCanvasHistory() {
  if (!canvasHistory.length) return;
  canvasSlots = JSON.parse(canvasHistory.pop());
  renderLaunchCanvas();
}

function syncTrayFromPreset() {
  const preset = current();
  if (preset?.slots?.length) {
    trayItems = preset.slots
      .filter((s) => (s.urls || s.name || "").trim())
      .map((s, idx) => ({ id: `tray-${idx}-${Date.now()}`, name: s.name || `Window ${idx+1}`, urls: s.urls || "", color: s.color || "auto" }));
  } else {
    trayItems = [];
  }
}

function createUrlRow(value = "") {
  const row = document.createElement("div");
  row.className = "url-input-row";

  const input = document.createElement("input");
  input.type = "url";
  input.className = "modal-input reg-url";
  input.placeholder = "https://...";
  input.spellcheck = false;
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-remove-url-row";
  removeBtn.textContent = "✕";
  removeBtn.title = "URLを削除";
  removeBtn.addEventListener("click", () => {
    const allRows = document.querySelectorAll(".url-input-row");
    if (allRows.length > 1) {
      row.remove();
    } else {
      input.value = "";
    }
  });

  row.append(input, removeBtn);
  return row;
}

function openModalForEdit(item, source = "library") {
  editingItem = item;
  editingSource = source;
  const modal = $("#registerModal");
  const modalSingleBody = $("#modalSingleBody");
  const modalBulkBody = $("#modalBulkBody");
  const modalTitle = $("#modalTitle");
  const modalBackBtn = $("#modalBackBtn");

  if (!modal) return;
  modal.hidden = false;
  modalSingleBody.hidden = false;
  modalBulkBody.hidden = true;
  modalBackBtn.hidden = true;
  if (modalTitle) modalTitle.textContent = "ウィンドウの編集";

  const nameInput = $("#regWindowName");
  if (nameInput) nameInput.value = item.name || "";

  const list = $("#regUrlList");
  if (list) {
    list.textContent = "";
    const lines = String(item.urls || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) lines.push("");
    lines.forEach((urlLine) => {
      list.append(createUrlRow(urlLine));
    });
  }
}

function renderRegisteredWindowsList() {
  const container = $("#registeredWindowsList");
  if (!container) return;
  container.textContent = "";

  if (!trayItems.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("no_saved") || "登録されたウィンドウがありません。＋ボタンから追加してください。";
    container.append(empty);
    return;
  }

  trayItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "reg-win-row";

    const info = document.createElement("div");
    info.className = "reg-win-info";
    const name = document.createElement("b");
    name.textContent = item.name || t("unnamed");
    const urls = document.createElement("small");
    const count = (item.urls || "").split("\n").filter(Boolean).length;
    urls.textContent = `${count} ${t("tabs_count") || "tabs"}: ${item.urls ? item.urls.split("\n")[0] : ""}`;
    info.append(name, urls);

    const tools = document.createElement("div");
    tools.className = "reg-win-tools";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "tool-icon";
    editBtn.textContent = "✏️";
    editBtn.title = "編集";
    editBtn.addEventListener("click", () => openModalForEdit(item, "library"));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "tool-icon danger";
    delBtn.textContent = "🗑";
    delBtn.title = "削除";
    delBtn.addEventListener("click", async () => {
      trayItems.splice(index, 1);
      await saveRegisteredWindows();
      renderLibraryTray();
      renderRegisteredWindowsList();
      note(`${item.name || 'ウィンドウ'} を削除しました`);
    });

    tools.append(editBtn, delBtn);
    row.append(info, tools);
    container.append(row);
  });
}

function renderLibraryTray() {
  const trayContainer = $("#libraryTray");
  if (!trayContainer) return;
  trayContainer.textContent = "";

  if (!trayItems.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.style.gridColumn = "1 / -1";
    empty.textContent = t("no_saved");
    trayContainer.append(empty);
    return;
  }

  trayItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "window-library-card";
    if (selectedTrayIndices.has(index)) card.classList.add("selected");
    card.draggable = true;
    card.dataset.index = String(index);

    const titleBar = document.createElement("div");
    titleBar.className = "card-title-bar";

    const title = document.createElement("span");
    title.textContent = item.name || t("unnamed");

    const badge = document.createElement("small");
    const urlCount = (item.urls || "").split("\n").filter(Boolean).length;
    badge.textContent = `${urlCount} urls`;

    titleBar.append(title, badge);
    card.append(titleBar);

    const urlLines = (item.urls || "").split("\n").filter(Boolean);
    urlLines.slice(0, 3).forEach((line, i) => {
      const tab = document.createElement("div");
      tab.className = "tab-item";
      tab.textContent = `tab ${i + 1}: ${line.replace(/^https?:\/\//i, '')}`;
      card.append(tab);
    });

    card.addEventListener("dblclick", () => {
      openModalForEdit(item, "library");
    });

    card.addEventListener("click", (e) => {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        if (selectedTrayIndices.has(index)) {
          selectedTrayIndices.delete(index);
        } else {
          selectedTrayIndices.add(index);
        }
      } else {
        selectedTrayIndices.clear();
        selectedTrayIndices.add(index);
      }
      renderLibraryTray();
    });

    card.addEventListener("dragstart", (e) => {
      if (!selectedTrayIndices.has(index)) {
        selectedTrayIndices.clear();
        selectedTrayIndices.add(index);
        renderLibraryTray();
      }
      const itemsToDrag = Array.from(selectedTrayIndices).map((i) => trayItems[i]).filter(Boolean);
      e.dataTransfer.setData("application/json", JSON.stringify(itemsToDrag));
      e.dataTransfer.effectAllowed = "copy";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    trayContainer.append(card);
  });
}

function renderLaunchCanvas() {
  const canvasGrid = $("#canvasGrid");
  const hint = $("#canvasEmptyHint");
  const countInput = $("#slotCountInput");
  if (countInput) countInput.value = String(canvasSlots.length);
  if (!canvasGrid) return;

  canvasGrid.textContent = "";
  if (!canvasSlots.length) {
    if (hint) hint.hidden = false;
    return;
  }
  if (hint) hint.hidden = true;

  const count = canvasSlots.length;
  let layout = globalThis.AIWindowDeckLayout.computeDynamicLayout(count, oddMode);

  canvasGrid.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
  canvasGrid.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;

  canvasSlots.forEach((slot, i) => {
    const cell = layout.cells[i] || { x: i % layout.cols, y: Math.floor(i / layout.cols), w: 1, h: 1 };
    const card = document.createElement("div");
    card.className = "canvas-card";
    
    const cellW = slot.customW ? Math.min(layout.cols, slot.customW) : cell.w;
    const cellH = slot.customH ? Math.min(layout.rows, slot.customH) : cell.h;
    card.style.gridColumn = `${cell.x + 1} / span ${cellW}`;
    card.style.gridRow = `${cell.y + 1} / span ${cellH}`;

    // Mac Browser Dots Header (O O O  X)
    const macHeader = document.createElement("div");
    macHeader.className = "canvas-card-mac-header";

    const dots = document.createElement("div");
    dots.className = "mac-dots";
    for (let d = 0; d < 3; d++) {
      const dot = document.createElement("span");
      dot.className = "mac-dot";
      dots.append(dot);
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "card-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "このウィンドウを削除";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      pushCanvasHistory();
      canvasSlots.splice(i, 1);
      renderLaunchCanvas();
    });

    macHeader.append(dots, removeBtn);

    const body = document.createElement("div");
    body.className = "canvas-card-content";

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = `${slot.name || t("unnamed")}`;

    const urls = document.createElement("div");
    urls.className = "card-urls";
    urls.textContent = slot.urls || "";

    body.append(name, urls);

    // Grid Snap Hover Overlay Controls
    const overlay = document.createElement("div");
    overlay.className = "canvas-card-hover-controls";

    const label = document.createElement("span");
    label.className = "overlay-label";
    label.textContent = "Grid Snap:";

    const btn1x1 = document.createElement("button");
    btn1x1.type = "button";
    btn1x1.className = "snap-btn";
    btn1x1.textContent = "1×1";
    btn1x1.title = "標準 1x1";
    btn1x1.addEventListener("click", (e) => {
      e.stopPropagation();
      pushCanvasHistory();
      delete slot.customW;
      delete slot.customH;
      renderLaunchCanvas();
    });

    const btnHalf = document.createElement("button");
    btnHalf.type = "button";
    btnHalf.className = "snap-btn";
    btnHalf.textContent = "Half";
    btnHalf.title = "横幅半分";
    btnHalf.addEventListener("click", (e) => {
      e.stopPropagation();
      pushCanvasHistory();
      slot.customW = Math.max(1, Math.floor(layout.cols / 2));
      renderLaunchCanvas();
    });

    const btnFull = document.createElement("button");
    btnFull.type = "button";
    btnFull.className = "snap-btn";
    btnFull.textContent = "Full";
    btnFull.title = "全幅";
    btnFull.addEventListener("click", (e) => {
      e.stopPropagation();
      pushCanvasHistory();
      slot.customW = layout.cols;
      renderLaunchCanvas();
    });

    overlay.append(label, btn1x1, btnHalf, btnFull);

    card.append(macHeader, body, overlay);

    // Double click canvas card to edit
    card.addEventListener("dblclick", () => {
      openModalForEdit(slot, "canvas");
    });

    // Specific slot drop target highlighting & replacement
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.style.borderColor = "#2f5bff";
      card.style.boxShadow = "0 0 12px rgba(47, 91, 255, 0.4)";
    });
    card.addEventListener("dragleave", () => {
      card.style.borderColor = "";
      card.style.boxShadow = "";
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.style.borderColor = "";
      card.style.boxShadow = "";
      const json = e.dataTransfer.getData("application/json");
      if (json) {
        try {
          const items = JSON.parse(json);
          if (Array.isArray(items) && items.length) {
            pushCanvasHistory();
            canvasSlots[i] = { ...items[0] };
            renderLaunchCanvas();
            note(`${items[0].name || 'ウィンドウ'} をこの枠に配置しました`);
          }
        } catch {}
      }
    });

    canvasGrid.append(card);
  });
}

function closeModal() {
  const modal = $("#registerModal");
  if (modal) {
    modal.hidden = true;
  }
  editingItem = null;
  editingSource = null;
}

function openModal(mode = "single") {
  const modal = $("#registerModal");
  const modalSingleBody = $("#modalSingleBody");
  const modalBulkBody = $("#modalBulkBody");
  const modalTitle = $("#modalTitle");
  const modalBackBtn = $("#modalBackBtn");

  if (!modal) return;
  editingItem = null;
  editingSource = null;
  modal.hidden = false;
  if (mode === "bulk") {
    if (modalSingleBody) modalSingleBody.hidden = true;
    if (modalBulkBody) modalBulkBody.hidden = false;
    if (modalBackBtn) modalBackBtn.hidden = false;
    if (modalTitle) modalTitle.textContent = t("bulk_create_title");
  } else {
    if (modalSingleBody) modalSingleBody.hidden = false;
    if (modalBulkBody) modalBulkBody.hidden = true;
    if (modalBackBtn) modalBackBtn.hidden = true;
    if (modalTitle) modalTitle.textContent = t("register_window_title");
    if ($("#regWindowName")) $("#regWindowName").value = "";
    const list = $("#regUrlList");
    if (list) {
      list.textContent = "";
      list.append(createUrlRow(""), createUrlRow(""));
    }
  }
}

function initRegisterModal() {
  const modal = $("#registerModal");

  if (modal && !modal.dataset.initialized) {
    modal.dataset.initialized = "true";
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    $("#btnOpenRegisterModal")?.addEventListener("click", () => openModal("single"));
    $("#btnOpenRegisterModal2")?.addEventListener("click", () => openModal("single"));
    $("#modalCloseBtn")?.addEventListener("click", closeModal);
    $("#modalBackBtn")?.addEventListener("click", () => openModal("single"));
    $("#btnSwitchToBulk")?.addEventListener("click", () => openModal("bulk"));

    // Dynamic URL Input Rows
    $("#btnAddUrlRow")?.addEventListener("click", () => {
      const list = $("#regUrlList");
      if (!list) return;
      list.append(createUrlRow(""));
    });

    // Single submit with deduplication
    $("#btnRegSubmit")?.addEventListener("click", async () => {
      const name = $("#regWindowName")?.value.trim() || `Window ${trayItems.length + 1}`;
      const urlInputs = document.querySelectorAll(".reg-url");
      const urls = Array.from(urlInputs).map(i => i.value.trim()).filter(Boolean).join("\n");

      if (!urls && !name) {
        note("名前またはURLを入力してください");
        return;
      }

      if (isDuplicateWindow(name, urls, trayItems, editingItem?.id)) {
        note("同名の同じURLセットが既に登録されています（重複のためスキップ）");
        return;
      }

      if (editingItem) {
        editingItem.name = name;
        editingItem.urls = urls;
        if (!trayItems.some(t => t.id === editingItem.id)) {
          trayItems.push({ ...editingItem });
        }
        note(`${name} を更新しました`);
      } else {
        const newCard = { id: `tray-reg-${Date.now()}`, name, urls, color: "auto" };
        trayItems.push(newCard);
        pushCanvasHistory();
        canvasSlots.push({ ...newCard });
        note(`${name} を登録しました`);
      }

      await saveRegisteredWindows();
      renderLibraryTray();
      renderRegisteredWindowsList();
      renderLaunchCanvas();
      closeModal();
    });

    $("#btnRegClear")?.addEventListener("click", () => {
      if ($("#regWindowName")) $("#regWindowName").value = "";
      document.querySelectorAll(".reg-url").forEach(i => { i.value = ""; });
    });

    // Bulk File Export (.txt)
    $("#btnExportTxt")?.addEventListener("click", () => {
      const lines = [];
      trayItems.forEach((item, idx) => {
        if (idx > 0) lines.push("");
        lines.push(item.name || `Window ${idx + 1}`);
        if (item.urls) lines.push(item.urls);
      });
      const textContent = lines.join("\n");
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-window-deck-windows.txt";
      a.click();
      URL.revokeObjectURL(url);
      note("ウィンドウ登録一覧をテキストファイルとして書き出しました");
    });

    // Bulk File Import (.txt)
    $("#btnImportTxt")?.addEventListener("click", () => {
      $("#fileImportInput")?.click();
    });

    $("#fileImportInput")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result || "";
        const parsed = parsePastedList(text);
        if (!parsed.length) { note("ファイルに有効なウィンドウ情報がありませんでした"); return; }

        let addedCount = 0;
        parsed.forEach((slot, index) => {
          const name = slot.name || `Window ${trayItems.length + index + 1}`;
          const urls = slot.urls || "";
          if (!isDuplicateWindow(name, urls, trayItems)) {
            trayItems.push({
              id: `tray-file-${Date.now()}-${index}`,
              name,
              urls,
              color: "auto",
            });
            addedCount++;
          }
        });

        await saveRegisteredWindows();
        renderLibraryTray();
        renderRegisteredWindowsList();
        renderLaunchCanvas();
        note(`ファイルから ${addedCount} 個の新しいウィンドウを読み込みました`);
        e.target.value = "";
      };
      reader.readAsText(file);
    });

    // Bulk submit
    $("#btnBulkSubmit")?.addEventListener("click", async () => {
      const text = $("#modalBulkText")?.value || "";
      const parsed = parsePastedList(text);
      if (!parsed.length) { note("有効な入力がありませんでした"); return; }

      let addedCount = 0;
      parsed.forEach((slot, index) => {
        const name = slot.name || `Window ${trayItems.length + index + 1}`;
        const urls = slot.urls || "";
        if (!isDuplicateWindow(name, urls, trayItems)) {
          const newCard = {
            id: `tray-bulk-${Date.now()}-${index}`,
            name,
            urls,
            color: "auto",
          };
          trayItems.push(newCard);
          pushCanvasHistory();
          canvasSlots.push({ ...newCard });
          addedCount++;
        }
      });

      await saveRegisteredWindows();
      renderLibraryTray();
      renderRegisteredWindowsList();
      renderLaunchCanvas();
      closeModal();
      note(`${addedCount} 個のウィンドウを一括登録しました`);

      if ($("#modalBulkText")) $("#modalBulkText").value = "";
    });

    $("#btnBulkClear")?.addEventListener("click", () => {
      if ($("#modalBulkText")) $("#modalBulkText").value = "";
    });
  }
}

function initCanvasControls() {
  const dropzone = $("#launchCanvas");
  if (dropzone && !dropzone.dataset.initialized) {
    dropzone.dataset.initialized = "true";

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-over");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("drag-over");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag-over");
      const json = e.dataTransfer.getData("application/json");
      if (json) {
        try {
          const items = JSON.parse(json);
          if (Array.isArray(items) && items.length) {
            pushCanvasHistory();
            canvasSlots.push(...items.map((item) => ({ ...item })));
            renderLaunchCanvas();
          }
        } catch {}
      }
    });

    const countInput = $("#slotCountInput");
    if (countInput) {
      const handleCountChange = () => {
        const targetCount = Math.max(1, Math.min(16, parseInt(countInput.value) || 1));
        countInput.value = String(targetCount);
        pushCanvasHistory();
        while (canvasSlots.length < targetCount) {
          canvasSlots.push({
            id: `slot-blank-${Date.now()}-${canvasSlots.length}`,
            name: `Window ${canvasSlots.length + 1}`,
            urls: "",
            color: "auto",
          });
        }
        while (canvasSlots.length > targetCount) {
          canvasSlots.pop();
        }
        renderLaunchCanvas();
      };

      countInput.addEventListener("change", handleCountChange);
      countInput.addEventListener("input", handleCountChange);
    }

    // Slot + / - controls (step by 1)
    $("#btnSlotInc")?.addEventListener("click", () => {
      const targetCount = Math.min(16, canvasSlots.length + 1);
      if (countInput) countInput.value = String(targetCount);
      pushCanvasHistory();
      canvasSlots.push({
        id: `slot-blank-${Date.now()}`,
        name: `Window ${canvasSlots.length}`,
        urls: "",
        color: "auto",
      });
      renderLaunchCanvas();
    });

    $("#btnSlotDec")?.addEventListener("click", () => {
      if (!canvasSlots.length) return;
      const targetCount = Math.max(1, canvasSlots.length - 1);
      if (countInput) countInput.value = String(targetCount);
      pushCanvasHistory();
      canvasSlots.pop();
      renderLaunchCanvas();
      note(t("slot_removed_hint") || "ウィンドウを1つ減らしました");
    });

    // Factory Reset with double confirmation
    const btnReset = $("#btnFactoryReset");
    let confirmResetState = false;
    let resetTimer = null;

    btnReset?.addEventListener("click", async () => {
      if (!confirmResetState) {
        confirmResetState = true;
        btnReset.textContent = "🔴 本当に全データを初期化しますか？ (再度クリックで確定)";
        btnReset.classList.add("confirming");
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          confirmResetState = false;
          btnReset.textContent = t("btn_factory_reset") || "Reset All Data & Settings";
          btnReset.classList.remove("confirming");
        }, 4000);
      } else {
        clearTimeout(resetTimer);
        confirmResetState = false;
        await chrome.storage.sync.clear();
        await chrome.storage.session.clear();
        state = { ...DEFAULTS };
        trayItems = [];
        canvasSlots = [];
        canvasHistory = [];
        await render();
        await renderCanvasAll();
        note("全データと設定を完全初期化しました");
        if (btnReset) {
          btnReset.textContent = t("btn_factory_reset") || "Reset All Data & Settings";
          btnReset.classList.remove("confirming");
        }
      }
    });

    // Equalize Layout button
    $("#btnEqualize")?.addEventListener("click", () => {
      pushCanvasHistory();
      oddMode = "blank";
      const blankRadio = document.querySelector("input[name='oddMode'][value='blank']");
      if (blankRadio) blankRadio.checked = true;
      renderLaunchCanvas();
      note("レイアウトを全均等にリセットしました");
    });

    $("#btnCanvasAddAll")?.addEventListener("click", () => {
      if (!trayItems.length) return;
      pushCanvasHistory();
      canvasSlots.push(...trayItems.map((item) => ({ ...item })));
      renderLaunchCanvas();
    });

    $("#btnCanvasUndo")?.addEventListener("click", () => {
      popCanvasHistory();
    });

    $("#btnCanvasClear")?.addEventListener("click", () => {
      if (!canvasSlots.length) return;
      pushCanvasHistory();
      canvasSlots = [];
      renderLaunchCanvas();
    });

    $("#btnLaunchSelected")?.addEventListener("click", async () => {
      if (!canvasSlots.length) {
        note("起動するウィンドウがキャンバスに配置されていません");
        return;
      }
      const count = canvasSlots.length;
      let layout;
      if (splitMode === "fixed") {
        const preset = current();
        const cells = layoutCells(preset);
        const board = boardOf(cells, preset.columns);
        layout = { cols: board.cols, rows: board.rows, cells };
      } else {
        layout = globalThis.AIWindowDeckLayout.computeDynamicLayout(count, oddMode);
      }

      const payload = {
        type: "launch",
        preset: {
          columns: layout.cols,
          rows: layout.rows,
          cells: layout.cells,
          slots: canvasSlots,
        },
        targetDisplay: state.targetDisplay,
        sameDisplayOnly: state.sameDisplayOnly,
        groupTabs: state.groupTabs,
        openEmpty: state.openEmpty,
      };
      const response = await ask(payload);
      if (response?.ok) {
        say("launched");
      } else {
        note("起動に失敗しました");
      }
    });
  }
}

function initLayoutDropdown() {
  const container = $("#layoutDropdownContainer");
  const btnPicker = $("#btnLayoutPicker");
  const menu = $("#layoutDropdownMenu");
  const list = $("#layoutList");
  const btnCreate = $("#btnCreateNewLayout");
  const currentNameBadge = $("#currentLayoutName");

  if (!btnPicker || !menu) return;

  const renderDropdownList = () => {
    if (!list) return;
    list.textContent = "";
    const activePreset = current();
    if (currentNameBadge) currentNameBadge.textContent = activePreset?.name || "layout A";

    (state.presets || []).forEach((preset, idx) => {
      const item = document.createElement("div");
      const isActive = state.presets[state.activePreset] === preset;
      item.className = isActive ? "layout-item active" : "layout-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "layout-item-title";
      nameSpan.textContent = `🗂 ${preset.name || `layout ${String.fromCharCode(65 + idx)}`}`;

      const actionTools = document.createElement("div");
      actionTools.className = "layout-item-tools";

      // Inline rename button ✏️
      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "layout-action-btn";
      renameBtn.textContent = "✏️";
      renameBtn.title = "名前を変更";
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "text";
        input.className = "layout-rename-input";
        input.value = preset.name || "";
        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        const commitName = async () => {
          const newName = input.value.trim();
          if (newName) {
            preset.name = newName;
            await savePresets();
          }
          renderDropdownList();
        };

        input.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter") commitName();
          if (evt.key === "Escape") renderDropdownList();
        });
        input.addEventListener("blur", commitName);
      });

      // Delete layout button 🗑
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "layout-action-btn danger";
      deleteBtn.textContent = "🗑";
      deleteBtn.title = "レイアウトを削除";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (state.presets.length <= 1) {
          note(t("preset_last") || "最後の構成は削除できません");
          return;
        }
        const delIdx = state.presets.indexOf(preset);
        if (delIdx !== -1) {
          state.presets.splice(delIdx, 1);
          state.activePreset = Math.max(0, state.activePreset - 1);
          await savePresets();
          await render();
          renderDropdownList();
          note("レイアウトを削除しました");
        }
      });

      const checkBadge = document.createElement("small");
      checkBadge.textContent = isActive ? "✓" : "";

      actionTools.append(renameBtn, deleteBtn, checkBadge);
      item.append(nameSpan, actionTools);

      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        const realIdx = state.presets.indexOf(preset);
        if (realIdx !== -1) {
          state.activePreset = realIdx;
          await save({ activePreset: realIdx });
          menu.hidden = true;
          await render();
          await renderCanvasAll();
          note(`${preset.name} に切り替えました`);
        }
      });

      list.append(item);
    });
  };

  // Initialize dropdown event listeners ONLY ONCE
  if (!container.dataset.initialized) {
    container.dataset.initialized = "true";

    btnPicker.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        renderDropdownList();
      }
    });

    btnCreate?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const newName = `layout ${String.fromCharCode(65 + state.presets.length)}`;
      state.presets.push({
        name: newName,
        layoutId: "2x2", columns: 2, rows: 2, cells: null, shape: null, slots: [],
      });
      state.activePreset = state.presets.length - 1;
      await savePresets();
      menu.hidden = true;
      await render();
      await renderCanvasAll();
      note(`新しいレイアウト ${newName} を作成しました`);
    });

    document.addEventListener("click", (e) => {
      if (container && !container.contains(e.target)) {
        menu.hidden = true;
      }
    });
  }

  renderDropdownList();
}

async function renderCanvasAll() {
  await loadRegisteredWindows();
  renderLibraryTray();
  renderRegisteredWindowsList();
  renderLaunchCanvas();
  initCanvasControls();
  initRegisterModal();
  initLayoutDropdown();
}

// Only the pop-out window can go full screen; the toolbar popup cannot.
async function paintFullscreen() {
  const button = $("#fullscreen");
  if (orphaned()) { button.hidden = true; return; }
  const tab = await chrome.tabs.getCurrent().catch(() => undefined);
  if (!tab) { button.hidden = true; return; }
  const win = await chrome.windows.get(tab.windowId);
  button.hidden = win.type !== "popup";
  button.textContent = t(win.state === "fullscreen" ? "fullscreen_exit" : "fullscreen");
  button.dataset.state = win.state;
}

$("#fullscreen")?.addEventListener("click", async () => {
  if (orphaned()) return;
  const tab = await chrome.tabs.getCurrent().catch(() => undefined);
  if (!tab) return;
  const win = await chrome.windows.get(tab.windowId);
  await chrome.windows.update(tab.windowId, {
    state: win.state === "fullscreen" ? "normal" : "fullscreen",
  });
  setTimeout(paintFullscreen, 400);
});

$("#closeAll")?.addEventListener("click", async () => {
  const response = await ask({ type: "windowList" });
  const ids = (response?.windows ?? []).filter((w) => !w.isFocused).map((w) => w.id);
  if (!ids.length) return;
  await ask({ type: "closeWindows", windowIds: ids });
  say("close_all_confirm");
  paintWindowList();
});

$("#openDock")?.addEventListener("click", async () => {
  await ask({ type: "dock" });
});

$("#openBig")?.addEventListener("click", async () => {
  if (orphaned()) return;
  await ask({ type: "bigSettings" });
  window.close();
});

chrome.storage.sync.get(DEFAULTS).then(async (values) => {
  state = { ...DEFAULTS, ...values };
  await markSurface();
  await render();
  await renderCanvasAll();
});
