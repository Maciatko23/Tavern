//=============================================================================
// Dwor_Data.js
//=============================================================================
// The data of the arc W7 "Dwór z kamieni twierdzy" (docs/QUESTY.md W7) - VARIANT A (the user's choice 2026-10-17): the Lord knows
// nothing. Lord Leopold Zaleski is vain and naive and believes the "fairy tale" of the fortress stones; his butler Feliks has for
// years sold the faction (Straż Pewności, "the Black Eyes") the water of the Order's canal, news and the raven stones of the manor's
// own walls. Dwor.js is the engine. Registered in js/plugins.js under the other arcs' data (Kantor_Data), above TownLife and
// TownQuests:
//   - the thread "dwor" (Watki.js, 2026-10-28): the state "dwor", the quest W7 (eight steps, chapters 1-7 - into window.TownQuestsPacks
//     with its things: Feliks's letters, the copy; the remarks), the talks at the Lord's door, of Feliks's traces, the drawer, the
//     hatch and the trapdoor, their actions, the F9 jumps (Dwor.debugJump), the hero's thoughts; the hooks are Dwor.js's
//   - TownLifeData: Feliks's day (6-10:30 the market, 10:30-20 in the manor's hall behind the butler's lectern - "inside dwor" on the
//     town map = gone through the east gate; the hall's marker "Miejsce: feliks_hol"), the same for Teodor once Feliks is gone
//   - window.DworData: the maps (172-174, built by tools/w7/build_dwor.py), the event ids (570-599, owner "Dwor" - TawernaCore's
//     registry), the places, the clock, the words

