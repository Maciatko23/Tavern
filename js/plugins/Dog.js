//=============================================================================
// Dog.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.0.0] Pies: dziki pies z lasu, oswojony mięsem, zbiera, poluje i znosi wszystko na składowisko.
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * DZIKI PIES
 *   Za dnia (8:00-19:00) po mapie domu kręci się dziki pies. Jest nieufny: gdy podejdziesz,
 *   odsuwa się. Stań przed nim i naciśnij przycisk akcji: "Rzuć mu mięso" (dowolne mięso,
 *   surowe albo pieczone). Po trzech posiłkach (najwyżej jeden na godzinę) pies ci ufa.
 *
 * OSWOJONY PIES
 *   - Ma połowę twoich statystyk: połowę twojego życia i połowę twojej wytrzymałości.
 *     Nad nim widać dwa paski: życie (czerwony) i siły (zielony).
 *   - Sam się karmi: je jagody, grzyby, dzikie ziemniaki i dzikie marchewki, a pije z kałuży,
 *     z glinianego garnka albo wiadra z deszczówką i ze studni.
 *   - "Pracuj sam" (potrzebna buda): zbiera gałęzie, kamienie i włókno i znosi je na
 *     składowisko; poluje na zające, jelenie i ptaki i wlecze zdobycz na składowisko (tuszę
 *     oprawiasz nożem, pióra leżą na składowisku). Co jest na składowisku, widać u góry ekranu.
 *   - Nocą (20:00-6:00) śpi w budzie. Zmęczony też idzie do budy odpocząć.
 *   - Bez życia nie ginie: wlecze się do budy i leczy się przez dobę.
 *   - Menu przy psie (przycisk akcji): Pogłaszcz, Chodź za mną, Pracuj sam, Zostań.
 *     "Chodź za mną" - pies chodzi za tobą, także na inne mapy.
 *
 * Grafiki: img/characters/$Animal_Dog.png (+ _Run, _Stalk), img/system/Farm_Doghouse.png, Farm_Stockpile.png.
 * Zapis: Tawerna.state("dog") (dawny $gameSystem._dog przechodzi sam przy
 * wczytaniu). Korzysta z TawernaCore.js (musi stać wyżej na liście).
 */

