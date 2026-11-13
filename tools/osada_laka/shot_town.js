const path = require("path");
const kit = require("../../tests/lib/kit.js");
const SHOTS = path.join(__dirname, "..", "..", "docs", "osada_laka");
kit.test({ bootCheck: "boots", errorCheck: "no errors" }, async t => {
    await t.newGame({ map: 8, x: 100, y: 100, dir: 2, day: 3, hour: 12, quiet: true, minimap: false });
    await t.frames(100);
    const runs = await t.json(`Cienie.solids().runs.filter(r => r.x1 - r.x0 >= 3 && r.x1 - r.x0 <= 8 && r.f > 20).slice(0, 12).map(r => [r.x0, r.x1, r.f, r.h])`);
    console.log(JSON.stringify(runs));
    const r = runs[+(process.env.RUN || 0)];
    await t.locate(Math.floor((r[0] + r[1]) / 2), r[2] + 2, 8);
    await t.frames(60);
    await t.shot(path.join(SHOTS, "miasto_poludnie.png"));
});
