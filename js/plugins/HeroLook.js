/*:
 * @target MZ
 * @plugindesc Nowa postać (wieśniak w szarej tunice, boso): płynne chodzenie, bieg i skradanie w 8 kierunkach oraz nowe animacje pracy i walki (16 klatek). F9 przełącza na starą. v1.0.0
 * @author Tawerna
 *
 * @param startOn
 * @text Nowa postać domyślnie
 * @type boolean
 * @default true
 * @desc true: nowa postać (w nowej grze i w zapisach, w których nie przełączano jej w F9); false: stary Reid.
 *
 * @help
 * Nowy wygląd bohatera (wieśniak w szarej tunice z worka, boso), na próbę.
 *
 * Chodzenie i bieg: img/characters/Hero_Walk.png i Hero_Run.png - 8 wierszy
 * (kierunki: dół, dół-lewo, lewo, góra-lewo, góra, góra-prawo, prawo, dół-prawo)
 * po 9 klatek 64x64: pierwsza to postać stojąca, osiem następnych to kroki.
 * Klatka kroku wynika z przebytej drogi, więc nogi nadążają za prędkością
 * (wolniej zmęczony, szybciej w biegu) i nie "ślizgają się". Kierunek na ukos
 * jest brany z ruchu (FreeMovement), nie tylko z czterech stron.
 *
 * Praca i walka: każdy ruch ma nowy arkusz w img/system (Hero_Axe, Hero_AxeSide,
 * Hero_Pick, Hero_Shovel, Hero_Rake, Hero_Hoe, Hero_Hammer, Hero_Rod, Hero_Sling,
 * Hero_Bow, Hero_Spear, Hero_Club, Hero_Punch, Hero_Crouch, Hero_Sit, Hero_Roast,
 * Hero_LieDown, Hero_Roll, Hero_Torch): 4 wiersze (dół, lewo, prawo, góra), 17-33 klatek 96x96
 * (ChoppableTree: swingKind pyta HeroLook.swingDef). Skradanie (C): Hero_Sneak.
 * Z zapaloną pochodnią w ręku (Torch.js): Hero_TorchWalk, Hero_TorchRun, Hero_TorchSneak.
 *
 * Menu F9, zakładka Zdarzenia: "Nowa postać" przełącza na starego Reida i z powrotem.
 */
