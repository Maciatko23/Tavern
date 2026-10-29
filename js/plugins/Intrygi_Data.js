//=============================================================================
// Intrygi_Data.js
//=============================================================================
// The ferry's travellers, stage 3 - the intrigues on the tavern's floors (docs/PODROZNI.md 1.5-1.7, 3: I1, I3, I4, I5; 2026-10-29) -
// the DATA; the engine: Intrygi.js, the words: js/teksty/intrygi.txt. Stands under Podroznicy_Data (the cast, the book) and above
// TownLife and TownQuests_Data, so that the thread "intrygi" (Watki.js) puts its quests into window.TownQuestsPacks:
//   - D45 "Gość spod trójki" (I1): the stranger in room 3 (the cast's "trojka", only with TavernLife's room guard) measures the vaults
//     down the chimney - three clues of five (soot at the door, the rope in the cellar, the numbers through the wall of room 1, the
//     keyhole at night, Ansgar), then Borgar breaks the door / Wit at the pier / the notebook taken at dawn / nothing
//   - D46 "Skradziona szkatułka" (I3): Ksenia's box gone on her fourth night - three variants (A: herself, B: Gaspar, C: a raftsman),
//     clues at the lock, in her room, in talks, through the door; the accusation at Borgar's; the box back before her ferry
//   - K73 "Nocne kroki" (I4): the first night walker followed (Ozzy walking in his sleep)
// The mechanisms (Intrygi.js) and their data here: the locked doors of the travellers' rooms, the search of their things, the night
// walkers (I4), the letters under the door (I5), the renown's gifts (tips, the key, the discounts).

