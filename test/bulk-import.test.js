import assert from "node:assert/strict";
import test from "node:test";
import { fixAll, fixIssue, ISSUE, parseBulkText } from "../src/lib/bulk-import.js";

const REPORTED = [
  "Growth",
  "https://claude.ai/code/session_011eig5ZMSf7rGbtj8CdUbZj",
  "https://vercel.com/takaoumehara-gmailcoms-projects/growth.creativityiseverywhere.com",
  "",
  "escape room",
  "https://vercel.com/takaoumehara-gmailcoms-projects/realescaperoomdesign",
  "https://github.com/takaoumehara/realescaperoomdesign",
  "",
  "resona",
  "https://vercel.com/takaoumehara-gmailcoms-projects/resona",
  "https://github.com/takaoumehara/resona",
  " intentfirst redesign",
  "https://github.com/takaoumehara/intentfirst-redesign https://vercel.com/takaoumehara-gmailcoms-projects/intentfirst-redesign",
].join("\n");

test("a window name without a blank line above it is reported on its own line", () => {
  const { issues } = parseBulkText(REPORTED);
  assert.deepEqual(issues, [{ line: 12, kind: ISSUE.nameWithoutBlank, text: "intentfirst redesign" }]);
});

test("the best-effort parse still splits the windows and both URLs on one line", () => {
  const { items } = parseBulkText(REPORTED);
  assert.deepEqual(items.map((item) => item.name), ["Growth", "escape room", "resona", "intentfirst redesign"]);
  assert.equal(items[2].urls, "https://vercel.com/takaoumehara-gmailcoms-projects/resona\nhttps://github.com/takaoumehara/resona");
  assert.equal(items[3].urls.split("\n").length, 2);
});

test("fixing inserts the blank line and leaves no issues", () => {
  const fixed = fixIssue(REPORTED, { line: 12, kind: ISSUE.nameWithoutBlank, text: "intentfirst redesign" });
  assert.equal(fixed.split("\n")[11], "");
  assert.deepEqual(parseBulkText(fixed).issues, []);
});

test("a bare domain under a name is missing its scheme and can be fixed", () => {
  const text = "Google\ngoogle.com\nhttps://mail.google.com";
  assert.deepEqual(parseBulkText(text).issues, [{ line: 2, kind: ISSUE.missingScheme, text: "google.com" }]);
  assert.equal(parseBulkText(text).items[0].urls, "https://google.com\nhttps://mail.google.com");
  assert.equal(fixAll(text), "Google\nhttps://google.com\nhttps://mail.google.com");
});

test("a domain-like first line is the window name", () => {
  const { items, issues } = parseBulkText("growth.example.com\nhttps://example.com");
  assert.deepEqual(issues, []);
  assert.equal(items[0].name, "growth.example.com");
});

test("a second text line before any URL and a broken URL have no automatic fix", () => {
  const text = "Docs\nreference notes\nhttps://exa mple.com\nhttps://";
  const { issues } = parseBulkText(text);
  assert.deepEqual(issues.map(({ line, kind }) => ({ line, kind })), [
    { line: 2, kind: ISSUE.notUrl },
    { line: 3, kind: ISSUE.badUrl },
    { line: 4, kind: ISSUE.badUrl },
  ]);
  assert.equal(fixAll(text), text);
});

test("fix all works bottom-up so later line numbers stay right", () => {
  const text = "A\nhttps://a.example\nB\nhttps://b.example\nC\nc.example";
  const fixed = fixAll(text);
  assert.deepEqual(parseBulkText(fixed).issues, []);
  assert.deepEqual(parseBulkText(fixed).items.map((item) => item.name), ["A", "B", "C"]);
});

test("blank and CRLF input parse cleanly", () => {
  assert.deepEqual(parseBulkText(""), { items: [], issues: [] });
  assert.deepEqual(parseBulkText("A\r\nhttps://a.example\r\n\r\nB\r\nhttps://b.example").items.map((item) => item.name), ["A", "B"]);
});
