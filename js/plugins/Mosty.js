//=============================================================================
// Mosty.js
//=============================================================================
// (2026-11-13, the user on the new Podgrodzie: „znajdź sposób, żeby się szło na moście i pod mostem”) A bridge has two levels: its deck
// over the riverbed, and the bed under it. The bridge's cells are painted with one region (default 4) over its whole footprint - deck
// and rails. The hero is ON the bridge when he came onto it by one of its ENDS (the bank at the deck's short sides) and UNDER it when
// he came in from a SIDE (along the bed). On the deck: the deck's tiles (layers 1-3: planks open, rails shut) decide where he may go,
// he leaves only by the ends - and the bank's rim there does not hold him (the one-way edge of an A5 rim). Under it: only the ground
// (layer 0) counts - the bed is open, the stone face under the deck's ends is not, the banks' rims keep him in the bed as everywhere;
// the deck's tiles are lifted over him (the tilemap's upper layer) while he is under, so the bridge covers him.
// A bridge runs north-south when its footprint is taller than wide (else east-west). Only the hero has the two levels; the others keep
// the tiles' own rules. The hero's level is kept on him ($gamePlayer._most) and forgotten when he leaves the bridge or the map.
// For FreeMovement.js (pixel walking): hooks Game_Player.freeTileBlocked / freeBlocker; for the drawing Tilemap._addSpot/_addSpotTile.

