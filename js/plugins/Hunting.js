//=============================================================================
// Hunting.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Polowanie: zające i jelenie biegają po łąkach i lasach, płoszą się przed graczem. Strzelasz z procy (kamienie) albo łuku (strzały) klawiszem F. v1.0.0
 * @author Tawerna
 *
 * @param enabled
 * @text Zwierzyna biega po mapach
 * @type boolean
 * @default true
 *
 * @param maps
 * @text Mapy i liczba zwierząt (JSON)
 * @desc Numer mapy -> ile zajęcy (rabbit) i jeleni (deer) najwyżej naraz. Notatka mapy <Hunt:rabbit=3,deer=1> albo <Hunt:off> ma pierwszeństwo.
 * @type string
 * @default {"3":{"rabbit":3},"4":{"rabbit":4,"deer":1},"5":{"rabbit":3,"deer":2},"6":{"rabbit":2,"deer":1},"7":{"rabbit":2},"8":{"rabbit":2},"12":{"deer":2},"15":{"rabbit":3,"deer":1}}
 *
 * @help
 * ============================================================================
 * POLOWANIE
 * ============================================================================
 * Na mapach z listy (parametr "Mapy i liczba zwierząt") w ciągu dnia (5-21)
 * pasą się zające i jelenie (jelenie tylko rano i wieczorem). Uciekają, gdy
 * podejdziesz za blisko, więc trzeba je ustrzelić z daleka.
 *
 *   Proca (zrobisz ją w warsztacie): amunicją są kamienie, zasięg 6 kratek,
 *     siła 1. Zając pada od jednego trafienia, jeleń ma 3 życia.
 *   Łuk + strzały (warsztat): zasięg 9 kratek, siła 2. Jeleń pada od dwóch strzałów.
 *
 * STRZAŁ: klawisz F. Lecisz w stronę, w którą patrzysz; gdy trzymasz dwa
 * klawisze kierunku naraz (skos), strzał leci na skos. Strzał kosztuje trochę
 * wytrzymałości i jedno użycie broni (wtyczka Durability), a huk płoszy zwierzynę
 * w promieniu 7 kratek. Trafiony jeleń, który jeszcze żyje, ucieka ranny.
 *
 * ŁUP: zając daje 1 sztukę zwierzyny, jeleń 2. Zwierzynę oprawisz nożem (menu
 * Przedmioty): mięso i skóra, jak z pułapki.
 *
 * Zwierzyna odnawia się co rano do pełnej liczby, ale to, co ustrzeliłeś dzisiaj,
 * nie wróci przed świtem. Zwierzęta nie są zapisywane w grze (pojawiają się od
 * nowa po wejściu na mapę).
 * ============================================================================
 */

