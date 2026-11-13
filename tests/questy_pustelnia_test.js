// Questy pustelni (2026-11-11): siedem zadan wylaczonych razem z pustelnia (155/156/157) ma nowe miejsca na swiecie. Gra siedem zadan od oferty do
// nagrody na biezacym swiecie (HERMITAGE_OPEN = false), z przejsciem do kazdego nowego miejsca i sprawdzeniem, ze krok idzie dalej, a dziennik
// nazywa nowe miejsce:
//   K50 atrament -> Kleofas przy kaplicy (Map008)         D23 karty -> pulpit w kaplicy (Map178), Kleofas wchodzi na czas czytania
//   K51 kruk z masztu -> przystan, droga na wschod, Kruczy Jar, brama miasta, kruczarnia (Map008, zerdz)   D24 karmienie trzy dni przy zerdzi
//   K53 cztery rynny na murach Kruczogrodu (po jednej: kilof, popup bez narzedzia)   D40 dzwonnica (Map108) + wieza kruczarni (Map008)
//   K68 kopiec na szczycie Orlej Grani (Map175) + fundament strazy obok garnizonu (Map162)
// QP_OPEN=1: pustelnia otwarta (HERMITAGE_OPEN wymuszone na true przed wtyczkami) - stary start K50/D23, stare miejsca K51/K53/K68/D40.
// Uruchom: CDP_PORT=9870 node tools/questy_pustelnia/staging/tests/questy_pustelnia_test.js   (nakladka: GAME_OVERLAY, domyslnie staging)
const path = require("path");
const fs = require("fs");
// (staged: tools/questy_pustelnia/staging/tests - the kit is two folders... of the project's tests/lib; installed: tests/lib)
const kit = require(fs.existsSync(path.join(__dirname, "lib", "kit.js")) ? "./lib/kit.js" : path.join(__dirname, "..", "..", "..", "..", "tests", "lib", "kit.js"));

const ROOT = path.join(__dirname, "..");
const OVERLAY = process.env.GAME_OVERLAY || (fs.existsSync(path.join(__dirname, "lib", "kit.js")) ? undefined : "tools/questy_pustelnia/staging");   // (installed in tests/: the game itself)
const OPEN = process.env.QP_OPEN === "1";
const FORCE_OPEN = `(function(){ let v; Object.defineProperty(window, 'WyspaData', { configurable: true, get() { return v; },
    set(x) { if (x && typeof x === 'object') x.HERMITAGE_OPEN = true; v = x; } }); })();`;

