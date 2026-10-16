// The red water of the salt sea (js/plugins/CzerwonaWoda.js; the user 2026-10-15: water only from wells and the river, never from the
// sea - SEEN and FELT; "can't the sea be boiled?" - no). Checks on the harbour (Map125, <Water:salt>):
//   - when: red in the drought (most of the year - the share over 112 days printed), grey after two rain days among the last three
//   - looks: the tint over the sea strongest by the shore and none on the land, rusty foam on the shore line, dead fish on the shore
//     (red only); grey water: a grey tint, no dead fish; the customs' signs "Nie pić!"
//   - felt: the popup over the hero, the sea's menu (the rod, "Napij się mimo to", "Nabierz wody", "Przegotuj"); drinking the red:
//     vomiting (water and fullness down), the state "Zatrucie" (the strength capped, the work dearer); the grey: salt, the thirst worse,
//     no poison; filling refused, boiling refused ("Dalej czerwona. Nawet para śmierdzi."); a dead fish looked at
//   - fish: by the shore in the red worse with dead ones; from the jetty's end healthy (K47 stays doable); birds keep off the shore
//   - talk: Janek's "A ta czerwona woda?" (his father tried boiling it; the blood of Kruczych Skał)
// Pictures: docs/przystan/czerwona_przystan.png, czerwona_plaza.png, czerwona_popup.png, czerwona_szara.png.
// Run: CDP_PORT=9480 node tests/red_water_test.js (the server on 8765)
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join(__dirname, "..", "docs", "przystan");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 125, x: 20, y: 16, dir: 4, hour: 11, day: 2, quiet: true, minimap: false });
    // a red day (three dry days) and a grey day (rain the two days before) from the weather plan
    const days = await t.json(`(function(){ const P = d => Survival.weatherPlan(d), wet = d => { const p = P(d); return !!p && (p.type === "rain" || p.type === "snow"); };
        let red = 0, grey = 0;
        for (let d = 4; d < 200 && (!red || !grey); d++) {
            if (!red && !wet(d) && !wet(d - 1) && !wet(d - 2)) red = d;
            if (!grey && wet(d - 1) && wet(d - 2) && !wet(d)) grey = d;
        }
        return { red, grey, share: CzerwonaWoda.redShare(1, 112) }; })()`);
    console.log("NOTE red day " + days.red + ", grey day " + days.grey + ", red over days 1-112: " + Math.round(days.share * 100) + "%");
    t.check("the sea is red most of the year (over 112 days of the weather plan)", days.share >= 0.6 && days.red > 0 && days.grey > 0, days);

    // ---------------------------------------------------------------- red: the looks
    await t.setDay(days.red, 11);
    await t.calm();
    await t.frames(40);
    const look = await t.json(`(function(){ const ss = SceneManager._scene._spriteset, L = ss._redWater, b = L && L._tint.bitmap, S = 8;
        const a = (x, y) => b ? b.getAlphaPixel(x * S + 2, y * S + 2) : -1, c = (x, y) => b ? b.getPixel(x * S + 2, y * S + 2) : "";
        return { on: !!L && L.visible, phase: CzerwonaWoda.phase(), shore: a(18, 12), far: a(1, 12), land: a(25, 20), col: c(18, 12),
            foam: L ? L._foam.children.length : 0, fish: L ? L._fish.children.length : 0, dead: CzerwonaWoda.deadFish().length,
            fishOk: CzerwonaWoda.deadFish().every(f => !Farming.isWaterTile(f.x, f.y) && $gameMap.isPassable(f.x, f.y, 2)) }; })()`);
    t.check("a red day: the sea's tint is strong by the shore, weaker far out, none on the land", look.on && !look.phase.grey && look.shore > look.far && look.shore > 60 && look.land === 0, look);
    t.check("...rusty foam along the shore line and a few dead fish on the shore (on dry, walkable cells)", look.foam > 20 && look.fish > 0 && look.fish === look.dead && look.dead <= 16 && look.fishOk, look);
    const signs = await t.json(`(function(){ return $dataMap.events.filter(e => e && e.name === "Tabliczka: Nie pić!").map(e => [e.x, e.y, e.pages[0].image.characterName]); })()`);
    t.check("the customs officer's signs „Nie pić!” stand by the quay and on the beach", signs.length === 2 && signs.every(s => s[2] === "!$Przystan_Tabliczka"), signs);
    await t.locate(20, 15, 4);
    await t.eval("$gamePlayer.center($gamePlayer.x, $gamePlayer.y); 0");
    await t.frames(240);   // (the notices of the jump in time fade first)
    await t.shot(path.join(OUT, "czerwona_przystan.png"));
    // the beach with its dead fish
    await t.locate(19, 33, 2);
    await t.eval("$gamePlayer.center($gamePlayer.x, $gamePlayer.y); 0");
    await t.frames(30);
    await t.shot(path.join(OUT, "czerwona_plaza.png"));

    // ---------------------------------------------------------------- red: felt
    await t.locate(19, 12, 4);
    await t.frames(5);
    await t.popups({ clear: true });
    await t.eval("$gameParty.loseItem($dataItems[100], 9); $gameParty.gainItem($dataItems[138], 1); 0");
    const menu = await t.json(`(function(){ const m = Farming.waterMenu(); return m ? { title: m.title, names: m.entries.map(e => e.name) } : null; })()`);
    const pop1 = await t.popups();
    t.check("facing the red sea: the popup „Woda jest czerwona i cuchnie.” and the sea's menu (drink anyway, fill, boil - no ordinary drink)",
        pop1.includes("Woda jest czerwona i cuchnie.") && menu && menu.title === "Czerwona woda" && ["Napij się mimo to", "Nabierz wody", "Przegotuj"].every(n => menu.names.includes(n)) && !menu.names.includes("Napij się"),
        { menu, pop1 });
    // the popup with the menu on the screen (the real button)
    await t.press("ok");
    await t.frames(25);
    await t.shot(path.join(OUT, "czerwona_popup.png"));
    await t.eval("if (SceneManager._scene.closeFarmMenu) SceneManager._scene.closeFarmMenu(); 0");
    await t.frames(10);
    await t.finish(4);
    // drinking it anyway
    await t.eval("Needs.setEnabled(true); Needs.state().water = 60; Needs.state().food = 60; if ($gameSystem.changeStamina) $gameSystem.changeStamina(100); 0");
    await t.popups({ clear: true });
    await t.eval("CzerwonaWoda.drinkAnyway(); 0");
    await t.frames(90);
    const sick = await t.json(`(function(){ const n = Needs.state(); return { water: Math.round(n.water), food: Math.round(n.food), poisoned: CzerwonaWoda.poisoned(),
        st: $gameSystem.stamina(), max: $gameSystem.maxStamina(), cost: Survival.costFactor ? Survival.costFactor() : null }; })()`);
    const pop2 = await t.popups();
    t.check("drinking the red water anyway: vomiting - water and fullness down, the state „Zatrucie” (strength capped at 70%, work dearer), a popup",
        sick.water < 60 && sick.food < 60 && sick.poisoned && sick.st <= Math.round(sick.max * 0.7) && (sick.cost === null || sick.cost > 1) && pop2.some(p => /Zatrucie/.test(p)), { sick, pop2 });
    await t.eval("Needs.setEnabled(false); 0");
    await t.popups({ clear: true });
    await t.eval("CzerwonaWoda.fillRefused(); CzerwonaWoda.boilRefused(); 0");
    await t.frames(5);
    const pop3 = await t.popups();
    t.check("filling a vessel is refused, and boiling it: „Dalej czerwona. Nawet para śmierdzi.”", pop3.some(p => /nie nabierzesz/.test(p)) && pop3.includes("Dalej czerwona. Nawet para śmierdzi."), pop3);
    // fish: the shore vs the open water off the jetty's end
    const fish = await t.json("({ shore: CzerwonaWoda.fishAt(18, 12), jetty: CzerwonaWoda.fishAt(6, 7), pierHead: CzerwonaWoda.fishAt(3, 16) })");
    t.check("fishing by the red shore: worse and now and then a dead fish; off the jetty's end and the pier's head: healthy (K47 stays doable)",
        fish.shore.mul < 1 && fish.shore.dead > 0 && fish.jetty.mul === 1 && fish.jetty.dead === 0 && fish.pierHead.mul === 1, fish);
    const birds = await t.json("[CzerwonaWoda.nearShore(21, 12, 3), CzerwonaWoda.nearShore(40, 20, 3)]");
    t.check("the birds keep off the stinking shore (not off the land further in)", birds[0] && !birds[1], birds);
    // a dead fish looked at
    const f0 = await t.json("CzerwonaWoda.deadFish()[0]");
    if (f0) {
        await t.popups({ clear: true });
        const at = await t.json(`(function(){ const f = ${JSON.stringify(f0)}; for (const [dx, dy, d] of [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]]) { const x = f.x + dx, y = f.y + dy;
            if ($gameMap.isPassable(x, y, d) && !Farming.isWaterTile(x, y) && $gameMap.eventsXy(x, y).length === 0) { $gamePlayer.locate(x, y); $gamePlayer.setDirection(d); return [x, y, d]; } } return null; })()`);
        await t.press("ok");
        await t.frames(10);
        const pop4 = await t.popups();
        t.check("a dead fish looked at: „Śnięta ryba. Cuchnie zakwitem.”", !!at && pop4.includes("Śnięta ryba. Cuchnie zakwitem."), { at, pop4, f0 });
    }
    // Janek about it
    await t.setHour(13.5);
    await t.eval("(function(){ const s = TownQuests.state(), d = Tawerna.time.day(); s.flags.janekMet = 1; s.declined.K47 = d; s.declined.W10 = d; return 0; })()");
    await t.frames(20);
    const jt = await t.talkTo("TownLife.eventOf('janek')", ["A ta czerwona woda"]);
    t.check("Janek about the red water: his father tried boiling it, the old people's „krew Kruczych Skał”", jt.done && /Ojciec próbował/.test(jt.text) && /krew Kruczych Skał/.test(jt.text), jt.text);

    // ---------------------------------------------------------------- grey after the rain
    await t.setDay(days.grey, 11);
    await t.calm();
    await t.frames(40);
    const grey = await t.json(`(function(){ const L = SceneManager._scene._spriteset._redWater, b = L._tint.bitmap, px = b.getPixel(18 * 8 + 4, 12 * 8 + 4);
        return { phase: CzerwonaWoda.phase(), red: CzerwonaWoda.isRed(), dead: CzerwonaWoda.deadFish().length, fish: L._fish.children.length, px, a: b.getAlphaPixel(18 * 8 + 4, 12 * 8 + 4) }; })()`);
    // (the user: clearly murky grey-brown by the shore - but weaker than the red)
    t.check("after two days of rain the water is grey: a clear murky grey-brown tint by the shore (weaker than the red), no dead fish",
        grey.phase.grey && !grey.red && grey.dead === 0 && grey.fish === 0 && grey.a >= 90 && grey.a < look.shore, { grey, red: look.shore });
    await t.popups({ clear: true });
    await t.locate(19, 12, 4);
    const gm = await t.json(`(function(){ const m = Farming.waterMenu(); return m ? { title: m.title, names: m.entries.map(e => e.name) } : null; })()`);
    await t.eval("Needs.setEnabled(true); Needs.state().water = 60; 0");
    await t.eval("CzerwonaWoda.drinkAnyway(); 0");
    await t.frames(90);
    const salty = await t.json("({ water: Math.round(Needs.state().water), poisoned: CzerwonaWoda.poisoned() })");
    const pop5 = await t.popups();
    t.check("grey water: „Słona - nie do picia.”; drinking it anyway makes the thirst worse (salt), no new poison",
        pop5.includes("Słona - nie do picia.") && gm.title === "Morze" && salty.water < 60 && pop5.some(p => /Słona! Pragnienie/.test(p)), { gm, salty, pop5 });
    await t.eval("Needs.setEnabled(false); 0");
    await t.locate(20, 15, 4);
    await t.eval("$gamePlayer.center($gamePlayer.x, $gamePlayer.y); 0");
    await t.frames(30);
    await t.frames(200);
    await t.shot(path.join(OUT, "czerwona_szara_po.png"));   // (czerwona_szara.png: before | after - tools/przystan/art/czerwona/przed_po.py)
});
