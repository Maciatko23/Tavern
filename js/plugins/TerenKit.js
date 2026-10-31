//=============================================================================
// TerenKit.js
//=============================================================================
// (2026-10-30) The ground-painting tools shared by CzerwonaWoda.js (the redrawn shore) and Ziemia.js (the soft borders of the ground
// kinds): value noise, box blur, the distance transform, bilinear sampling of a texel field, the map's own tileset pixels (the
// interior of an A2 autotile, a B-E tile, an A5 tile, the stone rim's border profile), the shared atlas bitmaps and the hash. Nothing
// here draws by itself and nothing here is a feature: no events, no sprites. The code was moved here as it was in CzerwonaWoda.js
// (the shore must look exactly as before; tests red_water, przystan, latarnia).

/*:
 * @target MZ
 * @plugindesc Wspólne narzędzia malowania gruntu (szum, rozmycie, pole odległości, piksele kafli mapy, atlasy) dla CzerwonaWoda i Ziemia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Część dla innych wtyczek: sama nic nie rysuje. Musi stać na liście wyżej niż CzerwonaWoda i Ziemia.
 * Dla wtyczek: T.api("TerenKit") -> { hash, vnoise, boxBlur, chamfer, sample, descOf, srcOf, profileOf, tileSheet, tileImage, a5Pixels,
 * rimStone, rimGrass, rimEarth, a5Grass, a5Earth, lerp, atlasSlot, flushAtlas, dropAtlas }.
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("TerenKit.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");

    function vnoise(x, y, sc, seed) {   // smooth value noise 0..1, one feature about sc px
        const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy);
        let ax = fx - ix, ay = fy - iy;
        ax = ax * ax * (3 - 2 * ax); ay = ay * ay * (3 - 2 * ay);
        const a = hash(ix, iy, seed, 1), b = hash(ix + 1, iy, seed, 1), c = hash(ix, iy + 1, seed, 1), d = hash(ix + 1, iy + 1, seed, 1);
        return (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay;
    }
    function boxBlur(a, w, h, r) {   // two passes of a box blur of radius r (clamped edges)
        const t = new Float32Array(w * h), n = 2 * r + 1;
        for (let pass = 0; pass < 2; pass++) {
            for (let y = 0; y < h; y++) {
                let s = 0; const o = y * w;
                for (let k = -r; k <= r; k++) s += a[o + Math.max(0, Math.min(w - 1, k))];
                for (let x = 0; x < w; x++) { t[o + x] = s / n; s += a[o + Math.min(w - 1, x + r + 1)] - a[o + Math.max(0, x - r)]; }
            }
            for (let x = 0; x < w; x++) {
                let s = 0;
                for (let k = -r; k <= r; k++) s += t[Math.max(0, Math.min(h - 1, k)) * w + x];
                for (let y = 0; y < h; y++) { a[y * w + x] = s / n; s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; }
            }
        }
    }
    function chamfer(src, w, h) {   // distance (x3) of every texel to the nearest texel with src = 1 (0 on them)
        const d = new Int32Array(w * h), INF = 1 << 28;
        for (let i = 0; i < w * h; i++) d[i] = src[i] ? 0 : INF;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = y * w + x; let v = d[i];
            if (x > 0 && d[i - 1] + 3 < v) v = d[i - 1] + 3;
            if (y > 0) {
                if (d[i - w] + 3 < v) v = d[i - w] + 3;
                if (x > 0 && d[i - w - 1] + 4 < v) v = d[i - w - 1] + 4;
                if (x < w - 1 && d[i - w + 1] + 4 < v) v = d[i - w + 1] + 4;
            }
            d[i] = v;
        }
        for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
            const i = y * w + x; let v = d[i];
            if (x < w - 1 && d[i + 1] + 3 < v) v = d[i + 1] + 3;
            if (y < h - 1) {
                if (d[i + w] + 3 < v) v = d[i + w] + 3;
                if (x < w - 1 && d[i + w + 1] + 4 < v) v = d[i + w + 1] + 4;
                if (x > 0 && d[i + w - 1] + 4 < v) v = d[i + w - 1] + 4;
            }
            d[i] = v;
        }
        return d;
    }

    function descOf(id) {
        let bx, by, sheet;
        if (id >= 2048 && id < 2816) {
            if (!Tilemap.isWaterTile(id)) return null;
            const kind = ((id - 2048) / 48) | 0, tx = kind % 8, ty = (kind / 8) | 0;
            sheet = 0;
            if (kind === 0) { bx = 0; by = 0; } else if (kind === 1) { bx = 0; by = 3; }
            else if (kind % 2 === 1) return null;
            else { bx = ((tx / 4) | 0) * 8; by = ty * 6 + (((tx / 2) | 0) % 2) * 3; }
        } else if (id >= 2816 && id < 4352) {
            const kind = ((id - 2048) / 48) | 0, tx = kind % 8, ty = (kind / 8) | 0;
            sheet = 1; bx = tx * 2; by = (ty - 2) * 3;
        } else return null;
        const q = [[2, 4], [1, 4], [2, 3], [1, 3]];   // (the autotile table's shape 0: the middle of the block)
        return { sheet, bx, by, key: "a" + sheet + "_" + bx + "_" + by, quads: q.map((c, i) => [(bx * 2 + c[0]) * 24, (by * 2 + c[1]) * 24, 24, 24, (i % 2) * 24, ((i / 2) | 0) * 24]) };
    }
    const tileSheet = n => ImageManager.loadTileset(($gameMap.tileset().tilesetNames || [])[n] || "");
    const srcCache = {};
    function srcOf(d) {   // 48 x 48 RGBA pixels of the interior tile; null while the sheet loads
        const names = $gameMap.tileset().tilesetNames || [], k = names[d.sheet] + ":" + d.key;
        if (srcCache[k]) return srcCache[k];
        const bm = tileSheet(d.sheet);
        if (!bm || !bm.isReady()) return null;
        const c = document.createElement("canvas"); c.width = 48; c.height = 48;
        const cx = c.getContext("2d"), cv = bm.canvas || bm._canvas;
        for (const q of d.quads) cx.drawImage(cv, q[0], q[1], q[2], q[3], q[4], q[5], q[2], q[3]);
        return (srcCache[k] = cx.getImageData(0, 0, 48, 48).data);
    }
    function profileOf(sheetNo, x0, y0, w, h, depthMax, rightEdge, key) {   // the average colour by depth of an edge strip
        const k = "pf" + key;
        if (srcCache[k]) return srcCache[k];
        const bm = tileSheet(sheetNo);
        if (!bm || !bm.isReady()) return null;
        const img = bm.context.getImageData(x0, y0, w, h).data, out = [];
        for (let dpt = 0; dpt < depthMax; dpt++) {
            let r = 0, gg = 0, b = 0, n = 0;
            for (let y = (rightEdge ? 36 : 0); y < (rightEdge ? 108 : h); y++) { const p = (y * w + (w - 1 - dpt)) * 4; if (img[p + 3] > 200) { r += img[p]; gg += img[p + 1]; b += img[p + 2]; n++; } }
            out.push(n ? [r / n, gg / n, b / n] : null);
        }
        let last = null;
        for (let i = depthMax - 1; i >= 0; i--) { if (out[i]) last = out[i]; else out[i] = last; }
        let last2 = last || [90, 110, 100];
        for (let i = 0; i < depthMax; i++) { if (out[i]) last2 = out[i]; else out[i] = last2; }
        return (srcCache[k] = out);
    }

    const a5Cache = {};
    function a5Pixels(id) {
        const name = ($gameMap.tileset().tilesetNames || [])[4] || "", k = name + ":" + id;
        if (a5Cache[k]) return a5Cache[k];
        const bm = tileSheet(4);
        if (!bm || !bm.isReady()) return null;
        const n = id - 1536;
        return (a5Cache[k] = bm.context.getImageData((n % 8) * 48, Math.floor(n / 8) * 48, 48, 48).data);
    }

    // a stone of a rim's border, not its grass (green above red and blue) or its earth (warm brown)
    const rimStone = (R, q, earth) => R[q + 3] >= 128 && (earth ? R[q] - R[q + 2] < 22 : R[q + 1] - Math.max(R[q], R[q + 2]) < 20);

    const tileCache = {};
    function tileImage(id) {
        if (tileCache[id]) return tileCache[id];
        const bm = tileSheet(5 + Math.floor(id / 256));
        if (!bm || !bm.isReady()) return null;
        const sx = ((Math.floor(id / 128) % 2) * 8 + id % 8) * 48, sy = (Math.floor((id % 256) / 8) % 16) * 48;
        return (tileCache[id] = bm.context.getImageData(sx, sy, 48, 48).data);
    }
    const lerp = (a, b, t) => a + (b - a) * t;

    function atlasSlot(g, name, slot, size) {
        const a = g.atlas || (g.atlas = {}), list = a[name] || (a[name] = []), per = Math.floor(size / slot);
        let cur = list[list.length - 1];
        if (!cur || cur.n >= per * per) { cur = { bm: new Bitmap(size, size), n: 0, per, dirty: false }; list.push(cur); }
        const i = cur.n++;
        cur.dirty = true;
        return { at: cur, sx: (i % per) * slot, sy: Math.floor(i / per) * slot };
    }
    function flushAtlas(g) {
        if (!g.atlas) return;
        for (const k in g.atlas) for (const at of g.atlas[k]) if (at.dirty) { at.dirty = false; if (at.bm._baseTexture && at.bm._baseTexture.update) at.bm._baseTexture.update(); }
    }

    function hash(a, b, c, d) {
        let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2246822519) ^ Math.imul(d | 0, 3266489917);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    // the A5 sheet of the coast's maps (Fantasy_Outside_A5_green, tilesets 9 and 11): the grass terrace with its stone rim (columns 0-2
    // of rows 1624-1640), the earth terrace with its rim (columns 5-7), the plain grass and plain earth squares (rows 1608-1616, columns
    // 4-5 and 6-7) - the rims shut the sides of their drop
    const rimGrass = id => id >= 1624 && id <= 1642 && (id % 8) <= 2, rimEarth = id => id >= 1629 && id <= 1647 && (id % 8) >= 5;
    const a5Grass = id => id === 1612 || id === 1613 || id === 1620 || id === 1621, a5Earth = id => id === 1614 || id === 1615 || id === 1622 || id === 1623;

    // bilinear sample of a texel field s (TW x TH texels, q px a texel, the texel's middle at (i + 0.5) * q) at the map pixel (px, py)
    function sample(s, TW, TH, q, px, py) {
        const u = px / q - 0.5, v = py / q - 0.5, ix = Math.floor(u), iy = Math.floor(v), fx = u - ix, fy = v - iy;
        const x0 = Math.max(0, Math.min(TW - 1, ix)), x1 = Math.max(0, Math.min(TW - 1, ix + 1)), y0 = Math.max(0, Math.min(TH - 1, iy)), y1 = Math.max(0, Math.min(TH - 1, iy + 1));
        return (s[y0 * TW + x0] * (1 - fx) + s[y0 * TW + x1] * fx) * (1 - fy) + (s[y1 * TW + x0] * (1 - fx) + s[y1 * TW + x1] * fx) * fy;
    }
    // free the atlas bitmaps of a geometry object (g.atlas: name -> list of { bm })
    function dropAtlas(g) {
        for (const k in g.atlas || {}) for (const at of g.atlas[k]) at.bm.destroy();
        g.atlas = null;
    }

    T.register("TerenKit", { hash, vnoise, boxBlur, chamfer, sample, descOf, srcOf, profileOf, tileSheet, tileImage, a5Pixels, rimStone, rimGrass, rimEarth,
        a5Grass, a5Earth, lerp, atlasSlot, flushAtlas, dropAtlas });
})();
