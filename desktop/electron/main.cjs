const { app, BrowserWindow, WebContentsView, Menu, ipcMain, dialog, session, shell, net } = require("electron");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { matchCommand, COMMAND_ACCELERATORS } = require("./commands.cjs");
const { createUpdater } = require("./updates.cjs");
const { migrateStore, applyStorePatch } = require("./store.cjs");
const { loadWindowStates, saveWindowStates, frameOf, cascadeFrom, DEFAULT_SIZE } = require("./window-state.cjs");
const { normalizeCatalog, mergeCatalogs } = require("./devices.cjs");
const { chromeAppearance, deviceChromeCss } = require("./device-chrome.cjs");
const {
  desktopIdentity, deviceIdentity, isSignInPage, signInVariant, clientHintHeaders, acceptedHints, withIdentity, acceptLanguages,
} = require("./identity.cjs");

const DEV_URL = process.env.DECK_DEV_URL;
const SITE_URL = "https://ai-window-deck.vercel.app/mac";
const DEVICES_URL = "https://ai-window-deck.vercel.app/devices.json";
const DEVICES_RECHECK_MS = 12 * 60 * 60 * 1000;
const ISSUES_URL = "https://github.com/takaoumehara/ai-window-deck/issues";
const PARTITION = "persist:deck";
const isMac = process.platform === "darwin";
// Native window and view backgrounds can't read CSS variables; this mirrors --cie-ink.
const CIE_INK = "#0b0b0b";

let store = null;
let quitting = false;
let updater = null;
let lastUpdateState = null;
let lastFocusedShell = null;
// One entry per deck window, keyed by its shell renderer's webContents id:
// { win, id, setId, overlayOpen, transitioning,
//   panes: Map<paneId, { urls, activeTab, bounds, visible, views: Map<tabIndex, WebContentsView> }> }
// overlayOpen and transitioning hide the live pages while a sheet is open or
// while panes animate as still snapshots, so pages never re-layout frame by frame.
const shells = new Map();

const storePath = () => path.join(app.getPath("userData"), "deck.json");

async function readStore() {
  try {
    return JSON.parse(await fs.readFile(storePath(), "utf8"));
  } catch {
    return null;
  }
}

// Saves arrive in bursts; chaining them keeps two writes off the same temp file.
let pendingWrite = Promise.resolve();
function writeStore(data) {
  const target = storePath();
  const temp = `${target}.tmp`;
  const text = JSON.stringify(data, null, 2);
  pendingWrite = pendingWrite
    .catch(() => {})
    .then(async () => {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(temp, text);
      await fs.rename(temp, target);
    });
  return pendingWrite;
}

let browser = null;
let languages = "";
// Per page web contents (by id): the identity it presents away from Google's
// sign-in page, and the one it presents right now.
const baseIdentities = new Map();
const identities = new Map();
const hintCache = new WeakMap();
// Origin → UA client hints it asked for with Accept-CH, as Chrome remembers them.
const acceptedByOrigin = new Map();

function hintsOf(identity) {
  if (!hintCache.has(identity)) hintCache.set(identity, clientHintHeaders(identity.metadata));
  return hintCache.get(identity);
}

const originOf = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

function setUpBrowserIdentity() {
  browser = desktopIdentity({
    chromeVersion: process.versions.chrome,
    platform: process.platform,
    arch: process.arch,
    systemVersion: process.getSystemVersion?.() || os.release(),
  });
  languages = acceptLanguages(app.getPreferredSystemLanguages?.() ?? [app.getLocale()]);
  app.userAgentFallback = browser.userAgent;
  for (const target of [session.defaultSession, session.fromPartition(PARTITION)]) {
    target.setUserAgent(browser.userAgent, languages);
    target.webRequest.onHeadersReceived((details, callback) => {
      const name = Object.keys(details.responseHeaders ?? {}).find((key) => key.toLowerCase() === "accept-ch");
      const origin = name && (details.resourceType === "mainFrame" || details.resourceType === "subFrame") && originOf(details.url);
      if (origin) acceptedByOrigin.set(origin, acceptedHints(details.responseHeaders[name]));
      callback({});
    });
    target.webRequest.onBeforeSendHeaders((details, callback) => {
      // Electron crashes when the headers of the main process's own fetches
      // (favicons) are changed across a redirect; those have no page.
      if (details.webContentsId == null) {
        callback({});
        return;
      }
      const identity = identities.get(details.webContentsId) ?? browser;
      const requestHeaders = withIdentity(details.url, details.requestHeaders, {
        userAgent: identity.userAgent,
        hints: hintsOf(identity),
        accepted: acceptedByOrigin.get(originOf(details.url)),
      });
      callback(requestHeaders ? { requestHeaders } : {});
    });
  }
}

