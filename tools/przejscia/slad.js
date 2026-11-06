// Ślad przeglądarki (CDP Tracing) przy wejściu na mapę: co robi w długich klatkach poza kodem gry - „(program)” w profilu (2026-11-06,
// „jak drastycznie przyspieszyć wczytywanie mapy”). Najdłuższe zdarzenia głównego wątku i ich rodzaje w oknie przejścia.
//   CDP_PORT=9472 node tools/przejscia/slad.js [z_mapy] [na_mape] [x] [y]
"use strict";
const kit = require("../../tests/lib/kit.js");
const [from, to, tx, ty] = process.argv.slice(2).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9472, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: from || 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    const events = [];
    t.b.on("Tracing.dataCollected", p => events.push(...p.value));
    const cats = "devtools.timeline,disabled-by-default-devtools.timeline,v8,blink,gpu,cc,disabled-by-default-v8.gc,loading,netlog";
    await t.b.send("Tracing.start", { categories: cats, transferMode: "ReportEvents" });
    await t.eval(`window.__t0 = performance.now(); $gamePlayer.reserveTransfer(${to || 21}, ${tx || 40}, ${ty || 40}, 2, 0); 0`);
    await t.until(`$gameMap.mapId() === ${to || 21} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 60);
    await t.frames(30);
    const done = new Promise(res => t.b.on("Tracing.tracingComplete", res));
    await t.b.send("Tracing.end");
    await done;
    // the main thread of the page: the thread with the most "RunTask"/"FunctionCall" time in the renderer
    const byTid = new Map();
    for (const e of events) if (e.ph === "X" && e.dur) byTid.set(e.pid + ":" + e.tid, (byTid.get(e.pid + ":" + e.tid) || 0) + (e.name === "FunctionCall" ? e.dur : 0));
    const main = [...byTid.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const mine = events.filter(e => e.pid + ":" + e.tid === main && e.ph === "X" && e.dur);
    const tasks = mine.filter(e => e.name === "RunTask" || e.name === "ThreadControllerImpl::RunTask").sort((a, b) => b.dur - a.dur).slice(0, 6);
    console.log("wątek główny " + main + ", zdarzeń " + mine.length);
    for (const tk of tasks) {
        const inside = mine.filter(e => e !== tk && e.ts >= tk.ts && e.ts + e.dur <= tk.ts + tk.dur);
        const sum = new Map();
        for (const e of inside) sum.set(e.name, (sum.get(e.name) || 0) + e.dur);
        console.log("zadanie " + (tk.dur / 1000).toFixed(0) + " ms: " + [...sum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([n, d]) => n + " " + (d / 1000).toFixed(0)).join(", "));
    }
    // the other threads' long events in the same window (GPU, compositor, workers)
    const t0 = Math.min(...tasks.map(e => e.ts)), t1 = Math.max(...tasks.map(e => e.ts + e.dur));
    const other = new Map();
    for (const e of events) if (e.ph === "X" && e.dur > 20000 && e.pid + ":" + e.tid !== main && e.ts < t1 && e.ts + e.dur > t0) other.set(e.name + " (" + e.pid + ":" + e.tid + ")", Math.max(other.get(e.name) || 0, e.dur));
    console.log("inne wątki, zdarzenia > 20 ms: " + [...other.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n, d]) => n + " " + (d / 1000).toFixed(0)).join(", "));
});
