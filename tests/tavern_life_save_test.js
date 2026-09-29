// TavernLife split into its parts (TavernLife.js + TavernLife_Render / _ArmWrestle / _Darts / _Plan) with an old save: the
// tavern_evening fixture (day 20, 19:00 in the tavern, reputation 60; its TavernLife state saved in $gameSystem._tavernLife) loads,
// the state is adopted into _tw.tavernLife (the old key a hidden alias), a room is rented after the load (the chamber: Borgar's 10%
// at "Pewna ręka"), its door upstairs opens, the new save keeps the rent only in the new place and loads again. Then the mini-games
// on Tawerna.ui.Scene_MiniGame: arm-wrestling's pause (P: the kit's card with the help, "Gramy dalej", "Poddaję się" -> the result
// card, the stake lost on the map) and a darts game (the turn banner, the busts in the corners, the result). No console errors.
// Screenshots: docs/architektura/tavernlife_*.png
//   CDP_PORT=9406 node tests/tavern_life_save_test.js
const path = require("path");
const kit = require("./lib/kit.js");

const PARTS = ["TavernLife_Render", "TavernLife_ArmWrestle", "TavernLife_Darts", "TavernLife_Plan"];
const SHOTS = path.join(__dirname, "..", "docs", "architektura");
const KOMNATA_DOOR = 9;   // Map025's door of the chamber (tools/tavern/links.json)

