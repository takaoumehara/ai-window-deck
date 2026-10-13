import test from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, STRINGS, resolveLanguage, translator } from "../src/lib/strings.js";

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("every language translates every string, with the same placeholders", () => {
  const keys = Object.keys(STRINGS.en);
  assert.deepEqual(LANGUAGES.map(({ code }) => code).sort(), Object.keys(STRINGS).sort());
  for (const { code } of LANGUAGES) {
    const strings = STRINGS[code];
    assert.deepEqual(Object.keys(strings).sort(), [...keys].sort(), `${code} keys`);
    for (const key of keys) {
      assert.ok(strings[key].trim(), `${code}.${key} is empty`);
      assert.deepEqual(placeholders(strings[key]), placeholders(STRINGS.en[key]), `${code}.${key} placeholders`);
    }
  }
});

test("OS locales map to the closest language", () => {
  assert.equal(resolveLanguage("ja-JP"), "ja");
  assert.equal(resolveLanguage("zh-CN"), "zh-Hans");
  assert.equal(resolveLanguage("zh-Hans-SG"), "zh-Hans");
  assert.equal(resolveLanguage("zh-TW"), "zh-Hant");
  assert.equal(resolveLanguage("zh-HK"), "zh-Hant");
  assert.equal(resolveLanguage("zh_Hant_MO"), "zh-Hant");
  assert.equal(resolveLanguage("ko-KR"), "ko");
  assert.equal(resolveLanguage("pt-BR"), "pt");
  assert.equal(resolveLanguage("es-419"), "es");
  assert.equal(resolveLanguage("fr-CA"), "fr");
  assert.equal(resolveLanguage("de-AT"), "de");
  assert.equal(resolveLanguage("nl-NL"), "en");
  assert.equal(resolveLanguage(""), "en");
});

test("translator fills placeholders and falls back to English", () => {
  assert.equal(translator("de")("pasteSubmit", { count: 3 }), "3 Fenster hinzufügen");
  assert.equal(translator("xx")("save"), "Save");
});
