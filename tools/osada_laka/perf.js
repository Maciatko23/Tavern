// A/B of Map004 at the Osada and away from it: live files (A) vs the staging overlay (B), interleaved, 4x CPU throttle, 150 frames walking,
// best of 3 runs per launch, ROUNDS launches per side. node tools/osada_laka/perf.js   (CDP ports 9423-9424)
"use strict";
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const THROTTLE = 4, FRAMES = 150, RUNS = 3, ROUNDS = 3;
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

(async () => {
    const res = { A: { osada: [], away: [] }, B: { osada: [], away: [] } };
    for (let round = 0; round < ROUNDS; round++) {
        for (const side of ["A", "B"]) {
            const port = side === "A" ? 9423 : 9424;
            const t = await kit.open({ port, lightGpu: true, evalTimeout: 300000, overlay: side === "B" ? "tools/osada_laka/staging" : undefined, overlayJs: side === "B" });
            for (const [name, x, y] of [["osada", 66, 46], ["away", 30, 20]]) {
                await t.newGame({ map: 4, x, y, day: 40, hour: 12, quiet: true, minimap: true });
                await t.frames(80);
                await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
                await t.frames(20);
                const runs = [];
                for (let r = 0; r < RUNS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES, true), 300000)).frame);
                await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
                res[side][name].push(Math.min(...runs));
                console.log(round, side, name, JSON.stringify(runs));
            }
            await t.b.close();
        }
    }
    const med = a => a.slice().sort((p, q) => p - q)[a.length >> 1];
    for (const n of ["osada", "away"]) console.log(n, "A(before) best", Math.min(...res.A[n]), "median", med(res.A[n]), "| B(after) best", Math.min(...res.B[n]), "median", med(res.B[n]), JSON.stringify([res.A[n], res.B[n]]));
    process.exit(0);
})().catch(e => { console.log("ERR", e); process.exit(1); });