kit.test({ port: 9406, plugins: PARTS, bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    t.check("TavernLife.js and its four parts are in the page", await t.eval(`!!(window.TavernLife && ${JSON.stringify(["TavernLife"].concat(PARTS))}.every(k => TavernLife.modules[k]))`), t.plugins);
    // (a boot the busy server broke halfway - rmmz_core.js not delivered - leaves other plugins' errors behind; the kit booted again.
    // As tavern_life_test does: only what comes after the boot counts - but nothing of TavernLife may be among them)
    const bootErrs = t.errors();
    t.check("no console error of TavernLife while the game booted and its parts went in", !bootErrs.some(e => /TavernLife/.test(e)), bootErrs.filter(e => /TavernLife/.test(e)));
    if (bootErrs.length) console.log("NOTE " + bootErrs.length + " console error(s) of an interrupted boot, not counted: " + bootErrs.map(e => e.split("\n")[0].slice(0, 90)).join(" | "));
    t.clearErrors();

    // ================= the old save
    const fx = kit.fixture("tavern_evening"), raw = typeof fx.save === "string" ? JSON.parse(fx.save) : fx.save;
    t.check("tavern_evening was saved with the old key: $gameSystem._tavernLife, no _tw", !!raw.system._tavernLife && !raw.system._tw && raw.system._tavernLife.rooms === 0, raw.system._tavernLife);
    t.check("tavern_evening loads (the tavern, Map001)", await t.loadFixture("tavern_evening", { calm: true, needsOff: true }));
    await t.quiet();
    const st = await t.json(`({ inTw: !!$gameSystem._tw && $gameSystem._tw.tavernLife === TavernLife.state(), alias: $gameSystem._tavernLife === TavernLife.state(),
        hidden: !Object.keys($gameSystem).includes("_tavernLife"), v: Tawerna.state.version("tavernLife"), stats: TavernLife.stats(), map: $gameMap.mapId(), rep: TavernLife.reputation(), tier: TavernLife.repTier() })`);
    t.check("the old _tavernLife is adopted: _tw.tavernLife (version 1), the old key only a hidden alias, the numbers as saved; reputation 60 (Pewna ręka)",
        st.inTw && st.alias && st.hidden && st.v === 1 && st.stats.rooms === 0 && st.stats.arm.played === 0 && st.map === 1 && st.rep === 60 && st.tier === 3, st);

    // ================= a room rented after the load
    await t.until("TavernLife.rooms().length >= 5", 20);   // (the rooms' maps are read in the background after the map is up)
    await t.eval("window.__served = []; Tawerna.on('served', e => window.__served.push(e), { owner: 'TavernLifeSaveTest' }); 0");
    const gold0 = await t.gold();
    const rooms = await t.json("TavernLife.rooms().map(r => r.room + ':' + TavernLife.roomPrice(r.room))");
    t.check("the rooms at reputation 60: 1-3 and the chamber 10% cheaper (27 G), the Apartament Złoty", rooms.join("|") === "1:7|2:14|3:18|komnata:27|zloty:45", rooms);
    const rented = await t.eval("TavernLife.rentRoom('komnata')");
    const after = await t.json(`({ gold: $gameParty.gold(), rent: TavernLife.rentedRoom(), door: $gameSelfSwitches.value([25, ${KOMNATA_DOOR}, "A"]), served: window.__served, rooms: TavernLife.stats().rooms })`);
    t.check("the chamber rented after the load: 27 G, the rent till 10:00 tomorrow, its door on Map025 opened (self switch A), 'served' on the bus",
        rented === true && gold0 - after.gold === 27 && after.rent && after.rent.room === "komnata" && after.rent.until === 21 * 24 + 10 && after.door === true &&
        after.served.length === 1 && after.served[0].service === "room" && after.served[0].room === "komnata" && after.rooms === 1, { gold0, after });
    t.check("saved again (slot 2)", await t.saveTo(2));
    const saved = await t.json("(async function(){ const s = JSON.parse(await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(2)))).system; return { old: '_tavernLife' in s, tw: s._tw && s._tw.tavernLife, v: s._tw && s._tw._v && s._tw._v.tavernLife }; })()");
    t.check("... the new save has the rent in _tw.tavernLife (version 1) and no _tavernLife any more", !saved.old && saved.tw && saved.tw.rent && saved.tw.rent.room === "komnata" && saved.v === 1, saved);
    t.check("... and it loads again", await t.loadFrom(2, { calm: true, needsOff: true }));
    await t.quiet();
    const again = await t.json(`({ rent: TavernLife.rentedRoom(), isRented: TavernLife.isRented("komnata"), map: $gameMap.mapId(), door: $gameSelfSwitches.value([25, ${KOMNATA_DOOR}, "A"]) })`);
    t.check("... with the chamber still his for the night (its door open)", again.rent && again.rent.room === "komnata" && again.isRented && again.door === true && again.map === 1, again);

    // ================= arm-wrestling on the UI kit: the pause (P), "Gramy dalej", "Poddaję się"
    await t.gold(100);
    await t.eval("$gameSystem.setStamina(100); window.__n = 0; TavernLife.onTick = s => { const I = Input._currentState; if (s.state().phase === 'card') I.ok = ++window.__n % 8 === 0; }; 0");
    t.check("arm-wrestling opens (stake 5 G, seed 7)", await t.eval("TavernLife.armWrestle({ stake: 5, seed: 7 })"));
    const pull = await t.until("TavernLife.gameState() && TavernLife.gameState().phase === 'pull'", 30, 50);
    await t.press("cancel");   // (at once: while the card is up nothing moves, so the round cannot end before the checks)
    await t.eval("TavernLife.onTick = null; Input._currentState.ok = false; 0");
    let g = await t.json("({ s: TavernLife.gameState(), card: SceneManager._scene.card && SceneManager._scene.card.spec, scene: SceneManager._scene.constructor.name, mini: SceneManager._scene instanceof Tawerna.ui.Scene_MiniGame, running: Tawerna.ui.running === SceneManager._scene })");
    t.check("... the rules card closes with O, the round is pulled; the scene is a Tawerna.ui.Scene_MiniGame (id 'arm')", pull && g.scene === "Scene_ArmWrestle" && g.mini && g.running && g.s.id === "arm", g);
    t.check("P during the pull: the kit's pause card - 'Pauza', the help, 'Gramy dalej' / 'Poddaję się (tracisz 5 G)'", g.s.paused && g.card && g.card.title === "Pauza" &&
        g.card.options.join("|") === "Gramy dalej|Poddaję się (tracisz 5 G)" && g.card.lines.length === 2, g.card);
    await t.frames(12);
    await t.shot(path.join(SHOTS, "tavernlife_silowanie_pauza.png"));
    await t.press("ok");
    g = await t.json("({ s: TavernLife.gameState(), hints: SceneManager._scene.hints._key })");
    t.check("... O on 'Gramy dalej': back to the pull, the kit's key hints at the bottom", !g.s.paused && g.s.phase === "pull" && /SIŁY/.test(g.hints), g);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "tavernlife_silowanie.png"));
    await t.press("cancel");
    await t.press("down");
    await t.press("ok");
    g = await t.json("({ s: TavernLife.gameState() })");
    t.check("... 'Poddaję się': the result card first ('Poddałeś się'), as before", g.s.phase === "summary" && g.s.result && g.s.result.gaveUp && !g.s.result.won, g.s);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "tavernlife_silowanie_wynik.png"));
    await t.press("ok");
    const back = await t.until(t.onMap(1), 20);
    await t.frames(10);
    const armEnd = await t.json("({ gold: $gameParty.gold(), arm: TavernLife.stats().arm, last: TavernLife.lastResult, running: !!Tawerna.ui.running, pending: Tawerna.ui.pendingResults() })");
    t.check("... O: back in the tavern, the stake lost (−5 G), the game counted as lost", back && armEnd.gold === 95 && armEnd.arm.played === 1 && armEnd.arm.lost === 1 && armEnd.last.gaveUp &&
        !armEnd.running && armEnd.pending === 0, armEnd);

    // ================= darts on the UI kit: the turn banner, the busts in the corners, the result
    await t.eval(`(function(){ window.__bt = 0; window.__endOk = false; TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; const s = scene.state(); window.__bt++;
        if (s.phase === "card" || (s.phase === "summary" && window.__endOk)) { if (window.__bt % 8 === 0) I.ok = true; return; }
        if (s.phase === "pull" && s.turn === "opp" && s.round === 1) scene.turbo = 1;   // (round 2's banner at its own pace: the screenshot)
        if (s.phase === "aim" && scene.phaseT > 12 && Math.hypot(s.cross.x - s.centre.x, s.cross.y - s.centre.y) < 5) I.ok = true; }; return 0; })()`);
    t.check("darts open (Ozzy, stake 10 G, seed 21)", await t.eval("TavernLife.darts({ stake: 10, seed: 21, opponent: 'ozzy', turbo: 3 })"));
    const banner = await t.until("TavernLife.gameState() && TavernLife.gameState().phase === 'banner' && TavernLife.gameState().round === 2", 60, 50);
    await t.frames(16);
    const d0 = await t.json("({ s: TavernLife.gameState(), busts: [SceneManager._scene.bustL.name, SceneManager._scene.bustR.name, SceneManager._scene.bustL.visible, SceneManager._scene.bustR.visible, SceneManager._scene.bustL.lightTo, SceneManager._scene.bustR.lightTo] })");
    t.check("... the turn's banner (the kit's) over the board in round 2; the hero's and Ozzy's busts in the corners, the one not throwing dimmed",
        banner && d0.s.banner && /Runda 2 z 3/.test(d0.s.banner) && d0.busts[0] && d0.busts[1] && d0.busts[2] && d0.busts[3] && (d0.busts[4] === 1) !== (d0.busts[5] === 1), d0);
    await t.shot(path.join(SHOTS, "tavernlife_rzutki.png"));
    await t.eval("SceneManager._scene.turbo = 4; 0");
    const sum = await t.until("TavernLife.gameState() && TavernLife.gameState().phase === 'summary'", 90);
    await t.eval("SceneManager._scene.turbo = 1; 0");
    await t.frames(30);
    await t.shot(path.join(SHOTS, "tavernlife_rzutki_wynik.png"));
    await t.eval("window.__endOk = true; 0");
    await t.until(t.onMap(1), 30);
    await t.frames(10);
    await t.eval("TavernLife.onTick = null; 0");
    const dEnd = await t.json("({ gold: $gameParty.gold(), darts: TavernLife.stats().darts, last: TavernLife.lastResult })");
    t.check("... the game to its end, the stake paid or taken on the map (±10 G), the game counted", sum && dEnd.last && dEnd.last.game === "darts" && dEnd.gold === (dEnd.last.won ? 105 : 85) &&
        dEnd.darts.played === 1 && dEnd.darts.won + dEnd.darts.lost === 1 && dEnd.last.score >= 0, dEnd);
});
