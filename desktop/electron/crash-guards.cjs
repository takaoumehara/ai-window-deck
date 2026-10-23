// Electron has no FedCM dialog. With these features off, "Continue with Google"
// falls back to a normal popup, which the pane already allows. The 0.3.0 quit
// while opening Gmail is separate: it is the user-agent change inside
// DidRedirectNavigation, deferred in main.cjs.
const DISABLED_CHROMIUM_FEATURES = ["FedCm", "FedCmButtonMode"];

function applyChromiumFlags(commandLine) {
  commandLine.appendSwitch("disable-features", DISABLED_CHROMIUM_FEATURES.join(","));
}

module.exports = { DISABLED_CHROMIUM_FEATURES, applyChromiumFlags };
