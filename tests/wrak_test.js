// PAKIET E „Wrak na mieliźnie” i rozbitek w tawernie (docs/miejsca_wyspy/PAKIETY.md): Wrak_Data.js + Wrak.js + mapy 165/166.
// Sprawdza: dane (mieszkaniec 948, D25, W12, numery 670-679, popiersie), mapę 165 z pływami (pierścienie łachy pod wodą w
// przypływie, zamknięte dla chodzenia, woda rysowana na kafelkach, bohater zepchnięty na suchy piach), łachę do garnizonu w
// odpływie (przejście dopiero gdy Wyspa.isReady(162)), łódź Janka (rozmowa na przystani -> wrak -> z powrotem), żołnierzy z
// kara bez glejtu, zejście pod pokład (szczury, szkielet bosmana pod wodą / klucz w odpływie, drzwi kajuty, biurko i skrzynia:
// przedmiot 178, flagi dziennikOkretu i kronikaKarta4), kamienie z krukiem (D25 kończy się), rozbitka w tawernie (pierwsze
// spotkanie, portret), poszlaki W12 (dziennik, Józek Łata, studnia nocą) i rozmowę w cztery oczy, znaki mapy na kompasie.
// Zrzuty: docs/miejsca_wyspy/wrak_*.png.
// Uruchom: CDP_PORT=9505 GAME_OVERLAY=tools/miejsca_wyspy/staging_E node tests/wrak_test.js   (serwer: node tools/serve.js)
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miejsca_wyspy");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    // ---------------------------------------------------------------- dane
    const base = await t.json(`(function(){ const r = TownLife.RESIDENTS.find(x => x.key === "rozbitek");
        return { wrak: !!window.Wrak && !Wrak.skeleton, data: !!(window.WrakData && WrakData.FLOOD), inj: Tawerna.inject.list().filter(x => x.owner === "Wrak").map(x => x.ids),
            res: r ? [r.id, r.sheet, TownLife.homeOf(r), r.name] : null, q: [!!TownQuests.Q.D25, !!TownQuests.Q.W12, TownQuests.Q.D25 && TownQuests.Q.D25.giver],
            seat: Object.entries(TownLifeData.SPOTS_BY_MAP[1] || {}).find(([k, v]) => v === WrakData.SPOT_TAVERN), rooms: TownLifeData.SPOTS_BY_MAP[25] && TownLifeData.SPOTS_BY_MAP[25].rozbitek_wnetrze,
            bust: SpeechBubbles.BUSTS["$Npc_Rozbitek:0"], vitems: ["dziennik_okretu", "kamien_kruk", "klucz_bosmana"].every(k => !!TownQuestsData.VITEMS[k]) }; })()`);
    t.check("wtyczki pakietu E działają (Wrak.js nie jest już szkieletem), numery 670-679 należą do „Wrak”",
        base.wrak && base.data && base.inj.some(s => /670-679/.test(s)), base);
    t.check("rozbitek „Eryk Sowa” to mieszkaniec 948 z własnym arkuszem, żyje w miasteczku (Map220), miejsce w tawernie i w Pokojach gości z danych",
        base.res && base.res[0] === 948 && base.res[1] === "$Npc_Rozbitek" && base.res[2] === 220 && !!base.seat && !!base.rooms, base);
    t.check("zadania D25 (od Rocha) i W12 dochodzą do TownQuests, rzeczy wirtualne też; popiersie Rozbitek_Bust",
        base.q[0] && base.q[1] && base.q[2] === "przemytnik" && base.vitems && base.bust === "Rozbitek_Bust", base);

    // ---------------------------------------------------------------- (2026-11-16) the new world: the wreck „Pomyślność” lies on the beach
    // of Słony Brzeg (Map219); the old shoal map with the tides on the sandbar, Janek's boat and the soldiers is out of the game
    const DAY = 16;
    await t.newGame({ map: 219, x: 20, y: 39, dir: 8, day: DAY, hour: 8, quiet: true, minimap: false });
    const lows = await t.json(`Wyspa.lowWaters(${DAY})`);
    const LOW = lows.find(h => h >= 6 && h <= 18) || lows[0], HIGH = (LOW + 6.2) % 24;
    await t.frames(40);
    const brzeg = await t.json(`({ wrak: $gameMap.events().some(e => /^Wrak/.test(e.event().name)), drzwi: (function(){ const e = $gameMap.events().find(e => /^Drzwi: Ładownia/.test(e.event().name)); return e ? [e.x, e.y] : null; })(),
        been: Wrak.state().been, d25: TownQuests.rec("D25") })`);
    t.check("Słony Brzeg: wrak „Pomyślność” na plaży, wejście do ładowni (20,36); sam widok wraku niczego jeszcze nie zaczyna", brzeg.wrak && brzeg.drzwi && brzeg.drzwi.join() === "20,36" && !brzeg.been, brzeg);
    await t.eval(`(function(){ const s = TownQuests.state(); s.flags.janekMet = s.flags.janekMet || 1; s.flags.rochMet = s.flags.rochMet || 1; return 0; })()`);

    // ---------------------------------------------------------------- pod pokład: dziura w burcie
    await t.go(219, 20, 38, 8);   // (the breach in the side of „Pomyślność”: the door at 20,36)
    await t.setHour(HIGH);
    await t.frames(10);
    await t.hold("up", 75);
    const down = await t.until("$gameMap.mapId() === 166 && !$gamePlayer.isTransferring()", 15);
    await t.frames(40);
    const m166 = await t.json(`({ at: [$gamePlayer.x, $gamePlayer.y], name: $dataMap.displayName, rats: (Creatures.list || []).filter(c => c._tag === "wrak" && !c._dead).length,
        skel: (function(){ const e = $gameMap.events().find(e => /<Wrak:szkielet>/.test(e.event().note)); return e ? [e.eventId(), e.x, e.y, Wrak.floodedAt(e.x, e.y), e.opacity()] : null; })() })`);
    t.check("wejście w burcie „Pomyślności” prowadzi pod pokład (Map166, 4,11); w ładowni szczury (Creatures)",
        down && m166.at[0] === 4 && m166.at[1] === 11 && m166.rats >= 1, m166);
    const first = await t.json(`({ been: Wrak.state().been, flag: !!TownQuests.state().flags.wrakByl, d25: TownQuests.rec("D25") })`);
    t.check("pierwszy raz pod pokładem: D25 zaczyna się samo i od razu ma za sobą krok „dostań się na wrak”", first.been > 0 && first.flag && first.d25 && first.d25.s === "active" && first.d25.step >= 1, first);
    await t.eval("Creatures.clear('wrak'); 0");
    t.check("w przypływie szkielet bosmana leży pod wodą (pole zamknięte, widać go przez wodę)", m166.skel && m166.skel[3] && m166.skel[4] < 255, m166.skel);
    await t.eval(`window.__kit.pops.length = 0; Wrak.act({ eventId: () => ${m166.skel ? m166.skel[0] : 0} }, ["szkielet"]); 0`);
    const wet = await t.popups();
    t.check("...i klucza nie da się wtedy zabrać (popup: trzeba poczekać na niską wodę)", wet.some(p => /pod wodą/.test(p)) && !(await t.eval("Wrak.state().key")), wet);
    await t.locate(12, 7, 6);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "wrak_poklad.png"));

    // ---------------------------------------------------------------- klucz w odpływie, kajuta
    await t.setHour(LOW);
    await t.frames(70);
    const skelTalk = await t.talkTo(m166.skel[0], [], { secs: 20 });
    const key = await t.json(`({ key: Wrak.state().key, v: TownQuests.vcount("klucz_bosmana"), d25: TownQuests.rec("D25").step })`);
    t.check("w odpływie dolna ładownia sucha: przy szkielecie klucz bosmana (D25: następny krok)", key.key > 0 && key.v === 1 && key.d25 >= 2, { key, text: skelTalk.text });
    const doorId = await t.json(`$gameMap.events().find(e => /<Wrak:drzwi>/.test(e.event().note)).eventId()`);
    await t.talkTo(doorId, [], { secs: 20 });
    const door = await t.json(`({ open: $gameSelfSwitches.value([166, ${doorId}, "A"]) })`);
    t.check("kluczem bosmana otwiera się drzwi kajuty kapitana", door.open, door);
    await t.locate(4, 5, 8);
    await t.frames(10);
    const deskId = await t.json(`$gameMap.events().find(e => /<Wrak:biurko>/.test(e.event().note)).eventId()`);
    await t.talkTo(deskId, [], { secs: 20 });
    const chestId = await t.json(`$gameMap.events().find(e => /<Wrak:skrzynia>/.test(e.event().note)).eventId()`);
    await t.talkTo(chestId, [], { secs: 20 });
    await t.frames(20);
    const loot = await t.json(`({ map: $gameParty.numItems($dataItems[178]), log: TownQuests.vcount("dziennik_okretu"), stones: TownQuests.vcount("kamien_kruk"), coins: TownQuests.vcount("monety_oko"),
        f: ["dziennikOkretu", "kronikaKarta4"].map(k => !!TownQuests.state().flags[k]), d25: TownQuests.rec("D25").step, clues: Wrak.clues() })`);
    t.check("biurko i skrzynia kapitana: Mapa z zaznaczeniami (178), dziennik okrętu, 5 kamieni z krukiem, monety z okiem; flagi dziennikOkretu i kronikaKarta4",
        loot.map === 1 && loot.log === 1 && loot.stones === 5 && loot.coins === 1 && loot.f.every(Boolean) && loot.d25 === 3 && !!loot.clues.dziennik, loot);
    await t.locate(4, 5, 8);
    await t.frames(260);   // (the loot's notes fade first)
    await t.shot(path.join(SHOTS, "wrak_kajuta.png"));

    // ---------------------------------------------------------------- kamienie z krukiem: rozmowa (dziadek) i sprzedaż Baltazarowi
    const st = await t.json(`(function(){ const q = TownQuests.Q.D25, r = TownQuests.rec("D25"), s = q.steps[r.step], spk = { id: -1, name: "x" };
        return ["celnik", "kupiec", "grandpa", "kowal"].map(k => { const h = TownQuests.FX[s.talk].talk(q, r, s, k, spk); return [k, !!(h && h.ready && h.list.length)]; }); })()`);
    const g1 = await t.gold();
    await t.eval(`$gameSystem.setDayNightHour(11); TownQuests.act(null, ["D25", "fx", "d25Kamienie", "kupiec"]); 0`);
    const sold25 = await t.json(`({ d25: TownQuests.rec("D25").s, gold: $gameParty.gold(), stones: TownQuests.vcount("kamien_kruk"), f: !!TownQuests.state().flags.wrakKamienieBaltazar })`);
    t.check("kamienie: celnik, Baltazar i dziadek mają rozmowę (kowal nie); sprzedane Baltazarowi - 75 G i D25 wykonane",
        st.filter(s => s[1]).map(s => s[0]).join() === "celnik,kupiec,grandpa" && sold25.d25 === "done" && sold25.gold === g1 + 75 && sold25.stones === 0 && sold25.f, { st, sold25, g1 });

    // ---------------------------------------------------------------- rozbitek w tawernie: pierwsze spotkanie, portret
    await t.go(1, 14, 30, 8);
    await t.setHour(14);
    await t.frames(40);
    const ery = await t.json(`(function(){ const e = TownLife.eventOf("rozbitek"); return e ? [e.eventId(), e.x, e.y, !!(e._town && e._town.hidden), e.characterName()] : null; })()`);
    // (2026-10-24: the user's rebuilt tavern has its own "Miejsce: gosc_N" markers - the map's marker wins over the data's stool, as for
    // every guest; the seat is wherever TownLife puts that key on Map001)
    const seat = await t.json(`(function(){ const e = Object.entries(TownLifeData.SPOTS_BY_MAP[1]).find(([k, v]) => v === WrakData.SPOT_TAVERN); return e ? [e[0], TownLife.spot(e[0]) || e[1]] : null; })()`);
    t.check("o 14 rozbitek siedzi w tawernie na wolnym stołku (miejsce gościa z danych albo ze znacznika „Miejsce: gosc_N” mapy)",
        ery && seat && !ery[3] && ery[1] === seat[1][0] && ery[2] === seat[1][1] && ery[4] === "$Npc_Rozbitek", { ery, seat });
    await t.gold(10);
    const meet = await t.talkTo(ery[0], ["Narysuj"], { secs: 40, shotAtChoice: path.join(SHOTS, "wrak_rozbitek.png") });
    const met = await t.json(`({ met: Wrak.state().met, gold: $gameParty.gold(), portret: TownQuests.vcount("portret"), w12: TownQuests.rec("W12") })`);
    t.check("pierwsza rozmowa: „Portret? Dwa grosze albo piwo.”, portret za 2 G; z poszlaką z dziennika zaczyna się wątek W12",
        /Dwa grosze/.test(meet.text) && met.met > 0 && met.gold === 8 && met.portret === 1 && met.w12 && met.w12.s === "active" && met.w12.step === 0, { text: meet.text, met });
    const bustOk = await t.json(`(function(){ const e = $gameMap.event(${ery[0]}); return SpeechBubbles.bustOf ? SpeechBubbles.bustOf(e) : null; })()`);
    t.check("...w rozmowie popiersie rozbitka (Rozbitek_Bust)", meet.log.some(l => l.who === ery[0] && l.bust) && /Rozbitek_Bust/.test(JSON.stringify(bustOk)), { bustOk, log: meet.log.slice(0, 3) });

    // ---------------------------------------------------------------- poszlaka u Józka Łaty (Podgrodzie)
    await t.go(await t.json(`(function(){ const r = TownLife.RESIDENTS.find(x => x.key === "szmaciarz"); return r && r.map ? r.map : 218; })()`), 46, 42, 2);
    await t.setHour(11);
    await t.frames(40);
    const jozekTalk = await t.talkTo(`TownLife.eventOf("szmaciarz")`, ["Nie"], { secs: 30 });
    const c2 = await t.json(`({ clues: Wrak.clues(), w12: TownQuests.rec("W12") })`);
    t.check("Józek Łata opowiada o płaszczu i groszu z okiem: druga poszlaka, W12 przechodzi do rozmowy w cztery oczy",
        /okiem/.test(jozekTalk.text) && !!c2.clues.jozek && c2.w12.step === 1, { text: jozekTalk.text, c2 });

    // ---------------------------------------------------------------- nocą przy studni: tatuaż (skradanie / zza pleców)
    await t.go(220, 50, 43, 4);
    await t.setHour(22.3);
    await t.frames(60);
    const wellEv = await t.json(`(function(){ const e = TownLife.eventOf("rozbitek"); return e ? [e.x, e.y, e.direction(), !!(e._town && e._town.hidden)] : null; })()`);
    if (wellEv) await t.locate(wellEv[0] + (wellEv[2] === 4 ? 2 : -2), wellEv[1], wellEv[2] === 4 ? 4 : 6);
    await t.until("!!Wrak.clues().tatuaz", 8);
    const c3 = await t.json("Wrak.clues()");
    t.check("nocą przy studni (22-23) Eryk myje się z podwiniętym rękawem: bohater zza pleców widzi tatuaż oka", wellEv && !wellEv[3] && !!c3.tatuaz, { wellEv, c3 });

    // ---------------------------------------------------------------- rozmowa w cztery oczy (dochowaj tajemnicy)
    await t.go(1, 14, 30, 8);
    await t.setHour(14.5);
    await t.frames(40);
    const opts = await t.talkTo(`TownLife.eventOf("rozbitek")`, ["Zachowam"], { secs: 40 });
    const w12 = await t.json(`({ w12: TownQuests.rec("W12"), ally: !!TownQuests.state().flags.ansgarAlly, given: !!TownQuests.state().flags.ansgarGiven, gone: TownLife.gone("rozbitek") })`);
    const labels = opts.choices.find(c => c.some(l => /Zachowam/.test(l))) || [];
    t.check("rozmowa w cztery oczy: „Ansgar Wiel”; wybory: wydać, zachować, fałszywa mapa (ucieczka kutrem tylko po D20); „Zachowam” - sojusznik, W12 wykonane",
        /Ansgar Wiel/.test(opts.text) && w12.w12.s === "done" && w12.ally && !w12.given && !w12.gone && JSON.stringify(labels).indexOf("Roch") < 0, { text: opts.text.slice(-300), w12, labels, missing: opts.missing, choices: opts.choices });

    // ---------------------------------------------------------------- inne zakończenia W12 (stan cofnięty do rozmowy w cztery oczy)
    const back12 = `(function(){ const s = TownQuests.state(), r = s.q.W12; r.s = "active"; r.step = 1; for (const k of ["ansgarAlly", "ansgarGiven", "ansgarFled", "wrakPodwojnaGra", "wrakMapaSprzedana"]) delete s.flags[k];
        TownLife.setGone("rozbitek", false); return 0; })()`;
    await t.eval(back12);
    const g12 = await t.gold();
    await t.eval(`TownQuests.act(null, ["W12", "fx", "w12Talk", "given"]); 0`);
    const given = await t.json(`({ s: TownQuests.rec("W12").s, f: !!TownQuests.state().flags.ansgarGiven, gone: TownLife.gone("rozbitek"), gold: $gameParty.gold() })`);
    t.check("W12 a) wydany garnizonowi: flaga ansgarGiven, Eryk znika na zawsze, 80 G", given.s === "done" && given.f && given.gone && given.gold === g12 + 80, { given, g12 });
    await t.eval(back12);
    await t.eval(`TownQuests.act(null, ["W12", "fx", "w12Talk", "double"]); 0`);
    const dbl = await t.json(`({ r: TownQuests.rec("W12"), v: TownQuests.vcount("falszywa_mapa"), talk: (function(){ const q = TownQuests.Q.W12, r = TownQuests.rec("W12"); const h = TownQuests.FX.w12Map.talk(q, r, q.steps[r.step], "kupiec", { id: -1, name: "Baltazar" }); return !!(h && h.ready); })() })`);
    const g13 = await t.gold();
    await t.eval(`TownQuests.act(null, ["W12", "fx", "w12Map", "sell"]); 0`);
    const sold12 = await t.json(`({ s: TownQuests.rec("W12").s, gold: $gameParty.gold(), v: TownQuests.vcount("falszywa_mapa"), raid: Wrak.state().raid, f: !!TownQuests.state().flags.wrakMapaSprzedana })`);
    t.check("W12 d) fałszywa mapa: rozdział 3 u Baltazara (8-18), sprzedaż 100 G, możliwy nocny napad za kilka dni",
        dbl.r.step === 2 && dbl.v === 1 && dbl.talk && sold12.s === "done" && sold12.gold === g13 + 100 && sold12.v === 0 && sold12.raid > 16 && sold12.f, { dbl, sold12 });
    await t.eval(`TownLife.setGone("rozbitek", false); 0`);

    // ---------------------------------------------------------------- znaki białego oka (mapa 178) na kompasie
    await t.eval("TownQuests.track(null); 0");
    await t.frames(10);
    const tr = await t.json(`(function(){ const x = Journal.tracked(); return x ? { source: x.source, title: x.title, where: x.where } : null; })()`);
    const marks = await t.json("Wrak.state().marks");
    t.check("z mapą z wraku dziennik prowadzi do następnego znaku białego oka (wzgórze tawerny odwiedzone: następne miejsce)",
        !!marks.tawerna && tr && tr.source === "extra" && tr.where && tr.where.map !== 220 && [222, 219, 29, 30, 218, 221].includes(tr.where.map) && /Biały znak/.test(tr.title), { tr, marks });
});
