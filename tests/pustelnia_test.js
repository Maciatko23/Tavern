// PAKIET A "Pustelnia na klifie" (docs/miejsca_wyspy/PAKIETY.md; js/plugins/Pustelnia_Data.js + Pustelnia.js; mapy z
// tools/pustelnia/build.py). Sprawdza:
//   - mapy 155 (48 x 36, tileset 11, <Water:salt>, bez szkieletu) i 156 (skryptorium): przejścia z kontraktu (dół -> przystań,
//     prawa krawędź -> Urwisko tylko gdy gotowe, inaczej popup), drzwi skryptorium, miejsca Kleofasa
//   - wejście z przystani: Wyspa.ready(155) - przejście na górnej krawędzi Map125 prowadzi na (24,34)
//   - brat Kleofas (TownLife 944): plan dnia (skryptorium rano, ławka w południe, cela w nocy), pierwsza rozmowa (wisiorek =
//     znak posłańca), popiersie, miód
//   - K50 (szyszki, żelazo, własna deszczówka -> miód, 15 G), D23: karty 2 (piętro 20), 3 (Rejestr straży u Milczących), 1 (Archiwum),
//     4-6 z flag innych pakietów; czytanie przy pulpicie (bez wisiorka / bez Kleofasa - popup), dwie godziny, notatki, koniec D23
//   - W2 rozdz. 7: serce dzwonu od Ambrożego w Akcie II, Kleofas je wiesza, Noc Pytania w Wigilię: przed północą „czekaj”, po
//     północy dzwon i pytanie, odpowiedź do dziennika, rozdz. 8 czeka; drugie pytanie w tym samym roku - nie
// Przed instalacją map: nakładka tools/miejsca_wyspy/staging_A (sama się włącza, gdy data/Map155.json to jeszcze szkielet).
// Zrzuty do dokumentacji: tools/pustelnia/shots.js.
// Uruchom: CDP_PORT=9501 node tests/pustelnia_test.js (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");

const ROOT = path.join(__dirname, "..");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map155.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_A" : null);

