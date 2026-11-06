// Klatki zaraz po wejściu na mapę (gracz 2026-11-06: kinowy opis przy wejściu), z podziałem na nakładki: ile w każdej klatce zajęła Ziemia, łąka, brzeg (CzerwonaWoda),
// widok (Widok/Pokoje), kinowa nazwa (CleanHUD) i reszta aktualizacji / rysowanie. Od pierwszej klatki z obrazem przez ~3 s.
//   CDP_PORT=9439 [CPU=4] node tools/przejscia/klatki_wejscia.js [z_mapy] [na_mape] [x] [y]
"use strict";
const kit = require("../../tests/lib/kit.js");
const [from, to, tx, ty] = process.argv.slice(2).map(Number);
const CPU = Number(process.env.CPU) || 1;
kit.test({ port: Number(process.env.CDP_PORT) || 9439, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: from || 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    await t.eval(`(() => {
        const R = window.__kw = { frames: [], cur: null, on: false };
        const wrap = (proto, name, key) => { if (!proto || proto["__kw" + key]) return; const f = proto[name]; proto["__kw" + key] = true; proto[name] = function() { const a = performance.now(); const r = f.apply(this, arguments); if (R.cur) R.cur[key] = (R.cur[key] || 0) + performance.now() - a; return r; }; };
        const set = SceneManager._scene._spriteset;
        for (const [k, s] of [["ziemia", set._ziemia], ["laka", set._laka], ["brzeg", set._redWater]]) if (s) wrap(Object.getPrototypeOf(s), "update", k);
        if (set._cleanLayer) for (const c of set._cleanLayer.children) wrap(Object.getPrototypeOf(c), "update", "hud");
        const um = SceneManager.updateMain, app = Graphics._app, rr = app.render;
        SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); if (R.cur) R.cur.upd = (R.cur.upd || 0) + performance.now() - a; };
        app.render = function() { const a = performance.now(); rr.apply(this, arguments); if (R.cur) { R.cur.rnd = performance.now() - a; R.cur.map = $gameMap.mapId(); R.cur.fade = SceneManager._scene && SceneManager._scene._fadeOpacity || 0; R.cur.t = a; if (R.on) R.frames.push(R.cur); } R.cur = {}; };
        R.cur = {};
    })(); 0`);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.eval(`window.__kw.on = true; $gamePlayer.reserveTransfer(${to || 21}, ${tx || 40}, ${ty || 40}, 2, 0); 0`);
    await t.until(`$gameMap.mapId() === ${to || 21} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 60);
    // the new spriteset's overlays: wrap them too (new instances, same prototypes - already wrapped)
    await t.frames(200);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const fr = await t.json(`window.__kw.frames.filter(f => f.map === ${to || 21})`);
    const first = fr.findIndex(f => f.fade < 250);
    const vis = fr.slice(Math.max(0, first));
    const tot = f => (f.upd || 0) + (f.rnd || 0);
    console.log("klatek z obrazem: " + vis.length + ", średnio " + (vis.reduce((s, f) => s + tot(f), 0) / Math.max(1, vis.length)).toFixed(1) + " ms (aktualizacja + rysowanie)");
    const r1 = n => n === undefined ? "-" : n.toFixed(1);
    vis.slice(0, 40).forEach((f, i) => console.log(String(i).padStart(3) + "  razem " + r1(tot(f)).padStart(6) + "  ziemia " + r1(f.ziemia).padStart(5) + "  łąka " + r1(f.laka).padStart(5) + "  brzeg " + r1(f.brzeg).padStart(5) + "  nazwa " + r1(f.hud).padStart(5) + "  rysowanie " + r1(f.rnd).padStart(5) + "  zaciemn " + Math.round(f.fade)));
    const big = vis.map((f, i) => [i, tot(f), f]).filter(x => x[1] > 25);
    console.log("klatki ponad 25 ms (nr, ms): " + JSON.stringify(big.map(x => [x[0], Math.round(x[1]), { z: r1(x[2].ziemia), l: r1(x[2].laka), b: r1(x[2].brzeg), n: r1(x[2].hud), r: r1(x[2].rnd) }])));
});
