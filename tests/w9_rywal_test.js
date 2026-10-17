// W9 rozdz. 3 „Rywal w ruinach” (Rywal.js, Rywal_Data.js; docs/QUESTY.md W9 rozdz. 3) - ktoś z zewnątrz schodzi po Serce przed bohaterem:
//   - dane: wtyczki na swoich miejscach, numery 828-839 w rejestrze (właściciel Rywal), W9 ma dwa nowe kroki (rozdz. 3), wygląd strażnika dworu
//   - kto: dokładnie jedna drużyna - Grum (W8: frakcja / przegrana) przed ludźmi Lorda (Lord rywalem) przed ludźmi Baltazara (Baltazar nie
//     w garści) przed kopaczami Czarnych Oczu (Baltazar w garści - podwójna gra W5 - albo wszyscy po stronie bohatera)
//   - początek: noc po otwarciu kraty; błoto na stopniach w piwnicy, ślady w Ruinach Zamku, W9 w dzienniku od rozdziału 3
//   - zegar: piętro co 6 godzin, nigdy na piętro bohatera ani z niego, przy dziesiątej bramie stop; po 3 dniach odchodzą (Borgar to słyszał)
//   - ślady: znak, buty, zimny obóz, porzucona lina (+1 lina), linka z dzwonkami (cios, a skradając się - przecięta), puste skrzynie,
//     wyrwane zapiski zakonu
//   - spotkanie: rozmowa sama się zaczyna, wybory każdej drużyny; walka (Humans.js) - wygrana (zapiski odzyskane), przegrana (obrabowany);
//     raport dla Lorda, ostrzeżenie o zbroi, słowa strażnika sprzedane, przewodnik, Grum zawraca; Grum zabity / puszczony; dowódca zabity
//   - Akt III (fale w3/w4 z flag w9Frakcja*, w9DowodcaPolegl), Serce (Underground.world().rival, linijka epilogu, zdanie Lorda, świadkowie
//     przed drzwiami), zapis i wczytanie, F9 („W9: rywal (wymuś wariant)”, „W9: rywal - spotkanie”)
// Przed instalacją: sam dopisuje Rywal_Data / Rywal pod Kantor (GAME_PLUGINS_ADD). Po instalacji działa tak samo bez tego.
// Uruchom: CDP_PORT=9509 node tests/w9_rywal_test.js (serwer: node tools/serve.js). Zrzuty: docs/w9_rywal/*.png
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
if (!/"name":"Rywal"/.test(fs.readFileSync(path.join(ROOT, "js", "plugins.js"), "utf8")) && !process.env.GAME_PLUGINS_ADD) process.env.GAME_PLUGINS_ADD = "Kantor:Rywal_Data;Rywal_Data:Rywal";
const kit = require("./lib/kit.js");
const DOCS = path.join(ROOT, "docs", "w9_rywal");

