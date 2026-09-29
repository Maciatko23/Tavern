/*:
 * @target MZ
 * @plugindesc Ptaki: wrony, wróble, gołębie i kuropatwy przelatują, siadają na ziemi i dziobią, a w dzień naloty wyjadają zasiane pola. Można je upolować z procy. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting
 *
 * @param enabled
 * @text Ptaki włączone
 * @type boolean
 * @default true
 *
 * @help
 * PTAKI (mapy zewnętrzne, w dzień 6-19, nie w deszczu ani w burzy)
 *   Wrona, wróbel, gołąb i kuropatwa (grafiki img/system/Bird_*.png: 4 klatki
 *   32x32 - stoi, dziobie, skrzydła w górze, skrzydła w dole; patrzą w prawo).
 *   - Przeloty: stadko przelatuje wysoko nad mapą, po ziemi suną cienie.
 *   - Stadko na ziemi (co 20-45 s jakieś ptaki): ląduje niedaleko gracza, tuż
 *     poza tym, co widzi przy stojącym graczu; ptaki podskakują i dziobią, po
 *     chwili odlatują. Kuropatwy chodzą po ziemi i latają nisko.
 *   - Przepłoszone (podszedłeś, strzał, trafiony sąsiad): połowa razy stadko
 *     odlatuje na dobre, połowa - przelatuje 3-6 kratek dalej od ciebie, siada
 *     i dziobie dalej (najwyżej 4 razy; stadko z pola przesiada się na grządki
 *     dalej od ciebie).
 *   - Naloty na pola: kilka razy dziennie (plan ustalony dla każdego dnia jak
 *     pogoda) stadko wron, wróbli albo gołębi siada na zasianych grządkach. Każdy
 *     ptak zjada całą roślinę (świeżo zasiane ziarno szybciej), potem następną.
 *     Pole w promieniu 3 kratek od stracha na wróble jest bezpieczne. Gdy nie ma
 *     cię wtedy na mapie, szkody liczą się same - po powrocie dymek mówi, ile
 *     roślin zniknęło.
 * CZUJNOŚĆ (Hunting.js): nad ptakiem pojawia się "?" i "!", a gdy się przestraszy,
 *   podrywa się całe stadko. Strzał i trafiony sąsiad płoszą je od razu.
 *   Skradanie (C) pozwala podejść dużo bliżej.
 * POLOWANIE: ptaki na ziemi można trafić z procy albo z łuku (mały cel:
 *   poczekaj, aż krąg celownika się zwęzi). Trafiony ptak daje od razu 1-3
 *   pióra (bez mięsa). Z piór zrobisz w warsztacie strzały z lotkami (12 naraz).
 * Zapis: Tawerna.state("birds") (dawny $gameSystem._birds przechodzi sam przy
 * wczytaniu). Korzysta z TawernaCore.js (musi stać wyżej na liście).
 */

