//=============================================================================
// Poczta_Data.js
//=============================================================================
// The thread W20 "Kruczy listonosz" (docs/zadania_nowe/kruczy_listonosz.md, built 2026-11-11) - the DATA; the engine: Poczta.js, the words:
// js/teksty/poczta.txt. The raven post of the town: Master Gawron (the old ravenkeeper with the wooden leg) and his apprentice Wicek
// (15; the design called him Tymon, but Tymon is Tomek of W16 - another name), the town hall's clerk Cyryl Atrament (the traitor, friendly),
// the hooded man (an agent of the Black Eyes, scenes only). The Kruczarnia (Map214, the interior behind the tower's door on Map008).
//   - the letters: ~30 of them in five weeks (LISTY): the addressee (a TownLife key), the day of the week and the slot (the ravens come
//     home at 6:30 and 17:30), the window of the delivery, the fee and the opinion; the special ones (grandpa's, Grum's, Melia's, old
//     Gryta's, the one with no address, the opened ones)
//   - the residents (TownLife, window.TownLifeExtra, ids 2957-2959): gawron, wicek, cyryl
//   - the thread "poczta" (Watki.js): the state (Tawerna.state "poczta", v1), the quest W20 in five steps (the weeks), the talks of the
//     tavern's regulars (Grum, Melia: the letters of week 2), the F9 rows and chapter jumps
// Event ids 4400-4499 (Tawerna.inject, owner "Poczta"): 4400 the hooded actor, 4401 the grave of old Gryta (Map008), 4402 the stool
// the thief overturns (Map214), 4403-4409 spare.

