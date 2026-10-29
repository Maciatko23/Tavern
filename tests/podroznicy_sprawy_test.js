// Podróżni z promu - etap 2: sprawy pierwszej szóstki i podsłuch przez ścianę (docs/PODROZNI.md 2.1-2.6, I2; dane:
// js/plugins/Podroznicy_Data.js - wątek „podroznicy”, kod: js/plugins/Podroznicy_Sprawy.js, teksty: js/teksty/podroznicy.txt). Sprawdza:
//   - wtyczka pod Podroznicy, siedem zadań w TownQuests (dawcy: Tobiasz, Konstanty, Teofil, Jędrek, Hanka, Urszula), podsłuchy
//     zarejestrowane (D42 i oba łańcuchy etapu 4)
//   - K71: oferta w rozmowie z Tobiaszem, cztery listy w torbie, piąty u Borgara (Ludmiła), rozmowa kroku u Hanki, kociołek u Borgara
//     (Czujność 5 < 6: ślad na laku), doręczenia po 2 G, Feliks czujny, poszlaka W7, powrót do Tobiasza - 4 G, Renoma +2
//   - I2: miejsce słuchania z planu karczmy (sala → Jadalnia prywatna: ściana; korytarz → pokój 12: drzwi; pokój 3 → pokój 5),
//     narada Zenona z Kłosem (O przy ścianie, dzień przyjazdu + 2, 20:00): Czujność 5 - słowa kluczowe „...”, niepełna; Czujność 7 -
//     pełna; notatka „Podsłuchane: ...”, poszlaka D42
//   - D42: księga celnika (5 G) - druga poszlaka, wybór u Hanki, Kłos milczy (koniec d)
//   - D43: dwie poszlaki o Antku, Antek wśród rekrutów garnizonu (zdarzenie 3009 widać 7-19), rozmowa z nim - „Chodź do niej” - koniec a
//   - D40: punkt widokowy nad kamieniołomem (zdarzenie zadania), szkic; mapa z wraku - poszlaka W12 „kartograf”; koniec: Sława, Renoma,
//     słowa Teofila na mapie wyspy przy nieznanym miejscu
//   - D39: noc przy chorym (zimny okład), sołtys rano (po 3 godzinach), przepis „opatrunek medyka” w recepturach ręcznych
//   - D41: zawody z zakładem (Melia przegrywa - zaufanie -5, zakład przegrany), zwrotka za miód: bez W3 - wersja wojskowa
//   - W10: po K71 Tobiasz bierze list bohatera do mamy (bez opłaty i celnika - decyzja 14)
//   - K72: drugi przyjazd Tobiasza - oferta, list do brata Kleofasa (Lipnica), listy po 2 G
// Uruchom: node tests/run.js podroznicy_sprawy_test --port 9762
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const W = "PodroznicyData.watek";
    const act = (name, args) => t.eval(`${W}.akcja(${JSON.stringify(name)}, ${JSON.stringify(args || [])}); 0`);
    const st = () => J("Podroznicy.stan()");
    const rec = id => J(`TownQuests.rec(${JSON.stringify(id)}) || null`);
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 30); };
    const per = n => t.eval(`Tawerna.state("hero").attr.per = ${n}; 0`);
    const step = async id => { const r = await rec(id); return r ? r.s + ":" + r.step : "brak"; };
    const notes = () => J(`(Journal.data().notes || []).map(n => n.title + " | " + n.text)`);
    const flags = () => J("TownQuests.state().flags");

    // ---------------------------------------------------------------- dane
    await t.newGame({ map: 8, x: 53, y: 55, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.frames(20);
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name),
        q: ["K71", "K72", "D39", "D40", "D41", "D42", "D43"].map(id => { const q = TownQuests.Q[id]; return q ? id + ":" + q.giver + ":" + q.steps.length : id + ":brak"; }),
        pod: Podroznicy.podsluch ? Podroznicy.podsluch.lista() : [], spots: ["d40_gory", "d40_przystan", "d40_pustelnia"].every(k => !!TownQuestsData.SPOTS[k]) })`);
    const ix = n => base.list.indexOf(n);
    t.check("Podroznicy_Sprawy pod Podroznicy; 7 zadań etapu 2 z dawcami (Tobiasz, Konstanty, Teofil, Jędrek, Hanka, Urszula); punkty widokowe D40",
        ix("Podroznicy_Sprawy") > ix("Podroznicy") && base.q.join() === "K71:tobiasz:2,K72:tobiasz:1,D39:medyk:4,D40:kartograf:2,D41:grajek:4,D42:piekarka:5,D43:urszula:3" && base.spots, base.q);
    t.check("podsłuch I2: rozmowy zarejestrowane - D42 (narada Zenona) i łańcuchów etapu 4 (W15 kurier, W16 sen Tymona)",
        ["d42Narada", "w15Kurier", "w16Sen"].every(k => base.pod.includes(k)), base.pod);

    // ---------------------------------------------------------------- K71 „Listy z lądu”
    await at(4, 14.5, 60);
    const g0 = await t.gold();
    await t.talkTo("TownLife.eventOf('tobiasz')", [], { secs: 25 });   // (pierwsze spotkanie)
    const off = await t.talkTo("TownLife.eventOf('tobiasz')", ["Rozniosę"], { secs: 25 });
    const k1 = await J(`({ r: TownQuests.rec("K71"), v: ["list_hanka", "list_soltys", "list_marta", "list_feliks"].map(k => TownQuests.vcount(k)), lud: !!TownQuests.state().flags.k71ListLudmily })`);
    t.check("K71: oferta Tobiasza (cztery adresy) - przyjęta; cztery listy w torbie, piąty (Ludmiły) u Borgara",
        /cztery adresy/.test(off.text) && k1.r && k1.r.s === "active" && k1.v.join() === "1,1,1,1" && k1.lud, { text: off.text.slice(0, 160), k1 });
    const hanka = await J(`(function(){ const l = TownQuests.talkFor("piekarka") || []; return l.filter(c => c.code === 401).map(c => c.parameters[0]).join(" "); })()`);
    t.check("...rozmowa kroku u Hanki: list od siostry (Dorotki), mąka po dziewięć groszy", /Dorotki/.test(hanka) && /dziewięć/.test(hanka), hanka.slice(0, 200));
    const kettle = await J(`({ rows: Tawerna.talk.rows("borgar", {}).map(r => r.label), txt: ${W}.rozmowa("k71Para", { spk: { id: -1, name: "Borgar" } }).filter(c => c.code === 401).map(c => c.parameters[0]).join(" ") })`);
    t.check("...u Borgara opcja „Podgrzej list kamerdynera nad kociołkiem”; Czujność 5 (< 6): lak pęka", kettle.rows.includes("Podgrzej list kamerdynera nad kociołkiem") && /Lak pęka/.test(kettle.txt), kettle);
    await act("k71Para", ["slad"]);
    for (const k of ["hanka", "soltys", "marta", "feliks"]) await act("k71List", [k]);
    await t.frames(10);
    const k2 = await J(`({ s: Podroznicy.stan().k71, r: TownQuests.rec("K71"), f: !!TownQuests.state().flags.w7FeliksCzujny, obs: Dwor.state().obs.rano || 0, gold: $gameParty.gold() })`);
    t.check("...listy doręczone (po 2 G), list Feliksa z naruszonym lakiem - Feliks czujny (w7FeliksCzujny), W7: „papier na kopy” (obserwacja rano)",
        Object.keys(k2.s.oddane).length === 4 && k2.s.otwarty === "slad" && k2.f && k2.obs > 0 && k2.gold - g0 === 8 && k2.r.step === 1, k2);
    const back = await t.talkTo("TownLife.eventOf('tobiasz')", [], { secs: 25 });
    const k3 = await J(`({ r: TownQuests.rec("K71"), renoma: Podroznicy.stan().renoma, gold: $gameParty.gold() })`);
    t.check("...powrót do Tobiasza: K71 zrobione, 4 G za komplet (razem 12 G), Renoma karczmy +2", k3.r.s === "done" && k3.gold - g0 === 12 && k3.renoma === 32, { k3, text: back.text.slice(0, 160) });

    // ---------------------------------------------------------------- W10: list do mamy przez Tobiasza (decyzja 14) - bez opłaty i celnika
    await t.eval(`Przystan.letters().got.push({ day: $gameSystem.dayNightDay(), via: "prom" }); 0`);
    const gL = await t.gold();
    const rowsT = await J(`Tawerna.talk.rows("tobiasz", {}).map(r => r.label)`);
    await t.eval(`Przystan.act(null, ["w10Reply", "tobiasz", "none"]); 0`);
    const rep = await J(`({ r: Przystan.letters().replies.slice(-1)[0] || null, gold: $gameParty.gold(), note: (Journal.data().notes || []).map(n => n.text).filter(x => /Tobiasza/.test(x)).slice(-1)[0] || "" })`);
    t.check("W10: po K71 Tobiasz bierze list do mamy („Zabierzesz list do mojej mamy?”) - bez opłaty i bez celnika",
        rowsT.includes("Zabierzesz list do mojej mamy?") && !!rep.r && rep.r.via === "tobiasz" && rep.gold === gL && /pocztą lądową Tobiasza/.test(rep.note), { rowsT, rep });

    // ---------------------------------------------------------------- I2: geometria (plan karczmy)
    await t.go(1, 37, 42, 4);
    const m1 = await J("Podroznicy.podsluch.miejsce()");
    await t.go(25, 81, 52, 2);
    const m2 = await J("Podroznicy.podsluch.miejsce()");
    await t.go(25, 22, 40, 4);
    const m3 = await J("Podroznicy.podsluch.miejsce()");
    t.check("podsłuch - miejsce z planu karczmy: sala → Jadalnia prywatna (ściana), korytarz → pokój 12 (drzwi), pokój 3 → pokój 5 (ściana)",
        m1 && m1.room === "jadalnia" && m1.mode === "sciana" && m2 && m2.room === "r12" && m2.mode === "drzwi" && m3 && m3.room === "r5" && m3.mode === "sciana", { m1, m2, m3 });

    // ---------------------------------------------------------------- D42 „Zboże w suszę”: narada przez drzwi jadalni (Czujność 5, potem 7)
    await t.eval(`Podroznicy.przyplyn("zboze"); TownQuests.start("D42"); 0`);
    const od = (await st()).obecni.zboze.od;
    await at(od + 2, 20.25, 20);
    await t.go(1, 37, 42, 4);
    await t.frames(20);
    await t.press("ok");
    const startedLow = await t.until("Podroznicy.podsluch.trwa()", 5, 10);
    await t.until("!Podroznicy.podsluch.trwa()", 30, 60);
    const low = await J(`({ s: Podroznicy.podsluch.slyszane("d42Narada"), slady: Podroznicy.stan().d42.slady })`);
    const nLow = (await notes()).filter(n => /^Podsłuchane: Jadalnia prywatna/.test(n));
    t.check("narada (dzień " + (od + 2) + ", 20:15): O twarzą do ściany jadalni - słuchanie; Czujność 5 < 6: niepełna, słowa kluczowe „...”; notatka, poszlaka D42",
        startedLow && low.s && low.s.pelna === false && !!low.slady.narada && nLow.length === 1 && /\.\.\./.test(nLow[0]) && !/chorągwi królewskiej/.test(nLow[0]), { low, note: nLow[0] });
    await per(7);
    await t.eval(`Podroznicy.podsluch.zapomnij("d42Narada"); Podroznicy.podsluch.sluchaj("d42Narada"); 0`);
    await t.until("!Podroznicy.podsluch.trwa()", 30, 60);
    const high = await J(`Podroznicy.podsluch.slyszane("d42Narada")`);
    const nHigh = (await notes()).filter(n => /^Podsłuchane: /.test(n));
    t.check("...Czujność 7: pełna - „chorągwi królewskiej”, „kantoru Vey”", high && high.pelna === true && nHigh.some(n => /chorągwi królewskiej/.test(n) && /kantoru Vey/.test(n)), { high, n: nHigh.length });
    await per(5);
    await t.gold(20);
    await act("d42Celnik");
    await t.frames(10);
    const d42a = await J(`({ r: TownQuests.rec("D42"), slady: Podroznicy.stan().d42.slady, gold: $gameParty.gold() })`);
    t.check("...księga celnika za 5 G - druga poszlaka, krok: wybór u Hanki", d42a.slady.celnik && d42a.gold === 15 && d42a.r.step === 1, d42a);
    await act("d42Wybor", ["d"]);
    const d42b = await step("D42");
    await act("d42Koniec", ["d"]);
    const d42c = await J(`({ r: TownQuests.rec("D42"), f: !!TownQuests.state().flags.d42KlosMilczy })`);
    t.check("...wybór d (Kłos) → krok u kwatermistrza → D42 zrobione, Kłos milczy (skup ×1,2)", d42b === "active:4" && d42c.r.s === "done" && d42c.f, { d42b, d42c });

    // ---------------------------------------------------------------- D43 „Matka szuka syna”: Antek w garnizonie
    await t.eval(`Podroznicy.przyplyn("urszula"); TownQuests.start("D43"); 0`);
    await act("d43Slad", ["rotmistrz"]);
    await act("d43Slad", ["prom"]);
    await t.frames(10);
    const d43a = await step("D43");
    const d0 = await J("$gameSystem.dayNightDay()");
    await at(d0 + 1, 10, 20);
    await t.go(162, 25, 24, 8);
    await t.frames(60);
    const antek = await J(`(function(){ const e = $gameMap.event(3009); return e ? { shown: !e.isTransparent(), x: e.x, y: e.y, sheet: e.characterName(), name: e.event().name } : null; })()`);
    t.check("D43: dwie poszlaki (rotmistrz, ludzie z promu) → krok Antka; garnizon 10:00 - Antek wśród rekrutów (zdarzenie 3009, rekrut)",
        d43a === "active:1" && !!antek && antek.shown && antek.name === "Antek" && antek.sheet === "$Npc_Zolnierz_B", { d43a, antek });
    const r0 = (await st()).renoma;
    const tAntek = await t.talkTo(3009, ["Chodź do niej"], { secs: 30 });
    const d43b = await J(`({ r: TownQuests.rec("D43"), f: !!TownQuests.state().flags.d43_a, renoma: Podroznicy.stan().renoma })`);
    t.check("...rozmowa z Antkiem („Mama tu?”) - „Chodź do niej” (Hart ducha 5): D43 zrobione, Renoma +4",
        /Mama tu/.test(tAntek.text) && d43b.r.s === "done" && d43b.f && d43b.renoma === r0 + 4, { d43b, text: tAntek.text.slice(0, 200) });

    // ---------------------------------------------------------------- D40 „Mapa dla kartografa”: punkt widokowy, mapa z wraku, słowa na mapie
    await t.eval(`Podroznicy.przyplyn("kartograf"); TownQuests.start("D40"); 0`);
    await t.go(13, 57, 12, 6);
    await t.frames(40);
    const spot = await J(`({ want: !!TownQuests.spotWanted("d40_gory"), ev: (function(){ const e = $gameMap.event(954); return e ? { x: e.x, y: e.y } : null; })() })`);
    await t.talkTo(954, [], { secs: 15 });
    const sk = await J(`Podroznicy.stan().d40.szkice`);
    t.check("D40: punkt widokowy nad kamieniołomem (zdarzenie 954 przy znaczniku) - O: szkic", spot.want && !!spot.ev && !!sk.d40_gory, { spot, sk });
    await t.eval(`(function(){ const s = Podroznicy.stan().d40.szkice; for (const k of ["d40_pustelnia", "d40_urwisko", "d40_latarnia", "d40_garnizon"]) s[k] = $gameSystem.dayNightDay(); ${W}.autoChecks(); return 0; })()`);
    await t.frames(10);
    await t.give(178, 1);
    const oddaj = await J(`${W}.rozmowa("d40Oddaj", { spk: { id: -1, name: "Teofil" } }).filter(c => c.code === 102).map(c => c.parameters[0])`);
    const r1 = (await st()).renoma;
    await act("d40Mapa");
    await act("d40Koniec");
    const d40 = await J(`({ step: TownQuests.rec("D40"), clue: !!Wrak.clues().kartograf, f: !!TownQuests.state().flags.szkicKartografa, renoma: Podroznicy.stan().renoma,
        karta: (function(){ const k = MapaWyspy.PLACES.find(p => p.key !== MapaWyspy.UND && !MapaWyspy.discovered(p.key) && MapaWyspy.place(p.key)); const c = k ? MapaWyspy.card(k.key) : null; return c ? c.opis : ""; })() })`);
    t.check("...pięć szkiców → oddanie (z mapą z wraku: wybór „Pokaż mu mapę z wraku”), W12: poszlaka „kartograf”, D40 zrobione, Renoma +3, słowa Teofila przy nieznanym miejscu",
        oddaj.some(o => o.includes("Pokaż mu mapę z wraku.")) && d40.step.s === "done" && d40.clue && d40.f && d40.renoma === r1 + 3 && /^„/.test(d40.karta), { oddaj, d40 });

    // ---------------------------------------------------------------- D39 „Gorączka z promu”: noc, sołtys, przepis
    await t.eval(`Podroznicy.przyplyn("medyk"); TownQuests.start("D39", 2); 0`);
    const dn = await J("$gameSystem.dayNightDay()");
    await at(dn, 23, 10);
    await act("d39Oklad", ["zimny"]);
    const po0 = await J(`${W}.hak("d39PoNocy", {})`);
    await at(dn + 1, 7, 10);
    const po1 = await J(`${W}.hak("d39PoNocy", {})`);
    const r2 = (await st()).renoma;
    await act("d39Soltys", ["za"]);
    const d39 = await J(`({ r: TownQuests.rec("D39"), przepis: Farming.HAND_RECIPES.some(x => x.id === "podr_opatrunek"), renoma: Podroznicy.stan().renoma, oklad: Podroznicy.stan().d39.oklad })`);
    t.check("D39: zimny okład w nocy; sołtys dopiero rano (3 godz. po nocy); „Konstanty mówi...” - D39 zrobione, przepis opatrunku medyka, Renoma +3",
        po0 === false && po1 === true && d39.r.s === "done" && d39.przepis && d39.oklad === "zimny" && d39.renoma === r2 + 3, { po0, po1, d39 });

    // ---------------------------------------------------------------- D41 „Pieśń z lądu”: zawody, zwrotka
    await t.eval(`Podroznicy.przyplyn("grajek"); TownQuests.start("D41"); 0`);
    await t.gold(30);
    const tr0 = await J(`TavernLife.trust("melia")`);
    await act("d41Zawody", ["melia", "jedrek"]);
    const d41a = await J(`({ r: TownQuests.rec("D41"), gold: $gameParty.gold(), trust: TavernLife.trust("melia") })`);
    await t.give(137, 1);
    await act("d41Zwrotka", [1]);
    const d41b = await J(`({ r: TownQuests.rec("D41"), f: !!TownQuests.state().flags.d41Wojskowa, miod: $gameParty.numItems($dataItems[137]) })`);
    t.check("D41: zawody - postawił na Melię, wygrał Jędrek: -10 G, zaufanie Melii -5, krok zwrotki; za miód wersja wojskowa (bez W3) - D41 zrobione",
        d41a.gold === 20 && d41a.trust === Math.max(0, tr0 - 5) && d41a.r.step === 3 && d41b.r.s === "done" && d41b.f && d41b.miod === 0, { tr0, d41a, d41b });

    // ---------------------------------------------------------------- K72 „Poczta z lądu”: drugi przyjazd Tobiasza
    await at(dn + 1, 10, 10);
    await t.eval(`Podroznicy.odplyn("tobiasz"); Podroznicy.przyplyn("tobiasz"); 0`);
    const k72o = await J(`({ wiz: Podroznicy.stan().obecni.tobiasz.wizyta, off: TownQuests.offerable("K72") })`);
    await t.eval(`TownQuests.start("K72"); 0`);
    const k72 = await J(`({ s: Podroznicy.stan().k72, v: TownQuests.vcount("list_poczta") })`);
    const g1 = await t.gold();
    for (const k of k72.s.adresaci) await act("k72List", [k]);
    await t.frames(10);
    const k72b = await J(`({ r: TownQuests.rec("K72"), gold: $gameParty.gold() })`);
    t.check("K72: drugi przyjazd Tobiasza - oferta; 2-3 listy, jeden do brata Kleofasa (Lipnica); rozdane po 2 G - zrobione",
        k72o.wiz === 2 && k72o.off && k72.s.adresaci.length >= 2 && k72.s.adresaci.length <= 3 && k72.s.adresaci[0] === "pustelnik" && k72.v === k72.s.adresaci.length &&
        k72b.r.s === "done" && k72b.gold - g1 === 2 * k72.s.adresaci.length, { k72o, k72, k72b });
});
