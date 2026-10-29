//=============================================================================
// Kantor_Data.js
//=============================================================================
// The data of the arc W5 "Towary z kontynentu" (docs/QUESTY.md W5): Baltazar Vey's smuggling for the Black Eyes (Straż Pewności),
// the three knocks at the kantor's back door after midnight, the smugglers' camp on the forest edge (Map023), the night porter in
// the kantor's cellar (the new Map171 "Piwnica kantoru"), the register on Baltazar's desk, who gets it (Wit / the reeve / the double
// game / blackmail), the ferry night on Polna droga (Map022) with the ambush, and the kantor's fate in Act II. Kantor.js is the
// engine. Registered in js/plugins.js under the island packages' data (Cysterna_Data), above TownLife and TownQuests:
//   - the thread "kantor" (Watki.js, 2026-10-28): the state, the quest W5 (ten steps, chapters 1-7) with the talks and actions of its
//     steps and the F9 jumps (into window.TownQuestsPacks with its things - the register, the copy, the crate... - and the remarks);
//     the hooks they name: Kantor.js
//   - TownLifeData: Baltazar's plan gets the night shift (he is in the cellar, not behind the counter - Kantor.js's own event), his
//     move to the harbour in Act II when the town shut his kantor (alt: Map125, by the port's storehouse), the spots
//   - window.KantorData: the maps, the event ids (730-759, the core's registry: owner "Kantor"), the places, the visitors of the
//     night, the cargo, the shop's prices, the register's lines, the words

