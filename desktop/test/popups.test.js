import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const popups = createRequire(import.meta.url)("../electron/popups.cjs");

test("sign-in and OAuth pages are recognised, ordinary pages are not", () => {
  for (const url of [
    "https://github.com/login",
    "https://github.com/login/oauth/authorize?client_id=Iv1.x&scope=",
    "https://github.com/session",
    "https://github.com/sessions/two-factor/app",
    "https://vercel.com/api/registration/login-with-github?mode=login",
    "https://vercel.com/login",
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=x",
    "https://appleid.apple.com/auth/authorize?client_id=x",
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    "https://dev-123.us.auth0.com/authorize?x",
    "https://auth.openai.com/authorize?x",
    "https://example.com/oauth/authorize?client_id=x",
    "https://id.example.org/sso/start",
  ]) assert.ok(popups.isAuthUrl(url), url);
  for (const url of [
    "https://github.com/",
    "https://github.com/takaoumehara/ai-window-deck/pull/17",
    "https://vercel.com/dashboard",
    "https://example.com/login-tips-article",
    "mailto:me@example.com",
    "not a url",
  ]) assert.ok(!popups.isAuthUrl(url), url);
});

test("popups that need their opener become windows; links stay in the pane", () => {
  const kind = (url, disposition) => popups.classifyPopup({ url, disposition });
  assert.equal(kind("https://github.com/login/oauth/authorize?x", "new-window"), "window");
  assert.equal(kind("https://example.com/share", "new-window"), "window");
  // window.open(authUrl) without features used to load over the page that opened it.
  assert.equal(kind("https://github.com/login/oauth/authorize?x", "foreground-tab"), "window");
  assert.equal(kind("https://accounts.google.com/o/oauth2/v2/auth?x", "foreground-tab"), "window");
  assert.equal(kind("about:blank", "foreground-tab"), "window");
  assert.equal(kind("", "foreground-tab"), "window");
  assert.equal(kind("https://example.com/article", "foreground-tab"), "pane");
  assert.equal(kind("https://github.com/login", "background-tab"), "pane");
  assert.equal(kind("mailto:me@example.com", "foreground-tab"), "external");
  assert.equal(kind("zoommtg://zoom.us/join?x", "foreground-tab"), "external");
});

test("a popup completes when it reaches the opener's site after a sign-in page", () => {
  const opener = "https://app.example.com/settings";
  assert.ok(popups.popupCompleted(["https://github.com/login/oauth/authorize?x", "https://github.com/login", "https://example.com/api/auth/callback/github?code=1"], opener));
  assert.ok(!popups.popupCompleted(["https://github.com/login/oauth/authorize?x", "https://github.com/login"], opener), "closed on the sign-in page");
  assert.ok(!popups.popupCompleted(["https://example.com/share?x"], opener), "never saw a sign-in page");
  assert.equal(popups.siteOf("https://a.b.example.co.jp/x"), "example.co.jp");
  assert.equal(popups.siteOf("https://www.vercel.com/"), "vercel.com");
});

test("popup size comes from window.open features within bounds", () => {
  assert.deepEqual(popups.popupSize("width=600,height=700,left=10"), { width: 600, height: 700 });
  assert.deepEqual(popups.popupSize("popup"), { width: 520, height: 720 });
  assert.deepEqual(popups.popupSize("width=5000, height=100", { width: 1440, height: 900 }), { width: 1440, height: 320 });
});

test("provider sign-in finishes on the provider's own pages, not mid-flow", () => {
  const github = popups.signInProvider("github");
  const vercel = popups.signInProvider("vercel");
  assert.equal(popups.signInProvider("nope"), null);
  assert.equal(popups.signInProvider("toString"), null);
  assert.ok(!popups.providerFinished(github, "https://github.com/login"));
  assert.ok(!popups.providerFinished(github, "https://github.com/sessions/two-factor/mobile"));
  assert.ok(!popups.providerFinished(github, "https://accounts.google.com/v3/signin/identifier"));
  assert.ok(popups.providerFinished(github, "https://github.com/"));
  assert.ok(popups.providerFinished(github, "https://github.com/takaoumehara"));
  assert.ok(!popups.providerFinished(vercel, "https://vercel.com/login"));
  assert.ok(!popups.providerFinished(vercel, "https://github.com/login/oauth/authorize?client_id=Iv1.x"));
  assert.ok(!popups.providerFinished(vercel, "https://vercel.com/api/registration/login-with-github?mode=login"));
  assert.ok(!popups.providerFinished(vercel, "https://github.com/"), "GitHub's home is not Vercel's");
  assert.ok(!popups.providerFinished(vercel, "https://vercel.com/"), "signed-out home page");
  assert.ok(!popups.providerFinished(vercel, "https://vercel.com/docs/deployments"));
  assert.ok(popups.providerFinished(vercel, "https://vercel.com/dashboard"));
  assert.ok(popups.providerFinished(vercel, "https://vercel.com/my-team/project"));
  assert.ok(!popups.providerFinished(vercel, "http://vercel.com/dashboard"), "only https");
  assert.ok(popups.waitsOnProvider(github, "https://github.com/login?client_id=Iv1.x&return_to=%2Flogin%2Foauth%2Fauthorize"));
  assert.ok(!popups.waitsOnProvider(github, "https://github.com/"));
  assert.ok(!popups.waitsOnProvider(vercel, "https://accounts.google.com/v3/signin/identifier"), "other hosts are left alone");
});
