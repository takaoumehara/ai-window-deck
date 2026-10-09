import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";

const tools = new URL("../tools/", import.meta.url);
const source = readFileSync(new URL("v1.11.2/inline-register.js", tools), "utf8");
const { regInMode, regInEscape } = vm.runInNewContext(`${source}\n({ regInMode, regInEscape })`);

test("a new window in the page starts at the one-by-one / bulk choice", () => {
  assert.equal(regInMode(null, true), "choose");
  assert.equal(regInMode({ id: "w1" }, true), "single");
  assert.equal(regInMode(null, false), "single");
});

test("Esc steps back to the choice before closing a new window's form", () => {
  assert.equal(regInEscape(null, true, "bulk"), "choose");
  assert.equal(regInEscape(null, true, "single"), "choose");
  assert.equal(regInEscape(null, true, "choose"), "close");
  assert.equal(regInEscape({ id: "w1" }, true, "single"), "close");
  assert.equal(regInEscape(null, false, "bulk"), "close");
});

test("every locale gets the same strings", () => {
  const strings = JSON.parse(readFileSync(new URL("v1.11.2/strings.json", tools), "utf8"));
  const locales = ["ja", "en", "zh-CN", "ko", "es", "fr", "de", "pt-BR"];
  assert.deepEqual(Object.keys(strings).sort(), [...locales].sort());
  const keys = Object.keys(strings.en).sort();
  for (const l of locales) {
    assert.deepEqual(Object.keys(strings[l]).sort(), keys, l);
    for (const k of keys) assert.ok(strings[l][k].trim(), `${l}.${k}`);
  }
  assert.equal(strings.en.regTitleAdd, "Register URLs + Window");
});

// The store package is not in the repo; point AWD_V1110_DIR at the unpacked 1.11.0 zip.
const pkg = process.env.AWD_V1110_DIR;
test("the patch builds a valid 1.11.2 bundle", { skip: !pkg || !existsSync(pkg) ? "set AWD_V1110_DIR to the unpacked 1.11.0 package" : false }, () => {
  const out = mkdtempSync(join(tmpdir(), "awd-1112-"));
  try {
    execFileSync(process.execPath, [new URL("patch-v1.11.2-inline-register.mjs", tools).pathname, pkg, out], { stdio: "pipe" });
    assert.match(readFileSync(join(out, "manifest.json"), "utf8"), /"version": "1\.11\.2"/);
    const assets = join(out, "dist", "assets");
    const js = readFileSync(join(assets, readdirSync(assets).find((f) => f.endsWith(".js"))), "utf8");
    new vm.Script(js.replace(/^import[^;]*;/gm, ""), { filename: "app.js" });
    assert.equal(js.split('regTitleAdd:"Register URLs + Window"').length - 1, 1);
    assert.ok(js.includes("open:he&&w,"));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
