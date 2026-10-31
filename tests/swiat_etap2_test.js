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
    const sw = await t.json(`({ on: !!(window.SwiatData && SwiatData.enabled), m20: window.SwiatData && SwiatData.maps[20], m900: window.SwiatData && SwiatData.maps[900] })`);
    t.check("Swiat_Data etapu 2: mapy 20 (80x64) i 900", sw.on && sw.m20 && sw.m20[2] === 80 && sw.m20[3] === 64 && !!sw.m900, sw);
    await cross("pole_do_domu_dziadka", { map: 3, x: 9, y: 54 }, "down", 20, [9, 1], true);
    await cross("dom_dziadka_do_pola", { map: 20, x: 9, y: 3 }, "up", 3, [9, 58], true);
    await cross("pole_do_dworu", { map: 3, x: 5, y: 15 }, "left", 24, [78, 15], true);
    await cross("dwor_do_pola", { map: 24, x: 78, y: 15 }, "right", 3, [1, 15], true);
    await cross("skraj_lasu_do_laki2", { map: 23, x: 40, y: 54 }, "down", 17, [40, 1], true);
    await cross("laka2_do_skraju_lasu", { map: 17, x: 40, y: 6 }, "up", 23, [40, 58], true);
    await cross("skraj_lasu_do_pol_pod_grzbietem", { map: 23, x: 24, y: 5 }, "up", 900, [19, 58], true);
    await cross("pola_do_skraju_lasu", { map: 900, x: 19, y: 54 }, "down", 23, [24, 1], true);
    // (tymczasowe przejście Sady 901 <-> Łąka#3 18 z etapu 2 usunięte w etapie 3: Łąka#3 stoi już na swoim miejscu w świecie)
    // z drzwi chaty dziadka da sie dojsc do wyjscia N (droga po zachodniej stronie)
    await t.newGame({ map: 20, x: 15, y: 8, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const reach = await t.json(`(function(){ const seen = new Set(), st = [[$gamePlayer.x, $gamePlayer.y]]; seen.add(st[0].join());
        const D = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
        while (st.length) { const [x, y] = st.pop(); for (const d of [2, 4, 6, 8]) { if (!$gameMap.isPassable(x, y, d)) continue; const n = [x + D[d][0], y + D[d][1]]; if (!$gameMap.isValid(n[0], n[1]) || seen.has(n.join())) continue; seen.add(n.join()); st.push(n); } }
        return [seen.has("8,0"), seen.has("9,0"), seen.has("10,0")]; })()`);
    t.check("z podwórza chaty (15,8) da się dojść pieszo do wyjścia N (8-10, 0) Domu dziadka", reach.every(Boolean), reach);
});
