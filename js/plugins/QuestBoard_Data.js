//=============================================================================
// QuestBoard_Data.js
//=============================================================================
// The quest board's tables (split out of QuestBoard.js, 2026-09-29): the notices' templates, the people who pin them, the animals
// and the wanted posters, what the goods are worth, Borgar's words. Only data - QuestBoard.js reads it when it needs it (so this
// file may come before or after it; registered: right above QuestBoard, as Farming_Data above Farming).

/*:
 * @target MZ
 * @plugindesc Dane tablicy zleceń (QuestBoard.js): wzory ogłoszeń, zleceniodawcy, zwierzęta i listy gończe, wartość towarów, słowa Borgara. Sam nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base QuestBoard
 * @orderBefore QuestBoard
 *
 * @help
 * ============================================================================
 * QuestBoard_Data.js - dane tablicy zleceń
 * ============================================================================
 * Same tabele dla QuestBoard.js (wydzielone z niego): wzory ogłoszeń
 * (TEMPLATES), zleceniodawcy (GIVERS), zwierzęta (BEASTS), miejsca polowań
 * (PLACES), listy gończe (BOUNTIES), ile wart jest towar (EV, KILL_EV, BASE),
 * napisy rodzajów pracy i słowa Borgara przy pierwszej wizycie.
 * Nowe ogłoszenie dopisuje się TUTAJ. Parametry ma QuestBoard.js.
 *
 * KOLEJNOŚĆ: tuż nad QuestBoard (QuestBoard_Data, QuestBoard, QuestBoard_Art,
 * QuestBoard_Scene). Bez tego pliku tablica nie ma ogłoszeń.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW) throw new Error("QuestBoard_Data.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    // (the family's shared bag: QuestBoard.js and its parts; whichever file comes first makes it)
    const P = TW.api("QuestBoard_parts") || TW.register("QuestBoard_parts", {});
    if (P.data) return;   // (put into the page twice: kept as it was)

    // what a notice pays on top of the goods' worth, by its kind
    const BASE = { gather: 4, deliver: 6, craft: 8, hunt: 10, story: 8 };
    // what a piece of an item is worth in effort (the database prices are for Borgar's shop, not for work)
    const EV = { 64: 1.2, 77: 1, 92: 1.2, 147: 0.8, 61: 2.5, 102: 1.2, 103: 2, 104: 1.8, 149: 1, 150: 2, 151: 1.6, 139: 1.2, 140: 1.2, 164: 2.5, 85: 5,
        96: 6, 163: 4, 146: 1.6, 94: 5, 157: 7, 159: 8, 161: 5, 95: 7, 158: 9, 71: 2.5, 72: 2.5, 73: 5, 74: 1.6, 75: 2.5, 76: 7, 123: 5, 111: 10,
        80: 4.5, 84: 3, 79: 3.5, 86: 12, 88: 0.9, 167: 12, 93: 4, 127: 0.8, 152: 5, 97: 12, 83: 6, 81: 8, 137: 18, 124: 16, 105: 12, 130: 14, 136: 14, 82: 3 };
    const KILL_EV = { rabbit: 6, deer: 12, wolf: 12, boar: 22 };

    // ------------------------------------------------------------------
    // The people who pin notices: name, trade, one line about them; pin: nail / brass / red tack / wax seal (0 the tavern's
    // tankard, 1 the manor's Z, 2 the herbalist's leaf); gift: items they sometimes add to the pay
    // ------------------------------------------------------------------
    const GIVERS = {
        borgar: { pin: "seal0", gift: [[81, 2], [83, 2]] },
        feliks: { pin: "seal1", gift: [] },
        melia: { pin: "red", gift: [[76, 1]] },
        grum: { pin: "nail", gift: [[152, 2], [127, 12]] },
        ozzy: { pin: "nail", gift: [[81, 1]] },
        jagna: { pin: "seal2", gift: [[152, 2], [110, 2]] },
        tadeusz: { pin: "brass", gift: [[97, 1]] },
        halina: { pin: "red", gift: [[83, 2]] },
        bartek: { pin: "brass", gift: [[69, 3], [70, 4]] },
        wit: { pin: "nail", gift: [[167, 1]] },
        zdzich: { pin: "nail", gift: [[88, 10], [86, 1]] },
        bogdan: { pin: "nail", gift: [[127, 12]] },
        marianna: { pin: "brass", gift: [[75, 4], [67, 3]] },
        kazimierz: { pin: "nail", gift: [[88, 6]] },
        jozek: { pin: "red", gift: [[102, 4], [139, 3]] }
    };
    Watki.scal(GIVERS, "tablica", "zleceniodawcy");   // (its words: js/teksty/tablica.txt, zleceniodawcy)

    // the animals, with Polish words for counts
    const BEASTS = {
        rabbit: { sheet: "$Animal_Rabbit", icon: 94 },
        deer: { sheet: "$Animal_Deer", icon: 157 },
        wolf: { sheet: "$Animal_Wolf", icon: 161 },
        boar: { sheet: "$Animal_Boar", icon: 159 }
    };
    Watki.scal(BEASTS, "tablica", "zwierzeta");   // (its words: js/teksty/tablica.txt, zwierzeta)
    // places for the hunts: the name and "where" (Polish locative)
    const PLACES = {};
    Watki.scal(PLACES, "tablica", "miejsca");   // (its words: js/teksty/tablica.txt, miejsca)

    // wanted animals: kind, where, how much stronger and bigger, a tint; pack: wolves beside it
    const BOUNTIES = {
        szary_kiel: { kind: "wolf", map: 23, hp: 2.4, lv: 3, scale: 1.32, tone: [52, 52, 58, 90], pack: 2, die: "szczesciarz" },
        czarny_ryj: { kind: "boar", map: 21, hp: 2.2, lv: 3, scale: 1.3, tone: [-70, -70, -62, 40], pack: 0, die: "wdowa" },
        trojlap: { kind: "wolf", map: 22, hp: 1.8, lv: 2, scale: 1.16, tone: [46, 16, -14, 30], pack: 1, die: "grusza" }
    };
    Watki.scal(BOUNTIES, "tablica", "poszukiwani");   // (its words: js/teksty/tablica.txt, poszukiwani)

    // ------------------------------------------------------------------
    // The notices. req: { item, n } (n: [min, max] for each tier 0-4, null = not at that tier), { kill, n, maps } (maps: one is
    // picked; none = anywhere), { bounty }. from: the first day; seasons: 0 spring .. 3 winter; once: a one-off story notice.
    // {place}: the hunt's place ("na Leśnej drodze"); {Place}: its name
    // ------------------------------------------------------------------
    const T = (a, b) => [a, b];
    const TEMPLATES = [
        // ---- Borgar
        { id: "rabbit_meat", type: "deliver", giver: "borgar",
            req: [{ item: 94, n: [T(2, 2), T(2, 3), null, null, null] }] },
        { id: "firewood", type: "gather", giver: "borgar",
            req: [{ item: 61, n: [T(4, 6), T(8, 10), null, null, null] }] },
        { id: "potatoes", type: "deliver", giver: "borgar", seasons: [0, 1, 2], from: 3,
            req: [{ item: 71, n: [T(3, 4), T(5, 6), T(8, 10), null, null] }] },
        { id: "mushrooms", type: "gather", giver: "borgar", seasons: [0, 1, 2],
            req: [{ item: 103, n: [T(3, 4), T(5, 6), null, null, null] }] },
        { id: "barley", type: "deliver", giver: "borgar", seasons: [1, 2], from: 35,
            req: [{ item: 74, n: [null, null, T(8, 10), T(12, 14), null] }] },
        { id: "bread", type: "craft", giver: "borgar", from: 38,
            req: [{ item: 83, n: [null, null, null, T(4, 6), T(8, 10)] }] },
        { id: "boar_meat", type: "deliver", giver: "borgar",
            req: [{ item: 159, n: [null, null, T(2, 3), T(3, 4), null] }] },
        { id: "s_cellar", type: "story", giver: "borgar", once: true, from: 12, noUrgent: true,
            req: [{ item: 80, n: [null, null, T(6, 6), T(6, 6), T(6, 6)] }, { item: 88, n: [null, null, T(10, 10), T(10, 10), T(10, 10)] }] },
        // ---- Feliks, the manor
        { id: "lord_planks", type: "craft", giver: "feliks",
            req: [{ item: 80, n: [null, null, T(16, 20), T(20, 20), T(24, 26)] }] },
        { id: "lord_bricks", type: "craft", giver: "feliks",
            req: [{ item: 84, n: [null, null, null, T(16, 20), T(24, 28)] }] },
        { id: "venison", type: "deliver", giver: "feliks",
            req: [{ item: 157, n: [null, null, T(2, 3), T(3, 4), null] }] },
        { id: "quills", type: "deliver", giver: "feliks",
            req: [{ item: 146, n: [null, T(4, 5), T(6, 8), null, null] }] },
        { id: "mead", type: "craft", giver: "feliks",
            req: [{ item: 137, n: [null, null, null, T(2, 2), T(3, 4)] }] },
        { id: "cheese", type: "craft", giver: "feliks",
            req: [{ item: 124, n: [null, null, null, T(2, 3), T(4, 5)] }] },
        { id: "lord_deer", type: "hunt", giver: "feliks",
            req: [{ kill: "deer", n: [null, null, null, T(1, 1), T(2, 2)] }, { item: 157, n: [null, null, null, T(2, 3), T(3, 4)] }] },
        // ---- Melia
        { id: "honey", type: "deliver", giver: "melia",
            req: [{ item: 76, n: [null, T(2, 2), T(3, 3), T(4, 5), null] }] },
        { id: "feathers", type: "deliver", giver: "melia",
            req: [{ item: 146, n: [null, T(3, 4), T(5, 6), null, null] }] },
        { id: "apples", type: "gather", giver: "melia", seasons: [1, 2],
            req: [{ item: 139, n: [T(4, 5), T(6, 8), null, null, null] }] },
        // ---- Grum
        { id: "provisions", type: "deliver", giver: "grum",
            req: [{ item: 95, n: [null, T(2, 3), T(3, 4), null, null] }] },
        { id: "smoked", type: "craft", giver: "grum",
            req: [{ item: 105, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        { id: "hunt_mix", type: "hunt", giver: "grum",
            req: [{ kill: "wolf", n: [null, null, null, T(2, 2), T(3, 3)] }, { kill: "boar", n: [null, null, null, T(1, 1), T(1, 1)] }] },
        { id: "b_szary_kiel", type: "bounty", giver: "grum",
            req: [{ bounty: "szary_kiel", n: [null, null, null, T(1, 1), T(1, 1)] }] },
        // ---- Ozzy
        { id: "berries", type: "gather", giver: "ozzy", seasons: [0, 1, 2],
            req: [{ item: 102, n: [T(5, 6), T(8, 10), null, null, null] }] },
        { id: "beer", type: "craft", giver: "ozzy", from: 38,
            req: [{ item: 81, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        { id: "s_ozzy", type: "story", giver: "ozzy", once: true, from: 8, seasons: [0, 1, 2], noUrgent: true,
            req: [{ item: 103, n: [null, T(4, 4), T(4, 4), T(4, 4), T(4, 4)] }] },
        // ---- Jagna, the herbalist
        { id: "herbs", type: "gather", giver: "jagna", seasons: [0, 1],
            req: [{ item: 104, n: [T(3, 4), T(5, 6), null, null, null] }] },
        { id: "yarrow", type: "gather", giver: "jagna", seasons: [1, 2],
            req: [{ item: 150, n: [null, T(3, 4), T(5, 6), null, null] }] },
        { id: "nettle", type: "gather", giver: "jagna", seasons: [0, 1, 2],
            req: [{ item: 149, n: [T(4, 6), T(6, 8), null, null, null] }] },
        { id: "garlic", type: "gather", giver: "jagna", seasons: [0, 1],
            req: [{ item: 151, n: [T(3, 4), T(5, 6), null, null, null] }] },
        { id: "bandages", type: "craft", giver: "jagna", seasons: [1],
            req: [{ item: 152, n: [null, T(2, 2), T(3, 4), null, null] }] },
        // ---- Tadeusz, the furrier
        { id: "hides", type: "deliver", giver: "tadeusz",
            req: [{ item: 96, n: [T(2, 2), T(3, 3), T(4, 5), null, null] }] },
        { id: "wolf_pelts", type: "hunt", giver: "tadeusz",
            req: [{ kill: "wolf", n: [null, null, T(2, 3), T(3, 4), T(4, 5)] }, { item: 96, same: 0 }] },
        { id: "tanned", type: "craft", giver: "tadeusz",
            req: [{ item: 97, n: [null, null, T(2, 3), T(3, 4), null] }] },
        // ---- Halina, the baker's wife
        { id: "eggs", type: "deliver", giver: "halina", from: 10,
            req: [{ item: 75, n: [null, null, T(6, 8), T(10, 12), null] }] },
        { id: "flour", type: "craft", giver: "halina", from: 36,
            req: [{ item: 82, n: [null, null, null, T(6, 8), null] }] },
        { id: "pie", type: "craft", giver: "halina", from: 38,
            req: [{ item: 136, n: [null, null, null, null, T(3, 4)] }] },
        // ---- Bartłomiej, the village head
        { id: "stones", type: "gather", giver: "bartek",
            req: [{ item: 64, n: [T(8, 10), T(12, 15), null, null, null] }] },
        { id: "rope", type: "craft", giver: "bartek",
            req: [{ item: 93, n: [T(2, 2), T(3, 4), null, null, null] }] },
        { id: "bricks", type: "craft", giver: "bartek",
            req: [{ item: 84, n: [null, T(6, 8), T(10, 12), T(14, 16), null] }] },
        { id: "wolves", type: "hunt", giver: "bartek",
            req: [{ kill: "wolf", n: [null, T(2, 2), T(2, 3), T(3, 4), null] }] },
        { id: "stew", type: "craft", giver: "bartek",
            req: [{ item: 130, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        // ---- Wit, the potter
        { id: "clay", type: "gather", giver: "wit", seasons: [0, 1, 2],
            req: [{ item: 164, n: [T(2, 3), T(4, 5), null, null, null] }] },
        { id: "pots", type: "craft", giver: "wit",
            req: [{ item: 167, n: [null, T(1, 2), T(2, 3), T(3, 4), null] }] },
        // ---- Zdzisław, the smith
        { id: "charcoal", type: "craft", giver: "zdzich",
            req: [{ item: 79, n: [null, T(4, 6), T(8, 9), null, null] }] },
        { id: "ore", type: "gather", giver: "zdzich",
            req: [{ item: 85, n: [null, null, T(4, 6), T(6, 8), null] }] },
        { id: "iron", type: "craft", giver: "zdzich",
            req: [{ item: 86, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        // ---- Bogdan, the huntsman
        { id: "sinew", type: "deliver", giver: "bogdan",
            req: [{ item: 163, n: [null, T(3, 4), T(5, 6), null, null] }] },
        { id: "arrows", type: "craft", giver: "bogdan",
            req: [{ item: 127, n: [null, T(12, 12), T(18, 24), null, null] }] },
        { id: "wolf_meat", type: "deliver", giver: "bogdan",
            req: [{ item: 161, n: [null, null, T(3, 4), null, null] }] },
        { id: "wolves_map", type: "hunt", giver: "bogdan",
            req: [{ kill: "wolf", maps: [21, 22, 23, 4], n: [null, null, T(2, 3), T(3, 3), T(4, 4)] }] },
        { id: "deer", type: "hunt", giver: "bogdan",
            req: [{ kill: "deer", n: [null, T(1, 1), T(2, 2), null, null] }] },
        { id: "b_trojlap", type: "bounty", giver: "bogdan",
            req: [{ bounty: "trojlap", n: [null, null, T(1, 1), T(1, 1), null] }] },
        // ---- Marianna, the widow
        { id: "rabbits", type: "hunt", giver: "marianna",
            req: [{ kill: "rabbit", n: [T(2, 2), T(3, 3), null, null, null] }] },
        { id: "boar", type: "hunt", giver: "marianna",
            req: [{ kill: "boar", n: [null, null, T(1, 1), T(2, 2), null] }] },
        { id: "milk", type: "deliver", giver: "marianna", from: 14,
            req: [{ item: 123, n: [null, null, T(3, 4), T(4, 6), null] }] },
        { id: "flax", type: "gather", giver: "marianna", seasons: [0, 1, 2],
            req: [{ item: 92, n: [T(6, 8), T(10, 12), null, null, null] }] },
        { id: "wool", type: "deliver", giver: "marianna", from: 20,
            req: [{ item: 111, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        { id: "cabbage", type: "deliver", giver: "marianna", seasons: [2, 3], from: 60,
            req: [{ item: 73, n: [null, T(3, 4), T(5, 6), T(6, 8), null] }] },
        { id: "b_czarny_ryj", type: "bounty", giver: "marianna",
            req: [{ bounty: "czarny_ryj", n: [null, null, null, T(1, 1), T(1, 1)] }] },
        // ---- Kazimierz, the carpenter
        { id: "planks", type: "craft", giver: "kazimierz",
            req: [{ item: 80, n: [T(4, 5), T(6, 8), T(10, 12), null, null] }] },
        { id: "nails", type: "craft", giver: "kazimierz",
            req: [{ item: 88, n: [null, null, T(10, 20), T(20, 30), null] }] },
        { id: "shed_wood", type: "gather", giver: "kazimierz",
            req: [{ item: 61, n: [null, T(8, 10), T(12, 15), null, null] }] },
        // ---- Józek
        { id: "carrots", type: "deliver", giver: "jozek", seasons: [0, 1, 2],
            req: [{ item: 72, n: [T(2, 3), T(4, 5), null, null, null] }] },
        { id: "branches", type: "gather", giver: "jozek",
            req: [{ item: 77, n: [T(8, 10), T(12, 14), null, null, null] }] },
        { id: "cones", type: "gather", giver: "jozek",
            req: [{ item: 147, n: [T(5, 6), T(8, 10), null, null, null] }] }
    ];
    Watki.scal(TEMPLATES, "tablica", "szablony", "id");   // (its words: js/teksty/tablica.txt, szablony, by the id)
    const TYPE_LABEL = {};
    Watki.scal(TYPE_LABEL, "tablica", "rodzaje");   // (its words: js/teksty/tablica.txt, rodzaje)

    // the first visit: Borgar explains the board
    const BORGAR_BUST = "People3_5";   // (the bust Borgar has in talks, SpeechBubbles.js; 330 x 350, facing left)
    const TUTORIAL = [];
    Watki.scal(TUTORIAL, "tablica", "samouczek");   // (its words: js/teksty/tablica.txt, samouczek)

    P.data = { BASE, EV, KILL_EV, GIVERS, BEASTS, PLACES, BOUNTIES, TEMPLATES, TYPE_LABEL, BORGAR_BUST, TUTORIAL };
})();