(() => {
    "use strict";

    const PLUGIN = "Dog";
    const T = window.Tawerna;
    if (!T) throw new Error("Dog.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const RA = window.RoamingActor;
    const F = () => window.Farming;
    const HOME_MAP = 3;
    const DOG = {
        sheet: "$Animal_Dog", run: "$Animal_Dog_Run", lie: "$Animal_Dog_Stalk",
        walk: 4, runSpeed: 5, crawl: 2.5,
        trustNeed: 3, feedGapHours: 1,
        wildHours: [8, 19], nightFrom: 20, nightTo: 6,
        drain: { food: 2.5, water: 3.5 },        // an hour
        regen: { st: 8, stRest: 30, hp: 3 },     // an hour
        hurtHours: 24, hurtDrain: 0.25,          // lying hurt at the kennel it gets hungry and thirsty four times slower
        cost: { pick: 3, bite: 2, step: 0.2 },   // stamina
        bite: 7, biteGap: 24, deerKick: 0.25, kick: 5,
        luck: 0.5, bolt: 3.5, giveUp: 90, spared: 60 * 30,
        deerBites: 3, deerEscape: 0.5,   // a deer: about three bites kill it; after each one that does not, half the time it gets away   // a hunt succeeds half the time; a lost one: the prey bolts at 3.5 tiles,
                                                             // the dog runs after it 90 frames, and leaves that animal alone half a minute
        carryMax: 4, reach: 30,                  // pieces carried at once; tiles from the stockpile it works within
        huntRange: 10, chase: 60 * 12, huntGap: 60 * 40,
        // food found on the map, by the kind of find (Farming's GATHER) -> the base of what eating it gives: the dogPick column of the
        // one food table (FoodTable in Farming_Data.js - changed there)
        eat: window.FoodTable && window.Farming && Farming.GATHER ? FoodTable.dogForage(Farming.GATHER) : {},
        drink: 45, hungry: 35, thirsty: 35, tired: 0.25, rested: 0.9,
        bowlHurt: 60,   // lying hurt in the kennel it eats and drinks from the bowl below this (it cannot go out for anything)
        // a hungry dog (food below eatPrey) eats its own catch: [food, water] a rabbit / a bird whole, from a deer its fill
        eatPrey: 50, preyMeal: { rabbit: [60, 12], bird: [25, 5], deer: [100, 25] }
    };
    const GATHER = ["branch", "stone", "fiber"];
    const FOOD = Object.keys(DOG.eat);
    const MEATS = window.FoodTable ? FoodTable.tameMeats() : [];   // any meat (raw, roasted, smoked) and fish, in the order it is thrown (FoodTable: tame)
    const FEATHERS = 146;

    // ------------------------------------------------------------------
    // Saved state: Tawerna.state("dog") = $gameSystem._tw.dog (an older save's $gameSystem._dog is taken over); null with no game
    // ------------------------------------------------------------------
    const S = T.state.define("dog", () => ({ tame: false, trust: 0, fedAt: -99, map: HOME_MAP, x: -1, y: -1, food: 70, water: 70, hp: -1, st: -1,
        mode: "follow", hurtUntil: 0, clock: null, carry: [] }), { version: 1, adopt: "_dog", owner: PLUGIN });
    const state = () => (window.$gameSystem ? S() : null);
    const clock = () => T.time.day() * 24 + T.time.hour();
    const hour = () => T.time.hour();
    const night = () => hour() >= DOG.nightFrom || hour() < DOG.nightTo;
    const maxHp = () => { const a = $gameParty.leader(); return Math.max(10, Math.round((a ? a.mhp : 100) / 2)); };
    const maxSt = () => Math.max(10, Math.round(($gameSystem.maxStamina ? $gameSystem.maxStamina() : 100) / 2));
    const popup = (icon, text, color) => T.popup(text, { icon, color: color || "#f3e0a0" });
    const DOG_ICON = () => 431;   // (IconSet: the dog's head)

    // the kennel and the stockpile of a map
    const built = (type, mapId) => (((F() && F().farm().buildings) || {})[mapId || $gameMap.mapId()] || []).filter(b => b.type === type && !b.site);
    const kennel = mapId => built("doghouse", mapId)[0] || null;
    const stockpile = mapId => built("stockpile", mapId)[0] || null;
    function kennelAnywhere() {
        const all = (F() && F().farm().buildings) || {};
        for (const m of Object.keys(all)) { const k = (all[m] || []).find(b => b.type === "doghouse" && !b.site); if (k) return { b: k, map: Number(m) }; }
        return null;
    }
    // where it lies at the kennel: the tile in front of its door; where it drops things at the stockpile: the tile in front of it
    // (the front tile; something built there - a free tile round the building, the nearest to the front)
    function spotBy(b, front) {
        if (freeTile(front.x, front.y)) return front;
        const def = F().geoOf ? F().geoOf(b) : F().BUILDINGS[b.type], w = def.w || 1, h = def.h || 1;
        let best = null, bd = Infinity;
        for (let y = b.y - h; y <= b.y + 2; y++) for (let x = b.x - 1; x <= b.x + w; x++) {
            if (!freeTile(x, y)) continue;
            const dd = Math.hypot(x - front.x, y - front.y);
            if (dd < bd) { bd = dd; best = { x, y }; }
        }
        return best || front;
    }
    const kennelSpot = k => spotBy(k, { x: k.x, y: k.y + 1 });
    function stockSpot(s) {
        const def = F().geoOf ? F().geoOf(s) : F().BUILDINGS[s.type];
        return spotBy(s, { x: s.x + Math.floor((def.w || 1) / 2), y: s.y + 1 });
    }

    // ------------------------------------------------------------------
    // The stockpile: a chest (Farming.js) the dog puts things in
    // ------------------------------------------------------------------
    function storeAdd(b, itemId, n) {
        if (!b || !(n > 0)) return 0;
        const k = "i" + itemId, slots = (F().BUILDINGS[b.type] || {}).slots || 0;
        if (!b.store) b.store = {};
        const kinds = Object.keys(b.store).filter(q => b.store[q] > 0).length;
        if (!(b.store[k] > 0) && kinds >= slots) return 0;
        const put = Math.min(n, 99 - (b.store[k] || 0));
        if (put <= 0) return 0;
        b.store[k] = (b.store[k] || 0) + put;
        return put;
    }

    // ------------------------------------------------------------------
    // The dog on the map
    // ------------------------------------------------------------------
    let dog = null;   // the Game_Dog of this map (or null)
    function Game_Dog() {
        this.initialize(...arguments);
    }
    Game_Dog.prototype = Object.create(Game_Character.prototype);
    Game_Dog.prototype.constructor = Game_Dog;
    Game_Dog.prototype.initialize = function(x, y) {
        Game_Character.prototype.initialize.call(this);
        this.setImage(DOG.sheet, 0);
        this.setPosition(x, y);
        this.setDirection(2);
        this.setMoveSpeed(DOG.walk);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
        this._task = null;       // { kind, ... } what it is doing
        this._wait = 0;
        this._stuck = 0;
        this._biteT = 0;
        this._huntT = 0;         // frames before it may go hunting again
        this._drag = null;       // a carcass it pulls along
        this._pose = "";         // "", "lie", "sleep"
        this._bad = new Set();   // tiles it could not reach today
        this._frozen = false;    // tests: stand still
    };
    Game_Dog.prototype.isDog = function() { return true; };
    Game_Dog.prototype.isCollidedWithPlayerCharacters = function() { return false; };   // (it slips past the hero)
    Game_Dog.prototype.searchLimit = function() { return 48; };   // (the engine's path search looks 12 steps ahead: far prey round a wood was never reached)
    Game_Dog.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Dog.prototype.centerY = function() { return this._realY + 0.5; };
    Game_Dog.prototype.distTo = function(x, y) { return Math.hypot(this._realX - x, this._realY - y); };
    Game_Dog.prototype.playerDist = function() { return Math.hypot(this._realX - $gamePlayer._realX, this._realY - $gamePlayer._realY); };
    // the look: walking, running (fast), lying (resting, asleep, hurt)
    Game_Dog.prototype.setPose = function(pose) {
        if (this._pose === pose && this._poseSpeed === this._moveSpeed) return;
        this._pose = pose;
        this._poseSpeed = this._moveSpeed;
        const img = IN_KENNEL[pose] ? "" : pose ? DOG.lie : this._moveSpeed >= DOG.runSpeed ? DOG.run : DOG.sheet;
        if (this._characterName !== img) this.setImage(img, 0);
        this.setWalkAnime(!pose);
        if (pose) { this._pattern = 1; this.setDirection(2); }
    };
    // asleep at night, resting when tired, healing when hurt: inside the kennel (the sprite hidden; "Zzz" or a heart over the roof)
    const IN_KENNEL = { sleep: true, rest: true, hurt: true };
    Game_Dog.prototype.pay = function(n) { const d = state(); d.st = Math.max(0, d.st - n); };
    // one step towards (tx, ty) round what is in the way; true when there (or next to it, when `beside`). The way: Hunting.js's path8
    // (8 directions, no cutting past a tree's corner); getting nowhere on it (no nearer, or to and fro between two tiles) the tile
    // ahead is kept off a while and a new way is searched
    const FACE = { 1: 4, 3: 6, 7: 4, 9: 6 };   // (on a slant it faces the side it goes to)
    Game_Dog.prototype.stepTo = function(tx, ty, beside) {
        const dx = tx - this._x, dy = ty - this._y, H = window.Hunting;
        if (dx === 0 && dy === 0) return true;
        if (beside && Math.abs(dx) + Math.abs(dy) === 1) { this.setDirection(dx > 0 ? 6 : dx < 0 ? 4 : dy > 0 ? 2 : 8); return true; }
        const d = H && H.path8 ? H.path8(this, tx, ty, { key: "dog", near: beside ? 1 : 0 }).dir : this.findDirectionTo(tx, ty);
        if (d > 0 && RA.canStep(this, this._x, this._y, d)) {
            RA.step(this, d);
            this._stuck = 0;
            if (state().tame) this.pay(DOG.cost.step);
        } else {
            this._stuck++;
            if (d > 0) { this.setDirection(FACE[d] || d); if (H && H.avoidTile && H.DIR_VEC[d]) H.avoidTile(this, this._x + H.DIR_VEC[d][0], this._y + H.DIR_VEC[d][1], 60); }
        }
        if (H && H.stalled && H.stalled(this, "dog", Math.hypot(dx, dy), beside ? 1 : 0.5, tx, ty)) H.unstall(this);
        return false;
    };
    Game_Dog.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._drag) {   // the prey in its mouth (the user's: "niech upolowane zwierzę niesie w pysku"), by its head
            const dir = this.direction(), mouth = { 2: [0, -0.05], 4: [-0.62, -0.42], 6: [0.62, -0.42], 8: [0, -0.7] }[dir] || [0, 0];
            this._drag.x = this.centerX() + mouth[0];
            this._drag.y = this.centerY() + mouth[1];
            this._drag.held = { dir, scale: this._drag.kind === "deer" ? 0.7 : 0.85 };
        }
        if (this._biteT > 0) this._biteT--;
        if (this._huntT > 0) this._huntT--;
        // hemmed in (built over, or no way out at all): out to open ground - but not off the row behind a building, which is walked
        // through (it went in there, was put back, went in again: a walking loop the user saw by the sawmill)
        if (!this.isMoving() && !this._frozen && ((F() && (F().solidAt ? F().solidAt(this._x, this._y) : F().buildingAt(this._x, this._y))) || [2, 4, 6, 8].every(k => !this.canPass(this._x, this._y, k)))) {
            const out = nearFree(this._x, this._y);
            if (out) this.locate(out.x, out.y);
        }
        if (this._frozen || this.isMoving()) return;
        this.think();
        const d = state();
        if (d) { d.x = this._x; d.y = this._y; }
    };

    // ------------------------------------------------------------------
    // The wild dog: shy, it keeps its distance until it has been fed a few times
    // ------------------------------------------------------------------
    Game_Dog.prototype.thinkWild = function() {
        const d = state();
        this.setPose("");
        this.setMoveSpeed(3.5);
        const pd = this.playerDist();
        if (pd < (d.trust > 0 ? 1.4 : 3) && d.trust < DOG.trustNeed) {   // too close: it steps away
            const away = RA.fleeDirection(this, this._realX - $gamePlayer._realX, this._realY - $gamePlayer._realY, { startAtDistance: true, margin: 0.05 });
            if (away) { this.moveStraight(away); return; }
        }
        if (d.trust > 0 && pd < 6) { this.turnTowardCharacter($gamePlayer); this._wait = 20; return; }   // (fed once: it watches him)
        if (--this._roam > 0) return;
        this._roam = 60 + Math.floor(Math.random() * 180);
        const dirs = [2, 4, 6, 8].filter(k => this.canPass(this._x, this._y, k));
        if (dirs.length && Math.random() < 0.7) this.moveStraight(dirs[Math.floor(Math.random() * dirs.length)]);
    };

    // ------------------------------------------------------------------
    // The tame dog
    // ------------------------------------------------------------------
    Game_Dog.prototype.think = function() {
        const d = state();
        if (this._wait > 0) { this._wait--; return; }
        if (this._wag > 0) { this._wag -= 10; this._wait = 10; this.setPose(""); return; }
        if (!d.tame) return this.thinkWild();
        const k = kennel();
        if (d.hurtUntil && clock() < d.hurtUntil) return this.lieAt(k, "hurt");
        if (d.mode === "stay") { this.setPose("lie"); this._wait = 30; return; }
        if (d.mode === "follow" || (!k && d.mode !== "hunt")) return this.thinkFollow();
        // at work: what it carries goes to the stockpile first - before the night, before a rest (the user saw it lie down at the
        // kennel with its mouth full and take the things over only after the rest)
        const carrying = (d.carry || []).reduce((t, c) => t + c.n, 0) > 0;
        const lying = night() || d.st < maxSt() * DOG.tired || (this._task && this._task.kind === "rest");
        if (carrying && lying && stockpile() && !this._drag && !(this._task && (this._task.kind === "unload" || this._task.kind === "hunt"))) this._task = { kind: "unload" };
        if (this._task && this._task.kind === "unload" && lying) { this.setPose(""); this._sleeping = false; return this.doTask(); }
        if (night()) return this.lieAt(k, "sleep");
        if (this._task && this._task.kind === "rest") {
            if (d.st >= maxSt() * DOG.rested) this._task = null;
            else return this.lieAt(k, "rest");
        }
        if (d.st < maxSt() * DOG.tired && !this._drag && !(this._task && this._task.kind === "hunt")) { this._task = { kind: "rest" }; popup(DOG_ICON(), "Pies zmęczony - odpoczywa w budzie", "#cfe6a8"); return; }
        this.setPose("");
        if (!this._task) this._task = this.nextTask();
        if (this._task) this.doTask();
        else { this._wait = 45; }   // nothing to do: it waits a moment
    };
    // lies in front of the kennel (asleep, resting, hurt); walks there first (crawling when hurt)
    Game_Dog.prototype.lieAt = function(k, why) {
        if (this._drag) { letGo(this); if (this._task && this._task.kind === "haul") this._task = null; }
        if (!k) { this.setPose("lie"); this._sleeping = why === "sleep"; this._wait = 30; return; }
        const s = kennelSpot(k);
        if (this._x !== s.x || this._y !== s.y) {
            this.setPose("");
            this.setMoveSpeed(why === "hurt" ? DOG.crawl : DOG.walk);
            this._sleeping = false;
            if (this.stepTo(s.x, s.y)) return;
            if (this._stuck > 40) { const t = freeTile(s.x, s.y) ? s : nearFree(s.x, s.y); if (t) this.locate(t.x, t.y); this._stuck = 0; }   // (it finds its way home somehow)
            return;
        }
        this.setPose(IN_KENNEL[why] ? why : "lie");
        this._sleeping = why === "sleep" || why === "rest";
        this._wait = 30;
    };
    Game_Dog.prototype.thinkFollow = function() {
        this.setPose("");
        this._sleeping = false;
        const pd = this.playerDist();
        if (pd <= 1.8) { this.turnTowardCharacter($gamePlayer); this._wait = 8; return; }
        this.setMoveSpeed(pd > 5 ? DOG.runSpeed : DOG.walk);
        this.stepTo($gamePlayer.x, $gamePlayer.y, true);
        if (this._stuck > 12 && this._stuck % 6 === 0) {   // held up: round it on a slant or sideways, towards him
            const dx = Math.sign($gamePlayer.x - this._x), dy = Math.sign($gamePlayer.y - this._y);
            const tries = [{ "-1,1": 1, "1,1": 3, "-1,-1": 7, "1,-1": 9 }[dx + "," + dy], dy ? (dx >= 0 ? 6 : 4) : (dy >= 0 ? 2 : 8), dx ? 2 : 6, dx ? 8 : 4].filter(Boolean);
            const k = tries.find(q => RA.canStep(this, this._x, this._y, q));
            if (k) { RA.step(this, k); }
        }
        if (this._stuck > 60 && pd > 2.5) { const t = nearPlayer(); this.locate(t.x, t.y); this._stuck = 0; }   // (lost: it catches up)
    };
    // what next: drink, eat, drop what it carries, hunt, gather
    Game_Dog.prototype.nextTask = function() {
        const d = state(), s = stockpile();
        // what it finds itself first; the bowl in the kennel when there is nothing about
        if (d.water < DOG.thirsty) { const w = findWater(this) || bowlWaterSpot(); if (w) return { kind: "drink", w }; }
        if (d.food < DOG.hungry) {
            const f = findTile(this, FOOD, null, 0, this._bad, true);
            if (f) return { kind: "eat", t: f };
            const k = kennel();
            if (k && bowlFood(k)) return { kind: "bowl", k };
        }
        const carried = (d.carry || []).reduce((t, c) => t + c.n, 0);
        if (s && carried > 0 && (carried >= DOG.carryMax || !findTile(this, GATHER, stockSpot(s), DOG.reach, this._bad))) return { kind: "unload" };
        const hunter = d.mode === "hunt";
        if (this._huntT <= 0 && d.st > maxSt() * (hunter ? 0.3 : 0.5) && carried === 0) {
            const prey = findPrey(this, hunter);
            if (prey) return { kind: "hunt", prey, t: 0, lucky: !prey.bird && prey.ref.kind() === "deer" ? true : Math.random() < DOG.luck };   // (a deer: bite by bite instead)
        }
        if (hunter) return carried > 0 && s ? { kind: "unload" } : { kind: "roam", n: 0 };   // (nothing in sight: it goes sniffing about)
        if (s) { const g = findTile(this, GATHER, stockSpot(s), DOG.reach, this._bad); if (g) return { kind: "gather", t: g }; }
        if (s && carried > 0) return { kind: "unload" };
        return null;
    };
    Game_Dog.prototype.doTask = function() {
        const d = state(), t = this._task;
        this.setMoveSpeed(t.kind === "hunt" ? DOG.runSpeed : t.kind === "haul" ? 3.5 : DOG.walk);
        if (this._stuck > 30 && t.kind !== "hunt") {   // it cannot get there: another time
            if (t.t) this._bad.add(t.t.x + "," + t.t.y);
            this._task = null; this._stuck = 0;
            return;
        }
        if (t.kind === "drink") {
            const w = t.w;
            if (!this.stepTo(w.x, w.y, true)) return;
            // a rain vessel gives up a portion; a well has water for good (nothing to count)
            if (w.bowl) { if (!((w.bowl.bowlWater || 0) >= 1)) { this._task = null; return; } w.bowl.bowlWater -= 1; }
            else if (w.b && !(F().BUILDINGS[w.b.type] || {}).water) { if (F().bucketUnits(w.b) < 1) { this._task = null; return; } F().takeBucketWater(w.b, 1); }
            d.water = Math.min(100, d.water + DOG.drink);
            this._wait = 40;
            this._task = null;
            return;
        }
        if (t.kind === "eat" || t.kind === "gather") {
            if (!F().gatherAt(t.t.x, t.t.y)) { this._task = null; return; }   // (someone was quicker)
            if (!this.stepTo(t.t.x, t.t.y, true)) return;
            const got = F().takeGatherFor(t.t.x, t.t.y);
            this._task = null;
            this._wait = 20;
            if (!got) return;
            this.pay(DOG.cost.pick);
            if (t.kind === "eat") d.food = Math.min(100, d.food + (DOG.eat[got.kind] || 12) * Math.max(1, got.n) / 2 + 6);
            else addCarry(got.item, got.n);
            return;
        }
        if (t.kind === "bowl") {   // food from the bowl at the kennel
            const spot = kennelSpot(t.k);
            if (!this.stepTo(spot.x, spot.y)) return;
            this.setDirection(8);
            eatFromBowl(t.k);
            this._task = null;
            this._wait = 40;
            return;
        }
        if (t.kind === "unload") {
            const s = stockpile();
            if (!s) { this._task = null; return; }
            const spot = stockSpot(s);
            if (!this.stepTo(spot.x, spot.y)) return;
            unload(this, s);
            this._task = null;
            this._wait = 30;
            return;
        }
        if (t.kind === "hunt") return this.hunt(t);
        if (t.kind === "haul") return this.haul();
        if (t.kind === "roam") {
            if (!t.to) {
                const s = stockpile(), k = kennel(), home = s ? stockSpot(s) : k ? kennelSpot(k) : { x: this._x, y: this._y };
                for (let tries = 0; tries < 30 && !t.to; tries++) {
                    const x = home.x + Math.round((Math.random() - 0.5) * 30), y = home.y + Math.round((Math.random() - 0.5) * 30);
                    if (freeTile(x, y)) t.to = { x, y };
                }
                if (!t.to) { this._task = null; this._wait = 60; return; }
            }
            if (++t.n > 80 || this.stepTo(t.to.x, t.to.y) || this._stuck > 20) { this._task = null; this._wait = 30; }
            if (t.n % 6 === 0 && this._huntT <= 0 && findPrey(this, true)) this._task = null;   // (it scents something: after it)
            return;
        }
    };
    // the chase: it runs at the prey, bites when it is close (a rabbit takes 2 bites, a deer 6, a bird is caught at once)
    Game_Dog.prototype.hunt = function(t) {
        const d = state(), p = t.prey;
        t.t++;
        const gone = p.bird ? (p.ref.gone || !(window.Birds && Birds.birds.includes(p.ref))) : (p.ref._dead || !(p.ref._hp > 0));
        const hunter = d.mode === "hunt";
        if (gone || t.t > DOG.chase / 8 + (hunter ? 60 : 0) || d.st < maxSt() * DOG.tired) { this._task = null; this._huntT = hunter ? DOG.huntGap / 6 : DOG.huntGap; return; }
        const px = p.bird ? p.ref.x : p.ref.centerX(), py = p.bird ? p.ref.y : p.ref.centerY();
        const dist = Math.hypot(px - this.centerX(), py - this.centerY());
        if (!t.lucky) {   // not this time: close to it, the prey takes fright and gets away
            if (t.bolted === undefined && dist < DOG.bolt) {
                t.bolted = 0;
                if (p.bird) {
                    if (window.Birds && Birds.flush && p.ref.flock) Birds.flush(p.ref.flock, this.centerX(), this.centerY());
                } else {
                    p.ref._scare = { x: this._realX, y: this._realY, t: 240 };
                    p.ref._fleeing = true;
                }
            }
            if (t.bolted !== undefined) {
                if (!p.bird && p.ref._scare) { p.ref._scare.x = this._realX; p.ref._scare.y = this._realY; p.ref._scare.t = Math.max(p.ref._scare.t, 60); }
                if (++t.bolted > (p.bird ? 10 : DOG.giveUp / 8)) {
                    p.ref._dogSpared = Graphics.frameCount + DOG.spared;
                    popup(DOG_ICON(), (p.bird ? "Ptaki" : Hunting.SPECIES[p.ref.kind()] ? Hunting.SPECIES[p.ref.kind()].name : "Zwierzyna") + " uciekł" + (p.bird ? "y" : "") + " psu", "#ffd98f");
                    this._task = null;
                    this._huntT = d.mode === "hunt" ? DOG.huntGap / 6 : DOG.huntGap;
                    return;
                }
                this.stepTo(Math.round(px - 0.5), Math.round(py - 0.5), true);
                return;
            }
        }
        if (dist < (p.bird ? 1.0 : 1.3)) {
            this.turnTowardCharacter({ x: Math.round(px - 0.5), y: Math.round(py - 0.5) });
            if (this._biteT > 0) return;
            this._biteT = DOG.biteGap;
            this.pay(DOG.cost.bite);
            AudioManager.playSe({ name: "Bite", volume: 55, pitch: 115, pan: 0 });
            if (p.bird) {
                const n = Birds.killBird(p.ref, { forDog: true }) || 1;
                if (d.food < DOG.eatPrey) { preyMeal(d, "bird"); popup(DOG_ICON(), "Pies złapał ptaka i zjadł go", "#cfe6a8"); }   // (hungry: its own meal)
                else { addCarry(FEATHERS, n); popup($dataItems[FEATHERS].iconIndex, "Pies złapał ptaka", "#cfe6a8"); }
                this._task = null; this._huntT = d.mode === "hunt" ? DOG.huntGap / 6 : DOG.huntGap;
                return;
            }
            const a = p.ref, kind = a.kind();
            Hunting.hit(a, kind === "deer" ? Math.ceil((a._maxHp || 40) / DOG.deerBites) : DOG.bite, "dog");
            if (kind === "deer" && a._hp > 0 && Math.random() < DOG.deerKick) { hurtDog(DOG.kick); popup(DOG_ICON(), "Jeleń kopnął psa", "#ffb4a0"); }
            if (kind === "deer" && a._hp > 0 && !a._dead && Math.random() < DOG.deerEscape) {   // wounded, it breaks away; the dog lets it go
                a._scare = { x: this._realX, y: this._realY, t: 300 };
                a._fleeing = true;
                a._dogSpared = Graphics.frameCount + DOG.spared;
                popup(DOG_ICON(), "Jeleń wyrwał się psu i uciekł (ranny)", "#ffd98f");
                this._task = null;
                this._huntT = d.mode === "hunt" ? DOG.huntGap / 6 : DOG.huntGap;
                return;
            }
            if (a._dead || !(a._hp > 0)) {
                const list = Hunting.carcasses ? Hunting.carcasses() : [];
                const c = list.slice().reverse().find(q => q.kind === kind && Math.hypot(q.x - px, q.y - py) < 1.5);
                const name = Hunting.SPECIES[kind] ? Hunting.SPECIES[kind].name : kind;
                if (c && d.food < DOG.eatPrey) {   // hungry: it eats - a small catch whole; from a deer its fill, the carcass stays for him
                    preyMeal(d, kind);
                    if (kind === "deer") popup(DOG_ICON(), "Pies najadł się jeleniem - tusza leży", "#cfe6a8");
                    else { if (Hunting.removeCarcass) Hunting.removeCarcass(c); popup(DOG_ICON(), "Pies upolował i zjadł: " + name, "#cfe6a8"); }
                    this._task = null;
                    this._wait = 60;
                }
                else if (c) { this._drag = c; this._task = { kind: "haul" }; popup(DOG_ICON(), "Pies upolował: " + name, "#cfe6a8"); }
                else this._task = null;
                this._huntT = d.mode === "hunt" ? DOG.huntGap / 6 : DOG.huntGap;
            }
            return;
        }
        this.stepTo(Math.round(px - 0.5), Math.round(py - 0.5), true);
    };
    // pulling the prey to the stockpile (or the kennel, without one)
    Game_Dog.prototype.haul = function() {
        const s = stockpile(), k = kennel();
        const toHim = !s && !k, spot = s ? stockSpot(s) : k ? kennelSpot(k) : { x: $gamePlayer.x, y: $gamePlayer.y };
        if (!this.stepTo(spot.x, spot.y, toHim)) { if (this._stuck > 60) { letGo(this); this._task = null; } return; }
        const c = this._drag;
        letGo(this);
        this._task = null;
        if (c) { c.x = (toHim ? this.centerX() : spot.x + 0.5) + (Math.random() - 0.5) * 0.6; c.y = (toHim ? this.centerY() : spot.y) + 0.75; }
        if (c && toHim) popup(DOG_ICON(), "Pies przyniósł ci zdobycz", "#cfe6a8");
        this._wait = 30;
    };

    function preyMeal(d, kind) {
        const [food, water] = DOG.preyMeal[kind] || DOG.preyMeal.rabbit;
        d.food = Math.min(100, d.food + food);
        d.water = Math.min(100, d.water + water);
        AudioManager.playSe({ name: "Bite", volume: 45, pitch: 90, pan: 0 });
    }
    function addCarry(itemId, n) {
        const d = state();
        const c = d.carry.find(q => q.item === itemId);
        if (c) c.n += n; else d.carry.push({ item: itemId, n });
    }
    function unload(g, s) {
        const d = state(), names = [];
        if (!d.carry) d.carry = [];
        for (const c of d.carry.slice()) {
            const put = storeAdd(s, c.item, c.n);
            if (put > 0) names.push($dataItems[c.item].name + " ×" + put);
            c.n -= put;
        }
        d.carry = d.carry.filter(c => c.n > 0);
        if (names.length) popup(DOG_ICON(), "Pies zniósł na składowisko: " + names.join(", "), "#cfe6a8");
        void g;
    }
    function hurtDog(n) {
        const d = state();
        d.hp = Math.max(0, d.hp - n);
        if (d.hp <= 0 && !(d.hurtUntil > clock())) {
            d.hurtUntil = clock() + DOG.hurtHours;
            if (dog) { dog._task = null; letGo(dog); }
            popup(DOG_ICON(), "Pies jest ranny - wlecze się do budy", "#ffb4a0");
        }
    }

    // the nearest tile holding one of `kinds` (from Farming's ground items), within `radius` of `center` (all the map without one)
    function findTile(g, kinds, center, radius, bad, food) {
        const W = $gameMap.width(), H = $gameMap.height();
        let best = null, bd = Infinity;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (center && Math.hypot(x - center.x, y - center.y) > radius) continue;
            if (bad && bad.has(x + "," + y)) continue;
            const k = F().gatherAt(x, y);
            if (!k || !kinds.includes(k)) continue;
            if (food && k === "bush" && F().bushState(x, y) !== "full") continue;   // (a bare bush is no food)
            const dd = Math.hypot(x - g._x, y - g._y);
            if (dd < bd) { bd = dd; best = { x, y, k }; }
        }
        return best;
    }
    // water: a puddle, a clay pot or a bucket with rain water in it, a well - the nearest
    function findWater(g) {
        let best = null, bd = Infinity;
        const consider = (x, y, b) => { const dd = Math.hypot(x - g._x, y - g._y); if (dd < bd) { bd = dd; best = { x, y, b }; } };
        for (const b of ((F().farm().buildings || {})[$gameMap.mapId()] || [])) {
            if (b.site) continue;
            const def = F().BUILDINGS[b.type] || {};
            if (def.rain && F().bucketUnits(b) >= 1) consider(b.x, b.y + 1, b);   // (in front of it: the anchor is the bottom-left tile; not a well: it cannot reach the water)
        }
        if (window.Puddles && Puddles.wetAt) {
            const W = $gameMap.width(), H = $gameMap.height();
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Puddles.wetAt(x, y)) consider(x, y, null);
        }
        return best;
    }
    // prey near the dog (rabbits and deer, birds on the ground) - not too far from the stockpile
    function findPrey(g, anywhere) {
        const s = stockpile(), home = s ? stockSpot(s) : { x: g._x, y: g._y };
        let best = null, bd = anywhere ? 999 : DOG.huntRange;
        for (const a of (window.Hunting && Hunting.animals) || []) {
            if (!a || a._dead || !(a._hp > 0) || !["rabbit", "deer"].includes(a.kind()) || a._dogSpared > Graphics.frameCount) continue;
            const dd = Math.hypot(a.centerX() - g.centerX(), a.centerY() - g.centerY());
            if (dd < bd && (anywhere || Math.hypot(a._x - home.x, a._y - home.y) < DOG.reach)) { bd = dd; best = { ref: a }; }
        }
        for (const b of (window.Birds && Birds.birds) || []) {
            if (!b || b.gone || b.z > 4 || (b.flock && b.flock.leaving) || b._dogSpared > Graphics.frameCount) continue;
            const dd = Math.hypot(b.x - g.centerX(), b.y - g.centerY());
            if (dd < bd) { bd = dd; best = { ref: b, bird: true }; }
        }
        return best;
    }

    // ------------------------------------------------------------------
    // Needs, by the clock (so a rest or a night that jumps the time counts too)
    // ------------------------------------------------------------------
    function tickNeeds() {
        const d = state();
        if (!d || !d.tame) return;
        if (d.hp < 0) d.hp = maxHp();
        if (d.st < 0) d.st = maxSt();
        const now = clock();
        if (d.clock === null || d.clock === undefined || now < d.clock) { d.clock = now; return; }
        const h = now - d.clock;
        if (h <= 0) return;
        d.clock = now;
        const hurtH = d.hurtUntil > now - h ? Math.min(h, d.hurtUntil - (now - h)) : 0;   // (of these hours, the ones it lay hurt)
        const hours = h - hurtH + hurtH * DOG.hurtDrain;
        d.food = Math.max(0, d.food - DOG.drain.food * hours);
        d.water = Math.max(0, d.water - DOG.drain.water * hours);
        // the day in the kennel is over: whole again - before the hunger counts (a dog that came out hungry was knocked down
        // again at once, hurt for another day, and never got up: the user saw it lie at the kennel for days)
        if (d.hurtUntil && now >= d.hurtUntil) {
            d.hurtUntil = 0;
            d.hp = maxHp();
            popup(DOG_ICON(), "Pies wyzdrowiał", "#cfe6a8");
        }
        const hunting = dog && dog._task && dog._task.kind === "hunt";
        const resting = !dog || dog._sleeping || (d.hurtUntil > now) || d.mode === "stay";
        if (!hunting) d.st = Math.min(maxSt(), d.st + (resting ? DOG.regen.stRest : DOG.regen.st) * h);
        const kb = kennel();   // (spoilt food in the bowl: the dog throws it out - rot never blocks the bowl)
        if (kb && kb.store && kb.store.i122) { delete kb.store.i122; if (kb.fresh) delete kb.fresh[122]; }
        const inside = dog && IN_KENNEL[dog._pose] && kennel();
        if (inside) {   // (in the kennel: the bowl is right there)
            const k = kennel(), low = d.hurtUntil > now ? DOG.bowlHurt : DOG.hungry;
            while (d.water < low && (k.bowlWater || 0) >= 1) { k.bowlWater -= 1; d.water = Math.min(100, d.water + DOG.drink); }
            for (let n = 0; n < 6 && d.food < low && bowlFood(k); n++) eatFromBowl(k);
        }
        if (d.hurtUntil > now) { /* (hurt: it lies in the kennel; whole again when the day is over) */ }
        else if (d.food > 20 && d.water > 20) d.hp = Math.min(maxHp(), d.hp + DOG.regen.hp * h);
        else if (d.food <= 0 || d.water <= 0) hurtDog(3 * h);
        d.hp = Math.min(d.hp, maxHp());
        d.st = Math.min(d.st, maxSt());
    }

    // ------------------------------------------------------------------
    // Putting the dog on the map: the wild one by day on the home map, the tame one where it lives (or with the hero)
    // ------------------------------------------------------------------
    function freeTile(x, y) {
        return $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !(F() && F().buildingAt(x, y));
    }
    function farSpot(minDist) {
        const W = $gameMap.width(), H = $gameMap.height();
        for (let tries = 0; tries < 400; tries++) {
            const x = 2 + Math.floor(Math.random() * (W - 4)), y = 2 + Math.floor(Math.random() * (H - 4));
            if (freeTile(x, y) && Math.hypot(x - $gamePlayer.x, y - $gamePlayer.y) >= minDist) return { x, y };
        }
        return null;
    }
    function nearFree(x0, y0) {
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            if (freeTile(x0 + dx, y0 + dy)) return { x: x0 + dx, y: y0 + dy };
        }
        return null;
    }
    function nearPlayer() {
        const p = $gamePlayer;
        for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) if (freeTile(p.x + dx, p.y + dy)) return { x: p.x + dx, y: p.y + dy };
        return { x: p.x, y: p.y };
    }
    function spawnDog(x, y) {
        dog = new Game_Dog(x, y);
        RA.addSprite(dog);
        return dog;
    }
    function letGo(g) {
        if (g && g._drag) { delete g._drag.held; g._drag = null; }
    }
    function removeDog() {
        if (!dog) return;
        letGo(dog);
        dropHud(dog);
        RA.dropSprite(dog);
        if (dog._drag) dog._drag = null;
        dog = null;
    }
    let auto = true;
    function sync() {
        if (!auto || !$gameMap || !$dataMap || !F() || !$gamePlayer) return;
        const d = state();
        if (!d.tame) {
            const out = $gameMap.mapId() === HOME_MAP && hour() >= DOG.wildHours[0] && hour() < DOG.wildHours[1];
            if (!out) { if (dog) removeDog(); d.x = -1; return; }
            if (!dog) {
                const s = d.x >= 0 && freeTile(d.x, d.y) ? { x: d.x, y: d.y } : farSpot(12);
                if (s) spawnDog(s.x, s.y);
            }
            return;
        }
        if (d.map !== $gameMap.mapId()) { if (dog) removeDog(); return; }
        if (!dog) {
            const k = kennel();
            let s = d.x >= 0 && $gameMap.isValid(d.x, d.y) ? { x: d.x, y: d.y } : d.mode === "follow" || !k ? nearPlayer() : kennelSpot(k);
            if (!freeTile(s.x, s.y)) s = nearFree(s.x, s.y) || s;
            spawnDog(s.x, s.y);
        }
    }

    // ------------------------------------------------------------------
    // The hero and the dog: the menu at it, taming, following across maps
    // ------------------------------------------------------------------
    function dogAhead() {
        if (!dog || dog._transparent) return false;
        const p = $gamePlayer, dir = p.direction();
        // the wild one keeps away: the meat is thrown to it - within 4.5 tiles, the way he faces; only with meat in the bag and nothing
        // else to do right in front of him (a crop, something lying there, a building, an event keep their O press)
        const tx = $gameMap.roundXWithDirection(p.x, dir), ty = $gameMap.roundYWithDirection(p.y, dir), plot = F() && F().plotAt ? F().plotAt(tx, ty) : null;
        const busy = (F() && (F().gatherAt(tx, ty) || F().buildingAt(tx, ty))) || (plot && plot.crop) || $gameMap.eventsXy(tx, ty).length > 0;
        if (!state().tame && meatInBag() && !busy) {
            const fx = dir === 4 ? -1 : dir === 6 ? 1 : 0, fy = dir === 8 ? -1 : dir === 2 ? 1 : 0;
            const dx = dog.centerX() - p._realX - 0.5, dy = dog.centerY() - p._realY - 0.5, dist = Math.hypot(dx, dy);
            if (dist < 4.5 && dist > 0.05 && (dx * fx + dy * fy) / dist > 0.6) return true;
        }
        const fx = p._realX + 0.5 + (dir === 4 ? -0.8 : dir === 6 ? 0.8 : 0), fy = p._realY + 0.5 + (dir === 8 ? -0.8 : dir === 2 ? 0.8 : 0);
        return Math.hypot(dog.centerX() - fx, dog.centerY() - fy) < 0.9 || Math.hypot(dog.centerX() - p._realX - 0.5, dog.centerY() - p._realY - 0.5) < 0.7;
    }
    const meatInBag = () => MEATS.find(id => $dataItems[id] && $gameParty.numItems($dataItems[id]) > 0) || 0;
    function feedWild() {
        const d = state(), meat = meatInBag();
        if (!meat) { popup(DOG_ICON(), "Nie masz mięsa", "#ffb4a0"); return; }
        if (clock() - d.fedAt < DOG.feedGapHours) { popup(DOG_ICON(), "Pies już zjadł - daj mu chwilę", "#ffb4a0"); return; }
        $gameParty.loseItem($dataItems[meat], 1);
        d.fedAt = clock();
        d.trust++;
        AudioManager.playSe({ name: "Bite", volume: 50, pitch: 120, pan: 0 });
        if (d.trust < DOG.trustNeed) { popup(DOG_ICON(), "Pies zjadł " + $dataItems[meat].name.toLowerCase() + " (zaufanie " + d.trust + "/" + DOG.trustNeed + ")", "#cfe6a8"); return; }
        d.tame = true;
        d.hp = maxHp(); d.st = maxSt(); d.food = 80; d.water = 70; d.clock = clock();
        d.map = $gameMap.mapId();
        const k = kennelAnywhere();
        d.mode = k ? "work" : "follow";
        if (k && k.map !== d.map) d.mode = "follow";
        AudioManager.playSe({ name: "Item3", volume: 70, pitch: 100, pan: 0 });
        popup(DOG_ICON(), d.mode === "work" ? "Pies ci zaufał! Zamieszka w budzie." : "Pies ci zaufał i chodzi za tobą. Zbuduj mu budę.", "#9ff0a8");
    }
    function setMode(mode) {
        const d = state();
        if (mode === "hunt" && dog) dog._huntT = 0;
        if (mode === "work") {
            const k = kennelAnywhere();
            if (!k) { popup(DOG_ICON(), "Pies potrzebuje budy", "#ffb4a0"); return; }
            if (k.map !== $gameMap.mapId()) { d.map = k.map; d.x = kennelSpot(k.b).x; d.y = kennelSpot(k.b).y; removeDog(); popup(DOG_ICON(), "Pies pobiegł do budy", "#cfe6a8"); d.mode = "work"; return; }
        }
        d.mode = mode;
        if (dog) { dog._task = null; dog._wait = 0; }
        popup(DOG_ICON(), mode === "follow" ? "Pies idzie za tobą" : mode === "stay" ? "Pies zostaje tutaj" : mode === "hunt" ? "Pies rusza na polowanie" : "Pies pracuje: zbiera i poluje", "#cfe6a8");
    }
    // ---- the bowl at the kennel: food in its store (a small food-only chest: it spoils there as in a chest), water in bowlWater
    // what one piece from the bowl gives: the dog column of the one food table (FoodTable in Farming_Data.js - changed there)
    function dogFoodValue(id) {
        return window.FoodTable ? FoodTable.dogValue(id) : 10;
    }
    // what is in the bowl to eat: [{ id, n }], the best first
    function bowlStacks(k) {
        const out = [];
        for (const key of Object.keys((k && k.store) || {})) {
            const id = Number(key.slice(1));
            if (key[0] !== "i" || !(k.store[key] > 0) || (window.Spoilage && id === Spoilage.ROT)) continue;
            out.push({ id, n: k.store[key] });
        }
        return out.sort((a, b) => dogFoodValue(b.id) - dogFoodValue(a.id));
    }
    const bowlFood = k => bowlStacks(k).length > 0;
    function eatFromBowl(k) {
        const s = bowlStacks(k)[0];
        if (!s) return false;
        const key = "i" + s.id;
        k.store[key] -= 1;
        if (k.store[key] <= 0) delete k.store[key];
        const list = k.fresh && k.fresh[s.id];   // (the oldest piece goes: the freshness list is kept oldest first)
        if (list && list.length) { list[0].n -= 1; if (list[0].n <= 0) list.shift(); if (!list.length) delete k.fresh[s.id]; }
        const d = state();
        d.food = Math.min(100, d.food + dogFoodValue(s.id));
        return true;
    }
    function bowlWaterSpot() {
        const k = kennel();
        if (!k || !((k.bowlWater || 0) >= 1)) return null;
        const s = kennelSpot(k);
        return { x: s.x, y: s.y, b: null, bowl: k };
    }
    function bowlText(k) {
        const food = bowlStacks(k).reduce((t, s) => t + s.n, 0);
        return "Miska: jedzenie " + food + ", woda " + (k.bowlWater || 0) + "/" + (F().BUILDINGS.doghouse.bowl || 3);
    }
    // the water: poured from the bucket carried in the bag, else from the waterskin
    function pourWater(k) {
        const max = F().BUILDINGS.doghouse.bowl || 3;
        if ((k.bowlWater || 0) >= max) { popup(391, "Miska jest pełna", "#9fd4ff"); return false; }
        if (F().bagWater && F().bagWater() >= 1) F().setBagWater(F().bagWater() - 1);
        else if (window.Needs && Needs.skinCharges && Needs.skinCharges() >= 1) Needs.state().skin = Needs.skinCharges() - 1;
        else { popup(391, "Nie masz wody: nabierz do wiadra albo bukłaka", "#ffb4a0"); return false; }
        k.bowlWater = (k.bowlWater || 0) + 1;
        AudioManager.playSe({ name: "Water1", volume: 70, pitch: 110, pan: 0 });
        popup(391, "Woda w misce: " + k.bowlWater + "/" + max, "#9fd4ff");
        return true;
    }
    if (window.Farming && Farming.addMenuHook) Farming.addMenuHook((b, def, entries) => {
        if (b.type !== "doghouse" || b.site) return null;
        const max = def.bowl || 3, have = (F().bagWater && F().bagWater() >= 1) || (window.Needs && Needs.skinCharges && Needs.skinCharges() >= 1);
        const at = Math.max(0, entries.findIndex(e => e.name === def.openName) + 1);
        entries.splice(at, 0, { name: "Nalej wody do miski", icon: 391, right: (b.bowlWater || 0) + "/" + max, enabled: (b.bowlWater || 0) < max && !!have,
            help: (b.bowlWater || 0) >= max ? "Miska jest pełna." : have ? "Nalewasz porcję wody z wiadra (albo z bukłaka). Pies napije się z miski, kiedy nie znajdzie wody - ze studni sam nie sięgnie."
                : "Potrzebujesz wody: nabierz do wiadra albo do bukłaka (przy studni, stawie, garnku z deszczówką).", run: () => pourWater(b) });
        return bowlText(b);
    });
    function statusNote() {
        const d = state();
        if (!d.tame) return "Nieufny: zaufanie " + d.trust + "/" + DOG.trustNeed + ". Rzuć mu mięso (najwyżej raz na godzinę).";
        const hurt = d.hurtUntil > clock() ? " · RANNY (" + Math.ceil(d.hurtUntil - clock()) + " godz.)" : "";
        const k = kennelAnywhere();
        return "Życie " + Math.round(d.hp) + "/" + maxHp() + " · Siły " + Math.round(d.st) + "/" + maxSt() + " · Jedzenie " + Math.round(d.food) + " · Woda " + Math.round(d.water) + hurt + (k ? " · " + bowlText(k.b) : "");
    }
    function openDogMenu() {
        const d = state(), scene = SceneManager._scene;
        const icon = DOG_ICON();
        let entries;
        if (!d.tame) {
            const meat = meatInBag();
            entries = [{ name: "Rzuć mu mięso", icon: meat ? $dataItems[meat].iconIndex : icon, right: meat ? $dataItems[meat].name : "", enabled: !!meat,
                help: meat ? "Rzucasz mu kawałek mięsa (z kilku kroków, bo nie da się podejść). Po trzech posiłkach, najwyżej jeden na godzinę, pies zostanie z tobą." : "Potrzebujesz mięsa: surowego, pieczonego albo wędzonego (albo ryby).", run: feedWild }];
        } else {
            const k = kennelAnywhere();
            entries = [
                { name: "Pogłaszcz", icon, help: "Pies merda ogonem.", run: () => { if (dog) { dog._wag = 90; dog.turnTowardCharacter($gamePlayer); } popup(icon, "Pies merda ogonem ♥", "#f3e0a0"); } },
                { name: "Chodź za mną", icon, enabled: d.mode !== "follow", help: "Pies chodzi za tobą, także na inne mapy.", run: () => setMode("follow") },
                { name: "Pracuj sam", icon, enabled: d.mode !== "work" && !!k, help: k ? "Pies zbiera gałęzie, kamienie i włókno, poluje na zające, jelenie i ptaki i znosi wszystko na składowisko. Nocą śpi w budzie." : "Najpierw zbuduj psu budę.", run: () => setMode("work") },
                { name: "Poluj", icon, enabled: d.mode !== "hunt", help: "Pies szuka zwierzyny na całej mapie - zające, jelenie i ptaki - i przynosi ją w pysku na składowisko (bez składowiska: pod budę albo do ciebie). Gdy nic nie widać, węszy po okolicy.", run: () => setMode("hunt") },
                { name: "Zostań", icon, enabled: d.mode !== "stay", help: "Pies kładzie się tutaj i czeka.", run: () => setMode("stay") }
            ];
        }
        if (scene && scene.openFarmMenu) scene.openFarmMenu(d.tame ? "Pies" : "Dziki pies", entries, undefined, undefined, undefined, undefined, statusNote());
    }
    const CALM_MENU = { only: ["onMap", "event", "farmMenu"] };   // (on the map, no event running, no farm menu open)
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && dogAhead() && T.isCalm(SceneManager._scene, CALM_MENU)) {
            openDogMenu();
            return true;
        }
        return _triggerButtonAction.call(this);
    };
    // following him: the dog goes along to the next map
    const _performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const d = state(), follow = this.isTransferring() && d && d.tame && d.mode === "follow" && (d.map === $gameMap.mapId());
        _performTransfer.call(this);
        if (follow) { d.map = $gameMap.mapId(); d.x = -1; d.y = -1; }
    };

    // ------------------------------------------------------------------
    // Pictures: the bars over the dog (life, strength), what it carries, "Zzz"; the stockpile strip at the top of the screen
    // ------------------------------------------------------------------
    // (they stand beside the dog's sprite in the tilemap, not in it: the sprite of a dog asleep in its kennel is hidden, "Zzz" is not)
    function dropHud(g) {
        for (const k of ["_hud", "_carrySpr"]) {
            const x = g && g[k];
            if (x) { if (x.parent) x.parent.removeChild(x); g[k] = null; }
        }
    }
    function updateDogSprite() {
        if (!dog || !dog._sprite || !dog._sprite.parent) return;
        const sp = dog._sprite, d = state(), parent = sp.parent;
        if (!dog._hud || dog._hud.parent !== parent) {
            dropHud(dog);
            dog._hud = new Sprite(new Bitmap(56, 30));
            dog._hud.anchor.x = 0.5;
            dog._hud.z = 9;
            parent.addChild(dog._hud);
            dog._carrySpr = new Sprite(ImageManager.loadSystem("IconSet"));
            dog._carrySpr.scale.set(0.5, 0.5);
            dog._carrySpr.anchor.set(0.5, 0.5);
            dog._carrySpr.z = 9;
            parent.addChild(dog._carrySpr);
            sp._dogKey = null;
        }
        const hud = dog._hud, carry = dog._carrySpr;
        const inside = !!IN_KENNEL[dog._pose], healing = dog._pose === "hurt", asleep = inside && !healing;
        const heal = healing ? Math.max(0, Math.min(1, 1 - (d.hurtUntil - clock()) / DOG.hurtHours)) : 0;
        const key = [d.tame, Math.round(d.hp), Math.round(d.st), maxHp(), maxSt(), dog._pose, Math.round(heal * 40)].join(",");
        hud.x = sp.x;
        hud.y = sp.y + (inside ? (healing ? -134 : -126) : -76);   // (in the kennel: over its roof)
        // (the "Zzz" drifts up and down, the heart beats)
        const t = Graphics.frameCount;
        if (asleep) { hud.y += Math.round(Math.sin(t / 40) * 2); hud.scale.set(1, 1); }
        else if (healing) { const beat = 1 + 0.08 * Math.max(0, Math.sin(t / 9)); hud.scale.set(beat, beat); }
        else hud.scale.set(1, 1);
        carry.x = sp.x;
        carry.y = sp.y - 40;
        if (sp._dogKey !== key) {
            sp._dogKey = key;
            const bm = hud.bitmap;
            bm.clear();
            if (asleep) { bm.fontSize = 16; bm.outlineWidth = 3; bm.textColor = "#eceef0"; bm.drawText("Zzzz", 0, 4, 56, 20, "center"); }
            else if (healing) {   // a red heart and how far the day of healing is
                const ctx = bm.context, cx = 28, cy = 11;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx, cy + 8);
                ctx.bezierCurveTo(cx - 12, cy - 1, cx - 7, cy - 10, cx, cy - 4);
                ctx.bezierCurveTo(cx + 7, cy - 10, cx + 12, cy - 1, cx, cy + 8);
                ctx.closePath();
                ctx.fillStyle = "#e0413b"; ctx.fill();
                ctx.lineWidth = 2; ctx.strokeStyle = "#16181c"; ctx.stroke();
                ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(cx - 6, cy - 4, 3, 3);
                ctx.restore();
                bm.fillRect(8, 23, 40, 5, "#16181c");
                bm.fillRect(9, 24, Math.round(38 * heal), 3, "#ff8a8a");
                bm._baseTexture && bm._baseTexture.update();
            }
            else if (d.tame) {
                const bar = (y, r, c) => { bm.fillRect(8, y, 40, 4, "#16181c"); bm.fillRect(8, y, Math.round(40 * Math.max(0, Math.min(1, r))), 4, c); };
                bar(18, d.hp / maxHp(), "#d9463d");
                bar(24, d.st / maxSt(), "#7bd35a");
            }
        }
        const c = d.carry && d.carry[0];
        carry.visible = !!c && !inside;
        if (c && $dataItems[c.item]) {
            const idx = $dataItems[c.item].iconIndex;
            carry.setFrame((idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32);
        }
    }
    function Sprite_StockStrip() {
        this.initialize(...arguments);
    }
    Sprite_StockStrip.prototype = Object.create(Sprite.prototype);
    Sprite_StockStrip.prototype.constructor = Sprite_StockStrip;
    Sprite_StockStrip.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(760, 76));
        this._key = null;
        this._icons = ImageManager.loadSystem("IconSet");
        this.y = 8;
    };
    Sprite_StockStrip.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const s = $gameMap && F() ? stockpile() : null;
        const stacks = s ? Object.keys(s.store || {}).filter(k => k[0] === "i" && s.store[k] > 0).map(k => ({ id: Number(k.slice(1)), n: s.store[k] })).sort((a, b) => a.id - b.id) : [];
        const key = s ? stacks.map(q => q.id + ":" + q.n).join(",") + "|" + this._icons.isReady() : "";
        if (key === this._key) return;
        this._key = key;
        const bm = this.bitmap;
        bm.clear();
        this.visible = !!s;
        if (!s || !this._icons.isReady()) return;
        const per = 13, cellW = 54, rows = Math.max(1, Math.ceil(stacks.length / per));
        const cols = Math.max(1, Math.min(per, stacks.length));
        const labelW = 118, w = Math.min(760, labelW + cols * cellW + 10), h = 10 + rows * 30;
        this._h = h;
        const ctx = bm.context;
        if (window.UIStyle) UIStyle.panel(ctx, 0.5, 0.5, w - 1, h - 1); else bm.fillRect(0, 0, w, h, "rgba(11,12,15,0.9)");
        bm._baseTexture && bm._baseTexture.update();
        bm.fontSize = 17;
        bm.textColor = window.UIStyle ? UIStyle.accent : "#ffd23f";
        bm.drawText("Składowisko", 10, 5, labelW - 12, 26, "left");
        if (!stacks.length) { bm.textColor = "#8a9099"; bm.fontSize = 15; bm.drawText("pusto", labelW, 5, 80, 26, "left"); }
        bm.fontSize = 15;
        bm.textColor = "#eceef0";
        stacks.forEach((q, i) => {
            const it = $dataItems[q.id];
            if (!it) return;
            const x = labelW + (i % per) * cellW, y = 5 + Math.floor(i / per) * 30;
            bm.blt(this._icons, (it.iconIndex % 16) * 32, Math.floor(it.iconIndex / 16) * 32, 32, 32, x, y + 1, 24, 24);
            bm.drawText(String(q.n), x + 25, y + 1, 28, 24, "left");
        });
        this.x = Math.round((Graphics.width - w) / 2);
    };
    const _createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _createSpriteset.call(this);
        this._dogStock = new Sprite_StockStrip();
        this.addChild(this._dogStock);
    };

    // ------------------------------------------------------------------
    // The map scene drives it (the core's map clock and events; the dog's own step stays in Game_Map.update, among the characters)
    // ------------------------------------------------------------------
    T.on("load", () => { dog = null; }, { owner: PLUGIN });
    T.on("mapEnter", () => { dog = null; }, { owner: PLUGIN });
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (dog) dog.update();
    };
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        if (dog) { dog._sprite = null; RA.addSprite(dog, this); }
    };
    // (its own counter, not the updater's "every": the needs and the sprite every frame, the sync on the first frame and every 30)
    let syncWait = 0;
    T.onMapUpdate(scene => {
        if (!$gamePlayer || !$gameSystem) return;
        tickNeeds();
        // the stockpile strip is the first thing at the top centre: the rest shown there (the combat mode badge, the day's greeting,
        // the notices, the level banner - each placed by its own plugin this frame) moves down under it (the user saw "Tryb walki" on it)
        const strip = scene._dogStock;
        if (strip && strip.visible && strip._h) {
            const dy = strip.y + strip._h + 6 - 10;
            for (const k of ["_modeBadge", "_dayBanner", "_topNotice", "_levelBanner"]) { const sp = scene[k]; if (sp && sp.visible) sp.y += dy; }
        }
        if (--syncWait <= 0) { syncWait = 30; sync(); }
        if (dog && (!dog._sprite || !dog._sprite.parent)) { dog._sprite = null; RA.addSprite(dog); }
        updateDogSprite();
    }, { owner: PLUGIN, name: "dog" });

    window.Dog = T.register(PLUGIN, { DOG, state, sync, storeAdd, kennel, stockpile, openDogMenu, feedWild, setMode, findTile, findWater, findPrey, statusNote, tickNeeds, hurtDog, dogFoodValue, meatInBag,
        maxHp, maxSt, auto: v => { auto = !!v; }, get dog() { return dog; }, spawnDog, removeDog, Game_Dog });
})();
