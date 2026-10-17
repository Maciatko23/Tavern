// PAKIET 0 (rusztowanie) sześciu nowych miejsc Kruczej Wyspy (docs/miejsca_wyspy/PAKIETY.md). Sprawdza wspólne części, zanim
// pakiety A-F zaczną budować:
//   - wtyczki Wyspa_Data / Wyspa i 12 szkieletów pakietów stoją na swoich miejscach (pod TownLife_Data, pod CzerwonaWoda) i się ładują
//   - mapy 155-157, 159-163, 165-167 są w MapInfos (158 i 164 wolne), przedmioty 177-179, przełączniki 17-20
//   - rejestr numerów zdarzeń: 600-699 rozdane pakietom (Pustelnia, Kruk, Latarnia, Garnizon, Wrak, Cysterna, Wyspa)
//   - TownLife: mieszkaniec z window.TownLifeExtra dostaje SWÓJ stały numer (949 w teście), zajęty numer / klucz jest odrzucony
//   - TownQuests: paczka z window.TownQuestsPacks dochodzi do zadań (K99 w teście), zajęty numer zadania jest odrzucony
//   - przejścia z przystani (Map125) i z gór (Map013) pojawiają się dopiero, gdy miejsce jest gotowe (Wyspa.ready / force);
//     przejście z górnej krawędzi przystani prowadzi na Map155 (24,34)
//   - pływy: dwa odpływy na dobę, przełącznik 20 idzie za Wyspa.tide()
// Przed instalacją: GAME_OVERLAY=tools/miejsca_wyspy/staging (dane z folderu roboczego) - wtyczki dopisuje sam test, gdy ich nie ma
// w js/plugins.js. Po instalacji test działa tak samo bez nakładki.
// (2026-10-16, integracja) Wszystkie sześć pakietów zbudowanych i zainstalowanych: ich paczki zadań stoją obok testowych, miejsca same
// zgłaszają Wyspa.ready (przejścia na przystani są od razu), Map155 to prawdziwa mapa, nie szkielet.
// Uruchom: CDP_PORT=9495 GAME_OVERLAY=tools/miejsca_wyspy/staging node tests/wyspa_szkielet_test.js (serwer: node tools/serve.js)
const kit = require("./lib/kit.js");

