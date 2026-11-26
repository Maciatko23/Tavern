//=============================================================================
// Gory.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Góry zamiast skarp: na północnej i południowej krawędzi map świata wielkie góry (obrazy) zamiast pasa skarp. v1.0.0
 * @author Claude
 * @base Gory_Data
 * @orderAfter Gory_Data
 *
 * @help
 * Gracz (2026-11-26): „teraz oddzielone mapy są wzgórzami zamiast prawdziwymi górami ładnymi” - „skarpy wywal te stare, tylko góry
 * ładne, wysokie, wielkie” - „żeby na ogródki nie wchodziły” - „po środku krawędzi na Kruczogrodzie musi być przejście pomiędzy
 * górami”.
 *
 * Przy wczytaniu mapy z listy (Gory_Data.js) pas skarp przy północnej i południowej krawędzi (kafle A5 ciągiem od brzegu, kolumna
 * po kolumnie) staje się trawą (kafel pierwszego wolnego pola pod pasem) z regionem 2 (RegionLayers: blokuje), a zdarzenia stojące
 * w pasie (skalne iglice, drzewa na skarpach) znikają z oczu. Na pasie stoją obrazy gór (img/pictures/gory), w kolejności z
 * postaciami (kto stoi niżej, jest przed górą). Przełęcz pośrodku krawędzi: trawa do przejścia, tylko ostatnie rzędy przy brzegu
 * mapy blokują, dopóki za nią nie ma mapy.
 *
 * Pliki map się nie zmieniają (edytor widzi dawne skarpy). Rozstawienie: python tools/gory/ustaw.py --wykonaj.
 */
