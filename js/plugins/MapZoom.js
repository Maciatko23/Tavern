//=============================================================================
// MapZoom.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Automatyczny zoom ekranu po wejściu na wybraną mapę (przez tag w notatce mapy). v1.2.0
 * @author Claude
 *
 * @param duration
 * @text Domyślny czas przejścia (klatki)
 * @desc 60 klatek = 1 sekunda. Używane, gdy tag nie podaje własnego czasu.
 * @type number
 * @min 0
 * @default 60
 *
 * @param crispPixels
 * @text Ostre piksele (bez wygładzania)
 * @desc Wyłącza rozmywanie kafelków i postaci przy przybliżeniu. Zalecane dla grafiki pikselowej.
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * MapZoom.js
 * ============================================================================
 * Ustawia przybliżenie/oddalenie ekranu automatycznie przy wejściu na mapę,
 * bez potrzeby ręcznego dodawania eventu "Ustaw zoom ekranu" na każdej mapie.
 *
 * JAK UŻYĆ:
 *   W polu Notatka (Note) danej mapy dodaj tag:
 *     <Zoom:skala>
 *   albo z własnym czasem przejścia w klatkach (60 = 1 sekunda):
 *     <Zoom:skala,czas>
 *   albo z własnym, STAŁYM punktem, wokół którego ekran się przybliża
 *   (piksele ekranu):
 *     <Zoom:skala,czas,x,y>
 *
 *   Bez podanego punktu (x,y) kamera podąża za graczem: gracz jest na
 *   środku ekranu, a widok nie wychodzi poza krawędzie mapy. Mapy mniejsze
 *   niż widoczny obszar (np. wnętrze domku) zostają wycentrowane.
 *
 *   Przykłady (w notatce mapy):
 *     <Zoom:1.5>              - przybliżenie x1.5, domyślny czas przejścia
 *     <Zoom:0.8,90>           - oddalenie do x0.8 w ciągu 90 klatek (1.5s)
 *     <Zoom:1.4,60,960,300>   - x1.4, 60 klatek, środek zoomu w (960,300)
 *
 *   Mapy BEZ tagu <Zoom:...> automatycznie wracają do normalnego widoku
 *   (x1.0), żeby zoom nie "przeciekał" z poprzedniej mapy.
 *
 * OSTROŚĆ OBRAZU:
 *   Domyślnie silnik wygładza (rozmywa) każdy obrazek przy skalowaniu, przez
 *   co przybliżona grafika pikselowa robi się "mydlana". Parametr "Ostre
 *   piksele" wyłącza to wygładzanie dla kafelków i postaci. Najczystszy
 *   obraz dają całkowite skale (x2.0); przy x1.5 obraz jest ostry, ale
 *   niektóre piksele są minimalnie szersze od sąsiednich.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "MapZoom";
    const params = PluginManager.parameters(pluginName);
    const DEFAULT_DURATION = Number(params.duration || 60);
    const CRISP_PIXELS = params.crispPixels !== "false";

    if (CRISP_PIXELS) {
        for (const loader of ["loadTileset", "loadCharacter"]) {
            const original = ImageManager[loader];
            ImageManager[loader] = function(filename) {
                const bitmap = original.call(this, filename);
                bitmap.smooth = false;
                return bitmap;
            };
        }
    }

    function parseZoomTag(note) {
        const m = /<Zoom:\s*([^>]+)>/i.exec(note || "");
        if (!m) return null;
        const parts = m[1].split(",").map(s => s.trim());
        const scale = Number(parts[0]);
        if (!isFinite(scale) || scale <= 0) return null;
        const duration = parts[1] !== undefined && parts[1] !== "" ? Number(parts[1]) : DEFAULT_DURATION;
        const hasX = parts[2] !== undefined && parts[2] !== "" && isFinite(Number(parts[2]));
        const hasY = parts[3] !== undefined && parts[3] !== "" && isFinite(Number(parts[3]));
        return {
            scale,
            duration: isFinite(duration) ? duration : DEFAULT_DURATION,
            x: hasX ? Number(parts[2]) : Graphics.width / 2,
            y: hasY ? Number(parts[3]) : Graphics.height / 2,
            // Without an explicit pivot the camera follows the player.
            followsPlayer: !hasX && !hasY
        };
    }

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        const zoom = parseZoomTag($dataMap.note);
        this._zoomFollowsPlayer = !!zoom && zoom.followsPlayer;
        if (zoom) {
            $gameScreen.startZoom(zoom.x, zoom.y, zoom.scale, zoom.duration);
        } else {
            $gameScreen.startZoom(Graphics.width / 2, Graphics.height / 2, 1, DEFAULT_DURATION);
        }
    };

    // The engine wipes the screen zoom every time the map scene ends (menu,
    // item screen, battle, save/load), while the tag zoom is otherwise only
    // applied on map entry. Put it back when the map scene starts again.
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        const zoom = parseZoomTag($dataMap.note);
        // No tag, or the entry animation is already running: nothing to restore.
        if (!zoom || $gameScreen._zoomDuration > 0) return;
        if (Math.abs($gameScreen.zoomScale() - zoom.scale) < 0.001) return;
        $gameScreen.setZoom(zoom.x, zoom.y, zoom.scale);
        $gameScreen._zoomScaleTarget = zoom.scale;
    };

    // Screen-space point (unzoomed) that should sit at the middle of the
    // screen: the player, kept inside the map so no empty border shows. If the
    // visible area is larger than the map on this axis, the map is centered.
    function zoomFocus(playerPos, mapStart, mapEnd, viewSize, scale, loops) {
        if (loops) return playerPos;
        const half = viewSize / (2 * scale);
        if (mapEnd - mapStart <= 2 * half) return (mapStart + mapEnd) / 2;
        return Math.min(Math.max(playerPos, mapStart + half), mapEnd - half);
    }

    Spriteset_Map.prototype.followPlayerWithZoom = function() {
        const scale = $gameScreen.zoomScale();
        if (Math.abs(scale - 1) < 0.001) return;
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        const px = $gamePlayer.scrolledX() * tw + tw / 2;
        const py = $gamePlayer.scrolledY() * th + th / 2;
        const fx = zoomFocus(px, $gameMap.adjustX(0) * tw, $gameMap.adjustX($gameMap.width()) * tw,
            Graphics.width, scale, $gameMap.isLoopHorizontal());
        const fy = zoomFocus(py, $gameMap.adjustY(0) * th, $gameMap.adjustY($gameMap.height()) * th,
            Graphics.height, scale, $gameMap.isLoopVertical());
        // Spriteset_Base maps a point p to scale*p - zoomX*(scale-1); solve
        // for the pivot that puts the focus point at the screen center.
        $gameScreen._zoomX = (scale * fx - Graphics.width / 2) / (scale - 1);
        $gameScreen._zoomY = (scale * fy - Graphics.height / 2) / (scale - 1);
    };

    const _Spriteset_Map_updatePosition = Spriteset_Map.prototype.updatePosition;
    Spriteset_Map.prototype.updatePosition = function() {
        if ($gameMap._zoomFollowsPlayer) {
            this.followPlayerWithZoom();
        }
        _Spriteset_Map_updatePosition.call(this);
    };
})();
