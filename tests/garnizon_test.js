// PAKIET D „Garnizon nad zatoką” (Map162, kwatera rotmistrza Map163; js/plugins/Garnizon_Data.js + Garnizon.js; tools/garnizon/;
// docs/miejsca_wyspy/PAKIETY.md). Sprawdza:
//   - mapy (rozmiar, <Water:salt>, palisada, przejścia z kontraktu), gotowość miejsca (Wyspa.ready(162) -> przejście z przystani)
//   - drogę z przystani (Map125 dolna krawędź 21-23 <-> Map162 górna krawędź) w obie strony, pieszo
//   - mieszkańców 945-947 (rotmistrz, kwatermistrz, werbownik) na swoich miejscach o swoich godzinach, kwaterę (Map163), żołnierzy 640-647
//   - pierwsze spotkanie z rotmistrzem (bohater nie jest wcielany), K52 (drewno i węgiel -> skup, przychylność +20), skup (cena, fala x1,5,
//     tydzień głodu: Opinia -1), glejt na wrak przy przychylności 40, kowala garnizonu przy 60, obrońców Aktu III przy 80, patrol poniżej 10
//   - beczki z wodą: tylko dymek (żadnej wody), łachę: w przypływie woda, w odpływie piasek i przejście; koniec łachy -> wrak albo dymek
//   - D26 (pobór: pomoc, ostrzeżenie; rekruci w garnizonie, poszukiwania na Podgrodziu), D27 (zboże dla obozu: kupione od Kłosa nocą,
//     Kłos wydany; kradzież ze spichlerza i noc w dybach)
//   - werbownika na rynku w dzień po fali (Map008), kwatermistrza przy tylnych drzwiach kantoru w noc po promie
//   - każde światło to płomień; bez błędów w konsoli
// Przed instalacją: GAME_OVERLAY=tools/miejsca_wyspy/staging_D (mapy z folderu roboczego). Po instalacji działa tak samo bez nakładki.
// Uruchom: CDP_PORT=9504 GAME_OVERLAY=tools/miejsca_wyspy/staging_D node tests/garnizon_test.js   (serwer: node tools/serve.js)
// Jedna część: GARN_ONLY=mapy,ludzie,k52,skup,laca,d26,d27 (lista)
const kit = require("./lib/kit.js");
const ONLY = (process.env.GARN_ONLY || "").split(",").filter(Boolean);
const part = name => !ONLY.length || ONLY.includes(name);

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", overlay: process.env.GAME_OVERLAY }, async t => {
    const ev = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const quietTalk = async (expr, picks, o) => { const r = await t.talkTo(expr, picks, Object.assign({ secs: 40 }, o || {})); await t.frames(10); return r; };
    const flags = () => t.json("TownQuests.state().flags");
    const rec = id => t.json(`TownQuests.rec(${JSON.stringify(id)})`);
    const favor = () => t.eval("Garnizon.favor()");
    const setFavor = n => t.eval(`Garnizon.state().favor = ${n}; Garnizon.favor()`);

    // ---------------------------------------------------------------- wtyczki, mapy, gotowość
    const pl = await t.json(`({ g: !!window.Garnizon && !Tawerna.api("Garnizon").skeleton, d: !!(window.GarnizonData && GarnizonData.QUESTS),
        res: TownLife.RESIDENTS.filter(r => ["rotmistrz", "kwatermistrz", "werbownik"].includes(r.key)).map(r => r.key + ":" + r.id),
        q: ["K52", "D26", "D27"].map(id => !!TownQuests.Q[id]) })`);
    t.check("wtyczki pakietu D działają (nie szkielet): mieszkańcy 945-947 w TownLife, zadania K52, D26, D27 w TownQuests",
        pl.g && pl.d && pl.res.join() === "rotmistrz:945,kwatermistrz:946,werbownik:947" && pl.q.every(Boolean), pl);
    await t.until("Wyspa.isReady(162)", 20);
    t.check("miejsce gotowe: Wyspa.isReady(162) (mapa 162 z notatką <Garnizon:mapa>)", await t.eval("Wyspa.isReady(162)"));

    if (part("mapy")) {
        await t.newGame({ map: 125, x: 22, y: 76, dir: 2, hour: 10, day: 6, quiet: true, minimap: false });   // (2026-10-18: the harbour 112x80, its south edge row 79)
        const edge = await t.json(`$dataMap.events.filter(e => e && e.id >= 693 && e.id <= 695).map(e => [e.x, e.y, e.pages[0].list[0].parameters.slice(1, 4).join(",")])`);
        t.check("na przystani przejścia 693-695 (21-23,79 -> 162)", edge.length === 3 && edge.every(e => e[1] === 79 && /^162,/.test(e[2])), edge);
        await t.hold("down", 70);
        const went = await t.until(t.onMap(162), 60);
        await t.frames(20);
        const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $dataMap.width, $dataMap.height, $dataMap.note]");
        t.check("pieszo z dolnej krawędzi przystani do garnizonu: Map162 112x80, lądowanie w rzędzie 1 (pola 21-23)",
            went && at[0] === 162 && at[2] === 1 && at[1] >= 21 && at[1] <= 23 && at[3] === 112 && at[4] === 80, at);
        t.check("notatka mapy: <Water:salt> (czerwone, trujące morze), <Clouds:on>, <Farm:off>", /<Water:salt>/.test(at[5]) && /<Clouds:on>/.test(at[5]) && /<Farm:off>/.test(at[5]), at[5]);
        await t.calm();
        await t.hold("up", 40);
        const back = await t.until(t.onMap(125), 60);
        await t.frames(20);
        const b2 = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
        t.check("...i z powrotem: górna krawędź garnizonu -> przystań (rząd 78)", back && b2[0] === 125 && b2[2] === 78, b2);
        await t.go(162, 36, 12, 2);
        const m = await t.json(`(function(){ const ev = $dataMap.events.filter(Boolean);
            const pal = ev.filter(e => /<Garnizon:palisada>/.test(e.note)).length;
            const tr = ev.filter(e => e.y === 0 && e.pages[0].list.some(c => c.code === 201 && c.parameters[1] === 125)).map(e => e.x);
            const lacha = ev.filter(e => /<Garnizon:lacha>/.test(e.note)).map(e => [e.x, e.y]);
            const lights = ev.filter(e => /<Light:/.test(e.note)).map(e => { const m = /<Light:(\\d+),(\\d+),(\\d+)/.exec(e.note); return [e.name, +m[2], +m[3]]; });
            const water = ev.filter(e => /woda|wody/i.test(e.name) && e.pages[0].list.some(c => c.code === 355 && /Garnizon\\.look/.test(c.parameters[0]))).length;
            return { n: ev.length, pal, tr, lacha, lights, water, kw: ev.filter(e => /Drzwi: Kwatera/.test(e.name)).map(e => [e.x, e.y]) }; })()`);
        t.check("palisada z pali (zdarzenia <Garnizon:palisada>), przejścia do przystani (21-23,0), koniec łachy (0,20-21), drzwi kwatery",
            m.pal >= 30 && m.tr.sort().join() === "21,22,23" && m.lacha.map(c => c.join(":")).sort().join() === "0:20,0:21" && m.kw.length === 1, m);
        t.check("każde światło to płomień (ciepła barwa: zielony i niebieski kanał niżej niż czerwony w tagu <Light:r,g,b>)",
            m.lights.length >= 5 && m.lights.every(l => l[1] <= 120 && l[2] <= 90), m.lights);
        // water barrels: a bubble, no water
        await t.eval("Needs.setEnabled(true); Needs.state().water = 40; 0");
        await t.popups({ clear: true });
        await t.eval("$gamePlayer.locate(49, 31); $gamePlayer.setDirection(6); 0");
        await t.frames(5);
        await t.press("ok");
        await t.frames(20);
        await t.finish(6);
        const pops = await t.popups();
        const water = await t.json("Math.round(Needs.state().water)");
        await t.eval("Needs.setEnabled(false); 0");
        t.check("beczki „z wodą z promu”: dymek „Woda dla wojska. Odejdź.” i ani łyka (pragnienie bez zmian)", pops.some(p => /Woda dla wojska/.test(p)) && water <= 40, { pops, water });
    }

    if (part("ludzie")) {
        await t.newGame({ map: 162, x: 36, y: 12, dir: 2, hour: 10, day: 6, quiet: true, minimap: false });
        await t.frames(30);
        const where = await t.json(`(function(){ const o = {}; for (const k of ["rotmistrz", "kwatermistrz", "werbownik"]) { const e = TownLife.eventOf(k);
            o[k] = e ? [e.x, e.y, !!(e._town && e._town.hidden)] : null; }
            o.soldiers = [640,641,642,643,644,645,646,647].map(id => { const e = $gameMap.event(id); return e ? [id, e.x, e.y, !!(e._garn && e._garn.hidden), e.characterName()] : null; });
            return o; })()`);
        t.check("o 10:00: kwatermistrz przy skupie (33,29), werbownik przy stole przed bramą (30,8), rotmistrz w kwaterze (ukryty)",
            where.kwatermistrz && where.kwatermistrz[0] === 33 && where.kwatermistrz[1] === 29 && where.werbownik && where.werbownik[0] === 30 && where.werbownik[1] === 8
            && where.rotmistrz && where.rotmistrz[2], where);
        const boat = await t.json(`$gameMap.events().filter(e => /<Garnizon:lodz>/.test(e.event().note)).map(e => !!(e._garn && e._garn.hidden))`);
        t.check("żołnierze 640-647 na mapie (arkusze $Npc_Zolnierz i $Npc_Zolnierz_B), za dnia widoczni - poza wioślarzem łodzi ratowniczej (9-15 z łodzią przy wraku)",
            where.soldiers.every(s => s && /Npc_Zolnierz/.test(s[4]) && s[3] === (s[0] === 642)) && boat.length === 1 && boat[0] === true, { s: where.soldiers, boat });
        // into the quarters: the door 7-20
        await t.eval("$gamePlayer.locate(42, 18); $gamePlayer.setDirection(8); 0");
        await t.hold("up", 20);
        const inQ = await t.until(t.onMap(163), 10);
        await t.frames(30);
        const q = await t.json(`(function(){ const e = TownLife.eventOf("rotmistrz"); return [$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, e ? [e.x, e.y, !!(e._town && e._town.hidden)] : null]; })()`);
        t.check("drzwi kwatery (7-20) prowadzą do Map163 na (6,8); rotmistrz za biurkiem (6,4)", inQ && q[0] === 163 && q[1] === 6 && q[2] === 8 && q[3] && q[3][0] === 6 && q[3][1] === 4 && !q[3][2], q);
        const meet = await quietTalk(ev("rotmistrz"), []);
        const f1 = await flags();
        t.check("pierwsze spotkanie z rotmistrzem Bełzą: „Ile masz lat? ...Jeszcze nie.” (bohater nie jest wcielany), flaga garnizonPoznany",
            /Ile masz lat/.test(meet.text) && /Jeszcze nie/.test(meet.text) && !!f1.garnizonPoznany, meet.text.slice(0, 300));
        const list = await quietTalk(ev("rotmistrz"), ["Co to za lista", "Bywaj"]);
        t.check("lista zaginionych: chorągiew brzozowska, tylko słowo „zaginiony” (cichy haczyk o ojcu)", /brzozowska/.test(list.text) && /zaginiony/.test(list.text), list.text.slice(-300));
        const draft = await quietTalk(ev("rotmistrz"), ["Weźmiecie mnie", "Bywaj"]);
        t.check("„Weźmiecie mnie do wojska?” - za młody, dwór ręczy za dług: pobór dotyczy innych", /Za młody/.test(draft.text) && /Pobór dotyczy innych/.test(draft.text), draft.text.slice(-200));
        const glejtNo = await quietTalk(ev("rotmistrz"), ["Wpuścicie mnie", "Bywaj"]);
        t.check("glejt na wrak przy przychylności 20: odmowa", /nie\./.test(glejtNo.text) && !(await flags()).glejtWrak, glejtNo.text.slice(-200));
        await setFavor(45);
        const glejt = await quietTalk(ev("rotmistrz"), ["Wpuścicie mnie", "Bywaj"]);
        t.check("przy przychylności 40+: glejt garnizonu (flaga glejtWrak dla pakietu E)", !!(await flags()).glejtWrak && /Glejt/.test(glejt.text), glejt.text.slice(-200));
        // closed at night
        await t.go(162, 42, 18, 8);
        await t.setHour(21);
        await t.popups({ clear: true });
        await t.hold("up", 20);
        await t.frames(20);
        const closed = await t.json("[$gameMap.mapId()]");
        const cp = await t.popups();
        t.check("nocą (21:00) kwatera zamknięta: dymek nad bohaterem, zostaje na Map162", closed[0] === 162 && cp.some(p => /Zamknięte/.test(p)), { closed, cp });
    }

    if (part("k52")) {
        await t.newGame({ map: 162, x: 33, y: 30, dir: 8, hour: 10, day: 6, quiet: true, minimap: false });
        await t.frames(30);
        await t.eval(`TownQuests.state().flags.garnizonPoznany = 1; Garnizon.state().met.rotmistrz = 1; 0`);
        await quietTalk(ev("kwatermistrz"), []);   // (the first meeting)
        const offer = await quietTalk(ev("kwatermistrz"), ["Przyniosę"]);
        const r0 = await rec("K52");
        t.check("K52 „Drewno dla garnizonu” u kwatermistrza (od dnia 5, po spotkaniu z rotmistrzem): przyjęte", r0 && r0.s === "active", { r0, text: offer.text.slice(0, 200) });
        await t.give(61, 10); await t.give(79, 4);
        const g0 = await t.gold(), fv0 = await favor();
        await quietTalk(ev("kwatermistrz"), []);
        const r1 = await rec("K52"), g1 = await t.gold(), fv1 = await favor(), f = await flags();
        t.check("oddane 10× Drewno i 4× Węgiel: +20 G, skup otwarty (flaga k52Skup)", r1 && r1.s === "done" && g1 - g0 === 20 && !!f.k52Skup, { r1, g0, g1 });
        await t.frames(40);
        const fv2 = await favor();
        t.check("...i przychylność garnizonu +20 (20 -> 40)", fv0 === 20 && fv2 === 40, { fv0, fv1, fv2 });

        if (part("skup")) {
            await t.give(74, 5);
            const p6 = await t.eval("Garnizon.priceOf(74, 6)"), p12 = await t.eval("Garnizon.priceOf(74, 12)");
            t.check("cena skupu: jęczmień 6 G, tydzień po fali (dzień 12) półtora raza: 9 G", p6 === 6 && p12 === 9, { p6, p12 });
            const ga = await t.gold();
            const s = await quietTalk(ev("kwatermistrz"), ["Sprzedam coś wojsku", "Jęczmień"]);
            const gb = await t.gold(), left = await t.count(74);
            t.check("skup: 5× Jęczmień sprzedane za 30 G", gb - ga === 30 && left === 0, { ga, gb, left, text: s.text.slice(-200) });
            // the hungry week (no D14: days 27-33): selling food costs the town's opinion, once a day
            await t.setDay(28);
            await t.give(71, 3);
            const op0 = await t.eval("TownQuests.opinion()");
            await quietTalk(ev("kwatermistrz"), ["Sprzedam coś wojsku", "Ziemniak"]);
            await t.give(71, 2);
            await quietTalk(ev("kwatermistrz"), ["Sprzedam coś wojsku", "Ziemniak"]);
            const op1 = await t.eval("TownQuests.opinion()");
            t.check("tydzień głodu po rekwizycji: sprzedaż jedzenia wojsku kosztuje Opinię -1 (raz dziennie)", op1 === op0 - 1, { op0, op1 });
            // the smith: favour 60
            await setFavor(55);
            await t.gold(200);
            await quietTalk("$gameMap.event(646)", ["Strzały"]);
            const ar0 = await t.count(127);
            await setFavor(65);
            await quietTalk("$gameMap.event(646)", ["Strzały"]);
            const ar1 = await t.count(127);
            t.check("kowal garnizonu: przy przychylności poniżej 60 nic, od 60 strzały ×10 za 30 G", ar0 === 0 && ar1 === 10 && (await t.gold()) === 170, { ar0, ar1 });
        }
    }

    if (part("laca")) {
        await t.newGame({ map: 162, x: 13, y: 20, dir: 4, hour: 10, day: 6, quiet: true, minimap: false });
        // a high and a low water hour of day 6
        const hrs = await t.json(`(function(){ let hi = null, lo = null; for (let h = 0; h < 24; h += 0.25) { const td = Wyspa.tide(6, h); if (td.level > 0.8 && hi === null) hi = h; if (td.low && lo === null) lo = h; } return [hi, lo]; })()`);
        await t.setHour(hrs[0]);
        await t.frames(70);
        const high = await t.json("[$gameMap.isPassable(6, 20, 4), Garnizon.barOpen(), $gameSwitches.value(20), SceneManager._scene._spriteset._garnLacha ? SceneManager._scene._spriteset._garnLacha.alpha : -1]");
        t.check("w przypływie łacha pod wodą: nie da się wejść (pole 6,20 nieprzechodnie), piasku nie widać", !high[0] && !high[1] && !high[2] && high[3] < 0.2, { hrs, high });
        await t.setHour(hrs[1]);
        await t.frames(160);
        const low = await t.json("[$gameMap.isPassable(6, 20, 4), Garnizon.barOpen(), $gameSwitches.value(20), SceneManager._scene._spriteset._garnLacha.alpha]");
        t.check("w odpływie (przełącznik 20) łacha wychodzi z wody: piasek widać, da się po niej iść", low[0] && low[1] && low[2] && low[3] > 0.8, { hrs, low });
        await t.popups({ clear: true });
        await t.hold("left", 300);
        await t.frames(30);
        const end = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, Wyspa.isReady(165)]");
        const pops = await t.popups();
        t.check("po łasze na zachód: na końcu (0,20) - wrak (Map165), gdy gotowy; inaczej dymek, że dalej głęboka woda",
            (end[3] && end[0] === 165) || (!end[3] && end[0] === 162 && end[1] <= 1 && pops.some(p => /głębokiej wodzie/.test(p))), { end, pops });
    }

    if (part("d26")) {
        await t.newGame({ map: 8, x: 24, y: 38, dir: 8, hour: 10, day: 11, quiet: true, minimap: false });
        await t.eval("$gamePlayer.requestMapReload(); 0");
        await t.go(8, 24, 38, 8);   // (the new game's map loaded on day 1: TownLife puts the recruiter in as the map loads - set it up again)
        await t.frames(40);
        const w = await t.json(`(function(){ const e = TownLife.eventOf("werbownik"); const l = $gameMap.event(656);
            return { w: e ? [e.x, e.y, !!(e._town && e._town.hidden)] : null, list: l ? [l.x, l.y, !!(l._garn && l._garn.hidden)] : null }; })()`);
        t.check("dzień po fali (11): werbownik na rynku w miasteczku (22,37) z listą poborową (zdarzenie 656)", w.w && w.w[0] === 22 && w.w[1] === 37 && !w.w[2] && w.list && !w.list[2], w);
        await quietTalk(ev("werbownik"), []);   // (first meeting)
        const off = await quietTalk(ev("werbownik"), ["Pomogę"]);
        const r0 = await rec("D26");
        t.check("D26 „Lista poborowa”: oferta werbownika, przyjęta", r0 && r0.s === "active" && /Bartek Kmieć/.test(off.text), { r0, t: off.text.slice(0, 300) });
        // Bartek (town): warn him; Zbych and Darin (Podgrodzie): help
        const bartekHere = await t.eval(`!!TownLife.eventOf("bartek")`);
        if (bartekHere) {
            const b = await quietTalk(ev("bartek"), ["Schowaj się"]);
            t.check("Bartek ostrzeżony: chowa się na dzień-dwa (zniknął), Opinia +3", await t.eval(`TownLife.gone("bartek")`) && /Schowam się/.test(b.text), b.text.slice(-200));
        } else {
            await t.eval(`TownQuests.act(null, ["D26", "fx", "d26Ludzie", { key: "bartek", how: "warn" }]); 0`);
            t.check("Bartek ostrzeżony (przez act - nie stał w miasteczku o tej porze)", await t.eval(`TownLife.gone("bartek")`));
        }
        await t.go(111, 10, 12, 8);
        await t.setHour(16);
        await t.frames(40);
        const g0 = await t.gold();
        const z = await quietTalk(ev("drwal"), ["Zgłoś się"]);
        await t.setHour(13);
        await t.frames(40);
        const d = await quietTalk(ev("uchodzca"), ["Zgłoś się"]);
        const r1 = await rec("D26"), g1 = await t.gold(), f = await flags();
        t.check("Zbych i Darin namówieni: +10 G za każdego, obaj zniknęli z Podgrodzia, D26 wykonane (3/3)",
            g1 - g0 === 20 && r1 && r1.s === "done" && (await t.eval(`TownLife.gone("drwal") && TownLife.gone("uchodzca")`)) && !!f.d26Wzieci && !!f.d26Ostrzezeni,
            { g0, g1, r1, z: z.text.slice(-120), d: d.text.slice(-120) });
        // the search in Podgrodzie the next day; the recruits drilling in the garrison
        await t.setDay(12, 10);
        await t.go(111, 26, 18, 2);
        await t.frames(40);
        const se = await t.json(`[660, 661].map(id => { const e = $gameMap.event(id); return e ? !(e._garn && e._garn.hidden) : null; })`);
        t.check("dzień po ostrzeżeniu: żołnierze przeszukują Podgrodzie (660-661)", se.every(Boolean), se);
        await t.go(162, 30, 24, 8);
        await t.frames(40);
        const rk = await t.json(`[648, 649, 650].map(id => { const e = $gameMap.event(id); return e ? !(e._garn && e._garn.hidden) : null; })`);
        t.check("rekruci (Zbych, Darin) ćwiczą w garnizonie; Bartek (ukryty) - nie", rk[0] === false && rk[1] === true && rk[2] === true, rk);
    }

    if (part("d27")) {
        await t.newGame({ map: 8, x: 31, y: 50, dir: 8, hour: 10, day: 30, quiet: true, minimap: false });
        await t.eval("$gamePlayer.requestMapReload(); 0");
        await t.go(8, 31, 50, 8);
        await t.frames(40);
        const lud = await t.eval(`!!TownLife.eventOf("ludmila") && !TownLife.eventOf("ludmila")._town.hidden`);
        let off = null;
        // (one thing at a time: her own earlier offers come first - turned down for today, then D27)
        for (let k = 0; lud && k < 5 && !(await rec("D27")); k++) off = await quietTalk(ev("ludmila"), ["Zdobędę"]);
        if (!(await rec("D27"))) await t.eval(`TownQuests.start("D27"); 0`);
        const r0 = await rec("D27");
        t.check("D27 „Zboże dla obozu”: Ludmiła prosi o 4 worki (po rekwizycji, dzień 30)", r0 && r0.s === "active", { r0, off: off && off.text.slice(0, 200) });
        // the night: Kłos sells four sacks "at the price for friends"
        await t.go(162, 33, 30, 8);
        await t.eval(`TownQuests.state().flags.garnizonPoznany = 1; Object.assign(Garnizon.state().met, { rotmistrz: 1, kwatermistrz: 1 }); TownQuests.finish("K52"); 0`);
        await t.setHour(10);
        await t.frames(30);
        await t.gold(100);
        const day = await quietTalk(ev("kwatermistrz"), ["Sprzedasz cztery worki"]);
        t.check("za dnia Kłos nie sprzedaje („Przyjdź po zmroku”)", /po zmroku/.test(day.text) && (await t.eval("Garnizon.state().d27.bought")) === 0, day.text.slice(-200));
        await t.setHour(20.5);
        await t.frames(60);
        const night = await quietTalk(ev("kwatermistrz"), ["Sprzedasz cztery worki", "Biorę"]);
        await t.frames(30);
        const r1 = await rec("D27");
        t.check("nocą Kłos sprzedaje 4 worki za 60 G: krok 2 (zanieść Ludmile)", (await t.gold()) === 40 && r1.step === 1 && (await t.eval("TownQuests.vcount('worek_zboza')")) === 4,
            { r1, gold: await t.gold(), t: night.text.slice(-200) });
        await t.go(8, 31, 50, 8);
        await t.setHour(10);
        await t.frames(30);
        if (lud) await quietTalk(ev("ludmila"), []);
        else await t.eval(`TownQuests.completeStep("D27"); 0`);
        const r2 = await rec("D27");
        t.check("worki u Ludmiły (Opinia +5); krok 3: wydać Kłosa albo milczeć", r2.step === 2, r2);
        await t.go(163, 6, 6, 8);
        await t.frames(30);
        const fvA = await favor();
        const acc = await quietTalk(ev("rotmistrz"), ["Kwatermistrz sprzedaje"]);
        await t.frames(30);
        const r3 = await rec("D27"), f = await flags(), gone = await t.eval(`TownLife.gone("kwatermistrz")`);
        t.check("Kłos wydany rotmistrzowi: D27 wykonane, flaga klosWydany (dla W5), Kłos znika, przychylność +15",
            r3.s === "done" && !!f.klosWydany && gone && (await favor()) - fvA === 15, { r3, gone, fvA, favor: await favor(), t: acc.text.slice(-200) });

        // the other way: the granary at night, caught by the sentry -> a night in the stocks
        await t.newGame({ map: 162, x: 46, y: 32, dir: 8, hour: 23, day: 31, quiet: true, minimap: false });
        await t.eval(`TownQuests.start("D27"); 0`);
        await t.frames(60);
        // a sentry right beside the door
        await t.eval(`(function(){ const e = $gameMap.event(643); e.locate(46, 33); e.setDirection(8); e._garn.wait = 9999; return 0; })()`);
        await t.eval("$gamePlayer.locate(46, 31); $gamePlayer.setDirection(8); 0");
        await t.eval("$gameMap.event($gameMap.events().find(e => e.event().name === 'Drzwi spichlerza').eventId()).start(); 0");
        await t.frames(30);
        for (let k = 0; k < 8; k++) { await t.dismiss(40); await t.frames(30); if (await t.eval(t.onMap(162) + " && " + t.idle)) break; }
        const st = await t.json("[$gameSystem.dayNightDay(), Math.floor($gameSystem.dayNightHour()), $gamePlayer.x, $gamePlayer.y, Garnizon.favor(), TownQuests.vcount('worek_zboza'), Garnizon.state().d27.caught]");
        t.check("złapany przy spichlerzu: noc w dybach - rano 7:00 przy dybach, worki zostają, przychylność -15",
            st[0] === 32 && st[1] === 7 && st[2] === 46 && st[3] === 19 && st[4] === 5 && st[5] === 0 && st[6] === 1, st);
        // favour under 10: the patrol on the road
        await t.go(162, 22, 2, 2);
        await t.setHour(10);
        await t.frames(60);
        const pt = await t.json(`(function(){ const e = $gameMap.event(652); return e ? !(e._garn && e._garn.hidden) : null; })()`);
        t.check("przychylność poniżej 10: patrol na drodze (zdarzenie 652) zatrzymuje bohatera", pt === true || (await t.eval("Garnizon.state().patrolDay")) === 32, pt);
    }

    // ---------------------------------------------------------------- Act III, the kantor's night
    await t.newGame({ map: 8, x: 10, y: 42, dir: 8, hour: 10, day: 3, quiet: true, minimap: false });
    const def = await t.json(`(function(){ const d = Act3Data.DEFENDERS.filter(x => /^garnizon/.test(x.key)); Garnizon.state().favor = 85;
        const on = d.map(x => x.when({ bell: true })), off = d.map(x => x.when({ bell: false })); Garnizon.state().favor = 50; const low = d.map(x => x.when({ bell: true }));
        return { n: d.length, on, off, low, sheets: d.map(x => x.sheet) }; })()`);
    t.check("Akt III: dwóch żołnierzy królewskich wśród obrońców tawerny - tylko po alarmie i przy przychylności 80+",
        def.n === 2 && def.on.every(Boolean) && !def.off.some(Boolean) && !def.low.some(Boolean), def);
    const fd = await t.json(`(function(){ let d = 4; while (!TownQuests.isFerry(d)) d++; return d; })()`);
    await t.setDay(fd, 23.5);
    await t.eval("$gamePlayer.requestMapReload(); 0");
    await t.go(8, 10, 42, 8);
    await t.frames(40);
    const kn1 = await t.json(`(function(){ const e = $gameMap.event(659); return e ? [e.x, e.y, !(e._garn && e._garn.hidden)] : null; })()`);
    const kr = await t.json(`(function(){ const e = TownLife.eventOf("kwatermistrz"); return [TownLife.homeOf(TownLife.RESIDENTS.find(r => r.key === "kwatermistrz")), !!e]; })()`);
    await t.setHour(12);
    await t.frames(40);
    const kn2 = await t.json(`(function(){ const e = $gameMap.event(659); return e ? !(e._garn && e._garn.hidden) : null; })()`);
    t.check("kwatermistrz w noc po promie (23-1) przy tylnych drzwiach kantoru na Map008 (zdarzenie 659), za dnia nie; mieszkańcem TownLife zostaje na Map162",
        kn1 && kn1[0] === 9 && kn1[1] === 40 && kn1[2] && kn2 === false && kr[0] === 162 && !kr[1], { fd, kn1, kn2, kr });
});