// The session's user agent doesn't reach navigator.userAgentData, which
// still names only Chromium. A DevTools override per page sets everything
// together (no DevTools UI is attached, and navigator.webdriver stays false).
// It applies from the next navigation, so it is sent as a page's contents
// are created and again as a navigation starts or redirects.
function applyIdentity(contents, identity) {
  if (contents.isDestroyed() || identities.get(contents.id) === identity) return;
  identities.set(contents.id, identity);
  contents.setUserAgent(identity.userAgent);
  try {
    if (!contents.debugger.isAttached()) contents.debugger.attach("1.3");
    contents.debugger.sendCommand("Emulation.setUserAgentOverride", {
      userAgent: identity.userAgent,
      acceptLanguage: languages,
      platform: identity.platform,
      ...(identity.metadata ? { userAgentMetadata: identity.metadata } : {}),
    }).catch(() => {});
  } catch {
    // Already debugged elsewhere; the session-wide identity still applies.
  }
}

function identityFor(contents, url) {
  const base = baseIdentities.get(contents.id) ?? browser;
  return isSignInPage(url) ? signInVariant(base) : base;
}

// Every page and sign-in popup, as soon as its contents exist.
function presentPage(contents) {
  const { id } = contents;
  baseIdentities.set(id, browser);
  applyIdentity(contents, browser);
  const follow = (details) => {
    if (details.isMainFrame && !details.isSameDocument) applyIdentity(contents, identityFor(contents, details.url));
  };
  contents.on("did-start-navigation", follow);
  contents.on("did-redirect-navigation", follow);
  contents.once("destroyed", () => {
    baseIdentities.delete(id);
    identities.delete(id);
  });
}

let devices = normalizeCatalog(require("./devices.json"));
const devicesPath = () => path.join(app.getPath("userData"), "devices.json");

let devicesReady = null;

// The last catalog fetched from the website, then a fresh one; whichever is
// newer than the copy shipped with the app wins.
function loadDevices() {
  devicesReady = fs.readFile(devicesPath(), "utf8")
    .then((text) => {
      devices = mergeCatalogs(normalizeCatalog(JSON.parse(text)), devices);
    })
    .catch(() => {});
  devicesReady.then(refreshDevices);
  setInterval(refreshDevices, DEVICES_RECHECK_MS);
}

async function refreshDevices() {
  try {
    const response = await net.fetch(DEVICES_URL, { cache: "no-cache", signal: AbortSignal.timeout(15000) });
    const remote = response.ok ? normalizeCatalog(await response.json()) : null;
    if (!remote) return;
    await fs.writeFile(devicesPath(), JSON.stringify(remote));
    const next = mergeCatalogs(remote, devices);
    if (JSON.stringify(next) === JSON.stringify(devices)) return;
    devices = next;
    broadcast("devices:changed", devices);
  } catch {
    // Offline or the site is down; the catalog in hand stays.
  }
}

const deviceKey = (device) => (device ? `${device.id}:${device.ua}:${device.width}x${device.height}@${device.dpr}` : "");

// Chrome DevTools' device mode on one page: the device's user agent and
// client hints here, its viewport, pixel ratio, orientation and touch in
// emulateDevice, drawn at `scale` to fit the pane. Null restores the desktop.
function presentDevice(view, device) {
  const contents = view.webContents;
  const key = deviceKey(device);
  if (contents.isDestroyed() || view.deviceKey === key) return;
  view.deviceKey = key;
  const identity = device ? deviceIdentity(device, { chromeVersion: process.versions.chrome }) : browser;
  baseIdentities.set(contents.id, identity);
  applyIdentity(contents, identityFor(contents, contents.getURL()));
}

// A metrics override crashes a page that has never navigated, so a new tab
// gets only its identity before loading and the rest once loading has begun.
function emulateDevice(view, device, scale = 1) {
  const contents = view.webContents;
  if (contents.isDestroyed()) return;
  presentDevice(view, device);
  const touchKey = device ? view.deviceKey : "";
  const metrics = device ? `${touchKey}:${device.landscape}:${scale.toFixed(4)}` : "";
  if ((view.deviceMetrics ?? "") === metrics) return;
  const touchChanged = (view.deviceTouch ?? "") !== touchKey;
  view.deviceMetrics = metrics;
  view.deviceTouch = touchKey;
  const send = (method, params) => contents.debugger.sendCommand(method, params).catch(() => {});
  try {
    if (!contents.debugger.isAttached()) contents.debugger.attach("1.3");
  } catch {
    return;
  }
  if (!device) {
    send("Emulation.clearDeviceMetricsOverride");
    send("Emulation.setTouchEmulationEnabled", { enabled: false });
    send("Emulation.setEmitTouchEventsForMouse", { enabled: false });
    return;
  }
  const width = device.landscape ? device.height : device.width;
  const height = device.landscape ? device.width : device.height;
  send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: device.dpr,
    mobile: true,
    scale,
    screenWidth: width,
    screenHeight: height,
    screenOrientation: device.landscape ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 },
  });
  if (touchChanged) {
    send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    send("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" });
  }
}

