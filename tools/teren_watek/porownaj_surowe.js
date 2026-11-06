// Exactness of the worker route (staging with the __cwKeep / __cwDebug hooks): the raw pixels the workers return vs CzerwonaWoda paintCore on the main thread, maps 21, 125, 159.
//   GAME_OVERLAY=tools/teren_watek/staging GAME_OVERLAY_JS=1 CDP_PORT=9474 node tools/teren_watek/porownaj_surowe.js   (rawBadChunks must be 0)
const kit = require("../../tests/lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9474, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    await t.eval(`window.__cwKeep = {}; 0`);
    for (const [id, x, y] of [[21, 40, 40], [125, 27, 20], [159, 20, 20]]) {
    await t.eval(`$gamePlayer.reserveTransfer(${id}, ${x}, ${y}, 2, 0); 0`);
    await t.until(`$gameMap.mapId() === ${id} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 60);
    await t.until(`(function(){ const r = SceneManager._scene._spriteset._redWater; if (r && r.visible && r._queue) r.workPatches(1e9); return !r._queue; })()`, 600);
    const o = await t.json(`(function(){
        const D = window.__cwDebug, g = D.geo(), TX = D.textures(g), r = SceneManager._scene._spriteset._redWater; let n = 0, rawBad = 0, bad255 = 0, maxd = 0, chunksDiff = 0;
        for (const s of r._patch.children) { n++;
            const cx = s.x / D.CH, cy = s.y / D.CH, f = s._frame, a = s.bitmap.context.getImageData(f.x, f.y, f.width, f.height).data, k = window.__cwKeep[cx + "," + cy], b = D.paintCore(g, TX, cx, cy);
            if (k) for (let i = 0; i < b.length; i++) if (k[i] !== b[i]) { rawBad++; break; }
            let cd = false;
            for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) { cd = true; const al = b[(i | 3)]; if (al === 255) bad255++; maxd = Math.max(maxd, Math.abs(a[i] - b[i])); }
            if (cd) chunksDiff++;
        }
        return { n, kept: Object.keys(window.__cwKeep).length, rawBadChunks: rawBad, readbackDiffChunks: chunksDiff, diffAtAlpha255: bad255, maxd }; })()`);
    console.log(id, JSON.stringify(o));
    await t.eval(`window.__cwKeep = {}; 0`);
    }
});
