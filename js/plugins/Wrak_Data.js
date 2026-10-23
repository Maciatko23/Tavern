//=============================================================================
// Wrak_Data.js
//=============================================================================
// PAKIET E (docs/miejsca_wyspy/PAKIETY.md, koncepcja docs/miejsca_wyspy/KONCEPCJA.md punkt 7) - the data of: Wrak na mieliźnie
// (maps 165 "Wrak na mieliźnie", 166 "Wrak - pod pokładem") and the castaway in the tavern.
// Registered in js/plugins.js under Wyspa_Data, above TownLife and TownQuests (package 0), so what it puts into the shared tables
// is there before their engines read them:
//   - window.TownLifeExtra: the castaway "Eryk Sowa" (really Ansgar Wiel, the cartographer of "Biała Źrenica"), fixed id 948, key
//     "rozbitek"; he lives by the town's plan (Map008) - breakfast, drawing and evenings in the tavern (Map001 untouched: his seat is
//     TownLifeData.SPOTS_BY_MAP[1].gosc_9), the market, the walls, the well at night, sleeps in the guest rooms (Map025 untouched:
//     SPOTS_BY_MAP[25].rozbitek_wnetrze)
//   - window.TownQuestsPacks: D25 "Mapa z wraku" (Roch gives it from day 15, or it starts by itself on the wreck), W12 "Rozbitek"
//     (starts with the first clue: five clues, two are enough; the talk "in private" with four ways out), the things of both
//     (vitems), the residents' remarks after what happened
//   - window.WrakData: the package's own tables for Wrak.js (the tides on the two maps, the boat, the soldiers, the seven marks of
//     the chart, the texts)

