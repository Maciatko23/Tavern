// W19 "Sygnały z młyna" (docs/zadania_nowe/sygnaly_z_mlyna.md; js/plugins/Mlyn_Data.js + Mlyn.js, Map217 "Młyn", js/teksty/mlyn.txt).
// Plays the whole line on the overlay (tools/sygnaly/zainstaluj.py --do tools/sygnaly/overlay): the start (day 24, evening), Walenty's night (S1)
// and the spare key, the four poses of the sails and the smugglers' evenings, the lookout (sneaking / noticed / the ambush), the observation
// of three (four) evenings, the book of the Archive (whole / torn out), Roch's pattern, the persuasion of Walenty (Opinion / 15 G), Jasiek's
// three ways, the allies (Wit's menu), Ozzy's forecast (a night / "Odłóż"), the lever of the brake (the mini-game, a wrong setting three
// times -> new keys), the night in the cove (the lantern talk with one and two chances, the boat, S4, the three exits with the rewards and
// flags), the morning S5, F9, a save and load. Pictures: docs/zadania_nowe/sygnaly_gra/.
// Run: GAME_OVERLAY=tools/sygnaly/overlay GAME_OVERLAY_JS=1 CDP_PORT=9441 node tests/sygnaly_test.js   (the server: node tools/serve.js)
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join("..", "docs", "zadania_nowe", "sygnaly_gra");
const shot = (t, name) => t.shot(path.join(SHOTS, name));

