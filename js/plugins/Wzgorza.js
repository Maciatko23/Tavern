//=============================================================================
// Wzgorza.js
//=============================================================================
// (2026-11-01, a TRIAL on the pilot maps - the player: "da się jakoś mądrze bardziej zaokrąglić te krawędzie i rogi wzgórz, tak jak to
// z linią brzegową zrobiłeś? Jak to zaaafektuje wydajność, to nie ma sensu.") The hills of the A5 sheet (tilesets 9 and 11: the plateau's
// ring of rim tiles 88-90 / 96-98 / 104-106 and their earth twins, the stone face 112-114 / 120-122 and its variants, the stairs 24-27 /
// 32-35) are laid by the tile grid, so every corner of their top edge and every end and corner of the face's foot is a square. Here the
// map file is NOT touched: once per entry into a map the plugin reads the map's own tiles and
//   1. finds the hill's silhouette (the ring and the face and what lies between them, row by row: a left rim tile opens, a right one
//      closes; a rim or face end that touches a stair does not close - the stairs are inside the silhouette, so the edge runs straight
//      up to them),
//   2. finds every corner of that silhouette on the cell grid (convex and concave; a corner near stairs is left as it is) and how far
//      its two straight arms reach (a corner may not be rounder than the arms allow: one cell of arm = 24 px of arc, at most 40 px),
//   3. groups the corners that lie within 3 cells of each other into a CLUSTER (a step in an edge = a convex and a concave corner side by
//      side: one S-shaped curve) and paints each cluster once, as pictures of 48 x 48 px with only the pixels that CHANGE. Every pixel is
//      decided by the nearest corner of its cluster, so two corners never overpaint each other; the whole old rim band (15 px) of a
//      replaced stretch is wiped (back to the plateau's ground), the cut-off square corner gets the ground of the cell across the
//      edge, the new edge gets the rim stones of the old straight rim (the pixels of the tiles, taken along the old edge) or the
//      face's own stones with a darker line, a concave corner is filled by the same stones. Pictures live in atlas bitmaps (TerenKit.js).
// Then every frame nothing but the container's place changes (and every ~50 px of scroll the pictures off the screen are hidden).
// BEHIND THE HILL (round 2, the player: "żeby górna krawędź wzgórza była nad graczem, a gracz mógł chodzić za; głównie głowa widoczna"),
// only on the maps of the parameter walkMaps (990, 991): the picture is 3/4 - the drawn top of a hill is its base shifted up by its
// height - so a character of the LOWER ground (the default level; the upper level, the plateau, is reached by the stairs only) may stand
// a few px inside the back edge (up to 34 px) and a few px inside the upper part of a side edge (up to 30 px): Game_Player.freeBlocker
// (FreeMovement.js) lets the feet into the rim cell there and no deeper, so nobody gets onto the plateau by a side. While a character
// stands in such a strip, a copy of the hill's own pixels there (the rim stones and the grass of the plateau, in place) is drawn OVER
// it - the edge cuts it at the chest and the head shows. Never for a character on the plateau (its feet are not in a strip: the rim
// cells stay shut for it), never by the face (no strips there). Events (grid movers) stand on the tiles, so they never go inside a
// strip; if one stands in one anyway it is hidden the same way. Region layers, passability of the tiles and the saves are not changed.
// The switches: Opcje (the rows "Zaokrąglone wzgórza (próba)" and "zasłanianie postaci za wzgórzem"), Wzgorza.set(true / false),
// and - for the tests, before the page loads - window.WZGORZA = { off: true } / { lip: false }. "Niska" graphics quality (Wydajnosc.js) turns it off.

