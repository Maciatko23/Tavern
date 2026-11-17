// Strych tawerny (gracz 2026-11-16): wejście ukryte i zamknięte - regał w bibliotece piętra II.
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    t.check("nowa gra", await t.newGame());
    await t.go(26, 24, 4, 8); await t.frames(30);
    const reg = await J("(function(){ const e = $gameMap.events().find(e => /ukryte wej/.test(e.event().name)); return e ? { id: e.eventId(), x: e.x, y: e.y } : null; })()");
    t.check("w bibliotece piętra II stoi regał z ukrytym wejściem (24,3)", !!reg && reg.x === 24 && reg.y === 3, reg);
    await t.press("ok"); await t.frames(40);
    const said = await J("$gameMessage.isBusy() || $gameMap.isEventRunning()");
    for (let i = 0; i < 6 && await J("$gameMessage.isBusy() || $gameMap.isEventRunning()"); i++) { await t.press("ok"); await t.frames(20); }
    t.check("na razie regał tylko „ani drgnie” - bohater zostaje w bibliotece", said && await J("$gameMap.mapId() === 26"), await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]"));
    await t.eval(`$gameSelfSwitches.setValue([26, ${reg ? reg.id : 0}, "D"], true); 0`); await t.frames(10);
    await t.press("ok"); await t.frames(120);
    t.check("po odkryciu przejścia (przełącznik D) regał prowadzi na strych - Map028 (24,7)", await J("$gameMap.mapId() === 28 && $gamePlayer.x === 24 && $gamePlayer.y === 7"), await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]"));
    if (process.env.STRYCH_SHOT) await t.shot(process.env.STRYCH_SHOT);
    await t.eval("Input._currentState.up = true; 0"); await t.frames(60); await t.eval("Input._currentState.up = false; 0"); await t.frames(90);
    t.check("klapą wraca się do biblioteki (24,4)", await J("$gameMap.mapId() === 26 && $gamePlayer.x === 24 && $gamePlayer.y === 4"), await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]"));
});
