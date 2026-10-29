// Podróżni z promu - etap 3: intrygi na piętrach tawerny (docs/PODROZNI.md 1.5-1.7, 3; js/plugins/Intrygi_Data.js + Intrygi.js,
// js/teksty/intrygi.txt; furtki TavernLife / TavernLife_Plan / TavernShift). Sprawdza:
//   - wtyczki na miejscach, zadania D45, D46, K73, furtki TavernLife (addRoomGuard, addRoomPrice, addGatePass, addWake, plan.addInfo),
//     TavernShift.addTipBonus; mechanizmy zarejestrowane (nocni piechurzy, listy, przeszukania - też W15 i D42)
//   - pokój 3 zajęty przez „trójkę”: Borgar nie wynajmuje (furtka), plan karczmy: kto i do kiedy; Renoma 80: pokoje bohatera 20% taniej
//   - przepustka złotej kraty (addGatePass) otwiera kratę na piętrze
//   - drzwi zajętego pokoju (Tobiasz, 23): nocą zamknięte („Ktoś tu mieszka”), rano w czasie sprzątania otwarte, gdy go nie ma
//   - przeszukanie: D42 - kufer Zenona (pokój 20) w czasie sprzątania - umowa, poszlaka; przyłapany (gość wraca) - Renoma -3, obrażony
//   - D45: start w tawernie, sadza rano, sznur w piwnicy, liczby zza ściany pokoju 1 - trzy poszlaki; Borgar wyważa drzwi - zrobione
//   - D46 (wariant A): zamek, złe oskarżenie (Szymek: Opinia i Renoma w dół), trafne (sama Ksenia) - zrobione
//   - I4: noc w wynajętym pokoju - pobudka „Kroki na korytarzu...”, „Wstań po cichu”, Ozzy ze świecą (światło idzie z nim), śledzenie
//     do schodów - K73; drugi raz za blisko - zobaczył
//   - I5: rano po nocy w wynajętym pokoju list pod drzwiami (pokój 1) - czytanie, notatka
// Uruchom: node tests/run.js intrygi_test --port 9763
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const W = "IntrygiData.watek";
    const act = (name, args) => t.eval(`${W}.akcja(${JSON.stringify(name)}, ${JSON.stringify(args || [])}); 0`);
    const st = () => J(`${W}.S()`);
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 30); };
    const rec = id => J(`TownQuests.rec(${JSON.stringify(id)}) || null`);
    const listText = id => J(`(function(){ const e = $gameMap.event(${id}); return e ? e.list().filter(c => c.code === 401 || c.code === 355 || c.code === 201).map(c => c.code + ":" + c.parameters[0]).join(" | ") : "brak"; })()`);

    // ---------------------------------------------------------------- dane i furtki
    await t.newGame({ map: 8, x: 53, y: 55, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.frames(20);
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), q: ["D45", "D46", "K73"].map(id => !!TownQuests.Q[id]),
        tl: ["addRoomGuard", "addRoomPrice", "addGatePass", "addWake"].map(k => typeof TavernLife[k]), plan: typeof TavernLife.plan.addInfo, tip: typeof TavernShift.addTipBonus,
        kroki: Podroznicy.kroki.lista(), listy: Podroznicy.listy.lista(), szuk: Podroznicy.przeszukanie.lista() })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Intrygi_Data nad TownLife i TownQuests_Data, Intrygi pod Podroznicy_Sprawy; zadania D45, D46, K73; furtki TavernLife, plan, napiwki",
        ix("Intrygi_Data") > ix("Podroznicy_Data") && ix("Intrygi_Data") < ix("TownLife") && ix("Intrygi_Data") < ix("TownQuests_Data") && ix("Intrygi") > ix("Podroznicy_Sprawy") &&
        base.q.every(Boolean) && base.tl.every(x => x === "function") && base.plan === "function" && base.tip === "function", base);
    t.check("mechanizmy: nocni piechurzy (Ozzy, Tymon), listy (Tymon, Szczerba, Urszula), przeszukania (W15 - skrzynka Gaspara, D42 - pokój 20, D46)",
        ["ozzy", "tymon"].every(k => base.kroki.includes(k)) && ["w16Tymon", "w16Szczerba", "d43Urszula"].every(k => base.listy.includes(k)) &&
        ["w15Skrzynka", "d42Umowa", "d46Pokoj"].every(k => base.szuk.includes(k)), base);

    // ---------------------------------------------------------------- pokój 3 zajęty, plan karczmy, ceny z Renomy
    await at(4, 14.5, 40);
    await t.gold(200);
    await t.eval(`Podroznicy.przyplyn("trojka"); 0`);
    const guard = await J(`({ g: TavernLife.roomGuard("3"), ksiega: Podroznicy.stan().ksiega["3"], rent: TavernLife.rentRoom(3), rented: TavernLife.rentedRoom(),
        info: (TavernLife.plan.info(1, "r23") || { sections: [] }).sections.map(s => s.lines.map(l => l.text).join("; ")).join(" / ") })`);
    const pops = await t.popups();
    t.check("„trójka” w pokoju 3: furtka TavernLife - wynajem odmówiony popupem nad bohaterem („zajęte do dnia”); plan karczmy przy pokoju 23: Tobiasz i do kiedy",
        !!guard.g && guard.ksiega === "trojka" && guard.rent === false && !guard.rented && pops.some(p => /zajęte do dnia/.test(p)) && /Tobiasz Goniec.*do dnia 7/.test(guard.info), { guard, pops: pops.slice(-3) });
    const ceny = await J(`(function(){ const s = Podroznicy.stan(), r0 = s.renoma; s.renoma = 30; const a = TavernLife.roomPrice(1); s.renoma = 80; const b = TavernLife.roomPrice(1); s.renoma = r0; return { a, b }; })()`);
    t.check("Renoma 80: pokoje bohatera 20% taniej (pokój 1)", ceny.b === Math.max(1, Math.round(ceny.a * 0.8)) && ceny.b < ceny.a, ceny);

    // ---------------------------------------------------------------- drzwi zajętego pokoju (Tobiasz, pokój 23 - drzwi 1 na Map025)
    await t.go(25, 4, 18, 8);
    await at(4, 23.5, 30);
    const nocDrzwi = await listText(1);
    await at(5, 10, 30);
    const ranoDrzwi = await listText(1);
    const kto = await J(`Intrygi.wPokoju("tobiasz")`);
    t.check("drzwi pokoju 23: nocą zamknięte („Zamknięte. Ktoś tu mieszka.”, Zapukaj); rano w czasie sprzątania, gdy Tobiasza nie ma - przejście jak dawniej",
        /Ktoś tu mieszka/.test(nocDrzwi) && !/^201/.test(nocDrzwi) && /201:/.test(ranoDrzwi) && !kto, { nocDrzwi, ranoDrzwi, kto });

    // ---------------------------------------------------------------- przeszukanie: D42 (pokój 20), potem przyłapany (pokój 23)
    await t.eval(`Podroznicy.przyplyn("zboze"); TownQuests.start("D42"); 0`);
    await at(5, 9.6, 20);
    // (Zenon's trunk: in his room - usually 20, the book may have given him another of its kind)
    const kuferId = await J(`(function(){ const room = String(Podroznicy.stan().obecni.zboze.pokoj), f = TavernLife.plan.DATA.floors.find(x => x.map === 25), r = f.rooms.find(q => q.k === "r" + room);
        const e = $gameMap.events().find(ev => /^(Kufer|Torba)/.test(ev.event().name) && r.r.some(q => ev.x >= q[0] && ev.x <= q[2] && ev.y >= q[1] && ev.y <= q[3])); return e ? e.eventId() : 0; })()`);
    const kufer = await listText(kuferId);
    await t.eval(`Intrygi.szukajTak(null, "d42Umowa"); 0`);
    await t.frames(10);
    const d42 = await J(`Podroznicy.stan().d42.slady`);
    t.check("przeszukanie: kufer Zenona w pokoju 20 (9:36, sprząta pokojówka, Zenona nie ma) - „Przeszukać?”; umowa - poszlaka D42 „pokój”",
        /Intrygi\.szukaj/.test(kufer) && !!d42.pokoj, { kufer, d42 });
    await t.eval(`Podroznicy.przeszukanie.dodaj({ id: "test23", pokoj: "23", kto: "tobiasz", gdy: () => true, klucz: "szukanie.nic" }); 0`);
    await at(5, 22.8, 10);
    const r0 = (await J("Podroznicy.stan().renoma"));
    await t.eval(`Intrygi.szukajTak(null, "test23"); 0`);
    const zly = await J(`({ zly: IntrygiData.watek.S().zly.tobiasz || 0, renoma: Podroznicy.stan().renoma })`);
    t.check("...przyłapany (Tobiasz wraca o 23:00): Renoma -3, Tobiasz obrażony do końca pobytu", zly.zly > 0 && zly.renoma === r0 - 3, { r0, zly });

    // ---------------------------------------------------------------- przepustka złotej kraty
    const gate = await J(`(function(){ window.__pass = false; TavernLife.addGatePass(() => !!window.__pass); const g = TavernLife.spots("gate")[0]; return g ? g.id : 0; })()`);
    await t.eval(`window.__pass = true; TavernLife.syncDoors(); 0`);
    const otw = await J(`$gameSelfSwitches.value([25, ${gate}, "A"])`);
    await t.eval(`window.__pass = false; TavernLife.syncDoors(); 0`);
    const zam = await J(`$gameSelfSwitches.value([25, ${gate}, "A"])`);
    t.check("przepustka (addGatePass): złota krata na piętrze otwarta, póki trwa - potem zamknięta (bez Sławy 80)", gate > 0 && otw === true && zam === false, { gate, otw, zam });

    // ---------------------------------------------------------------- D45 „Gość spod trójki”
    const od = await J(`Podroznicy.stan().obecni.trojka.od`);
    await at(od + 1, 7, 30);
    await t.go(25, 30, 49, 4);
    await t.frames(60);
    const d45a = await J(`({ r: TownQuests.rec("D45"), sadza: (function(){ const e = $gameMap.event(3011); return e ? { x: e.x, y: e.y, on: !e.isTransparent(), img: e.characterName() } : null; })() })`);
    await t.talkTo(3011, [], { secs: 15 });
    await t.go(9, 4, 11, 8);
    await t.frames(40);
    await t.talkTo(3017, [], { secs: 15 });
    await t.go(25, 35, 40, 4);
    await at(od + 1, 23, 10);
    await at(od + 2, 1.5, 20);
    const miejsce = await J("Podroznicy.podsluch.miejsce()");
    await t.eval(`Podroznicy.podsluch.sluchaj("d45Liczby"); 0`);
    await t.until("!Podroznicy.podsluch.trwa()", 30, 60);
    const d45b = await J(`({ s: ${W}.S().d45, r: TownQuests.rec("D45"), rows: Tawerna.talk.rows("borgar", {}).map(r => r.label) })`);
    t.check("D45: start w tawernie; rano sadza pod drzwiami trójki (3011), sznur w piwnicy (3017), z pokoju 1 przez ścianę liczby - trzy poszlaki; u Borgara „Wyważmy drzwi trójki”",
        d45a.r && d45a.sadza && d45a.sadza.on && d45a.sadza.img === "!$Podr_Sadza" && miejsce && miejsce.room === "r3" &&
        ["sadza", "sznur", "liczby"].every(k => d45b.s.slady[k]) && d45b.r.step === 1 && d45b.rows.includes("Wyważmy drzwi trójki."), { d45a, miejsce, d45b });
    const g0 = await t.gold(), r1 = await J("Podroznicy.stan().renoma");
    await t.eval(`Intrygi.d45Koniec("a"); 0`);
    const d45c = await J(`({ r: TownQuests.rec("D45"), f: !!TownQuests.state().flags.pomiaryPrzejete, tr: !!Podroznicy.stan().obecni.trojka, renoma: Podroznicy.stan().renoma, gold: $gameParty.gold() })`);
    t.check("...Borgar wyważa drzwi: D45 zrobione, notes - `pomiaryPrzejete`, gość uciekł (pokój 3 wolny), Renoma +6, 20 G",
        d45c.r.s === "done" && d45c.f && !d45c.tr && d45c.renoma === r1 + 6 && d45c.gold - g0 === 20, d45c);

    // ---------------------------------------------------------------- D46 „Skradziona szkatułka” (wariant A)
    await t.eval(`(function(){ const row = Watki.f9.sekcje().find(s => s.watek === "intrygi").rows.find(r => r.kind === "isleWatek:d46"); Watki.f9.ok(row); return 0; })()`);
    await t.go(25, 74, 23, 8);
    await t.frames(40);
    const d46a = await J(`({ r: TownQuests.rec("D46"), w: ${W}.S().d46.wariant })`);
    await t.eval(`Intrygi.d46Slad("zamek"); 0`);
    const op0 = await J("TownQuests.opinion()"), r2 = await J("Podroznicy.stan().renoma");
    await act("d46Oskarz", ["szymek"]);
    const zle = await J(`({ op: TownQuests.opinion(), renoma: Podroznicy.stan().renoma, f: !!TownQuests.state().flags.d46Oskarzony_szymek })`);
    const g1 = await t.gold();
    await act("d46Oskarz", ["ksenia"]);
    const d46b = await J(`({ r: TownQuests.rec("D46"), s: ${W}.S().d46, gold: $gameParty.gold(), renoma: Podroznicy.stan().renoma })`);
    t.check("D46 (wariant A): start rano po kradzieży; zamek - poszlaka; złe oskarżenie (Szymek): Opinia -5, Renoma -5; trafne (sama Ksenia): zrobione, 25 G, Renoma +6",
        d46a.r && d46a.w === "A" && zle.op === op0 - 5 && zle.renoma === r2 - 5 && zle.f && d46b.r.s === "done" && !!d46b.s.slady.zamek && d46b.gold - g1 === 25 && d46b.renoma === r2 + 1,
        { d46a, op0, r2, zle, d46b });

    // ---------------------------------------------------------------- I4: noc w wynajętym pokoju 1 - pobudka, Ozzy ze świecą, śledzenie
    // (a new game: the night alone - nothing else on the screen)
    await t.newGame({ map: 8, x: 53, y: 55, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.gold(200);
    const dn = 4;
    await at(dn, 22, 10);
    await t.go(25, 38, 40, 2);
    await t.frames(30);
    await t.eval("Intrygi.auto(true); 0");   // (the tests' quiet mode - newGame / calm - turns the wakes off)
    await t.eval(`TavernLife.rentRoom(1); 0`);
    // (the night crosses midnight: the day's summary may come over the wake's question - closed as by P; the question then picked
    // as the choice keys do, or the walk started by hand when the summary took the question away)
    await t.eval(`window.__wake = null; Tawerna.on("tavernWake", e => { window.__wake = { h: $gameSystem.dayNightHour(), kto: e.kto, room: e.room }; }, { owner: "test", name: "wake" }); 0`);
    await t.until("TavernLife.sleep(1) || TavernLife.busy()", 20, 15);   // (the bed once the screen is calm - no notice up)
    await t.until("!!window.__wake", 30, 10);
    for (let i = 0; i < 40; i++) {
        const sc = await J("SceneManager._scene.constructor.name + '|' + !!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active && $gameMessage.isChoice()) + '|' + Podroznicy.kroki.trwa()");
        if (/\|true$/.test(sc)) break;
        if (sc.indexOf("Scene_DaySummary") === 0) { await t.eval("SceneManager.pop(); 0"); await t.frames(30); continue; }
        if (sc === "Scene_Map|true|false") { await t.eval(`(function(){ const cw = SceneManager._scene._choiceListWindow; cw.select(0); cw.deactivate(); cw.callOkHandler(); return 0; })()`); await t.frames(10); continue; }
        await t.frames(15);
    }
    const zbudzony = await J(`({ wake: window.__wake, trwa: Podroznicy.kroki.trwa() })`);
    if (!zbudzony.trwa) await t.eval(`Intrygi.krokiStart("ozzy"); 0`);
    const swiatlo = await J(`(function(){ const sp = SceneManager._scene._spriteset, l = (sp._roomLightSprites || []).find(s => s._eventId === 3002); const e = $gameMap.event(3002); return { l: !!l, follow: !!(l && l._follow), img: e.characterName(), x: e.x, y: e.y }; })()`);
    // (idzie za nim: jego śladem, pięć kroków z tyłu)
    await t.eval(`window.__trop = []; 0`);
    for (let i = 0; i < 360; i++) {
        const go = await J(`(function(){ if (!Podroznicy.kroki.trwa()) return false; const e = $gameMap.event(3002), tr = window.__trop, last = tr[tr.length - 1];
            if (!last || last[0] !== e.x || last[1] !== e.y) tr.push([e.x, e.y]);
            const at = tr.length > 5 ? tr[tr.length - 6] : [Math.max(1, tr[0][0] - 5), tr[0][1]]; $gamePlayer.locate(at[0], at[1]); return true; })()`);
        if (!go) break;
        await t.frames(8);
    }
    const k73 = await J(`({ kroki: ${W}.S().kroki, r: TownQuests.rec("K73") })`);
    t.check("noc w wynajętym pokoju 1: pobudka o 1:00 („Wstań po cichu” / „Śpij dalej”), Ozzy ze świecą (światło idzie za nim), śledzony do schodów - K73 zrobione",
        !!zbudzony.wake && zbudzony.wake.kto === "ozzy" && zbudzony.wake.h >= 1 && zbudzony.wake.h < 1.2 && swiatlo.l && swiatlo.follow && swiatlo.img === "People2_Tall" &&
        k73.kroki.udane === 1 && !!k73.r && k73.r.s === "done", { zbudzony, swiatlo, k73 });
    await t.eval(`(function(){ const row = Watki.f9.sekcje().find(s => s.watek === "intrygi").rows.find(r => r.kind === "isleWatek:kroki"); Watki.f9.ok(row); return 0; })()`);
    await t.eval(`Podroznicy.kroki.dodaj({ id: "test", kto: "kroki.ozzy.kto", arkusz: "People2_Tall", start: [20, 49, 6], trasa: [[44, 50]], godziny: [1, 3], gdy: () => true }); 0`);
    await t.go(25, 17, 49, 6);
    await t.frames(20);
    await t.eval(`Intrygi.krokiStart("test"); 0`);
    await t.frames(40);
    await t.eval(`(function(){ const e = $gameMap.event(3002); $gamePlayer.locate(e.x - 1, e.y); return 0; })()`);
    await t.until("!Podroznicy.kroki.trwa() || (Podroznicy.kroki.stan() && Podroznicy.kroki.stan().stan === 'wraca')", 10, 10);
    const zob = await J(`${W}.S().kroki`);
    t.check("...drugi raz o krok za piechurem - zobaczył go (wymówka, wraca do pokoju): nie liczy się", zob.udane === 1 && !!zob.zrobione.test, zob);

    // ---------------------------------------------------------------- I5: list pod drzwiami rano
    await t.eval(`Podroznicy.listy.dodaj({ id: "test", gdy: () => true, klucz: "listy.urszula" }); 0`);
    const dl = await J("$gameSystem.dayNightDay()");
    await at(dl + 1, 7, 10);
    await t.eval(`(function(){ const s = TavernLife.state(); s.rent = { room: "1", name: "Pokój 1", price: 8, day: $gameSystem.dayNightDay() - 1, until: ($gameSystem.dayNightDay()) * 24 + 10, slept: true }; IntrygiData.watek.S().listy.dzien = 0; return 0; })()`);
    await t.go(25, 38, 42, 2);
    await t.frames(60);
    const lp = await J(`(function(){ const e = $gameMap.event(3014); return e ? { on: !e.isTransparent(), x: e.x, y: e.y, img: e.characterName(), dzis: Podroznicy.listy.dzis() } : null; })()`);
    await t.talkTo(3014, [], { secs: 15 });
    const lr = await J(`({ s: ${W}.S().listy, note: (Journal.data().notes || []).some(n => /List od Urszuli/.test(n.title)) })`);
    t.check("rano po nocy w wynajętym pokoju 1: list pod drzwiami (3014 w pokoju przy drzwiach), O - czytanie i notatka",
        !!lp && lp.on && lp.x === 38 && lp.y === 44 && lp.img === "!$Podr_List" && lr.note && !!lr.s.byly.test, { lp, lr });
});
