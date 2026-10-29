//=============================================================================
// Wrak.js
//=============================================================================
// PAKIET E (docs/miejsca_wyspy/PAKIETY.md, koncepcja docs/miejsca_wyspy/KONCEPCJA.md punkt 7): the wreck on the shoal and the
// castaway in the tavern. The data: Wrak_Data.js (the resident 948 "rozbitek", the tables; the thread "wrak" of the engine Watki.js:
// the state, D25 and W12 with their steps, talks and actions - here the hooks they name). This engine:
//   - the TIDE on the package's maps (Wyspa.tide(): two low waters a day, ~50 min later each day): the sandbar's rings and the
//     lower hold are regions (WrakData.FLOOD) - a cell is under water from its level up: drawn as water over the tiles (a soft
//     layer in the tilemap, the sea's colour - red or grey with CzerwonaWoda's phase), closed to walking (Game_Map.checkPassage),
//     the hero on a cell the water takes is pushed onto the nearest dry one; a warning before the low water ends
//   - the ways there: Janek's boat (a choice in Janek's talk at the harbour, Tawerna.talk.takeover - Przystan.js unchanged:
//     "Nie, w innej sprawie" gives his own talk), by day, no storm, after K47 (also after D25 - the coordinator, 2026-10-16); he waits two hours at the wreck (events 670/671);
//     on foot over the sandbar from the garrison at low water (the map's own edge events; the garrison's side is package D's)
//   - the garrison's men with their rescue boat at the wreck 9-15 (672-674): without the pass (flag glejtWrak, package D) they
//     catch the hero - a fine and the garrison's favour down (Garnizon.addFavor if package D has it; the bus "wrakGarnizon")
//   - under the deck (Map166): rats (Creatures.spawn "szczur"), the boatswain's key in the lowest corner (dry only near low
//     water), the captain's cabin: the chart (item 178 "Mapa z zaznaczeniami"), the ship's log (flags dziennikOkretu,
//     kronikaKarta4), the coins with the eye, five raven stones
//   - the chart's seven white eyes: the journal's tracker (Journal.addTrackerSource - the compass points at the next one not
//     visited) and a note; a place of another package only once it is built (Wyspa.isReady)
//   - the castaway "Eryk Sowa" (really Ansgar Wiel): the first meeting, portraits for two groszy, W12's five clues (the log, Józek
//     Łata in Podgrodzie - a talk hook, the lighthouse's vision - flag mgla, the sleeve at the well at night, the raven's letter -
//     flag krukTame), the talk in private: give him to the garrison / keep his secret / help him flee on Roch's cutter / the false
//     map for Baltazar (a night raid may follow); flags ansgarGiven, ansgarAlly, ansgarFled
//   - Wyspa.ready(165) once the real map is in data/ (not the package-0 skeleton)
// Ids 670-679 (Tawerna.inject, owner "Wrak"). No water for the hero anywhere here (the drought): the sea is salt (<Water:salt>).