(() => {
    "use strict";

    const params = PluginManager.parameters("HeroLook");
    const START_ON = params.startOn !== "false";

    const WALK = "Hero_Walk", RUN = "Hero_Run", SNEAK = "Hero_Sneak";
    const CELL = 64;    // the walking sheets' cells; a row: the figure standing, then the frames of the cycle (as many as the sheet is wide)
    const ROWS = { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 };   // numpad direction -> row: down, down-left, left, up-left, up, up-right, right, down-right
    const STRIDE = { walk: 1.7, run: 2.8, sneak: 1.1 };   // tiles covered by one whole cycle of the legs (two steps)
    const STILL = 4;   // frames without moving before he stands (the free movement stutters at walls)
    const TURN_HOLD = 6;   // walking by itself (not by the keys): frames a new way must hold before he turns to it
    // ChoppableTree swing kind -> the new sheet (4 rows: down, left, right, up) and on which frame of each row the blow lands
    // (16-frame sheets from PixelLab; the sit / crouch / lie-down ones are the move there and the same move back, the hit on the middle)
    const SWINGS = {
        0: { sheet: "Hero_Axe", hit: [8, 7, 7, 10] },          // the axe from above (logs)
        1: { sheet: "Hero_Pick", hit: [8, 9, 9, 9] },          // the pickaxe (rocks)
        2: { sheet: "Hero_Shovel", hit: [8, 7, 7, 8] },        // the shovel (stumps, digging)
        3: { sheet: "Hero_AxeSide", hit: [10, 10, 10, 9] },    // the axe from the side (standing trees)
        4: { sheet: "Hero_Rake", hit: [10, 8, 8, 8] },         // the rake
        5: { sheet: "Hero_Hoe", hit: [8, 8, 8, 9] },           // the hoe
        6: { sheet: "Hero_Crouch", hit: [16, 16, 16, 16] },    // crouching (sowing, harvesting, picking up)
        7: { sheet: "Hero_Hammer", hit: [8, 8, 8, 7] },        // the hammer (building sites)
        8: { sheet: "Hero_Rod", hit: [14, 14, 14, 12] },       // the fishing rod (the hit: the waiting pose)
        9: { sheet: "Hero_Sling", hit: [9, 11, 11, 11] },      // the sling
        10: { sheet: "Hero_Bow", hit: [14, 14, 14, 13] },      // the bow
        11: { sheet: "Hero_Sit", hit: [16, 16, 16, 16] },      // sitting by a fire
        12: { sheet: "Hero_Roast", hit: [16, 16, 16, 16] },    // sitting with a roasting stick
        13: { sheet: "Hero_Sit", hit: [16, 16, 16, 16] },      // sitting beside a tripod
        14: { sheet: "Hero_LieDown", hit: [16, 16, 16, 16] },  // lying down
        15: { sheet: "Hero_Spear", hit: [8, 10, 10, 11] },     // the spear jab
        16: { sheet: "Hero_Roll", hit: [0, 0, 0, 0] },         // the dodge roll
        17: { sheet: "Hero_LieDown", hit: [16, 16, 16, 16] },  // knocked down
        18: { sheet: "Hero_Club", hit: [9, 7, 7, 11] },        // the club
        19: { sheet: "Hero_Punch", hit: [12, 13, 13, 6] },     // a punch (from behind: the fists up and down again, no turning)
        20: { sheet: "Hero_Torch", hit: [7, 7, 7, 9] }         // the burning torch (Torch.js): raised, swept in front of him, back up
    };
    // the torch in his hand (Torch.js: lit and not stuck in the ground while he works): the same walk with the torch held - the hand
    // nearer the camera, behind him from the back (tools/torch/build_torch_walk.py)
    const TORCH_SHEETS = { walk: "Hero_TorchWalk", run: "Hero_TorchRun", sneak: "Hero_TorchSneak" };
    const torchHeld = () => !!(window.Torch && Torch.held && Torch.held());

    const active = () => !!$gameSystem && ($gameSystem._heroLook === undefined ? START_ON : $gameSystem._heroLook === "new");
    function setActive(on) {
        if ($gameSystem) $gameSystem._heroLook = on ? "new" : "old";
    }

    // ---- which way he faces, in 8 directions, and how far his legs have gone
    const DIR8 = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };   // octant of the move (y down) -> numpad
    const FITS = { 2: [2, 1, 3], 4: [4, 1, 7], 6: [6, 3, 9], 8: [8, 7, 9] };   // the 8-way facings that go with a 4-way one
    // the keys' way; letting go of the two keys of a slant one after the other (within RELEASE_GRACE frames) keeps the slant
    const RELEASE_GRACE = 6;
    const DIAG = { 1: [2, 4], 3: [2, 6], 7: [8, 4], 9: [8, 6] };
    function keyFacing(p) {
        const k = Input.dir8;
        if (DIAG[k]) {
            p._heroDiagKey = k;
            p._heroDiagAt = Graphics.frameCount;
            return k;
        }
        if (k && p._heroDiagKey && Graphics.frameCount - p._heroDiagAt <= RELEASE_GRACE && DIAG[p._heroDiagKey].includes(k)) return p._heroDiagKey;
        return k;
    }

    // (the tile in front - the brackets on the ground, the tools, the action button - stays the 4-way one: the user tried the
    // tile on the slant and wanted the four ways back, 2026-09-25)

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        const x0 = this._realX, y0 = this._realY;
        _Game_Player_update.call(this, sceneActive);
        const dx = this._realX - x0, dy = this._realY - y0, d = Math.hypot(dx, dy);
        if (d > 0.0005 && d < 1.5 && !this.isJumping()) {   // (walked - not put somewhere else, not a jump)
            // The free movement steps one axis at a time on some frames (slowly - tired - more often), so the move of a single
            // frame says "left" or "down" in the middle of a diagonal walk. Walking by the keys, the facing is where the keys point;
            // walking by itself (a click, up to a building spot) it is the move over the last frames, and it turns only once the
            // new way has held for TURN_HOLD frames (the user's, 2026-09-25: the sprite flicked between two directions).
            const keys = keyFacing(this);
            let want;
            if (keys && keys !== 5 && !$gameTemp.isDestinationValid()) {
                want = keys;
            } else {
                this._heroVX = (this._heroVX || 0) * 0.8 + dx;
                this._heroVY = (this._heroVY || 0) * 0.8 + dy;
                want = DIR8[Math.round(Math.atan2(this._heroVY, this._heroVX) / (Math.PI / 4))];
            }
            if (want === this._heroDir8 || !this._heroDir8) {
                this._heroDir8 = want;
                this._heroTurn = 0;
            } else if (want === keys || ++this._heroTurn >= TURN_HOLD) {
                this._heroDir8 = want;
                this._heroTurn = 0;
            }
            this._heroStep = (this._heroStep || 0) + d;
            this._heroStill = 0;
        } else {
            this._heroStill = (this._heroStill || 0) + 1;
            // a key held where he cannot go (a wall, a tree): he turns that way where he stands - on the slant too
            const keys = keyFacing(this);
            if (keys && keys !== 5 && this.canMove() && !$gameTemp.isDestinationValid()) this._heroDir8 = keys;
        }
        // turned where he stands (an event, a swing, a menu): the 8-way facing follows the 4-way one
        if (!FITS[this._direction] || !FITS[this._direction].includes(this._heroDir8)) this._heroDir8 = this._direction;
    };

    // the sheet, column and row to show now
    function heroCell() {
        const p = $gamePlayer, moving = (p._heroStill || 0) < STILL && !p.isJumping();
        const run = moving && typeof p.isDashing === "function" && p.isDashing();
        const sneak = !run && !!(window.Hunting && Hunting.sneaking && Hunting.sneaking());   // (C: bent low, also standing)
        const kind = run ? "run" : sneak ? "sneak" : "walk";
        const phase = moving ? ((p._heroStep || 0) / STRIDE[kind]) % 1 : -1;   // how far into the cycle of the legs (-1: standing)
        const sheet = torchHeld() ? TORCH_SHEETS[kind] : run ? RUN : sneak ? SNEAK : WALK;
        return { sheet, phase, row: ROWS[p._heroDir8 || p.direction()] || 0 };
    }

    // ---- the player's sprite: the new sheets instead of the actor's character graphic
    const _updateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        if (this._character === $gamePlayer && active()) {
            const cell = heroCell();
            if (this._heroSheet !== cell.sheet) {
                this._heroSheet = cell.sheet;
                this.bitmap = ImageManager.loadCharacter(cell.sheet);
                this._isBigCharacter = false;
                this._characterName = cell.sheet;   // (not empty: an empty name hides the sprite - isEmptyCharacter)
            }
            this._heroCell = cell;
            return;
        }
        if (this._heroSheet) {
            this._heroSheet = null;
            this._heroCell = null;
            this._characterName = null;
        }
        _updateBitmap.call(this);
    };
    const _patternWidth = Sprite_Character.prototype.patternWidth;
    Sprite_Character.prototype.patternWidth = function() {
        return this._heroSheet && this.bitmap ? CELL : _patternWidth.call(this);
    };
    const _patternHeight = Sprite_Character.prototype.patternHeight;
    Sprite_Character.prototype.patternHeight = function() {
        return this._heroSheet && this.bitmap ? CELL : _patternHeight.call(this);
    };
    // a swing sheet (ChoppableTree) still takes over while he works
    const _updateFrame = Sprite_Character.prototype.updateFrame;
    Sprite_Character.prototype.updateFrame = function() {
        if (this._heroSheet && this._heroCell && !(this.updateSwingSheet && this.updateSwingSheet())) {
            const c = this._heroCell, n = Math.max(1, Math.round(this.bitmap.width / CELL) - 1);
            const col = c.phase < 0 ? 0 : 1 + Math.min(n - 1, Math.floor(c.phase * n));
            c.col = col;
            this.setFrame(col * CELL, c.row * CELL, CELL, CELL);
            return;
        }
        _updateFrame.call(this);
    };

    // ---- the work: the new swing sheets where there are some
    const swingCache = {};
    function swingDef(kind, def) {
        if (!active() || !SWINGS[kind]) return def;
        return swingCache[kind] || (swingCache[kind] = Object.assign({}, def, SWINGS[kind]));
    }

    // the sheets load with the map, so the first step or swing does not wait for them
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        if (!active()) return;
        ImageManager.loadCharacter(WALK);
        ImageManager.loadCharacter(RUN);
        ImageManager.loadCharacter(SNEAK);
        for (const s of Object.values(TORCH_SHEETS)) ImageManager.loadCharacter(s);
        for (const s of Object.values(SWINGS)) ImageManager.loadSystem(s.sheet);
    };

    window.HeroLook = { active, setActive, swingDef, heroCell, SWINGS, ROWS, STRIDE, TORCH_SHEETS };
})();
