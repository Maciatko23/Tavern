//=============================================================================
// Majster_Data.js
//=============================================================================
// The thread W22 "Majstersztyk" (docs/zadania_nowe/majstersztyk.md, 2026-11-11) - the DATA; the engine: Majster.js, the words:
// js/teksty/majster.txt. The guild house (Cech, Map008 x87-93 y79-88, door event 194) gets its interior, Map215 "Cech"; the guild's
// elder Ostap Lemiesz takes the hero through four ranks - czeladnik, starszy czeladnik, podmistrz, majster - on REAL things made from
// the recipes (the forge, the tannery, the workbench); Ludwik Zareba, a journeyman armourer from the continent, comes on the ferry
// of day 19 wanting the same single title; the exam is on the market on a market day.
// Stands in the plugin list under Dezerter_Data and above TownLife (it adds its residents to TownLifeExtra and its range of ids to
// TownLifeData.EXTRA_RANGES before TownLife.js reads them).
// Event ids 4500-4509: the residents (TownLife's range 5: Ostap 4500, Ludwik 4501, Jas 4502); 4510-4599: the rest ("Majster": the
// night actors of Map215, the tribune's props on the market on the exam day).

/*:
 * @target MZ
 * @plugindesc [W22] Dane wątku „Majstersztyk”: Cech (Map215), Ostap, Ludwik, Jaś, rangi, sztuki próbne, egzamin na rynku, F9. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base TownLife_Data
 * @orderAfter Dezerter_Data
 *
 * @help
 * ============================================================================
 * Majster_Data.js - dane wątku W22 „Majstersztyk”
 * ============================================================================
 * Same dane: silnik to Majster.js, teksty js/teksty/majster.txt, mapa wnętrza
 * Cechu Map215 (tools/majstersztyk/build_cech.py). Musi stać pod TownLife_Data
 * i nad TownLife.js oraz TownQuests_Data.js. Numery zdarzeń 4500-4599.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Majster_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");
    const TLD = window.TownLifeData;
    if (!TLD) throw new Error("Majster_Data.js: brak TownLife_Data.js - musi stać wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    const MAP = { miasto: 8, cech: 215, tawerna: 1 };
    const OWNER = "Majster", IDS = [4510, 4599], RES_RANGE = [4500, 4509];
    const ID = { ostap: 4500, ludwik: 4501, jas: 4502, nocLudwik: 4510, nocOstap: 4511, trybuna: 4520 };   // (4520-4529: the tribune's props)
    // the door of Map008 (event 194; the cell in front of it - TownLife's spot "cech_przed" 91,88)
    const DRZWI = { id: 194, x: 91, y: 87, godziny: [8, 17], wchodzi: [MAP.cech, 7, 17, 8] };
    // the start: day >= 12, Opinion >= 20 (Bywalec), an iron thing made by the hero; the entry 20 G
    const START = { dzien: 12, opinia: 20, wpisowe: 20 };
    // the pieces (item ids of Bron_Data / the workbench): rank I (the three hands), rank II (the guard's set), rank III / IV by the trade
    const SZTUKI = {
        1: [[313, 1], [360, 1], [301, 1]],
        2: [[305, 1], [345, 1], [375, 1]],
        3: { kowal: [[353, 1], [379, 1]], garbarz: [[350, 1], [371, 1], [341, 1]], ciesla: [[126, 1], [154, 1], [127, 12]] },
        4: { kowal: [[357, 1]], garbarz: [[351, 1], [341, 1], [371, 1]], ciesla: [[126, 1], [375, 1], [312, 1], [127, 12]] }
    };
    // the smith's exam piece may be the iron mail (353) when the hero has no steel (docs: the steel before day 45 is not certain):
    // the grade is then at most "Dobry"
    const ALT_KOWAL = [[353, 1]];
    const TRZY = { kowal: "kowal", garbarz: "garbarz", ciesla: "ciesla" };   // (the master of the trade: TownLife's key)
    // the days: Ludwik's ferry (rank I and day >= 19), the order's term, the exam's market day (3 days after rank III), the retake
    const CZAS = { ludwik: 19, zamowienie: 6, zamowienieOd: 16, egzamin: 3, poprawka: 14, polkaRano: 7, egzGodziny: [12, 15], noc: [22, 24], spoznienie: 7 };
    const ZAPLATA = { r1: 30, r2: 120, r2Polowa: 60, r2Taniej: 90, r2Lepiej: 150, r3: 100, r4: 150, zwrotZelazo: 1, premiaRynek: 0 };
    const XP = { r1: 80, r2: 120, r3: 160, r4: 300 };
    const PRZYCHYLNOSC = { garnizon: 3 };
    const OPINIA = { r4: 8, demask: 5, razem: 8, ludwikWygral: -2 };
    // the guild board's weekly orders (after rank II; at most two a week): [item id, pay]
    const TABLICA = { tydzien: 2, pula: [[313, 60], [360, 50], [301, 70], [305, 90], [345, 80], [375, 45]] };
    // the final grades and the hero's score: grade x 2 + Opinion / 20 (+1 the trade's hint); Ludwik 3 (+1 while the sabotage was not exposed)
    const OCENA = { ludwik: 3, wskazowka: 1, opiniaDziel: 20, dwochOpinia: 60, dowodyMin: 2 };
    // the hammer of the master (an item added by the installer: the note <Majster:mlotek>): forge time -15%, tools last longer
    const MLOTEK = { notka: "mlotek", kuznia: 0.15, narzedzia: 0.15 };
    // the exam's tribune on the market (Map008): the props and where the commission and the crowd stand
    const TRYBUNA = {
        rekwizyty: [{ sheet: "!House_Town", index: 0, dir: 6, pat: 2, x: 58, y: 47, name: "Kowadło próbne" },
            { sheet: "!House_Town", index: 0, dir: 6, pat: 0, x: 62, y: 47, name: "Skóra na ramie (próba)" },
            { sheet: "!Town_Props", index: 2, dir: 6, pat: 1, x: 60, y: 45, name: "Stół komisji" },
            { sheet: "!House_Town", index: 2, dir: 2, pat: 1, x: 60, y: 44, name: "Chorągiew cechu" }],
        ludzie: { ostap: [60, 47, 2], kowal: [59, 46, 2], garbarz: [61, 46, 2], ciesla: [62, 46, 2], ludwik: [58, 48, 6], soltys: [64, 48, 4],
            piekarka: [57, 51, 8], woziwoda: [63, 51, 8], dzwonnik: [60, 52, 8] },
        godzinaStart: 11, hero: [60, 49, 8]
    };
    // the places the plans use (TownLife's SPOTS, only added: nothing here replaces a spot)
    const SPOTY = { ostap_dom: [91, 88, 2], jas_dom: [91, 88, 2], ludwik_dom: [68, 106, 2] };
    for (const [k, v] of Object.entries(SPOTY)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
    if (Array.isArray(TLD.EXTRA_RANGES)) { if (!TLD.EXTRA_RANGES.some(r => r[0] === RES_RANGE[0])) TLD.EXTRA_RANGES.push(RES_RANGE.slice()); }

    // ------------------------------------------------------------------ the residents (TownLife, window.TownLifeExtra)
    const RESIDENTS = [
        {
            // Ostap Lemiesz, about 65: grey beard, a stiff right hand, a cane; the guild's elder. 8-17 in the Cech (hall), 17-18:30 on the street
            // by its door, then home. On the exam day: on the market (a hold of Majster.js)
            key: "ostap", id: ID.ostap, sheet: "$Npc_Ostap", speed: 2,
            away: ["ostap_dom"],
            plan: [[0, "inside", "ostap_dom"], [8, "inside", "cech_przed"], [17, "wander", "cech_przed"], [18.5, "inside", "ostap_dom"]],
            barks: {}, talk: {}
        },
        {
            // Ludwik Zareba, about 28: the only one in shoes. From the day of his ferry: 6-18 in the Cech (the workshop), 18-21 sits alone on
            // the market bench, the night in "Izba do wynajecia". Only while the thread says he is on the island (condition majsterLudwik)
            key: "ludwik", id: ID.ludwik, sheet: "$Npc_Ludwik", speed: 3, when: "majsterLudwik",
            away: ["ludwik_dom"],
            plan: [[0, "inside", "ludwik_dom"], [6, "inside", "cech_przed"], [18, "wander", "rynek_lawka"], [21, "inside", "ludwik_dom"]],
            barks: {}, talk: {}
        },
        {
            // Jas, about 11, an apron too big: the guild's sweeper, 7-19 in the Cech
            key: "jas", id: ID.jas, sheet: "$Npc_Jas", speed: 3,
            away: ["jas_dom"],
            plan: [[0, "inside", "jas_dom"], [7, "inside", "cech_przed"], [19, "inside", "jas_dom"]],
            barks: {}, talk: {}
        }
    ];
    Watki.scal(RESIDENTS, "majster", "mieszkancy");   // (its words: js/teksty/majster.txt, mieszkancy.N)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md 2.3a)
    const defaults = () => ({
        poreka: "", wpisowe: 0, ranga: 0, fach: "", wsk: 0,
        polka: null,                                  // { etap: 1 | 3, dzien, godz } the pieces on the trial shelf (taken from the bag)
        zam: { wzieto: 0, termin: 0, dostarczono: 0, wynik: "", doOstapa: 0, spor: 0 },
        ludwik: { przyjazd: 0, odplynal: 0, zostal: 0 },
        sab: { stan: 0, dzien: 0, scena: 0, noc: 0, zwrot: 0 },     // stan: 0 none | 1 the piece cracked; noc: 0 not seen | 1 stopped | 2 the vial | 3 Ostap
        slady: { wegiel: 0, odcisk: 0, swiadek: 0 },
        egz: { dzien: 0, proby: 0, ocena: -1, dowody: 0, poprawka: 0, kufel: 0, ranga3: 0 },
        koniec: 0, mlotek: 0, tab: { tydz: -1, n: 0 }, scenyZrobione: {}
    });
    const w = Watki.watek({
        id: "majster", wtyczka: "Majster", teksty: "majster",
        stan: { klucz: "majster", wersja: 1, domyslne: defaults },
        mysli: { klatki: 220, odstep: 240, czekaj: true },
        mowa: { akapity: true },
        zadania: {
            W22: { kind: "W", giver: null, icon: 0,
                start: ["stan:poreka"],
                kroki: [
                    { nazwa: "w22Poreka", ch: 1, gotowe: "stan:wpisowe", zmienne: "krokZmienne" },
                    { nazwa: "w22Trzy", ch: 2, gotowe: "stan:ranga>=1", zmienne: "krokZmienne" },
                    { nazwa: "w22Zamowienia", ch: 3, gotowe: "stan:ranga>=2", zmienne: "krokZmienne" },
                    { nazwa: "w22Proba", ch: 4, gotowe: "stan:ranga>=3", zmienne: "krokZmienne" },
                    { nazwa: "w22Egzamin", ch: 5, gotowe: "stan:koniec>=1", zmienne: "krokZmienne" }
                ],
                fail: {} }
        },
        f9: { naglowek: "f9.naglowek", brak: "f9.brak", kolejnosc: 22, wiersze: [
            { co: "ranga", etykieta: "f9.ranga", opis: "f9.rangaOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "przyjazd", etykieta: "f9.przyjazd", opis: "f9.przyjazdOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "sabotaz", etykieta: "f9.sabotaz", opis: "f9.sabotazOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "egzamin", etykieta: "f9.egzamin", opis: "f9.egzaminOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "koniec", etykieta: "f9.koniec", opis: "f9.koniecOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "wyzeruj", etykieta: "f9.wyzeruj", opis: "f9.wyzerujOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" }
        ] }
    });

    window.MajsterData = { MAP, OWNER, IDS, RES_RANGE, ID, DRZWI, START, SZTUKI, ALT_KOWAL, TRZY, CZAS, ZAPLATA, XP, PRZYCHYLNOSC, OPINIA, TABLICA, OCENA, MLOTEK,
        TRYBUNA, SPOTY, RESIDENTS, defaults, TX: w.tx, W22: w.Q.W22, watek: w };
})();
