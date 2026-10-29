//=============================================================================
// Wrak_Data.js
//=============================================================================
// PAKIET E (docs/miejsca_wyspy/PAKIETY.md, koncepcja docs/miejsca_wyspy/KONCEPCJA.md punkt 7) - the data of: Wrak na mieliźnie
// (maps 165 "Wrak na mieliźnie", 166 "Wrak - pod pokładem") and the castaway in the tavern.
// Registered in js/plugins.js under Wyspa_Data, above TownLife and TownQuests (package 0), so what it puts into the shared tables
// is there before their engines read them:
//   - window.TownLifeExtra: the castaway "Eryk Sowa" (really Ansgar Wiel, the cartographer of "Biała Źrenica"), fixed id 948, key
//     "rozbitek"; he lives by the town's plan (Map008) - breakfast, drawing and evenings in the tavern (Map001 untouched: his seat is
//     TownLifeData.SPOTS_BY_MAP[1].gosc_9), the market, the walls, the well at night, sleeps in the guest rooms (Map025 untouched:
//     SPOTS_BY_MAP[25].rozbitek_wnetrze)
//   - the thread "wrak" (Watki.js, 2026-10-28): the state, D25 "Mapa z wraku" (Roch gives it from day 15, or it starts by itself on
//     the wreck), W12 "Rozbitek" (starts with the first clue: five clues, two are enough; the talk "in private" with four ways out)
//     with their steps, talks and actions (into window.TownQuestsPacks with the things of both - vitems - and the residents' remarks
//     after what happened); the castaway's first meeting, Józek Łata's clue. The hooks: Wrak.js
//   - window.WrakData: the package's own tables for Wrak.js (the tides on the two maps, the boat, the soldiers, the seven marks of
//     the chart, the texts)

