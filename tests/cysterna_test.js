// PAKIET F „Stara cysterna zakonu” (docs/miejsca_wyspy/PAKIETY.md; js/plugins/Cysterna_Data.js + Cysterna.js; mapa z
// tools/cysterna/build.py, grafiki z tools/cysterna/art.py). Sprawdza:
//   - dane: D28 i K53 w zadaniach, numery 680-689 „Cysterna”, mapa 167 gotowa (Wyspa.ready 167)
//   - piętro 30 (Map147, plik bez zmian): Zasuwa główna zamknięta przed W1 rozdz. 7; po nim (flaga cisternOpen) przełącznik 18 i
//     otwarta strona zasuwy -> Map167 (3,20); D28 zaczyna się samo na piętrze 30
//   - pierwsza wizyta: flaga cysternaOtwarta, topielce przy wodzie, zapas 55, poziom wody na mapie (pas 1: jeden rząd północnej
//     ściany zbiornika nad wodą), słup miary (klatka według zapasu)
//   - woda zbiornika poza czerpakiem: popup, menu wody się nie otwiera
//   - Księga racji + słup miary, krata: zamknięta / dźwignia (przełącznik 17) / Urwisko niegotowe (popup) / gotowe (Map157 41,16)
//   - gałąź dworska: zamknięcie (flagi galazDworskaZamknieta, lordCold zawsze - decyzja koordynatora, Opinia +3), koniec D28
//   - czerpak: przed D28 zaklinowany; potem jedno nabranie dziennie (napij się do syta / wiadro / garnek), drugie tego samego dnia -
//     popup; zapas -1; łańcuch nie sięga poniżej 30 (kubeł na sucho, popup); pasy wody na mapie (ściana zbiornika rośnie)
//   - rachunek dnia (miasto 1, dwór 0.5 albo 0, deszcz przez zasuwę i rynny), poniżej 15: studnia na rynku daje jedno nabranie,
//     flaga cysternaNisko, Opinia
//   - K53: zasuwa deszczowa, cztery rynny na Urwisku (zdarzenia 680-683 przy znacznikach pakietu B), kilof albo łopata
//   - powrót drzwiami (2,20) -> Map147 (20,6); zapis i wczytanie (stan „cysterna”)
// Zrzuty: docs/miejsca_wyspy/cysterna_*.png.
// Przed instalacją mapy: nakładka tools/miejsca_wyspy/staging_F (sama się włącza, gdy data/Map167.json to jeszcze szkielet).
// Uruchom: CDP_PORT=9506 node tests/cysterna_test.js   (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");

const ROOT = path.join(__dirname, "..");
const SHOTS = path.join(ROOT, "docs", "miejsca_wyspy");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map167.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_F" : null);

