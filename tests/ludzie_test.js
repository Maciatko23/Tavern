// PACZKA C „Ludzie” (docs/rozszerzenia/PLAN.md, punkt 6; js/plugins/Ludzie_Data.js + Ludzie.js; mapa 177; tools/rozszerzenia/C/).
// Sprawdza:
//   - wtyczki się ładują: mieszkańcy 2910-2915 w TownLife, Zbych z „alt” na Map021, zadania K63-K66, D34, D35 i ich FX, miejsca
//     (Okolice.registerSpots "C") i 6 odkryć; każde wstawione zdarzenie ma numer 2500-2699 i stoi na polu z planu
//   - C1 mielerz: cykl (tli się / zimny), Zbych przy kopcu w dni wypału, dym, żar nocą, węgiel po 4 G, drewno na wypał;
//     K63 (drewno -> noc wypału: rabusie -> węgiel -> kowal), stal u kowala
//   - C2 pasterz: na Łące, 6 owiec na pastwisku za dnia i w koszarze nocą, co trzeci dzień przy menhirach; handel (koc), koc przy
//     odpoczynku na ziemi; K64 (owca po burzy idzie za bohaterem z Omszałej łąki na Łąkę)
//   - C3 handlarz: cztery postoje wg dnia (wóz, osioł, ognisko), towar dnia, mapa okolic, woda raz na dzień, skup, plotka; K65 (juk)
//   - C4 patrole: pary na Map159 i Map162 (drugi idzie za pierwszym), przeszukanie przy przychylności < 10; K66 (nocny patrol, zasadzka)
//   - C5 obóz kopaczy (W8): namioty, 4 kopaczy (Humans) śpiących nocą, D35 (dziennik, zasypany szyb)
//   - C6 jaskinia: zawalona / zalana / w odpływie wejście na mapę 177; Sławek nocą; D34 (skrzynia -> celnik); stashFound (paczka D)
//   - C7 stare groby Ługów: 3 krzyże x 4 uderzenia, flaga ludGroby
//   - odkrycia w zakładce „Okolice”, braki jako dymki (nie okno), wiersze F9 przenoszą, zapis i wczytanie zachowują stan paczki
// Uruchom: CDP_PORT=9553 node tests/ludzie_test.js   (serwer: node tools/serve.js)
// Jedna część: LUD_ONLY=dane,zdarzenia,mielerz,k63,handlarz,k65,pasterz,k64,patrol,k66,oboz,jaskinia,groby,f9,zapis
const kit = require("./lib/kit.js");
const ONLY = (process.env.LUD_ONLY || "").split(",").filter(Boolean);
const part = name => !ONLY.length || ONLY.includes(name);

