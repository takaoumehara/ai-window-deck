// How pages see the browser. Electron's own identity gives it away: the app's
// name and a full build number in the user agent, no "Google Chrome" brand in
// the client hints, and no client hint headers at all. Pages get exactly what
// a current desktop Chrome on the same OS sends, built from the Chromium
// version Electron actually runs.

const GREASE_CHARS = [" ", "(", ":", "-", ".", "/", ")", ";", "=", "?", "_"];
const GREASE_VERSIONS = ["8", "99", "24"];
const BRAND_ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

// Chromium's GetGreasedUserAgentBrandVersion, seeded by the major version, so
// the list and its order match a real Chrome of that version byte for byte.
function brandList(major, version = String(major)) {
  const grease = {
    brand: `Not${GREASE_CHARS[major % 11]}A${GREASE_CHARS[(major + 1) % 11]}Brand`,
    version: version.includes(".") ? `${GREASE_VERSIONS[major % 3]}.0.0.0` : GREASE_VERSIONS[major % 3],
  };
  const order = BRAND_ORDERS[major % 6];
  const list = [];
  list[order[0]] = grease;
  list[order[1]] = { brand: "Chromium", version };
  list[order[2]] = { brand: "Google Chrome", version };
  return list;
}

// User agent tokens are frozen by Chrome's UA reduction: macOS always reads
// 10_15_7 (Apple silicon too) and Windows always NT 10.0.
const UA_PLATFORMS = {
  darwin: { token: "Macintosh; Intel Mac OS X 10_15_7", navigator: "MacIntel", hint: "macOS" },
  win32: { token: "Windows NT 10.0; Win64; x64", navigator: "Win32", hint: "Windows" },
  linux: { token: "X11; Linux x86_64", navigator: "Linux x86_64", hint: "Linux" },
};

function platformVersionOf(platform, systemVersion) {
  const parts = (String(systemVersion || "").match(/\d+(\.\d+)*/)?.[0] ?? "").split(".").filter(Boolean).slice(0, 3);
  if (platform === "win32") return parts[0] === "10" ? "10.0.0" : "15.0.0";
  while (parts.length < 3) parts.push("0");
  return parts.join(".");
}

/**
 * Desktop Chrome as seen by pages: `userAgent` for the header and navigator,
 * `platform` for navigator.platform, `metadata` for client hints (the CDP
 * Emulation.UserAgentMetadata shape).
 */
function desktopIdentity({ chromeVersion, platform, arch, systemVersion }) {
  const fullVersion = String(chromeVersion);
  const major = parseInt(fullVersion, 10);
  const os = UA_PLATFORMS[platform] ?? UA_PLATFORMS.linux;
  return {
    userAgent: `Mozilla/5.0 (${os.token}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`,
    platform: os.navigator,
    metadata: {
      brands: brandList(major),
      fullVersionList: brandList(major, fullVersion),
      fullVersion,
      platform: os.hint,
      platformVersion: platformVersionOf(platform, systemVersion),
      architecture: /^arm/.test(arch) ? "arm" : "x86",
      model: "",
      mobile: false,
      bitness: "64",
      wow64: false,
      formFactors: ["Desktop"],
    },
  };
}

// Chrome on Android reports this platform string. The last character is the
// letter l, matching Chromium; a digit there is a different platform.
const ANDROID_PLATFORM = "Linux armv8l";

/**
 * A device from the catalog (electron/devices.cjs) as pages see it.
 *
 * The preview is Chromium even when the frame is an iPhone or iPad. Sending
 * the catalog's Safari user agent (no Chrome token, no client hints) makes
 * Cloudflare Turnstile reject the sign-in: the widget sees Blink and
 * navigator.vendor "Google Inc." while the page claims to be Safari, and the
 * form comes back "the check that you're a person didn't go through"
 * (error code Turnstile). Phones therefore present mobile Chrome, and tablets
 * present Chrome without the Mobile token, with client hints that match.
 * Android catalog entries already carry that Chrome user agent; a Safari
 * string in the catalog is not what the page sends.
 */
function deviceIdentity(device, { chromeVersion }) {
  const fullVersion = String(chromeVersion);
  const major = parseInt(fullVersion, 10);
  const catalogUa = device.ua.replace(/\{chrome\}/g, String(major));
  const chromeUa = /Chrome\/\d/.test(catalogUa) && !/CriOS\//.test(catalogUa);
  const tablet = device.type === "tablet";
  const userAgent = chromeUa
    ? catalogUa
    : tablet
      ? `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`
      : `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Mobile Safari/537.36`;
  return {
    userAgent,
    platform: ANDROID_PLATFORM,
    metadata: {
      brands: brandList(major),
      fullVersionList: brandList(major, fullVersion),
      fullVersion,
      platform: "Android",
      platformVersion: "15.0.0",
      architecture: "",
      model: device.model || "",
      mobile: !tablet,
      bitness: "",
      wow64: false,
      formFactors: [tablet ? "Tablet" : "Mobile"],
    },
  };
}