/*:
 * @target MZ
 * @plugindesc Mosty dwupoziomowe: po pomoście chodzi się górą (wejście końcami mostu), korytem pod spodem (wejście z boku) - pomost zasłania wtedy bohatera. Region mostu na mapie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter FreeMovement
 * @orderAfter RegionLayers
 *
 * @param region
 * @text Region mostu
 * @desc Region pomalowany na całym obrysie mostu (pomost i barierki). 0 = wyłączone.
 * @type number
 * @min 0
 * @max 255
 * @default 4
 *
 * @help
 * Mosty.js - mosty, po których chodzi się górą i pod którymi przechodzi się dołem
 *
 * Jak zrobić most w edytorze: ułóż pomost (np. deski A2 nad korytem) z barierkami
 * po bokach i pomaluj CAŁY obrys mostu (pomost + barierki) regionem 4.
 * Most dłuższy w pionie biegnie północ-południe (wchodzi się od góry i od dołu),
 * dłuższy w poziomie - wschód-zachód (wchodzi się z lewej i z prawej).
 *  - Wejście końcem mostu: bohater idzie po pomoście (barierki trzymają go na nim).
 *  - Wejście z boku (korytem): bohater idzie pod mostem; liczy się tylko grunt
 *    pod spodem (kafle warstwy 1), pomost rysuje się nad nim.
 * Inne postacie chodzą jak dotąd (według kafli).
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    const params = PluginManager.parameters("Mosty");
    const REGION = Number(params.region !== undefined && params.region !== "" ? params.region : 4) || 0;
    if (!REGION || !Game_Player.prototype.freeTileBlocked) return;   // (needs FreeMovement.js above it)

    // ------------------------------------------------------------------
    // The map's bridges: connected cells of the region (once per map data)
    // ------------------------------------------------------------------
    let G = null;
    function bridges() {
        if (G && G.data === $dataMap) return G;
        const W = $gameMap.width(), H = $gameMap.height(), idx = new Int16Array(W * H).fill(-1), list = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (idx[y * W + x] >= 0 || $gameMap.regionId(x, y) !== REGION) continue;
            const b = { i: list.length, x0: x, y0: y, x1: x, y1: y }, stack = [[x, y]];
            idx[y * W + x] = b.i;
            while (stack.length) {
                const [cx, cy] = stack.pop();
                if (cx < b.x0) b.x0 = cx; if (cx > b.x1) b.x1 = cx; if (cy < b.y0) b.y0 = cy; if (cy > b.y1) b.y1 = cy;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H || idx[ny * W + nx] >= 0 || $gameMap.regionId(nx, ny) !== REGION) continue;
                    idx[ny * W + nx] = b.i; stack.push([nx, ny]);
                }
            }
            b.ns = b.y1 - b.y0 >= b.x1 - b.x0;
            list.push(b);
        }
        // (gracz 2026-11-13: „gracz na słupkach mostu stoi”) the picture's rails over the banks (its OVER rows past each end): those bank
        // cells under a rail are shut for everyone, the planks between them stay open
        const rails = new Set();
        for (const b of list) if (hasPic(b)) for (let k = 1; k <= OVER; k++) for (const y of [b.y0 - k, b.y1 + k]) { rails.add(y * W + b.x0); rails.add(y * W + b.x1); }
        return (G = { data: $dataMap, W, idx, list, rails });
    }
    function bridgeAt(x, y) {
        const g = bridges();
        if (!g.list.length || x < 0 || y < 0 || x >= g.W || y >= $gameMap.height()) return null;
        const i = g.idx[y * g.W + x];
        return i >= 0 ? g.list[i] : null;
    }
    const railAt = (x, y) => { const g = bridges(); return g.rails.size > 0 && g.rails.has(y * g.W + x); };
    const _Game_Map_checkPassage = Game_Map.prototype.checkPassage;
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        if ($dataMap && railAt(x, y)) return false;
        return _Game_Map_checkPassage.call(this, x, y, bit);
    };
    const inside = (b, x, y) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
    // off the bridge through one of its ends (the deck's short sides)
    const throughEnd = (b, x, y) => (b.ns ? x >= b.x0 && x <= b.x1 && (y < b.y0 || y > b.y1) : y >= b.y0 && y <= b.y1 && (x < b.x0 || x > b.x1));
    // the edge the feet come in by (2 bottom, 4 left, 6 right, 8 top): by an end of the bridge -> on it, by a side -> under it
    const entryLevel = (b, edge) => (b.ns ? (edge === 8 || edge === 2) : (edge === 4 || edge === 6)) ? "gora" : "dol";

    // the engine's rule over some of the cell's layers (top first, star tiles skipped, the bit of the side asked)
    function layersOpen(x, y, edge, layers) {
        const flags = $gameMap.tilesetFlags(), bit = edge ? (1 << (edge / 2 - 1)) & 0x0f : 0x0f;
        for (const z of layers) {
            const t = $gameMap.tileId(x, y, z);
            if (!t) continue;
            const f = flags[t] | 0;
            if (f & 0x10) continue;
            if (!edge) return (f & 0x0f) !== 0x0f;
            if ((f & bit) === 0) return true;
            if ((f & bit) === bit) return false;
        }
        return true;
    }
    const deckOpen = (x, y, edge) => [3, 2, 1].some(z => $gameMap.tileId(x, y, z)) ? layersOpen(x, y, edge, [3, 2, 1]) : layersOpen(x, y, edge, [0]);
    const groundOpen = (x, y, edge) => layersOpen(x, y, edge, [0]);

    // the hero's level now ({ b, lv } or null): kept only while he is on that bridge of this map
    function levelOf(p) {
        const m = p._most;
        if (!m || m.map !== $gameMap.mapId()) return null;
        const b = bridges().list[m.b];
        return b ? { b, lv: m.lv } : null;
    }

    // ------------------------------------------------------------------
    // Walking (FreeMovement.js)
    // ------------------------------------------------------------------
    const _freeTileBlocked = Game_Player.prototype.freeTileBlocked;
    Game_Player.prototype.freeTileBlocked = function(x, y, edge) {
        if (this.isThrough() || this.isDebugThrough()) return _freeTileBlocked.call(this, x, y, edge);
        x = $gameMap.roundX(x); y = $gameMap.roundY(y);
        const b = bridgeAt(x, y), cur = levelOf(this);
        if (!b && !cur) return _freeTileBlocked.call(this, x, y, edge);
        if (!$gameMap.isValid(x, y)) return true;
        if (b) {
            const lv = cur && cur.b === b ? cur.lv : entryLevel(b, edge);
            if (lv === "gora" ? !deckOpen(x, y, edge) : !groundOpen(x, y, edge)) return true;
            return this.isCollidedWithCharacters(x, y);
        }
        if (cur.lv === "gora") {
            if (!throughEnd(cur.b, x, y) || railAt(x, y)) return true;          // (off the deck by a side: the rails)
            if (!layersOpen(x, y, 0, [3, 2, 1, 0])) return true;                // (the bank by the end: its rim's one-way edge does not count)
            return this.isCollidedWithCharacters(x, y);
        }
        return _freeTileBlocked.call(this, x, y, edge);                         // (under it: off by any side as the ground there allows - a bank's rim keeps him in the bed)
    };
    // the rim of the bank at a deck's end: FreeMovement keeps the feet on an A5 rim's top (its shut side) - not when they step onto the
    // deck from it, or back onto it from the deck (the deck lies level with the bank)
    const _freeBlocker = Game_Player.prototype.freeBlocker;
    Game_Player.prototype.freeBlocker = function(fx, fy, fromX, fromY) {
        const hit = _freeBlocker.call(this, fx, fy, fromX, fromY);
        if (!hit || this.isThrough() || this.isDebugThrough()) return hit;
        const cur = levelOf(this);
        if (!bridgeAt(hit.x, hit.y) && !cur) return hit;
        // the same walk as FreeMovement's: the cells of a bridge (and the bank by the end of the deck the hero is on) by the bridge's
        // rules alone; any other cell as FreeMovement decided (its first blocker), the ones after it by the tile rules
        const FM = window.FreeMovement, from = FM.feetBox(fromX, fromY), to = FM.feetBox(fx, fy);
        for (let y = to.y0; y <= to.y1; y++) for (let x = to.x0; x <= to.x1; x++) {
            if (x >= from.x0 && x <= from.x1 && y >= from.y0 && y <= from.y1) continue;
            const edge = x > from.x1 ? 4 : x < from.x0 ? 6 : y > from.y1 ? 8 : 2;
            const rx = $gameMap.roundX(x), ry = $gameMap.roundY(y);
            const ours = !!bridgeAt(rx, ry) || (cur && cur.lv === "gora" && throughEnd(cur.b, rx, ry));
            if (!ours && rx === hit.x && ry === hit.y) return hit;
            if (this.freeTileBlocked(rx, ry, edge)) return { x: rx, y: ry };
        }
        return null;
    };

    // the level: set when the feet first touch a bridge (by its end -> on it, by its side -> under it), forgotten off it
    function updateLevel(p) {
        const FM = window.FreeMovement, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const box = FM.feetBox(Math.round(p._realX * tw), Math.round(p._realY * th));
        let b = null;
        for (let y = box.y0; y <= box.y1 && !b; y++) for (let x = box.x0; x <= box.x1 && !b; x++) b = bridgeAt($gameMap.roundX(x), $gameMap.roundY(y));
        const cur = levelOf(p);
        if (!b) { if (p._most) p._most = null; return; }
        if (cur && cur.b === b) return;
        let lv = null;
        for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
            if (inside(b, x, y)) continue;
            lv = throughEnd(b, x, y) ? "gora" : "dol";
        }
        if (!lv) { const cx = Math.floor(p._realX + 0.5), cy = Math.floor(p._realY + 0.5); lv = groundOpen(cx, cy, 0) ? "dol" : "gora"; }   // (put there: a load, a transfer)
        p._most = { map: $gameMap.mapId(), b: b.i, lv };
    }
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        if (bridges().list.length) updateLevel(this); else if (this._most) this._most = null;
    };

    // ------------------------------------------------------------------
    // Drawing: while the hero is under a bridge its deck and rails go to the tilemap's upper layer (over him)
    // ------------------------------------------------------------------
    // (2026-11-13, the user: „da się ten most zrobić ładniejszy, bardziej profesjonalny, naturalny?”) a north-south bridge 5 cells wide
    // is drawn as one picture (img/system/Most_Deski.png, 5 x 7 cells: planks across, log beams, railings - its top 2 and bottom 2 rows
    // kept, the middle rows repeated or dropped for the bridge's length) with a soft shadow on the bed; its own deck and rail tiles are
    // then not drawn at all (they still decide the walking). The picture lies under the people (z 0.95) and goes over them (z 4.6) while
    // the hero is under it. Other bridges: the tiles, lifted over him as before.
    // (the user: „pamiętaj, że most musi trochę wchodzić na wzgórze”) the picture reaches one cell further onto the bank at each end than
    // the bridge's cells (only drawn there: the bank's own cells keep their rules)
    const PIC = "Most_Deski", PIC_W = 5, PIC_END = 2, OVER = 1;
    const hasPic = b => b.ns && b.x1 - b.x0 + 1 === PIC_W;
    let lifted = -1;
    const _Tilemap_addSpot = Tilemap.prototype._addSpot;
    Tilemap.prototype._addSpot = function(startX, startY, x, y) {
        const mx = startX + x, my = startY + y;
        this._mostId0 = -1; this._mostSkip = false;
        if (this._readMapData(mx, my, 5) === REGION) {
            const b = bridgeAt(mx, my);
            if (b && hasPic(b)) { this._mostId0 = this._readMapData(mx, my, 0); this._mostSkip = true; }
            else if (b && b.i === lifted) this._mostId0 = this._readMapData(mx, my, 0);
        }
        _Tilemap_addSpot.call(this, startX, startY, x, y);
        this._mostId0 = -1; this._mostSkip = false;
    };
    const _Tilemap_addSpotTile = Tilemap.prototype._addSpotTile;
    Tilemap.prototype._addSpotTile = function(tileId, dx, dy) {
        if (this._mostId0 >= 0 && tileId > 0 && tileId !== this._mostId0) { if (!this._mostSkip) this._addTile(this._upperLayer, tileId, dx, dy); }
        else _Tilemap_addSpotTile.call(this, tileId, dx, dy);
    };
    // the picture for a bridge of h cells: the source's ends kept, its middle rows repeated (or fewer of them)
    function picFor(src, h) {
        const tw = 48, w = PIC_W * tw, sh = src.height / tw, bm = new Bitmap(w, h * tw);
        const end = Math.min(PIC_END, Math.floor(h / 2)), mid = sh - 2 * PIC_END;
        bm.blt(src, 0, 0, w, end * tw, 0, 0);
        for (let r = end; r < h - end; r++) bm.blt(src, 0, (PIC_END + (r - end) % mid) * tw, w, tw, 0, r * tw);
        bm.blt(src, 0, (sh - end) * tw, w, end * tw, 0, (h - end) * tw);
        return bm;
    }
    function shadowFor(w, h) {   // a soft dark band round the deck's right and lower side (light from the top-left)
        const bm = new Bitmap(w + 40, h + 40), c = bm.context;
        c.filter = "blur(7px)";
        c.fillStyle = "rgba(20,14,8,0.5)";
        c.fillRect(20 + 16, 20 + 12, w - 22, h - 14);
        c.filter = "none";
        bm._baseTexture.update();
        return bm;
    }
    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._mosty = [];
        const list = bridges().list.filter(hasPic);
        if (!list.length) return;
        const src = ImageManager.loadSystem(PIC);
        for (const b of list) {
            const h = b.y1 - b.y0 + 1 + 2 * OVER, sh = new Sprite(shadowFor(PIC_W * 48, h * 48)), sp = new Sprite();
            sh.z = 0.93; sp.z = 0.95;
            src.addLoadListener(() => { sp.bitmap = picFor(src, h); });
            this._tilemap.addChild(sh); this._tilemap.addChild(sp);
            this._mosty.push({ b, sh, sp });
        }
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        const cur = $gameMap && $dataMap ? levelOf($gamePlayer) : null, want = cur && cur.lv === "dol" ? cur.b.i : -1;
        if (want !== lifted) { lifted = want; if (this._tilemap) this._tilemap.refresh(); }
        if (this._mosty && this._mosty.length) {
            const tw = $gameMap.tileWidth(), dx = $gameMap.displayX() * tw, dy = $gameMap.displayY() * tw;
            for (const m of this._mosty) {
                const x = Math.round(m.b.x0 * tw - dx), y = Math.round((m.b.y0 - OVER) * tw - dy);
                m.sp.x = x; m.sp.y = y; m.sh.x = x - 20; m.sh.y = y - 20;
                m.sp.z = want === m.b.i ? 4.6 : 0.95;
            }
        }
    };

    // ------------------------------------------------------------------
    // (2026-11-13, the user: „czy mieszkańcy faktycznie się ruszają?”) everyone else over the bridges: the residents (TownLife) and the
    // animals walk ON the deck only - along it, between the rails, from one end to the other (a bank's rim at an end does not stop them);
    // never into a bridge from its side, never along the bed under it (they would be drawn over the deck). The engine's step check
    // (Game_CharacterBase.isMapPassable, not the hero's: FreeMovement + the rules above) and the path grid of Hunting_Path.js (it asks
    // $gameMap.isPassable with npcGrid on) both by this rule.
    // ------------------------------------------------------------------
    function bridgeStep(x, y, d) {   // true / false for a step of a non-hero from (x, y) in direction d touching a bridge; null: not ours
        if (!$dataMap || !(d === 2 || d === 4 || d === 6 || d === 8)) return null;
        const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
        const b0 = bridgeAt(x, y), b1 = bridgeAt(x2, y2), b = b0 || b1;
        if (!b) return null;
        if (b0 && b1 && b0 !== b1) return false;
        const along = b.ns ? (d === 2 || d === 8) : (d === 4 || d === 6);
        const lane = b.ns ? (x > b.x0 && x < b.x1) : (y > b.y0 && y < b.y1);   // (the deck between the rails)
        if (!along || !lane) return false;
        if (b1) return !railAt(x2, y2);
        return !railAt(x2, y2) && layersOpen(x2, y2, 0, [3, 2, 1, 0]);          // (off the end onto the bank)
    }
    let npcGrid = false;
    const _Game_Map_isPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d) {
        if (npcGrid) { const r = bridgeStep(x, y, d); if (r !== null) return r; }
        return _Game_Map_isPassable.call(this, x, y, d);
    };
    const _Game_CharacterBase_isMapPassable = Game_CharacterBase.prototype.isMapPassable;
    Game_CharacterBase.prototype.isMapPassable = function(x, y, d) {
        if (!(this instanceof Game_Player) && !(this instanceof Game_Follower)) { const r = bridgeStep(x, y, d); if (r !== null) return r; }
        return _Game_CharacterBase_isMapPassable.call(this, x, y, d);
    };

    // (2026-11-19) for a path planner (the story autopilot, tests/autopilot/ap.js): one step of the HERO by the rules above, his level
    // carried by the planner - 0 on the ground or under a bridge, 1 on a deck. -> null when no bridge is in the step (the engine's own
    // rule applies); else { ok, lv }: may he, and his level after it. Characters in the way are the planner's business.
    function heroStep(x, y, d, lv) {
        if (!$dataMap || !(d === 2 || d === 4 || d === 6 || d === 8)) return null;
        const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d), edge = 10 - d;
        const from = bridgeAt(x, y), b = bridgeAt(nx, ny);
        if (!b && !from) return null;
        if (!$gameMap.isValid(nx, ny)) return { ok: false, lv };
        if (b) {
            const level = from === b ? (lv === 1 ? "gora" : "dol") : entryLevel(b, edge);
            return { ok: level === "gora" ? deckOpen(nx, ny, edge) : groundOpen(nx, ny, edge), lv: level === "gora" ? 1 : 0 };
        }
        if (lv === 1) return { ok: throughEnd(from, nx, ny) && !railAt(nx, ny) && layersOpen(nx, ny, 0, [3, 2, 1, 0]), lv: 0 };   // (off the deck: by its ends only)
        return { ok: !railAt(nx, ny) && layersOpen(nx, ny, edge, [3, 2, 1, 0]), lv: 0 };   // (from under it: off by a side as the ground there allows)
    }

    const api = {
        REGION,
        heroStep,
        npcGrid: v => { npcGrid = !!v; },   // (Hunting_Path.js: on while it reads the map's passage into its grid)
        step: bridgeStep,
        at: (x, y) => !!($gameMap && $dataMap && bridgeAt(x, y)),   // (a cell of a bridge: Klimat_Pogoda leaves no footprints there)
        list: () => bridges().list.map(b => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, ns: b.ns })),
        level: () => { const c = levelOf($gamePlayer); return c ? c.lv : null; }
    };
    window.Mosty = T && T.register ? T.register("Mosty", api) : api;
})();