kit.test({ port: 9553, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const ev = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talk = async (expr, picks, o) => { const r = await t.talkTo(expr, picks, Object.assign({ secs: 40 }, o || {})); await t.frames(10); return r; };
    const S = () => t.json("Ludzie.state()");
    const rec = id => t.json(`TownQuests.rec(${JSON.stringify(id)})`);
    const flags = () => t.json("TownQuests.state().flags");
    const pops = () => t.popups({ clear: true });
    const shown = id => t.eval(`(function(){ const e = $gameMap.event(${id}); return !!e && !e.isTransparent() && e._ludHidden !== true; })()`);
    const resHere = key => t.json(`(function(){ const e = ${ev(key)}; return e ? { x: e.x, y: e.y, hidden: !!(e._town && e._town.hidden), map: $gameMap.mapId() } : null; })()`);
    const startEv = async (id, frames) => { await t.eval(`(function(){ const e = $gameMap.event(${id}); if (e) e.start(); return 0; })()`); await t.frames(frames || 20); };
    const allPops = [];
    const keepPops = async () => { const p = await pops(); allPops.push(...p); return p; };

    // ---------------------------------------------------------------- dane i wtyczki
    if (part("dane")) {
        const d = await t.json(`({ data: !!(window.LudzieData && LudzieData.ready), eng: !!(window.Ludzie && Ludzie.ready),
            res: TownLife.RESIDENTS.filter(r => r.id >= 2910 && r.id <= 2929).map(r => r.key + ":" + r.id),
            zb: (function(){ const r = TownLife.RESIDENTS.find(x => x.key === "drwal"); return r && r.alt ? [r.alt.map, r.alt.when, (r.away || []).includes("szalas_drzwi")] : null; })(),
            q: ["K63", "K64", "K65", "K66", "D34", "D35"].filter(id => TownQuests.Q[id]),
            fx: ["ludK63Drewno", "ludK63Noc", "ludK63Wegiel", "ludPoBurzy", "ludOwcaIdzie", "ludJuk", "ludPatrolNoc", "ludJaskiniaOtwarta", "ludKomuSkrzynia", "ludSzybKomu", "ludD34Start", "ludD35Start"].filter(k => TownQuests.FX[k]).length,
            spots: Okolice.spots().filter(s => s.pkg === "C").map(s => s.key),
            disc: Okolice.discoverables().filter(x => x.pkg === "C").map(x => x.key),
            homes: [3, 4, 18, 21, 22, 159, 162].filter(m => TownLife.HOMES.has(m)),
            busts: [SpeechBubbles.BUSTS["$Npc_Pasterz:0"], SpeechBubbles.BUSTS["$Npc_Handlarz:0"]],
            items: [210, 211, 212, 213, 214].map(i => $dataItems[i].name), icons: [210, 211, 212, 213, 214].map(i => $dataItems[i].iconIndex),
            f9: (Okolice.f9.sections().find(s => s.owner === "Ludzie") || { rows: [] }).rows.length })`);
        t.check("wtyczki paczki C działają (dane + silnik), wersja nie-szkielet", d.data && d.eng, d);
        t.check("mieszkańcy TownLife 2910-2915: pasterz, handlarz, patrol_latarnia_1/2, patrol_garnizon_1/2",
            d.res.join() === "pasterz:2910,handlarz:2911,patrol_latarnia_1:2912,patrol_latarnia_2:2913,patrol_garnizon_1:2914,patrol_garnizon_2:2915", d.res);
        t.check("Zbych Smolarz (drwal) ma „alt” na Map021 w dni mielerza (ludMielerz), szałas poza domem (away)", JSON.stringify(d.zb) === JSON.stringify([21, "ludMielerz", true]), d.zb);
        t.check("zadania K63-K66, D34, D35 w TownQuests i ich 12 FX", d.q.length === 6 && d.fx === 12, d);
        t.check("miejsca paczki C zarejestrowane (17, bez „jagna_miejsce” paczki A), 6 odkryć", d.spots.length === 17 && !d.spots.includes("jagna_miejsce") && d.disc.length === 6, d);
        t.check("domy TownLife: postoje handlarza (3, 4, 21, 22), menhiry (18), przylądek (159), garnizon (162)", d.homes.length === 7, d.homes);
        t.check("popiersia: Pasterz_Bust, Handlarz_Bust", d.busts.join() === "Pasterz_Bust,Handlarz_Bust", d.busts);
        t.check("przedmioty 210-214 (Przyprawy, Mapa okolic, Skrzynia przemytu, Dziennik kopacza, Wełniany koc), ikony 496-500",
            d.items.join() === "Przyprawy,Mapa okolic,Skrzynia przemytu,Dziennik kopacza,Wełniany koc" && d.icons.join() === "496,497,498,499,500", d);
        t.check("F9: sekcja „Ludzie” z wierszami", d.f9 >= 9, d.f9);
    }

    await t.newGame({ map: 3, x: 25, y: 15, hour: 10, day: 2, quiet: true, minimap: false });
    await t.gold(2000);
    await pops();

    // ---------------------------------------------------------------- zdarzenia na polach z planu
    if (part("zdarzenia")) {
        const out = {};
        let bad = 0, n = 0;
        await t.eval("Ludzie.state().force.camp = true; 0");
        for (const m of [21, 22, 4, 3, 13, 125, 168]) {
            const e = await t.json(`OkoliceData.ENTRY[${m}]`);
            await t.go(m, e[0], e[1]);
            const r = await t.json(`(function(){ const ids = Tawerna.injected(${m}).Ludzie || [], cells = new Set();
                for (const s of Okolice.spots(${m}).filter(s => s.pkg === "C")) for (const [x, y] of Okolice.cellsOf(s)) cells.add(x + "," + y);
                return ids.map(id => { const e = $dataMap.events[id]; return [id, e.x, e.y, id >= 2500 && id <= 2699, cells.has(e.x + "," + e.y)]; }); })()`);
            out[m] = r.filter(x => !x[3] || !x[4]);
            bad += out[m].length;
            n += r.length;
        }
        await t.eval("Ludzie.state().force.camp = false; 0");
        t.check("każde wstawione zdarzenie (" + n + " na 7 mapach) ma numer 2500-2699 i stoi na polu miejsca paczki C", bad === 0 && n > 30, out);
    }

    // ---------------------------------------------------------------- C1 mielerz
    if (part("mielerz")) {
        await t.setDay(8, 10);
        await t.go(21, 51, 21, 8);
        await t.frames(30);
        const k = await t.json(`({ st: Ludzie.kilnState(), burn: Ludzie.mielerzBurning(), core: Tawerna.call("Ludzie", "mielerzBurning"), dir: $gameMap.event(2500)._direction,
            smoke: !$gameMap.event(2501).isTransparent(), home: TownLife.homeOf(TownLife.RESIDENTS.find(r => r.key === "drwal")) })`);
        const zb = await resHere("drwal");
        t.check("dzień 8 (cykl 2): mielerz się tli (wiersz 4 arkusza, dym), Ludzie.mielerzBurning() dla paczki B", k.st === "burn" && k.burn && k.core && k.dir === 4 && k.smoke, k);
        t.check("...Zbych Smolarz mieszka wtedy na Leśnej drodze (alt) i stoi przy kopcu", k.home === 21 && zb && !zb.hidden && zb.map === 21, { k, zb });
        await t.setHour(23);
        await t.frames(25);
        const light = await t.json(`Ludzie.lightsNow().length`);
        t.check("nocą żar mielerza świeci jak ogień (światło w warstwie nocy)", light >= 1, light);
        await t.setHour(10);
        await t.frames(25);
        const g0 = await t.gold(), c0 = await t.count(79);
        await talk(ev("drwal"), ["Kupię węgiel (×1"]);
        t.check("węgiel od Zbycha po 4 G", (await t.count(79)) === c0 + 1 && (await t.gold()) === g0 - 4, { c: await t.count(79), g: await t.gold() });
        await t.give(61, 12);
        await talk(ev("drwal"), ["Dam drewno"]);
        const o = (await S()).order;
        t.check("„Dam drewno na wypał”: 12 polan -> zamówienie (gotowe za 2 dni)", !!o && o.ready === 10 && (await t.count(61)) === 0, o);
        await t.setDay(6, 10);
        await t.go(21, 51, 21, 8);
        const cold = await t.json(`({ st: Ludzie.kilnState(), dir: $gameMap.event(2500)._direction, smoke: $gameMap.event(2501).isTransparent(), zb: (function(){ const e = TownLife.eventOf("drwal"); return e ? !!(e._town && e._town.hidden) : "brak"; })() })`);
        t.check("dzień 6 (cykl 0): mielerz zimny, bez dymu, Zbycha przy kopcu nie ma", cold.st === "cold" && cold.dir === 2 && cold.smoke && cold.zb !== false, cold);
    }

    // ---------------------------------------------------------------- K63
    if (part("k63")) {
        await t.setDay(10, 9);
        await t.eval(`TownQuests.start("K63"); Ludzie.opts.kilnWait = 20; 0`);
        await t.give(61, 12);
        await t.go(111, 23, 28);
        await t.frames(20);
        const zb = await resHere("drwal");
        const h = await talk(ev("drwal"), []);
        const s1 = await S(), r1 = await rec("K63");
        t.check("K63: 12 drewna Zbychowi (Podgrodzie) -> wypał od dziś wieczora, krok „noc wypału”", !!zb && s1.k63 && s1.k63.burn === 10 && r1.step === 1, { zb, k63: s1.k63, r1, text: h.text.slice(-200) });
        await t.setHour(22.5);
        await t.go(21, 50, 21, 8, { calm: false });
        await t.until(`!!Humans.band("ludMielerz")`, 15);
        const band = await t.json(`(function(){ const b = Humans.band("ludMielerz"); return b ? b.members.length : 0; })()`);
        t.check("...w noc wypału pod mielerzem: zasadzka 2 rabusiów (Humans, tag ludMielerz)", band === 2, band);
        await t.eval(`Humans.clear("ludMielerz"); Tawerna.emit("humansDone", { tag: "ludMielerz", killed: 2 }); TownQuests.autoChecks(); 0`);
        const r2 = await rec("K63");
        t.check("...odparci (humansDone) -> krok „odbierz węgiel”", r2.step === 2 && !!(await S()).k63.guarded, r2);
        await t.setDay(12, 9);
        await t.go(111, 23, 28);
        const c0 = await t.count(79);
        await talk(ev("drwal"), []);
        const r3 = await rec("K63");
        t.check("...dzień 12: Zbych daje 10 worków węgla, krok „do kowala”", (await t.count(79)) === c0 + 10 && r3.step === 3, { c: await t.count(79), r3 });
        await t.go(8, 8, 50);
        await t.setHour(10);
        await t.frames(20);
        await t.eval(`(function(){ for (const q of TownQuests.QUESTS) if (q.giver === "kowal" && q.id !== "K63") TownQuests.state().declined[q.id] = Tawerna.time.day(); return 0; })()`);
        const g0 = await t.gold();
        await talk(ev("kowal"), []);
        const r4 = await rec("K63"), f = await flags();
        t.check("...kowal: 40 G, zadanie wykonane, flaga ludKowalRabat", r4.s === "done" && (await t.gold()) >= g0 + 40 && !!f.ludKowalRabat, { r4, g: (await t.gold()) - g0 });
        const s0 = await t.count(143), g1 = await t.gold();
        await talk(ev("kowal"), ["Kupię stal"]);
        t.check("...potem kowal sprzedaje stal za 50 G (raz na dzień)", (await t.count(143)) === s0 + 1 && (await t.gold()) === g1 - 50, { stal: await t.count(143) });
        await t.eval("Ludzie.opts.kilnWait = 0; 0");
    }

    // ---------------------------------------------------------------- C3 handlarz: cztery postoje
    if (part("handlarz")) {
        const stops = [[12, 22, [52, 23]], [13, 21, [54, 19]], [14, 4, [62, 13]], [15, 3, [61, 13]]], seen = [];
        for (const [d, m, at] of stops) {
            await t.setDay(d, 10);
            await t.go(m, at[0], at[1], 8);
            await t.frames(30);
            const r = await resHere("handlarz"), stop = await t.eval("Ludzie.stopMap()");
            const wagon = m === 21 ? true : await shown({ 22: 2520, 4: 2554, 3: 2570 }[m]);
            seen.push([d, m, stop, !!r && !r.hidden, wagon]);
        }
        t.check("handlarz krąży: dzień % 4 = 0 Polna droga, 1 Leśna droga, 2 Łąka, 3 pole dziadka - stoi na postoju, wóz widać",
            seen.every(([d, m, stop, here, wagon]) => stop === m && here && wagon), seen);
        await t.setHour(21);
        await t.frames(25);
        t.check("...wieczorem ognisko przy wozie (płomień, światło nocą)", (await shown(2572)) && (await t.json("Ludzie.lightsNow().length")) >= 1);
        // trade: day 2 (no quest offer yet), Łąka
        await t.setDay(2, 10);
        await t.go(4, 62, 13, 8);
        await t.frames(20);
        const known0 = await t.json("Okolice.discoverables().filter(d => Okolice.known(d.key)).length");
        await talk(ev("handlarz"), ["Słyszałeś"]);
        const known1 = await t.json("Okolice.discoverables().filter(d => Okolice.known(d.key)).length");
        t.check("plotka: jedno nieodkryte miejsce trafia do „Okolic” (Okolice.hint)", known1 === known0 + 1, { known0, known1 });
        const goods = await t.json(`Ludzie.pedlarGoods().map(g => [g.id, $dataItems[g.id].name])`);
        t.check("towar dnia: mapa okolic + 5 rzeczy z listy", goods.length === 6 && goods[0][0] === 211, goods);
        const g0 = await t.gold();
        await talk(ev("handlarz"), ["Pokaż towar", "Mapa okolic"]);
        const map = await t.json(`({ n: $gameParty.numItems($dataItems[211]), rev: Okolice.known ? Okolice.discoverables().every(d => Okolice.known(d.key)) : null })`);
        t.check("Mapa okolic za 60 G: w torbie, wszystkie miejsca znane w „Okolicach”", map.n === 1 && map.rev && (await t.gold()) === g0 - 60, map);
        const g1 = await t.gold();
        await talk(ev("handlarz"), ["Łyk wody"]);
        const g2 = await t.gold();
        await pops();
        await talk(ev("handlarz"), ["Łyk wody"]);
        const p = await keepPops();
        t.check("woda z beczki: łyk za 12 G (drożej w upał), drugi raz tego dnia - dymek „Dziś już piłeś”", g1 - g2 === 12 && p.some(x => /Dziś już piłeś/.test(x)) && (await t.gold()) === g2, { g: g1 - g2, p });
        await t.give(111, 2);
        const g3 = await t.gold();
        await talk(ev("handlarz"), ["Sprzedam", "Wełna"]);
        t.check("skup: wełna po 6 G (o 20% drożej niż w mieście)", (await t.gold()) === g3 + 12 && (await t.count(111)) === 0, (await t.gold()) - g3);
    }

    // ---------------------------------------------------------------- K65
    if (part("k65")) {
        await t.setDay(16, 9);
        await t.eval(`TownQuests.start("K65"); 0`);
        const k = (await S()).k65, spots = [[55, 12], [61, 11], [67, 8]], at = spots[k.spot];
        await t.go(21, at[0], at[1] + 1, 8);
        await t.frames(25);
        const vis = await t.json(`(function(){ const e = $gameMap.event(2505); return e ? [e.x, e.y, !e.isTransparent()] : null; })()`);
        t.check("K65: juk leży przy Leśnej drodze w jednym z 3 miejsc z planu", vis && vis[0] === at[0] && vis[1] === at[1] && vis[2], { vis, at });
        await startEv(2505, 20);
        const r1 = await rec("K65");
        t.check("...podniesiony (v:juk), krok „oddaj juk”", r1.step === 1 && (await t.json("TownQuests.vcount('juk')")) === 1, r1);
        const m = await t.eval("Ludzie.stopMap()"), spot = { 22: [52, 23], 21: [54, 19], 4: [62, 13], 3: [61, 13] }[m];
        await t.go(m, spot[0], spot[1], 8);
        await t.frames(20);
        await talk(ev("handlarz"), []);
        const r2 = await rec("K65"), f = await flags();
        t.check("...oddany handlarzowi: zadanie wykonane, u niego taniej (flaga ludJukRabat)", r2.s === "done" && !!f.ludJukRabat, { r2 });
    }

    // ---------------------------------------------------------------- C2 pasterz i owce
    if (part("pasterz")) {
        const day = await t.eval(`(function(){ for (let d = 3; d < 80; d++) { $gameSystem._dayNightDay = d; if (d % 3 !== 2 && !Ludzie.stormRecently()) return d; } return 3; })()`);
        await t.setDay(day, 10);
        await t.go(4, 52, 46, 8);
        await t.frames(40);
        const a = await t.json(`({ n: Ludzie.sheep().length, size: Ludzie.flockSize(), inZone: Ludzie.sheep().every(s => s.x >= 43 && s.x <= 49 && s.y >= 44 && s.y <= 49), mode: Ludzie.flockWanted() })`);
        const p = await resHere("pasterz");
        t.check("dzień " + day + ", 10:00: pasterz na Łące, " + a.n + " owiec na pastwisku (x 43-49, y 44-49)", p && !p.hidden && a.n === a.size && a.size >= 5 && a.inZone && a.mode === "pasture", { a, p });
        await t.setHour(22);
        await t.go(4, 52, 46, 8);
        await t.frames(30);
        const b = await t.json(`({ cells: Ludzie.sheep().map(s => s.x + "," + s.y), mode: Ludzie.flockWanted() })`);
        const fold = ["51,41", "52,41", "53,41", "51,42", "52,42", "53,42"];
        t.check("22:00: owce w koszarze (wnętrze za płotem z wikliny)", b.mode === "fold" && b.cells.length >= 5 && b.cells.every(c => fold.includes(c)), b);
        const pass = await t.json(`[[50,40],[50,43],[54,42],[52,43]].map(([x, y]) => [x, y, $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())])`);
        t.check("płot koszaru blokuje (50,40), (50,43), (54,42), furtka (52,43) przechodnia", pass[0][2] && pass[1][2] && pass[2][2] && !pass[3][2], pass);
        let d18 = day + 1;
        while (d18 % 3 !== 2) d18++;
        await t.setDay(d18, 10);
        await t.go(18, 68, 34, 8);
        await t.frames(30);
        const c = await t.json(`({ n: Ludzie.sheep().length, home: TownLife.homeOf(TownLife.RESIDENTS.find(r => r.key === "pasterz")) })`);
        const p18 = await resHere("pasterz");
        t.check("co trzeci dzień (" + d18 + "): pasterz ze stadem na pastwisku przy menhirach (Map018)", c.home === 18 && c.n >= 5 && p18 && !p18.hidden, { c, p18 });
        // trade + the blanket
        await t.setDay(day, 10);
        await t.go(4, 52, 46, 8);
        await t.frames(20);
        const g0 = await t.gold();
        await talk(ev("pasterz"), ["Pokaż towar", "Wełniany koc"]);
        t.check("pasterz sprzedaje wełniany koc (25 G)", (await t.count(214)) === 1 && (await t.gold()) === g0 - 25, (await t.gold()) - g0);
        const rest = async () => {
            const R = await t.json(`(function(){
                for (let y = 30; y < 58; y++) for (let x = 10; x < 70; x++) {
                    const ok = $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush"
                        && !(window.Puddles && Puddles.wetAt(x, y)) && Ludzie.sheep().every(s => Math.abs(s.x - x) > 2 || Math.abs(s.y - y) > 2);
                    if (ok && $gameMap.checkPassage(x, y - 1, 0x0f)) return [x, y];
                }
                return null; })()`);
            if (!R) return null;
            await t.eval(`(function(){ $gamePlayer.locate(${R[0]}, ${R[1] - 1}); $gamePlayer.setDirection(2); $gameSystem._lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(); $gameSystem.setStamina(30); return 0; })()`);
            await t.frames(10);
            await t.eval(`(function(){ const m = Farming.menuFor(${R[0]}, ${R[1]}); m.entries.find(e => e.name === "Odpocznij").run(); return 0; })()`);
            await t.until("!!($gamePlayer._toolSwing && $gamePlayer._toolSwing._waiting)", 8, 50);
            await t.frames(10);
            const a0 = await t.eval("$gameSystem.stamina()");
            await t.frames(60);
            const a1 = await t.eval("$gameSystem.stamina()");
            await t.eval(`Input._currentState["down"] = true; 0`); await t.frames(3); await t.eval(`Input._currentState["down"] = false; 0`);
            await t.frames(150);
            return a1 - a0;
        };
        const withKoc = await rest();
        await t.eval("$gameParty.loseItem($dataItems[214], 1); 0");
        const without = await rest();
        await t.give(214, 1);
        t.check("koc: odpoczynek na ziemi o połowę szybszy (około +30 zamiast +20 na godzinę)", withKoc && without && withKoc / without > 1.35 && withKoc / without < 1.65, { withKoc, without });
    }

    // ---------------------------------------------------------------- K64: zabłąkana owca
    if (part("k64")) {
        const day = await t.eval(`(function(){ for (let d = 20; d < 90; d++) { $gameSystem._dayNightDay = d; if (d % 3 !== 2) return d; } return 20; })()`);
        await t.setDay(day, 10);
        await t.eval("Ludzie.state().force.storm = Tawerna.time.day() - 1; 0");
        await t.go(4, 52, 46, 8);
        await t.frames(20);
        const n5 = await t.json("[Ludzie.lostNow(), Ludzie.flockSize(), Ludzie.sheep().length]");
        const off = await talk(ev("pasterz"), ["Przyprowadzę Siwą"]);
        t.check("K64: po burzy w stadzie 5 owiec, pasterz daje zadanie", n5[0] && n5[1] === 5 && (await rec("K64")) && (await rec("K64")).s === "active", { n5, text: off.text.slice(0, 200) });
        const k = (await S()).k64, at = [[40, 40], [60, 38], [72, 30]][k.spot];
        const e17 = await t.json("OkoliceData.ENTRY[17]");
        await t.go(17, e17[0], e17[1], 8);
        await t.frames(30);
        const lost = await t.json(`Ludzie.sheep().filter(s => s._lud.role === "lost").map(s => [s.x, s.y, s._lud.mode])`);
        t.check("...Siwa stoi na Omszałej łące w miejscu z planu", lost.length === 1 && lost[0][0] === at[0] && lost[0][1] === at[1] && lost[0][2] === "lost", { lost, at });
        await t.eval(`(function(){ const s = Ludzie.sheep().find(a => a._lud.role === "lost");
            const c = [[0, 1, 8], [0, -1, 2], [-1, 0, 6], [1, 0, 4]].map(([dx, dy, d]) => [s.x + dx, s.y + dy, d])
                .find(([x, y]) => $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXy(x, y).some(e => e.isNormalPriority() && !e.isThrough()));
            $gamePlayer.locate(c[0], c[1]); $gamePlayer.setDirection(c[2]); return 0; })()`);
        await t.frames(5);
        await t.press("ok");
        await t.frames(70);
        const r1 = await rec("K64"), f1 = await t.json(`Ludzie.sheep().filter(s => s._lud.role === "lost").map(s => s._lud.mode)`);
        t.check("...przycisk akcji przy owcy: idzie za bohaterem, krok „zaprowadź na pastwisko”", f1[0] === "follow" && r1.step === 1, { f1, r1 });
        await t.go(4, 46, 46, 8);
        await t.frames(90);
        const r2 = await rec("K64"), k2 = (await S()).k64;
        t.check("...przeszła z bohaterem na Łąkę, na pastwisku dołącza do stada", !!k2.home && r2.step === 2, { k2, r2 });
        const c0 = await t.count(124);
        await talk(ev("pasterz"), []);
        const r3 = await rec("K64");
        t.check("...pasterz: ser ×3, 30 G, zadanie wykonane (flaga ludOwcaRabat - taniej)", r3.s === "done" && (await t.count(124)) === c0 + 3 && !!(await flags()).ludOwcaRabat, r3);
        await t.eval("Ludzie.state().force.storm = 0; 0");
    }

    // ---------------------------------------------------------------- C4 patrole
    if (part("patrol")) {
        await t.setDay(10, 10);
        await t.go(159, 53, 47, 8);
        await t.frames(150);
        const a = await t.json(`({ l: !!TownLife.eventOf("patrol_latarnia_1"), f: !!TownLife.eventOf("patrol_latarnia_2"), held: TownLife.held("patrol_latarnia_2"),
            hid: [TownLife.eventOf("patrol_latarnia_1"), TownLife.eventOf("patrol_latarnia_2")].map(e => e && e._town && e._town.hidden) })`);
        t.check("przylądek z latarnią 10:00: para żołnierzy na obchodzie (2912 prowadzi, 2913 idzie krok za nim)", a.l && a.f && a.held && !a.hid[0] && !a.hid[1], a);
        await t.go(162, 60, 47, 8);
        await t.frames(120);
        const b = await t.json(`({ l: !!TownLife.eventOf("patrol_garnizon_1"), held: TownLife.held("patrol_garnizon_2") })`);
        t.check("garnizon: druga para (2914, 2915) na obchodzie wybrzeża", b.l && b.held, b);
        await t.eval(`(function(){ TownQuests.state().flags.rochMet = 1; Garnizon.state().favor = 5; Garnizon.state().patrolDay = 0; const e = TownLife.eventOf("patrol_garnizon_1"); $gamePlayer.locate(e.x, e.y + 2); return 0; })()`);
        await pops();
        const g0 = await t.gold();
        await t.until("$gameMap.isEventRunning() || Garnizon.state().patrolDay === Tawerna.time.day()", 10);
        await t.finish(40);
        const p = await keepPops();
        t.check("przychylność garnizonu < 10: patrol przeszukuje torbę (opłata 5 G, raz na dzień - wspólnie z patrolem garnizonu)",
            (await t.eval("Garnizon.state().patrolDay")) === 10 && (await t.gold()) === g0 - 5 && p.some(x => /-5 G/.test(x)), { p, g: (await t.gold()) - g0 });
        await t.eval("Garnizon.state().favor = 20; 0");
    }

    // ---------------------------------------------------------------- K66 nocny patrol
    if (part("k66")) {
        await t.setDay(11, 10);
        await t.eval(`(function(){ TownQuests.state().flags.garnizonPoznany = 1; Garnizon.state().met.rotmistrz = 1; Garnizon.state().favor = 20; TownQuests.start("K66"); return 0; })()`);
        await t.setHour(21.3);
        await t.go(159, 70, 43, 8, { calm: false });
        await t.frames(60);
        const pat = await t.json(`(function(){ const e = TownLife.eventOf("patrol_latarnia_1"); return { on: !!e && !(e._town && e._town.hidden), light: Ludzie.lightsNow().length }; })()`);
        await t.until(`!!Humans.band("ludPatrol")`, 15);
        const band = await t.json(`(function(){ const b = Humans.band("ludPatrol"); return b ? b.members.map(m => m._kind) : []; })()`);
        t.check("K66: nocą (21-24) patrol wychodzi z latarnią; przy ścieżce (70,40) zasadzka: 2 bandytów i nożownik", pat.on && pat.light >= 1 && band.join() === "bandit,bandit,knifer", { pat, band });
        await t.eval(`Humans.clear("ludPatrol"); Tawerna.emit("humansDone", { tag: "ludPatrol", killed: 3 }); TownQuests.autoChecks(); 0`);
        const r1 = await rec("K66");
        t.check("...odparci: krok „zamelduj rotmistrzowi”", r1.step === 1, r1);
        await t.setDay(12, 10);
        await t.go(162, 36, 12, 2);
        await t.frames(20);
        const f0 = await t.eval("Garnizon.favor()"), g0 = await t.gold();
        await t.go(163, 6, 7, 8);
        await t.frames(20);
        await talk(ev("rotmistrz"), []);
        const r2 = await rec("K66");
        t.check("...rotmistrz: 30 G, przychylność garnizonu +5, zadanie wykonane", r2.s === "done" && (await t.gold()) >= g0 + 30 && (await t.eval("Garnizon.favor()")) >= f0 + 5, { r2, f: (await t.eval("Garnizon.favor()")) - f0 });
    }

    // ---------------------------------------------------------------- C5 obóz kopaczy, D35
    if (part("oboz")) {
        await t.setDay(13, 23);
        await t.eval("Ludzie.state().force.camp = true; 0");
        await t.go(13, 101, 76, 8, { calm: false });
        await t.frames(80);
        const a = await t.json(`({ tents: [2590, 2591].map(id => !$gameMap.event(id).isTransparent()), men: Humans.humans().filter(h => h._tag === "ludKopacze" && !h._dead).map(h => [h._mode, h._def ? h._def.name || "" : ""]),
            d35: TownQuests.rec("D35"), fire: !$gameMap.event(2593).isTransparent() })`);
        t.check("obóz kopaczy (W8 od rozdz. 3): namioty, ognisko, 4 kopaczy Czarnych Oczu śpi nocą", a.tents.every(Boolean) && a.fire && a.men.length === 4 && a.men.every(m => m[0] === "sleep"), a);
        t.check("...D35 zaczyna się samo przy obozie", a.d35 && a.d35.s === "active", a.d35);
        await t.locate(102, 73, 4);
        await t.frames(40);
        await startEv(2592, 30);
        const r1 = await rec("D35");
        t.check("...skrzynia dowódcy: Dziennik kopacza (213), krok „co z szybem”", (await t.count(213)) === 1 && r1.step === 1, r1);
        await t.give(93, 1);
        await t.eval("$gameParty.loseItem($dataItems[118], 9); 0");
        await t.locate(105, 72, 8);
        await pops();
        await startEv(2594, 20);
        const p1 = await keepPops();
        t.check("szyb bez piły: dymek „Potrzebujesz piły” (nie okno wiadomości)", p1.some(x => /Potrzebujesz piły/.test(x)) && !(await t.eval("$gameMessage.isBusy()")), p1);
        await t.give(118, 1);
        for (let i = 0; i < 6 && !(await S()).d35.how; i++) { await startEv(2594, 70); }
        const s = await S(), r2 = await rec("D35");
        const after = await t.json(`({ dir: $gameMap.event(2594)._direction, men: Humans.humans().filter(h => h._tag === "ludKopacze" && !h._dead).length, active: Ludzie.campActive() })`);
        t.check("...6 uderzeń (lina + piła): szyb zasypany, kopacze odchodzą, D35 wykonane", s.d35.how === "zasyp" && r2.s === "done" && after.dir === 4 && after.men === 0 && !after.active && (await t.count(93)) === 0, { d35: s.d35, r2, after });
        t.check("odkrycie „Obóz kopaczy Czarnych Oczu”", await t.eval(`Okolice.isFound("lud_oboz")`));
        await t.eval("Ludzie.state().force.camp = false; 0");
    }

    // ---------------------------------------------------------------- C6 jaskinia, D34
    if (part("jaskinia")) {
        await t.setDay(14, 10);
        await t.eval("Ludzie.state().force.cave = false; if (window.Przystan && Przystan.state) Przystan.state().celnikMet = 1; 0");
        await t.go(125, 16, 65, 8);
        await t.frames(20);
        await pops();
        await startEv(2610, 15);
        const p1 = await keepPops();
        await t.eval(`Ludzie.state().force.cave = true; Wyspa.forceTide("high"); 0`);
        await t.frames(5);
        await startEv(2610, 15);
        const p2 = await keepPops();
        t.check("wylot jaskini: przed W5 rozdz. 4 zawalony, w przypływie zalany - dymki", p1.some(x => /zawalony/.test(x)) && p2.some(x => /zalane/.test(x)) && (await t.eval("$gameMap.mapId()")) === 125, { p1, p2 });
        await t.eval(`Wyspa.forceTide("low"); 0`);
        await t.frames(5);
        await startEv(2610, 5);
        const inCave = await t.until(t.onMap(177), 20);
        await t.frames(30);
        const m = await t.json(`({ id: $gameMap.mapId(), note: $dataMap.note, xy: [$gamePlayer.x, $gamePlayer.y], w: $dataMap.width, h: $dataMap.height,
            niche: $gameMap.events().filter(e => /<Ludzie:nisza>/.test(e.event().note)).map(e => e.eventId()), exit: $gameMap.events().some(e => /<Ludzie:jaskinia_wyjscie>/.test(e.event().note)) })`);
        t.check("w odpływie: wejście na mapę 177 „Jaskinia przemytników” (20x14, woda słona, nisza, wyjście)",
            inCave && m.id === 177 && /<Water:salt>/.test(m.note) && m.xy.join() === "3,11" && m.niche.length === 1 && m.exit, m);
        await t.setHour(23);
        await t.eval("Ludzie.spawnSlawek(); 0");
        const sl = await t.json(`(function(){ const b = Humans.band("ludJaskinia"); return b ? b.members.map(h => h._label || h._name || h._kind) : []; })()`);
        t.check("nocą skrzyni pilnuje Sławek (Humans)", sl.length === 1, sl);
        await t.eval(`Humans.clear("ludJaskinia"); 0`);
        await t.setHour(10);
        const niche = m.niche[0];
        await talk(niche, ["Weź skrzynię"]);
        await t.frames(70);
        const r1 = await rec("D34");
        t.check("D34: skrzynia przemytu z niszy (ciężka, 212), zadanie samo się zaczęło, krok „komu oddać”", (await t.count(212)) === 1 && r1 && r1.s === "active" && r1.step === 1, r1);
        await t.locate(3, 11, 2);
        await t.hold("down", 30);
        const outOk = await t.until(t.onMap(125), 20);
        await t.frames(20);
        const back = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
        t.check("wyjście z jaskini (3,12) prowadzi z powrotem do zatoczki (16,65)", outOk && back.join() === "125,16,65", back);
        await t.setHour(18.4);
        await t.go(125, 27, 20);
        await t.frames(40);
        const g0 = await t.gold();
        await talk(ev("celnik"), ["Oddaj skrzynię celnikowi"]);
        const r2 = await rec("D34");
        t.check("...celnik: 40 G, zadanie wykonane, skrzynia oddana", r2.s === "done" && (await t.gold()) >= g0 + 40 && (await t.count(212)) === 0 && !!(await flags()).ludSkrzyniaCelnik, { r2, g: (await t.gold()) - g0 });
        const st = await t.eval(`Ludzie.stashFound()`);
        t.check("Ludzie.stashFound() (skrytka orła paczki D): druga skrzynia, flaga ludObieSkrzynie (komentarz Rocha)", st && (await t.count(212)) === 1 && !!(await flags()).ludObieSkrzynie, await flags());
        await t.eval(`Wyspa.forceTide(null); 0`);
    }

    // ---------------------------------------------------------------- C7 groby Ługów
    if (part("groby")) {
        await t.setDay(15, 10);
        await t.go(168, 88, 27, 8);
        await t.frames(20);
        for (let i = 0; i < 4; i++) await startEv(2650, 70);
        const c1 = await t.json(`({ c: Ludzie.state().graves.c, dir: $gameMap.event(2650)._direction })`);
        t.check("stary krzyż: 4 uderzenia rękami -> oczyszczony (wiersz 1 arkusza)", c1.c[0] === 4 && c1.dir === 4, c1);
        await t.eval("Ludzie.state().graves.c[1] = 3; Ludzie.state().graves.c[2] = 3; 0");
        await t.locate(89, 27, 8); await startEv(2651, 70);
        await t.locate(90, 27, 8); await startEv(2652, 70);
        const g = await S();
        t.check("trzy krzyże czyste: flaga ludGroby (Marta podziękuje), odkrycie „Stare groby Ługów”", !!g.graves.done && !!(await flags()).ludGroby && (await t.eval(`Okolice.isFound("lud_groby")`)), g.graves);
    }

    // ---------------------------------------------------------------- odkrycia, dymki, F9
    if (part("f9")) {
        const found = await t.json(`["lud_mielerz", "lud_koszar", "lud_postoj", "lud_jaskinia"].map(k => [k, Okolice.isFound(k)])`);
        t.check("odkrycia odwiedzonych miejsc w zakładce „Okolice”" + (ONLY.length ? " (część testu)" : ""), ONLY.length > 0 || found.every(x => x[1]), found);
        t.check("braki tylko dymkami (okno wiadomości nie było potrzebne)", allPops.length > 0, allPops.slice(0, 8));
        const row = await t.json(`(function(){ const s = Okolice.f9.sections().find(x => x.owner === "Ludzie"); const r = s.rows.find(x => x.what === "go"); return Okolice.f9.ok(Object.assign({ owner: "Ludzie" }, r)); })()`);
        await t.go(row.go[1], row.go[2], row.go[3], row.go[4]);
        t.check("F9: wiersz „Miejsce” przenosi na miejsce paczki (mielerz, Map021)", row.go[1] === 21 && (await t.eval("$gameMap.mapId()")) === 21, row);
        const stop = await t.json(`(function(){ const s = Okolice.f9.sections().find(x => x.owner === "Ludzie"); const r = Object.assign({ owner: "Ludzie" }, s.rows.find(x => x.what === "stop")); Okolice.f9.pick(r, 2); const o = Okolice.f9.ok(r); return { o, stop: Ludzie.stopMap() }; })()`);
        await t.go(stop.o.go[1], stop.o.go[2], stop.o.go[3], stop.o.go[4]);
        const here = await resHere("handlarz");
        t.check("F9: „Dzień handlarza: Łąka” ustawia dzień postoju i przenosi do wozu", stop.stop === 4 && here && !here.hidden, { stop, here });
    }

    // ---------------------------------------------------------------- zapis i wczytanie
    if (part("zapis")) {
        await t.eval("Ludzie.state().graves.c = [4, 4, 2]; Ludzie.state().shop.map = 7; Ludzie.state().d35.journal = 5; 0");
        const before = await S();
        await t.saveTo(1);
        await t.eval("Ludzie.state().graves.c = [0, 0, 0]; Ludzie.state().shop.map = 0; 0");
        await t.loadFrom(1);
        const after = await S();
        t.check("zapis i wczytanie zachowują stan paczki (Tawerna.state „ludzie”)", JSON.stringify(after) === JSON.stringify(before), { before: before.graves, after: after.graves });
    }
});
