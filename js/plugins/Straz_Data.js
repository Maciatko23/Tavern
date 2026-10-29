//=============================================================================
// Straz_Data.js
//=============================================================================
// On the thread engine (Watki.js, 2026-10-29, etap 5 - docs/WATKI_DANE.md): the thread "straz" - the town's quests with code of the watch and the reeve (Wit's watch and reports, the inspection, the sign), Feliks's theft (K37) and Bartek's dice (K39).
// Its quests: K38, D11, D14, D17, K37, K39. TownQuests_Data.js puts each into QUESTS at its old place (ARC("straz", "<id>")), their words come from
// js/teksty (merged there by id), their steps' code is TownQuests.js's (STRAZ_HAKI).

/*:
 * @target MZ
 * @plugindesc [miasteczko] Dane wątku „straz”: zadania straży i sołtysa z kodem, kradzież Feliksa, kości Bartka (K38, D11, D14, D17, K37, K39). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * Straz_Data.js - dane wątku „straz”
 * ============================================================================
 * Same dane: zadania K38, D11, D14, D17, K37, K39 jako wątek „straz” silnika (Watki.js).
 * Musi stać nad TownQuests_Data.js (ten wkłada zadania na ich stare
 * miejsca w liście). Kod kroków: TownQuests.js (STRAZ_HAKI).
 * ============================================================================
 */

