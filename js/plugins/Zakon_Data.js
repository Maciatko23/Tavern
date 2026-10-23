//=============================================================================
// Zakon_Data.js
//=============================================================================
// PACZKA D „Tajemnice i zakon” (docs/rozszerzenia/PLAN.md, punkt 7) - only the data and the texts; the engine is Zakon.js (below
// every system of the game). What the new terrain of the enlarged maps gets from this package:
//   - the foundations of three watchtowers of the Order (Map022, Map013, Map157): a collapsed slab with a raven - one of the
//     "Zapiski strażnic" (cards 4-6, a series of its own, NOT the chronicle's cards 1-6 of Pustelnia)
//   - three wayside shrines with a carved raven (Map022, Map021, Map004): a prayer once a day = the buff "Błogosławieństwo drogi"
//   - three cairns with a raven stone (Map017, Map023, Map155): their top taken down by hand = cards 1-3
//   - the ring of menhirs on Map018 with the shadow riddle: dig (shovel) where the Watchman's shadow falls at the hour of the cards,
//     the Watchman's Key (225), the plate with the raven opens the chamber under the menhirs (Map176, this package's own map)
//   - five places only the white eagle reaches (Map125 x2, Map013 x2, Map168), each with a one-way way down (no one gets stuck
//     there), and the cliff herbs picked in a dive (Map155, Map157)
//   - the ruins of the Winged Guard's perches on the Orla Grań (Map175)
//   - the old cemetery of Map008 with the graves of the Order's brothers, its gravedigger Hieronim (TownLife 2930) and the gallows hill
//   - the grove of the Silent (Map120), the hour of silence
//   - the wild ravens on the rocks of Map155 / Map157 (drawn in the engine, read from Kruk.png)
//   - the pieces of the wreck that the storms bring out of the sand of the shoals (Map165)
// Quests K67-K70, D36-D38 (window.TownQuestsPacks), the resident (window.TownLifeExtra, id 2930), the talk bust, the places.
// Stands under Okolice_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): nothing here gives water. The perches' basins hold rain - the eagles' water, the hero does not drink it.

/*:
 * @target MZ
 * @plugindesc [paczka D] Dane: Tajemnice i zakon - strażnice, kapliczki, kopce z Zapiskami strażnic, krąg menhirów i komora (mapa 176), miejsca tylko dla orła, orle grzędy, cmentarz z grabarzem i szubienica, gaj Milczących, kruki, kawałki wraku. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Okolice_Data
 *
 * @help
 * ============================================================================
 * Zakon_Data.js - dane paczki D „Tajemnice i zakon”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md (punkt 7). Silnik: Zakon.js.
 * Numery zdarzeń: 2700-2899. Mieszkaniec TownLife: grabarz Hieronim (2930).
 * Przedmioty: 225-232 (rezerwa do 239). Ikony: 512-527. Przełączniki: 27-28.
 * Mapa: 176 „Komora pod menhirami”.
 * Zadania: K67 „Trzy kruki przy drogach”, K68 „Zapiski strażnic”,
 * K69 „Grzędy Straży”, K70 „Kawałki wraku”, D36 „Cień Strażnika”,
 * D37 „Groby z krukiem”, D38 „Godzina milczenia”.
 * Test: tests/zakon_test.js (port 9554).
 * ============================================================================
 */

