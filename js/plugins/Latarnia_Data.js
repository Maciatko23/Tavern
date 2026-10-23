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
//   - window.TownQuestsPacks: K49 "Tran dla latarni", D22 "Księga mgieł", W11 "Soczewka", the things carried (the lens), remarks
//   - window.LatarniaData: the fog, the fuel, the visions, the raid, his own talk, the epilogue lines (for the integration)
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): the sea here is salt and red (<Water:salt>); nothing here gives the hero water. The lighthouse does NOT
// delay the ferry (the user's decision 14).

/*:
 * @target MZ
 * @plugindesc [pakiet C] Dane: przylądek z latarnią (mapy 159-161), latarnik Bazyli, mgła morska, soczewka i wizje, K49, D22, W11. v1.0.0
 * @author Claude
 * @base TawernaCore
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

    // ------------------------------------------------------------------ the quests (TownQuests packs - docs/QUESTY_STAN.md "Jak dopisać")
    const K49 = {
        id: "K49", kind: "K", giver: "latarnik", icon: 176, 
        offer: {
            cond: { day: 24, flags: ["latarnikMet"] }
        },
        steps: [
            { type: "bring", to: "latarnik", need: [[177, 4], [61, 6]], fx: "k49Paliwo" }
        ],
        reward: { gold: 30, xp: 60, flag: "latarniaUfa" }
    };
    Watki.scal(K49, "latarnia", "zadania.K49");   // (its words: js/teksty/latarnia.txt, zadania.K49)
    const D22 = {
        id: "D22", kind: "D", giver: "latarnik", icon: 189, 
        offer: {
            cond: { flags: ["latarnikMet"], fn: "d22Ready" }
        },
        steps: [
            { type: "custom", check: "d22Wizje", vars: "d22Wizje" },
            { type: "custom", talk: "d22Koniec" }
        ],
        reward: { gold: 60, xp: 120, flag: "kronikaKarta5" }
    };
    Watki.scal(D22, "latarnia", "zadania.D22");   // (its words: js/teksty/latarnia.txt, zadania.D22)
    const W11 = {
        id: "W11", kind: "W", giver: null, icon: 0, 
        autoStart: "w11Auto",
        steps: [
            { ch: 1, type: "custom", talk: "w11Oferta" },
            { ch: 2, type: "custom", talk: "w11Ostrzez" },
            { ch: 3, type: "custom", vars: "w11Vars" },
            { ch: 4, type: "custom", talk: "w11Odkup", vars: "w11Vars" },
            { ch: 5, type: "custom", talk: "w11Kleofas", vars: "w11Vars" },
            { ch: 6, type: "custom", talk: "w11Wybor" },
            { ch: 7, type: "custom", talk: "w11Sprzedaz" }
        ]
    };
    Watki.scal(W11, "latarnia", "zadania.W11");   // (its words: js/teksty/latarnia.txt, zadania.W11)
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
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Latarnia", quests: [K49, D22, W11], vitems: VITEMS, remarks: REMARKS, gossip: GOSSIP });

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
