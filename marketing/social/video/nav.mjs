import { connect } from "/tmp/promo/cdp.mjs";
const c = await connect(process.argv[2]);
console.log(JSON.stringify(await c.send("Page.navigate", { url: process.argv[3] })));
c.close();
