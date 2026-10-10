// tiny CDP client: node cdp.mjs <urlSubstring|new:URL> <js expression>
export async function targets() { return (await fetch("http://localhost:9222/json")).json(); }
export async function connect(match) {
  let t = (await targets()).find(t => t.type === "page" && t.url.includes(match));
  if (!t) throw new Error("no target " + match);
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => { const m = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (m.result?.exceptionDetails) return "EXC " + (m.result.exceptionDetails.exception?.description ?? JSON.stringify(m.result.exceptionDetails)); return m.result?.result?.value ?? null; };
  return { ws, send, evaluate, close: () => ws.close() };
}
if (process.argv[1]?.endsWith("cdp.mjs")) {
  const c = await connect(process.argv[2]);
  console.log(JSON.stringify(await c.evaluate(process.argv[3]), null, 1));
  c.close();
}
export async function browser() {
  const v = await (await fetch("http://localhost:9222/json/version")).json();
  const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { send, close: () => ws.close() };
}
