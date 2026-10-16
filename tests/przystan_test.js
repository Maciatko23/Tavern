// The harbour (Map125 "Przystań", tools/przystan, js/plugins/Przystan.js; the user 2026-10-14: the harbour with the fisherman Janek
// and the smuggler of the prologue). Checks:
//   - the way in and out: Podgrodzie's forest trail (Map111 0,19) <-> the harbour's east edge (55,19), walked both ways
//   - the sea is salt: facing it, a popup over the hero says so and there is nothing to drink, fill or water from it (Needs on: the
//     thirst stays); with a rod the menu has only "Zarzuć wędkę" and the catch is herring / cod; a plank of the pier is no water
//   - the new items: Śledź / Dorsz roast and smoke ("any raw fish"), Chusta matki is a keepsake (the bag's "Pamiątki", never dropped)
//   - Janek: the first meeting (he found the hero on the beach) gives the mother's scarf; he buys herring and cod; in the evening he
//     sits in the tavern (Map001's free guest place gosc_8); at night he is at home in his hut (Map126); his boat is away at dawn
//   - Roch: the first meeting ("Chłopak od ostatnich monet"), then D20's offer; D20's night: the hero distracts the guard - the cutter
//     and Roch are away that night; the other way: the customs officer in the customs house (Map128) - 40 G, Roch gone for good
//   - the cutter's states (the wreck on the beach -> on the slipway -> afloat), the ferry and its ferryman on a ferry day only
//   - the interiors' doors open by day and lead in; every light on the harbour is a flame
// Run: CDP_PORT=9480 node tests/przystan_test.js (the server on 8765: node tools/serve.js)
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const infos = await t.json(`(function(){ const o = {}; for (const id of [125, 126, 127, 128]) o[id] = $dataMapInfos[id] ? $dataMapInfos[id].name : null; return o; })()`);
    t.check("the harbour and its three interiors are in the game (125 Przystań, 126 Chata Janka, 127 Szopa przy pochylni, 128 Komora celna)",
        infos[125] === "Przystań" && infos[126] === "Chata Janka" && infos[127] === "Szopa przy pochylni" && infos[128] === "Komora celna", infos);
    const items = await t.json(`(function(){ const o = {}; for (const id of [173, 174, 175, 176]) { const it = $dataItems[id]; o[id] = it ? [it.name, it.iconIndex, it.itypeId] : null; } return o; })()`);
    t.check("the new items: 173 Śledź, 174 Dorsz, 175 Chusta matki (a key item), 176 Smoła - each with its own icon",
        items[173][0] === "Śledź" && items[174][0] === "Dorsz" && items[175][0] === "Chusta matki" && items[175][2] === 2 && items[176][0] === "Smoła"
        && new Set([173, 174, 175, 176].map(i => items[i][1])).size === 4, items);

    // ---------------------------------------------------------------- the way in from Podgrodzie, walked
    await t.newGame({ map: 111, x: 2, y: 19, dir: 4, hour: 10, day: 2, quiet: true, minimap: false });
    await t.hold("left", 50);
    const inHarbour = await t.until(t.onMap(125), 20);
    await t.frames(30);
    const landed = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()]");
    t.check("walking west off Podgrodzie's forest trail (0,19) leads to the harbour, landing on its east edge (54,19)", inHarbour && landed[0] === 125 && landed[1] === 54 && landed[2] === 19, landed);
    await t.calm();
    await t.hold("right", 30);
    const back = await t.until(t.onMap(111), 20);
    await t.frames(20);
    const backAt = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
    t.check("...and walking east off the harbour (55,19) leads back onto Podgrodzie's trail (1,19)", back && backAt[0] === 111 && backAt[1] === 1 && backAt[2] === 19, backAt);
    const tiles111 = await t.json(`(function(){ return $dataMap.events.filter(e => e && e.x === 0 && e.y === 19 && !(e.id >= 910 && e.id <= 949) && !/^Miejsce:/.test(e.name)).map(e => e.name); })()`);
    t.check("on Podgrodzie only the one transfer event was added at (0,19) (beside the woodcutter's / poacher's forest spot)", JSON.stringify(tiles111) === JSON.stringify(["Przejście -> Przystań"]), tiles111);

    // ---------------------------------------------------------------- the sea is salt
    await t.go(125, 20, 12, 4);
    await t.eval("Needs.setEnabled(true); Needs.state().water = 40; 0");
    await t.eval("$gameParty.loseItem($dataItems[100], 9); 0");
    await t.popups({ clear: true });
    const sea = await t.json(`(function(){ const w = Farming.isWaterTile(18, 12), menu = Farming.waterMenu(); return { w, menu: menu ? menu.entries.map(e => e.name) : null, sea: Farming.seaHere() }; })()`);
    const pops = await t.popups();
    t.check("the harbour's sea is water, marked salt (<Water:salt>)", sea.w && sea.sea, sea);
    // (2026-10-15, CzerwonaWoda.js: the sea's own menu - drink anyway (poison / salt), filling refused; never the ordinary water entries)
    t.check("facing the sea without a rod: the popup over the hero (red / salt) and the sea's menu - no rod, no ordinary drink",
        !!sea.menu && !sea.menu.includes("Zarzuć wędkę") && !sea.menu.includes("Napij się") && sea.menu.includes("Napij się mimo to") && pops.some(p => /słona|czerwona/i.test(p)), { sea, pops });
    await t.give(100, 1);
    const withRod = await t.json(`(function(){ const m = Farming.waterMenu(); return m ? { title: m.title, names: m.entries.map(e => e.name) } : null; })()`);
    t.check("with a rod the sea's menu starts with „Zarzuć wędkę” - and has no plain drink, waterskin, can or bucket filling",
        !!withRod && withRod.names[0] === "Zarzuć wędkę" && !withRod.names.some(n => /^Napij się$|bukłak|konewk|Napełnij/.test(n)), withRod);
    // the button itself, facing the water from the quay: the thirst stays as it was
    await t.locate(19, 12, 4);
    await t.press("ok");
    await t.frames(20);
    await t.finish(6);
    await t.eval("if (SceneManager._scene.closeFarmMenu) SceneManager._scene.closeFarmMenu(); 0");
    await t.frames(10);
    const water = await t.json("Math.round(Needs.state().water)");
    t.check("the action button at the sea gives no water (the thirst stays at 40)", water <= 40, water);
    await t.eval("Needs.setEnabled(false); 0");
    const pier = await t.json("[Farming.isWaterTile(9, 16), Farming.isWaterTile(10, 15), $gameMap.isPassable(9, 16, 4)]");
    t.check("a plank of the pier is no water (walkable), the sea beside it is", !pier[0] && pier[1] && pier[2], pier);

    // fishing at sea: herring, now and then a cod (cast a few times: the chance is the game's own)
    let caught = [0, 0, 0], casts = 0;
    for (; casts < 10 && caught[0] + caught[1] === 0; casts++) {
        // (from the jetty's end - the open water, healthy even in the red tide; by the shore the bloom spoils the catch)
        await t.eval("$gamePlayer.locate(7, 7); $gamePlayer.setDirection(4); if ($gameSystem.changeStamina) $gameSystem.changeStamina(100); Farming.goFishing(); 0");
        await t.frames(200);
        await t.finish(4);
        caught = await t.json("[$gameParty.numItems($dataItems[173]), $gameParty.numItems($dataItems[174]), $gameParty.numItems($dataItems[98])]");
    }
    t.check("a rod cast into the sea catches herring or cod - never the pond's fish", caught[0] + caught[1] >= 1 && caught[2] === 0, { caught, casts });

    // the sea fish in the recipes: roast at the campfire, smoke "any raw fish"
    const rec = await t.json(`(function(){ const B = Farming.BUILDINGS, ids = B.campfire.recipes.map(r => r.id), sm = B.smokehouse.recipes.find(r => r.id === "smoke_fish");
        return { herring: ids.includes("roast_herring"), cod: ids.includes("roast_cod"), smokeFish: sm ? sm.fish : 0, raw: Farming.RAW_FISH(), fishCount: Farming.fishCount() }; })()`);
    t.check("the campfire roasts herring and cod; the smokehouse smokes any raw fish (pond, herring, cod)",
        rec.herring && rec.cod && rec.smokeFish === 2 && [98, 173, 174].every(i => rec.raw.includes(i)) && rec.fishCount >= 1, rec);
    const spoil = await t.json("[!!FoodTable.get(173), FoodTable.get(173).raw, FoodTable.get(174).spoil > 0]");
    t.check("herring and cod are raw food that spoils (FoodTable)", spoil[0] && spoil[1] && spoil[2], spoil);

    // ---------------------------------------------------------------- Janek
    await t.setHour(13.5);
    await t.go(125, 20, 7, 8);
    await t.frames(30);
    const talk1 = await t.talkTo("TownLife.eventOf('janek')", []);
    t.check("Janek's first meeting: „To ty! Myślałem, że nie przeżyjesz…” - he found the hero on the beach", talk1.done && /nie przeżyjesz/.test(talk1.text) && /plaży|wraku/.test(talk1.text), talk1.text);
    const scarf = await t.json(`(function(){ const it = $dataItems[175], MP = Tawerna.api("MenuPanel"), D = Tawerna.api("Drops");
        return { n: $gameParty.numItems(it), keep: !!(MP && MP.isKeepsake(it)), drop: D ? D.refuse(it) : "", met: !!TownQuests.state().flags.janekMet }; })()`);
    t.check("...and gives back the mother's scarf: Chusta matki in the bag, a keepsake („Pamiątki”) that cannot be thrown away",
        scarf.n === 1 && scarf.keep && /pamiątka/i.test(scarf.drop) && scarf.met, scarf);
    const k47 = await t.json("TownQuests.offerable('K47')");
    t.check("...and then has his quest for the hero (K47 „Pierwszy połów”)", k47, k47);
    const offer = await t.talkTo("TownLife.eventOf('janek')", ["Nie teraz"]);
    t.check("...offered first when he is spoken to (declined for today)", offer.done && /dwa śledzie/.test(offer.text), offer.text);
    await t.give(173, 3); await t.give(174, 1);
    const g0 = await t.gold();
    const sell = await t.talkTo("TownLife.eventOf('janek')", ["Sprzedam ryby"]);
    const g1 = await t.gold();
    const left = await t.json("[$gameParty.numItems($dataItems[173]), $gameParty.numItems($dataItems[174])]");
    t.check("Janek buys herring (4 G) and cod (7 G)", sell.done && left[0] === 0 && left[1] === 0 && g1 - g0 >= 3 * 4 + 7, { g0, g1, left, text: sell.text });

    // his boat is away at dawn (he is at sea), back later
    await t.setHour(6.5);
    await t.frames(40);
    const boat6 = await t.json(`(function(){ const e = $gameMap.events().find(e => e.event().name === "Łódź Janka"); return [e.isTransparent(), Przystan.janekAtSea(), TownLife.eventOf('janek')._town.hidden]; })()`);
    await t.setHour(10);
    await t.frames(40);
    const boat10 = await t.json(`(function(){ const e = $gameMap.events().find(e => e.event().name === "Łódź Janka"); return [e.isTransparent(), Przystan.janekAtSea()]; })()`);
    t.check("at 6:30 Janek is out at sea - his boat is gone from the jetty; at 10:00 it is back", boat6[0] && boat6[1] && boat6[2] && !boat10[0] && !boat10[1], { boat6, boat10 });

    // the evening in the tavern (gosc_8), the night at home (Map126)
    await t.setHour(20);
    await t.go(1, 60, 40, 8);
    await t.frames(30);
    const tav = await t.json(`(function(){ const e = TownLife.eventOf('janek'), s = $dataMap.events.find(x => x && /^Miejsce:\\s*gosc_8$/.test(x.name)); return e ? [e.x, e.y, e._town.hidden, s ? [s.x, s.y] : null] : null; })()`);
    t.check("in the evening Janek sits in the tavern on its free guest place gosc_8", !!tav && tav[3] && tav[0] === tav[3][0] && tav[1] === tav[3][1] && tav[2] === false, tav);
    await t.setHour(23.5);
    await t.go(126, 6, 8, 8);
    await t.frames(30);
    const hut = await t.json(`(function(){ const e = TownLife.eventOf('janek'), s = $dataMap.events.find(x => x && /janek_wnetrze/.test(x.name)); return e && s ? [e.x, e.y, e._town.hidden, s.x, s.y] : null; })()`);
    t.check("at night Janek is at home in his hut (Map126)", !!hut && hut[0] === hut[3] && hut[1] === hut[4] && hut[2] === false, hut);

    // ---------------------------------------------------------------- the ferry and its ferryman
    await t.setDay(4, 10);
    await t.go(125, 20, 16, 4);
    await t.frames(40);
    const ferry4 = await t.json(`(function(){ const p = $gameMap.events().find(e => e.event().name === "Prom"), f = $gameMap.event(760); return [Przystan.ferryNow(), !p.isTransparent(), !!f && !f.isTransparent()]; })()`);
    await t.setDay(5, 10);
    await t.frames(40);
    const ferry5 = await t.json(`(function(){ const p = $gameMap.events().find(e => e.event().name === "Prom"), f = $gameMap.event(760); return [Przystan.ferryNow(), !p.isTransparent(), !!f && !f.isTransparent()]; })()`);
    t.check("the ferry and its ferryman are at the pier on a ferry day (day 4, 10:00), not the day after", ferry4.every(Boolean) && !ferry5.some(Boolean), { ferry4, ferry5 });
    await t.setDay(4, 10);
    await t.frames(40);
    const fm = await t.talkTo("$gameMap.event(760)", []);
    t.check("the ferryman takes nobody without the Lord's pass", fm.done && /glejt/i.test(fm.text), fm.text);

    // ---------------------------------------------------------------- Roch
    await t.setDay(5, 10);
    await t.frames(30);
    const r1 = await t.talkTo("TownLife.eventOf('przemytnik')", []);
    t.check("Roch's first meeting: „Chłopak od ostatnich monet. Żyjesz.” - and the pendant to hide", r1.done && /ostatnich monet/.test(r1.text) && /wisiorek|kruk/i.test(r1.text), r1.text);
    const r2 = await t.talkTo("TownLife.eventOf('przemytnik')", ["Pomogę"]);
    const d20 = await t.json("TownQuests.isActive('D20')");
    t.check("...then he offers D20 „Kuter na pochylni” and the hero takes it", r2.done && /Kuter da się połatać/.test(r2.text) && d20, r2.text);
    // the cutter's states
    const st = [];
    st.push(await t.json(`(function(){ Przystan.sync(); const v = n => !$gameMap.events().find(e => e.event().name === n).isTransparent(); return [Przystan.kuterState(), v("Kuter: wrak na plaży"), v("Kuter: na pochylni"), v("Kuter: na wodzie")]; })()`));
    await t.eval("TownQuests.state().flags.d20Pochylnia = 5; Przystan.sync(); 0");
    st.push(await t.json(`(function(){ const v = n => !$gameMap.events().find(e => e.event().name === n).isTransparent(); return [Przystan.kuterState(), v("Kuter: wrak na plaży"), v("Kuter: na pochylni"), v("Kuter: na wodzie")]; })()`));
    await t.eval("TownQuests.state().flags.d20Gotowy = 5; Przystan.sync(); 0");
    st.push(await t.json(`(function(){ const v = n => !$gameMap.events().find(e => e.event().name === n).isTransparent(); return [Przystan.kuterState(), v("Kuter: wrak na plaży"), v("Kuter: na pochylni"), v("Kuter: na wodzie")]; })()`));
    t.check("the cutter: a wreck on the beach, then on the slipway, then afloat - one shown at a time",
        JSON.stringify(st) === JSON.stringify([["beach", true, false, false], ["slip", false, true, false], ["water", false, false, true]]), st);
    // D20's night: help him sail
    await t.eval("TownQuests.start('D20', 6); 0");
    await t.setHour(21.2);
    await t.frames(30);
    const night = await t.talkTo("TownLife.eventOf('przemytnik')", ["Zagadam"]);
    const walked = await t.until("TownLife.eventOf('przemytnik')._town.hidden", 40);   // (he walks to his cutter first, then is gone)
    await t.frames(40);
    const after = await t.json(`(function(){ const f = TownQuests.state().flags, k = $gameMap.events().find(e => e.event().name === "Kuter: na wodzie");
        return { help: !!f.d20Pomoc, done: TownQuests.isDone('D20'), away: Przystan.kuterAway(), kuterHidden: k.isTransparent(), roch: TownLife.eventOf('przemytnik')._town.hidden }; })()`);
    t.check("D20's night: the hero distracts the guard, the cutter sails - D20 done, the cutter and Roch away that night",
        night.done && walked && after.help && after.done && after.away && after.kuterHidden && after.roch, { after, walked, text: night.text });

    // ---------------------------------------------------------------- the other way: the customs house (a new game)
    await t.newGame({ map: 125, x: 32, y: 19, dir: 8, hour: 10, day: 6, quiet: true, minimap: false });
    await t.eval("TownQuests.state().flags.rochMet = 1; TownQuests.state().flags.d20Gotowy = 1; TownQuests.start('D20', 6); 0");
    await t.hold("up", 30);
    const inCustoms = await t.until(t.onMap(128), 15);
    await t.frames(30);
    t.check("the customs house's door opens by day and leads in (Map128)", inCustoms, await t.json("$gameMap.mapId()"));
    const cel = await t.json(`(function(){ const e = TownLife.eventOf('celnik'), s = $dataMap.events.find(x => x && /celnik_wnetrze/.test(x.name)); return e && s ? [e.x, e.y, e._town.hidden, s.x, s.y] : null; })()`);
    t.check("the customs officer sits at his desk inside", !!cel && cel[0] === cel[3] && cel[1] === cel[4] && cel[2] === false, cel);
    const g2 = await t.gold();
    await t.talkTo("TownLife.eventOf('celnik')", []);   // (the first meeting: his name and the ledger)
    const betray = await t.talkTo("TownLife.eventOf('celnik')", ["Ktoś szykuje", "Tak"]);
    const g3 = await t.gold();
    const gone = await t.json("[!!TownQuests.state().flags.d20Wydany, TownLife.gone('przemytnik'), TownQuests.isDone('D20'), Przystan.kuterState()]");
    t.check("...where the hero may give Roch away: 40 G, Roch gone for good, the cutter seized, D20 done",
        betray.done && g3 - g2 === 40 && gone[0] && gone[1] && gone[2] && gone[3] === "seized", { gone, g2, g3, text: betray.text });

    // ---------------------------------------------------------------- the interiors: Roch's shed at night (the first game's Roch is
    // gone in this one - a fresh look at the shed's resident spot and its exit)
    await t.go(127, 5, 7, 8);
    await t.frames(20);
    const shed = await t.json(`(function(){ return { spot: !!$dataMap.events.find(x => x && /przemytnik_wnetrze/.test(x.name)), exit: $dataMap.events.filter(x => x && x.pages[0].list.some(c => c.code === 201 && c.parameters[1] === 125)).length }; })()`);
    t.check("Roch's shed (Map127) has his place inside and its way out to the harbour", shed.spot && shed.exit === 1, shed);

    // ---------------------------------------------------------------- every light of the harbour is a flame
    await t.go(125, 30, 20, 2);
    await t.frames(10);
    const lights = await t.json(`(function(){ return $dataMap.events.filter(e => e && /<Light:/.test(e.note)).map(e => [e.name, e.pages[0].image.characterName, /LightFlicker|LightWhen:night/.test(e.note)]); })()`);
    t.check("every light on the harbour is a fire: a lantern, a fire basket, a brazier or a fire in a barrel (flickering or lit at night)",
        lights.length >= 6 && lights.every(l => l[1] === "!Decoration" && l[2]), lights);
});