/*:
 * @target MZ
 * @plugindesc [pakiet E] Dane: Wrak na mieliźnie (mapy 165, 166), rozbitek Eryk Sowa (948), zadania D25 „Mapa z wraku” i W12 „Rozbitek”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Wyspa_Data
 *
 * @help
 * ============================================================================
 * Wrak_Data.js - dane pakietu E: wrak na mieliźnie i rozbitek w tawernie
 * ============================================================================
 * Mieszkaniec: rozbitek „Eryk Sowa” (numer 948) - rano i wieczorem w tawernie
 * (wolny stołek przy stole, miejsce gosc_9 z danych), w południe na rynku,
 * pod wieczór na murach, nocą przy studni, śpi w Pokojach gości.
 * Zadania: D25 „Mapa z wraku” (od dnia 15, od Rocha; albo samo na wraku),
 * W12 „Rozbitek” (poszlaki: dwie z pięciu, potem rozmowa w cztery oczy).
 * Silnik: Wrak.js. Zasady pakietów: docs/miejsca_wyspy/PAKIETY.md.
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = 165, UNDER = 166;

    // ------------------------------------------------------------------ the tides on the package's maps: region -> the level (0 low
    // water .. 1 high) from which its cells are under water; "low" = everything but the low water (Wyspa.tide().low, switch 20)
    const FLOOD = {
        165: { 61: "low", 62: 0.45, 63: 0.75 },
        166: { 64: 0.45, 65: 0.2 }
    };

    // ------------------------------------------------------------------ the castaway
    const RES = { key: "rozbitek", id: 948 };
    const SPOTS_TOWN = {   // Map008 (the town's spots; new keys only)
        rozbitek_noc: [51, 17, 8],        // (the tavern's gate: he goes in to sleep upstairs)
        rozbitek_rynek: [56, 51, 2],      // the market, the far side from the money changer's
        rozbitek_mury: [30, 19, 4],        // under the west wall, looking towards the sea
        rozbitek_studnia: [52, 50, 4]     // the market well at night (the sleeve rolled up - W12's clue)
    };
    const SPOT_TAVERN = [61, 33, 4];      // Map001: the free stool at the right-hand table (gosc_9 - Map001 unchanged)
    const SPOT_ROOMS = [6, 38, 4];        // Map025: room 7, by the narrow bed (Map025 unchanged)

    const resident = {
        key: RES.key, id: RES.id, sheet: "$Npc_Rozbitek", speed: 3,
        plan: [[0, "inside", "rozbitek_noc"], [8, "inside", "tawerna"], [10, "wander", "rozbitek_rynek"], [13, "inside", "tawerna"],
               [17, "stand", "rozbitek_mury"], [19, "inside", "tawerna"], [22, "work", "rozbitek_studnia"], [23, "inside", "rozbitek_noc"]],
        barks: {
        },
        talk: {
        }
    };
    Watki.scal(resident, "wrak", "mieszkaniec");   // (its words: js/teksty/wrak.txt, mieszkaniec)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(resident);
    const TLD = window.TownLifeData;
    if (TLD) {
        if (TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_TOWN)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        // (gosc_9: the tavern's next guest seat - Wrak.js checks the number once TownLife has counted its guests)
        TLD.SPOTS_BY_MAP[1] = Object.assign({}, { gosc_9: SPOT_TAVERN }, TLD.SPOTS_BY_MAP[1] || {});
        TLD.SPOTS_BY_MAP[25] = Object.assign({}, TLD.SPOTS_BY_MAP[25] || {}, { rozbitek_wnetrze: SPOT_ROOMS });
    }

    // ------------------------------------------------------------------ the things carried and the remarks (they go with the quests'
    // pack - the thread below)
    const ICON = { map: 190, log: 189, key: 196, coins: 208, stone: 319, paper: 191 };
    const VITEMS = {
        dziennik_okretu: { icon: ICON.log },
        klucz_bosmana: { icon: ICON.key },
        kamien_kruk: { icon: ICON.stone },
        monety_oko: { icon: ICON.coins },
        falszywa_mapa: { icon: ICON.paper },
        mapa_ansgara: { icon: ICON.map },
        portret: { icon: ICON.paper }
    };
    Watki.scal(VITEMS, "wrak", "rzeczy");   // (its words: js/teksty/wrak.txt, rzeczy)
    const REMARKS = [
        { id: "wrakJanek", who: "janek", flag: "wrakByl" },
        { id: "wrakRoch", who: "przemytnik", flag: "dziennikOkretu" },
        { id: "ansgarMelia", who: "melia", flag: "ansgarGiven" },
        { id: "ansgarCelnik", who: "celnik", flag: "ansgarGiven" },
        { id: "ansgarFledRoch", who: "przemytnik", flag: "ansgarFled" },
        { id: "ansgarAllyMelia", who: "melia", flag: "ansgarAlly" }
    ];
    Watki.scal(REMARKS, "wrak", "uwagi");   // (its words: js/teksty/wrak.txt, uwagi)

    // ------------------------------------------------------------------ the seven marks of the chart from the captain's cabin
    // (item 178): the white eyes. `ready`: a place of another package - only once Wyspa.isReady(map)
    const MARKS = [
        { key: "tawerna", map: 8, x: 51, y: 18 },
        { key: "kamieniolom", map: 13, x: 40, y: 18 },
        { key: "latarnia", map: 159, ready: 159 },
        { key: "pustelnia", map: 155, ready: 155 },
        { key: "urwisko", map: 157, ready: 157 },
        { key: "kopiec", map: 20, x: 8, y: 7 },
        { key: "dwor", map: 24, x: 20, y: 13 }
    ];
    Watki.scal(MARKS, "wrak", "znaki");   // (its words: js/teksty/wrak.txt, znaki)

    // ------------------------------------------------------------------ W12's clues
    const CLUES = {
        dziennik: { },
        jozek: { },
        wizja: { },
        tatuaz: { },
        list: { },
        kartograf: { }   // (2026-10-29, docs/PODROZNI.md D40: Teofil Cyrkiel knows the hand of the wreck's map)
    };
    Watki.scal(CLUES, "wrak", "poszlaki");   // (its words: js/teksty/wrak.txt, poszlaki)
    const CLUE_PATHS = Object.keys(CLUES).map(k => "clues." + k).join("+");   // (how many clues found: "ile:" of these paths)

    // the five raven stones of the captain's chest (D25's end): the customs man pays 5 G a piece, Baltazar 15; W12's rewards
    const STONES = { celnik: 5, kupiec: 15, n: 5 };
    const W12_GOLD = { given: 80, sold: 100 }, W12_XP = { given: 150, ally: 200, fled: 250, double: 200 };

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md, 2026-10-28)
    // the state "wrak" (the wreck's visits and loot, Janek's boat, the soldiers, the chart's marks, the castaway), D25 and W12 (their
    // words: zadania.*; the engine puts them into window.TownQuestsPacks with the things and the remarks), the talks of their steps,
    // the castaway's first meeting and Józek Łata's clue, their actions. The rest (the tide, the boat, the soldiers, the loot, the
    // menus) and the hooks: Wrak.js
    const w = Watki.watek({
        id: "wrak", wtyczka: "Wrak", teksty: "wrak",
        stan: { klucz: "wrak", wersja: 1, domyslne: () => ({
            been: 0, under: 0, key: 0, door: 0, desk: 0, chest: 0,      // the wreck: first visits, the key, the cabin
            boat: null, boatWarned: 0,                                   // Janek's boat at the wreck: { until (absolute hour) }
            fined: 0, glejtSeen: 0, ratsDay: 0, lowWarn: -1, floodTold: -1,
            marks: {}, marksNoted: 0,                                    // the chart's white eyes visited (key -> day)
            met: 0, portraits: 0, clues: {}, tatuazTry: 0, jozekTold: 0, w12: "", raid: 0, raidRoll: 1, raidDone: 0, janekAsked: 0, usualN: 0
        }) },
        // ("\n" starts a new line; "@key: ..." - that resident says it: Wrak.js finds him)
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        zadania: {
            // D25: from Roch (day 15, once the wreck's map is built), or by itself on the first visit; the wreck, the boatswain's key, the
            // cabin (desk and chest - Wrak.act), then the five raven stones: the customs man, Baltazar (8-18), grandpa or Kleofas (kept)
            D25: { kind: "D", giver: "przemytnik", icon: ICON.map,
                offer: { cond: { day: 15, hours: [6, 21], flags: ["rochMet"], noFlags: ["d20Wydany"], fn: "d25Ready" } }, oferta: "zbudowany",
                autoStart: "d25Auto", start: "stan:been>0",
                kroki: [
                    { nazwa: "d25Wrak", gotowe: "stan:been>0" },
                    { nazwa: "d25Klucz", gotowe: "stan:key>0" },
                    { nazwa: "d25Kajuta", gotowe: ["stan:desk>0", "stan:chest>0"] },
                    { nazwa: "d25Kamienie", haki: { act: "kamienieFx" }, rozmowy: [
                        { kto: "celnik", gdy: "kamienie", tresc: [{ rozmowa: "kamienieCelnik" }] },
                        { kto: "kupiec", gdy: ["kamienie", { godziny: [8, 18] }], tresc: [{ rozmowa: "kamienieKupiec" }] },
                        { kto: "grandpa", gdy: "kamienie", tresc: [{ rozmowa: "kamienieDziadek" }] },
                        { kto: "pustelnik", gdy: "kamienie", tresc: [{ rozmowa: "kamieniePustelnik" }] }
                    ] }
                ],
                reward: { xp: 100 } },
            // W12: the castaway met and a first clue - it starts; two clues of five; the talk in private (in the tavern, the market or the
            // walls); with the false map: Baltazar (8-18)
            W12: { kind: "W", giver: RES.key, icon: ICON.paper, autoStart: "w12Auto", start: ["stan:met>0", "ile:" + CLUE_PATHS + ">=1"],
                kroki: [
                    { nazwa: "w12Poszlaki", ch: 1, gotowe: "ile:" + CLUE_PATHS + ">=2", zmienne: { n: { ile: CLUE_PATHS, najwyzej: 2 } } },
                    { nazwa: "w12Talk", ch: 2, haki: { act: "w12Fx" }, rozmowy: [{ kto: RES.key, tresc: [{ rozmowa: "w12" }] }] },
                    { nazwa: "w12Map", ch: 3, haki: { act: "w12MapFx" }, rozmowy: [
                        { kto: "kupiec", gdy: ["v:falszywa_mapa", { godziny: [8, 18] }], tresc: ["w12Sale", { zrob: "w12Sprzedaj" }] }] }
                ] }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        rozmowy: {
            // the castaway's first meeting ("Portret? Dwa grosze albo piwo."; the portrait: Wrak.act - its lines come from the code)
            poznanie: ["erykMeet", "eryk.rysujemy", { zrob: "poznal" }, { wybor: [
                { etykieta: "eryk.narysuj", tresc: [{ skrypt: "Wrak.act(this, [\"portrait\"])" }] },
                { etykieta: "eryk.innymRazem", tresc: ["eryk.jakChcesz"] }
            ], anuluj: 1 }],
            // Józek Łata in Podgrodzie: the grey coat and the coin with the eye (W12's clue)
            jozek: ["jozek", { zrob: "poszlakaJozka" }],
            // D25: the raven stones - the customs man, Baltazar, grandpa, Kleofas
            kamienieCelnik: ["stonesAsk", "stonesCelnik", "kamienie.celnik.pytanie", { wybor: [
                { etykieta: "kamienie.celnik.oddaj", tresc: [{ zrob: "kamienieCelnik" }, "stonesCelnikDone"] },
                { etykieta: "kamienie.celnik.nie", tresc: [] }
            ], anuluj: 1 }],
            kamienieKupiec: ["stonesAsk", "stonesKupiec", "kamienie.kupiec.pytanie", { wybor: [
                { etykieta: "kamienie.kupiec.sprzedaj", tresc: [{ zrob: "kamienieKupiec" }, "stonesKupiecDone"] },
                { etykieta: "kamienie.kupiec.nie", tresc: [] }
            ], anuluj: 1 }],
            kamienieDziadek: ["stonesGrandpa", "kamienie.pytanie", { wybor: [
                { etykieta: "kamienie.dziadek.zatrzymam", tresc: [{ zrob: "kamienieZatrzymane", args: ["grandpa"] }, "stonesKeep"] },
                { etykieta: "kamienie.dziadek.nie", tresc: [] }
            ], anuluj: 1 }],
            kamieniePustelnik: ["stonesPustelnik", "kamienie.pytanie", { wybor: [
                { etykieta: "kamienie.pustelnik.zatrzymam", tresc: [{ zrob: "kamienieZatrzymane", args: ["pustelnik"] }, "kamienie.pustelnik.madrze"] },
                { etykieta: "kamienie.pustelnik.nie", tresc: [] }
            ], anuluj: 1 }],
            // W12: the talk in private - his answer first, then the choice takes effect ("given" sends him away); fleeing on Roch's cutter
            // only after D20's help (and Roch not given up)
            w12: ["w12Open", { wybor: [
                { etykieta: "w12.opcja.wydam", tresc: ["w12Given", { zrob: "w12Wydaj" }] },
                { etykieta: "w12.opcja.zachowam", tresc: ["w12Ally", { zrob: "w12Zachowaj" }] },
                { etykieta: "w12.opcja.ucieczka", gdy: ["flaga:d20Pomoc", "!flaga:d20Wydany"], tresc: ["w12Fled", { zrob: "w12Ucieczka" }] },
                { etykieta: "w12.opcja.mapa", tresc: ["w12Double", { zrob: "w12Podwojna" }] },
                { etykieta: "w12.opcja.nieWiem", tresc: ["w12Later"] }
            ], anuluj: "ostatnia" }]
        },
        // (Wrak.act's old names - met, clue; TownQuests.act's "fx" of d25Kamienie / w12Talk / w12Map - a talk saved before 2026-10-28:
        // Wrak.js sends them here; "odswiez": the quests' markers after a flag, as the plugin's setFlag did)
        akcje: {
            poznal: [{ gdy: "stan:met", koniec: true }, { stan: { met: "dzis" } }, { notatka: "notatki.eryk" }, { sprawdz: true }],
            poszlakaJozka: [{ stan: { jozekTold: "dzis" } }, { hak: "poszlaka", args: ["jozek"] }],
            // D25: the stones given to the customs man / sold to Baltazar / kept (args: who - grandpa or Kleofas)
            kamienieCelnik: [{ gdy: ["krok:d25Kamienie", "kamienie"], zrob: [{ hak: "zabierz", args: ["kamien_kruk", STONES.n] }, { flaga: "wrakKamienieCelnik" },
                { hak: "odswiez" }, { notatka: "notatki.kamienieCelnik" }, { krok: "d25Kamienie", nagroda: { gold: STONES.celnik * STONES.n } }] }],
            kamienieKupiec: [{ gdy: ["krok:d25Kamienie", "kamienie"], zrob: [{ hak: "zabierz", args: ["kamien_kruk", STONES.n] }, { flaga: "wrakKamienieBaltazar" },
                { hak: "odswiez" }, { notatka: "notatki.kamienieBaltazar" }, { krok: "d25Kamienie", nagroda: { gold: STONES.kupiec * STONES.n } }] }],
            kamienieZatrzymane: [{ gdy: ["krok:d25Kamienie", "kamienie"], zrob: [{ flaga: "wrakKamienieZatrzymane" }, { hak: "odswiez" },
                { gdy: "ctx:args.0=pustelnik", zrob: [{ notatka: "notatki.kamienieKleofas" }] }, { gdy: "!ctx:args.0=pustelnik", zrob: [{ notatka: "notatki.kamienieDziadek" }] },
                { krok: "d25Kamienie" }] }],
            // W12: given to the garrison, kept, fled on Roch's cutter, the false map; the false map sold to Baltazar (his men may come at night)
            w12Wydaj: [{ gdy: "!krok:w12Talk", koniec: true }, { stan: { w12: "given" } }, { flaga: "ansgarGiven" }, { hak: "odswiez" }, { hak: "rozbitekOdchodzi" },
                { hak: "garnizon", args: [20, "powody.wydany"] }, { notatka: "notatki.wydany" }, { hak: "zakoncz", args: ["W12", { gold: W12_GOLD.given, xp: W12_XP.given }] }],
            w12Zachowaj: [{ gdy: "!krok:w12Talk", koniec: true }, { stan: { w12: "ally" } }, { flaga: "ansgarAlly" }, { hak: "odswiez" }, { notatka: "notatki.zostaje" },
                { hak: "zakoncz", args: ["W12", { xp: W12_XP.ally }] }],
            w12Ucieczka: [{ gdy: "!krok:w12Talk", koniec: true }, { stan: { w12: "fled" } }, { flaga: "ansgarFled" }, { hak: "odswiez" }, { v: ["mapa_ansgara", 1] },
                { hak: "rozbitekOdchodzi" }, { notatka: "notatki.odplynal" }, { hak: "zakoncz", args: ["W12", { xp: W12_XP.fled }] }],
            w12Podwojna: [{ gdy: "!krok:w12Talk", koniec: true }, { stan: { w12: "double" } }, { flaga: "wrakPodwojnaGra" }, { hak: "odswiez" }, { v: ["falszywa_mapa", 1] },
                { notatka: "notatki.falszywaMapa" }, { krok: "w12Talk" }],
            w12Sprzedaj: [{ gdy: ["krok:w12Map", "v:falszywa_mapa"], zrob: [{ hak: "zabierz", args: ["falszywa_mapa", 1] }, { flaga: "wrakMapaSprzedana" }, { hak: "odswiez" },
                { hak: "zemsta" }, { notatka: "notatki.mapaSprzedana" }, { hak: "zakoncz", args: ["W12", { gold: W12_GOLD.sold, xp: W12_XP.double }] }] }]
        }
    });

    window.WrakData = {
        MAP, UNDER, IDS: [670, 679], OWNER: "Wrak", FLOOD, RES, SPOTS_TOWN, SPOT_TAVERN, SPOT_ROOMS, MARKS, CLUES, ICON, ITEM_MAP: 178,
        // Janek's boat: from the harbour by day (no storm), after his "Pierwszy połów" (K47); he waits two hours by the wreck
        BOAT: { from: 15, hours: [8, 17], wait: 2, harbour: [12, 7, 6], landing: [35, 18, 2], boat: [35, 17], janek: [36, 18, 4], needQuest: "K47" },
        // the garrison's soldiers with their rescue boat (9-15, not in a storm): without the pass (flag glejtWrak) the fine
        SOLDIERS: { hours: [9, 15], see: 4.5, seeSneak: 2.2, fine: 20, favor: -10, sheet: "$Npc_Straznik", sheetKing: "$Npc_Zolnierz",
            boat: [23, 26], men: [[21, 18, 8], [25, 18, 4]] },
        BREACH: [17, 15], UNDER_LANDING: [4, 11, 8], EDGE_LAND: [[78, 20], [78, 21]],   /* (2026-10-18: the wreck's map doubled to 80x60) */
        RAT: { at: [14, 6], max: 3, level: 1 },
        STONES, W12_GOLD, W12_XP,
        RAID: { after: [5, 9], chance: 0.35 }
    };
})();
