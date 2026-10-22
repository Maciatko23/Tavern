// PAKIET 0 (rusztowanie) rozszerzeń nowego terenu 21 powiększonych map (docs/rozszerzenia/PLAN.md). Sprawdza wspólne części, zanim
// paczki A-D zaczną budować (i potem w każdej z nich - test kolizji):
//   - 10 wtyczek na swoich miejscach (dane nad TownLife, silniki pod Orzel_Lot) i ładują się
//   - rejestr numerów zdarzeń: Forestry 1000-1999, Okolice 2000-2099, Zasoby/Lowy/Ludzie/Zakon 2100-2899, TownLife 2900-2949
//   - przedmioty 185-249 (puste rezerwy albo już wypełnione przez paczkę), IconSet 33 wiersze, mapy 176-177, przełączniki 21-28
//   - TownLife: mieszkaniec z drugiego zakresu (2949 w teście) wchodzi na swoją mapę
//   - Forestry: na mapie z wstawionym zdarzeniem 2000+ nowa sosna i tak dostaje numer z 1000-1999
//   - kafle: wyłom w żywopłocie Map024 (7-8,29), zatoczka Map125 (15-19 x 65-67), płycizny Map165 (suche w odpływie, zalane w przypływie)
//   - Okolice.checkMap() na 21 mapach: miejsca paczek wolne, przechodnie, dojście pieszo (orle: bez), bez nakładania - 0 kolizji
//   - cień słońca: Okolice.shadowAt zgadza się z Sky.now(); okna godzin zagadki menhirów we wszystkich porach roku
//   - pogoda: dni bez deszczu jak TownQuests.dryDays(); odkrycia i zakładka dziennika „Okolice”; wiersze F9; poprawka Orzel.js
// Uruchom: CDP_PORT=9550 node tests/okolice_szkielet_test.js (serwer: node tools/serve.js)
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");

const DATA_PLUGINS = ["Okolice_Data", "Zasoby_Data", "Lowy_Data", "Ludzie_Data", "Zakon_Data"];
const ENGINE_PLUGINS = ["Okolice", "Zasoby", "Lowy", "Ludzie", "Zakon"];
const MAPS = [3, 4, 17, 18, 20, 21, 22, 23, 13, 175, 120, 8, 24, 111, 168, 125, 155, 157, 159, 162, 165];
const BEFORE = `(function(){
    (window.TownLifeExtra = window.TownLifeExtra || []).push({ key: "okolice_test", id: 2949, name: "Test Okolic", title: "test", sheet: "$Npc_Zolnierz", map: 4, speed: 3,
        plan: [[0, "stand", "nigdzie"]], barks: {}, talk: { day: ["Test."] } });
})();`;

