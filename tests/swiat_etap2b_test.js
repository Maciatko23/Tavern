// Etap 2 swiata (prawe skrzydlo, partia 1): przejscia 20 <-> 3 <-> 24, 23 <-> 17, 23 <-> 900, legacy 3 <-> 18, droga od drzwi chaty do wyjscia N.
// GAME_OVERLAY=tools/swiat/etap2/staging GAME_OVERLAY_JS=1 CDP_PORT=9382 node tests/swiat_etap2_test.js   Zdjecia: docs/swiat_etap2/styk_*.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_etap2");
fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const at = () => t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })`);
    async function cross(name, from, key, expectMap, expectXY, shots) {
        await t.newGame({ map: from.map, x: from.x, y: from.y, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(40);
        if (shots) await t.shot(path.join(OUT, `styk_${name}_a.png`));
        let p = await at();
        for (let i = 0; i < 60 && p.map === from.map; i++) { await t.hold(key, 12); p = await at(); }
        await t.frames(30);
        const ok = p.map === expectMap;
        p = await at();
        if (shots) await t.shot(path.join(OUT, `styk_${name}_b.png`));
        t.check(`${name}: ${from.map} -> ${expectMap} w kratce ${JSON.stringify(expectXY)}`, ok && p.map === expectMap && Math.abs(p.x - expectXY[0]) <= 3 && Math.abs(p.y - expectXY[1]) <= 3, { p });
    }
    await t.newGame({ map: 3, x: 20, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(20);
    const sw = await t.json(`({ on: !!(window.SwiatData && SwiatData.enabled), m168: window.SwiatData && SwiatData.maps[168], m912: window.SwiatData && SwiatData.maps[912] })`);
    t.check("Swiat_Data partii 2: 168 (130x108) i 912", sw.on && sw.m168 && sw.m168[2] === 130 && !!sw.m912, sw);
    const P = (name, from, key, to, xy) => cross(name, from, key, to, xy, true);
    await P("polna_droga_do_osady", { map: 22, x: 45, y: 4 }, "up", 120, [46, 66]);
    await P("osada_do_polnej_drogi", { map: 120, x: 45, y: 63 }, "down", 22, [45, 1]);
    await P("osada_do_przyladka", { map: 120, x: 90, y: 29 }, "right", 159, [1, 40]);
    await P("pola_do_spalonej_zagrody", { map: 900, x: 70, y: 41 }, "right", 168, [1, 25]);
    await P("zagroda_do_pol", { map: 168, x: 6, y: 25 }, "left", 900, [73, 41]);
    await P("zagroda_do_brzegu_912", { map: 168, x: 60, y: 8 }, "up", 912, [60, 58]);
    await P("brzeg_912_do_zagrody", { map: 912, x: 60, y: 54 }, "down", 168, [60, 1]);
    await P("osada_do_brzegu_934", { map: 120, x: 66, y: 5 }, "up", 934, [30, 38]);
    await P("laka2_do_brzegu_933", { map: 17, x: 74, y: 38 }, "right", 933, [1, 33]);
    await P("zagroda_do_skraju_lasu", { map: 168, x: 6, y: 71 }, "left", 23, [78, 28]);
    await P("dom_dziadka_do_cypla_923", { map: 20, x: 71, y: 60 }, "down", 923, [51, 1]);
    // dziadka da sie dojsc do wyjscia N (droga po zachodniej stronie)
});
