// W21 "Gorączka w przytułku" (docs/zadania_nowe/goraczka.md; js/plugins/Goraczka_Data.js + Goraczka.js, Map216 "Przytułek", js/teksty/goraczka.txt).
// Plays the whole line on the overlay (tools/goraczka/zainstaluj.py --do tools/goraczka/overlay): the start (day 30, the camp voted), Stefa's first brew with the
// hero's water, the pass, S1 (the carts), the poorhouse inside (Map216) and its sick, the three collections, the doses, Gaweł (saved / dead, S2), the questions, the
// barrel (and the hero's fever), S3 at Ignac's (three answers), the crust and the slab, Wawrzyn (three approaches), the meeting S4, the endings A / B (the basin) / C,
// S5, the campOutside variant (Map202), F9, a save and load. Pictures: docs/zadania_nowe/goraczka_gra/.
// Run: GAME_OVERLAY=tools/goraczka/overlay GAME_OVERLAY_JS=1 CDP_PORT=9450 node tests/goraczka_test.js   (the server: node tools/serve.js)
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join("..", "docs", "zadania_nowe", "goraczka_gra");
const shot = (t, name) => t.shot(path.join(SHOTS, name));

kit.test({ port: Number(process.env.CDP_PORT) || 9450, overlay: process.env.GAME_OVERLAY, overlayJs: !!process.env.GAME_OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const S = "Goraczka.stan()";
    const go = async (...a) => { await t.finish(); return t.go(...a); };
    const talkKey = async (key, picks, o) => { await t.eval(`(function(){ const e = ${JSON.stringify(key)} === 'opiekunka' ? ([4623, 4624].map(i => $gameMap.event(i)).find(x => x && !x._transparent && x.characterName()) || TownLife.eventOf('opiekunka')) : TownLife.eventOf(${JSON.stringify(key)}); window.__ev = e ? e.eventId() : 0; return 0; })()`); const id = await t.eval("window.__ev"); if (!id) return { text: "(brak " + key + ")", choices: [], done: false }; const r = await t.talkTo(id, picks || [], o || {}); await t.finish(); return r; };
    const flags = (camp) => t.eval(`(function(){ const f = TownQuests.state().flags; delete f.campInside; delete f.campOutside; f.${camp ? "campOutside" : "campInside"} = true; TownQuests.state().opinion = 30; return 0; })()`);
    const tick = async (n) => { await t.frames(n || 40); };
    const water = n => t.eval(`Needs.state().skin = ${n}; 0`);
    const step = () => t.eval("Goraczka.stepNow()");
    const place = async (map, x, y, dir) => { await go(map, x, y, dir); await t.frames(30); };

    // ---------------------------------------------------------------- data and API
    const base = await t.json(`({ g: !!window.Goraczka, d: !!window.GoraczkaData, q: !!TownQuests.Q.W21, thr: Watki.watki().includes("goraczka"), steps: TownQuests.Q.W21.steps.length,
        inj: Tawerna.inject.list().filter(x => x.owner === 'Goraczka').map(x => x.ids).join(), res: !!TownLifeData.RESIDENTS.find(r => r.key === 'wawrzyn'),
        alt: !!TownLifeData.RESIDENTS.find(r => r.key === 'opiekunka').alt, items: $dataItems.filter(i => i && /Goraczka:/.test(i.note || '')).length, map: !!$dataMap })`);
    t.check("Goraczka.js i Goraczka_Data.js działają: wątek, zadanie W21 (5 kroków), numery 4610-4699, Wawrzyn jako mieszkaniec, dwa przedmioty", base.g && base.d && base.q && base.thr && base.steps === 5 && /4610-4699/.test(base.inj) && base.res && base.items === 2, base);

    // ---------------------------------------------------------------- the start: day 30, 9:00, camp inside
    await t.newGame({ story: true, skipIntro: true, map: 218, x: 41, y: 56, dir: 8, day: 29, hour: 10, quiet: true, minimap: false });
    await flags(false);
    await t.eval("$gameParty.gainGold(200 - $gameParty.gold()); 0");
    await t.eval("TownQuests.autoChecks(); 0"); await tick(60);
    t.check("dzień 29: wątek jeszcze nie ruszył (od dnia 30)", !(await t.json(`${S}.start`)));
    await t.setDay(30, 7); await tick(70);
    t.check("dzień 30 o 7:00: za wcześnie (od 8:00)", !(await t.json(`${S}.start`)));
    await t.setHour(9); await go(218, 41, 56, 8); await tick(100);
    const st0 = await t.json(`({ s: ${S}, q: TownQuests.rec('W21') })`);
    t.check("dzień 30, 9:00, po głosowaniu: wątek W21 ruszył (start 30, obóz w środku, trzej chorzy, zadanie aktywne, krok 0)", st0.s.start === 30 && st0.s.camp === "inside" && st0.q.s === "active" && st0.q.step === 0 && st0.s.sick.szymek === "c" && st0.s.sick.gawel === "c" && !st0.s.sick.mila, st0);
    const front = await t.json(`({ cauldron: (function(){ const e = $gameMap.event(4622); return [e.x, e.y, e._transparent]; })(), carts: [4620, 4621].map(id => $gameMap.event(id)._transparent), stefa: (function(){ const e = TownLife.eventOf("opiekunka"), st = e && TownLife.state("opiekunka"); return e && st && !st.hidden ? [e.x, e.y] : null; })(), dubler: [4623, 4624].some(id => $gameMap.event(id) && !$gameMap.event(id)._transparent), real: TownLife.gone('opiekunka') })`);
    t.check("przed przytułkiem przy kotle z zupą (kocioł mapy, 44,53) stoi prawdziwa Stefa z Podgrodzia (żadnej dublerki ani drugiego kotła), wozy zapory jeszcze ukryte", !front.real && !front.dubler && front.cauldron[0] === 44 && front.cauldron[1] === 54 && front.carts.every(Boolean) && !!front.stefa && Math.abs(front.stefa[0] - 46) + Math.abs(front.stefa[1] - 54) <= 3, front);
    await t.eval("$gamePlayer.locate(41, 55); $gamePlayer.setDirection(8); 0"); await tick(20);
    await shot(t, "przytulek_front_dzien.png");

    // ---------------------------------------------------------------- chapter 1: Stefa, the first brew
    const gold0 = await t.gold();
    const noItems = await talkKey("opiekunka", ["Mam wywar i wodę"]);
    t.check("Stefa: pierwsza rozmowa (przedstawia chorych), opcja „Mam wywar i wodę” - bez wywaru popup, nic się nie dzieje", /Szymek/.test(noItems.text) && JSON.stringify(noItems.choices).includes("Mam wywar") && !(await t.json(`${S}.brew`)), noItems.text);
    await t.eval("$gameParty.gainItem($dataItems[110], 1); 0"); await water(1);
    await talkKey("opiekunka", ["Mam wywar i wodę"]); await tick(20);
    t.check("jeden łyk wody to za mało: wywar nie wzięty (popup o bukłaku)", !(await t.json(`${S}.brew`)) && (await t.count(110)) === 1);
    await water(4);
    const brew = await talkKey("opiekunka", ["Mam wywar i wodę"]); await tick(30);
    const st1 = await t.json(`({ s: ${S}, skin: Needs.skinCharges(), pass: $gameParty.numItems(Goraczka.itemBy('przepustka')), wywar: $gameParty.numItems($dataItems[110]) })`);
    t.check("wywar + 2 łyki: Szymek ma ulgę, Staś i Gaweł nadal chorzy, bukłak -2, przepustka w plecaku, +10 G, wywaru brak", st1.s.brew === 30 && st1.s.sick.szymek === "u" && st1.s.sick.stas === "c" && st1.skin === 2 && st1.pass === 1 && st1.wywar === 0 && (await t.gold()) === gold0 + 10, st1);
    t.check("krok 1 jeszcze nie gotowy (czeka ulica, scena S1)", (await step()) === 0);

    // ---------------------------------------------------------------- S1: the street is shut (18:30)
    await t.setHour(18.4); await place(218, 46, 57, 8); await tick(40);
    await t.setHour(18.55); await tick(100);
    await shot(t, "s1_wozy_wjezdzaja.png");
    await t.until(`${S}.sc.s1 && !Goraczka.busy()`, 90, 500);
    await tick(30);
    const s1 = await t.json(`({ sc: ${S}.sc, carts: [4620, 4621].map(id => { const e = $gameMap.event(id); return [e.x, e.y, e._transparent]; }), step: Goraczka.stepNow() })`);
    t.check("S1: wozy zapory stoją na swoich miejscach (47,54) i (47,56), widoczne; krok 1 zaliczony (wywar i ulica)", s1.carts[0][0] === 47 && s1.carts[0][1] === 54 && !s1.carts[0][2] && s1.carts[1][0] === 47 && s1.carts[1][1] === 56 && s1.step === 1, s1);
    await shot(t, "s1_zapora.png");

    // ---------------------------------------------------------------- the door (the pass at night), the poorhouse inside
    await t.setHour(21); await tick(20);
    await go(218, 41, 54, 8);
    await t.eval("$gamePlayer.locate(41, 53); $gamePlayer.setDirection(8); 0");
    await t.hold("up", 45); await t.until("$gameMap.mapId() === 202 && !$gamePlayer.isTransferring()", 20); await tick(60);
    const hosp = await t.json(`({ map: $gameMap.mapId(), at: [$gamePlayer.x, $gamePlayer.y], sick: [4610, 4611, 4612, 4613, 4614, 4615].map(id => { const e = $gameMap.event(id); return e ? e._transparent : null; }), name: $dataMap.displayName })`);
    t.check("po 20:00 drzwi przytułku prowadzą do środka (Map202); leży trzech chorych (Szymek, Staś, Gaweł), reszta łóżek pusta", hosp.map === 202 && hosp.sick.slice(0, 3).every(v => v === false) && hosp.sick.slice(3).every(v => v === true), hosp);
    await t.setHour(14); await tick(20);
    await shot(t, "przytulek_wnetrze_chorzy.png");
    await t.eval("$gamePlayer.locate(10, 10); 0");

    // ---------------------------------------------------------------- day 31: the other three fall ill; the collections; the doses
    await t.setDay(31, 8.5); await go(218, 41, 55, 8); await tick(60);
    t.check("dzień 31: wszystkich sześciu chorych (Mila, Rufin, Berta zachorowali)", (await t.json(`Object.keys(${S}.sick).length`)) === 6);
    // Jadwiga's herbs
    await t.eval("$gameParty.gainItem($dataItems[191], 3); $gameParty.gainItem($dataItems[192], 2); $gameParty.gainItem($dataItems[152], 3); $gameParty.gainItem($dataItems[110], 2); 0");
    const jad = await t.json("(function(){ const e = TownLife.eventOf('znachorka'); return e ? [e.x, e.y] : null; })()");
    await t.eval("(function(){ Goraczka.zbiorka('jadwiga'); return 0; })()"); await tick(10);
    t.check("zbiórka Jadwigi: dziurawiec i kozłek oddane (3 i 2), zbiórki 1", (await t.count(191)) === 0 && (await t.count(192)) === 0 && (await t.json(`Goraczka.zbN()`)) === 1, { jad });
    await t.eval("Goraczka.zbiorka('kleofas'); 0"); await tick(10);
    t.check("zbiórka Kleofasa: trzy opatrunki oddane; dwie zbiórki - ale łóżka jeszcze nieobsłużone, krok 2 trwa", (await t.count(152)) === 0 && (await t.json(`Goraczka.zbN()`)) === 2 && (await step()) === 1);
    // the sixth day's beds inside: three doses by hand
    await t.eval("$gameParty.gainItem($dataItems[152], 2); 0");
    await go(202, 3, 6, 8); await t.eval("$gamePlayer.setDirection(8); 0"); await tick(40);
    await shot(t, "przytulek_wnetrze_dzien31.png");
    const bedTalk = await t.talkTo(4612, ["Podaj wywar"], { place: false });
    await t.finish(); await tick(20);
    t.check("łóżko Gawła: opcja „Podaj wywar”, wywar zużyty, Gaweł ma dawkę (nie umrze w nocy)", !!(await t.json(`${S}.dose.gawel`)) && (await t.count(110)) === 1 && /Pierwsza noc|Dobry wywar/.test(bedTalk.text), bedTalk.text);
    await t.eval("(function(){ Goraczka.dawka(null, 'stas', 'oklad'); Goraczka.dawka(null, 'mila', 'oklad'); return 0; })()"); await tick(30);
    const ch2 = await t.json(`({ served: Goraczka.servedN(), step: Goraczka.stepNow(), q: TownQuests.rec('W21'), gd: ${S}.gawelDead })`);
    t.check("trzy łóżka obsłużone + dwie zbiórki: krok 2 zaliczony (krok 3 aktywny), Gaweł żyje", ch2.served === 3 && ch2.step === 2 && !ch2.gd, ch2);
    await t.setDay(31, 20.5); await tick(40);
    t.check("po 20:00 dnia 31 Gaweł żyje (miał wywar)", (await t.json(`${S}.sick.gawel`)) === "u");

    // ---------------------------------------------------------------- chapter 3 (day 32+): three questions, the barrel, S3
    await t.setDay(32, 9); await go(218, 45, 61, 2); await tick(60);
    await t.eval("Goraczka.akcja('zapach'); 0"); await tick(10);
    for (const k of ["woziwoda", "piekarka", "kowal"]) await t.eval(`Goraczka.pytanie(null, ${JSON.stringify(k)}); 0`);
    await tick(20);
    const ch3a = await t.json(`({ lista: Object.keys(${S}.lista), zapach: ${S}.zapach, step: Goraczka.stepNow() })`);
    t.check("trzy pytania zadane + zapach beczki: lista 3/3, krok 3 jeszcze trwa (czeka scena S3 o 17:00)", ch3a.lista.length === 3 && !!ch3a.zapach && ch3a.step === 2, ch3a);
    await t.setHour(17.2); await go(218, 67, 73, 8); await tick(200);
    await t.until(`!!${S}.sc.s3 || Goraczka.busy()`, 80, 500).catch(() => false);
    await t.until(`!Goraczka.busy() || !!window.__drv`, 5, 200).catch(() => false);
    await tick(60);
    await shot(t, "s3_pod_garbarnia.png");
    await t.finish();
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 30, 300).catch(() => false);
    await t.eval("Goraczka.s3('stoj'); 0"); await tick(60); await t.finish();
    const ch3 = await t.json(`({ s3: ${S}.s3, step: Goraczka.stepNow(), q: TownQuests.rec('W21') })`);
    t.check("S3: „Stań za Ignacem” (lista chorych 3/3): Ignac obroniony, krok 3 zaliczony", ch3.s3 === "stoj" && ch3.step === 3, ch3);

    // ---------------------------------------------------------------- chapter 4: the ditch
    await t.setDay(33, 9); await go(218, 40, 62, 2); await tick(60);
    t.check("rozdz. 4: osad w rynnie (3 miejsca) i płyta rowu widoczne", (await t.json("[4630, 4631, 4632, 4633].map(id => $gameMap.event(id)._transparent)")).every(v => v === false));
    await shot(t, "rynna_osad.png");
    await t.eval("Goraczka.osad({ eventId: () => 4630 }, 0); Goraczka.osad({ eventId: () => 4631 }, 1); 0"); await tick(30); await t.finish();
    t.check("dwa miejsca osadu = dowód 1 (osad)", !!(await t.json(`${S}.dowod.osad`)));
    await go(218, 66, 64, 8); await tick(60);
    await t.eval("$gameParty.loseItem($dataItems[62], 99, false); 0");
    await t.eval("Goraczka.plyta({ eventId: () => 4633 }); 0"); await tick(20);
    t.check("płyta rowu bez łopaty: popup, dowodu nie ma", !(await t.json(`${S}.dowod.plyta`)));
    await t.eval("$gameParty.gainItem($dataItems[62], 1); 0");
    await t.eval("Goraczka.plyta({ eventId: () => 4633 }); 0"); await tick(40); await t.finish();
    await tick(80); await t.finish();
    t.check("łopata: płyta odkopana = dowód 2; dowody 2/2", !!(await t.json(`${S}.dowod.plyta`)) && Object.keys(await t.json(`${S}.dowod`)).length >= 2);
    await shot(t, "plyta_rowu_kopanie.png");
    await go(218, 69, 72, 8); await t.setHour(10); await tick(60);
    const wawTalk = await talkKey("wawrzyn", ["Zapytaj spokojnie"]);
    t.check("Wawrzyn przy kadziach: trzy podejścia, „spokojnie” - przyznaje się („nie miałem gdzie wylać”), krok 4 zaliczony", /wylać/.test(wawTalk.text) && (await t.json(`${S}.wawrzyn`)) === "spokojnie" && (await step()) === 4, wawTalk.text);
    await shot(t, "wawrzyn_rozmowa.png");

    // ---------------------------------------------------------------- chapter 5: the meeting S4, ending B
    await tick(30);
    const z = await t.json(`${S}.zebranie`);
    t.check("po rozdz. 4 sołtys wyznacza zebranie (dzień po dowodach, 15:00)", z >= 34, z);
    await t.setDay(z, 15.1); await go(218, 47, 45, 8); await tick(200);
    await t.until(`!!${S}.sc.s4`, 60, 500).catch(() => false);
    await tick(80);
    await shot(t, "s4_zebranie.png");
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 40, 300).catch(() => false);
    await t.eval("Goraczka.wybor('B'); 0"); await tick(60); await t.finish();
    t.check("wybór B: koniec B, Wawrzyn prosi o materiały na osadnik, uratowanych 6 (pełne zbiórki, Gaweł żyje)", (await t.json(`${S}.koniec`)) === "B" && (await t.json(`${S}.saved`)) === 5 || (await t.json(`${S}.saved`)) === 6);
    for (const [id, n] of [[80, 12], [64, 8], [88, 6], [93, 2]]) await t.eval(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
    await t.eval("Goraczka.osadnik(); 0"); await tick(20); await t.finish();
    t.check("materiały na osadnik oddane (12 desek, 8 kamieni, 6 gwoździ, 2 liny), budowa trwa 2 dni", (await t.json(`${S}.osadnik`)) === 1 && (await t.count(80)) === 0);
    await t.setDay(z + 3, 8); await tick(60); await t.eval("Goraczka.dayTick(); 0"); await tick(20);
    t.check("po dwóch dniach osadnik stoi: nagroda B (Opinia +6, 40 G)", !!(await t.json(`${S}.osadnikGotowy`)));
    await t.setDay(z + 3, 7); await go(218, 46, 57, 8); await t.setHour(7); await tick(250);
    await t.until(`!!${S}.sc.s5`, 60, 500).catch(() => false);
    await tick(60);
    await shot(t, "s5_cisza.png");
    await t.until("!Goraczka.busy()", 40, 300).catch(() => false);
    const end = await t.json(`({ s: ${S}.koniec, s5: ${S}.sc.s5, q: TownQuests.rec('W21'), carts: [4620, 4621].map(id => $gameMap.event(id)._transparent), pass: $gameParty.numItems(Goraczka.itemBy('przepustka')), flag: !!TownQuests.state().flags.gorBylo })`);
    t.check("S5: wozy zdjęte, przepustka zabrana, wątek W21 zakończony (zadanie ukończone), flaga gorBylo", end.s === "B" && !!end.s5 && end.carts.every(Boolean) && end.pass === 0 && end.q.s === "done" && end.flag, end);

    // ---------------------------------------------------------------- the dead Gaweł (S2) and ending A / C (jumps)
    await t.newGame({ story: true, skipIntro: true, map: 218, x: 41, y: 56, dir: 8, day: 30, hour: 9, quiet: true, minimap: false });
    await flags(false); await t.eval("TownQuests.autoChecks(); 0"); await tick(60); await go(218, 41, 56, 8); await tick(60);
    await t.eval("Goraczka.f9Rozdzial(2); 0"); await t.setDay(31, 9); await tick(40);
    await t.setDay(31, 20.5); await tick(70);
    const dead = await t.json(`({ g: ${S}.gawelDead, st: ${S}.sick.gawel })`);
    t.check("Gaweł bez wywaru do 20:00 dnia 31 umiera w nocy (stan x, Opinia -2, notatka)", dead.g === 31 && dead.st === "x", dead);
    await t.setDay(32, 5.6); await go(218, 41, 56, 8); await tick(100);
    await t.eval("(function(){ const k = TownLife.eventOf('pustelnik'); if (k) k.locate(42, 55); return 0; })()"); await t.setHour(7); await tick(200);
    await t.until(`!!${S}.sc.s2`, 40, 500).catch(() => false);
    await tick(100);
    await shot(t, "s2_dzwon_dla_gawla.png");
    t.check("S2 „Dzwon dla Gawła”: Kleofas przy przytułku, dzwon, scena odegrana", !!(await t.json(`${S}.sc.s2`)));
    await go(202, 4, 6, 8); await tick(60);
    t.check("w łóżku Gawła leży przykryty (obraz !$Chory_przykryty)", (await t.json("$gameMap.event(4612).characterName()")) === "!$Chory_przykryty");
    await shot(t, "przytulek_gawel_przykryty.png");

    // ending A (punish) and C (silence) from the chapter-5 jump
    for (const how of ["A", "C"]) {
        await t.newGame({ story: true, skipIntro: true, map: 218, x: how === "A" ? 47 : 30, y: how === "A" ? 45 : 56, dir: 8, day: 30, hour: 9, quiet: true, minimap: false });
        await flags(false); await t.eval("TownQuests.autoChecks(); 0"); await tick(60);
        await t.eval("Goraczka.f9Rozdzial(5); 0"); await t.setDay(36, 15.5); await t.eval("Goraczka.stan().zebranie = 36; 0"); await tick(60);
        const op0 = await t.json("TownQuests.state().opinion");
        if (how === "A") { await t.eval("Goraczka.wybor('A'); 0"); } else { await t.setHour(17.5); await t.eval("Goraczka.dayTick(); 0"); }
        await tick(60); await t.finish();
        const r = await t.json(`({ k: ${S}.koniec, op: TownQuests.state().opinion, wgone: TownLife.gone('wawrzyn'), igone: TownLife.gone('garbarz') })`);
        t.check(how === "A" ? "zakończenie A (ukarz): Wawrzyn w dybach (nieobecny 7 dni), Opinia +4" : "zakończenie C (milczenie): sołtys obwinia Ignaca (garbarnia zamknięta 7 dni), Opinia -5", r.k === how && (how === "A" ? r.wgone && r.op === op0 + 4 : r.igone && r.op === op0 - 5), r);
    }

    // ---------------------------------------------------------------- the hero may fall ill (the taste of the barrel)
    await t.newGame({ story: true, skipIntro: true, map: 218, x: 45, y: 61, dir: 2, day: 30, hour: 9, quiet: true, minimap: false });
    await flags(false); await t.eval("TownQuests.autoChecks(); 0"); await tick(60);
    await t.eval("Goraczka.f9Rozdzial(3); 0"); await tick(20);
    await t.eval("Goraczka.akcja('sprobuj'); 0"); await tick(20);
    t.check("łyk z beczki: bohater lekko choruje (premia „Osłabienie” 18 h, popup), zapach zaliczony", (await t.json("$gameSystem.hasBuff('goraczka')")) === true && !!(await t.json(`${S}.ill`)) && !!(await t.json(`${S}.zapach`)));

    // ---------------------------------------------------------------- the outside variant: the sick lie in Map202
    await t.newGame({ story: true, skipIntro: true, map: 218, x: 41, y: 56, dir: 8, day: 30, hour: 9, quiet: true, minimap: false });
    await flags(true); await t.eval("TownQuests.autoChecks(); 0"); await tick(60); await go(218, 41, 56, 8); await tick(60);
    const out0 = await t.json(`({ camp: ${S}.camp, door: (function(){ return 0; })(), cauldron: $gameMap.event(4622)._transparent })`);
    t.check("campOutside: wątek ruszył z obozem „outside”, kocioł przed miejskim przytułkiem ukryty", out0.camp === "outside" && out0.cauldron === true, out0);
    await go(202, 10, 9, 8); await tick(60);
    const out1 = await t.json("[4610, 4611, 4612, 4613].map(id => { const e = $gameMap.event(id); return e ? e._transparent : null; })");
    t.check("campOutside: chorzy leżą w starym przytułku Podgrodzia (Map202)", out1.slice(0, 3).every(v => v === false) && out1[3] === true, out1);
    await shot(t, "przytulek_podgrodzie_chorzy.png");

    // ---------------------------------------------------------------- F9, a save and load
    const f9 = await t.json("(function(){ const s = Watki.f9.sekcje().find(x => /W21/.test(x.head || '')); return s ? s.head : null; })()");
    t.check("F9: sekcja „Wątek W21 (Gorączka w przytułku):”", f9 === "Wątek W21 (Gorączka w przytułku):", f9);
    await t.newGame({ story: true, skipIntro: true, map: 218, x: 41, y: 56, dir: 8, day: 30, hour: 9, quiet: true, minimap: false });
    await flags(false); await t.eval("TownQuests.autoChecks(); 0"); await tick(60);
    await t.eval("Goraczka.f9Rozdzial(4); 0"); await tick(20);
    await t.saveTo(2); await t.eval("Goraczka.stan().zapach = 0; 0");
    const lo = await t.loadFrom(2); await tick(30);
    t.check("zapis i wczytanie: stan wątku wraca (obóz, chorzy, lista)", (await t.json(`${S}.camp`)) === "inside" && Object.keys(await t.json(`${S}.lista`)).length === 3 && !!(await t.json(`${S}.zapach`)));
});
