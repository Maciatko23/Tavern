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
        geo = { map: $dataMap, W, H, water, sea, toLand, toWater, shore };
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
            const d = g.toLand[i], fall = Math.max(0, 1 - (d - 1) / R);
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
        const b = new Bitmap(W * S, H * S), ctx = b.context, img = ctx.createImageData(W * S, H * S);
        for (let py = 0; py < H * S; py++) {
            const cy = (py + 0.5) / S - 0.5, y0 = Math.floor(cy), fy = cy - y0, cellY = Math.floor((py + 0.5) / S);
            for (let px = 0; px < W * S; px++) {
                const cellX = Math.floor((px + 0.5) / S);
                if (!g.water[cellY * W + cellX]) continue;
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
    // the foam along one side of a cell (the side to the land): a strip of soft blobs, 48 x 48, the land at the top (rotated per side)
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
        this._tint = new Sprite();
        this._foam = new Sprite();
        this._fish = new Sprite();
        this.addChild(this._tint); this.addChild(this._foam); this.addChild(this._fish);
        this._key = "";
        this._age = 0;
    };
    Sprite_RedWater.prototype.rebuild = function() {
        const on = seaHere();
        this.visible = on;
        this._tint.bitmap = null;
        this._foam.removeChildren();
        this._fish.removeChildren();
        if (!on) return;
        const g = geometry(), ph = phase(), grey = ph.grey, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        this._tint.bitmap = tintBitmap(g, grey);
        this._tint.scale.x = tw / S; this._tint.scale.y = th / S;
        this._tint.alpha = grey ? 1 : 0.55 + 0.45 * ph.red;
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
    Sprite_RedWater.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!has()) return;
        const key = $gameMap.mapId() + ":" + day() + ":" + (seaHere() ? (phase().grey ? "g" : "r") + ":" + phase().red : "-");
        if (key !== this._key) this.rebuild();
        if (!this.visible) return;
        this._age++;
        const ox = -$gameMap.displayX() * $gameMap.tileWidth(), oy = -$gameMap.displayY() * $gameMap.tileHeight();
        this._tint.x = Math.round(ox); this._tint.y = Math.round(oy);
        const pulse = 0.94 + 0.06 * Math.sin(this._age / 90);
        this._tint.opacity = Math.round(255 * pulse);
        // the foam breathes in and out with the waves (towards the land and back)
        for (const s of this._foam.children) {
            const w = Math.sin(this._age / 40 + s._ph);
            s.x = Math.round(ox + s._cx - s._dx * w * 2); s.y = Math.round(oy + s._cy - s._dy * w * 2);
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
    // The state "Zatrucie" (Survival's premia: the work costs more; the strength capped like a wound; the breath follows the strength)
    // ------------------------------------------------------------------
    function defineState() {
        const sv = SV();
        if (sv && sv.defineBuff) sv.defineBuff("zatrucie", { name: "Zatrucie", icon: POISON_ICON, bad: true, cost: POISON_COST,
            desc: "prace kosztują " + Math.round((POISON_COST - 1) * 100) + "% więcej sił, wytrzymałość najwyżej " + Math.round(POISON_CAP * 100) + "%" });
    }
    defineState();
    const poisoned = () => !!(window.$gameSystem && typeof $gameSystem.hasBuff === "function" && $gameSystem._buffs && $gameSystem.hasBuff("zatrucie"));
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
        if (isRed()) pop("Woda jest czerwona i cuchnie.", THIRST_ICON);
        else pop("Słona - nie do picia.", THIRST_ICON);
    }
    const ownsAny = ids => ids.some(id => window.$dataItems && $dataItems[id] && $gameParty.numItems($dataItems[id]) > 0);
    function seaMenu(fishEntry) {
        const red = isRed();
        seaPopup(!fishEntry);
        const out = [];
        if (fishEntry) out.push(fishEntry);
        out.push({ name: "Napij się mimo to", icon: THIRST_ICON, enabled: true,
            help: red ? "Czerwona woda cuchnie zakwitem. Rybacy mówią, że od niej się rzyga do rana." : "Morska woda. Słona - pragnienie po niej tylko gorsze.",
            run: drinkAnyway });
        out.push({ name: "Nabierz wody", icon: ownsAny([BUCKET]) ? (($dataItems[BUCKET] || {}).iconIndex || 0) : THIRST_ICON, enabled: true,
            help: "Do bukłaka, wiadra albo garnka.", run: fillRefused });
        if (ownsAny([BUCKET, CAULDRON])) out.push({ name: "Przegotuj", icon: ($dataItems[ownsAny([CAULDRON]) ? CAULDRON : BUCKET] || {}).iconIndex || 0, enabled: true,
            help: "Nabrać do wiadra i zagotować na ogniu? Rybacy się z tego śmieją.", run: boilRefused });
        return { title: red ? "Czerwona woda" : "Morze", entries: out };
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
                pop("Wymiotujesz. Zatrucie!", POISON_ICON);
                S0().poisoned = (S0().poisoned || 0) + 1;
            } else {
                if (on) { const s = n.state(); s.water = Math.max(0, s.water - 10); }
                pop("Słona! Pragnienie jeszcze gorsze.", THIRST_ICON);
                S0().salty = (S0().salty || 0) + 1;
            }
        };
        if (swing) swing(c.CROUCH_KIND, act); else act();
        return true;
    }
    function fillRefused() {
        pop(isRed() ? "Czerwonej wody nie nabierzesz. Zepsujesz naczynie." : "Słonej wody nie ma po co nosić.", ($dataItems[BUCKET] || {}).iconIndex || THIRST_ICON);
        return false;
    }
    function boilRefused() {
        pop(isRed() ? "Dalej czerwona. Nawet para śmierdzi." : "Sól zostaje. Przegotowana dalej słona.", ($dataItems[CAULDRON] || {}).iconIndex || THIRST_ICON);
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
        pop("Śnięta ryba. Wyrzucasz ją z powrotem.", 0, "#d8c0a8");
    }

    // a dead fish looked at (the action button facing it)
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && has() && seaHere() && !$gameMap.isEventRunning()) {
            const d = this.direction(), x = $gameMap.roundXWithDirection(this.x, d), y = $gameMap.roundYWithDirection(this.y, d);
            if (fishOn(x, y) && $gameMap.eventsXy(x, y).length === 0) { pop("Śnięta ryba. Cuchnie zakwitem.", 0, "#d8c0a8"); return true; }
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
