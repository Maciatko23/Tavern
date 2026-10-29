//=============================================================================
// Podroznicy5_Data.js
//=============================================================================
// The ferry's travellers, stage 5 (docs/PODROZNI.md 2.3 - the second visit, 2.7, 2.13, I7, 4.4 - 2026-10-29): three matters as DATA;
// the engine: Podroznicy5.js, the words: js/teksty/podroznicy5.txt.
//   - D44 "Podatek wojenny": Erazm Łaska, the Crown's tax collector (the traveller "poborca", room 4, days 34-40) - who pays the Lord's
//     war tax at night (Feliks, with the eye's coins: heard through the wall of room 2, or seen on the corridor) and what is done with
//     it: the Lord (W7's night observation of Feliks), Erazm (Feliks, not the Lord: the garrison +5), his 20 G, silence
//   - D47 "Wolna Kompania" (I7): the four mercenaries ("kompania_1..4", rooms 9 and 10, from day 28/31) - noise till 1:00 (Renoma -1 a
//     night); Hubert at arm-wrestling or dice, a fist fight in the yard, Wit throws them out (kompaniaWroga), hired for 60 G
//     (kompaniaNajeta - two defenders in Act III), Grum talks them down
//   - D48 "Mapa Kruczej Wyspy": Teofil's second visit (from day 40) - the map of the island as a keepsake, and the old fortress: helped
//     (25 G, mapaTwierdzy), talked out of it (2 cards of the chronicle or Hart ducha 6), or his sketch taken at night (the search)
// Stands in the plugin list under Poselstwo_Data and above TownLife and TownQuests_Data: the thread "podroznicy5" (Watki.js) - its
// state (Tawerna.state "podroznicy5", version 1), the three quests into window.TownQuestsPacks, the talks and actions, the F9 jumps;
// the cast's `zadania` getters (a matter keeps its traveller a ferry longer, once - Teofil keeps his D40 of stage 2).
// Event ids 3080-3089 (the core's registry: owner "Poselstwo" 3070-3089): 3080 Feliks on the guests' corridor on D44's night.

