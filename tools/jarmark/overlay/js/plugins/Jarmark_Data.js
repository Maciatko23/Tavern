//=============================================================================
// Jarmark_Data.js
//=============================================================================
// The thread W17 "Jarmark Kruczogrodu" (docs/zadania_nowe/jarmark.md, 2026-11-12) - the DATA; the engine: Jarmark.js, the words:
// js/teksty/jarmark.txt. Days 47-53: the fair of Kruczogród (stalls, barrels, lanterns, the opening, the beer contest and the dice
// tournament in the tavern, the troupe's play on the square, the theft of the Silver Raven, the investigation and the night chase over
// the roofs of two NEW joined houses of Map008 (tiles; tools/jarmark/miasto.py) to the bell tower).
// Stands in the plugin list under Dezerter_Data and above TownLife_Data's readers. Event ids 4800-4999 (all injected: Tawerna.inject
// "Jarmark"); the map file gets only the two houses' tiles and their two closed doors (events below 500).
// 4800-4805 the six stall places, 4806-4813 the eight lamp posts, 4814-4817 barrels, 4820 the stage, 4821 the cushion with the Raven,
// 4822-4825 the stage's torches, 4830-4837 the troupe and the merchant (Map008), 4840-4847 the crowd, 4850-4859 the hall's actors
// (Map001: the judges, Mietek, Wanda), 4860-4869 the procession, 4870-4879 the clues, 4880-4889 the chase (Szept, the pursuers).

