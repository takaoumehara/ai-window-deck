// Browser chrome drawn inside a device-mode page: a Safari or Chrome bar that
// slides in and out, and a scrollbar that shows while scrolling and then fades.
// The stylesheet is injected with insertCSS so a page's CSP can't strip it.
// The DOM is built from the pane preload, which already runs in the page.

const svg = (body) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
)}`;

const ICON = {
  back: svg("<path d='M15 18l-6-6 6-6'/>"),
  forward: svg("<path d='M9 18l6-6-6-6'/>"),
  reload: svg("<path d='M20 12a8 8 0 1 1-2.2-5.5'/><path d='M20 4v5h-5'/>"),
  lock: svg("<rect x='6' y='11' width='12' height='9' rx='1.5'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>"),
};

function mask(url) {
  return `-webkit-mask:url("${url}") center / contain no-repeat !important;mask:url("${url}") center / contain no-repeat !important;`;
}

// What a catalog device shows over its page, or null on the desktop.
function chromeAppearance(device) {
  if (!device) return null;
  const tablet = device.type === "tablet" || device.os === "ipados";
  if (device.os === "ios" && !tablet) return { edge: "bottom", kind: "safari", home: Number(device.radius) > 0 };
  if (tablet) return { edge: "top", kind: "safari", home: false };
  if (device.os === "android") return { edge: "top", kind: "chrome", home: false };
  return null;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Scroll down hides the bar, scroll up or the top of the page brings it back.
// Small nudges do nothing, so a tap doesn't flicker it.
function chromeScrollIntent(previous, next, { atTop = false, canScroll = true } = {}) {
  if (!canScroll || atTop) return "expand";
  const delta = next - previous;
  if (delta > 10) return "collapse";
  if (delta < -10) return "expand";
  return null;
}

function deviceChromeCss() {
  const icon = (name) => `[data-deck-chrome] [data-act="${name}"]::before{content:"" !important;display:block !important;width:16px !important;height:16px !important;background:#1c1c1e !important;${mask(ICON[name])}}`;
  return `
[data-deck-chrome]{all:initial !important;position:fixed !important;inset:0 !important;z-index:2147483646 !important;pointer-events:none !important;color:#1c1c1e !important;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;}
html,body,*{scrollbar-width:none !important;}
*::-webkit-scrollbar{width:0 !important;height:0 !important;display:none !important;}
[data-deck-chrome] [data-toolbar]{position:fixed !important;display:flex !important;align-items:center !important;gap:8px !important;pointer-events:none !important;z-index:2147483646 !important;box-sizing:border-box !important;transition:transform 480ms cubic-bezier(0.32,0.72,0,1),bottom 480ms cubic-bezier(0.32,0.72,0,1),height 480ms cubic-bezier(0.32,0.72,0,1) !important;}
[data-deck-chrome][data-edge="bottom"] [data-toolbar]{left:8px !important;right:8px !important;bottom:14px !important;height:48px !important;transform:translateY(0) !important;}
[data-deck-chrome][data-edge="bottom"][data-collapsed="true"] [data-toolbar]{transform:translateY(20px) !important;bottom:7px !important;}
[data-deck-chrome][data-edge="bottom"][data-landscape="true"] [data-toolbar]{bottom:8px !important;height:40px !important;}
[data-deck-chrome][data-edge="bottom"][data-landscape="true"][data-collapsed="true"] [data-toolbar]{transform:translateY(14px) !important;bottom:4px !important;}
[data-deck-chrome][data-edge="top"] [data-toolbar]{top:0 !important;left:0 !important;right:0 !important;height:52px !important;padding:0 10px !important;transform:translateY(0) !important;background:rgba(246,246,247,.92) !important;border-bottom:.5px solid rgba(0,0,0,.12) !important;-webkit-backdrop-filter:blur(18px) saturate(1.4) !important;backdrop-filter:blur(18px) saturate(1.4) !important;}
[data-deck-chrome][data-edge="top"][data-kind="chrome"] [data-toolbar]{height:56px !important;background:rgba(255,255,255,.94) !important;}
[data-deck-chrome][data-edge="top"][data-collapsed="true"] [data-toolbar]{transform:translateY(-110%) !important;}
[data-deck-chrome] [data-act]{pointer-events:auto !important;appearance:none !important;border:0 !important;margin:0 !important;padding:0 !important;display:flex !important;align-items:center !important;justify-content:center !important;gap:6px !important;min-width:0 !important;box-sizing:border-box !important;cursor:pointer !important;color:#1c1c1e !important;background:rgba(255,255,255,.78) !important;box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 .5px rgba(0,0,0,.08) !important;-webkit-backdrop-filter:blur(18px) saturate(1.4) !important;backdrop-filter:blur(18px) saturate(1.4) !important;font:600 15px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;transition:width 420ms cubic-bezier(0.32,0.72,0,1),height 420ms cubic-bezier(0.32,0.72,0,1),opacity 280ms ease,flex-basis 420ms cubic-bezier(0.32,0.72,0,1),border-radius 420ms cubic-bezier(0.32,0.72,0,1) !important;}
[data-deck-chrome] [data-act="aa"],[data-deck-chrome] [data-act="reload"],[data-deck-chrome] [data-act="back"],[data-deck-chrome] [data-act="forward"]{width:36px !important;height:36px !important;flex:0 0 36px !important;border-radius:999px !important;overflow:hidden !important;}
[data-deck-chrome] [data-act="address"]{flex:1 1 auto !important;height:40px !important;border-radius:13px !important;padding:0 14px !important;}
[data-deck-chrome][data-edge="bottom"][data-collapsed="true"] [data-act="aa"],[data-deck-chrome][data-edge="bottom"][data-collapsed="true"] [data-act="reload"]{flex-basis:0 !important;width:0 !important;opacity:0 !important;pointer-events:none !important;box-shadow:none !important;}
[data-deck-chrome][data-edge="bottom"][data-collapsed="true"] [data-act="address"]{height:30px !important;border-radius:999px !important;}
[data-deck-chrome][data-edge="top"] [data-act="back"],[data-deck-chrome][data-edge="top"] [data-act="forward"],[data-deck-chrome][data-edge="top"] [data-act="reload"],[data-deck-chrome][data-edge="top"] [data-act="aa"]{background:transparent !important;box-shadow:none !important;width:32px !important;height:32px !important;flex-basis:32px !important;}
[data-deck-chrome][data-edge="top"] [data-act="address"]{height:34px !important;border-radius:10px !important;background:rgba(0,0,0,.06) !important;box-shadow:none !important;}
[data-deck-chrome][data-kind="chrome"] [data-act="address"]{border-radius:999px !important;background:rgba(0,0,0,.06) !important;}
[data-deck-chrome][data-edge="bottom"] [data-act="back"],[data-deck-chrome][data-edge="bottom"] [data-act="forward"]{display:none !important;}
[data-deck-chrome][data-kind="safari"][data-edge="top"] [data-act="aa"],[data-deck-chrome][data-kind="safari"][data-edge="top"] [data-act="reload"]{display:none !important;}
[data-deck-chrome][data-kind="chrome"] [data-act="aa"],[data-deck-chrome][data-kind="chrome"] [data-act="forward"]{display:none !important;}
[data-deck-chrome] [data-host]{min-width:0 !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important;font:600 15px/1.1 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;color:#1c1c1e !important;}
[data-deck-chrome] [data-lock]{flex:0 0 12px !important;width:12px !important;height:12px !important;background:#8e8e93 !important;${mask(ICON.lock)}}
[data-deck-chrome] [data-home]{position:fixed !important;left:50% !important;bottom:6px !important;width:34% !important;height:5px !important;transform:translateX(-50%) !important;border-radius:99px !important;background:rgba(0,0,0,.82) !important;pointer-events:none !important;}
[data-deck-chrome][data-home="false"] [data-home]{display:none !important;}
[data-deck-chrome] [data-bar]{position:fixed !important;border-radius:99px !important;background:rgba(120,120,128,.72) !important;box-shadow:0 0 0 .5px rgba(255,255,255,.35) !important;opacity:0 !important;pointer-events:none !important;z-index:2147483646 !important;transition:opacity 500ms ease !important;}
[data-deck-chrome] [data-bar="v"]{width:3px !important;}
[data-deck-chrome] [data-bar="h"]{height:3px !important;}
[data-deck-chrome] [data-bar].is-on{opacity:1 !important;}
${icon("back")}
${icon("forward")}
${icon("reload")}
[data-deck-chrome][data-dark="true"]{color:#f2f2f7 !important;}
[data-deck-chrome][data-dark="true"] [data-act]{color:#f2f2f7 !important;background:rgba(44,44,46,.78) !important;box-shadow:0 1px 2px rgba(0,0,0,.35),0 0 0 .5px rgba(255,255,255,.08) !important;}
[data-deck-chrome][data-dark="true"] [data-act]::before{background:#f2f2f7 !important;}
[data-deck-chrome][data-dark="true"] [data-host]{color:#f2f2f7 !important;}
[data-deck-chrome][data-dark="true"] [data-lock]{background:#aeaeb2 !important;}
[data-deck-chrome][data-dark="true"] [data-home]{background:rgba(255,255,255,.88) !important;}
[data-deck-chrome][data-dark="true"][data-edge="top"] [data-toolbar]{background:rgba(28,28,30,.92) !important;border-bottom-color:rgba(255,255,255,.12) !important;}
[data-deck-chrome][data-dark="true"][data-edge="top"] [data-act="back"],[data-deck-chrome][data-dark="true"][data-edge="top"] [data-act="forward"],[data-deck-chrome][data-dark="true"][data-edge="top"] [data-act="reload"]{background:transparent !important;box-shadow:none !important;}
[data-deck-chrome][data-dark="true"][data-edge="top"] [data-act="address"],[data-deck-chrome][data-dark="true"][data-kind="chrome"] [data-act="address"]{background:rgba(255,255,255,.12) !important;box-shadow:none !important;}
@media (prefers-reduced-motion:reduce){[data-deck-chrome] [data-toolbar],[data-deck-chrome] [data-act],[data-deck-chrome] [data-bar]{transition:none !important;}}
`.replace(/\n/g, "");
}

module.exports = { ICON, chromeAppearance, chromeScrollIntent, deviceChromeCss, hostOf };
