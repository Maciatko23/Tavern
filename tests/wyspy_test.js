// Wyspy.js: the islands' ways (the sandbars at low tide, the hired boat, the garrison's boat, the fishermen's boat, the signal) and
// their things (nests, salt, the cache, the cross, the post, the treasure, the wreck).
//   node tests/run.js wyspy_test
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9571, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    t.check("wtyczka wczytana", await t.json("!!window.Wyspy && !!Wyspy.use"));
    const events = map => t.json(`$gameMap.events().filter(e => /<Wyspy:/.test(e.event().note || "")).map(e => [e.eventId(), e.x, e.y, e.characterName(), e.direction()])`);
    // run an island thing as the player does: its event's own command (Wyspy.use) and the choice picked (index), then frames
    // (the whole run in one call: the messages cleared and the choice picked as they come; the interpreter needs no frames for that)
    const use = async (id, choice) => {
        await t.eval(`(() => { const ev = $gameMap.event(${id}); const i = new Game_Interpreter(); i.setup(ev.list(), ${id});
            for (let k = 0; k < 400 && i.isRunning(); k++) {
                if ($gameMessage.isChoice()) { $gameMessage.onChoice(${choice === undefined ? -1 : choice}); $gameMessage.clear(); }
                else if ($gameMessage.hasText()) $gameMessage.clear();
                i.update();
            }
            return 0; })()`);
        await t.frames(30);
    };
    const where = () => t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.isTransferring(), $gameMessage.isBusy(), $gameMessage.hasText() ? $gameMessage.allText().slice(0, 60) : '', SceneManager._scene.isActive(), SceneManager.isSceneChanging(), $gameMap.isEventRunning(), Tawerna.time.hour()]");
    const give = (id, n) => t.eval(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
    const n = id => t.json(`$gameParty.numItems($dataItems[${id}])`);

    // ---- the harbour: the hired boat by day to Wyspa Solna, back
    await t.newGame({ map: 125, x: 13, y: 8, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    let ev = await events();
    t.check("Przystań: łódka do wynajęcia przy pomoście (3140)", ev.some(e => e[0] === 3140), ev);
    await t.eval("$gameParty.gainGold(100); 0");
    await use(3140, 0);
    await t.frames(90);
    t.check("łódka za dnia płynie na Wyspę Solną (920), 5 G", (await t.json("$gameMap.mapId()")) === 920 && (await t.json("$gameParty.gold()")) === 95, await t.json("[$gameMap.mapId(), $gameParty.gold()]"));
    ev = await events();
    t.check("Wyspa Solna: 3 głazy z solą i łódka", ev.filter(e => /Wys_Sol/.test(e[3])).length === 3 && ev.some(e => e[0] === 3149), ev);
    await use(3146);
    t.check("bez noża sól się nie zeskrobuje", (await n(200)) === 0);
    await give(91, 1);
    await t.eval("$gameScreen.changeWeather('none', 0, 0); 0");
    await use(3146);
    t.check("z nożem: bryła soli (latem 2), głaz bez soli", (await n(200)) === 2 && (await t.json("$gameMap.event(3146).direction()")) === 4, await t.json("[$gameParty.numItems($dataItems[200]), $gameMap.event(3146).direction()]"));
    await use(3146);
    t.check("ten sam głaz drugi raz: nic", (await n(200)) === 2);
    await use(3149, 0);
    await t.frames(90);
    t.check("łódka wraca do Przystani", (await t.json("$gameMap.mapId()")) === 125);
    // ---- by day not to the smugglers
    await use(3140, 1);
    await t.frames(60);
    t.check("za dnia na Wyspę Przemytników nie popłynie", (await t.json("$gameMap.mapId()")) === 125);
    await t.setHour(23); await t.frames(20);
    await use(3140, 1);
    await t.frames(90);
    t.check("nocą płynie na Wyspę Przemytników (922)", (await t.json("$gameMap.mapId()")) === 922);
    await use(3151);
    t.check("skrytka przemytników: przyprawy, piwo, smoła, monety", (await n(210)) >= 2 && (await n(81)) >= 2, await t.json("[$gameParty.numItems($dataItems[210]), $gameParty.numItems($dataItems[81])]"));
    const spice = await n(210);
    await use(3151);
    t.check("skrytka drugi raz w tym tygodniu: pusta", (await n(210)) === spice);

    // ---- the cormorants and the sandbar
    await t.newGame({ map: 917, x: 50, y: 46, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    ev = await events();
    t.check("Wyspa Kormoranów: 4 gniazda", ev.filter(e => /Wys_Kormoran/.test(e[3])).length === 4, ev);
    await use(3142);
    t.check("gniazdo latem: 2 jaja kormorana, potem bez jaj", (await n(75)) === 2 && (await t.json("$gameMap.event(3142).direction()")) === 4);
    const tide = await t.json(`(() => { const W = Tawerna.api("Wyspa"), R = Tawerna.api("Wrak"); const out = [];
        for (let h = 0; h < 24; h += 0.25) { const td = W.tide(40, h); out.push(td.low ? 1 : 0); }
        return { regions: $gameMap.regionId(49, 10), lowHours: out.reduce((a, b) => a + b, 0) / 4 }; })()`);
    t.check("mielizna ma region zalewania 61 i odpływ trwa część doby", tide.regions === 61 && tide.lowHours > 0 && tide.lowHours < 12, tide);
    await t.eval(`Tawerna.api("Wyspa").forceTide("high"); 0`); await t.frames(5);
    const hi = await t.json(`({ wet: Tawerna.api("Wrak").floodedAt(49, 10), pass: $gameMap.isPassable(49, 10, 2) })`);
    await t.eval(`Tawerna.api("Wyspa").forceTide("low"); 0`); await t.frames(5);
    const lo = await t.json(`({ dry: !Tawerna.api("Wrak").floodedAt(49, 10), pass2: $gameMap.isPassable(49, 10, 2) })`);
    const flood = Object.assign({}, hi, lo);
    t.check("przypływ zalewa mieliznę (nie da się przejść), odpływ ją odsłania", flood.wet && !flood.pass && flood.dry && flood.pass2, flood);
    await t.eval(`(() => { $gamePlayer.locate(49, 12); Tawerna.api("Wyspa").forceTide("high"); return 0; })()`);
    await t.frames(90);
    const pushed = await t.json("[$gamePlayer.x, $gamePlayer.y, $gameMap.regionId($gamePlayer.x, $gamePlayer.y)]");
    t.check("bohater złapany przez wodę na mieliźnie trafia na suchy brzeg", pushed[2] !== 61, pushed.concat(await where()));
    await t.eval(`Tawerna.api("Wyspa").forceTide(null); 0`);

    // ---- the fishermen's boat and the cross
    await t.newGame({ map: 923, x: 54, y: 3, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    await use(3153, 0);
    t.check("stara łódź bez desek, gwoździ i smoły się nie łata", !(await t.json("Wyspy.state().boat923")));
    await give(80, 4); await give(88, 4); await give(176, 1);
    await use(3153, 0);
    t.check("łódź załatana (4 deski, 4 gwoździe, smoła)", !!(await t.json("Wyspy.state().boat923")) && (await n(80)) === 0);
    await use(3153, 0);
    await t.frames(90);
    t.check("łódź płynie na wysepkę Kamienia Rybaków", (await t.json("[$gamePlayer.x, $gamePlayer.y]")).join() === "22,15", await where());
    await give(98, 1);
    await use(3155, 0);
    t.check("ryba pod krzyżem: błogosławieństwo", (await n(98)) === 0 && (await t.json("Wyspy.state().cross")) === 40);

    // ---- the post, the treasure, the eagle's stack, the wreck
    await t.newGame({ map: 951, x: 22, y: 13, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    await use(3159);
    t.check("skrzynia posterunku: strzały, raz", (await n(127)) >= 10 && !!(await t.json("Wyspy.state().post")));
    await t.newGame({ map: 918, x: 29, y: 14, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    await use(3160);
    t.check("bez łopaty skarb zostaje", !(await t.json("Wyspy.state().dug")));
    await give(62, 1);
    await use(3160);
    t.check("z łopatą: bursztyn i monety spod sosny", (await n(382)) === 1);
    await t.newGame({ map: 935, x: 15, y: 9, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    await use(3156);
    t.check("orle gniazdo: pióra", (await n(146)) >= 3);
    await use(3157, 0);
    await t.frames(90);
    t.check("sygnał z iglicy: rybak zabiera do Przystani", (await t.json("$gameMap.mapId()")) === 125);
    await t.newGame({ map: 914, x: 44, y: 38, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    await use(3161);
    t.check("wrak łodzi w zatoczce: lina, gwoździe, deski, raz", (await n(93)) >= 2 && !!(await t.json("Wyspy.state().wreck")));
    // ---- the garrison's boat
    await t.newGame({ map: 162, x: 5, y: 27, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    await use(3141, 0);
    await t.frames(90);
    t.check("łódź straży płynie na Skałę Strażniczą (951)", (await t.json("$gameMap.mapId()")) === 951);
});
