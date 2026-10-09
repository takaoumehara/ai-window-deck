// Parses the bulk import text: a window name line, then one URL per line, with a blank
// line between windows. Every line that does not fit is reported with its 1-based line
// number so the dialog can point at it. `items` is a best-effort result that applies the
// suggested fixes, so file imports still work when a line is off.

const SCHEME = /^[a-z][a-z\d+.-]*:/i;
const ALLOWED_SCHEMES = new Set(["http:", "https:", "file:", "chrome:", "chrome-extension:", "about:"]);
const BARE_HOST = /^(localhost|\[[\da-f:]+\]|[\w-]+(\.[\w-]+)+)(:\d+)?([/?#]\S*)?$/i;
const HOST_PORT = /^(?:[^/:?#\s]+|\[[^\]]+\]):\d+(?:[/?#]|$)/;
const WINDOWS_PATH = /^[a-z]:[\\/]/i;
const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

const isPath = (value) => value.startsWith("/") || value.startsWith("~") || WINDOWS_PATH.test(value);
const hasScheme = (value) => {
  const scheme = value.match(SCHEME)?.[0].toLowerCase();
  return Boolean(scheme) && !HOST_PORT.test(value) && (ALLOWED_SCHEMES.has(scheme) || value.includes("://"));
};
const isLocalHost = (host) => host === "localhost" || /\.(localhost|local|test)$/.test(host) || /^[\d.]+$/.test(host) || host.startsWith("[");

function isValidHost(host) {
  if (host === "localhost" || host.endsWith(".localhost")) return host.split(".").every((part) => LABEL.test(part));
  if (host.startsWith("[")) return host.endsWith("]");
  if (/^[\d.]+$/.test(host)) return /^\d+\.\d+\.\d+\.\d+$/.test(host) && host.split(".").every((part) => Number(part) <= 255);
  const parts = host.split(".");
  return parts.length >= 2 && parts.every((part) => LABEL.test(part)) && /^(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i.test(parts.at(-1));
}

// Turns what people type into an openable URL: adds https:// (http:// for local hosts) when
// the scheme is missing and turns absolute file paths into file:// URLs. "~" cannot be
// expanded from an extension, so it is reported instead.
export function normalizeLocation(input) {
  const value = String(input ?? "").trim();
  if (!value) return { ok: false, reason: "empty" };
  if (value === "~" || value.startsWith("~/")) return { ok: false, reason: "tilde" };
  if (WINDOWS_PATH.test(value)) return { ok: true, url: `file:///${encodeURI(value.replace(/\\/g, "/"))}` };
  if (value.startsWith("/")) return { ok: true, url: `file://${encodeURI(value)}` };
  if (/\s/.test(value)) return { ok: false, reason: "invalid" };

  try {
    if (hasScheme(value)) {
      const url = new URL(value);
      if (!ALLOWED_SCHEMES.has(url.protocol)) return { ok: false, reason: "invalid" };
      if ((url.protocol === "http:" || url.protocol === "https:") && !isValidHost(url.hostname)) return { ok: false, reason: "invalid" };
      return { ok: true, url: value };
    }
    let url = new URL(`https://${value}`);
    if (url.username || url.password || !isValidHost(url.hostname)) return { ok: false, reason: "invalid" };
    if (isLocalHost(url.hostname)) url = new URL(`http://${value}`);
    const bareRoot = url.pathname === "/" && !url.search && !url.hash && !value.includes("/");
    return { ok: true, url: bareRoot ? url.href.replace(/\/$/, "") : url.href };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export const ISSUE = {
  nameWithoutBlank: "nameWithoutBlank",
  notUrl: "notUrl",
  badUrl: "badUrl",
  tilde: "tilde",
};

export function parseBulkText(text) {
  const lines = String(text ?? "").split(/\r?\n/);
  const items = [];
  const issues = [];
  let current = null;

  const flush = () => {
    if (current && (current.name || current.urls.length)) items.push(current);
    current = null;
  };

  const addLocation = (value, line) => {
    const result = normalizeLocation(value);
    if (result.ok) current.urls.push(result.url);
    else issues.push({ line, kind: result.reason === "tilde" ? ISSUE.tilde : ISSUE.badUrl, text: value });
  };

  lines.forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed) {
      flush();
      return;
    }

    // A path is one location even with spaces in it; anything else may hold several URLs.
    const tokens = isPath(trimmed) ? [trimmed] : trimmed.split(/\s+/);
    const explicit = tokens.some((token) => hasScheme(token) || isPath(token));
    const looksLikeUrls = tokens.every((token) => hasScheme(token) || isPath(token) || BARE_HOST.test(token));

    // A block's first line is its name, even when the name looks like a domain.
    if (!looksLikeUrls || (!current && !explicit)) {
      if (!current) {
        current = { name: trimmed, urls: [] };
      } else if (current.urls.length) {
        issues.push({ line, kind: ISSUE.nameWithoutBlank, text: trimmed });
        flush();
        current = { name: trimmed, urls: [] };
      } else if (current.name) {
        issues.push({ line, kind: ISSUE.notUrl, text: trimmed });
      } else {
        current.name = trimmed;
      }
      return;
    }

    if (!current) current = { name: "", urls: [] };
    // Several URLs may share a line, but a scheme-less piece next to a URL is a URL with a space in it.
    if (tokens.length > 1 && !tokens.every(hasScheme)) {
      issues.push({ line, kind: ISSUE.badUrl, text: trimmed });
      return;
    }
    tokens.forEach((token) => addLocation(token, line));
  });
  flush();

  return {
    items: items.map((item) => ({ name: item.name, urls: item.urls.join("\n") })),
    issues,
  };
}

// Applies the automatic fix for one issue, or returns the text unchanged when the issue
// has none (a stray note line or a broken URL needs the user's judgement).
export function fixIssue(text, issue) {
  if (issue.kind !== ISSUE.nameWithoutBlank) return text;
  const lines = String(text ?? "").split(/\r?\n/);
  lines.splice(issue.line - 1, 0, "");
  return lines.join("\n");
}

export function canFix(issue) {
  return issue.kind === ISSUE.nameWithoutBlank;
}

// Fixes from the bottom up so earlier line numbers stay valid while blank lines are inserted.
export function fixAll(text) {
  const { issues } = parseBulkText(text);
  return issues
    .filter(canFix)
    .sort((a, b) => b.line - a.line)
    .reduce((next, issue) => fixIssue(next, issue), text);
}