/*:
 * @target MZ
 * @plugindesc Podróżni z promu - etap 3, dane intryg: D45 „Gość spod trójki”, D46 „Skradziona szkatułka”, K73 „Nocne kroki”, drzwi zajętych pokoi, przeszukanie, nocne kroki, listy pod drzwiami. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @orderAfter Podroznicy_Data
 *
 * @help
 * ============================================================================
 * Intrygi_Data.js - dane intryg na piętrach tawerny (docs/PODROZNI.md, rozdz. 3)
 * ============================================================================
 * Same dane: silnik to Intrygi.js, teksty js/teksty/intrygi.txt.
 * Musi stać pod Podroznicy_Data i nad TownLife.js i TownQuests_Data.js.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Intrygi_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ where, when, how much
    const MAP = { sala: 1, pietro: 25, apartamenty: 26, piwnica: 9, przystan: 125 };
    // the events of Podroznicy's range used here (Tawerna.inject through Podroznicy.wstaw): the night walker on the guests' floor, the
    // soot at room 3's door, the letter under the hero's door, the raftsman's bag on the pier (D46 C), the rope in the cellar (D45)
    const IDS = { kroczacy: 3002, sadza: 3011, list: 3014, bagaz: 3012, sznur: 3017 };
    // the doors of the travellers' rooms on Map025 (their events' names) and the cleaning of the floor (the doors left open)
    const DRZWI = { re: /^(?:Drzwi|Wejście) -> Pokój (\d+)$/, sprzatanie: [9, 11] };
    // Borgar's key for an hour (renown 50+): the search of a room whose guest is out
    const KLUCZ = { renoma: 50, godzin: 1 };
    // the search: the guest comes back within this many hours - caught (renown -3, he does not talk to the hero for his stay)
    const SZUKANIE = { wraca: 0.5, kara: -3, rzeczy: { kufer: /^Kufer/, torba: /^Torba/ } };
    // the renown's gifts (docs/PODROZNI.md 1.6): tips a shift, the hero's rooms 20% off, the chamber free once a week
    const RENOMA = { napiwki: [[80, 3], [60, 2], [40, 1]], rabat: { od: 75, ile: 0.8 }, komnata: { od: 90 } };
    // I4: the walker's candle (radius px, colour) - he sees the hero within `widzi` tiles (`skradanie` when sneaking); farther than
    // `gubi` when he gets to the end - lost; frames a step; he sets off once the hero is out in the corridor or after `czeka` frames
    const KROKI = { swiatlo: "<Light:110,255,186,110><LightFollow>", widzi: 3, skradanie: 1.5, gubi: 9, czeka: 900, predkosc: 3 };
    // the night walkers (order: the first due one walks; at most one a night): Ozzy walking in his sleep the first time, Tymon to the
    // kitchen for bread (W16 - Dezerter.kuchnia); more from other plugins (Podroznicy.kroki.dodaj)
    const KROCZACY = [
        { id: "ozzy", kto: "kroki.ozzy.kto", arkusz: "People2_Tall", indeks: 0, start: [20, 49, 6], trasa: [[44, 50], [48, 56], [48, 62]],
            godziny: [1, 3], gdy: "ozzyLunatyk", wymowka: "kroki.ozzy.wymowka", koniec: "ozzyKoniec" },
        { id: "tymon", kto: "kroki.tymon.kto", arkusz: "$Npc_Dezerter", indeks: 0, start: [16, 49, 6], trasa: [[44, 50], [48, 56], [48, 62]],
            godziny: [0.5, 2.5], gdy: "tymonKuchnia", wymowka: "kroki.tymon.wymowka", koniec: "tymonKoniec" }
    ];
    // I5: the letters under the door (the first one due a morning, 6-10, after a night in a rented room)
    const LISTY = [
        { id: "w16Tymon", gdy: "listTymona", tekst: "listTymonaTekst" },
        { id: "w16Szczerba", gdy: "listSzczerby", tekst: "listSzczerbyTekst" },
        { id: "d43Urszula", gdy: "listUrszuli", klucz: "listy.urszula" }
    ];
    // where the letter lies: inside the hero's room by its door (Map025); the Gold suite - by its bed (Map026, read from the map)
    const LIST_GDZIE = { 1: [25, 38, 44], 2: [25, 58, 44], 3: [25, 28, 44], komnata: [25, 67, 12] };
    // the searches the matters want (the guest's things in his room; the engine asks the hooks)
    const PRZESZUKANIA = [
        { id: "w15Skrzynka", pokoj: "12", kto: "relikwie", rzecz: "dowolna", gdy: "w15Szukaj", po: "w15Znalazl", klucz: "szukanie.w15" },
        { id: "d42Umowa", pokoj: "20", kto: "zboze", rzecz: "dowolna", gdy: "d42Szukaj", po: "d42Znalazl", klucz: "szukanie.d42" },
        { id: "d46Pokoj", pokoj: "18", kto: "ksenia", rzecz: "dowolna", gdy: "d46Szukaj", po: "d46Pokoj", klucz: "szukanie.d46.ogolnie" }
    ];
    // D45: the soot at room 3's door (mornings after the first night), the rope in the cellar over the barrels; the wall of room 1
    // (1-3 at night); the keyhole (the door of room 3, 1-3, sneaking); the notebook (4-5, sneaking); the rewards
    const D45 = { sadza: [25, 29, 49], sznur: [9, 4, 10], podsluch: [1, 3], dziurka: [1, 3], notes: [4, 5],
        nagroda: { a: { gold: 20, xp: 150 }, b: { xp: 120 }, c: { xp: 120 } }, renoma: { a: 6, b: 3, c: 3 }, przychylnosc: 5 };
    // D46: the theft on the night after Ksenia's 3rd day; the variants (their clues: the sources); Borgar's 60 G at her ferry (14:00)
    const D46 = { noc: 3, wariantySlady: { A: ["zamek", "pokoj", "gaspar", "podsluch"], B: ["zamek", "pokoj", "szymek"], C: ["zamek", "pokoj", "janek"] },
        winni: { A: "ksenia", B: "gaspar", C: "flisak" }, podsluch: [22, 24], bagaz: [125, 15, 17], bagazGodziny: [9, 14], odplyw: 14,
        nagroda: { A: { gold: 25, xp: 150 }, B: { gold: 30, xp: 150 }, C: { gold: 30, xp: 150 } }, renoma: { dobrze: 6, zle: -5, przepadla: -6 },
        opinia: { zle: -5 }, slawa: 3 };

    // ------------------------------------------------------------------ the thread
    const w = Watki.watek({
        id: "intrygi", wtyczka: "Intrygi", teksty: "intrygi",
        // version 1: the night walks (the night of the last, the first done, those done), the letters (this morning's, those read), the
        // key, the chamber's free week, D45's clues and ending, D46's variant, clues, the accused, the ending
        stan: { klucz: "intrygi", wersja: 1, domyslne: () => ({
            kroki: { noc: -1, pierwszy: 0, udane: 0, zrobione: {}, pominiete: {} },
            listy: { dzien: 0, id: "", czytany: 0, byly: {} },
            klucz: 0, komnataTydz: -1, zly: {},
            d45: { slady: {}, koniec: "" },
            d46: { wariant: "", slady: {}, widziane: {}, oskarzeni: {}, koniec: "", trafny: 0 } }) },
        mowa: { akapity: true },
        mysli: { klatki: 220, odstep: 230, czekaj: true },
        zadania: {
            // D45 "Gość spod trójki": starts by itself once he is here and the hero is in the tavern
            D45: { kind: "D", giver: null, icon: 0, start: ["trojkaJest", { mapa: [MAP.sala, MAP.pietro] }],
                kroki: [
                    { nazwa: "d45Poszlaki", gotowe: { lub: ["ile:d45.slady>=3", "stan:d45.koniec"] }, zmienne: "d45Zmienne", rozmowy: [
                        { kto: "rozbitek", gdy: ["ansgarSojusznik", "!stan:d45.slady.ansgar"], tresc: ["d45.ansgar", { zrob: "d45Slad", args: ["ansgar"] }] },
                        { kto: "kapral", gdy: ["trojkaOdplywaDzis", "!stan:d45.koniec"], znacznik: false, gotowa: false, tresc: [{ rozmowa: "d45Wit" }] }
                    ] },
                    { nazwa: "d45Rozwiazanie", gotowe: "stan:d45.koniec", zmienne: "d45Zmienne", rozmowy: [
                        { kto: "kapral", gdy: ["trojkaOdplywaDzis", "!stan:d45.koniec"], tresc: [{ rozmowa: "d45Wit" }] }
                    ] }
                ],
                reward: {} },
            // D46 "Skradziona szkatułka": starts the morning after the theft
            D46: { kind: "D", giver: null, icon: 0, start: ["d46Kradziez", { mapa: [MAP.sala, MAP.pietro] }],
                kroki: [
                    { nazwa: "d46Sledztwo", gotowe: { lub: ["stan:d46.trafny", "stan:d46.koniec"] }, zmienne: "d46Zmienne", rozmowy: [
                        { kto: "relikwie", gdy: "!stan:d46.widziane.gaspar", tresc: [{ jesli: "stan:d46.wariant=A", to: ["d46.gaspar.A"], inaczej: ["d46.gaspar.inne"] }, { zrob: "d46Slad", args: ["gaspar"] }] },
                        { kto: "zlodziej", gdy: "!stan:d46.widziane.szymek", tresc: [{ jesli: "stan:d46.wariant=B", to: ["d46.szymek.B"], inaczej: ["d46.szymek.inne"] }, { zrob: "d46Slad", args: ["szymek"] }] },
                        { kto: "janek", gdy: "!stan:d46.widziane.janek", tresc: [{ jesli: "stan:d46.wariant=C", to: ["d46.janek.C"], inaczej: ["d46.janek.inne"] }, { zrob: "d46Slad", args: ["janek"] }] }
                    ] },
                    { nazwa: "d46Odzyskaj", gotowe: "stan:d46.koniec", zmienne: "d46Zmienne" }
                ],
                reward: {} },
            // K73 "Nocne kroki": the first night walk followed to its end
            K73: { kind: "K", giver: null, icon: 0, start: "stan:kroki.pierwszy>0",
                kroki: [{ nazwa: "k73Sledz", gotowe: "stan:kroki.udane>0" }],
                reward: { xp: 40 } }
        },
        rozmowy: {
            // D45 b: Wit at the pier on the stranger's day of leaving
            d45Wit: ["d45.wit.pyta", { wybor: [
                { etykieta: "d45.wit.tak", gdy: "ile:d45.slady>=2", tresc: ["d45.wit.areszt", { zrob: "d45Koniec", args: ["b"] }] },
                { etykieta: "d45.wit.nie", tresc: [] }
            ], anuluj: "ostatnia" }],
            // D46: the accusation at Borgar's
            d46Oskarz: ["d46.oskarz.pyta", { wybor: ["ksenia", "gaspar", "flisak", "szymek", "wanda"].map(kto => ({
                etykieta: "d46.oskarz.etykieta." + kto, gdy: ["!stan:d46.oskarzeni." + kto].concat(kto === "gaspar" ? ["gasparJest"] : []),
                tresc: [{ jesli: { hak: "d46Winny", args: [kto] }, to: ["d46.oskarz." + kto + ".trafny"], inaczej: ["d46.oskarz." + kto + ".zle"] },
                    { zrob: "d46Oskarz", args: [kto] }] })).concat([{ etykieta: "d46.oskarz.etykieta.nie", tresc: [] }]), anuluj: "ostatnia" }]
        },
        akcje: {
            d45Slad: [{ hak: "d45Slad", args: [{ arg: 0 }] }, { sprawdz: true }],
            d45Koniec: [{ hak: "d45Koniec", args: [{ arg: 0 }] }],
            d46Slad: [{ hak: "d46Slad", args: [{ arg: 0 }] }, { sprawdz: true }],
            d46Oskarz: [{ hak: "d46Oskarz", args: [{ arg: 0 }] }, { sprawdz: true }]
        }
    });

    // the cast's matter: "the guest of room three" stays a ferry longer while D45 goes on (then sails with his measurements)
    const PD = window.PodroznicyData;
    if (PD && Array.isArray(PD.OBSADA)) {
        const c = PD.OBSADA.find(x => x.key === "trojka");
        if (c && !c.zadania) c.zadania = ["D45"];
    }

    window.IntrygiData = { MAP, IDS, DRZWI, KLUCZ, SZUKANIE, RENOMA, KROKI, KROCZACY, LISTY, LIST_GDZIE, PRZESZUKANIA, D45, D46, TX: w.tx, watek: w, Q: w.Q };
})();
