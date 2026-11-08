// Mozaika zrzutów całej wyspy (kamera ustawiana kratka w kratkę, bohater niewidoczny) - TAG/MAPA, X0,Y0,X1,Y1 (kratki), z nakładką
//   GAME_OVERLAY=tools/wyspy/staging GAME_OVERLAY_JS=1 TAG=po MAPA=917 OBSZAR=24,4,84,55 CDP_PORT=9505 node tools/wyspy/zrzut_calej.js
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const TAG = process.env.TAG || "po", MAPA = Number(process.env.MAPA) || 917;
const [X0, Y0, X1, Y1] = (process.env.OBSZAR || "24,4,84,55").split(",").map(Number);
const OUT = path.join(__dirname, "..", "..", "docs", "wyspy", "surowe");
fs.mkdirSync(OUT, { recursive: true });
// (the hero's sight (Widok.js) and the vignette (Mood.js) off: the screens are one picture of the place, not of what the hero sees)
kit.test({ port: Number(process.env.CDP_PORT) || 9505, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    beforeLoad: "window.WIDOK = false;" }, async t => {
    await t.newGame({ map: MAPA, x: Math.round((X0 + X1) / 2), y: Math.round((Y0 + Y1) / 2), day: 40, hour: Number(process.env.HOUR) || 12, quiet: true, minimap: false });
    if (process.env.TIDE) await t.eval(`Tawerna.api("Wyspa").forceTide("${process.env.TIDE}"); 0`);
    await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); 0");
    await t.eval("(function(){ const sp = SceneManager._scene._spriteset; if (sp._cloudSprites) { for (const c of sp._cloudSprites) if (c.parent) c.parent.removeChild(c); sp._cloudSprites.length = 0; } return 0; })()");
    await t.eval("window.Mood && Mood.setOption('vig', false); 0");
    await t.eval("window.__hud = (SceneManager._scene._cleanLayer || {}); for (const k of ['_cleanLayer','_cleanTop','_windowLayer']) if (SceneManager._scene[k]) SceneManager._scene[k].visible = false; 0");
    await t.frames(60);
    const cw = 1280 / 48 - 2, ch = 720 / 48 - 3, list = [];   // (overlapping: the screen's edges have the HUD's shade)
    for (let y = Y0; y < Y1; y += ch) for (let x = X0; x < X1; x += cw) list.push([x, y]);
    let k = 0;
    const real = [];
    for (const [x, y] of list) {
        await t.eval(`$gameMap.setDisplayPos(${x}, ${y}); 0`);
        await t.frames(40);
        real.push(await t.json("[$gameMap.displayX(), $gameMap.displayY()]"));   // (at the map's edges the camera stops: its real place)
        await t.eval("for (const k of ['_cleanLayer','_cleanTop','_windowLayer']) if (SceneManager._scene[k]) SceneManager._scene[k].visible = false; 0");
        await t.frames(2);
        await t.shot(path.join(OUT, `${TAG}_${MAPA}_m${k++}.png`));
    }
    fs.writeFileSync(path.join(OUT, `${TAG}_${MAPA}_mozaika.json`), JSON.stringify({ list: real, cw, ch }));
});