(() => {
    "use strict";

    const PLUGIN = "Birds";
    const T = window.Tawerna;
    if (!T) throw new Error("Birds.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const ENABLED = params.enabled !== "false";

    const ITEM = { bird: 145, feathers: 146 };
    const CELL = 32, FOOT = 30;   // the sheet: 32 px cells, the feet of the ground poses on row 29 (anchor at 30)
    // cells 4-6 are the in-betweens of a peck (the body tipped forward half way, the jab one pixel deeper, tipped a little)
    const FRAME = { stand: 0, peck: 1, up: 2, down: 3, half: 4, deep: 5, slight: 6 };
    // sight: tiles it watches (Hunting.noticeRate); radius: tiles a shot has to come within; flock: how many; fly: tiles per
    // frame in the air; hop: tiles per frame on the ground; eats: comes to the fields; drop: what a kill gives
    const SPECIES = {
        crow: { name: "Wrona", sheet: "Bird_Crow", sight: 8, radius: 0.34, flock: [2, 5], fly: 0.085, hop: 0.03, eats: true, drop: [[ITEM.bird, 1]], call: "Crow" },
        sparrow: { name: "Wróbel", sheet: "Bird_Sparrow", sight: 5.5, radius: 0.24, flock: [4, 9], fly: 0.1, hop: 0.045, eats: true, seeds: true, peck: 1.4, drop: [[ITEM.feathers, 2]] },
        pigeon: { name: "Gołąb", sheet: "Bird_Pigeon", sight: 6.5, radius: 0.3, flock: [3, 6], fly: 0.09, hop: 0.03, eats: true, drop: [[ITEM.bird, 1]] },
        partridge: { name: "Kuropatwa", sheet: "Bird_Partridge", sight: 5, radius: 0.32, flock: [3, 6], fly: 0.07, hop: 0.035, eats: false, walker: true, drop: [[ITEM.bird, 2]] }
    };
    const EAT_FRAMES = 540, SEED_FRAMES = 300;   // pecking one plant away (about 9 / 5 s)
    const SETTLE = 30;   // frames after landing in which a bird pays the player no heed: half a second of calm (user)
    const SCARECROW_RANGE = 3;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const pickWeighted = table => { let r = Math.random() * table.reduce((s, [, w]) => s + w, 0); for (const [v, w] of table) { if ((r -= w) <= 0) return v; } return table[0][0]; };
    const TILE = () => $gameMap.tileWidth();
    const hoursNow = () => T.time.day() * 24 + T.time.hour();

    // the saved state: Tawerna.state("birds") = $gameSystem._tw.birds (an older save's $gameSystem._birds is taken over)
    const store = T.state.define("birds", () => ({ maps: {}, kills: {}, eaten: 0 }), { version: 1, adopt: "_birds", owner: PLUGIN });
    function hash(n, salt) {
        let h = Math.imul(n | 0, 374761393) ^ Math.imul(salt | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const outdoors = () => !!(window.Survival && Survival.isOutdoors && Survival.isOutdoors());
    function rainingAt(day, hour) {
        const plan = window.Survival && Survival.weatherPlan ? Survival.weatherPlan(day) : null;
        return !!plan && plan.type === "rain" && hour >= plan.start - (plan.storm ? 1 : 0) && hour < plan.end;
    }
    const daylight = h => h >= 6 && h < 19;
    function birdTime() {
        const h = T.time.hour();
        return outdoors() && daylight(h) && !rainingAt(T.time.day(), h);
    }

    // ------------------------------------------------------------------
    // The fields: crops that are not guarded by a scarecrow
    // ------------------------------------------------------------------
    function farmOf() { return window.Farming && Farming.farm ? Farming.farm() : null; }
    function scarecrowsOf(mapId) {
        const f = farmOf();
        return ((f && f.buildings[mapId]) || []).filter(b => b.type === "scarecrow" && !b.site);
    }
    function guarded(mapId, x, y) {
        return scarecrowsOf(mapId).some(s => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) <= SCARECROW_RANGE);
    }
    // [{ x, y, plot }] of the crops of a map a flock could eat
    function openCrops(mapId) {
        const f = farmOf(), plots = (f && f.plots[mapId]) || {};
        const out = [];
        for (const k of Object.keys(plots)) {
            const p = plots[k];
            if (!p || !p.crop) continue;
            const [x, y] = k.split(",").map(Number);
            if (!guarded(mapId, x, y)) out.push({ x, y, plot: p });
        }
        return out;
    }
    // the plant is gone: the plot stays ploughed, empty
    function eatPlant(mapId, x, y) {
        const f = farmOf(), plot = f && f.plots[mapId] && f.plots[mapId][x + "," + y];
        if (!plot || !plot.crop) return null;
        const name = window.Farming && Farming.CROPS[plot.crop] ? Farming.CROPS[plot.crop].name : "roślina";
        delete plot.crop;
        delete plot.day;
        f.rev++;
        store().eaten++;
        return name;
    }

    // ------------------------------------------------------------------
    // The raids: planned for every map and day like the weather, so they happen also while the player is away
    // ------------------------------------------------------------------
    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const perk = key => (window.Combat && Combat.perk ? Combat.perk(key) : 0);
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!(window.Combat && Combat.hasSkill && Combat.hasSkill(id));
    function visitsOf(mapId, day) {
        const seed = day * 131 + mapId * 7919, n = 2 + Math.floor(hash(seed, 1) * 3), out = [];
        for (let i = 0; i < n; i++) {
            const kind = pickWeighted([["crow", 40], ["sparrow", 35], ["pigeon", 25]].map(([k, w], j) => [k, w * (0.5 + hash(seed, 10 + i * 3 + j))]));
            const [a, b] = SPECIES[kind].flock;
            if (hash(seed, 50 + i) < Math.min(0.9, perk("birds.raid"))) continue;   // (Rolnictwo: Strach na wróble - this flock does not come)
            out.push({ i, kind, start: 6.5 + hash(seed, 20 + i) * 11.5, hours: 0.75 + hash(seed, 30 + i) * 0.5, size: a + Math.floor(hash(seed, 40 + i) * (b - a + 1)) });
        }
        return out.sort((p, q) => p.start - q.start);
    }
    // a raid that nobody saw: every bird ate one plant (the newly sown first when it was a flock of sparrows)
    function resolveAway(mapId, day, v) {
        if (rainingAt(day, v.start)) return 0;
        let crops = openCrops(mapId).filter(c => c.plot.day === undefined || c.plot.day <= day);
        if (v.kind === "sparrow") crops.sort((p, q) => (q.plot.day || 0) - (p.plot.day || 0));
        else crops.sort(() => Math.random() - 0.5);
        let eaten = 0;
        for (const c of crops.slice(0, v.size)) if (eatPlant(mapId, c.x, c.y)) eaten++;
        return eaten;
    }
    let awayReport = 0;
    // everything planned between the last look and now: a raid starting now happens for real, the rest is counted
    function checkVisits() {
        const mapId = $gameMap.mapId(), rec = store().maps[mapId] || (store().maps[mapId] = {}), now = hoursNow();
        if (rec.upto === undefined || rec.upto > now) { rec.upto = now; return; }   // a map seen for the first time: nothing before it
        for (let day = Math.floor(rec.upto / 24); day <= Math.floor(now / 24) && day <= Math.floor(rec.upto / 24) + 60; day++) {
            for (const v of visitsOf(mapId, day)) {
                const s = day * 24 + v.start, e = s + v.hours;
                if (s <= rec.upto || s > now) continue;
                if (now < e && birdTime() && !raid && SceneManager._scene instanceof Scene_Map) startRaid(v);
                else awayReport += resolveAway(mapId, day, v);
            }
        }
        rec.upto = now;
    }

    // ------------------------------------------------------------------
    // Birds and flocks
    // ------------------------------------------------------------------
    // bird: { kind, x, y (feet, tiles), z (px above the ground), state: "air" | "ground", tx, ty (where it flies to), facing,
    //         act, actT, plot, eatT, _aware, flock }
    let flocks = [];
    let raid = null, flyover = null, grounded = null;   // one of each at most
    let nextAmbient = 600;
    const aliveBirds = () => flocks.flatMap(f => f.birds);

    function newBird(kind, x, y, z, flock) {
        return { kind, x, y, z, state: z > 0 ? "air" : "ground", tx: x, ty: y, facing: 1, act: "idle", actT: 0, plot: null, eatT: 0, _aware: 0, flock, flap: Math.floor(rand(0, 10)), sprite: null, shadow: null };
    }
    // a point well outside the screen on the side the flock comes from
    function offscreenPoint(side) {
        const w = Graphics.width / TILE(), h = Graphics.height / TILE(), ox = $gameMap.displayX(), oy = $gameMap.displayY();
        const s = side || pick(["l", "r", "t", "b"]);
        if (s === "l") return { x: ox - 3, y: oy + rand(0, h) };
        if (s === "r") return { x: ox + w + 3, y: oy + rand(0, h) };
        if (s === "t") return { x: ox + rand(0, w), y: oy - 3 };
        return { x: ox + rand(0, w), y: oy + h + 3 };
    }
    const opposite = { l: "r", r: "l", t: "b", b: "t" };
    // a patch of open ground: passable, no event, no building, not near a scarecrow. With `near` it lies within that many
    // tiles of the player and on the screen (where you can watch them peck), else anywhere on the map; never closer than
    // `away` tiles
    function openGround(x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.isPassable(x, y, 2) || $gameMap.eventsXy(x, y).length > 0) return false;
        if (window.Farming && (Farming.buildingAt(x, y) || (Farming.isWaterTile && Farming.isWaterTile(x, y)))) return false;
        return !guarded($gameMap.mapId(), x, y);
    }
    function groundSpot(away, near) {
        const px = $gamePlayer.x, py = $gamePlayer.y;
        const ox = $gameMap.displayX(), oy = $gameMap.displayY(), vw = Graphics.width / TILE(), vh = Graphics.height / TILE();
        for (let i = 0; i < 120; i++) {
            let x, y;
            if (near) {
                const a = rand(0, Math.PI * 2), d = rand(away, near);
                x = Math.round(px + Math.cos(a) * d);
                y = Math.round(py + Math.sin(a) * d);
                if (x < ox + 1 || x > ox + vw - 2 || y < oy + 1 || y > oy + vh - 2) continue;   // on the screen, off its edge
            } else {
                x = Math.floor(rand(1, $gameMap.width() - 1));
                y = Math.floor(rand(1, $gameMap.height() - 1));
            }
            if (!$gameMap.isValid(x, y) || Math.hypot(x - px, y - py) < away || !openGround(x, y)) continue;
            return { x, y };
        }
        return near ? groundSpot(away) : null;   // nowhere free near the player: anywhere else on the map
    }

    function startFlyover(kind) {
        kind = kind || pickWeighted([["crow", 40], ["pigeon", 30], ["sparrow", 30]]);
        const side = pick(["l", "r"]), from = offscreenPoint(side), to = offscreenPoint(opposite[side]);
        const [a, b] = SPECIES[kind].flock, n = a + Math.floor(Math.random() * (b - a + 1));
        const flock = { kind, mode: "flyover", birds: [], t: 0 };
        for (let i = 0; i < n; i++) {
            const bird = newBird(kind, from.x + rand(-1.5, 1.5), from.y + rand(-1, 1), rand(70, 120), flock);
            bird.tx = to.x + rand(-1.5, 1.5);
            bird.ty = to.y + rand(-1, 1);
            flock.birds.push(bird);
        }
        flocks.push(flock);
        flyover = flock;
        if (kind === "crow" && Math.random() < 0.5) caw(from.x);
        return flock;
    }
    // a flock that lands somewhere near `spot` (or finds its own patch) and stays for a while
    function startGrounded(kind, spot) {
        kind = kind || pickWeighted([["partridge", 30], ["pigeon", 30], ["crow", 25], ["sparrow", 15]]);
        // near the player, on the screen - just out of what it notices of a player standing still (Hunting's noticeRate: 60%
        // of its sight) plus a tile: crow ~5.8-8.3, pigeon ~4.9-7.4, sparrow ~4.3-6.8, partridge ~4-6.5 tiles (user: nearer)
        const away = SPECIES[kind].sight * 0.6 + 1;
        spot = spot || groundSpot(away, away + 2.5);
        if (!spot) return null;
        const from = offscreenPoint(), [a, b] = SPECIES[kind].flock, n = a + Math.floor(Math.random() * (b - a + 1));
        const flock = { kind, mode: "ground", birds: [], t: 0, stay: Math.round(rand(1800, 4200)), spot };
        for (let i = 0; i < n; i++) {
            const bird = newBird(kind, from.x + rand(-1, 1), from.y + rand(-1, 1), rand(60, 100), flock);
            bird.tx = spot.x + 0.5 + rand(-1.6, 1.6);
            bird.ty = spot.y + 0.7 + rand(-1.2, 1.2);
            flock.birds.push(bird);
        }
        flocks.push(flock);
        grounded = flock;
        return flock;
    }
    // a raid: each bird picks a plant of the open fields
    function startRaid(v) {
        const mapId = $gameMap.mapId(), crops = openCrops(mapId);
        if (crops.length === 0) return null;
        const kind = v.kind, from = offscreenPoint(), flock = { kind, mode: "raid", birds: [], t: 0, stay: Math.round(v.hours * 3600), visit: v, eaten: [] };
        for (let i = 0; i < v.size; i++) {
            const c = SPECIES[kind].seeds ? crops.slice().sort((p, q) => (q.plot.day || 0) - (p.plot.day || 0))[i % crops.length] : pick(crops);
            const bird = newBird(kind, from.x + rand(-1, 1), from.y + rand(-1, 1), rand(60, 100), flock);
            bird.plot = { x: c.x, y: c.y };
            bird.tx = c.x + 0.5 + rand(-0.15, 0.15);
            bird.ty = c.y + 0.75;
            flock.birds.push(bird);
        }
        flocks.push(flock);
        raid = flock;
        if (kind === "crow") caw(from.x);
        return flock;
    }
    // the whole flock takes off and leaves, away from (x, y) when given
    function scare(flock, fromX, fromY) {
        if (flock.leaving) return;
        flock.leaving = true;
        let side = pick(["l", "r", "t", "b"]);
        if (fromX !== undefined && flock.birds[0]) {
            const b = flock.birds[0], dx = b.x - fromX, dy = b.y - fromY;
            side = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : (dy > 0 ? "b" : "t");
        }
        const to = offscreenPoint(side);
        for (const b of flock.birds) {
            b.state = "air";
            b.tx = to.x + rand(-2, 2);
            b.ty = to.y + rand(-2, 2);
            b.z = Math.max(b.z, 2);
        }
        if (flock.birds.length) {
            AudioManager.playSe({ name: "Wind7", volume: 45, pitch: 150, pan: 0 });   // the flutter of wings
            if (flock.kind === "crow") caw(flock.birds[0].x);
        }
    }
    // chased off by the player (he came too close, a shot, a hit neighbour): RELOCATE.chance of the time the flock only
    // moves RELOCATE.dist tiles further from him and lands to peck again (at most RELOCATE.max times), else it leaves for good
    const RELOCATE = { chance: 0.5, max: 4, dist: [3, 6] };
    function flush(flock, fromX, fromY) {
        if (flock.leaving || flock.mode === "flyover") return;
        if ((flock.moves || 0) < RELOCATE.max && Math.random() < RELOCATE.chance && relocate(flock, fromX, fromY)) return;
        scare(flock, fromX, fromY);
    }
    function takeOff(b) {
        b.state = "air";
        b.z = Math.max(b.z, 8);
        b._aware = 0;
        b.act = "idle";
        b.pk = null;
    }
    function relocate(flock, fromX, fromY) {
        const birds = flock.birds;
        if (!birds.length) return false;
        const cx = birds.reduce((t, b) => t + b.x, 0) / birds.length, cy = birds.reduce((t, b) => t + b.y, 0) / birds.length;
        const keep = SPECIES[flock.kind].sight * 0.6 + 1;   // (out of what it notices of him standing still)
        if (flock.mode === "raid") {   // on to plants further from him
            const crops = openCrops($gameMap.mapId()).filter(c => Math.hypot(c.x + 0.5 - fromX, c.y + 0.5 - fromY) >= keep);
            if (!crops.length) return false;
            for (const b of birds) {
                const c = pick(crops);
                b.plot = { x: c.x, y: c.y };
                b.eatT = 0;
                b.tx = c.x + 0.5 + rand(-0.15, 0.15);
                b.ty = c.y + 0.75;
                takeOff(b);
            }
        } else {
            const away = Math.atan2(cy - fromY, cx - fromX);
            let spot = null;
            for (let i = 0; i < 60 && !spot; i++) {
                const a = away + rand(-0.8, 0.8), d = rand(RELOCATE.dist[0], RELOCATE.dist[1]);
                const x = Math.round(cx - 0.5 + Math.cos(a) * d), y = Math.round(cy - 0.7 + Math.sin(a) * d);
                if (openGround(x, y) && Math.hypot(x + 0.5 - fromX, y + 0.5 - fromY) >= keep) spot = { x, y };
            }
            if (!spot) return false;
            flock.spot = spot;
            for (const b of birds) {
                b.tx = spot.x + 0.5 + rand(-1.4, 1.4);
                b.ty = spot.y + 0.7 + rand(-1, 1);
                if (Math.abs(b.tx - b.x) > 0.05) b.facing = b.tx > b.x ? 1 : -1;
                takeOff(b);
            }
        }
        flock.moves = (flock.moves || 0) + 1;
        AudioManager.playSe({ name: "Wind7", volume: 40, pitch: 160, pan: 0 });   // the flutter of wings
        if (flock.kind === "crow" && Math.random() < 0.5) caw(birds[0].x);
        return true;
    }
    function caw(x) {
        const pan = Math.max(-80, Math.min(80, ((x - $gameMap.displayX()) / (Graphics.width / TILE()) - 0.5) * 140));
        AudioManager.playSe({ name: "Crow", volume: 30, pitch: Math.round(rand(95, 110)), pan: Math.round(pan) });
    }
    function removeFlock(flock) {
        for (const b of flock.birds) dropSprite(b);
        flocks = flocks.filter(f => f !== flock);
        if (raid === flock) raid = null;
        if (flyover === flock) flyover = null;
        if (grounded === flock) grounded = null;
    }
    function offView(b, margin) {
        const w = Graphics.width / TILE(), h = Graphics.height / TILE(), ox = $gameMap.displayX(), oy = $gameMap.displayY();
        return b.x < ox - margin || b.x > ox + w + margin || b.y < oy - margin || b.y > oy + h + margin;
    }

    // ---- pecking, one bob at a time (frames at 60 fps; a sparrow's `peck` speed runs it faster): the head goes down in
    // steps (slight, half, down), jabs one to three times (down / deep), comes back up the same way, then the bird stands
    // and looks about before the next bob
    const PECK = { step: 7, reach: 10, tap: 24, jab: 8 };
    function newPeck() {
        return { t: 0, taps: 1 + Math.floor(Math.random() * 3), rest: Math.round(rand(30, 90)) };
    }
    const peckLength = p => PECK.step * 4 + PECK.reach + p.taps * PECK.tap + p.rest;
    function peckFrame(p) {
        let t = p.t;
        if (t < PECK.step) return FRAME.slight;
        if (t < PECK.step * 2) return FRAME.half;
        t -= PECK.step * 2;
        if (t < PECK.reach) return FRAME.peck;
        t -= PECK.reach;
        if (t < p.taps * PECK.tap) return t % PECK.tap < PECK.jab ? FRAME.deep : FRAME.peck;
        t -= p.taps * PECK.tap;
        if (t < PECK.step) return FRAME.half;
        if (t < PECK.step * 2) return FRAME.slight;
        return FRAME.stand;
    }
    // true when a whole bob is over (the head is up again)
    function stepPeck(b) {
        if (!b.pk) b.pk = newPeck();
        b.pk.t += SPECIES[b.kind].peck || 1;
        if (b.pk.t < peckLength(b.pk)) return false;
        b.pk = null;
        return true;
    }

    // ---- one bird, one frame
    function updateBird(b) {
        const sp = SPECIES[b.kind], flock = b.flock;
        b.flap++;
        if (b.state === "air") {
            const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), step = sp.fly * (flock.leaving ? 1.3 : 1);
            if (Math.abs(dx) > 0.05) b.facing = dx > 0 ? 1 : -1;
            if (d > step) {
                b.x += dx / d * step;
                b.y += dy / d * step;
                if (!flock.leaving && flock.mode !== "flyover" && d < 4) b.z = Math.max(0, b.z - (b.z / Math.max(1, d / step)) * 1.1);   // gliding down
                else if (flock.leaving) b.z = Math.min(140, b.z + 1.6);
            } else if (flock.mode === "flyover" || flock.leaving) {
                b.gone = true;
            } else {
                b.x = b.tx; b.y = b.ty; b.z = 0;
                b.state = "ground";
                b.act = "idle"; b.actT = Math.round(rand(10, 60));
                b.settle = SETTLE;   // (just landed: it settles before it starts to watch the player)
            }
            return;
        }
        // on the ground: watch the player, peck, hop about; in a raid, eat the plant it sits on
        if (b.settle > 0) b.settle--;
        const aware = b.settle > 0 ? 0 : window.Hunting && Hunting.updateAwareness ? Hunting.updateAwareness(b, b.x, b.y - 0.25, sp.sight) : 0;
        if (aware >= 1) { flush(flock, $gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5); return; }
        if (aware >= 0.3) { b.act = "look"; b.pk = null; b.facing = $gamePlayer._realX + 0.5 > b.x ? 1 : -1; return; }   // it stops and watches
        if (flock.mode === "raid" && b.plot) {
            const f = farmOf(), plot = f && f.plots[$gameMap.mapId()] && f.plots[$gameMap.mapId()][b.plot.x + "," + b.plot.y];
            if (!plot || !plot.crop || guarded($gameMap.mapId(), b.plot.x, b.plot.y)) { nextPlant(b); return; }
            b.act = "peck";
            stepPeck(b);
            b.eatT++;
            const need = plot.day !== undefined && plot.day >= T.time.day() ? SEED_FRAMES : EAT_FRAMES;
            if (b.eatT >= need) {
                const name = eatPlant($gameMap.mapId(), b.plot.x, b.plot.y);
                if (name) flock.eaten.push(name);
                nextPlant(b);
            }
            return;
        }
        if (b.act === "peck") {   // whole bobs only (actT counts them): the next act starts with the head up
            if (!stepPeck(b) || --b.actT > 0) return;
        } else if (--b.actT > 0) {
            if (b.act === "hop") {
                const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), step = sp.hop;
                if (d > step) { b.x += dx / d * step; b.y += dy / d * step; b.z = sp.walker ? 0 : Math.abs(Math.sin(b.actT * 0.45)) * 3; }
                else { b.z = 0; b.actT = 0; }
            }
            return;
        }
        b.z = 0;
        const r = Math.random();
        if (r < 0.5) { b.act = "peck"; b.actT = 1 + Math.floor(Math.random() * 4); b.pk = null; }
        else if (r < 0.8) {
            b.act = "hop";
            const home = flock.spot || { x: b.x - 0.5, y: b.y - 0.7 };
            b.tx = Math.max(home.x - 1.5, Math.min(home.x + 2.5, b.x + rand(-1, 1)));
            b.ty = Math.max(home.y - 1, Math.min(home.y + 2.4, b.y + rand(-0.7, 0.7)));
            if (b.tx !== b.x) b.facing = b.tx > b.x ? 1 : -1;
            b.actT = 40;
        } else { b.act = "idle"; b.actT = Math.round(rand(30, 90)); if (Math.random() < 0.5) b.facing = -b.facing; }
    }
    // the plant is gone: on to the next one, or away when there is none left
    function nextPlant(b) {
        b.eatT = 0;
        const crops = openCrops($gameMap.mapId());
        if (crops.length === 0) { scare(b.flock); return; }
        const c = crops.reduce((best, c) => Math.hypot(c.x - b.x, c.y - b.y) < Math.hypot(best.x - b.x, best.y - b.y) ? c : best, crops[0]);
        b.plot = { x: c.x, y: c.y };
        b.state = "air";
        b.z = 6;
        b.tx = c.x + 0.5 + rand(-0.15, 0.15);
        b.ty = c.y + 0.75;
    }
    function updateFlock(flock) {
        flock.t++;
        if (flock.fright && --flock.fright.t <= 0) { flush(flock, flock.fright.x, flock.fright.y); flock.fright = null; }
        for (const b of flock.birds) updateBird(b);
        flock.birds = flock.birds.filter(b => { if (b.gone) dropSprite(b); return !b.gone; });
        if (flock.birds.length === 0) {
            if (flock.mode === "raid" && flock.eaten.length) report(flock.eaten);
            removeFlock(flock);
            return;
        }
        if (!flock.leaving && flock.stay && flock.t > flock.stay) scare(flock);
        if (!flock.leaving && flock.mode !== "flyover" && !flock.summoned && !birdTime()) scare(flock);   // rain, dusk: the ones on the ground go (a flyover flies on; the F9 ones stay)
    }
    function report(eaten) {
        const counts = {};
        for (const n of eaten) counts[n] = (counts[n] || 0) + 1;
        const text = Object.keys(counts).map(n => n + (counts[n] > 1 ? " ×" + counts[n] : "")).join(", ");
        T.popup("Ptaki zjadły: " + text, { icon: featherIcon(), color: "#ffb4a0" });
    }
    const featherIcon = () => ($dataItems[ITEM.feathers] ? $dataItems[ITEM.feathers].iconIndex : 0);

    // ---- shots (Hunting.js): the birds on the ground are targets; a shot scares every flock that hears it
    // opts.forDog (Dog.js): the dog caught it - the feathers are its to carry, not the bag's; returns how many
    function killBird(b, opts) {
        const sp = SPECIES[b.kind], flock = b.flock;
        flock.birds = flock.birds.filter(x => x !== b);
        dropSprite(b);
        featherBurst(b);
        AudioManager.playSe({ name: "Damage1", volume: 70, pitch: 140, pan: 0 });
        const s = store();
        s.kills[b.kind] = (s.kills[b.kind] || 0) + 1;
        const n = 1 + Math.floor(Math.random() * 3) + Math.round(perk("feathers"));   // a bird gives only feathers: 1-3 (user); Ptasznik: more
        if (!(opts && opts.forDog)) $gameParty.gainItem($dataItems[ITEM.feathers], n);
        void sp;
        flush(flock, $gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5);
        return n;
    }
    if (window.Hunting && Hunting.addTargets) {
        Hunting.addTargets(() => aliveBirds().filter(b => b.z < 14 && !b.gone).map(b => ({ x: b.x, y: b.y - 0.25, radius: SPECIES[b.kind].radius, ref: b, hit: () => killBird(b) })));
        // they flush at the sound, but a moment later (a stone is faster than a pigeon's fright)
        Hunting.onNoise((x, y, r) => { for (const f of flocks) if (f.mode !== "flyover" && !f.fright && f.birds.some(b => Math.hypot(b.x - x, b.y - y) <= r + 2)) f.fright = { t: 20, x, y }; });
    }

    // ------------------------------------------------------------------
    // Drawing: a sprite per bird in the tilemap (on the ground among the characters, in the air over everything) and its
    // shadow on the ground; feathers falling from a hit bird
    // ------------------------------------------------------------------
    let shadowBmp = null;
    function shadowBitmap() {
        if (shadowBmp) return shadowBmp;
        shadowBmp = new Bitmap(16, 6);
        const ctx = shadowBmp.context;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.ellipse(8, 3, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        shadowBmp._baseTexture.update();
        return shadowBmp;
    }
    function tilemap() {
        const s = SceneManager._scene;
        return s instanceof Scene_Map && s._spriteset ? s._spriteset._tilemap : null;
    }
    function ensureSprite(b) {
        const tm = tilemap();
        if (!tm) return;
        if (b.sprite && b.sprite.parent === tm) return;
        b.sprite = new Sprite(ImageManager.loadSystem(SPECIES[b.kind].sheet));
        b.shadow = new Sprite(shadowBitmap());
        b.shadow.anchor.set(0.5, 0.5);
        b.shadow.z = 1;
        tm.addChild(b.shadow);
        tm.addChild(b.sprite);
        b._markSprite = null;
    }
    function dropSprite(b) {
        for (const s of [b.sprite, b.shadow]) if (s && s.parent) s.parent.removeChild(s);
        b.sprite = b.shadow = null;
    }
    function drawBird(b) {
        ensureSprite(b);
        const s = b.sprite;
        if (!s) return;
        const tw = TILE(), th = $gameMap.tileHeight(), gx = Math.round($gameMap.adjustX(b.x) * tw), gy = Math.round($gameMap.adjustY(b.y) * th);
        const air = b.state === "air" && b.z > 1;
        const frame = air ? (Math.floor(b.flap / 5) % 2 ? FRAME.down : FRAME.up) : (b.act === "peck" && b.pk ? peckFrame(b.pk) : FRAME.stand);
        s.setFrame(frame * CELL, 0, CELL, CELL);
        s.anchor.set(0.5, air ? 0.5 : FOOT / CELL);
        s.scale.x = b.facing;
        s.x = gx;
        s.y = gy - b.z;
        s.z = air && b.z > 20 ? 9 : 3;   // high up: over the trees; on the ground: among the characters (sorted by y)
        const sh = b.shadow;
        sh.x = gx;
        sh.y = gy;
        sh.visible = b.z > 1;
        sh.alpha = Math.max(0.25, 1 - b.z / 160);
        sh.scale.set(b.kind === "sparrow" ? 0.7 : 1, 1);
        if (window.Hunting && Hunting.updateMark) Hunting.updateMark(b, s, -22, b.state === "ground" ? b._aware : 0);
        if (b._markSprite) b._markSprite.scale.x = b.facing;   // the bird is mirrored, its "?" must not be
    }
    const feathers = [];
    function featherBurst(b) {
        const tm = tilemap();
        if (!tm) return;
        const colours = { crow: ["#15161c", "#2a2f45"], sparrow: ["#8a5a32", "#c9b08a"], pigeon: ["#8f9aa8", "#c6ccd4"], partridge: ["#9a7a5a", "#c49a72"] }[b.kind];
        for (let i = 0; i < 9; i++) {
            const bmp = new Bitmap(3, 2);
            bmp.fillRect(0, 0, 3, 2, pick(colours));
            const s = new Sprite(bmp);
            s.anchor.set(0.5, 0.5);
            s.z = 8;
            tm.addChild(s);
            feathers.push({ s, x: b.x + rand(-0.2, 0.2), y: b.y - 0.3, z: rand(4, 14), vx: rand(-0.02, 0.02), vz: rand(0.3, 1), t: 0, ph: rand(0, 6) });
        }
    }
    function updateFeathers() {
        const tw = TILE(), th = $gameMap.tileHeight();
        for (const f of feathers) {
            f.t++;
            f.vz -= 0.03;
            f.z = Math.max(0, f.z + Math.max(-0.35, f.vz));
            f.x += f.vx + Math.sin(f.t * 0.15 + f.ph) * 0.006;
            f.s.x = Math.round($gameMap.adjustX(f.x) * tw);
            f.s.y = Math.round($gameMap.adjustY(f.y) * th - f.z);
            f.s.rotation = Math.sin(f.t * 0.2 + f.ph) * 0.8;
            f.s.alpha = f.t < 100 ? 1 : Math.max(0, 1 - (f.t - 100) / 40);
        }
        for (const f of feathers.filter(f => f.t > 140)) { if (f.s.parent) f.s.parent.removeChild(f.s); }
        feathers.splice(0, feathers.length, ...feathers.filter(f => f.t <= 140));
    }

    // ------------------------------------------------------------------
    // The map scene drives it (the core's map clock); a new map or a loaded game starts with no birds
    // ------------------------------------------------------------------
    function reset() {
        for (const f of flocks) for (const b of f.birds) dropSprite(b);
        flocks = [];
        raid = flyover = grounded = null;
        nextAmbient = Math.round(rand(300, 900));
        for (const f of feathers) if (f.s.parent) f.s.parent.removeChild(f.s);
        feathers.length = 0;
    }
    T.on("mapEnter", () => reset(), { owner: PLUGIN });
    T.on("load", () => reset(), { owner: PLUGIN });
    // the raids' plan is looked at every 60 frames (not on the core's hourChange: a raid starts at any minute - 6.5 + ... hours - and
    // one seen an hour late would be counted as one while away); the first look on the first map frame
    let auto = true, checkWait = 0;
    const CALM_REPORT = { only: ["message"] };   // (the report of the raids while away waits for a message to close)
    T.onMapUpdate(scene => {
        if (!ENABLED || !$gameMap || !$gamePlayer || !window.Farming) return;
        if (--checkWait <= 0) {
            checkWait = 60;
            checkVisits();
            if (awayReport > 0 && T.isCalm(scene, CALM_REPORT)) {
                T.popup("Pod twoją nieobecność ptaki wyjadły " + awayReport + (awayReport === 1 ? " roślinę" : awayReport < 5 ? " rośliny" : " roślin"), { icon: featherIcon(), color: "#ffb4a0" });
                awayReport = 0;
            }
        }
        if (window.Birds.pending) {   // asked for from the F9 menu (Debug.js)
            const what = window.Birds.pending;
            window.Birds.pending = null;
            // (called up on purpose: they come whatever the weather or the hour - the rain and dusk rule is for the ones that
            // come by themselves)
            const f = what === "raid" ? startRaid({ kind: "crow", size: SPECIES.crow.flock[1], hours: 1 }) : startGrounded(pick(Object.keys(SPECIES)));
            if (f) f.summoned = true;
            else T.popup(what === "raid" ? "Nie ma tu nic zasianego (albo pilnuje strach na wróble)" : "Nie ma tu miejsca dla ptaków", { icon: 0, color: "#bcd8ff" });
        }
        if (auto && birdTime() && --nextAmbient <= 0) {
            nextAmbient = Math.round(rand(1200, 2700));   // 20 to 45 s (user: more often); four times in five a flock that lands and pecks
            if (!grounded && Math.random() < 0.8) startGrounded();
            else if (!flyover) startFlyover();
        }
        for (const f of flocks.slice()) updateFlock(f);
        for (const b of aliveBirds()) drawBird(b);
        updateFeathers();
    }, { owner: PLUGIN, name: "birds" });

    window.Birds = T.register(PLUGIN, {
        SPECIES, ITEM, auto: v => { auto = !!v; }, reset, visitsOf, openCrops, guarded, checkVisits, resolveAway, eatPlant,
        startFlyover, startGrounded, startRaid, scare, flush, relocate, RELOCATE, killBird,
        get flocks() { return flocks; }, get birds() { return aliveBirds(); }, get raid() { return raid; }, store,
        pending: null   // "birds" | "raid": asked for from the F9 menu, started when the map runs again
    });
})();
