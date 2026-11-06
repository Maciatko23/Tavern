// Behind a hill's back edge (RegionLayers.js v1.1.0, user 2026-11-03): region 3 on an A5 tile shut on its top side is the ground behind the hill, the whole
// cell over the hero. On Map990 the player's 12 cells: walkable from behind and along the edge, never towards the hill's top (both ways); a character whose
// feet are there is masked in the cells of its row (the world under it stays as it is, only the head shows), its shadows are not drawn.
// GAME_OVERLAY=tools/za_wzgorzem/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/za_wzgorzem_test.js     (SZER/WYS: window size, e.g. 1920x1080; ZRZUTY: a folder for 4 shots)
// (FreeMovement.js keeps the feet on a hill's top - the rim they leave is asked too - the sides are checked here as well)
"use strict";
const kit = require("./lib/kit.js");
const CELLS = [[37, 19], [38, 19], [39, 19], [40, 19], [41, 19], [42, 19], [43, 19], [44, 20], [45, 21], [46, 21], [47, 21], [36, 22]];
const SHOTS = process.env.ZRZUTY || "";
kit.test({ port: Number(process.env.CDP_PORT) || 9413, width: Number(process.env.SZER) || 1280, height: Number(process.env.WYS) || 720, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 990, x: 40, y: 16, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    // 1. the cells
    const cells = await t.json("RegionLayers.backCells()");
    const have = new Set(cells.map(c => c.join(",")));
    t.check("Map990: 12 kratek gracza na środkowym wzgórzu są kratkami za wzgórzem (inne wzgórza: tools/za_wzgorzem/maluj.py)", CELLS.every(c => have.has(c.join(","))), cells);
    // 2. the passage, cell to cell, as the engine asks it (the side of the cell left and the side of the cell entered)
    const CASES = [
        [40, 18, 2, true, "z trawy za wzgórzem w kratkę krawędzi"], [40, 19, 8, true, "z kratki krawędzi z powrotem do tyłu"],
        [40, 19, 2, false, "z kratki krawędzi na szczyt"], [40, 20, 8, false, "ze szczytu w kratkę krawędzi"],
        [39, 19, 6, true, "wzdłuż krawędzi w prawo"], [41, 19, 4, true, "wzdłuż krawędzi w lewo"],
        [37, 19, 4, true, "z lewego rogu w lewo na trawę"], [36, 19, 6, true, "z trawy w lewy róg"],
        [43, 19, 6, true, "z prawego rogu w prawo na trawę"], [44, 19, 2, true, "z trawy w kratkę schodka"],
        [44, 20, 4, false, "ze schodka w lewo na szczyt"], [43, 20, 6, false, "ze szczytu w prawo na schodek"],
        [44, 20, 2, false, "ze schodka w dół na szczyt"], [44, 21, 8, false, "ze szczytu w górę na schodek"],
        [44, 20, 6, true, "ze schodka w prawo na trawę"], [45, 20, 2, true, "z trawy w dolny rząd"],
        [45, 21, 4, false, "z dolnego rzędu w lewo na szczyt"], [46, 21, 2, false, "z dolnego rzędu w dół na szczyt"],
        [47, 21, 6, true, "z dolnego rzędu w prawo na trawę"], [35, 22, 6, true, "z trawy w lewe wcięcie"],
        [36, 21, 2, true, "z trawy w lewe wcięcie od góry"], [36, 22, 6, false, "z wcięcia w prawo na szczyt"],
        [36, 22, 2, false, "z wcięcia w dół na szczyt"], [36, 20, 6, false, "lewy bok (bez regionu): z trawy na bok nie"],
        [37, 20, 4, false, "lewy bok: ze szczytu w lewo nie"]
    ];
    const res = await t.json(`(${JSON.stringify(CASES)}).map(([x, y, d, want]) => { const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
        const got = $gameMap.isPassable(x, y, d) && $gameMap.isPassable(x2, y2, 10 - d); return got === want ? 0 : [x, y, d, got]; })`);
    CASES.forEach((c, i) => t.check("przejście: " + c[4] + (c[3] ? "" : " (zamknięte)"), res[i] === 0, res[i]));
    // 3. the floods: from behind the hill no way onto its top, from the top none down behind it (the hill has no stairs)
    const flood = (x, y) => t.json(`(() => { const seen = new Set([${x} * 1000 + ${y}]), q = [[${x}, ${y}]];
        while (q.length) { const [cx, cy] = q.pop(); for (const d of [2, 4, 6, 8]) { const nx = $gameMap.roundXWithDirection(cx, d), ny = $gameMap.roundYWithDirection(cy, d);
            if (nx < 28 || nx > 58 || ny < 12 || ny > 34 || seen.has(nx * 1000 + ny)) continue;
            if ($gameMap.isPassable(cx, cy, d) && $gameMap.isPassable(nx, ny, 10 - d)) { seen.add(nx * 1000 + ny); q.push([nx, ny]); } } }
        return Array.from(seen); })()`);
    const out = new Set(await flood(40, 16)), top = new Set(await flood(40, 22));
    const k = (x, y) => x * 1000 + y;
    t.check("z tyłu dochodzi się do wszystkich 12 kratek krawędzi", CELLS.every(([x, y]) => out.has(k(x, y))), CELLS.filter(([x, y]) => !out.has(k(x, y))));
    t.check("z tyłu nie da się wejść na szczyt (żadna kratka szczytu w zasięgu)", !out.has(k(40, 22)) && !out.has(k(40, 20)) && !out.has(k(43, 20)), { size: out.size });
    t.check("ze szczytu nie da się zejść za wzgórze ani w kratki krawędzi", !top.has(k(40, 16)) && CELLS.every(([x, y]) => !top.has(k(x, y))) && !top.has(k(35, 22)), { size: top.size });
    // 4. walking (FreeMovement, pixel by pixel) - the keys held as the player holds them
    const HOLD = async (keys, frames) => { await t.eval(`window.__k = ${JSON.stringify(keys)}; window.__iv = setInterval(() => { for (const k of ["left","right","up","down"]) Input._currentState[k] = window.__k.includes(k); }, 4); 0`); await t.frames(frames); await t.eval("clearInterval(window.__iv); for (const k of ['left','right','up','down']) Input._currentState[k] = false; 0"); };
    const put = (x, y, dir) => t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${dir}); $gamePlayer.center(${x}, ${y}); 0`);
    const state = () => t.json(`(() => { const P = $gamePlayer, ss = SceneManager._scene._spriteset, sp = ss._characterSprites.find(s => s._character === P);
        return { x: +P._realX.toFixed(3), y: +P._realY.toFixed(3), row: RegionLayers.behindRow(P), masked: !!sp.mask, shadow: !!((sp._groundShadow && sp._groundShadow.visible) || (sp._sunShadow && sp._sunShadow.visible)) }; })()`);
    await put(40, 17, 2); await t.frames(20);
    await HOLD(["down"], 50); await t.frames(6);
    let s = await state();
    t.check("z tyłu w dół: wchodzi w kratkę krawędzi i staje na jej dole (cała kratka nad nim)", Math.abs(s.y - 19) < 0.01 && s.row === 19, s);
    t.check("za krawędzią: postać zamaskowana, cieni nie ma", s.masked && !s.shadow, s);
    if (SHOTS) await t.shot(SHOTS + "/1_za_krawedzia.png");
    await HOLD(["down"], 30); s = await state();
    t.check("dalej w dół: na szczyt nie wejdzie", Math.abs(s.y - 19) < 0.01, s);
    // along the edge to the right, the right key alone: never leaves the row while behind it, masked all the way to the corner
    const walk = [];
    for (let i = 0; i < 40; i++) { await HOLD(["right"], 3); walk.push(await state()); }
    const inRow = walk.filter(w => w.x <= 43.2);
    t.check("w prawo wzdłuż krawędzi: ciągle w rzędzie, ciągle zamaskowana", inRow.length > 5 && inRow.every(w => Math.abs(w.y - 19) < 0.01 && w.row === 19 && w.masked && !w.shadow), inRow.filter(w => !(w.row === 19 && w.masked)).slice(0, 4));
    t.check("za prawym rogiem wychodzi na trawę i jest cała widoczna", walk.some(w => w.x >= 44 && w.row === -1 && !w.masked), walk.slice(-3));
    // the step and the lower row: down into the step cell, right, down into the lower row
    await put(44, 19, 2); await t.frames(10);
    await HOLD(["down"], 30); s = await state();
    t.check("schodek: z trawy w dół wchodzi w kratkę schodka, zamaskowana", Math.abs(s.y - 20) < 0.01 && s.row === 20 && s.masked, s);
    if (SHOTS) await t.shot(SHOTS + "/2_schodek.png");
    await HOLD(["left"], 30); s = await state();
    t.check("ze schodka w lewo na szczyt nie wejdzie", s.x > 43.5 && s.row === 20, s);
    await put(45, 20, 2); await t.frames(10);
    await HOLD(["down"], 30); s = await state();
    t.check("dolny rząd: z trawy w dół wchodzi, zamaskowana", Math.abs(s.y - 21) < 0.01 && s.row === 21 && s.masked, s);
    if (SHOTS) await t.shot(SHOTS + "/3_dolny_rzad.png");
    await HOLD(["left"], 40); s = await state();
    t.check("z dolnego rzędu w lewo na szczyt nie wejdzie", s.x > 44.5 && s.row === 21, s);
    await put(35, 22, 6); await t.frames(10);
    await HOLD(["right"], 30); s = await state();
    t.check("lewe wcięcie: z trawy w prawo wchodzi, zamaskowana, dalej na szczyt nie", s.row === 22 && s.masked && s.x < 36.6, s);
    if (SHOTS) await t.shot(SHOTS + "/4_wciecie.png");
    // from the top towards the back edge: stops before it, drawn whole
    await put(40, 22, 8); await t.frames(10);
    await HOLD(["up"], 60); s = await state();
    t.check("ze szczytu w górę: podchodzi pod krawędź (stopy na szczycie), cała widoczna", s.y >= 19.49 && s.row === -1 && !s.masked, s);
    // the sides of the top (no region): from the top no way down over them (FreeMovement asks the rim it leaves too)
    // (the feet's box, 27 px, stays in the rim's tile: 37 on the left, 47 on the right - the figure itself may reach a little over)
    for (const [x, y, key, ok, name] of [[38, 21, "left", e => e[0] >= 36.74, "w lewo przez lewy bok"], [44, 22, "right", e => e[0] <= 47.25 && e[0] >= 47, "w prawo przez prawy bok"], [38, 20, "up", e => e[1] >= 19.49, "w górę przez tylną krawędź"]]) {
        await put(x, y, 2); await t.frames(6); await HOLD([key], 120);
        const e = await t.json("[$gamePlayer._realX, $gamePlayer._realY]");
        t.check("ze szczytu " + name + " nie schodzi", ok(e), e);
    }
    // diagonals at the step's corners (FreeMovement's slides): from behind never onto the top, from the top never behind
    const diag = [[43, 19, ["down", "right"]], [44, 19, ["down", "left"]], [44, 20, ["down", "left"]], [45, 20, ["down", "left"]], [37, 19, ["down", "left"]], [36, 21, ["down", "right"]], [43, 21, ["up", "right"]], [44, 22, ["up", "right"]], [37, 21, ["up", "left"]], [38, 20, ["up", "left"]]];
    const bad = [];
    for (const [x, y, keys] of diag) {
        await put(x, y, 2); await t.frames(6);
        const startTop = top.has(k(x, y));
        await HOLD(keys, 45);
        const e = await t.json("[Math.round($gamePlayer._realX), Math.round($gamePlayer._realY), $gamePlayer._realX, $gamePlayer._realY]");
        const endTop = top.has(k(e[0], e[1]));
        if (startTop !== endTop) bad.push({ from: [x, y], keys, to: e });
    }
    t.check("ukosy przy rogach i schodku: nikt nie przechodzi między szczytem a tyłem", bad.length === 0, bad);
    // 5. the mask hides only the hero, in the cells of its row: there the screen is the world without him; above the edge his head shows
    await put(40, 18, 2); await t.frames(6); await HOLD(["down"], 40); await t.frames(4);
    const px = await t.json(`(() => { const app = Graphics._app, r = app.renderer, ss = SceneManager._scene._spriteset, P = $gamePlayer, sp = ss._characterSprites.find(s => s._character === P);
        r.render(app.stage); const a = r.extract.pixels(); const v = sp.visible; sp.visible = false; r.render(app.stage); const b = r.extract.pixels(); sp.visible = v;
        const ox = Math.ceil($gameMap.displayX() * 48), oy = Math.ceil($gameMap.displayY() * 48), rw = Math.floor(r.width), rh = Math.floor(r.height);
        const at = (arr, x, y) => { const q = ((rh - 1 - y) * rw + x) * 4; return [arr[q], arr[q + 1], arr[q + 2]]; };
        let cellDiff = 0, headDiff = 0;
        for (let cx = 39; cx <= 41; cx++) for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) { const x = cx * 48 - ox + i, y = 19 * 48 - oy + j; if (x < 0 || y < 0 || x >= rw || y >= rh) continue; const p = at(a, x, y), q = at(b, x, y); if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2]) cellDiff++; }
        for (let j = 1; j <= 30; j++) for (let i = 0; i < 48; i++) { const x = 40 * 48 - ox + i, y = 19 * 48 - oy - j; if (x < 0 || y < 0 || x >= rw || y >= rh) continue; const p = at(a, x, y), q = at(b, x, y); if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2]) headDiff++; }
        return { cellDiff, headDiff }; })()`);
    t.check("w kratkach krawędzi ekran = świat bez postaci (nic z niej, nic dorysowanego)", px.cellDiff === 0, px);
    t.check("nad krawędzią widać jej głowę", px.headDiff > 150, px);
    // 6. the mask goes when the hero walks out behind (up) - no white of a mask left on the map
    await HOLD(["up"], 30); s = await state();
    t.check("z powrotem do tyłu: bez maski, z cieniem", s.row === -1 && !s.masked, s);
    const white = await t.json("SceneManager._scene._spriteset._tilemap.children.filter(c => c instanceof PIXI.Graphics && c._row !== undefined && c.renderable).length");
    t.check("żadna maska nie rysuje się na mapie", white === 0, white);
    // 7. cost: the hook on a map with back cells and on one without (CPU 4x), per frame
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const cost = await t.json(`(() => { const ss = SceneManager._scene._spriteset; for (let i = 0; i < 50; i++) ss.updateBehindHill();
        const t0 = performance.now(); for (let i = 0; i < 400; i++) ss.updateBehindHill(); const a = (performance.now() - t0) / 400;
        const t1 = performance.now(); for (let i = 0; i < 4000; i++) $gameMap.checkPassage(40, 20, 8); return { frame: a, passage: (performance.now() - t1) / 4000 }; })()`);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   koszt (CPU 4x): maski na klatkę " + cost.frame.toFixed(4) + " ms, checkPassage " + (cost.passage * 1000).toFixed(2) + " µs");
    t.check("koszt masek na klatkę <= 0,1 ms (CPU 4x)", cost.frame <= 0.1, cost);
});
