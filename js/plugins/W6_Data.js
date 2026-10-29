//=============================================================================
// W6_Data.js
//=============================================================================
// The data of the arc W6 (docs/QUESTY.md W6) on the thread engine (Watki.js, 2026-10-29, etap 4 - docs/WATKI_DANE.md): the
// thread "w6" with its quest W6 "Ludzie z promu" (Rafał's story, the wanted poster, the hiding, the second wave and the vote, the
// hub of rozdz. 6-7: the Wigilia and Marek). TownQuests_Data.js puts the quest into QUESTS at its old place (ARC("w6", "W6")), its
// words come from js/teksty/w6.txt (merged there by id), its steps' code is TownQuests.js's (W6_HAKI).

/*:
 * @target MZ
 * @plugindesc [W6] Dane wątku na silniku wątków (Watki.js): zadanie W6, jego kroki i haki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W6_Data.js - dane wątku W6
 * ============================================================================
 * Same dane: zadanie W6 jako wątek „w6” silnika (Watki.js). Musi stać
 * nad TownQuests_Data.js (ten wkłada zadanie na jego stare miejsce w liście).
 * Kod kroków: TownQuests.js (W6_HAKI). Teksty: js/teksty/w6.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W6 as the thread "w6" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from w6.txt). The steps' names are the handlers' names TownQuests always had (old saves know the
    // steps by their numbers - unchanged; TownQuests finds them by their `talk`: w6Story (TownLife's "w6Fire"), w6Poster (the board),
    // w6Choice / w6Hidden (Wit), w6Vote (w6Idx), w6Hub (rozdz. 6-7)); their hooks: TownQuests.js W6_HAKI
    Watki.watek({
        id: "w6", wtyczka: "TownQuests", teksty: "w6", paczka: false, tekstyZadan: false,
        zadania: {
            // W6 "Ludzie z promu" (2026-10-07: chapters 3-7; 1-2 are K19, K27, K28, K29, D4, D10, D18 - their flags make the camp's
            // trust). Rafał's story by the fire; the wanted poster (the tavern's quest board) and the choice - hide him (the tavern's
            // attic room, grandpa's house, the bell tower: each can be searched), turn him in, smuggle him on the ferry through Baltazar;
            // the second wave and the vote at the town hall (the weight of the hero's vote = his Opinia): the gate shut (the camp moves out
            // to Podgrodzie, wolves at night) or the refugees in with a week of work (two helpers harvest grandpa's field by themselves);
            // the winter's Wigilia (in the camp or in the tavern, the hero cooks for all); Marek (Act II): Ludmiła's kerchief turns him
            // from the wall in the diggers' cave, the hero leads him out (at night sneaking past the camp's guard, by force, or a word
            // with the guard) - flag marekSaved (W8 rozdz. 6 counts it) - and the reunion.
            // The outcome for Act III and the endings (TownQuests.state().flags / TownQuests.w6()): rafalAlly | rafalGiven + rafalEnemy |
            // rafalSmuggled | rafalTaken, campInside | campOutside, marekSaved, w6Wigilia (+ w6WigiliaCamp | w6WigiliaTavern).
            // Starts by itself from the first wave's day (10) once one of the camp's quests began
            W6: { kind: "W", giver: null, icon: 0, autoStart: "startW6", start: { hak: "w6Start" },
                reward: { xp: 300, opinion: 2 },
                lines: {
                    // ---- rozdz. 3 "Kim był Rafał"
                    // ---- rozdz. 4 "List gończy"
                    // ---- rozdz. 5 "Druga fala"
                    quarrel: [[["woziwoda", "Po kolei! Najpierw piekarnia i kuźnia, potem reszta!"], ["ludmila", "Dziecko pić chce, nie piec!"]],
                        [["piekarka", "Przydział to przydział, kochana."], ["ludmila", "Przydział dla swoich. A my czyi?"]],
                        [["woziwoda", "Nowi z promu - do tyłu! Sołtys tak kazał!"], ["zlodziej", "A jak sołtys każe skakać do studni?"]],
                        [["kowal", "Woda dla kuźni! Bez wody nie ma podków!"], ["woziwoda", "Dla wszystkich po równo, Tadek!"]]]
                },
                kroki: [
                    // rozdz. 2 -> 3: the camp trusts the hero (three deeds) and Rafał does ({trust}, {rafal}: w6Vars - obce below)
                    { nazwa: "w6Trust", ch: 2, vars: "w6Vars", haki: { check: "w6Zaufanie" } },
                    // rozdz. 3 "Kim był Rafał": by the camp's fire at night (TownLife's "w6Fire" seats him there 20:30-23:30)
                    { nazwa: "w6Story", ch: 3, haki: { talk: "w6OpowiescRozmowa", ready: "w6OpowiescZnacznik", act: "w6OpowiescAkcja" } },
                    // rozdz. 4: the wanted poster - from the next day on the tavern's quest board and its outer wall; or Wit tells it
                    { nazwa: "w6Poster", ch: 4, spots: ["notice_tavern"], vars: "w6Vars",
                        haki: { enter: "w6ListWejscie", tick: "w6ListPapier", wanted: "w6ListChce", spot: "w6ListMiejsce", talk: "w6ListRozmowa",
                            ready: "w6ListZnacznik", act: "w6ListAkcja" } },
                    // ...the choice: Rafał (hide him / the ferry), Baltazar (the ferry: 50 G), Wit (turn him in); undecided on the search day
                    // (10:00) - the guard finds him in the camp
                    { nazwa: "w6Choice", ch: 4, vars: "w6Vars",
                        haki: { talk: "w6WyborRozmowa", ready: "w6WyborZnacznik", tick: "w6WyborRewizja", act: "w6WyborAkcja" } },
                    // ...hidden for seven days (the place shows him): the corporal's search on the third day, back on the seventh
                    { nazwa: "w6Hidden", ch: 4, spots: ["w6_hide_tavern", "w6_hide_grandpa", "w6_hide_belfry"], vars: "w6Vars",
                        haki: { wanted: "w6KryjowkaChce", spot: "w6KryjowkaMiejsce", talk: "w6KryjowkaRozmowa", ready: "w6KryjowkaZnacznik",
                            tick: "w6KryjowkaDni" } },
                    // rozdz. 5 "Druga fala": the second wave's ferry (its tick: w6Wave - obce below) and the vote at the town hall
                    { nazwa: "w6Vote", ch: 5, tick: "w6Wave", vars: "w6Vars", haki: { talk: "w6GlosRozmowa", ready: "w6GlosZnacznik", act: "w6GlosAkcja" } },
                    // rozdz. 6 "Zima" and 7 "Marek" - one step (Act II may well begin before the winter; its chapter: ch)
                    { nazwa: "w6Hub", ch: 6, vars: "w6Vars",
                        haki: { enter: "w6HubWejscie", ch: "w6HubRozdzial", talk: "w6HubRozmowa", ready: "w6HubZnacznik", borgarTopic: "w6HubTematBorgara",
                            borgarList: "w6HubUBorgara", tick: "w6HubDzien", act: "w6HubAkcja" } }
                ]
            }
        },
        // the arc's handlers that are not one step's own: the words of five steps (w6Vars), rozdz. 5's tick (w6Wave), Ludmiła's offers'
        // condition (K27, K28, D10: offer.cond.fn "w6NotHated"), the camp's props (TownQuests_Data SPOTS w6_*: show / at / talkFx)
        obce: [
            { zadanie: "W6", nazwa: "w6Vars", haki: { vars: "w6Slowa" } },
            { zadanie: "W6", nazwa: "w6Wave", haki: { enter: "w6FalaWejscie", tick: "w6Fala" } },
            { zadanie: "K27", nazwa: "w6NotHated", haki: { cond: "w6NieWrogi" } },   // (also K28 and D10)
            { zadanie: "W6", nazwa: "w6Camp", haki: { show: "w6ObozJest" } },
            { zadanie: "W6", nazwa: "w6Second", haki: { show: "w6DrugaFalaJest" } },
            { zadanie: "W6", nazwa: "w6Work", haki: { show: "w6PracaJest" } },
            { zadanie: "W6", nazwa: "w6Helper", haki: { at: "w6PomocnikGdzie" } },
            { zadanie: "W6", nazwa: "w6Prop", haki: { spot: "w6RekwizytMowi" } }
        ]
    });
})();
