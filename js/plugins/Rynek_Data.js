//=============================================================================
// Rynek_Data.js
//=============================================================================
// On the thread engine (Watki.js, 2026-10-29, etap 5 - docs/WATKI_DANE.md): the thread "rynek" - the town's quests with code of the market and the crafts (the smith, the baker, the water carrier, the bell ringer, the merchant, the reeve, the tanner).
// Its quests: K1, K5, K9, K13, K14, D16, K15, K16, K17, K20, D3. TownQuests_Data.js puts each into QUESTS at its old place (ARC("rynek", "<id>")), their words come from
// js/teksty (merged there by id), their steps' code is TownQuests.js's (RYNEK_HAKI).

/*:
 * @target MZ
 * @plugindesc [miasteczko] Dane wątku „rynek”: zadania rzemieślników i targu z kodem (K1, K5, K9, K13, K14, D16, K15, K16, K17, K20, D3). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * Rynek_Data.js - dane wątku „rynek”
 * ============================================================================
 * Same dane: zadania K1, K5, K9, K13, K14, D16, K15, K16, K17, K20, D3 jako wątek „rynek” silnika (Watki.js).
 * Musi stać nad TownQuests_Data.js (ten wkłada zadania na ich stare
 * miejsca w liście). Kod kroków: TownQuests.js (RYNEK_HAKI).
 * ============================================================================
 */

