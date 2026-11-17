// Schody tawerny (gracz 2026-11-16): nad każdym biegiem napis ze strzałką, zamiast złotej kraty odźwierny, pełne balustrady.
//   - napisy: parter 2, piętro I 4, piętro II 2 - właściwy obrazek nad właściwym biegiem;
//   - bez sławy: w górę zatrzymuje zapora odźwiernego, w dół (na parter) droga wolna;
//   - ze sławą 80: w górę droga wolna, odźwierny dalej stoi;
//   - balustrady stoją przy każdym biegu po obu stronach i nie da się przez nie przejść.
const kit = require("./lib/kit.js");
const OUT = process.env.SCHODY_SHOT || "";

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const hold = async (dir, n) => { await t.eval(`Input._currentState.${dir} = true; 0`); await t.frames(n); await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(5); };
    const upTo = async map => { await t.eval("Input._currentState.up = true; 0"); for (let i = 0; i < 70 && (await J("$gameMap.mapId()")) !== map; i++) await t.frames(5); await t.eval("Input._currentState.up = false; 0"); await t.frames(40); };
    const pic = "(x, y) => ($gameMap.eventsXy(x, y).map(e => e.characterName()).find(n => /Schody_/.test(n)) || '')";
    t.check("nowa gra", await t.newGame());
    await t.go(1, 14, 38, 8); await t.frames(20);
    t.check("parter: nad oboma biegami „PIĘTRO I ↑”", await J(`[2, 26].every(x => (${pic})(x, 33) === "!$1_Schody_Pietro1_Gora")`));
    await t.go(26, 14, 37, 8); await t.frames(20);
    t.check("piętro II: nad oboma biegami „PIĘTRO I ↓”, cztery balustrady", await J(`$gameMap.events().filter(e => /Balustrada/.test(e.characterName())).length === 4 && [6, 30].every(x => (${pic})(x, 33) === "!$1_Schody_Pietro1_Dol")`));
    await t.go(25, 6, 40, 8); await t.frames(30);
    t.check("piętro I: „PARTER ↓” nad biegami w dół, „PIĘTRO II ↑” nad biegami w górę",
        await J(`[2, 26].every(x => (${pic})(x, 33) === "!$1_Schody_Parter_Dol") && [6, 30].every(x => (${pic})(x, 33) === "!$1_Schody_Pietro2_Gora")`));
    t.check("złotej kraty nie ma, przy obu biegach w górę stoi odźwierny",
        await J(`!$gameMap.events().some(e => /Gate/.test(e.characterName())) && [7, 31].every(x => $gameMap.eventsXy(x, 37).some(e => /Npc_/.test(e.characterName())))`));
    t.check("sześć balustrad", await J(`$gameMap.events().filter(e => /Balustrada/.test(e.characterName())).length`) === 6);
    if (OUT) { await t.eval("$gamePlayer.locate(4, 40); 0"); await t.frames(40); await t.shot(OUT + "_1.png"); await t.eval("$gamePlayer.locate(6, 40); 0"); }
    await hold("up", 260);
    const stop = await J("({ map: $gameMap.mapId(), y: $gamePlayer._realY, busy: $gameMap.isEventRunning() || $gameMessage.isBusy() })");
    t.check("bez sławy: odźwierny nie wpuszcza na górę (bohater staje pod zaporą)", stop.map === 25 && stop.y > 37.2, stop);
    if (OUT) await t.shot(OUT + "_2.png");
    for (let i = 0; i < 8 && await J("$gameMap.isEventRunning() || $gameMessage.isBusy()"); i++) { await t.press("ok"); await t.frames(20); }
    // down: free for everyone
    await t.eval("$gamePlayer.locate(2, 40); 0"); await t.frames(10);
    await hold("up", 330);
    t.check("w dół na parter droga wolna dla każdego", await J("$gameMap.mapId()") === 1, await J("({ map: $gameMap.mapId(), y: $gamePlayer._realY })"));
    // the balustrade: no way through it sideways
    await t.go(25, 9, 38, 4); await t.frames(20);
    await hold("left", 120);
    t.check("przez balustradę z boku nie da się wejść na schody", await J("$gamePlayer._realX") > 8.2, await J("$gamePlayer._realX"));
    // with the reputation: up
    await t.eval("(function(){ if (window.QuestBoard && QuestBoard.addReputation) QuestBoard.addReputation(200); else if (window.TavernLife && TavernLife.addGatePass) TavernLife.addGatePass(() => true); return 0; })()");
    await t.go(25, 6, 40, 8); await t.frames(90);
    for (let i = 0; i < 8 && await J("$gameMap.isEventRunning() || $gameMessage.isBusy()"); i++) { await t.press("ok"); await t.frames(20); }
    await upTo(26);
    t.check("ze sławą: odźwierny wpuszcza - bohater wchodzi na piętro II", await J("$gameMap.mapId() === 26 && $gamePlayer.x === 6 && $gamePlayer.y === 35 && $gamePlayer.direction() === 2"), await J("({ map: $gameMap.mapId(), y: $gamePlayer._realY, rep: window.QuestBoard && QuestBoard.reputation ? QuestBoard.reputation() : null })"));
    // floor II: down again by the flight he came up
    await upTo(25);
    t.check("z piętra II schodami w dół wraca się na piętro I na górę biegu (6,35), a bez sławy i tak schodzi obok odźwiernego", await J("$gameMap.mapId() === 25 && $gamePlayer.x === 6 && $gamePlayer.y === 35"), await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]"));
    if (OUT) { await t.go(26, 6, 40, 8); await t.frames(40); await t.shot(OUT + "_3.png"); await t.go(26, 40, 36, 8); await t.frames(40); await t.shot(OUT + "_4.png"); await t.go(26, 15, 8, 8); await t.frames(40); await t.shot(OUT + "_5.png"); }
});
