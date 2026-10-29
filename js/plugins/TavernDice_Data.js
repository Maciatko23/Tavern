//=============================================================================
// TavernDice_Data.js
//=============================================================================
// The dice game's tables (split out of TavernDice.js, 2026-09-29): the special dice, the rivals (when they sit at the table, what
// they play for, how they play, all they say), the merchant's hint, the hero's words, the autopilot's heads. Only data - TavernDice.js
// reads it when it needs it (registered: right above TavernDice).

/*:
 * @target MZ
 * @plugindesc Dane gry w kości (TavernDice.js): kości specjalne, rywale (godziny, stawki, sposób gry, wszystko, co mówią), słowa bohatera. Sam nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TavernDice
 * @orderBefore TavernDice
 *
 * @help
 * ============================================================================
 * TavernDice_Data.js - dane gry w kości
 * ============================================================================
 * Same tabele dla TavernDice.js (wydzielone z niego): kości specjalne
 * (DIE_TYPES), rywale przy stole (OPPONENTS, z ich kwestiami), kolejność
 * rywali, słowa bohatera i „głowy” autopilota (testy). Nowego rywala albo
 * kość dopisuje się TUTAJ. Parametry ma TavernDice.js.
 *
 * KOLEJNOŚĆ: TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW) throw new Error("TavernDice_Data.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    // (the family's shared bag: TavernDice.js and its parts; whichever file comes first makes it)
    const P = TW.api("TavernDice_parts") || TW.register("TavernDice_parts", {});
    if (P.data) return;   // (put into the page twice: kept as it was)

    // ==================================================================
    // The dice: the plain ones and the special ones (kept in $gameSystem, not database items). w: the weights of the faces 1-6;
    // the words (name, short, desc, effect): js/teksty/kosci.txt, kosci.<key>
    // ==================================================================
    const DIE_TYPES = {
        std: { w: [1, 1, 1, 1, 1, 1] },
        grusza: { w: [1.25, 1, 1, 1, 1.15, 1] },
        wdowa: { w: [1, 1, 1, 1, 1.9, 1] },
        szczesciarz: { w: [1.8, 1, 1, 1, 1, 1] },
        krucze: { w: [1.7, 1, 0.8, 1, 1.3, 1], rare: true }
    };
    Watki.scal(DIE_TYPES, "kosci", "kosci");
    const SPECIAL_ORDER = ["szczesciarz", "wdowa", "krucze", "grusza"];

    // ==================================================================
    // The rivals: when they sit at the table, what they play for, how they play, what they say
    // ==================================================================
    // ai.bank[n]: the turn's points at which they write them down when n dice would be left to throw (6: after hot dice). The words
    // (name, short, role, style, quote and all the lines they say): js/teksty/kosci.txt, rywale.<key>
    const OPPONENTS = {
        grum: {
            styleColor: "#ff9b6b",
            bust: "Actor2_5", sheet: "Actor2_Tall", index: 4,
            hours: [17, 24], stakes: [10, 15, 20, 25], perDay: 3,
            ai: { bank: [0, 450, 550, 700, 1100, 2000, Infinity], reckless: 0.2, chase: 1.8 },
            die: { key: "szczesciarz", chance: 0.5, giveAfter: 4 },
            lines: {}
        },
        ozzy: {
            styleColor: "#8fc7ff",
            bust: "People2_1", sheet: "People2_Tall", index: 0,
            hours: [10, 23], stakes: [5, 10], perDay: 3,
            ai: { bank: [0, 250, 300, 350, 500, 850, Infinity], reckless: 0, chase: 1.4 },
            die: { key: "wdowa", chance: 0.35, giveAfter: 3 },
            visions: true, stories: true,
            lines: { vision: {} }
        },
        kupiec: {
            styleColor: "#c9a6ff",
            bust: "People4_5", sheet: "People4", index: 4,
            hours: [18, 23], rare: true, stakes: [25, 35, 50], perDay: 2, minRep: 40,
            ai: { bank: [0, 300, 350, 400, 700, 1700, Infinity], reckless: 0.03, chase: 1.6 },
            die: { key: "krucze", chance: 0.4 },
            lines: {}
        },
        bartek: {
            styleColor: "#8ee08a",
            bust: "Bartek_Bust", sheet: "People1_Tall", index: 4,
            hours: [14, 21], stakes: [5], perDay: 2,
            ai: { bank: [0, 300, 350, 400, 450, 600, Infinity], keepAll: true, miss: 0.12, reckless: 0, chase: 1.3 },
            die: { key: "grusza", chance: 1, giveAfter: 2 },
            lines: {}
        },
        // (from the tavern's fame on the quest board, QuestBoard.js: 40 Swój chłop, 80 Chluba tawerny)
        nieznajomy: {
            styleColor: "#c8bda8",
            bust: "Evil_8", sheet: null, index: 0,
            hours: [21, 24], stakes: [100], target: 3000, perDay: 1, minRep: 80, needsRep: true,
            ai: { bank: [0, 350, 400, 500, 800, 1800, Infinity], reckless: 0.08, chase: 1.7 },
            die: { key: "krucze", chance: 0.5, giveOnce: true, orGold: 100 },
            lines: {}
        }
    };
    Watki.scal(OPPONENTS, "kosci", "rywale");
    // what the others say when the merchant sits by the window but does not play with the hero yet (fame below 40):
    // js/teksty/kosci.txt, kupiec_przy_oknie.<key>
    const MERCHANT_HINT = Watki.scal({}, "kosci", "kupiec_przy_oknie");
    const OPP_ORDER = ["grum", "ozzy", "kupiec", "bartek", "nieznajomy"];
    const HERO_LINES = Watki.scal({}, "kosci", "bohater");   // (the hero's own words at the table: js/teksty/kosci.txt, bohater)
    // the hero on autopilot (tests): plays like a sensible regular
    const AUTO_AI = {
        steady: { bank: [0, 300, 350, 400, 650, 1500, Infinity], reckless: 0, chase: 1.5 },
        bold: { bank: [0, 450, 550, 700, 1100, 2000, Infinity], reckless: 0.1, chase: 1.8 },
        timid: { bank: [0, 200, 250, 300, 350, 500, Infinity], reckless: 0, chase: 1.2 }
    };

    P.data = { DIE_TYPES, SPECIAL_ORDER, OPPONENTS, MERCHANT_HINT, OPP_ORDER, HERO_LINES, AUTO_AI };
})();
