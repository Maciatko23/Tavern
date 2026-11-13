// Wydajność potworów z morza (W23): najgorszy przypadek - 3 potwory NA EKRANIE (maks. naraz = MAX_AT_ONCE 3) + ślady (12 odcisków) na przystani w nocy, to samo w mieście ze strażą -
// przy 4x wolniejszym procesorze, najlepszy z 5 pomiarów, A (bez potworów) i B (z nimi) przeplatane. Kryterium: narzut <= 10% „przed” z tej samej chwili;
// budżet bezwzględny z tests/wydajnosc_test.js (przystań 14 ms, miasto 15 ms) liczy się, gdy sama maszyna mieści się w nim bez potworów
// (obciążona maszyna daje baseline 20-27 ms). Plus koszt jednego losowania nocy.
// 2026-11-12 (fala 2): szkielety, krab-kolos (x2) i duże macki krakena wliczone (najgorszy układ: miecz + młot + kolos na ekranie; trzy duże macki z kręgami).
// Uruchom: GAME_OVERLAY=tools/potwory2/overlay GAME_OVERLAY_JS=1 CDP_PORT=9441 node tests/morze_wydajnosc.js
const kit = require("./lib/kit.js");
// (RUNS 5: the machine's own load - the system's audio, other programs - swings a frame by 20-40 % between runs; the best of five of
// each side, still interleaved, keeps the 10 % budget meaningful - 2026-11-12)
const THROTTLE = 4, FRAMES = 150, RUNS = 5;
const BUDGET = { przystan: 14, miasto: 15 };
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

