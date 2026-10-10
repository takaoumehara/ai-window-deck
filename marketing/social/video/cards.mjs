// node cards.mjs en|ja  -> /tmp/promo/cards/<lang>/*.png
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const lang = process.argv[2] || "en";
const out = `/tmp/promo/cards/${lang}`;
mkdirSync(out, { recursive: true });
const icon = readFileSync("/workspace/site/assets/icon-v6.svg", "utf8").replace(/<title>.*?<\/title>/, "");

const T = {
  en: {
    font: `"Outfit", "Inter", sans-serif`,
    intro: ["AI Window Deck", "More cloud sessions. Room to think.", "Window manager for Claude Code in the cloud and Codex"],
    outro: ["Free on the Chrome Web Store", "No account · No server · Open source (MIT)", "ai-window-deck.vercel.app"],
    caps: {
      c1: ["1", "Paste a list of sites. Each block becomes a window."],
      c2: ["2", "Lay them out on the canvas."],
      c3: ["3", "Choose how a window enlarges."],
      c4: ["4", "Launch. Every window opens, tiled."],
      c5: ["⌥X", "Enlarge the window you're working in."],
      c6: ["⌥X", "Press again. Back to its tile."],
    },
  },
  ja: {
    font: `"Outfit", "Noto Sans JP", sans-serif`,
    intro: ["AI Window Deck", "クラウドのセッションを、もっと。考える余白を、もっと。", "Claude Code（クラウド）と Codex のためのウィンドウマネージャー"],
    outro: ["Chrome ウェブストアで無料", "アカウント不要 · サーバーなし · オープンソース（MIT）", "ai-window-deck.vercel.app"],
    caps: {
      c1: ["1", "サイトの一覧を貼るだけ。空行ごとに 1 ウィンドウ。"],
      c2: ["2", "キャンバスに並べる。"],
      c3: ["3", "拡大のしかたを選ぶ。"],
      c4: ["4", "起動。全部のウィンドウがタイル状に開く。"],
      c5: ["⌥X", "作業中のウィンドウを拡大。"],
      c6: ["⌥X", "もう一度押すと、元の枠へ。"],
    },
  },
}[lang];

const head = `<meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>*{margin:0;box-sizing:border-box}html,body{width:1920px;height:1080px;font-family:${T.font};-webkit-font-smoothing:antialiased}</style>`;

const card = ([title, sub, foot], big) => `<!doctype html>${head}
<style>body{background:#f3f2ee;color:#0b0b0b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}
.icon svg{width:${big ? 132 : 96}px;height:${big ? 132 : 96}px}
h1{font-size:${big ? 120 : 92}px;font-weight:500;letter-spacing:-0.035em;line-height:1}
p{font-size:44px;color:#3a3a37;font-weight:400}
small{margin-top:36px;font-size:28px;color:#74736f;font-family:${big ? T.font : "ui-monospace, 'JetBrains Mono', monospace"};letter-spacing:${big ? "0" : "0.02em"}}</style>
<div class="icon">${icon}</div><h1>${title}</h1><p>${sub}</p><small>${foot}</small>`;

const caption = ([k, text]) => `<!doctype html>${head}
<style>body{background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:56px}
.pill{display:flex;align-items:center;gap:22px;background:rgba(11,11,11,.92);color:#f3f2ee;border-radius:22px;padding:22px 38px 22px 22px;box-shadow:0 10px 40px rgba(0,0,0,.25)}
.k{min-width:60px;height:60px;padding:0 14px;border-radius:14px;background:#f3f2ee;color:#0b0b0b;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600}
.t{font-size:40px;font-weight:500;letter-spacing:-0.01em}</style>
<div class="pill"><div class="k">${k}</div><div class="t">${text}</div></div>`;

const jobs = { intro: card(T.intro, true), outro: card(T.outro, false) };
for (const [id, c] of Object.entries(T.caps)) jobs[id] = caption(c);
import { browser, connect } from "/tmp/promo/cdp.mjs";
const b = await browser();
const { result: { targetId } } = await b.send("Target.createTarget", { url: "about:blank", newWindow: true, background: true });
await new Promise(r => setTimeout(r, 800));
const t = (await (await fetch("http://localhost:9222/json")).json()).find(x => x.id === targetId);
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let n = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
for (const [id, html] of Object.entries(jobs)) {
  writeFileSync(`${out}/${id}.html`, html);
  await send("Page.navigate", { url: `file://${out}/${id}.html` });
  await new Promise(r => setTimeout(r, 1500));
  await send("Runtime.evaluate", { expression: "document.fonts.ready.then(()=>1)", awaitPromise: true });
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(`${out}/${id}.png`, Buffer.from(shot.result.data, "base64"));
  console.log(`${out}/${id}.png`);
}
await b.send("Target.closeTarget", { targetId });
process.exit(0);
