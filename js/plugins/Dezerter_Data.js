//=============================================================================
// Dezerter_Data.js
//=============================================================================
// The chain W16 "Dezerter" of the ferry's travellers (docs/PODROZNI.md 2.11, 2.12, 4.3 - stage 4, 2026-10-29) - the DATA; the engine:
// Dezerter.js, the words: js/teksty/dezerter.txt. "Tomek" (Tymon Wrzos, a deserter of the royal army from Brzozowa Wola - the
// traveller "dezerter", room 5) comes with the second wave (day 25); Szczerba the bounty hunter (the traveller "lowczyni", room 6)
// comes the ferry after him with a wanted poster: 150 G, ALIVE - she always takes him alive (the user's decision, docs/PODROZNI.md 10.3).
// Stands in the plugin list under SwieteKosci_Data and above TownLife and TownQuests_Data, so that:
//   - the thread "dezerter" (Watki.js) is made before TownQuests_Data: its state (Tawerna.state "dezerter", version 1), the quest W16
//     (four steps, chapters 1-3: who is Tomek, the hunter, the talk at midnight, the plan) with the remarks after it - into
//     window.TownQuestsPacks; the talks and the actions of its steps; the F9 jumps
//   - Tymon and Szczerba keep their ferry one longer while the matter goes on (PodroznicyData.OBSADA's `zadania`: a getter - once,
//     and only while the chain is not settled; their leaving after that is this chain's own ending)
// The endings (docs/PODROZNI.md 4.3): Bełza's garrison (tymonGarnizon), smuggled away by Baltazar or Roch (tymonPrzemyt), hidden
// till she sails - then the camp (tymonOboz), given up for 60 / 80 G (tymonWydany), nothing - she takes him on her night
// (tymonZabrany). The hooks the data names, the night at room 5, the scenes, Act III's echoes: Dezerter.js.
// Event ids 3060-3069 (the core's registry: owner "Lancuchy" 3050-3069 - W15 has 3050-3059): 3060 Tymon in his hiding place, in the
// garrison or in the camp.