(() => {
    "use strict";
    // TownQuests_Data.js's hours of the crafts (this file stands above it: the same numbers written out)
    const H_KOWAL = [5.5, 17], H_PIEK = [6, 14], H_IGNAC = [6.5, 17];

    // the quests as the thread "rynek" (paczka: false - TownQuests_Data.js puts them into QUESTS at their old places; tekstyZadan: false -
    // their words are merged there by id from zadania_k.txt / zadania_d.txt). The steps' names are the handlers' names TownQuests always
    // had (old saves know the steps by their numbers - unchanged); the steps with no code have names of their own. Their hooks:
    // TownQuests.js RYNEK_HAKI
    Watki.watek({
        id: "rynek", wtyczka: "TownQuests", teksty: "zadania_k", paczka: false, tekstyZadan: false,
        zadania: {
            // K1 "Węgiel do paleniska": before nine Tadek sharpens a worn tool (the step's fx: his words, the sharpening)
            K1: { kind: "K", giver: "kowal", icon: 79,
                offer: {
                    cond: { hours: H_KOWAL, day: 2 }
                },
                kroki: [
                    { nazwa: "k1Early", type: "bring", to: "kowal", need: [[79, 5]], hours: H_KOWAL, haki: { post: "k1Rano", hand: "k1Ostrzy" } }
                ],
                reward: { gold: 15, xp: 50, opinion: 2 } },
            // K5 "Bochenki do dziewiątej": four loaves before nine. (2026-10-28, docs/PODROZNI.md 5.2) Ludmiła comes with the first wave
            // (day 10): before it the fourth loaf goes to Kuba at the market's well (targetsBefore); the words by the day - {czwarty},
            // {czwartemu}, {placi} (the quest's vars k5Vars - `obce` below, its words: wiersze.*)
            K5: { kind: "K", giver: "piekarka", icon: 83, repeat: "daily", vars: "k5Vars",
                offer: {
                    cond: { hours: [6, 8.5] },
                    vgives: { bochen: 4 }
                },
                kroki: [
                    { nazwa: "k5", type: "custom", targets: ["dzwonnik", "kapral", "ludmila", "soltys"], targetsBefore: { day: 10, targets: ["dzwonnik", "kapral", "woziwoda", "soltys"] },
                        deadline: { day: 0, hour: 9, late: "fail" },
                        haki: { talk: "k5Rozmowa", ready: "k5Znacznik", act: "k5Chleb" } },
                    { nazwa: "k5Piekarka", type: "talk", to: "piekarka", hours: H_PIEK }
                ],
                reward: { gold: 12, xp: 20, opinionFirst: 1 },
                fail: { opinion: -1 } },
            // K9 "Kłótnia o studnię": no steps - the offer's options close it (the two of them say their bit: k9Fair / k9Dice, `obce`)
            K9: { kind: "K", giver: "woziwoda", icon: 0,
                offer: {
                    cond: { hours: [7, 8.5], dry: 3, day: 3 },
                    options: [
                        { then: "close", reward: { opinion: 3, xp: 50, items: [[131, 1]] },
                            fx: "k9Fair" },
                        { then: "close", reward: { opinion: -2, xp: 20 },
                            fx: "k9Dice" },
                        { then: "decline" }
                    ]
                },
                kroki: [] },
            // K13: the bell's rope by noon - failed, the noon bell is silent today (the fail's fx k13Silence, `obce`)
            K13: { kind: "K", giver: "dzwonnik", icon: 93,
                offer: {
                    cond: { hours: [6.3, 11.5], day: 2 }
                },
                kroki: [
                    { nazwa: "k13Lina", type: "bring", to: "dzwonnik", need: [[93, 2]], hours: [6.3, 12.3], deadline: { day: 0, hour: 12, late: "fail" } }
                ],
                reward: { gold: 10, xp: 50, opinion: 2 },
                fail: { opinion: -1, fx: "k13Silence" } },
            // K14: ringing the bell at six (the mini-game)
            K14: { kind: "K", giver: "dzwonnik", icon: 0,
                offer: {
                    cond: { hours: [17.5, 18.25], opinion: 20, day: 3 }
                },
                kroki: [
                    { nazwa: "bellTalk", type: "custom", target: 6,
                        deadline: { day: 0, hour: 18.4, late: "fail" },
                        haki: { talk: "k14Rozmowa", ready: "k14Znacznik", act: "k14Dzwon" } }
                ],
                reward: { xp: 50 },
                fail: { opinion: 0 },
                lines: {
                } },
            // K15: Baltazar's crate to the carter - or to the corporal instead; the pay the next day
            K15: { kind: "K", giver: "kupiec", icon: 0,
                offer: {
                    cond: { hours: [21.5, 22.2], day: 3 },
                    vgives: { skrzynia: 1 }, pay: 5
                },
                kroki: [
                    // (2026-10-05: the carter Wojciech waits with his cart before the south gate, 21:20-22:40 - TownLife "woznica")
                    { nazwa: "k15Wit", type: "bring", to: "woznica", hours: [21.5, 22.5], need: [["v:skrzynia", 1]], deadline: { day: 0, hour: 22.5, late: "fail" },
                        choice: { ask: [], options: [
                            { flag: "k15Clean" },
                            { flag: "k15Opened", clue: "w5_stones" }
                        ] },
                        haki: { talk: "k15WitRozmowa", ready: "k15WitZnacznik", act: "k15WitSkrzynia" } },
                    { nazwa: "k15Pay", type: "custom", haki: { talk: "k15ZaplataRozmowa", ready: "k15ZaplataZnacznik", act: "k15Zaplata" } }
                ],
                reward: { xp: 50 },
                fail: { opinion: -1 },
                lines: {
                } },
            // K16: Baltazar buys what keeps (a trade on the day after a ferry) - its offer's custom k16Trade (`obce` below: the hooks and
            // the list GOODS as a plain field of the FX entry - tests/w6_test.js and the offer markers read FX.k16Trade)
            K16: { kind: "K", giver: "kupiec", icon: 103, repeat: "trade",
                offer: { cond: { hours: [8, 18], afterFerry: true }, custom: "k16Trade" },
                kroki: [],
                lines: {
                },
                reward: { xp: 30, clue: "w8_stores" } },
            // K17: the four notices (a nail and the hammer each)
            K17: { kind: "K", giver: "soltys", icon: 88,
                offer: {
                    cond: { hours: [8, 18], day: 2 },
                    vgives: { obwieszczenie: 4 }
                },
                kroki: [
                    { nazwa: "k17", type: "custom", spots: ["notice_tavern", "notice_bakery", "notice_smithy", "notice_kantor"], hours: [6, 20],
                        haki: { wanted: "k17Chce", spot: "k17Miejsce", act: "k17Przybij" } },
                    { nazwa: "k17Soltys", type: "talk", to: "soltys", hours: [8, 18] }
                ],
                react: { },
                reward: { gold: 10, xp: 50, opinion: 1 } },
            // K20: three cleaner dressings (a sinew more each time a raw hide comes into the bag) - the offer's option k20Bonus, `obce`
            K20: { kind: "K", giver: "garbarz", icon: 96,
                offer: {
                    cond: { hours: H_IGNAC, has: [[96, 1]] },
                    options: [
                        { then: "close", need: [[96, 1]], reward: { gold: 8, xp: 50, opinion: 1 }, fx: "k20Bonus" },
                        { then: "decline" }
                    ]
                },
                kroki: [] },
            // D3: the horseshoes (an hour at the forge), the corporal, the sołtys, the tanner, Tadek
            D3: { kind: "D", giver: "kowal", icon: 86,
                offer: {
                    cond: { hours: [5.5, 14], day: 6 }
                },
                kroki: [
                    { nazwa: "d3Forge", type: "bring", to: "kowal", need: [[86, 2], [79, 1]], hours: [5.5, 16], vgives: { podkowy: 1 },
                        deadline: { day: 0, hour: 16, late: "next", skip: 2 }, haki: { hand: "d3Kuznia" } },
                    { nazwa: "d3Kapral", type: "bring", to: "kapral", need: [["v:podkowy", 1]], hours: [6, 17.5], deadline: { day: 0, hour: 17.5, late: "next" } },
                    { nazwa: "d3Soltys", type: "bring", to: "soltys", need: [[88, 20]], hours: [8, 18], deadline: { day: 1, hour: 18, late: "next" } },
                    { nazwa: "d3Garbarz", type: "bring", to: "garbarz", need: [[91, 1]], hours: H_IGNAC, deadline: { day: 1, hour: 17, late: "next" } },
                    { nazwa: "d3Kowal", type: "talk", to: "kowal", hours: H_KOWAL,
                        choice: { ask: [], options: [
                            { reward: { gold: 60 } },
                            { reward: { opinion: 6, xp: 50 }, flag: "tadekFriend" }
                        ] } }
                ],
                reward: { xp: 100, opinion: 2 } },
            // D16: four lessons at the bell (Ambroży at six, noon or six in the evening, one a day)
            D16: { kind: "D", giver: "dzwonnik", icon: 0,
                offer: {
                    cond: { hours: [6.3, 17.7], opinion: 40, day: 7 }
                },
                kroki: [
                    { nazwa: "bellLesson", type: "custom", days: 4, haki: { talk: "d16Rozmowa", ready: "d16Znacznik", act: "d16Lekcja" } }
                ],
                lines: {
                },
                reward: { xp: 100, opinion: 5, flag: "bellKey" } }
        },
        // what is no step of its own: K5's words (the quest's vars), K9's and K20's offer options, K13's fail, K16's trade (the offer's custom)
        obce: [
            { zadanie: "K5", nazwa: "k5Vars", haki: { vars: "k5Slowa" } },
            { zadanie: "K16", nazwa: "k16Trade", pola: { GOODS: [103, 102, 105, 106] },
                haki: { goods: "k16Towary", left: "k16Zostalo", offer: "k16Oferta", act: "k16Sprzedaj" } },
            { zadanie: "K9", nazwa: "k9Fair", haki: { pick: "k9PoPolowie" } },
            { zadanie: "K9", nazwa: "k9Dice", haki: { pick: "k9Kosci" } },
            { zadanie: "K13", nazwa: "k13Silence", haki: { fail: "k13Cisza" } },
            { zadanie: "K20", nazwa: "k20Bonus", haki: { pick: "k20Garbowanie" } }
        ]
    });
})();
