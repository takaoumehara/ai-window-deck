// Screenshots of the extension UI for the site, the READMEs and the store listing.
//
//   PLAYWRIGHT=/path/to/node_modules/playwright-core/index.mjs \
//   CHROME=/path/to/chrome \
//     node store-assets/capture-app-screens.mjs
//
// Serve the unpacked extension package (the folder with manifest.json) over HTTP first and
// point EXT_URL at its dist/index.html (default http://localhost:8782/dist/index.html).
// Outside an extension the panel keeps its state in localStorage, so it opens with the
// sample windows of a fresh install.
// Outputs in site/assets/img/ (1280 px wide):
//   0N-step*.png, 0N-step*-ja.png                     setup steps ①–④, light
//   register-{choose,bulk}-{en,ja}-{light,dark}.png   the register panel
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright-core");
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(repo, "site", "assets", "img");
const extUrl = process.env.EXT_URL ?? "http://localhost:8782/dist/index.html";

// UI strings come from the bundle so the clicks follow the panel's own wording.
const bundle = await (async () => {
  const html = await (await fetch(extUrl)).text();
  const js = html.match(/src="([^"]*app-[^"]*\.js)"/)[1];
  return (await fetch(new URL(js, extUrl))).text();
})();
function str(lang, key) {
  const at = bundle.indexOf(`${lang}:{appTitle:`);
  const m = bundle.slice(at).match(new RegExp(`[,{]${key}:("(?:[^"\\\\]|\\\\.)*")`));
  return JSON.parse(m[1]);
}

const BULK = {
  en: ["Research", "docs.example.com", "claude.ai", "Chat AI", "chatgpt.com", "", "Design", "Figma board", "figma.com"],
  ja: ["リサーチ", "docs.example.com", "claude.ai", "チャット AI", "chatgpt.com", "", "デザイン", "Figma のボード", "figma.com"],
};
const STEPS = ["01-step1-urls", "02-step2-layout", "03-step3-focus", "04-step4-launch"];

const browser = await chromium.launch({ executablePath: process.env.CHROME });
const errors = [];

async function open(lang, theme, height = 900, query = "") {
  const ctx = await browser.newContext({ viewport: { width: 1280, height }, screen: { width: 1920, height: 1080 }, locale: lang === "ja" ? "ja-JP" : "en-US", reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${lang}-${theme}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${lang}-${theme}: ${m.text()}`));
  await page.goto(extUrl + query);
  await page.getByRole("button", { name: str(lang, "obDontShow") }).click();
  if (theme === "dark") await page.getByRole("button", { name: str(lang, "themeDark") }).click();
  await page.getByRole("button", { name: str(lang, "editSet"), exact: true }).first().click();
  await page.addStyleTag({ content: "*{caret-color:transparent!important}" });
  await page.waitForTimeout(400);
  return { ctx, page };
}

const save = async (page, name, opts = {}) => {
  await page.mouse.move(1, 1);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${name}.png`), ...opts });
  console.log(`site/assets/img/${name}.png`);
};

for (const lang of ["en", "ja"]) {
  const { ctx, page } = await open(lang, "light", 1333);
  await page.getByRole("button", { name: str(lang, "regTitleAdd") }).click();
  await page.getByTestId("register-choose-bulk").click();
  await page.getByTestId("register-panel").locator("textarea").fill("Google\ngoogle.com");
  await page.getByRole("button", { name: str(lang, "bulkSaveBtn") }).click();
  await page.getByTestId("placement-panel").getByText(str(lang, "bulkPlaceAuto")).click();
  await page.waitForTimeout(400);
  for (const [i, name] of STEPS.entries()) {
    await page.getByTestId(`step-${i + 1}`).click();
    await page.waitForTimeout(500);
    const bottom = await page.getByTestId("setup-flow").evaluate((el) => el.getBoundingClientRect().bottom);
    await save(page, lang === "en" ? name : `${name}-ja`, { clip: { x: 0, y: 0, width: 1280, height: Math.min(1333, Math.ceil(bottom) + 40) } });
  }
  await ctx.close();

  for (const theme of ["light", "dark"]) {
    // regPhase=3 holds the paste animation on its last phase, with the windows created.
    const { ctx, page } = await open(lang, theme, 900, "?regPhase=3");
    await page.getByRole("button", { name: str(lang, "regTitleAdd") }).click();
    await page.waitForTimeout(600);
    await save(page, `register-choose-${lang}-${theme}`);

    await page.getByTestId("register-choose-bulk").click();
    const panel = page.getByTestId("register-panel");
    await panel.locator("textarea").fill(BULK[lang].join("\n"));
    await panel.getByRole("button", { name: str(lang, "bulkSaveBtn") }).click();
    await page.waitForTimeout(400);
    await panel.locator("textarea").evaluate((t) => t.blur());
    await save(page, `register-bulk-${lang}-${theme}`, { clip: await panel.boundingBox().then((b) => ({ x: b.x - 16, y: b.y - 16, width: b.width + 32, height: b.height + 32 })) });
    await ctx.close();
  }
}

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
