import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// The 1.11.1 parser runs inside the minified 1.11.0 bundle, next to the bundle's own URL
// helpers; tools/patch-v1.11-bulk-import.mjs checks that url-helpers.js matches the bundle.
const dir = new URL("../tools/v1.11.1/", import.meta.url);
const source = ["url-helpers.js", "bulk-parser.js"].map((f) => readFileSync(new URL(f, dir), "utf8")).join("\n");
const { Rd, Wo, bulkEdFix, bulkEdFixAll } = vm.runInNewContext(`${source}\n({ Rd, Wo, bulkEdFix, bulkEdFixAll })`, { URL });
// Results come from another realm, so copy them before deep-comparing.
const plain = (value) => JSON.parse(JSON.stringify(value));
const parse = (text) => plain(Rd(text, (n) => `Window ${n}`));

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

test("the reported text flags only the window name without a blank line above it", () => {
  const { issues, errors } = parse(REPORTED);
  assert.deepEqual(issues, [{ line: 12, kind: "nameWithoutBlank", text: "intentfirst redesign" }]);
  assert.deepEqual(errors, []);
});

test("the reported text keeps resona apart and reads both URLs on line 13", () => {
  const { items } = parse(REPORTED);
  assert.deepEqual(items.map((item) => item.name), ["Growth", "escape room", "resona", "intentfirst redesign"]);
  assert.equal(items[2].urls, "https://vercel.com/takaoumehara-gmailcoms-projects/resona\nhttps://github.com/takaoumehara/resona");
  assert.equal(
    items[3].urls,
    "https://github.com/takaoumehara/intentfirst-redesign\nhttps://vercel.com/takaoumehara-gmailcoms-projects/intentfirst-redesign",
  );
});

test("fixing inserts a blank line above the name and leaves no issues", () => {
  const fixed = bulkEdFix(REPORTED, { line: 12, kind: "nameWithoutBlank", text: "intentfirst redesign" });
  assert.equal(fixed, bulkEdFixAll(REPORTED));
  assert.equal(fixed.split("\n")[11], "");
  const { issues, errors, items } = parse(fixed);
  assert.deepEqual(issues, []);
  assert.deepEqual(errors, []);
  assert.equal(items.length, 4);
  assert.equal(items[2].name, "resona");
});

test("bare domains, localhost and local paths are still accepted as in 1.11.0", () => {
  const { items, issues } = parse("Dev\ngoogle.com\nlocalhost:3000\n/Users/me/site/index.html\nC:\\work\\a.html");
  assert.deepEqual(issues, []);
  assert.deepEqual(items[0].urls.split("\n"), [
    "https://google.com",
    "http://localhost:3000",
    "file:///Users/me/site/index.html",
    "file:///C:/work/a.html",
  ]);
});

test("a broken URL blocks saving and is reported on its line", () => {
  const text = "Docs\nhttps://example.com\nhttps://exa mple.com\n~/notes.html";
  const { issues, errors } = parse(text);
  assert.deepEqual(issues, [
    { line: 3, kind: "badUrl", text: "https://exa mple.com", reason: "spaces" },
    { line: 4, kind: "badUrl", text: "~/notes.html", reason: "tilde" },
  ]);
  assert.deepEqual(errors.map((e) => e.index), [2, 3]);
  assert.equal(bulkEdFixAll(text), text);
});

test("addresses without a scheme are completed silently", () => {
  const { items, issues, errors } = parse(
    "Web\ngoogle.com\nwww.example.com/docs?q=1\ngithub.com/takaoumehara/resona\nlocalhost:3000\n192.168.0.10:8080/admin\nmyapp.test",
  );
  assert.deepEqual(issues, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(items[0].urls.split("\n"), [
    "https://google.com",
    "https://www.example.com/docs?q=1",
    "https://github.com/takaoumehara/resona",
    "http://localhost:3000",
    "http://192.168.0.10:8080/admin",
    "http://myapp.test",
  ]);
});

test("local files become file:// URLs and a path with spaces stays one location", () => {
  const { items, issues } = parse("Files\n/Users/me/My Site/index.html\nC:\\Users\\me\\report.pdf\nfile:///tmp/a.html");
  assert.deepEqual(issues, []);
  assert.deepEqual(items[0].urls.split("\n"), [
    "file:///Users/me/My%20Site/index.html",
    "file:///C:/Users/me/report.pdf",
    "file:///tmp/a.html",
  ]);
});

test("a ~ path is reported with the tilde reason", () => {
  assert.deepEqual(parse("Files\n~/notes.html").issues, [{ line: 2, kind: "badUrl", text: "~/notes.html", reason: "tilde" }]);
});

test("several URLs share a line when all or none of them carry a scheme", () => {
  assert.equal(parse("A\nhttps://a.example http://b.example/x").items[0].urls, "https://a.example\nhttp://b.example/x");
  assert.equal(parse("A\ngoogle.com github.com/takaoumehara").items[0].urls, "https://google.com\nhttps://github.com/takaoumehara");
  assert.deepEqual(parse("A\nhttps://a.example b.example").issues.map((i) => i.kind), ["badUrl"]);
  assert.deepEqual(parse("A\nhttps://exa mple.com").issues.map((i) => i.kind), ["badUrl"]);
  assert.deepEqual(parse("A\nexa mple.com").issues.map((i) => i.kind), ["badUrl"]);
  assert.deepEqual(parse("A\ngoogle.com C:\\a.pdf").issues.map((i) => i.kind), ["badUrl"]);
});

test("a name ending with a colon is still a name", () => {
  const { items, issues } = parse("Memo:\nhttps://a.example\n\nResearch: AI tools\ngoogle.com");
  assert.deepEqual(issues, []);
  assert.deepEqual(items.map((i) => i.name), ["Memo:", "Research: AI tools"]);
  assert.deepEqual(parse("A\nmailto:me@example.com").issues.map((i) => i.kind), ["badUrl"]);
});

test("a block that starts with a URL or path gets the default name", () => {
  const { items, issues } = parse("google.com\n/Users/me/a.html\n\nWork\nhttps://b.example");
  assert.deepEqual(issues, []);
  assert.deepEqual(items.map((i) => i.name), ["Window 1", "Work"]);
  assert.equal(items[0].urls, "https://google.com\nfile:///Users/me/a.html");
});

test("a second text line before any URL is reported and the first name is kept", () => {
  const { items, issues, errors } = parse("Docs\nreference notes\nhttps://example.com");
  assert.deepEqual(issues, [{ line: 2, kind: "notUrl", text: "reference notes" }]);
  assert.deepEqual(errors, []);
  assert.equal(items[0].name, "Docs");
});

test("fix all works bottom-up so later line numbers stay right", () => {
  const fixed = bulkEdFixAll("A\nhttps://a.example\nB\nhttps://b.example\nC\nhttps://c.example");
  assert.equal(fixed, "A\nhttps://a.example\n\nB\nhttps://b.example\n\nC\nhttps://c.example");
  assert.deepEqual(parse(fixed).issues, []);
});

test("blocks without a name are numbered and empty input parses cleanly", () => {
  assert.deepEqual(parse(""), { items: [], errors: [], issues: [] });
  assert.deepEqual(parse("https://a.example\n\nhttps://b.example").items.map((i) => i.name), ["Window 1", "Window 2"]);
  assert.equal(Wo("google.com").url, "https://google.com");
});
