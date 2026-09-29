//=============================================================================
// GroundDetail.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Szlif grafiki: drobne kępki trawy, kamyki i kwiatki na łąkach. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @param grassDetail
 * @text Szczegóły na trawie
 * @desc Rozrzuca drobne kępki trawy, kamyki i kwiatki po łąkach, żeby duże płaszczyzny trawy nie były jednolite.
 * @type boolean
 * @default true
 *
 * @param grassDensity
 * @text Gęstość szczegółów (% kafelków)
 * @type number
 * @min 0
 * @max 100
 * @default 22
 *
 * @help
 * ============================================================================
 * GroundDetail.js
 * ============================================================================
 * Drobne kępki trawy, kamyki i kwiatki rozsiane po wolnych kafelkach trawy.
 * Nie ma ich na kafelkach z obiektami, zdarzeniami, ścieżkach ani na ziemi
 * uprawnej (glebę rysuje Farming.js nad nimi). Wzór jest stały dla danego
 * kafelka, więc nic nie "skacze" po powrocie na mapę.
 *
 * WYŁĄCZANIE NA MAPIE:
 *   W notatce mapy wpisz <Polish:off>, aby wyłączyć szczegóły na trawie na
 *   tej mapie (np. we wnętrzach). Ten sam tag wyłącza też cień i kontur
 *   postaci z CharacterPolish.js.
 *
 * Szczegóły na trawie korzystają z Farming.js (rozpoznaje, który kafelek to
 * trawa) - bez niego się po prostu nie pojawią.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("GroundDetail.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const pluginName = "GroundDetail";
    const params = PluginManager.parameters(pluginName);
    const GRASS_DETAIL = params.grassDetail !== "false";
    const GRASS_DENSITY = Math.max(0, Math.min(100, Number(params.grassDensity === undefined ? 22 : params.grassDensity))) / 100;

    // no <Polish:off> in the map's note (it wins over a <Polish:on> beside it; CharacterPolish.js reads the same)
    function polishOn() {
        return T.mapFlag("Polish", true, "off");
    }

    // the same deterministic tile hash as Farming.js (Sprite_GrassDetail.build already requires
    // window.Farming to be loaded before it calls this, see below)
    function hash2(x, y, s) {
        return Farming.hash2(x, y, s);
    }

    // ------------------------------------------------------------------
    // Grass: small tufts and flowers scattered over free grass tiles
    // ------------------------------------------------------------------
    const TILE = 48;
    // '.' empty, d/m/l dark, mid, light of the local grass colour, w/y flower petals/centre, s/t/u stone light/mid/dark
    const DECALS = {
        tuft: { weight: 34, rows: ["..l....", ".lm..l.", ".md.lm.", "lmdlmd.", ".dddd.."] },
        wide: { weight: 30, rows: ["l...l.l..", "ml.lm.ml.", "dmlmdlmd.", ".ddddddd."] },
        blade: { weight: 14, rows: ["..l", ".lm", ".md", "lmd", ".dd"] },
        flower: { weight: 10, rows: ["..w..", ".wyw.", "..w..", "..d..", "..d.."] }
    };
    const PATCH_CHANCE = 0.09;   // share of tiles that start a patch
    const DECAL_KEYS = Object.keys(DECALS);
    const DECAL_TOTAL = DECAL_KEYS.reduce((sum, k) => sum + DECALS[k].weight, 0);
    const decalCache = new Map();

    function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    function rgb(r, g, b) { return "rgb(" + clamp(r) + "," + clamp(g) + "," + clamp(b) + ")"; }

    function decalBitmap(name, tint) {
        const key = name + ":" + tint.map(v => v >> 3).join(",");
        if (decalCache.has(key)) return decalCache.get(key);
        const rows = DECALS[name].rows, h = rows.length, w = rows[0].length;
        const bitmap = new Bitmap(w, h), ctx = bitmap.context, [r, g, b] = tint;
        const colours = {
            d: rgb(r * 0.55, g * 0.66, b * 0.55),
            m: rgb(r * 1.05, g * 1.16, b * 1.02),
            l: rgb(r * 1.25 + 10, g * 1.3 + 14, b * 1.2 + 4),
            w: "#f1efe3", y: "#f0c24a",
            s: "#a4a698", t: "#7e8176", u: "#4f5248"
        };
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const ch = rows[y][x];
                if (ch === ".") continue;
                ctx.fillStyle = colours[ch];
                ctx.fillRect(x, y, 1, 1);
            }
        }
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        bitmap.smooth = false;
        decalCache.set(key, bitmap);
        return bitmap;
    }

    // Soft sunlit and shaded patches of meadow: a dithered blob laid at low opacity over the grass,
    // so the texture of the ground shows through but the flat green is broken up.
    const PATCH_W = 144, PATCH_H = 96;
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    function smoothNoise(x, y, salt) {
        const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
        const tx = fx * fx * (3 - 2 * fx), ty = fy * fy * (3 - 2 * fy);
        const a = hash2(i, j, salt) * (1 - tx) + hash2(i + 1, j, salt) * tx;
        const b = hash2(i, j + 1, salt) * (1 - tx) + hash2(i + 1, j + 1, salt) * tx;
        return a * (1 - ty) + b * ty;
    }
    const patchCache = new Map();
    function patchBitmap(kind, variant, tint) {
        const key = kind + ":" + variant + ":" + tint.map(v => v >> 4).join(",");
        if (patchCache.has(key)) return patchCache.get(key);
        const bitmap = new Bitmap(PATCH_W, PATCH_H), ctx = bitmap.context;
        const image = ctx.createImageData(PATCH_W, PATCH_H), data = image.data;
        const light = kind === "light";
        const [r, g, b] = tint;
        const colour = light ? [r * 1.3 + 22, g * 1.3 + 30, b * 1.05 + 6] : [r * 0.5, g * 0.62, b * 0.6];
        const alpha = light ? 58 : 50;
        for (let y = 0; y < PATCH_H; y++) {
            for (let x = 0; x < PATCH_W; x++) {
                const nx = (x - PATCH_W / 2) / (PATCH_W / 2), ny = (y - PATCH_H / 2) / (PATCH_H / 2);
                const v = 1 - Math.hypot(nx, ny) + (smoothNoise(x / 16, y / 16, 61 + variant) - 0.5) * 0.85;
                let a = 0;
                if (v > 0.5) a = 1;
                else if (v > 0.22) a = (v - 0.22) / 0.28 > BAYER[(y & 3) * 4 + (x & 3)] / 16 ? 1 : 0;   // dithered rim
                if (!a) continue;
                const i = (y * PATCH_W + x) * 4;
                data[i] = clamp(colour[0]); data[i + 1] = clamp(colour[1]); data[i + 2] = clamp(colour[2]); data[i + 3] = alpha;
            }
        }
        ctx.putImageData(image, 0, 0);
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        bitmap.smooth = false;
        patchCache.set(key, bitmap);
        return bitmap;
    }

    function pickDecal(t) {
        let acc = 0;
        for (const k of DECAL_KEYS) {
            acc += DECALS[k].weight;
            if (t * DECAL_TOTAL < acc) return k;
        }
        return DECAL_KEYS[0];
    }

    function Sprite_GrassDetail() {
        this.initialize(...arguments);
    }
    Sprite_GrassDetail.prototype = Object.create(Sprite.prototype);
    Sprite_GrassDetail.prototype.constructor = Sprite_GrassDetail;

    Sprite_GrassDetail.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.8;   // above the ground tiles, below the soil patches (z 1) and the characters
        this._items = [];
        this._built = false;
        this._scrollKey = null;
    };

    Sprite_GrassDetail.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!this._built) this.build();
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (this._built && scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
    };

    // Waits until the tileset images are loaded (Farming.groundInfoAt answers undefined until then).
    Sprite_GrassDetail.prototype.build = function() {
        const farming = window.Farming;
        if (!GRASS_DETAIL || !polishOn() || !farming || typeof farming.groundInfoAt !== "function") { this._built = true; return; }
        const mapId = $gameMap.mapId(), stored = ($gameSystem._farm && $gameSystem._farm.plots && $gameSystem._farm.plots[mapId]) || {};
        const built = [];
        for (let y = 0; y < $gameMap.height(); y++) {
            for (let x = 0; x < $gameMap.width(); x++) {
                if (hash2(x, y, 51) >= GRASS_DENSITY) continue;   // most tiles stay plain
                if (stored[x + "," + y] || $gameMap.eventsXy(x, y).length > 0 || farming.hasObjectTile(x, y)) continue;
                if (!$gameMap.checkPassage(x, y, 0x0f)) continue;
                const ground = farming.groundInfoAt(x, y);
                if (ground === undefined) return;   // images not ready yet: try again next frame
                if (!ground || ground.kind !== "grass") continue;
                const count = hash2(x, y, 52) < 0.25 ? 2 : 1;
                for (let i = 0; i < count; i++) {
                    const name = pickDecal(hash2(x, y, 53 + i));
                    const bitmap = decalBitmap(name, ground.tint);
                    built.push({ bitmap, wx: x * TILE + 3 + Math.floor(hash2(x, y, 55 + i) * (TILE - 6 - bitmap.width)), wy: y * TILE + 5 + Math.floor(hash2(x, y, 57 + i) * (TILE - 8 - bitmap.height)) });
                }
            }
        }
        // patches first, so the tufts lie on top of them
        const patches = [];
        for (let y = 1; y < $gameMap.height() - 1; y++) {
            for (let x = 1; x < $gameMap.width() - 1; x++) {
                if (hash2(x, y, 71) >= PATCH_CHANCE) continue;
                let ok = true, tint = null;
                for (let dy = -1; dy <= 1 && ok; dy++) {   // the centre and its four neighbours must be plain grass
                    for (let dx = -1; dx <= 1 && ok; dx++) {
                        if (dx !== 0 && dy !== 0) continue;
                        const tx = x + dx, ty = y + dy;
                        if (stored[tx + "," + ty] || farming.hasObjectTile(tx, ty) || !$gameMap.checkPassage(tx, ty, 0x0f)) { ok = false; break; }
                        const ground = farming.groundInfoAt(tx, ty);
                        if (ground === undefined) return;
                        if (!ground || ground.kind !== "grass") { ok = false; break; }
                        if (dx === 0 && dy === 0) tint = ground.tint;
                    }
                }
                if (!ok || $gameMap.eventsXy(x, y).length > 0) continue;
                const light = hash2(x, y, 72) < 0.62;
                patches.push({ bitmap: patchBitmap(light ? "light" : "dark", Math.floor(hash2(x, y, 73) * 4), tint), wx: x * TILE + TILE / 2 - PATCH_W / 2, wy: y * TILE + TILE / 2 - PATCH_H / 2 });
            }
        }
        for (const d of patches.concat(built)) {
            const sprite = new Sprite(d.bitmap);
            this._items.push({ sprite, wx: d.wx, wy: d.wy });
            this.addChild(sprite);
        }
        this._built = true;
        this._scrollKey = null;
    };

    Sprite_GrassDetail.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        const w = Graphics.width + 32, h = Graphics.height + 32;
        for (const item of this._items) {
            let x = item.wx - ox, y = item.wy - oy;
            if ($gameMap.isLoopHorizontal()) x = ((x % ($gameMap.width() * tw)) + $gameMap.width() * tw) % ($gameMap.width() * tw);
            if ($gameMap.isLoopVertical()) y = ((y % ($gameMap.height() * th)) + $gameMap.height() * th) % ($gameMap.height() * th);
            item.sprite.x = Math.round(x);
            item.sprite.y = Math.round(y);
            item.sprite.visible = x > -160 && x < w + 128 && y > -110 && y < h + 96;
        }
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._grassDetail = new Sprite_GrassDetail();
        this._tilemap.addChild(this._grassDetail);
    };

    window.GroundDetail = { Sprite_GrassDetail, decalBitmap, DECALS };
})();
