//=============================================================================
// Laka.js
//=============================================================================
// (2026-11-03, first on test map A, Map990 - the player: "trawę w głębi lądu jakoś nakładką upiększyć pomysłowo"; of four ideas he took all
// four still ones, no wind; "nie za gęsto i nie może na drzewo nachodzić"; the mock-up: tools/laka/makieta.py, docs/laka/; 2026-11-05 on the island's
// outdoor maps, "żeby kwiatów nie było tak gęsto"). Baked, nothing moves:
//   1. SHADES: the meadow's own large soft patches - warmer, sunny and cooler, lusher green - and the grass drier and yellowed near the water,
//      greener inland: a small picture of the whole map (2 texels a cell) drawn smoothed and scaled over the ground in two blends, MULTIPLY (the
//      lush darker, the dry one's lost blue) and ADD (the sunny warmth, the dry one's yellow). Only on grass (green A2 kinds, the A5 grass top)
//      with no object on the cell: paths, earth, cobbles and the tiles' own trees and stones keep their colour. The fields go by the world's
//      coordinates (window.SwiatData): a patch goes on over a map's edge.
//   2. FLOWERS: loose drifts of mostly one kind (white stars, orange, red, blue, turquoise, yellow - cut from the tileset's D sheet), a flower
//      20 px or more from the next and about one a cell at most in a drift's middle, thinning out, the kinds passing into one another; only inland
//      (from ~9 cells off the water), never by a trunk nor on a thing's cell; a single one here and there. Spring and summer; in autumn a few, in
//      winter none. None on the maps of the parameter noFlowers (the town, the suburb).
//   3. BY THINGS: needles under the conifers, tufts of taller grass at the sides of trunks, rocks and bushes, and along the foot of a hill's face.
// 2-3 are pictures of 8 x 8 cells baked when they come near the screen (a small pool of bitmaps, given back when far), the screen's own before
// the map shows. z 0.85 / 0.9: over the ground, Ziemia's soft edges (0.5) and GroundDetail's tufts (0.8); under the soil (1), the contact shade
// (1.4), the things lying about (1.5), the sun's shadows (1.8) and every character (3) - so nothing of it is ever over a tree or a person.
// Switches: Opcje "Łąka: odcienie i kwiaty (próba)"; Laka.set(false); for the tests window.LAKA = { off: true }.

