// Profil procesora jednego przejścia (2026-11-03): które funkcje zjadają czas od wejścia w przejście do pełnego obrazu nowej mapy.
//   OD=8 DO=125 CPU=4 node tools/przejscia/profil.js
"use strict";
const kit = require("../../tests/lib/kit.js");
const OD = Number(process.env.OD) || 8, DO = Number(process.env.DO) || 125, CPU = Number(process.env.CPU) || 4;
const START = { 8: [54, 50], 3: [25, 15], 13: [29, 25], 120: [20, 31], 125: [27, 20], 159: [20, 20], 1: [17, 20] };
kit.test({ port: Number(process.env.CDP_PORT) || 9421, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: OD, x: START[OD][0], y: START[OD][1], day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(150);
    // a first visit of the target and back - the images are loaded, as in a game played for a while
    if (!process.env.PIERWSZA) { await t.go(DO, START[DO][0], START[DO][1], 2); await t.frames(60); await t.go(OD, START[OD][0], START[OD][1], 2); await t.frames(90); }   // (PIERWSZA=1: the first visit)
    await t.b.send("Profiler.enable");
    await t.b.send("Profiler.setSamplingInterval", { interval: 200 });
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.b.send("Profiler.start");
    const t0 = Date.now();
    await t.eval(`$gamePlayer.reserveTransfer(${DO}, ${START[DO][0]}, ${START[DO][1]}, 2, 0); 0`);
    await t.until(`$gameMap.mapId() === ${DO} && SceneManager._scene instanceof Scene_Map && !SceneManager._scene.isBusy() && !SceneManager._scene._fadeDuration && SceneManager._scene._mapLoaded`, 60);
    const { profile } = await t.b.send("Profiler.stop");
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   przejście " + OD + " -> " + DO + " (CPU " + CPU + "x): " + (Date.now() - t0) + " ms");
    // self time per function (url:line name), from the samples
    const byId = new Map(profile.nodes.map(n => [n.id, n]));
    const self = new Map(), dt = profile.timeDeltas;
    for (let i = 0; i < profile.samples.length; i++) self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + (dt[i] || 0) / 1000);
    const agg = new Map(), file = new Map();
    for (const [id, ms] of self) {
        const n = byId.get(id), cf = n.callFrame, f = (cf.url || "").split("/").pop() || "(" + cf.functionName + ")";
        const k = f + ":" + (cf.lineNumber + 1) + " " + (cf.functionName || "(anon)");
        agg.set(k, (agg.get(k) || 0) + ms); file.set(f, (file.get(f) || 0) + ms);
    }
    console.log("   PLIKI: " + Array.from(file).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + " " + Math.round(v)).join(", "));
    for (const [k, v] of Array.from(agg).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log("   " + Math.round(v).toString().padStart(6) + " ms  " + k);
    // who calls the hot ones: self time of a function's subtree summed by the caller chain (3 up)
    const parent = new Map();
    for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const name = id => { const cf = byId.get(id).callFrame; return ((cf.url || "").split("/").pop() || "") + ":" + (cf.lineNumber + 1) + " " + (cf.functionName || "(anon)"); };
    const HOT = /eventsXy|Game_Event\.pos|Game_Map\.events|texSubImage2D|texImage2D/;
    const callers = new Map();
    for (const [id, ms] of self) {
        if (!HOT.test(name(id))) continue;
        let chain = [], p = parent.get(id), k = 0;
        while (p !== undefined && k < 6) { const nm = name(p); if (!HOT.test(nm) && !/^:0 \(anon\)$/.test(nm)) chain.push(nm); p = parent.get(p); k++; if (chain.length >= 3) break; }
        const key = name(id).split(" ").pop() + "  <-  " + chain.join("  <-  ");
        callers.set(key, (callers.get(key) || 0) + ms);
    }
    console.log("   KTO WOŁA:");
    for (const [k, v] of Array.from(callers).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log("   " + Math.round(v).toString().padStart(6) + " ms  " + k);
    t.check("profil zrobiony", true);
});
