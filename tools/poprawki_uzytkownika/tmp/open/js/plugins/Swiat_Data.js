//=============================================================================
// Swiat_Data.js  (GENEROWANE: tools/plansza/swiat.py - plansza 3x3; nie edytuj ręcznie)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Świat w kratkach: położenia map (x0, y0, szer., wys.) i przejścia danych; czyta je Krawedzie.js. Plansza 3x3. v2.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Tylko dane (window.SwiatData). Kratka świata = początek mapy + kratka lokalna. links: otwarte przejścia {a, side, from, to, b} -
 * kratki ŚWIATA wzdłuż krawędzi mapy a (x dla N/S, y dla E/W).
 */
(() => {
    "use strict";
    window.SwiatData = {
        enabled: true,
        // (2026-11-11 questy_mapa) maps that are not on the board but are part of the world: the three pockets (Osada Milczących, Pustelnia + Urwisko,
        // Spalona zagroda: each through one gate of a board map) and the mine with Orla Grań - no seams, no world position; the F9 pickers read it
        // (2026-11-11 user: "wywalamy to z mapy, na razie bez pustelni") 155, 156, 157 (Pustelnia, Skryptorium, Urwisko Krukow) are OUT again:
        // no gate on Przystan; bring them back with the gate there, these three numbers here and WyspaData.HERMITAGE_OPEN
        extra: [120, 121, 122, 123, 124, 168, 169, 175, 213],
        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata
        maps: {"162": [0, 0, 120, 120], "24": [120, 0, 120, 120], "13": [240, 0, 120, 120], "111": [0, 120, 120, 120], "8": [120, 120, 120, 120], "4": [240, 120, 120, 120], "125": [0, 240, 120, 120], "3": [120, 240, 120, 120], "20": [240, 240, 120, 120]},
        links: [
            {"a": 162, "side": "E", "from": 22, "to": 31, "b": 24},
            {"a": 24, "side": "W", "from": 22, "to": 31, "b": 162},
            {"a": 162, "side": "E", "from": 33, "to": 41, "b": 24},
            {"a": 24, "side": "W", "from": 33, "to": 41, "b": 162},
            {"a": 162, "side": "E", "from": 43, "to": 55, "b": 24},
            {"a": 24, "side": "W", "from": 43, "to": 55, "b": 162},
            {"a": 162, "side": "E", "from": 57, "to": 65, "b": 24},
            {"a": 24, "side": "W", "from": 57, "to": 65, "b": 162},
            {"a": 162, "side": "E", "from": 67, "to": 108, "b": 24},
            {"a": 24, "side": "W", "from": 67, "to": 108, "b": 162},
            {"a": 162, "side": "E", "from": 110, "to": 114, "b": 24},
            {"a": 24, "side": "W", "from": 110, "to": 114, "b": 162},
            {"a": 162, "side": "S", "from": 20, "to": 117, "b": 111},
            {"a": 111, "side": "N", "from": 20, "to": 117, "b": 162},
            {"a": 24, "side": "E", "from": 20, "to": 34, "b": 13},
            {"a": 13, "side": "W", "from": 20, "to": 34, "b": 24},
            {"a": 24, "side": "E", "from": 36, "to": 39, "b": 13},
            {"a": 13, "side": "W", "from": 36, "to": 39, "b": 24},
            {"a": 24, "side": "E", "from": 41, "to": 50, "b": 13},
            {"a": 13, "side": "W", "from": 41, "to": 50, "b": 24},
            {"a": 24, "side": "E", "from": 52, "to": 55, "b": 13},
            {"a": 13, "side": "W", "from": 52, "to": 55, "b": 24},
            {"a": 24, "side": "E", "from": 57, "to": 66, "b": 13},
            {"a": 13, "side": "W", "from": 57, "to": 66, "b": 24},
            {"a": 24, "side": "E", "from": 68, "to": 85, "b": 13},
            {"a": 13, "side": "W", "from": 68, "to": 85, "b": 24},
            {"a": 24, "side": "E", "from": 87, "to": 114, "b": 13},
            {"a": 13, "side": "W", "from": 87, "to": 114, "b": 24},
            {"a": 24, "side": "S", "from": 144, "to": 146, "b": 8},
            {"a": 8, "side": "N", "from": 144, "to": 146, "b": 24},
            {"a": 13, "side": "S", "from": 242, "to": 300, "b": 4},
            {"a": 4, "side": "N", "from": 242, "to": 300, "b": 13},
            {"a": 13, "side": "S", "from": 302, "to": 315, "b": 4},
            {"a": 4, "side": "N", "from": 302, "to": 315, "b": 13},
            {"a": 13, "side": "S", "from": 317, "to": 352, "b": 4},
            {"a": 4, "side": "N", "from": 317, "to": 352, "b": 13},
            {"a": 111, "side": "E", "from": 170, "to": 171, "b": 8},
            {"a": 8, "side": "W", "from": 170, "to": 171, "b": 111},
            {"a": 111, "side": "E", "from": 226, "to": 227, "b": 8},
            {"a": 8, "side": "W", "from": 226, "to": 227, "b": 111},
            {"a": 111, "side": "S", "from": 4, "to": 9, "b": 125},
            {"a": 125, "side": "N", "from": 4, "to": 9, "b": 111},
            {"a": 111, "side": "S", "from": 11, "to": 33, "b": 125},
            {"a": 125, "side": "N", "from": 11, "to": 33, "b": 111},
            {"a": 111, "side": "S", "from": 35, "to": 54, "b": 125},
            {"a": 125, "side": "N", "from": 35, "to": 54, "b": 111},
            {"a": 111, "side": "S", "from": 56, "to": 113, "b": 125},
            {"a": 125, "side": "N", "from": 56, "to": 113, "b": 111},
            {"a": 111, "side": "S", "from": 115, "to": 119, "b": 125},
            {"a": 125, "side": "N", "from": 115, "to": 119, "b": 111},
            {"a": 8, "side": "E", "from": 136, "to": 137, "b": 4},
            {"a": 4, "side": "W", "from": 136, "to": 137, "b": 8},
            {"a": 8, "side": "E", "from": 168, "to": 169, "b": 4},
            {"a": 4, "side": "W", "from": 168, "to": 169, "b": 8},
            {"a": 8, "side": "S", "from": 150, "to": 152, "b": 3},
            {"a": 3, "side": "N", "from": 150, "to": 152, "b": 8},
            {"a": 4, "side": "S", "from": 242, "to": 334, "b": 20},
            {"a": 20, "side": "N", "from": 242, "to": 334, "b": 4},
            {"a": 125, "side": "E", "from": 243, "to": 246, "b": 3},
            {"a": 3, "side": "W", "from": 243, "to": 246, "b": 125},
            {"a": 125, "side": "E", "from": 248, "to": 269, "b": 3},
            {"a": 3, "side": "W", "from": 248, "to": 269, "b": 125},
            {"a": 125, "side": "E", "from": 271, "to": 274, "b": 3},
            {"a": 3, "side": "W", "from": 271, "to": 274, "b": 125},
            {"a": 125, "side": "E", "from": 282, "to": 284, "b": 3},
            {"a": 3, "side": "W", "from": 282, "to": 284, "b": 125},
            {"a": 125, "side": "E", "from": 298, "to": 314, "b": 3},
            {"a": 3, "side": "W", "from": 298, "to": 314, "b": 125},
            {"a": 125, "side": "E", "from": 316, "to": 337, "b": 3},
            {"a": 3, "side": "W", "from": 316, "to": 337, "b": 125},
            {"a": 3, "side": "E", "from": 243, "to": 248, "b": 20},
            {"a": 20, "side": "W", "from": 243, "to": 248, "b": 3},
            {"a": 3, "side": "E", "from": 250, "to": 255, "b": 20},
            {"a": 20, "side": "W", "from": 250, "to": 255, "b": 3},
            {"a": 3, "side": "E", "from": 257, "to": 262, "b": 20},
            {"a": 20, "side": "W", "from": 257, "to": 262, "b": 3},
            {"a": 3, "side": "E", "from": 264, "to": 271, "b": 20},
            {"a": 20, "side": "W", "from": 264, "to": 271, "b": 3},
            {"a": 3, "side": "E", "from": 273, "to": 279, "b": 20},
            {"a": 20, "side": "W", "from": 273, "to": 279, "b": 3},
            {"a": 3, "side": "E", "from": 291, "to": 339, "b": 20},
            {"a": 20, "side": "W", "from": 291, "to": 339, "b": 3}
        ]
    };
    // (plansza 3x3, 2026-11-08) a save made before the board: on a map whose content moved (tools/plansza/plansza.py BOARD dx, dy) the
    // hero is put on the same spot of the new map and the map is read again (its events from the file, as when the editor changed it)
    const T = window.Tawerna;
    const SHIFT = {"162": [22, 24], "24": [20, 60], "13": [0, 24], "111": [18, 33]};
    if (T && T.state && T.on) {
        const st = () => T.state("plansza", { v: 0 }, { owner: "Swiat_Data" });
        T.on("newGame", () => { st().v = 1; });
        T.on("load", () => {
            const s = st();
            if (s.v >= 1) return;
            s.v = 1;
            const id = $gameMap.mapId(), d = SHIFT[id];
            if (!d) return;
            const nx = $gamePlayer.x + d[0], ny = $gamePlayer.y + d[1];
            $gamePlayer.locate(nx, ny);   // (Scene_Load's own reload after an editor save reads the hero's x, y: already the new ones)
            $gamePlayer.reserveTransfer(id, nx, ny, $gamePlayer.direction(), 0);
        });
    }
})();
