//=============================================================================
// W3_Data.js
//=============================================================================
// The data of the arc W3 (docs/QUESTY.md W3) on the thread engine (Watki.js, 2026-10-29, etap 4 - docs/WATKI_DANE.md): the
// thread "w3" with its quest W3 (Melia's dream and verses, the origin, the Kupała night and the defence, Borgar). TownQuests_Data.js puts the quest into QUESTS at its old place
// (ARC("w3", "W3")), its words come from js/teksty/w3.txt (merged there by id), its steps' code is TownQuests.js's (W3_HAKI).

/*:
 * @target MZ
 * @plugindesc [W3] Dane wątku na silniku wątków (Watki.js): zadanie W3, jego kroki i haki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W3_Data.js - dane wątku W3
 * ============================================================================
 * Same dane: zadanie W3 jako wątek „w3” silnika (Watki.js). Musi stać
 * nad TownQuests_Data.js (ten wkłada zadanie na jego stare miejsce w liście).
 * Kod kroków: TownQuests.js (W3_HAKI). Teksty: js/teksty/w3.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W3 as the thread "w3" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from w3.txt: the steps' texts, the verses' names / sources / lines, the hints, the lines). The
    // steps' names are the handlers' names TownQuests always had (old saves know the steps by their numbers - unchanged; Dwor.js wraps
    // TownQuests.FX.w3Verse.source - the hook "source" below keeps it there); their hooks: TownQuests.js W3_HAKI
    Watki.watek({
        id: "w3", wtyczka: "TownQuests", teksty: "w3", paczka: false, tekstyZadan: false,
        zadania: {
            // W3 "Pieśń o Kruczych Skałach" (chapters 1-8; the kidnap at Kupała waits for human enemies). Starts by itself after Melia's
            // six ballads and K22
            W3: { kind: "W", giver: null, icon: 0, autoStart: "startW3", start: { hak: "w3Start" },
                kroki: [
                    // rozdz. 1: Melia's dream (the first verse: the string)
                    { nazwa: "w3Dream", ch: 1, haki: { talk: "w3SenRozmowa", ready: "w3SenZnacznik", act: "w3SenAkcja" } },
                    // rozdz. 2-6: the verses from the town (the plinths' verse: TownQuests' placeTalk; Ozzy's mead: a topic in his talk)
                    { nazwa: "w3Verse", ch: "2–6", haki: { talk: "w3ZwrotkaRozmowa", ready: "w3ZwrotkaZnacznik", topic: "w3MiodTemat",
                        topicList: "w3MiodRozmowa", act: "w3ZwrotkaAkcja", source: "w3ZwrotkaZrodlo" } },
                    // rozdz. 7: where Melia comes from (after midnight)
                    { nazwa: "w3Origin", ch: 7, haki: { talk: "w3PochodzenieRozmowa", ready: "w3PochodzenieZnacznik", act: "w3PochodzenieAkcja" } },
                    // rozdz. 8: where she sings the whole song - the Kupała bonfire, for Borgar alone, or into the fire
                    { nazwa: "w3Final", ch: 8, haki: { talk: "w3FinalRozmowa", ready: "w3FinalZnacznik", act: "w3FinalAkcja" } },
                    { nazwa: "w3Kupala", ch: 8, spots: ["w3_kupala"],
                        haki: { wanted: "w3KupalaChce", spot: "w3KupalaMiejsce", act: "w3KupalaAkcja", tick: "w3KupalaNoc" } },
                    // (the kidnap after the song: a real fight with Humans.js - its end on the bus: humansDone / heroRobbed)
                    { nazwa: "w3Defend", ch: 8, haki: { enter: "w3ObronaWejscie", tick: "w3Obrona" } },
                    { nazwa: "w3Borgar", ch: 8, haki: { talk: "w3BorgarRozmowa", ready: "w3BorgarZnacznik", act: "w3BorgarAkcja" } }
                ],
                reward: { xp: 200 },
                // the six verses (their name, source and lines: w3.txt)
                verses: [
                    { key: "struna" },
                    { key: "dzwon" },
                    { key: "kolysanka" },
                    { key: "cokoly" },
                    { key: "kronika" },
                    { key: "belkot" }
                ],
                hints: {
                },
                lines: {
                }
            }
        }
    });
})();
