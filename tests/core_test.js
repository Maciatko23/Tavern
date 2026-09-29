// TawernaCore.js + TawernaUI.js (the core, stage 2 of the refactor): registered as they will be - TawernaCore first on the plugin
// list, TawernaUI right after UITheme, HomeDecor / HomeAmbience (the two plugins moved onto the core) at the end - by reordering
// $plugins in the page before the game's own scripts (js/plugins.js itself is not touched). Checks: the order and the boot's newGame;
// the saved state (defaults, versions, migrations, an older save's own key adopted - HomeDecor's _homeDecor too); the event bus
// (priority, once, off, a listener that throws); the core's own events (newGame, mapLeave/mapEnter/mapReady, save, load, dayStart,
// hourChange, sleep, wake); map injection (ids in a range, overlaps refused, an editor's event left alone, an older save gets the
// missing events and loses the orphaned ones, when()); the map updater (every, priority, calm, a throwing one turned off); the calm
// check; tags (arguments, notes, page comments by page, map flags, items); the calendar (seasons as Farming's, Easter, Christmas Eve,
// night); sound (the SE pool, a missing file silent - the game goes on, BGS layers fading, stopBgs); the popup; has/api/call; the
// debug registry; a tiny Scene_MiniGame (the rules card, the pause, quitting, seed, turbo, buttons, the banner, coins, onEnd on the
// map); no console errors. A picture of the demo: docs/architektura/minigra_demo.png
//   CDP_PORT=9398 node tests/core_test.js
const kit = require("./lib/kit.js");
const path = require("path");
const fs = require("fs");

// the plugin list as it will be registered (the page's $plugins is set through this, before plugins.js runs)
const ORDER = `(function(){
    let real;
    const add = (list, name, at) => { const p = { name, status: true, description: "", parameters: {} }; if (at === undefined) list.push(p); else list.splice(at, 0, p); };
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const list = v.filter(p => !["TawernaCore", "TawernaUI", "HomeDecor", "HomeAmbience", "HomeLife"].includes(p.name));
        add(list, "TawernaCore", 0);
        add(list, "TawernaUI", list.findIndex(p => p.name === "UITheme") + 1);
        add(list, "HomeAmbience"); add(list, "HomeDecor"); add(list, "HomeLife");
        real = list;
    } });
    // (the boot's own newGame, heard as soon as the core is there)
    window.__tw = { boot: [] };
    Object.defineProperty(window, "Tawerna", { configurable: true, set(v) {
        Object.defineProperty(window, "Tawerna", { value: v, writable: true, configurable: true });
        setTimeout(() => v.on("newGame", p => window.__tw.boot.push(p)), 0);
    } });
})();`;

