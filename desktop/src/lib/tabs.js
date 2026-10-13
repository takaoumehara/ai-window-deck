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

export function insertTab(item, index, url) {
  const urls = urlList(item);
  const at = Math.max(0, Math.min(index, urls.length));
  urls.splice(at, 0, url);
  return { ...item, urls: urls.join("\n") };
}

export function removeTab(item, index) {
  const urls = urlList(item);
  urls.splice(index, 1);
  return { ...item, urls: urls.join("\n") };
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
