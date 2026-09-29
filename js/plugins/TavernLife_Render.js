//=============================================================================
// TavernLife_Render.js
//=============================================================================
// What TavernLife.js shows: the card over the map (Borgar's dishes, the rooms) with its pictures, the effects on the map (the plate on
// the table, steam, Melia's notes, drops, the water in the tub, the breakfast tray), the candles of the rented rooms, the coins, the
// bather's sprite and the premia's symbols in the HUD. It keeps no state of the game: it reads TavernLife.lib and draws.

/*:
 * @target MZ
 * @plugindesc Rysunki życia w tawernie (część TavernLife.js): karta dań i pokoi, talerze, para, nuty, świece w pokojach, monety, kąpiel, znaczki premii w HUD. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @help
 * ============================================================================
 * TavernLife_Render.js - rysunki życia w tawernie
 * ============================================================================
 * Część TavernLife.js: wszystko, co widać przy usługach tawerny - karta dań
 * i pokoi u Borgara (z obrazkami potraw i pokoi), talerz na stole, para,
 * nuty pieśni Melii, woda w balii, taca ze śniadaniem, świeca w wynajętym
 * pokoju, monety lecące z ręki do ręki, znaczki premii (Czysty, Natchniony,
 * Ugoszczony, Wypoczęty) w HUD.
 *
 * KOLEJNOŚĆ: zaraz pod TavernLife.js. Nie ma własnych parametrów.
 * Bez niej usługi działają, ale bez karty (zamówienie u Borgara nie ruszy)
 * i bez tych rysunków.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Render.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Render.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib, ui = T.ui;
    const { clamp, lerp, hash, U, BAD, GOLD_ICON, se, gold, hoursText, pct, cached, dirty, dropBitmap, spots, roomKey, isRented, blockedByEvent,
        addFx, foodOf, SV, isNumbered, namedAsRoom, giftName, RESTED, canRent, onlyFor } = lib;
    const { CHECKOUT, RESTED_BONUS } = lib.config;
    const fx = lib.fx;
    const DISH_SHEET = "Tav_Dishes";

    // the HUD's symbols for the three premia (UITheme.js's UIStyle.glyph knows only its own): a soap bubble, a note, a mug with foam
    function installGlyphs() {
        const S0 = T.api("UITheme");
        if (!S0 || !S0.glyph || S0._tavernGlyphs) return;
        const base = S0.glyph;
        S0._tavernGlyphs = true;
        S0.glyph = function(ctx, kind, x, y, size, fill, bare) {
            if (kind !== "clean" && kind !== "inspired" && kind !== "hosted" && kind !== "rested") return base.apply(this, arguments);
            const col = fill || S0.accent, dark = bare ? "rgba(0,0,0,0)" : "rgba(8,9,11,0.92)";
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(size / 20, size / 20);
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            const solid = p => { ctx.lineWidth = 3; ctx.strokeStyle = dark; ctx.stroke(p); ctx.fillStyle = col; ctx.fill(p); };
            const line = (p, w) => { ctx.strokeStyle = dark; ctx.lineWidth = w + 3; ctx.stroke(p); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(p); };
            if (kind === "clean") {   // soap bubbles
                const big = new Path2D(), small = new Path2D(), tiny = new Path2D();
                big.arc(8.2, 11.6, 5.6, 0, Math.PI * 2);
                small.arc(15, 6, 3.2, 0, Math.PI * 2);
                tiny.arc(15.6, 14.8, 2, 0, Math.PI * 2);
                line(big, 1.8); line(small, 1.6); line(tiny, 1.4);
                const shine = new Path2D();
                shine.arc(8.2, 11.6, 3.4, Math.PI * 1.05, Math.PI * 1.55);
                ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.3; ctx.stroke(shine);
            } else if (kind === "rested") {   // a crescent moon and a star
                const moon = new Path2D();
                moon.arc(9, 11, 7.2, 0, Math.PI * 2);
                moon.moveTo(15.5, 8.2);
                moon.arc(12, 8.2, 5.8, 0, Math.PI * 2, true);
                ctx.lineWidth = 3; ctx.strokeStyle = dark; ctx.stroke(moon);
                ctx.fillStyle = col; ctx.fill(moon, "evenodd");
                const star = new Path2D();
                star.moveTo(16.2, 12.6); star.lineTo(17, 14.6); star.lineTo(19, 15.4); star.lineTo(17, 16.2); star.lineTo(16.2, 18.2); star.lineTo(15.4, 16.2); star.lineTo(13.4, 15.4); star.lineTo(15.4, 14.6); star.closePath();
                solid(star);
            } else if (kind === "inspired") {   // a note
                const head = new Path2D();
                head.ellipse(7.2, 15.2, 3.7, 2.8, -0.45, 0, Math.PI * 2);
                solid(head);
                const stem = new Path2D();
                stem.moveTo(10.4, 14.4); stem.lineTo(10.4, 2.6); stem.quadraticCurveTo(12.5, 6.5, 16.2, 7.4);
                line(stem, 2);
            } else {   // a mug with foam
                const body = new Path2D();
                body.moveTo(4, 7.5); body.lineTo(13.4, 7.5); body.lineTo(13, 17.6); body.lineTo(4.4, 17.6); body.closePath();
                const handle = new Path2D();
                handle.moveTo(13.2, 9.4); handle.bezierCurveTo(18.6, 9.4, 18.6, 15.2, 13.1, 15.2);
                line(handle, 2);
                solid(body);
                const foam = new Path2D();
                foam.arc(5.6, 6.6, 2.4, Math.PI, 0); foam.arc(9, 5.4, 2.6, Math.PI, 0); foam.arc(12.2, 6.6, 2.2, Math.PI, 0);
                foam.lineTo(14.2, 8.4); foam.lineTo(3.4, 8.4); foam.closePath();
                ctx.lineWidth = 3; ctx.strokeStyle = dark; ctx.stroke(foam);
                ctx.fillStyle = "#fff6dc"; ctx.fill(foam);
            }
            ctx.restore();
        };
    }
    installGlyphs();

    // ==================================================================
    // Effects on the map: plates on the tables, steam, the room's candle, music notes, drops of water, ripples in the tub. Map-space
    // sprites in the tilemap (they sort with the characters by y); TavernLife keeps their records (TavernLife.fx)
    // ==================================================================
    const tilemap = () => { const s = SceneManager._scene; return s instanceof Scene_Map && s._spriteset ? s._spriteset._tilemap : null; };
    const tw = () => $gameMap.tileWidth(), th = () => $gameMap.tileHeight();
    const mapPx = (x, y) => ({ x: Math.round(($gameMap.adjustX(x) + 0.5) * tw()), y: Math.round(($gameMap.adjustY(y) + 0.5) * th()) });
    // a soft white puff (steam)
    const puffBitmap = () => cached("puff", () => {
        const b = new Bitmap(32, 32), ctx = b.context, g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.5, "rgba(245,245,250,0.28)"); g.addColorStop(1, "rgba(240,240,250,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
        dirty(b);
        return b;
    });
    // a warm glow (the candle), drawn with additive blending
    const glowBitmap = () => cached("glow", () => {
        const b = new Bitmap(128, 128), ctx = b.context, g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, "rgba(255,196,110,0.55)"); g.addColorStop(0.35, "rgba(255,160,70,0.22)"); g.addColorStop(1, "rgba(255,140,60,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
        dirty(b);
        return b;
    });
    // the candle on its iron stand (no flame: the flame is its own sprite)
    const candleBitmap = () => cached("candle", () => {
        const b = new Bitmap(16, 30), ctx = b.context;
        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(8, 28, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1c1612"; ctx.fillRect(7, 16, 2, 11); ctx.fillRect(3, 26, 10, 2); ctx.fillRect(4, 15, 8, 2);   // the stand
        ctx.fillStyle = "#6b5a44"; ctx.fillRect(4, 15, 8, 1);
        ctx.fillStyle = "#1c1612"; ctx.fillRect(5, 6, 6, 10);   // the candle's outline
        ctx.fillStyle = "#efe6cf"; ctx.fillRect(6, 7, 4, 8);
        ctx.fillStyle = "#fffaf0"; ctx.fillRect(6, 7, 1, 8);
        ctx.fillStyle = "#d8ccae"; ctx.fillRect(9, 8, 1, 7);
        ctx.fillStyle = "#3a2e22"; ctx.fillRect(7, 5, 1, 2);   // the wick
        dirty(b);
        return b;
    });
    const flameBitmap = () => cached("flame", () => {
        const b = new Bitmap(10, 16), ctx = b.context, g = ctx.createRadialGradient(5, 11, 0, 5, 10, 7);
        g.addColorStop(0, "rgba(255,255,230,1)"); g.addColorStop(0.35, "rgba(255,226,120,1)"); g.addColorStop(0.75, "rgba(255,150,40,0.85)"); g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(5, 0.5); ctx.quadraticCurveTo(9.5, 8, 8.5, 12); ctx.quadraticCurveTo(5, 16.5, 1.5, 12); ctx.quadraticCurveTo(0.5, 8, 5, 0.5); ctx.fill();
        dirty(b);
        return b;
    });
    // a music note (Melia sings)
    const noteBitmap = k => cached("note" + k, () => {
        const b = new Bitmap(20, 24), ctx = b.context;
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        const head = (x, y) => { ctx.beginPath(); ctx.ellipse(x, y, 3.6, 2.7, -0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
        ctx.fillStyle = k ? "#ffe27a" : "#fff6dc";
        ctx.strokeStyle = "rgba(20,16,10,0.85)";
        ctx.lineWidth = 1.4;
        if (k) {   // two notes joined
            head(5, 19); head(15, 16);
            ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(8, 18.6); ctx.lineTo(8, 5); ctx.lineTo(18, 2.5); ctx.lineTo(18, 15.6); ctx.stroke();
            ctx.lineWidth = 1.8; ctx.strokeStyle = "#ffe27a"; ctx.beginPath(); ctx.moveTo(8, 18.6); ctx.lineTo(8, 5); ctx.lineTo(18, 2.5); ctx.lineTo(18, 15.6); ctx.stroke();
        } else {
            head(7, 19);
            ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(10.2, 18.4); ctx.lineTo(10.2, 3); ctx.quadraticCurveTo(12.5, 8, 16.5, 8.5); ctx.stroke();
            ctx.lineWidth = 1.8; ctx.strokeStyle = "#fff6dc"; ctx.beginPath(); ctx.moveTo(10.2, 18.4); ctx.lineTo(10.2, 3); ctx.quadraticCurveTo(12.5, 8, 16.5, 8.5); ctx.stroke();
        }
        dirty(b);
        return b;
    });
    // the water in the tub around the bather: a flat surface with light ripples (redrawn as it moves)
    function paintWater(b, t) {
        const ctx = b.context, w = b.width, h = b.height;
        b.clear();
        ctx.save();
        ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); ctx.clip();
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(160,198,212,0.78)"); g.addColorStop(1, "rgba(112,150,168,0.7)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const k = ((t / 50 + i / 3) % 1), rx = 6 + k * (w / 2 - 6), ry = 2 + k * (h / 2 - 2);
            ctx.globalAlpha = 0.7 * (1 - k);
            ctx.beginPath(); ctx.ellipse(w / 2, h / 2 - 1, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.strokeStyle = "rgba(40,30,22,0.55)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); ctx.stroke();
        dirty(b);
    }

    // the plate of a dish on the table: the dish's icon on a plate, bitten more and more; at the end an empty plate (or mug)
    function iconInto(b, dish, x, y, size) {
        if (dish.sheet !== undefined) {
            const sheet = ImageManager.loadSystem(DISH_SHEET);
            if (sheet.isReady()) b.blt(sheet, dish.sheet * 32, 0, 32, 32, x, y, size, size);
        } else {
            const set = ImageManager.loadSystem("IconSet"), i = dish.icon;
            if (set.isReady()) b.blt(set, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, x, y, size, size);
        }
    }
    function paintPlate(b, dish, eaten) {
        const ctx = b.context, w = b.width, h = b.height;
        b.clear();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(w / 2, h - 5, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
        const done = eaten >= 0.98;
        if (!dish.drink) {   // the plate under it (the bowls of soup stand on a small wooden board)
            ctx.fillStyle = dish.bowl ? "#5a3d24" : "#20170f";
            ctx.beginPath(); ctx.ellipse(w / 2, h - 8, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = dish.bowl ? "#8a6038" : "#e9e2d0";
            ctx.beginPath(); ctx.ellipse(w / 2, h - 9, 15.5, 5, 0, 0, Math.PI * 2); ctx.fill();
            if (!dish.bowl) { ctx.fillStyle = "#cfc5ad"; ctx.beginPath(); ctx.ellipse(w / 2, h - 9, 11, 3.2, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        if (done) {
            if (dish.drink) {   // the empty mug, lying there
                ctx.globalAlpha = 0.9; iconInto(b, dish, w / 2 - 12, h - 28, 24); ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = "rgba(60,40,24,0.45)"; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over";
            } else {   // crumbs and a spoon
                ctx.fillStyle = "#8c6a45";
                for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(w / 2 - 8 + hash(i, 3) * 16), Math.round(h - 12 + hash(i, 5) * 5), 2, 1);
                ctx.fillStyle = "#b8b8b0"; ctx.fillRect(Math.round(w / 2 + 3), h - 12, 8, 1); ctx.fillRect(Math.round(w / 2 + 1), h - 13, 3, 2);
            }
        } else {
            iconInto(b, dish, w / 2 - 13, h - 30, 26);
            const bites = Math.floor(eaten * 7);
            if (bites > 0 && !dish.drink) {   // bites out of the top of the food
                ctx.globalCompositeOperation = "destination-out";
                for (let i = 0; i < bites; i++) {
                    const bx = w / 2 - 10 + hash(i, 7) * 20, by = h - 30 + hash(i, 9) * 10, r = 3 + hash(i, 11) * 3;
                    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalCompositeOperation = "source-over";
            } else if (dish.drink && eaten > 0.02) {   // the drink goes down
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0," + (0.55 * eaten).toFixed(2) + ")";
                ctx.fillRect(0, 0, w, Math.round(h - 30 + 10 * eaten));
                ctx.globalCompositeOperation = "source-over";
            }
        }
        dirty(b);
    }

    function makeFxSprite(o) {
        const s = new Sprite();
        s.anchor.set(0.5, 1);
        switch (o.kind) {
            case "plate": s.bitmap = new Bitmap(44, 36); s._eaten = -1; break;
            case "steam": s.bitmap = puffBitmap(); s.anchor.set(0.5, 0.5); s.z = 5; break;
            case "note": s.bitmap = noteBitmap(o.k || 0); s.anchor.set(0.5, 0.5); s.z = 5; break;
            case "drop": s.bitmap = dropBitmap(); s.z = 5; break;
            case "water": s.bitmap = new Bitmap(46, 16); s.anchor.set(0.5, 0.5); break;
            case "tray": s.bitmap = trayBitmap(); s.anchor.set(0.5, 0.5); break;
            case "bubble": s.bitmap = cached("bubble", () => { const b = new Bitmap(6, 6), c = b.context; c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1; c.beginPath(); c.arc(3, 3, 2, 0, Math.PI * 2); c.stroke(); dirty(b); return b; }); s.anchor.set(0.5, 0.5); s.z = 5; break;
        }
        if (s.z === undefined) s.z = 3;
        return s;
    }
    // every map frame: move what moves, draw what changed, take away what is over
    function updateFx() {
        const tm = tilemap();
        for (let i = fx.length - 1; i >= 0; i--) {
            const o = fx[i];
            o.t++;
            if (o.gone || (o.life && o.t >= o.life) || !tm) {
                if (o.spr && o.spr.parent) o.spr.parent.removeChild(o.spr);
                fx.splice(i, 1);
                continue;
            }
            if (!o.spr || o.tm !== tm) { o.spr = makeFxSprite(o); o.tm = tm; tm.addChild(o.spr); }
            const s = o.spr, p = mapPx(o.x, o.y);
            const k = o.life ? o.t / o.life : 0;
            switch (o.kind) {
                case "plate":
                    if (s._eaten !== o.eaten) { s._eaten = o.eaten; paintPlate(s.bitmap, o.dish, o.eaten); }
                    s.x = p.x + (o.px || 0);
                    s.y = p.y + (o.py || 0) + 12 - Math.round(10 * Math.max(0, 1 - o.t / 8) * Math.max(0, 1 - o.t / 8));   // (it is put down: drops in)
                    s.z = 3;
                    if (o.hot && o.eaten < 0.9 && o.t % 16 === 0) addFx({ kind: "steam", x: o.x + (o.px || 0) / tw(), y: o.y + (o.py || 0) / th() - 0.35, life: 70, vx: (hash(o.t, 3) - 0.5) * 0.2, size: 0.5 });
                    break;
                case "steam":
                    s.x = p.x + Math.sin((o.t + o.x * 40) / 14) * 3 + (o.vx || 0) * o.t;
                    s.y = p.y - o.t * (o.rise || 0.45);
                    s.scale.set((o.size || 1) * (0.5 + k * 1.1));
                    s.opacity = Math.round(255 * Math.min(1, o.t / 10) * (1 - k));
                    break;
                case "note":
                    s.x = p.x + Math.sin(o.t / 11 + (o.ph || 0)) * 7 + (o.vx || 0) * o.t;
                    s.y = p.y - 30 - o.t * 0.55;
                    s.opacity = Math.round(255 * Math.min(1, o.t / 12) * (1 - k * k));
                    s.rotation = Math.sin(o.t / 9 + (o.ph || 0)) * 0.25;
                    break;
                case "drop":
                    s.x = p.x + (o.px || 0);
                    s.y = p.y + (o.py || 0) + o.t * o.t * 0.035;
                    s.opacity = Math.round(255 * (1 - k));
                    break;
                case "water":
                    s.x = p.x; s.y = p.y + (o.py || 0); s.z = 3;
                    if (o.t % 3 === 0) paintWater(s.bitmap, o.t);
                    s._sortY = s.y + (o.after || 0);   // (over the bather)
                    break;
                case "tray":
                    s.x = p.x; s.y = p.y - 6; s.z = 3;
                    s._sortY = s.y + 40;   // (on the blanket: over the bed)
                    s.opacity = Math.round(255 * Math.min(1, o.t / 20, (o.life - o.t) / 40));
                    break;
                case "bubble":
                    s.x = p.x + (o.px || 0) + Math.sin(o.t / 5) * 1.5;
                    s.y = p.y + (o.py || 0) - o.t * 0.25;
                    s.opacity = Math.round(255 * (1 - k));
                    break;
            }
        }
        updateCandles(tm);
    }
    // the tilemap sorts its children by z, then by y: the water over the bather must come after him, whatever his y
    const _Tilemap_compare = Tilemap.prototype._compareChildOrder;
    Tilemap.prototype._compareChildOrder = function(a, b) {
        const ay = a._sortY !== undefined ? a._sortY + 1 : null, by = b._sortY !== undefined ? b._sortY + 1 : null;
        if ((ay !== null || by !== null) && a.z === b.z) {
            const va = ay !== null ? ay : a.y, vb = by !== null ? by : b.y;
            if (va !== vb) return va - vb;
        }
        return _Tilemap_compare.call(this, a, b);
    };

    // ------------------------------------------------------------------
    // The room's candle: lit while the room is rented for the night - on a <Tavern:candle room=N> event, else on its stand by the
    // pillow. It also opens a hole in RoomLighting's darkness (the same way that plugin's own lights do).
    // ------------------------------------------------------------------
    const candles = [];   // { room, x, y, px, py, stand, spr, flame, glow, hole, tm }
    function candleSpots() {
        const out = [];
        for (const c of spots("candle")) out.push({ room: roomKey(c.a.room), x: c.ev.x, y: c.ev.y, px: 0, py: 0, stand: false });
        for (const b of spots("bed")) {
            const room = roomKey(b.a.room);
            if (!room || out.some(c => c.room === room)) continue;
            // (no candle of its own: a candle on its stand on the floor beside the pillow - left of the bed, right of it (a bed two
            // tiles wide: <Occupy:right=1>), else at its foot; wherever the floor is free)
            if (b.a.candle) { const [dx, dy] = String(b.a.candle).split(",").map(Number); out.push({ room, x: b.ev.x + (dx || 0), y: b.ev.y + (dy || 0), px: 0, py: 10, stand: true }); continue; }
            const occ = /<Occupy:([^>]*)>/i.exec((b.ev.event() && b.ev.event().note) || ""), size = { right: 0, down: 0 };
            if (occ) for (const part of occ[1].split(",")) { const [k, v] = part.split("=").map(t => t.trim()); if (k in size) size[k] = Number(v) || 0; }
            const x = b.ev.x, y = b.ev.y, floor = (tx, ty) => $gameMap.isValid(tx, ty) && $gameMap.checkPassage(tx, ty, 0x0f) && !blockedByEvent(tx, ty);
            const at = floor(x - 1, y) ? { x: x - 0.72, y: y - 0.1 } : floor(x + size.right + 1, y) ? { x: x + size.right + 0.72, y: y - 0.1 }
                : floor(x - 1, y + size.down) ? { x: x - 0.72, y: y + size.down - 0.1 } : { x: x + 0.5 * size.right, y: y + size.down + 0.8 };
            out.push({ room, x: at.x, y: at.y, px: 0, py: 10, stand: true });
        }
        return out;
    }
    let candleMap = 0, candleList = [];
    function updateCandles(tm) {
        if (!tm) return;
        const mapId = $gameMap.mapId();
        if (candleMap !== mapId || Graphics.frameCount % 120 === 0) {   // (the places, found again now and then: the events may come later)
            candleMap = mapId;
            const want = candleSpots();
            for (const c of candleList) if (!want.some(w => w.room === c.room && w.x === c.x && w.y === c.y)) removeCandle(c);
            candleList = want.map(w => candleList.find(c => c.room === w.room && c.x === w.x && c.y === w.y) || w);
        }
        const set = SceneManager._scene._spriteset;
        for (const c of candleList) {
            const lit = isRented(c.room);
            if (c.tm !== tm) { c.spr = c.flame = c.glow = c.hole = null; c.tm = tm; }
            if (!lit) { removeCandle(c, true); continue; }
            const p = mapPx(c.x, c.y);
            if (!c.spr) {
                c.spr = new Sprite(c.stand ? candleBitmap() : new Bitmap(1, 1));
                c.spr.anchor.set(0.5, 1);
                c.spr.z = 3;
                c.flame = new Sprite(flameBitmap());
                c.flame.anchor.set(0.5, 1);
                c.flame.z = 3;
                tm.addChild(c.spr);
                tm.addChild(c.flame);
                c.glow = new Sprite(glowBitmap());
                c.glow.anchor.set(0.5, 0.5);
                c.glow.blendMode = PIXI.BLEND_MODES.ADD;
                const box = set && set._roomLightingContainer;
                (box || tm).addChild(c.glow);
                if (!box) c.glow.z = 5;
                if (set && Array.isArray(set._roomHoles)) { c.hole = { shape: "circle", sprite: c.glow, radius: 78 }; set._roomHoles.push(c.hole); }
            }
            const flick = 0.85 + 0.15 * Math.sin(Graphics.frameCount / 5 + c.x) * Math.sin(Graphics.frameCount / 13 + c.y);
            c.spr.x = p.x + c.px; c.spr.y = p.y + c.py;
            c.flame.x = c.spr.x; c.flame.y = c.spr.y - (c.stand ? 23 : 8); c.flame.scale.set(0.9 + 0.12 * flick, 0.8 + 0.3 * flick);
            c.flame._sortY = c.spr.y;
            const inBox = c.glow.parent !== tm;
            c.glow.x = inBox ? Math.round($gameMap.adjustX(c.x + 0.5) * tw() + c.px) : c.flame.x;
            c.glow.y = inBox ? Math.round($gameMap.adjustY(c.y + 0.5) * th() + c.py - (c.stand ? 26 : 10)) : c.flame.y - 4;
            c.glow.scale.set(0.95 + 0.08 * flick);
            c.glow.opacity = Math.round(200 * flick);
        }
    }
    function removeCandle(c, keep) {
        for (const k of ["spr", "flame", "glow"]) if (c[k] && c[k].parent) c[k].parent.removeChild(c[k]);
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        if (c.hole && set && Array.isArray(set._roomHoles)) { const i = set._roomHoles.indexOf(c.hole); if (i >= 0) set._roomHoles.splice(i, 1); }
        c.spr = c.flame = c.glow = c.hole = null;
        if (!keep) c.tm = null;
    }

    // the bather (TavernLife.bathing): only the top of him shows, a little higher, in front of the tub he sits in
    const _Sprite_Character_updateFrame = Sprite_Character.prototype.updateFrame;
    Sprite_Character.prototype.updateFrame = function() {
        _Sprite_Character_updateFrame.call(this);
        const bathing = lib.bathing;
        if (bathing && this._character === $gamePlayer && this._frame) {
            const f = this._frame;
            this.setFrame(f.x, f.y, f.width, Math.max(8, Math.round(f.height * (1 - bathing.cut))));
        }
    };
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        if (this._character !== $gamePlayer) return;
        const bathing = lib.bathing;
        if (bathing) { this.y -= bathing.lift; this._sortY = this.y + bathing.lift + 8; }   // (sorted after the tub he sits in)
        else if (this._sortY !== undefined) delete this._sortY;
    };

    // ------------------------------------------------------------------
    // Coins: the money flies from the hand that pays to the one that takes it (screen space, over the map, under the windows) - the
    // UI kit's coins (Tawerna.ui.coinBurst)
    // ------------------------------------------------------------------
    function screenPointOf(target) {
        const s = SceneManager._scene;
        if (!(s instanceof Scene_Map) || !s._spriteset) return null;
        if (target && typeof target.screenX === "function") {
            const spr = s._spriteset._characterSprites.find(c => c._character === target);
            if (spr && spr.parent) {
                const h = typeof spr.patternHeight === "function" ? spr.patternHeight() : 48;
                const g = spr.toGlobal(new Point(0, -h * 0.55));
                return { x: g.x, y: g.y };
            }
        } else if (target && target.x !== undefined) {
            const tm = s._spriteset._tilemap, p = mapPx(target.x, target.y), g = tm.toGlobal(new Point(p.x, p.y - 12));
            return { x: g.x, y: g.y };
        }
        return null;
    }
    function coins(amount, from, to) {
        const a = screenPointOf(from), b = screenPointOf(to), s = SceneManager._scene, box = s && s._tavernCoins;
        if (!a || !b || !(amount > 0) || !box) return;
        se("Coin", 55, 110);
        ui.coinBurst(box, clamp(Math.round(amount / 3), 1, 8), a, b, { gap: 5, duration: 34, arc: 110, scale: 0.7, spread: 0.01, sound: false,
            onDone: () => se("Coin", 75, 95) });
    }

    // ==================================================================
    // The card: a menu over the map in the game's black and yellow - the list on the left, what the chosen line is on the right
    // (the dishes at Borgar's, the rooms). The talk waits for it (TavernLife.busy); the choice goes back to TavernLife (setPick).
    // ==================================================================
    const CARD = { w: 836, h: 580, listW: 390, row: 56, rows: 7, head: 96, foot: 58 };   // (between the busts of the talk: they stay beside it)
    let card = null;   // { spec, pick, back, panel, win }
    function cardFont(b, size, colour, bold) {
        b.fontSize = size;
        b.textColor = colour || U().text;
        b.fontBold = !!bold;
        b.outlineWidth = 0;
    }
    function cardText(b, s, x, y, w, size, colour, bold, align) {
        cardFont(b, size, colour, bold);
        b.drawText(String(s), x, y, w, Math.round(size * 1.4), align || "left");
        b.fontBold = false;
    }
    const wrapText = (b, s, w, size) => ui.wrap(b, s, w, size);
    const panelInto = (b, x, y, w, h, opts) => ui.panel(b, x, y, w, h, opts);
    const keyHintsInto = (b, hints, x, y) => ui.keyHints(b, hints, x, y, 24, 17);

    function Window_TavernList() {
        this.initialize(...arguments);
    }
    Window_TavernList.prototype = Object.create(Window_Selectable.prototype);
    Window_TavernList.prototype.constructor = Window_TavernList;
    Window_TavernList.prototype.initialize = function(rect, spec) {
        this._spec = spec;
        Window_Selectable.prototype.initialize.call(this, rect);
        this.opacity = 0;
        this.refresh();
    };
    Window_TavernList.prototype.maxItems = function() { return this._spec.entries.length; };
    Window_TavernList.prototype.itemHeight = function() { return CARD.row; };
    Window_TavernList.prototype.entry = function() { return this._spec.entries[this.index()] || null; };
    Window_TavernList.prototype.isCurrentItemEnabled = function() { const e = this.entry(); return !!e && e.enabled !== false; };
    Window_TavernList.prototype.drawItem = function(i) {
        const e = this._spec.entries[i], r = this.itemLineRect(i), b = this.contents, S0 = U();
        this.changePaintOpacity(e.enabled !== false);
        const iy = r.y + Math.round((CARD.row - 8 - 32) / 2);
        drawEntryIcon(b, e, r.x + 2, iy, 32);
        const x = r.x + 44, right = r.x + r.width;
        // the price on the right (the day's dish: the old one crossed out above it)
        cardFont(b, 22, S0.accent, true);
        const price = e.right || "", pw = Math.ceil(b.measureTextWidth(price));
        cardText(b, price, right - pw - 2, r.y + 8, pw + 4, 22, e.enabled === false ? BAD : S0.accent, true);
        if (e.oldRight) {
            cardFont(b, 14, S0.muted);
            const ow = Math.ceil(b.measureTextWidth(e.oldRight));
            cardText(b, e.oldRight, right - ow - 2, r.y - 4, ow + 4, 14, S0.muted);
            b.fillRect(right - ow - 3, r.y + 6, ow + 3, 1, S0.muted);
        }
        cardText(b, e.name, x, r.y + 1, right - x - pw - 12, 21, S0.text, false);
        if (e.badge) {
            cardFont(b, 12, "#15171b", true);
            const bw = Math.ceil(b.measureTextWidth(e.badge)) + 12;
            b.fillRect(x, r.y + 30, bw, 17, S0.accent);
            cardText(b, e.badge, x, r.y + 29, bw, 12, "#15171b", true, "center");
            cardText(b, e.sub || "", x + bw + 8, r.y + 27, right - x - bw - 20, 15, S0.accent);
        } else cardText(b, e.sub || "", x, r.y + 27, right - x - 10, 15, S0.muted);
        this.changePaintOpacity(true);
    };
    Window_TavernList.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._onSelect) this._onSelect(index);
    };
    Window_TavernList.prototype.processOk = function() {
        if (this.isCurrentItemEnabled()) { Window_Selectable.prototype.processOk.call(this); return; }
        this.playBuzzerSound();
        const e = this.entry();
        if (e && e.why) e.why();
    };

    function drawEntryIcon(b, e, x, y, size) {
        if (e.dish) iconInto(b, e.dish, x, y, size);
        else if (e.icon) {
            const set = ImageManager.loadSystem("IconSet");
            if (set.isReady()) b.blt(set, (e.icon % 16) * 32, Math.floor(e.icon / 16) * 32, 32, 32, x, y, size, size);
        } else if (e.room) paintRoomIcon(b, e.room, x, y, size);
    }

    function Sprite_TavernCard() {
        this.initialize(...arguments);
    }
    Sprite_TavernCard.prototype = Object.create(Sprite.prototype);
    Sprite_TavernCard.prototype.constructor = Sprite_TavernCard;
    Sprite_TavernCard.prototype.initialize = function(spec) {
        Sprite.prototype.initialize.call(this, new Bitmap(CARD.w, CARD.h));
        this._spec = spec;
        this._index = -1;
        this._t = 0;
        this.x = Math.round((Graphics.width - CARD.w) / 2);
        this.y = Math.round((Graphics.height - CARD.h) / 2);
        this.opacity = 0;
    };
    Sprite_TavernCard.prototype.show = function(index) {
        this._index = index;
        this.redraw();
    };
    Sprite_TavernCard.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._t++;
        this.opacity = Math.min(255, this.opacity + 32);
        if (this._t % 20 === 0 && !this._ready && ImageManager.loadSystem("IconSet").isReady() && ImageManager.loadSystem(DISH_SHEET).isReady()) { this._ready = true; this.redraw(); if (card && card.win) card.win.refresh(); }
    };
    Sprite_TavernCard.prototype.redraw = function() {
        const b = this.bitmap, spec = this._spec, S0 = U(), W0 = CARD.w, H0 = CARD.h;
        b.clear();
        panelInto(b, 0, 0, W0, H0, { cut: 10 });
        cardText(b, spec.kicker, 30, 18, 600, 15, S0.muted, true);
        cardText(b, spec.title, 30, 38, 600, 36, S0.accent, true);
        // the purse
        cardText(b, "SAKIEWKA", W0 - 230, 22, 200, 13, S0.muted, true, "right");
        cardFont(b, 26, S0.accent, true);
        const g = gold() + " G", gw = Math.ceil(b.measureTextWidth(g));
        cardText(b, g, W0 - 30 - gw - 4, 40, gw + 6, 26, S0.accent, true);
        const set = ImageManager.loadSystem("IconSet");
        if (set.isReady()) b.blt(set, (GOLD_ICON % 16) * 32, Math.floor(GOLD_ICON / 16) * 32, 32, 32, W0 - 30 - gw - 38, 42, 30, 30);
        b.fillRect(24, CARD.head - 6, W0 - 48, 1, S0.line);
        b.fillRect(24, CARD.head - 6, 64, 2, S0.accent);
        // the detail of the chosen line
        const dx = CARD.listW + 44, dw = W0 - dx - 30, dy = CARD.head + 8, dh = H0 - CARD.head - CARD.foot - 16;
        b.fillRect(dx - 18, dy + 4, 1, dh - 8, S0.line);
        const e = spec.entries[this._index];
        const detail = spec.detail || DETAIL[spec.key];
        if (e && detail) detail(b, e, dx, dy, dw, dh);
        // the foot: keys and a word
        const fy = H0 - CARD.foot + 14;
        b.fillRect(24, H0 - CARD.foot, W0 - 48, 1, S0.line);
        keyHintsInto(b, [["↑↓", "wybór"], ["O", spec.okWord || "wybierz"], ["P", "wróć"]], 30, fy);
        if (spec.foot) cardText(b, spec.foot, W0 - 430, fy, 400, 16, S0.muted, false, "right");
        dirty(b);
    };

    function openCard(spec) {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || card) return false;
        const back = new Sprite(new Bitmap(4, 4));
        back.bitmap.fillAll("#000000");
        back.scale.set(Graphics.width / 4, Graphics.height / 4);
        back.opacity = 0;
        const panel = new Sprite_TavernCard(spec);
        const at = scene.getChildIndex(scene._windowLayer);
        scene.addChildAt(back, at);
        scene.addChildAt(panel, at + 1);
        const layer = scene._windowLayer, lx = layer ? layer.x : 0, ly = layer ? layer.y : 0;
        const rect = new Rectangle(panel.x + 14 - lx, panel.y + CARD.head + 2 - ly, CARD.listW + 12, CARD.row * CARD.rows + 24);
        const win = new Window_TavernList(rect, spec);
        win._onSelect = i => panel.show(i);
        win.setHandler("ok", () => closeCard(win.entry()));
        win.setHandler("cancel", () => closeCard(null));
        scene.addWindow(win);
        card = { spec, pick: undefined, back, panel, win, t: 0 };
        win.select(clamp(spec.index || 0, 0, Math.max(0, spec.entries.length - 1)));
        win.activate();
        se("Book1", 55, 110);
        return true;
    }
    function closeCard(pick) {
        if (!card) return;
        const c = card;
        c.pick = pick;
        for (const s of [c.back, c.panel]) if (s.parent) s.parent.removeChild(s);
        if (c.win.parent) c.win.parent.removeChild(c.win);
        c.win.deactivate();
        lib.setPick(c.spec.key, pick);
        card = null;
        Input.clear();
        TouchInput.clear();
    }
    // the dim backdrop fades in with the card
    function updateCard() {
        if (!card) return;
        card.t++;
        card.back.opacity = Math.min(120, card.t * 12);
        const talk = T.call("SpeechBubbles", "talk") || null;   // Borgar and the hero stay beside the card
        if (talk && talk.on) talk.idle = 0;
    }
    const cardInfo = () => (card ? { key: card.spec.key, index: card.win.index(), foot: card.spec.foot, entries: card.spec.entries.map(e => ({ name: e.name, right: e.right, oldRight: e.oldRight || "", sub: e.sub || "", enabled: e.enabled !== false })) } : null);
    // (tests) the card's line i chosen as if by the keys; null: closed with P
    function cardChoose(i) {
        if (!card) return false;
        if (i === null) { closeCard(null); return true; }
        card.win.select(i);
        if (!card.win.isCurrentItemEnabled()) { card.win.processOk(); return false; }
        closeCard(card.win.entry());
        return true;
    }

    // ------------------------------------------------------------------ the dish on the card: a picture of it on the table, its facts
    // the facts of a dish, as the card lists them: [glyph, text, colour]
    function dishFacts(dish) {
        const food = foodOf(dish), out = [];
        if (food.stamina) out.push(["stamina", "Wytrzymałość +" + food.stamina]);
        if (T.call("Needs", "enabled")) {
            if (food.fed) out.push(["food", "Sytość +" + food.fed]);
            if (food.water) out.push(["water", "Nawodnienie +" + food.water]);
        }
        for (const [b, h] of [[food.buff, food.hours], [food.buff2, food.hours2]]) if (b && h > 0 && SV && SV.BUFFS && SV.BUFFS[b]) out.push([b, SV.BUFFS[b].name + " · " + hoursText(h)]);
        out.push(["hosted", "Ugoszczony · " + hoursText(dish.hosted), U().accent]);
        return out;
    }
    function detailIllustration(b, x, y, w, h, paint) {
        panelInto(b, x, y, w, h, { cut: 6, fill: "#15110d", line: "#3b3026", accent: false });
        const ctx = b.context;
        ctx.save();
        ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 2); ctx.clip();
        const g = ctx.createRadialGradient(x + w / 2, y + h * 0.55, 10, x + w / 2, y + h * 0.55, w * 0.62);
        g.addColorStop(0, "rgba(255,190,110,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
        // the table's boards
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 ? "#3a2716" : "#402b18";
            ctx.fillRect(x, y + i * (h / 6), w, Math.ceil(h / 6));
            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(x, y + (i + 1) * (h / 6) - 1, w, 1);
        }
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        paint(ctx);
        ctx.restore();
        dirty(b);
    }
    function detailDish(b, e, x, y, w, h) {
        const dish = e.dish, S0 = U(), ih = 176;
        detailIllustration(b, x, y, w, ih, ctx => {
            const cx = x + w / 2, cy = y + ih / 2 + 10;
            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(cx, cy + 34, 92, 22, 0, 0, Math.PI * 2); ctx.fill();
            if (!dish.drink) {
                ctx.fillStyle = dish.bowl ? "#5a3d24" : "#1e1710"; ctx.beginPath(); ctx.ellipse(cx, cy + 26, 88, 26, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = dish.bowl ? "#8a6038" : "#ece5d3"; ctx.beginPath(); ctx.ellipse(cx, cy + 23, 83, 22, 0, 0, Math.PI * 2); ctx.fill();
                if (!dish.bowl) { ctx.fillStyle = "#d6ccb4"; ctx.beginPath(); ctx.ellipse(cx, cy + 23, 58, 14, 0, 0, Math.PI * 2); ctx.fill(); }
            }
            ctx.imageSmoothingEnabled = false;
            iconInto(b, dish, cx - 56, cy - 70, 112);
            if (dish.hot) {   // steam
                ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3; ctx.lineCap = "round";
                for (const k of [-26, 0, 26]) {
                    ctx.beginPath(); ctx.moveTo(cx + k, cy - 70); ctx.bezierCurveTo(cx + k - 12, cy - 86, cx + k + 12, cy - 98, cx + k, cy - 114); ctx.stroke();
                }
            }
        });
        let ty = y + ih + 12;
        cardText(b, dish.name, x, ty, w - 110, 26, S0.accent, true);
        cardText(b, e.right, x + w - 110, ty + 2, 110, 24, e.enabled === false ? BAD : S0.accent, true, "right");
        ty += 38;
        for (const l of wrapText(b, dish.desc, w, 18).slice(0, 3)) { cardText(b, l, x, ty, w, 18, "#d8dde3"); ty += 25; }
        ty += 8;
        const facts = dishFacts(dish), colW = Math.floor((w - 12) / 2);
        facts.forEach((f, i) => {
            const fx = x + (i % 2) * (colW + 12), fy = ty + Math.floor(i / 2) * 28;
            if (S0.chip) S0.chip(b.context, f[0], fx, fy + 2, 20, f[0] === "hosted" ? S0.accent : undefined);
            cardText(b, f[1], fx + 28, fy, colW - 30, 17, f[2] || S0.text);
        });
        dirty(b);
    }

    // ------------------------------------------------------------------ the room on the card: a little picture of it (drawn in pixels, blown up), what it is, the breakfast
    const ROOM_LOOK = {
        1: { blanket: "#7c5d3c", dark: "#5b4129", light: "#9a7a52" },
        2: { blanket: "#4d6a3b", dark: "#36502a", light: "#6d8c55", window: true },
        3: { blanket: "#3f5a78", dark: "#2c4058", light: "#5b7898", window: true },
        komnata: { blanket: "#7e2632", dark: "#5a1822", light: "#a4404c", trim: "#d4a83a", fire: true, skin: true },
        zloty: { blanket: "#243a78", dark: "#172652", light: "#3d5aa8", trim: "#e8c04a", window: true, canopy: true, gold: true }
    };
    const lookOf = room => ROOM_LOOK[roomKey(room)] || ROOM_LOOK[1 + ((Number(room) - 1) % 3 + 3) % 3] || ROOM_LOOK[1];
    function paintRoomPixels(ctx, room) {   // 96 x 44
        const L = lookOf(room), px = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
        px(L.gold ? "#3a2c24" : "#3a2a1c", 0, 0, 96, 27);
        for (let x = 0; x < 96; x += 9) px(L.gold ? "#46362a" : "#312317", x, 0, 1, 27);
        if (L.gold) for (let x = 4; x < 96; x += 9) px("#6a5430", x, 4, 2, 2);   // (gilded studs on the panelling)
        px("#241910", 0, 26, 96, 1);
        px("#5a3f28", 0, 27, 96, 17);
        for (let y = 30; y < 44; y += 4) px("#4b3421", 0, y, 96, 1);
        if (L.gold) { px("#6e1f2c", 20, 34, 56, 9); px("#8a2c3a", 21, 35, 54, 7); px("#d4a83a", 21, 35, 54, 1); px("#d4a83a", 21, 41, 54, 1); }   // a rug
        if (L.window) {   // a window with the moon
            px("#20150d", 64, 3, 20, 17); px("#22304a", 65, 4, 18, 15); px("#34496b", 66, 5, 7, 6); px("#34496b", 75, 5, 7, 6); px("#2b3c5a", 66, 12, 7, 6); px("#2b3c5a", 75, 12, 7, 6);
            px("#f0ecd0", 77, 6, 3, 3); px("#20150d", 73, 4, 2, 15); px("#20150d", 65, 11, 18, 1);
            if (L.canopy) { px("#6e1f2c", 61, 2, 4, 20); px("#6e1f2c", 83, 2, 4, 20); px("#e8c04a", 60, 1, 28, 2); }   // curtains
        }
        if (L.fire) {   // the fireplace
            px("#4a4540", 2, 8, 20, 19); px("#5e5852", 3, 9, 18, 3); px("#171210", 6, 14, 12, 13);
            px("#ff9a3a", 8, 21, 8, 5); px("#ffd66a", 10, 22, 4, 4); px("#c24a1e", 7, 25, 10, 2);
        }
        const bx = L.fire ? 26 : 16, wood = L.gold ? "#8a6a2c" : "#5e4128", woodD = L.gold ? "#4a3614" : "#3a2716", woodL = L.gold ? "#e8c04a" : "#7c5a38";
        // the bed seen from the side: a tall headboard on the left, a low footboard, the mattress, the pillow, the blanket over the edge
        if (L.canopy) { px(woodD, bx, 1, 3, 10); px(woodD, bx + 44, 1, 3, 22); px("#6e1f2c", bx - 1, 1, 49, 4); px(L.trim, bx - 1, 4, 49, 1); px("#8a2c3a", bx + 1, 5, 3, 16); }   // the canopy
        px(woodD, bx - 1, 10, 6, 31); px(wood, bx, 11, 4, 29); px(woodL, bx, 11, 1, 29);
        if (L.trim) px(L.trim, bx, 13, 4, 1);
        px(woodD, bx + 43, 22, 5, 19); px(wood, bx + 44, 23, 3, 17); px(woodL, bx + 44, 23, 1, 17);
        px(woodD, bx + 4, 30, 40, 5); px(wood, bx + 4, 31, 40, 3);
        px("#ece4d2", bx + 4, 25, 40, 5); px("#d6cbb3", bx + 4, 29, 40, 1);
        px("#1e140c", bx + 5, 20, 12, 6); px("#fbf6ea", bx + 6, 21, 10, 4); px("#ffffff", bx + 7, 21, 4, 1); px("#d8cdb6", bx + 6, 24, 10, 1);
        px(L.dark, bx + 16, 22, 28, 1); px(L.blanket, bx + 16, 23, 28, 9); px(L.light, bx + 17, 23, 26, 1);
        px(L.dark, bx + 16, 31, 28, 2);
        for (let i = 0; i < 4; i++) px(L.dark, bx + 20 + i * 6, 26 + (i % 2) * 2, 2, 1);
        if (L.trim) { px(L.trim, bx + 16, 24, 28, 1); px(L.trim, bx + 16, 30, 28, 1); }
        px(woodD, bx, 40, 3, 3); px(woodD, bx + 44, 40, 3, 3);
        if (L.gold) {   // the breakfast tray on the blanket
            px("#9aa0a8", bx + 24, 19, 16, 4); px("#e2e5ea", bx + 25, 19, 14, 2); px("#fff6c8", bx + 27, 17, 4, 2); px("#c98a3a", bx + 33, 17, 4, 2);
        }
        // the candle on a stool, lit
        const cx = bx + 52;
        px("#4a3322", cx, 29, 9, 2); px("#3a2819", cx + 1, 31, 2, 8); px("#3a2819", cx + 6, 31, 2, 8);
        px(L.gold ? "#e8c04a" : "#efe6cf", cx + 3, 22, 3, 7); px("#fffaf0", cx + 3, 22, 1, 7);
        px("#ffd66a", cx + 3, 18, 3, 4); px("#fff4c0", cx + 4, 19, 1, 2); px("#ff9a3a", cx + 3, 17, 2, 1);
        if (roomKey(room) === "1") { px("#6d6f73", 70, 30, 12, 7); px("#8a8c90", 71, 30, 10, 2); }   // a wash bowl on the floor
        if (L.skin) { px("#8a6a4a", 30, 38, 26, 5); px("#a4845e", 32, 39, 22, 2); }   // the bear's skin
    }
    const roomPixels = room => cached("room" + roomKey(room), () => {
        const c = document.createElement("canvas");
        c.width = 96; c.height = 44;
        paintRoomPixels(c.getContext("2d"), room);
        return c;
    });
    function paintRoomIcon(b, room, x, y, size) {
        const ctx = b.context, L = lookOf(room);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const k = size / 32, r = (c, a, bb, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a * k, y + bb * k, w * k, h * k); };
        if (L.canopy) { r("#6e1f2c", 2, 3, 28, 3); r(L.trim, 2, 5, 28, 1); }
        r("#20150d", 2, 8, 5, 20); r(L.gold ? "#8a6a2c" : "#6b4a2c", 3, 9, 3, 18);
        r("#20150d", 26, 15, 4, 13); r(L.gold ? "#8a6a2c" : "#6b4a2c", 27, 16, 2, 11);
        r("#20150d", 6, 21, 21, 5); r("#ece4d2", 6, 18, 21, 3);
        r("#fbf6ea", 7, 14, 7, 4);
        r(L.blanket, 13, 15, 14, 7); r(L.light, 13, 15, 14, 1); r(L.dark, 13, 21, 14, 1);
        if (L.trim) r(L.trim, 13, 17, 14, 1);
        ctx.restore();
        dirty(b);
    }
    function detailRoom(b, e, x, y, w, h) {
        const r = e.data, S0 = U(), ih = 176;
        detailIllustration(b, x, y, w, ih, ctx => {
            ctx.imageSmoothingEnabled = false;
            const iw = Math.min(384, Math.floor((w - 8) / 96) * 96 || 288), ihh = Math.round(iw * 44 / 96);
            ctx.drawImage(roomPixels(r.room), x + Math.round((w - iw) / 2), y + Math.round((176 - ihh) / 2), iw, ihh);
            const g = ctx.createRadialGradient(x + w / 2 + 70, y + 90, 4, x + w / 2 + 70, y + 90, 120);
            g.addColorStop(0, "rgba(255,190,100,0.28)"); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.fillRect(x, y, w, ih);
        });
        let ty = y + ih + 12;
        const title = isNumbered(r.room) && !namedAsRoom(r) ? "Pokój " + r.room + " · " + r.name : r.name;
        cardText(b, title, x, ty, w - 90, title.length > 26 ? 21 : 25, S0.accent, true);
        cardText(b, e.right, x + w - 110, ty + 2, 110, 24, e.enabled === false ? BAD : S0.accent, true, "right");
        ty += 38;
        for (const l of wrapText(b, r.desc, w, 18).slice(0, 3)) { cardText(b, l, x, ty, w, 18, "#d8dde3"); ty += 25; }
        ty += 8;
        const facts = [["stamina", "Pełny wypoczynek, bezpieczny sen"], ["sated", "Śniadanie: " + giftName(r.room)]];
        if (RESTED[r.room]) facts.push(["rested", "Rano: Wypoczęty · " + hoursText(RESTED[r.room]) + " (odpoczynek +" + pct(RESTED_BONUS) + ")", S0.accent]);
        else facts.push(["warm", "Świeca i ciepła pościel"]);
        facts.push(!canRent(r) ? ["weight", onlyFor(r).replace(/^./, c => c.toUpperCase()), BAD] : ["weight", "Pokój twój do " + CHECKOUT + ":00 rano"]);
        facts.forEach((f, i) => {
            const fy = ty + i * 28;
            if (S0.chip) S0.chip(b.context, f[0], x, fy + 2, 20, f[0] === "rested" ? S0.accent : undefined);
            cardText(b, f[1], x + 28, fy, w - 30, 17, f[2] || S0.text);
        });
        dirty(b);
    }
    const DETAIL = { meal: detailDish, room: detailRoom };

    // breakfast in bed (the Apartament Złoty): the tray stays on the blanket
    let trayBmp = null;
    function trayBitmap() {
        if (trayBmp) return trayBmp;
        const b = new Bitmap(48, 30), ctx = b.context;
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(24, 25, 21, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#7d828a"; ctx.beginPath(); ctx.ellipse(24, 21, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d9dce2"; ctx.beginPath(); ctx.ellipse(24, 20, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4f5f8"; ctx.beginPath(); ctx.ellipse(21, 19, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
        const set = ImageManager.loadSystem("IconSet");
        if (set.isReady()) for (const [i, x] of [[363, 5], [339, 17], [383, 29]]) b.blt(set, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, x, 4, 16, 16);
        ctx.fillStyle = "#fffbe8"; ctx.fillRect(38, 16, 7, 5); ctx.fillStyle = "#b8303a"; ctx.fillRect(40, 18, 2, 2);   // the note with a seal
        dirty(b);
        if (set.isReady()) trayBmp = b;   // (kept once the dishes on it could be drawn)
        return b;
    }

    // ==================================================================
    // The map scene: the coins' layer (under the windows), the dishes' sheet; the card closes with the scene
    // ==================================================================
    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this._tavernCoins = new Sprite();
        this.addChildAt(this._tavernCoins, this.getChildIndex(this._windowLayer));
        ImageManager.loadSystem(DISH_SHEET);
    };
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (card) closeCard(null);
        _Scene_Map_terminate.call(this);
    };

    lib.render = {
        updateFx, updateCard, openCard, cardInfo, cardChoose, coins, dropBitmap,
        isCardOpen: () => !!card,
        litCandles: () => candleList.filter(c => c.spr && c.spr.parent).map(c => c.room),
        mapEnter() { candleList = []; candleMap = 0; },
        reset() { card = null; candleList = []; }
    };
    TL.modules.TavernLife_Render = true;
})();
