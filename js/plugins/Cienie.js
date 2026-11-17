//=============================================================================
// Cienie.js
//=============================================================================
// Sun shadows for what stands but threw none (user 2026-11-07: "budynki z kafli i budynki stawiane przez gracza i wszystkie inne
// powinny rzucać cienie"; then, of the first try: "te cienie wyglądają bardzo nierówno i nienaturalnie i chyba za małe"). All in
// Sky.js's one sun-shadow layer (they look like the trees', do not double where they overlap, follow the sun, the clouds, the rain):
//   1. buildings and walls drawn with TILES (A3 roofs and walls, A4 walls and tops): found ONCE per map from the tile data as solids -
//      each building one piece of the map (its cells joined), one height for all of it (its walls plus a part of its roof), its ground
//      the roof's rows moved down to the walls' foot. Its shadow is what a box throws: the foot of its front swept the sun's way and its
//      side away from the sun swept the same way - two flat sprites per front (a matrix each, no drawing while playing), the wall's
//      foot a straight line along the wall. Then the buildings' own cells are ERASED from these shadows (one blend, the layer's own
//      picture): a shadow never lies on a wall or a roof - a house's, a barrel's or a lamp's (the trees' and the people's are as
//      they were: drawn after). The round corners and the stones of a wall's foot made of B-E tiles count as the building.
//   2. the buildings the player puts up (Farming_Render.js BuildingSprites): their own picture's silhouette, the flat ellipse under
//      them turned down to an ambient trace;
//   3. the standing "!" events (props, lamps, statues, palisades, signs, gates...) - a hook of Tawerna.sprite, asked once per
//      character: not doors, roof windows, chimneys (parts of a wall or a roof), not flat things (below the characters), not the
//      harvest things (trees, rocks, bushes, logs: ChoppableTree_Render.js throws their shadows).
// The things of 2 and 3 and the B-E tile things (barrels, crates, lamp posts) are leaned from their foot: the picture's bottom row
// stays on the ground along the screen (a fence's shadow starts along the fence, a bench's along the bench) and its top goes the
// sun's way and length - not turned to face the sun as a tree's (a tree is round). A shadow painted into the picture (black,
// see-through) is left out of the silhouette.
// NIGHT: none of these set sprite._occluder, so the fires' and lamps' shadows of the night (Farming_Render.js, RoomLighting.js) do not
// see them: the night costs exactly what it did.
// Nothing is saved; nothing sits on a Game_* object. window.Cienie.opts { buildings, players, props } switch each part.

/*:
 * @target MZ
 * @plugindesc Cienie od słońca: budynki z kafli (jak bryły), budynki gracza i stojące rzeczy (latarnie, posągi, palisady, tablice) rzucają cień jak drzewa. v1.2.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Widok
 *
 * @help
 * Cienie.js - cienie od słońca dla budynków (z kafli i stawianych przez gracza) i stojących rzeczy na dworze.
 * Budynek z kafli rzuca cień jak bryła: od stopy frontowej ściany i od boku odwróconego od słońca, jedna wysokość
 * na cały budynek; cień nigdy nie leży na ścianach i dachach. Wszystko w tej samej warstwie cieni co cienie drzew
 * (Sky.js): cienie się nie sumują, znikają w nocy, pod dachem, w burzy. Nocą (od ognia) nie rzucają cienia.
 * window.Cienie.opts: buildings, players, props (true/false) - włącznik każdej części. <Cienie:off> w notatce mapy ją pomija.
 */
