//=============================================================================
// DustMotes.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Unoszące się w powietrzu drobinki kurzu dla klimatu wnętrz. v1.0.0
 * @author Claude
 *
 * @param count
 * @text Liczba drobinek
 * @type number
 * @min 1
 * @max 200
 * @default 35
 *
 * @param color
 * @text Kolor (R,G,B)
 * @type string
 * @default 255,241,204
 *
 * @param minSize
 * @text Minimalny rozmiar (px)
 * @type number
 * @min 1
 * @default 2
 *
 * @param maxSize
 * @text Maksymalny rozmiar (px)
 * @type number
 * @min 1
 * @default 4
 *
 * @param speed
 * @text Prędkość unoszenia
 * @type number
 * @decimals 2
 * @default 0.15
 *
 * @param defaultEnabled
 * @text Domyślnie włączone
 * @type boolean
 * @default false
 *
 * @help
 * ============================================================================
 * DustMotes.js
 * ============================================================================
 * Dodaje subtelne, wolno unoszące się drobinki kurzu na mapie - efekt
 * klimatyczny do wnętrz (tawerna, dom, piwnica, ruiny).
 *
 * Włączanie / wyłączanie na konkretnej mapie:
 *   W notatce mapy (Map Properties > Note) wpisz jeden z tagów:
 *     <Dust:on>   - wymusza włączenie efektu na tej mapie
 *     <Dust:off>  - wymusza wyłączenie efektu na tej mapie
 *
 * Jeśli mapa nie ma żadnego z tagów, używane jest ustawienie
 * "Domyślnie włączone" z parametrów pluginu.
 *
 * Brak komend wtyczki - działa automatycznie na podstawie notatki mapy.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "DustMotes";
    const params = PluginManager.parameters(pluginName);
    const COUNT = Number(params.count || 35);
    const COLOR = String(params.color || "255,241,204")
        .split(",")
        .map(s => Number(s.trim()));
    const MIN_SIZE = Number(params.minSize || 2);
    const MAX_SIZE = Number(params.maxSize || 4);
    const SPEED = Number(params.speed || 0.15);
    const DEFAULT_ENABLED = params.defaultEnabled === "true";

    function isDustEnabled() {
        const note = $dataMap && $dataMap.note ? $dataMap.note : "";
        if (/<Dust:\s*on\s*>/i.test(note)) return true;
        if (/<Dust:\s*off\s*>/i.test(note)) return false;
        return DEFAULT_ENABLED;
    }

    function Sprite_DustMote() {
        this.initialize(...arguments);
    }

    Sprite_DustMote.prototype = Object.create(Sprite.prototype);
    Sprite_DustMote.prototype.constructor = Sprite_DustMote;

    Sprite_DustMote._cache = {};

    Sprite_DustMote.sharedBitmap = function(size) {
        const key = Math.round(size * 10);
        if (!this._cache[key]) {
            const d = Math.ceil(size * 2) + 2;
            const bitmap = new Bitmap(d, d);
            const context = bitmap.context;
            const cx = d / 2;
            const cy = d / 2;
            const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, size);
            gradient.addColorStop(0, `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},0.9)`);
            gradient.addColorStop(1, `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},0)`);
            context.fillStyle = gradient;
            context.fillRect(0, 0, d, d);
            bitmap._baseTexture.update();
            this._cache[key] = bitmap;
        }
        return this._cache[key];
    };

    // Positions are kept in MAP-PIXEL space (not screen space) and confined to
    // the map's own width/height, so the motes stay inside the room instead of
    // drifting across the whole viewport regardless of room size.
    Sprite_DustMote.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this._size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
        this.bitmap = Sprite_DustMote.sharedBitmap(this._size);
        this.reset(true);
    };

    Sprite_DustMote.prototype.roomWidth = function() {
        return $gameMap.width() * $gameMap.tileWidth();
    };

    Sprite_DustMote.prototype.roomHeight = function() {
        return $gameMap.height() * $gameMap.tileHeight();
    };

    Sprite_DustMote.prototype.reset = function(initial) {
        this._mapX = Math.random() * this.roomWidth();
        this._mapY = initial ? Math.random() * this.roomHeight() : this.roomHeight() + 10;
        this._vx = (Math.random() - 0.5) * SPEED;
        this._vy = -SPEED * (0.4 + Math.random() * 0.6);
        this._swayPhase = Math.random() * Math.PI * 2;
        this._swaySpeed = 0.01 + Math.random() * 0.02;
        this.opacity = 0;
        this._targetOpacity = 80 + Math.random() * 100;
        this._fadeSpeed = 0.5 + Math.random() * 0.5;
    };

    Sprite_DustMote.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const roomW = this.roomWidth();
        const roomH = this.roomHeight();
        this._swayPhase += this._swaySpeed;
        this._mapX += this._vx + Math.sin(this._swayPhase) * 0.15;
        this._mapY += this._vy;
        if (this._mapX < 0) this._mapX += roomW;
        if (this._mapX > roomW) this._mapX -= roomW;
        if (this._mapY < -10) {
            this.reset(false);
        }
        if (this.opacity < this._targetOpacity) {
            this.opacity = Math.min(this._targetOpacity, this.opacity + this._fadeSpeed);
        }
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        this.x = Math.round(this._mapX - $gameMap.displayX() * tw);
        this.y = Math.round(this._mapY - $gameMap.displayY() * th);
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this.createDustMotes();
    };

    Spriteset_Map.prototype.createDustMotes = function() {
        this._dustSprites = [];
        this._dustContainer = new Sprite();
        if (isDustEnabled()) {
            for (let i = 0; i < COUNT; i++) {
                const mote = new Sprite_DustMote();
                this._dustSprites.push(mote);
                this._dustContainer.addChild(mote);
            }
        }
        this.addChild(this._dustContainer);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._dustSprites) {
            for (const mote of this._dustSprites) {
                mote.update();
            }
        }
    };
})();