/*:
 * @target MZ
 * @plugindesc [pakiet E] Wrak na mieliźnie (mapy 165, 166): pływy na łasze i w ładowni, łódź Janka, żołnierze garnizonu, mapa z zaznaczeniami; rozbitek Eryk Sowa (W12). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Wrak_Data
 * @orderAfter Wyspa
 * @orderAfter TownQuests
 * @orderAfter Przystan
 *
 * @help
 * ============================================================================
 * Wrak.js - wrak na mieliźnie i rozbitek w tawernie (pakiet E)
 * ============================================================================
 * Mapa 165 „Wrak na mieliźnie”: łacha w zatoce z rozbitym okrętem Czarnych
 * Oczu. Pływy: w przypływie pierścienie piachu (regiony 61-63) są pod wodą,
 * łacha do garnizonu tylko w odpływie (przełącznik 20). Mapa 166 „Wrak - pod
 * pokładem”: dolna ładownia (regiony 64-65) zalana poza niską wodą.
 * Dojście: łodzią Janka (rozmowa na przystani, za dnia) albo po łasze od
 * garnizonu w odpływie. Żołnierze z łodzi ratowniczej (9-15) karzą bez glejtu.
 * Rozbitek „Eryk Sowa” (W12): poszlaki i rozmowa w cztery oczy.
 * Zdarzenia 670-679. W skryptach: Wrak.act(this, [co]), Wrak.talk(this, kto),
 * Wrak.state(), Wrak.floodedAt(x, y), Wrak.clues().
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("wrak");   // (the words of this file: js/teksty/wrak.txt, kod.*)

    const T = window.Tawerna;
    if (!T) throw new Error("Wrak.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.WrakData;
    if (!D || !D.FLOOD) throw new Error("Wrak.js: brak Wrak_Data.js - musi stać nad TownLife na liście wtyczek (the package's data is missing)");
    const PLUGIN = "Wrak";
    // the thread (Wrak_Data.js, the engine Watki.js): the state "wrak", D25 / W12 with their talks and actions, the flags
    const w = Watki.get("wrak");
    if (!w) throw new Error("Wrak.js: brak wątku „wrak” (Wrak_Data.js / Watki.js)");
    const MAP = D.MAP, UNDER = D.UNDER, HARBOUR = 125, TOWN = 8, TAVERN = 1, PODGRODZIE = 111;
    const IDS = D.IDS;
    const COIN_ICON = 314;
    const { HERO, C, choiceTo } = Watki.mowa;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const now = () => day() * 24 + hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const WY = () => T.api("Wyspa") || window.Wyspa || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // ------------------------------------------------------------------
    // The state (the save): the thread's (Wrak_Data.js); TownQuests' flags and things through the thread
    // ------------------------------------------------------------------
    const S = () => w.S();
    const flags = () => w.flags();
    const flag = k => w.flag(k);
    // a flag, then the quests' markers (no checks: the callers ask them when they need)
    function setFlag(k) {
        w.setFlag(k);
        const q = TQ();
        if (q && q.refreshMarkers) q.refreshMarkers();
    }
    const vcount = k => w.vcount(k);
    const vgive = (k, n) => w.vgive(k, n);
    const vtake = (k, n) => w.vtake(k, n);
    const rec = id => w.rec(id);
    const isDone = id => { const r = rec(id); return !!r && r.s === "done"; };
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const autoChecks = () => w.autoChecks();   // (the quests' checks, then the markers)
    const vname = k => { const V = window.TownQuestsData && TownQuestsData.VITEMS; return V && V[k] ? V[k].name : k; };
    const vicon = k => { const V = window.TownQuestsData && TownQuestsData.VITEMS; return V && V[k] ? V[k].icon : 0; };
    const raining = () => { const w = $gameScreen.weatherType(); return (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0; };
    const storming = () => $gameScreen.weatherType() === "storm" && $gameScreen.weatherPower() > 0;
    const inHours = (h, hrs) => h >= hrs[0] && h < hrs[1];
    const hhmm = h => { const t = ((h % 24) + 24) % 24, hh = Math.floor(t), mm = Math.round((t - hh) * 60 / 10) * 10; return hh + ":" + (mm >= 60 ? "50" : (mm < 10 ? "0" : "") + mm); };

    // ------------------------------------------------------------------
    // The real map is in data/ (not the skeleton of package 0): then the way in may open (Wyspa.ready)
    // ------------------------------------------------------------------
    let built = null;
    (function checkBuilt() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(MAP).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                let ok = false;
                try { const m = JSON.parse(xhr.responseText); ok = !!m && !/<Wyspa:szkielet>/i.test(m.note || "") && Array.isArray(m.events) && m.events.length > 5; } catch (e) { ok = false; }
                built = ok;
                const W = WY();
                if (ok && W && W.ready) W.ready(MAP);
            };
            xhr.onerror = () => { built = false; };
            xhr.send();
        } catch (e) { built = false; }
    })();
    const isBuilt = () => built === true;

    // ------------------------------------------------------------------
    // THE TIDE: the level now, which cells are under water
    // ------------------------------------------------------------------
    const LOW = (window.WyspaData && WyspaData.TIDE && WyspaData.TIDE.low) || 0.15;
    function tideNow(d, h) {
        const W = WY();
        if (W && W.tide) return W.tide(d, h);
        return { level: 0.5, low: false, nextLow: 6, nextHigh: 6 };
    }
    const thresholdOf = (mapId, region) => {
        const f = D.FLOOD[mapId];
        if (!f || f[region] === undefined) return null;
        return f[region] === "low" ? LOW : Number(f[region]);
    };
    // the map's cells' thresholds (built once per map), the level (once a frame)
    let grid = null, levelNow = 0, levelAt = -1;
    function gridOf() {
        if (!has() || !D.FLOOD[$gameMap.mapId()]) return null;
        if (grid && grid.map === $gameMap.mapId() && grid.data === $dataMap) return grid;
        const W = $gameMap.width(), H = $gameMap.height(), th = new Float32Array(W * H).fill(-1);
        let any = false;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const t = thresholdOf($gameMap.mapId(), $gameMap.regionId(x, y));
            if (t !== null) { th[y * W + x] = t; any = true; }
        }
        grid = { map: $gameMap.mapId(), data: $dataMap, W, H, th, any };
        return grid;
    }
    function level() {
        if (Graphics.frameCount !== levelAt) { levelAt = Graphics.frameCount; levelNow = tideNow().level; }
        return levelNow;
    }
    function floodedAt(x, y) {
        const g = gridOf();
        if (!g || !g.any || x < 0 || y < 0 || x >= g.W || y >= g.H) return false;
        const t = g.th[y * g.W + x];
        return t >= 0 && level() >= t;
    }
    // hours from now till the low water ends (the level rises over LOW) - for the warning
    function lowLeft() {
        const t = tideNow();
        if (!t.low) return 0;
        for (let dt = 0.05; dt < 4; dt += 0.05) {
            const hh = hour() + dt, dd = day() + Math.floor(hh / 24);
            if (!tideNow(dd, hh % 24).low) return dt;
        }
        return 4;
    }
    // the next low water's middle (hours from now -> clock)
    function nextLowClock() { const t = tideNow(); return hhmm(hour() + (t.low ? 0 : t.nextLow)); }

    // closed to walking while under water
    const _Game_Map_checkPassage = Game_Map.prototype.checkPassage;
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        if (this === window.$gameMap && D.FLOOD[this._mapId] && floodedAt(x, y)) return false;
        return _Game_Map_checkPassage.call(this, x, y, bit);
    };

    // the hero on a cell the water takes: onto the nearest dry one
    function rescueHero() {
        if (!has() || !D.FLOOD[$gameMap.mapId()] || $gamePlayer.isTransferring()) return false;
        const px = $gamePlayer.x, py = $gamePlayer.y;
        if (!floodedAt(px, py)) return false;
        const seen = new Set([px + "," + py]), q = [[px, py]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
                const nx = x + dx, ny = y + dy, k = nx + "," + ny;
                if (seen.has(k) || !$gameMap.isValid(nx, ny)) continue;
                seen.add(k);
                if (Math.abs(nx - px) > 8 || Math.abs(ny - py) > 8) continue;
                const dry = !floodedAt(nx, ny), ok = dry && [2, 4, 6, 8].some(d => _Game_Map_checkPassage.call($gameMap, nx, ny, 1 << (d / 2 - 1)))
                    && !$gameMap.eventsXyNt(nx, ny).some(e => e.isNormalPriority());
                if (ok) {
                    $gamePlayer.locate(nx, ny);
                    T.popup($gameMap.mapId() === UNDER ? TK.kod.rescueHero[0] : TK.kod.rescueHero[1], { color: "#9fd4ff" });
                    AudioManager.playSe({ name: "Water1", volume: 60, pitch: 90, pan: 0 });
                    return true;
                }
                q.push([nx, ny]);
            }
        }
        return false;
    }

    // ------------------------------------------------------------------
    // The water drawn over the flooded cells, in the tilemap (z 0.6: over the ground and CzerwonaWoda's tint, under the characters):
    // the real sea's texture (tileset 11's A1 "sea on a sandy shore", its full-water tile, animated with the tilemap's frames)
    // under a soft mask of the flooded cells (low resolution, smoothed: the edge runs at the cells' borders), the colour of the
    // sea now on top (CzerwonaWoda's red or grey phase - the shore water is that colour; the hold's water dark and murky), and a
    // light line of foam at the edge. The mask is rebuilt when the level moves.
    // ------------------------------------------------------------------
    const S_TEX = 8;
    const RED_RGB = [138, 44, 28], GREY_RGB = [126, 113, 86], BILGE_RGB = [40, 46, 34];
    const WATER_TS = 11, WATER_KIND = 10;
    // the tint over the texture: { rgb, a, foam } - the red phase's shore water; the hold: murky
    function tintOf(mapId) {
        const RW = T.api("CzerwonaWoda");
        let ph = null;
        try { ph = RW && RW.phase ? RW.phase() : null; } catch (e) { ph = null; }
        if (mapId === UNDER) return { rgb: BILGE_RGB, a: 0.42, foam: [168, 168, 146] };
        if (!ph) return { rgb: [64, 132, 142], a: 0, foam: [214, 226, 222] };
        if (ph.grey) return { rgb: GREY_RGB, a: 0.6, foam: [190, 182, 160] };
        return { rgb: RED_RGB, a: 0.45 + 0.25 * (ph.red || 0), foam: [226, 170, 140] };
    }
    // the full-water tile of tileset 11's A1 kind 10, three frames (as Tilemap._addAutotile cuts it: shape 0's quarters)
    let waterCache = null;
    function waterFrames() {
        if (waterCache && waterCache.ok) return waterCache.frames;
        const ts = window.$dataTilesets && $dataTilesets[WATER_TS];
        if (!ts || !ts.tilesetNames[0]) return null;
        const src = ImageManager.loadTileset(ts.tilesetNames[0]);
        if (!src.isReady()) return null;
        const tx = WATER_KIND % 8, ty = Math.floor(WATER_KIND / 8), by = ty * 6 + (Math.floor(tx / 2) % 2) * 3;
        const Q = Tilemap.FLOOR_AUTOTILE_TABLE[0], frames = [];
        for (let f = 0; f < 3; f++) {
            const bx = Math.floor(tx / 4) * 8 + f * 2, t = new Bitmap(48, 48);
            Q.forEach(([qx, qy], i) => t.blt(src, (bx * 2 + qx) * 24, (by * 2 + qy) * 24, 24, 24, (i % 2) * 24, Math.floor(i / 2) * 24));
            frames.push(t);
        }
        waterCache = { ok: true, frames };
        return frames;
    }
    // the mask (white, alpha = how much water) and the foam (the edge band), S_TEX texels a cell, smoothed when drawn
    function floodBitmaps(g, lv, mapId) {
        const W = g.W, H = g.H, val = new Float32Array(W * H), tidal = new Uint8Array(W * H), sea = new Uint8Array(W * H);
        const realWater = (x, y) => { for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; } return false; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x, t = g.th[i];
            if (t >= 0) { tidal[i] = 1; val[i] = clamp((lv - t) / 0.05 + 0.5, 0, 1); }
            else if (mapId === MAP && realWater(x, y)) { val[i] = 1; sea[i] = 1; }
        }
        const draw = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!tidal[y * W + x]) continue;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < W && ny < H) draw[ny * W + nx] = 1;
            }
        }
        const at = (x, y) => val[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)];
        const foamRgb = tintOf(mapId).foam;
        const mask = new Bitmap(W * S_TEX, H * S_TEX), foam = new Bitmap(W * S_TEX, H * S_TEX);
        const mi = mask.context.createImageData(W * S_TEX, H * S_TEX), fi = foam.context.createImageData(W * S_TEX, H * S_TEX);
        let n = 0;
        for (let py = 0; py < H * S_TEX; py++) {
            const cy = (py + 0.5) / S_TEX - 0.5, y0 = Math.floor(cy), fy = cy - y0, cellY = Math.floor(py / S_TEX);
            for (let px = 0; px < W * S_TEX; px++) {
                const ci = cellY * W + Math.floor(px / S_TEX);
                if (!draw[ci] || sea[ci]) continue;   // (the real sea: its own tiles)
                const cx = (px + 0.5) / S_TEX - 0.5, x0 = Math.floor(cx), fx = cx - x0;
                const v = (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
                if (v <= 0.3) continue;
                const p = (py * W * S_TEX + px) * 4, w = clamp((v - 0.38) / 0.24, 0, 1), edge = clamp(1 - Math.abs(v - 0.5) / 0.1, 0, 1);
                if (w > 0) { mi.data[p] = mi.data[p + 1] = mi.data[p + 2] = 255; mi.data[p + 3] = Math.round(255 * w); n++; }
                if (edge > 0) { fi.data[p] = foamRgb[0]; fi.data[p + 1] = foamRgb[1]; fi.data[p + 2] = foamRgb[2]; fi.data[p + 3] = Math.round(150 * edge); }
            }
        }
        mask.context.putImageData(mi, 0, 0);
        foam.context.putImageData(fi, 0, 0);
        for (const b of [mask, foam]) { b.smooth = true; if (b._baseTexture && b._baseTexture.update) b._baseTexture.update(); }
        mask._wrakPixels = n;
        return { mask, foam };
    }
    function Sprite_WrakFlood() { this.initialize(...arguments); }
    Sprite_WrakFlood.prototype = Object.create(Sprite.prototype);
    Sprite_WrakFlood.prototype.constructor = Sprite_WrakFlood;
    Sprite_WrakFlood.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 0.6;
        this._key = "";
        this._age = 0;
        this._frame = -1;
        this._layer = new Sprite();          // the water: the texture and the tint over it, cut by the mask
        this._water = new TilingSprite();
        this._tint = new Sprite(new Bitmap(4, 4));
        this._mask = new Sprite();
        this._foam = new Sprite();
        this._layer.addChild(this._water);
        this._layer.addChild(this._tint);
        this.addChild(this._layer);
        this.addChild(this._mask);
        this.addChild(this._foam);
        this._layer.mask = this._mask;
    };
    Sprite_WrakFlood.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const g = gridOf();
        this.visible = !!(g && g.any);
        if (!this.visible) return;
        const frames = waterFrames();
        if (!frames) { this.visible = false; return; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), tint = tintOf(g.map);
        const lv = level(), key = g.map + ":" + Math.round(lv * 50) + ":" + tint.rgb.join(",") + ":" + tint.a.toFixed(2);
        if (key !== this._key) {
            this._key = key;
            const bm = floodBitmaps(g, Math.round(lv * 50) / 50, g.map);
            this._mask.bitmap = bm.mask;
            this._foam.bitmap = bm.foam;
            for (const s of [this._mask, this._foam]) { s.scale.x = tw / S_TEX; s.scale.y = th / S_TEX; }
            this._tint.bitmap.fillAll("rgb(" + tint.rgb.join(",") + ")");
            this._tint.scale.x = g.W * tw / 4; this._tint.scale.y = g.H * th / 4;
            this._tint.opacity = Math.round(255 * tint.a);
            this._pixels = bm.mask._wrakPixels;
        }
        // the sea's own animation (the tilemap's frame: 0 1 2 1, every 30 frames)
        const tm = SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._tilemap;
        const f = [0, 1, 2, 1][((tm ? tm.animationFrame : Math.floor(Graphics.frameCount / 30)) || 0) % 4];
        if (f !== this._frame) { this._frame = f; this._water.bitmap = frames[f]; this._water.move(0, 0, g.W * tw, g.H * th); }
        this._age++;
        this.x = Math.round(-$gameMap.displayX() * tw);
        this.y = Math.round(-$gameMap.displayY() * th);
        this._foam.opacity = Math.round(255 * (0.65 + 0.35 * Math.sin(this._age / 45)));
    };
    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._wrakFlood = new Sprite_WrakFlood();
        this._tilemap.addChild(this._wrakFlood);
    };

    // ------------------------------------------------------------------
    // Speech: the engine's builder (Watki.mowa with the thread's options: "\n" starts a new line; "> text": the hero; "@key: text": a
    // resident nearby; else the one spoken to) for the talks built here; the steps' talks, the castaway's first meeting and Józek's
    // clue are the data's (Wrak_Data.js rozmowy)
    // ------------------------------------------------------------------
    function speaker(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null, r = L && L.RESIDENTS ? L.RESIDENTS.find(x => x.key === key) : null;
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: r ? r.name : key };
    }
    const say = (out, spk, arr) => Watki.mowa.linesTo(out, spk, arr, null, 0, w.def.mowa);
    const act = (out, args, ind) => Watki.mowa.script(out, "Wrak.act(this, " + JSON.stringify(args) + ")", ind);
    function questWants(key) {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        const m = q.markers()[key];
        return m === "ready" || m === "new";
    }
    function readyFor(key) {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        return q.markers()[key] === "ready";
    }
    const questTalk = key => { const q = TQ(); return q && q.talkFor ? q.talkFor(key, false) : null; };
    function usual(key) {
        const L = TL(), t = L && L.lines ? L.lines(key) : null;
        if (!t) return "";
        const h = hour(), slot = raining() && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        S().usualN = (S().usualN || 0) + 1;
        return list[S().usualN % list.length];
    }
    const think = text => { const SB = T.api("SpeechBubbles"); if (SB && SB.say && window.$gamePlayer) SB.say($gamePlayer, text, 200); else T.popup(text, { color: "#eceef0" }); };
    const bark = (ev, text) => { const SB = T.api("SpeechBubbles"); if (SB && SB.say && ev) SB.say(ev, text, 200); };
    // a call a little later (frames, not real time: a paused game waits too); dropped when the map changes
    let later = [];
    function updateLater() {
        if (!later.length) return;
        const now_ = Graphics.frameCount, keep = [];
        for (const l of later) {
            if (l.at > now_) { keep.push(l); continue; }
            if (l.ev && $gameMap.event(l.ev.eventId()) === l.ev) bark(l.ev, l.text);
        }
        later = keep;
    }

    // ------------------------------------------------------------------
    // TEXTS
    // ------------------------------------------------------------------
    const TX = Watki.teksty("wrak");
    const fill = Watki.mowa.fill;

    // ------------------------------------------------------------------
    // W12's clues
    // ------------------------------------------------------------------
    const clueCount = () => Object.keys(S().clues || {}).filter(k => D.CLUES[k]).length;
    function addClue(k, quiet) {
        if (!has() || !D.CLUES[k] || S().clues[k]) return false;
        S().clues[k] = day();
        const c = D.CLUES[k];
        note(Watki.wstaw(TK.kod.addClue[0], { name: c.name }), c.text);
        if (!quiet) T.popup(Watki.wstaw(TK.kod.addClue[0], { name: c.name }), { top: true, color: "#ffe27a", sub: TK.kod.addClue[1] });
        autoChecks();
        return true;
    }

    // ------------------------------------------------------------------
    // The talks: Janek's boat (his hook, first), the castaway, Józek Łata's clue
    // ------------------------------------------------------------------
    function boatOk() {
        if (!isBuilt() || storming()) return false;
        const r = rec("D25");
        // (2026-10-16, the coordinator's decision) the boat goes on after D25 too: the wreck stays a place to go back to
        if (!(r && r.s === "active") && !isDone("D25") && day() < D.BOAT.from) return false;
        return true;
    }
    function janekHarbourTalk(ev) {
        if ($gameMap.mapId() !== HARBOUR || !inHours(hour(), D.BOAT.hours) || !boatOk()) return null;
        const P = T.api("Przystan");
        if (P && P.janekAtSea && P.janekAtSea()) return null;
        if (!flag("janekMet")) return null;
        if (questWants("janek")) return null;
        const spk = { id: ev.eventId(), name: "Janek" }, out = [];
        if (D.BOAT.needQuest && !isDone(D.BOAT.needQuest)) {
            if (S().janekAsked === day()) return null;
            act(out, ["janekAsked"]);
            return say(out, spk, TX.janekNoK47);
        }
        const W = WY(), lows = W && W.lowWaters ? W.lowWaters() : [];
        say(out, spk, TX.janekOffer);
        if (lows.length) say(out, spk, [fill(TX.janekTide, { t: lows.map(hhmm).join(" i ") })]);
        say(out, spk, [TK.kod.janekHarbourTalk[0]]);
        return choiceTo(out, [TK.kod.janekHarbourTalk[1], TK.kod.janekHarbourTalk[2]],
            [act([], ["boat"]), act([], ["passJanek"])], 1);
    }
    function erykTalk(ev) {
        const spk = { id: ev.eventId(), name: TK.kod.erykTalk[0] }, out = [];
        if (questWants("rozbitek")) { const q = questTalk("rozbitek"); if (q && q.length) return q; }
        const e = TL() && TL().entryAt ? TL().entryAt(TL().RESIDENTS.find(r => r.key === D.RES.key), hour()) : null;
        if (e && e.act === "work" && e.where === "rozbitek_studnia") return say(out, spk, TX.erykWell);
        if (!S().met) return w.rozmowa("poznanie", { spk });   // (the first meeting: Wrak_Data rozmowy.poznanie)
        if (S().w12 === "double" || S().w12 === "ally") say(out, spk, [usual(D.RES.key) || pick(TX.erykAsk)]);
        else say(out, spk, [pick(TX.erykAsk)]);
        const labels = [TK.kod.erykTalk[4], TK.kod.erykTalk[5], TK.kod.erykTalk[6], "Bywaj."];
        const branches = [act([], ["portrait"]), say([], spk, [pick(TX.erykWhere)]), say([], spk, [usual(D.RES.key) || TK.kod.erykTalk[7]]), []];
        return choiceTo(out, labels, branches, 3);
    }
    function jozekTalk(ev) {   // (before his own offers - once; a hand-in of his quest comes first)
        if (!S().met || S().clues.jozek || S().w12 || readyFor("szmaciarz")) return null;
        return w.rozmowa("jozek", { spk: { id: ev.eventId(), name: TK.kod.jozekTalk[0] } });   // (Wrak_Data rozmowy.jozek)
    }
    function hook(key, ev) {
        if (!has()) return null;
        if (key === "janek") return janekHarbourTalk(ev);
        if (key === D.RES.key) return erykTalk(ev);
        if (key === "szmaciarz") return jozekTalk(ev);
        return null;
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: an "owner" takeover - after Zakon's (Eryk), Latarnia's (Janek's tran), before
    // Garnizon's and Przystan's (Janek's own menu), as the old hooks; "Nie, w innej sprawie" = the same talk without this plugin (skip)
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, who: ["janek", D.RES.key, "szmaciarz"], priority: T.talk.PRIORITY.owner + 10,
            run: ctx => { try { return hook(ctx.who, ctx.ev); } catch (e) { console.error("[Wrak]", e); return null; } } });
    }
    hookTalk();

    // the injected people of the wreck: Janek by his boat, the soldiers
    function talk(interp, who) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev || (ev._wrak && ev._wrak.hidden)) return;
        const out = [];
        if (who === "janek") {
            const spk = { id: ev.eventId(), name: "Janek" };
            say(out, spk, TX.janekWait);
            choiceTo(out, ["Wracajmy.", TK.kod.talk[0]], [say([], spk, TX.janekBack).concat(act([], ["boatBack"])), say([], spk, TX.janekStay)], 1);
        } else if (who === "zolnierz") {
            const spk = { id: ev.eventId(), name: TK.kod.talk[1] };
            say(out, spk, [TX.soldierTalk[(ev.eventId() + day()) % TX.soldierTalk.length]]);
        }
        if (out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
    }

    // ------------------------------------------------------------------
    // The script calls (the wreck's things, the talks built here): Wrak.act(this, [what, ...]) - "met" (a talk saved before 2026-10-28)
    // goes to the data's action
    // ------------------------------------------------------------------
    function selfSwitch(ev, on) { if (ev) $gameSelfSwitches.setValue([$gameMap.mapId(), ev.eventId(), "A"], !!on); }
    function giveChart() {
        if (count(D.ITEM_MAP) < 1 && item(D.ITEM_MAP)) $gameParty.gainItem(item(D.ITEM_MAP), 1);
        T.popup(item(D.ITEM_MAP) ? item(D.ITEM_MAP).name : TK.kod.giveChart[0], { top: true, color: "#ffd23f", sub: TK.kod.giveChart[1] });
        const names = D.MARKS.map(m => m.name).join(", ");
        note(TK.kod.giveChart[0], Watki.wstaw(TK.kod.giveChart[2], { names: names }));
    }
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a] = args;
        const ev = interp && interp.eventId ? $gameMap.event(interp.eventId()) : null;
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        try {
            if (what === "boat") {
                if (!boatOk()) { T.popup(TK.kod.actCall[0], { color: "#ffe9a8" }); stop(); return; }
                S().boat = { until: now() + D.BOAT.wait, from: now() };
                S().boatWarned = 0;
                think(TX.janekRow[0]);
                const L = D.BOAT.landing;
                $gamePlayer.reserveTransfer(MAP, L[0], L[1], L[2], 0);
            } else if (what === "passJanek") {
                const L = TL();
                if (L && L.talk && interp) L.talk(interp, { skip: PLUGIN });
            } else if (what === "janekAsked") {
                S().janekAsked = day();
            } else if (what === "boatBack") {
                S().boat = null;
                const H = D.BOAT.harbour;
                $gamePlayer.reserveTransfer(HARBOUR, H[0], H[1], H[2], 0);
            } else if (what === "szkielet") {
                if (ev && floodedAt(ev.x, ev.y)) { T.popup(TX.skeletonWet, { color: "#9fd4ff" }); return; }
                if (S().key) { T.popup(TX.skeletonEmpty, { color: "#eceef0" }); return; }
                S().key = day();
                vgive("klucz_bosmana", 1);
                AudioManager.playSe({ name: "Key", volume: 80, pitch: 100, pan: 0 });
                T.popup(vname("klucz_bosmana"), { icon: vicon("klucz_bosmana"), kind: "good" });
                for (const t of TX.skeleton) think(t.replace(/^> /, ""));
                note(TK.kod.actCall[1], TK.kod.actCall[2]);
                autoChecks();
            } else if (what === "drzwi") {
                if (!S().key && vcount("klucz_bosmana") < 1) { T.popup.need(vicon("klucz_bosmana") || 196, TK.kod.actCall[3]); return; }
                S().door = day();
                selfSwitch(ev, true);
                AudioManager.playSe({ name: "Open1", volume: 80, pitch: 90, pan: 0 });
                T.popup(TX.doorOpen, { color: "#ffe9a8" });
            } else if (what === "biurko") {
                if (S().desk) { T.popup(TX.deskEmpty, { color: "#eceef0" }); return; }
                S().desk = day();
                giveChart();
                vgive("dziennik_okretu", 1);
                setFlag("dziennikOkretu");
                setFlag("kronikaKarta4");
                for (const t of TX.desk) think(t.replace(/^> /, ""));
                note(TK.kod.actCall[4], TK.kod.actCall[5]);
                note(TK.kod.actCall[6], TK.kod.actCall[7]);
                addClue("dziennik");
                autoChecks();
            } else if (what === "skrzynia") {
                if (S().chest) { T.popup(TX.chestEmpty, { color: "#eceef0" }); return; }
                S().chest = day();
                selfSwitch(ev, true);
                vgive("monety_oko", 1);
                vgive("kamien_kruk", D.STONES.n);
                AudioManager.playSe({ name: "Chest1", volume: 80, pitch: 100, pan: 0 });
                T.popup(vname("kamien_kruk") + " ×" + D.STONES.n, { icon: vicon("kamien_kruk"), kind: "good" });
                for (const t of TX.chest) think(t.replace(/^> /, ""));
                note(TK.kod.actCall[8], TK.kod.actCall[9]);
                autoChecks();
            } else if (what === "met") {
                w.akcja("poznal", [], interp);
            } else if (what === "portrait") {
                if ($gameParty.gold() < 2) { T.popup.need(COIN_ICON, TK.kod.actCall[12]); stop(); return; }
                $gameParty.loseGold(2);
                S().portraits = (S().portraits || 0) + 1;
                const spk = ev ? { id: ev.eventId(), name: TK.kod.actCall[10] } : HERO;
                const list = say([], spk, S().portraits === 1 ? TX.erykPortrait : TX.erykPortraitAgain);
                if (S().portraits === 1) vgive("portret", 1);
                if (interp && list.length) interp.setupChild(list.concat([C(0, [])]), interp.eventId());
            } else if (what === "clue") {
                if (a === "jozek") S().jozekTold = day();
                addClue(a);
            }
        } catch (e) { console.error("[Wrak] act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // The hooks the thread's data names (Wrak_Data.js): D25 (the wreck built, the stones) and W12 (the clues, the talk in private, the
    // false map); TownQuests.act's "fx" of d25Kamienie / w12Talk / w12Map (an old talk, the tests) - to the data's actions
    // ------------------------------------------------------------------
    const W12_HOW = { given: "w12Wydaj", ally: "w12Zachowaj", fled: "w12Ucieczka", double: "w12Podwojna" };
    w.haki({
        // "@key: ..." in a talk: that resident says it
        mowca: (ctx, key) => speaker(key),
        zbudowany: () => isBuilt(),
        // D25: the five stones in the bag; given / sold / kept
        kamienie: () => vcount("kamien_kruk") >= D.STONES.n,
        kamienieFx: (ctx, q, key, interp) => w.akcja(key === "celnik" ? "kamienieCelnik" : key === "kupiec" ? "kamienieKupiec" : "kamienieZatrzymane", [key], interp),
        // W12
        poszlaka: (ctx, k) => { addClue(k); },
        w12Fx: (ctx, q, how, interp) => {
            if (W12_HOW[how]) w.akcja(W12_HOW[how], [], interp);
            else if (w.at("w12Talk")) S().w12 = how;
        },
        w12MapFx: (ctx, q, what, interp) => w.akcja("w12Sprzedaj", [], interp),
        rozbitekOdchodzi: () => { const L = TL(); if (L && L.setGone) L.setGone(D.RES.key, true); },
        // the garrison's favour (package D); without it the bus "wrakGarnizon"
        garnizon: (ctx, n, why) => { const t = w.tekst(why); if (!T.call("Garnizon", "addFavor", n, t)) T.emit("wrakGarnizon", { favor: n, why: t }); },
        // the false map's revenge: Baltazar's men some nights later (35%)
        zemsta: () => {
            const s = S();
            s.raid = day() + D.RAID.after[0] + Math.floor(Math.random() * (D.RAID.after[1] - D.RAID.after[0] + 1));
            s.raidRoll = Math.random();
        },
        // the things, the markers, the quest's end with its reward
        zabierz: (ctx, k, n) => { vtake(k, n); },
        odswiez: () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); },
        zakoncz: (ctx, id, rw) => { TQ().finish(id, rw); }
    });

    // (the castaway's talk bust Rozbitek_Bust is in SpeechBubbles' own BUSTS table since the integration)

    // ------------------------------------------------------------------
    // The tavern's seat: TownLife counts its guests by their plans (gosc_N = the order of the residents with a "tawerna" entry) -
    // the castaway's seat goes under his real number (gosc_9 when nobody else came before him)
    // ------------------------------------------------------------------
    (function seat() {
        const L = TL(), TLD = window.TownLifeData;
        if (!L || !L.RESIDENTS || !TLD || !TLD.SPOTS_BY_MAP || !TLD.SPOTS_BY_MAP[TAVERN]) return;
        const guests = L.RESIDENTS.filter(r => r.plan.some(p => p[2] === "tawerna")).map(r => r.key);
        const n = guests.indexOf(D.RES.key) + 1, sb = TLD.SPOTS_BY_MAP[TAVERN];
        if (n > 0 && n !== 9 && sb.gosc_9 === D.SPOT_TAVERN && !sb["gosc_" + n]) { sb["gosc_" + n] = D.SPOT_TAVERN; delete sb.gosc_9; }
    })();

    // ------------------------------------------------------------------
    // The injected events (ids 670-679, Map165): Janek's boat and Janek, the rescue boat and two soldiers - placed on the map's
    // markers "Miejsce: wrak_*" (the data's cells when a marker is gone)
    // ------------------------------------------------------------------
    let soldierSheet = D.SOLDIERS.sheet;
    (function findKingSoldier() {   // (package D's soldier, when its sheet is there)
        if (!D.SOLDIERS.sheetKing || typeof Image === "undefined") return;
        try { const im = new Image(); im.onload = () => { soldierSheet = D.SOLDIERS.sheetKing; }; im.src = "img/characters/" + encodeURIComponent(D.SOLDIERS.sheetKing) + ".png"; } catch (e) { /* (none) */ }
    })();
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function markerOf(data, key, dflt) {
        const m = (data.events || []).find(e => e && String(e.name || "").trim() === "Miejsce: " + key);
        if (m) { const img = m.pages && m.pages[0] && m.pages[0].image; return [m.x, m.y, img ? img.direction || dflt[2] : dflt[2]]; }
        return dflt;
    }
    function personEv(id, name, sheet, at, who, opts) {
        const o = opts || {};
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.fix, image: { tileId: 0, characterName: sheet, direction: at[2] || 2, pattern: o.pattern === undefined ? 1 : o.pattern, characterIndex: 0 },
            list: who ? [C(355, ["Wrak.talk(this, " + JSON.stringify(who) + ");"]), C(0, [])] : [C(0, [])],
            moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: o.speed || 3, moveType: 0,
            priorityType: 1, stepAnime: !!o.step, through: false, trigger: 0, walkAnime: !o.fix };
        return { id, name, note: "<Wrak:" + (o.tag || who || "rzecz") + ">", pages: [page], x: at[0], y: at[1] };
    }
    T.inject(MAP, { ids: IDS, owner: PLUGIN, build(data) {
        const B = D.BOAT, Sd = D.SOLDIERS;
        return [
            personEv(IDS[0], TK.kod.build[0], "!$Przystan_Lodz_Janka", markerOf(data, "wrak_lodz", [B.boat[0], B.boat[1], 2]), null,
                { fix: true, step: true, speed: 2, pattern: 0, tag: "lodz" }),
            personEv(IDS[0] + 1, TK.kod.build[1], "$Npc_Janek", markerOf(data, "wrak_janek", B.janek), "janek"),
            personEv(IDS[0] + 2, TK.kod.build[2], "!$Przystan_Lodz_Mala", markerOf(data, "wrak_lodz_ratownicza", [Sd.boat[0], Sd.boat[1], 2]), null,
                { fix: true, step: true, speed: 2, pattern: 0, tag: "lodz_ratownicza" }),
            personEv(IDS[0] + 3, TK.kod.build[3], soldierSheet, markerOf(data, "wrak_zolnierz_1", Sd.men[0]), "zolnierz"),
            personEv(IDS[0] + 4, TK.kod.build[3], soldierSheet, markerOf(data, "wrak_zolnierz_2", Sd.men[1]), "zolnierz")
        ];
    } });
    function setShown(e, on) {
        if (!e) return;
        const st = e._wrak || (e._wrak = { prio: e._priorityType, through: e._through, hidden: null });
        if (on) {
            if (st.hidden === false) return;
            e.setTransparent(false); e.setThrough(st.through); e._priorityType = st.prio; st.hidden = false;
        } else {
            if (st.hidden === true) return;
            e.setTransparent(true); e.setThrough(true); e._priorityType = 0; st.hidden = true;
        }
    }
    // (hidden: it never starts - the core's one start hook, 2026-10-23)
    T.onEventStart(ev => !!(ev._wrak && ev._wrak.hidden), { owner: PLUGIN, priority: "hidden" });
    const boatHere = () => !!(S().boat && now() < S().boat.until);
    const soldiersHere = () => inHours(hour(), D.SOLDIERS.hours) && !storming();

    // ------------------------------------------------------------------
    // The map's life: arriving, the boat's time, the soldiers, the tide's warnings, the skeleton under water
    // ------------------------------------------------------------------
    function syncWreck() {
        if ($gameMap.mapId() !== MAP) return;
        const b = boatHere();
        setShown($gameMap.event(IDS[0]), b);
        setShown($gameMap.event(IDS[0] + 1), b);
        const s = soldiersHere();
        for (let k = 2; k <= 4; k++) setShown($gameMap.event(IDS[0] + k), s);
    }
    function boatClock() {
        const bt = S().boat;
        if (!bt) return;
        const t = now();
        if ($gameMap.mapId() === MAP && t >= bt.until - 0.25 && !S().boatWarned) {
            S().boatWarned = 1;
            bark($gameMap.event(IDS[0] + 1), TX.janekLeaving);
        }
        if (t >= bt.until) {
            S().boat = null;
            if ($gameMap.mapId() === MAP || $gameMap.mapId() === UNDER) T.popup(TX.janekGone, { color: "#ffe9a8" });
        }
    }
    function soldiersWatch() {
        if ($gameMap.mapId() !== MAP || !soldiersHere() || $gameMap.isEventRunning()) return;
        const glejt = flag("glejtWrak"), sneak = !!T.call("Hunting", "sneaking");
        for (let k = 3; k <= 4; k++) {
            const ev = $gameMap.event(IDS[0] + k);
            if (!ev || (ev._wrak && ev._wrak.hidden)) continue;
            const dist = Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y);
            if (glejt) {
                if (dist <= D.SOLDIERS.see && S().glejtSeen !== day()) { S().glejtSeen = day(); bark(ev, TX.soldierPass); }
                continue;
            }
            if (S().fined === day() || dist > (sneak ? D.SOLDIERS.seeSneak : D.SOLDIERS.see)) continue;
            S().fined = day();
            const fine = Math.min(D.SOLDIERS.fine, $gameParty.gold());
            if (fine > 0) $gameParty.loseGold(fine);
            ev.turnTowardPlayer();
            bark(ev, TX.soldierCatch[0]);
            later.push({ at: Graphics.frameCount + 160, ev, text: TX.soldierCatch[1] });
            T.popup(Watki.wstaw(TK.kod.soldiersWatch[0], { fine: fine }), { icon: COIN_ICON, kind: "need" });
            if (!T.call("Garnizon", "addFavor", D.SOLDIERS.favor, TK.kod.soldiersWatch[1])) T.emit("wrakGarnizon", { favor: D.SOLDIERS.favor, gold: -fine, why: TK.kod.soldiersWatch[1] });
            note(TK.kod.soldiersWatch[2], Watki.wstaw(TK.kod.soldiersWatch[3], { fine: fine }));
            return;
        }
    }
    function tideWarnings() {
        const m = $gameMap.mapId();
        if (m !== MAP) return;
        const t = tideNow(), d = day();
        const lowKey = d * 100 + Math.floor(hour() * 2);
        if (t.low) {
            const left = lowLeft();
            if (left < 0.45 && S().lowWarn < 0) { S().lowWarn = lowKey; T.popup(TX.lowEnding, { color: "#9fd4ff" }); }
        } else if (S().lowWarn >= 0) {
            S().lowWarn = -1;
            T.popup(fill(TX.flooded, { t: nextLowClock() }), { color: "#9fd4ff" });
        }
    }
    function skeletonUnderWater() {
        if ($gameMap.mapId() !== UNDER) return;
        for (const ev of $gameMap.events()) {
            if (!ev.event() || !/<Wrak:szkielet>/.test(ev.event().note || "")) continue;
            const wet = floodedAt(ev.x, ev.y);
            ev.setOpacity(wet ? 90 : 255);
        }
    }
    // the well at night (W12 clue 4): Eryk's sleeve rolled up - the hero close by and unseen (sneaking or behind him)
    function wellWatch() {
        if ($gameMap.mapId() !== TOWN || S().clues.tatuaz || !S().met) return;
        const L = TL(), ev = L && L.eventOf ? L.eventOf(D.RES.key) : null;
        if (!ev || (ev._town && ev._town.hidden)) return;
        const st = L.state(D.RES.key);
        if (!st || st.act !== "work") return;
        const sp = D.SPOTS_TOWN.rozbitek_studnia;
        if (ev.x !== sp[0] || ev.y !== sp[1]) return;
        const dist = Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y);
        if (dist > 2.6) return;
        const sneak = !!T.call("Hunting", "sneaking");
        const d = ev.direction(), dx = $gamePlayer.x - ev.x, dy = $gamePlayer.y - ev.y;
        const ahead = (d === 2 && dy > 0) || (d === 8 && dy < 0) || (d === 4 && dx < 0) || (d === 6 && dx > 0);
        if (sneak || !ahead) {
            addClue("tatuaz", true);
            for (const t of TX.erykWellSeen) think(t.replace(/^> /, ""));
            T.popup(Watki.wstaw(TK.kod.wellWatch[0], { name: D.CLUES.tatuaz.name }), { top: true, color: "#ffe27a", sub: TK.kod.wellWatch[1] });
        } else if (S().tatuazTry !== day()) {
            S().tatuazTry = day();
            bark(ev, TX.erykWell[0]);
        }
    }
    // the clues that come from other packages' flags: the lighthouse's vision (C: mgla), the raven's letter (B: krukTame)
    function flagClues() {
        if (!S().met) return;
        const W = WY(), fl = k => (W && W.flag ? W.flag(k) : flag(k));
        if (!S().clues.wizja && fl("mgla")) addClue("wizja");
        if (!S().clues.list && fl("krukTame") && day() > S().met && inHours(hour(), [6, 12]) && !$gameMap.isEventRunning()) {
            think(TX.letter);
            addClue("list");
        }
    }
    // the chart's white eyes: a mark visited when its map is entered (with the chart in the bag)
    function marksOpen() { const W = WY(); return D.MARKS.filter(m => !m.ready || (W && W.isReady && W.isReady(m.ready))); }
    function visitMark(mapId) {
        if (count(D.ITEM_MAP) < 1) return;
        for (const m of D.MARKS) {
            if (m.map !== mapId || S().marks[m.key]) continue;
            S().marks[m.key] = day();
            const n = Object.keys(S().marks).length;
            T.popup(Watki.wstaw(TK.kod.visitMark[0], { name: m.name }), { top: true, color: "#ffe27a", sub: Watki.wstaw(TK.kod.visitMark[1], { n: n, length: D.MARKS.length }) });
            note(Watki.wstaw(TK.kod.visitMark[0], { name: m.name }), Watki.wstaw(TK.kod.visitMark[2], { name: m.name, n: n, length: D.MARKS.length }));
        }
    }
    function nextMark() {
        if (count(D.ITEM_MAP) < 1) return null;
        return marksOpen().find(m => !S().marks[m.key]) || null;
    }
    (function tracker() {
        const J = T.api("Journal");
        if (!J || !J.addTrackerSource) return;
        J.addTrackerSource(() => {
            if (!has()) return null;
            const m = nextMark();
            if (!m) return null;
            const n = Object.keys(S().marks).length;
            return { label: "MAPA", title: Watki.wstaw(TK.kod.tracker[0], { name: m.name }), line: Watki.wstaw(TK.kod.tracker[1], { n: n, length: D.MARKS.length }), key: "wrak:" + m.key,
                icon: item(D.ITEM_MAP) ? item(D.ITEM_MAP).iconIndex : 0, where: { map: m.map, x: m.x, y: m.y, name: m.name } };
        });
    })();
    // the false map's revenge: Baltazar finds out - his men at night, once (35%)
    const RAID_MAPS = [3, 4, 8, 13, 17, 18, 20, 22, 23, 111, 125];
    function raidWatch() {
        const s = S();
        if (!s.raid || s.raidDone || day() < s.raid || s.raidRoll >= D.RAID.chance) return;
        const h = hour();
        if (!(h >= 21 || h < 4) || !RAID_MAPS.includes($gameMap.mapId()) || $gameMap.isEventRunning()) return;
        const Hm = T.api("Humans");
        if (!Hm || typeof Hm.ambush !== "function") { s.raidDone = day(); return; }
        const band = Hm.ambush(["bandit", "knifer", "archer"], { tag: "wrakZemsta", far: [5, 8], say: TK.kod.raidWatch[0] });
        s.raidDone = day();
        if (band) note(TK.kod.raidWatch[1], TK.kod.raidWatch[2]);
    }

    T.on("mapReady", p => {
        if (!has()) return;
        grid = null;
        later = [];
        hookTalk();
        const m = $gameMap.mapId();
        if (m === MAP) {
            const first = !S().been;
            if (first) { S().been = day(); setFlag("wrakByl"); }
            syncWreck();
            if (p && p.transfer) T.popup(fill(TX.arrive, { t: nextLowClock() }), { color: "#9fd4ff" });
            S().lowWarn = -1;
            autoChecks();
        }
        if (m === UNDER) {
            if (!S().under) S().under = day();
            if (S().ratsDay !== day()) {
                const Cr = T.api("Creatures"), ev = $gameMap.events().find(e => e.event() && e.event().name === "Miejsce: wrak_szczury");
                const at = ev ? [ev.x, ev.y] : D.RAT.at;
                if (Cr && Cr.spawn) { try { Cr.spawn("szczur", at[0], at[1], { level: D.RAT.level, tag: "wrak", max: D.RAT.max }); } catch (e) { console.error("[Wrak] rats", e); } }
                S().ratsDay = day();
            }
            skeletonUnderWater();
        }
        if (S().boat && m !== MAP && m !== UNDER) S().boat = null;   // (he went away from the wreck some other way: Janek rows home)
        visitMark(m);
    }, { owner: PLUGIN });

    let tick = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        tick++;
        updateLater();
        const m = $gameMap.mapId();
        if (m === MAP || m === UNDER) {
            if (tick % 15 === 0) rescueHero();
            if (tick % 20 === 0) { boatClock(); syncWreck(); soldiersWatch(); }
            if (tick % 60 === 0) { tideWarnings(); skeletonUnderWater(); }
        } else if (tick % 30 === 0) {
            if (S().boat) boatClock();
            if (m === TOWN) wellWatch();
        }
        if (tick % 120 === 0) { flagClues(); raidWatch(); }
    }, { owner: PLUGIN, name: "wreck" });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, UNDER, IDS, DATA: D, TX, state: () => S(), act: actCall, talk, floodedAt, level: () => level(), tide: () => tideNow(),
        clues: () => Object.assign({}, S().clues), clueCount, addClue, boatHere, soldiersHere, nextMark, marksOpen, visitMark, isBuilt,
        sync: syncWreck, rescueHero, grid: () => gridOf(), flood: () => { const s = SceneManager._scene && SceneManager._scene._spriteset; return s && s._wrakFlood ? { key: s._wrakFlood._key, pixels: s._wrakFlood._pixels || 0, visible: s._wrakFlood.visible } : null; },
        soldierSheet: () => soldierSheet
    };
    window.Wrak = T.register(PLUGIN, api);
})();
