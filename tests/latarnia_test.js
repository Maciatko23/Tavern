// PAKIET C "Przylądek z latarnią" (docs/miejsca_wyspy/PAKIETY.md; js/plugins/Latarnia_Data.js + Latarnia.js; mapy z
// tools/latarnia/build.py). Sprawdza:
//   - mapy 159 (44 x 40, tileset 11, <Water:salt>, bez szkieletu), 160 (izba), 161 (laterna): przejścia z kontraktu (lewa krawędź ->
//     Urwisko tylko gdy gotowe, inaczej popup; dół -> Góry 13), drzwi izby i latarni, miejsca Bazylego
//   - wejście z gór: Wyspa.ready(159) - przejście na prawej krawędzi Map013 prowadzi na (30,38)
//   - Bazyli (TownLife 943): plan dnia za słońcem (zmierzch latem później niż zimą), śpi za dnia (drzwi zaryglowane), drewutnia po
//     południu, izba wieczorem, laterna nocą - pokazany tylko w izbie albo tylko w laternie; pierwsza rozmowa (kruk we mgle), popiersie
//   - ogień latarni: nocą płomień na wieży, światło w warstwie nocy, snopy; za dnia nic; bez opału ciemno (flaga latarniaZgasla);
//     skup opału, pogoda na dwa dni z planu pogody
//   - mgła morska: noc przed mglistym rankiem, przełącznik 19, pasma mgły, dzwon mgłowy o pełnej godzinie
//   - D22: oferta przed mglistą nocą, wizja w soczewce (biały ekran, plansza, zdanie), raz na noc, Ciężka głowa, flaga mgla, trzy
//     wizje -> rozmowa -> karta 5 (kronikaKarta5 -> karta w torbie przez Pustelnia.js)
//   - K49: od dnia 24, tran od Janka, oddanie -> 30 G, latarniaUfa, opał +5,5, drzwi latarni otwarte; przepis tranu w kociołku
//   - W11 (Akt II): oferta Baltazara, ostrzeżenie, napad nocą (skradziona), obóz złodziei w zatoczce i worek, Kleofas czyta, sprzedaż
//     Baltazarowi (400 G); druga droga: obrona, rozbicie (soczewkaRozbita)
// Przed instalacją map: nakładka tools/miejsca_wyspy/staging_C (sama się włącza, gdy data/Map159.json to jeszcze szkielet).
// Zrzuty do dokumentacji: docs/miejsca_wyspy/latarnia_*.png.
// Uruchom: CDP_PORT=9503 node tests/latarnia_test.js (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");

const ROOT = path.join(__dirname, "..");
const SHOTS = path.join(ROOT, "docs", "miejsca_wyspy");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map159.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_C" : null);
const SHOT = process.env.SHOTS === "1";   // (the docs' pictures: tools/latarnia/shots.js)

