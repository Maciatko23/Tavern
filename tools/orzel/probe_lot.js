// Biały orzeł - sonda w trakcie budowy (zrzuty, liczby): dorosły na polu dziadka, start, lot, przelot krawędzią, lądowanie.
//   CDP_PORT=9542 GAME_PLUGINS_ADD="Kruk_Data:Orzel_Data;Starcia:Orzel;Orzel:Orzel_Lot" node tools/orzel/probe_lot.js [outDir]
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = process.argv[2] || path.join(__dirname, "zrzuty");

kit.test({ port: 9542 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 3, x: 20, y: 15, day: 70, hour: 11.5, quiet: true, minimap: false });
    const info = await t.json(`({ orzel: !!window.Orzel, lot: !!window.OrzelLot, view: !!(Tawerna.view && Tawerna.view.w) })`);
    t.check("wtyczki orła w grze", info.orzel && info.lot && info.view, info);
    await t.eval(`(function(){ Orzel.forceStage(5); const s = Orzel.state(); s.bond = 80; s.name = "Śnieżny"; return 0; })()`);
    await t.frames(60);
    const e = await t.json(`(function(){ const e = Orzel.eagle; return e ? { x: e.x, y: e.y, z: e.z, st: e.state, spr: !!(e.holder && e.holder.parent), bmp: e.body && e.body.bitmap && e.body.bitmap.isReady() } : null; })()`);
    t.check("dorosły orzeł stoi na mapie obok bohatera", !!e && e.spr, e);
    await t.shot(path.join(OUT, "orzel_ziemia.png"));
    const why = await t.json(`OrzelLot.why()`);
    t.check("może wystartować (why pusty)", why === "", why);
    await t.eval(`OrzelLot.mount(); 0`);
    await t.frames(70);
    const air = await t.json(`({ s: Tawerna.view.scale(), on: OrzelLot.flying(), ph: OrzelLot.lot && OrzelLot.lot.phase, stx: $gameMap.screenTileX(), tm: SceneManager._scene._spriteset._tilemap.width, z: Orzel.eagle && Orzel.eagle.z, hero: $gamePlayer.isTransparent() })`);
    t.check("start: kamera x0,5, 53 pola na ekranie, tilemapa 2560, bohater ukryty", air.on && air.s === 0.5 && air.stx > 53 && air.tm === 2560 && air.hero, air);
    await t.shot(path.join(OUT, "orzel_start.png"));
    // fly right for 2 s
    await t.eval(`Input._currentState.right = true; 0`);
    await t.frames(120);
    await t.eval(`Input._currentState.right = false; 0`);
    const moved = await t.json(`({ x: $gamePlayer._realX, y: $gamePlayer._realY, map: $gameMap.mapId(), st: Orzel.state().st })`);
    t.check("lot w prawo przesuwa bohatera", moved.x > 22, moved);
    await t.shot(path.join(OUT, "orzel_lot.png"));
    // low
    await t.press("pageup");
    await t.frames(60);
    const low = await t.json(`({ s: Tawerna.view.scale(), lvl: OrzelLot.lot.level })`);
    t.check("Q: nisko (x1)", low.s === 1 && low.lvl === "low", low);
    await t.shot(path.join(OUT, "orzel_nisko.png"));
    const spot = await t.json(`OrzelLot.landingSpot()`);
    console.log("landing spot", JSON.stringify(spot));
    await t.eval(`OrzelLot.tryLand(true); 0`);
    await t.frames(60);
    const down = await t.json(`({ on: OrzelLot.flying(), s: Tawerna.view.scale(), hero: $gamePlayer.isTransparent(), px: $gamePlayer.x, py: $gamePlayer.y, e: Orzel.eagle && [Orzel.eagle.x, Orzel.eagle.y, Orzel.eagle.state] })`);
    t.check("lądowanie: x1, bohater widoczny obok orła", !down.on && down.s === 1 && !down.hero, down);
    await t.shot(path.join(OUT, "orzel_po_ladowaniu.png"));
}).catch(e => { console.log("ERR", e); process.exit(1); });
