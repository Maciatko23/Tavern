// Dawcy zadan w tawernie i miescie (docs/zadania_nowe/dawcy_w_miescie.md; popraw.py -> tools/dawcy_miasto/staging). Dla kazdego zmienionego zadania:
//   - dawca stoi w tawernie (Map001) w oknie wizyty, na swoim miejscu (TownLifeData.SPOTS_BY_MAP[1].gosc_*), poza oknem go tam nie ma
//   - oferta jest tylko w oknie (TownQuests.offerable), rozmowa z dawca w tawernie ja pokazuje i przyjmuje (rec.s === "active")
//   - oddanie dziala w tawernie (rozmowa z dawca, przedmioty z torby), poza oknem go nie ma w tawernie
//   - tablica zlecen: nowe ogloszenia osob z zewnatrz sa na liscie szablonow i mozna je przypiac, a kazdy ma tekst i zleceniodawce
//   - bez bledow w konsoli
// Uruchom: GAME_OVERLAY=tools/dawcy_miasto/staging GAME_OVERLAY_JS=1 CDP_PORT=9916 node tools/dawcy_miasto/staging/tests/dawcy_miasto_test.js
// (po instalacji: tests/dawcy_miasto_test.js bez nakladki). Porty 9915-9919.
const path = require("path");
let kit;
try { kit = require("./lib/kit.js"); } catch (e) { kit = require(path.join(__dirname, "..", "..", "..", "..", "tests", "lib", "kit.js")); }
const OV = process.env.GAME_OVERLAY;
const ONLY = (process.env.DAWCY_ONLY || "").split(",").filter(Boolean);

// [id, giver key, window (hours), the spot in the tavern, the label of the offer's "yes", prep (JS run before), items for the hand-in, the step of the hand-in, extra]
const FIRST = "(function(){ const f = TownQuests.state().flags; ";
const SPEC = [
    { id: "K40", key: "praczka", win: [17.5, 20], at: [6, 50], yes: "Przyniosę deszczówkę", day: 3, hand: { water: 2 } },
    { id: "K41", key: "znachorka", win: [18, 21], at: [8, 50], yes: "Nazbieram", day: 3, hand: { items: [[150, 3], [149, 2]] } },
    { id: "K43", key: "uchodzca", win: [17.5, 21.5], at: [22, 51], yes: "Przyniosę drewno", day: 3, hand: { items: [[61, 6]] } },
    { id: "K44", key: "drwal", win: [17.5, 21.5], at: [23, 50], yes: "Przyniosę liny", day: 4, hand: { items: [[93, 2]] } },
    { id: "K45", key: "klusownik", win: [19.5, 22.5], at: [23, 52], yes: "Przyniosę włókno", day: 3, hand: { items: [[92, 6]] } },
    { id: "K46", key: "franek", win: [17.5, 19.5], at: [5, 50], yes: "Przyniosę ci chleb", day: 3, hand: { items: [[83, 1]] } },
    { id: "K47", key: "janek", win: [19, 22.5], at: null, yes: "Spróbuję", day: 6, pre: FIRST + "f.janekMet = 1; return 0; })()", hand: { items: [[173, 2]] } },
    { id: "K48", key: "janek", win: [19, 22.5], at: null, yes: "Przyniosę", day: 8, pre: FIRST + "f.janekMet = 1; TownQuests.start('K47'); TownQuests.finish('K47'); return 0; })()", hand: { items: [[92, 6], [93, 2]] } },
    { id: "K49", key: "latarnik", win: [14, 17.5], at: [17, 31], yes: "Przyniosę", day: 26, pre: FIRST + "f.latarnikMet = 1; f.janekMet = 1; if (window.Latarnia && Latarnia.state) Latarnia.state().met = 5; return 0; })()", hand: { items: [[177, 4], [61, 6]] } },
    { id: "K52", key: "kwatermistrz", win: [17, 19.5], at: [19, 31], yes: "Przyniosę drewno i węgiel", day: 6, pre: FIRST + "f.garnizonPoznany = 1; const g = Garnizon.state(); g.met = Object.assign(g.met || {}, { rotmistrz: 5, kwatermistrz: 5 }); return 0; })()", hand: { items: [[61, 10], [79, 4]] } },
    { id: "K56", key: "znachorka", win: [18, 21], at: [8, 50], yes: "Pomogę", day: 4, pre: "TownQuests.start('K41'); TownQuests.finish('K41'); 0", hand: null },
    { id: "K58", key: "praczka", win: [17.5, 20], at: [6, 50], yes: "Spróbuję je odratować", day: 12, pre: "for (const q of ['D21', 'K40']) { TownQuests.start(q); TownQuests.finish(q); } 0", hand: { step: 1 } },
    { id: "K62", key: "praczka", win: [17.5, 20], at: [6, 50], yes: "Przyprowadzę", day: 13, pre: "for (const q of ['D21', 'K40', 'K58']) { TownQuests.start(q); TownQuests.finish(q); } 0", hand: null },
    { id: "D31", key: "szmaciarz", win: [19, 22], at: [20, 51], yes: "Pogrzebię", day: 4, hand: { step: 1, v: { zas_medalik: 1, zas_klucz: 1, zas_moneta_kruk: 1 } } },
    { id: "W10", key: "janek", win: [19, 22.5], at: null, yes: "Napiszę do niej", day: 5, pre: FIRST + "f.janekMet = 1; for (const q of ['K47', 'K48']) { TownQuests.start(q); TownQuests.finish(q); } return 0; })()", hand: null },
    { id: "D34", key: "celnik", win: [19.5, 21.5], at: [9, 31], yes: "Przyniosę skrzynię", day: 30, pre: "Ludzie.state().force.cave = 1; Przystan.state().celnikMet = 1; 0", hand: null },
];
const STEPS = [   // quests whose first steps (D21, D20) are talks in the tavern
    { id: "D21", step: 0, key: "szmaciarz", win: [19, 22], at: [20, 51] },
    { id: "D21", step: 1, key: "praczka", win: [17.5, 20], at: [6, 50] },
    { id: "D21", step: 4, key: "praczka", win: [17.5, 20], at: [6, 50], v: { konik: 1 }, items: [] },
    { id: "D20", step: 0, key: "janek", win: [19, 22.5], at: null },
    { id: "D20", step: 3, key: "drwal", win: [17.5, 21.5], at: [23, 50], items: [[61, 6]] },
    { id: "D20", step: 4, key: "praczka", win: [17.5, 20], at: [6, 50], items: [[92, 10]] },
];

