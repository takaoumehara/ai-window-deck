import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const google = createRequire(import.meta.url)("../electron/google-signin.cjs");

test("Google hosts, the sign-in flow and the pages that move to the sign-in window", () => {
  for (const url of ["https://mail.google.com/mail/u/0/", "https://www.google.co.jp/", "https://drive.google.com", "https://www.youtube.com/", "https://gmail.com"]) {
    assert.ok(google.isGoogleHost(url), url);
  }
  for (const url of ["https://claude.ai", "https://notgoogle.com", "https://google.evil.example", "not a url"]) assert.ok(!google.isGoogleHost(url), url);

  assert.ok(google.isSignInFlow("https://accounts.google.com/v3/signin/identifier?continue=x"));
  assert.ok(google.isSignInFlow("https://accounts.youtube.com/accounts/SetSID?x"));
  assert.ok(google.isSignInFlow("https://accounts.google.co.jp/accounts/SetSID"));
  assert.ok(google.isSignInFlow("https://www.google.com/accounts/SetSID?ssdc=1"));
  assert.ok(!google.isSignInFlow("https://mail.google.com/mail/"));
  assert.ok(!google.isSignInFlow("https://claude.ai/api/auth/callback?code=1"));

  assert.ok(google.isSignInPage("https://accounts.google.com/v3/signin/identifier?flowName=GlifWebSignIn"));
  assert.ok(google.isSignInPage("https://accounts.google.com/ServiceLogin?service=mail"));
  assert.ok(google.isSignInPage("https://accounts.google.com/signin/v2/identifier"));
  assert.ok(google.isSignInPage("https://accounts.google.com/AccountChooser?continue=x"));
  assert.ok(!google.isSignInPage("https://accounts.google.com/o/oauth2/v2/auth?client_id=x"));
  assert.ok(!google.isSignInPage("https://myaccount.google.com/"));

  assert.ok(google.isRejected("https://accounts.google.com/v3/signin/rejected?x"));
  assert.ok(google.isRejected("https://accounts.google.com/signin/v2/deniedsigninrejected"));
  assert.ok(!google.isRejected("https://accounts.google.com/v3/signin/challenge/pwd"));
});

test("after the Google session changes, Google pages reload and the sign-in flow doesn't", () => {
  assert.ok(google.reloadsWithGoogleSession("https://mail.google.com/mail/u/0/#inbox"));
  assert.ok(google.reloadsWithGoogleSession("https://www.youtube.com/"));
  assert.ok(!google.reloadsWithGoogleSession("https://accounts.google.com/v3/signin/identifier"));
  assert.ok(!google.reloadsWithGoogleSession("https://claude.ai/"));
  assert.ok(!google.reloadsWithGoogleSession("about:blank"));
  assert.ok(google.isSessionCookie({ name: "SID", domain: ".google.com" }));
  assert.ok(!google.isSessionCookie({ name: "SID", domain: ".youtube.com" }));
  assert.ok(!google.isSessionCookie({ name: "__Secure-1PSIDTS", domain: ".google.com" }));
});

test("the sign-in window tries Chrome without its token, then Firefox", () => {
  assert.equal(google.SIGN_IN_STRATEGIES[0], "chromeless");
  assert.equal(google.nextStrategy("chromeless"), "firefox");
  assert.equal(google.nextStrategy("firefox"), null);
  const firefox = google.firefoxIdentity({ chromeVersion: "140.0.7339.249", platform: "darwin" });
  assert.equal(firefox.userAgent, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0");
  assert.equal(firefox.metadata, null);
  assert.ok(!/Chrome|Electron/.test(firefox.userAgent));
});
