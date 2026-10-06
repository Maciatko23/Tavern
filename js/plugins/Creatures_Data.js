//=============================================================================
// Creatures_Data.js
//=============================================================================
// The data of the creatures of the ruins (combat stage 4, docs/WALKA.md 11.4): the eight kinds the underground places (rat swarms,
// spiders, empty armours, bat swarms, the drowned, stone sentinels, the wraiths of truth, the shadows with a resident's face), the
// bosses of the hand-made floors and the guardian of the tenth gate; their life, balance, attributes by level, moves and timings, what
// they leave; the "truths" the wraiths speak. Data only - Creatures.js reads it (window.CreaturesData).

/*:
 * @target MZ
 * @plugindesc Dane stworów z ruin (etap 4 walki): szczury, pająki, puste zbroje, nietoperze, topielce, kamienniki, upiory, cienie, bossowie pięter - życie, atrybuty, ciosy, łup, „prawdy”. Musi być nad Creatures.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Creatures_Data.js - dane stworów z ruin
 * ============================================================================
 * Same dane: czyta je Creatures.js. Czasy ciosów są w klatkach (60 na
 * sekundę), odległości w polach mapy. Poziom stwora zależy od miejsca (notatka
 * mapy <Poziom:N> - w podziemiach piętro), nie od poziomu bohatera.
 * Opis całości: docs/WALKA.md, rozdział 11, etap 4.
 * ============================================================================
 */