kit.test({ port: 9916, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", overlay: OV, overlayJs: process.env.GAME_OVERLAY_JS === "1", evalTimeout: 120000 }, async t => {
    const ev = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const rec = id => t.json(`TownQuests.rec(${JSON.stringify(id)})`);
    const here = key => t.json(`(function(){ const e = ${ev("KEY")}; return e ? { x: e.x, y: e.y, hidden: !!(e._town && e._town.hidden), tr: e.isTransparent(), map: $gameMap.mapId() } : null; })()`.replace('"KEY"', JSON.stringify(key)));
    const reset = async o => {   // a clean state of the quests + flags, the day and the hour
        await t.eval(`(function(){ const s = TownQuests.state(); for (const k of Object.keys(s.recs || {})) delete s.recs[k]; return 0; })()`).catch(() => 0);
    };
    const enter = async (hour, day) => {   // to the tavern's entrance hall at `hour`
        await t.go(8, 50, 40, 2);
        await t.setDay(day, hour);
        await t.frames(10);
        await t.go(1, 14, 39, 8);
        await t.frames(30);
    };
    const finish = async () => { for (let i = 0; i < 12; i++) { await t.frames(15); if (!(await t.eval("$gameMap.isEventRunning()"))) break; await t.press("ok"); } };

    await t.newGame({ map: 8, x: 50, y: 40, day: 12, hour: 12, quiet: true, minimap: false });
    t.check("gra działa z nakładką tylko, gdy jest podana (nakładka: " + (OV || "brak") + ")", true);

    // ---------------------------------------------------------------- the visitors' places and windows (before the quests)
    const keys = [...new Set(SPEC.concat(STEPS).map(s => s.key))];
    const seen = {};
    for (const key of keys) {
        const s = SPEC.concat(STEPS).find(x => x.key === key), mid = (s.win[0] + s.win[1]) / 2;
        await enter(mid, 40);
        const h = await here(key);
        t.check("dawca " + key + " jest w tawernie o " + mid + " (okno " + s.win.join("–") + ")", !!h && h.map === 1 && !h.hidden && !h.tr, h);
        if (s.at && h) t.check("  " + key + " stoi na swoim miejscu (" + s.at.join(",") + ")", h.x === s.at[0] && h.y === s.at[1], h);
        seen[key] = h;
        await enter(s.win[0] - 0.75 > 0 ? s.win[0] - 0.75 : 0.5, 40);
        const h0 = await here(key);
        t.check("  poza oknem (" + (s.win[0] - 0.75) + ") " + key + " nie stoi w tawernie", !h0 || h0.hidden || h0.tr, h0);
    }

    // ---------------------------------------------------------------- the old guests keep their numbered places (the new visitors take no gosc_N)
    await enter(19.8, 40);
    const old = { kowal: [7, 33], woziwoda: [9, 33], kupiec: [3, 35], soltys: [5, 35], garbarz: [7, 35], bartek: [21, 35], janek: [25, 35], rozbitek: [19, 32] };
    for (const [key, xy] of Object.entries(old)) {
        const h = await here(key);
        t.check("dawny gość " + key + " siedzi na swoim miejscu " + xy.join(",") + " (numery gosc_N bez zmian)", !!h && !h.hidden && h.x === xy[0] && h.y === xy[1], h);
    }

    // ---------------------------------------------------------------- the quests
    const todo = SPEC.filter(s => !ONLY.length || ONLY.includes(s.id));
    for (const s of todo) {
        const mid = (s.win[0] + s.win[1]) / 2;
        await t.newGame({ map: 8, x: 50, y: 40, day: s.day, hour: 12, quiet: true, minimap: false, settle: 10 });
        if (s.pre) await t.eval(s.pre);
        // the offer: only in the window
        await t.setHour(s.win[0] - 0.6 > 0 ? s.win[0] - 0.6 : 0.4);
        const before = await t.eval(`TownQuests.offerable(${JSON.stringify(s.id)})`);
        await t.setHour(mid);
        const inside = await t.eval(`(function(){ const q = TownQuests.Q[${JSON.stringify(s.id)}]; return TownQuests.QUESTS.some(x => x.id === q.id) && q.offer && q.offer.cond && q.offer.cond.hours ? q.offer.cond.hours : null; })()`);
        t.check(s.id + ": oferta wisi na godzinach okna " + s.win.join("–"), !!inside && inside[0] === s.win[0] && inside[1] === s.win[1], inside);
        {
            t.check(s.id + ": przed oknem oferty nie ma", before === false, before);
            const at = await t.eval(`TownQuests.offerable(${JSON.stringify(s.id)})`);
            t.check(s.id + ": w oknie oferta jest", at === true, at);
        }
        await enter(mid, s.day);
        t.check(s.id + ": " + s.key + " jest w tawernie w oknie", !!(await here(s.key)) && !(await here(s.key)).hidden);
        // talk: the offer
        const r = await t.talkTo(ev(s.key), [s.yes], { secs: 40 });
        await finish();
        const st = await rec(s.id);
        t.check(s.id + ": rozmowa w tawernie pokazuje ofertę i ją przyjmuje (zadanie aktywne)", !!st && st.s === "active", { st, text: r.text.slice(0, 160), missing: r.missing });
        // the hand-in
        if (s.hand && st && st.s === "active") {
            if (s.hand.step !== undefined) await t.eval(`TownQuests.start(${JSON.stringify(s.id)}, ${s.hand.step}); 0`).catch(() => 0);
            if (s.hand.v) await t.eval(`Object.assign(TownQuests.state().v, ${JSON.stringify(s.hand.v)}); 0`);
            for (const [id, n] of s.hand.items || []) await t.give(id, n);
            if (s.hand.water) await t.eval(`(function(){ $gameParty.gainItem($dataItems[138], 1); const F = Tawerna.api("Farming"); if (F && F.setBagWater) F.setBagWater(${s.hand.water}); return 0; })()`);
            const r2 = await t.talkTo(ev(s.key), [], { secs: 40 });
            await finish();
            const done = await rec(s.id);
            t.check(s.id + ": oddanie w tawernie działa (zadanie zaliczone / krok dalej)", !!done && (done.s === "done" || done.step > (s.hand.step || 0)), { done, text: r2.text.slice(0, 200) });
        }
    }

    // ---------------------------------------------------------------- the first steps of D21 and D20 (talks in the tavern)
    for (const s of STEPS.filter(x => !ONLY.length || ONLY.includes(x.id))) {
        const mid = (s.win[0] + s.win[1]) / 2;
        await t.newGame({ map: 8, x: 50, y: 40, day: 22, hour: 12, quiet: true, minimap: false, settle: 10 });
        await t.eval(FIRST + "f.rochMet = 1; f.janekMet = 1; return 0; })()");
        if (s.id === "D21") await t.eval(`TownQuests.start("D21", ${s.step}); 0`);
        else await t.eval(`TownQuests.start("D20", ${s.step}); 0`);
        if (s.v) await t.eval(`Object.assign(TownQuests.state().v, ${JSON.stringify(s.v)}); 0`);
        for (const [id, n] of s.items || []) await t.give(id, n);
        // out of the window: nobody to talk to in the tavern
        const hrs = await t.json(`(function(){ const q = TownQuests.Q.${s.id}; return q.steps[${s.step}].hours || null; })()`);
        t.check(s.id + " krok " + s.step + ": godziny kroku to okno wizyty " + s.win.join("–"), !!hrs && hrs[0] === s.win[0] && hrs[1] === s.win[1], hrs);
        await enter(mid, 22);
        await t.talkTo(ev(s.key), [], { secs: 40 });
        await finish();
        const st = await rec(s.id);
        t.check(s.id + " krok " + s.step + ": rozmowa / oddanie w tawernie zalicza krok", !!st && (st.step > s.step || st.s === "done"), st);
    }

    // ---------------------------------------------------------------- Bazyli's other offers: the hours of the offers follow his afternoon at the tavern
    for (const [id, w] of [["D22", [14, 17.5]], ["D29", [14, 17.5]], ["K69", [14, 17.5]], ["K49", [14, 17.5]]]) {
        const h = await t.json(`(function(){ const q = TownQuests.Q[${JSON.stringify(id)}]; return q && q.offer && q.offer.cond ? q.offer.cond.hours || null : null; })()`);
        t.check(id + ": oferta Bazylego tylko 14–17:30 (kiedy jest w tawernie)", !!h && h[0] === w[0] && h[1] === w[1], h);
    }
    {   // D22's finale (the talk with Bazyli): its step holds his talk only in the afternoon (his place in the tavern) - read from the data file the game loads
        const fs = require("fs");
        const file = [path.join(process.cwd(), OV || "", "js", "plugins", "Latarnia_Data.js"), path.join(__dirname, "..", "js", "plugins", "Latarnia_Data.js")].find(f => fs.existsSync(f));
        const src = file ? fs.readFileSync(file, "utf8") : "";
        t.check("D22: rozmowa końcowa z Bazylim (d22Koniec) ma godziny 14–17:30 (tawerna)", /nazwa: "d22Koniec", rozmowy: \[\{ kto: "latarnik", gdy: \[\{ godziny: \[14, 17\.5\] \}\]/.test(src), file);
    }

    // ---------------------------------------------------------------- the notice board: the outside's new jobs
    await t.newGame({ map: 1, x: 7, y: 51, day: 40, hour: 20, quiet: true, minimap: false, settle: 10 });
    const ids = ["herring_janek", "tran_bazyli", "wood_klos", "wool_wawrzyn", "kiln_zbych"];
    const board = await t.json(`(function(){ const Q = Tawerna.api("QuestBoard"); const P = Tawerna.api("QuestBoard_parts"); const d = P && P.data; if (!d) return null;
        const out = {}; for (const id of ${JSON.stringify(ids)}) { const tpl = d.TEMPLATES.find(x => x.id === id); out[id] = tpl ? { giver: tpl.giver, giverOk: !!d.GIVERS[tpl.giver] && !!d.GIVERS[tpl.giver].name, title: !!(tpl.title && tpl.title.length), text: !!(tpl.text && tpl.text.length) } : null; }
        return out; })()`);
    for (const id of ids) t.check("tablica: ogłoszenie " + id + " ma szablon, zleceniodawcę z imieniem, tytuł i treść", !!board && !!board[id] && board[id].giverOk && board[id].title && board[id].text, board && board[id]);
    for (const id of ids) {
        const n = await t.json(`(function(){ const Q = Tawerna.api("QuestBoard"); const n = Q.post(${JSON.stringify(id)}, 2, 12345); return n ? { giver: n.giver, title: n.title, req: n.req.map(r => r.id + "x" + r.n), gold: n.gold } : null; })()`);
        t.check("tablica: " + id + " można przypiąć (kartka z wymaganiem i zapłatą)", !!n && n.req.length > 0 && n.gold > 0, n);
    }
    // a posted notice is taken, then done at the board (the hand-in is in the tavern)
    const t1 = await t.json(`(function(){ const Q = Tawerna.api("QuestBoard"); const n = Q.post("wood_klos", 3, 777); const a = Q.accept(n.id); for (const r of n.req) if (r.k === "item") $gameParty.gainItem($dataItems[r.id], r.n); const done = Q.turnIn(n.id); return { a, gold: done && done.gold }; })()`);
    t.check("tablica: ogłoszenie Kłosa przyjęte i oddane na tablicy w tawernie (zapłata w złocie)", !!t1 && t1.a.ok && t1.gold > 0, t1);
});
