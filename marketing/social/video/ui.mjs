import { connect } from "/tmp/promo/cdp.mjs";
import { execFileSync } from "node:child_process";
export const sleep = ms => new Promise(r => setTimeout(r, ms));
const xdo = (...a) => execFileSync("xdotool", a.map(String), { env: { ...process.env, DISPLAY: ":1" } }).toString();
export function mousePos() { const o = xdo("getmouselocation"); return { x: +o.match(/x:(\d+)/)[1], y: +o.match(/y:(\d+)/)[1] }; }
export async function moveTo(x, y, ms = 600) {
  const s = mousePos(), n = Math.max(8, Math.round(ms / 16));
  for (let i = 1; i <= n; i++) { const t = i / n, e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    xdo("mousemove", Math.round(s.x + (x - s.x) * e), Math.round(s.y + (y - s.y) * e)); await sleep(ms / n); }
}
export const click = () => xdo("click", 1);
export const key = (...k) => xdo("key", "--clearmodifiers", ...k);
export const type = (t, delay = 35) => xdo("type", "--delay", delay, t);
export async function page(match = "dist/index.html") {
  const c = await connect(match);
  // screen coords of an element center, found by selector or visible text
  c.locate = async (q, opts = {}) => { const g = xdo("getactivewindow", "getwindowgeometry");
    const G = { x: +g.match(/Position: (\d+)/)[1], y: +g.match(/Position: \d+,(\d+)/)[1], w: +g.match(/Geometry: (\d+)/)[1], h: +g.match(/Geometry: \d+x(\d+)/)[1] };
    return c.evaluate(`(() => { const G = ${JSON.stringify(G)};
    const q = ${JSON.stringify(q)}, o = ${JSON.stringify(opts)};
    let el = null;
    if (q.startsWith("css:")) el = [...document.querySelectorAll(q.slice(4))].filter(e => e.getClientRects().length)[o.nth||0];
    else el = [...document.querySelectorAll(o.sel || "button,a,label,[role=button],[role=tab],[role=radio],input,textarea,select,li,div,span")]
      .filter(e => e.getClientRects().length && (e.innerText||e.value||e.getAttribute("aria-label")||"").trim().replace(/\\s+/g," ") === q).at(o.nth||0);
    if (!el) return null;
    el.scrollIntoView({block:"nearest"});
    const r = el.getBoundingClientRect(), z = devicePixelRatio;
    const left = (G.w - innerWidth * z) / 2, top = G.h - innerHeight * z - left;
    return { x: Math.round(G.x + left + (r.left + r.width * (o.fx ?? .5)) * z), y: Math.round(G.y + top + (r.top + r.height * (o.fy ?? .5)) * z), w: r.width*z, h: r.height*z };
  })()`); };
  c.clickOn = async (q, opts = {}) => { const p = await c.locate(q, opts); if (!p) throw new Error("not found: " + q); await moveTo(p.x, p.y, opts.ms ?? 700); await sleep(opts.pause ?? 150); click(); await sleep(opts.after ?? 500); return p; };
  return c;
}
