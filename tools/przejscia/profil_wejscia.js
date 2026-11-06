// Profil pierwszych sekund po wejściu na mapę (gracz 2026-11-06: „jak się wchodzi na nową mapę i pojawia się kinowy opis, da się zwiększyć wydajność?”):
// klatki (czas każdej) i próbki procesora z CDP Profiler przez 6 s od przejścia; najdroższe funkcje (własny czas) i najdłuższe klatki.
//   CDP_PORT=9438 node tools/przejscia/profil_wejscia.js [z_mapy] [na_mape] [x] [y] [spowolnienie]
"use strict";
const kit = require("../../tests/lib/kit.js");
const [from, to, tx, ty, slow] = process.argv.slice(2).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9438, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: from || 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    await t.b.send("Profiler.enable");
    await t.b.send("Profiler.setSamplingInterval", { interval: 500 });
    if (slow > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: slow });
    await t.eval(`window.__kl = []; (function tick(ts) { window.__kl.push(ts); if (window.__kl.length < 2000) requestAnimationFrame(tick); })(performance.now()); 0`);
    await t.b.send("Profiler.start");
    await t.eval(`$gamePlayer.reserveTransfer(${to || 21}, ${tx || 40}, ${ty || 40}, 2, 0); 0`);
    await t.frames(5);
    const t0 = Date.now();
    await t.until(`$gameMap.mapId() === ${to || 21} && !$gamePlayer.isTransferring()`, 60);
    const wejscie = await t.json(`performance.now()`);
    await t.frames(slow > 1 ? 160 : 360);
    const { profile } = await t.b.send("Profiler.stop");
    if (slow > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const kl = await t.json(`window.__kl`);
    const info = await t.json(`(() => { const s = SceneManager._scene._spriteset; return { cinema: !!(SceneManager._scene._cleanHud || 0), map: $gameMap.mapId() }; })()`);
    // klatki: czasy między kolejnymi
    const d = []; for (let i = 1; i < kl.length; i++) d.push([kl[i] - kl[i - 1], kl[i]]);
    const po = d.filter(x => x[1] >= wejscie - 2000);
    const dlugie = po.slice().sort((a, b) => b[0] - a[0]).slice(0, 12).map(x => [Math.round(x[0]), Math.round(x[1] - wejscie)]);
    console.log("od rozkazu przejścia do mapy: " + (Date.now() - t0) + " ms (przybliżenie)");
    console.log("klatek po wejściu: " + po.filter(x => x[1] >= wejscie).length + ", średnio " + (po.filter(x => x[1] >= wejscie).reduce((s, x) => s + x[0], 0) / Math.max(1, po.filter(x => x[1] >= wejscie).length)).toFixed(1) + " ms");
    console.log("najdłuższe klatki [ms, kiedy po wejściu ms]: " + JSON.stringify(dlugie));
    // próbki: własny czas funkcji
    const byId = new Map(profile.nodes.map(n => [n.id, n]));
    const dt = profile.timeDeltas, samples = profile.samples, self = new Map();
    for (let i = 0; i < samples.length; i++) {
        const n = byId.get(samples[i]), cf = n.callFrame;
        const key = (cf.functionName || "(anon)") + " " + (cf.url || "").split("/").pop() + ":" + (cf.lineNumber + 1);
        self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
    }
    const tot = [...self.values()].reduce((a, b) => a + b, 0);
    const top = [...self.entries()].filter(([k]) => !/^\(idle\)|^\(program\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 30);
    console.log("próbki razem " + tot.toFixed(0) + " ms, bez bezczynności: " + [...self.entries()].filter(([k]) => !/^\(idle\)/.test(k)).reduce((a, [, v]) => a + v, 0).toFixed(0) + " ms");
    for (const [k, v] of top) console.log("  " + v.toFixed(1).padStart(7) + " ms  " + k);
    // długie kawałki pracy bez przerwy (jedna klatka i więcej): co w nich - po wtyczkach, w kolejności czasu; plik najwyżej w stosie, który jest wtyczką
    const parent = new Map(); for (const nd of profile.nodes) for (const c of nd.children || []) parent.set(c, nd.id);
    const WRAP = /^(Wydajnosc|TawernaCore|TawernaUI)\.js$/;   // (wrappers round everything: the innermost plugin that is not one of them)
    const plugin = id => { let wrap = null; for (let x = id; x; x = parent.get(x)) { const cf = byId.get(x).callFrame, u = cf.url || ""; if (!/js\/plugins\//.test(u)) continue; const f = u.split("/").pop(); if (!WRAP.test(f)) return f + ":" + cf.functionName; wrap = wrap || f + ":" + cf.functionName; } return wrap || "(silnik)"; };
    let run = null, at = 0;
    const runs = [];
    for (let i = 0; i < samples.length; i++) {
        at += (dt[i] || 0) / 1000;
        const nd = byId.get(samples[i]), idle = nd.callFrame.functionName === "(idle)";
        if (idle) { if (run) { runs.push(run); run = null; } continue; }
        if (!run) run = { start: at, ms: 0, by: new Map(), fn: new Map() };
        run.ms += (dt[i] || 0) / 1000;
        const k = plugin(samples[i]); run.by.set(k, (run.by.get(k) || 0) + (dt[i] || 0) / 1000);
        // (KAWALKI=1: the functions too - own time, and the first plugin or engine function a few frames up that is not a wrapper)
        if (process.env.KAWALKI) {
            const cf = nd.callFrame, own = (cf.functionName || "(anon)") + " " + (cf.url || "").split("/").pop() + ":" + (cf.lineNumber + 1);
            let path = [];
            for (let x = samples[i], n = 0; x && n < 40; x = parent.get(x), n++) { const c = byId.get(x).callFrame; if (c.functionName && c.url) path.push(c.functionName + "@" + c.url.split("/").pop() + ":" + (c.lineNumber + 1)); }
            const key = own + "  <=  " + path.slice(1, 7).join(" < ");
            run.fn.set(key, (run.fn.get(key) || 0) + (dt[i] || 0) / 1000);
        }
    }
    if (run) runs.push(run);
    for (const r of runs.filter(r => r.ms > 30)) {
        console.log("  kawałek " + r.ms.toFixed(0) + " ms w " + r.start.toFixed(0) + " ms profilu: " + JSON.stringify([...r.by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => [k, Math.round(v)])));
        if (process.env.KAWALKI && r.ms > (Number(process.env.KAWALKI_MS) || 400)) for (const [k, v] of [...r.fn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log("      " + v.toFixed(0).padStart(5) + " ms  " + k.slice(0, 330));
    }
    // po plikach
    const pliki = new Map();
    for (const [k, v] of self) { const f = k.split(" ").pop().split(":")[0]; pliki.set(f, (pliki.get(f) || 0) + v); }
    console.log("po plikach: " + JSON.stringify([...pliki.entries()].filter(([f]) => f).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([f, v]) => [f, Math.round(v)])));
});
