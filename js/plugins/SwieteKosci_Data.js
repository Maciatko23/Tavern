//=============================================================================
// SwieteKosci_Data.js
//=============================================================================
// The chain W15 "Święte kości" of the ferry's travellers (docs/PODROZNI.md 2.9, 2.10, 4.2 - stage 4, 2026-10-29) - the DATA; the
// engine: SwieteKosci.js, the words: js/teksty/swiete_kosci.txt. Gaspar Lis the relic seller (the traveller "relikwie", room 12, on
// the island from the ferry of day 13) preaches at the market with a "saint's bone", sells to the town, and at night sells the
// library list of the Lipnica monastery to Baltazar's courier; brother Augustyn the visitor of Lipnica (the traveller "wizytator",
// room 16, two ferries after Gaspar) knows the goods. Stands in the plugin list under Podroznicy_Data (its cast and its rooms) and
// above TownLife and TownQuests_Data, so that:
//   - the thread "swiete_kosci" (Watki.js) is made before TownQuests_Data: its state (Tawerna.state "swieteKosci", version 1), the
//     quest W15 (seven steps, chapters 1-5: the stall, the false bones, the visitor, the proof, Gaspar's box, the stone and the list,
//     the farewell) with its things (the medallion, the raven stone of the box, the list of Lipnica) and the remarks after it - into
//     window.TownQuestsPacks; the talks and the actions of its steps; the F9 jumps
//   - Gaspar and Augustyn keep their ferry one longer while the matter goes on (PodroznicyData.OBSADA's `zadania`: a getter - once,
//     and only while it would matter; their leaving after that is this chain's own ending, not Podroznicy's "bez końca")
// The hooks the data names (conditions, the words of the steps, the scenes, Act III's echo "kamienBaltazar"): SwieteKosci.js.
// Event ids 3050-3059 (the core's registry: owner "Lancuchy" 3050-3069 - W16 has 3060-3069): 3050 Baltazar's courier on the guests'
// floor (Map025) on the night of the sale.

