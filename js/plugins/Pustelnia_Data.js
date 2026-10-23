//=============================================================================
// Pustelnia_Data.js
//=============================================================================
// PAKIET A (docs/miejsca_wyspy/PAKIETY.md) - the data of "Pustelnia na klifie" (Map155) and its "Skryptorium" (Map156): brother
// Kleofas, the last chronicler of the Order, the six ciphered cards of the chronicle, one question a year (concept approved by the
// user 2026-10-16: docs/miejsca_wyspy/KONCEPCJA.md section 3). Only data and texts - the engine is Pustelnia.js.
//   - window.TownLifeExtra: the resident "pustelnik" (fixed id 944) living on Map155, in the scriptorium (Map156) by his plan
//   - window.TownQuestsPacks: K50 "Atrament dla pustelnika", D23 "Zaszyfrowane kroniki", the things carried (the six cards, the
//     bell's heart), remarks of the town about the hermit (W2 rozdz. 7 "Jedno pytanie" is a step of W2 itself, TownQuests_Data.js)
//   - window.PustelniaData: the cards (where they lie, what they say, the journal's chapters of "Kronika upadku"), the questions of
//     the Night of the Question and Kleofas's own talk (the first meeting, honey, the chronicles' gossip, the bell)
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): nothing here gives the hero water - K50 TAKES a portion of his own rain water; the cistern is empty.

/*:
 * @target MZ
 * @plugindesc [pakiet A] Dane: pustelnia na klifie i skryptorium (mapy 155, 156), brat Kleofas, karty kroniki, K50, D23. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet A - dane miejsca (silnik: Pustelnia.js).
 * Mieszkaniec: brat Kleofas (pustelnik, numer 944) na mapach 155/156.
 * Zadania: K50 „Atrament dla pustelnika”, D23 „Zaszyfrowane kroniki”
 * (W2 rozdz. 7 „Jedno pytanie” jest w bloku W2 w TownQuests_Data.js).
 * Numery zdarzeń 600-609. Test: tests/pustelnia_test.js (port 9501).
 */

