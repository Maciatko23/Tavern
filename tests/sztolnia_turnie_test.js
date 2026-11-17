// Nowy świat (2026-11-15): Sztolnia Kruczych Turni (Map225, 80 x 80) - wejście z gór, jazda wagonikiem ze stacji A na stację B, rozjazd do
// komory rudy, ukryte przejścia za rumowiskiem (do „Starej jaskini”, do schowka kopaczy, do obozu kopaczy).
const kit = require("./lib/kit.js");
const path = require("path");
const SHOTS = process.env.SHOTS || "";
kit.test({ port: Number(process.env.CDP_PORT) || 9396, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 222, x: 40, y: 16, day: 5, hour: 12, quiet: true, minimap: false });
    await t.eval(`(function(){ const e = $gameMap.events().find(e => /<Town:door=kopalnia>/.test(e.event().note)); $gamePlayer.locate(e.x, e.y + 1); $gamePlayer.setDirection(8); e.start(); return 0; })()`);
    const inn = await t.until(t.onMap(225), 20);
    await t.frames(40);
    const a = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $dataMap.width, $dataMap.height]");
    t.check("drzwi „Kopalnia” w Kruczych Turniach prowadzą do sztolni (80 x 80), na próg sali załadunkowej", inn && a[1] === 40 && a[2] === 76 && a[3] === 80 && a[4] === 80, a);
    if (SHOTS) { await t.eval("$gamePlayer.center(40, 71); 0"); await t.frames(20); await t.shot(path.join(SHOTS, "sztolnia_stacjaA.png")); }
    // the ride A -> B on the main line
    const model = await t.json("(function(){ const m = Kopalnia.model(); return m ? { stops: Object.keys(m.stops || m.exits || {}), ok: true } : null; })()");
    t.check("Kopalnia.js zna tory tej mapy", !!model && model.ok, model);
    await t.eval(`(function(){ const e = $gameMap.events().find(e => /<KopWagon:A>/.test(e.event().note)); $gamePlayer.locate(e.x, e.y + 1); $gamePlayer.setDirection(8); Kopalnia.ride("A", "B"); return 0; })()`);
    await t.frames(30);
    const riding = await t.json("Kopalnia.riding()");
    if (SHOTS) { await t.frames(240); await t.shot(path.join(SHOTS, "sztolnia_jazda.png")); }
    const arrived = await t.until("!Kopalnia.riding()", 90);
    await t.frames(30);
    const b = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("jazda wagonikiem ze stacji A na stację B: bohater wysiada przy peronie B (28,11)", riding && arrived && b[0] === 28 && b[1] === 11, { riding, arrived, b });
    // the hidden ways: shut until the rubble is cleared
    const shut = await t.json("[[57, 9], [71, 60], [21, 43]].map(([x, y]) => $gameMap.eventsXyNt(x, y).some(e => e.event().name === 'Rumowisko' && e.isNormalPriority()))");
    await t.eval("$gameMap.events().filter(e => e.event().name === 'Rumowisko' && e.x >= 56 && e.x <= 58).forEach(e => { $gamePlayer.locate(e.x, e.y + 1); e.start(); }); 0");
    await t.frames(60);
    const open = await t.json("[56, 57, 58].map(x => $gameMap.eventsXyNt(x, 9).length)");
    t.check("trzy ukryte przejścia zamknięte rumowiskiem; po odwaleniu kamieni droga do starego chodnika wolna", shut.every(Boolean) && open.every(n => n === 0), { shut, open });
    await t.eval("$gamePlayer.locate(57, 6); $gamePlayer.setDirection(8); 0");
    await t.eval("window.__k = setInterval(() => { Input._currentState.up = true; }, 5); 0"); await t.until(t.onMap(222), 15); await t.eval("clearInterval(window.__k); Input._currentState.up = false; 0");
    await t.frames(30);
    const c = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
    t.check("stary chodnik wychodzi w Kruczych Turniach przy „Starej jaskini” (57,13)", c[0] === 222 && c[1] === 57 && c[2] === 13, c);
});