// The scale that fits the device's viewport into the pane's screen box.
function deviceScale(pane) {
  const { device, bounds } = pane;
  if (!device || !bounds.width) return 1;
  return Math.max(0.05, bounds.width / (device.landscape ? device.height : device.width));
}

const DEVICE_CHROME_CSS = deviceChromeCss();

// One device per tab. Older shells sent a single pane device, which still
// applies to every tab.
function tabDeviceList(next) {
  const urls = Array.isArray(next.urls) ? next.urls : [];
  if (Array.isArray(next.tabDevices)) return urls.map((_, index) => next.tabDevices[index] ?? null);
  const shared = next.device ?? null;
  return urls.map(() => shared);
}

function locateView(contents) {
  for (const target of shells.values()) {
    for (const [paneId, pane] of target.panes) {
      for (const [tabIndex, view] of pane.views) {
        if (view.webContents === contents) return { target, paneId, tabIndex, view };
      }
    }
  }
  return null;
}

// The bar and the fading scrollbar live in the page, styled by insertCSS so a
// site's content policy can't remove them. Navigation clears inserted CSS.
async function showDeviceChrome(view, device, labels) {
  const contents = view.webContents;
  if (contents.isDestroyed()) return;
  const appearance = chromeAppearance(device);
  const send = () => {
    if (contents.isDestroyed()) return;
    contents.send("device-chrome:set", appearance ? {
      ...appearance,
      landscape: Boolean(device.landscape),
      url: contents.getURL(),
      labels: labels || {},
    } : null);
  };
  if (!appearance) {
    if (view.chromeCss) contents.removeInsertedCSS(view.chromeCss).catch(() => {});
    view.chromeCss = null;
    send();
    return;
  }
  if (!view.chromeCss && !view.chromeInserting) {
    view.chromeInserting = true;
    const generation = view.chromeGeneration || 0;
    try {
      const key = await contents.insertCSS(DEVICE_CHROME_CSS);
      if (!contents.isDestroyed() && (view.chromeGeneration || 0) === generation) view.chromeCss = key;
      else if (!contents.isDestroyed()) contents.removeInsertedCSS(key).catch(() => {});
    } catch {
      // The bar is still built; it just won't pick up the stylesheet.
    }
    view.chromeInserting = false;
  }
  send();
}

function sendTo(target, channel, payload) {
  if (target && !target.win.isDestroyed()) target.win.webContents.send(channel, payload);
}

function broadcast(channel, payload) {
  for (const target of shells.values()) sendTo(target, channel, payload);
}

const shellOf = (sender) => shells.get(sender.id);

// OAuth popups are windows too, so the last deck window that had focus stands in.
function focusedShell() {
  const focused = BrowserWindow.getFocusedWindow();
  return [...shells.values()].find((candidate) => candidate.win === focused) ?? lastFocusedShell ?? shells.values().next().value;
}

function openSetIds(except) {
  return [...shells.values()].filter((candidate) => candidate !== except && candidate.setId).map((candidate) => candidate.setId);
}

function notifyOpenSets() {
  for (const target of shells.values()) sendTo(target, "store:open-sets", openSetIds(target));
}

function saveStates() {
  const open = [...shells.values()].filter((candidate) => !candidate.win.isDestroyed());
  if (!open.length) return;
  saveWindowStates(open.map((candidate) => ({ setId: candidate.setId, ...frameOf(candidate.win) })));
}

let saveTimer = null;
function scheduleSaveStates() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveStates, 400);
}

function runCommand(target, command) {
  if (command === "new-window") openDeckWindow(target);
  else sendTo(target, "deck:command", command);
}

function interceptCommands(webContents, target) {
  webContents.on("before-input-event", (event, input) => {
    // On Windows and Linux, releasing Alt opens the menu bar, which then eats the
    // next shortcut. After an Alt combination (ours or the deck's own, like
    // Alt+↑/↓ to reorder), that release is swallowed.
    if (!isMac && input.type === "keyUp" && input.key === "Alt" && target.swallowAltUp) {
      target.swallowAltUp = false;
      event.preventDefault();
      return;
    }
    if (input.type === "keyDown" && input.alt && input.key !== "Alt") target.swallowAltUp = true;
    const command = matchCommand(input);
    if (!command) return;
    event.preventDefault();
    runCommand(target, command);
  });
}

