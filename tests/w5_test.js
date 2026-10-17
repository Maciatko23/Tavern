// W5 „Towary z kontynentu” (Kantor.js, Kantor_Data.js; docs/QUESTY.md W5) - cały wątek od pierwszej poszlaki do Aktu II:
//   - dane: wtyczki na swoich miejscach, mapa 171 „Piwnica kantoru” pod Kantorem (Map103), numery 730-759 w rejestrze, plan nocy Baltazara
//   - rozdz. 1: poszlaki (K15, D11, Kłos przy tylnych drzwiach w noc po promie) - wątek zaczyna się sam od dnia 10
//   - rozdz. 2: kurier w kapturze puka trzy razy po północy (spłoszony, gdy widzi bohatera; zobaczony z ukrycia - dzwon „trzy i jeden”),
//     obóz przemytników na Skraju lasu: podsłuchana rozmowa / bijatyka (list przewozowy) / pobity bohater (obrabowany, obóz znika)
//   - rozdz. 3: Baltazar najmuje bohatera; dwie noce: tylne drzwi -> zaplecze -> klapa -> piwnica, trzy skrzynie pod tylne drzwi, 20 G
//   - rozdz. 4: trzecia noc - Baltazar wychodzi o 0:30, rejestr z biurka (zabrany / przepisany), karta 1 kronik ze szkatuły, powrót
//     Baltazara; przyłapany w gabinecie - wyrzucony bez zapłaty; Sławek podnosi alarm
//   - rozdz. 5: Wit z zaufaniem (kantor zamknięty, Wit sojusznik) / Wit bez zaufania (rejestr spalony, noc w wartowni) / sołtys (zebranie
//     nazajutrz: kantor zamknięty, Opinia +12) / podwójna gra (30 G na tydzień) / szantaż (50 G, wróg: ceny x2, napad)
//   - rozdz. 6: noc promu na Polnej drodze: straż przy wozie, zasadzka, ładunek zdobyty (kamienie z krukiem), Rafał uwolniony; podmiana
//     skrzyń po cichu; pobity bohater; przegapiona noc; wspólnik puszcza wóz (30 G)
//   - rozdz. 7: uczciwy kantor (sklep -10%), Baltazar na przystani (Akt II), tani towar dla wspólnika, drogi dla wroga
//   - haki: kamienie z wraku i soczewka w rejestrze, cena odkupu soczewki u wroga, karta 1 nie do odkupienia, póki leży w szkatule,
//     Kłos, Akt III (Wit broni tawerny, najemnik Baltazara w fali), F9 (przeskok do rozdziału)
// Przed instalacją (edytor otwarty): sam dopisuje Kantor_Data / Kantor do listy wtyczek (GAME_PLUGINS_ADD) i bierze mapę 171 z
// tools/w5/staging (nakładka), gdy data/ jeszcze jej nie ma. Po instalacji działa tak samo bez tego.
// Uruchom: CDP_PORT=9508 node tests/w5_test.js (serwer: node tools/serve.js). Zrzuty: docs/w5/*.png
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
if (!/"name":"Kantor"/.test(fs.readFileSync(path.join(ROOT, "js", "plugins.js"), "utf8")) && !process.env.GAME_PLUGINS_ADD) process.env.GAME_PLUGINS_ADD = "Cysterna_Data:Kantor_Data;Cysterna:Kantor";
const OVERLAY = fs.existsSync(path.join(ROOT, "data", "Map171.json")) ? undefined : "tools/w5/staging";
const kit = require("./lib/kit.js");
const DOCS = path.join(ROOT, "docs", "w5");

