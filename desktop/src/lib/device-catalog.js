// Grouping and search for the device switcher and the Settings picker.

const GROUPS = [
  ["iphone", "iPhone"],
  ["ipad", "iPad"],
  ["google", "Google Pixel"],
  ["samsung", "Samsung Galaxy"],
  ["sony", "Sony Xperia"],
  ["sharp", "Sharp AQUOS"],
  ["oppo", "OPPO"],
  ["xiaomi", "Xiaomi · Redmi"],
  ["android", "Android"],
];
const GROUP_LABEL = new Map(GROUPS);
const GROUP_ORDER = new Map(GROUPS.map(([key], index) => [key, index]));

export const RECENT_GROUP = "recent";
export const RECENT_LIMIT = 5;

export function deviceGroup(device) {
  if (device.os === "ipados") return "ipad";
  if (device.os === "ios") return "iphone";
  const maker = String(device.maker || "").toLowerCase();
  return GROUP_LABEL.has(maker) ? maker : "android";
}

export function groupLabel(key) {
  return GROUP_LABEL.get(key) ?? key;
}

// Words people type that aren't in the names: kinds and OSes, also in Japanese.
const KIND_WORDS = {
  foldable: "fold foldable flip 折りたたみ フォルダブル",
  tablet: "tablet タブレット",
  phone: "phone スマホ",
};
const OS_WORDS = { ios: "apple ios アイフォン", ipados: "apple ipados アイパッド", android: "android アンドロイド" };

const fold = (text) => String(text || "").normalize("NFKC").toLowerCase().replace(/\s+/g, "");

function haystack(device) {
  const words = [device.name, device.maker, device.model, groupLabel(deviceGroup(device)), `${device.width}x${device.height}`, device.year || ""];
  const tags = `${KIND_WORDS[device.type] ?? ""} ${OS_WORDS[device.os] ?? ""}`.split(" ");
  // Fields stay apart so a word can't match across two of them ("redmi" + "phone").
  return [...words, ...tags].map(fold).join("|");
}

// Every space-separated word of the query has to appear somewhere.
export function matchesDevice(device, query) {
  const words = String(query || "").normalize("NFKC").toLowerCase().split(/\s+/).filter(Boolean).map(fold);
  if (!words.length) return true;
  const text = haystack(device).replace(/×/g, "x");
  return words.every((word) => text.includes(word.replace(/×/g, "x")));
}

/**
 * [{ key, label, devices }] in maker order, catalog order inside a group.
 * Without a query, the recently used devices come first under RECENT_GROUP
 * (label left to the caller, which translates it).
 */
export function groupDevices(devices, { query = "", recent = [] } = {}) {
  const found = devices.filter((device) => matchesDevice(device, query));
  const groups = new Map();
  for (const device of found) {
    const key = deviceGroup(device);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(device);
  }
  const ordered = [...groups.entries()]
    .sort(([a], [b]) => (GROUP_ORDER.get(a) ?? 99) - (GROUP_ORDER.get(b) ?? 99))
    .map(([key, list]) => ({ key, label: groupLabel(key), devices: list }));
  if (query) return ordered;
  const byId = new Map(devices.map((device) => [device.id, device]));
  const recentDevices = recent.map((id) => byId.get(id)).filter(Boolean).slice(0, RECENT_LIMIT);
  return recentDevices.length ? [{ key: RECENT_GROUP, label: "", devices: recentDevices }, ...ordered] : ordered;
}

export function pushRecent(recent, id, limit = RECENT_LIMIT) {
  return [id, ...(Array.isArray(recent) ? recent : []).filter((entry) => entry !== id)].slice(0, limit);
}

/**
 * The device "same page on another device" adds next to `currentId`: the
 * newest unused device of the same kind from the next maker, so a comparison
 * row runs iPhone → Pixel → Galaxy → … instead of down one maker's list.
 */
export function nextComparisonDevice(devices, currentId, usedIds = []) {
  const current = devices.find((device) => device.id === currentId) ?? devices[0];
  if (!current) return null;
  const used = new Set([...usedIds, current.id]);
  const order = [...new Set(devices.map(deviceGroup))].sort((a, b) => (GROUP_ORDER.get(a) ?? 99) - (GROUP_ORDER.get(b) ?? 99));
  const start = order.indexOf(deviceGroup(current));
  const rotation = [...order.slice(start + 1), ...order.slice(0, start + 1)];
  for (const sameKind of [true, false]) {
    for (const group of rotation) {
      const pick = devices.find((device) => deviceGroup(device) === group && !used.has(device.id) && (!sameKind || device.type === current.type));
      if (pick) return pick;
    }
  }
  return devices.find((device) => device.id !== current.id) ?? current;
}

export function countByGroup(devices) {
  const counts = {};
  for (const device of devices) counts[deviceGroup(device)] = (counts[deviceGroup(device)] ?? 0) + 1;
  return counts;
}
