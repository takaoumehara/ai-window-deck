// Parses the bulk import text: a window name line, then one URL per line, with a blank
// line between windows. Every line that does not fit is reported with its 1-based line
// number so the dialog can point at it. `items` is a best-effort result that applies the
// suggested fixes, so file imports still work when a line is off.

const SCHEME = /^https?:\/\//i;
const BARE_HOST = /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?([/?#]\S*)?$/i;

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export const ISSUE = {
  nameWithoutBlank: "nameWithoutBlank",
  missingScheme: "missingScheme",
  notUrl: "notUrl",
  badUrl: "badUrl",
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

  lines.forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed) {
      flush();
      return;
    }
    const tokens = trimmed.split(/\s+/);
    const hasScheme = tokens.some((token) => SCHEME.test(token));
    const looksLikeUrls = tokens.every((token) => SCHEME.test(token) || BARE_HOST.test(token));

    // A block's first line is its name, even when the name looks like a domain.
    if (!looksLikeUrls || (!current && !hasScheme)) {
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
    if (tokens.length > 1 && !tokens.every((token) => SCHEME.test(token))) {
      issues.push({ line, kind: ISSUE.badUrl, text: trimmed });
      return;
    }
    for (const token of tokens) {
      if (SCHEME.test(token)) {
        if (isValidUrl(token)) current.urls.push(token);
        else issues.push({ line, kind: ISSUE.badUrl, text: token });
      } else {
        issues.push({ line, kind: ISSUE.missingScheme, text: token });
        current.urls.push(`https://${token}`);
      }
    }
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
  const lines = String(text ?? "").split(/\r?\n/);
  const i = issue.line - 1;
  if (issue.kind === ISSUE.nameWithoutBlank) {
    lines.splice(i, 0, "");
  } else if (issue.kind === ISSUE.missingScheme) {
    lines[i] = lines[i].replace(issue.text, `https://${issue.text}`);
  } else {
    return text;
  }
  return lines.join("\n");
}

export function canFix(issue) {
  return issue.kind === ISSUE.nameWithoutBlank || issue.kind === ISSUE.missingScheme;
}

// Fixes from the bottom up so earlier line numbers stay valid while blank lines are inserted.
export function fixAll(text) {
  const { issues } = parseBulkText(text);
  return issues
    .filter(canFix)
    .sort((a, b) => b.line - a.line)
    .reduce((next, issue) => fixIssue(next, issue), text);
}
