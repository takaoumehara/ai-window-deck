const { app, BrowserWindow, WebContentsView, Menu, ipcMain, dialog, session, shell, net } = require("electron");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { matchCommand, COMMAND_ACCELERATORS } = require("./commands.cjs");
const { createUpdater } = require("./updates.cjs");
const { migrateStore, applyStorePatch } = require("./store.cjs");
const { loadWindowStates, saveWindowStates, frameOf, cascadeFrom, DEFAULT_SIZE } = require("./window-state.cjs");
const { normalizeCatalog, mergeCatalogs } = require("./devices.cjs");
const {
  desktopIdentity, deviceIdentity, isSignInPage, signInVariant, clientHintHeaders, acceptedHints, withIdentity, acceptLanguages,
} = require("./identity.cjs");
const google = require("./google-signin.cjs");
const popups = require("./popups.cjs");

const DEV_URL = process.env.DECK_DEV_URL;
const SITE_URL = "https://ai-window-deck.vercel.app/mac";
const DEVICES_URL = "https://ai-window-deck.vercel.app/devices.json";
const DEVICES_RECHECK_MS = 12 * 60 * 60 * 1000;
const ISSUES_URL = "https://github.com/takaoumehara/ai-window-deck/issues";
const PARTITION = "persist:deck";
const isMac = process.platform === "darwin";
// Native window and view backgrounds can't read CSS variables; this mirrors --cie-ink.
const CIE_INK = "#0b0b0b";
// After a sign-in popup closes, how long its opener gets to react by itself.
const POPUP_SETTLE_MS = 1500;

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

// Popups opened for a Google sign-in keep the sign-in identity for their
// whole life, so the hops between Google's hosts all see one browser.
const signInPopups = new Set();

function identityFor(contents, url) {
  const base = baseIdentities.get(contents.id) ?? browser;
  return signInPopups.has(contents.id) || isSignInPage(url) ? signInVariant(base) : base;
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
    signInPopups.delete(id);
  });
}

// Google's sign-in pages run in a window of their own rather than in a pane:
// a top-level window on the same session, with no DevTools override attached,
// presenting one identity from its first request to its last. When the flow
// leaves Google's sign-in hosts, that next URL (the page that asked, or an
// OAuth callback whose code must only be used once) loads in the pane
// instead. If Google rejects the browser, the next identity is tried.
let signInWindow = null;
let creatingSignInWindow = false;

function signInIdentity(strategy) {
  if (strategy === "firefox") return google.firefoxIdentity({ chromeVersion: process.versions.chrome, platform: process.platform });
  return signInVariant(browser);
}

// `into` is another sign-in window that handed Google's pages over and takes
// the result back; without it the result loads in the pane.
function openSignInWindow(target, paneId, url, strategy = store.settings?.googleSignIn, into = null) {
  if (!google.SIGN_IN_STRATEGIES.includes(strategy)) strategy = google.SIGN_IN_STRATEGIES[0];
  const open = signInWindow && !signInWindow.win.isDestroyed() ? signInWindow : null;
  if (open && open.strategy === strategy) {
    Object.assign(open, { target, paneId, startUrl: url, into });
    open.win.loadURL(url).catch(() => {});
    open.win.show();
    open.win.focus();
    return;
  }
  if (open) {
    open.replaced = true;
    open.win.close();
  }
  const identity = signInIdentity(strategy);
  creatingSignInWindow = true;
  let win;
  try {
    win = new BrowserWindow({
      width: 500,
      height: 720,
      parent: target && !target.win.isDestroyed() ? target.win : undefined,
      title: "Google",
      backgroundColor: "#ffffff",
      autoHideMenuBar: true,
      webPreferences: { partition: PARTITION, sandbox: true, contextIsolation: true, preload: path.join(__dirname, "signin-preload.cjs") },
    });
  } finally {
    creatingSignInWindow = false;
  }
  const contents = win.webContents;
  const state = { win, target, paneId, strategy, startUrl: url, into, done: false, replaced: false };
  signInWindow = state;
  identities.set(contents.id, identity);
  contents.setUserAgent(identity.userAgent);
  interceptCommands(contents, target ?? focusedShell());

  const leave = (event, next, isMainFrame) => {
    if (isMainFrame === false || !/^https?:/i.test(next || "") || google.isSignInFlow(next)) return;
    event.preventDefault();
    state.done = true;
    finishSignIn(state, next);
    win.close();
  };
  contents.on("will-navigate", (event) => leave(event, event.url, event.isMainFrame));
  contents.on("will-redirect", (event) => leave(event, event.url, event.isMainFrame));
  contents.on("did-navigate", (_event, next) => {
    if (!google.isRejected(next)) return;
    const following = google.nextStrategy(state.strategy);
    if (following) openSignInWindow(state.target, state.paneId, state.startUrl, following, state.into);
    else sendTo(state.target, "google:signin", { status: "rejected" });
  });
  contents.setWindowOpenHandler(({ url: link }) => {
    if (/^https?:/i.test(link)) shell.openExternal(link);
    return { action: "deny" };
  });
  win.on("closed", () => {
    identities.delete(contents.id);
    if (signInWindow === state) signInWindow = null;
  });
  contents.loadURL(url).catch(() => {});
}

