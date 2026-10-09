// Chrome Web Store listing graphics for the v1.11 monochrome design.
//
//   PLAYWRIGHT=/path/to/node_modules/playwright-core/index.mjs \
//   CHROME=/path/to/chrome \
//     node store-assets/capture-listing-graphics.mjs
//
// Inputs: the extension screenshots in site/assets/img/ (run capture-app-screens.mjs first)
// and the focus preview diagram, captured from the site (site/ served at SITE_URL, default
// http://localhost:8765/).
// Outputs, all opaque RGB at the store's exact sizes:
//   store-assets/listing/<locale>/0N-*.png   1280 × 800 screenshots (en, ja)
//   store-assets/listing/promo-small.png      440 × 280
//   store-assets/listing/promo-marquee.png    1400 × 560
//   store-assets/listing/store-icon-128.png   128 × 128, from make-store-icon.py
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright-core");
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(repo, "store-assets", "listing");
const site = process.env.SITE_URL ?? "http://localhost:8765/";

const INK = "#0b0b0b", PAPER = "#f3f2ee", MUTE = "#52514e", LINE = "#d6d5d0";
const dataUrl = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const icon = `data:image/svg+xml;base64,${readFileSync(join(repo, "site/assets/icon-v6.svg")).toString("base64")}`;
const img = (name) => join(repo, "site/assets/img", name);

// Listing screenshots in order. `src` gives the image for a locale; crop boxes are in source
// pixels and keep the part of each screen that carries the message. `focus` is the diagram.
const SHOTS = [
  { out: "01-register", src: (l) => `register-choose-${l}-light.png`, width: 1280, crop: [32, 112, 1248, 872] },
  { out: "02-bulk-paste", src: (l) => `register-bulk-${l}-light.png`, width: 1222 },
  { out: "03-layout", src: (l) => (l === "en" ? "02-step2-layout.png" : `02-step2-layout-${l}.png`), width: 1280, crop: [32, 228, 1248, 944] },
  { out: "04-focus-view", focus: true },
  { out: "05-launch", src: (l) => (l === "en" ? "04-step4-launch.png" : `04-step4-launch-${l}.png`), width: 1280, crop: [32, 120, 1248, 880] },
];

const COPY = {
  en: {
    shots: [
      ["Step 1 of 4", "Register URLs + Window", "Add windows one by one, or paste a list of sites and create them all at once."],
      ["Bulk paste", "Red lines, with a fix", "Lines that need attention turn red, and Fix adds the missing blank line. https:// is added for you; local files work too."],
      ["Step 2 of 4", "Lay out the canvas", "Place windows on the canvas and resize their grid slots."],
      ["Step 3 of 4 · Alt+X", "Alt+X: one window gets big", "Press it again and every window goes back to its tile. Alt+Z restores a window you resized by hand."],
      ["Step 4 of 4", "Launch", "Choose your displays and open the saved layout as tiled Chrome windows."],
    ],
    tagline: "More cloud sessions. Room to think.",
    marquee: "Paste a list of sites to create your windows, tile Claude Code in the cloud, Codex and your references as ordinary Chrome windows, and bring one into focus with Alt+X.",
  },
  ja: {
    shots: [
      ["ステップ 1 / 4", "URL＋ウィンドウを登録", "1件ずつ追加するか、サイトの一覧を貼り付けてまとめて作成できます。"],
      ["テキストで一括登録", "赤い行と、修正ボタン", "直す必要のある行は赤く表示され、修正ボタンで空行を補えます。https:// は自動で補完、ローカルファイルも使えます。"],
      ["ステップ 2 / 4", "キャンバスに配置", "キャンバスにウィンドウを置き、グリッドの枠を調整します。"],
      ["ステップ 3 / 4 · Alt+X", "Alt+X で 1 枚が大きくなる", "もう一度押すと、すべてのウィンドウが元のタイルに戻ります。手動でサイズを変えたウィンドウも Alt+Z で戻せます。"],
      ["ステップ 4 / 4", "起動", "ディスプレイを選び、保存した配置どおりに Chrome ウィンドウを並べて開きます。"],
    ],
  },
};

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700&display=block" rel="stylesheet">`;
const BASE = `*{box-sizing:border-box;margin:0}html,body{width:100%;height:100%}body{font-family:Outfit,"Noto Sans JP",sans-serif;-webkit-font-smoothing:antialiased}`;

const STAGE = { w: 1136, h: 576 };

