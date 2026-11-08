// Screenshots of the harder spots for Cienie (long shadows at sunrise/sunset, noon, Podgrodzie's houses, the town's walls, the manor).
//   [GAME_OVERLAY=tools/cienie/staging GAME_OVERLAY_JS=1] TAG=po2 CDP_PORT=9505 node tools/cienie/zrzuty_trudne.js
const kit = require("../../tests/lib/kit.js");
const path = require("path");
const TAG = process.env.TAG || "po2", OUT = path.join(__dirname, "..", "..", "docs", "cienie_budynkow", "surowe");
const SPOTS = [
    ["kamienica_07", 8, 60, 76, 7], ["kamienica_13", 8, 60, 76, 13], ["kamienica_19", 8, 60, 76, 19],
    ["czerwony_10", 8, 60, 91, 10], ["czerwony_16", 8, 60, 91, 16], ["house_town_15", 8, 60, 67, 15],
    ["podgrodzie_domy_10", 111, 52, 16, 10], ["podgrodzie_domy_16", 111, 12, 47, 16],
    ["mury_10", 8, 50, 10, 10], ["mury_zach_16", 8, 12, 14, 16], ["dwor_10", 24, 20, 11, 10]
];
kit.test({ port: Number(process.env.CDP_PORT) || 9505, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    for (const [name, map, x, y, hour] of SPOTS) {
        await t.newGame({ map, x, y, day: 40, hour, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); 0");
        await t.eval("(function(){ const sp = SceneManager._scene._spriteset; if (sp._cloudSprites) { for (const c of sp._cloudSprites) if (c.parent) c.parent.removeChild(c); sp._cloudSprites.length = 0; } return 0; })()");
        await t.frames(120);
        await t.shot(path.join(OUT, `${TAG}_${name}.png`));
        console.log(name, JSON.stringify(await t.json("window.Cienie ? Cienie.stats : null")));
    }
});