(() => {
    "use strict";

    const O = window.OkoliceData, P = O ? O.PACKAGES.D : null;
    const VERSION = "1.1.0";

    // ------------------------------------------------------------------ the numbers of the package (PLAN.md 3.2)
    const IDS = [2700, 2899];
    const ITEM = { klucz: 225, pioro: 226, strzemie: 227, szarotka: 228, warzucha: 229, okucie: 230, tabliczka: 231, kamien: 232,
        // (the game's own things, only used)
        shovel: 62, gold: 0, piora: 146, smola: 176, moneta: 194, wisiorek: 172, lina: 93, orlePioro: 184 };
    const ICON = { klucz: 512, pioro: 513, strzemie: 514, szarotka: 515, warzucha: 516, okucie: 517, tabliczka: 518, kamien: 519,
        karta: 520, blogoslawienstwo: 521, spokoj: 522, kapliczka: 523, grob: 524, plyta: 525, gniazdo: 526, kruk: 527,
        stamina: 82, shovel: 379, gold: 313, food: 339, need: 82, eye: 439 };
    const SW = { komora: 27, rez: 28 };
    const MAPS = { polna: 22, gory: 13, urwisko: 157, lesna: 21, laka: 4, omszala: 17, skraj: 23, pustelnia: 155, menhiry: 18,
        komora: 176, przystan: 125, zagroda: 168, gran: 175, miasto: 8, osada: 120, wrak: 165 };
    // what the ravens and the shrines take (raw fish and meat first; the shrine's offering: anything with <Food:...>)
    const RAVEN_FOOD = [98, 173, 174, 186, 94, 157, 159, 161, 168, 99, 106, 105, 95];

    // ------------------------------------------------------------------ the pictures (img/characters, D's own prefix !$Zak_)
    // [sheet, direction, pattern]: the frame of a $ sheet (direction 2/4/6/8 = row, pattern 0-2 = column)
    const IMG = {
        fundament: ["!$Zak_Fundament", 2, 0],          // 240x192 frame: the 4x4 ring of low walls (one tile of room on the right)
        plytaStr: ["!$Zak_Plyty", 2, 0],               // the fallen slab with the raven (in the foundations)
        plytaStrZbadana: ["!$Zak_Plyty", 2, 1],        // ...the slab looked at (the hollow under it empty)
        plyta: ["!$Zak_Plyty", 4, 0],                  // the plate in the ring's middle: shut, the keyhole with the raven
        plytaKlucz: ["!$Zak_Plyty", 4, 1],             // ...the key in it
        plytaOtwarta: ["!$Zak_Plyty", 4, 2],           // ...open: the steps down
        dol: ["!$Zak_Plyty", 6, 0],                    // the packed earth where the key lies
        dolKopany: ["!$Zak_Plyty", 6, 1],              // ...dug out
        kapliczka: ["!$Zak_Kapliczka", 2, 0],          // the post with the little roof and the raven (48x96)
        kapliczkaDar: ["!$Zak_Kapliczka", 2, 1],       // ...with a coin or bread left at its foot
        kopiecKruk: ["!$Zak_Male", 2, 0],              // the raven stone on top of the cairn (over !$Rock_Cairn)
        ziele: ["!$Zak_Male", 2, 1],                   // szarotka on a rock shelf
        warzucha: ["!$Zak_Male", 2, 2],                // warzucha in a crack
        zieleZerwane: ["!$Zak_Male", 4, 0],            // a picked shelf (the roots)
        kolki: ["!$Zak_Male", 4, 1],                   // the old pegs and the frayed rope
        kamienKruk: ["!$Zak_Male", 4, 2],              // a stone with a raven (lore)
        skrytka: ["!$Zak_Male", 6, 0],                 // the smugglers' crate in the thicket
        skrytkaPusta: ["!$Zak_Male", 6, 1],
        ognisko: ["!$Zak_Male", 6, 2],                 // the old camp's cold fire ring
        pioro: ["!$Zak_Male", 8, 0],                   // a feather in a crack of the rock
        kamienMilcz: ["!$Zak_Male", 8, 1],             // a white stone of silence
        kamienMilczDar: ["!$Zak_Male", 8, 2],          // ...with the small white stone left on it
        gniazdo: ["!$Zak_Gniazdo", 2, 0],              // the eagles' nest (96x64)
        gniazdoPuste: ["!$Zak_Gniazdo", 2, 1],
        grzeda: ["!$Zak_Grzeda", 2, 0],                // the stone perch with the iron bar and the basin (48x144)
        grzedaWoda: ["!$Zak_Grzeda", 2, 1],            // ...rain water in the basin
        slady: ["!$Zak_Slady", 2, 0],                  // the rider's trace: the stirrup, the rotten saddle (96x48)
        siodlo: ["!$Zak_Slady", 2, 1],
        sladyPuste: ["!$Zak_Slady", 2, 2],
        grob: ["!$Zak_Groby", 2, 0],                   // a plain wooden cross
        grob2: ["!$Zak_Groby", 2, 1],                  // a mossy headstone
        grobKruk: ["!$Zak_Groby", 2, 2],               // a headstone with the raven, overgrown
        grobKrukCzysty: ["!$Zak_Groby", 4, 0],         // ...cleaned (the name to read)
        murekH: ["!$Zak_Groby", 4, 1],                 // the low wall, a piece across
        murekV: ["!$Zak_Groby", 4, 2],                 // the low wall, a piece along (left / right)
        murekRog: ["!$Zak_Groby", 6, 0],               // a corner post
        furtka: ["!$Zak_Groby", 6, 1],                 // the open gate
        lampa: ["!$Zak_Groby", 6, 2],                  // the lamp on a post (fire at night)
        szubienica: ["!$Zak_Szubienica", 2, 0],        // the gallows on its mound (144x144)
        wrak1: ["!$Zak_Wrak", 2, 0],                   // the planks with iron fittings
        wrak2: ["!$Zak_Wrak", 2, 1],                   // the name board
        wrak3: ["!$Zak_Wrak", 2, 2],                   // the small iron-bound chest
        wrakDol: ["!$Zak_Wrak", 4, 0],                 // the hole left in the sand
        komoraMapa: ["!$Zak_Komora", 2, 0],            // the wall with the four towers carved (96x96)
        komoraMisa: ["!$Zak_Komora", 2, 1],            // the stone basin
        komoraSkrzynia: ["!Chest", 2, 0, 6],           // the chest (the RTP's wooden one, closed / open)
        komoraSkrzyniaOtw: ["!Chest", 8, 0, 6],
        pochodniaZimna: ["!Decoration", 2, 0, 3]       // a burnt-out torch on the wall (as on Map146)
    };

    // ------------------------------------------------------------------ the places
    // Every event of the package: { id, map, x, y, kind, ... }. The ids are the same range on every map (PLAN.md 3.2: 2700-2899);
    // they are kept apart here anyway, so one id means one thing.
    const TOWERS = [   // 7.1: the 6x6 foundations (x, y: the top left cell), the slab in the middle, Farming's random bushes under them
        { key: "straznica_022", map: 22, x: 71, y: 36, name: "Fundamenty strażnicy przy Polnej drodze", card: true, ids: { ring: 2700, slab: 2701, blank: 2702 }, bushes: [[75, 36], [74, 40], [74, 41]] },
        { key: "straznica_013", map: 13, x: 79, y: 20, name: "Fundamenty strażnicy w Górach", card: true, ids: { ring: 2700, slab: 2701, blank: 2702 }, bushes: [[82, 22]] },
        { key: "straznica_157", map: 157, x: 94, y: 52, name: "Fundamenty strażnicy nad morzem", card: true, ids: { ring: 2700, slab: 2701, blank: 2702 }, bushes: [] }
    ];
    const SLAB_AT = [2, 3];   // the slab: the cell x+2, y+3 of a foundation (its middle, a little to the left)
    const SHRINES = [  // 7.2: the shrine stands on the bottom left cell of its 2x2 place (the road below)
        { key: "kapliczka_022", map: 22, x: 72, y: 16, name: "Kapliczka przydrożna", id: 2710, at: [72, 17], bushes: [] },
        { key: "kapliczka_021", map: 21, x: 58, y: 12, name: "Kapliczka z krukiem przy Leśnej drodze", id: 2710, at: [58, 13], bushes: [[58, 12]] },
        { key: "kapliczka_004", map: 4, x: 66, y: 6, name: "Kapliczka z krukiem na Łące", id: 2710, at: [66, 7], bushes: [] }
    ];
    const CAIRNS = [   // 7.3: the cairn (!$Rock_Cairn, its own list - never mined) and the raven stone on its top
        { key: "kopiec_017", map: 17, x: 50, y: 36, name: "Kopiec z krukiem na Omszałej łące", ids: { cairn: 2750, stone: 2751 }, at: [50, 37] },
        { key: "kopiec_023", map: 23, x: 58, y: 51, name: "Kopiec z krukiem na Skraju lasu", ids: { cairn: 2750, stone: 2751 }, at: [58, 52] },
        { key: "kopiec_155", map: 155, x: 70, y: 40, name: "Kopiec z krukiem nad klifem", ids: { cairn: 2750, stone: 2751 }, at: [70, 41] }
    ];
    // 7.4: the ring of menhirs on Map018 - the Watchman (the tallest), the plate in the middle, the hole where the key lies
    const RING = {
        map: 18, centre: [53, 45], r: 4,
        stones: [[53, 41], [56, 42], [57, 45], [56, 48], [53, 49], [50, 48], [49, 45]], stoneIds: 2760,
        watchman: { x: 50, y: 42, id: 2767, img: "!$Rock_Spire" }, stoneImg: "!$Rock_Column",
        plate: { x: 53, y: 45, id: 2768 }, hole: { x: 52, y: 43, id: 2769 },
        // the shadow of the Watchman (Okolice.shadowAt - Sky.js's formula; the drawn rock shadow of ChoppableTree_Render: its foot 14 px
        // over the cell's bottom, its height the frame's 92 px) must cover the hole's middle within half a tile, the sun's light >= 0.25,
        // no rain, no storm. The windows that gives (tests/zakon_test.js checks them): spring 17:21-19:48, summer 18:15-20:15,
        // autumn 16:18-18:48, winter 15:21-17:30 - the sun four fifths of its way (p 0.73-0.95), as the third card says
        shadow: { hPx: 92, footUp: 14, tol: 0.5, light: 0.25 },
        digHits: 3,
        back: [53, 46]   // where the steps of the chamber come out
    };
    // 7.4: the chamber under the menhirs (Map176, built by tools/rozszerzenia/D/komora.py): the steps up, the sarcophagus of the first
    // watchman, the basin, the wall with the four towers, the chest
    const CHAMBER = {
        map: 176, entry: [10, 4], dir: 2,
        stairs: { id: 2770, x: 10, y: 3 },
        sarcophagus: [{ id: 2771, x: 9, y: 7 }, { id: 2777, x: 10, y: 7 }], basin: { id: 2772, x: 5, y: 6 }, wall: { id: 2773, x: 14, y: 3 },
        chest: { id: 2774, x: 10, y: 9 }, statues: [{ id: 2775, x: 7, y: 7 }, { id: 2776, x: 12, y: 7 }],
        torches: [{ id: 2778, x: 7, y: 3 }, { id: 2779, x: 12, y: 3 }],   // (cold: the brothers put out their fire - the hero brings his own)
        gold: 60
    };
    // 7.5: the places only the white eagle reaches - the landing square (Orzel_Lot: 4x4 adult, 3x3 the fourth stage), its things
    // (outside the square: it stays free for the landing) and the one-way way down (the pegs: stand on them, O)
    const EAGLE = [
        { key: "orzel_125_a", map: 125, x: 97, y: 44, w: 4, h: 4, seed: [97, 44], name: "Skrytka w gąszczu nad przystanią", rope: "lina",
          down: { id: 2782, at: [81, 63], to: [81, 68], dir: 2 },
          things: [{ id: 2780, kind: "stash", x: 95, y: 48 }, { id: 2781, kind: "warzucha", x: 101, y: 46 }] },
        { key: "orzel_125_b", map: 125, x: 105, y: 30, w: 4, h: 4, seed: [106, 30], name: "Stare gniazdo nad przystanią", rope: "lina",
          down: { id: 2784, at: [109, 24], to: [109, 21], dir: 8 },
          things: [{ id: 2783, kind: "nest", x: 103, y: 36, feathers: 3 }] },
        { key: "orzel_013_a", map: 13, x: 99, y: 38, w: 4, h: 4, seed: [99, 39], name: "Półka zakonnych orłów nad gawrą", rope: "kolki",
          down: { id: 2720, at: [99, 37], to: [97, 37], dir: 4 },
          things: [{ id: 2721, kind: "nestOrder", x: 101, y: 43 }, { id: 2722, kind: "szarotka", x: 103, y: 40 }], bushes: [[100, 38]], blankId: 2723 },
        { key: "orzel_013_b", map: 13, x: 33, y: 73, w: 4, h: 4, seed: [33, 73], name: "Półka z szarotką", rope: "kolki",
          down: { id: 2730, at: [33, 73], to: [31, 73], dir: 4 },
          things: [{ id: 2731, kind: "szarotka", x: 38, y: 74 }, { id: 2732, kind: "ravenStone", x: 39, y: 76 }] },
        { key: "orzel_168", map: 168, x: 51, y: 24, w: 4, h: 4, seed: [51, 24], name: "Skarpa nad spaloną zagrodą", rope: "kolki",
          down: { id: 2785, at: [54, 24], to: [54, 20], dir: 8 },
          things: [{ id: 2786, kind: "warzucha", x: 55, y: 27 }, { id: 2787, kind: "camp", x: 50, y: 27 }] }
    ];
    const REGROW = 7;          // the herbs and the old nest's feathers: again after seven days
    // 7.5: the cliff herbs - in the sea by the cliff, no cell on foot beside them: only the adult eagle's dive in low flight (Space)
    const CLIFF = [
        { key: "klif_155_1", map: 155, x: 1, y: 54, id: 2752 }, { key: "klif_155_2", map: 155, x: 2, y: 66, id: 2753 },
        { key: "klif_155_3", map: 155, x: 73, y: 2, id: 2754 },
        { key: "klif_157_1", map: 157, x: 62, y: 1, id: 2740 }, { key: "klif_157_2", map: 157, x: 72, y: 5, id: 2741 },
        { key: "klif_157_3", map: 157, x: 100, y: 5, id: 2742 }
    ];
    const DIVE = { reach: 1.6, cost: 10, stage: 5 };   // how near the eagle's foot must be (tiles), what it costs its wings, the adult only
    // 7.6: the perches of the Winged Guard on the Orla Grań (the 3x3 places: the perch in the middle of the bottom row, its trace beside)
    const PERCHES = [
        { n: 1, key: "orle_grzedy_1", map: 175, x: 67, y: 11, at: [68, 13], id: 2790, trace: { id: 2793, x: 69, y: 13, kind: "strzemie" } },
        { n: 2, key: "orle_grzedy_2", map: 175, x: 67, y: 24, at: [68, 26], id: 2791, trace: { id: 2794, x: 69, y: 26, kind: "siodlo" } },
        { n: 3, key: "orle_grzedy_3", map: 175, x: 67, y: 43, at: [68, 45], id: 2792, trace: { id: 2795, x: 69, y: 45, kind: "pioro" } }
    ];
    const PERCH_BOND = 5, PERCH_NEAR = 1.6;
    // 7.7: the old cemetery on Map008 (x 5-12, y 23-28): the low wall round it, the gate below (8-9, 28), eight graves, three with
    // the raven; the lamp on its post at the back wall; the gravedigger's places (TownLifeData.SPOTS - Map008 reads only those)
    const CEMETERY = {
        map: 8, x: 5, y: 23, w: 8, h: 6,
        wall: { from: 2800 },   // 2800-2820: the wall's 21 pieces (built by the engine round the rectangle, the gate's gap left open)
        gate: [[8, 28], [9, 28]], lamp: { id: 2821, x: 9, y: 23 },
        graves: [
            { id: 2830, x: 6, y: 24, img: "grob" }, { id: 2831, x: 7, y: 24, raven: 1 }, { id: 2832, x: 10, y: 24, img: "grob2" },
            { id: 2833, x: 11, y: 24, raven: 2 }, { id: 2834, x: 6, y: 26, img: "grob2" }, { id: 2835, x: 7, y: 26, img: "grob" },
            { id: 2836, x: 10, y: 26, raven: 3 }, { id: 2837, x: 11, y: 26, img: "grob" }
        ],
        cleanHits: 4
    };
    const GALLOWS = { map: 8, x: 87, y: 121, w: 3, h: 3, id: 2840, at: [88, 123], creak: [22, 3] };
    // 7.8: the grove of the Silent on Map120 (Act II: switch 16 opens the settlement), the seven white stones round (57, 54)
    const GROVE = {
        map: 120, x: 53, y: 51, w: 9, h: 7, centre: [57, 54], r: 3, ids: 2850, centreId: 2857,
        stones: [[57, 51], [59, 52], [60, 54], [59, 56], [57, 57], [55, 56], [54, 53]],
        // the rule: from dusk (the sun under the horizon, Sky.sunTimes) one hour of the game standing in the middle (within 1 to
        // start, never further than 3), not running, the weapon put away (no combat mode), no talk
        start: 1, keep: 3, hours: 1, late: 3
    };
    // 7.9: the wild ravens on the generator's rocks (read only - the rocks stay as they are)
    const RAVENS = [
        { key: "kruki_155", map: 155, rocks: [[68, 26], [76, 47], [92, 66]] },
        { key: "kruki_157", map: 157, rocks: [[76, 21], [78, 37], [81, 39]] }
    ];
    const RAVEN = { flee: 5, near: 1, perRock: 2, gifts: [[194, 1], [146, 2], [194, 1], [146, 1]] };
    // 7.10: the pieces of the wreck in the shoals of Map165 - one more out of the sand after each storm, seen only at low tide
    const WRECK = { map: 165, hits: 6, pieces: [
        { n: 1, x: 47, y: 24, id: 2860, img: "wrak1" }, { n: 2, x: 62, y: 18, id: 2861, img: "wrak2" }, { n: 3, x: 71, y: 24, id: 2862, img: "wrak3" }
    ], chestGold: 40 };

    // the work by hand / with the shovel: blows (PLAN.md: the cairn 4 by hand, the grave 4, the wreck 6 with the shovel)
    const WORK = { cairn: 4, grave: 4, wreck: 6, dig: 3 };

    // ------------------------------------------------------------------ the places for Okolice's collision test and the discoveries
    // (registered by the engine with Okolice.registerSpots("D", SPOTS); the modes as in OkoliceData.PLAN_SPOTS)
    const SPOTS = [];
    for (const t of TOWERS) SPOTS.push({ key: t.key, map: t.map, kind: "found", name: "Fundamenty strażnicy", mode: "reach", x: t.x, y: t.y, w: 6, h: 6 });
    for (const s of SHRINES) SPOTS.push({ key: s.key, map: s.map, kind: "shrine", name: s.name, mode: "reach", x: s.x, y: s.y, w: 2, h: 2 });
    for (const c of CAIRNS) SPOTS.push({ key: c.key, map: c.map, kind: "cairn", name: "Kopiec z krukiem", mode: "reach", x: c.x, y: c.y, w: 2, h: 2 });
    SPOTS.push({ key: "menhiry_krag", map: 18, kind: "ring", name: "Krąg menhirów", mode: "reach",
        cells: RING.stones.concat([[RING.watchman.x, RING.watchman.y], RING.plate && [RING.plate.x, RING.plate.y], [RING.hole.x, RING.hole.y]]) });
    for (const p of PERCHES) SPOTS.push({ key: p.key, map: p.map, kind: "perch", name: "Orla grzęda", mode: "reach", x: p.x, y: p.y, w: 3, h: 3 });
    SPOTS.push({ key: "cmentarz", map: 8, kind: "cemetery", name: "Stary cmentarz", mode: "reach", x: CEMETERY.x, y: CEMETERY.y, w: CEMETERY.w, h: CEMETERY.h, allowOld: true });
    SPOTS.push({ key: "szubienica", map: 8, kind: "gallows", name: "Wzgórze z szubienicą", mode: "reach", x: GALLOWS.x, y: GALLOWS.y, w: 3, h: 3 });
    SPOTS.push({ key: "gaj_milczacych", map: 120, kind: "grove", name: "Gaj Milczących", mode: "reach", x: GROVE.x, y: GROVE.y, w: GROVE.w, h: GROVE.h });
    for (const e of EAGLE) {
        SPOTS.push({ key: e.key, map: e.map, kind: "eagle", name: e.name, mode: "eagle", seed: e.seed, x: e.x, y: e.y, w: e.w, h: e.h });
        SPOTS.push({ key: e.key + "_rzeczy", map: e.map, kind: "eagle", name: e.name + " (rzeczy)", mode: "eagle", seed: e.seed, cells: e.things.map(t => [t.x, t.y]) });
        SPOTS.push({ key: e.key + "_zejscie", map: e.map, kind: "rope", name: "Stare kołki", mode: "eagle", seed: e.seed, cells: [e.down.at] });
        SPOTS.push({ key: e.key + "_zejscie_dol", map: e.map, kind: "rope", name: "Pod kołkami", mode: "reach", cells: [e.down.to] });
    }
    SPOTS.push({ key: "ziola_klif_155", map: 155, kind: "cliffherb", name: "Zioła na klifie", mode: "dive", cells: CLIFF.filter(c => c.map === 155).map(c => [c.x, c.y]) });
    SPOTS.push({ key: "ziola_klif_157", map: 157, kind: "cliffherb", name: "Zioła na klifie", mode: "dive", cells: CLIFF.filter(c => c.map === 157).map(c => [c.x, c.y]) });
    for (const r of RAVENS) SPOTS.push({ key: r.key, map: r.map, kind: "ravens", name: "Kruki na skałach", mode: "zone", cells: r.rocks });
    SPOTS.push({ key: "wrak_kawalki", map: 165, kind: "wreck", name: "Kawałki wraku", mode: "tide", cells: WRECK.pieces.map(p => [p.x, p.y]) });

    // the discoveries (Okolice.discoverable; near: tiles, -1 only by the engine). The engine adds `when` where needed.
    const DISC = [
        { key: "straznica_022", map: 22, x: 73, y: 38, near: 3, name: "Fundamenty strażnicy przy Polnej drodze", icon: ICON.plyta, xp: 30,
          text: "Na wzgórku nad Polną drogą zostały z wieży same obmurówki - kwadrat sześć na sześć kroków. W środku zawalona płyta z wyrytym krukiem. Stąd widać łąki aż po las." },
        { key: "straznica_013", map: 13, x: 81, y: 22, near: 3, name: "Fundamenty strażnicy w Górach", icon: ICON.plyta, xp: 30,
          text: "Przy drodze ku przylądkowi kamienne obmurówki dawnej wieży zakonu. Z tego miejsca widać przełęcz i drogę w dół, do łąk." },
        { key: "straznica_157", map: 157, x: 96, y: 54, near: 3, name: "Fundamenty strażnicy nad morzem", icon: ICON.plyta, xp: 30,
          text: "Na wschodnim krańcu Urwiska stała wieża zakonu. Zostały fundamenty i płyta z krukiem. W dole tylko morze." },
        { key: "kapliczka_022", map: 22, x: 72, y: 17, near: 2, name: "Kapliczka przydrożna", icon: ICON.kapliczka, xp: 20,
          text: "Drewniany słupek z daszkiem przy drodze na wschód. Pod daszkiem wyrzeźbiony kruk. Ludzie zostawiają tu grosz albo okruch chleba i mówią, że droga potem lżejsza." },
        { key: "kapliczka_021", map: 21, x: 58, y: 13, near: 2, name: "Kapliczka przy Leśnej drodze", icon: ICON.kapliczka, xp: 20,
          text: "Kapliczka z krukiem przy Leśnej drodze. Daszek omszały, ale ktoś niedawno przetarł kruka z kurzu." },
        { key: "kapliczka_004", map: 4, x: 66, y: 7, near: 2, name: "Kapliczka na Łące", icon: ICON.kapliczka, xp: 20,
          text: "Kapliczka z krukiem przy drodze na północnym wschodzie Łąki. Kruk patrzy w stronę gór." },
        { key: "kopiec_017", map: 17, x: 50, y: 37, near: 2, name: "Kopiec z krukiem na Omszałej łące", icon: ICON.kruk, xp: 20,
          text: "Stos kamieni układany ręką, na szczycie płaski kamień z krukiem. Takie kopce znaczyły drogi zakonu." },
        { key: "kopiec_023", map: 23, x: 58, y: 52, near: 2, name: "Kopiec z krukiem na Skraju lasu", icon: ICON.kruk, xp: 20,
          text: "Kopiec z krukiem na skraju lasu. Mech porósł go do połowy, ale kruk na szczycie jest czysty, jakby ktoś go doglądał." },
        { key: "kopiec_155", map: 155, x: 70, y: 41, near: 2, name: "Kopiec z krukiem nad klifem", icon: ICON.kruk, xp: 20,
          text: "Kopiec nad klifem za pustelnią, zwrócony do morza. Kamień z krukiem na szczycie wytarty od wiatru." },
        { key: "menhiry_krag", map: 18, x: 53, y: 45, near: 4, name: "Krąg menhirów", icon: ICON.plyta, xp: 30,
          text: "Osiem stojących kamieni w kręgu na łące. Najwyższy, poszarpany, stoi od północnego zachodu - zapiski strażnic nazywają go Strażnikiem. W środku płaska płyta z krukiem i dziurką jak na klucz." },
        { key: "cien_straznika", map: 18, x: 52, y: 43, near: -1, name: "Cień Strażnika", icon: ICON.klucz, xp: 60,
          text: "Gdy słońce przeszło cztery części swej drogi z pięciu, cień Strażnika wskazał miejsce w kręgu. W ubitej ziemi leżał kamienny klucz z krukiem." },
        { key: "komora", map: 176, x: 10, y: 6, near: -1, name: "Komora pod menhirami", icon: ICON.plyta, xp: 60,
          text: "Pod płytą z krukiem schody prowadzą do komory. Sarkofag pierwszego strażnika, kamienna misa i ściana z wykutymi czterema wieżami." },
        { key: "orzel_125_a", map: 125, x: 98, y: 45, near: 2, air: true, name: "Skrytka w gąszczu nad przystanią", icon: ICON.gniazdo, xp: 40,
          text: "Polana w gąszczu nad przystanią, do której nie prowadzi żadna ścieżka. Ktoś jednak ukrył tu skrzynię - i zszedł na dół po linie." },
        { key: "orzel_125_b", map: 125, x: 106, y: 31, near: 2, air: true, name: "Stare gniazdo nad przystanią", icon: ICON.gniazdo, xp: 40,
          text: "Zarośnięta półka nad przystanią. Wielkie gniazdo z gałęzi, puste od lat - ale w środku zawsze leży kilka piór." },
        { key: "orzel_013_a", map: 13, x: 100, y: 39, near: 2, air: true, name: "Półka zakonnych orłów", icon: ICON.gniazdo, xp: 50,
          text: "Skalna półka nad gawrą. Tu zakon trzymał orły: gniazdo jest stare jak mury, a w szczelinach rośnie szarotka." },
        { key: "orzel_013_b", map: 13, x: 34, y: 74, near: 2, air: true, name: "Półka z szarotką", icon: ICON.szarotka, xp: 40,
          text: "Wysoka półka w zachodnich skałach. Szarotka, kamień z krukiem i stare kołki w ścianie: ktoś tu kiedyś schodził na dół." },
        { key: "orzel_168", map: 168, x: 52, y: 25, near: 2, air: true, name: "Skarpa nad spaloną zagrodą", icon: ICON.gniazdo, xp: 40,
          text: "Skarpa nad spaloną zagrodą Ługów. Stare palenisko w kręgu kamieni - ktoś tu nocował, kiedy jeszcze dało się tu wejść." },
        { key: "ziola_klif", map: 157, x: 72, y: 5, near: -1, air: true, name: "Zioła z klifów", icon: ICON.warzucha, xp: 40,
          text: "Na półkach klifów nad morzem rośnie warzucha nadmorska. Sięga się po nią tylko z grzbietu orła, nurkując nisko nad wodą." },
        { key: "orle_grzedy_1", map: 175, x: 68, y: 13, near: 2, name: "Orla grzęda (północna)", icon: ICON.gniazdo, xp: 30,
          text: "Kamienny słup z żelazną poprzeczką i misą na deszczówkę. Na takich grzędach siadały orły Skrzydlatej Straży." },
        { key: "orle_grzedy_2", map: 175, x: 68, y: 26, near: 2, name: "Orla grzęda (środkowa)", icon: ICON.gniazdo, xp: 30,
          text: "Druga grzęda Straży. Pod nią zbutwiałe siodło - za małe dla konia, za szerokie dla człowieka." },
        { key: "orle_grzedy_3", map: 175, x: 68, y: 45, near: 2, name: "Orla grzęda (południowa)", icon: ICON.gniazdo, xp: 30,
          text: "Ostatnia grzęda, nad samym urwiskiem. W szczelinie słupa tkwią stare pióra." },
        { key: "cmentarz", map: 8, x: 9, y: 27, near: 3, name: "Stary cmentarz", icon: ICON.grob, xp: 25,
          text: "Stary cmentarz za miasteczkiem, za niskim murkiem. Większość krzyży zwykłych, ale na trzech kamieniach wyryto kruka." },
        { key: "szubienica", map: 8, x: 88, y: 124, near: 2, name: "Wzgórze z szubienicą", icon: ICON.grob, xp: 20,
          text: "Szubienica Lorda przy wschodniej drodze. Tu dwór wiesza kłusowników i przemytników. Nocą skrzypi, choć nikt na niej nie wisi." },
        { key: "gaj", map: 120, x: 57, y: 54, near: 3, name: "Gaj Milczących", icon: ICON.kamien, xp: 40,
          text: "Polana w lesie za osadą. Siedem białych, płaskich kamieni w kręgu. Milczący przychodzą tu o zmierzchu i stoją godzinę bez słowa." },
        { key: "kruki_155", map: 155, x: 76, y: 47, near: 4, name: "Kruki na skałach pustelni", icon: ICON.kruk, xp: 20,
          text: "Na głazach nad klifem siadają dzikie kruki. Płoszą się, kiedy biegniesz - ale za rybę zostawią coś błyszczącego." },
        { key: "kruki_157", map: 157, x: 78, y: 37, near: 4, name: "Kruki na skałach Urwiska", icon: ICON.kruk, xp: 20,
          text: "Kruki z Urwiska siadają na skałach między ruinami. Kruczarze zakonu karmili ich przodków." },
        { key: "wrak_kawalki", map: 165, x: 62, y: 18, near: -1, name: "Kawałki wraku w odpływie", icon: ICON.okucie, xp: 30,
          text: "Po każdym sztormie piasek na płyciznach odsłania kolejny kawałek „Białej Źrenicy”. Widać je tylko w odpływie." }
    ];

    // ------------------------------------------------------------------ "Zapiski strażnic": a series of its own (6 cards, the vitems
    // zak_karta_1..6). The cairns give 1-3, the towers 4-6 - in the order they are found. Brother Kleofas reads them (his talk:
    // 2 hours, 40 XP, a note "Zapiski strażnic (N): ..."). NOT the chronicle's cards (kronikaKarta*) - those are Pustelnia's.
    const CARDS = [
        { n: 1, title: "Warta", note: "Cztery wieże na czterech drogach, a piąte oko to kruk. Z każdej wieży widać ogień sąsiedniej. Kiedy ogień gaśnie, kruk leci z listem do następnej. Tak strażnice zakonu pilnowały wyspy, zanim ktokolwiek dopłynął do brzegu. Z trzech wież na drogach widać ten sam krąg kamieni na łące.",
          read: ["„Cztery wieże na czterech drogach, a piąte oko to kruk.”", "„Z każdej wieży widać ogień sąsiedniej. Kiedy ogień gaśnie, kruk leci z listem do następnej.”", "„Z trzech wież na drogach widać krąg kamieni na łące. Krąg pilnuje nas, a my kręgu.”"] },
        { n: 2, title: "Krąg", note: "Krąg kamieni na łące jest starszy niż zakon. Bracia warty składali przy nim przysięgę: patrzeć i nie pytać. Najwyższy kamień, poszarpany, stoi od północnego zachodu - nazwali go Strażnikiem.",
          read: ["„Krąg na łące stał, zanim przyszliśmy. Nie my go postawiliśmy i nie nam go burzyć.”", "„Przy kręgu brat warty składa przysięgę: patrzę i nie pytam.”", "„Najwyższy kamień, poszarpany jak skała z gór, stoi od północnego zachodu. Zwiemy go Strażnikiem.”"] },
        { n: 3, title: "Godzina", note: "„Gdy słońce przejdzie cztery części swej drogi z pięciu, Strażnik wskaże ręką.” Kopać tam, gdzie padnie cień Strażnika - i tylko wtedy. Latem to późne popołudnie, zimą wcześniej, bo dzień krótszy. W deszcz cienia nie ma.",
          read: ["„Gdy słońce przejdzie cztery części swej drogi z pięciu, Strażnik wskaże ręką.”", "„Kop tam, gdzie padnie jego ręka, i tylko wtedy. Ziemia odda klucz temu, kto zna godzinę.”", "(Kleofas:) Ręka to cień, chłopcze. Słońce idzie od wschodu do zachodu - cztery piąte drogi to późne popołudnie. Latem później, zimą wcześniej. I nie w deszcz."] },
        { n: 4, title: "Klucz", note: "Klucz do komory pod kręgiem wykuto z kamienia, nie z żelaza - żelazo rdzewieje, kamień czeka. Wyryto na nim kruka. Zakopano go w kręgu, w cieniu Strażnika, żeby znalazł go tylko ten, kto czyta zapiski strażnic.",
          read: ["„Klucz wykuliśmy z kamienia, nie z żelaza. Żelazo rdzewieje, kamień czeka.”", "„Na kluczu kruk, jak na płycie. Zakopaliśmy go w kręgu, w cieniu Strażnika.”", "„Kto nie czytał tych słów, przejdzie po nim sto razy i nie znajdzie.”"] },
        { n: 5, title: "Komora", note: "Pod płytą z krukiem w środku kręgu jest komora. Leży w niej pierwszy strażnik warty, a na ścianie wykuto cztery wieże: trzy na drogach i czwartą na przylądku, skąd widać morze. Kto wejdzie, niech nie bierze niczego prócz tego, co mu zostawiono.",
          read: ["„Pod płytą z krukiem jest komora. Śpi w niej pierwszy strażnik warty.”", "„Na ścianie wykuliśmy cztery wieże: trzy na drogach i czwartą na przylądku, skąd widać morze.”", "„Kto wejdzie, niech nie bierze niczego prócz tego, co mu zostawiono.”"] },
        { n: 6, title: "Ostatnia warta", note: "Roku sto szóstego wieże gasły jedna po drugiej. Bracia warty puścili kruki wolno i zeszli z wież. Ostatni wpis: „Gasimy ogień. Kto znajdzie te słowa, niech pamięta, czego strzegliśmy: nie pytaj o to, czego nie chcesz wiedzieć.”",
          read: ["„Roku sto szóstego wieże gasły jedna po drugiej.”", "„Kruki puściliśmy wolno. Ogień zgasimy sami, zanim zgaśnie od wiatru.”", "„Kto znajdzie te słowa, niech pamięta, czego strzegliśmy: nie pytaj o to, czego nie chcesz wiedzieć.”", "(Kleofas cicho:) Tak samo mawiał mój mistrz. I karczmarz Borgar, choć nie wie skąd."] }
    ];
    const VITEMS = {};
    for (const c of CARDS) VITEMS["zak_karta_" + c.n] = { name: "Zapiski strażnic (" + c.n + ")", icon: ICON.karta };
    VITEMS.zak_imiona = { name: "Imiona z grobów z krukiem", icon: ICON.grob };
    const READ_HOURS = [7, 19], READ_TIME = 2, READ_XP = 40;

    // ------------------------------------------------------------------ the texts
    const TX = {
        // the work
        tired: "Jesteś zbyt zmęczony",
        needShovel: "Potrzebujesz łopaty",
        // the foundations
        towerLook: ["> (Obmurówki dawnej wieży. Z kamieni sterczy jeszcze żelazny hak na pochodnię.)", "> Płyta w środku zawaliła się do piwnicy. Wyryty kruk patrzy w niebo."],
        towerAsk: "Zajrzeć pod płytę?", towerTake: "Zajrzyj pod płytę.", towerLeave: "Zostaw.",
        towerFound: n => ["> (Pod płytą sucha wnęka, a w niej zwój w natłuszczonej skórze.)", "> Zapiski strażnic. Karta " + n + ". Pismo proste, jak u żołnierza - ale ja tego nie przeczytam. Brat Kleofas przeczyta."],
        towerEmpty: "Pod płytą pusto. Kartę już masz.",
        towersRing: ["> Trzy wieże, trzy płyty z krukiem. Z każdej widać łąkę z kamiennym kręgiem. Strażnice patrzyły na krąg."],
        // the shrines
        shrineAsk: "Kapliczka z krukiem przy drodze.", shrinePray: "Pomódl się.", shrineCoin: "Zostaw 1 G.", shrineFood: "Zostaw coś do jedzenia.", shrineLeave: "Odejdź.",
        prayed: "Błogosławieństwo drogi", prayedSub: h => "Prace kosztują 10% mniej sił  ·  " + h + " h",
        prayedToday: "Już się tu dziś modliłeś",
        prayThink: ["> (Słowa same przychodzą, choć nikt mnie ich nie uczył.)"],
        offered: h => "Dar przy kapliczce  ·  błogosławieństwo " + h + " h",
        offerFull: "Błogosławieństwo i tak już trwa najdłużej, jak może",
        offerNeedPrayer: "Najpierw się pomódl",
        noCoin: "Nie masz ani grosza", noFood: "Nie masz nic do jedzenia",
        offeredToday: "Dziś już coś tu zostawiłeś",
        // the cairns
        cairnAsk: "Kopiec z krukiem. Szczyt da się zdjąć rękami.", cairnTake: "Rozbierz szczyt.", cairnLeave: "Zostaw.",
        cairnHit: (n, m) => "Zdejmujesz kamienie " + n + "/" + m,
        cairnFound: n => ["> (W środku kopca, pod kamieniem z krukiem, zwój w natłuszczonej skórze.)", "> Zapiski strażnic, karta " + n + ". Układam kamienie z powrotem, jak były. Kruk na wierzch."],
        cairnDone: "Kopiec złożony z powrotem. Kartę już masz.",
        // the ring and the riddle
        stoneLook: ["> Stojący kamień, wyższy ode mnie. Ktoś go tu postawił, zanim powstał zakon."],
        watchmanLook: ["> Strażnik. Najwyższy z kamieni, poszarpany jak skała z gór.", "> Jego cień chodzi po kręgu jak wskazówka."],
        plateLook: ["> Płaska płyta w środku kręgu. Wyryty kruk, a pod nim wąska szczelina - jak na klucz."],
        plateAsk: "Płyta z krukiem.", plateKey: "Włóż kamienny klucz.", plateDown: "Zejdź po schodach.", plateLeave: "Odejdź.",
        plateOpen: ["> (Klucz wchodzi gładko, jakby szczelinę wykuto wczoraj. Coś zgrzyta pod ziemią.)", "> Płyta zsuwa się na bok. Pod nią schody w ciemność."],
        plateNoKey: "Szczelina na klucz. Nie masz klucza",
        holeLook: "Ubita ziemia. Coś tu jest, ale nie teraz… Strażnik nie patrzy.",
        holeRain: "W deszczu nie ma cienia. Strażnik nie wskaże",
        holeDug: "Tu był klucz. Dołek już zarasta",
        holeHit: (n, m) => "Kopiesz " + n + "/" + m,
        keyFound: ["> (Łopata stuka o kamień. W ziemi leży klucz - kamienny, z wyrytym krukiem.)", "> Cień Strażnika pada dokładnie tutaj. Cztery części drogi z pięciu."],
        keyGot: "Klucz Strażnika",
        // the chamber
        chamberFirst: ["> (Chłód i zapach kamienia. Tu nikt nie oddychał od stuleci.)", "> Komora pod menhirami. Bez pochodni nic tu nie zobaczę."],
        chamberDark: "Ciemno. Przydałaby się pochodnia",
        sarcLook: ["> Sarkofag. Na wieku wykuto kruka z rozpostartymi skrzydłami i jedno słowo: STRAŻNIK.", "> Pierwszy strażnik warty. Nie ruszam wieka."],
        basinLook: ["> Kamienna misa na nóżce. Sucha. Na dnie wykuto oko - zamknięte."],
        basinWater: ["> W misie trochę wody, która skapała z płyty po deszczu. Nie piję - to nie moja woda."],
        statueLook: ["> Kamienny brat w kapturze. Ręce złożone, twarz odwrócona."],
        wallLook: ["> Na ścianie wykuto wyspę. Cztery wieże: przy Polnej drodze, w Górach, nad morzem na Urwisku - i czwarta na przylądku, tam, gdzie dziś stoi latarnia.",
            "> Między wieżami linie, a na nich ptaki: kruki. Z każdej wieży linia biegnie do kręgu na łące.", "> Latarnia stoi na strażnicy zakonu. Bazyli by się zdziwił. Albo i nie."],
        chestFeather: ["> (W skrzyni, owinięte w lnianą chustę, leży długie białe pióro w srebrnej oprawce.)", "> Pióro Skrzydlatej Straży. „Kto wejdzie, niech nie bierze niczego prócz tego, co mu zostawiono.” Chyba zostawiono je mnie."],
        chestGold: ["> (W skrzyni sakiewka ze starymi monetami z krukiem. I kartka: „Na drogę”.)"],
        chestEmpty: "Skrzynia pusta",
        // the eagle's places
        downAsk: kind => (kind === "lina" ? "Strzęp liny przywiązany do pnia. Schodzi w dół przez gąszcz." : "Stare kołki wbite w skałę i strzęp liny. Prowadzą w dół."),
        downGo: "Zejdź na dół.", downStay: "Zostań.",
        downWarn: "Na górę nie wejdziesz bez orła",
        downThink: ["> (Kołki trzeszczą, ale trzymają. Z powrotem tędy nie wejdę.)"],
        stashLook: ["> (Skrzynia przykryta gałęziami. Na wieku wypalony znak: kotwica i oko.)"],
        stashTaken: "Skrzynia pusta. Ktoś ją już opróżnił - ty",
        stashLoot: "Skrzynia przemytników",
        nestLook: ["> Stare gniazdo z gałęzi grubych jak ramię. Puste od lat."],
        nestFeathers: n => "Pióra ×" + n,
        nestEmpty: "W gnieździe pusto. Pióra przybędą",
        nestOrderLook: ["> Gniazdo zakonnych orłów. Gałęzie splecione z drutem - ktoś je kiedyś naprawiał."],
        nestOrderFeather: ["> (Między gałęziami, wbite w splot, tkwi pióro w srebrnej oprawce.)", "> Pióro Skrzydlatej Straży. Jeździec zostawił je tu dla następnego."],
        herbLook: "Roślina w szczelinie skały",
        herbPicked: name => name + " zerwana",
        herbGone: "Zerwane. Odrośnie za kilka dni",
        ravenStoneLook: ["> Kamień z wyrytym krukiem, zwrócony na wschód, ku Kręgowi. Kruczarze znaczyli tak swoje drogi.", "> Tę drogę znaczył ktoś, kto latał."],
        campLook: ["> Stare palenisko w kręgu kamieni. Popiół dawno zbity deszczem. Obok kość i strzęp płótna."],
        diveHerb: "Warzucha nadmorska",
        diveYoung: "Tylko dorosły orzeł zanurkuje tak nisko",
        diveTired: "Orzeł jest zbyt zmęczony",
        diveGone: "Tu już zerwane. Odrośnie",
        // the perches
        perchLook: n => ["> Orla grzęda Straży. Kamienny słup, żelazna poprzeczka wytarta pazurami, na górze misa na deszczówkę."].concat(n === 1 ? ["> Pod słupem w trawie leży zardzewiałe strzemię."] : n === 2 ? ["> Pod słupem zbutwiałe siodło. Za małe dla konia, za szerokie dla człowieka."] : ["> W szczelinie słupa tkwią pióra, białe jak sól."]),
        perchWater: "W misie deszczówka. To woda orłów - nie twoja",
        perchDry: "Misa sucha",
        perchEagle: name => name + " siada na grzędzie Straży",
        stirrupGot: "Strzemię jeźdźca",
        traceTaken: "Tu leżało strzemię. Masz je w torbie",
        featherTaken: "Pióra już zebrane",
        saddleLook: ["> Siodło z dwoma pasami na piersi, nie na brzuchu. Orle siodło. Skóra rozpada się w palcach."],
        // the cemetery and the gallows
        graveLook: "Zwykły grób. Imienia nie da się już odczytać",
        graveRavenAsk: "Kamień z krukiem, zarośnięty mchem i błotem.", graveClean: "Oczyść kamień.", graveLeave: "Zostaw.",
        graveHit: (n, m) => "Czyścisz kamień " + n + "/" + m,
        graveNames: {
            1: { name: "Brat Bogusław", line: "„Brat Bogusław, strażnik wieży przy drodze. Patrzył czterdzieści lat.”" },
            2: { name: "Brat Żelisław", line: "„Brat Żelisław, kronikarz. Pióro po nim przejął uczeń.”" },
            3: { name: "Brat Wit", line: "„Brat Wit, strażnik bramy, roku sto szóstego.” - roku upadku." }
        },
        graveRead: k => ["> " + k.line],
        graveAll: ["> Trzy imiona braci zakonu. Przepisuję je na kartkę - Ambroży będzie wiedział, co z nimi zrobić."],
        lampLook: "Lampka na słupie. Grabarz zapala ją o zmierzchu",
        gallowsLook: ["> Szubienica Lorda. Belka poczerniała od deszczu, pusty sznur kołysze się na wietrze.", "> Tu dwór wiesza kłusowników i przemytników. Przy drodze, żeby każdy widział."],
        gallowsNight: ["> (Belka skrzypi, choć nie ma wiatru.)"],
        // the grove
        groveFirst: ["> (Cisza. Nawet ptaki tu nie śpiewają.)", "> Gaj Milczących. Siedem białych kamieni w kręgu."],
        groveNotYet: "Milczący przychodzą tu o zmierzchu",
        groveStart: ["> (Staję w środku kręgu. Nie mówię nic.)"],
        groveBroken: "Milczący odwracają głowy.",
        groveDone: ["> (Godzina minęła. Przy jednym z kamieni leży biały kamyk, którego wcześniej tam nie było.)", "> Wiedzieli za dużo, więc przestali mówić. Teraz rozumiem trochę, dlaczego."],
        groveDoneSub: "Spokój Milczących  ·  6 h",
        groveTodayBroken: "Dziś już złamałeś ciszę. Jutro o zmierzchu",
        groveStone: "Biały kamień milczenia. Zimny i gładki",
        groveWait: m => "Cisza w gaju  ·  zostało " + m + " min",
        // the ravens
        ravenAsk: "Kruki na skale przyglądają ci się z ukosa.", ravenFeed: name => "Rzuć im: " + name + ".", ravenLeave: "Zostaw je.",
        ravenFedToday: "Dziś już je karmiłeś",
        ravenNoFood: "Kruki chcą ryby albo mięsa",
        ravenGift: "Kruk zostawia coś błyszczącego",
        // the wreck
        wreckLook: n => (n === 1 ? "Deski kadłuba z żelaznymi okuciami, do połowy w piasku." : n === 2 ? "Z piasku wystaje rzeźbiona deska." : "Róg małej skrzyni okutej żelazem."),
        wreckAsk: "Odkopać łopatą?", wreckDig: "Odkop.", wreckLeave: "Zostaw.",
        wreckHit: (n, m) => "Odkopujesz " + n + "/" + m,
        wreckHigh: "Przypływ. Piasek pod wodą",
        wreckGot: n => (n === 1 ? ["> (Wyrywam z desek dwa okucia. Sól zjadła je do połowy, ale żelazo to żelazo.)"] :
            n === 2 ? ["> (Deska z dziobu okrętu. Białe oko i litery: BIAŁA ŹRENICA - STRAŻ PEWNOŚCI.)", "> Ktoś w tawernie by ją poznał. Ktoś, kto rysuje portrety za piwo."] :
            ["> (Skrzynka kapitańska. W środku sakiewka z monetami i słój smoły, szczelnie zalakowany.)"]),
        wreckShown: "Po sztormie piasek odsłonił coś na płyciźnie",
        // the gravedigger
        digger: "Hieronim"
    };

    // ------------------------------------------------------------------ the resident: Hieronim the gravedigger (TownLife 2930, Map008)
    // 6-18 at the cemetery (the graves, the gate, digging), 18 he lights the lamp and goes home - away for the night (no interior).
    const cemeteryRain = () => !!(window.Zakon && Zakon.raining && Zakon.raining());
    const RESIDENT = {
        key: "grabarz", id: 2930, name: "Hieronim", title: "grabarz", sheet: "$Npc_Grabarz", map: 8, speed: 2,
        away: ["grabarz_chata"],
        plan: [[0, "inside", "grabarz_chata"],
               [6, "work", "grabarz_groby"],
               [8.5, "work", "grabarz_kopie"],
               [10, "stand", "grabarz_furtka"],
               [11, "work", "grabarz_groby_2"],
               [12.5, "stand", "grabarz_przerwa"],
               [13.5, "work", "grabarz_kopie"],
               [15.5, "wander", "grabarz_groby"],
               [17.5, "stand", "grabarz_lampa"],
               [18, "inside", "grabarz_chata"]],
        barks: {
            work: ["(Hieronim grabi liście z grobu.)", "Ziemia tu twarda jak serce lichwiarza.", "Tych z krukiem nie ruszam. Mój ojciec też nie ruszał.",
                "(Hieronim prostuje plecy i stęka.)", "Każdemu po równo: dwa łokcie wszerz, cztery wzdłuż."],
            stand: ["Spokojnie tu. Najspokojniej w całym miasteczku.", "Kto idzie? A, ty. Żywy, to dobrze."],
            wander: ["(Hieronim poprawia krzyż, który się przechylił.)", "Mech znowu wlazł na kamienie."],
            rain: ["Deszcz. Ziemia miękka - dobrze się kopie, źle się chodzi."],
            night: ["Po zmroku na cmentarz nie chodź. Nie przez duchy. Przez straż Lorda."]
        },
        talk: {
            morning: ["Rano się kopie, póki ziemia chłodna. Po południu już tylko się grabi.", "Hieronim jestem. Grabarz. Mój ojciec był grabarzem i jego ojciec też. Kopiemy dla wszystkich, nikt nie kopie dla nas."],
            day: ["Te trzy kamienie z krukiem? Starsze niż miasteczko. Ojciec mówił: to bracia z zamku, nie ruszaj, nie zamiataj, nie pytaj.",
                "Szubienica przy wschodniej drodze to nie moja robota. Ja tylko potem kopię. Pod murem, bez krzyża.",
                "Ludzie myślą, że grabarz to smutna robota. A ja ci powiem: umarli nie kłamią, nie piją na kredyt i nie kłócą się o miedzę."],
            evening: ["Zapalę lampkę i do domu. Lampka musi się palić - tak było zawsze.", "Kiedyś przy tych z krukiem ktoś zostawiał kwiaty. Od lat już nikt."],
            night: ["Czego tu szukasz po nocy? Idź spać."],
            rain: ["W deszcz lepiej nie kopać - woda zalewa dół szybciej, niż wyrzucisz ziemię."]
        }
    };
    (window.TownLifeExtra = window.TownLifeExtra || []).push(RESIDENT);
    // his places on Map008 (TownLife reads only TownLifeData.SPOTS on its own map - not SPOTS_BY_MAP[8])
    const SPOTS_TOWN = {
        grabarz_groby: [7, 25, 8], grabarz_groby_2: [10, 25, 8], grabarz_kopie: [10, 27, 8], grabarz_furtka: [9, 29, 2],
        grabarz_przerwa: [11, 25, 4], grabarz_lampa: [9, 24, 8], grabarz_chata: [20, 13, 2]
    };
    const TLD = window.TownLifeData;
    if (TLD && TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_TOWN)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
    // the talk bust (tools/busts/make_grabarz.py; SpeechBubbles checks the file at the database's load)
    const SB = window.SpeechBubbles;
    if (SB && SB.BUSTS) SB.BUSTS["$Npc_Grabarz:0"] = "Grabarz_Bust";

    // ------------------------------------------------------------------ the quests (TownQuests packs; icon = the item's id)
    const K67 = {
        id: "K67", kind: "K", title: "Trzy kruki przy drogach", giver: "dzwonnik", icon: ITEM.klucz,
        where: "kapliczki z krukiem: Polna droga, Leśna droga, Łąka", when: "od dnia 4, za dnia",
        desc: "Ambroży mówi, że przy drogach stoją kapliczki z krukiem i że jego mistrz kazał przy każdej się pomodlić, „to zrozumiesz, po co je stawiano”.",
        offer: {
            cond: { hours: [7, 20], day: 4 },
            say: ["Przy drogach za miastem stoją kapliczki z krukiem. Trzy. Mój mistrz chodził od jednej do drugiej co wiosnę.",
                "Mówił: pomódl się przy każdej, a zrozumiesz, po co je stawiano. Ja już nie mam kolan na takie drogi."],
            yes: "Obejdę je za ciebie.", no: "Może kiedyś.",
            accept: ["Przy Polnej drodze, przy Leśnej i na Łące, przy drodze w góry. Kruk pod daszkiem - nie pomylisz."],
            decline: ["Kapliczki poczekają. Czekają od dawna."]
        },
        steps: [
            { type: "custom", check: "k67Modl", vars: "k67Vars", text: "Pomódl się przy trzech kapliczkach z krukiem: przy Polnej drodze, przy Leśnej drodze i na Łące ({n}/3)." },
            { type: "talk", to: "dzwonnik", hours: [6, 21], text: "Wróć do Ambrożego i powiedz mu, że kruki przy drogach są obejrzane.",
              say: ["Wszystkie trzy? Mój mistrz mówił, że kruk przy drodze znaczył: w pobliżu jest woda albo schronienie zakonu.",
                  "Wody już tam nie ma, przynajmniej nie na wierzchu. Ale kto szuka, ten może jeszcze znaleźć. Uważnie, przy kamieniach i w mchu."] }
        ],
        reward: { xp: 80, flag: "zakKapliczki", note: ["Trzy kruki przy drogach", "Pomodliłem się przy trzech kapliczkach z krukiem. Ambroży mówi, że kruk przy drodze znaczył: w pobliżu jest woda albo schronienie zakonu. Wody nie widać na wierzchu - ale może jeszcze gdzieś bije, w mchu, pod kamieniem, w gąszczu."] }
    };
    const K68 = {
        id: "K68", kind: "K", title: "Zapiski strażnic", giver: "pustelnik", icon: ITEM.klucz,
        where: "kopce z krukiem i fundamenty strażnic → pustelnia na klifie", when: "po pierwszej znalezionej karcie Zapisków",
        desc: "Brat Kleofas rozpoznał kartę ze „Zapisków strażnic” - dziennika braci warty z czterech wież zakonu. Kart było sześć: trzy w kopcach z krukiem, trzy w fundamentach strażnic.",
        offer: {
            cond: { hours: [7, 19], fn: "k68Pora" },
            say: ["Zapiski strażnic! Nie kroniki - dziennik warty. Bracia z wież pisali je prosto, jak żołnierze, bez szyfru.",
                "Było ich sześć kart. Trzy schowali w kopcach z krukiem przy drogach, trzy pod płytami swoich wież. Mój mistrz szukał ich całe życie.",
                "Przynieś mi je wszystkie. Przeczytam ci każdą - po jednej, bo oczy mam już stare."],
            yes: "Przyniosę wszystkie sześć.", no: "Nie teraz.",
            accept: ["Kopce stoją przy starych drogach: na Omszałej łące, na Skraju lasu i tu, nad klifem. Wieże... z wież zostały fundamenty. Szukaj płyt z krukiem."],
            decline: ["Karty leżały trzysta lat. Poleżą jeszcze."]
        },
        steps: [
            { type: "custom", check: "k68Karty", vars: "k68Vars", text: "Znajdź wszystkie Zapiski strażnic: trzy w kopcach z krukiem (Omszała łąka, Skraj lasu, nad klifem pustelni) i trzy pod płytami strażnic (Polna droga, Góry, Urwisko) ({n}/6)." },
            { type: "custom", check: "k68Czytaj", vars: "k68Vars", text: "Daj bratu Kleofasowi przeczytać wszystkie Zapiski strażnic (przeczytane {r}/6; za dnia, w pustelni)." }
        ],
        reward: { xp: 150, flag: "zakZapiski", note: ["Zapiski strażnic", "Sześć kart dziennika braci warty. Cztery wieże pilnowały wyspy, kruki niosły listy, a krąg kamieni na łące był miejscem przysięgi: „patrzę i nie pytam”. W kręgu zakopano kamienny klucz do komory pod płytą z krukiem - tam, gdzie pada cień najwyższego kamienia, Strażnika, gdy słońce przejdzie cztery części swej drogi z pięciu."] }
    };
    const D36 = {
        id: "D36", kind: "D", title: "Cień Strażnika", giver: null, icon: ITEM.klucz, autoStart: "d36Start",
        where: "krąg menhirów (Łąka menhirów) → komora pod menhirami", when: "po Zapiskach strażnic albo przy płycie w kręgu",
        desc: "W kręgu menhirów na łące, w cieniu najwyższego kamienia, zakopano kamienny klucz. Pod płytą z krukiem jest komora pierwszego strażnika warty.",
        steps: [
            { type: "custom", check: "d36Zapiski", vars: "d36Vars", text: "Dowiedz się, o której godzinie Strażnik „wskazuje ręką”: przeczytaj z Kleofasem Zapiski strażnic o godzinie i o kluczu ({n}/2) - albo patrz na cień najwyższego kamienia." },
            { type: "custom", check: "d36Kop", text: "Gdy słońce przejdzie cztery części swej drogi z pięciu, kop łopatą tam, gdzie padnie cień Strażnika (krąg menhirów, w ubitej ziemi). Nie w deszcz." },
            { type: "custom", check: "d36Komora", text: "Włóż Klucz Strażnika w płytę z krukiem w środku kręgu i zejdź do komory. Weź pochodnię." },
            { type: "custom", check: "d36Mapa", text: "Obejrzyj ścianę z wykutymi wieżami w komorze pod menhirami." }
        ],
        reward: { xp: 200, flag: "zakKomora", note: ["Komora pod menhirami", "Pod kręgiem menhirów leży pierwszy strażnik warty. Na ścianie jego komory wykuto cztery wieże zakonu: przy Polnej drodze, w Górach, nad morzem na Urwisku - i czwartą na przylądku, gdzie dziś stoi latarnia Bazylego. Z każdej linia biegnie do kręgu. Kruki niosły listy między wieżami, a krąg był sercem warty."] }
    };
    const K69 = {
        id: "K69", kind: "K", title: "Grzędy Straży", giver: "latarnik", icon: ITEM.strzemie, autoStart: "k69Start",
        where: "Orla Grań → pustelnia na klifie", when: "po „Jaju z grani” (D29)",
        desc: "Na Orlej Grani stoją ruiny kamiennych grzęd Skrzydlatej Straży. Bazyli widział je z laterny: „trzy słupy jak palce”.",
        offer: {
            cond: { hours: [14, 22], flags: ["orzelJajo"] },
            say: ["Z laterny widać grań. Kiedy mgła opada, stoją tam trzy słupy jak palce. Grzędy - tak mówił mój poprzednik.",
                "Skrzydlata Straż sadzała na nich orły. Byłeś tam, jajo przyniosłeś. Obejrzyj te słupy porządnie. I przynieś Kleofasowi, co znajdziesz - on to zapisze."],
            yes: "Obejrzę je.", no: "Innym razem.",
            accept: ["Trzy grzędy: północna, środkowa i ta nad urwiskiem. Uważaj na krawędź."],
            decline: ["Słupy stały trzysta lat. Postoją."]
        },
        steps: [
            { type: "custom", check: "k69Grzedy", vars: "k69Vars", text: "Obejrzyj trzy grzędy Skrzydlatej Straży na Orlej Grani ({n}/3)." },
            { type: "bring", to: "pustelnik", need: [[ITEM.strzemie, 1]], hours: [7, 19], text: "Zanieś bratu Kleofasowi strzemię spod grzędy.",
              hero: ["> Bracie, spod grzędy na Orlej Grani. Za lekkie na konia."],
              done: ["(Kleofas obraca strzemię w palcach.) Orle siodło. Jeździec siedział za skrzydłami, nogi w strzemionach pod szyją ptaka.",
                  "W Księdze gniazd jest jedno zdanie, które zawsze mi się podobało: „jeźdźca nosił tylko orzeł, który sam go wybrał”. Konia się kupuje. Orła - nie."] }
        ],
        reward: { xp: 120, flag: "zakGrzedy", items: [[ITEM.strzemie, 1]], note: ["Grzędy Straży", "Trzy grzędy Skrzydlatej Straży na Orlej Grani: kamienne słupy z żelazną poprzeczką i misą na deszczówkę. Pod nimi strzemię i orle siodło. Kleofas czytał z Księgi gniazd: „jeźdźca nosił tylko orzeł, który sam go wybrał”."] }
    };
    const K70 = {
        id: "K70", kind: "K", title: "Kawałki wraku", giver: "rozbitek", icon: ITEM.okucie, autoStart: "k70Start",
        where: "wrak na mieliźnie (płycizny, w odpływie)", when: "po sztormie, gdy piasek odsłoni pierwszy kawałek",
        desc: "Sztormy wymywają z płycizn przy wraku „Białej Źrenicy” kolejne kawałki okrętu. Widać je tylko w odpływie.",
        offer: {
            cond: { fn: "k70Pora" },
            say: ["(Eryk odkłada węgiel do rysowania i mówi ciszej.) Słyszałem rybaków. Po sztormie z piasku przy mieliźnie coś wystaje.",
                "Gdyby ktoś to odkopał... Nie chcę niczego dla siebie. Chcę tylko wiedzieć, co z niej zostało."],
            yes: "Odkopię, co się da.", no: "Nie moja sprawa.",
            accept: ["W odpływie. Tylko w odpływie - przypływ tam przychodzi szybciej, niż myślisz."],
            decline: ["Rozumiem. Morze i tak wszystko zabierze."]
        },
        steps: [
            { type: "custom", check: "k70Kawalki", vars: "k70Vars", text: "Odkop łopatą kawałki wraku na płyciznach przy mieliźnie - w odpływie, po każdym sztormie piasek odsłania kolejny ({n}/3)." }
        ],
        reward: { xp: 120, flag: "zakWrak", note: ["Kawałki wraku", "Z płycizn przy „Białej Źrenicy” odkopałem okucia kadłuba, deskę z nazwą okrętu i skrzynkę kapitańską. Deska mówi wprost: BIAŁA ŹRENICA - STRAŻ PEWNOŚCI. Kto zna ten okręt, zna Czarne Oczy."] }
    };
    const D37 = {
        id: "D37", kind: "D", title: "Groby z krukiem", giver: "dzwonnik", icon: ITEM.kamien,
        where: "stary cmentarz za miasteczkiem → dzwonnica", when: "od dnia 6, za dnia",
        desc: "Na starym cmentarzu za miasteczkiem są trzy kamienie z krukiem. Ambroży chce znać imiona, które pod mchem zarosły.",
        offer: {
            cond: { hours: [7, 20], day: 6 },
            say: ["Na starym cmentarzu, za miasteczkiem, leżą bracia z zamku. Trzy kamienie z krukiem. Mech je zjadł.",
                "Mój mistrz znał ich imiona na pamięć. Ja zapomniałem. Wstyd mi. Oczyść te kamienie i przepisz, co na nich stoi."],
            yes: "Oczyszczę je.", no: "Nie dziś.",
            accept: ["Grabarz Hieronim cię wpuści. On ich nie rusza - jego ojciec też nie ruszał. Ale tobie pozwoli."],
            decline: ["Mech poczeka. Zawsze czeka."]
        },
        steps: [
            { type: "custom", check: "d37Groby", vars: "d37Vars", text: "Oczyść trzy kamienie z krukiem na starym cmentarzu i odczytaj imiona ({n}/3)." },
            { type: "bring", to: "dzwonnik", need: [["v:zak_imiona", 1]], hours: [6, 21], text: "Zanieś Ambrożemu imiona z grobów z krukiem.",
              hero: ["> Bogusław, strażnik wieży. Żelisław, kronikarz. I Wit, strażnik bramy - roku sto szóstego."],
              done: ["(Ambroży powtarza imiona bezgłośnie.) Wit... Pamiętam. Mistrz dzwonił za nich co roku. Cztery i jeden.",
                  "Cztery straże i ten piąty, który niesie słowo. Tak się dzwoniło na pogrzeb brata. Dziś zadzwonię znowu. Pierwszy raz od czterdziestu lat."] }
        ],
        reward: { xp: 120, opinion: 3, flag: "zakGroby", note: ["Groby z krukiem", "Na starym cmentarzu leżą bracia zakonu: Bogusław, strażnik wieży przy drodze; Żelisław, kronikarz; Wit, strażnik bramy, który zginął w roku upadku. Ambroży mówi, że za braci dzwoniło się „cztery i jeden”: cztery straże i piąty, który niesie słowo."] }
    };
    const D38 = {
        id: "D38", kind: "D", title: "Godzina milczenia", giver: null, icon: ITEM.kamien, autoStart: "d38Start",
        where: "gaj Milczących (za Osadą Milczących)", when: "Akt II, o zmierzchu",
        desc: "Milczący przychodzą do gaju o zmierzchu i stoją godzinę bez słowa w kręgu białych kamieni. Kto wytrzyma z nimi, coś zrozumie.",
        steps: [
            { type: "custom", check: "d38Godzina", text: "O zmierzchu stań w środku kręgu białych kamieni i wytrzymaj godzinę bez ruchu poza krąg, bez biegu, z bronią schowaną, bez rozmowy." }
        ],
        reward: { xp: 150, flag: "zakGaj", note: ["Godzina milczenia", "Stałem godzinę w gaju Milczących, w kręgu białych kamieni. Milczący odeszli od ludzi, bo wiedzieli za dużo: dotknęli prawdy, której nie da się nosić i mówić naraz. Przy kamieniu został dla mnie biały kamyk."] }
    };
    const REMARKS = [
        { id: "zakGrabarzSoltys", who: "soltys", flag: "zakGroby", lines: ["Ambroży dzwonił wczoraj „cztery i jeden”. Pół miasta pytało, kto umarł. A on tylko: „Bracia”. Stary dziwak."] },
        { id: "zakGrobyKowal", who: "kowal", flag: "zakGroby", lines: ["Słyszałem ten dzwon. Mój dziad mówił, że tak dzwoniono, kiedy chowano kogoś z zamku. Myślałem, że to bajka."] },
        { id: "zakKomoraOzzy", who: "dzwonnik", flag: "zakKomora", lines: ["Pierwszy strażnik warty... Mistrz mówił, że on wciąż patrzy. Że dlatego krąg stoi. Wierzę mu, choć już nie wiem w co."] },
        { id: "zakWrakRozbitek", who: "rozbitek", flag: "zakWrak", lines: ["(Eryk patrzy na swoje dłonie.) Deska z nazwą. Myślałem, że morze ją zabrało. Morze nie bierze tego, co ma wrócić."] },
        { id: "zakGajSoltys", who: "soltys", flag: "zakGaj", lines: ["Byłeś u Milczących w gaju? I wróciłeś taki... cichy. Nie podoba mi się to."] }
    ];
    const GOSSIP = {
        dzwonnik: ["Kapliczki z krukiem przy drogach? Mój mistrz mówił, że kruk znaczył wodę albo schronienie. Dziś już ani jednego, ani drugiego."],
        grabarz: ["Tych trzech z krukiem nikt nie odwiedza. Ja tylko kosę obok przeciągnę."]
    };
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Zakon", quests: [K67, K68, D36, K69, K70, D37, D38], vitems: VITEMS, remarks: REMARKS, gossip: GOSSIP });

    // (2026-10-22, integration) the lines of the epilogue after the Heart (Underground.js asks Zakon.epilogue): one or two by what the hero did
    const EPILOG = {
        chamber: "Pod płytą z krukiem na Łące menhirów śpi pierwszy strażnik warty. Ściana z czterema wieżami pamięta, gdzie stały - teraz pamiętasz i ty.",
        grove: "W gaju Milczących siedem białych kamieni stoi jak stało. O zmierzchu ktoś tam zawsze milczy przez godzinę - czasem ty."
    };
    window.ZakonData = { EPILOG, VERSION, PKG: "D", OWNER: "Zakon", IDS, RESIDENTS: P ? P.residents : [2930, 2939], ITEMS: P ? P.items : [225, 239],
        ICONS: P ? P.icons : [512, 527], SWITCHES: P ? P.switches : [27, 28],
        ITEM, ICON, SW, MAPS, RAVEN_FOOD, IMG, TOWERS, SLAB_AT, SHRINES, CAIRNS, RING, CHAMBER, EAGLE, REGROW, CLIFF, DIVE, PERCHES, PERCH_BOND, PERCH_NEAR,
        CEMETERY, GALLOWS, GROVE, RAVENS, RAVEN, WRECK, WORK, SPOTS, DISC, CARDS, VITEMS, READ_HOURS, READ_TIME, READ_XP, TX, RESIDENT, SPOTS_TOWN,
        QUESTS: { K67, K68, D36, K69, K70, D37, D38 }, cemeteryRain, ready: true };
})();
