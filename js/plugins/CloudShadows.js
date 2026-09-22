//=============================================================================
// CloudShadows.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Cienie przelatujących chmur, przypięte do mapy (nie do ekranu), unoszą się nad mapą zewnętrzną. v1.1.0
 * @author Claude
 *
 * @param cloudCount
 * @text Gęstość: liczba chmur na ekran
 * @desc Tyle chmur przypada na powierzchnię jednego ekranu. Na większej mapie jest ich proporcjonalnie więcej.
 * @type number
 * @min 1
 * @max 12
 * @default 4
 *
 * @param cloudColor
 * @text Kolor cienia (R,G,B)
 * @type string
 * @default 40,40,55
 *
 * @param cloudOpacity
 * @text Maksymalna nieprzezroczystość (0-255)
 * @type number
 * @min 0
 * @max 255
 * @default 90
 *
 * @param minSize
 * @text Minimalny rozmiar chmury (px)
 * @type number
 * @default 120
 *
 * @param maxSize
 * @text Maksymalny rozmiar chmury (px)
 * @type number
 * @default 220
 *
 * @param speed
 * @text Prędkość wiatru (px/klatkę)
 * @type number
 * @decimals 2
 * @default 0.25
 *
 * @param windAngle
 * @text Kierunek wiatru (stopnie, 0=w prawo, 90=w dół)
 * @type number
 * @default 10
 *
 * @param defaultEnabled
 * @text Domyślnie włączone na mapach
 * @type boolean
 * @default false
 *
 * @help
 * ============================================================================
 * CloudShadows.js
 * ============================================================================
 * Dodaje kilka miękkich, nieregularnych cieni chmur, które powoli płyną nad
 * mapą w jednym kierunku (wiatr). Chmury leżą NA MAPIE: gdy gracz idzie, mapa
 * przesuwa się pod nimi tak samo jak trawa i drzewa, a dryfują wyłącznie
 * z wiatrem. Gdy chmura dopłynie do brzegu mapy, wraca z przeciwnej strony.
 * Rysowane trybem multiply, więc tylko przyciemniają teren pod spodem - nie
 * zasłaniają go płaskim kolorem.
 *
 * Liczba chmur to gęstość na jeden ekran; na dużej mapie chmur jest więcej,
 * żeby wszędzie wyglądało to tak samo.
 *
 * WŁĄCZANIE NA MAPIE:
 *   W notatce mapy (Map Properties > Note) wpisz jeden z tagów:
 *     <Clouds:on>   - wymusza cienie chmur na tej mapie
 *     <Clouds:off>  - wymusza ich brak
 *   Bez tagu używane jest ustawienie "Domyślnie włączone" z parametrów.
 *   Ma sens tylko na mapach zewnętrznych, pod otwartym niebem.
 *
 * Zmiana w v1.1.0: chmury nie "jadą" już razem z graczem, a prędkość wiatru to
 * dokładnie tyle pikseli na klatkę, ile wpisano (poprzednio była dwa razy
 * większa, dlatego wpisana wartość 0.50 dawała ruch 1.0 px na klatkę).
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "CloudShadows";
    const params = PluginManager.parameters(pluginName);
    const CLOUD_COUNT = Number(params.cloudCount || 4);
    const CLOUD_COLOR = String(params.cloudColor || "40,40,55")
        .split(",")
        .map(s => Number(s.trim()));
    const CLOUD_OPACITY = Number(params.cloudOpacity || 90);
    const MIN_SIZE = Number(params.minSize || 120);
    const MAX_SIZE = Number(params.maxSize || 220);
    const SPEED = Number(params.speed || 0.25);
    const WIND_ANGLE = Number(params.windAngle || 10);
    const DEFAULT_ENABLED = params.defaultEnabled === "true";

    const SHAPES = 8;          // different silhouettes, shared by all the clouds of a map
    const DETAIL = 0.5;        // shapes are drawn at half size and stretched back: they are soft anyway
    const MAX_CLOUDS = 80;

    function isCloudsEnabled() {
        const note = $dataMap && $dataMap.note ? $dataMap.note : "";
        if (/<Clouds:\s*on\s*>/i.test(note)) return true;
        if (/<Clouds:\s*off\s*>/i.test(note)) return false;
        return DEFAULT_ENABLED;
    }

    // Builds one irregular, fluffy cloud silhouette by stamping several
    // overlapping soft circles onto one bitmap - overlaps naturally stack
    // into a denser center with wispier edges, instead of a plain disc.
    function makeCloudBitmap(size) {
        const full = size * 2.2, d = Math.max(8, Math.round(full * DETAIL));
        const bitmap = new Bitmap(d, d);
        const context = bitmap.context;
        const cx = d / 2, cy = d / 2, k = DETAIL;
        const puffCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < puffCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * size * 0.35 * k;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist * 0.6; // flatten vertically, clouds are wider than tall
            const r = size * (0.35 + Math.random() * 0.3) * k;
            const gradient = context.createRadialGradient(px, py, 0, px, py, r);
            gradient.addColorStop(0, `rgba(${CLOUD_COLOR[0]},${CLOUD_COLOR[1]},${CLOUD_COLOR[2]},0.55)`);
            gradient.addColorStop(1, `rgba(${CLOUD_COLOR[0]},${CLOUD_COLOR[1]},${CLOUD_COLOR[2]},0)`);
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(px, py, r, 0, Math.PI * 2);
            context.fill();
        }
        bitmap._baseTexture.update();
        bitmap.smooth = true;   // stretched up, so it has to be filtered
        return bitmap;
    }

    // ------------------------------------------------------------------
    // A cloud has a position in the world (map pixels), so it scrolls with the
    // map like every other thing on it, and only drifts with the wind.
    // ------------------------------------------------------------------
    function Sprite_CloudShadow() {
        this.initialize(...arguments);
    }

    Sprite_CloudShadow.prototype = Object.create(Sprite.prototype);
    Sprite_CloudShadow.prototype.constructor = Sprite_CloudShadow;

    Sprite_CloudShadow.prototype.initialize = function(bitmap, size) {
        Sprite.prototype.initialize.call(this);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this.bitmap = bitmap;
        const stretch = (1 / DETAIL) * (0.85 + Math.random() * 0.3);
        this.scale.x = stretch * (Math.random() < 0.5 ? -1 : 1);
        this.scale.y = stretch;
        this._radius = (size * 2.2) / 2 * (stretch * DETAIL);
        const rad = (WIND_ANGLE * Math.PI) / 180;
        this._vx = Math.cos(rad) * SPEED;
        this._vy = Math.sin(rad) * SPEED;
        this._wx = 0;
        this._wy = 0;
        this.reset(true);
    };

    Sprite_CloudShadow.prototype.mapWidth = function() {
        return $gameMap.width() * $gameMap.tileWidth();
    };

    Sprite_CloudShadow.prototype.mapHeight = function() {
        return $gameMap.height() * $gameMap.tileHeight();
    };

    Sprite_CloudShadow.prototype.reset = function(initial) {
        const w = this.mapWidth(), h = this.mapHeight(), r = this._radius;
        if (initial) {
            this._wx = Math.random() * (w + r * 2) - r;
            this._wy = Math.random() * (h + r * 2) - r;
        } else {
            // Re-enter from whichever edge of the map is upwind, at a random cross-position.
            const rad = (WIND_ANGLE * Math.PI) / 180;
            const dirX = Math.cos(rad), dirY = Math.sin(rad);
            if (Math.abs(dirX) >= Math.abs(dirY)) {
                this._wx = dirX >= 0 ? -r : w + r;
                this._wy = Math.random() * (h + r * 2) - r;
            } else {
                this._wy = dirY >= 0 ? -r : h + r;
                this._wx = Math.random() * (w + r * 2) - r;
            }
        }
        this.opacity = Math.round(CLOUD_OPACITY * (0.6 + Math.random() * 0.4));
    };

    Sprite_CloudShadow.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._wx += this._vx;
        this._wy += this._vy;
        const w = this.mapWidth(), h = this.mapHeight(), r = this._radius;
        if (this._wx < -r * 2 || this._wx > w + r * 2 || this._wy < -r * 2 || this._wy > h + r * 2) {
            this.reset(false);
        }
        // world -> screen, the same way the tilemap does it (also right for maps smaller than the screen)
        this.x = ($gameMap.adjustX(this._wx / $gameMap.tileWidth())) * $gameMap.tileWidth();
        this.y = ($gameMap.adjustY(this._wy / $gameMap.tileHeight())) * $gameMap.tileHeight();
        this.visible = this.x > -r && this.x < Graphics.width + r && this.y > -r && this.y < Graphics.height + r;
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this.createCloudShadows();
    };

    Spriteset_Map.prototype.createCloudShadows = function() {
        this._cloudSprites = [];
        if (!isCloudsEnabled()) return;
        // the density is per screen, so a bigger map gets more clouds
        const area = ($gameMap.width() * $gameMap.tileWidth()) * ($gameMap.height() * $gameMap.tileHeight());
        const count = Math.min(MAX_CLOUDS, Math.max(CLOUD_COUNT, Math.round(CLOUD_COUNT * area / (Graphics.width * Graphics.height))));
        const shapes = [];
        for (let i = 0; i < Math.min(SHAPES, count); i++) {
            const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
            shapes.push({ bitmap: makeCloudBitmap(size), size });
        }
        for (let i = 0; i < count; i++) {
            const shape = shapes[i % shapes.length];
            const cloud = new Sprite_CloudShadow(shape.bitmap, shape.size);
            this._cloudSprites.push(cloud);
            this.addChild(cloud);
        }
    };

    // (the clouds are children of the spriteset, so its own update already moves them once per frame)
})();
