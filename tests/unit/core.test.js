// TawernaCore.js's pure services without the game - the parts of the browser test tests/core_test.js that need no map (the map
// flags are tests/unit/map_flags.test.js; the map's injection, clock, updaters, calm check, sound and popups are
// tests/unit/core_map.test.js). The event bus: priority, once, off, the counts, a listener that throws (told with its owner, the
// rest still run). The saved state: $gameSystem._tw[key] with its version in _tw._v, a throwaway copy while there is no game, the
// versioned migrations (step by step or one function; one that throws is told), an older save's own key adopted (and left as a
// hidden alias that is never saved), both keys in a save, a newer save. Tags: Tawerna.parseArgs, tags of a note, of a page's
// comments, of an event's data (every page) and of a live event (the page it is on now), the first one wins, names case-blind.
// The calendar: seasons by Farming's seasonLength, the day of the season, the year, Easter and Christmas Eve, the night, the
// periods without DayNightCycle. has / api / call / register; the map's drawing order with a sprite without z; the view's scale.
"use strict";
const unit = require("../lib/unit.js");

unit.test(t => {
    function Game_System() {}
    // a live event as far as the tags need it: its data and the page it is on now
    function Game_Event(data, page) { this._data = data; this._page = page; }
    Game_Event.prototype.event = function() { return this._data; };
    Game_Event.prototype.page = function() { return this._data.pages[this._page]; };
    function Tilemap() {}
    let sys = null;
    const errors = [], warns = [];
    const globals = { Game_System, Game_Event, Tilemap, Graphics: { frameCount: 0, width: 1280, height: 720 }, UIStyle: { style: 1 }, Pomocnik: { n: 1, dodaj(a, b) { return a + b + this.n; } },
        $plugins: [{ name: "RoomLighting", status: true }, { name: "Wylaczona", status: false }] };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(["TawernaCore"], { globals });
    w.console = Object.assign({}, console, { error: (...a) => errors.push(a.map(String).join(" ")), warn: (...a) => warns.push(a.map(String).join(" ")) });
    const T = w.Tawerna;
    const save = s => Object.setPrototypeOf(JSON.parse(JSON.stringify(s)), Game_System.prototype);   // (a save read back: plain fields)

    // ---------------------------------------------------------------- the bus
    const out = [];
    const a = p => out.push("a" + p.n), b = p => out.push("b" + p.n), c = p => out.push("c" + p.n);
    T.on("ct.bus", a); T.on("ct.bus", b, { priority: -1 }); T.once("ct.bus", c);
    const n1 = T.emit("ct.bus", { n: 1 }), n2 = T.emit("ct.bus", { n: 2 });
    T.off("ct.bus", a);
    const n3 = T.emit("ct.bus", { n: 3 });
    const off = T.on("ct.bus2", () => out.push("x"));
    off();
    const n4 = T.emit("ct.bus2");
    t.check("the bus: priority first (b before a), once only once, off and the handle of on() - every listener in order, the counts right",
        out.join(",") === "b1,a1,c1,b2,a2,b3" && [n1, n2, n3, n4].join(",") === "3,2,1,0", { out, n: [n1, n2, n3, n4] });
    const heard = [];
    T.on("ct.err", () => { throw new Error("deliberate listener failure"); }, { owner: "CoreTest" });
    T.on("ct.err", (p, name) => heard.push([p, name]), { owner: "CoreTest2" });
    errors.length = 0;
    T.emit("ct.err");
    let notFn = "";
    try { T.on("ct.x", "nie funkcja"); } catch (e) { notFn = e.message; }
    t.check("a listener that throws is told (with its owner) and the next ones still run; no payload: {} and the event's name as the second argument; a listener that is not a function: an error",
        errors.length === 1 && /ct\.err/.test(errors[0]) && /CoreTest/.test(errors[0]) && heard.length === 1 && JSON.stringify(heard[0]) === '[{},"ct.err"]' &&
        /not a function/.test(notFn) && JSON.stringify(T.debug.listeners()["ct.err"]) === '["CoreTest","CoreTest2"]', { errors, heard, notFn });
    t.check("the events the core sends itself and the systems' events are named (Tawerna.EVENTS)",
        ["newGame", "load", "save", "mapLeave", "mapEnter", "mapReady", "dayStart", "hourChange", "sleep", "wake"].every(n => T.EVENTS.core.includes(n)) &&
        ["kill", "harvest", "levelUp", "lightning"].every(n => T.EVENTS.systems.includes(n)), T.EVENTS);

    // ---------------------------------------------------------------- the state
    const t1 = T.state("ctFresh", { a: 1, list: [] });
    t1.a = 9; t1.list.push(1);
    const t2 = T.state("ctFresh");
    t.check("Tawerna.state with no game yet: a throwaway copy of the defaults each time (nothing kept, nothing shared)", t1 !== t2 && t2.a === 1 && t2.list.length === 0, t2);
    const acc = T.state.define("ctState", () => ({ n: 1, list: [] }), { version: 2, owner: "CoreTest" });
    sys = new Game_System();
    const s = acc();
    s.n = 5; s.list.push("x");
    t.check("a game: the state is a plain object at $gameSystem._tw[key], the same live object every time, its version in _tw._v, the owner in its spec",
        acc() === T.state("ctState") && sys._tw.ctState === s && sys._tw._v.ctState === 2 && T.state("ctState").n === 5 && T.state.keys().includes("ctState") &&
        T.state.version("ctState") === 2 && T.state.spec("ctState").owner === "CoreTest", { tw: sys._tw });

    // a save made with version 1, read by a plugin that knows version 3 (step by step); one migration as a function; one that throws
    T.state.define("ctMig", { a: 1, b: 0, c: 0, d: "new" }, { version: 3, migrate: { 2: m => Object.assign(m, { b: 2 }), 3: m => { m.c = m.a + 1; return m; } } });
    T.state.define("ctFn", { x: 0 }, { version: 4, migrate: (m, from, to) => Object.assign(m, { log: from + "->" + to }) });
    T.state.define("ctBad", { v: 0 }, { version: 2, migrate: { 2: () => { throw new Error("deliberate migration failure"); } } });
    errors.length = 0;
    sys = save({ _tw: { ctMig: { a: 5 }, ctFn: { x: 3 }, ctBad: { v: 7 }, _v: { ctMig: 1, ctFn: 2, ctBad: 1 } } });
    const mig = T.state("ctMig"), fn = T.state("ctFn"), badMig = T.state("ctBad");
    t.check("a versioned migration: v1 {a:5} -> v2 (+b) -> v3 (c = a + 1), a new default field filled in, the version saved as 3",
        mig.a === 5 && mig.b === 2 && mig.c === 6 && mig.d === "new" && T.state.version("ctMig") === 3, mig);
    t.check("... migrate as one function gets (data, from, to); a migration that throws is told, the data kept, the version moved on",
        fn.x === 3 && fn.log === "2->4" && T.state.version("ctFn") === 4 && badMig.v === 7 && T.state.version("ctBad") === 2 && errors.some(e => /state 'ctBad' migration 1 -> 2/.test(e)),
        { fn, badMig, errors });

    // an old-style save: the plugin's own $gameSystem._ctOld (from before the core) is adopted
    T.state.define("ctOld", { n: 0, legacy: false, fresh: 1 }, { version: 2, adopt: "_ctOld", migrate: { 2: m => { m.n2 = m.n * 2; return m; } } });
    sys = save({ _ctOld: { n: 7, legacy: true }, _other: 1 });
    const old = T.state("ctOld");
    const alias = sys._ctOld === old, hidden = !Object.keys(sys).includes("_ctOld");
    sys._ctOld.n = 8;
    sys._ctOld = { n: 1, replaced: true };
    const saved = JSON.parse(JSON.stringify(sys));
    t.check("an old save's $gameSystem._ctOld is adopted into _tw.ctOld (as v1, then migrated to v2), the missing defaults filled",
        old.legacy === true && old.n2 === 14 && old.fresh === 1 && saved._tw._v.ctOld === 2, old);
    t.check("... the old key stays as a hidden alias (old code reads and writes the same place) and is never saved again; the rest of the save as it was",
        alias && hidden && T.state("ctOld").replaced === true && !("_ctOld" in saved) && saved._tw.ctOld.n === 1 && saved._other === 1, { alias, hidden, saved });
    warns.length = 0;
    sys = save({ _ctOld: { n: 3 }, _tw: { ctOld: { n: 4 }, ctState: { n: 2, list: [] }, _v: { ctOld: 2, ctState: 9 } } });
    const both = T.state("ctOld").n, newer = T.state("ctState");
    t.check("both the old key and _tw in a save: _tw kept, the old key dropped (and told); a save newer than the plugin: kept as it is (and told)",
        both === 4 && !Object.keys(sys).includes("_ctOld") && newer.n === 2 && T.state.version("ctState") === 9 &&
        warns.some(x => /both _ctOld and _tw\.ctOld/.test(x)) && warns.some(x => /'ctState' is v9 in the save/.test(x)), warns);
    let badKey = "";
    try { T.state("zły klucz", {}); } catch (e) { badKey = e.message; }
    t.check("a key that is not letters, digits and _: a readable error", /a bad key 'zły klucz'/.test(badKey), badKey);

    // ---------------------------------------------------------------- tags
    const P = T.parseArgs;
    const kv = P("a=1,b=2, c = x"), pos = P("1.4,60,960,300"), tavern = P('bed room=komnata price=30 name="Komnata z kominkiem" plate="0,-1"'), dice = P("dice:grum");
    const neg = P("-1,true,false,#ffcc88"), free = P("Stary Bartek"), empty = P(""), up = P("Hits=3");
    t.check("parseArgs: key=value lists, positional numbers, TavernLife's spaced attributes with quotes, a:b, booleans and colours, the raw text, keys lowercased",
        kv.kv.a === 1 && kv.kv.b === 2 && kv.kv.c === "x" && pos.pos.join(",") === "1.4,60,960,300" && tavern.pos[0] === "bed" && tavern.kv.room === "komnata" &&
        tavern.kv.price === 30 && tavern.kv.name === "Komnata z kominkiem" && tavern.kv.plate === "0,-1" && dice.pos.join(",") === "dice,grum" && neg.pos[0] === -1 &&
        neg.pos[1] === true && neg.pos[2] === false && neg.pos[3] === "#ffcc88" && free.raw === "Stary Bartek" && free.pos.join("|") === "Stary|Bartek" && empty.pos.length === 0 &&
        up.kv.hits === 3, { kv, tavern, neg });
    const note = "<Tree:hits=8,kind=pine><Flag>\n<tree:hits=2><Light:0.16,132,84,20> a <a href> b";
    const tags = T.tags(note);
    t.check("a note's tags: <Name>, <Name:...>, the first of a name wins (names case-blind), tagList keeps them all in order (<a href> is no tag); hasTag; a missing one is null",
        tags.tree.kv.hits === 8 && tags.flag.raw === "" && T.tag(note, "TREE") === tags.tree && T.tagList(note).map(x => x.name + ":" + x.args.raw).join("|") ===
        "Tree:hits=8,kind=pine|Flag:|tree:hits=2|Light:0.16,132,84,20" && T.hasTag(note, "Light") && !T.hasTag(note, "a") && T.tag(note, "Nie") === null && T.tag(null, "x") === null,
        T.tagList(note));
    const page = (text, extra) => ({ list: [{ code: 108, indent: 0, parameters: [text] }].concat(extra || [], [{ code: 0, indent: 0, parameters: [] }]) });
    const data = { id: 780, note: "<CoreTest:x=780><Flag>", pages: [page("<CorePage:first>", [{ code: 408, indent: 0, parameters: ["<Cont:1>"] }]), page("<CorePage:second n=2>")] };
    const ev = new Game_Event(data, 0);
    const first = Object.keys(T.tags(ev)).sort().join(","), page1 = T.tag(ev, "CorePage").pos[0];
    ev._page = 1;
    const page2 = T.tag(ev, "corepage"), whole = Object.keys(T.tags(data)).sort().join(",");
    data.note = "<Nowa>";
    const changed = T.hasTag(data, "nowa") && !T.hasTag(data, "CoreTest");
    t.check("tags of a live event: its note and the comments (108 / 408) of the page it is on now - the page changes, its tags too; of its data: every page; a note changed: read again",
        first === "cont,corepage,coretest,flag" && page1 === "first" && page2.pos[0] === "second" && page2.kv.n === 2 && !T.hasTag(ev, "Cont") &&
        whole === "cont,corepage,coretest,flag" && changed, { first, page1, page2, whole, changed });

    // ---------------------------------------------------------------- the calendar
    sys = save({});
    sys.dayNightDay = () => 30;
    sys.dayNightHour = () => 22.5;
    const C = T.time, days = [];
    for (let d = 1; d <= 224; d++) days.push(d);
    t.check("Tawerna.time: seasons of 28 days (Farming's seasonLength) from day 1 - Wiosna, Lato, Jesień, Zima, then Wiosna again; the day of the season; the year; today's day and hour from $gameSystem",
        C.seasonLength() === 28 && [1, 28, 29, 56, 57, 85, 112, 113].map(d => C.season(d)).join(",") === "0,0,1,1,2,3,3,0" && [1, 29, 57, 85, 113].map(d => C.seasonName(d)).join(",") ===
        "Wiosna,Lato,Jesień,Zima,Wiosna" && [C.dayOfSeason(1), C.dayOfSeason(28), C.dayOfSeason(30)].join(",") === "1,28,2" && [C.year(112), C.year(113)].join(",") === "1,2" &&
        C.day() === 30 && C.hour() === 22.5 && C.season() === 1 && C.season(0) === 0, { seasons: days.slice(0, 120).filter(d => d % 28 === 1).map(d => C.season(d)) });
    t.check("Easter on days 13-16 of spring, Christmas Eve on days 12-16 of winter, every year; the night from 21 to 5; the periods without DayNightCycle: night and day",
        days.filter(d => C.isEaster(d)).join(",") === "13,14,15,16,125,126,127,128" && days.filter(d => C.isWigilia(d)).join(",") === "96,97,98,99,100,208,209,210,211,212" &&
        [22, 4.9, 5, 12, 20.99, 21].map(h => C.isNight(h)).join(",") === "true,true,false,false,false,true" && C.period(23).id === "night" && C.period(12).id === "day" && C.isNight() === true,
        { easter: days.filter(d => C.isEaster(d)), wig: days.filter(d => C.isWigilia(d)) });
    const w10 = unit.load(["TawernaCore"], { params: { Farming: { seasonLength: "10" } } });
    t.check("... the season's length is Farming.js's parameter (10 days: day 11 is summer, day 41 spring of year 2; Easter round day 5)",
        w10.Tawerna.time.season(11) === 1 && w10.Tawerna.time.season(41) === 0 && w10.Tawerna.time.year(41) === 2 && w10.Tawerna.time.isEaster(5) && !w10.Tawerna.time.isEaster(9));

    // ---------------------------------------------------------------- has / api / call / register, the drawing order, the view
    const reg = T.register("CoreRejestr", { ok: 1 });
    t.check("has / api / call / register: a registered API, a plugin's window object (UITheme's is UIStyle), a plugin listed without an object of its own (on, not off); call with this and arguments, undefined when missing",
        T.api("CoreRejestr") === reg && T.api("UITheme") === w.UIStyle && T.api("NieMa") === null && T.has("RoomLighting") && !T.has("Wylaczona") && !T.has("NieMa") &&
        T.has("Pomocnik") && T.call("Pomocnik", "dodaj", 2, 3) === 6 && T.call("NieMa", "x") === undefined && T.call("Pomocnik", "n") === undefined);
    const sprites = [{ n: "high", z: 3, y: 0, spriteId: 1 }, { n: "noZ", y: 50, spriteId: 2 }, { n: "zero", z: 0, y: 10, spriteId: 3 }, { n: "low", z: -1, y: 99, spriteId: 4 }, { n: "same", z: 0, y: 10, spriteId: 0 }];
    const sorted = sprites.slice().sort((p, q) => Tilemap.prototype._compareChildOrder(p, q)).map(x => x.n);
    t.eq("the map's drawing order: by z, then y, then the sprite's id - a sprite without z counts as z 0 (the bear behind the trees)", sorted, ["low", "same", "zero", "noZ", "high"]);
    const scales = [];
    T.on("viewScale", v => scales.push(v));
    const v0 = T.view(), s1 = T.view.setScale(0.5), v1 = T.view(), s2 = T.view.setScale(0.5), s3 = T.view.setScale(-2);
    t.check("the view: the screen at scale 1; setScale(0.5) shows twice as much of the world (and says viewScale once); a bad scale is 1",
        v0.w === 1280 && v0.h === 720 && v0.s === 1 && s1 === 0.5 && v1.w === 2560 && v1.h === 1440 && T.view.scale() === 1 && s2 === 0.5 && s3 === 1 && scales.join(",") === "0.5,1",
        { v0, v1, scales });
});
