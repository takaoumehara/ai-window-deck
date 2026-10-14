import { urlList } from "./deck-data.js";

// Address-bar input: a URL-looking string opens as a page, anything else is a search.
export function addressToUrl(text) {
  const value = String(text || "").trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^(about|data|file):/i.test(value)) return value;
  if (/^localhost(:\d+)?(\/|$)/i.test(value)) return `http://${value}`;
  if (!/\s/.test(value) && /^[^/?#]+\.[a-z]{2,}(:\d+)?([/?#]|$)/i.test(value)) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

function normalizeTabDevice(value) {
  if (!value || typeof value !== "object") return null;
  const id = typeof value.id === "string" ? value.id.trim() : "";
  if (!id) return null;
  return { id, landscape: Boolean(value.landscape) };
}

// One entry per URL. A legacy pane-level `device` applies to every tab until
// a tab is set on its own, which then stores `tabDevices` and drops `device`.
export function tabDevicesOf(item) {
  const count = urlList(item).length;
  if (Array.isArray(item?.tabDevices)) {
    return Array.from({ length: count }, (_, index) => normalizeTabDevice(item.tabDevices[index]));
  }
  const legacy = normalizeTabDevice(item?.device);
  return Array.from({ length: count }, () => legacy);
}

export function withTabDevice(item, index, device) {
  const urls = urlList(item);
  if (!urls.length) return item;
  const tabDevices = tabDevicesOf(item);
  const at = Math.max(0, Math.min(index, urls.length - 1));
  tabDevices[at] = normalizeTabDevice(device);
  const { device: _legacy, ...rest } = item;
  return { ...rest, tabDevices };
}

function rememberDevices(item, urls, tabDevices, extra) {
  const had = Array.isArray(item?.tabDevices) || Boolean(item?.device) || Boolean(extra);
  const { device: _legacy, ...rest } = item;
  const next = { ...rest, urls: urls.join("\n") };
  if (had) next.tabDevices = tabDevices;
  return next;
}

export function insertTab(item, index, url, device = null) {
  const urls = urlList(item);
  const tabDevices = tabDevicesOf(item);
  const at = Math.max(0, Math.min(index, urls.length));
  urls.splice(at, 0, url);
  tabDevices.splice(at, 0, normalizeTabDevice(device));
  return rememberDevices(item, urls, tabDevices, device);
}

export function removeTab(item, index) {
  const urls = urlList(item);
  const tabDevices = tabDevicesOf(item);
  urls.splice(index, 1);
  tabDevices.splice(index, 1);
  return rememberDevices(item, urls, tabDevices, false);
}

// Editing the URL list in the window sheet keeps a device on the URL it
// belonged to, instead of on a row that has since moved.
export function withUrls(item, urlsText) {
  const nextUrls = urlList({ urls: urlsText });
  const oldUrls = urlList(item);
  const oldDevices = tabDevicesOf(item);
  const used = new Set();
  const tabDevices = nextUrls.map((url) => {
    const found = oldUrls.findIndex((candidate, index) => candidate === url && !used.has(index));
    if (found < 0) return null;
    used.add(found);
    return oldDevices[found];
  });
  return rememberDevices(item, nextUrls, tabDevices, false);
}

// Shown on the switch until someone picks their own list in Settings.
export const DEFAULT_PREVIEW_DEVICES = ["iphone-17-pro", "ipad-air-11"];

export function resolvePreviewDevices(catalog, ids) {
  const known = new Map((catalog || []).map((device) => [device.id, device]));
  const source = Array.isArray(ids) ? ids : DEFAULT_PREVIEW_DEVICES;
  const unique = [];
  for (const id of source) {
    if (typeof id === "string" && known.has(id) && !unique.includes(id)) unique.push(id);
  }
  return unique.map((id) => known.get(id));
}

// The switch jumps to a tab already showing this page on that device, and
// otherwise retargets the tab that's open.
export function deviceSwitchTarget(urls, tabDevices, activeIndex, deviceId) {
  const want = deviceId || null;
  const url = urls[activeIndex];
  const existing = urls.findIndex((candidate, index) => (
    index !== activeIndex && candidate === url && (tabDevices[index]?.id ?? null) === want
  ));
  if (existing >= 0) return { type: "select", index: existing };
  if ((tabDevices[activeIndex]?.id ?? null) === want) return { type: "keep" };
  return { type: "assign" };
}

export function deviceTabsToOpen(urls, tabDevices, activeIndex, deviceIds) {
  const url = urls[activeIndex];
  if (!url) return [];
  const have = new Set();
  urls.forEach((candidate, index) => {
    if (candidate === url) have.add(tabDevices[index]?.id ?? null);
  });
  return deviceIds.filter((id) => id && !have.has(id)).map((id) => ({ url, device: { id, landscape: false } }));
}

// Chrome's ⌘1–8 / ⌘9: 1-based tab numbers, 9 meaning "last".
export function tabForNumber(number, count) {
  if (!count) return null;
  if (number === 9) return count - 1;
  return number <= count ? number - 1 : null;
}

export const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export function stepZoom(current, direction) {
  if (direction === 0) return 1;
  const index = ZOOM_STEPS.findIndex((step) => step >= current - 0.001);
  const base = index === -1 ? ZOOM_STEPS.length - 1 : index;
  const exact = Math.abs(ZOOM_STEPS[base] - current) < 0.001;
  const next = direction > 0 ? (exact ? base + 1 : base) : base - 1;
  return ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, next))];
}
