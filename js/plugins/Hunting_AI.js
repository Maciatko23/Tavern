//=============================================================================
// Hunting_AI.js
//=============================================================================
// The wild animal (split out of Hunting.js, 2026-09-29): Game_Animal - grazing, noticing the hero and running, a rabbit's hop, the
// snares' bait, the way out of a tile it cannot leave; the boar (the warning, the charge, the run past, the bash, the gore) and the
// wolves (the pack, the ring round the hero, one attacker at a time, the bark and the leap). Classes and functions only: Hunting.js
// holds every engine hook, spawns the animals and calls these.

/*:
 * @target MZ
 * @plugindesc Dzikie zwierzęta (część Hunting.js): zając, jeleń, dzik i wilki - pasienie, ucieczka, przynęta w pułapce, szarża dzika, wataha wilków. Sama nic nie robi - parametry i haki ma Hunting.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting
 * @base Hunting_Path
 * @orderAfter Hunting_Path
 *
 * @help
 * ============================================================================
 * Hunting_AI.js - dzikie zwierzęta
 * ============================================================================
 * Część Hunting.js (wydzielona z niego): jak zachowują się zwierzęta -
 * pasą się, zauważają bohatera i uciekają, zając przeskakuje pniaki i idzie
 * do przynęty w pułapce, dzik ostrzega i szarżuje, wilki otaczają bohatera
 * i atakują po jednym. Sama nic nie robi: woła ją Hunting.js. Parametry ma
 * Hunting.js.
 *
 * KOLEJNOŚĆ: Hunting, Hunting_Path, Hunting_AI, Hunting_Weapons. Dopóki nie
 * jest wpisana na listę wtyczek, Hunting.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Hunting_AI.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Hunting_parts") || T.register("Hunting_parts", {});
    if (P.ai) return;   // (put into the page twice: kept as it was)
    if (!P.core || !P.path) throw new Error("Hunting_AI.js: musi być pod Hunting.js i Hunting_Path.js na liście wtyczek (one of them is missing or below)");
    const { ITEM, SPECIES, WOLF, EDGE, DIRS8, STEP, VEC_DIR, DIR_VEC, perk, se, popup, C, activeNow, updateAwareness, updateMark, onScreen, tally, tallyGone,
        removeAnimal, packs, roamingCanStep, roamingStep, roamingFleeDirection, hunt } = P.core;
    const { STUCK, pathGrid, gridStep8, gridOpen, clearLine, lineDir, rayClear, search8, searchBudget, costAt, avoidList, path8, takeStep, stalled, detour,
        heroField, unstall, escapeSpot } = P.path;

    const atkOf = a => Math.round((SPECIES[a.kind()].atk || 10) * (1 + 0.12 * ((a._level || 1) - 1)));
    // the boar's temper, in frames: the warning before a charge (it stands, snorts and shows "!"), the longest charge, the run
    // back after a hit, the stagger after taking a spear
    // commit: tiles from the hero at which the charge locks its line and goes straight on; overshoot: how far past him it runs when
    // it misses; recover: the frames it then stands panting (the hero's moment to hit it) before it warns again
    // rush: how much faster it runs once its line is locked (move speed, +0.4 = a quarter faster)
    // lane: tiles from the hero of the place it goes round to when something stands between them (then laneWarn: its shorter
    // warning there); bash: the frames it stands stunned after running flat out into a tree, a rock, a building or a wall
    const BOAR = { warn: 50, charge: 240, retreat: [90, 150], stagger: 36, contact: 1.05, commit: 5, overshoot: 3.5, recover: 100, rush: 0.4, lane: [3, 5], laneWarn: 30, bash: 90 };

    // ------------------------------------------------------------------
    // The animal: a plain character that thinks for itself
    // ------------------------------------------------------------------
    function Game_Animal() {
        this.initialize(...arguments);
    }
    Game_Animal.prototype = Object.create(Game_Character.prototype);
    Game_Animal.prototype.constructor = Game_Animal;

    Game_Animal.prototype.initialize = function(kind, x, y) {
        Game_Character.prototype.initialize.call(this);
        const sp = SPECIES[kind];
        this._kind = kind;
        const Cb = C(), lv = Math.max(1, (Cb ? Cb.placeLevel() : 1) + (Math.random() < 0.3 ? 1 : 0));
        this._level = lv;
        this._maxHp = Math.round(sp.hp * (1 + 0.15 * (lv - 1)));
        this._hp = this._maxHp;
        this._maxPoise = Math.round((sp.poise || 20) * (1 + 0.1 * (lv - 1)));
        this._poise = this._maxPoise;
        this._poiseT = 0;        // frames since the last hit: the balance comes back after a while
        this._stun = 0;          // frames it reels (balance broken, an attack parried): it does nothing
        this._flashT = 0;        // frames of the white flash of a hit (Combat.js draws it)
        this._engaged = false;   // it fights the hero (Combat.js shows its bars)
        this._pack = null;       // wolves: the pack (see makePack)
        this._wounded = false;
        this._alarm = 0;         // frames it keeps running after a shot nearby
        this._aware = 0;         // 0..1: how sure it is that someone is there (noticeRate); 1 = it runs
        this._fleeing = false;
        this._wait = 30 + Math.floor(Math.random() * 120);
        this._frozen = false;    // tests: stand still
        this._dead = false;
        this._mode = "roam";     // the boar's temper: roam, warn, charge, retreat, stagger, flee (thinkBoar)
        this._modeT = 0;
        this._sniff = 0;         // frames it still sniffs at a snare before it steps in (or not) - see lure()
        this._lureSnare = null;
        this._lureCd = 0;        // frames it keeps away from snares after a fright at one
        this._unstickT = Math.floor(Math.random() * STUCK.unstick);   // (see unstick; not all on the same frame)
        this._home = { x, y };   // where it came out (the bear does not follow the hero far from it: BEAR_AI.leash)
        this.setImage(sp.sheet, 0);
        this.setPosition(x, y);
        this.setDirection([2, 4, 6, 8][Math.floor(Math.random() * 4)]);
        this.setMoveSpeed(sp.speed);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
    };
    // a wild animal keeps out of buildings and out of the yards (the open ground inside a yard belongs to Livestock.js)
    Game_Animal.prototype.isMapPassable = function(x, y, d) {
        const F = T.api("Farming");
        if (F && F.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    // A rabbit hops over what lies low in its way - a stump, a log, a bush, a berry bush (the user's, 2026-09-25): where the next tile
    // holds only such a thing and the one behind it is free, a two-tile jump instead of the step.
    function lowObstacleAt(x, y) {
        const F = T.api("Farming"), CT = T.api("ChoppableTree");
        if (F && F.bushSolid && F.bushSolid(x, y, $gameMap.mapId())) return true;   // (a berry bush: not an event)
        const blocking = $gameMap.eventsXy(x, y).filter(e => e.isNormalPriority() && !e.isThrough());
        return blocking.length > 0 && !!(CT && CT.isLow) && blocking.every(e => CT.isLow(e));
    }
    // the tile it lands on when it hops from (x, y) in direction d, or null
    Game_Animal.prototype.hopOver = function(x, y, d) {
        if (!SPECIES[this._kind].hops) return null;
        const x1 = $gameMap.roundXWithDirection(x, d), y1 = $gameMap.roundYWithDirection(y, d);
        const x2 = $gameMap.roundXWithDirection(x1, d), y2 = $gameMap.roundYWithDirection(y1, d);
        if (!$gameMap.isValid(x2, y2) || !$gameMap.checkPassage(x1, y1, 0x0f) || !lowObstacleAt(x1, y1)) return null;
        const F = T.api("Farming");
        if (!$gameMap.isPassable(x2, y2, this.reverseDir(d)) || this.isCollidedWithCharacters(x2, y2) || (F && F.buildingAt(x2, y2))) return null;
        return { x: x2, y: y2 };
    };
    Game_Animal.prototype.moveStraight = function(d) {
        const hop = !Game_Character.prototype.canPass.call(this, this._x, this._y, d) && this.hopOver(this._x, this._y, d);
        if (!hop) return Game_Character.prototype.moveStraight.call(this, d);
        this.setDirection(d);
        this.jump(hop.x - this._x, hop.y - this._y);
        this.setMovementSuccess(true);
    };
    Game_Animal.prototype.kind = function() { return this._kind; };
    // on a tile it cannot step off at all (born in a berry bush, a bush grown or a building put up round it, a wall): out onto the
    // nearest open tile it can walk on from (the dog does the same, Dog.js)
    Game_Animal.prototype.unstick = function() {
        if ([2, 4, 6, 8].some(d => roamingCanStep(this, this._x, this._y, d))) return false;
        const G = pathGrid();
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = this._x + dx, y = this._y + dy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !gridOpen(G, x, y, true) || !G.s4a[y * G.w + x]) continue;
            this.locate(x, y);
            this._p8 = null;
            return true;
        }
        return false;
    };
    Game_Animal.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Animal.prototype.centerY = function() { return this._realY + 0.5; };
    // it does not count as an "event" for Farming.js etc.
    Game_Animal.prototype.isAnimal = function() { return true; };

    Game_Animal.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._alarm > 0) this._alarm--;
        if (this._lureCd > 0) this._lureCd--;
        if (this._flashT > 0) this._flashT--;
        if (this._scare && --this._scare.t <= 0) this._scare = null;
        if (++this._poiseT > 120 && this._poise < this._maxPoise) this._poise = Math.min(this._maxPoise, this._poise + this._maxPoise / 90);
        if (!this._dead) updateAwareness(this, this.centerX(), this.centerY(), SPECIES[this._kind].sight);
        const sprite = this._sprite;   // (its height only once the sheet has loaded)
        // (no mark while a boar charges, backs off or reels; a bear drawing its paw back or rearing for the leap shows the "!" - the telegraph)
        const windup = this._mode === "windup" || this._mode === "swipeWind" || this._mode === "pinWind";
        const calm = this._mode === "roam" || this._mode === "warn" || this._mode === "approach" || windup;
        const markY = SPECIES[this._kind].markYTall && (this._mode === "warn" || this._mode === "pinWind" || this._mode === "swipeWind") ? SPECIES[this._kind].markYTall : SPECIES[this._kind].markY;
        if (sprite && sprite.bitmap && sprite.bitmap.isReady()) updateMark(this, sprite, markY !== undefined ? markY : -sprite.patternHeight() - 2, this._fleeing || !calm || this._stun > 0 ? 0 : windup ? 1 : this._aware);
        if (this._frozen || this._dead) return;
        if (this._stun > 0) { if (--this._stun === 0) this.afterStun(); return; }
        if (++this._unstickT >= STUCK.unstick && !this.isMoving() && !this.isJumping()) { this._unstickT = 0; this.unstick(); }
        if (SPECIES[this._kind].pack) { this.updateWolf(); return; }
        if (SPECIES[this._kind].bear) { this.updateBear(); return; }
        if (SPECIES[this._kind].aggressive) { this.updateBoar(); return; }
        if (this.isMoving()) return;
        this.think();
    };

    Game_Animal.prototype.think = function() {
        const sp = SPECIES[this._kind];
        const from = this._scare || null;   // (a dog after it, Dog.js: it runs from the dog, not from the hero)
        const dx = this._realX - (from ? from.x : $gamePlayer._realX), dy = this._realY - (from ? from.y : $gamePlayer._realY);
        const dist = Math.hypot(dx, dy);
        if (from) this._fleeing = true;
        else if (this._aware >= 1 || this._wounded || this._alarm > 0) this._fleeing = true;
        else if (this._aware < 0.3 && dist > sp.sight * 1.2) this._fleeing = false;
        if ((this._aware >= 0.3 || this._fleeing) && this._sniff > 0) { this._sniff = 0; this._lureSnare = null; }   // disturbed at the snare
        if (this._aware >= 0.3 && !this._fleeing) { this.turnTowardCharacter($gamePlayer); return; }   // it stops and looks
        if (this._fleeing) {
            this.setMoveSpeed(sp.flee);
            if (this.fleeRoute(dx, dy, dist)) return;
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this.lure()) return;
        this.wander();
    };
    // running from something and getting nowhere (a wall, a building, a thicket in the way: no ground won for a while, or to and fro):
    // it takes the way round (path8) to a far spot away from it, until it is well away or has run a while. (dx, dy): from the threat
    // to it; true while it runs that way
    Game_Animal.prototype.fleeRoute = function(dx, dy, dist) {
        const now = Graphics.frameCount, fx = Math.round(this._realX - dx), fy = Math.round(this._realY - dy);
        let R = this._route;
        if (R && (now > R.until || dist > SPECIES[this._kind].sight * 1.4 || (this._x === R.x && this._y === R.y))) R = this._route = null;
        if (!R) {
            if (!stalled(this, "flee", -dist)) return false;
            R = this._route = Object.assign({}, escapeSpot(this, fx, fy, null), { until: now + 240 });
        }
        const r = path8(this, R.x, R.y, { animal: true, key: "route" });
        if (!takeStep(this, r.dir) && !r.dir) { this._route = null; return false; }   // (nowhere to go from here that way: the plain flight)
        if (stalled(this, "route", Math.hypot(this._x - R.x, this._y - R.y), 1, R.x, R.y)) this._route = Object.assign({}, escapeSpot(this, fx, fy, R), { until: now + 240 });
        return true;
    };

    // Snares (Farming.js, buildings with `lure`): only bait draws a rabbit - a calm one smells it from lure.radius tiles and hops up
    // to it (a hop, a pause, like it grazes), sniffs at it a moment, and then it is either caught (the snare holds it until the player
    // collects it) or takes fright - maybe with the bait - and runs off, keeping away from snares for a while. A snare without bait,
    // or one that holds a rabbit already, draws none. Only rabbits: a deer is too big for it.
    const LURE = { kinds: ["rabbit"], sniff: 50, cooldown: 1500, hop: [15, 60], eatBait: 0.5 };
    function nearestSnare(animal) {
        const F = T.api("Farming");
        if (!F || !F.snares) return null;
        let best = null;
        for (const b of F.snares()) {
            if (F.snareSprung(b) || !F.snareBait(b)) continue;
            const lure = F.BUILDINGS[b.type].lure;
            for (const c of F.cellsOfGeo(F.geoOf(b), b.x, b.y)) {
                const dist = Math.hypot(c.x - animal._x, c.y - animal._y);
                if (dist <= lure.radius * (1 + perk("snare.lure")) && (!best || dist < best.dist)) best = { b, cell: c, dist, lure };   // (Sidlarz)
            }
        }
        return best;
    }
    Game_Animal.prototype.lure = function() {
        if (!LURE.kinds.includes(this._kind) || this._lureCd > 0) return false;
        if (this._sniff > 0) {
            if (--this._sniff === 0) this.tryTrap(this._lureSnare);
            return true;
        }
        const s = nearestSnare(this);
        if (!s) return false;
        if (this._wait > 0) { this._wait--; return true; }   // it nibbles at the grass between the hops
        this.setMoveSpeed(SPECIES[this._kind].speed);
        if (s.dist <= 1.5) {   // beside it: it sniffs
            this._lureSnare = s.b;
            this._sniff = LURE.sniff;
            this.turnTowardPos(s.cell.x, s.cell.y);
            return true;
        }
        // a hop towards it (of the 8 ways, the passable one that ends nearest)
        let best = 0, bestDist = s.dist - 0.01;
        for (const d of [2, 4, 6, 8, 1, 3, 7, 9]) {
            if (!roamingCanStep(this, this._x, this._y, d)) continue;
            const [sx, sy] = STEP[d], nd = Math.hypot(s.cell.x - (this._x + sx), s.cell.y - (this._y + sy));
            if (nd < bestDist) { bestDist = nd; best = d; }
        }
        if (!best) best = path8(this, s.cell.x, s.cell.y, { animal: true, key: "lure", near: 1.5 }).dir;   // (nothing nearer straight on: the way round)
        if (!best || !roamingCanStep(this, this._x, this._y, best)) return false;   // no way to it: it just wanders
        roamingStep(this, best);
        this._wait = LURE.hop[0] + Math.floor(Math.random() * (LURE.hop[1] - LURE.hop[0]));
        return true;
    };
    Game_Animal.prototype.turnTowardPos = function(x, y) {
        const dx = x - this._x, dy = y - this._y;
        if (Math.abs(dx) >= Math.abs(dy)) this.setDirection(dx < 0 ? 4 : 6); else this.setDirection(dy < 0 ? 8 : 2);
    };
    Game_Animal.prototype.tryTrap = function(b) {
        this._lureSnare = null;
        const F = T.api("Farming");
        if (!b || this._dead || !F || F.snareSprung(b) || !F.snareBait(b) || !F.snares().includes(b)) { this._lureCd = LURE.cooldown; return; }
        const lure = F.BUILDINGS[b.type].lure;
        if (Math.random() < Math.min(0.95, lure.chance * (1 + perk("snare.lure")))) { trapped(this, b); return; }
        if (Math.random() < LURE.eatBait) F.snareEatBait(b);   // it got away with the bait
        this._alarm = 90;   // off it runs
        this._lureCd = LURE.cooldown;
    };
    // caught in a snare: gone from the map (it counts as today's catch, like one shot), the snare holds it; heard when near
    function trapped(animal, b) {
        T.api("Farming").snareCatch(b);
        tally(animal);
        removeAnimal(animal);
        const dist = Math.hypot(animal._x - $gamePlayer.x, animal._y - $gamePlayer.y);
        if (dist > 14) return;
        const pan = Math.max(-80, Math.min(80, Math.round((animal._x - $gamePlayer.x) * 8))), vol = 1 - dist / 20;
        se("Close1", Math.round(85 * vol), 140, pan);
        se("Damage1", Math.round(35 * vol), 150, pan);
        popup($dataItems[ITEM.carcass].iconIndex, SPECIES[animal.kind()].name + " wpadł w pułapkę!", "#cfe6a8");
    }
    // the passable direction (of 8, like the player walks) that ends farthest from the player, looking two steps ahead (the shared
    // scan, tuned for a wild animal's full bolt: no floor on the score, a bit of jitter, and a look at the next step)
    Game_Animal.prototype.bestEscape = function(dx, dy) {
        return roamingFleeDirection(this, dx, dy, { jitter: 0.6, lookahead: 0.8, deadEnd: 2, diagonal: true });
    };
    // a quiet wander: now and then one step somewhere, straight or on a slant
    Game_Animal.prototype.wander = function() {
        this.setMoveSpeed(SPECIES[this._kind].speed);
        if (this._wait > 0) { this._wait--; return; }
        const dirs = [2, 4, 6, 8, 1, 3, 7, 9].filter(d => roamingCanStep(this, this._x, this._y, d));
        if (dirs.length > 0 && Math.random() < 0.7) roamingStep(this, dirs[Math.floor(Math.random() * dirs.length)]);
        this._wait = 50 + Math.floor(Math.random() * 150);
    };
    // a clear straight run at the hero's tile: nothing in between (a tree, a bush, a rock, a building, a wall) - the boar's charge,
    // a wolf's leap
    Game_Animal.prototype.clearRun = function() {
        return clearLine(pathGrid(), this._x, this._y, $gamePlayer.x, $gamePlayer.y, true);
    };
    // a tile lo-hi tiles from the hero with a clear run at him, the nearest one to walk to (one search from the animal to any of
    // them); kept while he stays about where he was; null when there is none it can get to, undefined when no search may run this
    // frame. near: only places it gets to without a long way round (detour)
    Game_Animal.prototype.runSpot = function(lo, hi, near) {
        const G = pathGrid(), px = $gamePlayer.x, py = $gamePlayer.y, now = Graphics.frameCount, S = this._spot;
        const bad = (this._badSpots || []).filter(b => b.until > now).map(b => b.i);
        const same = q => q && q.lo === lo && Math.abs(q.px - px) + Math.abs(q.py - py) <= 1;
        if (same(S) && now - S.t < 120 && !bad.includes(S.y * G.w + S.x) && clearLine(G, S.x, S.y, px, py, true)) return S;
        if (same(this._noSpot) && now - this._noSpot.t < 30) return null;   // (none a moment ago: not every frame again)
        if (!searchBudget()) return same(S) ? S : undefined;
        this._spot = null;
        const ok = new Set(), R = Math.ceil(hi);
        for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) {
            const r = Math.hypot(x - px, y - py);
            if (r < lo || r > hi || !gridOpen(G, x, y, true) || bad.includes(y * G.w + x)) continue;
            if (clearLine(G, x, y, px, py, true)) ok.add(y * G.w + x);
        }
        const sx = this._x, sy = this._y, goal = near ? (x, y) => ok.has(y * G.w + x) && !detour(costAt(y * G.w + x), sx, sy, x, y) : (x, y) => ok.has(y * G.w + x);
        const res = ok.size ? search8(G, sx, sy, px, py, { animal: true, goal, avoid: avoidList(this) }) : null;
        if (!res || !res.reached) { this._noSpot = { lo, px, py, t: now }; return null; }
        const end = res.path.length ? res.path[res.path.length - 1] : this._y * G.w + this._x;
        return (this._spot = { x: end % G.w, y: Math.floor(end / G.w), px, py, lo, t: now });
    };
    // that place was no good (it got nowhere on the way): not again for a while
    Game_Animal.prototype.badSpot = function(s) {
        const now = Graphics.frameCount, G = pathGrid();
        this._badSpots = (this._badSpots || []).filter(b => b.until > now).concat([{ i: s.y * G.w + s.x, until: now + 300 }]).slice(-8);
        this._spot = null;
    };

    // ------------------------------------------------------------------
    // The boar: it does not run from the player. Once it has noticed him (or a shot flies near it) it stands, snorts and shows
    // "!" (warn), then charges at him, faster than he runs; BOAR.commit tiles away it locks its line and runs straight on. When
    // it reaches him it knocks him about (gore) and backs off for a while (retreat), then it may come again. When it misses (a
    // roll, a step aside) it runs BOAR.overshoot tiles past him (overshoot), stops and stands panting (recover), then turns and
    // warns again. A spear jab stops a charge: it reels back (stagger). Badly hurt it runs away for good (flee).
    // With something between them (a tree, a bush, a rock, a building) it does not stand and does not run into it: it trots round
    // (approach, path8) to a place BOAR.lane tiles from him with a clear run, and warns and charges from there; on its way it goes
    // round what stands in it. Running flat out (the locked line, the run past him) into a tree, a rock, a building or a wall, it
    // hits it and stands stunned (bash) - luring it into a pine is a way to fight it.
    // ------------------------------------------------------------------
    Game_Animal.prototype.setMode = function(mode, frames) {
        const sp = SPECIES[this._kind], running = mode === "charge" || mode === "retreat" || mode === "flee" || mode === "overshoot" || mode === "lunge";
        this._mode = mode;
        this._modeT = frames || 0;
        this._fleeing = mode === "flee";
        this._commit = null;
        // (a pose of its own for the mode - the bear rearing up, striking, leaping: sp.poses)
        const pose = sp.poses && sp.poses[mode];
        const sheet = pose ? pose : (mode === "stalk" || mode === "close") && sp.stalk ? sp.stalk : mode === "windup" && sp.bark ? sp.bark : running && sp.run ? sp.run : sp.sheet;
        if (this.characterName() !== sheet) this.setImage(sheet, 0);
        this.setStepAnime(mode === "windup" || !!pose);   // (the bark plays standing still; so does a pose on the old 4-way sheets)
        this.setMoveSpeed(mode === "charge" || mode === "overshoot" ? sp.charge : running ? sp.flee : (mode === "approach" || mode === "chase") && sp.trot ? sp.trot : sp.speed);
        // the bear plants its feet for a blow or a leap: the step it was in the middle of is finished at once (a quick step in), not
        // glided a whole tile on under the still frames of the pose (2026-10-06; it ends where it would have, so the reach is the same)
        if (sp.bear && (mode === "swipeWind" || mode === "pinWind")) this.setMoveSpeed(5);
        this._modeLen = this._modeT;   // (the whole of a timed mode: a pose's frame goes by how much of it is gone - look8Col)
    };
    // its balance is back after reeling: a boar snorts and comes again, a wolf goes back to the ring, a bear comes on
    Game_Animal.prototype.afterStun = function() {
        this._poise = this._maxPoise;
        if (SPECIES[this._kind].pack) this.setMode("stalk");
        else if (SPECIES[this._kind].bear) { if (this._mode !== "flee") { this.setMode("chase"); this._gapT = 20; } }
        else if (SPECIES[this._kind].aggressive && this._mode !== "flee") this.setMode("warn", 20);
    };
    // the hero parried its attack (Combat.js): it reels a long moment and is thrown back
    Game_Animal.prototype.onParried = function() {
        this._stun = Math.max(this._stun, (SPECIES[this._kind].stun || 50) + 40);
        this._poise = 0;
        knockBack(this);
        if (this._pack && this._pack.attacker === this) { this._pack.attacker = null; this._pack.nextAttack = 90; }
        if (ATTACKING[this._mode]) this.setMode(SPECIES[this._kind].pack ? "stalk" : "warn", 0);
    };
    // a hurt deer or rabbit limps: slower, the more of its life is gone (user) - a bit at first (0.25 of a speed step, ~20%),
    // about a third slower near the end; the boar and the wolves fight on at full speed
    const LIMP = { base: 0.25, more: 0.5 };
    Game_Animal.prototype.limp = function() {
        if (SPECIES[this._kind].aggressive || !(this._maxHp > 0) || !(this._hp < this._maxHp) || this._hp <= 0) return 0;
        return LIMP.base + LIMP.more * (1 - this._hp / this._maxHp);
    };
    Game_Animal.prototype.realMoveSpeed = function() {
        return Game_Character.prototype.realMoveSpeed.call(this) - this.limp();   // (the legs move slower too: the animation follows the speed)
    };
    Game_Animal.prototype.playerDistance = function() {
        return Math.hypot(this.centerX() - ($gamePlayer._realX + 0.5), this.centerY() - ($gamePlayer._realY + 0.5));
    };
    Game_Animal.prototype.updateBoar = function() {
        if (this._modeT > 0) this._modeT--;
        const dist = this.playerDistance();
        if (this._mode === "charge" && dist < BOAR.contact && !this.isJumping()) { gore(this); return; }
        if (this.isMoving() || this.isJumping()) return;
        this.thinkBoar(dist);
    };
    Game_Animal.prototype.thinkBoar = function(dist) {
        const sp = SPECIES[this._kind], dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (this._hp <= this._maxHp * 0.15 && this._mode !== "flee") this.setMode("flee");
        if (this._mode === "overshoot") {   // it missed him: it runs on along its line, well past him, then stops - or into what stands there
            const [cx, cy] = this._line || DIR_VEC[this.direction()], len = Math.hypot(cx, cy) || 1;
            const past = -(($gamePlayer._realX - this._realX) * cx + ($gamePlayer._realY - this._realY) * cy) / len;
            const d = VEC_DIR[cx + "," + cy];
            if (this._modeT <= 0 || past >= BOAR.overshoot || !d) { this.startRecover(); return; }
            if (!roamingCanStep(this, this._x, this._y, d)) { this.bash(d); return; }   // flat out into a tree, a rock, a building, a wall
            roamingStep(this, d);
            return;
        }
        if (this._mode === "recover") {   // it stands panting: the moment to hit it; halfway it turns to look for him
            if (this._modeT === Math.floor(BOAR.recover / 2)) this.turnTowardCharacter($gamePlayer);
            if (this._modeT <= 0) { this.setMode("warn", BOAR.warn); this.turnTowardCharacter($gamePlayer); snort(this, 95); }
            return;
        }
        if (this._mode === "flee" || this._mode === "retreat") {
            if (this._mode === "retreat" && this._modeT <= 0) { this.setMode("roam"); this._aware = 0.55; return; }   // still wary: it notices him again soon
            // beaten and far enough from him: it limps off into the forest (limpAway); out of sight it is gone (and does not come
            // back before dawn). Running on from him step by step it only dithered left and right against a wall or a building.
            if (this._mode === "flee" && dist > sp.sight) { this.limpAway(); return; }
            this._fleeTo = null;
            if (this.fleeRoute(dx, dy, dist)) return;
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this._mode === "stagger") {
            if (this._modeT <= 0) this.setMode("warn", 20);
            return;
        }
        if (this._mode === "warn") {
            this.turnTowardCharacter($gamePlayer);
            this._aware = 1;
            if (dist > sp.sight * 1.6) { this.setMode("roam"); this._aware = 0.5; return; }   // he got away: it calms down
            if (dist > 1.6 && !this.clearRun()) { this.setMode("approach"); return; }   // something in between: round it first (not into it)
            if (this._modeT <= 0) { this.setMode("charge", BOAR.charge); snort(this, 70); }
            return;
        }
        if (this._mode === "approach") {   // trotting round what stands between them, to a place with a clear run at him
            this._aware = 1;
            if (dist > sp.sight * 1.6) { this.setMode("roam"); this._aware = 0.5; return; }
            if (dist <= BOAR.lane[1] + 0.6 && this.clearRun()) { this.setMode("warn", BOAR.laneWarn); this.turnTowardCharacter($gamePlayer); snort(this, 90); return; }
            const spot = this.runSpot(BOAR.lane[0], BOAR.lane[1]), g = spot || { x: $gamePlayer.x, y: $gamePlayer.y };
            if (spot === undefined) return;   // (no search this frame: the next one)
            const r = path8(this, g.x, g.y, { animal: true, key: "lane", near: spot ? 0 : 1 });
            if (!takeStep(this, r.dir)) this.turnTowardCharacter($gamePlayer);
            if (stalled(this, "lane", Math.hypot(this._x - g.x, this._y - g.y), 0.5, g.x, g.y)) { if (spot) this.badSpot(spot); unstall(this); }   // (to and fro, or no nearer: another place)
            return;
        }
        if (this._mode === "charge") {
            if (this._modeT <= 0 || dist > sp.sight * 2) { this.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0]))); return; }
            const G = pathGrid(), px = $gamePlayer.x, py = $gamePlayer.y;
            // the last BOAR.commit tiles it runs straight on, no more turning after him (a roll to the side lets it go past) - only on a
            // clear line: it does not lock itself onto a tree
            if (!this._commit && dist < BOAR.commit) {
                const dx = $gamePlayer._realX - this._x, dy = $gamePlayer._realY - this._y, k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
                const vx = Math.round(Math.cos(k * Math.PI / 4)), vy = Math.round(Math.sin(k * Math.PI / 4));
                if ((Math.abs(dx * vy - dy * vx) / Math.hypot(vx, vy) < 0.6 || dist < 2.6) && rayClear(G, this._x, this._y, vx, vy, Math.max(0, Math.round(dist) - 1), true)) {   // (he is on one of its eight lines)
                    this._commit = [vx, vy];
                    this.setMoveSpeed(sp.charge + BOAR.rush);   // the last stretch: flat out
                }
            }
            if (this._commit) {
                const [cx, cy] = this._commit, ahead = ($gamePlayer._realX - this._realX) * cx + ($gamePlayer._realY - this._realY) * cy;
                const d = VEC_DIR[cx + "," + cy];
                if (!d) { this.startRecover(); return; }
                if (!roamingCanStep(this, this._x, this._y, d)) { this.bash(d); return; }   // flat out into something: it hits it
                if (ahead < -0.6) { this.startOvershoot(); return; }   // gone past him
                roamingStep(this, d);
                return;
            }
            // on the way: straight at him while the line is clear, round what is in the way when not (path8) - never into it
            let d = lineDir(this._x, this._y, px, py);
            if (!d || !clearLine(G, this._x, this._y, px, py, true)) d = path8(this, px, py, { animal: true, key: "charge", near: 1 }).dir;
            if (!takeStep(this, d)) this.turnTowardCharacter($gamePlayer);
            if (stalled(this, "charge", dist, 1.2)) { unstall(this); this.setMode("approach"); }   // it gets no nearer: round to a clear run
            return;
        }
        // roaming
        if (this._aware >= 1 || (this._alarm > 0 && dist < sp.sight * 1.3)) {
            this.setMode("warn", BOAR.warn);
            this.turnTowardCharacter($gamePlayer);
            snort(this, 95);
            return;
        }
        if (this._aware >= 0.3) { this.turnTowardCharacter($gamePlayer); return; }   // it stops and looks
        this.wander();
    };
    // a beaten animal leaving: to one far spot away from the hero (a point by the map's edge, escapeSpot), a step slower, round what
    // is in the way (path8); a new spot when stuck (or going to and fro); gone when out of sight or at the edge
    Game_Animal.prototype.limpAway = function() {
        if (!onScreen(this)) { tallyGone(this); removeAnimal(this); return; }
        const w = $gameMap.width(), h = $gameMap.height();
        if (this._x <= EDGE || this._y <= EDGE || this._x >= w - 1 - EDGE || this._y >= h - 1 - EDGE) { tallyGone(this); removeAnimal(this); return; }
        if (!this._fleeTo || (this._fleeStuck || 0) > 6 || (this._x === this._fleeTo.x && this._y === this._fleeTo.y)) {
            this._fleeTo = escapeSpot(this, $gamePlayer.x, $gamePlayer.y, this._fleeTo);
            this._fleeStuck = 0;
        }
        this.setMoveSpeed(SPECIES[this._kind].speed);   // (walking, not running: slower than its flight; slower still looked frozen)
        const to = this._fleeTo, r = path8(this, to.x, to.y, { animal: true, key: "limp" });
        if (takeStep(this, r.dir)) this._fleeStuck = 0;
        else this._fleeStuck = (this._fleeStuck || 0) + 1;
        if (stalled(this, "limp", Math.hypot(this._x - to.x, this._y - to.y), 1, to.x, to.y)) this._fleeStuck = 99;   // (no nearer, or to and fro: another spot)
    };
    // missed: it keeps its line (the committed one, else the way it faces) and runs on past him
    Game_Animal.prototype.startOvershoot = function() {
        const line = this._commit || DIR_VEC[this.direction()];
        this.setMode("overshoot", 90);
        this._line = line;
        this.setMoveSpeed(SPECIES[this._kind].charge + BOAR.rush);   // (it cannot stop at once)
    };
    // flat out (Combat.js draws the blur of it): a boar on its line or running past him, a wolf in its leap
    Game_Animal.prototype.isRushing = function() {
        return (this._mode === "charge" && !!this._commit) || this._mode === "overshoot" || (this._mode === "lunge" && this.isJumping());
    };
    // it stops (a skid of dust) and stands panting
    Game_Animal.prototype.startRecover = function() {
        this.setMode("recover", BOAR.recover);
        T.call("Combat", "sparksAt", this.centerX(), this.centerY() + 0.3, "#b79a6a", 10);
        snort(this, 60);
    };
    // flat out into a tree, a rock, a building or a wall (its locked charge, its run past him): a thud, dust, what it hit sways, a
    // jolt, and it stands stunned BOAR.bash frames (the swaying and the stars of Combat.js) - the moment to hit it
    Game_Animal.prototype.bash = function(d) {
        const [vx, vy] = DIR_VEC[d] || [0, 0];
        for (const [ox, oy] of vx && vy ? [[vx, vy], [vx, 0], [0, vy]] : [[vx, vy]]) {   // (on a slant: the tile ahead, else one of the two beside it)
            const hit = $gameMap.eventsXy(this._x + ox, this._y + oy).filter(e => e.isNormalPriority() && !e.isThrough());
            if (!hit.length) continue;
            for (const e of hit) { e._treeKickAt = Graphics.frameCount; e._treeKickDir = vx < 0 ? -1 : 1; }   // (ChoppableTree.js: the tree / the rock shakes)
            break;
        }
        const pan = Math.max(-80, Math.min(80, Math.round((this.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        se("Blow1", 90, 55, pan);
        se("Damage3", 45, 50, pan);
        T.call("Combat", "sparksAt", this.centerX() + vx * 0.45, this.centerY() + vy * 0.45 - 0.2, "#b79a6a", 16);
        this.setMode("recover", 0);
        this._stun = Math.max(this._stun, BOAR.bash);
        this._bashed = (this._bashed || 0) + 1;
        if (!this.isJumping()) this.jump(0, 0);
    };
    function snort(animal, pitch) {
        const pan = Math.max(-80, Math.min(80, Math.round((animal.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        se("Monster3", 75, pitch, pan);
    }
    // the boar reaches the player: strength lost and a wound (Survival.js), the screen shakes and flashes red, then it backs off
    function gore(animal) {
        const sp = SPECIES[animal.kind()];
        const Cb = C();
        if (Cb && Cb.hitPlayer) {   // the hero's defence decides (a roll, a guard, a parry)
            const res = Cb.hitPlayer({ damage: atkOf(animal), poise: 75, from: { x: animal.centerX(), y: animal.centerY() }, attacker: animal, name: "dzik", wound: 0.7, knock: 0.9 });
            if (res === "dodged") { animal.startOvershoot(); return; }
            if (res === "parried") return;   // (it reels: onParried)
            animal.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0])));
            return;
        }
        if (typeof $gameSystem.injure === "function") $gameSystem.injure(sp.hurt);
        else $gameSystem.changeStamina(-sp.hurt);
        if (typeof $gameSystem.hurt === "function") $gameSystem.hurt(sp.harm);   // health (Survival.js); at 0 the game is over
        se("Damage3", 90, 90);
        $gameScreen.startShake(5, 8, 16);
        $gameScreen.startFlash([255, 40, 30, 120], 14);
        if (!$gamePlayer.isJumping() && !($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging())) $gamePlayer.jump(0, 0);
        const bandage = $dataItems[ITEM.bandage], hasBandage = !!bandage && $gameParty.numItems(bandage) > 0;
        popup(bandage ? bandage.iconIndex : 0, "Dzik cię poturbował! Jesteś ranny - " + (hasBandage ? "użyj opatrunku (menu Przedmioty)" : "opatrunek z krwawnika zatamuje krew"), "#ff8f7f");
        animal.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0])));
    }
    // a hit that did not kill it: a spear jab throws it back (it comes again after a moment), anything else makes it charge at once
    function enrage(animal, how) {
        if (SPECIES[animal.kind()].pack) { wolfEngage(animal); return; }
        if (SPECIES[animal.kind()].bear) { bearEnrage(animal); return; }
        if (animal._hp <= animal._maxHp * 0.15) { animal.setMode("flee"); return; }
        if (how === "melee") {   // (Combat.js: its balance decides whether it reels; otherwise it turns on the hero quickly)
            if (animal._stun <= 0 && (animal._mode === "roam" || animal._mode === "warn")) { animal.setMode("warn", 16); animal.turnTowardCharacter($gamePlayer); snort(animal, 80); }
            return;
        }
        if (how === "spear") {
            const ax = animal._x - $gamePlayer.x, ay = animal._y - $gamePlayer.y;
            const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
            const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
            if (animal.canPass(animal._x, animal._y, d)) animal.jump(bx, by); else animal.jump(0, 0);
            animal.setMode("stagger", BOAR.stagger);
        } else if (animal._mode !== "charge") {
            animal.turnTowardCharacter($gamePlayer);
            animal.setMode("charge", BOAR.charge);
            snort(animal, 70);
        }
    }

    // a hit throws it one tile away from the hero (a jump), when there is room
    function knockBack(animal) {
        const ax = animal._x - $gamePlayer.x, ay = animal._y - $gamePlayer.y;
        const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
        const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
        if (animal.isJumping()) return;
        if ((bx || by) && animal.canPass(animal._x, animal._y, d)) animal.jump(bx, by); else animal.jump(0, 0);
    }
    // the modes of an attack under way: a boar's charge, a wolf going round to a clear leap, its bark, its leap; a bear drawing back its
    // paw, striking, rearing for the pin, leaping
    const ATTACKING = { charge: true, close: true, windup: true, lunge: true, swipeWind: true, swipe: true, pinWind: true };
    // its balance is gone: it reels (does nothing) for a while; an attack it was about to make is off
    function stagger(animal, knock) {
        const sp = SPECIES[animal.kind()];
        animal._stun = sp.stun || 50;
        animal._poise = 0;
        if (animal._pack && animal._pack.attacker === animal) { animal._pack.attacker = null; animal._pack.nextAttack = 60; }
        if (ATTACKING[animal._mode] && !(sp.bear && animal._mode === "lunge" && animal.isJumping())) animal.setMode(sp.pack ? "stalk" : sp.bear ? "chase" : "warn", 0);
        if (sp.bear) { animal._f8 = 0; if (animal._mode === "warn" || animal._mode === "roam") animal.bearEngage(); }   // (reeling, it is the hero's enemy now)
        if (knock) knockBack(animal);
    }

    // ------------------------------------------------------------------
    // Wolves: a pack hunts at night. Once it has noticed the hero (or he comes within WOLF.engage tiles) it howls and spreads round
    // him on a ring (stalk); one at a time comes in: it crouches and barks (windup, a "!"), leaps at him (lunge: a bite if he is
    // still there) and stands a moment after the leap (recover) - the moment to hit it. Hurt badly, or with the leader dead, they run.
    // ------------------------------------------------------------------
    let dawnSaid = false;   // ("Świta - wilki odchodzą do lasu" once a morning)
    function makePack(members) {
        const pack = { members, leader: members[0], attacker: null, nextAttack: 90, engaged: false, angle: Math.random() * Math.PI * 2, howled: false, broken: false };
        for (const w of members) { w._pack = pack; w.setMode("roam"); }
        members[0]._leader = true;
        members[0]._maxHp = Math.round(members[0]._maxHp * 1.2);
        members[0]._hp = members[0]._maxHp;
        packs().push(pack);
        return pack;
    }
    const liveMembers = pack => pack.members.filter(m => !m._dead);
    function wolfEngage(wolf) {
        const pack = wolf._pack, members = pack ? liveMembers(pack) : [wolf];
        if (pack) {
            if (!pack.engaged) pack.nextAttack = 70;
            pack.engaged = true;
            if (!pack.howled) { pack.howled = true; se("Wolf", 80, 95 + Math.floor(Math.random() * 15)); }
        }
        for (const m of members) {
            m._engaged = true;
            if (m._mode === "roam") m.setMode("stalk");
        }
    }
    function disengage(pack) {
        pack.engaged = false;
        pack.attacker = null;
        for (const m of liveMembers(pack)) { m._engaged = false; m.setMode("roam"); m._aware = 0.4; }
    }
    function growl(wolf) {
        const pan = Math.max(-80, Math.min(80, Math.round((wolf.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        se("Growl", 80, 100 + Math.floor(Math.random() * 20), pan);
    }
    function bite(wolf) {
        se("Bite", 90, 100);
        const Cb = C();
        if (Cb && Cb.hitPlayer) {
            Cb.hitPlayer({ damage: atkOf(wolf), poise: 30, from: { x: wolf.centerX(), y: wolf.centerY() }, attacker: wolf, name: "wilk", wound: 0.3, knock: 0.6 });
            return;
        }
        if (typeof $gameSystem.hurt === "function") $gameSystem.hurt(0.12);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
    }
    Game_Animal.prototype.updateWolf = function() {
        const pack = this._pack;
        // the pack's clock (the pause between two attacks, the turning ring) runs on its first live member
        if (pack && liveMembers(pack)[0] === this) { if (pack.nextAttack > 0) pack.nextAttack--; pack.angle += 0.004; }
        if (this._modeT > 0) this._modeT--;
        const dist = this.playerDistance();
        if (this._mode === "lunge") {
            if (this.isJumping()) {
                this._lungeT = (this._lungeT || 0) + 1;
                if (!this._bitten && this._lungeT >= WOLF.biteFrom && dist < WOLF.bite) { this._bitten = true; bite(this); }
                return;
            }
            this.setMode("recover", WOLF.recover);
            if (pack && pack.attacker === this) { pack.attacker = null; pack.nextAttack = WOLF.gap[0] + Math.floor(Math.random() * (WOLF.gap[1] - WOLF.gap[0])); }
            return;
        }
        // day breaks: the pack stops the hunt and runs off into the forest (gone once out of sight) - the user saw wolves that came
        // in the night still bite him in the morning (2026-09-26)
        if (!this._summoned && !activeNow("wolf") && this._mode !== "flee") {
            if (pack && pack.engaged) disengage(pack);
            this._engaged = false;
            this._dawn = true;
            this.setMode("flee");
            if (!dawnSaid) { dawnSaid = true; popup(0, "Świta - wilki odchodzą do lasu", "#cfe6a8"); }
        }
        if (activeNow("wolf")) dawnSaid = false;
        if (this.isMoving() || this.isJumping()) return;
        this.thinkWolf(dist);
    };
    Game_Animal.prototype.thinkWolf = function(dist) {
        const pack = this._pack, dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (this._mode === "flee") {
            if (dist > WOLF.lose + 2) { removeAnimal(this); return; }   // gone into the dark
            if (this.fleeRoute(dx, dy, dist)) return;
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this._hp <= this._maxHp * WOLF.flee || (pack && pack.broken)) {
            if (pack && pack.attacker === this) pack.attacker = null;
            this.setMode("flee");
            return;
        }
        if ((this._mode === "windup" || this._mode === "close") && pack && pack.attacker !== this) { this.setMode("stalk"); return; }   // (not its turn any more: one at a time)
        if (this._mode === "windup") {
            this.turnTowardCharacter($gamePlayer);
            if (!this.clearRun()) { this.callOff(20); return; }   // he stepped behind a tree: no leap into it
            if (this._modeT <= 0) this.leap();
            return;
        }
        if (this._mode === "recover") {
            if (this._modeT <= 0) this.setMode("stalk");
            return;
        }
        const engaged = pack ? pack.engaged : this._engaged;
        if (!engaged) {
            if (this._aware >= 1 || this._alarm > 0 || this._wounded || dist < WOLF.engage) { wolfEngage(this); return; }
            if (pack && pack.leader !== this && !pack.leader._dead) {   // it keeps near the leader
                const L = pack.leader;
                if (Math.hypot(L._x - this._x, L._y - this._y) > 2.2) {
                    this.setMoveSpeed(SPECIES.wolf.speed);
                    if (takeStep(this, path8(this, L._x, L._y, { animal: true, key: "pack", near: 1.5 }).dir)) return;
                }
            }
            this.wander();
            return;
        }
        // lost him: only when none of the pack is near him (one left far behind comes back). A straggler past WOLF.lose that called the
        // hunt off while one beside him called it on again, every frame, froze the whole pack (the 6-day marathon, the map's edge)
        if (dist > WOLF.lose && (!pack || liveMembers(pack).every(m => m.playerDistance() > WOLF.lose))) { if (pack) disengage(pack); else { this._engaged = false; this.setMode("roam"); } return; }
        if (this._mode === "close") { this.thinkClose(dist); return; }
        if (this._mode !== "stalk") this.setMode("stalk");
        // its turn, when the pack's pause is over: the stalking wolf nearest to the hero with a clear leap at him (not the one that
        // went last, if another can: they come from all sides); without a clear leap it first goes round to one (close)
        if (pack && !pack.attacker && pack.nextAttack <= 0 && pickAttacker(pack) === this) {
            pack.attacker = this;
            pack.last = this;
            if (dist > WOLF.near && dist < WOLF.ring + 1.8 && this.clearRun()) { this.setMode("windup", WOLF.windup); this.turnTowardCharacter($gamePlayer); growl(this); }
            else this.setMode("close", WOLF.close);
            return;
        }
        // its own place on the ring round the hero (ringSlot), the way round what is in the way (path8). With no place on the ring
        // it can get to (the map's edge, a wall, a thicket round him): a place near him with a clear run (runSpot), else up to him
        let slot = this.ringSlot(pack ? liveMembers(pack) : [this], pack ? pack.angle : 0), kind = "ring";
        if (!slot) {
            const s = this.runSpot(WOLF.near + 0.4, WOLF.ring + 0.8, true);
            if (s === undefined) return;   // (no search this frame: the next one)
            slot = s || { x: $gamePlayer.x, y: $gamePlayer.y };
            kind = s ? "spot" : "him";
        }
        const off = Math.hypot(slot.x - this._realX, slot.y - this._realY), there = kind === "him" ? 1.6 : 0.9;
        if (off > there) {
            const r = path8(this, slot.x, slot.y, { animal: true, key: "ring", near: kind === "him" ? 1.5 : 0 });
            // it cannot get any nearer, or only the long way round: another place
            if (!r.greedy && ((!r.reached && r.to.x === this._x && r.to.y === this._y) || (r.reached && detour(r.steps, this._x, this._y, slot.x, slot.y)))) this.dropPlace(slot, kind);
            if (takeStep(this, r.dir)) this._still = 0;
            else this.turnTowardCharacter($gamePlayer);
        } else {
            this.turnTowardCharacter($gamePlayer);
            // standing there a while it paces a little along the ring (the ring turns slowly: again till it is off); nowhere to pace
            // to - another place (beside him: a step round him)
            this._still = (this._still || 0) + 1;
            if (this._still > WOLF.pace && (kind !== "ring" || !this.paceOn(pack ? pack.angle : 0))) { this._still = 0; this.dropPlace(slot, kind); }
        }
        if (stalled(this, "ring", off, there, slot.x, slot.y)) { this.dropPlace(slot, kind); unstall(this); }
    };
    // a place it gives up (it cannot get there, only the long way round, or it paces on): not again for a while
    Game_Animal.prototype.dropPlace = function(slot, kind) {
        if (kind === "spot") { this.badSpot(slot); return; }
        if (kind === "him") { this.shuffle(); return; }
        const G = pathGrid(), now = Graphics.frameCount;
        this._badSlots = (this._badSlots || []).filter(b => b.until > now).concat([{ i: slot.y * G.w + slot.x, until: now + 300 }]).slice(-12);
        this._slotBad = true;
    };
    // a step to an open tile round the hero, near him (pacing where there is no room for the ring)
    Game_Animal.prototype.shuffle = function() {
        const px = $gamePlayer._realX, py = $gamePlayer._realY, G = pathGrid();
        const dirs = DIRS8.filter(d => { const [ox, oy] = STEP[d], r = Math.hypot(this._x + ox - px, this._y + oy - py); return r >= 0.9 && r <= 3.5 && gridStep8(G, this._x, this._y, d, true); });
        if (dirs.length) takeStep(this, dirs[Math.floor(Math.random() * dirs.length)]);
    };
    // Its own place on the ring round the hero: an angle of its own (they spread round him, not one behind the other) on the ring
    // that turns slowly. A place off the map, in a tree, a rock or a building, or one it could not get to, is given up for the nearest
    // free one round the ring, away from the others' places (null: none - at the map's edge, by a wall, in a thicket). Standing there a
    // while it paces a little to and fro along the ring.
    const angGap = (a, b) => { const d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; };
    Game_Animal.prototype.ringSlot = function(live, turn) {
        const G = pathGrid(), n = live.length;
        if (this._slot === undefined || this._slotN !== n) { this._slot = Math.max(0, live.indexOf(this)) * Math.PI * 2 / n; this._slotN = n; }
        const ok = this.slotOk();
        const s = ringTile(turn + this._slot + (this._paceOff || 0));
        if (!this._slotBad && ok(s)) return s;
        this._slotBad = false;
        this._paceOff = 0;
        const others = live.filter(m => m !== this && m._slot !== undefined).map(m => m._slot);
        for (const apart of [Math.PI / (n + 1), 0]) {   // (away from the others' places; in a thicket, anywhere open)
            for (let k = 1; k <= 8; k++) for (const sg of [1, -1]) {   // (round the ring both ways, the nearest first)
                const a = this._slot + sg * k * Math.PI / 8, q = ringTile(turn + a);
                if (!ok(q) || (q.x === this._x && q.y === this._y) || others.some(o => angGap(o, a) < apart)) continue;
                this._slot = a;
                return q;
            }
        }
        return null;
    };
    // a ring tile it may take: on the map, open, near him on foot too (not across a wall from him - heroField), not one it gave up a
    // moment ago (dropPlace)
    Game_Animal.prototype.slotOk = function() {
        const G = pathGrid(), now = Graphics.frameCount, bad = (this._badSlots || []).filter(b => b.until > now).map(b => b.i);
        const near = heroField(WOLF.ring * 2 + 3);
        return q => gridOpen(G, q.x, q.y, true) && near[q.y * G.w + q.x] !== Infinity && !bad.includes(q.y * G.w + q.x);
    };
    // the tile of the ring round the hero at that angle
    const ringTile = a => ({ x: Math.round($gamePlayer._realX + Math.cos(a) * WOLF.ring), y: Math.round($gamePlayer._realY + Math.sin(a) * WOLF.ring * 0.8) });
    // pacing: a step or two along the ring, to one side and then the other - to an open tile other than the one it stands on (false:
    // there is none)
    Game_Animal.prototype.paceOn = function(turn) {
        const ok = this.slotOk(), side = this._paceSide = -(this._paceSide || 1);
        for (const off of [0.35 * side, 0.6 * side, -0.35 * side, -0.6 * side, 0]) {
            const q = ringTile(turn + this._slot + off);
            if ((q.x !== this._x || q.y !== this._y) && ok(q)) { this._paceOff = off; return true; }
        }
        return false;
    };
    // whose turn it is: the stalking wolf nearest to him, one with a clear leap before one without, not the last one if another can
    function pickAttacker(pack) {
        let best = null, bestS = Infinity;
        for (const m of liveMembers(pack)) {
            if (m._mode !== "stalk" || m._stun > 0) continue;
            const d = m.playerDistance(), s = d + (m.clearRun() ? 0 : 2.5) + (pack.last === m ? 1.5 : 0) + (d <= WOLF.near ? 2 : 0);
            if (s < bestS) { bestS = s; best = m; }
        }
        return best;
    }
    // the pack's attacker without a clear leap at him (a tree, a bush in between): it goes round to a place near him with one
    // (runSpot), then barks and leaps; given up when it takes too long or gets nowhere (the pack waits a moment)
    Game_Animal.prototype.thinkClose = function(dist) {
        const clear = dist < WOLF.lunge + 0.9 && this.clearRun(), windup = () => { this.setMode("windup", WOLF.windup); this.turnTowardCharacter($gamePlayer); growl(this); };
        if (clear && (dist > WOLF.near || WOLF.close - this._modeT > 60)) { windup(); return; }   // (right beside him: a moment to back off, then a snap from there)
        const spot = this.runSpot(WOLF.near + 0.4, WOLF.lunge, true);
        if (spot === null && clear) { windup(); return; }
        if (this._modeT <= 0 || spot === null) { this.callOff(30); return; }
        if (!spot) return;   // (no search this frame: the next one)
        const r = path8(this, spot.x, spot.y, { animal: true, key: "close" });
        if (!takeStep(this, r.dir)) this.turnTowardCharacter($gamePlayer);
        if (stalled(this, "close", Math.hypot(this._x - spot.x, this._y - spot.y), 0.5, spot.x, spot.y)) { this.badSpot(spot); unstall(this); }
    };
    // an attack called off before the leap (he is behind a tree, no way round to him): back to the ring, the pack waits a moment
    Game_Animal.prototype.callOff = function(wait) {
        const pack = this._pack;
        if (pack && pack.attacker === this) { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, wait || 30); }
        this.setMode("stalk");
    };
    // the leap: of the tiles within WOLF.lunge it can leap to along a clear line (never over a tree or into one; his own tile is fine),
    // the one nearest to him - his tile, else the one beside it (at the map's edge, by a wall, his tile may be no landing)
    Game_Animal.prototype.leap = function() {
        const G = pathGrid(), px = $gamePlayer._realX, py = $gamePlayer._realY, R = WOLF.lunge, F = T.api("Farming");
        let lx = 0, ly = 0, best = Math.hypot(this._x - px, this._y - py) - 0.01;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const x = this._x + dx, y = this._y + dy, him = x === $gamePlayer.x && y === $gamePlayer.y, d = Math.hypot(x - px, y - py);
            if (d >= best || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || (F && F.buildingAt(x, y))) continue;
            if (!(him || gridOpen(G, x, y, true)) || !clearLine(G, this._x, this._y, x, y, true, !him)) continue;
            best = d;
            lx = dx;
            ly = dy;
        }
        this.turnTowardCharacter($gamePlayer);
        this.setMode("lunge");
        this._bitten = false;
        this._lungeT = 0;
        this.jump(lx, ly);
        se("Wind1", 55, 140);
    };

    // ------------------------------------------------------------------
    // The bear (stage 2 of the fight, 2026-10-05). Slow and heavy, it keeps to its corner of the forest (its home: where it came out).
    // Once it is sure of the hero (the "!") it usually rears up on its hind legs and roars (warn) - his chance to back off: if he is more
    // than BEAR_AI.calm tiles off when it drops back on all fours, it lets him be (it watches him; only coming within BEAR_AI.engage
    // tiles starts it again); if he comes within BEAR_AI.engage tiles, or hits it, he is its enemy. Then it comes at him (chase), slower
    // than he walks, and strikes one of two ways - both shown first (the "!", a pose), both past any shield and any parry: only a roll
    // (Space) or a step out of the way saves him (Combat.hitPlayer: unblockable, unparryable).
    //   the paw (swipeWind -> swipe): beside him it draws the paw back (BEAR_AI.swipe.windup frames), then sweeps a cone in front of it -
    //     the way it faced as it drew back: a roll, or a step out of its reach or aside, and the paw goes through the air;
    //   the pin (pinWind -> lunge): 2-4 tiles from him it rears up high (longer), then throws itself forward - a short leap at where he
    //     stood as it left the ground; coming down on him it knocks him flat (BEAR_AI.pin.down frames on the ground) and hurts him badly.
    // After either it stands a moment (recover) - the opening; after a missed pin a longer one. It reels only when its balance is
    // broken: the heavy blows and the blows from hiding take it whole, the light ones only BEAR_AI.light of it (Hunting_Weapons.js hit).
    // It does not follow far: BEAR_AI.leash tiles from its home, or with the hero BEAR_AI.lose tiles away, it turns back home (leave)
    // and calms down. Once it fights it fights to the death (the user's, 2026-10-05: "walczy do końca" - BEAR_AI.flee 0; a part of its
    // life there would send it limping off into the forest, like a beaten boar). A fight with it the hero lives through (it went home or
    // died) counts in _tw.hunt.bears (the journal's goal "Przeżyj spotkanie z niedźwiedziem").
    // ------------------------------------------------------------------
    const BEAR_AI = { warnChance: 0.8, warn: 120, calm: 5.5, engage: 3.2, rearAgain: 900, leash: 12, lose: 11, gap: [40, 80], stand: 1.35, pinAfter: 150,
        swipe: { at: 1.8, reach: 2.1, cone: 0.15, windup: 28, after: 16, recover: 52,   // (windup 28 + SWIPE_HIT 6: the blow lands 34 frames in, as before 2026-10-06)
                 mult: 1, poise: 55, wound: 0.5, knock: 0.9 },
        pin: { from: 2.2, to: 3.9, chance: 0.5, windup: 46, leap: 3, hitFrom: 6, hitDist: 1.1, recover: 70, miss: 110, mult: 1.35, down: 70, wound: 0.8 },
        light: 0.3, flee: 0, roar: { up: 28, down: 22 } };   // roar: the frames it takes to rise for it and to drop back (the warning's sheet)
    const OCT = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };   // octant of (dx, dy) (y down) -> numpad
    const octOf = (dx, dy) => OCT[Math.round(Math.atan2(dy, dx) / (Math.PI / 4))] || 2;
    const toHero = a => [$gamePlayer._realX + 0.5 - a.centerX(), $gamePlayer._realY + 0.5 - a.centerY()];
    const bears = () => hunt().bears || (hunt().bears = { met: 0, survived: 0 });
    function roar(bear, pitch) {
        const pan = Math.max(-80, Math.min(80, Math.round((bear.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        se("Monster5", 90, pitch || 60, pan);
        se("Growl", 70, 55, pan);
    }
    const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const SETTLE = 18;          // frames the paw takes back to the stance after the blow (shown in "recover")
    const SWIPE_HIT = 6;        // frames into the sweep when the paw lands (the blow is dealt then: the picture and the hurt agree)
    const HIT_STOP = 2;         // frames the bear holds still when the paw lands on him, after the world's own hitstop (Combat: 6) - more felt stiff
    // how hard it pants (Hunting.js: its breathing sheet plays this much faster) - after a blow it heaves
    Game_Animal.prototype.breathRate = function() { return this._mode === "recover" ? 1.7 : 1; };
    // the body thrown into the blow (Hunting.js adds it to the sprite): drawn back a little as it shifts its weight, forward with the
    // paw, back again while it settles; px in the locked way (shorter up and down the screen)
    Game_Animal.prototype.lungeOffset = function() {
        if (!SPECIES[this._kind].bear || !this._lock) return null;
        const len = Math.max(1, this._modeLen || 1), gone = 1 - Math.max(0, this._modeT) / len;
        let k = 0;
        if (this._mode === "swipeWind") k = -4 * easeInOut(Math.max(0, (gone - 0.5) * 2));
        else if (this._mode === "swipe") k = gone < 0.35 ? -4 + 18 * easeInOut(gone / 0.35) : 14 * (1 - easeInOut((gone - 0.35) / 0.65)) ;
        else if (this._mode === "recover" && this._settle > 0) k = 0;
        else return null;
        return [Math.round(this._lock[0] * k), Math.round(this._lock[1] * k * 0.7)];
    };
    // the 8-way facing a pose shows (Hunting.js LOOK8 asks it): towards the hero while it rears or strikes; 0 = from its steps
    Game_Animal.prototype.face8 = function() { return this._f8 || 0; };
    // the frame of a pose sheet (cells: how many it has): how far the rearing, the paw or the leap has got
    Game_Animal.prototype.look8Col = function(cells, look) {
        const len = Math.max(1, this._modeLen || 1), gone = 1 - Math.max(0, this._modeT) / len, last = cells - 1;
        if (this._mode === "warn" && look && look.rise) {   // the roar's sheet: up on the hind legs (its first `rise` cells), the roar, down again
            const up = BEAR_AI.roar.up, down = BEAR_AI.roar.down, t = len - this._modeT, rise = look.rise;
            if (t < up) return Math.min(rise - 1, Math.floor(t / up * rise));
            if (this._modeT < down) return Math.max(0, Math.min(rise - 1, Math.floor(this._modeT / down * rise)));
            return Math.min(last, rise + Math.floor((t - up) / Math.max(1, len - up - down) * (cells - rise)));
        }
        if (this._mode === "warn") {   // up on the hind legs in the first third, the roar held, down again in the last 30 frames
            const down = this._modeT < 30 ? this._modeT / 30 : 1;
            return Math.round(Math.min(1, gone * 3, down) * last);
        }
        if (this._mode === "pinWind") return Math.round(Math.min(1, gone * 1.6) * last);   // rearing up high, held at the top
        // the paw (2026-10-06, a real strike on all fours): the weight back slowly (eased), the lunge fast, the paw held a moment
        // where it lands, then (in the first frames of "recover", _settle) back to the stance
        const back = Math.round(last * 5 / 12), hit = Math.round(last * 9 / 12);
        if (this._mode === "swipeWind") return Math.round(easeInOut(gone) * back);
        if (this._mode === "swipe") return back + 1 + Math.round(Math.min(1, gone / 0.55) * (hit - back - 1));
        if (this._mode === "recover" && this._settle > 0) return this._settleOf === "lunge" ? last : hit + 1 + Math.round((1 - this._settle / SETTLE) * (last - hit - 1));
        if (this._mode === "lunge") {   // (the sheet starts where the rearing ends: it tips forward at once and is flat out by the top of the leap)
            const n = this._jumpPeak * 2 || 1;
            return this.isJumping() ? Math.round(Math.sqrt(Math.min(1, (n - this._jumpCount) / n)) * last) : last;
        }
        return undefined;
    };
    Game_Animal.prototype.updateBear = function() {
        if (this._hitStop > 0) { this._hitStop--; return; }   // (the paw landed: everything holds a moment)
        if (this._settle > 0 && --this._settle === 0 && this._mode === "recover") this.setImage(SPECIES[this._kind].sheet, 0);
        if (this._modeT > 0) this._modeT--;
        if (this._gapT > 0) this._gapT--;
        const dist = this.playerDistance();
        if (this._mode === "lunge") {   // in the air: it comes down on him, or beside him
            if (this.isJumping()) {
                this._lungeT = (this._lungeT || 0) + 1;
                if (!this._bitten && this._lungeT >= BEAR_AI.pin.hitFrom && dist < BEAR_AI.pin.hitDist) { this._bitten = true; bearPin(this); }
                return;
            }
            if (!this._bitten && dist < BEAR_AI.pin.hitDist) { this._bitten = true; bearPin(this); }
            T.call("Combat", "sparksAt", this.centerX(), this.centerY() + 0.35, "#9c8260", 12);   // (the dust where it lands)
            if (!this._pinHit) $gameScreen.startShake(2, 6, 8);
            this.setMode("recover", this._pinHit ? BEAR_AI.pin.recover : BEAR_AI.pin.miss);
            // it stays down where it landed a moment (the leap's last frame), then stands - not a frame of its walk first
            const pose = SPECIES[this._kind].poses && SPECIES[this._kind].poses.lunge;
            if (pose) { this.setImage(pose, 0); this._settle = SETTLE; this._settleOf = "lunge"; }
            return;
        }
        if (this._mode === "swipeWind") {   // the paw drawn back, the way locked: then the sweep
            if (this._modeT <= 0) { this.setMode("swipe", BEAR_AI.swipe.after); this._swiped = false; se("Wind7", 70, 80); }
            return;
        }
        if (this._mode === "swipe") {
            if (!this._swiped && this._modeLen - this._modeT >= SWIPE_HIT) {   // the paw lands now (its frame): the blow
                this._swiped = true;
                if (bearSwipe(this)) { this._hitStop = HIT_STOP; $gameScreen.startShake(4, 9, 10); }
                slashFx(this);
            }
            if (this._modeT <= 0) {   // back to the stance on the paw's own frames, then its standing sheet (updateBear: _settle)
                const pose = SPECIES[this._kind].poses && SPECIES[this._kind].poses.swipe;
                this.setMode("recover", BEAR_AI.swipe.recover);
                if (pose) { this.setImage(pose, 0); this._settle = SETTLE; this._settleOf = "swipe"; }
            }
            return;
        }
        if (this._mode === "pinWind") {   // reared up high, it follows him with its eyes - then the leap
            const [hx, hy] = toHero(this);
            this._f8 = octOf(hx, hy);
            this.turnTowardCharacter($gamePlayer);
            if (this._modeT <= 0) this.pinLeap();
            return;
        }
        if (this.isMoving() || this.isJumping()) return;
        this.thinkBear(dist);
    };
    Game_Animal.prototype.thinkBear = function(dist) {
        const sp = SPECIES[this._kind], dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (BEAR_AI.flee > 0 && this._hp <= this._maxHp * BEAR_AI.flee && this._mode !== "flee") { this.bearOver(); this.setMode("flee"); }
        if (this._mode === "flee") {   // (only with BEAR_AI.flee above 0) beaten: off into the forest, gone once out of sight (like a beaten boar)
            this._f8 = 0;
            if (dist > sp.sight) { this.limpAway(); return; }
            this._fleeTo = null;
            if (this.fleeRoute(dx, dy, dist)) return;
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this._mode === "recover") {   // it stands after a blow (the opening), then comes on
            if (this._modeT <= 0) { this._f8 = 0; this.setMode("chase"); this._gapT = BEAR_AI.gap[0] + Math.floor(Math.random() * (BEAR_AI.gap[1] - BEAR_AI.gap[0])); this._chaseT = 0; this._wantPin = undefined; }
            return;
        }
        if (this._mode === "warn") {   // up on its hind legs, roaring: back off now, or it comes
            const [hx, hy] = toHero(this);
            this._aware = 1;
            this._f8 = octOf(hx, hy);
            this.turnTowardCharacter($gamePlayer);
            if (dist < BEAR_AI.engage) { this.bearEngage(); return; }
            if (this._modeT <= 0) {
                if (dist > BEAR_AI.calm) { this._f8 = 0; this.setMode("roam"); this._aware = 0.6; return; }   // he kept away: it lets him be
                this.bearEngage();
            }
            return;
        }
        if (this._mode === "leave") {   // back home, calming down (a blow on the way turns it again: bearEnrage)
            const h = this._home || { x: this._x, y: this._y };
            if (Math.hypot(this._x - h.x, this._y - h.y) <= 1.5 || (this._leaveT = (this._leaveT || 0) + 1) > 900) {
                this.setMode("roam"); this._aware = 0.3; this._warnedAt = Graphics.frameCount; return;
            }
            const r = path8(this, h.x, h.y, { animal: true, key: "home", near: 1 });
            if (!takeStep(this, r.dir)) this.wander();
            if (stalled(this, "home", Math.hypot(this._x - h.x, this._y - h.y), 1, h.x, h.y)) unstall(this);
            return;
        }
        if (this._mode === "chase") { this.chaseBear(dist); return; }
        // roaming: it notices him - rears up and roars (mostly), or comes at once; warned a moment ago and he keeps away, it watches him
        if (this._aware >= 1 || (this._alarm > 0 && dist < sp.sight)) {
            const warned = this._warnedAt !== undefined && Graphics.frameCount - this._warnedAt < BEAR_AI.rearAgain;
            if (!warned && Math.random() < BEAR_AI.warnChance) { this.bearRear(); return; }
            if (!warned || dist < BEAR_AI.engage) { this.bearEngage(); return; }
            this.turnTowardCharacter($gamePlayer);
            return;
        }
        if (this._aware >= 0.3) { this.turnTowardCharacter($gamePlayer); return; }   // it stops and looks
        if (this._home && Math.hypot(this._x - this._home.x, this._y - this._home.y) > BEAR_AI.leash * 0.6) {   // (a wander keeps near home)
            const r = path8(this, this._home.x, this._home.y, { animal: true, key: "home", near: 2 });
            this.setMoveSpeed(sp.speed);
            if (this._wait > 0) { this._wait--; return; }
            takeStep(this, r.dir);
            this._wait = 30 + Math.floor(Math.random() * 60);
            return;
        }
        this.wander();
    };
    // up on the hind legs with a roar: the warning
    Game_Animal.prototype.bearRear = function() {
        const [hx, hy] = toHero(this);
        this._warnedAt = Graphics.frameCount;
        this._f8 = octOf(hx, hy);
        this.turnTowardCharacter($gamePlayer);
        this.setMode("warn", BEAR_AI.warn);
        roar(this, 62);
        $gameScreen.startShake(1, 4, 20);
    };
    // the hero is its enemy now: it comes (a bear met - the journal counts the ones lived through)
    Game_Animal.prototype.bearEngage = function() {
        if (!this._met) { this._met = true; bears().met++; }
        this._engaged = true;
        this._f8 = 0;
        this._aware = 1;
        this.setMode("chase");
        this._gapT = 24;
        this._chaseT = 0;
        this._wantPin = undefined;
        if (!this._roared) { this._roared = true; roar(this, 70); }
    };
    // the fight is over and the hero lives (it went home, ran off, or he killed it): once per bear
    Game_Animal.prototype.bearOver = function() {
        const actor = $gameParty.leader();
        if (!this._met || this._over || !actor || actor.hp <= 0) return;
        this._over = true;
        bears().survived++;
        T.emit("bearSurvived", { animal: this, killed: this._hp <= 0 });
    };
    // too far from home, or he got away: back home
    Game_Animal.prototype.bearLeave = function() {
        this.bearOver();
        this._engaged = false;
        this._f8 = 0;
        this._leaveT = 0;
        this.setMode("leave");
        this._warnedAt = Graphics.frameCount;
        se("Monster5", 60, 50);
    };
    Game_Animal.prototype.chaseBear = function(dist) {
        const h = this._home || { x: this._x, y: this._y };
        if (Math.hypot(this._x - h.x, this._y - h.y) > BEAR_AI.leash || dist > BEAR_AI.lose) { this.bearLeave(); return; }
        this._aware = 1;
        this._chaseT = (this._chaseT || 0) + 1;
        if (this._gapT <= 0) {
            // (once per approach: the pin from a few tiles, or the paw close in - kept off a long while, it leaps all the same)
            if (this._wantPin === undefined) this._wantPin = Math.random() < BEAR_AI.pin.chance;
            if (dist <= BEAR_AI.swipe.at) { this.startSwipe(); return; }
            if ((this._wantPin || this._chaseT > BEAR_AI.pinAfter) && dist >= BEAR_AI.pin.from && dist <= BEAR_AI.pin.to && this.clearRun()) { this.startPin(); return; }
        }
        if (dist <= BEAR_AI.stand) { this.turnTowardCharacter($gamePlayer); return; }   // (beside him it does not walk into him)
        const G = pathGrid(), px = $gamePlayer.x, py = $gamePlayer.y;
        let d = lineDir(this._x, this._y, px, py);
        if (!d || !clearLine(G, this._x, this._y, px, py, true)) d = path8(this, px, py, { animal: true, key: "bear", near: 1 }).dir;
        if (!takeStep(this, d)) this.turnTowardCharacter($gamePlayer);
        if (stalled(this, "bear", dist, 1)) unstall(this);
    };
    // the paw: the way it faces now is locked (a cone that way), the "!" and the drawn-back paw, then the sweep (bearSwipe)
    Game_Animal.prototype.startSwipe = function() {
        const [hx, hy] = toHero(this), d = Math.hypot(hx, hy) || 1;
        this._lock = [hx / d, hy / d];
        this._f8 = octOf(hx, hy);
        this.turnTowardCharacter($gamePlayer);
        this.setMode("swipeWind", BEAR_AI.swipe.windup);
        const pan = Math.max(-80, Math.min(80, Math.round(-hx * 12)));
        se("Growl", 85, 60, pan);
    };
    // the pin: it rears up high (longer than the paw), then leaps (pinLeap)
    Game_Animal.prototype.startPin = function() {
        const [hx, hy] = toHero(this);
        this._f8 = octOf(hx, hy);
        this.turnTowardCharacter($gamePlayer);
        this.setMode("pinWind", BEAR_AI.pin.windup);
        roar(this, 75);
    };
    // the leap: of the tiles within BEAR_AI.pin.leap it can get to along a clear line, the one nearest to where he stands now (his own tile
    // too) - he has the leap's flight to get out of the way
    Game_Animal.prototype.pinLeap = function() {
        const G = pathGrid(), px = $gamePlayer._realX, py = $gamePlayer._realY, R = BEAR_AI.pin.leap, F = T.api("Farming");
        let lx = 0, ly = 0, best = Math.hypot(this._x - px, this._y - py) - 0.01;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const x = this._x + dx, y = this._y + dy, him = x === $gamePlayer.x && y === $gamePlayer.y, d = Math.hypot(x - px, y - py);
            if (d >= best || Math.hypot(dx, dy) > R + 0.5 || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || (F && F.buildingAt(x, y))) continue;
            if (!(him || gridOpen(G, x, y, true)) || !clearLine(G, this._x, this._y, x, y, true, !him)) continue;
            best = d;
            lx = dx;
            ly = dy;
        }
        this._f8 = lx || ly ? octOf(lx, ly) : this._f8;
        this.setMode("lunge");
        this._bitten = false;
        this._pinHit = false;
        this._lungeT = 0;
        this.jump(lx, ly);
        se("Wind1", 70, 70);
    };
    // the sweep of the paw: whoever is within its reach and in the cone it locked takes it (no shield, no parry: a roll gets out)
    function bearSwipe(bear) {
        const S = BEAR_AI.swipe, [hx, hy] = toHero(bear), d = Math.hypot(hx, hy), [lx, ly] = bear._lock || [0, 1];
        const pan = Math.max(-80, Math.min(80, Math.round(-hx * 12)));
        T.call("Combat", "sparksAt", bear.centerX() + lx * 1.1, bear.centerY() + ly * 1.1 - 0.15, "#b49a74", 10);   // (the dust the paw throws up)
        if (d > S.reach || (d > 0.3 && (hx * lx + hy * ly) / d < S.cone)) return false;   // (out of its reach or beside it: the paw goes through the air)
        se("Blow2", 85, 70, pan);
        const Cb = C();
        if (Cb && Cb.hitPlayer) {
            Cb.hitPlayer({ damage: Math.round(atkOf(bear) * S.mult), poise: S.poise, from: { x: bear.centerX(), y: bear.centerY() }, attacker: bear, name: "niedźwiedź",
                wound: S.wound, knock: S.knock, unblockable: true, unparryable: true });
            return true;
        }
        if (typeof $gameSystem.hurt === "function") $gameSystem.hurt(0.3);
        $gameScreen.startFlash([255, 40, 30, 120], 12);
        return true;
    }
    let slashBmp = null;
    function slashBitmap() {
        if (slashBmp) return slashBmp;
        const b = new Bitmap(112, 112), c = b.context;
        c.lineCap = "round";
        for (let i = 0; i < 3; i++) {   // three claws, a dark edge under a pale stroke
            const r = 30 + i * 9, y0 = 56 + (i - 1) * 3;
            for (const [w, col] of [[6, "rgba(40,24,14,0.55)"], [3, "rgba(255,246,226,0.95)"]]) {
                c.lineWidth = w; c.strokeStyle = col;
                c.beginPath(); c.arc(30, y0, r, -0.95, 0.95); c.stroke();
            }
        }
        b._baseTexture.update();
        return (slashBmp = b);
    }
    function slashFx(bear) {
        const scene = SceneManager._scene, set = scene && scene._spriteset;
        if (!set || !set._tilemap || !bear._lock) return;
        const [lx, ly] = bear._lock, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const s = new Sprite(slashBitmap());
        s.anchor.set(0.27, 0.5);
        s.rotation = Math.atan2(ly * 0.7, lx);
        s.z = 6;
        const mx = bear.centerX() + lx * 0.95, my = bear.centerY() + ly * 0.95 - 0.35;
        let t = 0;
        s.update = function() {
            t++;
            this.x = Math.round($gameMap.adjustX(mx) * tw);
            this.y = Math.round($gameMap.adjustY(my) * th);
            const k = t / 14;
            this.opacity = Math.round(255 * (k < 0.25 ? 1 : 1 - (k - 0.25) / 0.75));
            this.scale.set(0.75 + 0.35 * Math.min(1, k * 2), 0.75 + 0.35 * Math.min(1, k * 2));
            if (t >= 14 && this.parent) { this.parent.removeChild(this); }
        };
        s.update();
        set._tilemap.addChild(s);
    }
    // it came down on him: knocked flat, hurt badly, maybe wounded (a roll's moment of safety still saves him: "dodged")
    function bearPin(bear) {
        const P2 = BEAR_AI.pin, Cb = C();
        se("Blow6", 95, 60);
        if (Cb && Cb.hitPlayer) {
            const res = Cb.hitPlayer({ damage: Math.round(atkOf(bear) * P2.mult), poise: 9999, down: P2.down, from: { x: bear.centerX(), y: bear.centerY() }, attacker: bear,
                name: "niedźwiedź", wound: P2.wound, knock: 0.3, unblockable: true, unparryable: true });
            bear._pinHit = res === "hit";
            if (bear._pinHit) $gameScreen.startShake(7, 9, 18);
            return res;
        }
        bear._pinHit = true;
        if (typeof $gameSystem.injure === "function") $gameSystem.injure(25);
        if (typeof $gameSystem.hurt === "function") $gameSystem.hurt(0.4);
        $gameScreen.startFlash([255, 40, 30, 140], 16);
        return "hit";
    }
    // a blow, a shot, a jab: it is the hero's enemy (no warning any more); one leaving for home turns on him again
    function bearEnrage(bear) {
        if (bear._mode === "flee") return;
        if (BEAR_AI.flee > 0 && bear._hp <= bear._maxHp * BEAR_AI.flee) { bear.bearOver(); bear.setMode("flee"); return; }
        if (bear._mode === "roam" || bear._mode === "warn" || bear._mode === "leave") bear.bearEngage();
    }

    P.ai = { BOAR, LURE, BEAR_AI, Game_Animal, atkOf, makePack, wolfEngage, disengage, gore, enrage, stagger, knockBack, snort, bite, bearSwipe, bearPin,
        bearEngage: bear => bear.bearEngage() };
})();
