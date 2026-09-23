//=============================================================================
// SwayingFoliage.js
//=============================================================================
// Z-order: renders on top of DustMotes.js, RoomLighting.js, DayNightCycle.js and CloudShadows.js - must stay last of the five in plugins.js.

/*:
 * @target MZ
 * @plugindesc Subtelnie kołysząca się roślinność (krzaki/trawa/drzewa) na wietrze. v1.2.1
 * @author Claude
 *
 * @param region
 * @text Region oznaczający kołyszącą się roślinność
 * @type number
 * @min 1
 * @max 255
 * @default 5
 *
 * @param angle
 * @text Maksymalny kąt wychylenia (stopnie)
 * @type number
 * @decimals 1
 * @default 4
 *
 * @param speed
 * @text Czas pełnego cyklu kołysania (sekundy)
 * @desc Im większa wartość, tym wolniej. Każda roślina ma nadal lekko losowe tempo, żeby nie kołysały się identycznie.
 * @type number
 * @decimals 1
 * @min 0.5
 * @default 4.0
 *
 * @help
 * ============================================================================
 * SwayingFoliage.js
 * ============================================================================
 * Sprawia, że oznaczone kafelki (krzaki, kępy trawy, drzewa) delikatnie
 * kołyszą się na wietrze.
 *
 * JAK OZNACZYĆ KAFELEK DO KOŁYSANIA:
 *   W edytorze map przełącz widok na "Region" (przycisk nad siatką mapy),
 *   wybierz numer regionu z parametru "Region oznaczający kołyszącą się
 *   roślinność" (domyślnie 5) i zamaluj nim te same kafelki, na których
 *   stoi krzak/kępa trawy/drzewko. Sam wygląd kafelka zostaje bez zmian -
 *   region to tylko niewidoczny znacznik, który ten plugin odczytuje przy
 *   wejściu na mapę.
 *
 * DUŻE, WIELOKAFELKOWE DRZEWA:
 *   Jeśli zamalujesz regionem kilka stykających się ze sobą kafelków (np.
 *   całą koronę dużego drzewa, 2x2 albo 2x3 kafelki), plugin sam wykrywa,
 *   że to jeden spójny obiekt i kołysze go jako całość, jak prawdziwy pień -
 *   punkt oparcia jest u dołu całej grupy, więc góra wychyla się bardziej niż
 *   dół, a kafelki nie "rozjeżdżają się" osobno. Osobne, niestykające się ze
 *   sobą kafelki nadal kołyszą się każdy niezależnie, we własnym rytmie.
 *
 * Działa z każdym rodzajem kafelka (zwykłym i autotile), bo plugin robi sobie
 * własny podgląd dokładnie tej samej grafiki, którą mapa i tak już rysuje -
 * nie trzeba niczego dodatkowo importować ani podmieniać w tilesetach.
 *
 * Kołysząca się kopia korzysta z tego samego mechanizmu głębi co postacie,
 * więc gracz może przejść przed wysoką roślinnością lub za nią tak samo, jak
 * przed zwykłym eventem.
 *
 * Parametr "Czas pełnego cyklu kołysania" ustawia ogólne tempo (większa
 * wartość = wolniej), a każda roślina i tak dostaje niewielką losową
 * odchyłkę tempa, żeby wszystkie nie machały w idealnym takt.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "SwayingFoliage";
    const params = PluginManager.parameters(pluginName);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const SWAY_REGION = num(params.region, 5);
    const MAX_ANGLE = (num(params.angle, 4) * Math.PI) / 180;
    const CYCLE_SECONDS = num(params.speed, 4);
    // Radians per frame for a full sine cycle in CYCLE_SECONDS at 60fps.
    const BASE_SPEED = (2 * Math.PI) / (CYCLE_SECONDS * 60);

    const TILE_ID_A1 = 2048, TILE_ID_A2 = 2816, TILE_ID_A3 = 4352, TILE_ID_A4 = 5888;
    const TILE_ID_A5 = 1536, TILE_ID_MAX = 8192;

    // prettier-ignore
    const FLOOR_AUTOTILE_TABLE = [[[2,4],[1,4],[2,3],[1,3]],[[2,0],[1,4],[2,3],[1,3]],[[2,4],[3,0],[2,3],[1,3]],[[2,0],[3,0],[2,3],[1,3]],[[2,4],[1,4],[2,3],[3,1]],[[2,0],[1,4],[2,3],[3,1]],[[2,4],[3,0],[2,3],[3,1]],[[2,0],[3,0],[2,3],[3,1]],[[2,4],[1,4],[2,1],[1,3]],[[2,0],[1,4],[2,1],[1,3]],[[2,4],[3,0],[2,1],[1,3]],[[2,0],[3,0],[2,1],[1,3]],[[2,4],[1,4],[2,1],[3,1]],[[2,0],[1,4],[2,1],[3,1]],[[2,4],[3,0],[2,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,4],[1,4],[0,3],[1,3]],[[0,4],[3,0],[0,3],[1,3]],[[0,4],[1,4],[0,3],[3,1]],[[0,4],[3,0],[0,3],[3,1]],[[2,2],[1,2],[2,3],[1,3]],[[2,2],[1,2],[2,3],[3,1]],[[2,2],[1,2],[2,1],[1,3]],[[2,2],[1,2],[2,1],[3,1]],[[2,4],[3,4],[2,3],[3,3]],[[2,4],[3,4],[2,1],[3,3]],[[2,0],[3,4],[2,3],[3,3]],[[2,0],[3,4],[2,1],[3,3]],[[2,4],[1,4],[2,5],[1,5]],[[2,0],[1,4],[2,5],[1,5]],[[2,4],[3,0],[2,5],[1,5]],[[2,0],[3,0],[2,5],[1,5]],[[0,4],[3,4],[0,3],[3,3]],[[2,2],[1,2],[2,5],[1,5]],[[0,2],[1,2],[0,3],[1,3]],[[0,2],[1,2],[0,3],[3,1]],[[2,2],[3,2],[2,3],[3,3]],[[2,2],[3,2],[2,1],[3,3]],[[2,4],[3,4],[2,5],[3,5]],[[2,0],[3,4],[2,5],[3,5]],[[0,4],[1,4],[0,5],[1,5]],[[0,4],[3,0],[0,5],[1,5]],[[0,2],[3,2],[0,3],[3,3]],[[0,2],[1,2],[0,5],[1,5]],[[0,4],[3,4],[0,5],[3,5]],[[2,2],[3,2],[2,5],[3,5]],[[0,2],[3,2],[0,5],[3,5]],[[0,0],[1,0],[0,1],[1,1]]];
    // prettier-ignore
    const WALL_AUTOTILE_TABLE = [[[2,2],[1,2],[2,1],[1,1]],[[0,2],[1,2],[0,1],[1,1]],[[2,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],[[2,2],[3,2],[2,1],[3,1]],[[0,2],[3,2],[0,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,0],[3,0],[0,1],[3,1]],[[2,2],[1,2],[2,3],[1,3]],[[0,2],[1,2],[0,3],[1,3]],[[2,0],[1,0],[2,3],[1,3]],[[0,0],[1,0],[0,3],[1,3]],[[2,2],[3,2],[2,3],[3,3]],[[0,2],[3,2],[0,3],[3,3]],[[2,0],[3,0],[2,3],[3,3]],[[0,0],[3,0],[0,3],[3,3]]];

    function isTileA2(id) { return id >= TILE_ID_A2 && id < TILE_ID_A3; }
    function isTileA3(id) { return id >= TILE_ID_A3 && id < TILE_ID_A4; }
    function isTileA4(id) { return id >= TILE_ID_A4 && id < TILE_ID_MAX; }
    function isTileA5(id) { return id >= TILE_ID_A5 && id < TILE_ID_A1; }

    // Which source sheet a tileId's pixels actually come from, so we can
    // wait for that specific bitmap to finish loading before copying from it.
    function sourceBitmapFor(tileId, bitmaps) {
        if (!tileId) return null;
        if (tileId < 1536) return bitmaps[5 + Math.floor(tileId / 256)];
        if (isTileA5(tileId)) return bitmaps[4];
        if (isTileA2(tileId)) return bitmaps[1];
        if (isTileA3(tileId)) return bitmaps[2];
        if (isTileA4(tileId)) return bitmaps[3];
        return null;
    }

    // Copies exactly the pixels the tilemap itself would draw for this tileId
    // onto the given bitmap at (destX, destY), reusing the same lookup math
    // as the core Tilemap class (autotile quadrant assembly included).
    function paintTileTo(destBitmap, tileId, bitmaps, destX, destY) {
        destX = destX || 0;
        destY = destY || 0;
        if (!tileId) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        if (tileId < 1536) {
            const sheetIndex = Math.floor(tileId / 256); // 0..3 -> B,C,D,E
            const img = bitmaps[5 + sheetIndex];
            if (!img) return;
            const local = tileId % 256;
            const sx = ((Math.floor(local / 128) % 2) * 8 + (local % 8)) * tw;
            const sy = (Math.floor((local % 256) / 8) % 16) * th;
            destBitmap.blt(img, sx, sy, tw, th, destX, destY);
            return;
        }
        if (isTileA5(tileId)) {
            const img = bitmaps[4];
            if (!img) return;
            const local = tileId - TILE_ID_A5;
            const cols = Math.max(1, Math.floor(img.width / tw));
            const col = local % cols, row = Math.floor(local / cols);
            destBitmap.blt(img, col * tw, row * th, tw, th, destX, destY);
            return;
        }
        // The autotile format always packs 48 shape variants per "kind" block,
        // independent of the tileset's own pixel tile size - not a tile-size
        // constant, so this 48 (unlike the ones above) stays as a literal.
        const kind = Math.floor((tileId - TILE_ID_A1) / 48);
        const shape = (tileId - TILE_ID_A1) % 48;
        const tx = kind % 8, ty = Math.floor(kind / 8);
        let img, table = FLOOR_AUTOTILE_TABLE, bx = 0, by = 0;
        if (isTileA2(tileId)) {
            img = bitmaps[1]; bx = tx * 2; by = (ty - 2) * 3;
        } else if (isTileA3(tileId)) {
            img = bitmaps[2]; bx = tx * 2; by = (ty - 6) * 2; table = WALL_AUTOTILE_TABLE;
        } else if (isTileA4(tileId)) {
            img = bitmaps[3]; bx = tx * 2;
            by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
            if (ty % 2 === 1) table = WALL_AUTOTILE_TABLE;
        } else {
            return; // A1 (water) autotiles are never sensible "foliage", skip
        }
        if (!img) return;
        const t = table[shape];
        const w1 = tw / 2, h1 = th / 2;
        for (let i = 0; i < 4; i++) {
            const sx1 = (bx * 2 + t[i][0]) * w1, sy1 = (by * 2 + t[i][1]) * h1;
            const ddx = destX + (i % 2) * w1, ddy = destY + Math.floor(i / 2) * h1;
            destBitmap.blt(img, sx1, sy1, w1, h1, ddx, ddy);
        }
    }

    function Sprite_SwayingFoliage() {
        this.initialize(...arguments);
    }

    Sprite_SwayingFoliage.prototype = Object.create(Sprite.prototype);
    Sprite_SwayingFoliage.prototype.constructor = Sprite_SwayingFoliage;

    // originX/originY: top-left tile of the group's bounding box.
    // tileCols/tileRows: size of that bounding box, in tiles.
    // tiles: [{ dx, dy, tileId }] - dx/dy are pixel offsets within the group.
    Sprite_SwayingFoliage.prototype.initialize = function(originX, originY, tileCols, tileRows, tiles, bitmaps, isUpper) {
        Sprite.prototype.initialize.call(this);
        this.bitmap = new Bitmap(tileCols * $gameMap.tileWidth(), tileRows * $gameMap.tileHeight());
        // Bitmaps are smoothed by default; a smoothed skewed picture blurs by a different amount on every row,
        // and those soft and sharp bands run up the plant as the sway changes. Sharp pixels move as whole pixels.
        this.bitmap.smooth = false;
        // The tileset sheet each tile is drawn from may still be mid-load
        // when the map starts; painting immediately would copy a blank
        // image that never gets refreshed. Wait for it, painting right
        // away instead if it's already loaded (addLoadListener does this).
        for (const t of tiles) {
            const src = sourceBitmapFor(t.tileId, bitmaps);
            if (src) {
                src.addLoadListener(() => paintTileTo(this.bitmap, t.tileId, bitmaps, t.dx, t.dy));
            } else {
                paintTileTo(this.bitmap, t.tileId, bitmaps, t.dx, t.dy);
            }
        }
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        // "upper" tiles (e.g. tree canopies with the walk-behind flag) must
        // stay above every character regardless of Y, just like the tile(s)
        // they replace; everything else matches normal character depth so
        // the player can still walk in front of / behind it.
        this.z = isUpper ? 4 : 3;
        this._originX = originX;
        this._originY = originY;
        this._tileCols = tileCols;
        this._tileRows = tileRows;
        this._phase = Math.random() * Math.PI * 2;
        this._speed = BASE_SPEED * (0.8 + Math.random() * 0.4);
    };

    Sprite_SwayingFoliage.prototype.update = function() {
        Sprite.prototype.update.call(this);
        // a storm (Storm.js, wind 0..1): faster, wider, and bent downwind (the wind blows to the right: a negative skew leans the top right)
        const W = window.Storm ? Storm.wind() : 0;
        this._phase += this._speed * (1 + 1.5 * W);
        this.skew.x = Math.sin(this._phase) * MAX_ANGLE * (1 + 4 * W) - W * MAX_ANGLE * 3;
        // This sprite is a direct child of the Tilemap, same as character
        // sprites - so it must convert map coords to screen coords the same
        // way they do (via adjustX/Y), not just multiply by the tile size.
        // Raw tileIndex*48 ignores the map's scroll/centering offset, which
        // is constant but nonzero on maps smaller than the screen.
        // The pivot sits at the bottom-center of the whole group's bounding
        // box (its "root"), so a multi-tile tree bends as one piece instead
        // of shearing at the seams between tiles.
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        this.x = Math.floor(($gameMap.adjustX(this._originX) + this._tileCols / 2) * tw);
        this.y = Math.floor(($gameMap.adjustY(this._originY) + this._tileRows) * th);
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this.createSwayingFoliage();
    };

    Spriteset_Map.prototype.createSwayingFoliage = function() {
        this._swaySprites = [];
        const bitmaps = this._tilemap._bitmaps;
        if (!bitmaps) return;
        const width = $gameMap.width(), height = $gameMap.height();
        const visited = new Uint8Array(width * height);
        const cellIndex = (x, y) => y * width + x;
        const isSwayCell = (x, y) => $gameMap.regionId(x, y) === SWAY_REGION;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (visited[cellIndex(x, y)] || !isSwayCell(x, y)) continue;
                // Flood-fill (4-connectivity) to find the full extent of this
                // bush/tree: every region-tagged cell touching this one is
                // treated as one object, so it sways as a single piece.
                const group = [];
                const stack = [[x, y]];
                visited[cellIndex(x, y)] = 1;
                while (stack.length > 0) {
                    const [cx, cy] = stack.pop();
                    group.push([cx, cy]);
                    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
                    for (const [nx, ny] of neighbors) {
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                        if (visited[cellIndex(nx, ny)] || !isSwayCell(nx, ny)) continue;
                        visited[cellIndex(nx, ny)] = 1;
                        stack.push([nx, ny]);
                    }
                }
                this.createSwayGroup(group);
            }
        }
    };

    Spriteset_Map.prototype.createSwayGroup = function(group) {
        const bitmaps = this._tilemap._bitmaps;
        const flags = $gameMap.tilesetFlags();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const [cx, cy] of group) {
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
        }
        // Map data has FOUR tile layers (z=0..3), not three - z=3 is where
        // tall "upper flag" objects (e.g. tree canopies) live.
        const tiles = [];
        let isUpper = false;
        for (const [cx, cy] of group) {
            let tileId = 0;
            for (let z = 3; z >= 0; z--) {
                const t = $gameMap.tileId(cx, cy, z);
                if (t) { tileId = t; break; }
            }
            if (!tileId) continue;
            if (flags[tileId] & 0x10) isUpper = true;
            tiles.push({ dx: (cx - minX) * $gameMap.tileWidth(), dy: (cy - minY) * $gameMap.tileHeight(), tileId });
        }
        if (tiles.length === 0) return;
        const tileCols = maxX - minX + 1;
        const tileRows = maxY - minY + 1;
        const sprite = new Sprite_SwayingFoliage(minX, minY, tileCols, tileRows, tiles, bitmaps, isUpper);
        this._swaySprites.push(sprite);
        this._tilemap.addChild(sprite);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._swaySprites) {
            for (const sprite of this._swaySprites) {
                sprite.update();
            }
        }
    };
})();
