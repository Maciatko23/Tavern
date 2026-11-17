// The beach overlay (Plaza.js, 2026-11-13): sand at the waterline of the coast maps 219 (Wybrzeże) and 125 (Przystań), worked out from the
// live map data. This test loads both maps at a few shore spots and checks that the overlay is there (pieces baked, painted pixels), that
// nothing is painted over a pier, that there are no console errors, and that the overlay costs next to nothing (a frame at 4x slower CPU,
// the overlay off and on, walking and standing; the update of the layer at rest; the bake of a piece). It saves the SAME spots with the
// overlay off and on to docs/plaza/*.png (before / after). CDP_PORT=9441 node tests/plaza_test.js
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "plaza");
fs.mkdirSync(OUT, { recursive: true });

const THROTTLE = 4, FRAMES = 150, RUNS = 4;
// budgets (ms): what the overlay may add to a frame at 4x slower CPU (the layer does nothing at rest; walking it bakes a piece every
// other frame at the most as the screen's edge comes near), what one piece costs at normal speed, the layer's update at rest
const BUDGET = { stand: 0.6, walk: 1.5, piece: 8, updateRest: 0.03 };

// [map, x, y, name]: the hero stands there, the screen is centred on him
const SPOTS = [
    [219, 24, 45, "219_pomost"],
    [219, 22, 38, "219_jezyk_piasku_pod_wrakiem"],
    [219, 32, 46, "219_ujscie_suchej_rzeki"],
    [219, 19, 23, "219_przyladek_latarni"],
    [219, 30, 57, "219_zatoka_poludnie"],
    [219, 20, 60, "219_klify_i_zatoczka"],
    [125, 20, 26, "125_molo"],
    [125, 20, 45, "125_brzeg_zachod"],
    [125, 60, 97, "125_brzeg_poludnie"],
    [125, 24, 12, "125_nabrzeze_polnoc"],
];

