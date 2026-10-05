//=============================================================================
// WaterFx.js
//=============================================================================
// Living water on the map (user 2026-10-04: the town's waterfall - "the water splashing where it hits the pond", "the current should
// look real"; v1.1: "no lines, they look bad" and "a light round wave spreading out, like in nature"; v1.2: "they go onto the land",
// "they must not travel that far", "it has to be natural" - shorter waves dying out in open water, a soft mask off the banks). Two tags:
//   <Splash:w=2,wave=110>             where a waterfall hits the water: spray drops thrown up and falling back, mist rising, little
//                                     rings of the churned water by the foam and, every second or so, a soft wave spreading out over
//                                     the pond in a half ring (wave = how far, in pixels), drawn only on the water. The line of impact
//                                     is the top of the event's cell, w cells wide to the right (the author's foam stands there).
//   <Flow:dx=1,dy=0.35,w=12,h=6,ox=-5,oy=-2,speed=0.4,count=24,sx=-1,sy=-1.85,src=0.6,spread=1.1,glint=0.35>
//                                     what the current carries over a w x h rectangle of cells (top-left = the event's cell + ox, oy),
//                                     only on water (A1, not the waterfalls), in the direction dx, dy: small flecks of foam and
//                                     bubbles, and glints of light that come and go. sx, sy: a source (cells from the event's top-left
//                                     corner, e.g. the foot of a waterfall) where the share src of the flecks starts, fanned out by
//                                     spread (radians) - a trail of foam drifting away from the fall.
//   <Fall:w=2,h=4,speed=1.3>          on the top-left cell of an A1 waterfall w x h cells: its water slides down smoothly (the engine
//                                     steps it 16 px every half second) in two layers, the rock rims on its sides kept still.
// Each effect is a small picture in the tilemap (the waves, flecks and rings under the characters and the foam, the mist and the
// spray over the foam), redrawn every frame while it is on the screen. No load-order needs past TawernaCore.

