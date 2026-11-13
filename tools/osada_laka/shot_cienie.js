// hut shadows at three hours: docs/osada_laka/cienie_<tag>_<h>.png  (TAG env, overlay as run)
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const SHOTS = path.join(__dirname, "..", "..", "docs", "osada_laka"), TAG = process.env.TAG || "po";
kit.test({ bootCheck: "boots", errorCheck: "no errors" }, async t => {
    await t.newGame({ map: 4, x: 55, y: 44, dir: 8, day: 3, hour: 12, quiet: true, minimap: false });
    for (const h of [8, 12, 17]) {
        await t.setHour(h);
        await t.frames(90);
        await t.locate(55, 44, 8);
        await t.frames(30);
        await t.shot(path.join(SHOTS, "cienie_" + TAG + "_" + h + ".png"));
    }
});
