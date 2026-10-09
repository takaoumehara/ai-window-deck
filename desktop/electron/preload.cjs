const { contextBridge, ipcRenderer } = require("electron");

const subscribe = (channel) => (callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld("deck", {
  info: () => ipcRenderer.invoke("app:info"),
  load: () => ipcRenderer.invoke("store:load"),
  save: (data) => ipcRenderer.invoke("store:save", data),
  importBackup: () => ipcRenderer.invoke("backup:import"),
  syncPanes: (panes) => ipcRenderer.send("panes:sync", panes),
  setBounds: (list) => ipcRenderer.send("panes:bounds", list),
  setOverlay: (open) => ipcRenderer.send("panes:overlay", open),
  focusPane: (paneId) => ipcRenderer.send("pane:focus", paneId),
  navigate: (paneId, action) => ipcRenderer.send("pane:navigate", { paneId, action }),
  onCommand: subscribe("deck:command"),
  onPaneFocused: subscribe("pane:focused"),
  onPaneState: subscribe("pane:state"),
  onPaneError: subscribe("pane:error"),
});