/*:
 * @target MZ
 * @plugindesc [W17] Dane wątku „Jarmark Kruczogrodu”: dni 47-53, kramy, konkurs piwny, turniej w kości, sztuka na rynku, kradzież, śledztwo, pościg po dachach. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Dezerter_Data
 *
 * @help
 * ============================================================================
 * Jarmark_Data.js - dane wątku W17 „Jarmark Kruczogrodu”
 * ============================================================================
 * Same dane: silnik to Jarmark.js, teksty js/teksty/jarmark.txt, kamienice
 * pościgu to kafle Map008 (tools/jarmark/miasto.py). Numery zdarzeń 4800-4999.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Jarmark_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    const MAP = { miasto: 8, karczma: 1 };
    const OWNER = "Jarmark", IDS = [4800, 4999];
    const ID = { kram0: 4800, lampa0: 4806, beczka0: 4814, scena: 4820, poduszka: 4821, pochodnia0: 4822,
        ofelia: 4830, pimpek: 4831, zar: 4832, bonawentura: 4833, ania: 4834, szept: 4835, marcel: 4836, wandaRynek: 4837, ambrozy: 4838,
        tlum0: 4840, sedzia0: 4850, mietek: 4854, wanda: 4855, soltysHala: 4856, pochod0: 4860, slad0: 4870, pogon0: 4880, noc0: 4890 };
    const DNI = { zgloszenie: 47, otwarcie: 49, turniej: [50, 51], sztuka: 51, pogon: 52, rozstrzygniecie: 53, odjazd: 55 };
    const GODZ = { zlecenie: [8, 18], lampiony: 17, otwarcie: 14.5, konkurs: [19, 21], turniej: [17, 23], sztukaPomoc: [13, 18.9], sztuka: 19, sztukaKoniec: 19.7,
        pogon: 23.5, pogonDo: 24.5, zamkniecie: 12, targ: [8, 21] };
    const WARUNKI = { opinia: 20, renoma: 40 };
    // the six stall places on the square (the bottom-middle cell of a stall), the eight lamp posts, the barrels, the stage
    const KRAMY = [[37, 49], [40, 49], [43, 49], [37, 54], [40, 54], [43, 54]];
    const LAMPY = [[36, 47], [36, 53], [36, 57], [46, 45], [57, 45], [72, 46], [72, 52], [62, 57]];
    const BECZKI = [[60, 52], [61, 52], [60, 53], [61, 53]];
    const SCENA = { x: 68, y: 49, torches: [[64, 47], [72, 47], [64, 49], [72, 49]], poduszka: [70, 50], widz: [68, 52], zakulisy: [68, 46] };
    // the troupe: who stands where on the market (the fair's days), the crowd of the play
    const TRUPA = {
        ofelia: { sheet: "$Npc_Jarmark_Ofelia", pos: [65, 50, 2], godz: [8, 21] },
        pimpek: { sheet: "$Npc_Jarmark_Pimpek", pos: [46, 52, 2], godz: [9, 20] },
        zar: { sheet: "$Npc_Jarmark_Zar", pos: [71, 50, 2], godz: [12, 21] },
        bonawentura: { sheet: "$Npc_Jarmark_Bonawentura", pos: [63, 50, 2], godz: [10, 21] },
        ania: { sheet: "$Npc_Jarmark_Ania", pos: [67, 50, 2], godz: [10, 21] },
        szept: { sheet: "$Npc_Jarmark_Szept", pos: [68, 46, 2], godz: [8, 20] },
        marcel: { sheet: "$Npc_Jarmark_Marcel", pos: [42, 51, 2], godz: [8, 19] }
    };
    const TLUM = [["$Npc_Przekupka", 65, 52], ["$Npc_Szwaczka", 67, 53], ["$Npc_Wdowa", 70, 52], ["$Npc_Kowal", 71, 53],
        ["$Npc_Piekarka", 69, 54], ["$Npc_Garbarz", 64, 53]];   // (six spectators: static, no walking, one shadow each)
    // the clues of the investigation (J9): the place (the cell of the diamond), the word of its key
    const SLADY = [
        { k: "gablota", x: 50, y: 63, godz: [6, 23] },        // Sukiennice: the cut cord, the green wax
        { k: "cech", x: 90, y: 88, godz: [6, 23] },           // the Cech: the register
        { k: "garbarnia", x: 113, y: 89, godz: [6, 23] },     // the tannery: the washed coat
        { k: "laznia", x: 96, y: 74, godz: [6, 23] },         // the bath: the man with the white face
        { k: "przytulek", x: 98, y: 105, godz: [6, 23] }      // the almshouse: Berta, the bills
    ];
    const SLADY_MIN = 3;
    // the roofs of the chase (Map008): [x0, y0, x1, y1] included; the cells that are not walked into (the chimney, the dormers)
    const DACHY = [[35, 97, 37, 99], [38, 97, 41, 101], [42, 94, 45, 96], [46, 94, 49, 96], [45, 100, 47, 100]];   // (the last: the ridge of the bell tower's roof - the slopes are drawn above the people)
    const DACHY_ZABLOKOWANE = [[43, 94], [43, 95], [35, 97], [35, 98], [38, 100], [40, 100]];
    const POGON = { start: [36, 99, 6], szept: [41, 97], meta: [46, 100], skoki: 4, kara: 15, limit: 150, zasadzka: [46, 105, 8], odleglosc: 6,
        trasa: [{ jump: [1, -1] }, { step: [6, 6, 6, 6, 6] }, { jump: [0, 4] }, { step: [4] }], poczatekDnia: 52 };
    // the contest: the four judges and what each likes (the addition: miod | dym | szyszka), the votes needed
    const SEDZIOWIE = { hanka: { dod: "miod", sheet: "$Npc_Piekarka", x: 12 }, ambrozy: { dod: "dym", sheet: "$Npc_Dzwonnik", x: 13 },
        wit: { dod: "ostry", sheet: "$Npc_Kapral", x: 15 }, teodor: { dod: "szyszka", sheet: "$Npc_Kamerdyner", x: 16 } };
    const DODATKI = ["miod", "dym", "ostry", "szyszka"];
    const HALA = { rzad: 40, hero: [14, 44, 8], borgar: [11, 46], mietek: [17, 40], soltys: [14, 38] };   // (the hero stands in the open hall: no narrow doorway, no black hourglass of the line of sight)
    // the night by the bell tower (days 52-53): four lamp posts and two braziers of the watch - real fire lights, so the roofs and the street are readable
    const NOC_DZWONNICA = { lampy: [[43, 99], [49, 99], [43, 106], [49, 106]], ogniska: [[45, 107], [47, 107]] };
    // the tournament: three matches (the opponents of TavernDice; Wanda is added by Jarmark.js), the stakes and the pot
    const TURNIEJ = { wpisowe: 20, mecze: ["bartek", "ozzy", "wanda"], stawki: [5, 10, 15], pula: 160, podatek: 40, kosc: "krucza_jarmark" };
    const POMOC = { kostium: { kto: "szwaczka", rzecz: "kostium_jarmark" }, zar: { kto: "kowal", rzecz: "zar_jarmark" }, peruka: { kto: "piekarka", rzecz: "peruka_jarmark" } };
    const NAGRODA = { prace: { gold: 12, xp: 20 }, otwarcie: { opinia: 1 }, konkurs: { gold: 40, xp: 40, opinia: 2 }, turniej: { gold: 120, xp: 60 },
        kruk: { gold: 60, xp: 50 }, marcel: { gold: 100 }, szantaz: { gold: 80 }, litosc: { koszt: 40 },
        koniec: { A: { opinia: 8 }, B: { opinia: 3 }, C: { opinia: 5 }, D: { opinia: -3 }, F: { opinia: -5 } } };
    const VITEMS = {
        deska_kram: Watki.zTekstu({ icon: 62 }, { name: "przedm.deska" }, "jarmark"),
        obrecz: Watki.zTekstu({ icon: 143 }, { name: "przedm.obrecz" }, "jarmark"),
        lampion: Watki.zTekstu({ icon: 64 }, { name: "przedm.lampion" }, "jarmark"),
        srebrny_kruk: Watki.zTekstu({ icon: 319 }, { name: "przedm.kruk" }, "jarmark"),
        bilet_ferry: Watki.zTekstu({ icon: 220 }, { name: "przedm.bilet" }, "jarmark")
    };

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md)
    const defaults = () => ({
        z: 0, zDzien: 0,
        prace: { deski: 0, kramy: [], obrecze: 0, beczki: 0, lampiony: 0, lampy: [], wydane: 0 },
        otw: 0, konkurs: { dod: {}, glosy: -1, fin: 0, wynik: "" },
        turniej: { wpisal: 0, mecz: 0, oszust: 0, wygral: 0, fin: 0, kosc: 0 },
        przed: { pomoc: {}, scena: 0, kradziez: 0, cien: 0 },
        slady: {}, trop: 0, zasadzka: 0,
        pogon: { faza: 0, upadki: 0, czas: 0, koniec: 0, bezFory: 0 },
        szept: "", marcel: "", zwrotka: 0, koniec: "", nagroda: 0, zamkniecie: 0, scenyZrobione: {}
    });
    const w = Watki.watek({
        id: "jarmark", wtyczka: "Jarmark", teksty: "jarmark",
        stan: { klucz: "jarmark", wersja: 1, domyslne: defaults },
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 260, czekaj: true },
        zadania: {
            W17: { kind: "W", giver: null, icon: 0,
                start: ["mozeZgloszenie"],
                kroki: [
                    { nazwa: "w17Zgloszenie", ch: 1, gotowe: "stan:z=1", zmienne: "krokZm",
                        rozmowy: [{ kto: "soltys", gdy: "soltysZgloszenie", tresc: [{ rozmowa: "zgloszenie" }] }] },
                    { nazwa: "w17Prace", ch: 2, gotowe: "praceGotowe", zmienne: "krokZm",
                        rozmowy: [{ kto: "soltys", gdy: "soltysPrace", tresc: [{ rozmowa: "soltysPrace" }] },
                            { kto: "ciesla", gdy: "deskiMozna", tresc: [{ rozmowa: "deski" }] },
                            { kto: "kolodziej", gdy: "obrecze", tresc: [{ rozmowa: "kolodziej" }] },
                            { kto: "kapral", gdy: "lampionyMozna", tresc: [{ rozmowa: "lampiony" }] }],
                        temat: { kto: "borgar", etykieta: "temat.beczki", gdy: "borgarBeczki", tresc: [{ rozmowa: "borgarBeczki" }] } },
                    { nazwa: "w17Otwarcie", ch: 3, gotowe: "stan:otw=1", zmienne: "krokZm" },
                    { nazwa: "w17Konkurs", ch: 4, gotowe: "stan:konkurs.fin>0", zmienne: "krokZm",
                        temat: { kto: "borgar", etykieta: "temat.konkurs", gdy: "konkursGdy", tresc: [{ rozmowa: "konkurs" }] },
                        rozmowy: ["piekarka", "dzwonnik", "kapral", "kamerdyner"].map(k => ({ kto: k, gdy: "plotkaSedzia", tresc: [{ rozmowa: "plotka" }] })) },
                    { nazwa: "w17Turniej", ch: 5, gotowe: "stan:turniej.fin>0", zmienne: "krokZm",
                        temat: { kto: "borgar", etykieta: "temat.turniej", gdy: "turniejGdy", tresc: [{ rozmowa: "turniej" }] } },
                    { nazwa: "w17Sztuka", ch: 6, gotowe: "stan:przed.kradziez=1", zmienne: "krokZm",
                        rozmowy: ["szwaczka", "kowal", "piekarka"].map(k => ({ kto: k, gdy: "pomocMozna", tresc: [{ rozmowa: "pomoc" }] })) },
                    { nazwa: "w17Sledztwo", ch: 7, gotowe: "stan:zasadzka=1", zmienne: "krokZm",
                        rozmowy: [{ kto: "soltys", gdy: "soltysSledztwo", tresc: [{ rozmowa: "soltysSledztwo" }] }] },
                    { nazwa: "w17Pogon", ch: 8, gotowe: "stan:pogon.koniec>0", zmienne: "krokZm" },
                    { nazwa: "w17Koniec", ch: 9, gotowe: "koniecGotowe", zmienne: "krokZm" }
                ],
                fail: {} }
        },
        paczka: { vitems: VITEMS },
        rozmowy: {
            zgloszenie: ["soltys.prosba", { wybor: [
                { etykieta: "soltys.opcja.tak", tresc: ["soltys.tak", { zrob: "przyjmij" }] },
                { etykieta: "soltys.opcja.nie", tresc: ["soltys.nie", { zrob: "odloz" }] }], anuluj: "ostatnia" }],
            soltysPrace: [{ gdy: "praceGotowe", mow: "soltys.praceGotowe", koniec: true }, { hak: "soltysPraceLinie" }],
            deski: [{ gdy: "deskiJuz", mow: "dluto.juz", koniec: true }, "dluto.deski", { zrob: "deski" }],
            kolodziej: ["kolodziej.obrecze", { zrob: "obrecze" }],
            lampiony: ["wit.lampiony", { zrob: "lampiony" }],
            borgarBeczki: ["borgar.beczki", { zrob: "beczki" }],
            konkurs: [{ gdy: "konkursJuz", mow: "borgar.konkursJuz", koniec: true }, "borgar.konkurs", { wybor: [
                { etykieta: "borgar.opcja.start", tresc: [{ zrob: "konkurs" }] },
                { etykieta: "borgar.opcja.chwila", tresc: ["borgar.pozniej"] }], anuluj: "ostatnia" }],
            plotka: [{ hak: "plotkaLinie" }, { zrob: "plotka" }],
            turniej: [{ jesli: "turniejWpisany", to: ["borgar.turniejMecz"], inaczej: ["borgar.turniej"] },
                { wybor: [{ etykieta: "borgar.opcja.wpisz", gdy: "!turniejWpisany", tresc: [{ zrob: "turniejWpisz" }] },
                    { etykieta: "borgar.opcja.mecz", gdy: "turniejWpisany", tresc: [{ zrob: "turniejMecz" }] },
                    { etykieta: "borgar.opcja.kosc", gdy: "turniejKosc", tresc: [{ zrob: "turniejKontrola" }] },
                    { etykieta: "borgar.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            pomoc: [{ hak: "pomocLinie" }, { zrob: "pomoc" }],
            soltysSledztwo: [{ hak: "soltysSledztwoLinie" }]
        },
        akcje: {
            przyjmij: [{ hak: "przyjmij" }], odloz: [{ hak: "odloz" }], deski: [{ hak: "deski" }], obrecze: [{ hak: "obrecze" }], lampiony: [{ hak: "lampiony" }],
            beczki: [{ hak: "beczki" }], konkurs: [{ hak: "konkursStart" }], plotka: [{ hak: "plotka" }], turniejWpisz: [{ hak: "turniejWpisz" }],
            turniejMecz: [{ hak: "turniejMecz" }], turniejKontrola: [{ hak: "turniejKontrola" }], pomoc: [{ hak: "pomoc" }]
        },
        f9: { naglowek: "f9.naglowek", brak: "f9.brak", kolejnosc: 17, wiersze: [
            { co: "stan", etykieta: "f9.stan", opis: "f9.stanOpis", ikona: 189, zmienne: "f9Zm", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "poszlaki", etykieta: "f9.poszlaki", opis: "f9.poszlakiOpis", ikona: 189, zmienne: "f9Zm", wybierz: "f9Wybierz", ok: "f9Ok" },
            { co: "finaly", etykieta: "f9.finaly", opis: "f9.finalyOpis", ikona: 189, zmienne: "f9Zm", wybierz: "f9Wybierz", ok: "f9Ok" }
        ] },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w17Zgloszenie", godzina: 9, dzien: 47, idz: [8, 91, 48, 8] },
                2: { ch: 2, krok: "w17Prace", godzina: 9, dzien: 48, idz: [8, 52, 52, 2] },
                3: { ch: 3, krok: "w17Otwarcie", godzina: 14.4, dzien: 49, idz: [8, 70, 50, 4] },
                4: { ch: 4, krok: "w17Konkurs", godzina: 19, dzien: 49, idz: [1, 14, 47, 8] },
                5: { ch: 5, krok: "w17Turniej", godzina: 17, dzien: 50, idz: [1, 14, 47, 8] },
                6: { ch: 6, krok: "w17Sztuka", godzina: 18.8, dzien: 51, idz: [8, 65, 53, 8] },
                7: { ch: 7, krok: "w17Sledztwo", godzina: 9, dzien: 52, idz: [8, 52, 64, 8] },
                8: { ch: 8, krok: "w17Pogon", godzina: 23.4, dzien: 52, idz: [8, 46, 106, 8] },
                9: { ch: 9, krok: "w17Koniec", godzina: 9, dzien: 53, idz: [8, 52, 64, 8] }
            }
        }
    });

    window.JarmarkData = { MAP, OWNER, IDS, ID, DNI, GODZ, WARUNKI, KRAMY, LAMPY, BECZKI, SCENA, TRUPA, TLUM, SLADY, SLADY_MIN, DACHY, DACHY_ZABLOKOWANE, POGON,
        SEDZIOWIE, DODATKI, HALA, NOC_DZWONNICA, TURNIEJ, POMOC, NAGRODA, VITEMS, defaults, TX: w.tx, W17: w.Q.W17, watek: w };
})();
