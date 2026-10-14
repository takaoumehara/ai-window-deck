// deck.json, owned by the main process so several deck windows can edit it.
//   version 1: { windows, settings: { mode, focusedId, activeTabs, sidebarOpen, lang } }
//   version 2: { sets: [{ id, name, windows, mode, focusedId, activeTabs }], settings: { lang, sidebarOpen, defaultMode } }
const STORE_VERSION = 2;

function normalizeSet(set, index) {
  return {
    id: String(set.id || `set-${Date.now()}-${index}`),
    name: String(set.name || ""),
    windows: Array.isArray(set.windows) ? set.windows : [],
    mode: set.mode || "grid",
    focusedId: set.focusedId || null,
    activeTabs: set.activeTabs && typeof set.activeTabs === "object" ? set.activeTabs : {},
    ...(set.layout && typeof set.layout === "object" && !Array.isArray(set.layout) ? { layout: set.layout } : {}),
  };
}

function migrateStore(raw) {
  if (!raw || typeof raw !== "object") return { version: STORE_VERSION, sets: [], settings: {} };
  if (Array.isArray(raw.sets)) {
    return { version: STORE_VERSION, sets: raw.sets.filter(Boolean).map(normalizeSet), settings: { ...raw.settings } };
  }
  const { mode, focusedId, activeTabs, sidebarOpen, lang } = raw.settings || {};
  const sets = Array.isArray(raw.windows) ? [normalizeSet({ id: "set-main", windows: raw.windows, mode, focusedId, activeTabs }, 0)] : [];
  const settings = {};
  if (sidebarOpen !== undefined) settings.sidebarOpen = sidebarOpen;
  if (lang) settings.lang = lang;
  return { version: STORE_VERSION, sets, settings };
}

// A patch from one deck window: sets to upsert, ids to remove, an optional new
// order, and settings to merge. Sets keep their position when updated.
function applyStorePatch(store, { put = [], remove = [], order, settings } = {}) {
  let sets = store.sets.filter((set) => !remove.includes(set.id));
  put.forEach((set, index) => {
    const next = normalizeSet(set, index);
    const at = sets.findIndex((candidate) => candidate.id === next.id);
    if (at >= 0) sets[at] = next;
    else sets.push(next);
  });
  if (Array.isArray(order)) {
    const rank = new Map(order.map((id, index) => [id, index]));
    sets = sets
      .map((set, index) => ({ set, index }))
      .sort((a, b) => (rank.get(a.set.id) ?? order.length + a.index) - (rank.get(b.set.id) ?? order.length + b.index))
      .map(({ set }) => set);
  }
  return { ...store, sets, settings: settings ? { ...store.settings, ...settings } : store.settings };
}

module.exports = { STORE_VERSION, migrateStore, applyStorePatch };
