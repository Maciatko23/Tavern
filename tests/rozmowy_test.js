// Rozmowy z postaciami: jedna obsługa w rdzeniu (TawernaCore.js - Tawerna.talk, Tawerna.onEventStart, Tawerna.onEventList; docs/ROZMOWY.md,
// docs/ARCHITEKTURA.md rozdz. 16). Sprawdza:
//   - usługę: przejęcie z wyższym priorytetem wygrywa, przy równym - nazwa właściciela (nie kolejność wtyczek), skip ("Porozmawiaj",
//     "Nie, w innej sprawie"), opcje dwóch systemów w menu tej samej postaci we właściwej kolejności niezależnie od kolejności rejestracji,
//     pożegnanie zawsze na końcu, wiersz z run() (Tawerna.talk.pick)
//   - drabinę gry: kolejność przejęć mieszkańców jak przed zmianą (Janek, Kleofas, Baltazar, rotmistrz, Ambroży, Tadek, sołtys) - z decyzją
//     2026-10-23: sklepy (Bron, Ubior_Sklepy, Kantor po W5) pod zadaniami i nad powitaniem dnia; sklep nigdy nie przykrywa zadania
//   - jeden hak startu i poleceń zdarzenia: właściciele i priorytety jak dawna kolejność wtyczek; ukryty mieszkaniec nie startuje;
//     hak listy z wyższym priorytetem wygrywa i znika po off()
//   - Kłos (Map162): sklep (Bron) NIE zabiera jego kwestii - jego słowa i menu „Sprzedam coś wojsku.”, „Pokaż zbrojownię” (Bron),
//     „Co słychać?”, „Bywaj.”; dwie obce opcje we właściwych miejscach; przejęcie testowe wygrywa nad Garnizonem i znika
//   - stary zapis (tavern_evening): Borgar (Story) - „Zjedz coś”, „Wynajmij pokój” (TavernLife, opcja) przed „Pogadaj”, „Nie teraz” na końcu
//   - stary TownLife.addTalkHook dalej działa (przez usługę)
// Uruchom: node tests/run.js rozmowy_test --port 9603   (serwer: node tools/serve.js; albo CDP_PORT=9603 node tests/rozmowy_test.js)
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const labels = r => (r && r.choices && r.choices[0] ? [].concat(r.choices[0].choices || r.choices[0].list || r.choices[0]) : []);

    // ---------------------------------------------------------------- the service
    const api = await t.json(`(function(){ const k = Tawerna.talk; return { fns: ["takeover", "option", "run", "resolve", "rows", "menu", "choice", "pick", "takeovers", "options", "last"].filter(f => typeof k[f] === "function"),
        pr: k.PRIORITY, ord: k.ORDER, start: typeof Tawerna.onEventStart === "function", list: typeof Tawerna.onEventList === "function", own: typeof Tawerna.onEventList.own === "function" }; })()`);
    t.check("rdzeń: Tawerna.talk (przejęcia, opcje, run, rows, menu, pick...) z nazwanymi priorytetami i kolejnością; onEventStart / onEventList",
        api.fns.length === 11 && api.pr.scene > api.pr.errand && api.pr.errand > api.pr.owner && api.pr.owner > api.pr.quest && api.pr.quest > api.pr.shop && api.pr.shop > api.pr.greet && api.pr.greet > api.pr.after
        && api.ord.own < api.ord.extra && api.ord.extra < api.ord.chat && api.start && api.list && api.own, api);

    // the game's ladder: who takes a resident's talk, from the first (the old order of TownLife's hooks, now named)
    const ladder = await t.json(`(function(){ const o = {}; for (const k of ["janek", "pustelnik", "kupiec", "rotmistrz", "dzwonnik", "kowal", "soltys", "kwatermistrz", "szmaciarz", "garbarz"])
        o[k] = Tawerna.talk.takeovers(k).map(x => x.owner + (x.name ? "." + x.name : "")); return o; })()`);
    // (2026-10-23, the user's rule: a shop never takes a character's lines) the shops (Kantor's Baltazar after W5, Bron, Ubior_Sklepy) stand
    // below the quests' content and every other system's talk, above the greeting of the day
    const want = {
        janek: ["Latarnia", "Wrak", "Kruk", "Przystan", "TownQuests", "TownQuests.greeting"],
        pustelnik: ["Motyle", "Zakon", "Lowy", "Pustelnia", "TownQuests", "TownQuests.greeting"],
        kupiec: ["Ludzie", "Kruk", "Pustelnia", "TownQuests", "Kantor.baltazar", "Bron", "TownQuests.greeting"],
        rotmistrz: ["Lowy", "Garnizon", "TownQuests", "TownQuests.greeting"],
        dzwonnik: ["Kruk", "Pustelnia", "TownQuests", "TownQuests.greeting", "Act3"],
        kowal: ["Ludzie", "Kruk", "TownQuests", "Bron", "TownQuests.greeting"],
        soltys: ["Kruk", "Homes", "TownQuests", "TownQuests.greeting"],
        kwatermistrz: ["Garnizon", "TownQuests", "TownQuests.greeting"],
        szmaciarz: ["Wrak", "TownQuests", "Ubior_Sklepy", "TownQuests.greeting"],
        garbarz: ["TownQuests", "Ubior_Sklepy", "TownQuests.greeting"]
    };
    const bad = Object.keys(want).filter(k => JSON.stringify(ladder[k]) !== JSON.stringify(want[k]));
    t.check("drabina przejęć mieszkańców: Latarnia > Motyle > Zakon > Ludzie > Lowy > Zasoby > Kantor/Ludmiła > Wrak > Garnizon > Kruk > Pustelnia > Przystan > Homes > zadania > SKLEPY (Kantor/Baltazar po W5, Bron, Ubior_Sklepy) > powitanie dnia > Act3",
        !bad.length, { bad: bad.map(k => [k, ladder[k], want[k]]) });
    const shopQ = await t.json(`(function(){ const k = Tawerna.talk, line = s => [{ code: 401, indent: 0, parameters: [s] }];
        const shops = ["kowal", "kupiec", "garbarz", "szwaczka", "przekupka", "szmaciarz"].map(w => { const tk = k.takeovers(w), q = tk.findIndex(x => x.owner === "TownQuests" && !x.name);
            const s = tk.findIndex(x => x.band === "shop"), g = tk.findIndex(x => x.name === "greeting"); return { w, q, s, g, ok: q >= 0 && s > q && g > s }; });
        const off = k.takeover({ owner: "TestZadanie", who: "kowal", priority: k.PRIORITY.quest + 1, run: () => line("zadanie mówi") });
        const by = k.resolve(null, "kowal", { ev: { eventId: () => 0 } }).by; off();
        return { shops, by }; })()`);
    t.check("sklep nigdy nie przykrywa zadania: u każdego sklepikarza (Tadek, Baltazar, garbarz, szwaczka, przekupka, szmaciarz) zadania przed sklepem, sklep przed powitaniem dnia; zadanie u Tadka wygrywa ze sklepem Bron",
        shopQ.shops.every(x => x.ok) && shopQ.by === "TestZadanie", shopQ);

    const hooks = await t.json(`({ start: Tawerna.onEventStart.list().map(g => g.owner + ":" + g.priority), list: Tawerna.onEventList.list().map(g => g.owner + ":" + g.priority) })`);
    t.check("jeden hak startu zdarzenia: ukryci (Garnizon, Ludzie, Przystan, TownLife, Woz, Wrak) > kot, kości > tryb walki (zawsze ostatni)",
        JSON.stringify(hooks.start) === JSON.stringify(["Garnizon:900", "Ludzie:900", "Przystan:900", "TownLife:900", "Woz:900", "Wrak:900", "HomeLife:500", "TavernDice:500", "Combat:100"]), hooks.start);
    t.check("jeden hak poleceń zdarzenia: Kasztelan > Dwor > Kantor > Homes > TownQuests > HomeLife > bywalcy > TavernLife > QuestBoard > Story (dawna kolejność wtyczek)",
        JSON.stringify(hooks.list) === JSON.stringify(["Kasztelan:900", "Dwor:830", "Kantor:820", "Homes:810", "TownQuests:800", "HomeLife:530", "TavernLife_Regulars:520", "TavernLife:510", "QuestBoard:500", "Story:300"]), hooks.list);

    // rows: two systems' options on one character, registered in either order - the same menu; the farewell last
    const rows = await t.json(`(function(){ const k = Tawerna.talk, own = [{ label: "Własna 1" }, { label: "Własna 2" }, { label: "Co słychać?", order: k.ORDER.chat }];
        const reg = order => order.map(f => f());
        const A = () => k.option({ owner: "TestA", id: "a", who: "testowy", label: "Opcja A", order: 500 });
        const B = () => k.option({ owner: "TestB", id: "b", who: "testowy", label: "Opcja B", order: 400 });
        const Z = () => k.option({ owner: "TestZ", id: "z", who: "testowy", label: "Opcja Z", order: 500 });
        const N = () => k.option({ owner: "TestN", id: "n", who: "testowy", label: "Nie dziś", when: () => false });
        const W = () => k.option({ owner: "TestW", id: "w", who: ["inny"], label: "Cudza" });
        const offs1 = reg([A, B, Z, N, W]), one = k.rows("testowy", {}, own).map(r => r.label); offs1.forEach(f => f());
        const offs2 = reg([W, N, Z, B, A]), two = k.rows("testowy", {}, own).map(r => r.label);
        const menu = k.menu([], k.rows("testowy", {}, own), "Bywaj."), choice = menu.find(c => c.code === 102).parameters;
        offs2.forEach(f => f());
        return { one, two, choice, left: k.options("testowy").length }; })()`);
    t.check("opcje dwóch (i więcej) systemów w menu jednej postaci: własne wiersze, potem opcje wg order (równy order: nazwa właściciela), „Co słychać?” - tak samo przy każdej kolejności rejestracji",
        JSON.stringify(rows.one) === JSON.stringify(["Własna 1", "Własna 2", "Opcja B", "Opcja A", "Opcja Z", "Co słychać?"]) && JSON.stringify(rows.one) === JSON.stringify(rows.two), rows);
    t.check("menu: pożegnanie zawsze ostatnie i jest wyjściem (P = ostatni wiersz); off() zdejmuje opcje",
        rows.choice[0][rows.choice[0].length - 1] === "Bywaj." && rows.choice[1] === rows.choice[0].length - 1 && rows.left === 0, rows.choice);

    // takeovers: the higher wins; equal - the owner's name; skip
    const tk = await t.json(`(function(){ const k = Tawerna.talk, line = s => [{ code: 401, indent: 0, parameters: [s] }];
        const offs = [k.takeover({ owner: "TestNizszy", who: "testowy", priority: k.PRIORITY.owner, run: () => line("niższy") }),
            k.takeover({ owner: "TestWyzszy", who: "testowy", priority: k.PRIORITY.scene, run: () => line("wyższy") }),
            k.takeover({ owner: "TestPusty", who: "testowy", priority: k.PRIORITY.scene + 50, run: () => null })];
        const a = k.resolve(null, "testowy", { base: () => line("własne") }).by;
        const b = k.resolve(null, "testowy", { skip: "TestWyzszy", base: () => line("własne") }).by;
        const c = k.resolve(null, "testowy", { skip: ["TestWyzszy", "TestNizszy"], base: () => line("własne") }).list[0].parameters[0];
        offs.push(k.takeover({ owner: "TestZ", who: "remis", priority: 777, run: () => line("Z") }), k.takeover({ owner: "TestA", who: "remis", priority: 777, run: () => line("A") }));
        const d = k.resolve(null, "remis", {}).by;
        offs.forEach(f => f());
        return { a, b, c, d, left: k.takeovers("testowy").length + k.takeovers("remis").length }; })()`);
    t.check("przejęcia: wyższy priorytet wygrywa (pusty wynik oddaje dalej), skip pomija właściciela, bez przejęć - własne kwestie; równy priorytet - nazwa właściciela",
        tk.a === "TestWyzszy" && tk.b === "TestNizszy" && tk.c === "własne" && tk.d === "TestA" && tk.left === 0, tk);

    // ---------------------------------------------------------------- Kłos in the garrison: his lines and menu stay, the shop is one row
    await t.until("Wyspa.isReady(162)", 20);
    await t.newGame({ map: 162, x: 33, y: 30, dir: 8, hour: 10, day: 6, quiet: true, minimap: false });
    await t.frames(30);
    await t.eval(`(function(){ const f = TownQuests.state().flags; f.garnizonPoznany = 1; f.k52Skup = 1; Object.assign(Garnizon.state().met, { rotmistrz: 1, kwatermistrz: 1 }); Garnizon.state().favor = 40;
        const q = TownQuests; window.__qkeep = { remarkFor: q.remarkFor, talkFor: q.talkFor, markers: q.markers, offerable: q.offerable };
        q.remarkFor = () => null; q.talkFor = () => null; q.markers = () => ({}); q.offerable = () => false; return 0; })()`);
    const klosEv = "TownLife.eventOf('kwatermistrz')";
    const ask = ["Co tam, chłopcze?", "Liczydło słucha.", "Kupujesz, sprzedajesz, czy tylko przechodzisz?"];
    const k1 = await t.talkTo(klosEv, ["Bywaj."], { secs: 40 });
    const k1by = await t.json("Tawerna.talk.last()");
    const k1l = labels(k1);
    t.check("Kłos: rozmowa jego (Garnizon), jego słowa, menu „Sprzedam coś wojsku.” / „Pokaż zbrojownię” (sklep Bron - jeden wiersz) / „Co słychać?” / „Bywaj.”",
        k1.done && k1by.by === "Garnizon" && ask.some(a => k1.text.indexOf(a) >= 0) && JSON.stringify(k1l) === JSON.stringify(["Sprzedam coś wojsku.", "Pokaż zbrojownię", "Co słychać?", "Bywaj."]),
        { by: k1by, labels: k1l, text: k1.text.slice(0, 200) });
    // two other systems add a row each to Kłos's menu (before and after the shop's), and one asks for a place after "Co słychać?"
    await t.eval(`(function(){ const k = Tawerna.talk; window.__offs = [k.option({ owner: "TestA", id: "a", who: "kwatermistrz", label: "Opcja A (test)", order: 500 }),
        k.option({ owner: "TestB", id: "b", who: "kwatermistrz", label: "Opcja B (test)", order: 400 }),
        k.option({ owner: "TestC", id: "c", who: "kwatermistrz", label: "Opcja C (test)", order: 900, run: () => [{ code: 355, indent: 0, parameters: ["window.__picked = (window.__picked || 0) + 1"] }] })]; return 0; })()`);
    const k2 = await t.talkTo(klosEv, ["Opcja C (test)"], { secs: 40 });
    const k2l = labels(k2), picked = await t.eval("window.__picked || 0");
    t.check("dwie wtyczki dopisują wiersze w menu Kłosa: B (order 400) przed sklepem, A (500, „TestA” po „Bron”) za nim, C (900) za „Co słychać?” - „Bywaj.” i tak ostatnie; wiersz z run() działa",
        k2.done && JSON.stringify(k2l) === JSON.stringify(["Sprzedam coś wojsku.", "Opcja B (test)", "Pokaż zbrojownię", "Opcja A (test)", "Co słychać?", "Opcja C (test)", "Bywaj."]) && picked === 1,
        { labels: k2l, picked });
    // a takeover above Garnizon's ("scene") has Kłos's talk; off() - his own again
    await t.eval(`(function(){ window.__offs.forEach(f => f()); window.__offs = [Tawerna.talk.takeover({ owner: "TestScena", who: "kwatermistrz", priority: "scene",
        run: c => [{ code: 101, indent: 0, parameters: ["", 0, 0, 2, "Kłos"] }, { code: 401, indent: 0, parameters: ["\\\\SPK[" + c.eventId + "]Scena testowa zabiera rozmowę."] }] })]; return 0; })()`);
    const k3 = await t.talkTo(klosEv, [], { secs: 40 });
    const k3by = await t.json("Tawerna.talk.last()");
    await t.eval("(function(){ window.__offs.forEach(f => f()); return 0; })()");
    const k4 = await t.talkTo(klosEv, ["Bywaj."], { secs: 40 });
    t.check("przejęcie „scene” wygrywa nad Garnizonem (jego linijka, bez menu); po off() - znów rozmowa Kłosa z menu",
        k3.done && k3by.by === "TestScena" && /Scena testowa zabiera rozmowę/.test(k3.text) && !labels(k3).length && k4.done && labels(k4)[0] === "Sprzedam coś wojsku.", { k3by, t3: k3.text, l4: labels(k4) });
    // the old door: TownLife.addTalkHook (first) - a takeover of the service, over the owners
    await t.eval(`(function(){ window.__oldHook = (key, ev) => key === "kwatermistrz" ? [{ code: 401, indent: 0, parameters: ["Stary hak mówi."] }] : null; TownLife.addTalkHook(window.__oldHook, true); return 0; })()`);
    const old = await t.json(`(function(){ const ev = TownLife.eventOf("kwatermistrz"); const r = Tawerna.talk.resolve(null, "kwatermistrz", { ev }); const tk = Tawerna.talk.takeovers("kwatermistrz").map(x => x.owner);
        return { by: r.by, first: r.list && r.list[0].parameters[0], tk }; })()`);
    t.check("stary TownLife.addTalkHook(fn, true) dalej działa - przez usługę, jako przejęcie „owner” (nad Garnizonem)",
        old.by === "addTalkHook" && old.first === "Stary hak mówi." && old.tk[0] === "addTalkHook", old);
    await t.eval(`(function(){ Object.assign(TownQuests, window.__qkeep); return 0; })()`);

    // a hidden resident never starts (the core's one start hook): the captain in his quarters at 10:00
    const hid = await t.json(`(function(){ const e = TownLife.eventOf("rotmistrz"); if (!e) return null; const was = !!(e._town && e._town.hidden);
        if (!was) return { was }; e.start(); return { was, starting: !!e._starting, running: $gameMap.isEventRunning() }; })()`);
    t.check("ukryty mieszkaniec (rotmistrz w kwaterze o 10:00) nie startuje - Tawerna.onEventStart (TownLife, „hidden”)", !!hid && hid.was && !hid.starting && !hid.running, hid);
    const lst = await t.json(`(function(){ const e = TownLife.eventOf("kwatermistrz"), STUB = [{ code: 355, indent: 0, parameters: ["0"] }, { code: 0, indent: 0, parameters: [] }];
        const before = JSON.stringify(e.list()); const off = Tawerna.onEventList(ev => (ev === e ? STUB : null), { owner: "Test", priority: 1000 });
        const during = e.list() === STUB, own = JSON.stringify(Tawerna.onEventList.own(e)) === before; off(); const after = JSON.stringify(e.list()) === before;
        return { during, own, after }; })()`);
    t.check("hak poleceń zdarzenia z wyższym priorytetem wygrywa, Tawerna.onEventList.own daje własne polecenia strony, po off() - jak było", lst.during && lst.own && lst.after, lst);

    // ---------------------------------------------------------------- an old save: Borgar's menu (Story) with TavernLife's rows
    const loaded = await t.loadFixture("tavern_evening");
    await t.frames(30);
    await t.eval("(function(){ const s = $gameSystem._story; if (s && s.flags) s.flags.hired = s.flags.hired || 1; return 0; })()");
    const b = loaded ? await t.talkTo("Story.borgarEvent()", ["Nie teraz"], { secs: 40 }) : null;
    const bl = labels(b), by = await t.json("Tawerna.talk.last()");
    const iz = bl.indexOf("Zjedz coś"), ip = bl.indexOf("Pogadaj");
    t.check("stary zapis (tavern_evening) wstaje; Borgar (Story przez usługę): „Zjedz coś”, „Wynajmij pokój” (TavernLife - opcja) przed „Pogadaj”, „Nie teraz” na końcu",
        !!loaded && !!b && b.done && by.who === "borgar" && iz >= 0 && bl[iz + 1] === "Wynajmij pokój" && ip > iz + 1 && bl[bl.length - 1] === "Nie teraz" && ip === bl.length - 2,
        { loaded, labels: bl, by });
});
