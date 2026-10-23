// Google sign-in across the deck. Every pane, popup and deck window shares
// the persist:deck session, so one sign-in covers all of them; what this
// module decides is where the sign-in itself happens and which pages to
// reload once the session changes.

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const pathOf = (url) => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

// google.com, google.co.jp, mail.google.com, youtube.com, gmail.com…
function isGoogleHost(url) {
  const host = hostOf(url);
  return /(^|\.)google\.(com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host) || /(^|\.)(youtube|gmail)\.com$/.test(host);
}

const isAccountsHost = (host) => /^accounts\.google\.(com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host) || host === "accounts.youtube.com";

// Hosts a Google sign-in passes through: the accounts pages, the cookie
// hand-offs to other Google domains (SetSID), and the security prompts.
function isSignInFlow(url) {
  const host = hostOf(url);
  if (isAccountsHost(host) || host === "gds.google.com") return true;
  return isGoogleHost(url) && /^\/accounts\/SetSID/i.test(pathOf(url));
}

// The pages that ask for an account, password or second step; these move to
// the sign-in window. The OAuth consent and account chooser (/o/oauth2) stay
// where they are until they need a password.
const SIGN_IN_PATHS = /^\/(v\d\/)?(signin|ServiceLogin|AccountChooser|InteractiveLogin|AddSession)(\/|$)/i;

function isSignInPage(url) {
  return /^accounts\.google\.com$/.test(hostOf(url)) && SIGN_IN_PATHS.test(pathOf(url));
}

// "This browser or app may not be secure."
function isRejected(url) {
  return isSignInFlow(url) && /\/rejected(\/|$)|deniedsigninrejected/i.test(pathOf(url));
}

/** Pages to reload after the Google session changes, so they show it. */
function reloadsWithGoogleSession(url) {
  return /^https:/i.test(url) && isGoogleHost(url) && !isSignInFlow(url);
}

// The SID cookie on .google.com exists exactly while an account is signed in.
function isSessionCookie(cookie) {
  return cookie?.name === "SID" && /^\.?google\.com$/.test(cookie.domain || "");
}

// Identities the sign-in window can present, in the order it tries them.
// Google rejects Electron claiming Chrome, so "chromeless" is the desktop
// identity without the Chrome token (as Ferdium does); "firefox" claims a
// current Firefox, whose sign-in checks don't look for Chrome's internals.
const SIGN_IN_STRATEGIES = ["chromeless", "firefox"];

const FIREFOX_PLATFORMS = {
  darwin: { token: "Macintosh; Intel Mac OS X 10.15", navigator: "MacIntel" },
  win32: { token: "Windows NT 10.0; Win64; x64", navigator: "Win32" },
  linux: { token: "X11; Linux x86_64", navigator: "Linux x86_64" },
};

// Firefox's version tracks Chrome's within a release or two.
function firefoxIdentity({ chromeVersion, platform }) {
  const version = parseInt(String(chromeVersion), 10);
  const os = FIREFOX_PLATFORMS[platform] ?? FIREFOX_PLATFORMS.linux;
  return {
    userAgent: `Mozilla/5.0 (${os.token}; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`,
    platform: os.navigator,
    metadata: null,
  };
}

function nextStrategy(current) {
  const at = SIGN_IN_STRATEGIES.indexOf(current);
  return at >= 0 && at < SIGN_IN_STRATEGIES.length - 1 ? SIGN_IN_STRATEGIES[at + 1] : null;
}

// True when the active tab is a URL the user just added (＋, or a second copy
// of an address already open). Switching to a tab that was already in the list
// is not an open, so a saved Gmail tab can be shown without starting sign-in.
function userJustOpened(previousUrls, nextUrls, activeTab) {
  if (!Array.isArray(previousUrls) || !Array.isArray(nextUrls) || nextUrls.length <= previousUrls.length) return false;
  const remaining = previousUrls.slice();
  const added = [];
  for (const url of nextUrls) {
    const at = remaining.indexOf(url);
    if (at >= 0) remaining.splice(at, 1);
    else added.push(url);
  }
  return added.includes(nextUrls[activeTab]);
}

module.exports = {
  isGoogleHost, isSignInFlow, isSignInPage, isRejected, reloadsWithGoogleSession, isSessionCookie,
  SIGN_IN_STRATEGIES, firefoxIdentity, nextStrategy, userJustOpened,
};
