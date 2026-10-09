const { app, BrowserWindow, WebContentsView, Menu, ipcMain, dialog, session, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { matchCommand, COMMAND_ACCELERATORS } = require("./commands.cjs");

const DEV_URL = process.env.DECK_DEV_URL;
const PARTITION = "persist:deck";
const isMac = process.platform === "darwin";
// Native window and view backgrounds can't read CSS variables; this mirrors --cie-ink.
const CIE_INK = "#0b0b0b";

let shellWindow = null;
let overlayOpen = false;
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

function interceptCommands(webContents) {
  webContents.on("before-input-event", (event, input) => {
    const command = matchCommand(input);
    if (!command) return;
    event.preventDefault();
    send("deck:command", command);
  });
}

function createTabView(paneId, tabIndex, url) {
  const view = new WebContentsView({
    webPreferences: {
      partition: PARTITION,
      sandbox: true,
      contextIsolation: true,
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
  const report = () => send("pane:state", {
    paneId,
    tabIndex,
    title: contents.getTitle(),
    url: contents.getURL(),
    loading: contents.isLoading(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
  });
  contents.on("page-title-updated", report);
  contents.on("did-start-loading", report);
  contents.on("did-stop-loading", report);
  contents.on("did-navigate", report);
  contents.on("did-navigate-in-page", report);
  contents.on("did-fail-load", (_event, code, description, failedUrl, isMainFrame) => {
    if (isMainFrame && code !== -3) send("pane:error", { paneId, tabIndex, description, url: failedUrl });
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
  const showable = pane.visible && !overlayOpen && width > 1 && height > 1;
  for (const [tabIndex, view] of pane.views) {
    const shown = showable && tabIndex === pane.activeTab;
    view.setVisible(shown);
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
    // A tab whose URL changed in the editor is rebuilt; untouched tabs keep their page.
    next.urls.forEach((url, tabIndex) => {
      const existing = pane.views.get(tabIndex);
      if (existing && pane.urls[tabIndex] !== url) {
        destroyView(existing);
        pane.views.delete(tabIndex);
      }
    });
    for (const [tabIndex, view] of pane.views) {
      if (tabIndex >= next.urls.length) {
        destroyView(view);
        pane.views.delete(tabIndex);
      }
    }
    pane.urls = next.urls;
    pane.activeTab = Math.min(next.activeTab ?? 0, Math.max(0, next.urls.length - 1));
    pane.visible = next.visible;
    if (next.bounds) pane.bounds = next.bounds;
    const url = pane.urls[pane.activeTab];
    if (url && !pane.views.has(pane.activeTab)) {
      pane.views.set(pane.activeTab, createTabView(next.id, pane.activeTab, url));
    }
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
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "Deck",
      submenu: [
        command("toggle-spotlight", "Spotlight"),
        command("restore-home", "Back to grid"),
        command("toggle-fullscreen", "Fill the deck"),
        { type: "separator" },
        command("focus-next", "Next pane"),
        command("focus-previous", "Previous pane"),
        { type: "separator" },
        command("toggle-sidebar", "Show / hide sidebar"),
        command("reload-pane", "Reload pane"),
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen" },
        ...(DEV_URL ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createShellWindow() {
  shellWindow = new BrowserWindow({
    width: 1440,
    height: 900,
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
  shellWindow.once("ready-to-show", () => shellWindow.show());
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
ipcMain.handle("app:info", () => ({ platform: process.platform, locale: app.getLocale() }));

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
ipcMain.on("pane:focus", (_event, paneId) => activeContents(paneId)?.focus());
ipcMain.on("pane:navigate", (_event, { paneId, action }) => {
  const contents = activeContents(paneId);
  if (!contents) return;
  if (action === "back" && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
  else if (action === "forward" && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
  else if (action === "reload") contents.reload();
  else if (action === "home") {
    const pane = panes.get(paneId);
    contents.loadURL(pane.urls[pane.activeTab]).catch(() => {});
  }
});

ipcMain.handle("backup:import", async () => {
  const result = await dialog.showOpenDialog(shellWindow, {
    properties: ["openFile"],
    filters: [{ name: "AI Window Deck backup", extensions: ["json", "txt"] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const file = result.filePaths[0];
  return { name: path.basename(file), text: await fs.readFile(file, "utf8") };
});

app.whenReady().then(() => {
  const userAgent = plainChromeUserAgent();
  app.userAgentFallback = userAgent;
  session.fromPartition(PARTITION).setUserAgent(userAgent);
  buildMenu();
  createShellWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createShellWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
