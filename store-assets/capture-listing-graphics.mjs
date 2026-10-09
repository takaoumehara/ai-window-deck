// Chrome Web Store listing graphics for the v1.11 monochrome design.
//
//   PLAYWRIGHT=/path/to/node_modules/playwright-core/index.mjs \
//   CHROME=/path/to/chrome \
//     node store-assets/capture-listing-graphics.mjs
//
// Inputs: the step screenshots in site/assets/img/ and the focus preview diagram,
// captured from the site (site/ served at SITE_URL, default http://localhost:8765/).
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

// Crop boxes in source pixels: the part of each step that carries the message.
const SHOTS = [
  { file: "01-step1-urls.png", crop: [40, 0, 1240, 600] },
  { file: "02-step2-layout.png", crop: [40, 110, 1240, 880] },
  { file: "03-step3-focus.png", crop: [40, 110, 1240, 743] },
  { file: "04-step4-launch.png", crop: [40, 110, 1240, 790] },
];

const COPY = {
  en: {
    step: (n) => `Step ${n} of 4`,
    steps: [
      ["Register URLs", "Save a name and URLs for each window. Each URL opens as a tab."],
      ["Lay out the canvas", "Place windows on the canvas and resize their grid slots."],
      ["Choose a Focus view", "Pick how Alt+X enlarges a window: its size, and whether it grows in place or centers."],
      ["Launch", "Choose your displays and open the saved layout as tiled Chrome windows."],
    ],
    focus: ["Alt+X: one window gets big", "Press it again and every window goes back to its tile. Alt+Z restores a window you resized by hand."],
    tagline: "More cloud sessions. Room to think.",
    marquee: "Tile Claude Code in the cloud, Codex and your references as ordinary Chrome windows. Alt+X brings one into focus.",
  },
  ja: {
    step: (n) => `ステップ ${n} / 4`,
    steps: [
      ["URL を登録", "ウィンドウごとに名前と URL を保存。各 URL はタブとして開きます。"],
      ["キャンバスに配置", "キャンバスにウィンドウを置き、グリッドの枠を調整します。"],
      ["フォーカス表示を選ぶ", "Alt+X での拡大サイズと、今の場所から広げるか中央に寄せるかを選びます。"],
      ["起動", "ディスプレイを選び、保存した配置どおりに Chrome ウィンドウを並べて開きます。"],
    ],
    focus: ["Alt+X で 1 枚が大きくなる", "もう一度押すと、すべてのウィンドウが元のタイルに戻ります。手動でサイズを変えたウィンドウも Alt+Z で戻せます。"],
  },
};

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700&display=block" rel="stylesheet">`;
const BASE = `*{box-sizing:border-box;margin:0}html,body{width:100%;height:100%}body{font-family:Outfit,"Noto Sans JP",sans-serif;-webkit-font-smoothing:antialiased}`;

const STAGE = { w: 1136, h: 576 };

function screenshotHtml({ eyebrow, title, body, src, crop }) {
  let media = `<img class="whole" src="${src}">`;
  if (crop) {
    const [x0, y0, x1, y1] = crop;
    const s = Math.min(STAGE.w / (x1 - x0), STAGE.h / (y1 - y0), 1.25);
    media = `<div class="crop" style="width:${Math.round((x1 - x0) * s)}px;height:${Math.round((y1 - y0) * s)}px"><img src="${src}" style="width:${1280 * s}px;left:${-x0 * s}px;top:${-y0 * s}px"></div>`;
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
    const [title, body] = c.steps[i];
    const [x0, y0, x1, y1] = shot.crop;
    const html = screenshotHtml({ eyebrow: c.step(i + 1), title, body, src: dataUrl(img(shot.file)), crop: [x0, y0, x1, y1], aspect: { w: 1280 } });
    await render(html, { width: 1280, height: 800 }, join(dir, `0${i + 1}-${shot.file.replace(/^\d+-/, "")}`));
  }
  const [title, body] = c.focus;
  await render(screenshotHtml({ eyebrow: "Alt+X / ⌥X", title, body, src: await focusDiagram(lang, "light") }), { width: 1280, height: 800 }, join(dir, "05-focus-view.png"));
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
