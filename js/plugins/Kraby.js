//=============================================================================
// Kraby.js
//=============================================================================
// (2026-11-19, the user: "dodasz też zwykłe małe kraby?", "wszystkie kraby będą się różnić wielkością i mogą się też różnić kolorem
// nieco", "zwykły krab ma tylko 10% redukcji od przodu")
//   - SMALL CRABS on the beach of Słony Brzeg (the salt-water map) by day: 3-6 at a time where the sand meets the water, at most PER_DAY a
//     day counted with the killed ones. They potter about by the water and pinch when the hero comes close - weak, but they fight back.
//     The sea crab's sheets (Morze_Potwory's look SeaCrab) drawn small; from the front the shell takes 10% (stone.frontMult 0.9 -
//     Creatures.js), from behind a little more. Loot: the raw crab (186, roasted at the campfire).
//   - EVERY CRAB a size and a tint of its own: the small ones, the sea's giant and giga crabs (Morze's landings) - Creatures.spawn of a
//     crab kind without a size of its own gets a random one and a slight colour tone (Creatures: opts.scale, opts.tone).

/*:
 * @target MZ
 * @plugindesc Małe kraby na plaży Słonego Brzegu (za dnia, do walki, od przodu -10%) i każdy krab innej wielkości i odcienia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Creatures
 * @orderAfter Morze_Potwory
 *
 * @help
 * ============================================================================
 * Kraby.js - małe kraby na plaży
 * ============================================================================
 * Za dnia (6:00-20:30) na plaży Słonego Brzegu, przy samej wodzie, chodzi
 * kilka małych krabów. Podejdziesz - szczypią. Od przodu pancerz zabiera
 * 10% obrażeń. Zostawiają czasem surowego kraba (upieczesz przy ognisku).
 * Każdy krab - także olbrzym i kolos z morza - ma trochę inny rozmiar i kolor.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Kraby";
    const T = window.Tawerna;
    if (!T) throw new Error("Kraby.js: brak TawernaCore.js (the Tawerna core is missing)");

    const KIND = "krab_maly", TAG = "kraby";
    const MAPS = [219];                 // the beaches (Słony Brzeg, <Water:salt>)
    const HOURS = [6, 20.5];
    const AT_ONCE = [3, 6], PER_DAY = 7, APART = 3;
    const RAW_CRAB = 186;
    // the small crab (the numbers of the rat's size; its shell as the sea crabs', from the front only -10%)
    const DEF = {
        name: "Krab", ai: KIND, look: "SeaCrab", floors: [1, 99], hp: 14, poise: 8, stun: 36, radius: 0.3, lv: -1, xp: 6, cell: 96, remains: "crab", scale: 0.36,
        attr: { base: { str: 3, dex: 6, con: 4, per: 5, wil: 1 }, grow: { str: 0.3, dex: 0.4, con: 0.4, per: 0.3, wil: 0.1 } },
        speed: 2.6, chase: 3.0, sight: 2.5, turn: 0.12,
        stone: { front: 0.35, back: -0.35, backMult: 1.2, side: 1, stunned: 1.3, frontMult: 0.9 },
        moves: { pinch: { dmg: 2, poise: 4, reach: 0.95, cone: 0.45, at: 1.0, windup: 18, hitAt: 4, strike: 10, recover: 34, lunge: 0.3, wound: 0.03, knock: 0.08 } },
        loot: [[RAW_CRAB, 0.8, 1]], gold: [0, 0, 0]
    };
    // the sizes (a multiplier of the kind's own) and the slight tints [r, g, b, grey] crabs come in
    const SIZE = { krab_maly: [0.75, 1.3], krab_olbrzym: [0.85, 1.18], krab_kolos: [0.9, 1.1] };
    const TONES = [[0, 0, 0, 0], [22, -6, -16, 0], [30, 8, -24, 0], [-10, -6, -20, 40], [14, 10, 4, 20], [-18, 4, -10, 30], [26, -14, -6, 0], [6, -4, 14, 10]];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    function lookOf(kind) {
        const r = SIZE[kind] || [0.85, 1.15];
        return { scale: +(r[0] + Math.random() * (r[1] - r[0])).toFixed(3), tone: TONES[Math.floor(Math.random() * TONES.length)].slice() };
    }

    const store = T.state.define("kraby", () => ({ day: 0, killed: 0 }), { version: 1, owner: PLUGIN });
    const today = () => T.time.day();
    function S() { const s = store(); if (s.day !== today()) { s.day = today(); s.killed = 0; } return s; }

    // the stock walk-in-and-pinch (Creatures' melee is not exported; the same as Morze_Potwory's copy)
    function melee(c, name) {
        const m = c.moveDef(name), dist = c.playerDistance(), at = m.at * Math.max(1, c._scale * 0.85);
        if (c.mayAttack() && dist <= at && c.clearRun()) { c.startMove(name); return true; }
        if (c.isMoving()) return false;
        if (c._mode !== "chase") c.setMode("chase");
        if (dist <= 1.1) { c.faceHero(); return false; }
        if (!c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 1)) c.faceHero();
        return false;
    }
    const AI = {
        think(c) { melee(c, "pinch"); },
        afterMove(c) { c._backT = 1; c._gapT = rnd(30, 70); },
        calm(c) { if (c._mode === "dormant") c.setMode("idle"); return false; }   // (a shell goes dormant after a fight: a crab potters about again)
    };

    // the kind and its mind, into Creatures (not enumerable, as the sea's: the ruins' lists never see it)
    function register() {
        const C = T.api("Creatures");
        if (!C || !C.KINDS) return false;
        if (window.MorzePotwory && MorzePotwory.registerAll) MorzePotwory.registerAll();   // (the SeaCrab look)
        if (!C.KINDS[KIND]) Object.defineProperty(C.KINDS, KIND, { value: Object.assign({}, DEF), enumerable: false, writable: true, configurable: true });
        C.AI[KIND] = AI;
        // every crab its own size and tint: a crab kind spawned without a size of its own gets one
        if (!C.spawn._kraby) {
            const spawn = C.spawn;
            C.spawn = function(kind, x, y, opts) {
                if (/^krab_/.test(String(kind)) && !(opts && opts.scale)) opts = Object.assign({}, opts || {}, lookOf(kind));
                return spawn.call(this, kind, x, y, opts);
            };
            C.spawn._kraby = true;
        }
        return true;
    }

    // ---- the beach: where the sand meets the water (passable, a water tile beside it), no event on it
    function isWater(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; }
        return false;
    }
    const waterNear = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && isWater(x + dx, y + dy)) return true; return false; };
    const shoreCache = {};
    function shore() {
        const id = $gameMap.mapId();
        if (shoreCache[id]) return shoreCache[id];
        const out = [];
        for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) {
            if (isWater(x, y) || !waterNear(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) continue;
            if ($gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority())) continue;
            out.push({ x, y });
        }
        return (shoreCache[id] = out);
    }
    function crabsHere() { const C = T.api("Creatures"); return C ? C.creatures().filter(c => c._kind === KIND && !c._dead && !c._dying) : []; }
    // a day on the beach: the crabs of today that are not killed yet, spread along the water, not by the hero
    function populate() {
        if (!MAPS.includes($gameMap.mapId()) || !register()) return 0;
        const h = T.time.hour();
        if (h < HOURS[0] || h >= HOURS[1]) return 0;
        const s = S(), C = T.api("Creatures"), have = crabsHere().length;
        let n = Math.min(rnd(AT_ONCE[0], AT_ONCE[1]), PER_DAY - s.killed) - have;
        if (n <= 0) return 0;
        const spots = shore().slice(), made = [];
        for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
        for (const p of spots) {
            if (made.length >= n) break;
            if (Math.hypot(p.x - $gamePlayer.x, p.y - $gamePlayer.y) < 5) continue;
            if (made.some(q => Math.hypot(q.x - p.x, q.y - p.y) < APART)) continue;
            if (C.spawn(KIND, p.x, p.y, { tag: TAG, single: true, level: 1 })) made.push(p);
        }
        return made.length;
    }
    T.on("mapReady", () => { try { populate(); } catch (e) { console.error("[Kraby]", e); } }, { owner: PLUGIN });
    T.on("load", () => { try { register(); } catch (e) { console.error("[Kraby]", e); } }, { owner: PLUGIN });
    T.on("kill", e => { if (e && e.kind === KIND) S().killed++; }, { owner: PLUGIN });

    window.Kraby = T.register(PLUGIN, { KIND, DEF, MAPS, HOURS, PER_DAY, SIZE, TONES, lookOf, register, populate, shore, crabsHere, state: S });
})();
