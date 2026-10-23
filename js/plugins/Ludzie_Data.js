//=============================================================================
// Ludzie_Data.js
//=============================================================================
// PACZKA C „Ludzie” (docs/rozszerzenia/PLAN.md, punkt 6) - the data of: Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz,
// patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. Only data and texts here; the engine is
// Ludzie.js (below every system of the game). What goes where, at load time (this file stands above TownLife and TownQuests_Data):
//   - window.TownLifeExtra: the residents pasterz 2910, handlarz 2911 (one man, four stops: his "alt" map is a getter by the day of
//     his cycle - Ludzie.js adds the other stops to TownLife.HOMES), patrol_latarnia_1/2 2912-2913 (Map159), patrol_garnizon_1/2
//     2914-2915 (Map162); their places: TownLifeData.SPOTS_BY_MAP (the maps have no "Miejsce:" events of ours - Map001 and the user's
//     maps stay as they are)
//   - TownLifeData.RESIDENTS drwal (Zbych Smolarz, 926): an "alt" on Map021 on the kiln's days (d % 6 = 2, 3 - from 5:00), plan / talk /
//     barks there; "szalas_drzwi" into his away list (the night in the shed is not a night in his hut on Map113)
//   - window.TownQuestsPacks: K63 „Węgiel dla kowala”, K64 „Zabłąkana owca”, K65 „Zgubiony juk”, K66 „Nocny patrol”, D34 „Jaskinia
//     pod zatoczką”, D35 „Szyb pod Orlą Granią” (their own steps: TownQuests.FX from Ludzie.js), the pack v:juk, the remarks
//   - SpeechBubbles.BUSTS: $Npc_Pasterz -> Pasterz_Bust, $Npc_Handlarz -> Handlarz_Bust (tools/busts/make_pasterz.py, make_handlarz.py)
//   - window.LudzieData: the places (registered by the engine: Okolice.registerSpots("C", SPOTS)), the discoveries, the event ids and
//     their cells, the trades, the texts
// Event ids 2500-2699 (TawernaCore registry, owner "Ludzie"): Map021 2500-2519, Map022 2520-2539, Map004 2540-2569, Map003 2570-2579,
// Map013 2590-2609, Map125 2610-2619, Map168 2650-2659. Map177 (own map, tools/rozszerzenia/C/build_map177.py) has its own events.
// Water: nothing here gives water but the pedlar's barrel - dear, one draught a day (the user: "handlarz może mieć drogą wodę, ale bez
// zalewu"); the sea water in the cave is salt (<Water:salt>).

/*:
 * @target MZ
 * @plugindesc [paczka C] Dane: Ludzie - Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz, patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Okolice_Data
 *
 * @help
 * ============================================================================
 * Ludzie_Data.js - dane paczki C „Ludzie”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md. Silnik: Ludzie.js.
 * Numery zdarzeń: 2500-2699. Mieszkańcy TownLife: 2910-2915 (pasterz,
 * handlarz, dwa patrole po dwóch żołnierzy). Przedmioty: 210-214.
 * Ikony: 496-500. Mapa 177 „Jaskinia przemytników”.
 * Zadania: K63 „Węgiel dla kowala”, K64 „Zabłąkana owca”, K65 „Zgubiony
 * juk”, K66 „Nocny patrol”, D34 „Jaskinia pod zatoczką”, D35 „Szyb pod Orlą
 * Granią”. Test: tests/ludzie_test.js (port 9553).
 * Musi stać nad TownLife i TownQuests_Data (wpisuje mieszkańców i zadania).
 * ============================================================================
 */