(() => {
    "use strict";

    const params = PluginManager.parameters("Hunting");
    const ENABLED = params.enabled !== "false";
    let MAPS = {};
    try { MAPS = JSON.parse(params.maps || "{}"); } catch (e) { MAPS = {}; }

    Input.keyMapper[70] = "shoot";   // F

    const ITEM = { carcass: 101, stone: 64, sling: 125, bow: 126, arrows: 127 };
    // speed / flee: MZ move speeds (4 = the player); alert: tiles at which it bolts; hours: when it is about
    const SPECIES = {
        rabbit: { name: "Zając", sheet: "$Animal_Rabbit", hp: 1, speed: 3, flee: 5, alert: 5.5, radius: 0.5, drop: 1, hours: [[5, 21]] },
        deer: { name: "Jeleń", sheet: "$Animal_Deer", hp: 3, speed: 3, flee: 5, alert: 8, radius: 0.75, drop: 2, hours: [[5, 10], [16, 21]] }
    };
    // range in tiles, speed in tiles per frame, damage, stamina per shot, cooldown in frames
    const WEAPONS = {
        sling: { item: ITEM.sling, ammo: ITEM.stone, range: 6, speed: 0.34, damage: 1, stamina: 2, cooldown: 24, se: "Bow1", pitch: 130 },
        bow: { item: ITEM.bow, ammo: ITEM.arrows, range: 9, speed: 0.55, damage: 2, stamina: 3, cooldown: 30, se: "Bow3", pitch: 100 }
    };
    const NOISE_RADIUS = 7;

    // swing kinds of ChoppableTree.js: the body whirls the sling / draws the bow, and the shot leaves on the release frame
    const SHOT_SWING = { sling: 9, bow: 10 };
    let animate = true;   // tests switch the shooting animation off (the shot then leaves at once)
    let animals = [];
    let projectiles = [];
    let cooldown = 0;
    let spotCache = { mapId: 0, spots: null };
    const hours = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const day = () => ($gameSystem && typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 1);

    // ------------------------------------------------------------------
    // Saved data: $gameSystem._hunt = { kills: { rabbit: n, deer: n }, killed: { mapId: { day, rabbit: n, deer: n } } }
    // ------------------------------------------------------------------
    function hunt() {
        if (!$gameSystem._hunt) $gameSystem._hunt = { kills: {}, killed: {} };
        return $gameSystem._hunt;
    }
    function killedToday(mapId, kind) {
        const rec = hunt().killed[mapId];
        return rec && rec.day === day() ? rec[kind] || 0 : 0;
    }

    // ------------------------------------------------------------------
    // What lives on this map
    // ------------------------------------------------------------------
    function mapTargets() {
        const note = ($dataMap && $dataMap.note) || "";
        const tag = /<Hunt:\s*([^>]*)>/i.exec(note);
        if (tag) {
            if (/^\s*off\s*$/i.test(tag[1])) return {};
            const out = {};
            for (const pair of tag[1].split(",")) {
                const [k, v] = pair.split("=").map(s => s.trim());
                if (SPECIES[k] && Number(v) > 0) out[k] = Number(v);
            }
            return out;
        }
        return MAPS[$gameMap.mapId()] || {};
    }
    function activeNow(kind) {
        const h = hours();
        return SPECIES[kind].hours.some(([a, b]) => h >= a && h < b);
    }

    // grass tiles a wild animal may stand on: passable, no event, no building (Farming.js knows the ground)
    function spotsOfMap() {
        const mapId = $gameMap.mapId();
        if (spotCache.mapId === mapId && spotCache.spots) return spotCache.spots;
        const F = window.Farming;
        if (!F) return [];
        const spots = [];
        for (let y = 1; y < $gameMap.height() - 1; y++) {
            for (let x = 1; x < $gameMap.width() - 1; x++) {
                const info = F.groundInfoAt(x, y);
                if (info === undefined) return null;   // the ground pictures are still loading: try again later
                if (!info || !info.kind) continue;
                if (!$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length > 0 || F.hasObjectTile(x, y) || F.buildingAt(x, y)) continue;
                spots.push({ x, y });
            }
        }
        spotCache = { mapId, spots };
        return spots;
    }

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
        this._hp = sp.hp;
        this._wounded = false;
        this._alarm = 0;         // frames it keeps running after a shot nearby
        this._fleeing = false;
        this._wait = 30 + Math.floor(Math.random() * 120);
        this._frozen = false;    // tests: stand still
        this._dead = false;
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
        if (window.Farming && Farming.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    Game_Animal.prototype.kind = function() { return this._kind; };
    Game_Animal.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Animal.prototype.centerY = function() { return this._realY + 0.5; };
    // it does not count as an "event" for Farming.js etc.
    Game_Animal.prototype.isAnimal = function() { return true; };

    Game_Animal.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._alarm > 0) this._alarm--;
        if (this._frozen || this._dead || this.isMoving()) return;
        this.think();
    };

    Game_Animal.prototype.think = function() {
        const sp = SPECIES[this._kind];
        const dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        const dist = Math.hypot(dx, dy);
        if (dist < sp.alert || this._wounded || this._alarm > 0) this._fleeing = true;
        else if (dist > sp.alert * 1.5) this._fleeing = false;
        if (this._fleeing) {
            this.setMoveSpeed(sp.flee);
            const d = this.bestEscape(dx, dy);
            if (d) this.moveStraight(d);
            return;
        }
        this.setMoveSpeed(sp.speed);
        if (this._wait > 0) { this._wait--; return; }
        const dirs = [2, 4, 6, 8].filter(d => this.canPass(this._x, this._y, d));
        if (dirs.length > 0 && Math.random() < 0.7) this.moveStraight(dirs[Math.floor(Math.random() * dirs.length)]);
        this._wait = 50 + Math.floor(Math.random() * 150);
    };
    // the passable direction that ends farthest from the player, looking two steps ahead
    Game_Animal.prototype.bestEscape = function(dx, dy) {
        let best = 0, bestScore = -Infinity;
        for (const d of [2, 4, 6, 8]) {
            if (!this.canPass(this._x, this._y, d)) continue;
            const sx = (d === 6 ? 1 : d === 4 ? -1 : 0), sy = (d === 2 ? 1 : d === 8 ? -1 : 0);
            let score = Math.hypot(dx + sx, dy + sy) + Math.random() * 0.6;
            const nx = $gameMap.roundXWithDirection(this._x, d), ny = $gameMap.roundYWithDirection(this._y, d);
            if (this.canPass(nx, ny, d)) score += 0.8;   // room to keep running
            else if (![2, 4, 6, 8].some(e => this.canPass(nx, ny, e))) score -= 2;
            if (score > bestScore) { bestScore = score; best = d; }
        }
        return best;
    };

    // ------------------------------------------------------------------
    // Spawning
    // ------------------------------------------------------------------
    function spriteset() {
        const scene = SceneManager._scene;
        return scene instanceof Scene_Map ? scene._spriteset : null;
    }
    // set: the spriteset to draw in. When the map scene is rebuilt (after the menu, the journal, the day summary...) the new
    // spriteset is not yet SceneManager._scene._spriteset while it is being built, so it has to be passed in.
    function addSprite(animal, set) {
        set = set || spriteset();
        if (!set || !set._tilemap) return;
        if (animal._sprite && animal._sprite.parent === set._tilemap) return;
        const sprite = new Sprite_Character(animal);
        animal._sprite = sprite;
        set._tilemap.addChild(sprite);
    }
    function removeAnimal(animal) {
        animal._dead = true;
        if (animal._sprite) {
            try {
                if (animal._sprite.parent) animal._sprite.parent.removeChild(animal._sprite);
                animal._sprite.destroy();
            } catch (e) { /* already gone with the old scene */ }
            animal._sprite = null;
        }
        animals = animals.filter(a => a !== animal);
    }
    function spawn(kind, x, y) {
        if (!SPECIES[kind]) return null;
        const a = new Game_Animal(kind, x, y);
        animals.push(a);
        addSprite(a);
        return a;
    }
    function countOf(kind) {
        return animals.filter(a => a.kind() === kind).length;
    }
    // fills the map up to its targets (minus what was shot today) and sends the animals that are not about home
    function populate() {
        if (!ENABLED || !$gameMap || !$dataMap || !spriteset() || !window.Farming) return;
        const mapId = $gameMap.mapId(), targets = mapTargets();
        for (const kind of Object.keys(SPECIES)) {
            if (!activeNow(kind)) {
                for (const a of animals.filter(a => a.kind() === kind)) removeAnimal(a);   // asleep somewhere
                continue;
            }
            const want = Math.max(0, (targets[kind] || 0) - killedToday(mapId, kind));
            let have = countOf(kind);
            if (have >= want) continue;
            const spots = spotsOfMap();
            if (!spots || spots.length === 0) return;
            for (let tries = 0; tries < 80 && have < want; tries++) {
                const s = spots[Math.floor(Math.random() * spots.length)];
                if (Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y) < 8) continue;
                if (animals.some(a => a._x === s.x && a._y === s.y)) continue;
                spawn(kind, s.x, s.y);
                have++;
            }
        }
    }

    // ------------------------------------------------------------------
    // Shooting
    // ------------------------------------------------------------------
    function popup(icon, text, color) {
        if ($gameTemp && typeof $gameTemp.pushLootPopup === "function") $gameTemp.pushLootPopup(icon, text, color);
    }
    const countItem = id => $gameParty.numItems($dataItems[id]);
    // the bow when there are arrows, else the sling when there are stones; null with the reason (a popup) otherwise
    function pickWeapon() {
        const bow = countItem(ITEM.bow) > 0, sling = countItem(ITEM.sling) > 0;
        if (bow && countItem(ITEM.arrows) > 0) return "bow";
        if (sling && countItem(ITEM.stone) > 0) return "sling";
        if (bow) popup($dataItems[ITEM.arrows].iconIndex, "Potrzebujesz strzał", "#ff9f8f");
        else if (sling) popup($dataItems[ITEM.stone].iconIndex, "Potrzebujesz kamieni", "#ff9f8f");
        else popup($dataItems[ITEM.sling].iconIndex, "Potrzebujesz procy albo łuku", "#ff9f8f");
        return null;
    }
    // unit vector of a shot: the two held arrows (a diagonal) or else the way the player faces
    function aimVector() {
        const d8 = Input.dir8;
        const diag = { 1: [-1, 1], 3: [1, 1], 7: [-1, -1], 9: [1, -1] }[d8];
        if (diag) { const n = Math.SQRT2; return [diag[0] / n, diag[1] / n]; }
        return { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[$gamePlayer.direction()] || [0, 1];
    }
    function canShoot() {
        return $gamePlayer.canMove() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && !SceneManager.isSceneChanging();
    }
    // Returns true when a projectile left. dir: [dx, dy] (defaults to the aim), which: "sling" | "bow" (defaults to the best weapon in the bag)
    function shoot(dir, which) {
        if (!ENABLED || cooldown > 0) return false;
        const w = which || pickWeapon();
        if (!w) return false;
        const def = WEAPONS[w];
        if (!$gameSystem.trySpendStamina(def.stamina)) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        const [dx, dy] = dir || aimVector();
        if (Math.abs(dx) >= Math.abs(dy)) $gamePlayer.setDirection(dx < 0 ? 4 : 6); else $gamePlayer.setDirection(dy < 0 ? 8 : 2);
        $gameParty.loseItem($dataItems[def.ammo], 1, false);
        if (window.Durability) Durability.use(def.item);
        cooldown = def.cooldown;
        $gameTemp._farmLock = Math.max($gameTemp._farmLock || 0, 10);
        const release = () => {   // the stone / the arrow leaves
            AudioManager.playSe({ name: def.se, volume: 85, pitch: def.pitch, pan: 0 });
            const sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3;
            projectiles.push(makeProjectile(w, sx, sy, dx, dy));
            for (const a of animals) {   // the noise
                if (Math.hypot(a.centerX() - sx, a.centerY() - sy) <= NOISE_RADIUS) a._alarm = 240;
            }
        };
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING[w], release)) {
            cooldown = Math.max(cooldown, 60);
            return true;
        }
        release();
        return true;
    }
    function makeProjectile(weapon, x, y, dx, dy) {
        const p = { weapon, x, y, dx, dy, travelled: 0, done: false, sprite: null };
        const set = spriteset();
        if (set && set._tilemap) {
            const arrow = weapon === "bow";
            const bmp = new Bitmap(arrow ? 22 : 8, arrow ? 6 : 8), ctx = bmp.context;
            if (arrow) {
                ctx.fillStyle = "#2a1c14"; ctx.fillRect(0, 1, 22, 4);
                ctx.fillStyle = "#b98a55"; ctx.fillRect(1, 2, 15, 2);
                ctx.fillStyle = "#c9c9c0"; ctx.fillRect(16, 1, 5, 4); ctx.fillRect(21, 2, 1, 2);
                ctx.fillStyle = "#f0e2b0"; ctx.fillRect(0, 0, 4, 1); ctx.fillRect(0, 5, 4, 1);
            } else {
                ctx.fillStyle = "#2a1c14"; ctx.beginPath(); ctx.arc(4, 4, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#9a9a90"; ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#cfcfc4"; ctx.fillRect(2, 2, 2, 2);
            }
            bmp._baseTexture.update();
            const sprite = new Sprite(bmp);
            sprite.anchor.set(arrow ? 0.9 : 0.5, 0.5);
            sprite.rotation = Math.atan2(dy, dx);
            sprite.z = 5;
            set._tilemap.addChild(sprite);
            p.sprite = sprite;
        }
        return p;
    }
    function endProjectile(p) {
        p.done = true;
        if (p.sprite) {
            try {
                if (p.sprite.parent) p.sprite.parent.removeChild(p.sprite);
                p.sprite.destroy();
            } catch (e) { /* the scene (and with it the sprite) is already gone */ }
            p.sprite = null;
        }
    }
    function blockedAt(x, y) {
        const tx = Math.floor(x), ty = Math.floor(y);
        if (!$gameMap.isValid(tx, ty)) return true;
        if (!$gameMap.checkPassage(tx, ty, 0x0f)) return true;
        return $gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority() && e.characterName() !== "");
    }
    function updateProjectiles() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const p of projectiles) {
            if (p.done) continue;
            const def = WEAPONS[p.weapon];
            const steps = 3, step = def.speed / steps;
            for (let i = 0; i < steps && !p.done; i++) {
                p.x += p.dx * step; p.y += p.dy * step; p.travelled += step;
                const target = animals.find(a => !a._dead && Math.hypot(a.centerX() - p.x, a.centerY() - p.y) <= SPECIES[a.kind()].radius);
                if (target) { hit(target, def.damage); endProjectile(p); break; }
                if (p.travelled >= def.range || blockedAt(p.x, p.y)) endProjectile(p);
            }
            if (p.sprite && !p.sprite.parent) p.sprite = null;   // the scene was rebuilt: the flight goes on without the picture
            if (p.sprite && !p.done) {
                p.sprite.x = Math.round($gameMap.adjustX(p.x) * tw);
                p.sprite.y = Math.round($gameMap.adjustY(p.y) * th);
            }
        }
        projectiles = projectiles.filter(p => !p.done);
    }

    // ------------------------------------------------------------------
    // A hit
    // ------------------------------------------------------------------
    function hit(animal, damage) {
        const sp = SPECIES[animal.kind()];
        animal._hp -= damage;
        AudioManager.playSe({ name: "Damage1", volume: 80, pitch: 120, pan: 0 });
        if (animal._hp > 0) {
            animal._wounded = true;
            popup($dataItems[ITEM.carcass].iconIndex, sp.name + " ranny", "#ffd98f");
            for (const a of animals) if (Math.hypot(a.centerX() - animal.centerX(), a.centerY() - animal.centerY()) <= NOISE_RADIUS) a._alarm = 240;
            return;
        }
        kill(animal);
    }
    function kill(animal) {
        const sp = SPECIES[animal.kind()], mapId = $gameMap.mapId();
        const h = hunt(), rec = h.killed[mapId] && h.killed[mapId].day === day() ? h.killed[mapId] : (h.killed[mapId] = { day: day() });
        rec[animal.kind()] = (rec[animal.kind()] || 0) + 1;
        h.kills[animal.kind()] = (h.kills[animal.kind()] || 0) + 1;
        removeAnimal(animal);
        AudioManager.playSe({ name: "Collapse1", volume: 70, pitch: 130, pan: 0 });
        $gameParty.gainItem($dataItems[ITEM.carcass], sp.drop);   // the popup "+N Zwierzyna" comes from SurvivalHUD
    }

    // ------------------------------------------------------------------
    // The map scene drives it
    // ------------------------------------------------------------------
    // loading a save must not keep the animals of the game that was running (their sprites are gone with the old scene)
    const _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        animals = [];
        projectiles = [];
        spotCache = { mapId: 0, spots: null };
    };
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        animals = [];
        projectiles = [];
        spotCache = { mapId: 0, spots: null };
    };
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        for (const a of animals.slice()) a.update();
    };
    // sprites of the animals that exist when the spriteset is (re)built, e.g. after a menu
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const a of animals) { a._sprite = null; addSprite(a, this); }
    };
    let populateWait = 0;
    let auto = true;   // tests switch the automatic refilling off
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!ENABLED || !$gamePlayer) return;
        if (cooldown > 0) cooldown--;
        if (auto && --populateWait <= 0) { populateWait = 90; populate(); }
        for (const a of animals) if (!a._sprite || !a._sprite.parent) addSprite(a);   // never leave an animal without a picture
        updateProjectiles();
        if (Input.isTriggered("shoot") && canShoot()) shoot();
    };

    window.Hunting = { auto: v => { auto = !!v; }, animate: v => { animate = !!v; }, SPECIES, WEAPONS, spawn, shoot, populate, hit, kill, removeAnimal, mapTargets,
        get animals() { return animals; }, get projectiles() { return projectiles; }, hunt, killedToday, pickWeapon, updateProjectiles };
})();
