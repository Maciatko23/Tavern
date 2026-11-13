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
    const mons = `(function(){ Creatures.clear("morze"); const hx = $gamePlayer.x, hy = $gamePlayer.y; const spots = [[-5, -3], [5, -3], [-3, -5], [3, -5], [0, -4]]; const kinds = ["topielec_morski", "topielec_morski", "rybolak", "krab_olbrzym", "mglak"];
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
    const profs = {};
    const prof = async name => {
        await t.b.send("Profiler.enable"); await t.b.send("Profiler.setSamplingInterval", { interval: 200 });
        await t.b.send("Profiler.start");
        await once(false);
        const { profile } = await t.b.send("Profiler.stop");
        const byId = {}, parent = {}; for (const n of profile.nodes) byId[n.id] = n;
        for (const n of profile.nodes) for (const c of (n.children || [])) parent[c] = n.id;
        const incl = {}, dt = profile.timeDeltas;
        const key = n => n.callFrame.functionName + " " + (n.callFrame.url.split("/").pop()) + ":" + n.callFrame.lineNumber;
        profile.samples.forEach((id, i) => { const seen = new Set(); for (let x = id; x; x = parent[x]) { const k = key(byId[x]); if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + dt[i]; } } });
        profs[name] = incl; if (name === "full2") { const tree = (id, depth, out) => { const n = byId[id]; let sum = 0; profile.samples.forEach((sid, i) => { for (let x = sid; x; x = parent[x]) if (x === id) { sum += dt[i]; break; } }); out.push("  ".repeat(depth) + (sum / 1000 / 150 / 4).toFixed(3) + " " + key(n)); if (depth < 7) for (const c of (n.children || [])) { const cs = byId[c]; tree(c, depth + 1, out); } }; const roots = profile.nodes.filter(n => /Game_Creature.update Creatures/.test(key(n))).slice(0, 1); const out = []; if (roots[0]) { /* only the first node: its children */ const r = roots[0]; tree(r.id, 0, out); } profs.tree = out.filter(l => parseFloat(l) >= 0.012).join(String.fromCharCode(10)); } const self = {}; profile.samples.forEach((id, i) => { const k = key(byId[id]); self[k] = (self[k] || 0) + dt[i]; }); profs[name + "_self"] = self;
    };
    await t.eval(V.base); await t.frames(30); await prof("base");
    await t.eval(V.full); await t.frames(30); await once(false); await once(false); await prof("full");
    await t.eval(V.base); await t.frames(30); await prof("base2");
    await t.eval(V.full); await t.frames(30); await once(false); await once(false); await prof("full2");
    console.log("== TREE" + String.fromCharCode(10) + profs.tree);
    const NL = String.fromCharCode(10), per = v => v / 1000 / 150 / 4;
    const diff = Object.keys(profs.full).map(k => [k, per(((profs.full[k] || 0) + (profs.full2[k] || 0)) / 2 - ((profs.base[k] || 0) + (profs.base2[k] || 0)) / 2)]).sort((a, b) => b[1] - a[1]).slice(0, 40);
    const sd = Object.keys(profs.full_self).map(k => [k, per(((profs.full_self[k] || 0) + (profs.full2_self[k] || 0)) / 2 - ((profs.base_self[k] || 0) + (profs.base2_self[k] || 0)) / 2)]).sort((a, b) => b[1] - a[1]).slice(0, 30);
    console.log("== SELF diff" + NL + sd.map(d => d[1].toFixed(3) + " " + d[0]).join(NL));
    console.log("== diff full-base (ms/frame, real cpu)" + NL + diff.map(d => d[1].toFixed(3) + " " + d[0]).join(NL));
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
});
