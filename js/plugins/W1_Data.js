//=============================================================================
// W1_Data.js
//=============================================================================
// The data of the arc W1 (docs/QUESTY.md W1) on the thread engine (Watki.js, 2026-10-29, etap 4 - docs/WATKI_DANE.md): the
// thread "w1" with its quest W1 (Woda spod Kruczych Skał: the clues, Kuba at night, the orangery, the big choice, Feliks's men, the
// cistern's sluice and the bell). TownQuests_Data.js puts the quest into QUESTS at its old place (ARC("w1", "W1")), its words
// come from js/teksty/w1.txt (merged there by id), its steps' code is TownQuests.js's (W1_HAKI).

/*:
 * @target MZ
 * @plugindesc [W1] Dane wątku na silniku wątków (Watki.js): zadanie W1, jego kroki i haki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W1_Data.js - dane wątku W1
 * ============================================================================
 * Same dane: zadanie W1 jako wątek „w1” silnika (Watki.js). Musi stać
 * nad TownQuests_Data.js (ten wkłada zadanie na jego stare miejsce w liście).
 * Kod kroków: TownQuests.js (W1_HAKI). Teksty: js/teksty/w1.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W1 as the thread "w1" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from w1.txt). The steps' names are the handlers' names TownQuests always had (Dwor.js and old
    // saves know the steps by them and by their numbers - both unchanged); their hooks: TownQuests.js W1_HAKI
    Watki.watek({
        id: "w1", wtyczka: "TownQuests", teksty: "w1", paczka: false, tekstyZadan: false,
        zadania: {
            // W1 (chapters 1-7; the user, 2026-10-05: Feliks is guilty, the Lord knows nothing). 2026-10-06: 6 c's ambush is a real fight
            // (Humans.js), 7 (the Order's cistern, Act II) opens the main sluice by the bell. Starts by itself at the first clue
            W1: { kind: "W", giver: null, icon: 138, autoStart: "startW1", start: { hak: "w1Start" },
                clues: ["w1_barrel", "w1_roses", "w1_night", "w1_watch", "w1_well"], cluesNeed: 3,
                lines: {
                    // rozdz. 3: Kuba at the market
                    // rozdz. 5: the orangery at night
                    // rozdz. 6: the big choice
                    // (2026-10-17, W7 variant A - Dwor.js) after the truth of Feliks's letters (w7Prawda): the Lord knows Feliks sold to the
                    // Black Eyes, not where the sluice is - that stays W1's. {fate}: Feliks in the tower, or gone over the sea (TownQuests.js
                    // w1AfterW7)
                    w7: {
                        fate: { }
                    },
                    // (2026-10-06) rozdz. 6 c as a real fight (Humans.js, combat stage 3): two of Feliks's men - three, once he has paid 40 G
                    // rozdz. 7 (Act II): the Order's cistern - the main sluice on floor 30 (Underground.js sends "undergroundSluice"), opened by
                    // the bell's "water" signal four and two. The drought stays: the market well fills, but the sołtys keeps it under lock and
                    // rations it - for the hero it still gives its two draws a day (the author: the well stays as it is after W1)
                    shout: { }
                },
                kroki: [
                    { nazwa: "w1Clues", ch: 1, gotowe: { hak: "w1Poszlaki" } },
                    { nazwa: "w1Follow", ch: 2, haki: { tick: "w1Sledzenie" } },
                    { nazwa: "w1Kuba", ch: 3, haki: { talk: "w1KubaRozmowa", ready: "w1KubaZnacznik", act: "w1KubaWybor" } },
                    { nazwa: "w1Krata", ch: 4, type: "spot", spot: "w1_grate",
                        reward: { xp: 60, clue: "w1_grate" } },
                    { nazwa: "w1Kowal", ch: 4, type: "talk", to: "kowal", hours: [5.5, 17] },   // (TownQuests_Data's H_KOWAL: the smithy's hours)
                    { nazwa: "w1Orangery", ch: 5, spots: ["w1_pump", "w1_drawer", "w1_feliks", "w1_kuba"],
                        haki: { tick: "w1OranzeriaNoc", spot: "w1OranzeriaMiejsce", wanted: "w1OranzeriaChce", act: "w1OranzeriaAkcja" } },
                    { nazwa: "w1Choice", ch: 6, haki: { talk: "w1WyborRozmowa", ready: "w1WyborZnacznik", act: "w1WyborAkcja" } },
                    // (Feliks's weekly money: his men's ambush already counts - the hunted step's tick)
                    { nazwa: "w1Feliks", ch: 6, tick: "w1Ambush", haki: { talk: "w1FeliksRozmowa", ready: "w1FeliksZnacznik", act: "w1FeliksAkcja" } },
                    { nazwa: "w1Ambush", ch: 6, haki: { tick: "w1Zasadzka" } },
                    // (2026-10-06) rozdz. 7 in Act II: find the main sluice of the Order's cistern (underground floor 30), then the bell's
                    // "water" signal
                    { nazwa: "w1Sluice", ch: 7, gotowe: "flaga:sluiceFound" },
                    { nazwa: "w1Bell", ch: 7, haki: { talk: "w1DzwonRozmowa", ready: "w1DzwonZnacznik", act: "w1DzwonAkcja" } }
                ]
            }
        }
    });
})();
