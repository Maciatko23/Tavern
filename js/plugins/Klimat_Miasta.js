//=============================================================================
// Klimat_Miasta.js
//=============================================================================
// Kruczogród żyje (gracz 2026-11-09, pomysły 1-3): dym z kominów, okna zapalające się o zmierzchu, kruki na dachach i murach.
// Wszystko z gotowych obrazków (tools/klimat/obrazki.py: img/system/Klimat_*.png, arkusz kruka img/system/Kruk.png), miejsca
// czytane z kafli mapy przy jej wczytaniu (komin, okno, blanki muru, kalenica dachu) - mapa poprawiona w edytorze poprawia też
// klimat. Duszki tylko dla tego, co na ekranie (pula), nic poza mapami z listy MAPS.
// Load order: after Farming_Render (nightAmount), Storm (wind), Widok (its night veil - the windows glow above it) and Kruk (sheet).

/*:
 * @target MZ
 * @plugindesc Klimat miasta: dym z kominów (gęstszy rano i wieczorem, z wiatrem), okna zapalają się o zmierzchu dom po domu, kruki na dachach i murach, krążą nad kruczarnią, na noc do wieży. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Widok
 * @orderAfter Kruk
 *
 * @help
 * Działa na mapach z listy MAPS w kodzie (dziś: 8 Kruczogród). Bez ustawień.
 *  - DYM: każdy komin z kafli (arkusz B 82-87) dymi; rano 5-9 i wieczorem 16-21 gęsto, w południe latem prawie wcale (zimą
 *    też w dzień), część domów w południe nie pali; kuźnie, browar i kuchnia tawerny dymią zawsze; dym pochyla się z wiatrem
 *    (Storm.wind), w deszczu rzadszy.
 *  - OKNA: okno ciemne zamienia się w zapalone (ten sam kafel Winlu w wersji jasnej), szyby świecą przez noc, wokół miękka
 *    poświata, na bruku plama światła; dom po domu o swojej porze zmierzchu, gasną między 22 a 1 (tawerna i zamek do rana),
 *    przed świtem część domów zapala się znowu. Światło lekko drga jak płomień świecy.
 *  - KRUKI: siedzą na blankach i kalenicach, czasem przelatują, zrywają się, gdy bohater podejdzie (szybciej, gdy biegnie);
 *    dwa krążą nad kruczarnią; o zmierzchu wszystkie lecą na kruczarnię i śpią, rano się rozlatują.
 * API: KlimatMiasta.info() - liczby (testy), KlimatMiasta.birds()
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Klimat_Miasta.js: brak TawernaCore.js");
    const PLUGIN = "Klimat_Miasta";

    // the maps and their places: tavern = the castle and the inn (windows lit all night, the kitchen chimney always smoking),
    // strong = chimneys always smoking (forges, the brewery), roost = the ravenry (the ravens' night)
    const MAPS = {
        8: { tavern: [28, 0, 78, 36], strong: [[1, 52, 17, 63], [84, 24, 98, 33], [105, 37, 113, 46], [28, 0, 78, 36]],
             roost: [104, 0, 117, 14], tower: [[107.5, 8.2], [108.5, 8.3], [107.9, 7.6]], ravens: 12, circlers: 2 }
    };
    const CHIMNEY = { 82: [[24, 20]], 83: [[24, 20]], 84: [[24, 20]], 85: [[24, 22]], 86: [[24, 22]], 87: [[17, 3], [36, 3]] };
    const DARK_TO_LIT = { 1: 2, 9: 10, 32: 33, 36: 37, 40: 41, 44: 45, 49: 48, 52: 53, 54: 55, 60: 61, 62: 63, 68: 69, 76: 75, 847: 855 };
    const LIT = [2, 10, 33, 37, 41, 45, 48, 53, 55, 61, 63, 69, 75, 855, 4, 6, 12, 14];   // (the order of Klimat_Okna.png)
    const MERLON = new Set([128, 129, 130]);
    const TILE = () => $gameMap.tileWidth();

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + (k || 0) * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const hour = () => (typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const night = () => (window.Farming && Farming.nightAmount ? Farming.nightAmount() : 0);
    const wind = () => (window.Storm && Storm.wind ? Storm.wind() : 0.2);
    const raining = () => { const w = $gameScreen.weatherType(); return (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0; };
    const season = () => (window.Farming && Farming.seasonIndex && $gameSystem.dayNightDay ? Farming.seasonIndex($gameSystem.dayNightDay()) : 1);
    const inBox = (b, x, y) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
    const cfg = () => MAPS[$gameMap.mapId()] || null;

    // ------------------------------------------------------------------ the map's places, read from its tiles
    let places = null;
    function scan() {
        const c = cfg(), d = $dataMap.data, W = $dataMap.width, H = $dataMap.height, n = W * H;
        const at = (z, x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(z * H + y) * W + x] || 0);
        const kind = v => (v >= 2048 ? Math.floor((v - 2048) / 48) : -1);
        const wall = (x, y) => kind(at(0, x, y)) >= 80, roof = (x, y) => { const k = kind(at(0, x, y)); return k >= 48 && k < 80; };
        // the houses: 4-connected wall cells (a house's windows light up together)
        const grp = new Int32Array(n).fill(-1); let groups = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!wall(x, y) || grp[y * W + x] >= 0) continue;
            const st = [[x, y]]; grp[y * W + x] = groups;
            while (st.length) {
                const [cx, cy] = st.pop();
                for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]])
                    if (nx >= 0 && ny >= 0 && nx < W && ny < H && grp[ny * W + nx] < 0 && wall(nx, ny)) { grp[ny * W + nx] = groups; st.push([nx, ny]); }
            }
            groups++;
        }
        const chimneys = [], windows = [], perches = [], roost = [];
        const winAt = new Set();
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            for (const z of [2, 3]) {
                const v = at(z, x, y);
                if (CHIMNEY[v]) for (const [ox, oy] of CHIMNEY[v]) {
                    const strong = c.strong.some(b => inBox(b, x, y));
                    chimneys.push({ x: x + ox / 48, y: y + oy / 48, s: v === 87 ? 0.62 : 1, strong, cold: !strong && hash(x, y, 3) < 0.3, ph: Math.floor(hash(x, y, 5) * 72), a: 0, spr: null });
                }
                const lit = DARK_TO_LIT[v] || (LIT.includes(v) ? v : 0);
                if (lit && !winAt.has(x + "," + y)) {
                    winAt.add(x + "," + y);
                    // what lies over the window on the higher layers (a neighbour's eave, a roof's edge): drawn back over the lit pane
                    // (gracz 2026-11-09: „okno - światło przez dach widać”); a ☆ tile is drawn over everything anyway
                    const flags = $gameMap.tileset().flags, cover = [];
                    for (let zz = z + 1; zz <= 3; zz++) { const t = at(zz, x, y); if (t && t < 1024 && !(flags[t] & 0x10)) cover.push(t); }
                    const g = grp[y * W + x] >= 0 ? grp[y * W + x] : 100000 + Math.floor(x / 5) * 100 + Math.floor(y / 5);
                    windows.push({ x, y, tile: DARK_TO_LIT[v] ? lit : 0, atlas: LIT.indexOf(lit), g, jit: hash(x, y, 7) * 0.06, v: 0, spr: null, cover, covers: null });
                }
            }
        }
        // per house: when it lights up (the dusk's darkness), when it goes dark, early risers
        const house = {};
        for (const w of windows) if (!house[w.g]) {
            const r = hash(w.g, 17, 9), tav = inBox(c.tavern, w.x, w.y);
            house[w.g] = { th: 0.1 + 0.42 * r, off: tav ? 99 : 22 + 3 * hash(w.g, 3, 11), early: !tav && hash(w.g, 5, 13) < 0.35 ? 4.6 + hash(w.g, 9, 2) : 0 };
        }
        // the light's pool: on the ground in front of the wall (the first cell below that is not a wall), one per column
        const pools = new Set();
        for (const w of windows) {
            w.halo = !winAt.has(w.x + "," + (w.y + 1));
            let gy = w.y + 1;
            while (gy < H && wall(w.x, gy) && gy - w.y <= 3) gy++;
            const key = w.x + "," + gy;
            w.pool = gy < H && !wall(w.x, gy) && gy - w.y <= 3 && !pools.has(key) ? gy : 0;
            if (w.pool) pools.add(key);
        }
        // the ravens' perches: the crenels (every 3rd) and the roof ridges (every 3rd, not under a chimney)
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const p3 = at(3, x, y);
            let p = null;
            const home = inBox(c.roost, x, y), every = home ? 1 : 3;     // (the ravenry: every cell - the whole flock sleeps there)
            if (MERLON.has(p3) && x % every === (home ? 0 : 1)) p = { x: x + 0.5, y: y + 0.62 };
            else if (roof(x, y) && !roof(x, y - 1) && x % every === 0 && !CHIMNEY[at(2, x, y)] && !CHIMNEY[at(3, x, y)] && !CHIMNEY[at(3, x, y + 1)]) p = { x: x + 0.5, y: y + 0.45 };
            if (!p) continue;
            (home ? roost : perches).push(p);
        }
        for (const [tx, ty] of c.tower || []) roost.push({ x: tx, y: ty });
        // fire baskets (!Decoration index 0 facing down - the burning ones): a thin smoke over the flame
        for (const e of $dataMap.events) {
            const im = e && e.pages && e.pages[0] && e.pages[0].image;
            if (im && im.characterName === "!Decoration" && im.characterIndex === 0 && im.direction === 2)
                chimneys.push({ x: e.x + 0.5, y: e.y + 1 - 50 / 48, s: 0.5, strong: true, fire: true, cold: false, ph: Math.floor(hash(e.x, e.y, 5) * 72), a: 0, spr: null });
        }
        places = { mapId: $gameMap.mapId(), data: $dataMap, chimneys, windows, house, perches, roost, groups };
        return places;
    }
    const placesNow = () => (places && places.data === $dataMap ? places : scan());

    // ------------------------------------------------------------------ sprites
    const SMOKE_W = 48, SMOKE_H = 104, SMOKE_BASE = 100;
    let set = null, tm = null, top = null, smokeBmp = null, glassBmp = null, haloBmp = null, poolBmp = null, tileBmps = {};
    const free = { smoke: [], lit: [], glass: [], halo: [], pool: [] };
    function take(kind, make) { return free[kind].pop() || make(); }
    function give(kind, s) { if (s) { s.visible = false; free[kind].push(s); } }
    function mk(parent, bmp, ax, ay, blend, z) {
        const s = new Sprite(bmp); s.anchor.set(ax, ay); if (blend) s.blendMode = blend; if (z !== undefined) s.z = z; parent.addChild(s); return s;
    }
    const ADD = 1;
    function tileBitmap(id) {
        const sheet = 5 + Math.floor(id / 256), name = $gameMap.tileset().tilesetNames[sheet];
        return tileBmps[sheet] || (tileBmps[sheet] = ImageManager.loadTileset(name));
    }
    function tileFrame(s, id) {
        const t = id % 256, col = (t % 8) + (t >= 128 ? 8 : 0), row = Math.floor((t % 128) / 8);
        s.setFrame(col * 48, row * 48, 48, 48);
    }

    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        set = null;
        if (!cfg()) return;
        set = this; tm = this._tilemap;
        top = new Sprite(); this.addChild(top);           // (over the night, Widok's veil and the weather: the windows' light)
        for (const k in free) free[k] = [];
        tileBmps = {};
        smokeBmp = ImageManager.loadSystem("Klimat_Dym"); glassBmp = ImageManager.loadSystem("Klimat_Okna");
        haloBmp = ImageManager.loadSystem("Klimat_Poswiata"); poolBmp = ImageManager.loadSystem("Klimat_Plama");
        const nl = this._nightLight, proto = nl && Object.getPrototypeOf(nl);
        if (proto && !proto._klimatOkna) {
            proto._klimatOkna = true;
            const upd = proto.update, lights = proto.lights;
            proto.update = function() { this._klimatNow = true; try { upd.call(this); } finally { this._klimatNow = false; } };
            proto.lights = function() { const out = lights.call(this); if (this._klimatNow && set && set._nightLight === this) windowHoles(out); return out; };
        }
        const p = placesNow();
        for (const c of p.chimneys) c.spr = null;
        for (const w of p.windows) w.lit = w.glass = w.halo_s = w.pool_s = w.covers = null;
        for (const b of birds) b.holder = b.sprite = null;
    };
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.call(this);
        if (set !== this || !cfg()) return;
        try { frame(); } catch (e) { if (!failed++) console.warn("[Klimat_Miasta] " + (e && e.message)); }
    };
    let failed = 0;

    // ------------------------------------------------------------------ one frame
    const view = () => {
        const tw = TILE(), th = $gameMap.tileHeight();
        return { tw, th, x0: $gameMap.displayX() - 2, y0: $gameMap.displayY() - 3, x1: $gameMap.displayX() + Graphics.width / tw + 2, y1: $gameMap.displayY() + Graphics.height / th + 4 };
    };
    const sx = (x, v) => Math.round($gameMap.adjustX(x) * v.tw), sy = (y, v) => Math.round($gameMap.adjustY(y) * v.th);
    function frame() {
        const p = placesNow(), v = view(), h = hour(), nt = night(), fc = Graphics.frameCount;
        smoke(p, v, h, fc);
        windowsLight(p, v, h, nt, fc);
        ravens(p, v, h, nt);
    }

    // ---- 1. smoke
    function smokeAlpha(c, h) {
        let a = h >= 5 && h < 9 ? 1 : h < 12 && h >= 9 ? 0.55 : h >= 12 && h < 16 ? [0.4, 0.15, 0.4, 0.75][season()] : h >= 16 && h < 21 ? 0.9 : h >= 21 ? 0.6 : 0.35;
        if (c.cold && h >= 10 && h < 16) a = 0;
        if (c.strong) a = Math.max(a, 0.85);
        if (c.fire) a = 0.55;
        return a * (raining() ? 0.7 : 1);
    }
    function smoke(p, v, h, fc) {
        const w = wind(), lean = 0.12 + 0.5 * w;
        for (const c of p.chimneys) {
            const on = c.x > v.x0 && c.x < v.x1 && c.y > v.y0 && c.y < v.y1 + 2;
            c.a += (smokeAlpha(c, h) - c.a) * 0.01;
            if (!on || c.a < 0.02) { if (c.spr) { give("smoke", c.spr); c.spr = null; } continue; }
            const s = c.spr || (c.spr = take("smoke", () => mk(tm, smokeBmp, 0.5, SMOKE_BASE / SMOKE_H, 0, 6)));
            s.visible = true;
            const f = Math.floor((fc + c.ph) / 9) % 8;
            s.setFrame(f * SMOKE_W, 0, SMOKE_W, SMOKE_H);
            s.x = sx(c.x, v); s.y = sy(c.y, v);
            const sway = Math.sin((fc + c.ph * 7) * 0.02) * 0.05;
            s.skew.x = -(lean + sway);
            s.scale.set(c.s * (c.strong ? 1.15 : 1), c.s * (1 - 0.3 * w) * (c.strong ? 1.15 : 1));
            s.opacity = Math.round(255 * Math.min(1, c.a * 1.1));
        }
    }

    // ---- 2. windows
    // near the hero the window is a hole in the night (Farming_Render's night layer: winLights, read in its update) - the lit tile in its
    // own colours, people in front of it cover it; farther off, where Widok's night veil hides the street, the panes glow over it (ADD),
    // as lit windows are seen from afar (gracz 2026-11-09: „gracz podchodzi, to część okna się zaciemnia” - the old way hid the glow)
    const NEAR = [3.5, 6.5];
    function windowHoles(out) {   // (made in the night layer's own update: the holes sit exactly on this frame's view)
        if (!places || places.data !== $dataMap || night() <= 0.02) return;
        const v = view(), fc = Graphics.frameCount;
        for (const w of places.windows) {
            if (w.v <= 0.01 || w.x < v.x0 || w.x > v.x1 || w.y < v.y0 || w.y > v.y1) continue;
            const fl = 0.9 + 0.06 * Math.sin(fc * 0.11 + w.x * 1.7) + 0.04 * Math.sin(fc * 0.29 + w.y * 2.3);
            out.push({ x: sx(w.x, v) + 24, y: sy(w.y, v) + 24, r: 30, i: Math.min(1, w.v * 1.05) * fl, id: 9000 + (w.x * 131 + w.y) % 900 });
        }
    }
    function wantLit(p, w, h, nt) {
        const hs = p.house[w.g], e = h < 12 ? h + 24 : h;
        if (nt >= hs.th + w.jit && h >= 12 && e < hs.off) return 1;
        if (nt >= hs.th + w.jit && h < 12 && hs.off >= 99) return 1;                // (the tavern: till the dawn)
        if (hs.early && h >= hs.early && h < 9 && nt > 0.3) return 1;
        return 0;
    }
    function windowsLight(p, v, h, nt, fc) {
        let any = false;
        const hx = $gamePlayer._realX, hy = $gamePlayer._realY;
        for (const w of p.windows) {
            w.v += (wantLit(p, w, h, nt) - w.v) * 0.06;
            const on = w.v > 0.01 && w.x > v.x0 && w.x < v.x1 && w.y > v.y0 && w.y < v.y1;
            if (!on) { if (w.lit || w.glass) dropWin(w); continue; }
            any = true;
            const fl = 0.9 + 0.06 * Math.sin(fc * 0.11 + w.x * 1.7) + 0.04 * Math.sin(fc * 0.29 + w.y * 2.3);   // (a candle behind the glass)
            const X = sx(w.x, v), Y = sy(w.y, v);
            if (w.tile) {   // the dark window turns into the lit one (the tileset's own picture), in the world: the night darkens it like the wall
                const s = w.lit || (w.lit = take("lit", () => mk(tm, null, 0, 0, 0, 0.5)));
                if (s.bitmap !== tileBitmap(w.tile)) s.bitmap = tileBitmap(w.tile);
                tileFrame(s, w.tile); s.z = 0.5; s.visible = true; s.x = X; s.y = Y; s.opacity = Math.round(255 * Math.min(1, w.v * 1.2));
                if (w.cover.length) {
                    w.covers = w.covers || w.cover.map(() => take("lit", () => mk(tm, null, 0, 0, 0, 0.6)));
                    w.cover.forEach((t, i) => { const c = w.covers[i]; c.z = 0.6; if (c.bitmap !== tileBitmap(t)) c.bitmap = tileBitmap(t); tileFrame(c, t); c.visible = true; c.x = X; c.y = Y; c.opacity = 255; });
                }
            }
            const glow = w.v * nt * fl, dist = Math.hypot(w.x - hx, w.y - hy), far = Math.min(1, Math.max(0, (dist - NEAR[0]) / (NEAR[1] - NEAR[0])));
            const g = w.glass || (w.glass = take("glass", () => mk(top, glassBmp, 0, 0, ADD)));
            g.visible = far > 0.01 && !w.cover.length; g.setFrame(w.atlas * 64, 0, 64, 64); g.x = X - 8; g.y = Y - 8;
            g.opacity = Math.round(255 * 0.8 * glow * far);
            if (w.halo) {
                const a = w.halo_s || (w.halo_s = take("halo", () => mk(top, haloBmp, 0.5, 0.5, ADD)));
                a.visible = true; a.x = X + 24; a.y = Y + 20; a.opacity = Math.round(255 * 0.26 * glow);
            }
            if (w.pool) {
                const a = w.pool_s || (w.pool_s = take("pool", () => mk(top, poolBmp, 0.5, 0.5, ADD)));
                a.visible = true; a.x = X + 24; a.y = sy(w.pool, v) + 26; a.opacity = Math.round(255 * 0.3 * glow);
            }
        }
        top.visible = any;
    }
    function dropWin(w) {
        give("lit", w.lit); give("glass", w.glass); give("halo", w.halo_s); give("pool", w.pool_s);
        if (w.covers) for (const c of w.covers) give("lit", c);
        w.lit = w.glass = w.halo_s = w.pool_s = w.covers = null;
    }

    // ---- 3. ravens (the Kruk sheet: KrukData.SHEET)
    const FLY = { speed: 0.075, fast: 0.13, flap: 4, takeoff: 5 };
    let birds = [], birdsMap = 0, birdsSys = null, flightT = 0;
    const SH = () => (window.KrukData && KrukData.SHEET) || { file: "Kruk", cell: 48, feet: 45, stand: [0, 0], caw: [0, [1, 2, 3, 4, 5, 6, 7, 8]],
        peck: [1, [0, 1, 2, 3, 4, 5, 6, 7, 8]], takeoff: [2, [0, 1, 2, 3, 4, 5, 6]], fly: [3, [0, 1, 2, 3, 4, 5, 6, 7]], glide: [3, 2], sleep: [6, [1, 2, 3, 4]] };
    function bird(x, y, z, state) {
        return { x, y, z, st: state || "sit", t: 0, facing: Math.random() < 0.5 ? 1 : -1, idle: Math.round(rand(60, 300)), anim: null, target: null,
            r: Math.random(), home: false, circ: null, nap: 0, holder: null, sprite: null };
    }
    function spawnBirds(p) {
        const c = cfg(); birds = []; birdsMap = $gameMap.mapId();
        const asleep = night() > 0.5 && (hour() >= 18 || hour() < 6);
        const pool = (asleep ? p.roost : p.perches).slice().sort(() => Math.random() - 0.5);
        for (let i = 0; i < c.ravens && pool.length; i++) { const q = pool[i % pool.length]; const b = bird(q.x + (i >= pool.length ? 0.3 : 0), q.y, 0); b.home = asleep; b.perch = q; birds.push(b); }
        const rc = c.tower && c.tower.length ? { x: c.tower[0][0], y: c.tower[0][1] } : p.roost.length ? p.roost[0] : { x: 110, y: 9 };
        for (let i = 0; i < c.circlers; i++) {
            const b = bird(rc.x, rc.y, 120, asleep ? "sit" : "circle");
            b.circ = { cx: rc.x + 1, cy: rc.y + 1, R: 3.2 + i * 1.6, a: rand(0, 6.28), w: (i % 2 ? -1 : 1) * rand(0.007, 0.011) };
            if (asleep) { b.z = 0; b.home = true; b.perch = p.roost[(i + 1) % p.roost.length]; b.x = b.perch.x; b.y = b.perch.y; }
            birds.push(b);
        }
    }
    function freePerch(list, b, far) {
        const taken = q => birds.some(o => o !== b && ((o.perch === q) || (o.target && o.target.q === q)));
        const ok = list.filter(q => !taken(q) && (!far || Math.hypot(q.x - b.x, q.y - b.y) >= far));
        return ok.length ? pick(ok) : null;
    }
    function flyTo(b, q, cruise) {
        b.target = { x: q.x, y: q.y, q }; b.perch = null; b.anim = null; b.nap = 0;
        if (b.st === "sit") { b.st = "takeoff"; b.t = 0; }
        else if (b.st !== "takeoff") b.st = "fly";
        b.cruise = cruise || Math.min(110, 50 + Math.hypot(q.x - b.x, q.y - b.y) * 5);
    }
    function caw(b, loud, v) {
        const sh = SH(); b.anim = { row: sh.caw[0], frames: sh.caw[1], i: 0, t: 0, speed: 6 };
        if (b.x > v.x0 + 2 && b.x < v.x1 - 2 && b.y > v.y0 + 3 && b.y < v.y1 - 4 && T.audio && T.audio.se) T.audio.se("Crow", { volume: loud ? 40 : 22, pitch: Math.round(rand(74, 90)) });
    }
    function stepBird(b, v, nt) {
        const sh = SH();
        b.t++;
        if (b.st === "takeoff") { if (b.target) b.facing = b.target.x > b.x ? 1 : -1; b.z += 0.6; if (b.t >= sh.takeoff[1].length * FLY.takeoff) { b.st = "fly"; b.t = 0; } return; }
        if (b.st === "land") { if (b.t >= sh.takeoff[1].length * FLY.takeoff) { b.st = "sit"; b.t = 0; b.idle = Math.round(rand(90, 300)); } return; }
        if (b.st === "circle") {
            const c = b.circ; c.a += c.w;
            const nx = c.cx + c.R * Math.cos(c.a), ny = c.cy + c.R * 0.55 * Math.sin(c.a);
            b.facing = nx > b.x ? 1 : -1; b.x = nx; b.y = ny; b.z += (78 + 10 * Math.sin(c.a * 2) - b.z) * 0.05;
            return;
        }
        if (b.st === "fly") {
            const tg = b.target; if (!tg) { b.st = "sit"; return; }
            const dx = tg.x - b.x, dy = tg.y - b.y, d = Math.hypot(dx, dy), step = Math.min(FLY.fast, FLY.speed + d * 0.004);
            if (Math.abs(dx) > 0.04) b.facing = dx > 0 ? 1 : -1;
            if (tg.circle) {   // back onto its round over the ravenry
                if (d > step) { b.x += dx / d * step; b.y += dy / d * step; b.z += (78 - b.z) * 0.04; return; }
                b.st = "circle"; b.target = null; return;
            }
            if (d > 2.2) b.z += (b.cruise - b.z) * 0.04; else b.z = b.z * Math.max(0, (d - step) / Math.max(d, 0.001));
            if (d > step) { b.x += dx / d * step; b.y += dy / d * step; return; }
            b.x = tg.x; b.y = tg.y; b.z = 0; b.perch = tg.q; b.target = null; b.st = "land"; b.t = 0;
            return;
        }
        // sitting
        if (b.anim) { const a = b.anim; if (++a.t >= a.speed) { a.t = 0; a.i++; } if (a.i >= a.frames.length) b.anim = null; return; }
        if (b.home && nt > 0.5) { if (b.nap < sh.sleep[1].length * 12) b.nap++; return; }
        b.nap = 0;
        if (--b.idle > 0) return;
        b.idle = Math.round(rand(140, 380));
        const r = Math.random();
        if (r < 0.28) caw(b, false, v);
        else if (r < 0.5) b.anim = { row: sh.peck[0], frames: sh.peck[1], i: 0, t: 0, speed: 5 };
        else b.facing = -b.facing;
    }
    function frameOf(b) {
        const sh = SH();
        if (b.st === "takeoff") return [sh.takeoff[0], sh.takeoff[1][Math.min(sh.takeoff[1].length - 1, Math.floor(b.t / FLY.takeoff))]];
        if (b.st === "land") return [sh.takeoff[0], sh.takeoff[1][Math.max(0, sh.takeoff[1].length - 1 - Math.floor(b.t / FLY.takeoff))]];
        if (b.st === "circle") return Math.floor(b.t / 200) % 3 ? sh.glide : [sh.fly[0], sh.fly[1][Math.floor(b.t / FLY.flap) % sh.fly[1].length]];
        if (b.st === "fly") return b.target && Math.hypot(b.target.x - b.x, b.target.y - b.y) < 1.4 ? sh.glide : [sh.fly[0], sh.fly[1][Math.floor(b.t / FLY.flap) % sh.fly[1].length]];
        if (b.anim) return [b.anim.row, b.anim.frames[Math.min(b.anim.i, b.anim.frames.length - 1)]];
        if (b.nap) return [sh.sleep[0], sh.sleep[1][Math.min(sh.sleep[1].length - 1, Math.floor(b.nap / 12))]];
        return sh.stand;
    }
    function drawBird(b, v) {
        const sh = SH(), on = b.x > v.x0 - 2 && b.x < v.x1 + 2 && b.y - b.z / 48 > v.y0 - 2 && b.y < v.y1 + 2;
        if (!on) { if (b.holder) b.holder.visible = false; return; }
        if (!b.holder || b.holder.parent !== tm) {
            const holder = new Sprite(), s = new Sprite(ImageManager.loadSystem(sh.file));
            s.anchor.set(0.5, sh.feet / sh.cell); holder.addChild(s); tm.addChild(holder); b.holder = holder; b.sprite = s;
        }
        const [row, col] = frameOf(b), s = b.sprite, hd = b.holder;
        hd.visible = true;
        s.setFrame(col * sh.cell, row * sh.cell, sh.cell, sh.cell); s.scale.x = b.facing;
        hd.x = sx(b.x, v); hd.y = sy(b.y, v); s.y = -Math.round(b.z);
        hd.z = b.st === "sit" || b.st === "land" || b.z < 26 ? 6 : 9;   // (perched up high: over the roofs and the crenels)
    }
    function ravens(p, v, h, nt) {
        if (birdsMap !== $gameMap.mapId() || birdsSys !== $gameSystem || !birds.length) { birdsSys = $gameSystem; spawnBirds(p); }
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.9, running = $gamePlayer.isDashing() && $gamePlayer.isMoving();
        const dusk = h >= 12 && nt > 0.25, dawn = h < 12 && nt < 0.4 && h >= 4;
        const wet = raining();
        for (const b of birds) {
            // the evening: to the ravenry, each at its own darkness; the morning: off again
            if (dusk && !b.home && nt > 0.25 + 0.35 * b.r && (b.st === "sit" || b.st === "circle")) {
                const q = freePerch(p.roost, b) || pick(p.roost); if (q) { b.home = true; if (b.st === "circle") b.st = "fly"; flyTo(b, q, 90); }
            } else if (dawn && b.home && nt < 0.38 - 0.3 * b.r && b.st === "sit") {
                b.home = false;
                if (b.circ && !wet) { b.st = "takeoff"; b.t = 0; b.perch = null; b.target = { x: b.circ.cx + b.circ.R, y: b.circ.cy, circle: true }; }
                else { const q = freePerch(p.perches, b); if (q) flyTo(b, q); }
            }
            // the hero comes near a perched raven: it takes off with a caw
            if (b.st === "sit" && !b.home && Math.hypot(b.x - px, b.y - py) < (running ? 4.2 : 2.6)) {
                const q = freePerch(p.perches, b, 10); if (q) { caw(b, true, v); flyTo(b, q); }
            }
            if (b.circ && b.st === "circle" && wet) { const q = freePerch(p.roost, b) || pick(p.roost); if (q) { b.st = "fly"; flyTo(b, q, 90); } }
            stepBird(b, v, nt);
            drawBird(b, v);
        }
        // now and then one flies to another roof (fewer in the rain, none at night)
        if (--flightT <= 0) {
            flightT = Math.round(rand(wet ? 600 : 220, wet ? 1400 : 560));
            if (nt < 0.25) {
                const sitting = birds.filter(b => b.st === "sit" && !b.home && !b.anim);
                if (sitting.length) { const b = pick(sitting), q = freePerch(p.perches.filter(q => Math.hypot(q.x - b.x, q.y - b.y) < 26), b, 4); if (q) { if (Math.random() < 0.5) caw(b, false, v); flyTo(b, q); } }
            }
        }
    }
    T.on("mapReady", () => { if (birdsMap !== $gameMap.mapId()) { birds = []; birdsMap = 0; } }, { owner: PLUGIN });

    window.KlimatMiasta = {
        info: () => { const p = cfg() ? placesNow() : null; return p ? { chimneys: p.chimneys.length, windows: p.windows.length, houses: Object.keys(p.house).length, perches: p.perches.length, roost: p.roost.length,
            smoking: p.chimneys.filter(c => c.spr && c.spr.visible).length, lit: p.windows.filter(w => w.v > 0.5).length, litOnScreen: p.windows.filter(w => w.glass && w.glass.visible).length,
            sprites: { smoke: p.chimneys.filter(c => c.spr).length, windows: p.windows.filter(w => w.glass).length } } : null; },
        birds: () => birds.map(b => ({ x: +b.x.toFixed(2), y: +b.y.toFixed(2), z: Math.round(b.z), st: b.st, home: b.home })),
        places: () => (cfg() ? placesNow() : null),   // (null off the town: Klimat_Pogoda asks on every map)
        reset: () => { birds = []; birdsMap = 0; if (places) for (const ch of places.chimneys) ch.a = 0; }   // (tests: new ravens at this hour)
    };
})();
