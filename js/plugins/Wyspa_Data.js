//=============================================================================
// Wyspa_Data.js
//=============================================================================
// The shared contract of the six island places (the user approved docs/miejsca_wyspy/KONCEPCJA.md on 2026-10-16; the building plan,
// one package per place: docs/miejsca_wyspy/PAKIETY.md). Only data: the maps, the event ids, the residents' ids, the quests'
// numbers, the flags passed between the packages, the switches, the items, the ways in from the user's maps, the tides.
// Kept by the coordinator: the packages READ it (window.WyspaData), they never change it - a change of the contract goes through
// the coordinator. Wyspa.js (below TownQuests) does what is shared: the ways in, the tides, "the place is built".

/*:
 * @target MZ
 * @plugindesc Wyspa - wspólne dane sześciu nowych miejsc (mapy 155-167, numery zdarzeń 600-699, mieszkańcy 943-948, zadania, flagi, przejścia, pływy). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TownLife_Data
 *
 * @help
 * ============================================================================
 * Wyspa_Data.js - kontrakt sześciu nowych miejsc Kruczej Wyspy
 * ============================================================================
 * Tylko dane (window.WyspaData). Plan budowy: docs/miejsca_wyspy/PAKIETY.md.
 * Pustelnia (A), Urwisko i kruk (B), Latarnia (C), Garnizon (D), Wrak (E),
 * Cysterna (F). Pakiety czytają te dane, nie zmieniają ich.
 * Musi stać pod TownLife_Data, a nad danymi pakietów i nad TownLife.
 * ============================================================================
 */

