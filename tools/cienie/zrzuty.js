// Screenshots of the same spots with and without Cienie (run twice: the installed game -> TAG=przed, the overlay -> TAG=po).
//   [GAME_OVERLAY=tools/cienie/staging GAME_OVERLAY_JS=1] TAG=po CDP_PORT=9505 node tools/cienie/zrzuty.js
const kit = require("../../tests/lib/kit.js");
const path = require("path");
const TAG = process.env.TAG || "po", OUT = path.join(__dirname, "..", "..", "docs", "cienie_budynkow", "surowe");
const SPOTS = [
    ["miasto_10", 8, 52, 70, 10], ["miasto_17", 8, 52, 70, 17], ["miasto2_10", 8, 50, 53, 10], ["miasto2_17", 8, 50, 53, 17],
    ["podgrodzie_10", 111, 43, 37, 10], ["podgrodzie_17", 111, 43, 37, 17],
    ["przystan_10", 125, 24, 14, 10], ["przystan_17", 125, 24, 14, 17], ["garnizon_10", 162, 56, 50, 10],
    ["budynki_gracza_10", 3, 22, 14, 10, "[['well', 3, 2], ['forge', -5, 3], ['fence', 2, 5], ['fence', 3, 5], ['fence', 4, 5], ['hut', -9, -4], ['campfire', 6, -1]].forEach(([k, dx, dy]) => Farming.placeFree(k, $gamePlayer.x + dx, $gamePlayer.y + dy))"],
    ["budynki_gracza_17", 3, 22, 14, 17, "[['well', 3, 2], ['forge', -5, 3], ['fence', 2, 5], ['fence', 3, 5], ['fence', 4, 5], ['hut', -9, -4], ['campfire', 6, -1]].forEach(([k, dx, dy]) => Farming.placeFree(k, $gamePlayer.x + dx, $gamePlayer.y + dy))"]
];
kit.test({ port: Number(process.env.CDP_PORT) || 9505, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    for (const [name, map, x, y, hour, setup] of SPOTS) {
        await t.newGame({ map, x, y, day: 40, hour, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); 0");
        await t.eval("(function(){ const sp = SceneManager._scene._spriteset; if (sp._cloudSprites) { for (const c of sp._cloudSprites) if (c.parent) c.parent.removeChild(c); sp._cloudSprites.length = 0; } return 0; })()");
        if (setup) await t.eval(setup + "; 0");
        await t.frames(120);
        await t.shot(path.join(OUT, `${TAG}_${name}.png`));
        console.log(name, await t.json("window.Cienie ? Cienie.stats : null"));
    }
});
