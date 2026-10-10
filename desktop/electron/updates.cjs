const { app } = require("electron");

const RECHECK_MS = 6 * 60 * 60 * 1000;

// Reports { status, version?, percent?, manual } to `onState`. Status is one of
// checking, downloading, ready, current, error. Only packaged builds update:
// the feed (build.publish in package.json) is baked into app-update.yml.
function createUpdater(onState) {
  if (!app.isPackaged) {
    return { check: (manual) => manual && onState({ status: "current", version: app.getVersion(), manual }), install: () => {} };
  }
  const { autoUpdater } = require("electron-updater");
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = null;

  let manual = false;
  let ready = null;
  const report = (state) => onState({ ...state, manual });

  autoUpdater.on("checking-for-update", () => report({ status: "checking" }));
  autoUpdater.on("update-available", (info) => report({ status: "downloading", version: info.version, percent: 0 }));
  autoUpdater.on("download-progress", (progress) => report({ status: "downloading", percent: Math.round(progress.percent) }));
  autoUpdater.on("update-not-available", () => {
    report({ status: "current", version: app.getVersion() });
    manual = false;
  });
  autoUpdater.on("update-downloaded", (info) => {
    ready = info.version;
    report({ status: "ready", version: info.version });
    manual = false;
  });
  autoUpdater.on("error", () => {
    report({ status: "error" });
    manual = false;
  });

  const check = (isManual = false) => {
    if (ready) return onState({ status: "ready", version: ready, manual: isManual });
    manual = manual || isManual;
    autoUpdater.checkForUpdates().catch(() => {});
  };
  setInterval(() => check(false), RECHECK_MS).unref?.();

  return { check, install: () => ready && autoUpdater.quitAndInstall() };
}

module.exports = { createUpdater };
