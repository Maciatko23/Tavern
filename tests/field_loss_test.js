// The unpaid debt does NOT end the game (Story.js + Homes.js, the user 2026-10-15). From the saved game day40_farm (grandpa's field
// with ~25 buildings, the hut with its furniture, the dog at its kennel, half the debt paid):
//   A. dawn of day 61 away from the field (grandpa's house): no ending, the field lost (the Lord's letter, chapter 1 over), saving and
//      loading work; grandpa's first words after it (sad, warm: the house was no pledge, the sołtys sells houses)
//   B. the first walk onto the field in the carrying-out days: the scene - the butler and two guards in the Lord's colours, the
//      measuring, the sign "Własność Lorda Zaleskiego", the buyback offer and the hook of the doors under Krucze Skały; a guard stays
//   C. the 3 days: nothing new may be built, a building taken down gives its materials back, the yard's animals sold, the guard's words
//   D. the dawn of day 64 on the field: the guard sees him out to Skraj lasu, the field is shut (a guard at the way in, every transfer
//      onto it refused with a popup over the hero); the hut's furniture stays with the field, the dog comes along
//   E. the homes: the sołtys sells Chata pod lasem (too little gold: a popup) - its door on Podgrodzie's new rows, the room with the
//      bought bed and chest, the plot beside it (region 8: built on - a chest, a new hut allowed, nothing outside it); the burnt farm
//      of the Ług family (Map168, from Skraj lasu): the ruin starts D21, Józek Łata, Marta, the sołtys (350 G through Marta), the
//      land clean, the ruin cleared (the toy horse back to Marta), the stages built (materials, blows), the house's room, the dry
//      well, Marta at the grave
//   F. W4 "Krew kasztelana" begins after the lost chapter 1; the Heart's Lord a rival while the field is his
//   G. the buyback at the Lord's (500 G, then the rest): the field back with what was left on it (the hut's furniture back inside, the
//      sign and the guards gone, the way in open), grandpa's thanks
// Screenshots: docs/strata_pola/*.png.   CDP_PORT=9497 node tests/field_loss_test.js
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "strata_pola");

