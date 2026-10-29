//=============================================================================
// Goscie_Data.js
//=============================================================================
// On the thread engine (Watki.js, 2026-10-29, etap 5 - docs/WATKI_DANE.md): the thread "goscie" - the tavern's regulars' quests (Melia, Dziadek Ozzy, Grum - TavernLife_Regulars.js asks TownQuests' regularTalk).
// Its quests: K22, K33, D13, D6. TownQuests_Data.js puts each into QUESTS at its old place (ARC("goscie", "<id>")), their words come from
// js/teksty (merged there by id), their steps' code is TownQuests.js's (GOSCIE_HAKI).

/*:
 * @target MZ
 * @plugindesc [tawerna] Dane wątku „goscie”: zadania stałych gości - Melia, Ozzy, Grum (K22, K33, D13, D6). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * Goscie_Data.js - dane wątku „goscie”
 * ============================================================================
 * Same dane: zadania K22, K33, D13, D6 jako wątek „goscie” silnika (Watki.js).
 * Musi stać nad TownQuests_Data.js (ten wkłada zadania na ich stare
 * miejsca w liście). Kod kroków: TownQuests.js (GOSCIE_HAKI).
 * ============================================================================
 */

(() => {
    "use strict";
    // the regulars' quests as the thread "goscie" (paczka: false - TownQuests_Data.js puts them into QUESTS at their old places;
    // tekstyZadan: false - their words are merged there by id from zadania_k.txt (K22, K33) and zadania_d.txt (D13, D6)). The steps'
    // names are the handlers' names TownQuests always had (old saves know the steps by their numbers - unchanged); the steps with no
    // code have names of their own. Their hooks: TownQuests.js GOSCIE_HAKI. Melia's, Ozzy's and Grum's own talks and trust:
    // TavernLife_Regulars.js (it asks TownQuests' regularTalk, regularTopics)
    Watki.watek({
        id: "goscie", wtyczka: "TownQuests", teksty: "zadania_k", paczka: false, tekstyZadan: false,
        zadania: {
            // K22 "Struna dla Melii": the sinews to Ignac, the string twisted in an hour; Melia sings a new verse if it comes before
            // 18:00 of the day she asked
            K22: { kind: "K", giver: "melia", icon: 163,
                offer: {
                    cond: { hours: [10, 17], day: 2 }
                },
                kroki: [
                    { nazwa: "k22Twist", type: "bring", to: "garbarz", need: [[163, 2]], hours: [6.5, 17], haki: { hand: "k22Skrecanie" } },
                    { nazwa: "k22String", haki: { talk: "k22StrunaRozmowa", ready: "k22StrunaZnacznik", act: "k22StrunaAkcja" } },
                    { nazwa: "k22Melia", haki: { talk: "k22MeliaRozmowa", ready: "k22MeliaZnacznik", act: "k22MeliaAkcja" } }
                ],
                reward: { xp: 50, trust: { melia: 15 } },
                lines: {
                }
            },
            // K33 "Czapka Ozzy'ego": the cap on the statue of the knights' garden - shot down (Hunting's target and the "shot" bus:
            // TownQuests' knockCap / shotAtCap), picked up through the bars of the gate (or walked up to, the gate open), back to Ozzy
            K33: { kind: "K", giver: "ozzy", icon: 0,
                offer: {
                    cond: { hours: [17, 23], day: 3 }
                },
                kroki: [
                    { nazwa: "k33Shot", haki: { tick: "k33Strzal" } },
                    { nazwa: "k33Pick", haki: { tick: "k33Furtka", act: "k33PodniesAkcja" } },
                    { nazwa: "k33Czapka", type: "bring", to: "ozzy", need: [["v:czapka", 1]] }
                ],
                reward: { xp: 50, items: [[81, 1]], trust: { ozzy: 10 }, flag: "k33Cap", clue: "w2_ozzy" },
                lines: {
                }
            },
            // D13 "Zakład Ozzy'ego": Ozzy's three predictions read from the weather plan (the offer: d13Offer - obce below), Grum's bet,
            // each seen with one's own eyes, Grum pays, Ozzy sober for a moment
            D13: { kind: "D", giver: "ozzy", icon: 0,
                offer: {
                    custom: "d13Offer", cond: { hours: [18, 23.5], day: 5, fn: "d13Offer" }
                },
                kroki: [
                    { nazwa: "d13Bet", haki: { talk: "d13ZakladRozmowa", ready: "d13ZakladZnacznik", act: "d13ZakladAkcja" } },
                    { nazwa: "d13Check", haki: { talk: "d13WidzialRozmowa", ready: "d13WidzialZnacznik", act: "d13WidzialAkcja", tick: "d13Wypatruje" } },
                    { nazwa: "d13Pay", haki: { talk: "d13WyplataRozmowa", ready: "d13WyplataZnacznik", act: "d13WyplataAkcja" } },
                    { nazwa: "d13Ozzy", haki: { talk: "d13OzzyRozmowa", ready: "d13OzzyZnacznik", act: "d13OzzyAkcja" } }
                ],
                reward: { xp: 100, trust: { ozzy: 15, grum: 5 }, flag: "d13Done", clue: "w9_ozzy" },
                lines: {
                }
            },
            // D6 "Siłacz z targu" (the author, 2026-10-06: arm-wrestling only in the tavern): three evenings' training with Grum, the
            // sign-up with Borgar at the bar (2 G), Baltazar's 40 G (d6Bribe - obce below), three bouts at the arm-wrestling table on the
            // market day's evening. Every step's tick: d6Late (the market day missed - obce below)
            D6: { kind: "D", giver: "kowal", icon: 0,
                offer: {
                    cond: { hours: [5.5, 17], day: 4 }
                },
                kroki: [
                    { nazwa: "d6Train", tick: "d6Late", haki: { check: "d6Trening" } },
                    { nazwa: "d6Sign", tick: "d6Late", haki: { borgarTopic: "d6ZapisTemat", borgarList: "d6ZapisRozmowa", ready: "d6ZapisZnacznik",
                        act: "d6ZapisAkcja" } },
                    { nazwa: "d6Tourney", tick: "d6Late", haki: { ready: "d6TurniejZnacznik", act: "d6TurniejAkcja" } }
                ],
                reward: { xp: 80 },
                lines: {
                },
                rivals: [
                    { key: "woznica", bust: "Woznica_Bust", level: 0,
                        lines: { } },
                    { key: "kowal", bust: "Kowal_Bust", level: 2,
                        lines: { } },
                    { key: "grum", bust: null, level: 4,
                        lines: { } }
                ]
            }
        },
        // what is no step of its own: D13's offer (Ozzy's predictions - the test asks TownQuests.FX.d13Offer.pred), D6's deadline (the
        // tick of all three steps) and Baltazar's bribe (his talk at the market: TownQuests' residents' side talks)
        obce: [
            { zadanie: "D13", nazwa: "d13Offer", haki: { cond: "d13OfertaJest", pred: "d13Przepowiednie", offer: "d13Oferta" } },
            { zadanie: "D6", nazwa: "d6Late", haki: { enter: "d6TerminWejscie", tick: "d6Termin" } },
            { zadanie: "D6", nazwa: "d6Bribe", haki: { act: "d6Lapowka" } }
        ]
    });
})();
