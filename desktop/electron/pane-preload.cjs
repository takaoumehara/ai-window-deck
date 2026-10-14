// Runs in an isolated world inside each page view; the page itself gets no API.
// Chrome handles the mouse's back / forward buttons in the browser UI, which
// Electron doesn't have, so they are forwarded to the main process here.
const { ipcRenderer } = require("electron");

// Device-mode browser chrome. The stylesheet arrives through insertCSS (see
// device-chrome.cjs); this only builds the bar and the fading scrollbar, because
// a sandboxed preload can't require the other file. Scroll down hides the bar,
// scroll up or the top of the page brings it back. A short nudge does nothing.
const CHROME_LABELS = { address: "Address", reload: "Reload", back: "Back", forward: "Forward" };

function chromeScrollIntent(previous, next, { atTop = false, canScroll = true } = {}) {
  if (!canScroll || atTop) return "expand";
  const delta = next - previous;
  if (delta > 10) return "collapse";
  if (delta < -10) return "expand";
  return null;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function installDeviceChrome() {
  let spec = null;
  let root = null;
  let collapsed = false;
  let tracked = null;
  let lastTop = 0;
  const dark = window.matchMedia?.("(prefers-color-scheme: dark)") ?? { matches: false, addEventListener() {} };

  const scrollingElement = (target) => {
    if (target === document || target === document.documentElement || target === document.body) {
      return document.scrollingElement || document.documentElement;
    }
    return target instanceof Element ? target : null;
  };

  const insets = () => {
    if (!root) return { top: 0, bottom: 0 };
    const edge = root.getAttribute("data-edge");
    const hiding = root.getAttribute("data-collapsed") === "true";
    if (edge === "bottom") return { top: 0, bottom: hiding ? 28 : 78 };
    if (edge === "top") return { top: hiding ? 0 : 56, bottom: 0 };
    return { top: 0, bottom: 0 };
  };

  const placeBar = (bar, { scroll, client, pos, origin, span, cross, axis }) => {
    if (!bar) return;
    if (scroll <= client + 2 || span < 20) {
      bar.classList.remove("is-on");
      bar.style.setProperty("opacity", "0", "important");
      return;
    }
    bar.style.removeProperty("opacity");
    const size = Math.max(18, (client / scroll) * span);
    const travel = Math.max(0, span - size);
    const range = scroll - client;
    const offset = range > 0 ? (pos / range) * travel : 0;
    if (axis === "v") {
      bar.style.setProperty("top", `${origin + offset}px`, "important");
      bar.style.setProperty("height", `${size}px`, "important");
      bar.style.setProperty("left", `${cross}px`, "important");
    } else {
      bar.style.setProperty("left", `${origin + offset}px`, "important");
      bar.style.setProperty("width", `${size}px`, "important");
      bar.style.setProperty("top", `${cross}px`, "important");
    }
    bar.classList.add("is-on");
    clearTimeout(bar._hide);
    bar._hide = setTimeout(() => bar.classList.remove("is-on"), 700);
  };

  const showScrollbar = (el) => {
    if (!root) return;
    const box = el === (document.scrollingElement || document.documentElement)
      ? { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, right: window.innerWidth, bottom: window.innerHeight }
      : el.getBoundingClientRect();
    const pad = insets();
    placeBar(root.querySelector("[data-bar='v']"), {
      scroll: el.scrollHeight, client: el.clientHeight, pos: el.scrollTop,
      origin: box.top + pad.top, span: box.height - pad.top - pad.bottom, cross: box.right - 6, axis: "v",
    });
    placeBar(root.querySelector("[data-bar='h']"), {
      scroll: el.scrollWidth, client: el.clientWidth, pos: el.scrollLeft,
      origin: box.left + 4, span: box.width - 8, cross: box.bottom - pad.bottom - 6, axis: "h",
    });
  };

  const setCollapsed = (next) => {
    if (!root || next === collapsed) return;
    collapsed = next;
    root.setAttribute("data-collapsed", next ? "true" : "false");
  };

  const onScroll = (event) => {
    if (!root) return;
    const el = scrollingElement(event.target);
    if (!el) return;
    showScrollbar(el);
    const main = el === document.scrollingElement || el === document.documentElement || el === document.body
      || el.clientHeight >= window.innerHeight * 0.7;
    if (!main) return;
    const y = el.scrollTop || 0;
    if (el !== tracked) {
      tracked = el;
      lastTop = y;
      return;
    }
    const intent = chromeScrollIntent(lastTop, y, {
      atTop: y <= 1,
      canScroll: el.scrollHeight > el.clientHeight + 8,
    });
    lastTop = y;
    if (intent === "collapse") setCollapsed(true);
    else if (intent === "expand") setCollapsed(false);
  };

  const paint = () => {
    if (!spec) {
      root?.remove();
      root = null;
      collapsed = false;
      tracked = null;
      return;
    }
    const key = `${spec.edge}:${spec.kind}:${spec.home ? 1 : 0}`;
    if (!root || root.dataset.key !== key) {
      root?.remove();
      collapsed = false;
      tracked = null;
      lastTop = 0;
      root = document.createElement("div");
      root.dataset.deckChrome = "";
      root.dataset.key = key;
      root.setAttribute("data-collapsed", "false");
      for (const name of ["v", "h"]) {
        const bar = document.createElement("div");
        bar.setAttribute("data-bar", name);
        root.appendChild(bar);
      }
      const home = document.createElement("div");
      home.setAttribute("data-home", "");
      root.appendChild(home);
      const toolbar = document.createElement("div");
      toolbar.setAttribute("data-toolbar", "");
      const button = (act, label) => {
        const el = document.createElement("button");
        el.type = "button";
        el.tabIndex = -1;
        el.setAttribute("data-act", act);
        el.setAttribute("aria-label", label);
        if (act === "aa") el.textContent = "AA";
        if (act === "address") {
          const lock = document.createElement("span");
          lock.setAttribute("data-lock", "");
          const host = document.createElement("span");
          host.setAttribute("data-host", "");
          el.append(lock, host);
        }
        return el;
      };
      const labels = { ...CHROME_LABELS, ...spec.labels };
      toolbar.append(
        button("back", labels.back),
        button("aa", "AA"),
        button("address", labels.address),
        button("forward", labels.forward),
        button("reload", labels.reload),
      );
      toolbar.addEventListener("click", (event) => {
        const control = event.target.closest?.("[data-act]");
        const act = control?.getAttribute("data-act");
        if (!act || act === "aa") return;
        event.preventDefault();
        event.stopPropagation();
        ipcRenderer.send("pane:chrome-action", act);
      });
      root.appendChild(toolbar);
      (document.documentElement || document.body).appendChild(root);
    }
    root.setAttribute("data-edge", spec.edge);
    root.setAttribute("data-kind", spec.kind);
    root.setAttribute("data-home", spec.home ? "true" : "false");
    root.setAttribute("data-landscape", spec.landscape ? "true" : "false");
    root.setAttribute("data-dark", dark.matches ? "true" : "false");
    root.setAttribute("data-collapsed", collapsed ? "true" : "false");
    const labels = { ...CHROME_LABELS, ...spec.labels };
    for (const [act, label] of Object.entries(labels)) {
      root.querySelector(`[data-act="${act}"]`)?.setAttribute("aria-label", label);
    }
    const host = root.querySelector("[data-host]");
    if (host) host.textContent = hostOf(spec.url);
  };

  const apply = () => {
    if (document.documentElement) paint();
    else document.addEventListener("DOMContentLoaded", paint, { once: true });
  };

  document.addEventListener("scroll", onScroll, true);
  dark.addEventListener?.("change", () => root && root.setAttribute("data-dark", dark.matches ? "true" : "false"));
  ipcRenderer.on("device-chrome:set", (_event, next) => {
    spec = next;
    apply();
  });
}

installDeviceChrome();

window.addEventListener(
  "mouseup",
  (event) => {
    if (event.button !== 3 && event.button !== 4) return;
    event.preventDefault();
    ipcRenderer.send("pane:mouse-nav", event.button === 3 ? "back" : "forward");
  },
  true
);