kit.test({ port: Number(process.env.CDP_PORT) || 9441, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    const J = e => t.json(e);
    const near = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return 1; } } return 0; })()`);
    const once = async walk => JSON.parse(await t.eval(MEASURE(FRAMES, walk), 300000));
    // A (bez potworów) i B (z potworami) na przemian, najlepszy z 3 każdego (obciążenie maszyny płynie, tylko przeplatanie je znosi)
    const measureAB = async (name, walk, setA, setB) => {
        await t.frames(60);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        const A = [], B = [];
        for (let r = 0; r < RUNS; r++) {
            await setA(); await t.frames(20); A.push(await once(walk));
            await setB(); await t.frames(20); B.push(await once(walk));
        }
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const best = L => { const m = L.slice().sort((a, b) => a.frame - b.frame)[0]; m.runs = L.map(r => r.frame); return m; };
        const a = best(A), b = best(B);
        console.log("   " + name + " (" + (walk ? "chodząc" : "stojąc") + ", CPU " + THROTTLE + "x wolniej): przed", JSON.stringify(a), "| po", JSON.stringify(b));
        return [a, b];
    };
    const KINDS5 = process.env.KINDS5 ? process.env.KINDS5.split(",") : ["szkielet_miecz", "szkielet_mlot", "krab_kolos"];   // (the cap: MAX_AT_ONCE 3; the table never brings more; the giga crab is the biggest sprite)
    const monsters = async (x, y) => {
        await t.eval(`MorzePotwory.warm(${JSON.stringify(KINDS5)}); 0`);
        await t.until("MorzePotwory.warmLeft() === 0", 60, 3000);   // (the signs' five seconds: the shadows of the frames are cut beforehand, as a landing does - here three kinds at once, so until the queue is empty)
        await t.frames(60);
        return t.eval(`(function(){ Creatures.clear("morze"); const hx = ${x}, hy = ${y}; const spots = [[-5, -3], [5, -3], [0, -4]]; const kinds = ${JSON.stringify(KINDS5)};
        kinds.forEach((k, i) => { const x = hx + spots[i][0], y = hy + spots[i][1]; for (let r = 0; r < 5; r++) for (let d = -r; d <= r; d++) { const X = x + d, Y = y + r; if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f)) { Creatures.spawn(k, X, Y, { tag: "morze", engaged: true, level: 1, single: true }); return; } } });
        MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; });
        MorzePotwory.marks.clear(); MorzePotwory.marks.add(Array.from({ length: 12 }, (_, i) => ({ x: hx - 5 + i, y: hy + 2, kind: i % 6 ? "track" : "weed" })));
        $gameParty.leader()._hp = 9999; return MorzePotwory.seaList().length; })()`);
    };

    // ---- the harbour at night
    await t.newGame({ map: 125, x: 24, y: 14, hour: 22, day: 60 });
    await near(24, 14);
    await t.setDay(60, 22);
    await t.frames(60);
    const [h0, h1] = await measureAB("przystan", false, () => t.eval("Creatures.clear('morze'); MorzePotwory.marks.clear(); 0"), () => monsters(24, 14));
    const hn = await J("MorzePotwory.seaList().length");
    t.check("przystań w nocy z " + hn + " potworami z morza: narzut <= 10% (budżet " + BUDGET.przystan + " ms) przy 4x wolniejszym procesorze (przed: " + h0.frame + ")", h1.frame <= h0.frame * 1.10 && (h0.frame >= BUDGET.przystan || h1.frame < BUDGET.przystan) && hn >= 3, { przed: h0, po: h1 });
    // ---- the harbour at night with three big tentacles out (rings, the arms, the foam)
    const tents = () => t.eval(`(function(){ Creatures.clear("morze"); MorzePotwory.marks.clear(); Morze.force("macki"); MorzePotwory.tentacles.list().forEach(t => { t.phase = "idle"; t.t = 0; t.cd = 99999; }); return MorzePotwory.tentacles.list().length; })()`);
    await t.go(125, 60, 70, 2);
    await t.until("SceneManager._scene instanceof Scene_Map && $gameMap.mapId() === 125 && !SceneManager.isSceneChanging()", 30);
    await near(60, 70);
    await t.setDay(70, 22);
    await t.frames(60);
    const [k0, k1] = await measureAB("przystan_macki", false, () => t.eval("MorzePotwory.tentacles.clear(); 0"), tents);
    const kn = await J("MorzePotwory.tentacles.list().length");
    t.check("przystań w nocy z " + kn + " dużymi mackami: narzut <= 10% (budżet " + BUDGET.przystan + " ms) przy 4x wolniejszym procesorze (przed: " + k0.frame + ")", k1.frame <= k0.frame * 1.10 && (k0.frame >= BUDGET.przystan || k1.frame < BUDGET.przystan) && kn >= 2, { przed: k0, po: k1 });
    // ---- the town at night with the watch
    await t.go(8, 50, 53, 2);
    await t.until("SceneManager._scene instanceof Scene_Map && $gameMap.mapId() === 8 && !SceneManager.isSceneChanging()", 30);
    await t.frames(120);
    await near(50, 53);
    await t.setDay(60, 22);
    await t.frames(60);
    const [m0, m1] = await measureAB("miasto", true, () => t.eval("Creatures.clear('morze'); MorzePotwory.marks.clear(); MorzePotwory.watch.clear(); MorzePotwory.watch.state.on = false; 0"), async () => { await monsters(50, 53); await t.eval("MorzePotwory.watch.begin(); 0"); });
    const mn = await J("MorzePotwory.seaList().length");
    t.check("miasto w nocy z " + mn + " potworami i strażą: narzut (chodząc) <= 10% (budżet " + BUDGET.miasto + " ms) przy 4x wolniejszym procesorze (przed: " + m0.frame + ")", m1.frame <= m0.frame * 1.10 && (m0.frame >= BUDGET.miasto || m1.frame < BUDGET.miasto) && mn >= 3 && m0.frame > 2, { przed: m0, po: m1 });
    // ---- the cost of the night's roll and of the shore points (once a map)
    await t.go(125, 60, 70, 2);
    await t.eval("Creatures.clear('morze'); Morze.reset(); 0");
    const cost = await J(`(function(){ const a = performance.now(); const pts = Morze.shorePoints(); const first = performance.now() - a;
        const b = performance.now(); for (let i = 0; i < 1000; i++) Morze.nightTick(); const tick = (performance.now() - b) / 1000;
        const c = performance.now(); for (let i = 0; i < 200; i++) { delete Morze.state().noce[Morze.key(Morze.night().n, 125)]; Morze.recordFor(Morze.night().n, 125, true); } const roll = (performance.now() - c) / 200;
        return { pts: pts.length, firstMs: +first.toFixed(2), tickMs: +tick.toFixed(4), rollMs: +roll.toFixed(3) }; })()`);
    console.log("   koszt:", JSON.stringify(cost));
    t.check("jedno losowanie nocy < 1 ms, tik czekającego lądowania < 0,05 ms, sześć punktów brzegu raz < 20 ms", cost.pts === 6 && cost.rollMs < 1 && cost.tickMs < 0.05 && cost.firstMs < 20, cost);
});
