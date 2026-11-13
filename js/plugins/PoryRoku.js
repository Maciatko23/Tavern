//=============================================================================
// PoryRoku.js
//=============================================================================
// Pory roku widać (gracz 2026-11-09: „jesień nie ma różnic?”): trawa, krzaki, bluszcz i korony drzew w kolorach pory roku - gotowe
// obrazki z tools/klimat/pory_roku.py (arkusze kafli <nazwa>_wiosna / _jesien / _zima, drzewa-postacie <nazwa>_wiosna / _jesien1-3 /
// _zima), tu tylko podmiana:
//   - kafle: Game_Map.tileset() oddaje na tę porę kopię zestawu z nazwami arkuszy pory (Spriteset_Map sam przeładowuje mapę kafli, gdy
//     zestaw się zmieni; TerenKit, Laka, Klimat_Miasta i inne czytające arkusze dostają te same obrazki);
//   - drzewa: duszek postaci dostaje arkusz pory (jesienią jeden z trzech: złoty, pomarańczowy, rdzawy - stały dla drzewa); wydarzenie
//     zostaje z własną grafiką (ścinanie, pniak, owoce, zapis bez zmian);
//   - jesienią z koron liściastych drzew na ekranie spadają liście, z wiatrem (Storm.wind).
// Lato = oryginał. Pora roku: Tawerna.time.season() (z nadpisaniem z F9 „Pora roku”). Load order: after Klimat_Detale.

