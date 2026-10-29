//=============================================================================
// W4_Data.js
//=============================================================================
// On the thread engine (Watki.js, 2026-10-29, etap 5 - docs/WATKI_DANE.md): the thread "w4" - the arc W4 "Krew kasztelana" chapters 1-5 (chapters 6-8: Kasztelan_Data.js's steps at indexes 6-9, unchanged).
// Its quests: W4. TownQuests_Data.js puts each into QUESTS at its old place (ARC("w4", "<id>")), their words come from
// js/teksty (merged there by id), their steps' code is TownQuests.js's (W4_HAKI).

/*:
 * @target MZ
 * @plugindesc [W4] Dane wątku na silniku wątków (Watki.js): zadanie W4 rozdz. 1-5 (rozdz. 6-8: Kasztelan_Data.js). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W4_Data.js - dane wątku „w4”
 * ============================================================================
 * Same dane: zadania W4 jako wątek „w4” silnika (Watki.js).
 * Musi stać nad TownQuests_Data.js (ten wkłada zadania na ich stare
 * miejsca w liście). Kod kroków: TownQuests.js (W4_HAKI).
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W4 as the thread "w4" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from js/teksty/w4.txt). The steps' names are the handlers' names TownQuests always had (the
    // cellar's grate - TownQuests.place 'grate' - and old saves know the steps by them and by their numbers - both unchanged); their
    // hooks: TownQuests.js W4_HAKI
    Watki.watek({
        id: "w4", wtyczka: "TownQuests", teksty: "w4", paczka: false, tekstyZadan: false,
        zadania: {
            // W4 (compact, 2026-10-06): the castellan's key - after the debt; it opens the order's old grate in the tavern's cellar
            // (Underground.js). (2026-10-15) Starts by itself after chapter 1 in either ending: the debt paid or the field lost
            // (Story.chapterEnded)
            W4: { kind: "W", giver: null, icon: 0, autoStart: "startW4", start: { hak: "w4Start" },
                kroki: [
                    // rozdz. 1: Borgar asked at the bar about the old stones under the tavern - his half of the key
                    { nazwa: "w4Borgar", ch: 1,
                        haki: { borgarTopic: "w4BorgarTemat", borgarList: "w4BorgarRozmowa", ready: "w4BorgarZnacznik", act: "w4BorgarAkcja" } },
                    // rozdz. 2: the dig at the raven cairn in grandpa's yard (an hour of hard work with the spade) - the other half
                    { nazwa: "w4Dig", ch: 2, type: "spot", spot: "w4_dig", toolsAny: [62], haki: { hand: "w4Kopanie" },
                        reward: { xp: 60 } },
                    // rozdz. 3: both halves to Tadek (with iron and charcoal) - the key is ready the next day
                    { nazwa: "w4Forge", ch: 3, type: "bring", to: "kowal", need: [["v:klucz_borgar", 1], ["v:klucz_kopiec", 1], [86, 1], [79, 2]], hours: [5.5, 17],
                        haki: { hand: "w4Kuznia" } },
                    { nazwa: "w4Key", ch: 3, haki: { talk: "w4KluczRozmowa", ready: "w4KluczZnacznik", act: "w4KluczAkcja" } },
                    // rozdz. 4: the grate open - by the key (the grate's script: w4Open below) or some other way (F9, an event)
                    { nazwa: "w4Gate", ch: 4, gotowe: { hak: "w4KrataOtwarta" } },
                    // rozdz. 5: Borgar told what lies under his tavern
                    { nazwa: "w4Tell", ch: 5,
                        haki: { borgarTopic: "w4PowiedzTemat", borgarList: "w4PowiedzRozmowa", ready: "w4PowiedzZnacznik", act: "w4PowiedzAkcja" } }
                    // (2026-10-17) chapters 6-8 - Kasztelan.js. (2026-10-23) Their steps are data: Kasztelan_Data.js (the thread "kasztelan",
                    // zadanie: "W4") puts them here through the thread engine at indexes 6-9 - w4Rod, w4Konfrontacja, w4Piwnica, w4Serce - an
                    // old save's step number stays its step; their words: js/teksty/kasztelan.txt. "Lord chce być pierwszy" (QUESTY ch. 5) is
                    // W7's chapter 6 (Dwor.js) - read there.
                ],
                lines: {
                }
            }
        },
        // the grate in the cellar opened with the castellan's key - not a step: the grate's talk (TownQuests.place 'grate', while the
        // step w4Gate is on) calls ["W4", "fx", "w4Open"]
        obce: [{ zadanie: "W4", nazwa: "w4Open", haki: { act: "w4Otworz" } }]
    });
})();
