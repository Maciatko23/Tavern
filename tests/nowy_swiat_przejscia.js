// Nowy świat: przejścia krawędzią między 5 mapami (Swiat_Data_Nowy.js): Wybrzeże -> Podgrodzie -> Miasteczko -> Posiadłość -> Góry i z powrotem.
// CDP_PORT=9440 node tests/nowy_swiat_przejscia.js      Zrzuty: docs/NOWY_SWIAT/przejscia/
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "NOWY_SWIAT", "przejscia"); fs.mkdirSync(OUT, { recursive: true });
const LINE = [[219, 45], [218, 38], [220, 41], [221, 41], [222, 41]];   // (map, the road's row at its east edge)
kit.test({ port: Number(process.env.CDP_PORT) || 9440, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    t.check("nowe mapy są w świecie", await t.json("[219,218,220,221,222].every(m => !!SwiatData.maps[m])"));
    for (let i = 0; i < LINE.length - 1; i++) {
        const [a, ya] = LINE[i], [b] = LINE[i + 1];
        await t.newGame({ map: a, x: 76, y: ya, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(120);
        if (i === 0) await t.shot(path.join(OUT, "219_przed_krawedzia.png"));
        let m = a;
        for (let k = 0; k < 20 && m === a; k++) { await t.hold("right", 10); m = await t.json("$gameMap.mapId()"); }
        await t.frames(60);
        const p = await t.json("[$gamePlayer.x, $gamePlayer.y]");
        t.check(a + " -> " + b + " drogą", m === b && p[0] <= 2 && Math.abs(p[1] - ya) <= 2, { m, p });
        await t.shot(path.join(OUT, a + "_do_" + b + ".png"));
        for (let k = 0; k < 20 && m === b; k++) { await t.hold("left", 10); m = await t.json("$gameMap.mapId()"); }
        t.check(b + " -> " + a + " z powrotem", m === a, { m });
    }
});