kit.test({ port: 9398, beforeLoad: ORDER, plugins: ["TawernaCore", "TawernaUI", "HomeAmbience", "HomeDecor", "HomeLife"], bootCheck: "the game boots",
    errorCheck: "no console errors" }, async t => {
    const J = e => t.json(e), ev = e => t.eval(e);

    // ================= the order
    const order = await J(`(function(){ const n = $plugins.map(p => p.name); return { first: n[0], ui: n.indexOf("TawernaUI"), theme: n.indexOf("UITheme"),
        core: !!(window.Tawerna && Tawerna.VERSION), kit: !!(Tawerna.ui && Tawerna.ui.Scene_MiniGame),
        home: !!(window.HomeDecor && window.HomeAmbience && window.HomeLife), boot: window.__tw.boot }; })()`);
    t.check("TawernaCore is the first plugin, TawernaUI right after UITheme, both loaded (and HomeAmbience / HomeDecor / HomeLife on top of them)",
        order.first === "TawernaCore" && order.ui === order.theme + 1 && order.core && order.kit && order.home, order);
    t.check("the boot's own new game (RPG Maker sets one up for the title) was heard as newGame { boot: true }",
        order.boot.length === 1 && order.boot[0].boot === true, order.boot);

    // ================= the bus
    const bus = await J(`(function(){ const T = Tawerna, out = [];
        const a = p => out.push("a" + p.n), b = p => out.push("b" + p.n), c = p => out.push("c" + p.n);
        T.on("ct.bus", a); T.on("ct.bus", b, { priority: -1 }); T.once("ct.bus", c);
        const n1 = T.emit("ct.bus", { n: 1 }), n2 = T.emit("ct.bus", { n: 2 });
        T.off("ct.bus", a); const n3 = T.emit("ct.bus", { n: 3 });
        const off = T.on("ct.bus2", () => out.push("x")); off(); const n4 = T.emit("ct.bus2");
        return { out, n: [n1, n2, n3, n4] }; })()`);
    t.check("the bus: priority first (b before a), once only once, off - every listener in order, the counts right",
        bus.out.join(",") === "b1,a1,c1,b2,a2,b3" && bus.n.join(",") === "3,2,1,0", bus);
    const before = t.errors().length;
    const thrower = await J(`(function(){ const out = []; Tawerna.on("ct.err", () => { throw new Error("deliberate listener failure"); }, { owner: "CoreTest" });
        Tawerna.on("ct.err", () => out.push("still")); Tawerna.emit("ct.err"); return out; })()`);
    await t.frames(2);
    const told = t.errors().slice(before);
    t.check("a listener that throws is reported (console, with its owner) and the next ones still run",
        thrower[0] === "still" && told.some(l => /ct\.err/.test(l) && /CoreTest/.test(l)), { thrower, told: told.slice(0, 2) });
    t.clearErrors();

    // ================= a new game: the core's own events
    await ev(`(function(){ window.__ev = []; for (const n of Tawerna.EVENTS.core) Tawerna.on(n, p => window.__ev.push([n, p && p.mapId !== undefined ? p.mapId : p && p.day !== undefined ? p.day : null, p && p.from !== undefined ? (typeof p.from === "object" ? p.from.day : p.from) : null])); return 0; })()`);
    t.check("a new game (Map003, no story) comes up", await t.newGame({ quiet: true }));
    let E = await J("window.__ev.map(e => e[0])");
    t.check("newGame, mapLeave, mapEnter and mapReady come in that order on a new game", ["newGame", "mapLeave", "mapEnter", "mapReady"].every((n, i, a) => E.indexOf(n) >= 0 && (i === 0 || E.indexOf(a[i - 1]) < E.indexOf(n))), E);
    await ev("window.__ev.length = 0; 0");
    t.check("a transfer to the meadow (Map004) and back", (await t.go(4, 10, 10)) && (await t.go(3, 22, 14)));
    E = await J("window.__ev");
    const leave = E.find(e => e[0] === "mapLeave"), enter = E.find(e => e[0] === "mapEnter");
    t.check("a transfer: mapLeave { mapId: 3, to 4 }, then mapEnter { mapId: 4, from: 3 }, mapReady", !!leave && leave[1] === 3 && !!enter && enter[1] === 4 && enter[2] === 3 &&
        E.filter(e => e[0] === "mapReady").length >= 2, E);

    // ================= the state
    const st = await J(`(function(){ const T = Tawerna;
        const acc = T.state.define("ctState", () => ({ n: 1, list: [] }), { version: 2, owner: "CoreTest" });
        const s = acc(); s.n = 5; s.list.push("x");
        return { same: acc() === T.state("ctState"), inTw: $gameSystem._tw.ctState === s, v: $gameSystem._tw._v.ctState, n: T.state("ctState").n, keys: T.state.keys().includes("ctState") }; })()`);
    t.check("Tawerna.state: a plain object at $gameSystem._tw[key], the same live object every time, its version kept in _tw._v",
        st.same && st.inTw && st.v === 2 && st.n === 5 && st.keys, st);
    // a save made with version 1, loaded by a plugin that knows version 3 (step by step: 1 -> 2 -> 3)
    const mig = await J(`(function(){ const T = Tawerna;
        T.state("ctMig", { a: 1 }, { version: 1 });
        T.state("ctMig").a = 5;
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents())), savedV = c.system._tw._v.ctMig;
        T.state.define("ctMig", { a: 1, b: 0, c: 0, d: "new" }, { version: 3, migrate: { 2: s => Object.assign(s, { b: 2 }), 3: s => { s.c = s.a + 1; return s; } } });
        DataManager.extractSaveContents(c);
        return { s: T.state("ctMig"), v: T.state.version("ctMig"), savedV }; })()`);
    t.check("a versioned migration on load: v1 {a:5} -> v2 (+b) -> v3 (c = a + 1), a new default field filled in",
        mig.s.a === 5 && mig.s.b === 2 && mig.s.c === 6 && mig.s.d === "new" && mig.v === 3 && mig.savedV === 1, mig);
    // an old-style save: the plugin's own $gameSystem._ctOld (from before the core) is adopted
    const adopt = await J(`(function(){ const T = Tawerna;
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents()));
        if (c.system._tw) delete c.system._tw.ctOld;
        c.system._ctOld = { n: 7, legacy: true };
        T.state.define("ctOld", { n: 0, legacy: false, fresh: 1 }, { version: 2, adopt: "_ctOld", migrate: { 2: s => { s.n2 = s.n * 2; return s; } } });
        DataManager.extractSaveContents(c);
        const s = T.state("ctOld");
        const alias = $gameSystem._ctOld === s, hidden = !Object.keys($gameSystem).includes("_ctOld");
        $gameSystem._ctOld.n = 8;
        const saved = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents())).system;
        return { s, alias, hidden, through: T.state("ctOld").n, savedOld: "_ctOld" in saved, savedNew: saved._tw.ctOld, v: T.state.version("ctOld") }; })()`);
    t.check("an old save's $gameSystem._ctOld is adopted into _tw.ctOld (then migrated v1 -> v2, missing defaults filled)",
        adopt.s.legacy === true && adopt.s.n2 === 14 && adopt.s.fresh === 1 && adopt.v === 2, adopt);
    t.check("... the old key stays as a hidden alias (old code reads and writes the same object) and is never saved again",
        adopt.alias && adopt.hidden && adopt.through === 8 && !adopt.savedOld && adopt.savedNew && adopt.savedNew.n === 8, adopt);
    // the real one: HomeDecor.js (moved onto the core) and a save from before the core with its $gameSystem._homeDecor
    const hd = await J(`(function(){
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents()));
        if (c.system._tw) delete c.system._tw.homeDecor;
        c.system._homeDecor = { v: 1, got: { wolf: 12, receipt: 30 }, kills: { wolf: 2 }, noticeTitle: "Stare zlecenie", seeded: 1 };
        DataManager.extractSaveContents(c);
        const s = HomeDecor.state();
        return { got: s.got, kills: s.kills, title: s.noticeTitle, tw: !!($gameSystem._tw && $gameSystem._tw.homeDecor === s), alias: $gameSystem._homeDecor === s }; })()`);
    t.check("HomeDecor.js: a save from before the core (its $gameSystem._homeDecor) loads - the keepsakes, kills and notice kept in _tw.homeDecor",
        hd.got.wolf === 12 && hd.got.receipt === 30 && hd.kills.wolf === 2 && hd.title === "Stare zlecenie" && hd.tw && hd.alias, hd);
    await ev("SceneManager.goto(Scene_Map); 0");
    await t.until(t.onMap(3), 30);
    await t.frames(20);

    // ================= the calendar
    const cal = await J(`(function(){ const T = Tawerna.time, F = window.Farming;
        const days = []; for (let d = 1; d <= 224; d++) days.push(d);
        return { same: days.every(d => T.season(d) === F.seasonIndex(d)), names: [1, 29, 57, 85, 113].map(d => T.seasonName(d)), len: T.seasonLength(),
            dos: [T.dayOfSeason(1), T.dayOfSeason(28), T.dayOfSeason(30)], year: [T.year(112), T.year(113)],
            easter: days.filter(d => T.isEaster(d)), wig: days.filter(d => T.isWigilia(d)), eq: days.every(d => T.isEaster(d, 4) === HomeDecor.isEaster(d) && T.isWigilia(d, 5) === HomeDecor.isWigilia(d)),
            night: [T.isNight(22), T.isNight(4.9), T.isNight(5), T.isNight(12), T.isNight(20.99)], period: [T.period(12).id, T.period(22).id, T.period(6).id],
            now: [T.day() === $gameSystem.dayNightDay(), T.hour() === $gameSystem.dayNightHour()] }; })()`);
    t.check("Tawerna.time.season = Farming.seasonIndex for days 1-224 (Farming's seasonLength 28); names; day of season; year",
        cal.same && cal.len === 28 && cal.names.join(",") === "Wiosna,Lato,Jesień,Zima,Wiosna" && cal.dos.join(",") === "1,28,2" && cal.year.join(",") === "1,2", cal);
    t.check("Easter days 13-16 of spring, Christmas Eve 12-16 of winter, every year (as HomeDecor had them); night 21-5; DayNightCycle's periods; today's day and hour",
        cal.easter.join(",") === "13,14,15,16,125,126,127,128" && cal.wig.join(",") === "96,97,98,99,100,208,209,210,211,212" && cal.eq && cal.night.join(",") === "true,true,false,false,false" &&
        cal.period.join(",") === "noon,night,dawn" && cal.now.every(Boolean), cal);
    await ev("window.__ev.length = 0; $gameSystem._dayNightDay = 5; $gameSystem.setDayNightHour(10.5); 0");
    await t.frames(3);
    await ev("window.__ev.length = 0; $gameSystem._dayNightDay = 6; 0");
    await t.frames(3);
    await ev("$gameSystem.setDayNightHour(11.2); 0");
    await t.frames(3);
    E = await J("window.__ev");
    const ds = E.find(e => e[0] === "dayStart"), hc = E.filter(e => e[0] === "hourChange");
    t.check("dayStart { day: 6, prev: 5 } when the day changes; hourChange when the hour does", !!ds && ds[1] === 6 && hc.length >= 1, E);
    await ev("window.__ev.length = 0; $gameSystem.setDayNightHour(22); 0");
    await t.frames(2);
    await ev("window.__ev.length = 0; $gameSystem.sleepUntilHour(7); $gameTemp._pendingSummary = null; $gameTemp._atmoAutosave = false; 0");   // (no day summary, no autosave)
    await t.frames(3);
    E = await J("window.__ev");
    const sl = E.findIndex(e => e[0] === "sleep"), wk = E.findIndex(e => e[0] === "wake"), dn = E.findIndex(e => e[0] === "dayStart");
    t.check("sleepUntilHour(7) at 22:00: sleep, then wake { day 7, from day 6 }, then dayStart 7", sl >= 0 && wk > sl && dn > wk && E[wk][1] === 7 && E[wk][2] === 6 && E[dn][1] === 7, E);
    // save / load events
    await ev(`(function(){ window.__ev.length = 0; const c = DataManager.makeSaveContents(); window.__saved = JsonEx.stringify(c); DataManager.extractSaveContents(JsonEx.parse(window.__saved)); return 0; })()`);
    E = await J("window.__ev.map(e => e[0])");
    t.check("save (before the contents are made) and load (after they are taken) are sent", E.indexOf("save") === 0 && E.includes("load"), E);
    await ev("SceneManager.goto(Scene_Map); 0");
    await t.until(t.onMap(3), 30);
    await t.frames(20);

    // ================= injection
    const inj = await J(`(function(){ const T = Tawerna, out = {};
        const page = (list, cond) => ({ conditions: Object.assign({ actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
            switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 }, cond || {}), directionFix: false,
            image: { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, list: list.concat([{ code: 0, indent: 0, parameters: [] }]),
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 0, stepAnime: false, through: true, trigger: 0, walkAnime: false });
        const evd = (id, x, y) => ({ id, name: "CoreTest " + id, note: "<CoreTest:x=" + id + "><Flag>", x, y, pages: [
            page([{ code: 108, indent: 0, parameters: ["<CorePage:first>"] }]), page([{ code: 108, indent: 0, parameters: ["<CorePage:second n=2>"] }], { selfSwitchValid: true, selfSwitchCh: "A" })] });
        window.__ctBuild = [930, 931];
        const build = (data, mapId) => window.__ctBuild.map((id, i) => evd(id, 5 + i, 5)).concat([evd(945, 7, 5)]);   // (945: outside the range)
        T.inject(3, { ids: [930, 939], owner: "CoreTest", build });
        const tryIt = spec => { try { T.inject(3, spec); return "ok"; } catch (e) { return e.message; } };
        out.overlap = tryIt({ ids: [935, 940], owner: "Other", build: () => [] });
        out.reserved = tryIt({ ids: [900, 901], owner: "Other", build: () => [] });
        out.forestry = tryIt({ ids: [5000, 5001], owner: "Other", build: () => [] });
        out.same = tryIt({ ids: [930, 939], owner: "CoreTest", build });
        out.free = tryIt({ ids: [940, 941], owner: "Other", build: () => [] });
        // an editor's own event on an id of the range: left alone
        const own = $dataMap.events.filter(e => e && e.id > 100).map(e => e.id)[0];
        out.own = own;
        T.inject(3, { ids: [own, own], owner: "CoreTestEditor", build: () => [{ id: own, name: "not mine", note: "<Mine>", x: 1, y: 1, pages: [] }] });
        // when(): false - nothing put in
        T.inject(3, { ids: [950 + 3, 953], owner: "CoreTestWhen", when: () => !!window.__ctWhen, build: () => [evd(953, 9, 5)] });
        return out; })()`);
    t.check("id ranges: an overlap with another owner is refused (also a reserved range: Story 901-902, Forestry 1000+), the same owner again and a free range are fine",
        /overlap/.test(inj.overlap) && /Story/.test(inj.reserved) && /Forestry/.test(inj.forestry) && inj.same === "ok" && inj.free === "ok", inj);
    t.check("a transfer onto Map003 again", await t.go(4, 10, 10) && await t.go(3, 22, 14));
    const put = await J(`(function(){ const e = id => $gameMap.event(id); const own = ${inj.own};
        return { a: !!e(930) && !!e(931), out: !!e(945) || !!$dataMap.events[945], note: e(930) && e(930).event().note, meta: e(930) && e(930).event().meta,
            own: $dataMap.events[own] && $dataMap.events[own].name, when: !!$dataMap.events[953], injected: Tawerna.injected(3) }; })()`);
    t.check("the events come into the map's data as it loads (930, 931), with their meta; one outside its range (945) is left out",
        put.a && !put.out && /<CoreTest:x=930>/.test(put.note) && put.meta && put.meta.Flag === true && JSON.stringify(put.injected.CoreTest) === "[930,931]", put);
    t.check("... an editor's own event on an id is left alone; when() false puts nothing in", put.own !== "not mine" && !put.when && !put.injected.CoreTestEditor, put);
    // an older save: made before 931 existed (it is not among the saved events) and with 932 that the data no longer has
    const old = await J(`(function(){
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents()));
        c.map._events[931] = null;
        const o = JsonEx.parse(JsonEx.stringify(c.map._events[930])); o._eventId = 932; c.map._events[932] = o;
        DataManager.extractSaveContents(c);
        SceneManager.goto(Scene_Map);
        return { had931: !!$gameMap._events[931], had932: !!$gameMap._events[932] }; })()`);
    await t.until(t.onMap(3), 30);
    await t.frames(10);
    const fixd = await J("({ e931: !!$gameMap.event(931), e932: !!$gameMap.event(932), e930: !!$gameMap.event(930), sprites: SceneManager._scene._spriteset._characterSprites.filter(s => s._character && [930, 931].includes(s._character._eventId)).length })");
    t.check("an older save on the map: the missing event (931) is added, the orphaned one (932, no data) taken away - before the sprites are made",
        !old.had931 && old.had932 && fixd.e931 && !fixd.e932 && fixd.e930 && fixd.sprites === 2, { old, fixd });

    // ================= tags
    const tags = await J(`(function(){ const T = Tawerna, P = T.parseArgs;
        return {
            kv: P("a=1,b=2, c = x"), pos: P("1.4,60,960,300"), tavern: P('bed room=komnata price=30 name="Komnata z kominkiem" plate="0,-1"'),
            dice: P("dice:grum"), flick: P("0.16,132,84,20"), free: P("Stary Bartek"), neg: P("-1,true,false,#ffcc88"), empty: P("") }; })()`);
    t.check("parseArgs: key=value lists, positional numbers, TavernLife's spaced attributes with quotes, a:b, booleans and colours",
        tags.kv.kv.a === 1 && tags.kv.kv.b === 2 && tags.kv.kv.c === "x" && tags.pos.pos.join(",") === "1.4,60,960,300" &&
        tags.tavern.pos[0] === "bed" && tags.tavern.kv.room === "komnata" && tags.tavern.kv.price === 30 && tags.tavern.kv.name === "Komnata z kominkiem" && tags.tavern.kv.plate === "0,-1" &&
        tags.dice.pos.join(",") === "dice,grum" && tags.flick.pos[0] === 0.16 && tags.free.raw === "Stary Bartek" && tags.neg.pos[0] === -1 && tags.neg.pos[1] === true &&
        tags.neg.pos[3] === "#ffcc88" && tags.empty.pos.length === 0, tags);
    const evTags = await J(`(function(){ const T = Tawerna, e = $gameMap.event(930);
        const first = Object.keys(T.tags(e)).sort().join(","), ct = T.tag(e, "coretest"), up = T.tag(e, "CORETEST");
        const page1 = T.tag(e, "CorePage").pos[0];
        $gameSelfSwitches.setValue([3, 930, "A"], true); e.refresh();
        const page2 = T.tag(e, "CorePage"), data = Object.keys(T.tags(e.event())).sort().join(",");
        $gameSelfSwitches.setValue([3, 930, "A"], false); e.refresh();
        return { first, x: ct && ct.kv.x, same: ct === up, page1, page2: page2 && [page2.pos[0], page2.kv.n], data, back: T.tag(e, "CorePage").pos[0] }; })()`);
    t.check("an event's tags: its note and the comments of the page it is on now (the page changes: its tags too), names case-blind; its data: every page",
        evTags.first === "corepage,coretest,flag" && evTags.x === 930 && evTags.same && evTags.page1 === "first" && evTags.page2 && evTags.page2[0] === "second" &&
        evTags.page2[1] === 2 && evTags.data === "corepage,coretest,flag" && evTags.back === "first", evTags);
    const real = await J(`(function(){ const T = Tawerna;
        const tree = $gameMap.events().find(e => e.event() && /<Tree:[^>]*hits=\\d+/i.test(e.event().note || "")) || $gameMap.events().find(e => e.event() && /<Tree/i.test(e.event().note || ""));
        const hm = tree ? /hits=(\\d+)/i.exec(tree.event().note) : null, want = hm ? Number(hm[1]) : undefined;
        const food = $dataItems.find(i => i && i.meta && /stamina=\\d+/.test(i.meta.Food || ""));
        const stamina = food ? Number((/stamina=(\\d+)/.exec(food.meta.Food) || [])[1]) : null;
        return { tree: tree ? [T.tag(tree, "Tree") ? T.tag(tree, "Tree").kv.hits : "none", want] : null, clouds: T.mapFlag("Clouds", false), dark: T.mapFlag("Dark", "dflt"), mapNote: $dataMap.note,
            food: food ? [T.tag(food, "Food").kv.stamina, stamina] : null, weight: T.tag($dataItems.find(i => i && /<Weight/.test(i.note)), "Weight") }; })()`);
    t.check("the game's own tags: a tree's <Tree:hits=N>, the map's <Clouds:on> (and the default for no <Dark>), an item's <Food:stamina=N>, <Weight:N>",
        real.tree && real.tree[0] === real.tree[1] && real.clouds === true && real.dark === "dflt" && real.food && real.food[0] === real.food[1] && real.weight && real.weight.pos.length === 1, real);

    // ================= the map's updater and the calm check
    const up = await J(`(function(){ const T = Tawerna; window.__up = { a: 0, b: [], calm: 0, order: [] };
        window.__u1 = T.onMapUpdate(() => { window.__up.a++; }, { owner: "CoreTest", name: "every5", every: 5 });
        window.__u2 = T.onMapUpdate(() => { window.__up.calm++; }, { owner: "CoreTest", name: "calm", calm: true });
        window.__u3 = T.onMapUpdate(() => { if (window.__up.order.length < 4) window.__up.order.push("late"); }, { owner: "CoreTest", name: "late", priority: 5 });
        window.__u4 = T.onMapUpdate(() => { if (window.__up.order.length < 4) window.__up.order.push("early"); }, { owner: "CoreTest", name: "early", priority: -5 });
        return { calm: T.isCalm(), why: T.whyNotCalm(), f: Graphics.frameCount }; })()`);
    await t.frames(40);
    const up1 = await J("Object.assign({ f: Graphics.frameCount }, window.__up)");
    t.check("onMapUpdate: every 5 frames (about 8 in 40), a calm one every calm frame, priority orders them (early before late)",
        up.calm && up.why.length === 0 && up1.a >= 7 && up1.a <= 9 && up1.calm >= 38 && up1.order.join(",") === "early,late,early,late", { up, up1 });
    await ev("$gameMessage.add('Spokojnie?'); window.__up.calm = 0; 0");
    await t.frames(20);
    const busy = await J("({ calm: window.__up.calm, isCalm: Tawerna.isCalm(), why: Tawerna.whyNotCalm(), input: Tawerna.isCalm(null, 'input'), noMsg: Tawerna.isCalm(null, { message: false }), only: Tawerna.isCalm(null, { only: ['transfer'] }) })");
    await t.finish();
    await t.frames(10);
    await ev("$gameTemp._farmMenuOpen = true; 0");
    const farm = await J("({ isCalm: Tawerna.isCalm(), why: Tawerna.whyNotCalm(), without: Tawerna.isCalm(null, { farmMenu: false }), strict: Tawerna.whyNotCalm(null, 'strict'), settle: Tawerna.isCalm(null, { farmMenu: false, settle: 1e9 }) })");
    await ev("$gameTemp._farmMenuOpen = false; 0");
    await t.frames(10);
    const back = await J("({ calm: window.__up.calm, isCalm: Tawerna.isCalm() })");
    t.check("a message on screen: not calm (message), the calm updater waits; 'input' and { message: false } and { only } choose the checks",
        busy.calm === 0 && !busy.isCalm && busy.why.includes("message") && !busy.input && busy.noMsg && busy.only, busy);
    t.check("the farm menu open: not calm (farmMenu) unless { farmMenu: false }; settle waits for the map's frames; calm again after, the updater runs again",
        !farm.isCalm && farm.why.join() === "farmMenu" && farm.without && farm.strict.includes("farmMenu") && !farm.settle && back.calm > 0 && back.isCalm, { farm, back });
    const before2 = t.errors().length;
    await ev("window.__u5 = Tawerna.onMapUpdate(() => { throw new Error('deliberate updater failure'); }, { owner: 'CoreTest', name: 'broken' }); 0");
    await t.frames(10);
    const broken = await J("({ on: window.__u5.on, errors: window.__u5.errors, others: window.__up.a, scene: SceneManager._scene.constructor.name, dbg: Tawerna.debug.updaters().filter(u => u.owner === 'CoreTest') })");
    const told2 = t.errors().slice(before2);
    t.check("an updater that throws is reported once and turned off - the map and the other updaters go on",
        broken.on === false && broken.errors === 1 && broken.scene === "Scene_Map" && told2.length === 1 && /broken/.test(told2[0]) && broken.dbg.some(u => u.name === "every5" && u.calls > 0 && u.ms >= 0), { broken, told2 });
    t.clearErrors();
    await ev("for (const k of ['__u1', '__u2', '__u3', '__u4', '__u5']) window[k].off(); 0");

    // ================= sound
    const se = await J(`(function(){ const A = Tawerna.audio; let n = 0; for (let i = 0; i < 20; i++) if (A.se("Cursor1", { volume: 1 })) n++;
        return { budget: n, max: A.seBudget }; })()`);
    await t.frames(2);
    await ev(`(function(){ Tawerna.audio.preload("NoSuchSound_Tawerna"); Tawerna.audio.se("NoSuchSound_Tawerna", { volume: 1 }); return 0; })()`);
    await t.wait(1500);
    await t.frames(30);
    const miss = await J(`(function(){ const A = Tawerna.audio; return { missing: A.isMissing("NoSuchSound_Tawerna"), again: A.se("NoSuchSound_Tawerna"), ok: A.se("Coin", { volume: 1 }),
        scene: SceneManager._scene.constructor.name, retry: !!document.getElementById("retryButton"), f: Graphics.frameCount }; })()`);
    await t.frames(10);
    const goesOn = await ev("Graphics.frameCount") > miss.f;
    t.check("Tawerna.audio.se: at most seBudget SEs a frame (the rest dropped)", se.budget === se.max, se);
    t.check("a missing SE file stays silent: the game goes on (no 'Failed to load', no Retry), next calls refused, a real one still plays",
        miss.missing && miss.again === false && miss.ok === true && miss.scene === "Scene_Map" && !miss.retry && goesOn && !t.errors().some(l => /Failed to load/.test(l)), miss);
    await ev(`(function(){ window.__L = Tawerna.audio.bgsLayer("CoreTest:wind", { name: "Wind3", pitch: 90, max: 22, scale: () => 0.5, owner: "CoreTest" }).set(20, -0.5);
        window.__M = Tawerna.audio.bgsLayer("CoreTest:missing", { name: "NoSuchBgs_Tawerna" }).set(20); return 0; })()`);
    await t.frames(150);
    const lay = await J("({ L: __L.info(), M: __M.info(), bgs: AudioManager.bgsVolume, all: Tawerna.audio.layers().length, scene: SceneManager._scene.constructor.name })");
    await ev("__L.set(0); 0");
    await t.frames(60);
    const lay15 = await J("__L.info()");
    await t.frames(240);
    const lay2 = await J("__L.info()");
    await ev("__L.set(20); 0");
    await t.frames(60);
    await ev("AudioManager.stopBgs(); 0");
    await t.frames(2);
    const lay3 = await J("({ L: __L.info() })");
    const want = +(lay.bgs / 100 * 20 / 100 * 0.5).toFixed(4);
    t.check("a BGS layer fades in to its target (clamped to max), its volume = the game's BGS option x target x scale(), panned",
        lay.L.playing && lay.L.vol === 20 && Math.abs(lay.L.volume - want) < 0.002 && lay.L.pan === -0.5 && lay.scene === "Scene_Map", { lay, want });
    t.check("... set(0) fades it down and stops it when silent; AudioManager.stopBgs() stops every layer; a layer with a missing file stays silent",
        lay15.playing && lay15.vol < 10 && !lay2.playing && lay2.vol === 0 && !lay3.L.playing && lay3.L.vol === 0 && !lay.M.playing, { lay15, lay2, lay3, M: lay.M });
    await ev("__L.set(0); __M.set(0); 0");

    // ================= the popup
    await t.popups({ clear: true });
    const pop = await J(`(function(){ const before = ($gameTemp._lootPopups || []).length;
        const r = [Tawerna.popup("Potrzebujesz siekiery", { icon: 2, kind: "need" }), Tawerna.popup.need(3, "Potrzebujesz łopaty"), Tawerna.popup("Nowa pamiątka", { top: true, color: "#ffd23f", sub: "Kufel" })];
        const list = ($gameTemp._lootPopups || []).slice(before);
        return { r, list: list.map(p => [p.iconIndex, p.text, p.color]) }; })()`);
    const pops = await t.popups(), tops = await t.notices({ clear: true });
    t.check("Tawerna.popup: over the hero (the item's icon, red for a need), popup.need, top: the notice at the top with its second line",
        pop.r.every(Boolean) && pop.list.length === 2 && pop.list[0][0] === 2 && pop.list[0][2] === "#ff9f8f" && pop.list[1][1] === "Potrzebujesz łopaty" &&
        pops.includes("Potrzebujesz siekiery") && tops.some(s => /Nowa pamiątka \| Kufel/.test(s)), { pop, pops, tops });

    // ================= has / api / call, the debug registry
    const reg = await J(`(function(){ const T = Tawerna; return { has: [T.has("Farming"), T.has("RoomLighting"), T.has("NoSuchPlugin"), T.has("HomeDecor")],
        api: [T.api("UITheme") === window.UIStyle, T.api("HomeDecor") === window.HomeDecor, T.api("NoSuchPlugin")], call: [T.call("Farming", "seasonIndex", 29), T.call("NoSuchPlugin", "x") === undefined, T.call("Farming", "noSuchFn") === undefined],
        states: T.debug.states().map(s => s.key), inj: T.debug.injections().map(i => i.owner + " " + i.ids), ups: T.debug.updaters().map(u => u.owner + "." + u.name),
        lines: T.debug.lines(), listeners: Object.keys(T.debug.listeners()).length }; })()`);
    t.check("has / api / call: loaded plugins (also one with no object of its own), UITheme's UIStyle, a plugin's function called, undefined when missing",
        reg.has.join(",") === "true,true,false,true" && reg.api[0] && reg.api[1] && reg.api[2] === null && reg.call[0] === 1 && reg.call[1] === true && reg.call[2] === true, reg);
    t.check("the debug registry: the states (homeDecor, homeAmbience...), the id ranges (reserved and live), the updaters (HomeDecor, HomeAmbience), text lines for F9",
        ["homeDecor", "homeAmbience", "homeLife", "ctState"].every(k => reg.states.includes(k)) && reg.inj.some(s => /^Story 901-902/.test(s)) && reg.inj.some(s => /^Forestry 1000-\.\.\./.test(s)) &&
        reg.inj.some(s => s === "HomeDecor 980-998") && reg.inj.some(s => s === "HomeLife 960-979") && reg.ups.includes("HomeDecor.refresh") && reg.ups.includes("HomeAmbience.sound") && reg.ups.includes("HomeLife.life") && reg.lines.length >= 3 && reg.listeners > 5, reg);

    // ================= a tiny mini-game (Scene_MiniGame)
    await ev(`(function(){
        const ui = Tawerna.ui;
        class Scene_CoreDemo extends Scene_MiniGame {
            createGame() {
                this.setTitle("DEMO", "mała gra rdzenia", 25, ui.COIN_ICON);
                this.setHints([["←→", "wybór"], ["O", "zatwierdź"], ["P", "pauza"]]);
                this.row = new ui.ButtonRow(560, 44); this.row.x = 360; this.row.y = 520;
                this.row.set([{ id: "lose", label: "Przegraj" }, { id: "win", label: "Wygraj", primary: true }, { id: "off", label: "Nieczynne", disabled: true }], 0);
                this.list = new ui.IconList(300, 200, { title: "Rzeczy" }); this.list.x = 40; this.list.y = 90;
                this.list.set([{ icon: 313, text: "Monety", right: "×25" }, { icon: 176, text: "Chleb", right: "×2" }, { icon: 64, text: "Nieczynne", disabled: true }]);
                this.meter = new ui.Meter(300, 26, { label: "Siła", thresholds: [[0.25, ui.COLORS.bad]] }); this.meter.x = 40; this.meter.y = 310; this.meter.set(0.6, "60%");
                this.card2 = new ui.ParchmentCard(300, 230, { seed: 5, title: "Zlecenie", lines: ["Przynieś 3 skóry wilka.", ["Nagroda: 40 G", ui.INK.green]], crease: true }); this.card2.x = 900; this.card2.y = 90;
                this.panelS = new ui.Panel(320, 120, { title: "Panel" }); this.panelS.x = 480; this.panelS.y = 100;
                this.stage.addChild(this.row, this.list, this.meter, this.card2, this.panelS);
                this.purse = 25; this.ticks = 0;
                this.showBusts(ui.heroBust(), "People3_5");
                this.bustR.dim(true);
            }
            begin() { this.showCard({ kicker: "ZASADY", title: "Demo", sub: "Strzałki wybierają, O zatwierdza.", lines: ["Wygraj, by dostać monety."], keys: [["O", "dalej"]], foot: "O - gramy" }); }
            helpLines() { return ["To tylko próba rdzenia.", "Strzałki: wybór, O: zatwierdź."]; }
            tick() {
                this.ticks++;
                if (this.phase === "won") { if (this.coinsDone && !this.banner.visible) this.end({ won: true, purse: this.purse }); return; }
                if (this.phase !== "play") return;
                if (this.rep.left) this.row.move(-1);
                if (this.rep.right) this.row.move(1);
                if (this.trig.ok) {
                    const b = this.row.current();
                    if (b.id === "win") { this.setPhase("won"); this.banner.show("win", "Wygrana!", "+5 G");
                        ui.coinBurst(this.fx, 5, { x: 640, y: 400 }, { x: 1220, y: 30 }, { onEach: () => { this.purse++; this.setTitle("DEMO", "mała gra rdzenia", this.purse, ui.COIN_ICON); },
                            onDone: () => { this.coinsDone = true; } }); }
                    else { this.banner.show("bust", "Pudło!"); this.end({ won: false }); }
                }
            }
            state() { return Object.assign(super.state(), { ticks: this.ticks, focus: this.row.index, purse: this.purse }); }
        }
        Scene_CoreDemo.gameId = "coreDemo";
        window.Scene_CoreDemo = Scene_CoreDemo;
        window.__demo = { ends: [], starts: [] };
        Tawerna.on("miniGameStart", p => window.__demo.starts.push(p.id));
        Tawerna.on("miniGameEnd", p => window.__demo.ends.push([p.id, p.result, SceneManager._scene.constructor.name]));
        return 0; })()`);
    const open1 = await J(`({ open: Tawerna.ui.open(Scene_CoreDemo, { seed: 42, turbo: 3, onEnd: r => { window.__demo.onEnd = [r, SceneManager._scene.constructor.name]; } }), again: Tawerna.ui.open(Scene_CoreDemo, {}) })`);
    const up2 = await t.until("SceneManager._scene instanceof Scene_CoreDemo && SceneManager._scene._started && !SceneManager._scene.isFading()", 20);
    await t.frames(10);
    const s1 = await J(`(function(){ const s = SceneManager._scene, r = Tawerna.ui.rng(42); return Object.assign(s.state(), { rngSame: s.seed === 42, calm: Tawerna.isCalm(), why: Tawerna.whyNotCalm(),
        running: Tawerna.ui.running === s, t0: s.t, f0: Graphics.frameCount }); })()`);
    await t.frames(10);
    const s1b = await J("({ t: SceneManager._scene.t, f: Graphics.frameCount })");
    t.check("Tawerna.ui.open: the demo scene runs (a second open refused), the rules card first, not calm (miniGame, not on the map), the seed kept",
        open1.open === true && open1.again === false && up2 && s1.card === "info" && s1.running && !s1.calm && s1.why.includes("miniGame") && s1.rngSame && s1.id === "coreDemo", { open1, s1 });
    t.check("turbo 3: three logic ticks a frame", (s1b.t - s1.t0) >= 3 * (s1b.f - s1.f0) - 3 && (s1b.t - s1.t0) <= 3 * (s1b.f - s1.f0) + 3, { s1, s1b });
    const demoPic = path.join(__dirname, "..", "docs", "architektura", "minigra_demo.png");
    fs.mkdirSync(path.dirname(demoPic), { recursive: true });
    await t.frames(20);
    await t.shot(path.join("..", "docs", "architektura", "minigra_karta.png"));
    await t.key("O");
    await t.frames(5);
    const s2 = await J("SceneManager._scene.state()");
    await t.key("P");
    await t.frames(5);
    const s3 = await J("Object.assign(SceneManager._scene.state(), { title: SceneManager._scene.card && SceneManager._scene.card.spec.title, opts: SceneManager._scene.card && SceneManager._scene.card.spec.options })");
    await t.shot(path.join("..", "docs", "architektura", "minigra_pauza.png"));
    await t.key("P");
    await t.frames(5);
    const s4 = await J("SceneManager._scene.state()");
    t.check("O closes the rules card; P: the pause with the game's help (Gramy dalej / Wyjdź z gry); P again: back to the game",
        s2.card === null && s3.card === "choice" && s3.title === "Pauza" && s3.opts.join("|") === "Gramy dalej|Wyjdź z gry" && s4.card === null && s4.phase === "play", { s2, s3, s4 });
    await t.key("ArrowRight");
    await t.frames(4);
    await t.key("ArrowRight");
    await t.frames(4);
    const s5 = await J("SceneManager._scene.state()");
    await t.shot(path.join("..", "docs", "architektura", "minigra_demo.png"));
    await t.key("O");
    const won = await t.until("window.__demo.onEnd !== undefined", 20);
    await t.until(t.onMap(3), 20);
    const d1 = await J("({ onEnd: window.__demo.onEnd, ends: window.__demo.ends, starts: window.__demo.starts, running: Tawerna.ui.running, last: Tawerna.ui.lastResult, scene: SceneManager._scene.constructor.name })");
    t.check("arrows move the buttons (the disabled one skipped: focus stays on 'Wygraj'); O on it: the banner, five coins into the purse (25 -> 30)",
        s5.focus === 1 && won && d1.onEnd && d1.onEnd[0].won === true && d1.onEnd[0].purse === 30, { s5, d1 });
    t.check("the result reaches onEnd on the map (after the scene), miniGameStart / miniGameEnd sent, nothing left running",
        d1.onEnd[1] === "Scene_Map" && d1.ends.length === 1 && d1.ends[0][0] === "coreDemo" && d1.ends[0][2] === "Scene_Map" && d1.starts.join() === "coreDemo" && d1.running === null, d1);
    // the pause's second option: quitting (the confirm-to-quit) - an aborted result
    await t.frames(20);
    await ev("window.__demo.onEnd = undefined; Tawerna.ui.open(Scene_CoreDemo, { seed: 7, onEnd: r => { window.__demo.onEnd = [r, SceneManager._scene.constructor.name]; } }); 0");
    await t.until("SceneManager._scene instanceof Scene_CoreDemo && SceneManager._scene._started && !SceneManager._scene.isFading()", 20);
    await t.frames(12);
    await t.key("O");
    await t.frames(4);
    await t.key("P");
    await t.frames(4);
    await t.key("ArrowDown");
    await t.frames(4);
    await t.key("O");
    const quit = await t.until("window.__demo.onEnd !== undefined", 20);
    await t.until(t.onMap(3), 20);
    const d2 = await J("({ onEnd: window.__demo.onEnd, ends: window.__demo.ends.length })");
    t.check("the pause -> 'Wyjdź z gry': the game ends with { aborted: true }, back on the map", quit && d2.onEnd && d2.onEnd[0].aborted === true && d2.onEnd[1] === "Scene_Map" && d2.ends === 2, d2);
    t.check("pictures of the demo: docs/architektura/minigra_karta.png, minigra_pauza.png, minigra_demo.png",
        ["minigra_karta.png", "minigra_pauza.png", "minigra_demo.png"].every(f => fs.existsSync(path.join(path.dirname(demoPic), f))));
});