function tabIndexOf(target, paneId, view) {
  for (const [tabIndex, candidate] of target.panes.get(paneId)?.views ?? []) {
    if (candidate === view) return tabIndex;
  }
  return -1;
}

function createTabView(target, paneId, url, device = null) {
  const view = new WebContentsView({
    webPreferences: {
      partition: PARTITION,
      sandbox: true,
      contextIsolation: true,
      preload: path.join(__dirname, "pane-preload.cjs"),
    },
  });
  view.setBackgroundColor(CIE_INK);
  const contents = view.webContents;
  interceptCommands(contents, target);
  const send = (channel, payload) => sendTo(target, channel, payload);

  contents.setWindowOpenHandler(({ url: link, disposition }) => {
    // Popups that ask for a window (OAuth sign-in) open as real windows on the
    // same session; plain "open in new tab" links stay inside the pane.
    if (disposition === "new-window") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          backgroundColor: CIE_INK,
          webPreferences: { partition: PARTITION, sandbox: true, contextIsolation: true },
        },
      };
    }
    if (/^https?:/i.test(link)) contents.loadURL(link);
    else shell.openExternal(link);
    return { action: "deny" };
  });
  // A new view takes keyboard focus when its first page loads. Unless the deck
  // asked for this view, focus goes back to where it was (so ⌘Z after an undo
  // that brought a pane back still reaches the deck).
  const focusedBefore = target.focused;
  let settling = true;
  const settle = () => setTimeout(() => {
    settling = false;
  }, FOCUS_SETTLE_MS);
  contents.on("input-event", (_event, input) => {
    if (input.type === "mouseDown") view.focusRequested = true;
  });
  contents.once("did-stop-loading", settle);
  contents.once("did-fail-load", settle);
  contents.on("focus", () => {
    if (settling && !view.focusRequested && focusedBefore && !focusedBefore.isDestroyed() && focusedBefore !== contents) {
      setTimeout(() => !focusedBefore.isDestroyed() && focusedBefore.focus(), 0);
      return;
    }
    target.focused = contents;
    send("pane:focused", { paneId });
  });
  // Tabs shift position when one is closed, so the index is looked up per report.
  const report = () => {
    const tabIndex = tabIndexOf(target, paneId, view);
    if (tabIndex < 0 || contents.isDestroyed()) return;
    send("pane:state", {
      paneId,
      tabIndex,
      title: contents.getTitle(),
      url: contents.getURL(),
      loading: contents.isLoading(),
      canGoBack: contents.navigationHistory.canGoBack(),
      canGoForward: contents.navigationHistory.canGoForward(),
      zoom: contents.getZoomFactor(),
      favicon: view.favicon || null,
    });
  };
  view.report = report;
  contents.on("page-favicon-updated", (_event, icons) => {
    const icon = icons.find((candidate) => /^(https?|data):/i.test(candidate)) || null;
    view.favicon = icon;
    report();
    if (!icon || icon.startsWith("data:")) return;
    faviconData(icon).then((data) => {
      if (!data || view.favicon !== icon) return;
      view.favicon = data;
      report();
    });
  });
  contents.on("page-title-updated", report);
  contents.on("did-start-loading", report);
  contents.on("did-stop-loading", report);
  contents.on("did-navigate", report);
  contents.on("did-navigate-in-page", report);
  contents.on("did-fail-load", (_event, code, description, failedUrl, isMainFrame) => {
    const tabIndex = tabIndexOf(target, paneId, view);
    if (isMainFrame && code !== -3 && tabIndex >= 0) send("pane:error", { paneId, tabIndex, description, url: failedUrl });
  });
  contents.on("found-in-page", (_event, result) => {
    if (result.finalUpdate) send("pane:found", { paneId, active: result.activeMatchOrdinal, matches: result.matches });
  });

  view.boundDevice = device ?? null;
  if (device) presentDevice(view, device);
  const pushChrome = () => {
    const tabIndex = tabIndexOf(target, paneId, view);
    const current = target.panes.get(paneId)?.tabDevices?.[tabIndex] ?? view.boundDevice ?? null;
    showDeviceChrome(view, current, target.chromeLabels);
  };
  contents.on("did-start-navigation", (_event, _url, isInPlace, isMainFrame) => {
    if (!isMainFrame || isInPlace) return;
    view.chromeGeneration = (view.chromeGeneration || 0) + 1;
    view.chromeCss = null;
    view.chromeInserting = false;
  });
  contents.on("dom-ready", pushChrome);
  contents.on("did-navigate-in-page", pushChrome);
  contents.loadURL(url).catch(() => {});
  target.win.contentView.addChildView(view);
  return view;
}

