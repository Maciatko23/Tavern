// Koszt kinowej nazwy mapy (gracz 2026-11-06: „napis mapy i opis w całości, bez zbędnych animacji, wydajność ważniejsza”): czas jej
// aktualizacji w każdej klatce pokazu (pierwsza klatka - składanie obrazków osobno), ile części rysuje i ile tekstur trzyma.
//   [GAME_OVERLAY=tools/nazwa_mapy/staging GAME_OVERLAY_JS=1] CDP_PORT=9462 [CPU=4] node tools/nazwa_mapy/koszt.js
"use strict";
const kit = require("../../tests/lib/kit.js");
const CPU = Number(process.env.CPU) || 1;
kit.test({ port: Number(process.env.CDP_PORT) || 9462, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    await t.eval(`(() => {
        const R = window.__nk = { ms: [], parts: 0, tex: 0 };
        const C = SceneManager._scene._cleanCinema.constructor.prototype, u = C.update;
        C.update = function() { const a = performance.now(); u.apply(this, arguments); if (this._t > 0 || this._parts) { R.ms.push(performance.now() - a);
            if (this._parts) { let n = 0; const walk = s => { for (const c of s.children) { if (c.bitmap) n++; walk(c); } }; walk(this); R.parts = Math.max(R.parts, n); R.tex = Math.max(R.tex, this._bitmaps.length); } } };
    })(); 0`);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.eval(`$gamePlayer.reserveTransfer(22, 12, 10, 2, 0); 0`);
    await t.until(`(function(){ const d = $gameMap.mapId() === 22 && CleanHUD.debug(); return !!(d && d.name && d.name.mapId === 22 && d.name.t >= 200); })()`, 90, 30);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const r = await t.json("window.__nk");
    const first = r.ms.find(v => v > 0) || 0, rest = r.ms.slice(r.ms.indexOf(first) + 1), avg = rest.reduce((a, b) => a + b, 0) / Math.max(1, rest.length);
    console.log("pierwsza klatka (składanie): " + first.toFixed(2) + " ms; potem średnio " + avg.toFixed(3) + " ms na klatkę (" + rest.length + " klatek), najwięcej " + Math.max(...rest).toFixed(2) + " ms");
    console.log("rysowanych części: " + r.parts + ", tekstur: " + r.tex);
});
