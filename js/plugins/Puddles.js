/*:
 * @target MZ
 * @plugindesc Kałuże po deszczu: 3-5 na mapę, w innych miejscach po każdym deszczu; rosną w deszczu, powoli wysychają, spod nich kopie się glinę. v1.1.0
 * @author Tawerna
 * @base Survival
 * @orderAfter Storm
 *
 * @help
 * KAŁUŻE
 *   Na mapach pod gołym niebem (notatka mapy <Weather:on>) po deszczu zbiera się woda w płytkich
 *   zagłębieniach - tam, gdzie pod spodem jest glina, która nie przepuszcza wody. Na mapę wypada ich
 *   od 3 do 5, w losowych miejscach, co najmniej 6 pól od siebie; tylko na gołej, naturalnej ziemi
 *   (trawa albo ziemia), z dala od drzew, skał, krzaków i innych zdarzeń.
 *   Miejsca losują się na nowo po każdym "mokrym okresie": od deszczu, który spadł na suchą ziemię,
 *   aż do chwili, gdy wszystko wyschnie. Deszcz na jeszcze mokrą ziemię dolewa wody do tych samych kałuż.
 *
 *   Ile wody stoi na ziemi, liczy się z planu pogody (Survival.js) z ostatnich czterech dni:
 *   - deszcz napełnia zagłębienia: zwykły w kilka godzin, ulewa szybciej;
 *   - po deszczu woda wysycha: za dnia szybciej niż nocą, latem najszybciej, jesienią wolniej;
 *   - płytkie zagłębienia wysychają pierwsze, głębokie trzymają wodę nawet do dwóch dni.
 *   Kałuża rośnie od środka zagłębienia i kurczy się do niego, gdy wysycha.
 *
 *   Wygląd: mętna woda z ciemnym brzegiem i pasem mokrej ziemi wokół, na wodzie jasne odbicie nieba,
 *   które lekko migocze. W deszczu na kałużach rozchodzą się kręgi od kropel. Na drodze i gołej ziemi
 *   woda jest bardziej brunatna, na trawie szarozielona.
 *
 *   Zbudowany budynek albo zaorana grządka na zagłębieniu - kałuży tam już nie ma. Zimą (śnieg) też nie.
 *   Po kałuży kroki chlupią (Atmosphere.js).
 *
 * GLINA
 *   Przy kałuży (przycisk akcji na polu z wodą, menu "Kałuża") jest "Wykop glinę" (Farming.js): łopata,
 *   jak zwykłe kopanie; daje 1-2 mokrej gliny. Z jednej kałuży - najwyżej 3 razy na mokry okres,
 *   potem gliny tam już nie ma (do następnego deszczu po wyschnięciu, gdy kałuże są gdzie indziej).
 *   Zapis gry pamięta tylko, ile razy kopano w której kałuży ($gameSystem._puddleClay).
 *
 * DLA INNYCH WTYCZEK (window.Puddles)
 *   level()        ile wody stoi teraz na ziemi tej mapy (0 = sucho, 1 = pełne zagłębienia; po długim deszczu trochę więcej)
 *   spell()        znak obecnego mokrego okresu (godzina zegara, gdy się zaczął) albo null, gdy sucho
 *   hollows()      kałuże tego mokrego okresu na tej mapie: [{ id, cx, cy, tiles: [[x, y]...], thr, kind }]
 *   candidates()   wszystkie miejsca, gdzie kałuża może się zebrać
 *   clayLeft(h), takeClay(h)   ile razy jeszcze można tu kopać glinę / jedno kopnięcie
 *   fillOf(h)      jak pełne jest zagłębienie teraz (0..1; 0 = nie ma kałuży)
 *   at(x, y)       kałuża na tym polu teraz: { hollow, fill } albo null
 *   wetAt(x, y)    true, gdy to pole stoi teraz w wodzie
 *   setLevel(v, spell)  testy: wymuś poziom wody i znak okresu (null = znów z pogody)
 */
