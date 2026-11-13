//=============================================================================
// Klimat_Ziemia.js
//=============================================================================
// Kruczogród's ground and walls with some life (gracz 2026-11-09: „wszystko co się da i doda klimatu”): worn and dirty cobbles, the
// trodden middle of the streets, moss in the joints, mud by the gates and the yards, a soft contact shade where walls, fences and
// things meet the ground, wheel ruts and hoof prints, straw in the stable yard, damp streaks and moss at the walls' feet, soot round the
// chimneys, cracks in the town wall, ivy on a few walls; autumn leaves under the leafy trees, spring petals in the orchard.
// All of it READY pictures baked by tools/klimat/ziemia_miasta.py from the map's own tiles and events (img/klimat/Map008/z_*.png, chunks
// of 12 x 12 cells; z_*_p<season>.png only where a season adds something): this file only puts the chunks round the screen into the
// tilemap - over the ground tiles, under everything standing (z 0.3) - and drops the far ones. After the map is edited: run the tool
// again (it rewrites the CHUNKS line below).

/*:
 * @target MZ
 * @plugindesc Klimat podłoża i murów Kruczogrodu: zużyty bruk, błoto, cień przy ścianach i rzeczach, koleiny, słoma, zacieki, sadza, bluszcz, liście jesienią (gotowe obrazki). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Klimat_Miasta
 *
 * @help
 * Obrazki robi tools/klimat/ziemia_miasta.py (po zmianach mapy w edytorze uruchomić znowu). Bez ustawień.
 * window.KLIMAT_ZIEMIA = { off: true } przed wczytaniem strony wyłącza (testy, porównania).
 * API: KlimatZiemia.info() - kawałki na mapie i na ekranie.
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Klimat_Ziemia.js: brak TawernaCore.js");
    const OFF = !!(window.KLIMAT_ZIEMIA && window.KLIMAT_ZIEMIA.off);
    // (written by tools/klimat/ziemia_miasta.py) map -> { size: cells per chunk side, base: [cy * 100 + cx], season: { 0..3: [...] } }
    const CHUNKS = { 8: { size: 12, base: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909], season: {"0": [1, 5, 6, 7, 8, 9, 100, 103, 708, 808, 809], "1": [1, 5, 6, 7, 8, 9, 100, 103, 708], "2": [1, 5, 6, 7, 8, 9, 100, 102, 103, 104, 105, 202, 203, 204, 205, 206, 300, 301, 302, 402, 505, 605, 701, 708, 801, 805, 806, 808, 809], "3": [1, 5, 6, 7, 8, 9, 100, 103, 708]} } };
    const Z = 0.3, KEEP = 1;          // (chunks one beyond the screen stay loaded; farther ones are dropped)
    const cfg = () => (OFF || !$gameMap ? null : CHUNKS[$gameMap.mapId()] || null);
    const season = () => (window.Farming && Farming.seasonIndex && $gameSystem && $gameSystem.dayNightDay ? Farming.seasonIndex($gameSystem.dayNightDay()) : 1);
    let set = null, live = new Map(), sets = null, mapId = 0;

    function url(cx, cy, s) { return "img/klimat/Map" + String(mapId).padStart(3, "0") + "/z_" + cx + "_" + cy + (s === null ? "" : "_p" + s) + ".png"; }
    function drop(key) {
        const c = live.get(key);
        if (!c) return;
        if (c.spr.parent) c.spr.parent.removeChild(c.spr);
        if (c.bmp) c.bmp.destroy();
        live.delete(key);
    }
    function dropAll() { for (const k of Array.from(live.keys())) drop(k); }

    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        dropAll(); set = null;
        const c = cfg();
        if (!c) return;
        set = this; mapId = $gameMap.mapId();
        sets = { base: new Set(c.base), season: {} };
        for (const k in c.season) sets.season[k] = new Set(c.season[k]);
    };
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.call(this);
        if (set !== this) return;
        const c = cfg();
        if (!c || $gameMap.mapId() !== mapId) { dropAll(); return; }
        try { frame(c); } catch (e) { if (!failed++) console.warn("[Klimat_Ziemia] " + (e && e.message)); }
    };
    let failed = 0;
    function frame(c) {
        const tm = set._tilemap, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), S = c.size;
        const vx0 = $gameMap.displayX(), vy0 = $gameMap.displayY(), vx1 = vx0 + Graphics.width / tw, vy1 = vy0 + Graphics.height / th;
        const cx0 = Math.floor(vx0 / S) - KEEP, cx1 = Math.floor(vx1 / S) + KEEP, cy0 = Math.floor(vy0 / S) - KEEP, cy1 = Math.floor(vy1 / S) + KEEP;
        const sx0 = Math.floor(vx0 / S), sx1 = Math.floor(vx1 / S), sy0 = Math.floor(vy0 / S), sy1 = Math.floor(vy1 / S);
        const se = String(season()), want = new Set();
        for (let cy = sy0; cy <= sy1; cy++) for (let cx = sx0; cx <= sx1; cx++) {
            const id = cy * 100 + cx;
            if (sets.base.has(id)) want.add(cx + "," + cy + ",");
            if (sets.season[se] && sets.season[se].has(id)) want.add(cx + "," + cy + "," + se);
        }
        for (const key of want) if (!live.has(key)) {
            const [cx, cy, s] = key.split(","), bmp = Bitmap.load(url(+cx, +cy, s === "" ? null : s)), spr = new Sprite(bmp);
            spr.z = s === "" ? Z : Z + 0.01; spr.update = function() {};
            tm.addChild(spr);
            live.set(key, { spr, bmp, cx: +cx, cy: +cy, s });
        }
        for (const [key, ch] of Array.from(live.entries())) {
            const far = ch.cx < cx0 || ch.cx > cx1 || ch.cy < cy0 || ch.cy > cy1 || (ch.s !== "" && ch.s !== se);
            if (far) { drop(key); continue; }
            if (ch.spr.parent !== tm) tm.addChild(ch.spr);
            ch.spr.x = Math.round($gameMap.adjustX(ch.cx * S) * tw);
            ch.spr.y = Math.round($gameMap.adjustY(ch.cy * S) * th);
            ch.spr.visible = want.has(key) || true;
        }
    }
    window.KlimatZiemia = {
        info: () => { const c = cfg(); return c ? { base: c.base.length, season: Object.fromEntries(Object.entries(c.season).map(([k, v]) => [k, v.length])), live: live.size,
            ready: Array.from(live.values()).filter(ch => ch.bmp && ch.bmp.isReady()).length } : null; }
    };
})();
