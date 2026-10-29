//=============================================================================
// Oboz_Data.js
//=============================================================================
// On the thread engine (Watki.js, 2026-10-29, etap 5 - docs/WATKI_DANE.md): the thread "oboz" - the refugees' camp quests (W6's chapters 1-2: their flags make the camp's trust).
// Its quests: K19, K27, K28, K29, D4, D10, D18. TownQuests_Data.js puts each into QUESTS at its old place (ARC("oboz", "<id>")), their words come from
// js/teksty (merged there by id), their steps' code is TownQuests.js's (OBOZ_HAKI).

/*:
 * @target MZ
 * @plugindesc [miasteczko] Dane wątku „oboz”: zadania obozu uchodźców z kodem - rozdz. 1-2 W6 (K19, K27, K28, K29, D4, D10, D18). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * Oboz_Data.js - dane wątku „oboz”
 * ============================================================================
 * Same dane: zadania K19, K27, K28, K29, D4, D10, D18 jako wątek „oboz” silnika (Watki.js).
 * Musi stać nad TownQuests_Data.js (ten wkłada zadania na ich stare
 * miejsca w liście). Kod kroków: TownQuests.js (OBOZ_HAKI).
 * ============================================================================
 */

(() => {
    "use strict";
    // the camp's quests as the thread "oboz" (paczka: false - TownQuests_Data.js puts each into QUESTS at its old place; tekstyZadan:
    // false - their words are merged there by id from zadania_k.txt (K) and zadania_d.txt (D)). The steps' names are the handlers'
    // names TownQuests always had (old saves know the steps by their numbers - unchanged; k19Count is TARGET_DONE's "count"); the steps
    // with no code have names of their own. Their hooks: TownQuests.js OBOZ_HAKI. Ludmiła's offers (K27, K28, D10) ask "w6NotHated" -
    // the thread "w6" binds it (W6_Data.js obce)
    Watki.watek({
        id: "oboz", wtyczka: "TownQuests", teksty: "zadania_k", paczka: false, tekstyZadan: false,
        zadania: {
            // K19 "Spis obozu": the sołtys counts the water rations by heads - count the camp (Rafał asks not to be counted)
            K19: { kind: "K", giver: "soltys", icon: 0,
                offer: {
                    cond: { hours: [8, 18], day: 10 }
                },
                kroki: [
                    { nazwa: "k19Count", type: "custom", targets: ["ludmila", "ela", "rafal"],
                        haki: { talk: "k19LiczRozmowa", ready: "k19LiczZnacznik", act: "k19LiczAkcja" } },
                    { nazwa: "k19Soltys", type: "talk", to: "soltys", hours: [8, 18],
                        choice: { ask: [], options: [
                            { flag: "campCountTrue", reward: { opinion: 1 } },
                            { flag: "rafalHidden" }
                        ] } }
                ],
                reward: { gold: 10, xp: 50 },
                lines: {
                } },
            // K27 "Konik dla Eli": a wooden horse carved for Ela (wood and a knife) - or Melia's lullaby under the wall
            K27: { kind: "K", giver: "ludmila", icon: 61,
                offer: {
                    cond: { hours: [6.5, 20], day: 10, fn: "w6NotHated" }   // (2026-10-28: from the first wave - she comes then; was day 2)
                },
                kroki: [
                    { nazwa: "k27Melia", type: "bring", to: "ela", need: [[61, 1]], toolsAny: [91, 90], hours: [6.6, 20],
                        haki: { topic: "k27MeliaTemat", topicList: "k27MeliaTematRozmowa", talk: "k27MeliaRozmowa", ready: "k27MeliaZnacznik",
                            act: "k27MeliaAkcja" } }
                ],
                reward: { xp: 50, opinion: 3, clue: "w6_heart" },
                // (2026-10-06) the other way: Melia sings for Ela under the wall - and that evening the tavern's stage stays empty
                lines: {
                } },
            // K28 "Kocioł dla obozu": two portions of a hot dish (in winter it counts twice)
            K28: { kind: "K", giver: "ludmila", icon: 131,
                offer: {
                    cond: { hours: [6.5, 20], day: 11, fn: "w6NotHated" }   // (2026-10-28: the day after the first wave; was day 3)
                },
                kroki: [
                    { nazwa: "k28Winter", type: "bring", to: "ludmila", needAny: [[[131, 2]], [[130, 2]], [[132, 2]]], hours: [6.5, 20],
                        haki: { post: "k28ZimaSlowa", hand: "k28ZimaOpinia" } }
                ],
                reward: { xp: 50, opinion: 4, flag: "campFed" } },
            // K29 "Rana Rafała": a dressing on his wound at dawn or late at night - not while the corporal Wit is near
            K29: { kind: "K", giver: "rafal", icon: 152,
                offer: {
                    cond: { hours: [[4.5, 6.5], [21, 23.5]] }
                },
                kroki: [
                    { nazwa: "k29Guard", type: "bring", to: "rafal", need: [[152, 1]], hours: [[4.5, 6.5], [21, 23.5]],
                        haki: { blocked: "k29KapralBlisko" } }
                ],
                reward: { xp: 40, flag: "rafalTrust" },
                lines: { } },
            // D4 "Złodziej o świcie": the ambush at the stall before six (sneaking), Ela's choice, what Hanka hears; the reward by the choice
            // (d4Reward - obce below)
            D4: { kind: "D", giver: "piekarka", icon: 83,
                offer: {
                    cond: { hours: [6, 12], day: 11 }
                },
                kroki: [
                    { nazwa: "d4Ambush", type: "custom", haki: { tick: "d4Zasadzka" } },
                    { nazwa: "d4Ela", type: "talk", to: "ela", hours: [6.6, 20],
                        choice: { ask: [], options: [
                            { },
                            { cost: 15 },
                            { cond: { opinion: 20 } }
                        ] } },
                    { nazwa: "d4Hanka", type: "talk", to: "piekarka", hours: [6, 14], rewardFx: "d4Reward", haki: { say: "d4HankaSlowa" } }
                ],
                reward: { xp: 100 },
                lines: {
                } },
            // D10 "Gorączka Eli": the herbs (or Baltazar's "medicine from the continent") and clean water; the morning after
            D10: { kind: "D", giver: "ludmila", icon: 110,
                offer: {
                    cond: { hours: [6.5, 20], day: 11, season: [0, 1], fn: "w6NotHated" }
                },
                kroki: [
                    { nazwa: "d10Lek", type: "bring", to: "ludmila", needAny: [[[110, 1]], [["v:lek", 1]]], water: 1, hours: [6.5, 20],
                        haki: { talk: "d10LekRozmowa", ready: "d10LekZnacznik", act: "d10LekKupno" } },
                    { nazwa: "d10Noc", type: "wait", days: 1, hour: 6 },
                    { nazwa: "d10Morning", type: "talk", to: "ludmila", hours: [6.5, 20], haki: { say: "d10RanoSlowa" } }
                ],
                reward: { xp: 100, opinion: 6, flag: "elaHealed" },
                lines: {
                } },
            // D18 "Płaszcze przed zimą": the tanner's five cloaks - to the camp, or sold to the court's guard for Feliks's money
            D18: { kind: "D", giver: "garbarz", icon: 112,
                offer: {
                    cond: { hours: [6.5, 17], day: 70, season: [2] }
                },
                kroki: [
                    { nazwa: "d18Skory", type: "bring", to: "garbarz", need: [[96, 10], [111, 5]], hours: [6.5, 17] },
                    { nazwa: "d18Szycie", type: "talk", to: "garbarz", after: [0, 2], hours: [6.5, 17], vgives: { plaszcze: 5 } },
                    { nazwa: "d18Give", type: "custom", haki: { talk: "d18PlaszczeRozmowa", ready: "d18PlaszczeZnacznik", act: "d18PlaszczeAkcja" } }
                ],
                lines: {
                },
                reward: { xp: 100 } }
        },
        // what is no step's own handler: D4's last step's reward (its step's sayFx is d4Hanka)
        obce: [
            { zadanie: "D4", nazwa: "d4Reward", haki: { reward: "d4Nagroda" } }
        ]
    });
})();
