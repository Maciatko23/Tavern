// Ruch swobodny przy meblach (js/plugins/FreeMovement.js, 2026-11-06): do okrągłego stolika da się podejść od góry aż do jego krawędzi (pusty brzeg kafla),
// nie da się wejść w sam stolik ani przejść przez niego; bohater stoi wtedy dalej na kratce nad stołem; z boku trochę bliżej; od dołu jak dawniej.
// Ze stagingu: GAME_OVERLAY=tools/ruch/staging GAME_OVERLAY_JS=1 CDP_PORT=9433 node tests/meble_ruch_test.js
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9433, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 25, x: 2, y: 7, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    const hold = async (key, frames) => { await t.eval(`Input._currentState.${key} = true; 0`); await t.frames(frames); await t.eval(`Input._currentState.${key} = false; 0`); await t.frames(6); };
    const pos = () => t.json(`({ rx: $gamePlayer._realX, ry: $gamePlayer._realY, x: $gamePlayer.x, y: $gamePlayer.y })`);
    // stolik: górny kafel (2,10), dolny (2,11); jego obraz zaczyna się 25 px w dół górnego kafla
    await t.eval(`$gamePlayer.locate(2, 7); 0`); await t.frames(10);
    await hold("down", 120);
    const a = await pos();
    console.log("   od góry: " + JSON.stringify(a));
    t.check("od góry dochodzi do samej krawędzi stolika (stopy w pustym brzegu jego kafla)", a.ry > 9.3 && a.ry < 9.5, a);
    t.check("...i stoi dalej na kratce nad stołem", a.x === 2 && a.y === 9, a);
    await hold("down", 60);
    const b = await pos();
    t.check("w sam stolik nie wchodzi", Math.abs(b.ry - a.ry) < 0.01, [a, b]);
    // z boku: z prawej strony stolika (górny kafel (2,10)) idzie w lewo z (4,10)
    await t.eval(`$gamePlayer.locate(4, 10); 0`); await t.frames(10);
    await hold("left", 120);
    const c = await pos();
    console.log("   z prawej: " + JSON.stringify(c));
    t.check("z boku podchodzi bliżej niż dawniej (stopy w pustym boku), ale stoi na swojej kratce", c.rx < 2.99 && c.rx > 2.5 && c.x === 3, c);
    // od dołu jak dawniej: z (2,13) w górę staje pod stołem, nie wchodzi
    await t.eval(`$gamePlayer.locate(2, 13); 0`); await t.frames(10);
    await hold("up", 120);
    const d = await pos();
    console.log("   od dołu: " + JSON.stringify(d));
    t.check("od dołu staje pod stolikiem jak dawniej (stopy to dół kratki), w niego nie wchodzi", Math.abs(d.ry - 11.5) < 0.01 && d.y === 12, d);
    // stół w sali tawerny (19,35)-(19,36), obraz od 30. piksela
    await t.go(1, 19, 32, 2); await t.frames(30);
    await hold("down", 120);
    const e = await pos();
    console.log("   sala, od góry: " + JSON.stringify(e));
    t.check("w sali też dochodzi do krawędzi stołu, stoi na kratce nad nim", e.ry > 34.3 && e.ry < 34.5 && e.y === 34, e);
    // przy ścianie i w murze nic się nie zmienia: ściana z kafli A (korytarz piętra, (30,17) pod ścianą pokoju)
    await t.go(25, 30, 18, 8); await t.frames(20);
    await hold("up", 90);
    const f = await pos();
    t.check("pod ścianą staje jak dawniej (ściany nie mają pustego brzegu)", Math.abs(f.ry - 16.5) < 0.01 && f.y === 17, f);
});
