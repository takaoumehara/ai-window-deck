import { chromium } from "/Users/takao/.nvm/versions/node/v22.17.0/lib/node_modules/@playwright/mcp/node_modules/playwright/index.mjs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const extensionPath = process.argv[2];
const outputPath = process.argv[3];
const locale = process.argv[4] ?? "en";
const chromePath = "/Users/takao/.cache/puppeteer/chrome/mac_arm-150.0.7871.24/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!extensionPath || !outputPath) {
  throw new Error("Usage: node store-assets/capture-store-assets.mjs <extension-path> <output-path> [locale]");
}

const context = await chromium.launchPersistentContext(`/private/tmp/awd-store-assets-${process.pid}`, {
  executablePath: chromePath,
  headless: false,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
});

try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).host;
  const extensionUrl = (path) => `chrome-extension://${extensionId}/${path}`;
  const screenshotPath = locale === "en"
    ? `${outputPath}/screenshots`
    : `${outputPath}/localized/${locale}/screenshots`;
  const page = context.pages()[0];

  // Keep the editable SVG source alongside its exact-size PNG export. Chrome
  // is used as the renderer so no separate graphics dependency is required.
  if (locale === "en") {
    for (const [source, output, width, height] of [
      ["promo-small.svg", "promo-small.png", 440, 280],
      ["promo-marquee.svg", "promo-marquee.png", 1400, 560],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(pathToFileURL(resolve(outputPath, source)).href);
      await page.screenshot({ path: `${outputPath}/${output}` });
    }
  }

  await worker.evaluate((language) => {
    const samples = {
      en: { deck: "AI research desk", slots: ["Research", "Draft", "References", "Review"] },
      ja: { deck: "AI 調査デスク", slots: ["調査", "下書き", "参考資料", "確認"] },
      "zh-CN": { deck: "AI 研究工作台", slots: ["研究", "草稿", "参考资料", "审阅"] },
      ko: { deck: "AI 리서치 데스크", slots: ["조사", "초안", "참고 자료", "검토"] },
      es: { deck: "Espacio de investigación con IA", slots: ["Investigación", "Borrador", "Referencias", "Revisión"] },
      fr: { deck: "Bureau de recherche IA", slots: ["Recherche", "Brouillon", "Références", "Révision"] },
      de: { deck: "KI-Recherchearbeitsplatz", slots: ["Recherche", "Entwurf", "Quellen", "Prüfung"] },
      "pt-BR": { deck: "Área de pesquisa com IA", slots: ["Pesquisa", "Rascunho", "Referências", "Revisão"] },
    };
    const sample = samples[language] ?? samples.en;
    return chrome.storage.sync.set({
      language,
      presets: [{
      name: sample.deck,
      columns: 4,
      rows: 2,
      slots: [
        { name: sample.slots[0], urls: "https://example.com/research", color: "blue" },
        { name: sample.slots[1], urls: "https://example.com/draft", color: "purple" },
        { name: sample.slots[2], urls: "https://example.com/references", color: "green" },
        { name: sample.slots[3], urls: "https://example.com/review", color: "orange" },
      ],
    }],
    activePreset: 0,
    attention: true,
    spotlightSize: "tall",
    spotlightAnchor: "center",
    targetDisplays: [],
    sameDisplayOnly: true,
    groupTabs: true,
      openEmpty: false,
    });
  }, locale);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(extensionUrl("deck.html"));
  await pause(800);
  await page.screenshot({ path: `${screenshotPath}/01-arrange.png` });

  await page.click("#tab-resize");
  await pause(300);
  await page.screenshot({ path: `${screenshotPath}/02-spotlight.png` });

  await page.click("#tab-windows");
  await pause(500);
  await page.screenshot({ path: `${screenshotPath}/03-window-list.png` });
} finally {
  await context.close();
}
