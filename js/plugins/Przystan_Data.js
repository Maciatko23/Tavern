//=============================================================================
// Przystan_Data.js
//=============================================================================
// The data of the harbour (Map125, docs/przystan/KONCEPCJA.md) on the thread engine (Watki.js, 2026-10-29, etap 4 -
// docs/WATKI_DANE.md): the thread "przystan" with its quests K47, K48, D20, W10 (moved from TownQuests_Data.js - it puts them into
// QUESTS at their old places: ARC("przystan", "K47")...); Przystan.js is the engine (its hooks).

/*:
 * @target MZ
 * @plugindesc Przystań (mapa 125) - dane wątku: zadania Janka i Rocha (K47, K48, D20, W10), rozmowy, stan. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Watki
 * @orderBefore TownQuests_Data
 *
 * @help
 * ============================================================================
 * Przystan_Data.js - dane wątku „przystan”
 * ============================================================================
 * Same dane: zadania przystani jako wątek silnika (Watki.js). Musi stać nad
 * TownQuests_Data.js (ten wkłada zadania na ich stare miejsca w liście).
 * Kod: Przystan.js (haki wątku). Teksty: js/teksty/przystan.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    // (the actions keep the old names of Przystan.act - their code: Przystan.js's hook "akt")
    const akt = name => [{ hak: "akt", args: [name] }];

    // ------------------------------------------------------------------
    // The thread (the engine Watki.js, docs/WATKI_DANE.md, 2026-10-28; its data here since 2026-10-29): the harbour's state, the
    // quests of Janek and Roch (K47, K48, D20, W10 - paczka: false: TownQuests_Data.js puts them into QUESTS at their old places;
    // tekstyZadan: false: their words are merged there by id from zadania_k.txt (K47, K48), zadania_d.txt (D20) and w10.txt (W10)),
    // the first meetings, Roch's night, the officer's offer. The steps' names: the handlers' names TownQuests always had (old saves
    // know the steps by their numbers - unchanged); the steps with no code have names of their own. Its words: js/teksty/przystan.txt;
    // the hooks: Przystan.js (the menus with fish, goods and letters stay code - Watki.mowa)
    // ------------------------------------------------------------------
    const w = Watki.watek({
        id: "przystan", wtyczka: "Przystan", teksty: "przystan", paczka: false, tekstyZadan: false,
        // the meetings live in TownQuests' flags (the quests' offers ask them), the rest here; w10: W10's letters (Przystan.js)
        stan: { klucz: "przystan", wersja: 1, domyslne: () => ({ celnikMet: 0, runDay0: 0, letterDay: 0, letterHour: 0, newsGiven: 0, sold: 0,
            janekBetrayTold: 0, newsN: 0, w10: null, usualN: 0 }) },
        // "\n" a new line; "@key: text" - another resident of the harbour speaks (TownLife's event - Przystan.js finds him)
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        zadania: {
            // ======================================================= (2026-10-14) THE HARBOUR (Map125, docs/przystan/KONCEPCJA.md)
            // Janek the fisherman and Roch Szkwał the smuggler (the prologue's people). Their first meetings, Janek's fish trade, the
            // ferry, the cutter's states and the night run: Przystan.js
            // K47 "Pierwszy połów": two herrings from the sea (no rod: Janek gives his - the offer's option, k47Rod below)
            K47: { kind: "K", giver: "janek", icon: 173,
                offer: {
                    cond: { hours: [8, 20], flags: ["janekMet"] },
                    options: [
                        { then: "accept" },
                        { then: "accept", fx: "k47Rod" },
                        { then: "decline" }
                    ]
                },
                kroki: [
                    { nazwa: "k47Sledzie", type: "bring", to: "janek", need: [[173, 2]], hours: [5, 21] }
                ],
                reward: { xp: 40, items: [[106, 2]], flag: "rybackaRada" } },
            // K48 "Sieci po sztormie"
            K48: { kind: "K", giver: "janek", icon: 92,
                offer: {
                    cond: { hours: [9, 20], flags: ["janekMet"] }
                },
                kroki: [
                    { nazwa: "k48Sieci", type: "bring", to: "janek", need: [[92, 6], [93, 2]], hours: [6, 21] }
                ],
                reward: { gold: 20, xp: 40, items: [[106, 2]] } },
            // D20 "Kuter na pochylni": the wreck onto the slipway at dawn, the boards, the tar, the sail - and the night it sails (the
            // hero helps Roch, or gives him to the customs officer: Przystan.js)
            D20: { kind: "D", giver: "przemytnik", icon: 80,
                offer: {
                    cond: { hours: [6, 21], flags: ["rochMet"] }
                },
                kroki: [
                    { nazwa: "d20Janek", type: "talk", to: "janek", hours: [8, 20] },
                    { nazwa: "d20Wrak", type: "spot", spot: "przystan_wrak", hours: [5, 10], need: [[93, 2]],
                        reward: { flag: "d20Pochylnia" } },
                    { nazwa: "d20Burta", type: "bring", to: "przemytnik", need: [[80, 8], [88, 20]], hours: [6, 22] },
                    { nazwa: "d20Smola", type: "bring", to: "drwal", need: [[61, 6]], hours: [6, 21], gives: [[176, 2]] },
                    { nazwa: "d20Zagiel", type: "bring", to: "praczka", need: [[92, 10]], hours: [6, 18], vgives: { zagiel: 1 } },
                    { nazwa: "d20Kuter", type: "bring", to: "przemytnik", need: [[176, 2], ["v:zagiel", 1]], hours: [6, 22],
                        reward: { flag: "d20Gotowy" } },
                    // the night: the hero helped Roch sail, or gave him away
                    { nazwa: "d20Noc", type: "custom", gotowe: { lub: ["flaga:d20Pomoc", "flaga:d20Wydany"] } }
                ],
                reward: { xp: 150 } },
            // W10 "List do matki"
            W10: { kind: "W", giver: "janek", icon: 175,
                offer: {
                    cond: { hours: [8, 20], flags: ["janekMet"], day: 4 }
                },
                kroki: [
                    // the letter sent (by the ferry or the cutter), the news from the mainland
                    { nazwa: "w10Wyslany", type: "custom", ch: 1, gotowe: { lub: ["flaga:w10Prom", "flaga:w10Kuter"] } },
                    { nazwa: "w10Wiesc", type: "custom", ch: 2, gotowe: "flaga:w10Wiesc" },
                    // (2026-10-17, the user's variant A - Przystan.js: the letters, the answers, the epilogue line, F9) the old "pause" was
                    // step 2: a save waiting there now waits for the first letter. The mother's letters come by the ferry or Roch's cutter:
                    // the first 8 days after the news, the second 10-16 days later, the third about Act III; grandpa reads the first one
                    // (his talk skipped in a game without the story - no grandpa); the step's words by the hero's answer (w10Vars below)
                    { nazwa: "w10List1", type: "custom", ch: 3, gotowe: "ile:w10.got>=1", reward: { xp: 40 } },
                    { nazwa: "w10BezFabuly", type: "talk", to: "grandpa", ch: 3, gotowe: "!fabula",
                        reward: { xp: 60, flag: "w10Dziadek" } },
                    { nazwa: "w10List2", type: "custom", vars: "w10Vars", ch: 4, gotowe: "ile:w10.got>=2", reward: { xp: 40 } },
                    { nazwa: "w10List3", type: "custom", vars: "w10Vars", ch: 5, gotowe: "ile:w10.got>=3",
                        reward: { xp: 60 } }
                ],
                reward: { xp: 150 } }
        },
        // what is no step of its own: K47's offer option (Janek's rod), W10's words of two steps
        obce: [
            { zadanie: "K47", nazwa: "k47Rod", haki: { pick: "wedka" } },
            { zadanie: "W10", nazwa: "w10Vars", zmienne: "w10Zmienne" }
        ],
        rozmowy: {
            janekSpotkanie: ["janekMeet", { zrob: "janekMet" }, "janekMeet2"],
            janekZdrada: [{ zrob: "janekBetrayTold" }, "janekBetray"],
            rochSpotkanie: ["rochMeet", { zrob: "rochMet" }],
            // D20's night: the cutter is ready - tonight, while the guard sits by the brazier
            rochNoc: ["rochNightAsk", { wybor: [
                { etykieta: "kod.rochTalk.0", tresc: [{ zrob: "d20Help" }, "rochNightHelp"] },
                { etykieta: "kod.rochTalk.1", tresc: ["rochNightLater"] }
            ], anuluj: 1 }],
            celnikSpotkanie: [{ zrob: "celnikMet" }, "celnikMeet"],
            // D20: the hero may give Roch away - in the customs house, at the officer's desk
            celnikDonos: [{ hak: "zwykle", args: ["celnik", "kod.celnikTalk.1"] }, { wybor: [
                { etykieta: "kod.celnikTalk.2", tresc: ["betrayAsk", { wybor: [
                    { etykieta: "kod.celnikTalk.4", tresc: [{ zrob: "d20Betray" }, "betrayYes"] },
                    { etykieta: "kod.celnikTalk.5", tresc: ["kod.celnikTalk.6"] }
                ], anuluj: 1 }] },
                { etykieta: "kod.celnikTalk.3", tresc: [] }
            ], anuluj: 1 }]
        },
        akcje: { janekMet: akt("janekMet"), janekBetrayTold: akt("janekBetrayTold"), rochMet: akt("rochMet"), d20Help: akt("d20Help"),
            celnikMet: akt("celnikMet"), d20Betray: akt("d20Betray") }
    });
})();