/*:
 * @target MZ
 * @plugindesc [pakiet E] Dane: Wrak na mieliźnie (mapy 165, 166), rozbitek Eryk Sowa (948), zadania D25 „Mapa z wraku” i W12 „Rozbitek”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * ============================================================================
 * Wrak_Data.js - dane pakietu E: wrak na mieliźnie i rozbitek w tawernie
 * ============================================================================
 * Mieszkaniec: rozbitek „Eryk Sowa” (numer 948) - rano i wieczorem w tawernie
 * (wolny stołek przy stole, miejsce gosc_9 z danych), w południe na rynku,
 * pod wieczór na murach, nocą przy studni, śpi w Pokojach gości.
 * Zadania: D25 „Mapa z wraku” (od dnia 15, od Rocha; albo samo na wraku),
 * W12 „Rozbitek” (poszlaki: dwie z pięciu, potem rozmowa w cztery oczy).
 * Silnik: Wrak.js. Zasady pakietów: docs/miejsca_wyspy/PAKIETY.md.
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = 165, UNDER = 166;

    // ------------------------------------------------------------------ the tides on the package's maps: region -> the level (0 low
    // water .. 1 high) from which its cells are under water; "low" = everything but the low water (Wyspa.tide().low, switch 20)
    const FLOOD = {
        165: { 61: "low", 62: 0.45, 63: 0.75 },
        166: { 64: 0.45, 65: 0.2 }
    };

    // ------------------------------------------------------------------ the castaway
    const RES = { key: "rozbitek", id: 948 };
    const SPOTS_TOWN = {   // Map008 (the town's spots; new keys only)
        rozbitek_noc: [51, 17, 8],        // (the tavern's gate: he goes in to sleep upstairs)
        rozbitek_rynek: [56, 51, 2],      // the market, the far side from the money changer's
        rozbitek_mury: [30, 19, 4],        // under the west wall, looking towards the sea
        rozbitek_studnia: [52, 50, 4]     // the market well at night (the sleeve rolled up - W12's clue)
    };
    const SPOT_TAVERN = [61, 33, 4];      // Map001: the free stool at the right-hand table (gosc_9 - Map001 unchanged)
    const SPOT_ROOMS = [6, 38, 4];        // Map025: room 7, by the narrow bed (Map025 unchanged)

    const resident = {
        key: RES.key, id: RES.id, sheet: "$Npc_Rozbitek", speed: 3,
        plan: [[0, "inside", "rozbitek_noc"], [8, "inside", "tawerna"], [10, "wander", "rozbitek_rynek"], [13, "inside", "tawerna"],
               [17, "stand", "rozbitek_mury"], [19, "inside", "tawerna"], [22, "work", "rozbitek_studnia"], [23, "inside", "rozbitek_noc"]],
        barks: {
        },
        talk: {
        }
    };
    Watki.scal(resident, "wrak", "mieszkaniec");   // (its words: js/teksty/wrak.txt, mieszkaniec)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(resident);
    const TLD = window.TownLifeData;
    if (TLD) {
        if (TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_TOWN)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        // (gosc_9: the tavern's next guest seat - Wrak.js checks the number once TownLife has counted its guests)
        TLD.SPOTS_BY_MAP[1] = Object.assign({}, { gosc_9: SPOT_TAVERN }, TLD.SPOTS_BY_MAP[1] || {});
        TLD.SPOTS_BY_MAP[25] = Object.assign({}, TLD.SPOTS_BY_MAP[25] || {}, { rozbitek_wnetrze: SPOT_ROOMS });
    }

    // ------------------------------------------------------------------ the quests (TownQuests)
    const ICON = { map: 190, log: 189, key: 196, coins: 208, stone: 319, paper: 191 };
    const D25 = {
        id: "D25", kind: "D", giver: "przemytnik", icon: ICON.map,
        offer: {
            cond: { day: 15, hours: [6, 21], flags: ["rochMet"], noFlags: ["d20Wydany"], fn: "d25Ready" }
        },
        autoStart: "d25Auto",
        steps: [
            { type: "custom", check: "d25Wrak" },
            { type: "custom", check: "d25Klucz" },
            { type: "custom", check: "d25Kajuta" },
            { type: "custom", talk: "d25Kamienie" }
        ],
        reward: { xp: 100 }
    };
    Watki.scal(D25, "wrak", "zadania.D25");   // (its words: js/teksty/wrak.txt, zadania.D25)
    const W12 = {
        id: "W12", kind: "W", giver: RES.key, icon: ICON.paper,
        autoStart: "w12Auto",
        steps: [
            { ch: 1, type: "custom", check: "w12Poszlaki", vars: "w12Vars" },
            { ch: 2, type: "custom", talk: "w12Talk" },
            { ch: 3, type: "custom", talk: "w12Map" }
        ]
    };
    Watki.scal(W12, "wrak", "zadania.W12");   // (its words: js/teksty/wrak.txt, zadania.W12)

    const VITEMS = {
        dziennik_okretu: { icon: ICON.log },
        klucz_bosmana: { icon: ICON.key },
        kamien_kruk: { icon: ICON.stone },
        monety_oko: { icon: ICON.coins },
        falszywa_mapa: { icon: ICON.paper },
        mapa_ansgara: { icon: ICON.map },
        portret: { icon: ICON.paper }
    };
    Watki.scal(VITEMS, "wrak", "rzeczy");   // (its words: js/teksty/wrak.txt, rzeczy)
    const REMARKS = [
        { id: "wrakJanek", who: "janek", flag: "wrakByl" },
        { id: "wrakRoch", who: "przemytnik", flag: "dziennikOkretu" },
        { id: "ansgarMelia", who: "melia", flag: "ansgarGiven" },
        { id: "ansgarCelnik", who: "celnik", flag: "ansgarGiven" },
        { id: "ansgarFledRoch", who: "przemytnik", flag: "ansgarFled" },
        { id: "ansgarAllyMelia", who: "melia", flag: "ansgarAlly" }
    ];
    Watki.scal(REMARKS, "wrak", "uwagi");   // (its words: js/teksty/wrak.txt, uwagi)
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Wrak", quests: [D25, W12], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ the seven marks of the chart from the captain's cabin
    // (item 178): the white eyes. `ready`: a place of another package - only once Wyspa.isReady(map)
    const MARKS = [
        { key: "tawerna", map: 8, x: 51, y: 18 },
        { key: "kamieniolom", map: 13, x: 40, y: 18 },
        { key: "latarnia", map: 159, ready: 159 },
        { key: "pustelnia", map: 155, ready: 155 },
        { key: "urwisko", map: 157, ready: 157 },
        { key: "kopiec", map: 20, x: 8, y: 7 },
        { key: "dwor", map: 24, x: 20, y: 13 }
    ];
    Watki.scal(MARKS, "wrak", "znaki");   // (its words: js/teksty/wrak.txt, znaki)

    // ------------------------------------------------------------------ W12's clues
    const CLUES = {
        dziennik: { },
        jozek: { },
        wizja: { },
        tatuaz: { },
        list: { }
    };
    Watki.scal(CLUES, "wrak", "poszlaki");   // (its words: js/teksty/wrak.txt, poszlaki)

    window.WrakData = {
        MAP, UNDER, IDS: [670, 679], OWNER: "Wrak", FLOOD, RES, SPOTS_TOWN, SPOT_TAVERN, SPOT_ROOMS, MARKS, CLUES, ICON, ITEM_MAP: 178,
        // Janek's boat: from the harbour by day (no storm), after his "Pierwszy połów" (K47); he waits two hours by the wreck
        BOAT: { from: 15, hours: [8, 17], wait: 2, harbour: [12, 7, 6], landing: [35, 18, 2], boat: [35, 17], janek: [36, 18, 4], needQuest: "K47" },
        // the garrison's soldiers with their rescue boat (9-15, not in a storm): without the pass (flag glejtWrak) the fine
        SOLDIERS: { hours: [9, 15], see: 4.5, seeSneak: 2.2, fine: 20, favor: -10, sheet: "$Npc_Straznik", sheetKing: "$Npc_Zolnierz",
            boat: [23, 26], men: [[21, 18, 8], [25, 18, 4]] },
        BREACH: [17, 15], UNDER_LANDING: [4, 11, 8], EDGE_LAND: [[78, 20], [78, 21]],   /* (2026-10-18: the wreck's map doubled to 80x60) */
        RAT: { at: [14, 6], max: 3, level: 1 },
        STONES: { celnik: 5, kupiec: 15, n: 5 },
        W12_GOLD: { given: 80, sold: 100 }, W12_XP: { given: 150, ally: 200, fled: 250, double: 200 },
        RAID: { after: [5, 9], chance: 0.35 }
    };
})();
