//=============================================================================
// Livestock.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.0.0] Zwierzęta na wybiegach: krowy w oborze, owce w owczarni i kury w kurniku chodzą za płotem.
 * @author Tawerna
 *
 * @help
 * Obora, owczarnia i kurnik (Farming.js) to ogrodzone wybiegi: płot dookoła, furtka
 * z przodu i szopa w głębi. Ta wtyczka wpuszcza do środka prawdziwe zwierzęta.
 *
 *   - Obora: 2 krowy, owczarnia: 3 owce, kurnik: 3 kury.
 *   - Zwierzęta spacerują po wolnym terenie wybiegu (nie wchodzą do szopy ani za płot),
 *     zatrzymują się, rozglądają się i ustępują ci z drogi, gdy podejdziesz.
 *   - Na noc chowają się w szopie (krowy i owce od 20:00, kury od 19:00 do rana).
 *   - To tylko żywa dekoracja: mleko, wełnę i jajka nadal zbierasz z menu budynku.
 *   - Zwierzęta nie są zapisywane: po wczytaniu gry pojawiają się od nowa.
 *
 * Grafiki: img/characters/$Animal_Cow.png, $Animal_Sheep.png, $Animal_Hen.png
 * (arkusz RPG Makera: 3 kolumny x 4 rzędy, dół / lewo / prawo / góra).
 */