(() => {
    "use strict";

    const MAP = 155, INNER = 156;
    const ITEM = { honey: 76, cones: 147, iron: 86, pendant: 172 };
    const P = () => window.Pustelnia || null;
    // TownLife's conditions (the engine answers them: the rain, the Night of the Question)
    const rain = () => !!(P() && P().rain());
    const dry = () => !rain();
    const night = () => !!(P() && P().nightNow());

    // ------------------------------------------------------------------ the resident: brother Kleofas
    // Plan (KONCEPCJA 3): 4-5 he gets up, 5-7 on the cliff's edge facing the sea, 7-12 copying in the scriptorium, 12-13 bread with
    // honey on the bench, 13-16 the garden and the hives, 16-19 the scriptorium, 19-20 the sunset from the bench, 20-4 asleep in his
    // shut cell. In the rain all day in the scriptorium. On the Night of the Question (the Wigilia) at the bell tower round midnight.
    // He never goes down to the town. "cela_drzwi" is away (asleep in the cell: shown in no interior).
    const RESIDENT = {
        key: "pustelnik", id: 944, sheet: "$Npc_Pustelnik", map: MAP, speed: 2,
        away: ["cela_drzwi"],
        plan: [[0, "inside", "cela_drzwi"], [0, "stand", "wieza", night],
               [5, "stand", "urwisko", dry], [5, "inside", "skryptorium_drzwi", rain],
               [7, "inside", "skryptorium_drzwi"],
               [12, "stand", "lawka", dry],
               [13, "work", "ogrodek", dry],
               [14.5, "work", "ule", dry],
               [16, "inside", "skryptorium_drzwi"],
               [19, "stand", "lawka", dry],
               [20, "inside", "cela_drzwi"],
               [22.5, "stand", "wieza", night]],
        barks: {
        },
        talk: {
        }
    };
    Watki.scal(RESIDENT, "pustelnia", "mieszkaniec");   // (its words: js/teksty/pustelnia.txt, mieszkaniec)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(RESIDENT);
    // default spots (the map's "Miejsce:" events win - tools/pustelnia/build.py puts them there)
    const TLD = window.TownLifeData;
    if (TLD && TLD.SPOTS_BY_MAP) {
        TLD.SPOTS_BY_MAP[MAP] = Object.assign({ skryptorium_drzwi: [14, 10, 8], cela_drzwi: [23, 8, 8], urwisko: [7, 7, 4], lawka: [9, 6, 4],
            ogrodek: [16, 11, 2], ule: [26, 8, 6], wieza: [20, 10, 8] }, TLD.SPOTS_BY_MAP[MAP] || {});
        TLD.SPOTS_BY_MAP[INNER] = Object.assign({ pustelnik_wnetrze: [5, 5, 6] }, TLD.SPOTS_BY_MAP[INNER] || {});
    }

    // ------------------------------------------------------------------ the six cards of the chronicle (D23)
    // n: the card's number = the chapter of "Kronika upadku"; flag: the TownQuests flag of "the card found" (WyspaData.FLAGS - A sets
    // 1-3, the packages E, C, B set 4-6); where: the journal's hint; read: what Kleofas reads at the lectern ("> ..." the hero);
    // note: the journal's chapter
    const CARDS = [
        { n: 1, flag: "kronikaKarta1" },
        { n: 2, flag: "kronikaKarta2" },
        { n: 3, flag: "kronikaKarta3" },
        { n: 4, flag: "kronikaKarta4" },
        { n: 5, flag: "kronikaKarta5" },
        { n: 6, flag: "kronikaKarta6" }
    ];
    Watki.scal(CARDS, "pustelnia", "karty");   // (its words: js/teksty/pustelnia.txt, karty)

    // ------------------------------------------------------------------ the Night of the Question: what may be asked (W2 rozdz. 7, then a
    // question every Wigilia). need: "trust" - D23 done (Kleofas trusts the hero); "card:N" - card N read. keep: Kleofas will not take
    // it as the year's question (the answer is not in the chronicles). The answers come from the game's state (Pustelnia.answer).
    const QUESTIONS = [
        { id: "dziadek" },
        { id: "zdrajca" },
        { id: "lord" },
        { id: "serce", need: "trust" },
        { id: "dobiesz", need: "card:3" },
        { id: "matka", keep: true }
    ];
    Watki.scal(QUESTIONS, "pustelnia", "pytania");   // (its words: js/teksty/pustelnia.txt, pytania)

    // ------------------------------------------------------------------ Kleofas's own talk
    const TX = Watki.teksty("pustelnia");

    // ------------------------------------------------------------------ the quests (TownQuests packs - docs/QUESTY_STAN.md "Jak dopisać")
    const K50 = {
        id: "K50", kind: "K", giver: "pustelnik", icon: 147, 
        offer: {
            cond: { hours: [5, 20], day: 6, flags: ["pustelnikMet"] }
        },
        steps: [
            { type: "bring", to: "pustelnik", need: [[147, 4], [86, 1]], water: 1, hours: [5, 20] }
        ],
        reward: { gold: 15, xp: 40, items: [[76, 2]], flag: "kleofasCzyta" }
    };
    Watki.scal(K50, "pustelnia", "zadania.K50");   // (its words: js/teksty/pustelnia.txt, zadania.K50)
    const D23 = {
        id: "D23", kind: "D", giver: "pustelnik", icon: 189, 
        offer: {
            cond: { hours: [7, 19] }
        },
        steps: [
            { type: "custom", talk: "d23Karty", check: "d23Karty", vars: "d23Karty" }
        ],
        reward: { gold: 120, flag: "kleofasUfa" }
    };
    Watki.scal(D23, "pustelnia", "zadania.D23");   // (its words: js/teksty/pustelnia.txt, zadania.D23)
    const VITEMS = {
        karta_1: { icon: 189 },
        karta_2: { icon: 189 },
        karta_3: { icon: 189 },
        karta_4: { icon: 189 },
        karta_5: { icon: 189 },
        karta_6: { icon: 189 },
        serce_dzwonu: { icon: 342 }
    };
    Watki.scal(VITEMS, "pustelnia", "rzeczy");   // (its words: js/teksty/pustelnia.txt, rzeczy)
    const REMARKS = [
        { id: "pustAmbrozy", who: "dzwonnik", flag: "pustelnikMet" },
        { id: "pustSoltys", who: "soltys", flag: "pustelnikMet" },
        { id: "pustKupiec", who: "kupiec", flag: "kleofasCzyta" }
    ];
    Watki.scal(REMARKS, "pustelnia", "uwagi");   // (its words: js/teksty/pustelnia.txt, uwagi)
    const GOSSIP = { pustelnik: [] };   // (the key stays: TownQuests_Data copies the gossip key by key while the plugins load)
    Watki.scal(GOSSIP, "pustelnia", "plotki");   // (its words: js/teksty/pustelnia.txt, plotki)
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Pustelnia", quests: [K50, D23], vitems: VITEMS, remarks: REMARKS, gossip: GOSSIP });

    window.PustelniaData = { MAP, INNER, ITEM, IDS: [600, 609], HONEY_PRICE: 12, CARD_BUYBACK: 40, READ_HOURS: [7, 19], READ_TIME: 2,
        NIGHT: { from: 22.5, until: 1.5, bell: 0 }, RESIDENT, CARDS, QUESTIONS, TX, K50, D23, VITEMS, REMARKS };
})();
