export const DEFAULT_WINDOWS = [
  { id: "win-chatgpt", name: "ChatGPT", urls: "https://chatgpt.com", visible: true },
  { id: "win-claude", name: "Claude", urls: "https://claude.ai", visible: true },
  { id: "win-gemini", name: "Gemini", urls: "https://gemini.google.com", visible: true },
  { id: "win-docs", name: "Docs", urls: "https://developer.mozilla.org\nhttps://github.com", visible: true },
];

export function urlList(item) {
  return String(item?.urls || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/^[a-z][a-z0-9+.-]*:/i.test(line) ? line : `https://${line}`));
}

export function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function fromRegistered(list) {
  const seen = new Set();
  return list
    .filter((item) => item && (item.name || item.urls))
    .filter((item) => !item.id || (!seen.has(item.id) && seen.add(item.id)))
    .map((item, index) => ({
      id: String(item.id || `win-import-${Date.now()}-${index}`),
      name: String(item.name || `Window ${index + 1}`),
      urls: String(item.urls || ""),
      visible: item.visible !== false,
    }));
}

// The extension's "Window name / URL lines / blank line" text format.
function fromText(text) {
  const items = [];
  let name = "";
  let urls = [];
  const flush = () => {
    if (name || urls.length) items.push({ name: name || `Window ${items.length + 1}`, urls: urls.join("\n") });
    name = "";
    urls = [];
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) flush();
    else if (/^https?:\/\//i.test(line)) urls.push(line);
    else {
      if (urls.length) flush();
      name = line;
    }
  }
  flush();
  return fromRegistered(items.map((item, index) => ({ ...item, id: `win-import-${Date.now()}-${index}` })));
}

/**
 * Windows from an AI Window Deck extension export: the JSON backup from
 * "Profiles & Backup" or the .txt window list from the register dialog.
 * When the backup's active layout lists slots, that layout's windows come first.
 */
export function parseExtensionExport(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return fromText(trimmed);
  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) return fromRegistered(parsed);
  const registered = Array.isArray(parsed.registeredWindows) ? parsed.registeredWindows : [];
  const presetSlots = parsed.state?.presets?.[parsed.state?.activePreset || 0]?.slots;
  const slots = Array.isArray(parsed.canvasSlots) && parsed.canvasSlots.length ? parsed.canvasSlots : presetSlots || [];
  const placed = slots.map((slot) => registered.find((item) => item.id === slot.registeredWindowId) || slot);
  const placedIds = new Set(placed.map((item) => item.id));
  const rest = registered.filter((item) => !placedIds.has(item.id)).map((item) => ({ ...item, visible: false }));
  return fromRegistered([...placed, ...rest]);
}
