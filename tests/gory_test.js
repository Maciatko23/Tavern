// Gory.js (the user, 2026-11-26: "skarpy wywal te stare, tylko góry ładne, wysokie, wielkie"; "żeby na ogródki nie wchodziły";
// "po środku krawędzi na Kruczogrodzie musi być przejście pomiędzy górami"): on Kruczogród (Map220) the old cliffs of the north and
// south bands are gone - grass with region 2 under big mountain pictures; the events that stood on the cliffs out of sight; the hero
// cannot walk into the band, but through the pass in the middle of each edge (up to its last rows; the south one is shut by the gardens' fence - the map's own); no mountain reaches below the north
// band or above the south one. Screenshots tests/gory_*.png. CDP_PORT=9463.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9463, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    t.check("a new game", await t.newGame({ hour: 11, quiet: true }));
    const go = async (x, y, d) => { await t.eval(`(function(){ $gamePlayer.reserveTransfer(220, ${x}, ${y}, ${d || 8}, 2); return 0; })()`); await t.until(t.onMap(220), 30); await t.frames(30); await t.eval("SceneManager._scene.startFadeIn(1, false); 0"); };
    await go(20, 11);
    const data = await t.json(`(function(){ const M = GoryData.maps[220], W = $dataMap.width, H = $dataMap.height, a = $dataMap.data, at = (x, y, z) => a[(z * H + y) * W + x];
        const A5 = t => t >= 1536 && t < 2048;
        let a5 = 0, noRegion = 0;
        for (let x = 0; x < W; x++) { for (let y = 0; y < M.n[x]; y++) { if (A5(at(x, y, 0))) a5++; if (!(x >= 37 && x < 44) && at(x, y, 5) !== 2) noRegion++; }
            for (let y = M.s[x]; y < H; y++) { if (A5(at(x, y, 0))) a5++; if (!(x >= 37 && x < 44) && at(x, y, 5) !== 2) noRegion++; } }
        const sp = SceneManager._scene._spriteset._gory || [];
        const band = $gameMap.events().filter(e => e && e._gory);
        return { a5, noRegion, passMid: at(40, 4, 5), passEdge: at(40, 0, 5), passS: at(40, 76, 5), passSEdge: at(40, 79, 5), sprites: sp.length, pieces: M.p.length,
            hidden: band.length, hiddenAll: band.every(e => e.isTransparent()), nN: M.p.filter(p => p[4] === "N").length, nS: M.p.filter(p => p[4] === "S").length }; })()`);
    t.check("the old cliffs gone: no A5 cliff tile left in the bands, every band field region 2 (but the passes)", data.a5 === 0 && data.noRegion === 0, data);
    t.check("the passes in the middle of both edges: free inside, blocked only at the map's very edge", data.passMid === 0 && data.passEdge === 2 && data.passS === 0 && data.passSEdge === 2, data);
    t.check("the mountains drawn (one sprite a piece, north and south) and the events of the cliffs out of sight", data.sprites === data.pieces && data.nN > 5 && data.nS > 5 && data.hidden > 0 && data.hiddenAll, data);
    // no mountain below the north band or above the south one (the pictures' own pixels, as the game has them)
    const fit = await t.json(`new Promise(res => { const M = GoryData.maps[220], bad = []; let left = M.p.length;
        const files = {}; for (const k of Object.keys(GoryData.files)) files[k] = ImageManager.loadPicture("gory/" + GoryData.files[k]);
        const check = () => { if (Object.values(files).some(b => !b.isReady())) return setTimeout(check, 50);
            for (const [k, x0, y0, sc, edge] of M.p) {
                const b = files[k], c = b.context || (b._canvas && b._canvas.getContext("2d")); let d = null;
                try { d = b.context.getImageData(0, 0, b.width, b.height).data; } catch (e) { bad.push("noread " + k); continue; }
                for (let i = 0; i < b.width; i += 2) { let top = -1, bot = -1; for (let j = 0; j < b.height; j++) if (d[(j * b.width + i) * 4 + 3] > 40) { if (top < 0) top = j; bot = j; }
                    if (top < 0) continue;
                    const px = x0 + i * sc, col = Math.max(0, Math.min(79, Math.floor(px / 48)));
                    if (edge === "N" && y0 + (bot + 1) * sc > M.n[col] * 48 + 1) { bad.push([k, x0, col, "below"]); break; }
                    if (edge === "S" && y0 + top * sc < M.s[col] * 48 - 1) { bad.push([k, x0, col, "above"]); break; } } }
            res({ bad: bad.slice(0, 5), n: bad.length }); };
        check(); })`);
    t.check("no mountain's pixel below the north band or above the south one (gardens, fences, houses stay clear)", fit.n === 0, fit);
    // (Podgrodzie and Dwór nad Jazem: whole ridges, no pass; the band written into their map files too)
    for (const [mid, x, y] of [[218, 30, 12], [221, 30, 12]]) {
        await t.eval(`(function(){ $gamePlayer.reserveTransfer(${mid}, ${x}, ${y}, 8, 2); return 0; })()`); await t.until(t.onMap(mid), 30); await t.frames(30);
        const m = await t.json(`(function(){ const M = GoryData.maps[${mid}], W = $dataMap.width, H = $dataMap.height, a = $dataMap.data, at = (x, y, z) => a[(z * H + y) * W + x];
            let a5 = 0, noRegion = 0; for (let x = 0; x < W; x++) { for (let y = 0; y < M.n[x]; y++) { if (at(x, y, 0) >= 1536 && at(x, y, 0) < 2048) a5++; if (at(x, y, 5) !== 2) noRegion++; }
                for (let y = M.s[x]; y < H; y++) { if (at(x, y, 0) >= 1536 && at(x, y, 0) < 2048) a5++; if (at(x, y, 5) !== 2) noRegion++; } }
            const sp = SceneManager._scene._spriteset._gory || [];
            return { a5, noRegion, sprites: sp.length, pieces: M.p.length, hidden: $gameMap.events().filter(e => e && e._gory).length }; })()`);
        t.check("Map" + mid + ": the cliffs gone, the band blocked, every mountain drawn, the cliffs' events out of sight", m.a5 === 0 && m.noRegion === 0 && m.sprites === m.pieces && m.pieces > 20 && m.hidden > 0, m);
        const f = await t.json(`new Promise(res => { const M = GoryData.maps[${mid}], bad = [];
            const files = {}; for (const k of Object.keys(GoryData.files)) files[k] = ImageManager.loadPicture("gory/" + GoryData.files[k]);
            const check = () => { if (Object.values(files).some(b => !b.isReady())) return setTimeout(check, 50);
                for (const [k, x0, y0, sc, edge] of M.p) { const b = files[k], d = b.context.getImageData(0, 0, b.width, b.height).data;
                    for (let i = 0; i < b.width; i += 2) { let top = -1, bot = -1; for (let j = 0; j < b.height; j++) if (d[(j * b.width + i) * 4 + 3] > 40) { if (top < 0) top = j; bot = j; }
                        if (top < 0) continue; const col = Math.max(0, Math.min(79, Math.floor((x0 + i * sc) / 48)));
                        if (edge === "N" && y0 + (bot + 1) * sc > M.n[col] * 48 + 1) { bad.push([k, x0, col, "below"]); break; }
                        if (edge === "S" && y0 + top * sc < M.s[col] * 48 - 1) { bad.push([k, x0, col, "above"]); break; } } }
                res({ n: bad.length, bad: bad.slice(0, 4) }); }; check(); })`);
        t.check("Map" + mid + ": no mountain's pixel below the north band or above the south one", f.n === 0, f);
        for (const [sx, sy, d, tag] of [[30, 11, 8, "N"], [60, 11, 8, "N2"], [30, 70, 2, "S"]]) {
            await t.eval(`(function(){ $gamePlayer.reserveTransfer(${mid}, ${sx}, ${sy}, ${d}, 2); return 0; })()`); await t.until(t.onMap(mid), 30); await t.frames(40);
            await t.eval("SceneManager._scene.startFadeIn(1, false); 0"); await t.frames(20);
            await t.shot(path.join(__dirname, "gory_" + mid + "_" + tag + ".png"));
        }
    }
    // walking: into the band - stopped at its foot; through the pass - up to its last rows
    const walk = async (x, y, dir, frames) => { await go(x, y, dir === "up" ? 8 : 2); await t.eval(`Input._currentState.${dir} = true; 0`); await t.frames(frames); await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(6); return t.json("({ x: $gamePlayer.x, y: $gamePlayer.y, ry: Math.round($gamePlayer._realY * 10) / 10 })"); };
    const walkOn = async (x, y, dir, frames) => { await go(x, y, 8); await t.eval(`Input._currentState.${dir} = true; 0`); await t.frames(frames); await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(6); return t.json("({ x: $gamePlayer.x, y: $gamePlayer.y })"); };
    const wP = await walk(40, 10, "up", 260), wNW = await walkOn(40, 4, "left", 160), wNE = await walkOn(40, 4, "right", 160);
    const wPS = await walkOn(40, 75, "down", 200), wSW = await walkOn(40, 76, "left", 160);
    t.check("walking north through the pass: far in, but not over the map's edge rows", wP.y <= 4 && wP.y >= 2, wP);
    t.check("in the north pass the mountains' band blocks both sides (columns 37-43)", wNW.x >= 37 && wNE.x <= 43, { wNW, wNE });
    t.check("in the south pass: down to its last free rows, the band blocks the side", wPS.y >= 75 && wPS.y <= 77 && wSW.x >= 37, { wPS, wSW });
    // the camera by the north ridge (the user: "kamera unosi się przy górach"): it rises above the map's top, the sky shows; away from
    // the mountains the hero is in the middle again; walking up to the ridge the view rises smoothly (no jump)
    await go(40, 30, 8); await t.frames(60);
    const far = await t.json("({ dy: $gameMap.displayY(), y: $gamePlayer._realY, lift: Gory.cameraLift() })");
    await go(40, 10, 8); await t.frames(60);   // (the pass's way up, free - the walk above went there)
    const rise = await t.json(`new Promise(res => { const out = []; let last = -1, n = 0; Input._currentState.up = true;
        const iv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount; n++; out.push($gameMap.displayY());
            if ($gamePlayer._realY <= 4.5 || n > 900) { clearInterval(iv); Input._currentState.up = false;
                const steps = out.slice(1).map((v, i) => Math.abs(v - out[i])); res({ n, minDy: Math.min(...out), maxStep: Math.max(...steps), y: $gamePlayer._realY }); } }, 2); })`);
    await t.frames(80);
    const top = await t.json("({ dy: $gameMap.displayY(), sky: !!(SceneManager._scene._spriteset._goryNiebo && SceneManager._scene._spriteset._goryNiebo.visible), lift: Gory.cameraLift() })");
    t.check("away from the mountains: no lift, the hero in the middle", far.lift === 0 && Math.abs(far.dy - (far.y - 7)) < 0.05, far);
    t.check("walking up the pass with the view above the map's top: smooth, no jump back to the edge (under a quarter tile a frame)", rise.minDy < -3 && rise.maxStep < 0.25, rise);
    t.check("by the ridge: the view stands above the map, the sky drawn there", top.dy < -3 && top.sky, top);
    // the screenshots
    for (const [x, y, d, tag] of [[20, 11, 8, "polnoc"], [40, 6, 8, "przelecz_N"], [22, 69, 2, "poludnie"], [40, 74, 2, "przelecz_S"], [62, 10, 8, "polnoc_ogrodek"], [40, 3, 8, "przelecz_N_niebo"], [30, 9, 8, "polnoc_niebo"]]) {
        await go(x, y, d); await t.frames(80);
        await t.shot(path.join(__dirname, "gory_" + tag + ".png"));
    }
});
