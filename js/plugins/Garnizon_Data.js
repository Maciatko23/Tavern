//=============================================================================
// Garnizon_Data.js
//=============================================================================
// PAKIET D (docs/miejsca_wyspy/PAKIETY.md) - the data of the Lord's guard (once "Garnizon nad zatoką", maps 162/163).
// 2026-11-16, the new world (docs/NOWY_SWIAT/SPIS_WATKI.md S14 "PRZEROBIĆ", the user: "Straż przy dworze"): there is no royal garrison
// - its people are the Lord's guard at the manor (Map221 "Dwór nad Jazem": the guardhouse by the gate - its inside the guard's hall
// Map180 -, the stable, the courtyard with the braziers, the fenced paddock as the drill ground, the reservoir's pier by the weir).
// Captain Florian Bełza was a rotmistrz of the king's banner; the Crown still wants the Lord's war tax, supplies and recruits (so the
// buying and the draft list stay) - and so the Lord presses grandpa's debt. No tents, no sandbar, no rescue boat: the old Map162's
// own events are not in the new world - the grain cart and the water barrels are injected here (GRANARY, BARRELS).
// Here only data; the engine is Garnizon.js (below every system of the game). The thread's and the engine's names stay "garnizon".
//   - the residents (TownLife, fixed ids 945-947) -> window.TownLifeExtra: rotmistrz Florian Bełza, kwatermistrz Pafnucy Kłos (the
//     nights after a ferry day 23-1 at the kantor's back door on Map008 - "alt"), werbownik Szczepan Bęben (the days after the waves
//     on the town's market - "alt"); their places on Map162/163 are the maps' "Miejsce:" events, two more on Map008 (garnizon_*)
//   - the thread "garnizon" (Watki.js, 2026-10-28): the state, K52 "Drewno dla garnizonu", D26 "Lista poborowa", D27 "Zboże dla
//     obozu" with their steps, talks and actions (into window.TownQuestsPacks with the sacks of grain - v:worek_zboza -, the pass and
//     the residents' remarks after them); the first meetings and the captain's rows with an action. The hooks: Garnizon.js
//   - window.GarnizonData: the military buying (prices, the wave and hunger multipliers), the favour's thresholds, the soldiers'
//     plans (events 640-669), the sandbar, the texts
// Event ids 640-669 (TawernaCore registry, owner "Garnizon"): 640-655 Map162 (the soldiers, the recruits), 656-659 Map008 (the
// recruiter's list on the market, the search), 660-663 Map111 (the search after D26 b).