(() => {
    "use strict";

    // the sprite-lifecycle helpers and the flee-direction scan: shared with Hunting.js's wild animals, which
    // define RoamingActor and load first (see plugins.js).
    const RA = window.RoamingActor;

    // hours: the hours of the day the animals are out in the yard. speed: RPG Maker move speed (4 = a walking man).
    const SPECIES = {
        cow: { name: "Krowa", sheet: "$Animal_Cow", speed: 2.4, hours: [6, 20], pause: [80, 260], run: [1, 3] },
        sheep: { name: "Owca", sheet: "$Animal_Sheep", speed: 3, hours: [6, 20], pause: [60, 220], run: [1, 3] },
        hen: { name: "Kura", sheet: "$Animal_Hen", speed: 3.4, hours: [6, 19], pause: [25, 130], run: [1, 2] }
    };
    const SHY = 1.5;   // tiles: an animal this close to the player steps aside

    let herd = [];
    let auto = true;
    let syncWait = 0;
    let alwaysOut = false;   // tests: the animals do not go to bed
    const key = (x, y) => x + "," + y;
    const F = () => window.Farming;
    const farmOf = () => ($gameSystem && $gameSystem._farm) || null;
    const hour = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const outNow = kind => alwaysOut || (hour() >= SPECIES[kind].hours[0] && hour() < SPECIES[kind].hours[1]);
    const between = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));

    // ------------------------------------------------------------------
    // The animal: a plain character that may only stand on the open ground of its yard
    // ------------------------------------------------------------------
    function Game_Livestock() {
        this.initialize(...arguments);
    }
    Game_Livestock.prototype = Object.create(Game_Character.prototype);
    Game_Livestock.prototype.constructor = Game_Livestock;

    Game_Livestock.prototype.initialize = function(kind, yard, x, y) {
        Game_Character.prototype.initialize.call(this);
        const sp = SPECIES[kind];
        this._kind = kind;
        this._yardId = yard.id;
        this._cells = new Set();
        this._cellsRev = -1;
        this._wait = between(sp.pause) >> 1;
        this._steps = 0;
        this._heading = 2;
        this._frozen = false;   // tests: stand still
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
    Game_Livestock.prototype.kind = function() { return this._kind; };
    Game_Livestock.prototype.isLivestock = function() { return true; };
    Game_Livestock.prototype.inYard = function(x, y) { return this._cells.has(key(x, y)); };

    // where it may stand (the open ground of the yard); refreshed when the buildings change
    Game_Livestock.prototype.refreshCells = function(b) {
        const rev = farmOf() ? farmOf().rev : 0;
        if (this._cellsRev === rev) return;
        this._cellsRev = rev;
        this._cells = new Set(F().yardInterior(b).filter(c => $gameMap.checkPassage(c.x, c.y, 0x0f)).map(c => key(c.x, c.y)));
    };
    Game_Livestock.prototype.isMapPassable = function(x, y, d) {
        return this.inYard($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d));
    };
    Game_Livestock.prototype.isCollidedWithCharacters = function(x, y) {
        if (Game_Character.prototype.isCollidedWithCharacters.call(this, x, y)) return true;
        if (Math.abs($gamePlayer._realX - x) < 0.95 && Math.abs($gamePlayer._realY - y) < 0.95) return true;
        return herd.some(a => a !== this && !a._transparent && ((a._x === x && a._y === y) || (Math.round(a._realX) === x && Math.round(a._realY) === y)));
    };

    Game_Livestock.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._frozen || this._transparent || this.isMoving()) return;
        this.think();
    };
    Game_Livestock.prototype.think = function() {
        const sp = SPECIES[this._kind];
        const dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (Math.hypot(dx, dy) < SHY) {   // the player is too close: step away, if there is anywhere to step
            const away = this.awayFrom(dx, dy);
            if (away) {
                this.moveStraight(away);
                this._steps = 0;
                this._wait = 8;
                return;
            }
        }
        if (this._steps > 0) {   // still on a walk
            if (this.canPass(this._x, this._y, this._heading)) {
                this._steps--;
                this.moveStraight(this._heading);
                return;
            }
            this._steps = 0;
        }
        if (this._wait > 0) { this._wait--; return; }
        const dirs = [2, 4, 6, 8].filter(d => this.canPass(this._x, this._y, d));
        this._wait = between(sp.pause);
        if (dirs.length === 0) return;
        if (Math.random() < 0.3) { this.setDirection([2, 4, 6, 8][Math.floor(Math.random() * 4)]); return; }   // just looks around
        this._heading = dirs.includes(this._heading) && Math.random() < 0.5 ? this._heading : dirs[Math.floor(Math.random() * dirs.length)];
        this._steps = between(sp.run) - 1;
        this.moveStraight(this._heading);
    };
    // the passable direction that ends farthest from the player (the shared scan, tuned for a calm step-aside:
    // it only moves when a direction genuinely beats standing still, no jitter, no lookahead)
    Game_Livestock.prototype.awayFrom = function(dx, dy) {
        return RA.fleeDirection(this, dx, dy, { startAtDistance: true, margin: 0.05 });
    };

    // ------------------------------------------------------------------
    // Sprites: the map scene may be rebuilt at any time (menu, journal, day summary...); Hunting.js's RoamingActor
    // has the lesson written up: the new spriteset is not yet SceneManager._scene._spriteset while it is being
    // built, so it has to be passed in.
    // ------------------------------------------------------------------
    const spriteset = RA.spriteset;
    const addSprite = RA.addSprite;
    function remove(animal) {
        RA.dropSprite(animal);
        herd = herd.filter(a => a !== animal);
    }
    function spawn(kind, yard, x, y) {
        const a = new Game_Livestock(kind, yard, x, y);
        herd.push(a);
        a.refreshCells(yard);
        addSprite(a);
        return a;
    }

    // ------------------------------------------------------------------
    // Keeping the yards populated: every finished yard building of this map has its animals
    // ------------------------------------------------------------------
    function yards() {
        const f = farmOf();
        if (!f || !F() || !$gameMap) return [];
        return (f.buildings[$gameMap.mapId()] || []).filter(b => !b.site && F().geoOf(b).yard);
    }
    function sync() {
        if (!auto || !$gameMap || !$dataMap || !F()) return;
        const list = yards();
        for (const a of herd.slice()) if (!list.some(b => b.id === a._yardId)) remove(a);   // the yard was demolished
        for (const b of list) {
            const g = F().geoOf(b).yard;
            const mine = herd.filter(a => a._yardId === b.id);
            for (const a of mine) a.refreshCells(b);
            let have = mine.length;
            if (have >= g.count) continue;
            const open = F().yardInterior(b).filter(c => $gameMap.checkPassage(c.x, c.y, 0x0f));
            for (let tries = 0; tries < 60 && have < g.count && open.length > 0; tries++) {
                const c = open[Math.floor(Math.random() * open.length)];
                if (Math.hypot(c.x - $gamePlayer._realX, c.y - $gamePlayer._realY) < 1.5) continue;
                if (herd.some(a => a._x === c.x && a._y === c.y)) continue;
                spawn(g.animal, b, c.x, c.y);
                have++;
            }
        }
        for (const a of herd) {   // out in the yard by day, in the shed at night
            const out = outNow(a.kind());
            if (out !== !a._transparent) a.setTransparent(!out);
        }
    }

    // ------------------------------------------------------------------
    // The map scene drives it
    // ------------------------------------------------------------------
    // loading a save must not keep the animals of the game that was running (their sprites are gone with the old scene)
    const _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        herd = [];
    };
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        herd = [];
        syncWait = 0;
    };
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        for (const a of herd.slice()) a.update();
    };
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const a of herd) { a._sprite = null; addSprite(a, this); }
    };
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!$gamePlayer) return;
        if (--syncWait <= 0) { syncWait = 30; sync(); }
        for (const a of herd) if (!a._sprite || !a._sprite.parent) addSprite(a);   // never leave an animal without a picture
    };

    window.Livestock = { SPECIES, spawn, sync, remove, yards,
        auto: v => { auto = !!v; },
        alwaysOut: v => { alwaysOut = !!v; },
        get animals() { return herd; } };
})();
