const { app, BrowserWindow, WebContentsView, Menu, ipcMain, dialog, session, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { matchCommand, COMMAND_ACCELERATORS } = require("./commands.cjs");
const { createUpdater } = require("./updates.cjs");
const { loadWindowState, trackWindowState } = require("./window-state.cjs");

const DEV_URL = process.env.DECK_DEV_URL;
const SITE_URL = "https://ai-window-deck.vercel.app/mac";
const ISSUES_URL = "https://github.com/takaoumehara/ai-window-deck/issues";
const PARTITION = "persist:deck";
const isMac = process.platform === "darwin";
// Native window and view backgrounds can't read CSS variables; this mirrors --cie-ink.
const CIE_INK = "#0b0b0b";

let shellWindow = null;
let overlayOpen = false;
// While panes animate, the shell shows still snapshots and the live pages wait
// at their final size, so pages never re-layout frame by frame.
let transitioning = false;
let updater = null;
let lastUpdateState = null;
// paneId -> { urls, activeTab, bounds, visible, views: Map<tabIndex, WebContentsView> }
const panes = new Map();

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

// Google and some other sites refuse sign-in from user agents that name Electron.
function plainChromeUserAgent() {
  return app.userAgentFallback
    .replace(/\sElectron\/\S+/, "")
    .replace(new RegExp(`\\s${app.getName().replace(/\s/g, "")}\\/\\S+`, "i"), "")
    .replace(/\sai-window-deck-desktop\/\S+/i, "");
}

function send(channel, payload) {
  if (shellWindow && !shellWindow.isDestroyed()) shellWindow.webContents.send(channel, payload);
}

// On Windows and Linux, releasing Alt opens the menu bar, which then eats the
// next shortcut. After an Alt shortcut, that release is swallowed.
let swallowAltUp = false;

function interceptCommands(webContents) {
  webContents.on("before-input-event", (event, input) => {
    if (!isMac && input.type === "keyUp" && input.key === "Alt" && swallowAltUp) {
      swallowAltUp = false;
      event.preventDefault();
      return;
    }
    const command = matchCommand(input);
    if (!command) return;
    event.preventDefault();
    if (input.alt) swallowAltUp = true;
    send("deck:command", command);
  });
}

function tabIndexOf(paneId, view) {
  for (const [tabIndex, candidate] of panes.get(paneId)?.views ?? []) {
    if (candidate === view) return tabIndex;
  }
  return -1;
}

function createTabView(paneId, url) {
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
  interceptCommands(contents);

  contents.setWindowOpenHandler(({ url: target, disposition }) => {
    // Popups that ask for a window (OAuth sign-in) open as real windows on the
    // same session; plain "open in new tab" links stay inside the pane.
    if (disposition === "new-window") return { action: "allow" };
    if (/^https?:/i.test(target)) contents.loadURL(target);
    else shell.openExternal(target);
    return { action: "deny" };
  });

  contents.on("focus", () => send("pane:focused", { paneId }));
  // Tabs shift position when one is closed, so the index is looked up per report.
  const report = () => {
    const tabIndex = tabIndexOf(paneId, view);
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
    view.favicon = icons.find((icon) => /^(https?|data):/i.test(icon)) || null;
    report();
  });
  contents.on("page-title-updated", report);
  contents.on("did-start-loading", report);
  contents.on("did-stop-loading", report);
  contents.on("did-navigate", report);
  contents.on("did-navigate-in-page", report);
  contents.on("did-fail-load", (_event, code, description, failedUrl, isMainFrame) => {
    const tabIndex = tabIndexOf(paneId, view);
    if (isMainFrame && code !== -3 && tabIndex >= 0) send("pane:error", { paneId, tabIndex, description, url: failedUrl });
  });
  contents.on("found-in-page", (_event, result) => {
    if (result.finalUpdate) send("pane:found", { paneId, active: result.activeMatchOrdinal, matches: result.matches });
  });

  contents.loadURL(url).catch(() => {});
  shellWindow.contentView.addChildView(view);
  return view;
}

