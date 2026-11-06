// Próba „Przytulna sala” (js/plugins/Przytulna.js): wyłączona nie zmienia nic, włączona łata światło w pamięci, kominki sypią iskry,
// goście unoszą kufle, grajek i Borgar mają swoje klatki. Z kopią mapy z próby:
//   GAME_OVERLAY=tools/tavern/przytulna/overlay node tests/przytulna_test.js
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    await t.eval("window.PRZYTULNA = false; 0");
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20.2, minimap: false });
    await t.frames(60);
    const off = await t.json("({ note: $dataMap.note, patched: !!$dataMap._przyt, stats: Przytulna.stats(), on: Przytulna.on() })");
    t.check("wyłączona: mapa bez łat, żadnych iskier ani kufli", !off.on && !off.patched && /DarkNight:185/.test(off.note) && off.stats.sparks === 0 && off.stats.mugs === 0, off);
    await t.eval("window.PRZYTULNA = true; 0");
    await t.go(1, 50, 34, 8);
    await t.eval("Przytulna.set(true); 0");
    await t.frames(240);
    const on = await t.json(`({ note: $dataMap.note, patched: !!$dataMap._przyt, stats: Przytulna.stats(), fill: $dataMap.events.filter(e => e && /^wypelnienie/.test(e.name) && e.x > 37 && e.x < 83 && e.y > 27 && e.y < 44).map(e => e.note)[0],
        bard: !!$gameMap.event(360), banner: $dataMap.events[40].pages[0].image.characterName })`);
    t.check("włączona: noc jak w notatce mapy (185, pomieszczenia bez lamp nie są czarne), krawędzie świateł miękkie", on.patched && /DarkNight:185/.test(on.note) && /<LightEdges:soft>/.test(on.note), on);
    t.check("kominki sypią iskry i dają blask na podłodze", on.stats.glow >= 2 && on.stats.sparks > 0, on.stats);
    await t.frames(300);
    const sit = await t.json("Przytulna.stats()");
    t.check("goście siedzą na stołkach (własne klatki, co najmniej 8 widocznych)", sit.seated >= 8, sit);
    let drank = sit.drinking > 0;
    for (let i = 0; i < 40 && !drank; i++) { await t.frames(30); drank = (await t.json("Przytulna.stats()")).drinking > 0; }
    t.check("ktoś unosi kufel (klatki picia)", drank);
    if (on.bard) {
        await t.eval("$gameSystem.setDayNightHour(20.5); 0"); await t.frames(30);
        const b = await t.json("({ vis: Przytulna.ST.layer.anims.get('grajek') && Przytulna.ST.layer.anims.get('grajek').sp.visible })");
        t.check("grajek (zdarzenie 360) gra wieczorem", b.vis === true, b);
        await t.eval("$gameSystem.setDayNightHour(12); 0"); await t.frames(30);
        const d = await t.json("({ vis: Przytulna.ST.layer.anims.get('grajek').sp.visible })");
        t.check("...a w dzień nie", d.vis === false, d);
        t.check("chorągwie z krukiem", on.banner === "!$Przytulna_Kruk", on);
    }
    // Borgar wyciera przy ladzie, nie w powietrzu: przechodzi za wolny kawałek lady, nogi za blatem, potem wraca na miejsce
    await t.eval("$gamePlayer.locate(50, 34); Przytulna.ST.wipe = null; Przytulna.ST.nextWipe = 0; 0");
    await t.until("(() => { const e = $gameMap.event(1); return e.x === 53 && e.y === 29 && !e.isMoving() && Przytulna.ST.wipe && Przytulna.ST.wipe.t0 >= 0; })()", 20);
    await t.frames(40);
    const wy = await t.json("(() => { const a = Przytulna.ST.layer.anims.get('borgar'), e = $gameMap.event(1); return { vis: a.sp.visible, h: a.sp._frame.height, x: e.x, y: e.y, dir: e.direction(), fix: e._directionFix, bottom: a.sp.y + a.sp._frame.height * (1 - a.sp.anchor.y), edge: $gameMap.adjustY(29) * 48 + 26 }; })()");
    t.check("wyciera stojąc za ladą, obok doniczki (53,29), przodem do sali", wy.vis && wy.x === 53 && wy.y === 29 && wy.dir === 2 && wy.fix === true, wy);
    t.check("to, co niżej tylnego brzegu blatu, jest schowane", wy.h < 74 && Math.abs(wy.bottom - wy.edge) <= 2, wy);
    const zapis = await t.json("(() => { try { return JsonEx.stringify(DataManager.makeSaveContents()).length; } catch (e) { return String(e); } })()");
    t.check("zapis działa, gdy wyciera", typeof zapis === "number", zapis);
    await t.eval("Przytulna.ST.wipe.d = 0; 0");
    await t.until("(() => { const e = $gameMap.event(1); return e.x === 52 && e.y === 28 && !e.isMoving() && e._directionFix; })()", 20);
    await t.frames(4);
    const dom = await t.json("(() => { const s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gameMap.event(1)); return { anchor: s.anchor.y, op: s.opacity, h: s._frame.height, dir: $gameMap.event(1).direction() }; })()");
    t.check("po wycieraniu wraca na swoje miejsce, cały, przodem do sali", dom.anchor === 1 && dom.op === 255 && dom.dir === 2 && dom.h === 64, dom);
    await t.eval("window.PRZYTULNA = false; 0"); await t.frames(30);
    t.check("wyłączona z powrotem: iskry i kufle znikają", (await t.json("Przytulna.stats()")).sparks === 0);
});
