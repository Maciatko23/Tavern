// Pomiar przejść między mapami (2026-11-03, przed przyspieszaniem/wczytywaniem z wyprzedzeniem): na co idzie czas od wejścia w przejście do
// pełnego obrazu nowej mapy - ściemnianie starej, dane mapy (JSON), obrazki, nakładki (brzeg, Ziemia, łąka) i reszta przygotowań, rozjaśnianie.
//   node tools/przejscia/pomiar.js            (CPU=4: komputer 4x słabszy)
"use strict";
const kit = require("../../tests/lib/kit.js");
const CPU = Number(process.env.CPU) || 1;
const TRASA = [[8, 3], [3, 8], [8, 13], [13, 120], [120, 8], [8, 125], [125, 159], [159, 8], [8, 1], [1, 8], [990, 991], [991, 990]];
const START = { 8: [54, 50], 3: [25, 15], 13: [29, 25], 120: [20, 31], 125: [27, 20], 159: [20, 20], 1: [17, 20], 990: [40, 16], 991: [30, 20] };
kit.test({ port: Number(process.env.CDP_PORT) || 9420, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 8, x: 54, y: 50, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(120);
    // the stopwatch: hooks put on last (over every plugin)
    await t.eval(`(() => {
        const W = window.__pm = { log: [] }, now = () => performance.now();
        const _create = Scene_Map.prototype.create, _start = Scene_Map.prototype.start, _ready = Scene_Map.prototype.isReady, _onLoad = DataManager.onLoad, _load = DataManager.loadMapData;
        DataManager.loadMapData = function(id) { if (W.cur) W.cur.dataReq = now(); return _load.apply(this, arguments); };
        DataManager.onLoad = function(object) { const r = _onLoad.apply(this, arguments); if (W.cur && object === window.$dataMap) W.cur.data = now(); return r; };
        Scene_Map.prototype.create = function() { if (W.cur && !W.cur.create) W.cur.create = now(); return _create.apply(this, arguments); };
        Scene_Map.prototype.isReady = function() {
            const r = _ready.apply(this, arguments);
            if (W.cur && W.cur.create && !W.cur.ready) { W.cur.frames = (W.cur.frames || 0) + 1; if (!W.cur.img && ImageManager.isReady()) W.cur.img = now(); if (r) W.cur.ready = now(); }
            return r;
        };
        Scene_Map.prototype.start = function() { const r = _start.apply(this, arguments); if (W.cur && !W.cur.start) W.cur.start = now(); return r; };
        const _upd = SceneManager.updateMain;
        SceneManager.updateMain = function() { _upd.apply(this, arguments); const s = SceneManager._scene;
            if (W.cur && W.cur.start && !W.cur.shown && s instanceof Scene_Map && !s.isBusy() && !s._fadeDuration) { W.cur.shown = now(); W.log.push(W.cur); W.cur = null; } };
        return 0; })()`);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    const wyniki = [];
    for (const [a, b] of TRASA) {
        if ((await t.json("$gameMap.mapId()")) !== a) { await t.go(a, START[a][0], START[a][1], 2); await t.frames(60); }
        await t.frames(30);
        const [x, y] = START[b];
        await t.eval(`window.__pm.cur = { from: ${a}, to: ${b}, t0: performance.now() }; $gamePlayer.reserveTransfer(${b}, ${x}, ${y}, 2, 0); 0`);
        await t.until(`!window.__pm.cur && $gameMap.mapId() === ${b}`, 60);
        const r = await t.json("window.__pm.log[window.__pm.log.length - 1]");
        const ms = v => (v ? Math.round(v - r.t0) : null);
        const row = { trasa: a + "->" + b, sciemnianie: ms(r.create), dane: r.data && r.dataReq ? Math.round(r.data - r.dataReq) : null, obrazki: r.img ? Math.round(r.img - r.create) : null,
            gotowa: r.ready ? Math.round(r.ready - r.create) : null, klatki: r.frames, rozjasnianie: r.shown && r.start ? Math.round(r.shown - r.start) : null, razem: ms(r.shown) };
        wyniki.push(row);
        console.log("   " + JSON.stringify(row));
        await t.frames(30);
    }
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const sr = k => Math.round(wyniki.reduce((s, r) => s + (r[k] || 0), 0) / wyniki.length);
    console.log("   ŚREDNIO (CPU " + CPU + "x): ściemnianie " + sr("sciemnianie") + " ms, przygotowanie (dane+obrazki+nakładki) " + sr("gotowa") + " ms (dane " + sr("dane") + ", obrazki " + sr("obrazki") + "), rozjaśnianie " + sr("rozjasnianie") + " ms, razem " + sr("razem") + " ms");
    t.check("pomiar zrobiony", wyniki.length === TRASA.length);
});
