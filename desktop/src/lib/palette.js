// Command palette (⌘K): every command in electron/commands.json, named in
// plain words in the UI language, found by those words, the English ones
// and per-language synonyms ("スマホ", "iPhone" and "mobile" all find the
// mobile preview).

const MAC_KEYS = { CmdOrCtrl: "⌘", Cmd: "⌘", Ctrl: "⌃", Alt: "⌥", Shift: "⇧" };

/** "CmdOrCtrl+Shift+M" as the keyboard shows it: "⌘⇧M" on macOS, "Ctrl+Shift+M" elsewhere. */
export function formatAccelerator(accelerator, isMac) {
  if (!accelerator) return "";
  const parts = accelerator.split("+").map((part) => (part === "" ? "+" : part));
  if (isMac) return parts.map((part) => MAC_KEYS[part] ?? part).join("");
  return parts.map((part) => (part === "CmdOrCtrl" || part === "Cmd" ? "Ctrl" : part)).join("+");
}

// Width, case and kana differences don't matter: "ＰＤＦ" = "pdf", "スマホ" = "すまほ".
export function normalize(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

const WORD_BREAK = /[\s/・·()（）「」、。,.:;!?！？…—–-]+/;
const words = (text) => text.split(WORD_BREAK).filter(Boolean);

function isSubsequence(needle, haystack) {
  let at = 0;
  for (const char of haystack) if (char === needle[at] && (at += 1) === needle.length) return true;
  return false;
}

/**
 * Palette rows for a catalog: `t` is the UI language, `tEnglish` English.
 * Commands that act on a pane are left out while no pane has focus.
 */
export function paletteEntries(catalog, { t, tEnglish, isMac, hasPane = true }) {
  return catalog.commands
    .filter((command) => command.palette !== false && (hasPane || !command.pane))
    .map((command) => {
      const label = t(command.label);
      const english = tEnglish(command.label);
      const keywordKeys = [command.keywords ?? []].flat();
      const keywords = keywordKeys.map((key) => t(key)).join(" ");
      const englishKeywords = keywordKeys.map((key) => tEnglish(key)).join(" ");
      return {
        id: command.id,
        group: command.group,
        pane: Boolean(command.pane),
        label,
        english,
        shortcut: formatAccelerator(command.accelerator, isMac),
        search: {
          label: normalize(label),
          english: normalize(english),
          keywords: normalize(`${keywords} ${englishKeywords}`),
        },
      };
    });
}

function scoreToken(token, { label, english, keywords }) {
  // Word starts beat letters inside a word: "ai" means Ask AI, not "portrait".
  if (label.startsWith(token)) return 100;
  if (words(label).some((word) => word.startsWith(token))) return 80;
  if (words(english).some((word) => word.startsWith(token))) return 60;
  if (words(keywords).some((word) => word.startsWith(token))) return 55;
  if (label.includes(token)) return 50;
  if (english.includes(token)) return 40;
  if (keywords.includes(token)) return 30;
  if (token.length >= 2 && (isSubsequence(token, label) || isSubsequence(token, english))) return 15;
  return 0;
}

/** Entries matching every word of `query`, best first; all of them, in catalog order, for an empty query. */
export function searchPalette(entries, query) {
  const tokens = words(normalize(query));
  if (!tokens.length) return entries;
  return entries
    .map((entry, index) => {
      let score = 0;
      for (const token of tokens) {
        const tokenScore = scoreToken(token, entry.search);
        if (!tokenScore) return null;
        score += tokenScore;
      }
      return { entry, score, index };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ entry }) => entry);
}

/**
 * A short guide to the app for an AI chat (Ask AI): what it is, the ideas
 * behind it and every command with its shortcut, in English, asking for
 * answers in the user's language.
 */
export function featureGuide(entries, { language, groupLabel, question = "" }) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group).push(`- ${entry.english}${entry.shortcut ? ` (${entry.shortcut})` : ""}`);
  }
  return [
    "I use AI Window Deck, a desktop app (macOS) that shows several websites side by side in one window.",
    "Ideas: each registered window is a pane with its own web page; a window can have several URLs, shown as tabs in the pane's title bar.",
    "Layouts: Grid (all panes), Spotlight (one large pane, the others on a rail) and Fill (one pane covers the deck). Clicking a pane's title bar enlarges it.",
    "Sets are named decks of windows. All panes share one login. Mobile preview shows a pane as a phone or tablet; each window keeps its own device.",
    "⌘K (or the \"Find a feature\" button in the top bar) opens a searchable list of every action.",
    "",
    "Commands:",
    ...[...groups].flatMap(([group, lines]) => [`${groupLabel(group)}:`, ...lines]),
    "",
    `Please answer in ${language}, briefly and step by step, naming the exact button or shortcut.`,
    question ? `My question: ${question}` : "First reply with one short line saying you're ready, then wait for my question.",
  ].join("\n");
}

export const ASK_AI_URLS = {
  claude: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  chatgpt: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
};
