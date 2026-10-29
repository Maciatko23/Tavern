//=============================================================================
// Poselstwo_Data.js
//=============================================================================
// The chain W14 "Poselstwo" of the ferry's travellers (docs/PODROZNI.md 2.8, 2.13, I6, 4.1, 4.4 - stage 5, 2026-10-29) - the DATA;
// the engine: Poselstwo.js, the words: js/teksty/poselstwo.txt. Albin the "pilgrim" (really Ragnar Holm, a scout of the Black Eyes
// - the traveller "pielgrzym", room 15) comes with the third wave (day 37); the Crown's envoy Adam Wierzbięta and his guardsman Ostap
// (the group "posel": the Gold suite on floor II, Map026 - only once TavernLife can refuse the hero a room taken) three days later
// with a letter for the Lord. The dinner carried to the Gold suite at 20:00 is the way up ("w służbie"), the council in the Great
// salon the next evening is heard through the dining room's wall, on the Kupała night Albin takes the letter - unless someone
// watches the suite's door. Stands in the plugin list under Podroznicy_Data (its cast) and above TownLife and TownQuests_Data, so that:
//   - the thread "poselstwo" (Watki.js) is made before TownQuests_Data: its state (Tawerna.state "poselstwo", version 1), the quest W14
//     (seven steps, chapters 1-5: who is the pilgrim, the envoy and the dinner, the council, the Kupała night, the inquiry, the letter,
//     the envoy's farewell) with its things (the tray, the letter, the copy) and the remarks after it - into window.TownQuestsPacks;
//     the talks and actions of its steps; the F9 jumps
//   - the envoy and Ostap have their places on floor II (TownLife: "posel_wnetrze" by the Gold suite's fire, "gwardzista_wnetrze" at
//     its door) - Podroznicy's book gives them the Gold suite, which has no guest-room place of its own
//   - Albin and the envoy keep their ferry one longer while the matter goes on (PodroznicyData.OBSADA's `zadania`: a getter, once)
// The hooks the data names, the council's actors, the Kupała night, the traces, the pier, the gate pass and Act III's echoes:
// Poselstwo.js. Event ids 3070-3079 (the core's registry: owner "Poselstwo" 3070-3089 - stage 5's other matters have 3080-3089).

