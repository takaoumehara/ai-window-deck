// AI status for panes running chat and agent tools: Working, Done, Needs you,
// Error. Which signals mean what lives in ai-sites.json, one entry per site
// on top of generic rules, so a site that changes its markup is a data edit.
//
// It fails safe: a page that matches nothing reports nothing, so no badge is
// shown rather than a wrong one. Error only counts right after work, Done
// only after a stretch of Working, and leaving Working waits out the short
// gaps agents have between steps.
//
// probePage, settleStatus and insertPrompt run inside pages: main.cjs injects
// their source (Function#toString) into the preload's isolated world, so they
// must not use anything outside their own bodies.

const catalog = require("./ai-sites.json");

const STATUSES = ["working", "needs-you", "done", "error"];

/** The catalog entry for a page, or null. Entries with paths win over host-only ones. */
function siteFor(url, data = catalog) {
  let at;
  try {
    at = new URL(url);
  } catch {
    return null;
  }
  if (at.protocol !== "https:") return null;
  const host = at.hostname.toLowerCase();
  const onHost = data.sites.filter((site) => (site.hosts ?? []).some((name) => host === name || host.endsWith(`.${name}`)));
  return onHost.find((site) => site.paths?.some((prefix) => at.pathname === prefix || at.pathname.startsWith(`${prefix}/`)))
    ?? onHost.find((site) => !site.paths)
    ?? null;
}

/** Site rules with the generic ones after them, as the page script gets them. */
function rulesFor(site, data = catalog) {
  const merged = { id: site.id, activity: Boolean(site.activity), titleWorking: site.titleWorking ?? null };
  for (const key of ["working", "needsYou", "error", "input", "submit"]) {
    merged[key] = [...(site[key] ?? []), ...(data.generic[key] ?? [])];
  }
  return merged;
}

/**
 * What the page shows right now: "working", "needs-you", "error", "idle" (the
 * tool is there and waiting for a prompt) or null (not recognised). `busy` is
 * the activity fallback's verdict for sites that opt into it.
 */
function probePage(document, rules, busy = false) {
  const visible = (element) => {
    if (element.closest("[hidden], [aria-hidden='true'], [inert]")) return false;
    const view = document.defaultView;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const style = view?.getComputedStyle?.(node);
      if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    }
    return true;
  };
  const find = (rule) => {
    const selector = typeof rule === "string" ? rule : rule.selector;
    let list;
    try {
      list = document.querySelectorAll(selector);
    } catch {
      return null;
    }
    const pattern = typeof rule === "string" || !rule.text ? null : new RegExp(rule.text, "i");
    const limit = typeof rule === "string" ? Infinity : rule.limit ?? 200;
    for (let index = 0; index < list.length && index < limit; index += 1) {
      const element = list[index];
      if (pattern) {
        if (element.children.length > 3) continue;
        const text = (element.textContent || "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 80 || !pattern.test(text)) continue;
      }
      if (visible(element)) return element;
    }
    return null;
  };
  const any = (rules_) => (rules_ ?? []).some((rule) => find(rule));
  if (any(rules.needsYou)) return "needs-you";
  if (any(rules.working)) return "working";
  if (rules.titleWorking && new RegExp(rules.titleWorking, "i").test(document.title || "")) return "working";
  if (any(rules.error)) return "error";
  if (rules.activity && busy) return "working";
  if (any(rules.input)) return "idle";
  return null;
}

/**
 * Debounces what the page reports: a new reading has to hold for a while
 * before it counts, longer when it ends Working (agents briefly drop their
 * stop button between steps). Returns { reported, candidate, since }.
 */
function settleStatus(state, reading, now) {
  const { reported = null, candidate = null, since = now } = state ?? {};
  if (reading === reported) return { reported, candidate: reading, since: now };
  const startedAt = reading === candidate ? since : now;
  const wait = reported === "working" ? 2500 : reading === "working" ? 400 : 900;
  if (now - startedAt >= wait) return { reported: reading, candidate: reading, since: now };
  return { reported, candidate: reading, since: startedAt };
}

/**
 * The status a pane shows, from the page's settled reading. Done is Working
 * that ended; it and Error stay until the user looks (`seen`). Error without
 * work before it is ignored: an old message on the page isn't news.
 */
function nextStatus(previous, reading, { seen = false, workedMs = 0 } = {}) {
  if (reading === "working" || reading === "needs-you") return reading;
  if (reading === "error" && (previous === "working" || previous === "needs-you")) return "error";
  if (previous === "working") return workedMs >= MIN_WORK_MS && !seen ? "done" : null;
  if ((previous === "done" || previous === "error") && !seen) return previous;
  return null;
}

const MIN_WORK_MS = 1500;

const PRIORITY = { "needs-you": 4, error: 3, done: 2, working: 1 };

/** The status a pane shows for all its tabs: the one that most needs attention. */
function paneStatus(list) {
  let best = null;
  for (const entry of list) {
    if (entry?.status && (!best || PRIORITY[entry.status] > PRIORITY[best.status])) best = entry;
  }
  return best;
}

