// window.deck comes from electron/preload.cjs. Outside Electron (plain `vite`
// for UI work) a stand-in keeps the shell usable without any web panes.
const STORAGE_KEY = "ai-window-deck-desktop";
const noop = () => {};
const noSubscribe = () => noop;

const browserStandIn = {
  info: async () => ({ platform: "browser", locale: navigator.language }),
  load: async () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
  save: async (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)),
  importBackup: async () => null,
  syncPanes: noop,
  setBounds: noop,
  setOverlay: noop,
  focusPane: noop,
  navigate: noop,
  onCommand: noSubscribe,
  onPaneFocused: noSubscribe,
  onPaneState: noSubscribe,
  onPaneError: noSubscribe,
};

export const deck = typeof window !== "undefined" && window.deck ? window.deck : browserStandIn;
export const isElectron = typeof window !== "undefined" && Boolean(window.deck);