function finishSignIn(state, next) {
  if (store.settings?.googleSignIn !== state.strategy) {
    store = applyStorePatch(store, { settings: { googleSignIn: state.strategy } });
    writeStore(store);
  }
  const into = state.into && !state.into.isDestroyed() ? state.into : null;
  const contents = into ?? activeContents(state.target, state.paneId);
  if (contents && !contents.isDestroyed()) contents.loadURL(next).catch(() => {});
  if (into) BrowserWindow.fromWebContents(into)?.focus();
  else if (state.target && !state.target.win.isDestroyed()) state.target.win.focus();
}

// File → Sign in to GitHub / Vercel: the provider's sign-in in a window of its
// own on the deck's session (popups.cjs lists the pages it passes through).
// Google's pages inside it move to the Google window and come back. When the
// window reaches the provider's own pages, it closes and the provider's panes
// reload.
const providerWindows = new Map();

function openProviderSignIn(target, id) {
  const provider = popups.signInProvider(id);
  if (!provider) return;
  const open = providerWindows.get(id);
  if (open && !open.isDestroyed()) {
    open.show();
    open.focus();
    return;
  }
  const parent = target && !target.win.isDestroyed() ? target.win : undefined;
  const win = new BrowserWindow({
    width: 520,
    height: 760,
    parent,
    title: provider.name,
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    webPreferences: { partition: PARTITION, sandbox: true, contextIsolation: true, preload: path.join(__dirname, "pane-preload.cjs") },
  });
  providerWindows.set(id, win);
  const contents = win.webContents;
  let sawSignIn = false;
  let finished = false;
  const signedIn = async () => {
    if (!provider.cookie) return true;
    const { url: cookieUrl, name, value } = provider.cookie;
    const list = await contents.session.cookies.get({ url: cookieUrl, name }).catch(() => []);
    return list.some((cookie) => cookie.value === value);
  };
  const check = async (next) => {
    if (finished || !/^https?:/i.test(next || "")) return;
    if (!popups.providerFinished(provider, next)) {
      sawSignIn = true;
      return;
    }
    if (!(await signedIn()) || finished || win.isDestroyed()) return;
    finished = true;
    const reloaded = reloadProviderPages(provider);
    sendTo(target, "signin:status", { provider: id, status: sawSignIn ? "signed-in" : "already", reloaded });
    win.close();
  };
  const toGoogleWindow = (event) => {
    if (event.isMainFrame === false || !google.isSignInPage(event.url)) return;
    event.preventDefault();
    openSignInWindow(target, null, event.url, undefined, contents);
  };
  contents.on("will-navigate", toGoogleWindow);
  contents.on("will-redirect", toGoogleWindow);
  contents.on("did-navigate", (_event, next) => check(next));
  contents.on("did-navigate-in-page", (_event, next, isMainFrame) => isMainFrame && check(next));
  contents.setWindowOpenHandler(popupHandler(target, contents, (link) => contents.loadURL(link).catch(() => {})));
  watchPopups(target, contents);
  win.on("closed", () => {
    if (providerWindows.get(id) === win) providerWindows.delete(id);
  });
  contents.loadURL(provider.start).catch(() => {});
}

function reloadProviderPages(provider) {
  let reloaded = 0;
  for (const target of shells.values()) {
    for (const pane of target.panes.values()) {
      for (const view of pane.views.values()) {
        const contents = view.webContents;
        if (contents.isDestroyed() || contents.isLoading()) continue;
        const url = contents.getURL();
        // A sign-in page may be the result of a form post; a fresh GET doesn't send it again.
        if (popups.waitsOnProvider(provider, url)) contents.loadURL(url).catch(() => {});
        else if (popups.providerFinished(provider, url)) contents.reload();
        else continue;
        reloaded += 1;
      }
    }
  }
  return reloaded;
}