/*:
 * @target MZ
 * @plugindesc Łąka: odcienie trawy, sucho przy brzegu i bujnie w głębi lądu, rzadkie kwietne łany, igliwie i wysoka trawa przy drzewach. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TerenKit
 *
 * @param maps
 * @text Mapy
 * @desc Numery map (po przecinku), na których działa nakładka.
 * @type string
 * @default 3,4,8,13,17,18,20,21,22,23,24,111,120,125,155,157,159,162,165,168,175,900,901,910,912,914,917,918,920,922,923,931,933,934,935,950,951,960,961,962,963,964,990,991
 *
 * @param noFlowers
 * @text Mapy bez kwiatów
 * @desc Numery map (po przecinku), na których są tylko odcienie łąki i trawa przy rzeczach, bez łanów kwiatów (miasto, podgrodzie).
 * @type string
 * @default 8,111
 *
 * @param on
 * @text Domyślnie włączona
 * @type boolean
 * @default true
 *
 * @help
 * Wszystko jest nieruchome i pieczone raz: odcienie łąki to jeden mały obrazek
 * całej mapy, kwiaty, igliwie i kępy trawy - kawałki 8 x 8 kratek pieczone, gdy
 * zbliżają się do ekranu. Leży pod drzewami i postaciami, nigdy na nich.
 * Opcje: „Łąka: odcienie i kwiaty (próba)”. Grafika „Niska”: wyłączona.
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const K = T.api("TerenKit");
    const PLUGIN = "Laka";
    const params = PluginManager.parameters(PLUGIN);
    const MAPS = String(params.maps === undefined || params.maps === "" ? "990" : params.maps).split(/[^0-9]+/).filter(Boolean).map(Number);
    const NO_FLOWERS = String(params.noFlowers === undefined ? "8,111" : params.noFlowers).split(/[^0-9]+/).filter(Boolean).map(Number);
    const DEF = String(params.on) !== "false";
    const KEY = "lakaOn";
    const TW = 48;

    // ------------------------------------------------------------------
    // The switch (the config file, not the save)
    // ------------------------------------------------------------------
    if (ConfigManager[KEY] === undefined) ConfigManager[KEY] = DEF;
    const _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() { const c = _makeData.call(this); c[KEY] = this[KEY] === undefined ? DEF : this[KEY]; return c; };
    const _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) { _applyData.call(this, config); const v = config ? config[KEY] : undefined; this[KEY] = v === undefined ? DEF : !!v; };
    const _addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _addGeneralOptions.call(this);
        this._list.push({ name: "Łąka: odcienie i kwiaty (próba)", symbol: KEY, enabled: true, ext: null });
    };
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        return this.commandSymbol(index) === KEY ? (this.getConfigValue(KEY) ? "Wł" : "Wył") : _statusText.call(this, index);
    };
    const _restoreDefaults = Window_Options.prototype.restoreDefaultValues;
    if (_restoreDefaults) Window_Options.prototype.restoreDefaultValues = function() { _restoreDefaults.call(this); ConfigManager[KEY] = DEF; };
    function on() {
        const o = window.LAKA;
        if (o && o.off) return false;
        if (o && o.on !== undefined) return !!o.on;
        return ConfigManager[KEY] === undefined ? DEF : !!ConfigManager[KEY];
    }
    const gfxOk = () => { const W = T.api("Wydajnosc"); return !(W && W.gfx && W.gfx.mood === false); };   // (Niska: none)
    const here = () => !!(window.$gameMap && window.$dataMap && $dataMap.data) && (MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.LAKA_ALL) && on() && gfxOk();

    // ------------------------------------------------------------------
    // Numbers (the mock-up's, tools/laka/makieta.py)
    // ------------------------------------------------------------------
    const TX = 24;                                  // a texel of the shades: 24 px (2 a cell; the patches are many cells wide)
    const DRY_FAR = 8.5, DRY_NEAR = 3.0;            // cells off the water: dry from DRY_NEAR, none from DRY_FAR
    const LUSH_FROM = 9.0, LUSH_FULL = 17.0;        // cells off the water where the lush grass and the flowers begin / are full
    const FG = 32, FJIT = 12, DRIFT_AT = 0.76;      // the flowers' grid (px), its jitter - 20 px or more between two, they do not lie on one another - the drift field's threshold
    const P_DRIFT = 0.42;                           // a grid point in a drift's very middle holds a flower so often (under one a cell)
    const SINGLE = 96, P_SINGLE = 0.10;             // the grid of the single flowers (px), how often it holds one
    const KEEP = 4;                                 // the last maps' worked-out grass and shades are kept: going back costs nothing
    const CH = 8, CPX = CH * TW, POOL = 24;         // the pieces: 8 x 8 cells, at most 24 bitmaps (~14 MB; an empty piece keeps none)
    const MARGIN = 2;                               // cells round the screen kept baked
    const KINDS = [["biale", [204, 212]], ["pomaranczowe", [198, 199]], ["czerwone", [184, 192]], ["niebieskie", [193, 194, 195]], ["turkusowe", [196, 197]], ["zolte", [222, 223]]];
    const SEASON_FLOWERS = [1, 1, 0.35, 0];         // spring, summer, autumn, winter
    const NEEDLES = [[150, 108, 58], [124, 90, 48], [172, 128, 70], [104, 78, 44]];
    const CONIFER = /^!\$Pine/, TRUNK = /^!\$(Pine|Tree|Sapling|Big_Trees|Rock|Boulder|Bush)/;   // (the big trees' pictures have their dark round shadow in them: no needles to see)
    const FLAT = /^!\$(Bush_(Clover|Grass|Fern|Flower|Snow|Bud)|Rock_Pebbles)/;
    const stat = { geoMs: 0, tintMs: 0, bakeMs: 0, baked: 0, flowers: 0 };

    const smooth = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const h = (a, b, c, d) => K.hash(a, b, c, d || 0);
    const noise = (x, y, cells, seed) => K.vnoise(x, y, cells * TW, seed);

    // ------------------------------------------------------------------
    // The map: which cells are grass, how far the water is, the feet of things (cached by the map's data; null while the sheets load)
    // ------------------------------------------------------------------
    const kindCache = {};
    function avgOf(px) {   // the average colour of the opaque pixels of a 48 x 48 picture
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 128) { r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
        return n ? [r / n, g / n, b / n] : null;
    }
    const greenRgb = c => !!c && c[1] > c[0] + 12 && c[1] > c[2] + 6;
    function kindOf(id) {   // { green, rgb } of an A2 kind or the A5 grass top; undefined while the sheet loads; null: neither
        const names = $gameMap.tileset().tilesetNames || [];
        const isA2 = id >= 2816 && id < 4352, key = isA2 ? names[1] + ":" + Math.floor((id - 2816) / 48) : names[4] + ":" + id;
        if (kindCache[key] !== undefined) return kindCache[key];
        let px = null;
        if (isA2) { const d = K.descOf(id); if (!d) return (kindCache[key] = null); px = K.srcOf(d); }
        else if (id >= 1536 && id < 2048) px = K.a5Pixels(id);
        else return (kindCache[key] = null);
        if (!px) return undefined;
        const rgb = avgOf(px);
        return (kindCache[key] = { green: greenRgb(rgb), rgb: rgb || [70, 130, 60] });
    }
    const A5_GRASS = 1536 + 97;
    const isWater = id => id >= 2048 && id < 2816;
    let G = null;
    const kept = [];
    function dataKey() {
        const d = $dataMap.data, n = $dataMap.width * $dataMap.height * 4;
        let h = 0;
        for (let i = 0; i < n; i++) h = (Math.imul(h, 31) + d[i]) | 0;
        return $gameMap.mapId() + ":" + $gameMap.tilesetId() + ":" + $dataMap.width + "x" + $dataMap.height + ":" + h;
    }
    function geometry() {
        const d = $dataMap.data;
        if (G && G.data === d && G.tileset === $gameMap.tilesetId()) return G;
        const t0 = performance.now(), W = $dataMap.width, H = $dataMap.height, N = W * H, key = dataKey(), old = kept.find(o => o.key === key);
        if (old) { old.data = d; G = old; stat.geoMs = performance.now() - t0; return G; }
        const grass = new Uint8Array(N), obj = new Uint8Array(N), face = new Uint8Array(N), water = new Uint8Array(N), rgb = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const a = d[i], b = d[N + i];
            if (isWater(a)) { water[i] = 1; continue; }
            const a5 = a - 1536;
            if (a5 === 120 || a5 === 121 || a5 === 122) face[i] = 1;
            if (d[2 * N + i] || d[3 * N + i]) obj[i] = 1;
            if (!(a >= 2816 && a < 4352) && a !== A5_GRASS) continue;
            const ka = kindOf(a);
            if (ka === undefined) return null;
            if (!ka || !ka.green) continue;
            if (b) {
                if (isWater(b)) continue;
                const kb = kindOf(b);
                if (kb === undefined) return null;
                if (kb && !kb.green) continue;
            }
            grass[i] = 1; rgb[i * 3] = ka.rgb[0]; rgb[i * 3 + 1] = ka.rgb[1]; rgb[i * 3 + 2] = ka.rgb[2];
        }
        // cells off the water (4 ways; no water: far everywhere)
        const dist = new Float32Array(N).fill(999), q = new Int32Array(N);
        let qh = 0, qt = 0;
        for (let i = 0; i < N; i++) if (water[i]) { dist[i] = 0; q[qt++] = i; }
        while (qh < qt) {
            const i = q[qh++], x = i % W, y = (i / W) | 0, nd = dist[i] + 1;
            if (x > 0 && dist[i - 1] > nd) { dist[i - 1] = nd; q[qt++] = i - 1; }
            if (x < W - 1 && dist[i + 1] > nd) { dist[i + 1] = nd; q[qt++] = i + 1; }
            if (y > 0 && dist[i - W] > nd) { dist[i - W] = nd; q[qt++] = i - W; }
            if (y < H - 1 && dist[i + W] > nd) { dist[i + W] = nd; q[qt++] = i + W; }
        }
        const w = window.SwiatData && SwiatData.maps && SwiatData.maps[$gameMap.mapId()];   // (the world's coordinates: the same field on both sides of a map's edge)
        G = { key, data: d, tileset: $gameMap.tilesetId(), W, H, grass, obj, face, rgb, dist, feet: null, feetSig: "", tint: null, occ: new Uint8Array(N), ox: w ? w[0] * TW : 0, oy: w ? w[1] * TW : 0 };
        kept.push(G);
        while (kept.length > KEEP) { const o = kept.shift(); if (o.tint) { o.tint.mul.destroy(); o.tint.add.destroy(); o.tint = null; } }
        stat.geoMs = performance.now() - t0;
        return G;
    }
    const at = (g, x, y) => (x >= 0 && y >= 0 && x < g.W && y < g.H ? x + y * g.W : -1);
    function distAt(g, px, py) {   // cells off the water at a map pixel, smooth
        const fx = px / TW - 0.5, fy = py / TW - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
        const v = (x, y) => { const i = at(g, Math.max(0, Math.min(g.W - 1, x)), Math.max(0, Math.min(g.H - 1, y))); return Math.min(60, g.dist[i]); };
        return (v(x0, y0) * (1 - ax) + v(x0 + 1, y0) * ax) * (1 - ay) + (v(x0, y0 + 1) * (1 - ax) + v(x0 + 1, y0 + 1) * ax) * ay;
    }
    // a point a flower may stand on: grass, no object nor a thing on its cell, near a cell's edge the neighbour grass too (Ziemia's soft edges), not by a foot
    function grassPoint(g, px, py, m) {
        const cx = Math.floor(px / TW), cy = Math.floor(py / TW), i = at(g, cx, cy);
        if (i < 0 || !g.grass[i] || g.obj[i] || g.occ[i]) return false;
        const lx = px - cx * TW, ly = py - cy * TW;
        if (lx < m && !g.grass[at(g, cx - 1, cy)] ) return false;
        if (lx > TW - m && !g.grass[at(g, cx + 1, cy)]) return false;
        if (ly < m && !g.grass[at(g, cx, cy - 1)]) return false;
        if (ly > TW - m && !g.grass[at(g, cx, cy + 1)]) return false;
        return true;
    }

    // the feet of trees, rocks and bushes: the opaque bottom rows of the event's OWN frame (a sheet like !$Big_Trees holds different trees in its frames); null while a picture loads
    const baseCache = {};
    function baseOf(name, pattern, dir) {
        const key = name + "|" + pattern + "|" + dir;
        if (baseCache[key] !== undefined) return baseCache[key];
        const bm = ImageManager.loadCharacter(name);
        if (!bm || !bm.isReady()) return null;
        const fw = Math.floor(bm.width / 3), fh = Math.floor(bm.height / 4);
        let out = false;
        try {
            const img = bm.context.getImageData(fw * pattern, fh * (dir / 2 - 1), fw, fh).data;
            let last = -1;
            for (let y = fh - 1; y >= 0 && last < 0; y--) for (let x = 0; x < fw; x++) if (img[(y * fw + x) * 4 + 3] > 100) { last = y; break; }
            if (last >= 0) {
                let lo = fw, hi = -1;
                for (let y = Math.max(0, last - 5); y <= last; y++) for (let x = 0; x < fw; x++) if (img[(y * fw + x) * 4 + 3] > 100) { if (x < lo) lo = x; if (x > hi) hi = x; }
                out = { w: hi - lo + 1, off: (lo + hi) / 2 - fw / 2, up: fh - 1 - last };
            }
        } catch (e) { out = false; }
        return (baseCache[key] = out);
    }
    function feetSig() {
        let s = 0, n = 0;
        for (const ev of $gameMap.events()) {
            const nm = ev.characterName();
            if (!nm || ev._erased || !TRUNK.test(nm)) continue;
            n++; s = (s * 31 + ev.x * 977 + ev.y * 131 + nm.length) | 0;
        }
        return n + ":" + s;
    }
    function feet(g) {   // [{ x, y, w, conifer, seed }] in map px; false while a picture loads
        const sig = feetSig();
        if (g.feet && g.feetSig === sig) return g.feet;
        const out = [];
        g.occ.fill(0);
        for (const ev of $gameMap.events()) {
            const nm = ev.characterName();
            if (ev._erased || (!nm && !ev.tileId())) continue;
            if (ev.x >= 0 && ev.y >= 0 && ev.x < g.W && ev.y < g.H && (!nm || nm[0] === "!")) g.occ[ev.y * g.W + ev.x] = 1;   // (a thing's cell: no flower under a herb, a grave, a stone; the people walk on)
            if (!nm || ev.isTransparent() || !TRUNK.test(nm) || FLAT.test(nm)) continue;
            const base = baseOf(nm, ev.pattern(), ev.direction());
            if (base === null) return false;
            if (!base) continue;
            out.push({ x: (ev.x + 0.5) * TW + base.off, y: (ev.y + 1) * TW - base.up - 2, w: base.w, conifer: CONIFER.test(nm), tree: /^!\$(Pine|Tree|Sapling|Big_Trees)/.test(nm), seed: ev.x * 7919 + ev.y * 104729 });
        }
        g.feet = out; g.feetSig = sig;
        return out;
    }

    // ------------------------------------------------------------------
    // The flowers' pictures: single flowers cut from the D sheet's flower tiles (8-connected opaque pieces)
    // ------------------------------------------------------------------
    let STAMPS = null;
    function stamps() {
        if (STAMPS) return STAMPS;
        const names = $gameMap.tileset().tilesetNames || [];
        if (!/Fantasy_Outside_D/.test(names[7] || "")) return (STAMPS = false);   // (another tileset: no flowers of its own to cut)
        const out = [];
        for (const [kind, tiles] of KINDS) {
            const list = [];
            for (const n of tiles) {
                const px = K.tileImage(512 + n);
                if (!px) return null;
                const seen = new Uint8Array(TW * TW);
                for (let s = 0; s < TW * TW; s++) {
                    if (seen[s] || px[s * 4 + 3] <= 40) continue;
                    const st = [s], pts = [];
                    seen[s] = 1;
                    while (st.length) {
                        const p = st.pop(); pts.push(p);
                        const x = p % TW, y = (p / TW) | 0;
                        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx, ny = y + dy, np = nx + ny * TW;
                            if (nx >= 0 && ny >= 0 && nx < TW && ny < TW && !seen[np] && px[np * 4 + 3] > 40) { seen[np] = 1; st.push(np); }
                        }
                    }
                    if (pts.length < 5) continue;
                    let x0 = TW, y0 = TW, x1 = -1, y1 = -1;
                    for (const p of pts) { const x = p % TW, y = (p / TW) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
                    const w = x1 - x0 + 1, hh = y1 - y0 + 1;
                    if (w > 26 || hh > 26) continue;
                    const c = document.createElement("canvas"); c.width = w; c.height = hh;
                    const cx = c.getContext("2d"), img = cx.createImageData(w, hh);
                    for (const p of pts) { const x = p % TW, y = (p / TW) | 0, o = ((y - y0) * w + (x - x0)) * 4, i = p * 4; img.data[o] = px[i] * 0.92; img.data[o + 1] = px[i + 1] * 0.92; img.data[o + 2] = px[i + 2] * 0.92; img.data[o + 3] = px[i + 3]; }
                    cx.putImageData(img, 0, 0);
                    list.push(c);
                }
            }
            if (list.length) out.push({ kind, list });
        }
        return (STAMPS = out.length ? out : false);
    }

    // ------------------------------------------------------------------
    // 1. SHADES: two small pictures of the whole map (multiply / add), 3 texels a cell
    // ------------------------------------------------------------------
    function shades(g) {
        if (g.tint) return g.tint;
        const t0 = performance.now(), tw = g.W * (TW / TX), th = g.H * (TW / TX);
        const mul = new Bitmap(tw, th), add = new Bitmap(tw, th);
        const im = mul.context.createImageData(tw, th), ia = add.context.createImageData(tw, th);
        for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
            const px = (tx + 0.5) * TX, py = (ty + 0.5) * TX, i = at(g, Math.floor(px / TW), Math.floor(py / TW)), o = (ty * tw + tx) * 4;
            let mr = 1, mg = 1, mb = 1, ar = 0, ag = 0, ab = 0;
            if (i >= 0 && g.grass[i] && !g.obj[i]) {
                const d = distAt(g, px, py), dry = smooth(DRY_FAR, DRY_NEAR, d), lush = smooth(LUSH_FROM, LUSH_FULL, d), wx = px + g.ox, wy = py + g.oy;
                const n = Math.max(-1, Math.min(1, (0.65 * noise(wx, wy, 11, 7) + 0.35 * noise(wx, wy, 4.5, 8)) * 3.2 - 1.6));
                const sun = Math.max(0, n) * (1 - dry), cool = Math.max(0, -n) * (1 - dry) * (0.6 + 0.4 * lush);
                mr = 1 - 0.17 * cool; mg = 1 - 0.08 * cool; mb = (1 - 0.11 * cool) * (1 - 0.10 * sun);
                ar = 7 * sun; ag = 11 * sun;
                mg *= 1 - 0.03 * dry; mb *= 1 - 0.17 * dry; ar += 11 * dry; ag += 2 * dry;   // (the dry grass: yellower - less blue, more red; 2026-11-05: with blue added to it it went grey, dirty)
            }
            im.data[o] = Math.round(mr * 255); im.data[o + 1] = Math.round(mg * 255); im.data[o + 2] = Math.round(mb * 255); im.data[o + 3] = 255;
            ia.data[o] = Math.round(ar); ia.data[o + 1] = Math.round(ag); ia.data[o + 2] = Math.round(ab); ia.data[o + 3] = 255;
        }
        mul.context.putImageData(im, 0, 0); add.context.putImageData(ia, 0, 0);
        for (const b of [mul, add]) { b.smooth = true; if (b._baseTexture && b._baseTexture.update) b._baseTexture.update(); }
        stat.tintMs = performance.now() - t0;
        return (g.tint = { mul, add });
    }

    // ------------------------------------------------------------------
    // 2-3. A piece of 8 x 8 cells: flowers, needles, tufts
    // ------------------------------------------------------------------
    function tuft(ctx, x, y, base, seed) {   // 5-9 blades of 7-13 px in the local grass's own dark, middle and light
        const col = f => "rgb(" + f.map(v => Math.max(0, Math.min(255, Math.round(v)))).join(",") + ")";
        const dark = col([base[0] * 0.62, base[1] * 0.72, base[2] * 0.62]), mid = col([base[0] * 0.95, base[1] * 1.08, base[2] * 0.92]), light = col([base[0] * 1.18 + 6, base[1] * 1.28 + 6, base[2] * 1.05 + 6]);
        const n = 5 + Math.floor(h(seed, 1, 91) * 5);
        for (let b = 0; b < n; b++) {
            const hh = 7 + Math.floor(h(seed, b, 92) * 7), x0 = x + Math.floor(h(seed, b, 93) * 11) - 5, lean = (h(seed, b, 94) - 0.5) * 0.7;
            for (let k = 0; k < hh; k++) {
                ctx.fillStyle = k < hh * 0.35 ? dark : k < hh * 0.8 ? mid : light;
                ctx.fillRect(Math.round(x0 + lean * k), y - k, 1, 1);
            }
        }
    }
    function bakePiece(g, ft, st, ccx, ccy, bm) {
        const t0 = performance.now(), ctx = bm.context, X0 = ccx * CPX, Y0 = ccy * CPX;
        ctx.clearRect(0, 0, CPX, CPX);
        const season = NO_FLOWERS.indexOf($gameMap.mapId()) >= 0 ? 0 : SEASON_FLOWERS[T.time.season()] || 0;
        const near = ft.filter(f => f.x > X0 - 80 && f.x < X0 + CPX + 80 && f.y > Y0 - 40 && f.y < Y0 + CPX + 60);
        const byFoot = (x, y, r) => near.some(f => (x - f.x) * (x - f.x) + (y - f.y) * (y - f.y) * 4.84 < r * r);
        const grassRgb = (x, y) => { const i = at(g, Math.floor(x / TW), Math.floor(y / TW)); return i >= 0 && g.grass[i] ? [g.rgb[i * 3], g.rgb[i * 3 + 1], g.rgb[i * 3 + 2]] : null; };
        let flowers = 0, drawn = 0;
        // needles under the conifers (under everything else of the piece)
        for (const f of near) {
            if (!f.conifer) continue;
            for (let k = 0; k < 220; k++) {
                const a = h(f.seed, k, 51) * Math.PI * 2, r = Math.sqrt(h(f.seed, k, 52));
                if (h(f.seed, k, 53) < r * 0.75) continue;
                const x = f.x + Math.cos(a) * r * 58, y = f.y + 8 + Math.sin(a) * r * 14;
                const i = at(g, Math.floor(x / TW), Math.floor(y / TW));
                if (i < 0 || !g.grass[i]) continue;
                const c = NEEDLES[Math.floor(h(f.seed, k, 54) * NEEDLES.length)];
                ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0.94)";
                ctx.fillRect(Math.floor(x) - X0, Math.floor(y) - Y0, h(f.seed, k, 55) < 0.7 ? 2 : 1, 1);
                drawn++;
            }
        }
        // the flowers: drifts on a jittered grid, the kinds by a slow field, a few strays
        if (st && season > 0) {
            const gx0 = Math.floor((X0 - 30) / FG), gx1 = Math.floor((X0 + CPX + 30) / FG), gy0 = Math.floor((Y0 - 30) / FG), gy1 = Math.floor((Y0 + CPX + 30) / FG);
            for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
                const x = gx * FG + 4 + h(gx, gy, 61) * FJIT, y = gy * FG + 4 + h(gx, gy, 62) * FJIT;
                const c = noise(x + g.ox, y + g.oy, 7, 21);
                if (c < DRIFT_AT) continue;
                const p = P_DRIFT * Math.min(1, Math.pow((c - DRIFT_AT) / (1 - DRIFT_AT), 1.4) * 1.6) * smooth(LUSH_FROM, LUSH_FULL, distAt(g, x, y)) * season;
                if (h(gx, gy, 63) >= p || !grassPoint(g, x, y, 10) || byFoot(x, y, 34)) continue;
                let kind = Math.floor(noise(x + g.ox, y + g.oy, 9, 44) * st.length * 1.25) % st.length;
                if (h(gx, gy, 64) < 0.12) kind = Math.floor(h(gx, gy, 65) * st.length);
                const list = st[kind].list, cv = list[Math.floor(h(gx, gy, 66) * list.length)];
                ctx.drawImage(cv, Math.round(x - cv.width / 2) - X0, Math.round(y + 4 - cv.height) - Y0);
                flowers++;
            }
            const sx0 = Math.floor((X0 - 30) / SINGLE), sx1 = Math.floor((X0 + CPX + 30) / SINGLE), sy0 = Math.floor((Y0 - 30) / SINGLE), sy1 = Math.floor((Y0 + CPX + 30) / SINGLE);
            for (let gy = sy0; gy <= sy1; gy++) for (let gx = sx0; gx <= sx1; gx++) {
                const x = gx * SINGLE + 8 + h(gx, gy, 71) * (SINGLE - 16), y = gy * SINGLE + 8 + h(gx, gy, 72) * (SINGLE - 16);
                if (h(gx, gy, 73) >= P_SINGLE * smooth(LUSH_FROM, LUSH_FULL, distAt(g, x, y)) * season || !grassPoint(g, x, y, 10) || byFoot(x, y, 34)) continue;
                const s = st[Math.floor(h(gx, gy, 74) * st.length)].list, cv = s[Math.floor(h(gx, gy, 75) * s.length)];
                ctx.drawImage(cv, Math.round(x - cv.width / 2) - X0, Math.round(y + 4 - cv.height) - Y0);
                flowers++;
            }
        }
        // tufts of taller grass at the sides of trunks, rocks and bushes
        for (const f of near) {
            for (const side of [-1, 1]) {
                if (h(f.seed, side, 81) < 0.25) continue;
                const x = f.x + side * (Math.max(f.tree ? 12 : 10, f.w * 0.25) + h(f.seed, side, 82) * Math.max(8, f.w * 0.17)), y = f.y + 6 + h(f.seed, side, 83) * 5;
                const c = grassRgb(x, y - 3);
                if (c) { tuft(ctx, Math.round(x) - X0, Math.round(y) - Y0, c, f.seed * 3 + side); drawn++; }
            }
        }
        // a strip of it at the foot of a hill's face (the cell under its last row)
        for (let cy = ccy * CH - 1; cy <= (ccy + 1) * CH; cy++) for (let cx = ccx * CH - 1; cx <= (ccx + 1) * CH; cx++) {
            const i = at(g, cx, cy), j = at(g, cx, cy + 1);
            if (i < 0 || j < 0 || !g.face[i] || !g.grass[j]) continue;
            for (let k = 0; k < 2; k++) {
                const x = cx * TW + 4 + h(cx, cy, 85 + k) * 40, y = (cy + 1) * TW + 2 + h(cx, cy, 87 + k) * 4;
                tuft(ctx, Math.round(x) - X0, Math.round(y) - Y0, [g.rgb[j * 3], g.rgb[j * 3 + 1], g.rgb[j * 3 + 2]], cx * 131 + cy * 7 + k);
                drawn++;
            }
        }
        drawn += flowers;
        if (drawn && bm._baseTexture && bm._baseTexture.update) bm._baseTexture.update();
        stat.bakeMs += performance.now() - t0; stat.baked++; stat.flowers += flowers;
        return drawn;
    }

    // ------------------------------------------------------------------
    // The layer in the tilemap
    // ------------------------------------------------------------------
    function Sprite_Laka() { this.initialize(...arguments); }
    Sprite_Laka.prototype = Object.create(Sprite.prototype);
    Sprite_Laka.prototype.constructor = Sprite_Laka;
    Sprite_Laka.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.85;
        this._mul = new Sprite(); this._add = new Sprite();
        this._mul.blendMode = PIXI.BLEND_MODES.MULTIPLY; this._add.blendMode = PIXI.BLEND_MODES.ADD;
        for (const s of [this._mul, this._add]) { s.scale.set(TX, TX); s.update = function() {}; this.addChild(s); }
        this._pieces = new Map(); this._pool = []; this._held = 0; this._key = ""; this._t = 0;
    };
    Sprite_Laka.prototype.drop = function() {
        for (const p of this._pieces.values()) if (p.spr) { this._deco.removeChild(p.spr); this._pool.push(p.bm); }
        this._pieces.clear(); this._held = 0;
    };
    Sprite_Laka.prototype.pieceWindow = function() {
        const tw = $gameMap.tileWidth(), dx = $gameMap.displayX(), dy = $gameMap.displayY(), vw = T.view.w() / tw, vh = T.view.h() / tw;
        return [Math.floor((dx - MARGIN) / CH), Math.floor((dx + vw + MARGIN) / CH), Math.floor((dy - MARGIN) / CH), Math.floor((dy + vh + MARGIN) / CH)];
    };
    // bake the pieces the screen needs; budget: pieces this call (Infinity: all of them) - true when nothing is left
    // fresh: the map's things asked again (every ~second: a tree felled, a stump grown; the whole picture then at once, it does not blink)
    Sprite_Laka.prototype.work = function(budget, fresh) {
        if (T.view.scale() !== 1) return true;   // (the eagle's flight: what is baked stays, no more)
        const g = geometry();
        if (!g) return false;
        const ft = fresh || !g.feet ? feet(g) : g.feet, st = stamps();
        if (ft === false || st === null) return false;
        const sk = $gameMap.mapId() + "|" + g.feetSig + "|" + T.time.season();
        if (sk !== this._key) { this._key = sk; this.drop(); this._win = ""; budget = Infinity; }
        const [x0, x1, y0, y1] = this.pieceWindow(), win = x0 + "," + x1 + "," + y0 + "," + y1;
        if (win === this._win) return true;   // (nothing new came near)
        for (const [k, p] of Array.from(this._pieces)) if (p.cx < x0 - 1 || p.cx > x1 + 1 || p.cy < y0 - 1 || p.cy > y1 + 1) {
            if (p.spr) { this._deco.removeChild(p.spr); this._pool.push(p.bm); this._held--; }
            this._pieces.delete(k);
        }
        let left = true;
        for (let cy = Math.max(0, y0); cy <= Math.min(Math.ceil(g.H / CH) - 1, y1); cy++) for (let cx = Math.max(0, x0); cx <= Math.min(Math.ceil(g.W / CH) - 1, x1); cx++) {
            const k = cy * 1000 + cx;
            if (this._pieces.has(k)) continue;
            if (budget <= 0) { left = false; continue; }
            if (this._held >= POOL) { left = false; continue; }
            const bm = this._pool.pop() || new Bitmap(CPX, CPX);
            bm.smooth = false;
            budget--;
            if (!bakePiece(g, ft, st, cx, cy, bm)) { this._pool.push(bm); this._pieces.set(k, { cx, cy, bm: null, spr: null }); continue; }   // (nothing in it: no picture kept)
            const spr = new Sprite(bm); spr.x = cx * CPX; spr.y = cy * CPX; spr.update = function() {};
            this._deco.addChild(spr);
            this._pieces.set(k, { cx, cy, bm, spr });
            this._held++;
        }
        if (left) this._win = win;
        return left;
    };
    Sprite_Laka.prototype.prepare = function() { return this.work(Infinity, true) && !!(G && G.tint); };
    Sprite_Laka.prototype.update = function() {
        const show = here();
        this.visible = show; if (this._deco) this._deco.visible = show;
        if (!show) { if (this._pieces.size) this.drop(); return; }
        const g = geometry();
        if (!g) return;
        const tint = shades(g);
        if (this._mul.bitmap !== tint.mul) { this._mul.bitmap = tint.mul; this._add.bitmap = tint.add; }
        const ox = Math.round(-$gameMap.displayX() * TW), oy = Math.round(-$gameMap.displayY() * TW);
        this.x = ox; this.y = oy; this._deco.x = ox; this._deco.y = oy;
        const t = this._t++;
        if ((t & 1) === 0) this.work(1, (t & 63) === 0);   // (one piece every other frame at most, ahead of a running hero; the screen's own were baked before the map showed)
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._laka = new Sprite_Laka();
        const deco = new Sprite(); deco.z = 0.9; deco.update = function() {};
        this._laka._deco = deco;
        this._tilemap.addChild(this._laka);
        this._tilemap.addChild(deco);
    };
    // (as the shore and Ziemia's edges) the screen's pieces are baked while it is still black - at most ~1.5 s, never stuck
    const _Scene_Map_isReady = Scene_Map.prototype.isReady;
    Scene_Map.prototype.isReady = function() {
        if (!_Scene_Map_isReady.call(this)) return false;
        const s = this._spriteset && this._spriteset._laka;
        if (!s || !here()) return true;
        this._lkWait = (this._lkWait || 0) + 1;
        const g = geometry();
        if (g) shades(g);
        return s.prepare() || this._lkWait > 90;
    };

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        here, on,
        set(v) { ConfigManager[KEY] = !!v; ConfigManager.save(); return on(); },
        stats() {
            const s = SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._laka;
            const pieces = s ? s._held : 0, pool = s ? s._pool.length : 0;
            return { pieces, pool, mb: Math.round((pieces + pool) * CPX * CPX * 4 / 1048576 * 100) / 100 + (G && G.tint ? Math.round(G.W * 2 * G.H * 2 * 8 / 1048576 * 100) / 100 : 0),
                geoMs: Math.round(stat.geoMs * 10) / 10, tintMs: Math.round(stat.tintMs * 10) / 10, bakeMs: Math.round(stat.bakeMs * 10) / 10, baked: stat.baked, flowers: stat.flowers, feet: G && G.feet ? G.feet.length : 0 };
        },
        resetStats() { stat.tintMs = 0; stat.bakeMs = 0; stat.baked = 0; stat.flowers = 0; },
        redo() { G = null; kept.length = 0; STAMPS = null; const s = SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._laka; if (s) { s._key = ""; s.drop(); } },
        Sprite_Laka
    };
    window.Laka = T.register(PLUGIN, api);
})();
