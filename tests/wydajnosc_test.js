// The speed of the map on an average computer (2026-10-24, the player: "ma być super wydajnie na średnim kompie"; docs/WYDAJNOSC.md).
// The processor slowed down 4 times (CDP Emulation.setCPUThrottlingRate - a fast PC made a middling one): the time of a frame (the
// game's update + the drawing, CPU side) on the heavy maps under a budget below what they cost before the speed-ups - a new feature
// that makes a map much slower turns this red: make the feature faster, do not raise the budget (docs/WYDAJNOSC.md).
// And the speed-ups change nothing on the screen: one frame, frozen, drawn with Wydajnosc.js's tricks off and on - the same pixels;
// MZ's colour filters switched off at rest only by the rounding (at most 1/255, as the player agreed). CDP_PORT=9493.
"use strict";
const kit = require("./lib/kit.js");

// the budgets: ms per frame (one update + one drawing) at 4x slower CPU, the mean over FRAMES frames, the best of RUNS runs (another
// program busy beside it only makes a run slower). Measured 2026-10-24 (docs/WYDAJNOSC.md, the middle of 6 runs): Kruczy Jar
// walking 47.2 before the speed-ups -> 11.8 after, the town walking 19.3 -> 9.5, the harbour at night 16.4 -> 10.4 (this test's
// best of 3: ~12, ~8.5, ~9). A return to "before" is red on all three.
const THROTTLE = 4, FRAMES = 150, RUNS = 3;
// 2026-10-30 (the world's logic: the stone layer and the dog by the list of tiles, the ground things' layer and the dog's search by the tiles that can
// hold something, docs/wydajnosc/etap3_swiat.md): the farm (the fixture day40_farm: ~25 buildings, 17:00) walking ~51 ms before the
// speed-ups of 2026-10-24, ~17 after; the storm on Kruczy Jar walking ~47 before, ~17 after.
const BUDGET = { jar: 22, miasto: 15, przystan: 14, tawerna: 15, farma: 22, burza: 22 };

