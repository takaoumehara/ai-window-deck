import { UI_STRINGS } from "./ui-strings.js";

// Generated from tools/ui-strings.json by tools/build-i18n.py.
export const DICTIONARY = UI_STRINGS;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ko", label: "한국어" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "zh-CN", label: "简体中文" },
];

// Map a browser language tag (e.g. "pt-PT", "zh-TW", "en-GB") to a panel locale.
export function resolveLanguage(tag) {
  const value = String(tag || "").replace("_", "-").toLowerCase();
  const exact = LANGUAGES.find(({ code }) => code.toLowerCase() === value);
  if (exact) return exact.code;
  const base = value.split("-")[0];
  if (base === "pt") return "pt-BR";
  if (base === "zh") return "zh-CN";
  return LANGUAGES.find(({ code }) => code === base)?.code ?? "en";
}

export function browserLanguage() {
  const tag = (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.())
    || (typeof navigator !== "undefined" ? navigator.language : "en");
  return resolveLanguage(tag);
}

// Values may carry {placeholders}: t("deleteItem", { name: "Draft" }).
export function getTranslation(lang, key, values) {
  const text = DICTIONARY[lang]?.[key] ?? DICTIONARY.en[key] ?? key;
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
}
