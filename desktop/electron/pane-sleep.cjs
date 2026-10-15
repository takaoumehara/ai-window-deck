// Pane sleep: a page nobody has looked at for a while is closed to free memory
// and reopened at the same address when its pane or tab is shown again. The
// rules are deliberately conservative: anything that could lose work or news
// keeps the page awake.

const { choices: SLEEP_MINUTES, ...SLEEP_DEFAULTS } = require("./pane-sleep.json");

function sleepSettingsOf(saved) {
  const value = saved && typeof saved === "object" ? saved : {};
  return {
    enabled: value.enabled === undefined ? SLEEP_DEFAULTS.enabled : value.enabled === true,
    minutes: SLEEP_MINUTES.includes(value.minutes) ? value.minutes : SLEEP_DEFAULTS.minutes,
  };
}

/**
 * Why a page must stay awake, or null when it may sleep. `page` is what the
 * page itself reported (media playing, unsent text); it is only asked for once
 * the cheap checks pass, so it may be missing.
 */
function sleepBlocker(state, page = null) {
  if (state.keepAwake) return "keep-awake";
  if (state.displayed) return "shown";
  if (state.idleMs < state.limitMs) return "recent";
  if (state.aiStatus) return "ai";
  if (state.audible) return "audio";
  if (state.authPage || state.popupOpen) return "sign-in";
  if (state.loading) return "loading";
  if (!/^https?:\/\//i.test(state.url ?? "")) return "not-web";
  if (!page) return "unknown";
  if (page.media) return "media";
  if (page.draft) return "draft";
  return null;
}

// Runs in the page's isolated world: playing media, unsent text and where the
// page is scrolled. `hasDraft` comes from ai-status.cjs.
function pageReport(document, hasDraft) {
  const media = [...document.querySelectorAll("video, audio")].some((element) => !element.paused && !element.ended && element.readyState > 2);
  const scroller = document.scrollingElement || document.documentElement;
  return { media, draft: hasDraft(document), scrollX: scroller.scrollLeft, scrollY: scroller.scrollTop };
}

function reportScript(hasDraft) {
  return `(${pageReport})(document, ${hasDraft});`;
}

function restoreScrollScript(x, y) {
  const left = Number.isFinite(x) ? Math.max(0, Math.round(x)) : 0;
  const top = Number.isFinite(y) ? Math.max(0, Math.round(y)) : 0;
  return `(() => { const s = document.scrollingElement || document.documentElement; s.scrollLeft = ${left}; s.scrollTop = ${top}; })();`;
}

/**
 * Sleeping tabs follow their URL when tabs are opened, closed or reordered,
 * the same way live pages do; a tab whose URL left the list is forgotten.
 */
function regroupSleeping(sleeping, oldUrls, nextUrls, taken) {
  const pool = new Map();
  for (const [tabIndex, record] of sleeping) {
    const url = oldUrls[tabIndex];
    if (!pool.has(url)) pool.set(url, []);
    pool.get(url).push(record);
  }
  const next = new Map();
  nextUrls.forEach((url, tabIndex) => {
    if (taken.has(tabIndex)) return;
    const record = pool.get(url)?.shift();
    if (record) next.set(tabIndex, record);
  });
  return next;
}

module.exports = { SLEEP_DEFAULTS, SLEEP_MINUTES, sleepSettingsOf, sleepBlocker, pageReport, reportScript, restoreScrollScript, regroupSleeping };