/*:
 * @target MZ
 * @plugindesc [W5] Dane wątku „Towary z kontynentu”: Baltazar Vey, tylne drzwi kantoru, piwnica (mapa 171), obóz przemytników, noc promu. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Cysterna_Data
 *
 * @help
 * ============================================================================
 * Kantor_Data.js - dane wątku W5 „Towary z kontynentu”
 * ============================================================================
 * Same dane: czyta je Kantor.js (silnik). Zadanie W5 trafia do TownQuests
 * przez window.TownQuestsPacks, plan nocy Baltazara do TownLife. Musi stać
 * nad TownLife.js i TownQuests_Data.js (pod Cysterna_Data).
 * Numery zdarzeń 730-759 (właściciel "Kantor"), nowa mapa 171 „Piwnica
 * kantoru” (pod Kantorem, Map103).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = { town: 8, kantor: 103, piwnica: 171, droga: 22, skraj: 23, przystan: 125, ratusz: 104 };
    const IDS = [730, 759];
    // the injected events, by map: Map103 the trapdoor, the stack by the back door, the town's honest counter (Act II); Map008 the
    // visitors of the night (the courier, a guest); Map171 Baltazar, Sławek, the pile, the night's things, the desk, the strongbox,
    // the crate to sit on; Map023 the camp's cart, crates, the courier; Map022 the ferry night's cart, Rafał
    const EV = {
        klapa: 730, stos: 731, lada: 732,
        kurier: 733, gosc: 734,
        baltazar: 740, slawek: 741, sterta: 742, worki: 743, kamienie: 744, mapy: 745, biurko: 746, szkatula: 747, siedzisko: 748,
        wozOboz: 750, skrzynieOboz: 751, kurierOboz: 752, ogien: 753,
        wozProm: 754, rafal: 755, skrzynieProm: 756, straz1: 757, ogienProm: 759     // (757, 758: the cart's two men in the double game)
    };
    // the art: !W5_Kantor (tools/w5/art.py) - [sheet, index, direction, pattern]
    const ART = {
        woz: ["!W5_Kantor", 0, 2, 0], wozPusty: ["!W5_Kantor", 0, 2, 1], wozWorki: ["!W5_Kantor", 0, 2, 2],
        stos1: ["!W5_Kantor", 0, 4, 0], stos2: ["!W5_Kantor", 0, 4, 1], stos3: ["!W5_Kantor", 0, 4, 2],
        kamienie: ["!W5_Kantor", 0, 6, 0], worki: ["!W5_Kantor", 0, 6, 1], mapy: ["!W5_Kantor", 0, 6, 2],
        sterta: ["!W5_Kantor", 0, 8, 0], skrzynia: ["!W5_Kantor", 0, 8, 1],
        szkatula: ["!Fantasy_chest", 6, 4, 0],
        kurier: ["$Npc_Kurier", 0, 2, 1], baltazar: ["$Npc_Kupiec", 0, 2, 1], slawek: ["$Human_Bandit", 0, 2, 1], rafal: ["$Npc_Rafal", 0, 2, 1],
        feliks: ["$Npc_Feliks", 0, 2, 1], grum: ["$Npc_Grum", 0, 2, 1]
    };

    // ------------------------------------------------------------------ the places (map coordinates; the user's maps are not changed)
    const PLACES = {
        // Map103 (the kantor - the user's map): the trapdoor tile he drew in the back room, the stack by the back door, the counter
        klapa: [5, 9], klapaLand: [5, 10, 2], stos: [6, 10], lada: [12, 6], kantorBackLand: [3, 10, 8],
        // Map171 (the cellar - tools/w5/build_piwnica.py): the stairs' landing, Baltazar's place behind the desk, the door of the office
        piwnicaLand: [2, 4, 2], schody: [2, 4], baltazar: [16, 4, 2], biurko: [15, 6], szkatula: [17, 8], sterta: [8, 9], worki: [5, 9],
        kamienie: [3, 8], slawek: [9, 7, 8], siedzisko: [3, 6], gabinetDoor: [12, 8], gabinet: [12, 4, 17, 10],   // (x0, y0, x1, y1 - with its door)
        // Map008 (the town): the back door (event 94 of the user's map), the cell before it, where the visitors come from and go
        backDoor: [14, 47], backFront: [14, 48, 8], frontDoor: [18, 46], gateIn: [52, 104], gateOut: [52, 105], east: [101, 50], tavern: [51, 18],
        // Map023 (Skraj lasu): the smugglers' fire, its seats, the cart, the courier
        ognisko: [33, 4], seats: [[32, 4, "sit"], [34, 4, "sit"], [33, 2, "sleep"], [32, 3, "sit"]], wozOboz: [35, 2], skrzynieOboz: [37, 3], kurierOboz: [35, 4, 4],
        listen: 3.4,                                                  // tiles from the fire the talk is heard from
        // Map022 (Polna droga): the cart at the fork to the east, its guards, Rafał tied to it
        wozProm: [29, 20], guards: [[28, 21, "idle"], [32, 19, "idle"]], rafal: [31, 21, 2], skrzynieProm: [27, 19], ogienProm: [32, 21]
    };

    // ------------------------------------------------------------------ the clock
    const TIME = {
        knock: 0.18,          // the courier's knock (after midnight - Ambroży rings three and one)
        spawn: 23.9,          // the courier comes in through the south gate
        inside: 0.25,         // ...is let in, and out again at knock + inside
        leaveBy: 1.2,         // he is gone off the map by then
        camp: [21, 4.5],      // the camp burns (Map023)
        shift: [21.9, 23.5],  // a porter's shift: he comes in through the back door then (later: no work tonight)
        shiftEnd: 2.5,        // Baltazar's men leave the cellar
        out: 0.5, away: 20 / 60,   // night 3: Baltazar goes up at half past midnight, for twenty minutes
        copy: 0.25,           // copying the register takes a quarter of an hour
        ferry: [21, 3],       // the ferry night's cart on Polna droga
        meeting: [12, 16],    // the town meeting in the town hall, the day after the reeve got the register
        work: [8, 18]         // Baltazar's day trade
    };
    const PAY = { shift: 20, double: 30, blackmail: 50, letGo: 30 };
    const CRATES = 3;         // crates a night
    const SHIFTS = 2;         // the porter's nights before the register's night (chapter 3)
    const STONES = { swap: 6, gain: 5 };   // plain stones (item 64) to swap the cargo; raven stones found in it
    const RAID = { after: [3, 6], kinds: ["bandit", "knifer", "archer"], maps: [3, 21, 22, 23], hours: [21, 4] };
    // the shop of chapter 7: base prices (the honest kantor 10% lower; Baltazar in the hero's grip - half; Baltazar the enemy - double)
    const GOODS = [{ id: 86, n: 1, price: 18 }, { id: 143, n: 1, price: 50 }, { id: 88, n: 10, price: 2 }, { id: 93, n: 1, price: 6 }];
    const PRICE = { honest: 0.9, grip: 0.5, enemy: 2, normal: 1 };

    // ------------------------------------------------------------------ the words (js/teksty/kantor.txt; Kantor.js reads them as D.TX)
    const TX = {};
    Watki.scal(TX, "kantor", "");   // (its words: js/teksty/kantor.txt)

    // ------------------------------------------------------------------ the register's lines (Kantor.js reads the flags)
    const REGISTER = [
        {},
        { unless: "feliksGone" },
        {},
        { unless: "klosWydany" },
        {},
        {},
        { flag: "wrakKamienieBaltazar" },
        { flag: "w5ChroniclesSold" },
        { flag: "krukBaltazarWie" },
        { flag: "rafalSmuggled" },
        { flag: "wrakMapaSprzedana" },
        { flag: "soczewkaSprzedana" },
        { flag: "k15Opened" },
        { flag: "d6Bribe" },
        {}
    ];
    Watki.scal(REGISTER, "kantor", "rejestr");   // (its words: js/teksty/kantor.txt, rejestr)

    // ------------------------------------------------------------------ the thing carried, the remarks (they go with the quest's pack)
    const VITEMS = {
        rejestr: { icon: 189 },
        odpis_rejestru: { icon: 191 },
        skrzynia_w5: { icon: 0 },
        list_przewozowy: { icon: 191 }
    };
    Watki.scal(VITEMS, "kantor", "rzeczy");   // (its words: js/teksty/kantor.txt, rzeczy)
    // the raven stones of the cargo: the same thing as the wreck's (Wrak_Data's v:kamien_kruk) - ours only when no pack has it yet
    // (its name: a getter of the words - kod.kamienZKrukiem; TownQuests_Data keeps this very object)
    if (!(window.TownQuestsPacks || []).some(p => p && p.vitems && p.vitems.kamien_kruk)) VITEMS.kamien_kruk = Watki.zTekstu({ icon: 319 }, { name: "kod.kamienZKrukiem" }, "kantor");
    const REMARKS = [
        { id: "w5Roch", who: "przemytnik", flag: "w5Kamienie" },
        { id: "w5WitAlly", who: "kapral", flag: "w5WitAlly" },
        { id: "w5Hanka", who: "piekarka", flag: "w5Zamkniety" },
        { id: "w5Ludmila", who: "ludmila", flag: "w5KantorLudmila" },
        { id: "w5Klos", who: "kwatermistrz", flag: "w5Zamkniety" },
        { id: "w5Ambrozy", who: "dzwonnik", flag: "w5Stuk" }
    ];
    Watki.scal(REMARKS, "kantor", "uwagi");   // (its words: js/teksty/kantor.txt, uwagi)

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md, 2026-10-28)
    // the state "kantor", the quest W5 (ten steps, chapters 1-7 - its words: zadania.W5; the engine puts it into window.TownQuestsPacks
    // with the things and the remarks), the talks of its steps (the hire, who gets the register, the town meeting, the kantor in Act
    // II), their actions, the hero's thoughts, the F9 jumps (Kantor.debugJump - Debug.js's row "isleW5"). The nights themselves (the
    // visitors, the camp, the cellar, the ferry night) and the hooks: Kantor.js
    const MA_REJESTR = { lub: ["v:rejestr", "v:odpis_rejestru"] };   // (the register or its copy in the bag)
    const w = Watki.watek({
        id: "kantor", wtyczka: "Kantor", teksty: "kantor",
        // (the fields once written on the fly - noted0-2, backRaidDone, camp.fled, shift.over, reg.lastCaught / alarm, ferry.stateDay /
        // cleared - are in the defaults now; the version stays: an old save simply has them unset, as before)
        stan: { klucz: "kantor", wersja: 1, domyslne: () => ({
            clues: {},                                                     // own clues: klos, goscie, dzwon
            knock: { seen: 0, night: -1, spooked: -1 }, guests: {},        // ch. 2: the knock seen (day), the guests witnessed
            camp: { heard: 0, fought: 0, beaten: -1, night: -1, fled: -1 },  // ch. 2: the camp
            hired: 0, mood: "", shifts: 0, noted0: 0, noted1: 0, noted2: 0, // ch. 3 (noted N: the night N's note written)
            shift: { night: -1, n: 0, carrying: false, paid: false, seen: 0, over: false },   // tonight's shift: crates placed, carrying one, paid
            reg: { night: -1, state: "", back: 0, caught: 0, done: 0, took: "", card: 0, lastCaught: -1, alarm: 0 },   // ch. 4
            outcome: "", komu: "", zebranie: 0,                             // ch. 5: closed | double | enemy ; wit | witBurn | soltys | double | blackmail
            ferry: { day: 0, state: "", ambush: 0, rafal: "", stateDay: 0, cleared: 0 },   // ch. 6
            honest: "", weekPaid: 0, raid: { day: 0, done: 0 }, back: 0, backRaid: 0, backRaidDone: 0
        }) },
        // ("@key: ..." - that resident says it: Kantor.js finds him; a line is one paragraph - "\n" no new line, as the old wrap)
        mowa: { kto: key => w.hak("mowca", null, key) },
        // the hero's thoughts and the cellar's people's words outside a talk: one by one, 210 frames each, 220 apart, not waiting for a talk
        mysli: { klatki: 210, odstep: 220, czekaj: false },
        zadania: {
            // W5 "Towary z kontynentu": from day 10 with the first clue; the rewards of the steps and the end as before
            W5: { kind: "W", giver: null, icon: 0, autoStart: "w5Auto", start: [{ hak: "odDnia", args: [10] }, { hak: "poszlaki", args: [1] }],
                kroki: [
                    // 1 "Dziwny kupiec": two clues
                    { nazwa: "w5Poszlaki", ch: 1, gotowe: { hak: "poszlaki", args: [2] }, zmienne: "w5Zmienne" },
                    // 2 "Trzy stuknięcia": the knock seen; the camp heard or fought (Kantor.js)
                    { nazwa: "w5Stuk", ch: 2, gotowe: "stan:knock.seen>0", reward: { xp: 40 } },
                    { nazwa: "w5Oboz", ch: 2, gotowe: { lub: ["stan:camp.heard>0", "stan:camp.fought>0"] }, reward: { xp: 80 } },
                    // 3 "Nocny tragarz": Baltazar hires him (8-18), two night shifts
                    { nazwa: "w5Najem", ch: 3, rozmowy: [{ kto: "kupiec", gdy: { godziny: TIME.work }, tresc: [{ rozmowa: "najem" }] }] },
                    { nazwa: "w5Zmiany", ch: 3, gotowe: "stan:shifts>=" + SHIFTS, zmienne: "w5Zmienne" },
                    // 4 "Rejestr": taken or copied, Baltazar back and paid (Kantor.js)
                    { nazwa: "w5Rejestr", ch: 4, gotowe: ["stan:reg.done>0", MA_REJESTR], reward: { xp: 120 } },
                    // 5 "Komu to dać": Wit, the reeve (8-18), Baltazar (8-18); the town meeting the next day 12-16
                    { nazwa: "w5Komu", ch: 5, zmienne: "w5Zmienne", rozmowy: [
                        { kto: "kapral", gdy: MA_REJESTR, tresc: [{ rozmowa: "komuWit" }] },
                        { kto: "soltys", gdy: [MA_REJESTR, { godziny: [8, 18] }], tresc: [{ rozmowa: "komuSoltys" }] },
                        { kto: "kupiec", gdy: [MA_REJESTR, { godziny: TIME.work }], tresc: [{ rozmowa: "komuBaltazar" }] }
                    ] },
                    { nazwa: "w5Zebranie", ch: 5, zmienne: "w5Zmienne", rozmowy: [
                        { kto: "soltys", gdy: "zebranieTrwa", tresc: ["zebranie.say", { zrob: "zebranie" }] },
                        { kto: "soltys", gotowa: false, tresc: ["zebranie.notYet"] }
                    ] },
                    // 6 "Noc promu" (Kantor.js)
                    { nazwa: "w5Prom", ch: 6, gotowe: "stan:ferry.state", zmienne: "w5Zmienne" },
                    // 7 "Co dalej z Kantorem" (Act II, 8-18): the reeve (the kantor shut) or Baltazar (the double game, the enemy)
                    { nazwa: "w5Akt2", ch: 7, zmienne: "w5Zmienne", rozmowy: [
                        { kto: "soltys", gdy: ["aktDrugi", "stan:outcome=closed", { godziny: TIME.work }], tresc: [{ rozmowa: "akt2Soltys" }] },
                        { kto: "kupiec", gdy: ["aktDrugi", "!stan:outcome=closed", { godziny: TIME.work }], tresc: [{ rozmowa: "akt2Kupiec" }] }
                    ] }
                ],
                reward: { xp: 300 } }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        rozmowy: {
            // ch. 3: Baltazar hires him - a friend (he keeps his mouth shut / took his money), a fighter (the camp), or "the curious ones close by"
            najem: [{ jesli: "zaufanie", to: ["najemTrust"], inaczej: [{ jesli: "stan:camp.fought", to: ["najemFight"], inaczej: ["najemCold"] }] },
                { wybor: [
                    { etykieta: "najemYes", tresc: ["najemOk", { zrob: "najem", args: [{ hak: "nastroj" }] }] },
                    { etykieta: "najemNo", tresc: ["najemLater"] }
                ], anuluj: 1 }],
            // ch. 5: Wit (his trust - he confesses; else the register burnt), the reeve, Baltazar himself
            komuWit: ["komuWit.ask", { jesli: "witUfa", to: ["komuWit.trust", { zrob: "komuWit" }], inaczej: ["komuWit.burn", { zrob: "komuWitSpalil" }] }],
            komuSoltys: ["komuSoltys.ask", "komuSoltys.say", { zrob: "komuSoltys" }],
            komuBaltazar: ["komuBaltazar.ask", "komuBaltazar.say", { wybor: [
                { etykieta: "komuBaltazar.double", tresc: ["komuBaltazar.doubleSay", { zrob: "komuWspolnik" }] },
                { etykieta: "komuBaltazar.blackmail", tresc: ["komuBaltazar.blackmailSay", { zrob: "komuSzantaz" }] },
                { etykieta: "komuBaltazar.later", tresc: ["komuBaltazar.laterSay"] }
            ], anuluj: 2 }],
            // ch. 7: who runs the shut kantor (no cancelling); Baltazar's word to his partner / his enemy
            akt2Soltys: ["akt2Soltys", { wybor: [
                { etykieta: "akt2Ludmila", tresc: ["akt2LudmilaSay", { zrob: "akt2", args: ["ludmila"] }] },
                { etykieta: "akt2Ratusz", tresc: ["akt2RatuszSay", { zrob: "akt2", args: ["ratusz"] }] }
            ], anuluj: -1 }],
            akt2Kupiec: [{ jesli: "stan:outcome=double", to: ["akt2Grip"], inaczej: ["akt2Enemy"] }, { zrob: "akt2", args: [{ stan: "outcome" }] }]
        },
        // (Kantor.act's old names - hire, komu, zebranie, akt2: a talk saved before 2026-10-28 - Kantor.js sends them here)
        akcje: {
            najem: [{ gdy: "!krok:w5Najem", koniec: true }, { stan: { hired: "dzis", mood: { arg: 0 } } }, { gdy: "!ctx:args.0=trust", zrob: [{ flaga: "w5NajetyZimno" }] },
                { notatka: "noteNajem" }, { krok: "w5Najem" }],
            // ch. 5: the register to Wit (the kantor shut, Wit with the hero), burnt by Wit (a night in the guardhouse, Baltazar the enemy),
            // to the reeve (the meeting tomorrow), the double game with Baltazar (he takes the original back), the blackmail
            komuWit: [{ gdy: "!krok:w5Komu", koniec: true }, { stan: { komu: "wit" } }, { hak: "oddajRejestr" }, { stan: { outcome: "closed" } },
                { flagi: ["w5WitAlly", "witAlly", "w5Zamkniety", "w5BaltazarWrog"] }, { notatka: "noteWit" }, { hak: "zamknijKantor" },
                { krok: "w5Komu", do: "w5Prom", nagroda: { opinion: 8, xp: 150 } }],
            komuWitSpalil: [{ gdy: "!krok:w5Komu", koniec: true }, { stan: { komu: "witBurn" } }, { hak: "oddajRejestr" }, { stan: { outcome: "enemy" } },
                { flagi: ["w5WitSpalil", "w5BaltazarWrog"] }, { notatka: "noteWitBurn" }, { hak: "napad" }, { hak: "nocWWartowni" },
                { napis: "kod.wartownia", pod: "kod.wartowniaSub", gora: true, kolor: "#ff9f8f" }, { krok: "w5Komu", do: "w5Prom", nagroda: { opinion: -1, xp: 30 } }],
            komuSoltys: [{ gdy: "!krok:w5Komu", koniec: true }, { stan: { komu: "soltys" } }, { hak: "oddajRejestr" }, { stan: { zebranie: { hak: "jutro" } } },
                { notatka: "noteSoltys" }, { krok: "w5Komu", nagroda: { xp: 50 } }],
            komuWspolnik: [{ gdy: "!krok:w5Komu", koniec: true }, { stan: { komu: "double" } }, { gdy: "v:rejestr", zrob: [{ hak: "zabierz", args: ["rejestr", 9] }] },
                { stan: { outcome: "double", weekPaid: "dzis" } }, { flagi: ["w5Podwojna", "w5FactionWatches"] }, { notatka: "noteDouble" },
                { krok: "w5Komu", do: "w5Prom", nagroda: { xp: 100 } }],
            komuSzantaz: [{ gdy: "!krok:w5Komu", koniec: true }, { stan: { komu: "blackmail", outcome: "enemy" } }, { flagi: ["w5Szantaz", "w5BaltazarWrog"] },
                { notatka: "noteBlackmail" }, { hak: "napad" }, { krok: "w5Komu", do: "w5Prom", nagroda: { gold: PAY.blackmail, xp: 50, opinion: -2 } }],
            // the town meeting: the kantor shut, Baltazar off the island; the loose card of the chronicles from his strongbox (D23)
            zebranie: [{ gdy: "!krok:w5Zebranie", koniec: true }, { stan: { outcome: "closed" } }, { flagi: ["w5Zamkniety", "w5Soltys", "w5BaltazarWrog"] },
                { notatka: "noteZebranie" }, { gdy: "kartaWSzkatule", zrob: [{ stan: { "reg.card": "dzis" } }, { hak: "dajKarte", args: ["kod.kartaSoltys"] }] },
                { hak: "zamknijKantor" }, { krok: "w5Zebranie", nagroda: { opinion: 12, xp: 150 } }],
            // ch. 7 (args: ludmila | ratusz - the honest kantor; double - cheap; else - dear): W5 done
            akt2: [{ gdy: "!krok:w5Akt2", koniec: true },
                { gdy: { lub: ["ctx:args.0=ludmila", "ctx:args.0=ratusz"] }, zrob: [{ stan: { honest: { arg: 0 } } },
                    { gdy: "ctx:args.0=ludmila", zrob: [{ flaga: "w5KantorLudmila" }] }, { gdy: "ctx:args.0=ratusz", zrob: [{ flaga: "w5KantorRatusz" }] },
                    { flaga: "w5KantorUczciwy" }, { notatka: "noteHonest" }, { hak: "zakoncz" }, { koniec: true }] },
                { gdy: "ctx:args.0=double", zrob: [{ flaga: "w5KantorTani" }, { notatka: "noteGrip" }, { hak: "zakoncz" }, { koniec: true }] },
                { flaga: "w5KantorDrogi" }, { notatka: "noteEnemy" }, { hak: "zakoncz" }]
        },
        // F9 ("Wyspa i fabuła": the engine's section "Wątek W5", its row "isleW5" - ←→ the chapter, OK jumps; the words js/teksty/kantor.txt
        // f9Naglowek, f9Etykieta, f9desc, f9Brak, f9Nazwy.N; Kantor.debugJump is the same jump): the chapters' flags so far (each jump:
        // all of the earlier chapters'), the step, the hour, the place
        f9: { rodzaj: "isleW5", ikona: 189, kolejnosc: 5, naglowek: "f9Naglowek", etykieta: "f9Etykieta", opis: "f9desc", brak: "f9Brak", nazwy: "f9Nazwy" },
        skoki: {
            przed: [
                { hak: "dzienDziesiaty" },
                { gdy: "ctx:skok>=2", zrob: [{ stan: { "clues.debug": "dzis" } }, { flaga: "k15Clean" }] },
                { gdy: ["ctx:skok>=3", "!stan:knock.seen"], zrob: [{ stan: { "knock.seen": "dzis" } }] },
                { gdy: ["ctx:skok>=3", "!stan:camp.heard"], zrob: [{ stan: { "camp.heard": "dzis" } }] },
                { gdy: ["ctx:skok>=4", "!stan:hired"], zrob: [{ stan: { hired: "dzis" } }] },
                { gdy: ["ctx:skok>=4", "!stan:mood"], zrob: [{ stan: { mood: "trust" } }] },
                { gdy: ["ctx:skok>=4", "stan:shifts<" + SHIFTS], zrob: [{ stan: { shifts: SHIFTS } }] },
                { gdy: ["ctx:skok>=5", "!stan:reg.done"], zrob: [{ stan: { "reg.done": "dzis" } }] },
                { gdy: ["ctx:skok>=5", { nie: MA_REJESTR }], zrob: [{ v: ["odpis_rejestru", 1] }] },
                { gdy: ["ctx:skok>=6", "!stan:outcome"], zrob: [{ stan: { outcome: "closed" } }, { flagi: ["w5Zamkniety", "w5BaltazarWrog"] }, { hak: "zamknijKantor" }, { hak: "oddajRejestr" }] },
                { gdy: "ctx:skok=6", zrob: [{ stan: { ferry: { hak: "nowyProm" } } }] },
                { gdy: ["ctx:skok>=7", "!stan:ferry.state"], zrob: [{ stan: { "ferry.state": "seized" } }] }
            ],
            lista: {
                1: { ch: 1, krok: "w5Poszlaki", godzina: 10, idz: [MAP.town, 16, 49, 8] },
                2: { ch: 2, krok: "w5Stuk", godzina: 23.85, idz: [MAP.town, 10, 49, 2] },
                3: { ch: 3, krok: "w5Najem", godzina: 10, idz: [MAP.town, 16, 49, 8] },
                4: { ch: 4, krok: "w5Rejestr", godzina: 22.05, idz: [MAP.town, 14, 49, 8], zrob: [{ hak: "nowaNoc" }] },   // (tonight's shift and the register's night afresh)
                5: { ch: 5, krok: "w5Komu", godzina: 10, idz: [MAP.town, 16, 49, 8] },
                6: { ch: 6, krok: "w5Prom", godzina: 21.5, idz: [MAP.droga, 12, 2, 2] },
                7: { ch: 7, krok: "w5Akt2", godzina: 10, idz: [MAP.town, 16, 49, 8] }
            }
        }
    });

    // ------------------------------------------------------------------ TownLife: Baltazar's night shift and his move to the harbour
    // (his plan: inside the kantor at night - at the counter of Map103; on a porter's night he is in the cellar instead, Kantor.js's
    // own event: "inside" at the place w5_piwnica, which no interior shows - `away`). In Act II, when the town shut his kantor, he
    // lives at the harbour (Map125) by the port's storehouse with a mercenary's guard (alt, condition "w5Harbour").
    const TLD = window.TownLifeData;
    const SPOTS_TOWN = { w5_piwnica: [14, 48, 8], w5_lada: [18, 47, 8] };       // (w5_lada: the kantor's front door - Ludmiła goes in)
    const SPOTS_HARBOUR = { w5_sklad: [26, 14, 8], w5_przystan: [27, 15, 2] };
    const SPOTS_KANTOR = { ludmila_lada: [12, 5, 2] };                            // Map103: behind the counter (the merchant's chair)
    const SPOTS_PODGRODZIE = { w5_lada: [89, 17, 6] };                           // Map111: the west gate's way into the town
    // (Baltazar's words at the harbour in Act II - the alt plan below)
    const KUPIEC_PRZYSTAN = { barks: { night: [] }, talk: { night: [] } };
    Watki.scal(KUPIEC_PRZYSTAN, "kantor", "kupiec");   // (its words: js/teksty/kantor.txt, kupiec)
    if (TLD) {
        if (TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_TOWN)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        TLD.SPOTS_BY_MAP[MAP.przystan] = Object.assign({}, TLD.SPOTS_BY_MAP[MAP.przystan] || {}, SPOTS_HARBOUR);
        TLD.SPOTS_BY_MAP[MAP.kantor] = Object.assign({}, TLD.SPOTS_BY_MAP[MAP.kantor] || {}, SPOTS_KANTOR);
        TLD.SPOTS_BY_MAP[111] = Object.assign({}, TLD.SPOTS_BY_MAP[111] || {}, SPOTS_PODGRODZIE);
        const kupiec = (TLD.RESIDENTS || []).find(r => r.key === "kupiec");
        // (2026-10-17, the user: Ludmiła behind the counter of the honest kantor by day) when the town gave the shut kantor to Ludmiła's
        // camp (Act II, condition "w5Lada" - Kantor.js), she stands at the counter 9-15 instead of the market (TownLife v1.5.0 "indoor": the
        // place w5_lada is the spot ludmila_lada of Map103); mornings and evenings at the camp as before (W6, D4, D10, K27, the Wigilia)
        const ludmila = (TLD.RESIDENTS || []).find(r => r.key === "ludmila");
        if (ludmila && !ludmila._w5) {
            ludmila._w5 = true;
            ludmila.plan.push([9.01, "inside", "w5_lada", "w5Lada"], [11.01, "inside", "w5_lada", "w5Lada"]);
            ludmila.plan.sort((a, b) => a[0] - b[0]);
            if (ludmila.alt && ludmila.alt.plan) {   // (the camp outside the wall: she comes in through the west gate in the morning)
                ludmila.alt.plan.push([9.01, "inside", "w5_lada", "w5Lada"], [12.01, "inside", "w5_lada", "w5Lada"]);
                ludmila.alt.plan.sort((a, b) => a[0] - b[0]);
            }
            ludmila.indoor = Object.assign({}, ludmila.indoor || {}, { w5_lada: "ludmila_lada" });
        }
        if (kupiec && !kupiec._w5) {
            kupiec._w5 = true;
            kupiec.plan.push([0.02, "inside", "w5_piwnica", "w5Shift"], [21.9, "inside", "w5_piwnica", "w5Shift"], [23.02, "inside", "w5_piwnica", "w5Shift"]);
            kupiec.plan.sort((a, b) => a[0] - b[0]);
            kupiec.away = (kupiec.away || []).concat(["w5_piwnica", "w5_sklad"]);
            kupiec.alt = { map: MAP.przystan, when: "w5Harbour",
                plan: [[0, "inside", "w5_sklad"], [8, "stand", "w5_przystan"], [18, "inside", "w5_sklad"]],
                barks: KUPIEC_PRZYSTAN.barks, talk: KUPIEC_PRZYSTAN.talk };
        }
    }

    window.KantorData = {
        MAP, IDS, OWNER: "Kantor", EV, ART, PLACES, TIME, PAY, CRATES, SHIFTS, STONES, RAID, GOODS, PRICE, TX, REGISTER, W5: w.Q.W5, VITEMS, REMARKS,
        SPOTS_TOWN, SPOTS_HARBOUR, SPOTS_KANTOR, LADA_HOURS: [9, 15], STONE_ITEM: 64
    };
})();
