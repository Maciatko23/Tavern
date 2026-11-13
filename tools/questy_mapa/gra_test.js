// questy_mapa: test W GRZE miejsc przeniesionych na plansze i trzech kieszeni.
//   node tools/questy_mapa/gra_test.js            (nakladka = tools/questy_mapa/staging, takze js)
//   NOOVERLAY=1 node tools/questy_mapa/gra_test.js (gra jak jest - do porownania "przed")
// 1. Okolice.checkMap() na kazdej dotknietej mapie (miejsca wolne, przechodnie, osiagalne pieszo od ENTRY) - lista problemow
// 2. zdarzenia wtyczek tam, gdzie maja stac (zrodlo, polanka, krag menhirow, kapliczki, kopce, straznica, nora, oboz, wiatr...)
// 3. bramy kieszeni: wejscie (krokiem w gore na brame), pobyt, powrot (do krawedzi / bramy) - mapa i kratka
// 4. miejsca zadan: kratka przechodnia i bez cudzego zdarzenia (K3 podkowa, W5 oboz i woz promu, K64 owca, K65 juk, K63 mielerz)
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const OVERLAY = process.env.NOOVERLAY ? undefined : path.join(__dirname, "staging");
const OUT = path.join(__dirname, "wynik_gra_" + (OVERLAY ? "po" : "przed") + ".json");
const res = { checkMap: {}, events: {}, gates: {}, cells: {} };
kit.test({ port: +(process.env.CDP_PORT || 9751), overlay: OVERLAY, overlayJs: !!OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    await t.newGame({ map: 3, x: 50, y: 40, day: 40, hour: 11, quiet: true, minimap: false });
    // ---- 1 + 2: each map: the collision check and the events
    const MAPS = { 3: [43, 33], 4: [50, 60], 111: [60, 28], 125: [100, 90], 13: [30, 60], 8: [60, 45], 120: [OVERLAY ? 46 : 20, OVERLAY ? 64 : 32], 155: [22, 66], 157: [40, 10], 168: [10, 50] };
    for (const [id, at] of Object.entries(MAPS)) {
        const map = +id;
        const ok = await t.go(map, at[0], at[1], 2, { timeout: 60 });
        if (!ok) { res.checkMap[id] = "no map"; console.log("FAIL go " + id); continue; }
        await t.frames(20);
        res.checkMap[id] = await t.json(`(function(){ const r = window.Okolice ? Okolice.checkMap() : null; return JSON.stringify(r ? { spots: r.spots, problems: r.problems } : null); })()`);
        const evs = await t.json(`(function(){ const o = {}; for (const e of $gameMap.events()) { const d = e.event(); if (!d) continue; if (/^(Brama|Słup bramy|Drogowskaz|Miejsce: .*przed)/.test(d.name) || d.id >= 2000) o[d.id] = [d.name, e.x, e.y]; } return JSON.stringify(o); })()`);
        res.events[id] = evs;
    }
    // ---- 3: the gates
    async function walkInto(map, sx, sy, dir, key, secs = 6) {
        await t.go(map, sx, sy, dir);
        await t.eval("$gamePlayer.setOpacity(255); 0");
        await t.eval(`(function(){ Input._currentState[${JSON.stringify(key)}] = true; return 0; })()`);
        const t0 = Date.now();
        let at = await t.json("JSON.stringify([$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y])");
        while (Date.now() - t0 < secs * 1000 && JSON.parse(at)[0] === map) { await t.frames(10); at = await t.json("JSON.stringify([$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y])"); }
        await t.eval(`(function(){ Input._currentState[${JSON.stringify(key)}] = false; return 0; })()`);
        await t.frames(40);
        return JSON.parse(await t.json("JSON.stringify([$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y])"));
    }
    const G = [
        ["gory->osada", 13, 6, 29, 8, "up"], ["przystan->pustelnia", 125, 101, 97, 8, "up"], ["podgrodzie->zagroda", 111, 110, 22, 8, "up"]
    ];
    for (const [name, map, x, y, dir, key] of G) {
        const into = await walkInto(map, x, y, dir, key);
        res.gates[name] = { into };
    }
    // back: pushing into the pocket's exit
    const B = [["osada->gory", 120, 46, 64, 2, "down"], ["pustelnia->przystan", 155, 22, 68, 2, "down"], ["zagroda->podgrodzie", 168, 3, 25, 4, "left"]];
    for (const [name, map, x, y, dir, key] of B) {
        const back = await walkInto(map, x, y, dir, key, 10);
        res.gates[name] = { back };
    }
    // ---- 4: cells of the quests' places
    const C = { horseshoe: [3, 74, 18], w5camp: [3, 96, 52], w5cart: [3, 88, 16], nora: [3, 95, 30], czo: [3, 96, 42], sheep1: [4, 40, 50], sheep2: [4, 62, 45], sheep3: [4, 31, 54],
        juk1: [4, 52, 15], juk2: [4, 64, 14], juk3: [4, 66, 16], kiln: [4, 46, 24], shed: [4, 50, 24], ring: [4, 50, 78], glade: [3, 20, 75], spring: [3, 40, 79] };
    for (const [k, [map, x, y]] of Object.entries(C)) {
        await t.go(map, x, y + 1, 8, { timeout: 60 });
        res.cells[k] = await t.json(`(function(){ const x = ${x}, y = ${y}; const pass = [2,4,6,8].some(d => $gameMap.isPassable(x, y, d));
            const ev = $gameMap.eventsXyNt(x, y).filter(e => e._priorityType === 1 && !e.isThrough()).map(e => e.event() ? e.event().name : "?"); return JSON.stringify({ pass, ev }); })()`);
    }
    fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
    console.log("zapisano " + OUT);
    t.check("wynik zapisany", true);
});
