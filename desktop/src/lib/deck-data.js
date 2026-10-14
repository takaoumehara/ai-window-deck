export const DEFAULT_WINDOWS = [
  { id: "win-chatgpt", name: "ChatGPT", urls: "https://chatgpt.com", visible: true },
  { id: "win-claude", name: "Claude", urls: "https://claude.ai", visible: true },
  { id: "win-gemini", name: "Gemini", urls: "https://gemini.google.com", visible: true },
  { id: "win-docs", name: "Docs", urls: "https://developer.mozilla.org\nhttps://github.com", visible: true },
];

export function urlList(item) {
  return String(item?.urls || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/^[a-z][a-z0-9+.-]*:/i.test(line) ? line : `https://${line}`));
}

export function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function fromRegistered(list) {
  const seen = new Set();
  return list
    .filter((item) => item && (item.name || item.urls))
    .filter((item) => !item.id || (!seen.has(item.id) && seen.add(item.id)))
    .map((item, index) => ({
      id: String(item.id || `win-import-${Date.now()}-${index}`),
      name: String(item.name || `Window ${index + 1}`),
      urls: String(item.urls || ""),
      visible: item.visible !== false,
    }));
}

// Pasted lists often come as Markdown or numbered lists.
const LIST_MARKER = /^(?:[-*•‣·]|\d+[.)])\s+/;

