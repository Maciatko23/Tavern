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
 * @orderAfter TerenKit
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
    // (2026-10-30) the ground-painting tools shared with Ziemia.js (noise, blur, distances, the tileset's own pixels, atlases, hash): TerenKit.js
    const K = T.api("TerenKit");
    if (!K) throw new Error("CzerwonaWoda.js: brak TerenKit.js - musi stać wyżej na liście wtyczek (the shared ground tools are missing)");
    const { hash, vnoise, boxBlur, chamfer, descOf, srcOf, profileOf, tileSheet, tileImage, a5Pixels, rimStone, rimGrass, rimEarth, a5Grass, a5Earth, lerp, atlasSlot, flushAtlas } = K;
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
    // (2026-10-30, the player: "po wyjściu z menu nakładka pojawia się po chwili") a shore map's finished geometry - the fields and the
    // painted pieces in their atlases - is kept for the next time the map is read (back from the menu, from a hut): the last two shore
    // maps (an atlas set is tens of MB); the key: the map, its tiles and its water as they are now
    const geoKept = [];
    function geoKey(W, H, water) {
        let h = 0;
        const d = $dataMap.data || [];
        for (let i = 0; i < d.length; i++) h = (Math.imul(h, 31) + d[i]) | 0;
        for (let i = 0; i < water.length; i++) h = (Math.imul(h, 31) + water[i]) | 0;
        return $gameMap.mapId() + ":" + $gameMap.tilesetId() + ":" + W + "x" + H + ":" + h;
    }
    function dropGeo(g) {
        endJob(g, true);
        for (const k in g.atlas || {}) for (const at of g.atlas[k]) at.bm.destroy();
        g.atlas = null; g.chunks = null;
    }
    function geometry() {
        if (geo && geo.map === $dataMap) return geo;
        const W = $gameMap.width(), H = $gameMap.height(), water = new Uint8Array(W * H), sea = new Uint8Array(W * H);
        const isW = (x, y) => !!(F() && F().isWaterTile && F().isWaterTile(x, y));
        // water: the open water (not under the piers' planks); sea: all the sea, the piers' water too - the shore is the real land
        const isSea = (x, y) => { for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; } return false; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { water[y * W + x] = isW(x, y) ? 1 : 0; sea[y * W + x] = water[y * W + x] || isSea(x, y) ? 1 : 0; }
        const key = brzegMap() ? geoKey(W, H, water) : null, kept = key && geoKept.find(g => g.key === key);
        if (kept) { geo = kept; geo.map = $dataMap; return geo; }
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
        if (brzegMap()) {
            buildField(geo);
            geo.key = key;
            geoKept.push(geo);
            while (geoKept.length > 2) dropGeo(geoKept.shift());
        }
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
    const BRZEG_MAPS = [990, 125, 155, 157, 159, 162, 165, 120, 175, 168, 17, 18, 960, 961, 962, 963, 964, 21, 900, 901, 910, 912, 914, 917, 918, 920, 922, 923, 931, 933, 934, 935, 950, 951, 20];   // (2026-11-05: every map with the island's sea, tools/laka/install_brzeg.py)   // (styki 2026-10-31: the new maps of the old holes)   // (the island's sea maps - none of them is the player's: docs/mapy/PRZEGLAD.md; 2026-10-30 the east / south ends 159, 120, 175, 168, 17, 18)
    const SHORE_GROW = 0.3;   // (the new line lies about 19 px out in the old water: nothing of the sea has to be drawn over the old land, and the square corners are covered)
    const SD_Q = 4, CH = 192, DMAX = 576, RING_W = 11, WP_W = 24;
    const brzegMap = () => has() && seaHere() && (BRZEG_MAPS.indexOf($gameMap.mapId()) >= 0 || !!window.BRZEG_ALL);
    // (2026-11-06) the field's maths only needs g.type / W / H / tw / th and the paintable mask P: pure, so a worker can run it as well
    function buildFieldCore(g, P) {
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
        // the mask of the cells where the strip may be painted, blurred: the strip's edge by paths, hills and walls is a smooth curve
        // and the earth's field (the paths' and the bare ground's cells, blurred): earth or grass is chosen by the pixel, so their border
        // in the strip is a soft line, not the tiles' squares (2026-10-30, the player: "kanciaście")
        const pm = new Float32Array(TW * TH), em = new Float32Array(TW * TH);
        for (let y = 0; y < TH; y++) {
            const cy = Math.min(g.H - 1, Math.floor((y + 0.5) * SD_Q / th));
            for (let x = 0; x < TW; x++) {
                const c = cy * g.W + Math.min(g.W - 1, Math.floor((x + 0.5) * SD_Q / tw)), t = g.type[c];
                pm[y * TW + x] = t !== 0 || P[c] ? 1 : 0;   // (water and piers count as paintable: they are not painted, but they must not eat the strip's edge)
                em[y * TW + x] = t === 0 && P[c] === 2 ? 1 : 0;
            }
        }
        boxBlur(pm, TW, TH, 5);
        boxBlur(em, TW, TH, 4);
        return { sd, TW, TH, pm, em };
    }
    function buildField(g) {
        const r = buildFieldCore(g, paintable(g));
        g.sd = r.sd; g.TW = r.TW; g.TH = r.TH; g.pm = r.pm; g.em = r.em;
    }
    const fieldAt = (g, s, px, py) => K.sample(s, g.TW, g.TH, SD_Q, px, py);
    const pmAt = (g, px, py) => fieldAt(g, g.pm, px, py);
    // earth (not grass) under this pixel: the earth's field against a noisy threshold - a soft, uneven line
    const earthAt = (g, px, py) => !!g.em && fieldAt(g, g.em, px, py) > 0.5 + (vnoise(px, py, 30, 17) - 0.5) * 0.45;
    const sdAt = (g, px, py) => K.sample(g.sd, g.TW, g.TH, SD_Q, px, py);
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
    // the soft ground overlays of the A2 sheet (grass tufts, green / earth / mud patches, flowers, cobbles) that the strip paints over
    // (2026-10-30: the bright green squares by the water; hills, walls, fences, planks and stairs are not in it). Tileset 9's sheet has
    // its hard green patch on the row of the stone outline (kind 30), so there it is an overlay too.
    const OVERLAY_RELS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 15, 20, 21, 23, 31];
    function overlayOk(id) {
        if (!(id >= 2816 && id < 4352)) return false;
        const rel = Math.floor((id - 2816) / 48);
        return OVERLAY_RELS.indexOf(rel) >= 0 || (rel === 30 && $gameMap.tilesetId() === 9);
    }
    // paintable cells: plain grass, plain earth or a terrace on layer 0, nothing on the layers 1-3
    function paintable(g) {
        if (g.paint) return g.paint;
        const W = g.W, H = g.H, p = new Uint8Array(W * H), flags = $gameMap.tilesetFlags();
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (g.type[y * W + x] !== 0) continue;
            const id = $gameMap.tileId(x, y, 0);
            let kind = 0;   // 1 grass (the two grass kinds) or the terrace's stone border, 2 earth (no dry grass painted on it), 3 the dirt / grass patches of the A2 sheet (painted over with grass beyond the strip)
            const rel = id >= 2816 && id < 4352 ? Math.floor((id - 2816) / 48) : -1;
            if (rel === 0 || rel === 11 || rimGrass(id) || a5Grass(id)) kind = 1;
            else if (rel === 8 || rimEarth(id) || a5Earth(id)) kind = 2;
            else if (rel === 1 || rel === 9 || rel === 10) kind = 3;
            if (!kind) continue;
            // (layer 1: the grass-patch overlays of the A2 sheet and the ordinary B-E tiles are painted over - the ordinary ones are drawn again on top; hills, piers, walls are not)
            const l1 = $gameMap.tileId(x, y, 1);
            if (!(l1 === 0 || l1 < 2048 || overlayOk(l1))) continue;
            // (2026-10-30, the player: "jak jest wzniesienie, to boczne krawędzie tego wzniesienia są niewidoczne") a terrace's rim
            // shuts the side of its drop, and its stones are the only sign of the raised ground's side: the rim is painted, its stones
            // drawn again on top (paintChunk, g.rim); any other cell whose own ground shuts a side keeps its tile
            if (rimGrass(id) || rimEarth(id)) (g.rim || (g.rim = new Uint16Array(W * H)))[y * W + x] = id;
            else if ((flags[id] | (l1 > 0 ? flags[l1] : 0)) & 0x0f) continue;
            p[y * W + x] = kind;
        }
        return (g.paint = p);
    }
    // an A5 tile as 48 x 48 pixels (a terrace's rim); null while its sheet loads
    // a B-E tile as 48 x 48 pixels (the decorations drawn again on the strip); null while its sheet loads
    // one pixel of the land by its depth d (px) from the shore line (earth: on the paths' / the bare ground's side of the soft line -
    // packed earth there, never grass); beyond the dry grass the plain grass (the strip fades into the map's own tiles: paintChunk)
    function landPixel(T, x, y, d, si, earth) {
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
            if (gv >= 1 && !earth) return [T.grass[si], T.grass[si + 1], T.grass[si + 2]];
            if (gv < 0.5 || earth) {   // packed earth, darker patches
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
    // (2026-11-06) paintCore is pure (g = the inputs: type, W, H, tw, th, paint, rim, deco, rimPx, tilePx, sd, TW, TH, pm, em), so the worker runs
    // the very same code; it returns the pixels (CH x CH RGBA), null (nothing to draw) or undefined (a tile's pixels are missing)
    function paintCore(g, T, ccx, ccy) {
        const X0 = ccx * CH, Y0 = ccy * CH, d = new Uint8ClampedArray(CH * CH * 4), P = g.paint, WH = g.W * g.H;
        let any = false;
        const NB = [[12, 0], [-12, 0], [0, 12], [0, -12], [9, 9], [-9, -9], [9, -9], [-9, 9]];
        for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
            const wx = X0 + x, wy = Y0 + y;
            if (wx >= g.W * g.tw || wy >= g.H * g.th) continue;
            const c = Math.floor(wy / g.th) * g.W + Math.floor(wx / g.tw), t = g.type[c], sd = sdAt(g, wx + 0.5, wy + 0.5);
            let col = null, alpha = 1;
            if (sd < 0) {
                // (the sea is the map's own)
            } else if (t === 1) {
                col = landPixel(T, wx, wy, sd, ((((wy % 48) + 48) % 48) * 48 + (((wx % 48) + 48) % 48)) * 4, earthAt(g, wx + 0.5, wy + 0.5));
            } else if (t === 0 && P[c] && sd < DMAX) {
                // (2026-10-30, the player: "kanciaście" - every paintable cell of the strip is painted, none left as its own tile with the
                // squares of its autotile; by walls, hills and other ground the paintable mask fades the strip out, and at its inland end
                // it fades into the map's own tiles over two cells)
                const pv = pmAt(g, wx + 0.5, wy + 0.5), hi = 0.78 + (vnoise(wx, wy, 34, 9) - 0.5) * 0.2;
                alpha = Math.min(1, Math.max(0, (pv - 0.5) / (hi - 0.5))) * Math.min(1, (DMAX - sd) / 96);
                if (alpha > 0.02) col = landPixel(T, wx, wy, sd, ((((wy % 48) + 48) % 48) * 48 + (((wx % 48) + 48) % 48)) * 4, earthAt(g, wx + 0.5, wy + 0.5));
                const rid = g.rim ? g.rim[c] : 0;
                if (col && rid) {   // (a terrace's rim: its own stones over the painted ground - the raised ground's edge stays seen)
                    const R = g.rimPx[rid];
                    if (!R) return undefined;   // (its sheet is loading: tried again)
                    const q = ((((wy % 48) + 48) % 48) * 48 + (((wx % 48) + 48) % 48)) * 4;
                    if (rimStone(R, q, rimEarth(rid))) col = [R[q], R[q + 1], R[q + 2]];
                }
            }
            if (col) { const p = (y * CH + x) * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = Math.round(255 * alpha); any = true; }
        }
        if (!any) return null;
        // the ordinary decorations (layers 1-3, not the upper-layer ones) drawn again on the painted pixels
        const tw = g.tw, th = g.th;
        for (let cy = Math.floor(Y0 / th); cy <= Math.min(g.H - 1, Math.floor((Y0 + CH - 1) / th)); cy++) for (let cx2 = Math.floor(X0 / tw); cx2 <= Math.min(g.W - 1, Math.floor((X0 + CH - 1) / tw)); cx2++) {
            if (!P[cy * g.W + cx2]) continue;
            for (let z = 1; z < 4; z++) {
                const id = g.deco[(z - 1) * WH + cy * g.W + cx2];   // (0: nothing, or an upper-layer tile)
                if (!id) continue;
                const ti = g.tilePx[id];
                if (!ti) return undefined;   // (its sheet is loading: tried again)
                for (let py = 0; py < th; py++) {
                    const y = cy * th + py - Y0;
                    if (y < 0 || y >= CH) continue;
                    for (let px = 0; px < tw; px++) {
                        const x = cx2 * tw + px - X0;
                        if (x < 0 || x >= CH) continue;
                        const q = (py * 48 + px) * 4, a = ti[q + 3], o = (y * CH + x) * 4;
                        if (!a || !d[o + 3]) continue;
                        const k = a / 255;
                        d[o] = ti[q] * k + d[o] * (1 - k); d[o + 1] = ti[q + 1] * k + d[o + 1] * (1 - k); d[o + 2] = ti[q + 2] * k + d[o + 2] * (1 - k);
                        d[o + 3] = Math.round(d[o + 3] + (255 - d[o + 3]) * k);   // (in the fading edge: the decoration whole, as under it)
                    }
                }
            }
        }
        return d;
    }
    // the decorations (layers 1-3, not the upper-layer ones) of the paintable cells, and the pixels of every tile the chunks read (the terrace
    // rims, the decorations); false while a tileset sheet is still loading
    function gatherTiles(g) {
        if (g.tilePx) return true;
        const W = g.W, H = g.H, WH = W * H, P = paintable(g), flags = $gameMap.tilesetFlags(), deco = new Uint16Array(3 * WH), tilePx = {}, rimPx = {};
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (!P[i]) continue;
            for (let z = 1; z < 4; z++) {
                const id = $gameMap.tileId(x, y, z);
                if (id > 0 && id < 2048 && !(flags[id] & 0x10)) deco[(z - 1) * WH + i] = id;
            }
        }
        for (let i = 0; i < 3 * WH; i++) { const id = deco[i]; if (id && !tilePx[id]) { const ti = tileImage(id); if (!ti) return false; tilePx[id] = ti; } }
        if (g.rim) for (let i = 0; i < WH; i++) { const id = g.rim[i]; if (id && !rimPx[id]) { const R = a5Pixels(id); if (!R) return false; rimPx[id] = R; } }
        g.deco = deco; g.rimPx = rimPx; g.tilePx = tilePx;
        return true;
    }
    function paintChunk(g, T, ccx, ccy) {   // (the main-thread path: today's, and the fallback)
        paintable(g);
        if (!gatherTiles(g)) return undefined;   // (a sheet is loading: tried again)
        const d = paintCore(g, T, ccx, ccy);
        if (!d) return d;
        const sl = atlasSlot(g, "patch", CH, 1536);
        sl.at.bm.context.putImageData(new ImageData(d, CH, CH), sl.sx, sl.sy);
        return sl;
    }

    // ------------------------------------------------------------------
    // The shore's chunks in Web Workers (2026-11-06; the first entry onto a shore map blocked the main thread ~1.3 s, ~0.65 s of it in
    // paintCore). A small pool of dedicated workers is made from a Blob whose source is built from the PURE functions above (toString), so
    // no file has to be shipped and the worker runs the very same code (the pixels are identical). A job per shore map: the inputs go to
    // every worker once (each builds the field itself), the chunks are dealt out a few at a time, the pixels come back as ArrayBuffers and
    // are put into the atlas by the sprite, a few per frame. Without Worker / Blob, or on any error, the main-thread path runs as before.
    // The jobs live in this closure and on the shore geometry (g.job), never on a Game_* object.
    // ------------------------------------------------------------------
    const pool = { list: null, dead: false, nextId: 1, jobs: {} };
    const WINDOW = 3;   // chunks in flight per worker
    function workerSource() {
        const fn = (name, f) => "const " + name + " = " + String(f) + ";\n";
        return '"use strict";\nconst SD_Q = ' + SD_Q + ', CH = ' + CH + ', DMAX = ' + DMAX + ', RING_W = ' + RING_W + ', SHORE_GROW = ' + SHORE_GROW + ';\n' +
            fn("hash", hash) + fn("vnoise", vnoise) + fn("boxBlur", boxBlur) + fn("chamfer", chamfer) + fn("sample", K.sample) + "const K = { sample };\n" +
            fn("lerp", lerp) + fn("rimStone", rimStone) + fn("rimGrass", rimGrass) + fn("rimEarth", rimEarth) +
            fn("fieldAt", fieldAt) + fn("pmAt", pmAt) + fn("earthAt", earthAt) + fn("sdAt", sdAt) + fn("landPixel", landPixel) +
            fn("buildFieldCore", buildFieldCore) + fn("paintCore", paintCore) +
            "const ctxs = {};\n" +
            "onmessage = function(e) {\n" +
            "  const m = e.data;\n" +
            "  try {\n" +
            "    if (m.t === 'init') {\n" +
            "      const g = { W: m.W, H: m.H, tw: m.tw, th: m.th, type: m.type, paint: m.P, rim: m.rim, deco: m.deco, rimPx: m.rimPx, tilePx: m.tilePx };\n" +
            "      const f = buildFieldCore(g, m.P); g.sd = f.sd; g.TW = f.TW; g.TH = f.TH; g.pm = f.pm; g.em = f.em;\n" +
            "      ctxs[m.id] = { g, T: m.T };\n" +
            "    } else if (m.t === 'chunk') {\n" +
            "      const c = ctxs[m.id]; if (!c) { postMessage({ t: 'chunk', id: m.id, n: m.n, buf: null, und: true }); return; }\n" +
            "      const d = paintCore(c.g, c.T, m.cx, m.cy);\n" +
            "      if (d) postMessage({ t: 'chunk', id: m.id, n: m.n, buf: d.buffer }, [d.buffer]); else postMessage({ t: 'chunk', id: m.id, n: m.n, buf: null, und: d === undefined });\n" +
            "    } else if (m.t === 'drop') delete ctxs[m.id];\n" +
            "  } catch (err) { postMessage({ t: 'err', msg: String(err && err.stack || err) }); }\n" +
            "};\n";
    }
    function failPool(why) {   // any trouble: no more workers, the unfinished chunks are painted on the main thread
        if (pool.dead) return;
        pool.dead = true;
        console.warn("CzerwonaWoda: workers off, main thread paints (" + why + ")");
        for (const id in pool.jobs) { const g = pool.jobs[id].g; g.noWorker = true; g.job = null; for (const c of g.chunks || []) c.fl = false; }
        pool.jobs = {};
        for (const w of pool.list || []) { try { w.terminate(); } catch (e) {} }
    }
    function getPool() {
        if (pool.dead || window.CW_NOWORKER) return null;
        if (pool.list) return pool;
        pool.list = [];
        try {
            if (typeof Worker === "undefined" || typeof Blob === "undefined" || !window.URL || !URL.createObjectURL) throw new Error("no Worker / Blob");
            const url = URL.createObjectURL(new Blob([workerSource()], { type: "text/javascript" })), hc = navigator.hardwareConcurrency || 4, n = hc >= 6 ? 3 : hc >= 3 ? 2 : 1;
            for (let i = 0; i < n; i++) {
                const w = new Worker(url);
                w.load = 0;
                w.onmessage = e => onWorkerMessage(w, e.data);
                w.onerror = e => failPool(String((e && e.message) || "worker error"));
                pool.list.push(w);
            }
        } catch (e) { failPool(String(e && e.message || e)); return null; }
        return pool;
    }
    function onWorkerMessage(w, m) {
        if (m.t === "err") { failPool(m.msg); return; }
        const job = pool.jobs[m.id];
        w.load = Math.max(0, w.load - 1);
        if (!job) return;   // (a dropped job)
        job.inbox.push(m);
        pump(job);
    }
    function pump(job) {   // deal out the chunks, WINDOW per worker
        // (only the map on the screen: a map left before its chunks were done keeps them for later - its drain deals the rest when it
        // is on the screen again - instead of keeping the workers and the memory busy while the next map loads)
        if (job.g !== geo) return;
        const list = pool.list;
        while (job.next < job.order.length) {
            let w = null;
            for (const x of list) if (x.load < WINDOW && (!w || x.load < w.load)) w = x;
            if (!w) return;
            const n = job.order[job.next++], c = job.g.chunks[n];
            c.fl = true; w.load++;
            w.postMessage({ t: "chunk", id: job.id, n, cx: c.cx, cy: c.cy });
        }
    }
    function endJob(g, drop) {
        const job = g.job;
        if (!job) return;
        g.job = null;
        pool.lastMs = Math.round(performance.now() - job.t0);
        delete pool.jobs[job.id];
        if (drop && pool.list) for (const w of pool.list) w.postMessage({ t: "drop", id: job.id });
    }
    // starts the job of a shore map: false = use the main thread, null = wait (a sheet is loading), true = running
    function startJob(g, TX) {
        const p = getPool();
        if (!p) return false;
        paintable(g);
        if (!gatherTiles(g)) return null;
        const id = p.nextId++, job = { id, g, inbox: [], at: 0, order: [], next: 0, left: 0, t0: performance.now() };
        job.order = g.chunks.map((c, i) => i).filter(i => !g.chunks[i].done);
        job.left = job.order.length;
        job.order.sort((a, b) => g.chunks[a].pri - g.chunks[b].pri);
        g.job = job; p.jobs[id] = job;
        const msg = { t: "init", id, W: g.W, H: g.H, tw: g.tw, th: g.th, type: g.type, P: g.paint, rim: g.rim || null, deco: g.deco, rimPx: g.rimPx, tilePx: g.tilePx, T: TX };
        try { for (const w of p.list) w.postMessage(msg); } catch (e) { failPool(String(e && e.message || e)); return false; }
        pump(job);
        return true;
    }

    // ------------------------------------------------------------------
    // Dead fish on the shore: a few of the shore's cells each day (hashed), red only
    // ------------------------------------------------------------------
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
        // (2026-10-30, wydajność) their pieces are plain pictures: Sprite.update would walk all of them every frame for nothing
        this._patch.update = this._foam.update = this._fish.update = function() {};
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
        // (the chunks on the screen first: the worker route waits only for them before the screen opens)
        const sx = $gameMap.displayX() * g.tw, sy = $gameMap.displayY() * g.th, sw = Graphics.width, sh = Graphics.height, M = 96;
        for (const c of list) {
            const x0 = c.cx * CH, y0 = c.cy * CH;
            c.vis = x0 < sx + sw + M && x0 + CH > sx - M && y0 < sy + sh + M && y0 + CH > sy - M;
            c.pri = Math.hypot(x0 + CH / 2 - (sx + sw / 2), y0 + CH / 2 - (sy + sh / 2));
        }
        g.chunks = list; this._queue = g;
    };
    Sprite_RedWater.prototype.addChunk = function(c) {
        const s = new Sprite(c.slot.at.bm); s.setFrame(c.slot.sx, c.slot.sy, CH, CH); s.x = c.cx * CH; s.y = c.cy * CH; this._patch.addChild(s);
    };
    Sprite_RedWater.prototype.workPatches = function(budget) {
        const g = geo;
        if (!g || !g.chunks || !g.sd) return;
        const T = textures(g);
        if (!T) return;   // (a sheet is still loading)
        const t0 = performance.now();
        if (!g.noWorker && !g.job && !g.chunks.every(c => c.done)) {
            const r = startJob(g, T);
            if (r === null) return;
        }
        if (g.job) return this.drainChunks(g, budget || 3, t0);
        let all = true;
        for (const c of g.chunks) {
            if (c.done) continue;
            const r = paintChunk(g, T, c.cx, c.cy);
            if (r === undefined) { all = false; break; }
            c.slot = r; c.done = true;
            if (c.slot) this.addChunk(c);
            if (performance.now() - t0 > (budget || 3)) { all = false; break; }
        }
        flushAtlas(g);
        if (all) this._queue = null;   // (finished: nothing more to do each frame)
    };
    // the chunks the workers have finished: put into the atlas a few at a time (the sprites are made here)
    Sprite_RedWater.prototype.drainChunks = function(g, budget, t0) {
        const job = g.job;
        pump(job);   // (back on a map whose job was paused: the rest dealt out again)
        while (job.at < job.inbox.length) {
            const m = job.inbox[job.at++], c = g.chunks[m.n];
            c.fl = false;
            if (m.und) { failPool("a chunk came back without pixels"); break; }
            if (m.buf && window.__cwKeep) window.__cwKeep[c.cx + "," + c.cy] = new Uint8ClampedArray(m.buf.slice(0));
            if (m.buf) {
                const sl = atlasSlot(g, "patch", CH, 1536);
                sl.at.bm.context.putImageData(new ImageData(new Uint8ClampedArray(m.buf), CH, CH), sl.sx, sl.sy);
                c.slot = sl; this.addChunk(c);
            }
            c.done = true; job.left--;
            if (performance.now() - t0 > budget) break;
        }
        if (job.at > 64) { job.inbox.splice(0, job.at); job.at = 0; }
        flushAtlas(g);
        if (g.job && job.left <= 0) { endJob(g, true); this._queue = null; }
        else if (!g.job) this.workPatches(budget);   // (the workers failed: the rest on this thread)
    };
    // the look's key: the map, the day, red or grey and how red
    const lookKey = () => $gameMap.mapId() + ":" + day() + ":" + (seaHere() ? (phase().grey ? "g" : "r") + ":" + phase().red : "-");
    // (2026-10-30, the player: "widać trawę przed nakładką, dopiero po chwili się pojawia") while the screen is still black: the shore's
    // pieces painted with a big budget a frame - Scene_Map waits for them before it fades in (at most ~1.5 s, never stuck)
    Sprite_RedWater.prototype.prepare = function() {
        if (!has()) return true;
        if (lookKey() !== this._key) this.rebuild();
        if (this.visible && this._queue) this.workPatches(24);
        if (!this.visible || !this._queue) return true;
        const g = this._queue;
        return !!(g.job && g.chunks.every(c => !c.vis || c.done));   // (the workers: only the chunks on the screen are waited for)
    };
    const _Scene_Map_isReady = Scene_Map.prototype.isReady;
    Scene_Map.prototype.isReady = function() {
        if (!_Scene_Map_isReady.call(this)) return false;
        const s = this._spriteset && this._spriteset._redWater;
        if (!s || !brzegMap()) return true;
        this._cwWait = (this._cwWait || 0) + 1;
        return s.prepare() || this._cwWait > 90;
    };
    Sprite_RedWater.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!has()) return;
        if (lookKey() !== this._key) this.rebuild();
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
        // (2026-10-30, wydajność: the harbour's ~100 shore pieces and ~240 foam strips are mostly off the screen - they cost ~2.5 ms a
        // frame at 4x slower CPU) only the ones on the screen are drawn and breathe (renderable, docs/WYDAJNOSC.md; Wydajnosc.opts.cull)
        const px = this._patch.x, py = this._patch.y, fx = this._foam.x, fy = this._foam.y, m = 2 * $gameMap.tileWidth();
        const cull = !(window.Wydajnosc && Wydajnosc.opts && Wydajnosc.opts.cull === false);
        for (const s of this._patch.children) s.renderable = !cull || T.view.sees(px + s.x - m, py + s.y - m, px + s.x + CH + m, py + s.y + CH + m);
        for (const s of this._foam.children) s.renderable = !cull || T.view.sees(fx + s._cx - m, fy + s._cy - m, fx + s._cx + m, fy + s._cy + m);
        if (this._age & 1) for (const s of this._foam.children) {
            if (!s.renderable) continue;
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
    window.__cwDebug = { pool, paintCore, textures, geo: () => geo, CH };
    window.CzerwonaWoda = T.register(PLUGIN, api);
})();
