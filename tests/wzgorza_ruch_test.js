// Walking behind the BACK edges of Map990's middle hill (the player's region 3: a whole cell deep, 2026-11-01 rules): along the top edge both ways without a stop, along the
// lower back edge of the right step; at the SIDES the hero stops on the line and is never covered; and while walking the occluder layer stays in step with the tilemap and
// pixel identical to the world under it.
// GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/wzgorza_ruch_test.js     (SZER/WYS: window size, e.g. 1920x1080)
"use strict";
const kit = require("./lib/kit.js");
const FY = Number(process.env.FY) || 880;
const PROBE = `(() => {
    const W = window.Wzgorza, app = Graphics._app, r = app.renderer, ss = SceneManager._scene._spriteset, P = $gamePlayer;
    const lip = ss._wzgorzaLip, tm = ss._tilemap;
    const sp = ss._characterSprites.find(s => s._character === P);
    const hide = [sp, sp._groundShadow, sp._sunShadow].concat(lip._heads ? Array.from(lip._heads.values()) : []).filter(Boolean);   // (the heads of covered characters too: they are the character, not the world)
    const sync = Math.abs(lip._box.x - (-Math.ceil($gameMap.displayX() * 48))) + Math.abs(lip._box.y - (-Math.ceil($gameMap.displayY() * 48))) + Math.abs(lip._box.x - (-Math.ceil(tm.origin.x))) * 0;
    const on = Array.from(lip._pieces.values()).filter(p => p && p.visible);
    if (!on.length) return JSON.stringify({ x: P._realX * 48, n: 0, sync, bad: 0 });
    const ov = hide.map(h => h.visible);
    hide.forEach(h => { h.visible = false; });
    r.render(app.stage); const a = r.extract.pixels();
    on.forEach(p => { p.visible = false; }); r.render(app.stage); const b = r.extract.pixels(); on.forEach(p => { p.visible = true; });
    hide.forEach((h, i) => { h.visible = ov[i]; });
    const ox = Math.ceil($gameMap.displayX() * 48), oy = Math.ceil($gameMap.displayY() * 48), rh = Math.floor(r.height), rw = Math.floor(r.width);
    const ex = []; let bad = 0, mx = 0, bx0 = 1e9, bx1 = -1, by0 = 1e9, by1 = -1;
    for (const p of on) { const gp = p.getGlobalPosition(); p._gx = Math.round(gp.x); p._gy = Math.round(gp.y); }
    for (const p of on) for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) {
        const sx = p._gx + i, sy = p._gy + j; if (sx < 0 || sy < 0 || sx >= rw || sy >= rh) continue;
        const q = ((rh - 1 - sy) * rw + sx) * 4;
        if (Math.abs(a[q] - b[q]) + Math.abs(a[q + 1] - b[q + 1]) + Math.abs(a[q + 2] - b[q + 2]) > 60) { bad++; if (ex.length < 12) ex.push([sx, sy, a[q], a[q+1], a[q+2], b[q], b[q+1], b[q+2]]); const d = Math.abs(a[q] - b[q]) + Math.abs(a[q + 1] - b[q + 1]) + Math.abs(a[q + 2] - b[q + 2]); if (d > mx) mx = d; bx0 = Math.min(bx0, sx); bx1 = Math.max(bx1, sx); by0 = Math.min(by0, sy); by1 = Math.max(by1, sy); }
    }
    let bad2 = -1;
    if (bad > 70 && window.__lst) {   // (diagnosis: the same frames with the soft ground borders (Sprite_Ziemia) left out)
        const zs = tm.children.filter(c => c.constructor && c.constructor.name === "Sprite_Ziemia"), zv = zs.map(z => z.visible);
        zs.forEach(z => { z.visible = false; });
        hide.forEach(h => { h.visible = false; }); r.render(app.stage); const a2 = r.extract.pixels();
        on.forEach(p => { p.visible = false; }); r.render(app.stage); const b2 = r.extract.pixels(); on.forEach(p => { p.visible = true; });
        hide.forEach((h, i) => { h.visible = ov[i]; }); zs.forEach((z, i) => { z.visible = zv[i]; });
        bad2 = 0;
        for (const p of on) for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) { const sx = p._gx + i, sy = p._gy + j; if (sx < 0 || sy < 0 || sx >= rw || sy >= rh) continue; const q = ((rh - 1 - sy) * rw + sx) * 4; if (Math.abs(a2[q] - b2[q]) + Math.abs(a2[q + 1] - b2[q + 1]) + Math.abs(a2[q + 2] - b2[q + 2]) > 9) bad2++; }
    }
    const lst = [];
    if (bad > 70 && window.__lst) { const walk = (o, d, path) => { if (!o.visible || d > 7) return; if (o.getBounds && o.parent !== lip._box && !on.includes(o)) { const b = o.getBounds(); if (b.width > 0 && b.width < 300 && b.x < bx1 && b.x + b.width > bx0 && b.y < by1 && b.y + b.height > by0) lst.push([path, o.constructor.name, d, o.z, Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height), o.alpha, o.blendMode].join(" ")); } (o.children || []).forEach(c => walk(c, d + 1, path + "/" + o.constructor.name)); }; walk(app.stage, 0, ""); }
    return JSON.stringify({ bad2, lst: lst.slice(0, 25), x: P._realX * 48, n: on.length, sync, bad, mx, box: [bx0, by0, bx1, by1], hero: [sp.x, sp.y], ex, crop: (window.__wantCrop && bad > 300 && bad < 5000) ? (() => { const X0 = Math.max(0, bx0 - 40), Y0 = Math.max(0, by0 - 50), W2 = 150, H2 = 110, aa = [], bb = []; for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) { const q = ((rh - 1 - (Y0 + j)) * rw + X0 + i) * 4; aa.push(a[q], a[q+1], a[q+2]); bb.push(b[q], b[q+1], b[q+2]); } return { X0, Y0, W2, H2, aa, bb }; })() : null, org: [tm.origin.x, tm.origin.y, $gameMap.displayX() * 48, $gameMap.displayY() * 48], pcs: on.map(p => [p.x, p.y]), ploc: [lip._box.x, lip._box.y] });
})()`;
const VIS = `(() => {
    const app = Graphics._app, r = app.renderer, ss = SceneManager._scene._spriteset, P = $gamePlayer;
    const sp = ss._characterSprites.find(s => s._character === P);
    const hide = [sp._groundShadow, sp._sunShadow, sp._polishOutline].filter(Boolean);
    const ov = hide.map(h => h.visible), ovs = sp.visible;
    const rw = Math.floor(r.width), rh = Math.floor(r.height), cx = Math.round(sp.x), cy = Math.round(sp.y);
    sp.visible = true; r.render(app.stage); const a = r.extract.pixels();
    const hd = ss._wzgorzaLip._heads ? Array.from(ss._wzgorzaLip._heads.values()) : [], hv = hd.map(h => h.visible);
    sp.visible = false; hd.forEach(h => { h.visible = false; }); r.render(app.stage); const c = r.extract.pixels();
    hd.forEach((h, i) => { h.visible = hv[i]; }); sp.visible = ovs; hide.forEach((h, i) => { h.visible = ov[i]; });
    let y0 = 1e9, y1 = -1;
    for (let sy = cy - 90; sy < cy + 10; sy++) for (let sx = cx - 40; sx < cx + 40; sx++) {
        if (sx < 0 || sy < 0 || sx >= rw || sy >= rh) continue;
        const i = ((rh - 1 - sy) * rw + sx) * 4;
        if (Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]) > 40) { if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; }
    }
    return JSON.stringify({ h: y1 < 0 ? 0 : y1 - y0 + 1, top: y0, bottom: y1, feet: cy });
})()`;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, width: Number(process.env.SZER) || 1280, height: Number(process.env.WYS) || 720, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 990, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    await t.eval('window.__lst = true; window.__wantCrop = ' + (process.env.DBGIMG ? 'true' : 'false') + '; 0');
    // One run behind the whole hill (the player's rule 2026-11-01: every arc belongs to the corridor): in at the end on one side, round the top corner, along the top edge, down the two arcs of the
    // step, along the lower edge, round the end corner and out - and back. The keys as the player presses them: the way (right / left), and "down" too while in the strip going right (the line
    // goes down there; going left the slide along the arc carries the hero up).
    const HOLD = async (keys, frames) => { await t.eval(`window.__k = ${JSON.stringify(keys)}; window.__iv = setInterval(() => { for (const k of ["left","right","up","down"]) Input._currentState[k] = window.__k.includes(k); }, 4); 0`); await t.frames(frames); await t.eval("clearInterval(window.__iv); for (const k of ['left','right','up','down']) Input._currentState[k] = false; 0"); };
    for (const [name, dir, x0, y0, xEnd, passY] of [["ciąg z lewej strony wzgórza na prawą przez wszystkie łuki", "right", 1700, 905, 2300, 1000], ["ciąg z prawej strony wzgórza na lewą przez wszystkie łuki", "left", 2340, 1010, 1712, 0]]) {
        await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._wzUp = false; $gamePlayer._realX = ${x0} / 48; $gamePlayer._realY = ${y0} / 48; $gamePlayer._x = Math.round(${x0} / 48); $gamePlayer._y = Math.round(${y0} / 48); $gamePlayer.setDirection(${dir === "right" ? 6 : 4}); 0`);
        await t.frames(30);
        const hs = [], gaps = []; let firstIn = -1, lastIn = -1, st = [x0, y0, 0], worst = 0, covered = 0, stuck = 0, maxStuck = 0, deep = 0, uncov = 0, maxY = 0, minY = 1e9, depthMin = 1e9, depthMax = 0, last = x0, done = false, probes = 0;
        for (let k = 0; k < 220 && !done; k++) {
            await HOLD([dir], 4);
            const r = JSON.parse(await t.eval(PROBE)); probes++;
            st = await t.json("(() => { const x = Math.round($gamePlayer._realX * 48), y = Math.round($gamePlayer._realY * 48); return [x, y, Wzgorza.standing(x, y), Wzgorza.maxDepth(x, y), Wzgorza.bodyBad(x, y)]; })()");
            worst = Math.max(worst, r.bad); if (r.crop && process.env.DBGIMG) require('fs').writeFileSync(process.env.TEMP + '/crop.json', JSON.stringify(r.crop));
            if (st[2] === 1 && st[3] >= 40) { const v = JSON.parse(await t.eval(VIS)); hs.push(v.h); if (process.env.DBGH) console.log("H", dir, st[0], st[1], Math.round(st[3]), v.h); }
            if (st[2] === 1) { if (firstIn < 0) firstIn = probes; lastIn = probes; }
            if (st[2] === 0 && firstIn >= 0) gaps.push([probes, st[0], st[1]]);
            if (st[2] === 1) {
                covered++; depthMin = Math.min(depthMin, st[3]); depthMax = Math.max(depthMax, st[3]); maxY = Math.max(maxY, st[1]); minY = Math.min(minY, st[1]);
                if (st[4]) uncov++;
                if (r.n === 0 && st[3] > 6) uncov++;   // in the strip, so a piece of the layer must be on (the first few px at the entry: the layer follows a frame later)
                const dx = dir === "right" ? st[0] - last : last - st[0];
                if (dx < 0.5) { stuck++; maxStuck = Math.max(maxStuck, stuck); } else stuck = 0;
            }
            if (st[2] === 2) deep++;
            last = st[0];
            if ((dir === "right" && st[0] >= xEnd) || (dir === "left" && st[0] <= xEnd)) done = true;
        }
        console.log("   " + name + ": koniec " + st[0] + "," + st[1] + ", w pasie " + covered + "/" + probes + ", najdłuższy postój " + maxStuck + ", wysokość " + minY + ".." + maxY + ", głębokość " + Math.round(depthMin) + ".." + Math.round(depthMax) + ", na szczycie " + deep + ", bez zasłony " + uncov + ", złe piksele (max) " + worst);
        const sorted = hs.slice().sort((a, b) => a - b), ref = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0, off = hs.filter(h => Math.abs(h - ref) > 4).length;
        console.log("   widoczna wysokość postaci w pasie (próbek " + hs.length + "): mediana " + ref + ", min " + Math.min(...hs) + ", max " + Math.max(...hs) + ", poza ±4: " + off);
        t.check(name + ": widoczna wysokość postaci stała (±4 px od mediany, jak na prostej krawędzi)", hs.length >= 20 && off <= 4, { ref, off, n: hs.length });
        const inner = gaps.filter(g => g[0] < lastIn);
        console.log("   wyjścia z pasa w środku trasy: " + inner.length + (inner.length ? " " + JSON.stringify(inner.slice(0, 6)) : ""));
        t.check(name + ": samo klawisz kierunku prowadzi pasem od wejścia do końca (żadnego wyjścia ponad linię w środku)", inner.length === 0, { inner: inner.slice(0, 6) });
        t.check(name + ": dochodzi do końca (wychodzi z boku)", done, { st });
        t.check(name + ": w pasie cały czas, bez postoju dłuższego niż 3 próbki", covered >= 30 && maxStuck <= 3, { covered, maxStuck });
        t.check(name + ": zasłonięta w każdej próbce w pasie, nigdy na szczycie", uncov === 0 && deep === 0, { uncov, deep });
        t.check(name + ": zeszła na niższą krawędź stopnia i wróciła (wysokość pasa " + minY + ".." + maxY + ")", maxY - minY >= 60, { minY, maxY });
        t.check(name + ": warstwa pikselowo zgodna ze światem (poza 1 animowanym źdźbłem trawy, do 70 px na próbkę)", worst <= 70, { worst });
    }
    // [name, direction, start x, end x, feet row (sprite top y), whole pass wanted, covered samples at least, covered samples at most]
    const ROUTES = [
        ["tylna krawędź z lewej na prawą (do końca, przez oba rogi)", "right", 1690, 2262, FY, true, 10, 1e9],
        ["tylna krawędź z prawej na lewą (do końca, przez oba rogi)", "left", 2262, 1690, FY, true, 10, 1e9],
        ["niższa tylna krawędź stopnia z prawej na lewą", "left", 2500, 2100, 985, false, 5, 1e9],
        ["niższa tylna krawędź stopnia: wejście od tyłu (z północy), w dół do końca pasa", "down", 2220, 2220, 930, false, 5, 1e9],
        ["górna tylna krawędź: wejście od tyłu (z północy), w dół do końca pasa", "down", 1950, 1950, 850, false, 5, 1e9],
        ["lewy niższy występ (łuk): wejście z lewej na pas pod jego tylną krawędzią", "right", 1690, 1800, 1030, false, 5, 1e9],
        ["lewy bok nisko: staje na linii, nigdy zasłonięta", "right", 1600, 1750, 1160, false, 0, 0],
        ["lewy bok pod górnym rogiem: staje na linii, nigdy zasłonięta", "right", 1700, 1800, 975, false, 0, 0],
        ["prawy bok stopnia: staje na linii, nigdy zasłonięta", "left", 2480, 2100, 1100, false, 0, 0],
    ];
    for (const [name, dir, x0, x1, fy, whole, minCov, maxCov] of ROUTES) {
        await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._wzUp = false; $gamePlayer._realX = ${x0} / 48; $gamePlayer._realY = ${fy} / 48; $gamePlayer._x = Math.round(${x0} / 48); $gamePlayer._y = Math.round(${fy} / 48); $gamePlayer.setDirection(${dir === "right" ? 6 : dir === "left" ? 4 : 2}); 0`);
        await t.frames(30);
        let worst = 0, last = x0, stuck = 0, maxStuck = 0, covered = 0, pixBad = 0, probes = 0, deep = 0, uncov = 0;
        for (let k = 0; k < 160; k++) {
            await t.hold(dir, 4);
            const r = JSON.parse(await t.eval(PROBE)); probes++;
            const st = await t.json("(() => { const x = Math.round($gamePlayer._realX * 48), y = Math.round($gamePlayer._realY * 48); return [Wzgorza.standing(x, y), Wzgorza.bodyBad(x, y)]; })()");
            if (r.n > 0) covered++;
            if (st[0] === 2) { deep++; if (process.env.DBG) console.log("szczyt", name, r.x, JSON.stringify(st)); }
            if (st[0] === 1 && st[1]) uncov++;   // in the strip but not coverable: never
            pixBad += r.bad; worst = Math.max(worst, r.bad); if (r.bad && process.env.DBG) console.log(JSON.stringify(r));
            const dx = dir === "down" ? 1 : dir === "right" ? r.x - last : last - r.x;
            if (dx < 0.5) { stuck++; maxStuck = Math.max(maxStuck, stuck); } else stuck = 0;
            last = r.x;
            if ((dir === "right" && r.x >= x1) || (dir === "left" && r.x <= x1) || (dir === "down" && k >= 60)) break;
        }
        const end = await t.json("$gamePlayer._realX * 48");
        console.log("   " + name + ": koniec " + Math.round(end) + ", najdłuższy postój " + maxStuck + ", z zasłoną " + covered + "/" + probes + ", na szczycie " + deep + ", w pasie bez zasłony " + uncov + ", złe piksele (max) " + worst);
        if (whole) t.check("przejście: " + name + ", bez zatrzymania", (dir === "right" ? end >= x1 - 8 : end <= x1 + 8) && maxStuck <= 3, { end, maxStuck });
        t.check(name + ": zasłonięta w próbkach " + minCov + ".." + (maxCov > 1e6 ? "∞" : maxCov), covered >= minCov && covered <= maxCov, { covered });
        t.check(name + ": nigdy na szczycie ani w pasie bez zasłony", deep === 0 && uncov === 0, { deep, uncov });
        t.check(name + ": warstwa pikselowo zgodna ze światem (poza 1 animowanym źdźbłem trawy, do 70 px na próbkę)", worst <= 70, { pixBad, worst });
    }
});
