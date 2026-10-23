// Łąki #2 i #3 (2026-10-18): Kruczy Jar (Map003) ma przejścia na Łąkę#2 (Map017, krawędź południowa) i na Łąkę#3 (Map018,
// krawędź zachodnia) - tools/apply_laki.py, tools/newstart/layout.py MEADOW_EDGES. Bohater staje przed wyjściem, trzyma strzałkę
// aż do zmiany mapy, sprawdzamy mapę, kafelek i kierunek; ścieżka widoczna aż do krawędzi (kafelek drogi w danych); kompas zna
// wyjścia; usunięte puste mapy 5, 6, 7, 15, 16 nie wiszą w MapInfos.
// CDP_PORT=9541 node tests/laki_przejscia_test.js
const kit = require("./lib/kit.js");

// [z mapy, x, y, na mapę, x, y, kierunek po przejściu, kierunek marszu] - obie strony obu przejść (środkowy kafelek i skraje)
// (2026-10-18: the field and the meadows doubled to 80x60 by tools/powieksz - the south exit is on row 59, Łąka#3's east one on x 79)
const WALKS = [
    [3, 9, 59, 17, 9, 1, 2, 2], [3, 8, 59, 17, 8, 1, 2, 2], [3, 10, 59, 17, 10, 1, 2, 2],
    [17, 9, 0, 3, 9, 58, 8, 8], [17, 8, 0, 3, 8, 58, 8, 8],
    [3, 0, 16, 18, 78, 16, 4, 4], [3, 0, 14, 18, 78, 14, 4, 4],
    [18, 79, 15, 3, 1, 15, 6, 6], [18, 79, 16, 3, 1, 16, 6, 6]
];
const KEY = { 2: "down", 4: "left", 6: "right", 8: "up" }, STEP = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

kit.test({ port: 9541 }, async t => {
    t.check("nowa gra w Kruczym Jarze (Map003), południe", await t.newGame({ map: 3, x: 9, y: 26, hour: 12, quiet: true, minimap: false }));
    await t.eval("(function(){ if (window.Hunting) Hunting.auto(false); if (window.Birds) Birds.auto(false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); return 0; })()");

    // the data: the paths reach the edges, the empty maps are gone from the tree
    const data = await t.json(`(function(){
        const k = (x, y, z) => { const id = $dataMap.data[(z * $dataMap.height + y) * $dataMap.width + x]; return id >= 2048 ? Math.floor((id - 2048) / 48) : id; };
        return { south: [9, 10].map(x => k(x, 29, 1)), south2: [9, 10].map(x => k(x, 59, 1)), size: [$dataMap.width, $dataMap.height],
                 west: [0, 1, 2].map(x => k(x, 16, 1)), joined: k(9, 17, 1), region9: $dataMap.data[(5 * $dataMap.height + 50) * $dataMap.width + 50],
                 gone: [5, 6, 7, 15, 16].filter(id => $dataMapInfos[id]), meadows: [17, 18].map(id => !!$dataMapInfos[id]) }; })()`);
    t.check("Map003 80x60: droga (rodzaj 39) przez starą lukę (9..10, 29) aż do nowej południowej krawędzi (9..10, 59)",
        data.size.join() === "80,60" && data.south.every(v => v === 39) && data.south2.every(v => v === 39), data);
    t.check("Map003: nowa część to region 9 (nie działka dziadka - Farming_Build nie pozwala tam budować)", data.region9 === 9, data.region9);
    t.check("Map003: ścieżka (rodzaj 39) aż do zachodniej krawędzi (0..2, 16) i połączona z drogą przy (9, 17)", data.west.every(v => v === 39) && data.joined === 39, data);
    t.check("MapInfos: bez pustych map 5, 6, 7, 15, 16; Łąki #2 i #3 są", data.gone.length === 0 && data.meadows.every(Boolean), data);

    for (const [fm, x, y, tm, tx, ty, d, walk] of WALKS) {
        const sx = x - STEP[walk][0], sy = y - STEP[walk][1];
        await t.go(fm, sx, sy, walk);
        await t.until(`$gamePlayer.x === ${sx} && $gamePlayer.y === ${sy}`, 10);
        await t.eval(`(function(){ if ($gameMessage.isBusy()) $gameMessage.clear(); Input.clear(); Input._currentState["${KEY[walk]}"] = true; return 0; })()`);
        const moved = await t.until(`$gamePlayer.isTransferring() || $gameMap.mapId() !== ${fm}`, 8, 60);
        await t.eval(`(function(){ Input._currentState["${KEY[walk]}"] = false; return 0; })()`);
        await t.until(`!$gamePlayer.isTransferring() && SceneManager._scene.constructor.name === "Scene_Map" && !SceneManager.isSceneChanging() && $gameMap.mapId() === ${tm}`, 20);
        await t.frames(5);
        const r = await t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })`);
        t.check(`Map${String(fm).padStart(3, "0")} (${x},${y}) idąc ${KEY[walk]} -> Map${String(tm).padStart(3, "0")} (${tx},${ty}), twarzą ${KEY[d]}`,
            moved && r.map === tm && r.x === tx && r.y === ty && r.d === d, r);
    }

    // the compass (CleanHUD_Compass) reads the exits from the map files: grandpa's field leads to both meadows and back
    const graph = await t.json(`Promise.all([3, 17, 18].map(id => fetch("data/Map" + String(id).padStart(3, "0") + ".json").then(r => r.json()).then(m =>
        ({ id, to: [...new Set(m.events.filter(Boolean).flatMap(e => e.pages.flatMap(p => p.list.filter(c => c.code === 201 && c.parameters[0] === 0).map(c => c.parameters[1]))))] }))))`, 20000);
    const to = id => (graph.find(g => g.id === id) || { to: [] }).to;
    t.check("przejścia w plikach map: 3 -> 17 i 18, 17 -> 3, 18 -> 3 (kompas i lot orła czytają je stąd)",
        to(3).includes(17) && to(3).includes(18) && to(17).includes(3) && to(18).includes(3), graph);
    await t.done();
});
