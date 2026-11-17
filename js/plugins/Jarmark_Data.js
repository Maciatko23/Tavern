//=============================================================================
// Jarmark_Data.js
//=============================================================================
// The thread W17 "Jarmark Kruczogrodu" (docs/zadania_nowe/jarmark.md, 2026-11-12) - the DATA; the engine: Jarmark.js, the words:
// js/teksty/jarmark.txt. Days 47-53: the fair of Kruczogród (stalls, barrels, lanterns, the opening, the beer contest and the dice
// tournament in the tavern, the troupe's play, the theft of the Silver Raven, the investigation and the night chase through the lanes).
// 2026-11-16 moved to the new Kruczogród (Map220; the player: the fair "on the meadow in the south-east", the chase "through the
// lanes"): the meadow holds the barley field (<Pole:16,8>, x 50..65, y 55..62) and the windmill (45,60) - the fair stands ROUND them:
// two stalls by the mill's yard, four under the field, the stage in the corner by the lower road (the audience on the road), the
// barrels by the stage. Check the cells with tools/jarmark/uklad_220.py. Two clues lie in Podgrodzie (Map218).
// Stands in the plugin list under Dezerter_Data and above TownLife_Data's readers. Event ids 4800-4999 (all injected: Tawerna.inject
// "Jarmark"); no map file is changed.
// 4800-4805 the six stall places, 4806-4813 the eight lamp posts, 4814-4817 barrels, 4820 the stage, 4821 the cushion with the Raven,
// 4822-4825 the stage's torches, 4830-4837 the troupe and the merchant (Map008), 4840-4847 the crowd, 4850-4859 the hall's actors
// (Map001: the judges, Mietek, Wanda), 4860-4869 the procession, 4870-4879 the clues, 4880-4889 the chase (Szept, the pursuers).

