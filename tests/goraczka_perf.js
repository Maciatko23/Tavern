// W21 "Gorączka w przytułku": performance A/B - the frame (update + render) at 4x CPU throttle, best of 3 rounds, interleaved by tools/goraczka/perf_ab.js
// (a run without the overlay = the live game, a run with = W21 installed). The heaviest moments of the line:
//   "ulica": Map008 at the southern street in the evening of day 31 (carts, Stefa's cauldron, Wawrzyn, Stefa, the crowd of the town), hero walking
//   "przytulek": the poorhouse interior full of the sick (Map216 on the overlay; the same layout Map202 in the base run), hero standing
//   "rynna": Map008 at the Eastern Cistern with the crust and the slab (chapter 4)
// Run: node tools/goraczka/perf_ab.js   (or one run: GAME_OVERLAY=tools/goraczka/overlay GAME_OVERLAY_JS=1 CDP_PORT=9451 node tests/goraczka_perf.js)
"use strict";
const kit = require("./lib/kit.js");
const THROTTLE = 4, FRAMES = 150, RUNS = 3;
const MEASURE = (n, walk) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a, a]); u = 0; ups = 0; step();
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2) })); };
})`;

kit.test({ port: Number(process.env.CDP_PORT) || 9451, overlay: process.env.GAME_OVERLAY || null, overlayJs: !!process.env.GAME_OVERLAY, bootCheck: "gra się uruchamia" }, async t => {
    const withW21 = await t.eval("!!window.Goraczka");
    const measure = async (name, walk) => {
        await t.frames(60);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        const runs = [];
        for (let r = 0; r < RUNS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES, walk), 300000)));
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const m = runs.sort((a, b) => a.frame - b.frame)[0];
        console.log("PERF " + (withW21 ? "z W21" : "bez W21") + " " + name + ": " + m.frame + " ms (update " + m.upd + ", render " + m.rnd + ") runs " + runs.map(r => r.frame).join(","));
    };
    await t.newGame({ story: true, skipIntro: true, map: 8, x: 96, y: 108, dir: 8, day: 31, hour: 19, quiet: true, minimap: false });
    if (withW21) {
        await t.eval("(function(){ const f = TownQuests.state().flags; f.campInside = true; return 0; })()");
        await t.go(8, 96, 108, 8); await t.frames(40);
        await t.eval("TownQuests.autoChecks(); 0"); await t.frames(80);
        await t.eval("Goraczka.f9Rozdzial(2); 0"); await t.eval("Goraczka.stan().sc.s1 = 30; Goraczka.refreshAll(); 0");
        await t.go(8, 96, 108, 8);
    }
    await t.setHour(19); await t.frames(120);
    await measure("ulica (Map008 przy zaporze i przytulku, w ruchu)", true);
    await t.go(withW21 ? 216 : 202, 10, 9, 8); await t.setHour(14); await t.frames(120);
    await measure("przytulek (chorzy w lozkach, stoi)", false);
    if (withW21) {
        await t.go(8, 83, 53, 8); await t.eval("Goraczka.f9Rozdzial(5); Goraczka.stan().zebranie = 36; 0");
        await t.setDay(36, 15.4); await t.frames(60);
    } else { await t.go(8, 83, 53, 8); await t.setDay(36, 15.4); await t.frames(60); }
    await t.frames(Number(process.env.WAIT) || 300);
    await measure("zebranie (Map008 przed ratuszem 15:30, tlum trzymany, scena S4)", false);
    if (withW21 && process.env.EXPERIMENT) {   // which part costs: the bars of the scene / the held crowd
        await t.eval("CleanHUD.sceneBars(false); 0"); await t.frames(60);
        await measure("zebranie bez pasow sceny", false);
        await t.eval("Goraczka.zwolnij(); 0"); await t.frames(120);
        await measure("zebranie bez pasow i bez trzymanych", false);
    }
});
