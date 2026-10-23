//=============================================================================
// Kasztelan_Data.js
//=============================================================================
// W4 "Krew kasztelana", chapters 6-8 as data (docs/WATKI_DANE.md - the thread engine Watki.js; the pilot of 2026-10-23): the chapters
// (steps 6-9 of TownQuests' W4 - an old save's step number stays its step), the talks (trees of text keys), the actions, Borgar's
// topics at the bar, the F9 jumps. The words: js/teksty/kasztelan.txt. The code that only code can do (the clues read from the game,
// the shut day and the nights, the injected events, the grate, the basket, the Heart) is Kasztelan.js - its hooks are named here.
// Conditions (gdy) and actions (zrob): Watki.js, the comments above ok() and wykonaj(); talks: above build().

/*:
 * @target MZ
 * @plugindesc [W4] Dane wątku „Krew kasztelana” rozdz. 6-8 dla silnika wątków (Watki.js): rozdziały, rozmowy, akcje, skoki F9. Teksty: js/teksty/kasztelan.txt. v1.0.0
 * @author Claude
 * @base Watki
 * @base TownQuests
 * @orderAfter Watki
 * @orderAfter TownQuests
 *
 * @help
 * ============================================================================
 * Kasztelan_Data.js - wątek W4 rozdz. 6-8 jako dane
 * ============================================================================
 * Same dane: silnik Watki.js je czyta, a kod specjalny ma Kasztelan.js
 * (zaraz pod tym plikiem). Teksty w js/teksty/kasztelan.txt.
 * ============================================================================
 */