/*:
 * @target MZ
 * @plugindesc [W7] Dane wątku „Dwór z kamieni twierdzy” (wariant A: Lord nic nie wie, Feliks sprzedaje frakcji): hol, biblioteka, gabinet (mapy 172-174). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Kantor_Data
 *
 * @help
 * ============================================================================
 * Dwor_Data.js - dane wątku W7 „Dwór z kamieni twierdzy”
 * ============================================================================
 * Same dane: czyta je Dwor.js (silnik). Wątek W7 na silniku Watki.js (stan,
 * kroki, rozmowy, akcje, skoki F9); zadanie W7 trafia do TownQuests przez
 * window.TownQuestsPacks, plan dnia Feliksa (i Teodora) do TownLife.
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

    // ------------------------------------------------------------------ the things carried, the remarks (they go with the quest's pack)
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

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md): the state,
    // the quest W7 (eight steps, chapters 1-7; its words: js/teksty/dwor.txt, zadania.W7 - the engine puts it into
    // window.TownQuestsPacks with the things and the remarks), the talks (the Lord's at his door, the traces of Feliks, the drawer, the
    // hatch and the trapdoor) and their actions, the F9 jumps. The hooks (fabula, polowaDlugu, lordMowi, prawda...) are Dwor.js's:
    // which talk the Lord gives and when stays code there; what he says, the choices and their actions are here
    const DOOR1 = { name: "Door1", volume: 80, pitch: 100, pan: 0 }, OPEN1 = { name: "Open1", volume: 70, pitch: 80, pan: 0 };
    const transfer = (map, p) => ({ polecenie: 201, parametry: [0, map, p[0], p[1], p[2], 0] });
    const LORD = { talk: "lordMowi", ready: "lordGotowy" };   // (the step's talk at the Lord's door: Dwor.js picks the talk by the step)
    const w = Watki.watek({
        id: "dwor", wtyczka: "Dwor", teksty: "dwor",
        stan: { klucz: "dwor", wersja: 1, domyslne: () => ({
            tour: 0, tourHall: 0, tourGone: 0, invited: 0, zaproNo: 0,     // ch. 2: 1 the Lord shows him round, 2 the chronicle read
            obs: {}, acc: { rano: 0, dzien: 0, noc: 0 }, spotted: {},       // ch. 3: what he saw of Feliks (day), the frames watched
            traces: {},                                                    // ch. 3 with Feliks gone: teodor, hanka, kuba, rejestr
            letters: "", lettersDay: 0, bolt: -1, caught: 0, garden: -1,   // ch. 4
            truth: 0, how: "", fate: "", told: 0, flee: 0,                 // the truth (day), how the Lord learnt it, Feliks's fate
            najpierw: "", najDay: 0, weekPaid: 0, lieOut: 0, search: 0, searched: 0, toll: -1, donosi: -1, hostileSaid: 0,   // ch. 6
            down: 0, saidW9: 0, guardW9: -1, serce: ""
        }) },
        // the hero's thoughts: a bubble 210 frames, the next after 220, not while an event runs
        mysli: { klatki: 210, odstep: 220, czekaj: true },
        // "@key: " - a resident nearby says the line (Dwor.speaker: the TownLife resident's event and name)
        mowa: { kto: key => { const D = window.Dwor; return D && D.speaker ? D.speaker(key) : null; } },
        zadania: {
            W7: { kind: "W", giver: null, icon: 0, autoStart: "w7Auto", start: ["fabula", "dlugZaczety"],
                kroki: [
                    // 1 "Dług": half of grandpa's debt paid (or half of the buyback)
                    { nazwa: "w7Dlug", ch: 1, gotowe: "polowaDlugu", zmienne: "w7Zmienne" },
                    // 2 "Zaproszenie": the Lord asks him in, the hall, the chronicle in the library
                    { nazwa: "w7Zapro", ch: 2, gotowe: "stan:tour>=2", zmienne: "w7Zmienne", haki: LORD },
                    // 3 "Dwa życia Feliksa": three of the four things seen of Feliks (or his traces - Teodor, Hanka, Kuba)
                    { nazwa: "w7Feliks", ch: 3, gotowe: "planGotowy", zmienne: "w7Zmienne", haki: { talk: "sladRozmowa", ready: "sladGotowy" } },
                    // 4 "Gabinet nocą": the drawer (Dwor.js moves on when the letters are taken / copied / left)
                    { nazwa: "w7Gabinet", ch: 4, zmienne: "w7Zmienne" },
                    // 4 the truth for the Lord (or the chapter 1 over)
                    { nazwa: "w7Prawda", ch: 4, gotowe: { lub: ["stan:truth", "rozdzialKoniec"] }, zmienne: "w7Zmienne", haki: LORD },
                    // 5 "Ostatnia spłata": the end of the story's chapter 1
                    { nazwa: "w7Splata", ch: 5, gotowe: "rozdzialKoniec", zmienne: "w7Zmienne", haki: LORD },
                    // 6 "Do kogo najpierw": the Lord's question after the hero was down
                    { nazwa: "w7Najpierw", ch: 6, gotowe: "stan:najpierw", zmienne: "w7Zmienne", haki: LORD },
                    // 7 "Lord przy Sercu": Underground.js's scene
                    { nazwa: "w7Serce", ch: 7, gotowe: "serceGotowe", zmienne: "w7Zmienne", haki: LORD }
                ],
                reward: { xp: 300 } }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        rozmowy: {
            // ---- the Lord at his door (ctx.spk: the Lord). Ch. 2: the invitation in (the words by the field and W1), the hall
            zaproszenie: [
                { jesli: "dzialkaPrzepadla", to: ["zaproAskBuy"], inaczej: [{ jesli: "flaga:lordAlly", to: ["zaproAskAlly"],
                    inaczej: [{ jesli: { lub: ["flaga:w1Revealed", "flaga:lordCold"] }, to: ["zaproAskCold"], inaczej: ["zaproAsk"] }] }] },
                { wybor: [
                    { etykieta: "zaproTak", tresc: [{ zrob: "tour" }, { polecenie: 250, parametry: [DOOR1] }, transfer(MAP.hol, PLACES.hol.land)] },
                    { etykieta: "zaproNie", tresc: ["zaproLater", { zrob: "zaproNo" }] }], anuluj: 1 }],
            lordCzeka: ["tourLordWaits"],
            // the truth: the letters (or the copy) shown (ctx.how, ctx.los: Feliks's fate now)
            prawdaListy: [{ mow: "prawdaAsk", kto: "bohater" }, { wybor: [
                { etykieta: "prawdaOpt", tresc: [{ rozmowa: "prawdaScena" }] },
                { etykieta: "prawdaLater", tresc: ["prawdaLaterSay"] }], anuluj: 1 }],
            // ...told without them (the letters left in the drawer): he checks himself, the truth the next day
            powiedz: [{ wybor: [
                { etykieta: "powiedzOpt", tresc: ["powiedzSay", { zrob: "powiedz" }] },
                { etykieta: "prawdaLater", tresc: [] }], anuluj: 1 }],
            powiedzCzekaj: ["powiedzWait"],
            // the Lord breaks (ctx.how: letters / copy / check; ctx.los: arrest / fled / jailed / sent / gone)
            prawdaScena: [
                { gdy: "ctx:how=copy", mow: "copyCheck" }, { gdy: "ctx:how=check", mow: "sprawdzil" }, "prawda",
                { gdy: "flaga:feliksPays", mow: "prawdaPays" }, "fate.{los}",
                { jesli: "splataTrwa", to: ["reward.debt"], inaczej: [{ jesli: "odkupTrwa", to: ["reward.buyback"], inaczej: ["reward.other"] }] },
                { gdy: "garnizon", mow: "prawdaGaraz" }, { gdy: "flaga:galazDworskaZamknieta", mow: "prawdaGalaz" }, "prawdaKoniec",
                { zrob: "prawda", args: [{ ctx: "how" }] }],
            // ch. 6: who first - the Lord, a lie, silence (no cancel: an answer is due)
            najpierw: [
                { jesli: { lub: ["flaga:lordAlly", "flaga:w7Prawda"] }, to: ["najpierwAsk.ally"],
                    inaczej: [{ jesli: { lub: ["flaga:w1Revealed", "flaga:lordCold"] }, to: ["najpierwAsk.cold"], inaczej: ["najpierwAsk.normal"] }] },
                { wybor: [
                    { etykieta: "optLord", tresc: ["sayLord", { zrob: "najpierw", args: ["lord"] }] },
                    { etykieta: "optLie", tresc: ["sayLie", { zrob: "najpierw", args: ["lie"] }] },
                    { etykieta: "optSilent", tresc: ["saySilent", { gdy: "feliksTutaj", mow: "saySilentFeliks" }, { zrob: "najpierw", args: ["silent"] }] }], anuluj: -1 }],
            // the hundred groszy a week (none while the cistern's manor branch is shut); the lie found out; W9's beaten men
            tydzien: ["tydzien", { zrob: "tydzien" }],
            tydzienNie: ["tydzienNie", { zrob: "weekNie" }],
            wrogi: ["lordHostile", { zrob: "hostileSaid" }],
            w9: ["w9Lord", { zrob: "w9Said" }],
            // ---- ch. 3 with Feliks gone: a trace of him (ctx.key: the resident - kamerdyner / piekarka / woziwoda, ctx.slad: the trace)
            slady: ["slady.{key}", { zrob: "slad", args: [{ ctx: "slad" }] }],
            // ---- ch. 4: Feliks's drawer in the study (the hero speaks; the letters shown while it is open)
            szuflada: [
                "szuflada.open", { jesli: "stan:obs.dzien", to: ["szuflada.key"], inaczej: ["szuflada.keyGuess"] }, "szuflada.bundle",
                { zrob: "drawerShow" }, "szuflada.letters",
                { jesli: "!feliksTutaj", to: ["szuflada.lastGone"], inaczej: [{ jesli: ["flaga:feliksPays", "!flaga:feliksBroke"], to: ["szuflada.lastPays"], inaczej: ["szuflada.lastHere"] }] },
                "szuflada.hand", { mow: "szuflada.ask", kto: "bohater" },
                { wybor: [
                    { etykieta: "szuflada.take", tresc: [{ zrob: "szuflada", args: ["take"] }] },
                    { etykieta: "szuflada.copy", tresc: [{ zrob: "szuflada", args: ["copy"] }] },
                    { etykieta: "szuflada.leave", tresc: [{ zrob: "szuflada", args: ["leave"] }] }], anuluj: 2 },
                { zrob: "drawerHide" }],
            // ---- the hatch behind the orangery (Map024) down the Order's canal to the study's trapdoor, and the trapdoor back
            wlaz: [{ mow: "wlazZejdz", kto: "bohater" }, { wybor: [
                { etykieta: "wlazTak", tresc: [{ polecenie: 250, parametry: [OPEN1] }, { mow: "kanalGora", kto: "bohater" }, { polecenie: 221 },
                    transfer(MAP.gab, PLACES.gab.trapLand), { polecenie: 222 }] },
                { etykieta: "wlazNie", tresc: [] }], anuluj: 1 }],
            klapa: [{ mow: "klapaZejdz", kto: "bohater" }, { wybor: [
                { etykieta: "klapaTak", tresc: [{ polecenie: 250, parametry: [OPEN1] }, { mow: "kanalDol", kto: "bohater" }, { polecenie: 221 },
                    transfer(MAP.manor, PLACES.manor.hatchLand), { polecenie: 222 }] },
                { etykieta: "klapaNie", tresc: [] }], anuluj: 1 }]
        },
        // the talks' actions (Watki.act); the old script calls Dwor.act(this, [...]) of a talk saved before 2026-10-28 come here too
        akcje: {
            tour: [{ gdy: "!stan:tour", stan: { tour: 1, tourHall: 0, tourGone: 0 } }],
            zaproNo: [{ stan: { zaproNo: "dzis" } }],
            powiedz: [{ gdy: "!stan:told", zrob: [{ stan: { told: "dzis" } }, { flaga: "w7LordWie" }] }],
            prawda: [{ hak: "prawda", args: [{ arg: 0 }] }],
            najpierw: [{ hak: "najpierw", args: [{ arg: 0 }] }],
            tydzien: [{ hak: "tydzien" }],
            weekNie: [{ stan: { weekPaid: "dzis" } }],
            hostileSaid: [{ stan: { hostileSaid: "dzis" } }],
            w9Said: [{ stan: { saidW9: "dzis" } }],
            slad: [{ hak: "slad", args: [{ arg: 0 }] }],
            szuflada: [{ hak: "szuflada", args: [{ arg: 0 }] }],
            drawerShow: [{ hak: "drawerShow" }],
            drawerHide: [{ hak: "drawerHide" }]
        },
        // F9 ("Wyspa i fabuła": the engine's section "Wątek W7", its row "isleW7" "W7: rozdział N" - Dwor.debugJump is the same jump):
        // straight to a chapter; skokPrzygotuj (Dwor.js) pays and sets what the chapters before it need. The words js/teksty/dwor.txt
        // (f9Naglowek, f9, f9desc, f9Brak, f9names.N)
        f9: { rodzaj: "isleW7", ikona: 189, kolejnosc: 7, naglowek: "f9Naglowek", etykieta: "f9", opis: "f9desc", brak: "f9Brak", nazwy: "f9names" },
        skoki: {
            wymaga: "fabula",
            przed: ["skokPrzygotuj"],
            lista: {
                1: { ch: 1, krok: "w7Dlug", godzina: 10, idz: [MAP.manor].concat(PLACES.manor.f9) },
                2: { ch: 2, krok: "w7Zapro", godzina: 10, idz: [MAP.manor].concat(PLACES.manor.f9) },
                3: { ch: 3, krok: "w7Feliks", godzina: 6.5, idz: [MAP.town].concat(PLACES.town.f9) },
                4: { ch: 4, krok: "w7Gabinet", godzina: 22.5, idz: [MAP.manor, 3, 22, 8] },
                5: { ch: 5, krok: "w7Prawda", godzina: 10, idz: [MAP.manor].concat(PLACES.manor.f9) },
                6: { ch: 6, krok: "w7Najpierw", godzina: 10, idz: [MAP.manor].concat(PLACES.manor.f9) },
                7: { ch: 7, krok: "w7Serce", godzina: 10, idz: [MAP.manor].concat(PLACES.manor.f9) }
            }
        }
    });
    const W7 = w.Q.W7;

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
        // the steps' names (Dwor.step(): which step is on): the chapters 1, 2, 3, 4, 4 (the truth), 5, 6, 7
        STEPS: W7.steps.map(s => s.nazwa)
    };
})();