// The shell can't always load a page's icon itself (sites behind bot checks
// refuse a request without the page's cookies), so it is fetched on the pages'
// session and handed over as a data URL.
const FAVICON_MAX_BYTES = 256 * 1024;
const faviconCache = new Map();
function faviconData(url) {
  if (!faviconCache.has(url)) {
    faviconCache.set(url, (async () => {
      try {
        const response = await session.fromPartition(PARTITION).fetch(url);
        const type = response.headers.get("content-type") || "";
        if (!response.ok || !type.startsWith("image/")) return null;
        const bytes = Buffer.from(await response.arrayBuffer());
        return bytes.length > FAVICON_MAX_BYTES ? null : `data:${type};base64,${bytes.toString("base64")}`;
      } catch {
        return null;
      }
    })());
  }
  return faviconCache.get(url);
}

const FOCUS_SETTLE_MS = 400;

function focusView(target, paneId) {
  const pane = target?.panes.get(paneId);
  const view = pane?.views.get(pane.activeTab);
  if (!view || view.webContents.isDestroyed()) return;
  view.focusRequested = true;
  view.webContents.focus();
}

function destroyView(target, view) {
  if (!target.win.isDestroyed()) target.win.contentView.removeChildView(view);
  if (!view.webContents.isDestroyed()) view.webContents.close();
}

function applyPane(target, paneId) {
  const pane = target.panes.get(paneId);
  if (!pane) return;
  const { x, y, width, height, radius = 0 } = pane.bounds;
  const showable = pane.visible && !target.overlayOpen && !target.transitioning && width > 1 && height > 1;
  for (const [tabIndex, view] of pane.views) {
    const shown = showable && tabIndex === pane.activeTab;
    view.setVisible(shown);
    view.shown = shown;
    if (!shown) continue;
    view.setBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });
    view.setBorderRadius?.(Math.round(radius));
    if (pane.device || view.deviceKey) emulateDevice(view, pane.device, deviceScale(pane));
  }
}

function applyAll(target) {
  for (const paneId of target.panes.keys()) applyPane(target, paneId);
}

function syncPanes(target, nextPanes) {
  const { panes } = target;
  const seen = new Set();
  for (const next of nextPanes) {
    seen.add(next.id);
    let pane = panes.get(next.id);
    if (!pane) {
      pane = { urls: [], activeTab: 0, bounds: { x: 0, y: 0, width: 0, height: 0 }, visible: false, device: null, views: new Map() };
      panes.set(next.id, pane);
    }
    // Live pages follow their URL to its new position (tabs opened, closed or
    // reordered); only a tab whose URL is gone from the list is torn down.
    const pool = new Map();
    for (const [tabIndex, view] of pane.views) {
      const url = pane.urls[tabIndex];
      if (!pool.has(url)) pool.set(url, []);
      pool.get(url).push(view);
    }
    const views = new Map();
    next.urls.forEach((url, tabIndex) => {
      const reused = pool.get(url)?.shift();
      if (reused) views.set(tabIndex, reused);
    });
    for (const leftovers of pool.values()) leftovers.forEach((view) => destroyView(target, view));
    const moved = [...views].some(([tabIndex, view]) => pane.views.get(tabIndex) !== view);
    pane.views = views;
    pane.urls = next.urls;
    pane.tabDevices = tabDeviceList(next);
    pane.activeTab = Math.min(next.activeTab ?? 0, Math.max(0, next.urls.length - 1));
    pane.device = pane.tabDevices[pane.activeTab] ?? null;
    pane.visible = next.visible;
    if (next.bounds) pane.bounds = next.bounds;
    const url = pane.urls[pane.activeTab];
    if (url && !pane.views.has(pane.activeTab)) {
      pane.views.set(pane.activeTab, createTabView(target, next.id, url, pane.device));
    }
    if (moved) for (const view of pane.views.values()) view.report?.();
    // A new device (or leaving the preview) reloads that tab, so servers that
    // pick a layout by user agent send the right one. Rotating doesn't, and a
    // tab that isn't showing waits until it comes forward, at the right size.
    for (const [tabIndex, view] of pane.views) {
      const nextDevice = pane.tabDevices[tabIndex] ?? null;
      if (deviceKey(nextDevice) !== deviceKey(view.boundDevice)) {
        view.boundDevice = nextDevice;
        view.deviceDirty = true;
      }
      if (tabIndex !== pane.activeTab) continue;
      if (view.deviceDirty) {
        view.deviceDirty = false;
        emulateDevice(view, nextDevice, deviceScale(pane));
        if (view.webContents.getURL()) view.webContents.reload();
      }
      showDeviceChrome(view, nextDevice, target.chromeLabels);
    }
    applyPane(target, next.id);
  }
  for (const [paneId, pane] of panes) {
    if (seen.has(paneId)) continue;
    for (const view of pane.views.values()) destroyView(target, view);
    panes.delete(paneId);
  }
}