/*:
 * @target MZ
 * @plugindesc [pakiet D] Dane: straż dworu Lorda (Posiadłość, mapa 221; izba straży 180) - kapitan Bełza, kwatermistrz, werbownik, strażnicy, skup, przychylność, zadania K52, D26, D27. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Wyspa_Data
 *
 * @help
 * ============================================================================
 * Garnizon_Data.js - dane straży dworu Lorda (dawniej garnizon nad zatoką)
 * ============================================================================
 * Tylko dane. Silnik: Garnizon.js. Zasady: docs/miejsca_wyspy/PAKIETY.md.
 * Mieszkańcy: rotmistrz 945, kwatermistrz 946, werbownik 947.
 * Zadania: K52 „Drewno dla garnizonu”, D26 „Lista poborowa”, D27 „Zboże dla
 * obozu”. Numery zdarzeń: 640-669. Test: tests/garnizon_test.js (port 9504).
 * Woda: żadnej. Beczki „z wodą z promu” są pod strażą (tylko dymek).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = 221, QUARTERS = 180, TOWN = 220, PODGRODZIE = 218;   // (2026-11-16 the new world: the manor, the guard's hall, Kruczogród, Podgrodzie)
    const WAVES = [10, 25, 37, 52];                 // the ferry's waves of people - a fallback: TownQuests.waves() is the one source (Garnizon.js)
    const RECRUIT_DAYS = WAVES.map(d => d + 1);      // the recruiter on the town's market the day after each wave

    // ------------------------------------------------------------------ the residents (TownLife, fixed ids)
    const RESIDENTS = [
        {
            // Florian Bełza, about 50, grey moustache, the phoenix on his tabard, a sabre, limps on the left leg; stern, just, tired of
            // the war; keeps the list of the missing. 6-7 drill, 7-12 the office (Map163), 12-13 the kitchen, 13-16 the round (the gate,
            // the shore, the pier, the tower), 16-20 the office, 20-22 by the fire, 22-6 asleep
            key: "rotmistrz", id: 945, sheet: "$Npc_Rotmistrz", map: MAP, speed: 2,
            away: ["spi"],
            plan: [[0, "inside", "spi"], [6, "stand", "musztra"], [7, "stand", "kapitan_straz_brama"], [12, "stand", "kuchnia"],
                   [13, "patrol", ["brama_wew", "brzeg", "pomost", "brzeg", "brama_wew", "wieza"]], [16, "inside", "kwatera_drzwi"],
                   [20, "stand", "ognisko"], [22, "inside", "spi"]],
            barks: {
            },
            talk: {
            }
        },
        {
            // Pafnucy Kłos, the quartermaster: fat, ruddy, a ledger and an abacus, an apron over the tabard; merry and bribable - part
            // of the royal grain goes at night to Baltazar. 7-18 the granary and his table (the buying), 18-22 by the fire, asleep in
            // his tent; the nights after a ferry day 23-1 at the kantor's back door in the town (W5's "three knocks") - there he is an
            // event of Garnizon.js on Map008 (659), not a TownLife alt: an alt switching at night while the hero is in the town would
            // leave TownLife's resident without an event there
            key: "kwatermistrz", id: 946, sheet: "$Npc_Kwatermistrz", map: MAP, speed: 2,
            away: ["namiot_kwat"], indoor: { tawerna: "gosc_kwatermistrz" },
            plan: [[0, "inside", "namiot_kwat"], [7, "work", "spichlerz"], [9, "stand", "skup"], [12, "stand", "kuchnia"], [13, "stand", "skup"],
                   [16, "work", "spichlerz"], [17, "inside", "tawerna"], [19.5, "stand", "ognisko_2"], [22, "inside", "namiot_kwat"]],
            barks: {
            },
            talk: {
            }
        },
        {
            // Szczepan Bęben, the recruiter, about 30: a hat with a feather, a drum at his belt, a loud voice ("Za króla, chłopcy!").
            // At his table before the gate 8-16; the day after each wave (11, 25, 39, 53) on the town's market 8:30-14:30
            key: "werbownik", id: 947, sheet: "$Npc_Werbownik", map: MAP, speed: 3,
            away: ["koszary_drzwi"],
            plan: [[0, "inside", "koszary_drzwi"], [7, "wander", "przed_brama"], [8, "stand", "stol_werbownika"], [12, "wander", "przed_brama"],
                   [13, "stand", "stol_werbownika"], [16, "wander", "musztra"], [19, "stand", "ognisko"], [22, "inside", "koszary_drzwi"]],
            alt: {
                map: TOWN, when: "garnizonRynek",
                plan: [[0, "inside", "brama_wsch"], [8.5, "stand", "garnizon_werbownik"], [14.5, "inside", "brama_wsch"]],
                barks: { },
                talk: { }
            },
            barks: {
            },
            talk: {
            }
        }
    ];
    Watki.scal(RESIDENTS, "garnizon", "mieszkancy");   // (its words: js/teksty/garnizon.txt, mieszkancy)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);

    // their places on the manor (Map221; the map's own "Miejsce:" events - kapitan_straz_brama, wartownia_drzwi... - win): the guardhouse's
    // door (49,30) is where they sleep, the braziers of the courtyard their evening fire, the paddock the drill ground, the stable's cart
    // Kłos's buying; on Map220 (TownLife's town spots) one more, prefixed - never one of the town's own keys
    const TL = window.TownLifeData;
    if (TL) {
        TL.SPOTS_BY_MAP = TL.SPOTS_BY_MAP || {};
        TL.SPOTS_BY_MAP[MAP] = Object.assign(TL.SPOTS_BY_MAP[MAP] || {}, {
            spi: [49, 30, 8], musztra: [72, 29, 8], kwatera_drzwi: [49, 30, 8], kuchnia: [58, 18, 8], brama_wew: [40, 28, 2], pomost: [65, 45, 2],
            wieza: [41, 24, 2], ognisko: [35, 26, 6], brzeg: [55, 44, 2], spichlerz: [64, 32, 8], skup: [61, 30, 2], namiot_kwat: [49, 30, 8],
            ognisko_2: [46, 26, 4], stol_werbownika: [43, 32, 2], koszary_drzwi: [49, 30, 8], przed_brama: [40, 33, 2]
        });
        TL.SPOTS_BY_MAP[QUARTERS] = Object.assign(TL.SPOTS_BY_MAP[QUARTERS] || {}, { rotmistrz_wnetrze: [8, 7, 2] });
        TL.SPOTS_BY_MAP[TOWN] = Object.assign(TL.SPOTS_BY_MAP[TOWN] || {}, { garnizon_werbownik: [60, 43, 2] });   // (the market of Map220)
    }

    // ------------------------------------------------------------------ the things carried and the remarks (they go with the quests'
    // pack - the thread below)
    const VITEMS = {
        worek_zboza: { icon: 74 },
        glejt_wrak: { icon: 0 }
    };
    Watki.scal(VITEMS, "garnizon", "rzeczy");   // (its words: js/teksty/garnizon.txt, rzeczy)
    const REMARKS = [
        { id: "garnizonKlosWydany", who: "kupiec", flag: "klosWydany" },
        { id: "garnizonD27Ludmila", who: "ludmila", flag: "d27Done" },
        { id: "garnizonD26Soltys", who: "soltys", flag: "d26Ostrzezeni" },
        { id: "garnizonD26Wzieci", who: "praczka", flag: "d26Wzieci" },
        { id: "garnizonD26Beben", who: "werbownik", flag: "d26Wzieci" },
        { id: "garnizonD26BebenPusto", who: "werbownik", flag: "d26Ostrzezeni" }
    ];
    Watki.scal(REMARKS, "garnizon", "uwagi");   // (its words: js/teksty/garnizon.txt, uwagi)

    // ------------------------------------------------------------------ the military buying (Kłos; after K52)
    // [item id, price a piece]; "food" - selling it in the hungry week costs the town's opinion
    const BUY = [
        { id: 74, price: 6, food: true }, { id: 71, price: 7, food: true }, { id: 72, price: 6, food: true }, { id: 73, price: 13, food: true },
        { id: 105, price: 24, food: true }, { id: 106, price: 21, food: true }, { id: 96, price: 9 }, { id: 97, price: 22 },
        { id: 127, price: 3 }, { id: 61, price: 3 }, { id: 79, price: 5 }   // (2026-10-24 audyt: wood 6 -> 3, charcoal 8 -> 5 - under the base price, as Borgar)
    ];
    // (2026-10-24 audyt, the user's decision) the day's book: Kłos takes at most this many of EACH good a day - the debt was to be
    // chopped out of the forest in a few evenings (a tree = 6-8 wood at 6 G, no cap). The wave's x1.5 stays: a premium for the time,
    // not for the heap
    const BUY_LIMIT = 10;
    const BUY_WAVE = 1.5, BUY_WAVE_DAYS = 7;          // half again dearer for a week after each wave
    const BUY_FRIEND = 1.2;                           // Kłos owes the hero (D27: he kept quiet)
    const HUNGER_DAYS = 7;                            // after the requisition (D14) the town is hungry for a week

    // ------------------------------------------------------------------ the favour of the garrison (0-100, start 20)
    const FAVOR = {
        start: 20, glejt: 40, smith: 60, defenders: 80, patrol: 10,
        // ansgar: 0 since the integration 2026-10-16 - W12's castaway handed over is worth +20 as the concept says, and Wrak.js gives it
        // itself (Garnizon.addFavor); the old +10 here came on top of it (+30)
        k52: 20, d26Help: 5, d26Warn: -10, d26Deal: 10, d27Accuse: 15, caught: -15, saleDay: 1, ansgar: 0, stonesSeen: -2
    };
    // the garrison's smith (a soldier at the anvil): from favour 60
    const SMITH = [{ id: 127, price: 3, n: 10 }, { id: 143, price: 55, n: 1 }];
    const GRAIN_PRICE = 15;                            // a sack "at the price for friends" (D27)
    // D26's list (Rafał, the deserter of W6, is mentioned by the recruiter but not on it: his own thread decides about him)
    const D26_LIST = ["bartek", "drwal", "uchodzca"];

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md, 2026-10-28)
    // the state "garnizon" (the favour and what happened; the quests' flags are TownQuests'), K52, D26, D27 (their words: zadania.*;
    // the engine puts them into window.TownQuestsPacks with the things and the remarks), the talks of the first meetings, of the
    // captain's rows with an action and of D26 / D27, their actions. The menus themselves (the rows by the hour, the buying, the
    // smith) and the hooks: Garnizon.js
    const GRAIN = 4 * GRAIN_PRICE;                                            // (the four sacks)
    const D26_WHO = D26_LIST.map(k => "d26.who." + k).join("+");             // (how many of the list are settled: "ile:" of these paths)
    const w = Watki.watek({
        id: "garnizon", wtyczka: "Garnizon", teksty: "garnizon",
        stan: { klucz: "garnizon", wersja: 1, domyslne: () => ({ favor: FAVOR.start, met: {}, th: {}, saleDay: 0, hungerDay: 0, sold: 0, k52: 0, glejt: 0,
            smith: 0, missing: 0, patrolDay: 0, stocks: 0, ansgar: 0, usualN: 0, d26: { who: {}, warned: 0, deal: 0 },
            d27: { bought: 0, stolen: 0, carry: 0, caught: 0, tried: 0 } }) },
        // ("\n" starts a new line; "@rotmistrz: ..." - that resident says it: Garnizon.js finds him)
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        zadania: {
            // K52: wood and charcoal for the field kitchen - then Kłos buys from the hero (Garnizon.js: the favour +20 on k52Skup)
            K52: { kind: "K", giver: "kwatermistrz", icon: 61, offer: { cond: { hours: [17, 19.5], day: 5, flags: ["garnizonPoznany"] } },
                kroki: [{ nazwa: "k52Drewno", type: "bring", to: "kwatermistrz", need: [[61, 10], [79, 4]], hours: [17, 19.5] }],
                reward: { gold: 20, xp: 50, flag: "k52Skup" },
                rewardFxNote: "przychylność garnizonu +20 (Garnizon.js: flag k52Skup)" },
            // D26: the day after a wave (the recruiter wherever he is); the three of the list helped or warned (the step's talk with each of
            // them), or the ship's log for the captain instead of recruits (his menu row: d26Uklad)
            D26: { kind: "D", giver: "werbownik", icon: 0,
                offer: { cond: { hours: [8, 16], fn: "d26Dzien" }, options: [{ then: "accept", flag: "d26Pomoc" }, { then: "accept" }, { then: "decline" }] },
                oferta: "dzienWerbunku",
                kroki: [{ nazwa: "d26Ludzie", ch: 1, gotowe: { lub: ["stan:d26.deal>0", "ile:" + D26_WHO + ">=3"] },
                    zmienne: { lista: { hak: "d26Lista" }, n: { ile: D26_WHO } }, haki: { talk: "d26Rozmowa", ready: "d26Znacznik", act: "d26Akcja" } }],
                reward: { xp: 60 }, lines: {} },
            // D27: after the requisition (D14) the camp is hungry; the sacks bought at night from Kłos or carried out of the granary past the
            // sentries (Garnizon.js); Kłos given up to the captain or kept quiet (their menu rows: d27Wydaj, d27Milcz)
            D27: { kind: "D", giver: "ludmila", icon: 74, offer: { cond: { hours: [7, 20], fn: "d27Gotowe" } },
                oferta: [{ hak: "odDnia", args: [28] }, "!aktywne:D14"],   // (2026-10-28: the requisition 3 days after the second wave - 25 + 3)
                kroki: [
                    { nazwa: "d27Worki", ch: 1, gotowe: ["czteryWorki", "!stan:d27.carry"], zmienne: { n: { hak: "workow" } } },
                    { nazwa: "d27Ludmila", type: "bring", to: "ludmila", need: [["v:worek_zboza", 4]], hours: [6, 22], ch: 2, reward: { opinion: 5 } },
                    { nazwa: "d27Klos", ch: 3, gotowe: { lub: ["flaga:klosWydany", "flaga:d27Milczy"] }, haki: { ready: "d27Znacznik", act: "d27Akcja" } }
                ],
                reward: { xp: 80, flag: "d27Done" }, lines: {} }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        rozmowy: {
            // the first meetings (the captain: "Ile masz lat? ...Jeszcze nie." - the hero is never conscripted)
            poznanieRotmistrz: ["belzaMeet", { zrob: "poznalRotmistrz" }],
            poznanieKlos: [{ jesli: "stan:met.rotmistrz", to: ["klosMeetKnown"], inaczej: ["klosMeet"] }, { zrob: "poznalKlos" }],
            poznanieBeben: ["bebenMeet", { zrob: "poznalBeben" }],
            // the captain's rows: how the garrison sees the hero, the pass to the wreck, the list of the missing (the father's banner)
            przychylnosc: [{ jesli: "stan:favor>=60", to: ["belzaFavor.best"], inaczej: [{ jesli: "stan:favor>=40", to: ["belzaFavor.good"],
                inaczej: [{ jesli: "stan:favor>=15", to: ["belzaFavor.mid"], inaczej: ["belzaFavor.low"] }] }] }, { zrob: "przychylnosc" }],
            glejt: ["glejtAsk", { jesli: "stan:favor>=" + FAVOR.glejt, to: [{ zrob: "glejt" }, "glejtYes"], inaczej: ["glejtNo"] }],
            lista: [{ jesli: "stan:missing", to: ["missingAgain"], inaczej: ["missingAsk", "missing", { zrob: "lista" }] }],
            // D26: one of the list (ctx.key): help him to the army or warn him; the captain: the ship's log instead of recruits
            d26: [{ mow: "zadania.D26.lines.ask", kto: "bohater" }, { wybor: [
                { etykieta: "zadania.D26.lines.help", tresc: [{ mow: "zadania.D26.lines.help", kto: "bohater" }, { zrob: "d26", args: [{ ctx: "key" }, "help"] },
                    { hak: "d26Odpowiedz", args: ["pomoc"] }] },
                { etykieta: "zadania.D26.lines.warn", tresc: [{ mow: "zadania.D26.lines.warn", kto: "bohater" }, { zrob: "d26", args: [{ ctx: "key" }, "warn"] },
                    { hak: "d26Odpowiedz", args: ["ostrzez"] }] },
                { etykieta: "d26.milcz", tresc: [] }
            ], anuluj: 2 }],
            d26Uklad: [{ zrob: "d26Uklad" }, "d26Deal"],
            // D27: the four sacks from Kłos (only at night, 20-2); Kłos given up to the captain, or the word to Kłos to keep quiet
            zboze: ["grainAsk", { jesli: { godziny: [20, 2] }, to: ["grain", { wybor: [
                { etykieta: "zboze.biore", tresc: [{ zrob: "zboze" }, "grainYes"] },
                { etykieta: "zboze.nieMam", tresc: ["grainNo"] }
            ], anuluj: 1, zmienne: { cena: GRAIN } }], inaczej: ["grainDay"] }],
            d27Wydaj: [{ zrob: "d27Wydaj" }, { jesli: "flaga:d27Kupione", to: ["zadania.D27.lines.accuse"], inaczej: ["zadania.D27.lines.accuseStolen"] }],
            d27Milcz: [{ hak: "linie", args: ["zadania.D27.lines.silent", 0, 1] }, { zrob: "d27Milcz" }, { hak: "linie", args: ["zadania.D27.lines.silent", 1] }]
        },
        // (Garnizon.act's old names - met, favorInfo, glejt, missing, grain; TownQuests.act's "fx" of d26Ludzie / d27Klos - a talk saved
        // before 2026-10-28: Garnizon.js sends them here)
        akcje: {
            poznalRotmistrz: [{ gdy: "stan:met.rotmistrz", koniec: true }, { stan: { "met.rotmistrz": "dzis" } }, { flaga: "garnizonPoznany" }, { sprawdz: true },
                { notatka: "notatki.garnizon" }],
            poznalKlos: [{ gdy: "stan:met.kwatermistrz", koniec: true }, { stan: { "met.kwatermistrz": "dzis" } }],
            poznalBeben: [{ gdy: "stan:met.werbownik", koniec: true }, { stan: { "met.werbownik": "dzis" } }],
            przychylnosc: [{ info: "przychylnosc.info", zmienne: { hak: "przychylnoscSlowa" } }],
            glejt: [{ gdy: ["!flaga:glejtWrak", "stan:favor>=" + FAVOR.glejt], zrob: [{ stan: { glejt: "dzis" } }, { flaga: "glejtWrak" }, { sprawdz: true },
                { v: ["glejt_wrak", 1] }, { napis: "glejt.napis", pod: "glejt.pod", gora: true, kolor: "#ffd866" }, { notatka: "notatki.glejt" }] }],
            lista: [{ gdy: "stan:missing", koniec: true }, { stan: { missing: "dzis" } }, { notatka: "notatki.lista" }],
            // D26: one of the list helped / warned (args: his key, "help" | "warn"); the ship's log: the step done with its +5 Opinion
            // (2026-10-28, the user: the step first - before, the quests' checks ended D26 at once and the +5 never came)
            d26: [{ hak: "d26Decyzja", args: [{ arg: 0 }, { arg: 1 }] }],
            d26Uklad: [{ gdy: ["krok:d26Ludzie", "!stan:d26.deal"], zrob: [{ stan: { "d26.deal": "dzis" } }, { flaga: "d26Dziennik" },
                { hak: "dodajPrzychylnosc", args: [FAVOR.d26Deal, "powody.dziennik"] }, { krok: "d26Ludzie", nagroda: { opinion: 5 } }, { sprawdz: true }] }],
            // D27: the sacks bought (no money: the talk stops there), Kłos given up (he sails in chains), kept quiet
            zboze: [{ gdy: "!krok:d27Worki", koniec: true },
                { gdy: { nie: { hak: "stac", args: [GRAIN] } }, zrob: [{ hak: "brakGrosza", args: [GRAIN] }, { koniec: true }] },
                { hak: "zaplac", args: [GRAIN] }, { hak: "dopelnijWorki" }, { stan: { "d27.bought": "dzis" } }, { flaga: "d27Kupione" }, { sprawdz: true },
                { napis: "zboze.napis", ikona: 74, rodzaj: "good" }],
            d27Wydaj: [{ gdy: "!krok:d27Klos", koniec: true }, { flaga: "klosWydany" }, { sprawdz: true },
                { hak: "dodajPrzychylnosc", args: [FAVOR.d27Accuse, "powody.klosWydany"] }, { hak: "klosOdchodzi" }, { notatka: "notatki.klosWydany" }, { hak: "sprawdzZadania" }],
            d27Milcz: [{ gdy: "!krok:d27Klos", koniec: true }, { flaga: "d27Milczy" }, { sprawdz: true }, { notatka: "notatki.klosMilczy" }, { hak: "sprawdzZadania" }]
        }
    });

    // ------------------------------------------------------------------ the guardsmen (events 640-655 on the manor, Map221)
    // plan: [hour, spot | [patrol spots], act] - act: "stand" (default), "work", "patrol", "inside" (hidden); the spots: SOLDIER_SPOTS
    // below (a "Miejsce:" event of the map with the same key wins). sheet: A / B (the same man in two colours). 642 guards the
    // reservoir's pier by the weir (the Lord's water), 643 the water barrels and the grain cart, 646 is the guard's smith by the stable
    const SOLDIER_SPOTS = {
        z_brama_l: [38, 30, 2], z_brama_p: [42, 30, 2], z_noc_brama: [42, 31, 2], z_wieza: [43, 23, 2],
        z_ognisko_1: [37, 26, 6], z_ognisko_2: [45, 26, 4], z_cwicz_1: [70, 26, 2], z_cwicz_2: [72, 26, 2], z_cwicz_3: [74, 26, 2],
        z_pomost: [64, 45, 2], z_noc_pomost: [63, 45, 2], z_beczki: [49, 24, 6], z_spichlerz: [62, 32, 6], z_kuznia: [58, 29, 2],
        z_koszary: [49, 30, 8], z_namiot: [49, 30, 8], kwatera_drzwi: [49, 30, 8]
    };
    const SOLDIERS = [
        { id: 640, sheet: "A", role: "brama", plan: [[0, "z_noc_brama"], [6, "z_brama_l"], [22, "z_noc_brama"]], sentry: [22, 6] },
        { id: 641, sheet: "B", role: "brama", plan: [[0, "inside", "z_koszary"], [6, "z_brama_p"], [14, "z_wieza"], [20, "z_ognisko_1"], [22, "inside", "z_koszary"]] },
        // (9-15 he rows the rescue boat to the wreck: he and the boat are away - Garnizon.js hides the boat then)
        { id: 642, sheet: "B", role: "pomost", plan: [[0, "z_noc_pomost"], [6, "z_cwicz_1"], [7, "z_pomost"], [19, "z_ognisko_2"], [22, "z_noc_pomost"]], sentry: [22, 6] },
        { id: 643, sheet: "A", role: "beczki", plan: [[0, "patrol", ["z_beczki", "z_spichlerz", "kwatera_drzwi", "z_brama_p", "kwatera_drzwi", "z_spichlerz"]], [6, "z_beczki"], [22, "patrol", ["z_beczki", "z_spichlerz", "kwatera_drzwi", "z_brama_p", "kwatera_drzwi", "z_spichlerz"]]], sentry: [22, 6] },
        { id: 644, sheet: "A", role: "cwiczy", plan: [[0, "inside", "z_namiot"], [6, "z_cwicz_2"], [12, "z_ognisko_1"], [13, "z_cwicz_2"], [17, "work", "z_spichlerz"], [19, "z_ognisko_1"], [21, "inside", "z_namiot"]] },
        { id: 645, sheet: "B", role: "cwiczy", plan: [[0, "inside", "z_namiot"], [6, "z_cwicz_3"], [12, "z_ognisko_2"], [13, "z_cwicz_3"], [17, "z_pomost"], [19, "z_ognisko_2"], [21, "inside", "z_namiot"]] },
        { id: 646, sheet: "A", role: "kowal", plan: [[0, "inside", "z_koszary"], [7, "work", "z_kuznia"], [12, "z_ognisko_1"], [13, "work", "z_kuznia"], [19, "z_ognisko_1"], [21, "inside", "z_koszary"]] },
        { id: 647, sheet: "B", role: "wieza", plan: [[0, "inside", "z_koszary"], [6, "z_wieza"], [14, "z_cwicz_1"], [18, "z_wieza"], [21, "inside", "z_koszary"]] }
    ];
    Watki.scal(SOLDIERS, "garnizon", "zolnierze");   // (its words: js/teksty/garnizon.txt, zolnierze)
    // the recruits of D26 (help): drilling in the garrison for RECRUIT_STAY days (their own sheets), events 648-651
    // (Rafał is not on the list: the deserter of W6 - recruiting him would cut across his own thread; the recruiter only mentions him)
    const RECRUITS = { bartek: { id: 648, spot: "z_cwicz_1" }, drwal: { id: 649, spot: "z_cwicz_2" }, uchodzca: { id: 650, spot: "z_cwicz_3" } };
    const RECRUIT_STAY = 12;
    // the patrol on the road (favour under 10), event 652 on the manor's road west of the courtyard
    const PATROL = { id: 652, x: 14, y: 41 };
    // the manor's own things the old map had (injected now): the grain of the requisition on the cart by the stable (D27: taken at
    // night past the sentries - the cart's cell, the tiles show the cart) and the Lord's water barrels in the courtyard (only a bubble:
    // the drought); the area the sentries guard (a thief with the sacks outside it is safe), where a caught thief wakes (the guard's
    // lockup is the guardhouse: he is let out at its door), and no pass to the wreck (it lies open on Słony Brzeg)
    const GRANARY = { id: 664, x: 63, y: 31 };
    const BARRELS = [{ id: 665, x: 50, y: 23 }, { id: 666, x: 51, y: 23 }];   // (one barrel a cell)
    const CARRY_ZONE = [25, 19, 66, 35];
    const STOCKS = [48, 31, 2];
    const GLEJT = false;
    // Map008: the recruiter's list on the market (656); the search after D26 b (657-658); Map111: the search (660-661)
    const TOWN_EVENTS = { list: { id: 656, x: 61, y: 44 }, search: [{ id: 657, x: 52, y: 39 }, { id: 658, x: 44, y: 39 }], klos: { id: 659, x: 51, y: 21, d: 6 } };   // (Map220: the market, the street north of it, the kantor's back door)
    const PODGRODZIE_EVENTS = [{ id: 660, x: 44, y: 43 }, { id: 661, x: 28, y: 43 }];   // (Map218: the main road)
    // the guard's hall (Map180): where the guardhouse's door of the manor lands, where its doorway leads back (the map's own events)
    const QUARTERS_LANDING = [6, 10], QUARTERS_EXIT = [49, 30];

    // ------------------------------------------------------------------ the sandbar of the old bay: none in the new world
    const BAR = null;

    window.GarnizonData = { MAP, QUARTERS, TOWN, PODGRODZIE, WAVES, RECRUIT_DAYS, RESIDENTS, QUESTS: [w.Q.K52, w.Q.D26, w.Q.D27], BUY, BUY_LIMIT, BUY_WAVE,
        BUY_WAVE_DAYS, BUY_FRIEND, HUNGER_DAYS, FAVOR, SMITH, GRAIN_PRICE, D26_LIST, SOLDIERS, RECRUITS, RECRUIT_STAY, PATROL, TOWN_EVENTS,
        PODGRODZIE_EVENTS, QUARTERS_LANDING, QUARTERS_EXIT, BAR, SOLDIER_SPOTS, GRANARY, BARRELS, CARRY_ZONE, STOCKS, GLEJT, IDS: [640, 669] };
})();
