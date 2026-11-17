// Kominy.js: jeden obrazek komina (bez kafli komina i starego arkusza) i dym z kłębów na mapach nowego świata.
// CDP_PORT=9464 node tests/kominy_test.js      Zrzuty: docs/NOWY_SWIAT/kominy/
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "NOWY_SWIAT", "kominy"); fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9464, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 218, x: 30, y: 38, day: 12, hour: 7, quiet: true, minimap: false });
    await t.frames(300);
    t.check("kominy mają obrazek", await t.json("SceneManager._scene._spriteset._characterSprites.filter(s => s._kominPic).length >= 3"));
    t.check("stary arkusz dymu się nie rysuje", await t.json("$gameMap.events().filter(e => e.event().pages[0].image.characterName === '!Fantasy_chimney').every(e => e.characterName() === '!$1_Komin')"));
    const n = await t.json("Kominy.puffCount()");
    t.check("dym rano: kłęby lecą", n >= 6, n);
    await t.shot(path.join(OUT, "rano.png"));
    await t.eval("$gamePlayer.center(34, 33); 0"); await t.frames(60);
    await t.shot(path.join(OUT, "rano_blisko.png"));
    await t.eval("$gameScreen.changeWeather('storm', 9, 0); 0"); await t.frames(300);
    await t.shot(path.join(OUT, "burza.png"));
    t.check("w burzy dalej dymi", (await t.json("Kominy.puffCount()")) > 0);
    // the old world untouched
    await t.newGame({ map: 111, x: 40, y: 40, day: 12, hour: 7, quiet: true, minimap: false });
    await t.frames(120);
    t.check("stare Podgrodzie bez zmian (stary arkusz)", await t.json("$gameMap.events().filter(e => e.event().pages[0].image.characterName === '!Fantasy_chimney').every(e => e.characterName() === '!Fantasy_chimney')"));
});