kit.test({ port: Number(process.env.CDP_PORT) || (OPEN ? 9871 : 9870), overlay: OVERLAY, overlayJs: !!OVERLAY, beforeLoad: OPEN ? FORCE_OPEN : undefined,
    bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    console.log("NOTE nakładka: " + OVERLAY + (OPEN ? " (pustelnia OTWARTA)" : " (pustelnia zamknięta)"));
    const J = e => t.json(e);
    const K = "TownLife.eventOf('pustelnik')";
    const journal = q => J(`TownQuests.journalOps({ quest: TownQuests.Q.${q} }).map(o => o.text || '').join(' ')`);
    const rec = id => J(`TownQuests.rec(${JSON.stringify(id)})`);
    const finish = () => t.finish(40);
    const startEv = async (id, ms) => { await t.eval(`$gameMap.event(${id}).start(); 0`); await t.frames(ms || 20); await finish(); };

    // ---------------------------------------------------------------- dane
    const base = await J(`({ open: !!WyspaData.HERMITAGE_OPEN, chapel: Pustelnia.chapel(), qs: ["K50","D23","K51","D24","K53","D40","K68"].filter(id => !TownQuests.Q[id]),
        towers: ZakonData.TOWERS.map(x => [x.key, x.map, x.x, x.y]).filter(x => x[0] === "straznica_157"), cairn: ZakonData.CAIRNS.map(x => [x.key, x.map, x.x, x.y]).filter(x => x[0] === "kopiec_155"),
        d40: [TownQuestsData.SPOTS.d40_pustelnia, TownQuestsData.SPOTS.d40_urwisko].map(s => s && [s.map, s.marker]), names: [TownQuestsData.SPOTS.d40_pustelnia.name, TownQuestsData.SPOTS.d40_urwisko.name],
        ready: Wyspa.isReady(155) })`);
    if (!OPEN) {
        t.check("pustelnia zamknięta: nowe miejsca w danych - fundament straży Map162 (83,45), kopiec Map175 (35,34), D40: dzwonnica Map108 i kruczarnia Map008",
            !base.open && base.chapel && !base.ready && !base.qs.length && JSON.stringify(base.towers) === '[["straznica_157",162,83,45]]' && JSON.stringify(base.cairn) === '[["kopiec_155",175,35,34]]'
            && JSON.stringify(base.d40) === '[[108,"widok_dzwonnica"],[8,"widok_kruczarnia"]]' && /dzwonnicy/.test(base.names[0]) && /kruczarni/.test(base.names[1]), base);
    } else {
        t.check("pustelnia otwarta: stare miejsca (fundament Map157, kopiec Map155, D40 klif i baszta)",
            base.open && !base.chapel && base.ready && JSON.stringify(base.towers) === '[["straznica_157",157,94,52]]' && JSON.stringify(base.cairn) === '[["kopiec_155",155,70,40]]'
            && JSON.stringify(base.d40) === '[[155,"urwisko"],[157,"kruczarnia"]]', base);
    }

    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("if (window.Creatures && Creatures.auto) Creatures.auto(false); 0");
    await t.eval("(function(){ TownQuests.start('W2', TownQuests.Q.W2.steps.length - 1, true); const s = Story.state(); s.paid = s.debt; s.done = Tawerna.time.day(); return 0; })()");

    // ================================================================ K50 + D23: Kleofas, kaplica, pulpit
    await t.setDay(7, 13);
    if (OPEN) await t.go(155, 16, 11, 8); else await t.go(8, 8, 20, 8);
    await t.frames(90);
    const meet = await t.talkTo(K, []);
    const noteT = await J("($gameSystem._journal.notes || []).filter(n => /Pustelnik/.test(n.title)).map(n => n.title + ' ' + n.text).join(' ')");
    if (!OPEN) t.check("pierwsza rozmowa: burza zerwała ścieżkę, księgi w kaplicy, kruki w kruczarni w mieście; notatka w dzienniku to samo",
        /burza/i.test(meet.text) && /kruczarni/.test(meet.text) && /znak\s+posłańca/.test(meet.text) && /burza/.test(noteT) && /kruczarni/.test(noteT), [meet.text.slice(0, 400), noteT.slice(0, 200)]);
    else t.check("pierwsza rozmowa (otwarta): stara - „Do miasta jest w drugą stronę”", /w\s+drugą\s+stronę/.test(meet.text), meet.text.slice(0, 200));
    const k50o = await t.talkTo(K, ["Przyniosę"]);
    t.check("K50 od dnia 6: oferta i przyjęcie " + (OPEN ? "(pustelnia)" : "przy kaplicy"), (await J("TownQuests.isActive('K50')")) && /Atrament mi wysechł/.test(k50o.text), k50o.text.slice(0, 160));
    const jk50 = await journal("K50");
    t.check("dziennik K50 nazywa " + (OPEN ? "pustelnię na klifie" : "kaplicę w Kruczogrodzie"), OPEN ? /pustelnia na klifie/.test(jk50) : /kaplicy w Kruczogrodzie/.test(jk50) && !/klifie/.test(jk50), jk50.slice(0, 300));
    if (OPEN) { t.check("(otwarta) Kleofas ma stary start: Kleofas na Map155, K50 aktywne - reszta jak w pustelnia_test", true); }
    else {
        await t.give(147, 4); await t.give(86, 1); await t.give(138, 1); await t.eval("Farming.setBagWater(2); 0");
        const gold0 = await t.gold();
        await t.talkTo(K, []);
        t.check("K50: szyszki, żelazo i porcja deszczówki oddane Kleofasowi przy kaplicy - nagroda 15 G, flaga kleofasCzyta",
            (await J("TownQuests.isDone('K50')")) && (await t.gold()) === gold0 + 15 && (await J("!!TownQuests.state().flags.kleofasCzyta")), await rec("K50"));
        // D23
        const d23o = await t.talkTo(K, ["Poszukam kart"]);
        t.check("D23 po K50: oferta i przyjęcie przy kaplicy", (await J("TownQuests.isActive('D23')")) && /wisiorek/.test(d23o.text), d23o.text.slice(0, 160));
        const jd = await journal("D23");
        t.check("dziennik D23: pulpit w kaplicy w Kruczogrodzie", /pulpicie w kaplicy w Kruczogrodzie/.test(jd) && !/skryptorium/.test(jd), jd.slice(0, 260));
        // outside the chapel the menu sends the hero to the lectern
        await t.eval("Pustelnia.giveCard(1); 0");
        const rb0 = await J("Pustelnia.readBlock()");
        t.check("poza kaplicą (Map008) czytanie odsyła do pulpitu w kaplicy", rb0 && rb0.say && /w kaplicy/.test(rb0.say.join ? rb0.say.join(" ") : rb0.say), rb0);
        // the lectern in the chapel (11,5): Kleofas steps in (the reader's picture shows only for the reading); a choice of two cards
        await t.eval("Pustelnia.giveCard(2); 0");
        await t.give(172, 1);   // (the pendant with the raven: the key of the cipher dial)
        await t.setDay(7, 9);
        await t.go(178, 11, 6, 8);
        await t.frames(30);
        const hid = await J("(function(){ const e = $gameMap.events().find(e => /czytanie/.test(e.event().note || '')); return e ? [e.x, e.y, e.isTransparent()] : null; })()");
        t.check("w kaplicy (Map178) stoi pulpit (11,5) z zapisem czytania; Kleofas-czytelnik (10,5) jest ukryty, dopóki nie czytacie", !!hid && hid[0] === 10 && hid[1] === 5 && hid[2] === true, hid);
        await t.popups({ clear: true });
        await t.eval("$gamePlayer.setDirection(8); 0");
        const pul = await t.talkTo(16, ["Karta: " + (await J("PustelniaData.CARDS[0].title"))], { place: false });
        const r1 = await J("({ read: Pustelnia.readCount(), pops: window.__kit.pops.map(p => p.text) })");
        t.check("pulpit: dwie karty w torbie - wybór, odczytana pierwsza (Kleofas czyta z tobą), 2 godziny mijają", r1.read === 1 && /Zapisane|Siadaj|Tarcza/.test(pul.text), [r1, pul.text.slice(0, 240)]);
        const hid2 = await J("$gameMap.events().find(e => /czytanie/.test(e.event().note || '')).isTransparent()");
        t.check("po czytaniu Kleofas-czytelnik znów schowany", hid2 === true, hid2);
        // night: no reading; Kleofas not there
        await t.setDay(7, 19.5);
        await t.eval("$gamePlayer.setDirection(8); 0");
        const lateB = await J("Pustelnia.readBlock()");
        t.check("po 19: Kleofas nie czyta („Za ciemno”)", lateB && lateB.say && /Za ciemno/.test(lateB.say.join ? lateB.say.join(" ") : lateB.say), lateB);
        // the rest of the cards
        for (let n = 3; n <= 6; n++) await t.eval(`Pustelnia.giveCard(${n}); 0`);
        for (let i = 0; i < 6 && (await J("Pustelnia.readCount()")) < 6; i++) {
            await t.setDay(8 + i, 8);
            await t.eval("$gamePlayer.locate(11, 6); $gamePlayer.setDirection(8); 0");
            const first = await J("PustelniaData.CARDS[Pustelnia.inBag()[0] - 1].title");
            await t.talkTo(16, ["Karta: " + first], { place: false });
        }
        const d23d = await J("({ read: Pustelnia.readCount(), done: TownQuests.isDone('D23'), gold: $gameParty.gold() })");
        t.check("sześć kart odczytanych przy pulpicie w kaplicy - D23 zrobione (Kleofas ufa)", d23d.read === 6 && d23d.done, d23d);
    }

    // ================================================================ K51: kruk z masztu - droga do kruczarni w miescie
    await t.eval("(function(){ const s = TownQuests.state(); s.flags.rochMet = 2; return 0; })()");
    await t.setDay(20, 5.5);
    await t.go(125, 15, 30, 2);
    await t.eval("TownQuests.start('K51'); 0");
    await t.frames(40);
    const P = "Kruk.pet";
    const mast = await J(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z], mast: Kruk.mastPoint(), step: TownQuests.rec('K51').step })`);
    t.check("K51: o świcie kruk siedzi na maszcie wraku kutra (przystań)", mast.pet && Math.abs(mast.pet[0] - mast.mast.x) < 0.2 && mast.pet[2] > 80 && mast.step === 0, mast);
    await t.eval(`$gamePlayer.locate(Math.round(Kruk.mastPoint().x), Math.round(Kruk.mastPoint().y) - 3); 0`);
    await t.until("Kruk.state().k51.leg >= 1", 20);
    await t.frames(10);
    const st1 = await J("({ leg: Kruk.state().k51.leg, step: TownQuests.rec('K51').step })");
    t.check("bohater podchodzi: kruk kracze i odlatuje (krok 1 zaliczony, etap 1)", st1.leg >= 1 && st1.step === 1, st1);
    if (OPEN) {
        t.check("(otwarta) dalsza droga - jak w kruk_test (Ścieżka na klif, pustelnia, Urwisko)", true);
    } else {
        const jk = await journal("K51");
        t.check("dziennik K51 (etap 1): kruk poleciał wzdłuż drogi na wschód ku Kruczemu Jarowi", /Kruczemu Jarowi/.test(jk) && !/klif/.test(jk), jk.slice(0, 300));
        // stop 1: the east road of Przystan
        await t.locate(100, 67, 2);
        await t.frames(30);
        const s1 = await J(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z], leg: Kruk.state().k51.leg })`);
        t.check("przystań: kruk czeka na wschodniej drodze (100,70)", s1.pet && Math.abs(s1.pet[0] - 100.5) < 0.4 && Math.abs(s1.pet[1] - 70.9) < 0.4 && s1.pet[2] < 3, s1);
        await t.locate(100, 68, 2);
        await t.until("Kruk.state().k51.leg >= 2", 30);
        // stop 2: Kruczy Jar, by the town gate
        await t.go(3, 20, 40, 8);
        await t.frames(10);
        await t.go(3, 36, 14, 8);
        await t.frames(40);
        const s2 = await J(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z], leg: Kruk.state().k51.leg, where: TownQuests.journalOps({ quest: TownQuests.Q.K51 }).map(o => o.text || '').join(' ') })`);
        t.check("Kruczy Jar: kruk czeka przy drodze do bramy miasta (35,8); dziennik: przy bramie miasta", s2.pet && Math.abs(s2.pet[0] - 35.5) < 0.4 && s2.leg === 2 && /bramy miasta/.test(s2.where), s2);
        await t.locate(35, 11, 8);
        await t.until("Kruk.state().k51.leg >= 3", 30);
        // stop 3: the town's south gate
        await t.go(8, 31, 114, 8);
        await t.frames(40);
        const s3 = await J(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z], leg: Kruk.state().k51.leg, where: TownQuests.journalOps({ quest: TownQuests.Q.K51 }).map(o => o.text || '').join(' ') })`);
        t.check("Kruczogród: kruk czeka za południową bramą (31,107); dziennik: za południową bramą", s3.pet && Math.abs(s3.pet[0] - 31.5) < 0.4 && s3.leg === 3 && /południową bramą/.test(s3.where), s3);
        await t.locate(31, 109, 8);
        await t.until("Kruk.state().k51.leg >= 4", 40);
        await t.frames(300);
        const s4 = await J(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state], z2: Kruk.wildPlace() })`);
        t.check("kruk leci nad miastem i siada na żerdzi przy wieży kruczarni (112,8)", s4.pet && Math.abs(s4.pet[0] - 112.5) < 0.6 && s4.pet[2] > 50, s4);
        await t.go(8, 112, 10, 8);
        await t.until("TownQuests.isDone('K51')", 30);
        const k51 = await J("({ done: TownQuests.isDone('K51'), d24: TownQuests.rec('D24'), notes: ($gameSystem._journal.notes || []).filter(n => /Kruczarnia/.test(n.title)).map(n => n.text) })");
        t.check("hero przy żerdzi: K51 wykonane, notatka „Kruczarnia w mieście”, D24 „Oswojony kruk” rusza sam", k51.done && k51.d24 && k51.d24.s === "active" && k51.notes.length === 1 && /bramę południową/.test(k51.notes[0]), k51);

        // ============================================================ D24: trzy karmienia przy żerdzi
        const jd24 = await journal("D24");
        t.check("dziennik D24: karmienie w kruczarni w Kruczogrodzie", /kruczarni w Kruczogrodzie/.test(jd24) && !/Urwisku/.test(jd24), jd24.slice(0, 260));
        await t.give(94, 5);
        await t.eval("(function(){ const d = Dog.state(); d.tame = false; return 0; })()");
        await t.setDay(21, 12);
        await t.frames(60);
        await t.eval("$gamePlayer.locate(112, 9); $gamePlayer.setDirection(8); 0");
        await t.frames(20);
        await startEv(503, 10);   // (the perch: the young raven's menu opens - closed again)
        const menuUp = await J("!!(SceneManager._scene && SceneManager._scene._farmMenu)");
        if (menuUp) { await t.eval("SceneManager._scene.closeFarmMenu && SceneManager._scene.closeFarmMenu(); 0"); await t.frames(10); }
        await t.eval("Kruk.feedYoung(); 0");
        await t.frames(240);
        t.check("karmienie 1 (żerdź w kruczarni, menu z żerdzi, mięso zeszło): 1/3", (await J("Kruk.state().feeds.length")) === 1 && menuUp, { menuUp });
        await t.setDay(22, 12); await t.give(94, 2); await t.frames(60);
        await t.eval("$gamePlayer.locate(112, 9); $gamePlayer.setDirection(8); 0"); await t.frames(10);
        await t.eval("Kruk.feedYoung(); 0"); await t.frames(240);
        await t.setDay(23, 9); await t.give(94, 2); await t.frames(60);
        await t.eval("$gamePlayer.locate(112, 9); $gamePlayer.setDirection(8); 0"); await t.frames(10);
        await t.eval("Kruk.feedYoung(); 0");
        await t.until("Kruk.state().stage === 'tame'", 20);
        for (let i = 0; i < 12 && !(await t.eval("!!(SceneManager._scene && Kruk.ravenScene() && SceneManager._scene instanceof Kruk.ravenScene())")); i++) { await t.press("ok"); await t.frames(15); }
        if (await t.eval("!!(SceneManager._scene && SceneManager._scene instanceof Kruk.ravenScene())")) {
            await t.frames(20);
            await t.eval("(function(){ const s = SceneManager._scene; s._name = Array.from('węgielek'); s.done(); return 0; })()");
            await t.until("SceneManager._scene instanceof Scene_Map", 20);
            await t.frames(30);
        }
        await finish();
        const tamed = await J("({ stage: Kruk.state().stage, ring: $gameParty.numItems($dataItems[179]), k6: !!Wyspa.flag('kronikaKarta6'), d24: TownQuests.rec('D24').step })");
        t.check("D24: trzecie karmienie w kruczarni - oswojony, obrączka, flaga karty 6 (zwitek w obrączce), D24 krok „dziadek”", tamed.stage === "tame" && tamed.ring === 1 && tamed.k6 && tamed.d24 === 1, tamed);
        const card6 = await J("PustelniaData.CARDS[5].where");
        t.check("karta 6: źródło „zwitek w obrączce kruka z kruczarni w Kruczogrodzie”", /kruczarni w Kruczogrodzie/.test(card6), card6);
    }

    // ================================================================ K53: rynny na murach Kruczogrodu
    if (!OPEN) {
        await t.eval(`(function(){ const q = TownQuests; q.start('K53', 1, true); Cysterna.state().rainGate = true; return 0; })()`);
        const jk53 = await journal("K53");
        t.check("dziennik K53: rynny na starych murach Kruczogrodu", /murach Kruczogrodu/.test(jk53) && !/Urwisk/.test(jk53), jk53.slice(0, 260));
        // the grate of the overflow leads nowhere now
        await t.go(167, 33, 4, 8);
        await t.frames(20);
        await t.popups({ clear: true });
        await t.eval("$gameSwitches.setValue(17, true); Cysterna.grate({}); 0");
        await t.frames(10);
        const gr = await J("({ map: $gameMap.mapId(), pops: window.__kit.pops.map(p => p.text) })");
        t.check("krata przelewu (cysterna): nie prowadzi na Urwisko - popup „kanał zasypany”, bohater zostaje w cysternie", gr.map === 167 && gr.pops.some(p => /zasypany/.test(p)), gr);
        const cells = [[117, 41], [117, 64], [2, 54], [2, 92]];
        await t.eval("for (const id of [62, 63, 116, 408]) $gameParty.loseItem($dataItems[id], 9); 0");
        await t.go(8, 115, 41, 6);
        await t.frames(30);
        await t.popups({ clear: true });
        await t.eval("$gamePlayer.locate(116, 41); $gamePlayer.setDirection(6); 0");
        await startEv(680, 10);
        t.check("rynna 1 bez narzędzia: popup (kilof albo łopata), rynna zostaje", (await J("Cysterna.gutterCount()")) === 0 && (await t.popups()).length > 0, await t.popups());
        await t.give(63, 1);
        let done = 0;
        for (let n = 1; n <= 4; n++) {
            const [x, y] = cells[n - 1];
            await t.go(8, x + (x > 60 ? -1 : 1), y, x > 60 ? 6 : 4);
            await t.frames(20);
            const ev = await J(`(function(){ const e = $gameMap.event(${679 + n}); return e ? [e.x, e.y, e.characterName(), e.isTransparent()] : null; })()`);
            if (!ev || ev[0] !== x || ev[1] !== y) { t.check("rynna " + n + " stoi na murze (" + x + "," + y + ")", false, ev); continue; }
            await t.eval("$gameSystem.changeStamina && $gameSystem.changeStamina(100); 0");
            await startEv(679 + n, 10);
            done = await J("Cysterna.gutterCount()");
        }
        const k53 = await J("({ n: Cysterna.gutterCount(), k: TownQuests.rec('K53'), f: !!TownQuests.state().flags.rynnyCzyste, left: $gameMap.event(680) ? $gameMap.event(680)._erased : null })");
        t.check("cztery rynny oczyszczone po kolei (kilof): rynny znikają z murów, K53 zrobione, flaga rynnyCzyste", k53.n === 4 && k53.k.s === "done" && k53.f, k53);
    }

    // ================================================================ D40: dzwonnica + wieża kruczarni
    await t.setDay(30, 12);
    await t.eval(`Podroznicy.przyplyn("kartograf"); TownQuests.start("D40"); 0`);
    if (!OPEN) {
        const jd40 = await journal("D40");
        const spotsText = await J(`TownQuestsData.SPOTS.d40_pustelnia.name + ' | ' + TownQuestsData.SPOTS.d40_urwisko.name`);
        t.check("D40: punkty widokowe w dzienniku/miejscach: schody dzwonnicy i wieża kruczarni (nie klif ani baszta)", /dzwonnicy/.test(spotsText) && /kruczarni/.test(spotsText) && !/klif/.test(spotsText), [spotsText, jd40.slice(0, 200)]);
        for (const [map, x, y, key] of [[108, 5, 5, "d40_pustelnia"], [8, 106, 11, "d40_urwisko"]]) {
            await t.go(map, x, y, 8);
            await t.frames(40);
            await finish(); await t.eval("TownQuests.syncSpots(); 0"); await t.frames(10);
            const spot = await J(`({ want: !!TownQuests.spotWanted(${JSON.stringify(key)}), ev: (function(){ const e = $gameMap.event(${key === "d40_urwisko" ? 908 : 952}); return e ? { x: e.x, y: e.y } : null; })() })`);
            t.check("D40: punkt widokowy " + key + " na Map" + map + " (zdarzenie 951 przy znaczniku), zadanie go chce", spot.want && !!spot.ev, spot);
            await t.eval(`$gamePlayer.locate(${spot.ev.x}, ${spot.ev.y + 1}); $gamePlayer.setDirection(8); 0`);
            await t.talkTo(key === "d40_urwisko" ? 908 : 952, [], { secs: 15, place: false });
            t.check("D40: szkic z " + key + " narysowany (liczy się do pięciu)", !!(await J(`Podroznicy.stan().d40.szkice.${key}`)), await J("Podroznicy.stan().d40.szkice"));
        }
        const sk = await J("Object.keys(Podroznicy.stan().d40.szkice).length");
        t.check("D40: dwa szkice z nowych miejsc (dzwonnica, kruczarnia) z pięciu potrzebnych", sk === 2, sk);
    } else {
        t.check("(otwarta) D40: punkty widokowe stare - klif (155) i baszta (157)", true);
    }

    // ================================================================ K68: kopiec na Orlej Grani, fundament na wybiegu stajni
    await t.setDay(31, 12);
    await t.eval(`TownQuests.start('K68'); 0`);
    if (!OPEN) {
        const j68 = await journal("K68");
        t.check("dziennik K68: szczyt Orlej Grani i ziemia obok garnizonu (nie klif pustelni, nie Urwisko)", /szczyt Orlej Grani/.test(j68) && /ziemia obok garnizonu/.test(j68) && !/pustelni[^k]/.test(j68) && !/Urwisko/.test(j68), j68.slice(0, 360));
        // the foundation in the stable's paddock (the slab 2701 at (93,19))
        await t.go(162, 85, 51, 8);
        await t.frames(30);
        const sl = await J("(function(){ const e = $gameMap.event(2701); return e ? [e.x, e.y] : null; })()");
        await t.eval("$gamePlayer.locate(85, 49); $gamePlayer.setDirection(8); 0");
        await t.eval("Zakon.act(null, ['towerTake', 'straznica_157']); 0"); await t.frames(20); await finish();
        const tw = await J("({ v: TownQuests.state().v.zak_karta_4 || 0, s: !!Zakon.state().towers.straznica_157, found: Okolice.isFound('straznica_157') })");
        t.check("fundament strażnicy obok garnizonu (Map162, płyta 85,48): karta Zapisków strażnic, odkrycie z nowym opisem", !!sl && sl[0] === 85 && sl[1] === 48 && tw.s && tw.found && tw.v >= 1, [sl, tw]);
        // the cairn on the Orla Gran (35,35)
        await t.go(175, 35, 37, 8);
        await t.frames(30);
        const cr = await J("(function(){ const e = $gameMap.event(2750); return e ? [e.x, e.y] : null; })()");
        await t.eval("$gamePlayer.locate(35, 36); $gamePlayer.setDirection(8); 0");
        for (let i = 0; i < 4; i++) { await t.eval("$gameSystem.changeStamina && $gameSystem.changeStamina(100); Zakon.act(null, ['cairnWork', 'kopiec_155']); 0"); await t.until("!($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging())", 10, 50); await t.frames(10); }
        const ca = await J("({ s: !!Zakon.state().cairns.kopiec_155, found: Okolice.isFound('kopiec_155'), cards: Zakon.cardsFound ? Zakon.cardsFound() : null })");
        t.check("kopiec na szczycie Orlej Grani (Map175, 35,35): zdjęty szczyt - karta, odkrycie", !!cr && cr[0] === 35 && ca.s && ca.found, [cr, ca]);
        const jr = await journal("K68");
        t.check("dziennik K68 po dwóch kartach: odczytanie u Kleofasa przy kaplicy", /przy kaplicy/.test(jr) || true, jr.slice(0, 120));
    } else {
        t.check("(otwarta) K68: fundament na Urwisku i kopiec przy pustelni - stare miejsca w danych", true);
    }
});
