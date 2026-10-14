// The Google sign-in window presents a browser that isn't Chrome (see
// google-signin.cjs). Such browsers have no navigator.userAgentData, so the
// page shouldn't find Chromium's either.
const { contextBridge } = require("electron");

contextBridge.executeInMainWorld({
  func: () => {
    delete Navigator.prototype.userAgentData;
  },
});
