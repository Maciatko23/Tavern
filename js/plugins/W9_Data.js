//=============================================================================
// W9_Data.js
//=============================================================================
// On the thread engine (Watki.js, 2026-10-29, etap 5 - docs/WATKI_DANE.md): the thread "w9" - the arc W9 chapter 6, the truths of the Truth Layer told in the town (chapter 3's steps at indexes 1-2: Rywal.js, unchanged).
// Its quests: W9. TownQuests_Data.js puts each into QUESTS at its old place (ARC("w9", "<id>")), their words come from
// js/teksty (merged there by id), their steps' code is TownQuests.js's (W9_HAKI).

/*:
 * @target MZ
 * @plugindesc [W9] Dane wątku na silniku wątków (Watki.js): zadanie W9 rozdz. 6 - prawdy z Warstwy Prawdy (rozdz. 3: Rywal.js). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W9_Data.js - dane wątku „w9”
 * ============================================================================
 * Same dane: zadania W9 jako wątek „w9” silnika (Watki.js).
 * Musi stać nad TownQuests_Data.js (ten wkłada zadania na ich stare
 * miejsca w liście). Kod kroków: TownQuests.js (W9_HAKI).
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W9 as the thread "w9" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from js/teksty/w9.txt). The step's name is the handler's name TownQuests always had (Kasztelan.js
    // calls TownQuests.FX.w9Truth.act; old saves know the step by its number - unchanged); its hooks: TownQuests.js W9_HAKI.
    // Chapter 3 (steps 1-2: w9Rywal, w9RywalPo) is the thread "rywal"'s (Rywal_Data.js: zadanie "W9", its kroki at indexes 1-2)
    Watki.watek({
        id: "w9", wtyczka: "TownQuests", teksty: "w9", paczka: false, tekstyZadan: false,
        zadania: {
            // W9 rozdz. 6 (2026-10-06): the truths of the Truth Layer as talks in the town. The kartki of floors 76-99
            // (Underground.truths(), the bus "undergroundTruth") - back up top, the hero may tell each one to the one it is about, or keep
            // silent. One person at a time, asked once a day (a resident: before his talk; the tavern's regulars: a topic in their menu;
            // Borgar: a topic at the bar; the Lord and grandpa: before their story talk - grandpa also hears Mruczek's). Starts by itself at
            // the first truth read. truths[who]: tell / keep (lines after the choice: the hero "> ...", the one spoken to), told / kept (a
            // reward: opinion, trust, flag, note), tellIf: [[flag, lines]] (more lines when a quest's flag is set). The chapters 1-5 and
            // 7-8 are other systems' (the tavern's cellar, the Underground's floors, its Heart and endings) - the arc stays open while
            // there is a truth to tell.
            W9: { kind: "W", giver: null, icon: 0, autoStart: "startW9", start: { hak: "w9Start" },
                kroki: [
                    // rozdz. 6: the truths told or kept ({known}, {told}, {kept}, {open} in the step's words)
                    { nazwa: "w9Truth", ch: 6,
                        haki: { talk: "w9PrawdaRozmowa", ready: "w9PrawdaZnacznik", topic: "w9PrawdaTemat", topicList: "w9PrawdaTematLista",
                            borgarTopic: "w9PrawdaTematBorgara", borgarList: "w9PrawdaRozmowaBorgara", vars: "w9PrawdaZmienne", act: "w9PrawdaAkcja" } }
                ],
                lines: {
                },
                // the ones a truth can be told to (Underground_Data.TRUTH_WHO keys); talk: who hears it (default: the same key)
                truths: {
                    borgar: { talk: "borgar",
                        told: { flag: "borgarKnows" } },
                    melia: { talk: "melia",
                        told: { trust: { melia: 5 }, flag: "w9Verse8" } },
                    ozzy: { talk: "ozzy",
                        told: { trust: { ozzy: 5 } } },
                    grum: { talk: "grum",
                        told: { trust: { grum: 5 }, flag: "grumLetterKnown" } },
                    piekarka: {
                        told: { opinion: 2, flag: "w9Loaf" } },
                    woziwoda: {
                        told: { opinion: 1 } },
                    feliks: {
                        told: { flag: "feliksShaken" } },
                    dzwonnik: {
                        told: { opinion: 1, flag: "w9Bell" } },
                    kowal: {
                        told: { opinion: 1 } },
                    kapral: {
                        told: { opinion: -1, flag: "witWary" } },
                    ludmila: {
                        told: { opinion: 2, flag: "w9Lullaby" } },
                    lord: { talk: "lord",
                        tellIf: [["lordAlly", ["(Lord się uśmiecha, pierwszy raz bez dworskiej miny.) Przychodź czasem. Pogadać. O czymkolwiek."]]],
                        told: { flag: "lordTruth" } },
                    soltys: {
                        tellIf: [["cisternOpen", ["Teraz przynajmniej jest co liczyć. Zasypiam przy czterdziestym wiadrze. Pięknie."]]],
                        told: { opinion: 1 } },
                    kupiec: {
                        told: { flag: "balthazarWary" } },
                    garbarz: {
                        told: { opinion: 1 } },
                    rafal: {
                        told: { flag: "rafalTrust" } },
                    dziadek: { talk: "grandpa",
                        told: { flag: "grandpaTruth" } },
                    kot: { talk: "grandpa",
                        told: { flag: "catTruth" } }
                }
            }
        }
    });
})();
