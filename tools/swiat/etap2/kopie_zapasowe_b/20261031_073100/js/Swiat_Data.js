//=============================================================================
// Swiat_Data.js  (GENEROWANE: tools/mapy/swiat_do_gry.py ze swiat.json - nie edytuj ręcznie)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Świat w kratkach: położenia map (x0, y0, szer., wys.) i przejścia danych; czyta je Krawedzie.js. Wyłączone, dopóki dane map nie są zainstalowane. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Tylko dane (window.SwiatData). Kratka świata = początek mapy + kratka lokalna. enabled=false: przejścia na krawędziach
 * liczone po staremu (Krawedzie.js). links: otwarte przejścia danych {a, side, from, to, b} - kratki ŚWIATA wzdłuż krawędzi
 * mapy a (x dla N/S, y dla E/W), bez zdarzeń w mapie.
 */
(() => {
    "use strict";
    window.SwiatData = {
        enabled: true,
        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata
        maps: {"8": [420, 216, 104, 138], "125": [420, 354, 132, 80], "21": [440, 434, 100, 80], "111": [318, 249, 102, 112], "13": [404, 120, 120, 96], "22": [524, 192, 85, 60], "914": [360, 434, 80, 80], "917": [298, 361, 120, 60], "920": [540, 434, 60, 40], "922": [552, 394, 60, 40], "923": [624, 376, 60, 40], "3": [604, 252, 80, 60], "4": [609, 192, 80, 60], "20": [604, 312, 80, 64], "23": [684, 252, 80, 60], "24": [524, 252, 80, 60], "900": [689, 192, 75, 60], "901": [524, 312, 80, 42]},
        links: [
            {"a": 8, "side": "N", "from": 444, "to": 446, "b": 13},
            {"a": 8, "side": "S", "from": 453, "to": 455, "b": 125},
            {"a": 8, "side": "E", "from": 233, "to": 235, "b": 22},
            {"a": 125, "b": 21, "side": "S", "from": 450, "to": 452},
            {"a": 914, "b": 21, "side": "E", "from": 473, "to": 475},
            {"a": 111, "b": 917, "side": "S", "from": 367, "to": 369},
            {"a": 21, "b": 920, "side": "E", "from": 444, "to": 446},
            {"a": 125, "b": 922, "side": "E", "from": 421, "to": 423},
            {"a": 3, "b": 20, "side": "S", "from": 612, "to": 614},
            {"a": 24, "b": 3, "side": "E", "from": 266, "to": 268},
            {"a": 23, "b": 17, "side": "S", "from": 723, "to": 725},
            {"a": 23, "b": 900, "side": "N", "from": 707, "to": 709},
            {"a": 4, "b": 900, "side": "E", "from": 228, "to": 230},
            {"a": 24, "b": 901, "side": "S", "from": 563, "to": 565},
            {"a": 20, "b": 923, "side": "S", "from": 675, "to": 677},
            {"a": 13, "side": "S", "from": 444, "to": 446, "b": 8},
            {"a": 125, "side": "N", "from": 453, "to": 455, "b": 8},
            {"a": 22, "side": "W", "from": 233, "to": 235, "b": 8},
            {"a": 21, "side": "N", "from": 450, "to": 452, "b": 125},
            {"a": 21, "side": "W", "from": 473, "to": 475, "b": 914},
            {"a": 917, "side": "N", "from": 367, "to": 369, "b": 111},
            {"a": 920, "side": "W", "from": 444, "to": 446, "b": 21},
            {"a": 922, "side": "W", "from": 421, "to": 423, "b": 125},
            {"a": 20, "side": "N", "from": 612, "to": 614, "b": 3},
            {"a": 3, "side": "W", "from": 266, "to": 268, "b": 24},
            {"a": 17, "side": "N", "from": 723, "to": 725, "b": 23},
            {"a": 900, "side": "S", "from": 707, "to": 709, "b": 23},
            {"a": 900, "side": "W", "from": 228, "to": 230, "b": 4},
            {"a": 901, "side": "N", "from": 563, "to": 565, "b": 24},
            {"a": 923, "side": "N", "from": 675, "to": 677, "b": 20}
        ],
        // mapy świata jeszcze nieprzebudowane (etapy 2-3): Krawedzie.js zostawia tam przejścia po staremu
        later: {"175": [404, 60, 156, 60], "18": [46, 225, 90, 76], "165": [126, 305, 80, 60], "162": [206, 260, 112, 100], "155": [186, 146, 96, 114], "157": [282, 144, 122, 72], "120": [524, 124, 96, 68], "17": [684, 312, 80, 96], "159": [620, 112, 104, 80], "168": [764, 208, 130, 108], "930": [278, 64, 120, 80], "910": [66, 145, 120, 80], "931": [388, 0, 120, 60], "912": [764, 148, 120, 60], "932": [764, 316, 80, 80], "933": [178, 104, 100, 40], "934": [560, 84, 60, 40], "918": [6, 185, 60, 40], "935": [328, 24, 60, 40], "919": [136, 265, 60, 40], "936": [724, 108, 60, 40]}
    };
})();
