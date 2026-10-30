//=============================================================================
// CzerwonaWoda.js
//=============================================================================
// The red tide of the island's sea (the user, 2026-10-15: water only from wells and the river, never from the sea - and that has to
// be SEEN and FELT; "can't the sea be boiled?" - no). In the drought the sea by the island blooms: by the shore the water is rust-red,
// it stinks, the waves throw up dead fish; the fishermen know it is not drunk even boiled (the bloom's poison does not go with
// boiling). The old people say it is "the blood of Kruczych Skał" - the Heart bleeding into the sea (a legend only, no mechanics).
// Sea water is ALWAYS salt; the red is poison and looks on top. For every map with <Water:salt> in its note (the harbour, Map125, and
// any coast to come):
//   - WHEN: grey after rain (GREY_RAINS rain days among the last 3 - Survival.weatherPlan), red in the drought (most of the game);
//     the red's strength by the days without rain (TownQuests.dryDays)
//   - LOOKS (no tiles changed): a tint over the sea's cells, strongest by the shore and fading out to the open water (a smooth bitmap
//     of the water mask under the characters), rusty foam along the shore line, dead fish on the shore and the piers' edges (red only,
//     new ones every day); grey water: a dull grey tint and pale foam
//   - FELT: the sea's menu (Farming_Plots asks seaMenu): the popup over the hero ("Woda jest czerwona i cuchnie." / "Słona - nie do
//     picia."), the rod, "Napij się mimo to" (red: vomiting - water and fullness lost, the state "Zatrucie" for POISON_HOURS: work
//     costs more, the strength capped, shorter breath in a fight; grey: salt - the thirst worse), "Nabierz wody" (refused), "Przegotuj"
//     (with a bucket or a cauldron: still red, even the steam stinks); fishing by the shore in the red catches less and now and then a
//     dead fish (fishAt: the open water and the far ends of the piers are healthy); birds keep off the stinking shore (Birds asks
//     nearShore); a dead fish looked at pops its line
// Rain water, wells and the river work as before. Nothing here ever gives the hero water.

