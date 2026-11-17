//=============================================================================
// Goraczka_Data.js
//=============================================================================
// The thread W21 "Gorączka w przytułku" (docs/zadania_nowe/goraczka.md, built 2026-11-12) - the DATA; the engine: Goraczka.js, the words:
// js/teksty/goraczka.txt. After the second wave of refugees and the vote in the town hall a fever starts in the camp and the poorhouse.
// Sister Stefa cannot keep up, the town shuts the street and sends a night patrol, the hero runs for herbs, carries his own rainwater and
// finds out that only those who drink from the barrels of the Eastern Cistern fall ill: the lime and the alum of the new tannery's vats
// (Wawrzyn Płowy, a refugee tanner) seep from the old mason's ditch into it. Ignac, whose vat everybody knows, is the first suspect (he is
// innocent). The end: punish Wawrzyn, help him move his vats, or say nothing.
//   - the sick (6): Szymek, Staś, old Gaweł (from day 0), Mila, Rufin, Berta (from day 1); they lie in the beds of the poorhouse: the NEW
//     "Przytułek" (Map216, the building on Map008 at x93-99 y96-104, door 435) when the camp is inside the wall (campInside), the old
//     poorhouse of Podgrodzie (Map202) when the camp is outside (campOutside)
//   - the residents (TownLife, window.TownLifeExtra, id 4600): Wawrzyn Płowy (the Garbarnia, door 437 of Map008); while the camp is inside the wall Stefa
//     (opiekunka of Podgrodzie) is sent away (setGone) and stands in the town as two actors of the engine: by the cauldron before the poorhouse by day (4623),
//     in its hall at night (4624)
//   - the thread "goraczka" (Watki.js): the state (Tawerna.state "goraczka", v1), the quest W21 in five steps, the F9 rows and chapter jumps
// Event ids: 4600 the resident Wawrzyn (TownLife's range of its own); 4610-4699 Tawerna.inject, owner "Goraczka": 4610-4615 the sick (the
// hospital map), 4620-4621 the carts of the barrier, 4622 the cauldron before the poorhouse, 4630-4632 the white crust in the gutter,
// 4633 the ditch's slab, 4623/4624 Stefa in the town / in the hall (the camp inside), 4650-4659 spare.