(() => {
    "use strict";

    const O = window.OkoliceData, P = O ? O.PACKAGES.C : null;
    const VERSION = "1.1.0";

    // ------------------------------------------------------------------ the maps and the event ids (2500-2699, ~20 a map)
    const MAP = { droga: 21, polna: 22, laka: 4, domek: 3, menhiry: 18, omszala: 17, gory: 13, przystan: 125, jaskinia: 177, zagroda: 168,
        przyladek: 159, garnizon: 162, miasto: 8, podgrodzie: 111 };
    const EV = {
        mielerz: 2500, dym: 2501, szalas: 2502, ogien021: 2503, tobol021: 2504, juk: 2505,
        woz022: 2520, osiol022: 2521, ogien022: 2522,
        koszar: 2540, plot: [2541, 2553], woz004: 2554, ogien004: 2555, krzak004: 2556,
        woz003: 2570, osiol003: 2571, ogien003: 2572,
        namiotA: 2590, namiotB: 2591, skrzyniaKop: 2592, ogienKop: 2593, szyb: 2594, krzak013: 2595, skrzynkiA: 2596, skrzynkiB: 2597,
        wylot: 2610,
        krzyz: [2650, 2651, 2652], lawka: 2653, marta: 2654
    };

    // ------------------------------------------------------------------ the places (Okolice.registerSpots("C", SPOTS) - the collision test)
    // the same as the plan's (OkoliceData.PLAN_SPOTS, pkg C), checked again 2026-10-21; "jagna_miejsce" is package A's (Jagna) - not here
    const SPOTS = [
        { key: "mielerz", map: 21, kind: "kiln", name: "Mielerz", mode: "reach", x: 48, y: 17, w: 3, h: 3 },
        { key: "szalas_wegl", map: 21, kind: "shed", name: "Szałas węglarza", mode: "reach", x: 52, y: 20, w: 3, h: 2 },
        { key: "postoj_021", map: 21, kind: "wagon", name: "Postój handlarza (Leśna droga)", mode: "reach", x: 54, y: 16, w: 2, h: 2 },
        { key: "juk_021", map: 21, kind: "pack", name: "Zgubiony juk", mode: "reach", cells: [[55, 12], [61, 11], [67, 8]] },
        { key: "postoj_handlarza", map: 22, kind: "wagon", name: "Postój handlarza", mode: "reach", x: 49, y: 19, w: 6, h: 4 },
        { key: "koszar", map: 4, kind: "fold", name: "Koszar", mode: "reach", x: 50, y: 40, w: 5, h: 4 },
        { key: "pastwisko", map: 4, kind: "pasture", name: "Pastwisko", mode: "zone", x: 43, y: 44, w: 7, h: 6 },
        { key: "postoj_004", map: 4, kind: "wagon", name: "Postój handlarza (Łąka)", mode: "reach", x: 59, y: 10, w: 4, h: 2 },
        { key: "postoj_003", map: 3, kind: "wagon", name: "Postój handlarza (Kruczy Jar)", mode: "reach", x: 59, y: 9, w: 4, h: 3 },
        { key: "pastwisko_018", map: 18, kind: "pasture", name: "Pastwisko przy menhirach", mode: "reach", x: 65, y: 29, w: 7, h: 5 },
        { key: "owca_017", map: 17, kind: "sheep", name: "Zabłąkana owca", mode: "reach", cells: [[40, 40], [60, 38], [72, 30]] },
        { key: "oboz_kopaczy", map: 13, kind: "camp", name: "Obóz kopaczy", mode: "reach", x: 97, y: 70, w: 8, h: 6 },
        { key: "szyb_czo", map: 13, kind: "shaft", name: "Szyb poszukiwawczy", mode: "wall", cells: [[105, 71]] },
        { key: "jaskinia_wejscie", map: 125, kind: "cave", name: "Wejście do jaskini", mode: "wall", cells: [[16, 64], [17, 64]] },
        { key: "grob_lugow", map: 168, kind: "grave", name: "Stare groby Ługów", mode: "reach", x: 88, y: 26, w: 3, h: 2 },
        { key: "patrol_159", map: 159, kind: "patrol", name: "Obchód patrolu", mode: "reach", cells: [[53, 45], [70, 40], [80, 53], [60, 61], [50, 70]] },
        { key: "patrol_162", map: 162, kind: "patrol", name: "Obchód patrolu", mode: "reach", cells: [[60, 45], [91, 45], [95, 65], [65, 70]] }
    ];

    // ------------------------------------------------------------------ the discoveries (Okolice.discoverable; 25 PD each)
    const DISCOVER = [
        { key: "lud_mielerz", map: 21, x: 49, y: 20, near: 2, name: "Mielerz Zbycha", icon: 334,
          text: "Kopiec polan obłożony darnią przy Leśnej drodze. Zbych Smolarz pali tu węgiel drzewny: co szósty dzień rozpala, dwa dni kopiec się tli i dymi, nocą żarzy się jak oko. W dni wypału Zbych śpi obok, w szałasie." },
        { key: "lud_koszar", map: 4, x: 52, y: 44, near: 2, name: "Koszar pasterza", icon: 367,
          text: "Wiklinowa zagroda na Łące. Wawrzyn Owczarz pasie tu sześć owiec, wieczorem zagania je za płot - wilki nocą nie przeskoczą plecionki. Co trzeci dzień pasie stado przy menhirach." },
        { key: "lud_postoj", map: 22, x: 51, y: 21, near: 2, name: "Postój wędrownego handlarza", icon: 496,
          text: "Wóz pod plandeką, osiołek i ognisko przy Polnej drodze. Szymon Juczny krąży czterema postojami: Polna droga, Leśna droga, Łąka, Kruczy Jar - dzień tu, dzień tam. Sprzedaje to, czego w miasteczku nie ma, i słyszy, co gdzie leży." },
        { key: "lud_oboz", map: 13, x: 100, y: 73, near: 3, name: "Obóz kopaczy Czarnych Oczu", icon: 499,
          text: "Dwa namioty pod skałą na wschodzie gór i szyb wykuty w kamieniu. Kopacze Czarnych Oczu drążą tu coś po cichu - za dnia pilnują, nocą śpią przy ognisku." },
        { key: "lud_jaskinia", map: 125, x: 16, y: 65, near: 1, name: "Jaskinia pod zatoczką", icon: 498,
          text: "Skalny otwór nad zatoczką przemytników, zalewany przez przypływ. Wejść można tylko w odpływie. Ktoś tu bywa nocą - na piasku ślady skrzyń." },
        { key: "lud_groby", map: 168, x: 89, y: 27, near: 1, name: "Stare groby Ługów", icon: 190,
          text: "Trzy omszałe krzyże i ławka na skraju spalonej zagrody. Tu leżą rodzice i dziadkowie Jana Ługa - starsi niż jego krzyż przy drodze." }
    ];

    // ------------------------------------------------------------------ the cycles
    const CYCLE = {
        kiln: { every: 6, work: [2, 3], dawn: 5 },               // Zbych at the kiln: days d % 6 = 2, 3 (a "day" from 5:00)
        stops: [22, 21, 4, 3], dawn: 6,                          // the pedlar: d % 4 -> the map (a "day" from 6:00)
        pasture018: { every: 3, at: 2, hours: [7.5, 17.5] },    // the shepherd with the flock by the menhirs
        flock: { size: 6, out: 7, home: 18.5 }                   // the sheep: out at 7, into the fold at 18:30
    };
    // the kiln's look: cold / burning / ready by the day of its cycle (and K63's own burn); see Ludzie.kilnState()
    const KILN = { burn: [2, 3], ready: [4], coal: 4, coalMax: 10, wood: 12, give: 8, days: 2 };

    // ------------------------------------------------------------------ the residents (TownLife, fixed ids 2910-2915)
    const P159 = ["lud_p159_1", "lud_p159_2", "lud_p159_3", "lud_p159_4", "lud_p159_5"];
    const P162 = ["lud_p162_1", "lud_p162_2", "lud_p162_3", "lud_p162_4"];
    const PATROL_BARKS = {
    };
    Watki.scal(PATROL_BARKS, "ludzie", "patrol.barks");   // (its words: js/teksty/ludzie.txt, patrol.barks)
    const PATROL_TALK = {
    };
    Watki.scal(PATROL_TALK, "ludzie", "patrol.talk");   // (its words: js/teksty/ludzie.txt, patrol.talk)
    const RESIDENTS = [
        {
            // Wawrzyn Owczarz, the shepherd (about 55, a sheepskin coat, a felt hat, a crook): by the fold at dawn, the flock on the
            // pasture by day, he drives them in at half past six, sleeps in the fold. Every third day (d % 3 = 2) by the menhirs (Map018)
            key: "pasterz", id: 2910, sheet: "$Npc_Pasterz", map: MAP.laka, speed: 3,
            away: ["koszar_brama"],
            plan: [[0, "inside", "koszar_brama"], [6, "stand", "koszar_brama"], [7, "wander", "pastwisko"], [12, "stand", "pastwisko_cien"],
                   [13, "wander", "pastwisko"], [18.5, "stand", "pastwisko_brzeg"], [19.5, "stand", "koszar_brama"], [21, "inside", "koszar_brama"]],
            alt: {
                map: MAP.menhiry, when: "ludPasterz018",
                plan: [[0, "wander", "pastwisko_018"], [12, "stand", "pastwisko_018_kamien"], [13, "wander", "pastwisko_018"]],
                barks: { },
                talk: { }
            },
            barks: {
            },
            talk: {
            }
        },
        {
            // Szymon Juczny, the travelling pedlar (about 40, a travel cloak, a wide hat, packs on his back): four stops in turn - Polna
            // droga (the main one: the wagon, the donkey), Leśna droga, Łąka, the field of grandpa (d % 4); trades 8-18, by the fire in the
            // evening, asleep under the wagon's tarp at night. His "alt" map is the day's stop (a getter: Ludzie.js's ludHandlarzW)
            key: "handlarz", id: 2911, sheet: "$Npc_Handlarz", map: MAP.polna, speed: 3,
            away: ["handlarz_woz"],
            plan: [[0, "inside", "handlarz_woz"], [6.5, "stand", "handlarz_lada"], [8, "work", "handlarz_lada"], [18, "wander", "handlarz_lada"],
                   [19.5, "stand", "handlarz_sen"], [22, "inside", "handlarz_woz"]],
            alt: { get map() { const L = window.Ludzie; try { return L && L.stopMap ? L.stopMap() : MAP.polna; } catch (e) { return MAP.polna; } }, when: "ludHandlarzW" },
            barks: {
            },
            talk: {
            }
        },
        {
            key: "patrol_latarnia_1", id: 2912, sheet: "$Npc_Zolnierz", map: MAP.przyladek, speed: 3,
            away: ["lud_p159_noc"],
            plan: [[0, "inside", "lud_p159_noc"], [7, "patrol", P159], [19, "inside", "lud_p159_noc"], [21, "patrol", P159, "ludNocnyPatrol"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        },
        {
            key: "patrol_latarnia_2", id: 2913, sheet: "$Npc_Zolnierz_B", map: MAP.przyladek, speed: 3,
            away: ["lud_p159_noc"],
            plan: [[0, "inside", "lud_p159_noc"], [7, "patrol", P159], [19, "inside", "lud_p159_noc"], [21, "patrol", P159, "ludNocnyPatrol"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        },
        {
            key: "patrol_garnizon_1", id: 2914, sheet: "$Npc_Zolnierz", map: MAP.garnizon, speed: 3,
            away: ["koszary_drzwi"],
            plan: [[0, "inside", "koszary_drzwi"], [7, "patrol", P162], [19, "inside", "koszary_drzwi"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        },
        {
            key: "patrol_garnizon_2", id: 2915, sheet: "$Npc_Zolnierz_B", map: MAP.garnizon, speed: 3,
            away: ["koszary_drzwi"],
            plan: [[0, "inside", "koszary_drzwi"], [7, "patrol", P162], [19, "inside", "koszary_drzwi"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        }
    ];
    Watki.scal(RESIDENTS, "ludzie", "mieszkancy");   // (its words: js/teksty/ludzie.txt, mieszkancy)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);
    // the pairs: the second walks one cell behind the first (Ludzie.js: TownLife.hold while they patrol)
    const PAIRS = [["patrol_latarnia_1", "patrol_latarnia_2"], ["patrol_garnizon_1", "patrol_garnizon_2"]];

    // ------------------------------------------------------------------ Zbych Smolarz (TownLife's drwal, 926): the kiln's days on Map021
    const ZBYCH_ALT = {
        map: MAP.droga, when: "ludMielerz",
        plan: [[0, "inside", "szalas_drzwi"], [5.5, "work", "mielerz_praca"], [12, "stand", "szalas_przed"], [13, "work", "mielerz_praca"],
               [17, "wander", "mielerz_obchod"], [20.5, "inside", "szalas_drzwi"]],
        barks: {
        },
        talk: {
        }
    };
    Watki.scal(ZBYCH_ALT, "ludzie", "zbychAlt");   // (its words: js/teksty/ludzie.txt, zbychAlt)
    const TLD = window.TownLifeData;
    if (TLD && Array.isArray(TLD.RESIDENTS)) {
        const zb = TLD.RESIDENTS.find(r => r.key === "drwal");
        if (zb && !zb.alt) {
            zb.alt = ZBYCH_ALT;
            zb.away = (zb.away || []).concat(["szalas_drzwi"]);
        }
    }
    // the places of our residents on their maps (no "Miejsce:" events of ours on the user's maps; a user's event of the same name wins)
    const SPOTS_BY_MAP = {
        21: { mielerz_praca: [51, 19, 4], mielerz_obchod: [50, 21, 8], szalas_przed: [53, 22, 2], szalas_drzwi: [53, 22, 8],
              handlarz_lada: [54, 17, 2], handlarz_sen: [54, 16, 6], handlarz_woz: [54, 16, 6] },
        22: { handlarz_lada: [53, 21, 2], handlarz_sen: [54, 22, 4], handlarz_woz: [52, 21, 8] },
        4: { koszar_brama: [52, 44, 8], pastwisko: [46, 46, 2], pastwisko_cien: [44, 44, 2], pastwisko_brzeg: [50, 45, 4],
             handlarz_lada: [62, 11, 2], handlarz_sen: [62, 11, 8], handlarz_woz: [62, 11, 8] },
        3: { handlarz_lada: [61, 11, 2], handlarz_sen: [61, 11, 6], handlarz_woz: [61, 11, 8] },
        18: { pastwisko_018: [68, 31, 2], pastwisko_018_kamien: [66, 30, 6] },
        159: { lud_p159_1: [53, 45, 2], lud_p159_2: [70, 40, 6], lud_p159_3: [80, 53, 2], lud_p159_4: [60, 61, 4], lud_p159_5: [50, 70, 8], lud_p159_noc: [30, 77, 2] },
        162: { lud_p162_1: [60, 45, 6], lud_p162_2: [91, 45, 2], lud_p162_3: [95, 65, 4], lud_p162_4: [65, 70, 8] }
    };
    if (TLD) {
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        for (const [m, spots] of Object.entries(SPOTS_BY_MAP)) {
            const have = TLD.SPOTS_BY_MAP[m] = TLD.SPOTS_BY_MAP[m] || {};
            for (const [k, v] of Object.entries(spots)) if (!have[k]) have[k] = v;
        }
    }

    // ------------------------------------------------------------------ the busts (tools/busts/make_pasterz.py, make_handlarz.py)
    const SB = window.SpeechBubbles;
    if (SB && SB.BUSTS) {
        SB.BUSTS["$Npc_Pasterz:0"] = "Pasterz_Bust";
        SB.BUSTS["$Npc_Handlarz:0"] = "Handlarz_Bust";
    }

    // ------------------------------------------------------------------ the trades
    const ITEMS = { przyprawy: 210, mapa: 211, skrzynia: 212, dziennik: 213, koc: 214, sol: 200 };
    // the pedlar sells five of these a day (a hash of the day picks them; the map of the area always, till bought once)
    const PEDLAR_SELLS = [
        { id: 210, price: 8, n: 1 }, { id: 200, price: 12, n: 1 }, { id: 93, price: 6, n: 1 }, { id: 88, price: 2, n: 5 }, { id: 127, price: 1, n: 10 },
        { id: 67, price: 3, n: 2 }, { id: 68, price: 3, n: 2 }, { id: 69, price: 3, n: 2 }, { id: 70, price: 3, n: 2 }
    ];
    const PEDLAR_MAP = { id: 211, price: 60 };
    // what he buys (a piece): 20% over the town's half price; an item not in the database yet (another package's) is left out
    const PEDLAR_BUYS = [
        { id: 96, price: 5 }, { id: 97, price: 12 }, { id: 111, price: 6 }, { id: 76, price: 9 }, { id: 185, price: 6 },
        { id: 190, price: 14 }, { id: 191, price: 12 }, { id: 192, price: 12 }, { id: 201, price: 30 }, { id: 203, price: 25 }, { id: 230, price: 15 }
    ];
    // his barrel: one draught a day, dear (dearer in the heat and the drought)
    const PEDLAR_WATER = { price: 12, hot: 20, drought: 30, sip: 35 };
    const PEDLAR_DISCOUNT = 0.9;          // K65: the pack brought back - 10% off for good
    const SHEPHERD_SELLS = [{ id: 111, price: 5, n: 1 }, { id: 124, price: 6, n: 1 }, { id: 123, price: 2, n: 1 }, { id: 214, price: 25, n: 1 }];
    const SHEPHERD_BUYS = [{ id: 200, price: 15 }];
    const SHEPHERD_DISCOUNT = 0.8;        // K64: the sheep brought back - 20% off
    const SHEARING = { season: 0, from: 10, to: 20, tool: 142, wool: 3, gold: 10, hours: 1 };   // spring, days 10-20 of the season
    const BLANKET = { item: 214, bonus: 0.5 };   // resting on the ground with the blanket: +50% (20 -> 30 an hour)
    const SMITH = { steel: 143, price: 50, perDay: 1 };   // K63: the smith sells steel 10% under the garrison's 55 G

    // ------------------------------------------------------------------ the quests (TownQuests packs; their own steps: Ludzie.js FX)
    const K63 = {
        id: "K63", kind: "K", giver: "kowal", icon: 79, 
        offer: {
            cond: { hours: [7, 18], day: 4 }
        },
        steps: [
            { type: "bring", to: "drwal", need: [[61, 12]], hours: [6, 20], fx: "ludK63Drewno" },
            { type: "custom", check: "ludK63Noc", tick: "ludK63Noc", vars: "ludK63Vars" },
            { type: "custom", talk: "ludK63Wegiel", vars: "ludK63Vars" },
            { type: "bring", to: "kowal", need: [[79, 10]], hours: [6, 21] }
        ],
        reward: { gold: 40, opinion: 3, xp: 100, flag: "ludKowalRabat" },
        fail: { opinion: -2 }
    };
    Watki.scal(K63, "ludzie", "zadania.K63");   // (its words: js/teksty/ludzie.txt, zadania.K63)
    const K64 = {
        id: "K64", kind: "K", giver: "pasterz", icon: 111, 
        offer: {
            cond: { hours: [7, 19], fn: "ludPoBurzy" }
        },
        steps: [
            { type: "custom", check: "ludOwcaIdzie", vars: "ludOwcaVars" },
            { type: "custom", check: "ludOwcaDoma", vars: "ludOwcaVars" },
            { type: "talk", to: "pasterz", hours: [6, 22] }
        ],
        reward: { gold: 30, xp: 80, items: [[124, 3]], flag: "ludOwcaRabat" }
    };
    Watki.scal(K64, "ludzie", "zadania.K64");   // (its words: js/teksty/ludzie.txt, zadania.K64)
    const K65 = {
        id: "K65", kind: "K", giver: "handlarz", icon: 210, 
        offer: {
            cond: { hours: [8, 18], day: 3 }
        },
        steps: [
            { type: "custom", check: "ludJuk", vars: "ludJukVars", deadline: { day: 2, hour: 5 } },
            { type: "bring", to: "handlarz", need: [["v:juk", 1]], hours: [6, 21], vars: "ludJukVars" }
        ],
        reward: { gold: 25, xp: 60, flag: "ludJukRabat" }
    };
    Watki.scal(K65, "ludzie", "zadania.K65");   // (its words: js/teksty/ludzie.txt, zadania.K65)
    const K66 = {
        id: "K66", kind: "K", giver: "rotmistrz", icon: 127, 
        offer: {
            cond: { hours: [8, 20], day: 6, flags: ["garnizonPoznany"] }
        },
        steps: [
            { type: "custom", check: "ludPatrolNoc", tick: "ludPatrolNoc", vars: "ludPatrolVars", deadline: { day: 1, hour: 0.5 } },
            { type: "talk", to: "rotmistrz", hours: [6, 22] }
        ],
        reward: { gold: 30, xp: 100, flag: "ludPatrolDone" },
        fail: { opinion: 0 }
    };
    Watki.scal(K66, "ludzie", "zadania.K66");   // (its words: js/teksty/ludzie.txt, zadania.K66)
    const D34 = {
        id: "D34", kind: "D", giver: "celnik", icon: 212, autoStart: "ludD34Start",
        offer: {
            cond: { hours: [8, 18], fn: "ludJaskiniaOtwarta" }
        },
        steps: [
            { type: "custom", check: "ludSkrzynia" },
            { type: "custom", talk: "ludKomuSkrzynia", vars: "ludD34Vars" }
        ],
        reward: { xp: 150 }
    };
    Watki.scal(D34, "ludzie", "zadania.D34");   // (its words: js/teksty/ludzie.txt, zadania.D34)
    const D35 = {
        id: "D35", kind: "D", giver: null, autoStart: "ludD35Start", icon: 213,
        steps: [
            { type: "custom", check: "ludDziennik" },
            { type: "custom", talk: "ludSzybKomu", check: "ludSzybKoniec", vars: "ludD35Vars" }
        ],
        reward: { xp: 150 }
    };
    Watki.scal(D35, "ludzie", "zadania.D35");   // (its words: js/teksty/ludzie.txt, zadania.D35)
    const VITEMS = { juk: { icon: 496 } };
    Watki.scal(VITEMS, "ludzie", "rzeczy");   // (its words: js/teksty/ludzie.txt, rzeczy)
    const REMARKS = [
        { id: "ludRochSkrzynie", who: "przemytnik", flag: "ludObieSkrzynie" },
        { id: "ludMartaGroby", who: "praczka", flag: "ludGroby" },
        { id: "ludKowalWegiel", who: "drwal", flag: "ludKowalRabat" },
        { id: "ludRotmistrzSzyb", who: "rotmistrz", flag: "ludSzybRotmistrz" }
    ];
    Watki.scal(REMARKS, "ludzie", "uwagi");   // (its words: js/teksty/ludzie.txt, uwagi)
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Ludzie", quests: [K63, K64, K65, K66, D34, D35], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ the camps and places of the quests
    const JUK_SPOTS = [[55, 12], [61, 11], [67, 8]];
    const SHEEP_SPOTS = [[40, 40], [60, 38], [72, 30]];
    const SHEEP_WHERE = [];
    Watki.scal(SHEEP_WHERE, "ludzie", "owcaGdzie");   // (its words: js/teksty/ludzie.txt, owcaGdzie)
    const PASTURE = { 4: { x: 43, y: 44, w: 7, h: 6 }, 18: { x: 65, y: 29, w: 7, h: 5 } };
    const FOLD = { cells: [[51, 41], [52, 41], [53, 41], [51, 42], [52, 42], [53, 42]], gate: [52, 43], fence: [[50, 40], [51, 40], [52, 40], [53, 40], [54, 40],
        [50, 41], [54, 41], [50, 42], [54, 42], [50, 43], [51, 43], [53, 43], [54, 43]] };
    const KILN_AT = { x: 49, y: 19 }, SHED_AT = { x: 53, y: 21 };
    const STOPS = {
        22: { woz: [51, 20], osiol: [49, 20], ogien: [53, 22] },
        21: { ogien: [55, 16], tobol: [55, 17] },
        4: { woz: [60, 11], ogien: [62, 10] },
        3: { woz: [60, 10], osiol: [62, 9], ogien: [62, 11] }
    };
    const CAMP = { tentA: [99, 72], tentB: [103, 72], chest: [101, 73], fire: [100, 75], shaft: [105, 71], shaftFront: [105, 72], bush: [98, 70],
        crates: [[97, 74], [102, 74]], seats: [[99, 75], [101, 75], [100, 74]], worker: [105, 73], sleeper: [98, 74], near: 10 };
    const CAMP_MEN = [
        { kind: "mercenary", look: "Merc" }, { kind: "bandit", look: "Merc" }, { kind: "bandit", look: "Merc" }, { kind: "knifer", look: "Merc" }
    ];
    const CAVE = { mouth: [16, 64], front: [16, 65], back: [16, 65], landing: [3, 11], exit: [3, 12], niche: [13, 2], table: [9, 5], seat: [10, 6],
        slawek: { kind: "bandit", look: "Bandit", hours: [22, 4] } };
    const GRAVES = { crosses: [[88, 26], [89, 26], [90, 26]], bench: [88, 27], marta: [90, 27], blows: 4 };
    const PATROL_AMBUSH = { map: 159, at: [70, 40], r: 4, kinds: ["bandit", "bandit", "knifer"], hours: [21, 24] };
    const KILN_AMBUSH = { map: 21, r: 14, kinds: ["bandit", "bandit"], hours: [22, 2], wait: 600 };
    const SHAFT = { rope: 93, saw: 118, blows: 6 };

    // ------------------------------------------------------------------ the texts
    const TX = { menu: {}, kiln: {}, camp: {}, cave: {}, crateLabel: {}, graves: {}, martaLines: [[], []] };
    Watki.scal(TX, "ludzie", "");   // (its words: js/teksty/ludzie.txt)

    // the items of the package (installed by tools/rozszerzenia/instaluj.py from tools/rozszerzenia/C/przedmioty.json)
    const ITEM_NAMES = {};
    Watki.scal(ITEM_NAMES, "ludzie", "nazwyRzeczy");   // (its words: js/teksty/ludzie.txt, nazwyRzeczy)

    // (2026-10-22, integration) the lines of the epilogue after the Heart (Underground.js asks Ludzie.epilogue): one or two by what the hero did
    const EPILOG = {
        cave: {
        }
    };
    Watki.scal(EPILOG, "ludzie", "epilog");   // (its words: js/teksty/ludzie.txt, epilog)
    window.LudzieData = { EPILOG, VERSION, PKG: "C", OWNER: "Ludzie", IDS: P ? P.ids : [2500, 2699], RESIDENT_IDS: P ? P.residents : [2910, 2929],
        ITEM_IDS: P ? P.items : [210, 224], ICONS: P ? P.icons : [496, 511], SWITCHES: P ? P.switches : [25, 26], MAP, EV, SPOTS, DISCOVER, CYCLE, KILN,
        RESIDENTS, PAIRS, ZBYCH_ALT, SPOTS_BY_MAP, ITEMS, ITEM_NAMES, PEDLAR_SELLS, PEDLAR_MAP, PEDLAR_BUYS, PEDLAR_WATER, PEDLAR_DISCOUNT,
        SHEPHERD_SELLS, SHEPHERD_BUYS, SHEPHERD_DISCOUNT, SHEARING, BLANKET, SMITH, QUESTS: { K63, K64, K65, K66, D34, D35 }, VITEMS, REMARKS,
        JUK_SPOTS, SHEEP_SPOTS, SHEEP_WHERE, PASTURE, FOLD, KILN_AT, SHED_AT, STOPS, CAMP, CAMP_MEN, CAVE, GRAVES, PATROL_AMBUSH, KILN_AMBUSH, SHAFT,
        TX, P159, P162, ready: true };
})();
