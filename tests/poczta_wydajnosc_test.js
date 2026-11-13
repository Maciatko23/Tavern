// W20 „Kruczy listonosz”: wydajność - klatka (update + rysowanie) w kruczarni (mapa 214: pięć kruków na żerdziach, trzy postacie, światła)
// i w mieście przy wieży (Map008, 4x wolniejszy procesor, najlepszy z trzech przebiegów) - przed (bez nakładki) i po (z nakładką).
// Budżety jak w tests/wydajnosc_test.js (miasto 15 ms, wnętrza 15 ms). Uruchom: GAME_OVERLAY=tools/listonosz/overlay GAME_OVERLAY_JS=1 node tests/run.js poczta_wydajnosc_test --port 9922
"use strict";
const kit = require("./lib/kit.js");
const THROTTLE = 4, FRAMES = 150, RUNS = 3;
const BUDGET = { miasto: 15, kruczarnia: 15 };
const MEASURE = (n, walk) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a, a]); u = 0; ups = 0; step();
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length, secs = (f[f.length - 1][2] - f[0][2]) / 1000;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2), fps: +((f.length - 1) / secs).toFixed(1) })); };
})`;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const withPoczta = await t.eval("!!window.Poczta");
    const measureHere = async (name, walk) => {
        await t.frames(60);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        const runs = [];
        for (let r = 0; r < RUNS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES, walk), 300000)));
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const m = runs.sort((a, b) => a.frame - b.frame)[0];
        m.runs = runs.map(r => r.frame);
        console.log("   " + name + " (" + (walk ? "walking" : "standing") + ", " + (withPoczta ? "z Pocztą" : "bez Poczty") + ", CPU " + THROTTLE + "x slower):", JSON.stringify(m), "budget", BUDGET[name], "ms");
        return m;
    };
    await t.newGame({ map: 8, x: 108, y: 16, dir: 2, day: 40, hour: 12, quiet: true, minimap: true });
    await t.frames(60);
    const town = await measureHere("miasto", true);
    t.check("miasto przy kruczarni, w ruchu: klatka poniżej " + BUDGET.miasto + " ms przy 4x wolniejszym procesorze", town.frame < BUDGET.miasto, town);
    if (withPoczta) {
        await t.eval("TownQuests.state().flags.krukTame = 12; Poczta.stan().start = 13; 0");
        await t.go(214, 8, 9, 6); await t.frames(60);
        const room = await measureHere("kruczarnia", false);
        t.check("kruczarnia (pięć kruków, Gawron, Wicek, Cyryl), w ruchu: klatka poniżej " + BUDGET.kruczarnia + " ms", room.frame < BUDGET.kruczarnia, room);
        await t.setHour(23);
        const night = await measureHere("kruczarnia", false);
        t.check("kruczarnia nocą (światła): klatka poniżej " + BUDGET.kruczarnia + " ms", night.frame < BUDGET.kruczarnia, night);
    }
});
