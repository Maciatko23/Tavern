//=============================================================================
// RegionLayers.js
//=============================================================================
// Three regions say, cell by cell, where a map's things stand against the hero (user 2026-10-04): 1 under him (always walkable),
// 2 level with him (always blocked), 3 over him (the buildings' autotiles and the B-E pictures drawn over him, walkable as the
// ground under them says). Cells without one of the three: the tileset's flags, as before.
// One hook in Game_Map.checkPassage, so everything that asks the map obeys it (the hero and FreeMovement.js, the dog, the animals'
// paths, the NPCs, the building placer, the minimap); one in Tilemap._addSpot/_addSpotTile for the drawing.
// Other plugins: T.api("RegionLayers") (also window.RegionLayers). Debug.js (F9) shows the painted cells in colour over the map.
// The first paint of the town (Map008): tools/town/paint_layers.py.

/*:
 * @target MZ
 * @plugindesc Warstwy z regionów: 1 = pod graczem, 2 = na równi (blokuje), 3 = nad graczem. v1.0.0
 * @author Claude
 *
 * @param below
 * @text Region „pod graczem”
 * @desc Na tym polu zawsze można stanąć, nawet gdy kafelek ma X. Rysowanie bez zmian. 0 = wyłączony.
 * @type number
 * @min 0
 * @max 255
 * @default 1
 *
 * @param level
 * @text Region „na równi z graczem”
 * @desc Tego pola nie da się przejść z żadnej strony (ściany, fasady, mury, posągi z kafelków). 0 = wyłączony.
 * @type number
 * @min 0
 * @max 255
 * @default 2
 *
 * @param above
 * @text Region „nad graczem”
 * @desc Dachy, ściany (A3, A4) i kafelki B-E na tym polu rysują się NAD bohaterem; grunt (A1, A2, A5) zostaje pod nim. 0 = wyłączony.
 * @type number
 * @min 0
 * @max 255
 * @default 3
 *
 * @help
 * ============================================================================
 * RegionLayers.js - warstwy z regionów
 * ============================================================================
 * Flagi tilesetu (O, X, gwiazdka) działają tak samo w każdym miejscu, gdzie
 * leży dany kafelek. Ten plugin pozwala to poprawić pole po polu, regionem:
 *
 *   1  POD GRACZEM   - na pole zawsze można wejść (mostek, schody, dywan
 *                      z flagą X). Rysowanie bez zmian.
 *   2  NA RÓWNI      - pola nie da się przejść z żadnej strony (fasady,
 *                      ściany, mury, arkady, posągi ułożone z kafelków).
 *                      Rysowanie bez zmian.
 *   3  NAD GRACZEM   - dachy i ściany (A3, A4) oraz kafelki B-E na tym polu
 *                      rysują się nad bohaterem, więc może przejść za nimi.
 *                      Grunt (A1 woda, A2 ziemia, A5) zostaje pod nim, żeby
 *                      go nie zasłonił. Wejść można, jeśli grunt pod spodem
 *                      jest przechodni (pole z samym dachem: zawsze).
 *   brak regionu    - flagi tilesetu, jak dotąd.
 *
 * JAK MALOWAĆ:
 *   W edytorze map w palecie kafelków wybierz zakładkę „R”, kliknij numer
 *   regionu i maluj ołówkiem albo prostokątem. Numery widać na mapie.
 *
 * UWAGA: region wygrywa z kafelkiem. Jeśli usuniesz budynek, zetrzyj też jego
 * region 2, a kiedy postawisz beczkę (kafelek z X) na polu z regionem 1, da się
 * po niej chodzić.
 *
 * Regiony 5, 6 i 7 są już zajęte (SwayingFoliage: kołysanie, Farming: pole
 * uprawne i zakaz uprawy). Jedno pole ma jeden region.
 *
 * Zdarzenia (drzewa, posągi, szyldy jako obrazki postaci) nie zmieniają się:
 * ich warstwę ustawia priorytet zdarzenia.
 *
 * F9 (Debug.js): „Warstwy z regionów: pokaż kolory” - zielone 1, czerwone 2,
 * niebieskie 3 na mapie.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const params = PluginManager.parameters("RegionLayers");
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const BELOW = num(params.below, 1), LEVEL = num(params.level, 2), ABOVE = num(params.above, 3);

    // the tiles region 3 lifts over the hero: the buildings' autotiles (A3 roofs and walls, A4 walls) and the B-E pictures;
    // the ground (A1 water, A2 ground, A5 floor) stays under him, or it would cover him
    const lifts = id => id > 0 && (id < Tilemap.TILE_ID_A5 || Tilemap.isTileA3(id) || Tilemap.isTileA4(id));

    function regionAt(map, x, y) {
        const r = map.isValid(x, y) ? map.regionId(x, y) : 0;
        return r > 0 && (r === BELOW || r === LEVEL || r === ABOVE) ? r : 0;
    }
    const kindOf = r => (r === BELOW ? "below" : r === LEVEL ? "level" : r === ABOVE ? "above" : null);

    // ------------------------------------------------------------------
    // Walking
    // ------------------------------------------------------------------
    // region 3: the engine's own rule, with the lifted tiles left out like star tiles; nothing but lifted ones: walkable
    function checkUnder(map, x, y, bit) {
        const flags = map.tilesetFlags();
        const tiles = map.tileEventsXy(x, y).map(e => e.tileId()).concat(map.layeredTiles(x, y).filter(t => !lifts(t)));
        for (const tile of tiles) {
            const flag = flags[tile];
            if ((flag & 0x10) !== 0) continue;
            if ((flag & bit) === 0) return true;
            if ((flag & bit) === bit) return false;
        }
        return true;
    }

    const _Game_Map_checkPassage = Game_Map.prototype.checkPassage;
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        const r = regionAt(this, x, y);
        if (r === LEVEL) return false;
        if (r === BELOW) return true;
        if (r === ABOVE) return checkUnder(this, x, y, bit);
        return _Game_Map_checkPassage.call(this, x, y, bit);
    };

    // ------------------------------------------------------------------
    // Drawing: a region 3 cell sends its lifted tiles to the tilemap's upper layer (over the characters)
    // ------------------------------------------------------------------
    const _Tilemap_addSpot = Tilemap.prototype._addSpot;
    Tilemap.prototype._addSpot = function(startX, startY, x, y) {
        this._liftSpot = ABOVE > 0 && this._readMapData(startX + x, startY + y, 5) === ABOVE;
        _Tilemap_addSpot.call(this, startX, startY, x, y);
        this._liftSpot = false;
    };
    const _Tilemap_addSpotTile = Tilemap.prototype._addSpotTile;
    Tilemap.prototype._addSpotTile = function(tileId, dx, dy) {
        if (this._liftSpot && lifts(tileId)) this._addTile(this._upperLayer, tileId, dx, dy);
        else _Tilemap_addSpotTile.call(this, tileId, dx, dy);
    };

    // ------------------------------------------------------------------
    // The colours over the map (F9): one pixel a cell, scaled up to the tiles
    // ------------------------------------------------------------------
    const COLOURS = { below: "rgba(70,230,90,0.45)", level: "rgba(240,50,50,0.45)", above: "rgba(70,130,255,0.5)" };
    const api = {
        BELOW, LEVEL, ABOVE,
        overlay: false,
        // "below" / "level" / "above" for a painted cell, null for the tileset's own rule
        kindAt: (x, y) => kindOf(regionAt($gameMap, x, y)),
        lifts
    };

    function paintOverlay(bitmap) {
        bitmap.clear();
        const W = $gameMap.width(), H = $gameMap.height();
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const k = kindOf(regionAt($gameMap, x, y));
                if (k) bitmap.fillRect(x, y, 1, 1, COLOURS[k]);
            }
        }
    }

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._layersOverlay = new Sprite();
        this._layersOverlay.visible = false;
        this._baseSprite.addChild(this._layersOverlay);
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        const s = this._layersOverlay;
        if (!s) return;
        s.visible = api.overlay;
        if (!api.overlay) return;
        if (!s.bitmap || s._mapId !== $gameMap.mapId()) {
            s.bitmap = new Bitmap($gameMap.width(), $gameMap.height());
            s.bitmap.smooth = false;
            paintOverlay(s.bitmap);
            s._mapId = $gameMap.mapId();
        }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        s.scale.set(tw, th);
        s.x = Math.round(-$gameMap.displayX() * tw);
        s.y = Math.round(-$gameMap.displayY() * th);
    };

    window.RegionLayers = T ? T.register("RegionLayers", api) : api;
})();
