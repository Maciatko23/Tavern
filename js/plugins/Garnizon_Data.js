//=============================================================================
// Garnizon_Data.js
//=============================================================================
// PAKIET D (docs/miejsca_wyspy/PAKIETY.md) - the data of: Garnizon nad zatoką (mapy 162, 163). The royal army of the mainland (the
// white banner with the phoenix), quartered on the island by the Lord's leave - he pays the Crown a war tax and so presses grandpa's
// debt. Here only data; the engine is Garnizon.js (below every system of the game).
//   - the residents (TownLife, fixed ids 945-947) -> window.TownLifeExtra: rotmistrz Florian Bełza, kwatermistrz Pafnucy Kłos (the
//     nights after a ferry day 23-1 at the kantor's back door on Map008 - "alt"), werbownik Szczepan Bęben (the days after the waves
//     on the town's market - "alt"); their places on Map162/163 are the maps' "Miejsce:" events, two more on Map008 (garnizon_*)
//   - the quests (TownQuests) -> window.TownQuestsPacks: K52 "Drewno dla garnizonu", D26 "Lista poborowa", D27 "Zboże dla obozu"
//     (their own steps: TownQuests.FX from Garnizon.js), the sacks of grain (v:worek_zboza), the residents' remarks after them
//   - window.GarnizonData: the military buying (prices, the wave and hunger multipliers), the favour's thresholds, the soldiers'
//     plans (events 640-669), the sandbar, the texts
// Event ids 640-669 (TawernaCore registry, owner "Garnizon"): 640-655 Map162 (the soldiers, the recruits), 656-659 Map008 (the
// recruiter's list on the market, the search), 660-663 Map111 (the search after D26 b).

