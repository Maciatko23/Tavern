// Zbliżenia (ekran gry wycentrowany w kratce) na wskazane miejsca map próbnych: ZBLIZENIA='[["nazwa",990,x,y],...]' ZRZUTY_OUT=docs/mapa_probna/runda2 PREFIKS=przed
// Bez nakładki: mapy z data/ (stan zainstalowany); z GAME_OVERLAY=tools/mapa_probna/staging/nakladka GAME_OVERLAY_JS=1: stan ze stagingu.
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", process.env.ZRZUTY_OUT || "docs/mapa_probna/runda2"); fs.mkdirSync(OUT, { recursive: true });
const PTS = JSON.parse(process.env.ZBLIZENIA || "[]"), PRE = process.env.PREFIKS || "po";
kit.test({ port: Number(process.env.CDP_PORT) || 9412, beforeLoad: process.env.ZIEMIA_OFF ? "window.ZIEMIA = { off: true };" : undefined, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    let mapa = 0; const mapaZ = {};
    for (const [nazwa, id, x, y] of PTS) {
        if (mapa !== id) { await t.newGame({ map: id, x, y, day: 12, hour: 11, quiet: true, minimap: false }); await t.frames(420); mapa = id; }
        await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.center(${x}, ${y}); 0`);
        await t.frames(12);
        if (!mapaZ[id]) { mapaZ[id] = true; const n = await t.json("$gameMap.events().filter(e => e.eventId() >= 3100 && e.eventId() < 3140).length"); t.check("Ziemia_Ozdoby: żadnych ozdób na mapie " + id, n === 0, n); }
        await t.shot(path.join(OUT, `${PRE}_${nazwa}.png`));
    }
});
