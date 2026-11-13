//=============================================================================
// MapaWyspy_Data.js  (GENEROWANE: tools/plansza/mapa_wyspy.py - plansza 3x3; nie edytuj ręcznie)
//=============================================================================
// The island's places for the P menu's "Mapa" tab (MapaWyspy.js): the board of nine maps (2026-11-08) - the places in their maps,
// the roads where the maps join, the shore of the board's land; the parked places, islets and the old forest are not on it.

/*:
 * @target MZ
 * @plugindesc Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. Plansza 3x3. v3.0.0
 * @author Claude
 * @help Same dane - czyta je MapaWyspy.js (ma stać pod tym plikiem na liście).
 * x, y - położenie na schemacie (0..1 szerokości i wysokości pudełka wyspy, y w dół); ASPEKT - stosunek szerokości do wysokości pudełka;
 * lab - strona etykiety (n/s/e/w); drogi - pary numerów map, między którymi jest przejście (droga na schemacie).
 */

(() => {
    "use strict";

    // the proportion of the island's box (the board is square)
    const ASPEKT = 1.0000;
    // the outdoor places: the map, its name, the place on the sketch, the names' places (at: the sketch, at6: the real map)
    const MIEJSCA = [
        { id: 162, nazwa: "Garnizon nad zatoką", x: 0.184, y: 0.184, at6: [0.188, 0.184, "l", 0], at: [0.184, 0.229, "c", 0], lab: "s" },
        { id: 24, nazwa: "Posiadłość Lorda", x: 0.500, y: 0.184, at6: [0.504, 0.184, "l", 0], at: [0.500, 0.229, "c", 0], lab: "s" },
        { id: 13, nazwa: "Góry i kamieniołom", x: 0.816, y: 0.184, at6: [0.820, 0.184, "l", 0], at: [0.816, 0.229, "c", 0], lab: "s" },
        { id: 111, nazwa: "Podgrodzie", x: 0.184, y: 0.500, at6: [0.188, 0.500, "l", 0], at: [0.184, 0.545, "c", 0], lab: "s" },
        { id: 8, nazwa: "Kruczogród", x: 0.500, y: 0.500, at6: [0.504, 0.500, "l", 0], at: [0.500, 0.545, "c", 0], lab: "s" },
        { id: 4, nazwa: "Łąka pod Gawrą", x: 0.816, y: 0.500, at6: [0.820, 0.500, "l", 0], at: [0.816, 0.545, "c", 0], lab: "s" },
        { id: 125, nazwa: "Przystań", x: 0.184, y: 0.816, at6: [0.188, 0.816, "l", 0], at: [0.184, 0.861, "c", 0], lab: "s" },
        { id: 3, nazwa: "Kruczy Jar", x: 0.500, y: 0.816, at6: [0.504, 0.816, "l", 0], at: [0.500, 0.861, "c", 0], lab: "s" },
        { id: 20, nazwa: "Dom dziadka", x: 0.816, y: 0.816, at6: [0.820, 0.816, "l", 0], at: [0.816, 0.861, "c", 0], lab: "s" }
    ];
    // the underground as one point (all its floors): under the castle hill, north of the town's middle
    const PODZIEMIA = { id: "podziemia", nazwa: "Podziemia", x: 0.405, y: 0.374, at6: [0.409, 0.374, "l", 0], at: [0.405, 0.334, "c", 0], lab: "n", wejscie: 8 };
    // the roads: the maps with an open crossing between them (both ways)
    const DROGI = [[3, 8], [3, 20], [3, 125], [4, 8], [4, 13], [4, 20], [8, 24], [8, 111], [13, 24], [24, 162], [111, 125], [111, 162], ["podziemia", 8]];
    // the island's shore on the sketch (0..1), drawn as a smooth shape; no islets on the board
    const BRZEG = [[0.062, 0.128], [0.059, 0.251], [0.075, 0.299], [0.086, 0.414], [0.057, 0.467], [0.067, 0.614], [0.038, 0.657], [0.041, 0.741], [0.054, 0.778], [0.054, 0.796], [0.038, 0.814], [0.038, 0.849], [0.046, 0.857], [0.101, 0.867], [0.157, 0.917], [0.225, 0.922], [0.246, 0.957], [0.280, 0.949], [0.301, 0.914], [0.488, 0.907], [0.580, 0.925], [0.633, 0.925], [0.728, 0.904], [0.843, 0.914], [0.878, 0.901], [0.899, 0.880], [0.917, 0.828], [0.907, 0.599], [0.925, 0.522], [0.909, 0.364], [0.920, 0.351], [0.946, 0.349], [0.959, 0.338], [0.959, 0.188], [0.886, 0.101], [0.822, 0.078], [0.791, 0.078], [0.743, 0.093], [0.630, 0.075], [0.430, 0.091], [0.270, 0.086], [0.136, 0.067], [0.099, 0.107]];
    const BRZEGI = [];
    const KORYTO = [];
    const LAS = [];
    // every other map -> the place it belongs to ("podziemia": a floor, the cellar's ruins, the cistern)
    const WNETRZA = {
        1: [8, "Tawerna"], 2: [3, "Domek - Wnętrze"], 9: [8, "Piwnica Tawerny"], 10: ["podziemia", "Ruiny Zamku"],
        11: ["podziemia", "Komnata Serca"], 14: [13, "Jaskinia"], 19: [20, "Dom dziadka"], 25: [8, "Pokoje gości"], 26: [8, "Apartamenty"],
        100: [3, "Chatka"], 102: [8, "Piekarnia"], 103: [8, "Kantor"], 104: [8, "Ratusz"], 105: [8, "Dom kowala"], 106: [8, "Dom garbarza"],
        107: [8, "Dom woziwody"], 108: [8, "Dzwonnica"], 109: [8, "Dom mieszczan"], 110: [8, "Izba pod skałą"], 112: [111, "Chata praczki"],
        113: [111, "Chata drwala"], 114: [111, "Chata kłusownika"], 115: [111, "Izba znachorki"], 116: [111, "Kram starzyzny"],
        117: [111, "Dom uchodźców"], 118: [8, "Dno studni"], 119: [8, "Archiwum zakonu"], 126: [125, "Chata Janka"],
        127: [125, "Szopa przy pochylni"], 128: [125, "Komora celna"], 154: [111, "Chata pod lasem"], 160: [125, "Izba latarnika"],
        161: [125, "Laterna"], 163: [162, "Kwatera rotmistrza"], 167: ["podziemia", "Stara cysterna zakonu"], 171: [8, "Piwnica kantoru"],
        172: [24, "Dwór - Hol"], 173: [24, "Dwór - Biblioteka"], 174: [24, "Dwór - Gabinet"], 177: [125, "Jaskinia przemytników"],
        178: [8, "Kaplica"], 179: [8, "Dom grabarza"], 180: [8, "Strażnica Lorda"], 181: [8, "Stajnia z wozownią"], 182: [8, "Dom przekupki"],
        183: [8, "Kamienica mieszczan"], 184: [8, "Dom szwaczki"], 185: [8, "Dom wdowy"], 186: [8, "Stary dom kupca"], 187: [8, "Dom cieśli"],
        188: [8, "Dom staruszków"], 189: [8, "Dom weterana"], 190: [8, "Izba do wynajęcia"], 193: [8, "Dom czeladnika piekarza"],
        194: [8, "Kamienica ze sklepikiem"], 195: [8, "Dom rybaka"], 196: [8, "Dom balwierza"], 197: [8, "Dom skryby"], 198: [8, "Dom kamieniarza"],
        201: [111, "Szynk"], 202: [111, "Przytułek"], 203: [111, "Garncarnia"], 204: [111, "Lepianka"], 205: [111, "Lepianka wdowy"],
        206: [111, "Chata węglarza"], 207: [111, "Chata tkaczki"], 208: [111, "Chata rybaka"], 209: [111, "Chata pod strzechą"],
        210: [111, "Chałupa z desek"], 211: [111, "Szopa"], 212: [111, "Komórka"],
        // (2026-11-11 questy_mapa) the pockets: Pustelnia + Urwisko (the gate on Przystań), Spalona zagroda (Podgrodzie)
        // (2026-11-11 osada_laka) the Silent's settlement stands on the east meadow of Laka pod Gawra (Map004; no map of its own any more); its four huts belong to it
        121: [3, "Wspólna izba"], 122: [3, "Chata tkaczki"], 123: [3, "Chata Najstarszego"], 124: [3, "Chata rzeźbiarza"],
        155: [125, "Pustelnia na klifie"], 156: [125, "Skryptorium"], 157: [125, "Urwisko Kruków"], 168: [111, "Spalona zagroda"], 169: [111, "Dom Ługów"],
        175: [13, "Orla Grań"], 213: [13, "Kopalnia"]
    };
    // the people of the story who are not TownLife residents: their place (the card's "Ludzie")
    const LUDZIE_FABULY = { 20: ["Dziadek Stach"], 24: ["Lord Zaleski"], 8: ["Borgar (tawerna)", "Melia", "Dziadek Ozzy", "Grum"] };

    // the board's box in the world's tiles (the places' x, y are on it), the maps that have their picture (img/mapa_wyspy/<id>.png, 4 px a tile)
    const SWIAT_BOX = [-10, -10, 380, 380];
    const MAPY_OBRAZY = [162, 24, 13, 111, 8, 4, 125, 3, 20];

    window.MapaWyspyData = { ASPEKT, MIEJSCA, PODZIEMIA, DROGI, BRZEG, BRZEGI, KORYTO, LAS, WNETRZA, LUDZIE_FABULY, SWIAT_BOX, MAPY_OBRAZY };
})();
