// Wydajność map próbnych A (990) i B (991): ms na klatkę (update + rysowanie) przy CPU 4x wolniejszym, bohater idzie; budżet jak dla Kruczego Jaru (22 ms).
// GAME_OVERLAY=tools/mapa_probna/staging/nakladka GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/mapa_probna_wydajnosc.js
"use strict";
const kit = require("./lib/kit.js");
const THROTTLE = 4, FRAMES = 150, RUNS = 3, BUDGET = 22;
const MEASURE = (n) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a]); u = 0; ups = 0; step();
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length;
        res(JSON.stringify({ frame: +(mean(0) + mean(1)).toFixed(2) })); };
})`;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    for (const [id, x, y] of [[990, 24, 34], [991, 29, 34], [3, 22, 14]]) {
        await t.newGame({ map: id, x, y, day: 40, hour: 12, quiet: true, minimap: true });
        await t.frames(420);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        const runs = [];
        for (let r = 0; r < RUNS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES), 300000)).frame);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const best = Math.min(...runs);
        const ev = await t.json("$gameMap.events().length");
        console.log("   Map" + id + ": " + best + " ms/klatkę (przebiegi " + runs.join(", ") + "), zdarzeń " + ev);
        t.check("Map" + id + ": klatka poniżej " + BUDGET + " ms przy CPU 4x wolniejszym", best < BUDGET, { best, runs });
    }
});
