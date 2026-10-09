import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("manifest.json"));
const locales = fs.readdirSync(new URL("../_locales", import.meta.url));

test("manifest and package.json carry the same version", () => {
  assert.equal(manifest.version, JSON.parse(read("package.json")).version);
});

test("only real, used permissions are requested", () => {
  // chrome.windows needs no permission; "windows" is not a valid entry.
  assert.deepEqual([...manifest.permissions].sort(), ["storage", "system.display", "tabGroups", "tabs"]);
});

test("every __MSG_ key the manifest uses exists in every locale, within store limits", () => {
  const keys = [...new Set([...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]))];
  assert.ok(keys.includes("cmdSpotlight"), "command descriptions are localized");
  for (const locale of locales) {
    const messages = JSON.parse(read(`_locales/${locale}/messages.json`));
    for (const key of keys) assert.ok(messages[key]?.message, `${locale} is missing ${key}`);
    assert.ok([...messages.extDescription.message].length <= 132, `${locale} description too long`);
    assert.ok([...messages.extName.message].length <= 75, `${locale} name too long`);
  }
});

test("the store package ships the built panel and no legacy pages", () => {
  const script = read("tools/package.sh");
  assert.match(script, /dist\/index\.html dist\/assets/);
  assert.doesNotMatch(script, /deck\.html|dock\.html/);
});

test("the saved language is read back from storage", () => {
  // storage.get(DEFAULTS) only returns keys listed in DEFAULTS, and rejects a
  // null default; dropping or nulling "language" silently ignores the choice.
  const source = read("src/hooks/useExtensionState.js");
  assert.match(source, /\n  language: "",/);
});
