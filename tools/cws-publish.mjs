// Upload a package to the Chrome Web Store and optionally submit it for review.
//   node tools/cws-publish.mjs --check                      token + current item status only
//   node tools/cws-publish.mjs <zip>                        validate, then upload as a draft
//   node tools/cws-publish.mjs <zip> --publish              upload, then submit for review
//   node tools/cws-publish.mjs <zip> --publish --testers    submit to trusted testers only
//
// Needs CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN and CWS_EXTENSION_ID.
// The listing text and screenshots cannot be changed through this API; update them in
// the developer dashboard.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const API = "https://www.googleapis.com/chromewebstore/v1.1/items";
const UPLOAD_API = "https://www.googleapis.com/upload/chromewebstore/v1.1/items";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const zipArg = args.find((arg) => !arg.startsWith("--"));

const env = Object.fromEntries(
  ["CWS_CLIENT_ID", "CWS_CLIENT_SECRET", "CWS_REFRESH_TOKEN", "CWS_EXTENSION_ID"].map((name) => [name, process.env[name]]),
);
const missing = Object.keys(env).filter((name) => !env[name]);
if (missing.length) fail(`missing environment variables: ${missing.join(", ")}`);
if (!flags.has("--check") && !zipArg) fail("usage: node tools/cws-publish.mjs <zip> [--publish] [--testers] | --check");

const token = await accessToken();
const headers = { Authorization: `Bearer ${token}`, "x-goog-api-version": "2" };
const itemUrl = `${API}/${env.CWS_EXTENSION_ID}`;

if (flags.has("--check")) {
  report("draft item", await request(`${itemUrl}?projection=DRAFT`, { headers }));
  process.exit(0);
}

const zip = resolve(zipArg);
if (!existsSync(zip)) fail(`not found: ${zip}`);
execFileSync(process.execPath, [resolve(import.meta.dirname, "validate-package.mjs"), zip], { stdio: "inherit" });

let upload = await request(`${UPLOAD_API}/${env.CWS_EXTENSION_ID}`, { method: "PUT", headers, body: readFileSync(zip) });
for (let attempt = 0; upload.uploadState === "IN_PROGRESS" && attempt < 20; attempt += 1) {
  await new Promise((done) => setTimeout(done, 3000));
  upload = await request(`${itemUrl}?projection=DRAFT`, { headers });
}
report("upload", upload);
if (upload.uploadState !== "SUCCESS") fail("upload did not succeed");

if (flags.has("--publish")) {
  const target = flags.has("--testers") ? "?publishTarget=trustedTesters" : "";
  const published = await request(`${itemUrl}/publish${target}`, { method: "POST", headers: { ...headers, "Content-Length": "0" } });
  report("publish", published);
  const ok = (published.status ?? []).every((status) => status === "OK" || status === "ITEM_PENDING_REVIEW");
  if (!ok) fail("publish was not accepted");
} else {
  console.log("Uploaded as a draft. Re-run with --publish to submit it for review.");
}

async function accessToken() {
  const body = new URLSearchParams({
    client_id: env.CWS_CLIENT_ID,
    client_secret: env.CWS_CLIENT_SECRET,
    refresh_token: env.CWS_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const result = await request("https://oauth2.googleapis.com/token", { method: "POST", body });
  if (!result.access_token) fail("no access token returned");
  return result.access_token;
}

async function request(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!response.ok) fail(`${init?.method ?? "GET"} ${url.split("?")[0]} -> ${response.status}: ${JSON.stringify(json)}`);
  return json;
}

// Prints only state fields so tokens never reach the log.
function report(label, result) {
  const { id, crxVersion, uploadState, status, statusDetail, itemError } = result;
  console.log(`${label}:`, JSON.stringify({ id, crxVersion, uploadState, status, statusDetail, itemError }));
}

function fail(message) {
  console.error(`cws-publish: ${message}`);
  process.exit(1);
}
