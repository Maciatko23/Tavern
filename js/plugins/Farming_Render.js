//=============================================================================
// Farming_Render.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Rysowanie dla Farming.js: tekstury ziemi i płotu, warstwa upraw i zbieractwa, widmo stawianego budynku, poświata ogniska, warstwa nocy i sprite'y budynków. v1.0.0
 * @author Claude
 * @orderAfter Farming
 *
 * @help
 * ============================================================================
 * Farming_Render.js
 * ============================================================================
 * Czysta warstwa rysująca dla Farming.js: nie trzyma żadnego stanu gry, tylko czyta
 * dane z Farming.js (przez obiekt Farming, np. Farming.geoOf, Farming.BUILDINGS) i rysuje.
 * Wydzielona z Farming.js 2026-09-22, żeby ten plik nie rósł dalej w jeden 4000-liniowy
 * plik: logika (uprawy, budowanie, warsztaty, skrzynie, menu) w Farming.js, rysowanie tutaj.
 * Musi się ładować zaraz po Farming.js (stąd @orderAfter) - nie działa bez niego.
 * ============================================================================
 */

(() => {
    "use strict";

    // draw order (Sprite.z, used by the tilemap/spriteset to sort everything that shares a parent).
    // Kept as one small table instead of scattered numbers so a glance here shows the whole stack,
    // ground to sky. ChoppableTree.js keeps its own copy (see the note there) with the same numbers.
    const Z = {
        ground: 1,        // farm layer: soil patches and crops, above the ground tiles, below the characters
        litter: 1.5,       // gathered stones/plants lying on the ground, over the soil, under the characters
        footprint: 2,      // building site markers and the ground shadow under a building, under the characters
        tileGrid: 2.35,    // the "?" alignment grid, over the ground, under the characters and the build placer
        buildGhost: 2.4,   // build-mode grid + coloured tile overlay, over the ground, under the characters
        withCharacters: 3, // sorted with the characters: buildings, fences, flames, hanging food, the placement ghost
        smoke: 4,          // rising smoke puffs, above the buildings
        readyBadge: 5      // the finished-product icon over a station, above everything else on the ground
    };

    // build (once) and cache a bitmap - or an array of bitmaps, e.g. flame animation frames - under
    // `key` in `cache` (a Map). buildFn does the actual drawing and returns the result; sites that draw
    // with raw context calls (ctx.fillRect/putImageData) instead of Bitmap's own methods (fillRect,
    // blt, ...), which sync the GPU texture themselves, still need this to pick up their pixels.
    function cachedBitmap(cache, key, buildFn) {
        const cached = cache.get(key);
        if (cached !== undefined) return cached;
        const result = buildFn();
        if (result && result._baseTexture && result._baseTexture.update) result._baseTexture.update();
        cache.set(key, result);
        return result;
    }

    // smooth value noise, so the edges of a patch wave instead of jittering pixel by pixel
    function vnoise(x, salt) {
        const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
        return Farming.hash2(i, salt, 7) * (1 - t) + Farming.hash2(i + 1, salt, 7) * t;
    }
    function vnoise2(x, y, salt) {
        const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
        const tx = fx * fx * (3 - 2 * fx), ty = fy * fy * (3 - 2 * fy);
        const top = Farming.hash2(i, j, salt) * (1 - tx) + Farming.hash2(i + 1, j, salt) * tx;
        const bottom = Farming.hash2(i, j + 1, salt) * (1 - tx) + Farming.hash2(i + 1, j + 1, salt) * tx;
        return top * (1 - ty) + bottom * ty;
    }

    // neighbour bits: N 1, E 2, S 4, W 8, NE 16, SE 32, SW 64, NW 128
    // depth of the pixel below the ragged edge of the patch (< 0 = outside).
    // The edge is measured in world pixels along the side, so it runs on smoothly from tile to tile.
    function soilDepth(px, py, n, wx, wy) {
        let depth = 99;
        const inset = (a, salt) => 2 + 5.5 * vnoise(a / 11, salt) + 1.1 * Farming.hash2(a, salt, 3);
        if (!(n & 1)) depth = Math.min(depth, py - inset(wx, 11));
        if (!(n & 4)) depth = Math.min(depth, Farming.TILE - 1 - py - inset(wx, 12));
        if (!(n & 8)) depth = Math.min(depth, px - inset(wy, 13));
        if (!(n & 2)) depth = Math.min(depth, Farming.TILE - 1 - px - inset(wy, 14));
        const corner = (open, cx, cy) => {   // outer corner (both sides open): rounded
            if (!open) return;
            const dx = cx === 0 ? 12 - px : px - (Farming.TILE - 13), dy = cy === 0 ? 12 - py : py - (Farming.TILE - 13);
            if (dx > 0 && dy > 0) depth = Math.min(depth, 9 - Math.hypot(dx, dy) + 2);
        };
        corner(!(n & 1) && !(n & 8), 0, 0);
        corner(!(n & 1) && !(n & 2), 1, 0);
        corner(!(n & 4) && !(n & 2), 1, 1);
        corner(!(n & 4) && !(n & 8), 0, 1);
        const bite = (open, cx, cy) => {   // inner corner: the diagonal neighbour is missing
            if (open) depth = Math.min(depth, Math.hypot(px - cx, py - cy) - 5.5);
        };
        bite((n & 1) && (n & 8) && !(n & 128), 0, 0);
        bite((n & 1) && (n & 2) && !(n & 16), Farming.TILE - 1, 0);
        bite((n & 4) && (n & 2) && !(n & 32), Farming.TILE - 1, Farming.TILE - 1);
        bite((n & 4) && (n & 8) && !(n & 64), 0, Farming.TILE - 1);
        return depth;
    }

    const SOIL = {
        cleared: { a: [124, 94, 63], b: [140, 107, 73], c: [108, 81, 54], pebble: [168, 150, 126], root: [92, 68, 46], rim: [72, 52, 34] },
        raked: { a: [130, 99, 67], b: [153, 118, 82], c: [102, 76, 49], rim: [72, 52, 34] },
        tilled: { crest: [126, 87, 56], mid: [98, 66, 42], trough: [68, 45, 29], rim: [58, 39, 26] },
        yard: { rim: [66, 56, 44] }
    };
    const GRASS_EDGE = { dark: [34, 84, 46], mid: [60, 136, 66], light: [98, 172, 86] };

    // a small stone lying on the ground (3x2 px, light from the upper left), or null
    function pebbleAt(wx, wy) {
        const cx = Math.floor(wx / 12), cy = Math.floor(wy / 12);
        if (Farming.hash2(cx, cy, 5) < 0.8) return null;
        const dx = wx - (cx * 12 + 2 + Math.floor(Farming.hash2(cx, cy, 6) * 7)), dy = wy - (cy * 12 + 2 + Math.floor(Farming.hash2(cx, cy, 8) * 7));
        if (dx >= 0 && dx < 3 && dy >= 0 && dy < 2) return dy === 1 ? [104, 88, 70] : dx === 0 ? [176, 158, 134] : [146, 128, 106];
        if (dx >= 1 && dx < 4 && dy === 2) return [78, 58, 40];
        return null;
    }

    // a tuft of grass left growing on bare ground (3 px wide, 3 px tall), or null
    function tuftAt(wx, wy) {
        const cx = Math.floor(wx / 16), cy = Math.floor(wy / 16);
        if (Farming.hash2(cx, cy, 15) < 0.9) return null;
        const dx = wx - (cx * 16 + 2 + Math.floor(Farming.hash2(cx, cy, 16) * 11)), dy = wy - (cy * 16 + 2 + Math.floor(Farming.hash2(cx, cy, 17) * 10));
        if (dx < 0 || dx > 2 || dy < 0 || dy > 2) return null;
        if (dy === 2) return dx === 1 ? GRASS_EDGE.dark : null;
        return (dx + dy) % 2 === 0 ? GRASS_EDGE.mid : GRASS_EDGE.light;
    }

    // cobbled yard: irregular flagstones with dark joints, lit from the upper left
    const YARD_CELL = 11;
    function yardColour(wx, wy) {
        const cx = Math.floor(wx / YARD_CELL), cy = Math.floor(wy / YARD_CELL);
        let d1 = 1e9, d2 = 1e9, fx = 0, fy = 0, id = 0;
        for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
                const gx = cx + i, gy = cy + j;
                const sx = gx * YARD_CELL + 1.5 + Farming.hash2(gx, gy, 21) * (YARD_CELL - 3);
                const sy = gy * YARD_CELL + 1.5 + Farming.hash2(gx, gy, 22) * (YARD_CELL - 3);
                const d = Math.hypot(wx + 0.5 - sx, wy + 0.5 - sy);
                if (d < d1) { d2 = d1; d1 = d; fx = sx; fy = sy; id = Farming.hash2(gx, gy, 23); }
                else if (d < d2) d2 = d;
            }
        }
        if (d2 - d1 < 1.7) return [88, 76, 61];                      // joint
        const tones = [[156, 142, 120], [144, 130, 109], [164, 150, 126]];
        const t = tones[Math.floor(id * 3)], lit = (wx - fx) + (wy - fy);
        const k = lit < -4 ? 14 : lit > 5 ? -16 : 0;
        const speck = Farming.hash2(wx, wy, 24) > 0.94 ? -10 : 0;
        return [t[0] + k + speck, t[1] + k + speck, t[2] + k + speck];
    }

    function soilColour(state, px, py, wx, wy) {
        if (state === "yard") return yardColour(wx, wy);
        const tuft = state === "cleared" ? tuftAt(wx, wy) : null;
        if (tuft) return tuft;
        const n1 = Farming.hash2(wx, wy, 1), broad = vnoise2(wx / 9, wy / 9, 2);
        if (state === "cleared") {
            const s = SOIL.cleared;
            const stone = pebbleAt(wx, wy);
            if (stone) return stone;
            if (n1 > 0.992) return s.pebble;
            if (Farming.hash2(wx >> 1, wy >> 1, 4) > 0.955) return s.root;
            const base = broad > 0.62 ? s.b : broad < 0.34 ? s.c : s.a;
            if (n1 > 0.965) return [base[0] + 14, base[1] + 12, base[2] + 10];
            if (n1 < 0.05) return [base[0] - 12, base[1] - 10, base[2] - 8];
            return base;
        }
        if (state === "raked") {
            const s = SOIL.raked;
            const line = (px + Math.round(vnoise(wy / 15, 31) * 2) + (broad > 0.9 ? 1 : 0)) & 3;   // slightly wavy rake marks
            if (line === 0) return s.c;
            if (line === 1) return s.b;
            return n1 > 0.92 ? s.c : broad > 0.7 ? s.b : s.a;
        }
        const s = SOIL.tilled, r = (py + 3 + Math.round(vnoise(wx / 17, 41) * 2)) % 12;
        if (r < 3) return n1 > 0.8 ? s.mid : s.crest;
        if (r < 5) return s.mid;
        if (r < 9) return n1 > 0.85 ? s.mid : s.trough;
        return s.mid;
    }

    // colour of a pixel near the edge of a patch: the dark rim, tufts of grass leaning in over it,
    // and a darker band just inside, so that the patch does not end like a cut-out
    function edgeColour(state, depth, wx, wy, base) {
        const rim = SOIL[state].rim, g = GRASS_EDGE;
        const cell = Farming.hash2(Math.floor(wx / 3), Math.floor(wy / 3), 9);
        const clump = cell < 0.34, len = 1.2 + 3 * Farming.hash2(Math.floor(wx / 3), Math.floor(wy / 3), 10);
        if (depth < 1) return clump ? g.dark : rim;
        if (clump && depth < len) return depth < 1.9 ? g.mid : g.light;
        if (depth < 3.2) return [base[0] * 0.86, base[1] * 0.86, base[2] * 0.86];
        return null;
    }

    const soilCache = new Map();
    function soilTexture(state, tx, ty, n) {
        const k = state + ":" + tx + "," + ty + ":" + n;
        return cachedBitmap(soilCache, k, () => {
            const bitmap = new Bitmap(Farming.TILE, Farming.TILE);
            const ctx = bitmap.context, image = ctx.createImageData(Farming.TILE, Farming.TILE), data = image.data;
            const rim = SOIL[state].rim, clamp = v => Math.max(0, Math.min(255, Math.round(v)));
            for (let py = 0; py < Farming.TILE; py++) {
                for (let px = 0; px < Farming.TILE; px++) {
                    const wx = tx * Farming.TILE + px, wy = ty * Farming.TILE + py, depth = soilDepth(px, py, n, wx, wy);
                    const i = (py * Farming.TILE + px) * 4;
                    if (depth < -2.4) continue;
                    if (depth < 0) {   // soft fringe just outside the edge
                        data[i] = rim[0]; data[i + 1] = rim[1]; data[i + 2] = rim[2];
                        data[i + 3] = Math.round(70 * (depth + 2.4) / 2.4);
                        continue;
                    }
                    const base = soilColour(state, px, py, wx, wy);
                    const c = depth < 3.2 ? (edgeColour(state, depth, wx, wy, base) || base) : base;
                    data[i] = clamp(c[0]); data[i + 1] = clamp(c[1]); data[i + 2] = clamp(c[2]); data[i + 3] = 255;
                }
            }
            ctx.putImageData(image, 0, 0);
            return bitmap;
        });
    }

    // a pit left by the shovel (depth 1-3): a dark hole with the earth piled up around it, hard-edged like the rest of the ground.
    // quad ("tl"/"tr"/"bl"/"br"): this tile is one corner of a 2x2 block dug to the bottom, which merges into one big pit - the same
    // shape as a single pit but drawn twice as large and cropped to this tile's quadrant, so the four tiles tile together seamlessly.
    const pitCache = new Map();
    function pitTexture(depth, quad) {
        const cacheKey = depth + (quad || "");
        return cachedBitmap(pitCache, cacheKey, () => {
            const T = Farming.TILE, scale = quad ? 2 : 1, size = T * scale;
            const bitmap = new Bitmap(size, size), ctx = bitmap.context, image = ctx.createImageData(size, size), data = image.data;
            const rx = scale * (8 + 3 * depth), ry = scale * (5 + 2 * depth), cx = scale * 24, cy = scale * 25;
            for (let py = 0; py < size; py++) {
                for (let px = 0; px < size; px++) {
                    const e = Math.pow((px - cx) / rx, 2) + Math.pow((py - cy) / ry, 2);
                    const ring = Math.pow((px - cx + 1.5 * scale) / (rx + 4 * scale), 2) + Math.pow((py - cy + 1.5 * scale) / (ry + 3 * scale), 2);   // the heap is a little up and to the left
                    const i = (py * size + px) * 4;
                    let c = null;
                    if (e <= 1) {
                        const shade = Math.max(0, Math.min(1, (py - (cy - ry)) / (2 * ry)));   // dark under the upper rim, lighter at the bottom of the hole
                        const inner = e < 0.5 ? 0 : 1;
                        c = [46 + 34 * shade + 14 * inner, 29 + 22 * shade + 9 * inner, 16 + 12 * shade + 5 * inner];
                    } else if (ring <= 1) {
                        const crumb = ((px * 7 + py * 13) % 5 === 0) ? -22 : ((px * 3 + py * 5) % 4 === 0 ? 12 : 0);
                        const lit = (px < cx ? 10 : -6) + (py < cy ? 8 : -4);
                        c = [148 + crumb + lit, 104 + crumb + lit * 0.8, 64 + crumb * 0.7 + lit * 0.5];
                    }
                    if (!c) continue;
                    data[i] = Math.max(0, Math.min(255, Math.round(c[0]))); data[i + 1] = Math.max(0, Math.min(255, Math.round(c[1]))); data[i + 2] = Math.max(0, Math.min(255, Math.round(c[2]))); data[i + 3] = 255;
                }
            }
            ctx.putImageData(image, 0, 0);
            if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
            if (!quad) return bitmap;
            const qx = (quad === "tr" || quad === "br") ? T : 0, qy = (quad === "bl" || quad === "br") ? T : 0;
            const cropped = new Bitmap(T, T);
            cropped.blt(bitmap, qx, qy, T, T, 0, 0);
            return cropped;
        });
    }
    // greedily pairs up 2x2 blocks of depth-3 pits (top-left anchored, in reading order) into merged big-pit quadrants: key -> "tl"/"tr"/"bl"/"br"
    function mergedPitQuads(plots, covered) {
        const dug = Object.keys(plots).filter(k => !covered.has(k) && plots[k].dug === 3);
        const dugSet = new Set(dug), consumed = new Set(), quads = new Map();
        dug.sort((a, b) => { const [ax, ay] = a.split(",").map(Number), [bx, by] = b.split(",").map(Number); return ay - by || ax - bx; });
        for (const k of dug) {
            if (consumed.has(k)) continue;
            const [x, y] = k.split(",").map(Number);
            const corners = [k, Farming.key(x + 1, y), Farming.key(x, y + 1), Farming.key(x + 1, y + 1)];
            if (corners.every(kk => dugSet.has(kk) && !consumed.has(kk))) {
                ["tl", "tr", "bl", "br"].forEach((q, i) => quads.set(corners[i], q));
                corners.forEach(kk => consumed.add(kk));
            }
        }
        return quads;
    }

    // fence: a post with rails toward the neighbouring fences (N 1, E 2, S 4, W 8)
    const fenceCache = new Map();
    function fenceTexture(mask) {
        return cachedBitmap(fenceCache, mask, () => {
            const bitmap = new Bitmap(Farming.TILE, Farming.TILE), ctx = bitmap.context;
            const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
            const OUT = "#2a1a10", LIGHT = "#b98a55", MID = "#8f6539", DARK = "#5f3f24";
            rect(14, 33, 20, 5, "rgba(0,0,0,0.22)");   // shadow
            if (mask & 8) { rect(0, 18, 24, 4, OUT); rect(0, 19, 24, 2, LIGHT); rect(0, 27, 24, 4, OUT); rect(0, 28, 24, 2, MID); }
            if (mask & 2) { rect(24, 18, 24, 4, OUT); rect(24, 19, 24, 2, LIGHT); rect(24, 27, 24, 4, OUT); rect(24, 28, 24, 2, MID); }
            if (mask & 1) { rect(21, 0, 6, 20, OUT); rect(22, 0, 4, 20, MID); rect(22, 0, 1, 20, LIGHT); }
            if (mask & 4) { rect(21, 28, 6, 20, OUT); rect(22, 28, 4, 20, MID); rect(22, 28, 1, 20, LIGHT); }
            rect(19, 12, 10, 26, OUT);                    // post
            rect(20, 13, 8, 24, MID);
            rect(20, 13, 3, 24, LIGHT);
            rect(26, 13, 2, 24, DARK);
            rect(20, 13, 8, 2, "#d4a870");                // cap
            return bitmap;
        });
    }
    // which of a fence building's four neighbours (N 1, E 2, S 4, W 8) are also fences, so its texture
    // knows which rails to draw. Cached per (mapId, farm revision) so a rebuild pass that touches many
    // fence tiles scans the building list once, not once per tile.
    let fenceSetCache = null;
    function fenceNeighbours(mapId) {
        const key = mapId + ":" + Farming.farm().rev;
        if (!fenceSetCache || fenceSetCache.key !== key) {
            fenceSetCache = { key, set: new Set((Farming.farm().buildings[mapId] || []).filter(b => b.type === "fence").map(b => Farming.key(b.x, b.y))) };
        }
        return fenceSetCache.set;
    }
    function fenceMask(mapId, x, y) {
        const fences = fenceNeighbours(mapId);
        return (fences.has(Farming.key(x, y - 1)) ? 1 : 0) | (fences.has(Farming.key(x + 1, y)) ? 2 : 0) |
            (fences.has(Farming.key(x, y + 1)) ? 4 : 0) | (fences.has(Farming.key(x - 1, y)) ? 8 : 0);
    }

    // ---- the ground layer: soil patches and crops (below the characters)
    function Sprite_FarmLayer() {
        this.initialize(...arguments);
    }
    Sprite_FarmLayer.prototype = Object.create(Sprite.prototype);
    Sprite_FarmLayer.prototype.constructor = Sprite_FarmLayer;

    Sprite_FarmLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = Z.ground;   // above the ground tiles, below the characters
        this._entries = [];
        this._stamp = null;
        this._scrollKey = null;
    };

    Sprite_FarmLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const mapId = $gameMap.mapId();
        const stamp = mapId + ":" + Farming.farm().rev + ":" + Farming.today();
        if (stamp !== this._stamp) {
            this._stamp = stamp;
            this.rebuild(mapId);
            this._scrollKey = null;
        }
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
    };

    Sprite_FarmLayer.prototype.rebuild = function(mapId) {
        for (const e of this._entries) this.removeChild(e.sprite);
        this._entries = [];
        const plots = Farming.farm().plots[mapId] || {};
        // buildings stand on the natural ground: no soil patch (and no paving) under or behind them
        const covered = new Set();
        for (const b of Farming.farm().buildings[mapId] || []) for (const c of Farming.cellsOfGeo(Farming.geoOf(b), b.x, b.y)) covered.add(Farming.key(c.x, c.y));
        const has = (x, y) => !!plots[Farming.key(x, y)] && !covered.has(Farming.key(x, y));
        const crops = ImageManager.loadSystem("Farm_Crops");
        const pitQuads = mergedPitQuads(plots, covered);
        for (const k of Object.keys(plots)) {
            const [x, y] = k.split(",").map(Number), plot = plots[k];
            if (covered.has(k)) continue;
            let n = 0;
            [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8], [1, -1, 16], [1, 1, 32], [-1, 1, 64], [-1, -1, 128]].forEach(([dx, dy, bit]) => {
                if (has(x + dx, y + dy)) n |= bit;
            });
            const soil = new Sprite(soilTexture(plot.s, x, y, n));
            this._entries.push({ x, y, sprite: soil });
            this.addChild(soil);
            if (plot.dug) {
                const pit = new Sprite(pitTexture(plot.dug, pitQuads.get(k)));
                this._entries.push({ x, y, sprite: pit });
                this.addChild(pit);
            }
            if (plot.crop) {
                const stage = Farming.cropStage(x, y, plot), crop = new Sprite(crops);
                crop.setFrame(stage * Farming.TILE, Farming.CROPS[plot.crop].row * Farming.TILE, Farming.TILE, Farming.TILE);
                this._entries.push({ x, y, sprite: crop, dy: Farming.CROP_LIFT });
                this.addChild(crop);
            }
        }
    };

    Sprite_FarmLayer.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const e of this._entries) {
            e.sprite.x = Math.round($gameMap.adjustX(e.x) * tw);
            e.sprite.y = Math.round($gameMap.adjustY(e.y) * th) + (e.dy || 0);
        }
    };

    // ---- the things on the ground: pixel-art pebbles, flax, berries, mushrooms and herbs, above the soil, below the characters
    const GATHER_ART = {
        // o outline, l light, m mid, d dark, s shadow (stones); plants use their own letters below
        stone: { colours: { o: "#2e2c30", l: "#c4c4b8", m: "#8c8e8a", d: "#5e6060", s: "rgba(10,8,4,0.32)" }, shapes: [
            ["...oooooo...", "..ollllmmo..", ".ollllmmmmo.", ".olllmmmmddo", ".ommmmmmdddo", "..ommmmddoo.", "...oooooooo.", ".sssssssss.."],
            ["..ooooooooo..", ".ollllmmmmmo.", "olllmmmmmmddo", "ommmmmmmdddoo", ".oommmddooo..", "..sssoooss.s."],
            ["..ooo.......", ".ollmo.oo...", "olllmmoolmo.", "ommmddolmmdo", ".oooddommdo.", "..sssoosooo."]] },
        fiber: { colours: { g: "#4f9a4a", G: "#78c064", b: "#7ea6ff", w: "#f4f4ff", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["..b...b....", ".bwb.bwb....", "..g...g..b..", ".gG..gG.bwb.", ".g...g...g..", ".g..gG...g..", "gG.gG.g.gG..", "gGggGgggGg..", ".ssssssssss."],
            [".b....b...", "bwb..bwb..", ".g....g.b.", ".gG..gG.wb", ".g....g..g", "gG.gGg.gGg", "gGgggGgGg.", ".sssssss.."]] },
        berries: { colours: { o: "#1f3a22", g: "#3f7a3a", G: "#5fa050", r: "#d24a52", p: "#7a3f8a", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["...oooooo...", "..oggGGggo..", ".ogGrgGgpGo.", ".oGgGgrGgGo.", ".ogprgGgGgo.", "..oGgGpgGo..", "...oooooo...", "..ssssssss.."]] },
        // mushrooms and berry bushes are pictures made with PixelLab (img/system): five mushrooms; the bush: 0 blue berries, 1 red berries, 2 picked bare, 3 winter bare
        mushroom: { images: ["Gather_Mushroom_0", "Gather_Mushroom_1", "Gather_Mushroom_2", "Gather_Mushroom_3", "Gather_Mushroom_4"] },
        bush: { images: ["Gather_Bush_0", "Gather_Bush_1", "Gather_Bush_2", "Gather_Bush_3"] },
        branch: { colours: { o: "#33241a", b: "#8a6238", l: "#bd8e58", d: "#5e3f24", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["........oo..", "...oo..ollo.", "..olloolbbo.", "..obbllbddo.", ".oolbbblloo.", "ollbdddbbllo", "obbdoooddbbo", "oddo...ooddo", ".oo......oo.", ".sssssssss.."],
            ["..o........o", ".olo.....ool", ".oblooooollb", "oodblllllbbd", "llllbbbbbbbo", "bbbbblbbdddo", "dddddbdbloo.", "ooooododbo..", ".....o.odo..", ".sssssssss.."]] },
        herb: { colours: { g: "#3f8a44", G: "#6ec062", y: "#f0cc4e", Y: "#ffe98a", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["....y.y...", "...yYy.y..", "....g.....", ".g..g..g..", "gG.gg.gGg.", ".gGgGgGg..", "..gGgg....", "...gg.....", "..sssss..."]] },
        // the wild herbs: nettle (tall, dark serrated leaves), yarrow (white flat flower heads), wild garlic (broad leaves, white stars)
        nettle: { colours: { d: "#2c5a2a", g: "#3f7a38", G: "#5e9e48", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["....G.......", "...gGg...G..", "..gdGdg.gGg.", "...gGg.gdGdg", ".G..g...gGg.", "gGg.g.G..g..", "dGdgg.gGgg..", ".gGg.gdGdg..", "..g..g.gg...", "..g..g..g...", ".sssssssss.."],
            ["...G....", "..gGg...", ".gdGdg..", "..gGg.G.", "G..g.gGg", "Gg.gdGdg", "dGggGg..", ".gGg.g..", "..g..g..", ".ssssss."]] },
        yarrow: { colours: { w: "#f4f2e8", W: "#cfcab8", y: "#e8d890", g: "#4f8a44", G: "#6ea85a", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["..wWw....wWw", ".wwywW..wwyw", "..wWw....wW.", "...g..ww..g.", "...g.wywW.g.", "..Gg..wW..g.", "..g...g..Gg.", ".gG.g.gG.g..", "..gGg..gGg..", ".sssssssss.."]] },
        garlic: { colours: { G: "#7cc25a", g: "#4f9a3c", d: "#2f6a2a", w: "#ffffff", y: "#eeeebb", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["....w.w.....", "...wywyw....", "....www.....", "..G..g..G...", ".GGg.g.gGG..", ".GGg.g.gGG..", "..GGg.gGG...", "..dGGgGGd...", "...dGgGd....", ".sssssssss.."]] },
        // pine cones under the pines: two lying together, or one
        cone: { colours: { o: "#2e1c10", b: "#6e4220", B: "#9a6030", l: "#c89050", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["..oo........", ".oBBoo......", ".oblBBo.oo..", "..oBlbBooBo.", "...oobBolbBo", ".....oo.oBlo", "........ooo.", ".sssssssss.."],
            [".oo.....", "oBBoo...", "oblBBo..", ".oBlbBo.", "..oobBo.", "....oo..", ".ssssss."]] },
        // wild potatoes (a leafy clump with white flowers) and wild carrots (feathery tops, the orange shoulder of the root showing),
        // both on a little heap of earth
        wildPotato: { colours: { d: "#2f6a2a", g: "#4f9a3c", G: "#7cc25a", w: "#f4f2e8", y: "#f0d060", b: "#6e4a2c", B: "#8a6038", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["...w.......", "..wyw..w...", "...wgGwyw..", ".gGgGgGw...", "gGdGGgGGg..", ".gGdgGGdGg.", "..gGgdGgG..", ".bbgGgGgbb.", "bBbbBbbBbbB", ".sssssssss."],
            [".....w.....", "..w.wyw....", ".wyw.g.gG..", "..wgGgGgGg.", ".gGdGgGdGg.", "gGgGdgGGdg.", ".gdGgGgGg..", ".bbgGdGbb..", "bBbBbbbBbB.", ".ssssssss.."]] },
        wildCarrot: { colours: { g: "#4f9a3c", G: "#86c85e", o: "#c05a1c", O: "#f09030", b: "#6e4a2c", B: "#8a6038", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["..G...g.G..", ".gGg.gG.gG.", "..gGgGggG..", ".G.gGgGg.g.", ".gG.gGGg.G.", "...g.gg.gG.", ".....gg....", "....oOOo...", "..bboOOobb.", ".bBbbbbBbbB", ".sssssssss."],
            [".g.G..G....", "gGg.gGg.G..", ".gGgGgGgG..", "..gGgGg....", "...gGg.....", "....gg.....", "...oOOo....", ".bboOOobb..", "bBbbbbBbbB.", ".sssssssss."]] }
    };
    const gatherBitmaps = new Map();
    function gatherBitmap(kind, variant) {
        if (GATHER_ART[kind].images) return ImageManager.loadSystem(GATHER_ART[kind].images[variant]);   // a picture from img/system
        const k = kind + variant;
        const cached = gatherBitmaps.get(k);
        if (cached && !cached._baseTexture) gatherBitmaps.delete(k);   // rebuild if the texture was disposed
        return cachedBitmap(gatherBitmaps, k, () => {
            // plants are drawn twice as big as the pebbles: they have to be spotted at a glance
            const art = GATHER_ART[kind], rows = art.shapes[variant], sc = kind === "stone" ? 1 : 2, w = Math.max(...rows.map(r => r.length)), bitmap = new Bitmap(w * sc, rows.length * sc), ctx = bitmap.context;
            rows.forEach((row, y) => {
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === "." || !art.colours[row[x]]) continue;
                    ctx.fillStyle = art.colours[row[x]];
                    ctx.fillRect(x * sc, y * sc, sc, sc);
                }
            });
            bitmap.smooth = false;
            return bitmap;
        });
    }

    function Sprite_StoneLayer() {
        this.initialize(...arguments);
    }
    Sprite_StoneLayer.prototype = Object.create(Sprite.prototype);
    Sprite_StoneLayer.prototype.constructor = Sprite_StoneLayer;

    Sprite_StoneLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = Z.litter;   // over the ground and the soil, under the characters
        this._entries = [];
        this._stamp = null;
        this._scrollKey = null;
    };

    Sprite_StoneLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const mapId = $gameMap.mapId(), stamp = mapId + ":" + Farming.gatherRev() + ":" + Farming.today() + ":" + Farming.farm().rev;
        if (stamp !== this._stamp) {
            if (!this.rebuild()) return;   // the ground pictures are not loaded yet: try again next frame
            this._stamp = stamp;
            this._scrollKey = null;
        }
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
    };

    Sprite_StoneLayer.prototype.rebuild = function() {
        const found = [];
        for (let y = 0; y < $gameMap.height(); y++) {
            for (let x = 0; x < $gameMap.width(); x++) {
                if (!Farming.gatherKindOf(x, y)) continue;   // most tiles have nothing
                const spot = Farming.gatherSpot(x, y);
                if (spot === undefined) return false;
                const kind = spot && Farming.gatherAt(x, y);
                if (kind) found.push({ x, y, kind });
            }
        }
        for (const e of this._entries) this.removeChild(e.sprite);
        this._entries = [];
        for (const { x, y, kind } of found) {
            const shapes = GATHER_ART[kind].shapes || GATHER_ART[kind].images;
            let variant = Math.floor(Farming.hash2(x, y, 302) * shapes.length);
            if (kind === "mushroom") variant = Math.floor(Farming.hash2(x + 3 * (Farming.mushroomBirth(x, y) || 0), y, 302) * shapes.length);   // a new mushroom on the same tile may look different
            if (kind === "bush") variant = Farming.bushState(x, y) === "full" ? (Farming.hash2(x, y, 302) < 0.5 ? 0 : 1) : (Farming.seasonIndex(Farming.today()) === 3 ? 3 : 2);
            const bitmap = gatherBitmap(kind, variant);
            if (!bitmap.isReady()) return false;   // the picture is still loading: try again next frame
            const sprite = new Sprite(bitmap);
            this._entries.push(kind === "bush" ? {
                sprite,
                px: x * Farming.TILE + Math.floor((Farming.TILE - bitmap.width) / 2),
                py: y * Farming.TILE + Farming.TILE - bitmap.height - 1
            } : {
                sprite,
                px: x * Farming.TILE + 8 + Math.floor(Farming.hash2(x, y, 303) * Math.max(1, Farming.TILE - 16 - bitmap.width)),
                py: y * Farming.TILE + 14 + Math.floor(Farming.hash2(x, y, 304) * Math.max(1, Farming.TILE - 22 - bitmap.height))
            });
            this.addChild(sprite);
        }
        return true;
    };

    Sprite_StoneLayer.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        for (const e of this._entries) {
            e.sprite.x = Math.round(e.px - ox);
            e.sprite.y = Math.round(e.py - oy);
        }
    };

    // the grid and the see-through building
    function Sprite_BuildPlacer(tilemap) {
        this.initialize(tilemap);
    }
    Sprite_BuildPlacer.prototype = Object.create(Sprite.prototype);
    Sprite_BuildPlacer.prototype.constructor = Sprite_BuildPlacer;

    Sprite_BuildPlacer.prototype.initialize = function(tilemap) {
        Sprite.prototype.initialize.call(this, new Bitmap(Graphics.width, Graphics.height));
        this.z = Z.buildGhost;   // over the ground, under the characters
        this.visible = false;
        this._age = 0;
        this._key = null;
        this._ghost = new Sprite();
        this._ghost.anchor.x = 0.5;
        this._ghost.anchor.y = 1;
        this._ghost.z = Z.withCharacters;   // sorted with the characters, like a real building
        this._ghost.visible = false;
        tilemap.addChild(this._ghost);
    };

    Sprite_BuildPlacer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const mode = $gameTemp._buildMode;
        this.visible = this._ghost.visible = !!mode;
        if (!mode) { this._key = null; return; }
        this._age++;
        const key = [mode.type, mode.x, mode.y, $gameMap.displayX(), $gameMap.displayY(), Farming.farm().rev, $gamePlayer.x, $gamePlayer.y, Farming.missingMaterials(mode.type).length, mode.flip].join();
        if (key !== this._key) {
            this._key = key;
            this.redraw(mode);
        }
        this._ghost.opacity = Math.round(255 * (0.66 + 0.16 * Math.sin(this._age * 0.14)));
    };

    Sprite_BuildPlacer.prototype.redraw = function(mode) {
        const def = mode.flip ? Farming.mirrorGeo(Farming.BUILDINGS[mode.type]) : Farming.BUILDINGS[mode.type], tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const bmp = this.bitmap, ctx = bmp.context;
        bmp.clear();
        // grid: every tile within reach of the player
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        for (let ty = $gamePlayer.y - Farming.BUILD_RANGE; ty <= $gamePlayer.y + Farming.BUILD_RANGE; ty++) {
            for (let tx = $gamePlayer.x - Farming.BUILD_RANGE; tx <= $gamePlayer.x + Farming.BUILD_RANGE; tx++) {
                if (!$gameMap.isValid(tx, ty)) continue;
                ctx.strokeRect(Math.round($gameMap.adjustX(tx) * tw) + 0.5, Math.round($gameMap.adjustY(ty) * th) + 0.5, tw - 1, th - 1);
            }
        }
        // the tiles the building would cover: green where it fits, red where it does not
        const far = Farming.placementProblem(mode.type, mode.x, mode.y, mode.flip) === "Za daleko od ciebie.";
        for (const t of Farming.tilesOfBuilding(mode.type, mode.x, mode.y)) {
            const bad = far || !!Farming.tileWhyNot(t.x, t.y, mode.type), sx = Math.round($gameMap.adjustX(t.x) * tw), sy = Math.round($gameMap.adjustY(t.y) * th);
            const open = def.yard && !Farming.isSolidCell(def, t.i, t.j) && !(t.j === 0);   // the open ground inside a yard is only tinted; the fence and the hut are marked strongly
            ctx.fillStyle = bad ? "rgba(235,70,60," + (open ? 0.2 : 0.42) + ")" : "rgba(90,220,110," + (open ? 0.16 : 0.38) + ")";
            ctx.fillRect(sx, sy, tw, th);
            ctx.strokeStyle = bad ? "rgba(255,150,140,0.95)" : "rgba(190,255,200,0.95)";
            if (!open) ctx.strokeRect(sx + 1.5, sy + 1.5, tw - 3, th - 3);
        }
        bmp._baseTexture.update();
        // the picture of the building, in place like a real one
        let texture;
        if (mode.type === "fence") {
            texture = fenceTexture(fenceMask($gameMap.mapId(), mode.x, mode.y));
        } else {
            texture = ImageManager.loadSystem(def.image);
        }
        this._ghost.bitmap = texture;
        const hut = def.yard ? def.yard.hut : null;   // a yard shows its hut where it will stand
        this._ghost.x = Math.round(($gameMap.adjustX(mode.x) + (hut ? hut.dx + hut.w / 2 : def.w / 2)) * tw);
        this._ghost.y = Math.round(($gameMap.adjustY(mode.y - (hut ? hut.dy : 0)) + 1) * th) - 1;
        this._ghost.scale.x = mode.flip ? -1 : 1;
        const problem = Farming.placementProblem(mode.type, mode.x, mode.y, mode.flip);
        this._ghost.setBlendColor(problem ? [255, 70, 60, 110] : [0, 0, 0, 0]);
    };

    // the "?" key: a plain tile grid over the visible ground, for lining up buildings by eye. Toggled
    // (on $gameSystem, so it stays on across a save/load), redrawn only when the view actually scrolls.
    function Sprite_TileGrid() {
        this.initialize(...arguments);
    }
    Sprite_TileGrid.prototype = Object.create(Sprite.prototype);
    Sprite_TileGrid.prototype.constructor = Sprite_TileGrid;

    Sprite_TileGrid.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(Graphics.width, Graphics.height));
        this.z = Z.tileGrid;   // over the ground, under the characters and the build-mode placer
        this.visible = false;
        this._scrollKey = null;
    };

    Sprite_TileGrid.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameMap || !$gamePlayer || !$gameMessage) return;
        if (Input.isTriggered("grid") && !$gameMessage.isBusy() && !$gameMap.isEventRunning()) {
            $gameSystem._gridShown = !$gameSystem._gridShown;
        }
        this.visible = !!$gameSystem._gridShown;
        if (!this.visible) return;
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.redraw();
        }
    };

    Sprite_TileGrid.prototype.redraw = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const bmp = this.bitmap, ctx = bmp.context;
        bmp.clear();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        const x0 = Math.floor($gameMap.displayX()) - 1, x1 = x0 + Math.ceil(Graphics.width / tw) + 2;
        const y0 = Math.floor($gameMap.displayY()) - 1, y1 = y0 + Math.ceil(Graphics.height / th) + 2;
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                if (!$gameMap.isValid(tx, ty)) continue;
                ctx.strokeRect(Math.round($gameMap.adjustX(tx) * tw) + 0.5, Math.round($gameMap.adjustY(ty) * th) + 0.5, tw - 1, th - 1);
            }
        }
        bmp._baseTexture.update();
    };

    // ---- campfire glow: a soft additive light, faint by day and strong at night.
    // It lives on the spriteset itself (not in the tilemap), because the day/night
    // tone filter only covers the base sprite - so the fire is not dimmed with the rest.
    const ADD_BLEND = typeof PIXI !== "undefined" && PIXI.BLEND_MODES ? PIXI.BLEND_MODES.ADD : 1;
    // 0 by day .. 1 at night (dusk 17-20, dawn 5-8)
    function nightAmount() {
        if (typeof $gameSystem.dayNightHour !== "function") return 0;
        const h = $gameSystem.dayNightHour();
        if (h >= 20 || h < 5) return 1;
        if (h >= 17) return (h - 17) / 3;
        if (h < 8) return 1 - (h - 5) / 3;
        return 0;
    }
    function fireGlowAlpha(frame) {
        const flicker = 0.78 + 0.14 * Math.sin(frame * 0.13) + 0.08 * Math.sin(frame * 0.37 + 1.3);
        return (0.1 + 0.68 * nightAmount()) * flicker;
    }
    const glowCache = new Map();
    function fireGlowBitmap() {
        return cachedBitmap(glowCache, "glow", () => {
            const size = 192, bitmap = new Bitmap(size, size), ctx = bitmap.context;
            const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
            gradient.addColorStop(0, "rgba(255,172,72,0.75)");
            gradient.addColorStop(0.35, "rgba(255,122,40,0.32)");
            gradient.addColorStop(1, "rgba(255,90,20,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            return bitmap;
        });
    }

    // a pixel-art puff of smoke (2 px cells, light towards the upper left); faded and scaled by the sprite
    const puffCache = new Map();
    function puffTexture() {
        return cachedBitmap(puffCache, "puff", () => {
            const S = 20, bitmap = new Bitmap(S, S), ctx = bitmap.context;
            const discs = [[10, 11, 6.5], [6, 9, 4], [14, 9, 4.5], [10, 6, 4]];
            for (let py = 0; py < S; py += 2) {
                for (let px = 0; px < S; px += 2) {
                    const cx = px + 1, cy = py + 1;
                    if (!discs.some(([x, y, r]) => Math.hypot(cx - x, cy - y) <= r)) continue;
                    ctx.fillStyle = cx + cy > 24 ? "#a4a9b0" : "#d3d7dc";
                    ctx.fillRect(px, py, 2, 2);
                }
            }
            return bitmap;
        });
    }
    const PUFFS = 4;
    const PUFF_PERIOD = 150;   // frames for a puff to rise and fade

    // A fire drawn in pixel-art steps (2 px cells). The ring is an ellipse seen from above, so the tongues of flame are rooted all over it
    // (the back ones a little higher on the screen, the front ones lower), each has a rounded foot, a wide belly and a pointed tip, and
    // they stand on a bed of glowing embers with a dithered edge - so there is no flat line at the bottom. FLAME_FRAMES frames make a
    // seamless loop (every tongue moves a whole number of times per loop). size scales the whole fire.
    const FLAME_FRAMES = 8;
    // x and y (px, y positive = towards the viewer) of the root, height, half width, cycles per loop, phase
    const FLAME_TONGUES = [
        [0, -8, 18, 6, 2, 2.4], [-13, -4, 13, 5, 1, 4.4], [13, -4, 14, 5, 3, 5.5], [0, -3, 30, 7, 1, 0.0], [-6, 0, 22, 6, 2, 1.9],
        [6, 0, 24, 6, 2, 3.1], [-4, 3, 17, 5, 1, 5.1], [5, 3, 15, 5, 3, 1.3], [-10, 5, 12, 5, 3, 0.7], [10, 5, 11, 5, 1, 2.9], [0, 7, 9, 6, 2, 4.0]
    ].sort((a, b) => a[1] - b[1]);   // back to front
    const FLAME_LAYERS = [["#b8321a", 1, 0], ["#ee6a1a", 0.82, 1], ["#ffb43a", 0.62, 2], ["#fff1a6", 0.36, 3]];
    const HANG_SCALE = 0.75;   // the icon of the hanging food
    const ROPE_LENGTH = 12;
    // the short rope the food hangs on (2 px wide, 6 x 12 bitmap, its lower end shifted sideways by o px to follow the swaying food)
    const ropeCache = new Map();
    function ropeBitmap(o) {
        return cachedBitmap(ropeCache, o, () => {
            const bitmap = new Bitmap(6, ROPE_LENGTH), ctx = bitmap.context;
            for (let y = 0; y < ROPE_LENGTH; y++) {
                const cx = 3 + Math.round(o * (y / (ROPE_LENGTH - 1)));
                if (y < 2) { ctx.fillStyle = "#d2b078"; ctx.fillRect(cx - 1, y, 2, 1); }   // the loop over the hook
                else if (y >= ROPE_LENGTH - 2) { ctx.fillStyle = "#5a3f22"; ctx.fillRect(cx - 2, y, 4, 1); }   // the knot
                else { ctx.fillStyle = "#8a6a3c"; ctx.fillRect(cx - 1, y, 1, 1); ctx.fillStyle = "#6a4c28"; ctx.fillRect(cx, y, 1, 1); }
            }
            return bitmap;
        });
    }
    const flameCache = new Map();
    const flameHeight = k => Math.round(52 * k);
    const flameBase = k => Math.round(flameHeight(k) - 15 * k);   // row of the bitmap where the middle of the fire's foot is
    function flameFrames(k) {
        return cachedBitmap(flameCache, k, () => {
            const W = Math.round(60 * k) + (Math.round(60 * k) % 2), H = flameHeight(k), y0 = flameBase(k), frames = [];
            const foot = p => p < 0.16 ? 0.5 + 0.5 * (p / 0.16) : Math.pow(1 - (p - 0.16) / 0.84, 1.25);
            for (let f = 0; f < FLAME_FRAMES; f++) {
                const bitmap = new Bitmap(W, H), ctx = bitmap.context, phase = (f / FLAME_FRAMES) * Math.PI * 2;
                // the bed of embers: an ellipse of 2 px cells that fades out into the ring with a shimmering, dithered edge
                const rx = 19 * k, ry = 7.5 * k;
                for (let cy = Math.floor(-ry - 2); cy <= ry + 2; cy += 2) {
                    for (let cx = Math.floor(-rx - 2); cx <= rx + 2; cx += 2) {
                        const d = Math.hypot(cx / rx, cy / ry);
                        if (d > 1) continue;
                        const noise = (((cx + 40) * 7 + (cy + 40) * 13 + f * 5) % 11) / 11;
                        if (noise < Math.pow(d, 2.2) - 0.05) continue;
                        ctx.fillStyle = d < 0.42 ? "#ffb43a" : d < 0.72 ? "#ee6a1a" : "#b8321a";
                        ctx.fillRect(Math.round(W / 2 + cx - 1), Math.round(y0 + cy * 0.8), 2, 2);
                    }
                }
                for (const [color, hk, inset] of FLAME_LAYERS) {
                    ctx.fillStyle = color;
                    for (const [tx, ty, th, hw, cycles, ph] of FLAME_TONGUES) {
                        if (hk < 0.5 && th < 16) continue;   // only the tall tongues get the pale core
                        const flick = 0.8 + 0.2 * Math.sin(phase * cycles + ph);
                        const height = Math.max(2, Math.round(th * k * hk * flick / 2) * 2);
                        const half = Math.max(1, hw * k * (0.55 + 0.45 * hk) - inset * 0.6 * k);
                        const baseY = Math.round(y0 + ty * k * 0.8);
                        for (let y = 0; y < height; y += 2) {
                            const p = y / height;
                            const w = Math.max(2, Math.round(half * foot(p)) * 2);
                            const sway = Math.round(Math.sin(phase * cycles + ph + y * 0.22) * (0.6 + p * 2.2) / 2) * 2;
                            ctx.fillRect(Math.round(W / 2 + tx * k + sway - w / 2), baseY - y - 2, w, 2);
                        }
                    }
                }
                // a few sparks drifting up
                ctx.fillStyle = "#ffd35a";
                for (let n = 0; n < 4; n++) {
                    const rise = (f * 3 + n * 7) % 24;
                    ctx.fillRect(Math.round(W / 2 + (((n * 11 + f * 3) % 26) - 13) * k), Math.round(y0 - 22 * k - rise * k), 2, 2);
                }
                if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
                frames.push(bitmap);
            }
            return frames;
        });
    }

    // ---- the night: its own layer (a dark picture with holes), so that a fire really lights up the ground around it, in the
    // real colours of the ground, and the rest stays truly dark. It replaces the dark screen tone of DayNightCycle.js.
    const NIGHT_ALPHA = 0.9;
    function Sprite_NightLight() {
        this.initialize(...arguments);
    }
    Sprite_NightLight.prototype = Object.create(Sprite.prototype);
    Sprite_NightLight.prototype.constructor = Sprite_NightLight;
    Sprite_NightLight.prototype.initialize = function(spriteset) {
        const w = Math.ceil(Graphics.width / 2), h = Math.ceil(Graphics.height / 2);   // half the resolution: cheaper, and the edge of the light is soft
        Sprite.prototype.initialize.call(this, new Bitmap(w, h));
        this.bitmap.smooth = true;
        this.scale.set(2, 2);
        this.visible = false;
        this._spriteset = spriteset;
        this._age = 0;
    };
    // what gives light on this map: every fire, and the stations that have a job burning
    Sprite_NightLight.prototype.lights = function() {
        const out = [], set = this._spriteset._buildingSprites;
        for (const e of set ? set._sprites : []) {
            if (e.b.site) continue;
            const def = Farming.geoOf(e.b);
            if (def.fire && Farming.fireLit(e.b)) out.push({ x: e.sprite.x, y: e.sprite.y - def.fire.y - 6, r: def.fire.light || 300, i: 1, id: e.b.id });
            else if (def.smokes && e.b.job && !Farming.jobReady(e.b)) out.push({ x: e.sprite.x + (def.ember ? def.ember.x || 0 : def.ventX || 0), y: e.sprite.y - (def.ember ? def.ember.y : Math.max(20, (def.vent || 40) - 30)), r: def.light || 190, i: 0.85, id: e.b.id });   // from the fire opening, if it has one
        }
        // the embers of a tree struck by lightning (ChoppableTree.js) glow in the dark a little too
        if (window.ChoppableTree && ChoppableTree.emberLights) out.push(...ChoppableTree.emberLights(this._spriteset));
        return out;
    };
    Sprite_NightLight.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._age++;
        // a lightning flash (Storm.js, 0..1) lifts the night for a moment: the whole map in its real colours, then dark again
        const dark = ($gameSystem && $gameSystem._dayNightTinting && typeof $gameSystem.dayNightHour === "function" ? nightAmount() : 0) * (window.Storm ? 1 - 0.85 * Storm.flash() : 1);
        this.visible = dark > 0.01;
        if (!this.visible) return;
        const bmp = this.bitmap, ctx = bmp.context, w = bmp.width, h = bmp.height;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(3,7,24," + (NIGHT_ALPHA * dark).toFixed(3) + ")";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "destination-out";
        for (const l of this.lights()) {
            const flick = 0.93 + 0.05 * Math.sin(this._age * 0.21 + l.id * 1.7) + 0.03 * Math.sin(this._age * 0.53 + l.id);
            const x = l.x / 2, y = l.y / 2, r = (l.r / 2) * (0.97 + 0.03 * flick);
            if (x + r < 0 || y + r < 0 || x - r > w || y - r > h) continue;
            const a = l.i * flick, g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, "rgba(0,0,0," + a.toFixed(3) + ")");
            g.addColorStop(0.2, "rgba(0,0,0," + (a * 0.93).toFixed(3) + ")");
            g.addColorStop(0.45, "rgba(0,0,0," + (a * 0.62).toFixed(3) + ")");
            g.addColorStop(0.72, "rgba(0,0,0," + (a * 0.25).toFixed(3) + ")");
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        ctx.globalCompositeOperation = "source-over";
        if (bmp._baseTexture && bmp._baseTexture.update) bmp._baseTexture.update();
    };

    // a soft ground shadow, stretched under each building so that it sits on the ground instead of floating
    const shadowCache = new Map();
    function shadowTexture() {
        return cachedBitmap(shadowCache, "shadow", () => {
            const w = 96, h = 32, bitmap = new Bitmap(w, h), ctx = bitmap.context;
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(1, h / w);
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
            g.addColorStop(0, "rgba(10,8,4,0.46)");
            g.addColorStop(0.6, "rgba(10,8,4,0.30)");
            g.addColorStop(1, "rgba(10,8,4,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return bitmap;
        });
    }

    // the marked ground of a building site: scuffed earth, a dashed border and a stake in every corner
    const siteFootCache = new Map();
    function siteFootTexture(w, h) {
        h = h || 1;
        const ck = w + "x" + h;
        return cachedBitmap(siteFootCache, ck, () => {
            const W = w * Farming.TILE, H = h * Farming.TILE, bitmap = new Bitmap(W, H), ctx = bitmap.context;
            ctx.fillStyle = "rgba(96,66,40,0.30)";
            ctx.fillRect(3, 3, W - 6, H - 6);
            ctx.fillStyle = "rgba(240,214,150,0.95)";   // dashes along all four sides
            for (let x = 8; x < W - 8; x += 10) { ctx.fillRect(x, 3, 5, 2); ctx.fillRect(x, H - 5, 5, 2); }
            for (let y = 8; y < H - 8; y += 10) { ctx.fillRect(3, y, 2, 5); ctx.fillRect(W - 5, y, 2, 5); }
            const stake = (sx, sy) => {   // a little wooden post with a lighter top
                ctx.fillStyle = "#2a1a10"; ctx.fillRect(sx - 1, sy - 1, 7, 15);
                ctx.fillStyle = "#8f6539"; ctx.fillRect(sx, sy, 5, 13);
                ctx.fillStyle = "#c79b62"; ctx.fillRect(sx, sy, 2, 13);
                ctx.fillStyle = "#e6c48a"; ctx.fillRect(sx, sy, 5, 2);
            };
            stake(1, 1); stake(W - 6, 1); stake(1, H - 14); stake(W - 6, H - 14);
            return bitmap;
        });
    }

    // ---- buildings: sprites placed straight in the tilemap so that they sort with the characters
    function BuildingSprites(tilemap, glowLayer) {
        this._tilemap = tilemap;
        this._glowLayer = glowLayer;
        this._age = 0;
        this._sprites = [];
        this._stamp = null;
        this._scrollKey = null;
    }
    BuildingSprites.prototype.update = function() {
        this._age++;
        const mapId = $gameMap.mapId();
        const stamp = mapId + ":" + Farming.farm().rev;
        if (stamp !== this._stamp) {
            this._stamp = stamp;
            this.rebuild(mapId);
            this._scrollKey = null;
        }
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
        for (const e of this._sprites) {
            if (e.glow && (e.b.type === "campfire" || (Farming.geoOf(e.b).fire || {}).smoke)) e.glow.alpha = Farming.fireLit(e.b) ? fireGlowAlpha(this._age + e.b.id * 17) : 0;   // lit for as long as there is fuel (or something is already cooking on it)
            if (e.flame) this.updateFlame(e);
            if (e.meatRaw) this.updateHang(e);
            if (e.badge) this.updateStation(e);
            if (e.caught) this.updateSnare(e);
            if (e.solid) this.updateSite(e);
            if (Farming.geoOf(e.b).imageFull && (e.filled === undefined || this._age % 15 === 0)) this.updateBucket(e);
            if (Farming.geoOf(e.b).imageDry && (e.dried === undefined || this._age % 30 === 0)) this.updatePot(e);
            if (Farming.geoOf(e.b).table && !e.b.site && (e.tablePots === undefined || this._age % 20 === 0)) this.updateTable(e);
        }
    };
    // the bucket shows water in it once a portion has been collected
    BuildingSprites.prototype.updateBucket = function(e) {
        const def = Farming.geoOf(e.b), full = !e.b.site && Farming.bucketUnits(e.b) >= 1;
        if (e.filled === full) return;
        e.filled = full;
        e.sprite.bitmap = ImageManager.loadSystem(full ? def.imageFull : def.image);
    };
    // a clay pot drying on the ground: dark and wet, then pale once it is dry
    BuildingSprites.prototype.updatePot = function(e) {
        const def = Farming.geoOf(e.b), dry = !e.b.site && Farming.potDryness(e.b) >= 1;
        if (e.dried === dry) return;
        e.dried = dry;
        e.sprite.bitmap = ImageManager.loadSystem(dry ? def.imageDry : def.image);
    };
    // the pots drying on the shelter's table: one sprite a pot, at the table's spots. They sort right after the building (y one px
    // lower) and are drawn up on the table by the anchor, so whoever walks in front of the shelter still covers them
    const TABLE_POT_SCALE = 1;   // (the same size as a pot on the ground - the user's)
    BuildingSprites.prototype.updateTable = function(e) {
        const def = Farming.geoOf(e.b), pots = e.b.pots || [];
        e.tablePots = e.tablePots || [];
        while (e.tablePots.length < pots.length) {
            const s = new Sprite();
            s.scale.x = s.scale.y = TABLE_POT_SCALE;
            s.anchor.x = 0.5;
            s.z = Z.withCharacters;
            this._tilemap.addChild(s);
            e.tablePots.push(s);
        }
        while (e.tablePots.length > pots.length) this._tilemap.removeChild(e.tablePots.pop());
        pots.forEach((p, i) => {
            const img = Farming.tablePotDry(e.b, p) ? def.potDry || "Farm_Pot_Dry" : def.potWet || "Farm_Pot_Wet", s = e.tablePots[i];
            if (s._img !== img) { s.bitmap = ImageManager.loadSystem(img); s._img = img; }
            const spot = def.table.spots[i] || [0, -40], drawnH = 28 * TABLE_POT_SCALE;   // (Farm_Pot_* is 28 px high)
            s.x = e.sprite.x + spot[0];
            s.y = e.sprite.y + 1;
            s.anchor.y = 1 + (1 - spot[1]) / drawnH;   // (the anchor is in picture units: this puts the pot's foot on the table)
        });
    };
    // the built part of a site grows from the ground up, one step for every blow
    BuildingSprites.prototype.updateSite = function(e) {
        const site = e.b.site, bitmap = e.solid.bitmap;
        if (!site || !bitmap || !bitmap.isReady() || bitmap.height <= 0) return;
        const done = Math.round(bitmap.height * Math.min(1, site.done / site.need));
        if (e.shown === done) return;
        e.shown = done;
        e.solid.visible = done > 0;
        if (done > 0) e.solid.setFrame(0, bitmap.height - done, bitmap.width, done);
    };
    // a crafting station shows its state: the product's icon when it is ready, plus
    // smoke and a glow while a job burns, for buildings marked "smokes" (a fire/kiln)
    // the food on the tripod: shown for as long as there is food on the hook (also when it is done, until it is collected), sways a
    // little, and is roasted more and more
    BuildingSprites.prototype.updateHang = function(e) {
        const b = e.b, cooking = !!b.job;
        e.meatRaw.visible = e.meatDone.visible = e.rope.visible = cooking;
        if (!cooking) { e.hangKey = null; return; }
        if (e.hangKey !== b.job.recipe) {
            e.hangKey = b.job.recipe;
            const r = Farming.recipeOf(b, b.job.recipe), set = (sprite, id) => {
                const idx = Farming.itemOf(id).iconIndex;
                sprite.setFrame((idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32);
            };
            set(e.meatRaw, r ? r.inputs[0][0] : b.job.out[0]);
            set(e.meatDone, b.job.out[0]);
        }
        const def = Farming.geoOf(b), progress = Math.max(0, Math.min(1, 1 - Farming.jobHoursLeft(b) / Math.max(0.01, b.job.hours)));
        e.meatDone.alpha = progress;
        const sway = Math.round(Math.sin(this._age / 26 + b.id) * 1.5);
        e.meatRaw.x = e.meatDone.x = e.sprite.x + (def.hang.x || 0) + sway;
        e.rope.x = e.sprite.x + (def.hang.x || 0);
        if (e.ropeSway !== sway) {
            e.ropeSway = sway;
            e.rope.bitmap = ropeBitmap(sway);
        }
    };
    // the flames flicker through their frames; the smoke of a campfire stops only half an hour after the fire has gone out
    BuildingSprites.prototype.updateFlame = function(e) {
        e.flame.visible = Farming.fireLit(e.b);
        if (!e.flame.visible) return;
        const k = Farming.geoOf(e.b).fire.size || 1, frames = flameFrames(k), i = Math.floor((this._age + e.b.id * 3) / 5) % frames.length;
        if (e.flameFrame !== i) {
            e.flameFrame = i;
            e.flame.bitmap = frames[i];
        }
    };
    BuildingSprites.prototype.updateStation = function(e) {
        const b = e.b, def0 = Farming.geoOf(b), ready = Farming.jobReady(b), cooking = !!b.job && !ready && !Farming.jobPaused(b), fireOut = !!def0.fire && !Farming.fireLit(b);
        const burning = cooking || !!(def0.fire && def0.fire.smoke && !fireOut);
        // gone out: for half an hour thin smoke still rises from the embers - fewer, fainter, smaller puffs as it cools
        const smoulder = !burning && fireOut ? Farming.smoulderOf(b) : 0, shown = burning ? PUFFS : smoulder > 0 ? Math.max(1, Math.ceil((PUFFS - 1) * smoulder)) : 0;
        if (e.puffs) {
            e.puffs.forEach((p, i) => {
                p.visible = i < shown;
                if (!p.visible) return;
                const t = ((this._age + i * (PUFF_PERIOD / PUFFS) + b.id * 13) % PUFF_PERIOD) / PUFF_PERIOD;
                const g = Farming.geoOf(b), W = window.Storm ? Storm.wind() : 0;   // in a storm the wind lays the smoke down flat
                if (!burning) {
                    p.x = e.sprite.x + (g.fire.x || 0) + Math.sin(t * 4 + i * 1.7) * 3 * (1 - 0.6 * W) + t * (6 + 80 * W);
                    p.y = e.sprite.y - g.fire.y - 4 - t * 46 * (1 - 0.6 * W);
                    p.alpha = Math.min(1, t / 0.2) * (1 - t) * (0.3 + 0.45 * smoulder);
                    p.scale.x = p.scale.y = 0.5 + t * 0.8;
                    return;
                }
                p.x = e.sprite.x + (g.ventX || 0) + Math.sin(t * 5 + i * 1.7) * 5 * (1 - 0.6 * W) + t * (9 + 80 * W);
                p.y = e.sprite.y - (g.vent || 40) - t * 44 * (1 - 0.6 * W);
                p.alpha = Math.min(1, t / 0.15) * (1 - t) * 0.6;
                p.scale.x = p.scale.y = 0.55 + t * 0.9;
            });
        }
        if (e.glow && b.type !== "campfire" && !(def0.fire && def0.fire.smoke)) e.glow.alpha = fireOut ? 0 : fireGlowAlpha(this._age + b.id * 17) * (def0.fire ? (cooking ? 0.75 : 0.45) : burning ? 0.55 : 0);
        const some = ready || (!!b.job && !!Farming.jobCollectable && Farming.jobCollectable(b) > 0);   // (a queue: the first ones are done)
        e.badge.visible = some;
        if (some) {
            const idx = Farming.itemOf(b.job.out[0]).iconIndex, height = (e.sprite.bitmap && e.sprite.bitmap.height) || e.height;
            e.badge.setFrame((idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32);
            e.badge.y = e.sprite.y - height - 4 + Math.round(Math.sin(this._age * 0.08) * 3);
        }
    };
    // -- per-feature builders for rebuild(), always called in the same order as the old single method
    // did, so insertion order into the tilemap (and so the sort among sprites that share a z) is unchanged.

    // the yard's fence: a post with rails toward the neighbouring posts, all around, but the gate
    BuildingSprites.prototype.buildFence = function(entry, b, def) {
        entry.fences = [];
        for (const c of Farming.cellsOfGeo(def, b.x, b.y)) {
            if (!Farming.onRing(def, c.i, c.j) || (c.j === 0 && c.i === def.yard.gate)) continue;
            const mask = (Farming.onRing(def, c.i, c.j + 1) ? 1 : 0) | (Farming.onRing(def, c.i + 1, c.j) ? 2 : 0) | (Farming.onRing(def, c.i, c.j - 1) ? 4 : 0) | (Farming.onRing(def, c.i - 1, c.j) ? 8 : 0);
            const post = new Sprite(fenceTexture(mask));
            post.anchor.x = 0.5;
            post.anchor.y = 1;
            post.z = Z.withCharacters;
            this._tilemap.addChild(post);
            entry.fences.push({ sprite: post, x: c.x, y: c.y });
        }
    };
    // a building site: the solid silhouette that grows with the work (frame set in updateSite), standing
    // on the scuffed, staked-out ground it will occupy
    BuildingSprites.prototype.buildSiteScaffold = function(entry, b, def, bitmap) {
        const solid = new Sprite(bitmap);   // what has been built so far
        solid.anchor.x = 0.5;
        solid.anchor.y = 1;
        solid.z = Z.withCharacters;
        if (def.flipped) solid.scale.x = -1;
        solid.visible = false;
        this._tilemap.addChild(solid);
        entry.solid = solid;
        const foot = new Sprite(siteFootTexture(def.w, def.h));
        foot.z = Z.footprint;
        this._tilemap.addChild(foot);
        entry.foot = foot;
    };
    // a soft ground shadow under a finished building (the fence texture already has its own)
    BuildingSprites.prototype.buildShadow = function(entry, b, def) {
        const shadow = new Sprite(shadowTexture());
        shadow.anchor.x = 0.5;
        shadow.anchor.y = 0.5;
        shadow.z = Z.footprint;
        const hutW = def.yard ? def.yard.hut.w : def.w;
        shadow.scale.x = (hutW * Farming.TILE * 1.02) / 96;
        shadow.scale.y = (def.yard ? def.yard.hut.h : (def.h || 1)) * (hutW > 1 ? 1.1 : 0.8);
        this._tilemap.addChild(shadow);
        entry.shadow = shadow;
    };
    // the warm additive light spilling from a campfire, a smoking fire, or a lit crafting station
    BuildingSprites.prototype.buildGlow = function(entry, b, def) {
        const glow = new Sprite(fireGlowBitmap());
        glow.anchor.x = 0.5;
        glow.anchor.y = 0.5;
        glow.blendMode = ADD_BLEND;
        glow.alpha = def.fire && def.fire.smoke ? fireGlowAlpha(this._age) : 0;
        glow.scale.x = glow.scale.y = def.fire && def.fire.glow ? def.fire.glow : def.ember && def.ember.scale ? def.ember.scale : def.recipes ? 0.6 : 1;
        this._glowLayer.addChild(glow);
        entry.glow = glow;
    };
    // animated flames over the embers of the picture, sorted right after the building itself
    BuildingSprites.prototype.buildFireVisuals = function(entry, b, def) {
        const flame = new Sprite(flameFrames(def.fire.size || 1)[0]);
        flame.anchor.x = 0.5;
        flame.anchor.y = (flameBase(def.fire.size || 1) + def.fire.y) / flameHeight(def.fire.size || 1);   // the middle of the foot is fire.y above the picture's foot
        flame.z = Z.withCharacters;
        this._tilemap.addChild(flame);
        entry.flame = flame;
    };
    // the food hanging from the rope while it roasts: the icon of the raw food, and over it the roasted one fading in
    BuildingSprites.prototype.buildHangVisuals = function(entry, b, def) {
        const icon = () => {
            const s = new Sprite(ImageManager.loadSystem("IconSet"));
            s.setFrame(0, 0, 32, 32);
            s.anchor.x = 0.5;
            s.anchor.y = def.hang.y / (32 * HANG_SCALE);   // the top of the icon is def.hang.y above the foot of the picture
            s.scale.set(HANG_SCALE);
            s.z = Z.withCharacters;
            s.visible = false;
            this._tilemap.addChild(s);
            return s;
        };
        const rope = new Sprite(ropeBitmap(0));
        rope.anchor.x = 0.5;
        rope.anchor.y = def.hang.rope / ROPE_LENGTH;   // the top of the rope is def.hang.rope above the foot of the picture
        rope.z = Z.withCharacters;
        rope.visible = false;
        this._tilemap.addChild(rope);
        entry.rope = rope;
        entry.meatRaw = icon();   // after the rope: the food is drawn over its lower end
        entry.meatDone = icon();
    };
    // smoke puffs rising from a burning station
    BuildingSprites.prototype.buildStationVisuals = function(entry, b, def) {
        entry.puffs = [];
        for (let i = 0; i < PUFFS; i++) {
            const puff = new Sprite(puffTexture());
            puff.anchor.x = 0.5;
            puff.anchor.y = 0.5;
            puff.z = Z.smoke;
            puff.visible = false;
            this._tilemap.addChild(puff);
            entry.puffs.push(puff);
        }
    };
    // a snare: the bait lying in its noose, and a caught rabbit sitting in it, now and then thrashing. Children of the snare's own sprite
    // (so they sort and mirror with it); the noose is at SNARE_NOOSE px from the foot of the picture (the middle of its bottom edge)
    const SNARE_NOOSE = { x: -4, y: -19 }, RABBIT = { sheet: "$Animal_Rabbit", row: 1 };   // (row 1: the rabbit side on, facing left)
    BuildingSprites.prototype.buildSnareVisuals = function(entry) {
        const bait = new Sprite(ImageManager.loadSystem("IconSet"));
        bait.anchor.set(0.5, 0.5);
        bait.scale.set(0.5, 0.5);
        bait.x = SNARE_NOOSE.x;
        bait.y = SNARE_NOOSE.y;
        bait.visible = false;
        const rabbit = new Sprite(ImageManager.loadCharacter(RABBIT.sheet));
        rabbit.anchor.set(0.5, 1);
        rabbit.scale.set(0.8, 0.8);
        rabbit.x = SNARE_NOOSE.x;
        rabbit.y = SNARE_NOOSE.y + 9;
        rabbit.visible = false;
        entry.sprite.addChild(bait);
        entry.sprite.addChild(rabbit);
        entry.bait = bait;
        entry.caught = rabbit;
    };
    BuildingSprites.prototype.updateSnare = function(e) {
        const b = e.b, caught = (b.caught || 0) > 0, bait = !caught && b.bait && $dataItems[b.bait.item];
        e.bait.visible = !!bait;
        if (bait) e.bait.setFrame((bait.iconIndex % 16) * 32, Math.floor(bait.iconIndex / 16) * 32, 32, 32);
        e.caught.visible = caught;
        if (!caught || !e.caught.bitmap.isReady()) return;
        const t = this._age + b.id * 29, thrash = t % 110 < 16;   // mostly it crouches still; now and then it kicks against the noose
        const pw = e.caught.bitmap.width / 3, ph = e.caught.bitmap.height / 4, pattern = thrash ? 1 + (Math.floor(t / 4) % 2) : 0;
        e.caught.setFrame(pattern * pw, RABBIT.row * ph, pw, ph);
        e.caught.x = SNARE_NOOSE.x + (thrash ? (t % 4 < 2 ? -1 : 1) : 0);
    };
    // the finished-product icon over a station, waiting to be collected (frame set in updateStation)
    BuildingSprites.prototype.buildReadyBadge = function(entry, b, def) {
        const icon = new Sprite(ImageManager.loadSystem("IconSet"));
        icon.setFrame(0, 0, 32, 32);
        icon.anchor.x = 0.5;
        icon.anchor.y = 1;
        icon.z = Z.readyBadge;
        icon.visible = false;
        this._tilemap.addChild(icon);
        entry.badge = icon;
    };

    BuildingSprites.prototype.rebuild = function(mapId) {
        this.destroy();
        const list = Farming.farm().buildings[mapId] || [];
        for (const b of list) {
            const def = Farming.geoOf(b);
            if (!Farming.BUILDINGS[b.type]) continue;
            const bitmap = b.type === "fence" ? fenceTexture(fenceMask(mapId, b.x, b.y)) : ImageManager.loadSystem(def.image);
            const sprite = new Sprite(bitmap);
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 1;
            sprite.z = Z.withCharacters;
            if (def.flipped) sprite.scale.x = -1;   // put down mirrored
            const entry = { b, sprite, shadow: null, solid: null, foot: null, glow: null, puffs: null, badge: null, height: 64, fences: null, flame: null, meatRaw: null, meatDone: null, rope: null, bait: null, caught: null };
            if (b.site) {
                sprite.opacity = 85;   // the blueprint of the whole building
                this.buildSiteScaffold(entry, b, def, bitmap);
            } else if (b.type !== "fence") {   // the fence texture has its own
                this.buildShadow(entry, b, def);
            }
            this._tilemap.addChild(sprite);
            if (def.yard && !b.site) this.buildFence(entry, b, def);
            if (!b.site && (b.type === "campfire" || (def.fire && def.fire.smoke) || (def.recipes && def.smokes))) this.buildGlow(entry, b, def);
            if (!b.site && def.fire) this.buildFireVisuals(entry, b, def);
            if (!b.site && def.hang) this.buildHangVisuals(entry, b, def);
            if (!b.site && def.recipes && (def.smokes || (def.fire && def.fire.smoke))) this.buildStationVisuals(entry, b, def);
            if (!b.site && def.recipes) this.buildReadyBadge(entry, b, def);
            if (!b.site && def.lure) this.buildSnareVisuals(entry);
            this._sprites.push(entry);
        }
    };
    BuildingSprites.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const { b, sprite, shadow, solid, foot, glow, badge, fences, flame, meatRaw, meatDone, rope } of this._sprites) {
            const def = Farming.geoOf(b), hut = def.yard ? def.yard.hut : null;
            sprite.x = Math.round(($gameMap.adjustX(b.x) + (hut ? hut.dx + hut.w / 2 : def.w / 2)) * tw);
            sprite.y = Math.round(($gameMap.adjustY(b.y - (hut ? hut.dy : 0)) + 1) * th) - 1;
            for (const f of fences || []) {
                f.sprite.x = Math.round(($gameMap.adjustX(f.x) + 0.5) * tw);
                f.sprite.y = Math.round(($gameMap.adjustY(f.y) + 1) * th) - 1;
            }
            if (solid) {
                solid.x = sprite.x;
                solid.y = sprite.y;
            }
            if (foot) {
                foot.x = Math.round($gameMap.adjustX(b.x) * tw);
                foot.y = Math.round($gameMap.adjustY(b.y - (def.h || 1) + 1) * th);
            }
            if (shadow) {
                shadow.x = sprite.x;
                shadow.y = sprite.y - 9;
            }
            if (glow) {
                glow.x = sprite.x + (def.fire ? 0 : def.ember ? (def.ember.x || 0) : def.ventX || 0);
                glow.y = sprite.y - (def.fire ? def.fire.y + 10 : def.ember ? def.ember.y : def.vent ? def.vent - 2 : 22);   // on the flames / the embers in the opening / the vent, above the foot of the sprite
            }
            if (flame) {
                flame.x = sprite.x;
                flame.y = sprite.y;
            }
            for (const meat of [meatRaw, meatDone, rope]) if (meat) meat.y = sprite.y;
            if (badge) badge.x = sprite.x;
        }
        for (const e of this._sprites) if (e.tablePots && e.tablePots.length) this.updateTable(e);   // (they follow the scrolling too)
    };
    BuildingSprites.prototype.destroy = function() {
        for (const s of this._sprites) {
            this._tilemap.removeChild(s.sprite);
            if (s.shadow) this._tilemap.removeChild(s.shadow);
            if (s.solid) this._tilemap.removeChild(s.solid);
            if (s.foot) this._tilemap.removeChild(s.foot);
            if (s.glow) this._glowLayer.removeChild(s.glow);
            if (s.flame) this._tilemap.removeChild(s.flame);
            if (s.rope) this._tilemap.removeChild(s.rope);
            if (s.meatRaw) this._tilemap.removeChild(s.meatRaw);
            if (s.meatDone) this._tilemap.removeChild(s.meatDone);
            if (s.badge) this._tilemap.removeChild(s.badge);
            for (const p of s.puffs || []) this._tilemap.removeChild(p);
            for (const p of s.tablePots || []) this._tilemap.removeChild(p);
            for (const f of s.fences || []) this._tilemap.removeChild(f.sprite);
        }
        this._sprites = [];
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._farmLayer = new Sprite_FarmLayer();
        this._tilemap.addChild(this._farmLayer);
        this._stoneLayer = new Sprite_StoneLayer();
        this._tilemap.addChild(this._stoneLayer);
        this._buildPlacer = new Sprite_BuildPlacer(this._tilemap);
        this._tilemap.addChild(this._buildPlacer);
        this._tileGrid = new Sprite_TileGrid();
        this._tilemap.addChild(this._tileGrid);
        this._nightLight = new Sprite_NightLight(this);   // over the world, under the warm glow of the fires and the interface
        this.addChild(this._nightLight);
        this._farmGlowLayer = new Sprite();
        this.addChild(this._farmGlowLayer);
        this._buildingSprites = new BuildingSprites(this._tilemap, this._farmGlowLayer);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._buildingSprites) this._buildingSprites.update();
    };

    // dopisywane do obiektu, który zbudował już Farming.js (musi się załadować pierwszy)
    Object.assign(window.Farming, { soilTexture, fenceTexture, nightAmount, fireGlowAlpha });
})();
