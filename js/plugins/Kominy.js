//=============================================================================
// Kominy.js
//=============================================================================
// (2026-11-13, the user on the new world's villages: „animacje kominów - jeden obrazek komina i animacja dymka, ładna, fajna”)
// On the maps of the parameter, every chimney - an event drawn with !Fantasy_chimney (the old smoke sheet) over the two chimney tiles of
// the B sheet (the cap B 2..5,10 on the roof's top row, the shaft B 2..5,11 below it) - becomes:
//   - ONE picture of a chimney (img/characters/!$1_Komin.png, its foot on the roof where the shaft tile was): the two tiles are not drawn there
//     any more, the old sheet is not drawn;
//   - real smoke: soft pixel puffs rising out of its mouth, growing, drifting away with the wind and fading - a few at a time, new ones
//     every ~0.4 s, each a little different. Thick in the morning and the evening, thin at noon (in summer hardly any), weaker in the rain,
//     torn sideways in a storm, calm at night.
// Puffs are a small pool per chimney, only while it is near the screen; one baked puff picture (3 tones, no smoothing) for them all.
// The map files keep their tiles and events (the editor still shows the old chimney there): it is all drawn by this plugin.

/*:
 * @target MZ
 * @plugindesc Kominy: jeden obrazek komina zamiast dwóch kafli i prawdziwy dym (kłęby unoszące się z wiatrem, gęstsze rano i wieczorem). Na mapach z parametru. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Wydajnosc
 *
 * @param maps
 * @text Mapy
 * @desc Numery map (po przecinku), na których kominy rysuje ta wtyczka.
 * @type string
 * @default 218,219,220,221,222
 *
 * @help
 * Kominy.js
 *   Komin na mapie to (jak dotąd) zdarzenie z obrazkiem !Fantasy_chimney nad kaflami komina
 *   z arkusza B. Na mapach z parametru wtyczka rysuje w tym miejscu jeden obrazek komina
 *   (img/characters/!$1_Komin.png) i dym z kłębów, które unoszą się, rosną, płyną z wiatrem i znikają.
 *   Kafle i zdarzenia w pliku mapy zostają (edytor dalej pokazuje stary komin).
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    const params = PluginManager.parameters("Kominy");
    const MAPS = new Set(String(params.maps || "218,219,220,221,222").split(/[^0-9]+/).filter(Boolean).map(Number));
    const SHEET = "!Fantasy_chimney", PIC = "!$1_Komin";   // (TawernaCore: "!$1_" = one picture, the whole file)
    const CAP = new Set([82, 83, 84, 85]), SHAFT = new Set([90, 91, 92, 93]);
    const here = () => !!$gameMap && MAPS.has($gameMap.mapId());
    const isChimney = ev => ev instanceof Game_Event && here() && ev.event() && ev.event().pages[0] && ev.event().pages[0].image.characterName === SHEET;

    // ------------------------------------------------------------------
    // the two chimney tiles under a chimney event: not drawn (their cells by the map's data, once per map)
    // ------------------------------------------------------------------
    let cells = null;
    function chimneyCells() {
        if (cells && cells.data === $dataMap) return cells;
        const set = new Set();
        if (here()) for (const e of $dataMap.events) {
            if (!e || !e.pages[0] || e.pages[0].image.characterName !== SHEET) continue;
            set.add(e.x + "," + e.y); set.add(e.x + "," + (e.y + 1));
        }
        return (cells = { data: $dataMap, set });
    }
    const _addSpot = Tilemap.prototype._addSpot;
    Tilemap.prototype._addSpot = function(startX, startY, x, y) {
        this._kominCell = here() && chimneyCells().set.size > 0 && chimneyCells().set.has($gameMap.roundX(startX + x) + "," + $gameMap.roundY(startY + y));
        _addSpot.call(this, startX, startY, x, y);
        this._kominCell = false;
    };
    const _addSpotTile = Tilemap.prototype._addSpotTile;
    Tilemap.prototype._addSpotTile = function(tileId, dx, dy) {
        if (this._kominCell && (CAP.has(tileId) || SHAFT.has(tileId))) return;
        _addSpotTile.call(this, tileId, dx, dy);
    };

    // the old sheet is not drawn: the event shows the chimney picture instead
    const _characterName = Game_CharacterBase.prototype.characterName;
    Game_Event.prototype.characterName = function() {
        const n = _characterName.call(this);
        return n === SHEET && here() ? PIC : n;
    };
    const _isChimney = ev => ev instanceof Game_Event && here() && ev.event() && ev.event().pages[0] && ev.event().pages[0].image.characterName === SHEET;

    // ------------------------------------------------------------------
    // the puff picture: 3 sizes of a soft pixel cloud in 3 tones (light top-left, shade bottom-right), baked once
    // ------------------------------------------------------------------
    let puffBmp = null;
    const PUFF = 16;
    function puffs() {
        if (puffBmp) return puffBmp;
        const bm = new Bitmap(PUFF * 3, PUFF), c = bm.context, img = c.createImageData(PUFF * 3, PUFF), d = img.data;
        const put = (x, y, r, g, b, a) => { const i = (y * PUFF * 3 + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a; };
        for (let k = 0; k < 3; k++) {
            const R = [4.6, 6.0, 7.4][k], cx = k * PUFF + 7.5, cy = 8.2;
            for (let y = 0; y < PUFF; y++) for (let x = k * PUFF; x < (k + 1) * PUFF; x++) {
                // a cloud: two or three overlapping circles
                const ds = [Math.hypot(x - cx, y - cy) / R, Math.hypot(x - (cx - R * 0.45), y - (cy + R * 0.2)) / (R * 0.72), Math.hypot(x - (cx + R * 0.42), y - (cy + R * 0.25)) / (R * 0.68)];
                const dd = Math.min(...ds);
                if (dd > 1) continue;
                const lx = (x - cx) / R, ly = (y - cy) / R, lit = -lx * 0.55 - ly * 0.75;
                const tone = lit > 0.28 ? [226, 224, 216] : lit > -0.22 ? [196, 194, 188] : [160, 158, 154];
                put(x, y, tone[0], tone[1], tone[2], dd > 0.82 ? 150 : 235);
            }
        }
        c.putImageData(img, 0, 0);
        bm._baseTexture.update();
        bm.smooth = false;
        return (puffBmp = bm);
    }

    // ------------------------------------------------------------------
    // the weather and the hour -> how much smoke, the wind
    // ------------------------------------------------------------------
    function amount() {
        const h = T.time && T.time.hour ? T.time.hour() : 12, s = T.time && T.time.season ? T.time.season() : 1;
        let a = h >= 5 && h < 9 ? 1 : h >= 9 && h < 12 ? 0.6 : h >= 12 && h < 16 ? [0.45, 0.2, 0.45, 0.8][s] : h >= 16 && h < 21 ? 0.95 : h >= 21 ? 0.7 : 0.4;
        const wt = $gameScreen.weatherType(), pw = $gameScreen.weatherPower();
        if ((wt === "rain" || wt === "storm") && pw > 0) a *= 0.75;
        return a;
    }
    function wind() {   // px a frame sideways (east +), its gusts
        const wt = $gameScreen.weatherType(), pw = $gameScreen.weatherPower(), fc = Graphics.frameCount;
        const base = wt === "storm" ? 1.1 : (wt === "rain" && pw > 0) ? 0.55 : 0.22;
        return base * (0.75 + 0.25 * Math.sin(fc / 400) + 0.18 * Math.sin(fc / 97));
    }

    // ------------------------------------------------------------------
    // the chimney's sprite: the picture as a child, the puffs in the tilemap (over roofs and people)
    // ------------------------------------------------------------------
    const MAX = 9, EVERY = 24, LIFE = 190, FOOT = 4;
    // the roof's brightness under the chimney -> a tint for the stone (once a chimney): the A3 roof's own pixels (its kind's middle)
    const lumCache = {};
    function roofTone(x, y) {
        let t = 0;
        for (const z of [3, 2, 1, 0]) { const id = $gameMap.tileId(x, y, z); if (id && Tilemap.isTileA3(id)) { t = id; break; } }
        if (!t) return undefined;
        const kind = Tilemap.getAutotileKind(t), key = $gameMap.tilesetId() + ":" + kind;
        if (lumCache[key] === undefined) {
            const bm = ImageManager.loadTileset($gameMap.tileset().tilesetNames[2]);
            if (!bm.isReady()) return null;   // (asked again next frame)
            const tx = kind % 8, ty = Math.floor((kind - Tilemap.TILE_ID_A3 / 48 + 48) / 8) % 4;
            const k3 = kind - 48, ox = (k3 % 8) * 96, oy = Math.floor(k3 / 8) * 96;
            let sum = 0, n = 0;
            try { const d = bm.context.getImageData(ox + 24, oy + 24, 48, 48).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { sum += d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15; n++; } } catch (e) { /* (no pixels) */ }
            lumCache[key] = n ? sum / n : 110;
            void tx; void ty;
        }
        const v = Math.max(0.66, Math.min(1, 0.58 + lumCache[key] / 255 * 0.62));
        const r = Math.round(255 * Math.min(1, v * 1.02)), g = Math.round(255 * v), b = Math.round(255 * v * 0.95);
        return (r << 16) | (g << 8) | b;
    }
    let shadeBmp = null;
    function shade() {   // a soft dark oval, down-right of the foot
        if (shadeBmp) return shadeBmp;
        const bm = new Bitmap(56, 22), c = bm.context, gr = c.createRadialGradient(28, 11, 2, 28, 11, 26);
        gr.addColorStop(0, "rgba(10,8,6,0.42)"); gr.addColorStop(1, "rgba(10,8,6,0)");
        c.save(); c.scale(1, 0.42); c.fillStyle = gr; c.beginPath(); c.arc(28, 26, 26, 0, Math.PI * 2); c.fill(); c.restore();
        bm._baseTexture.update();
        return (shadeBmp = bm);
    }
    T.sprite.hook({ owner: "Kominy", method: "update", when: s => isChimney(s._character), after(s) { chimneyUpdate.call(s); } });
    function chimneyUpdate() {
        const ch = this._character;
        if (!this._kominPuffs) { this._kominPuffs = []; this._kominT = Math.floor((ch.x * 7 + ch.y * 13) % EVERY); this._kominPic = true; this._kominTone = null; }
        // (gracz: „pamiętaj, że mają bardzo pasować te kominy”) it stands at the ridge: its foot just under the roof's top row, its top a
        // little over the ridge line, as a chimney rises out of a roof; a soft contact shade on the roof at its foot (the light from the
        // top-left); its stone toned to the roof's own brightness (a pale stone on a dark roof shone like a sticker)
        this.y += FOOT;
        if (this._kominTone === null) this._kominTone = roofTone(ch.x, ch.y + 1);
        if (this._kominTone !== undefined) this.tint = this._kominTone;
        const tm = this.parent;
        if (!tm) return;
        if (!this._kominShade) { const sh = new Sprite(shade()); sh.anchor.set(0.3, 0.55); sh.z = 4.9; sh.update = function() {}; tm.addChild(sh); this._kominShade = sh; }
        this._kominShade.x = this.x + 2; this._kominShade.y = this.y; this._kominShade.visible = this.visible;
        const ph = this.bitmap && this.bitmap.isReady() ? this.bitmap.height : 51;
        // the mouth: the picture's top, a little in (screen coordinates of the tilemap)
        const mx = this.x, my = this.y - ph + 6;
        const list = this._kominPuffs, a = amount(), w = wind();
        const near = mx > -80 && mx < Graphics.width + 80 && my > -60 && my < Graphics.height + 160;
        // a new puff now and then (fewer when there is little smoke), only near the screen
        if (near && a > 0.05 && ++this._kominT >= EVERY / (0.55 + 0.6 * a)) {
            this._kominT = 0;
            let p = list.find(q => !q.live);
            if (!p && list.length < MAX) {
                const sp = new Sprite(puffs()); sp.anchor.set(0.5, 0.5); sp.z = 6; sp.update = function() {};
                tm.addChild(sp); p = { sp, live: false }; list.push(p);
            }
            if (p) {
                const k = Math.floor(Math.random() * 3);
                p.sp.setFrame(k * PUFF, 0, PUFF, PUFF);
                Object.assign(p, { live: true, age: 0, life: LIFE * (0.8 + Math.random() * 0.4), x: (Math.random() - 0.5) * 3, y: 0,
                    vy: -(0.42 + Math.random() * 0.16), s0: 0.9 + Math.random() * 0.4, ph: Math.random() * 6.28, a0: Math.min(0.85, 0.35 + 0.5 * a), spin: (Math.random() - 0.5) * 0.004 });
                p.sp.rotation = Math.random() * 6.28;
            }
        }
        for (const p of list) {
            if (!p.live) { p.sp.visible = false; continue; }
            p.age++;
            const t = p.age / p.life;
            if (t >= 1) { p.live = false; p.sp.visible = false; continue; }
            p.y += p.vy * (1 - 0.55 * t);                                  // (rises, slowing)
            p.x += w * (0.25 + t) + Math.sin(p.ph + p.age * 0.045) * 0.12;   // (the wind takes it more the higher it gets)
            p.sp.visible = near;
            p.sp.x = Math.round(mx + p.x); p.sp.y = Math.round(my + p.y);
            const sc = p.s0 * (1 + 1.6 * t);
            p.sp.scale.set(sc * 2, sc * 2);
            p.sp.rotation += p.spin;
            p.sp.opacity = Math.round(255 * p.a0 * Math.min(1, t * 7) * (1 - t) * (1 - t * 0.2));
        }
    }

    const api = { MAPS, puffCount: () => { const sc = SceneManager._scene, ss = sc && sc._spriteset; if (!ss) return 0; let n = 0; for (const s of ss._characterSprites) if (s._kominPuffs) n += s._kominPuffs.filter(p => p.live).length; return n; } };
    window.Kominy = T && T.register ? T.register("Kominy", api) : api;
})();
