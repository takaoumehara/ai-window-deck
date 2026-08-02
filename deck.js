const DEFAULTS = {
  columns: 4,
  rows: 2,
  attention: true,
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

async function paintShortcuts() {
  if (orphaned()) return;
  const commands = await chrome.commands.getAll();
  paintInlineShortcuts(commands);
  const list = $("#shortcutList");
  list.textContent = "";
  const labels = { ...COMMAND_LABELS };
  for (let i = 1; i <= 8; i++) labels[`focus-tile-${i}`] = null;
  for (const [name, key] of Object.entries(labels)) {
    const command = commands.find((entry) => entry.name === name);
    if (!command) continue;
    const { words, native } = shortcutForms(command.shortcut);
    const term = document.createElement("dt");
    term.textContent = key ? t(key) : `${t("cmd_tile_n")} ${name.replace("focus-tile-", "")}`;
    const value = document.createElement("dd");
    if (words) {
      value.textContent = words;
      if (native) {
        const chip = document.createElement("kbd");
        chip.textContent = native;
        value.append(" ", chip);
      }
    } else {
      value.textContent = t("unset");
      value.classList.add("unset");
    }
    list.append(term, value);
  }
}

// Monitors are drawn where they actually sit, at the same relative scale, so
// the picker is the arrangement rather than a list of indistinguishable names.
// Each one can be flashed, the way macOS does in Arrangement.
async function paintDisplayOptions() {
  const map = $("#displayMap");
  const response = await ask({ type: "displays" });
  const displays = response?.displays ?? [];
  map.textContent = "";
  if (!displays.length) return;
  // With one monitor there is no decision to make, so the step collapses to a
  // single line instead of a picker showing one option.
  $("#stepScreen")?.classList.toggle("solo", displays.length < 2);
  if (displays.length < 2) {
    const only = document.createElement("p");
    only.className = "hint";
    only.textContent = `${t("screen_one")} — ${displays[0].bounds.width}×${displays[0].bounds.height}`;
    map.append(only);
    return;
  }

  const selected = new Set(state.targetDisplays ?? []);
  const follow = document.createElement("button");
  follow.type = "button";
  follow.className = "follow";
  follow.setAttribute("aria-pressed", String(selected.size === 0));
  const here = displays.find((display) => display.isFocused);
  follow.textContent = here
    ? `${t("display_focused")}（${t("display_word")} ${here.number}）`
    : t("display_focused");
  follow.addEventListener("click", async () => {
    state.targetDisplays = [];
    await save({ targetDisplays: [], targetDisplay: "focused" });
    await paintDisplayOptions();
    say("saved");
  });
  map.append(follow);

  // One shared scale keeps the proportions honest: a 4K next to a laptop
  // screen looks like a 4K next to a laptop screen.
  const minLeft = Math.min(...displays.map((d) => d.bounds.left));
  const minTop = Math.min(...displays.map((d) => d.bounds.top));
  const maxRight = Math.max(...displays.map((d) => d.bounds.left + d.bounds.width));
  const maxBottom = Math.max(...displays.map((d) => d.bounds.top + d.bounds.height));
  const scale = Math.min(360 / (maxRight - minLeft), 150 / (maxBottom - minTop));

  const stage = document.createElement("div");
  stage.className = "stage";
  stage.style.width = `${Math.round((maxRight - minLeft) * scale)}px`;
  stage.style.height = `${Math.round((maxBottom - minTop) * scale)}px`;

  for (const display of displays) {
    const badges = [
      display.isInternal ? t("display_internal") : null,
      display.isPrimary ? t("display_primary") : null,
      display.isMirrored ? t("display_mirror") : null,
      display.isFocused ? t("display_here") : null,
    ].filter(Boolean);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "screen";
    card.setAttribute("aria-pressed", String(selected.has(display.id)));
    // Chosen directly is filled; "wherever I am" resolving here is outlined.
    // Painting both the same blue would hide which of the two is happening.
    if (!selected.size && display.isFocused) card.classList.add("resolved");
    card.style.left = `${Math.round((display.bounds.left - minLeft) * scale)}px`;
    card.style.top = `${Math.round((display.bounds.top - minTop) * scale)}px`;
    card.style.width = `${Math.round(display.bounds.width * scale)}px`;
    card.style.height = `${Math.round(display.bounds.height * scale)}px`;
    card.title = `${display.name || ""} ${display.bounds.width}×${display.bounds.height}`.trim();
    card.innerHTML = "";

    const number = document.createElement("b");
    number.textContent = String(display.number);
    const size = document.createElement("small");
    size.textContent = `${display.bounds.width}×${display.bounds.height}`;
    card.append(number, size);
    if (badges.length) {
      const tag = document.createElement("em");
      tag.textContent = badges.join(" · ");
      card.append(tag);
    }
    card.setAttribute("aria-label",
      `${t("display_word")} ${display.number} ${display.bounds.width}×${display.bounds.height} ${badges.join(" ")}`);

    card.addEventListener("click", async () => {
      const next = new Set(state.targetDisplays ?? []);
      if (next.has(display.id)) next.delete(display.id); else next.add(display.id);
      state.targetDisplays = [...next];
      await save({ targetDisplays: state.targetDisplays, targetDisplay: "focused" });
      await paintDisplayOptions();
      say("saved");
    });

    const flash = document.createElement("span");
    flash.className = "flash";
    flash.setAttribute("role", "button");
    flash.setAttribute("tabindex", "0");
    flash.textContent = "◉";
    flash.title = t("display_identify");
    flash.setAttribute("aria-label", `${t("display_identify")} ${display.number}`);
    const identify = (event) => {
      event.stopPropagation();
      ask({
        type: "identify",
        displayId: display.id,
        number: display.number,
        label: badges.join(" · "),
      });
    };
    flash.addEventListener("click", identify);
    flash.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") identify(event);
    });
    card.append(flash);
    stage.append(card);
  }
  map.append(stage);
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
  document.querySelector(`input[name=anchor][value="${state.spotlightAnchor}"]`)?.setAttribute("checked", "checked");
  const anchorInput = document.querySelector(`input[name=anchor][value="${state.spotlightAnchor}"]`);
  if (anchorInput) anchorInput.checked = true;
  $("#spotlightWidth").value = state.spotlightWidth;
  $("#widthValue").value = `${state.spotlightWidth}%`;
  $("#spotlightHeight").value = state.spotlightHeight;
  $("#heightValue").value = `${state.spotlightHeight}%`;
  $("#customSize").hidden = state.spotlightSize !== "custom";
  // A full-screen window has nowhere to land, so the choice is meaningless.
  $("#anchorCard").hidden = state.spotlightSize === "full";
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
    // Undo ships without a key — Chrome allows only four suggested ones — so
    // its line stays blank rather than shouting "not set" every time.
    const words = shortcutForms(commands.find((entry) => entry.name === name)?.shortcut).words;
    // Full screen and undo ship without a key — Chrome allows only four
    // defaults — so their line stays blank rather than shouting "not set".
    node.textContent = words || (id === "undo" || id === "fullscreen" ? "" : t("unset"));
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
  $("#cols").value = preset.columns;
  $("#colsValue").value = preset.columns;
  $("#rows").value = preset.rows;
  $("#rowsValue").value = preset.rows;
  const customDetails = $("#customGrid")?.closest("details");
  if (customDetails) {
    customDetails.open = currentLayoutId() === "custom";
    customDetails.classList.toggle("selected", currentLayoutId() === "custom");
  }
  $("#skipMinimized").checked = state.skipMinimized;
  $("#keepOrder").checked = state.keepOrder;
  $("#sameDisplayOnly").checked = state.sameDisplayOnly;
  $("#groupTabs").checked = state.groupTabs;
  $("#openEmpty").checked = state.openEmpty;
  $("#attention").checked = state.attention;

  const bulk = $("#bulkText");
  if (bulk) { bulk.placeholder = t("bulk_placeholder"); paintBulkPreview(); }
  paintPresetTabs();
  $("#noSaved").hidden = state.presets.some((preset) =>
    (preset.slots ?? []).some((slot) => (slot?.urls ?? "").trim()));
  paintLayoutOptions();
  paintPreview();
  paintSlots();
  paintLanguageOptions();
  paintSizes();
  paintResize();
  await paintDisplayOptions();
  await paintShortcuts();
  await paintFullscreen();
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
  input.addEventListener("input", () => { $(`#${id}Value`).value = input.value; });
  input.addEventListener("change", async () => {
    applyCustomGrid(current(), $("#cols").value, $("#rows").value);
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
  input.addEventListener("input", () => { output.value = `${input.value}%`; });
  input.addEventListener("change", async () => {
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

for (const id of ["skipMinimized", "keepOrder", "sameDisplayOnly", "groupTabs", "openEmpty", "attention"]) {
  $(`#${id}`).addEventListener("change", async (event) => {
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

$("#bulkApply")?.addEventListener("click", async () => {
  const parsed = parsePastedList($("#bulkText").value);
  if (!parsed.length) { say("bulk_empty"); return; }
  const preset = current();
  applyBulkLayout(preset, parsed.length);
  preset.slots = parsed.map((slot, index) => ({
    ...slot,
    color: preset.slots?.[index]?.color ?? "auto",
  }));
  await savePresets();
  await render();
  paintBulkPreview();
  $("#status").textContent = `${parsed.length} ${t("bulk_done")}`;
});

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
});
