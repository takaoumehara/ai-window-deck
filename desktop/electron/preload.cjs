const { contextBridge, ipcRenderer } = require("electron");

const subscribe = (channel) => (callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld("deck", {
  info: () => ipcRenderer.invoke("app:info"),
  load: () => ipcRenderer.invoke("store:load"),
  applyStore: (patch) => ipcRenderer.invoke("store:apply", patch),
  onStoreChanged: subscribe("store:changed"),
  onOpenSets: subscribe("store:open-sets"),
  claimSet: (setId) => ipcRenderer.invoke("shell:claim-set", setId),
  openWindow: (setId) => ipcRenderer.send("shell:open-window", setId ?? null),
  importBackup: () => ipcRenderer.invoke("backup:import"),
  syncPanes: (panes) => ipcRenderer.send("panes:sync", panes),
  setBounds: (list) => ipcRenderer.send("panes:bounds", list),
  setOverlay: (open) => ipcRenderer.send("panes:overlay", open),
  setTransition: (active) => ipcRenderer.send("panes:transition", active),
  snapshot: () => ipcRenderer.invoke("panes:snapshot"),
  focusShell: () => ipcRenderer.send("shell:focus"),
  focusPane: (paneId) => ipcRenderer.send("pane:focus", paneId),
  navigate: (paneId, action, url) => ipcRenderer.send("pane:navigate", { paneId, action, url }),
  setZoom: (paneId, factor) => ipcRenderer.invoke("pane:zoom", { paneId, factor }),
  getZoom: (paneId) => ipcRenderer.invoke("pane:get-zoom", paneId),
  find: (paneId, text, options) => ipcRenderer.send("pane:find", { paneId, text, ...options }),
  stopFind: (paneId) => ipcRenderer.send("pane:find-stop", paneId),
  onFound: subscribe("pane:found"),
  onCommand: subscribe("deck:command"),
  onPaneFocused: subscribe("pane:focused"),
  onPaneState: subscribe("pane:state"),
  onPaneError: subscribe("pane:error"),
  checkForUpdates: () => ipcRenderer.send("update:check"),
  installUpdate: () => ipcRenderer.send("update:install"),
  onUpdateState: subscribe("update:state"),
});
