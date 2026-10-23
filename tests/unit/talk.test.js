// Tawerna.talk without the game (TawernaCore.js - docs/ROZMOWY.md, docs/ARCHITEKTURA.md section 16): the pure parts of the browser
// test tests/rozmowy_test.js, driven with stand-ins for the events and the interpreter. The takeovers: the higher priority has the
// talk (an empty one passes it on, one that throws is told and passes it on), at an equal priority the owner's name decides - never
// the order of registration -, skip leaves an owner out ("Porozmawiaj", "Nie, w innej sprawie"), no takeover: the character's own
// lines; the named priorities and their bands; who as a key, a list, "*", a RegExp, a function. The menus: own rows, then the
// options of the other systems by their order (equal: the owner's name) - the same menu in any order of registration -, when(),
// rows(ctx), a label / cmds / say of ctx; the farewell always last (P = cancel = its row); a row with run(ctx) (Tawerna.talk.pick
// plays its commands in a child); off() handles. talk.run plays in a child of the interpreter and remembers who had the talk
// (Tawerna.talk.last). The one start / list hooks of events (Tawerna.onEventStart / onEventList): a hidden character never starts,
// the higher list hook wins, onEventList.own, off().
"use strict";
const unit = require("../lib/unit.js");

// a stand-in for the event interpreter: what talk.run / talk.pick set up as a child
function interp(eventId) {
    return { children: [], eventId: () => eventId, setupChild(list, id) { this.children.push({ list, id }); } };
}
const line = s => [{ code: 401, indent: 0, parameters: [s] }];
const said = r => (r && r.list ? r.list.map(c => c.parameters[0]).join("|") : null);

