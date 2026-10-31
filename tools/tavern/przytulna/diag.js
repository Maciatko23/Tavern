// diagnoza w stronie: node tools/tavern/przytulna/diag.js <wyrażenie JS>
const path = require("path");
process.env.CDP_PORT = process.env.CDP_PORT || "9380";
const kit = require(path.join(__dirname, "..", "..", "..", "tests", "lib", "kit.js"));
kit.test({ port: Number(process.env.CDP_PORT), overlay: process.env.OVL || "tools/tavern/przytulna/overlay", bootCheck: "boot" }, async t => {
    await t.eval("window.PRZYTULNA = " + (process.env.PRZ || "true") + "; 0");
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20.2, minimap: false });
    await t.frames(60);
    console.log(JSON.stringify(await t.json(process.argv[2])));
});