(() => {
    "use strict";

    const TILE = 48;
    // ---- where: the map is cut into CELL x CELL squares, each a possible hollow (its place, size and shape from a hash of the square and
    // the map). Each wet spell (rain on dry ground ... dry again) picks PER_MAP of them, MIN_GAP tiles apart, from a hash of the spell -
    // new places after every such rain, and nothing but the clay dug goes into the save
    const CELL = 4, PER_MAP = [3, 5], MIN_GAP = 6;
    const CLAY_PER_PUDDLE = 3;                  // times clay can be dug out of one puddle in one wet spell
    // ---- how much water stands on the ground: worked out from the weather plan of the last days (Survival.weatherPlan)
    const LOOK_BACK = 96, STEP = 0.25;          // hours looked back; hours per step
    const FILL_PER_POWER_HOUR = 0.05;           // a steady rain (power 4) fills the hollows in about 5 hours
    const MAX_LEVEL = 1.25;                      // a long rain: a little over full - they then stay full a while after it
    const DRY_PER_HOUR = 0.022;                  // drying in spring by day; the sun and the season change it (dryRate)
    const LEVELS = 12;                           // pictures of one puddle, from a film of water to full

    const hash = (a, b, s) => Farming.hash2(a, b, s);
    const outdoors = () => !!(window.Survival && Survival.isOutdoors && Survival.isOutdoors());
    const winter = () => Farming.seasonIndex($gameSystem.dayNightDay()) === 3;

    // ------------------------------------------------------------------
    // The water level
    // ------------------------------------------------------------------
    function dryRate(day, hour) {
        const sun = hour >= 7 && hour < 19 ? 1.4 : 0.5;
        return DRY_PER_HOUR * sun * [1, 1.5, 0.8, 0.6][Farming.seasonIndex(day)];
    }
    let forced = null, forcedSpell = null, stateCache = { key: null, v: 0, spell: null };
    // the water on the ground now, and the wet spell it belongs to (the clock hour the rain on dry ground began; null when dry)
    function state() {
        if (forced !== null) return { v: forced, spell: forced > 0 ? forcedSpell : null };
        if (!(window.Survival && Survival.weatherPlan) || typeof $gameSystem.dayNightDay !== "function") return { v: 0, spell: null };
        const now = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
        const key = Math.floor(now * 12);   // (worked out again every 5 game minutes)
        if (stateCache.key === key) return stateCache;
        let v = 0, spell = null;
        for (let t = Math.max(24, now - LOOK_BACK); t < now; t += STEP) {
            const day = Math.floor(t / 24), h = t - day * 24, plan = Survival.weatherPlan(day);
            if (plan && plan.type === "rain" && h >= plan.start && h < plan.end) {
                if (v <= 0) spell = Math.floor(t);
                v = Math.min(MAX_LEVEL, v + FILL_PER_POWER_HOUR * (plan.power || 4) * STEP);
            } else {
                v = Math.max(0, v - dryRate(day, h) * STEP);
                if (v <= 0) spell = null;
            }
        }
        stateCache = { key, v, spell };
        return stateCache;
    }
    const level = () => state().v;
    const spell = () => state().spell;

    // ------------------------------------------------------------------
    // The hollows of a map
    // ------------------------------------------------------------------
    // a hollow is a few overlapping ellipses (lobes, in pixels from its middle); scale < 1 = the water shrunk towards the middle
    function inside(lobes, px, py, scale) {
        for (const l of lobes) {
            const dx = (px - l.x * scale) / (l.rx * scale), dy = (py - l.y * scale) / (l.ry * scale);
            if (dx * dx + dy * dy <= 1) return true;
        }
        return false;
    }
    const extentOf = lobes => Math.max(...lobes.map(l => Math.max(Math.abs(l.x) + l.rx, Math.abs(l.y) + l.ry)));
    function buildCandidates(mapId) {
        const W = $gameMap.width(), H = $gameMap.height(), out = [];
        for (let gy = 0; gy * CELL < H; gy++) for (let gx = 0; gx * CELL < W; gx++) {
            const a = gx + mapId * 131, b = gy + mapId * 71;
            const size = 0.55 + hash(a, b, 4103) * 1.0;   // about half its width, in tiles
            // the middle of the hollow is the middle of a tile: a puddle starts in one tile (the ground marker's) and spreads round it
            const cx = gx * CELL + 1 + Math.floor(hash(a, b, 4104) * (CELL - 2)) + 0.5, cy = gy * CELL + 1 + Math.floor(hash(a, b, 4105) * (CELL - 2)) + 0.5;
            const lobes = [], n = 2 + Math.floor(hash(a, b, 4106) * 3);
            for (let i = 0; i < n; i++) {
                const ang = hash(a, b, 4110 + i) * Math.PI * 2, dist = i === 0 ? 0 : (0.25 + hash(a, b, 4120 + i) * 0.45) * size;
                const r = size * (i === 0 ? 1 : 0.45 + hash(a, b, 4130 + i) * 0.4);
                // flatter than wide: the ground is seen from above at a slant, like everything on the map
                lobes.push({ x: Math.cos(ang) * dist * TILE, y: Math.sin(ang) * dist * TILE * 0.7, rx: r * TILE, ry: r * TILE * (0.55 + hash(a, b, 4140 + i) * 0.2) });
            }
            // the tiles it covers when full: every one of them bare natural ground
            const ext = extentOf(lobes) / TILE, tiles = [];
            let ok = true;
            for (let y = Math.floor(cy - ext) - 1; y <= Math.ceil(cy + ext) && ok; y++) {
                for (let x = Math.floor(cx - ext) - 1; x <= Math.ceil(cx + ext) && ok; x++) {
                    if (!inside(lobes, (x + 0.5 - cx) * TILE, (y + 0.5 - cy) * TILE, 1)) continue;
                    if (!$gameMap.isValid(x, y)) { ok = false; break; }
                    const g = Farming.groundInfoAt(x, y);
                    if (g === undefined) return null;   // (the tileset picture is still loading: asked again later)
                    if (!g || !g.kind || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length > 0 || Farming.hasObjectTile(x, y)) ok = false;
                    else if (Farming.gatherKindOf(x, y) === "bush") ok = false;   // (a berry bush grows there)
                    tiles.push([x, y]);
                }
            }
            if (!ok || !tiles.length) continue;
            const mid = Farming.groundInfoAt(Math.floor(cx), Math.floor(cy));
            out.push({ id: mapId + ":" + gx + "," + gy, cx, cy, size, lobes, tiles,
                thr: 0.1 + hash(a, b, 4107) * 0.25,   // how much water it takes to show: shallow hollows show last and dry first
                kind: mid && mid.kind === "earth" ? "earth" : "grass", phase: hash(a, b, 4108) * 6.28 });
        }
        return out;
    }
    let candidateCache = { map: -1, list: null };
    function candidates() {
        if (!$gameMap || !$dataMap) return [];
        const mapId = $gameMap.mapId();
        if (candidateCache.map === mapId && candidateCache.list) return candidateCache.list;
        if (!outdoors()) { candidateCache = { map: mapId, list: [] }; return candidateCache.list; }
        const list = buildCandidates(mapId);
        if (!list) return [];
        candidateCache = { map: mapId, list };
        return list;
    }
    // the puddles of this wet spell: 3-5 of the candidates, in an order drawn from the spell, each MIN_GAP from the others
    let hollowCache = { key: "", list: [] };
    function hollows() {
        const sp = spell(), all = candidates();
        if (sp === null || !all.length) return [];
        const mapId = $gameMap.mapId(), key = mapId + ":" + sp + ":" + all.length;
        if (hollowCache.key === key) return hollowCache.list;
        const want = PER_MAP[0] + Math.floor(hash(sp, mapId, 4201) * (PER_MAP[1] - PER_MAP[0] + 1));
        const order = all.map((h, i) => ({ h, r: hash(sp + i * 7, mapId, 4202) })).sort((a, b) => a.r - b.r).map(o => o.h);
        const list = [];
        for (const h of order) {
            if (list.length >= want) break;
            if (list.every(o => Math.hypot(o.cx - h.cx, o.cy - h.cy) >= MIN_GAP)) list.push(h);
        }
        hollowCache = { key, list };
        return list;
    }
    function fillOf(h) {
        if (winter()) return 0;
        // built on, or worked ground (raked, tilled, sown - not the bare "natural" ground every free tile counts as)
        if (h.tiles.some(([x, y]) => { const p = Farming.plotAt(x, y); return Farming.buildingAt(x, y) || (p && !p.natural); })) return 0;
        const v = level();
        return v <= h.thr ? 0 : Math.min(1, (v - h.thr) / (1 - h.thr));
    }
    const stepOf = fill => (fill > 0 ? Math.max(1, Math.ceil(fill * LEVELS)) : 0);
    const scaleOf = step => 0.3 + 0.7 * step / LEVELS;
    function at(x, y) {
        for (const h of hollows()) {
            if (!h.tiles.some(t => t[0] === x && t[1] === y)) continue;
            const fill = fillOf(h), step = stepOf(fill);
            if (step && inside(h.lobes, (x + 0.5 - h.cx) * TILE, (y + 0.5 - h.cy) * TILE, scaleOf(step))) return { hollow: h, fill };
        }
        return null;
    }
    const wetAt = (x, y) => !!at(x, y);
    function clayRecord(h, create) {
        const all = $gameSystem._puddleClay || (create ? ($gameSystem._puddleClay = {}) : null);
        if (!all) return null;
        const mapId = $gameMap.mapId(), m = all[mapId] || (create ? (all[mapId] = {}) : null);
        if (!m) return null;
        let r = m[h.id];
        if (r && r.spell !== spell()) { if (!create) return null; r = null; }
        if (!r && create) {
            for (const id of Object.keys(m)) if (m[id].spell !== spell()) delete m[id];   // (the old spells' records: gone)
            r = m[h.id] = { spell: spell(), n: 0 };
        }
        return r;
    }
    const clayLeft = h => Math.max(0, CLAY_PER_PUDDLE - ((clayRecord(h, false) || {}).n || 0));
    function takeClay(h) {
        const r = clayRecord(h, true);
        r.n++;
        return clayLeft(h);
    }

    // ------------------------------------------------------------------
    // Pictures: pixel by pixel, one per hollow and step (made when first needed)
    // ------------------------------------------------------------------
    // the water, from the dark near bank to the light far side where the sky shows in it; in-between shades are dithered (a pixel pattern,
    // no smooth blend - like the tiles); the shore is ragged (value noise on the outline), with wet mud and darker wet ground round it
    const PALETTES = {
        grass: { water: [[60, 80, 86], [74, 97, 104], [92, 117, 124], [114, 139, 146], [142, 166, 172]], mud: [[62, 52, 38], [88, 76, 56]],
            halo: [22, 34, 18], sky: [200, 218, 222], spark: [240, 248, 248] },
        earth: { water: [[80, 76, 62], [96, 92, 76], [114, 110, 92], [136, 132, 114], [160, 158, 140]], mud: [[72, 58, 40], [98, 82, 60]],
            halo: [46, 34, 20], sky: [204, 210, 206], spark: [244, 246, 240] }
    };
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const dithered = (pal, t, x, y) => {
        const f = Math.max(0, Math.min(1, t)) * (pal.length - 1), i = Math.floor(f);
        return pal[Math.min(pal.length - 1, f - i > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? i + 1 : i)];
    };
    // smooth noise 0..1 over a grid of `cell` pixels (for the ragged shore)
    function valueNoise(seed, x, y, cell) {
        const gx = Math.floor(x / cell), gy = Math.floor(y / cell), fx = x / cell - gx, fy = y / cell - gy;
        const n = (i, j) => hash(gx + i + seed * 7, gy + j, 4160);
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        return (n(0, 0) * (1 - sx) + n(1, 0) * sx) * (1 - sy) + (n(0, 1) * (1 - sx) + n(1, 1) * sx) * sy;
    }
    const pictureCache = new Map();
    function pictureOf(h, step) {
        const key = h.id + "|" + step;
        if (pictureCache.has(key)) return pictureCache.get(key);
        const sc = scaleOf(step), ext = extentOf(h.lobes) * sc * 1.15 + 5;
        const w = Math.ceil(ext * 2) + 2, ht = Math.ceil(ext * 2) + 2, ox = w / 2, oy = ht / 2;
        const seed = Math.floor(h.phase * 1000);
        const inMask = new Uint8Array(w * ht);
        for (let y = 0; y < ht; y++) for (let x = 0; x < w; x++) {
            // the nearest lobe's "how far out" (1 = on its ellipse), pushed in and out by the noise: a ragged, natural shore
            let v = Infinity;
            for (const l of h.lobes) {
                const dx = (x + 0.5 - ox - l.x * sc) / (l.rx * sc), dy = (y + 0.5 - oy - l.y * sc) / (l.ry * sc);
                v = Math.min(v, dx * dx + dy * dy);
            }
            inMask[y * w + x] = v <= 1 + (valueNoise(seed, x, y, 5) - 0.5) * 0.45 ? 1 : 0;
        }
        const isIn = (x, y) => x >= 0 && y >= 0 && x < w && y < ht && inMask[y * w + x] === 1;
        // how far a pixel is from the shore (inside: 1 = the shore itself; outside: 1 = next to the water)
        const dist = (x, y, want) => {
            for (let r = 1; r <= 3; r++) {
                for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && isIn(x + dx, y + dy) === want) return r;
                }
            }
            return 4;
        };
        let top = ht, bottom = 0;
        for (let y = 0; y < ht; y++) for (let x = 0; x < w; x++) if (inMask[y * w + x]) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
        const span = Math.max(1, bottom - top);
        const pal = PALETTES[h.kind] || PALETTES.grass;
        const water = new Bitmap(w, ht), sky = new Bitmap(w, ht);
        const img = water.context.createImageData(w, ht), skyImg = sky.context.createImageData(w, ht);
        const put = (data, x, y, col, a) => { const i = (y * w + x) * 4; data[i] = col[0]; data[i + 1] = col[1]; data[i + 2] = col[2]; data[i + 3] = Math.round(a * 255); };
        for (let y = 0; y < ht; y++) for (let x = 0; x < w; x++) {
            if (!isIn(x, y)) {
                const d = dist(x, y, true);
                if (d === 1) put(img.data, x, y, pal.halo, 0.4);   // wet ground right by the water
                else if (d === 2 && BAYER[(y & 3) * 4 + (x & 3)] < 8) put(img.data, x, y, pal.halo, 0.26);
                continue;
            }
            const d = dist(x, y, false);
            const bankBelow = !isIn(x, y + 1) || !isIn(x, y + 2), bankAbove = !isIn(x, y - 1) || !isIn(x, y - 2);
            if (d === 1) {   // the shore: wet mud, a little lighter on the far side where the light falls on it
                put(img.data, x, y, bankAbove ? pal.mud[1] : pal.mud[0], 0.95);
                continue;
            }
            // light far side, dark near side (the bank's shade), a little noise so it is not a clean gradient
            let t = 1 - (y - top) / span;
            t = 0.22 + t * 0.7 + (valueNoise(seed + 3, x, y, 4) - 0.5) * 0.16;
            if (bankBelow) t -= 0.3;
            if (bankAbove) t += 0.2;
            put(img.data, x, y, dithered(pal.water, t, x, y), 0.94);
        }
        // the sky: a few short light strokes on the upper half of the water, and a sparkle
        const strokes = 3 + Math.floor(hash(seed, step, 4170) * 3);
        for (let k = 0; k < strokes; k++) {
            const sy = Math.round(top + span * (0.15 + hash(seed + k, step, 4171) * 0.35));
            const sx = Math.round(ox + (hash(seed + k, step, 4172) - 0.6) * ext);
            const len = 3 + Math.floor(hash(seed + k, step, 4173) * 6);
            for (let i = 0; i < len; i++) if (isIn(sx + i, sy) && dist(sx + i, sy, false) >= 2) put(skyImg.data, sx + i, sy, pal.sky, i === 0 || i === len - 1 ? 0.45 : 0.8);
        }
        const px = Math.round(ox - ext * 0.25 + hash(seed, step, 4174) * ext * 0.2), py = Math.round(top + span * 0.25);
        if (isIn(px, py) && dist(px, py, false) >= 2) put(skyImg.data, px, py, pal.spark, 1);
        water.context.putImageData(img, 0, 0);
        sky.context.putImageData(skyImg, 0, 0);
        for (const b of [water, sky]) if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        const pic = { water, sky, ox, oy };
        pictureCache.set(key, pic);
        return pic;
    }
    // rain rings: one small ring per radius, shared by every puddle
    let ringCache = null;
    function rings() {
        if (ringCache) return ringCache;
        ringCache = [];
        for (let r = 1; r <= 5; r++) {
            const s = r * 2 + 3, b = new Bitmap(s, s), ctx = b.context;
            ctx.fillStyle = "rgba(206,224,230,0.9)";
            const m = s / 2;
            for (let a = 0; a < 64; a++) {
                const x = Math.round(m - 0.5 + Math.cos(a / 64 * Math.PI * 2) * r), y = Math.round(m - 0.5 + Math.sin(a / 64 * Math.PI * 2) * r * 0.6);
                ctx.fillRect(x, y, 1, 1);
            }
            if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
            ringCache.push(b);
        }
        return ringCache;
    }

    // ------------------------------------------------------------------
    // The layer on the map
    // ------------------------------------------------------------------
    function Sprite_Puddles() {
        this.initialize(...arguments);
    }
    Sprite_Puddles.prototype = Object.create(Sprite.prototype);
    Sprite_Puddles.prototype.constructor = Sprite_Puddles;

    Sprite_Puddles.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 1.2;   // over the ground tiles and the farm layer (soil, z 1), under the stones and herbs lying about (1.5) and the characters
        this._items = new Map();   // hollow id -> { h, step, water: Sprite, sky: Sprite }
        this._ripples = [];
        this._t = 0;
        this._mapId = -1;
    };
    Sprite_Puddles.prototype.clearAll = function() {
        for (const it of this._items.values()) { this.removeChild(it.water); this.removeChild(it.sky); }
        for (const r of this._ripples) this.removeChild(r.sprite);
        this._items.clear();
        this._ripples = [];
    };
    Sprite_Puddles.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._t++;
        if ($gameMap.mapId() !== this._mapId) { this.clearAll(); this._mapId = $gameMap.mapId(); this._t = 1; }
        if (this._t % 20 === 1) this.refresh();   // the water level moves slowly: a few times a second is plenty
        this.place();
        this.updateRipples();
    };
    Sprite_Puddles.prototype.refresh = function() {
        const seen = new Set();
        for (const h of hollows()) {
            const step = stepOf(fillOf(h));
            if (!step) continue;
            seen.add(h.id);
            let it = this._items.get(h.id);
            if (!it) {
                it = { h, step: 0, water: new Sprite(), sky: new Sprite() };
                it.water.anchor.set(0.5, 0.5);
                it.sky.anchor.set(0.5, 0.5);
                this.addChild(it.water);
                this.addChild(it.sky);
                this._items.set(h.id, it);
            }
            if (it.step !== step) {
                const pic = pictureOf(h, step);
                it.water.bitmap = pic.water;
                it.sky.bitmap = pic.sky;
                it.step = step;
            }
        }
        for (const [id, it] of this._items) {
            if (seen.has(id)) continue;
            this.removeChild(it.water);
            this.removeChild(it.sky);
            this._items.delete(id);
        }
    };
    Sprite_Puddles.prototype.place = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), W = Graphics.width, H = Graphics.height;
        for (const it of this._items.values()) {
            const x = Math.round($gameMap.adjustX(it.h.cx) * tw), y = Math.round($gameMap.adjustY(it.h.cy) * th);
            const r = (it.water.bitmap ? it.water.bitmap.width : 0) / 2 + 8;
            const on = x > -r && y > -r && x < W + r && y < H + r;
            it.water.visible = it.sky.visible = on;
            it.water.x = it.sky.x = x;
            it.water.y = it.sky.y = y;
            it.sky.opacity = 170 + Math.round(70 * Math.sin(this._t * 0.035 + it.h.phase));   // the sky flickers a little on the water
        }
    };
    Sprite_Puddles.prototype.updateRipples = function() {
        // new rings while it rains here
        const w = outdoors() && Survival.currentWeather && Survival.currentWeather();
        if (w && w.type === "rain" && this._ripples.length < 40) {
            for (const it of this._items.values()) {
                if (!it.water.visible || it.step < 3) continue;
                const sc = scaleOf(it.step);
                if (Math.random() > 0.05 * sc * it.h.size * (w.power || 4) / 4) continue;
                const ext = extentOf(it.h.lobes) * sc;
                for (let tries = 0; tries < 6; tries++) {
                    const px = (Math.random() * 2 - 1) * ext, py = (Math.random() * 2 - 1) * ext;
                    if (!inside(it.h.lobes, px, py, sc * 0.8)) continue;
                    const s = new Sprite(rings()[0]);
                    s.anchor.set(0.5, 0.5);
                    this.addChild(s);
                    this._ripples.push({ sprite: s, it, px, py, age: 0 });
                    break;
                }
            }
        }
        for (let i = this._ripples.length - 1; i >= 0; i--) {
            const r = this._ripples[i];
            r.age++;
            if (r.age > 24 || !this._items.has(r.it.h.id)) { this.removeChild(r.sprite); this._ripples.splice(i, 1); continue; }
            r.sprite.bitmap = rings()[Math.min(4, Math.floor(r.age / 5))];
            r.sprite.opacity = 255 - r.age * 10;
            r.sprite.x = r.it.water.x + Math.round(r.px);
            r.sprite.y = r.it.water.y + Math.round(r.py);
            r.sprite.visible = r.it.water.visible;
        }
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._puddles = new Sprite_Puddles();
        this._tilemap.addChild(this._puddles);
    };

    window.Puddles = {
        level, spell, hollows, candidates, fillOf, at, wetAt, clayLeft, takeClay, CLAY_PER_PUDDLE, PER_MAP,
        setLevel: (v, sp) => { forced = v === null || v === undefined ? null : Number(v); forcedSpell = sp === undefined ? 1 : sp; },
        Sprite_Puddles
    };
})();
