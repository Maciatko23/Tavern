// Krawędzie map i mur działki dziadka (2026-10-22):
//   - Krawedzie.js: dojście do brzegu mapy w dowolnym miejscu (nie tylko na ścieżce) przenosi na sąsiednią mapę, gdy ta strona ma
//     przejście; bez przejścia po tej stronie nic się nie dzieje; na nowej mapie bohater stoi na wolnym polu
//   - Farming_Build: na działce dziadka (Map003, Kruczy Jar) budować wolno tylko w obrębie muru, 2 kratki od niego (u góry od krawędzi wzniesienia)
// Uruchom: CDP_PORT=9561 node tests/krawedzie_test.js (serwer: node tools/serve.js)
const kit = require("./lib/kit.js");

kit.test({ port: 9561, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 3, x: 20, y: 15, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const api = await t.json("({ k: !!window.Krawedzie, order: (function(){ const ix = n => $plugins.findIndex(p => p.name === n && p.status); return [ix('FreeMovement'), ix('Homes'), ix('Orzel_Lot'), ix('Krawedzie')]; })() })");
    t.check("Krawedzie w grze, po FreeMovement, Homes i Orzel_Lot", api.k && api.order[3] > api.order[0] && api.order[3] > api.order[1] && api.order[3] > api.order[2], api);

    // ---------------------------------------------------------------- mur działki dziadka
    const wall = await t.json(`(function(){ const why = (x, y) => Farming.whyNotBuild("doghouse", x, y, false, false);
        return { corner: why(3, 10), rise: why(10, 5), riseOk: why(10, 6), mid: why(20, 15), east: why(36, 15), south: why(20, 26), gate: why(20, 3) }; })()`);
    // (2026-10-23: the wall is a wooden fence now - rails at y 3 and y 28, posts at x 2 and x 37: the lowest row 2 tiles off is y 26)
    const W = "Buduj w obrębie muru, 2 kratki od niego.";
    t.check("mur działki: przy murze (x 3), pod wzniesieniem (y 5), przy murze na dole (y 26) i z prawej (x 36) - nie wolno",
        wall.corner === W && wall.rise === W && wall.east === W && wall.south === W && wall.gate === W, wall);
    t.check("mur działki: w środku i 2 rzędy pod wzniesieniem (y 6) - mur nie przeszkadza (najwyżej inny powód)", wall.mid !== W && wall.riseOk !== W, wall);
    const newPart = await t.json(`Farming.whyNotBuild("doghouse", 60, 40, false, false)`);
    t.check("nowa część Kruczego Jaru (region 9) dalej: „To już nie działka dziadka.”", newPart === "To już nie działka dziadka.", newPart);

    // ---------------------------------------------------------------- brzeg mapy poza ścieżką
    // (wolne pole na krawędzi z przejściem, daleko od samego przejścia)
    const spot = await t.json(`(function(){ const W = $gameMap.width(), H = $gameMap.height();
        const sides = { N: [], S: [], W: [], E: [] };
        for (const side of ["N", "S", "W", "E"]) { const ex = Krawedzie.exitsOn(side); if (!ex.length) continue;
            const cells = side === "N" || side === "S" ? [...Array(W).keys()].map(x => [x, side === "N" ? 0 : H - 1]) : [...Array(H).keys()].map(y => [side === "W" ? 0 : W - 1, y]);
            for (const [x, y] of cells) {
                if (![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) || $gameMap.eventsXy(x, y).length) continue;
                const far = ex.every(e => Math.abs((side === "N" || side === "S" ? e.ev.x - x : e.ev.y - y)) >= 3);
                if (far) sides[side].push({ x, y, to: ex[0].cmd[1] });
            } }
        for (const side of ["E", "S", "N", "W"]) if (sides[side].length) { const c = sides[side][Math.floor(sides[side].length / 2)]; return Object.assign({ side }, c); }
        return null; })()`);
    t.check("w Kruczym Jarze jest wolny brzeg z przejściem po tej stronie, z dala od ścieżki", !!spot, spot);
    if (spot) {
        const key = { N: "up", S: "down", W: "left", E: "right" }[spot.side];
        await t.eval(`(function(){ $gamePlayer.locate(${spot.x}, ${spot.y}); return 0; })()`);
        await t.frames(10);
        await t.hold(key, 40);
        const arrived = await t.until(t.onMap(spot.to), 15);
        await t.frames(20);
        const at = await t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, free: [2, 4, 6, 8].some(d => $gameMap.isPassable($gamePlayer.x, $gamePlayer.y, d)) })`);
        t.check("dojście do brzegu poza ścieżką przenosi na sąsiednią mapę, na wolne pole", arrived && at.map === spot.to && at.free, { spot, at });
    }

    // ---------------------------------------------------------------- strona bez przejścia: nic
    await t.newGame({ map: 17, x: 20, y: 15, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const dead = await t.json(`(function(){ const sides = ["N", "S", "W", "E"].filter(s => !Krawedzie.exitsOn(s).length); if (!sides.length) return null;
        const side = sides[0], W = $gameMap.width(), H = $gameMap.height();
        const cells = side === "N" || side === "S" ? [...Array(W).keys()].map(x => [x, side === "N" ? 0 : H - 1]) : [...Array(H).keys()].map(y => [side === "W" ? 0 : W - 1, y]);
        const c = cells.find(([x, y]) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) && !$gameMap.eventsXy(x, y).length);
        return c ? { side, x: c[0], y: c[1] } : { side }; })()`);
    if (dead && dead.x !== undefined) {
        await t.eval(`(function(){ $gamePlayer.locate(${dead.x}, ${dead.y}); return 0; })()`);
        await t.frames(10);
        await t.hold({ N: "up", S: "down", W: "left", E: "right" }[dead.side], 40);
        await t.frames(30);
        const still = await t.json("({ map: $gameMap.mapId(), tr: $gamePlayer.isTransferring() })");
        t.check("brzeg bez przejścia po tej stronie (Omszała łąka): bohater zostaje na mapie", still.map === 17 && !still.tr, { dead, still });
    } else t.check("brzeg bez przejścia: jest strona bez przejść na Omszałej łące", false, dead);
});