/**
 * Puts `text` in the page's prompt box the way typing would, so React and
 * ProseMirror editors see it, and presses Send only when asked. Resolves to
 * { ok, reason }.
 */
async function insertPrompt(document, rules, text, submit) {
  const view = document.defaultView;
  const usable = (element) => !element.closest("[hidden], [aria-hidden='true'], [inert]") && !element.disabled;
  const first = (list) => {
    for (const rule of list ?? []) {
      let found;
      try {
        found = [...document.querySelectorAll(typeof rule === "string" ? rule : rule.selector)];
      } catch {
        continue;
      }
      const element = found.find(usable);
      if (element) return element;
    }
    return null;
  };
  const input = first(rules.input);
  if (!input) return { ok: false, reason: "no-input" };
  input.focus();
  const isField = input.tagName === "TEXTAREA" || input.tagName === "INPUT";
  const before = isField ? input.value : input.textContent;
  if (isField) {
    input.select?.();
  } else {
    const range = document.createRange();
    range.selectNodeContents(input);
    const selection = view.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  let inserted = false;
  try {
    inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text);
  } catch {
    inserted = false;
  }
  const after = () => (isField ? input.value : input.textContent);
  if (!inserted || after() === before) {
    if (isField) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
      if (setter) setter.call(input, text);
      else input.value = text;
    } else {
      input.textContent = text;
    }
    input.dispatchEvent(new view.InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  }
  if (!after().includes(text.trim().slice(0, 40))) return { ok: false, reason: "not-inserted" };
  if (!submit) return { ok: true, reason: "inserted" };
  await new Promise((resolve) => view.setTimeout(resolve, 250));
  const button = first(rules.submit);
  if (button) {
    button.click();
    return { ok: true, reason: "sent" };
  }
  const enter = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
  input.dispatchEvent(new view.KeyboardEvent("keydown", enter));
  input.dispatchEvent(new view.KeyboardEvent("keyup", enter));
  return { ok: true, reason: "sent-enter" };
}

/**
 * Whether the page holds text the user typed and hasn't sent: a filled
 * textarea or text field, or a non-empty editor. Pane sleep never discards
 * such a page.
 */
function hasDraft(document) {
  const fields = document.querySelectorAll("textarea, input:not([type]), input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='number']");
  for (const field of fields) {
    if (field.disabled || field.readOnly || field.type === "hidden") continue;
    if (field.value && field.value !== field.defaultValue) return true;
  }
  for (const editor of document.querySelectorAll("[contenteditable='true'], [contenteditable=''], [contenteditable='plaintext-only']")) {
    if (editor.parentElement?.closest("[contenteditable='true'], [contenteditable='']")) continue;
    if ((editor.textContent || "").trim()) return true;
  }
  return false;
}

// The loop each recognised page runs: probe on changes (at most every 700
// ms, and every 1.5 s regardless), settle, and report changes through the
// preload's `report`. The activity fallback calls a page busy while the DOM
// keeps changing (more than 15 mutations a second for 3 seconds).
function installMonitor(rules, probe, settle, report) {
  if (globalThis.__deckAiMonitor) globalThis.__deckAiMonitor.stop();
  let state = null;
  let last = null;
  let mutations = 0;
  let busySince = 0;
  let quietSince = 0;
  let busy = false;
  let pending = false;
  const tick = () => {
    pending = false;
    const now = Date.now();
    const rate = mutations;
    mutations = 0;
    if (rate > 15) {
      busySince = busySince || now;
      quietSince = 0;
    } else {
      quietSince = quietSince || now;
      if (now - quietSince > 1500) busySince = 0;
    }
    busy = Boolean(busySince) && now - busySince >= 3000;
    state = settle(state, probe(document, rules, busy), now);
    if (state.reported !== last) {
      last = state.reported;
      report(last);
    }
  };
  const observer = new MutationObserver((records) => {
    mutations += records.length;
    if (!pending) {
      pending = true;
      setTimeout(tick, 700);
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  const timer = setInterval(tick, 1500);
  tick();
  globalThis.__deckAiMonitor = {
    stop() {
      observer.disconnect();
      clearInterval(timer);
    },
  };
}

/** Script for webContents.executeJavaScriptInIsolatedWorld that starts the monitor. */
function monitorScript(rules) {
  return `(${installMonitor})(${JSON.stringify(rules)}, ${probePage}, ${settleStatus}, (status) => globalThis.__deckAiReport?.(status));`;
}

function insertScript(rules, text, submit) {
  return `(${insertPrompt})(document, ${JSON.stringify(rules)}, ${JSON.stringify(text)}, ${submit ? "true" : "false"});`;
}

const draftScript = () => `(${hasDraft})(document);`;

module.exports = {
  catalog, STATUSES, MIN_WORK_MS, siteFor, rulesFor, probePage, settleStatus, nextStatus, paneStatus,
  insertPrompt, hasDraft, monitorScript, insertScript, draftScript,
};