kit.test({ port: 9508, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e), E = e => t.eval(e);
    const st = () => J("({ step: Kantor.step(), s: Kantor.state(), gold: $gameParty.gold(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, hour: +$gameSystem.dayNightHour().toFixed(2), day: $gameSystem.dayNightDay(), f: TownQuests.state().flags, v: TownQuests.state().v })");
    const setTime = (d, h) => E(`(function(){ $gameSystem._dayNightDay = ${d}; $gameSystem.setDayNightHour(${h}); TownQuests.autoChecks(); return 0; })()`);
    const flagOn = (...names) => E(`(function(){ const f = TownQuests.state().flags; for (const k of ${JSON.stringify(names)}) if (!f[k]) f[k] = $gameSystem.dayNightDay(); TownQuests.autoChecks(); return 0; })()`);
    const flagOff = (...names) => E(`(function(){ const f = TownQuests.state().flags; for (const k of ${JSON.stringify(names)}) delete f[k]; return 0; })()`);
    // (calm: false - the kit's quiet would clear the men of Humans.js that Kantor.js puts on the map as it comes up)
    const go = async (map, x, y, dir) => { const ok = await t.go(map, x, y, dir || 2, { calm: false }); await E("Survival.calmWeather && Survival.calmWeather(); 0"); await t.frames(10); return ok; };
    // an event of this map started as by the action button (its talk driven: picks); waits for the map to be free (or another map)
    const use = async (id, picks, o = {}) => {
        const map = await E("$gameMap.mapId()");
        const r = await t.talkTo(id, picks || [], Object.assign({ place: false, secs: 20 }, o));
        await t.until(`!$gamePlayer.isTransferring() && SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()`, 20);
        await t.frames(12);
        r.map = await E("$gameMap.mapId()");
        r.moved = r.map !== map;
        return r;
    };
    const resident = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talk = async (key, picks, o) => {
        const ok = await t.until(`!!${resident(key)} && !${resident(key)}._town.hidden`, 15);
        if (!ok) return { text: "", missing: ["nie ma: " + key], done: false };
        await E(`__standBy(${resident(key)}.eventId()); 0`);
        return t.talkTo(resident(key), picks, Object.assign({ place: false }, o || {}));
    };
    const shot = name => t.shot(path.join(DOCS, name));
    // a day with no K16 trade at the kantor (the day after a ferry Baltazar buys first): his own talks come
    const calm = d => E(`(function(){ let d = ${d}; while (TownQuests.isFerry(d - 1)) d++; return d; })()`);
    fs.mkdirSync(DOCS, { recursive: true });
    await E(kit.DRIVER + "; 0");

    // ===================================================================== dane
    const pl = await J(`(function(){ const n = $plugins.filter(p => p.status).map(p => p.name);
        return { n: ["Cysterna_Data", "Kantor_Data", "TownLife", "TownQuests", "Cysterna", "Kantor", "CleanHUD"].map(x => n.indexOf(x)),
            map: $dataMapInfos[171] ? [$dataMapInfos[171].name, $dataMapInfos[171].parentId] : null,
            reg: Tawerna.inject.list().filter(r => r.owner === "Kantor").map(r => r.ids), w5: !!TownQuests.Q.W5,
            plan: TownLife.RESIDENTS.find(r => r.key === "kupiec").plan.filter(p => p[3] === "w5Shift").length,
            alt: (TownLife.RESIDENTS.find(r => r.key === "kupiec").alt || {}).map }; })()`);
    const [cd, kd, tl, tq, cy, ka, ch] = pl.n;
    t.check("wtyczki: Kantor_Data pod Cysterna_Data i nad TownLife/TownQuests, Kantor pod Cysterna i nad CleanHUD",
        cd >= 0 && kd === cd + 1 && kd < tl && kd < tq && ka > cy && ka < ch, pl.n);
    t.check("mapa 171 „Piwnica kantoru” pod Kantorem (103), numery 730-759 właściciela Kantor, zadanie W5 w TownQuests",
        pl.map && pl.map[0] === "Piwnica kantoru" && pl.map[1] === 103 && pl.reg.includes("730-759") && pl.w5, pl);
    t.check("plan Baltazara: trzy wpisy nocnej zmiany (w5Shift) i przeprowadzka na przystań (alt: mapa 125)", pl.plan === 3 && pl.alt === 125, pl);

    // ===================================================================== rozdz. 1: poszlaki
    await t.newGame({ map: 8, x: 12, y: 41, quiet: true, day: 9, hour: 10 });
    await E("Humans.auto(false); Humans.clear(); 0");
    await flagOn("k15Clean");
    let s = await st();
    t.check("rozdz. 1: przed dniem 10 wątek się nie zaczyna (jedna poszlaka: skrzynia K15)", !s.step && !s.s.outcome, s.step);
    await setTime(10, 10);
    s = await st();
    t.check("...od dnia 10 zaczyna się sam: „Dziwny kupiec” - poszlaki 1 z 2", s.step === "w5Poszlaki", { step: s.step, clues: await J("Kantor.clues()") });
    // Kłos at the back door on the night after a ferry (Garnizon.js's event 659): a clue
    const ferryD = await E("(function(){ let d = 10; while (!TownQuests.isFerry(d) && d < 40) d++; return d; })()");
    await setTime(ferryD, 23.3);
    await go(8, 8, 40, 6);
    await t.frames(80);
    const klos = await J("({ ev: !!$gameMap.event(659) && !$gameMap.event(659).isTransparent(), at: $gameMap.event(659) ? [$gameMap.event(659).x, $gameMap.event(659).y] : null, clue: Kantor.state().clues.klos, step: Kantor.step() })");
    t.check("hak D27: kwatermistrz Kłos nocą po promie przy tylnych drzwiach kantoru - poszlaka „nocni goście”, druga poszlaka kończy rozdz. 1",
        klos.ev && !!klos.clue && klos.step === "w5Stuk", klos);

    // ===================================================================== rozdz. 2: trzy stuknięcia
    // spooked: the hero stands in the courier's way, not hiding
    const night1 = ferryD + 1;
    await setTime(night1, 0.05);
    await go(8, 16, 40, 4);
    await E("Hunting.setSneak(false); 0");
    await t.until("!!Kantor.visitors()[733] && Kantor.visitors()[733].phase === 'come'", 10);
    await E("$gameMap.event(733).locate(22, 40); 0");
    await t.until(`Kantor.state().knock.spooked === TownQuests.nightOf()`, 25);
    s = await st();
    t.check("rozdz. 2: kurier w kapturze widzi bohatera na swojej drodze - „Ktoś tu jest... Nie dziś.” - i zawraca (nie puka)", s.s.knock.spooked === night1 - 1 && !s.s.knock.seen, s.s.knock);
    // the next night: hidden up the alley, sneaking
    await setTime(night1 + 1, 0.12);
    await go(8, 8, 37, 2);
    await E("Hunting.setSneak(true); TownQuests.state().bells.length = 0; 0");
    await t.until("!!Kantor.visitors()[733] && Kantor.visitors()[733].phase === 'come'", 10);
    await E("$gameMap.event(733).locate(13, 40); 0");
    await t.until("Kantor.visitors()[733] && Kantor.visitors()[733].phase === 'knock'", 15);
    await E("$gamePlayer.locate(7, 40); $gamePlayer.setDirection(6); 0");   // (for the picture: by the street lamp, three steps from the door)
    await t.frames(75);
    await shot("tylne_drzwi_noca.png");
    await t.until("Kantor.state().knock.seen > 0", 10);
    await t.frames(30);
    s = await st();
    const bell = await J("({ bells: TownQuests.state().bells.map(b => b.sig), q: TownQuests.bellQueue().length })");
    t.check("...z ukrycia (C): kurier puka trzy razy w tylne drzwi kantoru, bohater to widzi - rozdz. 2 dalej: obóz przemytników",
        s.s.knock.seen > 0 && s.step === "w5Oboz", { knock: s.s.knock, step: s.step });
    t.check("...po północy Ambroży dzwoni „trzy i jeden” (sygnał W2 „obcy w murach” zapisany w dzienniku)", bell.bells.includes("3+1"), bell);
    await E("Hunting.setSneak(false); 0");
    await t.saveTo(1);

    // ---- the camp: heard (sneaking, from behind the crates of the cart)
    await setTime(night1 + 1, 22);
    await E("Humans.clear(); Kantor.opts.talkGap = 40; 0");
    await go(23, 24, 1, 2);
    await t.frames(40);
    const camp = await J("({ men: Kantor.campMen().map(h => [h._kind, h._mode, h._x, h._y]), fire: !!$gameMap.event(753) && !$gameMap.event(753).isTransparent(), cart: !!$gameMap.event(750) && !$gameMap.event(750).isTransparent(), courier: !!$gameMap.event(752) && !$gameMap.event(752).isTransparent(), light: /Light:/.test($gameMap.event(753).event().note) })");
    t.check("obóz przemytników na Skraju lasu (Map023, noc): ognisko z ogniem i światłem, wóz, kurier, czterech ludzi Baltazara przy ognisku (siedzą i śpią)",
        camp.fire && camp.light && camp.cart && camp.courier && camp.men.length === 4 && camp.men.some(m => m[1] === "sit") && camp.men.some(m => m[1] === "sleep"), camp);
    await E("Hunting.setSneak(true); $gamePlayer.locate(30, 4); $gamePlayer.setDirection(6); 0");
    await t.frames(60);
    await shot("oboz_przemytnikow.png");
    await t.until("Kantor.state().camp.heard > 0 || Kantor.campMen().some(h => h._engaged)", 40);
    s = await st();
    t.check("...podkradziony po cichu słyszy rozmowę przy ognisku (sztab chce kamieni z krukiem, zboże z rekwizycji, „drzwi pod skałą”, księga kupca) - rozdz. 3",
        s.s.camp.heard > 0 && s.step === "w5Najem", { camp: s.s.camp, step: s.step, engaged: await E("Kantor.campMen().filter(h => h._engaged).length") });
    await E("Hunting.setSneak(false); 0");
    await t.saveTo(2);

    // ---- the camp: a fight (load) - won: the bill of lading
    await t.loadFrom(1, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await setTime(night1 + 1, 22);
    await go(23, 24, 1, 2);
    await t.frames(30);
    await E("Kantor.campMen()[0].engage(false); 0");
    await t.frames(20);
    const eng = await J("({ n: Kantor.campMen().filter(h => h._engaged).length, courier: $gameMap.event(752).isTransparent() })");
    await E("for (const h of Kantor.campMen().slice()) Humans.kill(h); 0");
    await t.until("Kantor.step() === 'w5Najem'", 10);
    s = await st();
    t.check("...zauważony: cała grupa rzuca się na bohatera, kurier ucieka do lasu; pobici - w worku list przewozowy z pieczęcią kantoru, rozdz. 3",
        eng.n >= 3 && eng.courier && s.s.camp.fought > 0 && (s.v.list_przewozowy || 0) === 1 && s.step === "w5Najem", { eng, camp: s.s.camp, v: s.v });
    // ---- the camp: beaten (load) - robbed, the camp packs up for the night
    await t.loadFrom(1, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await setTime(night1 + 1, 22);
    await go(23, 24, 1, 2);
    await t.frames(30);
    await E("(function(){ const h = Kantor.campMen()[0]; h.engage(false); Humans.beatenBy(h); return 0; })()");
    await t.until("Kantor.state().camp.beaten === TownQuests.nightOf()", 15);
    await t.frames(40);
    s = await st();
    t.check("...pobity: obrabowany jak przez każdych ludzi, obóz znika na tę noc, rozdział czeka na następną", s.s.camp.beaten === night1 + 1 && s.step === "w5Oboz" && !(await E("Kantor.campWanted()")), s.s.camp);

    // ===================================================================== rozdz. 3: nocny tragarz
    await t.loadFrom(2, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await flagOn("w5ChroniclesSold", "wrakKamienieBaltazar", "soczewkaSprzedana");
    await E("TownQuests.start('D23'); 0");
    const dHire = await calm(night1 + 3);
    await setTime(dHire, 10);
    await go(8, 12, 41, 8);
    await t.frames(20);
    // the card of the chronicles: in Baltazar's strongbox, no buy-back by day (Pustelnia.js)
    let r = await talk("kupiec", ["Przyjdę."]);
    s = await st();
    t.check("rozdz. 3: Baltazar (zaufanie - skrzynia K15 nieotwarta) najmuje bohatera do nocnej roboty: 20 G za noc, tylne drzwi od 22",
        s.s.hired > 0 && s.s.mood === "trust" && s.step === "w5Zmiany" && /silnych rąk nocą/.test(r.text), { step: s.step, text: r.text.slice(0, 200), missing: r.missing });
    t.check("hak D23: karta 1 kronik leży w szkatule Baltazara - za dnia nie da się jej odkupić (Pustelnia: brak „Biorę (40 G)”)",
        (await E("Kantor.cardInBox()")) && !/Biorę \(40 G\)/.test(JSON.stringify(r.choices)), r.choices);

    // a porter's night: the back door (Map008) -> the back room (Map103) -> the trapdoor -> the cellar (Map171): three crates
    const shiftNight = async (d) => {
        await setTime(d, 22.05);
        await go(8, 10, 40, 8);
        const door = await E("Kantor.backDoorEv() ? Kantor.backDoorEv().eventId() : 0");
        await E(`$gameMap.event(${door}).start(); 0`);
        await t.until(t.onMap(103), 15); await t.frames(15);
        const r1 = await use(730);
        await t.until(t.onMap(171), 15); await t.frames(20);
        const cel = await J("({ b: !$gameMap.event(740).isTransparent(), sl: !$gameMap.event(741).isTransparent(), pile: !$gameMap.event(742).isTransparent(), sacks: !$gameMap.event(743).isTransparent(), stones: !$gameMap.event(744).isTransparent(), shown: (TownLife.eventOf('kupiec') || { _town: { hidden: true } })._town.hidden })");
        const stairs = await E("$gameMap.events().find(e => e.event().name === 'Schody -> Kantor').eventId()");
        let speed = 0;
        for (let i = 0; i < 3; i++) {
            await E("$gamePlayer.locate(8, 10); $gamePlayer.setDirection(8); 0");
            await use(742);
            if (!i) speed = await E("[$gamePlayer.realMoveSpeed(), TownQuests.state().v.skrzynia_w5 || 0]");
            await E(`$gamePlayer.locate(2, 4); $gamePlayer.setDirection(8); $gameMap.event(${stairs}).start(); 0`);
            await t.until(t.onMap(103), 15); await t.frames(15);
            await E("$gamePlayer.locate(5, 10); $gamePlayer.setDirection(6); 0");
            await use(731);
            if (i < 2) { await use(730); await t.until(t.onMap(171), 15); await t.frames(10); }
        }
        return { cel, speed, r1 };
    };
    const g0 = (await st()).gold;
    const n1 = await shiftNight(dHire);
    s = await st();
    t.check("pierwsza noc: tylne drzwi wpuszczają do zaplecza, klapa prowadzi do piwnicy; Baltazar przy biurku, Sławek przy beczkach, sterta skrzyń, worki zboża z pieczęcią dworu",
        n1.cel.b && n1.cel.sl && n1.cel.pile && n1.cel.sacks && !n1.cel.stones, n1.cel);
    t.check("...skrzynia ciężka (wolniejszy chód), trzy skrzynie pod tylnymi drzwiami - 20 G, noc 1 z 2",
        n1.speed[1] === 1 && n1.speed[0] <= 3 && s.s.shifts === 1 && s.gold - g0 === 20 && s.step === "w5Zmiany", { speed: n1.speed, shifts: s.s.shifts, gold: s.gold - g0 });
    t.check("...w nocy Baltazara nie ma za ladą kantoru (jest w piwnicy - TownLife w5Shift)", n1.cel.shown === true, n1.cel);
    const n2 = await shiftNight(dHire + 1);
    s = await st();
    t.check("druga noc: w skrzyniach kamienie z krukiem (flaga w5Kamienie) - po dwóch nocach rozdz. 4 „Rejestr”",
        n2.cel.stones && !!s.f.w5Kamienie && s.s.shifts === 2 && s.step === "w5Rejestr", { cel: n2.cel, shifts: s.s.shifts, step: s.step });

    // ===================================================================== rozdz. 4: rejestr
    const dReg = dHire + 2;
    await setTime(dReg, 22.05);
    await go(8, 10, 40, 8);
    await E("Kantor.backDoorEv().start(); 0");
    await t.until(t.onMap(103), 15); await t.frames(10);
    await use(730);
    await t.until(t.onMap(171), 15); await t.frames(20);
    const maps = await E("!$gameMap.event(745).isTransparent()");
    r = await use(740, ["Poczekam"]);
    const h1 = await E("+$gameSystem.dayNightHour().toFixed(2)");
    t.check("rozdz. 4: trzecia noc - nic nie nosisz, zwoje map wyspy w gabinecie; „Poczekam” - do wpół do pierwszej", maps && h1 >= 0.35 && h1 < 0.5, { maps, h1, text: r.text.slice(0, 120) });
    await t.until("Kantor.cellarState().state === 'out'", 25);
    await t.saveTo(3);
    // the register taken, the card from the strongbox, out of the office before he is back
    await E("Hunting.setSneak(true); $gamePlayer.locate(15, 7); $gamePlayer.setDirection(8); 0");
    r = await use(746, ["Zabierz rejestr."], { shotAtChoice: path.join(DOCS, "gabinet_rejestr.png") });
    await E("$gamePlayer.locate(17, 9); $gamePlayer.setDirection(8); 0");
    await use(747);
    s = await st();
    const regText = await E("Kantor.registerText().join(' ')");
    t.check("...Baltazar wychodzi na górę; rejestr z biurka w torbie (imiona i kwoty: K.W., F., G.Ż.P., P.K., kamienie z krukiem do sztabu Straży Pewności)",
        (s.v.rejestr || 0) === 1 && /K\.W\. - 5 G/.test(regText) && /Straży Pewności/.test(regText) && /drzwi pod skałą/.test(regText), { v: s.v, regText });
    t.check("hak D25 i W11: w rejestrze „5 kamieni z wraku, 75 G” i „Oko z latarni - 400 G”", /5 kamieni z wraku/.test(regText) && /Oko z latarni/.test(regText), regText);
    t.check("hak D23: w szkatule luźna karta z kronik zakonu (karta 1 - Pustelnia)", !!s.f.kronikaKarta1 && !(await E("Kantor.cardInBox()")), { f1: s.f.kronikaKarta1, v: s.v.karta_1 });
    await E("$gamePlayer.locate(8, 8); $gamePlayer.setDirection(2); Hunting.setSneak(false); 0");
    const g1 = (await st()).gold;
    await E("$gameSystem.setDayNightHour(0.84); 0");
    await t.until("Kantor.step() === 'w5Komu'", 25);
    s = await st();
    t.check("...Baltazar wraca po dwudziestu minutach, bohater poza gabinetem - 20 G, rozdz. 5 „Komu to dać”", s.step === "w5Komu" && s.gold - g1 === 20 && s.s.reg.state === "back", { step: s.step, gold: s.gold - g1, reg: s.s.reg });
    await t.saveTo(4);
    // caught (load: Baltazar out): still in the office when he comes back
    await t.loadFrom(3, { quiet: true });
    await E("Humans.auto(false); 0");
    await E("$gamePlayer.locate(15, 7); $gamePlayer.setDirection(8); 0");
    await use(746, ["Zabierz rejestr."]);
    await E("$gameSystem.setDayNightHour(0.84); 0");
    await t.until("Kantor.cellarState().state === 'caught'", 25);
    await t.until(t.onMap(8), 15);
    s = await st();
    t.check("...przyłapany w gabinecie: Baltazar odbiera rejestr i wyrzuca bez zapłaty na ulicę; rejestr czeka na następną noc",
        s.map === 8 && !(s.v.rejestr) && s.s.reg.caught === 1 && s.step === "w5Rejestr", { map: s.map, v: s.v, reg: s.s.reg, step: s.step });
    // Sławek's alarm (load: out): walking into the office in front of his eyes
    await t.loadFrom(3, { quiet: true });
    await E("Humans.auto(false); Hunting.setSneak(false); Kantor.opts.slawekFace = 6; $gamePlayer.locate(12, 8); $gamePlayer.setDirection(6); 0");
    await E("(function(){ const s = Kantor.cellarState(); s.back = 99; return 0; })()");
    await t.until("!!Kantor.cellarState().alarm", 10);
    await E("Kantor.opts.slawekFace = 0; 0");
    s = await st();
    t.check("...Sławek widzi bohatera przy gabinecie: „Szefie!” - Baltazar wraca od razu", !!s.s.reg.alarm && ["returning", "caught", "back"].includes(s.s.reg.state), s.s.reg);

    // ===================================================================== rozdz. 5: komu to dać
    // a) Wit, who trusts the hero (D5): the kantor shut, Wit an ally
    await t.loadFrom(4, { quiet: true });
    await E("Humans.auto(false); 0");
    await flagOn("witOwes");
    await setTime(dReg + 1, 10);
    await go(8, 48, 50, 6);
    r = await talk("kapral", []);
    s = await st();
    t.check("rozdz. 5 a: Wit (dłużnik z D5) przyznaje się do 5 G na tydzień; razem do sołtysa: kantor zamknięty, Wit sojusznikiem, Baltazar znika",
        s.s.outcome === "closed" && s.s.komu === "wit" && !!s.f.w5WitAlly && !!s.f.w5Zamkniety && (await E("TownLife.gone('kupiec')")) && s.step === "w5Prom" && !s.v.rejestr,
        { outcome: s.s.outcome, komu: s.s.komu, step: s.step, text: r.text.slice(0, 160) });
    await go(8, 14, 39, 8);
    await E("window.__kit.pops.length = 0; $gameMap.events().find(e => e.x === 14 && e.y === 38 && /door=kantor/.test(e.event().note)).start(); 0");
    await t.frames(20);
    t.check("...drzwi kantoru: „Kantor zamknięty z rozkazu sołtysa.”", (await t.popups()).some(p => /zamknięty z rozkazu/.test(p)), await t.popups());
    // a2) Wit without trust: the register burnt, a night in the guardhouse, Baltazar an enemy
    await t.loadFrom(4, { quiet: true });
    await E("Humans.auto(false); 0");
    await flagOff("witOwes", "k15Wit", "d11Told");
    await setTime(dReg + 1, 10);
    await go(8, 48, 50, 6);
    r = await talk("kapral", []);
    s = await st();
    t.check("rozdz. 5 a (bez zaufania): Wit pali rejestr w koszu żarowym, noc w wartowni (rano następnego dnia), Baltazar wrogiem, napad zaplanowany",
        s.s.outcome === "enemy" && s.s.komu === "witBurn" && !!s.f.w5WitSpalil && s.day === dReg + 2 && Math.abs(s.hour - 7) < 0.2 && s.s.raid.day > 0 && !s.v.rejestr,
        { outcome: s.s.outcome, day: s.day, hour: s.hour, raid: s.s.raid });
    // b) the reeve: the meeting the next day
    await t.loadFrom(4, { quiet: true });
    await E("Humans.auto(false); 0");
    await setTime(dReg + 1, 9);
    await go(8, 30, 40, 8);
    r = await talk("soltys", []);
    s = await st();
    const op0 = await E("TownQuests.opinion()");
    t.check("rozdz. 5 b: sołtys bierze rejestr - zebranie w ratuszu jutro w południe", s.s.komu === "soltys" && s.s.zebranie === dReg + 2 && s.step === "w5Zebranie", { komu: s.s.komu, z: s.s.zebranie, step: s.step });
    await setTime(dReg + 2, 12.3);
    await t.frames(30);
    r = await talk("soltys", []);
    s = await st();
    const op1 = await E("TownQuests.opinion()");
    t.check("...zebranie: sołtys czyta rejestr na głos - kantor zamknięty, Opinia +12, Baltazar odpływa (rozdz. 6)",
        s.s.outcome === "closed" && !!s.f.w5Soltys && op1 - op0 === 12 && s.step === "w5Prom" && (await E("TownLife.gone('kupiec')")), { op: op1 - op0, step: s.step, text: r.text.slice(0, 160) });
    await t.saveTo(5);
    // c) the double game
    await t.loadFrom(4, { quiet: true });
    await E("Humans.auto(false); 0");
    const dDeal = await calm(dReg + 1), dWeek = await calm(dDeal + 7), dAct = await calm(dWeek + 1);
    await setTime(dDeal, 10);
    await go(8, 12, 41, 8);
    r = await talk("kupiec", ["Pracujmy razem"]);
    s = await st();
    t.check("rozdz. 5 c: podwójna gra - Baltazar odbiera oryginał, bohater jego wspólnikiem (frakcja patrzy na kroki w podziemiach)",
        s.s.outcome === "double" && !!s.f.w5Podwojna && !!s.f.w5FactionWatches && !s.v.rejestr && s.step === "w5Prom", { outcome: s.s.outcome, step: s.step, v: s.v });
    await t.saveTo(6);
    await setTime(dWeek, 10);
    await t.frames(20);
    const g2 = (await st()).gold;
    r = await talk("kupiec", []);   // (the week's quest talk of the day first - W5 rozdz. 7 when the ferry night went by)
    await E("TownQuests.state().greeted.kupiec = $gameSystem.dayNightDay(); 0");
    r = await talk("kupiec", ["Bywaj."]);
    s = await st();
    t.check("...po tygodniu Baltazar płaci wspólnikowi 30 G działki", s.gold - g2 === 30, { gold: s.gold - g2, text: r.text.slice(0, 120) });
    // d) blackmail
    await t.loadFrom(4, { quiet: true });
    await E("Humans.auto(false); 0");
    await setTime(dDeal, 10);
    await go(8, 12, 41, 8);
    const g3 = (await st()).gold;
    r = await talk("kupiec", ["Pięćdziesiąt groszy"]);
    s = await st();
    t.check("rozdz. 5 d: szantaż - 50 G, Baltazar wrogiem: ceny x2 (Kantor.priceMul), nocny napad za 3-6 dni",
        s.s.outcome === "enemy" && !!s.f.w5Szantaz && s.gold - g3 === 50 && (await E("Kantor.priceMul()")) === 2 && s.s.raid.day >= dDeal + 3 && s.s.raid.day <= dDeal + 6,
        { outcome: s.s.outcome, gold: s.gold - g3, raid: s.s.raid });
    // the lens bought back from an enemy: double (Latarnia.js)
    await E("(function(){ TownQuests.start('W11', 3); Latarnia.state().lens = 'baltazar'; return 0; })()");
    r = await talk("kupiec", ["Nie teraz."]);
    t.check("hak W11: odkup soczewki u wroga kosztuje dwa razy tyle („Biorę (300 G)”)", /300 G/.test(JSON.stringify(r.choices)), r.choices);
    // the raid: the enemy's men on a road at night
    await E("(function(){ const s = Kantor.state(); s.raid.day = $gameSystem.dayNightDay(); return 0; })()");
    await setTime(dDeal, 22);
    await go(22, 12, 2, 2);
    await t.until("Humans.humans().some(h => h._tag === 'w5Napad')", 10);
    t.check("...nocny napad ludzi Baltazara na drodze (Humans.js: „Pozdrowienia od kupca!”)", await E("Humans.humans().filter(h => h._tag === 'w5Napad').length >= 3"));
    await E("Humans.clear(); 0");

    // ===================================================================== rozdz. 6: noc promu (b: the kantor shut)
    await t.loadFrom(5, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await flagOn("rafalTaken");
    const fd = await E("Kantor.ferryDay()");
    await setTime(fd, 21.5);
    await go(22, 12, 2, 2);
    await t.frames(30);
    const p0 = await J("({ cart: !$gameMap.event(754).isTransparent(), rafal: !$gameMap.event(755).isTransparent(), men: Kantor.promMen().map(h => h._kind) })");
    t.check("rozdz. 6: w noc promu na Polnej drodze wóz z ładunkiem, dwóch ludzi Baltazara (pałka i łuk) i związany Rafał (W6: zabrany przez dwór)",
        p0.cart && p0.rafal && p0.men.length === 2, p0);
    await E("$gamePlayer.locate(25, 20); Kantor.promMen()[0].engage(false); 0");
    await t.until("!!Kantor.state().ferry.ambush", 5);
    await t.frames(20);
    const amb = await J("({ n: Kantor.promMen().length, eng: Kantor.promMen().filter(h => h._engaged).length })");
    await t.frames(20);
    await shot("zasadzka_przy_wozie.png");
    t.check("...straż widzi bohatera - zasadzka: z krzaków wyskakuje dwóch kolejnych", amb.n >= 4 && amb.eng >= 2 && !!(await E("Kantor.state().ferry.ambush")), amb);
    await E("for (const h of Kantor.promMen().slice()) Humans.kill(h); 0");
    await t.frames(20);
    await E("$gamePlayer.locate(31, 22); $gamePlayer.setDirection(8); 0");
    await use(755);
    await E("$gamePlayer.locate(29, 19); $gamePlayer.setDirection(2); 0");
    await use(754);
    s = await st();
    t.check("...pobici: ładunek zdobyty - 5 kamieni z krukiem w torbie, rozdz. 7", s.s.ferry.state === "seized" && (s.v.kamien_kruk || 0) >= 5 && s.step === "w5Akt2", { ferry: s.s.ferry, v: s.v, step: s.step });
    t.check("...Rafał uwolniony: wraca do obozu (W6: rafalAlly)", !!s.f.w5RafalFreed && !!s.f.rafalAlly && !(await E("TownLife.gone('rafal')")), { f: [s.f.w5RafalFreed, s.f.rafalAlly] });
    await t.saveTo(7);
    // the swap, unseen
    await t.loadFrom(5, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await setTime(fd, 21.5);
    await t.give(64, 6);
    await go(22, 12, 2, 2);
    await t.frames(20);
    await E("Hunting.setSneak(true); $gamePlayer.locate(29, 19); $gamePlayer.setDirection(2); 0");
    r = await use(754, ["Podmień."]);
    s = await st();
    t.check("...albo po cichu: zwykłe kamienie zamiast kamieni z krukiem (6 kamieni), nikt nie zauważył",
        s.s.ferry.state === "swapped" && (await t.count(64)) === 0 && (s.v.kamien_kruk || 0) >= 5 && s.step === "w5Akt2", { ferry: s.s.ferry, step: s.step });
    // beaten at the cart
    await t.loadFrom(5, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await setTime(fd, 21.5);
    await go(22, 12, 2, 2);
    await t.frames(30);
    await E("(function(){ const h = Kantor.promMen()[0]; h.engage(false); Humans.beatenBy(h); return 0; })()");
    await t.until("Kantor.state().ferry.state === 'beaten'", 15);
    s = await st();
    t.check("...pobity przy wozie: obrabowany, ładunek płynie na ląd", s.s.ferry.state === "beaten" && s.step === "w5Akt2", s.s.ferry);
    // the night missed
    await t.loadFrom(5, { quiet: true });
    await E("Humans.auto(false); 0");
    await setTime(fd + 1, 4);
    await t.frames(20);
    s = await st();
    t.check("...przegapiona noc promu: wóz pojechał bez bohatera", s.s.ferry.state === "gone" && !!s.f.w5LadunekOdplynal && s.step === "w5Akt2", s.s.ferry);
    // the partner lets the cart go (c)
    await t.loadFrom(6, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    const fd2 = await E("Kantor.ferryDay()");
    await setTime(fd2, 21.5);
    await go(22, 12, 2, 2);
    await t.frames(20);
    const g4 = (await st()).gold;
    await E("__standBy(757); 0");
    r = await use(757, ["Puszczam wóz."]);
    s = await st();
    t.check("...wspólnik (podwójna gra): ludzie Baltazara witają swojego, wóz puszczony - 30 G", s.s.ferry.state === "letgo" && s.gold - g4 === 30 && !(await E("Kantor.promMen().length")), { ferry: s.s.ferry, gold: s.gold - g4 });

    // ===================================================================== rozdz. 7: co dalej z kantorem
    await t.loadFrom(7, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await setTime(fd + 2, 10);
    await t.frames(40);
    const back = await J("({ back: Kantor.state().back, gone: TownLife.gone('kupiec'), harbour: TownLife.condOk('w5Harbour'), home: TownLife.homeOf(TownLife.RESIDENTS.find(r => r.key === 'kupiec')) })");
    t.check("rozdz. 7 (Akt II): Baltazar wraca - na przystań, ze składu portowego (alt mapa 125)", back.back > 0 && !back.gone && back.harbour && back.home === 125, back);
    await go(8, 30, 40, 8);
    r = await talk("soltys", ["Ludmiła", "Do widzenia"]);   // (Homes.js: the reeve's menu of the houses for sale comes after)
    if (!r.done) console.log("NOTE rozmowa z sołtysem nie skończyła się:", JSON.stringify(await J("({ run: $gameMap.isEventRunning(), busy: $gameMessage.isBusy(), ev: $gameMap._interpreter.eventId(), text: $gameMessage.allText().slice(0, 80), ch: $gameMessage.choices() })")));
    s = await st();
    t.check("...sołtys: kto weźmie pusty kantor? Ludmiła z obozu - uczciwy kantor, wątek W5 skończony", s.s.honest === "ludmila" && !!s.f.w5KantorUczciwy && (await E("TownQuests.isDone('W5')")), { honest: s.s.honest, text: r.text.slice(0, 120) });
    // (2026-10-17, the user) Ludmiła behind the counter 9-15; the money box the rest of the open hours
    await setTime(fd + 3, 10.5);
    const toKantor = await go(103, 12, 7, 8);
    await t.frames(30);
    const lu = await J("(function(){ const e = TownLife.eventOf('ludmila'); return e ? { x: e.x, y: e.y, hidden: !!(e._town && e._town.hidden), entry: TownLife.entryAt(TownLife.RESIDENTS.find(r => r.key === 'ludmila'), 10.5).where } : null; })()");
    t.check("...Ludmiła stoi za ladą kantoru miejskiego za dnia (9-15, TownLife: miejsce ludmila_lada na mapie 103)", toKantor && lu && !lu.hidden && lu.x === 12 && lu.y === 5 && lu.entry === "w5_lada", lu);
    await E("$gamePlayer.locate(12, 7); $gamePlayer.setDirection(8); 0");
    await t.frames(10);
    await shot("ludmila_za_lada.png");
    const g5 = (await st()).gold, iron0 = await t.count(86);
    r = await talk("ludmila", ["Pokaż towar.", "Żelazo"]);
    t.check("...rozmowa z Ludmiłą: krótkie słowo i towar - żelazo o dziesiątą część taniej (16 G zamiast 18)",
        (await t.count(86)) - iron0 === 1 && g5 - (await st()).gold === 16 && /Kantor miejski|Ela liczy/.test(r.text), { text: r.text.slice(0, 160), choices: r.choices });
    await setTime(fd + 3, 16.5);
    await t.frames(40);
    const lu2 = await J("(function(){ const e = TownLife.eventOf('ludmila'); return e ? !!(e._town && e._town.hidden) : 'brak'; })()");
    const iron1 = await t.count(86);
    r = await use(732, ["Żelazo"]);
    t.check("...po trzeciej Ludmiła wraca do obozu, na ladzie cennik i skrzynka: dalej 16 G", lu2 !== false && (await t.count(86)) - iron1 === 1, { lu2, text: r.text.slice(0, 160) });
    // the partner in Act II: cheap iron and steel
    await t.loadFrom(6, { quiet: true });
    await E("Humans.auto(false); Humans.clear(); 0");
    await E("(function(){ const s = Kantor.state(); s.ferry.state = 'letgo'; const r = TownQuests.rec('W5'); r.step = TownQuests.Q.W5.steps.findIndex(x => x.talk === 'w5Akt2'); return 0; })()");
    await setTime(dDeal + 1 + ((await E(`TownQuests.isFerry(${dDeal})`)) ? 1 : 0), 10);
    await go(8, 12, 41, 8);
    r = await talk("kupiec", []);
    await t.frames(10);
    await E("TownQuests.state().greeted.kupiec = $gameSystem.dayNightDay(); 0");
    r = await talk("kupiec", ["Pokaż towar.", "Żelazo"]);
    s = await st();
    t.check("rozdz. 7 c: wspólnik - żelazo i stal za pół ceny („Żelazo ×1 - 9 G”), W5 skończony", (await E("TownQuests.isDone('W5')")) && /Żelazo ×1 - 9 G/.test(JSON.stringify(r.choices)), r.choices);

    // ===================================================================== Akt III, F9
    const a3 = await J(`(function(){ const D = Act3Data, wit = D.DEFENDERS.find(d => d.key === "wit"), w2 = D.WAVES.find(w => w.id === "w2");
        return { wit: !!wit && wit.when({ flags: { w5WitAlly: 1 } }) && !wit.when({ flags: {} }), merc: w2.extra({ flags: { w5BaltazarWrog: 1 }, rafal: null }).map(x => x.name),
            none: w2.extra({ flags: {}, rafal: null }).length }; })()`);
    t.check("hak Akt III: kapral Wit broni tawerny (w5WitAlly), najemnik Baltazara w drugiej fali (w5BaltazarWrog)", a3.wit && a3.merc.includes("Najemnik Baltazara") && a3.none === 0, a3);
    const jump = await J("(function(){ const g = Kantor.debugJump(4); return { g, step: Kantor.step(), shifts: Kantor.state().shifts, hour: +$gameSystem.dayNightHour().toFixed(2) }; })()");
    t.check("F9 „W5: rozdział 4”: wątek na początku rozdz. 4 (najęty, dwie noce za nim, 22:00), przejście pod tylne drzwi kantoru",
        jump.step === "w5Rejestr" && jump.shifts === 2 && jump.g && jump.g[0] === 8 && Math.abs(jump.hour - 22.05) < 0.1, jump);
});
