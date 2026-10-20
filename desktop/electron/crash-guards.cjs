// Electron has no FedCM dialog. Vercel's "Continue with Google" and Google
// pages such as Gmail ask for one, and showing it takes the whole app down
// (SIGSEGV on the browser main thread, seen in 0.3.0). With FedCM off, the
// button opens a normal popup, which the pane already allows.
const DISABLED_CHROMIUM_FEATURES = ["FedCm", "FedCmButtonMode"];

function applyChromiumFlags(commandLine) {
  commandLine.appendSwitch("disable-features", DISABLED_CHROMIUM_FEATURES.join(","));
}

module.exports = { DISABLED_CHROMIUM_FEATURES, applyChromiumFlags };
