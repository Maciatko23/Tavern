// Zrzuty wzgórz z gry (do porównania z nakładką i bez): ZBLIZENIA='[["nazwa",mapa,x,y],...]' PREFIKS=przed|po ZRZUTY_OUT=docs/wzgorza
// Z nakładką: GAME_OVERLAY=tools/wzgorza/staging/nakladka GAME_OVERLAY_JS=1 CDP_PORT=9413 PREFIKS=po node tests/wzgorza_zrzuty.js
// Ekran gry wycentrowany w kratce (x, y mogą być ułamkowe), postać ukryta, bez HUD.
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", process.env.ZRZUTY_OUT || "docs/wzgorza"); fs.mkdirSync(OUT, { recursive: true });
const PTS = JSON.parse(process.env.ZBLIZENIA || "[]"), PRE = process.env.PREFIKS || "po";
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    let mapa = 0;
    for (const [nazwa, id, x, y] of PTS) {
        if (mapa !== id) { await t.newGame({ map: id, x: Math.floor(x), y: Math.floor(y), day: 12, hour: 11, quiet: true, minimap: false }); await t.frames(300); mapa = id; }
        await t.eval(`$gamePlayer.setTransparent(true); $gamePlayer.locate(${Math.floor(x)}, ${Math.floor(y)}); $gameMap.setDisplayPos(${x} - $gameMap.screenTileX() / 2 + 0.5, ${y} - $gameMap.screenTileY() / 2 + 0.5); 0`);
        await t.frames(40);
        if (PRE === "po") console.log(nazwa, JSON.stringify(await t.json("window.Wzgorza ? Wzgorza.stats() : null")));
        await t.shot(path.join(OUT, `${PRE}_${nazwa}.png`));
    }
});
