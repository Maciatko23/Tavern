//=============================================================================
// Orzel_Data.js
//=============================================================================
// The white eagle (the user's idea 2026-10-18; the concept approved the same day: docs/orzel/KONCEPCJA.md, with one change - the adult
// is about 4 x 4 tiles, the fourth stage about 2.5). Only data here: the stages, the care's numbers, the fight's, the flight's, the
// sheets, the texts, the quests D29 / W13 (a TownQuests pack) and the residents' remarks. The logic: Orzel.js (the bird, its care,
// its fights, the quests' handlers) and Orzel_Lot.js (riding it: the camera far out, the flight over everything, the landing).
// Stands above TownQuests_Data (the pack is read there) and above Orzel.js / Orzel_Lot.js.
// DROUGHT (the user's rule): the eagle never gives the hero water; it drinks from its bowl and, older, flies off to the Order's old
// stone basins on the ridge by itself. It never drinks the sea.

/*:
 * @target MZ
 * @plugindesc Dane białego orła: etapy wzrostu, opieka, walka, lot, arkusze, teksty, zadania D29 „Jajo z grani” i W13 „Skrzydlata Straż”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Orzel_Data.js - dane białego orła
 * ============================================================================
 * Same dane (window.OrzelData). Logika: Orzel.js i Orzel_Lot.js.
 * Musi stać nad TownQuests_Data (pakiet zadań D29 i W13) i nad Orzel.js.
 * Koncepcja: docs/orzel/KONCEPCJA.md.
 * ============================================================================
 */

