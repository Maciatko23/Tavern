// Porównanie A/B w jednej stronie gry (2026-11-07): przełącznik Wydajnosc.opts[klucz] zmieniany co OKNO klatek na zmianę, czas klatki
// (aktualizacja + rysowanie) zbierany osobno dla każdej wartości - obciążenie komputera dotyka obu tak samo (mierzenie dwóch osobnych
// przebiegów na tym komputerze daje rozrzut kilku ms). Bohater chodzi w lewo i w prawo.
//   GAME_OVERLAY=... GAME_OVERLAY_JS=1 CDP_PORT=9489 [CPU=4] node tools/porzadki/ab_w_stronie.js <klucz> <A> <B> [mapa x y]
"use strict";
const kit = require("../../tests/lib/kit.js");
const [key, A, B, map, x, y] = process.argv.slice(2);
const CPU = Number(process.env.CPU) || 4, OKNO = 60, OKIEN = 24;
kit.test({ port: Number(process.env.CDP_PORT) || 9489, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: Number(map) || 125, x: Number(x) || 55, y: Number(y) || 19, day: 40, hour: 11, quiet: true, minimap: false });
    await t.eval("CleanHUD.visits().odw[$gameMap.mapId()] = 3; 0");
    await t.frames(200);
    const val = v => (v === "true" ? true : v === "false" ? false : Number(v));
    await t.eval(`(() => {
        const R = window.__ab = { A: [], B: [], cur: "A", t0: 0, upd: 0 };
        const um = SceneManager.updateMain, app = Graphics._app, rr = app.render;
        SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); R.upd += performance.now() - a; };
        app.render = function() { const a = performance.now(); rr.apply(this, arguments); R[R.cur].push(R.upd + performance.now() - a); R.upd = 0; };
        let f = 0, dir = 6;
        Tawerna.onMapUpdate(() => {
            if (++f % ${OKNO} === 0) { R.cur = R.cur === "A" ? "B" : "A"; Wydajnosc.opts[${JSON.stringify(key)}] = R.cur === "A" ? ${JSON.stringify(val(A))} : ${JSON.stringify(val(B))}; }
            if (f % 90 === 0) dir = dir === 6 ? 4 : 6;
            Input._currentState.right = dir === 6; Input._currentState.left = dir === 4;
        }, { owner: "AB" });
        Wydajnosc.opts[${JSON.stringify(key)}] = ${JSON.stringify(val(A))};
    })(); 0`);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.frames(OKNO * OKIEN);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const R = await t.json("({ A: __ab.A, B: __ab.B })");
    const med = v => { const s = v.slice().sort((a, b) => a - b); return s[s.length >> 1]; }, avg = v => v.reduce((a, b) => a + b, 0) / v.length;
    console.log(`${key}=${A}: mediana ${med(R.A).toFixed(2)} ms, średnio ${avg(R.A).toFixed(2)} ms (${R.A.length} klatek)`);
    console.log(`${key}=${B}: mediana ${med(R.B).toFixed(2)} ms, średnio ${avg(R.B).toFixed(2)} ms (${R.B.length} klatek)`);
});
