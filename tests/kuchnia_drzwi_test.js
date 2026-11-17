// Kuchnia tawerny ma prawdziwe wejście (2026-11-16): drzwi na zaplecze za ladą <-> wycieraczka w dolnej ścianie kuchni.
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const hold = async (dir, n) => { await t.eval(`Input._currentState.${dir} = true; 0`); await t.frames(n); await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(40); };
    t.check("nowa gra", await t.newGame());
    await t.setHour(3);   // (the waitress asleep: nobody in the doorway)
    await t.go(1, 14, 15, 8); await t.frames(30);
    await hold("up", 80);
    t.check("drzwiami za ladą wchodzi się do kuchni (14,9)", await J("$gameMap.mapId() === 1 && $gamePlayer.x === 14 && $gamePlayer.y <= 9"), await J("[$gamePlayer.x, $gamePlayer.y]"));
    await t.eval("$gamePlayer.locate(14, 8); 0"); await t.frames(10);
    await hold("down", 110);
    t.check("wycieraczką w dolnej ścianie wychodzi się za ladę (14,14)", await J("$gamePlayer.x === 14 && $gamePlayer.y >= 14 && $gamePlayer.y <= 16"), await J("[$gamePlayer.x, $gamePlayer.y]"));
});
