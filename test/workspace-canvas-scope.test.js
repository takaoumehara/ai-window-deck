import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("canvas mutation helpers remain inside WorkspaceCanvas scope", async () => {
  const source = await readFile(new URL("../src/components/WorkspaceCanvas.jsx", import.meta.url), "utf8");
  const renderStart = source.indexOf("  return (\n");

  for (const helper of ["snapshot", "saveHistory", "commitSlots", "handleUndo", "handleRedo"]) {
    const helperIndex = source.indexOf(`const ${helper}`);
    assert.notEqual(helperIndex, -1, `${helper} should exist`);
    assert.ok(helperIndex < renderStart, `${helper} must be declared before the component render`);
  }

  assert.equal(source.indexOf("\n  const snapshot", renderStart), -1, "history helpers must not be declared after the component closes");
});