kit.test({ port: 9550, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", beforeLoad: BEFORE }, async t => {
    // ---------------------------------------------------------------- wtyczki
    const pl = await t.json(`(function(){ const n = $plugins.filter(p => p.status).map(p => p.name);
        return { n, has: ${JSON.stringify(DATA_PLUGINS.concat(ENGINE_PLUGINS))}.map(x => [x, n.indexOf(x)]),
            loaded: [!!window.OkoliceData, !!window.Okolice, !!window.ZasobyData, !!window.Zasoby, !!window.LowyData, !!window.Lowy,
                     !!window.LudzieData, !!window.Ludzie, !!window.ZakonData, !!window.Zakon] }; })()`);
    const at = name => pl.n.indexOf(name);
    t.check("10 wtyczek na swoich miejscach: dane pod Dwor_Data i nad TownLife, silniki pod Orzel_Lot i nad TitleScreen",
        pl.has.every(([, i]) => i >= 0) && at("Dwor_Data") < at("Okolice_Data") && at("Zakon_Data") < at("TownLife") && at("Orzel_Lot") < at("Okolice")
        && at("Zakon") < at("TitleScreen"), pl.has);
    t.check("...i wszystkie się ładują", pl.loaded.every(Boolean), pl.loaded);

    // ---------------------------------------------------------------- rejestr numerów
    await t.newGame({ map: 3, x: 25, y: 15, hour: 12, quiet: true, minimap: false });
    const reg = await t.json(`(function(){ const T = Tawerna, tryIt = ids => { try { T.inject(3, { ids, owner: "Obcy", build: () => [] }); return "ok"; } catch (e) { return e.message; } };
        return { list: T.inject.list().map(r => r.owner + " " + r.ids), a: tryIt([2150, 2151]), b: tryIt([2350, 2350]), c: tryIt([2550, 2550]), d: tryIt([2750, 2750]),
            o: tryIt([2050, 2050]), tl: tryIt([2910, 2910]), f: tryIt([1500, 1500]), free: tryIt([3000, 3001]) }; })()`);
    t.check("rejestr: Forestry 1000-1999, Okolice 2000-2099, paczki 2100-2899, TownLife 2900-2949 - obcy właściciel odrzucony, 3000+ wolne",
        /Zasoby/.test(reg.a) && /Lowy/.test(reg.b) && /Ludzie/.test(reg.c) && /Zakon/.test(reg.d) && /Okolice/.test(reg.o) && /TownLife/.test(reg.tl)
        && /Forestry/.test(reg.f) && reg.free === "ok" && reg.list.includes("Forestry 1000-1999"), reg);

    // ---------------------------------------------------------------- dane: przedmioty, ikony, mapy, przełączniki
    const db = await t.json(`(function(){ const it = []; for (let i = 185; i <= 249; i++) it.push($dataItems[i] ? [i, $dataItems[i].name, $dataItems[i].note] : [i, null]);
        const m = {}; for (const id of [176, 177, 178]) m[id] = $dataMapInfos[id] ? [$dataMapInfos[id].name, $dataMapInfos[id].parentId] : null;
        return { it, after: $dataItems.length, m, sw: [21, 22, 23, 24, 25, 26, 27, 28].map(i => $dataSystem.switches[i]) }; })()`);
    t.check("przedmioty 185-249 są (puste rezerwy <Okolice:rezerwa> albo wypełnione przez paczkę), nic za 249",
        db.it.every(([i, name, note]) => name !== null && (name !== "" || /<Okolice:rezerwa>/.test(note))) && db.after === 250, { last: db.it.slice(-2), after: db.after });
    t.check("mapy 176 „Komora pod menhirami” (pod 18) i 177 „Jaskinia przemytników” (pod 125), 178 wolna",
        JSON.stringify(db.m) === JSON.stringify({ 176: ["Komora pod menhirami", 18], 177: ["Jaskinia przemytników", 125], 178: null }), db.m);
    t.check("przełączniki 21-28 nazwane", JSON.stringify(db.sw) === JSON.stringify(["Zas_Studnia", "Zas_rez", "Low_Wylom", "Low_rez", "Lud_Jaskinia", "Lud_rez", "Zak_Komora", "Zak_rez"]), db.sw);
    await t.eval(`(function(){ window.__icon = ImageManager.loadSystem("IconSet"); return 0; })()`);
    await t.until("window.__icon && window.__icon.isReady()", 20);
    const icon = await t.json(`({ w: __icon.width, h: __icon.height })`);
    t.check("IconSet ma 33 wiersze (512x1056: ikony do 527)", icon.w === 512 && icon.h === 1056, icon);

    // ---------------------------------------------------------------- Forestry: numer z 1000-1999 także przy zdarzeniu 2000+
    await t.eval(`(function(){ Tawerna.inject(3, { ids: [2050, 2050], owner: "Okolice", build: () => [Okolice.blank(2050, 5, 5, "test Forestry")] }); return 0; })()`);
    await t.go(4, 20, 15);
    await t.go(3, 25, 15);
    const fo = await t.json(`({ len: $dataMap.events.length, ev: !!$dataMap.events[2050], next: Forestry.nextId(3), range: [Forestry.FIRST_ID, Forestry.LAST_ID] })`);
    t.check("Forestry: na mapie ze zdarzeniem 2050 nowa sosna dostaje pierwszy wolny numer z 1000-1999", fo.ev && fo.len > 2000 && fo.next >= 1000 && fo.next <= 1999 && fo.range[1] === 1999, fo);

    // ---------------------------------------------------------------- TownLife: drugi zakres
    await t.go(4, 20, 15);
    await t.frames(30);
    const tl = await t.json(`(function(){ const e = $gameMap.event(2949); return { e: !!e, note: e ? e.event().note : null, res: TownLife.RESIDENTS.some(r => r.key === "okolice_test" && r.id === 2949),
        range: TownLifeData.EXTRA_RANGE }; })()`);
    t.check("TownLife: mieszkaniec z numerem 2949 (drugi zakres) stoi na swojej mapie (Map004)", tl.e && /<Town:okolice_test>/.test(tl.note) && tl.res, tl);

    // ---------------------------------------------------------------- kafle pakietu 0
    await t.go(24, 7, 28);
    const g24 = await t.json(`(function(){ const w = Okolice.walk([20, 15]); return { gap: [[7,29],[8,29]].map(([x,y]) => [2,8].every(d => $gameMap.isPassable(x, y, d))),
        park: w.has("7,31") && w.has("61,5") && w.has("53,45"), n: w.size }; })()`);
    t.check("Map024: wyłom w żywopłocie (7,29), (8,29) przechodni, ze dworu dojdziesz do zwierzyńca (leśniczówka, obchód gajowego)", g24.gap.every(Boolean) && g24.park, g24);
    await t.go(125, 27, 20);
    const g125 = await t.json(`(function(){ const w = Okolice.walk([27, 20]), cells = []; for (let y = 65; y <= 67; y++) for (let x = 15; x <= 19; x++) cells.push(w.has(x + "," + y));
        return { cells, wall: [[16,64],[17,64]].map(([x,y]) => [2,4,6,8].some(d => $gameMap.isPassable(x, y, d))) }; })()`);
    t.check("Map125: zatoczka x 15-19, y 65-67 dostępna pieszo od drogi; (16,64), (17,64) zostają ścianą (wylot jaskini)", g125.cells.every(Boolean) && !g125.wall.some(Boolean), g125);
    await t.go(165, 20, 15);
    // (Wrak.js reads the tide's level once a frame: a few frames after forcing it)
    const tide = async mode => { await t.eval(`Wyspa.forceTide(${JSON.stringify(mode)}); 0`); await t.frames(3);
        return t.json(`(function(){ const w = Okolice.walk([20, 15]); return [[47,24],[62,18],[71,24]].map(([x,y]) => w.has(x + "," + y)); })()`); };
    const low = await tide("low"), high = await tide("high");
    await t.eval("Wyspa.forceTide(null); 0");
    t.check("Map165: trzy płycizny suche i dostępne z łachy w odpływie, zalane w przypływie", low.every(Boolean) && !high.some(Boolean), { low, high });

    // ---------------------------------------------------------------- kolizje miejsc na 21 mapach
    const all = {};
    let problems = 0, bushes = 0;
    for (const m of MAPS) {
        const e = await t.json(`OkoliceData.ENTRY[${m}]`);
        await t.go(m, e[0], e[1]);
        if (m === 165) { await t.eval(`Wyspa.forceTide("low"); 0`); await t.frames(3); }
        const r = await t.json(`Okolice.checkMap()`);
        if (m === 165) await t.eval(`Wyspa.forceTide(null); 0`);
        all[m] = { spots: r.spots, problems: r.problems, bushes: r.bushes.length };
        problems += r.problems.length;
        bushes += r.bushes.length;
    }
    const bad = Object.keys(all).filter(m => all[m].problems.length).map(m => [m, all[m].problems.slice(0, 6)]);
    t.check("Okolice.checkMap() na 21 mapach: 0 kolizji (miejsc: " + Object.keys(all).reduce((s, m) => s + all[m].spots, 0) + ", losowych krzaków Farming: " + bushes + ")", problems === 0, bad.length ? bad : all);

    // ---------------------------------------------------------------- cień słońca
    await t.go(18, 20, 15);
    await t.setHour(16.5);
    await t.frames(3);
    const sh = await t.json(`(function(){ const now = Sky.now(), d = Tawerna.time.day(), h = Tawerna.time.hour(), s = Okolice.shadowAt(d, h, 96);
        return { now: [now.dx, now.dy, now.flash || false], s: s ? [s.ux, s.uy] : null }; })()`);
    t.check("Okolice.shadowAt: ten sam kierunek cienia co Sky.now() (16:30)", sh.s && !sh.now[2] && Math.abs(sh.s[0] - sh.now[0]) < 1e-3 && Math.abs(sh.s[1] - sh.now[1]) < 1e-3, sh);
    const win = await t.json(`(function(){ const out = {};
        for (const [name, d] of [["wiosna", 1], ["lato", 29], ["jesień", 57], ["zima", 85]]) {
            const hs = []; for (let h = 12; h <= 21.5; h += 0.05) { if (Okolice.underShadow({ x: 50, y: 42 }, { x: 52, y: 43 }, d, h, 96, 0.5)) hs.push(h); }
            const s = hs.length ? Okolice.shadowAt(d, hs[0], 96) : null;
            out[name] = hs.length ? [hs[0].toFixed(2), hs[hs.length - 1].toFixed(2), s.light.toFixed(2)] : null; }
        return out; })()`);
    t.check("zagadka menhirów: cień Strażnika (50,42) sięga dołu (52,43) w każdej porze roku (okno godzin, siła cienia)", Object.values(win).every(Boolean), win);

    // ---------------------------------------------------------------- pogoda, odkrycia, dziennik, F9
    const we = await t.json(`(function(){ const d = Tawerna.time.day(); return { ok: Okolice.dryDaysAt(d) === TownQuests.dryDays(), mine: Okolice.dryDaysAt(d), tq: TownQuests.dryDays(),
        hot: Okolice.hot(d), drought: Okolice.drought(d), rain: Okolice.rainOn(d) }; })()`);
    t.check("pogoda: Okolice.dryDaysAt(dziś) = TownQuests.dryDays()", we.ok, we);
    const disc = await t.json(`(function(){ Okolice.discoverable({ key: "test_okolice", pkg: "0", map: 18, x: 20, y: 15, name: "Miejsce testowe", text: "Test.", near: -1 });
        const before = Okolice.isFound("test_okolice"), ok = Okolice.discover("test_okolice"), again = Okolice.discover("test_okolice");
        const tab = Journal.TABS.includes("Okolice"), def = Journal.TAB_DEFS.find(d => d.name === "Okolice"), items = def ? def.items() : [];
        return { before, ok, again, found: Okolice.isFound("test_okolice"), tab, item: items.some(i => i.okolice === "test_okolice" && i.mark === "done"), legend: def ? def.legend() : "" }; })()`);
    t.check("odkrycie raz (dymek, PD), zakładka dziennika „Okolice” z tym miejscem", !disc.before && disc.ok && !disc.again && disc.found && disc.tab && disc.item, disc);
    const f9 = await t.json(`(function(){ const secs = Okolice.f9.sections(), core = secs.find(s => s.owner === "Okolice");
        const row = core ? Object.assign({ owner: "Okolice" }, core.rows.find(r => r.what === "check")) : null, r = row ? Okolice.f9.ok(row) : null;
        const sp = core ? Object.assign({ owner: "Okolice" }, core.rows.find(r => r.what === "spot")) : null; if (sp) Okolice.f9.pick(sp, 1);
        return { titles: secs.map(s => s.title), check: r, pick: sp ? sp.label : null, go: sp ? Okolice.f9.ok(sp) : null,
        }; })()`);
    const dbg = fs.readFileSync(path.join(__dirname, "..", "js", "plugins", "Debug.js"), "utf8");
    f9.hook = /row\("isleOkolice"/.test(dbg) && /case "isleOkolice"/.test(dbg) && /row\.kind === "isleOkolice"/.test(dbg);
    t.check("F9: sekcja pakietu 0 (miejsca planu, kolizje na mapie), Debug.js ma hak „isleOkolice”", f9.hook && f9.titles.length >= 1 && f9.check && /^Kolizje: 0/.test(f9.check.say) && f9.go && f9.go.go, f9);

    // ---------------------------------------------------------------- poprawka Orzel.js (nazwa strażników klatki)
    const orzel = fs.readFileSync(path.join(__dirname, "..", "js", "plugins", "Orzel.js"), "utf8");
    t.check("Orzel.js: strażnicy klatki mają name: „Myśliwy Czarnych Oczu” (Humans czyta opts.name)", /tag: "orzelStraz", name: "Myśliwy Czarnych Oczu"/.test(orzel) && !/label: "Myśliwy Czarnych Oczu"/.test(orzel));

    await t.done();
});
