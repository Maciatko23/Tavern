//=============================================================================
// Ziemia.js
//=============================================================================
// (2026-10-30, a TRIAL of "a prettier map" on Kruczy Jar, Map003 - the player's own map: its file is not touched, all of it is drawn /
// laid by code and every part is switched off on its own or all together; the player, after the title-screen mock-ups: "make our maps
// look like that"). Why those pictures look better than the map: no visible grid (soft, uneven edges of the ground instead of the
// autotile's steps every 48 px), one light with warm and cool, contact shade under things, details in groups. Here:
//   1. EDGES (this file, "edges"): the borders between the ground kinds of the A2 sheet (grass, darker grass patches, earth path,
//      cobbles...) redrawn as soft noisy lines. Only the cells at a border of two kinds are painted - a kind's field of the cells
//      round it (3 x 3 cells, a box blur, kinds that are not ground count for nothing) against a noise, per pixel the kind with the
//      highest value, its colour from the tile's own interior pixels (TerenKit.js, the method of the shore in CzerwonaWoda.js). The
//      pictures are kept in ONE small pool of atlas bitmaps and painted for the cells round the screen only (a few at a time, the
//      screen's own first while the screen is still black): memory does not grow with the map. Cells with a blocking tile, a wall,
//      an overlay (flowers...) or water are never painted (they stay as they are); the decorations of layers 1-3 are drawn again
//      on top; the farm's soil and the things on the ground (z 1 and up) lie over it.
//   2. SHADE ("shade"): a soft dark contact shade (ambient occlusion) at the foot of trees, rocks, bushes, stumps, buildings and
//      the yard's fence - a dark spot where a thing meets the ground, NOT the sun's shadow (Sky.js, ChoppableTree_Render.js and
//      CharacterPolish.js keep theirs). One small blurred ellipse bitmap, scaled for each foot (its width: the opaque width of the
//      picture's bottom rows).
//   3. MOOD ("mood"): a touch more colour, a cooler shadow / warmer light split and a stronger vignette (Mood.addTweak).
//   4. DECOR ("decor", Ziemia_Ozdoby.js): small groups of things laid as events (tools and a chest by the wall, flowers and stones by
//      the path, a stump with an axe and brushwood at the edge of the forest).
// The switches: Opcje (the rows "Ładniejsza mapa ..."), Ziemia.set("edges" | "shade" | "mood" | "decor" | "on", true / false), or - for
// the tests, before the page loads - window.ZIEMIA = { off: true } / { edges: false, ... }.

