//=============================================================================
// Mlyn_Data.js
//=============================================================================
// The thread W19 "Sygnały z młyna" (docs/zadania_nowe/sygnaly_z_mlyna.md, 2026-11-11) - the DATA; the engine: Mlyn.js, the words:
// js/teksty/mlyn.txt, the interior: Map217 "Młyn" (tools/sygnaly/build_mlyn.py). Walenty Mączka (the miller) and his helper Jasiek Worek
// are residents of the town (TownLife); the smugglers use the sails of the windmill (Map008, event "Skrzydła wiatraka") as a semaphore:
// four poses = four words, two poses one after the other at 19:30 and 20:15 = a message; the hero reads the code, sets a FALSE signal
// from the axle chamber and in the night answers the boat with a lantern in the cove of Przystań (Map125).
// Stands in the plugin list under Dezerter_Data / Majster_Data and above TownLife (it adds its residents to TownLifeExtra and its
// range of ids to TownLifeData.EXTRA_RANGES before TownLife.js reads them).
// Event ids 2960-2969: the residents (TownLife's range: Walenty 2960, Jasiek 2961); 2970-2999: the rest ("Mlyn": the lookout on Map008,
// the cove's boat and people on Map125, the page of the book on Map119).

/*:
 * @target MZ
 * @plugindesc [W19] Dane wątku „Sygnały z młyna”: Walenty i Jasiek (TownLife), cztery pozy skrzydeł, kod, wnętrze młyna (Map217), noc w zatoczce, F9. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base TownLife_Data
 * @orderAfter Majster_Data
 *
 * @help
 * ============================================================================
 * Mlyn_Data.js - dane wątku W19 „Sygnały z młyna”
 * ============================================================================
 * Same dane: silnik to Mlyn.js, teksty js/teksty/mlyn.txt, wnętrze młyna
 * Map217 (tools/sygnaly/build_mlyn.py). Musi stać pod TownLife_Data i nad
 * TownLife.js oraz TownQuests_Data.js. Numery zdarzeń 2960-2999.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Mlyn_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");
    const TLD = window.TownLifeData;
    if (!TLD) throw new Error("Mlyn_Data.js: brak TownLife_Data.js - musi stać wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    // (2026-11-15, nowy świat) "miasto" = the map of the windmill: Podgrodzie (Map218, the tower on the west rise); "przystan" = the
    // shore of the night boat: Słony Brzeg (Map219, the south beach by the cave)
    const MAP = { miasto: 218, mlyn: 217, przystan: 219, archiwum: 119, tawerna: 1 };
    const OWNER = "Mlyn", IDS = [2970, 2999], RES_RANGE = [2960, 2969];
    const ID = { mlynarz: 2960, pomocnik: 2961, lasica: 2970, lasicaSwiatlo: 2971, morze: 2972, lodz: 2973, worki: 2974, szyper: 2975, marynarz1: 2976, marynarz2: 2977,
        sojusznik1: 2978, sojusznik2: 2979, sojusznik3: 2980, pochodnia1: 2981, pochodnia2: 2982, latarniaWalentego: 2983, ksiega: 2985 };
    // the windmill of Map008: the events are found by NAME (the user edits the map); the door's cell and the spots
    const WIATRAK = { drzwi: [7, 34], przed: [7, 35], skrzydla: "Skrzydła wiatraka", drzwiNazwa: "Drzwi: Wiatrak", wchodzi: [217, 7, 15, 8], zasieg: 15 };
    // the sails: pose -> [sheet, direction] (frame f of the 12: sheet f/4, row f%4 = down, left, right, up; pattern 1 always)
    const POZY = { A: ["!$Wiatrak_Skrzydla_3", 4], B: ["!$Wiatrak_Skrzydla", 8], C: ["!$Wiatrak_Skrzydla", 2], D: ["!$Wiatrak_Skrzydla_2", 6] };
    const POZA_KLATKA = { A: 9, B: 3, C: 0, D: 6 };           // (the angles 22.5 + 7.5 f: for the turn between two poses by the shorter way)
    // the code: the smugglers' evenings by day % 4 (two poses: 19:30 and 20:15; held to 05:00), a night's boat needs [B, C] and a high tide
    const KOD = { harmonogram: [["B", "C"], ["A", "A"], ["B", "D"], ["B", "C"]], p1: 19.5, p2: 20.25, koniec: 5, zasieg: 14, ile: 3, ileGdyWyrwana: 4,
        slowa: { A: "cisza", B: "towar", C: "zatoczka", D: "pochylnia" }, wzorB_C: ["K", "D", "K"] };
    // the start: day >= 24 (the README of the new lines), the evening at the mill or in the tavern
    const START = { dzien: 24, godziny: [17, 22.5], mapy: [218, 1], opinia: 20, zaklopot: 15, odprawa: 20, roch: 10, ozzy: 8 };
    const CZAS = { scenaOd: 22, scenaDo: 24, wnetrzeOd: 22, wnetrzeDo: 5, drzwiOd: 5.5, drzwiDo: 17.5, lasicaOd: 20.5, lasicaDo: 24.5,
        dziennik: 17, drugaPoza: 0.25, ustawOd: 19.5, ustawDo: 21, proby: 3, nocOd: 23.5, nocDo: 4, pytanie: 1.5, przybija: 2, zasadzka: 2.17, sekundy: 8 };
    const POGODA = { przyplyw: 0.6, dniPrzod: 3 };
    const ROCH = { ile: 10 };
    // the lookout (Lasica) stands in the drying yard behind the smithy on the north-east of the town (Map008): the windmill is 15 tiles west of it
    const LASICA = { x: 22, y: 36, d: 4, podsluch: [19, 36], promien: 5, ostrzez: 3 };
    // the cove of Przystan (Map125): the hero's cell, the boat's start and dock, where the men step off, where the ambush stands
    const ZATOCZKA = { hero: [36, 58, 4], lodzStart: [14, 58], lodzDok: [24, 58], brzeg: [32, 58], szyper: [33, 58], marynarze: [[32, 59], [33, 59]], worki: [34, 59],
        swiatlo: [19, 58], pole: 3, sojusz: [[39, 57], [39, 58], [39, 59]], pochodnie: [[37, 56], [37, 60]] };
    const NAGRODY = { sambor: { zloto: 60, opinia: 6, xp: 150 }, sam: { zloto: 25, opinia: 6, xp: 150, roch: 10 }, targ: { zloto: 90, opinia: -4, xp: 60 },
        walenty: { zloto: 40, worki: 2 }, odprawa: 20 };
    // the places the plans use (TownLife's SPOTS, only added; "wiatrak_przed" is already there)
    // (on Map218: defaults of TownLife's SPOTS_BY_MAP - a "Miejsce:" event of the map wins; "tawerna" = out by the east gate to Kruczogród)
    // (2026-11-18: Jasiek works on the other side of the windmill - he and Walenty stood on one cell, wiatrak_bok)
    const SPOTY = { wiatrak_bok: [5, 36, 2], wiatrak_bok2: [9, 36, 2], wiatrak_woda: [10, 37, 2], mlyn_dom: [7, 35, 2], tawerna: [79, 38, 6] };
    if (TLD.SPOTS_BY_MAP) { const B = (TLD.SPOTS_BY_MAP[MAP.miasto] = TLD.SPOTS_BY_MAP[MAP.miasto] || {}); for (const [k, v] of Object.entries(SPOTY)) if (!B[k]) B[k] = v; }
    // Walenty's seat in the tavern (19-22): a place given in the data (Map001 stays as the user made it; TownLife's SPOTS_BY_MAP)
    const MIEJSCE_TAWERNA = [9, 22, 4];
    if (TLD.SPOTS_BY_MAP) { (TLD.SPOTS_BY_MAP[1] = TLD.SPOTS_BY_MAP[1] || {}); if (!TLD.SPOTS_BY_MAP[1].gosc_walenty) TLD.SPOTS_BY_MAP[1].gosc_walenty = MIEJSCE_TAWERNA; }
    if (Array.isArray(TLD.EXTRA_RANGES)) { if (!TLD.EXTRA_RANGES.some(r => r[0] === RES_RANGE[0])) TLD.EXTRA_RANGES.push(RES_RANGE.slice()); }

    // (nowy świat) the smugglers taken and Ambroży gone: Walenty mills again - he works at the mill's door, not beside it
    const walentyWraca = () => { const M = window.Mlyn; let s = null; try { s = M && M.stan ? M.stan() : null; } catch (e) { s = null; } return !!s && (s.koniec === 1 || s.koniec === 2); };
    // ------------------------------------------------------------------ the residents (TownLife, window.TownLifeExtra)
    const RESIDENTS = [
        {
            // Walenty Maczka, about 50: a round figure, a floury smock, grey strands in the hair. 5:30-17:30 by the windmill, 17:30-19 inside,
            // 19-22 in the tavern, then back to the mill (22-22:30) and asleep behind it. While the thread asks (Mlyn.js) he waits by the mill at night
            key: "mlynarz", id: ID.mlynarz, sheet: "$Npc_Walenty", speed: 2, map: MAP.miasto, indoor: { tawerna: "gosc_walenty" },
            // (nowy świat: the old miller - the mill is Ambroży's now; Walenty still spends his days beside it, watching)
            plan: [[0, "inside", "wiatrak_przed"], [5.5, "work", "wiatrak_bok"], [5.5, "work", "wiatrak_przed", () => walentyWraca()], [17.5, "inside", "wiatrak_przed"], [19, "inside", "tawerna"], [22, "wander", "wiatrak_przed"], [22.5, "inside", "wiatrak_przed"]],
            barks: {}, talk: {}
        },
        {
            // Jasiek Worek, 16: a thin boy in a shirt too big for him. 6-17 at the mill, 18:30-20:30 "goes for water" (really sets the sails), the night over the stable
            key: "pomocnik", id: ID.pomocnik, sheet: "$Npc_Jasiek", speed: 3, map: MAP.miasto, when: "mlynJasiek",
            plan: [[0, "inside", "wiatrak_przed"], [6, "work", "wiatrak_bok2"], [17, "inside", "wiatrak_przed"], [18.5, "wander", "wiatrak_woda"], [20.5, "inside", "wiatrak_przed"]],
            barks: {}, talk: {}
        }
    ];
    Watki.scal(RESIDENTS, "mlyn", "mieszkancy");   // (its words: js/teksty/mlyn.txt, mieszkancy.N)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md 2.3a)
    const defaults = () => ({
        start: 0, zgoda: 0, klucz: 0,
        cz1: { scena: 0, wnetrze: 0 },
        obs: { dni: [], p1: "", p2: "", dzienP: 0, rano: [] },        // dni: the evenings watched (day numbers); rano: [day, came] the morning notes still to write
        kod: { A: 0, B: 0, C: 0, D: 0, gotowe: 0, wzor: 0 },
        ksiega: 0, wyrwana: 0, roch: 0, amb: 0,
        ch2: { podsluch: 0, ostrzezony: 0, walka: 0, proba: 0, dzien: 0 },
        ch4: { walenty: 0, jasiek: "", soj: "", ozzy: 0, noc: 0, proby: 0, set: 0, poza: [], plotka: 0, pierwsza: "", pierwszaGodz: 0, kluczeWymienione: 0 },
        ch5: { stan: 0, dzien: 0, szanse: 0, bledy: 0, wynik: "", walka: 0, jaskinia: 0 },
        koniec: 0, wyjscie: "", mlynZdrada: 0, nagrody: 0, epilog: 0, sceny: {}
    });
    const w = Watki.watek({
        id: "mlyn", wtyczka: "Mlyn", teksty: "mlyn",
        stan: { klucz: "mlyn", wersja: 1, domyslne: defaults },
        mysli: { klatki: 220, odstep: 240, czekaj: true },
        mowa: { akapity: true },
        akcje: { ozzyPiwo: [{ hak: "ozzyPiwo" }] },
        zadania: {
            W19: { kind: "W", giver: null, icon: 0,
                start: ["w19Start"],
                kroki: [
                    { nazwa: "w19Skrzydla", ch: 1, gotowe: "stan:cz1.scena", zmienne: "krokZmienne" },
                    { nazwa: "w19Swiatla", ch: 2, gotowe: "stan:ch2.podsluch", zmienne: "krokZmienne" },
                    { nazwa: "w19Ksiega", ch: 3, gotowe: "stan:kod.gotowe", zmienne: "krokZmienne" },
                    { nazwa: "w19Falsz", ch: 4, gotowe: "stan:ch4.set", zmienne: "krokZmienne",
                        // Ozzy (the tavern's regular: his talk is the quests' first): the forecast of the night for a beer
                        rozmowy: [{ kto: "ozzy", gdy: "ozzyGdy", gotowa: false, tresc: ["ozzy.piwo", { wybor: [
                            { etykieta: "ozzy.opcja", tresc: [{ jesli: "ozzyBrak", to: ["ozzy.brak"], inaczej: [{ zrob: "ozzyPiwo" },
                                { jesli: "stan:ch4.noc", to: [{ mow: "ozzy.dzien", zmienne: "ozzyZmienne" }], inaczej: ["ozzy.odloz"] }] }] },
                            { etykieta: "ozzy.nie", tresc: [] }], anuluj: 1 }] }] },
                    { nazwa: "w19Noc", ch: 5, gotowe: "stan:koniec>=1", zmienne: "krokZmienne" }
                ],
                fail: {} }
        },
        f9: { naglowek: "f9.naglowek", brak: "f9.brak", kolejnosc: 19, wiersze: [
            { co: "rozdzial", etykieta: "f9.rozdzial", opis: "f9.rozdzialOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "poza", etykieta: "f9.poza", opis: "f9.pozaOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "zmierzch", etykieta: "f9.zmierzch", opis: "f9.zmierzchOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "lodz", etykieta: "f9.lodz", opis: "f9.lodzOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "kod", etykieta: "f9.kod", opis: "f9.kodOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "wylacz", etykieta: "f9.wylacz", opis: "f9.wylaczOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "wyzeruj", etykieta: "f9.wyzeruj", opis: "f9.wyzerujOpis", ikona: 189, zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" }
        ] }
    });

    window.MlynData = { MAP, OWNER, IDS, RES_RANGE, ID, WIATRAK, POZY, POZA_KLATKA, KOD, START, CZAS, POGODA, ROCH, LASICA, ZATOCZKA, NAGRODY, SPOTY, RESIDENTS,
        defaults, TX: w.tx, W19: w.Q.W19, watek: w };
})();
