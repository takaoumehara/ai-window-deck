// chrome.i18n follows the browser's own UI language and cannot be overridden
// from inside an extension, so the switchable popup copy lives in strings.js
// instead. _locales/ is still generated from the same source for the parts
// Chrome owns: the name and description shown in the store and on the
// extensions page.
const LOCALE_NAMES = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português (Brasil)",
};

function availableLocales() {
  return Object.keys(STRINGS).sort((a, b) => (LOCALE_NAMES[a] ?? a).localeCompare(LOCALE_NAMES[b] ?? b));
}

function resolveLocale(preference) {
  if (preference && preference !== "auto" && STRINGS[preference]) return preference;
  const wanted = [chrome.i18n.getUILanguage(), ...(navigator.languages ?? [])];
  for (const tag of wanted) {
    if (STRINGS[tag]) return tag;
    const base = tag.split("-")[0];
    const match = Object.keys(STRINGS).find((locale) => locale.split("-")[0] === base);
    if (match) return match;
  }
  return "en";
}

function translator(locale) {
  const dictionary = STRINGS[locale] ?? STRINGS.en;
  return (key) => dictionary[key] ?? STRINGS.en[key] ?? key;
}

function applyTranslations(root, t) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nLabel));
  });
}