kit.test({ port: 9503, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    if (OVERLAY) console.log("NOTE nakładka: " + OVERLAY);
    const B = "TownLife.eventOf('latarnik')";
    const S = expr => t.json(`(function(){ const s = Latarnia.state(); return ${expr}; })()`);

    // ---------------------------------------------------------------- wtyczki, dane
    const base = await t.json(`(function(){ const R = TownLife.RESIDENTS.find(r => r.key === 'latarnik');
        const rec = (Farming.BUILDINGS.cauldron.recipes || []).find(r => r.id === 'tran');
        return { api: !!window.Latarnia && !!Latarnia.lens, data: !!window.LatarniaData, res: R ? [R.id, R.map, R.sheet] : null,
            q: ['K49', 'D22', 'W11'].map(k => !!TownQuests.Q[k]), ready: Wyspa.isReady(159),
            packs: TownQuestsData.PACKS.filter(p => p.owner === 'Latarnia').map(p => p.quests.join()),
            rec: rec ? [rec.fish, rec.output] : null, buff: !!(Survival.BUFFS && Survival.BUFFS.ciezkaGlowa) }; })()`);
    t.check("Latarnia.js i Latarnia_Data.js działają: Bazyli (943, mapa 159, $Npc_Latarnik), K49, D22, W11 w zadaniach, miejsce gotowe (Wyspa.ready 159)",
        base.api && base.data && base.res && base.res[0] === 943 && base.res[1] === 159 && base.res[2] === "$Npc_Latarnik" && base.q.every(Boolean)
        && base.ready && base.packs.join() === "K49,D22,W11", base);
    t.check("przepis „Wytop tran” w kociołku (3 ryby -> Tran 177) dopisany do Farming.BUILDINGS; premia „Ciężka głowa” zdefiniowana",
        base.rec && base.rec[0] === 3 && base.rec[1][0] === 177 && base.buff, base);

    // ---------------------------------------------------------------- z gór na przylądek
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.setDay(10, 16);
    await t.go(13, 58, 12, 6);
    const edge = await t.json(`$dataMap.events.filter(e => e && e.id >= 696 && e.id <= 698).map(e => [e.id, e.x, e.y, e.pages[0].list[0].parameters.slice(1, 4)])`);
    t.check("Góry: na prawej krawędzi (59, 11-13) trzy przejścia na przylądek (Wyspa.js, 696-698)", edge.length === 3 && edge.every(e => e[3][0] === 159 && e[1] === 59), edge);
    await t.eval("$gameMap.event(697).start(); 0");
    const up = await t.until(t.onMap(159), 30);
    await t.frames(20);
    await t.calm({ quiet: true });
    const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $dataMap.width, $dataMap.height, $dataMap.tilesetId, $dataMap.note, $dataMap.displayName]");
    t.check("...prowadzi na Map159 „Przylądek z latarnią” (30,38); mapa 44 x 40, tileset 11, notatka z <Water:salt>, nie szkielet",
        up && at[0] === 159 && at[1] === 30 && at[2] === 38 && at[3] === 44 && at[4] === 40 && at[5] === 11 && /<Water:salt>/.test(at[6]) && !/szkielet/.test(at[6]) && at[7] === "Przylądek z latarnią", at);
    const ways = await t.json(`(function(){ const ev = $dataMap.events.filter(Boolean), tr = e => (e.pages[0].list.find(c => c.code === 201) || {}).parameters;
        return { south: ev.filter(e => e.y === 39 && e.x >= 29 && e.x <= 31).map(e => [e.x, tr(e) ? tr(e).slice(1, 5) : null]),
            west: ev.filter(e => e.x === 0 && (e.y === 33 || e.y === 34)).map(e => [e.y, /isReady\\(157\\)/.test(e.pages[0].list[0].parameters[0])]),
            izba: ev.filter(e => e.name === 'Drzwi: Izba latarnika').map(e => [e.x, e.y]), tower: ev.filter(e => /<Latarnia:wieza>/.test(e.note)).map(e => [e.x, e.y, e.pages[0].image.characterName]),
            spots: ev.filter(e => /^Miejsce: /.test(e.name)).map(e => e.name.slice(9)).sort() }; })()`);
    t.check("przejścia z kontraktu: dół (29-31, 39) -> Góry (58, 11-13, w lewo), lewa krawędź (0, 33-34) -> Urwisko (tylko gdy gotowe); izba i wieża latarni",
        ways.south.length === 3 && ways.south.every((s, i) => s[1] && s[1][0] === 13 && s[1][1] === 58 && s[1][2] === 11 + i && s[1][3] === 4)
        && ways.west.length === 2 && ways.west.every(w => w[1]) && ways.izba.join() === "15,18" && ways.tower.length === 1 && ways.tower[0][2] === "!$Latarnia_Wieza", ways);
    t.check("miejsca Bazylego i pakietu na mapie: drewutnia, izba, izba_sen, laterna, lat_dzwon, lat_napad, lat_oboz",
        ways.spots.join() === "drewutnia,izba,izba_sen,lat_dzwon,lat_napad,lat_oboz,laterna", ways.spots);
    // the way west: the Urwisko built (package B installed, 2026-10-16: Kruk.js says Wyspa.ready(157)) -> over to it (54,19), then back;
    // not built (a stub Map157) -> a popup, no transfer
    await t.popups({ clear: true });
    const urwReady = await t.eval("Wyspa.isReady(157)");
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.x === 0 && e.y === 33); $gamePlayer.locate(1, 33); e.start(); return 0; })()");
    if (urwReady) {
        const over = await t.until(t.onMap(157), 15);
        await t.frames(10);
        const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
        t.check("Urwisko (157) gotowe: lewa krawędź (0,33) prowadzi na Urwisko Kruków (54,19)", over && at.join() === "157,54,19", at);
        await t.go(159, 30, 38, 8);
    } else {
        await t.frames(30);
        const westPop = await t.popups();
        t.check("Urwisko (157) jeszcze nie gotowe: na lewej krawędzi popup nad bohaterem, bez przejścia", (await t.eval("$gameMap.mapId()")) === 159 && westPop.some(p => /urywa się/.test(p)), westPop);
    }

    // ---------------------------------------------------------------- Bazyli: plan dnia za słońcem
    const sunPlan = await t.json(`(function(){ const out = [];
        for (const d of [40, 100]) { const h = Latarnia.updatePlan(d); out.push([d, h[5], Latarnia.dusk(d), h[1]]); }
        Latarnia.updatePlan(10); return out; })()`);
    t.check("plan Bazylego za słońcem: wejście na górę o zmierzchu - latem (dzień 40) później niż zimą (dzień 100)",
        sunPlan[0][1] === Math.round(sunPlan[0][2] * 100) / 100 && sunPlan[1][1] === Math.round(sunPlan[1][2] * 100) / 100 && sunPlan[0][1] > sunPlan[1][1] + 1, sunPlan);
    await t.setDay(10, 16);
    await t.frames(40);
    const chop = await t.json(`(function(){ const s = TownLife.state('latarnik'), sp = TownLife.spot('drewutnia'); return { s: s && [s.x, s.y, s.hidden, s.act], sp }; })()`);
    t.check("o 16 Bazyli rąbie drewno przy drewutni", chop.s && !chop.s[2] && chop.s[3] === "work" && chop.s[0] === chop.sp[0] && chop.s[1] === chop.sp[1], chop);
    await t.setDay(10, 11);
    await t.frames(40);
    const sleep = await t.json(`(function(){ const s = TownLife.state('latarnik'); return s && [s.hidden, s.act, Latarnia.placeNow()]; })()`);
    await t.popups({ clear: true });
    await t.eval("(function(){ $gamePlayer.locate(15, 19); $gamePlayer.setDirection(8); const e = $gameMap.events().find(e => e.event().name === 'Drzwi: Izba latarnika'); e.start(); return 0; })()");
    await t.frames(30);
    const bolt = await t.popups();
    t.check("o 11 śpi w izbie (ukryty, „izba_sen”), drzwi zaryglowane: popup o chrapaniu, bez przejścia",
        sleep && sleep[0] === true && sleep[2] === "izba_sen" && (await t.eval("$gameMap.mapId()")) === 159 && bolt.some(p => /chrapanie/.test(p)), { sleep, bolt });

    // ---------------------------------------------------------------- izba wieczorem, pierwsza rozmowa
    await t.setDay(10, 18);
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.event().name === 'Drzwi: Izba latarnika'); e.start(); return 0; })()");
    const inIzba = await t.until(t.onMap(160), 20);
    await t.frames(30);
    await t.calm({ quiet: true });
    const izba = await t.json(`(function(){ const e = ${B}; return { at: [$gamePlayer.x, $gamePlayer.y], b: e && [e.x, e.y, e._town && e._town.hidden], book: $dataMap.events.some(e => e && /<Latarnia:ksiega>/.test(e.note)) }; })()`);
    t.check("wieczorem drzwi izby prowadzą do Map160 (6,8); Bazyli jest w izbie, Księga mgieł na stole",
        inIzba && izba.at.join() === "6,8" && izba.b && izba.b[2] === false && izba.b[0] === 5 && izba.b[1] === 7 && izba.book, izba);
    const meet = await t.talkTo(B, []);
    const met = await t.json("({ f: TownQuests.state().flags.latarnikMet, notes: ($gameSystem._journal.notes || []).map(n => n.title) })");
    t.check("pierwsza rozmowa: „Kruk na szyi. Widziałem go we mgle”, flaga latarnikMet, notatka „Latarnik z przylądka”",
        /Kruk na szyi/.test(meet.text) && /we mgle/.test(meet.text) && !!met.f && met.notes.includes("Latarnik z przylądka"), meet.text.slice(0, 300));
    await t.frames(10);
    const bust = await t.json(`(function(){ const e = ${B}; return [SpeechBubbles.bustOf(e), e.characterName()]; })()`);
    t.check("Bazyli ma własne popiersie (Latarnik_Bust) i arkusz $Npc_Latarnik", bust[0] === "Latarnik_Bust" && bust[1] === "$Npc_Latarnik", bust);
    if (SHOT) {
        await t.eval(`(function(){ $gamePlayer.locate(6, 7); $gamePlayer.setDirection(4); return 0; })()`);
        await t.frames(30);
        await t.shot(path.join(SHOTS, "latarnia_izba.png"));
    }

    // ---------------------------------------------------------------- skup opału, pogoda
    await t.give(177, 3);
    const g0 = await t.gold(), f0 = await S("s.fuel");
    await t.talkTo(B, ["Kupisz opał", "Tran"]);
    const sold = [await t.gold() - g0, Math.round((await S("s.fuel")) - f0), await t.count(177)];
    t.check("Bazyli skupuje tran: 3 dzbanki = 18 G, opał latarni +3 noce", sold[0] === 18 && sold[1] === 3 && sold[2] === 0, sold);
    const wt = await t.talkTo(B, ["Jaka będzie pogoda"]);
    const want = await t.json("Latarnia.forecast()");
    t.check("pogoda na dwa dni dokładnie z planu pogody (Survival.weatherPlan): " + want, wt.text.indexOf(want.slice(0, 30)) >= 0 && /Jutro: .*Pojutrze: /.test(want), wt.text.slice(-200));

    // ---------------------------------------------------------------- ogień latarni nocą
    await t.go(159, 22, 12, 8);
    await t.setDay(10, 15);
    await t.frames(30);
    const day = await t.json(`(function(){ const ss = SceneManager._scene._spriteset; return { lit: Latarnia.lit(), flame: !!(ss._latFlame && ss._latFlame.visible) }; })()`);
    if (SHOT) { await t.locate(22, 14, 8); await t.frames(40); await t.shot(path.join(SHOTS, "latarnia_dzien.png")); }
    await t.setDay(10, 23);
    await t.frames(60);
    const night = await t.json(`(function(){ const ss = SceneManager._scene._spriteset, nl = ss._nightLight;
        return { lit: Latarnia.lit(), flame: !!(ss._latFlame && ss._latFlame.visible), glass: ss._latGlass ? ss._latGlass.opacity : 0,
            light: nl && nl.visible ? nl.lights().some(l => l.id === 6630 && l.r >= 480) : false, beams: !!(ss._latLayer && ss._latLayer._beams.visible), fuel: Latarnia.state().fuel }; })()`);
    t.check("za dnia latarnia nie świeci; nocą płomień w koszu na wieży, szyby laterny świecą, duże światło w warstwie nocy i snopy nad morzem",
        !day.lit && !day.flame && night.lit && night.flame && night.glass > 100 && night.light && night.beams, { day, night });
    if (SHOT) { await t.locate(22, 16, 8); await t.frames(60); await t.shot(path.join(SHOTS, "latarnia_noc.png")); }
    // without fuel: dark
    await t.eval("(function(){ $gameSystem._dayNightDay = 11; $gameSystem.setDayNightHour(15); Latarnia.settle(); Latarnia.state().fuel = 0; $gameSystem.setDayNightHour(23); return 0; })()");
    await t.frames(40);
    const dark = await t.json(`(function(){ const ss = SceneManager._scene._spriteset; return { lit: Latarnia.lit(), flame: !!(ss._latFlame && ss._latFlame.visible), f: !!TownQuests.state().flags.latarniaZgasla }; })()`);
    t.check("bez opału latarnia nocą nie świeci, flaga latarniaZgasla (uwaga Janka)", !dark.lit && !dark.flame && dark.f, dark);
    await t.eval("(function(){ Latarnia.state().fuel = 8; return 0; })()");

    // ---------------------------------------------------------------- mgła morska i D22
    // the fog: the night before a misty morning (Sky.mistOfDay(tomorrow)); Bazyli offers D22 that afternoon
    await t.eval("(function(){ Sky.forceMist(0.95, 13); $gameSystem._dayNightDay = 12; $gameSystem.setDayNightHour(16.5); return 0; })()");
    await t.frames(40);
    const offer = await t.talkTo(B, ["Przyjdę"]);
    t.check("D22 „Księga mgieł”: przed mglistą nocą Bazyli czuje mgłę i daje zadanie; przyjęte", (await t.json("TownQuests.isActive('D22')")) && /mgła/.test(offer.text), offer.text.slice(0, 200));
    await t.setDay(12, 22.95);
    await t.frames(30);
    await t.eval(`(function(){ window.__se = []; const o = Tawerna.audio.se; Tawerna.audio.se = function(n, op) { window.__se.push(n); return o.apply(this, arguments); }; return 0; })()`);
    await t.setDay(12, 23.01);
    await t.frames(260);
    const fog = await t.json(`(function(){ const ss = SceneManager._scene._spriteset; return { fog: Latarnia.fogNow(), sw: $gameSwitches.value(19), layer: !!(ss._latLayer && ss._latLayer._fog.visible), bells: window.__se.filter(n => n === 'Bell1').length }; })()`);
    t.check("mgła morska nocą: Latarnia.fogNow, przełącznik 19, pasma mgły nad przylądkiem, o pełnej godzinie dzwon mgłowy bije 3 razy",
        fog.fog && fog.sw && fog.layer && fog.bells === 3, fog);
    if (SHOT) { await t.locate(22, 15, 8); await t.frames(30); await t.shot(path.join(SHOTS, "latarnia_mgla.png")); }
    // the tower's door: before K49 only in a fog (and he is up there)
    await t.eval("(function(){ $gamePlayer.locate(22, 10); $gamePlayer.setDirection(8); $gameMap.events().find(e => /<Latarnia:wieza>/.test(e.event().note)).start(); return 0; })()");
    const inLat = await t.until(t.onMap(161), 20);
    await t.frames(30);
    await t.calm({ quiet: true });
    const lat = await t.json(`(function(){ const e = ${B}, L = $gameMap.events().find(e => /<Latarnia:soczewka>/.test(e.event().note)), k = $gameMap.events().find(e => /<Latarnia:kosz>/.test(e.event().note));
        return { at: [$gamePlayer.x, $gamePlayer.y], b: e && [e.x, e.y, e._town && e._town.hidden], lens: L && [L.characterName(), L.direction()], kosz: k && k.direction() }; })()`);
    t.check("we mgle drzwi latarni otwarte: laterna (Map161), Bazyli przy koszu z ogniem (płonie), soczewka w mosiężnym pierścieniu",
        inLat && lat.at.join() === "5,7" && lat.b && lat.b[2] === false && lat.b[0] === 6 && lat.b[1] === 5 && lat.lens && lat.lens[0] === "!$Latarnia_Soczewka" && lat.lens[1] === 2 && lat.kosz === 2, lat);
    // the vision: a white screen, the round board, one sentence; the event waits
    await t.eval("(function(){ $gamePlayer.locate(4, 4); $gamePlayer.setDirection(6); $gameMap.events().find(e => /<Latarnia:soczewka>/.test(e.event().note)).start(); return 0; })()");
    await t.until("Latarnia.visionBusy()", 10);
    await t.frames(150);
    const vis = await t.json(`(function(){ const sp = SceneManager._scene.children.find(c => c._white && c._pic); return { busy: Latarnia.visionBusy(), run: $gameMap.isEventRunning(),
        white: sp ? sp._white.opacity : 0, pic: sp && sp._pic.bitmap ? sp._pic.bitmap._url : "", seen: Object.keys(Latarnia.state().visions) }; })()`);
    if (SHOT) await t.shot(path.join(SHOTS, "latarnia_wizja.png"));
    t.check("wizja w soczewce: biały ekran, okrągła plansza (Latarnia_Wizja_N), zdanie; zdarzenie czeka", vis.busy && vis.run && vis.white > 200 && /Latarnia_Wizja_\d/.test(vis.pic) && vis.seen.length === 1, vis);
    await t.press("ok");
    await t.until("!Latarnia.visionBusy()", 15);
    await t.finish();
    const v1 = await t.json(`({ n: Latarnia.seenCount(), heavy: $gameSystem.hasBuff('ciezkaGlowa'), notes: ($gameSystem._journal.notes || []).map(n => n.title).filter(t => /Księga mgieł:/.test(t)), free: !$gameMap.isEventRunning() })`);
    const resisted = (await t.popups()).some(p => /Hart ducha/.test(p));
    t.check("...po wizji: notatka „Księga mgieł: ...”, Ciężka głowa do południa (albo Hart ducha ją odparł), gra idzie dalej",
        v1.n === 1 && v1.notes.length === 1 && (v1.heavy || resisted) && v1.free, v1);
    await t.popups({ clear: true });
    await t.eval("(function(){ $gameMap.events().find(e => /<Latarnia:soczewka>/.test(e.event().note)).start(); return 0; })()");
    await t.frames(30);
    const twice = await t.popups();
    t.check("drugi raz tej samej nocy: „Szkło nie pokazuje dwa razy tej samej nocy”, bez wizji", twice.some(p => /dwa razy/.test(p)) && (await t.json("Latarnia.seenCount()")) === 1, twice);
    if (SHOT) { await t.locate(5, 6, 8); await t.frames(30); await t.shot(path.join(SHOTS, "latarnia_laterna.png")); }
    // the other two visions on two more fog nights (straight through the API: the screen is checked above)
    await t.eval("(function(){ Sky.forceMist(0.95, 15); $gameSystem._dayNightDay = 14; $gameSystem.setDayNightHour(23.5); return 0; })()");
    await t.frames(10);
    await t.eval("(function(){ Latarnia.seeVision(Latarnia.visionFor(Latarnia.nightNow()).n); Sky.forceMist(0.95, 17); $gameSystem._dayNightDay = 16; $gameSystem.setDayNightHour(23.5); return 0; })()");
    await t.frames(10);
    await t.eval("(function(){ Latarnia.seeVision(Latarnia.visionFor(Latarnia.nightNow()).n); return 0; })()");
    await t.frames(20);
    const v3 = await t.json(`({ n: Latarnia.seenCount(), step: TownQuests.rec('D22').step, mgla: !!TownQuests.state().flags.mgla })`);
    t.check("trzy mgliste noce - trzy wizje (w dowolnej kolejności): D22 przechodzi do rozmowy z Bazylem; wizja 2 daje flagę „mgla” (poszlaka W12)", v3.n === 3 && v3.step === 1 && v3.mgla, v3);
    const g1 = await t.gold();
    const end = await t.talkTo(B, ["Powiem ci"]);
    await t.frames(130);
    const d22 = await t.json(`({ done: TownQuests.isDone('D22'), card: !!TownQuests.state().flags.kronikaKarta5, told: !!TownQuests.state().flags.latarniaPowiedzial, bag: TownQuests.vcount('karta_5') })`);
    t.check("koniec D22: Bazyli pyta, co widziałeś („Powiem ci”); 60 G, karta 5 (kronikaKarta5 - Pustelnia.js daje kartę do torby)",
        d22.done && d22.card && d22.told && (await t.gold()) === g1 + 60 && d22.bag === 1 && /Co widziałeś/.test(end.text), [d22, end.text.slice(-200)]);

    // ---------------------------------------------------------------- K49: tran dla latarni
    await t.eval("(function(){ $gameSystem._dayNightDay = 24; $gameSystem.setDayNightHour(23); return 0; })()");
    await t.frames(30);
    const k49o = await t.talkTo(B, ["Przyniosę"]);
    t.check("K49 „Tran dla latarni” od dnia 24 (prom już nie wozi tranu): oferta i przyjęcie", (await t.json("TownQuests.isActive('K49')")) && /prom nie przywozi tranu/.test(k49o.text.replace(/\s+/g, " ")), k49o.text.slice(0, 200));
    // Janek sells oil while K49 is on
    await t.go(125, 12, 8, 8);
    await t.setDay(24, 10);
    await t.eval("(function(){ const q = TownQuests.state(); q.flags.janekMet = q.flags.janekMet || 1; for (const k of ['K47', 'K48', 'W10', 'D20', 'D25']) q.declined[k] = 24; return 0; })()");
    await t.frames(40);
    await t.gold(40);
    const jt = await t.talkTo("TownLife.eventOf('janek')", ["Kupię dzbanek"]);
    t.check("Janek na przystani sprzedaje tran, póki trwa K49: 6 G za dzbanek", (await t.count(177)) === 1 && (await t.gold()) === 34 && /Tran\?/.test(jt.text), [jt.text.slice(0, 200), await t.count(177), await t.gold()]);
    await t.give(177, 3); await t.give(61, 6);
    await t.go(159, 22, 16, 8);
    await t.setDay(24, 16);
    await t.frames(40);
    const f1 = await S("s.fuel"), g2 = await t.gold();
    const k49 = await t.talkTo(B, []);
    const k49r = await t.json(`({ done: TownQuests.isDone('K49'), ufa: !!TownQuests.state().flags.latarniaUfa, tran: $gameParty.numItems($dataItems[177]), wood: $gameParty.numItems($dataItems[61]) })`);
    t.check("...oddane: 4× Tran i 6× Drewno; nagroda 30 G, latarniaUfa, opał latarni +5,5 nocy", k49r.done && k49r.ufa && k49r.tran === 0 && k49r.wood === 0
        && (await t.gold()) === g2 + 30 && Math.abs((await S("s.fuel")) - Math.min(20, f1 + 5.5)) < 0.01, [k49r, k49.text.slice(-200)]);
    await t.setDay(24, 12);
    await t.eval("(function(){ $gamePlayer.locate(22, 10); $gamePlayer.setDirection(8); $gameMap.events().find(e => /<Latarnia:wieza>/.test(e.event().note)).start(); return 0; })()");
    t.check("po K49 drzwi latarni otwarte także za dnia (laterna)", await t.until(t.onMap(161), 20));

    // ---------------------------------------------------------------- W11 „Soczewka”: droga przez kradzież i sprzedaż
    await t.eval("(function(){ window.__actTwo = Wyspa.actTwo; Wyspa.actTwo = () => true; $gameSystem._dayNightDay = 70; $gameSystem.setDayNightHour(10); TownQuests.autoChecks(); return 0; })()");
    t.check("W11 zaczyna się sam w Akcie II (po spotkaniu Bazylego)", await t.json("TownQuests.isActive('W11') && TownQuests.rec('W11').step === 0"));
    await t.go(8, 26, 30, 2);
    await t.setDay(70, 10);
    await t.frames(60);
    const balt = await t.talkTo("TownLife.eventOf('kupiec')", ["Nie sprzedam"]);
    t.check("rozdz. 1: Baltazar w kantorze chce „szkiełka z latarni” za 400 G; odmowa", /Czterysta/.test(balt.text) && (await t.json("TownQuests.rec('W11').step")) === 1, balt.text.slice(0, 250));
    await t.go(159, 22, 16, 8);
    await t.setDay(70, 16);
    await t.frames(40);
    const warn = await t.talkTo(B, []);
    const raid = await S("s.raid");
    t.check("rozdz. 2: ostrzeżenie - Bazyli widział to we mgle: przyjdą jutro w nocy; napad zapisany na noc z dnia 71 na 72",
        /jutro w nocy/.test(warn.text) && raid && raid.day === 71 && raid.state === "wait" && (await t.json("TownQuests.rec('W11').step")) === 2, [raid, warn.text.slice(-150)]);
    // nobody watching: they come and go - the lens stolen
    await t.go(8, 26, 30, 2);
    await t.setDay(72, 4);
    await t.frames(60);
    const st = await t.json(`({ lens: Latarnia.state().lens, step: TownQuests.rec('W11').step, f: !!TownQuests.state().flags.latarniaSkradziona })`);
    t.check("rozdz. 3: nikt nie czuwał - po trzeciej w nocy soczewka skradziona (flaga latarniaSkradziona, rozdz. 4)", st.lens === "stolen" && st.step === 3 && st.f, st);
    // the thieves' camp in the cove the next night: two asleep, one awake, the sack
    await t.go(159, 19, 33, 4);
    await t.setDay(72, 22);
    await t.frames(50);
    const camp = await t.json(`({ men: Humans.humans().filter(h => h._tag === 'latarniaZlodzieje' && !h._dead).map(h => [h._kind, h._mode]), sack: !!$gameMap.event(630) && $gameMap.event(630).opacity() })`);
    t.check("następnej nocy złodzieje czekają w zatoczce: dwóch śpi, jeden czuwa; worek (zdarzenie 630) widoczny",
        camp.men.length === 3 && camp.men.filter(m => m[1] === "sleep").length === 2 && camp.sack === 255, camp);
    await t.eval("(function(){ Humans.clear('latarniaZlodzieje'); $gameMap.event(630).start(); return 0; })()");
    await t.frames(30);
    const got = await t.json(`({ lens: Latarnia.state().lens, v: TownQuests.vcount('soczewka'), step: TownQuests.rec('W11').step })`);
    t.check("worek złodziei: soczewka w torbie (rozdz. 5)", got.lens === "bag" && got.v === 1 && got.step === 4, got);
    // Kleofas reads what the lens is
    await t.go(156, 6, 7, 8);
    await t.setDay(73, 10);
    await t.frames(60);
    await t.talkTo("TownLife.eventOf('pustelnik')", []);
    await t.frames(10);
    const kl = await t.talkTo("TownLife.eventOf('pustelnik')", []);
    const kln = await t.json(`({ step: TownQuests.rec('W11').step, notes: ($gameSystem._journal.notes || []).map(n => n.title) })`);
    t.check("rozdz. 5: brat Kleofas czyta w kronikach: „Oko Strażnicy”, z kryształu Pierwszych, nie odłamek Serca (notatka)",
        /Oko Strażnicy/.test(kl.text.replace(/\s+/g, " ")) && /kryształu Pierwszych/.test(kl.text.replace(/\s+/g, " ")) && kln.step === 5 && kln.notes.includes("Oko Strażnicy"), [kln, kl.text.slice(0, 300)]);
    await t.go(159, 22, 16, 8);
    await t.setDay(73, 16);
    await t.frames(40);
    await t.talkTo(B, ["Sprzedam je"]);
    t.check("rozdz. 6: wybór u Bazylego - „Sprzedam je Baltazarowi” (rozdz. 7)", (await t.json("TownQuests.rec('W11').step")) === 6);
    await t.go(8, 26, 30, 2);
    await t.setDay(74, 10);
    await t.frames(60);
    const g3 = await t.gold();
    await t.talkTo("TownLife.eventOf('kupiec')", []);
    const sell = await t.json(`({ done: TownQuests.isDone('W11'), f: !!TownQuests.state().flags.soczewkaSprzedana, lens: Latarnia.state().lens, block: Latarnia.lensBlock() })`);
    t.check("rozdz. 7: soczewka sprzedana Baltazarowi za 400 G (flaga soczewkaSprzedana); w laternie pusty pierścień, wizji już nie będzie",
        sell.done && sell.f && sell.lens === "sold" && (await t.gold()) === g3 + 400 && sell.block && /płynie na ląd/.test(sell.block.pop), sell);

    // ---------------------------------------------------------------- W11: druga droga - obrona i rozbicie
    await t.eval(`(function(){ const q = TownQuests.state(); delete q.q.W11; delete q.flags.soczewkaSprzedana; const s = Latarnia.state(); s.lens = 'whole'; s.raid = null;
        $gameSystem._dayNightDay = 80; $gameSystem.setDayNightHour(16); TownQuests.autoChecks(); TownQuests.completeStep('W11'); return TownQuests.rec('W11').step; })()`);
    await t.go(159, 22, 16, 8);
    await t.setDay(80, 16);
    await t.frames(40);
    await t.talkTo(B, []);
    await t.setDay(82, 0.6);
    await t.frames(60);
    const raiders = await t.json("Humans.humans().filter(h => h._tag === 'latarniaNapad' && !h._dead).map(h => h._kind)");
    t.check("napad: czuwając na przylądku po północy - trzech ludzi idzie na latarnię (Humans: bandyta, nożownik, bandyta)", raiders.length === 3, raiders);
    await t.eval("(function(){ Humans.clear('latarniaNapad'); return 0; })()");
    await t.frames(60);
    const def = await t.json(`({ f: !!TownQuests.state().flags.latarniaObroniona, lens: Latarnia.state().lens, step: TownQuests.rec('W11').step })`);
    t.check("...pokonani: latarnia obroniona (flaga latarniaObroniona), soczewka na miejscu, od razu rozdz. 5", def.f && def.lens === "whole" && def.step === 4, def);
    await t.setDay(82, 16);
    await t.frames(40);
    await t.talkTo(B, []);
    t.check("Bazyli daje soczewkę do pustelnika", (await S("s.lens")) === "bag");
    await t.eval("(function(){ TownQuests.completeStep('W11'); return 0; })()");
    await t.talkTo(B, ["Rozbij je"]);
    const br = await t.json(`({ done: TownQuests.isDone('W11'), f: !!TownQuests.state().flags.soczewkaRozbita, lens: Latarnia.state().lens })`);
    t.check("wybór „Rozbij je”: flaga soczewkaRozbita, latarnia świeci dalej, pęknięte szkło - Bazyli traci wizje", br.done && br.f && br.lens === "broken", br);
    await t.eval("(function(){ Wyspa.actTwo = window.__actTwo; return 0; })()");

    // ---------------------------------------------------------------- zatoczka szczątków po sztormie
    const wreck = await t.json(`(function(){ const sv = Survival.weatherPlan; Survival.weatherPlan = d => (d === 85 ? { type: 'rain', start: 14, end: 18, power: 4, storm: { start: 14, end: 16 } } : null);
        $gameSystem._dayNightDay = 86; $gameSystem.setDayNightHour(10); const w0 = $gameParty.numItems($dataItems[61]);
        Latarnia.wreckage(null); const w1 = $gameParty.numItems($dataItems[61]); Latarnia.wreckage(null); const w2 = $gameParty.numItems($dataItems[61]);
        Survival.weatherPlan = sv; return [w0, w1, w2]; })()`);
    t.check("zatoczka szczątków: po sztormie morze wyrzuca drewno (raz na sztorm)", wreck[1] >= wreck[0] + 3 && wreck[2] === wreck[1], wreck);
});
