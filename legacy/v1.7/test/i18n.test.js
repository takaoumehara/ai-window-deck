import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { DICTIONARY, LANGUAGES, getTranslation, resolveLanguage } from "../src/lib/i18n.js";

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("every panel language has every key with the same placeholders", () => {
  const english = DICTIONARY.en;
  for (const { code } of LANGUAGES) {
    const strings = DICTIONARY[code];
    assert.ok(strings, `${code} is missing`);
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(english).sort(), `${code} keys`);
    for (const key of Object.keys(english)) {
      assert.ok(String(strings[key]).trim(), `${code}.${key} is empty`);
      assert.deepEqual(placeholders(strings[key]), placeholders(english[key]), `${code}.${key} placeholders`);
    }
  }
});

test("the panel offers exactly the locales Chrome ships in _locales", () => {
  const chromeLocales = fs.readdirSync(new URL("../_locales", import.meta.url)).map((dir) => dir.replace("_", "-")).sort();
  assert.deepEqual(LANGUAGES.map(({ code }) => code).sort(), chromeLocales);
});

test("browser languages map onto the closest panel language", () => {
  assert.equal(resolveLanguage("ja"), "ja");
  assert.equal(resolveLanguage("en-GB"), "en");
  assert.equal(resolveLanguage("pt-PT"), "pt-BR");
  assert.equal(resolveLanguage("zh-TW"), "zh-CN");
  assert.equal(resolveLanguage("de_AT"), "de");
  assert.equal(resolveLanguage("it"), "en");
  assert.equal(resolveLanguage(undefined), "en");
});

test("translations fill placeholders and fall back to English", () => {
  assert.equal(getTranslation("en", "deleteItem", { name: "Draft" }), "Delete Draft");
  assert.equal(getTranslation("xx", "closeDialog"), "Close");
  assert.equal(getTranslation("en", "no-such-key"), "no-such-key");
});