/*:
 * @target MZ
 * @plugindesc [W14] Dane łańcucha „Poselstwo”: Albin (pątnik - zwiadowca), poseł Korony i gwardzista Ostap w Apartamencie Złotym, kolacja „w służbie”, narada, Noc Kupały, śledztwo, list. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @orderAfter Dezerter_Data
 *
 * @help
 * ============================================================================
 * Poselstwo_Data.js - dane łańcucha W14 „Poselstwo” (docs/PODROZNI.md 4.1)
 * ============================================================================
 * Same dane: silnik to Poselstwo.js, teksty js/teksty/poselstwo.txt.
 * Musi stać pod Podroznicy_Data i nad TownLife.js i TownQuests_Data.js.
 * Zadanie W14 trafia do TownQuests przez window.TownQuestsPacks.
 * Numery zdarzeń 3070-3079 (właściciel "Poselstwo"): Lord i Feliks na
 * naradzie, Albin pod Złotym w Noc Kupały (mapa 26), wosk i ślady przy
 * kracie (mapa 25).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Poselstwo_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ who, where, when, how much
    const KTO = { albin: "pielgrzym", posel: "posel", ostap: "gwardzista" };   // (the residents; the book's key of the envoy's group: "posel")
    const MAP = { miasto: 8, karczma: 1, pietro: 25, apartamenty: 26, przystan: 125 };
    const IDS = [3070, 3079], OWNER = "Poselstwo";
    // the injected events: the council's Lord and Feliks in the Great salon, Albin by the Gold suite's door on the Kupała night (Map026);
    // the envoy's wax on the gallery by room 15 and the sandals' prints at the gilded gate (Map025) - the morning after the theft
    const AKTORZY = {
        lord: { id: 3070, map: MAP.apartamenty, x: 32, y: 40, dir: 4, sheet: "$Npc_Lord", index: 0 },
        feliks: { id: 3071, map: MAP.apartamenty, x: 30, y: 43, dir: 8, sheet: "$Npc_Feliks", index: 0 },
        albin: { id: 3072, map: MAP.apartamenty, x: 65, y: 29, dir: 2, sheet: "$Npc_Pielgrzym", index: 0 },
        wosk: { id: 3073, map: MAP.pietro, x: 45, y: 25 },
        krata: { id: 3074, map: MAP.pietro, x: 91, y: 17 }
    };
    // the envoy held in the salon for the council (TownLife.hold); his and Ostap's places on floor II
    const NARADA = { posel: [28, 40], godziny: [21, 22.5] };
    const MIEJSCA = { posel_wnetrze: [65, 40, 4], gwardzista_wnetrze: [66, 30, 2] };
    // the days (from the envoy's arrival P): the council P+1 (41), the theft on the Kupała night (summer's 14th day - 42) when it falls
    // inside his stay, else P+2; Albin by the door 0:30-2:00 after its midnight, the theft at 1:30 when nobody watches; the morning 6:00
    const CZAS = { narada: 1, noc: 2, albin: [0.5, 2], kradziez: 1.5, rano: 6, kolacja: [19.5, 21], sluzba: [19.5, 23], okno: [23, 24], kopia: [21, 4] };
    // the money and the rest (docs/PODROZNI.md 1.6: W14 - 60 G sure)
    const NAGRODA = { gold: 60, renoma: 8, przychylnosc: 10 };
    const KARY = { lordPrzychylnosc: -10, kopiaRenoma: -8, kopiaPrzychylnosc: -10, wyciek: -10, wyciekWskazal: -3 };
    const TROPY = { prog: 3, czujnosc: 6 }, SLADY = { prog: 2, czujnosc: 5 };
    // copying the letter at night: the chance (%) Ostap walks in - lower with Czujność; the hour it takes
    const KOPIA = { ryzyko: 35, naCzujnosc: 3, min: 5, max: 60, godziny: 1 };
    // Act III (docs/PODROZNI.md 4.4): the faction's knowledge (one scout more in wave 3, shared list), the royal soldiers at favour 70
    // with the envoy grateful, one archer more in wave 2 when the letter leaked, wave 3 one man fewer with Albin caught / misled (not
    // added to ansgarAlly)
    const ECHA = { wiedza: ["pielgrzymDonosi"], wdzieczny: 70, wyciekLucznik: "poselstwoWyciek", mniej: ["pielgrzymZlapany", "pielgrzymZwiedziony"] };

    // ------------------------------------------------------------------ the things carried and the remarks (with the quest's pack)
    const VITEMS = {
        taca_kolacja: { icon: 208 },
        list_posla: { icon: 191 },
        kopia_listu: { icon: 191 }
    };
    Watki.scal(VITEMS, "poselstwo", "rzeczy");   // (its words: js/teksty/poselstwo.txt, rzeczy)
    const REMARKS = [
        { id: "w14Wit", who: "kapral", flag: "pielgrzymZlapany" },
        { id: "w14Ambrozy", who: "dzwonnik", flag: "pielgrzymZlapany" },
        { id: "w14Ansgar", who: "rozbitek", flag: "pielgrzymZlapany" }
    ];
    Watki.scal(REMARKS, "poselstwo", "uwagi");   // (its words: js/teksty/poselstwo.txt, uwagi)

    // ------------------------------------------------------------------ the talks of the steps
    // who the pilgrim is (chapter 1 and while he is free): Ambroży, Ansgar the ally, Albin's hand (Czujność 6) - Borgar at the bar (topic)
    const TROPY_ROZMOWY = [
        { kto: "dzwonnik", gdy: ["!stan:tropy.ambrozy", "tropyMniej"], tresc: ["trop.ambrozy", { zrob: "trop", args: ["ambrozy"] }] },
        { kto: "rozbitek", gdy: ["flaga:ansgarAlly", "!stan:tropy.ansgar", "tropyMniej"], tresc: ["trop.ansgar", { zrob: "trop", args: ["ansgar"] }] },
        { kto: KTO.albin, gdy: ["!stan:tropy.palec", "tropyMniej", { hak: "czujnosc", args: [TROPY.czujnosc] }], tresc: ["trop.palec", { zrob: "trop", args: ["palec"] }] }
    ];
    const TEMAT_BORGAR = { kto: "borgar", etykieta: "temat.borgar", gdy: ["!stan:tropy.borgar", "albinJest"], tresc: ["trop.borgar", { zrob: "trop", args: ["borgar"] }] };
    // Wit takes him to the tower (three clues, before he has the letter)
    const WIT = { kto: "kapral", gdy: ["tropyTrzy", "!stan:albin", "albinJest"], tresc: [{ rozmowa: "wit" }] };
    // the dinner on the tray (the envoy: 20:00-21:00 the days he is here)
    const KOLACJA = { kto: KTO.posel, gdy: "v:taca_kolacja", tresc: [{ rozmowa: "kolacja" }] };
    const PRZED_KRADZIEZA = [KOLACJA, WIT].concat(TROPY_ROZMOWY);

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md 2.3a)
    const w = Watki.watek({
        id: "poselstwo", wtyczka: "Poselstwo", teksty: "poselstwo",
        // version 1: the clues of chapter 1 (1 full, 0.5 half - the wall heard with low Czujność), the dinners carried, the day "in
        // service", the council heard, the theft (the day) or prevented, the letter (albin | bohater | posel | lord | ostap), Albin
        // (wieza | zdemaskowany | zwiedziony | puszczony | uciekl), the inquiry's traces, the copy made, the end
        stan: { klucz: "poselstwo", wersja: 1, domyslne: () => ({
            tropy: {}, kolacje: 0, sluzba: 0, narada: 0, naradaDzien: 0, noc: 0, kradziez: 0, zapobiegl: 0, list: "", albin: "", slady: {},
            kopia: 0, oddany: 0, lordWie: 0, koniec: "", ostapPije: 0, rano: 0, widziany: 0 }) },
        // ("@key: ..." - that resident says it: Poselstwo.js finds him)
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 230, czekaj: true },
        zadania: {
            // W14: Albin on the island and met - or the day after he came
            W14: { kind: "W", giver: null, icon: 0,
                start: ["albinJest", { lub: ["albinPoznany", "poPrzyjezdzieAlbina", "poselJest"] }],
                kroki: [
                    // 1 "Kim jest pątnik?": three clues (or the envoy came - the clues still count for Wit and the inquiry)
                    { nazwa: "w14Patnik", ch: 1, gotowe: { lub: ["tropyTrzy", "poselJest"] }, zmienne: "w14Zmienne", rozmowy: PRZED_KRADZIEZA, temat: TEMAT_BORGAR },
                    // 2 "Poseł Korony": the dinner carried once (or the council's evening passed)
                    { nazwa: "w14Posel", ch: 2, gotowe: { lub: ["stan:kolacje>0", "poNaradzie"] }, zmienne: "w14Zmienne", rozmowy: PRZED_KRADZIEZA, temat: TEMAT_BORGAR },
                    // 3 "Narada": heard through the dining room's wall (or its evening passed)
                    { nazwa: "w14Narada", ch: 3, gotowe: { lub: ["naradaSlyszana", "poNaradzie"] }, zmienne: "w14Zmienne", rozmowy: PRZED_KRADZIEZA, temat: TEMAT_BORGAR },
                    // 4 "Noc Kupały" (the turning point): the theft in the morning (prevented / Albin in the tower: the farewell step)
                    { nazwa: "w14Kradziez", ch: 4, gotowe: "stan:kradziez", zmienne: "w14Zmienne", rozmowy: PRZED_KRADZIEZA, temat: TEMAT_BORGAR },
                    // 4 "Śledztwo": two traces - then Albin and his staff (in the tavern or on the pier before his ferry)
                    { nazwa: "w14Sledztwo", ch: 4, gotowe: "v:list_posla", zmienne: "w14Zmienne", nagroda: { xp: 80 },
                        temat: { kto: "borgar", etykieta: "temat.odzwierny", gdy: "!stan:slady.borgar", tresc: ["slad.borgar", { zrob: "slad", args: ["borgar"] }] },
                        rozmowy: [
                            { kto: KTO.albin, gdy: { lub: ["sladyDwa", { i: ["naMolo", "ile:slady>=1"] }] }, tresc: [{ rozmowa: "konfrontacja" }] },
                            { kto: KTO.albin, gdy: ["!stan:slady.kreda", { hak: "czujnosc", args: [SLADY.czujnosc] }], tresc: ["slad.kreda", { zrob: "slad", args: ["kreda"] }] },
                            { kto: KTO.albin, gdy: "naMolo", gotowa: false, znacznik: false, tresc: ["konfrontacja.malo"] }
                        ] },
                    // 5 "Co z listem": the envoy, the Lord, or a copy at night first (Borgar's paper)
                    { nazwa: "w14List", ch: 5, gotowe: "stan:koniec", zmienne: "w14Zmienne",
                        rozmowy: [
                            { kto: KTO.posel, gdy: { lub: ["v:list_posla", "v:kopia_listu"] }, tresc: [{ rozmowa: "posel" }] },
                            { kto: "lord", gdy: { lub: ["v:list_posla", "v:kopia_listu"] }, tresc: [{ rozmowa: "lord" }] }
                        ] },
                    // 5 "Pożegnanie": the quiet way - the theft prevented or Albin in the tower before it; the envoy sails (his thanks)
                    { nazwa: "w14Spokoj", ch: 5, zmienne: "w14Zmienne",
                        rozmowy: [KOLACJA, { kto: KTO.posel, gdy: "poselJest", tresc: [{ rozmowa: "pozegnanie" }] }, WIT] }
                ],
                fail: {} }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        rozmowy: {
            // Wit and the pilgrim (three clues)
            wit: ["wit.wczesnie", { wybor: [
                { etykieta: "wit.opcja.tak", tresc: ["wit.zabral", { zrob: "wieza" }] },
                { etykieta: "wit.opcja.nie", tresc: [] }
            ], anuluj: 1 }],
            // the tray at the envoy's table
            kolacja: ["kolacja.posel", { zrob: "kolacja" }],
            // Albin and his staff: the tower, a false way, let him go
            konfrontacja: ["konfrontacja.albin", { zrob: "list" }, { wybor: [
                { etykieta: "konfrontacja.opcja.straz", tresc: ["konfrontacja.straz", { zrob: "albin", args: ["wieza"] }] },
                { etykieta: "konfrontacja.opcja.zwiedz", tresc: ["konfrontacja.zwiedz", { zrob: "albin", args: ["zwiedziony"] }] },
                { etykieta: "konfrontacja.opcja.pusc", tresc: ["konfrontacja.pusc", { zrob: "albin", args: ["puszczony"] }] }
            ], anuluj: -1 }],
            // the letter: back to the envoy (with or without a copy kept) - or the Lord first
            posel: [{ wybor: [
                { etykieta: "list.opcja.oddaj", gdy: ["v:list_posla", "!v:kopia_listu"], tresc: ["list.posel", { zrob: "oddaj" }] },
                { etykieta: "list.opcja.kopia", gdy: ["v:list_posla", "v:kopia_listu"], tresc: ["list.posel", { zrob: "oddaj" }] },
                { etykieta: "list.opcja.nie", tresc: [] }
            ], anuluj: "ostatnia" }],
            lord: [{ wybor: [
                { etykieta: "list.opcja.lord", gdy: "v:list_posla", tresc: ["list.lord", { zrob: "lord", args: ["list"] }] },
                { etykieta: "list.opcja.lordKopia", gdy: "v:kopia_listu", tresc: ["list.lord", { zrob: "lord", args: ["kopia"] }] },
                { etykieta: "list.opcja.nie", tresc: [] }
            ], anuluj: "ostatnia" }],
            // the envoy's farewell (the quiet way)
            pozegnanie: ["pozegnanie.posel", { zrob: "spokoj" }]
        },
        akcje: {
            trop: [{ hak: "trop", args: [{ arg: 0 }, 1] }],
            slad: [{ hak: "slad", args: [{ arg: 0 }] }],
            wieza: [{ hak: "wieza" }],
            kolacja: [{ hak: "kolacja" }],
            list: [{ hak: "listOdebrany" }],
            albin: [{ hak: "albinLos", args: [{ arg: 0 }] }],
            oddaj: [{ hak: "oddaj" }],
            lord: [{ hak: "lordCzyta", args: [{ arg: 0 }] }],
            spokoj: [{ hak: "koniec", args: ["spokoj"] }]
        },
        // F9 ("Wyspa i fabuła" - the section "Wątek W14"): Albin, the envoy and Ostap on the island, the clues, the day and the place
        f9: { naglowek: "f9.naglowek", etykieta: "f9.etykieta", opis: "f9.opis", brak: "f9.brak", rodzaj: "isleW14" },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w14Patnik", godzina: 10, idz: [MAP.miasto, 33, 19, 8] },
                2: { ch: 2, krok: "w14Posel", godzina: 19.6, idz: [MAP.karczma, 52, 33, 8] },
                3: { ch: 3, krok: "w14Narada", godzina: 20.95, idz: [MAP.apartamenty, 41, 40, 4] },
                4: { ch: 4, krok: "w14Kradziez", godzina: 23.9, idz: [MAP.apartamenty, 62, 28, 6] },
                5: { ch: 4, krok: "w14Sledztwo", godzina: 9, idz: [MAP.pietro, 45, 27, 8] },
                6: { ch: 4, krok: "w14Sledztwo", godzina: 14.2, idz: [MAP.przystan, 20, 16, 4] },
                7: { ch: 5, krok: "w14List", godzina: 10, idz: [MAP.apartamenty, 64, 29, 2] }
            }
        }
    });

    // ------------------------------------------------------------------ TownLife: the envoy and Ostap on floor II (Map026)
    const TLD = window.TownLifeData;
    if (TLD) {
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        TLD.SPOTS_BY_MAP[MAP.apartamenty] = Object.assign({}, MIEJSCA, TLD.SPOTS_BY_MAP[MAP.apartamenty] || {});
    }

    // ------------------------------------------------------------------ Podroznicy: the matter keeps them a ferry longer (once)
    // (as W15's: the list only before the extra ferry and while the chain needs that person - Albin while free and unexposed, the
    // envoy till the chain ends; their leaving after that is the chain's own ending)
    const PD = window.PodroznicyData;
    function sprawaW14(key) {
        try {
            const P = window.Podroznicy, Q = window.TownQuests;
            if (!P || !Q || !window.$gameSystem) return [];
            const e = P.stan().obecni[key], r = Q.rec ? Q.rec("W14") : null;
            if (!e || e.zostal || !r || r.s !== "active" || w.S().koniec) return [];
            if (key === KTO.albin && w.S().albin) return [];
            return ["W14"];
        } catch (e) { return []; }
    }
    if (PD && Array.isArray(PD.OBSADA)) {
        for (const key of [KTO.albin, KTO.posel]) {
            const c = PD.OBSADA.find(x => x.key === key);
            if (c) Object.defineProperty(c, "zadania", { get: () => sprawaW14(key), enumerable: true, configurable: true });
        }
    }

    window.PoselstwoData = { KTO, MAP, IDS, OWNER, AKTORZY, NARADA, MIEJSCA, CZAS, NAGRODA, KARY, TROPY, SLADY, KOPIA, ECHA, VITEMS, REMARKS, TX: w.tx, W14: w.Q.W14, watek: w };
})();