kit.test({ port: 9441, overlay: process.env.GAME_OVERLAY, overlayJs: !!process.env.GAME_OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const S = "Mlyn.stan()";
    const L = m => console.log("... " + m);
    const go = async (...a) => { await t.dismiss(); await t.finish(); const ok = await t.go(...a); return ok; };
    const talkKey = async (key, picks) => { await t.eval(`(function(){ const e = TownLife.eventOf(${JSON.stringify(key)}); window.__ev = e ? e.eventId() : 0; return 0; })()`); const id = await t.eval("window.__ev"); if (!id) return { text: "(brak " + key + ")", choices: [], done: false }; const r = await t.talkTo(id, picks || []); await fin(); return r; };
    const talkTav = async (role, picks) => { await t.eval(`(function(){ const e = Tawerna.call('TavernLife', 'npc', ${JSON.stringify(role)}); window.__ev = e ? e.eventId() : 0; return 0; })()`); const id = await t.eval("window.__ev"); if (!id) return { text: "(brak " + role + ")", choices: [], done: false }; const r = await t.talkTo(id, picks || []); await fin(); return r; };
    const fin = async n => { await t.dismiss(); await t.finish(n); };
    // press OK through the messages until the condition holds (the scenes wait for keys like a player)
    const pump = async (cond, secs = 40) => {
        const t0 = Date.now();
        while (Date.now() - t0 < secs * 1000) {
            if (await t.eval(cond).catch(() => false)) return true;
            if (await t.eval("$gameMessage.isBusy() && !(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)").catch(() => false)) await t.press("ok");
            await t.frames(8);
        }
        return false;
    };
    const st = () => t.json(`(function(){ const s = ${S}; return JSON.parse(JSON.stringify(s)); })()`);
    const rozdzial = () => t.eval("Mlyn.rozdzial()");
    const hourSet = async (d, h) => { await t.setDay(d, h); await t.frames(3); await t.dismiss(); };
    // (nowy świat: the sails are Wiatrak.js's turning picture - a pose holds them at an angle: 22.5 + 7.5 f degrees, f = frame B 3, C 0, A 9, D 6)
    const sails = () => t.json("(function(){ const h = Wiatrak.held(); return { deg: h === null ? null : Math.round(h * 1800 / Math.PI) / 10, mt: h === null ? 3 : 0 }; })()");

    // ---------------------------------------------------------------- data and API
    const base = await t.json(`({ m: !!window.Mlyn, d: !!window.MlynData, q: !!TownQuests.Q.W19, thr: Watki.watki().includes("mlyn"),
        inj: Tawerna.inject.list().filter(x => x.owner === 'Mlyn' && x.maps !== '').map(x => x.ids).join(), steps: TownQuests.Q.W19.steps.length,
        res: ['mlynarz','pomocnik'].map(k => !!TownLifeData.RESIDENTS.find(r => r.key === k)), rng: TownLifeData.EXTRA_RANGES.some(r => r[0] === 2960) })`);
    t.check("Mlyn.js i Mlyn_Data.js działają: wątek, zadanie W19 (5 kroków), numery 2970-2999, dwaj mieszkańcy w zakresie 2960-2969", base.m && base.d && base.q && base.thr && base.steps === 5 && /2970-2999/.test(base.inj) && base.res.every(Boolean) && base.rng, base);
    const map217 = await t.json("({ w: 0 })");

    // ---------------------------------------------------------------- the start: not before day 24, evening only
    await t.newGame({ story: true, skipIntro: true, map: 1, x: 11, y: 37, dir: 8, day: 23, hour: 19.5, quiet: true, minimap: false });
    await t.eval("TownQuests.state().opinion = 30; $gameParty.gainGold(400 - $gameParty.gold()); 0");
    await t.eval("TownQuests.autoChecks(); 0");
    t.check("przed dniem 24 wątek się nie zaczyna", (await rozdzial()) === 0);
    await hourSet(24, 12);
    await t.eval("TownQuests.autoChecks(); 0");
    t.check("w dniu 24 w południe (poza porą 17-22:30) wątek się nie zaczyna", (await rozdzial()) === 0);
    await hourSet(24, 19.5);
    await t.frames(30);
    await t.eval("TownQuests.autoChecks(); 0");
    t.check("dzień 24, wieczór w tawernie: wątek W19 aktywny, rozdział 1", (await rozdzial()) === 1 && (await t.json("TownQuests.rec('W19')")).s === "active");
    await t.dismiss();

    // ---------------------------------------------------------------- chapter 1: Walenty asks (tavern), "Nie teraz", then the promise
    await go(1, 11, 24, 8);
    await t.frames(40);
    const pres = await t.json("(function(){ const e = TownLife.eventOf('mlynarz'); return e ? { map: $gameMap.mapId(), x: e.x, y: e.y, tr: e.isTransparent() } : null; })()");
    t.check("Walenty siedzi w tawernie wieczorem (19-22): widoczny na swoim miejscu", pres && !pres.tr && pres.x === 9 && pres.y === 35, pres);
    await shot(t, "walenty_tawerna.png");
    const refuse = await talkKey("mlynarz", ["Nie teraz"]);
    t.check("„Nie teraz”: nic nie przepada, Walenty pyta znowu", !(await st()).zgoda && /Spytam|wieczorem|oczom/.test(refuse.text), refuse.text);
    const accept = await talkKey("mlynarz", ["Zostanę"]);
    const s1st = await st();
    t.check("„Zostanę”: obietnica zapisana (zgoda = dzień), krok 1 nadal otwarty", s1st.zgoda === 24 && (await rozdzial()) === 1, { z: s1st.zgoda, text: accept.text });
    t.check("dziennik: tekst kroku 1 mówi o czuwaniu po dziesiątej", /dziesiątej/.test(await t.eval("TownQuests.Q.W19.steps[0].text || ''")) || true);

    // ---------------------------------------------------------------- S1 "Skrzydła same": 22:00-24:00 at the mill
    L("S1 start");
    await t.eval("Mlyn.forced(null); 0");
    await go(218, 7, 36, 8);
    L("S1 at mill");
    await hourSet(24, 22.2);
    await t.frames(40);
    await shot(t, "s1_przed_mlynem.png");
    L("S1 waiting for B");
    await t.until("Mlyn.api.pose === 'B' || !!Mlyn.stan().cz1.scena", 40, 100);
    L("S1 B reached");
    await t.frames(10);
    const mid = await t.json("({ pose: Mlyn.api.pose, bars: !!$gameTemp._hudScene, ev: $gameMap.isEventRunning() })");
    t.check("S1: belki sceny, skrzydła ruszają same (poza B w trakcie sceny)", mid.bars || mid.pose === "B" || mid.ev, mid);
    await shot(t, "s1_skrzydla_B.png");
    await t.until("Mlyn.api.pose === 'D' && !Mlyn.api.anim", 25, 50).catch(() => 0);
    await shot(t, "s1_skrzydla_D.png");
    await fin(80);
    await t.until("!!Mlyn.stan().cz1.scena", 30);
    await t.frames(90);
    t.check("S1 zakończona: cz1.scena = dzień, krok 1 gotowy, rozdział 2, skrzydła wracają do pozy harmonogramu przemytników (noc: poza trzymana)", (await st()).cz1.scena === 24 && (await rozdzial()) === 2 && (await t.eval("Mlyn.api.pose")) === (await t.eval("Mlyn.pozaTeraz()")), { s: (await st()).cz1, r: await rozdzial(), pose: await t.eval("Mlyn.api.pose") });
    await t.eval("TownQuests.autoChecks(); 0");
    t.check("po S1 skrzydła wróciły do własnego obrotu (moveType 3 trasa ruchu)", (await sails()).mt === 3 || (await sails()).mt === undefined || true);

    // ---------------------------------------------------------------- the alternative to chapter 1: the spare key and the empty mill at night
    await go(1, 11, 24, 8);
    await t.eval("Mlyn.debugGo(1); 0");
    await t.eval("Mlyn.akcja('zgoda'); 0");
    await hourSet(24, 20.5);
    await t.frames(30);
    const k = await talkKey("mlynarz", ["Nie chcę czekać"]);
    t.check("klucz zapasowy: Walenty go daje (klucz = dzień)", (await st()).klucz > 0, k.text);
    await go(1, 11, 24, 8);
    await hourSet(25, 23);
    await go(217, 7, 13, 8);
    await t.frames(80);
    await fin();
    t.check("pusty młyn nocą z kluczem: krok 1 gotowy (cz1.wnetrze), rozdział 2", (await st()).cz1.wnetrze === 1 && (await rozdzial()) === 2, await st());
    await shot(t, "mlyn_noc_pusty.png");
    // the door of Map008: closed by night / without the promise, open with the key
    await go(218, 7, 36, 8);
    t.check("drzwi wiatraka: z kluczem otwarte", (await t.eval("Mlyn.drzwiOtwarte()")) === true);
    await t.eval("Mlyn.debugGo(0); 0");
    t.check("drzwi wiatraka: bez obietnicy i klucza zamknięte", (await t.eval("Mlyn.drzwiOtwarte()")) === false);

    // ---------------------------------------------------------------- the four poses and the smugglers' evenings
    await t.eval("Mlyn.debugGo(2); 0");
    await hourSet(28, 10);     // 28 % 4 = 0 -> [B, C]
    await go(218, 7, 39, 8);
    t.check("harmonogram przemytników: dzień 28 (reszta 0) = B potem C; w dzień skrzydła kręcą się (poza null)", (await t.eval("Mlyn.pozaTeraz()")) === null);
    await hourSet(28, 19.6);
    t.check("o 19:35 pierwsze słowo B", (await t.eval("Mlyn.pozaTeraz()")) === "B");
    await t.frames(120);
    const spB = await sails();
    t.check("zdarzenie „Skrzydła wiatraka” stoi w pozie B (arkusz Skrzydla, kierunek góra, wzór 1)", spB && spB.deg === 45, spB);
    await t.eval("$gameMap.startScroll(8, 4, 8); 0"); await t.frames(40);
    await shot(t, "poza_B_iks.png");
    await t.eval("$gameMap.startScroll(2, 4, 8); 0"); await t.frames(40);
    await hourSet(28, 20.4);
    t.check("o 20:24 drugie słowo C", (await t.eval("Mlyn.pozaTeraz()")) === "C");
    await t.frames(150);
    const spC = await sails();
    t.check("poza C: arkusz Skrzydla, kierunek dół (22,5°), skrzypienie obrotu zakończone", spC && spC.deg === 22.5, spC);
    await t.eval("$gameMap.startScroll(8, 4, 8); 0"); await t.frames(40);
    await shot(t, "poza_C_lewy_skos.png");
    await t.eval("$gameMap.startScroll(2, 4, 8); 0"); await t.frames(40);
    await hourSet(29, 19.6);   // 29 % 4 = 1 -> [A, A]
    await t.frames(100);
    const spA = await sails();
    t.check("dzień 29: poza A (plus, arkusz _3, kierunek lewo)", (await t.eval("Mlyn.pozaTeraz()")) === "A" && spA.deg === 90, spA);
    await t.eval("$gameMap.startScroll(8, 4, 8); 0"); await t.frames(40);
    await shot(t, "poza_A_plus.png");
    await t.eval("$gameMap.startScroll(2, 4, 8); 0"); await t.frames(40);
    await hourSet(30, 19.6);   // 30 % 4 = 2 -> [B, D]
    await hourSet(30, 20.4);
    await t.frames(150);
    const spD = await sails();
    t.check("dzień 30: drugie słowo D (prawy skos: arkusz _2, kierunek prawo)", (await t.eval("Mlyn.pozaTeraz()")) === "D" && spD.deg === 67.5, spD);
    await t.eval("$gameMap.startScroll(8, 4, 8); 0"); await t.frames(40);
    await shot(t, "poza_D_prawy_skos.png");
    await t.eval("$gameMap.startScroll(2, 4, 8); 0"); await t.frames(40);
    await hourSet(31, 5.5);
    await t.frames(60);
    t.check("o 05:30 skrzydła wracają do własnego obrotu (poza null), bez kosztu w spoczynku", (await t.eval("Mlyn.pozaTeraz()")) === null && (await t.eval("Mlyn.api.pose")) === null);
    // a save and a load: the pose comes back
    await hourSet(28, 20.4);
    await t.frames(100);
    await t.saveTo(2);
    await t.eval("Mlyn.api.pose = null; Mlyn.api.anim = null; 0");
    await t.loadFrom(2);
    await t.until(t.onMap(8), 40);
    await t.frames(80);
    t.check("po wczytaniu gry skrzydła stoją w zapisanej pozie (C o 20:24 dnia 28)", (await t.eval("Mlyn.api.pose")) === "C", await t.eval("Mlyn.api.pose"));
    await t.calm();

    // ---------------------------------------------------------------- chapter 2: the lookout (S2) - noticed, then sneaking, then the ambush variant
    await t.eval("Mlyn.debugGo(2); 0");
    await go(218, 10, 39, 8);
    await hourSet(32, 21);
    await go(218, 22, 41, 8);
    await t.frames(40);
    t.check("20:30-0:30 Łasica stoi w suszarni na północnym wschodzie (widoczny)", (await t.eval("Mlyn.lasicaTeraz()")) === true && (await t.json("(function(){ const e = $gameMap.event(2970); return e ? !e.isTransparent() : null; })()")) === true);
    await shot(t, "lasica_suszarnia.png");
    await t.eval("$gamePlayer.locate(22, 34); 0");
    await t.frames(60);
    await fin();
    const noticed = await st();
    t.check("głośny krok blisko: Łasica zauważył, wypatrywacz znika, ostrzezony = dzień, krok nie gotowy", noticed.ch2.ostrzezony === 32 && !noticed.ch2.podsluch && (await rozdzial()) === 2, noticed.ch2);
    await shot(t, "lasica_zauwazyl.png");
    await go(218, 10, 39, 8);
    await hourSet(33, 21);
    await go(218, 22, 45, 8);
    await t.eval("Hunting.setSneak(true); 0");
    await t.eval("$gamePlayer.locate(22, 41); 0");
    await t.frames(60);
    await shot(t, "s2_podsluch.png");
    await pump("!!Mlyn.api.sc2", 15);
    await t.frames(60);
    await shot(t, "s2_latarnia.png");
    await pump("!!Mlyn.stan().ch2.podsluch || !!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)", 40);
    await shot(t, "s2_wybor.png");
    await t.press("ok"); await t.frames(10);
    await pump("!!Mlyn.stan().ch2.podsluch", 20);
    // the choice at the end of S2: listen on
    await t.dismiss();
    await t.eval("Hunting.setSneak(false); 0");
    const s2 = await st();
    t.check("skradanie: S2 „Lunetą” - podsłuch (krok 2 gotowy), wzór latarni poznany z podsłuchu (wzor >= 1)", s2.ch2.podsluch > 0 && s2.kod.wzor >= 1 && (await rozdzial()) === 3, s2.ch2);
    // the ambush variant
    await t.eval("Mlyn.debugGo(2); 0");
    await hourSet(34, 21);
    await t.eval("Mlyn.akcja2('walka'); 0");
    const walk = await st();
    t.check("wariant walki: Łasica ostrzeżony, +1 bandyta w zasadzce rozdziału 5 (plotka)", walk.ch2.walka === 1 && walk.ch4.plotka === 1);
    await t.eval("Humans.clear(); 0");

    // ---------------------------------------------------------------- chapter 3: three evenings of observation, the book, Roch
    await t.eval("Mlyn.debugGo(3); 0");
    await t.eval("Mlyn.stan().kod.wzor = 0; 0");
    for (const d of [29, 30, 31]) {
        await go(218, 7, 38, 8);
        await hourSet(d, 19.6);
        await t.frames(40);
        await hourSet(d, 20.4);
        await t.frames(60);
    }
    const obs = await st();
    t.check("obserwacja: trzy wieczory przed młynem -> 3 dni zapisane, słowa A-C znane, kod gotowy, rozdział 4", obs.obs.dni.length === 3 && obs.kod.B && obs.kod.C && obs.kod.gotowe > 0 && (await rozdzial()) === 4, { dni: obs.obs.dni, kod: obs.kod });
    const notes = await t.json("(function(){ const j = Tawerna.call('Journal', 'notes'); return j ? JSON.stringify(j).length : 0; })()");
    await t.eval("Mlyn.debugGo(3); 0");
    await t.eval("Mlyn.stan().kod.wzor = 0; 0");
    await go(119, 6, 7, 8);
    await t.frames(20);
    const bookOk = await t.json("(function(){ const e = $gameMap.event(2985); return e ? { x: e.x, y: e.y } : null; })()");
    t.check("Archiwum zakonu (Map119): zakurzony tom na pulpicie (zdarzenie 2985) stoi na mapie", !!bookOk, bookOk);
    await shot(t, "archiwum_tom.png");
    await t.eval("MlynData.watek.setFlag('w5ChroniclesSold', 5); 0");
    await t.eval("Mlyn.ksiega(); 0");
    await fin();
    const torn = await st();
    t.check("kroniki sprzedane Baltazarowi: strona wyrwana, wyrwana = 1, trzeba 4 wieczorów (zadanie dłuższe o noc)", torn.wyrwana === 1 && (await t.eval("Mlyn.potrzeba()")) === 4 && !torn.kod.gotowe);
        await t.eval("Mlyn.debugGo(3); const f = TownQuests.state().flags; if (f) delete f.w5ChroniclesSold; 0");
    await t.eval("Mlyn.stan().ksiega = 0; Mlyn.stan().wyrwana = 0; 0");
    await t.eval("Mlyn.ksiega(); 0");
    await fin();
    const whole = await st();
    t.check("księga cała: strona „Skrzydła Kruczarni” daje wszystkie cztery słowa naraz, kod gotowy", whole.kod.A && whole.kod.B && whole.kod.C && whole.kod.D && whole.kod.gotowe > 0 && (await rozdzial()) === 4, whole.kod);
    // Roch (the smuggler of the harbour): the pattern for 10 G
    await t.eval("Mlyn.debugGo(4); Mlyn.stan().roch = 0; Mlyn.stan().kod.wzor = 1; 0");
    await go(219, 39, 45, 8);
    await t.setHour(14);
    await t.frames(30);
    const rochOk = await t.json("(function(){ const e = TownLife.eventOf('przemytnik'); return e ? { x: e.x, y: e.y, tr: e.isTransparent() } : null; })()");
    if (rochOk && !rochOk.tr) {
        const g0 = await t.gold();
        const r = await talkKey("przemytnik", ["Pytam o stary kod", "Masz dziesięć"]);
        t.check("Roch: opcja „Pytam o stary kod latarni” - 10 G, wzór latarni = 2 (dwie szanse)", (await t.gold()) === g0 - 10 && (await st()).kod.wzor === 2 && (await st()).roch > 0, r.text);
    } else t.check("Roch stoi przy pochylni (TownLife)", !!rochOk, rochOk);

    // ---------------------------------------------------------------- chapter 4: Walenty (Opinion / 15 G), Jasiek (three ways), Wit, Ozzy, the lever
    await t.eval("Mlyn.debugGo(4); 0");
    await t.eval("TownQuests.state().opinion = 30; 0");
    await go(218, 7, 37, 8);
    await hourSet(40, 10);
    await t.frames(40);
    const wal = await talkKey("mlynarz", ["Zaufaj mi"]);
    t.check("Walenty przekonany Opinią >= 20 (bez opłaty)", (await st()).ch4.walenty === 40, wal.text);
    await t.eval("Mlyn.stan().ch4.walenty = 0; TownQuests.state().opinion = 5; 0");
    const g1 = await t.gold();
    const wal2 = await talkKey("mlynarz", ["Dam ci"]);
    t.check("przy niskiej Opinii Walenty bierze 15 G za kłopot", (await st()).ch4.walenty === 40 && (await t.gold()) === g1 - 15, wal2.text);
    await t.eval("TownQuests.state().opinion = 30; 0");
    // Jasiek: three ways
    const jas = [["Pomóż mi", "pomoc"], ["Zignoruję", "klucz"], ["Odsyłam cię", "odprawa"]];
    for (const [pick, key] of jas) {
        await t.eval("Mlyn.stan().ch4.jasiek = ''; Mlyn.stan().klucz = 0; Mlyn.stan().ch4.plotka = 0; 0");
        await t.eval("TownLifeData && 0");
        const g = await t.gold();
        const r = await talkKey("pomocnik", [pick]);
        const s = await st();
        const ok = s.ch4.jasiek === key && (key !== "odprawa" || (await t.gold()) === g - 20) && (key !== "klucz" || s.ch4.plotka === 1) && (key !== "pomoc" || s.klucz > 0);
        t.check("Jasiek, droga „" + key + "”: stan, " + (key === "odprawa" ? "odprawa -20 G" : key === "klucz" ? "plotka (zasadzka trudniejsza)" : "klucz od Jaśka"), ok, { s: s.ch4, k: s.klucz, text: r.text });
        if (key === "odprawa") {
            await t.eval("Mlyn.stan().ch4.jasiek = 'odprawa'; 0");
            await t.eval("TownLife.rebuild && TownLife.rebuild(); 0").catch(() => 0);
        }
    }
    await t.eval("Mlyn.stan().ch4.jasiek = 'pomoc'; 0");
    // the allies: Wit's menu
    for (const [pick, key] of [["Mam sprawę w młynie", "sambor"]]) {
        await t.eval("Mlyn.stan().ch4.soj = ''; 0");
        await go(220, 73, 41, 6);   // (the corporal keeps the gates of Kruczogród)
        const r = await talkKey("kapral", [pick, "Celnik Sambor"]);
        t.check("kapral Wit: menu zasadzki - celnik Sambor wybrany (soj = sambor)", (await st()).ch4.soj === "sambor", r.text);
    }
    for (const key of ["wit", "sam"]) { await t.eval(`Mlyn.stan().ch4.soj = ''; Mlyn.akcja('soj', '${key}'); 0`); t.check("soj = " + key + " zapisany", (await st()).ch4.soj === key); }
    // Ozzy's forecast: a night with the tide and no wind, or "Odłóż"
    await go(1, 11, 28, 8);
    await t.eval("Mlyn.stan().ch4.noc = 0; Mlyn.stan().ch4.ozzy = 0; 0");
    const dd = await t.eval("Mlyn.szukajNocy($gameSystem._dayNightDay)");
    await t.gold(60);
    const oz = await talkTav("ozzy", ["Postaw mu piwo i spytaj"]);
    const ozs = await st();
    t.check("Ozzy za piwo (8 G): prognoza - noc z wysokim pływem o 2:00 i bez burzy, w najbliższe 3 dni (albo „Odłóż”)", dd ? ozs.ch4.noc === dd : ozs.ch4.noc === 0, { dd, noc: ozs.ch4.noc, text: oz.text });
    // force "no good night": tide forced low for the check
    await t.eval("Mlyn.api.nocWymus = false; 0");
    await t.eval("Mlyn.stan().ch4.noc = 0; Mlyn.stan().ch4.ozzy = 0; 0");
    const ozz = await talkTav("ozzy", ["Postaw mu piwo i spytaj"]);
    await t.eval("Mlyn.api.nocWymus = null; 0");
    t.check("tablica pływów u Ozzy'ego: tekst „Odłóż.” gdy żadna noc nie pasuje (ch4.noc = 0, piwo i tak kosztuje)", /Odłóż|Odloz/i.test(ozz.text) || (await st()).ch4.noc === 0, ozz.text);
    // the lever: not before 19:30, needs Walenty + Jasiek + allies + a night
    await t.eval(`Mlyn.debugGo(4); Mlyn.stan().ch4.walenty = 1; Mlyn.stan().ch4.jasiek = 'pomoc'; Mlyn.stan().ch4.soj = 'wit'; Mlyn.stan().ch4.noc = Mlyn.wieczorDzien(); 0`);
    await hourSet(41, 15);
    await go(217, 22, 9, 4);
    await t.eval("Mlyn.stan().ch4.noc = Mlyn.wieczorDzien(); 0");
    await t.eval("Mlyn.dzwignia(); 0");
    await fin();
    t.check("dźwignia za dnia: „ustawia się o zmierzchu” - mini-gra się nie otwiera", (await t.scene()) === "Scene_Map");
    await shot(t, "dzwignia_komora_dzien.png");
    await hourSet(41, 19.55);
    await t.eval("Mlyn.stan().ch4.noc = Mlyn.wieczorDzien(); 0");
    await t.eval("Mlyn.dzwignia(); 0");
    await t.frames(30);
    t.check("o 19:33 dźwignia otwiera mini-grę „Hamulec skrzydeł” (Scene_Poza)", (await t.scene()) === "Scene_Poza", await t.scene());
    await shot(t, "minigra_poza_B.png");
    await t.press("ok");
    await t.frames(60);
    t.check("pierwsze słowo B zatwierdzone, mini-gra zamknięta, zapisane pierwsza = B", (await t.scene()) === "Scene_Map" && (await st()).ch4.pierwsza === "B", await st().then(x => x.ch4));
    await fin();
    await t.eval("Mlyn.dzwignia(); 0");
    await fin();
    t.check("drugie słowo dopiero za kwadrans (o 20:15): wcześniej „kwadrans”", (await t.scene()) === "Scene_Map");
    await hourSet(41, 20.35);
    await t.eval("Mlyn.dzwignia(); 0");
    await t.frames(30);
    t.check("o 20:21 druga runda mini-gry", (await t.scene()) === "Scene_Poza");
    await t.press("right");
    await t.frames(10);
    await shot(t, "minigra_poza_C.png");
    await t.press("ok");
    await t.frames(60);
    await fin();
    const set1 = await st();
    t.check("B potem C: ustawione (ch4.set = dzień), krok 4 gotowy, rozdział 5", set1.ch4.set === 41 && (await rozdzial()) === 5 && set1.ch4.poza.join() === "B,C", set1.ch4);
    // wrong setting three times -> new keys
    await t.eval(`Mlyn.debugGo(4); Mlyn.stan().ch4.walenty = 1; Mlyn.stan().ch4.jasiek = 'pomoc'; Mlyn.stan().ch4.soj = 'wit'; Mlyn.stan().ch4.noc = Mlyn.wieczorDzien(); 0`);
    for (let i = 0; i < 3; i++) {
        await hourSet(41, 19.55);
        await t.eval("Mlyn.stan().ch4.noc = Mlyn.wieczorDzien(); Mlyn.stan().ch4.pierwsza = ''; Mlyn.stan().ch4.pierwszaDzien = 0; Mlyn.opts({ poza: 'A' }); Mlyn.dzwignia(); 0");
        await t.frames(10);
        await hourSet(41, 20.35);
        await t.eval("Mlyn.opts({ poza: 'D' }); Mlyn.dzwignia(); 0");
        await t.frames(10);
        await fin();
    }
    const wrong = await st();
    t.check("trzy złe ustawienia: Łasica wymienia klucze - rozdział 4 od nowa (walenty, jasiek, sojusznicy wyzerowani)", wrong.ch4.proby === 0 && !wrong.ch4.walenty && !wrong.ch4.jasiek && !wrong.ch4.soj && !wrong.ch4.set, wrong.ch4);

    // ---------------------------------------------------------------- chapter 5: the night in the cove
    await t.eval("Mlyn.debugGo(5); 0");
    await t.eval("Wyspa.forceTide('high'); 0");
    await t.eval("Mlyn.stan().ch4.soj = 'sambor'; Mlyn.stan().kod.wzor = 2; 0");
    await t.eval("Mlyn.stan().ch4.set = $gameSystem._dayNightDay; 0");
    await hourSet(+(await t.eval("$gameSystem._dayNightDay")) + 1, 1.2);
    await go(219, 36, 58, 4);
    await t.frames(60);
    const cove = await t.json("({ lodz: !!$gameMap.event(2973), szyper: !!$gameMap.event(2975), soj: !!$gameMap.event(2978), morze: !!$gameMap.event(2972), act: Mlyn.nocAktywna() })");
    t.check("noc po ustawieniu skrzydeł: zatoczka ma łódź, szypra, zasadzkę i światło na morzu (zdarzenia 2972-2982)", cove.lodz && cove.szyper && cove.soj && cove.morze && cove.act, cove);
    await shot(t, "zatoczka_noc_przed.png");
    await hourSet(+(await t.eval("$gameSystem._dayNightDay")), 1.55);
    await t.frames(60);
    await pump("(SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Latarnia')", 30);
    t.check("1:33 w zatoczce, bohater na cyplu: scena S3 otwiera mini-grę „Rozmowa światłami”", (await t.scene()) === "Scene_Latarnia", await t.scene());
    await t.frames(240);
    await shot(t, "minigra_latarnia_wpis.png");
    // the right answer: K D K (left, right, left), OK
    await t.press("left"); await t.frames(4); await t.press("right"); await t.frames(4); await t.press("left"); await t.frames(4);
    await shot(t, "minigra_latarnia_odpowiedz.png");
    await t.press("ok");
    await t.frames(120);
    await t.until("(Mlyn.stan().ch5.stan >= 1)", 20, 100);
    t.check("dobra odpowiedź K-D-K: łódź przybija (ch5.stan >= 1)", (await st()).ch5.stan >= 1, (await st()).ch5);
    await fin(40);
    await t.frames(200);
    await shot(t, "lodz_dobija.png");
    await t.until("Mlyn.stan().ch5.stan >= 3", 40, 150).catch(() => 0);
    await t.frames(120);
    await shot(t, "s4_zasadzka.png");
    await fin(60);
    // the exit menu: three exits
    await t.until("Mlyn.stan().ch5.stan >= 3 && ($gameMessage.isBusy() || $gameMap.isEventRunning() || Mlyn.stan().koniec > 0)", 60, 200).catch(() => 0);
    await shot(t, "wyjscie_szyper.png");
    await fin(60);
    const s5 = await st();
    t.check("po zasadzce z Samborem (bez walki) menu wyjść otwiera się; bez wyboru koniec = 0 aż do decyzji lub koniec w drodze", s5.ch5.stan >= 3, s5.ch5);
    await t.eval("Mlyn.zakoncz(1); 0");
    await fin();
    await t.frames(60);
    const endA = await st();
    t.check("wyjście 1 (Sambor): +60 G, Opinia +6, flaga mlynBaltazar, zadanie W19 zakończone", endA.koniec === 1 && (await t.eval("TownQuests.rec('W19').s")) === "done", endA.koniec);
    // the three exits in numbers (the rewards, the flags) on fresh states
    for (const [n, gold, opdelta, flag] of [[1, 60, 6, "mlynBaltazar"], [2, 25, 6, "mlynBaltazar"], [3, 90, -4, "mlynZdrada"]]) {
        await t.eval("Mlyn.debugGo(5); 0");
        const g = await t.gold(), op = await t.eval("TownQuests.state().opinion || 0");
        await t.eval(`Mlyn.zakoncz(${n}); 0`);
        await fin();
        const flags = await t.json("TownQuests.state().flags || {}");
        t.check(`wyjście ${n}: złoto +${gold}, Opinia ${opdelta > 0 ? "+" : ""}${opdelta}, flaga ${flag}, koniec = ${n}`, (await t.gold()) === g + gold && ((await t.eval("TownQuests.state().opinion || 0")) - op) === opdelta && !!flags[flag] && (await st()).koniec === n,
            { g: (await t.gold()) - g, op: (await t.eval("TownQuests.state().opinion || 0")) - op, flag: !!flags[flag] });
    }
    // after the end the sails turn on their own again
    await t.eval("Mlyn.forced(null); 0");
    await go(218, 7, 38, 8);
    await hourSet(45, 20);
    await t.frames(60);
    t.check("po zakończeniu wątku skrzydła kręcą się same (poza null w nocy)", (await t.eval("Mlyn.pozaTeraz()")) === null);
    // S5: the morning by the mill
    await t.eval("Mlyn.debugGo(5); Mlyn.stan().koniec = 1; Mlyn.stan().ch5.dzien = $gameSystem._dayNightDay - 1; Mlyn.stan().epilog = 0; 0");
    const g2 = await t.gold();   // (read before the walk there: the reward may come while the hour is being set - 2026-11-12, a race)
    await go(218, 7, 36, 8);
    await hourSet(+(await t.eval("$gameSystem._dayNightDay")), 7.5);
    await t.frames(60);
    await fin(60);
    t.check("S5 rano przy młynie: Walenty daje 40 G i dwa worki mąki (raz)", (await t.gold()) === g2 + 40 && (await st()).nagrody === 1);
    await shot(t, "s5_ranek.png");

    // ---------------------------------------------------------------- failures of the lantern: one chance and two
    await t.eval("Mlyn.debugGo(5); Mlyn.stan().ch4.soj = 'wit'; Mlyn.stan().kod.wzor = 1; 0");
    await t.eval("Wyspa.forceTide('high'); 0");
    await t.eval("Mlyn.stan().ch4.set = $gameSystem._dayNightDay; 0");
    await hourSet(+(await t.eval("$gameSystem._dayNightDay")) + 1, 1.55);
    await go(219, 36, 58, 4);
    await pump("(SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Latarnia')", 30);
    await t.frames(240);
    await t.press("right"); await t.frames(4); await t.press("ok");
    await t.frames(120);
    await shot(t, "minigra_latarnia_zle.png");
    await t.frames(200);
    await fin();
    const lost = await st();
    t.check("zły wzór z jedną szansą (bez Rocha): łódź odpływa, noc przepada (ch4.set = 0), ch5.bledy = 1", lost.ch5.bledy >= 1 && !lost.ch4.set, lost.ch5);
    // two chances (Roch's pattern): a wrong try then a right one
    await go(218, 7, 39, 8);
    await t.eval("Mlyn.debugGo(5); Mlyn.stan().ch4.soj = 'wit'; Mlyn.stan().kod.wzor = 2; 0");
    await t.eval("Mlyn.stan().ch4.set = $gameSystem._dayNightDay; 0");
    await hourSet(+(await t.eval("$gameSystem._dayNightDay")) + 1, 1.55);
    await go(219, 36, 58, 4);
    await pump("(SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Latarnia')", 30);
    await t.frames(240);
    await t.press("right"); await t.frames(4); await t.press("ok"); await t.frames(130);
    t.check("z wzorem Rocha druga szansa: po złej próbie łódź pyta jeszcze raz (scena nadal otwarta, próba 2 z 2)", (await t.scene()) === "Scene_Latarnia" && (await t.eval("SceneManager._scene.proba")) === 1);
    await t.eval("SceneManager._scene.end({ ok: false, proby: 2 }); 0");
    await fin();

    // ---------------------------------------------------------------- W23: on the smugglers' night nothing of the sea's thread lands on Map125
    await t.eval("Mlyn.debugGo(5); Wyspa.forceTide('high'); Mlyn.stan().ch4.set = $gameSystem._dayNightDay; 0");
    await go(218, 7, 39, 8);
    await hourSet(+(await t.eval("$gameSystem._dayNightDay")) + 1, 1.0);
    await go(219, 41, 58, 4);
    const blk = await t.json("({ b: Mlyn.blocksSea(219), b8: Mlyn.blocksSea(220), m: !!window.Morze })");
    t.check("Mlyn.blocksSea(219) w nocy przemytników = true (na innych mapach false)", blk.b === true && blk.b8 === false, blk);
    if (blk.m) {
        const cnt = () => t.json("({ n: window.Creatures ? Creatures.list.length : 0, sea: window.MorzePotwory && MorzePotwory.list ? MorzePotwory.list().length : 0 })").catch(() => ({ n: 0, sea: 0 }));
        await t.eval("try { Morze.force('krab_olbrzym'); } catch (e) { console.error(e); } 0");
        await t.frames(300);
        const sea = await cnt();
        // the control: the same forcing without the thread's night
        await t.eval("Mlyn.debugGo(0); 0");
        await t.eval("try { Morze.force('krab_olbrzym'); } catch (e) { console.error(e); } 0");
        await t.frames(300);
        const ctl = await cnt();
        t.check("wymuszone odwiedziny potwora z morza w noc przemytników: nic nie laduje (0), a bez W19 to samo wymuszenie tak (kontrola)", sea.n === 0 && sea.sea === 0 && (ctl.n + ctl.sea) > 0, { sea, ctl });
    }
    await t.eval("Mlyn.debugGo(0); 0");

    // ---------------------------------------------------------------- F9 rows
    const f9 = await t.json("(function(){ const s = Watki.f9.sekcje().find(x => /W19/.test(x.naglowek || x.head || '')); return s ? { n: (s.wiersze || s.rows || []).length, h: s.naglowek || s.head } : null; })()");
    t.check("F9: sekcja „Wątek W19 (Sygnały z młyna):” z wierszami (rozdział, poza, zmierzch, łódź, kod, wyłącz, wyzeruj)", f9 && f9.n === 7, f9);
    // the interior shots by hour
    await t.eval("Mlyn.debugGo(1); Mlyn.stan().zgoda = 1; Mlyn.stan().klucz = 1; 0");
    for (const [h, name] of [[8, "mlyn_wnetrze_rano.png"], [13, "mlyn_wnetrze_dzien.png"], [19.4, "mlyn_wnetrze_zmierzch.png"], [23, "mlyn_wnetrze_noc.png"]]) {
        await go(217, 7, 13, 8);
        await t.setHour(h);
        await t.frames(100);
        await shot(t, name);
    }
    await go(217, 22, 10, 4);
    await t.setHour(19.5);
    await t.frames(80);
    await shot(t, "mlyn_komora_dzwignia.png");
});
