// Where a page's new windows go, and the providers the deck can sign in to
// from its own window. Pure functions; main.cjs applies them.

const parse = (url) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const hostOf = (url) => parse(url)?.hostname.toLowerCase() ?? "";
const pathOf = (url) => parse(url)?.pathname ?? "";

// [host, path] pairs; a host pattern alone covers every path on it.
const AUTH_PAGES = [
  [/^github\.com$/, /^\/(login|session|sessions|signup|join|password_reset)(\/|$)/i],
  [/^gitlab\.com$/, /^\/(users\/sign_in|users\/auth|oauth)(\/|$)/i],
  [/^bitbucket\.org$/, /^\/site\/oauth2(\/|$)/i],
  [/^(www\.)?vercel\.com$/, /^\/(login|signup|api\/auth|api\/registration|oauth|sso-api|integrations\/.+\/callback)(\/|$)/i],
  [/^accounts\.google\.[a-z.]+$/, null],
  [/^(appleid|idmsa)\.apple\.com$/, null],
  [/^login\.(microsoftonline|live|microsoft)\.com$/, null],
  [/^auth\.openai\.com$/, null],
  [/(^|\.)auth0\.com$/, null],
  [/(^|\.)okta\.com$/, null],
  [/(^|\.)onelogin\.com$/, null],
  [/^(clerk\.|accounts\.).+/, /^\/(sign-in|sign-up|v1\/oauth|oauth)(\/|$)/i],
  [/(^|\.)clerk\.accounts\.dev$/, null],
  [/(^|\.)supabase\.co$/, /^\/auth\//i],
  [/(^|\.)slack\.com$/, /^\/(oauth|openid|signin)(\/|$)/i],
  [/^discord\.com$/, /^\/(oauth2|login)(\/|$)/i],
  [/^(x|twitter)\.com$/, /^\/(i\/oauth2|oauth|i\/flow\/login)(\/|$)/i],
  [/^api\.twitter\.com$/, /^\/oauth/i],
  [/(^|\.)facebook\.com$/, /^\/(v[\d.]+\/)?dialog\/oauth/i],
  [/^(www\.)?linkedin\.com$/, /^\/oauth/i],
  [/^(www\.)?notion\.so$/, /^\/(login|oauth|install-integration)/i],
  [/^(www\.)?figma\.com$/, /^\/(login|oauth)/i],
];

// Any site's own OAuth or SSO endpoints, whatever the host.
const AUTH_PATHS = /\/(oauth2?|openid-connect|saml2?|sso)(\/(authorize|auth|login|start|initiate|callback))?(\/|$)|\/authorize(\/|$)/i;

/** A page of a sign-in or OAuth flow. */
function isAuthUrl(url) {
  const at = parse(url);
  if (!at || !/^https?:$/.test(at.protocol)) return false;
  const host = at.hostname.toLowerCase();
  for (const [hostPattern, pathPattern] of AUTH_PAGES) {
    if (hostPattern.test(host) && (!pathPattern || pathPattern.test(at.pathname))) return true;
  }
  return AUTH_PATHS.test(at.pathname);
}

/**
 * Where window.open and target=_blank go: "window" for a real popup window
 * (the page asked for one with size features, or it is a sign-in page that
 * reports back to its opener), "pane" to load in the same pane, "external"
 * for mailto:, app links and the like.
 */
function classifyPopup({ url, disposition }) {
  // window.open() with no URL hands the script a blank window it then sends
  // to a sign-in page, so it needs a real window to keep its opener.
  if (!url || url === "about:blank") return "window";
  const at = parse(url);
  if (!at) return "pane";
  if (!/^https?:$/.test(at.protocol)) return at.protocol === "about:" || at.protocol === "blob:" ? "pane" : "external";
  if (disposition === "new-window") return "window";
  if ((disposition === "foreground-tab" || disposition === "default" || disposition === "other") && isAuthUrl(url)) return "window";
  return "pane";
}

// "example.com" for www.example.com and app.example.com, "example.co.jp" for a.example.co.jp.
function siteOf(url) {
  const labels = hostOf(url).split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const second = labels[labels.length - 2];
  const keep = labels[labels.length - 1].length === 2 && /^(co|com|ac|ne|or|go|net|org|gov|edu)$/.test(second) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

/**
 * A popup finished a sign-in when, after a sign-in page, it reached a page on
 * the opener's site (the OAuth callback). Popups closed by the user before
 * that, or that never showed a sign-in page, didn't.
 */
function popupCompleted(visited, openerUrl) {
  const site = siteOf(openerUrl);
  let signedIn = false;
  for (const url of visited) {
    if (isAuthUrl(url)) signedIn = true;
    else if (signedIn && site && siteOf(url) === site) return true;
  }
  return false;
}

const GITHUB_FLOW = [/^github\.com$/, /^\/(login|session|sessions|signup|join|password_reset|logout)(\/|$)/i];

// Sign-ins the deck opens in its own window (File → Sign in to…). Google has
// its own window (google-signin.cjs); the others run here. The flow is every
// page a sign-in passes through, including the other providers a site offers
// ("Continue with GitHub" on Vercel); the first page outside it on the
// provider's own host means the sign-in is done.
const PROVIDERS = {
  github: {
    name: "GitHub",
    start: "https://github.com/login",
    hosts: [/^github\.com$/, /^gist\.github\.com$/],
    // Signed-out visitors can browse github.com too; this cookie says who is signed in.
    cookie: { url: "https://github.com", name: "logged_in", value: "yes" },
    flow: [GITHUB_FLOW],
  },
  vercel: {
    name: "Vercel",
    start: "https://vercel.com/login",
    hosts: [/^(www\.)?vercel\.com$/],
    flow: [
      // Public pages a signed-out visitor can reach from the sign-in page.
      [/^(www\.)?vercel\.com$/, /^\/(|home|docs|pricing|blog|templates|enterprise|contact|products|solutions|customers|changelog|legal|careers|about|ai|guides|help|security|partners|events)(\/|$)/i],
      [/^(www\.)?vercel\.com$/, /^\/(login|signup|logout|api|oauth|sso-api|sso|two-factor|verify|confirm|notifications\/email-confirm)(\/|$)/i],
      GITHUB_FLOW,
      [/^github\.com$/, /^\/login\/oauth(\/|$)/i],
      [/^gitlab\.com$/, null],
      [/^bitbucket\.org$/, null],
      [/^accounts\.google\.[a-z.]+$/, null],
      [/^(appleid|idmsa)\.apple\.com$/, null],
      [/^auth\.openai\.com$/, null],
      [/^(chatgpt|openai)\.com$/, /^\/(auth|oauth)/i],
    ],
  },
};

const matches = (rules, url) => {
  const host = hostOf(url);
  const pathname = pathOf(url);
  return rules.some(([hostPattern, pathPattern]) => hostPattern.test(host) && (!pathPattern || pathPattern.test(pathname)));
};

function signInProvider(id) {
  return Object.hasOwn(PROVIDERS, id) ? { id, ...PROVIDERS[id] } : null;
}

const onProviderHost = (provider, url) => /^https:/i.test(url) && provider.hosts.some((pattern) => pattern.test(hostOf(url)));

/**
 * The sign-in window reached the provider's own pages past its sign-in. The
 * same test picks the panes to reload afterwards, so they show the session.
 */
function providerFinished(provider, url) {
  return onProviderHost(provider, url) && !matches(provider.flow, url);
}

/**
 * A pane waiting on the provider's own sign-in page (GitHub's login with a
 * return_to for another app's OAuth, say). Loaded again once the sign-in is
 * done, it carries on to where it was going.
 */
function waitsOnProvider(provider, url) {
  return onProviderHost(provider, url) && matches(provider.flow, url);
}

/** width/height from window.open features, kept on screen-sized bounds. */
function popupSize(features = "", { width: maxWidth = 1600, height: maxHeight = 1000 } = {}) {
  const read = (name) => {
    const found = new RegExp(`(?:^|[,\\s])${name}\\s*=\\s*(\\d+)`, "i").exec(features);
    return found ? Number(found[1]) : null;
  };
  const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
  return {
    width: clamp(read("width") ?? 520, 320, maxWidth),
    height: clamp(read("height") ?? 720, 320, maxHeight),
  };
}

module.exports = { isAuthUrl, classifyPopup, siteOf, popupCompleted, signInProvider, providerFinished, waitsOnProvider, popupSize, PROVIDERS };