/*:
 * @target MZ
 * @plugindesc Pory roku widać: trawa, krzaki i korony drzew wiosną świeże, jesienią złote i rdzawe, zimą blade i ze śniegiem na liściach; jesienią spadają liście. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Klimat_Detale
 *
 * @help
 * Bez ustawień. Obrazki robi tools/klimat/pory_roku.py (po zmianie arkuszy kafli albo drzew uruchomić znowu).
 * Wyłączenie do porównań: window.PORY_ROKU = { off: true } przed wczytaniem gry.
 * API: PoryRoku.info() - pora, podmienione arkusze, liście (testy).
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("PoryRoku.js: brak TawernaCore.js");
    const PLUGIN = "PoryRoku";
    const OFF = !!(window.PORY_ROKU && window.PORY_ROKU.off);
    // <PORY_DANE> (tools/klimat/pory_roku.py)
    const SHEETS = {"Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_A2_green": [0, 2, 3], "Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_A2_2_green": [0, 2, 3], "Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_A5_green": [0, 2, 3], "Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_A4_green": [0, 2, 3], "Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_B_green": [0, 2, 3], "Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_D_green": [0, 2, 3]};
    const CHARS = {"!$Big_Trees_scinane": {"s0": 1, "s2": 3, "s3": 1, "crown": [[137, 229, 61], [179, 274, 53], null, [40, 122, 60], null, [137, 231, 58], null, null, null, null, null, null]}, "!$Big_Trees_green": {"s0": 1, "s2": 3, "s3": 1, "crown": [[137, 229, 61], [179, 274, 53], null, [40, 122, 60], null, [137, 231, 58], null, null, null, null, null, null]}, "!$Tree_Apple": {"s0": 1, "s2": 3, "s3": 1, "crown": [[81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52], [81, 169, 52]]}, "!$Tree_Pear": {"s0": 1, "s2": 3, "s3": 1, "crown": [[70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51], [70, 161, 51]]}, "!$Tree_FruitBare": {"s0": 1, "s2": 3, "s3": 1, "crown": [[75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51], [75, 169, 51]]}, "!$Tree_Small": {"s0": 0, "s2": 0, "s3": 1, "crown": null}, "!$Pine_A": {"s0": 0, "s2": 0, "s3": 1, "crown": null}, "!$Pine_B": {"s0": 0, "s2": 0, "s3": 1, "crown": null}, "!$Pine_C": {"s0": 0, "s2": 0, "s3": 1, "crown": null}, "!$Bush_Flower_Blue": {"s0": 1, "s2": 3, "s3": 1, "crown": null}, "!$Bush_Clover": {"s0": 1, "s2": 3, "s3": 1, "crown": null}};
    // </PORY_DANE>
    const SUF = ["_wiosna", "", "_jesien", "_zima"];
    const season = () => (T.time && T.time.season ? T.time.season() : 1);
    const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0); };

    // ------------------------------------------------------------------ 1. the tile sheets
    // Only what is DRAWN gets the season's sheets: Game_Map.tileset() gives the season's copy while the map's pictures are made and
    // updated (the spriteset: the tilemap, Ziemia's edges, Laka, GroundDetail, the tile events...) and the plain tileset to the game's
    // logic (Farming tells soil from grass by the tile's pixels: a pale winter grass must stay diggable). The copy has an id of its own
    // ("11_jesien"), so caches keyed by the tileset's id (Farming's soil per tile) keep the logic's and the pictures' answers apart.
    const _tileset = Game_Map.prototype.tileset;
    const tsCache = new Map();
    let visual = 0, seasonAt = -1, seasonForced = null, seasonNow = 1;
    const seasonFrame = () => {
        if (seasonAt !== Graphics.frameCount || seasonForced !== T.time.forced) { seasonAt = Graphics.frameCount; seasonForced = T.time.forced; seasonNow = season(); }
        return seasonNow;
    };
    Game_Map.prototype.tileset = function() {
        const ts = _tileset.call(this);
        if (OFF || visual <= 0 || !ts || !ts.tilesetNames) return ts;
        const s = seasonFrame();
        if (s === 1) return ts;
        const key = ts.id + ":" + s;
        const c = tsCache.get(key);
        if (c && c.src === ts) return c.ts;
        const names = ts.tilesetNames.map(n => (SHEETS[n] && SHEETS[n].indexOf(s) >= 0 ? n + SUF[s] : n));
        const out = names.some((n, k) => n !== ts.tilesetNames[k]) ? Object.assign({}, ts, { id: ts.id + SUF[s], tilesetNames: names }) : ts;
        tsCache.set(key, { src: ts, ts: out });
        return out;
    };
    const asVisual = fn => function() { visual++; try { return fn.apply(this, arguments); } finally { visual--; } };
    for (const m of ["createLowerLayer", "update", "loadTileset"]) Spriteset_Map.prototype[m] = asVisual(Spriteset_Map.prototype[m]);
    // the season changes while the hero stays on the map (midnight at a season's edge, a night's sleep across it, the F9 switch): the
    // tilemap takes the new sheets and the meadow / soft-edge pictures are made again (their keys hold the season)
    const _ssUpdate = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _ssUpdate.call(this);
        const s = season();
        if (this._prSeason === undefined) { this._prSeason = s; return; }
        if (s === this._prSeason) return;
        // (Ziemia's soft edges are made with the map: on its maps the map is loaded again in place - not in the middle of an event)
        const zi = window.Ziemia && Ziemia.here && Ziemia.here();
        if (zi && ($gameMap.isEventRunning() || $gamePlayer.isTransferring())) return;
        this._prSeason = s;
        if (zi && Ziemia.reload) { Ziemia.reload(); return; }
        visual++;
        try {
            this.loadTileset();
            if (window.Laka && Laka.redo) Laka.redo();
        } finally { visual--; }
    };
    Sprite_Character.prototype.tilesetBitmap = asVisual(Sprite_Character.prototype.tilesetBitmap);
    // (Ziemia and Laka paint the screen's cells while it is still black - in Scene_Map.isReady: that too; the map's own loading in it,
    // onMapLoaded - the transfer, the events' setup - is the game's logic: the plain tileset there)
    Scene_Map.prototype.isReady = asVisual(Scene_Map.prototype.isReady);
    const _onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() { const v = visual; visual = 0; try { return _onMapLoaded.apply(this, arguments); } finally { visual = v; } };

    // ------------------------------------------------------------------ 2. the trees' pictures
    function seasonName(ch, name) {
        const c = CHARS[name], s = season();
        if (!c || s === 1) return name;
        if (s === 0) return c.s0 ? name + "_wiosna" : name;
        if (s === 3) return c.s3 ? name + "_zima" : name;
        if (!c.s2) return name;
        const k = ch instanceof Game_Event ? hash(ch._mapId || $gameMap.mapId(), ch._eventId) % c.s2 : 0;
        return name + "_jesien" + (k + 1);
    }
    if (!OFF) T.sprite.hook({ owner: PLUGIN, method: "updateBitmap", when: s => !!(s._character && CHARS[s._character.characterName()]),
        after(s) {
            if (s._tileId > 0 || !s._characterName || !CHARS[s._characterName]) return;
            const want = seasonName(s._character, s._characterName);
            // (the shadow's soft copy of the season's sheet - ChoppableTree_Render withSoftShade - counts as that sheet: no swapping back
            // and forth every frame, each swap reset the frame to the whole sheet - 2026-11-11)
            const cur = s.bitmap && s.bitmap._softOf ? s.bitmap._softOf : s.bitmap;
            if (s._prWant === want && s._prBmp === cur) return;
            if (want !== s._characterName || (s._prBmp && s._prBmp === cur)) s.bitmap = ImageManager.loadCharacter(want);
            s._prWant = want; s._prBmp = s.bitmap;
        } });

    // ------------------------------------------------------------------ 3. autumn: falling leaves
    const LEAF = 12, MAX_LEAVES = 22;
    let set = null, tm = null, leafBmp = null, leaves = [], spawnT = 0, crownCache = new Map();
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        set = this; tm = this._tilemap; leaves = []; crownCache.clear();
        leafBmp = OFF ? null : ImageManager.loadSystem("PoryRoku_Liscie");
    };
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.call(this);
        if (OFF || set !== this) return;
        try { fall(); } catch (e) { if (!failed++) console.warn("[PoryRoku] " + (e && e.message)); }
    };
    let failed = 0;
    const outdoors = () => (window.Survival && Survival.isOutdoors ? Survival.isOutdoors() : true);
    function crownOf(ev) {   // the crown box of a leafy tree event (px above its foot, half width), or null
        const name = ev.characterName(), c = CHARS[name];
        if (!c || !c.crown || ev._treeGone || ev._erased) return null;
        const big = /^[!]*\$/.test(name), row = (ev.direction() / 2) - 1, col = big ? ev.pattern() : ev.pattern();
        const k = name + "|" + row + "|" + col, hit = crownCache.get(k);
        if (hit !== undefined) return hit;
        const box = c.crown[row * 3 + col] || null;
        crownCache.set(k, box);
        return box;
    }
    function scaleOf(ev) {
        if (ev._prScale === undefined) { const m = ((ev.event && ev.event() && ev.event().note) || "").match(/scale=([\d.]+)/); ev._prScale = m ? Number(m[1]) : 1; }
        return ev._prScale;
    }
    function fall() {
        const on = season() === 2 && outdoors() && $gameMap.isValid && leafBmp && leafBmp.isReady();
        if (!on) { if (leaves.length) { for (const l of leaves) if (l.s.parent) l.s.parent.removeChild(l.s); leaves = []; } return; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), ox = $gameMap.displayX(), oy = $gameMap.displayY();
        const vw = Graphics.width / tw, vh = Graphics.height / th;
        const wind = window.Storm && Storm.wind ? Storm.wind() : 0.2;
        // new leaves: from a crown on the screen, a few a second (more in the wind)
        if (--spawnT <= 0) {
            spawnT = Math.max(6, Math.round(26 - 30 * wind));
            if (leaves.length < MAX_LEAVES) {
                const trees = $gameMap.events().filter(e => e._realX > ox - 2 && e._realX < ox + vw + 2 && e._realY > oy - 1 && e._realY < oy + vh + 6 && crownOf(e));
                if (trees.length) {
                    const e = trees[Math.floor(Math.random() * trees.length)], b = crownOf(e), sc = scaleOf(e);
                    const x = (e._realX + 0.5) * tw + (Math.random() * 2 - 1) * b[2] * sc * 0.85;
                    const up = (b[0] + Math.random() * (b[1] - b[0]) * 0.8) * sc;
                    const s = new Sprite(leafBmp); s.anchor.set(0.5, 0.5); s.z = 6;
                    const col = Math.floor(Math.random() * 4);
                    leaves.push({ s, x, y: (e._realY + 1) * th - up, ground: (e._realY + 1) * th - 4 + Math.random() * 18, vy: 0.35 + Math.random() * 0.35,
                        ph: Math.random() * 6.28, col, f: Math.floor(Math.random() * 4), t: 0, life: 0 });
                    tm.addChild(s);
                }
            }
        }
        for (let i = leaves.length - 1; i >= 0; i--) {
            const l = leaves[i];
            l.t++;
            if (l.y < l.ground) {
                l.y += l.vy; l.x += Math.sin(l.t * 0.045 + l.ph) * 0.55 + wind * 1.1;
                if (l.t % 9 === 0) l.f = (l.f + 1) % 4;
            } else l.life++;
            const fade = l.life > 0 ? Math.max(0, 1 - l.life / 150) : Math.min(1, l.t / 12);
            l.s.setFrame(l.f * LEAF, l.col * LEAF, LEAF, LEAF);
            l.s.x = Math.round(l.x - ox * tw); l.s.y = Math.round(l.y - oy * th);
            l.s.opacity = Math.round(255 * fade);
            if (fade <= 0 || l.s.x < -40 || l.s.x > Graphics.width + 40 || l.s.y > Graphics.height + 60) { if (l.s.parent) l.s.parent.removeChild(l.s); leaves.splice(i, 1); }
        }
    }

    // What lies on the ground is the game's logic, not a picture: the drawing layer (Farming_Render's Sprite_StoneLayer.rebuild runs inside
    // the spriteset's update, i.e. with the season's sheets) must ask Farming with the plain sheets, as picking does - else in spring
    // ~30 stones/herbs/branches were drawn on tiles the plain grass test says hold nothing (2026-11-12, craft_test).
    if (!OFF && window.Farming) for (const name of ["gatherSpot", "gatherAt", "stoneSpot", "stoneAt"]) {
        const f = window.Farming[name];
        if (typeof f === "function") window.Farming[name] = function() { const v = visual; visual = 0; try { return f.apply(this, arguments); } finally { visual = v; } };
    }

    window.PoryRoku = {
        // fn run with the plain (summer) sheets - for telling what a tile IS (grass, soil) while the picture is the season's
        plain: fn => { const v = visual; visual = 0; try { return fn(); } finally { visual = v; } },
        swapped: () => !!(window.$gameMap && $gameMap.tileset && $dataTilesets && $gameMap.tileset() !== $dataTilesets[$gameMap.tilesetId()]),
        info: () => ({ season: season(), sheets: set && set._tilemap ? set._tilemap._bitmaps.map(m => (m && m._url ? decodeURIComponent(m._url).split('/').pop() : '')) : [], leaves: leaves.length,
            trees: SceneManager._scene && SceneManager._scene._spriteset ? SceneManager._scene._spriteset._characterSprites.filter(s => s._prWant && s._prWant !== s._characterName).length : 0 }),
        seasonName
    };
})();