// The SID cookie on .google.com appears when an account signs in and goes
// when the last one signs out. Either way, every Google page in every deck
// window reloads so it shows the new state, not the one it loaded with.
function watchGoogleSession() {
  const { cookies } = session.fromPartition(PARTITION);
  let signedIn = null;
  let timer = null;
  cookies.get({ name: "SID" })
    .then((list) => {
      signedIn = list.some(google.isSessionCookie);
    })
    .catch(() => {
      signedIn = false;
    });
  cookies.on("changed", (_event, cookie, cause, removed) => {
    if (signedIn === null || !google.isSessionCookie(cookie) || (removed && cause === "overwrite")) return;
    if (!removed === signedIn) return;
    signedIn = !removed;
    clearTimeout(timer);
    // A sign-in sets its cookies over several redirects; reload once they've settled.
    timer = setTimeout(() => reloadGooglePages(signedIn), 1200);
  });
}

function reloadGooglePages(signedIn) {
  let reloaded = 0;
  for (const target of shells.values()) {
    for (const pane of target.panes.values()) {
      for (const view of pane.views.values()) {
        const contents = view.webContents;
        if (contents.isDestroyed() || contents.isLoading() || !google.reloadsWithGoogleSession(contents.getURL())) continue;
        contents.reload();
        reloaded += 1;
      }
    }
  }
  broadcast("google:signin", { status: signedIn ? "signed-in" : "signed-out", reloaded });
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

// New windows from a page (popups.cjs decides): sign-in and other popups that
// talk to their opener become real windows on the same session, in front of
// the deck window, with window.opener intact; plain links load in place.
function popupHandler(target, contents, loadInPlace) {
  return ({ url: link, disposition, features }) => {
    const kind = popups.classifyPopup({ url: link, disposition });
    if (kind === "window") {
      const parent = target && !target.win.isDestroyed() ? target.win : undefined;
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          ...popups.popupSize(features, parent ? parent.getBounds() : undefined),
          parent,
          backgroundColor: "#ffffff",
          autoHideMenuBar: true,
          webPreferences: { partition: PARTITION, sandbox: true, contextIsolation: true, preload: path.join(__dirname, "pane-preload.cjs") },
        },
      };
    }
    if (kind === "pane") loadInPlace(link);
    else shell.openExternal(link).catch(() => {});
    return { action: "deny" };
  };
}

// Once a popup has been through a sign-in page and reached the opener's site
// (the OAuth callback), it has done its job. When it closes, an opener that is
// still on the page that opened it reloads, so it shows the new session even
// if it missed the popup's message.
function watchPopups(target, contents) {
  contents.on("did-create-window", (child, { url: link }) => {
    const popup = child.webContents;
    const openerUrl = contents.getURL();
    const visited = [link];
    if (google.isSignInFlow(link)) {
      signInPopups.add(popup.id);
      applyIdentity(popup, identityFor(popup, link));
    }
    popup.setWindowOpenHandler(popupHandler(target, popup, (next) => popup.loadURL(next).catch(() => {})));
    watchPopups(target, popup);
    popup.on("did-navigate", (_event, next) => visited.push(next));
    popup.on("did-redirect-navigation", (details) => details.isMainFrame && visited.push(details.url));
    child.once("closed", () => {
      if (!popups.popupCompleted(visited, openerUrl)) return;
      setTimeout(() => {
        if (contents.isDestroyed() || contents.isLoading() || contents.getURL() !== openerUrl) return;
        contents.reload();
      }, POPUP_SETTLE_MS);
    });
  });
}

