//=============================================================================
// FreeMovement.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Swobodny ruch gracza co do piksela, w 8 kierunkach (także po skosie), zgodny z uprawami, narzędziami, drzwiami i dużymi obiektami. v1.0.0
 * @author Claude
 *
 * @param defaultEnabled
 * @text Domyślnie włączony na mapach
 * @type boolean
 * @default true
 *
 * @param diagonal
 * @text Ruch po skosie (8 kierunków)
 * @desc Wyłączone = ruch swobodny, ale tylko w 4 kierunkach.
 * @type boolean
 * @default true
 *
 * @param hitboxWidth
 * @text Szerokość stóp postaci (w kafelkach)
 * @desc Im mniejsza, tym łatwiej przecisnąć się przez wąskie przejścia. 0.56 = nieco ponad pół kafelka.
 * @type number
 * @decimals 2
 * @min 0.2
 * @max 1
 * @default 0.56
 *
 * @param hitboxHeight
 * @text Wysokość stóp postaci (w kafelkach)
 * @desc Liczona od dołu postaci w górę.
 * @type number
 * @decimals 2
 * @min 0.2
 * @max 1
 * @default 0.5
 *
 * @param cornerAssist
 * @text Ślizganie się wokół rogów
 * @desc Idąc prosto w przejście lub obok przeszkody, postać sama wyrównuje tor, zamiast zahaczać o róg.
 * @type boolean
 * @default true
 *
 * @param targetMarker
 * @text Znacznik kafelka przed postacią
 * @desc Gdy postać stoi w miejscu, delikatne narożniki pokazują kafelek, na który zadziała narzędzie lub przycisk akcji.
 * @type boolean
 * @default true
 *
 * @param disableSwitch
 * @text Przełącznik wyłączający ruch swobodny
 * @desc Gdy przełącznik o tym numerze jest włączony, postać chodzi po kafelkach jak w zwykłym RPG Makerze. 0 = brak.
 * @type switch
 * @default 0
 *
 * @command setFreeMove
 * @text Ruch swobodny: włącz / wyłącz
 * @desc Przełącza ruch swobodny na stałe (aż do następnego użycia polecenia), niezależnie od ustawień mapy.
 *
 * @arg enabled
 * @text Włączony
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * FreeMovement.js
 * ============================================================================
 * Zamiast skakać z kafelka na kafelek, gracz porusza się płynnie co do piksela
 * i może iść w 8 kierunkach (strzałki lub WASD, klawiatura numeryczna, gałka pada).
 * Ta wtyczka ustawia też klawisze: O = OK / akcja, P = anuluj (zamiast Z i X).
 * Ruch po skosie ma taką samą prędkość jak prosty (nie jest szybszy).
 *
 * JAK TO PASUJE DO RESZTY GRY
 *  - Postać ma nadal cztery kierunki w grafice. Idąc po skosie, patrzy w lewo
 *    lub w prawo (albo zostaje przy kierunku, w którym już patrzyła).
 *  - "Kafelek przed postacią" (uprawa, narzędzia, rozmowa, skrzynie) to
 *    najbliższy kafelek pod postacią plus kierunek spojrzenia, jak dotąd.
 *  - Duże obiekty (skały, krzewy, drzewa z ChoppableTree) blokują dokładnie
 *    te kafelki co zawsze, a miękkie brzegi krzewów nadal da się wejść.
 *  - Budynki z Farming.js, kafelki nieprzechodnie i zdarzenia blokują tak jak
 *    dawniej; stopy postaci mają jednak własny, mniejszy obrys, więc da się
 *    przejść przez jednokafelkowe przejście, nie trafiając idealnie w środek.
 *  - Drzwi i zdarzenia z wyzwalaczem "dotknięcie gracza" uruchamiają się, gdy
 *    idziesz na nie, a zdarzenia pod postacią po wejściu na ich kafelek.
 *  - Przycisk akcji działa także w biegu.
 *  - Gdy postać stoi w miejscu, cztery narożniki na kafelku przed nią pokazują,
 *    gdzie zadziała narzędzie lub przycisk akcji (uprawa, budowa, skrzynia,
 *    rozmowa, krzak). Podczas chodzenia znika. Parametr "Znacznik kafelka".
 *  - Kliknięcie/dotknięcie mapy nadal prowadzi postać do celu (po siatce).
 *  - Prędkość bierze z ustawień gry (także opcja prędkości biegu).
 *
 * WŁĄCZANIE I WYŁĄCZANIE
 *  W notatce mapy: <FreeMove:off> wyłącza, <FreeMove:on> wymusza na tej mapie.
 *  Przełącznik z parametrów lub polecenie wtyczki "Ruch swobodny: włącz /
 *  wyłącz" wyłączają go w trakcie gry (np. na czas sceny). Cutscenki z
 *  poleceniem "Ustaw trasę ruchu" działają jak zawsze, po siatce.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "FreeMovement";
    const params = PluginManager.parameters(pluginName);
    const num = (v, d) => {
        const n = Number(v);
        return v === undefined || v === "" || !isFinite(n) ? d : n;
    };
    const DEFAULT_ON = params.defaultEnabled !== "false";
    // WASD are the arrows (also in menus and for the cursor of building); W was "page down" of the windows, which Q and E do now (E is mapped in Farming.js)
    Input.keyMapper[87] = "up";      // W
    Input.keyMapper[65] = "left";    // A
    Input.keyMapper[83] = "down";    // S
    Input.keyMapper[68] = "right";   // D
    // O and P instead of Z and X: O = OK / action, P = cancel (Enter, Space, Esc, Insert and the numpad keys still work)
    delete Input.keyMapper[90];      // Z
    delete Input.keyMapper[88];      // X
    Input.keyMapper[79] = "ok";      // O
    Input.keyMapper[80] = "escape";  // P
    const DIAGONAL = params.diagonal !== "false";
    const ASSIST = params.cornerAssist !== "false";
    const HIT_W = Math.max(0.2, Math.min(1, num(params.hitboxWidth, 0.56)));
    const HIT_H = Math.max(0.2, Math.min(1, num(params.hitboxHeight, 0.5)));
    const OFF_SWITCH = Math.max(0, Math.floor(num(params.disableSwitch, 0)));
    const MARKER = params.targetMarker !== "false";

    // numpad direction -> [dx, dy]
    const DIR_VECTOR = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };

    PluginManager.registerCommand(pluginName, "setFreeMove", args => {
        $gameSystem._freeMove = !args || args.enabled !== "false";
    });

    // switch > command > map note > default
    function freeMoveOn() {
        if (OFF_SWITCH > 0 && $gameSwitches && $gameSwitches.value(OFF_SWITCH)) return false;
        if ($gameSystem && typeof $gameSystem._freeMove === "boolean") return $gameSystem._freeMove;
        const note = ($dataMap && $dataMap.note) || "";
        if (/<FreeMove:\s*off\s*>/i.test(note)) return false;
        if (/<FreeMove:\s*on\s*>/i.test(note)) return true;
        return DEFAULT_ON;
    }

    // ------------------------------------------------------------------
    // Positions are kept in whole pixels while walking (so nothing shimmers
    // against the scrolling map) and written back to _realX/_realY in tiles.
    // The tile the player "stands on" (_x, _y, used for events, tools, menus)
    // is the tile whose centre is nearest.
    //
    // The feet are a box: HIT_W wide, centred in the tile, and HIT_H high, at
    // the bottom of it (where the sprite's feet are).
    // ------------------------------------------------------------------
    function feetBox(fx, fy) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const half = Math.max(1, Math.round(HIT_W * tw / 2)), high = Math.max(1, Math.round(HIT_H * th));
        const cx = fx + Math.floor(tw / 2);
        return {
            x0: Math.floor((cx - half) / tw), x1: Math.floor((cx + half - 1) / tw),
            y0: Math.floor((fy + th - high) / th), y1: Math.floor((fy + th - 1) / th)
        };
    }

    Game_Player.prototype.isFreeMoving = function() {
        return !this.isInVehicle() && freeMoveOn();
    };

    // The tiles the feet overlap now (events keep out of them).
    Game_Player.prototype.feetTiles = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const b = feetBox(Math.round(this._realX * tw), Math.round(this._realY * th)), tiles = [];
        for (let y = b.y0; y <= b.y1; y++) {
            for (let x = b.x0; x <= b.x1; x++) tiles.push({ x: $gameMap.roundX(x), y: $gameMap.roundY(y) });
        }
        return tiles;
    };

    // a tile the feet may not enter
    Game_Player.prototype.freeTileBlocked = function(x, y) {
        x = $gameMap.roundX(x);
        y = $gameMap.roundY(y);
        if (!$gameMap.isValid(x, y)) return true;
        if (this.isThrough() || this.isDebugThrough()) return false;
        if (![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))) return true;
        return this.isCollidedWithCharacters(x, y);
    };

    // The first blocking tile the feet would newly touch at (fx, fy) - a tile they
    // already overlap never blocks, so nobody gets stuck inside something.
    Game_Player.prototype.freeBlocker = function(fx, fy, fromX, fromY) {
        const from = feetBox(fromX, fromY), to = feetBox(fx, fy);
        for (let y = to.y0; y <= to.y1; y++) {
            for (let x = to.x0; x <= to.x1; x++) {
                if (x >= from.x0 && x <= from.x1 && y >= from.y0 && y <= from.y1) continue;
                if (this.freeTileBlocked(x, y)) return { x: $gameMap.roundX(x), y: $gameMap.roundY(y) };
            }
        }
        return null;
    };

    // ------------------------------------------------------------------
    // Movement
    // ------------------------------------------------------------------
    const _isMoving = Game_Player.prototype.isMoving;
    Game_Player.prototype.isMoving = function() {
        if (!this.isFreeMoving()) return _isMoving.call(this);
        return !!this._pixelMoved || !!this._gridGlide;
    };

    // The engine only glides the player when a move route or a cutscene moves him tile by tile.
    const _updateMove = Game_Player.prototype.updateMove;
    Game_Player.prototype.updateMove = function() {
        if (!this.isFreeMoving()) {
            _updateMove.call(this);
            return;
        }
        if (!this._gridGlide) return;
        _updateMove.call(this);
        if (this._realX === this._x && this._realY === this._y) {
            this._gridGlide = false;
            this.refreshBushDepth();
        }
    };

    // Tile-by-tile moves (move routes, gathering...) glide from where the player really stands.
    for (const name of ["moveStraight", "moveDiagonally"]) {
        const original = Game_Player.prototype[name];
        Game_Player.prototype[name] = function() {
            if (!this.isFreeMoving()) return original.apply(this, arguments);
            const rx = this._realX, ry = this._realY;
            original.apply(this, arguments);
            if (this.isMovementSucceeded()) {
                this._realX = rx;
                this._realY = ry;
                this._gridGlide = true;
            }
        };
    }

    const _updateDashing = Game_Player.prototype.updateDashing;
    Game_Player.prototype.updateDashing = function() {
        if (!this.isFreeMoving()) {
            _updateDashing.call(this);
            return;
        }
        // in tile mode dashing only changes between two steps; free movement has no steps
        if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled()) {
            this._dashing = this.isDashButtonPressed() || $gameTemp.isDestinationValid();
        } else {
            this._dashing = false;
        }
    };

    // The wanted direction: keys and pad first, then the clicked destination.
    Game_Player.prototype.freeInput = function() {
        const dir = DIAGONAL ? Input.dir8 : this.getInputDirection();
        if (dir > 0 && DIR_VECTOR[dir]) {
            $gameTemp.clearDestination();
            return DIR_VECTOR[dir];
        }
        if ($gameTemp.isDestinationValid()) return this.freeDestinationVector();
        return null;
    };

    // Follows the engine's tile path to the destination, steering at the centre of the next tile.
    Game_Player.prototype.freeDestinationVector = function() {
        const gx = $gameTemp.destinationX(), gy = $gameTemp.destinationY();
        if (this.x === gx && this.y === gy) return null;
        const d = this.findDirectionTo(gx, gy);
        if (!d) return null;
        const nx = this.x + (d === 6 ? 1 : d === 4 ? -1 : 0), ny = this.y + (d === 2 ? 1 : d === 8 ? -1 : 0);
        const vx = nx - this._realX, vy = ny - this._realY;
        return Math.hypot(vx, vy) < 0.001 ? null : [vx, vy];
    };

    // Four directions in the graphic: sideways wins on a diagonal, unless he already faces up or down.
    Game_Player.prototype.freeFace = function(nx, ny) {
        const ax = Math.abs(nx), ay = Math.abs(ny);
        let d;
        if (ax > 0.38 && ay > 0.38) {
            const horz = nx > 0 ? 6 : 4, vert = ny > 0 ? 2 : 8;
            d = this._direction === horz || this._direction === vert ? this._direction : horz;
        } else {
            d = ax > ay ? (nx > 0 ? 6 : 4) : (ny > 0 ? 2 : 8);
        }
        this.setDirection(d);
    };

    // Move along one axis by up to n pixels (as far as there is room).
    Game_Player.prototype.freeAxis = function(s, sx, sy, pure) {
        const n = Math.abs(sx || sy), ux = Math.sign(sx), uy = Math.sign(sy);
        let blockedBy = null;
        for (let k = n; k >= 1; k--) {
            const blocker = this.freeBlocker(s.fx + ux * k, s.fy + uy * k, s.fx, s.fy);
            if (!blocker) {
                s.fx += ux * k;
                s.fy += uy * k;
                s.moved = true;
                return;
            }
            blockedBy = blockedBy || blocker;
        }
        s.bump = s.bump || blockedBy;
        if (pure && ASSIST) this.freeAssist(s, ux, uy, n);
    };

    // Walking straight at something that the middle of the lane would pass: slide towards the lane.
    Game_Player.prototype.freeAssist = function(s, ux, uy, n) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        let step = 0;
        if (ux) {
            const lane = Math.round(s.fy / th) * th, off = lane - s.fy;
            if (off === 0 || Math.abs(off) > th / 2 || this.freeBlocker(s.fx + ux * n, lane, s.fx, s.fy)) return;
            step = Math.sign(off) * Math.min(Math.abs(off), n);
            if (this.freeBlocker(s.fx, s.fy + step, s.fx, s.fy)) return;
            s.fy += step;
        } else {
            const lane = Math.round(s.fx / tw) * tw, off = lane - s.fx;
            if (off === 0 || Math.abs(off) > tw / 2 || this.freeBlocker(lane, s.fy + uy * n, s.fx, s.fy)) return;
            step = Math.sign(off) * Math.min(Math.abs(off), n);
            if (this.freeBlocker(s.fx + step, s.fy, s.fx, s.fy)) return;
            s.fx += step;
        }
        s.moved = true;
        s.bump = null;
    };

    Game_Player.prototype.freeStep = function(dx, dy) {
        const len = Math.hypot(dx, dy);
        if (len < 0.0001) return;
        const nx = dx / len, ny = dy / len, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        this.freeFace(nx, ny);
        // whole pixels per frame; the remainder is carried over so that the speed stays exact
        const speed = this.distancePerFrame();
        this._freeAccX = (this._freeAccX || 0) + nx * speed * tw;
        this._freeAccY = (this._freeAccY || 0) + ny * speed * th;
        const sx = Math.trunc(this._freeAccX), sy = Math.trunc(this._freeAccY);
        this._freeAccX -= sx;
        this._freeAccY -= sy;
        const s = { fx: Math.round(this._realX * tw), fy: Math.round(this._realY * th), moved: false, bump: null };
        if (sx) this.freeAxis(s, sx, 0, Math.abs(ny) < 0.2);
        if (sy) this.freeAxis(s, 0, sy, Math.abs(nx) < 0.2);
        if (!s.moved) {
            this._freeAccX = this._freeAccY = 0;
            if (s.bump) this.checkEventTriggerTouch(s.bump.x, s.bump.y);   // a door or a person in the way
            return;
        }
        if ($gameMap.isLoopHorizontal()) s.fx = ((s.fx % ($gameMap.width() * tw)) + $gameMap.width() * tw) % ($gameMap.width() * tw);
        if ($gameMap.isLoopVertical()) s.fy = ((s.fy % ($gameMap.height() * th)) + $gameMap.height() * th) % ($gameMap.height() * th);
        this._realX = s.fx / tw;
        this._realY = s.fy / th;
        this._pixelMoved = true;
        const x = $gameMap.roundX(Math.floor((s.fx + tw / 2) / tw)), y = $gameMap.roundY(Math.floor((s.fy + th / 2) / th));
        if (x !== this._x || y !== this._y) {
            this._followers.updateMove();   // they step onto the tile he leaves, as in the engine
            this._x = x;
            this._y = y;
            this.freeEnteredTile();
        }
    };

    // What the engine does at the end of each step, done when the nearest tile changes.
    Game_Player.prototype.freeEnteredTile = function() {
        this.increaseSteps();
        $gameParty.onPlayerWalk();
        this.checkEventTriggerHere([1, 2]);
        this.updateEncounterCount();
    };

    const _moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        if (!this.isFreeMoving()) {
            this._pixelMoved = false;
            _moveByInput.call(this);
            return;
        }
        this._pixelMoved = false;
        if (this._gridGlide || !this.canMove()) {
            this._freeAccX = this._freeAccY = 0;
            return;
        }
        const v = this.freeInput();
        if (v) this.freeStep(v[0], v[1]);
        else this._freeAccX = this._freeAccY = 0;
    };

    // A transfer or a set position puts the player back on a tile centre.
    const _locate = Game_Player.prototype.locate;
    Game_Player.prototype.locate = function(x, y) {
        _locate.call(this, x, y);
        this._pixelMoved = false;
        this._gridGlide = false;
        this._freeAccX = this._freeAccY = 0;
    };

    // Touch triggers fire on entering a tile (above), so standing still adds nothing.
    const _updateNonmoving = Game_Player.prototype.updateNonmoving;
    Game_Player.prototype.updateNonmoving = function(wasMoving, sceneActive) {
        _updateNonmoving.call(this, this.isFreeMoving() ? false : wasMoving, sceneActive);
    };

    const _update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _update.call(this, sceneActive);
        if (!this.isFreeMoving()) return;
        if (!sceneActive) {
            this._pixelMoved = false;
        } else if (this._pixelMoved && !$gameMap.isEventRunning() && !$gameMap.isAnyEventStarting()) {
            this.triggerAction();   // the action button works while walking, too
        }
    };

    // Events keep out of every tile the feet touch, not only the nearest one.
    const _isCollided = Game_Player.prototype.isCollided;
    Game_Player.prototype.isCollided = function(x, y) {
        if (this.isThrough() || !this.isFreeMoving()) return _isCollided.call(this, x, y);
        return this.feetTiles().some(t => t.x === x && t.y === y) || this._followers.isSomeoneCollided(x, y);
    };

    // ------------------------------------------------------------------
    // The tile in front of the player: four corner brackets while he stands still.
    // (Tools and the action button work on that tile, and without steps it is no longer obvious.)
    // ------------------------------------------------------------------
    let markerBitmap = null;
    function targetMarkerBitmap() {
        if (markerBitmap) return markerBitmap;
        const size = 48, arm = 9, bitmap = new Bitmap(size, size), ctx = bitmap.context;
        const corner = (x, y, sx, sy) => {   // an L with a dark rim, sx / sy point into the tile
            const bar = (bx, by, w, h) => {
                ctx.fillStyle = "#1a100a";
                ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
            };
            bar(x, y, arm * sx, 3 * sy);
            bar(x, y, 3 * sx, arm * sy);
            ctx.fillStyle = "#f6e7c4";
            ctx.fillRect(Math.min(x, x + arm * sx), Math.min(y, y + 3 * sy), arm, 3);
            ctx.fillRect(Math.min(x, x + 3 * sx), Math.min(y, y + arm * sy), 3, arm);
        };
        corner(3, 3, 1, 1);
        corner(size - 3, 3, -1, 1);
        corner(3, size - 3, 1, -1);
        corner(size - 3, size - 3, -1, -1);
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        markerBitmap = bitmap;
        return bitmap;
    }

    // something the action button or a tool would do on this tile
    function worthMarking(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        const events = $gameMap.eventsXy(x, y).filter(e => e.isNormalPriority());
        if (events.some(e => e.isTriggerIn([0, 1, 2]))) return true;
        if (events.length > 0) return false;   // something solid with nothing to do
        const farming = window.Farming;
        return !!farming && !!(farming.buildingAt(x, y) || farming.plotAt(x, y));
    }

    function Sprite_TargetMarker() {
        this.initialize(...arguments);
    }
    Sprite_TargetMarker.prototype = Object.create(Sprite.prototype);
    Sprite_TargetMarker.prototype.constructor = Sprite_TargetMarker;

    Sprite_TargetMarker.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, targetMarkerBitmap());
        this.z = 2.2;   // over the ground and the soil, under the characters
        this._idle = 0;
        this._age = 0;
        this.visible = false;
    };

    Sprite_TargetMarker.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const p = $gamePlayer;
        const idle = MARKER && p.isFreeMoving() && !p.isMoving() && p.canMove() && !p.isTransparent();
        this._idle = idle ? this._idle + 1 : 0;
        this.visible = false;
        if (this._idle < 10) return;
        const x = $gameMap.roundXWithDirection(p.x, p.direction()), y = $gameMap.roundYWithDirection(p.y, p.direction());
        if (!worthMarking(x, y)) return;
        this._age++;
        this.visible = true;
        this.opacity = Math.round(255 * (0.62 + 0.28 * Math.sin(this._age * 0.11)));
        this.x = Math.round($gameMap.adjustX(x) * $gameMap.tileWidth());
        this.y = Math.round($gameMap.adjustY(y) * $gameMap.tileHeight());
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._targetMarker = new Sprite_TargetMarker();
        this._tilemap.addChild(this._targetMarker);
    };

    window.FreeMovement = { feetBox, freeMoveOn, worthMarking };
})();
