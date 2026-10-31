// Etap 1 swiata (docs/mapy/SWIAT.md): przejscia przez krawedz w TEJ SAMEJ kratce swiata (Krawedzie.js + Swiat_Data.js) na stagingu.
// Uruchom: GAME_OVERLAY=tools/swiat/etap1/staging GAME_OVERLAY_JS=1 CDP_PORT=9382 node tests/swiat_etap1_test.js
// (serwer: node tools/serve.js). Zdjecia stykow: docs/swiat_etap1/styk_*.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_etap1");
fs.mkdirSync(OUT, { recursive: true });

kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const at = () => t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, w: $gameMap.width(), h: $gameMap.height() })`);
    async function cross(name, from, key, expectMap, expectXY, shots) {
        await t.newGame({ map: from.map, x: from.x, y: from.y, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(40);
        if (shots) await t.shot(path.join(OUT, `styk_${name}_a.png`));
        let p = await at();
        for (let i = 0; i < 40 && p.map === from.map; i++) { await t.hold(key, 12); p = await at(); }
        await t.frames(30);
        const ok = p.map === expectMap;
        p = await at();
        if (shots) await t.shot(path.join(OUT, `styk_${name}_b.png`));
        t.check(`${name}: ${from.map} -> ${expectMap} w kratce ${JSON.stringify(expectXY)}`, ok && p.map === expectMap && Math.abs(p.x - expectXY[0]) <= 3 && Math.abs(p.y - expectXY[1]) <= 3, { p });
    }
    const sw = await t.json(`({ on: !!(window.SwiatData && SwiatData.enabled), maps: window.SwiatData ? Object.keys(SwiatData.maps).length : 0 })`);
    await t.newGame({ map: 8, x: 25, y: 8, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(20);
    const sw2 = await t.json(`({ on: !!(window.SwiatData && SwiatData.enabled), size: [$gameMap.width(), $gameMap.height()] })`);
    t.check("Swiat_Data włączone, Map008 104 x 138", sw2.on && sw2.size[0] === 104, sw2);
    await cross("brama_polnocna_miasta_do_gor", { map: 8, x: 25, y: 9 }, "up", 13, [41, 95], true);
    await cross("gory_do_bramy_polnocnej", { map: 13, x: 41, y: 90 }, "down", 8, [25, 4], true);
    await cross("brama_poludniowa_do_przystani", { map: 8, x: 34, y: 130 }, "down", 125, [34, 0], true);
    await cross("przystan_do_miasta", { map: 125, x: 34, y: 6 }, "up", 8, [34, 136], true);
    await cross("podgrodzie_do_miasta", { map: 111, x: 99, y: 17 }, "right", 8, [0, 50], true);
    await cross("miasto_do_podgrodzia", { map: 8, x: 3, y: 50 }, "left", 111, [101, 17], true);
    // brama wschodnia miasta <-> Polna droga (22), Przystan <-> Lesna droga (21)
    await cross("brama_wschodnia_do_polnej_drogi", { map: 8, x: 96, y: 18 }, "right", 22, [1, 42], true);
    await cross("polna_droga_do_bramy_wschodniej", { map: 22, x: 6, y: 42 }, "left", 8, [102, 18], true);
    await cross("przystan_do_lesnej_drogi", { map: 125, x: 31, y: 70 }, "down", 21, [11, 1], true);
    await cross("lesna_droga_do_przystani", { map: 21, x: 11, y: 8 }, "up", 125, [31, 78], true);
    // sciezki brzegowe do nowych map ogona (Swiat_Data.links) - tylko jesli nowa mapa ma ladowe kratki przy krawedzi: wejscie z 21 na 914 (W) i 920 (E)
    await t.newGame({ map: 914, x: 70, y: 10, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(20);
    const nm = await t.json(`({ map: $gameMap.mapId(), w: $gameMap.width(), h: $gameMap.height(), name: $dataMapInfos[914] && $dataMapInfos[914].name })`);
    t.check("nowa mapa 914 w grze (80x80, w MapInfos)", nm.map === 914 && nm.w === 80 && nm.h === 80 && !!nm.name, nm);
    // przejscie przez most nad fosa (x 90-99, y 16-19) na piechote
    await t.newGame({ map: 111, x: 91, y: 18, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    let br = await at(); await t.hold("down", 1);
    for (let i = 0; i < 40 && br.map === 111 && br.x < 99; i++) { await t.hold("right", 12); br = await at(); }
    t.check("most: od przyczółka (x 91) da się dojść do bramy (x >= 99)", br.map === 111 && br.x >= 99, br);
    await t.shot(path.join(OUT, "most_w_grze.png"));
    // gdzie nie ma przejscia danych/zdarzenia: ściana (Map008 N poza bramą)
    await t.newGame({ map: 8, x: 10, y: 6, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(20);
    await t.eval(`$gamePlayer.locate(30, 5)`);
    await t.hold("up", 60);
    const wall = await at();
    t.check("mur N poza bramą: zostaje na mapie 8", wall.map === 8, wall);
});