/*:
 * @target MZ
 * @plugindesc [W16] Dane łańcucha „Dezerter”: Tomek (Tymon Wrzos), Szczerba - łowczyni nagród, rotmistrz Bełza, przemyt, kryjówki, noc pod pokojem 5. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @orderAfter SwieteKosci_Data
 *
 * @help
 * ============================================================================
 * Dezerter_Data.js - dane łańcucha W16 „Dezerter” (docs/PODROZNI.md 4.3)
 * ============================================================================
 * Same dane: silnik to Dezerter.js, teksty js/teksty/dezerter.txt.
 * Musi stać pod Podroznicy_Data i nad TownLife.js i TownQuests_Data.js.
 * Zadanie W16 trafia do TownQuests przez window.TownQuestsPacks.
 * Numery zdarzeń 3060-3069 (właściciel "Lancuchy"): 3060 - Tymon
 * w kryjówce, w garnizonie albo w obozie.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Dezerter_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ who, where, when, how much
    const KTO = { tymon: "dezerter", szczerba: "lowczyni" };   // (the travellers' keys: Podroznicy_Data's cast = TownLife's residents)
    const MAP = { miasto: 8, pietro: 25, karczma: 1, garnizon: 162, podgrodzie: 111, dzwonnica: 108, dziadek: 19, jar: 3 };
    const IDS = [3060, 3069], OWNER = "Lancuchy";
    // room 5 on the guests' floor: its door (16,48) - Szczerba stands before it on her night (the corridor's cell below)
    const DRZWI = { pokoj: "5", przed: [16, 49, 8] };
    // Tymon outside the tavern's book (event 3060): [map, x, y, direction] - the hiding places (the belfry, grandpa's house, Kruczy
    // Jar between the leaning rocks), the garrison (by the drill ground), the camp (under the wall - or in Podgrodzie when the town
    // shut its gate on it)
    const TYMON = { id: 3060, sheet: "$Npc_Dezerter", index: 0,
        miejsca: { dzwonnica: [MAP.dzwonnica, 6, 5, 2], dziadek: [MAP.dziadek, 16, 7, 2], jar: [MAP.jar, 21, 46, 4],
            garnizon: [MAP.garnizon, 32, 23, 2], oboz: [MAP.miasto, 57, 89, 2], obozPoza: [MAP.podgrodzie, 40, 12, 2] } };
    // the days: the drum on the market the day after his ferry (the recruiter's day after a wave: 26), Szczerba's night - her arrival
    // + 3 (31) or the night the hero showed her the room; the hours of the well (his bandage), midnight's talk, her night at the door,
    // the search on her last day
    const CZAS = { beben: 1, bebenGodziny: [9, 12], studnia: [5.5, 7.2], polnoc: [0, 4.5], noc: 3, nocGodziny: [23, 2], szukanie: 8 };
    // the drum's scene: Tymon is brought to the market by the recruiter's table (garnizon_werbownik 24,46); the hero within `widzi`
    const BEBEN = { tymon: [27, 49], widzi: 10, dymek: 160, przerwa: 30 };
    const CENY = { wskaz: 60, molo: 80, baltazar: 50 };
    // the hiding places: the chance (%) Szczerba finds him on her last day (Ambroży who trusts the hero rings once at a stranger's step)
    const RYZYKO = { dzwonnica: 20, dziadek: 30, jar: 25, ambrozy: -10, min: 5, max: 90 };
    // the garrison's favour: Bełza takes the hero's word at 50; Act III - the royal soldiers come at 60 (not 80) once Tymon serves
    const PRZYCHYLNOSC = { belza: 50, akt3: 60, nagroda: 5 };
    const XP = { trop: 0, spowiedz: 40, garnizon: 250, przemyt: 150, oboz: 200 };
    const RENOMA = { dobrze: 3, zabrany: -2, bezKonca: -2 };
    const OPINIA = { wydany: -4 };
    const SLAWA = 3;
    // trust: two of these and Tymon tells of the banner of Brzozowa Wola (the user's decision, docs/PODROZNI.md 10.4)
    const ZAUFANIE = { prog: 2 };
    const BREAD = 83;
    const TROPY = ["rafal", "darin", "werbownik", "studnia", "beben", "sen"];
    // Act III (docs/PODROZNI.md 4.4): Tymon with the royal soldiers; Tomek of the camp beside Rafał
    const ECHA = {
        garnizon: { key: "tymon", sheet: "Npc_Zolnierz_Walk8", maps: [8], from: "gate", delay: 530, hp: 100, dmg: 11, poise: 26, cd: [80, 110], speed: 3.9, armor: 0.15, swing: "#d8d8e0" },
        oboz: { key: "tymon_oboz", sheet: "Npc_Uchodzca_Walk8", maps: [8], from: "gate", delay: 450, hp: 85, dmg: 10, poise: 24, cd: [80, 110], speed: 3.9, swing: "#b0a090" }
    };

    // ------------------------------------------------------------------ the remarks (with the quest's pack)
    const REMARKS = [
        { id: "w16Ludmila", who: "ludmila", flag: "tymonWydany" },
        { id: "w16Rafal", who: "rafal", flag: "tymonWydany" },
        { id: "w16RafalOboz", who: "rafal", flag: "tymonOboz" },
        { id: "w16Beben", who: "werbownik", flag: "tymonGarnizon" }
    ];
    Watki.scal(REMARKS, "dezerter", "uwagi");   // (its words: js/teksty/dezerter.txt, uwagi)

    // ------------------------------------------------------------------ the talks of the steps
    // who knows Tomek is a soldier (chapter 1, while fewer than two clues): Rafał, Darin, the recruiter, Tomek himself at the well at dawn
    const TROPY_ROZMOWY = [
        { kto: "rafal", gdy: ["!stan:tropy.rafal", "!tropyDwa"], tresc: ["trop.rafal", { zrob: "trop", args: ["rafal"] }] },
        { kto: "uchodzca", gdy: ["!stan:tropy.darin", "!tropyDwa"], tresc: ["trop.darin", { zrob: "trop", args: ["darin"] }] },
        { kto: "werbownik", gdy: ["!stan:tropy.werbownik", "!tropyDwa"], tresc: ["trop.werbownik", { zrob: "trop", args: ["werbownik"] }] },
        { kto: KTO.tymon, gdy: ["!stan:tropy.studnia", "!tropyDwa", { godziny: CZAS.studnia }, "mapa:" + MAP.miasto], znacznik: false,
            tresc: ["trop.studnia", { zrob: "trop", args: ["studnia"] }] }
    ];
    // Szczerba at the door of room 5 on her night (every step: it comes first)
    const NOC = { kto: KTO.szczerba, gdy: "nocTrwa", tresc: [{ rozmowa: "noc" }] };
    // the talk after midnight in room 5 (Szczerba is on the island)
    const SPOWIEDZ = { kto: KTO.tymon, gdy: ["lowczyniJest", { godziny: CZAS.polnoc }, "mapa:" + MAP.pietro], tresc: [{ rozmowa: "spowiedz" }] };
    // the plan: Bełza, away from the island, a hiding place; the lie of the pier (the hero promised him to Szczerba)
    const PLAN = [
        { etykieta: "tymon.opcja.belza", gdy: "!stan:belzaNie", tresc: ["tymon.belza", { zrob: "plan", args: ["garnizon"] }] },
        { etykieta: "tymon.opcja.przemyt", gdy: { lub: ["kantorOtwarty", "rochGotow"] }, tresc: ["tymon.przemyt", { zrob: "plan", args: ["przemyt"] }] },
        { etykieta: "tymon.opcja.ukryj", tresc: ["tymon.ukryj", { wybor: [
            { etykieta: "tymon.gdzie.dzwonnica", tresc: ["tymon.ukryty", { zrob: "ukryj", args: ["dzwonnica"] }] },
            { etykieta: "tymon.gdzie.dziadek", tresc: ["tymon.ukryty", { zrob: "ukryj", args: ["dziadek"] }] },
            { etykieta: "tymon.gdzie.jar", tresc: ["tymon.ukryty", { zrob: "ukryj", args: ["jar"] }] },
            { etykieta: "tymon.gdzie.nie", tresc: ["tymon.nieWiem"] }
        ], anuluj: "ostatnia" }] },
        { etykieta: "tymon.opcja.zdrada", gdy: "stan:plan=molo", tresc: ["tymon.zdrada", { zrob: "zdrada" }, "zdrada.koniec"] },
        { etykieta: "tymon.opcja.nieWiem", tresc: ["tymon.nieWiem", { zrob: "plan", args: [""] }] }
    ];

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md 2.3a)
    const w = Watki.watek({
        id: "dezerter", wtyczka: "Dezerter", teksty: "dezerter",
        // version 1: the clues (1 full, 0.5 half - the wall heard with low Czujność), trust (ostrzezony, odmowil, chleb, spowiedz),
        // the plan (garnizon | przemyt | ukrycie | molo | wydany), the hiding place, Szczerba's night (set: the room shown / F9), her grace
        // (the day of her ferry), the room shown, the cup for Borgar, Bełza's no, the end (garnizon | przemyt | oboz | wydany | molo |
        // zabrany | znaleziony | odplynal), her search (the day, the roll), the banner told, the scenes seen
        stan: { klucz: "dezerter", wersja: 1, domyslne: () => ({
            tropy: {}, zaufanie: {}, plan: "", gdzie: "", noc: 0, zwloka: 0, wskazal: 0, kubek: 0, belzaNie: 0, koniec: "", szukala: 0, los: -1,
            brzozowa: 0, beben: 0, wejscie: 0, przysiega: 0 }) },
        // ("@key: ..." - that resident says it: Dezerter.js finds him)
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 230, czekaj: true },
        zadania: {
            // W16: Tomek on the island and met - or the drum seen, the day after it anyway, or the hunter came
            W16: { kind: "W", giver: null, icon: 0,
                start: ["tymonJest", { lub: ["tymonPoznany", "stan:beben>0", "poBebnie", "lowczyniJest"] }],
                kroki: [
                    // 1 "Tomek z pokoju 5": two clues (or the hunter came: her poster says it)
                    { nazwa: "w16Tomek", ch: 1, gotowe: { lub: ["tropyDwa", "lowczyniJest"] }, zmienne: "w16Zmienne", rozmowy: [NOC].concat(TROPY_ROZMOWY) },
                    // 2 "Łowczyni": Szczerba and her offer (60 G for the room, 80 G for him on the pier) - or the talk at midnight first
                    { nazwa: "w16Lowczyni", ch: 2, zmienne: "w16Zmienne",
                        rozmowy: [NOC, SPOWIEDZ, { kto: KTO.szczerba, gdy: "lowczyniJest", tresc: [{ rozmowa: "szczerba" }] }] },
                    // 2 "Po północy": Tymon tells who he is in room 5 (by day: "not here")
                    { nazwa: "w16Tymon", ch: 2, zmienne: "w16Zmienne",
                        rozmowy: [NOC, SPOWIEDZ, { kto: KTO.tymon, gotowa: false, tresc: [{ rozmowa: "tymonDzien" }] }] },
                    // 3 "Rozwiązanie": Bełza (favour 50), Baltazar (50 G) or Roch, the hiding place - or the hunter's night
                    { nazwa: "w16Plan", ch: 3, zmienne: "w16Zmienne",
                        rozmowy: [NOC,
                            { kto: "rotmistrz", gdy: "stan:plan=garnizon", tresc: [{ rozmowa: "belza" }] },
                            { kto: "kupiec", gdy: ["stan:plan=przemyt", "kantorOtwarty", { godziny: [8, 18] }], tresc: [{ rozmowa: "baltazar" }] },
                            { kto: "przemytnik", gdy: ["stan:plan=przemyt", "rochGotow"], tresc: [{ rozmowa: "roch" }] },
                            { kto: KTO.tymon, gdy: { lub: ["!stan:plan", "stan:plan=molo"] }, tresc: [{ rozmowa: "plan" }] }
                        ] }
                ],
                fail: {} }
        },
        paczka: { remarks: REMARKS },
        rozmowy: {
            // Szczerba: the poster and her offer
            szczerba: ["szczerba.rozmowa", { zmienne: { cena: CENY.wskaz, cena2: CENY.molo }, wybor: [
                { etykieta: "szczerba.opcja.wskaz", tresc: ["szczerba.wskaz", { zrob: "wskaz" }] },
                { etykieta: "szczerba.opcja.molo", tresc: ["szczerba.molo", { zrob: "molo" }] },
                { etykieta: "szczerba.opcja.nie", tresc: ["szczerba.nie", { zrob: "odmowa" }] },
                { etykieta: "szczerba.opcja.pomysle", tresc: ["szczerba.pomysle", { zrob: "pomysle" }] }
            ], anuluj: "ostatnia" }],
            // Tymon by day: "not here"; the warning, the bread, the lie of the pier
            tymonDzien: ["tymon.dzien", { wybor: [
                { etykieta: "tymon.opcja.ostrzez", gdy: ["lowczyniJest", "!stan:zaufanie.ostrzezony"], tresc: ["tymon.ostrzezenie", { zrob: "ufa", args: ["ostrzezony"] }] },
                { etykieta: "tymon.opcja.chleb", gdy: ["maChleb", "!stan:zaufanie.chleb"], tresc: [{ zrob: "chleb" }, "tymon.chleb"] },
                { etykieta: "tymon.opcja.zdrada", gdy: "stan:plan=molo", tresc: ["tymon.zdrada", { zrob: "zdrada" }, "zdrada.koniec"] },
                { etykieta: "tymon.opcja.dobrze", tresc: [] }
            ], anuluj: "ostatnia" }],
            // after midnight: who he is; the banner of Brzozowa Wola - once he trusts the hero; the plan
            spowiedz: [{ zrob: "spowiedz" }, "tymon.spowiedz", { jesli: ["ufaPrzySpowiedzi", "!stan:brzozowa"], to: ["tymon.brzozowa", { zrob: "brzozowa" }] },
                { rozmowa: "plan" }],
            plan: ["tymon.pyta", { wybor: PLAN, anuluj: "ostatnia" }],
            // Bełza (favour 50: the hero's word is enough)
            belza: ["belza.pyta", { jesli: "przychylnoscBelzy", to: ["belza.tak", { zrob: "garnizon" }], inaczej: ["belza.nie", { zrob: "belzaNie" }] }],
            baltazar: ["baltazar.prosba", { zmienne: { cena: CENY.baltazar }, wybor: [
                { etykieta: "baltazar.opcja.tak", tresc: [{ zrob: "przemyt", args: ["baltazar"] }, "baltazar.zaplacone"] },
                { etykieta: "baltazar.opcja.nie", tresc: [] }
            ], anuluj: 1 }],
            roch: ["roch.prosba", { zrob: "przemyt", args: ["roch"] }],
            // the night at room 5: give him time till her ferry, let her take him, walk away
            noc: ["noc.szczerba", { wybor: [
                { etykieta: "noc.opcja.czas", tresc: ["noc.czas", { zrob: "zwloka" }] },
                { etykieta: "noc.opcja.bierz", tresc: ["noc.bierz", { zrob: "oddaj" }] },
                { etykieta: "noc.opcja.odejdz", tresc: [] }
            ], anuluj: "ostatnia" }]
        },
        akcje: {
            trop: [{ hak: "trop", args: [{ arg: 0 }, 1] }],
            ufa: [{ hak: "ufa", args: [{ arg: 0 }] }],
            chleb: [{ hak: "chleb" }],
            spowiedz: [{ hak: "ufa", args: ["spowiedz"] }, { gdy: "krok:w16Lowczyni", zrob: [{ krok: "w16Lowczyni", do: "w16Plan", nagroda: { xp: XP.spowiedz } }, { koniec: true }] },
                { krok: "w16Tymon", nagroda: { xp: XP.spowiedz } }],
            brzozowa: [{ gdy: "stan:brzozowa", koniec: true }, { stan: { brzozowa: "dzis" } }, { flaga: "tymonBrzozowa" }, { notatka: "notatki.brzozowa" }],
            plan: [{ stan: { plan: { arg: 0 } } }, { gdy: "krok:w16Tymon", zrob: [{ krok: "w16Tymon" }] }, { sprawdz: true }],
            ukryj: [{ hak: "ukryj", args: [{ arg: 0 }] }],
            zdrada: [{ hak: "molo" }],
            // Szczerba's offer: the room shown (60 G - she comes tonight), the pier (80 G later), no, "I'll think" (the cup at Borgar's)
            wskaz: [{ hak: "wskaz" }],
            molo: [{ stan: { plan: "molo" } }, { notatka: "notatki.list" }, { krok: "w16Lowczyni" }],
            odmowa: [{ hak: "ufa", args: ["odmowil"] }, { notatka: "notatki.list" }, { krok: "w16Lowczyni" }],
            pomysle: [{ stan: { kubek: "dzis" } }, { notatka: "notatki.list" }, { krok: "w16Lowczyni" }],
            garnizon: [{ hak: "garnizon" }],
            belzaNie: [{ stan: { belzaNie: "dzis", plan: "" } }, { sprawdz: true }],
            przemyt: [{ hak: "przemyt", args: [{ arg: 0 }] }],
            zwloka: [{ hak: "zwloka" }],
            oddaj: [{ hak: "zabierz", args: ["oddal"] }]
        },
        // F9 ("Wyspa i fabuła" - the section "Wątek W16"): Tymon (and from the 2nd jump Szczerba) on the island, the clues, the plan
        f9: { naglowek: "f9.naglowek", etykieta: "f9.etykieta", opis: "f9.opis", brak: "f9.brak", rodzaj: "isleW16" },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w16Tomek", godzina: 6.2, idz: [MAP.miasto, 50, 53, 8] },
                2: { ch: 2, krok: "w16Lowczyni", godzina: 10, idz: [MAP.miasto, 51, 31, 8] },
                3: { ch: 2, krok: "w16Tymon", godzina: 0.5, idz: [MAP.pietro, 14, 40, 8] },
                4: { ch: 2, krok: "w16Tymon", godzina: 23.1, idz: [MAP.pietro, 18, 51, 4] },
                5: { ch: 3, krok: "w16Plan", godzina: 13.5, idz: [MAP.garnizon, 33, 21, 2] },
                6: { ch: 3, krok: "w16Plan", godzina: 10, idz: [MAP.miasto, 16, 50, 8] },
                7: { ch: 3, krok: "w16Plan", godzina: 7.9, idz: [MAP.miasto, 51, 31, 8] }
            }
        }
    });

    // ------------------------------------------------------------------ Podroznicy: the matter keeps them a ferry longer (once)
    // (as W15's: the list only before the extra ferry and while the chain is not settled - the leaving after that is the chain's end)
    const PD = window.PodroznicyData;
    function sprawaW16(key) {
        try {
            const P = window.Podroznicy, Q = window.TownQuests;
            if (!P || !Q || !window.$gameSystem) return [];
            const e = P.stan().obecni[key], r = Q.rec ? Q.rec("W16") : null;
            if (!e || e.zostal || !r || r.s !== "active" || w.S().koniec) return [];
            return ["W16"];
        } catch (e) { return []; }
    }
    if (PD && Array.isArray(PD.OBSADA)) {
        for (const key of [KTO.tymon, KTO.szczerba]) {
            const c = PD.OBSADA.find(x => x.key === key);
            if (c) Object.defineProperty(c, "zadania", { get: () => sprawaW16(key), enumerable: true, configurable: true });
        }
    }

    window.DezerterData = { KTO, MAP, IDS, OWNER, DRZWI, TYMON, CZAS, BEBEN, CENY, RYZYKO, PRZYCHYLNOSC, XP, RENOMA, OPINIA, SLAWA, ZAUFANIE, BREAD, TROPY, ECHA,
        REMARKS, TX: w.tx, W16: w.Q.W16, watek: w };
})();
