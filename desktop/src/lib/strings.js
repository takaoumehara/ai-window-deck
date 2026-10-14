import en from "./locales/en.js";
import ja from "./locales/ja.js";
import zhHans from "./locales/zh-Hans.js";
import zhHant from "./locales/zh-Hant.js";
import ko from "./locales/ko.js";
import es from "./locales/es.js";
import fr from "./locales/fr.js";
import de from "./locales/de.js";
import pt from "./locales/pt.js";

export const STRINGS = { ja, en, "zh-Hans": zhHans, "zh-Hant": zhHant, ko, es, fr, de, pt };

export const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "zh-Hant", label: "繁體中文" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
];

// OS locales come as BCP 47 tags (zh-TW, zh-Hant-HK, pt-BR, es-419…).
export function resolveLanguage(tag) {
  const value = String(tag || "").toLowerCase().replace(/_/g, "-");
  if (value.startsWith("zh")) return /hant|-(tw|hk|mo)\b/.test(value) ? "zh-Hant" : "zh-Hans";
  const base = value.split("-")[0];
  return STRINGS[base] ? base : "en";
}

export function translator(lang) {
  return (key, values) => {
    const text = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
    if (!values) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
  };
}
