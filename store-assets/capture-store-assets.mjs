// Chrome Web Store screenshots and promo tiles, captured from the real panel.
//
//   npm run build
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs \
//     node store-assets/capture-store-assets.mjs [out-dir] [locales]
//
//   out-dir  default: store-assets (writes screenshots/<locale>/NN-name.png,
//            promo-small.png, promo-marquee.png)
//   locales  default: en,ja  (any of en ja de es fr ko pt-BR zh-CN)
//
// Uses headless Chromium with the unpacked extension from the repo root, seeds
// chrome.storage with a sample workspace, and frames each capture under a
// caption band. Every PNG is exactly 1280x800 (promo: 440x280 / 1400x560) and
// flattened to opaque RGB by screenshotting with omitBackground off.
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(process.argv[2] ?? join(repo, "store-assets"));
const locales = (process.argv[3] ?? "en,ja").split(",");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const SAMPLES = {
  en: { preset: "AI research desk", windows: ["Research", "Chat AI", "Draft", "References", "Review"] },
  ja: { preset: "AI 調査デスク", windows: ["調査", "チャットAI", "下書き", "参考資料", "確認"] },
  de: { preset: "KI-Recherche", windows: ["Recherche", "KI-Chat", "Entwurf", "Quellen", "Prüfung"] },
  es: { preset: "Escritorio IA", windows: ["Investigación", "Chat IA", "Borrador", "Referencias", "Revisión"] },
  fr: { preset: "Bureau IA", windows: ["Recherche", "Chat IA", "Brouillon", "Références", "Relecture"] },
  ko: { preset: "AI 리서치 데스크", windows: ["조사", "AI 채팅", "초안", "참고 자료", "검토"] },
  "pt-BR": { preset: "Mesa de pesquisa IA", windows: ["Pesquisa", "Chat IA", "Rascunho", "Referências", "Revisão"] },
  "zh-CN": { preset: "AI 研究工作台", windows: ["研究", "AI 对话", "草稿", "参考资料", "审阅"] },
};

const CAPTIONS = {
  en: [
    ["Lay out your AI windows on a canvas", "Drag saved windows onto the canvas, then launch them all at once, tiled."],
    ["Spotlight one window, then snap back", "Alt+X enlarges the active window. Alt+Z puts it back in its tile."],
    ["A library of windows and URL sets", "Each window opens one or more tabs. Edit, reuse, and jump to what's open now."],
    ["Register one at a time, or in bulk", "Paste names and URLs as text, or import and export a .txt file."],
    ["One click from the toolbar", "8 languages. No account, no servers, no tracking. Your settings stay in Chrome."],
  ],
  ja: [
    ["AIのウィンドウをキャンバスで配置", "保存したウィンドウをドラッグして並べ、まとめてタイル状に起動。"],
    ["ひとつを大きく、すぐ元のタイルへ", "Alt+X でアクティブなウィンドウを拡大、Alt+Z で元の位置へ。"],
    ["ウィンドウとURLのセットを保存", "1つのウィンドウに複数タブ。編集・再利用、いま開いている画面へもすぐ移動。"],
    ["1件ずつでも、まとめてでも登録", "名前とURLをテキストで貼り付け。.txt の読み込み・書き出しにも対応。"],
    ["ツールバーからワンクリック", "8言語対応。アカウント・サーバー・トラッキングなし。設定は Chrome 内に保存。"],
  ],
};

const NAMES = ["01-arrange", "02-spotlight", "03-window-library", "04-register", "05-popup"];
const W = 1280, H = 800, BAND = 120;

function seed(locale) {
  const sample = SAMPLES[locale] ?? SAMPLES.en;
  const urls = ["https://example.com/research\nhttps://example.org/papers", "https://example.com/chat",
    "https://example.com/draft", "https://example.com/references", "https://example.com/review"];
  const registeredWindows = sample.windows.map((name, i) => ({ id: `win-${i + 1}`, name, urls: urls[i], color: "auto" }));
  const cells = [[0, 0, 6, 12], [6, 0, 6, 4], [6, 4, 6, 4], [6, 8, 6, 4]];
  const slots = cells.map(([gridX, gridY, gridW, gridH], i) => ({
    id: `slot-${i + 1}`, registeredWindowId: registeredWindows[i].id,
    name: registeredWindows[i].name, urls: registeredWindows[i].urls, gridX, gridY, gridW, gridH,
  }));
  return {
    language: locale, onboardingSeen: true, registeredWindows, activePreset: 0,
    presets: [{ name: sample.preset, columns: 2, rows: 2, layoutFamily: "focus", slots },
      { name: "B", columns: 3, rows: 1, layoutFamily: "auto", slots: [] }],
  };
}

