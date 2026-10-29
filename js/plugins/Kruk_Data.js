//=============================================================================
// Kruk_Data.js
//=============================================================================
// PAKIET B (docs/miejsca_wyspy/PAKIETY.md) - the data of "Urwisko Kruków" (Map157) and the tame raven (concept approved by the user
// 2026-10-16: docs/miejsca_wyspy/KONCEPCJA.md section 4; the user's choices: the player names the raven, letters only about the
// island, the perch stands on the field). Only data and texts - the engine is Kruk.js.
//   - the thread "kruk" (Watki.js, 2026-10-28): the state, K51 "Kruk z masztu" (Roch at the harbour; the raven on the cutter's mast at
//     dawn leads the hero over the hermitage to the ravenry), D24 "Oswojony kruk" (three feedings in the ravenry, the ring with the
//     scroll = chronicle card 6, grandpa's "long story", the perch on the field) - into window.TownQuestsPacks with the residents'
//     remarks once the raven is tame; the talk of a foreign letter given back to its owner
//   - window.KrukData: the raven's sheet, the food, the letters (to whom, the answers), the foreign letters it brings, the trinkets,
//     the scouting, the texts
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): nothing here gives the hero water.

/*:
 * @target MZ
 * @plugindesc [pakiet B] Dane: Urwisko Kruków (mapa 157) i oswojony kruk: K51, D24, listy, cudze listy, błyskotki, zwiad. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet B - dane miejsca (silnik: Kruk.js).
 * Zadania: K51 „Kruk z masztu” (od Rocha na przystani), D24 „Oswojony kruk”
 * (zaczyna się samo po K51). Znaczniki rynien dla K53 stoją na mapie 157.
 * Numery zdarzeń 610-629. Test: tests/kruk_test.js (port 9502).
 */

