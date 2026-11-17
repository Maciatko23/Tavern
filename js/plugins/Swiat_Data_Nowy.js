//=============================================================================
// Swiat_Data_Nowy.js  (GENEROWANE: tools/nowy_swiat/swiat.py; nie edytuj ręcznie)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Nowy świat w układzie świata: 5 map w jednej linii (Wybrzeże, Podgrodzie, Miasteczko, Posiadłość, Góry) i przejścia krawędzią między nimi. v1.0.0
 * @author Claude
 * @base Swiat_Data
 * @orderAfter Swiat_Data
 *
 * @help
 * Tylko dane: dopisuje mapy i przejścia do window.SwiatData (Swiat_Data.js zostaje bez zmian). Po zmianach map 218-222 w edytorze:
 * python tools/nowy_swiat/swiat.py
 */
(() => {
    "use strict";
    const S = window.SwiatData;
    if (!S) return;
    Object.assign(S.maps, {"219": [0, 1000, 80, 80], "218": [80, 1000, 80, 80], "220": [160, 1000, 80, 80], "221": [240, 1000, 80, 80], "222": [320, 1000, 80, 80]});
    S.links = S.links.concat([{"a": 219, "side": "E", "from": 1007, "to": 1058, "b": 218}, {"a": 218, "side": "W", "from": 1007, "to": 1058, "b": 219}, {"a": 219, "side": "E", "from": 1061, "to": 1074, "b": 218}, {"a": 218, "side": "W", "from": 1061, "to": 1074, "b": 219}, {"a": 218, "side": "E", "from": 1036, "to": 1040, "b": 220}, {"a": 220, "side": "W", "from": 1036, "to": 1040, "b": 218}, {"a": 218, "side": "E", "from": 1049, "to": 1052, "b": 220}, {"a": 220, "side": "W", "from": 1049, "to": 1052, "b": 218}, {"a": 220, "side": "E", "from": 1039, "to": 1043, "b": 221}, {"a": 221, "side": "W", "from": 1039, "to": 1043, "b": 220}, {"a": 220, "side": "E", "from": 1049, "to": 1052, "b": 221}, {"a": 221, "side": "W", "from": 1049, "to": 1052, "b": 220}, {"a": 221, "side": "E", "from": 1007, "to": 1048, "b": 222}, {"a": 222, "side": "W", "from": 1007, "to": 1048, "b": 221}, {"a": 221, "side": "E", "from": 1053, "to": 1074, "b": 222}, {"a": 222, "side": "W", "from": 1053, "to": 1074, "b": 221}]);
})();
