//=============================================================================
// W8_Data.js
//=============================================================================
// The data of the arc W8 (docs/QUESTY.md W8) on the thread engine (Watki.js, 2026-10-29, etap 4 - docs/WATKI_DANE.md): the
// thread "w8" with its quest W8 (Grum's mountains: the guide, the quarry, the diggers' camp, the letter, the Silent's settlement, Grum's choice and the duel). TownQuests_Data.js puts the quest into QUESTS at its old place
// (ARC("w8", "W8")), its words come from js/teksty/w8.txt (merged there by id), its steps' code is TownQuests.js's (W8_HAKI).

/*:
 * @target MZ
 * @plugindesc [W8] Dane wątku na silniku wątków (Watki.js): zadanie W8, jego kroki i haki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W8_Data.js - dane wątku W8
 * ============================================================================
 * Same dane: zadanie W8 jako wątek „w8” silnika (Watki.js). Musi stać
 * nad TownQuests_Data.js (ten wkłada zadanie na jego stare miejsce w liście).
 * Kod kroków: TownQuests.js (W8_HAKI). Teksty: js/teksty/w8.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W8 as the thread "w8" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from w8.txt). The steps' names are the handlers' names TownQuests always had (old saves know the
    // steps by their numbers - unchanged); their hooks: TownQuests.js W8_HAKI. A step with several handlers (rozdz. 4: talk w8Letter,
    // tick w8Wall, spotFx w8Crate) is named by one of them - the others, and the words of rozdz. 2-6 (vars w8Vars), are bound by
    // `obce` below; the step's fields keep naming them as before
    Watki.watek({
        id: "w8", wtyczka: "TownQuests", teksty: "w8", paczka: false, tekstyZadan: false,
        zadania: {
            // W8 (chapters 1-6; 2026-10-06: the mountains are on the maps - Map013 "Góry i kamieniołom", Map014 "Jaskinia", Map120 "Osada
            // Milczących", their "Miejsce: ..." markers). Grum goes with the hero only as a picture at each place (a quest's place with his
            // sheet and bust) - there are no followers. Starts by itself after a win over Grum at arm-wrestling and at dice
            W8: { kind: "W", giver: null, icon: 0, autoStart: "startW8", start: { hak: "w8Start" },
                lines: {
                    // ---- rozdz. 2 "Przewodnik" (2026-10-06)
                    // ---- rozdz. 3 "Obóz kopaczy"
                    // (2026-10-07) Marek already brought out by the hero (W6 rozdz. 7): his niche is empty
                    // ---- rozdz. 4 "List z rozkazem"
                    // ---- rozdz. 5 "Co Serce robi z człowiekiem" (Osada Milczących, Act II)
                    // ---- rozdz. 6 "Wybór Gruma"
                },
                kroki: [
                    // rozdz. 1: Grum asks about the mountains
                    { nazwa: "w8Ask", ch: 1, haki: { talk: "w8PytaRozmowa", ready: "w8PytaZnacznik", act: "w8PytaWybor" } },
                    // rozdz. 2: Grum hires the hero - tomorrow at dawn
                    { nazwa: "w8Hire", ch: 2, haki: { talk: "w8NajemRozmowa", ready: "w8NajemZnacznik", act: "w8NajemAkcja" } },
                    // ...at dawn by the way into the mountains (Map013, 4:30-9) - missed: back to the hire
                    { nazwa: "w8Trip", ch: 2, spots: ["w8_start"], vars: "w8Vars",
                        haki: { wanted: "w8WyprawaChce", spot: "w8WyprawaMiejsce", act: "w8WyprawaAkcja", tick: "w8WyprawaCzas" } },
                    // ...to the Order's old quarry the same day
                    { nazwa: "w8Quarry", ch: 2, spots: ["w8_quarry"], vars: "w8Vars",
                        haki: { wanted: "w8KamieniolomChce", spot: "w8KamieniolomMiejsce", act: "w8KamieniolomAkcja", tick: "w8KamieniolomCzas" } },
                    // rozdz. 3: the diggers' camp in the cave (Map014)
                    { nazwa: "w8Camp", ch: 3, spots: ["w8_cave"], haki: { wanted: "w8ObozChce", spot: "w8ObozMiejsce", act: "w8ObozAkcja" } },
                    // rozdz. 4: the letter - Grum drunk (a topic in his menu), the thin wall (tick w8Wall), the commander's crate (spotFx w8Crate)
                    { nazwa: "w8Letter", ch: 4, tick: "w8Wall", spotFx: "w8Crate", spots: ["w8_crate"], vars: "w8Vars",
                        haki: { topic: "w8ListTemat", topicList: "w8ListRozmowa", ready: "w8ListZnacznik", act: "w8ListAkcja" } },
                    // rozdz. 5: the Silent's settlement (Act II) - the gate, then their circle
                    { nazwa: "w8Osada", ch: 5, spots: ["w8_gate", "w8_osada"], vars: "w8Vars",
                        haki: { wanted: "w8OsadaChce", spot: "w8OsadaMiejsce", act: "w8OsadaAkcja" } },
                    // rozdz. 6: Grum's choice (count: two of three - Rywal.js and the tests ask TownQuests.FX.w8Choice.count())
                    { nazwa: "w8Choice", ch: 6, vars: "w8Vars",
                        haki: { count: "w8Licz", topic: "w8WyborTemat", topicList: "w8WyborRozmowa", ready: "w8WyborZnacznik", act: "w8WyborAkcja" } },
                    // ...the fight at the tunnel's mouth (Map014) - its end comes on the bus (TownQuests.js: humansDone / heroRobbed)
                    { nazwa: "w8Duel", ch: 6, haki: { tick: "w8Pojedynek" } }
                ]
            }
        },
        // the handlers the steps above name besides their own: the words of rozdz. 2-6, rozdz. 4's wall and crate
        obce: [
            { zadanie: "W8", nazwa: "w8Vars", haki: { vars: "w8Zmienne" } },
            { zadanie: "W8", nazwa: "w8Wall", haki: { enter: "w8ScianaWejscie", tick: "w8Sciana" } },
            { zadanie: "W8", nazwa: "w8Crate", haki: { wanted: "w8SkrzyniaChce", spot: "w8SkrzyniaMiejsce" } }
        ]
    });
})();