/*:
 * @target MZ
 * @plugindesc Żywa woda: płynnie spadający wodospad, plusk, mgiełka i fale pod wodospadem, piana i błyski niesione nurtem (tagi w notatkach eventów). v1.3.0
 * @author Claude
 *
 * @help
 * ============================================================================
 * WaterFx.js - żywa woda
 * ============================================================================
 * W notatce (Note) eventu wpisz:
 *
 *   <Splash:w=2,wave=110>
 *     Plusk pod wodospadem: krople pryskają w górę i spadają, unosi się
 *     mgiełka, przy pianie woda się burzy drobnymi kręgami, a co chwilę od
 *     miejsca uderzenia rozchodzi się po wodzie łagodna, okrągła fala
 *     (wave = jak daleko, w pikselach; fala gaśnie, zanim dojdzie do
 *     brzegu, i nigdy nie wchodzi na brzeg). Linia uderzenia to górna krawędź
 *     pola eventu, szeroka na w pól w prawo.
 *
 *   <Flow:dx=1,dy=0.35,w=12,h=6,ox=-5,oy=-2,speed=0.4,count=24,
 *         sx=-1,sy=-1.85,src=0.6,spread=1.1,glint=0.35>
 *     To, co niesie nurt, po prostokącie w x h pól (lewy górny róg = pole
 *     eventu przesunięte o ox, oy), tylko po wodzie (A1, bez wodospadów),
 *     w kierunku dx, dy: drobne płatki piany i pęcherzyki oraz błyski
 *     światła. speed = piksele na klatkę, count = ile naraz,
 *     glint = jaka część to błyski. sx, sy = źródło (w polach od lewego
 *     górnego rogu pola eventu, np. stopa wodospadu): część src płatków
 *     zaczyna tam i rozchodzi się wachlarzem spread (radiany).
 *
 *   <Fall:w=2,h=4,speed=1.3>
 *     Na lewym górnym polu wodospadu (A1) szerokiego na w i wysokiego na h
 *     pól: woda spada płynnie (silnik przesuwa ją skokami co pół sekundy),
 *     w dwóch warstwach - tylnej i jaśniejszej, szybszej przedniej - a
 *     skalne brzegi po bokach stoją w miejscu. speed = piksele na klatkę.
 *
 * Eventy z tymi tagami mogą być niewidoczne (bez grafiki). Nie stawiaj ich
 * na wodzie tuż przy brzegu - stojąc przy niej, gracz pije i nabiera wodę.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const FOAM = "236,248,250", LIGHT = "250,254,255", WAVE = "226,246,250";

    function tagArgs(note, tag) {
        const m = (note || "").match(new RegExp("<" + tag + "(?::([^>]*))?>", "i"));
        if (!m) return null;
        const o = {};
        for (const part of (m[1] || "").split(",")) {
            const kv = part.split("=");
            if (kv.length === 2 && isFinite(Number(kv[1]))) o[kv[0].trim()] = Number(kv[1]);
        }
        return o;
    }
    const rand = (a, b) => a + Math.random() * (b - a);
    const isFlowWater = (x, y) => {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) {
            const id = $gameMap.tileId(x, y, z);
            if (Tilemap.isWaterfallTile(id)) return false;
            if (Tilemap.isWaterTile(id)) return true;
        }
        return false;
    };
    // the edge cells of a pond carry the bank inside them (the A1 autotile's grass and earth rim: 7-9 px, up to 16 in the corners):
    // a point counts as open water only SHORE px or more away from a side (or corner) with land beyond it
    const SHORE = 12;
    function inWater(px, py) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const x = Math.floor(px / tw), y = Math.floor(py / th), lx = px - x * tw, ly = py - y * th;
        if (!isFlowWater(x, y)) return false;
        const L = lx < SHORE, R = lx > tw - SHORE, U = ly < SHORE, D = ly > th - SHORE;
        if ((L && !isFlowWater(x - 1, y)) || (R && !isFlowWater(x + 1, y)) || (U && !isFlowWater(x, y - 1)) || (D && !isFlowWater(x, y + 1))) return false;
        if ((L && U && !isFlowWater(x - 1, y - 1)) || (R && U && !isFlowWater(x + 1, y - 1)) || (L && D && !isFlowWater(x - 1, y + 1)) || (R && D && !isFlowWater(x + 1, y + 1))) return false;
        return true;
    }

    // ------------------------------------------------------------------
    // One picture over a rectangle of the map (map pixels), redrawn every frame while on the screen
    // ------------------------------------------------------------------
    class Layer {
        constructor(left, top, width, height, z) {
            this.left = left; this.top = top;
            this.sprite = new Sprite(new Bitmap(Math.ceil(width), Math.ceil(height)));
            this.sprite.z = z;
        }
        place() {
            const s = this.sprite, b = s.bitmap, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            s.x = Math.round(this.left - $gameMap.displayX() * tw);
            s.y = Math.round(this.top - $gameMap.displayY() * th);
            s.visible = s.x + b.width > 0 && s.y + b.height > 0 && s.x < Graphics.width && s.y < Graphics.height;
            return s.visible;
        }
        paint(fn) {
            const b = this.sprite.bitmap, ctx = b.context;
            ctx.clearRect(0, 0, b.width, b.height);
            fn(ctx);
            b._baseTexture.update();
        }
        // the open water under this picture as a soft mask (in its own pixels): kept away from the banks, its edge blurred, so what is
        // drawn through it dies out before the shore instead of being cut off
        waterMask() {
            const b = this.sprite.bitmap, hard = document.createElement("canvas"), soft = document.createElement("canvas");
            hard.width = soft.width = b.width; hard.height = soft.height = b.height;
            const h = hard.getContext("2d"), img = h.createImageData(b.width, b.height);
            for (let y = 0; y < b.height; y += 2) {
                for (let x = 0; x < b.width; x += 2) {
                    if (!inWater(this.left + x + 1, this.top + y + 1)) continue;
                    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
                        if (x + dx < b.width && y + dy < b.height) img.data[((y + dy) * b.width + x + dx) * 4 + 3] = 255;
                    }
                }
            }
            h.putImageData(img, 0, 0);
            const s = soft.getContext("2d");
            s.filter = "blur(5px)";
            s.drawImage(hard, 0, 0);
            return soft;
        }
        // keep only what lies over the mask
        masked(ctx, mask) {
            ctx.globalCompositeOperation = "destination-in";
            ctx.drawImage(mask, 0, 0);
            ctx.globalCompositeOperation = "source-over";
        }
    }

    // a fleck of foam: a few pixels together; a bubble: one or two
    const FLECKS = [[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]];
    function drawFleck(ctx, p, a) {
        ctx.fillStyle = "rgba(" + FOAM + "," + a.toFixed(3) + ")";
        for (const [dx, dy] of p.shape) ctx.fillRect(Math.round(p.x) + dx, Math.round(p.y) + dy, 1, 1);
    }
    function drawGlint(ctx, p, a, env) {
        const x = Math.round(p.x), y = Math.round(p.y);
        ctx.fillStyle = "rgba(" + LIGHT + "," + a.toFixed(3) + ")";
        ctx.fillRect(x, y, 1, 1);
        if (env > 0.65) {   // at its brightest a small star of light
            ctx.fillStyle = "rgba(" + LIGHT + "," + (a * 0.45).toFixed(3) + ")";
            ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
        }
    }

    // ------------------------------------------------------------------
    // Where the falling water hits
    // ------------------------------------------------------------------
    class Splash {
        constructor(event, o) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            this.x0 = event.x * tw; this.w = Math.max(1, o.w || 1) * tw;
            this.y0 = event.y * th;                               // the line of impact (map pixels)
            this.cx = this.x0 + this.w / 2;
            this.R = o.wave || 110;
            this.high = new Layer(this.x0 - 48, this.y0 - 72, this.w + 96, 168, 2);              // spray + mist, over the foam
            const ry = this.R * 0.5;
            this.low = new Layer(this.cx - this.R - 8, this.y0 - 8, this.R * 2 + 16, ry + 40, 0.5);   // waves + rings, under it
            this.mask = this.low.waterMask();
            this.items = []; this.rings = []; this.waves = [];
            this.tick = (Math.random() * 40) | 0;
        }
        sprites() { return [this.low.sprite, this.high.sprite]; }
        update() {
            const seen = this.high.place();
            this.low.place();
            if (!seen && !this.low.sprite.visible) return;
            this.tick++;
            this.step();
            const hx = this.x0 - 48, hy = this.y0 - 72, lx = this.cx - this.R - 8, ly = this.y0 - 8;
            this.high.paint(ctx => {
                for (const p of this.items) {
                    const t = p.age / p.life;
                    if (p.kind === "mist") {
                        const a = 0.17 * Math.sin(Math.PI * t), x = p.x - hx, y = p.y - hy;
                        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r);
                        g.addColorStop(0, "rgba(" + LIGHT + "," + a.toFixed(3) + ")");
                        g.addColorStop(1, "rgba(" + LIGHT + ",0)");
                        ctx.fillStyle = g;
                        ctx.fillRect(x - p.r, y - p.r, p.r * 2, p.r * 2);
                    } else {
                        ctx.fillStyle = "rgba(" + FOAM + "," + (0.95 * (1 - t * t)).toFixed(3) + ")";
                        ctx.fillRect(Math.round(p.x - hx), Math.round(p.y - hy), p.size, p.size);
                    }
                }
            });
            this.low.paint(ctx => {
                // the waves: soft half rings spreading out, wide and faint
                for (const v of this.waves) {
                    const t = v.age / v.life, ease = 1 - Math.pow(1 - t, 2);
                    const r = v.r0 + (this.R - v.r0) * ease, a = 0.42 * Math.pow(1 - t, 2.2) * Math.min(1, v.age / 12);   // (gone well before the end)
                    const x = this.cx - lx, y = this.y0 + 4 - ly;
                    ctx.beginPath();
                    ctx.ellipse(x, y, r, r * 0.5, 0, -0.12, Math.PI + 0.12);
                    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(" + WAVE + "," + (a * 0.18).toFixed(3) + ")"; ctx.stroke();
                    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(" + WAVE + "," + (a * 0.5).toFixed(3) + ")"; ctx.stroke();
                }
                // the churned water by the foam: small, quick rings
                for (const r of this.rings) {
                    const t = r.age / r.life, a = 0.35 * (1 - t) * Math.min(1, r.age / 5);
                    ctx.beginPath();
                    ctx.ellipse(r.x - lx, r.y - ly, r.rx, r.rx * 0.5, 0, 0, Math.PI * 2);
                    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + WAVE + "," + a.toFixed(3) + ")"; ctx.stroke();
                }
                this.low.masked(ctx, this.mask);
            });
        }
        step() {
            const x0 = this.x0, w = this.w, y0 = this.y0;
            for (let n = Math.random() < 0.5 ? 2 : 1; n > 0; n--) {
                this.items.push({ kind: "drop", x: x0 + rand(2, w - 2), y: y0 + rand(-3, 4), vx: rand(-0.7, 0.7), vy: -rand(0.7, 2.3),
                    age: 0, life: rand(16, 32) | 0, size: Math.random() < 0.3 ? 2 : 1 });
            }
            if (this.tick % 5 === 0) {
                this.items.push({ kind: "mist", x: x0 + rand(0, w), y: y0 + rand(-6, 6), vx: rand(-0.2, 0.2), vy: -rand(0.12, 0.35),
                    age: 0, life: rand(60, 100) | 0, r: rand(6, 13) });
            }
            if (this.tick % 55 === 0 || (this.tick % 55 === 28 && Math.random() < 0.5)) {
                this.waves.push({ r0: w * 0.45, age: 0, life: rand(110, 140) | 0 });
            }
            if (this.tick % 9 === 0) {
                this.rings.push({ x: x0 + rand(4, w - 4), y: y0 + rand(8, 18), rx: rand(2, 4), age: 0, life: rand(30, 45) | 0 });
            }
            for (const p of this.items) {
                p.age++;
                p.x += p.vx; p.y += p.vy;
                if (p.kind === "drop") p.vy += 0.13;
                else p.r += 0.07;
            }
            this.items = this.items.filter(p => p.age < p.life && !(p.kind === "drop" && p.y > y0 + 10));
            for (const r of this.rings) { r.age++; r.rx += 0.4; }
            this.rings = this.rings.filter(r => r.age < r.life);
            for (const v of this.waves) v.age++;
            this.waves = this.waves.filter(v => v.age < v.life);
        }
    }

    // ------------------------------------------------------------------
    // What the current carries: flecks of foam, bubbles, glints of light
    // ------------------------------------------------------------------
    class Flow {
        constructor(event, o) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const w = Math.max(1, o.w || 1), h = Math.max(1, o.h || 1);
            this.cx = event.x + (o.ox || 0); this.cy = event.y + (o.oy || 0);
            this.layer = new Layer(this.cx * tw, this.cy * th, w * tw, h * th, 0.5);
            const dy0 = o.dy === undefined ? 1 : o.dy, len = Math.hypot(o.dx || 0, dy0) || 1;
            this.angle = Math.atan2(dy0 / len, (o.dx || 0) / len);
            this.speed = o.speed || 0.6;
            this.count = o.count || Math.max(3, Math.round(w * h * 0.5));
            this.alpha = o.alpha || 0.6;
            this.glint = o.glint === undefined ? 0.35 : o.glint;
            this.src = o.sx !== undefined ? { x: (event.x + o.sx - this.cx) * tw, y: (event.y + (o.sy || 0) - this.cy) * th, share: o.src === undefined ? 0.6 : o.src, spread: o.spread || 1 } : null;
            this.cells = [];
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (isFlowWater(this.cx + x, this.cy + y)) this.cells.push([x, y]);
            this.items = [];
        }
        sprites() { return [this.layer.sprite]; }
        water(px, py) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            return inWater(this.cx * tw + px, this.cy * th + py);
        }
        spawn() {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const glint = Math.random() < this.glint;
            let x, y, ang = this.angle;
            if (!glint && this.src && Math.random() < this.src.share) {
                x = this.src.x + rand(-14, 14); y = this.src.y + rand(0, 8);
                ang += rand(-this.src.spread, this.src.spread);
            } else {
                const [cx, cy] = this.cells[(Math.random() * this.cells.length) | 0];
                x = cx * tw + rand(0, tw); y = cy * th + rand(0, th);
                if (!this.water(x, y)) return;   // (on the bank's rim: tried again next frame)
                ang += rand(-0.25, 0.25);
            }
            const v = this.speed * (glint ? 0.5 : rand(0.6, 1.4));
            this.items.push({ glint, x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, age: 0, wob: rand(0, 6.3),
                life: glint ? rand(18, 36) | 0 : rand(70, 150) | 0, shape: FLECKS[(Math.random() * FLECKS.length) | 0] });
        }
        update() {
            if (!this.layer.place() || !this.cells.length) return;
            for (let n = 0; n < 4 && this.items.length < this.count; n++) this.spawn();
            for (const p of this.items) {
                p.age++;
                const side = Math.sin(p.age * 0.07 + p.wob) * 0.12;   // a little sideways sway, like a real surface
                p.x += p.vx - p.vy * side; p.y += p.vy + p.vx * side;
                p.vx *= 0.998; p.vy *= 0.998;
                if (!this.water(p.x, p.y)) p.age = Math.max(p.age, p.life - 6);   // (off the water: gone quickly)
            }
            this.items = this.items.filter(p => p.age < p.life);
            this.layer.paint(ctx => {
                for (const p of this.items) {
                    const env = Math.sin(Math.PI * p.age / p.life);
                    if (p.glint) drawGlint(ctx, p, Math.min(1, this.alpha * 1.4 * env), env);
                    else drawFleck(ctx, p, this.alpha * Math.min(1, env * 1.6));
                }
            });
        }
    }

    // ------------------------------------------------------------------
    // The falling water itself: the waterfall autotile steps 16 px down every half second (3 frames of one strip shifted by 16 px,
    // rmmz_core's Tilemap); here that same strip, rebuilt seamless, slides down smoothly in two layers - the back one opaque, the
    // front one mirrored, lighter and faster (depth: the water falls in sheets) - while the rock rims on its sides stay still
    // ------------------------------------------------------------------
    class Fall {
        constructor(event, o) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            this.w = Math.max(1, o.w || 1); this.h = Math.max(1, o.h || 1);
            this.left = event.x * tw; this.top = event.y * th;
            this.W = this.w * tw; this.H = this.h * th;
            this.edge = o.edge === undefined ? 7 : o.edge;           // the rock rim and its dark line on each side, kept still
            this.speed = o.speed || 1.3;
            this.root = new Sprite();
            this.root.z = 0.6;                                        // over the tiles and the waves, under the foam (the author's: z 1)
            this.ready = false;
            this.y = 0;
            const id = $gameMap.tileId(event.x, event.y, 0);
            if (!Tilemap.isWaterfallTile(id)) return;
            const kind = Tilemap.getAutotileKind(id), tx = kind % 8, ty = Math.floor(kind / 8);
            this.bx = (Math.floor(tx / 4) * 8 + 6) * tw;             // the kind's block in the A1 sheet (rmmz_core _addAutotile)
            this.by = (ty * 6 + (Math.floor(tx / 2) % 2) * 3) * th;
            const sheet = ImageManager.loadTileset($gameMap.tileset().tilesetNames[0]);
            sheet.addLoadListener(() => this.build(sheet));
        }
        sprites() { return [this.root]; }
        // the strip for w cells: the block's left quarter, its middle repeated, its right quarter; the 3 frames lined up and averaged
        build(sheet) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), q = tw / 2, W = this.W;
            const src = sheet.canvas;
            const frame = document.createElement("canvas");
            frame.width = W; frame.height = th * 3;
            const f = frame.getContext("2d");
            f.imageSmoothingEnabled = false;
            for (let k = 0; k < 3; k++) {
                const sy = this.by + k * th, dy = k * th;
                f.drawImage(src, this.bx, sy, q, th, 0, dy, q, th);
                for (let x = q; x < W - q; x += tw) {
                    const part = Math.min(tw, W - q - x);
                    f.drawImage(src, this.bx + q, sy, part, th, x, dy, part, th);
                }
                f.drawImage(src, this.bx + tw + q, sy, q, th, W - q, dy, q, th);
            }
            const img = f.getImageData(0, 0, W, th * 3).data, strip = f.createImageData(W, th);
            const shift = Math.round(th / 3);                          // (each frame is the one before 16 px further down)
            for (let y = 0; y < th; y++) {
                for (let x = 0; x < W; x++) {
                    const o = (y * W + x) * 4;
                    for (let c = 0; c < 4; c++) {
                        let sum = 0;
                        for (let k = 0; k < 3; k++) sum += img[((k * th + (y + k * shift) % th) * W + x) * 4 + c];
                        strip.data[o + c] = Math.round(sum / 3);
                    }
                }
            }
            const whole = document.createElement("canvas");
            whole.width = W; whole.height = th;
            whole.getContext("2d").putImageData(strip, 0, 0);
            const water = document.createElement("canvas");
            water.width = W - this.edge * 2; water.height = th;
            water.getContext("2d").drawImage(whole, -this.edge, 0);
            const mirror = document.createElement("canvas");
            mirror.width = water.width; mirror.height = th;
            const m = mirror.getContext("2d");
            m.translate(mirror.width, 0); m.scale(-1, 1); m.drawImage(water, 0, 0);
            const texture = c => { const t = PIXI.Texture.from(c); t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST; return t; };
            this.back = new PIXI.TilingSprite(texture(water), water.width, this.H);
            this.front = new PIXI.TilingSprite(texture(mirror), water.width, this.H);
            this.back.x = this.front.x = this.edge;
            this.front.alpha = 0.4;
            // the still rims: the strip's edge columns down the whole fall
            const rims = new Bitmap(W, this.H);
            for (let y = 0; y < this.H; y += th) {
                rims.context.drawImage(whole, 0, 0, this.edge, th, 0, y, this.edge, th);
                rims.context.drawImage(whole, W - this.edge, 0, this.edge, th, W - this.edge, y, this.edge, th);
            }
            rims._baseTexture.update();
            this.rims = new Sprite(rims);
            this.root.addChild(this.back, this.front, this.rims);
            this.ready = true;
        }
        update() {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            this.root.x = Math.round(this.left - $gameMap.displayX() * tw);
            this.root.y = Math.round(this.top - $gameMap.displayY() * th);
            if (!this.ready) return;
            this.y += this.speed;
            this.back.tilePosition.y = Math.round(this.y);
            this.front.tilePosition.y = Math.round(this.y * 1.7);
        }
    }

    // ------------------------------------------------------------------
    // The spriteset: the effects of the map's events, made with its characters
    // ------------------------------------------------------------------
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._waterFx = [];
        for (const ev of $gameMap.events()) {
            const note = ev.event().note;
            const splash = tagArgs(note, "Splash"), flow = tagArgs(note, "Flow"), fall = tagArgs(note, "Fall");
            if (fall) this._waterFx.push(new Fall(ev, fall));
            if (splash) this._waterFx.push(new Splash(ev, splash));
            if (flow) this._waterFx.push(new Flow(ev, flow));
        }
        for (const fx of this._waterFx) for (const s of fx.sprites()) this._tilemap.addChild(s);
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._waterFx) for (const fx of this._waterFx) fx.update();
    };

    const api = { effects: () => (SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._waterFx) || [] };
    window.WaterFx = T ? T.register("WaterFx", api) : api;
})();
