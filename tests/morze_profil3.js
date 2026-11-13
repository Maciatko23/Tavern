// Profil kosztu poszczególnych rodzajów potworów z morza (fala 2) - jeden rodzaj naraz przy 4x wolniejszym procesorze, przeplatane z pustą sceną.
// Uruchom: GAME_OVERLAY=tools/potwory2/overlay GAME_OVERLAY_JS=1 CDP_PORT=9443 node tests/morze_profil3.js
const kit = require("./lib/kit.js");
const THROTTLE = 4, FRAMES = 150, RUNS = 3;
const MEASURE = n => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a, a]); u = 0; ups = 0;
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2) })); };
})`;
kit.test({ port: Number(process.env.CDP_PORT) || 9443, lightGpu: true, bootCheck: "ok", errorCheck: "err", evalTimeout: 300000 }, async t => {
    const once = async () => JSON.parse(await t.eval(MEASURE(FRAMES), 300000));
    const near = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return 1; } } return 0; })()`);
    await t.newGame({ map: 125, x: 24, y: 14, hour: 22, day: 60 });
    await near(24, 14); await t.setDay(60, 22); await t.frames(60);
    const kinds = (process.env.KINDS || "szkielet_palka:2,szkielet_miecz,szkielet_wlocznia,szkielet_mlot,krab_olbrzym,krab_kolos,kapitan_szkieletow").split(",");
    const spawn = spec => { const [k, n] = spec.split(":"); return t.eval(`(function(){ Creatures.clear("morze"); const hx = $gamePlayer.x, hy = $gamePlayer.y, sp = [[-5, -3], [5, -3], [0, -4]];
        let made = 0; for (let i = 0; i < ${Number(n || 1)}; i++) { const x = hx + sp[i][0], y = hy + sp[i][1]; for (let r = 0; r < 5 && made <= i; r++) for (let d = -r; d <= r && made <= i; d++) { const X = x + d, Y = y + r; if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f)) { Creatures.spawn(${JSON.stringify(k)}, X, Y, { tag: "morze", engaged: true, level: 1, single: true }); made++; } } }
        MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; }); $gameParty.leader()._hp = 9999; return MorzePotwory.seaList().length; })()`); };
    const TRIO = process.env.TRIO;   // "miecz,mlot,kolos" at once, in the variants full / frozen / hidden
    if (TRIO) {
        const ks = TRIO.split(",");
        const put = mode => t.eval(`(function(){ Creatures.clear("morze"); const hx = $gamePlayer.x, hy = $gamePlayer.y, sp = [[-5, -3], [5, -3], [0, -4]];
            ${JSON.stringify(ks)}.forEach((k, i) => { const x = hx + sp[i][0], y = hy + sp[i][1]; let done = false; for (let r = 0; r < 5 && !done; r++) for (let d = -r; d <= r && !done; d++) { const X = x + d, Y = y + r; if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f)) { Creatures.spawn(k, X, Y, { tag: "morze", engaged: true, level: 1, single: true }); done = true; } } });
            MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; if (${JSON.stringify(mode)} !== "full") c._frozen = true; if (${JSON.stringify(mode)} === "hidden" && c._sprite) c._sprite.visible = false; }); $gameParty.leader()._hp = 9999; return 0; })()`);
        await t.eval(`MorzePotwory.warm(${JSON.stringify(ks)}); 0`); await t.until("MorzePotwory.warmLeft() === 0", 60, 3000); await t.frames(60);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        const V = { base: [], full: [], frozen: [], hidden: [] };
        for (let r = 0; r < RUNS; r++) {
            await t.eval("Creatures.clear('morze'); 0"); await t.frames(20); V.base.push(await once());
            for (const m of ["full", "frozen", "hidden"]) { await put(m); await t.frames(20); V[m].push(await once()); }
        }
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const b0 = V.base.sort((a, b) => a.frame - b.frame)[0].frame;
        for (const k of Object.keys(V)) { const b = V[k].sort((a, c) => a.frame - c.frame)[0]; console.log(k.padEnd(8), JSON.stringify(b), Math.round((b.frame / b0 - 1) * 100) + "%"); }
        return;
    }
    for (const k of kinds) { await t.eval(`MorzePotwory.warm([${JSON.stringify(k.split(":")[0])}]); 0`); }
    await t.frames(600);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
    const R = { base: [] };
    for (let r = 0; r < RUNS; r++) {
        await t.eval("Creatures.clear('morze'); 0"); await t.frames(20); R.base.push(await once());
        for (const k of kinds) { await spawn(k); await t.frames(20); (R[k] = R[k] || []).push(await once()); }
    }
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const base = R.base.sort((a, b) => a.frame - b.frame)[0];
    for (const k of Object.keys(R)) { const b = R[k].sort((a, c) => a.frame - c.frame)[0]; console.log(k.padEnd(22), JSON.stringify(b), k === "base" ? "" : "+" + (b.frame - base.frame).toFixed(2) + " ms (" + Math.round((b.frame / base.frame - 1) * 100) + "%)"); }
});
