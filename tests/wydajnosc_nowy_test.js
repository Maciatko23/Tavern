// The speed of the new world as on an average computer (2026-11-18, the user: "co się da, to robimy" - the old wydajnosc_test stood on
// maps removed 2026-11-17): the processor slowed down 4 times (CDP), the hero walking right and left (the map scrolls); the time of a
// frame (the game's update + the drawing, CPU side) on the heaviest places against their budgets, the images in memory, the tilemap's
// children (the fields' rows are meshes, not sprites) and their order. The machine's own load drifts ±20%: the budgets have room for it;
// a real slowdown shows over them. Measured again with: node tools/wydajnosc/pomiar.js nowy --idzie. CDP_PORT=9565.
const kit = require("./lib/kit.js");
const THROTTLE = 4, FRAMES = 200;
// [name, map, x, y, hour, budget ms (walking), extra setup]
const PLACES = [
    ["Podgrodzie, podwórko dziadka", 218, 14, 22, 12, BUDGET("dziadek", 21)],
    ["Podgrodzie, wiatrak i pole", 218, 13, 37, 8, BUDGET("wiatrak", 16)],
    ["Miasteczko w dzień", 220, 40, 40, 12, BUDGET("miasteczko", 13)],
    ["Burza na Podgrodziu", 218, 14, 22, 14, BUDGET("burza", 22), "storm"]
];
// (the budgets: what was measured 2026-11-18 after the stage of that day, walking, + ~25% for the machine's drift - a guard against a new
// slowdown; Podgrodzie walking and the storm stay over 16.7 ms = 60 frames a second on the slowed processor: the things on the screen)
function BUDGET(k, ms) { return ms; }
const near = (x, y) => `(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
    if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return [X, Y]; } } return null; })()`;
// n drawn frames, each its updates (their mean) + its drawing; walking right 90 frames, left 90, ...
const MEASURE = n => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([u, ups, performance.now() - a]); u = 0; ups = 0; step();
        if (fr.length >= ${n} + 20) { SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false; done(); } };
    function done() {
        const f = fr.slice(20), C = f.map(x => (x[1] ? x[0] / x[1] : 0) + x[2]), mean = a => a.reduce((s, v) => s + v, 0) / a.length;
        res(JSON.stringify({ frame: +mean(C).toFixed(2), p95: +C.slice().sort((a, b) => a - b)[Math.floor(C.length * 0.95)].toFixed(2) }));
    }
})`;
kit.test({ port: Number(process.env.CDP_PORT) || 9565, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    for (const [name, map, x, y, hour, budget, extra] of PLACES) {
        await t.newGame({ map, x, y, day: 40, hour, quiet: true, calm: extra !== "storm", minimap: false });
        await t.eval(near(x, y));
        await t.eval("Tawerna.time.forceSeason(1); 0");   // (summer: the grain grown, the heaviest)
        if (extra === "storm") { await t.eval("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.6); 0"); await t.frames(300); }
        await t.frames(120);
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        const m = JSON.parse(await t.eval(MEASURE(FRAMES), 240000));
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        t.check(`${name}: klatka ${m.frame} ms (p95 ${m.p95}), budżet ${budget} ms, CPU ${THROTTLE}x wolniejsze`, m.frame <= budget);
    }
    // what the map holds: the images in memory (the 8-way sheets only for the families on the map), the tilemap's children, their order
    await t.newGame({ map: 218, x: 14, y: 22, day: 40, hour: 12, quiet: true, minimap: false });
    await t.eval("Tawerna.time.forceSeason(1); 0");
    await t.frames(150);
    const mem = await t.json(`(function(){ const c = ImageManager._cache || {}; let mb = 0, a8 = 0; for (const k in c) { const b = c[k]; if (!b || !b.width) continue; mb += b.width * b.height * 4 / 1048576; if (k.indexOf("anim8") >= 0) a8++; }
        const tm = SceneManager._scene._spriteset._tilemap; let sorted = true; for (let i = 1; i < tm.children.length; i++) if (tm._compareChildOrder(tm.children[i - 1], tm.children[i]) > 0) { sorted = false; break; }
        return { mb: Math.round(mb), a8, kids: tm.children.length, sorted }; })()`);
    t.check(`obrazki w pamięci na Podgrodziu ${mem.mb} MB (arkuszy 8-kierunkowych ${mem.a8}), budżet 200 MB`, mem.mb <= 200);
    t.check(`dzieci mapy na Podgrodziu ${mem.kids} (budżet 520), w kolejności: ${mem.sorted}`, mem.kids <= 520 && mem.sorted);
});
