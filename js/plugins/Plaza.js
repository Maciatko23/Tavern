//=============================================================================
// Plaza.js
//=============================================================================
// (2026-11-13, the player: "fajne nakładki na przystań, żeby był piasek, troszkę plaży, potem troszkę jakby ziemi i przechodzi w trawę".) The
// tileset has NO sand tile, so the beach is an overlay of the coast maps, worked out from the LIVE map data (the player edits the coast by hand:
// the beach follows every change, nothing is stored). From the water inland:
//   1. a narrow WET SAND strip at the waterline - darker, a few glossy specks, following the ROUNDED shore (the tile staircase is gone);
//   2. the DRY SAND beach: light warm sand, grain taken from the tileset's own earth pixels, faint wind ripples, and tiny flat painted
//      details (pebbles, shell bits, a line of dry seaweed at the high-water mark - a few pixels each, nothing like a thing to pick up);
//   3. sand mixing into TRODDEN EARTH in patches;
//   4. the earth breaking up into GRASS (the tileset's own grass pixels and small tufts), with soft noise-driven, natural edges.
// The width of the beach changes along the coast: wide in bays, narrow on capes, none by cliffs, walls, the pier (the cells that are no
// ground: a soft mask that never lets the sand over them). Trees, rocks and people are events/sprites above (z 0.86 is under the soil,
// the things lying about, the sun's shadows and every character). On the maps where CzerwonaWoda paints its own strip (the stone rim,
// cobbles, earth, dry grass) only 1-3 are painted (the strip is the earth there); elsewhere 4 as well.
// The WATERLINE is the one CzerwonaWoda draws (the water mask blurred and bent by the world's noise, the same numbers and seeds), worked out
// per piece. Baked in pieces of 192 x 192 px when they come near the screen (a pool of bitmaps), no cost at rest. The noise goes by the
// world's coordinates (window.SwiatData), so the beach goes on over a map's edge.
// Switches: Opcje "Plaża: piasek na brzegu (próba)"; Plaza.set(false); for the tests window.PLAZA = { off: true }.