/*:
 * @target MZ
 * @plugindesc Czerwona woda: w suszę morze przy wyspie zakwita (rdzawy odcień, piana, śnięte ryby), nie da się go pić ani przegotować; po deszczu szare i słone. Mapy z <Water:salt>. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Farming_Plots
 * @orderAfter Survival
 * @orderAfter Needs
 *
 * @help
 * ============================================================================
 * CzerwonaWoda.js - czerwona woda przy brzegu
 * ============================================================================
 * Działa na każdej mapie, która ma w notatce <Water:salt> (przystań, Map125).
 * W suszę woda przy brzegu jest rdzawoczerwona, cuchnie, fale wyrzucają
 * śnięte ryby. Po kilku dniach deszczu woda blednie (szara), ale dalej jest
 * słona i nie do picia. Morza nigdy nie da się pić ani odsolić.
 *
 * Przy morzu: popup nad bohaterem, wędka, „Napij się mimo to” (zatrucie:
 * wymioty, stan „Zatrucie”), „Nabierz wody” (odmowa), „Przegotuj” (z
 * wiadrem albo kociołkiem - dalej czerwona). Przy samym brzegu ryby biorą
 * słabiej i czasem trafia się śnięta ryba; z końca pomostu łowi się zdrowo.
 *
 * W skryptach: CzerwonaWoda.phase() -> { grey, red }, CzerwonaWoda.isRed().
 * Menu F9 (zakładka „Wyspa i fabuła”) i testy: CzerwonaWoda.force("red" | "grey" | null)
 * - woda na dziś wymuszona czerwona albo szara (null: znowu z pogody; nie zapisuje się).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("czerwona_woda");   // (the words of this file: js/teksty/czerwona_woda.txt, kod.*)

    const T = window.Tawerna;
    if (!T) throw new Error("CzerwonaWoda.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "CzerwonaWoda";
    const GREY_RAINS = 2;              // rain days among the last three that wash the bloom out (grey water)
    const RED_RANGE = 9, GREY_RANGE = 7;   // cells from the shore the tint reaches
    // (2026-10-15, the user: the grey water after rain must be clearly bad - murky, grey-brown - not the plain sea; weaker than the red)
    const RED_RGB = [138, 44, 28], GREY_RGB = [126, 113, 86];
    const RED_A = 0.72, GREY_A = 0.6;
    const SHALLOW = 2;                 // fishing within this many cells of the shore is "by the shore"
    const FISH_DENSITY = 0.09, FISH_MAX = 16;
    const POISON_HOURS = 8, POISON_COST = 1.3, POISON_CAP = 0.7;
    const POISON_ICON = 2;             // (the RTP's poison bubbles)
    const THIRST_ICON = 391, BUCKET = 138, CAULDRON = 141, ROD = 100;
    const S = 8;                       // tint bitmap texels per cell (bilinear between the cells' middles, then smoothed)
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!(window.$gameSystem && window.$gameMap && window.$dataMap);
    const SV = () => T.api("Survival") || window.Survival || null;
    const N = () => T.api("Needs") || null;
    const F = () => window.Farming || null;
    const core = () => { const P = T.api("Farming_parts"); return (P && P.core) || null; };   // (swingThen, CROUCH_KIND)
    const pop = (text, icon, color) => T.popup(text, { icon: icon || 0, color: color || "#ff9f8f" });

    // ------------------------------------------------------------------
    // WHEN: the drought (the weather plan of the days)
    // ------------------------------------------------------------------
    const seaHere = () => !!(window.$dataMap && /<Water:\s*salt\s*>/i.test($dataMap.note || ""));
    function planOf(d) { const sv = SV(); return sv && typeof sv.weatherPlan === "function" ? sv.weatherPlan(d) : null; }
    function rainedOn(d) {
        if (d < 1) return false;
        const p = planOf(d);
        if (!p || (p.type !== "rain" && p.type !== "snow")) return false;
        return d < day() || hour() >= p.start;
    }
    function dryDays() {
        const q = T.api("TownQuests");
        if (q && typeof q.dryDays === "function") return q.dryDays();
        let n = 0;
        for (let k = day(); k >= 1 && n < 99 && !rainedOn(k); k--) n++;
        return n;
    }
    let phaseCache = { key: "", v: null };
    // (2026-10-16) F9 / the tests: today's water forced red or grey (null: from the weather again); runtime only, not saved
    let forced = null;
    function force(kind) {
        forced = kind === "red" || kind === "grey" ? kind : null;
        phaseCache = { key: "", v: null };
        return forced;
    }
    function phase(d) {
        if (d === undefined && forced) return forced === "grey" ? { grey: true, red: 0, rains: GREY_RAINS, forced } : { grey: false, red: 1, rains: 0, dry: 3, forced };
        const dd = d === undefined ? day() : d, key = dd + ":" + (d === undefined ? Math.floor(hour()) : "x");
        if (d === undefined && phaseCache.key === key) return phaseCache.v;
        let rains = 0;   // (an explicit day: as at its end - its whole rain counts)
        for (let k = dd - 2; k <= dd; k++) { const p = k >= 1 ? planOf(k) : null; if (d === undefined ? rainedOn(k) : !!p && (p.type === "rain" || p.type === "snow")) rains++; }
        let v;
        if (rains >= GREY_RAINS) v = { grey: true, red: 0, rains };
        else { const dry = d === undefined ? dryDays() : 3; v = { grey: false, red: dry >= 2 ? 1 : dry === 1 ? 0.8 : 0.6, rains, dry }; }
        if (d === undefined) phaseCache = { key, v };
        return v;
    }
    const isRed = () => has() && seaHere() && !phase().grey;

    // ------------------------------------------------------------------
    // The map: its water (A1 water not under planks: Farming.isWaterTile), each sea cell's distance from the shore, the shore's land
    // cells (where the waves leave dead fish) - worked out once per map
    // ------------------------------------------------------------------
    let geo = null;
    function geometry() {
        if (geo && geo.map === $dataMap) return geo;
        const W = $gameMap.width(), H = $gameMap.height(), water = new Uint8Array(W * H), sea = new Uint8Array(W * H);
        const isW = (x, y) => !!(F() && F().isWaterTile && F().isWaterTile(x, y));
        // water: the open water (not under the piers' planks); sea: all the sea, the piers' water too - the shore is the real land
        const isSea = (x, y) => { for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; } return false; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { water[y * W + x] = isW(x, y) ? 1 : 0; sea[y * W + x] = water[y * W + x] || isSea(x, y) ? 1 : 0; }
        // multi-source BFS (8 neighbours): from the land into the water (dist 1 = beside the shore) and from the water onto the land
        const bfs = from => {
            const dist = new Int16Array(W * H).fill(-1), q = [];
            for (let i = 0; i < W * H; i++) if (from(i)) { dist[i] = 0; q.push(i); }
            for (let h = 0; h < q.length; h++) {
                const i = q[h], x = i % W, y = (i / W) | 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    const j = ny * W + nx;
                    if (dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
                }
            }
            return dist;
        };
        const toLand = bfs(i => !sea[i]), toWater = bfs(i => !!water[i]);   // (toLand: from the real shore - a pier is no shore)
        const eventAt = new Set(($dataMap.events || []).filter(Boolean).map(e => e.x + "," + e.y));
        const shore = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (water[i] || toWater[i] !== 1 || eventAt.has(x + "," + y) || !$gameMap.isPassable(x, y, 2)) continue;
            shore.push([x, y]);
        }
        const type = new Uint8Array(W * H);   // (1 open water, 0 land, 2 the rest of the sea: a pier)
        for (let i = 0; i < W * H; i++) type[i] = water[i] ? 1 : sea[i] ? 2 : 0;
        geo = { map: $dataMap, W, H, water, sea, toLand, toWater, shore, type, tw: $gameMap.tileWidth(), th: $gameMap.tileHeight(), sd: null, tex: null, paint: null, foam: {}, chunks: null };
        if (brzegMap()) buildField(geo);
        return geo;
    }
    const inside = (x, y) => has() && x >= 0 && y >= 0 && x < $gameMap.width() && y < $gameMap.height();
    function distToLand(x, y) { if (!inside(x, y) || !seaHere()) return -1; const g = geometry(); return g.water[y * g.W + x] ? g.toLand[y * g.W + x] : 0; }
    // a land cell this close to the red sea stinks (the birds keep off)
    function nearShore(x, y, r) {
        if (!inside(x, y) || !isRed()) return false;
        const g = geometry(), d = g.toWater[y * g.W + x];
        return d >= 0 && d <= (r || 2);
    }

    // ------------------------------------------------------------------
    // The shore redrawn (2026-10-29, a PREVIEW on the maps of BRZEG_MAPS only; the player: "the tiles of the shore line are angular",
    // "a dozen cells from the shore the ground should have no grass, earth or stone"). The tiles and the passability are not touched:
    // the plugin draws its own shore once per map, under the characters, from the map's own tileset textures:
    //   - the shore line: the water mask of the cells blurred (rounded corners) and bent with a smooth noise (bays and capes of
    //     different sizes, no long straight runs), kept as a signed-distance grid (SD_Q px a texel; < 0 water, > 0 land)
    //   - the land by its depth from that line: a stone border (the profile of the map's own terrace-edge tile), cobbles, packed earth
    //     with pebbles and dry tufts, dry grass, and then the plain grass (untouched). Cells with anything on the layers 1-3 (paths,
    //     hills, decorations) or other ground than plain grass keep their own tiles
    //   - where the new line cuts into the old land the sea is drawn in (its own shading by the depth from the shore)
    // The tint and the foam follow the same line (wAt). Built in pieces over the first frames after the map is shown.
    // ------------------------------------------------------------------
    const BRZEG_MAPS = [125, 155, 157, 159, 162, 165];   // (the island's sea maps - none of them is the player's: docs/mapy/PRZEGLAD.md)
    const SHORE_GROW = 0.3;   // (the new line lies about 19 px out in the old water: nothing of the sea has to be drawn over the old land, and the square corners are covered)
    const SD_Q = 4, CH = 192, DMAX = 576, RING_W = 11, WP_W = 24;
    const brzegMap = () => has() && seaHere() && (BRZEG_MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.BRZEG_ALL);
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
    function buildField(g) {
        const tw = g.tw, th = g.th, TW = Math.ceil(g.W * tw / SD_Q), TH = Math.ceil(g.H * th / SD_Q), f = new Float32Array(TW * TH);
        for (let y = 0; y < TH; y++) {
            const cy = Math.min(g.H - 1, Math.floor((y + 0.5) * SD_Q / th));
            for (let x = 0; x < TW; x++) f[y * TW + x] = g.type[cy * g.W + Math.min(g.W - 1, Math.floor((x + 0.5) * SD_Q / tw))] === 1 ? 1 : 0;
        }
        boxBlur(f, TW, TH, 5);
        // (piers and the like - the sea cells that are not open water - keep their sharp edges: the bend fades out two to four cells from them)
        const pier = new Uint8Array(TW * TH), tt = new Uint8Array(TW * TH);
        let hasPier = false;
        for (let y = 0; y < TH; y++) {
            const cy = Math.min(g.H - 1, Math.floor((y + 0.5) * SD_Q / th));
            for (let x = 0; x < TW; x++) { const t = g.type[cy * g.W + Math.min(g.W - 1, Math.floor((x + 0.5) * SD_Q / tw))]; tt[y * TW + x] = t; if (t === 2) { pier[y * TW + x] = 1; hasPier = true; } }
        }
        const dP = hasPier ? chamfer(pier, TW, TH) : null;
        const wm = new Uint8Array(TW * TH), lm = new Uint8Array(TW * TH);
        for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
            const px = (x + 0.5) * SD_Q, py = (y + 0.5) * SD_Q, i = y * TW + x;
            // (bays and capes: three scales of noise bend the line by about 14 px at most; the noise only works near the line)
            const n = (vnoise(px, py, 150, 31) - 0.5) * 0.36 + (vnoise(px, py, 58, 37) - 0.5) * 0.28 + (vnoise(px, py, 22, 41) - 0.5) * 0.14;
            let e = Math.min(1, 4 * f[i] * (1 - f[i]));   // (the bend works only near the old line: no islands in the open sea, no change inland)
            let w;
            if (dP) { const cells = dP[i] / 3 * SD_Q / tw, k = Math.max(0, Math.min(1, (cells - 2) / 2)); if (k === 0) { wm[i] = tt[i] === 1 ? 1 : 0; lm[i] = wm[i] ? 0 : 1; continue; } e *= k; }
            w = f[i] + e * (n - SHORE_GROW) > 0.5 ? 1 : 0;
            wm[i] = w; lm[i] = w ? 0 : 1;
        }
        const dW = chamfer(wm, TW, TH), dL = chamfer(lm, TW, TH), sd = new Float32Array(TW * TH);
        for (let i = 0; i < TW * TH; i++) sd[i] = (wm[i] ? -(dL[i] / 3 - 0.5) : (dW[i] / 3 - 0.5)) * SD_Q;
        g.sd = sd; g.TW = TW; g.TH = TH;
        // the mask of the cells where the strip may be painted, blurred: the strip's edge by paths, hills and walls is a smooth curve
        const P = paintable(g), pm = new Float32Array(TW * TH);
        for (let y = 0; y < TH; y++) {
            const cy = Math.min(g.H - 1, Math.floor((y + 0.5) * SD_Q / th));
            for (let x = 0; x < TW; x++) { const c = cy * g.W + Math.min(g.W - 1, Math.floor((x + 0.5) * SD_Q / tw)), t = g.type[c]; pm[y * TW + x] = t !== 0 || P[c] ? 1 : 0; }   // (water and piers count as paintable: they are not painted, but they must not eat the strip's edge)
        }
        boxBlur(pm, TW, TH, 5);
        g.pm = pm;
    }
    function pmAt(g, px, py) {
        const u = px / SD_Q - 0.5, v = py / SD_Q - 0.5, ix = Math.floor(u), iy = Math.floor(v), fx = u - ix, fy = v - iy, TW = g.TW, TH = g.TH;
        const x0 = Math.max(0, Math.min(TW - 1, ix)), x1 = Math.max(0, Math.min(TW - 1, ix + 1)), y0 = Math.max(0, Math.min(TH - 1, iy)), y1 = Math.max(0, Math.min(TH - 1, iy + 1)), s = g.pm;
        return (s[y0 * TW + x0] * (1 - fx) + s[y0 * TW + x1] * fx) * (1 - fy) + (s[y1 * TW + x0] * (1 - fx) + s[y1 * TW + x1] * fx) * fy;
    }
    function sdAt(g, px, py) {
        const u = px / SD_Q - 0.5, v = py / SD_Q - 0.5, ix = Math.floor(u), iy = Math.floor(v), fx = u - ix, fy = v - iy, TW = g.TW, TH = g.TH;
        const x0 = Math.max(0, Math.min(TW - 1, ix)), x1 = Math.max(0, Math.min(TW - 1, ix + 1)), y0 = Math.max(0, Math.min(TH - 1, iy)), y1 = Math.max(0, Math.min(TH - 1, iy + 1));
        const s = g.sd;
        return (s[y0 * TW + x0] * (1 - fx) + s[y0 * TW + x1] * fx) * (1 - fy) + (s[y1 * TW + x0] * (1 - fx) + s[y1 * TW + x1] * fx) * fy;
    }
    function wAt(g, px, py) {   // is this pixel of the map water (the new shore line)?
        if (g.sd) return sdAt(g, px, py) < 0;
        const cx = Math.floor(px / g.tw), cy = Math.floor(py / g.th);
        return cx < 0 || cy < 0 || cx >= g.W || cy >= g.H ? true : g.type[cy * g.W + cx] === 1;
    }
    const cellType = (g, px, py) => { const cx = Math.floor(px / g.tw), cy = Math.floor(py / g.th); return cx < 0 || cy < 0 || cx >= g.W || cy >= g.H ? 1 : g.type[cy * g.W + cx]; };
    // how far (px, to 10) and in which direction the nearest land is from a water pixel (the foam's rule)
    function landNear(g, x, y) {
        if (g.sd) {
            const s = sdAt(g, x, y);
            if (s >= 0 || s < -10) return null;
            const gx = sdAt(g, x + 1, y) - sdAt(g, x - 1, y), gy = sdAt(g, x, y + 1) - sdAt(g, x, y - 1), l = Math.hypot(gx, gy) || 1;
            return { d: -s, dx: gx / l, dy: gy / l };
        }
        return null;
    }
    // ---- the textures (the map's own tileset): interior tiles of autotiles, the stone border's profile, the sea's shading
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
    const waterIdAt = (x, y) => { for (let z = 1; z >= 0; z--) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return id; } return 0; };
    // the texture set of the shore (null while a sheet is loading)
    function textures(g) {
        if (g.tex) return g.tex;
        let wid = 0;
        for (let y = 0; y < g.H && !wid; y++) for (let x = 0; x < g.W && !wid; x++) if (g.type[y * g.W + x] === 1) wid = waterIdAt(x, y);
        const wd = descOf(wid);
        if (!wd) return null;
        const grass = srcOf(descOf(2816)), dirt = srcOf(descOf(3200)), cobble = srcOf(descOf(3968)), water = srcOf(wd);
        const wp = profileOf(0, wd.bx * 48, wd.by * 48, 96, 144, WP_W, true, "wp" + wd.key);
        if (!grass || !dirt || !cobble || !water || !wp) return null;
        // (the plain sea of the sample, matched to the colour the shading profile ends in)
        let ar = 0, ag = 0, ab = 0;
        for (let i = 0; i < 48 * 48; i++) { ar += water[i * 4]; ag += water[i * 4 + 1]; ab += water[i * 4 + 2]; }
        const deep = wp[WP_W - 1], wsc = [deep[0] / (ar / 2304), deep[1] / (ag / 2304), deep[2] / (ab / 2304)];
        return (g.tex = { grass, dirt, cobble, water, wp, wsc });
    }
    // paintable cells: plain grass or the terrace's stone border on layer 0, nothing on the layers 1-3
    function paintable(g) {
        if (g.paint) return g.paint;
        const W = g.W, H = g.H, p = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (g.type[y * W + x] !== 0) continue;
            const id = $gameMap.tileId(x, y, 0);
            let kind = 0;   // 1 grass (the two grass kinds) or the terrace's stone border, 2 earth (no dry grass painted on it), 3 the dirt / grass patches of the A2 sheet (painted over with grass beyond the strip)
            const rel = id >= 2816 && id < 4352 ? Math.floor((id - 2816) / 48) : -1;
            if (rel === 0 || rel === 11 || (id >= 1624 && id <= 1642 && (id % 8) <= 2)) kind = 1;
            else if (rel === 8) kind = 2;
            else if (rel === 1 || rel === 9 || rel === 10) kind = 3;
            if (!kind) continue;
            // (layer 1: the grass-patch overlays of the A2 sheet and the ordinary B-E tiles are painted over - the ordinary ones are drawn again on top; hills, piers, walls are not)
            const l1 = $gameMap.tileId(x, y, 1);
            if (!(l1 === 0 || l1 < 2048 || (l1 >= 2816 + 48 * 4 && l1 < 2816 + 48 * 8) || (l1 >= 2816 + 48 * 31 && l1 < 2816 + 48 * 32))) continue;
            p[y * W + x] = kind;
        }
        return (g.paint = p);
    }
    // a B-E tile as 48 x 48 pixels (the decorations drawn again on the strip); null while its sheet loads
    const tileCache = {};
    function tileImage(id) {
        if (tileCache[id]) return tileCache[id];
        const bm = tileSheet(5 + Math.floor(id / 256));
        if (!bm || !bm.isReady()) return null;
        const sx = ((Math.floor(id / 128) % 2) * 8 + id % 8) * 48, sy = (Math.floor((id % 256) / 8) % 16) * 48;
        return (tileCache[id] = bm.context.getImageData(sx, sy, 48, 48).data);
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    // one pixel of the land by its depth d (px) from the shore line; null: leave the map's own tile
    function landPixel(T, x, y, d, si, mode) {
        if (d < RING_W) {   // the stone border: the cobbles of the map's own tileset, darker, with a dark outline on the water's edge
            if (d < 1.4) return [30, 48, 56];
            if (d < 2.6) return [52, 74, 82];
            const f = (d < 5 ? 0.78 : 0.88) + 0.3 * hash(Math.floor(x / 6), Math.floor(y / 5), 5, 7), C = T.cobble;
            return [C[si] * f * 0.85, C[si + 1] * f * 0.9, C[si + 2] * f * 0.9];
        }
        const n1 = vnoise(x, y, 13, 3), n2 = vnoise(x, y, 41, 5), a = Math.max(0, (d - 44) / (DMAX - 44));
        let col;
        if (d < RING_W + 30) {   // cobbles and gravel by the border (earth between them)
            const t = n1 * 0.7 + hash(x >> 2, y >> 2, 11, 13) * 0.3;
            const S = t > 0.42 ? T.cobble : T.dirt, m = t > 0.42 ? 0.9 : 0.96;
            col = [S[si] * m, S[si + 1] * m, S[si + 2] * m];
        } else {
            const gv = a * 1.35 + (n1 - 0.5) * 0.45 + (n2 - 0.5) * 0.55;
            if (gv >= 1) return mode === 3 ? [T.grass[si], T.grass[si + 1], T.grass[si + 2]] : null;
            if (mode === 2 && gv >= 0.5) return null;
            if (gv < 0.5) {   // packed earth, darker patches
                const m = 0.9 + 0.12 * n2;
                col = [T.dirt[si] * m, T.dirt[si + 1] * m, T.dirt[si + 2] * m];
                if (d < 300 && n2 > 0.6 && n1 > 0.5) { const c = T.cobble; col = [lerp(col[0], c[si], 0.5), lerp(col[1], c[si + 1], 0.5), lerp(col[2], c[si + 2], 0.5)]; }
            } else {   // dry grass: the grass dulled towards the earth
                const dry = 0.45 + 0.3 * Math.min(1, (0.95 - gv) * 4);
                col = [lerp(T.grass[si], 150, dry), lerp(T.grass[si + 1], 132, dry), lerp(T.grass[si + 2], 88, dry)];
            }
        }
        // the details: pebbles and dry tufts (not in the grass)
        const bx = Math.floor(x / 11), by = Math.floor(y / 11);
        if (hash(bx, by, 21, 22) < 0.1) {
            const cx = bx * 11 + 3 + hash(bx, by, 23, 24) * 5, cy = by * 11 + 3 + hash(bx, by, 25, 26) * 5, dx = (x + 0.5 - cx) / 2.6, dy = (y + 0.5 - cy) / 1.9;
            if (dx * dx + dy * dy <= 1) { const s = dy < -0.2 ? 1.12 : dy > 0.5 ? 0.62 : 0.88; return [150 * s, 156 * s, 150 * s]; }
            const sx = (x + 0.5 - cx - 1.3) / 2.6, sy = (y + 0.5 - cy - 1.2) / 1.9;
            if (sx * sx + sy * sy <= 1) return [col[0] * 0.6, col[1] * 0.6, col[2] * 0.6];
        }
        const tx = Math.floor(x / 13), ty = Math.floor(y / 13);
        if (a > 0.2 && hash(tx, ty, 27, 28) < 0.07) {
            const cx = tx * 13 + 4 + Math.floor(hash(tx, ty, 29, 30) * 5), cy = ty * 13 + 5 + Math.floor(hash(tx, ty, 31, 32) * 5), ddx = x - cx, ddy = y - cy;
            if ((ddx === 0 && ddy >= -2 && ddy <= 0) || (ddx === -1 && ddy === -2) || (ddx === 1 && ddy === -2) || (ddx === 0 && ddy === 1)) return [150, 134, 66];
        }
        return col;
    }
    function waterPixel(T, g, x, y, k) {   // the sea by the depth k (px) from the shore: its own shading, then the plain sea
        if (k < WP_W) return T.wp[Math.floor(k)];
        const si = ((((y % 48) + 48) % 48) * 48 + (((x % 48) + 48) % 48)) * 4;
        return [T.water[si] * T.wsc[0], T.water[si + 1] * T.wsc[1], T.water[si + 2] * T.wsc[2]];
    }
    // one chunk (CH x CH px) of the redrawn shore; null: nothing to draw there
    // (shared atlas bitmaps: a few big textures instead of hundreds of small ones keep the drawing in a few batches)
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
    function paintChunk(g, T, ccx, ccy) {
        const X0 = ccx * CH, Y0 = ccy * CH, img = new ImageData(CH, CH), d = img.data, P = paintable(g);
        let any = false;
        const NB = [[12, 0], [-12, 0], [0, 12], [0, -12], [9, 9], [-9, -9], [9, -9], [-9, 9]];
        for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
            const wx = X0 + x, wy = Y0 + y;
            if (wx >= g.W * g.tw || wy >= g.H * g.th) continue;
            const c = Math.floor(wy / g.th) * g.W + Math.floor(wx / g.tw), t = g.type[c], sd = sdAt(g, wx + 0.5, wy + 0.5);
            let col = null;
            if (sd < 0) {
                // (the sea is the map's own)
            } else if (t === 1) {
                col = landPixel(T, wx, wy, sd, ((((wy % 48) + 48) % 48) * 48 + (((wx % 48) + 48) % 48)) * 4);
            } else if (t === 0 && P[c] && sd < DMAX && pmAt(g, wx + 0.5, wy + 0.5) > 0.6 + (vnoise(wx, wy, 34, 9) - 0.5) * 0.3) {
                col = landPixel(T, wx, wy, sd, ((((wy % 48) + 48) % 48) * 48 + (((wx % 48) + 48) % 48)) * 4, P[c]);
            }
            if (col) { const p = (y * CH + x) * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255; any = true; }
        }
        if (!any) return null;
        // the ordinary decorations (layers 1-3, not the upper-layer ones) drawn again on the painted pixels
        const flags = $gameMap.tilesetFlags(), tw = g.tw, th = g.th;
        for (let cy = Math.floor(Y0 / th); cy <= Math.min(g.H - 1, Math.floor((Y0 + CH - 1) / th)); cy++) for (let cx2 = Math.floor(X0 / tw); cx2 <= Math.min(g.W - 1, Math.floor((X0 + CH - 1) / tw)); cx2++) {
            if (!P[cy * g.W + cx2]) continue;
            for (let z = 1; z < 4; z++) {
                const id = $gameMap.tileId(cx2, cy, z);
                if (!(id > 0 && id < 2048) || (flags[id] & 0x10)) continue;
                const ti = tileImage(id);
                if (!ti) return undefined;   // (its sheet is loading: tried again)
                for (let py = 0; py < th; py++) {
                    const y = cy * th + py - Y0;
                    if (y < 0 || y >= CH) continue;
                    for (let px = 0; px < tw; px++) {
                        const x = cx2 * tw + px - X0;
                        if (x < 0 || x >= CH) continue;
                        const q = (py * 48 + px) * 4, a = ti[q + 3], o = (y * CH + x) * 4;
                        if (!a || d[o + 3] !== 255) continue;
                        const k = a / 255;
                        d[o] = ti[q] * k + d[o] * (1 - k); d[o + 1] = ti[q + 1] * k + d[o + 1] * (1 - k); d[o + 2] = ti[q + 2] * k + d[o + 2] * (1 - k);
                    }
                }
            }
        }
        const sl = atlasSlot(g, "patch", CH, 1536);
        sl.at.bm.context.putImageData(img, sl.sx, sl.sy);
        return sl;
    }

    // ------------------------------------------------------------------
    // Dead fish on the shore: a few of the shore's cells each day (hashed), red only
    // ------------------------------------------------------------------
    function hash(a, b, c, d) {
        let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2246822519) ^ Math.imul(d | 0, 3266489917);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    let fishCache = { key: "", list: [] };
    function deadFish() {
        if (!has() || !isRed()) return [];
        const key = $gameMap.mapId() + ":" + day();
        if (fishCache.key === key) return fishCache.list;
        const g = geometry(), mid = $gameMap.mapId(), d = day(), list = [];
        const gatherAt = (x, y) => !!(F() && F().gatherAt && F().gatherAt(x, y));
        for (const [x, y] of g.shore) {
            if (hash(mid, x, y, d) >= FISH_DENSITY || gatherAt(x, y)) continue;
            list.push({ x, y, v: hash(mid, y, x, d + 7) < 0.5 ? 0 : 1, ox: Math.round((hash(x, y, d, 3) - 0.5) * 22), oy: Math.round((hash(x, y, d, 5) - 0.5) * 14),
                flip: hash(x, y, d, 9) < 0.5 });
            if (list.length >= FISH_MAX) break;
        }
        fishCache = { key, list };
        return list;
    }
    const fishOn = (x, y) => deadFish().some(f => f.x === x && f.y === y);

    // ------------------------------------------------------------------
    // The looks: a layer in the tilemap, under the characters (z 0.5): the tint, the foam, the dead fish
    // ------------------------------------------------------------------
    function tintBitmap(g, grey) {
        // each sea cell's strength (by its distance from the real shore, in patches), carried one cell onto the land so the gradient does
        // not fall off at the shore; then drawn smooth (bilinear between the cells' middles, S texels a cell) and only over the water
        const [r, gg, bb] = grey ? GREY_RGB : RED_RGB, A = grey ? GREY_A : RED_A, R = grey ? GREY_RANGE : RED_RANGE;
        const W = g.W, H = g.H, val = new Float32Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (!g.water[i]) continue;
            const d = g.toLand[i];
            const fall = Math.max(0, 1 - (d - 1) / R);
            const blot = 0.75 + 0.5 * (0.5 * hash(x >> 1, y >> 1, 11, 13) + 0.5 * hash(x >> 2, y >> 2, 17, 19));
            val[i] = Math.min(1, A * Math.pow(fall, 1.4) * blot);
        }
        const ext = new Float32Array(val);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (g.water[i]) continue;
            let m = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) m = Math.max(m, val[ny * W + nx]); }
            ext[i] = m;
        }
        const at = (x, y) => ext[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
        // (cells whose 3 x 3 neighbourhood is all water or all land need no look at the redrawn line)
        const calm = new Uint8Array(W * H);
        if (g.sd) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const t = g.type[y * W + x]; let same = true;
            for (let dy = -1; dy <= 1 && same; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && g.type[ny * W + nx] !== t) { same = false; break; } }
            calm[y * W + x] = same ? 1 : 0;
        }
        const b = new Bitmap(W * S, H * S), ctx = b.context, img = ctx.createImageData(W * S, H * S), kx = g.tw / S, ky = g.th / S;
        for (let py = 0; py < H * S; py++) {
            const cy = (py + 0.5) / S - 0.5, y0 = Math.floor(cy), fy = cy - y0, cellY = Math.floor((py + 0.5) / S);
            for (let px = 0; px < W * S; px++) {
                const cellX = Math.floor((px + 0.5) / S), ci = cellY * W + cellX;
                if (g.sd && !calm[ci] ? !wAt(g, (px + 0.5) * kx, (py + 0.5) * ky) : !g.water[ci]) continue;
                const cx = (px + 0.5) / S - 0.5, x0 = Math.floor(cx), fx = cx - x0;
                const v = (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
                if (v <= 0.004) continue;
                const p = (py * W * S + px) * 4;
                img.data[p] = r; img.data[p + 1] = gg; img.data[p + 2] = bb; img.data[p + 3] = Math.round(255 * v);
            }
        }
        ctx.putImageData(img, 0, 0);
        b.smooth = true;
        if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        return b;
    }
    // the foam along the redrawn shore: one bitmap per shore cell (the cell and 8 px round it), soft blobs 1-10 px from the land (the
    // nearer the more often); the cell's sprite breathes towards the land and back with the waves
    const FOAM_M = 8;
    function foamCells(g, kind) {
        if (g.foam[kind]) return g.foam[kind];
        const col = kind === "red" ? ["rgba(206,124,96,", "rgba(232,176,140,", "rgba(150,64,40,"] : ["rgba(176,166,138,", "rgba(204,194,166,", "rgba(116,106,84,"];
        const out = [], tw = g.tw, th = g.th, W = g.W, H = g.H;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (Math.abs(sdAt(g, x * tw + tw / 2, y * th + th / 2)) > 62) continue;
            const blobs = []; let sx = 0, sy = 0;
            for (let i = 0; i < 40; i++) {
                const lx = -FOAM_M + hash(x, y, i, 2) * (tw + 2 * FOAM_M), ly = -FOAM_M + hash(y, x, i, 4) * (th + 2 * FOAM_M);
                if (hash(x, y, i, 6) < 0.18) continue;
                const ln = landNear(g, x * tw + lx, y * th + ly);
                if (!ln || ln.d > 1 + Math.pow(hash(x, y, i, 8), 2) * 10) continue;
                blobs.push([lx + FOAM_M, ly + FOAM_M, 0.8 + hash(x, y, i, 10) * 2.6, col[i % 3] + (0.22 + 0.38 * hash(x, y, i, 12)).toFixed(2) + ")"]);
                sx += ln.dx; sy += ln.dy;
            }
            if (!blobs.length) continue;
            const sl = atlasSlot(g, "foam" + kind, tw + 2 * FOAM_M, 1024), ctx = sl.at.bm.context;
            ctx.save(); ctx.beginPath(); ctx.rect(sl.sx, sl.sy, tw + 2 * FOAM_M, th + 2 * FOAM_M); ctx.clip();
            for (const [bx, by, rr, fill] of blobs) { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(sl.sx + bx, sl.sy + by, rr, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
            const len = Math.hypot(sx, sy) || 1;
            out.push({ slot: sl, x: x * tw - FOAM_M, y: y * th - FOAM_M, dx: sx / len, dy: sy / len, ph: hash(x, y, 1, 3) * Math.PI * 2 });
        }
        flushAtlas(g);
        return (g.foam[kind] = out);
    }
    // the foam along one side of a cell (the side to the land): the tiles' own line, for the maps without the redrawn shore
    const foamCache = {};
    function foamBitmap(kind, v) {
        const k = kind + v;
        if (foamCache[k]) return foamCache[k];
        const b = new Bitmap(48, 48), ctx = b.context;
        const col = kind === "red" ? ["rgba(206,124,96,", "rgba(232,176,140,", "rgba(150,64,40,"] : ["rgba(176,166,138,", "rgba(204,194,166,", "rgba(116,106,84,"];
        for (let i = 0; i < 16; i++) {
            const x = 3 + hash(i, v, 1, 2) * 42, y = 1 + Math.pow(hash(i, v, 3, 4), 2) * 10, rr = 0.8 + hash(i, v, 5, 6) * 2.6;
            ctx.fillStyle = col[i % 3] + (0.22 + 0.38 * hash(i, v, 7, 8)).toFixed(2) + ")";
            ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
        }
        if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        return (foamCache[k] = b);
    }

    function Sprite_RedWater() { this.initialize(...arguments); }
    Sprite_RedWater.prototype = Object.create(Sprite.prototype);
    Sprite_RedWater.prototype.constructor = Sprite_RedWater;
    Sprite_RedWater.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.5;
        this._patch = new Sprite();
        this._tint = new Sprite();
        this._foam = new Sprite();
        this._fish = new Sprite();
        this.addChild(this._patch); this.addChild(this._tint); this.addChild(this._foam); this.addChild(this._fish);
        this._key = "";
        this._age = 0;
    };
    Sprite_RedWater.prototype.rebuild = function() {
        const on = seaHere();
        this.visible = on;
        this._tint.bitmap = null;
        this._foam.removeChildren();
        this._fish.removeChildren();
        this._patch.removeChildren();
        this._queue = null;
        if (!on) return;
        const g = geometry(), ph = phase(), grey = ph.grey, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        this._tint.bitmap = tintBitmap(g, grey);
        this._tint.scale.x = tw / S; this._tint.scale.y = th / S;
        this._tint.alpha = grey ? 1 : 0.55 + 0.45 * ph.red;
        if (g.sd) {
            this.startPatches(g);
            for (const c of foamCells(g, grey ? "grey" : "red")) {
                const s = new Sprite(c.slot.at.bm); s.setFrame(c.slot.sx, c.slot.sy, g.tw + 2 * FOAM_M, g.th + 2 * FOAM_M);
                s._cx = c.x; s._cy = c.y; s._dx = c.dx; s._dy = c.dy; s._ph = c.ph;
                this._foam.addChild(s);
            }
        } else {
            // the foam: on every sea cell beside the shore, a strip along each side that has land
            const sides = [[0, -1, 0], [1, 0, Math.PI / 2], [0, 1, Math.PI], [-1, 0, -Math.PI / 2]];
            this._foamList = [];
            for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) {
                const i = y * g.W + x;
                if (!g.water[i] || g.toLand[i] !== 1) continue;
                for (const [dx, dy, rot] of sides) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= g.W || ny >= g.H || g.water[ny * g.W + nx]) continue;
                    if (hash(x, y, dx + 5, dy + 7) < 0.22) continue;   // (not every stretch: the foam comes and goes)
                    const s = new Sprite(foamBitmap(grey ? "grey" : "red", (x * 7 + y * 3 + dx) & 3));
                    s.anchor.x = 0.5; s.anchor.y = 0.5; s.rotation = rot;
                    s._cx = x * tw + tw / 2; s._cy = y * th + th / 2; s._dx = dx; s._dy = dy; s._ph = hash(x, y, dx, dy) * Math.PI * 2;
                    this._foam.addChild(s);
                }
            }
        }
        // the dead fish (red only)
        for (const f of deadFish()) {
            const s = new Sprite(ImageManager.loadSystem("RedWater_Fish_" + f.v));
            s.anchor.x = 0.5; s.anchor.y = 0.6;
            s.scale.x = f.flip ? -1 : 1;
            s._cx = f.x * tw + tw / 2 + f.ox; s._cy = f.y * th + th / 2 + f.oy;
            this._fish.addChild(s);
        }
        this._key = $gameMap.mapId() + ":" + day() + ":" + (grey ? "g" : "r") + ":" + ph.red;
    };
    // the redrawn shore's chunks: queued once per map, a few milliseconds of them every frame
    Sprite_RedWater.prototype.startPatches = function(g) {
        if (g.chunks) { for (const c of g.chunks) if (c.slot) this.addChunk(c); this._queue = g; return; }
        const list = [], seen = new Set(), P = paintable(g);
        for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) {
            const i = y * g.W + x, t = g.type[i];
            if (!((t === 0 && g.toWater[i] >= 0 && g.toWater[i] <= 13) || (t === 1 && g.toLand[i] >= 0 && g.toLand[i] <= 2))) continue;
            const k = Math.floor(y * g.th / CH) * 1000 + Math.floor(x * g.tw / CH);
            if (!seen.has(k)) { seen.add(k); list.push({ cx: Math.floor(x * g.tw / CH), cy: Math.floor(y * g.th / CH), slot: null, done: false }); }
        }
        g.chunks = list; this._queue = g;
    };
    Sprite_RedWater.prototype.addChunk = function(c) {
        const s = new Sprite(c.slot.at.bm); s.setFrame(c.slot.sx, c.slot.sy, CH, CH); s.x = c.cx * CH; s.y = c.cy * CH; this._patch.addChild(s);
    };
    Sprite_RedWater.prototype.workPatches = function() {
        const g = geo;
        if (!g || !g.chunks || !g.sd) return;
        const T = textures(g);
        if (!T) return;   // (a sheet is still loading)
        const t0 = performance.now();
        let all = true;
        for (const c of g.chunks) {
            if (c.done) continue;
            const r = paintChunk(g, T, c.cx, c.cy);
            if (r === undefined) { all = false; break; }
            c.slot = r; c.done = true;
            if (c.slot) this.addChunk(c);
            if (performance.now() - t0 > 3) { all = false; break; }
        }
        flushAtlas(g);
        if (all) this._queue = null;   // (finished: nothing more to do each frame)
    };
    Sprite_RedWater.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!has()) return;
        const key = $gameMap.mapId() + ":" + day() + ":" + (seaHere() ? (phase().grey ? "g" : "r") + ":" + phase().red : "-");
        if (key !== this._key) this.rebuild();
        if (!this.visible) return;
        if (this._queue) this.workPatches();
        this._age++;
        const ox = -$gameMap.displayX() * $gameMap.tileWidth(), oy = -$gameMap.displayY() * $gameMap.tileHeight();
        this._tint.x = Math.round(ox); this._tint.y = Math.round(oy);
        this._patch.x = Math.round(ox); this._patch.y = Math.round(oy);
        const pulse = 0.94 + 0.06 * Math.sin(this._age / 90);
        this._tint.opacity = Math.round(255 * pulse);
        // the foam breathes in and out with the waves (towards the land and back)
        // (the container follows the map; the breathing itself every other frame - it is slow)
        this._foam.x = Math.round(ox); this._foam.y = Math.round(oy);
        if (this._age & 1) for (const s of this._foam.children) {
            const w = Math.sin(this._age / 40 + s._ph);
            s.x = Math.round(s._cx + s._dx * w * 2); s.y = Math.round(s._cy + s._dy * w * 2);
            s.opacity = Math.round(150 + 80 * (0.5 + 0.5 * w));
        }
        for (const s of this._fish.children) { s.x = Math.round(ox + s._cx); s.y = Math.round(oy + s._cy); }
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._redWater = new Sprite_RedWater();
        this._tilemap.addChild(this._redWater);
    };
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        geo = null; fishCache = { key: "", list: [] };
    };

    // ------------------------------------------------------------------
    // The state "Zatrucie" (Survival's premia: the work costs more; the strength capped like a wound; the breath follows the strength).
    // Its name and description: js/teksty/czerwona_woda.txt, zatrucie.* ({koszt}, {limit} from the constants) - given to Survival once
    // the words are read (before the title), and again after F9 "Wczytaj teksty od nowa"
    // ------------------------------------------------------------------
    function defineState() {
        const sv = SV(), w = TK.zatrucie || {};
        if (sv && sv.defineBuff) sv.defineBuff("zatrucie", { name: w.name, icon: POISON_ICON, bad: true, cost: POISON_COST,
            desc: Watki.wstaw(w.desc || "", { koszt: Math.round((POISON_COST - 1) * 100), limit: Math.round(POISON_CAP * 100) }) });
    }
    Watki.poTekstach(defineState);
    T.on("tekstyWczytane", defineState, { owner: PLUGIN });
    const poisoned = () => !!(window.$gameSystem && typeof $gameSystem.hasBuff === "function" && T.state("survival").buffs && $gameSystem.hasBuff("zatrucie"));
    const _Game_System_stamina = Game_System.prototype.stamina;
    Game_System.prototype.stamina = function() {
        const s = _Game_System_stamina.call(this);
        return poisoned() && typeof this.maxStamina === "function" ? Math.min(s, Math.round(this.maxStamina() * POISON_CAP)) : s;
    };

    // ------------------------------------------------------------------
    // The sea's menu (Farming_Plots.waterMenu asks it on a map with <Water:salt>)
    // ------------------------------------------------------------------
    let toldAt = -1e9;
    function seaPopup(force) {
        if (Graphics.frameCount - toldAt < (force ? 120 : 900)) return;   // (without a rod every time - but not twice in two seconds)
        toldAt = Graphics.frameCount;
        if (isRed()) pop(TK.kod.seaPopup[0], THIRST_ICON);
        else pop(TK.kod.seaPopup[1], THIRST_ICON);
    }
    const ownsAny = ids => ids.some(id => window.$dataItems && $dataItems[id] && $gameParty.numItems($dataItems[id]) > 0);
    function seaMenu(fishEntry) {
        const red = isRed();
        seaPopup(!fishEntry);
        const out = [];
        if (fishEntry) out.push(fishEntry);
        out.push({ name: TK.kod.seaMenu[0], icon: THIRST_ICON, enabled: true,
            help: red ? TK.kod.seaMenu[1] : TK.kod.seaMenu[2],
            run: drinkAnyway });
        out.push({ name: TK.kod.seaMenu[3], icon: ownsAny([BUCKET]) ? (($dataItems[BUCKET] || {}).iconIndex || 0) : THIRST_ICON, enabled: true,
            help: TK.kod.seaMenu[4], run: fillRefused });
        if (ownsAny([BUCKET, CAULDRON])) out.push({ name: TK.kod.seaMenu[7], icon: ($dataItems[ownsAny([CAULDRON]) ? CAULDRON : BUCKET] || {}).iconIndex || 0, enabled: true,
            help: TK.kod.seaMenu[5], run: boilRefused });
        return { title: red ? TK.kod.seaMenu[6] : TK.kod.seaMenu[8], entries: out };
    }
    function drinkAnyway() {
        const red = isRed(), n = N(), on = !!(n && n.enabled && n.enabled());
        const c = core(), swing = c && c.swingThen ? c.swingThen : null;
        const act = () => {
            AudioManager.playSe({ name: "Water1", volume: 80, pitch: 80, pan: 0 });
            if (red) {
                if (on) { const s = n.state(); s.water = Math.max(0, s.water - 18); s.food = Math.max(0, s.food - 12); }
                if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-10);
                if (typeof $gameSystem.addBuff === "function") $gameSystem.addBuff("zatrucie", POISON_HOURS);
                T.audio && T.audio.se ? T.audio.se("Poison", { volume: 70 }) : AudioManager.playSe({ name: "Poison", volume: 70, pitch: 100, pan: 0 });
                pop(TK.kod.act[0], POISON_ICON);
                S0().poisoned = (S0().poisoned || 0) + 1;
            } else {
                if (on) { const s = n.state(); s.water = Math.max(0, s.water - 10); }
                pop(TK.kod.act[1], THIRST_ICON);
                S0().salty = (S0().salty || 0) + 1;
            }
        };
        if (swing) swing(c.CROUCH_KIND, act); else act();
        return true;
    }
    function fillRefused() {
        pop(isRed() ? TK.kod.fillRefused[0] : TK.kod.fillRefused[1], ($dataItems[BUCKET] || {}).iconIndex || THIRST_ICON);
        return false;
    }
    function boilRefused() {
        pop(isRed() ? TK.kod.boilRefused[0] : TK.kod.boilRefused[1], ($dataItems[CAULDRON] || {}).iconIndex || THIRST_ICON);
        return false;
    }
    const store = T.state.define("czerwonaWoda", () => ({ poisoned: 0, salty: 0, dead: 0 }), { version: 1, owner: PLUGIN });
    const S0 = () => store();

    // fishing on the sea: by the shore in the red the fish bite worse and now and then it is a dead one; the open water is healthy
    function fishAt(x, y) {
        if (!has() || !seaHere() || !isRed()) return { mul: 1, dead: 0 };
        const d = distToLand(x, y);
        return d >= 1 && d <= SHALLOW ? { mul: 0.55, dead: 0.35 } : { mul: 1, dead: 0 };
    }
    function deadCatch() {
        S0().dead = (S0().dead || 0) + 1;
        pop(TK.kod.deadCatch[0], 0, "#d8c0a8");
    }

    // a dead fish looked at (the action button facing it)
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && has() && seaHere() && !$gameMap.isEventRunning()) {
            const d = this.direction(), x = $gameMap.roundXWithDirection(this.x, d), y = $gameMap.roundYWithDirection(this.y, d);
            if (fishOn(x, y) && $gameMap.eventsXy(x, y).length === 0) { pop(TK.kod.triggerButtonAction[0], 0, "#d8c0a8"); return true; }
        }
        return _Game_Player_triggerButtonAction.call(this);
    };

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = { phase, force, forced: () => forced, isRed, seaHere, dryDays, distToLand, nearShore, deadFish, fishOn, seaMenu, drinkAnyway, fillRefused, boilRefused,
        fishAt, deadCatch, poisoned, state: () => S0(), GREY_RAINS, POISON_HOURS, POISON_CAP, Sprite_RedWater,
        // the share of red days over a stretch of the calendar (for the tests and the report)
        redShare: (d0, d1) => { let r = 0; for (let d = d0; d <= d1; d++) if (!phase(d).grey) r++; return r / (d1 - d0 + 1); } };
    window.CzerwonaWoda = T.register(PLUGIN, api);
})();