(() => {
    "use strict";

    const MAP = 157, HARBOUR = 125, HERMITAGE = 155, FIELD = 3;
    const ITEM = { ring: 179, pendant: 172, nails: 88, feathers: 146, rope: 93, iron: 86, stone: 64 };
    const RAVEN_ICON = 437;     // (the pendant's raven - the raven's menus)
    const RING_ICON = 440;      // (the ring with the raven, item 179 - its own icon in IconSet since the integration 2026-10-16: the quests' icon)

    // ------------------------------------------------------------------ the sheet (img/system/Kruk.png, tools/kruk/art/build_sheet.py)
    // cells 48 x 48, the raven faces right (left: mirrored), the feet of the ground frames on row 44 (anchor 45/48)
    const SHEET = {
        file: "Kruk", cell: 48, feet: 45, height: 30,
        stand: [0, 0], caw: [0, [1, 2, 3, 4, 5, 6, 7, 8]], peck: [1, [0, 1, 2, 3, 4, 5, 6, 7, 8]],
        takeoff: [2, [0, 1, 2, 3, 4, 5, 6]], fly: [3, [0, 1, 2, 3, 4, 5, 6, 7]], glide: [3, 2],
        letterStand: [4, 0], letterFly: [4, [1, 2, 3, 4, 5, 6, 7, 8]], sleep: [6, [1, 2, 3, 4]],
        // the perches: the field's (Farm_Grzeda.png 56 x 100) and the Order's old ones in the ravenry (Kruk_Grzeda_Stara.png 55 x 65):
        // px from the picture's foot to the top of the bar the raven stands on
        perchZ: { grzeda: 65, stara: 63 }, oldPerch: "Kruk_Grzeda_Stara"
    };

    // ------------------------------------------------------------------ the raven's life
    const RAVEN = {
        feedNeed: 3,                         // taming: three feedings, each on another day
        feedHours: [6, 20],                  // the young raven takes food by day
        wildMast: [5, 7],                    // at dawn the wild raven sits on the cutter's mast at the harbour (KONCEPCJA 4)
        sleep: [21, 5],                      // asleep on the perch
        drain: { food: 1.0, water: 1.4 },    // an hour (a day without food: about 24 down)
        hungryLeave: 3,                      // days at 0 food: it flies back to the Urwisko (fed there once: back again)
        trayFood: 45, bowlWater: 60, bowlMax: 3,
        guardRadius: 5,                      // "Pilnuj pola": the crops round the perch (Chebyshev), like a big scarecrow
        letterHours: [1, 2],                 // a letter: back with the answer after 1-2 game hours
        scoutHours: 1.5,
        warnRange: 9, warnGap: 60 * 90,      // wolves / boars / bears near the hero: a warning caw, at most every 90 s
        runScare: 6                          // the young raven: the hero running within this many tiles - it flies off for an hour
    };
    Watki.scal(RAVEN, "kruk", "kruk");   // (its words: js/teksty/kruk.txt, kruk)

    // ------------------------------------------------------------------ letters: to whom on the island (never over the sea)
    // key: TownLife's resident ("grandpa" - Story's), need: when he is "known" (a TownQuests flag or a ready place), replies: the
    // answer the raven brings back (a bubble over it and a popup)
    const LETTERS = [
        { key: "grandpa" },
        { key: "janek", flag: "janekMet" },
        { key: "przemytnik", flag: "rochMet" },
        { key: "pustelnik", flag: "pustelnikMet" },
        { key: "latarnik", ready: 159 },
        { key: "dzwonnik" },
        { key: "kowal" },
        { key: "piekarka" },
        { key: "znachorka" },
        { key: "soltys" }
    ];
    Watki.scal(LETTERS, "kruk", "listy");   // (its words: js/teksty/kruk.txt, listy)
    // the one the raven will not take (W10 stays open: over the sea, the red water)
    const MOTHER = { };
    Watki.scal(MOTHER, "kruk", "matka");   // (its words: js/teksty/kruk.txt, matka)

    // ------------------------------------------------------------------ the foreign letters (KONCEPCJA 4 "Błyskotka": 20%) - light
    // secrets: read (a note), give back to the owner (Opinion +1, he trusts the hero), or sell to Baltazar (G). Each once a game.
    const FOREIGN = [
        { id: "tadek", owner: "kowal", sell: 4 },
        { id: "wit", owner: "kapral", sell: 6 },
        { id: "baltazar", owner: "kupiec", sell: 0,
            backGold: 10 },
        { id: "zosia", owner: "zosia", sell: 1 },
        { id: "janek", owner: "janek", sell: 2 },
        { id: "jadwiga", owner: "znachorka", sell: 5 },
        { id: "ambrozy", owner: "dzwonnik", sell: 3 },
        { id: "soltys", owner: "soltys", sell: 5 }
    ];
    Watki.scal(FOREIGN, "kruk", "obce");   // (its words: js/teksty/kruk.txt, obce)
    // what lies on the perch some mornings (KONCEPCJA 4): coins 40%, a lost thing 30%, a foreign letter 20%, nothing 10%
    const TRINKET = {
        chance: { coins: 0.4, thing: 0.3, letter: 0.2 }, coins: [1, 5],
        things: [[ITEM.nails, 2], [ITEM.feathers, 2], [ITEM.rope, 1], [ITEM.iron, 1]],
        // (what the hero says of each thing, by its place in `things`: Kruk.js reads thingWords[i])
        thingWords: { }
    };
    Watki.scal(TRINKET, "kruk", "blyskotki");   // (its words: js/teksty/kruk.txt, blyskotki)

    // ------------------------------------------------------------------ the texts
    const TX = Watki.teksty("kruk");

    // ------------------------------------------------------------------ the remarks and the gossip (they go with the quests' pack)
    const REMARKS = [
        { id: "krukJanek", who: "janek", flag: "krukTame" },
        { id: "krukRoch", who: "przemytnik", flag: "krukTame" },
        { id: "krukKleofas", who: "pustelnik", flag: "krukTame" },
        { id: "krukAmbrozy", who: "dzwonnik", flag: "krukTame" },
        { id: "krukBaltazar", who: "kupiec", flag: "krukTame" }
    ];
    Watki.scal(REMARKS, "kruk", "uwagi");   // (its words: js/teksty/kruk.txt, uwagi)
    const GOSSIP = { przemytnik: [] };
    Watki.scal(GOSSIP, "kruk", "plotki");   // (its words: js/teksty/kruk.txt, plotki)

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md): the state
    // "kruk", the quests K51 "Kruk z masztu" and D24 "Oswojony kruk" (their words: js/teksty/kruk.txt, zadania.*; the engine puts them into
    // window.TownQuestsPacks with the remarks and the gossip), the talk of a foreign letter given back. The hooks (the places built,
    // the leg's words, the ring, the perch, the letter's return) are Kruk.js's
    const w = Watki.watek({
        id: "kruk", wtyczka: "Kruk", teksty: "kruk",
        stan: { klucz: "kruk", wersja: 1, domyslne: () => ({
            stage: "wild",          // wild | tame | gone (hungry: back at the Urwisko)
            name: "", feeds: [], scaredUntil: 0, tamedDay: 0,
            mode: "follow", food: 80, water: 80, clock: null, zeroSince: 0,
            away: null,             // { kind: "letter" | "scout", until, to, map, quest }
            letterDay: 0, scoutDay: 0, sent: {}, opinion: {},
            scout: null,            // { day, map } - the marks shown there till the day's end
            trinket: null, trinketDay: 0,
            held: {}, gone: {},     // the foreign letters: held[id] = { read }, gone[id] = "back" | "sold"
            k51: { leg: 0 }, stones: {}, camp: { cleared: {}, seen: 0, n: 0 }, visited: {}, baltAsked: 0, nightSaid: 0
        }) },
        zadania: {
            // K51: from Roch, once the Urwisko and the hermitage are built and the raven is still wild; the legs: Kruk.js (state k51.leg)
            K51: { kind: "K", giver: "przemytnik", icon: RING_ICON, offer: { cond: { day: 8, hours: [5, 13], flags: ["rochMet"], fn: "k51Ready" } },
                oferta: [{ hak: "miejsceGotowe", args: [MAP] }, { hak: "miejsceGotowe", args: [HERMITAGE] }, "stan:stage=wild"],
                kroki: [
                    { nazwa: "k51Mast", gotowe: { lub: ["stan:k51.leg>=1", "stan:stage!=wild"] } },
                    { nazwa: "k51Follow", gotowe: { lub: ["stan:k51.leg>=5", "stan:stage!=wild"] }, zmienne: { gdzie: { hak: "k51Gdzie" } } }
                ],
                reward: { xp: 40, flag: "urwiskoOdkryte" } },
            // D24 starts by itself after K51 (or once the raven was fed / tamed)
            D24: { kind: "D", giver: "grandpa", icon: RING_ICON, autoStart: "d24Start", start: { lub: ["zrobione:K51", "ile:feeds>0", "stan:stage=tame"] },
                kroki: [
                    { nazwa: "d24Feed", gotowe: { lub: ["stan:stage=tame", "ile:feeds>=" + RAVEN.feedNeed] }, zmienne: { n: { ile: "feeds", najwyzej: RAVEN.feedNeed } } },
                    // grandpa looks at the ring (not without it in the bag)
                    { nazwa: "d24Ring", type: "talk", to: "grandpa", haki: { blocked: "bezObraczki" },
                        reward: { } },
                    { nazwa: "d24Perch", gotowe: "grzedaStoi", zmienne: { imie: { hak: "imieKruka" } } }
                ],
                reward: { xp: 100 },
                lines: { } }
        },
        paczka: { remarks: REMARKS, gossip: GOSSIP },
        // a foreign letter the raven brought: the hero gives it back to its owner (ctx: nr - its place in FOREIGN, list - its id,
        // przeczytany - read by the hero)
        rozmowy: {
            oddaj: [{ mow: "listOddaj", kto: "bohater" },
                { jesli: "ctx:przeczytany", to: [{ mow: "obce.{nr}.backRead" }], inaczej: [{ mow: "obce.{nr}.back" }] },
                { zrob: "oddaj", args: [{ ctx: "list" }] }]
        },
        akcje: {
            oddaj: [{ hak: "oddajList", args: [{ arg: 0 }] }]
        }
    });
    const K51 = w.Q.K51, D24 = w.Q.D24;

    window.KrukData = { MAP, HARBOUR, HERMITAGE, FIELD, IDS: [610, 629], ITEM, RAVEN_ICON, RING_ICON, SHEET, RAVEN, LETTERS, MOTHER, FOREIGN, TRINKET, TX,
        K51, D24, REMARKS,
        // food: any meat (raw, roasted, smoked) and fish - the dog's list (FoodTable in Farming_Data.js)
        FOOD: window.FoodTable && FoodTable.tameMeats ? FoodTable.tameMeats() : [] };
})();