(() => {
    "use strict";
    // the corporal's hours (as TownQuests_Data.js's H_WIT, H_PATROL): by day at the gate, the evening's round of the walls
    const H_WIT = [6, 18], H_PATROL = [18, 23];

    // the quests of the watch and the reeve as the thread "straz" (paczka: false - TownQuests_Data.js puts them into QUESTS at their
    // old places; tekstyZadan: false - their words are merged there by id from zadania_k.txt (K38, K37, K39) and zadania_d.txt (D11,
    // D14, D17)). The steps' names are the handlers' names TownQuests always had (old saves know the steps by their numbers - unchanged);
    // the steps with no code have names of their own. Their hooks: TownQuests.js STRAZ_HAKI
    Watki.watek({
        id: "straz", wtyczka: "TownQuests", teksty: "zadania_k", paczka: false, tekstyZadan: false,
        zadania: {
            // K38 "Nocna warta": the post at the fortress's gate 1:00-3:00 (Kuba seen at night: a W1 clue), the report to Wit
            K38: { kind: "K", giver: "kapral", icon: 59,
                offer: {
                    cond: { hours: H_PATROL, opinion: 20, day: 3 }
                },
                kroki: [
                    { nazwa: "k38Miejsce", type: "spot", spot: "watch_post", hours: [0.75, 1.5], deadline: { day: 1, hour: 1.5, late: "fail" } },
                    { nazwa: "k38Watch", type: "custom", haki: { enter: "k38WartaStart", tick: "k38Warta" } },
                    { nazwa: "k38Report", type: "talk", to: "kapral", hours: H_PATROL, haki: { say: "k38Raport" } }
                ],
                reward: { gold: 15, xp: 50, opinion: 1 },
                fail: { opinion: -2 },
                lines: {
                }
            },
            // K37 (2026-10-05: the victim is Feliks with the manor's purse - the Lord himself never comes to the market; Feliks does the
            // manor's shopping there, so the purse is still the Lord's money). It starts by itself (autoStart: the theft)
            K37: { kind: "K", giver: "feliks", icon: 0, autoStart: "k37Theft", start: { hak: "k37Kradziez" },
                kroki: [
                    { nazwa: "k37Chase", type: "custom", haki: { enter: "k37PoscigStart", tick: "k37Poscig" } },
                    // (caught: he waits for the talk - the tick k37Hold, below in `obce`)
                    { nazwa: "k37Caught", type: "custom", tick: "k37Hold", vgives: { sakiewka: 1 },
                        haki: { talk: "k37ZlapanyRozmowa", ready: "k37ZlapanyZnacznik", act: "k37ZlapanyAkcja" } },
                    { nazwa: "k37Przynies", type: "bring", to: "feliks", need: [["v:sakiewka", 1]], hours: [7, 10.5],
                        reward: { debtCredit: 50, opinion: 2 } }
                ],
                reward: { xp: 60 },
                fail: { opinion: 0 },
                lines: {
                }
            },
            // K39 (2026-10-05: Bartek in the tavern, Lucjan at the market): the dice with the sharper, his swap seen, the choice
            K39: { kind: "K", giver: "bartek", icon: 0,
                offer: {
                    cond: { hours: [14, 21], day: 7 }
                },
                kroki: [
                    { nazwa: "k39Play", type: "custom", haki: { talk: "k39GraRozmowa", ready: "k39GraZnacznik", act: "k39GraAkcja" } },
                    { nazwa: "k39Choice", type: "custom", haki: { talk: "k39WyborRozmowa", ready: "k39WyborZnacznik", act: "k39WyborAkcja" } },
                    { nazwa: "k39Rozmowa", type: "talk", to: "bartek", hours: [14, 21],
                        reward: { gold: 5 } }
                ],
                reward: { xp: 60 },
                lines: {
                }
            },
            // D11: the coal for the braziers, the drowned basket by the east brazier, the report (Wit or Baltazar's bribe), the coal again
            D11: { kind: "D", giver: "kapral", icon: 79,
                offer: {
                    cond: { hours: H_PATROL, day: 6 }
                },
                kroki: [
                    { nazwa: "d11Deliver", type: "custom", upto: 3, haki: { talk: "d11DostawaRozmowa", ready: "d11DostawaZnacznik", act: "d11DostawaAkcja" } },
                    { nazwa: "d11Miejsce", type: "spot", spot: "east_brazier", hours: [21, 2], after: [0, 1],
                        choice: { ask: [], options: [
                            { flag: "d11Wit" },
                            { flag: "d11Kantor" }
                        ] } },
                    { nazwa: "d11Report", type: "custom", haki: { talk: "d11RaportRozmowa", ready: "d11RaportZnacznik", act: "d11RaportAkcja" } },
                    // (the coal again, up to five - the first step's handler)
                    { nazwa: "d11Reszta", type: "custom", talk: "d11Deliver", upto: 5 }
                ],
                reward: { gold: 70, xp: 100, opinion: 5 },
                lines: {
                }
            },
            // D14: six fish to the corporal in three days - or a bribe - or the corporal looks into the bag three days on
            D14: { kind: "D", giver: "kapral", icon: 74,
                offer: {
                    cond: { hours: H_WIT, day: 25 },   // (2026-10-28: after the second wave - its ferry is day 25 now)
                    options: [
                        { then: "accept", step: 0 },
                        { then: "close", cost: 20, flag: "witBribed", reward: { opinion: -1, xp: 20 } },
                        { then: "accept", step: 1 }
                    ]
                },
                kroki: [
                    { nazwa: "d14Przynies", type: "bring", to: "kapral", need: [[74, 6]], hours: H_WIT, deadline: { day: 3, hour: 18, late: "fail" }, end: true,
                        reward: { debtCredit: 50, opinion: 0 } },
                    { nazwa: "d14Inspect", type: "custom", dayAfter: 3, haki: { talk: "d14KontrolaRozmowa", ready: "d14KontrolaZnacznik", act: "d14KontrolaAkcja" } }
                ],
                reward: { xp: 50 },
                fail: { opinion: -2 },
                lines: {
                }
            },
            // D17: the reeve's petition against the war tax - five crosses under it, to the Lord, back to the reeve
            D17: { kind: "D", giver: "soltys", icon: 0,
                offer: {
                    cond: { hours: [8, 18], day: 20, story: true }
                },
                kroki: [
                    { nazwa: "d17Sign", type: "custom", signers: ["kowal", "piekarka", "woziwoda", "garbarz", "dzwonnik", "kupiec"], signNeed: 5, vgives: { petycja: 1 },
                        haki: { talk: "d17PodpisRozmowa", ready: "d17PodpisZnacznik", act: "d17PodpisAkcja" } },
                    { nazwa: "d17Przynies", type: "bring", to: "lord", need: [["v:petycja", 1]], hours: [8, 20], kruk: true },
                    { nazwa: "d17Rozmowa", type: "talk", to: "soltys", hours: [8, 18] }
                ],
                reward: { gold: 30, xp: 100, opinion: 8, flag: "lordRemembers" }
            }
        },
        // what is no step's name of its own: K37's caught thief waiting for the talk (the tick of the step "k37Caught")
        obce: [
            { zadanie: "K37", nazwa: "k37Hold", haki: { tick: "k37Czeka" } }
        ]
    });
})();
