// Furtki ogródków i zagród Podgrodzia (Map218): przed każdą da się stanąć, przez furtkę wchodzi się do zagrody, zwierzęta zostają na wybiegu (Ogrodki.js).
const kit = require("./lib/kit.js");
const path = require("path");
kit.test({ port: 9465, bootCheck: "boot", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 218, x: 34, y: 38, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(120);
    // every garden gate and pen gate: the hero can stand on it and step inside
    const gates = await t.json(`$gameMap.events().filter(e => /^Miejsce: [a-z_]+_(ogrodek|zagroda)$/.test(e.event().name)).map(e => [e.event().name, e.x, e.y])`);
    let bad = [];
    for (const [n, x, y] of gates) {
        const ok = await t.json(`(() => { const p = $gamePlayer; const path = p.findDirectionTo ? 1 : 0; return $gameMap.isPassable(${x}, ${y}, 2) || $gameMap.isPassable(${x}, ${y}, 8) || $gameMap.isPassable(${x}, ${y}, 4) || $gameMap.isPassable(${x}, ${y}, 6); })()`);
        if (!ok) bad.push(n);
    }
    t.check("przed każdą furtką da się stanąć (" + gates.length + ")", gates.length >= 14 && !bad.length, bad);
    // walk into a pen through its gate
    await t.eval("$gamePlayer.locate(34, 28); 0"); await t.frames(30);
    for (let i = 0; i < 40; i++) { await t.hold("right", 6); if ((await t.json("$gamePlayer.x")) >= 36) break; }
    t.check("wejście do zagrody wodziarza przez furtkę", (await t.json("$gamePlayer.x")) >= 36, await t.json("[$gamePlayer.x, $gamePlayer.y]"));
    await t.eval("$gamePlayer.center(37, 29); 0"); await t.frames(5);
    await t.shot(path.join(__dirname, "..", "docs", "NOWY_SWIAT", "zagrody", "w_zagrodzie.png"));
    // the animals stay in their runs
    await t.eval("$gamePlayer.locate(34, 38); 0");
    await t.frames(1800);
    const out = await t.json(`$gameMap.events().filter(e => /<Zagroda:/.test(e.event().note)).filter(e => { const m = /<Zagroda:[a-z_]+,([0-9]+),([0-9]+),([0-9]+),([0-9]+)>/.exec(e.event().note); return e.x < +m[1] || e.x > +m[3] || e.y < +m[2] || e.y > +m[4]; }).length`);
    t.check("zwierzęta zostają na wybiegu (30 s)", out === 0, out);
});
