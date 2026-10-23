//=============================================================================
// Dwor_Data.js
//=============================================================================
// The data of the arc W7 "Dwór z kamieni twierdzy" (docs/QUESTY.md W7) - VARIANT A (the user's choice 2026-10-17): the Lord knows
// nothing. Lord Leopold Zaleski is vain and naive and believes the "fairy tale" of the fortress stones; his butler Feliks has for
// years sold the faction (Straż Pewności, "the Black Eyes") the water of the Order's canal, news and the raven stones of the manor's
// own walls. Dwor.js is the engine. Registered in js/plugins.js under the other arcs' data (Kantor_Data), above TownLife and
// TownQuests:
//   - window.TownQuestsPacks: the quest W7 (eight steps, chapters 1-7), its things (Feliks's letters, the copy), the remarks
//   - TownLifeData: Feliks's day (6-10:30 the market, 10:30-20 in the manor's hall behind the butler's lectern - "inside dwor" on the
//     town map = gone through the east gate; the hall's marker "Miejsce: feliks_hol"), the same for Teodor once Feliks is gone
//   - window.DworData: the maps (172-174, built by tools/w7/build_dwor.py), the event ids (570-599, owner "Dwor" - TawernaCore's
//     registry), the places, the clock, the words

/*:
 * @target MZ
 * @plugindesc [W7] Dane wątku „Dwór z kamieni twierdzy” (wariant A: Lord nic nie wie, Feliks sprzedaje frakcji): hol, biblioteka, gabinet (mapy 172-174). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Kantor_Data
 *
 * @help
 * ============================================================================
 * Dwor_Data.js - dane wątku W7 „Dwór z kamieni twierdzy”
 * ============================================================================
 * Same dane: czyta je Dwor.js (silnik). Zadanie W7 trafia do TownQuests
 * przez window.TownQuestsPacks, plan dnia Feliksa (i Teodora) do TownLife.
 * Musi stać nad TownLife.js i TownQuests_Data.js (pod Kantor_Data).
 * Numery zdarzeń 570-599 (właściciel "Dwor"), nowe mapy 172 „Dwór - Hol”,
 * 173 „Dwór - Biblioteka”, 174 „Dwór - Gabinet” (pod Posiadłością Lorda).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = { town: 8, manor: 24, hol: 172, bib: 173, gab: 174, ruins: 10, field: 3, hut: 100, house: 19, heart: 11 };
    const IDS = [570, 599];
    // the injected events: the Lord in the hall and the library while he shows the hero round (chapter 2), Feliks coming up the
    // trapdoor of the study (caught, chapter 4), the bundle of letters on Feliks's desk once the drawer is open, Feliks and Kuba at
    // the hatch behind the orangery at night (chapter 3: the water - W1)
    const EV = { lordHol: 570, lordBib: 571, feliksGab: 572, listy: 573, feliksNoc: 575, kubaNoc: 576 };
    const ART = {
        lord: ["$Npc_Lord", 0, 2, 1], feliks: ["$Npc_Feliks", 0, 2, 1], kuba: ["$Npc_Woziwoda", 0, 2, 1], teodor: ["$Npc_Kamerdyner", 0, 2, 1],
        listy: ["!W7_Dwor", 0, 8, 0]
    };

    // ------------------------------------------------------------------ the places (the maps of tools/w7/build_dwor.py; Map024 is the user's)
    const PLACES = {
        hol: { land: [11, 13, 8], fromBib: [3, 4, 2], fromGab: [19, 4, 2], lord: [12, 12, 4], lordKruki: [16, 5, 8], bibDoor: [3, 4], gabDoor: [19, 3] },
        bib: { land: [8, 10, 8], lord: [7, 7, 6], kronika: [8, 7] },
        gab: { land: [7, 9, 8], trapLand: [11, 8, 4], trap: [12, 8], feliks: [12, 9, 8], listy: [2, 4], exitTo: [19, 4, 2] },
        manor: { door: [20, 12], doorLand: [20, 13, 2], hatch: [3, 20], hatchLand: [3, 21, 2], feliksNoc: [2, 20, 6], kubaNoc: [3, 19, 2],
            garden: { x1: 21, y0: 17 }, out: [8, 102, 51, 4], f9: [20, 14, 8] },
        town: { gate: [100, 51], f9: [50, 46, 8] }
    };

    // ------------------------------------------------------------------ the clock
    const TIME = {
        lord: [8, 20],                 // the Lord at his door (Story.js)
        market: [6, 10.5],             // Feliks shopping (TownLife)
        hall: [10.5, 20],              // Feliks behind his lectern in the hall
        hatch: [1.5, 3],               // Feliks at the hatch with Kuba (W1's water)
        night: [22, 5],                // the hatch can be used, the study is dark
        down: [1.4, 1.6],              // Feliks comes into the study to go down the trapdoor
        up: [2.95, 3.15],              // ...and comes back up it
        copy: 0.5,                     // copying the letters takes half an hour
        kantor: [23.5, 24.6]           // Feliks at the kantor's back door on the nights of day%7 == 3 (Kantor.js)
    };
    const OBS = { rano: 300, dzien: 240, noc: 300, near: 7, close: 2.5, hall: 6, hatch: 8, need: 3 };
    const PAY = { truthDebt: 250, truthBuyback: 1000, truthElse: 100, week: 100, toll: 5 };
    const GEAR = [[59, 3], [93, 2], [152, 2], [127, 10]];      // the manor's armoury: torches, ropes, bandages, arrows
    const KAZIMIERZ = "Kazimierz";

    // ------------------------------------------------------------------ the words (js/teksty/dwor.txt; Dwor.js reads them as D.TX)
    const TX = {};
    Watki.scal(TX, "dwor", "");   // (its words: js/teksty/dwor.txt)

    // ------------------------------------------------------------------ the quest W7 (TownQuests)
    const W7 = {
        id: "W7", kind: "W", giver: null, icon: 0,
        autoStart: "w7Auto",
        steps: [
            { ch: 1, type: "custom", check: "w7Dlug", vars: "w7Vars" },
            { ch: 2, type: "custom", talk: "w7Zapro", check: "w7Kronika", vars: "w7Vars" },
            { ch: 3, type: "custom", talk: "w7Slady", check: "w7Feliks", vars: "w7Vars" },
            { ch: 4, type: "custom", vars: "w7Vars" },
            { ch: 4, type: "custom", talk: "w7Prawda", check: "w7PoPrawdzie", vars: "w7Vars" },
            { ch: 5, type: "custom", talk: "w7Prawda", check: "w7Splata", vars: "w7Vars" },
            { ch: 6, type: "custom", talk: "w7Najpierw", check: "w7Wybor", vars: "w7Vars" },
            { ch: 7, type: "custom", talk: "w7Tydzien", check: "w7Serce", vars: "w7Vars" }
        ],
        reward: { xp: 300 }
    };
    Watki.scal(W7, "dwor", "zadania.W7");   // (its words: js/teksty/dwor.txt, zadania.W7)
    const VITEMS = {
        listy_feliksa: { icon: 191 },
        odpis_listow: { icon: 189 }
    };
    Watki.scal(VITEMS, "dwor", "rzeczy");   // (its words: js/teksty/dwor.txt, rzeczy)
    const REMARKS = [
        { id: "w7Hanka", who: "piekarka", flag: "w7FeliksZatrzymany" },
        { id: "w7Soltys", who: "soltys", flag: "w7FeliksZatrzymany" },
        { id: "w7Kuba", who: "woziwoda", flag: "w7Prawda" },
        { id: "w7Ucieczka", who: "kapral", flag: "w7FeliksUciekl" },
        { id: "w7Teodor", who: "kamerdyner", flag: "w7Prawda" },
        { id: "w7Straz", who: "straznik", flag: "w7FeliksZatrzymany" },
        { id: "w7StrazW9", who: "straznik", flag: "w9DworPobity" },
        { id: "w7StrazKlamstwo", who: "straznik", flag: "w7KlamstwoWyszlo" }
    ];
    Watki.scal(REMARKS, "dwor", "uwagi");   // (its words: js/teksty/dwor.txt, uwagi)
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Dwor", quests: [W7], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ TownLife: Feliks's day (and Teodor's once Feliks is gone)
    // 6-10:30 the market (as before from 7: K30, K31, K37 and the tests keep their hours), 10:30-20 the manor's hall ("inside dwor" =
    // through the east gate; indoors on the hall's marker feliks_hol / kamerdyner_hol), the night at the manor (no interior shows it)
    const TLD = window.TownLifeData;
    // (their words in the hall; the lists stay these very lists - TownLife holds them)
    const HOME_BARKS = { feliks: [], kamerdyner: [] };
    Watki.scal(HOME_BARKS, "dwor", "wHolu");   // (its words: js/teksty/dwor.txt, wHolu)
    if (TLD) {
        if (TLD.SPOTS && !TLD.SPOTS.dwor) TLD.SPOTS.dwor = (TLD.SPOTS.brama_wsch || [100, 51, 4]).slice();
        for (const key of ["feliks", "kamerdyner"]) {
            const r = (TLD.RESIDENTS || []).find(x => x.key === key);
            if (!r || r._w7) continue;
            r._w7 = true;
            const out = [];
            for (const p of r.plan) {
                if (p[0] === 7 && p[1] === "wander") out.push([6, p[1], p[2]].concat(p.slice(3)));
                else if (p[0] === 10.5 && p[1] === "inside") out.push([10.5, "inside", "dwor"]);
                else out.push(p);
            }
            if (!out.some(p => p[0] === 20)) out.push([20, "inside", "brama_wsch"]);
            out.sort((a, b) => a[0] - b[0]);
            r.plan = out;
            r.indoor = Object.assign({}, r.indoor || {}, { dwor: key + "_hol" });
            r.barks = Object.assign({}, r.barks, { home: HOME_BARKS[key] });
        }
    }

    // (2026-10-17) the manor's guard spoke of Feliks as if he were still there, Teodor of a sluice already opened: with Feliks gone (W1 a/b
    // or W7's truth) the guard's lines leave him out; Teodor speaks of the sluice only once W1 has opened it (TownLife reads these at the
    // moment of the talk / call - getters)
    const gone = () => { try { return !!(window.TownLife && TownLife.gone && TownLife.gone("feliks")); } catch (e) { return false; } };
    const qflag = k => { try { const Q = window.TownQuests, s = Q && Q.state ? Q.state() : null; return !!(s && s.flags && s.flags[k]); } catch (e) { return false; } };
    const NO_FELIKS = {};
    Watki.scal(NO_FELIKS, "dwor", "bezFeliksa");   // (its words: js/teksty/dwor.txt, bezFeliksa)
    const swap = (obj, key, alt) => {
        if (!obj || !Array.isArray(obj[key])) return;
        const orig = obj[key];
        Object.defineProperty(obj, key, { configurable: true, enumerable: true, get() { const a = alt(); return a || orig; } });
    };
    if (TLD) {
        const g = (TLD.RESIDENTS || []).find(x => x.key === "straznik"), t = (TLD.RESIDENTS || []).find(x => x.key === "kamerdyner");
        if (g && !g._w7words) {
            g._w7words = true;
            const N = NO_FELIKS;
            swap(g.talk, "morning", () => (gone() ? [N.strazRano, qflag("sluiceHalf") ? N.strazRanoWiadra : N.strazRanoWoda] : null));
            swap(g.talk, "night", () => (gone() ? N.strazNoc.slice() : null));
            swap(g.barks, "night", () => (gone() ? N.strazBarkNoc.slice() : null));
        }
        if (t && !t._w7words) {
            t._w7words = true;
            swap(t.talk, "day", () => (qflag("sluiceHalf") ? null : NO_FELIKS.teodorDzien.slice()));
        }
    }

    window.DworData = {
        MAP, IDS, OWNER: "Dwor", EV, ART, PLACES, TIME, OBS, PAY, GEAR, KAZIMIERZ, TX, W7, VITEMS, REMARKS,
        // the steps' names (Dwor.js: which step is on): the chapters 1, 2, 3, 4, 4 (the truth), 5, 6, 7
        STEPS: ["w7Dlug", "w7Zapro", "w7Feliks", "w7Gabinet", "w7Prawda", "w7Splata", "w7Najpierw", "w7Serce"]
    };
})();
