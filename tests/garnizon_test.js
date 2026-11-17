// Straż dworu Lorda (dawniej PAKIET D „Garnizon nad zatoką”; od 2026-11-16 nowy świat: Posiadłość Map221, izba straży Map180;
// js/plugins/Garnizon_Data.js + Garnizon.js, js/teksty/garnizon.txt). Sprawdza:
//   - wtyczki, mieszkańców 945-947 (kapitan Bełza, kwatermistrz Kłos, werbownik Bęben) i zadania K52, D26, D27
//   - dwór: strażnicy 640-647 na swoich miejscach (brama, dziedziniec, wybieg, pomost przy zbiorniku, stajnia), wóz ze zbożem i beczki
//     z wodą dworu (tylko dymek - żadnej wody), brak łachy starej zatoki, drzwi wartowni do izby straży (Map180)
//   - pierwsze spotkanie z kapitanem (bohater nie jest wcielany), lista zaginionych, „Weźmiecie mnie do straży?”, brak glejtu na wrak
//   - K52 (drewno i węgiel -> skup, przychylność +20), skup (cena, fala x1,5, limit dzienny, tydzień głodu: Opinia -1), kowala straży przy 60
//   - D26 (werbownik na rynku Kruczogrodu dzień po fali, pomoc/ostrzeżenie, poszukiwania w Podgrodziu, rekruci na placu ćwiczeń dworu)
//   - D27 (Ludmiła, worki od Kłosa nocą, Kłos wydany kapitanowi; kradzież z wozu - noc w areszcie wartowni, patrol poniżej 10)
//   - Akt III (obrońcy przy 80), Kłos nocą przy tylnych drzwiach kantoru w Kruczogrodzie; bez błędów w konsoli
// Uruchom: node tests/run.js garnizon --port 9504     Jedna część: GARN_ONLY=dwor,ludzie,k52,skup,d26,d27,koniec
const kit = require("./lib/kit.js");
const ONLY = (process.env.GARN_ONLY || "").split(",").filter(Boolean);
const part = name => !ONLY.length || ONLY.includes(name);
const DWOR = 221, IZBA = 180, MIASTO = 220, PODG = 218;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const ev = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const quietTalk = async (expr, picks, o) => { const r = await t.talkTo(expr, picks, Object.assign({ secs: 40 }, o || {})); await t.frames(10); return r; };
    const flags = () => t.json("TownQuests.state().flags");
    const rec = id => t.json(`TownQuests.rec(${JSON.stringify(id)})`);
    const favor = () => t.eval("Garnizon.favor()");
    const setFavor = n => t.eval(`Garnizon.state().favor = ${n}; Garnizon.favor()`);
    const where = key => t.json(`(function(){ const e = TownLife.eventOf(${JSON.stringify(key)}); return e ? [e.x, e.y, !!(e._town && e._town.hidden), $gameMap.mapId()] : null; })()`);
    const bezPatrolu = async () => {   // (K66 „Nocny patrol”: the captain opens with it once a day - turned down, then his own rows)
        if (!(await t.eval(`TownQuests.offerable("K66")`))) return null;
        await quietTalk(ev("rotmistrz"), ["Nie tej nocy"]);
        return !(await t.eval(`TownQuests.offerable("K66")`));
    };

    // ---------------------------------------------------------------- wtyczki
    const pl = await t.json(`({ g: !!window.Garnizon && !Tawerna.api("Garnizon").skeleton, map: Garnizon.MAP, q: Garnizon.QUARTERS,
        res: TownLife.RESIDENTS.filter(r => ["rotmistrz", "kwatermistrz", "werbownik"].includes(r.key)).map(r => r.key + ":" + r.id + ":" + r.map + ":" + r.name),
        zad: ["K52", "D26", "D27"].map(id => TownQuests.Q[id] ? TownQuests.Q[id].title : null) })`);
    t.check("straż dworu: silnik na Posiadłości (221) z izbą straży (180); mieszkańcy 945-947 na mapie 221 (Kapitan Bełza, Kwatermistrz Kłos, Werbownik Bęben); zadania K52 „Drewno dla straży”, D26, D27",
        pl.g && pl.map === DWOR && pl.q === IZBA && pl.res.join("|") === "rotmistrz:945:221:Kapitan Bełza|kwatermistrz:946:221:Kwatermistrz Kłos|werbownik:947:221:Werbownik Bęben"
        && pl.zad[0] === "Drewno dla straży" && pl.zad.every(Boolean), pl);

    if (part("dwor")) {
        await t.newGame({ map: DWOR, x: 45, y: 33, dir: 8, hour: 10, day: 6, quiet: true, minimap: false });
        await t.frames(60);
        const m = await t.json(`(function(){
            const s = [640,641,642,643,644,645,646,647].map(id => { const e = $gameMap.event(id); return e ? [id, e.x, e.y, !!(e._garn && e._garn.hidden), e.characterName()] : null; });
            const g = $gameMap.event(Garnizon.DATA.GRANARY.id), b = Garnizon.DATA.BARRELS.map(o => $gameMap.event(o.id));
            let bar = 0; for (let y = 20; y <= 21; y++) for (let x = 0; x <= 11; x++) bar += Garnizon.barCell(x, y) ? 1 : 0;
            return { s, g: g ? [g.x, g.y, g.characterName()] : null, b: b.map(e => e ? [e.x, e.y, e.characterName()] : null), bar, lacha: !!SceneManager._scene._spriteset._garnLacha }; })()`);
        t.check("o 10:00 strażnicy 640-647 na dworze, wszyscy widoczni (arkusze $Npc_Zolnierz / _B); wóz ze zbożem (63,31) i dwie beczki dworu (50-51,23); łachy starej zatoki nie ma",
            m.s.every(x => x && !x[3] && /Npc_Zolnierz/.test(x[4])) && m.g && m.g[0] === 63 && m.g[1] === 31 && m.b.every(x => x && /Tavern_Yard/.test(x[2])) && m.bar === 0 && !m.lacha, m);
        await t.go(DWOR, 41, 30, 8); await t.frames(60);
        await t.shot("../docs/straz_dworu/brama.png");
        // the water barrels: a bubble, no water
        await t.eval("Needs.setEnabled(true); Needs.state().water = 40; 0");
        await t.popups({ clear: true });
        await t.eval("$gamePlayer.locate(49, 23); $gamePlayer.setDirection(6); 0");
        await t.frames(5);
        await t.press("ok");
        await t.frames(20);
        await t.finish(6);
        const pops = await t.popups(), water = await t.json("Math.round(Needs.state().water)");
        await t.eval("Needs.setEnabled(false); 0");
        t.check("beczki z wodą dworu: dymek „Woda dworu. Odejdź.” i ani łyka", pops.some(p => /Woda dworu/.test(p)) && water <= 40, { pops, water });
        // the guardhouse's door: into the guard's hall
        await t.eval("$gamePlayer.locate(49, 30); $gamePlayer.setDirection(8); 0");
        await t.hold("up", 60);
        const inQ = await t.until(t.onMap(IZBA), 10);
        await t.frames(20);
        const q = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
        t.check("drzwi wartowni (49,29) prowadzą do izby straży (Map180)", inQ && q[0] === IZBA, q);
    }

    if (part("ludzie")) {
        await t.newGame({ map: DWOR, x: 45, y: 31, dir: 8, hour: 10, day: 6, quiet: true, minimap: false });
        await t.frames(60);
        const w = { rot: await where("rotmistrz"), klos: await where("kwatermistrz"), beb: await where("werbownik") };
        t.check("o 10:00: kapitan przy bramie (38,28), Kłos przy skupie pod stajnią (61,30), werbownik przy stole przed bramą (43,32) - wszyscy widoczni",
            w.rot && w.rot[0] === 38 && w.rot[1] === 28 && !w.rot[2] && w.klos && w.klos[0] === 61 && w.klos[1] === 30 && !w.klos[2] && w.beb && w.beb[0] === 43 && w.beb[1] === 32 && !w.beb[2], w);
        const meet = await quietTalk(ev("rotmistrz"), []);
        t.check("pierwsze spotkanie z kapitanem Bełzą: „Ile masz lat? ...Jeszcze nie.”, kapitan straży dworu, flaga garnizonPoznany",
            /Ile masz lat/.test(meet.text) && /Jeszcze nie/.test(meet.text) && /kapitan straży dworu/.test(meet.text) && !!(await flags()).garnizonPoznany, meet.text.slice(0, 300));
        await bezPatrolu();
        const list = await quietTalk(ev("rotmistrz"), ["Co to za lista", "Bywaj"]);
        t.check("lista zaginionych: chorągiew brzozowska, tylko słowo „zaginiony”; w rozmowie nie ma pytania o wrak (glejt niepotrzebny w nowym świecie)",
            /brzozowska/.test(list.text) && /zaginiony/.test(list.text) && !list.choices.some(c => c.some(x => /wrak/.test(x))), { t: list.text.slice(-200), c: list.choices });
        const draft = await quietTalk(ev("rotmistrz"), ["Weźmiecie mnie", "Bywaj"]);
        t.check("„Weźmiecie mnie do straży?” - za młody, dwór ręczy za dług: pobór dla Korony dotyczy innych", /Za młody/.test(draft.text) && /Pobór dla Korony dotyczy innych/.test(draft.text), draft.text.slice(-200));
    }

    if (part("k52")) {
        await t.newGame({ map: DWOR, x: 60, y: 32, dir: 8, hour: 10, day: 6, quiet: true, minimap: false });
        await t.frames(30);
        await t.eval(`TownQuests.state().flags.garnizonPoznany = 1; Garnizon.state().met.rotmistrz = 1; 0`);
        await quietTalk(ev("kwatermistrz"), []);   // (the first meeting, at the manor)
        await t.setHour(18.2); await t.go(1, 14, 37, 8); await t.frames(40);
        const offer = await quietTalk(ev("kwatermistrz"), ["Przyniosę"]);
        const r0 = await rec("K52");
        t.check("K52 „Drewno dla straży” u kwatermistrza w tawernie (17-19:30): przyjęte", r0 && r0.s === "active" && /Kuchnia straży/.test(offer.text), { r0, text: offer.text.slice(0, 200) });
        await t.give(61, 10); await t.give(79, 4);
        const g0 = await t.gold(), fv0 = await favor();
        await quietTalk(ev("kwatermistrz"), []);
        const r1 = await rec("K52"), g1 = await t.gold(), f = await flags();
        await t.frames(40);
        const fv2 = await favor();
        t.check("oddane 10× Drewno i 4× Węgiel: +20 G, skup otwarty (k52Skup), przychylność straży 20 -> 40", r1 && r1.s === "done" && g1 - g0 === 20 && !!f.k52Skup && fv0 === 20 && fv2 === 40, { r1, g0, g1, fv0, fv2 });
        await t.setHour(10); await t.go(DWOR, 60, 32, 8); await t.frames(40);

        if (part("skup")) {
            await t.give(74, 5);
            const p6 = await t.eval("Garnizon.priceOf(74, 6)"), p12 = await t.eval("Garnizon.priceOf(74, 12)");
            const ga = await t.gold();
            const s = await quietTalk(ev("kwatermistrz"), ["Sprzedam coś do skupu", "Jęczmień"]);
            const gb = await t.gold(), left = await t.count(74);
            t.check("skup dworu: jęczmień 6 G (tydzień po fali 9 G), 5× sprzedane za 30 G", p6 === 6 && p12 === 9 && gb - ga === 30 && left === 0, { p6, p12, ga, gb, left, text: s.text.slice(-200) });
            await t.give(61, 23);
            await t.popups({ clear: true });
            const gc = await t.gold();
            await quietTalk(ev("kwatermistrz"), ["Sprzedam coś do skupu", "Drewno"]);
            const gd = await t.gold(), wood = await t.count(61);
            const sw2 = await quietTalk(ev("kwatermistrz"), ["Sprzedam coś do skupu"]);
            t.check("limit dzienny: z 23 polan Kłos bierze dziś 10 (30 G), drugi raz „dość na dziś”", gd - gc === 30 && wood === 13 && /Dość na dziś|dziesięć sztuk i ani jednej więcej/.test(sw2.text), { gc, gd, wood, t: sw2.text.slice(-160) });
            await t.setDay(28);
            await t.give(71, 3);
            const op0 = await t.eval("TownQuests.opinion()");
            await quietTalk(ev("kwatermistrz"), ["Sprzedam coś do skupu", "Ziemniak"]);
            await t.give(71, 2);
            await quietTalk(ev("kwatermistrz"), ["Sprzedam coś do skupu", "Ziemniak"]);
            const op1 = await t.eval("TownQuests.opinion()");
            t.check("tydzień głodu po rekwizycji: sprzedaż jedzenia do skupu kosztuje Opinię -1 (raz dziennie)", op1 === op0 - 1, { op0, op1 });
            await setFavor(55);
            await t.gold(200);
            await quietTalk("$gameMap.event(646)", ["Strzały"]);
            const ar0 = await t.count(127);
            await setFavor(65);
            const ks = await quietTalk("$gameMap.event(646)", ["Strzały"]);
            const ar1 = await t.count(127);
            t.check("kowal straży przy stajni: poniżej 60 nic, od 60 strzały ×10 za 30 G", ar0 === 0 && ar1 === 10 && (await t.gold()) === 170 && /Przyjaciel straży/.test(ks.text), { ar0, ar1, t: ks.text.slice(0, 120) });
        }
    }

    if (part("d26")) {
        await t.newGame({ map: MIASTO, x: 58, y: 46, dir: 8, hour: 10, day: 11, quiet: true, minimap: false });
        await t.eval("$gamePlayer.requestMapReload(); 0");
        await t.go(MIASTO, 58, 46, 8);
        await t.frames(40);
        const w = await t.json(`(function(){ const e = TownLife.eventOf("werbownik"); const l = $gameMap.event(656);
            return { w: e ? [e.x, e.y, !!(e._town && e._town.hidden)] : null, list: l ? [l.x, l.y, !!(l._garn && l._garn.hidden)] : null }; })()`);
        t.check("dzień po fali (11): werbownik na rynku Kruczogrodu (60,43) z listą poborową (zdarzenie 656 przy 61,44)", w.w && w.w[0] === 60 && w.w[1] === 43 && !w.w[2] && w.list && w.list[0] === 61 && !w.list[2], w);
        await quietTalk(ev("werbownik"), []);
        const off = await quietTalk(ev("werbownik"), ["Pomogę"]);
        const r0 = await rec("D26");
        t.check("D26 „Lista poborowa”: Korona chce trzech ludzi - oferta werbownika przyjęta", r0 && r0.s === "active" && /Bartek Kmieć/.test(off.text) && /Korona/.test(off.text), { r0, t: off.text.slice(0, 300) });
        const fx = (key, how) => t.eval(`TownQuests.act(null, ["D26", "fx", "d26Ludzie", { key: ${JSON.stringify(key)}, how: ${JSON.stringify(how)} }]); 0`);
        if (await t.eval(`!!TownLife.eventOf("bartek") && !TownLife.eventOf("bartek")._town.hidden`)) await quietTalk(ev("bartek"), ["Schowaj się"]);
        else await fx("bartek", "warn");
        const g0 = await t.gold();
        await t.go(PODG, 45, 45, 8); await t.frames(40);
        for (const k of ["drwal", "uchodzca"]) {
            if (await t.eval(`!!TownLife.eventOf("${k}") && !TownLife.eventOf("${k}")._town.hidden`)) await quietTalk(ev(k), ["Zgłoś się"]);
            else await fx(k, "help");
        }
        const r1 = await rec("D26"), g1 = await t.gold(), f = await flags();
        t.check("Bartek ostrzeżony, Zbych i Darin namówieni: +10 G za każdego, D26 wykonane (3/3)",
            g1 - g0 === 20 && r1 && r1.s === "done" && (await t.eval(`TownLife.gone("drwal") && TownLife.gone("uchodzca") && TownLife.gone("bartek")`)) && !!f.d26Wzieci && !!f.d26Ostrzezeni, { g0, g1, r1 });
        await t.setDay(12, 10);
        await t.go(PODG, 45, 45, 8); await t.frames(40);
        const se = await t.json(`[660, 661].map(id => { const e = $gameMap.event(id); return e ? !(e._garn && e._garn.hidden) : null; })`);
        t.check("dzień po ostrzeżeniu: strażnicy przeszukują Podgrodzie (660-661)", se.every(Boolean), se);
        await t.go(DWOR, 72, 30, 8); await t.frames(40);
        const rk = await t.json(`[648, 649, 650].map(id => { const e = $gameMap.event(id); return e ? [!(e._garn && e._garn.hidden), e.x, e.y] : null; })`);
        await t.shot("../docs/straz_dworu/rekruci.png");
        t.check("rekruci (Zbych, Darin) ćwiczą na placu ćwiczeń dworu (wybieg za stajnią); Bartek (ukryty) - nie", rk[0][0] === false && rk[1][0] && rk[2][0] && rk[1][0] && rk[1][1] >= 68 && rk[1][1] <= 76, rk);
    }

    if (part("d27")) {
        await t.newGame({ map: PODG, x: 45, y: 45, dir: 8, hour: 10, day: 30, quiet: true, minimap: false });
        await t.eval("$gamePlayer.requestMapReload(); 0");
        await t.go(PODG, 45, 45, 8);
        await t.frames(40);
        const lud = await t.eval(`!!TownLife.eventOf("ludmila") && !TownLife.eventOf("ludmila")._town.hidden`);
        for (let k = 0; lud && k < 5 && !(await rec("D27")); k++) await quietTalk(ev("ludmila"), ["Zdobędę"]);
        if (!(await rec("D27"))) await t.eval(`TownQuests.start("D27"); 0`);
        const r0 = await rec("D27");
        t.check("D27 „Zboże dla obozu”: Ludmiła w Podgrodziu prosi o 4 worki (dzień 30)", r0 && r0.s === "active", { r0, lud });
        await t.go(DWOR, 60, 32, 8);
        await t.eval(`TownQuests.state().flags.garnizonPoznany = 1; Object.assign(Garnizon.state().met, { rotmistrz: 1, kwatermistrz: 1 }); TownQuests.finish("K52"); 0`);
        await t.frames(30);
        await t.gold(100);
        const dz = await quietTalk(ev("kwatermistrz"), ["Sprzedasz cztery worki"]);
        t.check("za dnia Kłos nie sprzedaje („Przyjdź po zmroku”)", /po zmroku/.test(dz.text) && (await t.eval("Garnizon.state().d27.bought")) === 0, dz.text.slice(-200));
        await t.setHour(20.5);
        await t.frames(60);
        await quietTalk(ev("kwatermistrz"), ["Sprzedasz cztery worki", "Biorę"]);
        await t.frames(30);
        const r1 = await rec("D27");
        t.check("nocą Kłos sprzedaje 4 worki za 60 G: krok 2 (zanieść Ludmile)", (await t.gold()) === 40 && r1.step === 1 && (await t.eval("TownQuests.vcount('worek_zboza')")) === 4, { r1, gold: await t.gold() });
        await t.setHour(10);
        await t.go(PODG, 45, 45, 8); await t.frames(30);
        if (lud && await t.eval(`!!TownLife.eventOf("ludmila") && !TownLife.eventOf("ludmila")._town.hidden`)) await quietTalk(ev("ludmila"), []);
        else await t.eval(`TownQuests.completeStep("D27"); 0`);
        const r2 = await rec("D27");
        t.check("worki u Ludmiły; krok 3: wydać Kłosa albo milczeć", r2.step === 2, r2);
        await t.go(DWOR, 39, 30, 8); await t.frames(30);
        await bezPatrolu();
        const fvA = await favor();
        const acc = await quietTalk(ev("rotmistrz"), ["Kwatermistrz sprzedaje"]);
        await t.frames(30);
        const r3 = await rec("D27"), f = await flags(), gone = await t.eval(`TownLife.gone("kwatermistrz")`);
        t.check("Kłos wydany kapitanowi przy bramie dworu: D27 wykonane, flaga klosWydany, Kłos znika, przychylność +15",
            r3.s === "done" && !!f.klosWydany && gone && (await favor()) - fvA === 15 && /kapitanie/.test(acc.text), { r3, gone, fvA, favor: await favor(), t: acc.text.slice(-200) });

        // the other way: the grain cart at night, caught by the sentry -> a night in the guardhouse's lockup
        await t.newGame({ map: DWOR, x: 60, y: 33, dir: 8, hour: 23, day: 31, quiet: true, minimap: false });
        await t.eval(`TownQuests.start("D27"); 0`);
        await t.frames(60);
        await t.eval(`(function(){ const e = $gameMap.event(643); e.locate(62, 33); e.setDirection(8); e._garn.wait = 9999; return 0; })()`);
        await t.eval("$gamePlayer.locate(63, 32); $gamePlayer.setDirection(8); 0");
        await t.eval(`$gameMap.event(Garnizon.DATA.GRANARY.id).start(); 0`);
        await t.frames(30);
        for (let k = 0; k < 8; k++) { await t.dismiss(40); await t.frames(30); if (await t.eval(t.onMap(DWOR) + " && " + t.idle)) break; }
        const st = await t.json("[$gameSystem.dayNightDay(), Math.floor($gameSystem.dayNightHour()), $gamePlayer.x, $gamePlayer.y, Garnizon.favor(), TownQuests.vcount('worek_zboza'), Garnizon.state().d27.caught]");
        t.check("złapany przy wozie ze zbożem: noc w areszcie wartowni - rano 7:00 pod jej drzwiami (48,31), worki zostają, przychylność -15",
            st[0] === 32 && st[1] === 7 && st[2] === 48 && st[3] === 31 && st[4] === 5 && st[5] === 0 && st[6] === 1, st);
        await t.setHour(10);
        await t.go(DWOR, 20, 41, 4);
        await t.frames(60);
        const pt = await t.json(`(function(){ const e = $gameMap.event(652); return e ? [!(e._garn && e._garn.hidden), e.x, e.y] : null; })()`);
        t.check("przychylność poniżej 10: patrol na drodze dworu (zdarzenie 652, 14,41) zatrzymuje bohatera", (pt && pt[0]) || (await t.eval("Garnizon.state().patrolDay")) === 32, pt);
    }

    if (part("koniec")) {
        await t.newGame({ map: MIASTO, x: 44, y: 23, dir: 8, hour: 10, day: 3, quiet: true, minimap: false });
        const def = await t.json(`(function(){ const d = Act3Data.DEFENDERS.filter(x => /^garnizon/.test(x.key)); Garnizon.state().favor = 85;
            const on = d.map(x => x.when({ bell: true })), off = d.map(x => x.when({ bell: false })); Garnizon.state().favor = 50; const low = d.map(x => x.when({ bell: true }));
            return { n: d.length, on, off, low, name: d.map(x => x.name) }; })()`);
        t.check("Akt III: dwóch strażników Lorda wśród obrońców tawerny - tylko po alarmie i przy przychylności 80+",
            def.n === 2 && def.on.every(Boolean) && !def.off.some(Boolean) && !def.low.some(Boolean) && def.name.every(n => /Strażnik Lorda/.test(n)), def);
        const fd = await t.json(`(function(){ let d = 4; while (!TownQuests.isFerry(d)) d++; return d; })()`);
        await t.setDay(fd, 23.5);
        await t.eval("$gamePlayer.requestMapReload(); 0");
        await t.go(MIASTO, 51, 23, 8);
        await t.frames(40);
        const kn1 = await t.json(`(function(){ const e = $gameMap.event(659); return e ? [e.x, e.y, !(e._garn && e._garn.hidden)] : null; })()`);
        await t.setHour(12);
        await t.frames(40);
        const kn2 = await t.json(`(function(){ const e = $gameMap.event(659); return e ? !(e._garn && e._garn.hidden) : null; })()`);
        t.check("Kłos w noc po promie (23-1) przy tylnych drzwiach kantoru w Kruczogrodzie (zdarzenie 659 przy 51,21), za dnia nie",
            kn1 && kn1[0] === 51 && kn1[1] === 21 && kn1[2] && kn2 === false, { fd, kn1, kn2 });
    }
});
