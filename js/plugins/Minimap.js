//=============================================================================
// Minimap.js
//=============================================================================
// Load order: independent HUD sprite (not part of the particle/lighting z-stack), but must load before Atmosphere.js, which reads Minimap.groundColourAt().

/*:
 * @target MZ
 * @plugindesc Minimapa w prawym górnym rogu (teren, drzewa, skały, budynki, gracz, wyjścia). Pod nią okienko z celem z dziennika. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @param maxWidth
 * @text Największa szerokość mapki (px)
 * @type number
 * @min 60
 * @default 208
 *
 * @param maxHeight
 * @text Największa wysokość mapki (px)
 * @type number
 * @min 40
 * @default 150
 *
 * @param top
 * @text Odstęp od góry ekranu (px)
 * @desc Domyślnie w samym rogu, jak odstęp z boku (przycisku menu na mapie nie ma - MenuPanel.js).
 * @type number
 * @default 12
 *
 * @param margin
 * @text Odstęp od prawej krawędzi (px)
 * @type number
 * @default 12
 *
 * @param hideIfMapFits
 * @text Ukryj na mapach, które mieszczą się na ekranie
 * @desc Małe wnętrza widać w całości, więc mapka nic by nie dodała.
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Minimap.js
 * ============================================================================
 * Mała mapa całego terenu w prawym górnym rogu ekranu (pod przyciskiem menu):
 *   - teren jest rysowany w kolorach kafelków mapy,
 *   - drzewa (ciemna zieleń), krzaki, skały i żyły rudy, kłody i pieńki,
 *     skrzynie (złote), postacie (żółte) i wyjścia do innych map (białe),
 *   - budynki i pola gracza (Farming.js): stoiska brązowe, place budowy
 *     jako ramka, uprawy zielone,
 *   - gracz jako migający znacznik, a jasna ramka pokazuje, co widać na ekranie.
 * Klawisz M chowa i pokazuje mapkę (zapamiętane w zapisie gry).
 * Pod mapką stoi okienko z bieżącym celem z dziennika (Journal.js). Na mapach
 * bez mapki (małe wnętrza) okienko z celem zajmuje jej miejsce.
 *
 * Notatka mapy <Minimap:off> wyłącza mapkę na tej mapie, <Minimap:on> włącza ją
 * także wtedy, gdy mapa mieści się na ekranie.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Minimap.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const pluginName = "Minimap";
    const params = PluginManager.parameters(pluginName);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const MAX_W = num(params.maxWidth, 208);
    const MAX_H = num(params.maxHeight, 150);
    const TOP = num(params.top, 12);
    const MARGIN = num(params.margin, 12);
    const HIDE_IF_FITS = params.hideIfMapFits !== "false";
    const PANEL_W = MAX_W + 8;   // the frame around the map
    const PAD = 4;
    const GAP = 6;               // between the map and the goal window

    Input.keyMapper[77] = "minimap";   // M

    const TILE = 48;

    // ------------------------------------------------------------------
    // The colour of a tile: the average of its picture (the plain fill piece of an autotile)
    // ------------------------------------------------------------------
    function tileSample(id) {
        if (Tilemap.isTileA5(id)) {
            const i = id - Tilemap.TILE_ID_A5;
            return { set: 4, x: (i % 8) * TILE, y: Math.floor(i / 8) * TILE };
        }
        if (id < Tilemap.TILE_ID_A5) {
            return { set: 5 + Math.floor(id / 256), x: ((Math.floor(id / 128) % 2) * 8 + (id % 8)) * TILE, y: (Math.floor((id % 256) / 8) % 16) * TILE };
        }
        const kind = Tilemap.getAutotileKind(id), tx = kind % 8, ty = Math.floor(kind / 8);
        let set, bx, by, ox = 24, oy = 72;   // block position (in tiles) and the offset of the centre piece in it
        if (Tilemap.isTileA1(id)) {
            set = 0;
            if (kind === 0) { bx = 0; by = 0; } else if (kind === 1) { bx = 0; by = 3; } else if (kind === 2) { bx = 6; by = 0; } else if (kind === 3) { bx = 6; by = 3; }
            else { bx = Math.floor(tx / 4) * 8 + (kind % 2 === 1 ? 6 : 0); by = ty * 6 + (Math.floor(tx / 2) % 2) * 3; }
        } else if (Tilemap.isTileA2(id)) {
            set = 1; bx = tx * 2; by = (ty - 2) * 3;
        } else if (Tilemap.isTileA3(id)) {
            set = 2; bx = tx * 2; by = (ty - 6) * 2; oy = 24;
        } else {
            set = 3; bx = tx * 2; by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
            if (ty % 2 === 1) oy = 24;
        }
        return { set, x: bx * TILE + ox, y: by * TILE + oy };
    }
    const colourCache = {};
    // null while the picture is still loading
    function tileColour(id, bitmaps) {
        if (colourCache[id] !== undefined && colourCache[id].tileset === $gameMap.tilesetId()) return colourCache[id].c;
        const s = tileSample(id), bmp = bitmaps[s.set];
        if (!bmp) { colourCache[id] = { tileset: $gameMap.tilesetId(), c: false }; return false; }
        if (!bmp.isReady()) return null;
        let data;
        try {
            data = bmp.context.getImageData(Math.max(0, Math.min(bmp.width - TILE, s.x)), Math.max(0, Math.min(bmp.height - TILE, s.y)), TILE, TILE).data;
        } catch (e) {
            colourCache[id] = { tileset: $gameMap.tilesetId(), c: false };
            return false;
        }
        let r = 0, g = 0, b = 0, a = 0;
        for (let i = 0; i < data.length; i += 4) {
            const al = data[i + 3];
            r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al;
        }
        const c = a > 0 ? { r: Math.round(r / a), g: Math.round(g / a), b: Math.round(b / a), a: a / (TILE * TILE * 255) } : false;
        colourCache[id] = { tileset: $gameMap.tilesetId(), c };
        return c;
    }

    // ------------------------------------------------------------------
    // What an event is, for the dots on the map
    // ------------------------------------------------------------------
    const eventKinds = {};
    const hasTransfer = data => data.pages.some(p => p.list.some(c => c.code === 201));
    function kindOf(ev) {
        const d = ev.event();
        if (!d) return null;   // (an event without data: nothing to draw)
        const note = d.note || "", name = ev.characterName(), tile = ev.tileId();
        if (!name && !tile) return null;
        const graphic = name || "";
        if (tile) return /<(Tree|Stump)/i.test(note) ? "stump" : null;
        if (/<Tree/i.test(note) || /Sosn|Drzew|Dąb|Brzoz/i.test(d.name)) return "tree";
        if (/<Bush/i.test(note) || /^!\$Bush_/.test(graphic)) return "bush";
        if (/<Rock/i.test(note) || /^!\$(Rock_|Boulder_)/.test(graphic)) return /Ore_Iron/.test(graphic) ? "ore" : "rock";
        if (/<Log/i.test(note)) return "log";
        if (/skrzyni/i.test(d.name)) return "chest";
        const key = $gameMap.mapId() + ":" + d.id;
        if (eventKinds[key] === undefined) eventKinds[key] = hasTransfer(d);
        if (eventKinds[key]) return "exit";
        if (graphic && !/^!/.test(graphic)) return "npc";
        return null;
    }
    const DOT = {
        tree: "#1d5c34", bush: "#4a9a48", rock: "#a8a8ac", ore: "#c8763a", log: "#8a5a2b", stump: "#6b4a2a",
        chest: "#e8c458", npc: "#ffd866", exit: "#ffffff"
    };

    // ------------------------------------------------------------------
    // The sprite
    // ------------------------------------------------------------------
    // the frame: the panel of the windows (UITheme.js's window.UIStyle), a plain dark plate without it
    function roundedPanel(w, h) {
        const bmp = new Bitmap(w, h), ctx = bmp.context;
        if (window.UIStyle) UIStyle.panel(ctx, 0, 0, w, h, { cut: 6 });
        else { ctx.fillStyle = "rgba(11,12,15,0.9)"; ctx.fillRect(0, 0, w, h); }
        bmp._baseTexture.update();
        return bmp;
    }
    function markerBitmap() {
        const bmp = new Bitmap(11, 11), ctx = bmp.context;
        ctx.fillStyle = "#0b0c0f";
        ctx.beginPath(); ctx.moveTo(5.5, 0); ctx.lineTo(11, 5.5); ctx.lineTo(5.5, 11); ctx.lineTo(0, 5.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffd23f";
        ctx.beginPath(); ctx.moveTo(5.5, 2); ctx.lineTo(9, 5.5); ctx.lineTo(5.5, 9); ctx.lineTo(2, 5.5); ctx.closePath(); ctx.fill();
        bmp._baseTexture.update();
        return bmp;
    }

    function Sprite_Minimap() {
        this.initialize(...arguments);
    }
    Sprite_Minimap.prototype = Object.create(Sprite.prototype);
    Sprite_Minimap.prototype.constructor = Sprite_Minimap;

    Sprite_Minimap.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._mapId = 0;
        this._scale = 1;
        this._panelH = 0;
        this._terrain = null;
        this._composite = null;
        this._painted = false;
        this._wanted = false;
        this._frame = new Sprite();
        this._map = new Sprite();
        this._view = new Sprite();
        this._me = new Sprite(markerBitmap());
        this._me.anchor.set(0.5, 0.5);
        for (const child of [this._frame, this._map, this._view, this._me]) this.addChild(child);
        this.visible = false;
    };

    // does this map get a minimap at all?
    Sprite_Minimap.prototype.wantedOnMap = function() {
        const forced = T.mapFlag("Minimap", null);   // <Minimap:on> / <Minimap:off> in the map's note
        if (forced !== null) return forced;
        if (!HIDE_IF_FITS) return true;
        return $gameMap.width() > $gameMap.screenTileX() + 0.01 || $gameMap.height() > $gameMap.screenTileY() + 0.01;
    };

    Sprite_Minimap.prototype.rebuild = function() {
        this._mapId = $gameMap.mapId();
        this._wanted = this.wantedOnMap();
        this._painted = false;
        const w = $gameMap.width(), h = $gameMap.height();
        this._scale = Math.max(1, Math.min(6, Math.floor(Math.min(MAX_W / w, MAX_H / h))));
        const mw = w * this._scale, mh = h * this._scale;
        this._panelH = mh + PAD * 2;
        this._terrain = new Bitmap(mw, mh);
        this._composite = new Bitmap(mw, mh);
        this._frame.bitmap = roundedPanel(PANEL_W, this._panelH);
        this._map.bitmap = this._composite;
        this._map.x = Math.floor((PANEL_W - mw) / 2);
        this._map.y = PAD;
        // the frame showing what the screen sees
        const vw = Math.max(4, Math.round($gameMap.screenTileX() * this._scale)), vh = Math.max(4, Math.round($gameMap.screenTileY() * this._scale));
        const vb = new Bitmap(vw + 2, vh + 2), c = vb.context;
        c.strokeStyle = "rgba(255,255,255,0.75)";
        c.lineWidth = 1;
        c.strokeRect(1, 1, vw, vh);
        vb._baseTexture.update();
        this._view.bitmap = vb;
        this.x = Graphics.width - PANEL_W - MARGIN;
        this.y = TOP;
    };

    Sprite_Minimap.prototype.paintTerrain = function() {
        const spriteset = SceneManager._scene && SceneManager._scene._spriteset;
        const bitmaps = spriteset && spriteset._tilemap && spriteset._tilemap._bitmaps;
        if (!bitmaps) return false;
        if (bitmaps.some(b => b && !b.isReady())) return false;
        const S = this._scale, ctx = this._terrain.context;
        this._terrain.clear();
        ctx.fillStyle = "#1c2a1c";
        ctx.fillRect(0, 0, this._terrain.width, this._terrain.height);
        for (let y = 0; y < $gameMap.height(); y++) {
            for (let x = 0; x < $gameMap.width(); x++) {
                for (let z = 0; z < 4; z++) {
                    const id = $gameMap.tileId(x, y, z);
                    if (!Tilemap.isVisibleTile(id)) continue;
                    const c = tileColour(id, bitmaps);
                    if (!c || c.a < 0.12) continue;
                    ctx.fillStyle = "rgba(" + c.r + "," + c.g + "," + c.b + "," + Math.min(1, c.a).toFixed(2) + ")";
                    ctx.fillRect(x * S, y * S, S, S);
                }
            }
        }
        this._terrain._baseTexture.update();
        return true;
    };

    // the terrain plus everything that changes: trees that fall, buildings, fields
    Sprite_Minimap.prototype.paintOverlay = function() {
        const S = this._scale, bmp = this._composite, ctx = bmp.context;
        bmp.clear();
        bmp.blt(this._terrain, 0, 0, this._terrain.width, this._terrain.height, 0, 0);
        const rect = (x, y, w, h, colour) => { ctx.fillStyle = colour; ctx.fillRect(Math.round(x * S), Math.round(y * S), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S))); };
        const farm = ($gameSystem && $gameSystem._farm) || null, mapId = $gameMap.mapId();
        if (farm && farm.plots && farm.plots[mapId]) {
            for (const [k, p] of Object.entries(farm.plots[mapId])) {
                if (!p.crop && p.s !== "tilled" && p.s !== "raked") continue;
                const [x, y] = k.split(",").map(Number);
                rect(x, y, 1, 1, p.crop ? "#7bd254" : p.s === "tilled" ? "#6d4a2c" : "#a07a52");
            }
        }
        const dot = (ev, colour, inset) => rect(ev._realX + inset, ev._realY + inset, 1 - inset * 2, 1 - inset * 2, colour);
        for (const ev of $gameMap.events()) {
            if (ev._erased) continue;
            const kind = kindOf(ev);
            if (!kind) continue;
            if (kind === "exit") {
                ctx.strokeStyle = DOT.exit;
                ctx.lineWidth = 1;
                ctx.strokeRect(Math.round(ev._realX * S) + 0.5, Math.round(ev._realY * S) + 0.5, Math.max(2, S - 1), Math.max(2, S - 1));
            } else {
                dot(ev, DOT[kind], kind === "tree" ? 0 : 0.12);
            }
        }
        if (farm && farm.buildings && farm.buildings[mapId]) {
            const defs = (window.Farming && Farming.BUILDINGS) || {};
            for (const b of farm.buildings[mapId]) {
                const g = window.Farming && Farming.geoOf ? Farming.geoOf(b) : defs[b.type] || { w: 1 };
                const w = g.w || 1, h = g.h || 1, top = b.y - h + 1;   // the building stands on its bottom row and reaches up
                if (b.site) {
                    ctx.strokeStyle = "#e8c458";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(Math.round(b.x * S) + 0.5, Math.round(top * S) + 0.5, Math.max(2, w * S - 1), Math.max(2, h * S - 1));
                } else if (g.yard) {   // a yard: the fence is drawn as an outline, the hut as a filled block
                    ctx.strokeStyle = "#d2a866";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(Math.round(b.x * S) + 0.5, Math.round(top * S) + 0.5, Math.max(2, w * S - 1), Math.max(2, h * S - 1));
                    rect(b.x + g.yard.hut.dx, b.y - g.yard.hut.dy - g.yard.hut.h + 1, g.yard.hut.w, g.yard.hut.h, "#d2a866");
                } else {
                    rect(b.x, top, w, h, b.type === "campfire" || b.type === "tripod" ? "#ff9a3c" : "#d2a866");
                }
            }
        }
        bmp._baseTexture.update();
    };

    Sprite_Minimap.prototype.isShown = function() {
        return this._wanted && !($gameSystem && $gameSystem._minimapHidden);
    };

    Sprite_Minimap.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameMap || !$dataMap || !$gamePlayer) return;
        if ($gameMap.mapId() !== this._mapId) this.rebuild();
        if (Input.isTriggered("minimap") && this._wanted && !$gameMessage.isBusy() && !$gameMap.isEventRunning()) {
            $gameSystem._minimapHidden = !$gameSystem._minimapHidden;
        }
        this.visible = this.isShown();
        if (!this.visible) return;
        if (!this._painted) {
            if (!this.paintTerrain()) { this._me.visible = this._view.visible = false; return; }
            this._painted = true;
            this._sinceOverlay = 999;
        }
        this._sinceOverlay = (this._sinceOverlay || 0) + 1;
        if (this._sinceOverlay >= 20) {
            this._sinceOverlay = 0;
            this.paintOverlay();
        }
        const S = this._scale, ox = this._map.x, oy = this._map.y;
        this._me.visible = this._view.visible = true;
        this._me.x = ox + ($gamePlayer._realX + 0.5) * S;
        this._me.y = oy + ($gamePlayer._realY + 0.5) * S;
        this._me.alpha = 0.65 + 0.35 * Math.abs(Math.sin(Graphics.frameCount / 18));
        const zoom = $gameScreen.zoomScale();
        this._view.x = ox + $gameMap.displayX() * S - 1;
        this._view.y = oy + $gameMap.displayY() * S - 1;
        this._view.scale.set(1 / zoom, 1 / zoom);
    };

    // where the goal window goes: right under the map, or in the map's place when there is none
    Sprite_Minimap.prototype.panelRect = function() {
        return { x: Graphics.width - PANEL_W - MARGIN, y: TOP, w: PANEL_W, h: this.visible ? this._panelH : 0, shown: this.visible };
    };

    const _createSurvivalHud = Scene_Map.prototype.createSurvivalHud;
    Scene_Map.prototype.createSurvivalHud = function() {
        _createSurvivalHud.call(this);
        this._minimap = new Sprite_Minimap();
        (this._hudLayer || this).addChild(this._minimap);
    };

    window.Minimap = {
        rect() {
            const scene = SceneManager._scene, m = scene && scene._minimap;
            return m ? m.panelRect() : { x: Graphics.width - PANEL_W - MARGIN, y: TOP, w: PANEL_W, h: 0, shown: false };
        },
        gap: GAP,
        // the average colour of the ground at a tile ({r,g,b,a} or null): Atmosphere.js listens to it for the footsteps
        groundColourAt(x, y) {
            const scene = SceneManager._scene, sp = scene && scene._spriteset, bitmaps = sp && sp._tilemap && sp._tilemap._bitmaps;
            if (!bitmaps || !$gameMap.isValid(x, y)) return null;
            for (const z of [1, 0]) {
                const id = $gameMap.tileId(x, y, z);
                if (!Tilemap.isVisibleTile(id)) continue;
                const c = tileColour(id, bitmaps);
                if (c && c.a >= 0.5) return c;
            }
            return null;
        },
        toggle() { if ($gameSystem) $gameSystem._minimapHidden = !$gameSystem._minimapHidden; }
    };
})();
