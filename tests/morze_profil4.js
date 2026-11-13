// CPU profil sceny: 3 potwory na przystani (4x wolniej) - top funkcji wg czasu własnego.  Uruchom z nakładką, CDP_PORT=9443
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9443, lightGpu: true, bootCheck: "ok", errorCheck: "err", evalTimeout: 300000 }, async t => {
    const near = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return 1; } } return 0; })()`);
    await t.newGame({ map: 125, x: 24, y: 14, hour: 22, day: 60 });
    await near(24, 14); await t.setDay(60, 22); await t.frames(60);
    const kinds = (process.env.KINDS || "szkielet_miecz,szkielet_mlot,krab_kolos").split(",");
    await t.eval(`MorzePotwory.warm(${JSON.stringify(kinds)}); 0`);
    await t.until("MorzePotwory.warmLeft() === 0", 60, 3000);
    await t.frames(60);
    const spawn = () => t.eval(`(function(){ Creatures.clear("morze"); const hx = $gamePlayer.x, hy = $gamePlayer.y, sp = [[-5, -3], [5, -3], [0, -4]], ks = ${JSON.stringify(kinds)};
        ks.forEach((k, i) => { const x = hx + sp[i][0], y = hy + sp[i][1]; let done = false; for (let r = 0; r < 5 && !done; r++) for (let d = -r; d <= r && !done; d++) { const X = x + d, Y = y + r; if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f)) { Creatures.spawn(k, X, Y, { tag: "morze", engaged: true, level: 1, single: true }); done = true; } } });
        MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; }); $gameParty.leader()._hp = 9999; return MorzePotwory.seaList().length; })()`);
    const prof = async (label, n) => {
        if (n) await spawn(); else await t.eval("Creatures.clear('morze'); 0");
        if (label === 'frozen') await t.eval("MorzePotwory.seaList().forEach(c => { c._frozen = true; }); 0");
        await t.frames(30);
        await t.b.send("Profiler.enable"); await t.b.send("Profiler.setSamplingInterval", { interval: 200 }); await t.b.send("Profiler.start");
        await t.frames(300);
        const r = await t.b.send("Profiler.stop");
        const nodes = new Map(); for (const nd of r.profile.nodes) nodes.set(nd.id, nd);
        const self = new Map(); const dt = r.profile.timeDeltas; r.profile.samples.forEach((id, i) => { const nd = nodes.get(id), cf = nd.callFrame, key = cf.functionName + " " + cf.url.split("/").slice(-1)[0] + ":" + cf.lineNumber; self.set(key, (self.get(key) || 0) + (dt[i] || 0)); });
        return self;
    };
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const A = await prof("frozen", 3), B = await prof("mon", 3);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const rows = [...B.entries()].map(([k, v]) => [k, v / 1000, (A.get(k) || 0) / 1000]).map(([k, b, a]) => [k, b, a, b - a]).sort((x, y) => y[3] - x[3]).slice(0, 22);
    for (const [k, b, a, d] of rows) console.log(d.toFixed(1).padStart(7), "ms  (mon", b.toFixed(1), "base", a.toFixed(1) + ")", k);
});
