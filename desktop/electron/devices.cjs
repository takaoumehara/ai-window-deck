// Device catalog for the mobile preview. The website hosts devices.json, so
// new models arrive without an app update; this app ships a copy
// (devices.json beside this file) for offline use and keeps the last one it
// fetched in its user data.
//   { version, updated, devices: [{ id, name, os, type, width, height, dpr,
//     ua, cutout?, radius?, model?, approx?, hidden? }] }
// width and height are the portrait viewport in CSS pixels. "{chrome}" in a
// user agent stands for the Chromium major version the app runs.

const OS = new Set(["ios", "ipados", "android"]);
const TYPES = new Set(["phone", "tablet", "foldable"]);
const CUTOUTS = new Set(["island", "notch", "punch", "none"]);

const inRange = (value, min, max) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

function normalizeDevice(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const ua = typeof raw.ua === "string" ? raw.ua.trim() : "";
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id) || !name || !ua || !OS.has(raw.os)) return null;
  if (!inRange(raw.width, 200, 3000) || !inRange(raw.height, 200, 3000) || !inRange(raw.dpr, 1, 5)) return null;
  return {
    id,
    name: name.slice(0, 60),
    os: raw.os,
    type: TYPES.has(raw.type) ? raw.type : "phone",
    width: Math.round(raw.width),
    height: Math.round(raw.height),
    dpr: raw.dpr,
    ua,
    cutout: CUTOUTS.has(raw.cutout) ? raw.cutout : "none",
    radius: inRange(raw.radius, 0, 120) ? raw.radius : 0,
    model: typeof raw.model === "string" ? raw.model.slice(0, 60) : "",
    approx: raw.approx === true,
    hidden: raw.hidden === true,
  };
}

// A catalog with only valid, distinct devices, or null when there's none.
function normalizeCatalog(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.devices)) return null;
  const seen = new Set();
  const devices = [];
  for (const entry of raw.devices) {
    const device = normalizeDevice(entry);
    if (!device || seen.has(device.id)) continue;
    seen.add(device.id);
    devices.push(device);
  }
  if (!devices.length) return null;
  return {
    version: Number.isInteger(raw.version) ? raw.version : 1,
    updated: typeof raw.updated === "string" ? raw.updated : "",
    devices,
  };
}

// Which of two catalogs is more recent, by date then version.
function isNewer(candidate, current) {
  if (!candidate) return false;
  if (!current) return true;
  if (candidate.updated !== current.updated) return candidate.updated > current.updated;
  return candidate.version > current.version;
}

// The more recent catalog decides (its order, its entries, and `hidden`
// retires a model); devices only the other one knows stay at the end, so a
// window set to one of them keeps working.
function mergeCatalogs(a, b) {
  const [newer, older] = isNewer(a, b) ? [a, b] : [b, a];
  if (!newer) return null;
  const known = new Set(newer.devices.map((device) => device.id));
  const devices = [...newer.devices, ...(older?.devices ?? []).filter((device) => !known.has(device.id))];
  return { ...newer, devices: devices.filter((device) => !device.hidden) };
}

module.exports = { normalizeDevice, normalizeCatalog, mergeCatalogs, isNewer };
