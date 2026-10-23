//=============================================================================
// Lowy_Data.js
//=============================================================================
// PACZKA B „Zwierzęta i łowy” (docs/rozszerzenia/PLAN.md, punkt 5) - the data of: wilcza nora, gawra, błotnisko dzików, lizawka, stałe
// obozy rabusiów i myśliwych Czarnych Oczu, zwierzyniec Lorda z gajowym, zbłąkane zwierzęta, strzelnica.
// Here (loaded under QuestBoard_Data and above TownLife / TownQuests_Data): the places (registered by the engine with
// Okolice.registerSpots("B", ...)), the discoveries, the gamekeeper (window.TownLifeExtra, id 2905, Map024), the quests K59-K62 and
// D32-D33 (window.TownQuestsPacks), the board's contracts with the prefix "low_" and its two new beasts (QuestBoard.TEMPLATES / BEASTS),
// the gamekeeper's bust (SpeechBubbles.BUSTS), every number and every text. The engine is Lowy.js (below every system).
// The user's decisions (2026-10-21): the cubs left alone - the den's pack turns friendly, nothing is taken away; poaching in the Lord's
// park - a fine, the third time the hedge's gap is shut for 7 days; never the gallows, never the game's end.

/*:
 * @target MZ
 * @plugindesc [paczka B] Dane: Zwierzęta i łowy - wilcza nora, gawra, błotnisko dzików, lizawka, stałe obozy, zwierzyniec Lorda z gajowym, zbłąkane zwierzęta, strzelnica. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Okolice_Data
 *
 * @help
 * ============================================================================
 * Lowy_Data.js - dane paczki B „Zwierzęta i łowy”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md (punkt 5). Silnik: Lowy.js.
 * Opis dla integracji: docs/rozszerzenia/B.md.
 *
 * Numery zdarzeń: 2300-2499 (Map023 2300-2319, Map013 2320-2339,
 *   Map021 2340-2359, Map004 2360-2379, Map024 2380-2399, Map162 2440-2459).
 * Mieszkaniec TownLife: 2905 gajowy Gniewko Bór (Map024).
 * Przedmioty: 200 Bryła soli, 201 Poroże jelenia, 202 Kieł odyńca,
 *   203 Pazur niedźwiedzia, 204 Zezwolenie na odstrzał, 205 Strzała
 *   z białym okiem, 206 Srebrna strzała. Ikony: 480-486.
 * Przełącznik 23 (Low_Wylom): wyłom w żywopłocie zarośnięty cierniem.
 * Zadania: K59 Nora pod korzeniami, K60 Sól dla jeleni, K61 Zawody
 *   strzeleckie, K62 Krasula i kury Ługów, D32 Gajowy i kłusownik,
 *   D33 Gawra pod granią. Zlecenia z tablicy: low_oboz_021, low_czo_023,
 *   low_poroze. Test: tests/lowy_test.js (port 9552).
 * ============================================================================
 */

