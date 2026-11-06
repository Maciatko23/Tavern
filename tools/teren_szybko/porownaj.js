// Czy przyspieszone malowanie terenu daje te same piksele (2026-11-06, „jak drastycznie przyspieszyć wczytywanie mapy”): na kilku mapach
// nad morzem i w lesie dokańcza malowanie brzegu (CzerwonaWoda) i Ziemi i liczy skrót pikseli każdego kawałka. Wynik do pliku JSON:
//   [GAME_OVERLAY=tools/teren_szybko/staging GAME_OVERLAY_JS=1] CDP_PORT=9470 node tools/teren_szybko/porownaj.js wynik.json
//   node tools/teren_szybko/porownaj.js --roznice przed.json po.json
"use strict";
const fs = require("fs");
if (process.argv[2] === "--roznice") {
    const a = JSON.parse(fs.readFileSync(process.argv[3], "utf8")), b = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
    let same = 0, diff = 0;
    for (const m of Object.keys(a)) for (const k of ["brzeg", "ziemia"]) {
        const x = a[m][k] || {}, y = (b[m] || {})[k] || {};
        for (const id of new Set([...Object.keys(x), ...Object.keys(y)])) { if (x[id] === y[id]) same++; else { diff++; if (diff <= 10) console.log("inny:", m, k, id, x[id], y[id]); } }
    }
    console.log("kawałków takich samych: " + same + ", innych: " + diff);
    process.exit(diff ? 1 : 0);
}
const kit = require("../../tests/lib/kit.js");
const OUT = process.argv[2] || "porownaj.json";
const MAPS = [[21, 40, 40], [125, 27, 20], [159, 20, 20], [3, 30, 30]];
kit.test({ port: Number(process.env.CDP_PORT) || 9470, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    const out = {};
    for (const [id, x, y] of MAPS) {
        await t.eval(`$gamePlayer.reserveTransfer(${id}, ${x}, ${y}, 2, 0); 0`);
        await t.until(`$gameMap.mapId() === ${id} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 60);
        await t.frames(10);
        // (the shore's chunks may come from workers: let the frames run until the painting is finished)
        await t.until(`(function(){ const r = SceneManager._scene._spriteset._redWater; if (r && r.visible && r._queue) r.workPatches(1e9); return !r || !r.visible || !r._queue; })()`, 600);
        out[id] = await t.json(`(function(){
            const set = SceneManager._scene._spriteset, fnv = d => { let h = 0x811c9dc5; for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 0x01000193); return (h >>> 0).toString(16); };
            const res = { brzeg: {}, ziemia: {} };
            const r = set._redWater;
            if (r && r.visible) { for (let i = 0; i < 400 && r._queue; i++) r.workPatches(1e9); for (const s of r._patch.children) { const f = s._frame; res.brzeg[s.x + "," + s.y] = fnv(s.bitmap.context.getImageData(f.x, f.y, f.width, f.height).data); } }
            const z = set._ziemia;
            if (z && z._cells) { for (let i = 0; i < 400 && !z.work(1e9); i++); for (const [ci, s] of z._cells) { const f = s._frame; res.ziemia[ci] = fnv(s.bitmap.context.getImageData(f.x, f.y, f.width, f.height).data); } }
            res.n = [Object.keys(res.brzeg).length, Object.keys(res.ziemia).length];
            return res; })()`);
        console.log("mapa " + id + ": kawałków brzegu " + out[id].n[0] + ", komórek Ziemi " + out[id].n[1]);
    }
    fs.writeFileSync(OUT, JSON.stringify(out));
    t.check("zapisane", true, OUT);
});