(() => {
    "use strict";
    const PLUGIN = "Cienie";
    const T = window.Tawerna;
    if (!T) throw new Error("Cienie.js: brak TawernaCore.js (the Tawerna core is missing)");
    const A = T.api(PLUGIN) || T.register(PLUGIN, {});
    A.opts = Object.assign({ buildings: true, players: true, props: true }, A.opts);
    A.stats = { comps: 0, runs: 0, blocks: 0, sides: 0, erasers: 0, things: 0, tiles: 0, players: 0 };
    window.Cienie = A;
    const Sun = () => T.api("Sun");
    const INDOOR_SETS = new Set([8, 10, 12]);   // (the interiors and dungeons)
    const PAD = 4;                              // px round a silhouette (as Sky.js's SHADOW_PAD)
    const LIFT = 2;                             // px a leaned shadow starts up inside the foot (a thing stands, its foot hides the start)
    const AMBIENT = 0.4;                        // what is left of the flat ellipse under a player's building when the sun shadow is laid
    const CLOUD_DIM = 0.85;                     // as the trees: a cloud over a shadow takes this much of it
    const BUILDS_PER_FRAME = 4;                 // new silhouettes (a picture's frame read once) per frame: a screen of props does not stall
    // (2026-11-12, wydajność) ...and no more than BUILD_MS of a frame once the first is made: a big building's silhouette costs a few
    // ms, four of them were a 10-20 ms frame while walking. They are made as a thing comes near the screen, so a frame later is unseen.
    const BUILD_MS = 2;
    let budgetFrame = -1, budget = 0, budgetStart = 0;
    const spend = () => {
        if (budgetFrame !== Graphics.frameCount) { budgetFrame = Graphics.frameCount; budget = BUILDS_PER_FRAME; budgetStart = performance.now(); }
        if (budget <= 0 || (budget < BUILDS_PER_FRAME && performance.now() - budgetStart > BUILD_MS)) return false;
        budget--;
        return true;
    };

    // the map is under the open sky (Widok.js's test) and wants shadows
    let outMemo = null;
    const outdoor = () => {
        if (!window.$gameMap || !window.$dataMap) return false;
        if (outMemo && outMemo.data === $dataMap) return outMemo.v;
        const v = !INDOOR_SETS.has($gameMap.tilesetId()) && !!T.mapFlag("Clouds", false) && !/<Cienie:off>/i.test($dataMap.note || "");
        outMemo = { data: $dataMap, v };
        return v;
    };

    // ------------------------------------------------------------------
    // Laying a shadow sprite by a matrix (its own, as Sky.js lays the trees': the sprite's x, y, scale are never set)
    // ------------------------------------------------------------------
    // (ax, ay): the picture's point that goes to (tx, ty) - null: the picture's own _ax, _ay; local x goes by (a, b), local y by (c,
    // d). cull: not drawn (renderable false) when its box is off the screen (laid in the screen's px); false: laid in the map's px
    // for a window round the screen - drawn (the GPU leaves out what is off the screen). frame [x, w]: only these columns of the
    // picture (ax counted from x)
    function layMatrix(spr, bmp, ax, ay, a, b, c, d, tx, ty, cull, frame) {
        if (ax === null) { ax = bmp._ax; ay = bmp._ay; }
        if (spr.bitmap !== bmp) spr.bitmap = bmp;
        if (frame && (spr._frame.x !== frame[0] || spr._frame.width !== frame[1] || spr._frame.height !== bmp.height)) spr.setFrame(frame[0], 0, frame[1], bmp.height);
        const W = frame ? frame[1] : bmp.width, H = bmp.height, kx = ax / W, ky = ay / H;
        if (spr.anchor.x !== kx || spr.anchor.y !== ky) spr.anchor.set(kx, ky);
        if (cull !== false) {
            const x0 = -ax, x1 = W - ax, y0 = -ay, y1 = H - ay;
            const ax0 = a * x0, ax1 = a * x1, cy0 = c * y0, cy1 = c * y1, bx0 = b * x0, bx1 = b * x1, dy0 = d * y0, dy1 = d * y1;
            const L = tx + Math.min(ax0, ax1) + Math.min(cy0, cy1), R = tx + Math.max(ax0, ax1) + Math.max(cy0, cy1);
            const U = ty + Math.min(bx0, bx1) + Math.min(dy0, dy1), D = ty + Math.max(bx0, bx1) + Math.max(dy0, dy1);
            spr.renderable = T.view.sees(L - 2, U - 2, R + 2, D + 2);
            if (!spr.renderable) return false;
        } else if (!spr.renderable) spr.renderable = true;
        const tf = spr.transform, lt = tf.localTransform;
        if (tf._currentLocalID === tf._localID && lt.a === a && lt.b === b && lt.c === c && lt.d === d && lt.tx === tx && lt.ty === ty) return true;
        lt.a = a; lt.b = b; lt.c = c; lt.d = d; lt.tx = tx; lt.ty = ty;
        tf._currentLocalID = tf._localID;   // (PIXI does not make it again from the position and the scale)
        tf._parentID = -1;                  // (the world's matrix again on the next frame)
        return true;
    }
    // the sun's offset of a thing's top over the ground (px on the screen) for a height of h px: its way (dx, dy), its length, the
    // ground seen at an angle (Sky's FLAT) - the same numbers Sky.js gives a tree's top
    const offsetOf = (sun, S, h) => { const L = sun.len * h; return [sun.dx * L, (S.FLAT || 0.55) * sun.dy * L]; };
    // a silhouette (its foot at its picture's row footRow, column footX; PAD round it) leaned from its foot: the bottom row stays along
    // the screen at (fx, fy), the top goes by the sun's offset for the thing's height (its picture's height times sy)
    function layLeaned(spr, bmp, fx, fy, sx, sy, sun, S, cull) {
        const h = bmp._footRow + 1, [ox, oy] = offsetOf(sun, S, h * Math.abs(sy));
        return layMatrix(spr, bmp, PAD + bmp._footX, PAD + h, sx, 0, -ox / h, -oy / h, fx, fy, cull);
    }
    const cloudAlpha = (sun, S, layer, mx, my) => S.layerAlpha(layer) * (sun.flash ? 1 : 1 - CLOUD_DIM * S.cloudCover(mx, my));

    // a frame of a picture as a soft dark silhouette, as Sky.js makes it, but without a shadow painted into the picture (pure black,
    // see-through pixels: Winlu's barrels, carts, lamp posts have one) - the sun's shadow is the real one. Cached by the picture and
    // the frame; remembered on the asking sprite as long as it asks for the same.
    // pictures that always take their "<name>_Cien" mask, whatever the event's note says (the lighthouse tower: its shadow starts
    // along the round base, not from one straight line under its lowest stone - the user 2026-11-14)
    const MASKED = new Set(["!$Latarnia_Wieza"]);
    // ... and round ones stand on a disc, not on a line: the px of ground their base takes from back to front (the ellipse's height).
    // A flat silhouette leaned by a low sun thins to a sliver (19:00: a tower 140 px wide threw a 30 px strip); laid a few times
    // across the disc (narrower towards its back and front rims) the shadow keeps the base's width whatever the sun's side.
    const ROUND_BASE = new Map([["!$Latarnia_Wieza", 46]]);
    const ROUND_T = [-0.92, -0.62, -0.31, 0, 0.31, 0.62, 0.92];
    const silCache = new Map();
    // feet (a mask, <Cienie:maska>): in each column the row where the thing meets the ground is marked red (255, 0, 0) - tools/
    // wrak_duzy/grunt.py; the columns with no mark get the nearest marked ones' (a rag, a rope over the ground); out._strips: the
    // picture cut into strips of columns with one foot each (within STRIP_STEP px), each laid from its own foot. Two strips whose
    // feet are d px apart part by up to d px along their seam (the sun leans each from its own foot): each strip reaches over its
    // neighbours by e = that d + 1 px (overlapping shadows in the one layer do not darken twice)
    const STRIP_W = 32, STRIP_STEP = 2, STRIP_OVER = 16;
    function stripsOf(feet, pw) {
        const out = [];
        for (let x = 0; x < pw;) {
            let e = x + 1, lo = feet[x], hi = feet[x];
            while (e < pw && e - x < STRIP_W) {
                const l = Math.min(lo, feet[e]), h = Math.max(hi, feet[e]);
                if (h - l > STRIP_STEP) break;
                lo = l; hi = h; e++;
            }
            out.push({ x0: x, x1: e, h: hi + 1 });
            x = e;
        }
        for (let i = 0; i < out.length; i++) {
            const a = i ? Math.abs(out[i].h - out[i - 1].h) : 0, b = i < out.length - 1 ? Math.abs(out[i + 1].h - out[i].h) : 0;
            out[i].e = Math.min(STRIP_OVER, Math.max(a, b) + 1);
        }
        if (out.length) { out[0].x0 = -PAD; out[0].e = 0; out[out.length - 1].x1 = pw + PAD; out[out.length - 1].e = 0; }
        for (const q of out) { q.fx = Math.max(0, PAD + q.x0 - q.e); q.fw = Math.min(pw + 2 * PAD, PAD + q.x1 + q.e) - q.fx; }
        return out;
    }
    let silScratch = null;
    function silhouette(src, sx, sy, pw, ph, feet) {
        const key = (src._url || "") + "," + sx + "," + sy + "," + pw + "," + ph + (feet ? ",f" : "");
        if (silCache.has(key)) return silCache.get(key);
        // the frame's pixels from the sheet read once (Sky.js sheetRect, 2026-11-12: no bitmap and no read-back per frame); the old way while it is not ready
        const Sk = Sun();
        let d = Sk && Sk.sheetRect ? Sk.sheetRect(src, sx, sy, pw, ph) : null, tmp = null, img = null;
        if (!d) {
            tmp = new Bitmap(pw, ph);
            tmp.blt(src, sx, sy, pw, ph, 0, 0);
            img = tmp.context.getImageData(0, 0, pw, ph);
            d = img.data;
        }
        let footRow = -1;
        const mark = feet ? new Int16Array(pw).fill(-1) : null;
        for (let i = 0; i < d.length; i += 4) {
            if (mark && d[i] > 200 && d[i + 1] < 80 && d[i + 3] > 128) { const p = i >> 2; mark[p % pw] = Math.max(mark[p % pw], p / pw | 0); }
            if (d[i + 3] < 200 && d[i] + d[i + 1] + d[i + 2] < 30) d[i + 3] = 0;   // (a painted shadow)
            d[i] = d[i + 1] = d[i + 2] = 0;
            if (d[i + 3] > 128) footRow = Math.max(footRow, (i >> 2) / pw | 0);
        }
        let out = null;
        if (footRow >= 0) {
            let left = pw, right = -1;
            for (let y = Math.max(0, footRow - 5); y <= footRow; y++) {
                for (let x = 0; x < pw; x++) if (d[(y * pw + x) * 4 + 3] > 128) { if (x < left) left = x; if (x > right) right = x; }
            }
            const cv = tmp ? tmp.canvas : (silScratch || (silScratch = document.createElement("canvas")));
            if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
            cv.getContext("2d").putImageData(img || new ImageData(d, pw, ph), 0, 0);
            out = new Bitmap(pw + 2 * PAD, ph + 2 * PAD);
            const ctx = out.context;
            ctx.filter = "blur(" + (ph > 80 ? 2 : 1.2) + "px)";
            ctx.drawImage(cv, PAD, PAD);
            ctx.filter = "none";
            out._baseTexture.update();
            out.smooth = true;
            out._footRow = footRow;
            out._footX = (left + right + 1) / 2;
            out._key = "sil," + key;
            if (mark) {
                const xs = [];
                for (let x = 0; x < pw; x++) if (mark[x] >= 0) xs.push(x);
                const ft = new Int16Array(pw);
                for (let x = 0, k = 0; x < pw; x++) {
                    if (!xs.length) { ft[x] = footRow; continue; }
                    while (k < xs.length - 1 && xs[k + 1] <= x) k++;
                    const a = xs[k], b = xs[Math.min(k + 1, xs.length - 1)];
                    ft[x] = x <= a || a === b ? mark[a] : Math.round(mark[a] + (mark[b] - mark[a]) * (x - a) / (b - a));
                }
                out._strips = stripsOf(ft, pw);
            }
        }
        if (tmp) tmp.destroy();
        silCache.set(key, out);
        return out;
    }
    function silhouetteOf(holder, src, sx, sy, pw, ph, feet) {
        const m = holder._cienSil;
        if (m && m.src === src && m.url === src._url && m.sx === sx && m.sy === sy && m.pw === pw && m.ph === ph) return m.out;
        const key = (src._url || "") + "," + sx + "," + sy + "," + pw + "," + ph + (feet ? ",f" : "");
        if (!silCache.has(key) && !spend()) return undefined;   // (made later: this frame's budget is spent)
        const out = silhouette(src, sx, sy, pw, ph, feet);
        holder._cienSil = { src, url: src._url, sx, sy, pw, ph, out };
        return out;
    }

    // ------------------------------------------------------------------
    // The layer's own part: first in Sky's layer, under the trees' and the people's shadows - the sweeps of the buildings, the things',
    // the props' and the player's buildings' shadows, then the erasers (the buildings' cells cut out of all of it). It lies in the
    // map's px: moved by the map's scroll each frame (updateShadows), its shadows stay laid while the screen scrolls.
    // ------------------------------------------------------------------
    function rootOf(layer) {
        let r = layer._cienRoot;
        if (!r) {
            r = layer._cienRoot = new PIXI.Container();
            r.sweeps = r.addChild(new PIXI.Container());
            r.things = r.addChild(new PIXI.Container());
            r.props = r.addChild(new PIXI.Container());
            r.players = r.addChild(new PIXI.Container());
            r.erase = r.addChild(new PIXI.Container());
        }
        if (r.parent !== layer) layer.addChildAt(r, 0);
        else if (layer.children[0] !== r) layer.setChildIndex(r, 0);
        // (erasing only inside the layer's own picture - its filter's: without the filter the layer is drawn straight on the map)
        r.erase.visible = !!layer._shadowFilter;
        return r;
    }

    // a pool of sprites in a container, handed out in order each frame; the rest hidden
    function Pool(make) { this.list = []; this.n = 0; this.shown = 0; this.make = make; }
    Pool.prototype.take = function(box) {
        let e = this.list[this.n];
        if (!e) e = this.list[this.n] = { spr: this.make() };
        if (e.spr.parent !== box) box.addChild(e.spr);
        return e;
    };
    Pool.prototype.use = function(e) { e.spr.visible = true; this.n++; };
    Pool.prototype.finish = function() {
        for (let i = this.n; i < this.shown; i++) this.list[i].spr.visible = false;
        this.shown = this.n;
        this.n = 0;
    };
    Pool.prototype.hide = function() { this.n = 0; if (this.shown) this.finish(); };
    let white = null;
    const eraserSprite = () => {
        if (!white) { white = new Bitmap(8, 8); white.fillAll("#ffffff"); }
        const s = new Sprite(white);
        s.blendMode = PIXI.BLEND_MODES.ERASE;
        return s;
    };

    // ------------------------------------------------------------------
    // 1. Buildings and walls made of tiles
    // ------------------------------------------------------------------
    const K_ROOF = 1, K_WALL = 2, K_SIDE = 3, K_TOP = 4, K_WALK = 5, K_BAND = 6;   // A3 roof row / wall row, A4 side / top / walkable top / a house's band
    const RISE = 0.5;       // a roof adds this share of its rows to the height (it slopes up to the ridge)
    const MAX_RISE = 4;     // rows of a roof that add to it at most
    const MAX_FACE = 8;     // rows of a wall's face that count at most
    const MAX_UP = 4;       // star rows over a building's cells that count as its roof at most
    const PIECE = 16;       // cells: a longer front is laid in pieces (small pictures), hard edges between them
    const G = 64;           // px: a sweep's picture along the shadow (the matrix stretches it to the shadow's length)
    const SOFT = 3;         // px: half of a soft edge (the far end, the sun's side)
    const OVERLAP = 2;      // px a side's sweep runs on into the front's (no seam between them)
    let blocks = null;
    // index[y] = the first of the (sorted) items whose row is >= y; index[H + 1] = the end
    function rowIndex(list, H, rowOf) {
        const idx = new Int32Array(H + 3);
        let i = 0;
        for (let y = 0; y <= H + 2; y++) { while (i < list.length && rowOf(list[i]) < y) i++; idx[y] = i; }
        return idx;
    }
    const span = (idx, H, a, b) => [idx[Math.max(0, Math.min(H + 2, a))], idx[Math.max(0, Math.min(H + 2, b + 1))]];
    // the solids of one map, once per map data (made on the first sunny frame):
    //   runs: a front (columns x0..x1 of one building with their foot on row f) - { x0, x1, f, h, cutL, cutR, sideL, sideR }; a side
    //         { top, bottom } (px of the map) is the part of the front's end column's ground beside it that is not another column of it
    //   rects: the buildings' cells as rectangles { x0, x1, y0, f } (to erase)
    //   things: the B-E tile things standing alone (a barrel, a crate, a lamp post: a tile that blocks, with the "star" tiles over it)
    function blocksFor() {
        if (blocks && blocks.data === $dataMap) return blocks;
        const m = blocks = { data: $dataMap, runs: [], rects: [], things: [], hMax: 0, dMax: 0, rectMax: 0 };
        A.stats.comps = A.stats.runs = A.stats.things = 0;
        if (!outdoor()) return m;
        const W = $dataMap.width, H = $dataMap.height, d = $dataMap.data, flags = $gameMap.tilesetFlags(), n = W * H;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const kind = new Uint8Array(n), ak = new Int16Array(n);
        for (let z = 0; z < 2; z++) {
            const base = z * n;
            for (let i = 0; i < n; i++) {
                const t = d[base + i];
                if (t < 4352 || t >= 8192) continue;   // A3 (roofs, walls) and A4 (walls) only
                const a = Math.floor((t - 2048) / 48), lo = a % 16;
                kind[i] = t < 5888 ? (lo < 8 ? K_ROOF : K_WALL) : lo >= 8 ? K_SIDE : (flags[t] & 15) === 15 ? K_TOP : K_WALK;
                ak[i] = a;
            }
        }
        // (2026-11-11) <CienieBez:x0,y0,x1,y1> in the map's note (any number): tile buildings in these cells throw no shadow (the Silent's huts on
        // Laka pod Gawra: an A3 roof band over an A4 face is one hard box; the B-E things there are left out of "things" too)
        const bez = new Uint8Array(n), reBez = /<CienieBez:(\d+),(\d+),(\d+),(\d+)>/g;
        for (let q; (q = reBez.exec($dataMap.note || ""));) {
            for (let y = +q[2]; y <= +q[4] && y < H; y++) for (let x = +q[1]; x <= +q[3] && x < W; x++) { kind[y * W + x] = 0; bez[y * W + x] = 1; }
        }
        // a tile drawn over the characters (a "star" B-E tile: a roof of the roofs' sheet, a chimney, a crown) lies on the cell
        const starAt = i => { for (let z = 2; z < 4; z++) { const t = d[z * n + i]; if (t > 0 && t < 1024 && (flags[t] & 0x10)) return true; } return false; };
        // a short run (up to 3) of walkable A4 tops right over or under an A3 roof or wall is the house's own wall band (Winlu's
        // timber upper floor) - or any run of them under a roof of star tiles; a longer bare one is a hill's top
        const isA3 = q => q === K_ROOF || q === K_WALL;
        for (let x = 0; x < W; x++) {
            for (let y = 0; y < H;) {
                if (kind[y * W + x] !== K_WALK) { y++; continue; }
                const y0 = y;
                let covered = true;
                while (y < H && kind[y * W + x] === K_WALK) { if (!starAt(y * W + x)) covered = false; y++; }
                if ((y - y0 <= 3 || covered) && ((y0 > 0 && isA3(kind[(y0 - 1) * W + x])) || (y < H && isA3(kind[y * W + x]))))
                    for (let k = y0; k < y; k++) kind[k * W + x] = K_BAND;
            }
        }
        // the buildings: the cells joined side by side
        const solid = q => q !== 0 && q !== K_WALK, comp = new Int32Array(n).fill(-1), stack = [];
        let nc = 0;
        for (let i = 0; i < n; i++) {
            if (!solid(kind[i]) || comp[i] >= 0) continue;
            comp[i] = nc;
            stack.push(i);
            while (stack.length) {
                const j = stack.pop(), x = j % W;
                if (x > 0 && comp[j - 1] < 0 && solid(kind[j - 1])) { comp[j - 1] = nc; stack.push(j - 1); }
                if (x < W - 1 && comp[j + 1] < 0 && solid(kind[j + 1])) { comp[j + 1] = nc; stack.push(j + 1); }
                if (j >= W && comp[j - W] < 0 && solid(kind[j - W])) { comp[j - W] = nc; stack.push(j - W); }
                if (j + W < n && comp[j + W] < 0 && solid(kind[j + W])) { comp[j + W] = nc; stack.push(j + W); }
            }
            nc++;
        }
        A.stats.comps = nc;
        // each column of a building: { x, y0, y1, c, roof (rows of its top: the roof or the wall's top), face (rows of its front), f }.
        // The roof is the top block of one tile kind - Winlu puts roofs in A3's wall rows too, so the change of kind tells, not the row.
        const segs = [], cols = [];
        for (let x = 0; x < W; x++) {
            const col = cols[x] = [];
            for (let y = 0; y < H;) {
                const c = comp[y * W + x];
                if (c < 0) { y++; continue; }
                const y0 = y;
                while (y < H && comp[y * W + x] === c) y++;
                const y1 = y - 1, k0 = kind[y0 * W + x], a0 = ak[y0 * W + x];
                let r = 0;
                while (y0 + r <= y1 && ak[(y0 + r) * W + x] === a0 && kind[(y0 + r) * W + x] === k0) r++;
                let roof;
                if (k0 === K_SIDE || k0 === K_BAND) roof = 0;            // a face from the top (a cliff, a wall's front)
                else if (r <= y1 - y0) roof = r;                          // more than one block: the top one is the roof
                else roof = k0 === K_ROOF || k0 === K_TOP ? r : 0;        // one block: as its row says
                // a house's band under a roof of star tiles (Winlu's roofs' sheet: the roof drawn over the band's cells) is roof too, and
                // so are the star rows right over such a building (its roof's top drawn above its cells), up to MAX_UP
                while (y0 + roof <= y1 && kind[(y0 + roof) * W + x] === K_BAND && starAt((y0 + roof) * W + x)) roof++;
                let up = 0;
                if (k0 === K_BAND && roof > 0) while (up < MAX_UP && y0 - up > 0 && comp[(y0 - up - 1) * W + x] < 0 && starAt((y0 - up - 1) * W + x)) up++;
                const s = { x, y0, y1, c, roof, up, face: y1 - y0 + 1 - roof, pitched: roof > 0 && k0 !== K_TOP, f: y1 + 1 };
                segs.push(s);
                col.push(s);
            }
        }
        // a column of a building that ends higher than its neighbours (a round corner, a wall's foot of B-E tiles under a roof) goes
        // down through the blocking B-E tiles under it as far as they do
        const topBE = i => { for (let z = 3; z >= 0; z--) { const t = d[z * n + i]; if (t > 0 && t < 1024) return t; } return 0; };
        const solidBE = i => { const t = topBE(i); return t > 0 && !(flags[t] & 0x10) && (flags[t] & 15) === 15; };
        const extra = new Uint8Array(n);
        for (const s of segs) {
            let lim = -1;
            for (const nx of [s.x - 1, s.x + 1]) for (const q of cols[nx] || []) if (q.c === s.c && q.y0 <= s.y1 && q.y1 >= s.y0 && q.y1 > lim) lim = q.y1;
            let y = s.y1 + 1;
            while (y <= lim && y < H && comp[y * W + s.x] < 0 && solidBE(y * W + s.x)) { extra[y * W + s.x] = 1; y++; }
            s.face += y - 1 - s.y1;
            s.f = y;
        }
        // one height for all of a building (the middle one of its columns): its shadow is one even shape, not steps
        const hs = [];
        for (const s of segs) (hs[s.c] || (hs[s.c] = [])).push(Math.min(MAX_FACE, s.face) * th + (s.pitched ? RISE * Math.min(MAX_RISE, s.roof + s.up) * th : 0));
        const hOf = hs.map(v => { v.sort((p, q) => p - q); return Math.max(th / 2, v[v.length >> 1]); });
        // the part of a column's ground side (dir -1 left, 1 right) that lies open: not beside another column of the same building
        const sideOf = (s, dir) => {
            const D = (s.roof + s.up) * th;
            if (D <= 0) return null;
            let top = s.f * th - D;
            const bottom = s.f * th;
            for (const q of cols[s.x + dir] || []) {
                if (q.c !== s.c || q.y0 > s.f - 1 || q.f - 1 < s.y0) continue;
                if (q.f >= s.f) return null;                 // the neighbour comes down as far: this side is inside the building
                top = Math.max(top, q.f * th);               // open only under the neighbour's foot
            }
            return bottom - top >= 2 ? { top, bottom } : null;
        };
        // the fronts: the columns of a building side by side with their foot on one row
        const order = segs.slice().sort((p, q) => p.c - q.c || p.f - q.f || p.x - q.x), runs = m.runs;
        for (let i = 0; i < order.length;) {
            const s0 = order[i];
            let j = i + 1;
            while (j < order.length && order[j].c === s0.c && order[j].f === s0.f && order[j].x === order[j - 1].x + 1) j++;
            const list = order.slice(i, j), h = hOf[s0.c];
            for (let k = 0; k < list.length; k += PIECE) {
                const last = Math.min(list.length, k + PIECE) - 1;
                const run = { x0: list[k].x, x1: list[last].x, f: s0.f, h, cutL: k > 0, cutR: last < list.length - 1,
                    sideL: k === 0 ? sideOf(list[0], -1) : null, sideR: last === list.length - 1 ? sideOf(list[last], 1) : null };
                for (const sd of [run.sideL, run.sideR]) if (sd && sd.bottom - sd.top > m.dMax) m.dMax = sd.bottom - sd.top;
                if (h > m.hMax) m.hMax = h;
                runs.push(run);
            }
            i = j;
        }
        runs.sort((p, q) => p.f - q.f || p.x0 - q.x0);
        m.runRow = rowIndex(runs, H, r => r.f);
        A.stats.runs = runs.length;
        // the cells to erase: each column of a building from its top to its foot, side by side ones of the same span joined
        const spans = segs.slice().sort((p, q) => p.f - q.f || p.y0 - q.y0 || p.x - q.x), rects = m.rects;
        for (let i = 0; i < spans.length;) {
            const s0 = spans[i];
            let j = i + 1;
            while (j < spans.length && spans[j].f === s0.f && spans[j].y0 === s0.y0 && spans[j].x === spans[j - 1].x + 1) j++;
            rects.push({ x0: s0.x, x1: spans[j - 1].x, y0: s0.y0, f: s0.f });
            if ((s0.f - s0.y0) * th > m.rectMax) m.rectMax = (s0.f - s0.y0) * th;
            i = j;
        }
        m.rectRow = rowIndex(rects, H, r => r.f);
        // the things standing on the ground as B-E tiles (barrels, crates, carts, stumps, fences, lamp posts, tile trees): a tile that
        // blocks every way and is not drawn over the characters, with the "star" tiles (a crown, a lamp's head) straight above it.
        // Not on a building (windows, doors, a house's foot: those are part of it).
        const things = m.things;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (comp[i] >= 0 || extra[i] || bez[i]) continue;
            const t = topBE(i);
            if (!t || (flags[t] & 0x10) || (flags[t] & 15) !== 15) continue;
            const ids = [t];
            for (let k = 1; k <= 4 && y - k >= 0; k++) {
                const u = topBE((y - k) * W + x);
                if (!u || !(flags[u] & 0x10) || comp[(y - k) * W + x] >= 0) break;
                ids.unshift(u);
            }
            things.push({ x, y, ids, key: ids.join(","), bmp: null, h: ids.length * th });
        }
        m.thingRow = rowIndex(things, H, o => o.y);   // (made row by row: already in order)
        A.stats.things = things.length;
        return m;
    }

    // a dark rectangle for a sweep, w px along its foot and G along the shadow: hard along its foot (local y 0, where it meets the
    // wall), soft at its far end (local y -G) and at the ends asked for (softL: local x 0, softR: local x w); its point (0, 0) at
    // (_ax, _ay). Made once per size (a few per map).
    const sweeps = new Map();
    const ramp = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    function sweepBitmap(w, softL, softR) {
        const key = w + (softL ? "s" : "h") + (softR ? "s" : "h");
        let b = sweeps.get(key);
        if (b) return b;
        const pl = softL ? SOFT : 0, pr = softR ? SOFT : 0, W = pl + w + pr, Hh = SOFT + G;
        b = new Bitmap(W, Hh);
        const ctx = b.context, img = ctx.createImageData(W, Hh), px = img.data;
        for (let y = 0; y < Hh; y++) {
            const fy = ramp((G + SOFT - (Hh - y - 0.5)) / (2 * SOFT));   // (px up from the foot: full to G - SOFT, none from G + SOFT)
            for (let x = 0; x < W; x++) {
                const u = x + 0.5 - pl;
                const fx = (softL ? ramp((u + SOFT) / (2 * SOFT)) : 1) * (softR ? ramp((w + SOFT - u) / (2 * SOFT)) : 1);
                px[(y * W + x) * 4 + 3] = Math.round(255 * fx * fy);
            }
        }
        ctx.putImageData(img, 0, 0);
        b._baseTexture.update();
        b.smooth = true;
        b._ax = pl;
        b._ay = Hh;
        b._key = "sweep," + key;
        sweeps.set(key, b);
        return b;
    }

    // the sun the shadows are laid for: kept until the real one is off by half a px at the top of a tall thing (it moves a little
    // every frame - a game hour a minute - and laying them all again for a change nobody sees cost a part of a ms a frame)
    const SUN_TALL = 400;   // px: the tallest thing that counts
    let laid = null, sunGen = 0;
    function laidSun(sun) {
        const fl = !!sun.flash;
        if (!laid || laid.flash !== fl || ((Math.abs(sun.dx - laid.dx) + Math.abs(sun.dy - laid.dy)) * sun.len + Math.abs(sun.len - laid.len)) * SUN_TALL > 0.5) {
            laid = { dx: sun.dx, dy: sun.dy, len: sun.len, flash: fl };
            sunGen++;
        }
        return laid;
    }

    // a building's front: its foot (the map's px row f * th, from x0 to x1) swept by the sun's offset of its height, and its side
    // away from the sun (the open part of its ground's side) swept the same way. All in the map's px (the part of the layer is moved
    // with the map): laid for a window round the screen, again only when the screen leaves it or the sun moves.
    function layBlocks(S, ls, sun, layer, st, root, w) {
        const m = blocksFor(), runs = m.runs, H = $dataMap.height, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const FLAT = S.FLAT || 0.55, reach = ls.len * m.hMax;
        let shown = 0, sides = 0;
        const [i0, i1] = span(m.runRow, H, Math.floor((w.y0 - FLAT * reach) / th) - 1, Math.ceil((w.y1 + m.dMax) / th) + 1);
        for (let i = i0; i < i1; i++) {
            const run = runs[i], [ox, oy] = offsetOf(ls, S, run.h);
            const x0 = run.x0 * tw, x1 = (run.x1 + 1) * tw, foot = run.f * th;
            if (x1 + Math.max(0, ox) < w.x0 || x0 + Math.min(0, ox) > w.x1 || foot + oy < w.y0 || foot - m.dMax > w.y1) continue;
            const right = ox > 0, side = Math.abs(ox) >= 1 ? (right ? run.sideR : run.sideL) : null;
            const cx = (x0 + x1) / 2, alpha = cloudAlpha(sun, S, layer, cx, foot);
            // the front: hard where it meets the side's sweep and where a piece meets the next one
            const softL = !run.cutL && !(side && !right), softR = !run.cutR && !(side && right);
            const e = st.blocks.take(root.sweeps);
            layMatrix(e.spr, sweepBitmap(x1 - x0 + (run.cutR ? 1 : 0), softL, softR), null, null, 1, 0, -ox / G, -oy / G, x0, foot, false);
            e.spr.alpha = alpha; e.cx = cx; e.cy = foot;
            st.blocks.use(e);
            shown++;
            if (side) {
                const q = st.sides.take(root.sweeps);
                layMatrix(q.spr, sweepBitmap(side.bottom - side.top + OVERLAP, true, false), null, null, 0, 1, -ox / G, -oy / G, right ? x1 : x0, side.top, false);
                q.spr.alpha = alpha; q.cx = cx; q.cy = foot;
                st.sides.use(q);
                sides++;
            }
        }
        st.blocks.finish();
        st.sides.finish();
        A.stats.blocks = shown;
        A.stats.sides = sides;
        layThings(m, S, ls, sun, layer, st, root, w);
        layErasers(m, st, root, w);
    }
    function layErasers(m, st, root, w) {
        const rects = m.rects, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), H = $dataMap.height;
        let shown = 0;
        if (root.erase.visible) {
            const [i0, i1] = span(m.rectRow, H, Math.floor(w.y0 / th) - 1, Math.ceil((w.y1 + m.rectMax) / th) + 1);
            for (let i = i0; i < i1; i++) {
                const q = rects[i], x0 = q.x0 * tw, x1 = (q.x1 + 1) * tw, y0 = q.y0 * th, y1 = q.f * th;
                if (x1 < w.x0 || x0 > w.x1 || y1 < w.y0 || y0 > w.y1) continue;
                const e = st.erasers.take(root.erase), s = e.spr;
                s.x = x0; s.y = y0; s.scale.x = (x1 - x0) / 8; s.scale.y = (y1 - y0) / 8;
                st.erasers.use(e);
                shown++;
            }
        }
        st.erasers.finish();
        A.stats.erasers = shown;
    }
    // a stack of B-E tiles as one picture's silhouette, made when it first comes near the screen, cached by the tiles
    const stacks = new Map();
    function stackSilhouette(o) {
        if (stacks.has(o.key)) return stacks.get(o.key);
        const names = $gameMap.tileset().tilesetNames, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), n = o.ids.length;
        const srcs = o.ids.map(t => ImageManager.loadTileset(names[5 + Math.floor(t / 256)]));
        if (!srcs.every(b => b && b.isReady())) return undefined;
        if (!spend()) return undefined;
        const comp = new Bitmap(tw, th * n);
        o.ids.forEach((t, k) => comp.blt(srcs[k], ((Math.floor(t / 128) % 2) * 8 + (t % 8)) * tw, (Math.floor((t % 256) / 8) % 16) * th, tw, th, 0, k * th));
        comp._url = "tilestack:" + o.key;
        const bmp = silhouette(comp, 0, 0, tw, th * n);
        comp.destroy();
        stacks.set(o.key, bmp);
        return bmp;
    }
    function layThings(m, S, ls, sun, layer, st, root, w) {
        const things = m.things, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), H = $dataMap.height, pool = st.things;
        let shown = 0;
        const reach = 5 * th * ls.len + tw;
        const [i0, i1] = span(m.thingRow, H, Math.floor((w.y0 - reach) / th) - 1, Math.ceil((w.y1 + 5 * th) / th) + 1);
        for (let i = i0; i < i1; i++) {
            const o = things[i], left = o.x * tw, bottom = (o.y + 1) * th, far = o.h * ls.len + tw;
            if (left + tw + far < w.x0 || left - far > w.x1 || bottom - o.h > w.y1 || bottom + far < w.y0) continue;
            if (o.bmp === null) {
                if (o.dead) continue;
                const b = stackSilhouette(o);
                if (b === undefined) { st.pending = true; continue; }   // (its tiles not loaded yet, or this frame's making spent: again next frame)
                if (!b) { o.dead = true; continue; }
                o.bmp = b;
            }
            const bmp = o.bmp, e = pool.take(root.things);
            layLeaned(e.spr, bmp, left + bmp._footX, bottom - (o.h - bmp._footRow - 1) - LIFT, 1, 1, ls, S, false);
            e.cx = left + tw / 2; e.cy = bottom;
            e.spr.alpha = cloudAlpha(sun, S, layer, e.cx, e.cy);
            pool.use(e);
            shown++;
        }
        pool.finish();
        A.stats.tiles = shown;
    }
    // the clouds move on: the laid shadows' strength again (every 6th frame), nothing else
    function dimLaid(S, sun, layer, st) {
        for (const pool of [st.blocks, st.sides, st.things]) {
            for (let i = 0; i < pool.shown; i++) { const e = pool.list[i]; e.spr.alpha = cloudAlpha(sun, S, layer, e.cx, e.cy); }
        }
    }

    // ------------------------------------------------------------------
    // 2. The buildings the player puts up (Farming_Render.js BuildingSprites)
    // ------------------------------------------------------------------
    // (their sprites stand at Math.round of the map's scroll - the tiles and the events at its floor: their part of the layer is moved
    // by that one px, so a shadow keeps to its building while the map scrolls)
    const FLAT_TYPES = new Set(["bedroll"]);   // lies on the ground
    const softShade = src => { const P = T.api("ChoppableTree_parts"), R = P && P.render; return R && R.withSoftShade ? R.withSoftShade(src) : src; };
    function layPlayers(set, S, ls, sun, layer, st, root, w, bx, by) {
        const bs = set._buildingSprites, pool = st.players;
        let shown = 0;
        for (const e of bs ? bs._sprites : []) {
            const spr = e.sprite, f = spr && spr._frame, bm = spr && spr.bitmap;
            let ok = false;
            const mx = spr ? spr.x - bx : 0, my = spr ? spr.y - by : 0;   // (its foot on the map, px)
            if (spr && !e.b.site && !FLAT_TYPES.has(e.b.type) && spr.visible && bm && f && f.width > 0 && bm.isReady()) {
                const reach = f.height * (ls.len * Math.abs(spr.scale.y) + 0.3) + f.width;
                ok = mx + reach >= w.x0 && mx - reach <= w.x1 && my + reach >= w.y0 && my - f.height - 8 <= w.y1;
            }
            if (ok) {
                if (e.b.type === "fence" && !bm._softShade) spr.bitmap = softShade(bm);   // (its texture has a flat shadow painted in)
                const bmp = silhouetteOf(spr, spr.bitmap, f.x, f.y, f.width, f.height);
                if (bmp) {
                    const sx = spr.scale.x, sy = spr.scale.y, h = bmp._footRow + 1, p = pool.take(root.players);
                    layLeaned(p.spr, bmp, mx + (bmp._footX - f.width / 2) * sx, my - (f.height - h + LIFT) * sy, sx, sy, ls, S, false);
                    p.spr.alpha = cloudAlpha(sun, S, layer, mx, my) * spr.alpha;
                    pool.use(p);
                    shown++;
                    if (e.shadow && !e._cienDim) { e.shadow.alpha = AMBIENT; e._cienDim = true; }   // (the sun's shadow is the real one)
                    continue;
                }
            }
            if (e._cienDim && e.shadow) { e.shadow.alpha = ok ? AMBIENT : 1; if (!ok) e._cienDim = false; }
        }
        pool.finish();
        A.stats.players = shown;
    }
    function restorePlayers(set) {
        const bs = set._buildingSprites;
        for (const e of bs ? bs._sprites : []) if (e._cienDim && e.shadow) { e.shadow.alpha = 1; e._cienDim = false; }
    }

    // ------------------------------------------------------------------
    // The spriteset: after the frame's update (the scroll and the buildings in place) the part of the layer is moved with the map; the
    // shadows are laid again only when the screen leaves the window they were laid for, the sun moved, a switch changed or a picture
    // was missing; the clouds' dimming every 6th frame; the player's buildings every 6th frame too (one is put up, one burns down)
    // ------------------------------------------------------------------
    const WIN = 3;   // cells of the window round the screen
    const stOf = set => set._cienie || (set._cienie = { blocks: new Pool(() => new Sprite()), sides: new Pool(() => new Sprite()), things: new Pool(() => new Sprite()),
        players: new Pool(() => new Sprite()), erasers: new Pool(eraserSprite), key: "", win: null, frame: -99, pframe: -99, on: false, pending: false });
    const hideAll = st => { st.blocks.hide(); st.sides.hide(); st.things.hide(); st.erasers.hide(); };
    let broken = false;
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.apply(this, arguments);
        if (broken || !this._tilemap) return;
        try { updateShadows(this); } catch (e) { broken = true; console.error("Cienie.js: turned off", e); }
    };
    function updateShadows(set) {
        const S = Sun(), st = stOf(set), o = A.opts;
        const sun = S && S.now();
        const live = !!sun && S.shadows && sun.light > 0.01 && sun.outdoors !== false && outdoor();
        if (!live) {
            if (st.on) { hideAll(st); st.players.hide(); restorePlayers(set); st.on = false; st.key = ""; }
            const z = A.stats;
            if (z.blocks || z.sides || z.tiles || z.players || z.erasers) z.blocks = z.sides = z.tiles = z.players = z.erasers = 0;
            return;
        }
        st.on = true;
        const layer = S.layer(set._tilemap), root = rootOf(layer), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const dX = $gameMap.displayX() * tw, dY = $gameMap.displayY() * th, vx = Math.ceil(dX), vy = Math.ceil(dY);
        const bx = Math.round(-dX), by = Math.round(-dY);
        if (root.x !== -vx) root.x = -vx;
        if (root.y !== -vy) root.y = -vy;
        if (root.players.x !== bx + vx) root.players.x = bx + vx;
        if (root.players.y !== by + vy) root.players.y = by + vy;
        const ls = laidSun(sun), r = T.view.rect(), fr = Graphics.frameCount;
        const x0 = r.x0 + vx, y0 = r.y0 + vy, x1 = r.x1 + vx, y1 = r.y1 + vy, w0 = st.win;
        const key = sunGen + "," + o.buildings + o.players + "," + T.view.scale();
        const moved = !w0 || x0 < w0.x0 || y0 < w0.y0 || x1 > w0.x1 || y1 > w0.y1;
        if (moved || key !== st.key || st.pending) {
            const M = WIN * tw;
            const w = st.win = moved ? { x0: x0 - M, y0: y0 - M, x1: x1 + M, y1: y1 + M } : w0;
            const again = key !== st.key || moved;
            st.key = key;
            st.pending = false;
            st.frame = fr;
            if (o.buildings) layBlocks(S, ls, sun, layer, st, root, w);
            else { hideAll(st); A.stats.blocks = A.stats.sides = A.stats.tiles = A.stats.erasers = 0; }
            if (again || fr - st.pframe >= 6) { st.pframe = fr; layOrHidePlayers(set, S, ls, sun, layer, st, root, w, bx, by); }
            return;
        }
        if (fr - st.frame >= 6) { st.frame = fr; if (o.buildings) dimLaid(S, sun, layer, st); }
        if (fr - st.pframe >= 6) { st.pframe = fr; layOrHidePlayers(set, S, ls, sun, layer, st, root, st.win, bx, by); }
    }
    function layOrHidePlayers(set, S, ls, sun, layer, st, root, w, bx, by) {
        if (A.opts.players) layPlayers(set, S, ls, sun, layer, st, root, w, bx, by);
        else { st.players.hide(); restorePlayers(set); A.stats.players = 0; }
    }

    // ------------------------------------------------------------------
    // 3. The standing "!" events
    // ------------------------------------------------------------------
    // parts of a wall or a roof (their wall throws the shadow) and things that only look like a thing
    const EXCLUDE = /^!\$?(Drzwi_K_|Fantasy_door|Roof_Windows|Fantasy_chimney|Flame|Wall_decoration|Mt_Cave|Weapon)/;
    function isProp(s) {
        const ch = s._character;
        if (!(ch instanceof Game_Event) || !outdoor()) return false;
        const n = ch.characterName();
        if (!n || n.charCodeAt(0) !== 33 || EXCLUDE.test(n) || ch._priorityType === 0) return false;   // (priority 0: below the characters - flat)
        if (/<Cienie:off>/i.test((ch.event && ch.event().note) || "")) return false;                  // (an event that throws none)
        const P = T.api("ChoppableTree_parts"), O = P && P.objects;
        return !(O && O.anyHarvestConfig && O.anyHarvestConfig(ch));   // (a tree, a rock, a bush, a log: ChoppableTree_Render.js)
    }
    function hideProp(s) {
        const sh = s._cienShadow;
        if (sh && sh.visible) sh.visible = false;
    }
    // laid in the map's px too (an event standing on its cell keeps its place on the map while the screen scrolls): again only when
    // it moved, the sun moved, its picture or frame changed; the clouds' dimming every 8th frame
    function propShadow(s) {
        const S = Sun();
        if (!A.opts.props || !S || !S.shadows) return hideProp(s);
        const sun = S.now();
        if (sun.light <= 0.01 || sun.outdoors === false) return hideProp(s);
        const f = s._frame, bm = s.bitmap, parent = s.parent;
        if (!parent || !s.visible || s.opacity <= 0 || !bm || !f || f.width <= 0 || f.height <= 0 || !bm.isReady()) return hideProp(s);
        const ls = laidSun(sun), sx = s.scale.x, sy = s.scale.y, reach = f.height * (ls.len * Math.abs(sy) + 0.3) + f.width;
        if (!T.view.sees(s.x - reach, s.y - f.height - 8, s.x + reach, s.y + reach)) return hideProp(s);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), mx = s.x + Math.ceil($gameMap.displayX() * tw), my = s.y + Math.ceil($gameMap.displayY() * th);
        const sh0 = s._cienShadow, fr = Graphics.frameCount, ch = s._character;
        if (sh0 && sh0.parent && s._cX === mx && s._cY === my && s._cGen === sunGen && s._cBm === bm && s._cFx === f.x && s._cFy === f.y &&
            s._cSx === sx && s._cSy === sy && s._cOp === s.opacity) {
            if ((fr + s.spriteId) % 8 === 0) sh0.alpha = cloudAlpha(sun, S, S.layer(parent), (ch._realX + 0.5) * tw, (ch._realY + 1) * th) * (s.opacity / 255);
            sh0.visible = sh0.alpha > 0.005;
            return;
        }
        // (2026-11-07, the wreck - user: "cień musi iść nie od piasku, tylko od desek, jakby wraku fizycznie całego"; then "a to nie
        // powinno iść idealnie od desek, żeby było naturalnie?") <Cienie:maska>: the silhouette from the picture's own mask
        // "<name>_Cien" (only the ship - the planks, the masts, the sails; not the sand painted under it - that is its own event below
        // the characters, under the shadows), the same size as the frame, its feet marked (silhouette); laid in strips, each from its
        // own foot - the shadow starts along the hull's round bottom, not from one straight line under its lowest point
        if (s._cienMask === undefined) s._cienMask = /<Cienie:maska>/i.test((ch.event && ch.event().note) || "") || MASKED.has(ch.characterName()) ? 1 : 0;
        let src = bm, sx0 = f.x, sy0 = f.y;
        if (s._cienMask) {
            const mb = ImageManager.loadCharacter(ch.characterName() + "_Cien");
            if (!mb.isReady()) return hideProp(s);
            src = mb; sx0 = 0; sy0 = 0;
        }
        const bmp = silhouetteOf(s, src, sx0, sy0, f.width, f.height, !!s._cienMask);
        if (!bmp) return hideProp(s);
        const layer = S.layer(parent), box = rootOf(layer).props;
        let sh = s._cienShadow;
        const st = bmp._strips;
        const round = st ? 0 : (ROUND_BASE.get(ch.characterName()) || 0);
        if (!sh) sh = s._cienShadow = st || round ? new PIXI.Container() : new Sprite();
        if (sh.parent !== box) box.addChild(sh);
        if (st) {
            const [ox, oy] = offsetOf(ls, S, Math.abs(sy));   // (per px of height: the same lean for every strip)
            while (sh.children.length < st.length) sh.addChild(new Sprite());
            for (let i = 0; i < sh.children.length; i++) {
                const q = st[i], spr = sh.children[i];
                spr.visible = !!q;
                if (q) layMatrix(spr, bmp, 0, PAD + q.h, sx, 0, -ox, -oy, mx + (q.fx - PAD - f.width / 2) * sx, my - (f.height - q.h + LIFT) * sy, false, [q.fx, q.fw]);
            }
        } else {
            const h = bmp._footRow + 1, fx0 = mx + (bmp._footX - f.width / 2) * sx, fy0 = my - (f.height - h + LIFT) * sy;
            if (round) {
                while (sh.children.length < ROUND_T.length) sh.addChild(new Sprite());
                for (let i = 0; i < ROUND_T.length; i++) {
                    const t = ROUND_T[i];
                    layLeaned(sh.children[i], bmp, fx0, fy0 + t * round / 2 * Math.abs(sy), sx * Math.sqrt(1 - t * t), sy, ls, S, false);
                }
            } else layLeaned(sh, bmp, fx0, fy0, sx, sy, ls, S, false);
        }
        sh.alpha = cloudAlpha(sun, S, layer, (ch._realX + 0.5) * tw, (ch._realY + 1) * th) * (s.opacity / 255);
        sh.visible = sh.alpha > 0.005;
        s._cX = mx; s._cY = my; s._cGen = sunGen; s._cBm = bm; s._cFx = f.x; s._cFy = f.y; s._cSx = sx; s._cSy = sy; s._cOp = s.opacity;
    }
    T.sprite.hook({ owner: PLUGIN, method: "updateOther", when: isProp, after: propShadow });

    // the shadow goes with its sprite
    const _destroy = Sprite_Character.prototype.destroy;
    Sprite_Character.prototype.destroy = function(options) {
        const sh = this._cienShadow;
        if (sh) { if (sh.parent) sh.parent.removeChild(sh); this._cienShadow = null; }
        _destroy.call(this, options);
    };
    // (for the tests and the screenshots: the solids of the map now)
    A.solids = () => blocksFor();
    A.silhouette = silhouette;   // (for tests)
})();