(() => {
    "use strict";

    // ------------------------------------------------------------------ the maps (155-167; 158 and 164 kept free)
    const MAPS = {
        pustelnia: 155, skryptorium: 156, urwisko: 157, przyladek: 159, izbaLatarnika: 160, laterna: 161,
        garnizon: 162, kwatera: 163, wrak: 165, podPokladem: 166, cysterna: 167,
        // the maps of the game they touch (no tiles of these are changed by the packages)
        tawerna: 1, miasteczko: 8, gory: 13, pokojeGosci: 25, podgrodzie: 111, przystan: 125, pietro30: 147
    };
    const FREE_MAPS = [158, 164];

    // ------------------------------------------------------------------ the packages: owner (the Tawerna.inject owner), maps, ids, ...
    const PACKAGES = {
        A: { owner: "Pustelnia", maps: [155, 156], ids: [600, 609], residents: { pustelnik: 944 }, quests: ["K50", "D23"], also: ["W2 rozdz. 7"], port: 9501 },
        B: { owner: "Kruk", maps: [157], ids: [610, 629], residents: {}, quests: ["K51", "D24"], port: 9502 },
        C: { owner: "Latarnia", maps: [159, 160, 161], ids: [630, 639], residents: { latarnik: 943 }, quests: ["K49", "D22", "W11"], port: 9503 },
        D: { owner: "Garnizon", maps: [162, 163], ids: [640, 669], residents: { rotmistrz: 945, kwatermistrz: 946, werbownik: 947 }, quests: ["K52", "D26", "D27"], port: 9504 },
        E: { owner: "Wrak", maps: [165, 166], ids: [670, 679], residents: { rozbitek: 948 }, quests: ["D25", "W12"], port: 9505 },
        F: { owner: "Cysterna", maps: [167], ids: [680, 689], residents: {}, quests: ["D28", "K53"], port: 9506 }
    };
    const SHARED_IDS = [690, 699];      // Wyspa.js: the ways in on the user's maps (690-698)
    const RESIDENT_SPARE = 949;         // the last free TownLife id

    // ------------------------------------------------------------------ the ways in from the user's maps (Wyspa.js puts them in as the
    // map loads - the map files stay as they are - and only once the place is built: Wyspa.ready(mapId) from its package)
    const EDGES = [
        { id: "przystan_pustelnia", from: 125, to: 155, ids: [690, 692], dir: 8, name: "Przejście -> Pustelnia na klifie",
          cells: [[14, 0], [15, 0], [16, 0]], land: [[23, 70], [24, 70], [25, 70]] },
        { id: "przystan_garnizon", from: 125, to: 162, ids: [693, 695], dir: 2, name: "Przejście -> Garnizon nad zatoką",
          cells: [[21, 79], [22, 79], [23, 79]], land: [[21, 1], [22, 1], [23, 1]] },
        { id: "gory_przyladek", from: 13, to: 159, ids: [696, 698], dir: 8, name: "Przejście -> Przylądek z latarnią",
          cells: [[119, 11], [119, 12], [119, 13]], land: [[29, 78], [30, 78], [31, 78]] }
    ];
    // (2026-10-18) the outdoor maps doubled (tools/powieksz/powieksz.py: the old part stays, new land east and south): the cells
    // and landings on their east / south edges moved to the new edges - Map125 112x80, Map013 120x96, Map155 96x72, Map157 112x72,
    // Map159 88x80, Map162 112x80, Map165 80x60
    // the ways back and between the new maps are events of the new maps themselves (their package puts them in its map): the cells
    // every package keeps (docs/miejsca_wyspy/PAKIETY.md "Kontrakty")
    const LINKS = [
        { from: 155, cells: [[23, 71], [24, 71], [25, 71]], to: 125, land: [[14, 1], [15, 1], [16, 1]], dir: 2 },
        { from: 155, cells: [[95, 17], [95, 18]], to: 157, land: [[1, 19], [1, 20]], dir: 6 },
        { from: 157, cells: [[0, 19], [0, 20]], to: 155, land: [[94, 17], [94, 18]], dir: 4 },
        { from: 157, cells: [[111, 19], [111, 20]], to: 159, land: [[1, 33], [1, 34]], dir: 6 },
        { from: 159, cells: [[0, 33], [0, 34]], to: 157, land: [[110, 19], [110, 20]], dir: 4 },
        { from: 159, cells: [[29, 79], [30, 79], [31, 79]], to: 13, land: [[118, 11], [118, 12], [118, 13]], dir: 4 },
        { from: 162, cells: [[21, 0], [22, 0], [23, 0]], to: 125, land: [[21, 78], [22, 78], [23, 78]], dir: 8 },
        { from: 162, cells: [[0, 20], [0, 21]], to: 165, land: [[78, 20], [78, 21]], dir: 4, tide: "low" },
        { from: 165, cells: [[79, 20], [79, 21]], to: 162, land: [[1, 20], [1, 21]], dir: 6, tide: "low" },
        { from: 167, cells: [[33, 2]], to: 157, land: [[41, 16]], dir: 2, gate: "krataUrwisko" },
        { from: 157, cells: [[41, 15]], to: 167, land: [[33, 3]], dir: 2, gate: "krataUrwisko" },
        { from: 147, cells: [[19, 5], [20, 5], [21, 5]], to: 167, land: [[3, 20]], dir: 6, gate: "zasuwaCysterny", note: "a page of the sluice's events (code), Map147 unchanged" },
        { from: 167, cells: [[2, 20]], to: 147, land: [[20, 6]], dir: 2 }
    ];

    // ------------------------------------------------------------------ the quests (numbers after the game's own: K48, D21, W10 taken)
    const QUESTS = {
        K49: "C", K50: "A", K51: "B", K52: "D", K53: "F",
        D22: "C", D23: "A", D24: "B", D25: "E", D26: "D", D27: "D", D28: "F",
        W11: "C", W12: "E"
    };
    const QUEST_TITLES = {
        K49: "Tran dla latarni", K50: "Atrament dla pustelnika", K51: "Kruk z masztu", K52: "Drewno dla garnizonu", K53: "Rynny zakonu",
        D22: "Księga mgieł", D23: "Zaszyfrowane kroniki", D24: "Oswojony kruk", D25: "Mapa z wraku", D26: "Lista poborowa",
        D27: "Zboże dla obozu", D28: "Zapas zakonu", W11: "Soczewka", W12: "Rozbitek"
    };

    // ------------------------------------------------------------------ the flags passed between the packages (TownQuests flags: the
    // value is the day it was set). "by" sets it, "for" reads it.
    const FLAGS = {
        krukTame: { by: "B", for: ["A", "E"], what: "kruk oswojony (listy, błyskotki, zwiad)" },
        kronikaKarta1: { by: "A", for: ["A"], what: "karta 1: Archiwum zakonu (W2 rozdz. 6)" },
        kronikaKarta2: { by: "A", for: ["A"], what: "karta 2: piętro 20" },
        kronikaKarta3: { by: "A", for: ["A"], what: "karta 3: Osada Milczących" },
        kronikaKarta4: { by: "E", for: ["A"], what: "karta 4: kajuta wraku" },
        kronikaKarta5: { by: "C", for: ["A"], what: "karta 5: Księga mgieł" },
        kronikaKarta6: { by: "B", for: ["A"], what: "karta 6: zwitek w obrączce kruka" },
        mgla: { by: "C", for: ["E"], what: "wizja 2 z latarni (człowiek z piórem) - poszlaka W12" },
        glejtWrak: { by: "D", for: ["E"], what: "glejt garnizonu na wrak (przychylność 40)" },
        dziennikOkretu: { by: "E", for: ["D"], what: "Dziennik okrętu w torbie (D26 c)" },
        ansgarGiven: { by: "E", for: ["D", "Akt III"], what: "rozbitek wydany garnizonowi" },
        ansgarAlly: { by: "E", for: ["Akt III", "A"], what: "rozbitek sojusznikiem" },
        ansgarFled: { by: "E", for: [], what: "rozbitek odpłynął kutrem" },
        klosWydany: { by: "D", for: ["W5"], what: "kwatermistrz wydany (Baltazar traci dostawcę)" },
        soczewkaRozbita: { by: "C", for: ["Serce"], what: "soczewka rozbita" },
        soczewkaSprzedana: { by: "C", for: ["Serce", "Akt III"], what: "soczewka sprzedana Baltazarowi" },
        cysternaOtwarta: { by: "F", for: ["B"], what: "cysterna odkryta (D28)" },
        galazDworskaZamknieta: { by: "F", for: ["Serce", "Lord"], what: "gałąź dworska zamknięta" },
        rynnyCzyste: { by: "F", for: [], what: "rynny na Urwisku oczyszczone (K53)" },
        sercePustelni: { by: "A", for: [], what: "serce dzwonu u Kleofasa (W2 rozdz. 7)" }
    };

    // ------------------------------------------------------------------ the switches (named in System.json, set by code)
    const SWITCHES = { krataUrwisko: 17, zasuwaCysterny: 18, mglaPrzyladek: 19, odplyw: 20 };
    const SWITCH_BY = { krataUrwisko: "F", zasuwaCysterny: "F", mglaPrzyladek: "C", odplyw: "Wyspa.js" };

    // ------------------------------------------------------------------ the new items (Items.json) and their icon cells
    const ITEMS = { tran: 177, mapa: 178, obraczka: 179 };
    const ITEM_BY = { tran: "C", mapa: "E", obraczka: "B" };
    const ICONS = { 177: 438, 178: 439, 179: 440 };   // (the packages' own icons, pasted into IconSet at the integration 2026-10-16)

    // ------------------------------------------------------------------ the tides: two low waters a day, ~50 minutes later each day
    // (level 0 low ... 1 high; "low" while the level is under LOW: about 3 hours)
    const TIDE = { period: 12.42, offset: 3.5, low: 0.15 };

    window.WyspaData = { MAPS, FREE_MAPS, PACKAGES, SHARED_IDS, RESIDENT_SPARE, EDGES, LINKS, QUESTS, QUEST_TITLES, FLAGS, SWITCHES, SWITCH_BY,
        ITEMS, ITEM_BY, ICONS, TIDE };
})();
