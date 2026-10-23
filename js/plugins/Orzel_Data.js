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
        { key: "jajo", care: 0, warmHours: 36 },
        // (the user 2026-10-18: each next stage takes three times as long as the one before - 5, 15, 45, 135 days)
        { key: "piskle", care: 5, tiles: 0.5, land: 1, hp: 15, st: 0, pieces: 1, hunt: 0, fly: 0, warmNights: true, speed: 3.2 },
        { key: "mlody", care: 15, tiles: 0.9, land: 1, hp: 25, st: 0, pieces: 2, hunt: 0, fly: 0, speed: 3.6 },
        { key: "podrostek", care: 45, tiles: 1.2, land: 1, hp: 40, st: 40, pieces: 2, hunt: 0.25, fly: 1, speed: 4.2 },
        { key: "prawie", care: 135, tiles: 2.5, land: 3, hp: 90, st: 60, pieces: 3, hunt: 0.4, fly: 2, speed: 4.5 },
        { key: "dorosly", care: 0, tiles: 4, land: 4, hp: 220, st: 100, pieces: 4, hunt: 0.6, fly: 3, speed: 4.5 }
    ];
    Watki.scal(STAGES, "orzel", "etapy");   // (its words: js/teksty/orzel.txt, etapy)
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
    const TX = Watki.teksty("orzel");

    // ------------------------------------------------------------------ the quests (a TownQuests pack; docs/QUESTY.md, the next free D and W)
    const D29 = {
        id: "D29", kind: "D", giver: "latarnik", icon: ITEM.jajo,
        offer: {
            cond: { hours: [14, 22], fn: "d29Pora" }
        },
        steps: [
            { type: "custom", check: "d29Jajo" }
        ],
        reward: { xp: 100, flag: "orzelJajo" }
    };
    Watki.scal(D29, "orzel", "zadania.D29");   // (its words: js/teksty/orzel.txt, zadania.D29)
    const W13 = {
        id: "W13", kind: "W", giver: null, icon: ITEM.jajo,
        autoStart: "w13Start",
        steps: [
            { ch: 1, type: "custom", check: "w13Wyklucie", vars: "w13Vars" },
            { ch: 2, type: "talk", to: "grandpa", 
                reward: { xp: 40 } },
            { ch: 3, type: "talk", to: "pustelnik", need: [[ITEM.pioro, 1]], 
                reward: { xp: 80, flag: "orzelKroniki" } },
            { ch: 4, type: "custom", check: "w13Podlot", vars: "w13Vars" },
            { ch: 5, type: "custom", check: "w13Kradziez", vars: "w13Vars" },
            { ch: 6, type: "talk", to: "lord", 
                choice: { options: [
                    { flag: "orzelLordOdmowa", reward: { xp: 40 } },
                    { flag: "orzelLordPokaz", reward: { xp: 60, opinion: 3 } }
                ] } },
            { ch: 7, type: "custom", check: "w13Lot", vars: "w13Vars" }
        ],
        reward: { xp: 200 }
    };
    Watki.scal(W13, "orzel", "zadania.W13");   // (its words: js/teksty/orzel.txt, zadania.W13)
    const REMARKS = [
        { id: "orzelJanek", who: "janek", flag: "orzelLot" },
        { id: "orzelKleofas", who: "pustelnik", flag: "orzelLot" },
        { id: "orzelBazyli", who: "latarnik", flag: "orzelJajo" },
        { id: "orzelRoch", who: "przemytnik", flag: "orzelLot" },
        { id: "orzelAmbrozy", who: "dzwonnik", flag: "orzelLot" }
    ];
    Watki.scal(REMARKS, "orzel", "uwagi");   // (its words: js/teksty/orzel.txt, uwagi)
    const VITEMS = {};
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Orzel", quests: [D29, W13], vitems: VITEMS, remarks: REMARKS });

    window.OrzelData = { MAP, GORY, IDS, ITEM, ICON, KEY, WAY_UP, WAY_DOWN, STAGES, STAGE_AT, CARE, FIGHT, FLY, LAND_REGION, TOWN_SQUARES, SIDES,
        NO_LAND, SHEETS, AIR, ROWS, POSE_SPEED, NESTS, IDLE, TX, D29, W13, REMARKS };
})();
