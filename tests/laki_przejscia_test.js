// Łąki #2 i #3 (2026-10-18): dawne wyjścia Kruczego Jaru (Map003) na Łąkę#2 (południe) i Łąkę#3 (zachód) - tools/apply_laki.py.
// (2026-10-31, świat bez szwów, docs/mapy/SWIAT.md) te same drogi prowadzą teraz tam, gdzie leży sąsiad w świecie (Swiat_Data.js):
// Kruczy Jar południe -> Dom dziadka (20), zachód -> Posiadłość Lorda (24); Łąka#2 północ -> Skraj lasu (23); Łąka#3 wschód -> Łąka pod
// Klifem (963). Cel i kratkę lądowania test liczy z mapy świata (ta sama kratka świata, najwyżej krok w głąb). Ścieżki widoczne aż do
// krawędzi (kafelek drogi w danych); przejścia zapisane w plikach map prowadzą tylko do sąsiadów w świecie; usunięte puste mapy 5, 6, 7,
// 15, 16 nie wiszą w MapInfos.
// CDP_PORT=9541 node tests/laki_przejscia_test.js
const kit = require("./lib/kit.js");

// [z mapy, x, y, kierunek marszu] - środkowy kafelek i skraje dawnych wyjść; cel i lądowanie liczy mapa świata
// (2026-10-18: the field and the meadows doubled to 80x60 by tools/powieksz - the south exit is on row 59; 2026-10-31: Łąka#3 is 90 wide, its east edge x 89)
const WALKS = [
    [3, 9, 59, 2], [3, 8, 59, 2], [3, 10, 59, 2],
    [17, 9, 0, 8], [17, 8, 0, 8],
    [3, 0, 16, 4], [3, 0, 14, 4],
    [18, 89, 15, 6], [18, 89, 16, 6]
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

    for (const [fm, x, y, walk] of WALKS) {
        // the world's neighbour of that edge tile and the same world tile on it (Krawedzie.js lands there)
        const exp = await t.json(`(function(){ const sw = SwiatData, [x0, y0, w, h] = sw.maps[${fm}], d = ${walk};
            const wx = d === 4 ? x0 - 1 : d === 6 ? x0 + w : x0 + ${x}, wy = d === 8 ? y0 - 1 : d === 2 ? y0 + h : y0 + ${y};
            for (const id of Object.keys(sw.maps)) { const [bx, by, bw, bh] = sw.maps[id];
                if (+id !== ${fm} && wx >= bx && wx < bx + bw && wy >= by && wy < by + bh) return { map: +id, x: wx - bx, y: wy - by }; }
            return null; })()`);
        const sx = x - STEP[walk][0], sy = y - STEP[walk][1];
        await t.go(fm, sx, sy, walk);
        await t.until(`$gamePlayer.x === ${sx} && $gamePlayer.y === ${sy}`, 10);
        await t.eval(`(function(){ if ($gameMessage.isBusy()) $gameMessage.clear(); Input.clear(); Input._currentState["${KEY[walk]}"] = true; return 0; })()`);
        const moved = await t.until(`$gamePlayer.isTransferring() || $gameMap.mapId() !== ${fm}`, 8, 60);
        await t.eval(`(function(){ Input._currentState["${KEY[walk]}"] = false; return 0; })()`);
        const tm = exp ? exp.map : -1;
        await t.until(`!$gamePlayer.isTransferring() && SceneManager._scene.constructor.name === "Scene_Map" && !SceneManager.isSceneChanging() && $gameMap.mapId() === ${tm}`, 20);
        await t.frames(5);
        const r = await t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })`);
        const near = exp && Math.abs(r.x - exp.x) + Math.abs(r.y - exp.y) <= 1;
        t.check(`Map${String(fm).padStart(3, "0")} (${x},${y}) idąc ${KEY[walk]} -> sąsiad w świecie Map${String(tm).padStart(3, "0")} w tej samej kratce świata (${exp ? exp.x + "," + exp.y : "-"}), twarzą ${KEY[walk]}`,
            moved && !!exp && r.map === tm && near && r.d === walk, { r, exp });
    }

    // the compass (CleanHUD_Compass) and the eagle's flight read the exits from the map files: they lead only to the world's neighbours
    const graph = await t.json(`Promise.all([3, 17, 18].map(id => fetch("data/Map" + String(id).padStart(3, "0") + ".json").then(r => r.json()).then(m =>
        ({ id, to: [...new Set(m.events.filter(Boolean).flatMap(e => e.pages.flatMap(p => p.list.filter(c => c.code === 201 && c.parameters[0] === 0).map(c => c.parameters[1]))))] }))))`, 20000);
    const nb = await t.json(`(function(){ const M = SwiatData.maps, out = {};
        for (const a of [3, 17, 18]) { const [ax, ay, aw, ah] = M[a]; out[a] = Object.keys(M).map(Number).filter(b => { if (b === a) return false; const [bx, by, bw, bh] = M[b];
            const ew = (ax + aw === bx || bx + bw === ax) && Math.min(ay + ah, by + bh) > Math.max(ay, by), ns = (ay + ah === by || by + bh === ay) && Math.min(ax + aw, bx + bw) > Math.max(ax, bx);
            return ew || ns; }); }
        return out; })()`);
    const bad = graph.flatMap(g => g.to.filter(m => !(nb[g.id] || []).includes(m)).map(m => g.id + "->" + m));
    t.check("przejścia w plikach map 3, 17, 18 prowadzą tylko do sąsiadów w świecie (kompas i lot orła czytają je stąd)", graph.length === 3 && bad.length === 0, { graph, bad });
    await t.done();
});