function destroyView(view) {
  if (!shellWindow || shellWindow.isDestroyed()) return;
  shellWindow.contentView.removeChildView(view);
  if (!view.webContents.isDestroyed()) view.webContents.close();
}

function applyPane(paneId) {
  const pane = panes.get(paneId);
  if (!pane) return;
  const { x, y, width, height, radius = 0 } = pane.bounds;
  const showable = pane.visible && !overlayOpen && !transitioning && width > 1 && height > 1;
  for (const [tabIndex, view] of pane.views) {
    const shown = showable && tabIndex === pane.activeTab;
    view.setVisible(shown);
    view.shown = shown;
    if (!shown) continue;
    view.setBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });
    view.setBorderRadius?.(Math.round(radius));
  }
}

function syncPanes(nextPanes) {
  const seen = new Set();
  for (const next of nextPanes) {
    seen.add(next.id);
    let pane = panes.get(next.id);
    if (!pane) {
      pane = { urls: [], activeTab: 0, bounds: { x: 0, y: 0, width: 0, height: 0 }, visible: false, views: new Map() };
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
    for (const leftovers of pool.values()) leftovers.forEach(destroyView);
    const moved = [...views].some(([tabIndex, view]) => pane.views.get(tabIndex) !== view);
    pane.views = views;
    pane.urls = next.urls;
    pane.activeTab = Math.min(next.activeTab ?? 0, Math.max(0, next.urls.length - 1));
    pane.visible = next.visible;
    if (next.bounds) pane.bounds = next.bounds;
    const url = pane.urls[pane.activeTab];
    if (url && !pane.views.has(pane.activeTab)) {
      pane.views.set(pane.activeTab, createTabView(next.id, url));
    }
    if (moved) for (const view of pane.views.values()) view.report?.();
    applyPane(next.id);
  }
  for (const [paneId, pane] of panes) {
    if (seen.has(paneId)) continue;
    for (const view of pane.views.values()) destroyView(view);
    panes.delete(paneId);
  }
}

function activeContents(paneId) {
  const pane = panes.get(paneId);
  return pane?.views.get(pane.activeTab)?.webContents;
}

function buildMenu() {
  const command = (id, label) => ({
    label,
    accelerator: COMMAND_ACCELERATORS[id],
    // Keys are matched in before-input-event so they also work while a page has focus.
    registerAccelerator: false,
    click: () => send("deck:command", id),
  });
  const checkForUpdates = { label: "Check for Updates…", click: () => updater?.check(true) };
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: "about" },
            checkForUpdates,
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
        command("tab-new", "New Tab"),
        command("tab-reopen", "Reopen Closed Tab"),
        command("address-focus", "Open Location…"),
        { type: "separator" },
        command("tab-close", "Close Tab"),
        { label: "Close Window", accelerator: "CmdOrCtrl+Shift+W", role: "close" },
        ...(isMac ? [] : [{ type: "separator" }, { role: "quit" }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
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
        { label: "AI Window Deck Website", click: () => shell.openExternal(SITE_URL) },
        { label: "Report an Issue", click: () => shell.openExternal(ISSUES_URL) },
        ...(isMac ? [] : [{ type: "separator" }, checkForUpdates, { role: "about" }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createShellWindow() {
  const { maximized, ...frame } = loadWindowState();
  shellWindow = new BrowserWindow({
    ...frame,
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
  interceptCommands(shellWindow.webContents);
  trackWindowState(shellWindow);
  shellWindow.once("ready-to-show", () => {
    if (maximized) shellWindow.maximize();
    shellWindow.show();
  });
  shellWindow.webContents.on("did-finish-load", () => {
    if (lastUpdateState?.status === "ready") send("update:state", { ...lastUpdateState, manual: false });
  });
  shellWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  shellWindow.on("closed", () => {
    panes.clear();
    shellWindow = null;
  });

  if (DEV_URL) shellWindow.loadURL(DEV_URL);
  else shellWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("store:load", () => readStore());
ipcMain.handle("store:save", (_event, data) => writeStore(data));
ipcMain.handle("app:info", () => ({ platform: process.platform, locale: app.getLocale(), version: app.getVersion() }));
ipcMain.on("update:check", () => updater?.check(true));
ipcMain.on("update:install", () => updater?.install());

ipcMain.on("panes:sync", (_event, nextPanes) => syncPanes(nextPanes));
ipcMain.on("panes:bounds", (_event, list) => {
  for (const { id, bounds } of list) {
    const pane = panes.get(id);
    if (!pane) continue;
    pane.bounds = bounds;
    applyPane(id);
  }
});
ipcMain.on("panes:overlay", (_event, open) => {
  overlayOpen = Boolean(open);
  for (const paneId of panes.keys()) applyPane(paneId);
});
ipcMain.on("panes:transition", (_event, active) => {
  transitioning = Boolean(active);
  for (const paneId of panes.keys()) applyPane(paneId);
});
ipcMain.handle("panes:snapshot", async () => {
  const shots = {};
  await Promise.all([...panes].map(async ([paneId, pane]) => {
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
ipcMain.on("shell:focus", () => shellWindow?.webContents.focus());
ipcMain.on("pane:focus", (_event, paneId) => activeContents(paneId)?.focus());
ipcMain.on("pane:navigate", (_event, { paneId, action, url }) => {
  const contents = activeContents(paneId);
  if (!contents) return;
  if (action === "back" && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
  else if (action === "forward" && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
  else if (action === "reload") contents.reload();
  else if (action === "reload-hard") contents.reloadIgnoringCache();
  else if (action === "load" && url) contents.loadURL(url).catch(() => {});
  else if (action === "home") {
    const pane = panes.get(paneId);
    contents.loadURL(pane.urls[pane.activeTab]).catch(() => {});
  }
});
ipcMain.handle("pane:zoom", (_event, { paneId, factor }) => {
  const contents = activeContents(paneId);
  if (!contents) return null;
  contents.setZoomFactor(factor);
  return contents.getZoomFactor();
});
ipcMain.handle("pane:get-zoom", (_event, paneId) => activeContents(paneId)?.getZoomFactor() ?? 1);
ipcMain.on("pane:find", (_event, { paneId, text, forward = true, newSearch = true }) => {
  const contents = activeContents(paneId);
  if (!contents) return;
  // Electron's findNext means "start a new search session", not "go to the next match".
  if (text) contents.findInPage(text, { forward, findNext: newSearch });
  else contents.stopFindInPage("clearSelection");
});
ipcMain.on("pane:find-stop", (_event, paneId) => activeContents(paneId)?.stopFindInPage("keepSelection"));

ipcMain.handle("backup:import", async () => {
  const result = await dialog.showOpenDialog(shellWindow, {
    properties: ["openFile"],
    filters: [{ name: "AI Window Deck backup", extensions: ["json", "txt"] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const file = result.filePaths[0];
  return { name: path.basename(file), text: await fs.readFile(file, "utf8") };
});

const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.quit();

app.on("second-instance", () => {
  if (!shellWindow) return;
  if (shellWindow.isMinimized()) shellWindow.restore();
  shellWindow.focus();
});

app.setAboutPanelOptions({
  applicationName: "AI Window Deck",
  applicationVersion: app.getVersion(),
  copyright: "© 2026 Takao Umehara / creativity is everywhere",
  website: SITE_URL,
});

app.whenReady().then(() => {
  if (!isPrimaryInstance) return;
  const userAgent = plainChromeUserAgent();
  app.userAgentFallback = userAgent;
  session.fromPartition(PARTITION).setUserAgent(userAgent);
  buildMenu();
  createShellWindow();
  updater = createUpdater((state) => {
    lastUpdateState = state;
    send("update:state", state);
  });
  updater.check(false);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createShellWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
