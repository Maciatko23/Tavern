// Zrzuty wzgórz przed i po (TAG=przed: gra; TAG=po: GAME_OVERLAY=tools/wzgorza_popraw/staging GAME_OVERLAY_JS=1)
//   TAG=po MAPA=175 MIEJSCA="66,12;66,44;35,36" CDP_PORT=9505 node tools/wzgorza_popraw/zrzuty.js
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const TAG = process.env.TAG || "po", MAPA = Number(process.env.MAPA) || 175;
const MIEJSCA = (process.env.MIEJSCA || "66,12").split(";").map(s => s.split(",").map(Number));
const OUT = path.join(__dirname, "..", "..", "docs", "wzgorza_popraw", "surowe");
fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9505, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    for (const [x, y] of MIEJSCA) {
        await t.newGame({ map: MAPA, x, y: y + 4, day: 40, hour: 12, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); 0");
        await t.eval("(function(){ const sp = SceneManager._scene._spriteset; if (sp._cloudSprites) { for (const c of sp._cloudSprites) if (c.parent) c.parent.removeChild(c); sp._cloudSprites.length = 0; } return 0; })()");
        await t.frames(100);
        await t.shot(path.join(OUT, `${TAG}_${MAPA}_${x}_${y}.png`));
    }
});
