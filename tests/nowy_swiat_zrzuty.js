// Nowy świat (2026-11-13): 5 nowych map 218-222 ładuje się w grze bez błędów + po 3 zrzuty z gry kluczowych miejsc.
// CDP_PORT=9431 node tests/nowy_swiat_zrzuty.js      Wynik: docs/NOWY_SWIAT/gra/*.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "NOWY_SWIAT", "gra"); fs.mkdirSync(OUT, { recursive: true });
const MAPS = [
    [219, "wybrzeze", [[39, 45, "chata_jana"], [20, 40, "wrak"], [19, 22, "latarnia"]]],
    [218, "podgrodzie", [[15, 21, "dom_dziadka"], [40, 43, "droga"], [40, 60, "kladka"]]],
    [220, "miasteczko", [[47, 40, "tawerna"], [48, 44, "rynek"], [10, 26, "kaplica"]]],
    [221, "posiadlosc", [[40, 31, "dwor"], [54, 51, "jaz"], [29, 47, "las_lorda"]]],
    [222, "gory", [[40, 17, "kopalnia"], [66, 21, "zrodlo"], [20, 47, "rzeka"]]],
];
kit.test({ port: Number(process.env.CDP_PORT) || 9431, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    for (const [id, name, spots] of MAPS) {
        const [x0, y0] = spots[0];
        await t.newGame({ map: id, x: x0, y: y0, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(300);
        t.check("mapa " + id + " (" + name + ") załadowana", await t.json("$gameMap.mapId()") === id);
        for (const [x, y, label] of spots) {
            await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.center(${x}, ${y}); 0`);
            await t.frames(20);
            await t.shot(path.join(OUT, `${id}_${name}_${label}.png`));
        }
    }
});