(() => {
    "use strict";

    // ------------------------------------------------------------------ the maps, the ids, the items, the icons
    const MAP = 175;              // "Orla Grań" (tools/orzel/gran.py) - over the mountains (Map013), the way up injected at runtime
    const GORY = 13;              // the mountains: the climbers' path up to the ridge (Orzel.js puts it in as the map loads - Map013 stays as it is)
    const IDS = [500, 539];       // Tawerna.inject: 500-509 the way up on Map013, 510-529 the ridge's things on Map175, 530-539 the thieves' camp
    const ITEM = { jajo: 182, rekawica: 183, pioro: 184 };
    const ICON = { jajo: 453, rekawica: 454, pioro: 455, orzel: 456, gniazdo: 457 };
    const KEY = 76;               // L: the eagle's menu, calling it, mounting, landing (Input name "eagle")
    // the climbers' path on Map013: the face cells of the crest over the high shelf (crest bottom 2 at x 51-55: the face rows 3-6, the shelf
    // from row 7) - an action there takes the hero up; the landing on the ridge
    // (2026-10-18: Orla Grań doubled to 80x60, tools/powieksz - its way down is on the new south edge, row 59, the path carried on to it)
    const WAY_UP = { map: GORY, cells: [[53, 6], [54, 6]], stand: [[53, 7], [54, 7]], to: MAP, land: [20, 57], dir: 8 };
    const WAY_DOWN = { cells: [[19, 59], [20, 59], [21, 59]], to: GORY, land: [53, 7], dir: 2 };

    // ------------------------------------------------------------------ the stages (0 the egg .. 5 the adult)
    // care: the days of care it takes to grow to the next one (a day counts only when it was fed, watered and - egg, chick - warm);
    // tiles: its size (the landing needs a free square of `land` x `land`); hp / st: life and wing strength; drain: food and water
    // an hour (a full belly lasts a day); pieces: raw meat (or fish) a day; hunt: what it finds itself (from the third stage: a share
    // of its food, abstract); fly: 0 - cannot, 1 - short flights (podloty), 2 - flies freely, 3 - carries the hero
    const STAGES = [
        { key: "jajo", name: "Jajo", care: 0, warmHours: 36 },
        // (the user 2026-10-18: each next stage takes three times as long as the one before - 5, 15, 45, 135 days)
        { key: "piskle", name: "Pisklę", care: 5, tiles: 0.5, land: 1, hp: 15, st: 0, pieces: 1, hunt: 0, fly: 0, warmNights: true, speed: 3.2 },
        { key: "mlody", name: "Młody", care: 15, tiles: 0.9, land: 1, hp: 25, st: 0, pieces: 2, hunt: 0, fly: 0, speed: 3.6 },
        { key: "podrostek", name: "Podrostek", care: 45, tiles: 1.2, land: 1, hp: 40, st: 40, pieces: 2, hunt: 0.25, fly: 1, speed: 4.2 },
        { key: "prawie", name: "Prawie dorosły", care: 135, tiles: 2.5, land: 3, hp: 90, st: 60, pieces: 3, hunt: 0.4, fly: 2, speed: 4.5 },
        { key: "dorosly", name: "Dorosły", care: 0, tiles: 4, land: 4, hp: 220, st: 100, pieces: 4, hunt: 0.6, fly: 3, speed: 4.5 }
    ];
    // the care days at which each stage begins (0: hatched): 0, 5, 20, 65, 200
    const STAGE_AT = (() => { const out = [0, 0]; for (let s = 1; s < 5; s++) out.push(out[s] + STAGES[s].care); return out; })();

    const CARE = {
        drainFood: 100 / 24, drainWater: 100 / 24,   // an hour (a full belly, a full crop: a day)
        // what one piece gives, by kind (x 100 / pieces of the stage): raw meat and fish whole, the cooked less (it likes it raw)
        meatValue: { raw: 1, fish: 0.9, cooked: 0.6 },
        waterPortion: 100,          // a portion poured into the bowl
        ownWaterDry: 50, ownWaterWet: 100,   // the older ones (stage 3+) drink by themselves once a day: dry day / after rain
        dayOk: 20,                  // food and water over this on average - the day counts
        bond: { start: 30, pet: 5, hand: 3, fly: 5, fight: 2, evening: 1, hungerDay: -10, thirstDay: -5, unseen: -3, cold: -5,
                obey: 30, ride: 60, guard: 80, flee: 15 },
        flee: { hungryDays: 2, awayDays: 3, callBond: 25, ridgeBond: 40 },   // the neglected one flies off to the ridge (stage 3+)
        hurtHours: 24,              // life 0: a day on its nest (never dies)
        nightFrom: 20, nightTo: 6,
        petCooldown: 20,            // game hours between two pettings that count
        grandpaFeeds: true          // stages 1-2 at grandpa's: he gives it a fish once a day when it is hungry ("To twój ptak, nie mój...")
    };

    // ------------------------------------------------------------------ the fight (frames at 60 fps; damage as the hero's blows)
    // (the user 2026-10-18: the fourth stage and the adult strike faster - gap was 34 / 32 frames; atk: [kind, damage, weight] -
    // talons 60%, beak 40%, at random)
    // (the user 2026-10-18: the damage +30% - was 6 / 12, 8 / 18, 12 / dive 30 - and twice the blows before it tires - cost was 4 / 5 / 6)
    const FIGHT = {
        3: { atk: [["dziob", 8]], gap: 40, reach: 1.3, join: 6, fleeAt: 0.5, cost: 2, distract: 0.3 },
        4: { atk: [["szpony", 16, 0.6], ["dziob", 10, 0.4]], gap: 26, reach: 1.8, join: 8, fleeAt: 0.3, cost: 2.5, knockWolf: 0.2 },
        5: { atk: [["szpony", 23, 0.6], ["dziob", 16, 0.4]], gap: 20, reach: 2.4, join: 10, fleeAt: 0.25, cost: 3, knockWolf: 0.5, knockMan: 0.3,
             dive: { dmg: 39, cost: 25, gap: 8 * 60, bearFlee: 2 }, cry: { cost: 15, poise: 20, scare: 7 } },
        stRegen: 8, stRegenFight: 2,       // wing strength a second: calm / in a fight
        tiredRest: 20 * 60,                // (old saves) frames it sat when the strength was gone
        restMin: 6 * 60, restBack: 0.7,    // out of strength in a fight: away at least this long (frames), back with this part of it
        restFar: 14,                       // the big ones rest this far from the fight (tiles), circling high
        protect: ["Game_Dog"],             // never its foes: the dog, the raven, the yards' animals, the cat, the snared ones, the Silent, children, townsfolk
        // (2026-10-18, the user's "tak": they fight back for real) the one it strikes may turn on it (on the ground only - up in the air,
        // z over `reach`, the beasts and the men lose it and go back to the hero): turn - the chance a blow of the eagle's makes it
        // turn; max - wolves of one pack on the eagle at once (the rest stay at the hero: at least `keep` of them); dmg - their blow on
        // it x this (the bear: dangerous); the men never with their bow unless archers. Its own blows on them as before (a man left 1).
        // arrows: an archer engaged (his band after the hero) within `range` tiles of it shoots at it - on the ground and in the low
        // flight (also with the hero on it: the arrows hit the bird, not him), never high up; `chance` a look (every `every` frames)
        // that he takes it as his mark; `radius`: tiles round its middle an arrow hits it (by stage); dmg: x the arrow's own
        foes: {
            reach: 20,
            poise: 5, knockGap: 240,       // (its quick blows do not shake a beast's balance - Starcia steady); a wolf thrown back at most once in so many frames (else it never strikes back)
            size: { 3: 0.25, 4: 0.7, 5: 1.2 },   // its body round its middle (tiles): a beast goes for its nearest side (Starcia.js standFor)
            wolf: { turn: 0.35, max: 2, keep: 1, dmg: 1 },
            boar: { turn: 0.4, dmg: 1 },
            bear: { turn: 0.6, dmg: 0.7 },   // (the user 2026-10-18: was 1.5 - the adult fell in a few blows; now less than the hero gets)
            man: { turn: 0.5, dmg: 1 },
            arrows: { range: 10, chance: 0.5, every: 30, dmg: 1, radius: { 3: 0.55, 4: 0.9, 5: 1.25 } },
            hurtAir: 0.35                  // ridden, its life under this part: "ranny - ląduj!" over the hero; at 0 it comes down by itself
        }
    };

    // ------------------------------------------------------------------ the flight (riding the adult: Orzel_Lot.js)
    const FLY = {
        high: 0.5, low: 1,                 // the world's scale: high - the travel, low - over the tree tops (the dive, the landing)
        zoomFrames: 45,                    // the camera's way from one to the other
        speed: { low: 7, high: 9, fast: 12 },   // px a frame
        turn: 0.09, accel: 0.18, drag: 0.94,    // radians a frame at most; the inertia
        cost: { cruise: 0.5, fast: 3, rain: 1.5 },   // wing strength a second (rain: x)
        warnAt: 0.2, minStart: 0.3,        // strength warnings / the least to take off
        bond: 60,
        edgeFog: 20,                       // frames of the cloud the eagle flies through between two maps
        lowZ: 70, highZ: 220,              // px over the ground (the shadow's offset)
        clouds: 4,
        far: { cost: 40 },                 // "lot daleki": to a landing place already known (the island's map, M in high flight)
        landSquare: 4, landSquareTown: 3   // tiles of open ground for the landing (the towns: their squares, region 31)
    };
    const LAND_REGION = 31;                // a painted region: the town's squares where the eagle may land
    // where it may land in the towns (the squares): map -> [[x0, y0, x1, y1], ...] - also without the region painted
    const TOWN_SQUARES = {
        8: [[29, 17, 76, 27], [30, 37, 73, 63], [2, 89, 101, 92]],   // (2026-10-22 the new town) the tavern's yard, the market square, the street inside the south wall
        111: [[4, 18, 84, 20], [36, 24, 55, 40], [17, 78, 36, 89]],   // (2026-10-22 the new Podgrodzie) the road through the settlement, the square, the field of the Chata pod lasem
        125: [[20, 26, 34, 34]]                                          // the quay square
    };
    // the maps' sides for the flight over the edge (tools/orzel/krawedzie.py: EDGES and ISLAND_EDGES of tools/newstart/layout.py and the
    // edge transfers found in the maps) - map -> { side: target map } (N up, S down, W left, E right; the target's opposite side)
    const SIDES = {
        3: { E: 23, N: 4, S: 17, W: 18 }, 4: { S: 3 }, 17: { N: 3 }, 18: { E: 3 },
        8: { S: 22, E: 24, W: 111 }, 13: { W: 21, E: 159, N: MAP }, 20: { S: 21 }, 21: { N: 20, W: 22, E: 13 }, 22: { E: 21, S: 23, N: 8 },
        23: { N: 22, W: 3 }, 24: { W: 8 }, 111: { E: 8, W: 125 }, 125: { E: 111, N: 155, S: 162 }, 155: { S: 125, E: 157 },
        157: { W: 155, E: 159 }, 159: { W: 157, S: 13 }, 162: { N: 125, W: 165 }, 165: { E: 162 }, 168: {}, 175: { S: 13 }
    };
    // maps where the eagle never lands (and never comes down to on foot): the inside ones are found by Survival.isOutdoors
    const NO_LAND = [1, 14, 120];

    // ------------------------------------------------------------------ the pictures (tools/orzel/build_sheets.py builds them)
    // img/system/Orzel<stage>.png: 8 rows (S, SW, W, NW, N, NE, E, SE) x the cells - 0 standing, walk.., atk.., flap..; cell: px; feet: the
    // feet's row in the cell (the anchor); hit: the attack's cell that strikes
    const SHEETS = {
        1: { file: "Orzel1", cell: 48, feet: 40, walk: [1, 6], atk: null, flap: null,
            pose: { file: "Orzel1_Poza", cell: 48, feet: 40, sit: [0, 6], sleep: [6, 4], hurt: [10, 6], preen: [16, 6], preenFrom: "stand" } },
        2: { file: "Orzel2", cell: 72, feet: 59, walk: [1, 6], atk: null, flap: [7, 6],
            pose: { file: "Orzel2_Poza", cell: 72, feet: 59, sit: [0, 4], sleep: [4, 2], hurt: [6, 4], preen: [10, 6], preenFrom: "stand" } },
        3: { file: "Orzel3", cell: 96, feet: 80, walk: [1, 6], atk: [7, 6], flap: [13, 6], hit: 3,
            pose: { file: "Orzel3_Poza", cell: 96, feet: 80, sit: [0, 4], sleep: [4, 4], hurt: [8, 4], preen: [12, 4], preenFrom: "sit" } },
        4: { file: "Orzel4", cell: 184, feet: 156, walk: [1, 6], atk: [7, 6], flap: null, hit: 3,
            pose: { file: "Orzel4_Poza", cell: 184, feet: 156, sit: [0, 4], sleep: [4, 2], hurt: [6, 4], preen: [10, 4], preenFrom: "sit" } },
        5: { file: "Orzel5", cell: 256, feet: 253, walk: [1, 6], atk: [7, 8], flap: null, hit: 4,
            pose: { file: "Orzel5_Poza", cell: 256, feet: 253, sit: [0, 3], sleep: [3, 2], hurt: [5, 2], preen: [7, 4], preenFrom: "none" } }
    };
    // in the air, seen from above, turned by code: the frames of a wingbeat (cycle: the order they play; glide: wings spread and still;
    // dive: wings swept back); saddle: where the rider sits (px in the cell); scale: drawn smaller than the cell (the fourth stage is a
    // smaller bird than the adult - its sheet fills the cell as much as the adult's; the rider keeps his own size)
    const AIR = {
        4: { file: "Orzel4_Lot", cell: 256, frames: 9, cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8], glide: 0, dive: 6, saddle: [128, 105], scale: 0.72 },
        5: { file: "Orzel5_Lot", cell: 256, frames: 9, cycle: [8, 7, 6, 5, 4, 3, 4, 5, 6, 7], glide: 8, dive: 0, saddle: [128, 96] }
    };
    const ROWS = { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 };   // numpad facing -> the row
    // (2026-10-18) the poses from the front (img/system/Orzel<n>_Poza.png, one row; tools/orzel/build_sheets.py): sitting down (held at
    // its last frame, breathing), asleep (head sunk, eyes shut), lying hurt, preening (there and back); preenFrom: the pose it starts
    // from - the small ones preen standing, the adult ("none") lies in its nest like a brooding bird and does not preen lying; speed:
    // frames of the picture a game frame
    const POSE_SPEED = { sit: 0.14, sleep: 0.08, hurt: 0.1, preen: 0.1, up: 0.25 };

    // ------------------------------------------------------------------ the nests (Farming buildings; tools/orzel/gniazda.py)
    // The bird sits IN the bowl: drawn after the nest's picture and before its front layer (rim: img/system/<rim>.png, the same canvas -
    // the lip and the side walls with their sticks, all that stands in front of it), so it goes out of sight behind branches. cx: the bowl's middle from the picture's
    // bottom-middle (the building's anchor), px; lip: the lip's height over the picture's bottom at the middle, px; sink: per stage, how
    // far under the lip its feet are (px - the bigger the bird, the deeper it sits); stages: which stages sit in it - the adult does not
    // fit the 3 x 3 nest (it sleeps on the ground beside it)
    const NESTS = {
        orzel_kosz: { rim: "Farm_OrzelKosz_Przod", cx: 0, lip: 14, sink: { 1: 6, 2: 9 }, stages: [1, 2] },
        orzel_gniazdo: { rim: "Farm_OrzelGniazdo_Przod", cx: 2, lip: 44, sink: { 1: 8, 2: 10, 3: 10, 4: 22 }, stages: [1, 2, 3, 4] },
        orzel_grzeda: { rim: "Farm_OrzelGrzeda_Przod", cx: 0, lip: 84, sink: { 1: 10, 2: 12, 3: 14, 4: 28, 5: 46 }, stages: [1, 2, 3, 4, 5] }
    };
    // the nights' and the idle rests when it goes with him: he stands still this long (frames) - it sits; at night longer - it sleeps
    const IDLE = { sit: 15 * 60, sitNight: 8 * 60, sleepNight: 20 * 60, near: 2.5, far: 3.5, preen: 0.05 };

    // ------------------------------------------------------------------ the texts
    const TX = {
        defaultName: "Śnieżny",
        stageUp: ["", "Pisklę się wykluło!", "{imie} podrósł - już nie pisklę.", "{imie} wyrósł na podrostka. Pierwsze pióra, pierwsze podloty.",
            "{imie} jest prawie dorosły. Lata, gdzie chce, i uniesie cię na grzbiecie (L).", "{imie} jest dorosły - największy i najsilniejszy. Z tobą na grzbiecie nurkuje na wrogów."],
        eggCold: "Jajo stygnie. Ogrzej je: przy ogniu, w domu albo śpiąc z nim przy sobie.",
        eggWarm: "Jajo jest ciepłe ({h}/{n} godz.)",
        eggKnock: "Coś puka w skorupkę od środka...",
        hatch: ["(Skorupka pęka. Ze środka wypełza mokre, białe pisklę i od razu wpatruje się w ciebie.)", "Ma cię za matkę. Cóż - teraz jesteś."],
        noEgg: "Nie masz jaja",
        noMeat: "Nie masz mięsa ani ryby",
        noWater: "Nie masz wody: nabierz do wiadra albo bukłaka",
        bowlFull: "Miska jest pełna",
        fed: "{imie} zjadł {co}",
        notHungry: "{imie} nie jest głodny",
        pet: ["{imie} stroszy pióra ♥", "{imie} trąca cię dziobem ♥", "{imie} przymyka oczy ♥"],
        petAgain: "{imie} lubi to, ale wystarczy na dziś",
        follow: "{imie} idzie za tobą", followAir: "{imie} leci z tobą", rose: "{imie} wzbił się w powietrze",
        stay: "{imie} zostaje tutaj", home: "{imie} wraca do gniazda", noNest: "Najpierw postaw mu gniazdo",
        cold: "{imie} zmarzł w nocy - trzymaj go przy ogniu albo w domu",
        hungry: "{imie} jest głodny", thirsty: "{imie} chce pić",
        fled: ["{imie} krąży nad polem i krzyczy...", "...i odlatuje w stronę gór."],
        fledNote: ["Orzeł odleciał", "Zaniedbałem go. {imie} odleciał na Orlą Grań. Za trzy dni mogę go zawołać (L) albo pójść po niego na grań z mięsem."],
        callTooSoon: "{imie} jeszcze nie wróci. Daj mu czas ({d} dni).",
        callBack: "{imie} wraca z gór!",
        ridgeBack: "{imie} sfruwa ci na rękę. Wrócił.",
        ridgeBackNote: ["Wrócił", "Poszedłem po niego na Orlą Grań z mięsem. {imie} sfrunął mi na rękę i wrócił ze mną."],
        hurt: "{imie} ranny - odlatuje do gniazda", healed: "{imie} wyzdrowiał",
        hurtAir: "{imie} jest ranny - ląduj!", hurtDown: "{imie} opada - jest ranny!",
        tired: "{imie} jest zmęczony - musi odpocząć",
        tiredAway: "{imie} jest zmęczony - odlatuje odpocząć", tiredHop: "{imie} jest zmęczony - odskakuje na bok odpocząć",
        restedBack: "{imie} odpoczął - wraca do walki!",
        outside: "{imie} czeka na zewnątrz",
        tooBig: "{imie} się tu nie zmieści",
        noSneak: "Orzeł jest za duży, żeby się skradać - {imie} czeka",
        cannotFly: "{imie} jeszcze nie uniesie człowieka",
        bondLow: "{imie} jeszcze ci nie ufa na tyle (więź {b}/{n})",
        tooTired: "{imie} jest za zmęczony na lot ({p}%)",
        storm: "Nie w taką pogodę - {imie} nie wystartuje w burzę",
        notHere: "Tu {imie} nie wystartuje - za ciasno albo pod dachem",
        // the flight
        mount: "Wsiadasz na grzbiet. Trzymaj się!",
        high: "Wysoko", low: "Nisko",
        landOk: "L: tu wylądujesz", landNo: "Tu nie wylądujesz",
        landWhyTrees: "Za ciasno: drzewa, skały albo budynki",
        landWhyWater: "Pod tobą woda", landWhyCrops: "Nie siadaj na uprawach",
        landWhyMap: "Tu nie wolno lądować", landWhyTown: "W mieście lądujesz tylko na placu",
        landWhyHigh: "Zniż lot (Q), żeby wylądować",
        tiredAir: "{imie} słabnie - wyląduj!", forced: "{imie} musi wylądować",
        stormLand: "Burza! {imie} schodzi do lądowania",
        edgeSea: "Dalej tylko morze.", edgeFog: "Za gęsta mgła - {imie} zawraca.", edgeMountain: "Za wysokie góry - {imie} zawraca.",
        noSaveAir: "Najpierw wyląduj",
        dive: "Nurkuj!", diveTired: "{imie} jest za zmęczony na nurkowanie", diveWait: "{imie} łapie oddech",
        diveHigh: "Najpierw zniż lot (Q)", diveYoung: "{imie} jeszcze nie nurkuje z tobą na grzbiecie - dopiero dorosły",
        farTitle: "Lot daleki", farNone: "Nie znasz jeszcze żadnego lądowiska poza tym",
        farHelp: "Lecisz nad chmurami do miejsca, w którym już raz wylądowałeś ({c}% sił).",
        panelTitle: "Lot: {imie}", panelStrength: "Siła skrzydeł",
        panelKeys: "WASD / strzałki: lot   Shift: szybciej   Spacja: nurkuj   Q: wyżej / niżej   L: ląduj   M: lot daleki",
        // the menu
        menuTitle: "Orzeł: {imie}", menuEgg: "Orle jajo",
        mPet: "Pogłaszcz", mFeed: "Nakarm", mWater: "Nalej wody", mFollow: "Chodź za mną", mStay: "Zostań tu", mHome: "Wracaj do gniazda",
        mFly: "Leć!", mAttack: "Atakuj!", mEggPut: "Połóż jajo w koszu", mEggTake: "Weź jajo z kosza",
        hPet: "Raz dziennie głaskanie umacnia więź.", hFeed: "Surowe mięso albo ryba (pieczone mniej syci, owoców nie je).",
        hWater: "Porcja wody z wiadra albo bukłaka do jego miski. Starszy orzeł pije też sam, w górach.",
        hFollow: "Idzie (albo leci) za tobą, także na inne mapy. Przed domami i pod ziemią czeka na zewnątrz.",
        hStay: "Siada tutaj i czeka.", hHome: "Wraca do gniazda i tam czeka (je i pije z miski).",
        hFly: "Wsiadasz mu na grzbiet i lecisz nisko nad koronami drzew (Q - wyżej: kamera się oddala; L - lądowanie).",
        hAttack: "Rzuca się na wroga, którego masz na celu (F).",
        status: "Życie {hp}/{mhp} · Siła {st}/{mst} · Jedzenie {f} · Woda {w} · Więź {b} · {etap}{dni}",
        statusEgg: "Ciepło: {h}/{n} godz. · {gdzie}",
        // the nest's menu lines (Farming's hook)
        nestFood: "Miska: jedzenie", nestNote: "Miska: jedzenie {f}, woda {w}/{max}",
        basketEmpty: "Kosz czeka na jajo.", basketEgg: "W koszu leży orle jajo ({h}/{n} godz. ciepła).",
        // the ridge (Map175)
        eggTake: ["(Pod nawisem, w szczelinie, leży jedno jajo - całe. Jeszcze ciepłe.)", "> Ostatnie..."],
        eggTaken: "Masz orle jajo. Trzeba je ogrzać: przy ogniu, w domu albo śpiąc z nim przy sobie.",
        mother: ["(Biała orlica leży w kamieniach. Wielka jak wóz. W piersi tkwią dwie strzały z lotkami z białym okiem.)",
            "(Ktoś wyrwał jej najdłuższe lotki z obu skrzydeł. Na trofeum.)"],
        arrows: ["(Strzały czarne, groty kute, lotki ze znakiem otwartego oka.)", "> Czarne Oczy..."],
        bowl: ["(Kamienna misa wykuta w skale, większa niż koryto. Po deszczu stoi w niej woda - nie dla ludzi.)",
            "(Na krawędzi wyryto orła nad krukiem.)"],
        carving: ["(Na płycie wyryty orzeł z rozpostartymi skrzydłami, a pod nim kruk.)", "(Pod spodem napis zakonu, zatarty: ...STRAŻ...)"],
        camp: ["(Zimne ognisko, kości, pusta manierka i zerwana sieć. Myśliwi siedzieli tu kilka dni.)"],
        noEggYet: ["(Gniazdo jest całe, ale puste. Orły krążą wysoko nad granią i krzyczą.)", "> Lepiej ich nie płoszyć."],
        wayUp: "Ścieżka wspinaczy prowadzi na grań",
        wayUpLocked: "Ściana jest za stroma. Ktoś tu się kiedyś wspinał - stare kołki w skale.",
        // the theft (W13 ch. 4)
        theftWarn: "Ktoś kręci się nocą przy gnieździe...",
        theftDone: ["Gniazdo jest puste. Sieć, ślady butów, czarna lotka ze znakiem oka.", "Zabrali go w góry."],
        theftSaved: "Złodzieje uciekli bez łupu!",
        // the epilogue's line (Underground_Data EPILOGUE reads Orzel.epilogue())
        // (the keys: Underground_Data ENDINGS - the ending chosen at the Heart)
        epilogue: {
            gone: "Biały orzeł nie wrócił z gór. Rybacy mówią, że czasem widzą go nad granią.",
            zniszczyc: "{imie} odleciał na Orlą Grań, gdy Serce ucichło. Wraca co wiosnę i siada na dachu tawerny.",
            straznik: "{imie} siedzi na dzwonnicy w każdą Noc Pytania i patrzy na morze, jak Skrzydlata Straż przed wiekami.",
            uwolnic: "Kiedy prawda rozlała się po mieście, tylko {imie} niczego się nie bał. Krąży nad wyspą jak dawniej.",
            zapieczetowac: "{imie} krąży o świcie nad tawerną. Dzieci z miasteczka liczą, ile razy okrąży wieżę.",
            any: "{imie} krąży o świcie nad tawerną."
        }
    };

    // ------------------------------------------------------------------ the quests (a TownQuests pack; docs/QUESTY.md, the next free D and W)
    const D29 = {
        id: "D29", kind: "D", title: "Jajo z grani", giver: "latarnik", icon: ITEM.jajo,
        where: "przylądek z latarnią → Góry → Orla Grań", when: "Akt II, po burzy",
        desc: "W noc burzy Bazyli widział z laterny białe skrzydła nad granią w górach - i pochodnie. Orły nie latają w burzę bez powodu.",
        offer: {
            cond: { hours: [14, 22], fn: "d29Pora" },
            say: ["W noc burzy patrzyłem na góry. W błyskach - białe skrzydła nad granią. Ogromne. I pochodnie pod nimi.",
                "Mój dziad mówił, że nad kamieniołomem gnieździły się kiedyś białe orły zakonu. Skrzydlata Straż. Myślałem, że to bajka.",
                "Pochodnie w burzę, na grani? Tam nikt nie chodzi po dobremu."],
            yes: "Pójdę zobaczyć.", no: "To nie moja sprawa.",
            accept: ["Na wysokiej półce nad kamieniołomem są stare kołki w skale - wspinacze zakonu tamtędy chodzili. Uważaj na siebie."],
            decline: ["Jak chcesz. Wiatr i tak wszystko zapisze. Ja też."]
        },
        steps: [
            { type: "custom", check: "d29Jajo", text: "Wejdź na Orlą Grań (Góry, wysoka półka nad kamieniołomem: stare kołki w skale) i zobacz, co się stało z gniazdem." }
        ],
        reward: { xp: 100, flag: "orzelJajo",
            note: ["Strzały z białym okiem", "Na Orlej Grani leży martwa biała orlica - zastrzelona strzałami Czarnych Oczu, z wyrwanymi lotkami. W gnieździe ocalało jedno jajo. Wziąłem je. Trzeba je ogrzać: przy ogniu, w domu albo śpiąc z nim przy sobie."] }
    };
    const W13 = {
        id: "W13", kind: "W", title: "Skrzydlata Straż", giver: null, icon: ITEM.jajo,
        where: "dom, Orla Grań, pustelnia na klifie, dwór Lorda", when: "Akt II",
        desc: "Wychowuję białego orła z jaja z Orlej Grani. Zakon miał kiedyś takie orły - Skrzydlatą Straż.",
        autoStart: "w13Start",
        steps: [
            { ch: 1, type: "custom", check: "w13Wyklucie", vars: "w13Vars", text: "Ogrzej orle jajo: {cieplo}. Ciepło jest przy ogniu, w domu albo gdy śpisz z jajem przy sobie." },
            { ch: 2, type: "talk", to: "grandpa", text: "Pokaż pisklę dziadkowi.",
                say: ["> Dziadku... wykluł się. Orzeł. Biały."],
                done: ["(Dziadek długo patrzy na pisklę.) Biały... Skąd to masz? ...Z grani nad kamieniołomem?",
                    "Dziad mi mówił, że kruczarze mieli kiedyś i orły. Kruki nosiły listy, a białe orły pilnowały wybrzeża. Skrzydlata Straż. Myślałem, że zmyśla, jak zawsze.",
                    "No to masz teraz kłopot na dwadzieścia lat. Karm go surowym mięsem, nie dawaj zmarznąć. I nie pozwól mu zjeść mojego kota."],
                reward: { xp: 40, note: ["Skrzydlata Straż", "Dziadek mówi, że kruczarze - nasz ród - trzymali kiedyś nie tylko kruki, ale i białe orły zakonu. Kruki nosiły listy, orły pilnowały wybrzeża. Skrzydlata Straż."] } },
            { ch: 3, type: "talk", to: "pustelnik", need: [[ITEM.pioro, 1]], text: "Zanieś pióro białego orła bratu Kleofasowi (pustelnia na klifie). Pióra zrzuca podrostek.",
                remind: ["Orzeł? Biały? Przynieś mi pióro, to uwierzę."],
                say: ["> Bracie, to pióro mojego orła. Białego."],
                done: ["(Kleofas obraca pióro pod światło.) Na Serce... „Pióro długie na łokieć, białe jak sól”. Tak pisze Księga gniazd.",
                    "Skrzydlata Straż. Zakon hodował je na Orlej Grani - kruczarze, twój ród. Wypatrywały okrętów, zanim ktokolwiek zobaczył żagiel.",
                    "W Księdze jest też, że orły piły tylko z kamiennych mis na grani. Deszczówkę. I że jeźdźca nosi tylko orzeł, który sam go wybrał.",
                    "Postaw mu grzędę, kiedy dorośnie. Prawdziwą, z pnia. Napiszę ci, jak."],
                reward: { xp: 80, flag: "orzelKroniki", note: ["Księga gniazd", "Brat Kleofas przeczytał w Księdze gniazd o Skrzydlatej Straży: białe orły zakonu wychowywane przez kruczarzy na Orlej Grani, wypatrywały okrętów. Piły deszczówkę z kamiennych mis. Jeźdźca nosi tylko orzeł, który sam go wybrał. Kleofas pokazał mi, jak zbudować Orlą grzędę."] } },
            { ch: 4, type: "custom", check: "w13Podlot", vars: "w13Vars", text: "Zrób w garbarni Rękawicę sokolnika (skóra, ścięgno) i naucz podrostka siadać na ręce: {gdzie}" },
            { ch: 5, type: "custom", check: "w13Kradziez", vars: "w13Vars", text: "{kradziez}" },
            { ch: 6, type: "talk", to: "lord", text: "Lord Zaleski chce widzieć białego orła. Porozmawiaj z nim przed dworem (8–20).",
                say: ["> Jaśnie panie, słyszałem, że pan o mnie pytał."],
                done: ["Pytałem, pytałem! Cała wyspa mówi o białym orle! Wiesz, młodzieńcze, że w herbie Zaleskich jest orzeł? Nad krukiem! To znak!",
                    "Sprzedaj mi go. Dam ci... tysiąc pięćset. Nie? To chociaż - w dzień mojej uczty niech przeleci nad dworem. Goście będą mówić o tym latami!"],
                choice: { ask: ["(Co odpowiesz Lordowi?)"], options: [
                    { label: "Orzeł nie jest na sprzedaż. I nie lata na pokaz.", say: ["Ach! Hm. Rozumiem. Wolny ptak, wolny człowiek. ...Szkoda."], flag: "orzelLordOdmowa", reward: { xp: 40 } },
                    { label: "Przelecę z nim nad dworem.", say: ["Wspaniale! Wspaniale! Powiem Feliksowi, żeby przygotował balkon. To będzie dzień!"], flag: "orzelLordPokaz", reward: { xp: 60, opinion: 3 } }
                ] } },
            { ch: 7, type: "custom", check: "w13Lot", vars: "w13Vars", text: "{lot}" }
        ],
        reward: { xp: 200,
            note: ["Skrzydlata Straż", "Pierwszy lot na grzbiecie {imie}. Z góry wyspa jest mała: latarnia, port, dym z komina dziadka. Ostatni orzeł Skrzydlatej Straży wybrał mnie na jeźdźca."] }
    };
    const REMARKS = [
        { id: "orzelJanek", who: "janek", flag: "orzelLot", lines: ["Widziałem cię! Nad zatoką! Na orle! Mówiłem żonie, nie uwierzyła. Mówi, że za dużo słońca."] },
        { id: "orzelKleofas", who: "pustelnik", flag: "orzelLot", lines: ["Jeździec Skrzydlatej Straży. W kronikach ostatni był trzysta lat temu. ...Tylko nie lataj nad pustelnią. Pszczoły się denerwują."] },
        { id: "orzelBazyli", who: "latarnik", flag: "orzelJajo", lines: ["Białe orły... W noc burzy wiatr niósł krzyk. Zapisałem go. Nie wiem jak, ale zapisałem."] },
        { id: "orzelRoch", who: "przemytnik", flag: "orzelLot", lines: ["Przemytnik z orłem byłby bogaty. Ty jesteś tylko głupi. I szczęśliwy. Zazdroszczę."] },
        { id: "orzelAmbrozy", who: "dzwonnik", flag: "orzelLot", lines: ["Orzeł nad dzwonnicą... Mój mistrz mówił, że Skrzydlata Straż siadała na wieży, kiedy szedł okręt. Dzwoniło się wtedy cztery i jeden."] }
    ];
    const VITEMS = {};
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Orzel", quests: [D29, W13], vitems: VITEMS, remarks: REMARKS });

    window.OrzelData = { MAP, GORY, IDS, ITEM, ICON, KEY, WAY_UP, WAY_DOWN, STAGES, STAGE_AT, CARE, FIGHT, FLY, LAND_REGION, TOWN_SQUARES, SIDES,
        NO_LAND, SHEETS, AIR, ROWS, POSE_SPEED, NESTS, IDLE, TX, D29, W13, REMARKS };
})();
