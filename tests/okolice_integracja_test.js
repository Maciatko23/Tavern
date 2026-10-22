// INTEGRACJA paczek nowego terenu (docs/rozszerzenia/PLAN.md, punkt 8; 2026-10-22). Sprawdza to, co łączy paczki A-D:
//   - Okolice.track(key, { ifNone }) - kompas „Okolic” przez API (paczka D ustawia nim krąg menhirów po trzech strażnicach)
//   - Babka Jagna (A) skupuje zioła z klifów paczki D (szarotka 228, warzucha 229); wędrowny handlarz (C) skupuje okucia z wraku (230, D)
//   - epilog po Sercu: linijki paczek (źródełka A; wataha i zwierzyniec B; groby Ługów i jaskinia C; komora i gaj D)
//   - kolizje miejsc na Map165 (płycizny pakietu 0 z kawałkami wraku paczki D) - bez fałszywego alarmu
// Uruchom: CDP_PORT=9555 node tests/okolice_integracja_test.js (serwer: node tools/serve.js)
const kit = require("./lib/kit.js");

kit.test({ port: 9555, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, hour: 12, quiet: true, minimap: false });

    // ---------------------------------------------------------------- the compass of "Okolice" through its API
    const tr = await t.json(`(function(){ const O = Okolice; O.track(null);
        const unknown = O.track("menhiry_krag", { ifNone: true });            // (not hinted, not found: no)
        O.hint("menhiry_krag");
        const set = O.track("menhiry_krag", { ifNone: true }), now = O.track();
        O.hint("zrodlo_017");
        const other = O.track("zrodlo_017", { ifNone: true });                // (it leads somewhere already: left alone)
        const t1 = Journal.tracked ? Journal.tracked() : null;
        const off = O.track(null), after = O.track();
        return { unknown, set, now, other, where: t1 && t1.where ? t1.where.map : null, label: t1 ? t1.label : null, off, after }; })()`);
    t.check("Okolice.track: tylko do znanego miejsca, { ifNone } nie zabiera wyboru gracza, null kończy prowadzenie",
        tr.unknown === false && tr.set === true && tr.now === "menhiry_krag" && tr.other === false && tr.off === true && tr.after === null, tr);

    // ---------------------------------------------------------------- Jagna buys the cliff herbs (A x D)
    const dry = await t.json(`(function(){ for (let d = 3; d < 80; d++) if (!Okolice.rainOn(d)) return d; return 3; })()`);
    await t.setDay(dry, 6);
    await t.go(17, 66, 16);
    await t.frames(40);
    await t.eval(`(function(){ const j = Zasoby.state().jagna; j.met = j.met || Tawerna.time.day(); j.trust = Math.max(0, j.trust); j.ring = 1; j.taken = {}; j.buyDay = 0;
        $gameParty.gainItem($dataItems[228], 2); $gameParty.gainItem($dataItems[229], 1); window.__g0 = $gameParty.gold(); return 0; })()`);
    const jev = await t.json("!!TownLife.eventOf('jagna')");
    const talk = jev ? await t.talkTo("TownLife.eventOf('jagna')", ["Szarotka"]) : null;
    const jr = await t.json("({ gold: $gameParty.gold() - __g0, szarotka: $gameParty.numItems($dataItems[228]), warzucha: $gameParty.numItems($dataItems[229]) })");
    t.check("Babka Jagna (paczka A) skupuje szarotkę z klifu (paczka D): 2 × 20 G, warzucha zostaje w torbie",
        jev && talk && talk.done && jr.gold === 40 && jr.szarotka === 0 && jr.warzucha === 1, { jev, choices: talk && talk.choices, jr });
    const ped = await t.json(`({ okucie: LudzieData.PEDLAR_BUYS.find(b => b.id === 230) || null, jagna: ZasobyData.JAGNA_BUYS })`);
    t.check("wędrowny handlarz (paczka C) skupuje okucia z wraku (230, paczka D); Jagna: 228 i 229", !!ped.okucie && ped.okucie.price > 0 &&
        JSON.stringify(ped.jagna.map(b => b.id)) === "[228,229]", ped);

    // ---------------------------------------------------------------- the epilogue's lines of the packages
    const ep = await t.json(`(function(){
        for (const k of ["zrodlo_017", "zrodlo_021", "zrodlo_013"]) Okolice.discover(k, true);
        const L = Lowy.state(); L.den.friendly = true; L.den.betrayed = false; L.park.seen = true; L.park.count = 0;
        const f = TownQuests.state().flags; f.ludGroby = Tawerna.time.day(); f.ludSkrzyniaCelnik = Tawerna.time.day();
        const Z = Zakon.state(); Z.chamber.been = Tawerna.time.day(); Z.grove.done = Tawerna.time.day();
        const lines = Underground.epilogueLines("zniszczyc");
        const want = [ZasobyData.EPILOG.springs, LowyData.EPILOG.pack, LowyData.EPILOG.park, LudzieData.EPILOG.graves, LudzieData.EPILOG.cave.celnik,
            ZakonData.EPILOG.chamber, ZakonData.EPILOG.grove];
        $gameParty.gainItem($dataItems[204], 1);
        const permit = Underground.epilogueLines("zniszczyc").includes(LowyData.EPILOG.permit);
        L.den.friendly = false; f.ludGroby = 0; delete f.ludGroby;
        const less = Underground.epilogueLines("zniszczyc");
        return { have: want.map(w => lines.includes(w)), permit, gone: !less.includes(LowyData.EPILOG.pack) && !less.includes(LudzieData.EPILOG.graves), n: lines.length };
    })()`);
    t.check("epilog po Sercu: źródełka (A), przyjazna wataha i zwierzyniec bez kłusownictwa / z zezwoleniem (B), groby Ługów i jaskinia (C), komora i gaj (D) - i tylko gdy zrobione",
        ep.have.every(Boolean) && ep.permit && ep.gone, ep);

    // ---------------------------------------------------------------- Map165: the shoals of pakiet 0 with the pieces of the wreck (D)
    await t.go(165, 20, 15);
    await t.eval(`Wyspa.forceTide("low"); 0`);
    await t.frames(3);
    const c165 = await t.json("Okolice.checkMap()");
    await t.eval(`Wyspa.forceTide(null); 0`);
    t.check("Map165: płycizny pakietu 0 i kawałki wraku paczki D - 0 kolizji (bez fałszywego alarmu)", c165.problems.length === 0, c165.problems.slice(0, 6));

    await t.done();
});
