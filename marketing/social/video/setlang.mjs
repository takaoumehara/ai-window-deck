import { connect } from "/tmp/promo/cdp.mjs";
const c = await connect("dist/index.html");
console.log(await c.evaluate(`(() => { const s = document.querySelector("select"); const o = [...s.options].find(o => o.text === ${JSON.stringify(process.argv[2])});
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(s, o.value); s.dispatchEvent(new Event("change", { bubbles: true })); return o.value; })()`));
c.close();
