//=============================================================================
// W2_Data.js
//=============================================================================
// The data of the arc W2 (docs/QUESTY.md W2) on the thread engine (Watki.js, 2026-10-29, etap 4 - docs/WATKI_DANE.md): the
// thread "w2" with its quest W2 (the bell's code: the signals, Ambroży's apprentice, the knights' garden, the shadow, the archive, the chronicles (rozdz. 1-6; rozdz. 7 is Pustelnia.js's)). TownQuests_Data.js puts the quest into QUESTS at its old place
// (ARC("w2", "W2")), its words come from js/teksty/w2.txt (merged there by id), its steps' code is TownQuests.js's (W2_HAKI).

/*:
 * @target MZ
 * @plugindesc [W2] Dane wątku na silniku wątków (Watki.js): zadanie W2, jego kroki i haki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * W2_Data.js - dane wątku W2
 * ============================================================================
 * Same dane: zadanie W2 jako wątek „w2” silnika (Watki.js). Musi stać
 * nad TownQuests_Data.js (ten wkłada zadanie na jego stare miejsce w liście).
 * Kod kroków: TownQuests.js (W2_HAKI). Teksty: js/teksty/w2.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    // the quest W2 as the thread "w2" (paczka: false - TownQuests_Data.js puts it into QUESTS at its old place; tekstyZadan: false - its
    // words are merged there by id from w2.txt). The steps' names are the handlers' names TownQuests always had (Underground.js and
    // old saves know the steps by them and by their numbers - both unchanged); their hooks: TownQuests.js W2_HAKI
    Watki.watek({
        id: "w2", wtyczka: "TownQuests", teksty: "w2", paczka: false, tekstyZadan: false,
        zadania: {
            // W2 (chapters 1-6; 7 "Jedno pytanie" at the hermitage - Pustelnia.js; 8 waits). Starts by itself at the first bell heard
            // at a strange hour
            W2: { kind: "W", giver: null, icon: 0, autoStart: "startW2", start: { hak: "w2Slyszal" },
                lines: {
                },
                kroki: [
                    // rozdz. 1: a bell heard at a strange hour, then Ambroży asked about it
                    { nazwa: "w2Heard", ch: 1, gotowe: { hak: "w2Slyszal" } },
                    { nazwa: "w2Pytaj", ch: 1, type: "talk", to: "dzwonnik", hours: [6.3, 17.7] },
                    // rozdz. 2: Ambroży's apprentice (D16)
                    { nazwa: "w2Apprentice", ch: 2, gotowe: "zrobione:D16" },
                    // rozdz. 3: three different signals noted ({n} in the step's words)
                    { nazwa: "w2Table", ch: 3, gotowe: { hak: "w2Tabela" } },
                    // rozdz. 4: the table shown to Ambroży at the bell - his key to the knights' garden's gate
                    { nazwa: "w2Key", ch: 4, type: "talk", to: "dzwonnik", hours: [17.7, 18.3], haki: { hand: "w2Klucz" } },
                    // rozdz. 5: into the knights' garden, seven strikes at noon, the shadows on the slab
                    { nazwa: "w2Garden", ch: 5, haki: { tick: "w2Ogrod" } },
                    { nazwa: "w2Ring", ch: 5, haki: { talk: "w2DzwonRozmowa", ready: "w2DzwonZnacznik", act: "w2DzwonAkcja" } },
                    { nazwa: "w2Shadow", ch: 5, haki: { tick: "w2Cienie" } },
                    // rozdz. 6: the Archive (Map119) - the Book of Signals, the chronicles (take / leave / to Ambroży)
                    { nazwa: "w2Archive", ch: 6, spots: ["w2_book", "w2_chron"],
                        haki: { spot: "w2ArchiwumMiejsce", wanted: "w2ArchiwumChce", act: "w2ArchiwumAkcja" } },
                    { nazwa: "w2Kroniki", ch: 6, type: "bring", to: "dzwonnik", need: [["v:kroniki", 1]], hours: [6, 18.3],
                        reward: { opinion: 3, xp: 50, flag: "ambrozyChronicles" } },
                    // (2026-10-16, pakiet A - docs/miejsca_wyspy/KONCEPCJA.md 3: rozdz. 7 przeniesiony do pustelni na klifie) ONE step that walks
                    // its own stages (Pustelnia.js: its thread's `obce` gives TownQuests.FX.w2Pytanie, r.t.w2s): Ambroży gives the bell's heart
                    // (Act II) -> brother Kleofas hangs it in the scriptorium's tower -> the Night of the Question (the Wigilia, midnight: seven
                    // strikes) -> one question; after it the step says rozdz. 8 "Alarm" waits (Act III). It stays the LAST step: rozdz. 6 jumps
                    // to q.steps.length - 1, and old saves standing on the old pause (this index) land here
                    { nazwa: "w2Pytanie", obcy: "pustelnia", ch: 7, talk: "w2Pytanie", tick: "w2Pytanie", vars: "w2Pytanie" }
                ]
            }
        },
        // the chronicles taken: Baltazar buys them (300 G) - TownQuests' side talk with the merchant (not a step: its script calls
        // ["W2", "fx", "w2Sell", 1 | 0]) - a hook for W5 (flags w5ChroniclesSold / w5ChroniclesKept)
        obce: [{ zadanie: "W2", nazwa: "w2Sell", haki: { act: "w2Sprzedaj" } }]
    });
})();