/*:
 * @target MZ
 * @plugindesc [W17] Dane wątku „Jarmark Kruczogrodu”: dni 47-53, kramy, konkurs piwny, turniej w kości, sztuka na rynku, kradzież, śledztwo, pościg uliczkami. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Dezerter_Data
 *
 * @help
 * ============================================================================
 * Jarmark_Data.js - dane wątku W17 „Jarmark Kruczogrodu”
 * ============================================================================
 * Same dane: silnik to Jarmark.js, teksty js/teksty/jarmark.txt, jarmark
 * stoi w Kruczogrodzie (Map220) wokół pola i wiatraka (tools/jarmark/uklad_220.py
 * sprawdza kratki). Numery zdarzeń 4800-4999.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Jarmark_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    const MAP = { miasto: 220, karczma: 1, podgrodzie: 218 };
    const OWNER = "Jarmark", IDS = [4800, 4999];
    const ID = { kram0: 4800, lampa0: 4806, beczka0: 4814, scena: 4820, poduszka: 4821, pochodnia0: 4822,
        ofelia: 4830, pimpek: 4831, zar: 4832, bonawentura: 4833, ania: 4834, szept: 4835, marcel: 4836, wandaRynek: 4837, ambrozy: 4838,
        tlum0: 4840, sedzia0: 4850, mietek: 4854, wanda: 4855, soltysHala: 4856, pochod0: 4860, slad0: 4870, pogon0: 4880, noc0: 4890 };
    const DNI = { zgloszenie: 47, otwarcie: 49, turniej: [50, 51], sztuka: 51, pogon: 52, rozstrzygniecie: 53, odjazd: 55 };
    const GODZ = { zlecenie: [8, 18], lampiony: 17, otwarcie: 14.5, konkurs: [19, 21], turniej: [17, 23], sztukaPomoc: [13, 18.9], sztuka: 19, sztukaKoniec: 19.7,
        pogon: 23.5, pogonDo: 24.5, zamkniecie: 12, targ: [8, 21] };
    const WARUNKI = { opinia: 20, renoma: 40 };
    // the six stall places (the bottom-middle cell of a stall; a stall is 3 cells wide), the eight lamp posts, the barrels, the stage
    // (7 x 3 cells round its bottom-middle cell). The hero's places in the scenes, who stands on the stage in the play, Szept's dash
    // out behind the stage (through the barley: [x, y, the move code, steps]), the bell-ringer's place by the stage
    const KRAMY = [[41, 60], [48, 60], [40, 65], [49, 65], [52, 65], [55, 65]];
    const LAMPY = [[43, 64], [47, 64], [38, 63], [47, 55], [67, 66], [70, 61], [70, 54], [74, 54]];
    const BECZKI = [[69, 64], [70, 64], [69, 65], [70, 65]];
    const SCENA = { x: 62, y: 65, torches: [[58, 63], [66, 63], [58, 65], [66, 65]], poduszka: [64, 66], widz: [62, 67], zakulisy: [66, 62],
        ambrozy: [63, 66], hero: { otwarcie: [68, 67, 4], sztuka: [62, 67, 8], zamkniecie: [68, 67, 4] },
        naScenie: { ania: [60, 64, 6], bonawentura: [63, 64, 4], pimpek: [65, 65, 2] }, ucieczka: [66, 62, 2, 10] };
    // the opening's procession: from the east edge of the town (the road from the Lord's manor) to the front of the stage and back
    // [key, sheet, start x, y, the place x, y]
    const POCHOD = [["lord", "$Npc_Lord", 79, 40, 62, 67], ["teodor", "$Npc_Kamerdyner", 79, 41, 63, 67], ["strazA", "$Npc_Zolnierz", 78, 40, 59, 67],
        ["strazB", "$Npc_Zolnierz", 78, 41, 65, 67], ["dziecko0", "$Npc_Dziecko", 79, 42, 61, 67], ["dziecko1", "$Npc_Jagodka", 78, 42, 64, 67],
        ["dziecko2", "$Npc_Dziecko", 79, 43, 66, 67], ["soltys", "$Npc_Soltys", 77, 41, 60, 67]];
    // the troupe: who stands where on the market (the fair's days), the crowd of the play
    const TRUPA = {
        ofelia: { sheet: "$Npc_Jarmark_Ofelia", pos: [59, 66, 2], godz: [8, 21] },
        pimpek: { sheet: "$Npc_Jarmark_Pimpek", pos: [51, 66, 2], godz: [9, 20] },
        zar: { sheet: "$Npc_Jarmark_Zar", pos: [65, 66, 2], godz: [12, 21] },
        bonawentura: { sheet: "$Npc_Jarmark_Bonawentura", pos: [57, 66, 2], godz: [10, 21] },
        ania: { sheet: "$Npc_Jarmark_Ania", pos: [61, 66, 2], godz: [10, 21] },
        szept: { sheet: "$Npc_Jarmark_Szept", pos: [66, 62, 2], godz: [8, 20] },
        marcel: { sheet: "$Npc_Jarmark_Marcel", pos: [43, 61, 2], godz: [8, 19] }
    };
    const TLUM = [["$Npc_Przekupka", 59, 68], ["$Npc_Szwaczka", 61, 68], ["$Npc_Wdowa", 63, 68], ["$Npc_Kowal", 65, 68],
        ["$Npc_Piekarka", 57, 67], ["$Npc_Garbarz", 67, 67]];   // (six spectators on the road: static, no walking, one shadow each)
    // the clues of the investigation (J9): the map, the place (the cell of the diamond), the word of its key
    const SLADY = [
        { k: "gablota", map: 220, x: 45, y: 22, godz: [6, 23] },     // the town hall (the Raven's showcase): the cut cord, the green wax
        { k: "cech", map: 220, x: 21, y: 59, godz: [6, 23] },        // the Cech's workshop: the register
        { k: "garbarnia", map: 218, x: 71, y: 69, godz: [6, 23] },   // the tannery of Podgrodzie: the washed coat
        { k: "laznia", map: 220, x: 50, y: 42, godz: [6, 23] },      // the town well (the key stays "laznia"): the man with the white face
        { k: "przytulek", map: 218, x: 39, y: 53, godz: [6, 23] }    // the almshouse of Podgrodzie: Berta, the bills
    ];
    const SLADY_MIN = 3;
    // (the speeds on the old scale: the hero runs 5 - Szept is a little faster on a straight; the hero gains on the corners)
    // the chase (day 52, 23:30): the ambush by the bell tower (the hero's place; the sołtys 2 cells west, the corporal 2 east), Szept
    // slips out behind the tower and runs on foot through the lanes: the bell tower's lane, the gap between the houses, the main street,
    // the stairs down into the dry riverbed, the lower town's lanes, the lower road, up the mill's path - he gives up under the
    // windmill. A leg is run when the hero is near (odleglosc; more when the clues were few) or after a while; the hero out of sight
    // (zgubiony cells) for 3 s: a penalty of kara seconds. The barrels he knocks over in the narrow gap (przeszkoda, when he has passed
    // it and the hero is not near) - the hero runs round by the next gap.
    const POGON = { start: [17, 27, 8], szept: [20, 23, 2], zasadzka: [17, 27, 8], odleglosc: 6, zgubiony: 13, kara: 15, predkosc: 5.2, predkoscBez: 5.4,
        trasa: [[20, 26], [25, 27], [25, 37], [32, 45], [32, 50], [24, 53], [24, 60], [30, 61], [30, 67], [44, 67], [45, 62]],
        przeszkoda: { po: 2, x: 25, y: 33 }, poczatekDnia: 52 };
    // the contest: the four judges and what each likes (the addition: miod | dym | szyszka), the votes needed
    const SEDZIOWIE = { hanka: { dod: "miod", sheet: "$Npc_Piekarka", x: 12 }, ambrozy: { dod: "dym", sheet: "$Npc_Dzwonnik", x: 13 },
        wit: { dod: "ostry", sheet: "$Npc_Kapral", x: 15 }, teodor: { dod: "szyszka", sheet: "$Npc_Kamerdyner", x: 16 } };
    const DODATKI = ["miod", "dym", "ostry", "szyszka"];
    // the contest in the smaller hall (2026-11-16, Map001 49 x 42): the judges in a row on the red runner below the bar, the hero facing
    // them; Wanda by the first dice table of the games room
    const HALA = { rzad: 27, hero: [14, 31, 8], mietek: [17, 27], soltys: [11, 27], wanda: [38, 34, 8] };   // (the sołtys and Mietek at the two ends of the row)
    // the night by the bell tower (days 52-53): four lamp posts and two braziers of the watch - real fire lights
    const NOC_DZWONNICA = { lampy: [[13, 26], [21, 26], [13, 29], [21, 29]], ogniska: [[15, 29], [19, 29]] };
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
                1: { ch: 1, krok: "w17Zgloszenie", godzina: 9, dzien: 47, idz: [220, 44, 23, 8] },
                2: { ch: 2, krok: "w17Prace", godzina: 9, dzien: 48, idz: [220, 46, 66, 8] },
                3: { ch: 3, krok: "w17Otwarcie", godzina: 14.4, dzien: 49, idz: [220, 68, 67, 4] },
                4: { ch: 4, krok: "w17Konkurs", godzina: 19, dzien: 49, idz: [1, 14, 21, 8] },
                5: { ch: 5, krok: "w17Turniej", godzina: 17, dzien: 50, idz: [1, 14, 21, 8] },
                6: { ch: 6, krok: "w17Sztuka", godzina: 18.8, dzien: 51, idz: [220, 62, 68, 8] },
                7: { ch: 7, krok: "w17Sledztwo", godzina: 9, dzien: 52, idz: [220, 44, 23, 8] },
                8: { ch: 8, krok: "w17Pogon", godzina: 23.4, dzien: 52, idz: [220, 17, 28, 8] },
                9: { ch: 9, krok: "w17Koniec", godzina: 9, dzien: 53, idz: [220, 44, 23, 8] }
            }
        }
    });

    window.JarmarkData = { MAP, OWNER, IDS, ID, DNI, GODZ, WARUNKI, KRAMY, LAMPY, BECZKI, SCENA, TRUPA, TLUM, SLADY, SLADY_MIN, POGON, POCHOD,
        SEDZIOWIE, DODATKI, HALA, NOC_DZWONNICA, TURNIEJ, POMOC, NAGRODA, VITEMS, defaults, TX: w.tx, W17: w.Q.W17, watek: w };
})();
