import { spawn } from "node:child_process";
const args = ["--user-data-dir=/tmp/promo-profile","--no-first-run","--no-default-browser-check",
  "--remote-debugging-pipe","--enable-unsafe-extension-debugging","--remote-debugging-port=9222",
  "--lang=" + (process.env.LANG_UI || "en-US"), "--disable-component-update", "--hide-crash-restore-bubble", "--disable-session-crashed-bubble",
  "--window-position=0,0","--window-size=1920,1080", "--start-maximized","about:blank"];
const p = spawn("google-chrome", args, { stdio: ["ignore","inherit","inherit","pipe","pipe"], env: { ...process.env, DISPLAY: ":1" } });
const w = p.stdio[3], r = p.stdio[4];
let buf = "";
r.on("data", d => { buf += d; let i; while ((i = buf.indexOf("\0")) >= 0) { const m = buf.slice(0, i); buf = buf.slice(i + 1); console.log("PIPE", m.slice(0, 300)); } });
w.write(JSON.stringify({ id: 1, method: "Extensions.loadUnpacked", params: { path: "/workspace" } }) + "\0");
p.on("exit", c => { console.log("chrome exit", c); process.exit(0); });
