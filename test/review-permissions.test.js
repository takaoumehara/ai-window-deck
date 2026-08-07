import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const packageScript = fs.readFileSync(path.join(root, "tools", "package.sh"), "utf8");

test("the review build does not request broad website access", () => {
  assert.equal(manifest.permissions.includes("scripting"), false);
  assert.equal("content_scripts" in manifest, false);
  assert.equal("host_permissions" in manifest, false);
  assert.equal("optional_host_permissions" in manifest, false);
});

test("the review package does not include a website activity script", () => {
  assert.equal(packageScript.includes("attention.js"), false);
});