// every message shown, with the text (the scene runs by itself - no talkTo driver there)
const LOG = `(function(){ if (window.__fl) return 0; const L = window.__fl = { log: [] };
    const _s = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() { _s.call(this); L.log.push($gameMessage.allText().replace(/ /g, " ")); };
    return 0; })()`;

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console", plugins: ["Homes"] }, async t => {
    const J = e => t.json(e);
    const st = () => J("Story.state()");
    // presses O through a running scene (messages; a choice: the first); calls onFrame(i) between the presses
    const through = async (secs, onFrame) => {
        const t0 = Date.now();
        for (let i = 0; Date.now() - t0 < secs * 1000; i++) {
            const busy = await t.eval("$gameMap.isEventRunning() || $gameMessage.isBusy() || $gamePlayer.isTransferring() || !(SceneManager._scene instanceof Scene_Map) || SceneManager.isSceneChanging()");
            if (onFrame) await onFrame(i);
            if (!busy) { await t.frames(10); if (!(await t.eval("$gameMap.isEventRunning() || $gameMessage.isBusy()"))) return true; }
            if (await t.eval("$gameMessage.isBusy() && !$gameMessage.isChoice()")) await t.press("ok");
            await t.frames(8);
        }
        return false;
    };
    const logFrom = async n => (await J("window.__fl.log")).slice(n).join(" / ").replace(/\s+/g, " ");
    const shown = (map, id) => `(function(){ const e = $gameMap.mapId() === ${map} ? $gameMap.event(${id}) : null; return !!e && !!e.page() && !!e.characterName() && !e.isTransparent(); })()`;

    // ================= A. dawn of day 61, away from the field
    t.check("the saved game day40_farm loads (grandpa's field, half the debt paid)", await t.loadFixture("day40_farm", { quiet: true }));
    await t.eval(LOG);
    await t.eval("Homes.state().heard = 0; 0");
    const before = await J(`(function(){ const f = Farming.farm(), b = f.buildings; return { field: (b[3] || []).length, hut: (b[3] || []).filter(x => x.type === 'hut' && !x.site).length,
        inside: (b[100] || []).length, dog: Dog.state().tame, dogMap: Dog.state().map, paid: Story.state().paid }; })()`);
    t.check("before: the field has its buildings and a hut with furniture inside; the dog is tame", before.field >= 20 && before.hut === 1 && before.inside >= 2 && before.dog, before);
    await t.go(19, 8, 7, 8);
    await t.notices({ clear: true });
    await t.setDay(61, 5.8);
    await t.frames(40);
    const night = await J("({ lost: !!Story.state().lost, open: Story.isOpen(), night: Story.lastNight() })");
    t.check("day 61, 5:48 (the last night): the debt still counts, the field not lost yet", !night.lost && night.open && night.night, night);
    await t.setHour(6.2);
    const lostOk = await t.until("!!Story.state().lost", 15);
    await t.frames(30);
    // (2026-10-28, the user: chapter 1 is a thread of the journal - Watki.js's own record "fabula" - no longer goals; its steps:
    // 0 rozmowa, 1 dzialka, 2 praca, 3 zmiana, 4 dlug, 5 wyniesienie, 6 dach, 7 piwnica, 8 odkup)
    await t.eval("Watki.get('fabula').ownChecks(); 0");
    const A = await J(`({ scene: SceneManager._scene.constructor.name, save: $gameSystem.isSaveEnabled(), doomed: Story.doomed(), lost: Story.state().lost, buy: Story.state().buy,
        open: Story.isOpen(), fieldLost: Story.fieldLost(), locked: Story.fieldLocked(), carry: Story.carryLeft(), ended: Story.chapterEnded(),
        notes: Journal.data().notes.map(n => n.title), debtDone: Watki.rekordy().w.fabula.t.done[4] !== undefined, krok: Watki.krok('fabula'),
        carryTitle: Watki.get('fabula').stepTitle(), roofDone: Watki.rekordy().w.fabula.t.done[6] !== undefined })`);
    const notices = await t.notices();
    t.check("A1 dawn of day 61 away from the field: NO ending (the map goes on), saving works, the field is the Lord's now (3 days to carry things off)",
        lostOk && A.scene === "Scene_Map" && A.save === true && !A.doomed && A.lost.day === 61 && A.fieldLost && !A.locked && A.carry === 3 && !A.open && A.ended, A);
    t.check("A2 the Lord's letter and the note 'Działka przepadła' (with the buyback 3000 G and the hook of Krucze Skały); chapter 1 over (top notice)",
        A.notes.some(n => /^List od Lorda \(dzień 61\)/.test(n)) && A.notes.includes("Działka przepadła") && A.buy.price === 3000 && A.buy.paid === 0 &&
        notices.some(n => /Rozdział 1 zakończony: działka przepadła/.test(n)) && notices.some(n => /List od Lorda Zaleskiego/.test(n)), { notes: A.notes, notices });
    const note = await J("Journal.data().notes.find(n => n.title === 'Działka przepadła').text");
    t.check("A3 the note: 3 days (till dawn of day 64), the buyback 3000 G, grandpa's house, Chata pod lasem (the sołtys) and the Ług farm, the doors under Krucze Skały",
        /do świtu dnia 64/.test(note) && /3000 G/.test(note) && /Chatę pod lasem/.test(note) && /zagroda Ługów/.test(note) && /Kruczych Skał/.test(note), note.slice(0, 500));
    t.check("A4 the journal: the chapter passes over the debt (not done, no 'Cel wykonany') to the loss's way: carry off (3 days); a new roof not done by the hut on the lost field",
        !A.debtDone && A.krok === "wyniesienie" && /Wynieś dobytek z działki \(zostały 3 dni\)/.test(A.carryTitle) && !A.roofDone &&
        !notices.some(n => /Cel wykonany: (Spłać dług|Dług dziadka|Znajdź nowy dach)/.test(n)), { A, notices });
    t.check("A5 a save after the loss works and loads with the loss kept", (await t.saveTo(1)) === true && (await t.loadFrom(1, { quiet: true })) && !!(await J("Story.state().lost.day")));
    await t.eval(LOG);
    // grandpa's first words after it
    const g1 = await t.talkTo(901, []);
    t.check("A6 grandpa after the loss: sad but warm - the house was no pledge, his bed is there, the sołtys sells the hut under the forest, the Ług farm west of Skraj lasu; no blame",
        g1.done && /Dom nie był w zastawie/.test(g1.text) && /chatę pod lasem/i.test(g1.text) && /zagroda Ługów/.test(g1.text) && !/twoja wina/i.test(g1.text) && (await J("Story.state().flags.grandpaLost")) === true, g1.text.slice(0, 400));

    // ================= B. the first walk onto the field: the Lord's men measure it, the sign
    await t.go(3, 30, 13, 4);
    const sceneOn = await t.until("$gameMap.isEventRunning()", 10);
    const n0 = (await J("window.__fl.log")).length;
    let shotSign = false;
    await through(90, async () => {
        if (!shotSign && await t.eval("$gameSelfSwitches.value([3, 703, 'A']) && $gameMessage.isBusy()")) { shotSign = true; await t.frames(10); await t.shot(path.join(SHOTS, "scena_mierzenia.png")); }
    });
    const sceneText = await logFrom(n0);
    const B = await J(`({ scene: Story.state().lost.scene, hook: Story.state().lost.hook, sign: $gameSelfSwitches.value([3, 703, 'A']), b: ${shown(3, 700)}, m: ${shown(3, 701)},
        w: ${shown(3, 702)}, wx: $gameMap.event(702).x, wy: $gameMap.event(702).y, sx: $gameMap.event(703).x, sy: $gameMap.event(703).y, signShown: ${shown(3, 703)} })`);
    t.check("B1 on the field the scene starts by itself: the butler and two guards come, they measure, the sign goes up",
        sceneOn && B.scene === 61 && B.sign && B.signShown, B);
    t.check("B2 the butler's words: the deadline gone, 3 days to carry things off, the buyback 3000 G, the doors under Krucze Skały (the hook)",
        /Termin minął o świcie/.test(sceneText) && /zabierz zwierzęta i psa/.test(sceneText) && /3000 złotych monet/.test(sceneText) && /Kruczych Skał/.test(sceneText) &&
        /Znak stoi\. Własność Lorda Zaleskiego/.test(sceneText) && B.hook === 1, sceneText.slice(0, 600));
    t.check("B3 the butler and the measurer go; the guard stays by the sign", !B.b && !B.m && B.w && Math.abs(B.wx - B.sx) + Math.abs(B.wy - B.sy) <= 2, B);
    await t.locate(B.sx - 2, B.sy + 1, 6);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "znak_na_polu.png"));

    // ================= C. the carrying-out days
    const C = await J(`(function(){ const f = Farming.farm(), list = f.buildings[3], free = [];
        for (let y = 5; y < 25 && !free.length; y++) for (let x = 5; x < 35; x++) { if (Farming.plotAt(x, y) && !Farming.buildingAt(x, y) && $gameMap.eventsXy(x, y).length === 0) { free.push([x, y]); break; } }
        const why = free.length ? Farming.whyNotBuild('chest_s', free[0][0], free[0][1]) : null;
        return { allows: Farming.mapAllowsBuilding(), why, hut: Farming.hutOf() && Farming.hutOf().mapId }; })()`);
    t.check("C1 nothing new on the Lord's field: 'Działka należy teraz do Lorda.' (the hut still the hero's to carry things out of)", !C.allows && C.why === "Działka należy teraz do Lorda." && C.hut === 3, C);
    const dem = await J(`(function(){ const list = Farming.farm().buildings[3], b = list.find(x => x.type === 'scarecrow' && !x.site) || list.find(x => x.type === 'compost' && !x.site);
        if (!b) return null; const n = list.length, ok = Farming.demolish(b); return { type: b.type, ok, n0: n, n1: list.length }; })()`);
    t.check("C2 a building taken down in those days gives its materials back (as always)", dem && dem.ok && dem.n1 === dem.n0 - 1, dem);
    await t.frames(30);
    const sold = await J(`(function(){ const b = Farming.farm().buildings[3].find(x => x.type === 'coop' && !x.site); if (!b) return null;
        const g = Farming.geoOf(b), cell = Farming.cellsOfGeo(g, b.x, b.y).find(c => Farming.solidAt(c.x, c.y)); const m = Farming.menuFor(cell.x, cell.y);
        const names = m.entries.map(e => e.name), e = m.entries.find(x => /^Sprzedaj zwierzęta/.test(x.name)), gold = $gameParty.gold(); if (e) e.run();
        return { names, gold0: gold, gold1: $gameParty.gold(), empty: b.empty, note: Farming.menuFor(cell.x, cell.y).note || null }; })()`);
    t.check("C3 the coop's menu: 'Sprzedaj zwierzęta (24 G)' and 'Zabierz zwierzęta'; sold - the gold, the coop empty", sold && sold.names.includes("Sprzedaj zwierzęta (24 G)") && sold.names.includes("Zabierz zwierzęta") &&
        sold.gold1 === sold.gold0 + 24 && sold.empty === "sold", sold);
    const watch = await t.talkTo(702, []);
    t.check("C4 the guard by the sign: 'Masz jeszcze 3 dni' (day 61)", watch.done && /Masz jeszcze 3 dni/.test(watch.text), watch.text);
    await t.setDay(62, 9);
    await t.frames(20);
    t.check("C5 day 62: the journal says 2 days, the menu foot the buyback", /Wynieś dobytek z działki \(zostały 2 dni\)/.test(await J("Watki.get('fabula').stepTitle()")), await J("Watki.get('fabula').stepTitle()"));

    // ================= D. the dawn of day 64 on the field: shut
    const hutCount = await J("(Farming.farm().buildings[3] || []).length");
    await t.locate(30, 13, 6);
    const n1 = (await J("window.__fl.log")).length;
    await t.popups({ clear: true });
    await t.setDay(64, 6.1);
    const escort = await t.until("$gameMap.isEventRunning()", 10);
    await through(40);
    await t.until(t.onMap(23), 20);
    await t.frames(40);
    const D = await J(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, locked: Story.state().lost.locked, guard: ${shown(23, 704)}, inside: (Farming.farm().buildings[100] || []).length,
        held: ((Farming.farm().buildings[3] || []).find(b => b.type === 'hut') || {}).held, hutOf: Farming.hutOf(), dog: Dog.state(), carryDone: (Watki.get('fabula').ownChecks(), Watki.rekordy().w.fabula.t.done[5] !== undefined),
        held3: Farming.landHeld(3) })`);
    const escText = await logFrom(n1), pop1 = await t.popups({ clear: true });
    t.check("D1 dawn of day 64 on the field: the guard sees him out ('Minęły 3 dni') to Skraj lasu (1,13); 'Działka należy teraz do Lorda.' over the hero",
        escort && D.map === 23 && D.x === 1 && D.y === 13 && D.locked === 64 && /Minęły 3 dni/.test(escText) && pop1.includes("Działka należy teraz do Lorda."), { D: { map: D.map, x: D.x, y: D.y, locked: D.locked }, escText, pop1 });
    t.check("D2 a guard of the Lord at the way in; the carrying-out goal ticked off", D.guard && D.carryDone, { guard: D.guard, carry: D.carryDone });
    t.check("D3 the hut's furniture stays in the hut with the field (Map100 empty for a new hut), the field held: no hut of the hero's now", D.inside === 0 && Array.isArray(D.held) && D.held.length === before.inside && D.hutOf === null && D.held3, { inside: D.inside, held: D.held && D.held.length, hutOf: D.hutOf });
    t.check("D4 the dog comes along (its kennel stays on the field): following the hero on Skraj lasu", D.dog.map === 23 && D.dog.mode === "follow", { map: D.dog.map, mode: D.dog.mode });
    await t.frames(70);
    await t.eval("$gamePlayer.reserveTransfer(3, 78, 13, 4, 0); 0");   // (2026-10-18: the field doubled to 80x60)
    await t.frames(20);
    await t.eval("$gamePlayer.locate(1, 13); $gameMap.event(99).start(); 0");
    await t.frames(30);
    const pop2 = await t.popups({ clear: true });
    t.check("D5 the way onto the field refused (a transfer and the passage event): still Skraj lasu, the popup over the hero", (await t.eval("$gameMap.mapId()")) === 23 && !(await t.eval("$gamePlayer.isTransferring()")) &&
        pop2.includes("Działka należy teraz do Lorda."), pop2);
    await t.locate(2, 13, 4);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "pole_zamkniete.png"));

    // ================= E. the homes: Chata pod lasem (the sołtys) and the burnt farm of the Ług family (D21), rebuilt
    await t.go(8, 82, 50, 8);
    await t.setHour(10);
    await t.calm();
    await t.frames(60);
    await t.gold(300);
    await t.popups({ clear: true });
    // (his own quests out of the way: his talk is then his greeting / usual words, and the item "Domy na sprzedaż" after it)
    await t.eval("(function(){ for (const q of TownQuests.QUESTS) if (q.giver === 'soltys') TownQuests.state().q[q.id] = { s: 'done', step: 0, day: 1, sday: 1, end: 1, t: { done: {} }, times: 1 }; return 0; })()");
    const s1 = await t.talkTo("TownLife.eventOf('soltys')", ["Domy na sprzedaż", "Kup chatę"], { shotAtChoice: path.join(SHOTS, "soltys_domy.png") });
    const popPoor = await t.popups({ clear: true });
    t.check("E1 the sołtys (10:00): his usual talk first, then 'Domy na sprzedaż' - Chata pod lasem for 600 G (and a word of the Ług farm); too little gold - a popup over the hero, nothing bought",
        (s1.choices[0] || []).join() === "Domy na sprzedaż,Do widzenia" && (s1.choices[1] || []).join() === "Kup chatę pod lasem na Podgrodziu (600 G),Nic, dziękuję" &&
        /Chata pod lasem na Podgrodziu/.test(s1.text.replace(/\s+/g, " ")) && /zagroda Ługów/.test(s1.text.replace(/\s+/g, " ")) && popPoor.includes("Za mało złota: 300 / 600 G") && !(await J("Homes.owns('chata')")),
        { choices: s1.choices, popPoor, text: s1.text.slice(0, 400) });
    const chat = await t.talkTo("TownLife.eventOf('soltys')", ["Do widzenia"], { secs: 12 });
    t.check("E1b 'Do widzenia': only his usual words, nothing of the houses", chat.done && (chat.choices[0] || []).join() === "Domy na sprzedaż,Do widzenia" && chat.log.length >= 1 &&
        !chat.log.some(l => /Ratusz\s+słucha|na sprzedaż/.test(l.t)), chat.log.map(l => l.t));
    await t.gold(3000);
    const s2 = await t.talkTo("TownLife.eventOf('soltys')", ["Domy na sprzedaż", "Kup chatę"]);
    const E1 = await J("({ own: Homes.owns('chata'), gold: $gameParty.gold(), furn: (Farming.farm().buildings[154] || []).map(b => b.type + (b.fixed ? '!' : '')), roof: (Watki.get('fabula').ownChecks(), Watki.rekordy().w.fabula.t.done[6] !== undefined), notes: Journal.data().notes.map(n => n.title), forSale: Homes.forSale() })");
    t.check("E2 bought for 600 G: the key, the bed and the chest in the room (fixed), the deed in the journal, the goal 'a new roof' done, nothing more for sale",
        E1.own && E1.gold === 2400 && E1.furn.join() === "bed!,chest_s!" && E1.roof && E1.notes.includes("Akt kupna: Chata pod lasem") && /klucz/i.test(s2.text) && E1.forSale.length === 0, E1);
    // the hut on Podgrodzie's new rows: its door -> the room, and back
    t.check("E3 Podgrodzie is 92 x 112 now (20 rows added at the bottom, then doubled 2026-10-18 by tools/powieksz), <BuildRegion:8>", await t.go(111, 8, 81, 8) &&
        (await J("$gameMap.width() + 'x' + $gameMap.height() + ' ' + Farming.buildRegion()")) === "92x112 8");
    await t.eval("$gameMap.events().find(e => /Chata pod lasem/.test(e.event().name)).start(); 0");
    const inHut = await t.until(t.onMap(154), 20);
    await t.frames(30);
    const R = await J(`({ x: $gamePlayer.x, y: $gamePlayer.y, bed: Farming.menuFor(7, 4).entries.map(e => e.name), chest: Farming.menuFor(9, 4).entries.map(e => [e.name, e.enabled !== false, e.help]) })`);
    t.check("E4 the door 'Chata pod lasem' (8,80) opens now: the room (Map154, landing 4,8); the bed sleeps the night, the chest opens, neither can be taken down",
        inHut && R.x === 4 && R.y === 8 && R.bed.includes("Prześpij noc") && R.chest.some(e => e[0] === "Otwórz") && R.chest.some(e => e[0] === "Rozbierz" && !e[1] && /część domu/.test(e[2])), R);
    await t.locate(6, 6, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "chata_wnetrze.png"));
    await t.eval("$gameMap.eventsXy(4, 9)[0].start(); 0");
    const outHut = await t.until(t.onMap(111), 20);
    await t.frames(30);
    await t.give(80, 10);   // (planks for a small chest)
    const P = await J(`(function(){ let reg = 0, ground = 0; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) if ($gameMap.regionId(x, y) === 8) { reg++; if (Farming.plotAt(x, y)) ground++; }
        const hutWhy = []; let hut = null;
        for (let y = 81; y <= 89 && !hut; y++) for (let x = 17; x <= 33 && !hut; x++) { const w = Farming.whyNotBuild('hut', x, y); if (w === null) hut = [x, y]; else hutWhy.push(w); }
        return { x: $gamePlayer.x, y: $gamePlayer.y, allows: Farming.mapAllowsBuilding(), reg, ground, hut, single: hutWhy.filter(w => /Masz już chatkę/.test(w)).length,
            inPlot: Farming.whyNotBuild('chest_s', 22, 84), outside: Farming.whyNotBuild('chest_s', 11, 86), town: Farming.whyNotBuild('chest_s', 20, 20),
            clean: Object.keys((Farming.farm().stones || {})[111] || {}).length }; })()`);
    t.check("E5 out of the room in front of the hut (8,81); the plot beside it is his own land: 20 x 12 = 240 cells of region 8, ground to build on, a new hut allowed (the old one is the Lord's); nothing outside the plot",
        outHut && P.x === 8 && P.y === 81 && P.allows && P.reg === 240 && P.ground >= 230 && !!P.hut && P.single === 0 && P.inPlot === null && P.outside !== null && P.town !== null, P);
    t.check("E5b the plot clean at the purchase: whatever wild grew there gone that day (it grows back as anywhere)", P.clean >= 240, P.clean);
    const built = await J("(function(){ return Farming.build('chest_s', 22, 84); })()");
    await t.frames(90);
    t.check("E6 a chest built on the plot", built && (await J("(Farming.farm().buildings[111] || []).some(b => b.type === 'chest_s' && !b.site)")), built);
    await t.locate(15, 82, 6);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "chata_pod_lasem.png"));

    // ---- the burnt farm: the way from Skraj lasu, the ruin, the quest D21
    await t.go(23, 2, 7, 4);
    const way = await J("({ sign: ($gameMap.event(709) || { characterName: () => '' }).characterName(), way: [706, 707, 708].map(id => { const e = $gameMap.event(id); return e ? e.x + ',' + e.y : null; }) })");
    await t.locate(1, 7, 4);
    await t.frames(10);
    await t.shot(path.join(SHOTS, "zagroda_wejscie.png"));
    await t.eval("$gameMap.event(707).start(); 0");
    const onFarm = await t.until(t.onMap(168), 20);
    await t.frames(40);
    const Z0 = await J("(function(){ const e = $gameMap.events().find(x => /^<Zagroda:dom>/.test(x.event().note)); return { x: $gamePlayer.x, y: $gamePlayer.y, pic: e.characterName(), d: e.direction(), p: e.pattern(), id: e.eventId(), allows: Farming.mapAllowsBuilding(), smoke: $gameSelfSwitches.value([168, 711, 'A']) }; })()");
    t.check("E7 Skraj lasu's west edge (rows 6-8, Homes' events with the signpost) -> the burnt farm (Map168, 98,12 - the map doubled 2026-10-18): the house a ruin (stage 0), no smoke; not his land",
        way.sign === "!$Drogowskaz" && way.way.join() === "0,6,0,7,0,8" && onFarm && Z0.x === 98 && Z0.y === 12 && Z0.pic === "!$Zagroda_Dom" && Z0.d === 2 && Z0.p === 0 && !Z0.smoke && !Z0.allows, { way, Z0 });
    await t.locate(20, 12, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "zagroda_przed.png"));
    await t.popups({ clear: true });
    await t.notices({ clear: true });
    await t.locate(20, 10, 8);
    await t.eval(`$gameMap.event(${Z0.id}).start(); 0`);
    await t.frames(30);
    await t.eval("TownQuests.autoChecks(); 0");
    const popRuin = await t.popups({ clear: true }), ntRuin = await t.notices({ clear: true });
    const d21a = await J("TownQuests.rec('D21')");
    t.check("E8 the ruin looked at: a popup over the hero, the quest D21 'Spalona zagroda' starts by itself (Józek Łata first)",
        popRuin.some(p => /Zgliszcza domu/.test(p)) && !!d21a && d21a.s === "active" && d21a.step === 0 && ntRuin.some(n => /Spalona zagroda/.test(n)), { popRuin, d21a, ntRuin });
    // Józek, Marta, the sołtys
    await t.go(111, 43, 30, 2);
    await t.setHour(10);
    await t.frames(60);
    const jo = await t.talkTo("TownLife.eventOf('szmaciarz')", []);
    t.check("E9 Józek Łata tells it: the Ług family, the loan from the old Zaleski, the fire; the widow Marta washes on Podgrodzie", jo.done && /Ługów/.test(jo.text) && /Marta/.test(jo.text) &&
        (await J("TownQuests.rec('D21').step")) === 1, jo.text.slice(0, 400));
    const ma = await t.talkTo("TownLife.eventOf('praczka')", []);
    t.check("E10 Marta: no going back there ('tylko popiół i grób'), but she would like smoke from the chimney again; the sołtys keeps the book", ma.done && /popiół i grób/.test(ma.text) && /dym/.test(ma.text) &&
        (await J("TownQuests.rec('D21').step")) === 2, ma.text.slice(0, 400));
    await t.go(8, 82, 50, 8);
    await t.setHour(11);
    await t.calm();
    await t.frames(60);
    await t.gold(200);
    await t.popups({ clear: true });
    const so1 = await t.talkTo("TownLife.eventOf('soltys')", []);
    const popGold = await t.popups({ clear: true });
    t.check("E11 the sołtys without the money: the old law (fallow over 5 years - back to the family), 350 G either way; a popup over the hero",
        so1.done && /odłogiem/.test(so1.text) && /350 G/.test(so1.text) && popGold.includes("Potrzebujesz 350 G") && (await J("TownQuests.rec('D21').step")) === 2 && !(await J("Homes.owns('zagroda')")), { text: so1.text.slice(0, 500), popGold });
    await t.gold(1000);
    const op0 = await J("TownQuests.opinion()");
    const so2 = await t.talkTo("TownLife.eventOf('soltys')", ["Przez Martę"], { shotAtChoice: path.join(SHOTS, "zagroda_soltys.png") });
    const D2 = await J("({ own: Homes.owns('zagroda'), how: Homes.state().zag.how, gold: $gameParty.gold(), op: TownQuests.opinion(), flag: TownQuests.state().flags.d21Marta, step: TownQuests.rec('D21').step, notes: Journal.data().notes.map(n => n.title) })");
    t.check("E12 'Przez Martę': 350 G, the deed (the old law - the money to her), Opinion +5; the farm his",
        so2.done && (so2.choices[0] || []).length === 2 && D2.own && D2.how === "marta" && D2.gold === 650 && D2.op === op0 + 5 && D2.flag && D2.step === 3 && D2.notes.includes("Akt własności: Zagroda Ługów"), { D2, choices: so2.choices });
    // the farm his own: the land, clean
    await t.go(168, 20, 12, 8);
    await t.frames(30);
    const L = await J(`(function(){ let reg = 0, ground = 0, free = null; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) if ($gameMap.regionId(x, y) === 8) { reg++; if (Farming.plotAt(x, y)) { ground++; if (!free && y > 20 && Farming.whyNotBuild('chest_s', x, y) === null) free = [x, y]; } }
        return { reg, ground, free, allows: Farming.mapAllowsBuilding(), north: Farming.whyNotBuild('chest_s', 20, 3), clean: Object.keys((Farming.farm().stones || {})[168] || {}).length,
            bushes: Object.values((Farming.farm().bushes || {})[168] || {}).filter(b => b.stage === 'gone').length }; })()`);
    t.check("E13 the farm's land his now: ~780 cells of region 8 (yard and field), ground to build on, nothing outside it; clean at the purchase",
        L.reg >= 700 && L.reg <= 800 && L.ground >= L.reg - 60 && L.allows && !!L.free && L.north !== null && L.clean >= L.reg && L.bushes >= L.reg, L);
    // the ruin cleared: the menu, the tool, blows
    await t.eval("$gameSystem.setStamina(100); $gameParty.gainItem($dataItems[62], 1); $gameParty.gainItem($dataItems[89], 1); 0");
    const items0 = await J("[64, 61, 88].map(id => $gameParty.numItems($dataItems[id]))");
    await t.locate(20, 10, 8);
    await t.frames(10);
    const menu0 = await J("Homes.houseMenu()");
    const began = await J("Homes.begin()");
    await t.until("!$gamePlayer._toolSwing", 5);
    for (let i = 0; i < 2; i++) { await t.eval("Homes.strike('house'); 0"); await t.frames(10); await t.until("!$gamePlayer._toolSwing", 5); }
    const w3 = await J("Homes.work()");
    await t.eval("Homes.work().done = Homes.work().need - 1; $gameSystem.setStamina(100); Homes.strike('house'); 0");
    await t.until("!$gamePlayer._toolSwing", 5);
    await t.frames(20);
    const S1 = await J(`(function(){ const e = $gameMap.event(${Z0.id}); return { stage: Homes.stage(), d: e.direction(), p: e.pattern(), items: [64, 61, 88].map(id => $gameParty.numItems($dataItems[id])), konik: TownQuests.vcount('konik'), step: TownQuests.rec('D21').step }; })()`);
    t.check("E14 the ruin's menu ('Uprzątnij zgliszcza', 30 blows); the shovel's blows count; cleared: stage 1 (its picture), Kamień ×12, Drewno ×6, Gwoździe ×6 and Franek's charred toy horse",
        menu0 && menu0.entries[0].name === "Uprzątnij zgliszcza" && began && w3 && w3.done === 3 && w3.need === 30 && S1.stage === 1 && S1.d === 2 && S1.p === 1 &&
        S1.items[0] === items0[0] + 12 && S1.items[1] === items0[1] + 6 && S1.items[2] === items0[2] + 6 && S1.konik === 1 && S1.step === 4, { menu0: menu0 && menu0.entries.map(e => e.name), began, w3, S1, items0 });
    // the toy back to Marta
    await t.go(111, 43, 30, 2);
    await t.frames(40);
    const op1 = await J("TownQuests.opinion()");
    const ma2 = await t.talkTo("TownLife.eventOf('praczka')", []);
    t.check("E15 the toy horse to Marta (Opinion +2): Jan carved it for Franek", ma2.done && /wystrugał/.test(ma2.text) && (await J("TownQuests.vcount('konik')")) === 0 &&
        (await J("TownQuests.opinion()")) === op1 + 2 && (await J("TownQuests.rec('D21').step")) === 5, ma2.text.slice(0, 300));
    // the next stages: materials taken at the start (a missing one: a popup over the hero), then the blows
    await t.go(168, 20, 10, 8);
    await t.frames(20);
    await t.eval("$gameParty.loseItem($dataItems[64], 999); $gameParty.loseItem($dataItems[164], 999); $gameParty.gainItem($dataItems[64], 5); 0");
    await t.popups({ clear: true });
    const noMat = await J("Homes.begin()");
    const popMat = await t.popups({ clear: true });
    await t.eval("$gameParty.gainItem($dataItems[64], 30); $gameParty.gainItem($dataItems[164], 8); $gameSystem.setStamina(100); 0");
    const began2 = await J("Homes.begin()");
    await t.until("!$gamePlayer._toolSwing", 5);
    const M2 = await J("({ work: Homes.work(), stone: $gameParty.numItems($dataItems[64]), clay: $gameParty.numItems($dataItems[164]) })");
    await t.eval("Homes.work().done = Homes.work().need - 1; $gameSystem.setStamina(100); Homes.strike('house'); 0");
    await t.until("!$gamePlayer._toolSwing", 5);
    await t.frames(10);
    t.check("E16 'Podmurówka': without the materials - popups over the hero (Kamień 5/30, Mokra glina 0/8); with them - taken (30 + 8), hammered: stage 2",
        noMat === false && popMat.includes("Brakuje: Kamień 5/30") && popMat.includes("Brakuje: Mokra glina 0/8") && began2 && M2.work.need === 30 && M2.stone === 5 && M2.clay === 0 &&
        (await J("Homes.stage()")) === 2, { popMat, M2 });
    // (the walls and the roof: the same; the last stage worked for real)
    await t.eval("Homes.setStage(4); $gameParty.gainItem($dataItems[80], 12); $gameParty.gainItem($dataItems[86], 4); $gameParty.gainItem($dataItems[84], 12); $gameSystem.setStamina(100); 0");
    await t.notices({ clear: true });
    const began5 = await J("Homes.begin()");
    await t.until("!$gamePlayer._toolSwing", 5);
    await t.eval("Homes.work().done = Homes.work().need - 1; $gameSystem.setStamina(100); Homes.strike('house'); 0");
    await t.until("!$gamePlayer._toolSwing", 5);
    await t.frames(30);
    await t.eval("TownQuests.autoChecks(); 0");
    const S5 = await J(`(function(){ const e = $gameMap.event(${Z0.id}); return { stage: Homes.stage(), d: e.direction(), p: e.pattern(), smoke: $gameSelfSwitches.value([168, 711, 'A']), furn: (Farming.farm().buildings[169] || []).map(b => b.type + (b.fixed ? '!' : '')).sort(),
        d21: TownQuests.rec('D21').s, notes: Journal.data().notes.map(n => n.title), roof: Watki.rekordy().w.fabula.t.done[6] !== undefined }; })()`);
    const nt5 = await t.notices({ clear: true });
    t.check("E17 'Drzwi, okiennice, palenisko' done: stage 5 - the house stands (its picture), smoke from the chimney, the bed, the big chest and the larder inside; D21 done",
        began5 && S5.stage === 5 && S5.d === 4 && S5.p === 2 && S5.smoke && S5.furn.join() === "bed!,chest_l!,larder!" && S5.d21 === "done" && S5.notes.includes("Dom Ługów odbudowany") &&
        nt5.some(n => /Zadanie wykonane: Spalona zagroda/.test(n)), { S5, nt5 });
    // the stages' pictures
    await t.locate(20, 12, 8);
    for (let s = 0; s <= 5; s++) { await t.eval(`Homes.setStage(${s}); 0`); await t.frames(20); await t.shot(path.join(SHOTS, "zagroda_etap_" + s + ".png")); }
    await t.frames(30);
    await t.shot(path.join(SHOTS, "zagroda_po.png"));
    // in through the new door
    await t.locate(20, 10, 8);
    await t.eval(`$gameMap.event(${Z0.id}).start(); 0`);
    const inFarm = await t.until(t.onMap(169), 20);
    await t.frames(30);
    const H = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, bed: Farming.menuFor(9, 4).entries.map(e => e.name) })");
    await t.locate(6, 6, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "dom_lugow_wnetrze.png"));
    await t.eval("$gameMap.eventsXy(6, 9)[0].start(); 0");
    const outFarm = await t.until(t.onMap(168), 20);
    await t.frames(20);
    const back168 = await J("[$gamePlayer.x, $gamePlayer.y].join()");
    t.check("E18 the house's door -> its room (Map169 'Dom Ługów', landing 6,8, the bed sleeps), out -> before the house (20,10)",
        inFarm && H.x === 6 && H.y === 8 && H.bed.includes("Prześpij noc") && outFarm && back168 === "20,10", { H, back168 });
    // the old well: dug out - dry
    await t.locate(13, 11, 8);
    await t.frames(10);
    const wm = await J("Homes.wellMenu().entries[0].name");
    await t.eval("Homes.state().zag.well = 14; $gameSystem.setStamina(100); Homes.strike('well'); 0");
    await t.until("!$gamePlayer._toolSwing", 5);
    await t.frames(20);
    const nWell = await t.notices({ clear: true });
    t.check("E19 the old well dug out (15 blows of the shovel): dry - no water (the drought rule)", wm === "Odkop studnię" && !!(await J("Homes.state().zag.wellDone")) &&
        nWell.some(n => /Studnia odkopana/.test(n)) && (await J("Journal.data().notes.some(n => n.title === 'Studnia Ługów')")), { wm, nWell });
    // Marta at her husband's grave (every 7th day, 15-18)
    const dg = await J("(function(){ let d = $gameSystem._dayNightDay; while (d % 7 !== 3) d++; return d; })()");
    await t.setDay(dg, 16);
    await t.frames(80);
    const MG = await J("({ on: $gameSelfSwitches.value([168, 712, 'A']), shown: (function(){ const e = $gameMap.event(712); return !!e && e.characterName() === '$Npc_Praczka' && !e.isTransparent(); })(), away: TownLife.absent('praczka') })");
    await t.locate(31, 6, 6);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "marta_przy_grobie.png"));
    const mg = await t.talkTo(712, []);
    t.check("E20 Marta at Jan Ług's cross (day " + dg + ", 16:00) - away from Podgrodzie meanwhile; her words of the smoke from the chimney",
        MG.on && MG.shown && MG.away && mg.done && mg.text.length > 20, { MG, text: mg.text });
    await t.setHour(19);
    await t.frames(80);
    t.check("E20b at 19:00 she is gone home", !(await J("$gameSelfSwitches.value([168, 712, 'A'])")) && !(await J("TownLife.absent('praczka')")));

    // ================= F. W4 after the lost chapter; the Heart's Lord
    await t.eval("TownQuests.autoChecks(); 0");
    await t.frames(10);
    const w4 = await J("TownQuests.rec('W4')");
    t.check("F1 W4 'Krew kasztelana' begins after chapter 1 lost (not only after the debt paid)", !!w4 && w4.s === "active", w4);
    const W = await J("(function(){ const w = Underground.world(); return { lost: w.fieldLost, back: w.fieldBack, stance: w.lord.stance }; })()");
    t.check("F2 the Heart's world: the field lost and not bought back - the Lord a rival", W.lost && !W.back && W.stance === "rival", W);

    // ================= G. the buyback
    await t.go(24, 26, 15, 8);
    await t.setHour(10);
    await t.calm();
    await t.frames(60);
    await t.gold(700);
    // (the chapter's thread: the tavern's cellar reached - its clue - and on to the buyback, its last step)
    await t.eval("Story.step('cellar'); Watki.get('fabula').ownChecks(); 0");
    const lord = await t.talkTo(902, ["Oddaj 500 G"], { shotAtChoice: path.join(SHOTS, "oferta_odkupu.png") });
    const G1 = await J("({ paid: Story.state().buy.paid, flag: Story.state().flags.lordLost, krok: Watki.krok('fabula'), title: Watki.get('fabula').stepTitle() })");
    t.check("G1 the Lord after the loss: he sells the field back for 3000 G in instalments, no deadline; 500 G paid", lord.done && /Odsprzedam je: 3000/.test(lord.text) && /Bez terminu/.test(lord.text) &&
        G1.paid === 500 && G1.flag && G1.krok === "odkup" && G1.title === "Odkup działkę dziadka (500 / 3000 G)", { text: lord.text.slice(0, 500), G1 });
    await t.gold(3000);
    await t.notices({ clear: true });
    const got = await J("Story.pay(2500)");
    await t.frames(20);
    const back = await J(`({ done: Story.state().buy.done, back: Story.fieldBack(), lost: Story.fieldLost(), inside: (Farming.farm().buildings[100] || []).length, field: (Farming.farm().buildings[3] || []).length,
        boarded: (Farming.farm().buildings[3] || []).some(b => b.boarded), hutOf: Farming.hutOf() && Farming.hutOf().mapId, sign: $gameSelfSwitches.value([3, 703, 'A']), guard: $gameSelfSwitches.value([23, 704, 'A']),
        notes: Journal.data().notes.map(n => n.title), goal: (Watki.get('fabula').ownChecks(), Watki.rekordy().w.fabula.s === "done" && Watki.rekordy().w.fabula.t.done[8] !== undefined), world: Underground.world().fieldBack })`);
    const backNotices = await t.notices();
    t.check("G2 the last 2500 G: the field back - every building left on it there again, the hut's furniture back inside, the hut the hero's",
        got === 2500 && back.done && back.back && !back.lost && back.field === hutCount && back.inside === before.inside && !back.boarded && back.hutOf === 3, back);
    t.check("G3 the sign and the guards gone, the deed 'Akt odkupu działki', the goal done, the top notice; the Heart's world: bought back",
        !back.sign && !back.guard && back.notes.includes("Akt odkupu działki") && back.goal && back.world && backNotices.some(n => /Działka dziadka znowu wasza/.test(n)), { back, backNotices });
    t.check("G4 the way onto the field open again", await t.go(23, 2, 13, 4) && (await t.go(3, 37, 13, 4)));
    await t.go(19, 8, 7, 8);
    await t.setHour(12);
    const soup0 = await t.count(131);
    const g2 = await t.talkTo(901, []);
    t.check("G5 grandpa thanks for the buyback (the deed, two kapuśniaki)", g2.done && /akt odkupu/.test(g2.text) && (await t.count(131)) === soup0 + 2, g2.text.slice(0, 300));
});
