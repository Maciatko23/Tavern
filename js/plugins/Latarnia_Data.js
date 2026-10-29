//=============================================================================
// Latarnia_Data.js
//=============================================================================
// PAKIET C (docs/miejsca_wyspy/PAKIETY.md, koncepcja docs/miejsca_wyspy/KONCEPCJA.md punkt 5, zatwierdzona 2026-10-16) - the data of
// "Przylądek z latarnią" (Map159), "Izba latarnika" (Map160) and "Laterna" (Map161): the keeper Bazyli Krzesiwo, the sea fog at
// night, the lens (the Order's "Oko Strażnicy" ground from a crystal of the First - NOT a shard of the Heart) and its visions.
// Only data and texts - the engine is Latarnia.js.
//   - window.TownLifeExtra: the resident "latarnik" (fixed id 943) living on Map159 - asleep in his room by day, chopping wood in the
//     afternoon, up in the lantern room from dusk to dawn (the engine moves the hours of his plan with the sun: Sky.sunTimes); where
//     he is shown indoors (Map160 / Map161) is a GETTER in TownLifeData.SPOTS_BY_MAP - he stands only in the room his plan has him in
//   - the thread "latarnia" (Watki.js, 2026-10-28): the state, K49 "Tran dla latarni", D22 "Księga mgieł", W11 "Soczewka" with their
//     talks and actions (into window.TownQuestsPacks with the things carried - the lens -, the remarks and the gossip)
//   - window.LatarniaData: the fog, the fuel, the visions, the raid, his own talk, the epilogue lines (for the integration)
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): the sea here is salt and red (<Water:salt>); nothing here gives the hero water. The lighthouse does NOT
// delay the ferry (the user's decision 14).

/*:
 * @target MZ
 * @plugindesc [pakiet C] Dane: przylądek z latarnią (mapy 159-161), latarnik Bazyli, mgła morska, soczewka i wizje, K49, D22, W11. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet C - dane miejsca (silnik: Latarnia.js).
 * Mieszkaniec: latarnik Bazyli Krzesiwo (numer 943) na mapach 159-161.
 * Zadania: K49 „Tran dla latarni”, D22 „Księga mgieł”, W11 „Soczewka”.
 * Numery zdarzeń 630-639. Test: tests/latarnia_test.js (port 9503).
 */