// one frame's update + drawing, measured on the page (walk: the hero walks right and left, the map scrolls - the heaviest case)
const MEASURE = (n, walk) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a, a]); u = 0; ups = 0; step();
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length, secs = (f[f.length - 1][2] - f[0][2]) / 1000;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2), fps: +((f.length - 1) / secs).toFixed(1) })); };
})`;
// the frame frozen: no clouds (they drift at random), no dust, no target marker; the clock, the counters, the swaying foliage's phases
// and Mood's look put back before each drawing; the world drawn with the given Wydajnosc.opts off, on, and off again (what differs
// between two drawings of the same anyway). The culls of the trees' strips and the shadows ask Tawerna.view.sees (follows opts.cull).
const SAME = keys => `(function(){
    const W = Wydajnosc, scene = SceneManager._scene, set = scene._spriteset, app = Graphics._app, keys = ${JSON.stringify(keys)}, saved = Object.assign({}, W.opts);
    if (set._cloudSprites) { for (const c of set._cloudSprites) if (c.parent) c.parent.removeChild(c); set._cloudSprites.length = 0; }
    if (set._dustContainer) set._dustContainer.visible = false;
    const mk = set._targetMarker, mkUpdate = mk && mk.update;
    if (mk) { mk.update = function() {}; mk.visible = false; }
    app.ticker.stop();
    const F = Graphics.frameCount, C = window.Storm && Storm.state ? Storm.state.clock : 0, A = set._tilemap.animationCount;
    const nl = set._nightLight, age0 = nl ? nl._age : 0;   // (the night layer's flicker clock: put back too, and its every-other-frame skip off)
    const sway = (set._swaySprites || []).map(s => s._phase);
    const draw = on => {
        W.stats.idleFrame = -1;
        for (const k of keys) W.opts[k] = on;
        W.settleFilters(scene);
        (set._swaySprites || []).forEach((s, i) => { s._phase = sway[i]; });
        if (window.Mood && Mood.snap) Mood.snap();
        if (nl) nl._age = age0;
        for (let i = 0; i < 4; i++) {
            Graphics.frameCount = F; if (window.Storm && Storm.state) Storm.state.clock = C; set._tilemap.animationCount = A;
            if (nl) nl._nightSig = null;
            set._darkKey = "";   // (RoomLighting's darkness repainted at every update, not kept from the other drawing)
            set.update();
        }
        W.settleFilters(scene);
        app.render();
        const trees = set._characterSprites.filter(s => s._treeBody), view = Tawerna.view.rect();
        const near = s => s.x > view.x0 && s.x < view.x1 && s.y > view.y0 && s.y < view.y1 + 48;
        return { px: app.renderer.extract.pixels(), culled: W.stats.frame === Graphics.frameCount ? W.stats.culled : 0, idle: W.stats.idleFrame === Graphics.frameCount ? W.stats.idle : 0, trees: trees.length,
            culledTrees: trees.filter(s => s._treeCulled).length, outlined: set._characterSprites.filter(s => near(s) && s._outlineSprite && s._outlineSprite._on).length };
    };
    const off = draw(false), on = draw(true), again = draw(false);
    let diff = 0, over1 = 0, over8 = 0, max = 0, noise = 0;
    for (let i = 0; i < off.px.length; i++) {
        const d = Math.abs(off.px[i] - on.px[i]);
        if (d) { diff++; if (d > 1) over1++; if (d > 8) over8++; if (d > max) max = d; }
        if (off.px[i] !== again.px[i]) noise++;
    }
    Object.assign(W.opts, saved);
    W.settleFilters(scene);
    if (mk) mk.update = mkUpdate;
    app.ticker.start();
    return { keys: keys.join(","), bytes: off.px.length, diff, over1, over8, max, noise, culled: on.culled, idle: on.idle, idleOff: off.idle, trees: on.trees, culledTrees: on.culledTrees, culledTreesOff: off.culledTrees,
        outlined: on.outlined };
})()`;
const EXACT = ["leaf", "filterArea", "cull", "lazy", "outline", "still", "dispatch"];
const LIGHT_MAX = 24, LIGHT_OVER8 = 0.0005;

kit.test({ port: 9493, lightGpu: true, bootCheck: "the game boots", errorCheck: "no errors in the console", evalTimeout: 300000 }, async t => {
    const loaded = await t.eval("!!(window.Wydajnosc && Wydajnosc.opts && Wydajnosc.settleFilters)");
    t.check("Wydajnosc.js is on the game's plugin list", loaded);
    if (!loaded) return;
    const near = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return 1; } } return 0; })()`);
    const measure = async (name, walk) => {
        await t.frames(60);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(20);
        const runs = [];
        for (let r = 0; r < RUNS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES, walk), 300000)));
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const m = runs.sort((a, b) => a.frame - b.frame)[0];
        m.runs = runs.map(r => r.frame);
        console.log("   " + name + " (" + (walk ? "walking" : "standing") + ", CPU " + THROTTLE + "x slower):", JSON.stringify(m), "budget", BUDGET[name], "ms");
        return m;
    };

    // ---- Kruczy Jar at noon: 335 trees, rocks, bushes (the heaviest map) - the same picture with the speed-ups off and on
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12, quiet: true, minimap: true });
    await t.frames(60);
    const same = await t.json(SAME(EXACT));
    console.log("   the frozen frame:", JSON.stringify(same));
    t.check("Kruczy Jar: the trees off the screen are neither laid nor drawn, the characters off it not drawn (none of it with the culls off)",
        same.culledTrees + same.idle > 20 && same.culled + same.idle > 20 && same.culledTreesOff === 0, same);   // (the settled things far off are not even culled: not updated, not drawn - opts.still)
    t.check("Kruczy Jar: the settled trees, rocks and bushes far off the screen are not updated at all (opts.still), and not with it off", same.idle > 20 && same.idleOff === 0, same);
    t.check("...and the picture is the same with every speed-up off and on (a frozen frame: no more bytes differ than between two drawings, at most 0.01%)",
        same.diff <= Math.max(same.noise, same.bytes * 0.0001), same);
    const idle = await t.json(SAME(["idleFilters"]));
    console.log("   MZ's colour filters at rest off / on:", JSON.stringify(idle));
    t.check("MZ's colour filters at rest switched off: nothing but the rounding changes (at most 1/255 a colour, besides what moves by itself)",
        idle.over1 <= Math.max(idle.noise, idle.bytes * 0.0001), idle);
    const jar = await measure("jar", true);
    t.check("Kruczy Jar, walking: a frame under " + BUDGET.jar + " ms at 4x slower CPU (before the speed-ups ~47)", jar.frame < BUDGET.jar, jar);

    // ---- the town (Map008): 570 events, residents on their rounds, roofs, lamps; people's outlines drawn without a filter of their own
    await t.go(8, 50, 53, 2);
    await near(50, 53);
    await t.frames(30);
    const town = await t.json(SAME(EXACT));
    console.log("   the town, frozen:", JSON.stringify(town));
    t.check("the town: the people on the screen have their outline as a picture under them, and the picture is the same as with the filters",
        town.outlined > 0 && town.diff <= Math.max(town.noise, town.bytes * 0.0001), town);
    const townRun = await measure("miasto", true);
    t.check("the town, walking: a frame under " + BUDGET.miasto + " ms at 4x slower CPU (before ~19)", townRun.frame < BUDGET.miasto, townRun);

    // ---- the harbour (Map125) at night: lamps, fires, the night's layer with its lights and shadows
    await t.go(125, 24, 14, 2);
    await near(24, 14);
    await t.setHour(22);
    const harbour = await measure("przystan", false);
    t.check("the harbour at night: a frame under " + BUDGET.przystan + " ms at 4x slower CPU (before ~16.5)", harbour.frame < BUDGET.przystan, harbour);
    // the night's layer on the graphics card (Wydajnosc.opts.lightGpu) against the 2D canvases, one frozen frame: the card's gradients are
    // textures scaled up, the canvas's are exact, so not the same byte - measured 2026-10-30: at most 11/255 and 0.01% of the bytes over 8
    const lightSame = async what => {
        const s = await t.json(SAME(["lightGpu"]));
        console.log("   " + what + ", the card against the canvases:", JSON.stringify(s));
        t.check(what + ": the lights on the card = the canvases to the eye (a frozen frame: no byte off by more than " + LIGHT_MAX + "/255, under " + LIGHT_OVER8 * 100 + "% of them by more than 8)",
            s.max <= LIGHT_MAX && s.over8 <= s.bytes * LIGHT_OVER8, s);
    };
    await lightSame("the harbour at night");

    // ---- the tavern's hall in the evening (2026-10-29, docs/PODROZNI.md 6.11): the regulars and a full house of the ferry's travellers
    // (four of the cast and the pool, the Company's group counts as one) - the same budget as the town
    await t.eval(`(function(){ $gameSystem._dayNightDay = 40; $gameSystem.setDayNightHour(20); for (const k of ["tobiasz", "kartograf", "grajek", "kompania"]) { try { Podroznicy.przyplyn(k); } catch (e) {} } Podroznicy.przyplyn("pula"); return 0; })()`);
    await t.go(1, 50, 34, 8);
    await near(50, 34);
    await t.setHour(20);
    await t.frames(120);
    const hall = await measure("tawerna", false);
    t.check("the tavern's hall at 20:00 with the ferry's travellers: a frame under " + BUDGET.tawerna + " ms at 4x slower CPU", hall.frame < BUDGET.tawerna, hall);
    await lightSame("the tavern's hall at 20:00 (the room's darkness and glows, people's shadows)");

    // ---- the farm (the fixture day40_farm: ~25 buildings, the dog, the ground things' layer, 17:00), walking: the ground things asked
    // for the ground things, the stone layer rebuilt only when something changed, the dog's search over the tiles that can hold something
    await t.loadFixture("day40_farm");
    await t.frames(60);
    await t.frames(30);
    const farm = await measure("farma", true);
    t.check("the farm, walking: a frame under " + BUDGET.farma + " ms at 4x slower CPU (before the speed-ups ~51)", farm.frame < BUDGET.farma, farm);

    // ---- the storm on Kruczy Jar (rain, leaves, bolts; as pomiar.js burza), walking
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 14, calm: false });
    await t.eval("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.6); 0");
    await t.frames(400);
    const storm = await measure("burza", true);
    t.check("the storm on Kruczy Jar, walking: a frame under " + BUDGET.burza + " ms at 4x slower CPU (before the speed-ups ~47)", storm.frame < BUDGET.burza, storm);
});
