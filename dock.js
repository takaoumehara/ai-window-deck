// The standing window: nothing but the list, refreshed on a timer, each row a
// button that brings that window forward. It shares deck.css so the two never
// drift apart visually.
const $ = (selector) => document.querySelector(selector);
const STATUS_KEYS = { busy: "status_busy", done: "status_done", idle: "status_idle", here: "status_here" };

let t = translator("en");

// Belt and braces on a two-second timer. Measured, Chrome closes this window
// outright when the extension reloads — it does not linger with its bridge
// gone, the way a content script does — so the check should never fire. It is
// one property read, and the alternative is an exception every two seconds if
// that ever stops being true.
let timer;
const orphaned = () => !globalThis.chrome?.runtime?.id;

async function paint() {
  if (orphaned()) { clearInterval(timer); return; }
  let response;
  try {
    response = await chrome.runtime.sendMessage({ type: "windowList" }).catch(() => null);
  } catch {
    clearInterval(timer);
    return;
  }
  const windows = response?.windows ?? [];
  const list = $("#windowList");
  list.textContent = "";
  if (!windows.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("no_windows");
    list.append(empty);
    return;
  }
  for (const window of windows) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `win-row status-${window.status}`;
    row.addEventListener("click", async () => {
      try {
        await chrome.runtime.sendMessage({ type: "focusWindow", windowId: window.id }).catch(() => {});
      } catch { return; }
      paint();
    });

    const dot = document.createElement("span");
    dot.className = "win-dot";
    if (window.color) dot.dataset.color = window.color;

    const body = document.createElement("span");
    body.className = "win-body";
    const title = document.createElement("b");
    title.textContent = window.title || window.url || "—";
    const meta = document.createElement("small");
    meta.textContent = [
      `${window.tabs} ${t("tabs_count")}`,
      window.screen ? `${t("screen_word")} ${window.screen}` : null,
      window.minimized ? t("status_min") : null,
    ].filter(Boolean).join(" · ");
    body.append(title, meta);

    const badge = document.createElement("em");
    badge.className = "win-status";
    badge.textContent = t(STATUS_KEYS[window.status] ?? "status_idle");

    const close = document.createElement("span");
    close.className = "win-close";
    close.setAttribute("role", "button");
    close.setAttribute("tabindex", "0");
    close.title = t("close_window");
    close.setAttribute("aria-label", `${t("close_window")} ${window.title || ""}`.trim());
    close.textContent = "✕";
    const shut = async (event) => {
      event.stopPropagation();
      try {
        await chrome.runtime.sendMessage({ type: "closeWindows", windowIds: [window.id] }).catch(() => {});
      } catch { return; }
      paint();
    };
    close.addEventListener("click", shut);
    close.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") shut(event);
    });

    row.append(dot, body, badge, close);
    list.append(row);
  }
}

async function start() {
  const { language } = await chrome.storage.sync.get({ language: "auto" });
  const locale = resolveLocale(language);
  t = translator(locale);
  document.documentElement.lang = locale;
  applyTranslations(document, t);
  await paint();
  timer = setInterval(paint, 2000);
}

start();
