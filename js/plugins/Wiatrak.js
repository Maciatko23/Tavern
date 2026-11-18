//=============================================================================
// Wiatrak.js
//=============================================================================
// (2026-11-13, the user on the new Podgrodzie: „wiatrak ma być węższy i trochę wyższy i ma się płynnie kręcić bez błędów w grafice; koło
// młyna też ma być pole z rosnącym zbożem”)
//   1. SAILS: an event whose note says <Wiatrak:picture,hubY,speed> gets the sails (img/system/<picture>.png, one frame, the hub in
//      its middle) as a child of its own sprite: they turn smoothly (the sprite's rotation, a smooth texture - no frame steps, no frame
//      of a sheet cut wrong), hubY px above the event's foot, speed in turns a minute; faster in rain, fastest in a storm, slowly in
//      calm nights. Being the tower's child they sort with it: a hero behind the tower is behind the sails too.
//   2. FIELD: an event whose note says <Pole:w,h> (its cell = the field's top-left) draws a field of barley over w x h cells, one baked
//      picture (the farm's own barley pictures, Farm_Crops row 3, two staggered tufts a cell) by the season: spring young green,
//      summer tall green then golden, early autumn golden, then stubble; winter bare soil. Two baked frames swapped slowly - the ears
//      sway in the wind. It lies under the people (z 1, like the farm's crops); the field's cells keep their own passability.
//   3. SHADOWS (2026-11-18, the user picked them from what threw no sun shadow yet): the sails' shadow turns with them - their silhouette
//      in the tower's picture plane, hubY px over its foot, leaned onto the ground by the sun the way Cienie.js leans the tower (so it
//      joins the tower's own); the grain's shadow sways with the ears - the grown rows (stages 1-3) as silhouettes in pieces of a
//      row (SH_SEGS segments each, one atlas), each leaned from its row's foot plus the pieces' own lean in the wind (the mean of
//      its segments' sway and bending round the hero). Both in Sky.js's one sun-shadow layer: they follow the sun, the clouds,
//      the rain and go at night, and never darken twice where they meet the trees' or the tower's.
// Costs: the sails one rotation a frame; the field two bitmaps of the field's size, baked again only when its stage changes; the
// shadows one sprite for the sails and a few dozen for a field (one texture each: one draw), a matrix a frame while near.

/*:
 * @target MZ
 * @plugindesc Wiatrak i pole: płynnie obracające się skrzydła wiatraka (<Wiatrak:obrazek,wysokość,obroty> w notatce zdarzenia wieży) i pole zboża rosnącego z porami roku (<Pole:szer,wys> w notatce zdarzenia); cień skrzydeł i zboża od słońca. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Wiatrak.js
 *   Zdarzenie wieży wiatraka: w notatce <Wiatrak:Wiatrak_Smigla,-300,8,1.25>
 *     obrazek skrzydeł z img/system (piasta na środku), piasta 300 px nad stopą zdarzenia,
 *     8 obrotów na minutę (w deszczu szybciej, w burzy najszybciej, nocą wolniej),
 *     skrzydła 1,25 raza większe niż obrazek (bez tej liczby: 1).
 *   Zdarzenie pola: w notatce <Pole:8,5> - pole jęczmienia 8 x 5 kratek, od pola zdarzenia w prawo i w dół.
 *     Wiosną młode, latem wysokie, potem złote; jesienią ściernisko; zimą goła ziemia.
 */