function asUrl(line) {
  if (/^https?:\/\/\S+$/i.test(line)) return line;
  if (/^(?:localhost|[^\s/:@]+\.[a-z]{2,})(?::\d+)?(?:[/?#]\S*)?$/i.test(line)) return `https://${line}`;
  return null;
}

// Bare words that look like domains but are file names in prose ("index.html").
const FILE_SUFFIX = /\.(?:html?|php|aspx?|jsx?|tsx?|mjs|cjs|json|ya?ml|toml|md|mdx|txt|csv|pdf|docx?|xlsx?|pptx?|png|jpe?g|gif|webp|svg|zip|py|rb|sh|css|scss|lock|log|exe|dmg)$/i;
const LOCAL_HOST = /^(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?(?:[/?#]|$)/i;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:[/?#]\S*)?$/;
// Separators between URLs in pasted prose, lists and tables, also Japanese punctuation.
const URL_BREAK = /[\s,;|<>"'`、。，；「」『』（）【】〈〉《》]+/;

function trimToken(token) {
  let out = token;
  const scheme = out.search(/https?:\/\//i);
  if (scheme > 0) out = out.slice(scheme);
  // Japanese prose has no spaces: "詳しくはmoime.appへ".
  else if (scheme < 0) out = out.replace(/^[^\x00-\x7f]+/, "").replace(/[^\x00-\x7f]+$/, "");
  out = out.replace(/^[([{*•‣·-]+/, "");
  for (;;) {
    const last = out.at(-1);
    if (!last) break;
    if (/[.,:;!?'"\]}…]/.test(last)) out = out.slice(0, -1);
    else if (last === ")" && (out.match(/\)/g) || []).length > (out.match(/\(/g) || []).length) out = out.slice(0, -1);
    else break;
  }
  return out;
}

function tokenUrl(token) {
  if (/^https?:\/\//i.test(token)) return token;
  if (/^[a-z][a-z0-9+.-]*:/i.test(token) && !/^[^\s/:@]+:\d/.test(token)) return null;
  if (token.includes("@")) return null;
  if (LOCAL_HOST.test(token)) return `http://${token}`;
  if (IPV4.test(token)) return `http://${token}`;
  if (!/^[^\s/:@]+\.[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i.test(token)) return null;
  const host = token.split(/[/:?#]/)[0];
  if (FILE_SUFFIX.test(host) && !/[/?#]/.test(token)) return null;
  return `https://${token}`;
}

// Japanese paths read as Japanese, as in Chrome's address bar.
function readable(href) {
  try {
    return decodeURI(href);
  } catch {
    return href;
  }
}

/** One spelling per address: lower-case host, no trailing slash on a bare origin. */
export function urlKey(url) {
  try {
    const parsed = new URL(url);
    const href = parsed.href;
    return parsed.pathname === "/" && !parsed.search && !parsed.hash ? href.replace(/\/$/, "") : href;
  } catch {
    return String(url).trim();
  }
}

/**
 * Every web address in pasted text, in order and without repeats: one per
 * line, mixed into prose, separated by commas or spaces, Markdown links, and
 * bare domains such as moime.app (which get https://).
 */
export function extractUrls(text) {
  const source = String(text || "").replace(/\[[^\]]*\]\(([^)\s]+)\)/g, " $1 ");
  const seen = new Set();
  const urls = [];
  for (const raw of source.split(URL_BREAK)) {
    const candidate = tokenUrl(trimToken(raw.normalize("NFKC")));
    if (!candidate) continue;
    let parsed;
    try {
      parsed = new URL(candidate);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname || (!parsed.hostname.includes(".") && parsed.hostname !== "localhost")) continue;
    const key = urlKey(parsed.href);
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(readable(key));
  }
  return urls;
}

/**
 * Pasted URLs added to a window's list: `append` keeps the list and adds the
 * new addresses at the end, `replace` swaps the whole list. Addresses already
 * in the list are counted, not repeated.
 */
export function mergeUrls(current, pasted, mode = "append") {
  const existing = current.map((url) => String(url).trim()).filter(Boolean);
  if (mode === "replace") return { urls: [...pasted], added: pasted.length, duplicates: 0 };
  const keys = new Set(existing.map((url) => urlKey(/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`)));
  const fresh = pasted.filter((url) => !keys.has(urlKey(url)));
  return { urls: [...existing, ...fresh], added: fresh.length, duplicates: pasted.length - fresh.length };
}

function splitLines(text) {
  return String(text || "").split(/\r?\n/).map((raw) => raw.trim().replace(LIST_MARKER, ""));
}

// The extension's "Window name / URL lines / blank line" text format. A window
// without a name line is named after its first URL's host.
function fromText(text) {
  const items = [];
  let name = "";
  let urls = [];
  const flush = () => {
    if (name || urls.length) items.push({ name: name || hostLabel(urls[0]) || `Window ${items.length + 1}`, urls: urls.join("\n") });
    name = "";
    urls = [];
  };
  for (const line of splitLines(text)) {
    const url = line && asUrl(line);
    if (!line) flush();
    else if (url) urls.push(url);
    else {
      if (urls.length) flush();
      name = line;
    }
  }
  flush();
  return fromRegistered(items.map((item, index) => ({ ...item, id: `win-import-${Date.now()}-${index}` })));
}

/**
 * Windows from pasted text. A list that names its windows (the extension's
 * text format) or a JSON backup keeps its windows. A bare list of URLs becomes
 * one window per URL, or with `together` one window holding them all as tabs.
 * Returns { windows, named }, where `named` says the text chose the grouping.
 */
export function parsePastedList(text, { together = false } = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { windows: [], named: false };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return { windows: parseExtensionExport(trimmed).filter((item) => urlList(item).length), named: true };
    } catch {
      // Not JSON after all; read it as lines.
    }
  }
  const lines = splitLines(trimmed).filter(Boolean);
  const named = lines.some((line) => !asUrl(line));
  if (named) return { windows: fromText(trimmed).filter((item) => urlList(item).length), named: true };
  const urls = lines.map(asUrl);
  const stamp = Date.now();
  const groups = together ? [urls] : urls.map((url) => [url]);
  return {
    windows: groups.map((group, index) => ({ id: `win-paste-${stamp}-${index}`, name: hostLabel(group[0]), urls: group.join("\n"), visible: true })),
    named: false,
  };
}

/**
 * Windows from an AI Window Deck extension export: the JSON backup from
 * "Profiles & Backup" or the .txt window list from the register dialog.
 * When the backup's active layout lists slots, that layout's windows come first.
 */
export function parseExtensionExport(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return fromText(trimmed);
  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) return fromRegistered(parsed);
  const registered = Array.isArray(parsed.registeredWindows) ? parsed.registeredWindows : [];
  const presetSlots = parsed.state?.presets?.[parsed.state?.activePreset || 0]?.slots;
  const slots = Array.isArray(parsed.canvasSlots) && parsed.canvasSlots.length ? parsed.canvasSlots : presetSlots || [];
  const placed = slots.map((slot) => registered.find((item) => item.id === slot.registeredWindowId) || slot);
  const placedIds = new Set(placed.map((item) => item.id));
  const rest = registered.filter((item) => !placedIds.has(item.id)).map((item) => ({ ...item, visible: false }));
  return fromRegistered([...placed, ...rest]);
}
