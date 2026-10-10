import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const manifest = JSON.parse(read("manifest.json"));
const locales = fs.readdirSync(new URL("_locales", root));

test("manifest and package.json carry the same version", () => {
  assert.equal(manifest.version, JSON.parse(read("package.json")).version);
});

test("only real, used permissions are requested, and no website access", () => {
  assert.deepEqual([...manifest.permissions].sort(), ["storage", "system.display", "tabGroups", "tabs"]);
  for (const key of ["content_scripts", "host_permissions", "optional_host_permissions"]) assert.equal(key in manifest, false, key);
});

test("every __MSG_ key the manifest uses exists in every locale, within store limits", () => {
  const keys = [...new Set([...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]))];
  for (const locale of locales) {
    const messages = JSON.parse(read(`_locales/${locale}/messages.json`));
    for (const key of keys) assert.ok(messages[key]?.message, `${locale} is missing ${key}`);
    assert.ok([...messages.extDescription.message].length <= 132, `${locale} description too long`);
    assert.ok([...messages.extName.message].length <= 75, `${locale} name too long`);
  }
});

test("every file the manifest and the panel page point at exists in the root", () => {
  const paths = [
    manifest.background.service_worker,
    manifest.options_ui.page,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
  ];
  const page = read("dist/index.html");
  paths.push(...[...page.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => `dist/${m[1]}`));
  for (const path of paths) assert.ok(fs.existsSync(new URL(path, root)), path);
});

test("the package script zips exactly the shipped files and builds nothing", () => {
  const script = read("tools/package.sh");
  assert.match(script, /manifest\.json background\.js identify\.html identify\.js \\\n  icons _locales dist/);
  assert.doesNotMatch(script, /npm run build|vite|build-i18n/);
});

test("the pre-1.11 pages and React source live under legacy/, not in the package root", () => {
  for (const path of ["deck.html", "dock.html", "index.html", "src", "vite.config.js", "strings.js"]) {
    assert.equal(fs.existsSync(new URL(path, root)), false, path);
  }
});
