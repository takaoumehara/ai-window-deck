import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { brandList, desktopIdentity, isSignInPage, signInVariant, clientHintHeaders, acceptedHints, withIdentity, acceptLanguages } =
  createRequire(import.meta.url)("../electron/identity.cjs");

const mac = desktopIdentity({ chromeVersion: "140.0.7339.249", platform: "darwin", arch: "arm64", systemVersion: "15.6.1" });

test("the user agent is a reduced desktop Chrome one, with no Electron or app name", () => {
  assert.equal(mac.userAgent, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36");
  assert.equal(mac.platform, "MacIntel");
  const win = desktopIdentity({ chromeVersion: "141.0.7390.1", platform: "win32", arch: "x64", systemVersion: "10.0.26100" });
  assert.equal(win.userAgent, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");
  assert.equal(win.metadata.platform, "Windows");
  assert.equal(win.metadata.architecture, "x86");
  const linux = desktopIdentity({ chromeVersion: "140.0.7339.249", platform: "linux", arch: "x64", systemVersion: "6.12.94+" });
  assert.match(linux.userAgent, /\(X11; Linux x86_64\)/);
  assert.equal(linux.metadata.platformVersion, "6.12.94");
  for (const identity of [mac, win, linux]) assert.doesNotMatch(identity.userAgent, /Electron|AIWindowDeck|ai-window-deck/i);
});

test("brands match Chrome's greased list for the version, Google Chrome included", () => {
  // Chrome 140 on macOS sends exactly this sec-ch-ua.
  assert.equal(clientHintHeaders(mac.metadata)["sec-ch-ua"], '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"');
  assert.deepEqual(brandList(140, "140.0.7339.249").map(({ version }) => version), ["140.0.7339.249", "24.0.0.0", "140.0.7339.249"]);
  for (const major of [138, 139, 141, 142, 143, 144]) {
    const brands = brandList(major).map(({ brand }) => brand);
    assert.equal(brands.length, 3);
    assert.ok(brands.includes("Google Chrome") && brands.includes("Chromium"));
  }
});

test("metadata describes the real OS and architecture", () => {
  assert.equal(mac.metadata.platform, "macOS");
  assert.equal(mac.metadata.platformVersion, "15.6.1");
  assert.equal(mac.metadata.architecture, "arm");
  assert.equal(mac.metadata.mobile, false);
  assert.equal(mac.metadata.fullVersion, "140.0.7339.249");
  const hints = clientHintHeaders(mac.metadata);
  assert.equal(hints["sec-ch-ua-mobile"], "?0");
  assert.equal(hints["sec-ch-ua-platform"], '"macOS"');
  assert.equal(hints["sec-ch-ua-form-factors"], '"Desktop"');
});

test("requests carry the user agent, the default hints, and the ones the origin asked for", () => {
  const hints = clientHintHeaders(mac.metadata);
  const headers = { "User-Agent": "Electron", Accept: "*/*", "sec-ch-ua": '"Chromium";v="140"' };
  const plain = withIdentity("https://example.com/", headers, { userAgent: mac.userAgent, hints });
  assert.equal(plain["User-Agent"], mac.userAgent);
  assert.equal(plain["sec-ch-ua"], hints["sec-ch-ua"]);
  assert.equal(plain["sec-ch-ua-platform"], '"macOS"');
  assert.equal(plain["sec-ch-ua-full-version-list"], undefined);
  assert.equal(plain.Accept, "*/*");
  const accepted = acceptedHints(["Sec-CH-UA-Arch, Sec-CH-UA-Full-Version-List", "Downlink, Sec-CH-Prefers-Color-Scheme"]);
  assert.deepEqual(accepted, ["sec-ch-ua-arch", "sec-ch-ua-full-version-list"]);
  const opted = withIdentity("https://accounts.google.com/x", headers, { userAgent: mac.userAgent, hints, accepted });
  assert.equal(opted["sec-ch-ua-arch"], '"arm"');
  assert.equal(opted["sec-ch-ua-full-version-list"], hints["sec-ch-ua-full-version-list"]);
  const insecure = withIdentity("http://example.com/", headers, { userAgent: mac.userAgent, hints });
  assert.deepEqual(insecure, { "User-Agent": mac.userAgent, Accept: "*/*" });
  assert.equal(withIdentity("http://localhost:5174/", headers, { userAgent: mac.userAgent, hints })["sec-ch-ua-mobile"], "?0");
});

test("Google's sign-in page sees the browser without the Chrome token or Chrome hints", () => {
  assert.ok(isSignInPage("https://accounts.google.com/v3/signin/identifier?hl=ja"));
  assert.ok(!isSignInPage("https://mail.google.com/"));
  assert.ok(!isSignInPage("https://accounts.google.com.evil.example/"));
  assert.ok(!isSignInPage("not a url"));
  const signIn = signInVariant(mac);
  assert.equal(signIn.userAgent, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36");
  assert.equal(signIn.metadata, null);
  assert.equal(signInVariant(mac), signIn);
  const headers = withIdentity("https://accounts.google.com/", { "sec-ch-ua": "x" }, { userAgent: signIn.userAgent, hints: clientHintHeaders(signIn.metadata), accepted: ["sec-ch-ua-arch"] });
  assert.deepEqual(Object.keys(headers), []);
  const safari = { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1", metadata: null };
  assert.equal(signInVariant(safari), safari);
});

test("accept-language lists each regional tag with its base language, once", () => {
  assert.equal(acceptLanguages(["ja-JP", "en-US", "en-GB"]), "ja-JP,ja,en-US,en,en-GB");
  assert.equal(acceptLanguages(["en-US", "en"]), "en-US,en");
  assert.equal(acceptLanguages([]), "en-US,en");
});