function screenshotHtml({ eyebrow, title, body, src, crop, width = 1280 }) {
  let media = `<img class="whole" src="${src}">`;
  if (crop) {
    const [x0, y0, x1, y1] = crop;
    const s = Math.min(STAGE.w / (x1 - x0), STAGE.h / (y1 - y0), 1.25);
    media = `<div class="crop" style="width:${Math.round((x1 - x0) * s)}px;height:${Math.round((y1 - y0) * s)}px"><img src="${src}" style="width:${width * s}px;left:${-x0 * s}px;top:${-y0 * s}px"></div>`;
  }
  return `<!doctype html><html><head>${FONTS}<style>${BASE}
  body{background:${PAPER};color:${INK};padding:40px 72px 0;display:flex;flex-direction:column}
  header{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;height:128px}
  .eyebrow{font-size:15px;font-weight:500;letter-spacing:.04em;color:${MUTE};display:flex;align-items:center;gap:10px}
  .eyebrow img{width:22px;height:22px}
  h1{font-size:44px;font-weight:600;letter-spacing:-.02em;margin-top:12px;line-height:1.1}
  p{font-size:19px;line-height:1.5;color:${MUTE};max-width:540px;padding-bottom:4px;text-wrap:pretty}
  .stage{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:24px 0 0;min-height:0}
  .crop,.whole{max-width:100%;max-height:600px;border:1px solid ${LINE};border-radius:14px;background:${PAPER};box-shadow:0 18px 50px rgb(0 0 0/.08)}
  .crop{position:relative;overflow:hidden;height:600px}
  .crop img{position:absolute;max-width:none}
  .whole{height:576px;width:auto;object-fit:contain}
  </style></head><body><header><div><div class="eyebrow"><img src="${icon}">${eyebrow}</div><h1>${title}</h1></div><p>${body}</p></header><div class="stage">${media}</div></body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
async function render(html, size, path) {
  await page.setViewportSize(size);
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path, omitBackground: false });
  console.log(path.replace(repo + "/", ""));
}

async function focusDiagram(lang, theme) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: theme });
  await ctx.addInitScript(([l, t]) => { localStorage.setItem("awd-lang", l); localStorage.setItem("awd-theme", t); sessionStorage.setItem("awd-loaded", "1"); }, [lang, theme]);
  const p = await ctx.newPage();
  await p.goto(`${site}?fvPhase=1`, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: ".stage-pause{visibility:hidden}*{transition:none!important;animation:none!important}" });
  await p.waitForTimeout(300);
  const buf = await p.locator("[data-focus-preview]").screenshot();
  await ctx.close();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

for (const lang of ["en", "ja"]) {
  const c = COPY[lang];
  const dir = join(out, lang);
  mkdirSync(dir, { recursive: true });
  for (const [i, shot] of SHOTS.entries()) {
    const [eyebrow, title, body] = c.shots[i];
    const src = shot.focus ? await focusDiagram(lang, "light") : dataUrl(img(shot.src(lang)));
    const html = screenshotHtml({ eyebrow, title, body, src, crop: shot.crop, width: shot.width });
    await render(html, { width: 1280, height: 800 }, join(dir, `${shot.out}.png`));
  }
}

const en = COPY.en;
await render(`<!doctype html><html><head>${FONTS}<style>${BASE}
  body{background:${INK};color:${PAPER};display:flex;flex-direction:column;justify-content:center;padding:0 36px;gap:14px}
  .row{display:flex;align-items:center;gap:14px}img{width:56px;height:56px;border-radius:12px;outline:1px solid #2a2a28}
  h1{font-size:34px;font-weight:600;letter-spacing:-.02em}p{font-size:17px;color:#b9b8b3;line-height:1.4}
  kbd{font:600 13px Outfit;border:1px solid #3a3a37;border-radius:6px;padding:3px 8px;color:${PAPER};background:#1a1a19}
  </style></head><body><div class="row"><img src="${icon}"><h1>AI Window Deck</h1></div><p>${en.tagline}</p><div class="row" style="gap:8px"><kbd>Alt</kbd><span style="color:#74736f">+</span><kbd>X</kbd><span style="font-size:14px;color:#b9b8b3">Focus view</span></div></body></html>`,
  { width: 440, height: 280 }, join(out, "promo-small.png"));

await render(`<!doctype html><html><head>${FONTS}<style>${BASE}
  body{background:${INK};color:${PAPER};display:grid;grid-template-columns:1fr 556px;align-items:center;gap:56px;padding:0 64px 0 80px}
  .row{display:flex;align-items:center;gap:18px}.row img{width:64px;height:64px;border-radius:14px;outline:1px solid #2a2a28}
  h1{font-size:56px;font-weight:600;letter-spacing:-.025em}
  .tag{font-size:30px;font-weight:500;margin-top:28px;letter-spacing:-.01em}
  p{font-size:19px;color:#b9b8b3;line-height:1.5;margin-top:14px;max-width:560px}
  .shot{height:476px;width:auto;border-radius:16px;outline:1px solid #2a2a28}
  </style></head><body><div><div class="row"><img src="${icon}"><h1>AI Window Deck</h1></div><div class="tag">${en.tagline}</div><p>${en.marquee}</p></div><img class="shot" src="${await focusDiagram("en", "dark")}"></body></html>`,
  { width: 1400, height: 560 }, join(out, "promo-marquee.png"));

await browser.close();
