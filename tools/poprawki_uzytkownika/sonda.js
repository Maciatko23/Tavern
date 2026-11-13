// CDP_PORT=9771 MAP=3 EXPR="..." node sonda.js   - evaluates an expression in game after loading the map (no overlay unless STAGING)
const kit = require("../../tests/lib/kit.js"); const path = require("path");
const OV = process.env.STAGING ? path.join(__dirname, process.env.STAGING) : undefined;
kit.test({ port: +(process.env.CDP_PORT || 9771), overlay: OV, overlayJs: !!OV, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow", evalTimeout: 120000, beforeLoad: "window.WIDOK = false;" }, async t => {
    await t.newGame({ map: +(process.env.MAP || 3), x: 2, y: 2, day: 40, hour: 11, quiet: true, minimap: false }); await t.frames(60);
    const r = await t.json(process.env.EXPR);
    console.log(JSON.stringify(r));
    t.check("sonda", true);
});
