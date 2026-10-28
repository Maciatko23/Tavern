//=============================================================================
// MapaWyspy_Data.js
//=============================================================================
// The island's places for the P menu's "Mapa" tab (MapaWyspy.js): where each outdoor map lies on the sketch, which roads join them,
// and which interior belongs to which place. The layout follows the Atlas of Krucza Wyspa (docs/miejsca_wyspy/polozenie.png: the
// hermitage north-west, the lighthouse on the north-east cape, the garrison and the wreck by the western shallows, the town in the
// middle under the castle hill); the roads are the real transfers between the maps (data/Map*.json edge events, the ones Wyspa.js,
// Orzel.js and Homes.js put in). Change x / y to move a place on the sketch (0..1 of the island's box, y down).

/*:
 * @target MZ
 * @plugindesc Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. v1.0.0
 * @author Claude
 * @help Same dane - czyta je MapaWyspy.js (ma stać pod tym plikiem na liście).
 * x, y - położenie na schemacie (0..1 szerokości i wysokości wyspy, y w dół).
 * drogi - pary numerów map, między którymi jest przejście (droga na schemacie).
 */

(() => {
    "use strict";

    // the outdoor places: the map, its name (the map's display name), the place on the sketch
    const MIEJSCA = [
        { id: 8, nazwa: "Okolice Tawerny", x: 0.482, y: 0.335 },
        { id: 24, nazwa: "Posiadłość Lorda", x: 0.650, y: 0.330 },
        { id: 111, nazwa: "Podgrodzie", x: 0.300, y: 0.400 },
        { id: 125, nazwa: "Przystań", x: 0.150, y: 0.520 },
        { id: 22, nazwa: "Polna droga", x: 0.482, y: 0.520 },
        { id: 20, nazwa: "Dom dziadka", x: 0.635, y: 0.470 },
        { id: 21, nazwa: "Leśna droga", x: 0.611, y: 0.590 },
        { id: 13, nazwa: "Góry i kamieniołom", x: 0.775, y: 0.560 },
        { id: 120, nazwa: "Osada Milczących", x: 0.790, y: 0.400 },
        { id: 175, nazwa: "Orla Grań", x: 0.900, y: 0.480 },
        { id: 23, nazwa: "Skraj lasu", x: 0.482, y: 0.690 },
        { id: 168, nazwa: "Spalona zagroda", x: 0.520, y: 0.860 },
        { id: 3, nazwa: "Kruczy Jar", x: 0.340, y: 0.720 },
        { id: 4, nazwa: "Łąka", x: 0.340, y: 0.590 },
        { id: 17, nazwa: "Omszała łąka", x: 0.340, y: 0.860 },
        { id: 18, nazwa: "Łąka menhirów", x: 0.215, y: 0.760 },
        { id: 162, nazwa: "Garnizon nad zatoką", x: 0.130, y: 0.650 },
        { id: 165, nazwa: "Wrak na mieliźnie", x: 0.045, y: 0.740 },
        { id: 155, nazwa: "Pustelnia na klifie", x: 0.270, y: 0.210 },
        { id: 157, nazwa: "Urwisko Kruków", x: 0.520, y: 0.150 },
        { id: 159, nazwa: "Przylądek z latarnią", x: 0.830, y: 0.185 }
    ];
    // the underground as one point (all its floors): under the castle hill, north of the town
    const PODZIEMIA = { id: "podziemia", nazwa: "Podziemia", x: 0.482, y: 0.215, wejscie: 8 };
    // the roads: a transfer between two maps (both ways)
    const DROGI = [
        [8, 22], [8, 24], [8, 111], [111, 125], [22, 21], [22, 23], [21, 20], [21, 13], [13, 120], [13, 159], [13, 175],
        [23, 3], [23, 168], [3, 4], [3, 17], [3, 18], [125, 155], [155, 157], [157, 159], [125, 162], [162, 165], ["podziemia", 8]
    ];
    // the island's shore on the sketch (0..1), drawn as a smooth shape
    const BRZEG = [[0.20, 0.13], [0.33, 0.07], [0.50, 0.08], [0.66, 0.09], [0.82, 0.11], [0.93, 0.17], [0.99, 0.30], [0.985, 0.45], [0.96, 0.60],
        [0.90, 0.73], [0.80, 0.85], [0.65, 0.93], [0.48, 0.96], [0.32, 0.94], [0.19, 0.86], [0.08, 0.76], [0.02, 0.62], [0.045, 0.47], [0.09, 0.33], [0.13, 0.21]];
    // every other map -> the place it belongs to ("podziemia": a floor, the cellar's ruins, the cistern); made from the maps' transfers,
    // the name is the map's display name (the card of a place lists its interiors by these)
    const WNETRZA = {
        1: [8, "Tawerna"], 2: [3, "Domek - Wnętrze"], 9: [8, "Piwnica Tawerny"], 10: ["podziemia", "Ruiny Zamku"], 11: ["podziemia", "Komnata Serca"],
        14: [13, "Jaskinia"], 19: [20, "Dom dziadka"], 25: [8, "Pokoje gości"], 26: [8, "Apartamenty"], 100: [3, "Chatka"],
        102: [8, "Piekarnia"], 103: [8, "Kantor"], 104: [8, "Ratusz"], 105: [8, "Dom kowala"], 106: [8, "Dom garbarza"], 107: [8, "Dom woziwody"],
        108: [8, "Dzwonnica"], 109: [8, "Dom mieszczan"], 110: [8, "Izba pod skałą"], 112: [111, "Chata praczki"], 113: [111, "Chata drwala"],
        114: [111, "Chata kłusownika"], 115: [111, "Izba znachorki"], 116: [111, "Kram starzyzny"], 117: [111, "Dom uchodźców"], 118: [8, "Dno studni"],
        119: [8, "Archiwum zakonu"], 121: [120, "Wspólna izba"], 122: [120, "Chata tkaczki"], 123: [120, "Chata Najstarszego"], 124: [120, "Chata rzeźbiarza"],
        126: [125, "Chata Janka"], 127: [125, "Szopa przy pochylni"], 128: [125, "Komora celna"], 154: [111, "Chata pod lasem"], 156: [155, "Skryptorium"],
        160: [159, "Izba latarnika"], 161: [159, "Laterna"], 163: [162, "Kwatera rotmistrza"], 166: [165, "Wrak - pod pokładem"], 167: ["podziemia", "Stara cysterna zakonu"],
        169: [168, "Dom Ługów"], 171: [8, "Piwnica kantoru"], 172: [24, "Dwór - Hol"], 173: [24, "Dwór - Biblioteka"], 174: [24, "Dwór - Gabinet"],
        176: [18, "Komora pod menhirami"], 177: [125, "Jaskinia przemytników"], 178: [8, "Kaplica"], 179: [8, "Dom grabarza"], 180: [8, "Strażnica Lorda"],
        181: [8, "Stajnia z wozownią"], 182: [8, "Dom przekupki"], 183: [8, "Kamienica mieszczan"], 184: [8, "Dom szwaczki"], 185: [8, "Dom wdowy"],
        186: [8, "Stary dom kupca"], 187: [8, "Dom cieśli"], 188: [8, "Dom staruszków"], 189: [8, "Dom weterana"], 190: [8, "Izba do wynajęcia"],
        193: [8, "Dom czeladnika piekarza"], 194: [8, "Kamienica ze sklepikiem"], 195: [8, "Dom rybaka"], 196: [8, "Dom balwierza"], 197: [8, "Dom skryby"],
        198: [8, "Dom kamieniarza"], 201: [111, "Szynk"], 202: [111, "Przytułek"], 203: [111, "Garncarnia"], 204: [111, "Lepianka"], 205: [111, "Lepianka wdowy"],
        206: [111, "Chata węglarza"], 207: [111, "Chata tkaczki"], 208: [111, "Chata rybaka"], 209: [111, "Chata pod strzechą"], 210: [111, "Chałupa z desek"],
        211: [111, "Szopa"], 212: [111, "Komórka"]
    };
    // the people of the story who are not TownLife residents: their place (the card's "Ludzie")
    const LUDZIE_FABULY = { 20: ["Dziadek Stach"], 24: ["Lord Zaleski"], 8: ["Borgar (tawerna)", "Melia", "Dziadek Ozzy", "Grum"] };

    window.MapaWyspyData = { MIEJSCA, PODZIEMIA, DROGI, BRZEG, WNETRZA, LUDZIE_FABULY };
})();
