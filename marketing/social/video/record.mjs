// node record.mjs en|ja  -> /tmp/promo/out/<lang>/raw.mp4 + marks.json
import { page, sleep, key, moveTo, click } from "/tmp/promo/ui.mjs";
import { execSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const lang = process.argv[2] || "en";
const out = `/tmp/promo/out/${lang}`;
mkdirSync(out, { recursive: true });
const env = { ...process.env, DISPLAY: ":1" };
const sh = c => execSync(c, { env, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
const EXT = "chrome-extension://mfcnnpgffdelhlegadfaiedfiklhjacl/dist/index.html";

const L = {
  en: {
    ui: "en-US", getStarted: "Get started", remove: n => `Remove "${n}" from this layout`, samples: ["Research", "Chat AI"],
    register: "Register URLs + Window", bulk: "Bulk (paste text)", bulkSave: "Bulk Save", autoPlace: "Auto-place on canvas",
    nextLayout: "Next: Layout", details: "Layout details", vertical: "Vertical", auto: "Auto", step3: "3 Focus view",
    large: "Large About 80% of the display", center: "Center Placed in the middle of the display",
    nextLaunch: "Next: Launch", launch: "Launch 6 windows", deck: "/tmp/promo/deck-en.txt",
  },
  ja: {
    ui: "ja", panelLang: "日本語", getStarted: "はじめる", remove: n => `「${n}」をこのレイアウトから外す`, samples: ["Research", "Chat AI"],
    register: "URL＋ウィンドウを登録", bulk: "テキストで一括登録", bulkSave: "一括保存", autoPlace: "キャンバスへ自動配置",
    nextLayout: "次へ：レイアウト", details: "レイアウト詳細", vertical: "縦割り", auto: "自動", step3: "3 フォーカス表示",
    large: "大きく 画面の約80%の大きさ", center: "中央に寄せる 画面の中央に置く",
    nextLaunch: "次へ：起動", launch: "6つのウィンドウを起動", deck: "/tmp/promo/deck-ja.txt", siteLang: "ja",
  },
}[lang];

// --- prep (not recorded) ---
sh(`/tmp/promo/start.sh ${L.ui}`);
await sleep(1500);
for (let i = 0; ; i++) { try { sh(`node /tmp/promo/nav.mjs about:blank ${EXT} 2>/dev/null`); break; } catch (e) { if (i > 20) throw e; await sleep(500); } }
await sleep(2000);
const panelWin = sh(`xdotool search --onlyvisible --class chrome | head -1`);
sh(`xdotool windowmove ${panelWin} 0 0 windowsize ${panelWin} 1920 1080`);
await sleep(800);
sh(`xdotool mousemove 1882 111 click 1`); // "Can't update Chrome" bubble
await sleep(500);
if (L.panelLang) { sh(`node /tmp/promo/setlang.mjs ${L.panelLang}`); await sleep(800); }
if (L.siteLang) {
  const { browser } = await import("/tmp/promo/cdp.mjs");
  const b = await browser();
  const { result: { targetId } } = await b.send("Target.createTarget", { url: "https://ai-window-deck.vercel.app/", background: true });
  await sleep(3000);
  const { connect } = await import("/tmp/promo/cdp.mjs");
  const c = await connect("ai-window-deck.vercel.app"); await c.evaluate(`localStorage.setItem("awd-lang", "${L.siteLang}")`); c.close();
  await b.send("Target.closeTarget", { targetId }); b.close();
  await sleep(800);
}
let p = await page();
await p.clickOn(L.getStarted, { sel: "button", ms: 200 });
await sleep(1200);
key("ctrl+plus");
await sleep(1500);
for (const n of L.samples) { await p.clickOn(L.remove(n), { sel: "button", ms: 200 }); await sleep(900); }
for (const n of L.samples) if (await p.locate(L.remove(n), { sel: "button" })) throw new Error("sample not removed: " + n);
await p.evaluate("scrollTo(0,0)");
sh(`xclip -selection clipboard -i ${L.deck} >/dev/null 2>&1 &`);
await moveTo(1100, 760, 200);
await sleep(4500); // let the zoom bubble fade

// --- record ---
const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "x11grab", "-framerate", "30", "-video_size", "1920x1080", "-i", ":1",
  "-c:v", "libx264", "-preset", "ultrafast", "-crf", "14", "-pix_fmt", "yuv420p", `${out}/raw.mp4`], { env, stdio: ["pipe", "inherit", "inherit"] });
const t0 = Date.now() + 250;
const fail = e => { console.error(e); ff.kill("SIGKILL"); process.exit(1); };
process.on("unhandledRejection", fail); process.on("uncaughtException", fail); process.on("exit", () => { try { ff.kill("SIGINT"); } catch {} });
const marks = {};
const mark = id => { marks[id] = (Date.now() - t0) / 1000; console.log(id, marks[id]); };
await sleep(1200);

mark("c1");
await p.clickOn(L.register, { sel: "button" }); await sleep(1100);
await p.clickOn(L.bulk, { sel: "button", nth: -1 }); await sleep(1600);
await p.clickOn("css:textarea", { ms: 600 }); await sleep(300);
key("ctrl+a"); await sleep(150); key("ctrl+v"); await sleep(1800);
await p.clickOn(L.bulkSave, { sel: "button" }); await sleep(900);
await p.clickOn(L.autoPlace, { sel: "strong,b,div,span,p,h3,h4" }); await sleep(2000);

mark("c2");
await p.clickOn(L.nextLayout, { sel: "button" }); await sleep(1500);
await p.clickOn(L.details, { sel: "summary,button" }); await sleep(700);
await p.clickOn(L.vertical, { sel: "button" }); await sleep(1500);
await p.clickOn(L.auto, { sel: "button" }); await sleep(1600);

mark("c3");
await p.evaluate("scrollTo({top:0,behavior:'smooth'})"); await sleep(400);
await p.clickOn(L.step3, { sel: "button" }); await sleep(1400);
await p.clickOn(L.large, { sel: "label" }); await sleep(900);
await p.clickOn(L.center, { sel: "label" }); await sleep(2200);

mark("c4");
await p.clickOn(L.nextLaunch, { sel: "button" }); await sleep(1500);
await p.clickOn(L.launch, { sel: "button", after: 0 });
p.close();
await sleep(350);
sh(`xdotool windowminimize ${panelWin}`);
mark("launched");
await moveTo(1000, 640, 1200);
await sleep(3000);

// window centres of a 3x2 tile grid; click the empty tab strip to focus
const strip = (col, row) => [col * 642 + 590, row * 544 + 14];
mark("c5");
let [x, y] = strip(0, 0);
await moveTo(x, y, 800); await sleep(200); click(); await sleep(500);
key("alt+x"); mark("x1"); await sleep(2600);
mark("c6");
key("alt+x"); await sleep(1500);
[x, y] = strip(0, 1);
mark("c5b");
await moveTo(x, y, 800); await sleep(200); click(); await sleep(500);
key("alt+x"); await sleep(3200);
mark("c6b");
key("alt+x"); await sleep(2000);
mark("end");

ff.stdin.write("q");
await new Promise(r => ff.on("exit", r));
writeFileSync(`${out}/marks.json`, JSON.stringify(marks, null, 1));
console.log("done", out);
process.exit(0);
