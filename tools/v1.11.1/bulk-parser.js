// Replaces the v1.11.0 bulk import parser `Rd` inside dist/assets/app-*.js. It runs in the
// bundle's module scope and relies on the bundle's own URL helpers `Wo` (normalize one URL)
// and `pm` (looks like a URL), copied verbatim in url-helpers.js for the tests.
//
// `errors` keeps the v1.11.0 shape ({index, input, reason}) and only holds URLs that can't be
// saved, so a file import still blocks on those and nothing else. `issues` lists every line
// the dialog highlights, with a 1-based line number. `items` is a best-effort parse.
const bulkEdScheme = /^(?:https?:\/\/|file:\/\/|chrome:\/\/|chrome-extension:\/\/|about:)/i;
const bulkEdMsg = { nameWithoutBlank: "bulkIssueNameWithoutBlank", notUrl: "bulkIssueNotUrl", badUrl: "bulkIssueBadUrl" };
function Rd(s, l) {
  const items = [], errors = [], issues = [];
  let name = "", urls = [];
  const flush = () => {
    (name || urls.length) && items.push({ name: name || l(items.length + 1), urls: urls.join("\n") });
    name = "";
    urls = [];
  };
  String(s).split("\n").forEach((raw, index) => {
    const text = raw.trim(), line = index + 1;
    if (!text) return flush();
    if (pm(text)) {
      const one = Wo(text);
      if (one.ok) return void urls.push(one.url);
      // Several URLs may share a line, but only when each one carries its scheme: a
      // scheme-less piece next to a URL is more likely a URL with a stray space in it.
      const parts = text.split(/\s+/);
      if (parts.length > 1 && parts.every((p) => bulkEdScheme.test(p))) {
        const many = parts.map((p) => Wo(p));
        if (many.every((m) => m.ok)) return void urls.push(...many.map((m) => m.url));
      }
      errors.push({ index, input: raw, reason: one.reason });
      issues.push({ line, kind: "badUrl", text, reason: one.reason });
      return;
    }
    if (urls.length) {
      issues.push({ line, kind: "nameWithoutBlank", text });
      flush();
      name = text;
    } else if (name) {
      issues.push({ line, kind: "notUrl", text });
    } else {
      name = text;
    }
  });
  flush();
  return { items, errors, issues };
}
function bulkEdCanFix(issue) {
  return issue.kind === "nameWithoutBlank";
}
function bulkEdFix(s, issue) {
  if (!bulkEdCanFix(issue)) return s;
  const lines = String(s).split("\n");
  lines.splice(issue.line - 1, 0, "");
  return lines.join("\n");
}
// Bottom-up, so inserting a blank line never shifts a line that is still to be fixed.
function bulkEdFixAll(s) {
  return Rd(s, () => "").issues.filter(bulkEdCanFix).sort((a, b) => b.line - a.line).reduce((t, i) => bulkEdFix(t, i), s);
}
function bulkEdJump(textarea, backdrop, s, line) {
  if (!textarea) return;
  const lines = String(s).split("\n");
  let start = 0;
  for (let i = 0; i < line - 1; i++) start += lines[i].length + 1;
  textarea.focus();
  textarea.setSelectionRange(start, start + (lines[line - 1] || "").length);
  const row = backdrop && backdrop.children[line - 1];
  row && (textarea.scrollTop = Math.max(0, row.offsetTop - 24));
}