/*:
 * @target MZ
 * @plugindesc [W15] Dane łańcucha „Święte kości”: Gaspar Lis (handlarz relikwii), brat Augustyn z Lipnicy, kurier Baltazara, skrzynka, kamień z krukiem, spis z Lipnicy. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @orderAfter Podroznicy_Data
 *
 * @help
 * ============================================================================
 * SwieteKosci_Data.js - dane łańcucha W15 „Święte kości” (docs/PODROZNI.md 4.2)
 * ============================================================================
 * Same dane: silnik to SwieteKosci.js, teksty js/teksty/swiete_kosci.txt.
 * Musi stać pod Podroznicy_Data i nad TownLife.js i TownQuests_Data.js.
 * Zadanie W15 trafia do TownQuests przez window.TownQuestsPacks.
 * Numery zdarzeń 3050-3059 (właściciel "Lancuchy"): 3050 - kurier Baltazara
 * na piętrze gości (mapa 25) w noc sprzedaży.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("SwieteKosci_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ who, where, how much
    const KTO = { gaspar: "relikwie", augustyn: "wizytator" };     // (the travellers' keys: Podroznicy_Data's cast = TownLife's residents)
    const MAP = { miasto: 8, pietro: 25, karczma: 1 };
    const IDS = [3050, 3059], OWNER = "Lancuchy";
    // Baltazar's courier on the guests' floor (Map025) before the door of room 12 (the door 81,53 - the corridor's cell above it),
    // on the night of the sale 22:00-23:30; the hero within `widzi` tiles notices him
    const KURIER = { id: 3050, map: MAP.pietro, x: 81, y: 52, dir: 2, sheet: "$Npc_Kurier", index: 0, godziny: [22, 23.5], widzi: 2.6 };
    // the days (from Gaspar's arrival G): the sermon on the first market day after it (G+1..G+7: day 14), the night of the sale G+9 (22)
    const CZAS = { kazanie: [9, 12], kazanieOd: 1, kazanieDo: 7, noc: 9, nocGodziny: [22, 24] };
    // the money (docs/PODROZNI.md 1.6: 25 G sure from Augustyn; the greedy ones - 80 G from Baltazar, 30 G from Gaspar)
    const CENY = { medalik: 2, kamienGaspar: 30, baltazar: 80, celnik: 5, dzialka: 30, jalmuzna: 25 };
    // the sermon's scene: the hero within `widzi` tiles of Gaspar; the people within `tlum` get a "!" (frames per bubble: `dymek`)
    const SCENA = { widzi: 10, tlum: 9, dymek: 150, przerwa: 40 };
    const RENOMA = { rynek: 3, bezKonca: -2 };
    const OPINIA = { rynek: 6, dzialka: -3 };
    const SLAWA = 3;
    // Act III (docs/PODROZNI.md 4.4): the faction's knowledge - at most ONE more scout in wave 3, not added to W9's / W7's (the flags
    // of every chain that gives it share one list: Act3Data.WIEDZA_FRAKCJI - SwieteKosci.js)
    const ECHA = { wiedza: ["kamienBaltazar"] };

    // ------------------------------------------------------------------ the things carried and the remarks (with the quest's pack)
    const VITEMS = {
        medalik_gaspara: { icon: 658 },
        kamien_gaspara: { icon: 319 },
        spis_lipnicy: { icon: 191 }
    };
    Watki.scal(VITEMS, "swiete_kosci", "rzeczy");   // (its words: js/teksty/swiete_kosci.txt, rzeczy)
    const REMARKS = [
        { id: "w15OzzyKazanie", who: "ozzy", flag: "w15Kazanie" },
        { id: "w15OzzyZwrot", who: "ozzy", flag: "gasparZdemaskowany" },
        { id: "w15Hanka", who: "piekarka", flag: "gasparZdemaskowany" }
    ];
    Watki.scal(REMARKS, "swiete_kosci", "uwagi");   // (its words: js/teksty/swiete_kosci.txt, uwagi)

    // ------------------------------------------------------------------ the talks of the steps
    // the four who know the bones are false (any step before the box, while fewer than two said it); Tadek - with the medallion
    const FALSZ = [
        { kto: "garbarz", gdy: ["!stan:falsz.ignac", "ile:falsz<2"], tresc: ["falsz.ignac", { zrob: "falsz", args: ["ignac"] }] },
        { kto: "kowal", gdy: ["!stan:falsz.tadek", "ile:falsz<2", "v:medalik_gaspara"], tresc: ["falsz.tadek", { zrob: "falsz", args: ["tadek"] }] },
        { kto: "pustelnik", gdy: ["!stan:falsz.kleofas", "ile:falsz<2"], tresc: ["falsz.kleofas", { zrob: "falsz", args: ["kleofas"] }] },
        { kto: "melia", gdy: ["!stan:falsz.melia", "ile:falsz<2"], tresc: ["falsz.melia", { zrob: "falsz", args: ["melia"] }] }
    ];
    // the proof after the night of the sale (the night itself: the courier on the floor, the wall - SwieteKosci.js): Józek Łata, and
    // Baltazar himself to his partner of W5
    const DOWOD = [
        { kto: "szmaciarz", gdy: ["poNocy", "!stan:dowod.jozek", "!dowodJest"], tresc: ["dowod.jozek", { zrob: "dowod", args: ["jozek"] }] },
        { kto: "kupiec", gdy: ["poNocy", "partnerBaltazara", "!stan:dowod.baltazar", "!dowodJest", { godziny: [8, 18] }], znacznik: false,
            tresc: ["dowod.baltazar", { zrob: "dowod", args: ["baltazar"] }] }
    ];
    const MA_KAMIEN = "v:kamien_gaspara", MA_SPIS = "v:spis_lipnicy";

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md 2.3a)
    const w = Watki.watek({
        id: "swiete_kosci", wtyczka: "SwieteKosci", teksty: "swiete_kosci",
        // version 1: the sermon seen, the four judges of the bones, the proof (1 full, 0.5 half - the wall heard with low Czujność),
        // the medallion bought, a raven stone sold to Gaspar, the night of the sale (set by F9; else Gaspar's arrival + 9), Gaspar's box
        // (rynek | augustyn | dzialka | szukal), the stone (kleofas | ambrozy | baltazar | celnik), the list (kleofas | augustyn |
        // baltazar), the chronicles given, the end (dobre | dzialka | uciekl), the scenes seen
        stan: { klucz: "swieteKosci", wersja: 1, domyslne: () => ({
            kazanie: 0, falsz: {}, dowod: {}, medalik: 0, kamienSprzedany: 0, noc: 0, kurier: 0,
            skrzynka: "", skrzynkaDzien: 0, kamien: "", spis: "", kroniki: 0, koniec: "", widziane: {} }) },
        // ("@key: ..." - that resident says it: SwieteKosci.js finds him)
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 230, czekaj: true },
        zadania: {
            // W15: once Gaspar is on the island and the hero met him, saw the sermon - or the day after it anyway
            W15: { kind: "W", giver: null, icon: 0,
                start: ["gasparJest", { lub: ["stan:kazanie>0", "gasparPoznany", "poKazaniu"] }],
                kroki: [
                    // 1 "Kram Gaspara": the sermon on the market day (or the day after it)
                    { nazwa: "w15Kram", ch: 1, gotowe: { lub: ["stan:kazanie>0", "poKazaniu", "augustynJest"] }, zmienne: "w15Zmienne", rozmowy: FALSZ.concat(DOWOD) },
                    // 1 "Fałszywe kości": two of four (or the visitor came - the bones may still be judged later, for the market)
                    { nazwa: "w15Falsz", ch: 1, gotowe: { lub: ["ile:falsz>=2", "augustynJest"] }, zmienne: "w15Zmienne", rozmowy: FALSZ.concat(DOWOD) },
                    // 2 "Wizytator z Lipnicy": the talk with brother Augustyn (his first meeting is Podroznicy's - this the next one)
                    { nazwa: "w15Augustyn", ch: 2, gotowe: "augustynOdplynal", zmienne: "w15Zmienne",
                        rozmowy: [{ kto: KTO.augustyn, gdy: "augustynJest", tresc: [{ rozmowa: "augustyn" }] }].concat(FALSZ, DOWOD) },
                    // 2 "Dowód": the night of the sale - the wall of room 12, the courier on the corridor; then Józek, Baltazar
                    { nazwa: "w15Dowod", ch: 2, gotowe: "dowodJest", zmienne: "w15Zmienne", rozmowy: FALSZ.concat(DOWOD) },
                    // 3 "Skrzynka Gaspara" (the turning point): at the market with Wit, before Augustyn, or a cut
                    { nazwa: "w15Skrzynka", ch: 3, gotowe: "stan:skrzynka", zmienne: "w15Zmienne",
                        rozmowy: [{ kto: KTO.gaspar, gdy: "gasparJest", tresc: [{ rozmowa: "konfrontacja" }] }].concat(FALSZ) },
                    // 4 "Kamień i spis": the stone - Kleofas, Ambroży, Baltazar, the customs officer; the list - Augustyn or Kleofas
                    { nazwa: "w15Komu", ch: 4, gotowe: ["stan:kamien", { lub: ["stan:spis", "!augustynJest"] }], zmienne: "w15Zmienne", nagroda: { xp: 20 },
                        rozmowy: [
                            { kto: "pustelnik", gdy: { lub: [MA_KAMIEN, MA_SPIS] }, tresc: [{ rozmowa: "kleofas" }] },
                            { kto: "dzwonnik", gdy: MA_KAMIEN, znacznik: false, tresc: [{ rozmowa: "ambrozy" }] },
                            { kto: "kupiec", gdy: [MA_KAMIEN, { godziny: [8, 18] }], znacznik: false, tresc: [{ rozmowa: "baltazar" }] },
                            { kto: "celnik", gdy: MA_KAMIEN, znacznik: false, tresc: [{ rozmowa: "celnik" }] },
                            { kto: KTO.augustyn, gdy: [MA_SPIS, "augustynJest"], tresc: [{ rozmowa: "augustynSpis" }] }
                        ] },
                    // 5 "Pożegnanie": Augustyn sails (his alms, the town's word of the cut) - or he is gone already
                    { nazwa: "w15Pozegnanie", ch: 5, gotowe: "!augustynJest", zmienne: "w15Zmienne", nagroda: { xp: 20 },
                        rozmowy: [{ kto: KTO.augustyn, gdy: "augustynJest", tresc: [{ rozmowa: "pozegnanie" }] }] }
                ],
                fail: {} }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        rozmowy: {
            augustyn: ["augustyn.rozmowa", { zrob: "augustyn" }],
            // the box: at the market (two opinions on the bones), before Augustyn (he is here), a cut, not yet
            konfrontacja: ["konfrontacja.zaczep", { wybor: [
                { etykieta: "konfrontacja.opcja.rynek", gdy: "ile:falsz>=2", tresc: ["konfrontacja.rynek", { zrob: "skrzynka", args: ["rynek"] }, "skrzynka.zawartosc"] },
                { etykieta: "konfrontacja.opcja.augustyn", gdy: "augustynJest", tresc: ["konfrontacja.augustyn", { zrob: "skrzynka", args: ["augustyn"] }, "skrzynka.zawartosc"] },
                { etykieta: "konfrontacja.opcja.dzialka", tresc: ["konfrontacja.dzialka", { zrob: "dzialka" }] },
                { etykieta: "konfrontacja.opcja.nic", tresc: ["konfrontacja.nic"] }
            ], anuluj: "ostatnia" }],
            // the stone and the list
            kleofas: ["komu.kleofas.pyta", { wybor: [
                { etykieta: "komu.kleofas.opcja.kamien", gdy: MA_KAMIEN, tresc: ["komu.kleofas.kamien", { zrob: "kamienKleofas" }] },
                { etykieta: "komu.kleofas.opcja.spis", gdy: MA_SPIS, tresc: ["komu.kleofas.spis", { zrob: "spisKleofas" }] },
                { etykieta: "komu.kleofas.opcja.nie", tresc: [] }
            ], anuluj: "ostatnia" }],
            ambrozy: ["komu.ambrozy.pyta", { wybor: [
                { etykieta: "komu.ambrozy.opcja.tak", tresc: ["komu.ambrozy.tak", { zrob: "kamienAmbrozy" }] },
                { etykieta: "komu.ambrozy.opcja.nie", tresc: [] }
            ], anuluj: 1 }],
            baltazar: ["komu.baltazar.pyta", { zmienne: { cena: CENY.baltazar }, wybor: [
                { etykieta: "komu.baltazar.opcja.tak", tresc: [{ zrob: "kamienBaltazar" }, "komu.baltazar.tak"] },
                { etykieta: "komu.baltazar.opcja.nie", tresc: [] }
            ], anuluj: 1 }],
            celnik: ["komu.celnik.pyta", { zmienne: { cena: CENY.celnik }, wybor: [
                { etykieta: "komu.celnik.opcja.tak", tresc: [{ zrob: "kamienCelnik" }, "komu.celnik.tak"] },
                { etykieta: "komu.celnik.opcja.nie", tresc: [] }
            ], anuluj: 1 }],
            augustynSpis: ["komu.augustyn.pyta", { wybor: [
                { etykieta: "komu.augustyn.opcja.spis", tresc: [{ zrob: "spisAugustyn" }, "komu.augustyn.spis"] },
                { etykieta: "komu.augustyn.opcja.kroniki", gdy: "kronikiWolne", tresc: [{ zrob: "spisAugustyn" }, { zrob: "kroniki" }, "komu.augustyn.spis", "komu.augustyn.kroniki"] },
                { etykieta: "komu.augustyn.opcja.nie", tresc: [] }
            ], anuluj: "ostatnia" }],
            // the farewell: the alms (and Sława) - or the town's word of the cut
            pozegnanie: [{ jesli: "stan:skrzynka=dzialka", to: ["pozegnanie.dzialka", { zrob: "koniec", args: ["dzialka"] }],
                inaczej: ["pozegnanie.dobre", { zrob: "koniec", args: ["dobre"] }] }, "pozegnanie.modl"]
        },
        akcje: {
            falsz: [{ hak: "falsz", args: [{ arg: 0 }] }],
            dowod: [{ hak: "dowod", args: [{ arg: 0 }, 1] }],
            augustyn: [{ gdy: "!krok:w15Augustyn", koniec: true }, { notatka: "notatki.augustyn" }, { krok: "w15Augustyn", nagroda: { xp: 40 } }],
            // the box opened: the stone and the list into the bag; at the market - Gaspar unmasked (the refunds, the town's word)
            skrzynka: [{ gdy: ["!krok:w15Skrzynka", "!krok:w15Dowod"], koniec: true }, { stan: { skrzynka: { arg: 0 }, skrzynkaDzien: "dzis" } }, { hak: "skrzynkaWyjmij" },
                { gdy: "ctx:args.0=rynek", zrob: [{ flaga: "gasparZdemaskowany" }, { hak: "renoma", args: [RENOMA.rynek, "w15Rynek"] }, { notatka: "notatki.rynek" },
                    { hak: "scenaRynek" }, { krok: ["w15Skrzynka", "w15Dowod"], do: "w15Komu", nagroda: { opinion: OPINIA.rynek, xp: 60 } }, { koniec: true }] },
                { flaga: "gasparPrzylapany" }, { notatka: "notatki.przyAugustynie" }, { krok: ["w15Skrzynka", "w15Dowod"], do: "w15Komu", nagroda: { xp: 50 } }],
            // the cut: 30 G, the box shut - the list and the stone sail to Baltazar (the faction has one more stone)
            dzialka: [{ gdy: "!krok:w15Skrzynka", koniec: true }, { stan: { skrzynka: "dzialka", skrzynkaDzien: "dzis", kamien: "baltazar", spis: "baltazar" } },
                { flagi: ["gasparPuszczony", "kamienBaltazar"] }, { hak: "zloto", args: [CENY.dzialka] }, { notatka: "notatki.dzialka" },
                { krok: "w15Skrzynka", do: "w15Pozegnanie", nagroda: { xp: 20 } }],
            // the stone: Kleofas (counts as a card to "Kleofas trusts you" - D23), Ambroży (he rings by himself in Act III), Baltazar
            // (80 G - Act III: one more scout), the customs officer (5 G, lawful)
            kamienKleofas: [{ gdy: ["!krok:w15Komu", { nie: MA_KAMIEN }], koniec: true }, { hak: "zabierz", args: ["kamien_gaspara", 1] }, { stan: { kamien: "kleofas" } },
                { flaga: "kamienKleofas" }, { hak: "kartaKleofasa", args: ["w15Kamien"] }, { notatka: "notatki.kamienKleofas" }, { sprawdz: true }],
            kamienAmbrozy: [{ gdy: ["!krok:w15Komu", { nie: MA_KAMIEN }], koniec: true }, { hak: "zabierz", args: ["kamien_gaspara", 1] }, { stan: { kamien: "ambrozy" } },
                { flagi: ["kamienAmbrozy", "ambrozyTrust"] }, { notatka: "notatki.kamienAmbrozy" }, { sprawdz: true }],
            kamienBaltazar: [{ gdy: ["!krok:w15Komu", { nie: MA_KAMIEN }], koniec: true }, { hak: "zabierz", args: ["kamien_gaspara", 1] }, { stan: { kamien: "baltazar" } },
                { flaga: "kamienBaltazar" }, { hak: "zloto", args: [CENY.baltazar] }, { notatka: "notatki.kamienBaltazar" }, { sprawdz: true }],
            kamienCelnik: [{ gdy: ["!krok:w15Komu", { nie: MA_KAMIEN }], koniec: true }, { hak: "zabierz", args: ["kamien_gaspara", 1] }, { stan: { kamien: "celnik" } },
                { flaga: "kamienCelnik" }, { hak: "zloto", args: [CENY.celnik] }, { notatka: "notatki.kamienCelnik" }, { sprawdz: true }],
            // the list: Kleofas (the lore of how the Black Eyes learnt of the Heart; a card to D23) or Augustyn (back to Lipnica)
            spisKleofas: [{ gdy: ["!krok:w15Komu", { nie: MA_SPIS }], koniec: true }, { hak: "zabierz", args: ["spis_lipnicy", 1] }, { stan: { spis: "kleofas" } },
                { flaga: "spisKleofas" }, { hak: "kartaKleofasa", args: ["w15Spis"] }, { notatka: "notatki.spisKleofas" }, { sprawdz: true }],
            spisAugustyn: [{ gdy: ["!krok:w15Komu", { nie: MA_SPIS }], koniec: true }, { hak: "zabierz", args: ["spis_lipnicy", 1] }, { stan: { spis: "augustyn" } },
                { flaga: "spisAugustyn" }, { notatka: "notatki.spisAugustyn" }, { sprawdz: true }],
            // W2's chronicles (taken from the archive, not sold, not given): they sail to Lipnica
            kroniki: [{ gdy: { nie: "kronikiWolne" }, koniec: true }, { hak: "zabierz", args: ["kroniki", 1] }, { stan: { kroniki: "dzis" } }, { flaga: "kronikiAugustyn" },
                { notatka: "notatki.kroniki" }],
            // the farewell (args: dobre | dzialka): the alms 25 G and Sława +3 - or the town knows of the cut (Opinia -3)
            koniec: [{ gdy: "!krok:w15Pozegnanie", koniec: true }, { stan: { koniec: { arg: 0 } } },
                { gdy: "ctx:args.0=dzialka", zrob: [{ hak: "opinia", args: [OPINIA.dzialka] }, { hak: "zakoncz", args: [{ xp: 20 }] }, { koniec: true }] },
                { hak: "slawa", args: [SLAWA] }, { hak: "zakoncz", args: [{ gold: CENY.jalmuzna, xp: 40 }] }]
        },
        // F9 ("Wyspa i fabuła" - the section "Wątek W15"): Gaspar (and from the 3rd jump Augustyn) on the island, the clues so far
        f9: { naglowek: "f9.naglowek", etykieta: "f9.etykieta", opis: "f9.opis", brak: "f9.brak", rodzaj: "isleW15" },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w15Kram", godzina: 10, idz: [MAP.miasto, 46, 49, 8] },
                2: { ch: 1, krok: "w15Falsz", godzina: 10, idz: [MAP.miasto, 46, 49, 8] },
                3: { ch: 2, krok: "w15Augustyn", godzina: 10, idz: [MAP.miasto, 15, 24, 8] },
                4: { ch: 2, krok: "w15Dowod", godzina: 21.9, idz: [MAP.pietro, 74, 50, 6] },
                5: { ch: 3, krok: "w15Skrzynka", godzina: 10, idz: [MAP.miasto, 46, 49, 8] },
                6: { ch: 4, krok: "w15Komu", godzina: 10, idz: [MAP.miasto, 46, 49, 8] },
                7: { ch: 5, krok: "w15Pozegnanie", godzina: 10, idz: [MAP.miasto, 15, 24, 8] }
            }
        }
    });

    // ------------------------------------------------------------------ Podroznicy: the matter keeps them a ferry longer (once)
    // (Podroznicy.js reads the cast's `zadania` when a stay ends: a quest going on - one ferry more, once; at the next leaving it would
    // fail it with "bez końca". Here the list is given only while that still makes sense: before the extra ferry and while the chain
    // needs that person - Gaspar until his box is opened, Augustyn until the farewell. Their leaving after that is the chain's own end)
    const PD = window.PodroznicyData;
    function sprawaW15(key) {
        try {
            const P = window.Podroznicy, Q = window.TownQuests;
            if (!P || !Q || !window.$gameSystem) return [];
            const e = P.stan().obecni[key], r = Q.rec ? Q.rec("W15") : null;
            if (!e || e.zostal || !r || r.s !== "active") return [];
            if (key === KTO.gaspar && w.S().skrzynka) return [];
            return ["W15"];
        } catch (e) { return []; }
    }
    if (PD && Array.isArray(PD.OBSADA)) {
        for (const key of [KTO.gaspar, KTO.augustyn]) {
            const c = PD.OBSADA.find(x => x.key === key);
            if (c) Object.defineProperty(c, "zadania", { get: () => sprawaW15(key), enumerable: true, configurable: true });
        }
    }

    window.SwieteKosciData = { KTO, MAP, IDS, OWNER, KURIER, CZAS, CENY, SCENA, RENOMA, OPINIA, SLAWA, ECHA, VITEMS, REMARKS, TX: w.tx, W15: w.Q.W15, watek: w };
})();