const DATA_PLUGINS = ["Wyspa_Data", "Pustelnia_Data", "Kruk_Data", "Latarnia_Data", "Garnizon_Data", "Wrak_Data", "Cysterna_Data"];
const ENGINE_PLUGINS = ["Wyspa", "Pustelnia", "Kruk", "Latarnia", "Garnizon", "Wrak", "Cysterna"];
// (w stronie, przed grą) wtyczki dopisane do listy, jeśli js/plugins.js jeszcze ich nie ma; testowy mieszkaniec i paczka zadań
const BEFORE = `(function(){
    let real;
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const add = (after, names) => { let i = v.findIndex(p => p.name === after);
            for (const n of names) { const j = v.findIndex(p => p.name === n); if (j >= 0) { i = j; continue; }
                v.splice(++i, 0, { name: n, status: true, description: "(test)", parameters: {} }); window.__wyspaAdded = (window.__wyspaAdded || 0) + 1; } };
        add("TownLife_Data", ${JSON.stringify(DATA_PLUGINS)});
        add("CzerwonaWoda", ${JSON.stringify(ENGINE_PLUGINS)});
        real = v; } });
    const res = (key, id) => ({ key, id, name: "Test " + key, title: "test", sheet: "$Npc_Janek", map: 155, speed: 3,
        plan: [[0, "stand", "nigdzie"]], barks: {}, talk: { day: ["Test."] } });
    window.TownLifeExtra = [res("wyspa_test", 949), res("wyspa_dubel", 949), res("wyspa_zajety", 920), Object.assign(res("janek", 948), {})];
    const quest = id => ({ id, kind: "K", title: "Test " + id, giver: "wyspa_test", icon: 88, where: "-", when: "-", desc: "test",
        offer: { cond: { day: 9999 }, say: ["x"], yes: "a", no: "b", accept: ["a"], decline: ["b"] },
        steps: [{ type: "bring", to: "wyspa_test", need: [[88, 1]], text: "x", remind: ["x"], hero: ["> x"], done: ["x"] }], reward: { gold: 1 } });
    window.TownQuestsPacks = [{ owner: "Test", quests: [quest("K99")], vitems: { wyspa_test: { name: "Testowa rzecz", icon: 0 } } },
                              { owner: "Test2", quests: [quest("K1")], vitems: { list: { name: "dubel", icon: 0 } } }];
})();`;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", beforeLoad: BEFORE }, async t => {
    // ---------------------------------------------------------------- wtyczki
    const pl = await t.json(`(function(){ const n = $plugins.filter(p => p.status).map(p => p.name);
        return { n, added: window.__wyspaAdded || 0, has: ${JSON.stringify(DATA_PLUGINS.concat(ENGINE_PLUGINS))}.map(x => [x, n.indexOf(x)]),
            loaded: { data: !!window.WyspaData, wyspa: !!window.Wyspa, stubs: ["Pustelnia", "Kruk", "Latarnia", "Garnizon", "Wrak", "Cysterna"].map(x => !!Tawerna.api(x) && !!window[x + "Data"]) } }; })()`);
    const at = name => pl.n.indexOf(name);
    t.check("14 wtyczek na swoich miejscach: dane pod TownLife_Data i nad TownLife (TownQuests zaraz pod swoimi danymi), silniki pod CzerwonaWoda i nad CleanHUD",
        pl.has.every(([, i]) => i >= 0) && at("TownLife_Data") < at("Wyspa_Data") && at("Cysterna_Data") < at("TownLife") && at("TownLife") < at("TownQuests_Data")
        && at("TownQuests_Data") + 1 === at("TownQuests") && at("CzerwonaWoda") < at("Wyspa") && at("Cysterna") < at("CleanHUD"), { has: pl.has, added: pl.added });
    t.check("...i wszystkie się ładują (WyspaData, Wyspa, 6 pakietów danych i 6 silników)", pl.loaded.data && pl.loaded.wyspa && pl.loaded.stubs.every(Boolean), pl.loaded);

    // ---------------------------------------------------------------- dane: mapy, przedmioty, przełączniki, numery zdarzeń
    const db = await t.json(`(function(){ const m = {}; for (const id of [155,156,157,158,159,160,161,162,163,164,165,166,167]) m[id] = $dataMapInfos[id] ? [$dataMapInfos[id].name, $dataMapInfos[id].parentId] : null;
        const it = {}; for (const id of [177, 178, 179]) it[id] = $dataItems[id] ? [$dataItems[id].name, $dataItems[id].itypeId] : null;
        return { m, it, sw: [17, 18, 19, 20].map(i => $dataSystem.switches[i]), inj: Tawerna.inject.list().map(r => r.owner + " " + r.ids) }; })()`);
    t.check("mapy 155-157, 159-163, 165-167 w MapInfos (z rodzicami: przystań 125, garnizon 162, Ruiny Zamku 10), 158 i 164 wolne",
        db.m[155][0] === "Pustelnia na klifie" && db.m[157][0] === "Urwisko Kruków" && db.m[159][0] === "Przylądek z latarnią" && db.m[162][0] === "Garnizon nad zatoką"
        && db.m[165][0] === "Wrak na mieliźnie" && db.m[167][0] === "Stara cysterna zakonu" && db.m[167][1] === 10 && db.m[165][1] === 162 && db.m[156][1] === 155
        && db.m[158] === null && db.m[164] === null, db.m);
    t.check("przedmioty 177 Tran (materiał), 178 Mapa z zaznaczeniami i 179 Obrączka z krukiem (kluczowe)",
        JSON.stringify(db.it) === JSON.stringify({ 177: ["Tran", 1], 178: ["Mapa z zaznaczeniami", 2], 179: ["Obrączka z krukiem", 2] }), db.it);
    t.check("przełączniki 17-20 nazwane (krata Urwiska, zasuwa cysterny, mgła na przylądku, odpływ)",
        db.sw.join() === "Wyspa_KrataUrwisko,Wyspa_ZasuwaCysterny,Wyspa_MglaPrzyladek,Wyspa_Odplyw", db.sw);
    const want = ["Pustelnia 600-609", "Kruk 610-629", "Latarnia 630-639", "Garnizon 640-669", "Wrak 670-679", "Cysterna 680-689", "Wyspa 690-699"];
    t.check("rejestr numerów zdarzeń: 600-699 rozdane pakietom i Wyspie", want.every(w => db.inj.includes(w)), db.inj.filter(s => /^(Pustelnia|Kruk|Latarnia|Garnizon|Wrak|Cysterna|Wyspa) /.test(s)));

    // ---------------------------------------------------------------- TownLife: stałe numery mieszkańców z innych wtyczek
    const tl = await t.json(`(function(){ const R = TownLife.RESIDENTS; return { test: R.filter(r => r.key === "wyspa_test").map(r => r.id), dubel: R.some(r => r.key === "wyspa_dubel"),
        zajety: R.some(r => r.key === "wyspa_zajety"), janek: R.filter(r => r.key === "janek").length, homes: TownLife.HOMES ? Array.from(TownLife.HOMES).includes(155) : null }; })()`);
    t.check("TownLifeExtra: mieszkaniec dostaje swój stały numer (949); zajęty numer, numer z listy gry (920) i zajęty klucz (janek) są odrzucone",
        tl.test.join() === "949" && !tl.dubel && !tl.zajety && tl.janek === 1, tl);

    // ---------------------------------------------------------------- TownQuests: paczki zadań
    const tq = await t.json(`(function(){ return { k99: !!TownQuests.Q.K99, k1: TownQuests.Q.K1.title, packs: TownQuestsData.PACKS, vitem: TownQuestsData.VITEMS.wyspa_test && TownQuestsData.VITEMS.wyspa_test.name,
        list: TownQuestsData.VITEMS.list && TownQuestsData.VITEMS.list.name, want: Object.values(WyspaData.PACKAGES).map(p => [p.owner, p.quests.join()]),
        has: Object.values(WyspaData.QUESTS).length === Object.keys(WyspaData.QUESTS).filter(id => !!TownQuests.Q[id]).length }; })()`);
    const testPacks = tq.packs.filter(p => /^Test/.test(p.owner)), owners = tq.packs.map(p => p.owner + ":" + p.quests.join());
    // (the island's own packs only: other plugins add theirs to TownQuestsData.PACKS too - Kantor:W5, Dwor:W7 - and so does this test)
    const islandOwners = new Set(tq.want.map(([o]) => o)), islandPacks = tq.packs.filter(p => islandOwners.has(p.owner));
    t.check("TownQuestsPacks: zadanie K99 i rzecz v:wyspa_test dochodzą; zajęte K1 i v:list zostają takie, jak były",
        tq.k99 && tq.k1 !== "Test K1" && tq.vitem === "Testowa rzecz" && tq.list !== "dubel" && testPacks.length === 2 && testPacks[0].quests.join() === "K99", { testPacks, k1: tq.k1 });
    t.check("...i paczki sześciu pakietów (K49-K53, D22-D28, W11, W12) - każdy ze swoimi zadaniami, wszystkie w TownQuests",
        tq.want.length === 6 && islandOwners.size === 6 && islandPacks.length === 6 && tq.want.every(([o, q]) => owners.includes(o + ":" + q)) && tq.has, { owners, want: tq.want });

    // ---------------------------------------------------------------- przejścia z map użytkownika (dopiero gdy miejsce gotowe)
    await t.eval(`TownLifeData.SPOTS_BY_MAP[155] = Object.assign(TownLifeData.SPOTS_BY_MAP[155] || {}, { nigdzie: [24, 30, 2] }); 0`);   // (miejsce testowego mieszkańca)
    await t.newGame({ map: 125, x: 15, y: 2, dir: 8, hour: 10, day: 3, quiet: true, minimap: false });
    const ready = await t.json("({ ready: Wyspa.readyMaps(), forced: Wyspa.forced(), ev: $dataMap.events.filter(e => e && e.id >= 690 && e.id <= 699).map(e => e.id) })");
    t.check("pakiety same zgłaszają gotowe miejsca (Wyspa.ready 155, 157, 159, 162, 165, 167) - przystań ma przejścia od razu, bez Wyspa.force",
        [155, 157, 159, 162, 165, 167].every(m => ready.ready.includes(m)) && !ready.forced && ready.ev.length === 6, ready);
    await t.eval("Wyspa.force(true); $gamePlayer.requestMapReload(); $gamePlayer.reserveTransfer(125, 15, 2, 8, 0); 0");
    await t.until(`$gameMap.mapId() === 125 && !$gamePlayer.isTransferring()`, 10);
    await t.frames(20);
    const on = await t.json(`$dataMap.events.filter(e => e && e.id >= 690 && e.id <= 699).map(e => [e.id, e.x, e.y, e.pages[0].list[0].parameters.slice(1, 4).join(",")])`);
    t.check("gotowe miejsca: na przystani przejścia 690-692 (14-16,0 -> 155) i 693-695 (21-23,39 -> 162)",
        on.length === 6 && on[0][0] === 690 && on[0][1] === 14 && on[0][2] === 0 && on[0][3] === "155,23,34" && on[5][0] === 695 && on[5][2] === 39 && on[5][3] === "162,23,1", on);
    await t.calm();
    await t.hold("up", 80);
    const went = await t.until(t.onMap(155), 15);
    await t.frames(20);
    const landed = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $dataMap.note]");
    t.check("przejście z górnej krawędzi przystani prowadzi na Map155 (24,34) - prawdziwą mapę pustelni, nie szkielet", went && landed[0] === 155 && landed[1] === 24 && landed[2] === 34 && !/Wyspa:szkielet/.test(landed[3]), landed);
    const res = await t.json(`(function(){ const e = TownLife.eventOf("wyspa_test"); return e ? [e.eventId(), $gameMap.mapId()] : null; })()`);
    t.check("...a testowy mieszkaniec z map: 155 stoi tam jako zdarzenie 949", res && res[0] === 949, res);
    await t.eval("$gamePlayer.reserveTransfer(13, 57, 12, 6, 0); 0");
    await t.until(`$gameMap.mapId() === 13 && !$gamePlayer.isTransferring()`, 10);
    await t.frames(20);
    const gory = await t.json(`$dataMap.events.filter(e => e && e.id >= 690 && e.id <= 699).map(e => [e.id, e.x, e.y, e.pages[0].list[0].parameters[1]])`);
    t.check("w górach (Map013) przejścia 696-698 na prawej krawędzi (59,11-13) -> przylądek 159", gory.length === 3 && gory.every(g => g[1] === 59 && g[3] === 159), gory);

    // ---------------------------------------------------------------- pływy
    const tide = await t.json(`(function(){ const w = [], d = 5; for (let h = 0; h < 24; h += 0.25) w.push(Wyspa.tide(d, h).low ? 1 : 0);
        let lows = 0; for (let i = 1; i < w.length; i++) if (w[i] && !w[i - 1]) lows++;
        const a = Wyspa.lowWaters(5), b = Wyspa.lowWaters(6);
        return { lows, hours: w.reduce((s, x) => s + x, 0) / 4, a, b, now: Wyspa.tide().low, sw: $gameSwitches.value(20) }; })()`);
    t.check("pływy: dwa odpływy na dobę po ok. 3 godziny; następnego dnia ok. 50 minut później",
        (tide.lows === 2 || tide.lows === 1) && tide.hours > 5 && tide.hours < 7.5 && tide.a.length >= 1 && Math.abs((((tide.b[0] - tide.a[0]) % 12.42) + 12.42) % 12.42 - 0.84) < 0.2, tide);
    t.check("przełącznik 20 (odpływ) idzie za Wyspa.tide()", tide.sw === tide.now, tide);
});