function createTabView(target, paneId, url) {
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

  contents.setWindowOpenHandler(popupHandler(target, contents, (link) => contents.loadURL(link).catch(() => {})));
  watchPopups(target, contents);
  // Once the user has clicked or typed in this page, its way into Google's
  // sign-in goes to the sign-in window. A page that redirects there by itself
  // as the deck starts (a saved accounts.google.com tab) doesn't pop one up.
  const toSignInWindow = (event) => {
    if (!event.isMainFrame || !view.interacted || !google.isSignInPage(event.url)) return;
    event.preventDefault();
    openSignInWindow(target, paneId, event.url);
  };
  contents.on("will-navigate", toSignInWindow);
  contents.on("will-redirect", toSignInWindow);
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
    if (/^(mouseDown|rawKeyDown|keyDown|touchStart)$/.test(input.type)) view.interacted = true;
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

  const pane = target.panes.get(paneId);
  if (pane?.device) presentDevice(view, pane.device);
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
    // A new device (or leaving the preview) reloads the pages, so servers
    // that pick a layout by user agent send the right one; rotating doesn't.
    const nextDevice = next.device ?? null;
    const deviceChanged = deviceKey(nextDevice) !== deviceKey(pane.device);
    pane.device = nextDevice;
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
    pane.activeTab = Math.min(next.activeTab ?? 0, Math.max(0, next.urls.length - 1));
    pane.visible = next.visible;
    if (next.bounds) pane.bounds = next.bounds;
    const url = pane.urls[pane.activeTab];
    if (url && !pane.views.has(pane.activeTab)) {
      pane.views.set(pane.activeTab, createTabView(target, next.id, url));
    }
    if (moved) for (const view of pane.views.values()) view.report?.();
    if (deviceChanged) {
      for (const view of pane.views.values()) {
        emulateDevice(view, pane.device, deviceScale(pane));
        if (view.webContents.getURL()) view.webContents.reload();
      }
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
        {
          label: "Sign in to",
          submenu: [
            command("signin-google", "Google…"),
            command("signin-github", "GitHub…"),
            command("signin-vercel", "Vercel…"),
          ],
        },
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
        command("arrange-open", "Arrange Panes…"),
        command("pane-move-earlier", "Move Pane Earlier"),
        command("pane-move-later", "Move Pane Later"),
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
        command("device-toggle", "Mobile Preview"),
        command("device-rotate", "Rotate Device"),
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(DEV_URL ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        command("open-palette", "Find a Feature…"),
        command("show-tips", "Tips"),
        command("open-shortcuts", "Keyboard Shortcuts", null),
        command("ask-ai-claude", "Ask Claude about AI Window Deck"),
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
  // Mouse back / forward buttons on Windows and Linux, and three-finger swipes on macOS.
  win.on("app-command", (_event, name) => {
    if (name !== "browser-backward" && name !== "browser-forward") return;
    if (!claimPageNav()) return;
    runCommand(target, name === "browser-backward" ? "page-back" : "page-forward");
  });
  win.on("swipe", (_event, direction) => {
    if (direction === "right") runCommand(target, "page-back");
    else if (direction === "left") runCommand(target, "page-forward");
  });
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
ipcMain.on("google:signin", (event) => {
  openSignInWindow(shellOf(event.sender) ?? focusedShell(), null, "https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fwww.google.com%2F");
});
ipcMain.on("signin:open", (event, provider) => openProviderSignIn(shellOf(event.sender) ?? focusedShell(), provider));
// A page asked for a passkey or security key (pane-preload.cjs). Electron
// shows no prompt for those, so the deck says what to do instead.
ipcMain.on("pane:passkey", (event) => {
  const showsPage = (candidate) => [...candidate.panes.values()].some((pane) => [...pane.views.values()].some((view) => view.webContents === event.sender));
  const owner = [...shells.values()].find(showsPage) ?? focusedShell();
  sendTo(owner, "pane:passkey", { host: originOf(event.sender.getURL())?.replace(/^https?:\/\//, "") ?? "" });
});
ipcMain.on("update:install", () => updater?.install());

ipcMain.on("panes:sync", (event, nextPanes) => {
  const target = shellOf(event.sender);
  if (target) syncPanes(target, nextPanes);
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
// One press of a mouse's back button can reach both the page under it
// (pane-preload.cjs) and its window (app-command); only the first counts.
let lastPageNav = 0;
function claimPageNav() {
  const now = Date.now();
  if (now - lastPageNav < 300) return false;
  lastPageNav = now;
  return true;
}

function stepPage(contents, direction) {
  const history = contents.navigationHistory;
  if (direction === "back" && history.canGoBack()) history.goBack();
  else if (direction === "forward" && history.canGoForward()) history.goForward();
}
ipcMain.on("pane:mouse-nav", (event, direction) => claimPageNav() && stepPage(event.sender, direction));
ipcMain.on("pane:key-nav", (event, direction) => stepPage(event.sender, direction));
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
  else if (action === "load" && url && google.isSignInPage(url)) openSignInWindow(target, paneId, url);
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
  if (!browser || creatingSignInWindow || contents.session !== session.fromPartition(PARTITION)) return;
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
  watchGoogleSession();
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
