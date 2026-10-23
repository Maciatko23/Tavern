// Watki.js - the thread engine - without the game (docs/WATKI_DANE.md), and its pilot W4 "Krew kasztelana" ch. 6-8
// (Kasztelan_Data.js + js/teksty/kasztelan.txt):
//   - the texts' format: strings, lists, quotes keeping spaces, \n, comments, mistakes told with their lines, the object filled in place
//   - the talk builder: lines of 46, three a window, \SPK[n] on each window's first line, the hero's "> ", choices and their indent
//   - a thread with its own record (no TownQuests quest): state, conditions, actions, talks, the journal's source, F9
//   - a thread on a quest of a stand-in TownQuests: its steps at their indexes, the FX handlers, the step texts after the words come
//   - the pilot: kasztelan.txt without mistakes, every key the data names is in it; W4's steps 6-9 exactly as TownQuests_Data.js had
//     them; the data's talks give the very commands the old Kasztelan.js built (its code copied below) in every combination
// Run: node tests/unit/watki.test.js (or node tests/run.js unit)
"use strict";
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");
const ROOT = path.join(__dirname, "..", "..");

unit.test(t => {
    const sys = { _d: 63, _h: 23.5, dayNightDay() { return this._d; }, dayNightHour() { return this._h; }, setDayNightHour(h) { this._h = h; } };
    const globals = { $gameMap: { mapId: () => 1, event: () => null }, $gameParty: { gainItem() {}, gainGold() {} }, $dataItems: { 62: { name: "Łopata" }, 79: { name: "Węgiel" }, 86: { name: "Żelazo" } } };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(["TawernaCore", "Watki"], { globals });
    const T = w.Tawerna, W = w.Watki;

    // ================================================================ the texts' format
    const p = W.parse([
        "# a comment",
        "a = Ala ma kota.",
        "b.c = Pod spodem.",
        "spacja = \"  dwie spacje z przodu\"",
        "nowa = raz\\ntwa",
        "imie = \\N[1] zostaje",
        "pusty =",
        "[lista]   # a comment by the header",
        "> Bohater mówi.",
        "Postać mówi.",
        "# a comment inside the list",
        "\"# z krzyżykiem\"",
        "",
        "[dwie.listy]",
        "jedna",
        "",
        "zle linia bez klucza",
        "a = drugi raz",
        "b.c.d = pod tekstem"
    ].join("\r\n"), "probka");
    t.eq("texts: a string, a deeper key, the spaces kept in quotes, \\n a new line (not \\N[1]), an empty one",
        [p.tree.a, p.tree.b.c, p.tree.spacja, p.tree.nowa, p.tree.imie, p.tree.pusty], ["Ala ma kota.", "Pod spodem.", "  dwie spacje z przodu", "raz\ntwa", "\\N[1] zostaje", ""]);
    t.eq("texts: a list up to the empty line (comments skipped, a quoted # kept), a list under a deeper key", [p.tree.lista, p.tree.dwie.listy],
        [["> Bohater mówi.", "Postać mówi.", "# z krzyżykiem"], ["jedna"]]);
    t.check("texts: the mistakes told with their lines (a line not understood, a key twice - the first stays, a key under a text)",
        p.errors.length === 3 && /linia 17/.test(p.errors[0]) && /linia 18.*drugi raz/.test(p.errors[1]) && /linia 19/.test(p.errors[2]) && p.tree.a === "Ala ma kota.", p.errors);
    const obj = W.teksty("probny");
    let waited = 0;
    W.poTekstach(() => { waited = obj.tytul ? 1 : -1; });
    const same = W.wczytaj("probny", fs.readFileSync(path.join(__dirname, "..", "fixtures", "teksty", "probny.txt"), "utf8"));
    t.check("texts: Watki.teksty gives one object, filled in place when the file is read; what waited for the words runs then", same === obj && obj.tytul === "Próbny wątek" && waited === 1, { waited, tytul: obj.tytul });

    // ================================================================ the talk builder
    const M = W.mowa, spk = { id: 7, name: "Borgar" };
    const long = "Słowo ".repeat(40).trim();   // 239 characters
    const cmds = M.linesTo([], spk, ["> Krótko.", long], {});
    const texts = cmds.filter(c => c.code === 401).map(c => c.parameters[0]);
    t.check("talk: the hero's line (\\SPK[0]), then the long one in windows of 3 lines of at most 46 characters, \\SPK[7] on each window's first",
        cmds[0].code === 101 && texts[0] === "\\SPK[0]Krótko." && cmds.filter(c => c.code === 101).length === 1 + Math.ceil(M.wrap(long).length / 3) &&
        M.wrap(long).every(l => l.length <= 46) && texts[1].startsWith("\\SPK[7]") && !texts[2].startsWith("\\SPK") && texts[4].startsWith("\\SPK[7]"), texts.slice(0, 6));
    const ch = M.choiceTo([], ["Tak", "Nie"], [M.linesTo([], spk, ["Dobrze."]), []], 1);
    t.eq("talk: a choice - 102 with its cancel, each branch one deeper, 404 at the end", ch.map(c => c.code + ":" + c.indent), ["102:0", "402:0", "101:1", "401:1", "0:1", "402:0", "0:1", "404:0"]);

    // ================================================================ a thread with its own record (no quest)
    const notes = [], popups = [], journal = { sources: [], trackers: [] };
    T.register("Journal", { addNote: (a, b) => notes.push([a, b]), addQuestSource: s => journal.sources.push(s), addTrackerSource: f => journal.trackers.push(f) });
    const _popup = T.popup;
    T.popup = (text, o) => { popups.push([text, (o && o.sub) || ""]); return true; };
    const tw = W.watek({
        id: "probny", teksty: "probny", stan: { klucz: "probny", wersja: 1, domyslne: () => ({ n: 0, kto: "" }) },
        dziennik: { tytul: "tytul", opis: "opis", grupa: "side", ikona: 5 },
        kroki: [{ nazwa: "pierwszy", ch: 1, gotowe: "stan:n=2" }, { nazwa: "drugi", ch: 2, zmienne: "ile" }],
        akcje: { dodaj: [{ gdy: "stan:n=2", koniec: true }, { stan: { n: { hak: "plusJeden" }, kto: { arg: 0 } } }, { notatka: "notka", zmienne: { hak: "ile" } }] },
        rozmowy: {
            rozmowa: ["powitanie", { gdy: "ctx:obcy", mow: "obcy", koniec: true }, { wybor: [
                { etykieta: "opcje.tak", tresc: ["zgoda", { zrob: "dodaj", args: [{ hak: "kto" }] }] },
                { etykieta: "opcje.ukryta", gdy: "stan:n=5", tresc: [] },
                { etykieta: "opcje.nie", tresc: [{ losowo: "odmowy" }] }] }]
        },
        f9: { rodzaj: "isleProbny" }, skoki: { lista: { 1: { ch: 2, krok: "drugi", godzina: 8, idz: [3, 4, 5, 2] } } }
    });
    tw.haki({ plusJeden: () => tw.S().n + 1, kto: () => "Ala", ile: () => ({ n: tw.S().n }) });
    t.check("own record: Watki.watek gives the thread its state (Tawerna.state, its version) and the journal's source 'watki'",
        tw.S().n === 0 && T.state.version("probny") === 1 && journal.sources.some(s => s.name === "watki") && journal.trackers.length === 1);
    const talk = tw.rozmowa("rozmowa", { spk });
    const talkCodes = talk.map(c => c.code), script = talk.find(c => c.code === 355);
    t.check("own record: a talk - the greeting, a choice of two (the hidden option left out, cancel = the last), the action's script call with the hook's value",
        talkCodes.filter(c => c === 402).length === 2 && talk.find(c => c.code === 102).parameters[0].join("|") === "Tak|Nie" && talk.find(c => c.code === 102).parameters[1] === 1 &&
        script && script.parameters[0] === 'Watki.act(this, ["probny","dodaj","Ala"])', talk.map(c => c.code + " " + JSON.stringify(c.parameters).slice(0, 60)));
    t.check("own record: koniec - a stranger hears the greeting and his line only", tw.rozmowa("rozmowa", { spk, obcy: true }).filter(c => c.code === 102).length === 0);
    tw.start(0);
    W.act({}, ["probny", "dodaj", "Ala"]);
    t.check("own record: started ('Nowy wątek' at the top), an action from a talk: the state from a hook and an argument, the note with words",
        tw.cur() === "pierwszy" && tw.S().n === 1 && tw.S().kto === "Ala" && notes.some(n => n[0] === "Notka" && n[1] === "Licznik: 1.") && popups.some(x => /Nowy wątek: Próbny wątek/.test(x[0])),
        { s: tw.S(), notes, popups });
    W.act({}, ["probny", "dodaj", "Ala"]);
    W.act({}, ["probny", "dodaj", "Ala"]);
    tw.ownChecks();
    const rows = journal.sources[0].items();
    t.check("own record: the condition gotowe (stan:n=2) moves it to chapter 2 by itself; koniec stops the action at 2; the journal's row (POBOCZNE, rozdz. 2)",
        tw.S().n === 2 && tw.cur() === "drugi" && rows.length === 1 && rows[0].group === "side" && rows[0].right === "rozdz. 2" && rows[0].label === "Próbny wątek", { s: tw.S(), rows });
    const det = journal.sources[0].detail(rows[0]).map(o => o.text || "").join(" | ");
    t.check("own record: the journal's detail - the title, the description, 'Rozdział 2' with the step's words, what was done", /Próbny wątek/.test(det) && /Opis próbnego/.test(det) && /Rozdział 2/.test(det) && /Teraz licznik 2\./.test(det) && /✓ Pierwszy krok/.test(det), det);
    const sec = W.f9.sekcje().find(s => s.watek === "probny");
    t.check("own record: F9 - its section and row (the kind from the data, the label from the texts)", !!sec && sec.rows[0].kind === "isleProbny" && sec.rows[0].label === "Próbny: rozdział 2 - drugi krok" && sec.head === "Wątek próbny:", sec);
    tw.next({});
    t.check("own record: past the last step - done (UKOŃCZONE in the journal)", tw.rec().s === "done" && journal.sources[0].items()[0].group === "done");
    T.popup = _popup;

    // ================================================================ the pilot W4: a stand-in TownQuests with W4's chapters 1-5
    const OLD_STEPS = [   // (TownQuests_Data.js before 2026-10-23: W4's steps 6-9 - the fields TownQuests reads)
        { ch: 6, type: "custom", check: "w4Rod", talk: "w4Rod", vars: "w4Rod", rewardFx: "w4RodReward", reward: { xp: 120 },
            text: "Kowale z twierdzy. Kim był ród Borgara - i skąd jego zdanie „Nie pytam o to, czego nie chcę wiedzieć”? Poszlaki: {n} z {need}{jest}. {gdzie}" },
        { ch: 7, type: "custom", talk: "w4Konfrontacja",
            text: "Konfrontacja. Pokaż Borgarowi klucz i powiedz, co wiesz o jego rodzie - po zamknięciu, 23–1, przy barze. Albo uszanuj jego zdanie i przemilcz. To jego tawerna." },
        { ch: 7, type: "custom", vars: "w4Piwnica",
            text: "Borgar się wściekł i zamknął tawernę na dzień {dzien} - bez zmiany. Następnej nocy, od 23:00, czeka w piwnicy przy kracie." },
        { ch: 8, type: "custom", talk: "w4Serce", check: "w4Serce", vars: "w4Serce", reward: { xp: 400 }, text: "{serce}" }
    ];
    const calls = [];
    const TQ = {
        Q: { W4: { id: "W4", steps: [{ talk: "w4Borgar" }, { type: "spot" }, { type: "bring" }, { talk: "w4Key" }, { check: "w4Gate" }, { talk: "w4Tell" }] } },
        FX: {}, st: { flags: {}, v: {}, q: {} },
        state() { return this.st; }, rec(id) { return this.st.q[id] || null; },
        completeStep(id, o) { calls.push(["complete", id, o]); const r = this.st.q[id]; r.step = o && o.to !== undefined ? o.to : r.step + 1; },
        start(id, step) { this.st.q[id] = { s: "active", step: step || 0, day: 1, sday: 1, t: { done: {} } }; calls.push(["start", id, step]); },
        autoChecks() { calls.push(["autoChecks"]); }, refreshMarkers() {}
    };
    T.register("TownQuests", TQ);
    unit.load(["Kasztelan_Data"], { window: w });
    const k = W.get("kasztelan");
    const raw = fs.readFileSync(path.join(ROOT, "js", "teksty", "kasztelan.txt"), "utf8");
    const parsed = W.parse(raw, "kasztelan");
    W.wczytaj("kasztelan", raw);
    t.check("pilot: js/teksty/kasztelan.txt read without mistakes (" + parsed.keys.length + " keys)", parsed.errors.length === 0 && parsed.keys.length > 100, parsed.errors);
    const steps = TQ.Q.W4.steps.slice(6).map(s => { const o = Object.assign({}, s); delete o.nazwa; return o; });
    t.eq("pilot: W4 gets its steps 6-9 at their indexes, field for field and word for word as TownQuests_Data.js had them (old saves: the same step numbers)", steps, OLD_STEPS);
    t.check("pilot: the FX handlers under the steps' names (TownQuests asks them), the chapter-6 reward's own handler",
        ["w4Rod", "w4Konfrontacja", "w4Piwnica", "w4Serce", "w4RodReward"].every(n => !!TQ.FX[n]) && typeof TQ.FX.w4Rod.talk === "function" && typeof TQ.FX.w4Konfrontacja.borgarList === "function" &&
        typeof TQ.FX.w4Serce.check === "function" && typeof TQ.FX.w4RodReward.reward === "function" && !TQ.FX.w4Serce.talk);
    // every key the data names is in the file
    const TX = k.tx, missing = [];
    const need = key => { if (k.tekst(key) === undefined) missing.push(key); };
    const walk = e => {
        if (!e) return;
        if (typeof e === "string") return need(e);
        if (Array.isArray(e)) return e.forEach(walk);
        for (const key of ["mow", "losowo", "notatka", "ogloszenie", "info", "mysl"]) if (typeof e[key] === "string" && !/\{/.test(e[key])) need(e[key]);
        if (e.wybor) for (const o of e.wybor) { need(o.etykieta); walk(o.tresc); }
        walk(e.to); walk(e.inaczej); walk(e.tresc); walk(e.zrob && Array.isArray(e.zrob) ? e.zrob : null);
        if (e.nagroda && e.nagroda.notatka) need(e.nagroda.notatka);
    };
    for (const list of Object.values(k.def.rozmowy)) walk(list);
    for (const list of Object.values(k.def.akcje)) walk(list);
    for (const s of k.def.kroki) { need("kroki." + s.nazwa); if (s.temat) { need(s.temat.etykieta); walk(s.temat.tresc); } for (const r of s.rozmowy || []) walk(r.tresc); }
    for (const i of Object.keys(k.def.skoki.lista)) need("f9.nazwy." + i);
    for (const key of ["f9.naglowek", "f9.etykieta", "f9.opis", "f9.brak", "tops.idzie", "tops.pilnuje", "tops.ostrzegl"]) need(key);
    t.check("pilot: every text key the data names is in kasztelan.txt (talks, choices, notes, notices, steps, F9)", missing.length === 0, missing);

    // ---- the old Kasztelan.js's talks (a copy of its code before 2026-10-23) against the data's, in every combination
    const old = oldTalks(TX);
    const env = {}, sk = () => k.S(), fl = TQ.st.flags;
    k.haki({
        rozdzial1: () => env.ended, poZamknieciu: () => env.hours, nocePending: () => env.nights, przygotowany: () => !!(fl.w3Borgar || fl.w4Faster || fl.borgarKnows),
        zaufanie: ctx => old.score(env, fl, !!ctx.noce).ok, powodyTak: ctx => old.score(env, fl, !!ctx.noce).why, powodyNie: ctx => old.score(env, fl, !!ctx.noce).whyNot,
        nocWPiwnicy: () => env.cellarNight, pogodzenieGotowe: () => env.reconcile, sync: () => 0, dzienZamkniecia: () => (sys._h >= 12 ? sys._d + 1 : sys._d)
    });
    const norm = list => JSON.stringify(list.map(c => {
        const m = c.code === 355 && /^Kasztelan\.act\(this, (.*)\)$/.exec(c.parameters[0]);
        if (!m) return c;
        const a = JSON.parse(m[1]), name = { clue: x => (x === "kleofas" ? "poszlakaKleofas" : "poszlakaDziadek"), tell: () => "tell", anger: () => "anger", keep: () => "keep",
            verdict: x => x, fire: () => "zwolnij", back: () => "pogodzenie" }[a[0]](a[1]);
        return Object.assign({}, c, { parameters: ["Watki.act(this, " + JSON.stringify(["kasztelan", name].concat(a[0] === "tell" ? [!!a[1]] : [])) + ")"] });
    }));
    const _random = Math.random;
    let combos = 0;
    const diffs = [];
    for (let bits = 0; bits < 1 << 10; bits++) {
        const b = i => !!(bits & (1 << i));
        Object.assign(env, { ended: b(0) || b(9), hours: b(1) || b(9), nights: b(2), trust: b(3), cellarNight: b(9), reconcile: b(8) });
        for (const f of Object.keys(fl)) delete fl[f];
        if (b(4)) fl.w3Borgar = 1;
        if (b(5)) fl.borgarKnows = 1;
        if (b(6)) { fl.w7LordFirst = 1; if (b(7)) fl.w7KlamstwoWyszlo = 1; }
        const s = sk();
        s.clues = b(7) ? { lista: 1, dziadek: 1 } : b(6) ? { wpis: 1 } : {};
        for (const r of [0, 0.99]) {
            Math.random = () => r;
            combos++;
            const pairs = [
                ["konfrontacja", old.confrontList(env, fl, s, spk), k.rozmowa("konfrontacja", { spk })],
                ["werdykt", old.verdict(env, fl, spk, env.nights), k.rozmowa("werdykt", { spk, noce: env.nights })],
                ["piwnicaBorgar", old.cellar(env, fl, spk), k.rozmowa("piwnicaBorgar", { spk })],
                ["warta", old.post(spk, b(2)), k.rozmowa("warta", { spk, pierwszy: b(2) })],
                ["krata", old.grate(), k.rozmowa("krata", { spk: M.HERO })],
                ["kleofas", old.clueTalk("pustelnik", spk), k.build(k.def.kroki[0].rozmowy[0].tresc, { spk }, [])],
                ["dziadek", old.clueTalk("grandpa", spk), k.build(k.def.kroki[0].rozmowy[1].tresc, { spk }, [])],
                ["pogodzenie", env.reconcile ? old.reconcile(spk) : [], TQ.FX.w4Serce.borgarList(null, null, null, spk)],
                ["zamkniete", old.closed(spk), k.rozmowa("zamkniete", { spk })],
                ["kosz", old.basket(), k.rozmowa("kosz", { spk: M.HERO })]
            ];
            for (const [name, a, bb] of pairs) if (norm(a) !== JSON.stringify(bb) && diffs.length < 3) diffs.push({ name, bits, r, old: norm(a).slice(0, 400), now: JSON.stringify(bb).slice(0, 400) });
        }
    }
    Math.random = _random;
    t.check("pilot: the data's talks give the old commands exactly - confrontation, his answer, the cellar's night, the post, the grate, Kleofas, grandpa, making up, the shut bar, the basket (" + combos + " combinations)", diffs.length === 0, diffs);
    env.reconcile = false;
    const topic = [TQ.FX.w4Konfrontacja.borgarTopic(), TQ.FX.w4Serce.borgarTopic()];
    env.reconcile = true;
    topic.push(TQ.FX.w4Serce.borgarTopic());
    Object.assign(env, { ended: true, hours: false });
    const r1 = TQ.FX.w4Konfrontacja.ready(null, null, null, "borgar"), r2 = TQ.FX.w4Konfrontacja.ready(null, null, null, "kowal");
    t.check("pilot: Borgar's topics at the bar ('chodzi o twój ród' always, 'po tamtej nocy?' only when he takes the hero back), ready only with chapter 1 over and after closing",
        topic[0] === "Borgarze... chodzi o twój ród." && topic[1] === null && topic[2] === "Borgarze... po tamtej nocy?" && r1 === false && r2 === null, { topic, r1, r2 });

    // ---- the actions: Borgar's answers, the anger, the keeping silent (TownQuests' completeStep with the old reward)
    const st = k.S();
    Object.assign(st, { stance: "", how: "", closed: 0, verdict: 0, warned: 0, fired: 0, back: 0 });
    for (const f of Object.keys(fl)) delete fl[f];
    TQ.st.q.W4 = { s: "active", step: 8, day: 1, sday: 1, t: { done: {} } };
    calls.length = 0;
    W.act({}, ["kasztelan", "ostrzegl"]);
    const c1 = calls.find(c => c[0] === "complete");
    t.check("pilot: 'ostrzegl' - he keeps the grate with the warning: stance, verdict and warned today, the flags, chapter 7 done to w4Serce (+200, the note 'Borgar pilnuje piwnicy')",
        st.stance === "pilnuje" && st.verdict === 63 && st.warned === 63 && fl.borgarPilnuje === 63 && fl.borgarOstrzegl === 63 && !fl.borgarIdzie &&
        c1 && c1[2].to === 9 && c1[2].reward.xp === 200 && c1[2].reward.opinion === 0 && c1[2].reward.note[0] === "Borgar pilnuje piwnicy", { st, fl, c1 });
    calls.length = 0;
    W.act({}, ["kasztelan", "idzie"]);
    t.check("pilot: a second answer changes nothing (his word given)", st.stance === "pilnuje" && !calls.some(c => c[0] === "complete"));
    Object.assign(st, { stance: "", warned: 0 });
    TQ.st.q.W4.step = 7;
    sys._h = 13;
    W.act({}, ["kasztelan", "anger"]);
    const c2 = calls.find(c => c[0] === "complete");
    t.check("pilot: 'anger' after noon - the tavern shut the next day (64), the flag, chapter 7 to the cellar's night (+100)",
        st.closed === 64 && fl.borgarZamknal === 63 && c2 && c2[2].to === 8 && c2[2].reward.xp === 100 && k.mysli().length === 1, { st, c2, m: k.mysli() });

    // ---- F9: the jumps of the data
    const story = { flags: {}, paid: 0, debt: 2500 };
    T.register("Story", { active: () => true, state: () => story, chapterEnded: () => story.paid >= story.debt, chapterDone() { story.done = 1; } });
    const U = { opened: null, open() { this.opened = true; }, close() { this.opened = false; }, state: () => ({ notes: {} }) };
    T.register("Underground", U);
    k.haki({
        fabula: () => true, rozdzial1: () => story.paid >= story.debt,
        zamknijRozdzial1: () => { story.flags.hired = true; story.paid = story.debt; },
        krata: (ctx, how) => (how === "zamknij" ? U.close() : U.open()), zapiski: () => { k.S().rod = k.S().rod || 63; }
    });
    const got = [];
    for (let i = 1; i <= 9; i++) { delete TQ.st.q.W4; const g = W.skocz("kasztelan", i); got.push([i, g && g[0], TQ.st.q.W4 && TQ.st.q.W4.step, sys._h]); }
    t.check("pilot F9: jumps 1-9 put W4 on steps 0, 1, 2, 4, 5, 6, 7, 8, 9, at the hour of the data, and say where (chapter 1 closed first: the debt paid)",
        got.map(x => x[2]).join() === "0,1,2,4,5,6,7,8,9" && got.every(x => x[1] > 0) && got[6][3] === 23.5 && story.paid === 2500 && TQ.st.v.klucz_kasztelana >= 1 && U.opened === true &&
        st.how === "tell" && fl.borgarIdzie, got);
    const row = W.f9.sekcje().find(s => s.watek === "kasztelan");
    t.check("pilot F9: the W4 row as Debug.js had it ('isleW4', its header, 'W4: rozdział 1 - pół klucza znad baru   ←→ zmień, OK idź')",
        row && row.head === "Wątek W4 (Borgar, krew kasztelana):" && row.rows[0].kind === "isleW4" && row.rows[0].label === "W4: rozdział 1 - pół klucza znad baru   ←→ zmień, OK idź", row);
    const r9 = Object.assign({}, row.rows[0]);
    W.f9.wybierz(r9, -1);
    t.check("pilot F9: ← from chapter 1 goes round to the 9th jump ('W4: rozdział 8 - Komnata Serca')", r9.pick === 9 && r9.label === "W4: rozdział 8 - Komnata Serca   ←→ zmień, OK idź", r9);
});

// ==================================================================== the old Kasztelan.js's talks (before 2026-10-23), as they were
function oldTalks(TX) {
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) {
            if (!w) continue;
            if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
        }
        if (line) out.push(line);
        return out;
    }
    function sayTo(out, spk, text) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""]));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l])));
        }
        return out;
    }
    function linesTo(out, spk, arr, vars) {
        for (const raw of [].concat(arr || [])) {
            if (!raw) continue;
            const s = fill(raw, vars);
            if (s.startsWith("> ")) sayTo(out, HERO, s.slice(2)); else sayTo(out, spk, s);
        }
        return out;
    }
    function choiceTo(out, labels, branches, cancel) {
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0]));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l]));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + 1 }));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        return out;
    }
    const act = (out, args) => (out.push(C(355, ["Kasztelan.act(this, " + JSON.stringify(args) + ")"])), out);
    function score(env, f, nightsNow) {
        const why = [], whyNot = [];
        let n = 0;
        if (f.w3Borgar || f.w4Faster) { n++; why.push(TX.whySong); }
        if (f.borgarKnows || nightsNow) { n++; why.push(TX.whyNights); }
        if (env.trust) { n++; why.push(TX.whyShifts); } else whyNot.push(TX.whyNotShifts);
        if (f.w7LordFirst && !f.w7KlamstwoWyszlo) { n--; whyNot.unshift(TX.whyNotLord); }
        if (!whyNot.length) whyNot.push(TX.whyNotAny);
        return { n, ok: n >= 2, why: why.slice(0, 2), whyNot: whyNot.slice(0, 2) };
    }
    function verdict(env, f, spk, nightsNow, out) {
        out = out || [];
        linesTo(out, spk, TX.grandma);
        if (f.borgarKnows || nightsNow) linesTo(out, spk, TX.grandmaNights);
        linesTo(out, spk, TX.grandmaEnd);
        linesTo(out, spk, [TX.verdictAsk]);
        const sc = score(env, f, nightsNow), come = [], stay = [];
        linesTo(come, HERO, TX.askCome);
        if (sc.ok) { linesTo(come, spk, sc.why.concat(TX.comeYes)); act(come, ["verdict", "idzie"]); }
        else { linesTo(come, spk, TX.comeNo.concat(sc.whyNot, TX.comeNoEnd)); act(come, ["verdict", "ostrzegl"]); }
        linesTo(stay, HERO, TX.askStay);
        linesTo(stay, spk, TX.stayYes);
        act(stay, ["verdict", "pilnuje"]);
        return choiceTo(out, [TX.optCome, TX.optStay], [come, stay], -1);
    }
    function tellBranch(env, f, s, spk) {
        const out = [], cl = s.clues, nights = env.nights, ready = !!(f.w3Borgar || f.w4Faster || f.borgarKnows);
        linesTo(out, HERO, TX.tellCore);
        if (cl.lista) linesTo(out, HERO, TX.tellLista);
        if (cl.wpis || cl.przeor || cl.kleofas || cl.napis) linesTo(out, HERO, TX.tellSlowa);
        if (cl.dziadek) linesTo(out, HERO, TX.tellDziadek);
        linesTo(out, HERO, TX.tellKlucz);
        if (nights) linesTo(out, HERO, TX.tellNoce);
        act(out, ["tell", nights ? 1 : 0]);
        if (f.w7LordFirst && !f.w7KlamstwoWyszlo) linesTo(out, spk, TX.lordFirst);
        if (ready) {
            linesTo(out, spk, f.w3Borgar || f.w4Faster ? TX.preparedSong : TX.preparedNights);
            return verdict(env, f, spk, nights, out);
        }
        linesTo(out, spk, TX.anger);
        return act(out, ["anger"]);
    }
    function keepBranch(spk) {
        const out = [];
        linesTo(out, HERO, TX.keepThink);
        linesTo(out, HERO, TX.keepSay);
        linesTo(out, spk, TX.keepBorgar);
        return act(out, ["keep"]);
    }
    return {
        score, verdict: (env, f, spk, n) => verdict(env, f, spk, n),
        confrontList(env, f, s, spk) {
            const out = [];
            if (!env.ended) return linesTo(out, spk, TX.notYet);
            if (!env.hours) return linesTo(out, spk, [pick(TX.notNow)]);
            linesTo(out, spk, TX.intro);
            linesTo(out, HERO, TX.introHero);
            linesTo(out, spk, [TX.ask]);
            return choiceTo(out, [TX.optTell, TX.optKeep, TX.optLater], [tellBranch(env, f, s, spk), keepBranch(spk), linesTo([], spk, TX.later)], 2);
        },
        cellar(env, f, spk) {
            if (env.cellarNight) return verdict(env, f, spk, false, linesTo([], spk, TX.cellarIntro));
            return linesTo([], spk, [pick(TX.cellarGuard)]);
        },
        post: (spk, first) => linesTo([], spk, first ? TX.postFirst : [pick(TX.postLines)]),
        grate() {
            const out = [], yes = [];
            linesTo(out, HERO, TX.grateWarn);
            linesTo(out, HERO, [TX.grateAsk]);
            act(yes, ["fire"]);
            yes.push(C(355, ["Kasztelan.grateDown(this)"]));
            return choiceTo(out, [TX.optDown, TX.optUp], [yes, []], 1);
        },
        clueTalk(key, spk) {
            const out = [];
            if (key === "pustelnik") { linesTo(out, spk, TX.kleofas); return act(out, ["clue", "kleofas"]); }
            linesTo(out, spk, TX.dziadek);
            return act(out, ["clue", "dziadek"]);
        },
        reconcile: spk => act(linesTo([], spk, TX.reconcile), ["back"]),
        closed: spk => linesTo([], spk, TX.closedBar),
        basket: () => linesTo([], HERO, TX.basketTake)
    };
}