// Put a raw UI capture under a caption band on the Ink background.
async function frame(page, shot, [title, subtitle], file, { inset = false } = {}) {
  const img = `data:image/png;base64,${shot.toString("base64")}`;
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;
    background:#09090b;font-family:Inter,'Noto Sans CJK JP','Noto Sans JP',-apple-system,'Segoe UI',sans-serif">
    <div style="height:${BAND}px;box-sizing:border-box;padding:24px 48px 0;background:#0b0e14;border-bottom:1px solid #27272a">
      <div style="font-size:34px;font-weight:700;color:#f4f4f5;letter-spacing:-.01em">${title}</div>
      <div style="margin-top:8px;font-size:18px;color:#a1a1aa">${subtitle}</div></div>
    <div style="height:${H - BAND}px;display:flex;align-items:${inset ? "center" : "flex-start"};justify-content:center;
      ${inset ? "background:radial-gradient(circle at 50% 40%,#16213d,#09090b 70%)" : ""}">
      <img src="${img}" style="display:block;${inset ? "border:1px solid #3f3f46;border-radius:12px;box-shadow:0 20px 60px #000" : ""}"></div>
  </body></html>`);
  await page.waitForLoadState("load");
  await pause(150);
  await page.screenshot({ path: file, omitBackground: false });
  console.log("  wrote", file);
}

const browserProfile = mkdtempSync(join(tmpdir(), "awd-store-"));
const context = await chromium.launchPersistentContext(browserProfile, {
  channel: "chromium", headless: true, viewport: { width: W, height: H - BAND },
  args: [`--disable-extensions-except=${repo}`, `--load-extension=${repo}`],
});
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const url = (path) => `chrome-extension://${new URL(worker.url()).host}/${path}`;
  // A few real windows so "Currently open browser windows" is not empty.
  await worker.evaluate(async () => {
    for (const path of ["", "?research", "?draft"]) {
      await chrome.windows.create({ url: `https://example.com/${path}`, focused: false });
    }
  });
  const ui = await context.newPage();
  const composer = await context.newPage();

  for (const locale of locales) {
    const captions = CAPTIONS[locale] ?? CAPTIONS.en;
    const dir = join(outDir, "screenshots", locale);
    mkdirSync(dir, { recursive: true });
    await worker.evaluate((data) => chrome.storage.sync.clear().then(() => chrome.storage.sync.set(data)), seed(locale));
    console.log(`[${locale}]`);

    const open = async () => {
      await ui.setViewportSize({ width: W, height: H - BAND });
      await ui.goto(url("dist/index.html?mode=page"));
      await ui.waitForSelector("main");
      await pause(500);
    };

    // 01 canvas: scroll the section tabs to the top of the frame.
    await open();
    await ui.evaluate(() => document.querySelector("nav").scrollIntoView({ block: "start" }));
    await pause(300);
    await frame(composer, await ui.screenshot(), captions[0], join(dir, `${NAMES[0]}.png`));

    // 02 commands + spotlight settings.
    await open();
    await frame(composer, await ui.screenshot(), captions[1], join(dir, `${NAMES[1]}.png`));

    // 03 window library tab.
    await open();
    await ui.locator("nav button").nth(1).click();
    await ui.evaluate(() => document.querySelector("nav").scrollIntoView({ block: "start" }));
    await pause(500);
    await frame(composer, await ui.screenshot(), captions[2], join(dir, `${NAMES[2]}.png`));

    // 04 register dialog, filled in.
    await open();
    await ui.evaluate(() => document.querySelector("nav").scrollIntoView({ block: "start" }));
    await ui.locator("aside button").first().click();
    const dialog = ui.locator('[role="dialog"]');
    await dialog.locator("input").nth(0).fill(SAMPLES[locale]?.windows[0] ?? "Research");
    await dialog.locator("input").nth(1).fill("https://example.com/research");
    await dialog.locator("input").nth(2).fill("https://example.org/papers");
    await ui.mouse.move(0, 0);
    await pause(300);
    await frame(composer, await ui.screenshot(), captions[3], join(dir, `${NAMES[3]}.png`));
    await ui.keyboard.press("Escape");

    // 05 toolbar popup at its natural size, inset on the backdrop.
    await ui.setViewportSize({ width: 780, height: 600 });
    await ui.goto(url("dist/index.html"));
    await ui.waitForSelector("main");
    await pause(500);
    await frame(composer, await ui.screenshot(), captions[4], join(dir, `${NAMES[4]}.png`), { inset: true });
  }

  // Promo tiles from their editable SVG sources.
  for (const [source, output, width, height] of [
    ["promo-small.svg", "promo-small.png", 440, 280],
    ["promo-marquee.svg", "promo-marquee.png", 1400, 560],
  ]) {
    await composer.setViewportSize({ width, height });
    await composer.goto(pathToFileURL(join(repo, "store-assets", source)).href);
    await composer.screenshot({ path: join(outDir, output) });
    console.log("  wrote", join(outDir, output));
  }
} finally {
  await context.close();
  rmSync(browserProfile, { recursive: true, force: true });
}