/*:
 * @target MZ
 * @plugindesc Plaża: nakładka z piaskiem na brzegu morza (mokry piasek, sucha plaża z żwirkiem i wodorostami, piasek wtapiający się w ziemię, ziemia w trawę); liczona z żywej mapy. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TerenKit
 * @orderAfter Laka
 *
 * @param maps
 * @text Mapy
 * @desc Numery map (po przecinku), na których działa nakładka (mapy z morzem na zestawie 11).
 * @type string
 * @default 125,219
 *
 * @param on
 * @text Domyślnie włączona
 * @type boolean
 * @default true
 *
 * @help
 * Plaża jest pieczona w kawałkach 192 x 192 px, gdy zbliżają się do ekranu; w
 * bezruchu nic nie kosztuje. Leży pod drzewami, rzeczami na ziemi i postaciami.
 * Linia wody jest taka sama jak w CzerwonaWoda (zaokrąglona). Szerokość plaży
 * zależy od zatoki / przylądka i od skał, murów, pomostu (tam jej nie ma).
 * Opcje: „Plaża: piasek na brzegu (próba)”. Grafika „Niska”: wyłączona.
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const K = T.api("TerenKit");
    const PLUGIN = "Plaza";
    const params = PluginManager.parameters(PLUGIN);
    const MAPS = String(params.maps === undefined || params.maps === "" ? "219" : params.maps).split(/[^0-9]+/).filter(Boolean).map(Number);
    const DEF = String(params.on) !== "false";
    const KEY = "plazaOn";
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
        this._list.push({ name: "Plaża: piasek na brzegu (próba)", symbol: KEY, enabled: true, ext: null });
    };
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        return this.commandSymbol(index) === KEY ? (this.getConfigValue(KEY) ? "Wł" : "Wył") : _statusText.call(this, index);
    };
    const _restoreDefaults = Window_Options.prototype.restoreDefaultValues;
    if (_restoreDefaults) Window_Options.prototype.restoreDefaultValues = function() { _restoreDefaults.call(this); ConfigManager[KEY] = DEF; };
    function on() {
        const o = window.PLAZA;
        if (o && o.off) return false;
        if (o && o.on !== undefined) return !!o.on;
        return ConfigManager[KEY] === undefined ? DEF : !!ConfigManager[KEY];
    }
    const gfxOk = () => { const W = T.api("Wydajnosc"); return !(W && W.gfx && W.gfx.mood === false); };   // (Niska: none)
    let seaFor = null, seaYes = false;
    const seaHere = () => {   // (the map's note read once per map)
        if (!window.$dataMap) return false;
        if (seaFor !== $dataMap) { seaFor = $dataMap; seaYes = /<Water:\s*salt\s*>/i.test($dataMap.note || ""); }
        return seaYes;
    };
    const here = () => !!(window.$gameMap && window.$dataMap && $dataMap.data) && (MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.PLAZA_ALL) && seaHere() && on() && gfxOk();

    // ------------------------------------------------------------------
    // Numbers
    // ------------------------------------------------------------------
    const Q = 4, CH = 192, CT = CH / Q, MG = 36, WIN = CT + 2 * MG;   // the fields' texel (px), a piece (px, texels), the margin the waterline needs (texels), the window
    const FB = 3, FN = CT + 2 * FB;                                    // the derived fields: a piece + 3 texels each side (the details near the edge read them)
    const BLUR_R = 5, BLUR2 = 4, SD_FAR = 64;                                      // the shore's blur (CzerwonaWoda's), the distance the local field is trusted to (px)
    const MARGIN = 3, POOL = 64, KEEP = 3;                              // cells round the screen baked ahead (shown only when they touch the screen), bitmaps in the pool, the maps' fields kept
    const OVERLAY_RELS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 15, 20, 21, 23, 31];   // (CzerwonaWoda's: the A2 patches that may lie on the ground in layer 1)
    const A5_GRASS = 1536 + 97, A5_EARTH = 1536 + 102;   // (the middles of the A5 plateau blocks: grass and earth)
    const stat = { geoMs: 0, bakeMs: 0, baked: 0, fieldMs: 0, empty: 0, texMs: 0, pixMs: 0, stampMs: 0 };

    const smooth = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const vn = (x, y, sc, seed) => K.vnoise(x, y, sc, seed);
    function ph(x, y, s) {   // a fast integer hash of a pixel, 0..1
        let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 144665);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    // sand colours (the daylight base; Mood's grade and the sky go on top)
    const DRY_A = [200, 182, 138], DRY_B = [220, 203, 158], WET_A = [137, 118, 90], WET_B = [168, 148, 114], GLOSS = [214, 214, 200];
    const PEBBLE = [150, 146, 136], SHELL = [236, 228, 208], SHELL2 = [224, 194, 178], WEED_A = [86, 78, 46], WEED_B = [62, 62, 38];

    // ------------------------------------------------------------------
    // The map: what each cell is (water, planks, grass, earth, road, no ground), cell fields, kept by the map's data
    // ------------------------------------------------------------------
    let G = null;
    const kept = [];
    function dataKey() {
        const d = $dataMap.data, n = $dataMap.width * $dataMap.height * 4;
        let h = 0;
        for (let i = 0; i < n; i++) h = (Math.imul(h, 31) + d[i]) | 0;
        return $gameMap.mapId() + ":" + $gameMap.tilesetId() + ":" + $dataMap.width + "x" + $dataMap.height + ":" + h + ":" + T.time.season();
    }
    const isWaterId = id => id >= 2048 && id < 2816 && Tilemap.isWaterTile(id);
    function stripMap() { const C = window.CzerwonaWoda; return !!(C && C.shoreStrip && C.shoreStrip()); }
    function geometry() {
        const d = $dataMap.data;
        if (G && G.data === d && G.tileset === $gameMap.tilesetId() && G.season === T.time.season()) return G;
        const t0 = performance.now(), W = $dataMap.width, H = $dataMap.height, N = W * H, key = dataKey(), old = kept.find(o => o.key === key);
        if (old) { old.data = d; G = old; stat.geoMs = performance.now() - t0; return G; }
        const flags = $gameMap.tilesetFlags();
        const type = new Uint8Array(N), kind = new Uint8Array(N);   // type: 0 land, 1 open sea, 2 planks over the sea; kind (land): 1 grass, 2 earth, 3 road, 0 no ground
        const open = new Float32Array(N), blk = new Float32Array(N), el = new Float32Array(N), road = new Float32Array(N), plank = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const a = d[i], b = d[N + i];
            const sea = isWaterId(a) || isWaterId(b);
            if (sea) {
                if (b > 0 && Tilemap.isTileA1(b) && !Tilemap.isWaterTile(b)) { type[i] = 2; plank[i] = 1; }   // (a pier: an A1 tile that is no water, over the water)
                else { type[i] = 1; open[i] = 1; el[i] = 1; }
                continue;
            }
            const rel = a >= 2816 && a < 4352 ? Math.floor((a - 2816) / 48) : -1;
            let k = 0;
            if (rel === 0 || rel === 11 || rel === 9) k = 1;
            else if (rel === 8 || rel === 10) k = 2;
            else if (rel === 1) k = 3;
            else if (a === A5_GRASS || K.a5Grass(a)) k = 1;
            else if (K.a5Earth(a) || a === A5_EARTH) k = 2;
            // (2026-11-13, the user's own SW shore on Map219: the plateau blocks' MIDDLES - grass 1633, earth 1638 - are plain ground, only their rims shut a side)
            if (a !== A5_GRASS && a !== A5_EARTH && (k && K.rimGrass(a) || K.rimEarth(a))) k = 0;
            if (k) {
                // layer 1: the patches of the A2 sheet and plain B-E tiles are fine, hills / walls / planks are not; a tile that shuts a side is no ground for sand
                if (b > 0) {
                    if (b >= 2816 && b < 4352) { if (OVERLAY_RELS.indexOf(Math.floor((b - 2816) / 48)) < 0) k = 0; }
                    else if (b >= 1536) k = 0;
                    else if (flags[b] & 0x0f) k = 0;
                }
                if ((flags[a] | (b > 0 ? flags[b] : 0)) & 0x0f && !(rel >= 0)) k = 0;
            }
            kind[i] = k;
            if (k === 3) road[i] = 1;
            if (k) el[i] = 1; else blk[i] = 1;
        }
        // cells off the open water (8 ways, 1 / 1.414), from the water cells' middles
        const cd = new Float32Array(N).fill(999);
        for (let i = 0; i < N; i++) if (open[i]) cd[i] = 0;
        for (let pass = 0; pass < 2; pass++) {
            const o = pass ? -1 : 1;
            for (let k = 0; k < N; k++) {
                const i = pass ? N - 1 - k : k, x = i % W, y = (i - x) / W;
                let v = cd[i];
                for (const [dx, dy, c] of [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.4142], [1, -1, 1.4142]]) {
                    const nx = x + dx * o, ny = y + dy * o;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    const w = cd[ny * W + nx] + c;
                    if (w < v) v = w;
                }
                cd[i] = v;
            }
        }
        const wf = Float32Array.from(open), nb = Float32Array.from(blk);
        K.boxBlur(wf, W, H, 3);   // (the water round a cell, ~6 cells: below half - a bay, above - a cape)
        K.boxBlur(nb, W, H, 1);   // (the no-ground cells round a cell, ~2 cells)
        const w = window.SwiatData && SwiatData.maps && SwiatData.maps[$gameMap.mapId()];   // (the world's coordinates: the same field on both sides of a map's edge)
        G = { key, data: d, tileset: $gameMap.tilesetId(), season: T.time.season(), W, H, type, kind, el, cd, wf, nb, road, plank, strip: stripMap(), ox: w ? w[0] * TW : 0, oy: w ? w[1] * TW : 0 };
        kept.push(G);
        while (kept.length > KEEP) kept.shift();
        stat.geoMs = performance.now() - t0;
        return G;
    }
    // a cell field at a map pixel, smooth between the cells' middles (clamped at the edges)
    function cellAt(a, g, px, py) {
        const fx = px / TW - 0.5, fy = py / TW - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0, W = g.W, H = g.H;
        const x1 = clamp(x0 + 1, 0, W - 1), y1 = clamp(y0 + 1, 0, H - 1), xa = clamp(x0, 0, W - 1), ya = clamp(y0, 0, H - 1);
        return (a[ya * W + xa] * (1 - ax) + a[ya * W + x1] * ax) * (1 - ay) + (a[y1 * W + xa] * (1 - ax) + a[y1 * W + x1] * ax) * ay;
    }

    // ------------------------------------------------------------------
    // The ground pixels of the map's own sheet (the earth's grain makes the sand's grain; grass and earth for the transitions)
    // ------------------------------------------------------------------
    let TEX = null, TEXKEY = "";
    function textures() {
        const key = ($gameMap.tileset().tilesetNames || [])[1] + "|" + T.time.season();
        if (TEX && TEXKEY === key) return TEX;
        const grass = K.srcOf(K.descOf(2816)), dirt = K.srcOf(K.descOf(3200));
        if (!grass || !dirt) return null;
        const lum = new Float32Array(2304);
        let m = 0, s2 = 0;
        for (let i = 0; i < 2304; i++) { lum[i] = dirt[i * 4] * 0.3 + dirt[i * 4 + 1] * 0.59 + dirt[i * 4 + 2] * 0.11; m += lum[i]; }
        m /= 2304;
        for (let i = 0; i < 2304; i++) { lum[i] -= m; s2 += lum[i] * lum[i]; }
        const sd = Math.sqrt(s2 / 2304) || 1;
        for (let i = 0; i < 2304; i++) lum[i] /= sd;   // (the grain: mean 0, spread 1)
        TEXKEY = key;
        const gavg = [0, 0, 0];
        for (let i = 0; i < 2304; i++) { gavg[0] += grass[i * 4]; gavg[1] += grass[i * 4 + 1]; gavg[2] += grass[i * 4 + 2]; }
        for (let c = 0; c < 3; c++) gavg[c] /= 2304;
        return (TEX = { grass, dirt, lum, gavg });
    }

    // ------------------------------------------------------------------
    // The waterline of a piece: the water mask blurred and bent by the world's noise (CzerwonaWoda.buildFieldCore's numbers), then the signed
    // distance to it (px; > 0 on the land). The window is the piece and 26 texels round it: what a piece reads is the same in every piece.
    // ------------------------------------------------------------------
    const SHORE_GROW = 0.3;
    function waterline(g, X0, Y0) {
        const t0 = performance.now(), N = WIN * WIN, WX0 = X0 - MG * Q, WY0 = Y0 - MG * Q;
        const f = new Float32Array(N), pier = new Uint8Array(N), tt = new Uint8Array(N);
        let hasPier = false;
        for (let ty = 0; ty < WIN; ty++) {
            const cy = clamp(Math.floor((WY0 + (ty + 0.5) * Q) / TW), 0, g.H - 1);
            for (let tx = 0; tx < WIN; tx++) {
                const cx = clamp(Math.floor((WX0 + (tx + 0.5) * Q) / TW), 0, g.W - 1), t = g.type[cy * g.W + cx], i = ty * WIN + tx;
                tt[i] = t; f[i] = t === 1 ? 1 : 0;
                if (t === 2) { pier[i] = 1; hasPier = true; }
            }
        }
        K.boxBlur(f, WIN, WIN, BLUR_R);
        const dP = hasPier ? K.chamfer(pier, WIN, WIN) : null, wm = new Uint8Array(N), lm = new Uint8Array(N);
        // (the free maps - no CzerwonaWoda strip to draw the sea where the line would cut the land - bend the line more and grow the land more (the bend never beats the growth): the line never cuts into a tile of land)
        const NS = g.strip ? 1 : 1.7, GR = g.strip ? SHORE_GROW : 0.7;
        for (let ty = 0; ty < WIN; ty++) for (let tx = 0; tx < WIN; tx++) {
            const i = ty * WIN + tx, fi = f[i];
            if (fi < 0.0001 || fi > 0.9999) { wm[i] = fi > 0.5 ? 1 : 0; lm[i] = wm[i] ? 0 : 1; continue; }
            const px = WX0 + (tx + 0.5) * Q, py = WY0 + (ty + 0.5) * Q, qx = px + g.ox, qy = py + g.oy;
            const n = (vn(qx, qy, 150, 31) - 0.5) * 0.36 + (vn(qx, qy, 58, 37) - 0.5) * 0.28 + (vn(qx, qy, 22, 41) - 0.5) * 0.14;
            let e = Math.min(1, 4 * fi * (1 - fi));
            if (dP) { const cells = dP[i] / 3 * Q / TW, k = clamp((cells - 2) / 2, 0, 1); if (k === 0) { wm[i] = tt[i] === 1 ? 1 : 0; lm[i] = wm[i] ? 0 : 1; continue; } e *= k; }
            wm[i] = fi + e * (n * NS - GR) > 0.5 ? 1 : 0; lm[i] = wm[i] ? 0 : 1;
        }
        if (!g.strip) {   // (the free maps: the land grown out 14-16 px keeps the water's corners sharp - a second, tighter blur rounds them; the grown line is far enough out for it never to reach the old land)
            const f2 = new Float32Array(N);
            for (let i = 0; i < N; i++) f2[i] = wm[i];
            K.boxBlur(f2, WIN, WIN, BLUR2);
            for (let i = 0; i < N; i++) {
                const kk = dP ? smooth(3, 7, dP[i] / 3 * Q / TW) : 1;   // (the pier's edges stay as they are, the rounding comes in over four cells)
                if (kk <= 0) continue;
                wm[i] = lerp(wm[i], f2[i], kk) > 0.5 ? 1 : 0; lm[i] = wm[i] ? 0 : 1;
            }
        }
        const dW = K.chamfer(wm, WIN, WIN), dL = K.chamfer(lm, WIN, WIN), sd = new Float32Array(N);
        for (let i = 0; i < N; i++) sd[i] = wm[i] ? -(dL[i] / 3 - 0.5) * Q : (dW[i] / 3 - 0.5) * Q;
        if (!g.strip) {   // (the free maps: the blurred mask's contour hardly moves with the noise - the line is bent in the distance itself, -6..+8 px; the growth of 12+ px keeps it off the old land)
            for (let ty = 0; ty < WIN; ty++) for (let tx = 0; tx < WIN; tx++) {
                const i = ty * WIN + tx;
                if (sd[i] < -40 || sd[i] > 40) continue;
                const kk = dP ? smooth(3, 7, dP[i] / 3 * Q / TW) : 1;
                if (kk <= 0) continue;
                const qx = WX0 + (tx + 0.5) * Q + g.ox, qy = WY0 + (ty + 0.5) * Q + g.oy;
                sd[i] += kk * (clamp((0.5 * vn(qx, qy, 170, 71) + 0.3 * vn(qx, qy, 72, 72) + 0.2 * vn(qx, qy, 30, 73) - 0.5) * 2.4 + 0.5, 0, 1) * 14 - 6);
            }
        }
        stat.fieldMs += performance.now() - t0;
        return sd;
    }

    // ------------------------------------------------------------------
    // A piece: the fields at texel level, then the pixels
    // ------------------------------------------------------------------
    const buf = new Uint8ClampedArray(CH * CH * 4);
    const F = { sd: new Float32Array(FN * FN), ss: new Float32Array(FN * FN), gg: new Float32Array(FN * FN), el: new Float32Array(FN * FN), pn: new Float32Array(FN * FN), pg: new Float32Array(FN * FN),
        tn: new Float32Array(FN * FN), em: new Float32Array(FN * FN), po: new Float32Array(FN * FN), gp: new Float32Array(FN * FN), rw: new Float32Array(FN * FN), ww: new Float32Array(FN * FN), rm: new Float32Array(FN * FN), wk: new Float32Array(FN * FN), act: new Uint8Array(FN * FN) };
    const winterMix = () => { const s = T.time.season(); return s === 3 ? 0.34 : s === 2 ? 0.1 : 0; };
    function sampleF(a, k, wx, wy) { return a[k] * (1 - wx) * (1 - wy) + a[k + 1] * wx * (1 - wy) + a[k + FN] * (1 - wx) * wy + a[k + FN + 1] * wx * wy; }

    function bakePiece(g, tex, ccx, ccy, bm) {
        const t0 = performance.now(), X0 = ccx * CH, Y0 = ccy * CH;
        // quick: nothing near water or too far inland
        const cx0 = Math.max(0, Math.floor(X0 / TW) - 1), cx1 = Math.min(g.W - 1, Math.floor((X0 + CH) / TW) + 1), cy0 = Math.max(0, Math.floor(Y0 / TW) - 1), cy1 = Math.min(g.H - 1, Math.floor((Y0 + CH) / TW) + 1);
        let mn = 999;
        for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) { const v = g.cd[y * g.W + x]; if (v < mn) mn = v; }
        if (mn > 11) { stat.empty++; return false; }
        const sdW = waterline(g, X0, Y0), strip = g.strip, wtr = winterMix();
        const t1 = performance.now();
        // ---- the fields (texels FB outside the piece too)
        let any = false;
        for (let ty = -FB; ty < CT + FB; ty++) for (let tx = -FB; tx < CT + FB; tx++) {
            const k = (ty + FB) * FN + tx + FB, px = X0 + (tx + 0.5) * Q, py = Y0 + (ty + 0.5) * Q, gx = px + g.ox, gy = py + g.oy;
            let sdv = sdW[(ty + MG) * WIN + tx + MG];
            const cdp = cellAt(g.cd, g, px, py) * TW - TW / 2 + 14;   // (the free line lies ~14 px out in the old water)
            const dd = sdv < SD_FAR - 24 ? sdv : lerp(sdv, cdp, smooth(SD_FAR - 24, SD_FAR, sdv));
            F.sd[k] = sdv;
            const reachMax = 560;
            if (dd < -10 || dd > reachMax) { F.act[k] = 0; F.ss[k] = -1; F.gg[k] = 9; F.gp[k] = 0; F.pg[k] = 0.5; F.em[k] = 0; continue; }   // (out of reach: far inland - grass wanted, nothing painted; a -1 here drew a thin stepped line of earth along the edge of the worked-out blocks)
            // widths: the beach by bays / capes (the water round) and the no-ground cells near (rocks, walls, the pier)
            const bf = clamp(1 + (0.5 - cellAt(g.wf, g, px, py)) * 3.2, 0.35, 1.75), nbk = cellAt(g.nb, g, px, py);
            const nA = vn(gx, gy, 330, 11), nB = vn(gx, gy, 120, 12), nC = strip ? 0 : vn(gx, gy, 190, 13), nD = strip ? 0 : vn(gx, gy, 150, 14);
            let S = bf * (28 + 112 * smooth(0.12, 0.88, nA));
            S *= 1 - smooth(0.06, 0.34, nbk) * 0.93;
            const M1 = 36 + 44 * nB, E = 14 + 56 * nC, M2 = 60 + 70 * nD;
            const warp = 20 * (vn(gx, gy, 72, 15) - 0.5) * 2 + 7 * (vn(gx, gy, 26, 16) - 0.5) * 2, u = dd + warp;
            const rd = cellAt(g.road, g, px, py), ss = (S + M1 - u) / M1 - 0.5 * rd, gg = strip ? -1 : (u - (S + M1 + E)) / M2;   // (less sand on a road: it drifts a little onto it)
            const ww = 6.5 + 7 * vn(gx, gy, 44, 17) + 4 * (vn(gx, gy, 17, 18) - 0.5);
            F.ss[k] = ss; F.gg[k] = gg;
            F.pn[k] = clamp(((0.45 * vn(gx, gy, 15, 31) + 0.4 * vn(gx, gy, 7, 32) + 0.15 * vn(gx, gy, 38, 35)) - 0.5) * 1.9 + 0.5, 0.06, 0.94);
            if (!strip) F.pg[k] = clamp(((0.55 * vn(gx, gy, 24, 33) + 0.45 * vn(gx, gy, 10, 34)) - 0.5) * 1.7 + 0.5, 0.06, 0.94);
            F.tn[k] = 0.6 * vn(gx, gy, 150, 41) + 0.4 * vn(gx, gy, 52, 42);
            F.rw[k] = vn(gx, gy, 48, 51); F.rm[k] = vn(gx, gy, 130, 52);
            F.wk[k] = vn(gx, gy, 70, 61);
            F.ww[k] = ww;
            // the sand's edge by a cell that is no ground: it wanders 3-17 px inside the ground's cell and fades over ~9 px
            F.em[k] = clamp((cellAt(g.el, g, px, py) - (0.54 + 0.34 * clamp(((0.6 * vn(gx, gy, 34, 36) + 0.4 * vn(gx, gy, 13, 37)) - 0.5) * 2.1 + 0.5, 0, 1))) / 0.18, 0, 1);
            F.po[k] = 1 - smooth(0.02, 0.2, cellAt(g.plank, g, px, py));
            F.gp[k] = 1 - smooth(0.05, 0.2, nbk);   // (no earth / grass painted near walls, rocks, cliffs, yards: those cells keep their own ground)
            F.act[k] = (ss > -0.3 || gg > -0.3 || (!strip && gg > -9 && u < S + M1 + E + M2)) ? 1 : 0;
            if (F.act[k]) any = true;
        }
        const t2 = performance.now(); stat.texMs += t2 - t1;
        if (!any) { stat.empty++; return false; }
        if (window.PLAZA_DBG) (window.__plzDbg || (window.__plzDbg = {}))[ccx + "," + ccy] = { X0, Y0, sd: Float32Array.from(F.sd), ss: Float32Array.from(F.ss), em: Float32Array.from(F.em), po: Float32Array.from(F.po), sdW: Float32Array.from(sdW) };
        // ---- the pixels
        buf.fill(0);
        const grassT = tex.grass, dirtT = tex.dirt, lumT = tex.lum, FSD = F.sd, FSS = F.ss, FPN = F.pn, FEM = F.em, FPO = F.po;
        let wrote = 0;
        for (let by = 0; by < CT; by++) for (let bx = 0; bx < CT; bx++) {
            const kb = (by + FB) * FN + bx + FB;
            if (!(F.act[kb] || F.act[kb + 1] || F.act[kb + FN] || F.act[kb + FN + 1] || F.act[kb - 1] || F.act[kb - FN] || F.act[kb - FN - 1] || F.act[kb + FN - 1] || F.act[kb - FN + 1])) continue;
            for (let sy = 0; sy < Q; sy++) for (let sx = 0; sx < Q; sx++) {
                const lx = bx * Q + sx, ly = by * Q + sy, px = X0 + lx, py = Y0 + ly;
                // bilinear between the texels' middles: the weights once for every field
                const wx = (sx + 0.5) / Q + (sx < 2 ? 0.5 : -0.5), wy = (sy + 0.5) / Q + (sy < 2 ? 0.5 : -0.5), k = (by + (sy < 2 ? -1 : 0) + FB) * FN + bx + (sx < 2 ? -1 : 0) + FB;
                const w00 = (1 - wx) * (1 - wy), w10 = wx * (1 - wy), w01 = (1 - wx) * wy, w11 = wx * wy, k1 = k + 1, k2 = k + FN, k3 = k + FN + 1;
                const ss = FSS[k] * w00 + FSS[k1] * w10 + FSS[k2] * w01 + FSS[k3] * w11;
                const cell = g.kind[Math.min(g.H - 1, (py / TW) | 0) * g.W + Math.min(g.W - 1, (px / TW) | 0)];
                const ground = !strip && (cell === 1 || cell === 2);
                if (ss <= -0.85 && !ground) continue;
                const s = FSD[k] * w00 + FSD[k1] * w10 + FSD[k2] * w01 + FSD[k3] * w11;
                if (s < -2.8) continue;
                // ---- the sand
                let sa = 0;
                if (ss > -0.85) {
                    const pn = FPN[k] * w00 + FPN[k1] * w10 + FPN[k2] * w01 + FPN[k3] * w11, tt = ss - pn + (ph(px, py, 2) - 0.5) * 0.07;   // (a little dither: the patches' edges are ragged, not the texels' facets)
                    sa = tt <= -0.07 ? 0 : tt >= 0.07 ? 1 : (tt + 0.07) / 0.14;
                    sa = sa * sa * (3 - 2 * sa);
                    if (ss < 0.2) { const hh = Math.max(0, (ss + 0.85) / 1.05), halo = 0.3 * hh * hh * (3 - 2 * hh); if (halo > sa) sa = halo; }   // (a sandy dust round the patches: no hard blots)
                    else if (sa < 0.3) sa = 0.3;
                    sa *= FEM[k] * w00 + FEM[k1] * w10 + FEM[k2] * w01 + FEM[k3] * w11;   // (the edge by a cell that is no ground)
                    if (s < -1) sa *= clamp((s + 2.8) / 1.8, 0, 1) * (FPO[k] * w00 + FPO[k1] * w10 + FPO[k2] * w01 + FPO[k3] * w11);   // (a little over the water's edge hides the outline; not round a pier)
                }
                const o = (ly * CH + lx) * 4;
                let r = 0, gr = 0, b = 0, a = 0;
                // ---- the ground: earth over grass cells, grass over earth cells, by the distance (free maps only)
                if (ground) {
                    const gg = F.gg[k] * w00 + F.gg[k1] * w10 + F.gg[k2] * w01 + F.gg[k3] * w11, pg = F.pg[k] * w00 + F.pg[k1] * w10 + F.pg[k2] * w01 + F.pg[k3] * w11;
                    const wantGrass = clamp((gg - pg) / 0.14 + 0.5, 0, 1);   // 1: grass, 0: earth
                    if ((cell === 2 && wantGrass > 0.02) || (cell === 1 && wantGrass < 0.98 && gg > -8)) {
                        const gp = F.gp[k] * w00 + F.gp[k1] * w10 + F.gp[k2] * w01 + F.gp[k3] * w11, ti = ((py % TW) * TW + (px % TW)) * 4;
                        if (cell === 2) {   // earth tile, grass wanted
                            r = grassT[ti]; gr = grassT[ti + 1]; b = grassT[ti + 2]; a = wantGrass * gp;
                            const dry = smooth(380, 150, s) * 0.6;   // (Laka's dry grass by the water: less blue, a little red)
                            r += 11 * dry; gr += 2 * dry; b *= 1 - 0.17 * dry; gr *= 1 - 0.03 * dry;
                        } else { r = dirtT[ti]; gr = dirtT[ti + 1]; b = dirtT[ti + 2]; a = (1 - wantGrass) * gp; }   // grass tile, earth wanted
                    }
                }
                if (sa > 0.004) {
                    const ti = (py % TW) * TW + (px % TW), grain = lumT[ti], pn = FPN[k] * w00 + FPN[k1] * w10 + FPN[k2] * w01 + FPN[k3] * w11;
                    const tone = F.tn[k] * w00 + F.tn[k1] * w10 + F.tn[k2] * w01 + F.tn[k3] * w11, ww = F.ww[k] * w00 + F.ww[k1] * w10 + F.ww[k2] * w01 + F.ww[k3] * w11, h1 = ph(px, py, 1);
                    // wet sand: darker, by the water; the wet line is bent
                    const wetMix = 1 - smooth(ww - 2.5, ww + 1.5, s);
                    let cr = DRY_A[0] + (DRY_B[0] - DRY_A[0]) * tone, cg = DRY_A[1] + (DRY_B[1] - DRY_A[1]) * tone, cb = DRY_A[2] + (DRY_B[2] - DRY_A[2]) * tone;
                    const gk = grain * 3.4 + (h1 - 0.5) * 8 + (h1 < 0.03 ? -13 : h1 > 0.975 ? 9 : 0);
                    cr += gk; cg += gk * 0.95; cb += gk * 0.8;
                    // wind ripples in the dry sand (1 px light / dark lines parallel to the shore, in patches)
                    if (s > ww + 6) {
                        const rm = F.rm[k] * w00 + F.rm[k1] * w10 + F.rm[k2] * w01 + F.rm[k3] * w11;
                        if (rm > 0.46) {
                            const rwv = F.rw[k] * w00 + F.rw[k1] * w10 + F.rw[k2] * w01 + F.rw[k3] * w11, rp = Math.sin(s * 0.66 + rwv * 16), ra = smooth(0.46, 0.66, rm) * smooth(ww + 6, ww + 24, s);
                            if (rp > 0.62) { const q = 5 * ra; cr += q; cg += q; cb += q * 0.9; } else if (rp < -0.72) { const q = 5 * ra; cr -= q; cg -= q; cb -= q * 0.9; }
                        }
                    }
                    // the wet strip
                    if (wetMix > 0) {
                        const wt = clamp(s / Math.max(1, ww), 0, 1), wr = lerp(WET_A[0], WET_B[0], wt) + gk * 0.6, wg = lerp(WET_A[1], WET_B[1], wt) + gk * 0.55, wb = lerp(WET_A[2], WET_B[2], wt) + gk * 0.5;
                        cr = lerp(cr, wr, wetMix); cg = lerp(cg, wg, wetMix); cb = lerp(cb, wb, wetMix);
                        if (wetMix > 0.5 && s > 0.8 && h1 > 0.984) { cr = lerp(cr, GLOSS[0], 0.38); cg = lerp(cg, GLOSS[1], 0.38); cb = lerp(cb, GLOSS[2], 0.38); }   // (a glossy speck)
                    }
                    if (ss < 1) {
                        // mixing into the earth: the sand dulls a little towards the patches' edge
                        const m = (1 - (ss < 0 ? 0 : ss)) * 0.3, er = dirtT[ti * 4], eg = dirtT[ti * 4 + 1], eb = dirtT[ti * 4 + 2]; cr = lerp(cr, er * 1.35, m); cg = lerp(cg, eg * 1.35, m); cb = lerp(cb, eb * 1.3, m);
                    }
                    if (wtr > 0) { cr = lerp(cr, 228, wtr); cg = lerp(cg, 224, wtr); cb = lerp(cb, 214, wtr); }
                    if (ss < 1.15 && ss > 0.04) { const tt2 = ss - pn; if (tt2 > 0.05 && tt2 < 0.17) { const q = 1 - 0.09 * (1 - Math.abs(tt2 - 0.11) / 0.06); cr *= q; cg *= q; cb *= q; } }   // (a thin shaded rim to a patch of sand)
                    // composite over the ground colour
                    const oa = sa + a * (1 - sa);
                    r = (cr * sa + r * a * (1 - sa)) / oa; gr = (cg * sa + gr * a * (1 - sa)) / oa; b = (cb * sa + b * a * (1 - sa)) / oa; a = oa;
                }
                if (a > 0.003) { buf[o] = r; buf[o + 1] = gr; buf[o + 2] = b; buf[o + 3] = a * 255; wrote++; }
            }
        }
        // ---- the tiny details: pebbles, shell bits, the line of dry seaweed (stamped from a fixed grid of the world: every piece draws the same ones)
        const t3 = performance.now(); stat.pixMs += t3 - t2;
        if (wrote) wrote += stamps(g, X0, Y0) + weeds(g, X0, Y0);
        wrote += tufts(g, tex, X0, Y0);
        stat.stampMs += performance.now() - t3;
        if (!wrote) { stat.empty++; return false; }
        bm.context.putImageData(new ImageData(buf, CH, CH), 0, 0);
        if (bm._baseTexture && bm._baseTexture.update) bm._baseTexture.update();
        stat.bakeMs += performance.now() - t0; stat.baked++;
        return true;
    }
    function putPx(X0, Y0, x, y, c, al) {
        const lx = x - X0, ly = y - Y0;
        if (lx < 0 || ly < 0 || lx >= CH || ly >= CH) return 0;
        const o = (ly * CH + lx) * 4;
        if (buf[o + 3] < 150) return 0;   // (only on sand that is there)
        buf[o] = lerp(buf[o], c[0], al); buf[o + 1] = lerp(buf[o + 1], c[1], al); buf[o + 2] = lerp(buf[o + 2], c[2], al);
        return 1;
    }
    function stamps(g, X0, Y0) {
        const GS = 22;   // the grid of the details (px)
        let n = 0;
        const gx0 = Math.floor((X0 - 8) / GS), gx1 = Math.floor((X0 + CH + 8) / GS), gy0 = Math.floor((Y0 - 8) / GS), gy1 = Math.floor((Y0 + CH + 8) / GS);
        for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
            const wgx = gx + Math.round(g.ox / GS), wgy = gy + Math.round(g.oy / GS);   // (the world's grid cell: the same pebble on both sides of a map's edge)
            const x = Math.floor(gx * GS + 2 + ph(wgx, wgy, 71) * (GS - 4)), y = Math.floor(gy * GS + 2 + ph(wgx, wgy, 72) * (GS - 4));
            // the sand and the distance at the spot, from the piece's fields
            const lx = x - X0, ly = y - Y0;
            if (lx < -FB * Q + 2 || ly < -FB * Q + 2 || lx >= CH + FB * Q - 2 || ly >= CH + FB * Q - 2) continue;
            const u = (lx + 0.5) / Q - 0.5, v = (ly + 0.5) / Q - 0.5, ix = Math.floor(u), iy = Math.floor(v), wx = u - ix, wy = v - iy, k = (iy + FB) * FN + ix + FB;
            const s = sampleF(F.sd, k, wx, wy), ss = sampleF(F.ss, k, wx, wy), ww = sampleF(F.ww, k, wx, wy), wk = sampleF(F.wk, k, wx, wy);
            if (ss < 0.7 || s < 1) continue;
            const r = ph(wgx, wgy, 73);
            if (s > ww + 6 && r < 0.075 * smooth(0.7, 1.2, ss)) {   // a pebble: 2-3 x 2 px, a light top, a dark foot
                const w = r < 0.03 ? 3 : 2, c = ph(wgx, wgy, 74) < 0.5 ? PEBBLE : [PEBBLE[0] - 12, PEBBLE[1] - 12, PEBBLE[2] - 10];
                for (let i = 0; i < w; i++) { n += putPx(X0, Y0, x + i, y, [c[0] + 20, c[1] + 20, c[2] + 18], 0.92); n += putPx(X0, Y0, x + i, y + 1, c, 0.92); }
                n += putPx(X0, Y0, x + 1, y + 2, [92, 84, 72], 0.7); n += putPx(X0, Y0, x + w, y + 1, [112, 104, 92], 0.55);
            } else if (s > ww + 6 && r > 0.955 - 0.02 * smooth(0.7, 1.2, ss) && r < 0.985) {   // a shell bit: 2-3 pale px with a pink one
                n += putPx(X0, Y0, x, y, SHELL, 0.95); n += putPx(X0, Y0, x + 1, y, SHELL, 0.95);
                if (ph(wgx, wgy, 75) < 0.6) n += putPx(X0, Y0, x + 1, y + 1, SHELL2, 0.85);
                if (ph(wgx, wgy, 76) < 0.4) n += putPx(X0, Y0, x + 2, y, SHELL2, 0.8);
            }
        }
        return n;
    }

    // a pixel over whatever is there (the tufts lie on bare earth too)
    function putAny(X0, Y0, x, y, c, al) {
        const lx = x - X0, ly = y - Y0;
        if (lx < 0 || ly < 0 || lx >= CH || ly >= CH) return 0;
        const o = (ly * CH + lx) * 4, a0 = buf[o + 3] / 255, oa = al + a0 * (1 - al);
        buf[o] = (c[0] * al + buf[o] * a0 * (1 - al)) / oa; buf[o + 1] = (c[1] * al + buf[o + 1] * a0 * (1 - al)) / oa; buf[o + 2] = (c[2] * al + buf[o + 2] * a0 * (1 - al)) / oa; buf[o + 3] = oa * 255;
        return 1;
    }
    const fieldAt = (a, X0, Y0, x, y) => {   // a piece's texel field at a map pixel (null: outside what was worked out)
        const lx = x - X0, ly = y - Y0;
        if (lx < -FB * Q + 2 || ly < -FB * Q + 2 || lx >= CH + FB * Q - 2 || ly >= CH + FB * Q - 2) return null;
        const u = (lx + 0.5) / Q - 0.5, v = (ly + 0.5) / Q - 0.5, ix = Math.floor(u), iy = Math.floor(v), k = (iy + FB) * FN + ix + FB;
        return sampleF(a, k, u - ix, v - iy);
    };
    // the dry seaweed at the high-water mark: short dark strokes in windrows that wander along the shore (a grid of the world: the same in every piece)
    function weeds(g, X0, Y0) {
        const WS = 10;
        let n = 0;
        const gx0 = Math.floor((X0 - 6) / WS), gx1 = Math.floor((X0 + CH + 6) / WS), gy0 = Math.floor((Y0 - 6) / WS), gy1 = Math.floor((Y0 + CH + 6) / WS);
        for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
            const wgx = gx + Math.round(g.ox / WS), wgy = gy + Math.round(g.oy / WS);
            const x = Math.floor(gx * WS + ph(wgx, wgy, 81) * WS), y = Math.floor(gy * WS + ph(wgx, wgy, 82) * WS);
            const wk = fieldAt(F.wk, X0, Y0, x, y);
            if (wk === null || wk < 0.4) continue;
            const s = fieldAt(F.sd, X0, Y0, x, y), ww = fieldAt(F.ww, X0, Y0, x, y), band = Math.abs(s - (ww + 5 + 9 * wk));
            if (band > 4.5 || ph(wgx, wgy, 83) > 0.62 * smooth(0.4, 0.6, wk) * (1 - band / 4.5) || fieldAt(F.ss, X0, Y0, x, y) < 0.9) continue;
            const len = 2 + Math.floor(ph(wgx, wgy, 84) * 4), dy = ph(wgx, wgy, 85) < 0.5 ? 1 : -1, jog = 1 + Math.floor(ph(wgx, wgy, 86) * (len - 1));
            for (let i = 0; i < len; i++) n += putPx(X0, Y0, x + i, y + (i >= jog ? dy : 0), (i + wgx) % 3 === 0 ? WEED_B : WEED_A, 0.9);
        }
        return n;
    }
    // small tufts of grass where the earth breaks up into grass (free maps): 3-4 blades of 3-5 px in the grass's own dark, middle and light
    function tufts(g, tex, X0, Y0) {
        if (g.strip) return 0;
        const gr = tex.gavg, TS = 22, dark = [gr[0] * 0.62, gr[1] * 0.72, gr[2] * 0.62], mid = [gr[0] * 0.95, gr[1] * 1.08, gr[2] * 0.92], light = [gr[0] * 1.18 + 6, gr[1] * 1.28 + 6, gr[2] * 1.05 + 6];
        let n = 0;
        const gx0 = Math.floor((X0 - 6) / TS), gx1 = Math.floor((X0 + CH + 6) / TS), gy0 = Math.floor((Y0 - 8) / TS), gy1 = Math.floor((Y0 + CH + 8) / TS);
        for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
            const wgx = gx + Math.round(g.ox / TS), wgy = gy + Math.round(g.oy / TS);
            if (ph(wgx, wgy, 91) > 0.3) continue;
            const x = Math.floor(gx * TS + 3 + ph(wgx, wgy, 92) * (TS - 6)), y = Math.floor(gy * TS + 3 + ph(wgx, wgy, 93) * (TS - 6));
            const gg = fieldAt(F.gg, X0, Y0, x, y);
            if (gg === null || gg < 0.0 || gg > 1.1) continue;
            const ss = fieldAt(F.ss, X0, Y0, x, y), gp = fieldAt(F.gp, X0, Y0, x, y), cx = (x / TW) | 0, cy = (y / TW) | 0;
            if (ss > 0.1 || gp < 0.7 || cx < 0 || cy < 0 || cx >= g.W || cy >= g.H) continue;
            const kd = g.kind[cy * g.W + cx];
            if (kd !== 1 && kd !== 2) continue;
            const blades = 3 + Math.floor(ph(wgx, wgy, 94) * 2);
            for (let i = 0; i < blades; i++) {
                const hh = 3 + Math.floor(ph(wgx, wgy, 95 + i) * 3), x0 = x + i * 2 - 2, lean = ph(wgx, wgy, 100 + i) < 0.5 ? -1 : 1;
                for (let j = 0; j < hh; j++) n += putAny(X0, Y0, x0 + (j > 2 ? lean : 0), y - j, j < 1 ? dark : j < hh - 1 ? mid : light, 0.95);
            }
        }
        return n;
    }

    // ------------------------------------------------------------------
    // The layer in the tilemap
    // ------------------------------------------------------------------
    function Sprite_Plaza() { this.initialize(...arguments); }
    Sprite_Plaza.prototype = Object.create(Sprite.prototype);
    Sprite_Plaza.prototype.constructor = Sprite_Plaza;
    Sprite_Plaza.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.86;
        this._pieces = new Map(); this._pool = []; this._held = 0; this._key = ""; this._win = ""; this._rain = 0; this._t = 0;
    };
    Sprite_Plaza.prototype.drop = function() {
        for (const p of this._pieces.values()) if (p.spr) { this.removeChild(p.spr); this._pool.push(p.bm); }
        this._pieces.clear(); this._held = 0; this._win = "";
    };
    Sprite_Plaza.prototype.pieceWindow = function() {
        const tw = $gameMap.tileWidth(), dx = $gameMap.displayX() * tw, dy = $gameMap.displayY() * tw, vw = T.view.w(), vh = T.view.h(), m = MARGIN * tw;
        return [Math.floor((dx - m) / CH), Math.floor((dx + vw + m) / CH), Math.floor((dy - m) / CH), Math.floor((dy + vh + m) / CH)];
    };
    // bake the pieces the screen needs; budget: pieces this call (Infinity: all) - true when nothing is left
    Sprite_Plaza.prototype.work = function(budget) {
        if (T.view.scale() !== 1) return true;   // (the eagle's flight: what is baked stays)
        const g = geometry(), tex = g && textures();
        if (!g || !tex) return false;
        const sk = $gameMap.mapId() + "|" + g.key + "|" + stripMap();
        if (sk !== this._key) { this._key = sk; g.strip = stripMap(); this.drop(); budget = Infinity; }
        const [x0, x1, y0, y1] = this.pieceWindow(), win = x0 + "," + x1 + "," + y0 + "," + y1;
        if (win === this._win) return true;
        for (const [k, p] of Array.from(this._pieces)) if (p.cx < x0 - 1 || p.cx > x1 + 1 || p.cy < y0 - 1 || p.cy > y1 + 1) {
            if (p.spr) { this.removeChild(p.spr); this._pool.push(p.bm); this._held--; }
            this._pieces.delete(k);
        }
        let left = true;
        const nx = Math.ceil(g.W * TW / CH), ny = Math.ceil(g.H * TW / CH);
        for (let cy = Math.max(0, y0); cy <= Math.min(ny - 1, y1); cy++) for (let cx = Math.max(0, x0); cx <= Math.min(nx - 1, x1); cx++) {
            const k = cy * 1000 + cx;
            if (this._pieces.has(k)) continue;
            if (budget <= 0) { left = false; continue; }
            if (this._held >= POOL) { left = false; continue; }
            const bm = this._pool.pop() || new Bitmap(CH, CH);
            bm.smooth = false;
            budget--;
            if (!bakePiece(g, tex, cx, cy, bm)) { this._pool.push(bm); this._pieces.set(k, { cx, cy, bm: null, spr: null }); continue; }
            const spr = new Sprite(bm); spr.x = cx * CH; spr.y = cy * CH; spr.update = function() {};
            if (this._rain) spr.tint = 0xBDBDC4;
            this.addChild(spr);
            this._pieces.set(k, { cx, cy, bm, spr });
            this._held++;
        }
        if (left) this._win = win;
        return left;
    };
    Sprite_Plaza.prototype.prepare = function() { return this.work(Infinity); };
    // only the pieces that touch the screen are drawn (the ones baked ahead of it wait hidden: no draw call for them)
    Sprite_Plaza.prototype.cull = function() {
        const vw = T.view.w() + 4, vh = T.view.h() + 4, x = this.x, y = this.y;
        for (const p of this._pieces.values()) if (p.spr) p.spr.visible = p.cx * CH + x < vw && p.cx * CH + x + CH > -4 && p.cy * CH + y < vh && p.cy * CH + y + CH > -4;
    };
    Sprite_Plaza.prototype.rain = function() {   // the rain darkens the sand a little (the sprites' tint; changed only when the weather does)
        const wt = $gameScreen.weatherType(), r = (wt === "rain" || wt === "storm") && $gameScreen.weatherPower() > 0 ? 1 : 0;
        if (r === this._rain) return;
        this._rain = r;
        for (const p of this._pieces.values()) if (p.spr) p.spr.tint = r ? 0xBDBDC4 : 0xFFFFFF;
    };
    Sprite_Plaza.prototype.update = function() {
        const show = here();
        this.visible = show;
        if (!show) { if (this._pieces.size) this.drop(); return; }
        const g = geometry();
        if (!g) return;
        const ox = Math.round(-$gameMap.displayX() * TW), oy = Math.round(-$gameMap.displayY() * TW);
        let moved = false;
        if (ox !== this.x || oy !== this.y) { this.x = ox; this.y = oy; moved = true; }
        const t = this._t++, held = this._held;
        if ((t & 1) === 0) this.work(1);
        if (moved || held !== this._held || this._culled !== this._pieces.size) { this._culled = this._pieces.size; this.cull(); }
        if ((t & 31) === 0) this.rain();
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._plaza = new Sprite_Plaza();
        this._tilemap.addChild(this._plaza);
    };
    // (as the meadow and the shore) the screen's pieces are baked while it is still black - at most ~1.5 s, never stuck
    const _Scene_Map_isReady = Scene_Map.prototype.isReady;
    Scene_Map.prototype.isReady = function() {
        if (!_Scene_Map_isReady.call(this)) return false;
        const s = this._spriteset && this._spriteset._plaza;
        if (!s || !here()) return true;
        this._pzWait = (this._pzWait || 0) + 1;
        return s.prepare() || this._pzWait > 90;
    };

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const spriteOf = () => SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._plaza;
    const api = {
        here, on,
        set(v) { ConfigManager[KEY] = !!v; ConfigManager.save(); return on(); },
        stats() {
            const s = spriteOf(), pieces = s ? s._held : 0, pool = s ? s._pool.length : 0;
            return { pieces, pool, mb: Math.round((pieces + pool) * CH * CH * 4 / 1048576 * 100) / 100, geoMs: Math.round(stat.geoMs * 10) / 10, bakeMs: Math.round(stat.bakeMs * 10) / 10,
                fieldMs: Math.round(stat.fieldMs * 10) / 10, texMs: Math.round(stat.texMs * 10) / 10, pixMs: Math.round(stat.pixMs * 10) / 10, stampMs: Math.round(stat.stampMs * 10) / 10, baked: stat.baked, empty: stat.empty, msPerPiece: stat.baked ? Math.round(stat.bakeMs / stat.baked * 100) / 100 : 0 };
        },
        dbg() { const g = geometry(); return { g: !!g, tex: !!(g && textures()), held: spriteOf()._held, pieces: spriteOf()._pieces.size }; },
        settle() { const s = spriteOf(); return s && here() ? s.prepare() : false; },   // (bake what the screen needs at once - the tests, the screenshots)
        resetStats() { stat.bakeMs = 0; stat.baked = 0; stat.fieldMs = 0; stat.empty = 0; stat.texMs = 0; stat.pixMs = 0; stat.stampMs = 0; },
        redo() { G = null; kept.length = 0; TEX = null; const s = spriteOf(); if (s) { s._key = ""; s.drop(); } },
        Sprite_Plaza
    };
    window.Plaza = T.register(PLUGIN, api);
})();