(() => {
    "use strict";
    const T = window.Tawerna;

    // ------------------------------------------------------------------
    // 1. The sails
    // ------------------------------------------------------------------
    let held = null, heldNow = false;   // (the sails held at an angle - api.hold)
    const sailsOf = ev => {
        const n = ev && ev.event && ev.event() ? ev.event().note || "" : "";
        const m = /<Wiatrak:\s*([^,>]+)\s*,\s*(-?\d+)\s*(?:,\s*([\d.]+))?\s*(?:,\s*([\d.]+))?\s*>/i.exec(n);
        return m ? { pic: m[1].trim(), hubY: Number(m[2]), rpm: Number(m[3] || 10), scale: Number(m[4] || 1) } : null;
    };
    function windFactor() {
        const w = $gameScreen.weatherType(), p = $gameScreen.weatherPower();
        let f = w === "storm" ? 2.4 : w === "rain" && p > 0 ? 1.4 : 1;
        const h = T && T.time && T.time.hour ? T.time.hour() : 12;
        if (h < 5 || h >= 22) f *= 0.55;
        return f;
    }
    // ------------------------------------------------------------------
    // 3. Shadows (Sky.js's sun-shadow layer)
    // ------------------------------------------------------------------
    const Sun = () => T.api("Sun");
    const CLOUD_DIM = 0.85;   // as the trees and Cienie.js: a cloud over a shadow takes this much of it
    const OPT = { shadows: true };   // (Wiatrak.opts.shadows: the sails' and the grain's shadows - for the tests' before / after)
    // the sun now, if it throws shadows here: { S, sun, ox, oy } - the ground offset of a point per px of its height
    function sunHere() {
        const S = Sun(), sun = S && S.now ? S.now() : null;
        if (!OPT.shadows || !S || !S.shadows || !sun || sun.light <= 0.01 || sun.outdoors === false || !S.layer) return null;
        const FLAT = S.FLAT || 0.55;
        return { S, sun, ox: sun.dx * sun.len, oy: FLAT * sun.dy * sun.len };
    }
    const cloudAlpha = (h, layer, mx, my) => h.S.layerAlpha(layer) * (h.sun.flash ? 1 : 1 - CLOUD_DIM * (h.S.cloudCover ? h.S.cloudCover(mx, my) : 0));
    // a sprite's own matrix (as Cienie.js lays its shadows: PIXI does not make it again from the position and the scale)
    function setMatrix(spr, a, b, c, d, tx, ty) {
        const tf = spr.transform, lt = tf.localTransform;
        if (tf._currentLocalID === tf._localID && lt.a === a && lt.b === b && lt.c === c && lt.d === d && lt.tx === tx && lt.ty === ty) return;
        lt.a = a; lt.b = b; lt.c = c; lt.d = d; lt.tx = tx; lt.ty = ty;
        tf._currentLocalID = tf._localID;
        tf._parentID = -1;
    }
    // a picture (or a part of it) as a soft black silhouette, PAD px round it
    const PAD = 3;
    function silhouette(src, sx, sy, w, h, blur) {
        const img = src.image || src.canvas, out = new Bitmap(w + 2 * PAD, h + 2 * PAD), ctx = out.context;
        ctx.filter = "brightness(0) blur(" + blur + "px)";
        ctx.drawImage(img, sx, sy, w, h, PAD, PAD, w, h);
        ctx.filter = "none";
        out._baseTexture.update();
        out.smooth = true;
        return out;
    }
    // the sails: their silhouette once a picture; the shadow - a box with the sails' lean matrix in the layer, the silhouette in it at
    // the hub (the sails' own place, turn and size on the tower)
    const sailSils = new Map();
    function sailsShadow(spr, sp) {
        const ch = spr._character, tm = spr.parent, h = sunHere();
        let box = spr._sailsShadow;
        if (!h || !tm || !spr.visible || !sp.bitmap.isReady()) { if (box) box.visible = false; return; }
        const bm = sp.bitmap, key = bm._url || "";
        let sil = sailSils.get(key);
        if (!sil) { sil = silhouette(bm, 0, 0, bm.width, bm.height, 1.5); sailSils.set(key, sil); }
        if (!box) {
            box = spr._sailsShadow = new PIXI.Container();
            box._s = box.addChild(new Sprite(sil));
            box._s.anchor.set(0.5, 0.5);
        }
        const layer = h.S.layer(tm);
        if (box.parent !== layer) layer.addChild(box);
        const s = box._s;
        if (s.bitmap !== sil) s.bitmap = sil;
        // (a round tower: its foot row is the base's front rim, its axis stands on the disc's middle - Cienie.roundBase px deep - and
        // the hub is that much less high over the ground there)
        const C = window.Cienie, rb = (C && C.roundBase ? C.roundBase(ch.characterName()) : 0) / 2 * spr.scale.y;
        s.x = sp.x; s.y = sp.y + rb; s.rotation = sp.rotation;
        s.scale.set(sp.scale.x * spr.scale.x, sp.scale.y * spr.scale.y);
        setMatrix(box, 1, 0, -h.ox, -h.oy, spr.x, spr.y - rb);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        if ((Graphics.frameCount + spr.spriteId) % 8 === 0 || !box.visible) box.alpha = cloudAlpha(h, layer, (ch._realX + 0.5) * tw, (ch._realY + 1) * th) * (spr.opacity / 255);
        box.visible = sp.visible;
    }

    // (TawernaCore's one dispatcher: only the events with the note get the hook)
    T.sprite.hook({ owner: "Wiatrak", method: "update", when: s => !!sailsOf(s._character), after(s) { sailsUpdate.call(s); } });
    function sailsUpdate() {
        const ch = this._character;
        if (!(ch instanceof Game_Event)) return;
        if (this._wiatrakFor !== ch) {
            this._wiatrakFor = ch;
            const s = sailsOf(ch);
            if (this._sails) { this.removeChild(this._sails); this._sails = null; }
            if (s) {
                const sp = new Sprite(ImageManager.loadSystem(s.pic));
                sp.anchor.set(0.5, 0.5); sp.y = s.hubY; sp.bitmap.smooth = true; sp.scale.set(s.scale, s.scale);
                sp._cfg = s; sp._ang = ((ch.eventId() * 1.37) % 6.283);
                this._sails = sp; this.addChild(sp);
                this._wyKeep = true;   // (Wydajnosc.js: a settled event far off is not updated every frame - these must turn on)
            }
        }
        const sp = this._sails;
        if (!sp) return;
        // (eased: the wind changes the speed little by little)
        // (2026-11-15, Mlyn.js: the signals of W19) held: the sails stand at an angle - they turn to it by the shorter way (four
        // blades: every quarter turn looks the same) and stop; released, the wind takes them again
        if (held !== null) {
            const Q = Math.PI / 2;
            let d = (((held - sp._ang) % Q) + Q) % Q; if (d > Q / 2) d -= Q;
            sp._ang += heldNow ? d : Math.max(-0.02, Math.min(0.02, d));
            sp._rpm = 0; sp.rotation = sp._ang; sp.visible = this.visible;
            sailsShadow(this, sp);
            return;
        }
        const want = sp._cfg.rpm * windFactor();
        sp._rpm = sp._rpm === undefined ? want : sp._rpm + (want - sp._rpm) * 0.01;
        sp._ang = (sp._ang + sp._rpm * Math.PI * 2 / 3600) % (Math.PI * 2);
        sp.rotation = sp._ang;
        sp.visible = this.visible;
        sailsShadow(this, sp);
    }

    // ------------------------------------------------------------------
    // 2. The field
    // ------------------------------------------------------------------
    const fieldOf = ev => {
        const n = ev && ev.event && ev.event() ? ev.event().note || "" : "";
        const m = /<Pole:\s*(\d+)\s*,\s*(\d+)\s*>/i.exec(n);
        return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
    };
    // the stage by the day: -1 bare soil, 0 sprouts, 1 young, 2 tall green, 3 golden, 4 stubble
    function stageNow() {
        const s = T.time.season(), d = T.time.dayOfSeason(), L = T.time.seasonLength();
        if (s === 0) return d <= L * 0.3 ? 0 : 1;
        if (s === 1) return d <= L * 0.5 ? 2 : 3;
        if (s === 2) return d <= L * 0.35 ? 3 : 4;
        return -1;
    }
    const hash = (x, y, k) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 144665); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    // (2026-11-13, the user: „jeden rządek od góry mniej, bo nachodzi na płot; płynne, lekkie falowanie na wietrze, przy burzy dynamiczne;
    // jak gracz chodzi w wyrośniętym zbożu, to go widać do połowy i zboża się zginają, jak przechodzi; zboża wygeneruj bardzo ładne”)
    //   - the plants: img/system/Pole_Zboze.png (PixelLab: row 0 young, row 1 tall green, row 2 golden; COLS clumps of 48 x 48 a row,
    //     the base at the bottom); without it the farm's own barley (Farm_Crops row 3)
    //   - every two neighbouring clumps of a row are one sprite (baked once a stage into one atlas), anchored at its foot and SHEARED
    //     (skew): the wind's slow wave travelling over the field, gusts sweeping it (in rain and a storm more and faster, at night calmer),
    //     and a spring that bends them away from the hero walking through and lets them swing back
    //   - those sprites stand with the people (z 3, sorted by their foot): the rows in front of the hero hide his lower half
    //   - the soil, the sprouts and the stubble: one flat picture under everything (z 1)
    const PIC = "Pole_Zboze", COLS = 6, TW = 48, SEG = 2, ROW0 = 40, ROW_STEP = 24;
    function source(stage) {   // { bm, rects: [[sx, sy]...] } of the clumps for a stage
        const z = ImageManager.loadSystem(PIC);
        if (z.isReady() && z.width >= TW * COLS) {
            const row = stage <= 1 ? 0 : stage === 2 ? 1 : 2;
            return { bm: z, rects: Array.from({ length: COLS }, (_, i) => [i * TW, row * TW]) };
        }
        if (!z.isError || !z.isError()) { if (!z.isReady()) return null; }
        const f = ImageManager.loadSystem("Farm_Crops");
        if (!f.isReady()) return null;
        return { bm: f, rects: [[Math.min(3, Math.max(0, stage)) * TW, 3 * TW]] };
    }
    // the clumps of the field (field-local px: x the left of the 48 px picture, b its foot): the first row a little below the fence
    // (gracz 2026-11-13: „żeby krawędzie pola były dostosowane do terenu, bo teraz to wygląda jak wklejony prostokąt”) the field's own
    // outline: rounded corners and a wandering, noisy edge; the furrows fade out towards it, the plants thin out and get lower - by the
    // field's border only the bare earth is left, which Ziemia.js blends into the grass gradually
    const vnoise = (x, y, sc, seed) => {
        const gx = Math.floor(x / sc), gy = Math.floor(y / sc), fx = x / sc - gx, fy = y / sc - gy;
        const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
        const a = hash(gx, gy, seed), b = hash(gx + 1, gy, seed), c = hash(gx, gy + 1, seed), d = hash(gx + 1, gy + 1, seed);
        return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    };
    const smooth01 = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    function fieldMask(f, px, py) {   // 0 (outside the ploughed part) .. 1 (inside), field-local px
        const W = f.w * TW, H = f.h * TW, R = 64;
        let d = Math.min(px, W - px, py, H - py);
        const cx = px < R ? R - px : px > W - R ? px - (W - R) : 0, cy = py < R ? R - py : py > H - R ? py - (H - R) : 0;
        if (cx > 0 && cy > 0) d = Math.min(d, R - Math.hypot(cx, cy));
        const n = (vnoise(px, py, 58, 71) - 0.5) * 2 * 26 + (vnoise(px, py, 17, 72) - 0.5) * 2 * 9 + (vnoise(px, py, 6, 73) - 0.5) * 2 * 3;
        return smooth01(2, 44, d + n);
    }
    // the edge's mask of the whole field, a value a pixel (2026-11-18, wydajność: three noises at each of a few hundred thousand pixels -
    // ~100 ms at CPU 4x - each time the map was entered, the field's sprite is made anew then): worked out on a grid of MASK_STEP px
    // and smoothed between its points (the noises' finest grain is 6 px of 3 px height: no step is seen), once per field's size
    const MASK_STEP = 4, masks = new Map();
    function maskOf(f) {
        const key = f.w + "x" + f.h;
        if (masks.has(key)) return masks.get(key);
        const W = f.w * TW, H = f.h * TW, gw = Math.ceil(W / MASK_STEP) + 1, gh = Math.ceil(H / MASK_STEP) + 1, G = new Float32Array(gw * gh);
        for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) G[gy * gw + gx] = fieldMask(f, Math.min(W, gx * MASK_STEP) + 0.5, Math.min(H, gy * MASK_STEP) + 0.5);
        const M = new Float32Array(W * H);
        for (let y = 0; y < H; y++) {
            const fy = y / MASK_STEP, y0 = Math.floor(fy), ty = fy - y0, r0 = y0 * gw, r1 = Math.min(gh - 1, y0 + 1) * gw;
            for (let x = 0; x < W; x++) {
                const fx = x / MASK_STEP, x0 = Math.floor(fx), tx = fx - x0, x1 = Math.min(gw - 1, x0 + 1);
                const top = G[r0 + x0] + (G[r0 + x1] - G[r0 + x0]) * tx, bot = G[r1 + x0] + (G[r1 + x1] - G[r1 + x0]) * tx;
                M[y * W + x] = top + (bot - top) * ty;
            }
        }
        masks.set(key, M);
        return M;
    }
    function clumps(f) {
        const out = [];
        for (let r = 0; ROW0 + r * ROW_STEP <= f.h * TW - 6; r++) for (let c = 0; c < f.w * 2; c++) {
            const jx = Math.round((hash(c, r, 1) - 0.5) * 6), jy = Math.round((hash(c, r, 2) - 0.5) * 4);
            const x = c * 24 + (r % 2 ? 12 : 0) - 12 + jx;
            if (x < -16 || x > f.w * TW - 32) continue;
            const b0 = ROW0 + r * ROW_STEP + jy, m = fieldMask(f, x + TW / 2, b0 - 4);
            if (m < 0.42 + (hash(c, r, 8) - 0.5) * 0.3) continue;   // (by the edge: fewer, ragged)
            out.push({ r, c, x, b: b0, v: Math.floor(hash(c, r, 5) * 1000), flip: hash(c, r, 6) < 0.5, s: (0.86 + hash(c, r, 7) * 0.2) * (0.62 + 0.38 * m) });
        }
        return out;
    }
    // one clump drawn into a canvas context with its foot at (fx, fb)
    function drawClump(ctx, src, k, fx, fb, scaleY) {
        const [sx, sy] = src.rects[k.v % src.rects.length], cv = src.bm.canvas, h = Math.round(TW * k.s * scaleY), w = Math.round(TW * (0.92 + k.s * 0.08));
        ctx.save();
        ctx.translate(fx + TW / 2, fb);
        if (k.flip) ctx.scale(-1, 1);
        ctx.drawImage(cv, sx, sy, TW, TW, -w / 2, -h, w, h);
        ctx.restore();
    }
    // the ground picture: soil furrows, and (sprouts / stubble) the low plants
    function bakeGround(src, f, stage) {
        const bm = new Bitmap(f.w * TW, f.h * TW), ctx = bm.context;
        for (let y = 0; y < f.h * TW; y += 4) {
            ctx.fillStyle = (y / 4) % 3 === 0 ? "rgba(58,40,24,0.55)" : (y / 4) % 3 === 1 ? "rgba(92,66,40,0.5)" : "rgba(76,54,32,0.5)";
            ctx.fillRect(0, y, f.w * TW, 4);
        }
        {   // the furrows fade towards the field's wandering edge
            const W = f.w * TW, H = f.h * TW, img = ctx.getImageData(0, 0, W, H), d = img.data, M = maskOf(f);
            for (let i = 0, p = 3; i < M.length; i++, p += 4) d[p] = Math.round(d[p] * M[i]);
            ctx.putImageData(img, 0, 0);
        }
        ctx.imageSmoothingEnabled = false;
        if (src && (stage === 0 || stage === 4)) for (const k of clumps(f)) {
            if (stage === 0) drawClump(ctx, src, k, k.x, k.b, 0.45);
            else {   // the stubble: the clump's lowest 9 px, a row of cut stalks
                const [sx, sy] = src.rects[k.v % src.rects.length];
                ctx.drawImage(src.bm.canvas, sx, sy + TW - 9, TW, 9, k.x, k.b - 9, TW, 9);
            }
        }
        bm._baseTexture.update();
        return bm;
    }
    // the swaying plants: the segments (two clumps of a row each) baked into one atlas
    function bakeSegments(src, f, stage) {
        const groups = new Map();
        for (const k of clumps(f)) { const key = k.r + ":" + Math.floor(k.c / SEG); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(k); }
        const segs = [];
        for (const list of groups.values()) {
            const x0 = Math.min(...list.map(k => k.x)) - 4, x1 = Math.max(...list.map(k => k.x)) + TW + 4, b = Math.max(...list.map(k => k.b));
            segs.push({ list, x0, w: x1 - x0, b, r: list[0].r, cx: (x0 + x1) / 2 });
        }
        const CW = 112, H = TW + 16, perRow = 9;
        const atlas = new Bitmap(perRow * CW, Math.ceil(segs.length / perRow) * H), ctx = atlas.context;
        ctx.imageSmoothingEnabled = false;
        const sy = stage === 1 ? 0.62 : stage === 2 ? 1.12 : 1;   // (young: shorter; the green stalks are thin - a little taller, so they hide the legs too)
        segs.forEach((g, i) => {
            g.ax = (i % perRow) * CW; g.ay = Math.floor(i / perRow) * H;
            for (const k of g.list.slice().sort((a, b) => a.b - b.b)) drawClump(ctx, src, k, g.ax + (k.x - g.x0), g.ay + H - (g.b - k.b), sy);
        });
        atlas._baseTexture.update();
        return { atlas, segs, H };
    }
    // the grain's shadow: the segments of a row in pieces of SH_SEGS, each piece one silhouette (its foot the row's lowest foot), all in
    // one atlas; piece.idx = its segments' places in the list (their sway is the piece's lean)
    const SH_SEGS = 4, SH_ALPHA = 0.8;   // (thin stalks: a little lighter than a tree's)
    function bakeShadows(B) {
        const rows = new Map();
        B.segs.forEach((g, i) => { if (!rows.has(g.r)) rows.set(g.r, []); rows.get(g.r).push(i); });
        const pieces = [];
        for (const list of rows.values()) {
            list.sort((p, q) => B.segs[p].x0 - B.segs[q].x0);
            for (let k = 0; k < list.length; k += SH_SEGS) {
                const idx = list.slice(k, k + SH_SEGS), gs = idx.map(i => B.segs[i]);
                const x0 = Math.min(...gs.map(g => g.x0)), x1 = Math.max(...gs.map(g => g.x0 + g.w)), b = Math.max(...gs.map(g => g.b));
                pieces.push({ idx, x0, w: Math.ceil(x1 - x0), b, gs });
            }
        }
        // (a gap round each piece: the blur does not run into the next one)
        const GAP = 4, HC = B.H + 2 * GAP, perRow = 4, CW = Math.max(...pieces.map(p => p.w), 1) + 2 * GAP;
        const comp = new Bitmap(perRow * CW, Math.ceil(pieces.length / perRow) * HC), ctx = comp.context;
        ctx.imageSmoothingEnabled = false;
        pieces.forEach((p, i) => {
            const bx = (i % perRow) * CW + GAP, by = Math.floor(i / perRow) * HC + GAP;   // (the piece's box, its foot at by + B.H)
            for (const g of p.gs) ctx.drawImage(B.atlas.canvas, g.ax, g.ay, Math.ceil(g.w), B.H, bx + (g.x0 - p.x0), by - (p.b - g.b), Math.ceil(g.w), B.H);
            delete p.gs;
            p.fx = PAD + bx - GAP; p.fy = PAD + by - GAP; p.fw = p.w + 2 * GAP; p.fh = HC;   // (its frame in the silhouettes' atlas)
            p.ax = GAP / p.fw; p.ay = (GAP + B.H) / HC;                                     // (its anchor: the piece's left end at its foot)
        });
        const atlas = silhouette(comp, 0, 0, comp.width, comp.height, 1);
        comp.destroy();
        return { atlas, pieces };
    }

    // (2026-11-18, wydajność - the user: "co się da, to robimy": the two fields of Podgrodzie were 247 sprites of the tilemap, each sorted,
    // updated and drawn on its own every frame, and their shadow 58 more) a ROW of the field is ONE mesh: its segments' quads, sheared
    // every frame exactly as the sprites were (skew.x = -w about the foot, scale.y), the row placed at its foot - so it still sorts with
    // the people (the rows in front of the hero hide his legs, the ones behind him are behind him); the shadow's pieces are one mesh
    const quad = (I, k) => { const v = k * 4; I.set([v, v + 1, v + 2, v, v + 2, v + 3], k * 6); };
    function rowMeshes(B) {
        const rows = new Map();
        B.segs.forEach((g, i) => { if (!rows.has(g.r)) rows.set(g.r, []); rows.get(g.r).push(i); });
        const tex = new PIXI.Texture(B.atlas._baseTexture), AW = B.atlas.width, AH = B.atlas.height, out = [];
        for (const idx of rows.values()) {
            idx.sort((p, q) => B.segs[p].b - B.segs[q].b || p - q);   // (in a row as the sprites were sorted: by the foot, then made first)
            const n = idx.length, U = new Float32Array(n * 8), I = new Uint16Array(n * 6);
            idx.forEach((i, k) => {
                const g = B.segs[i], u0 = g.ax / AW, u1 = (g.ax + Math.ceil(g.w)) / AW, v0 = g.ay / AH, v1 = (g.ay + B.H) / AH;
                U.set([u0, v0, u1, v0, u1, v1, u0, v1], k * 8);
                quad(I, k);
            });
            const mesh = new PIXI.SimpleMesh(tex, new Float32Array(n * 8), U, I);
            mesh.z = 3; mesh.spriteId = Sprite._counter++;
            out.push({ mesh, idx, foot: Math.max(...idx.map(i => B.segs[i].b)) });
        }
        return out;
    }
    function shadowMesh(SB) {
        const n = SB.pieces.length, AW = SB.atlas.width, AH = SB.atlas.height, U = new Float32Array(n * 8), I = new Uint16Array(n * 6);
        SB.pieces.forEach((p, k) => {
            const u0 = p.fx / AW, u1 = (p.fx + p.fw) / AW, v0 = p.fy / AH, v1 = (p.fy + p.fh) / AH;
            U.set([u0, v0, u1, v0, u1, v1, u0, v1], k * 8);
            quad(I, k);
        });
        const mesh = new PIXI.SimpleMesh(new PIXI.Texture(SB.atlas._baseTexture), new Float32Array(n * 8), U, I);
        mesh.visible = false;
        return mesh;
    }
    function dropField(spr) {   // (the stage changed or the map is left: the meshes and their pictures away)
        for (const r of spr._poleRows || []) { if (r.mesh.parent) r.mesh.parent.removeChild(r.mesh); r.mesh.destroy({ texture: true, baseTexture: false }); }
        spr._poleRows = [];
        if (spr._poleAtlas) { spr._poleAtlas.destroy(); spr._poleAtlas = null; }
        const s = spr._poleShadow;
        if (s) { if (s.mesh.parent) s.mesh.parent.removeChild(s.mesh); s.mesh.destroy({ texture: true, baseTexture: false }); s.atlas.destroy(); spr._poleShadow = null; }
    }
    // the wind's strength now (calm 1, rain 1.6, storm 2.8; at night calmer)
    function windNow() {
        const wt = $gameScreen.weatherType(), pw = $gameScreen.weatherPower();
        let w = wt === "storm" ? 2.8 : (wt === "rain" && pw > 0) ? 1.6 : 1;
        const h = T.time && T.time.hour ? T.time.hour() : 12;
        if (h < 5 || h >= 22) w *= 0.7;
        return w;
    }
    // a soft rustle (WebAudio, through Atmosphere's sound bus) while the hero wades through the grown grain
    let noiseBuf = null;
    function rustle(gain) {
        const A = window.Atmosphere;
        if (!A || !A.audioContext || !A.bus) return;
        try {
            const c = A.audioContext(), dest = A.bus(c, "se");
            if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
                noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.4), c.sampleRate);
                const d = noiseBuf.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            }
            const src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + 0.01;
            src.buffer = noiseBuf; fl.type = "bandpass"; fl.frequency.value = 2600 + Math.random() * 1400; fl.Q.value = 0.9;
            g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 * gain, t + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            src.connect(fl); fl.connect(g); g.connect(dest); src.start(t); src.stop(t + 0.32);
        } catch (e) { /* (no sound: no harm) */ }
    }
    T.sprite.hook({ owner: "Wiatrak", method: "update", when: s => !!fieldOf(s._character), after(s) { fieldUpdate.call(s); } });
    function fieldUpdate() {
        const ch = this._character;
        if (!(ch instanceof Game_Event)) return;
        if (this._poleFor !== ch) {
            this._poleFor = ch;
            this._pole = fieldOf(ch);
            if (this._pole) {
                this._poleGround = new Sprite(); this._poleGround.z = 1; this._poleStage = null; this._poleSegs = [];
                // (gracz 2026-11-13: „pole się z graczem porusza”) placed here every frame: Wydajnosc.js must not idle this settled event
                this._wyKeep = true;
            }
        }
        const f = this._pole;
        if (!f) return;
        const tm = this.parent;
        if (!tm) return;
        if (!this._poleGround.parent) tm.addChild(this._poleGround);
        const st = stageNow();
        if (st !== this._poleStage) {
            const src = source(st);
            if (!src) return;
            this._poleStage = st;
            dropField(this);
            this._poleSegs = [];
            this._poleGround.bitmap = bakeGround(src, f, st);
            if (st >= 1 && st <= 3) {
                const B = bakeSegments(src, f, st);
                this._poleAtlas = B.atlas; this._poleH = B.H;
                for (const g of B.segs) this._poleSegs.push({ cx: g.cx, b: g.b, r: g.r, x0: g.x0, wpx: Math.ceil(g.w), p: 0, v: 0, w: 0 });
                this._poleRows = rowMeshes(B);
                for (const r of this._poleRows) tm.addChild(r.mesh);
                // the grain's shadow (in Sky's layer, added when the sun shines)
                const SB = bakeShadows(B);
                this._poleShadow = { atlas: SB.atlas, mesh: shadowMesh(SB), pieces: SB.pieces, alphaAt: -99 };
            }
        }
        const tw = $gameMap.tileWidth(), ox = Math.round($gameMap.adjustX(ch.x) * tw), oy = Math.round($gameMap.adjustY(ch.y) * tw);
        this._poleGround.x = ox; this._poleGround.y = oy;
        const segs = this._poleSegs;
        if (!segs.length) return;
        const near = ox < Graphics.width + 60 && ox + f.w * tw > -60 && oy < Graphics.height + 60 && oy + f.h * tw > -80;
        const rows = this._poleRows;
        for (const r of rows) r.mesh.visible = near;
        // (a low sun lays the grain's shadow up to ~2.5 x its height off the field: kept swaying while that can be on the screen)
        const SP = 200, nearS = ox < Graphics.width + SP && ox + f.w * tw > -SP && oy < Graphics.height + SP && oy + f.h * tw > -SP;
        const shL = this._poleShadow, sh = nearS && shL ? sunHere() : null;
        if (shL && !sh && shL.mesh.visible) shL.mesh.visible = false;
        if (!near && !sh) return;
        // the wind: a slow wave over the field, a gust sweeping across it now and then; young plants sway less, ripe ears slower
        const fc = Graphics.frameCount;
        this._poleWind = (this._poleWind || 1) + (windNow() - (this._poleWind || 1)) * 0.01;
        const Wt = this._poleWind;
        const amp = (st === 1 ? 0.5 : 1) * 0.04 * Wt, lean = 0.025 * (Wt - 1), om = (st === 3 ? 0.04 : 0.05) * (0.8 + 0.2 * Wt);
        const span = f.w * tw + 360, gx = ((fc * (0.9 + 0.6 * Wt)) % span) - 180, gust = (0.035 + 0.03 * Wt) * (st === 1 ? 0.6 : 1);
        // the hero (and who follows him) wading through
        const pl = [$gamePlayer].concat($gamePlayer.followers ? $gamePlayer.followers().visibleFollowers() : []);
        const feet = pl.map(c => [Math.round(c._realX * tw + tw / 2) - ch.x * tw, Math.round(c._realY * tw + tw - 6) - ch.y * tw]);
        let wading = false;
        for (const g of segs) {
            let target = 0;
            for (const [px, py] of feet) {
                const dx = g.cx - px, dy = g.b - py;
                if (Math.abs(dx) < 50 && dy > -26 && dy < 34) {
                    const s = Math.max(0, (1 - Math.abs(dx) / 50) * (1 - Math.abs(dy - 4) / 34));
                    target += (dx >= 0 ? 1 : -1) * 0.34 * s * (dy > 6 ? 0.45 : 1);   // (the rows in front of him bend less: they still hide his legs)
                    if (st >= 2 && s > 0.3) wading = true;
                }
            }
            g.v += (target - g.p) * 0.2; g.v *= 0.74; g.p += g.v;   // (a spring: bent away quickly, swings back with a little overshoot)
            const wave = Math.sin(fc * om - g.cx * 0.018 - g.r * 0.35) * amp + Math.exp(-Math.pow((g.cx - gx) / 70, 2)) * gust + lean;
            g.w = wave + g.p;
            g.sy = 1 - Math.min(0.08, Math.abs(g.p) * 0.2);
        }
        // the rows: each segment's quad sheared about its foot as its sprite was (skew.x = -w, scale.y = sy: the top goes sin(w) * sy * H
        // right and cos(w) * sy * H up), the mesh at the row's foot
        if (near) {
            const H = this._poleH;
            for (const r of rows) {
                const V = r.mesh.vertices, foot = r.foot, idx = r.idx;
                r.mesh.x = ox; r.mesh.y = oy + foot;
                for (let k = 0; k < idx.length; k++) {
                    const g = segs[idx[k]], j = k * 8, yb = g.b - foot, sh2 = Math.sin(g.w) * g.sy * H, hg = Math.cos(g.w) * g.sy * H;
                    const xl = g.x0, xr = g.x0 + g.wpx;
                    V[j] = xl + sh2; V[j + 1] = yb - hg; V[j + 2] = xr + sh2; V[j + 3] = yb - hg;
                    V[j + 4] = xr; V[j + 5] = yb; V[j + 6] = xl; V[j + 7] = yb;
                }
            }
        }
        // the grain's shadow: each piece leaned from its row's foot by the sun and by its segments' mean sway (a stalk leaning right by
        // sin(w) per px of height throws its top sin(w) further right) - one mesh, a quad a piece
        if (sh) {
            const layer = sh.S.layer(tm), m = shL.mesh, V = m.vertices, P = shL.pieces;
            if (m.parent !== layer) layer.addChild(m);
            m.x = ox; m.y = oy;
            for (let k = 0; k < P.length; k++) {
                const p = P[k], idx = p.idx;
                let w = 0;
                for (let i = 0; i < idx.length; i++) w += segs[idx[i]].w;
                w /= idx.length;
                const c = -(sh.ox + Math.sin(w)), d = -sh.oy, top = -p.ay * p.fh, bot = (1 - p.ay) * p.fh, xl = p.x0 - p.ax * p.fw, xr = xl + p.fw, j = k * 8;
                V[j] = xl + c * top; V[j + 1] = p.b + d * top; V[j + 2] = xr + c * top; V[j + 3] = p.b + d * top;
                V[j + 4] = xr + c * bot; V[j + 5] = p.b + d * bot; V[j + 6] = xl + c * bot; V[j + 7] = p.b + d * bot;
            }
            if (!m.visible) m.visible = true;
            if (fc - shL.alphaAt >= 8) {
                shL.alphaAt = fc;
                m.alpha = cloudAlpha(sh, layer, (ch.x + f.w / 2) * tw, (ch.y + f.h / 2) * tw) * SH_ALPHA;
            }
        }
        if (!near) return;
        // the rustle: once a stride while he wades
        const d = Math.abs($gamePlayer._realX - (this._poleLX || 0)) + Math.abs($gamePlayer._realY - (this._poleLY || 0));
        if (wading && d > 0.001 && d < 1.5) {
            this._poleAcc = (this._poleAcc || 0) + d;
            if (this._poleAcc > 0.7) { this._poleAcc = 0; rustle($gamePlayer.isDashing() ? 1.3 : 1); }
        }
        this._poleLX = $gamePlayer._realX; this._poleLY = $gamePlayer._realY;
    }

    const api = { opts: OPT, stage: stageNow, hold: (angle, now) => { held = angle === null || angle === undefined ? null : Number(angle); heldNow = !!now; }, held: () => held };
    window.Wiatrak = T && T.register ? T.register("Wiatrak", api) : api;
})();
