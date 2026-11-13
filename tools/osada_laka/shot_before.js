// the "before" shots in the game as it is now (no overlay): the gate spot on Map013 and the east meadow of Kruczy Jar
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const SHOTS = path.join(__dirname, "..", "..", "docs", "osada_laka");
kit.test({ bootCheck: "boots", errorCheck: "no errors" }, async t => {
    await t.newGame({ map: 13, x: 6, y: 30, dir: 8, day: 3, hour: 13, quiet: true, minimap: false });
    await t.frames(60);
    await t.shot(path.join(SHOTS, "gra_brama13_przed.png"));
    await t.go(4, 66, 46, 2);
    await t.frames(60);
    await t.shot(path.join(SHOTS, "gra_laka_przed.png"));
});
