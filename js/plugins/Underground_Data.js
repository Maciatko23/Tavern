//=============================================================================
// Underground_Data.js
//=============================================================================
// Load order: right before Underground.js (it reads window.Underground_Data when it loads; Underground.js loads this file
// itself when it is not on the plugin list). Data only: map ids, switches, the bands, loot tables and every Polish text of
// the underground. docs/PODZIEMIA.md describes the whole system.

/*:
 * @target MZ
 * @plugindesc Dane podziemi (Underground.js): mapy, przełączniki, pasma pięter 1-100, łupy, bossowie, zamki Serca, zakończenia i teksty (po polsku). Musi stać tuż nad Underground.js. v2.0.0
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
        10: { map: 140, name: "Strażnica", up: [5, 13, 2], down: [16, 3, 2], lift: [21, 5, 2] },
        20: { map: 146, name: "Sala jednego pytania", up: [4, 6, 2], down: [32, 6, 2], lift: [7, 19, 2], boss: "boss_20" },
        30: { map: 147, name: "Wielka cysterna", up: [4, 6, 2], down: [34, 6, 2], lift: [34, 20, 2], boss: "boss_30" },
        40: { map: 148, name: "Bród Milczącej", up: [4, 6, 2], down: [33, 6, 2], lift: [33, 20, 2], boss: "boss_40" },
        50: { map: 149, name: "Przekop kopaczy", up: [4, 6, 2], down: [22, 6, 2], lift: [6, 14, 2], boss: "boss_50" },
        60: { map: 150, name: "Brama Pierwszych", up: [4, 6, 2], down: [17, 4, 2], lift: [29, 17, 2], boss: "boss_60" },
        70: { map: 151, name: "Sala płaskorzeźb", up: [4, 6, 2], down: [34, 17, 2], lift: [6, 18, 2], boss: "boss_70" },
        80: { map: 152, name: "Sala echa", up: [4, 6, 2], down: [28, 6, 2], lift: [5, 18, 2], boss: "boss_80" },
        90: { map: 153, name: "Ostatnia straż", up: [4, 6, 2], down: [31, 6, 2], lift: [6, 18, 2], boss: "boss_90" },
        100: { map: 11, name: "Komnata Serca", up: [4, 6, 2], down: null, lift: null }
    };
    // the lift's stops (0 = Ruiny Zamku): a cage on every hand-made floor 10-90; a stop works once its windlass was turned
    const LIFT = { stops: [10, 20, 30, 40, 50, 60, 70, 80, 90] };

    // ------------------------------------------------------------------ the bands of floors
    // rooms: how many rooms each generated floor has - a list (floor `from` first) or { min, max } (growing with the depth);
    // corridor: the corridors' floor kind and wall (A4 top / side kinds of the band's tileset); rock: the A4 top kind that fills
    // everything between the rooms; dark: RoomLighting's darkness (0-255); level: Combat's place level of floor `from` (+1 every
    // 2 floors); virtual: floors on map ids VIRTUAL_BASE + N (the shared shell); torch: the corridors' torch (ART key + light);
    // gold: old coins found x this; ambience / bgs: the floor's sound (a bgs plays only on a floor whose rooms have water when
    // bgsWater is set); whispers: the Truth Layer's voices (band 5)
    const BANDS = [
        {
            id: 1, name: "Piwnice zamku", from: 1, to: 10, chunkMap: 130, handmade: { 10: 140 },
            rooms: [4, 5, 5, 6, 6, 7, 7, 8, 8],
            corridor: { floor: 40, top: 99, side: 107, film: 46, filmChance: 0.1 },
            rock: 99, dark: 215, level: 4,
            torchEvery: [7, 11], torchLit: 0.7, roomTorchLit: 0.85,
            lootFull: 0.6, trapOn: 0.6,
            bgm: "", tileset: 10
        },
        {
            id: 2, name: "Kwatery i kaplica zakonu", from: 11, to: 30, chunkMap: 141, handmade: { 20: 146, 30: 147 }, virtual: true,
            rooms: { min: 6, max: 9 },
            corridor: { floor: 41, side: 123, film: 46, filmChance: 0.12 },
            rock: 115, dark: 222, level: 9,
            torchEvery: [7, 11], torchLit: 0.6, roomTorchLit: 0.8,
            lootFull: 0.6, trapOn: 0.5, gold: 1.3,
            bgm: "", tileset: 12
        },
        {
            id: 3, name: "Jaskinie i podziemna rzeka", from: 31, to: 50, chunkMap: 142, handmade: { 40: 148, 50: 149 }, virtual: true,
            rooms: { min: 6, max: 9 },
            corridor: { floor: 17, side: 88, film: 19, filmChance: 0.18 },
            rock: 80, dark: 228, level: 19,
            torchEvery: [9, 13], torchLit: 0.4, roomTorchLit: 0.55,
            lootFull: 0.55, trapOn: 0.35, gold: 1.6,
            bgm: "", tileset: 10, bgsWater: { name: "River", volume: 35, pitch: 80 }
        },
        {
            id: 4, name: "Ruiny starsze niż zakon", from: 51, to: 75, chunkMap: 143, handmade: { 60: 150, 70: 151 }, virtual: true,
            rooms: { min: 7, max: 10 },
            corridor: { floor: 26, side: 124, film: 22, filmChance: 0.15 },
            rock: 100, dark: 234, level: 29,
            torchEvery: [9, 14], torchLit: 0.35, roomTorchLit: 0.5,
            lootFull: 0.5, trapOn: 0.55, gold: 2.0,
            bgm: "", tileset: 10, bgs: { name: "Wind1", volume: 18, pitch: 60 }
        },
        {
            id: 5, name: "Warstwa Prawdy", from: 76, to: 99, chunkMap: 144, handmade: { 80: 152, 90: 153 }, virtual: true,
            rooms: { min: 7, max: 10 },
            corridor: { floor: 35, side: 110, film: 31, filmChance: 0.22 },
            rock: 102, dark: 240, level: 42,
            torchEvery: [8, 12], torchLit: 0.75, roomTorchLit: 0.8, torch: "blue",
            lootFull: 0.45, trapOn: 0.3, gold: 2.4,
            bgm: "", tileset: 10, bgs: { name: "Darkness", volume: 22, pitch: 70 }, whispers: true
        },
        {
            id: 6, name: "Serce Twierdzy", from: 100, to: 100, handmade: { 100: 11 },
            dark: 236, level: 54, tileset: 10
        }
    ];

    // the generated floors' map note (RoomLighting: always dark; Atmosphere: the cave's drips; no weather, no building, no hunting;
    // no minimap - the floor is found in the dark)
    const FLOOR_NOTE = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:%DARK%>\n<DarkNight:%DARK%>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n<Minimap:off>\n<Poziom:%LEVEL%>";

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
        skrzynia: "Skrzynia", skrzynka: "Skrzynka", beczka: "Beczka", worek: "Worek", dzban: "Dzban", monety: "Stare monety", kosci: "Szczątki strażnika",
        grzyby: "Grzyby", wozek: "Wózek kopaczy", sakwa: "Porzucona sakwa", relikwiarz: "Relikwiarz"
    };
    const GOLD_ICON = 313;

    // ------------------------------------------------------------------ the bosses of the hand-made floors (stage 4 of the fighting)
    // The creature plugin registers a maker for "boss_NN" (Underground.registerCreature); while it does, the floor's stairs down
    // wait for Underground.bossDefeated(NN). desc: one line for that plugin's author (the look and the way it fights).
    const BOSSES = {
        20: { name: "Przeor w zbroi", desc: "Pusta zbroja przeora w porwanym habicie, z księgą przykutą łańcuchem do pasa - wciąż prowadzi rytuał jednego pytania; bije ciężkim kosturem za każdy krok w kręgu, wolna, ale nie do przewrócenia (zbroja)." },
        30: { name: "Królowa szczurów", desc: "Olbrzymia, łysiejąca szczurzyca z gniazdem z kości i słomy na dnie suchej cysterny; gryzie i taranuje, a gdy traci siły, piszczy i woła roje szczurów (szczur)." },
        40: { name: "Matka pająków", desc: "Pajęczyca wielka jak wóz, przędzie sieci nad brodem Milczącej; spuszcza się z sufitu, pluje lepką siecią, która spowalnia, i ciągnie ofiarę w górę (pająk)." },
        50: { name: "Topielec z głębiny", desc: "Ogromny topielec oblepiony mułem i korzeniami, wynurza się z podziemnej rzeki przy przekopie kopaczy; chwyta i wciąga ku wodzie, zanurza się, gdy obrywa (topielec)." },
        60: { name: "Kamienny Odźwierny", desc: "Posąg starszy niż zakon, z zatartą twarzą, strzeże Bramy Pierwszych; budzi się, gdy ktoś stanie na progu, wali pięściami w posadzkę (fala odłamków), bardzo wolny i twardy (kamiennik)." },
        70: { name: "Zbroja bez herbu", desc: "Rdzawy pancerz starszy niż zakon, z wydrapanym herbem i długim mieczem; walczy szybko i czysto, jak ktoś, kto pamięta wojnę, której nikt nie spisał (zbroja)." },
        80: { name: "Upiór pytającego", desc: "Półprzezroczysty cień strażnika, który pytał ponad miarę; mówi głosem bohatera, zadaje mu pytania, a każda bez odpowiedzi to cios; znika i pojawia się za plecami (upiór)." },
        90: { name: "Ostatni Strażnik", desc: "Cień w habicie zakonu, który przybiera twarz kogoś bliskiego bohaterowi (mieszkańca, któremu najbardziej ufa) - ostatnia straż przed Sercem; rozpada się na trzy cienie (cień)." }
    };

    // ------------------------------------------------------------------ the three locks of the Heart's chamber (floor 100, W9 ch. 7)
    // key: the castellan's key (W4), signal: the signal "pytanie" (seven strikes, W2), song: the song of the Raven Rocks (W3).
    // Any two open the door (QUESTY.md W9: "wystarczą dowolne dwa"), all three give the better ending.
    const LOCKS = { need: 2, order: ["key", "signal", "song"] };

    // ------------------------------------------------------------------ texts
    const T = {
        floorName: n => "Podziemia - piętro " + n,
        notice: n => "Piętro " + n,
        noticeSub: (band, deepest) => band + (deepest > 0 ? " · najgłębiej: " + deepest : ""),
        deeper: n => "Najgłębiej, jak dotąd: piętro " + n,
        empty: { skrzynia: "Pusta.", skrzynka: "Pusta skrzynka.", beczka: "Na dnie tylko kurz.", worek: "Pusty worek.",
            dzban: "Pusty dzban.", monety: "Nic więcej tu nie ma.", kosci: "Zostawię go w spokoju.", grzyby: "",
            wozek: "Wózek jest pusty.", sakwa: "Pusta sakwa.", relikwiarz: "Pusty relikwiarz." },
        found: { skrzynia: "W skrzyni...", skrzynka: "W skrzynce...", beczka: "Na dnie beczki...", worek: "W worku...",
            dzban: "W dzbanie...", monety: "Stare monety, rozsypane w kurzu.", kosci: "Przy kościach strażnika...", grzyby: "Grzyby z jaskini.",
            wozek: "W wózku...", sakwa: "W sakwie...", relikwiarz: "W relikwiarzu..." },
        nothing: { skrzynia: "Ktoś był tu przede mną.", skrzynka: "Same drzazgi.", beczka: "Pusta. Pachnie jeszcze winem.",
            worek: "Zbutwiałe płótno, nic w środku.", dzban: "Pusty.", monety: "", kosci: "Nic przy nim nie ma.", grzyby: "",
            wozek: "Tylko kamienny pył.", sakwa: "Ktoś ją już opróżnił.", relikwiarz: "Pusty. Ktoś zabrał to, co w nim było." },
        gold: n => "Stare monety: " + n + " G",
        torchOut: "Wypalona pochodnia. Ktoś zapalił ją dawno temu.",
        stairsUp: "Schody w górę",
        stairsDown: "Schody w dół",
        noFloor: "Dalej nie ma już schodów. Tylko skała.",
        // the grate in the tavern's cellar (Map009) while the way down is closed
        gateClosed: [
            "Stara krata, wpuszczona w mur dawnej twierdzy. Za nią schody znikają w ciemności.",
            "Zamek ma wyryty znak kruka i zardzewiał na kamień. Krata ani drgnie."
        ],
        gateOpen: "Krata stoi otworem. Schody prowadzą w dół, do ruin twierdzy.",
        trapHit: "Kolce!",
        // water down here is never drunk (the drought rule: water is a reward of the town and the tavern, not of the depths)
        water: "Mętna, lodowata woda. Pachnie żelazem i kamieniem - tego nie będę pić.",
        // the lift
        windlassLook: ["> (Kołowrót windy kasztelana. Łańcuch zardzewiały, ale cały - idzie w górę, w ciemność szybu.)"],
        windlassAsk: "Zakręcić kołowrotem?",
        windlassYes: "Zakręcić",
        windlassNo: "Zostawić",
        windlassTurned: ["> (Coś wysoko w górze szczęka i zgrzyta... Klatka drgnęła. Winda znów chodzi!)"],
        windlassOn: ["> (Kołowrót chodzi lekko. Klatka czeka.)"],
        cageStuck: ["> (Klatka windy wisi na łańcuchu, zablokowana. Trzeba poruszyć kołowrót.)"],
        shaftEmpty: ["> (Pusty szyb. Łańcuchy giną w ciemności, gdzieś bardzo głęboko.)"],
        liftAsk: "Dokąd jechać?",
        liftStay: "Zostać",
        liftRuins: "Ruiny Zamku (na górę)",
        liftStop: f => "Piętro " + f + (FLOORS[f] ? " - " + FLOORS[f].name : ""),
        liftOn: f => "Winda kasztelana staje na piętrze " + f,
        liftSub: "Kołowrót poruszony - klatka zjedzie tu z Ruin Zamku",
        // the boss of a hand-made floor stands between the hero and the stairs down
        bossBlocks: name => "Najpierw " + name + ". Tędy nie przejdę.",
        bossDone: name => name + " - pokonany",
        // first visits (a line over the hero)
        firstVisit: {
            1: "Piwnice zamku... Ktoś tu kiedyś naprawdę mieszkał.",
            3: "Im niżej, tym starsze kamienie.",
            5: "Zimno tu. I cicho - aż za cicho.",
            7: "Ściany są tu gładsze. Jakby ktoś je wycierał rękami.",
            9: "Słyszę coś... jakby ktoś szeptał za murem.",
            11: "Cele, refektarz... Tu zakon naprawdę żył.",
            15: "Wszędzie ta sama zasada, wyryta w kamieniu. Jedno pytanie.",
            21: "Pachnie wilgocią. Gdzieś tu była woda.",
            25: "Ktoś zostawił świecę. Wypalona do końca.",
            31: "Koniec murów. Dalej jest już tylko skała.",
            35: "Słyszę rzekę. Gdzieś pod nogami.",
            41: "Świeża kreda na ścianie. Ktoś tu był niedawno.",
            45: "Grzyby świecą tu jak gwiazdy. Nie podoba mi się to.",
            51: "Tych ścian nie stawiał zakon.",
            55: "Twarze na kamieniu... zatarte. Wszystkie.",
            61: "Kurz nie opada. Wisi w powietrzu i czeka.",
            65: "Każdy ślad stóp prowadzi w dół.",
            71: "Ciepło. Coraz cieplej, choć to nie ma sensu.",
            76: "Ktoś mnie woła. Moim głosem.",
            81: "Znam to miejsce. Nigdy tu nie byłem.",
            85: "Wiem rzeczy, których nikt mi nie powiedział.",
            91: "Ostatnie piętra. Czuję je w zębach.",
            95: "Jeszcze trochę. Tylko jeszcze trochę.",
            99: "Za tymi drzwiami... wiem, co jest za tymi drzwiami."
        },
        // the Heart's chamber (floor 100)
        lockKeyNo: ["> (Zamek z krukiem, taki sam jak na kracie w piwnicy Borgara. Bez klucza ani drgnie.)"],
        lockKeyYes: ["> (Klucz kasztelana wchodzi w zamek. Obraca się sam, jakby ktoś po drugiej stronie na niego czekał.)"],
        lockKeyDone: ["> (Zamek z krukiem jest otwarty.)"],
        lockSignalNo: ["> (Kamienny dzwon bez serca, a pod nim siedem nacięć w kamieniu. Ile razy uderzyć? Nie znam sygnału, który by tu pasował.)"],
        lockSignalAsk: "Uderzyć w kamienny dzwon?",
        lockSignalOpt: "Siedem razy - sygnał „pytanie”",
        lockSignalLeave: "Zostawić",
        lockSignalYes: ["> (Siedem uderzeń. Kamień odpowiada z głębi - siódmym, którego nie zadałem.)"],
        lockSignalDone: ["> (Dzwon jeszcze drży. Zamek dzwonu jest otwarty.)"],
        lockSongNo: ["> (Kamień z wyrytymi pustymi wersami - sześć rzędów kresek, bez słów. Ktoś musiałby znać pieśń, żeby je wypełnić.)"],
        lockSongAsk: "Zaśpiewać przy kamieniu?",
        lockSongOpt: "Pieśń o Kruczych Skałach",
        lockSongYes: ["> (Śpiewasz cicho, zwrotka po zwrotce. Puste wersy na kamieniu wypełniają się słowami.)", "> (Przy ostatniej - „nie odpowiadaj, gdy głos nieznany” - kamień milknie i ustępuje.)"],
        lockSongDone: ["> (Na kamieniu stoją słowa pieśni. Zamek pieśni jest otwarty.)"],
        doorShut: n => ["> (Ostatnie drzwi. Trzy zamki: klucz, dzwon i pieśń. Otwartych: " + n + " z 3.)", "> (Napis nad drzwiami: KTO MA DWA, TEN WEJDZIE. KTO MA TRZY, TEN WYJDZIE.)"],
        doorOpen: ["> (Drzwi Komnaty Serca stoją otworem. Za nimi światło, które nie rzuca cienia.)"],
        lockNames: { key: "klucz kasztelana", signal: "sygnał dzwonu", song: "pieśń" },
        heartLook: [
            "> (Na kamiennym cokole, w środku kręgu, jest Serce Twierdzy.)",
            "> (Nie da się powiedzieć, czym jest. Kiedy patrzysz wprost, widzisz światło. Kiedy odwracasz wzrok - wiesz, że ono patrzy na ciebie.)",
            "> (Wiesz naraz kilka rzeczy, o które nie pytałeś. Odsuwasz je, zanim się ułożą w zdania.)"
        ],
        heartAsk: "Co zrobić z Sercem?",
        heartChoices: { zniszczyc: "Zniszczyć Serce", straznik: "Zostać strażnikiem", uwolnic: "Uwolnić prawdę dla wszystkich",
            zapieczetowac: "Zapieczętować je - z zasadami", wait: "Jeszcze nie" },
        heartConfirm: "Tego nie da się cofnąć. Na pewno?",
        heartYes: "Tak", heartNo: "Nie, jeszcze nie",
        guardianWho: "Kto zostanie strażnikiem?",
        guardianHero: "Ja", guardianBorgar: "Borgar", guardianAmbrozy: "Ambroży",
        heartAfter: {
            zniszczyc: ["> (Na cokole leżą ciemne odłamki. Nie świecą. Nic nie mówią.)"],
            straznik: ["> (Kamienna ława przed Sercem jest zajęta. Strażnik nie podnosi głowy.)"],
            uwolnic: ["> (Cokół jest pusty. Światło poszło w górę i już nie wróci.)"],
            zapieczetowac: ["> (Serce śpi pod kamienną pieczęcią. Na pieczęci wyryto: JEDNO PYTANIE. RAZ W ROKU. PRZY ŚWIADKACH.)"]
        },
        endTitle: "KONIEC",
        endAsk: "Co dalej?",
        endContinue: "Wrócić do gry (tawerna, następny dzień)",
        endTitleScreen: "Do ekranu tytułowego"
    };

    // the four endings (STORY.md, Akt III; QUESTY.md W9 ch. 8). Short on purpose: STORY.md leaves their details open.
    // lines: the epilogue (a plain message window on a black screen); guardian: the lines of who stays (hero / borgar / ambrozy)
    const ENDINGS = {
        zniszczyc: { title: "Serce zniszczone", lines: [
            "Uderzasz raz. Światło pęka jak lód na wiosnę - i przez jedną chwilę wiesz wszystko. Potem nic.",
            "Gdzieś wysoko, w piwnicy tawerny, Borgar budzi się w nocy i nie pamięta, po co wstał.",
            "Na kontynencie wojna trwa dalej. Nikt już nie dostanie pewności. Wszyscy muszą zgadywać - jak przedtem.",
            "Wracasz na górę z pustymi rękami. Pierwszy raz od dawna niczego nie musisz wiedzieć."] },
        straznik: { title: "Nowy strażnik", lines: [],
            guardian: {
                hero: ["Siadasz na kamiennej ławie przed Sercem. Jest zimna, jakby czekała na ciebie od trzystu lat.",
                    "Raz w roku ktoś zejdzie i zada jedno pytanie. Ty zdecydujesz, ile prawdy udźwignie.",
                    "Na górze życie toczy się bez ciebie. Borgar stawia na barze kufel dla kogoś, kto nie przychodzi.",
                    "Uczysz się milczeć. Uczysz się nie pytać."],
                borgar: ["Borgar siada na kamiennej ławie. „Ktoś z rodu musiał wrócić na wartę” - mówi. „Ja przynajmniej wiem, czego nie chcę wiedzieć.”",
                    "Raz w roku ktoś zejdzie i zada jedno pytanie. Borgar odpowie tyle, ile trzeba - ani słowa więcej.",
                    "Tawerna zostaje na twojej głowie. Nad barem wisi pusty gwóźdź po połówce klucza."],
                ambrozy: ["Ambroży schodzi, choć kolana bolą go przy każdym stopniu. „Nikt nie odwołał warty” - mówi i siada przed Sercem.",
                    "Raz w roku dzwon na górze uderzy siedem razy. Teraz zrobi to ktoś inny - Ambroży nauczył cię rytmu.",
                    "Dzwonnica stoi pusta. Miasto jeszcze nie wie, czego mu brakuje."]
            } },
        uwolnic: { title: "Prawda dla wszystkich", lines: [
            "Otwierasz Serce jak okno. Światło idzie w górę - przez sto pięter, przez piwnicę, przez deski tawerny.",
            "Rano całe miasto wie wszystko o wszystkich.",
            "Nikt nie krzyczy. Ludzie po prostu przestają się do siebie odzywać.",
            "Po tygodniu na rynku stoją puste stragany. Prawda nikogo nie uczyniła szczerym - tylko samotnym.",
            "Ty też wiesz wszystko. Także to, czego nie chciałeś."] },
        zapieczetowac: { title: "Pieczęć z zasadami", lines: [
            "Zamykasz Serce. Nie na zawsze - na rok.",
            "Spisujesz zasady na nowo: jedno pytanie, przy świadkach, zapisane w księdze. Ale tym razem księga zostaje na górze, u ludzi.",
            "Twierdza znów odmierza prawdę. Nikomu jej nie zabraniasz - pilnujesz tylko, żeby nikt nie wziął więcej, niż uniesie.",
            "To nie jest szczęśliwe zakończenie. To uczciwe."] }
    };
    // the epilogue's extra lines (what the town did with the hero matters: QUESTY.md W9 ch. 8)
    const EPILOGUE = {
        allLocks: "Trzy zamki otworzyły się przed tobą - klucz Borgara, dzwon Ambrożego, pieśń Melii. Na górze ktoś ci zaufał. Zabierasz to ze sobą.",
        opinionHigh: "W miasteczku mówią o tobie dobrze. Kiedy wrócisz, będzie do kogo wrócić.",
        opinionLow: "W miasteczku mało kto pyta, gdzie byłeś.",
        water: "Woda znów płynie pod rynek - mniej, niż by chcieli, ale płynie.",
        ambrozyBook: "Ambroży trzyma Księgę sygnałów na kolanach. Siódme uderzenie znów coś znaczy."
    };

    // ------------------------------------------------------------------ the Truth Layer (band 5): whispers and apparitions
    // whispers: barks from the dark (a <Szept> place or the hero); apparitions: a resident seen for a moment at a <Zjawa> place
    const WHISPERS = [
        "...nie odwracaj się...", "Wiesz już. Zawsze wiedziałeś.", "Zapytaj. Tylko jedno pytanie...", "Kto schodzi, ten pyta.",
        "Oni na górze też kłamią.", "Policz, ile kosztuje prawda.", "Za tobą ktoś idzie. To ty.", "Dlaczego tu zszedłeś? Naprawdę?",
        "Ciepło... coraz cieplej...", "Nie odpowiadaj.", "Twoje imię brzmi tu inaczej.", "Jeszcze jedno piętro. Jeszcze jedno.",
        "Ile razy już tu byłeś?", "Wróć na górę. Albo zostań.", "Ktoś cię kocha. Ktoś cię zdradzi. Który to który?", "...siedem... siedem..."
    ];
    const APPARITIONS = [
        { sheet: "$Npc_Borgar", name: "Borgar", line: "Wracaj na górę. Zawsze wracaj na górę." },
        { sheet: "$Npc_Melia", name: "Melia", line: "Nie tę zwrotkę... nie tę." },
        { sheet: "$Npc_Ozzy", name: "Ozzy", line: "Mówiłem ci. Mówiłem wszystkim." },
        { sheet: "$Npc_Dziadek", name: "Dziadek Stach", line: "Wnusiu? Co ty tu robisz tak głęboko?" },
        { sheet: "$Npc_Piekarka", name: "Hanka", line: "Weź bochenek. Zostało." },
        { sheet: "$Npc_Dzwonnik", name: "Ambroży", line: "Siedem... liczyłeś? Siedem?" },
        { sheet: "$Npc_Grum", name: "Grum", line: "Nie patrz na mnie tak." },
        { sheet: "$Npc_Feliks", name: "Feliks", line: "Nikt nie musi wiedzieć." },
        { sheet: "$Npc_Lord", name: "Lord Zaleski", line: "Mówiłem: najpierw do mnie." },
        { sheet: "$Npc_Kowal", name: "Tadek", line: "Za ciężki ten klucz. Za ciężki." },
        { sheet: "$Npc_Ludmila", name: "Ludmiła", line: "Ciii... Ela śpi." },
        { sheet: "$Npc_Woziwoda", name: "Kuba", line: "Wody? Nie mam już wody." }
    ];
    // who the truths are about (keys as TownLife's residents; "hero" = the hero himself)
    const TRUTH_WHO = { borgar: "Borgar", melia: "Melia", ozzy: "Ozzy", grum: "Grum", piekarka: "Hanka Mączna", woziwoda: "Kuba Woziwoda",
        feliks: "Feliks", dzwonnik: "Ambroży", kowal: "Tadek Młot", dziadek: "Dziadek Stach", kapral: "Kapral Wit", ludmila: "Ludmiła",
        lord: "Lord Zaleski", soltys: "Sołtys Bronisław", kupiec: "Baltazar Vey", garbarz: "Ignac", rafal: "Rafał", kot: "Mruczek",
        hero: "ty", straznik: "strażnik, który pytał ponad miarę" };

    // the order's notes, one on every generated floor (in the order the floors go down - the story goes with the depth); read,
    // each goes into the journal as a note. Short: scratched on walls, written on scraps. Band 5's are truths (who: about whom) -
    // read, they are kept as truths (Underground.truths(), the bus "undergroundTruth") for the town's quests (W9 ch. 6).
    const NOTES = {
        1: { title: "Spis piwnicy", where: "kartka przybita do beczki",
            text: "Wino - czterdzieści beczek. Zboże - dwanaście worków. Łój - trzy skrzynie.\nKlucz u kasztelana. Kto bierze, ten wpisuje.\nKto nie wpisze, ten tłumaczy się przeorowi." },
        2: { title: "Brat Jarosz", where: "notatka na skrawku pergaminu",
            text: "Brat Jarosz znowu zszedł niżej bez latarni. Mówi, że na dole i tak jest jasno.\nPrzeor kazał mu pościć trzy dni. Jarosz się śmiał - że już wie, ile wytrzyma." },
        3: { title: "Napis w murze", where: "litery wyryte w kamieniu",
            text: "NIE PYTAJ O TO, CZEGO NIE CHCESZ WIEDZIEĆ.\n\nPod spodem, mniejszymi literami, inną ręką:\n...a jeśli chcesz, pytaj raz w roku. Nie częściej." },
        4: { title: "Rok trzydziesty drugi straży", where: "zapiski kronikarza",
            text: "Nowicjusze pytali o pogodę na zbiory. Odpowiedź była dobra, żniwa też.\nDwóch płakało potem do rana. Żaden nie chciał powiedzieć dlaczego." },
        5: { title: "Rozkaz o zmianach warty", where: "kartka pod kamieniem",
            text: "Straż przy schodach zmieniamy co trzy dni, nie co siedem.\nKto stoi dłużej, zaczyna słyszeć pytania, których nikt nie zadał." },
        6: { title: "Kasztelan Kowal", where: "zatarty napis nad niszą",
            text: "Z rozkazu kasztelana Kowala zamurowano boczne korytarze.\nZa dużo ich było - za dużo dróg w dół.\nKowale kują zamki. Kowale trzymają klucze." },
        7: { title: "Liczenie stopni", where: "rysy na ścianie, jak u więźnia",
            text: "Liczę stopnie, żeby nie myśleć.\nCzterysta dwanaście do dziesiątej bramy.\nTrzeci od góry jest pusty. Wiedzą o tym tylko ci, którzy śpiewają." },
        8: { title: "Straż dziesiątej bramy", where: "list bez podpisu",
            text: "Straż na dziesiątym nie śpi i nie je. Zbroja pamięta słowa, które jej daliśmy.\nKto zapomni słów, niech nie schodzi.\nKto ich nigdy nie znał - niech zawróci, póki może." },
        9: { title: "Jeszcze jedno pytanie", where: "pomięta kartka, pismo się trzęsie",
            text: "Jeszcze jedno. Tylko jedno. Wiem, że mój rok jeszcze nie minął.\nAle muszę wiedzieć, czy ona... Czy on mnie zdradzi... Czy twierdza...\nJedno. Potem już nigdy." },
        // floor 10 (Map140, made by hand): the first real notes of the order - the clue toward the Heart (W9)
        "10a": { title: "Reguła straży dziesiątej bramy", where: "zwój na kamiennym cokole",
            text: "Tu kończą się piwnice, a zaczyna straż.\nKto zszedł aż tutaj, niech wie: twierdza nie strzeże skarbu. Twierdza odmierza.\nJedno pytanie na rok. Zadane przy świadkach, zapisane w księdze.\nKto pyta ponad miarę, temu Serce odpowie na wszystko naraz - i nic już nie będzie miało dla niego wagi." },
        "10b": { title: "Dziennik wartownika", where: "księga na pulpicie",
            text: "Brat Dobiesz wrócił z dołu przed świtem, choć jego rok jeszcze nie minął.\nNie powiedział, o co pytał. Od tamtej pory nie gasi świec i nie zamyka drzwi.\nMówi, że nie ma już przed czym się chować. Przeor kazał zdjąć go z warty. Za późno." },
        "10c": { title: "Napis nad windą", where: "litery wykute nad klatką",
            text: "WINDA KASZTELANA.\nW dół - tylko dla straży.\nW górę - dla każdego, kto jeszcze chce wrócić." },
        "10d": { title: "Ostatni wpis", where: "kartka wciśnięta w szczelinę muru",
            text: "Zamurowaliśmy przejścia i rozgłosiliśmy, że to przeklęta ruina. Niech myślą, że nic tu nie ma.\nZbroja zostaje na straży. Słowa zna tylko krew kasztelana - niech je powtarza, choćby jako żart przy piwie.\nNiech nikt nie pamięta, po co." },

        // ---- band 2: Kwatery i kaplica zakonu (floors 11-30): the order's daily life, the rite of one question, the cistern
        11: { title: "Rozpiska cel", where: "tabliczka przy drzwiach",
            text: "Cela pierwsza - brat furtian. Druga i trzecia - nowicjusze. Czwarta - brat kucharz.\nCela siódma - pusta.\nNikt nie chce spać tam, gdzie spał brat Dobiesz." },
        12: { title: "Kuchnia zakonu", where: "kartka nad paleniskiem",
            text: "Na dzień: dwie miski kaszy, chleb, kubek wody z cysterny.\nW post - sama woda.\nWoda jest święta, bo jest jej mało. Kto ją rozleje, ten nosi wiadra przez tydzień." },
        13: { title: "Brat furtian", where: "zapiski przy schodach",
            text: "Kto schodzi niżej niż kaplica, wpisuje się u mnie.\nKto nie wraca do wieczerzy, temu zapalam świecę.\nWczoraj zapaliłem trzy." },
        14: { title: "Reguła milczenia", where: "napis nad drzwiami refektarza",
            text: "W REFEKTARZU MILCZYMY.\nNie dlatego, że słowa grzeszą.\nDlatego, że pytania same się rodzą, kiedy się mówi." },
        15: { title: "Losowanie", where: "kartka w pustym dzbanie",
            text: "Kto zada pytanie w tym roku, rozstrzyga los: kamyki w dzbanie, jeden czarny.\nBrat Sulisław wyciągnął czarny trzeci raz z rzędu. Przeor kazał losować jeszcze raz.\nSulisław płakał. Z ulgi." },
        16: { title: "Pytania odrzucone", where: "lista w księdze, przekreślona",
            text: "Czy wojna dojdzie do wyspy? - odrzucone, za duże.\nCzy moja matka żyje? - odrzucone, nie dla zakonu.\nGdzie zgubiłem nóż? - odrzucone, za małe.\nPrzeor mówi: pytanie ma ważyć tyle, ile człowiek udźwignie." },
        17: { title: "Kapelan do nowicjuszy", where: "kazanie zapisane na marginesie",
            text: "Nie bójcie się ciemności na dole. Ciemność niczego wam nie powie.\nBójcie się światła." },
        18: { title: "Dzwon na górze", where: "kartka przybita do drzwi celi",
            text: "Gdy dzwon uderzy siedem razy, kto ma prawo pytać, schodzi.\nReszta zostaje w celach i nie wygląda przez drzwi.\nTaka jest umowa. Nie my ją wymyśliliśmy." },
        19: { title: "Skarga brata kucharza", where: "kartka w spiżarni",
            text: "Znowu ktoś wyjadł miód ze spiżarni. Znowu nikt nie wie kto.\nW zakonie, który strzeże prawdy!\nWstyd. Pytam: kto? I nikt nie chce wiedzieć." },
        21: { title: "Spis wody", where: "tabliczka przy cysternie",
            text: "Poziom w cysternie: dwa łokcie mniej niż wiosną.\nKanał pod rynek otwieramy co trzeci dzień.\nMłyn dostaje resztę. Jeśli zostanie reszta." },
        22: { title: "Sygnał wody", where: "rozkaz na ścianie śluzy",
            text: "Cztery i dwa - woda idzie.\nKiedy dzwon tak bije, brat od zasuwy schodzi i otwiera kanał.\nBez sygnału zasuwa zostaje zamknięta. Woda nie płynie sama do tych, którzy o nią nie proszą." },
        23: { title: "Brat Dobiesz", where: "list bez adresata",
            text: "Dobiesz zapytał mnie przy wieczerzy, czy wiem, co o mnie myśli przeor.\nNie wiem. Nie chcę wiedzieć.\nDobiesz się śmiał: - Ja już wiem. I o tobie też." },
        24: { title: "Lista kasztelanów (odpis)", where: "zwój w skrzyni",
            text: "...Radomił z Kruczych Skał. Sobiesław z Brodu. Bogumił z rodu Kowali, kasztelan i klucznik.\nKlucz nosi przy sobie. Słowa zna na pamięć.\nNastępny - z tego samego rodu. Jeśli ród przetrwa." },
        25: { title: "Rok bez pytania", where: "kronika, jedna linijka",
            text: "Tego roku nikt nie zapytał. Los padł na brata, który umarł zimą.\nPrzeor powiedział, że to też jest odpowiedź." },
        26: { title: "Modlitwa nad cysterną", where: "słowa wydrapane przy misie",
            text: "Daj nam wody tyle, ile trzeba.\nDaj nam prawdy tyle, ile uniesiemy.\nReszty nie dawaj." },
        27: { title: "List do domu", where: "niewysłany list nowicjusza",
            text: "Mamo, jest tu ciepło i sucho. Jemy dobrze.\nNie pytaj, czym się zajmujemy - i tak nie mógłbym powiedzieć.\nMógłbym tylko zapytać. Ale o ciebie nie wolno mi pytać." },
        28: { title: "Rozkaz przeora", where: "pieczęć na drzwiach dolnej kaplicy",
            text: "Zamknąć dolną kaplicę. Brat Dobiesz schodził tamtędy nocą.\nKto go spotka na schodach, niech nie odpowiada, gdy będzie pytał.\nNawet jeśli zapyta o imię." },
        29: { title: "Ostatni dzień kwater", where: "kartka na pustym łóżku",
            text: "Wynieśliśmy z cel wszystko, co dało się unieść.\nReszta zostaje dla tych, którzy przyjdą po nas.\nNiech myślą, że żyliśmy biednie. To prawda." },
        "20a": { title: "Księga pytań", where: "ciężka księga na pulpicie w kręgu",
            text: "Rok po roku, imię i pytanie. Przy większości pytań - odpowiedź zakryta czarnym pasem atramentu.\nRok sto czwarty: brat Wszebor - „czy brat mój żyje?” Rok sto piąty: nikt. Rok sto szósty: brat Dobiesz - „czy twierdza przetrwa?”\nRok sto szósty, drugi wpis, inną ręką: brat Dobiesz. Trzeci wpis: brat Dobiesz. Dalej strony są wyrwane." },
        "20b": { title: "Reguła rytuału", where: "zwój wiszący przy krześle pytającego",
            text: "Pytający siada w kręgu. Bracia stoją za kręgiem, plecami do światła.\nPytanie mówi się raz, głośno. Odpowiedź słyszy tylko pytający.\nKto wyjdzie z kręgu przed końcem, ten pytał na próżno. Kto zostanie po końcu - ten pyta dalej. Takiego trzeba wynieść." },
        "20c": { title: "Przeor do kasztelana", where: "list z pękniętą pieczęcią",
            text: "Bogumile, zbroja w kaplicy znów się ruszała. Mówią, że to moja dawna zbroja i że pilnuje kręgu lepiej niż ja.\nNiech pilnuje. Ja już nie umiem odmawiać.\nZejdę na dół z ostatnimi. Klucz zostaw swojemu rodowi. Słowa też." },
        "30a": { title: "Dziennik cysterny", where: "księga w niszy przy zasuwie",
            text: "Wiosna: po brzegi. Lato: łokieć mniej. Jesień: dwa.\nKanał pod rynek otwarty co trzeci dzień, jak nakazano.\nOstatni wpis: zamykamy zasuwę na dobre. Nikt na górze nie będzie wiedział, skąd szła woda. Niech myślą, że ze studni." },
        "30b": { title: "Zasuwa główna", where: "litery wykute na zasuwie, pod krukiem",
            text: "ZASUWA GŁÓWNA. CZTERY I DWA.\nOtwiera ją sygnał wody z dzwonu na górze, nie ręka.\nKto ją otworzy bez sygnału, ten zaleje rynek albo nie da nic - zasuwa sama wie, którą drogą puścić wodę." },
        "30c": { title: "Gniazdo", where: "kartka przy kościach, przegryziona",
            text: "Szczury urosły od czasu, gdy cysterna wyschła. Piją z kałuży na dnie.\nNajwiększa siedzi w gnieździe z kości. Bracia mówią, że jest stara jak zakon.\nNie schodzić na dno w pojedynkę." },

        // ---- band 3: Jaskinie i podziemna rzeka (floors 31-50): the order's scouts, the river, mushrooms and ore, the diggers
        31: { title: "Znak zwiadowcy", where: "kreda na ścianie",
            text: "Tu kończą się mury zakonu. Dalej skała robi, co chce.\nIdźcie przy lewej ścianie. Prawa kłamie." },
        32: { title: "Mapa zwiadowcy", where: "strzęp mapy",
            text: "Rzeka płynie z północy na południe. Albo odwrotnie.\nKompas tu kręci się w kółko - jakby i on wolał nie wiedzieć." },
        33: { title: "O grzybach", where: "kartka w sakwie zwiadowcy",
            text: "Szare jeść można. Fioletowych nie ruszać.\nBrat Bogusz zjadł jednego i przez dwa dni opowiadał nam nasze sny. Wszystkie się zgadzały." },
        34: { title: "Ruda", where: "zapiski kowala zakonu",
            text: "W ścianach jest żelazo. Kowale zakonu brali je stąd na zamki i klucze.\nŻelazo z dołu jest cięższe, niż powinno. Kowal mówi, że pamięta, skąd je wzięto." },
        35: { title: "Nie pić z rzeki", where: "wyryte nad brzegiem",
            text: "NIE PIĆ Z RZEKI.\nKto pił, ten słyszał potem płynącą wodę w każdej ciszy.\nWodę bierzcie z góry, w bukłakach. Każda kropla z góry jest warta więcej niż cała rzeka." },
        36: { title: "Kamieniarze", where: "ślady dłut i kilka słów",
            text: "Kamień na twierdzę ciosano tu, pod ziemią, i wyciągano szybem.\nNiektóre ślady dłut są starsze niż zakon.\nStarsze niż kamieniarze? Tego nie wiem." },
        37: { title: "Nietoperze", where: "kartka zwiadowcy",
            text: "Gdy nietoperze zrywają się naraz, gaś pochodnię i licz do stu.\nOne wiedzą, kiedy coś idzie. My dowiadujemy się za późno." },
        38: { title: "Echo", where: "dwie linijki na skale",
            text: "Zawołałem swoje imię.\nEcho wróciło z cudzym." },
        39: { title: "Lina", where: "kartka przy wbitym haku",
            text: "Brat Zbysław poszedł dalej sam. Zostawił linę przywiązaną do skały.\nLina jest. Zbysława nie ma.\nLina jest ciepła." },
        41: { title: "Kartka kopacza", where: "świeży papier, nie zakonny",
            text: "Płacą za każdy sążeń. Nie mówią, kto płaci.\nMówią tylko: szukajcie drzwi pod skałą.\nJakby skała miała drzwi." },
        42: { title: "Znak na ścianie", where: "kreda, świeża",
            text: "Strzałka w dół i trzy kreski.\nKtoś tu był przede mną. Niedawno.\nPod strzałką, inną ręką: NIE TĘDY." },
        43: { title: "Milcząca", where: "zapiski zwiadowcy zakonu",
            text: "Rzeka nie ma nazwy. Zakon nazywał ją Milczącą,\nbo tam, gdzie jest najgłębsza, nie szumi wcale." },
        44: { title: "Brat od pochodni", where: "kartka w pustej skrzynce",
            text: "Każda pochodnia, którą tu zapalisz, zgaśnie po trzech dniach.\nZostaw następną dla tego, kto pójdzie po tobie.\nTak robimy. Dlatego ktoś jeszcze wraca." },
        45: { title: "Kopacz, który przestał mówić", where: "zapiski kopacza",
            text: "Jan dotknął ściany, tam gdzie świeciła. Od wtedy siedzi i patrzy.\nKiedy pytamy, co widział, kręci głową.\nKiedy pytamy, czy nas słyszy - kiwa." },
        46: { title: "Kryształy", where: "dopisek na mapie kopaczy",
            text: "Kryształy rosną tylko tam, gdzie ktoś kiedyś płakał - tak mówił stary kopacz.\nGłupota. Ale jest ich tu dużo." },
        47: { title: "Sieci", where: "kartka owinięta pajęczyną",
            text: "Pajęczyny są tu grube jak liny. Nie przecinać nożem - ostrze grzęźnie.\nPalić. I nie patrzeć w górę, kiedy się pali." },
        48: { title: "Rozkaz (strzęp)", where: "podarty list z obcą pieczęcią",
            text: "...znaleźć wejście za każdą cenę. Świadków nie...\n...drzwi pod skałą mają być otwarte przed...\nReszta zamoczona w rzece." },
        49: { title: "Ostatni zwiadowca", where: "kartka wciśnięta w szczelinę",
            text: "Dalej nie ma już ścian zakonu. Są inne. Starsze.\nKtoś je wyrównał, zanim urodził się ktokolwiek z nas.\nZanim urodził się zakon." },
        "40a": { title: "Zwiadowcy przy brodzie", where: "dziennik pod kamieniem",
            text: "Bród na Milczącej - jedyne miejsce, gdzie da się przejść na drugi brzeg.\nPostawiliśmy most z lin. Pająki postawiły swój.\nNasz się trzyma. Na razie." },
        "40b": { title: "Winda zwiadowców", where: "tabliczka przy kołowrocie",
            text: "Szyb z czasów kamieniarzy. Kasztelan kazał go odkopać i zawiesić klatkę.\nŁańcuch jest jeden, od Ruin Zamku aż tutaj. Kto kręci kołowrotem, ten wraca." },
        "50a": { title: "Obóz kopaczy", where: "kartka przy posłaniu",
            text: "Szóstego dnia skończył się chleb. Siódmego - lampa.\nPrzekop doszedł do rzeki i tu się skończył. Od strony gór zawaliło się za nami.\nKto czyta, niech powie mojej żonie, że wrócę. Niech nie pyta, kiedy." },
        "50b": { title: "Źródło", where: "napis nad misą źródła",
            text: "ŹRÓDŁO POD SKAŁĄ. Jedyna czysta woda pod twierdzą.\nTrzy czerpania na dzień - nie więcej. Kto zaczerpnie więcej, ten zamąci je dla wszystkich.\nZakon wpisał je do regestru. Kopacze nie umieli czytać." },
        "50c": { title: "Zawał", where: "ślady na belce",
            text: "Belki pękły od strony gór. Za zawałem słychać kilofy - albo wodę.\nTunel kopaczy prowadzi stąd na wschód, do kopalni. Kiedyś znów się otworzy." },

        // ---- band 4: Ruiny starsze niż zakon (floors 51-75): carvings, the order's scholars, the first ones (left open)
        51: { title: "Uczony zakonu", where: "zapiski na woskowej tabliczce",
            text: "Te ściany nie są nasze. Nasi kamieniarze nie znali takich łuków.\nZakon nie zbudował twierdzy na pustym miejscu. Zbudował ją nad czymś." },
        52: { title: "Pismo", where: "przerysowane znaki",
            text: "Znaki biegną w trzech rzędach. Jeden rząd powtarza się co siedem znaków.\nSiedem - jak uderzenia dzwonu.\nPrzypadek? Przeor mówi, że tu nie ma przypadków." },
        53: { title: "Twarze", where: "kartka uczonego",
            text: "Na każdej płaskorzeźbie postacie mają zatarte twarze.\nNie zniszczone przez czas. Zatarte dłutem. Starannie, jedna po drugiej." },
        54: { title: "Pierwsza myśl", where: "woskowa tabliczka brata Wincentego",
            text: "Brat Wincenty: to była świątynia.\nLudzie przychodzili tu modlić się do światła i odchodzili mądrzejsi." },
        55: { title: "Druga myśl", where: "dopisek brata Radosta",
            text: "Brat Radost: to nie świątynia, tylko straż. Tacy jak my, tylko dawniej.\nNas też ktoś kiedyś znajdzie i nazwie świątynią." },
        56: { title: "Trzecia myśl", where: "zdanie zamazane węglem",
            text: "Nikt z nas nie chce powiedzieć głośno trzeciej możliwości.\nZapisuję ją tu i zamazuję:\n(dalej tylko czarna smuga węgla)" },
        57: { title: "Kości", where: "zapiski uczonego",
            text: "Kości tutaj nie leżą jak w krypcie.\nLeżą jak ludzie, którzy usiedli i już nie wstali.\nWszyscy twarzą w tę samą stronę. W dół." },
        58: { title: "Dłuto z brązu", where: "kartka owinięta wokół dłuta",
            text: "Znaleźliśmy dłuto z brązu. Ostrze wyszczerbione,\njakby ktoś zacierał nim coś twardszego niż kamień." },
        59: { title: "Rachunek lat", where: "liczby na marginesie",
            text: "Przeor kazał liczyć warstwy kurzu na posadzce.\nWyszło więcej lat, niż ma wyspa.\nPrzeor kazał przestać liczyć." },
        61: { title: "Płaskorzeźba z misą", where: "opis uczonego",
            text: "Postać nalewa wodę do misy przed światłem.\nNastępna scena: misa pusta, postać leży.\nNastępna: inna postać nalewa wodę." },
        62: { title: "Imię", where: "dwie ręce na jednej kartce",
            text: "Przy każdej scenie powtarza się jedno słowo.\nWincenty czyta je: „Pierwszy”. Radost czyta: „Ostatni”.\nRóżnica jednej kreski." },
        63: { title: "Kamienne straże", where: "zapiski uczonego",
            text: "Posągi przy przejściach mają oczy zwrócone do środka, nie na zewnątrz.\nNie pilnowały, żeby nikt nie wszedł." },
        64: { title: "Ślady stóp", where: "kartka uczonego",
            text: "W kurzu ślady bosych stóp. Prowadzą w dół. Żaden nie wraca.\nŚlady są stare. Albo nie - kurz tu nie opada." },
        65: { title: "Notatka przeora", where: "rozkaz z pieczęcią",
            text: "Nie przepisujcie tych znaków na górę.\nCo jest wyryte w kamieniu, niech zostanie w kamieniu." },
        66: { title: "Sale", where: "plan narysowany palcem w sadzy",
            text: "Sale układają się w krąg, a krąg w spiralę.\nKażda następna jest trochę mniejsza. Jakby ktoś szedł w dół i za każdym razem brał ze sobą mniej." },
        67: { title: "Brat Wincenty", where: "zapiski brata Radosta",
            text: "Wincenty przestał spać. Mówi, że rozumie już połowę znaków.\nPytam, co mówią. Odpowiada: że nie powinienem rozumieć drugiej połowy." },
        68: { title: "Pochodnie Pierwszych", where: "kartka przy pustym koszu na ogień",
            text: "Kosze na ogień stoją tu wszędzie. Puste od wieków.\nZapaliliśmy jeden. Płonął do rana bez drewna. Zgasiliśmy go wodą ze święconego dzbana." },
        69: { title: "Ołtarz bez boga", where: "zapiski uczonego",
            text: "Ołtarz jest pusty. Na nim wgłębienie - jakby coś tu kiedyś leżało,\na potem ktoś to zniósł niżej." },
        71: { title: "Pęknięcie", where: "kartka uczonego",
            text: "Tu ruiny się kończą. Dalej ściany wyglądają jak...\nnie wiem. Jak pamięć o ścianach." },
        72: { title: "Ostatnia płaskorzeźba", where: "zapiski brata Radosta",
            text: "Postać stoi sama przed światłem. Twarz nietknięta.\nWincenty mówi, że to nie jest żadna postać. Że to my." },
        73: { title: "Zakaz", where: "rozkaz na drzwiach",
            text: "Od tego miejsca bracia schodzą tylko parami.\nJeden mówi. Drugi słucha, czy tamten mówi prawdę." },
        74: { title: "Wincenty odszedł", where: "kartka zostawiona na posłaniu",
            text: "Nie szukajcie mnie.\nWiem, gdzie jestem. Pierwszy raz w życiu wiem.\n- W." },
        75: { title: "Granica", where: "zapiski brata Radosta",
            text: "Za tą salą zaczyna się to, co przeor nazywa Warstwą.\nPowietrze jest ciepłe. Słychać głosy - zawsze w języku tego, kto słucha." },
        "60a": { title: "Brama Pierwszych", where: "zapiski uczonego zakonu",
            text: "Brama jest starsza niż wszystko, co znamy. Zakon nazwał ją Bramą Pierwszych, bo nie wiedział, jak ją nazwać.\nOdźwierny stoi przy niej, odkąd ktokolwiek pamięta. Zakon nigdy go nie ruszył.\nOn też nigdy nie ruszył zakonu. Do czasu." },
        "60b": { title: "Napis nad bramą", where: "dwa odczyty na jednej tabliczce",
            text: "Odczyt brata Wincentego: TU ZACZYNA SIĘ ODPOWIEDŹ.\nOdczyt brata Radosta: TU KOŃCZY SIĘ PYTANIE.\nPrzeor: oba są złe. I oba prawdziwe." },
        "70a": { title: "Sala płaskorzeźb", where: "opis uczonego",
            text: "Siedem płaskorzeźb, jedna po drugiej. Ludzie schodzą, klękają przed światłem, wstają.\nNa szóstej nikt już nie wstaje. Na siódmej - ktoś schodzi znowu.\nNie umiemy powiedzieć, czy to opowieść o pierwszych, czy rada dla następnych." },
        "70b": { title: "Wincenty o twarzach", where: "pismo brata Wincentego, drżące",
            text: "Już wiem, czemu zatarli twarze. Nie żeby ich nie poznano.\nŻeby nikt nie zobaczył na nich tego, co zobaczyli oni.\nAlbo żeby nie zobaczył siebie. Nie wiem. Jeszcze nie." },

        // ---- band 5: Warstwa Prawdy (floors 76-99): truths - small, about the people up there (and about the hero)
        76: { who: "borgar", title: "Prawda o Borgarze", where: "kartka zapisana twoim pismem, choć nic nie pisałeś",
            text: "Borgar co noc schodzi do piwnicy i staje przed kratą.\nRano tego nie pamięta. Przestawia beczki, żeby mieć powód, dla którego tam był." },
        77: { who: "melia", title: "Prawda o Melii", where: "kartka zapisana twoim pismem",
            text: "Melia zna jeszcze jedną zwrotkę. Ósmą.\nNigdy jej nie zaśpiewała - za każdym razem, gdy zaczyna, zapomina melodii." },
        78: { who: "ozzy", title: "Prawda o Ozzym", where: "kartka zapisana twoim pismem",
            text: "Ozzy nie jest tak pijany, jak udaje.\nPije, żeby nikt nie pytał, skąd wie to, co wie." },
        79: { who: "grum", title: "Prawda o Grumie", where: "kartka zapisana twoim pismem",
            text: "Grum nosi w sakwie list, którego nie otworzył od roku.\nWie, co w nim jest. Dlatego go nie otwiera." },
        81: { who: "piekarka", title: "Prawda o Hance", where: "kartka zapisana twoim pismem",
            text: "Hanka Mączna piecze codziennie o jeden bochenek za dużo.\nOd dnia, w którym ktoś przestał po niego przychodzić." },
        82: { who: "woziwoda", title: "Prawda o Kubie", where: "kartka zapisana twoim pismem",
            text: "Kuba Woziwoda nie umie pływać i boi się głębokiej wody.\nWozi ją całe życie." },
        83: { who: "feliks", title: "Prawda o Feliksie", where: "kartka zapisana twoim pismem",
            text: "Feliks zapisuje każdą beczkę wody, którą sprzedał.\nNa osobnej kartce liczy, ile kosztowały miasto. Ta druga kartka jest dłuższa." },
        84: { who: "dzwonnik", title: "Prawda o Ambrożym", where: "kartka zapisana twoim pismem",
            text: "Ambroży raz w życiu zadzwonił źle. Nikt tego nie zauważył.\nPamięta to każdej nocy, zanim zaśnie." },
        85: { who: "kowal", title: "Prawda o Tadku", where: "kartka zapisana twoim pismem",
            text: "Tadek kuje lepiej niż jego ojciec i dobrze o tym wie.\nPozwala staremu poprawiać swoją robotę, żeby ojciec miał po co przychodzić do kuźni." },
        86: { who: "dziadek", title: "Prawda o dziadku Stachu", where: "kartka zapisana twoim pismem",
            text: "Dziadek Stach bał się nie tylko Lorda.\nBał się, że kiedy dług zniknie, nikt już nie zapuka do jego drzwi." },
        87: { who: "kapral", title: "Prawda o kapralu Wicie", where: "kartka zapisana twoim pismem",
            text: "Kapral Wit śpi z mieczem pod poduszką.\nNie boi się wroga. Boi się swoich." },
        88: { who: "ludmila", title: "Prawda o Ludmile", where: "kartka zapisana twoim pismem",
            text: "Ludmiła śpiewa kołysankę zza morza dopiero wtedy, gdy Ela już śpi.\nŚpiewa ją sobie." },
        89: { who: "lord", title: "Prawda o Lordzie", where: "kartka zapisana twoim pismem",
            text: "Lord Zaleski boi się ciszy we dworze bardziej niż czegokolwiek.\nDlatego zawsze ktoś tam musi mówić - choćby on sam, do siebie." },
        91: { who: "soltys", title: "Prawda o sołtysie", where: "kartka zapisana twoim pismem",
            text: "Sołtys Bronisław zna na pamięć, ile wiader daje studnia.\nLiczy je przed snem zamiast pacierza." },
        92: { who: "kupiec", title: "Prawda o Baltazarze", where: "kartka zapisana twoim pismem",
            text: "Baltazar Vey nie urodził się kupcem.\nLiczyć nauczył się tam, gdzie liczono ludzi. Nie mówi gdzie." },
        93: { who: "garbarz", title: "Prawda o Ignacu", where: "kartka zapisana twoim pismem",
            text: "Ignac nie znosi zapachu skór.\nRobi to, bo robił to jego ojciec, a on nigdy nie zapytał, czy musi." },
        94: { who: "rafal", title: "Prawda o Rafale", where: "kartka zapisana twoim pismem",
            text: "Rafał widział przez chwilę to, czego dotknął jego towarzysz w skale.\nOd tamtej pory nie śpi pod ścianą." },
        95: { who: "kot", title: "Prawda o Mruczku", where: "kartka zapisana twoim pismem, w rogu ślad łapy",
            text: "Mruczek schodził tu przed tobą. Wiele razy.\nKoty o nic nie pytają, więc nikt im niczego nie mówi." },
        96: { who: "hero", title: "Prawda o tobie", where: "kartka zapisana twoim pismem",
            text: "Zszedłeś tu nie dla długu, nie dla pieniędzy i nie dla Borgara.\nZszedłeś, bo chciałeś wiedzieć. Tak samo zaczynał każdy z nich." },
        97: { who: "hero", title: "Prawda o kłamstwie", where: "kartka zapisana twoim pismem",
            text: "Ktoś na górze kłamie ci prosto w oczy. Nie powiem kto.\nI tak zaczniesz się zastanawiać. To też jest cena." },
        98: { who: "straznik", title: "Prawda o strażniku", where: "kartka zapisana twoim pismem",
            text: "Nikt nie wie, co zrobił strażnik, który pytał ponad miarę.\nMoże otworzył bramy. A może tylko przestał ich pilnować - bo nic już nie miało dla niego wagi." },
        99: { who: "hero", title: "Ostatnie schody", where: "kartka zapisana twoim pismem",
            text: "Za następnymi drzwiami są trzy zamki: klucz, dzwon i pieśń.\nJeden to za mało. Trzy - więcej, niż ktokolwiek przed tobą przyniósł." },
        "80a": { who: "hero", title: "Sala echa", where: "słowa, które słyszysz, zanim je przeczytasz",
            text: "Tu każde słowo wraca dwa razy. Raz takie, jakie je powiedziałeś.\nDrugi raz - takie, jakie je pomyślałeś." },
        "80b": { title: "Ostatni zapis Radosta", where: "kartka przygnieciona kamieniem",
            text: "Doszedłem do sali, w której echo odpowiada.\nZadałem mu jedno pytanie. Odpowiedziało moim głosem i miało rację.\nWracam na górę. Jeśli nie wrócę - to też odpowiedź." },
        "90a": { title: "Ostatnia straż", where: "księga warty na stole",
            text: "Warta przy Sercu: dwóch braci, zmiana co trzy dni. Nie patrzeć w dół. Nie odpowiadać.\nOstatni wpis: zostałem sam. Zmiany nie będzie." },
        "90b": { title: "Ostatni przeor", where: "list przybity nożem do belki",
            text: "Zostaję. Ktoś musi.\nGdy przyjdzie następny, niech wie: nie byłem bohaterem. Byłem tym, który nie miał już dokąd wrócić.\nNie bądź taki jak ja. Miej dokąd wracać." },
        "90c": { title: "Lista tych, co zeszli", where: "imiona wydrapane na ścianie",
            text: "Jarosz. Dobiesz. Sulisław. Bogusz. Zbysław. Wincenty. Radost.\nPod spodem miejsce na jeszcze jedno imię - puste.\nKamień jest tam gładki, jakby ktoś często przesuwał po nim palcem." },
        "100a": { title: "Napis nad drzwiami", where: "litery nad ostatnimi drzwiami",
            text: "TRZY ZAMKI: KLUCZ, DZWON I PIEŚŃ.\nKTO MA DWA, TEN WEJDZIE.\nKTO MA TRZY, TEN WYJDZIE." }
    };

    window.Underground_Data = { VERSION: "2.0.0", MAPS, SWITCHES, IDS, SPOTS, FLOORS, LIFT, BANDS, FLOOR_NOTE, ART, TORCH_LIGHT, BLUE_LIGHT,
        SPIKE_STEPS, SPIKES, LOOT, LOOT_NAMES, GOLD_ICON, BOSSES, LOCKS, TEXT: T, ENDINGS, EPILOGUE, WHISPERS, APPARITIONS, TRUTH_WHO, NOTES };
})();