(() => {
    "use strict";
    const T = window.Tawerna;
    const D = window.GoryData;
    if (!D) return;
    const PASS_EDGE = 2;   // (rows of a pass at the map's very edge that still block - no map beyond it yet)
    let loadingId = 0;
    const _loadMapData = DataManager.loadMapData;
    DataManager.loadMapData = function(mapId) { loadingId = mapId; _loadMapData.call(this, mapId); };
    // the band made ground + region 2 (and the pass ground you may walk), in the loaded data only
    function reshape(data, M) {
        const W = data.width, H = data.height, a = data.data, at = (x, y, z) => (z * H + y) * W + x;
        const pn = M.przelecz.n || [0, 0], ps = M.przelecz.s || [0, 0];
        for (let x = 0; x < W; x++) {
            const fn = M.n[x], fs = M.s[x];
            // the ground: the nearest field beyond the band that is no cliff and no wall (a lone cliff spur may stand right by it)
            const plain = t => t && !(t >= 1536 && t < 2048) && !(t >= 4352 && t < 8192);
            const ground = (y0, dy) => { for (let k = 0; k < 12; k++) { const y = Math.max(0, Math.min(H - 1, y0 + k * dy)); for (const xx of [x, x - 1, x + 1]) { const t = xx >= 0 && xx < W ? a[at(xx, y, 0)] : 0; if (plain(t)) return t; } } return a[at(x, Math.max(0, Math.min(H - 1, y0)), 0)]; };
            const gN = ground(fn, 1), gS = ground(fs - 1, -1);
            const inN = x >= pn[0] && x < pn[1], inS = x >= ps[0] && x < ps[1];
            for (let y = 0; y < fn && y < H; y++) {
                a[at(x, y, 0)] = gN; a[at(x, y, 1)] = 0; a[at(x, y, 2)] = 0; a[at(x, y, 3)] = 0; a[at(x, y, 4)] = 0;
                a[at(x, y, 5)] = inN && y >= PASS_EDGE ? 0 : 2;
            }
            for (let y = Math.max(0, fs); y < H; y++) {
                a[at(x, y, 0)] = gS; a[at(x, y, 1)] = 0; a[at(x, y, 2)] = 0; a[at(x, y, 3)] = 0; a[at(x, y, 4)] = 0;
                a[at(x, y, 5)] = inS && y < H - PASS_EDGE ? 0 : 2;
            }
        }
    }
    const _onLoad = DataManager.onLoad;
    DataManager.onLoad = function(object) {
        _onLoad.call(this, object);
        if (object === $dataMap && $dataMap && D.maps[loadingId]) {
            try { reshape($dataMap, D.maps[loadingId]); $dataMap._gory = loadingId; } catch (e) { console.error("[Gory] " + e.message); }
        }
    };
    const inBand = (M, x, y) => {
        const pn = M.przelecz.n || [0, 0], ps = M.przelecz.s || [0, 0];
        if (y < M.n[x]) return !(x >= pn[0] && x < pn[1]);
        if (y >= M.s[x]) return !(x >= ps[0] && x < ps[1]);
        return false;
    };
    // the events standing in the band (rock needles, the trees on the old cliffs): out of sight under the mountains
    const _setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _setupEvents.call(this);
        const M = D.maps[this.mapId()];
        if (!M) return;
        for (const ev of this.events()) if (ev && inBand(M, ev.x, ev.y)) { ev.setTransparent(true); ev.setThrough(true); ev._gory = true; }
    };
    // ---- the pictures: one sprite a mountain, in the tilemap with the characters (sorted by the foot)
    const file = k => D.files[k];
    function Sprite_Gora(p) {
        Sprite.call(this, ImageManager.loadPicture("gory/" + file(p[0])));
        this._p = p;
        this.anchor.set(0, 1);
        this.scale.set(p[3], p[3]);
        this.z = 3;
        this.spriteId = -7;
        if (p[5] === 1) this.setBlendColor([176, 196, 222, 96]);   // (the far row: hazy, bluish - far away)
    }
    Sprite_Gora.prototype = Object.create(Sprite.prototype);
    Sprite_Gora.prototype.constructor = Sprite_Gora;
    Sprite_Gora.prototype.update = function() {
        const p = this._p, b = this.bitmap;
        if (!b || !b.isReady()) { this.visible = false; return; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const x = p[1] - $gameMap.displayX() * tw, bottom = p[2] + b.height * p[3] - $gameMap.displayY() * th;
        this.x = Math.round(x); this.y = Math.round(bottom);
        this.visible = x < Graphics.width && x + b.width * p[3] > 0 && bottom > 0 && bottom - b.height * p[3] < Graphics.height;
    };
    const _createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _createCharacters.call(this);
        const M = D.maps[$gameMap.mapId()];
        this._gory = [];
        if (!M) return;
        for (const p of M.p) { const s = new Sprite_Gora(p); this._gory.push(s); this._tilemap.addChild(s); }
    };
    // (the pictures load with the map's scene)
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        for (const k of Object.keys(D.files)) ImageManager.loadPicture("gory/" + D.files[k]);
    };
    // ---- the camera by the north ridge (the user, 2026-11-26: "kamera unosi się przy górach"): within LIFT.range tiles of the band's
    // foot the view rises smoothly, up to LIFT.max tiles above the map's top (FreeMovement.followHero asks cameraLift); above the map
    // the sky (its colour by the sun - Sky.js) and the far, hazy row of peaks
    const LIFT = { max: 4.5, range: 9 };
    const hasNorth = M => !!M && M.p.some(p => p[4] === "N");
    function cameraLift() {
        const M = D.maps[$gameMap.mapId()];
        if (!hasNorth(M) || $gameMap.isLoopVertical()) return 0;
        const p = $gamePlayer, x = Math.max(0, Math.min(M.n.length - 1, Math.round(p._realX)));
        const k = Math.max(0, Math.min(1, 1 - (p._realY - M.n[x]) / LIFT.range));
        return LIFT.max * k * k * (3 - 2 * k);
    }
    // the view may stand above the map's top on these maps (the engine holds it at 0)
    const _setDisplayPos = Game_Map.prototype.setDisplayPos;
    Game_Map.prototype.setDisplayPos = function(x, y) {
        _setDisplayPos.call(this, x, y);
        if (y < 0 && !this.isLoopVertical() && hasNorth(D.maps[this.mapId()])) { this._displayY = Math.max(-LIFT.max, y); this._parallaxY = this._displayY; }
    };
    const _scrollUp = Game_Map.prototype.scrollUp;
    Game_Map.prototype.scrollUp = function(distance) {
        if (!this.isLoopVertical() && hasNorth(D.maps[this.mapId()]) && this._displayY - distance < 0) {   // (his own step up: no jump back to 0)
            const last = this._displayY;
            this._displayY = Math.max(this._displayY - distance, Math.min(last, -LIFT.max));
            this._parallaxY += this._displayY - last;
            return;
        }
        _scrollUp.call(this, distance);
    };
    // the sky above the map's top: a gradient stretched over the band the view shows there
    const SKY = { day: [[93, 143, 201], [185, 214, 238]], gold: [[108, 127, 176], [240, 195, 143]], night: [[11, 20, 38], [29, 44, 72]] };
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    function skyColours() {
        let h = 30;
        try { const S = window.Sky; if (S && S.now) { const s = S.now(); h = typeof s.height === "number" ? s.height : (s.sky && s.sky.elev) || 30; } } catch (e) { /* (no sun: day) */ }
        if (h >= 15) return SKY.day;
        if (h >= 0) { const t = h / 15; return [mix(SKY.gold[0], SKY.day[0], t), mix(SKY.gold[1], SKY.day[1], t)]; }
        const t = Math.min(1, -h / 8);
        return [mix(SKY.gold[0], SKY.night[0], t), mix(SKY.gold[1], SKY.night[1], t)];
    }
    function Sprite_GoryNiebo() { Sprite.call(this, new Bitmap(4, 128)); this._key = ""; this.visible = false; }
    Sprite_GoryNiebo.prototype = Object.create(Sprite.prototype);
    Sprite_GoryNiebo.prototype.constructor = Sprite_GoryNiebo;
    Sprite_GoryNiebo.prototype.update = function() {
        const h = -$gameMap.displayY() * $gameMap.tileHeight();
        this.visible = h > 0.5;
        if (!this.visible) return;
        if (Graphics.frameCount % 30 === 0 || !this._key) {
            const [top, low] = skyColours(), key = top.join() + "|" + low.join();
            if (key !== this._key) {
                this._key = key;
                const b = this.bitmap, g = b.context.createLinearGradient(0, 0, 0, 128);
                g.addColorStop(0, "rgb(" + top.join(",") + ")"); g.addColorStop(1, "rgb(" + low.join(",") + ")");
                b.context.fillStyle = g; b.context.fillRect(0, 0, 4, 128); b._baseTexture.update();
            }
        }
        this.x = 0; this.y = 0;
        this.scale.set(Graphics.width / 4 + 1, h / 128);
    };
    const _createParallax = Spriteset_Map.prototype.createParallax;
    Spriteset_Map.prototype.createParallax = function() {
        _createParallax.call(this);
        if (hasNorth(D.maps[$gameMap.mapId()])) { this._goryNiebo = new Sprite_GoryNiebo(); this._baseSprite.addChild(this._goryNiebo); }
    };
    const api = { data: D, inBand: (x, y) => { const M = D.maps[$gameMap.mapId()]; return !!M && inBand(M, x, y); }, PASS_EDGE, LIFT, cameraLift };
    window.Gory = T && T.register ? T.register("Gory", api) : api;
})();