unit.test(t => {
    // an event of the map as far as the core's hooks need it: its id, its start, its page's commands
    class Game_Event {
        constructor(id, list) { this._id = id; this._list = list; this.started = 0; }
        eventId() { return this._id; }
        start() { this.started++; }
        list() { return this._list; }
    }
    const errors = [];
    const w = unit.load(["TawernaCore"], { globals: { Game_Event, Graphics: { frameCount: 42, width: 1280, height: 720 } } });
    w.console = Object.assign({}, console, { error: (...a) => errors.push(a.map(String).join(" ")), warn: () => {} });   // (what the core tells)
    const T = w.Tawerna, k = T.talk, P = k.PRIORITY;

    // ---------------------------------------------------------------- the service
    const fns = ["takeover", "option", "run", "resolve", "rows", "menu", "choice", "pick", "takeovers", "options", "last"].filter(f => typeof k[f] === "function");
    const ladder = ["scene", "errand", "owner", "handBack", "meet", "wrap", "quest", "shop", "greet", "after"];
    t.check("Tawerna.talk: takeover, option, run, resolve, rows, menu, choice, pick, takeovers, options, last; the named priorities scene > errand > owner > handBack > meet > wrap > quest > shop > greet > after; the menu's order own < extra < chat",
        fns.length === 11 && ladder.every((n, i) => i === 0 || P[ladder[i - 1]] > P[n]) && Object.keys(P).length === ladder.length &&
        k.ORDER.first < k.ORDER.own && k.ORDER.own < k.ORDER.extra && k.ORDER.extra < k.ORDER.chat, { fns, P, ORDER: k.ORDER });

    // ---------------------------------------------------------------- the takeovers
    let offs = [k.takeover({ owner: "TestNizszy", who: "testowy", priority: P.owner, run: () => line("niższy") }),
        k.takeover({ owner: "TestWyzszy", who: "testowy", priority: P.scene, run: () => line("wyższy") }),
        k.takeover({ owner: "TestPusty", who: "testowy", priority: P.scene + 50, run: () => null }),
        k.takeover({ owner: "TestPustaLista", who: "testowy", priority: P.scene + 60, run: () => [] })];
    const base = () => line("własne");
    const a = k.resolve(null, "testowy", { base, owner: "TownLife" }), own = k.resolve(null, "ktos", { base, owner: "TownLife" }), none = k.resolve(null, "ktos", { base: () => null });
    t.check("takeovers: the higher priority has the talk, an empty run (null or []) passes it on; nobody's: the character's own lines (by the owner of base); no lines at all: none",
        a.by === "TestWyzszy" && said(a) === "wyższy" && own.by === "TownLife" && said(own) === "własne" && none.by === "" && none.list === null,
        { a: [a.by, said(a)], own: [own.by, said(own)], none: [none.by, none.list] });
    const b = k.resolve(null, "testowy", { skip: "TestWyzszy", base }), c = k.resolve(null, "testowy", { skip: ["TestWyzszy", "TestNizszy"], base, owner: "Story" });
    t.check("skip: one owner (a name) or a list left out this time - the next one has the talk; all of them left out: the own lines",
        b.by === "TestNizszy" && said(b) === "niższy" && c.by === "Story" && said(c) === "własne", { b: b.by, c: c.by });
    offs.forEach(f => f());
    t.check("off(): the takeovers are gone, the own lines again", k.takeovers("testowy").length === 0 && k.resolve(null, "testowy", { base, owner: "X" }).by === "X");

    // an equal priority: the owner's name, never the order of registration (then the order of one owner's own calls)
    const tie = order => {
        const fs = { Z: () => k.takeover({ owner: "TestZ", who: "remis", priority: 777, run: () => line("Z") }),
            A: () => k.takeover({ owner: "TestA", who: "remis", priority: 777, run: () => line("A") }) };
        const o = order.map(n => fs[n]()), r = k.resolve(null, "remis", {}).by;
        o.forEach(f => f());
        return r;
    };
    offs = [k.takeover({ owner: "TestSam", name: "pierwszy", who: "sam", priority: 600, run: () => line("1") }),
        k.takeover({ owner: "TestSam", name: "drugi", who: "sam", priority: 600, run: () => line("2") })];
    const same = said(k.resolve(null, "sam", {}));
    offs.forEach(f => f());
    t.check("an equal priority: the owner's name decides (TestA before TestZ) whichever registered first; one owner's two takeovers: the first called",
        tie(["Z", "A"]) === "TestA" && tie(["A", "Z"]) === "TestA" && same === "1", { za: tie(["Z", "A"]), az: tie(["A", "Z"]), same });

    // the priority's forms and the errors
    const err = spec => { try { k.takeover(spec)(); return "ok"; } catch (e) { return e.message; } };
    const named = k.takeover({ owner: "TestNazwa", who: "x", priority: "scene", run: () => line("x") });
    const listed = k.takeovers("x");
    named();
    const bad = [err({ who: "x", priority: 1, run: () => null }), err({ owner: "TestBrak", who: "x", priority: 1 }), err({ owner: "TestBrak", who: "x", run: () => null }),
        err({ owner: "TestBrak", who: "x", priority: "nie-ma-takiej", run: () => null })];
    t.check("a priority by its name ('scene' = 1000) or a number; no owner, no run(), no priority, an unknown name: a readable error",
        listed.length === 1 && listed[0].priority === 1000 && /an owner is needed/.test(bad[0]) && /has no run/.test(bad[1]) && /a priority is needed/.test(bad[2]) && /a priority is needed/.test(bad[3]),
        { listed, bad });

    // the same one again
    const old = k.takeover({ owner: "TestDwa", name: "x", who: "dwa", priority: 500, run: () => line("stary") });
    const now = k.takeover({ owner: "TestDwa", name: "x", who: "dwa", priority: 500, run: () => line("nowy") });
    old();
    const two = [k.takeovers("dwa").length, said(k.resolve(null, "dwa", {}))];
    now();
    t.check("the same owner and name again: the new takeover replaces the old one (one, not two); the old handle's off() leaves the new one", two[0] === 1 && two[1] === "nowy", two);

    // who: a key, a list, "*", a RegExp, a function (one that throws: told, never takes the talk)
    offs = [k.takeover({ owner: "TestLista", who: ["kowal", "kupiec"], priority: 100, run: () => line("lista") }),
        k.takeover({ owner: "TestWzor", who: /^straz/, priority: 200, run: () => line("wzór") }),
        k.takeover({ owner: "TestFn", who: (key, ctx) => key === "garbarz" && ctx.eventId === 7, priority: 300, run: () => line("fn") }),
        k.takeover({ owner: "TestRzuca", who: () => { throw new Error("deliberate who failure"); }, priority: 900, run: () => line("nigdy") }),
        k.takeover({ owner: "TestKazdy", who: "*", priority: 50, run: () => line("każdy") })];
    errors.length = 0;
    const by = key => k.resolve(interp(7), key, {}).by;
    const whos = { kupiec: by("kupiec"), straznik: by("straznik_przystan"), garbarz: by("garbarz"), obcy: by("obcy"), fnWrongEvent: k.resolve(interp(8), "garbarz", {}).by };
    offs.forEach(f => f());
    t.check("who: a list of keys, a RegExp, fn(key, ctx) (ctx.eventId from the interpreter), '*' for everyone; a who() that throws is told and never takes the talk",
        whos.kupiec === "TestLista" && whos.straznik === "TestWzor" && whos.garbarz === "TestFn" && whos.obcy === "TestKazdy" && whos.fnWrongEvent === "TestKazdy" &&
        errors.some(e => /talk who\(\)/.test(e) && /deliberate who failure/.test(e)), { whos, errors: errors.slice(0, 2) });

    // a run() that throws: told with its owner, the next one has the talk
    offs = [k.takeover({ owner: "TestPsuje", name: "scena", who: "x", priority: P.scene, run: () => { throw new Error("deliberate run failure"); } }),
        k.takeover({ owner: "TestDalej", who: "x", priority: P.quest, run: () => line("dalej") })];
    errors.length = 0;
    const thrown = k.resolve(null, "x", {}).by;
    offs.forEach(f => f());
    t.check("a takeover whose run() throws is told (with its owner and name) and the next one has the talk",
        thrown === "TestDalej" && errors.some(e => /takeover of TestPsuje\.scena \(x\)/.test(e)), { thrown, errors: errors.slice(0, 1) });

    // the listing for F9 / the docs: from the first, with the band of each priority
    offs = [["TestSc", 1000], ["TestEr", 905], ["TestOw", 700.5], ["TestQu", 501], ["TestSh", 450], ["TestGr", 400], ["TestAf", 300], ["TestNisko", 120]]
        .map(([owner, priority]) => k.takeover({ owner, who: "pasma", priority, run: () => null }));
    const bands = k.takeovers("pasma").map(x => x.owner + ":" + x.band);
    offs.forEach(f => f());
    t.eq("takeovers(who): from the first, each with its band (scene, errand, owner, quest, shop, greet, after; below 300: base)", bands,
        ["TestSc:scene", "TestEr:errand", "TestOw:owner", "TestQu:quest", "TestSh:shop", "TestGr:greet", "TestAf:after", "TestNisko:base"]);

    // ---------------------------------------------------------------- the menus
    const ownRows = [{ label: "Własna 1" }, { label: "Własna 2" }, { label: "Co słychać?", order: k.ORDER.chat }];
    const A = () => k.option({ owner: "TestA", id: "a", who: "testowy", label: "Opcja A", order: 500 });
    const B = () => k.option({ owner: "TestB", id: "b", who: "testowy", label: "Opcja B", order: 400 });
    const Z = () => k.option({ owner: "TestZ", id: "z", who: "testowy", label: "Opcja Z", order: 500 });
    const N = () => k.option({ owner: "TestN", id: "n", who: "testowy", label: "Nie dziś", when: () => false });
    const W = () => k.option({ owner: "TestW", id: "w", who: ["inny"], label: "Cudza" });
    const reg = order => order.map(f => f());
    const offs1 = reg([A, B, Z, N, W]), one = k.rows("testowy", {}, ownRows).map(r => r.label);
    offs1.forEach(f => f());
    const offs2 = reg([W, N, Z, B, A]), two2 = k.rows("testowy", {}, ownRows).map(r => r.label);
    t.check("options of several systems in one character's menu: own rows, then the options by order (equal: the owner's name), 'Co słychać?' (chat) after them - the same menu in either order of registration; when() false and another character's option left out",
        JSON.stringify(one) === JSON.stringify(["Własna 1", "Własna 2", "Opcja B", "Opcja A", "Opcja Z", "Co słychać?"]) && JSON.stringify(one) === JSON.stringify(two2), { one, two: two2 });

    const menu = k.menu([], k.rows("testowy", {}, ownRows), "Bywaj."), choice = menu.find(x => x.code === 102).parameters;
    const branches = menu.filter(x => x.code === 402).map(x => x.parameters[1]), last = menu[menu.length - 1];
    const ends = menu.filter(x => x.code === 0 && x.indent === 1).length;
    const bye = k.menu([], [{ label: "Kup", cmds: [{ code: 355, indent: 0, parameters: ["kup()"] }] }], { label: "Nie teraz", cmds: [{ code: 401, indent: 0, parameters: ["Wróć."] }] }, 2);
    t.check("the menu: the rows then the farewell, always last; P (cancel) = the farewell's row; one branch each, closed, the commands one deeper; a farewell with its own commands and an indent",
        choice[0][choice[0].length - 1] === "Bywaj." && choice[1] === choice[0].length - 1 && JSON.stringify(branches) === JSON.stringify(choice[0]) && last.code === 404 && ends === choice[0].length &&
        bye[0].indent === 2 && bye[0].parameters[1] === 1 && bye[2].code === 355 && bye[2].indent === 3 && bye.some(x => x.code === 401 && x.indent === 3 && x.parameters[0] === "Wróć."),
        { choice, bye: bye.map(x => x.code + "/" + x.indent) });
    offs2.forEach(f => f());

    // labels, commands and lines of ctx; rows(ctx); only one owner's; skip
    const keep = [{ code: 401, indent: 0, parameters: ["stała"] }];
    offs = [k.option({ owner: "TestCtx", id: "ctx", who: "kowal", label: c => "Dla " + c.who + " (" + c.eventId + ")", cmds: c => line("cmd " + c.who), say: c => "mówi " + c.who }),
        k.option({ owner: "TestStale", id: "stale", who: "kowal", label: "Stałe", cmds: keep }),
        k.option({ owner: "TestSklep", who: "kowal", order: 450, rows: c => [{ label: "Miecz" }, null, { label: "Tarcza", say: "tarcza" }, { label: "" }] })];
    const rows = k.rows("kowal", { eventId: 5 });
    const ctxRow = rows.find(r => r.owner === "TestCtx"), staleRow = rows.find(r => r.owner === "TestStale");
    t.check("an option's label, cmds and say may be fn(ctx) (ctx.who, ctx.eventId); cmds given as a list are copies; rows(ctx) gives several rows in its order (empty ones left out)",
        ctxRow.label === "Dla kowal (5)" && said({ list: ctxRow.cmds }) === "cmd kowal" && ctxRow.say === "mówi kowal" && staleRow.cmds[0] !== keep[0] &&
        staleRow.cmds[0].parameters[0] === "stała" && JSON.stringify(rows.map(r => r.label)) === JSON.stringify(["Miecz", "Tarcza", "Dla kowal (5)", "Stałe"]),
        rows.map(r => [r.label, r.owner, r.order]));
    const only = k.rows("kowal", {}, [], { owner: "TestSklep" }).map(r => r.label), skipped = k.rows("kowal", { skip: ["TestSklep", "TestCtx"] }).map(r => r.label);
    offs.forEach(f => f());
    t.check("rows(who, ctx, own, { owner }): only that owner's options; ctx.skip leaves owners' options out",
        JSON.stringify(only) === JSON.stringify(["Miecz", "Tarcza"]) && JSON.stringify(skipped) === JSON.stringify(["Stałe"]), { only, skipped });

    // a row with run(ctx): Tawerna.talk.pick
    let picked = null;
    const offRun = k.option({ owner: "TestRun", id: "r", who: "kowal", label: "Zrób coś", run: c => { picked = c.who; return line("zrobione"); } });
    const runRow = k.rows("kowal", {})[0], script = runRow.cmds[0];
    const it = interp(12), ok = k.pick(it, "TestRun:r", "kowal"), unknown = k.pick(interp(12), "TestRun:nie-ma", "kowal");
    t.check("a row with run(ctx): its branch calls Tawerna.talk.pick(this, id, who); pick plays run's commands in a child of the interpreter (+ the end), an unknown id: false",
        script.code === 355 && script.parameters[0] === 'Tawerna.talk.pick(this, "TestRun:r", "kowal")' && ok === true && picked === "kowal" && unknown === false &&
        it.children.length === 1 && it.children[0].id === 12 && said({ list: it.children[0].list.slice(0, 1) }) === "zrobione" && it.children[0].list[1].code === 0,
        { script: script.parameters[0], ok, unknown, child: it.children[0] });

    // the same id again; off()
    const again = k.option({ owner: "TestRun", id: "r", who: "kowal", label: "Zrób coś innego", run: () => null });
    const optList = k.options("kowal"), labels = k.rows("kowal", {}).map(r => r.label);
    offRun();
    const afterOldOff = k.options("kowal").length;
    again();
    t.check("the same option id again replaces the old one (one row, the new label); the old handle's off() leaves it, its own off() removes it, none left",
        optList.length === 1 && optList[0].id === "TestRun:r" && labels.join() === "Zrób coś innego" && afterOldOff === 1 && k.options("kowal").length === 0 &&
        k.rows("kowal", {}).length === 0, { optList, labels, afterOldOff });

    // ---------------------------------------------------------------- talk.run and talk.last
    const off1 = k.takeover({ owner: "TestRozmowa", who: "soltys", priority: "quest", run: c => line("zadanie dla " + c.who + " #" + c.eventId) });
    const ip = interp(916), who1 = k.run(ip, "soltys", { base: () => line("własne"), owner: "TownLife" }), last1 = k.last();
    off1();
    const ip2 = interp(916), who2 = k.run(ip2, "soltys", { base: () => null }), last2 = k.last();
    t.check("talk.run: the takeover's commands in a child of the interpreter (+ the end command, the event's id), talk.last() says who and by whom (and the frame); nothing to say: '' and no child",
        who1 === "TestRozmowa" && ip.children.length === 1 && ip.children[0].id === 916 && said({ list: ip.children[0].list.slice(0, 1) }) === "zadanie dla soltys #916" &&
        ip.children[0].list[1].code === 0 && last1.who === "soltys" && last1.by === "TestRozmowa" && last1.frame === 42 && who2 === "" && ip2.children.length === 0 && last2.by === "",
        { who1, last1, who2, last2 });

    // ---------------------------------------------------------------- one start hook and one list hook for every event
    const hidden = new Game_Event(910, line("ukryty")), shown = new Game_Event(911, line("widoczny"));
    errors.length = 0;
    const startOffs = [T.onEventStart(ev => ev === hidden, { owner: "TestUkryty", priority: "hidden" }),
        T.onEventStart(() => { throw new Error("deliberate start failure"); }, { owner: "TestPsuty", priority: "instead" }),
        T.onEventStart(() => false, { owner: "TestPrzed", priority: "before" })];
    hidden.start(); shown.start();
    const startList = T.onEventStart.list().map(g => g.owner + ":" + g.priority);
    startOffs.forEach(f => f());
    hidden.start();
    t.check("Tawerna.onEventStart: a hidden character (priority 'hidden') never starts, the others do; a gate that throws is told and the next ones are still asked; off(): it starts again",
        shown.started === 1 && hidden.started === 1 && JSON.stringify(startList) === JSON.stringify(["TestUkryty:900", "TestPsuty:500", "TestPrzed:100"]) &&
        errors.some(e => /onEventStart \(TestPsuty\)/.test(e)), { startList, hidden: hidden.started, shown: shown.started, errors: errors.slice(0, 1) });

    const STUB = line("scena"), OWN = line("osoba");
    const listOffs = [T.onEventList(ev => (ev === hidden ? OWN : null), { owner: "TestOsoba", priority: "person" }),
        T.onEventList(ev => (ev === hidden ? STUB : null), { owner: "TestScena", priority: "scene" }),
        T.onEventList(ev => (ev === hidden ? line("zamknięte") : null), { owner: "TestZamek", priority: 0 })];
    const during = hidden.list() === STUB, other = said({ list: shown.list() }), page = said({ list: T.onEventList.own(hidden) });
    const order = T.onEventList.list().map(g => g.owner);
    listOffs[1]();
    const next = hidden.list() === OWN;
    listOffs.forEach(f => f());
    t.check("Tawerna.onEventList: the highest hook's commands (scene before person), a null passes on, onEventList.own: the page's own; off(): the next one, then as it was",
        during && other === "widoczny" && page === "ukryty" && JSON.stringify(order) === JSON.stringify(["TestScena", "TestOsoba", "TestZamek"]) && next && said({ list: hidden.list() }) === "ukryty",
        { during, other, page, order, next });
});