(() => {
    "use strict";

    const VERSION = "1.1.0";
    const O = window.OkoliceData, P = O ? O.PACKAGES.B : null;

    // ------------------------------------------------------------------ the numbers of the package (PLAN.md 3.2)
    const ITEM = { sol: 200, poroze: 201, kiel: 202, pazur: 203, zezwolenie: 204, strzalaOko: 205, srebrnaStrzala: 206,
        // the game's own (read only)
        lina: 93, luk: 126, strzaly: 127, mieso: 94, miesoJelen: 157, miesoDzik: 159, miesoWilk: 161, miesoNiedzwiedz: 168, skora: 96,
        skoraNiedzwiedzia: 170, mleko: 123, noz: [90, 91] };
    const MEATS = [94, 157, 159, 161, 168];          // raw meats a pack eats at the den (Farming.RAW_MEATS)
    const ICON = { sol: 480, poroze: 481, kiel: 482, pazur: 483, zezwolenie: 484, strzalaOko: 485, srebrnaStrzala: 486,
        // the game's own icons for the places without their own (popups, F9)
        wilk: 352, gold: 313, luk: 126, lina: 349 };
    const SW_WYLOM = 23;

    // event ids (Tawerna.inject, owner "Lowy", 2300-2499; a range of 20 per map)
    const IDS = {
        nora: 2300, czoNamiot: 2301,
        gawra: 2320, gawraBok: 2321,
        bloto: 2340, rabNamiot: 2341,
        lizawka: 2360, zasiadka: 2361, poroze: 2362,
        wylomL: 2380, wylomP: 2381, lesniczowka: 2382, pasnik: 2383, sidla: [2384, 2385, 2386], rysiek: 2387,
        tarcze: [2440, 2441, 2442], stojak: 2443, zolnierze: [2444, 2445], tarczeBlok: [2446, 2447, 2448]
    };
    const RESIDENT = 2905;

    // ------------------------------------------------------------------ B1 the wolves' den (Map023), Szary Kieł's place
    const NORA = {
        map: 23, x: 65, y: 50, cells: { x: 64, y: 49, w: 3, h: 2 }, zone: 6, rest: [65, 52], restNear: 2.5,
        bounty: [66, 51], gift: [66, 52], dayHours: [5, 20], adults: 2, pups: [2, 3], pupScale: 0.55,
        meatR: 3, meatDays: 3, emptyDays: 28, giftEvery: 7, friendMaps: [21, 23], discoverNear: 8
    };
    // the wolf cub: the wolf's sheet made small (QuestBoard's _qbScale), a grazer (no `aggressive`, no `pack`: it runs from the hero)
    // and no YIELD entry: nothing to dress
    const PUP = { name: "Wilczę", sheet: "$Animal_Wolf", hp: 14, poise: 8, stun: 40, speed: 3, flee: 4.6, sight: 6, radius: 0.35, hours: [[0, 24]], markY: -30 };

    // ------------------------------------------------------------------ B2 the bear's den (Map013)
    const GAWRA = {
        map: 13, home: [99, 47], ev: [100, 46], side: [99, 46], mouth: { x: 99, y: 45, w: 2, h: 2 }, front: { x: 99, y: 47, w: 2, h: 1 },
        seasons: [0, 1, 2], hours: [4, 22], snoreR: 6, rageSec: 60, rageMul: 1.2, calmR: 12, oneR: 22
    };

    // ------------------------------------------------------------------ B3 the boars' wallow (Map021), Czarny Ryj's place
    const BLOTO = { map: 21, x: 65, y: 46, w: 4, h: 3, ev: [67, 48], bounty: [66, 47], hours: [[5, 9], [17, 21]], boars: [2, 3],
        tusk: 0.2, muddyHours: 2, sneak: 0.3, from: 9 };

    // ------------------------------------------------------------------ B4 the salt lick (Map004)
    const LIZAWKA = { map: 4, x: 73, y: 51, hide: [70, 53], antler: [74, 52], days: 6, hours: [[5, 8], [18, 21]], r: 9, deer: [1, 3],
        lick: [1200, 2400], antlerChance: 0.2, hideSneak: 0.5, hideAim: 0.8, price: 12 };

    // ------------------------------------------------------------------ B5 the fixed camps (Humans.fixedCamp)
    const OBOZY = {
        rabusie: { map: 21, x: 60, y: 41, area: { x: 58, y: 39, w: 6, h: 5 }, tent: [62, 39], tag: "camp", every: 4, mielerz: [50, 21],
            size: [2, 4], knife: 0.35 },
        czo: { map: 23, x: 66, y: 21, area: { x: 64, y: 18, w: 6, h: 5 }, tent: [68, 19], tag: "lowCzo", hours: [6, 20],
            kinds: ["archer", "bandit"], looks: ["Archer", "Archer"], name: "Myśliwy Czarnych Oczu", sack: [[205, 1], [127, 6], [96, 2]] }
    };

    // ------------------------------------------------------------------ B6 the Lord's game park (Map024)
    const ZWIERZYNIEC = {
        map: 24, gap: [[7, 29], [8, 29]], inside: [7, 31],
        // the park: the whole new part of the map (x 0-78 below the hedge's row 29, x 40-78 above it)
        areas: [{ x0: 0, y0: 30, x1: 78, y1: 57 }, { x0: 40, y0: 0, x1: 78, y1: 29 }],
        hut: [61, 4], hutCells: { x: 59, y: 2, w: 5, h: 3 }, door: [61, 5], feeder: [60, 22], feederCells: { x: 59, y: 22, w: 2, h: 1 },
        snares: [[20, 46], [45, 38], [66, 12]], patrol: [[13, 40], [30, 50], [53, 45], [71, 20], [61, 5]],
        deer: [4, 6], boars: 2, sight: 7, findR: 2.5, findHours: 2, fines: [40, 60, 80], opinion: -3, closeDays: 7, permitDays: 7,
        rysiek: [46, 38], ambushHours: [22, 3]
    };

    // ------------------------------------------------------------------ B7 the strays of the Ług farm (Map168)
    const ZBLAKANE = {
        map: 168, area: { x0: 72, y0: 18, x1: 95, y1: 35 }, start: { x: 84, y: 28, w: 3, h: 3 },
        list: [
            { key: "krasula", kind: "cow", sheet: "$Animal_Cow", speed: 2.4, rope: true },
            { key: "owca", kind: "sheep", sheet: "$Animal_Sheep", speed: 3, rope: true },
            { key: "kura1", kind: "hen", sheet: "$Animal_Hen", speed: 3.4, rope: false },
            { key: "kura2", kind: "hen", sheet: "$Animal_Hen", speed: 3.4, rope: false }
        ],
        farm: { x: 22, y: 12, r: 4, stage: 3 }, catchHen: 0.5, henRun: 3, milkEvery: 7, milk: 2
    };
    Watki.scal(ZBLAKANE, "lowy", "zblakane");   // (its words: js/teksty/lowy.txt, zblakane)

    // ------------------------------------------------------------------ B8 the soldiers' range (Map162)
    const STRZELNICA = {
        map: 162, area: { x: 73, y: 50, w: 12, h: 5 }, line: [73, 74], stand: [74, 53], rack: [73, 50],
        targets: [{ x: 79, y: 51, d: 6 }, { x: 81, y: 53, d: 8 }, { x: 82, y: 51, d: 9 }], radius: 0.5, faceY: -0.05,
        shots: 5, ring: { center: 6, mid: 14 }, score: { center: 10, mid: 5, edge: 2 }, practice: 5,
        rivals: [{ name: "Szeregowy Wróbel", score: 24 }, { name: "Kapral Sowa", score: 30 }, { name: "Sierżant Bełt", score: 36 }],
        prizes: [25, 40, 60], favor: [3, 5, 8], contestDay: d => d % 7 === 3, contestHours: [10, 12], drill: [9, 12],
        soldiers: [[75, 50], [75, 54]]
    };

    // ------------------------------------------------------------------ the places (Okolice.registerSpots("B", ...); the collision test)
    const SPOTS = [
        { key: "nora_wilcza", map: 23, kind: "den", name: "Wilcza nora", mode: "reach", x: 64, y: 49, w: 3, h: 2 },
        { key: "szary_kiel", map: 23, kind: "bounty", name: "Szary Kieł", mode: "reach", cells: [[66, 51]] },
        { key: "oboz_czo", map: 23, kind: "camp", name: "Obóz myśliwych Czarnych Oczu", mode: "reach", x: 64, y: 18, w: 6, h: 5 },
        { key: "oboz_bandytow", map: 21, kind: "camp", name: "Obóz rabusiów", mode: "reach", x: 58, y: 39, w: 6, h: 5 },
        { key: "blotnisko", map: 21, kind: "wallow", name: "Błotnisko dzików", mode: "reach", x: 65, y: 46, w: 4, h: 3 },
        { key: "gawra_wejscie", map: 13, kind: "den", name: "Gawra", mode: "wall", x: 99, y: 45, w: 2, h: 2 },
        { key: "gawra_pole", map: 13, kind: "den", name: "Przed gawrą", mode: "reach", x: 99, y: 47, w: 2, h: 1 },
        { key: "lizawka", map: 4, kind: "lick", name: "Lizawka", mode: "reach", x: 73, y: 51, w: 1, h: 1 },
        { key: "zasiadka", map: 4, kind: "hide", name: "Zasiadka", mode: "reach", x: 70, y: 53, w: 1, h: 1 },
        { key: "poroze_zrzut", map: 4, kind: "antler", name: "Zrzucone poroże", mode: "reach", x: 74, y: 52, w: 1, h: 1 },
        { key: "wylom_zywoplot", map: 24, kind: "gap", name: "Wyłom w żywopłocie", mode: "reach", x: 7, y: 29, w: 2, h: 1, allowOld: true },
        { key: "lesniczowka", map: 24, kind: "hut", name: "Leśniczówka", mode: "reach", x: 59, y: 2, w: 5, h: 3 },
        { key: "pasnik", map: 24, kind: "feeder", name: "Paśnik", mode: "reach", x: 59, y: 22, w: 2, h: 1 },
        { key: "sidla_zwierzyniec", map: 24, kind: "snares", name: "Sidła kłusownika", mode: "reach", cells: [[20, 46], [45, 38], [66, 12]] },
        { key: "patrol_gajowego", map: 24, kind: "patrol", name: "Obchód gajowego", mode: "reach", cells: [[13, 40], [30, 50], [53, 45], [71, 20], [61, 5]] },
        { key: "rysiek_zasadzka", map: 24, kind: "npc", name: "Rysiek przy sidłach", mode: "reach", cells: [[46, 38]] },
        { key: "zblakane_start", map: 168, kind: "animals", name: "Zbłąkane zwierzęta", mode: "reach", x: 84, y: 28, w: 3, h: 3 },
        { key: "strzelnica", map: 162, kind: "range", name: "Strzelnica", mode: "reach", x: 73, y: 50, w: 12, h: 5 }
    ];

    // ------------------------------------------------------------------ the discoveries (Okolice.discoverable; the tab "Okolice")
    const DISCOVER = [
        { key: "nora", map: 23, x: 65, y: 51, near: 8, icon: 481, xp: 30, name: "Wilcza nora", day: true,
          text: "Pod korzeniami starego pnia na Skraju lasu wataha ma norę. Za dnia wilki śpią przy wejściu, wiosną i latem bawią się tu szczenięta. Nocą wataha idzie na łowy." },
        { key: "gawra", map: 13, x: 99, y: 47, near: 6, icon: 483, xp: 30, name: "Gawra pod granią",
          text: "W skale nad kamieniołomem jest gawra. Od wiosny do jesieni niedźwiedź chodzi wokół niej. Zimą śpi w środku - słychać chrapanie. Lepiej go nie budzić." },
        { key: "blotnisko", map: 21, x: 66, y: 47, near: 4, icon: 482, xp: 25, name: "Błotnisko dzików",
          text: "Rozdeptane błoto przy Leśnej drodze. Rano i wieczorem dziki tarzają się tu godzinami. Kto się wytarza w błocie, pachnie jak las - zwierzęta później go wyczują." },
        { key: "lizawka", map: 4, x: 73, y: 51, near: 4, icon: 480, xp: 25, name: "Lizawka",
          text: "Wydrążony pieniek na Łące. Położona w nim bryła soli przez sześć dni ściąga jelenie o świcie i o zmierzchu. Obok zasiadka z chrustu: stąd zwierzęta wyczują cię później." },
        { key: "oboz_rabusiow", map: 21, x: 60, y: 41, near: 7, icon: 156, xp: 20, name: "Obóz rabusiów", camp: "rabusie",
          text: "Polana przy Leśnej drodze, wypalony krąg po ognisku. Rabusie wracają tu nocami. Kiedy nad lasem dymi mielerz, idą nocą pod szałas węglarza." },
        { key: "oboz_czo", map: 23, x: 66, y: 21, near: 8, icon: 485, xp: 30, name: "Obóz obcych myśliwych", camp: "czo",
          text: "Namiot i ognisko na Skraju lasu. Obcy myśliwi z białym okiem na lotkach strzał. Za dnia siedzą przy ogniu, nocą wychodzą w las." },
        { key: "zwierzyniec", map: 24, x: 7, y: 31, near: 2, icon: 484, xp: 25, name: "Zwierzyniec Lorda",
          text: "Za żywopłotem dworu ciągnie się zwierzyniec: jelenie, dziki, paśnik i leśniczówka gajowego. Tu poluje tylko dwór. Bez zezwolenia zabite zwierzę to kłusownictwo." },
        { key: "zblakane", map: 168, x: 85, y: 29, near: 6, icon: 349, xp: 20, name: "Zbłąkane zwierzęta",
          text: "Krowa, owca i kury z zagrody Ługów. Po pożarze rozbiegły się i zdziczały. Krowę i owcę odprowadzisz na powrozie, kury trzeba łapać rękami." },
        { key: "strzelnica", map: 162, x: 76, y: 52, near: 5, icon: 486, xp: 20, name: "Strzelnica garnizonu",
          text: "Trzy tarcze na 6, 8 i 9 kroków. Przy stojaku z łukami można postrzelać. Strzały ćwiczebne są od wojska. Co siódmy dzień przed południem są zawody." }
    ];

    // ------------------------------------------------------------------ the gamekeeper (TownLife 2905, Map024)
    // Gniewko Bór, about 40: a green kaftan, a bow on his back, a horn at his hip. Calm, dry, loyal to the forest more than to the Lord.
    // 6-20 his round through the park, at night in his lodge (61,4)
    const GAJOWY = {
        key: "gajowy", id: RESIDENT, sheet: "$Npc_Gajowy", map: 24, speed: 3,
        away: ["lesniczowka"],
        plan: [[0, "inside", "lesniczowka"], [6, "work", "gaj_lesniczowka"], [7, "patrol", ["gaj_1", "gaj_2", "gaj_3", "gaj_4", "gaj_5"]],
               [12, "stand", "gaj_pasnik"], [13, "patrol", ["gaj_5", "gaj_4", "gaj_3", "gaj_2", "gaj_1"]], [20, "inside", "lesniczowka"]],
        barks: {
        },
        talk: {
        }
    };
    Watki.scal(GAJOWY, "lowy", "mieszkaniec");   // (its words: js/teksty/lowy.txt, mieszkaniec)
    const GAJ_SPOTS = {
        lesniczowka: [61, 5, 2], gaj_lesniczowka: [62, 6, 2], gaj_pasnik: [60, 23, 8],
        gaj_1: [13, 40, 2], gaj_2: [30, 50, 2], gaj_3: [53, 45, 2], gaj_4: [71, 20, 2], gaj_5: [61, 5, 2]
    };
    (window.TownLifeExtra = window.TownLifeExtra || []).push(GAJOWY);
    const TL = window.TownLifeData;
    if (TL) {
        TL.SPOTS_BY_MAP = TL.SPOTS_BY_MAP || {};
        TL.SPOTS_BY_MAP[24] = Object.assign(TL.SPOTS_BY_MAP[24] || {}, GAJ_SPOTS);
    }
    // the bust (tools/busts/kit.py: img/pictures/Gajowy_Bust.png)
    if (window.SpeechBubbles && SpeechBubbles.BUSTS) SpeechBubbles.BUSTS["$Npc_Gajowy:0"] = "Gajowy_Bust";

    // ------------------------------------------------------------------ the texts (popups, talks)
    const TX = Watki.teksty("lowy");

    // the talks (lines: "> " the hero, "@key: " another speaker, else the one spoken to)
    const TALK = {
    };
    Watki.scal(TALK, "lowy", "rozmowy");   // (its words: js/teksty/lowy.txt, rozmowy)

    // ------------------------------------------------------------------ the quests (TownQuests packs)
    const Q_K59 = {
        id: "K59", kind: "K", giver: null, icon: 161, 
        autoStart: "lowK59Start",
        steps: [
            { type: "custom", check: "lowK59", vars: "lowK59" }
        ],
        reward: { xp: 0 }
    };
    Watki.scal(Q_K59, "lowy", "zadania.K59");   // (its words: js/teksty/lowy.txt, zadania.K59)
    const Q_K60 = {
        id: "K60", kind: "K", giver: null, icon: 201, 
        autoStart: "lowK60Start",
        steps: [
            { type: "custom", check: "lowK60Sol" },
            { type: "custom", check: "lowK60Swit" },
            { type: "custom", check: "lowK60Lup" }
        ],
        reward: { gold: 40, xp: 80 }
    };
    Watki.scal(Q_K60, "lowy", "zadania.K60");   // (its words: js/teksty/lowy.txt, zadania.K60)
    const Q_K61 = {
        id: "K61", kind: "K", giver: "kwatermistrz", icon: 126, 
        autoStart: "lowK61Start",
        offer: {
            cond: { hours: [8, 18], fn: "lowK61Offer" }
        },
        steps: [
            { type: "custom", check: "lowK61" }
        ],
        reward: { gold: 50, xp: 120 }
    };
    Watki.scal(Q_K61, "lowy", "zadania.K61");   // (its words: js/teksty/lowy.txt, zadania.K61)
    const Q_K62 = {
        id: "K62", kind: "K", giver: "praczka", icon: 123, 
        offer: {
            cond: { hours: [6, 19] }
        },
        steps: [
            { type: "custom", check: "lowK62", vars: "lowK62" }
        ],
        reward: { gold: 30, xp: 100, flag: "lowMlekoMarty" }
    };
    Watki.scal(Q_K62, "lowy", "zadania.K62");   // (its words: js/teksty/lowy.txt, zadania.K62)
    const Q_D32 = {
        id: "D32", kind: "D", giver: "gajowy", icon: 204, 
        offer: {
            cond: { hours: [6, 20], fn: "lowD32Offer" }
        },
        steps: [
            { type: "custom", check: "lowD32Sidla", vars: "lowD32Sidla" },
            { type: "custom", check: "lowD32Noc" },
            { type: "talk", to: "gajowy" }
        ],
        reward: { xp: 120, items: [[204, 1]] }
    };
    Watki.scal(Q_D32, "lowy", "zadania.D32");   // (its words: js/teksty/lowy.txt, zadania.D32)
    const Q_D33 = {
        id: "D33", kind: "D", giver: null, icon: 203, 
        autoStart: "lowD33Start",
        steps: [
            { type: "custom", check: "lowD33Wybor" },
            { type: "custom", check: "lowD33Koniec", vars: "lowD33" }
        ],
        reward: { xp: 150 }
    };
    Watki.scal(Q_D33, "lowy", "zadania.D33");   // (its words: js/teksty/lowy.txt, zadania.D33)

    const REMARKS = [
        { id: "lowCzoKleofas", who: "pustelnik", flag: "lowCzoPrzegnani" },
        { id: "lowCzoBazyli", who: "latarnik", flag: "lowCzoPrzegnani" },
        { id: "lowCzoPomocBazyli", who: "latarnik", flag: "lowCzoPomoc" },
        { id: "lowWydalRyskaPraczka", who: "praczka", flag: "lowWydalRyska" },
        { id: "lowOstrzeglRysiek", who: "klusownik", flag: "lowOstrzegl" },
        { id: "lowMartaKrasula", who: "praczka", flag: "lowMlekoMarty" }
    ];
    Watki.scal(REMARKS, "lowy", "uwagi");   // (its words: js/teksty/lowy.txt, uwagi)
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Lowy", quests: [Q_K59, Q_K60, Q_K61, Q_K62, Q_D32, Q_D33], remarks: REMARKS });

    // ------------------------------------------------------------------ the board (QuestBoard: its tables are live objects)
    const QB = window.QuestBoard;
    const T2 = (a, b) => [a, b];
    const BEASTS = {
        bandit: { sheet: "$Human_Bandit", icon: 156 },
        archer: { sheet: "$Human_Archer", icon: 127 },
        bear: { sheet: "$Animal_Bear", icon: 203 }
    };
    Watki.scal(BEASTS, "lowy", "bestie");   // (its words: js/teksty/lowy.txt, bestie)
    const TEMPLATES = {
        oboz: { id: "low_oboz_021", type: "hunt", giver: "wit", 
            req: [{ kill: "bandit", maps: [21], n: [null, T2(2, 2), T2(2, 3), T2(3, 3), T2(3, 4)] }] },
        czo: { id: "low_czo_023", type: "hunt", giver: "bogdan", 
            req: [{ kill: "archer", maps: [23], n: [null, null, T2(1, 1), T2(1, 1), T2(1, 1)] }] },
        poroze: { id: "low_poroze", type: "deliver", giver: "bogdan", 
            req: [{ item: 201, n: [null, T2(1, 1), T2(1, 1), T2(1, 2), T2(2, 2)] }] }
    };
    Watki.scal(TEMPLATES, "lowy", "tablica");   // (its words: js/teksty/lowy.txt, tablica)
    function addBoard() {
        if (!QB) return;
        try {
            const B = QB.BEASTS, L = QB.TEMPLATES;
            for (const k of Object.keys(BEASTS)) if (B && !B[k]) B[k] = BEASTS[k];
            // (low_czo_023 is put in and taken out by Lowy.js: only in Act II while the hunters' camp stands)
            for (const t of [TEMPLATES.oboz, TEMPLATES.poroze]) if (L && !L.some(x => x.id === t.id)) L.push(t);
            const parts = window.Tawerna && Tawerna.api("QuestBoard_parts"), KE = parts && parts.data && parts.data.KILL_EV;
            if (KE) { if (!KE.bandit) KE.bandit = 16; if (!KE.archer) KE.archer = 20; if (!KE.bear) KE.bear = 40; }
        } catch (e) { console.warn("Lowy_Data: tablica ogłoszeń", e); }
    }
    addBoard();

    // (2026-10-22, integration) the lines of the epilogue after the Heart (Underground.js asks Lowy.epilogue): one or two by what the hero did
    const EPILOG = {
    };
    Watki.scal(EPILOG, "lowy", "epilog");   // (its words: js/teksty/lowy.txt, epilog)
    window.LowyData = { EPILOG,
        VERSION, PKG: "B", OWNER: "Lowy", ready: true,
        IDS_RANGE: P ? P.ids : [2300, 2499], RESIDENTS: P ? P.residents : [2905, 2909], ITEMS: P ? P.items : [200, 209], ICONS: P ? P.icons : [480, 495],
        SWITCHES: P ? P.switches : [23, 24], SW_WYLOM, ITEM, MEATS, ICON, IDS, RESIDENT, NORA, PUP, GAWRA, BLOTO, LIZAWKA, OBOZY, ZWIERZYNIEC, ZBLAKANE, STRZELNICA,
        SPOTS, DISCOVER, GAJOWY, GAJ_SPOTS, TX, TALK, QUESTS: [Q_K59, Q_K60, Q_K61, Q_K62, Q_D32, Q_D33], BEASTS, TEMPLATES, addBoard
    };
})();
