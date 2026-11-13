// Wydajność Kruczogrodu po zmianach 2026-11-09 (klimat, pory roku, ozdoby): czas klatki (update + rysowanie) przy CPU 4x wolniejszym,
// chodzenie, najlepszy z 3 przebiegów (jak tests/wydajnosc_test.js, budżet miasta 15 ms). BEZ=1: pięć nowych wtyczek wyłączonych.
const kit = require("../../tests/lib/kit.js");
const path = require("path"); const MODE = process.env.MODE || "after";

const THROTTLE = 4, FRAMES = 150, RUNS = 3;
const MEASURE = (n) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a, a]); u = 0; ups = 0; step();
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length, secs = (f[f.length - 1][2] - f[0][2]) / 1000;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2), fps: +((f.length - 1) / secs).toFixed(1) })); };
})`;
kit.test({ port: +(process.env.CDP_PORT || 9691), lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000, overlay: MODE === "after" ? path.join(__dirname, "staging") : undefined }, async t => {
    const out = {};
    const scene = async (name, x, y, day, hour, setup, map) => {
        await t.newGame({ map: map || 8, x, y, dir: 2, day, hour, quiet: true, minimap: true });
        await t.eval("$gameScreen.changeWeather('none', 0, 0); 0");
        if (setup) await t.eval(`(function(){ try { ${setup} } catch (e) {} return 0; })()`);
        await t.frames(120);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        const runs = [];
        for (let r = 0; r < RUNS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES), 300000)));
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const m = runs.sort((a, b) => a.frame - b.frame)[0];
        out[name] = m.frame;
        console.log("   " + name + ":", JSON.stringify(m), "przebiegi", runs.map(r => r.frame));
    };
    const S = [["laka_poludnie", 4, 14, 72, 40, 12], ["kepa", 4, 44, 97, 40, 12], ["gaj", 4, 70, 72, 40, 12], ["zagroda", 4, 28, 66, 40, 12], ["zagajnik2", 4, 66, 104, 40, 12]];
    const ONLY = (process.env.SCENY || "").split(",").filter(Boolean);
    for (const s of S) if (!ONLY.length || ONLY.includes(s[0])) await scene(s[0], s[2], s[3], s[4], s[5], s[6], s[1]);
    console.log("WYNIK", MODE, JSON.stringify(out));
});