// one frame's update + drawing, measured on the page (walk: the hero walks right and left, the map scrolls)
const MEASURE = (n, walk) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a]); u = 0; ups = 0; step();
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2) })); };
})`;
// the update of the beach layer alone, over n frames (ms per frame)
const UPDATE_COST = n => `new Promise(res => {
    const P = Plaza.Sprite_Plaza.prototype, u0 = P.update; let t = 0, c = 0;
    P.update = function() { const a = performance.now(); u0.apply(this, arguments); t += performance.now() - a; c++; };
    const t0 = Graphics.frameCount, iv = setInterval(() => { if (Graphics.frameCount - t0 < ${n}) return; clearInterval(iv); P.update = u0; res(JSON.stringify({ ms: t / Math.max(1, c), frames: c })); }, 20);
})`;

// Plaza.js is off on the game's plugin list until it is reviewed: the test switches it on in the page (before the game reads the list)
const ENABLE = `(function(){ let real; const on = v => { for (const p of v) if (p.name === "Plaza") p.status = true; return v; };
    const d = Object.getOwnPropertyDescriptor(window, "$plugins");
    if (d && d.set) { const set = d.set; Object.defineProperty(window, "$plugins", { configurable: true, get: d.get, set(v) { set.call(window, on(v)); } }); }
    else Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) { real = on(v); } }); })();`;
kit.test({ beforeLoad: ENABLE, port: Number(process.env.CDP_PORT) || 9441, bootCheck: "the game boots", errorCheck: "no errors in the console", evalTimeout: 300000 }, async t => {
    t.check("Plaza.js is on the game's plugin list", await t.eval("!!window.Plaza"));
    const setOn = on => t.eval(`window.PLAZA = ${on ? "{ on: true }" : "{ off: true }"}; 0`);
    const stats = () => t.json("Plaza.stats()");
    const at = async (x, y) => { await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.center(${x}, ${y}); 0`); await t.frames(12); };
    const shotPair = async (name, x, y) => {
        await setOn(false);
        await at(x, y);
        await t.frames(20);
        await t.shot(path.join(OUT, name + "_bez.png"));
        await setOn(true);
        await t.frames(4);
        await t.until("Plaza.settle()", 15, 100);
        await t.frames(8);
        await t.shot(path.join(OUT, name + "_z_plaza.png"));
    };

    let cur = 0;
    for (const [map, x, y, name] of SPOTS) {
        if (map !== cur) {
            await t.newGame({ map, x, y, day: 12, hour: 11, quiet: true, minimap: false });
            await t.frames(120);
            cur = map;
            const z = await t.json(`(function(){ const s = SceneManager._scene._spriteset; return { plaza: s._plaza.z, laka: s._laka ? s._laka.z : null, plazaIn: s._plaza.parent === s._tilemap }; })()`);
            t.check("map " + map + ": the beach layer lies in the tilemap, over the ground (z 0.86) and under the soil, the things lying about and the characters (z >= 1)", z.plazaIn && z.plaza > 0.8 && z.plaza < 1, z);
        }
        await shotPair(name, x, y);
        const s = await stats();
        t.check(name + ": the sand is there (pieces baked and kept)", s.pieces > 0, s);
        console.log("   " + name, JSON.stringify(s));
    }

    // ---- the new world's sea is clean (Map219: no red bloom, no grey, no dead fish, even when the drought is forced), the old harbour's is not
    await t.go(219, 24, 30, 2);
    await t.frames(60);
    await t.eval("CzerwonaWoda.force('red'); 0");
    const clean = await t.json("({ red: CzerwonaWoda.isRed(), phase: CzerwonaWoda.phase(), fish: CzerwonaWoda.deadFish().length, strip: CzerwonaWoda.shoreStrip() })");
    t.check("219: the sea is clean in the forced drought (isRed false, no dead fish) and has the rounded shore band", clean.red === false && clean.phase.clean === true && clean.fish === 0 && clean.strip === true, clean);
    await t.eval("Plaza.redo(); 0"); await t.until("Plaza.settle()", 15, 100); await t.frames(20);
    await t.shot(path.join(OUT, "219_morze_susza_czyste.png"));
    await t.go(125, 20, 45, 2);
    await t.frames(60);
    const old = await t.json("({ red: CzerwonaWoda.isRed(), phase: CzerwonaWoda.phase() })");
    t.check("125: the old harbour's sea is still red in the forced drought", old.red === true, old);
    await t.eval("CzerwonaWoda.force(null); 0");

    // ---- nothing painted over the pier's planks (219: the pier is A2 wood-plank tiles on layer 0), and no seams between the pieces
    await t.go(219, 24, 47, 2);
    await t.frames(60);
    await setOn(true);
    await at(24, 47);
    await t.until("Plaza.settle()", 15, 100);
    const pier = await t.json(`(function(){
        const sp = SceneManager._scene._spriteset._plaza, out = { planks: 0, planksInHeld: 0, painted: 0, sand: 0 };
        const W = $dataMap.width, N = W * $dataMap.height, imgs = new Map();
        const img = (cx, cy) => { const k = cy * 1000 + cx; if (!imgs.has(k)) { const p = sp._pieces.get(k); imgs.set(k, p && p.bm ? p.bm.context.getImageData(0, 0, 192, 192).data : (p ? null : undefined)); } return imgs.get(k); };
        for (let cy = 0; cy < $dataMap.height; cy++) for (let cx = 0; cx < W; cx++) {
            const b = $dataMap.data[cy * W + cx];   // (the pier is plank tiles of the A2 sheet's wood kind (3632-3679) on layer 0)
            if (!(b >= 3632 && b < 3680 && cy >= 44 && cy <= 52)) continue;
            for (const [fx, fy] of [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]]) {
                const px = Math.floor((cx + fx) * 48), py = Math.floor((cy + fy) * 48), d = img(Math.floor(px / 192), Math.floor(py / 192));
                out.planks++;
                if (d === undefined) continue;   // (a piece not held: off the screen)
                out.planksInHeld++;
                if (d && d[(((py % 192) * 192) + (px % 192)) * 4 + 3] > 8) out.painted++;
            }
        }
        for (const d of imgs.values()) if (d) for (let i = 3; i < d.length; i += 4 * 17) if (d[i] > 200) out.sand++;
        return out; })()`);
    t.check("219: no sand over the pier's planks (the middle of every plank cell the screen holds is untouched)", pier.planksInHeld > 30 && pier.painted === 0, pier);
    t.check("219: sand pixels are there (opaque pixels in the baked pieces)", pier.sand > 300, pier);
    const seam = await t.json(`(function(){
        const sp = SceneManager._scene._spriteset._plaza, imgs = new Map();
        const img = k => { if (!imgs.has(k)) { const p = sp._pieces.get(k); imgs.set(k, p && p.bm ? p.bm.context.getImageData(0, 0, 192, 192).data : null); } return imgs.get(k); };
        const diff = (a, ia, b, ib) => { let s = 0, n = 0; for (let t = 0; t < 192; t++) { const oa = ia(t) * 4, ob = ib(t) * 4; if (a[oa + 3] > 220 && b[ob + 3] > 220) { s += Math.abs(a[oa] - b[ob]) + Math.abs(a[oa + 1] - b[ob + 1]) + Math.abs(a[oa + 2] - b[ob + 2]); n++; } } return n > 30 ? s / n / 3 : null; };
        const seams = [], inner = [];
        for (const [k, p] of sp._pieces) {
            if (!p.bm) continue;
            const a = img(k), down = img(k + 1000), right = img(k + 1);
            if (down) { const d = diff(a, t => 191 * 192 + t, down, t => t); if (d !== null) seams.push(d); const e = diff(a, t => 190 * 192 + t, a, t => 191 * 192 + t); if (e !== null) inner.push(e); }
            if (right) { const d = diff(a, t => t * 192 + 191, right, t => t * 192); if (d !== null) seams.push(d); const e = diff(a, t => t * 192 + 190, a, t => t * 192 + 191); if (e !== null) inner.push(e); }
        }
        const mean = v => v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
        return { seams: seams.length, seamMean: +mean(seams).toFixed(2), seamMax: +Math.max(0, ...seams).toFixed(2), innerMean: +mean(inner).toFixed(2) }; })()`);
    t.check("219: no seams between the pieces (the colour step across a piece's border is no bigger than the grain between two pixels inside one)", seam.seams > 3 && seam.seamMean < seam.innerMean * 1.35 + 1, seam);

    // ---- the cost: a frame at 4x slower CPU, the overlay off and on, interleaved, best of RUNS
    const perf = {};
    for (const [map, x, y, label] of [[219, 24, 40, "219"], [125, 20, 45, "125"]]) {
        await t.go(map, x, y, 2);
        await t.frames(90);
        await at(x, y);
        await setOn(true);
        await t.eval("Plaza.redo(); Plaza.resetStats(); 0"); await t.until("Plaza.settle()", 15, 100);   // (the cost of a piece at normal speed: all the screen's, from scratch)
        await t.frames(30);
        const rest = JSON.parse(await t.eval(UPDATE_COST(120)));
        const bake = await stats();
        t.check(label + ": the layer's update at rest costs under " + BUDGET.updateRest + " ms a frame (nothing is worked out while the camera is still)", rest.ms < BUDGET.updateRest, rest);
        console.log("   " + label + " update at rest:", JSON.stringify(rest), "bake:", JSON.stringify(bake));
        t.check(label + ": a piece of the beach bakes in under " + BUDGET.piece + " ms (normal speed)", bake.msPerPiece < BUDGET.piece, bake);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        for (const walk of [false, true]) {
            const best = { off: null, on: null }, all = { off: [], on: [] };
            for (let r = 0; r < RUNS; r++) for (const on of (r % 2 ? [true, false] : [false, true])) {   // (the order swapped every round)
                await setOn(on);
                await at(x, y);
                await t.frames(on ? 10 : 4);
                if (on) await t.until("Plaza.settle()", 15, 100);
                const m = JSON.parse(await t.eval(MEASURE(FRAMES, walk), 300000));
                const k = on ? "on" : "off";
                all[k].push(m.frame);
                if (!best[k] || m.frame < best[k].frame) best[k] = m;
            }
            const med = a => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)];
            const d = +(best.on.frame - best.off.frame).toFixed(2), dm = +(med(all.on) - med(all.off)).toFixed(2);
            perf[label + (walk ? " walking" : " standing")] = { off: best.off.frame, on: best.on.frame, delta: d, medianOff: med(all.off), medianOn: med(all.on), medianDelta: dm, runs: all };
            console.log("   " + label + (walk ? " WALKING" : " STANDING") + " (CPU " + THROTTLE + "x slower, ms a frame): best off " + best.off.frame + " on " + best.on.frame + " delta " + d + " | median off " + med(all.off) + " on " + med(all.on) + " delta " + dm);
            t.check(label + " " + (walk ? "walking" : "standing") + ": the beach adds under " + (walk ? BUDGET.walk : BUDGET.stand) + " ms a frame at 4x slower CPU", d < (walk ? BUDGET.walk : BUDGET.stand), best);
        }
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    }
    console.log("   PERF", JSON.stringify(perf));
    fs.writeFileSync(path.join(OUT, "wydajnosc.json"), JSON.stringify(perf, null, 2) + "\n");
});
