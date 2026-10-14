import test from "node:test";
import assert from "node:assert/strict";
import { composite, contrastRatio, parseColor, readTokens } from "../src/lib/contrast.js";
import { audit, currentTheme } from "../scripts/contrast.mjs";

test("contrast ratios match WCAG's reference values", () => {
  assert.equal(contrastRatio(parseColor("#000"), parseColor("#fff")).toFixed(2), "21.00");
  assert.equal(contrastRatio(parseColor("#777777"), parseColor("#ffffff")).toFixed(2), "4.48");
  assert.equal(contrastRatio(parseColor("#fff"), parseColor("#fff")), 1);
});

test("alpha is composited over the surface below", () => {
  const mixed = composite(parseColor("rgba(255, 255, 255, 0.5)"), parseColor("#000000"));
  assert.deepEqual([Math.round(mixed.r), Math.round(mixed.g), Math.round(mixed.b)], [128, 128, 128]);
  assert.equal(composite(parseColor("#ffffff"), parseColor("#000000"), 0.25).r, 63.75);
  assert.equal(parseColor("rgb(11 11 11 / 40%)").a, 0.4);
});

test("later custom property declarations win", () => {
  assert.equal(readTokens(":root{--a: #111;}", ":root{ --a:#222; }")["--a"], "#222");
});

test("every text and boundary pair the shell uses meets WCAG 2.2 AA", () => {
  const failing = audit(currentTheme()).filter((row) => row.pass === false);
  assert.deepEqual(failing.map((row) => `${row.use}: ${row.ratio.toFixed(2)}:1`), []);
});