/*:
 * @target MZ
 * @plugindesc [pakiet D] Dane: Garnizon nad zatoką (mapy 162, 163) - rotmistrz, kwatermistrz, werbownik, żołnierze, skup wojskowy, przychylność, zadania K52, D26, D27. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * ============================================================================
 * Garnizon_Data.js - dane garnizonu nad zatoką (pakiet D)
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

    const MAP = 162, QUARTERS = 163, TOWN = 8, PODGRODZIE = 111;
    const WAVES = [10, 24, 38, 52];                 // the ferry's waves of people (TownQuests' calendar, Przystan.js)
    const RECRUIT_DAYS = WAVES.map(d => d + 1);      // the recruiter on the town's market the day after each wave

    // ------------------------------------------------------------------ the residents (TownLife, fixed ids)
    const RESIDENTS = [
        {
            // Florian Bełza, about 50, grey moustache, the phoenix on his tabard, a sabre, limps on the left leg; stern, just, tired of
            // the war; keeps the list of the missing. 6-7 drill, 7-12 the office (Map163), 12-13 the kitchen, 13-16 the round (the gate,
            // the shore, the pier, the tower), 16-20 the office, 20-22 by the fire, 22-6 asleep
            key: "rotmistrz", id: 945, sheet: "$Npc_Rotmistrz", map: MAP, speed: 2,
            away: ["spi"],
            plan: [[0, "inside", "spi"], [6, "stand", "musztra"], [7, "inside", "kwatera_drzwi"], [12, "stand", "kuchnia"],
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
            away: ["namiot_kwat"],
            plan: [[0, "inside", "namiot_kwat"], [7, "work", "spichlerz"], [9, "stand", "skup"], [12, "stand", "kuchnia"], [13, "stand", "skup"],
                   [16, "work", "spichlerz"], [18, "stand", "ognisko_2"], [22, "inside", "namiot_kwat"]],
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
                plan: [[0, "inside", "brama_pld"], [8.5, "stand", "garnizon_werbownik"], [14.5, "inside", "brama_pld"]],
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

    // their places: on Map162/163 the maps' "Miejsce:" events (these are only the defaults); on Map008 (TownLife's town spots) two
    // more, prefixed - never one of the town's own keys
    const TL = window.TownLifeData;
    if (TL) {
        TL.SPOTS_BY_MAP = TL.SPOTS_BY_MAP || {};
        TL.SPOTS_BY_MAP[MAP] = Object.assign(TL.SPOTS_BY_MAP[MAP] || {}, {
            spi: [42, 18, 8], musztra: [30, 23, 2], kwatera_drzwi: [42, 18, 8], kuchnia: [38, 29, 6], brama_wew: [36, 12, 2], pomost: [14, 26, 4],
            wieza: [49, 17, 8], ognisko: [39, 31, 8], brzeg: [17, 22, 4], spichlerz: [46, 31, 8], skup: [33, 29, 2], namiot_kwat: [32, 32, 8],
            ognisko_2: [42, 31, 8], stol_werbownika: [30, 8, 2], koszary_drzwi: [29, 15, 8], przed_brama: [33, 10, 2]
        });
        TL.SPOTS_BY_MAP[QUARTERS] = Object.assign(TL.SPOTS_BY_MAP[QUARTERS] || {}, { rotmistrz_wnetrze: [6, 4, 2] });
        if (TL.SPOTS) {
            const add = { garnizon_werbownik: [24, 46, 2] };
            for (const [k, v] of Object.entries(add)) if (!TL.SPOTS[k]) TL.SPOTS[k] = v;
        }
    }

    // ------------------------------------------------------------------ the quests (TownQuests packs)
    const Q_K52 = {
        id: "K52", kind: "K", giver: "kwatermistrz", icon: 61, 
        offer: {
            cond: { hours: [8, 18], day: 5, flags: ["garnizonPoznany"] }
        },
        steps: [
            { type: "bring", to: "kwatermistrz", need: [[61, 10], [79, 4]], hours: [7, 22] }
        ],
        reward: { gold: 20, xp: 50, flag: "k52Skup" },
        rewardFxNote: "przychylność garnizonu +20 (Garnizon.js: flag k52Skup)"
    };
    Watki.scal(Q_K52, "garnizon", "zadania.K52");   // (its words: js/teksty/garnizon.txt, zadania.K52)
    const Q_D26 = {
        id: "D26", kind: "D", giver: "werbownik", icon: 0, 
        offer: {
            cond: { hours: [8, 16], fn: "d26Dzien" },
            options: [
                { then: "accept", flag: "d26Pomoc" },
                { then: "accept" },
                { then: "decline" }
            ]
        },
        steps: [
            { type: "custom", talk: "d26Ludzie", check: "d26Ludzie", vars: "d26Ludzie", ch: 1 }
        ],
        reward: { xp: 60 },
        lines: {
        }
    };
    Watki.scal(Q_D26, "garnizon", "zadania.D26");   // (its words: js/teksty/garnizon.txt, zadania.D26)
    const Q_D27 = {
        id: "D27", kind: "D", giver: "ludmila", icon: 74, 
        offer: {
            cond: { hours: [7, 20], fn: "d27Gotowe" }
        },
        steps: [
            { type: "custom", check: "d27Worki", vars: "d27Worki", ch: 1 },
            { type: "bring", to: "ludmila", need: [["v:worek_zboza", 4]], hours: [6, 22], ch: 2, 
              reward: { opinion: 5 } },
            { type: "custom", talk: "d27Klos", check: "d27Klos", ch: 3 }
        ],
        reward: { xp: 80, flag: "d27Done" },
        lines: {
        }
    };
    Watki.scal(Q_D27, "garnizon", "zadania.D27");   // (its words: js/teksty/garnizon.txt, zadania.D27)

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
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Garnizon", quests: [Q_K52, Q_D26, Q_D27], vitems: VITEMS, remarks: REMARKS });

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

    // ------------------------------------------------------------------ the soldiers (events 640-655 on Map162)
    // plan: [hour, spot | [patrol spots], act] - act: "stand" (default), "work", "patrol", "inside" (hidden); the spots are the
    // map's "Miejsce:" events (z_*). sheet: A / B (the same man in two colours)
    const SOLDIERS = [
        { id: 640, sheet: "A", role: "brama", plan: [[0, "z_noc_brama"], [6, "z_brama_l"], [22, "z_noc_brama"]], sentry: [22, 6] },
        { id: 641, sheet: "B", role: "brama", plan: [[0, "inside", "z_koszary"], [6, "z_brama_p"], [14, "z_wieza"], [20, "z_ognisko_1"], [22, "inside", "z_koszary"]] },
        // (9-15 he rows the rescue boat to the wreck: he and the boat are away - Garnizon.js hides the boat then)
        { id: 642, sheet: "B", role: "pomost", plan: [[0, "z_noc_pomost"], [6, "z_cwicz_1"], [7, "z_pomost"], [9, "inside", "z_lodz"], [15, "z_pomost"], [19, "z_ognisko_2"], [22, "z_noc_pomost"]], sentry: [22, 6] },
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
    // the patrol on the road (favour under 10), event 652 on Map162
    const PATROL = { id: 652, x: 22, y: 5 };
    // Map008: the recruiter's list on the market (656); the search after D26 b (657-658); Map111: the search (660-661)
    const TOWN_EVENTS = { list: { id: 656, x: 25, y: 47 }, search: [{ id: 657, x: 59, y: 89 }, { id: 658, x: 47, y: 89 }], klos: { id: 659, x: 13, y: 48, d: 6 } };
    const PODGRODZIE_EVENTS = [{ id: 660, x: 45, y: 21 }, { id: 661, x: 37, y: 14 }];
    // the captain's quarters (Map163): where the door of Map162 lands, where its doorway leads back
    const QUARTERS_LANDING = [6, 8], QUARTERS_EXIT = [42, 18];

    // ------------------------------------------------------------------ the sandbar (rows 20-21: sea tiles; at low tide sand)
    const BAR = { rows: [20, 21], x0: 0, x1: 11, picture: "Garnizon_Lacha", px: 0, py: 19, fadeFrom: 0.15, fadeTo: 0.3 };

    window.GarnizonData = { MAP, QUARTERS, TOWN, PODGRODZIE, WAVES, RECRUIT_DAYS, RESIDENTS, QUESTS: [Q_K52, Q_D26, Q_D27], BUY, BUY_LIMIT, BUY_WAVE,
        BUY_WAVE_DAYS, BUY_FRIEND, HUNGER_DAYS, FAVOR, SMITH, GRAIN_PRICE, SOLDIERS, RECRUITS, RECRUIT_STAY, PATROL, TOWN_EVENTS,
        PODGRODZIE_EVENTS, QUARTERS_LANDING, QUARTERS_EXIT, BAR, IDS: [640, 669] };
})();