/*:
 * @target MZ
 * @plugindesc [etap 5] Dane spraw podróżnych: D44 „Podatek wojenny” (Erazm), D47 „Wolna Kompania” (I7), D48 „Mapa Kruczej Wyspy” (Teofil, wizyta 2). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @orderAfter Poselstwo_Data
 *
 * @help
 * ============================================================================
 * Podroznicy5_Data.js - sprawy etapu 5 (docs/PODROZNI.md)
 * ============================================================================
 * Same dane: silnik to Podroznicy5.js, teksty js/teksty/podroznicy5.txt.
 * Musi stać pod Podroznicy_Data i nad TownLife.js i TownQuests_Data.js.
 * Numery zdarzeń 3080-3089 (właściciel "Poselstwo"): 3080 - Feliks na
 * korytarzu pięter gości w noc podatku (D44).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Podroznicy5_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ who, where, when, how much
    const KTO = { erazm: "poborca", kompania: "kompania", hubert: "kompania_1", teofil: "kartograf" };
    const MAP = { miasto: 8, karczma: 1, pietro: 25 };
    const IDS = [3080, 3089], OWNER = "Poselstwo";
    // D44: the night of the payment - Erazm's arrival + 2 (day 36); Feliks before the door of room 4 (68,48) 22:40-23:20, the wall
    // 23-24; the hero within `widzi` tiles sees him
    const D44 = { noc: 2, feliks: { id: 3080, map: MAP.pietro, x: 68, y: 49, dir: 8, sheet: "$Npc_Feliks", godziny: [22.67, 23.34], widzi: 4 },
        godziny: [23, 24], donos: 20, przychylnosc: 5, xp: 120 };
    // D47: the stakes, the hire, the yard (Map008 - the tavern's yard: the fight starts with the hero within `zasieg` of it), the noise
    const D47 = { stawka: 10, najem: 60, podworze: [51, 24], zasieg: 9, poziom: 5, burda: [1, 6], renoma: { spokoj: 4, wit: 2, burda: -1 }, xp: 120,
        hubertSila: 3 };
    // D48: the share of the fortress's map; who may talk him out of it - the chronicle's cards read (D23) or Hart ducha
    const D48 = { zloto: 25, karty: 2, hart: 6, xp: 100 };
    // Act III (docs/PODROZNI.md 4.4): the Company hired - two defenders in the yard (a mercenary's look, the hero's side) after the
    // bell; thrown out - one mercenary more in wave 4 (one at most from the shared list of wave 4); the fortress's map - the shared
    // list of the faction's knowledge (one scout more in wave 3)
    const ECHA = {
        wiedza: ["mapaTwierdzy"], fala4: ["kompaniaWroga"],
        kompania: { key: "kompania", sheet: "anim8/Merc_Walk8", atk: "Merc", maps: [8], from: "gate", delay: 380, hp: 150, dmg: 15, poise: 40, cd: [70, 100],
            speed: 4.0, armor: 0.25, swing: "#e8e8e8", n: 2 }
    };
    // the dice rival (TavernDice: a rival of this matter only - never at the tavern's table by himself) and the arm-wrestling one
    const HUBERT_KOSCI = {
        style: "ryzykant", styleColor: "#b8b8c8",
        bust: "Kompania_1_Bust", sheet: null, index: 0,
        hours: [0, 24], stakes: [D47.stawka], perDay: 3,
        ai: { bank: [0, 400, 500, 600, 900, 1900, Infinity], reckless: 0.15, chase: 1.7 },
        die: { key: "grusza", chance: 0.3 },
        lines: {}
    };
    Watki.scal(HUBERT_KOSCI, "podroznicy5", "kosci.hubert");
    const HUBERT_SILOWANIE = { key: "hubert", bust: "Kompania_1_Bust", level: D47.hubertSila, lines: {} };
    Watki.scal(HUBERT_SILOWANIE, "podroznicy5", "silowanie.hubert");

    const VITEMS = { mapa_wyspy: { icon: 190 } };
    Watki.scal(VITEMS, "podroznicy5", "rzeczy");

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md 2.3a)
    const w = Watki.watek({
        id: "podroznicy5", wtyczka: "Podroznicy5", teksty: "podroznicy5",
        // version 1: D44 (heard 1 / 0.5, Feliks seen, the end), D47 (Hubert spoken to, the fight's day, the nights of noise, the end),
        // D48 (the keepsake given, the plan to take the sketch, the end)
        stan: { klucz: "podroznicy5", wersja: 1, domyslne: () => ({
            d44: { slyszal: 0, feliks: 0, noc: 0, koniec: "" },
            d47: { hubert: 0, bojka: 0, noce: 0, noc: 0, borgar: 0, koniec: "" },
            d48: { pamiatka: 0, plan: 0, koniec: "" } }) },
        mowa: { akapity: true },
        mysli: { klatki: 220, odstep: 230, czekaj: true },
        zadania: {
            // D44: Erazm's question (his talk); the night of the payment; what is done with the report
            D44: { kind: "D", giver: KTO.erazm, icon: 0, offer: { cond: { hours: [6, 24] } }, oferta: "erazmJest",
                kroki: [
                    { nazwa: "d44Noc", ch: 1, gotowe: { lub: ["d44Slyszal", "stan:d44.feliks", "poNocyD44"] }, zmienne: "d44Zmienne" },
                    { nazwa: "d44Raport", ch: 2, zmienne: "d44Zmienne", rozmowy: [
                        { kto: KTO.erazm, gdy: "erazmJest", tresc: [{ rozmowa: "raport" }] },
                        { kto: "lord", tresc: [{ rozmowa: "lord" }] }
                    ] }
                ],
                fail: {} },
            // D47: the Company on the island and their first night begun; Hubert (the choices), Wit (once Hubert was spoken to)
            D47: { kind: "D", giver: null, icon: 0, start: ["kompaniaJest", "poPierwszymWieczorze"],
                kroki: [
                    { nazwa: "d47Kompania", ch: 1, zmienne: "d47Zmienne",
                        temat: { kto: "borgar", etykieta: "temat.borgar", gdy: "!stan:d47.borgar", tresc: ["d47.borgar", { zrob: "d47Borgar" }] },
                        rozmowy: [
                            { kto: KTO.hubert, gdy: "kompaniaJest", tresc: [{ rozmowa: "hubert" }] },
                            { kto: "kapral", gdy: ["stan:d47.hubert", "kompaniaJest"], znacznik: false, tresc: [{ rozmowa: "wit" }] }
                        ] }
                ],
                fail: {} },
            // D48: Teofil's second visit - his talk
            D48: { kind: "D", giver: KTO.teofil, icon: 0, offer: { cond: { hours: [6, 24] } }, oferta: "teofilWizyta2",
                kroki: [
                    { nazwa: "d48Mapa", ch: 1, zmienne: "d48Zmienne", rozmowy: [{ kto: KTO.teofil, tresc: [{ rozmowa: "teofil" }] }] }
                ],
                fail: {} }
        },
        paczka: { vitems: VITEMS },
        rozmowy: {
            // D44: the report - his coin first when the night was not heard; Feliks (known), the 20 G, silence, later
            raport: [{ gdy: "!d44Slyszal", mow: "d44.moneta" }, "d44.raport", { wybor: [
                { etykieta: "d44.opcja.feliks", gdy: "d44WieFeliks", tresc: ["d44.feliks", { zrob: "d44", args: ["feliks"] }] },
                { etykieta: "d44.opcja.donos", tresc: ["d44.donos", { zrob: "d44", args: ["donos"] }] },
                { etykieta: "d44.opcja.milcz", tresc: ["d44.milcz", { zrob: "d44", args: ["milcz"] }] },
                { etykieta: "d44.opcja.pozniej", tresc: [] }
            ], anuluj: "ostatnia" }],
            lord: ["d44.lord", { zrob: "d44", args: ["lord"] }],
            // D47: Hubert - arm-wrestling, dice, the fight, the hire, Grum, nothing
            hubert: [{ zrob: "d47Hubert" }, "d47.hubert", { zmienne: { cena: D47.najem, stawka: D47.stawka }, wybor: [
                { etykieta: "d47.opcja.silowanie", tresc: ["d47.silowanieStart", { skrypt: "Podroznicy5.silowanie(this);" }] },
                { etykieta: "d47.opcja.kosci", tresc: ["d47.koscStart", { skrypt: "Podroznicy5.kosci(this);" }] },
                { etykieta: "d47.opcja.bojka", gdy: "!stan:d47.bojka", tresc: ["d47.bojkaStart", { zrob: "d47Bojka" }] },
                { etykieta: "d47.opcja.najmij", tresc: [{ jesli: "d47Stac", to: ["d47.najmij", { zrob: "d47Najmij" }], inaczej: [{ zrob: "d47Brak" }] }] },
                { etykieta: "d47.opcja.grum", gdy: "grumSojusznik", tresc: ["d47.grum", { zrob: "d47", args: ["grum"] }] },
                { etykieta: "d47.opcja.nic", tresc: [] }
            ], anuluj: "ostatnia" }],
            wit: ["d47.wit", { wybor: [
                { etykieta: "d47.opcja.witTak", tresc: ["d47.witTak", { zrob: "d47", args: ["wit"] }] },
                { etykieta: "d47.opcja.witNie", tresc: [] }
            ], anuluj: 1 }],
            // D48: the keepsake, then the question of the fortress
            teofil: [{ zrob: "d48Pamiatka" }, "d48.pyta", { wybor: [
                { etykieta: "d48.opcja.pomoz", tresc: ["d48.pomoz", { zrob: "d48", args: ["pomoz"] }] },
                { etykieta: "d48.opcja.przekonaj", tresc: [{ jesli: "d48Przekona", to: ["d48.przekonaj", { zrob: "d48", args: ["przekonaj"] }], inaczej: ["d48.przekonajNie"] }] },
                { etykieta: "d48.opcja.ukradnij", gdy: ["przeszukanieJest", "!stan:d48.plan"], tresc: ["d48.ukradnij", { zrob: "d48Plan" }] },
                { etykieta: "d48.opcja.nie", tresc: [] }
            ], anuluj: "ostatnia" }]
        },
        akcje: {
            d44: [{ hak: "d44Koniec", args: [{ arg: 0 }] }],
            d47Hubert: [{ stan: { "d47.hubert": "dzis" } }],
            d47Borgar: [{ stan: { "d47.borgar": "dzis" } }],
            d47Bojka: [{ hak: "d47Bojka" }],
            d47Najmij: [{ hak: "d47Najmij" }],
            d47Brak: [{ hak: "d47Brak" }],
            d47: [{ hak: "d47Koniec", args: [{ arg: 0 }] }],
            d48Pamiatka: [{ hak: "d48Pamiatka" }],
            d48Plan: [{ stan: { "d48.plan": "dzis" } }],
            d48: [{ hak: "d48Koniec", args: [{ arg: 0 }] }]
        },
        // F9 ("Wyspa i fabuła" - the section of stage 5's matters)
        f9: { naglowek: "f9.naglowek", etykieta: "f9.etykieta", opis: "f9.opis", brak: "f9.brak", rodzaj: "isleP5" },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "d44Noc", godzina: 22.6, idz: [MAP.pietro, 61, 40, 6] },
                2: { ch: 2, krok: "d44Raport", godzina: 14.5, idz: [MAP.pietro, 67, 41, 8] },
                3: { ch: 1, krok: "d47Kompania", godzina: 10, idz: [MAP.pietro, 32, 60, 4] },
                4: { ch: 1, krok: "d48Mapa", godzina: 16, idz: [MAP.pietro, 13, 9, 8] }
            }
        }
    });

    // ------------------------------------------------------------------ Podroznicy: a matter keeps its traveller a ferry longer (once)
    // (Erazm and the Company: only before the extra ferry - their leaving after it is the matter's own end; Teofil: his D40 of stage 2
    // as it was, D48 added on his second visit)
    const PD = window.PodroznicyData;
    function sprawa(id) {
        try {
            const P = window.Podroznicy, Q = window.TownQuests;
            if (!P || !Q || !window.$gameSystem) return false;
            const r = Q.rec ? Q.rec(id) : null;
            return !!r && r.s === "active";
        } catch (e) { return false; }
    }
    const zostal = key => { try { const e = window.Podroznicy && window.$gameSystem ? window.Podroznicy.stan().obecni[key] : null; return !e || !!e.zostal; } catch (e) { return true; } };
    if (PD && Array.isArray(PD.OBSADA)) {
        const by = key => PD.OBSADA.find(x => x.key === key);
        const erazm = by(KTO.erazm), kompania = by(KTO.kompania), teofil = by(KTO.teofil);
        if (erazm) Object.defineProperty(erazm, "zadania", { get: () => (!zostal(KTO.erazm) && sprawa("D44") ? ["D44"] : []), enumerable: true, configurable: true });
        if (kompania) Object.defineProperty(kompania, "zadania", { get: () => (!zostal(KTO.kompania) && sprawa("D47") ? ["D47"] : []), enumerable: true, configurable: true });
        if (teofil) {
            const own = Array.isArray(teofil.zadania) ? teofil.zadania.slice() : [];
            Object.defineProperty(teofil, "zadania", { get: () => own.concat(!zostal(KTO.teofil) && sprawa("D48") ? ["D48"] : []), enumerable: true, configurable: true });
        }
    }

    window.Podroznicy5Data = { KTO, MAP, IDS, OWNER, D44, D47, D48, ECHA, HUBERT_KOSCI, HUBERT_SILOWANIE, VITEMS, TX: w.tx, D44Q: w.Q.D44, D47Q: w.Q.D47, D48Q: w.Q.D48, watek: w };
})();