kit.test({ port: 9501, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    if (OVERLAY) console.log("NOTE nakładka: " + OVERLAY);
    const K = "TownLife.eventOf('pustelnik')";

    // ---------------------------------------------------------------- wtyczki, dane
    const base = await t.json(`(function(){ const R = TownLife.RESIDENTS.find(r => r.key === 'pustelnik');
        return { api: !!window.Pustelnia && !!Pustelnia.lectern, data: !!window.PustelniaData, res: R ? [R.id, R.map, R.sheet] : null,
            k50: !!TownQuests.Q.K50, d23: !!TownQuests.Q.D23, w2: TownQuests.Q.W2.steps[TownQuests.Q.W2.steps.length - 1].talk,
            ready: Wyspa.isReady(155), packs: TownQuestsData.PACKS.filter(p => p.owner === 'Pustelnia').map(p => p.quests.join()) }; })()`);
    t.check("Pustelnia.js i Pustelnia_Data.js działają: Kleofas (944, mapa 155, $Npc_Pustelnik), K50 i D23 w zadaniach, W2 kończy się krokiem „w2Pytanie”, miejsce gotowe (Wyspa.ready 155)",
        base.api && base.data && base.res && base.res[0] === 944 && base.res[1] === 155 && base.res[2] === "$Npc_Pustelnik" && base.k50 && base.d23
        && base.w2 === "w2Pytanie" && base.ready && base.packs.join() === "K50,D23", base);

    // ---------------------------------------------------------------- z przystani w górę
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("if (window.Creatures && Creatures.auto) Creatures.auto(false); 0");
    await t.go(125, 15, 1, 8);
    const edge = await t.json(`$dataMap.events.filter(e => e && e.id >= 690 && e.id <= 692).map(e => [e.id, e.x, e.y, e.pages[0].list[0].parameters.slice(1, 4)])`);
    t.check("przystań: na górnej krawędzi (14-16, 0) trzy przejścia do pustelni (Wyspa.js, 690-692)", edge.length === 3 && edge.every(e => e[3][0] === 155 && e[2] === 0), edge);
    await t.eval("$gameMap.event(691).start(); 0");
    const up = await t.until(t.onMap(155), 30);
    await t.frames(20);
    const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $dataMap.width, $dataMap.height, $dataMap.tilesetId, $dataMap.note, $dataMap.displayName]");
    t.check("...prowadzi na Map155 „Pustelnia na klifie” (24,34); mapa 48 x 36, tileset 11, notatka z <Water:salt>, nie szkielet",
        up && at[0] === 155 && at[1] === 24 && at[2] === 34 && at[3] === 48 && at[4] === 36 && at[5] === 11 && /<Water:salt>/.test(at[6]) && !/szkielet/.test(at[6]) && at[7] === "Pustelnia na klifie", at);
    await t.calm();
    const ways = await t.json(`(function(){ const ev = $dataMap.events.filter(Boolean), tr = e => (e.pages[0].list.find(c => c.code === 201) || {}).parameters;
        return { south: ev.filter(e => e.y === 35 && e.x >= 23 && e.x <= 25).map(e => [e.x, tr(e) ? tr(e).slice(1, 4) : null]),
            east: ev.filter(e => e.x === 47 && (e.y === 17 || e.y === 18)).map(e => e.y),
            door: ev.filter(e => e.name === 'Drzwi: Skryptorium').map(e => [e.x, e.y, (e.pages[0].list.find(c => c.code === 201) || {}).parameters]),
            spots: ev.filter(e => /^Miejsce: /.test(e.name)).map(e => e.name.slice(9)).sort() }; })()`);
    t.check("przejścia z kontraktu: dół (23-25, 35) -> przystań (14-16, 1), prawa krawędź (47, 17-18) -> Urwisko; drzwi skryptorium -> Map156",
        ways.south.length === 3 && ways.south.every(s => s[1] && s[1][0] === 125 && s[1][2] === 1) && ways.east.join() === "17,18"
        && ways.door.length === 1 && ways.door[0][2][1] === 156, ways);
    t.check("miejsca Kleofasa na mapie: cela, ławka, ogródek, skryptorium, ule, urwisko, wieża",
        ways.spots.join() === "cela_drzwi,lawka,ogrodek,skryptorium_drzwi,ule,urwisko,wieza", ways.spots);
    // the way east: the Urwisko built (package B installed, 2026-10-16: Kruk.js says Wyspa.ready(157)) -> over to it (1,19);
    // not built (a stub Map157) -> a popup, no transfer
    await t.popups({ clear: true });
    const urwReady = await t.eval("Wyspa.isReady(157)");
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.x === 47 && e.y === 17); $gamePlayer.locate(46, 17); e.start(); return 0; })()");
    if (urwReady) {
        const over = await t.until(t.onMap(157), 15);
        await t.frames(10);
        const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
        t.check("Urwisko (157) gotowe: prawa krawędź (47,17) prowadzi na Urwisko Kruków (1,19)", over && at.join() === "157,1,19", at);
        await t.go(155, 24, 30, 8);
    } else {
        await t.frames(30);
        const eastPop = await t.popups();
        t.check("Urwisko (157) jeszcze nie gotowe: na prawej krawędzi popup nad bohaterem, bez przejścia", (await t.eval("$gameMap.mapId()")) === 155 && eastPop.some(p => /urywa się/.test(p)), eastPop);
        await t.locate(24, 30, 8);
    }

    // ---------------------------------------------------------------- Kleofas: plan dnia
    await t.setDay(6, 12.5);
    await t.frames(30);
    const noon = await t.json(`(function(){ const s = TownLife.state('pustelnik'), sp = TownLife.spot('lawka'); return { s: s && [s.x, s.y, s.hidden, s.act], sp }; })()`);
    t.check("w południe Kleofas jest przy ławce nad urwiskiem (chleb z miodem)", noon.s && !noon.s[2] && noon.s[3] === "stand" && noon.s[0] === noon.sp[0] && noon.s[1] === noon.sp[1], noon);
    await t.setDay(6, 22);
    await t.frames(30);
    const night = await t.json(`(function(){ const s = TownLife.state('pustelnik'); return s && [s.hidden, s.act]; })()`);
    t.check("w nocy śpi w celi (ukryty)", night && night[0] === true && night[1] === "inside", night);
    await t.setDay(6, 13.2);
    await t.frames(40);

    // ---------------------------------------------------------------- pierwsza rozmowa, popiersie
    const meet = await t.talkTo(K, []);
    const met = await t.json("({ f: TownQuests.state().flags.pustelnikMet, notes: ($gameSystem._journal.notes || []).map(n => n.title) })");
    t.check("pierwsza rozmowa: „To nie ozdoba... znak posłańca”, flaga pustelnikMet, notatka „Pustelnik na klifie”",
        /znak posłańca/.test(meet.text) && !!met.f && met.notes.includes("Pustelnik na klifie"), meet.text.slice(0, 300));
    const bust = await t.json(`(function(){ const e = ${K}; return [SpeechBubbles.bustOf(e), e.characterName()]; })()`);
    if (!bust[0]) { await t.frames(30); }
    const bust2 = await t.json(`(function(){ const e = ${K}; return SpeechBubbles.bustOf(e); })()`);
    t.check("Kleofas ma własne popiersie (Pustelnik_Bust) i arkusz $Npc_Pustelnik", bust2 === "Pustelnik_Bust" && bust[1] === "$Npc_Pustelnik", [bust, bust2]);

    // ---------------------------------------------------------------- K50: atrament
    const k50o = await t.talkTo(K, ["Przyniosę"]);
    t.check("K50 „Atrament dla pustelnika” od dnia 6: oferta i przyjęcie", (await t.json("TownQuests.isActive('K50')")) && /Atrament mi wysechł/.test(k50o.text), k50o.text.slice(0, 200));
    await t.give(147, 4); await t.give(86, 1); await t.give(138, 1);
    await t.eval("Farming.setBagWater(2); 0");
    const gold0 = await t.gold(), honey0 = await t.count(76);
    const k50 = await t.talkTo(K, []);
    const k50r = await t.json(`({ done: TownQuests.isDone('K50'), water: Farming.bagWater(), cones: $gameParty.numItems($dataItems[147]), f: TownQuests.state().flags.kleofasCzyta })`);
    t.check("...oddane: 4 szyszki, żelazo i JEDNA porcja własnej deszczówki zabrane; nagroda 15 G i 2× Miód, flaga kleofasCzyta",
        k50r.done && k50r.water === 1 && k50r.cones === 0 && !!k50r.f && (await t.gold()) === gold0 + 15 && (await t.count(76)) === honey0 + 2, [k50r, k50.text.slice(-200)]);

    // ---------------------------------------------------------------- D23: przyjęcie, miód
    const d23o = await t.talkTo(K, ["Poszukam kart"]);
    t.check("D23 „Zaszyfrowane kroniki” po K50: oferta (wisiorek to klucz do tarczy) i przyjęcie", (await t.json("TownQuests.isActive('D23')")) && /wisiorek/.test(d23o.text), d23o.text.slice(0, 200));
    await t.gold(30);
    const h0 = await t.count(76);
    await t.talkTo(K, ["Kupię miód"]);
    t.check("miód z uli Kleofasa: 12 G za słoik", (await t.count(76)) === h0 + 1 && (await t.gold()) === 18, [await t.count(76), await t.gold()]);

    // ---------------------------------------------------------------- karty 2, 3, 1
    await t.go(146, 21, 17, 8);
    await t.eval("if (window.Creatures && Creatures.clearAll) Creatures.clearAll(); 0");
    const c2ev = await t.json("$dataMap.events.filter(e => e && e.id === 600).map(e => [e.x, e.y, e.name])");
    await t.eval("$gameMap.event(600).start(); 0");
    await t.frames(20);
    const c2 = await t.json("({ v: TownQuests.vcount('karta_2'), f: TownQuests.state().flags.kronikaKarta2, gone: !$gameMap.event(600) || $gameMap.event(600)._erased })");
    t.check("karta 2: na piętrze 20 przy Księdze pytań (zdarzenie 600) - zabrana: w torbie, flaga kronikaKarta2, zdarzenie znika",
        c2ev.length === 1 && c2.v === 1 && !!c2.f && c2.gone, { c2ev, c2 });
    await t.go(123, 11, 6, 8);
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.event().name === 'Rejestr straży'); e.start(); return 0; })()");
    await t.until("!$gameMap.isEventRunning()", 10);
    await t.frames(10);
    const c3 = await t.json("({ v: TownQuests.vcount('karta_3'), f: TownQuests.state().flags.kronikaKarta3 })");
    t.check("karta 3: Rejestr straży w chacie Najstarszego (Map123, lista zdarzenia dopisana w kodzie, plik bez zmian)", c3.v === 1 && !!c3.f, c3);
    await t.eval("TownQuests.state().flags.chroniclesLeft = 5; 0");
    await t.go(119, 10, 5, 8);
    const c1ev = await t.json("$dataMap.events.filter(e => e && e.id === 601).map(e => [e.x, e.y])");
    await t.eval("$gameMap.event(601).start(); 0");
    await t.frames(20);
    const c1 = await t.json("({ v: TownQuests.vcount('karta_1'), f: TownQuests.state().flags.kronikaKarta1 })");
    t.check("karta 1: kroniki zostawione w Archiwum (W2 rozdz. 6) - luźna karta na regale (zdarzenie 601)", c1ev.length === 1 && c1.v === 1 && !!c1.f, { c1ev, c1 });

    // ---------------------------------------------------------------- czytanie przy pulpicie
    await t.go(156, 6, 8, 8);
    await t.setHour(13);
    await t.frames(30);
    const lect = "$gameMap.events().find(e => e.event().name === 'Pulpit z księgą')";
    await t.popups({ clear: true });
    await t.talkTo(lect, []);
    const away = await t.popups();
    t.check("13:00 - Kleofas w ogródku: przy pulpicie popup „Bez brata Kleofasa nie odczytasz szyfru.”", away.some(p => /Bez brata Kleofasa/.test(p)), away);
    await t.setHour(9.5);
    await t.frames(30);
    const inside = await t.json(`(function(){ const s = TownLife.state('pustelnik'); return s && [s.x, s.y, s.hidden]; })()`);
    t.check("9:30 - Kleofas w skryptorium (Map156, „Miejsce: pustelnik_wnetrze”)", inside && inside[2] === false && inside[0] === 5 && inside[1] === 5, inside);
    await t.eval("$gameParty.loseItem($dataItems[172], 1); 0");
    await t.popups({ clear: true });
    await t.talkTo(lect, []);
    const noP = await t.popups();
    t.check("bez wisiorka z krukiem nie da się czytać (popup o brakującym wisiorku)", noP.some(p => /wisiorka/.test(p)), noP);
    await t.give(172, 1);
    const h9 = await t.eval("$gameSystem.dayNightHour()");
    const rd = await t.talkTo(lect, ["Karta: Zasada jednego pytania"]);
    const after = await t.json(`({ read: Pustelnia.state().read, v: TownQuests.vcount('karta_1'), h: $gameSystem.dayNightHour(),
        notes: ($gameSystem._journal.notes || []).map(n => n.title).filter(t => /Kronika upadku/.test(t)), text: TownQuests.journalOps({ quest: TownQuests.Q.D23 }).map(o => o.text || '').join(' ') })`);
    t.check("czytanie karty 1 z Kleofasem: wybór karty, „Serce odpowiada każdemu...”, mijają 2 godziny, karta zużyta, rozdział „Kronika upadku (1)” w dzienniku",
        /Serce odpowiada każdemu/.test(rd.text) && !!after.read[1] && after.v === 0 && Math.abs(after.h - (h9 + 2)) < 0.3 && after.notes.some(n => /\(1\)/.test(n)), { after: Object.assign({}, after, { text: undefined }), t: rd.text.slice(0, 160) });
    t.check("dziennik D23: „Odczytane: 1/6” i podpowiedź, gdzie szukać", /Odczytane: 1\/6/.test(after.text), after.text.slice(0, 300));
    const at10 = async () => { await t.setHour(10); await t.frames(30); };   // (the reading ends at noon: Kleofas goes out - back to 10:00)
    await at10(); await t.talkTo(lect, ["Karta: Cztery"]);
    await at10(); await t.talkTo(lect, ["Karta: Trzy pytania"]);
    // the other packages' cards (their flags): into the bag by themselves
    await t.eval("(function(){ const f = TownQuests.state().flags; f.kronikaKarta4 = f.kronikaKarta5 = f.kronikaKarta6 = Tawerna.time.day(); Pustelnia.syncCards(); return 0; })()");
    const bag = await t.json("Pustelnia.inBag()");
    t.check("karty 4-6 z flag innych pakietów (wrak, latarnia, kruk) same trafiają do torby", bag.join() === "4,5,6", bag);
    for (const name of ["Karta: Upadek", "Karta: Imiona", "Karta: Cysterna"]) { await at10(); await t.talkTo(lect, [name]); }
    const d23 = await t.json("({ done: TownQuests.isDone('D23'), n: Pustelnia.readCount(), ufa: TownQuests.state().flags.kleofasUfa })");
    t.check("sześć kart odczytanych: D23 wykonane (120 G), Kleofas ufa (flaga kleofasUfa)", d23.done && d23.n === 6 && !!d23.ufa, d23);

    // ---------------------------------------------------------------- W2 rozdz. 7: serce dzwonu, Noc Pytania
    await t.eval("(function(){ TownQuests.start('W2', TownQuests.Q.W2.steps.length - 1, true); return 0; })()");
    const w2a = await t.json("({ ch: TownQuests.journalOps({ quest: TownQuests.Q.W2 }).map(o => o.text || '').join(' ') })");
    t.check("W2 rozdz. 7 przed Aktem II: dziennik mówi, że rozdział czeka na Akt II", /Akcie II/.test(w2a.ch) && /Jedno pytanie/.test(w2a.ch), w2a.ch.slice(0, 300));
    await t.eval("(function(){ const s = Story.state(); s.paid = s.debt; s.done = Tawerna.time.day(); return 0; })()");
    await t.go(8, 30, 40, 2);
    await t.setHour(10);
    await t.frames(40);
    const amb = { text: "" };   // (the first talk may be his remark about the hermit - once - then the heart)
    for (let i = 0; i < 3 && !(await t.json("TownQuests.vcount('serce_dzwonu')")); i++) amb.text += " / " + (await t.talkTo("TownLife.eventOf('dzwonnik')", [])).text;
    const heart = await t.json("({ v: TownQuests.vcount('serce_dzwonu'), s: TownQuests.rec('W2').t.w2s })");
    t.check("Akt II: Ambroży daje serce dzwonu („Z dzwonu na klifie... brat pióra”)", heart.v === 1 && heart.s === 1 && /brat pióra/.test(amb.text), [heart, amb.text.slice(0, 200)]);
    await t.go(155, 16, 11, 8);
    await t.setHour(14);
    await t.frames(40);
    const hang = await t.talkTo(K, []);
    const hung = await t.json("({ v: TownQuests.vcount('serce_dzwonu'), s: TownQuests.rec('W2').t.w2s, f: TownQuests.state().flags.sercePustelni, wig: Pustelnia.nextNight() })");
    t.check("Kleofas wiesza serce w dzwonie (flaga sercePustelni) i mówi o Nocy Pytania w Wigilię", hung.v === 0 && hung.s === 2 && !!hung.f && /Wigilię/.test(hang.text), [hung, hang.text.slice(-200)]);
    // the Night: the Wigilia's evening -> "wait for the bell"; after midnight -> the question
    const W = hung.wig.wig;
    await t.setDay(W, 23);
    await t.frames(40);
    const eve = await t.json(`(function(){ const s = TownLife.state('pustelnik'), sp = TownLife.spot('wieza'); return { s: s && [s.x, s.y, s.hidden], sp, night: Pustelnia.nightNow() }; })()`);
    t.check("Wigilia, 23:00: Kleofas czeka przy wieży skryptorium", eve.night && eve.s && !eve.s[2], eve);
    const early = await t.talkTo(K, []);
    t.check("...przed północą: „Czekaj na dzwon”", /Czekaj na dzwon/.test(early.text), early.text);
    await t.setDay(W + 1, 0.1);
    await t.frames(60);
    const rung = await t.json("Pustelnia.state().rung");
    const q = await t.talkTo(K, ["Co ukrywa mój dziadek"]);
    const asked = await t.json(`({ asked: Pustelnia.state().asked, s: TownQuests.rec('W2').t.w2s, notes: ($gameSystem._journal.notes || []).filter(n => /Jedno pytanie/.test(n.title)).map(n => n.text),
        ch: TownQuests.journalOps({ quest: TownQuests.Q.W2 }).map(o => o.text || '').join(' ') })`);
    t.check("po północy: dzwon (siedem uderzeń) i pytanie - „Co ukrywa mój dziadek?” -> kruczarze; odpowiedź w dzienniku, rozdz. 8 czeka",
        Object.keys(rung).length === 1 && /Kruczarze/.test(q.text) && asked.s === 3 && Object.keys(asked.asked).length === 1 && asked.notes.length === 1
        && /Alarm/.test(asked.ch), { rung, asked: Object.assign({}, asked, { ch: asked.ch.slice(0, 200) }), t: q.text.slice(0, 200) });
    const again = await t.talkTo(K, []);
    t.check("drugie pytanie w tym samym roku: „Reguła to reguła”", /Reguła\s+to\s+reguła/.test(again.text), again.text);
    const nextQ = await t.json("TownQuests.journalOps({ quest: TownQuests.Q.W2 }).map(o => o.text || '').join(' ')");
    t.check("dziennik W2: „pytanie zadane”, następne w Wigilię roku 2 (dzień 208)", /pytanie\s+zadane/.test(nextQ) && /roku\s+2\s+\(dzień\s+208\)/.test(nextQ), nextQ.slice(nextQ.indexOf('Jedno'), nextQ.indexOf('Jedno') + 260));

    // ---------------------------------------------------------------- karta 1 innymi drogami (kroniki w torbie, u Ambrożego, u Baltazara)
    const reset1 = "(function(){ const f = TownQuests.state().flags; delete f.kronikaKarta1; delete Pustelnia.state().got[1]; delete Pustelnia.state().read[1]; delete TownQuests.state().v.karta_1; return 0; })()";
    await t.eval(reset1);
    await t.eval("TownQuests.state().v.kroniki = 1; 0");
    await t.setDay(W + 3, 10);
    await t.go(156, 6, 8, 8);
    await t.frames(30);
    const chron = await t.talkTo(K, ["Mam kroniki zakonu"]);
    t.check("kroniki z Archiwum w torbie: Kleofas wysuwa z grzbietu luźną kartę szyfru (karta 1)", (await t.json("TownQuests.vcount('karta_1')")) === 1 && /luźną\s+kartę/.test(chron.text), chron.text.slice(-200));
    await t.eval(reset1);
    await t.eval("(function(){ const s = TownQuests.state(); delete s.v.kroniki; s.flags.ambrozyChronicles = 5; s.q.D23 = { s: 'active', step: 0, day: 5, sday: 5, sh: 10, t: { done: {} }, times: 0 }; return 0; })()");
    await t.go(8, 30, 40, 2);
    await t.frames(30);
    const ambC = await t.talkTo("TownLife.eventOf('dzwonnik')", []);
    t.check("kroniki oddane Ambrożemu: Ambroży oddaje luźną kartę (karta 1)", (await t.json("TownQuests.vcount('karta_1')")) === 1 && /Ambroży\s+wyciąga/.test(ambC.text), ambC.text.slice(-200));
    await t.eval(reset1);
    await t.eval("(function(){ const f = TownQuests.state().flags; delete f.ambrozyChronicles; f.w5ChroniclesSold = 5; return 0; })()");
    await t.gold(50);
    const balt = await t.talkTo("TownLife.eventOf('kupiec')", ["Biorę"]);
    t.check("kroniki sprzedane Baltazarowi (W5 jeszcze nie ma): odsprzedaje kartę za 40 G", (await t.json("TownQuests.vcount('karta_1')")) === 1 && (await t.gold()) === 10, balt.text.slice(0, 200));
});
