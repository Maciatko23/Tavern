// Wall time of one first entry onto a shore map: the order to move -> Scene_Map.start (the screen opens), the longest main-thread frames after it,
// and (staging) how long the workers' job took. CPU=4 slows the page (and maybe not the workers: read "job").
//   [GAME_OVERLAY=tools/teren_watek/staging GAME_OVERLAY_JS=1] CDP_PORT=9475 [CPU=4] node tools/teren_watek/wejscie.js [z] [na] [x] [y]
"use strict";
const kit = require("../../tests/lib/kit.js");
const [from, to, tx, ty] = process.argv.slice(2).map(Number);
const CPU = Number(process.env.CPU) || 1;
kit.test({ port: Number(process.env.CDP_PORT) || 9475, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: from || 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    await t.eval(`(() => { const K = window.__w = { frames: [], t0: 0, start: 0, last: 0 };
        const _s = Scene_Map.prototype.start; Scene_Map.prototype.start = function() { if (!K.start) K.start = performance.now(); return _s.apply(this, arguments); };
        (function tick(ts) { if (K.t0) K.frames.push([ts, ts - K.last]); K.last = ts; if (K.frames.length < 3000) requestAnimationFrame(tick); })(performance.now()); return 0; })()`);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.eval(`window.__w.t0 = performance.now(); window.__w.start = 0; $gamePlayer.reserveTransfer(${to || 21}, ${tx || 40}, ${ty || 40}, 2, 0); 0`);
    await t.until(`$gameMap.mapId() === ${to || 21} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 90);
    await t.until(`(function(){ const r = SceneManager._scene._spriteset._redWater; return !r || !r.visible || !r._queue; })()`, 120);
    await t.frames(CPU > 1 ? 30 : 120);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const o = await t.json(`(() => { const K = window.__w, f = K.frames.filter(x => x[0] >= K.t0), D = window.__cwDebug;
        return { toStart: Math.round(K.start - K.t0), job: D && D.pool ? D.pool.lastMs : null, long: f.map(x => Math.round(x[1])).filter(x => x > 40).sort((a, b) => b - a).slice(0, 8), over33: Math.round(f.map(x => x[1]).filter(x => x > 33).reduce((a, b) => a + b, 0)) }; })()`);
    console.log("CPU " + CPU + " " + JSON.stringify(o));
});
