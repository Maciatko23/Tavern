// Zrzuty bohatera w zadanych pozycjach (piksele lewego górnego rogu sprite'a): POZYCJE='[["nazwa",mapa,fx,fy],...]' PREFIKS=przed|po node tests/wzgorza_galeria.js
// Wynik: docs/wzgorza/runda3/<prefiks>_<nazwa>.png (1280 x 720, bohater pośrodku, o ile mapa nie zatrzymuje przewijania). po: GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1.
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "wzgorza", process.env.PODKATALOG || "runda3"); fs.mkdirSync(OUT, { recursive: true });
const PRE = process.env.PREFIKS || "po", POS = JSON.parse(process.env.POZYCJE || "[]");
kit.test({ port: Number(process.env.CDP_PORT) || 9413, width: Number(process.env.SZER) || 1280, height: Number(process.env.WYS) || 720, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    let mapa = 0;
    for (const [nazwa, id, fx, fy, dir] of POS) {
        if (mapa !== id) { await t.newGame({ map: id, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false }); for (let i = 0; i < 60 && (await t.json("window.Wzgorza ? Wzgorza.stats().todo : 0")) > 0; i++) await t.frames(10); mapa = id; }
        if (process.env.GODZINA) { await t.eval(`$gameSystem.setDayNightHour(${process.env.GODZINA}); ${process.env.DESZCZ ? "$gameScreen.changeWeather('rain', 6, 0);" : ""} 0`); await t.frames(90); }
        await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer.setDirection(${dir || 2}); $gamePlayer._wzUp = false; $gamePlayer._realX = ${fx} / 48; $gamePlayer._realY = ${fy} / 48; $gamePlayer._x = Math.round(${fx} / 48); $gamePlayer._y = Math.round(${fy} / 48); $gameMap.setDisplayPos((${fx} - Graphics.width / 2) / 48, (${fy} - Graphics.height / 2) / 48); 0`);
        await t.frames(12);
        await t.shot(path.join(OUT, `${PRE}_${nazwa}.png`));
    }
});
