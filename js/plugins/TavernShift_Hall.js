//=============================================================================
// TavernShift_Hall.js
//=============================================================================
// The tavern for the shift (split out of TavernShift.js, 2026-09-29): the tavern's tileset pieces, the hero and the tavern people
// drawn from their map sheets, the floating words and sparks, the common frame of a part, the hall (a room of 19 x 13 tiles with
// its tables, bar and fireplace, walking, paths, reach), the "O: ..." plate, the close-up props (the keg, the mug) and small
// drawings. TavernShift_Parts.js builds the four parts on it.

/*:
 * @target MZ
 * @plugindesc Sala tawerny dla zmiany (TavernShift.js): kafle tawerny, postacie, efekty, sala ze stołami, barem i kominkiem, beczka i kufel. Sama nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
 * @base TavernShift
 * @orderAfter TavernShift
 *
 * @help
 * ============================================================================
 * TavernShift_Hall.js - sala tawerny dla zmiany
 * ============================================================================
 * Część TavernShift.js (wydzielona z niego): kafle, postacie, sala i rekwizyty,
 * na których stoją cztery części zmiany (TavernShift_Parts.js). Parametry ma
 * TavernShift.js.
 *
 * KOLEJNOŚĆ: TavernShift, TavernShift_Hall, TavernShift_Parts.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;   // (TW: T is the tile's size here)
    if (!TW || !TW.ui || !TW.ui.Scene_MiniGame) throw new Error("TavernShift_Hall.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const P = TW.api("TavernShift_parts") || TW.register("TavernShift_parts", {});
    if (P.hall) return;   // (put into the page twice: kept as it was)
    if (!P.kit) throw new Error("TavernShift_Hall.js: musi być pod TavernShift.js na liście wtyczek (TavernShift.js is missing or below)");
    const { ST, BAD, clamp, dirty, panel, txt, measure, icon, keyCap, shadowBitmap, solidBitmap, TILESET_ID } = P.kit;
    const T = 48;           // tile

    // ==================================================================
    // Tiles: the tavern tileset (the same pieces as Map001)
    // ==================================================================
    const SHEETS = { A1: 0, A2: 1, A3: 2, A4: 3, A5: 4, B: 5, C: 6, D: 7, E: 8 };
    const DEFAULT_SHEETS = ["Inside_A1", "Tawerna_A2", "", "Tawerna_A4", "Inside_A5", "Inside_B", "Inside_C", "Tawerna_D", ""];
    const tilesetNames = () => {
        const ts = window.$dataTilesets && $dataTilesets[TILESET_ID];
        return ts && ts.tilesetNames ? ts.tilesetNames : DEFAULT_SHEETS;
    };
    const sheet = k => tilesetNames()[SHEETS[k]] || DEFAULT_SHEETS[SHEETS[k]];
    const tB = (c, r) => (c >= 8 ? 128 : 0) + r * 8 + (c % 8);
    const tC = (c, r) => 256 + tB(c, r);
    const tD = (c, r) => 512 + tB(c, r);
    const FLOOR = 2863, PLANKS_H = 3247, WALL_IN = 6272;   // the tavern floor, horizontal boards (a counter top), the log wall's inside piece
    function tileSprite(k, col, row, cw, ch) {
        const s = new Sprite(ImageManager.loadTileset(sheet(k)));
        s.setFrame(col * T, row * T, (cw || 1) * T, (ch || 1) * T);
        return s;
    }
    // a Tilemap of cols x rows from ids(x, y) -> [layer0, layer1, layer2, layer3]
    function makeTilemap(cols, rows, ids) {
        const data = new Array(cols * rows * 6).fill(0);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const l = ids(x, y);
                for (let z = 0; z < 4; z++) data[(z * rows + y) * cols + x] = l[z] || 0;
            }
        }
        const tm = new Tilemap();
        tm.tileWidth = T;
        tm.tileHeight = T;
        tm.setData(cols, rows, data);
        tm.setBitmaps(tilesetNames().map(n => ImageManager.loadTileset(n)));
        const ts = window.$dataTilesets && $dataTilesets[TILESET_ID];
        tm.flags = ts ? ts.flags : [];
        tm.width = cols * T;
        tm.height = rows * T;
        tm.refresh();
        return tm;
    }

    // ==================================================================
    // Figures: the hero and the tavern people, drawn from their map sheets
    // ==================================================================
    const ROWS8 = { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 };
    const TO4 = { 1: 2, 2: 2, 3: 2, 4: 4, 5: 2, 6: 6, 7: 8, 8: 8, 9: 8 };
    function heroLook() {
        if (TW.call("HeroLook", "active")) return { name: "Hero_Walk", index: 0, eight: true };
        const a = $gameParty && $gameParty.leader();
        return { name: a ? a.characterName() : "Actor1", index: a ? a.characterIndex() : 0, eight: false };
    }
    const PEOPLE = {
        borgar: { name: "People3_Tall", index: 4 },
        melia: { name: "People2_Tall", index: 7 },
        // (not People2_Tall 4: that is Lord Zaleski of Story.js; People2_Tall 1 takes his place, so the shuffles stay as they were)
        guests: [
            { name: "Actor2_Tall", index: 4 }, { name: "People2_Tall", index: 0 }, { name: "People2_Tall", index: 1 },
            { name: "People2_Tall", index: 6 }, { name: "People2_Tall", index: 2 }, { name: "People2_Tall", index: 3 },
            { name: "People2_Tall", index: 5 }, { name: "People3_Tall", index: 5 }, { name: "People3_Tall", index: 6 },
            { name: "People3_Tall", index: 7 }, { name: "Actor2_Tall", index: 5 }, { name: "Actor2_Tall", index: 6 },
            { name: "Actor2_Tall", index: 7 }, { name: "People3_Tall", index: 3 }
        ]
    };
    class Figure extends Sprite {
        initialize(look) {
            super.initialize();
            this.look = look;
            this.shadow = new Sprite(shadowBitmap());
            this.shadow.anchor.set(0.5, 0.5);
            this.shadow.y = -3;
            this.addChild(this.shadow);
            this.body = new Sprite(ImageManager.loadCharacter(look.name));
            this.body.anchor.set(0.5, 1);
            this.addChild(this.body);
            this.dir = 2;
            this.step = 0;
            this.moving = false;
            this.refresh();
        }
        advance(dist) { this.step += dist / (this.look.eight ? 10.2 : 12); }
        refresh() {
            const b = this.body.bitmap;
            if (!b || !b.isReady()) return;
            if (this.look.eight) {
                const c = 64, cols = Math.max(2, Math.floor(b.width / c));
                const HL = TW.api("HeroLook"), rows = (HL && HL.ROWS) || ROWS8;
                const col = this.moving ? 1 + (Math.floor(this.step) % (cols - 1)) : 0;
                this.body.setFrame(col * c, (rows[this.dir] || 0) * c, c, c);
            } else {
                const big = ImageManager.isBigCharacter(this.look.name);
                const pw = b.width / (big ? 3 : 12), ph = b.height / (big ? 4 : 8);
                const bx = big ? 0 : (this.look.index % 4) * 3, by = big ? 0 : Math.floor(this.look.index / 4) * 4;
                const pat = this.moving ? [1, 2, 1, 0][Math.floor(this.step) % 4] : 1;
                const row = ((TO4[this.dir] || 2) - 2) / 2;
                this.body.setFrame((bx + pat) * pw, (by + row) * ph, pw, ph);
            }
        }
    }
    function dirOf(dx, dy) {
        const sx = Math.sign(Math.round(dx * 100)), sy = Math.sign(Math.round(dy * 100));
        return { "-1,-1": 7, "0,-1": 8, "1,-1": 9, "-1,0": 4, "1,0": 6, "-1,1": 1, "0,1": 2, "1,1": 3 }[sx + "," + sy] || 2;
    }

    // ==================================================================
    // Small effects: floating words and particles (ticked, so they keep pace with the game logic)
    // ==================================================================
    class Floater extends Sprite {
        initialize(text, colour, size, iconIndex) {
            const tmp = new Bitmap(8, 8), s = size || 22;
            const w = Math.ceil(measure(tmp, text, s, true)) + 16 + (iconIndex ? 30 : 0);
            super.initialize(new Bitmap(w, s + 16));
            if (iconIndex) icon(this.bitmap, iconIndex, 4, Math.round((s + 16 - 26) / 2), 26);
            txt(this.bitmap, text, iconIndex ? 30 : 0, 2, w - (iconIndex ? 30 : 0), { size: s, color: colour || ST().text, bold: true, outline: 4, align: "center" });
            this.anchor.set(0.5, 1);
            this.life = 0;
            this.max = 64;
        }
        tick() {
            this.life++;
            this.y -= this.life < 20 ? 1.2 : 0.4;
            this.opacity = this.life > this.max - 18 ? 255 * (this.max - this.life) / 18 : 255;
            return this.life < this.max;
        }
    }
    class Particle extends Sprite {
        initialize(bitmap, vx, vy, life, grav) {
            super.initialize(bitmap);
            this.anchor.set(0.5, 0.5);
            this.vx = vx; this.vy = vy; this.life = 0; this.max = life; this.grav = grav || 0;
        }
        tick() {
            this.life++;
            this.x += this.vx; this.y += this.vy; this.vy += this.grav;
            this.opacity = 255 * (1 - this.life / this.max);
            return this.life < this.max;
        }
    }
    const DOT = {};
    const dotBitmap = colour => DOT[colour] || (DOT[colour] = solidBitmap(colour));

    // ==================================================================
    // Part: the common frame of the four parts
    // ==================================================================
    class Part {
        constructor(scene, id, cfg) {
            this.scene = scene;
            this.id = id;
            this.cfg = cfg;
            this.ctx = scene.ctx;
            this.rng = scene.rng;
            this.root = new Sprite();
            this.fxLayer = new Sprite();
            this.t = 0;
            this.done = false;
            this.result = null;
            this.good = [];
            this.bad = [];
            this.fx = [];
        }
        setup() { this.root.addChild(this.fxLayer); }
        tick() {}
        frame() {}
        hud() { return {}; }
        state() { return {}; }
        progress() { return 0; }
        tickFx() { this.fx = this.fx.filter(f => { const alive = f.tick(); if (!alive) { f.parent && f.parent.removeChild(f); f.destroy(); } return alive; }); }
        float(text, x, y, colour, size, iconIndex) {
            const f = new Floater(text, colour, size, iconIndex);
            f.x = x; f.y = y;
            this.fxLayer.addChild(f);
            this.fx.push(f);
        }
        burst(x, y, colour, n, spread, grav, parent) {
            for (let i = 0; i < n; i++) {
                const a = this.rng() * Math.PI * 2, v = (0.5 + this.rng()) * (spread || 1.5);
                const p = new Particle(dotBitmap(colour), Math.cos(a) * v, Math.sin(a) * v - (grav ? 1.5 : 0), 24 + Math.floor(this.rng() * 16), grav || 0);
                p.x = x; p.y = y;
                p.scale.set(0.75 + this.rng() * 0.6);
                (parent || this.fxLayer).addChild(p);
                this.fx.push(p);
            }
        }
        complete(score, data, good, bad) {
            if (this.done) return;
            this.done = true;
            this.result = Object.assign({ score: clamp(Math.round(score), 0, 100) }, data || {});
            this.good = good || [];
            this.bad = bad || [];
        }
        skip(score) { this.complete(score, this.skipData(score), [], []); }
        skipData() { return {}; }
    }

    // ==================================================================
    // The tavern hall: a room of 19 x 13 tiles drawn with the tavern's tileset, with tables, the bar, a fireplace
    // ==================================================================
    const RC = 19, RR = 13, ROOM_X = 16, ROOM_Y = 84;
    const DOOR_X0 = 8, DOOR_X1 = 10;
    const TABLES = [{ tx: 3, ty: 5 }, { tx: 8, ty: 5 }, { tx: 13, ty: 5 }, { tx: 3, ty: 9 }, { tx: 8, ty: 8 }, { tx: 13, ty: 9 }];
    const COUNTER_X0 = 1, COUNTER_X1 = 7, COUNTER_Y = 2;
    const SPOT = {
        borgar: { tx: 4, ty: 1 }, melia: { tx: 11, ty: 1 }, fire: { tx: 15, ty: 1 }, pile: { tx: 17, ty: 11 },
        door: { tx: 9, ty: 12 }, plant: { tx: 17, ty: 1 }, barrel: { tx: 17, ty: 7 }
    };
    const SACK_SPOTS = [{ tx: 8, ty: 2 }, { tx: 1, ty: 11 }, { tx: 17, ty: 3 }, { tx: 11, ty: 11 }];
    const REACH = 32;   // px from the hero's reach point (the middle of his tile) to a thing's tile: the tiles beside it, not the corners
    const cx = tx => tx * T + 24;
    const standPt = (tx, ty) => ({ x: tx * T + 24, y: ty * T + 36 });

    class Room {
        constructor(part, o) {
            this.part = part;
            this.o = o || {};
            this.root = new Sprite();
            this.root.x = ROOM_X;
            this.root.y = ROOM_Y;
            this.tables = TABLES.map((t, i) => ({
                i, tx: t.tx, ty: t.ty, dirty: 0, wipe: 0,
                seats: [{ tx: t.tx - 1, ty: t.ty, face: 6 }, { tx: t.tx + 2, ty: t.ty, face: 4 }]
            }));
            this.tables.forEach(tb => tb.seats.forEach((s, k) => { s.table = tb; s.k = k; s.guest = null; }));
            this.seats = [].concat(...this.tables.map(tb => tb.seats));
            this.furn = {};
            this.buildFurniture();
            this.tilemap = makeTilemap(RC, RR, (x, y) => [this.floorAt(x, y), this.furn[x + "," + y] || 0, 0, 0]);
            this.decor = new Sprite();
            this.chars = new Sprite();
            this.lights = new Sprite();
            this.over = new Sprite();
            this.root.addChild(this.tilemap);
            this.root.addChild(this.decor);
            this.root.addChild(this.chars);
            this.root.addChild(this.lights);
            this.root.addChild(this.over);
            this.buildDecor();
            this.borgar = this.addFigure(PEOPLE.borgar, SPOT.borgar.tx, SPOT.borgar.ty, 2);
            if (this.o.melia) this.melia = this.addFigure(PEOPLE.melia, SPOT.melia.tx, SPOT.melia.ty, 2);
            if (this.o.evening) this.buildEvening();
            this.tickFire(0);   // (the frames: before the first tick the sheets would show whole)
        }
        buildFurniture() {
            const put = (x, y, id) => { this.furn[x + "," + y] = id; };
            put(2, 0, tB(0, 10)); put(6, 0, tB(0, 10));             // red banners
            put(9, 0, tD(1, 0));                                     // the tavern's sign: a mug
            put(1, 1, tC(0, 7)); put(2, 1, tC(1, 7));                // kegs behind the bar
            put(3, 1, tB(9, 8)); put(5, 1, tB(8, 7)); put(6, 1, tB(8, 8)); put(7, 1, tD(0, 0));
            for (let x = COUNTER_X0; x < COUNTER_X1; x++) put(x, COUNTER_Y, tB(10, 9));
            put(COUNTER_X1, COUNTER_Y, tB(11, 9));                  // the bar's end: a board with a knife
            put(SPOT.fire.tx, 0, tB(11, 7)); put(SPOT.fire.tx, 1, tB(11, 8));   // the brick fireplace
            put(SPOT.plant.tx, SPOT.plant.ty, tC(7, 10));
            put(SPOT.barrel.tx, SPOT.barrel.ty, tB(12, 10));
            for (const tb of this.tables) {
                put(tb.tx, tb.ty, tB(0, 14)); put(tb.tx + 1, tb.ty, tB(1, 14));
                for (const s of tb.seats) put(s.tx, s.ty, tB(0, 15));
            }
        }
        floorAt(x, y) {   // Map001's own wall pieces around the floor, the door gap at the bottom
            if (y === 0) return x === 0 ? 6284 : x === RC - 1 ? 6281 : 6277;
            if (y === RR - 1) {
                if (x === 0) return 6278;
                if (x === RC - 1) return 6275;
                if (x >= DOOR_X0 && x <= DOOR_X1) return FLOOR;
                if (x === DOOR_X0 - 1) return 6273;
                if (x === DOOR_X1 + 1) return 6276;
                return 6277;
            }
            if (x === 0 || x === RC - 1) return 6282;
            return FLOOR;
        }
        // where the hero may stand
        walkable(tx, ty) {
            if (tx < 0 || ty < 0 || tx >= RC || ty >= RR) return false;
            if (ty === RR - 1) return tx >= DOOR_X0 && tx <= DOOR_X1;
            if (ty === 0 || tx === 0 || tx === RC - 1) return false;
            if (ty <= COUNTER_Y && tx >= COUNTER_X0 && tx <= COUNTER_X1) return false;
            for (const k of ["fire", "plant", "barrel", "pile"]) if (SPOT[k].tx === tx && SPOT[k].ty === ty) return false;
            if (this.o.melia && SPOT.melia.tx === tx && SPOT.melia.ty === ty) return false;
            for (const tb of this.tables) {
                if (ty === tb.ty && tx >= tb.tx - 1 && tx <= tb.tx + 2) return false;
            }
            return true;
        }
        // guests walk everywhere the hero does, and onto their own seat
        guestWalkable(tx, ty, seat) {
            if (seat && seat.tx === tx && seat.ty === ty) return true;
            return this.walkable(tx, ty);
        }
        buildDecor() {
            // the fire in the hearth (!Flame: the fourth set, rows big / small / smoke / medium)
            this.fire = new Sprite(ImageManager.loadCharacter("!Flame"));
            this.fire.anchor.set(0.5, 1);
            this.fire.x = cx(SPOT.fire.tx);
            this.fire.y = SPOT.fire.ty * T + 42;
            this.fire.scale.set(0.62);
            this.decor.addChild(this.fire);
            this.fireLevel = 0;
            this.setFire(0);
            // the wood pile: logs (icon 381) stacked in a heap
            const pb = new Bitmap(56, 50);
            for (const [x, y] of [[0, 20], [22, 20], [11, 7]]) icon(pb, 381, x, y, 34);
            this.pile = new Sprite(pb);
            this.pile.x = SPOT.pile.tx * T - 4;
            this.pile.y = SPOT.pile.ty * T - 2;
            this.decor.addChild(this.pile);
            // the stains of dirty tables (one bitmap per table, alpha = how dirty)
            for (const tb of this.tables) {
                const b = new Bitmap(96, 48), ctx = b.context;
                for (let i = 0; i < 7; i++) {
                    const x = 14 + ((i * 37 + tb.i * 13) % 68), y = 12 + ((i * 17 + tb.i * 7) % 20), r = 4 + ((i * 5 + tb.i) % 6);
                    ctx.fillStyle = i % 3 ? "rgba(96,58,24,0.55)" : "rgba(60,36,14,0.6)";
                    ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
                }
                ctx.fillStyle = "rgba(240,225,190,0.7)";
                for (let i = 0; i < 9; i++) ctx.fillRect(10 + ((i * 29 + tb.i * 11) % 76), 8 + ((i * 13) % 26), 2, 2);   // crumbs
                dirty(b);
                tb.stain = new Sprite(b);
                tb.stain.x = tb.tx * T;
                tb.stain.y = tb.ty * T - 4;
                tb.stain.opacity = 0;
                this.decor.addChild(tb.stain);
                tb.left = tileSprite("C", tb.i % 2 ? 3 : 2, 2);   // a mug left from the night before
                tb.left.scale.set(0.8);
                tb.left.x = tb.tx * T + (tb.i % 2 ? 50 : 22);
                tb.left.y = tb.ty * T - 14;
                tb.left.visible = false;
                this.decor.addChild(tb.left);
            }
        }
        setFire(level) {   // 0 = embers (smoke), 1 small, 2 medium, 3 big
            this.fireLevel = level;
            this._fireRow = [2, 1, 3, 0][clamp(Math.ceil(level - 0.001), 0, 3)];
            this.fire.opacity = level <= 0 ? 150 : 255;
            this.fire.setFrame(9 * T, this._fireRow * T, T, T);
        }
        tickFire(t) {
            const col = 9 + (Math.floor(t / 8) % 3);
            this.fire.setFrame(col * T, this._fireRow * T, T, T);
            if (this.glow) {
                const f = clamp(this.fireLevel / 3, 0, 1);
                this.glow.opacity = (110 + 90 * f) * (0.85 + 0.15 * Math.sin(t / 5) * Math.sin(t / 13));
            }
            if (this.candles) for (const c of this.candles) c.setFrame((3 + (Math.floor(t / 10 + c._ph) % 3)) * T, 0, T, T);
        }
        setDirty(tb, v) {
            tb.dirty = clamp(v, 0, 1);
            tb.stain.opacity = 255 * tb.dirty;
            tb.left.visible = tb.dirty > 0.5;
        }
        buildEvening() {
            // a dim blue dusk over the room with holes where the lamps, the candles and the fire light it, plus a warm glow
            const W = RC * T, H = RR * T;
            const dark = new Bitmap(W, H), ctx = dark.context;
            ctx.fillStyle = "rgba(10,10,32,0.42)";
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = "destination-out";
            const hole = (x, y, r, a) => {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, "rgba(0,0,0," + a + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
            };
            hole(cx(SPOT.fire.tx), 70, 230, 0.95);
            hole(cx(4), 110, 200, 0.85);
            for (const tb of this.tables) hole(tb.tx * T + 48, tb.ty * T + 16, 120, 0.7);
            hole(cx(9), H, 110, 0.5);
            ctx.globalCompositeOperation = "source-over";
            dirty(dark);
            this.lights.addChild(new Sprite(dark));
            const glowB = new Bitmap(W, H), g2 = glowB.context;
            const warm = (x, y, r, a) => {
                const g = g2.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, "rgba(255,150,60," + a + ")"); g.addColorStop(1, "rgba(255,120,40,0)");
                g2.fillStyle = g; g2.fillRect(x - r, y - r, r * 2, r * 2);
            };
            warm(cx(SPOT.fire.tx), 70, 200, 0.28);
            dirty(glowB);
            this.glow = new Sprite(glowB);
            this.glow.blendMode = PIXI.BLEND_MODES.ADD;
            this.lights.addChild(this.glow);
            // candles on the tables
            this.candles = [];
            for (const tb of this.tables) {
                const c = new Sprite(ImageManager.loadCharacter("!Flame"));
                c.setFrame(3 * T, 0, T, T);
                c.anchor.set(0.5, 1);
                c.scale.set(0.55);
                c.x = tb.tx * T + 48;
                c.y = tb.ty * T + 22;
                c._ph = tb.i;
                this.decor.addChild(c);
                this.candles.push(c);
            }
        }
        addFigure(look, tx, ty, dir) {
            const f = new Figure(look);
            const p = standPt(tx, ty);
            f.x = p.x;
            f.y = p.y + 4;
            f.dir = dir || 2;
            f.refresh();
            this.chars.addChild(f);
            return f;
        }
        sortChars() {
            this.chars.children.sort((a, b) => a.y - b.y || (a._sid || 0) - (b._sid || 0));
        }
        // the hero's feet box at (x, y) touches only walkable tiles
        free(x, y) {
            const x0 = Math.floor((x - 11) / T), x1 = Math.floor((x + 11) / T), y0 = Math.floor((y - 10) / T), y1 = Math.floor((y + 2) / T);
            for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!this.walkable(tx, ty)) return false;
            return true;
        }
        // moves the hero, sliding round corners (a few px of nudge, so he does not stick on a table's edge)
        move(h, dx, dy) {
            let moved = 0;
            if (dx) {
                if (this.free(h.x + dx, h.y)) { h.x += dx; moved += Math.abs(dx); } else if (!dy) {
                    for (let s = 1; s <= 14; s++) {
                        if (this.free(h.x + dx, h.y - s) && this.free(h.x, h.y - Math.min(2, s))) { h.y -= Math.min(2, s); moved += 1; break; }
                        if (this.free(h.x + dx, h.y + s) && this.free(h.x, h.y + Math.min(2, s))) { h.y += Math.min(2, s); moved += 1; break; }
                    }
                }
            }
            if (dy) {
                if (this.free(h.x, h.y + dy)) { h.y += dy; moved += Math.abs(dy); } else if (!dx) {
                    for (let s = 1; s <= 14; s++) {
                        if (this.free(h.x - s, h.y + dy) && this.free(h.x - Math.min(2, s), h.y)) { h.x -= Math.min(2, s); moved += 1; break; }
                        if (this.free(h.x + s, h.y + dy) && this.free(h.x + Math.min(2, s), h.y)) { h.x += Math.min(2, s); moved += 1; break; }
                    }
                }
            }
            return moved;
        }
        tileOf(x, y) { return { tx: Math.floor(x / T), ty: Math.floor((y - 6) / T) }; }
        // A* over the tiles (8 ways, no cutting corners); returns tile-centre points (room px) from start to goal
        path(fx, fy, gx, gy, walk) {
            walk = walk || ((x, y) => this.walkable(x, y));
            const s = this.tileOf(fx, fy), g = this.tileOf(gx, gy);
            const key = (x, y) => y * RC + x;
            const open = [{ x: s.tx, y: s.ty, g: 0, f: 0 }], from = {}, cost = { [key(s.tx, s.ty)]: 0 };
            const done = new Set();
            while (open.length) {
                let bi = 0;
                for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
                const n = open.splice(bi, 1)[0], nk = key(n.x, n.y);
                if (done.has(nk)) continue;
                done.add(nk);
                if (n.x === g.tx && n.y === g.ty) {
                    const pts = [];
                    let k = nk;
                    while (k !== undefined) { const x = k % RC, y = Math.floor(k / RC); pts.unshift(standPt(x, y)); k = from[k]; }
                    return pts;
                }
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        const x = n.x + dx, y = n.y + dy;
                        if (!walk(x, y)) continue;
                        if (dx && dy && (!walk(n.x + dx, n.y) || !walk(n.x, n.y + dy))) continue;
                        const c = n.g + (dx && dy ? 1.414 : 1), k = key(x, y);
                        if (cost[k] !== undefined && cost[k] <= c) continue;
                        cost[k] = c;
                        from[k] = nk;
                        open.push({ x, y, g: c, f: c + Math.hypot(g.tx - x, g.ty - y) });
                    }
                }
            }
            return null;
        }
        // walkable tiles next to the given tiles (4 ways), as stand points
        standsAround(tiles) {
            const out = [], seen = new Set(tiles.map(t => t.tx + "," + t.ty));
            for (const t of tiles) {
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const x = t.tx + dx, y = t.ty + dy, k = x + "," + y;
                    if (seen.has(k) || !this.walkable(x, y)) continue;
                    seen.add(k);
                    out.push(standPt(x, y));
                }
            }
            return out;
        }
        rectOf(tx, ty, w, h) { return { x: tx * T, y: ty * T, w: (w || 1) * T, h: (h || 1) * T }; }
        tableRect(tb) { return this.rectOf(tb.tx, tb.ty, 2, 1); }
        // distance from the hero's reach point to a rectangle
        reach(h, r) {
            const px = h.x, py = h.y - 12;
            const dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h));
            return Math.hypot(dx, dy);
        }
        nearest(h, targets) {
            let best = null, bd = REACH + 0.001;
            for (const tg of targets) {
                const d = this.reach(h, tg.rect);
                if (d < bd) { bd = d; best = tg; }
            }
            return best;
        }
        destroy() {}
    }

    // the hero walking in the room: keys -> move, facing, legs
    function heroWalk(room, hero, k) {
        const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
        const sp = k.shift ? 5.4 : 4.2, f = dx && dy ? Math.SQRT1_2 : 1;
        const moved = dx || dy ? room.move(hero, dx * sp * f, dy * sp * f) : 0;
        hero.fig.moving = moved > 0.1;
        if (dx || dy) hero.fig.dir = hero.fig.look.eight ? dirOf(dx, dy) : dirOf(dy ? 0 : dx, dy);
        hero.fig.advance(moved);
        hero.fig.x = hero.x;
        hero.fig.y = hero.y + 4;
        hero.fig.refresh();
    }

    // the "O: ..." plate over a target, with a ring for hold actions
    class Prompt extends Sprite {
        initialize() {
            super.initialize(new Bitmap(300, 44));
            this.anchor.set(0.5, 1);
            this._key = "";
        }
        show(label, x, y, ratio, dim) {
            const key = label + "|" + (ratio === undefined ? "" : Math.round(ratio * 20)) + "|" + !!dim;
            this.visible = true;
            this.x = Math.round(x);
            this.y = Math.round(y);
            if (key === this._key) return;
            this._key = key;
            const b = this.bitmap;
            b.clear();
            const size = 18, tw = Math.ceil(measure(b, label, size, true));
            const w = Math.min(296, tw + 48), x0 = Math.round((300 - w) / 2);
            panel(b, x0, 6, w, 32, { cut: 4, fill: "rgba(11,12,15,0.9)", accent: !dim });
            keyCap(b, "O", x0 + 6, 10, 24, dim ? ST().muted : ST().accent);
            if (ratio !== undefined) {
                const ctx = b.context;
                ctx.save(); ctx.strokeStyle = ST().accent; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(x0 + 18, 22, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(ratio, 0, 1)); ctx.stroke(); ctx.restore();
                dirty(b);
            }
            txt(b, label, x0 + 36, 8, w - 40, { size, color: dim ? ST().muted : ST().text, bold: true });
        }
        hide() { this.visible = false; }
    }

    // the side panel of the room parts (320 x 624 at the room's right)
    const SIDE = { x: ROOM_X + RC * T + 16, y: ROOM_Y, w: 1280 - (ROOM_X + RC * T + 16) - 16, h: RR * T };

    // ---- small drawings the parts share
    function fmtTime(ticks) {
        const s = Math.ceil(ticks / 60);
        return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }
    function drawLegend(b, x, y, rows) {
        let yy = y;
        for (const [caps, text] of rows) {
            let xx = x;
            for (const c of caps) xx += keyCap(b, c, xx, yy, 24) + 3;
            txt(b, text, xx + 6, yy + 1, 240, { size: 17, color: ST().text });
            yy += 30;
        }
    }

    // ---- the close-ups' props (the keg part): the log wall, the cask with its brass tap, the glass mug
    const PX = 3;   // the close-ups' pixel size (tiles and drawn props alike)
    const MUG = { w: 48, h: 64, in0: 7, in1: 56 };   // low-res mug canvas; the inside from y in0 (rim) to in1 (bottom)
    const CASK = { w: 80, h: 76, tipX: 40, tipY: 62 };
    function closeupWall(rows, extra) {
        // the log wall (inside pieces) with shelves; `extra(x, y)` adds layer-1 tiles
        return makeTilemap(9, rows, (x, y) => [WALL_IN, extra ? extra(x, y) : 0, 0, 0]);
    }
    function drawCask(b) {
        const c = b.context;
        c.clearRect(0, 0, CASK.w, CASK.h);
        const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
        // the cradle: two legs and a beam
        R(8, 54, 64, 5, "#5a3a1c"); R(8, 54, 64, 1, "#7c5530");
        for (const lx of [12, 58]) { R(lx, 58, 10, 16, "#4d3118"); R(lx, 58, 2, 16, "#6b4726"); R(lx - 3, 72, 16, 3, "#3a2410"); }
        // the cask's head: boards in a circle with iron hoops
        const cx0 = 40, cy0 = 32, rad = 29;
        for (let y = cy0 - rad; y <= cy0 + rad; y++) {
            for (let x = cx0 - rad; x <= cx0 + rad; x++) {
                const d = Math.hypot(x - cx0 + 0.5, y - cy0 + 0.5);
                if (d > rad) continue;
                let col;
                if (d > rad - 2.2) col = d > rad - 1 ? "#1d1d22" : "#4a4a52";                  // the outer hoop
                else if (d > rad - 3.4) col = "#2b1a0c";                                        // the chime's shadow
                else {
                    const board = Math.floor((x - (cx0 - rad) + 1) / 7);
                    const seam = (x - (cx0 - rad) + 1) % 7 === 0;
                    col = seam ? "#4a2c12" : board % 2 ? "#a4682e" : "#94592a";
                    if (!seam && (x - cx0) + (y - cy0) < -18) col = board % 2 ? "#b87a3a" : "#a86c32";   // light from the upper left
                    if (!seam && (x - cx0) + (y - cy0) > 20) col = board % 2 ? "#83501f" : "#764819";
                }
                R(x, y, 1, 1, col);
            }
        }
        // hoop highlight, a bung, the brand
        for (let a = 3.5; a < 4.6; a += 0.04) R(Math.round(cx0 + Math.cos(a) * (rad - 1.2)), Math.round(cy0 + Math.sin(a) * (rad - 1.2)), 1, 1, "#9a9aa6");
        R(38, 10, 5, 3, "#3a220e"); R(39, 11, 3, 1, "#5e3a1a");
        // the brass tap: a body out of the head, a key on top, the nozzle down
        R(34, 46, 13, 7, "#8a5f16"); R(35, 47, 11, 5, "#d6a13c"); R(35, 47, 11, 1, "#ffe08a");
        R(39, 40, 3, 7, "#8a5f16"); R(40, 40, 1, 6, "#e8b85a");
        R(34, 38, 13, 3, "#8a5f16"); R(35, 38, 11, 1, "#ffe08a");
        R(37, 53, 7, 9, "#8a5f16"); R(38, 53, 5, 8, "#c99632"); R(38, 53, 1, 8, "#ffe08a");
        R(37, 61, 7, 1, "#5e3f0c");
        dirty(b);
    }
    function drawMug(b, level, foam, line, spill, t) {
        const c = b.context, R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
        c.clearRect(0, 0, MUG.w, MUG.h);
        const x0 = 4, x1 = 33, top = 4, bot = 61, ih = MUG.in1 - MUG.in0;
        // the handle
        R(33, 14, 9, 3, "#2a2f38"); R(33, 44, 9, 3, "#2a2f38"); R(40, 16, 3, 29, "#2a2f38");
        R(34, 15, 7, 1, "#c9dde8"); R(41, 17, 1, 27, "#a9c2d0"); R(34, 45, 7, 1, "#8fa6b3");
        // the glass: back tint
        R(x0 + 1, top + 1, x1 - x0 - 1, bot - top - 1, "rgba(190,220,236,0.30)");
        // beer and foam (level = top of the foam, 0..1 of the inside)
        const yTop = Math.round(MUG.in1 - level * ih), yFoam = Math.round(MUG.in1 - Math.max(0, level - foam) * ih);
        if (level > 0.004) {
            for (let y = Math.max(MUG.in0, yFoam); y < MUG.in1; y++) R(x0 + 3, y, x1 - x0 - 5, 1, y > MUG.in1 - 6 ? "#b8691a" : y % 5 === 0 ? "#e6a12a" : "#dc921f");
            for (let i = 0; i < 6; i++) {   // rising bubbles
                const bx = x0 + 5 + ((i * 7 + 3) % 21), by = MUG.in1 - 2 - ((t * (1 + i % 3) + i * 11) % Math.max(1, MUG.in1 - yFoam));
                if (by > yFoam + 1) R(bx, by, 1, 1, "#ffd27a");
            }
            for (let y = Math.max(0, yTop); y < yFoam && y < MUG.in1; y++) R(x0 + 3, y, x1 - x0 - 5, 1, y === yFoam - 1 ? "#e8d7aa" : "#fff4da");
            for (let x = x0 + 3; x < x1 - 2; x++) if ((x * 7 + Math.floor(t / 6)) % 5 === 0 && yTop - 1 >= 0) R(x, yTop - 1, 1, 1, "#fff4da");   // a bumpy crown
        }
        if (spill) {   // foam over the rim and down the sides
            R(x0 - 1, top - 2, x1 - x0 + 3, 3, "#fff4da");
            for (const [x, len] of [[x0 - 1, 14 + (t % 4)], [x0 + 9, 6], [x1 + 1, 18 + (t % 3)], [x1 - 6, 9]]) R(x, top, 2, len, "#f3e2b4");
        }
        // the glass: outline, thick base, highlights
        R(x0, top, 1, bot - top, "#2a2f38"); R(x1, top, 1, bot - top, "#2a2f38"); R(x0, bot, x1 - x0 + 1, 1, "#2a2f38");
        R(x0 + 1, top, 2, bot - top, "#d8e8f0"); R(x1 - 2, top, 2, bot - top, "#9fb6c4");
        R(x0 + 1, MUG.in1, x1 - x0 - 1, bot - MUG.in1, "rgba(200,225,240,0.75)"); R(x0 + 1, MUG.in1, x1 - x0 - 1, 1, "#ffffff");
        R(x0 - 1, top - 1, x1 - x0 + 3, 2, "#2a2f38"); R(x0, top - 1, x1 - x0 + 1, 1, "#eef6fa");
        R(x0 + 5, top + 6, 1, 40, "rgba(255,255,255,0.65)"); R(x0 + 7, top + 10, 1, 18, "rgba(255,255,255,0.4)");
        // the line: yellow ticks either side and a dashed line across
        const yl = Math.round(MUG.in1 - line * ih);
        R(0, yl, 4, 1, "#ffd23f"); R(0, yl - 1, 2, 3, "#ffd23f");
        for (let x = x0 + 3; x < x1 - 1; x += 3) R(x, yl, 2, 1, "rgba(255,210,63,0.9)");
        R(x1 + 1, yl, 3, 1, "#ffd23f");
        dirty(b);
    }
    function drawStar(b, x, y, r, colour) {
        const c = b.context;
        c.save();
        c.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
            c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        c.closePath();
        c.fillStyle = colour; c.fill();
        c.restore();
        dirty(b);
    }
    function drawBubble(b, x, y, w, h, ratio) {
        const S = ST(), c = b.context;
        S.panel(c, x, y, w, h, { cut: 5, fill: "rgba(11,12,15,0.92)", line: ratio < 0.25 ? BAD : S.line });
        c.save();
        c.fillStyle = "rgba(11,12,15,0.92)";
        c.strokeStyle = ratio < 0.25 ? BAD : S.line;
        c.beginPath();
        const mx = x + w / 2;
        c.moveTo(mx - 7, y + h - 1); c.lineTo(mx, y + h + 9); c.lineTo(mx + 7, y + h - 1);
        c.fill();
        c.beginPath(); c.moveTo(mx - 7, y + h - 0.5); c.lineTo(mx, y + h + 9); c.lineTo(mx + 7, y + h - 0.5); c.stroke();
        c.restore();
        dirty(b);
    }

    P.hall = {
        T, SHEETS, sheet, tilesetNames, tB, tC, tD, FLOOR, PLANKS_H, WALL_IN, tileSprite, makeTilemap,
        heroLook, PEOPLE, Figure, dirOf, Floater, Particle, dotBitmap, Part,
        RC, RR, ROOM_X, ROOM_Y, DOOR_X0, DOOR_X1, TABLES, COUNTER_X0, COUNTER_X1, COUNTER_Y, SPOT, SACK_SPOTS, REACH, cx, standPt, Room, heroWalk, Prompt, SIDE,
        fmtTime, drawLegend, PX, MUG, CASK, closeupWall, drawCask, drawMug, drawStar, drawBubble
    };
})();