(() => {
    "use strict";

    // the item ids the loot uses (data/Items.json): no water and nothing to drink (the drought stays - docs/STORY.md)
    const ITEM = { stone: 64, ore: 85, iron: 86, nails: 88, fibre: 92, rope: 93, torch: 59, bandage: 152, arrows: 127, steel: 143, coal: 79, honey: 76 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The kinds. Common fields:
    //   name, look (the sheets: anim8/Cr_<look>_Walk8 walking, _Atk8 the blows, _Die8 its end; 4-way $Cr_<look>*.png when the 8-way looks
    //   are off), floors: [from, to] - the depth it belongs to (a marker of a generated floor outside it gets a kind that fits, see FIT),
    //   swarm: [min, max] - how many come from one marker (the rats, the bats), hp, poise (balance), stun (frames it reels), radius (body,
    //   tiles), lv (levels over the place's), xp (beaten, level 1 - Combat.KILL_XP has the same), attr: base at level 1 and growth a level
    //   (str, dex, con, per, wil - as the hero's), speed (walking, MZ move speed: 4 = the hero's), chase (after the hero), sight (tiles),
    //   turn (radians a frame its front turns - a slow one is got behind), cell (the 8-way sheets' cell), scale (drawn bigger / smaller),
    //   moves: { name: { dmg, poise, reach, cone, at (comes in to this), windup, hitAt, strike, recover, wound, knock, ... } },
    //   loot: [[item, chance, n]], gold: [min, max, chance], remains: what lies after it (the action button searches it)
    // ---------------------------------------------------------------------------------------------------------------------------
    const KINDS = {
        // RATS: a swarm. They spread round the hero and dart in to bite - two at most at a time, each with a short crouch (and a squeak)
        // first. Weak alone, a nuisance together: Szeroki zamach (Walka wręcz) mows them down.
        szczur: {
            name: "Szczur", plural: "Szczury", look: "Rat", floors: [1, 30], swarm: [2, 4], swarmPer: 15,
            hp: 14, poise: 8, stun: 36, radius: 0.32, lv: -1, xp: 4, cell: 68, scale: 0.8,
            attr: { base: { str: 3, dex: 9, con: 3, per: 8, wil: 1 }, grow: { str: 0.4, dex: 0.6, con: 0.35, per: 0.4, wil: 0.1 } },
            speed: 4.3, chase: 4.7, sight: 6, turn: 0.35, attackers: 2, ring: 1.6,
            moves: { bite: { dmg: 4, poise: 4, reach: 1.05, cone: 0.35, at: 1.3, windup: 16, hitAt: 3, strike: 12, recover: 34, lunge: 0.8, wound: 0.06, knock: 0.12 } },
            loot: [], gold: [1, 3, 0.15], remains: "rat"
        },
        // GIANT SPIDER: keeps 3-5 tiles off and spits a web (a grey lump - a roll or a step aside, a shield stops it; it sticks: the hero walks
        // slowly a while, and the web stays on the floor - stepping in it slows too), then rushes in to bite (poison - a wound) and springs back.
        pajak: {
            name: "Pająk", look: "Spider", floors: [1, 50], hp: 50, poise: 30, stun: 50, radius: 0.5, lv: 0, xp: 25, cell: 80,
            attr: { base: { str: 6, dex: 9, con: 5, per: 9, wil: 3 }, grow: { str: 0.6, dex: 0.9, con: 0.6, per: 0.6, wil: 0.2 } },
            speed: 3.8, chase: 4.4, sight: 7, turn: 0.18, keep: [2.8, 5.2],
            moves: {
                bite: { dmg: 10, poise: 18, reach: 1.35, cone: 0.35, at: 1.5, windup: 20, hitAt: 3, strike: 12, recover: 26, lunge: 1.0, wound: 0.3, knock: 0.3, hop: 2 },
                web: { dmg: 3, poise: 6, range: 7, windup: 30, recover: 30, speed: 0.17, slow: 200, patch: 600, cd: 170 }
            },
            loot: [[ITEM.fibre, 0.7, 3], [ITEM.rope, 0.12, 1]], gold: [0, 0, 0], remains: "spider"
        },
        // EMPTY ARMOUR: slow and heavy. A light blow from the front only rings on the plate (15% of it, no balance) - a heavy blow, a blow
        // in the back or from hiding counts in full. It turns slowly: get behind it. Two blows: the cut and the overhead (breaks the guard).
        // Felled the first time it falls into pieces and gets up again (40% of its life) - unless the pile is hit while it lies.
        zbroja: {
            name: "Pusta zbroja", look: "Armor", floors: [11, 30, 51, 75], hp: 120, poise: 90, stun: 60, radius: 0.5, lv: 0, xp: 45, cell: 96,
            attr: { base: { str: 9, dex: 2, con: 12, per: 4, wil: 12 }, grow: { str: 0.6, dex: 0.1, con: 1.2, per: 0.3, wil: 0.6 } },
            speed: 2.9, chase: 3.3, sight: 7, turn: 0.045,
            plate: { light: 0.15, back: -0.3 },
            reassemble: { once: true, hp: 0.4, lie: 240, hits: 1 },
            moves: {
                cut: { dmg: 16, poise: 50, reach: 1.85, cone: 0.3, at: 1.7, windup: 30, hitAt: 4, strike: 16, recover: 48, wound: 0.3, knock: 0.6 },
                over: { dmg: 24, poise: 90, reach: 1.95, cone: 0.25, at: 1.75, windup: 50, hitAt: 4, strike: 18, recover: 66, wound: 0.45, knock: 0.9, guardBreak: true, chance: 0.35 }
            },
            loot: [[ITEM.nails, 0.5, 4], [ITEM.iron, 0.3, 1], [ITEM.steel, 0.08, 1]], gold: [2, 12, 0.6], remains: "armor"
        },
        // BATS: a swarm high over the hero's head - out of a blade's reach (a shot reaches them). In waves one or two dive (a screech,
        // a shadow line on the floor where it will go - a roll or a step aside), then they hang low a moment: that is the time to hit.
        nietoperz: {
            name: "Nietoperz", plural: "Nietoperze", look: "Bat", floors: [31, 50], swarm: [4, 6], swarmPer: 15,
            hp: 9, poise: 6, stun: 40, radius: 0.35, lv: -1, xp: 4, cell: 64, scale: 0.85, flying: { high: 30, low: 8 },
            attr: { base: { str: 3, dex: 11, con: 2, per: 10, wil: 2 }, grow: { str: 0.4, dex: 0.8, con: 0.3, per: 0.5, wil: 0.1 } },
            speed: 4.6, chase: 5, sight: 8, turn: 0.4, divers: 2,
            moves: { dive: { dmg: 5, poise: 5, windup: 26, speed: 0.2, past: 1.6, low: 50, wound: 0.08, knock: 0.2, gap: [40, 100] } },
            loot: [], gold: [0, 0, 0], remains: "bat"
        },
        // THE DROWNED: shuffles out of the river's dark. It grabs (both hands reaching - a roll, a step back or a parry) and drags the hero
        // to its water: held, his breath runs out and he chokes; O, Space or P over and over tears him free (Siła makes it quicker).
        topielec: {
            name: "Topielec", look: "Drowned", floors: [31, 50], hp: 90, poise: 50, stun: 55, radius: 0.5, lv: 0, xp: 35, cell: 96,
            attr: { base: { str: 10, dex: 4, con: 9, per: 5, wil: 6 }, grow: { str: 0.7, dex: 0.3, con: 1, per: 0.4, wil: 0.4 } },
            speed: 2.9, chase: 3.4, sight: 6.5, turn: 0.08,
            moves: {
                grab: { dmg: 6, poise: 10, reach: 1.7, cone: 0.35, at: 1.6, windup: 32, hitAt: 4, strike: 16, recover: 50, lunge: 0.6, hold: 220, drag: 0.012, choke: 45, chokeDmg: 4, breath: 0.5, presses: 6 },
                slam: { dmg: 12, poise: 30, reach: 1.45, cone: 0.35, at: 1.4, windup: 24, hitAt: 3, strike: 12, recover: 40, wound: 0.15, knock: 0.5, chance: 0.4 }
            },
            loot: [[ITEM.rope, 0.25, 1], [ITEM.bandage, 0.15, 1]], gold: [3, 14, 0.55], remains: "drowned"
        },
        // STONE SENTINEL: its front is a stone slab - nothing gets through it (sparks; the weapon bounces); its back has a glowing crack
        // (x1.6). It turns very slowly. The slam (a ring on the floor shows where - out of it, or a roll in time) and the
        // charge in a straight line: into a wall or a pillar it stuns itself - open from every side.
        kamiennik: {
            name: "Kamiennik", look: "Stone", floors: [51, 75], hp: 130, poise: 140, stun: 70, radius: 0.62, lv: 0, xp: 70, cell: 128,
            attr: { base: { str: 13, dex: 2, con: 14, per: 4, wil: 10 }, grow: { str: 0.8, dex: 0.1, con: 1.3, per: 0.2, wil: 0.5 } },
            speed: 2.6, chase: 2.9, sight: 7, turn: 0.028,
            stone: { front: 0.35, back: -0.35, backMult: 1.6, side: 0.75, stunned: 1.3 },
            moves: {
                slam: { dmg: 15, poise: 120, radius: 1.75, ahead: 1.0, at: 2.2, windup: 46, hitAt: 0, strike: 14, recover: 60, wound: 0.3, knock: 1.1, ring: true },
                charge: { dmg: 16, poise: 150, windup: 40, speed: 0.11, far: 7, from: 3.2, to: 7.5, recover: 50, stun: 160, knock: 1.4, cd: 300 }
            },
            loot: [[ITEM.stone, 0.9, 4], [ITEM.ore, 0.45, 2], [ITEM.iron, 0.12, 1]], gold: [0, 0, 0], remains: "stone"
        },
        // WRAITH OF TRUTH: unseen most of the time (a cold breath, a whisper) - it can be hit only while it shows itself. Then it speaks a
        // "truth": Hart ducha (Willpower) decides - resisted, the truth turns on it and it reels; not resisted, fear (frozen) or confusion
        // (the arrows turned round). Hit it during the "truth" and it breaks off; far away, the truth does not reach. Its touch is cold.
        upior: {
            name: "Upiór prawdy", look: "Wraith", floors: [76, 99], hp: 70, poise: 40, stun: 60, radius: 0.45, lv: 0, xp: 50, cell: 96,
            attr: { base: { str: 6, dex: 7, con: 5, per: 10, wil: 14 }, grow: { str: 0.6, dex: 0.5, con: 0.6, per: 0.6, wil: 1 } },
            speed: 3.2, chase: 3.6, sight: 9, turn: 0.2, hover: 6,
            hidden: { hide: [150, 260], show: 170, fade: 24, near: [2.5, 4.5] },
            moves: {
                truth: { windup: 70, reach: 7, power: 0.05, fear: 75, confuse: 240, breaks: 2, recover: 50, back: 80 },
                touch: { dmg: 8, poise: 14, reach: 1.4, cone: 0.35, at: 1.5, windup: 22, hitAt: 3, strike: 12, recover: 36, breath: 0.35, knock: 0.25 }
            },
            loot: [], gold: [0, 0, 0], remains: "wraith"
        },
        // SHADOW: stands in the dark as someone from the town (their look, their voice - a line in their manner). Up close the face drops:
        // the dark takes it, a fear check (Hart ducha), then claws. Hit twice, it melts into smoke and comes out behind the hero (a puff
        // shows where, a moment before).
        cien: {
            name: "Cień", look: "Shadow", floors: [76, 99], hp: 64, poise: 34, stun: 50, radius: 0.45, lv: 0, xp: 50, cell: 64,
            attr: { base: { str: 8, dex: 10, con: 5, per: 9, wil: 10 }, grow: { str: 0.6, dex: 0.8, con: 0.6, per: 0.6, wil: 0.7 } },
            speed: 3.4, chase: 4.4, sight: 8, turn: 0.25, reveal: 3.6, melt: { hits: 2, behind: 1.8, warn: 36 },
            moves: {
                claw: { dmg: 12, poise: 24, reach: 1.5, cone: 0.35, at: 1.6, windup: 22, hitAt: 3, strike: 12, recover: 34, lunge: 1.1, wound: 0.25, knock: 0.4 },
                fright: { power: 0.0, fear: 60 }
            },
            loot: [], gold: [2, 9, 0.4], remains: "shadow"
        }
    };
    // the residents a shadow takes the face of (TownLife's sheets, 8-way walking like the hero) and what it says in their voice
    const FACES = [
        { sheet: "Npc_Borgar_Walk8", name: "Borgar", lines: ["Zamykamy, synu. Idź na górę.", "Nie pytaj o to, czego nie chcesz wiedzieć...", "Piwo stygnie. Wracaj."] },
        { sheet: "Npc_Kowal_Walk8", name: "Tadek", lines: ["Kowale trzymają klucze. Daj mi swój.", "Co tu robisz tak głęboko, chłopcze?"] },
        { sheet: "Npc_Piekarka_Walk8", name: "Hanka", lines: ["Chleb się pali... Pomożesz mi?", "Zgubiłam się tu, wiesz? Tak dawno."] },
        { sheet: "Npc_Dziadek_Walk8", name: "Dziadek", lines: ["Wnusiu... Chodź tu, do mnie.", "Mówiłem ci, nie schodź tak nisko."] },
        { sheet: "Npc_Melia_Walk8", name: "Melia", lines: ["Trzeci schodek pusty... Zaśpiewasz ze mną?", "Ciii. Posłuchaj, jak tu cicho."] },
        { sheet: "Npc_Soltys_Walk8", name: "Sołtys", lines: ["Dług trzeba spłacić. Tak czy inaczej.", "Wszyscy cię szukają na górze."] },
        { sheet: "Npc_Wanda_Walk8", name: "Wanda", lines: ["Woda już grzeje... Chodź się umyć.", "Zostań tu ze mną. Na górze nic nie ma."] }
    ];

    // a marker of a generated floor whose kind lives deeper or higher: the kind that fits the floor (the contract's depths - docs/WALKA.md)
    const FIT = [[1, 10, ["szczur", "szczur", "pajak"]], [11, 30, ["szczur", "pajak", "zbroja"]], [31, 50, ["nietoperz", "topielec", "pajak"]],
        [51, 75, ["zbroja", "kamiennik"]], [76, 99, ["upior", "cien"]]];
    // a killed creature's marker stays empty this many days (the bosses and the guardian never come back)
    const RESPAWN_DAYS = 3;
    // at most this many creatures on one floor (the markers in the floor's own order: a swarm counts each of its members)
    const MAX_PER_FLOOR = 22;
    // the place level when a floor's map has no <Poziom:N>: 4 on floor 1, +1 every 2 floors (as band 1's maps)
    const LEVEL = { base: 4, perFloors: 2 };
    // what a level over 1 adds to a creature (the place's level - 4 on floor 1 ... 49 on floor 90): hp - life a level (a boss: bossHp),
    // poise - balance a level, dmg - its blows a level, str - its blows a point of Siła over 5 (the hero's own rate is 3.5%).
    // The balance check (tests/combat_balance.js, docs/WALKA.md "Próba sił", 2026-10-06): with the old rates (hp 12%, boss 6%, blows 10%
    // + Siła 3.5%) a creature of floor 90 hit ~13 times as hard as one of floor 1 while the hero's life only doubles by then - a boss
    // took half his life in one blow. Now a blow of the deep grows about as his life does (a little faster: deeper is harder).
    const GROW = { hp: 0.10, bossHp: 0.04, poise: 0.08, dmg: 0.05, str: 0.012 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The bosses of the hand-made floors (markers <Stwor:boss_20> ... boss_90 - Underground_Data.js BOSSES has the underground's own
    // line about each: the name and the look, written first; these follow them) and the guardian of the tenth gate (floor 10, Map140: the
    // riddle's armour - a fight instead when the hero comes armed, see Creatures.js). Each is a kind above made big, with one mechanic of
    // its own (Creatures.js BOSS_AI). hp / poise: at level 1 (a boss's life grows 6% a level, not 12%); lv: over the place's level; dmg:
    // its blows times this; turn: its own turning pace (radians a frame - the doorkeeper is slower than the sentinels); scale: its size in the fight (reach, its lunge, the words over it) and how big a common creature's sheets
    // are drawn for it; tone: [r, g, b, grey] of its sprite; look: its own sheets (else its base kind's); draw: the scale its own sheets
    // are drawn at (2026-10-06: each boss of floors 30-90 has its own PixelLab art at about its old size - drawn 1:1, crisp, no tint).
    // The numbers after the balance check (docs/WALKA.md "Próba sił", 2026-10-06): the queen's call - `groups` swarms of `swarm` rats,
    // `minionLv` levels under her; the armour without arms - `chainWindup` (its 2nd and 3rd cut), parry.recoil (the hero's arms jarred:
    // shorter than its riposte's wind-up, so the answer can be read); the last guard - `partDmg` (its shadows' blows, one at a time).
    // ---------------------------------------------------------------------------------------------------------------------------
    const BOSSES = {
        guardian: { name: "Strażnik dziesiątej bramy", base: "zbroja", floor: 10, hp: 300, poise: 160, lv: 0, dmg: 1.0, xp: 250, scale: 1.25, tone: [-30, -30, -10, 40],
            note: "pusta zbroja z ogniem w hełmie; tylko ciężki cios albo w plecy; raz się składa",
            gold: [25, 40], loot: [[ITEM.steel, 1, 1], [ITEM.iron, 1, 2], [ITEM.bandage, 1, 2]] },
        // the prior's armour still leads the rite of the one question: a ring on the floor round him - every step the hero takes in it is a
        // question, and the third gets its answer (the staff comes down where he stands: roll); blows from outside the ring do not reach
        // him; he cannot be knocked off his feet (only a parry opens him)
        boss_20: { name: "Przeor w zbroi", base: "zbroja", look: "Prior", floor: 20, hp: 320, poise: 99999, lv: 1, dmg: 0.75, xp: 300, scale: 1.25, tone: null,
            ring: { r: 3.4, steps: 3, keep: 2.2, staff: { dmg: 22, poise: 140, radius: 1.3, windup: 40, recover: 60 } },
            note: "krąg rytuału jednego pytania: każdy krok w kręgu to pytanie, trzecie dostaje odpowiedź kosturem; spoza kręgu ciosy go nie sięgają",
            gold: [30, 60], loot: [[ITEM.steel, 1, 1], [ITEM.bandage, 1, 2], [ITEM.honey, 1, 1]] },
        // the rat queen in her nest: rams in a straight line (into the cistern's wall - she stands dazed), bites; hurt by a third and by two
        // thirds she squeals and the rats pour out of the walls
        boss_30: { name: "Królowa szczurów", base: "szczur", look: "Queen", draw: 1, floor: 30, hp: 600, poise: 160, lv: 1, dmg: 2.5, xp: 600, scale: 2.3, tone: null, radius: 0.8,
            ram: { dmg: 16, poise: 120, windup: 36, speed: 0.12, far: 8, from: 2.8, to: 8, recover: 46, stun: 130, knock: 1.2, cd: 360 },
            calls: [0.66, 0.33], swarm: 3, groups: 1, minionLv: 6,
            note: "taranuje w linii prostej (w ścianę - stoi oszołomiona), gryzie; ranna piszczy i z murów wylewają się roje szczurów",
            gold: [50, 90], loot: [[ITEM.nails, 1, 8], [ITEM.bandage, 1, 2], [ITEM.rope, 1, 2]] },
        // the mother of spiders over the ford: webs on the floor (slow), three webs at once; up into the dark of the vault - and down
        // where the hero stands (a shadow on the floor grows first), or a thread that pulls him up to her (O / Space / P tear it)
        boss_40: { name: "Matka pająków", base: "pajak", look: "Mother", draw: 1, floor: 40, hp: 700, poise: 240, lv: 1, dmg: 1.5, xp: 900, scale: 2.0, tone: null, radius: 0.95,
            webs: 6, drop: { dmg: 34, radius: 1.4, follow: 60, lock: 30, every: [600, 840] }, pull: { hold: 110, presses: 6, bite: 30, fall: 5 },
            note: "sieci na posadzce (spowalniają), trzy plunięcia naraz; znika pod sklepieniem i spada tam, gdzie stoisz (cień ostrzega), albo nić wciąga cię w górę",
            gold: [60, 100], loot: [[ITEM.fibre, 1, 12], [ITEM.rope, 1, 3]] },
        // the drowned one of the deep: pools round the room; it grabs and drags to the water, and goes under when it is hurt (a part of its
        // life at a time), coming up again by the pool nearest the hero (ripples first) with a grab at once
        boss_50: { name: "Topielec z głębiny", base: "topielec", look: "Deep", draw: 1, floor: 50, hp: 800, poise: 280, lv: 1, dmg: 1.5, xp: 1200, scale: 1.55, tone: null, radius: 0.75,
            pools: 4, dive: 0.12, under: 60,
            note: "kałuże dookoła; łapie i wlecze do wody, a gdy obrywa, zanurza się i wychodzi przy kałuży najbliżej ciebie (zmarszczki ostrzegają)",
            gold: [80, 130], loot: [[ITEM.steel, 1, 1], [ITEM.rope, 1, 3], [ITEM.bandage, 1, 3]] },
        // the stone doorkeeper of the Gate of the First: asleep until one comes near its threshold; very slow; its fists on the floor send
        // rings of shards out across the room (roll through the ring as it passes); its front is stone, its back the glowing crack
        boss_60: { name: "Kamienny Odźwierny", base: "kamiennik", look: "Keeper", draw: 1, floor: 60, hp: 400, poise: 400, lv: 1, dmg: 0.6, xp: 1500, scale: 1.5, tone: null, radius: 0.85, turn: 0.02,
            wake: 3.2, waves: { every: 3, n: 2, gap: 26, speed: 0.11, far: 8, dmg: 8, width: 0.5 },
            note: "śpi, dopóki nie staniesz na progu; bardzo wolny; uderza pięściami w posadzkę - pierścienie odłamków idą przez całą salę (przewrót przez pierścień)",
            gold: [90, 150], loot: [[ITEM.ore, 1, 6], [ITEM.iron, 1, 3], [ITEM.steel, 1, 1]] },
        // the armour without arms: fast and clean - three cuts in a row, a long thrust; it parries a light blow from the front and answers at
        // once (a heavy blow breaks its guard, a parry of yours staggers it long); no plate to ring on
        boss_70: { name: "Zbroja bez herbu", base: "zbroja", look: "Blank", draw: 1.2, floor: 70, hp: 650, poise: 360, lv: 1, dmg: 0.65, xp: 1800, scale: 1.3, tone: null,
            noPlate: true, fast: 0.55, combo: 3, chainWindup: 16, parry: { chance: 0.4, reach: 2.4, riposte: 20, recoil: 10, stun: 110 },
            note: "szybka i czysta: trzy cięcia pod rząd, długie pchnięcie; paruje lekki cios z przodu i od razu odpowiada - ciężki cios łamie jej gardę",
            gold: [100, 170], loot: [[ITEM.steel, 1, 3], [ITEM.iron, 1, 4]] },
        // the wraith of the one who asked too much: it asks the hero questions in his own voice (over his head) - answer with a blow while the
        // question hangs, or the question hits (the mind: Hart ducha halves it); it vanishes and comes out behind him
        boss_80: { name: "Upiór pytającego", base: "upior", floor: 80, hp: 550, poise: 300, lv: 1, dmg: 1.0, xp: 2000, scale: 1.4, tone: [20, 20, 30, 30],
            ask: { window: 200, dmg: 9, every: [300, 420], stun: 90 },
            note: "zadaje ci pytania twoim głosem - odpowiedz ciosem, zanim pytanie minie, inaczej uderza w umysł (Hart ducha); znika i wychodzi zza pleców",
            gold: [120, 200], loot: [[ITEM.bandage, 1, 4], [ITEM.honey, 1, 2]] },
        // the last guard: the face of the one the hero trusts most (grandpa), his voice - then the order's habit and the dark; at two thirds
        // of its life it falls into three shadows (each a third of what it has left: all three must go). habit: its look once the face
        // drops (its own art: the hooded keeper with the ember eyes, drawn at habitDraw, untinted); tone: grandpa going dark as it drops
        boss_90: { name: "Ostatni Strażnik", base: "cien", floor: 90, hp: 750, poise: 300, lv: 1, dmg: 0.65, xp: 2500, scale: 1.15, tone: [-150, -150, -120, 230],
            face: "Dziadek", habit: "Last", habitDraw: 1, split: 0.66, parts: 3, partDmg: 0.5,
            note: "twarz dziadka i jego głos, potem habit zakonu i ciemność; przy dwóch trzecich życia rozpada się na trzy cienie",
            gold: [150, 250], loot: [[ITEM.steel, 1, 3], [ITEM.bandage, 1, 4]] }
    };
    // the questions of the wraith of floor 80, in the hero's own voice
    const QUESTIONS = [
        "Po co tu schodzę?", "Komu ufam najbardziej?", "Czy dziadek mówi mi wszystko?", "Co zrobię, gdy poznam prawdę?",
        "Ile pytań zadałem w tym roku?", "Czy wrócę na górę?", "Czego naprawdę szukam?", "Kto zapłaci za moje pytania?"
    ];

    // the "truths" a wraith speaks (the Heart's voice, in the order's manner - unsettling, never a fact of the story)
    const TRUTHS = [
        "Zszedłeś tu, bo na górze nikt na ciebie nie czeka.",
        "Każdy w tawernie coś przed tobą ukrywa.",
        "Dziadek śni o twierdzy. Nie mówi ci, co widzi.",
        "Ci, których kochasz, kłamią, żeby cię chronić.",
        "Wrócisz na górę starszy, niż zszedłeś.",
        "Pytasz, bo boisz się odpowiedzi.",
        "Nikt nie zapamięta twojego imienia.",
        "Kto pyta, ten płaci. Ty jeszcze nie zapłaciłeś.",
        "Słyszysz? To twoje kroki. Schodziłeś już tędy.",
        "Kto pyta ponad miarę, ten nie wraca cały."
    ];
    // what is said at the hero's own mind (the effects of a truth, of the fright of a shadow) and on resisting
    const MIND = {
        fear: "Strach!", confuse: "Zamęt!", resist: "Opierasz się!", resistSub: "Hart ducha", choke: "Dławisz się!", grabbed: "Złapał cię!",
        free: "Wyrwałeś się!", webbed: "Lepka sieć!", plate: "Dzwoni o blachę", stone: "Kamień!", crack: "W szczelinę!", broken: "Rozbita!",
        rises: "Składa się z powrotem!", stuck: "Utknął!", melt: "Rozpływa się w cieniu...", answer: "Odpowiedź!", ringSafe: "Krąg go chroni",
        parried: "Sparowała!", pulled: "Nić wciąga cię w górę!", dazed: "Oszołomiona!"
    };

    window.CreaturesData = { ITEM, KINDS, FACES, FIT, RESPAWN_DAYS, MAX_PER_FLOOR, LEVEL, GROW, BOSSES, QUESTIONS, TRUTHS, MIND };
})();
