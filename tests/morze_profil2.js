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
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length, secs = (f[f.length - 1][2] - f[0][2]) / 1000;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2), fps: +((f.length - 1) / secs).toFixed(1) })); };
})`;

kit.test({ port: Number(process.env.CDP_PORT) || 9951, lightGpu: true, bootCheck: "ok", errorCheck: "err", evalTimeout: 300000 }, async t => {
    const once = async walk => JSON.parse(await t.eval(MEASURE(FRAMES, walk), 300000));
    const near = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return 1; } } return 0; })()`);
    const mons = `(function(){ Creatures.clear("morze"); const hx = $gamePlayer.x, hy = $gamePlayer.y; const spots = [[0, -9], [3, -9], [-3, -9], [6, -10], [-6, -10]]; const kinds = ["topielec_morski", "topielec_morski", "rybolak", "krab_olbrzym", "mglak"];
        kinds.forEach((k, i) => { const x = hx + spots[i][0], y = hy + spots[i][1]; for (let r = 0; r < 5; r++) for (let d = -r; d <= r; d++) { const X = x + d, Y = y + r; if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f)) { Creatures.spawn(k, X, Y, { tag: "morze", engaged: true, level: 1, single: true }); return; } } });
        MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; }); $gameParty.leader()._hp = 9999; return 0; })()`;
    const V = {
        base: "Creatures.clear('morze'); MorzePotwory.marks.clear(); 0",
        full: mons,
        frozen: mons + "; Creatures.creatures().forEach(c => { c._frozen = true; }); 0",
        hidden: mons + "; Creatures.creatures().forEach(c => { c._frozen = true; if (c._sprite) c._sprite.visible = false; }); 0",
        marks: "Creatures.clear('morze'); MorzePotwory.marks.clear(); MorzePotwory.marks.add(Array.from({ length: 12 }, (_, i) => ({ x: $gamePlayer.x - 5 + i, y: $gamePlayer.y + 2, kind: i % 6 ? 'track' : 'weed' }))); 0"
    };
    await t.newGame({ map: 125, x: 24, y: 14, hour: 22, day: 60 });
    await near(24, 14); await t.setDay(60, 22); await t.frames(60);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    const R = {};
    const spots = "[[-5, -3], [5, -3], [-3, -5], [3, -5], [0, -4]]";
    const mk = n => `MorzePotwory.warm(["topielec_morski"]); Creatures.clear("morze"); (function(){ const hx = $gamePlayer.x, hy = $gamePlayer.y, sp = ${spots}; for (let i = 0; i < ${n}; i++) { Creatures.spawn("topielec_morski", hx + sp[i][0], hy + sp[i][1], { tag: "morze", engaged: true, level: 1, single: true }); } MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; }); $gameParty.leader()._hp = 9999; })(); 0`;
    await t.eval(mk(1)); await t.frames(500);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    for (let r = 0; r < 3; r++) for (const n of [0, 1, 3, 5]) { await t.eval(n ? mk(n) : "Creatures.clear('morze'); 0"); await t.frames(30); (R["n" + n] = R["n" + n] || []).push(await once(false)); }
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    for (const k of Object.keys(R)) { const b = R[k].sort((a, c) => a.frame - c.frame)[0]; console.log(k, JSON.stringify({ upd: b.upd, rnd: b.rnd, frame: b.frame })); }
});
