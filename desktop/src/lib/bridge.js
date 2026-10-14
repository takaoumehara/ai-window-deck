// window.deck comes from electron/preload.cjs. Outside Electron (plain `vite`
// for UI work) a stand-in keeps the shell usable without any web panes.
import bundledDevices from "../../electron/devices.json";

const STORAGE_KEY = "ai-window-deck-desktop";
const noop = () => {};
const noSubscribe = () => noop;

const readLocal = () => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  return { version: 2, sets: Array.isArray(saved?.sets) ? saved.sets : [], settings: saved?.settings || {} };
};

const browserStandIn = {
  info: async () => ({ platform: "browser", locale: navigator.language, version: "dev" }),
  load: async () => ({ store: readLocal(), setId: null, openSetIds: [] }),
  applyStore: async ({ put = [], remove = [], order, settings } = {}) => {
    const store = readLocal();
    let sets = store.sets.filter((set) => !remove.includes(set.id));
    for (const set of put) {
      const at = sets.findIndex((candidate) => candidate.id === set.id);
      if (at >= 0) sets[at] = set;
      else sets.push(set);
    }
    if (order) sets = [...sets].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, sets, settings: { ...store.settings, ...settings } }));
  },
  onStoreChanged: noSubscribe,
  onOpenSets: noSubscribe,
  claimSet: async () => true,
  openWindow: noop,
  importBackup: async () => null,
  syncPanes: noop,
  setBounds: noop,
  setOverlay: noop,
  setTransition: noop,
  snapshot: async () => ({}),
  focusShell: noop,
  focusPane: noop,
  navigate: noop,
  setZoom: async (_paneId, factor) => factor,
  getZoom: async () => 1,
  find: noop,
  stopFind: noop,
  onFound: noSubscribe,
  onCommand: noSubscribe,
  onPaneFocused: noSubscribe,
  onPaneState: noSubscribe,
  onPaneError: noSubscribe,
  devices: async () => bundledDevices,
  onDevicesChanged: noSubscribe,
  checkForUpdates: noop,
  installUpdate: noop,
  onUpdateState: noSubscribe,
};

export const deck = typeof window !== "undefined" && window.deck ? window.deck : browserStandIn;
export const isElectron = typeof window !== "undefined" && Boolean(window.deck);