/*:
 * @target MZ
 * @plugindesc Próba „zaokrąglone wzgórza”: rogi górnej krawędzi wzgórz i półek oraz dół lica skalnej ściany zaokrąglone łukiem (nakładka rysowana raz przy wejściu na mapę); na mapach próbnych także wchodzenie za wzgórze. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TerenKit
 * @orderAfter FreeMovement
 * @orderAfter Wydajnosc
 *
 * @param maps
 * @text Mapy
 * @desc Numery map (po przecinku), na których działa zaokrąglanie. Próba: Map990, Map991 (mapy próbne A i B) i Map013 (Góry i kamieniołom).
 * @type string
 * @default 990,991,13
 *
 * @param walkMaps
 * @text Mapy z wchodzeniem za wzgórze
 * @desc Numery map, na których postać z dolnego terenu może wejść za tylną i boczną krawędź wzgórza (krawędź zasłania jej nogi). Próba: tylko mapy próbne 990 i 991.
 * @type string
 * @default 990,991
 *
 * @param shoreMaps
 * @text Mapy z przemalowanym brzegiem
 * @desc Mapy, których brzeg morza przemalowuje CzerwonaWoda (jej BRZEG_MAPS): w pasie ok. 12 kratek od morza grunt jest przemalowany, więc rogów wzgórz tam nie zaokrąglamy.
 * @type string
 * @default 990,125,155,157,159,162,165,120,175,168,17,18,960,961,962,963,964
 *
 * @param on
 * @text Włączona
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Wzgorza.js - zaokrąglone wzgórza (próba)
 * ============================================================================
 * Nie zmienia pliku mapy, regionów ani chodliwości kafli. Raz przy wejściu na
 * mapę czyta jej kafle (lico, obrys z kafli A5, schody), znajduje narożniki
 * obrysu wzgórza (wypukłe i wklęsłe) i maluje je jako obrazki z pikseli kafli
 * tej mapy (trawa, kamienie krawędzi, lico). Potem co klatkę tylko przesuwa
 * jeden kontener.
 *
 *   - rogi górnej krawędzi (wzgórza, półki, płaskowyże): łuk zamiast kanciastego rogu,
 *     dwa rogi blisko siebie (stopień w krawędzi) dają jeden ciągły łuk w kształcie S,
 *   - całe stare obrzeże na zastąpionym odcinku jest wymazywane,
 *   - dół lica skalnej ściany i jego końce: łuk, ciemniejszy brzeg kamienia,
 *   - przy SCHODACH krawędzie zostają proste (rogi w pobliżu schodów nietknięte),
 *   - promień łuku nie większy niż pozwalają proste odcinki (1 kratka odcinka = 24 px, najwyżej 40 px).
 *
 * Za wzgórzem (tylko mapy z parametru walkMaps): postać na dolnym terenie
 * może wejść do 34 px za tylną krawędź i do 30 px za górną część bocznej;
 * krawędź (obrzeże i trawa szczytu) rysuje się wtedy nad nią i widać głowę.
 * Na szczyt wchodzi się tylko schodami; z góry postać nie spada i nie jest zasłaniana.
 *
 * Przełączniki: Opcje -> „Zaokrąglone wzgórza (próba)” i „zasłanianie postaci
 * za wzgórzem”, Wzgorza.set(true/false); w testach, przed wczytaniem strony:
 * window.WZGORZA = { off: true } albo { lip: false }.
 * Jakość grafiki „Niska” wyłącza nakładkę. Wzgorza.stats(): rogi, skupienia, obrazki, MB, czas.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Wzgorza.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const K = T.api("TerenKit");
    if (!K) throw new Error("Wzgorza.js: brak TerenKit.js - musi stać wyżej na liście wtyczek (the shared ground tools are missing)");
    const PLUGIN = "Wzgorza";
    const params = PluginManager.parameters(PLUGIN);
    const bool = (v, d) => (v === undefined || v === null || v === "" ? d : String(v) !== "false");
    const list = (v, d) => String(v === undefined || v === "" ? d : v).split(/[^0-9]+/).filter(Boolean).map(Number);
    const MAPS = list(params.maps, "990,991,13"), WALK_MAPS = list(params.walkMaps, "990,991");
    // the maps whose shore CzerwonaWoda.js redraws (BRZEG_MAPS there): the ground within ~12 cells of their sea is repainted by it - no corners there
    const SHORE_MAPS = list(params.shoreMaps, "990,125,155,157,159,162,165,120,175,168,17,18,960,961,962,963,964");
    const DEF = bool(params.on, true);
    const KEY = "wzgorzaOn", KEY_LIP = "wzgorzaLip";
    // (2026-11-01, round 2) the hiding behind a hill's back edge is the 3/4 one now (the feet INSIDE the drawn top): on by default again
    const DEF_LIP = true;
    const defOf = k => (k === KEY_LIP ? DEF_LIP : DEF);

    // ------------------------------------------------------------------
    // The switches (the config file, not the save; window.WZGORZA overrides them - the tests and the photos)
    // ------------------------------------------------------------------
    for (const k of [KEY, KEY_LIP]) if (ConfigManager[k] === undefined) ConfigManager[k] = defOf(k);
    const _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() { const c = _makeData.call(this); for (const k of [KEY, KEY_LIP]) c[k] = this[k] === undefined ? defOf(k) : this[k]; return c; };
    const _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) { _applyData.call(this, config); for (const k of [KEY, KEY_LIP]) { const v = config ? config[k] : undefined; this[k] = v === undefined ? defOf(k) : !!v; } };
    function on() {
        const o = window.WZGORZA;
        if (o && o.off) return false;
        if (o && o.on !== undefined) return !!o.on;
        return ConfigManager[KEY] === undefined ? DEF : !!ConfigManager[KEY];
    }
    function lipOn() {
        const o = window.WZGORZA;
        if (o && o.lip !== undefined) return !!o.lip;
        return ConfigManager[KEY_LIP] === undefined ? DEF_LIP : !!ConfigManager[KEY_LIP];
    }
    const _addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _addGeneralOptions.call(this);
        this._list.push({ name: "Zaokrąglone wzgórza (próba)", symbol: KEY, enabled: true, ext: null });
        this._list.push({ name: "  zasłanianie postaci za wzgórzem", symbol: KEY_LIP, enabled: true, ext: null });
    };
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const sym = this.commandSymbol(index);
        return sym === KEY || sym === KEY_LIP ? (this.getConfigValue(sym) ? "Wł" : "Wył") : _statusText.call(this, index);
    };
    const _restoreDefaults = Window_Options.prototype.restoreDefaultValues;
    if (_restoreDefaults) Window_Options.prototype.restoreDefaultValues = function() { _restoreDefaults.call(this); ConfigManager[KEY] = DEF; ConfigManager[KEY_LIP] = DEF_LIP; };

    const has = () => !!(window.$gameMap && window.$dataMap);
    const lowQuality = () => { const W = T.api("Wydajnosc"); return !!(W && W.gfx && W.gfx.level === "low"); };   // ("Niska": the effects off)
    const SHEETS = new Set([9, 11]);   // (the tilesets whose A5 sheet is Fantasy_Outside_A5_green)
    const here = () => has() && (MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.WZGORZA_ALL) && SHEETS.has($gameMap.tilesetId());
    const active = () => here() && on() && !lowQuality();
    const walkHere = () => active() && lipOn() && (WALK_MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.WZGORZA_WALK_ALL);

    // ------------------------------------------------------------------
    // 1. The silhouette and its corners (pure functions of the map's tile ids: no game objects)
    // ------------------------------------------------------------------
    const TW = 48;
    const mk = list => { const s = new Uint8Array(512); for (const n of list) s[n] = 1; return s; };
    const LEFT = mk([88, 96, 104, 93, 101, 109, 112, 120, 117, 125]);      // a tile with the drop on its west side (plateau rim, face end)
    const RIGHT = mk([90, 98, 106, 95, 103, 111, 114, 122, 119, 127]);     // ... on its east side
    const STAIR = mk([24, 25, 26, 27, 32, 33, 34, 35]);                    // the stairs of the A5 sheet (grass, stone)
    const FACE = mk([112, 113, 114, 120, 121, 122, 117, 118, 119, 125, 126, 127, 72, 73, 74, 75, 80, 81, 82, 83, 99, 100, 91, 107, 115, 123, 92, 108, 116, 124]);
    const EARTH = mk([93, 94, 95, 101, 102, 103, 109, 110, 111, 78, 79, 86, 87, 117, 118, 119, 125, 126, 127, 92, 108, 116, 124]);
    const RIM = mk([88, 89, 90, 96, 98, 104, 105, 106, 93, 94, 95, 101, 103, 109, 110, 111]);   // the plateau's ring (not its flat middle)
    const RMAX = 40, RUN = 24, RIMW = 15, OLDBAND = 18, OUTL = 1.5, CONCAVE_MARGIN = 20, SLOT = 48, CLUSTER_GAP = 3;
    const DEPTH_N = 48, DEPTH_S = 20, COVER = 64;   // how far a lower character's feet may go behind a back / side edge (px, measured from the new edge line, on the feet's 9 points); how deep the drawn-over band reaches
    const REGION_STAIR_NEAR = 2;   // a corner with stairs within this many cells is left square (the edge runs straight to the stairs)

    function buildGeo(W, H, data, shore) {
        const N = W * H, n0 = new Int16Array(N), hin = new Uint8Array(N);
        for (let i = 0; i < N; i++) { const id = data[i]; n0[i] = id >= 1536 && id < 2048 ? id - 1536 : -1; }
        const stair = i => n0[i] >= 0 && STAIR[n0[i]] === 1;
        for (let y = 0; y < H; y++) {
            let inn = false, start = -1, startFace = false;
            const o = y * W;
            for (let x = 0; x < W; x++) {
                const n = n0[o + x];
                if (n >= 0 && LEFT[n] && !(x > 0 && stair(o + x - 1))) {
                    const fl = FACE[n] === 1;
                    if (inn && fl !== startFace) {   // (a face end where a plateau's rim opened, or the other way: two hills in a row - the old span was never closed)
                        for (let k = start; k < x; k++) { const m = n0[o + k]; if (!(m >= 0 && (RIM[m] || FACE[m] || STAIR[m]))) hin[o + k] = 0; }
                        inn = false;
                    }
                    if (!inn) { start = x; startFace = fl; }
                    inn = true;
                }
                if (inn) hin[o + x] = 1;
                if (n >= 0 && RIGHT[n] && !(x < W - 1 && stair(o + x + 1))) inn = false;
            }
            if (inn) for (let x = start; x < W; x++) hin[o + x] = 0;   // (a span that is never closed - open to the map's edge: not a hill of ours)
            else for (let x = 0; x < W; x++) { const n = n0[o + x]; if (n >= 0 && (RIM[n] || FACE[n] || STAIR[n])) hin[o + x] = 1; }   // (a rim / face tile that no span holds - a face piece left of its "end": still the hill's)
        }
        const hAt = (x, y) => hin[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
        const nearStair = (vx, vy) => {
            for (let y = vy - REGION_STAIR_NEAR; y < vy + REGION_STAIR_NEAR; y++) for (let x = vx - REGION_STAIR_NEAR; x < vx + REGION_STAIR_NEAR; x++)
                if (x >= 0 && y >= 0 && x < W && y < H && stair(y * W + x)) return true;
            return false;
        };
        // is the vertex (x, y) straight along the direction (horizontal: dy = 0)? (two cells of one side in the silhouette, the other side not)
        const straight = (x, y, horiz) => {
            const a = hAt(x - 1, y - 1), b = hAt(x, y - 1), c = hAt(x - 1, y), d = hAt(x, y);
            return horiz ? (a + b === 2 && c + d === 0) || (a + b === 0 && c + d === 2) : (a + c === 2 && b + d === 0) || (a + c === 0 && b + d === 2);
        };
        const arm = (vx, vy, dx, dy) => {   // cells to the next vertex that is not straight (99: to the map's edge)
            for (let k = 1; ; k++) {
                const x = vx + dx * k, y = vy + dy * k;
                if (x <= 0 || y <= 0 || x >= W || y >= H) return 99;
                if (!straight(x, y, dx !== 0)) return k;
            }
        };
        const face = (x, y) => { const n = n0[y * W + x]; return n >= 0 && (FACE[n] === 1 || STAIR[n] === 1); };
        // the red shore's own overlay (CzerwonaWoda.js) repaints the ground within ~12 cells of the sea: a corner there would show the tile's
        // own (green) ground in a dry strip - left square
        let anyWater = false;
        for (let i = 0; shore && i < N && !anyWater; i++) if (data[i] >= 2048 && data[i] < 2816) anyWater = true;
        const nearWater = (vx, vy) => {
            for (let y = Math.max(0, vy - 13); y < Math.min(H, vy + 13); y++) for (let x = Math.max(0, vx - 13); x < Math.min(W, vx + 13); x++) {
                const id = data[y * W + x]; if (id >= 2048 && id < 2816) return true;
            }
            return false;
        };
        const corners = [];
        for (let vy = 1; vy < H; vy++) for (let vx = 1; vx < W; vx++) {
            const a = hin[(vy - 1) * W + vx - 1], b = hin[(vy - 1) * W + vx], c = hin[vy * W + vx - 1], d = hin[vy * W + vx], cnt = a + b + c + d;
            if (cnt !== 1 && cnt !== 3) continue;
            if (nearStair(vx, vy)) continue;
            let co;
            if (cnt === 1) {   // convex: the one cell in the silhouette lies at (sx, sy) from the vertex
                const sx = b || d ? 1 : -1, sy = c || d ? 1 : -1, hx = sx > 0 ? vx : vx - 1, hy = sy > 0 ? vy : vy - 1;
                co = { vx, vy, kind: 0, sx, sy, hx, hy, style: face(hx, hy) ? 2 : 1, earth: EARTH[n0[hy * W + hx]] === 1 };
                co.armH = arm(vx, vy, sx, 0); co.armV = arm(vx, vy, 0, sy);
                co.rho = Math.min(RMAX, RUN * Math.min(co.armH, co.armV));
            } else {   // concave: the one cell outside lies at (ox, oy); its neighbours across the two edges are the arms
                const ox = !a || !c ? -1 : 1, oy = !a || !b ? -1 : 1, ocx = ox > 0 ? vx : vx - 1, ocy = oy > 0 ? vy : vy - 1;
                const hcx = ocx - ox, hcy = ocy, vcx = ocx, vcy = ocy - oy;   // (hc: the arm cell across O's vertical edge; vc: across O's horizontal edge)
                co = { vx, vy, kind: 1, sx: ox, sy: oy, hcx, hcy, vcx, vcy, ocx, ocy, style: face(hcx, hcy) && face(vcx, vcy) ? 2 : 1, sh: face(hcx, hcy) ? 2 : 1, sv: face(vcx, vcy) ? 2 : 1,
                    earth: EARTH[n0[hcy * W + hcx]] === 1 || EARTH[n0[vcy * W + vcx]] === 1 };
                co.armH = arm(vx, vy, ox, 0); co.armV = arm(vx, vy, 0, oy);
                co.rho = Math.min(RMAX, RUN * Math.min(co.armH, co.armV));
            }
            if (co.rho < 8 || (anyWater && nearWater(vx, vy))) continue;
            // the pixel rectangle the corner may change (the quadrant's square; a concave one also the 16 px of the arms' band on the hill side)
            const umin = co.kind ? -CONCAVE_MARGIN : 0, px = vx * TW, py = vy * TW;
            // (a convex corner's rectangle is its whole cell: the rim along the arms is laid from the same plain rim tile as the arc's, up to the cell's end,
            // where the next cell's own plain tile goes on in the same columns - the arc and the straight rim are one picture, with no step at the tangent)
            const ext = co.kind === 0 ? TW : co.rho;
            co.x0 = co.sx > 0 ? px + umin : px - ext; co.x1 = co.sx > 0 ? px + ext : px - umin;
            co.y0 = co.sy > 0 ? py + umin : py - ext; co.y1 = co.sy > 0 ? py + ext : py - umin;
            co.ex0 = px - TW; co.ex1 = px + TW; co.ey0 = py - TW; co.ey1 = py + TW;   // (the 4 cells round the vertex: the old corner tiles' own stones are wiped there)
            corners.push(co);
        }
        // clusters: corners within CLUSTER_GAP cells of each other (a step in an edge: one S-shaped curve, painted as one)
        const par = corners.map((_, i) => i), find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
        for (let i = 0; i < corners.length; i++) for (let j = i + 1; j < corners.length; j++)
            if (Math.abs(corners[i].vx - corners[j].vx) <= CLUSTER_GAP && Math.abs(corners[i].vy - corners[j].vy) <= CLUSTER_GAP) par[find(i)] = find(j);
        const byRoot = new Map();
        corners.forEach((co, i) => { const r = find(i); if (!byRoot.has(r)) byRoot.set(r, []); byRoot.get(r).push(co); });
        const clusters = [];
        for (const cs of byRoot.values()) {
            const cl = { corners: cs, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, done: false, pieces: null, added: 0 };
            for (const co of cs) { cl.x0 = Math.min(cl.x0, co.ex0); cl.y0 = Math.min(cl.y0, co.ey0); cl.x1 = Math.max(cl.x1, co.ex1); cl.y1 = Math.max(cl.y1, co.ey1); }
            cl.cx = (cl.x0 + cl.x1) / 2; cl.cy = (cl.y0 + cl.y1) / 2;
            clusters.push(cl);
        }
        // where the corners are, by vertex; the cells of the UPPER part of a plateau's sides (the two cells under a top corner, beside its vertical arm)
        const vmap = new Map();
        for (const co of corners) {
            vmap.set(co.vy * (W + 1) + co.vx, co);
        }
                // the player's regions (RegionLayers.js; the layer 5 of the map): region 3 on the LOWER ground just outside a hill = "from here a character may go
        // behind the hill: the stretch of the edge that faces such a cell gets the effect"; region 2 on the hill = a solid (it is shut by RegionLayers
        // for every pixel of its cells - here only the band's pixels at a region-3 stretch are let through, the rest of the hill is stopped by the
        // drawn line, mask-exact). A hill (the 4-connected silhouette) with a region 3 within 2 cells is judged by the regions ONLY ("rm");
        // the other hills keep the automatic edge.
        const reg = new Uint8Array(N), comp = new Int32Array(N).fill(-1), rm = new Uint8Array(N), corRow = new Map();
        for (let i = 0; i < N; i++) reg[i] = data.length >= 6 * N ? data[5 * N + i] : 0;
        let nc = 0;
        for (let i0 = 0; i0 < N; i0++) {
            if (!hin[i0] || comp[i0] >= 0) continue;
            const stack = [i0], cells = [];
            comp[i0] = nc;
            while (stack.length) {
                const i = stack.pop(); cells.push(i);
                const x = i % W, y = (i / W) | 0;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && hin[yy * W + xx] && comp[yy * W + xx] < 0) { comp[yy * W + xx] = nc; stack.push(yy * W + xx); } }
            }
            let has = false;
            for (const i of cells) {
                const x = i % W, y = (i / W) | 0;
                for (let yy = Math.max(0, y - 2); yy <= Math.min(H - 1, y + 2) && !has; yy++) for (let xx = Math.max(0, x - 2); xx <= Math.min(W - 1, x + 2); xx++) if (reg[yy * W + xx] === 3) { has = true; break; }
                if (has) break;
            }
            if (has) {
                // the corridor's arcs (the player 2026-11-01: "every rounded place must let one through"): all the rounded corners of such a hill down to one row under its lowest region-3 cell
                let by1 = -1;
                for (const i of cells) {
                    const x = i % W, y = (i / W) | 0;
                    for (let yy = Math.max(0, y - 2); yy <= Math.min(H - 1, y + 2); yy++) for (let xx = Math.max(0, x - 2); xx <= Math.min(W - 1, x + 2); xx++) if (reg[yy * W + xx] === 3) by1 = Math.max(by1, yy);
                }
                for (const i of cells) { rm[i] = 1; corRow.set(i, by1 + 1); }
            }
            nc++;
        }
        return { W, H, n0, hin, corners, clusters, vmap, reg, rm, corRow };
    }

    // ------------------------------------------------------------------
    // 2. Painting a cluster: only the pixels that change, decided by the nearest corner
    // ------------------------------------------------------------------
    // the 48 x 48 pixels of a tile of the layer 0 (an A5 tile, or the interior of an A2 autotile = the ground); null: not applicable / loading
    // (the tiles' pixels are grabbed from the sheet's IMAGE through a small canvas: reading them off the sheet's own canvas makes the engine
    // build that whole canvas first, ~90 ms for a sheet, once - the first entry onto a map with hills would hitch)
    const gcv = document.createElement("canvas");
    gcv.width = gcv.height = TW;
    const gctx = gcv.getContext("2d", { willReadFrequently: true });
    const tileCache = new Map();
    function grab(bm, quads) {
        const src = bm._image || bm.canvas;
        gctx.clearRect(0, 0, TW, TW);
        for (const q of quads) gctx.drawImage(src, q[0], q[1], q[2], q[3], q[4], q[5], q[2], q[3]);
        return gctx.getImageData(0, 0, TW, TW).data;
    }
    function a5Tile(id) {
        const n = id - 1536, key = "5:" + (($gameMap.tileset().tilesetNames || [])[4] || "") + ":" + n;
        let t = tileCache.get(key);
        if (t) return t;
        const bm = K.tileSheet(4);
        if (!bm || !bm.isReady()) return null;
        t = grab(bm, [[(n % 8) * TW, Math.floor(n / 8) * TW, TW, TW, 0, 0]]);
        tileCache.set(key, t);
        return t;
    }
    function a2Tile(id) {   // the interior of an A2 autotile (the ground)
        const d = K.descOf(id);
        if (!d) return null;
        const key = "2:" + (($gameMap.tileset().tilesetNames || [])[d.sheet] || "") + ":" + d.key;
        let t = tileCache.get(key);
        if (t) return t;
        const bm = K.tileSheet(d.sheet);
        if (!bm || !bm.isReady()) return null;
        t = grab(bm, d.quads);
        tileCache.set(key, t);
        return t;
    }
    function art(id) {
        if (id >= 1536 && id < 2048) return a5Tile(id);
        if (id >= 2816 && id < 4352) return a2Tile(id);
        return null;
    }
    const sheetsReady = () => { for (const n of [1, 4]) { const bm = K.tileSheet(n); if (!bm || !bm.isReady()) return false; } return true; };
    const outlineMul = 0.7;
    const mod = (a, m) => ((a % m) + m) % m;
    const hyp = (a, b) => Math.sqrt(a * a + b * b);   // (Math.hypot is several times slower)

    // one corner's geometry at a world point (px, py: a pixel's centre): was it in the hill (oldIn), is it (newIn), its depth from the old / new
    // edge, the new edge's outward normal there. null: outside the corner's rectangle. The rounded edge is the circle of radius rho
    // touching the two arms: convex - the hill inside it; concave - the hill outside it.
    function cornerState(c, px, py) {
        if (px < c.x0 || px >= c.x1 || py < c.y0 || py >= c.y1) return null;
        const convex = c.kind === 0, rho = c.rho, gx = c.sx, gy = c.sy, vx = c.vx * TW, vy = c.vy * TW;
        const u = (px - vx) * gx, v = (py - vy) * gy, cxw = vx + gx * rho, cyw = vy + gy * rho;
        let oldIn, newIn, dOld, dNew, nx, ny;
        if (convex) {
            if (u < 0 || v < 0) return null;
            oldIn = true; dOld = Math.min(u, v);
            const inArc = u < rho && v < rho, r = inArc ? hyp(u - rho, v - rho) : 0;
            newIn = !(inArc && r > rho);
            dNew = inArc ? rho - r : dOld;
            if (inArc) { const l = r || 1; nx = (px - cxw) / l; ny = (py - cyw) / l; } else if (u >= rho) { nx = 0; ny = -gy; } else { nx = -gx; ny = 0; }
        } else {
            oldIn = !(u > 0 && v > 0);
            const inArc = u < rho && v < rho, r = hyp(u - rho, v - rho);
            if (!oldIn && !(inArc && r >= rho)) return null;
            newIn = true;
            if (oldIn) {
                dOld = u > 0 ? -v : v > 0 ? -u : hyp(u, v);
                if (u <= 0 && v > 0 && v >= rho) { dNew = -u; nx = gx; ny = 0; }
                else if (v <= 0 && u > 0 && u >= rho) { dNew = -v; nx = 0; ny = gy; }
                else { dNew = r - rho; const l = r || 1; nx = (cxw - px) / l; ny = (cyw - py) / l; }
                if (dNew < 0) dNew = 0;
            } else { dOld = -1; dNew = r - rho; const l = r || 1; nx = (cxw - px) / l; ny = (cyw - py) / l; }
        }
        return { oldIn, newIn, dOld, dNew, u, v, nx, ny };
    }

    // the distance of a world point of the hill to the nearest edge of the OLD (cell) silhouette
    function oldDepthCells(g, px, py) {
        const cx = Math.floor(px / TW), cy = Math.floor(py / TW), lx = px - cx * TW, ly = py - cy * TW;
        const h = (x, y) => g.hin[Math.max(0, Math.min(g.H - 1, y)) * g.W + Math.max(0, Math.min(g.W - 1, x))];
        let d = 1e9;
        if (!h(cx, cy - 1)) d = Math.min(d, ly);
        if (!h(cx, cy + 1)) d = Math.min(d, TW - ly);
        if (!h(cx - 1, cy)) d = Math.min(d, lx);
        if (!h(cx + 1, cy)) d = Math.min(d, TW - lx);
        return d;
    }

    function cornerCtx(g, c, idAt) {   // what one corner needs to paint (null: a sheet is still loading)
        if (c.ctx) return c.ctx;
        const convex = c.kind === 0;
        const cand = convex ? [[c.hx + c.sx, c.hy + c.sy], [c.hx + c.sx, c.hy], [c.hx, c.hy + c.sy]] : [[c.hcx, c.vcy], [c.hcx, c.hcy], [c.vcx, c.vcy]];
        let grassArt = null;
        for (const [cx, cy] of cand) {   // (the plateau's own ground beside the corner: grass, earth, cobbles... the first ground-like cell inwards)
            const id = idAt(cx, cy);
            if (id >= 2816 || (id >= 1536 && [97, 102, 76, 77, 78, 79, 84, 85, 86, 87].indexOf(id - 1536) >= 0)) { grassArt = art(id); if (grassArt) break; }
        }
        if (!grassArt) grassArt = a5Tile(1536 + (c.earth ? 102 : 97));
        if (!grassArt) return null;
        let faceArt = null;
        if (!convex && (c.sh === 2 || c.sv === 2)) {
            const a1 = art(idAt(c.hcx, c.hcy)), a2 = art(idAt(c.vcx, c.vcy));
            faceArt = (g.face(c.hcx, c.hcy) ? a1 : null) || (g.face(c.vcx, c.vcy) ? a2 : null) || a1 || a2;
            if (!faceArt) return null;
        }
        return (c.ctx = { grassArt, faceArt, hdir: convex ? c.sy : -c.sy, vdir: convex ? c.sx : -c.sx });
    }

    function bakeCluster(g, cl, deadline) {
        if (!sheetsReady()) return undefined;
        const data = $dataMap.data, W = g.W, H = g.H;
        const idAt = (cx, cy) => (cx < 0 || cy < 0 || cx >= W || cy >= H ? 0 : data[cy * W + cx]);
        for (const c of cl.corners) if (!cornerCtx(g, c, idAt)) return undefined;
        const memo = new Map();   // (cell -> its tile id, number and 48 x 48 pixels: looked up once, not for every pixel)
        const cellAt = (cx, cy) => {
            const k = cy * 4096 + cx;
            let m = memo.get(k);
            if (!m) { const id = idAt(cx, cy); m = { id, n: id - 1536, a: art(id) }; memo.set(k, m); }
            return m;
        };
        let miss = false, rule = "";
        const DBG = window.WZGORZA && window.WZGORZA.debug, DBGC = { ground: [255, 0, 0], rim: [0, 0, 255], grass: [0, 255, 0], wipe: [255, 255, 0], extra: [255, 128, 0], face: [255, 0, 255] };
        const rimAt = (wx, wy) => {   // an old pixel of a tile of the corner's neighbourhood (null: not a tile we can read)
            const a = cellAt(Math.floor(wx / TW), Math.floor(wy / TW)).a;
            if (!a) { miss = true; return null; }
            const q = (mod(wy, TW) * TW + mod(wx, TW)) * 4;
            return [a[q], a[q + 1], a[q + 2]];
        };
        const groundAt = (cx, cy, wx, wy) => {
            const a = cellAt(cx, cy).a;
            if (!a) return null;
            const q = (Math.min(45, Math.max(2, mod(wy, TW))) * TW + Math.min(45, Math.max(2, mod(wx, TW)))) * 4;   // (not the tile's edge columns: the autotile's rim is dark there)
            return [a[q], a[q + 1], a[q + 2]];
        };
        const texAt = (a, wx, wy, m) => { const q = (mod(wy, TW) * TW + mod(wx, TW)) * 4; return [a[q] * m, a[q + 1] * m, a[q + 2] * m]; };
        // the picture of one pixel by its controlling corner (null: unchanged)
        // the new rim at a pixel: the pixels of the old straight rim taken along the old edge, at the pixel's depth from the NEW edge; on the arc
        // the place along the rim runs by the arc's length from the tangent (so the stones go on in one row where the arc leaves the straight)
        const rimSample = (c, u, v, dNew, wx, wy) => {
            const ctx = c.ctx, rho = c.rho, gx = c.sx, gy = c.sy, vx = c.vx * TW, vy = c.vy * TW, t = Math.max(0, Math.floor(dNew));
            const hy = ctx.hdir > 0 ? vy + t : vy - t - 1, vxx = ctx.vdir > 0 ? vx + t : vx - t - 1;
            // (a convex corner's own tile has the corner's stones in it: the rim is taken from the plain rim tile next along the arm, the same columns / rows)
            const at = (x, y, shx, shy) => {
                if (c.kind === 0) { const ci = cellAt(Math.floor((x + shx) / TW), Math.floor((y + shy) / TW)); if (ci.id >= 1536 && ci.id < 2048 && RIM[ci.n]) return rimAt(x + shx, y + shy); }
                return rimAt(x, y);
            };
            if (u < rho && v < rho) {
                const phi = Math.atan2(rho - u, rho - v);   // (0 on the horizontal arm's tangent, PI / 2 on the vertical one's)
                if (phi <= Math.PI / 4) return at(Math.floor(vx + gx * (rho - rho * phi)), hy, gx * TW, 0);
                return at(vxx, Math.floor(vy + gy * (rho - rho * (Math.PI / 2 - phi))), 0, gy * TW);
            }
            return Math.abs(v - rho) >= Math.abs(u - rho) ? at(wx, hy, gx * TW, 0) : at(vxx, wy, 0, gy * TW);
        };
        // the picture of one pixel by its controlling corner (null: unchanged)
        const pixel = (c, wx, wy) => {
            const st = cornerState(c, wx + 0.5, wy + 0.5);
            if (!st) return null;
            const { oldIn, newIn, dOld, dNew, u, v } = st, convex = c.kind === 0, gx = c.sx, gy = c.sy, ctx = c.ctx;
            if (oldIn && !newIn) {   // cut off: the ground across the edge (convex only)
                rule = "ground"; return groundAt(u < v ? c.hx - gx : c.hx, u < v ? c.hy : c.hy - gy, wx, wy);
            }
            const sty = convex ? c.style : (c.sh === c.sv ? c.sh : (v < u ? c.sv : c.sh));   // (concave: the style of the nearer arm)
            if (sty === 1) {
                const ext = convex && (u >= c.rho || v >= c.rho);   // (the stretch of the arm beyond the tangent: only the solid band of the rim is laid, the old art's own stones beyond it stay)
                if (dNew < (ext ? 7 : RIMW)) { rule = "rim"; return rimSample(c, u, v, dNew, wx, wy); }   // (the whole new band is laid, equal to the old art where the edge did not move)
                if (!oldIn) { rule = "grass"; return texAt(ctx.grassArt, wx, wy, 1); }
                const od = Math.min(dOld, oldDepthCells(g, wx + 0.5, wy + 0.5));   // (the depth from the nearest OLD edge of any kind: a neighbouring corner's edge counts too)
                if (Math.abs(dNew - od) > 1) {   // the old rim of a replaced stretch: wiped to the plateau's ground
                    if (od < OLDBAND) { rule = "grass"; return texAt(ctx.grassArt, wx, wy, 1); }
                    const ci = cellAt(Math.floor(wx / TW), Math.floor(wy / TW)), id = ci.id, n = ci.n, a = ci.a;
                    if (a && id >= 1536 && id < 2048 && !FACE[n] && !STAIR[n]) {   // (and any stone of the old corner's art deeper than that)
                        const q = (mod(wy, TW) * TW + mod(wx, TW)) * 4;
                        if (K.rimStone(a, q, EARTH[n] === 1)) { rule = "wipe"; return texAt(ctx.grassArt, wx, wy, 1); }
                    }
                }
                return null;
            }
            if (!oldIn) return texAt(ctx.faceArt, wx, wy, dNew < OUTL ? outlineMul : 1);   // the pocket of a concave corner of the face
            if (convex && dNew < OUTL) { const a = cellAt(c.hx, c.hy).a; return a ? texAt(a, wx, wy, outlineMul) : null; }   // the face's foot: a darker line
            return null;
        };
        // the stones of an old corner tile's own art (blobs deeper than the rim band, in the four cells round the vertex) outside the corner's
        // rectangle: gone, as the whole old rim of a replaced stretch is (only stones of a plateau's rim tiles, never the face)
        const extra = (c, wx, wy) => {
            if (wx < c.ex0 || wx >= c.ex1 || wy < c.ey0 || wy >= c.ey1) return null;
            const vx = c.vx * TW, vy = c.vy * TW, u = (wx + 0.5 - vx) * c.sx, v = (wy + 0.5 - vy) * c.sy;
            const convex = c.kind === 0;
            if (convex ? (u < 0 || v < 0) : (u > 0 && v > 0)) return null;
            const dOld = convex ? Math.min(u, v) : (u > 0 ? -v : v > 0 ? -u : hyp(u, v));
            if (dOld < 12 || oldDepthCells(g, wx + 0.5, wy + 0.5) < 12) return null;   // (stones on ANY old edge's rim stay: only blobs deeper than 12 px from every old edge go)
            const ci = cellAt(Math.floor(wx / TW), Math.floor(wy / TW)), id = ci.id, n = ci.n;
            if (!(id >= 1536 && id < 2048 && (RIM[n] || n === 76 || n === 77 || n === 78 || n === 79 || n === 84 || n === 85 || n === 86 || n === 87))) return null;
            const a = ci.a;
            if (!a) { miss = true; return null; }
            const q = (mod(wy, TW) * TW + mod(wx, TW)) * 4;
            return K.rimStone(a, q, EARTH[n] === 1) ? (rule = "extra", texAt(c.ctx.grassArt, wx, wy, 1)) : null;
        };
        // (one tile of 48 x 48 px at a time: the clusters of a big hill are long, a frame's budget is kept between the tiles)
        if (!cl.tiles) {
            cl.tiles = []; cl.ti = 0; cl.pieces = [];
            for (let ty = Math.floor(cl.y0 / TW); ty <= Math.floor((cl.y1 - 1) / TW); ty++) for (let tx = Math.floor(cl.x0 / TW); tx <= Math.floor((cl.x1 - 1) / TW); tx++) cl.tiles.push([tx, ty]);
        }
        for (; cl.ti < cl.tiles.length; cl.ti++) {
            if (cl.ti > 0 && performance.now() > deadline) return false;
            const [tx, ty] = cl.tiles[cl.ti];
            const img = new ImageData(TW, TW), d = img.data;
            let any = false;
            const mine = cl.corners.filter(c => c.ex1 > tx * TW && c.ex0 < tx * TW + TW && c.ey1 > ty * TW && c.ey0 < ty * TW + TW);
            if (!mine.length) continue;
            // the owner of each pixel: the nearest corner whose rectangle holds it (each corner walks its own rectangle only)
            const owner = new Int8Array(TW * TW).fill(-1), od = new Float32Array(TW * TW).fill(1e9), X0 = tx * TW, Y0 = ty * TW;
            mine.forEach((c, k) => {
                const i0 = Math.max(0, c.x0 - X0), i1 = Math.min(TW, c.x1 - X0), j0 = Math.max(0, c.y0 - Y0), j1 = Math.min(TW, c.y1 - Y0), cvx = c.vx * TW, cvy = c.vy * TW;
                for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
                    const dd = Math.max(Math.abs(X0 + i + 0.5 - cvx), Math.abs(Y0 + j + 0.5 - cvy)), o = j * TW + i;
                    if (dd < od[o]) { od[o] = dd; owner[o] = k; }
                }
            });
            const put = (j, i, col) => { const p = (j * TW + i) * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255; any = true; };
            for (let o = 0; o < TW * TW; o++) {
                if (owner[o] < 0) continue;
                const j = (o / TW) | 0, i = o - j * TW;
                let col = pixel(mine[owner[o]], X0 + i, Y0 + j);
                if (col && DBG) col = DBGC[rule] || [255, 255, 255];
                if (col) put(j, i, col);
            }
            for (const c of mine) {   // (the old corner tiles' own stones round the vertex)
                if (!(c.style === 1 || c.sh === 1 || c.sv === 1)) continue;
                const i0 = Math.max(0, c.ex0 - X0), i1 = Math.min(TW, c.ex1 - X0), j0 = Math.max(0, c.ey0 - Y0), j1 = Math.min(TW, c.ey1 - Y0);
                const cvx = c.vx * TW, cvy = c.vy * TW, convex = c.kind === 0;
                for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
                    if (owner[j * TW + i] >= 0) continue;
                    const eu = (X0 + i + 0.5 - cvx) * c.sx, ev = (Y0 + j + 0.5 - cvy) * c.sy;   // (the cheap rejects inline: this loop is the most pixels)
                    if (convex ? (eu < 12 || ev < 12) : ((eu > 0 && ev > 0) || (eu > 0 ? -ev : ev > 0 ? -eu : 99) < 12)) continue;
                    let col = extra(c, X0 + i, Y0 + j);
                    if (col && DBG) col = DBGC[rule] || [255, 255, 255];
                    if (col) put(j, i, col);
                }
            }
            if (miss) return undefined;   // (a sheet is loading: this tile again later)
            if (!any) continue;
            const sl = K.atlasSlot(g, "w", SLOT, 480);
            sl.at.bm.context.putImageData(img, sl.sx, sl.sy);
            cl.pieces.push({ sl, x: tx * TW, y: ty * TW });
            if (g.keepPatch) g.patch.set(ty * 4096 + tx, d);
        }
        return true;
    }

    // ------------------------------------------------------------------
    // 3. The sprite: one container, the baked pictures as its children
    // ------------------------------------------------------------------
    let geo = null;   // { key, W, H, n0, hin, corners, clusters, strips, atlas, queue, ... }
    const stat = { bakeMs: 0, baked: 0, frames: 0, prepMs: 0 };
    function geometry() {
        const key = $gameMap.mapId() + ":" + $dataMap.width + "x" + $dataMap.height + ":" + $gameMap.tilesetId();
        if (geo && geo.key === key && geo.data === $dataMap.data) return geo;
        if (geo) K.dropAtlas(geo);
        stat.bakeMs = stat.baked = stat.frames = stat.prepMs = 0;
        const t0 = performance.now();
        const g = buildGeo($dataMap.width, $dataMap.height, $dataMap.data, SHORE_MAPS.indexOf($gameMap.mapId()) >= 0);
        g.key = key; g.data = $dataMap.data; g.atlas = null; g.queue = null; g.todo = g.clusters.length;
        g.patch = new Map(); g.cap = new Map(); g.keepPatch = WALK_MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.WZGORZA_AUDIT || !!window.WZGORZA_WALK_ALL;
        g.face = (x, y) => { if (x < 0 || y < 0 || x >= g.W || y >= g.H) return false; const n = g.n0[y * g.W + x]; return n >= 0 && (FACE[n] === 1 || STAIR[n] === 1); };
        g.buildMs = performance.now() - t0;
        geo = g;
        return g;
    }

    function Sprite_Wzgorza() { this.initialize(...arguments); }
    Sprite_Wzgorza.prototype = Object.create(Sprite.prototype);
    Sprite_Wzgorza.prototype.constructor = Sprite_Wzgorza;
    Sprite_Wzgorza.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.55;
        this._box = new Sprite();
        this._box.update = function() {};
        this.addChild(this._box);
        this._key = "";
        this._lastCull = null;
    };
    Sprite_Wzgorza.prototype.rebuild = function() {
        this._box.removeChildren();
        this._lastCull = null;
        const g = geometry();
        this._key = g.key;
        for (const cl of g.clusters) if (cl.pieces) { for (const p of cl.pieces) this._box.addChild(this.piece(p)); cl.added = cl.pieces.length; }
    };
    Sprite_Wzgorza.prototype.piece = function(p) {
        const s = new Sprite(p.sl.at.bm);
        s.setFrame(p.sl.sx, p.sl.sy, TW, TW);
        s.x = p.x; s.y = p.y; s._bx = [p.x, p.y, p.x + TW, p.y + TW];
        s.update = function() {};
        return s;
    };
    // the clusters to bake, the nearest to the screen's middle first
    function order(g) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), v = T.view();
        const cx = $gameMap.displayX() * tw + v.w / 2, cy = $gameMap.displayY() * th + v.h / 2;
        g.queue = g.clusters.filter(c => !c.done).sort((a, b) => hyp(a.cx - cx, a.cy - cy) - hyp(b.cx - cx, b.cy - cy));
        g.orderAt = Graphics.frameCount;
    }
    Sprite_Wzgorza.prototype.work = function(budget, onlyScreen) {
        const g = geo;
        if (!g || !g.clusters.length) return true;
        if (!sheetsReady()) return false;
        if (!g.queue || (g.queue.length && Graphics.frameCount - g.orderAt > 120)) order(g);
        const t0 = performance.now(), tw = $gameMap.tileWidth();
        const ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * $gameMap.tileHeight(), vw = T.view.w(), vh = T.view.h(), pad = onlyScreen ? 0 : 2 * TW;
        let left = 0;
        for (const cl of g.queue) {
            if (cl.done) continue;
            if (onlyScreen && (cl.x1 + pad < ox || cl.x0 - pad > ox + vw || cl.y1 + pad < oy || cl.y0 - pad > oy + vh)) continue;
            const res = bakeCluster(g, cl, t0 + budget);
            if (res === undefined) { left++; break; }   // (a sheet is loading: tried again)
            for (; cl.added < cl.pieces.length; cl.added++) { this._box.addChild(this.piece(cl.pieces[cl.added])); stat.baked++; }
            if (res === true) { cl.done = true; g.todo--; } else { left++; break; }   // (false: out of budget, the rest of this cluster next time)
        }
        K.flushAtlas(g);
        stat.bakeMs += performance.now() - t0;
        if (left) return false;
        return onlyScreen ? true : g.todo <= 0;
    };
    // while the screen is still black: the clusters on the screen (and the pad of 2 cells round it) are painted at once
    Sprite_Wzgorza.prototype.prepare = function() {
        if (!active()) return true;
        if (this._key !== geometry().key) this.rebuild();
        if (this._prepKey === this._key) return true;   // (once per entry: 9 ms of the screen's corners nearest its middle - the rest comes within the next half second)
        this._prepKey = this._key;
        const t0 = performance.now();
        this.work(9, true);
        stat.prepMs += performance.now() - t0;
        return true;
    };
    Sprite_Wzgorza.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const show = active();
        this.visible = show;
        if (!show) return;
        if (this._key !== geometry().key) this.rebuild();
        const g = geo, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        if (g.todo > 0) { this.work(2.5, false); stat.frames++; }
        const ox = -Math.ceil($gameMap.displayX() * tw), oy = -Math.ceil($gameMap.displayY() * th);   // (as the tilemap: its origin is rounded UP - Tilemap.updateTransform)
        this._box.x = ox; this._box.y = oy;
        // (a cull of the pictures: only every ~50 px of scroll, and when pieces came)
        const lc = this._lastCull, n = this._box.children.length;
        if (!lc || Math.abs(lc.ox - ox) >= 48 || Math.abs(lc.oy - oy) >= 48 || lc.n !== n) {
            this._lastCull = { ox, oy, n };
            const m = 2 * TW;
            for (const s of this._box.children) s.renderable = T.view.sees(ox + s._bx[0] - m, oy + s._bx[1] - m, ox + s._bx[2] + m, oy + s._bx[3] + m);
        }
    };

    // ------------------------------------------------------------------
    // 4. The edge as a PIXEL MASK: where a character of the lower ground may stand behind it, and what is drawn over it there
    // ------------------------------------------------------------------
    // edgeState(g, px, py): is the world point inside the plateau as it is drawn NOW (rounded), how deep from its edge, and what faces out there:
    // kind 1 - the BACK edge (the outward normal looks north), 2 - the UPPER part of a side, 0 - any other edge (the face's foot, the lower sides).
    const OUT = Object.freeze({ inn: false, d: 0, kind: 0, lim: 0 });
    const hAtG = (g, x, y) => g.hin[Math.max(0, Math.min(g.H - 1, y)) * g.W + Math.max(0, Math.min(g.W - 1, x))];
    // lim: how deep (px) the feet of a lower character may go behind the edge here - DEPTH_N where the edge faces north, less and less where it turns
    // (the end of a rounded back corner: the effect ends gently, no jump), 0 on the sides and the face (it stops on the drawn line); the player's
    // regions decide where it is on at all (region 3 on the rim cell; 2 there: never)
    const limOf = (g, cx, cy, px, py, d, nx, ny) => {   // (the player's rules 2026-11-01: ONLY behind a BACK edge - any stretch facing north, the level part of an arc and the lower back edges at the steps; never a side)
        if (g.rm[cy * g.W + cx]) {   // a hill with the player's regions: only the cells with a region 3 (on the rim cell of the edge, or on the lower ground's cell in front of it) - one whole cell deep
            const qx = Math.floor((px + nx * (d + 3)) / TW), qy = Math.floor((py + ny * (d + 3)) / TW);
            const outside = qx >= 0 && qy >= 0 && qx < g.W && qy < g.H && g.reg[qy * g.W + qx] === 3;
            if (g.reg[cy * g.W + cx] !== 3 && !outside) return 0;
        }
        const k = Math.max(0, Math.min(1, (-ny - 0.35) / 0.5));
        return DEPTH_N * k * k * (3 - 2 * k);
    };
    function edgeState(g, px, py) {
        const cx = Math.floor(px / TW), cy = Math.floor(py / TW);
        if (cx < 0 || cy < 0 || cx >= g.W || cy >= g.H) return OUT;
        let best = null, bd = 1e9;
        for (let vy = cy; vy <= cy + 1; vy++) for (let vx = cx; vx <= cx + 1; vx++) {
            const c = g.vmap.get(vy * (g.W + 1) + vx);
            if (!c || px < c.x0 || px >= c.x1 || py < c.y0 || py >= c.y1) continue;
            const dd = Math.max(Math.abs(px - c.vx * TW), Math.abs(py - c.vy * TW));
            if (dd < bd) { bd = dd; best = c; }
        }
        if (best) {
            const s = cornerState(best, px, py);
            if (s) {
                if (!s.newIn) return OUT;
                // an ARC of a hill with the player's regions belongs to the corridor as a whole (flat depth, to where it meets a straight side), unless it faces down (the face's foot)
                const cr = g.rm[cy * g.W + cx] ? g.corRow.get(cy * g.W + cx) : undefined;
                const lim = cr !== undefined && best.vy <= cr && s.ny < 0.3 ? DEPTH_N * Math.max(0.82, Math.min(1, -s.ny)) : limOf(g, cx, cy, px, py, s.dNew, s.nx, s.ny);   // (on a slanted arc the depth is measured as it is DOWN from the line, so the visible head is as tall as on the straight edge: the perpendicular depth shrinks with the normal's vertical part)
                return { inn: true, d: s.dNew, kind: lim > 0 ? 1 : 0, lim, ny: s.ny, nx: s.nx };
            }
        }
        if (!g.hin[cy * g.W + cx]) return OUT;
        const lx = px - cx * TW, ly = py - cy * TW;
        let d = 1e9, nx = 0, ny = 0;
        if (!hAtG(g, cx, cy - 1) && ly < d) { d = ly; nx = 0; ny = -1; }
        if (!hAtG(g, cx, cy + 1) && TW - ly < d) { d = TW - ly; nx = 0; ny = 1; }
        if (!hAtG(g, cx - 1, cy) && lx < d) { d = lx; nx = -1; ny = 0; }
        if (!hAtG(g, cx + 1, cy) && TW - lx < d) { d = TW - lx; nx = 1; ny = 0; }
        const lim = limOf(g, cx, cy, px, py, d, nx, ny);
        if (d > 1e8) {   // a cell with no edge of its own (a notch's inner corner is a cell away): the nearest lower-ground cell's box stands for the line (a little short of the true rounded one)
            let m = 1e9, mx = 0, my = 0;
            for (let yy = cy - 2; yy <= cy + 2; yy++) for (let xx = cx - 2; xx <= cx + 2; xx++) {
                if (hAtG(g, xx, yy) && xx >= 0 && yy >= 0 && xx < g.W && yy < g.H) continue;
                const ddx = Math.max(xx * TW - px, 0, px - (xx * TW + TW)) * (px < xx * TW ? 1 : -1), ddy = Math.max(yy * TW - py, 0, py - (yy * TW + TW)) * (py < yy * TW ? 1 : -1);
                const dd = Math.hypot(ddx, ddy);
                if (dd < m) { m = dd; mx = ddx; my = ddy; }
            }
            if (m < 1e8) {
                d = m;
                // (and where it is a corridor's arc - the nearest outside is round the corner, not straight beside or under it - the strip goes on here too)
                const cr = g.rm[cy * g.W + cx] ? g.corRow.get(cy * g.W + cx) : undefined, l = m || 1;
                if (cr !== undefined && cy <= cr && my / l < 0.3 && my !== 0 && m > 0) return { inn: true, d, kind: 1, lim: DEPTH_N * Math.max(0.82, Math.min(1, -my / l)), ny: my / l, nx: mx / l };
            }
        }
        return { inn: true, d, kind: lim > 0 ? 1 : 0, lim, ny, nx };
    }
    const FM = PluginManager.parameters("FreeMovement") || {};
    const HIT_W = Math.max(0.2, Math.min(1, Number(FM.hitboxWidth) || 0.56)), HIT_H = Math.max(0.2, Math.min(1, Number(FM.hitboxHeight) || 0.5));
    const HALF = Math.max(1, Math.round(HIT_W * TW / 2)), HIGH = Math.max(1, Math.round(HIT_H * TW));
    const feetBox = (fx, fy) => {
        const cx = fx + Math.floor(TW / 2);
        return { x0: Math.floor((cx - HALF) / TW), x1: Math.floor((cx + HALF - 1) / TW), y0: Math.floor((fy + TW - HIGH) / TW), y1: Math.floor((fy + TW - 1) / TW) };
    };
    function feetPts(fx, fy) {   // 9 points of the feet box of a sprite whose top-left is (fx, fy)
        const x0 = fx + TW / 2 - HALF + 0.5, x1 = fx + TW / 2 + HALF - 0.5, xm = fx + TW / 2, y0 = fy + TW - HIGH + 0.5, y1 = fy + TW - 0.5, ym = (y0 + y1) / 2;
        return [[x0, y0], [xm, y0], [x1, y0], [x0, ym], [xm, ym], [x1, ym], [x0, y1], [xm, y1], [x1, y1]];
    }
    // 0: the feet are outside every plateau; 1: inside only by what a strip allows (behind the edge); 2: deeper than that, or where no strip is
    function standing(g, fx, fy) {
        let inside = false;
        const pts = feetPts(fx, fy);
        for (let k = 0; k < pts.length; k++) {
            const s = edgeState(g, pts[k][0], pts[k][1]);
            if (!s.inn) continue;
            inside = true;
            if (!fits(s, k === 7)) return 2;
        }
        return inside ? 1 : 0;
    }
    // (the depth limit is held by the middle of the feet's lower edge - the point the head stands over; the rest of the feet box may be a little deeper where the line bends)
    const SLACK = 14;
    const fits = (s, center) => s.d <= s.lim + (!center && s.lim > 0 ? SLACK : 0);
    // a point of the character's body (a sprite 48 x 48 over its feet, and the shadow a little under them) that lies on a plateau where no band
    // is drawn - deeper than COVER, or in a tile without a band: such a character cannot be covered, so it is never "behind" there
    function bodyBad(g, fx, fy) {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) {   // (the body only - the character's picture is 64 high, hair included; the shadow under the feet is hidden while it is covered, it needs no band)
            const x = fx + 4 + i * 13, y = fy - 20 + j * 12.5;
            const s = edgeState(g, x, y);
            if (s.inn && (s.d > COVER || !capable(g, Math.floor(x / TW), Math.floor(y / TW)))) return true;
        }
        return false;
    }
    function maxDepth(g, fx, fy) { let m = 0; for (const [x, y] of feetPts(fx, fy)) { const s = edgeState(g, x, y); if (s.inn && s.d > m) m = s.d; } return m; }
    function tileBlocks(g, tx, ty, fx, fy) {   // do feet points inside this tile go where they may not?
        const pts = feetPts(fx, fy);
        for (let k = 0; k < pts.length; k++) {
            const x = pts[k][0], y = pts[k][1];
            if (Math.floor(x / TW) !== tx || Math.floor(y / TW) !== ty) continue;
            const s = edgeState(g, x, y);
            if (s.inn && !fits(s, k === 7)) return true;
        }
        return false;
    }
    function capable(g, tx, ty) {   // does the tile hold pixels of a band (cached; the tile sampled 6 x 6)
        const k = ty * 4096 + tx;
        let v = g.cap.get(k);
        if (v === undefined) {
            v = false;
            for (let j = 0; j < 6 && !v; j++) for (let i = 0; i < 6; i++) { const s = edgeState(g, tx * TW + 4 + i * 8, ty * TW + 4 + j * 8); if (s.inn && s.kind > 0 && s.d <= COVER) { v = true; break; } }
            g.cap.set(k, v);
        }
        return v;
    }
    // the picture of the plateau at a world pixel as it is drawn: a baked corner picture, else the tile's own pixel (the layer 0)
    function compositeAt(g, wx, wy) {
        const tx = Math.floor(wx / TW), ty = Math.floor(wy / TW), pd = g.patch.get(ty * 4096 + tx), q = (mod(wy, TW) * TW + mod(wx, TW)) * 4;
        if (pd && pd[q + 3]) return [pd[q], pd[q + 1], pd[q + 2]];
        const a = art($dataMap.data[ty * g.W + tx]);
        return a ? [a[q], a[q + 1], a[q + 2]] : null;
    }

    // The band drawn over a character: the plateau's own pixels (as drawn now, rounded corners included) of the back edge / upper sides, to
    // COVER px deep, laid over the characters - in 48 x 48 pieces, baked when a character first stands near, ALL or NOTHING: a character
    // whose feet are behind the edge has everything of it that lies on the plateau covered (legs, shadow) and the edge line is before it;
    // one in front of the edge or on the plateau is drawn whole and the band is not drawn at all.
    function Sprite_WzgorzaLip() { this.initialize(...arguments); }
    Sprite_WzgorzaLip.prototype = Object.create(Sprite.prototype);
    Sprite_WzgorzaLip.prototype.constructor = Sprite_WzgorzaLip;
    Sprite_WzgorzaLip.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 4.1;   // (over the characters, z 3, and the shadows, z 2)
        this._box = new Sprite();
        this._box.update = function() {};
        this.addChild(this._box);
        this._key = ""; this._pieces = new Map(); this._on = new Set(); this._old = new Set(); this._t = 0;
    };
    // the world as it is DRAWN under the characters at one tile (the base layers: ground, our corner pictures, the shore, the decorations - not the
    // characters, their shadows, nor the band itself): rendered into a small texture. The band is made of these pixels, so it is the same picture
    // as the ground under it wherever the ground is repainted by another plugin (the red shore, Ziemia...).
    let capRT = null;
    function captureTile(tx, ty) {
        const sset = SceneManager._scene._spriteset, tm = sset._tilemap, r = Graphics._app.renderer;
        if (!capRT) capRT = PIXI.RenderTexture.create({ width: TW, height: TW });
        const lip = sset._wzgorzaLip, saved = [];
        // (the sun's shadow layer at z 1.8 stays - the trees' and buildings' shadows are part of the ground as drawn - but the characters' own shadows in it go)
        for (const ch of tm.children) if (ch.visible && ((ch.z >= 1.9 && ch.z < 4.3) || ch === lip)) { saved.push(ch); ch.visible = false; }
        for (const cs of sset._characterSprites || []) for (const sh of [cs._sunShadow, cs._groundShadow]) if (sh && sh.visible) { saved.push(sh); sh.visible = false; }
        const filt = tm.filters; tm.filters = null;
        // (the tilemap's origin may be a frame behind the scroll while the hero walks, our corner pictures follow the scroll itself: the capture is made with
        // the tilemap at the scroll as it is NOW, else the ground and our pictures come a pixel or three apart - 2026-11-01, the "corners change while walking")
        const sox = tm.origin.x, soy = tm.origin.y, dX = $gameMap.displayX() * TW, dY = $gameMap.displayY() * TW;
        tm.origin.x = dX; tm.origin.y = dY;
        const ox = Math.ceil(dX), oy = Math.ceil(dY);
        r.render(tm, capRT, true, new PIXI.Matrix(1, 0, 0, 1, -(tx * TW - ox), -(ty * TW - oy)));
        tm.origin.x = sox; tm.origin.y = soy;
        tm.filters = filt;
        for (const ch of saved) ch.visible = true;
        return r.extract.pixels(capRT);
    }
    // (which pixels of a tile the band takes - every plateau pixel within COVER of an edge, of any kind, in a tile that holds a band: a stretch of the edge that turns away - a corner -
    // is covered too; it hangs on the geometry only, so it is worked out once per tile and kept)
    function bandMask(g, tx, ty) {
        const ms = g.lipMask || (g.lipMask = new Map()), k = ty * 4096 + tx;
        let m = ms.get(k);
        if (m) return m;
        const ps = [];
        for (let j = 0; j < TW; j++) for (let i = 0; i < TW; i++) {
            const s = edgeState(g, tx * TW + i + 0.5, ty * TW + j + 0.5);
            if (s.inn && s.d <= COVER) ps.push((j * TW + i) * 4);
        }
        m = Int32Array.from(ps); ms.set(k, m);
        return m;
    }
    // (into: a piece baked before - renewed in its own place of the atlas, so the renewals neither grow the atlas nor make a new picture)
    function bakeBand(g, tx, ty, into) {
        if (T.view.scale() !== 1) return undefined;
        const tm = SceneManager._scene._spriteset._tilemap;   // (the tilemap's own origin follows the scroll a frame late: baked when it has caught up and the tile is on its drawn part)
        if (Math.abs(tm.origin.x - $gameMap.displayX() * TW) > 6 || Math.abs(tm.origin.y - $gameMap.displayY() * TW) > 6) return undefined;
        const lx = tx * TW - Math.ceil($gameMap.displayX() * TW), ly = ty * TW - Math.ceil($gameMap.displayY() * TW);
        if (lx < -TW || ly < -TW || lx > Graphics.width || ly > Graphics.height) return undefined;
        const m = bandMask(g, tx, ty);
        if (!m.length) return null;
        const cap = captureTile(tx, ty), img = new ImageData(TW, TW), d = img.data;
        for (const p of m) { d[p] = cap[p]; d[p + 1] = cap[p + 1]; d[p + 2] = cap[p + 2]; d[p + 3] = 255; }
        const sl = into ? into._slot : K.atlasSlot(g, "l", SLOT, 480);
        sl.at.bm.context.putImageData(img, sl.sx, sl.sy);
        sl.at.dirty = true;
        K.flushAtlas(g);
        if (into) return into;
        const sp = new Sprite(sl.at.bm);
        sp.setFrame(sl.sx, sl.sy, TW, TW);
        sp.x = tx * TW; sp.y = ty * TW; sp.visible = false; sp.update = function() {}; sp._slot = sl;
        return sp;
    }
    Sprite_WzgorzaLip.prototype.rebuild = function() {
        this._box.removeChildren(); this._pieces.clear(); this._on.clear(); this._old.clear();
        const at = geo && geo.atlas && geo.atlas.l;   // (the copies' own atlas goes with them, else every renewal would leave a bitmap behind)
        if (at) { for (const a of at) a.bm.destroy(); geo.atlas.l = []; }
        this._key = geometry().key;
    };
    Sprite_WzgorzaLip.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const show = walkHere();
        this.visible = show;
        if (!show) return;
        if (this._key !== geometry().key) this.rebuild();
        // (the copies of the world are made once, but the world moves on: the sun's shadows of trees and buildings creep (a game hour is 60 s), the weather - every ~3 s of play or at
        // another weather they go stale and the ones in sight are made anew in their own places, ONE A FRAME: all at once every 0.6 s it was a 12-15 ms frame twice a second
        // behind the hill at CPU 4x, 2026-11-03; the clouds' shadows are over the whole map, not in the copy)
        const hr = typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 0, wt = $gameScreen.weatherType();
        if (this._hour === undefined) { this._hour = hr; this._weather = wt; }
        else if (Math.min(Math.abs(hr - this._hour), 24 - Math.abs(hr - this._hour)) > RENEW_H || wt !== this._weather) { this._hour = hr; this._weather = wt; for (const [k, pc] of this._pieces) if (pc) this._old.add(k); }
        const g = geo, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        this._box.x = -Math.ceil($gameMap.displayX() * tw); this._box.y = -Math.ceil($gameMap.displayY() * th);
        if (!g.corners.length || !sheetsReady() || g.todo > 0) return;
        const hits = new Set();
        const dx = $gameMap.displayX(), dy = $gameMap.displayY(), sw = T.view.w() / tw + 4, sh = T.view.h() / th + 4;
        const look = (ch, into) => {
            if (!ch || ch._transparent || ch._realX < dx - 3 || ch._realX > dx + sw || ch._realY < dy - 3 || ch._realY > dy + sh) return;
            const fx = Math.round(ch._realX * TW), fy = Math.round(ch._realY * TW);
            const tx0 = Math.floor((fx - 12) / TW), tx1 = Math.floor((fx + TW + 12) / TW), ty0 = Math.floor((fy - 30) / TW), ty1 = Math.floor((fy + TW + 8) / TW);
            let near = false;
            for (let y = ty0; y <= ty1 && !near; y++) for (let x = tx0; x <= tx1; x++) if (capable(g, x, y)) { near = true; break; }
            if (ch === $gamePlayer) {   // (the hero's level from where he stands, also after a teleport: the hook below only sees him when he moves)
                let allIn = true, allOut = true;
                for (const [x, y] of feetPts(fx, fy)) { if (edgeState(g, x, y).inn) allOut = false; else allIn = false; }
                if (allOut) ch._wzUp = false; else if (allIn && standing(g, fx, fy) === 2) ch._wzUp = true;
            }
            if (!near || standing(g, fx, fy) !== 1 || bodyBad(g, fx, fy) || (ch === $gamePlayer && ch._wzUp)) return;   // (all or nothing: only a character whose FEET are behind the edge is covered; outside it, or on the plateau, it is drawn whole, the band not at all)
            for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (capable(g, x, y)) into.add(y * 4096 + x);
            ch._wzCoverAt = Graphics.frameCount;   // (covered this frame: its shadows are not drawn either - below)
        };
        look($gamePlayer, hits);
        if ((this._t++ & 1) === 0 || !this._evHits) {   // (the events every other frame)
            const eh = new Set(), ev = $gameMap._events;
            for (let i = 0; i < ev.length; i++) if (ev[i]) look(ev[i], eh);
            this._evHits = eh;
        }
        for (const k of this._evHits) hits.add(k);
        const make = (k, pc) => {
            if (pc === undefined) { pc = bakeBand(g, k % 4096, Math.floor(k / 4096)); if (pc === undefined) return false; this._pieces.set(k, pc); if (pc) this._box.addChild(pc); return true; }
            if (bakeBand(g, k % 4096, Math.floor(k / 4096), pc) === undefined) return false;
            this._old.delete(k); return true;
        };
        for (const k of hits) { const pc = this._pieces.get(k); if (pc === undefined) make(k); }
        // (one more piece a frame at most: a stale one in sight, else a new one the hero is about to go behind - a tile round his own - made ahead, so going in costs no frame either)
        let more = true;
        for (const k of hits) if (this._old.has(k)) { make(k, this._pieces.get(k)); more = false; break; }
        const P = $gamePlayer;
        if (more && !P._wzUp) {
            const fx = Math.round(P._realX * TW), fy = Math.round(P._realY * TW);
            const tx0 = Math.floor((fx - 12) / TW) - 1, tx1 = Math.floor((fx + TW + 12) / TW) + 1, ty0 = Math.floor((fy - 30) / TW) - 1, ty1 = Math.floor((fy + TW + 8) / TW) + 1;
            for (let y = ty0; y <= ty1 && more; y++) for (let x = tx0; x <= tx1; x++) {
                if (!capable(g, x, y)) continue;
                const k = y * 4096 + x, pc = this._pieces.get(k);
                if (pc === undefined && make(k)) { more = false; break; }
            }
        }
        for (const [k, pc] of this._pieces) if (pc) { const on = hits.has(k); if (pc.visible !== on) pc.visible = on; }
        this.updateHeads();
    };
    // A covered character always shows the same top of its picture (HEAD_H px from the hair down), whatever the line does there - on a slanted arc the hill would hide more than on
    // the straight edge. The head is a second sprite of the top rows of the character's own frame, over the layer (z 4.2); the rest stays under the hill.
    const HEAD_H = 20;
    const RENEW_H = 0.05;   // (game hours between renewals of the copies of the world, ~3 s)
    const topRows = new Map();
    function hairRow(bm, fx, fy, fw, fh) {   // the first row of the frame that holds a picture (cached per frame)
        const key = bm.url + "|" + fx + "," + fy + "," + fw + "," + fh;
        let r = topRows.get(key);
        if (r === undefined) {
            r = 0;
            try {
                const d = bm.context.getImageData(fx, fy, fw, fh).data;
                outer: for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) if (d[(j * fw + i) * 4 + 3] > 40) { r = j; break outer; }
            } catch (e) { r = 0; }
            topRows.set(key, r);
        }
        return r;
    }
    Sprite_WzgorzaLip.prototype.updateHeads = function() {
        const sset = SceneManager._scene && SceneManager._scene._spriteset;
        if (!sset || !sset._characterSprites) return;
        const f = Graphics.frameCount, heads = this._heads || (this._heads = new Map());
        const tm = this.parent;
        for (const cs of sset._characterSprites) {
            const ch = cs._character;
            const on = !!(ch && ch._wzCoverAt !== undefined && f - ch._wzCoverAt <= 1 && cs.visible && cs.bitmap && cs.bitmap.isReady() && cs._frame && cs._frame.width > 0);
            let h = heads.get(cs);
            if (!on) { if (h && h.visible) h.visible = false; continue; }
            if (!h) { h = new Sprite(); h.anchor.set(0.5, 1); h.z = 4.2; h.update = function() {}; heads.set(cs, h); tm.addChild(h); }
            const fr = cs._frame, top = hairRow(cs.bitmap, fr.x, fr.y, fr.width, fr.height), rows = Math.max(1, Math.min(HEAD_H, fr.height - top));
            h.bitmap = cs.bitmap;
            h.setFrame(fr.x, fr.y + top, fr.width, rows);
            h.scale.set(cs.scale.x, cs.scale.y);
            h.x = cs.x; h.y = cs.y - (fr.height - top - rows) * cs.scale.y;
            h.opacity = cs.opacity; h.tint = cs.tint; h.visible = true;
        }
    };

    // The feet of a LOWER-ground character may go behind the back edge / the upper part of a side as far as the edge MASK allows (the drawn,
    // rounded shape - not the cells), and no deeper; from there they may not step into the plateau's cells (the stairs are the way up), and
    // the feet of anyone on the plateau stay out of the rim cells as before (their depth is far over the limit). FreeMovement.js asks
    // Game_Player.freeBlocker for the first tile the feet would newly touch; here the shut rim tiles of a band are judged by the feet's
    // points inside them, the rest as the original does.
    let hooked = false;
    function hookBlocker() {   // (FreeMovement.js stands below this plugin on the list: its Game_Player functions exist only after all are loaded - hooked at the first map)
        if (hooked || !Game_Player.prototype.freeBlocker || !Game_Player.prototype.freeTileBlocked) return;
        hooked = true;
        const _freeBlocker = Game_Player.prototype.freeBlocker;
        Game_Player.prototype.freeBlocker = function(fx, fy, fromX, fromY) {
            const g = geo;
            if (!g || !g.corners.length || !walkHere()) return _freeBlocker.call(this, fx, fy, fromX, fromY);
            const from = feetBox(fromX, fromY), to = feetBox(fx, fy);
            const fromState = standing(g, fromX, fromY);
            // the LEVEL of the hero (the lower ground is the default; the plateau is reached by the stairs): all his feet points inside the plateau beyond
            // what a strip lets in = up there; all of them outside = down. Up there the drawn line is a wall from the inside: his feet stay inside it.
            let up = !!this._wzUp;
            {
                let allIn = true, allOut = true;
                for (const [x, y] of feetPts(fromX, fromY)) { if (edgeState(g, x, y).inn) allOut = false; else allIn = false; }
                if (allOut) up = false; else if (allIn && fromState === 2) up = true;
                this._wzUp = up;
            }
            if (up) {
                for (const [x, y] of feetPts(fx, fy)) if (!edgeState(g, x, y).inn) return { x: $gameMap.roundX(Math.floor(x / TW)), y: $gameMap.roundY(Math.floor(y / TW)) };
            }
            let dTo = -1, dFrom = -1;
            for (let y = to.y0; y <= to.y1; y++) for (let x = to.x0; x <= to.x1; x++) {
                const tx = $gameMap.roundX(x), ty = $gameMap.roundY(y), key = ty * g.W + tx, inFrom = x >= from.x0 && x <= from.x1 && y >= from.y0 && y <= from.y1;
                const edge = x > from.x1 ? 4 : x < from.x0 ? 6 : y > from.y1 ? 8 : 2;
                if (tx >= 0 && ty >= 0 && tx < g.W && ty < g.H && g.hin[key] && !up) {
                    const cap = capable(g, tx, ty), n = g.n0[key], shell = n >= 0 && (RIM[n] === 1 || FACE[n] === 1);
                    if (cap || (g.rm[key] && shell)) {   // a tile of a band, or a rim / face tile of a hill with the player's regions: judged by the feet's points in it, whatever the tile's own edges say (a one-way rim lets nobody through the mask's limit)
                        if (!tileBlocks(g, tx, ty, fx, fy) && !(cap && bodyBad(g, fx, fy))) continue;   // (its points here are outside the drawn plateau or in a strip's depth, and the body can be covered)
                        if (inFrom) { if (dTo < 0) { dTo = maxDepth(g, fx, fy); dFrom = maxDepth(g, fromX, fromY); } if (dTo <= dFrom + 0.01 && dFrom < 1e8) continue; }   // (coming back out)
                        return { x: tx, y: ty };
                    }
                    if (this.freeTileBlocked(x, y, edge)) {   // a shut tile of a hill (the rim, the face) with no band in it: as before
                        if (inFrom) continue;
                        return { x: tx, y: ty };
                    }
                    if (inFrom) continue;
                    if (fromState === 1 && tileBlocks(g, tx, ty, fx, fy)) return { x: tx, y: ty };   // (out of a strip into the plateau's open cells: not that way)
                    continue;
                }
                if (inFrom) continue;
                if (this.freeTileBlocked(x, y, edge)) return { x: tx, y: ty };
            }
            // The last word (2026-11-01, the player's bug "the rounded corners let one walk onto the hill"): whatever the tile rules above let through, a hero
            // of the lower ground never steps into the plateau beyond a strip (standing 2) - only out of it, when he got there somehow (shallower than before).
            // (the stairs are the one way up: a point of the feet deeper than the strip may lie only in a column that has a stair tile within the next 4 rows below)
            const stairCol = (x, y) => { const cx = Math.floor(x / TW), cy = Math.floor(y / TW); if (cx < 0 || cx >= g.W) return false; for (let k = -1; k <= 4; k++) { const yy = cy + k; if (yy < 0 || yy >= g.H) continue; const n = g.n0[yy * g.W + cx]; if (n >= 0 && STAIR[n] === 1) return true; } return false; };
            const deepOffStairs = (px, py) => feetPts(px, py).some(([x, y], k) => { const st = edgeState(g, x, y); return st.inn && !fits(st, k === 7) && !stairCol(x, y); });
            // (rule 4 of the player: never below a back edge UNcovered - a spot where the body cannot be covered (the body on the plateau deeper than the band, or where no band is) does not let in either, only out of it)
            if (!up && standing(g, fx, fy) === 1 && bodyBad(g, fx, fy) && !(bodyBad(g, fromX, fromY) && maxDepth(g, fx, fy) < maxDepth(g, fromX, fromY) - 0.01)) return { x: $gameMap.roundX(Math.floor((fx + TW / 2) / TW)), y: $gameMap.roundY(Math.floor((fy + TW - 1) / TW)) };
            if (!up && standing(g, fx, fy) === 2 && deepOffStairs(fx, fy) && !(fromState === 2 && maxDepth(g, fx, fy) < maxDepth(g, fromX, fromY) - 0.01)) return { x: $gameMap.roundX(Math.floor((fx + TW / 2) / TW)), y: $gameMap.roundY(Math.floor((fy + TW - 1) / TW)) };
            return null;
        };
    }

    // Walking along a rounded back corner at some depth: where the allowed depth shrinks (the edge turns away) the feet would stop - they slide out
    // along the drawn line instead (a pixel or three towards the lower ground each step), so the walk goes on to the end of the back edge.
    let slideHooked = false;
    function hookSlide() {
        if (slideHooked || !Game_Player.prototype.freeAxis) return;
        slideHooked = true;
        const _freeAxis = Game_Player.prototype.freeAxis;
        Game_Player.prototype.freeAxis = function(s, sx, sy, pure) {
            const g = geo;
            const inStrip = !!(sx && !sy && g && walkHere() && standing(g, s.fx, s.fy) === 1);
            const upHeld = Input.isPressed("up");
            const ux = Math.sign(sx);
            const ok = (dx, dy, st) => { if (this.freeBlocker(s.fx + dx, s.fy + dy, s.fx, s.fy)) return false; const q = standing(g, s.fx + dx, s.fy + dy); return st === undefined ? q !== 2 : q === st; };
            const go = (dx, dy) => { s.fx += dx; s.fy += dy; s.moved = true; s.bump = null; };
            // (the player 2026-11-01: only "right" / "left" must lead through the whole corridor, arcs included. In the strip a walk that would leave it - the line goes down, the hero would
            // walk off above it - follows the line instead (a little down); with "up" held he may leave backwards. A hero in the strip is also drawn to the strip's full depth, so the head
            // shows as tall everywhere: on the straight edge, on a slanted arc, on the lower edge)
            if (inStrip && !upHeld) {
                const n = Math.abs(sx);
                if (standing(g, s.fx + ux * n, s.fy) === 0) for (const dy of [1, 2, 3, 4, 5, 6]) if (ok(ux * n, dy, 1)) { go(ux * n, dy); return; }
            }
            const fx0 = s.fx;
            _freeAxis.call(this, s, sx, sy, inStrip ? false : pure);   // (no lane assist in the strip: it would pull the hero a pixel off the line the corridor follows)
            if (!s.moved && sx && !sy && g && walkHere() && standing(g, s.fx, s.fy) !== 2) {
                const here = standing(g, s.fx, s.fy);
                // (already in the strip: the corridor follows the arcs - up or down, a little sideways or straight, as the arc runs, and the hero stays covered all the way)
                if (here === 1) {
                    // along the line: the tangent of the nearest edge under the feet's lower middle, the way the hero pushes
                    const e = edgeState(g, ...feetPts(s.fx, s.fy)[7]);
                    if (e.inn && e.nx !== undefined) {
                        let tx = -e.ny, ty = e.nx; if (tx * ux < 0) { tx = -tx; ty = -ty; }
                        for (const k of [3, 2, 1]) { const cx2 = Math.round(tx * k), cy2 = Math.round(ty * k); if ((cx2 || cy2) && ok(cx2, cy2, 1)) { go(cx2, cy2); break; } }
                    }
                    if (!s.moved) for (const dy of [1, 2, 3, -1, -2, -3]) if (ok(ux, dy, 1)) { go(ux, dy); break; }
                    if (!s.moved) for (const dy of [1, 2, 3, -1, -2, -3]) if (ok(0, dy, 1)) { go(0, dy); break; }
                }
                // (from outside, or at the end of the strip: a little up and on - out along the line; a wall is not a ladder, so never straight up from outside it)
                if (!s.moved) for (const dy of [-1, -2, -3]) if (ok(ux, dy)) { go(ux, dy); break; }
                if (!s.moved && here === 1) for (const dy of [-1, -2, -3]) if (ok(0, dy)) { go(0, dy); break; }
            }
            // (drawn to the full depth: where the edge faces north-ish, a step inward - against the outward normal, 2 px or 1 - while the middle of the feet's lower edge is shallower than the strip's depth there)
            if (s.moved && s.fx !== fx0 && inStrip && !upHeld && sx && !sy && standing(g, s.fx, s.fy) === 1) {
                const e = edgeState(g, ...feetPts(s.fx, s.fy)[7]);
                if (e.inn && e.nx !== undefined && e.ny < -0.3 && e.d < e.lim - 1.5) {
                    for (const k of [2, 1]) { const cx2 = Math.round(-e.nx * k), cy2 = Math.round(-e.ny * k); if ((cx2 || cy2) && ok(cx2, cy2, 1)) { go(cx2, cy2); break; } }
                }
            }
        };
    }

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        hookBlocker();
        hookSlide();
        this._wzgorza = new Sprite_Wzgorza();
        this._tilemap.addChild(this._wzgorza);
        this._wzgorzaLip = new Sprite_WzgorzaLip();
        this._tilemap.addChild(this._wzgorzaLip);
    };
    // A covered character's shadows (its own and the sun's) must not lie on the hill's top: hidden after the sprites updated, in the frame it is covered (2026-11-01)
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        const f = Graphics.frameCount;
        if (!this._wzgorzaLip || !this._wzgorzaLip.visible) return;
        for (const cs of this._characterSprites || []) {
            const ch = cs._character;
            if (ch && ch._wzCoverAt !== undefined && f - ch._wzCoverAt <= 1) for (const sh of [cs._sunShadow, cs._groundShadow]) if (sh) sh.visible = false;
        }
    };
    const _Scene_Map_isReady = Scene_Map.prototype.isReady;
    Scene_Map.prototype.isReady = function() {
        if (!_Scene_Map_isReady.call(this)) return false;
        const s = this._spriteset && this._spriteset._wzgorza;
        if (!s || !active()) return true;
        this._wzWait = (this._wzWait || 0) + 1;
        return s.prepare() || this._wzWait > 90;
    };
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        if (geo) { K.dropAtlas(geo); geo = null; }
    };

    // ------------------------------------------------------------------
    // The audit (tests; window.WZGORZA_AUDIT = true before the map keeps the corner pictures): no stone of the old rim left where the new line is
    // not, and the new line joins the old straight rim without a step - the profile of the rim (where it starts, how thick, how bright) on the
    // arc's side of each tangent against the straight side.
    // ------------------------------------------------------------------
    // (the rim's own art is ragged: along an unchanged straight stretch two windows of 16 columns differ by up to ~5 stone pixels per column, so a join
    // is faulty when its start of the rim is off by more than 1 px, or its thickness by more than that natural spread, or its brightness by 12)
    const JOIN_THICK = 8, JOIN_BRIGHT = 12;
    const stoneAt = (col, earth) => K.rimStone([col[0], col[1], col[2], 255], 0, earth);
    function audit(g) {
        const out = { corners: g.corners.length, strays: [], joins: [], joinCount: 0 };
        const data = $dataMap.data;
        for (const c of g.corners) {
            if (!(c.style === 1 || c.sh === 1 || c.sv === 1)) continue;
            let n = 0, first = null;
            for (let wy = c.ey0; wy < c.ey1; wy++) for (let wx = c.ex0; wx < c.ex1; wx++) {
                const cx = Math.floor(wx / TW), cy = Math.floor(wy / TW);
                if (cx < 0 || cy < 0 || cx >= g.W || cy >= g.H || !g.hin[cy * g.W + cx]) continue;
                const id = data[cy * g.W + cx], nn = id - 1536;
                if (!(id >= 1536 && id < 2048 && (RIM[nn] || (nn >= 76 && nn <= 79) || nn === 84 || nn === 85 || nn === 86 || nn === 87))) continue;
                const pd = g.patch.get(Math.floor(wy / TW) * 4096 + Math.floor(wx / TW)), q = (mod(wy, TW) * TW + mod(wx, TW)) * 4;
                if (pd && pd[q + 3]) continue;   // (painted by us: part of the new picture)
                const a = art(id);
                if (!a || !K.rimStone(a, q, EARTH[nn] === 1)) continue;   // (an old stone pixel, left as it was)
                const st = edgeState(g, wx + 0.5, wy + 0.5), od = oldDepthCells(g, wx + 0.5, wy + 0.5);   // (only where the edge moved: stones the edge did not touch stay)
                if (!st.inn || (st.d - od > 1.5 && od < OLDBAND + 2)) { n++; if (!first) first = [wx, wy, nn, st.inn ? Math.round(st.d) : -1, Math.round(od)]; }
            }
            if (n) out.strays.push({ vx: c.vx, vy: c.vy, kind: c.kind, n, first });
        }
        // thin dark lines on the stone of a face: the old outline (2-3 px along an old edge of a face tile) that lies inside the silhouette now
        out.faceLines = [];
        for (const c of g.corners) {
            if (!(c.kind === 1 && (c.sh === 2 || c.sv === 2))) continue;
            let n = 0, first = null;
            for (let wy = c.ey0; wy < c.ey1; wy++) for (let wx = c.ex0; wx < c.ex1; wx++) {
                const cx = Math.floor(wx / TW), cy = Math.floor(wy / TW);
                if (cx < 0 || cy < 0 || cx >= g.W || cy >= g.H || !g.hin[cy * g.W + cx]) continue;
                const nn = data[cy * g.W + cx] - 1536;
                if (!(nn >= 0 && FACE[nn])) continue;
                const od = oldDepthCells(g, wx + 0.5, wy + 0.5);
                if (od >= 3.5) continue;
                const st = edgeState(g, wx + 0.5, wy + 0.5);
                if (!st.inn || st.d - od <= 2) continue;
                const col = compositeAt(g, wx, wy);
                if (col && col[0] + col[1] + col[2] < 190) { n++; if (!first) first = [wx, wy]; }
            }
            if (n) out.faceLines.push({ vx: c.vx, vy: c.vy, n, first });
        }
        // the rectangular leftovers: a SOLID block of rim stones below the rim's own solid band (deeper than 7 px from the edge), within 2 cells of a
        // corner - the stones of a rim tile come ragged, a block that fills its box is a piece of a tile left (or laid) where it does not belong
        out.blocks = [];
        const seen = new Set();
        for (const c of g.corners) {
            if (!(c.style === 1 || c.sh === 1 || c.sv === 1)) continue;
            const X0 = c.vx * TW - 2 * TW, Y0 = c.vy * TW - 2 * TW, SZ = 4 * TW, mark = new Uint8Array(SZ * SZ);
            for (let j = 0; j < SZ; j++) for (let i = 0; i < SZ; i++) {
                const wx = X0 + i, wy = Y0 + j, cx = Math.floor(wx / TW), cy = Math.floor(wy / TW);
                if (cx < 0 || cy < 0 || cx >= g.W || cy >= g.H || !g.hin[cy * g.W + cx]) continue;
                const nn = data[cy * g.W + cx] - 1536;
                if (!(nn >= 0 && (RIM[nn] || (nn >= 76 && nn <= 79) || nn === 84 || nn === 85 || nn === 86 || nn === 87))) continue;
                const st = edgeState(g, wx + 0.5, wy + 0.5);
                if (!st.inn || st.d < 7 || st.kind === 0) continue;
                const col = compositeAt(g, wx, wy);
                if (col && stoneAt(col, EARTH[nn] === 1)) mark[j * SZ + i] = 1;
            }
            for (let j = 0; j < SZ; j++) for (let i = 0; i < SZ; i++) {
                if (!mark[j * SZ + i]) continue;
                const stack = [[i, j]]; mark[j * SZ + i] = 2;
                let n = 0, x0 = i, x1 = i, y0 = j, y1 = j;
                while (stack.length) {
                    const [a2, b2] = stack.pop(); n++; x0 = Math.min(x0, a2); x1 = Math.max(x1, a2); y0 = Math.min(y0, b2); y1 = Math.max(y1, b2);
                    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = a2 + dx, y = b2 + dy; if (x >= 0 && y >= 0 && x < SZ && y < SZ && mark[y * SZ + x] === 1) { mark[y * SZ + x] = 2; stack.push([x, y]); } }
                }
                const w = x1 - x0 + 1, h = y1 - y0 + 1, key = (X0 + x0) + "," + (Y0 + y0);
                if (n >= 24 && w >= 6 && h >= 4 && n / (w * h) > 0.8 && !seen.has(key)) { seen.add(key); out.blocks.push({ x: X0 + x0, y: Y0 + y0, w, h, n }); }
            }
        }
        // the joins: for each arm of a rim corner the profile at the straight side [rho + 3, rho + 9) against the arc side [rho - 9, rho - 3)
        const profile = (c, arm, uFrom, uTo, arcSide) => {   // the share of stone at each depth over the window's columns -> where the solid rim starts / ends, brightness
            const rho = c.rho, gx = c.sx, gy = c.sy, vx = c.vx * TW, vy = c.vy * TW, convex = c.kind === 0, D = RIMW + 3, share = new Array(D).fill(0);
            let bright = 0, nb = 0, cols = 0;
            for (let u = uFrom; u < uTo; u++) {
                const off = arcSide ? rho - Math.sqrt(Math.max(0, rho * rho - (rho - (u + 0.5)) * (rho - (u + 0.5)))) : 0;   // (the arc's distance from the arm line)
                cols++;
                for (let dd = 0; dd < D; dd++) {
                    let wx, wy;
                    if (arm === 0) { wx = Math.floor(vx + gx * (u + 0.5)); const sgn = convex ? gy : -gy; wy = Math.floor(vy + gy * off + sgn * (dd + 0.5)); }
                    else { wy = Math.floor(vy + gy * (u + 0.5)); const sgn = convex ? gx : -gx; wx = Math.floor(vx + gx * off + sgn * (dd + 0.5)); }
                    const col = compositeAt(g, wx, wy);
                    if (!col || !stoneAt(col, false)) continue;
                    share[dd]++; bright += col[0] + col[1] + col[2]; nb++;
                }
            }
            let first = D, last = -1;
            for (let dd = 0; dd < D; dd++) if (share[dd] / cols >= 0.5) { if (first === D) first = dd; last = dd; }
            return { first: last < 0 ? D : first, thick: nb / cols, bright: nb ? bright / nb / 3 : 0 };   // (thick: stone pixels per column of the window)
        };
        for (const c of g.corners) {
            if (!(c.kind === 0 ? c.style === 1 : (c.sh === 1 && c.sv === 1))) continue;
            for (const arm of [0, 1]) {
                const cells = arm === 0 ? c.armH : c.armV;   // (the arm's length in cells: no straight stretch to compare with when it is the arc's whole length)
                if (cells < 2 || c.rho + 12 > cells * TW) continue;   // (an arm of one cell ends in the next corner's own tile: no straight rim to compare with)
                const W = Math.min(16, c.rho - 3, cells * TW - c.rho - 3), A = profile(c, arm, c.rho + 3, c.rho + 3 + W, false), B = profile(c, arm, c.rho - 3 - W, c.rho - 3, true);
                if (A.first >= RIMW + 3 || B.first >= RIMW + 3) continue;   // (not a rim there: a face, ground)
                out.joinCount++;
                const dFirst = Math.abs(A.first - B.first), dThick = Math.abs(A.thick - B.thick), dBright = Math.abs(A.bright - B.bright);
                if (dFirst > 1 || dThick > JOIN_THICK || dBright > JOIN_BRIGHT) out.joins.push({ vx: c.vx, vy: c.vy, kind: c.kind, arm, dFirst: +dFirst.toFixed(2), dThick: +dThick.toFixed(2), dBright: +dBright.toFixed(1), A: [A.first, A.thick, A.bright].map(v => +v.toFixed(1)), B: [B.first, B.thick, B.bright].map(v => +v.toFixed(1)), rho: c.rho });
            }
        }
        return out;
    }

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        on, lipOn, here, active, walkHere, buildGeo, MAPS, WALK_MAPS, KEY, KEY_LIP, DEPTH_N, DEPTH_S, COVER,
        edgeState: (px, py) => edgeState(geometry(), px, py), standing: (fx, fy) => standing(geometry(), fx, fy), feetPts,
        compositeAt: (x, y) => compositeAt(geometry(), x, y), cornerState, audit: () => audit(geometry()),
        maxDepth: (fx, fy) => maxDepth(geometry(), fx, fy), bodyBad: (fx, fy) => bodyBad(geometry(), fx, fy),
        bandTiles() {   // the tiles that hold pixels of a band (tests)
            const g = geometry(), out = [];
            for (let ty = 0; ty < g.H; ty++) for (let tx = 0; tx < g.W; tx++) if (g.hin[ty * g.W + tx] && capable(g, tx, ty)) out.push([tx, ty]);
            return out;
        },
        bandsOn() { const sp = window.SceneManager && SceneManager._scene && SceneManager._scene._spriteset; const l = sp && sp._wzgorzaLip; if (!l) return 0; let n = 0; for (const pc of l._pieces.values()) if (pc && pc.visible) n++; return n; },
        set(v) { ConfigManager[KEY] = !!v; return on(); },
        setLip(v) { ConfigManager[KEY_LIP] = !!v; return lipOn(); },
        stats() {
            const g = geo, atl = g && g.atlas ? Object.values(g.atlas).reduce((s, l) => s + l.length, 0) : 0, sp = window.SceneManager && SceneManager._scene && SceneManager._scene._spriteset;
            return { corners: g ? g.corners.length : 0, clusters: g ? g.clusters.length : 0, todo: g ? g.todo : 0, baked: stat.baked, atlases: atl, mb: Math.round(atl * 480 * 480 * 4 / 1048576 * 100) / 100,
                bakeMs: Math.round(stat.bakeMs * 10) / 10, prepMs: Math.round(stat.prepMs * 10) / 10, buildMs: g ? Math.round(g.buildMs * 10) / 10 : 0, frames: stat.frames,
                pieces: sp && sp._wzgorza ? sp._wzgorza._box.children.length : 0 };
        },
        geo: () => (has() && here() ? geometry() : null),
        redo() { if (geo) { K.dropAtlas(geo); geo = null; } return true; }
    };
    T.register(PLUGIN, api);
    window.Wzgorza = api;
})();