kit.test({ port: 9506, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    if (OVERLAY) console.log("NOTE nakładka: " + OVERLAY);
    const ST = "Cysterna.state()";
    const flagsOf = "TownQuests.state().flags";
    const ev = tag => `$gameMap.events().find(e => /<Cysterna:${tag}>/.test(e.event().note || ""))`;

    // ---------------------------------------------------------------- dane
    await t.until("window.Cysterna && Cysterna.built()", 10);
    const base = await t.json(`({ api: !!window.Cysterna && !!Cysterna.ladle && !Cysterna.skeleton, d28: !!TownQuests.Q.D28, k53: !!TownQuests.Q.K53,
        packs: TownQuestsData.PACKS.filter(p => p.owner === 'Cysterna').map(p => p.quests.join()), inj: Tawerna.inject.list().filter(x => x.owner === 'Cysterna').map(x => x.ids),
        ready: Wyspa.isReady(167), built: Cysterna.built(), levels: Object.keys(CysternaData.LEVEL_TILES).join(),
        water: [TownQuests.Q.D28, TownQuests.Q.K53].some(q => JSON.stringify(q.reward || {}).match(/\\[(129|138|166|167),/)) })`);
    t.check("Cysterna.js i Cysterna_Data.js działają: D28 i K53 w zadaniach (bez wody w nagrodach), numery 680-689 należą do „Cysterna”, mapa 167 gotowa",
        base.api && base.d28 && base.k53 && base.packs.join() === "D28,K53" && base.inj.some(s => /680-689/.test(s)) && base.ready && base.built && !base.water
        && base.levels === "0,2,3,4", base);

    // ---------------------------------------------------------------- piętro 30: zasuwa zamknięta, potem otwarta
    const DAY = 40;
    await t.newGame({ map: 147, x: 20, y: 6, dir: 8, day: DAY, hour: 10, quiet: true, minimap: false });
    await t.eval("Cysterna.drowned(true); 0");
    const shut = await t.json(`(function(){ const z = $gameMap.events().filter(e => /^Zasuwa główna/.test(e.event().name));
        return { n: z.length, pages: z.map(e => e.event().pages.length), idx: z.map(e => e.findProperPageIndex()), sw: $gameSwitches.value(18), d28: TownQuests.rec('D28') }; })()`);
    t.check("piętro 30 przed W1 rozdz. 7: trzy zdarzenia „Zasuwa główna” mają w kodzie drugą stronę, ale stoją zamknięte (przełącznik 18 wyłączony); D28 jeszcze nie",
        shut.n === 3 && shut.pages.every(p => p === 2) && shut.idx.every(i => i === 0) && !shut.sw && !shut.d28, shut);
    await t.eval(`(function(){ const f = ${flagsOf}; f.cisternOpen = ${DAY - 1}; f.sluiceHalf = ${DAY - 5}; f.lordAlly = ${DAY - 5}; return 0; })()`);
    await t.go(147, 20, 6, 8);
    await t.frames(30);
    const open = await t.json(`(function(){ const z = $gameMap.events().filter(e => /^Zasuwa główna/.test(e.event().name));
        return { idx: z.map(e => e.findProperPageIndex()), img: z.map(e => e.direction()), sw: $gameSwitches.value(18), d28: TownQuests.rec('D28'),
            tr: z.map(e => (e.list().find(c => c.code === 201) || {}).parameters) }; })()`);
    t.check("po W1 rozdz. 7 (flaga cisternOpen): przełącznik 18, zasuwa otwarta (strona 2, kraty w górze), przejście -> Map167 (3,20)",
        open.sw && open.idx.every(i => i === 1) && open.img.every(d => d === 8) && open.tr.every(p => p && p[1] === 167 && p[2] === 3 && p[3] === 20), open);
    t.check("...i D28 „Zapas zakonu” zaczyna się samo na piętrze 30", open.d28 && open.d28.s === "active" && open.d28.step === 0, open.d28);
    await t.locate(20, 7, 8);
    await t.frames(150);
    await t.shot(path.join(SHOTS, "cysterna_wejscie.png"));

    // ---------------------------------------------------------------- przez zasuwę do cysterny
    await t.locate(20, 6, 8);
    await t.hold("up", 24);
    const down = await t.until("$gameMap.mapId() === 167 && !$gamePlayer.isTransferring()", 20);
    await t.frames(40);
    const m167 = await t.json(`({ at: [$gamePlayer.x, $gamePlayer.y], w: $dataMap.width, h: $dataMap.height, ts: $dataMap.tilesetId, note: $dataMap.note, name: $dataMap.displayName,
        st: ${ST}, flag: ${flagsOf}.cysternaOtwarta, d28: TownQuests.rec('D28'), drowned: (Creatures.list || []).filter(c => c._tag === 'cysterna' && !c._dead).map(c => [c._kind, c.x, c.y]),
        band: Cysterna.band(), level: Cysterna.level() })`);
    t.check("przejście za zasuwą: Map167 „Stara cysterna zakonu” (3,20), 40 x 28, tileset 12, ciemno jak pod ziemią, nie szkielet",
        down && m167.at[0] === 3 && m167.at[1] === 20 && m167.w === 40 && m167.h === 28 && m167.ts === 12 && /<Dark:on>/.test(m167.note) && /<DarkDay:226>/.test(m167.note)
        && !/szkielet/.test(m167.note) && m167.name === "Stara cysterna zakonu", m167);
    t.check("pierwsza wizyta: flaga cysternaOtwarta, D28 krok 2 (Księga racji i słup miary), zapas 55 (pas 1)",
        m167.st.been === DAY && !!m167.flag && m167.d28.step === 1 && m167.level === 55 && m167.band === 1, { st: m167.st, d28: m167.d28 });
    t.check("w cysternie czają się topielce (Creatures.js) - dwa przy pierwszej wizycie, nie przy samym wejściu",
        m167.drowned.length === 2 && m167.drowned.every(d => d[0] === "topielec" && Math.hypot(d[1] - 3, d[2] - 20) >= 5), m167.drowned);
    await t.eval("Creatures.clear('cysterna'); Cysterna.drowned(false); 0");   // (the next visits: no drowned in the test's way)
    // the water in the map: band 1 = the basin's north row is wall, the next water
    const tiles = await t.json(`(function(){ const k = (x, y) => { const id = $gameMap.tileId(x, y, 0); return id >= 2048 ? Math.floor((id - 2048) / 48) : -1; };
        const pass = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
        return { row9: [8, 12, 25, 30].map(x => k(x, 9)), row10: [8, 12, 25, 30].map(x => k(x, 10)), cause: k(19, 12), passWater: pass(10, 14), passCause: pass(19, 14), passFace: pass(10, 9) }; })()`);
    t.check("zbiornik przy zapasie 55: północna ściana zbiornika wystaje z wody jednym rzędem (A4), niżej woda (A1); grobla przechodnia, woda i ściana nie",
        tiles.row9.every(k => k === 122) && tiles.row10.every(k => k === 0) && tiles.cause === 26 && tiles.passCause && !tiles.passWater && !tiles.passFace, tiles);
    const post0 = await t.json(`(function(){ const p = ${ev("slup")}; return [p.x, p.y, p.direction(), p.pattern(), Cysterna.postFrame(55)]; })()`);
    t.check("słup miary w wodzie przy grobli (22,13): klatka według zapasu (55 -> woda ponad piątym znakiem)",
        post0[0] === 22 && post0[1] === 13 && post0[2] === post0[4][0] && post0[3] === post0[4][1] && post0[4].join() === "4,2", post0);

    // ---------------------------------------------------------------- the tank's water is not drunk
    await t.popups({ clear: true });
    await t.locate(16, 20, 8);
    await t.frames(4);
    await t.press("ok");
    await t.frames(10);
    const tank = await t.json("({ menu: !!$gameTemp._farmMenuOpen, pops: window.__kit.pops.map(p => p.text) })");
    t.check("woda w zbiorniku poza czerpakiem: popup (kożuch szlamu, czysta tylko z czerpaka), menu wody się nie otwiera",
        !tank.menu && tank.pops.some(p => /kożuchem szlamu/.test(p)), tank);

    // ---------------------------------------------------------------- the ladle before D28: wedged
    await t.popups({ clear: true });
    await t.locate(23, 8, 6);
    await t.eval(`${ev("czerpak")}.start(); 0`);
    await t.until("!$gameMap.isEventRunning()", 5);
    const wedged = await t.json(`({ pops: window.__kit.pops.map(p => p.text), menu: !!$gameTemp._farmMenuOpen, draw: ${ST}.drawDay })`);
    t.check("czerpak przed końcem D28: korba zaklinowana (popup), bez menu i bez nabrania", wedged.pops.some(p => /zaklinowana/.test(p)) && !wedged.menu && !wedged.draw, wedged);

    // ---------------------------------------------------------------- the Book of Rations and the post
    const norm = r => Object.assign(r, { text: String(r.text || "").replace(/\s+/g, " ") });
    const book = norm(await t.talkTo(ev("ksiega"), [], { secs: 30 }));
    const post = norm(await t.talkTo(ev("slup"), [], { secs: 20 }));
    const afterRead = await t.json(`({ read: ${ST}.read, d28: TownQuests.rec('D28'), notes: Journal.data().notes.map(n => n.title) })`);
    t.check("Księga racji wodnego: „jedno wiadro na strażnika na dzień”, łańcuch do trzeciego znaku; notatka w dzienniku",
        /Jedno wiadro na strażnika/.test(book.text) && /trzeciego znaku/.test(book.text) && afterRead.notes.includes("Zapiski zakonu: Księga racji wodnego"), { text: book.text.slice(0, 300), notes: afterRead.notes.slice(-3) });
    t.check("słup miary: woda sięga piątego znaku, łańcuch sięga - zapas 55/100; D28 przechodzi do kraty",
        /piątego znaku/.test(post.text) && /w zasięgu/.test(post.text) && /55\/100/.test(post.text) && afterRead.d28.step === 2, { text: post.text, d28: afterRead.d28 });
    await t.eval("Cysterna.hush(); 0");
    await t.locate(20, 12, 6);
    await t.frames(240);
    await t.shot(path.join(SHOTS, "cysterna_zbiornik.png"));

    // ---------------------------------------------------------------- the grate: shut, the lever, the Urwisko not built / built
    await t.popups({ clear: true });
    await t.locate(33, 3, 8);
    await t.hold("up", 20);
    await t.frames(10);
    const g0 = await t.json(`({ map: $gameMap.mapId(), pops: window.__kit.pops.map(p => p.text), sw: $gameSwitches.value(17) })`);
    t.check("krata przelewu (33,2) zamknięta od środka: popup, przełącznik 17 wyłączony", g0.map === 167 && !g0.sw && g0.pops.some(p => /Krata z krukiem/.test(p)), g0);
    await t.locate(34, 3, 8);
    await t.eval(`${ev("dzwignia")}.start(); 0`);
    await t.until("!$gameMap.isEventRunning()", 5);
    await t.frames(20);
    const g1 = await t.json(`({ sw: $gameSwitches.value(17), lever: ${ST}.lever, d28: TownQuests.rec('D28'), page: ${ev("krata")}.findProperPageIndex(), dir: ${ev("krata")}.direction(), lv: ${ev("dzwignia")}.direction() })`);
    t.check("dźwignia: przełącznik 17 (krata na Urwisku otwarta w obie strony), krata podniesiona, D28 przechodzi do gałęzi dworskiej",
        g1.sw && g1.lever === DAY && g1.page === 1 && g1.dir === 8 && g1.lv === 6 && g1.d28.step === 3, g1);
    await t.eval("Cysterna.hush(); 0");
    await t.locate(33, 4, 8);
    await t.frames(240);
    await t.shot(path.join(SHOTS, "cysterna_krata.png"));
    await t.popups({ clear: true });
    await t.eval("window.__isReadyOrig = window.__isReadyOrig || Wyspa.isReady; Wyspa.isReady = id => id === 157 ? false : window.__isReadyOrig(id); 0");
    await t.locate(33, 3, 8);
    await t.hold("up", 20);
    await t.frames(10);
    const g2 = await t.json(`({ map: $gameMap.mapId(), pops: window.__kit.pops.map(p => p.text) })`);
    t.check("Urwisko jeszcze niezbudowane: za kratą kanał zasypany (popup), nikt nie trafia na szkielet mapy", g2.map === 167 && g2.pops.some(p => /zasypany/.test(p)), g2);
    await t.eval("Wyspa.isReady = window.__isReadyOrig; Wyspa.force(true); 0");
    await t.locate(33, 3, 8);
    await t.hold("up", 20);
    const out = await t.until("$gameMap.mapId() === 157 && !$gamePlayer.isTransferring()", 15);
    await t.frames(10);
    const at157 = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
    t.check("gotowe Urwisko: kanał przelewu (33,2) prowadzi na Map157 (41,16)", out && at157[0] === 157 && at157[1] === 41 && at157[2] === 16, at157);
    await t.eval("Wyspa.force(false); 0");
    await t.go(167, 37, 15, 8);
    await t.frames(20);

    // ---------------------------------------------------------------- the manor branch: shut it (the Lord was an ally)
    const op0 = await t.json("TownQuests.opinion()");
    const br = norm(await t.talkTo(ev("galaz"), ["Zamknij"], { secs: 30 }));
    await t.frames(20);
    const b1 = await t.json(`({ st: ${ST}, f: ${flagsOf}, op: TownQuests.opinion(), d28: TownQuests.rec('D28'), page: ${ev("galaz")}.findProperPageIndex(), dir: ${ev("galaz")}.direction(),
        notes: Journal.data().notes.map(n => n.title) })`);
    t.check("gałąź dworska: ślad Feliksa („F.”), wybór - zamknięta: flaga galazDworskaZamknieta, Lord chłodny (lordCold), Opinia +3, zasuwa opuszczona",
        /F\./.test(br.text) && b1.st.branch === "closed" && !!b1.f.galazDworskaZamknieta && !!b1.f.lordCold && b1.op === Math.min(100, op0 + 3) && b1.page === 1 && b1.dir === 2, { text: br.text, st: b1.st, op0, op: b1.op });
    t.check("...D28 „Zapas zakonu” wykonane: notatka „Racje zakonu”", b1.d28.s === "done" && b1.notes.includes("Racje zakonu"), { d28: b1.d28, notes: b1.notes.slice(-3) });
    t.check("rachunek dnia po zamknięciu: dwór 0 (gałąź zamknięta), miasto 1", (await t.json("[Cysterna.manorDrain(), Cysterna.townDrain()]")).join() === "0,1");

    // ---------------------------------------------------------------- the ladle: one draw a day
    await t.eval("$gameSystem.changeStamina && $gameSystem.changeStamina(-30); Cysterna.hush(); 0");
    await t.locate(23, 8, 6);
    await t.frames(200);
    await t.eval(`${ev("czerpak")}.start(); 0`);
    await t.until("!!$gameTemp._farmMenuOpen", 5);
    const menu = await t.json(`(function(){ const m = SceneManager._scene._farmMenu; return { title: SceneManager._scene._farmTitle._title || '', names: m._entries.map(e => e.name), en: m._entries.map(e => e.enabled) }; })()`);
    t.check("czerpak po D28: menu - napij się do syta, bukłak, wiadro, garnek, konewka (jedno nabranie dziś)",
        menu.names[0] === "Napij się do syta" && menu.names.some(n => /bukłak/.test(n)) && menu.names.some(n => /wiadro/.test(n)) && menu.names.some(n => /garnek/.test(n)) && menu.en[0], menu);
    await t.eval("(function(){ const sc = SceneManager._scene, m = sc._farmMenu; m.select(0); sc.onFarmOk(); return 0; })()");
    await t.frames(30);
    const d1 = await t.json(`({ st: ${ST}, play: Cysterna.playing(), frame: Cysterna.ladleFrame(), lv: Cysterna.level() })`);
    await t.shot(path.join(SHOTS, "cysterna_czerpak.png"));
    t.check("napij się do syta: nabranie dnia zużyte, zapas 55 -> 54, kubeł schodzi do wody i wraca pełny",
        d1.st.drawDay === DAY && d1.lv === 54 && d1.st.draws === 1 && d1.play === "1", d1);
    await t.until("!Cysterna.playing()", 10);
    await t.popups({ clear: true });
    await t.eval(`${ev("czerpak")}.start(); 0`);
    await t.until("!$gameMap.isEventRunning()", 5);
    const again = await t.json(`({ pops: window.__kit.pops.map(p => p.text), menu: !!$gameTemp._farmMenuOpen, lv: Cysterna.level() })`);
    t.check("drugie nabranie tego samego dnia: popup (reguła zakonu), menu się nie otwiera, zapas bez zmian",
        again.pops.some(p => /Dziś już czerpałeś/.test(p)) && !again.menu && again.lv === 54, again);

    // ---------------------------------------------------------------- the next day: the bucket; the day's account
    const exp = await t.json(`(function(){ const d = ${DAY + 1}; return { ch: Cysterna.dayChange(d), rain: Cysterna.rainyDay(d) }; })()`);
    await t.setDay(DAY + 1, 9);
    await t.eval("Cysterna.settle(); 0");
    const lv2 = await t.json("Cysterna.level()");
    t.check("nowy dzień: zapas liczy się sam (miasto -1, dwór 0, deszcz przez zamkniętą zasuwę deszczową 0)", Math.abs(lv2 - (54 + exp.ch)) < 0.01 && exp.ch === -1, { lv2, exp });
    await t.give(138, 1);
    await t.eval("Farming.setBagWater(0); 0");
    await t.eval(`${ev("czerpak")}.start(); 0`);
    await t.until("!!$gameTemp._farmMenuOpen", 5);
    await t.eval("(function(){ const sc = SceneManager._scene, m = sc._farmMenu; m.select(m._entries.findIndex(e => /wiadro/.test(e.name))); sc.onFarmOk(); return 0; })()");
    await t.frames(90);
    const bk = await t.json(`({ bag: Farming.bagWater(), st: ${ST}, lv: Cysterna.level() })`);
    t.check("napełnij wiadro (6 porcji) - to jedno nabranie dnia, zapas -1", bk.bag === 6 && bk.st.drawDay === DAY + 1 && Math.abs(bk.lv - (lv2 - 1)) < 0.01, bk);
    await t.until("!Cysterna.playing()", 10);

    // ---------------------------------------------------------------- a clay pot from the bag
    await t.setDay(DAY + 2, 9);
    await t.eval("Cysterna.settle(); 0");
    await t.give(167, 2);
    await t.eval(`${ev("czerpak")}.start(); 0`);
    await t.until("!!$gameTemp._farmMenuOpen", 5);
    await t.eval("(function(){ const sc = SceneManager._scene, m = sc._farmMenu; m.select(m._entries.findIndex(e => /garnek/.test(e.name))); sc.onFarmOk(); return 0; })()");
    await t.frames(20);
    const pot = await t.json(`({ bag: (Farming.farm().vesselBag || {}).clay_pot, st: ${ST} })`);
    t.check("napełnij gliniany garnek z plecaka: jeden garnek pełny (3 porcje), to nabranie dnia",
        pot.bag && pot.bag.length === 1 && pot.bag[0].water === 3 && pot.st.drawDay === DAY + 2, pot);
    await t.until("!Cysterna.playing()", 10);

    // ---------------------------------------------------------------- low water: the chain does not reach, the basin's wall grows
    await t.setDay(DAY + 3, 9);
    await t.eval("Cysterna.settle(); Cysterna.setLevel(24); 0");
    await t.frames(10);
    const low = await t.json(`(function(){ const k = (x, y) => { const id = $gameMap.tileId(x, y, 0); return id >= 2048 ? Math.floor((id - 2048) / 48) : -1; };
        const p = ${ev("slup")}; return { band: Cysterna.band(), rows: [9, 10, 11, 12].map(y => k(10, y)), post: [p.direction(), p.pattern()], want: Cysterna.postFrame(24) }; })()`);
    t.check("zapas 24 (pas 3): ściana zbiornika wystaje trzema rzędami, tilemapa od razu; słup pokazuje obręcz przy trzecim znaku nad wodą",
        low.band === 3 && low.rows.join() === "122,122,122,0" && low.post.join() === low.want.join() && low.want.join() === "2,2", low);
    await t.eval("Cysterna.hush(); 0");
    await t.locate(23, 8, 6);
    await t.frames(240);
    await t.popups({ clear: true });
    await t.eval(`${ev("czerpak")}.start(); 0`);
    await t.frames(60);
    const dry = await t.json(`({ play: Cysterna.playing(), menu: !!$gameTemp._farmMenuOpen, frame: Cysterna.ladleFrame() })`);
    await t.locate(24, 6, 2);
    await t.frames(4);
    await t.shot(path.join(SHOTS, "cysterna_nisko.png"));
    await t.until("!Cysterna.playing()", 10);
    await t.frames(10);
    const dry2 = await t.json(`({ pops: window.__kit.pops.map(p => p.text), st: ${ST}, lv: Cysterna.level() })`);
    t.check("poniżej trzeciego znaku łańcuch nie sięga: kubeł schodzi do końca łańcucha na sucho, popup, bez menu i bez nabrania",
        dry.play === "dry" && !dry.menu && dry2.pops.some(p => /Łańcuch za krótki/.test(p)) && dry2.st.drawDay !== DAY + 3 && dry2.lv === 24, { dry, dry2 });

    // ---------------------------------------------------------------- under 15: the town's well gives less, the town grumbles
    await t.eval("(function(){ Cysterna.setLevel(15.5); Cysterna.state().day = " + (DAY + 2) + "; return 0; })()");
    const op1 = await t.json("TownQuests.opinion()");
    await t.eval("Cysterna.settle(); 0");
    const lowT = await t.json(`({ lv: Cysterna.level(), low: ${ST}.low, f: !!${flagsOf}.cysternaNisko, op: TownQuests.opinion(), band: Cysterna.band() })`);
    t.check("zapas spada poniżej 15: flaga cysternaNisko (uwagi sołtysa i Kuby), Opinia -2, pas 4 (ściana zbiornika czterema rzędami)",
        lowT.lv < 15 && lowT.low === DAY + 3 && lowT.f && lowT.op === Math.max(0, op1 - 2) && lowT.band === 4, { lowT, op1 });
    await t.go(8, 24, 36, 8);
    await t.frames(20);
    const well = await t.json(`(function(){ const ev = $gameMap.event(241) || $gameMap.events().find(e => /<Studnia:/.test(e.event().note || "")); const r = Farming.rationOf(ev);
        const f = Farming.farm(), all = f.rations || (f.rations = {}); all[r.key] = { day: Farming.today(), n: 1 }; window.__kit.pops.length = 0;
        const ok = Farming.rationWell(ev); return { ok, max: r.max, left: Farming.rationLeft(r), pops: window.__kit.pops.map(p => p.text), menu: !!$gameTemp._farmMenuOpen }; })()`);
    // (integration 2026-10-16: no wrapper any more - Cysterna.wellLow() -> TownQuests.wellBonus -1 -> Farming_Plots.rationOf: one draw less)
    const wellBase = await t.json(`(function(){ const ev = $gameMap.event(241) || $gameMap.events().find(e => /<Studnia:/.test(e.event().note || "")); const m = /<Studnia:\\s*(\\d+)/.exec(ev.event().note);
        return { base: Number(m[1]) + (TownQuests.state().flags.sluiceHalf ? TownQuestsData.WELL_BONUS || 0 : 0), low: Cysterna.wellLow(), bonus: TownQuests.wellBonus(8) }; })()`);
    t.check("studnia na rynku przy zapasie poniżej 15: przydział o jedno nabranie mniejszy (" + well.max + " zamiast " + wellBase.base + "), po nim sołtys już nie daje (popup)",
        well.ok === false && !well.menu && well.pops.some(p => /prawie sucha/.test(p)) && well.max === Math.max(1, wellBase.base - 1) && wellBase.low === true, { well, wellBase });
    const well0 = await t.json(`(function(){ const ev = $gameMap.event(241) || $gameMap.events().find(e => /<Studnia:/.test(e.event().note || "")); const r = Farming.rationOf(ev);
        Farming.farm().rations[r.key] = { day: 0, n: 0 }; const ok = Farming.rationWell(ev); const m = !!$gameTemp._farmMenuOpen; if (m) SceneManager._scene.closeFarmMenu(); return { ok, m }; })()`);
    t.check("...pierwsze nabranie dnia studnia dalej daje (menu studni)", well0.ok && well0.m, well0);

    // ---------------------------------------------------------------- K53: the rain gate and the gutters on the Urwisko
    await t.eval("Wyspa.force(true); Cysterna.setLevel(40); 0");
    await t.go(167, 31, 6, 8);
    await t.frames(30);
    const k53a = await t.json(`({ k: TownQuests.rec('K53'), gain: Cysterna.rainGain() })`);
    t.check("po D28 (Urwisko gotowe): K53 „Rynny zakonu” zaczyna się w cysternie; zasuwa deszczowa zamknięta - deszcz nic nie daje",
        k53a.k && k53a.k.s === "active" && k53a.k.step === 0 && k53a.gain === 0, k53a);
    await t.eval("$gameSystem.changeStamina && $gameSystem.changeStamina(100); 0");
    await t.eval(`${ev("deszcz")}.start(); 0`);
    await t.until("!$gameMap.isEventRunning()", 5);
    await t.frames(20);
    const rg = await t.json(`({ st: ${ST}.rainGate, k: TownQuests.rec('K53'), gain: Cysterna.rainGain(), page: ${ev("deszcz")}.findProperPageIndex() })`);
    t.check("zasuwa deszczowa otwarta (strona 2): deszcz daje 1 przez zapchane rynny; K53 - rynny", rg.st && rg.gain === 1 && rg.page === 1 && rg.k.step === 1, rg);
    const gEv = await t.json(`Cysterna.gutterEvents({ events: [null, { id: 1, name: "Miejsce: rynna_1", x: 40, y: 12 }, { id: 2, name: "Miejsce: rynna_2", x: 42, y: 11 },
        { id: 3, name: "Miejsce: rynna_3", x: 44, y: 12 }, { id: 4, name: "Miejsce: rynna_4", x: 46, y: 13 }] }).map(e => [e.id, e.x, e.y, e.pages[0].image.characterName])`);
    t.check("rynny na Urwisku: zdarzenia 680-683 przy znacznikach „Miejsce: rynna_1..4” mapy pakietu B (zapchane: gruz i gniazdo)",
        gEv.length === 4 && gEv.map(e => e[0]).join() === "680,681,682,683" && gEv[2][1] === 44 && gEv[0][3] === "!Cysterna_Rzeczy", gEv);
    await t.popups({ clear: true });
    await t.eval("(function(){ for (const id of [62, 63, 116]) $gameParty.loseItem($dataItems[id], 9); Cysterna.gutter({ eventId: () => 0 }, 1); return 0; })()");
    const noTool = await t.json(`({ pops: window.__kit.pops.map(p => p.text), g: ${ST}.gutters })`);
    t.check("bez kilofa i łopaty: popup „Potrzebujesz kilofa albo łopaty”", noTool.pops.some(p => /kilofa albo łopaty/.test(p)) && !noTool.g[1], noTool);
    const op2 = await t.json("TownQuests.opinion()");
    await t.give(63, 1);
    await t.eval("(function(){ for (let n = 1; n <= 4; n++) { $gameSystem.changeStamina && $gameSystem.changeStamina(100); Cysterna.gutter({ eventId: () => 0 }, n); } return 0; })()");
    const k53b = await t.json(`({ k: TownQuests.rec('K53'), f: !!${flagsOf}.rynnyCzyste, gain: Cysterna.rainGain(), op: TownQuests.opinion(), n: Cysterna.gutterCount() })`);
    t.check("cztery rynny oczyszczone kilofem: K53 wykonane (flaga rynnyCzyste, Opinia +3), deszczowy dzień daje teraz 3",
        k53b.n === 4 && k53b.k.s === "done" && k53b.f && k53b.gain === 3 && k53b.op === Math.min(100, op2 + 3), { k53b, op2 });
    const rainDay = await t.json(`(function(){ for (let d = ${DAY + 3}; d < ${DAY + 80}; d++) if (Cysterna.rainyDay(d)) return [d, Cysterna.dayChange(d)]; return null; })()`);
    t.check("deszczowy dzień przy czystych rynnach i zamkniętej gałęzi: +3 z deszczu, -1 dla miasta = +2", rainDay && rainDay[1] === 2, rainDay);
    await t.eval("Wyspa.force(false); 0");

    // ---------------------------------------------------------------- the way back, the save
    await t.go(167, 3, 20, 4);
    await t.frames(10);
    await t.eval("Creatures.clear('cysterna'); 0");
    await t.hold("left", 20);
    const back = await t.until("$gameMap.mapId() === 147 && !$gamePlayer.isTransferring()", 15);
    await t.frames(10);
    const at147 = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
    t.check("drzwi (2,20) prowadzą z powrotem na piętro 30 (20,6)", back && at147[0] === 147 && at147[1] === 20 && at147[2] === 6, at147);
    const before = await t.json(`JSON.stringify(${ST})`);
    await t.saveTo(1);
    await t.loadFrom(1);
    const after = await t.json(`JSON.stringify(${ST})`);
    t.check("zapis i wczytanie: stan cysterny (zapas, zasuwy, rynny, nabrania) zostaje", before === after && JSON.parse(after).branch === "closed", { before: before.slice(0, 200), after: after.slice(0, 200) });
});
