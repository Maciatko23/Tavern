//=============================================================================
// Morze_Data.js
//=============================================================================
// W23 "Coś z głębin" (docs/POTWORY_Z_MORZA.md, 2026-11-11; 2026-11-12: the user's decision - the monsters are the drowned soldiers of the war, as
// SKELETONS with a club, a sword, a spear and a hammer, then the crabs, the rare giga crab and the kraken) - the sea monsters that come out of the
// water at night and the thread that explains them: the DATA. The engine is Morze.js, the words js/teksty/morze.txt. The numbers below are a starting point for tuning (like
// Creatures_Data.js).
// Stands in the plugin list under Dezerter_Data / Poselstwo_Data and above TownLife and TownQuests_Data: the thread "morze" (Watki.js) is made
// here, its quest W23 goes into TownQuests with the others. The kinds of the monsters (Creatures' KINDS) are added by Morze.js, which stands
// under Creatures.
// Event ids 4700-4799 (the core's registry: owner "Morze"): 4700 the marks on the shore (wet tracks), 4701-4709 the tentacles.

/*:
 * @target MZ
 * @plugindesc [W23] Dane „Coś z głębin”: utopieni żołnierze z morza (szkielety z pałką, mieczem, włócznią i młotem, kraby, kolos, kapitan), szansa nocy, tabela rodzajów i wątek W23 w siedmiu rozdziałach. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Poselstwo_Data
 *
 * @help
 * ============================================================================
 * Morze_Data.js - dane potworów z morza i wątku W23 (docs/POTWORY_Z_MORZA.md)
 * ============================================================================
 * Same dane: silnik to Morze.js, teksty js/teksty/morze.txt.
 * Musi stać nad TownLife.js i TownQuests_Data.js. Zadanie W23 trafia do
 * TownQuests przez silnik wątków (Watki.js).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Morze_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ places
    // the maps that give onto the open sea (<Water:salt>) and are part of the world; the town (Map008) lies inland: the monsters come to it
    // (2026-11-16) the new world: ONE map gives onto the sea - Słony Brzeg (Map219: the pier, the wreck, the lighthouse); the town is Kruczogród
    // (Map220). No garrison map (0: its multiplier never is "own"); the old shores Kruczy Jar and Łąka are gone (0).
    const MAP = { miasto: 220, przystan: 219, garnizon: 0, dziadek: 218, jar: 0, laka: 0, gory: 222, podgrodzie: 218, posiadlosc: 221, tawerna: 1, kaplica: 220 };
    const RING = [219];
    const OUT_OF_WORLD = [17, 18, 21, 177];   // (older parked maps that carry the tag: no landings there)
    const NO_SEA_MAPS_ABOVE = 899;            // (the test maps 9xx)

    // ------------------------------------------------------------------ the chance of a night
    // base p(day) = min(MAX, PER_DAY * day); on a map P = p * the multipliers, never under FLOOR * p; the raises after it, a ceiling
    const CHANCE = { perDay: 0.01, max: 0.30, floor: 0.15, ceiling: 0.45, tentacle: 0.04, tentacleFrom: 60 };
    const MULT = {
        lighthouse: { przystan: 0.3, other: 0.5 },    // a burning light (Latarnia.lit()); put out: x1.2 everywhere
        lightOut: 1.2,
        garrison: { own: 0.4, other: 0.8, favour: 40 },   // the patrols (Garnizon favour from a threshold)
        fire: 0.5,                                    // each shore point under a fire (within FIRE_R tiles) takes this share off: x(1 - 0.5 * covered fraction)
        bell: 0.85,                                   // the bell at dusk (chapter 2): DAYS days after it was rung
        guard: 0.6,                                   // the "watch" of the sea (chapter 7, the hero's choice "odsunąć")
        red: 1.5, storm: 1.3, town: 0.5,
        podgrodzie: 0.75                              // (2026-11-16) Podgrodzie - the first settlement past the coast: three quarters of the harbour's chance
    };
    const FIRE_R = 8, BELL_DAYS = 10;
    // the endings of the Heart (Underground.ending().kind) change the chance after the player's choices (the doc, chapter 9)
    const ENDING = { zniszczyc: { final: true }, straznik: { fixed: 0.05, bow: true }, uwolnic: { mult: 2, ceiling: 0.6 }, zapieczetowac: { mult: 0.25, watch: true } };
    // the night: dusk + 0.5 h to dawn - 0.5 h (Latarnia.dusk / dawn)
    const NIGHT = { fromDusk: 0.5, toDawn: 0.5 };
    const MAX_AT_ONCE = 3;   // (a pair of clubs + one more at most; a character on screen costs ~3% of a frame at 4x CPU: perf first)

    // ------------------------------------------------------------------ what comes (2026-11-12: the user's table - the drowned soldiers of the war)
    // [fromDay, toDay, { kind: weight }, count, count from day 10]; groups: GROUP below. Day 1-19: the skeletons with a club and a sword; 20-39: + the
    // spear, the hammer and the giant crab; 40+: the same + the rare giga crab (~8% of the landings). The captain with the banner (chapter 5) only
    // comes forced, by the thread. The kraken (60+) is the harbour's own roll.
    const TABLE = [
        { from: 1, to: 19, w: { szkielet_palka: 55, szkielet_miecz: 45 }, n: [1, 1], n10: [1, 2] },
        { from: 20, to: 39, w: { szkielet_palka: 22, szkielet_miecz: 22, szkielet_wlocznia: 18, szkielet_mlot: 14, krab_olbrzym: 24 }, n: [1, 2] },
        { from: 40, to: 9999, w: { szkielet_palka: 17, szkielet_miecz: 18, szkielet_wlocznia: 18, szkielet_mlot: 14, krab_olbrzym: 25, krab_kolos: 8 }, n: [1, 2] }
    ];
    const LEVEL_EVERY = 20;   // the creature's level = 1 + floor(day / 20)

    // ------------------------------------------------------------------ the creatures (added to Creatures' KINDS by Morze_Potwory.js)
    // the same fields as Creatures_Data.js; `ai` names the mind they borrow, `look` the sheet (img/characters/anim8/Cr_<look>_Walk8 ...).
    // Speeds are on the OLD scale (FreeMovement maps them to the world pace).
    const ITEM = { rope: 93, bandage: 152, torch: 59, salt: 200, tar: 176, tran: 177, scrap: 193 };   // (the new items - by name at run time: ITEM_NAMES)
    const ITEM_NAMES = { wodorost: "Wodorost", krabMieso: "Mięso kraba", krabPancerz: "Pancerz kraba", ostrze: "Zardzewiałe ostrze", grot: "Grot włóczni",
        znak: "Znak chorągwi", atrament: "Atrament krakena" };
    const A = (b, g) => ({ base: b, grow: g });
    const BONES = { sea: true, remains: "drowned", cell: 96, floors: [1, 99], lv: 0, fearFire: 2.2 };   // (the drowned soldiers: wet bones; they fear fire as the old drowned did)
    const KINDS = {
        // THE CLUB: fast and weak, always a pair (the rats' ring: one strikes, the other waits)
        szkielet_palka: Object.assign({}, BONES, {
            name: "Szkielet z pałką", ai: "szczur", look: "SkClub", swarm: [2, 2], swarmPer: 999, hp: 36, poise: 22, stun: 40, radius: 0.5, xp: 22,
            attr: A({ str: 7, dex: 9, con: 5, per: 6, wil: 3 }, { str: 0.5, dex: 0.7, con: 0.5, per: 0.4, wil: 0.2 }),
            speed: 3.3, chase: 3.8, sight: 7, turn: 0.2, attackers: 1, ring: 2.3,
            moves: { bite: { dmg: 7, poise: 6, reach: 1.6, cone: 0.35, at: 1.55, windup: 14, hitAt: 3, strike: 10, recover: 28, lunge: 0.4, wound: 0.08, knock: 0.15 } },   // ("bite" is the ring-mind's name: the club's blow)
            loot: [["ostrze", 0.15, 1], ["wodorost", 0.2, 1], [ITEM.bandage, 0.1, 1]], gold: [0, 6, 0.3]
        }),
        // THE SWORD: an ordinary fighter - a combo of up to three slashes
        szkielet_miecz: Object.assign({}, BONES, {
            name: "Szkielet z mieczem", ai: "miecz", look: "SkSword", hp: 58, poise: 40, stun: 50, radius: 0.5, xp: 34,
            attr: A({ str: 9, dex: 7, con: 7, per: 6, wil: 4 }, { str: 0.6, dex: 0.5, con: 0.7, per: 0.4, wil: 0.3 }),
            speed: 2.9, chase: 3.4, sight: 7, turn: 0.14, combo: [0.6, 0.35],
            moves: {
                cut: { dmg: 9, poise: 14, reach: 1.8, cone: 0.3, at: 1.7, windup: 20, hitAt: 3, strike: 12, recover: 30, lunge: 0.4, wound: 0.1, knock: 0.2 },
                cut2: { dmg: 9, poise: 14, reach: 1.8, cone: 0.3, at: 1.7, windup: 10, hitAt: 3, strike: 12, recover: 28, lunge: 0.3, wound: 0.1, knock: 0.2 },
                cut3: { dmg: 12, poise: 24, reach: 1.85, cone: 0.3, at: 1.7, windup: 12, hitAt: 3, strike: 14, recover: 50, lunge: 0.5, wound: 0.15, knock: 0.45 }
            },
            loot: [["ostrze", 0.5, 1], ["wodorost", 0.12, 1], [ITEM.rope, 0.2, 1]], gold: [2, 9, 0.4]
        }),
        // THE SPEAR: a long reach, keeps its distance, thrusts and steps back
        szkielet_wlocznia: Object.assign({}, BONES, {
            name: "Szkielet z włócznią", ai: "wlocznia", look: "SkSpear", hp: 52, poise: 34, stun: 50, radius: 0.5, xp: 40,
            attr: A({ str: 8, dex: 8, con: 6, per: 8, wil: 4 }, { str: 0.5, dex: 0.6, con: 0.6, per: 0.5, wil: 0.2 }),
            speed: 2.9, chase: 3.3, sight: 8, turn: 0.16, keep: [2.6, 4.0],
            moves: { thrust: { dmg: 11, poise: 12, reach: 2.6, cone: 0.25, at: 2.4, windup: 22, hitAt: 4, strike: 12, recover: 36, lunge: 0.5, wound: 0.1, knock: 0.25 } },
            loot: [["grot", 0.45, 1], ["wodorost", 0.1, 1], [ITEM.bandage, 0.1, 1]], gold: [2, 10, 0.4]
        }),
        // THE HAMMER: slow, one heavy blow that breaks the guard and knocks down
        szkielet_mlot: Object.assign({}, BONES, {
            name: "Szkielet z młotem", ai: "mlot", look: "SkHammer", hp: 90, poise: 80, stun: 60, radius: 0.55, xp: 55,
            attr: A({ str: 12, dex: 3, con: 11, per: 4, wil: 5 }, { str: 0.8, dex: 0.2, con: 1.0, per: 0.3, wil: 0.3 }),
            speed: 2.3, chase: 2.7, sight: 6.5, turn: 0.06,
            moves: { smash: { dmg: 20, poise: 90, reach: 1.9, cone: 0.3, at: 1.75, windup: 44, hitAt: 4, strike: 16, recover: 70, lunge: 0.35, wound: 0.4, knock: 1.0, guardBreak: true } },
            loot: [[ITEM.scrap, 0.5, 2], ["wodorost", 0.1, 1], [ITEM.bandage, 0.12, 1]], gold: [6, 18, 0.5]
        }),
        // THE CAPTAIN WITH THE BANNER (chapter 5, forced): a stronger sword combo and an overhead blow that breaks the guard
        kapitan_szkieletow: Object.assign({}, BONES, {
            name: "Kapitan z chorągwią", ai: "kapitan", look: "SkCaptain", hp: 190, poise: 110, stun: 70, radius: 0.55, xp: 140, scale: 1.12,
            attr: A({ str: 12, dex: 8, con: 11, per: 8, wil: 9 }, { str: 0.7, dex: 0.5, con: 0.9, per: 0.4, wil: 0.5 }),
            speed: 2.7, chase: 3.2, sight: 9, turn: 0.12, combo: [0.7, 0.5], overChance: 0.3,
            moves: {
                cut: { dmg: 13, poise: 20, reach: 1.9, cone: 0.3, at: 1.8, windup: 20, hitAt: 3, strike: 12, recover: 28, lunge: 0.4, wound: 0.12, knock: 0.25 },
                cut2: { dmg: 13, poise: 20, reach: 1.9, cone: 0.3, at: 1.8, windup: 10, hitAt: 3, strike: 12, recover: 26, lunge: 0.3, wound: 0.12, knock: 0.25 },
                cut3: { dmg: 16, poise: 30, reach: 1.95, cone: 0.3, at: 1.8, windup: 12, hitAt: 3, strike: 14, recover: 46, lunge: 0.5, wound: 0.18, knock: 0.5 },
                over: { dmg: 22, poise: 90, reach: 1.95, cone: 0.25, at: 1.8, windup: 42, hitAt: 4, strike: 16, recover: 64, lunge: 0.3, wound: 0.35, knock: 0.9, guardBreak: true }
            },
            loot: [["znak", 1, 1], ["ostrze", 0.5, 1]], gold: [20, 60, 0.9]
        }),
        // GIANT CRAB: the slowest; its front shell stops blows (as the stone sentinel's slab: from the side and behind x1.4); keeps to its patch of shore
        krab_olbrzym: {
            name: "Krab olbrzym", ai: "krab", look: "SeaCrab", floors: [1, 99], hp: 110, poise: 140, stun: 40, radius: 0.55, lv: 0, xp: 40, cell: 96, sea: true, remains: "drowned", scale: 1,
            attr: A({ str: 10, dex: 4, con: 12, per: 4, wil: 6 }, { str: 0.7, dex: 0.2, con: 1.1, per: 0.2, wil: 0.4 }),
            speed: 2.0, chase: 2.4, sight: 5, turn: 0.05, leash: 20,
            stone: { front: 0.35, back: -0.35, backMult: 1.4, side: 0.75, stunned: 1.3 },
            moves: {
                grab: { dmg: 4, poise: 10, reach: 1.5, cone: 0.5, at: 1.4, windup: 28, hitAt: 4, strike: 14, recover: 46, lunge: 0.4, hold: 90, drag: 0.004, choke: 60, chokeDmg: 2, breath: 0.25, presses: 3 },
                slam: { dmg: 10, poise: 30, reach: 1.45, cone: 0.5, at: 1.4, windup: 30, hitAt: 3, strike: 12, recover: 44, wound: 0.12, knock: 0.45, chance: 0.6 }
            },
            loot: [["krabMieso", 0.7, 1], ["krabPancerz", 0.4, 1]], gold: [0, 0, 0]
        },
        // THE GIGA CRAB (day 40+, ~8% of the landings): the same sheets drawn twice the size; more life and poise, slower, a crushing grab
        krab_kolos: {
            name: "Krab-kolos", ai: "krab", look: "SeaCrab", floors: [1, 99], hp: 300, poise: 320, stun: 30, radius: 1.0, lv: 0, xp: 170, cell: 96, sea: true, remains: "drowned", scale: 2,
            attr: A({ str: 16, dex: 3, con: 18, per: 4, wil: 8 }, { str: 0.9, dex: 0.1, con: 1.4, per: 0.2, wil: 0.5 }),
            speed: 1.6, chase: 1.9, sight: 6, turn: 0.035, leash: 25,
            stone: { front: 0.4, back: -0.35, backMult: 1.4, side: 0.75, stunned: 1.3 },
            moves: {
                grab: { dmg: 9, poise: 30, reach: 1.5, cone: 0.5, at: 1.4, windup: 36, hitAt: 4, strike: 16, recover: 56, lunge: 0.3, hold: 150, drag: 0.003, choke: 40, chokeDmg: 4, breath: 0.4, presses: 7 },
                slam: { dmg: 20, poise: 70, reach: 1.45, cone: 0.5, at: 1.4, windup: 38, hitAt: 4, strike: 14, recover: 60, wound: 0.3, knock: 0.9, chance: 0.5 }
            },
            loot: [["krabMieso", 1, 3], ["krabPancerz", 1, 2]], gold: [0, 0, 0]
        }
    };
    // what a landing of the table's names is made of (the club always comes in a pair)
    const GROUP = { szkielet_palka: { kind: "szkielet_palka", count: [2, 2] } };
    // the names over the group in the notices ("Z morza wyszedł ...")
    const NAMES = { szkielet_palka: "Szkielety z pałkami", szkielet_miecz: "Szkielet z mieczem", szkielet_wlocznia: "Szkielet z włócznią", szkielet_mlot: "Szkielet z młotem",
        kapitan_szkieletow: "Kapitan z chorągwią", krab_olbrzym: "Krab olbrzym", krab_kolos: "Krab-kolos", macki: "Macki krakena" };

    // ------------------------------------------------------------------ the tentacles (only the harbour: Map125 and its quays)
    // (2026-11-12: the tentacles twice as big - the strike zone 2 -> 3.6 tiles, the reach 3 -> 4.5; `scale` is the sprite's size)
    const TENTACLE = { map: MAP.przystan, hp: 160, poise: 400, count: [2, 3], warn: 120, strike: 20, zone: 3.6, grab: 180, reach: 4.5, scale: 2, maxWater: 2, sinkAt: 0.0, rest: 360,
        loot: [["atrament", 0.5, 1]] };

    // ------------------------------------------------------------------ the first sign: day 10 (bones and a rusty sword on the harbour beach and wet tracks, no attack)
    const FIRST = { day: 10, map: MAP.przystan, hour: 6 };

    // ------------------------------------------------------------------ the thread: W23, seven chapters
    const KTO = { roch: "przemytnik", ambrozy: "dzwonnik", bazyli: "latarnik", kleofas: "pustelnik", melia: "melia", ozzy: "ozzy", grum: "grum", borgar: "borgar",
        kapral: "kapral", lord: "lord", rotmistrz: "rotmistrz" };
    const XP = { slady: 70, dzwon: 90, mgly: 110, kronika: 140, kapitan: 200, zapisy: 160, kraken: 300 };
    const w = Watki.watek({
        id: "morze", wtyczka: "Morze", teksty: "morze",
        // version 1: the first landing (day) / the guarantee of day 10 (the bones on the beach), the tracks looked at per map, the bell (the day rung), the
        // lighthouse's fuel (done), the chapter flags, the records, the captain with the banner, the kraken night and the choice, the nights (the rolls: mapId -> record)
        stan: { klucz: "morze", wersja: 1, domyslne: () => ({
            start: 0, pierwsze: 0, kosci: 0, slady: {}, widziane: {}, dzwon: 0, dzwonDzien: 0, mgly: 0, kleofas: 0, zapisy: {}, kapitan: 0, kapitanPokonany: 0, kleofasZnak: 0, znak: 0, znakScena: 0,
            zapisy3: {}, kraken: 0, krakenNoc: 0, wybor: "", straz: 0, noce: {}, ostatnia: 0, ostatniaMacka: 0, koniec: 0, losy: 0 }) },
        mowa: { akapity: true },
        mysli: { klatki: 230, odstep: 240, czekaj: true },
        zadania: {
            // W23: starts by itself - the first landing or the guaranteed day 10
            W23: { kind: "W", giver: null, icon: 0,
                start: ["morzeStart"],
                kroki: [
                    // 1 "Mokre ślady": three shores' tracks (looked at: walk up to them in the morning); Roch shows the first
                    { nazwa: "w23Slady", ch: 1, gotowe: "ile:slady>=3", zmienne: "w23Zmienne", nagroda: { xp: XP.slady },
                        rozmowy: [{ kto: KTO.roch, gdy: ["!stan:zapisy.roch"], tresc: ["roch.slady", { zrob: "rochSlady" }] },
                                  { kto: KTO.ozzy, gdy: ["!stan:zapisy.ozzy"], tresc: ["ozzy.plotka", { zrob: "ozzyPlotka" }] },
                                  { kto: KTO.melia, gdy: ["!stan:zapisy.melia"], tresc: ["melia.piesn", { zrob: "meliaPiesn" }] }] },
                    // 2 "Dzwon o zmierzchu": a rope and the oil (tran) to Ambroży; he rings seven times
                    { nazwa: "w23Dzwon", ch: 2, type: "bring", to: KTO.ambrozy, need: [[ITEM.rope, 1], [ITEM.tran, 1]], zmienne: "w23Zmienne", nagroda: { xp: XP.dzwon },
                        haki: { hand: "dzwonOddany" } },
                    // 3 "Księga mgieł": two lumps of tran for the lighthouse;
                    { nazwa: "w23Mgly", ch: 3, type: "bring", to: KTO.bazyli, need: [[ITEM.tran, 2]], zmienne: "w23Zmienne", nagroda: { xp: XP.mgly },
                        haki: { hand: "mglyOddane" } },
                    // 4 "Kronika brata Kleofasa": ink (the kraken's, or three weeds for him to make it), at the chapel
                    { nazwa: "w23Kronika", ch: 4, gotowe: "stan:kleofas", zmienne: "w23Zmienne", nagroda: { xp: XP.kronika },
                        rozmowy: [{ kto: KTO.kleofas, gdy: ["!stan:kleofas", "mapa:" + MAP.miasto], tresc: [{ rozmowa: "kleofas" }] }] },
                    // 5 "Chorągiew utopionych": the captain with the banner beaten; brother Kleofas knows the banner; Melia plays the lament
                    { nazwa: "w23Kapitan", ch: 5, gotowe: "stan:znak", zmienne: "w23Zmienne", nagroda: { xp: XP.kapitan },
                        rozmowy: [{ kto: KTO.kleofas, gdy: ["stan:kapitanPokonany", "!stan:kleofasZnak", "mapa:" + MAP.miasto], tresc: [{ rozmowa: "kleofasZnak" }] },
                                  { kto: KTO.melia, gdy: ["stan:kleofasZnak", "!stan:znak"], tresc: [{ rozmowa: "meliaPo" }] }] },
                    // 6 "Zapisy Zakonu": three records - the garrison's list, the Lord's seal, the chronicle (Kleofas)
                    { nazwa: "w23Zapisy", ch: 6, gotowe: "ile:zapisy3>=3", zmienne: "w23Zmienne", nagroda: { xp: XP.zapisy },
                        rozmowy: [{ kto: KTO.rotmistrz, gdy: ["!stan:zapisy3.garnizon", "zapisyGotowe"], tresc: ["zapis.garnizon", { zrob: "zapis", args: ["garnizon"] }] },
                                  { kto: KTO.lord, gdy: ["!stan:zapisy3.lord", "zapisyGotowe"], tresc: ["zapis.lord", { zrob: "zapis", args: ["lord"] }] },
                                  { kto: KTO.kleofas, gdy: ["!stan:zapisy3.kronika", "zapisyGotowe"], tresc: ["zapis.kronika", { zrob: "zapis", args: ["kronika"] }] }] },
                    // 7 "Kraken u kei": the kraken's night at the harbour (after day 60), then the choice (Roch)
                    { nazwa: "w23Kraken", ch: 7, gotowe: "stan:koniec", zmienne: "w23Zmienne", nagroda: { xp: XP.kraken },
                        rozmowy: [{ kto: KTO.roch, gdy: ["krakenPo", "!stan:koniec"], tresc: [{ rozmowa: "wybor" }] }] }
                ],
                fail: {} }
        },
        rozmowy: {
            kleofas: ["kleofas.pyta", { wybor: [
                { etykieta: "kleofas.opcja.atrament", gdy: "maAtrament", tresc: ["kleofas.atrament", { zrob: "kleofas", args: ["atrament"] }] },
                { etykieta: "kleofas.opcja.wodorosty", gdy: "maWodorosty", tresc: ["kleofas.wodorosty", { zrob: "kleofas", args: ["wodorosty"] }] },
                { etykieta: "kleofas.opcja.pozniej", tresc: ["kleofas.pozniej"] }
            ], anuluj: "ostatnia" }],
            kleofasZnak: ["kleofas.znak", { zrob: "kleofasZnak" }],
            meliaPo: ["melia.po", { zrob: "meliaPo" }],
            wybor: ["roch.wybor", { wybor: [
                { etykieta: "wybor.odsunac", tresc: ["roch.odsunac", { zrob: "wybor", args: ["odsunac"] }] },
                { etykieta: "wybor.odciac", tresc: ["roch.odciac", { zrob: "wybor", args: ["odciac"] }] },
                { etykieta: "wybor.zostawic", tresc: ["roch.zostawic", { zrob: "wybor", args: ["zostawic"] }] }
            ], anuluj: "ostatnia" }]
        },
        akcje: {
            rochSlady: [{ hak: "zapis3", args: ["roch", "slady"] }],
            ozzyPlotka: [{ hak: "zapis3", args: ["ozzy", "plotka"] }],
            meliaPiesn: [{ hak: "zapis3", args: ["melia", "piesn"] }],
            kleofas: [{ hak: "kleofas", args: [{ arg: 0 }] }],
            kleofasZnak: [{ hak: "kleofasZnak" }],
            meliaPo: [{ hak: "meliaPo" }],
            zapis: [{ hak: "zapis", args: [{ arg: 0 }] }],
            wybor: [{ hak: "wybor", args: [{ arg: 0 }] }]
        },
        // F9 ("Wyspa i fabuła" - the section "Wątek W23"): jumps to the chapters
        f9: { naglowek: "f9.naglowek", etykieta: "f9.etykieta", opis: "f9.opis", brak: "f9.brak", rodzaj: "isleW23" },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w23Slady", godzina: 9, idz: [MAP.przystan, 32, 47, 8] },
                2: { ch: 2, krok: "w23Dzwon", godzina: 10, idz: [MAP.miasto, 43, 37, 8] },
                3: { ch: 3, krok: "w23Mgly", godzina: 10, idz: [MAP.miasto, 43, 37, 8] },
                4: { ch: 4, krok: "w23Kronika", godzina: 10, idz: [MAP.miasto, 43, 37, 8] },
                5: { ch: 5, krok: "w23Kapitan", godzina: 21, idz: [MAP.miasto, 43, 37, 8] },
                6: { ch: 6, krok: "w23Zapisy", godzina: 10, idz: [MAP.miasto, 43, 37, 8] },
                7: { ch: 7, krok: "w23Kraken", godzina: 22, idz: [MAP.przystan, 32, 47, 8] }
            }
        }
    });

    window.MorzeData = { MAP, RING, OUT_OF_WORLD, NO_SEA_MAPS_ABOVE, CHANCE, MULT, FIRE_R, BELL_DAYS, ENDING, NIGHT, MAX_AT_ONCE, TABLE, LEVEL_EVERY, KINDS, GROUP, NAMES, TENTACLE,
        FIRST, ITEM, ITEM_NAMES, KTO, XP, TX: w.tx, watek: w, W23: w.Q.W23, IDS: [4700, 4799], OWNER: "Morze" };
})();