const quote = (value) => `"${value}"`;
const brandHeader = (list) => list.map(({ brand, version }) => `${quote(brand)};v=${quote(version)}`).join(", ");

// Client hint request headers for the metadata, keyed by lowercase name.
function clientHintHeaders(metadata) {
  if (!metadata) return {};
  return {
    "sec-ch-ua": brandHeader(metadata.brands),
    "sec-ch-ua-mobile": metadata.mobile ? "?1" : "?0",
    "sec-ch-ua-platform": quote(metadata.platform),
    "sec-ch-ua-platform-version": quote(metadata.platformVersion),
    "sec-ch-ua-full-version": quote(metadata.fullVersion),
    "sec-ch-ua-full-version-list": brandHeader(metadata.fullVersionList),
    "sec-ch-ua-arch": quote(metadata.architecture),
    "sec-ch-ua-bitness": quote(metadata.bitness),
    "sec-ch-ua-model": quote(metadata.model),
    "sec-ch-ua-wow64": metadata.wow64 ? "?1" : "?0",
    "sec-ch-ua-form-factors": metadata.formFactors.map(quote).join(", "),
  };
}

// Google's sign-in page checks a browser that claims to be Chrome far more
// strictly than any other, and still tells Electron apart however complete
// the Chrome identity is ("This browser or app may not be secure"). There
// the page sees the same browser without the Chrome token or Chrome client
// hints, which Google checks like any other WebKit browser. Identities that
// don't claim Chrome (mobile Safari) stay as they are.
const SIGN_IN_HOSTS = new Set(["accounts.google.com"]);

function isSignInPage(url) {
  try {
    return SIGN_IN_HOSTS.has(new URL(url).host);
  } catch {
    return false;
  }
}

const signInVariants = new WeakMap();
function signInVariant(identity) {
  if (!/\sChrome\/\S+/.test(identity.userAgent)) return identity;
  if (!signInVariants.has(identity)) {
    signInVariants.set(identity, { ...identity, userAgent: identity.userAgent.replace(/\sChrome\/\S+/, ""), metadata: null });
  }
  return signInVariants.get(identity);
}

const DEFAULT_HINTS = ["sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform"];

// UA hint names an Accept-CH response header opts into, lowercased.
function acceptedHints(values) {
  const list = [].concat(values ?? []).join(",").split(",");
  return list.map((name) => name.trim().toLowerCase()).filter((name) => name.startsWith("sec-ch-ua"));
}

const isSecure = (url) => /^https:/i.test(url) || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//i.test(url);

// Request headers carrying the page's identity. Like Chrome, every secure
// request gets the three default client hints, and an origin that asked for
// more with Accept-CH gets those too. Hint headers already present are
// replaced, so they always match the user agent. Null when nothing changes.
function withIdentity(url, requestHeaders, { userAgent, hints, accepted = [] }) {
  const next = {};
  for (const [name, value] of Object.entries(requestHeaders)) {
    const lower = name.toLowerCase();
    if (lower === "user-agent") next[name] = userAgent;
    else if (!lower.startsWith("sec-ch-ua")) next[name] = value;
  }
  if (isSecure(url)) {
    for (const name of new Set([...DEFAULT_HINTS, ...accepted])) {
      if (name in hints) next[name] = hints[name];
    }
  }
  const before = Object.entries(requestHeaders);
  const same = before.length === Object.keys(next).length && before.every(([name, value]) => next[name] === value);
  return same ? null : next;
}

// Accept-Language and navigator.languages from the OS's preferred languages,
// the way Chrome lists them: each regional tag followed by its base language,
// without repeats ("ja-JP, en-US" → "ja-JP,ja,en-US,en").
function acceptLanguages(preferred) {
  const list = [];
  for (const tag of preferred ?? []) {
    if (!tag) continue;
    const base = tag.split("-")[0];
    for (const entry of [tag, base]) if (!list.includes(entry)) list.push(entry);
  }
  return (list.length ? list : ["en-US", "en"]).join(",");
}

module.exports = {
  brandList, desktopIdentity, deviceIdentity, isSignInPage, signInVariant, clientHintHeaders, acceptedHints, withIdentity, acceptLanguages,
};