(() => {
    "use strict";

    const MAP = 159, IZBA = 160, LATERNA = 161;
    const ITEM = { tran: 177, wood: 61, charcoal: 79, pendant: 172, rope: 0, herring: 173, cod: 174, tar: 176 };
    const L = () => window.Latarnia || null;

    // ------------------------------------------------------------------ the resident: Bazyli Krzesiwo
    // Plan (KONCEPCJA 5): dawn-8 puts the fire out and writes in the Book of Fogs (the lantern room, then his room), 8-15 asleep in his
    // room (away: the door bolted), 15-17 chops wood and carries fuel, 17-dusk eats and cleans the lens (his room), dusk-dawn by the
    // fire up in the lantern room (in a fog he rings the fog bell every hour - its rope runs down from the gallery). The hours of
    // dawn and dusk are the sun's of the day: Latarnia.js puts them into this same array each day (Sky.sunTimes).
    const PLAN = [[0, "inside", "laterna"], [6.4, "inside", "izba"], [8, "inside", "izba_sen"],
                  [15, "work", "drewutnia"], [17, "inside", "izba"], [20.3, "inside", "laterna"]];
    const RESIDENT = {
        key: "latarnik", id: 943, sheet: "$Npc_Latarnik", map: MAP, speed: 2,
        away: ["izba_sen"],
        plan: PLAN,
        barks: {
        },
        talk: {
        }
    };
    Watki.scal(RESIDENT, "latarnia", "mieszkaniec");   // (its words: js/teksty/latarnia.txt, mieszkaniec)
    (window.TownLifeExtra = window.TownLifeExtra || []).push(RESIDENT);
    // where he stands: the map's "Miejsce:" events win on Map159 (tools/latarnia/build.py puts them there); indoors only the room his
    // plan has him in now (a getter: TownLife reads it when the map loads - then always there, the engine decides who is shown - and
    // every frame indoors)
    const INDOOR = { 160: { place: "izba", at: [5, 7, 8] }, 161: { place: "laterna", at: [6, 5, 4] } };
    const TLD = window.TownLifeData;
    if (TLD && TLD.SPOTS_BY_MAP) {
        TLD.SPOTS_BY_MAP[MAP] = Object.assign({ laterna: [22, 10, 8], izba: [15, 19, 8], izba_sen: [15, 19, 8], drewutnia: [25, 19, 6] },
            TLD.SPOTS_BY_MAP[MAP] || {});
        for (const [mid, o] of Object.entries(INDOOR)) {
            const spots = TLD.SPOTS_BY_MAP[mid] = TLD.SPOTS_BY_MAP[mid] || {};
            Object.defineProperty(spots, "latarnik_wnetrze", { enumerable: true, configurable: true,
                get() { const l = L(); return l && l.indoorSpot ? l.indoorSpot(Number(mid)) : o.at; } });
        }
    }

    // ------------------------------------------------------------------ the fuel of the lighthouse (nights of fire)
    const FUEL = {
        start: 7, max: 20, perNight: 1,
        ferry: 4, ferryUntil: 24,          // (the ferry brings oil until the second wave - day 24: then war, the army takes all that burns)
        chop: 0.25,                        // (Bazyli's own driftwood, a day)
        value: { 177: 1, 79: 0.5, 61: 0.25 },
        price: { 177: 6, 79: 4, 61: 2 },
        sellMax: 10                        // (of each kind a day)
    };
    const FOG = { at: 0.6 };               // Sky.mistOfDay(the next morning) >= 0.6: the sea fog comes in at night

    // ------------------------------------------------------------------ the visions in the lens (D22): one a night, in a fog
    // pic: img/pictures/<pic>.png (PixelLab, tools/latarnia/art/build_art.py); line: the one sentence on the white board; note: the
    // journal's chapter of "Księga mgieł"; flag: set when seen (TownQuests flags: "mgla" is the contract's - Wrak.js W12 reads it)
    const VISIONS = [
        { n: 1, pic: "Latarnia_Wizja_1", flag: "latarniaWizja1" },
        { n: 2, pic: "Latarnia_Wizja_2", flag: "mgla" },
        { n: 3, pic: "Latarnia_Wizja_3", flag: "latarniaWizja3" }
    ];
    Watki.scal(VISIONS, "latarnia", "wizje");   // (its words: js/teksty/latarnia.txt, wizje)
    // "Ciężka głowa" the next morning: the cost of the stamina works (Survival.defineBuff) until noon; Hart ducha takes off a part of it
    const HEAVY = { key: "ciezkaGlowa", icon: 6, cost: 1.2, until: 12, power: 0.15 };
    Watki.scal(HEAVY, "latarnia", "bufor");   // (its words: js/teksty/latarnia.txt, bufor)

    // ------------------------------------------------------------------ W11: the raid on the lighthouse, the thieves
    const RAID = { after: 1, from: 0.5, until: 3, kinds: ["bandit", "knifer", "bandit"], inside: ["bandit", "knifer"], tag: "latarniaNapad",
        thieves: ["bandit", "bandit", "archer"], thievesTag: "latarniaZlodzieje", buyBack: 150, sale: 400 };

    // ------------------------------------------------------------------ Bazyli's own talk
    const TX = Watki.teksty("latarnia");

    // ------------------------------------------------------------------ the things carried, the remarks, the gossip (they go with the
    // quests' pack)
    const VITEMS = {
        soczewka: { icon: 176 }
    };
    Watki.scal(VITEMS, "latarnia", "rzeczy");   // (its words: js/teksty/latarnia.txt, rzeczy)
    const REMARKS = [
        { id: "latJanekOgien", who: "janek", flag: "latarniaZgasla" },
        { id: "latCelnik", who: "celnik", flag: "latarnikMet" },
        { id: "latRoch", who: "przemytnik", flag: "latarniaUfa" },
        { id: "latKleofas", who: "pustelnik", flag: "latarniaObroniona" }
    ];
    Watki.scal(REMARKS, "latarnia", "uwagi");   // (its words: js/teksty/latarnia.txt, uwagi)
    const GOSSIP = { latarnik: [] };
    Watki.scal(GOSSIP, "latarnia", "plotki");   // (its words: js/teksty/latarnia.txt, plotki)

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md): the state
    // "latarnia", the quests K49 "Tran dla latarni", D22 "Księga mgieł", W11 "Soczewka" (their words: js/teksty/latarnia.txt, zadania.*;
    // the engine puts them into window.TownQuestsPacks with the things, the remarks and the gossip), the talks of their steps, Bazyli's
    // first meeting. The hooks (the fog, the Kantor's hours, the raid's night, the payments...) are Latarnia.js's
    const w = Watki.watek({
        id: "latarnia", wtyczka: "Latarnia", teksty: "latarnia",
        // what the lighthouse itself remembers (the quests' records and flags are TownQuests')
        stan: { klucz: "latarnia", wersja: 1, domyslne: () => ({
            met: 0, fuel: FUEL.start, gainDay: 0, burnDay: 0, nights: {}, sold: { day: 0, n: {} }, weatherDay: 0, bookN: 0, usualN: 0,
            visions: {}, visionNight: -99, lens: "whole", wreck: 0, janek: { day: 0, n: 0 }, raid: null, told: "", trust: 0, out: 0
        }) },
        mowa: { akapity: true },
        zadania: {
            // K49: from day 25 (the ferry brings no oil since the second wave - its ferry, docs/PODROZNI.md 5.1) - the oil and the wood on
            // the hand: the nights of fire
            K49: { kind: "K", giver: "latarnik", icon: 176, offer: { cond: { day: 25, flags: ["latarnikMet"] } },
                kroki: [{ nazwa: "k49Paliwo", type: "bring", to: "latarnik", need: [[177, 4], [61, 6]], haki: { hand: "k49Paliwo" } }],
                reward: { gold: 30, xp: 60, flag: "latarniaUfa" } },
            // D22: offered in a fog, or the afternoon before a fog night; three visions in the lens, then Bazyli asks what was seen
            D22: { kind: "D", giver: "latarnik", icon: 189, offer: { cond: { flags: ["latarnikMet"], fn: "d22Ready" } },
                oferta: ["stan:met", { lub: ["mglaTeraz", { i: ["mglaDzis", { godziny: [12, 24] }] }] }],
                kroki: [
                    { nazwa: "d22Wizje", gotowe: "ile:visions>=" + VISIONS.length, zmienne: { n: { ile: "visions" }, kiedy: { hak: "kiedyMgla" } } },
                    { nazwa: "d22Koniec", rozmowy: [{ kto: "latarnik", tresc: ["d22.pyta", { wybor: [
                        { etykieta: "d22.powiem", tresc: ["d22.powiedzial", { zrob: "d22Powiem" }] },
                        { etykieta: "d22.zachowam", tresc: ["d22.zachowal", { zrob: "d22Zachowam" }] }
                    ], anuluj: -1 }] }] }
                ],
                reward: { gold: 60, xp: 120, flag: "kronikaKarta5" } },
            // W11 (Act II, once Bazyli is met, from day 25): Baltazar's offer, the warning, the raid's night, the thieves or the buy-back,
            // brother Kleofas reads the lens, the choice (leave / break / sell), the sale
            W11: { kind: "W", giver: null, icon: 0, autoStart: "w11Auto", start: ["aktDrugi", "stan:met", { hak: "odDnia", args: [25] }],
                kroki: [
                    { nazwa: "w11Oferta", ch: 1, rozmowy: [{ kto: "kupiec", gdy: "kantorOtwarty", tresc: ["baltazar", { wybor: [
                        { etykieta: "w11.nieSprzedam", tresc: [{ hak: "bezPierwszej", args: ["baltazarNo"] }, { zrob: "w11Odmowa" }] },
                        { etykieta: "w11.pomysle", tresc: [{ hak: "bezPierwszej", args: ["baltazarMaybe"] }, { zrob: "w11Pomysle" }] }
                    ], anuluj: -1 }] }] },
                    { nazwa: "w11Ostrzez", ch: 2, rozmowy: [{ kto: "latarnik", tresc: ["warn", { zrob: "w11Ostrzez" }] }] },
                    // (rozdz. 3: the raid's night - Latarnia.js)
                    { nazwa: "w11Vars", ch: 3, zmienne: "w11Zmienne" },
                    { nazwa: "w11Odkup", ch: 4, zmienne: "w11Zmienne",
                        rozmowy: [{ kto: "kupiec", gdy: ["stan:lens=baltazar", "kantorOtwarty"], tresc: ["baltazarBack", { wybor: [
                            { etykieta: "w11.biore", tresc: [{ zrob: "w11Odkup" }, "baltazarBackYes"] },
                            { etykieta: "w11.nieTeraz", tresc: ["baltazarBackNo"] }
                        ], anuluj: 1, zmienne: { 1: { hak: "cenaOdkupu" } } }] }] },
                    // the lens to brother Kleofas (Bazyli gives it; with the hermitage not built Bazyli reads his book himself)
                    { nazwa: "w11Kleofas", ch: 5, zmienne: "w11Zmienne", rozmowy: [
                        { kto: "pustelnik", gdy: "stan:lens=bag", tresc: ["kleofas", { zrob: "w11Kleofas" }] },
                        { kto: "latarnik", gdy: "stan:lens=whole", tresc: [{ jesli: "stan:raid.state=defended", to: ["bazyliDefended"], inaczej: ["bazyliGive"] }, { zrob: "w11Daj" }] },
                        { kto: "latarnik", gdy: ["stan:lens=bag", "!pustelniaGotowa"], tresc: ["bazyliReads", { zrob: "w11Kleofas" }] },
                        { kto: "latarnik", gdy: "stan:lens=bag", gotowa: false, tresc: ["bazyliBagFirst"] }
                    ] },
                    { nazwa: "w11Wybor", ch: 6, rozmowy: [{ kto: "latarnik", gdy: "stan:lens=bag", tresc: ["choiceAsk", { wybor: [
                        { etykieta: "w11.zostaw", tresc: ["choiceLeave", { zrob: "w11Zostaw" }] },
                        { etykieta: "w11.rozbij", tresc: ["choiceBreak", { zrob: "w11Rozbij" }] },
                        { etykieta: "w11.sprzedam", tresc: ["choiceSell", { zrob: "w11Sprzedam" }] }
                    ], anuluj: -1 }] }] },
                    { nazwa: "w11Sprzedaz", ch: 7, rozmowy: [{ kto: "kupiec", gdy: ["stan:lens=bag", "kantorOtwarty"], tresc: ["sold", { zrob: "w11Sprzedane" }] }] }
                ] }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS, gossip: GOSSIP },
        // the first meeting (Latarnia.js's own talk of Bazyli: the raven on the neck, seen in the fog)
        rozmowy: {
            spotkanie: ["meet", { zrob: "poznany" }]
        },
        // (the flags: then the quests' checks and the markers, as the plugin's setFlag did; "odswiez": the markers)
        akcje: {
            poznany: [{ gdy: "stan:met", koniec: true }, { stan: { met: "dzis" } }, { flaga: "latarnikMet" }, { sprawdz: true }, { notatka: "meetNote" }],
            // D22's end: told him (his trust +20) or kept it (+5) - the reward has the card 5
            d22Powiem: [{ gdy: "!aktywne:D22", koniec: true }, { stan: { told: "tell" } }, { flaga: "latarniaPowiedzial" }, { sprawdz: true },
                { hak: "zaufanie", args: [20] }, { hak: "zakoncz", args: ["D22"] }],
            d22Zachowam: [{ gdy: "!aktywne:D22", koniec: true }, { stan: { told: "keep" } }, { flaga: "latarniaMilczal" }, { sprawdz: true },
                { hak: "zaufanie", args: [5] }, { hak: "zakoncz", args: ["D22"] }],
            // W11
            w11Odmowa: [{ gdy: "krok:w11Oferta", zrob: [{ flaga: "latarniaBaltazarNie" }, { sprawdz: true }, { krok: "w11Oferta" }] }, { hak: "odswiez" }],
            w11Pomysle: [{ gdy: "krok:w11Oferta", zrob: [{ flaga: "latarniaBaltazarMoze" }, { sprawdz: true }, { krok: "w11Oferta" }] }, { hak: "odswiez" }],
            // (the night from day+1 to day+2: "jutro w nocy", after midnight)
            w11Ostrzez: [{ gdy: "krok:w11Ostrzez", zrob: [{ stan: { raid: { hak: "napadJutro" } } }, { krok: "w11Ostrzez" }] }, { hak: "odswiez" }],
            w11Daj: [{ gdy: ["krok:w11Kleofas", "stan:lens=whole"], zrob: [{ stan: { lens: "bag" } }, { v: ["soczewka", 1] },
                { napis: "w11.soczewka", pod: "w11.doKleofasa", gora: true, kolor: "#ffd23f" }] }, { hak: "odswiez" }],
            // (2026-10-17, W5 - Kantor.js) Baltazar's price: double for an enemy, half in the hero's grip; no money - the talk stops there
            w11Odkup: [{ gdy: ["krok:w11Odkup", "stan:lens=baltazar"], zrob: [
                { gdy: "!stacNaOdkup", zrob: [{ hak: "brakGrosza" }, { koniec: true }] },
                { hak: "zaplac", args: [{ hak: "cenaOdkupu" }] }, { stan: { lens: "bag" } }, { v: ["soczewka", 1] },
                { napis: "w11.soczewka", pod: "w11.odkupiona", gora: true, kolor: "#ffd23f" }, { krok: "w11Odkup" }] }, { hak: "odswiez" }],
            w11Kleofas: [{ gdy: ["krok:w11Kleofas", "stan:lens=bag"], zrob: [{ notatka: "kleofasNote" }, { krok: "w11Kleofas" }] }, { hak: "odswiez" }],
            w11Zostaw: [{ gdy: ["krok:w11Wybor", "stan:lens=bag"], zrob: [{ hak: "zabierz", args: ["soczewka", 1] }, { stan: { lens: "whole" } },
                { flaga: "latarniaSoczewkaZostaje" }, { sprawdz: true }, { hak: "zaufanie", args: [20] },
                { hak: "zakoncz", args: ["W11", { xp: 150, notatka: "leaveNote" }] }] }, { hak: "odswiez" }],
            w11Rozbij: [{ gdy: ["krok:w11Wybor", "stan:lens=bag"], zrob: [{ hak: "zabierz", args: ["soczewka", 1] }, { stan: { lens: "broken" } },
                { flaga: "soczewkaRozbita" }, { sprawdz: true }, { hak: "zakoncz", args: ["W11", { xp: 150, notatka: "breakNote" }] }] }, { hak: "odswiez" }],
            // (sell: on to rozdz. 7 - the lens goes to the Kantor)
            w11Sprzedam: [{ gdy: ["krok:w11Wybor", "stan:lens=bag"], zrob: [{ krok: "w11Wybor" }, { koniec: true }] }, { hak: "odswiez" }],
            w11Sprzedane: [{ gdy: ["krok:w11Sprzedaz", "stan:lens=bag"], zrob: [{ hak: "zabierz", args: ["soczewka", 1] }, { stan: { lens: "sold" } },
                { flaga: "soczewkaSprzedana" }, { sprawdz: true }, { hak: "zakoncz", args: ["W11", { gold: RAID.sale, xp: 80, notatka: "soldNote" }] }] }, { hak: "odswiez" }]
        }
    });
    const K49 = w.Q.K49, D22 = w.Q.D22, W11 = w.Q.W11;

    // ------------------------------------------------------------------ the epilogue (floor 100, Underground_Data.js - the integration
    // puts these lines in; one sentence each, by the ending and by what became of the lens)
    const EPILOG = {
    };
    Watki.scal(EPILOG, "latarnia", "epilog");   // (its words: js/teksty/latarnia.txt, epilog)

    window.LatarniaData = { MAP, IZBA, LATERNA, ITEM, IDS: [630, 639], OWNER: "Latarnia", PLAN, RESIDENT, INDOOR, FUEL, FOG, VISIONS, HEAVY,
        RAID, TX, K49, D22, W11, VITEMS, REMARKS, EPILOG,
        // the lighthouse's fire on the tower's picture (tools/latarnia/art/art.json: px right of / above the middle of its foot)
        FIRE: { x: 2, y: 177, w: 12 }, TOWER: [22, 9], IZBA_DOOR: [15, 18], LANDING: { 160: [6, 8], 161: [5, 7] },
        // the beams seen from afar at night on the maps around: from beyond the right edge of the screen, sy = its height (a share)
        FAR: { 13: { side: "right", sy: 0.2 }, 157: { side: "right", sy: 0.3 } } };
})();
