//=============================================================================
// Underground_Data.js
//=============================================================================
// Load order: right before Underground.js (it reads window.Underground_Data when it loads; Underground.js loads this file
// itself when it is not on the plugin list). Data only: map ids, switches, the bands, loot tables and every Polish text of
// the underground. docs/PODZIEMIA.md describes the whole system.

/*:
 * @target MZ
 * @plugindesc Dane podziemi (Underground.js): mapy, przełączniki, pasma pięter 1-100, łupy, bossowie, zamki Serca, Lord przy Sercu, zakończenia jako sceny i teksty (po polsku). Musi stać tuż nad Underground.js. v2.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Underground_Data.js - dane podziemi
 * ============================================================================
 * Same dane, bez działania: numery map i przełączników, pasma pięter (z jakiej
 * mapy kawałków się składają, ile mają pokoi, z jakich ścian i podłóg są
 * korytarze), piętra zrobione ręcznie (co 10.), winda, bossowie, zamki
 * Komnaty Serca, zakończenia, co leży w skrzyniach, zapiski zakonu, prawdy
 * Warstwy Prawdy, szepty i wszystkie napisy. Zmieniasz tu - zmienia się w grze.
 * Opis całości: docs/PODZIEMIA.md.
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("podziemia");   // (the words of this file: js/teksty/podziemia.txt, sceny.*)
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));

    // ------------------------------------------------------------------ maps and switches
    // Band 1: a generated floor N lives on map FLOOR_BASE + N (131..139); the shells there are empty - Underground.js fills them as
    // they load. Floors 11-99 (bands 2-5) have no map file of their own: floor N is the map id VIRTUAL_BASE + N (1011..1099), which
    // loads the one shared shell (Map145) and is made from its band's chunks the same way. Every 10th floor is made by hand.
    const MAPS = {
        cellar: 9,          // Piwnica Tawerny - the grate down (the gate)
        ruins: 10,          // Ruiny Zamku - the hall under the cellar: the stairs to floor 1, the lift
        heart: 11,          // Komnata Serca - floor 100 (rebuilt on tileset 10)
        floorBase: 130,     // band 1: floor N = map 130 + N
        chunks1: 130,       // Podziemia: kawałki (pasmo 1) - the room chunks of band 1 (never visited in play)
        virtualBase: 1000,  // bands 2-5: floor N = map 1000 + N (no file: it loads the shell)
        shell: 145          // Podziemia: piętra 11-99 (skorupa) - the one file every floor 11-99 loads
    };
    const SWITCHES = {
        gate: 11,           // Podziemia_Zejscie: the old grate in the tavern's cellar is open (W4 "Krew kasztelana")
        lift: 12,           // Podziemia_Winda: the lift works (a windlass on floor 10 or deeper was turned) - the cage in Ruiny Zamku
        song: 13,           // Podziemia_Skrot: the song's shortcut ("trzeci schodek pusty", W3) is known
        gate10: 14          // Podziemia_Brama10: the guardian on floor 10 let the hero through (the tenth gate is open)
    };
    const IDS = { creatures: [860, 899] };   // Tawerna.inject range kept for the creatures (stage 4 of docs/WALKA.md)

    // where one arrives on the hand-made maps of band 1 (x, y, direction)
    // (tools/underground/places.py builds these maps with the same numbers - keep them in step)
    const SPOTS = {
        cellarGate: [15, 3, 8],     // Map009: in front of the grate (the grate itself is at 15,2)
        ruinsFromCellar: [3, 7, 2], // Map010: below the narrow stairs from the cellar (3,6)
        ruinsStairs: [14, 7, 2],    // Map010: in front of the great stairs down to floor 1 (13-15,6)
        ruinsLift: [24, 8, 2],      // Map010: in front of the lift (24,7)
        floor10Arrive: [5, 13, 2],  // Map140: below the stairs up to floor 9 (5,12); the song's shortcut comes out here too
        floor10Lift: [21, 5, 2]     // Map140: in front of the lift's cage (21,4)
    };

    // ------------------------------------------------------------------ the hand-made floors (every 10th)
    // up: below its stairs up (one comes down onto it), down: in front of its stairs down (one comes up onto it), lift: in front of
    // its lift cage (null: no lift). boss: the creature kind of its boss (<Stwor:boss_NN> on the map; the stairs down wait for
    // Underground.bossDefeated(NN) - only while a maker for that kind is registered). tools/underground/places*.py builds the maps
    // with these numbers; build.py checks them against this table.
    const FLOORS = {
        10: { map: 140, up: [5, 13, 2], down: [16, 3, 2], lift: [21, 5, 2] },
        20: { map: 146, up: [4, 6, 2], down: [32, 6, 2], lift: [7, 19, 2], boss: "boss_20" },
        30: { map: 147, up: [4, 6, 2], down: [34, 6, 2], lift: [34, 20, 2], boss: "boss_30" },
        40: { map: 148, up: [4, 6, 2], down: [33, 6, 2], lift: [33, 20, 2], boss: "boss_40" },
        50: { map: 149, up: [4, 6, 2], down: [22, 6, 2], lift: [6, 14, 2], boss: "boss_50" },
        60: { map: 150, up: [4, 6, 2], down: [17, 4, 2], lift: [29, 17, 2], boss: "boss_60" },
        70: { map: 151, up: [4, 6, 2], down: [34, 17, 2], lift: [6, 18, 2], boss: "boss_70" },
        80: { map: 152, up: [4, 6, 2], down: [28, 6, 2], lift: [5, 18, 2], boss: "boss_80" },
        90: { map: 153, up: [4, 6, 2], down: [31, 6, 2], lift: [6, 18, 2], boss: "boss_90" },
        100: { map: 11, up: [4, 6, 2], down: null, lift: null }
    };
    Watki.scal(FLOORS, "podziemia", "pietra");   // (its words: js/teksty/podziemia.txt, pietra)
    // the lift's stops (0 = Ruiny Zamku): a cage on every hand-made floor 10-90; a stop works once its windlass was turned
    const LIFT = { stops: [10, 20, 30, 40, 50, 60, 70, 80, 90] };

    // ------------------------------------------------------------------ the maze of a generated floor (2026-10-23, Underground.js planMaze)
    // As big as Kruczy Jar (grandpa's plot, Map003: 80x60). The junctions of its lattice: a 2x2 floor at (x0 + px*k, y0 + py*w) -
    // px 4 (2 floor + 2 wall), py 5 (2 floor + a wall face two rows tall + its top). newest: how often the growing tree grows its
    // newest cell (long winding corridors) rather than a random one (side branches); straight: how often it keeps its way; loops:
    // the extra ways (at least loopMin junctions apart round the tree - no endless turning back); doorLoop: the chance a hall gets
    // one more way in; narrow: the side branches (which end blind) 1 tile wide, the main ways 2; torchMax: the most torches in the
    // corridors of a floor; tries: the plans tried for one floor (a hall fewer after every four). A band may change any of these
    // with its own `maze: {...}`.
    const MAZE = { width: 80, height: 60, x0: 3, y0: 4, px: 4, py: 5, newest: 0.72, straight: 0.35, loops: [4, 6], loopMin: 12, doorLoop: 0.35,
        narrow: true, torchMax: 40, tries: 12 };

    // ------------------------------------------------------------------ the bands of floors
    // rooms: how many halls (chunks) each generated floor has in its maze - a list (floor `from` first) or { min, max } (growing with
    // the depth); deadEnd: what the maze's blind ends hold - loot: the chance of a container (kinds: their weights - kinds of the
    // band's chunks, their pictures taken from there; maxLoot: the most on a floor), guard: a creature's place a few steps back (an
    // ambush; guards: the kinds and weights - the creatures' contract of the band; guardFrom: not above this floor; maxGuards),
    // trap: spikes on the way (x the band's trapOn x 2), whisper / vision (the Truth Layer); a blind end left with nothing gets
    // a lost guard's remains (kosci);
    // corridor: the corridors' floor kind and wall (A4 top / side kinds of the band's tileset); rock: the A4 top kind that fills
    // everything between the rooms; dark: RoomLighting's darkness (0-255); level: Combat's place level of floor `from` (+1 every
    // 2 floors); virtual: floors on map ids VIRTUAL_BASE + N (the shared shell); torch: the corridors' torch (ART key + light);
    // gold: old coins found x this; ambience / bgs: the floor's sound (a bgs plays only on a floor whose rooms have water when
    // bgsWater is set); whispers: the Truth Layer's voices (band 5)
    const BANDS = [
        {
            id: 1, from: 1, to: 10, chunkMap: 130, handmade: { 10: 140 },
            rooms: [4, 4, 5, 5, 5, 6, 6, 6, 6],
            deadEnd: { loot: 0.75, maxLoot: 12, kinds: { kosci: 3, worek: 2, skrzynka: 2, dzban: 2, beczka: 1, monety: 1, skrzynia: 0.4 },
                guard: 0.3, guards: { pajak: 3, szczur: 1 }, guardFrom: 3, maxGuards: 3, trap: 0.25 },
            corridor: { floor: 40, top: 99, side: 107, film: 46, filmChance: 0.1 },
            rock: 99, dark: 215, level: 4,
            torchEvery: [7, 11], torchLit: 0.7, roomTorchLit: 0.85,
            lootFull: 0.6, trapOn: 0.6,
            bgm: "", tileset: 10
        },
        {
            id: 2, from: 11, to: 30, chunkMap: 141, handmade: { 20: 146, 30: 147 }, virtual: true,
            rooms: { min: 5, max: 7 },
            deadEnd: { loot: 0.75, maxLoot: 12, kinds: { kosci: 3, skrzynka: 2, worek: 2, dzban: 2, beczka: 1, skrzynia: 0.4 },
                guard: 0.35, guards: { pajak: 2, zbroja: 2, szczur: 1 }, maxGuards: 4, trap: 0.25 },
            corridor: { floor: 41, side: 123, film: 46, filmChance: 0.12 },
            rock: 115, dark: 222, level: 9,
            torchEvery: [7, 11], torchLit: 0.6, roomTorchLit: 0.8,
            lootFull: 0.6, trapOn: 0.5, gold: 1.3,
            bgm: "", tileset: 12
        },
        {
            id: 3, from: 31, to: 50, chunkMap: 142, handmade: { 40: 148, 50: 149 }, virtual: true,
            rooms: { min: 5, max: 7 },
            deadEnd: { loot: 0.75, maxLoot: 12, kinds: { kosci: 3, grzyby: 3, sakwa: 1, skrzynka: 1, monety: 1 },
                guard: 0.35, guards: { pajak: 3, nietoperz: 1 }, maxGuards: 4, trap: 0.25 },
            corridor: { floor: 17, side: 88, film: 19, filmChance: 0.18 },
            rock: 80, dark: 228, level: 19,
            torchEvery: [9, 13], torchLit: 0.4, roomTorchLit: 0.55,
            lootFull: 0.55, trapOn: 0.35, gold: 1.6,
            bgm: "", tileset: 10, bgsWater: { name: "River", volume: 35, pitch: 80 }
        },
        {
            id: 4, from: 51, to: 75, chunkMap: 143, handmade: { 60: 150, 70: 151 }, virtual: true,
            rooms: { min: 6, max: 7 },
            deadEnd: { loot: 0.7, maxLoot: 12, kinds: { kosci: 3, monety: 2, dzban: 2, relikwiarz: 0.3 },
                guard: 0.4, guards: { zbroja: 2, kamiennik: 2 }, maxGuards: 7, trap: 0.25 },
            corridor: { floor: 26, side: 124, film: 22, filmChance: 0.15 },
            rock: 100, dark: 234, level: 29,
            torchEvery: [9, 14], torchLit: 0.35, roomTorchLit: 0.5,
            lootFull: 0.5, trapOn: 0.55, gold: 2.0,
            bgm: "", tileset: 10, bgs: { name: "Wind1", volume: 18, pitch: 60 }
        },
        {
            id: 5, from: 76, to: 99, chunkMap: 144, handmade: { 80: 152, 90: 153 }, virtual: true,
            rooms: { min: 6, max: 7 },
            deadEnd: { loot: 0.65, maxLoot: 10, kinds: { kosci: 3, dzban: 2, grzyby: 1, relikwiarz: 0.5 },
                guard: 0.4, guards: { upior: 2, cien: 2 }, maxGuards: 7, trap: 0.25, whisper: 0.35, vision: 0.08 },
            corridor: { floor: 35, side: 110, film: 31, filmChance: 0.22 },
            rock: 102, dark: 240, level: 42,
            torchEvery: [8, 12], torchLit: 0.75, roomTorchLit: 0.8, torch: "blue",
            lootFull: 0.45, trapOn: 0.3, gold: 2.4,
            bgm: "", tileset: 10, bgs: { name: "Darkness", volume: 22, pitch: 70 }, whispers: true
        },
        {
            id: 6, from: 100, to: 100, handmade: { 100: 11 },
            dark: 236, level: 54, tileset: 10
        }
    ];
    Watki.scal(BANDS, "podziemia", "pasma");   // (its words: js/teksty/podziemia.txt, pasma)

    // the generated floors' map note (RoomLighting: always dark; Atmosphere: the cave's drips; no weather, no building, no hunting;
    // the minimap on since the maze (2026-10-23): it shows only what the hero has seen on the floor - Underground.js's fog)
    const FLOOR_NOTE = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:%DARK%>\n<DarkNight:%DARK%>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n<Minimap:on>\n<Poziom:%LEVEL%>";

    // ------------------------------------------------------------------ pictures of the generated things
    // [characterName, index, direction, pattern]
    const ART = {
        stairsUp: ["!Fantasy_door5", 0, 2, 0],      // a stone arch with steps going up
        stairsDown: ["!Fantasy_door5", 1, 2, 0],    // a stone arch, the steps going down into the dark
        torchLit: ["!Decoration", 3, 4, 0],         // a wall torch, burning (animated)
        torchOut: ["!Decoration", 3, 2, 0],         // the same sconce, burnt out
        blueLit: ["!Decoration2_blue", 3, 4, 0],    // the Truth Layer's sconce: a cold blue flame (still a flame)
        blueOut: ["!Decoration2_blue", 3, 2, 0],
        chest: ["!Dungeon_chest", 6, 2, 0], chestOpen: ["!Dungeon_chest", 6, 8, 0],
        crate: ["!Dungeon_chest", 2, 2, 1], crateOpen: ["!Dungeon_chest", 2, 8, 1],
        barrel: ["!Decoration_static_2", 0, 2, 1], barrelOpen: ["!Decoration_static_2", 3, 2, 0],
        spikes: ["!Fantasy_dungeon_traps", 4, 8, 0]
    };
    // the wall torch's light (every light a flame: warm, flickering); the Truth Layer's blue flame (eerie, but a flame too)
    const TORCH_LIGHT = "<Light:150,255,160,90><LightFlicker:0.13,255,130,55><LightHeight:40>";
    const BLUE_LIGHT = "<Light:130,150,190,245><LightFlicker:0.14,110,150,240><LightHeight:40>";
    // spikes: frames of !Fantasy_dungeon_traps index 4 (a dense bed) by height (direction 8 = only the holes ... 2 = all the way up)
    const SPIKE_STEPS = [8, 6, 4, 2];
    const SPIKES = { period: 150, up: 46, damage: 10, perFloor: 1, poise: 6, knock: 0.35 };

    // ------------------------------------------------------------------ loot
    // what a container holds when it is not empty: a weighted list of { item, n: [min, max] } or { gold: [min, max] }; one pick
    // (two for a chest). Items: 59 Pochodnia, 64 Kamień, 76 Miód, 79 Węgiel drzewny, 80 Deski, 83 Chleb, 85 Ruda żelaza, 86 Żelazo,
    // 88 Gwoździe, 92 Włókno, 93 Lina, 103 Grzyby, 122 Zepsute jedzenie, 127 Strzały, 143 Stal, 152 Opatrunek. Old coins are gold.
    // gone: the thing disappears once taken (mushrooms picked).
    const LOOT = {
        skrzynia: { picks: 2, full: 1, list: [
            { w: 5, gold: [10, 24] }, { w: 3, item: 152, n: [1, 2] }, { w: 3, item: 59, n: [1, 2] }, { w: 2, item: 93, n: [1, 2] },
            { w: 2, item: 86, n: [1, 1] }, { w: 2, item: 127, n: [4, 8] }] },
        skrzynka: { picks: 1, list: [
            { w: 3, item: 80, n: [1, 3] }, { w: 3, item: 88, n: [2, 5] }, { w: 2, item: 93, n: [1, 1] }, { w: 2, item: 59, n: [1, 1] },
            { w: 2, item: 79, n: [1, 3] }, { w: 1, item: 86, n: [1, 1] }, { w: 2, gold: [3, 8] }] },
        beczka: { picks: 1, list: [
            { w: 3, item: 79, n: [2, 4] }, { w: 2, item: 88, n: [2, 4] }, { w: 2, gold: [4, 10] }, { w: 1, item: 122, n: [1, 1] }] },
        worek: { picks: 1, list: [
            { w: 4, item: 92, n: [2, 4] }, { w: 2, item: 122, n: [1, 1] }, { w: 1, gold: [2, 6] }] },
        dzban: { picks: 1, list: [
            { w: 4, gold: [3, 9] }, { w: 2, item: 76, n: [1, 1] }, { w: 1, item: 152, n: [1, 1] }] },
        monety: { picks: 1, full: 1, list: [{ w: 1, gold: [2, 7] }] },
        kosci: { picks: 1, full: 0.8, list: [
            { w: 3, gold: [3, 10] }, { w: 2, item: 152, n: [1, 1] }, { w: 2, item: 59, n: [1, 1] }, { w: 1, item: 127, n: [2, 5] }] },
        // (bands 2-5)
        grzyby: { picks: 1, full: 1, gone: true, list: [{ w: 1, item: 103, n: [1, 3] }] },
        wozek: { picks: 1, full: 0.8, list: [
            { w: 4, item: 85, n: [1, 3] }, { w: 2, item: 79, n: [2, 4] }, { w: 2, item: 64, n: [2, 5] }, { w: 1, item: 86, n: [1, 1] }] },
        sakwa: { picks: 2, full: 0.85, list: [
            { w: 3, item: 93, n: [1, 1] }, { w: 3, item: 59, n: [1, 2] }, { w: 2, item: 83, n: [1, 1] }, { w: 2, item: 152, n: [1, 1] },
            { w: 2, gold: [5, 14] }] },
        relikwiarz: { picks: 2, full: 1, list: [
            { w: 5, gold: [18, 40] }, { w: 2, item: 143, n: [1, 1] }, { w: 2, item: 152, n: [1, 2] }, { w: 1, item: 86, n: [1, 2] }] }
    };
    const LOOT_NAMES = {
    };
    Watki.scal(LOOT_NAMES, "podziemia", "lupy");   // (its words: js/teksty/podziemia.txt, lupy)
    const GOLD_ICON = 313;

    // ------------------------------------------------------------------ the bosses of the hand-made floors (stage 4 of the fighting)
    // The creature plugin registers a maker for "boss_NN" (Underground.registerCreature); while it does, the floor's stairs down
    // wait for Underground.bossDefeated(NN). desc: one line for that plugin's author (the look and the way it fights).
    const BOSSES = {
        20: { desc: "Pusta zbroja przeora w porwanym habicie, z księgą przykutą łańcuchem do pasa - wciąż prowadzi rytuał jednego pytania; bije ciężkim kosturem za każdy krok w kręgu, wolna, ale nie do przewrócenia (zbroja)." },
        30: { desc: "Olbrzymia, łysiejąca szczurzyca z gniazdem z kości i słomy na dnie suchej cysterny; gryzie i taranuje, a gdy traci siły, piszczy i woła roje szczurów (szczur)." },
        40: { desc: "Pajęczyca wielka jak wóz, przędzie sieci nad brodem Milczącej; spuszcza się z sufitu, pluje lepką siecią, która spowalnia, i ciągnie ofiarę w górę (pająk)." },
        50: { desc: "Ogromny topielec oblepiony mułem i korzeniami, wynurza się z podziemnej rzeki przy przekopie kopaczy; chwyta i wciąga ku wodzie, zanurza się, gdy obrywa (topielec)." },
        60: { desc: "Posąg starszy niż zakon, z zatartą twarzą, strzeże Bramy Pierwszych; budzi się, gdy ktoś stanie na progu, wali pięściami w posadzkę (fala odłamków), bardzo wolny i twardy (kamiennik)." },
        70: { desc: "Rdzawy pancerz starszy niż zakon, z wydrapanym herbem i długim mieczem; walczy szybko i czysto, jak ktoś, kto pamięta wojnę, której nikt nie spisał (zbroja)." },
        80: { desc: "Półprzezroczysty cień strażnika, który pytał ponad miarę; mówi głosem bohatera, zadaje mu pytania, a każda bez odpowiedzi to cios; znika i pojawia się za plecami (upiór)." },
        90: { desc: "Cień w habicie zakonu, który przybiera twarz kogoś bliskiego bohaterowi (mieszkańca, któremu najbardziej ufa) - ostatnia straż przed Sercem; rozpada się na trzy cienie (cień)." }
    };
    Watki.scal(BOSSES, "podziemia", "bossowie");   // (its words: js/teksty/podziemia.txt, bossowie)

    // ------------------------------------------------------------------ the three locks of the Heart's chamber (floor 100, W9 ch. 7)
    // key: the castellan's key (W4), signal: the signal "pytanie" (seven strikes, W2), song: the song of the Raven Rocks (W3).
    // Any two open the door (QUESTY.md W9: "wystarczą dowolne dwa"), all three give the better ending.
    const LOCKS = { need: 2, order: ["key", "signal", "song"] };

    // ------------------------------------------------------------------ texts
    const T = {
        floorName: n => fill(T.floorNameN, { n }),
        notice: n => fill(T.noticeN, { n }),
        noticeSub: (band, deepest) => (deepest > 0 ? fill(T.noticeSubDeep, { band, n: deepest }) : band + ""),
        deeper: n => fill(T.deeperN, { n }),
        empty: { },
        found: { },
        nothing: { },
        gold: n => fill(T.goldN, { n }),
        // the grate in the tavern's cellar (Map009) while the way down is closed
        // water down here is never drunk (the drought rule: water is a reward of the town and the tavern, not of the depths)
        // the lift
        liftStop: f => (FLOORS[f] ? fill(T.liftStopNamed, { n: f, name: FLOORS[f].name }) : fill(T.liftStopN, { n: f })),
        liftOn: f => fill(T.liftOnN, { n: f }),
        // the boss of a hand-made floor stands between the hero and the stairs down
        bossBlocks: name => fill(T.bossBlocksN, { name }),
        bossDone: name => fill(T.bossDoneN, { name }),
        // first visits (a line over the hero)
        firstVisit: {
        },
        // the Heart's chamber (floor 100)
        doorShut: n => T.doorShutN.map(l => fill(l, { n })),
        lockNames: { },
        heartChoices: { },
        heartAfter: {
        },
        // after "Zostać strażnikiem": by who stayed (Borgar / Ambroży sit on the bench before the Heart - a word from them)
        heartAfterGuardian: {
        }
    };
    Watki.scal(T, "podziemia", "");   // (its words: js/teksty/podziemia.txt)

    // the four endings (STORY.md, Akt III; QUESTY.md W9 ch. 8). Short on purpose: STORY.md leaves their details open.
    // lines: the epilogue (a plain message window on a black screen); guardian: the lines of who stays (hero / borgar / ambrozy)
    const ENDINGS = {
        zniszczyc: { },
        straznik: { lines: [],
            guardian: {
            } },
        uwolnic: { },
        zapieczetowac: { }
    };
    Watki.scal(ENDINGS, "podziemia", "zakonczenia");   // (its words: js/teksty/podziemia.txt, zakonczenia)
    // the epilogue's extra lines (what the town did with the hero matters: QUESTY.md W9 ch. 8)
    const EPILOGUE = {
        // (2026-10-16) the six island places (docs/miejsca_wyspy/PAKIETY.md): one line each, by what became of them -
        // Underground.world().island (the packages' flags and state). {imie}: the raven's name. latarnia: by the lens (rozbita /
        // sprzedana), the fire gone out (zgasla), else by the ending (the lines of LatarniaData.EPILOG, package C)
        island: {
            pustelnia: {
            },
            latarnia: {
            },
            garnizon: {
            },
            wrak: {
            },
            cysterna: {
            }
        }
    };
    Watki.scal(EPILOGUE, "podziemia", "epilog");   // (its words: js/teksty/podziemia.txt, epilog)

    // ------------------------------------------------------------------ the Lord at the Heart (W7 ch. 7) and the endings' scenes (v2.1)
    // Underground.js plays these as event commands. A scene is a list of steps:
    //   [who, text]      a line - who: an actor key (HEART.ACTORS), "hero", or null (the narration: a plain window over the scene);
    //                    text may be a function (w, e) -> text. A line starting "(" by the hero is a thought.
    //   { fx: name }     the Heart's light: pulse, flare, calm, dim, rise, crack, seal, whispers, montage, dark, light, warm
    //   { walk: [who, x, y, dir] }  a walk there (a path round the walls), the scene waits; { appear: [who, x, y, dir] } shows one there
    //   { leave: who }   walks out through the door and is gone; { face: [who, dir] }; { balloon: [who, n] } (1 ! 2 ? 6 ... 8 idea)
    //   { wait: frames } { se: [name, volume, pitch] } { me: [name, volume] } { shake: [power, speed, frames] } { notice: text }
    //   { caption: text } a big line in the middle of the screen, rising and fading (the scene waits for it)
    //   { card: [lines] }  narration on a black screen (the scene fades out first, in again after)
    // Falsy steps are left out (so a scene can say `w.marek && [...]`). Functions get (w, e, has): w = Underground.world() (the town's
    // quests, Story, W6, Act III), e = the ending { kind, guardian }, has = who came down to the chamber { borgar, ambrozy }.
    const HEART = {
        // the cast: a sheet in the hero's style (no RTP sheets); bust: the talk's bust (empty = SpeechBubbles' own table; "none" =
        // the bubble over the head, as in the scenes up in the town)
        ACTORS: {
            lord: { sheet: "$Npc_Lord" },
            guard: { sheet: "$Npc_Straznik" },
            borgar: { sheet: "$Npc_Borgar", bust: "People3_5" },
            ambrozy: { sheet: "$Npc_Dzwonnik" },
            melia: { sheet: "$Npc_Melia", bust: "People2_8" },
            ozzy: { sheet: "$Npc_Ozzy", bust: "People2_1" },
            grum: { sheet: "$Npc_Grum", bust: "Actor2_5" },
            dziadek: { sheet: "$Npc_Dziadek" },
            kuba: { sheet: "$Npc_Woziwoda" },
            hanka: { sheet: "$Npc_Piekarka" },
            soltys: { sheet: "$Npc_Soltys" },
            tadek: { sheet: "$Npc_Kowal" },
            ludmila: { sheet: "$Npc_Ludmila" },
            ela: { sheet: "$Npc_Ela" },
            marek: { sheet: "$Npc_Marek" },
            rafal: { sheet: "$Npc_Rafal" },
            teodor: { sheet: "$Npc_Kamerdyner" },
            feliks: { sheet: "$Npc_Feliks" }
        },
        // event ids (Tawerna.inject): the chamber's cast (always on Map011, hidden till a scene needs them) and the scenes up above
        IDS: { chamber: { lord: 800, guard: 801, borgar: 802, ambrozy: 803, asker: 804 }, shots: [805, 827] },
        // the chamber (Map011): the hero before the Heart, where the others stand; the door (they come in and go out there); the bench
        SPOTS: { hero: [15, 8, 8], aside: [14, 8, 6], door: [15, 13], lord: [16, 8, 4], guard: [15, 10, 8], borgar: [14, 9, 9], ambrozy: [16, 9, 7],
            bench: [12, 9, 6], asker: [15, 10, 8] },
        // names for the keys other plugins use (Act III's defenders / lost, W6, TownLife)
        NAMES: { },

        // ---- the Lord at the Heart (W7 ch. 7): he comes down after the hero (ally / rival), or not at all (absent)
        LORD: {
            arrive: {
                ally: [
                    [null, ""],
                    { appear: ["lord", 15, 13, 8] }, { walk: ["lord", 16, 8, 4] }, { face: ["hero", 6] },
                    ["lord", ""],
                    ["lord", ""],
                    ["lord", ""],
                    // (2026-10-17) W7 (Dwor.js): the truth of Feliks's letters, or the hero told him every floor (Act II)
                    ["lord", w => (w.lordFlags && w.lordFlags.w7 ? TK.sceny.glowna[0]
                        : w.lordFlags && w.lordFlags.first ? TK.sceny.glowna[1] : "")],
                    ["lord", ""],
                    ["lord", ""]
                ],
                rival: [
                    [null, ""],
                    { appear: ["lord", 15, 13, 8] }, { appear: ["guard", 15, 14, 8] }, { walk: ["lord", 16, 8, 4] }, { walk: ["guard", 15, 10, 8] },
                    { face: ["hero", 6] },
                    ["lord", ""],
                    // (2026-10-17) W7 ch. 6 (Dwor.js): the hero lied that there was nothing down there - and it came out
                    ["lord", w => (w.lordFlags && w.lordFlags.lie ? TK.sceny.glowna[2] : "")],
                    ["lord", w => (w.lord.cold ? TK.sceny.glowna[3]
                        : TK.sceny.glowna[4])],
                    // (2026-10-17) his men met in the ruins (W9 ch. 3, Rywal.js - Underground.world().rival.lordLine)
                    ["lord", w => (w.rival && w.rival.key === "lord" && w.rival.lordLine) || ""],
                    ["lord", ""],
                    ["hero", ""],
                    ["lord", ""],
                    ["lord", ""]
                ]
            },
            opts: { },
            allow: [
                { walk: ["hero", 14, 8, 6] }, { walk: ["lord", 15, 8, 8] },
                ["lord", ""],
                { fx: "flare" }, { wait: 50 },
                [null, ""],
                ["lord", ""],
                ["lord", ""],
                ["lord", ""],
                { fx: "overflow" },
                ["lord", ""],
                [null, ""],
                { walk: ["lord", 16, 9, 8] }, { fx: "calm" }, { walk: ["hero", 15, 8, 8] }, { face: ["lord", 4] }, { face: ["hero", 2] }
            ],
            allowAfter: {
                ally: [["lord", ""],
                    ["lord", ""]],
                rival: [["lord", ""], ["lord", ""]]
            },
            refuse: {
                ally: [["lord", ""],
                    ["lord", ""]],
                rival: [
                    ["lord", ""],
                    { walk: ["guard", 15, 9, 8] }, { fx: "flare" }, { balloon: ["guard", 1] },
                    ["guard", ""],
                    ["guard", ""],
                    { walk: ["guard", 15, 11, 8] },
                    { walk: ["lord", 16, 7, 4] }, { fx: "overflow" }, { walk: ["lord", 16, 9, 4] }, { fx: "calm" },
                    ["lord", ""],
                    ["lord", ""],
                    ["hero", ""],
                    ["lord", ""]
                ]
            },
            askFor: [
                { face: ["hero", 8] },
                ["hero", ""],
                { fx: "flare" }, { wait: 40 },
                [null, ""],
                [null, ""],
                { fx: "overflow" },
                [null, ""],
                { fx: "calm" }, { face: ["hero", 6] },
                ["lord", ""]
            ],
            tellOpts: { },
            told: {
                truth: [["hero", ""],
                    { balloon: ["lord", 6] },
                    ["lord", ""],
                    ["lord", ""]],
                mercy: [["hero", ""],
                    ["lord", ""],
                    [null, ""],
                    ["hero", ""]],
                silent: [["hero", ""],
                    ["lord", ""],
                    ["lord", ""]]
            },
            askForRival: [["lord", ""]],
            leave: [{ leave: "lord" }, { leave: "guard" }, ["hero", ""]]
        },

        // ---- the endings in the chamber: who came down with the hero (W4 Borgar - his saying; W2 Ambroży - the chronicles given)
        COMPANIONS: {
            arrive: [null, ""],
            borgar: ["borgar", ""],
            ambrozy: ["ambrozy", ""]
        },
        CHAMBER: {
            zniszczyc: (w, e, has) => [
                ["hero", TK.sceny.zniszczyc[0]],
                has.borgar && ["borgar", TK.sceny.zniszczyc[1]],
                has.ambrozy && ["ambrozy", TK.sceny.zniszczyc[2]],
                { fx: "whispers" },
                ["hero", TK.sceny.zniszczyc[3]],
                { fx: "crack" }, { fx: "montage" }, { fx: "dark" },
                [null, TK.sceny.zniszczyc[4]],
                has.borgar && ["borgar", TK.sceny.zniszczyc[5]],
                has.ambrozy && ["ambrozy", TK.sceny.zniszczyc[6]]
            ],
            straznik: (w, e, has) => e.guardian === "borgar" ? [
                !has.borgar && { appear: ["borgar", 15, 13, 8] }, !has.borgar && { walk: ["borgar", 14, 9, 9] },
                !has.borgar && ["borgar", TK.sceny.straznik[0]],
                ["borgar", TK.sceny.straznik[1]],
                ["borgar", TK.sceny.straznik[2]],
                ["borgar", TK.sceny.straznik[3]],
                { walk: ["borgar", 12, 9, 6] }, { fx: "warm" },
                ["borgar", TK.sceny.straznik[4]]
            ] : e.guardian === "ambrozy" ? [
                !has.ambrozy && { appear: ["ambrozy", 15, 13, 8] }, !has.ambrozy && { walk: ["ambrozy", 16, 9, 7] },
                ["ambrozy", TK.sceny.straznik[5]],
                ["ambrozy", TK.sceny.straznik[6]],
                ["ambrozy", TK.sceny.straznik[7]],
                { walk: ["ambrozy", 12, 9, 6] }, { fx: "warm" },
                ["ambrozy", TK.sceny.straznik[8]]
            ] : [
                has.borgar && ["borgar", TK.sceny.straznik[9]],
                has.ambrozy && ["ambrozy", TK.sceny.straznik[10]],
                { walk: ["hero", 12, 9, 6] }, { fx: "warm" },
                ["hero", TK.sceny.straznik[11]],
                has.borgar && { leave: "borgar" }, has.ambrozy && { leave: "ambrozy" },
                { card: [TK.sceny.straznik[12]] },
                { asker: true },
                ["hero", TK.sceny.straznik[13]],
                { leave: "asker" }
            ],
            uwolnic: (w, e, has) => [
                ["hero", TK.sceny.uwolnic[0]],
                has.borgar && ["borgar", TK.sceny.uwolnic[1]],
                has.ambrozy && ["ambrozy", TK.sceny.uwolnic[2]],
                { fx: "rise" },
                { caption: TK.sceny.uwolnic[3] }, { caption: TK.sceny.uwolnic[4] }, { caption: TK.sceny.uwolnic[5] }, { caption: TK.sceny.uwolnic[6] }, { wait: 20 },
                [null, TK.sceny.uwolnic[7]],
                has.borgar && ["borgar", TK.sceny.uwolnic[8]],
                has.ambrozy && ["ambrozy", TK.sceny.uwolnic[9]],
                ["hero", TK.sceny.uwolnic[10]]
            ],
            zapieczetowac: (w, e, has) => [
                ["hero", TK.sceny.zapieczetowac[0]],
                has.ambrozy && ["ambrozy", w.book ? TK.sceny.zapieczetowac[1]
                    : TK.sceny.zapieczetowac[2]],
                has.borgar && ["borgar", TK.sceny.zapieczetowac[3]],
                { se: ["Earth3", 90, 60] }, { fx: "seal" },
                ["hero", TK.sceny.zapieczetowac[4]],
                w.locks >= 3 ? ["hero", TK.sceny.zapieczetowac[5]]
                    : ["hero", TK.sceny.zapieczetowac[6]]
            ]
        },
        // the first one to come down with a question, a year after the hero sat down (the hero's own watch): the first that fits
        ASKERS: [
            { who: "lord", when: w => w.lord.stance !== "absent" && w.lord.choice === "refuse",
                lines: [["asker", ""]] },
            { who: "ludmila", when: w => !w.marek,
                lines: [["asker", ""]] },
            { who: "melia", when: w => w.melia === "burned",
                lines: [["asker", ""]] },
            { who: "ozzy", when: () => true,
                lines: [["asker", ""]] }
        ],
        // the black card between the chamber and the town: ENDINGS[kind] (and the guardian's lines); then the scenes up above

        // ---- the scenes up above: in this order, each when its `when` holds. cam: where the camera stands (the hero, invisible,
        // stands there); actors: [key, x, y, dir]; hero: [x, y, dir] - the hero seen in the scene (not when he stayed below);
        // steps: as above. An actor key may be "butler" (Teodor or Feliks - whoever serves the Lord now).
        SHOTS: [
            {
                key: "dwor", map: 24, cam: [20, 15], when: w => w.story,
                actors: (w, e) => {
                    const l = w.lord, gate = l.stance === "rival" && l.choice === "refuse";
                    return gate ? [["guard", 20, 14, 2]] : [["lord", 20, 14, 2], ["butler", 22, 14, 2]].concat(l.stance === "rival" ? [["guard", 17, 15, 6]] : []);
                },
                steps: (w, e) => {
                    const l = w.lord;
                    if (e.kind === "uwolnic") return l.stance === "absent" ? [
                        ["lord", TK.sceny.steps[0]],
                        ["lord", TK.sceny.steps[1]]
                    ] : [
                        ["lord", TK.sceny.steps[2]],
                        ["lord", TK.sceny.steps[3]]
                    ];
                    if (l.stance === "absent") return [
                        ["lord", TK.sceny.steps[4]],
                        ["lord", TK.sceny.steps[5]],
                        [null, TK.sceny.steps[6]]
                    ];
                    if (l.stance === "rival" && l.choice === "refuse") return [
                        ["guard", TK.sceny.steps[7]],
                        [null, TK.sceny.steps[8]]
                    ];
                    if (l.choice === "allow") return l.stance === "ally" ? [
                        ["lord", TK.sceny.steps[9]],
                        ["lord", TK.sceny.steps[10]]
                    ] : [
                        ["lord", TK.sceny.steps[11]],
                        ["guard", TK.sceny.steps[12]]
                    ];
                    if (l.choice === "refuse") return [
                        ["lord", TK.sceny.steps[13]],
                        ["lord", TK.sceny.steps[14]]
                    ];
                    if (l.told === "truth") return [
                        ["lord", TK.sceny.steps[15]],
                        ["lord", TK.sceny.steps[16]]
                    ];
                    if (l.told === "mercy") return [
                        ["lord", TK.sceny.steps[17]],
                        [null, TK.sceny.steps[18]]
                    ];
                    return [["lord", TK.sceny.steps[19]]];
                }
            },
            {
                key: "rynek", map: 8, cam: [53, 55],
                actors: (w, e) => [["soltys", 53, 52, 4], ["hanka", 47, 49, 6], ["kuba", 51, 52, 8], ["ambrozy", 47, 52, 6]],
                steps: (w, e) => {
                    const out = [];
                    if (e.kind === "uwolnic") out.push(
                        [null, TK.sceny.steps[20]],
                        ["hanka", TK.sceny.steps[21]],
                        ["soltys", TK.sceny.steps[22]]);
                    else if (e.kind === "zniszczyc") out.push(
                        ["soltys", TK.sceny.steps[23]],
                        ["hanka", TK.sceny.steps[24]]);
                    else if (e.kind === "straznik") out.push(
                        [null, e.guardian === "hero" ? TK.sceny.steps[25]
                            : TK.sceny.steps[26]],
                        ["soltys", TK.sceny.steps[27]],
                        ["ambrozy", TK.sceny.steps[28]]);
                    else out.push(
                        ["soltys", TK.sceny.steps[29]],
                        w.book && ["ambrozy", TK.sceny.steps[30]]);
                    if (e.kind !== "uwolnic") {
                        out.push(w.water ? ["kuba", TK.sceny.steps[31]]
                            : ["kuba", TK.sceny.steps[32]]);
                        if (w.opinion !== null && w.opinion >= 60) out.push(["hanka", TK.sceny.steps[33]]);
                        else if (w.opinion !== null && w.opinion < 20) out.push([null, TK.sceny.steps[34]]);
                        if (w.siege && w.siege.result === "held") out.push(["soltys", TK.sceny.steps[35]]);
                        else if (w.siege && w.siege.result === "fallen") out.push(["soltys", TK.sceny.steps[36]]);
                    }
                    return out;
                }
            },
            {
                key: "oboz", map: w => (w.camp === "outside" ? 111 : 8), cam: w => (w.camp === "outside" ? [39, 15] : [57, 89]),
                actors: (w, e) => {
                    const at = w.camp === "outside" ? { ludmila: [38, 15, 6], ela: [39, 16, 8], marek: [40, 15, 4], rafal: [42, 16, 4] }
                        : { ludmila: [57, 90, 6], ela: [58, 91, 8], marek: [59, 90, 4], rafal: [55, 90, 6] };
                    const out = [["ludmila"].concat(at.ludmila), ["ela"].concat(at.ela)];
                    if (w.marek) out.push(["marek"].concat(at.marek));
                    if (w.rafal === "ally") out.push(["rafal"].concat(at.rafal));
                    return out;
                },
                steps: (w, e) => {
                    const out = [];
                    if (w.camp === "outside") out.push([null, TK.sceny.steps[37]]);
                    else if (w.camp === "inside") out.push([null, TK.sceny.steps[38]]);
                    if (w.marek) {
                        out.push([null, TK.sceny.steps[39]]);
                        if (e.kind === "uwolnic") out.push(["marek", TK.sceny.steps[40]]);
                        else if (e.kind === "zniszczyc") out.push(["marek", TK.sceny.steps[41]], ["ela", TK.sceny.steps[42]]);
                        else out.push(["ela", TK.sceny.steps[43]], { balloon: ["marek", 8] }, ["marek", "...Ela."], ["ludmila", TK.sceny.steps[44]]);
                    } else {
                        out.push(["ludmila", TK.sceny.steps[45]], ["ela", TK.sceny.steps[46]], ["ludmila", TK.sceny.steps[47]]);
                        if (e.kind === "straznik" && e.guardian === "hero") out.push([null, TK.sceny.steps[48]]);
                    }
                    if (w.rafal === "ally") out.push(["rafal", TK.sceny.steps[49]]);
                    else if (w.rafal === "enemy") out.push(["ludmila", TK.sceny.steps[50]]);
                    else if (w.rafal === "gone") out.push(["ludmila", TK.sceny.steps[51]]);
                    else if (w.rafal === "taken") out.push(["ludmila", TK.sceny.steps[52]]);
                    else if (w.rafal === "dead") out.push(["ludmila", TK.sceny.steps[53]]);
                    return out;
                }
            },
            {
                key: "dom", map: 19, cam: [10, 8], when: w => w.story,
                actors: () => [["dziadek", 10, 6, 2]],
                hero: (w, e) => (e.guardian === "hero" ? null : [10, 8, 8]),
                steps: (w, e) => {
                    if (e.kind === "straznik" && e.guardian === "hero") return [
                        ["dziadek", TK.sceny.steps[54]],
                        [null, TK.sceny.steps[55]]
                    ];
                    const out = [["dziadek", TK.sceny.steps[56]]];
                    if (e.kind === "uwolnic") out.push(["dziadek", TK.sceny.steps[57]],
                        ["dziadek", TK.sceny.steps[58]]);
                    else if (e.kind === "zniszczyc") out.push(["dziadek", TK.sceny.steps[59]]);
                    else if (e.kind === "zapieczetowac") out.push(["dziadek", TK.sceny.steps[60]]);
                    else if (w.fieldLost) out.push(["dziadek", e.guardian === "borgar" ? TK.sceny.steps[61] : TK.sceny.steps[62]]);
                    else out.push(["dziadek", e.guardian === "borgar" ? TK.sceny.steps[63] : TK.sceny.steps[64]]);
                    out.push(["dziadek", w.fieldLost ? TK.sceny.steps[65] : TK.sceny.steps[66]]);
                    return out;
                }
            },
            {
                key: "tawerna", map: 1, cam: [52, 31], last: true,
                actors: (w, e) => {
                    const out = [["borgar", 52, 28, 2], ["ozzy", 49, 30, 6], ["melia", 55, 30, 4]];
                    if (!w.grum || w.grum === "ally") out.push(["grum", 58, 31, 4]);
                    return out;
                },
                hero: (w, e) => (e.guardian === "hero" ? null : [52, 31, 8]),
                steps: (w, e) => {
                    const out = [], hero = e.guardian === "hero";
                    if (e.kind === "zniszczyc") out.push(
                        ["ozzy", TK.sceny.steps[67]],
                        ["borgar", TK.sceny.steps[68]],
                        ["melia", w.melia === "burned" ? TK.sceny.steps[69]
                            : TK.sceny.steps[70]]);
                    else if (e.kind === "uwolnic") out.push(
                        [null, TK.sceny.steps[71]],
                        ["ozzy", TK.sceny.steps[72]],
                        ["melia", TK.sceny.steps[73]]);
                    else if (e.kind === "zapieczetowac") out.push(
                        ["borgar", TK.sceny.steps[74]],
                        ["melia", w.melia === "burned" ? TK.sceny.steps[75]
                            : TK.sceny.steps[76]],
                        ["ozzy", TK.sceny.steps[77]]);
                    else if (e.guardian === "borgar") out.push(
                        ["borgar", TK.sceny.steps[78]],
                        ["ozzy", TK.sceny.steps[79]],
                        ["melia", TK.sceny.steps[80]]);
                    else if (e.guardian === "ambrozy") out.push(
                        ["borgar", TK.sceny.steps[81]],
                        ["ozzy", TK.sceny.steps[82]],
                        ["melia", TK.sceny.steps[83]]);
                    else out.push(
                        ["borgar", TK.sceny.steps[84]],
                        ["melia", TK.sceny.steps[85]],
                        ["ozzy", TK.sceny.steps[86]]);
                    // Grum (W8 / Act III)
                    const g = w.grum;
                    if (g === "ally") out.push(["grum", e.kind === "zniszczyc" ? TK.sceny.steps[87]
                        : e.kind === "uwolnic" ? TK.sceny.steps[88]
                        : e.kind === "zapieczetowac" ? TK.sceny.steps[89]
                        : TK.sceny.steps[90]]);
                    else if (g === "faction" || g === "enemy") out.push(["borgar", g === "enemy" ? TK.sceny.steps[91]
                        : TK.sceny.steps[92]]);
                    else if (g === "gone" || g === "ferry") out.push(["ozzy", TK.sceny.steps[93]]);
                    else if (g === "dead") out.push([null, TK.sceny.steps[94]], ["borgar", TK.sceny.steps[95]]);
                    else if (!g) out.push(["grum", TK.sceny.steps[96]]);
                    // the siege of the tavern (Act III)
                    const s = w.siege;
                    if (s && s.result === "held") {
                        out.push(["borgar", TK.sceny.steps[97]]);
                        if (s.names && s.names.defenders) out.push([null, Watki.wstaw(TK.sceny.steps[98], { defenders: s.names.defenders })]);
                    } else if (s && s.result === "costly") {
                        out.push(["borgar", TK.sceny.steps[99]]);
                        if (s.names && s.names.lost) out.push(["borgar", Watki.wstaw(TK.sceny.steps[100], { lost: s.names.lost })]);
                    } else if (s && s.result === "fallen") {
                        out.push(["borgar", TK.sceny.steps[101]],
                            [null, TK.sceny.steps[102]]);
                    }
                    // the end: the hero at the bar (or, for the hero who stayed below, his one day a year)
                    if (hero) out.push([null, TK.sceny.steps[103]], { heroIn: [52, 31, 8] },
                        { balloon: ["borgar", 1] }, ["borgar", TK.sceny.steps[104]]);
                    else out.push(["borgar", e.kind === "uwolnic" ? TK.sceny.steps[105]
                        : TK.sceny.steps[106]]);
                    return out;
                }
            }
        ],
        // F9: the endings to jump to and the worlds to try them in (Underground.debugEnding)
        DEBUG: {
            endings: [["zniszczyc", ""], ["straznik", ""], ["straznik", ""], ["straznik", ""], ["uwolnic", ""], ["zapieczetowac", ""]],
            worlds: [
                { key: "" },
                { key: "dobry", 
                    world: { locks: 3, opinion: 75, grum: "ally", rafal: "ally", marek: true, camp: "inside", water: true, book: true, melia: "public",
                        borgar: true, ambrozy: true, siege: { result: "held", defenders: ["borgar", "grum", "tadek", "rafal"], lost: [] } } },
                { key: "zly", 
                    world: { locks: 2, opinion: 10, grum: "dead", rafal: "enemy", marek: false, camp: "outside", water: false, book: false, melia: "burned",
                        borgar: false, ambrozy: false, siege: { result: "fallen", defenders: ["borgar"], lost: ["borgar"] } } },
                { key: "mieszany", 
                    world: { locks: 2, opinion: 45, grum: "faction", rafal: "gone", marek: true, camp: null, water: true, book: true, melia: null,
                        borgar: true, ambrozy: false, siege: { result: "costly", defenders: ["borgar", ""], lost: ["tadek"] } } }
            ],
            lords: [{ key: "" }, { key: "ally" }, { key: "rival" }, { key: "absent" }],
            endingName: (kind, who) => ({ zniszczyc: TK.sceny.endingName[0], straznik: TK.sceny.endingName[1], uwolnic: TK.sceny.endingName[2], zapieczetowac: TK.sceny.endingName[3] }[kind] +
                (kind === "straznik" ? ": " + ({ hero: "ja", borgar: "Borgar", ambrozy: TK.sceny.endingName[4] }[who]) : ""))
        }
    };
    Watki.scal(HEART, "podziemia", "serce");   // (its words: js/teksty/podziemia.txt, serce)

    // ------------------------------------------------------------------ the Truth Layer (band 5): whispers and apparitions
    // whispers: barks from the dark (a <Szept> place or the hero); apparitions: a resident seen for a moment at a <Zjawa> place
    const WHISPERS = [];
    Watki.scal(WHISPERS, "podziemia", "szepty");   // (its words: js/teksty/podziemia.txt, szepty)
    const APPARITIONS = [
        { sheet: "$Npc_Borgar" },
        { sheet: "$Npc_Melia" },
        { sheet: "$Npc_Ozzy" },
        { sheet: "$Npc_Dziadek" },
        { sheet: "$Npc_Piekarka" },
        { sheet: "$Npc_Dzwonnik" },
        { sheet: "$Npc_Grum" },
        { sheet: "$Npc_Feliks" },
        { sheet: "$Npc_Lord" },
        { sheet: "$Npc_Kowal" },
        { sheet: "$Npc_Ludmila" },
        { sheet: "$Npc_Woziwoda" }
    ];
    Watki.scal(APPARITIONS, "podziemia", "zjawy");   // (its words: js/teksty/podziemia.txt, zjawy)
    // who the truths are about (keys as TownLife's residents; "hero" = the hero himself)
    const TRUTH_WHO = { };
    Watki.scal(TRUTH_WHO, "podziemia", "prawdaKto");   // (its words: js/teksty/podziemia.txt, prawdaKto)

    // the order's notes, one on every generated floor (in the order the floors go down - the story goes with the depth); read,
    // each goes into the journal as a note. Short: scratched on walls, written on scraps. Band 5's are truths (who: about whom) -
    // read, they are kept as truths (Underground.truths(), the bus "undergroundTruth") for the town's quests (W9 ch. 6).
    const NOTES = {
        1: { },
        2: { },
        3: { },
        4: { },
        5: { },
        6: { },
        7: { },
        8: { },
        9: { },
        // floor 10 (Map140, made by hand): the first real notes of the order - the clue toward the Heart (W9)
        "10a": { },
        "10b": { },
        "10c": { },
        "10d": { },

        // ---- band 2: Kwatery i kaplica zakonu (floors 11-30): the order's daily life, the rite of one question, the cistern
        11: { },
        12: { },
        13: { },
        14: { },
        15: { },
        16: { },
        17: { },
        18: { },
        19: { },
        21: { },
        22: { },
        23: { },
        24: { },
        25: { },
        26: { },
        27: { },
        28: { },
        29: { },
        "20a": { },
        "20b": { },
        "20c": { },
        "30a": { },
        "30b": { },
        "30c": { },

        // ---- band 3: Jaskinie i podziemna rzeka (floors 31-50): the order's scouts, the river, mushrooms and ore, the diggers
        31: { },
        32: { },
        33: { },
        34: { },
        35: { },
        36: { },
        37: { },
        38: { },
        39: { },
        41: { },
        42: { },
        43: { },
        44: { },
        45: { },
        46: { },
        47: { },
        48: { },
        49: { },
        "40a": { },
        "40b": { },
        "50a": { },
        "50b": { },
        "50c": { },

        // ---- band 4: Ruiny starsze niż zakon (floors 51-75): carvings, the order's scholars, the first ones (left open)
        51: { },
        52: { },
        53: { },
        54: { },
        55: { },
        56: { },
        57: { },
        58: { },
        59: { },
        61: { },
        62: { },
        63: { },
        64: { },
        65: { },
        66: { },
        67: { },
        68: { },
        69: { },
        71: { },
        72: { },
        73: { },
        74: { },
        75: { },
        "60a": { },
        "60b": { },
        "70a": { },
        "70b": { },

        // ---- band 5: Warstwa Prawdy (floors 76-99): truths - small, about the people up there (and about the hero)
        76: { who: "borgar" },
        77: { who: "melia" },
        78: { who: "ozzy" },
        79: { who: "grum" },
        81: { who: "piekarka" },
        82: { who: "woziwoda" },
        83: { who: "feliks" },
        84: { who: "dzwonnik" },
        85: { who: "kowal" },
        86: { who: "dziadek" },
        87: { who: "kapral" },
        88: { who: "ludmila" },
        89: { who: "lord" },
        91: { who: "soltys" },
        92: { who: "kupiec" },
        93: { who: "garbarz" },
        94: { who: "rafal" },
        95: { who: "kot" },
        96: { who: "hero" },
        97: { who: "hero" },
        98: { who: "straznik" },
        99: { who: "hero" },
        "80a": { who: "hero" },
        "80b": { },
        "90a": { },
        "90b": { },
        "90c": { },
        "100a": { }
    };
    Watki.scal(NOTES, "podziemia", "notatki");   // (its words: js/teksty/podziemia.txt, notatki)

    // ------------------------------------------------------------------ F9 (Debug.js's first tab "Zdarzenia" - the thread engine Watki.js)
    // the floor to go to (←→ 0-100, Shift: by 10; OK - to its stairs up, the grate and the bosses do not matter), the cellar's grate
    // (switch 11) open / shut, the Heart's three locks known without W2-W4, every stop of the lift (10-90), an ending of the Heart
    // (←→ which; OK plays it) and the world and the Lord it is played with (←→ or OK). The words: js/teksty/podziemia.txt (f9.*,
    // kod.heartEnd / heartWorld / heartLord); what ←→ and OK do: Underground.js's hooks (f9Zmienne - the {x}, f9Wybierz, f9Ok)
    Watki.watek({
        id: "podziemia", wtyczka: "Underground", teksty: "podziemia",
        f9: { zakladka: "zdarzenia", wiersze: [
            { co: "pietro", rodzaj: "underground", etykieta: "f9.pietro", ikona: 189, pola: { floor: 1 } },
            { co: "krata", rodzaj: "ugGate", etykieta: "f9.krata", ikona: 195 },
            { co: "zamki", rodzaj: "ugLocks", etykieta: "f9.zamki", ikona: 195 },
            { co: "winda", rodzaj: "ugLifts", etykieta: "f9.winda", ikona: 189 },
            { co: "koniec", rodzaj: "heartEnd", etykieta: "kod.heartEnd.0", ikona: 189 },
            { co: "swiat", rodzaj: "heartWorld", etykieta: "kod.heartWorld.0", ikona: 195 },
            { co: "lord", rodzaj: "heartLord", etykieta: "kod.heartLord.0", ikona: 195 }
        ].map(r => Object.assign({ zmienne: "f9Zmienne", wybierz: "f9Wybierz", ok: "f9Ok" }, r)) }
    });

    window.Underground_Data = { VERSION: "2.2.0", MAPS, SWITCHES, IDS, SPOTS, FLOORS, LIFT, MAZE, BANDS, FLOOR_NOTE, ART, TORCH_LIGHT, BLUE_LIGHT,
        SPIKE_STEPS, SPIKES, LOOT, LOOT_NAMES, GOLD_ICON, BOSSES, LOCKS, TEXT: T, ENDINGS, EPILOGUE, HEART, WHISPERS, APPARITIONS, TRUTH_WHO, NOTES };
})();