kit.test({ port: 9509, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e), E = e => t.eval(e);
    fs.mkdirSync(DOCS, { recursive: true });
    const shot = name => t.shot(path.join(DOCS, name));
    const st = () => J("({ s: Rywal.state(), f: TownQuests.state().flags, map: $gameMap.mapId(), step: Rywal.step(), gold: $gameParty.gold() })");
    const flagOn = (...names) => E(`(function(){ const f = TownQuests.state().flags; for (const k of ${JSON.stringify(names)}) if (!f[k]) f[k] = $gameSystem.dayNightDay(); return 0; })()`);
    const flagOff = (...names) => E(`(function(){ const f = TownQuests.state().flags; for (const k of ${JSON.stringify(names)}) delete f[k]; return 0; })()`);
    const live = () => E("Rywal.auto(true); Creatures.auto(false); Creatures.clear(); Hunting.auto(false); 0");
    const ours = () => J("$gameMap.events().filter(e => e.eventId() >= 828 && e.eventId() <= 839 && !e.isTransparent()).map(e => ({ id: e.eventId(), name: e.event().name.replace('W9: ', ''), x: e.x, y: e.y, img: e.characterName() }))");
    const goFloor = async (f, x, y) => {
        await E(`Underground.go(${f}); 0`);
        const map = await E(`Underground.mapOf(${f})`);
        const ok = await t.until(t.onMap(map), 25);
        await t.frames(25);
        await live();
        if (x !== undefined) { await t.locate(x, y, 2); await t.frames(6); }
        return ok;
    };
    const goMap = async (map, x, y, dir) => { await E(`(function(){ if ($gameMap.mapId() === ${map}) $gamePlayer.requestMapReload(); $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, ${dir || 2}, 0); return 0; })()`); const ok = await t.until(t.onMap(map), 25); await t.frames(25); await live(); return ok; };
    const fresh = () => E("(function(){ Rywal.fresh(); Humans.clear(); const f = TownQuests.state().flags; for (const k of Object.keys(f)) if (/^w9|^grum(Ally|Gone|Dead)$|^w8(Faction|Lost|Honour)$|^marekSaved$|^w5FactionWatches$|^borgarSaying$/.test(k)) delete f[k]; const r = TownQuests.state().q; delete r.W9; $gameSwitches.setValue(14, false); Underground.forceLord(null); Underground.state().notes = {}; return 0; })()");
    // the meeting: the rival waits on floor f (Rywal.debugMeet), the hero beside their leader - the talk starts by itself; picks: the choices
    const meet = async (variant, f, picks, o = {}) => {
        await E(kit.DRIVER + "; 0");
        await E(`(function(){ const T = window.__drv; T.on = true; T.picks = ${JSON.stringify(o.shot ? [] : picks)}; T.waiting = null; T.mark = T.log.length; T.cmark = T.choices.length; T.missing = []; return 0; })()`);
        const to = await J(`Rywal.debugMeet(${f}, ${JSON.stringify(variant)})`);
        await goMap(to[0], to[1], to[2], to[3]);
        await E("__standBy(835); 0");
        const started = await t.until("$gameMap.isEventRunning()", 15);
        if (o.shot) { await t.until("!!window.__drv.waiting", 20); await t.frames(15); await shot(o.shot); await E(`window.__drv.picks = ${JSON.stringify(picks)}; 0`); }
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 30);
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark).map(l => l.t), choices: window.__drv.choices.slice(window.__drv.cmark), missing: window.__drv.missing })");
        await E("window.__drv.on = false; 0");
        out.started = started;
        out.text = out.log.join(" / ").replace(/\s+/g, " ");
        return out;
    };
    const rivals = () => J("Humans.humans().filter(h => /^w9Rywal/.test(h._tag)).map(h => ({ kind: h._kind, name: h._label, tag: h._tag, look: h._look, level: h._level, x: h.x, y: h.y }))");
    const beatAll = (how) => E(`(function(){ const hs = Humans.humans().filter(h => /^w9Rywal/.test(h._tag)); for (const h of hs) if (h._tag === "w9Rywal") Humans.kill(h, "killed");
        for (const h of Humans.humans().filter(h => h._tag === "w9RywalLead")) { ${how === "spare" ? "Humans.surrender(h); Humans.decide(h._hid, 'spare');" : "Humans.kill(h, 'killed');"} } return hs.length; })()`);

    // ===================================================================== dane
    const pl = await J(`(function(){ const n = $plugins.filter(p => p.status).map(p => p.name), L = Hunting.LOOK8;
        return { n: ["Kantor", "Rywal_Data", "Rywal", "CleanHUD", "TownQuests", "Underground", "Humans", "Act3"].map(x => n.indexOf(x)),
            reg: Tawerna.inject.list().filter(r => r.owner === "Rywal").map(r => r.ids), steps: TownQuests.Q.W9.steps.map(s => (s.w9r || "w9") + ":" + s.ch),
            looks: ["$Human_Dwor", "$Human_Dwor_Atk", "$Human_Dwor_Guard", "$Human_Dwor_Kneel", "$Human_Dwor_Crouch", "$Human_Dwor_Lie", "$Human_Captain"].map(k => !!L[k]),
            hl: !!(Humans.LOOKS.Dwor && Humans.LOOKS.Dwor.shield) }; })()`);
    const [ka, rd, rw, ch, tq, ug, hu, a3] = pl.n;
    t.check("wtyczki: Rywal_Data tuż pod Kantor, Rywal pod nią i nad CleanHUD (po TownQuests, Underground, Humans, Act3)",
        ka >= 0 && rd === ka + 1 && rw === rd + 1 && rw < ch && rw > tq && rw > ug && rw > hu && rw > a3, pl.n);
    t.check("numery zdarzeń 828-839 właściciela Rywal; W9 ma dwa nowe kroki rozdziału 3 (rywal, dalej w głąb) za krokiem prawd (stare zapisy bez zmian)",
        pl.reg.includes("828-839") && pl.steps.join() === "w9:6,rival:3,after:3", pl);
    t.check("strażnik dworu do walki: wygląd Dwor (8 kierunków, ciosy, tarcza, klęczy, leży) i dowódca kopaczy (Captain) w Hunting.LOOK8, Humans.LOOKS.Dwor z tarczą",
        pl.looks.every(Boolean) && pl.hl, pl);

    // ===================================================================== kto jest rywalem
    await t.newGame({ map: 9, x: 10, y: 8, dir: 8, hour: 12, day: 62, quiet: true });
    await live();
    const who = async () => (await J("Rywal.who(true)")).key;
    const w0 = await who();
    await flagOn("w8Faction");
    const w1 = await who();
    await E("Underground.forceLord('rival'); 0");
    const w2 = await who();
    await flagOff("w8Faction");
    const w3 = await who();
    await E("Underground.forceLord(null); Kantor.state().outcome = 'double'; 0");
    await flagOn("w5FactionWatches");
    const w4 = await J("Rywal.who(true)");
    await flagOn("w8Faction", "grumAlly");
    const w5 = await who();
    await E("Kantor.state().outcome = ''; 0");
    await flagOff("w8Faction", "grumAlly", "w5FactionWatches");
    t.check("kto: bez niczego - ludzie Baltazara (Baltazar nie w garści); Grum przy frakcji (W8) - Grum; Lord rywalem i Grum przy frakcji - wciąż Grum (pierwszeństwo)",
        w0 === "baltazar" && w1 === "grum" && w2 === "grum", [w0, w1, w2]);
    t.check("...Lord rywalem bez Gruma - ludzie Lorda; Baltazar w garści (podwójna gra, frakcja patrzy) - kopacze Czarnych Oczu; Grum sojusznikiem - nie on",
        w3 === "lord" && w4.key === "kopacze" && w4.why === "kopaczeGrip" && w5 === "kopacze", [w3, w4, w5]);

    // ===================================================================== początek: krata otwarta, noc, błoto na stopniach
    await E("Underground.open(); 0");
    await t.frames(70);
    let s = await st();
    t.check("krata otwarta w dniu 62 - rywal jeszcze nie schodzi (wejdzie nocą); W9 jeszcze nie w dzienniku", !s.s.party && s.s.gateDay === 62 && !s.step, { gateDay: s.s.gateDay, party: s.s.party });
    await t.setDay(63, 13);
    await t.frames(70);
    s = await st();
    t.check("noc minęła: o 1:00 ludzie Baltazara weszli przez piwnicę; o 13:00 są na piętrze 3 (piętro co 6 godzin), piętra 1-2 za nimi",
        s.s.party === "baltazar" && s.s.rf === 3 && Object.keys(s.s.passed).join() === "1,2" && !!s.f.w9Rywal && !!s.f.w9RywalBaltazar, { party: s.s.party, rf: s.s.rf, passed: s.s.passed });
    await t.notices({ clear: true });
    await t.locate(15, 4, 8);
    await t.frames(40);
    s = await st();
    const cellarSaid = await J("SpeechBubbles.log ? SpeechBubbles.log.slice(-4).map(l => l.text || l) : []");
    t.check("piwnica tawerny: przy kracie bohater widzi błoto na stopniach - W9 „Serce Twierdzy” zaczyna się od rozdziału 3 (krok rywala)",
        !!s.s.cellar && s.step === "rival" && (await t.notices()).some(n => /Nowy wątek: Serce Twierdzy/.test(n)), { cellar: s.s.cellar, step: s.step, said: cellarSaid });
    const jo = await J("TownQuests.journalOps({ quest: TownQuests.Q.W9 }).map(o => o.text || '').join(' | ')");
    t.check("dziennik: „Rozdział 3” - Rywal w ruinach: ludzie Baltazara Veya schodzą po Serce przede mną, znak: białe oko kredą", /Rozdział 3/.test(jo) && /Rywal w ruinach: ludzie Baltazara Veya/.test(jo) && /białe oko kredą/.test(jo), jo.slice(0, 300));
    await goMap(10, 3, 7, 2);
    const ruins = await ours();
    t.check("Ruiny Zamku: dwa ślady butów i białe oko kredą przed wielkimi schodami", ruins.filter(e => /Ślady/.test(e.name)).length === 2 && ruins.some(e => /Białe oko/.test(e.name) && e.x === 16 && e.y === 8), ruins);
    await t.locate(12, 8, 6); await t.frames(30);
    await shot("slady_ruiny_zamku.png");

    // ===================================================================== zegar: nie wchodzą na piętro bohatera ani z niego
    await goFloor(4);
    await t.setDay(63, 23);
    await E("Rywal.tick(); 0");
    s = await st();
    t.check("bohater na piętrze 4: rywal (piętro 3) czeka - nie schodzi na piętro bohatera, choć minęło 10 godzin", s.s.rf === 3, s.s.rf);
    await goFloor(3);
    const f3 = await ours();
    t.check("piętro 3 (ich piętro): ognisko, przywódca i jego ludzie przy schodach w dół - ślady butów", f3.some(e => e.id === 831 && /Ognisko/.test(e.name)) && f3.some(e => e.id === 835) && f3.some(e => e.id === 836), f3);
    await t.setDay(64, 5);
    await E("Rywal.tick(); 0");
    t.check("...i dopóki bohater stoi na ich piętrze, zostają (spotkanie)", (await st()).s.rf === 3);
    await goFloor(1);
    await t.setDay(64, 13);
    await E("Rywal.tick(); 0");
    s = await st();
    t.check("bohater wraca na piętro 1 - rywal idzie dalej (nadrabia stracony czas): piętro 7 o 13:00 dnia 64", s.s.rf === 7 && !!s.s.passed[6], s.s.rf);

    // ===================================================================== ślady na piętrach
    const robbed1 = await J("Rywal.state().robbed[131] || []");
    const lay1 = await J("Rywal.layoutOf(1)");
    const f1 = await ours();
    t.check("piętro 1: znak przy schodach w dół i ślady butów na drodze schody-schody (nie na nich)",
        f1.some(e => e.id === 828 && e.x === lay1.mark[0] && e.y === lay1.mark[1]) && f1.filter(e => e.id === 829 || e.id === 830).length === 2, { f1, mark: lay1.mark });
    if (robbed1.length) {
        const id = robbed1[0];
        const pre = await E(`$gameSelfSwitches.value([131, ${id}, 'A'])`);
        await E(`Underground.search(${id}); 0`);
        const msg = await E("$gameMessage.allText()");
        await t.finish();
        t.check("puste skrzynie: pojemnik, który wybrali, już otwarty; przeszukany - „Wieko wyważone... ktoś był tu przede mną” (i nic nie daje)", pre && /ktoś był tu przede mną/.test(msg), { id, pre, msg });
    } else t.check("puste skrzynie (piętro 1 bez pojemników do wybrania w tym ziarnie - pominięte)", true);
    await goFloor(2);
    const lay2 = await J("Rywal.layoutOf(2)");
    const rope0 = await t.count(93);
    const ropeEv = (await ours()).find(e => e.id === 833);
    if (ropeEv) { await E("__standBy(833) || 0").catch(() => 0); await E(kit.DRIVER + "; __standBy(833); $gameMap.event(833).start(); 0"); await t.frames(20); }
    t.check("piętro 2: porzucona lina - podniesiona: +1 Lina, znika", !!ropeEv && (await t.count(93)) === rope0 + 1 && (await E("$gameMap.event(833).isTransparent()")), { ropeEv, before: rope0, after: await t.count(93) });
    await goFloor(3);
    const camp3 = await ours();
    t.check("piętro 3 (już za nimi): wygasłe ognisko i posłanie po ich obozie", camp3.some(e => e.id === 831 && /Wygasłe/.test(e.name)) && camp3.some(e => e.id === 832), camp3);
    const c3 = camp3.find(e => e.id === 831);
    if (c3) { await t.locate(c3.x + 1, c3.y, 4); await t.frames(30); await shot("slady_zimny_oboz.png"); }
    // the tripwire on floor 4: walked over - a blow and the bells; floor 8's - sneaking: cut, a rope
    await goFloor(4);
    const tr4 = await J("Rywal.layoutOf(4).trap");
    await t.locate(tr4[0] + (tr4[2] === "V" ? -2 : 0), tr4[1] - (tr4[2] === "H" ? 2 : 0), tr4[2] === "V" ? 6 : 2);
    await t.frames(10);
    await shot("slady_linka.png");
    await E("$gameParty.leader().setHp($gameParty.leader().mhp); 0");
    const hp0 = await E("$gameParty.leader().hp");
    await t.notices({ clear: true });
    await t.locate(tr4[0], tr4[1]);
    await t.frames(30);
    const hp1 = await E("$gameParty.leader().hp");
    t.check("piętro 4: linka z dzwonkami w poprzek drogi - przejście po niej: cios i dzwonki („Linka z dzwonkami!”), linka przecięta", hp1 < hp0 && (await J("Rywal.state().traps"))[4] === "hit" && (await t.notices()).some(n => /Linka z dzwonkami/.test(n)), { hp0, hp1, trap: tr4 });
    await t.setDay(65, 2);
    await E("Rywal.tick(); 0");
    t.check("dzień 65, 2:00 (bohater na piętrze 4, za nimi): rywal na piętrze 9", (await st()).s.rf === 9, (await st()).s.rf);
    await goFloor(8);
    const tr8 = await J("Rywal.layoutOf(8).trap");
    await E("Hunting.setSneak(true); 0");
    const rope1 = await t.count(93), hp2 = await E("$gameParty.leader().hp");
    await t.locate(tr8[0], tr8[1]);
    await t.frames(30);
    await E("Hunting.setSneak(false); 0");
    t.check("piętro 8: skradając się (C) bohater widzi linkę w porę - przecina ją: bez ciosu, +1 Lina", (await J("Rywal.state().traps"))[8] === "cut" && (await t.count(93)) === rope1 + 1 && (await E("$gameParty.leader().hp")) === hp2, { trap: tr8 });
    // the torn notes: floors 6-8 passed before the hero read them
    const torn = await J("Rywal.state().torn");
    await E("Underground.read(7); 0");
    const tornMsg = await E("$gameMessage.allText()");
    await t.finish();
    t.check("wyrwane zapiski: kartki zakonu z pięter 6-8 (schody, klucze, dziesiąta brama) zabrane; „Liczenie stopni” (piętro 7) - tylko strzępy przy gwoździu",
        !!torn["6"] && !!torn["7"] && torn["8"] !== undefined && /Kartki wyrwane/.test(tornMsg) && !(await J("Underground.state().notes"))["7"], { torn, tornMsg });

    // ===================================================================== spotkanie: ludzie Baltazara na piętrze 9 - walka wygrana, zapiski odzyskane
    const m1 = await meet("", 9, ["Odejdźcie"], { shot: "spotkanie_baltazar.png" });
    t.check("piętro 9: przy ognisku Baltazar Vey i jego ludzie - rozmowa zaczyna się sama, gdy bohater podejdzie: „Przyjacielu! Co za spotkanie...”; wybory: walka / nie moja sprawa",
        m1.started && /Baltazar Vey/.test(m1.text) && /Co za spotkanie/.test(m1.text) && m1.choices[0] && m1.choices[0][0].startsWith("Odejdźcie") && m1.choices[0].includes("Nie moja sprawa."), m1);
    await t.frames(30);
    let men = await rivals();
    t.check("walka: Baltazar odchodzi („Ja nie lubię widoku krwi”), jego ludzie (bandyta, nożownik, łucznik) w walce - z poziomem piętra",
        men.length === 3 && men.every(h => h.tag === "w9Rywal" && h.level >= 6) && ["bandit", "knifer", "archer"].every(k => men.some(h => h.kind === k)), men);
    await t.frames(20);
    await shot("walka_baltazar.png");
    await beatAll();
    await t.frames(30);
    s = await st();
    const notesNow = await J("Underground.state().notes");
    t.check("pobici: flagi w9RywalPobity i w9FrakcjaPobita; w ich worku wyrwane zapiski (6, 7, 8) - teraz przeczytane, w dzienniku",
        s.s.outcome === "pobici" && !!s.f.w9RywalPobity && !!s.f.w9FrakcjaPobita && !s.f.w9FrakcjaWie && notesNow["6"] && notesNow["7"] && notesNow["8"] && s.s.recovered === 3, { outcome: s.s.outcome, rec: s.s.recovered, notesNow });
    const jo2 = await J("TownQuests.journalOps({ quest: TownQuests.Q.W9 }).map(o => o.text || '').join(' | ')");
    t.check("W9: krok rywala zrobiony (✓), teraz „Rywal w ruinach pobity na piętrze 9. Dalej w głąb...” (czeka na prawdy z Warstwy Prawdy)",
        s.step === "after" && /✓ Rywal w ruinach/.test(jo2) && /pobity na piętrze 9\. Dalej w głąb/.test(jo2), jo2.slice(0, 400));
    const ep = await J("Underground.epilogueLines('zniszczyc', 'hero')");
    const wr = await J("Underground.world().rival");
    t.check("Serce: Underground.world().rival = { baltazar, pobici }, a w epilogu linijka o kartkach zakonu odebranych Czarnym Oczom",
        wr && wr.key === "baltazar" && wr.outcome === "pobici" && ep.some(l => /Kartki zakonu, które Czarne Oczy wyrwały/.test(l)), { wr, ep });
    await E("TownQuests.state().flags.ansgarAlly = 1; 0");
    const a3w = await J(`(function(){ const w3 = Act3Data.WAVES.find(w => w.id === "w3"), c = { flags: TownQuests.state().flags };
        const n = w3.fewer(c), note = w3.fewerNotice(c); delete c.flags.ansgarAlly; return { n, note, n1: w3.fewer(c), note1: w3.fewerNotice(c), extra: w3.extra(c).length }; })()`);
    t.check("Akt III: pobici zwiadowcy z ruin - przez kuchnię wchodzi o jednego mniej (z Erykiem Sową o dwóch), napis „Zwiadowców... już nie mają”",
        a3w.n === 2 && a3w.n1 === 1 && /zwiadowców z ruin/.test(a3w.note[1]) && /Zwiadowców, których pobiłeś/.test(a3w.note1[1]) && a3w.extra === 0, a3w);
    await goFloor(9);
    const ash9 = await ours();
    t.check("po walce na piętrze 9 zostaje ich wygasłe ognisko (bez ludzi)", ash9.some(e => e.id === 831 && /Wygasłe/.test(e.name)) && !ash9.some(e => e.id === 835), ash9);

    // ===================================================================== ludzie Lorda: walka przegrana (obrabowany)
    await fresh();
    await E("Underground.forceLord('rival'); 0");
    const m2 = await meet("", 4, ["Zejdźcie"]);
    men = await rivals();
    t.check("ludzie Lorda (Lord rywalem): „Stój! W imieniu jaśnie pana Zaleskiego” - walka ze strażnikami dworu w czerwieni (wygląd Dwor, tarcze)",
        /W imieniu jaśnie pana Zaleskiego/.test(m2.text) && men.length === 3 && men.every(h => h.look === "Dwor" && h.kind === "mercenary") && men.some(h => h.name === "Starszy straży dworu"), { text: m2.text, men });
    await t.frames(40);
    await shot("walka_straz_dworu.png");
    await E("Tawerna.emit('heroRobbed', { tag: 'w9Rywal', gold: 0, items: [] }); 0");
    await t.frames(10);
    s = await st();
    t.check("bohater pobity (Humans.js: obrabowany, nie ginie): rywal „wygrali” - flagi w9RywalWygral i w9DworWie; to nie frakcja: bez w9FrakcjaWie",
        s.s.outcome === "wygrali" && !!s.f.w9RywalWygral && !!s.f.w9DworWie && !s.f.w9FrakcjaWie, { outcome: s.s.outcome });
    const lordLines = await J(`(function(){ const w = Underground.world(); return Underground_Data.HEART.LORD.arrive.rival.filter(st => Array.isArray(st) && typeof st[1] === "function").map(st => st[1](w)); })()`);
    t.check("Serce: Lord-rywal mówi o swoich ludziach z ruin („Moi ludzie wrócili z ruin z twoją sakiewką”)", lordLines.some(l => /wrócili z ruin z twoją sakiewką/.test(l)), lordLines);
    await E("Humans.clear(); 0");

    // ===================================================================== ludzie Lorda: raport / ostrzeżenie (rozmowa)
    await fresh();
    await E("Underground.forceLord('rival'); 0");
    const m3 = await meet("", 2, ["Raport"]);
    await t.frames(30);
    s = await st();
    t.check("ludzie Lorda: „Raport zdam jaśnie panu sam” - wracają na górę (w9DworRaport), W9 dalej", s.s.outcome === "raport" && !!s.f.w9DworRaport && /Pan lubi, kiedy przychodzi się najpierw do niego/.test(m3.text), { outcome: s.s.outcome, text: m3.text });
    await t.until("[835, 836, 837].every(id => !$gameMap.event(id) || $gameMap.event(id).isTransparent())", 12);
    const gone3 = await J("[835, 836, 837].map(id => !$gameMap.event(id) || $gameMap.event(id).isTransparent())");
    t.check("...odchodzą (idą do schodów w górę i znikają)", gone3.every(Boolean), gone3);
    await fresh();
    await E("Underground.state().deepest = 12; 0");
    const m4 = await meet("baltazar", 3, ["Dalej czeka"]);
    s = await st();
    t.check("ostrzeżenie (bohater był już przy dziesiątej bramie): „Zbroja, która zabija? Interes to interes - ale trup nie handluje” - zawrócili (w9RywalZawrocil)",
        s.s.outcome === "zawrocili" && !!s.f.w9RywalZawrocil && /trup nie handluje/.test(m4.text), { outcome: s.s.outcome, text: m4.text });

    // ===================================================================== dziesiąta brama: słowa sprzedane - w dół, do Serca
    await fresh();
    await E("$gameSwitches.setValue(14, true); 0");
    const gold0 = await t.gold();
    const m5 = await meet("baltazar", 10, ["Sprzedam"], { shot: "spotkanie_dziesiata_brama.png" });
    s = await st();
    t.check("dziesiąta brama: obóz w sali straży, ranny przy ogniu („Józek spróbował przejść”); bohater zna słowa - sprzedaje je: +150 G, idą w dół (w9RywalHaslo, w9RywalWDol, w9FrakcjaWie)",
        /Józek spróbował przejść/.test(m5.text) && s.s.outcome === "haslo" && s.gold === gold0 + 150 && !!s.f.w9RywalWDol && !!s.f.w9FrakcjaWie && s.s.deep, { outcome: s.s.outcome, text: m5.text, gold: s.gold - gold0 });
    const a3e = await J(`(function(){ const w3 = Act3Data.WAVES.find(w => w.id === "w3"), c = { flags: TownQuests.state().flags }; return { extra: w3.extra(c), fewer: w3.fewer(c) }; })()`);
    t.check("Akt III: frakcja zna piwnice - z grupą przez kuchnię przychodzi „Zwiadowca z ruin”", a3e.extra.length === 1 && a3e.extra[0].name === "Zwiadowca z ruin" && a3e.fewer === 0, a3e);
    await goMap(11, 15, 18, 8);
    const heart = await ours();
    t.check("Komnata Serca: ludzie Baltazara czekają przed drzwiami (trzy zamki ich nie wpuściły) - świadkowie", heart.some(e => e.id === 835 && /Baltazar/.test(e.name)) && heart.some(e => e.id === 836), heart);
    await t.locate(21, 18, 6); await t.frames(60);
    await shot("serce_swiadkowie.png");
    const ep2 = await J("Underground.epilogueLines('zapieczetowac', 'hero')");
    t.check("...a epilog: „Baltazar Vey widział drzwi Komnaty Serca...”", ep2.some(l => /Baltazar Vey widział drzwi Komnaty Serca/.test(l)), ep2);

    // ===================================================================== kopacze Czarnych Oczu: przewodnik / walka (dowódca zabity)
    await fresh();
    await E("Kantor.state().outcome = 'double'; $gameSwitches.setValue(14, true); 0");
    await flagOn("w5FactionWatches");
    const m6 = await meet("", 10, ["Poprowadzę"]);
    s = await st();
    t.check("kopacze Czarnych Oczu (Baltazar w garści - podwójna gra): „Kupiec mówi, że jesteś nasz”; bohater prowadzi ich przez bramę: +100 G, w dół (przewodnik)",
        s.s.party === "kopacze" && /Kupiec mówi, że jesteś nasz/.test(m6.text) && s.s.outcome === "przewodnik" && s.s.deep, { party: s.s.party, text: m6.text, outcome: s.s.outcome });
    await fresh();
    await E("Kantor.state().outcome = 'double'; 0");
    await flagOn("w5FactionWatches");
    await meet("", 6, ["Zawracajcie"]);
    men = await rivals();
    t.check("kopacze: walka - dowódca kopaczy (czarna zbroja z białym okiem, wygląd Captain) i dwóch kopaczy", men.some(h => h.name === "Dowódca kopaczy" && h.look === "Captain" && h.tag === "w9RywalLead") && men.filter(h => h.name === "Kopacz Czarnych Oczu").length === 2, men);
    await t.frames(30);
    await shot("walka_kopacze.png");
    await beatAll();
    await t.frames(20);
    s = await st();
    const w4n = await J(`(function(){ const w4 = Act3Data.WAVES.find(w => w.id === "w4"); return w4.extra({ flags: TownQuests.state().flags, grum: "neutral" })[0].name; })()`);
    t.check("dowódca zabity w ruinach (w9DowodcaPolegl): w Akcie III frontowymi drzwiami wchodzi „Nowy dowódca kopaczy”", s.s.outcome === "pobici" && s.s.how === "killed" && !!s.f.w9DowodcaPolegl && w4n === "Nowy dowódca kopaczy", { how: s.s.how, w4n });
    await E("Kantor.state().outcome = ''; 0");
    await flagOff("w5FactionWatches");

    // ===================================================================== Grum: zawraca (dwa z trzech) / zabity / puszczony
    await fresh();
    await flagOn("w8Faction", "marekSaved", "w8Honour");
    const m7 = await meet("", 5, ["To nie twoja"]);
    s = await st();
    const act3Grum = await J("(function(){ const f = TownQuests.state().flags; return f.grumDead ? 'dead' : f.grumGone ? 'gone' : f.grumAlly ? 'ally' : f.w8Faction ? 'enemy' : 'neutral'; })()");
    t.check("Grum (W8: frakcja), a bohater ma dwa z trzech (Marek, siłowanie na honor): „To nie twoja wojna, Grum” - zawraca: grumAlly (w Akcie III staje przy drzwiach)",
        s.s.party === "grum" && /Marek wrócił do Ludmiły/.test(m7.text) && /raz może/.test(m7.text) && s.s.outcome === "sojusz" && !!s.f.grumAlly && act3Grum === "ally" && (await J("Underground.world().grum")) === "ally", { text: m7.text, outcome: s.s.outcome, act3Grum });
    await fresh();
    await flagOn("w8Faction");
    const m8 = await meet("", 5, ["To nie twoja"]);
    t.check("...bez dwóch z trzech: „Za mało, chłopcze” - rozmowa kończy się, nic się nie zmienia", /Za mało, chłopcze/.test(m8.text) && !(await st()).s.outcome, m8.text);
    await E("__drv.on = true; __drv.picks = ['Odejdź, Grum']; $gameMap.event(835).start(); 0");
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 20);
    await E("__drv.on = false; 0");
    men = await rivals();
    t.check("walka z Grumem: najemnik „Grum” (przywódca) i jego dwóch ludzi", men.some(h => h.name === "Grum" && h.kind === "mercenary" && h.tag === "w9RywalLead") && men.length === 3, men);
    await t.frames(30);
    await shot("walka_grum.png");
    await beatAll("spare");
    await t.frames(20);
    s = await st();
    t.check("Grum pokonany i puszczony wolno - odpływa (grumGone), notatka „Odpływam pierwszym promem”", s.s.outcome === "pobici" && s.s.how === "spared" && !!s.f.grumGone && !s.f.grumDead, { how: s.s.how });
    await fresh();
    await flagOn("w8Lost");
    const m9 = await meet("", 5, ["Odejdź, Grum"]);
    await beatAll();
    await t.frames(20);
    s = await st();
    t.check("Grum, który pobił bohatera przy tunelu (w8Lost): „Raz cię już położyłem...” - zabity: grumDead", /Raz cię już położyłem/.test(m9.text) && !!s.f.grumDead && s.s.how === "killed", { how: s.s.how });

    // ===================================================================== odejście spod bramy (Borgar to słyszał)
    await fresh();
    await t.setDay(70, 10);
    const to10 = await J(`Rywal.debugMeet(10, "baltazar")`);
    await goMap(9, 15, 4, 8);
    await E("Rywal.state().gateSince = (70 - 3) * 24 + 9; Rywal.state().at = Rywal.state().gateSince; 0");
    await E("Rywal.tick(); 0");
    await t.frames(30);
    s = await st();
    t.check("trzy dni przy dziesiątej bramie bez bohatera - odchodzą na górę z tym, co zebrali (odeszli, w9FrakcjaWie); bohater dowiaduje się w piwnicy od Borgara",
        s.s.outcome === "odeszli" && !!s.f.w9RywalOdszedl && !!s.f.w9FrakcjaWie && !!s.s.learned && s.step === "after", { outcome: s.s.outcome, learned: s.s.learned, to10 });

    // ...the same, but the hero never went down after the grate was opened: Borgar's words are all he knows - W9 begins already past the rival
    await fresh();
    await t.setDay(72, 10);
    await J(`Rywal.debugMeet(10, "lord")`);
    await goMap(1, 50, 40, 8);
    await E("(function(){ const s = Rywal.state(); s.first = 0; s.cellar = 0; s.seen = {}; s.gateSince = (72 - 3) * 24 + 9; s.at = s.gateSince; delete TownQuests.state().q.W9; Rywal.tick(); return 0; })()");
    await t.notices({ clear: true });
    await t.frames(40);
    s = await st();
    const tops = await t.notices();
    t.check("...a gdy bohater nie zszedł ani razu: w tawernie „Borgar mówi, że w nocy obcy wyszli z piwnicy” - bez imion („Ktoś był w ruinach”), W9 od razu za rozdziałem rywala",
        s.s.outcome === "odeszli" && !!s.s.learned && s.step === "after" && tops.some(n => /Ktoś był w ruinach/.test(n)) && !tops.some(n => /Lorda/.test(n)) &&
        /Ktoś był w ruinach przede mną i wyszedł nocą/.test(await J("TownQuests.journalOps({ quest: TownQuests.Q.W9 }).map(o => o.text || '').join(' | ')")), { tops, step: s.step });

    // ===================================================================== prawda z Warstwy Prawdy: W9 przechodzi do rozdziału 6
    await E(`(function(){ Underground.state().truths["85"] = { who: "piekarka", floor: 85 }; Tawerna.emit("undergroundTruth", { key: "85", who: "piekarka", name: "Hanka", floor: 85, text: "" }); return 0; })()`);
    t.check("pierwsza prawda z Warstwy Prawdy: W9 przechodzi do rozdziału 6 (krok prawd TownQuests)", (await J("TownQuests.rec('W9').step")) === 0);

    // ===================================================================== zapis i wczytanie w środku rozdziału
    await fresh();
    await E(`Rywal.debugMeet(5, "baltazar"); 0`);
    await goFloor(3);
    const before = await J("({ s: Rywal.state(), ev: $gameMap.events().filter(e => e.eventId() >= 828 && e.eventId() <= 839).map(e => e.eventId() + ':' + e.x + ',' + e.y).join(' ') })");
    await t.saveTo(1);
    await t.loadFrom(1);
    await live();
    const after = await J("({ s: Rywal.state(), ev: $gameMap.events().filter(e => e.eventId() >= 828 && e.eventId() <= 839).map(e => e.eventId() + ':' + e.x + ',' + e.y).join(' ') })");
    t.check("zapis i wczytanie: stan rywala (piętro 5, ślady, puste skrzynie) i zdarzenia piętra 3 te same", after.s.rf === 5 && after.s.party === "baltazar" && after.ev === before.ev && JSON.stringify(after.s.robbed) === JSON.stringify(before.s.robbed), { before: before.ev, after: after.ev });

    // ...and a save made in the middle of a fight: the men of Humans.js are not in the save - loaded, they stand at their fire again, the talk works
    await fresh();
    await meet("baltazar", 5, ["Odejdźcie"]);
    const fighting = (await rivals()).length;
    await t.saveTo(2);
    await t.loadFrom(2);
    await live();
    await t.frames(20);
    const back = await J("({ fight: Rywal.state().fight, lead: !!$gameMap.event(835) && !$gameMap.event(835).isTransparent(), men: Humans.humans().filter(h => /^w9Rywal/.test(h._tag)).length })");
    t.check("zapis w środku walki: po wczytaniu ludzie Baltazara znów stoją przy ognisku (walka od nowa albo rozmowa), nic nie wisi", fighting === 3 && !back.fight && back.lead && back.men === 0, { fighting, back });

    // ===================================================================== F9: „Wyspa i fabuła”
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 10);
    await E("SceneManager.push(Scene_Debug); 0");
    await t.until("SceneManager._scene instanceof Scene_Debug && SceneManager._scene._started", 10);
    const f9 = await J(`(function(){ const s = SceneManager._scene, l = s._list; l.setTab(5, 0); return l._rows.filter(r => /^isleW9/.test(r.kind)).map(r => ({ kind: r.kind, label: r.label, desc: r.desc })); })()`);
    t.check("F9 „Wyspa i fabuła”: „W9: rywal (wymuś wariant): z gry” i „W9: rywal - spotkanie na piętrze N”, z opisami", f9.length === 2 && /W9: rywal \(wymuś wariant\): z gry/.test(f9[0].label) && /spotkanie na piętrze \d+/.test(f9[1].label) && f9.every(r => r.desc.length > 20), f9);
    await E(`(function(){ const s = SceneManager._scene, l = s._list; let i = l._rows.findIndex(r => r.kind === "isleW9"); l.select(i); l.changeQty(2); i = l._rows.findIndex(r => r.kind === "isleW9Meet"); l.select(i); l.changeQty(2); return 0; })()`);
    await t.frames(5);
    await shot("f9_rywal.png");
    await E(`(function(){ const s = SceneManager._scene, l = s._list; l.select(l._rows.findIndex(r => r.kind === "isleW9Meet")); s.onOk(); return 0; })()`);
    await t.until(t.onMap(), 20);
    await t.frames(30);
    s = await st();
    t.check("F9: wariant „Grum z najemnikami” i spotkanie na piętrze 6 - bohater na piętrze 6, Grum czeka przy ognisku", s.map === 136 && s.s.party === "grum" && s.s.rf === 6 && (await ours()).some(e => e.id === 835 && /Grum/.test(e.name)), { map: s.map, party: s.s.party, rf: s.s.rf });
});
