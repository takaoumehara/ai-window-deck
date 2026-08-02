// Reports how busy this page looks, without knowing anything about the site.
// A page whose DOM is churning is treated as working; one that has gone quiet
// for a couple of seconds is treated as finished. That is a heuristic, not a
// fact, which is why it is reported as "looks done" and can be switched off.
const QUIET_MS = 2500;
const PING_EVERY = 1500;

let quietTimer;
let changedRecently = false;
let lastPing = 0;
let attached = true;

// Reloading or updating the extension leaves this script running in pages that
// were already open, with its half of the bridge torn away. Chrome then throws
// "Extension context invalidated" — synchronously, so a .catch() never sees it
// — and would throw again on every later mutation. One sign of that is enough:
// shut down for good and leave the page alone.
function detach() {
  if (!attached) return;
  attached = false;
  observer.disconnect();
  clearTimeout(quietTimer);
  document.removeEventListener("visibilitychange", onVisibility);
}

const orphaned = () => !attached || !globalThis.chrome?.runtime?.id;

function report(state) {
  if (orphaned()) {
    detach();
    return;
  }
  const now = Date.now();
  if (state === "busy" && now - lastPing < PING_EVERY) return;
  lastPing = now;
  try {
    // The worker may simply be asleep, which is not worth surfacing either.
    chrome.runtime.sendMessage({ type: "activity", state, hidden: document.hidden })?.catch(() => {});
  } catch {
    detach();
  }
}

const observer = new MutationObserver((mutations) => {
  if (orphaned()) {
    detach();
    return;
  }
  if (!mutations.some((mutation) => mutation.addedNodes.length || mutation.type === "characterData")) return;
  changedRecently = true;
  report("busy");
  clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    if (!changedRecently) return;
    changedRecently = false;
    report("done");
  }, QUIET_MS);
});

function onVisibility() {
  if (document.hidden) return;
  changedRecently = false;
  clearTimeout(quietTimer);
  report("seen");
}

if (document.body) observer.observe(document.body, { childList: true, characterData: true, subtree: true });
document.addEventListener("visibilitychange", onVisibility);