function activeContents(target, paneId) {
  const pane = target?.panes.get(paneId);
  return pane?.views.get(pane.activeTab)?.webContents;
}

function buildMenu() {
  const command = (id, label, accelerator = COMMAND_ACCELERATORS[id]) => ({
    label,
    accelerator,
    // Keys are matched in before-input-event so they also work while a page has focus.
    registerAccelerator: false,
    click: () => runCommand(focusedShell(), id),
  });
  const checkForUpdates = { label: "Check for Updates…", click: () => updater?.check(true) };
  const settings = command("open-settings", isMac ? "Settings…" : "Settings");
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: "about" },
            checkForUpdates,
            { type: "separator" },
            settings,
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        }]
      : []),
    {
      label: "File",
      submenu: [
        command("new-window", "New Deck Window"),
        command("tab-new", "New Tab"),
        command("tab-reopen", "Reopen Closed Tab"),
        command("address-focus", "Open Location…"),
        { type: "separator" },
        command("paste-list", "Paste a List of URLs…", null),
        command("import-backup", "Import from Extension…", null),
        { type: "separator" },
        command("tab-close", "Close Tab"),
        { label: "Close Window", accelerator: "CmdOrCtrl+Shift+W", role: "close" },
        ...(isMac ? [] : [{ type: "separator" }, settings, { type: "separator" }, { role: "quit" }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        // ⌘Z in the deck itself (not in a page or a text field) also does these;
        // the renderer decides, so pages keep their own undo.
        command("deck-undo", "Undo Deck Change", null),
        command("deck-redo", "Redo Deck Change", null),
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "selectAll" },
        { type: "separator" },
        command("find", "Find…"),
      ],
    },
    {
      label: "Deck",
      submenu: [
        command("sets-open", "Sets…"),
        { type: "separator" },
        command("toggle-spotlight", "Spotlight"),
        command("restore-home", "Back to grid"),
        command("toggle-fullscreen", "Fill the deck"),
        { type: "separator" },
        command("focus-next", "Next pane"),
        command("focus-previous", "Previous pane"),
        command("tab-next", "Next tab"),
        command("tab-previous", "Previous tab"),
        { type: "separator" },
        command("toggle-sidebar", "Expand / collapse sidebar"),
      ],
    },
    {
      label: "View",
      submenu: [
        command("page-back", "Back"),
        command("page-forward", "Forward"),
        command("reload-pane", "Reload Page"),
        command("reload-hard", "Hard Reload"),
        { type: "separator" },
        command("zoom-in", "Zoom In"),
        command("zoom-out", "Zoom Out"),
        command("zoom-reset", "Actual Size"),
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(DEV_URL ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        command("open-shortcuts", "Keyboard Shortcuts", null),
        { type: "separator" },
        { label: "AI Window Deck Website", click: () => shell.openExternal(SITE_URL) },
        { label: "Report an Issue", click: () => shell.openExternal(ISSUES_URL) },
        ...(isMac ? [] : [{ type: "separator" }, checkForUpdates, { role: "about" }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createShellWindow({ setId = null, frame = { ...DEFAULT_SIZE } } = {}) {
  const { maximized, ...bounds } = frame;
  const win = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: CIE_INK,
    title: "AI Window Deck",
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: { x: 14, y: 14 },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      // Page views cover most of the shell, which can otherwise read as occluded and
      // stall its CSS transitions mid-way.
      backgroundThrottling: false,
    },
  });
  const target = { win, id: win.webContents.id, setId, panes: new Map(), overlayOpen: false, transitioning: false, focused: null };
  shells.set(target.id, target);
  lastFocusedShell = target;
  notifyOpenSets();

  interceptCommands(win.webContents, target);
  win.once("ready-to-show", () => {
    if (maximized) win.maximize();
    win.show();
  });
  win.on("focus", () => {
    lastFocusedShell = target;
  });
  win.webContents.on("focus", () => {
    target.focused = win.webContents;
  });
  win.on("resize", scheduleSaveStates);
  win.on("move", scheduleSaveStates);
  win.on("close", () => {
    // The last deck window to close is remembered, so it comes back next launch.
    if (!quitting) saveStates();
  });
  win.webContents.on("did-finish-load", () => {
    if (lastUpdateState?.status === "ready") sendTo(target, "update:state", { ...lastUpdateState, manual: false });
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.on("closed", () => {
    for (const pane of target.panes.values()) {
      for (const view of pane.views.values()) if (!view.webContents.isDestroyed()) view.webContents.close();
    }
    target.panes.clear();
    shells.delete(target.id);
    if (lastFocusedShell === target) lastFocusedShell = null;
    if (!quitting) saveStates();
    notifyOpenSets();
  });

  if (DEV_URL) win.loadURL(DEV_URL);
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return target;
}

// A new deck window takes the first set no other window shows. With none
// left, it opens without a set and its renderer starts a new one.
function openDeckWindow(from, setId) {
  const open = new Set(openSetIds());
  const owner = setId && [...shells.values()].find((candidate) => candidate.setId === setId);
  if (owner) {
    owner.win.show();
    owner.win.focus();
    return;
  }
  const chosen = setId ?? store.sets.find((set) => !open.has(set.id))?.id ?? null;
  createShellWindow({ setId: chosen, frame: from ? cascadeFrom(from.win) : loadWindowStates()[0] });
  scheduleSaveStates();
}

function restoreWindows() {
  const saved = loadWindowStates();
  const known = new Set(store.sets.map((set) => set.id));
  const used = new Set();
  const entries = saved.filter((entry) => entry.setId && known.has(entry.setId) && !used.has(entry.setId) && used.add(entry.setId));
  if (!entries.length) entries.push({ ...(saved[0] ?? DEFAULT_SIZE), setId: store.sets[0]?.id ?? null });
  for (const { setId, ...frame } of entries) createShellWindow({ setId, frame });
}

ipcMain.handle("store:load", (event) => {
  const target = shellOf(event.sender);
  return { store, setId: target?.setId ?? null, openSetIds: openSetIds(target) };
});
ipcMain.handle("store:apply", (event, patch) => {
  store = applyStorePatch(store, patch);
  const sender = shellOf(event.sender);
  for (const target of shells.values()) if (target !== sender) sendTo(target, "store:changed", store);
  return writeStore(store);
});
// Each set shows in at most one deck window; asking for one that is already
// open brings that window forward instead.
ipcMain.handle("shell:claim-set", (event, setId) => {
  const target = shellOf(event.sender);
  if (!target) return false;
  const owner = [...shells.values()].find((candidate) => candidate !== target && candidate.setId === setId);
  if (owner) {
    owner.win.show();
    owner.win.focus();
    return false;
  }
  target.setId = setId;
  notifyOpenSets();
  scheduleSaveStates();
  return true;
});
ipcMain.on("shell:open-window", (event, setId) => openDeckWindow(shellOf(event.sender), setId ?? undefined));
ipcMain.handle("devices:list", async () => {
  await devicesReady;
  return devices;
});
ipcMain.handle("app:info", () => ({ platform: process.platform, locale: app.getLocale(), version: app.getVersion() }));
ipcMain.on("update:check", () => updater?.check(true));
ipcMain.on("update:install", () => updater?.install());

ipcMain.on("panes:sync", (event, nextPanes) => {
  const target = shellOf(event.sender);
  if (!target || !Array.isArray(nextPanes)) return;
  if (nextPanes[0]?.chromeLabels) target.chromeLabels = nextPanes[0].chromeLabels;
  syncPanes(target, nextPanes);
});
ipcMain.on("panes:bounds", (event, list) => {
  const target = shellOf(event.sender);
  if (!target) return;
  for (const { id, bounds } of list) {
    const pane = target.panes.get(id);
    if (!pane) continue;
    pane.bounds = bounds;
    applyPane(target, id);
  }
});
ipcMain.on("panes:overlay", (event, open) => {
  const target = shellOf(event.sender);
  if (!target) return;
  target.overlayOpen = Boolean(open);
  applyAll(target);
  // A hidden page keeps keyboard focus, which would leave the sheet deaf to Esc and typing.
  if (target.overlayOpen) target.win.webContents.focus();
});
ipcMain.on("panes:transition", (event, active) => {
  const target = shellOf(event.sender);
  if (!target) return;
  target.transitioning = Boolean(active);
  applyAll(target);
});
ipcMain.handle("panes:snapshot", async (event) => {
  const shots = {};
  const target = shellOf(event.sender);
  if (!target) return shots;
  await Promise.all([...target.panes].map(async ([paneId, pane]) => {
    const view = pane.views.get(pane.activeTab);
    if (!view?.shown || view.webContents.isDestroyed()) return;
    try {
      const image = await view.webContents.capturePage();
      if (image.isEmpty()) return;
      const width = Math.max(1, view.getBounds().width);
      const pixels = Math.min(image.getSize().width, width * 2);
      shots[paneId] = { src: `data:image/jpeg;base64,${image.resize({ width: pixels, quality: "good" }).toJPEG(78).toString("base64")}`, width };
    } catch {
      // A page mid-navigation can refuse a capture; its pane just shows the placeholder.
    }
  }));
  return shots;
});
ipcMain.on("pane:mouse-nav", (event, direction) => {
  const history = event.sender.navigationHistory;
  if (direction === "back" && history.canGoBack()) history.goBack();
  else if (direction === "forward" && history.canGoForward()) history.goForward();
});
ipcMain.on("pane:chrome-action", (event, action) => {
  const contents = event.sender;
  if (action === "back" && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
  else if (action === "forward" && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
  else if (action === "reload") contents.reload();
  else if (action === "address") {
    const found = locateView(contents);
    if (found) sendTo(found.target, "pane:chrome-action", { paneId: found.paneId, action, url: contents.getURL() });
  }
});
ipcMain.on("shell:focus", (event) => event.sender.focus());
ipcMain.on("pane:focus", (event, paneId) => focusView(shellOf(event.sender), paneId));
ipcMain.on("pane:navigate", (event, { paneId, action, url }) => {
  const target = shellOf(event.sender);
  const contents = activeContents(target, paneId);
  if (!contents) return;
  if (action === "back" && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
  else if (action === "forward" && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
  else if (action === "reload") contents.reload();
  else if (action === "reload-hard") contents.reloadIgnoringCache();
  else if (action === "load" && url) contents.loadURL(url).catch(() => {});
  else if (action === "home") {
    const pane = target.panes.get(paneId);
    contents.loadURL(pane.urls[pane.activeTab]).catch(() => {});
  }
});
ipcMain.handle("pane:zoom", (event, { paneId, factor }) => {
  const contents = activeContents(shellOf(event.sender), paneId);
  if (!contents) return null;
  contents.setZoomFactor(factor);
  return contents.getZoomFactor();
});
ipcMain.handle("pane:get-zoom", (event, paneId) => activeContents(shellOf(event.sender), paneId)?.getZoomFactor() ?? 1);
ipcMain.on("pane:find", (event, { paneId, text, forward = true, newSearch = true }) => {
  const contents = activeContents(shellOf(event.sender), paneId);
  if (!contents) return;
  // Electron's findNext means "start a new search session", not "go to the next match".
  if (text) contents.findInPage(text, { forward, findNext: newSearch });
  else contents.stopFindInPage("clearSelection");
});
ipcMain.on("pane:find-stop", (event, paneId) => activeContents(shellOf(event.sender), paneId)?.stopFindInPage("keepSelection"));

ipcMain.handle("backup:import", async (event) => {
  const result = await dialog.showOpenDialog(shellOf(event.sender)?.win, {
    properties: ["openFile"],
    filters: [{ name: "AI Window Deck backup", extensions: ["json", "txt"] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const file = result.filePaths[0];
  return { name: path.basename(file), text: await fs.readFile(file, "utf8") };
});

// Lets a development copy run beside the installed app, with its own data.
if (process.env.DECK_USER_DATA) app.setPath("userData", process.env.DECK_USER_DATA);
const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.quit();

app.on("second-instance", () => {
  const target = focusedShell();
  if (!target) return;
  if (target.win.isMinimized()) target.win.restore();
  target.win.focus();
});

app.on("web-contents-created", (_event, contents) => {
  if (!browser || contents.session !== session.fromPartition(PARTITION)) return;
  presentPage(contents);
});

app.setAboutPanelOptions({
  applicationName: "AI Window Deck",
  applicationVersion: app.getVersion(),
  copyright: "© 2026 Takao Umehara / creativity is everywhere",
  website: SITE_URL,
});

app.whenReady().then(async () => {
  if (!isPrimaryInstance) return;
  setUpBrowserIdentity();
  loadDevices();
  store = migrateStore(await readStore());
  buildMenu();
  restoreWindows();
  updater = createUpdater((state) => {
    lastUpdateState = state;
    broadcast("update:state", state);
  });
  updater.check(false);
  app.on("activate", () => {
    if (shells.size === 0) openDeckWindow(null);
  });
});

app.on("before-quit", () => {
  saveStates();
  quitting = true;
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
