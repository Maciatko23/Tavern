//=============================================================================
// Ziemia_Ozdoby.js
//=============================================================================
// (2026-10-30) Part 4 of the trial of a prettier map (Ziemia.js): small groups of things on Kruczy Jar (Map003) laid as events (ids
// 3100-3139, Tawerna.inject; the map file is not touched): details in groups, none alone and none repeated. The things that stand
// (a chest, a bucket, a sack, a stump) block their one cell; flowers, stones and brushwood are walked over. All of them stand off the
// paths and off the ground the farm is built on in the middle of the plot (the strip by the south wall, the path's edge, the forest's
// edge). Switched by Ziemia.on("decor") (the map is read again for the change).

/*:
 * @target MZ
 * @plugindesc Ozdoby Kruczego Jaru (próba ładniejszej mapy): grupy przedmiotów przy murze, ścieżce i skraju lasu, jako zdarzenia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Ziemia
 * @orderAfter Okolice
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Ziemia_Ozdoby.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Ziemia";
    // [id, image, x, y, blocks, name]
    const GROUPS = [
        // by the south wall of the plot: a chest, a sack and a bucket in a row, pebbles beside
        [3100, "!$Zi_Skrzynka", 14, 26, true, "Skrzynka z narzędziami"],
        [3101, "!$Zi_Worek", 15, 26, true, "Worek przy murze"],
        [3102, "!$Zi_Wiadro", 16, 26, true, "Wiadro przy murze"],
        [3103, "!$Zi_Kamienie", 13, 26, false, "Kamienie przy murze"],
        [3104, "!$Zi_Lawka", 18, 26, true, "Ławka przy murze"],
        // by the path: flax and yarrow in a drift, a pebble in the path's edge, a blue flower bush
        [3110, "!$Zi_Len", 20, 22, false, "Len przy ścieżce"],
        [3111, "!$Zi_Len", 21, 23, false, "Len przy ścieżce"],
        [3112, "!$Zi_Krwawnik", 22, 22, false, "Krwawnik przy ścieżce"],
        [3113, "!$Zi_Kamien", 15, 23, false, "Kamień przy ścieżce"],
        [3114, "!$Bush_Flower_Blue", 21, 21, false, "Niebieskie kwiaty"],
        // the forest's edge: a stump, brushwood and herbs
        [3120, "!$Stump_Tall", 5, 15, true, "Pień przy lesie"],
        [3121, "!$Zi_Galaz", 3, 14, false, "Chrust"],
        [3122, "!$Zi_Galaz2", 7, 14, false, "Chrust"],
        [3123, "!$Zi_Ziele", 4, 15, false, "Ziele na skraju lasu"],
        [3124, "!$Zi_Kamien", 8, 15, false, "Kamień na skraju lasu"]
    ];
    function build(data) {
        const OK = T.api("Okolice");
        if (!OK || !OK.page || !OK.event) return [];
        const taken = new Set((data.events || []).filter(Boolean).map(e => e.x + "," + e.y));
        const out = [];
        for (const [id, image, x, y, blocks, name] of GROUPS) {
            if (taken.has(x + "," + y)) continue;   // (the map was edited: nothing laid on a thing)
            out.push(OK.event(id, name, x, y, [OK.page({ image: { characterName: image, direction: 2, pattern: 1, characterIndex: 0 }, priority: blocks ? 1 : 0, through: !blocks, directionFix: true })], "<Ziemia:ozdoba>"));
        }
        return out;
    }
    T.inject(3, { ids: [3100, 3139], owner: PLUGIN, when: () => !!(window.Ziemia && Ziemia.on("decor")), build });
})();