/*:
 * @target MZ
 * @plugindesc Próba „ładniejszej mapy” na Kruczym Jarze: miękkie granice gruntu, cień przy ziemi, mocniejsze barwy (Mood). Każda część osobno do wyłączenia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TerenKit
 * @orderAfter Farming_Render
 * @orderAfter Mood
 *
 * @param maps
 * @text Mapy
 * @desc Numery map (po przecinku), na których działa nakładka. Próba: tylko Kruczy Jar (3).
 * @type string
 * @default 3
 *
 * @param on
 * @text Całość włączona
 * @type boolean
 * @default true
 *
 * @param edges
 * @text Miękkie granice gruntu
 * @type boolean
 * @default true
 *
 * @param shade
 * @text Cień przy ziemi
 * @type boolean
 * @default true
 *
 * @param mood
 * @text Mocniejsze barwy i winieta
 * @type boolean
 * @default true
 *
 * @param decor
 * @text Ozdoby w terenie
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Ziemia.js - próba „ładniejszej mapy”
 * ============================================================================
 * Nie zmienia pliku mapy. Wszystko jest rysowane przez wtyczkę (grunt, cień),
 * dokładane w locie (ozdoby: Ziemia_Ozdoby.js) albo dopisane do barw (Mood).
 *
 * Przełączniki (Opcje -> wiersze „Ładniejsza mapa ...”; w kodzie):
 *   Ziemia.set("on", false)      cała próba wyłączona,
 *   Ziemia.set("edges" | "shade" | "mood" | "decor", false)   jedna część,
 *   ozdoby (zdarzenia) znikają/wracają po ponownym wejściu na mapę (Ziemia.reload()).
 * Do testów, przed wczytaniem strony: window.ZIEMIA = { off: true } albo { edges: false }.
 *
 * Granice: kafle z blokadą przejścia, ściany, płoty, schody, woda i nakładki
 * (kwiaty) zostają widoczne - nie są zamalowywane; pole uprawne (grządki, gleba)
 * leży nad gruntem i nic nie traci.
 *
 * Dla innych wtyczek i testów: Ziemia.on(klucz), Ziemia.set, Ziemia.here(),
 * Ziemia.stats() (komórki, atlasy, MB, czas malowania), Ziemia.reload().
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Ziemia.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const K = T.api("TerenKit");
    if (!K) throw new Error("Ziemia.js: brak TerenKit.js - musi stać wyżej na liście wtyczek (the shared ground tools are missing)");
    const PLUGIN = "Ziemia";
    const params = PluginManager.parameters(PLUGIN);
    const bool = (v, d) => (v === undefined || v === null || v === "" ? d : String(v) !== "false");
    const MAPS = String(params.maps === undefined || params.maps === "" ? "3" : params.maps).split(/[^0-9]+/).filter(Boolean).map(Number);
    const DEF = { on: bool(params.on, true), edges: bool(params.edges, true), shade: bool(params.shade, true), mood: bool(params.mood, true), decor: bool(params.decor, true) };
    const KEYS = { on: "ziemiaOn", edges: "ziemiaEdges", shade: "ziemiaShade", mood: "ziemiaMood", decor: "ziemiaDecor" };
    const ROWS = [["Ładniejsza mapa (próba)", "on"], ["  miękkie granice gruntu", "edges"], ["  cień przy ziemi", "shade"], ["  barwy i winieta", "mood"], ["  ozdoby w terenie", "decor"]];
    const { hash, vnoise, boxBlur } = K;

    // ------------------------------------------------------------------
    // The switches (the config file; window.ZIEMIA overrides them - the tests)
    // ------------------------------------------------------------------
    for (const k in KEYS) if (ConfigManager[KEYS[k]] === undefined) ConfigManager[KEYS[k]] = DEF[k];
    const _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _makeData.call(this);
        for (const k in KEYS) config[KEYS[k]] = this[KEYS[k]] === undefined ? DEF[k] : this[KEYS[k]];
        return config;
    };
    const _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _applyData.call(this, config);
        for (const k in KEYS) { const v = config ? config[KEYS[k]] : undefined; this[KEYS[k]] = v === undefined ? DEF[k] : !!v; }
    };
    function on(k) {
        const o = window.ZIEMIA;
        if (o && o.off) return false;
        if (o && o[k] !== undefined) return !!o[k];
        const cfg = key => (ConfigManager[KEYS[key]] === undefined ? DEF[key] : !!ConfigManager[KEYS[key]]);
        return k === "on" ? cfg("on") : cfg("on") && cfg(k);
    }
    function set(k, v) {
        if (!KEYS[k]) return false;
        ConfigManager[KEYS[k]] = !!v;
        return on(k);
    }
    const _addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _addGeneralOptions.call(this);
        const main = on("on");
        for (const [name, k] of ROWS) this._list.push({ name, symbol: KEYS[k], enabled: k === "on" || main, ext: null });
    };
    const SYMBOLS = Object.values(KEYS);
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (SYMBOLS.includes(symbol)) return this.getConfigValue(symbol) ? "Wł" : "Wył";
        return _statusText.call(this, index);
    };
    const _changeValue = Window_Options.prototype.changeValue;
    Window_Options.prototype.changeValue = function(symbol, value) {
        const before = this.getConfigValue(symbol);
        _changeValue.call(this, symbol, value);
        if (symbol === KEYS.on && before !== this.getConfigValue(symbol)) { const i = this.index(); this.refresh(); this.select(i); }
    };
    const _restoreDefaults = Window_Options.prototype.restoreDefaultValues;
    if (_restoreDefaults) Window_Options.prototype.restoreDefaultValues = function() { _restoreDefaults.call(this); for (const k in KEYS) ConfigManager[KEYS[k]] = DEF[k]; };

    const has = () => !!(window.$gameMap && window.$dataMap);
    const gfxOk = () => { const W = T.api("Wydajnosc"); return !(W && W.gfx && W.gfx.mood === false); };   // (Niska: no mood at all - nor this)
    const here = () => has() && (MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.ZIEMIA_ALL) && gfxOk();
    const TW = 48;

    // ------------------------------------------------------------------
    // 1. EDGES
    // ------------------------------------------------------------------
    // the A2 ground kinds that are blended: grass (several), earth, cobbles, mud stones - walls, planks, water, flowers and the blank are not
    const ALLOW = new Set([0, 1, 3, 4, 5, 8, 9, 10, 11, 15, 18, 19, 20, 21, 23, 30]);
    const OVERLAY = new Set([12, 13, 31]);   // soft overlays of the A2 sheet (flowers, the feather pieces): the ground is painted, the overlay's own pieces drawn again on top
    const TX = 4, CT = TW / TX, WT = CT * 3, RT = CT + 2;   // a texel 4 px, a cell 12 texels, the window 3 cells, the sampled ring 14 texels
    // blur radius in texels (twice), noise strength, the pixel speckle, the width of the feather at a line, and how much more a small patch's
    // edge pieces count (they are faint: else it melts away in the blur)
    const R_BLUR = 4, AMP = 0.7, JIT = 0.08, SOFT = 0.16, PATCH_BOOST = 1.3;
    const AT_N = 10, AT_PX = AT_N * TW, AT_MAX = 12;        // atlas bitmaps of 10 x 10 cells (1 MB each), at most 12 = 1200 cells
    const MARGIN = 5, RELEASE = 8;                          // cells round the screen kept painted / given back
    const stat = { paintMs: 0, cells: 0, frames: 0 };
    const relOf = id => (id >= 2816 && id < 4352 ? Math.floor((id - 2816) / 48) : -1);

    // the per-pixel interpolation of the ring (14 x 14 texels, the cell's own are 1..12): index of the texel below-left and the weight
    const PIX_I = new Int8Array(TW), PIX_F = new Float32Array(TW);
    for (let p = 0; p < TW; p++) { const u = (p + 0.5) / TX - 0.5, i = Math.floor(u); PIX_I[p] = i + 1; PIX_F[p] = u - i; }
    const DITH = new Float32Array(4096);
    for (let i = 0; i < 4096; i++) DITH[i] = hash(i & 63, i >> 6, 71, 5);
    const sInd = [0, 1, 2, 3].map(() => new Float32Array(WT * WT)), sKnown = new Float32Array(WT * WT);
    const sD = [0, 1, 2, 3].map(() => new Float32Array(RT * RT)), sV = new Float32Array(4);
    let sImg = null;
    const noiseAt = (px, py, k) => 0.6 * vnoise(px, py, 72, k * 7 + 11) + 0.4 * vnoise(px, py, 26, k * 13 + 5);

    // the map's ground kinds (once per map; kept while the next map is read again: back from the menu)
    let ST = null;
    function dataKey() {
        let h = 0; const d = $dataMap.data || [];
        for (let i = 0; i < d.length; i++) h = (Math.imul(h, 31) + d[i]) | 0;
        return $gameMap.mapId() + ":" + $gameMap.tilesetId() + ":" + $gameMap.width() + "x" + $gameMap.height() + ":" + h;
    }
    function dropState() {
        if (!ST) return;
        for (const a of ST.atlases) a.bm.destroy();
        ST = null;
    }
    function geometry() {
        if (ST && ST.map === $dataMap) return ST;
        const key = dataKey();
        if (ST && ST.key === key) { ST.map = $dataMap; return ST; }
        dropState();
        const W = $gameMap.width(), H = $gameMap.height(), flags = $gameMap.tilesetFlags(), kind = new Uint8Array(W * H), rels = [];
        const ovs = new Uint16Array(W * H), can = new Uint8Array(W * H), k0s = new Uint8Array(W * H), k1s = new Uint8Array(W * H), shp = new Uint8Array(W * H), shape = id => (id - 2816) % 48;
        const kindIdx = r => { let k = rels.indexOf(r) + 1; if (!k) k = rels.push(r); return k; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const t0 = $gameMap.tileId(x, y, 0), t1 = $gameMap.tileId(x, y, 1), t2 = $gameMap.tileId(x, y, 2), t3 = $gameMap.tileId(x, y, 3);
            let ok = true;
            const r0 = relOf(t0), r1 = t1 >= 2048 ? relOf(t1) : -1, ovl = r1 >= 0 && OVERLAY.has(r1);
            for (const id of [t0, t1, t2, t3]) { const f = id > 0 ? flags[id] | 0 : 0; if (!(f & 0x10) && (f & 0x0f)) ok = false; }   // (a tile that shuts a side stays as it is)
            if (t2 >= 2048 || t3 >= 2048 || !ALLOW.has(r0)) ok = false;                // (the base must be a ground of the A2 sheet)
            if (t1 >= 2048 && !ALLOW.has(r1) && !OVERLAY.has(r1)) ok = false;                              // (layer 1: a patch of ground is part of the cell's ground, any other overlay keeps its tile)
            const i = y * W + x;
            if (!ok) {   // (a cell that keeps its tile: its ground under the overlay still counts in the fields round it, so the painted cells meet it softly)
                if (ALLOW.has(r0)) { k0s[i] = kindIdx(r0); kind[i] = k0s[i]; }
                continue;
            }
            can[i] = 1;
            k0s[i] = kindIdx(r0);
            if (ovl) ovs[i] = t1;
            else if (t1 >= 2048) { k1s[i] = kindIdx(r1); shp[i] = shape(t1); }
            kind[i] = k1s[i] || k0s[i];
        }
        const need = new Uint8Array(W * H);
        let nNeed = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const k = kind[y * W + x];
            if (!k || !can[y * W + x]) continue;
            let border = shp[y * W + x] !== 0;   // (a patch's edge piece: part of the cell is its own, part the ground under it)
            for (let dy = -1; dy <= 1 && !border; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                const k2 = kind[ny * W + nx];
                if (k2 && k2 !== k) { border = true; break; }
            }
            if (border) { need[y * W + x] = 1; nNeed++; }
        }
        ST = { key, map: $dataMap, W, H, kind, k0: k0s, k1: k1s, shp, ovs, rels, need, nNeed, a2: null, cov: new Float32Array(32 * 48 * 4).fill(-1), tex: null, atlases: [], free: [], painted: new Map(), queue: [], rectKey: "", margin: MARGIN };
        return ST;
    }
    // the kinds' interior pixels (null while the A2 sheet loads)
    function textures(st) {
        if (st.tex) return st.tex;
        const out = [null];
        for (const r of st.rels) { const px = K.srcOf(K.descOf(2816 + r * 48)); if (!px) return null; out.push(px); }
        return (st.tex = out);
    }
    // how much of a 24 x 24 quarter of a patch's autotile piece (rel, shape, quarter 0-3: TL TR BL BR) is opaque: what the cell is that kind
    function coverage(st, rel, shape, qi) {
        const ci = (rel * 48 + shape) * 4 + qi;
        if (st.cov[ci] >= 0) return st.cov[ci];
        if (!st.a2) {
            const bm = K.tileSheet(1);
            if (!bm || !bm.isReady()) return 1;
            st.a2 = { w: bm.width, d: bm.context.getImageData(0, 0, bm.width, bm.height).data };
        }
        const kind = 16 + rel, bx = (kind % 8) * 2, by = (Math.floor(kind / 8) - 2) * 3, piece = Tilemap.FLOOR_AUTOTILE_TABLE[shape][qi];
        const sx = (bx * 2 + piece[0]) * 24, sy = (by * 2 + piece[1]) * 24;
        let sum = 0;
        for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) sum += st.a2.d[((sy + y) * st.a2.w + sx + x) * 4 + 3];
        return (st.cov[ci] = sum / (24 * 24 * 255));
    }
    const slotXY = s => { const l = s % (AT_N * AT_N); return [(l % AT_N) * TW, Math.floor(l / AT_N) * TW]; };
    function takeSlot(st) {
        if (!st.free.length) {
            if (st.atlases.length >= AT_MAX) return -1;
            st.atlases.push({ bm: new Bitmap(AT_PX, AT_PX), dirty: false });
            const base = (st.atlases.length - 1) * AT_N * AT_N;
            for (let i = AT_N * AT_N - 1; i >= 0; i--) st.free.push(base + i);
        }
        return st.free.pop();
    }
    const atlasOf = (st, slot) => st.atlases[Math.floor(slot / (AT_N * AT_N))];
    function flush(st) {
        for (const a of st.atlases) if (a.dirty) { a.dirty = false; if (a.bm._baseTexture && a.bm._baseTexture.update) a.bm._baseTexture.update(); }
    }
    // paints the cell: its slot, -1 (no free slot), false (a sheet is loading: tried again)
    function paintCell(st, ci) {
        const W = st.W, H = st.H, cx = ci % W, cy = (ci / W) | 0, kind = st.kind, tex = st.tex, flags = $gameMap.tilesetFlags();
        // (the decorations of layers 1-3 are drawn again on top: their pictures first)
        const decor = [];
        for (let z = 1; z < 4; z++) {
            const id = $gameMap.tileId(cx, cy, z);
            if (!(id > 0 && id < 2048) || (flags[id] & 0x10)) continue;
            const ti = K.tileImage(id);
            if (!ti) return false;
            decor.push(ti);
        }
        const k0 = st.k0, k1 = st.k1, shp = st.shp, present = [];
        const addKind = k => { if (k && present.indexOf(k) < 0 && present.length < 4) present.push(k); };
        addKind(k1[ci]); addKind(k0[ci]);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            addKind(k1[ny * W + nx]); addKind(k0[ny * W + nx]);
        }
        const n = present.length, Q = CT / 2;
        for (let j = 0; j < n; j++) sInd[j].fill(0);
        sKnown.fill(0);
        // (the window's texels by the cells' quarters: a patch's piece is its kind by the opaque share of the quarter, the ground under it the rest)
        for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) {
            const nx = cx - 1 + a, ny = cy - 1 + b;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || !kind[ny * W + nx]) continue;
            const ni = ny * W + nx, j0 = present.indexOf(k0[ni]), j1 = k1[ni] ? present.indexOf(k1[ni]) : -1;
            for (let qi = 0; qi < 4; qi++) {
                const c1 = j1 >= 0 || k1[ni] ? Math.min(1, PATCH_BOOST * coverage(st, st.rels[k1[ni] - 1], shp[ni], qi)) : 0, c0 = 1 - c1;
                const tx0 = a * CT + (qi & 1) * Q, ty0 = b * CT + (qi >> 1) * Q;
                for (let ty = ty0; ty < ty0 + Q; ty++) {
                    const o = ty * WT;
                    for (let tx = tx0; tx < tx0 + Q; tx++) {
                        if (j1 >= 0) { sInd[j1][o + tx] += c1; sKnown[o + tx] += c1; }
                        if (j0 >= 0) { sInd[j0][o + tx] += c0; sKnown[o + tx] += c0; }
                    }
                }
            }
        }
        boxBlur(sKnown, WT, WT, R_BLUR);
        for (let j = 0; j < n; j++) boxBlur(sInd[j], WT, WT, R_BLUR);
        // the ring's values: the kind's share of what is ground round the texel plus the kind's noise (the noise by the kind and the
        // map pixel: the neighbour cell, which sees the same texel, decides the same)
        for (let ry = 0; ry < RT; ry++) for (let rx = 0; rx < RT; rx++) {
            const tx = CT - 1 + rx, ty = CT - 1 + ry;
            let ex = rx, ey = ry;   // (a ring texel inside a cell that is not ground: the nearest texel of the cell's own)
            const nx = cx + (tx < CT ? -1 : tx >= 2 * CT ? 1 : 0), ny = cy + (ty < CT ? -1 : ty >= 2 * CT ? 1 : 0);
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || !kind[ny * W + nx]) { ex = Math.max(1, Math.min(CT, rx)); ey = Math.max(1, Math.min(CT, ry)); }
            const i2 = (CT - 1 + ey) * WT + CT - 1 + ex, px = cx * TW + (ex - 1) * TX + TX / 2, py = cy * TW + (ey - 1) * TX + TX / 2;
            const kn = Math.max(sKnown[i2], 0.02);
            for (let j = 0; j < n; j++) sD[j][ry * RT + rx] = sInd[j][i2] / kn + AMP * (noiseAt(px, py, present[j]) - 0.5);
        }
        if (!sImg) sImg = new ImageData(TW, TW);
        const d = sImg.data;
        for (let py = 0; py < TW; py++) {
            const wy = cy * TW + py, r0 = PIX_I[py] * RT, r1 = r0 + RT, fy = PIX_F[py];
            for (let px = 0; px < TW; px++) {
                const wx = cx * TW + px, c0 = PIX_I[px], fx = PIX_F[px];
                let best = -1e9;
                for (let j = 0; j < n; j++) {
                    const D = sD[j];
                    const v = (D[r0 + c0] * (1 - fx) + D[r0 + c0 + 1] * fx) * (1 - fy) + (D[r1 + c0] * (1 - fx) + D[r1 + c0 + 1] * fx) * fy
                        + (DITH[(((wy + j * 37) & 63) << 6) | ((wx + j * 19) & 63)] - 0.5) * JIT;
                    sV[j] = v;
                    if (v > best) best = v;
                }
                // the kinds within SOFT of the best are mixed (a feathered line, the neighbours' weights by how near they are)
                const q = (py * TW + px) * 4;
                let ws = 0, cr = 0, cg = 0, cb = 0, ca = 0;
                for (let j = 0; j < n; j++) {
                    const w = 1 + (sV[j] - best) / SOFT;
                    if (w <= 0) continue;
                    const T0 = tex[present[j]];
                    ws += w; cr += w * T0[q]; cg += w * T0[q + 1]; cb += w * T0[q + 2]; ca += w * T0[q + 3];
                }
                d[q] = cr / ws; d[q + 1] = cg / ws; d[q + 2] = cb / ws; d[q + 3] = ca / ws;
            }
        }
        if (st.ovs[ci]) {   // the cell's overlay (flowers, feather pieces) as the tilemap draws it: its four quarter pieces
            coverage(st, 0, 0, 0);
            if (!st.a2) return false;
            const id = st.ovs[ci], rel = Math.floor((id - 2816) / 48), sh = (id - 2816) % 48, kd = 16 + rel, bx = (kd % 8) * 2, by = (Math.floor(kd / 8) - 2) * 3;
            for (let qi = 0; qi < 4; qi++) {
                const piece = Tilemap.FLOOR_AUTOTILE_TABLE[sh][qi], sx = (bx * 2 + piece[0]) * 24, sy = (by * 2 + piece[1]) * 24, ox = (qi & 1) * 24, oy = (qi >> 1) * 24;
                for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
                    const s = ((sy + y) * st.a2.w + sx + x) * 4, a = st.a2.d[s + 3];
                    if (!a) continue;
                    const k = a / 255, o = ((oy + y) * TW + ox + x) * 4;
                    d[o] = st.a2.d[s] * k + d[o] * (1 - k); d[o + 1] = st.a2.d[s + 1] * k + d[o + 1] * (1 - k); d[o + 2] = st.a2.d[s + 2] * k + d[o + 2] * (1 - k);
                    d[o + 3] = Math.round(d[o + 3] + (255 - d[o + 3]) * k);
                }
            }
        }
        for (const ti of decor) {
            for (let q = 0; q < TW * TW * 4; q += 4) {
                const a = ti[q + 3];
                if (!a) continue;
                const k = a / 255;
                d[q] = ti[q] * k + d[q] * (1 - k); d[q + 1] = ti[q + 1] * k + d[q + 1] * (1 - k); d[q + 2] = ti[q + 2] * k + d[q + 2] * (1 - k);
                d[q + 3] = Math.round(d[q + 3] + (255 - d[q + 3]) * k);
            }
        }
        const slot = takeSlot(st);
        if (slot < 0) return -1;
        const at = atlasOf(st, slot), [sx, sy] = slotXY(slot);
        at.bm.context.putImageData(sImg, sx, sy);
        at.dirty = true;
        st.painted.set(ci, slot);
        return slot;
    }

    function Sprite_Ziemia() { this.initialize(...arguments); }
    Sprite_Ziemia.prototype = Object.create(Sprite.prototype);
    Sprite_Ziemia.prototype.constructor = Sprite_Ziemia;
    Sprite_Ziemia.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.5;   // over the ground tiles, under the soil of the farm (1), the things on the ground (1.5) and the characters
        this._cells = new Map();
        this._seen = "";
    };
    // (the cells' pictures are plain sprites of the atlas: no per-sprite update)
    Sprite_Ziemia.prototype.addCell = function(ci, slot) {
        const st = ST, at = atlasOf(st, slot), [sx, sy] = slotXY(slot), s = new Sprite(at.bm);
        s.update = function() {};
        s.setFrame(sx, sy, TW, TW);
        s.x = (ci % st.W) * TW; s.y = ((ci / st.W) | 0) * TW;
        this._cells.set(ci, s);
        this.addChild(s);
    };
    Sprite_Ziemia.prototype.dropCell = function(ci) {
        const s = this._cells.get(ci);
        if (s) { this.removeChild(s); this._cells.delete(ci); }
    };
    Sprite_Ziemia.prototype.restore = function() {   // (a new spriteset on a map that is kept: the painted cells' sprites again)
        for (const c of this._cells.keys()) this.dropCell(c);
        if (ST && ST.map === $dataMap) for (const [ci, slot] of ST.painted) this.addCell(ci, slot);
    };
    const viewCells = () => {
        const vw = T.view.w() / TW, vh = T.view.h() / TW, dx = $gameMap.displayX(), dy = $gameMap.displayY();
        return [Math.floor(dx), Math.floor(dy), Math.floor(dx + vw), Math.floor(dy + vh)];
    };
    // the cells to paint round the screen (the nearest to its middle painted first) and the far painted ones given back
    Sprite_Ziemia.prototype.refreshWindow = function(st, margin) {
        const [x0, y0, x1, y1] = viewCells(), rk = x0 + "," + y0 + "," + x1 + "," + y1 + ":" + margin;
        if (rk === st.rectKey) return;
        st.rectKey = rk;
        const W = st.W, H = st.H, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, q = [];
        for (let y = Math.max(0, y0 - margin); y <= Math.min(H - 1, y1 + margin); y++) for (let x = Math.max(0, x0 - margin); x <= Math.min(W - 1, x1 + margin); x++) {
            const ci = y * W + x;
            if (st.need[ci] && !st.painted.has(ci)) q.push([ci, (x - mx) * (x - mx) + (y - my) * (y - my)]);
        }
        q.sort((a, b) => b[1] - a[1]);
        st.queue = q.map(e => e[0]);
        for (const [ci, slot] of Array.from(st.painted)) {
            const x = ci % W, y = (ci / W) | 0;
            if (x < x0 - RELEASE || x > x1 + RELEASE || y < y0 - RELEASE || y > y1 + RELEASE) { st.painted.delete(ci); st.free.push(slot); this.dropCell(ci); }
        }
        // (what is seen: drawn; the rest of the kept cells off - a few hundred sprites would be walked by the renderer for nothing)
        for (const [ci, s] of this._cells) { const x = ci % W, y = (ci / W) | 0; s.renderable = x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1; }
    };
    Sprite_Ziemia.prototype.work = function(budget) {
        const st = ST;
        if (!st) return true;
        if (!textures(st)) return false;
        const t0 = performance.now();
        const [x0, y0, x1, y1] = viewCells();
        while (st.queue.length) {
            const ci = st.queue.pop();
            if (st.painted.has(ci)) continue;
            const r = paintCell(st, ci);
            if (r === false) { st.queue.push(ci); break; }
            if (r >= 0) {
                this.addCell(ci, r);
                const s = this._cells.get(ci), x = ci % st.W, y = (ci / st.W) | 0;
                s.renderable = x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1;
                stat.cells++;
            }
            if (performance.now() - t0 > budget) break;
        }
        stat.paintMs += performance.now() - t0;
        flush(st);
        return st.queue.length === 0;
    };
    // while the screen is still black (Scene_Map.isReady): the cells of the screen and one round it, a big budget a frame
    Sprite_Ziemia.prototype.prepare = function() {
        if (!has()) return true;
        if (!here() || !on("edges")) return true;
        const st = geometry();
        if (this._st !== st || this._map !== $dataMap) { this._st = st; this._map = $dataMap; this.restore(); st.rectKey = ""; }
        this.refreshWindow(st, 2);
        return this.work(24);
    };
    Sprite_Ziemia.prototype.update = function() {
        if (!has()) return;
        const show = here() && on("edges");
        this.visible = show;
        if (!show) { if (ST && !here()) dropState(); return; }
        const st = geometry();
        if (this._st !== st || this._map !== $dataMap) { this._st = st; this._map = $dataMap; this.restore(); st.rectKey = ""; }
        stat.frames++;
        this.refreshWindow(st, MARGIN);
        if (st.queue.length) this.work(2.5);
        this.x = Math.round(-$gameMap.displayX() * TW); this.y = Math.round(-$gameMap.displayY() * TW);
    };

    // ------------------------------------------------------------------
    // 2. SHADE: contact shade at the foot of things
    // ------------------------------------------------------------------
    const THING = /^!\$(Pine|Tree|Sapling|Rock|Boulder|Bush|Stump|Trunk|Logs|Zas_|Orzel_G|Mt_|Pod_|Zak_|Low_|Zi_|Big_Trees)/;
    const FLAT = /^!\$(Bush_(Clover|Grass|Fern|Flower|Snow|Bud)|Rock_Pebbles|Zas_(Kaluza|Plot)|Zi_(Len|Krwawnik|Ziele|Galaz|Galaz2|Kamien|Kamienie))/;   // (low plants and flat things: no foot to shade)
    const baseCache = {};
    // the width and the place of a picture's foot: the opaque bottom rows of the frame (pattern 1, facing down)
    function baseOf(name) {
        if (baseCache[name] !== undefined) return baseCache[name];
        const bm = ImageManager.loadCharacter(name);
        if (!bm || !bm.isReady()) return null;
        const fw = Math.floor(bm.width / 3), fh = Math.floor(bm.height / 4);
        let out = false;
        try {
            const img = bm.context.getImageData(fw, 0, fw, fh).data;
            let last = -1;
            for (let y = fh - 1; y >= 0 && last < 0; y--) for (let x = 0; x < fw; x++) if (img[(y * fw + x) * 4 + 3] > 100) { last = y; break; }
            if (last >= 0) {
                let lo = fw, hi = -1;
                for (let y = Math.max(0, last - 5); y <= last; y++) for (let x = 0; x < fw; x++) if (img[(y * fw + x) * 4 + 3] > 100) { if (x < lo) lo = x; if (x > hi) hi = x; }
                out = { w: hi - lo + 1, off: (lo + hi) / 2 - fw / 2, up: fh - 1 - last, fw, fh };
            }
        } catch (e) { out = false; }
        return (baseCache[name] = out);
    }
    let blob = null;
    function blobBitmap() {
        if (blob) return blob;
        const b = new Bitmap(64, 32), img = b.context.createImageData(64, 32);
        for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
            const dx = (x + 0.5 - 32) / 32, dy = (y + 0.5 - 16) / 16, r = Math.sqrt(dx * dx + dy * dy), a = r >= 1 ? 0 : Math.pow(1 - r, 1.1) * (0.8 + 0.2 * (1 - r));
            const p = (y * 64 + x) * 4;
            img.data[p] = 6; img.data[p + 1] = 8; img.data[p + 2] = 4; img.data[p + 3] = Math.round(255 * a);
        }
        b.context.putImageData(img, 0, 0);
        if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        return (blob = b);
    }
    function Sprite_ZiemiaShade() { this.initialize(...arguments); }
    Sprite_ZiemiaShade.prototype = Object.create(Sprite.prototype);
    Sprite_ZiemiaShade.prototype.constructor = Sprite_ZiemiaShade;
    Sprite_ZiemiaShade.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 1.4;   // over the ground and the soil, under the things lying about (1.5), the sun's shadows (1.8) and the characters
        this._items = new Map();   // event id -> { sig, spr }
        this._farm = [];
        this._farmKey = "";
        this._age = 0;
        this._mapKey = "";
    };
    Sprite_ZiemiaShade.prototype.shadeSprite = function(cx, cy, w, h, alpha) {
        const s = new Sprite(blobBitmap());
        s.update = function() {};
        s.anchor.x = 0.5; s.anchor.y = 0.5;
        s.x = Math.round(cx); s.y = Math.round(cy);
        s.scale.x = w / 64; s.scale.y = h / 32;
        s.opacity = Math.round(255 * alpha);
        s._box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
        this.addChild(s);
        return s;
    };
    Sprite_ZiemiaShade.prototype.clear = function() {
        for (const it of this._items.values()) this.removeChild(it.spr);
        for (const s of this._farm) this.removeChild(s);
        this._items.clear(); this._farm = []; this._farmKey = "";
    };
    Sprite_ZiemiaShade.prototype.syncEvents = function() {
        const seen = new Set();
        for (const ev of $gameMap.events()) {
            const nm = ev.characterName();
            if (!nm || ev._erased || ev.isTransparent() || !THING.test(nm) || FLAT.test(nm)) continue;
            const base = baseOf(nm);
            if (!base) continue;
            const id = ev.eventId(), sig = nm + "|" + ev.x + "|" + ev.y, old = this._items.get(id);
            seen.add(id);
            if (old && old.sig === sig) continue;
            if (old) this.removeChild(old.spr);
            // the foot: a tree's trunk is narrow (a wider spot than the trunk), a rock or a bush sits with its whole width
            const tree = /^!\$(Pine|Tree|Sapling|Big_Trees)/.test(nm), rock = /^!\$(Rock|Boulder|Mt_)/.test(nm);
            const w = Math.max(tree ? 46 : 28, Math.min(tree ? 84 : 160, base.w * (tree ? 2.2 : rock ? 1.25 : 1.15) + (tree ? 10 : 12)));
            const spr = this.shadeSprite((ev.x + 0.5) * TW + base.off, (ev.y + 1) * TW - base.up - 2, w, Math.max(10, w * (tree ? 0.4 : 0.34)), tree ? 0.8 : rock ? 0.75 : 0.65);
            this._items.set(id, { sig, spr });
        }
        for (const [id, it] of Array.from(this._items)) if (!seen.has(id)) { this.removeChild(it.spr); this._items.delete(id); }
    };
    // the farm's buildings and the yard's fence (their own soft footprint of the building stays; this is the dark rim at the base)
    Sprite_ZiemiaShade.prototype.syncFarm = function() {
        const F = window.Farming;
        if (!F || !F.farm || !F.BUILDINGS || !F.geoOf) return;
        const mapId = $gameMap.mapId(), list = (F.farm().buildings || {})[mapId] || [], key = mapId + ":" + F.farm().rev + ":" + list.length;
        if (key === this._farmKey) return;
        this._farmKey = key;
        for (const s of this._farm) this.removeChild(s);
        this._farm = [];
        try {
            for (const b of list) {
                if (!F.BUILDINGS[b.type] || b.site) continue;
                const def = F.geoOf(b);
                if (b.type === "fence") { this._farm.push(this.shadeSprite((b.x + 0.5) * TW, (b.y + 1) * TW - 3, 46, 14, 0.5)); continue; }
                const hut = def.yard ? def.yard.hut : null, ww = (hut ? hut.w : def.w) * TW;
                this._farm.push(this.shadeSprite((b.x + (hut ? hut.dx + hut.w / 2 : def.w / 2)) * TW, (b.y - (hut ? hut.dy : 0) + 1) * TW - 4, ww + 14, Math.max(16, ww * 0.2), 0.55));
                if (def.yard) for (const c of F.cellsOfGeo(def, b.x, b.y)) {
                    if (!F.onRing(def, c.i, c.j) || (c.j === 0 && c.i === def.yard.gate)) continue;
                    this._farm.push(this.shadeSprite((c.x + 0.5) * TW, (c.y + 1) * TW - 3, 46, 14, 0.5));
                }
            }
        } catch (e) { /* (the farm's shapes changed: no shade under the buildings) */ }
    };
    Sprite_ZiemiaShade.prototype.update = function() {
        if (!has()) return;
        const show = here() && on("shade") && (() => { const W = T.api("Wydajnosc"); return !(W && W.gfx && W.gfx.smallShadows === false); })();
        this.visible = show;
        if (!show) { if (this._items.size || this._farm.length) this.clear(); return; }
        const mk = $gameMap.mapId() + ":" + ($dataMap && $dataMap.events ? $dataMap.events.length : 0);
        if (mk !== this._mapKey) { this._mapKey = mk; this.clear(); this._age = 0; }
        if (this._age++ % 20 === 0) { this.syncEvents(); this.syncFarm(); }
        const ox = Math.round(-$gameMap.displayX() * TW), oy = Math.round(-$gameMap.displayY() * TW);
        this.x = ox; this.y = oy;
        const r = T.view.rect();
        const cull = !(window.Wydajnosc && Wydajnosc.opts && Wydajnosc.opts.cull === false);
        const test = s => { s.renderable = !cull || (s._box[2] + ox >= r.x0 && s._box[0] + ox <= r.x1 && s._box[3] + oy >= r.y0 && s._box[1] + oy <= r.y1); };
        for (const it of this._items.values()) test(it.spr);
        for (const s of this._farm) test(s);
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._ziemia = new Sprite_Ziemia();
        this._tilemap.addChild(this._ziemia);
        this._ziemiaShade = new Sprite_ZiemiaShade();
        this._tilemap.addChild(this._ziemiaShade);
    };
    // (2026-10-30, as the shore: "widać kafle przed nakładką, dopiero po chwili się pojawia") the screen's cells are painted while it is
    // still black - at most ~1.5 s, never stuck
    const _Scene_Map_isReady = Scene_Map.prototype.isReady;
    Scene_Map.prototype.isReady = function() {
        if (!_Scene_Map_isReady.call(this)) return false;
        const s = this._spriteset && this._spriteset._ziemia;
        if (!s || !here() || !on("edges")) return true;
        this._zmWait = (this._zmWait || 0) + 1;
        return s.prepare() || this._zmWait > 90;
    };

    // ------------------------------------------------------------------
    // 3. MOOD: a touch more colour, a cool / warm split, a firmer vignette (Mood.js asks this before its options)
    // ------------------------------------------------------------------
    function moodTweak(P, kind, dark) {
        if (!has() || kind !== "outdoor" || !here() || !on("mood")) return;
        const day = 1 - dark * 0.6;
        P.satHi *= 1 + 0.07 * day; P.satLo *= 1 + 0.05 * day; P.con *= 1.03;
        P.shadow = [P.shadow[0] * 0.965, P.shadow[1] * 0.985, P.shadow[2] * 1.04];   // (cooler shadows)
        P.high = [P.high[0] * 1.025, P.high[1] * 1.0, P.high[2] * 0.965];             // (warmer lights)
        P.vig += 0.1; P.vigIn = Math.max(0.3, P.vigIn - 0.04);
        P.bloom *= 1.1;
    }
    function hookMood() { const M = T.api("Mood"); if (M && M.addTweak) M.addTweak(PLUGIN, moodTweak); }
    hookMood();
    T.on("tekstyWczytane", hookMood, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    function reload() {   // the map again in the same place (the decor events come or go with the switch)
        if (!has() || !window.$gamePlayer) return false;
        $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 2);
        return true;
    }
    const api = {
        on, set, here, reload, KEYS, MAPS, DEF, ROWS,
        setAll(v) { for (const k in KEYS) set(k, v); return on("on"); },
        stats() {
            const st = ST;
            return { cells: st ? st.painted.size : 0, need: st ? st.nNeed : 0, kinds: st ? st.rels.slice() : [], atlases: st ? st.atlases.length : 0,
                mb: st ? Math.round(st.atlases.length * AT_PX * AT_PX * 4 / 1048576 * 100) / 100 : 0, queue: st ? st.queue.length : 0,
                paintMs: Math.round(stat.paintMs), painted: stat.cells, frames: stat.frames, textures: !!(st && st.tex) };
        },
        resetStats() { stat.paintMs = 0; stat.cells = 0; stat.frames = 0; },
        dropState, geometry: () => (here() ? geometry() : null), paintCell, textures,
        Sprite_Ziemia, Sprite_ZiemiaShade
    };
    window.Ziemia = T.register(PLUGIN, api);
})();