/*:
 * @target MZ
 * @plugindesc [W20] Dane wątku „Kruczy listonosz”: listy, Gawron, Wicek, Cyryl, kruczarnia (mapa 214), rozdziały, rozmowy, F9. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Dezerter_Data
 *
 * @help
 * ============================================================================
 * Poczta_Data.js - dane wątku W20 „Kruczy listonosz”
 * ============================================================================
 * Same dane: silnik to Poczta.js, teksty js/teksty/poczta.txt. Musi stać nad
 * TownLife.js i TownQuests_Data.js. Zdarzenia 4400-4499 (Tawerna.inject).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Poczta_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    // (2026-11-16) the new world: the Kruczarnia stands on Krucza Grań (Map029, above the mine of Krucze Turnie); the town (the old
    // cemetery with Gryta's grave, the town hall, the tavern) is Kruczogród (Map220)
    const MAP = { miasto: 220, gran: 29, kruczarnia: 214, ratusz: 104, tawerna: 1 };
    const IDS = [4400, 4499], OWNER = "Poczta";
    const DRZWI = { id: 7, x: 15, y: 20, przed: [15, 21, 8] };       // "Drzwi: Kruczarnia" on Krucza Grań; the cell in front of it
    const POGON = [[20, 22], [30, 23], [40, 24], [40, 14], [40, 10]];  // the night thief's way from the door: along the path and into the mine's mouth
    const OD_DNIA = 12;                                              // the thread starts from this day (after K51 / D24)
    const GODZINY = [6, 20];                                         // Gawron receives from 6 to 20
    const PRZYLOT = [6.5, 17.5];                                     // the ravens come home: morning, evening
    const TORBA = 6;                                                 // letters carried at once
    const ZAUFANIE_PROG = 3;                                         // the third secretly read letter - Gawron's trust is gone
    const NOC = { czuwanie: [23, 3], wejscie: 3.1, pogon: 18 };       // the night watch (week 3), the thief at 3:10, the chase in seconds
    const FINAL = { godzina: 3, plata: 60, xp: 150, przychylnosc: 10 };
    const POCZTA_STALA = { cena: 5 };
    const XP = { start: 20, k1: 40, k2: 40, k3: 40, k4: 40, k5: 150 };
    const GRYTA = { grob: [9, 11, 6] };   // (2026-11-16: a grave of the town's cemetery on Map220; the old one below)
    //                             // the grave in the old cemetery (Map008): on the cross grave by the alley (2026-11-12: was (8,27), an invisible block in the alley the Order's place needs)
    const KAPTUR = { id: 4400, sheet: "$Npc_Kurier" };   // (the W5 hooded courier with the white eye brooch - the Black Eyes' look: no new art)
    const OPINIA = { wydal: 5, uciekl: -2 };

    // ------------------------------------------------------------------ the letters
    // id; ch (the week 1-5); d (the day of the week 1-7 the raven brings it); slot "r" (6:30) / "w" (17:30); to (TownLife key; "bohater" =
    // the hero's own; null - no addressee); okno [from, to] (the hours of the delivery; null - the whole day); oplata (G), opinia (0-1);
    // special: dziadek | grum | melia | gryta | bez | haczyk (the wax) | otwarty (comes unsealed) ; kruk: can be sent by the hero's raven;
    // wosk: the colour of the seal (for the clues)
    const LISTY = [
        { id: "l1_hanka", ch: 1, d: 1, slot: "r", to: "piekarka", okno: [6, 12], oplata: 3, opinia: 1 },
        { id: "l1_tadek", ch: 1, d: 2, slot: "r", to: "kowal", okno: [5.5, 17], oplata: 3, opinia: 1 },
        { id: "l1_ambrozy", ch: 1, d: 2, slot: "r", to: "dzwonnik", okno: [6, 20], oplata: 2, opinia: 1 },
        { id: "l1_wit", ch: 1, d: 2, slot: "w", to: "kapral", okno: [6, 23], oplata: 3, opinia: 0 },
        { id: "l1_soltys", ch: 1, d: 3, slot: "r", to: "soltys", okno: [8, 13], oplata: 3, opinia: 1 },
        { id: "l1_garbarz", ch: 1, d: 4, slot: "r", to: "garbarz", okno: [7, 18], oplata: 2, opinia: 0, special: "haczyk", wosk: "inny" },
        { id: "l1_dziadek", ch: 1, d: 5, slot: "w", to: "bohater", okno: null, oplata: 0, opinia: 0, special: "dziadek" },
        { id: "l2_grum", ch: 2, d: 1, slot: "w", to: "grum", okno: [19, 22], oplata: 4, opinia: 0, special: "grum" },
        { id: "l2_melia", ch: 2, d: 1, slot: "w", to: "melia", okno: [17, 21.5], oplata: 4, opinia: 0, special: "melia" },
        { id: "l2_hanka", ch: 2, d: 2, slot: "r", to: "piekarka", okno: [6, 12], oplata: 3, opinia: 1 },
        { id: "l2_gryta", ch: 2, d: 3, slot: "r", to: "wdowa", okno: null, oplata: 0, opinia: 0, special: "gryta" },
        { id: "l2_zosia", ch: 2, d: 4, slot: "r", to: "zosia", okno: [8.2, 18.5], oplata: 2, opinia: 1 },
        { id: "l2_kleofas", ch: 2, d: 5, slot: "r", to: "pustelnik", okno: [6, 20], oplata: 4, opinia: 1, kruk: true },
        { id: "l2_bez", ch: 2, d: 6, slot: "r", to: null, okno: null, oplata: 0, opinia: 0, special: "bez" },
        { id: "l3_baltazar", ch: 3, d: 1, slot: "r", to: "kupiec", okno: [8, 18], oplata: 3, opinia: 0, wosk: "zielony" },
        { id: "l3_soltys", ch: 3, d: 2, slot: "r", to: "soltys", okno: [8, 13], oplata: 3, opinia: 0, special: "otwarty", wosk: "czerwony" },
        { id: "l3_sambor", ch: 3, d: 3, slot: "r", to: "celnik", okno: null, oplata: 4, opinia: 0, kruk: true },
        { id: "l3_ozzy", ch: 3, d: 3, slot: "w", to: "ozzy", okno: [17, 22], oplata: 3, opinia: 0 },
        { id: "l3_praczka", ch: 3, d: 4, slot: "r", to: "praczka", okno: [5, 17], oplata: 3, opinia: 1 },
        { id: "l3_garbarz", ch: 3, d: 5, slot: "r", to: "garbarz", okno: [7, 18], oplata: 2, opinia: 0 },
        { id: "l4_zosia", ch: 4, d: 1, slot: "r", to: "zosia", okno: [8.2, 18.5], oplata: 3, opinia: 1 },
        { id: "l4_ela", ch: 4, d: 2, slot: "r", to: "ela", okno: [7, 19], oplata: 3, opinia: 1 },
        { id: "l4_ludmila", ch: 4, d: 2, slot: "r", to: "ludmila", okno: [7, 19], oplata: 3, opinia: 0 },
        { id: "l4_kleofas", ch: 4, d: 3, slot: "w", to: "pustelnik", okno: [6, 20], oplata: 4, opinia: 1, kruk: true },
        { id: "l5_belza", ch: 5, d: 1, slot: "r", to: "rotmistrz", okno: null, oplata: 4, opinia: 0, kruk: true },
        { id: "l5_dziadek", ch: 5, d: 6, slot: "w", to: "bohater", okno: null, oplata: 0, opinia: 0, special: "dziadek5" }
    ];
    // the three bait letters of week 4 (written at the table; carried to Wicek, Sambor and Cyryl as "a mistake in the bag")
    const PRZYNETY = [
        { id: "p_wicek", to: "wicek", miejsce: "studnia" },
        { id: "p_sambor", to: "celnik", miejsce: "krata" },
        { id: "p_cyryl", to: "cyryl", miejsce: "kruczarnia" }
    ];
    // the residents who must be asked about the letters in week 3 (the clues): key -> clue
    const SZLAKI = { wicek: "wicek", celnik: "sambor", kupiec: "baltazar", cyryl: "cyryl" };
    // the regulars of the tavern (their talks go through TownQuests: the letters are handed over in the steps' talks)
    const BYWALCY = ["grum", "melia", "ozzy"];

    // ------------------------------------------------------------------ the residents (TownLife, window.TownLifeExtra)
    // Gawron (6-20 in the Kruczarnia at his table; at night asleep in his cot); Wicek (copies letters: mornings in the Kruczarnia, evenings
    // on the market bench); Cyryl (8-16 at the town hall's desk, 16-18 in the Kruczarnia "tidying the official letters", the evening
    // at the market, the night at home - in the town hall). The Kruczarnia's door is "kruczarnia_drzwi" (the cell in front of it)
    const RESIDENTS = [
        { key: "gawron", id: 2957, map: MAP.gran, name: "", title: "", sheet: "$Npc_Gawron", speed: 2, plan: [[0, "inside", "kruczarnia_drzwi"]], barks: {}, talk: {} },
        { key: "wicek", id: 2958, map: MAP.gran, name: "", title: "", sheet: "$Npc_Wicek", speed: 3,   // (his evenings: the look-out of the ridge, not the market's bench)
            plan: [[0, "inside", "kruczarnia_drzwi"], [16, "wander", "widok_grani"], [19.5, "inside", "kruczarnia_drzwi"]], barks: {}, talk: {} },
        { key: "cyryl", id: 2959, map: MAP.miasto, name: "", title: "", sheet: "$Npc_Cyryl", speed: 3,   // (16-18 he is up in the Kruczarnia: out by the town's east gate)
            indoor: { kruczarnia_drzwi: "cyryl_w_kruczarni" },
            plan: [[0, "inside", "ratusz_drzwi"], [8, "inside", "ratusz_drzwi"], [16, "inside", "kruczarnia_drzwi"], [18, "wander", "rynek_rog"], [21, "inside", "ratusz_drzwi"]],
            barks: {}, talk: {} }
    ];
    for (const r of RESIDENTS) {
        for (const k of ["stand", "wander", "work", "rain", "home", "night", "patrol", "tavern"]) r.barks[k] = [];
        for (const k of ["morning", "day", "evening", "night", "rain"]) r.talk[k] = [];
    }
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);
    const TLD = window.TownLifeData;
    if (TLD && TLD.SPOTS) {   // (the cell in front of the Kruczarnia's door: where the residents go in and come out)
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        TLD.SPOTS_BY_MAP[MAP.gran] = Object.assign({ kruczarnia_drzwi: DRZWI.przed.slice(), widok_grani: [67, 41, 2] }, TLD.SPOTS_BY_MAP[MAP.gran] || {});
        TLD.SPOTS_BY_MAP[MAP.miasto] = Object.assign({ kruczarnia_drzwi: [74, 41, 6] }, TLD.SPOTS_BY_MAP[MAP.miasto] || {});   // (Cyryl's way up: the east gate)
        TLD.SPOTS_BY_MAP[MAP.kruczarnia] = Object.assign({ gawron_wnetrze: [5, 6, 2], wicek_wnetrze: [3, 5, 2], cyryl_w_kruczarni: [8, 6, 6] }, TLD.SPOTS_BY_MAP[MAP.kruczarnia] || {});
    }

    // ------------------------------------------------------------------ the talks of the steps
    // the regulars of the tavern (Grum, Melia - week 2; Ozzy - week 3): "Masz list." is a row of THEIR menu (the step's topic: TownQuests'
    // regularTopics), whatever other thread is talking to them; the letter is handed over at any hour (the window only tells late from on time).
    // The residents of the town get the same row from Poczta.js (Tawerna.talk takeover: "Masz list.", and in week 3 "Wypytaj o otwarte listy")
    const kluczJest = key => ({ hak: "kluczJest", args: [key] });
    const TEMAT_LISTU = (kto, ids) => ({ kto, etykieta: "dostawa.opcja", gdy: { hak: "maKtoList" },
        tresc: ids.map(([key, rozmowa]) => ({ gdy: kluczJest(key), rozmowa })) });
    const TEMAT_FRONT = TEMAT_LISTU(["grum", "melia"], [["grum", "grum"], ["melia", "melia"]]);
    const TEMAT_OZZY = TEMAT_LISTU("ozzy", [["ozzy", "ozzy"]]);

    // ------------------------------------------------------------------ the thread
    const w = Watki.watek({
        id: "poczta", wtyczka: "Poczta", teksty: "poczta",
        // version 1: start (the day Gawron took the hero in), oath (przysiega | postaram), taken {id: day} (in the bag at some time),
        // bag [ids], done {id: {day, hour, late, how}}, opened {id: 1} (read in secret), sealed {id: 1} (poured again), secrets (n),
        // trust (1 | 0: Gawron's), clue {wicek, sambor, baltazar, cyryl, rzecz}, rzecz (zielony | plama), noc (the day of the night watch scene),
        // gryta (grob | kleofas | sasiadka | odeslij), bez (the day the letter without an address was found), bezCzytany, baits (the day written),
        // nocy (the nights watched), s6 (the day), cyrylZnany, finale (wydaj | przestaw | uciekaj), epilog, wyslane {id: day} (by raven),
        // arrivals {"day:slot": 1} (the ravens came - the notice shown), poczta (the permanent post), s1 (the flyover seen), notes, sc {scene: day}
        stan: { klucz: "poczta", wersja: 1, domyslne: () => ({
            start: 0, oath: "", taken: {}, bag: [], done: {}, opened: {}, sealed: {}, secrets: 0, trust: 1, clue: {}, rzecz: "", noc: 0, gryta: "",
            bez: 0, bezCzytany: 0, baits: 0, nocy: 0, s6: 0, finale: "", epilog: 0, wyslane: {}, arrivals: {}, poczta: 0, sc: {}, wsent: 0, przynety: {} }) },
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 240, czekaj: true },
        zadania: {
            W20: { kind: "W", giver: null, icon: 0,
                start: ["otwarta", { lub: ["flaga:krukTame", "flaga:urwiskoOdkryte"] }],
                kroki: [
                    // 1 "Pierwsza torba": the first talk with Gawron, five easy letters, grandpa's letter on the fifth day
                    { nazwa: "w20Torba", ch: 1, gotowe: "k1Gotowe", zmienne: "k1Zmienne", nagroda: { xp: XP.k1 }, rozmowy: [] },
                    // 2 "Listy z frontu": Grum, Melia, Hanka; the letter to the dead; the one with no address
                    { nazwa: "w20Front", ch: 2, gotowe: "k2Gotowe", zmienne: "k2Zmienne", nagroda: { xp: XP.k2 }, temat: TEMAT_FRONT },
                    // 3 "Kto czyta?": three clues and the night in the Kruczarnia
                    { nazwa: "w20Kto", ch: 3, gotowe: "k3Gotowe", zmienne: "k3Zmienne", nagroda: { xp: XP.k3 }, temat: TEMAT_OZZY },
                    // 4 "Pułapka z listów": the three baits, the third night, Cyryl handing over the parcel
                    { nazwa: "w20Pulapka", ch: 4, gotowe: "k4Gotowe", zmienne: "k4Zmienne", nagroda: { xp: XP.k4 }, rozmowy: [] },
                    // 5 "Kruk niesie, nie czyta": the night confrontation, the choice, the epilogue
                    { nazwa: "w20Final", ch: 5, gotowe: "k5Gotowe", zmienne: "k5Zmienne", nagroda: { xp: XP.k5 }, rozmowy: [] }
                ],
                fail: {} }
        },
        paczka: { remarks: [] },
        rozmowy: {
            spotkanie: ["spotkanie.1", "spotkanie.2", { wybor: [
                { etykieta: "spotkanie.opcja.przysiegam", tresc: ["spotkanie.przysiegam", { zrob: "przysiega", args: ["przysiegam"] }] },
                { etykieta: "spotkanie.opcja.postaram", tresc: ["spotkanie.postaram", { zrob: "przysiega", args: ["postaram"] }] }
            ], anuluj: -1 }, "spotkanie.koniec"],
            grum: ["grum.list", { zrob: "doreczone", args: ["l2_grum"] }, "grum.kolejka"],
            melia: ["melia.list", { zrob: "doreczone", args: ["l2_melia"] }],
            ozzy: ["ozzy.list", { zrob: "doreczone", args: ["l3_ozzy"] }],
            ostatni: ["finaly.pytanie"],
            final: ["finaly.pytanie", { wybor: [
                { etykieta: "finaly.opcja.wydaj", tresc: ["finaly.wydaj", { zrob: "final", args: ["wydaj"] }] },
                { etykieta: "finaly.opcja.przestaw", tresc: ["finaly.przestaw", { zrob: "final", args: ["przestaw"] }] },
                { etykieta: "finaly.opcja.uciekaj", tresc: ["finaly.uciekaj", { zrob: "final", args: ["uciekaj"] }] }
            ], anuluj: -1 }]
        },
        akcje: {
            przysiega: [{ hak: "przysiega", args: [{ arg: 0 }] }],
            doreczone: [{ hak: "doreczLista", args: [{ arg: 0 }] }],
            final: [{ hak: "final", args: [{ arg: 0 }] }]
        },
        f9: { naglowek: "f9.naglowek", nazwy: "f9.rozdz", wiersze: [
            { co: "torba", etykieta: "f9.torba", opis: "f9.listy", ok: "f9Torba" },
            { co: "czas", etykieta: "f9.czas", opis: "f9.czas", ok: "f9Czas" },
            { co: "zdrajca", etykieta: "f9.zdrajca", opis: "f9.zdrajca", ok: "f9Zdrajca" }
        ] },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w20Torba", godzina: 6.8, idz: [MAP.kruczarnia, 5, 11, 8], zrob: [{ hak: "f9Tydzien", args: [1] }] },
                2: { ch: 2, krok: "w20Front", godzina: 17.8, idz: [MAP.kruczarnia, 5, 11, 8], zrob: [{ hak: "f9Tydzien", args: [2] }] },
                3: { ch: 3, krok: "w20Kto", godzina: 22.5, idz: [MAP.kruczarnia, 5, 11, 8], zrob: [{ hak: "f9Tydzien", args: [3] }] },
                4: { ch: 4, krok: "w20Pulapka", godzina: 8, idz: [MAP.kruczarnia, 5, 11, 8], zrob: [{ hak: "f9Tydzien", args: [4] }] },
                5: { ch: 5, krok: "w20Final", godzina: 2.5, idz: [MAP.kruczarnia, 5, 11, 8], zrob: [{ hak: "f9Tydzien", args: [5] }] }
            }
        }
    });
    // the regulars' talks of the steps are filled by Poczta.js (it knows the letters); the text keys of the F9 rows and the chapters
    window.PocztaData = { MAP, IDS, OWNER, DRZWI, POGON, OD_DNIA, GODZINY, PRZYLOT, TORBA, ZAUFANIE_PROG, NOC, FINAL, POCZTA_STALA, XP, GRYTA, KAPTUR, OPINIA,
        LISTY, PRZYNETY, SZLAKI, BYWALCY, RESIDENTS, TX: w.tx, W20: w.Q.W20, watek: w };
})();
