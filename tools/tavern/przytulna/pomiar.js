// Pomiar tawerny (sala o 20:00, z podróżnymi) jak tools/wydajnosc/pomiar.js (CPU wolniejszy N razy), dla próby „Przytulna sala”:
//   node tools/tavern/przytulna/pomiar.js przed            mapa gracza, wtyczka wyłączona
//   node tools/tavern/przytulna/pomiar.js po               kopia z próby (overlay) + wtyczka włączona
//   node tools/tavern/przytulna/pomiar.js mapa             kopia z próby, wtyczka wyłączona (sam koszt dołożonych zdarzeń)
//   opcje: --dlawienie N (4), --klatki N (240), --rundy N (3), --idzie (bohater chodzi), --port N (9380)
const path = require("path"), fs = require("fs"), os = require("os");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = n => { const i = args.indexOf("--" + n); if (i < 0) return false; args.splice(i, 1); return true; };
const PORT = Number(opt("port", 9380)), THROTTLE = Number(opt("dlawienie", 4)), FRAMES = Number(opt("klatki", 240)), ROUNDS = Number(opt("rundy", 3)), WALK = flag("idzie");
const MODE = args[0] || "przed";
process.env.CDP_PORT = String(PORT);
const kit = require(path.join(__dirname, "..", "..", "..", "tests", "lib", "kit.js"));
const MEASURE = (n, walk) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([u, ups, performance.now() - a, a]); u = 0; ups = 0; step();
        if (fr.length >= ${n} + 20) { SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false; done(); } };
    function done() {
        const f = fr.slice(20), U = f.map(x => x[1] ? x[0] / x[1] : 0), R = f.map(x => x[2]), C = f.map((x, i) => U[i] + R[i]);
        const mean = a => a.reduce((s, v) => s + v, 0) / a.length, pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)];
        const secs = (f[f.length - 1][3] - f[0][3]) / 1000;
        res(JSON.stringify({ upd: +mean(U).toFixed(2), rnd: +mean(R).toFixed(2), frame: +mean(C).toFixed(2), p95: +pct(C, 0.95).toFixed(2), fps: +((f.length - 1) / secs).toFixed(1) }));
    }
})`;
const median = a => { const s = a.slice().sort((x, y) => x.frame - y.frame); return s[Math.floor(s.length / 2)]; };
const near = (x, y) => `(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
    if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return [X, Y]; } } return null; })()`;
const opts = { port: PORT, evalTimeout: 120000, lightGpu: true };
if (MODE !== "przed") opts.overlay = "tools/tavern/przytulna/overlay";
kit.test(opts, async t => {
    await t.eval(`window.PRZYTULNA = ${MODE === "po" || MODE === "ab"}; 0`);
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20 });
    await t.eval(`(function(){ for (const k of ["tobiasz", "kartograf", "grajek", "kompania"]) { try { Podroznicy.przyplyn(k); } catch (e) {} } Podroznicy.przyplyn("pula"); return 0; })()`);
    await t.go(1, 50, 34, 8);
    await t.eval(near(50, 34));
    await t.setHour(20);
    await t.frames(240);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    await t.frames(30);
    if (MODE === "ab") {   // na przemian w jednej przeglądarce (kopia mapy z próby): wtyczka wyłączona / włączona; mediana każdej
        const ab = { off: [], on: [] };
        for (let r = 0; r < ROUNDS; r++) for (const v of ["off", "on"]) {
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
            await t.eval(`window.PRZYTULNA = ${v === "on"}; 0`);
            await t.go(1, 50, 34, 8); await t.eval(near(50, 34)); await t.setHour(20); await t.frames(150);
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE }); await t.frames(20);
            ab[v].push(JSON.parse(await t.eval(MEASURE(FRAMES, WALK), 600000)));
        }
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const a = median(ab.off), b = median(ab.on);
        const line = `WYNIK ab${WALK ? " (idzie)" : " (stoi)"} CPU ${THROTTLE}x: wyłączona ${a.frame} ms (${a.fps} kl/s), włączona ${b.frame} ms (${b.fps} kl/s), różnica ${(b.frame - a.frame).toFixed(2)} ms  [${ab.off.map(x => x.frame)} | ${ab.on.map(x => x.frame)}]`;
        console.log(line); fs.appendFileSync(path.join(__dirname, "pomiary.txt"), new Date().toISOString() + " " + line + String.fromCharCode(10));
        return;
    }
    const runs = [];
    for (let r = 0; r < ROUNDS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES, WALK), 600000)));
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const m = median(runs);
    console.log(`WYNIK ${MODE}${WALK ? " (idzie)" : " (stoi)"} CPU ${THROTTLE}x: klatka ${m.frame} ms (krok ${m.upd} + rysowanie ${m.rnd}), p95 ${m.p95} ms, ${m.fps} kl/s  [${runs.map(x => x.frame + " ms / " + x.fps + " fps").join(", ")}]`);
    fs.appendFileSync(path.join(__dirname, "pomiary.txt"), `${new Date().toISOString()} ${MODE}${WALK ? " idzie" : " stoi"} ${THROTTLE}x ${JSON.stringify(m)} rundy=${JSON.stringify(runs.map(x => x.frame))}\n`);
});
