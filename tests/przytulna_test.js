// Próba „Przytulna sala” (js/plugins/Przytulna.js): wyłączona nie zmienia nic, włączona łata światło w pamięci, kominki sypią iskry,
// goście unoszą kufle, grajek i Borgar mają swoje klatki. Z kopią mapy z próby:
//   GAME_OVERLAY=tools/tavern/przytulna/overlay node tests/przytulna_test.js
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    await t.eval("window.PRZYTULNA = false; 0");
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20.2, minimap: false });
    await t.frames(60);
    const off = await t.json("({ note: $dataMap.note, patched: !!$dataMap._przyt, stats: Przytulna.stats(), on: Przytulna.on() })");
    t.check("wyłączona: mapa bez łat, żadnych iskier ani kufli", !off.on && !off.patched && /DarkNight:225/.test(off.note) && off.stats.sparks === 0 && off.stats.mugs === 0, off);
    await t.eval("window.PRZYTULNA = true; 0");
    await t.go(1, 50, 34, 8);
    await t.eval("Przytulna.set(true); 0");
    await t.frames(240);
    const on = await t.json(`({ note: $dataMap.note, patched: !!$dataMap._przyt, stats: Przytulna.stats(), fill: $dataMap.events.filter(e => e && /^wypelnienie/.test(e.name) && e.x > 37 && e.x < 83 && e.y > 27 && e.y < 44).map(e => e.note)[0],
        bard: !!$gameMap.event(360), banner: $dataMap.events[40].pages[0].image.characterName })`);
    t.check("włączona: noc ciemniejsza o 22 (247)", on.patched && /DarkNight:247/.test(on.note), on);
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
    await t.eval("window.PRZYTULNA = false; 0"); await t.frames(30);
    t.check("wyłączona z powrotem: iskry i kufle znikają", (await t.json("Przytulna.stats()")).sparks === 0);
});