/*:
 * @target MZ
 * @plugindesc [W21] Dane wątku „Gorączka w przytułku”: chorzy, Wawrzyn, Stefa w mieście, rozdziały, rozmowy, F9. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Majster_Data
 *
 * @help
 * ============================================================================
 * Goraczka_Data.js - dane wątku W21 „Gorączka w przytułku”
 * ============================================================================
 * Same dane: silnik to Goraczka.js, teksty js/teksty/goraczka.txt. Musi stać nad
 * TownLife.js i TownQuests_Data.js. Zdarzenia 4600 (mieszkaniec) i 4610-4699.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Goraczka_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    // (2026-11-16) the new world: the whole thread plays in Podgrodzie (Map218) - the shelter (its inside: Map202), the tannery, the dry
    // riverbed, the square by the dry well. "miasto" = the map of its scenes; the town's people come down as the scenes' guests (GOSCIE).
    const MAP = { miasto: 218, przytulek: 202, podgrodzie: 202, podgrodzieMiasto: 218 };
    const GOSCIE = { wejscie: [78, 38, 4], ids: [4640, 4649] };   // where the town's people walk in from (the road to Kruczogród) and their stand-in events
    const IDS = [4610, 4699], OWNER = "Goraczka", RES_RANGE = [4600, 4609];
    const OD_DNIA = 30;                                            // the thread starts from this day (and after the vote on the camp)
    const DRZWI = { przytulek: 435, garbarnia: 437, beczka: 368 };   // the events of Map008 the patch hooks: the doors and the barrel cart
    // the poorhouse's beds (tiles of Map202 / Map216: three cells tall, the head at y 3): the sick lie there; the event sits on the bottom cell
    const LOZKA = { szymek: [2, 5], stas: [3, 5], gawel: [4, 5], mila: [13, 5], rufin: [14, 5], berta: [15, 5] };
    const CHORZY = ["szymek", "stas", "gawel", "mila", "rufin", "berta"];
    const OD_POCZATKU = ["szymek", "stas", "gawel"];                // the first three; the other three fall ill on day 1
    const CZAS = { start: 8, zapora: 18.5, godzinaPolicyjna: 20, wywarDo: 20, zebranie: 15, zebranieDo: 17, s3: 17, s3Do: 20, osadnik: 2, wyniszczenie: 4, zebranieKiedy: 5 };
    const WODA = 2;                                                // charges of the hero's waterskin (his rainwater) in the first brew
    const WYWAR = 110, OPATRUNEK = 152, LOPATA = 62, MIOD = 76;      // items of the base
    const ZIOLA = { dziurawiec: 191, kozlek: 192 };
    const ZBIORKA = { jadwiga: { dziurawiec: 3, kozlek: 2 }, kleofas: { opatrunek: 3 } };   // babka Jadwiga: herbs; brother Kleofas: dressings; Hanka: the oven's boiling water (a visit)
    const BUDOWA = { deski: [80, 12], kamien: [64, 8], gwozdzie: [88, 6], lina: [93, 2] };   // the settling basin (choice B)
    const NAGRODY = {
        r1: { zloto: 10, xp: 40 }, r2: { zloto: 20, xp: 50, opinia: 2 }, r3: { xp: 50, opinia: 2, rabatIgnac: 1 }, r4: { xp: 60 },
        A: { zloto: 20, opinia: 4, przychylnosc: -3, xp: 40 }, B: { zloto: 40, opinia: 6, przychylnosc: 2, xp: 100 },
        C: { opinia: -5, xp: 0 }, strata: { opinia: -2 }
    };
    // the places (Map008) of the scenes and the clues; the ditch's gutter in front of the Cistern (the round stone building at x108-112)
    const MIEJSCA = {
        zapora: [[47, 54], [47, 56]],              // the two carts across the lane east of the shelter (the gap between them stays open)
        s1Soltys: [49, 55, 4], s1Wit: [48, 54, 4], // where the reeve and the corporal stand as the lane is shut
        s1Skad: [58, 55, 4],                       // ...and where they come from (just out of sight up the lane)
        kociol: [44, 54],                          // the shelter's own cauldron stands on the map ("Kocioł z zupą", 44,53): ours is only the cell before it
        kociolNaMapie: true,
        stefa: [46, 54, 4], stefaWewnatrz: [10, 8, 8],                  // Stefa by the cauldron by day / in the hall at night
        przytulekPrzed: [41, 54],
        s2Kleofas: [42, 55, 8],                    // brother Kleofas before the shelter the morning after Gaweł's death
        osad: [[47, 62], [43, 62], [36, 62]],      // the white crust on the stones of the dry riverbed: from the tannery's side down to the water hole
        dol: [35, 63], beczka: [33, 63],           // the hole in the riverbed where water gathers; Kuba's cart with the barrel beside it
        plyta: [66, 63],                           // the ditch's slab behind the Garbarnia
        garbarniaPrzed: [69, 70],
        garbarniaIgnaca: [67, 70],                 // Ignac's tannery (the crowd's place)
        ratuszPrzed: [47, 41],                     // (the meeting: on Podgrodzie's square by the dry well - "what the water did to us")
        s1Kamera: [46, 55]
    };
    const SPOTS_DODANE = { garbarnia_wsch: [70, 70, 2], zebranie_hero: [47, 41, 2] };
    // the crowd of S3 (hold places by Ignac's tannery) and of S4 (the half circle before the town hall)
    const TLUM_S3 = { soltys: [66, 71, 6], woziwoda: [65, 72, 6], piekarka: [67, 72, 8], kowal: [68, 72, 4] };
    const TLUM_S4 = { soltys: [47, 42, 8], woziwoda: [45, 42, 6], piekarka: [49, 42, 4], kowal: [45, 44, 6], dzwonnik: [49, 44, 4], kapral: [44, 43, 6], ludmila: [50, 43, 4], ela: [51, 44, 4], garbarz: [46, 44, 8] };
    const WAWRZYN_S4 = [47, 44, 8];
    const LISTA_PYTAN = ["woziwoda", "piekarka", "kowal"];         // the three to ask in chapter 3 (Kuba first)
    const OPINIA_PRZEPUSTKA = 20;
    const SPRITES = { chory: "!$Chory_", przykryty: "!$Chory_przykryty", puste: "", woz: ["!House_Town", 0, 4, 1], kociol: ["!Decoration", 2, 6, 0],
        osad: "!$Osad_Rynny", plyta: "!$Plyta_Rowu", kleofas: "$Npc_Pustelnik", wawrzyn: "$Npc_Wawrzyn", kapral: "$Npc_Kapral" };

    // ------------------------------------------------------------------ the residents (TownLife, window.TownLifeExtra)
    // Wawrzyn Płowy: from the first day of the thread. campInside: sleeps in the camp's tents (pod_murem) and goes to the Garbarnia 6:30-19
    // (12-13 a meal in the camp); campOutside: away at night (beyond the east gate - the pass from Wit), the same day at the vats.
    // Stefa: see the engine (while the camp is inside she is sent away from Podgrodzie and stands in the town as an actor).
    const RESIDENTS = [
        { key: "wawrzyn", id: 4600, map: MAP.miasto, name: "", title: "", sheet: SPRITES.wawrzyn, speed: 3, when: "gorWawrzyn", away: ["brama_wsch"],
            plan: [[0, "inside", "pod_murem", "!campOutside"], [0, "inside", "brama_wsch", "campOutside"],
                   [6.5, "work", "garbarnia_wsch"], [12, "inside", "pod_murem", "!campOutside"], [12, "wander", "garbarnia_wsch", "campOutside"],
                   [13, "work", "garbarnia_wsch"], [19, "inside", "pod_murem", "!campOutside"], [19, "inside", "brama_wsch", "campOutside"]],
            barks: {}, talk: {} }
    ];
    for (const r of RESIDENTS) {
        for (const k of ["stand", "wander", "work", "rain", "home", "night", "patrol", "tavern"]) r.barks[k] = [];
        for (const k of ["morning", "day", "evening", "night", "rain"]) r.talk[k] = [];
    }
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);
    const TLD = window.TownLifeData;
    if (TLD) {
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        TLD.SPOTS_BY_MAP[MAP.miasto] = Object.assign({}, SPOTS_DODANE, TLD.SPOTS_BY_MAP[MAP.miasto] || {});
        if (Array.isArray(TLD.EXTRA_RANGES) && !TLD.EXTRA_RANGES.some(r => r[0] === RES_RANGE[0])) TLD.EXTRA_RANGES.push(RES_RANGE.slice());
    }

    // ------------------------------------------------------------------ the thread
    const domyslne = () => ({
        start: 0, camp: "", met: 0, brew: 0, pass: 0, sick: {}, dose: {}, zb: {}, gawelDead: 0, lista: {}, zapach: 0, s3: "", dowod: {},
        osadN: {}, wawrzyn: "", wawrzynDzien: 0, zebranie: 0, koniec: "", koniecDzien: 0, osadnik: 0, osadnikDzien: 0, osadnikGotowy: 0, saved: 0, sc: {}, ill: 0, notes: {}, ign: 0 });
    const w = Watki.watek({
        id: "goraczka", wtyczka: "Goraczka", teksty: "goraczka",
        // version 1: start (the day), camp (inside | outside), met (Stefa's first talk), brew (the day of the first brew), pass (the quarantine pass),
        // sick {key: "" | c (sick) | u (relief) | z (well) | x (dead)}, dose {key: how}, zb {jadwiga, kleofas, hanka: 1}, served (beds served in
        // chapter 2), gawelDead (the day), lista {key: 1}, zapach (1), s3 (stoj | sprawdz | nic), dowod {osad: n, plyta, sloik}, osadN (points seen),
        // wawrzyn (spokojnie | przycisnal | ignac), zebranie (the day set), koniec (A | B | C), osadnik {day, done}, saved (the count),
        // sc {scene: day}, ill (the day the hero fell ill), notes {k: 1}
        stan: { klucz: "goraczka", wersja: 1, domyslne },
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 240, czekaj: true },
        zadania: {
            W21: { kind: "W", giver: null, icon: 0,
                start: ["otwarta"],
                kroki: [
                    // 1 "Pierwsi chorzy": Stefa's three, the first brew with the hero's rainwater, the closed street (S1)
                    { nazwa: "w21Chorzy", ch: 1, gotowe: "k1Gotowe", zmienne: "k1Zmienne", nagroda: { xp: NAGRODY.r1.xp }, rozmowy: [] },
                    // 2 "Zioła i dzwon": two of three collections, three beds served, Gaweł
                    { nazwa: "w21Ziola", ch: 2, gotowe: "k2Gotowe", zmienne: "k2Zmienne", nagroda: { xp: NAGRODY.r2.xp }, rozmowy: [] },
                    // 3 "Kto pije, ten choruje": three questions, the barrel, Ignac before the crowd (S3)
                    { nazwa: "w21Kto", ch: 3, gotowe: "k3Gotowe", zmienne: "k3Zmienne", nagroda: { xp: NAGRODY.r3.xp }, rozmowy: [] },
                    // 4 "Rów": the crust in the gutter, the slab, Wawrzyn
                    { nazwa: "w21Row", ch: 4, gotowe: "k4Gotowe", zmienne: "k4Zmienne", nagroda: { xp: NAGRODY.r4.xp }, rozmowy: [] },
                    // 5 "Sąd i wybór": the meeting (S4), the choice, the morning after (S5)
                    { nazwa: "w21Sad", ch: 5, gotowe: "k5Gotowe", zmienne: "k5Zmienne", nagroda: { xp: 0 }, rozmowy: [] }
                ],
                fail: {} }
        },
        paczka: { remarks: [] },
        rozmowy: {
            stefa: ["stefa.intro1", "stefa.intro2"],
            wawrzynSpokojnie: ["wawrzyn.spokojnie", { zrob: "wawrzyn", args: ["spokojnie"] }],
            wawrzynPrzycisnij: ["wawrzyn.przyciskasz", { zrob: "wawrzyn", args: ["przycisnal"] }],
            wawrzynIgnac: ["wawrzyn.ignac", { zrob: "wawrzyn", args: ["ignac"] }]
        },
        akcje: {
            wawrzyn: [{ hak: "wawrzynPodejscie", args: [{ arg: 0 }] }]
        },
        f9: { naglowek: "f9.naglowek", nazwy: "f9.rozdz", wiersze: [
            { co: "dzien", etykieta: "f9.dzien", opis: "f9.dzienOpis", ok: "f9Dzien" },
            { co: "chorzy", etykieta: "f9.chorzy", opis: "f9.chorzyOpis", ok: "f9Chorzy" },
            { co: "A", etykieta: "f9.wynikA", opis: "f9.wynikOpis", ok: "f9WynikA" },
            { co: "B", etykieta: "f9.wynikB", opis: "f9.wynikOpis", ok: "f9WynikB" },
            { co: "C", etykieta: "f9.wynikC", opis: "f9.wynikOpis", ok: "f9WynikC" },
            { co: "zeruj", etykieta: "f9.zeruj", opis: "f9.zerujOpis", ok: "f9Zeruj" }
        ] },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w21Chorzy", godzina: 8.5, idz: [MAP.miasto, 41, 54, 8], zrob: [{ hak: "f9Rozdzial", args: [1] }] },
                2: { ch: 2, krok: "w21Ziola", godzina: 8.5, idz: [MAP.miasto, 41, 54, 8], zrob: [{ hak: "f9Rozdzial", args: [2] }] },
                3: { ch: 3, krok: "w21Kto", godzina: 8.5, idz: [MAP.miasto, 41, 54, 8], zrob: [{ hak: "f9Rozdzial", args: [3] }] },
                4: { ch: 4, krok: "w21Row", godzina: 8.5, idz: [MAP.miasto, 30, 61, 2], zrob: [{ hak: "f9Rozdzial", args: [4] }] },
                5: { ch: 5, krok: "w21Sad", godzina: 14.5, idz: [MAP.miasto, 47, 43, 8], zrob: [{ hak: "f9Rozdzial", args: [5] }] }
            }
        }
    });
    window.GoraczkaData = { domyslne, MAP, GOSCIE, IDS, OWNER, RES_RANGE, OD_DNIA, DRZWI, LOZKA, CHORZY, OD_POCZATKU, CZAS, WODA, WYWAR, OPATRUNEK, LOPATA, MIOD, ZIOLA, ZBIORKA, BUDOWA,
        NAGRODY, MIEJSCA, TLUM_S3, TLUM_S4, WAWRZYN_S4, LISTA_PYTAN, OPINIA_PRZEPUSTKA, SPRITES, RESIDENTS, TX: w.tx, W21: w.Q.W21, watek: w };
})();