(() => {
    "use strict";
    const W = window.Watki;
    if (!W) { console.warn("Kasztelan_Data.js: brak Watki.js - wątek W4 rozdz. 6-8 wyłączony"); return; }

    // the places of the hero after an F9 jump: [map, x, y, direction]
    const MAP = { tavern: 1, town: 8, cellar: 9, floor10: 140, house: 19, cairn: 20 };
    const AT_BAR = [MAP.tavern, 52, 31, 8];
    // chapter 7 "tell him": the clues the hero speaks of (each only when he has it)
    const SLOWA = { lub: ["stan:clues.wpis", "stan:clues.przeor", "stan:clues.kleofas", "stan:clues.napis"] };
    // a clue told in a talk (Kleofas, grandpa): kept, its note, the experience (quiet), the notice, the quests' checks
    const clue = (key, note) => [
        { gdy: "stan:clues." + key, koniec: true },
        { stan: { ["clues." + key]: "dzis" } },
        { notatka: note },
        { xp: 40, za: "W4: {nazwa}", zmienne: { hak: "poszlakaZmienne", args: [key] } },
        { ogloszenie: "poszlaka", zmienne: { hak: "poszlakaZmienne", args: [key] } },
        { sprawdz: true }
    ];
    // Borgar's answer (the cellar's night, or at once when prepared): he comes along / keeps the grate (by agreement / refusing)
    const verdict = (stance, flags, note) => [
        { gdy: ["stan:stance", "!stan:stance=niewie"], koniec: true },
        { stan: { stance: stance === "idzie" ? "idzie" : "pilnuje", verdict: "dzis" } },
        ...flags.map(f => ({ flaga: f })),
        ...(stance === "ostrzegl" ? [{ stan: { warned: "dzis" } }] : []),
        { ogloszenie: "tops." + stance },
        { krok: ["w4Piwnica", "w4Konfrontacja"], do: "w4Serce", nagroda: { xp: 200, opinion: stance === "idzie" ? 2 : 0, notatka: note } },
        { hak: "sync" }
    ];
    // F9: the things of the chapters before ("klucz": the castellan's key when missing; "otwarta": the grate open; "slowa": Borgar said
    // the guardian's words; "zapiski": the Order's notes of floors 3, 6, 10 read - three clues)
    const KEY = { gdy: "!v:klucz_kasztelana", v: ["klucz_kasztelana", 1] };
    const RESET = { stan: { stance: "", how: "", closed: 0 } };

    W.watek({
        id: "kasztelan", wtyczka: "Kasztelan", teksty: "kasztelan", zadanie: "W4",
        stan: {
            klucz: "kasztelan", wersja: 1,
            domyslne: () => ({
                clues: {}, rod: 0,                                   // 6: the clues found (key -> day), the chapter's note written
                how: "", closed: 0, stance: "", verdict: 0,          // 7: tell / keep, the shut day, idzie | pilnuje | niewie
                warned: 0, fired: 0, back: 0,                        // the warning, the shifts gone, back after the siege
                basket: -1, postSeen: 0, keyLock: 0, end: ""         // the basket's day, the first night at the post, the Heart's lock, the end
            })
        },
        // the hero's thoughts: a bubble 230 frames, the next after 240, not while a talk runs
        mysli: { klatki: 230, odstep: 240, czekaj: true },

        // ---------------------------------------------------------- the chapters: W4's steps 6-9
        kroki: [
            // 6: three clues (the Order's notes underground, the chronicles, Kleofas, grandpa) - the game shows some by itself
            { nazwa: "w4Rod", indeks: 6, ch: 6, gotowe: "rodGotowe", zmienne: "rodZmienne", nagroda: { xp: 120 },
                nagrodaFx: { nazwa: "w4RodReward", hak: "rodNagroda" },
                rozmowy: [
                    { kto: "pustelnik", gdy: "!stan:clues.kleofas", tresc: ["kleofas", { zrob: "poszlakaKleofas" }] },
                    { kto: "grandpa", gdy: "!stan:clues.dziadek", tresc: ["dziadek", { zrob: "poszlakaDziadek" }] }
                ] },
            // 7: at the bar after closing (23-1), only after chapter 1
            { nazwa: "w4Konfrontacja", indeks: 7, ch: 7,
                temat: { kto: "borgar", etykieta: "topic", gotowy: ["rozdzial1", "poZamknieciu", "!barNieMa"], tresc: [{ rozmowa: "konfrontacja" }] } },
            // 7: the shut day and the night in the cellar (the talk: Borgar's injected event - Kasztelan.js)
            { nazwa: "w4Piwnica", indeks: 8, ch: 7, zmienne: "piwnicaZmienne" },
            // 8: the Heart - any of its endings closes the arc; after the siege the fired hero is taken back
            { nazwa: "w4Serce", indeks: 9, ch: 8, gotowe: "koniecLuku", zmienne: "serceZmienne", nagroda: { xp: 400 },
                temat: { kto: "borgar", etykieta: "reconcileTopic", gdy: "pogodzenieGotowe", tresc: [{ rozmowa: "pogodzenie" }] } }
        ],

        // ---------------------------------------------------------- the talks (keys of js/teksty/kasztelan.txt)
        rozmowy: {
            konfrontacja: [
                { gdy: "!rozdzial1", mow: "notYet", koniec: true },
                { gdy: "!poZamknieciu", losowo: "notNow", koniec: true },
                "intro", "introHero", "ask",
                { wybor: [
                    { etykieta: "optTell", tresc: [{ rozmowa: "powiedz" }] },
                    { etykieta: "optKeep", tresc: [{ rozmowa: "przemilcz" }] },
                    { etykieta: "optLater", tresc: ["later"] }
                ], anuluj: 2 }
            ],
            powiedz: [
                "tellCore",
                { gdy: "stan:clues.lista", mow: "tellLista" },
                { gdy: SLOWA, mow: "tellSlowa" },
                { gdy: "stan:clues.dziadek", mow: "tellDziadek" },
                "tellKlucz",
                { gdy: "nocePending", mow: "tellNoce" },
                { zrob: "tell", args: [{ hak: "nocePending" }] },
                { gdy: ["flaga:w7LordFirst", "!flaga:w7KlamstwoWyszlo"], mow: "lordFirst" },
                { jesli: "przygotowany",
                    to: [{ jesli: { lub: ["flaga:w3Borgar", "flaga:w4Faster"] }, to: ["preparedSong"], inaczej: ["preparedNights"] },
                        { rozmowa: "werdykt", ustaw: { noce: { hak: "nocePending" } } }],
                    inaczej: ["anger", { zrob: "anger" }] }
            ],
            przemilcz: ["keepThink", "keepSay", "keepBorgar", { zrob: "keep" }],
            // the grandmother's words, then the hero's ask (ctx.noce: his nights told in the same talk)
            werdykt: [
                "grandma",
                { gdy: { lub: ["flaga:borgarKnows", "ctx:noce"] }, mow: "grandmaNights" },
                "grandmaEnd", "verdictAsk",
                { wybor: [
                    { etykieta: "optCome", tresc: ["askCome", { jesli: "zaufanie",
                        to: [{ hak: "powodyTak" }, "comeYes", { zrob: "idzie" }],
                        inaczej: ["comeNo", { hak: "powodyNie" }, "comeNoEnd", { zrob: "ostrzegl" }] }] },
                    { etykieta: "optStay", tresc: ["askStay", "stayYes", { zrob: "pilnuje" }] }
                ], anuluj: -1 }
            ],
            pogodzenie: ["reconcile", { zrob: "pogodzenie" }],
            // the injected events and the tavern's own (Kasztelan.js runs them)
            piwnicaBorgar: [{ jesli: "nocWPiwnicy", to: ["cellarIntro", { rozmowa: "werdykt", ustaw: { noce: false } }], inaczej: [{ losowo: "cellarGuard" }] }],
            warta: [{ jesli: "ctx:pierwszy", to: ["postFirst"], inaczej: [{ losowo: "postLines" }] }],
            kosz: ["basketTake"],
            zamkniete: ["closedBar"],
            krata: ["grateWarn", "grateAsk", { wybor: [
                { etykieta: "optDown", tresc: [{ zrob: "zwolnij" }, { skrypt: "Kasztelan.grateDown(this)" }] },
                { etykieta: "optUp", tresc: [] }
            ], anuluj: 1 }]
        },

        // ---------------------------------------------------------- the actions (Watki.act(this, ["kasztelan", name, ...]))
        akcje: {
            poszlakaKleofas: clue("kleofas", "noteKleofas"),
            poszlakaDziadek: clue("dziadek", "noteDziadek"),
            // told: his nights at the grate said in the same breath count as W9's truth told
            tell: [{ stan: { how: "tell" } }, { flaga: "borgarWie" }, { gdy: "ctx:args.0", hak: "powiedzNoce" }],
            anger: [
                { stan: { closed: { hak: "dzienZamkniecia" } } }, { flaga: "borgarZamknal" }, { mysl: "angerThink" }, { notatka: "noteAnger" },
                { krok: "w4Konfrontacja", do: "w4Piwnica", nagroda: { xp: 100 } }
            ],
            keep: [
                { stan: { how: "keep", stance: "niewie" } }, { flaga: "borgarNieWie" },
                { krok: "w4Konfrontacja", do: "w4Serce", nagroda: { xp: 80, notatka: "noteKeep" } }
            ],
            idzie: verdict("idzie", ["borgarIdzie"], "notes.idzie"),
            pilnuje: verdict("pilnuje", ["borgarPilnuje"], "notes.pilnuje"),
            ostrzegl: verdict("ostrzegl", ["borgarPilnuje", "borgarOstrzegl"], "notes.ostrzegl"),
            // a descent after the warning: the shifts are gone (till the siege is over and they made up)
            zwolnij: [
                { gdy: { lub: ["!stan:warned", "stan:fired", "stan:back"] }, koniec: true },
                { stan: { fired: "dzis" } }, { flaga: "borgarZwolnil" }, { notatka: "noteFired" }, { mysl: "firedThink" }
            ],
            pogodzenie: [
                { gdy: { lub: ["!stan:fired", "stan:back"] }, koniec: true },
                { stan: { back: "dzis" } }, { flaga: "borgarPrzyjal" }, { notatka: "noteReconcile" }, { xp: 60, za: "W4" }
            ]
        },

        // ---------------------------------------------------------- F9: straight to a chapter (←→ 1-9: the 7th twice - the bar, the cellar)
        f9: { rodzaj: "isleW4", ikona: 189 },
        skoki: {
            wymaga: "fabula",
            przed: [{ gdy: "!rozdzial1", hak: "zamknijRozdzial1" }],
            lista: {
                1: { ch: 1, krok: 0, godzina: 11, idz: AT_BAR, zrob: [RESET] },
                2: { ch: 2, krok: 1, godzina: 12, idz: [MAP.cairn, 8, 7, 8], zrob: [{ v: ["klucz_borgar", 1] }, { przedmiot: [62, 1] }, RESET] },
                3: { ch: 3, krok: 2, godzina: 10, idz: [MAP.town, 9, 64, 4],
                    zrob: [{ v: ["klucz_borgar", 1] }, { v: ["klucz_kopiec", 1] }, { przedmiot: [86, 1] }, { przedmiot: [79, 2] }, RESET] },
                4: { ch: 4, krok: 4, godzina: 12, idz: [MAP.cellar, 15, 3, 8], zrob: [KEY, { hak: "krata", args: ["zamknij"] }, RESET] },
                5: { ch: 5, krok: 5, godzina: 12, idz: AT_BAR, zrob: [KEY, { hak: "krata", args: ["otworz"] }, RESET] },
                6: { ch: 6, krok: "w4Rod", godzina: 10, idz: [MAP.house, 10, 7, 8], zrob: [KEY, { hak: "krata", args: ["otworz"] }, { flaga: "borgarSaying" }, RESET] },
                7: { ch: 7, krok: "w4Konfrontacja", godzina: 23.5, idz: AT_BAR,
                    zrob: [KEY, { hak: "krata", args: ["otworz"] }, { flaga: "borgarSaying" }, { hak: "zapiski" }, RESET] },
                8: { ch: 7, krok: "w4Piwnica", godzina: 23.5, idz: [MAP.cellar, 14, 4, 6],
                    zrob: [KEY, { hak: "krata", args: ["otworz"] }, { flaga: "borgarSaying" }, { hak: "zapiski" },
                        { stan: { how: "tell" } }, { flaga: "borgarWie" }, { flaga: "borgarZamknal" }, { stan: { closed: "dzis" } }] },
                9: { ch: 8, krok: "w4Serce", godzina: 1.5, idz: [MAP.floor10, 5, 13, 2],
                    zrob: [KEY, { hak: "krata", args: ["otworz"] }, { flaga: "borgarSaying" }, { hak: "zapiski" },
                        { stan: { how: "tell" } }, { flaga: "borgarWie" },
                        { gdy: "!stan:stance", zrob: [{ stan: { stance: "idzie", verdict: "dzis" } }, { flaga: "borgarIdzie" }] }] }
            }
        }
    });
})();
