// the OLD Osada on Map120 in the game as it is now (no overlay): the hut fronts - to compare the shadows (docs/osada_laka/stara_*.png)
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const SHOTS = path.join(__dirname, "..", "..", "docs", "osada_laka");
kit.test({ bootCheck: "boots", errorCheck: "no errors" }, async t => {
    await t.newGame({ map: 120, x: 20, y: 31, dir: 8, day: 3, hour: 13, quiet: true, minimap: false });
    await t.eval(`(function(){ $gameSwitches.setValue(16, true); return 0; })()`);
    for (const [n, x, y] of [["nw", 10, 19], ["ne", 28, 17], ["se", 28, 28]]) {
        await t.locate(x, y, 2);
        await t.frames(60);
        await t.shot(path.join(SHOTS, "stara_" + n + ".png"));
    }
});
