// Profil procesora postoju na mapie (2026-11-05): które funkcje zjadają klatkę z nakładkami.   MAPA=125 X=24 Y=14 GODZ=23 CPU=4 node tools/laka/profil_klatki.js
"use strict";
const kit = require("../../tests/lib/kit.js");
const MAPA = Number(process.env.MAPA) || 125, X = Number(process.env.X) || 24, Y = Number(process.env.Y) || 14, GODZ = process.env.GODZ === undefined ? 23 : Number(process.env.GODZ), CPU = Number(process.env.CPU) || 4;
kit.test({ port: Number(process.env.CDP_PORT) || 9421, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: MAPA, x: X, y: Y, day: 12, hour: GODZ, quiet: true, minimap: false });
    await t.frames(300);
    console.log("   Laka " + (await t.eval("window.Laka ? JSON.stringify(Laka.stats()) : 'brak'")));
    console.log("   Ziemia " + (await t.eval("window.Ziemia ? JSON.stringify(Ziemia.stats()) : 'brak'")));
    await t.b.send("Profiler.enable");
    await t.b.send("Profiler.setSamplingInterval", { interval: 200 });
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.frames(30);
    await t.b.send("Profiler.start");
    await t.frames(240);
    const { profile } = await t.b.send("Profiler.stop");
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const byId = new Map(profile.nodes.map(n => [n.id, n]));
    const self = new Map(), dt = profile.timeDeltas;
    for (let i = 0; i < profile.samples.length; i++) self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + (dt[i] || 0) / 1000);
    const agg = new Map(), file = new Map();
    for (const [id, ms] of self) {
        const cf = byId.get(id).callFrame, f = (cf.url || "").split("/").pop() || "(" + cf.functionName + ")";
        const k = f + ":" + (cf.lineNumber + 1) + " " + (cf.functionName || "(anon)");
        agg.set(k, (agg.get(k) || 0) + ms / 240); file.set(f, (file.get(f) || 0) + ms / 240);
    }
    console.log("   PLIKI (ms na klatkę): " + Array.from(file).sort((a, b) => b[1] - a[1]).slice(0, 16).map(([k, v]) => k + " " + v.toFixed(2)).join(", "));
    for (const [k, v] of Array.from(agg).sort((a, b) => b[1] - a[1]).slice(0, 22)) console.log("   " + v.toFixed(2).padStart(6) + " ms  " + k);
    t.check("profil zrobiony", true);
});
