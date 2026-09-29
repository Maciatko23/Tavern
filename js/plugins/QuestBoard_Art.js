//=============================================================================
// QuestBoard_Art.js
//=============================================================================
// The quest board's pictures (split out of QuestBoard.js, 2026-09-29): the notices drawn on parchment (TawernaUI's paper), the pins,
// the stamps, the PILNE ribbon, the animals in ink, the card and rules-tag sprites, the big parchment with a notice's details.
// QuestBoard_Scene.js puts them on the board.

/*:
 * @target MZ
 * @plugindesc Rysunki tablicy zleceń (QuestBoard.js): kartki na pergaminie, pinezki i pieczęcie, pieczątki, wstążka PILNE, zwierzęta tuszem, duża kartka ze szczegółami. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
 * @base QuestBoard
 * @orderAfter QuestBoard
 *
 * @help
 * ============================================================================
 * QuestBoard_Art.js - rysunki tablicy zleceń
 * ============================================================================
 * Część QuestBoard.js (wydzielona z niego): jak wyglądają kartki na tablicy
 * i duża kartka ze szczegółami. Sama nic nie robi - rysuje dla
 * QuestBoard_Scene.js. Parametry ma QuestBoard.js.
 *
 * KOLEJNOŚĆ: QuestBoard_Data, QuestBoard, QuestBoard_Art, QuestBoard_Scene.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !T.ui || !T.ui.drawPaper) throw new Error("QuestBoard_Art.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const ui = T.ui;
    const P = T.api("QuestBoard_parts") || T.register("QuestBoard_parts", {});
    if (P.art) return;   // (put into the page twice: kept as it was)
    // QuestBoard.js's pieces (C) and its tables (D), read when drawing (the family's files may come in any order)
    const C = () => P.core, D = () => P.data;
    const data = () => C().data(), Rng = s => C().Rng(s), isReady = n => C().isReady(n), have = q => C().have(q), iconOf = id => C().iconOf(id),
        itemName = id => C().itemName(id), placeName = id => C().placeName(id), dniWord = n => C().dniWord(n), daysText = n => C().daysText(n),
        daysLeft = n => C().daysLeft(n), reqName = q => C().reqName(q), repTier = r => C().repTier(r);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const felixDebt = () => !!T.call("Story", "isOpen");   // (Feliks's pay may go onto grandpa's debt while it is open)
    const dieName = key => { const TD = T.api("TavernDice"), DT = TD && TD.DIE_TYPES && TD.DIE_TYPES[key]; return DT ? DT.name : null; };

    const L = {   // the layout (tools/questboard/make_art.py draws the background with the same numbers)
        board: [18, 76, 790, 678], face: [48, 106, 760, 648], sign: [290, 32, 518, 92],
        detail: [812, 14, 1258, 492], slate: [812, 500, 1258, 678], hints: [18, 690, 1262, 716], tag: [404, 100]
    };
    // the parchment's fonts (TawernaUI loads them with the game's own: QB Hand, QB Hand Bold, QB Caps) and the HUD's font
    const uiFont = () => ($gameSystem ? $gameSystem.mainFontFace() : "sans-serif");
    const F = { hand: ui.inkFont.hand, handB: ui.inkFont.handBold, caps: ui.inkFont.caps, ui: (s, bold) => (bold ? "bold " : "") + s + "px " + uiFont() };
    const INK = Object.assign({}, ui.INK, { purple: "#4b2d7a" });
    const TYPE_INK = { deliver: "#5b3a1a", craft: "#5b3a1a", gather: "#3f5220", hunt: "#6e2a14", bounty: "#8a1c10", story: "#3a2f60" };
    const U = ui.style;

    // ---- small drawing helpers (straight on a 2D context)
    const wrap = (ctx, text, maxW) => ui.inkWrap(ctx, text, maxW, ctx.font);   // (in the font set on ctx)
    // text with letter spacing (the canvas's own letterSpacing is not everywhere); align: left / center / right
    function spaced(ctx, text, x, y, sp, align) {
        const chars = [...text], ws = chars.map(ch => ctx.measureText(ch).width);
        const total = ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, chars.length - 1);
        let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
        ctx.textAlign = "left";
        chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i] + sp; });
        return total;
    }
    function inkText(ctx, text, x, y, font, color, align, alpha) {
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align || "left";
        ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = alpha === undefined ? 0.92 : alpha;
        ctx.fillText(text, x, y);
        ctx.restore();
    }
    // a wobbly hand-drawn line
    function inkLine(ctx, x0, y0, x1, y1, color, width, R) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 1.2;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14));
        for (let i = 0; i <= n; i++) {
            const t = i / n, j = i === 0 || i === n ? 0 : (R.f() - 0.5) * 1.3;
            const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + j;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }
    function flourish(ctx, cx, y, w, color, R) {
        inkLine(ctx, cx - w / 2, y, cx - 7, y, color, 1.1, R);
        inkLine(ctx, cx + 7, y, cx + w / 2, y, color, 1.1, R);
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(cx, y - 3.5); ctx.lineTo(cx + 3.5, y); ctx.lineTo(cx, y + 3.5); ctx.lineTo(cx - 3.5, y); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    function star(ctx, cx, cy, r, fill, stroke, lw) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
            const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.4; ctx.stroke(); }
    }
    function hourglass(ctx, x, y, color) {
        ctx.save();
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y + 14); ctx.lineTo(x + 10, y + 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 1.5, y + 1); ctx.lineTo(x + 8.5, y + 1); ctx.lineTo(x + 5, y + 7); ctx.lineTo(x + 8.5, y + 13); ctx.lineTo(x + 1.5, y + 13); ctx.lineTo(x + 5, y + 7); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 2.8, y + 12.5); ctx.lineTo(x + 7.2, y + 12.5); ctx.lineTo(x + 5, y + 9.5); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    const img = bmp => (bmp ? bmp._canvas || bmp._image : null);
    function drawIcon(ctx, iconSet, index, x, y, size) {
        const src = img(iconSet);
        if (!src || !index) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(src, (index % 16) * 32, Math.floor(index / 16) * 32, 32, 32, Math.round(x), Math.round(y), size, size);
        ctx.restore();
    }

    // ---- assets
    const ASSETS = { back: "QuestBoard_Back", paper: "QuestBoard_Paper", parts: "QuestBoard_Parts" };
    const PART = { nail: [0, 0], brass: [64, 0], red: [128, 0], seal0: [192, 0], seal1: [256, 0], seal2: [320, 0], coin: [384, 0], coinS: [448, 0], mask: [0, 64, 512, 128], twine: [0, 192] };
    // an animal's side frame, trimmed; ink: in brown ink like an engraving (the wanted posters)
    const beastCache = {};
    function beastCanvas(kind, ink) {
        const key = kind + (ink ? "i" : "c");
        if (beastCache[key]) return beastCache[key];
        const sheet = ImageManager.loadCharacter(D().BEASTS[kind].sheet);
        const src = img(sheet);
        if (!src || !sheet.isReady()) return null;
        const pw = Math.floor(sheet.width / 3), ph = Math.floor(sheet.height / 4);
        const c = document.createElement("canvas");
        c.width = pw; c.height = ph;
        const x = c.getContext("2d");
        x.drawImage(src, pw, ph * 2, pw, ph, 0, 0, pw, ph);
        const id = x.getImageData(0, 0, pw, ph), p = id.data;
        let x0 = pw, y0 = ph, x1 = 0, y1 = 0;
        for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) {
            const i = (yy * pw + xx) * 4;
            if (p[i + 3] < 10) continue;
            x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy);
            if (ink) {
                const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, t = Math.pow(l, 0.75);
                p[i] = 42 + (168 - 42) * t; p[i + 1] = 26 + (135 - 26) * t; p[i + 2] = 13 + (90 - 13) * t;
            }
        }
        x.putImageData(id, 0, 0);
        const out = document.createElement("canvas");
        out.width = Math.max(1, x1 - x0 + 1); out.height = Math.max(1, y1 - y0 + 1);
        out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
        return (beastCache[key] = out);
    }
    function drawBeast(ctx, kind, x, y, maxW, maxH, ink) {
        const c = beastCanvas(kind, ink);
        if (!c) return 0;
        const s = Math.min(maxW / c.width, maxH / c.height);
        const k = s >= 1 ? Math.floor(s) : s, w = Math.round(c.width * k), h = Math.round(c.height * k);
        ctx.save();
        ctx.imageSmoothingEnabled = k < 1;
        if (ink) ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(c, Math.round(x + (maxW - w) / 2), Math.round(y + (maxH - h) / 2), w, h);
        ctx.restore();
        return w;
    }
    // the icon of a row: the item's icon, or the animal
    function drawReqIcon(ctx, A, q, x, y, size) {
        if (q.k === "item") drawIcon(ctx, A.iconSet, iconOf(q.id), x, y, size);
        else drawBeast(ctx, q.kind, x - 3, y + 2, size + 6, size - 4, false);
    }

    // ---- paper: TawernaUI's parchment (the deckled outline, one corner torn off on some, the texture, burnt edges), drawn with the
    // notice's own random stream R (the ink's wobble goes on from where the paper left it) and the texture the scene loaded
    const kitRng = R => { const g = () => R.f(); g.f = R.f; g.int = R.int; g.pick = R.pick; g.chance = R.chance; return g; };
    const paperOutline = (w, h, R, torn) => ui.paperOutline(w, h, kitRng(R), torn);
    function drawPaper(ctx, A, w, h, shade, R, torn, opts) {
        const out = {};
        ui.drawPaper(ctx, w, h, { rng: kitRng(R), paper: A.paper, shade, torn, crease: !!(opts && opts.crease), out });
        return out.path;
    }
    function shadowBitmap(w, h, path, pad) {
        const b = new Bitmap(w + pad * 2, h + pad * 2), ctx = b.context;
        ctx.save();
        ctx.filter = "blur(5px)";
        ctx.translate(pad, pad);
        ctx.fillStyle = "rgba(10,5,2,0.8)";
        ctx.fill(path);
        ctx.restore();
        b._baseTexture.update();
        return b;
    }

    // ---- a notice on the board
    const sealed = n => n.type !== "bounty" && String(n.look.pin).startsWith("seal");
    const topOf = n => (sealed(n) ? 8 : 0) + (n.urgent ? 10 : 0);
    function cardHeightFor(n, A, w) {
        const c = document.createElement("canvas").getContext("2d");
        c.font = F.handB(26);
        const lines = Math.min(2, wrap(c, n.title, w - 30).length);
        if (n.type === "bounty") return 250;
        return topOf(n) + 57 + lines * 25 + 2 + 10 + 40 + (n.req.some(q => q.map) ? 8 : 0) + 6 + 28 + 26;
    }
    function drawCard(n, A) {
        const w = n.look.w, h = cardHeightFor(n, A, w), R = Rng(n.look.seed);
        const bmp = new Bitmap(w, h), ctx = bmp.context, G = D().GIVERS[n.giver];
        const path = drawPaper(ctx, A, w, h, n.look.shade, R, n.look.torn, { crease: n.look.crease });
        ctx.save();
        ctx.clip(path);
        ctx.globalCompositeOperation = "multiply";
        const cx = w / 2, ink = TYPE_INK[n.type] || INK.dark;
        if (n.type === "bounty") {
            ctx.font = F.caps(25);
            ctx.fillStyle = "#8a1c10";
            ctx.globalAlpha = 0.9;
            spaced(ctx, "POSZUKIWANY", cx, 40, 1.5, "center");
            ctx.globalAlpha = 1;
            inkLine(ctx, 22, 48, w - 22, 48, "#8a1c10", 1.2, R);
            drawBeast(ctx, n.req[0].kind, 18, 56, w - 36, 74, true);
            inkText(ctx, n.title, cx, 158, F.handB(32), INK.dark, "center");
            inkText(ctx, "martwy, najlepiej", cx, 177, F.hand(18), INK.faded, "center", 0.85);
            flourish(ctx, cx, 190, w - 60, INK.soft, R);
            inkText(ctx, "Nagroda: " + n.gold + " G", cx, 216, F.handB(26), INK.gold, "center");
            inkText(ctx, placeName(n.req[0].map) + " · " + D().BOUNTIES[n.req[0].key].hint, cx, 238, F.hand(17), INK.soft, "center", 0.85);
        } else {
            const top = topOf(n);
            ctx.font = F.caps(12);
            ctx.fillStyle = ink;
            ctx.globalAlpha = 0.85;
            const label = n.giver === "feliks" ? "DWÓR ZALESKICH" : D().TYPE_LABEL[n.type];
            const lw = spaced(ctx, label, cx, 30 + top, 2.2, "center");
            ctx.globalAlpha = 1;
            inkLine(ctx, 16, 25 + top, cx - lw / 2 - 7, 25 + top, ink, 1, R);
            inkLine(ctx, cx + lw / 2 + 7, 25 + top, w - 16, 25 + top, ink, 1, R);
            ctx.font = F.handB(26);
            const lines = wrap(ctx, n.title, w - 30).slice(0, 2);
            let y = 57 + top;
            for (const line of lines) { inkText(ctx, line, cx, y, F.handB(26), INK.dark, "center"); y += 25; }
            y += 2;
            flourish(ctx, cx, y, w - 70, INK.soft, R);
            y += 10;
            // what is wanted: icons with counts
            const cells = n.req.map(q => ({ q, label: "×" + q.n }));
            ctx.font = F.handB(22);
            const cellW = cells.map(c => 36 + 4 + ctx.measureText(c.label).width);
            const gap = 14, total = cellW.reduce((a, b) => a + b, 0) + gap * (cells.length - 1);
            let x = cx - total / 2;
            ctx.globalCompositeOperation = "source-over";
            cells.forEach((c, i) => {
                drawReqIcon(ctx, A, c.q, x, y, 32);
                x += 36;
                ctx.globalCompositeOperation = "multiply";
                inkText(ctx, c.label, x + 2, y + 25, F.handB(22), INK.dark, "left");
                ctx.globalCompositeOperation = "source-over";
                if (c.q.map) inkText(ctx, placeName(c.q.map), x - 18, y + 42, F.hand(14), INK.soft, "center", 0.8);
                x += cellW[i] - 36 + gap;
            });
            ctx.globalCompositeOperation = "multiply";
            y += 40 + (n.req.some(q => q.map) ? 8 : 0);
            inkLine(ctx, 18, y, w - 18, y, INK.faded, 0.8, R);
            y += 6;
            // the pay and the term
            const parts = img(A.parts);
            ctx.globalCompositeOperation = "source-over";
            if (parts) ctx.drawImage(parts, PART.coinS[0] + 23, PART.coinS[1] + 23, 18, 18, 16, y + 4, 18, 18);
            ctx.globalCompositeOperation = "multiply";
            inkText(ctx, n.gold + " G", 38, y + 20, F.handB(23), INK.gold, "left");
            hourglass(ctx, w - 70, y + 6, INK.soft);
            inkText(ctx, n.days + " " + dniWord(n.days), w - 56, y + 20, F.handB(20), INK.soft, "left");
            y += 28;
            inkText(ctx, "— " + G.short, w - 16, y + 10, F.hand(17), INK.faded, "right", 0.9);
        }
        ctx.restore();
        if (n.urgent) drawRibbon(ctx, w);
        bmp._baseTexture.update();
        return { bitmap: bmp, w, h, path };
    }
    // PILNE: a red ribbon across the top right corner
    function drawRibbon(ctx, w) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, w, 80); ctx.clip();   // (its ends fold behind the paper)
        ctx.translate(w - 25, 25);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(-42, -7, 84, 20);
        const g = ctx.createLinearGradient(0, -10, 0, 10);
        g.addColorStop(0, "#c8392a"); g.addColorStop(0.5, "#a82618"); g.addColorStop(1, "#7c1a10");
        ctx.fillStyle = g;
        ctx.fillRect(-42, -10, 84, 19);
        ctx.fillStyle = "rgba(255,210,190,0.35)";
        ctx.fillRect(-42, -10, 84, 1);
        ctx.fillStyle = "rgba(60,8,4,0.6)";
        ctx.fillRect(-42, 8, 84, 1);
        ctx.font = F.caps(13);
        ctx.fillStyle = "#fff1dc";
        spaced(ctx, "PILNE", 0, 4, 2.2, "center");
        ctx.restore();
    }
    // a rubber stamp: PRZYJĘTE (blue), WYKONANE (green), PO TERMINIE (red); eroded by the ink mask
    function stampBitmap(kind, A) {
        const S = { active: ["PRZYJĘTE", "#27458f"], done: ["WYKONANE", "#2e6b2c"], failed: ["PO TERMINIE", "#9b2418"] }[kind];
        if (!S) return null;
        const probe = document.createElement("canvas").getContext("2d");
        probe.font = F.caps(25);
        const tw = [...S[0]].reduce((a, ch) => a + probe.measureText(ch).width, 0) + 2.5 * (S[0].length - 1);
        const w = Math.ceil(tw + 34), h = 46, b = new Bitmap(w, h), ctx = b.context;
        ctx.strokeStyle = S[1];
        ctx.fillStyle = S[1];
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(3, 3, w - 6, h - 6, 6) : ctx.rect(3, 3, w - 6, h - 6); ctx.stroke();
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(8, 8, w - 16, h - 16, 4) : ctx.rect(8, 8, w - 16, h - 16); ctx.stroke();
        ctx.font = F.caps(25);
        spaced(ctx, S[0], w / 2, h / 2 + 9, 2.5, "center");
        const m = img(A.parts);
        if (m) {
            ctx.globalCompositeOperation = "destination-in";
            const ox = Math.floor(Math.random() * Math.max(1, 512 - w)), oy = Math.floor(Math.random() * Math.max(1, 128 - h));
            ctx.drawImage(m, PART.mask[0] + ox, PART.mask[1] + oy, w, h, 0, 0, w, h);
        }
        b._baseTexture.update();
        return b;
    }
    function partBitmap(A, key, size) {
        const [px, py] = PART[key], seal = key.startsWith("seal"), s = seal ? 48 : key === "coin" ? 28 : 22;
        const off = seal ? 8 : key === "coin" ? 18 : 21, b = new Bitmap(size, size);
        const src = img(A.parts);
        if (src) { b.context.imageSmoothingEnabled = true; b.context.drawImage(src, px + off, py + off, s, s, 0, 0, size, size); }
        b._baseTexture.update();
        return b;
    }

    // ------------------------------------------------------------------
    // A card sprite: a container at the card's centre (rotated), with its shadow, the paper, the pin and the stamp
    // ------------------------------------------------------------------
    function Sprite_QBCard() {
        this.initialize(...arguments);
    }
    Sprite_QBCard.prototype = Object.create(Sprite.prototype);
    Sprite_QBCard.prototype.constructor = Sprite_QBCard;
    Sprite_QBCard.prototype.initialize = function(n, A) {
        Sprite.prototype.initialize.call(this);
        this.n = n;
        this.A = A;
        const c = drawCard(n, A);
        this.w = c.w;
        this.h = c.h;
        const pad = 16;
        this._shadow = new Sprite(shadowBitmap(c.w, c.h, c.path, pad));
        this._shadow.anchor.set(0.5, 0.5);
        this._glow = new Sprite(glowBitmap(c.w, c.h, c.path));
        this._glow.anchor.set(0.5, 0.5);
        this._glow.visible = false;
        this._paper = new Sprite(c.bitmap);
        this._paper.anchor.set(0.5, 0.5);
        this.addChild(this._glow, this._shadow, this._paper);
        const pin = n.look.pin, seal = pin.startsWith("seal"), size = seal ? 40 : 16;
        this._pin = new Sprite(partBitmap(A, pin, size));
        this._pin.anchor.set(0.5, 0.5);
        this._pin.x = n.type === "bounty" ? 0 : (Rng(n.look.seed + 1).f() - 0.5) * 16;
        this._pin.y = -c.h / 2 + (seal ? 5 : 9);
        if (n.type === "bounty") {   // two red tacks at the top corners
            this._pin.bitmap = partBitmap(A, "red", 16);
            this._pin.x = -c.w / 2 + 14;
            this._pin2 = new Sprite(partBitmap(A, "red", 16));
            this._pin2.anchor.set(0.5, 0.5);
            this._pin2.x = c.w / 2 - 14;
            this._pin2.y = this._pin.y;
            this.addChild(this._pin2);
        }
        this.addChild(this._pin);
        const SLOTS = C().SLOTS, [sx, sy] = SLOTS[n.look.slot] || SLOTS[0];
        this.baseX = sx + n.look.dx;
        this.baseY = sy + n.look.dy;
        this.baseRot = n.look.rot * Math.PI / 180;
        this.lift = 0;
        this.target = 0;
        this.enter = 0;          // the flutter in when the board opens
        this.shake = 0;
        this._stampKind = "";
        this.refreshStamp(false);
        this.applyTransform();
    };
    function glowBitmap(w, h, path) {
        const pad = 22, b = new Bitmap(w + pad * 2, h + pad * 2), ctx = b.context;
        ctx.save();
        ctx.filter = "blur(9px)";
        ctx.translate(pad, pad);
        ctx.strokeStyle = "rgba(125,220,106,0.95)";
        ctx.lineWidth = 12;
        ctx.stroke(path);
        ctx.restore();
        b._baseTexture.update();
        return b;
    }
    Sprite_QBCard.prototype.refreshStamp = function(animate) {
        const kind = this.n.state === "active" || this.n.state === "done" || this.n.state === "failed" ? this.n.state : "";
        if (kind === this._stampKind) return;
        this._stampKind = kind;
        if (this._stamp) { this.removeChild(this._stamp); this._stamp = null; }
        if (!kind) return;
        this._stamp = new Sprite(stampBitmap(kind, this.A));
        this._stamp.anchor.set(0.5, 0.5);
        this._stamp.rotation = (this.n.look.stampRot || -10) * Math.PI / 180;
        this._stamp.x = 4;
        this._stamp.y = this.n.type === "bounty" ? 30 : this.h * 0.1;
        this._stamp.opacity = 200;
        this._stampT = animate ? 0 : 99;
        this.addChild(this._stamp);
    };
    Sprite_QBCard.prototype.applyTransform = function() {
        const k = this.lift, e = this.enter;
        const ease = 1 - Math.pow(1 - e, 3);
        const sh = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
        this.x = this.baseX + sh;
        this.y = this.baseY - 9 * k - (1 - ease) * 40 + (this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0);
        this.rotation = this.baseRot * (1 - k) + (1 - ease) * 0.25 * (this.n.look.rot >= 0 ? 1 : -1);
        this.scale.set(1 + 0.07 * k, 1 + 0.07 * k);
        this.alpha = Math.min(1, e * 1.6);
        this._shadow.x = 3 + 8 * k;
        this._shadow.y = 5 + 12 * k;
        this._shadow.alpha = 0.42 + 0.14 * k;
        this._shadow.scale.set(1 + 0.03 * k, 1 + 0.03 * k);
    };
    Sprite_QBCard.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.lift += (this.target - this.lift) * 0.22;
        if (this.enter < 1) this.enter = Math.min(1, this.enter + 0.06);
        if (this.shake > 0) this.shake = Math.max(0, this.shake - 0.6);
        const ready = this.n.state === "active" && isReady(this.n);
        this._glow.visible = ready;
        if (ready) this._glow.alpha = 0.45 + 0.3 * Math.sin(Graphics.frameCount / 14);
        if (this._stamp && this._stampT < 14) {   // it comes down hard and settles
            this._stampT++;
            const t = this._stampT / 14, s = t < 0.6 ? 2 - t / 0.6 : 1 + Math.sin((t - 0.6) / 0.4 * Math.PI) * 0.06;
            this._stamp.scale.set(s * 0.9, s * 0.9);
            this._stamp.opacity = Math.min(200, 60 + t * 260);
        } else if (this._stamp) this._stamp.scale.set(0.9, 0.9);
        this.applyTransform();
    };
    // is (mx, my) on this card? (in its own rotated frame)
    Sprite_QBCard.prototype.hits = function(mx, my) {
        const dx = mx - this.x, dy = my - this.y, c = Math.cos(-this.rotation), s = Math.sin(-this.rotation);
        const lx = (dx * c - dy * s) / this.scale.x, ly = (dx * s + dy * c) / this.scale.y;
        return Math.abs(lx) <= this.w / 2 && Math.abs(ly) <= this.h / 2;
    };

    // the rules tag, hanging on twine under the sign
    function Sprite_QBTag() {
        this.initialize(...arguments);
    }
    Sprite_QBTag.prototype = Object.create(Sprite.prototype);
    Sprite_QBTag.prototype.constructor = Sprite_QBTag;
    Sprite_QBTag.prototype.initialize = function(A) {
        Sprite.prototype.initialize.call(this);
        this.w = 118; this.h = 42;
        const R = Rng(4242), b = new Bitmap(this.w, this.h), ctx = b.context;
        const path = drawPaper(ctx, A, this.w, this.h, 0, R, 0, {});
        ctx.save(); ctx.clip(path); ctx.globalCompositeOperation = "multiply";
        ctx.font = F.caps(13); ctx.fillStyle = INK.dark; ctx.globalAlpha = 0.85;
        spaced(ctx, "ZASADY", this.w / 2, 19, 2.5, "center");
        inkText(ctx, "tablicy", this.w / 2, 36, F.hand(18), INK.soft, "center");
        ctx.restore();
        b._baseTexture.update();
        this._shadow = new Sprite(shadowBitmap(this.w, this.h, path, 16));
        this._shadow.anchor.set(0.5, 0);
        this._shadow.y = -16 + 4; this._shadow.x = 3;
        this._shadow.alpha = 0.4;
        this._twine = new Sprite(new Bitmap(20, 20));
        const tctx = this._twine.bitmap.context;
        tctx.strokeStyle = "#8a6a3e"; tctx.lineWidth = 1.5;
        tctx.beginPath(); tctx.moveTo(10, 0); tctx.lineTo(4, 16); tctx.moveTo(10, 0); tctx.lineTo(16, 16); tctx.stroke();
        this._twine.bitmap._baseTexture.update();
        this._twine.anchor.set(0.5, 1);
        this._twine.y = 2;
        this._paper = new Sprite(b);
        this._paper.anchor.set(0.5, 0);
        this.addChild(this._shadow, this._twine, this._paper);
        this.x = L.tag[0];
        this.y = L.tag[1] + 6;
        this.baseY = this.y;
        this.lift = 0; this.target = 0; this.swing = 0; this.swingV = 0;
    };
    Sprite_QBTag.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.lift += (this.target - this.lift) * 0.22;
        this.swingV += -this.swing * 0.02 - this.swingV * 0.04;
        this.swing += this.swingV;
        this.rotation = this.swing;
        this.scale.set(1 + 0.08 * this.lift, 1 + 0.08 * this.lift);
        this._shadow.y = -12 + 8 * this.lift;
    };
    Sprite_QBTag.prototype.nudge = function() { this.swingV += 0.012; };
    Sprite_QBTag.prototype.hits = function(mx, my) {
        return mx >= this.x - this.w / 2 && mx <= this.x + this.w / 2 && my >= this.y && my <= this.y + this.h;
    };

    // the big parchment on the right: everything about the focused notice (n null: the rules). BUDGET: where the text ends
    // (px from its top) - the buttons lie below
    const BUDGET = 400;
    function drawDetail(bmp, A, n, scene) {
        bmp.clear();
        const W = bmp.width, H = L.detail[3] - L.detail[1], ctx = bmp.context;
        const seed = n ? n.look.seed + 17 : 9001, R = Rng(seed);
        // its shadow on the wall
        const out = paperOutline(W - 14, H - 14, Rng(seed), 0);
        ctx.save();
        ctx.filter = "blur(8px)";
        ctx.translate(12, 14);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fill(out.path);
        ctx.restore();
        ctx.save();
        const path = drawPaper(ctx, A, W - 14, H - 14, n ? n.look.shade : 0, R, 0, {});
        ctx.clip(path);
        ctx.globalCompositeOperation = "multiply";
        const x0 = 26, x1 = W - 14 - 26, cw = x1 - x0, cx = x0 + cw / 2;
        let y = 40;
        if (!n) {
            ctx.font = F.caps(14); ctx.fillStyle = INK.soft; ctx.globalAlpha = 0.85;
            spaced(ctx, "ZASADY TABLICY", cx, y, 3, "center");
            ctx.globalAlpha = 1;
            y += 38;
            inkText(ctx, "Jak to działa", cx, y, F.handB(38), INK.dark, "center");
            y += 16;
            flourish(ctx, cx, y, 200, INK.soft, R);
            y += 30;
            const rules = [
                "Zerwij kartkę - zlecenie jest twoje. Najwyżej " + C().MAX_ACTIVE + " naraz.",
                "Każde ma termin w dniach od przyjęcia. Nie zdążysz - wieś się dowie, a sława spadnie.",
                "Gotowe oddajesz tutaj: towar z plecaka, zapłata od ręki.",
                "Co " + C().REFRESH_DAYS + " dni wieszam nowe kartki. Im większa sława, tym lepiej płacą."
            ];
            ctx.font = F.hand(21);
            rules.forEach((r, i) => {
                const lines = wrap(ctx, r, cw - 30);
                inkText(ctx, (i + 1) + ".", x0 + 4, y, F.handB(21), INK.gold, "left");
                lines.forEach(l => { inkText(ctx, l, x0 + 28, y, F.hand(21), INK.dark, "left"); y += 22; });
                y += 4;
            });
            inkText(ctx, "— Borgar", x1, y, F.hand(20), INK.faded, "right");
            y += 12;
            inkLine(ctx, x0, y, x1, y, INK.faded, 0.9, R);
            y += 26;
            const TIERS = C().TIERS, d = data(), t = repTier(d.rep), nextT = TIERS[t + 1], st = d.stats;
            inkText(ctx, "Twoja sława: " + TIERS[t].name + " (" + d.rep + "/100)", x0, y, F.handB(21), INK.dark, "left");
            y += 22;
            ctx.font = F.hand(18);
            const more = (nextT ? "Następny próg: " + nextT.name + " - " + nextT.rep + " sławy, od dnia " + nextT.day + "; zlecenia do " + nextT.gold[1] + " G. "
                : "Wyżej już się nie da - cała okolica o tobie mówi. ") +
                "Wykonane: " + st.done + ", po terminie: " + st.failed + ", porzucone: " + st.abandoned + ", zarobione: " + st.gold + " G.";
            for (const l of wrap(ctx, more, cw).slice(0, 3)) { inkText(ctx, l, x0, y, F.hand(18), INK.soft, "left"); y += 20; }
            ctx.restore();
            bmp._baseTexture.update();
            return;
        }
        const G = D().GIVERS[n.giver];
        // the head: the kind of work, and where it stands
        ctx.font = F.caps(14);
        ctx.fillStyle = n.urgent ? "#8e2417" : TYPE_INK[n.type];
        ctx.globalAlpha = 0.88;
        spaced(ctx, (n.urgent ? "PILNE · " : "") + (n.giver === "feliks" ? "DWÓR ZALESKICH" : D().TYPE_LABEL[n.type]), x0, y, 2.4, "left");
        ctx.globalAlpha = 1;
        const st = n.state === "open" ? "na tablicy" : n.state === "active" ? (isReady(n) ? "gotowe do oddania" : "przyjęte · " + daysText(n)) : n.state === "done" ? "wykonane w dniu " + n.doneDay : "po terminie";
        inkText(ctx, st, x1, y, F.handB(19), n.state === "active" && isReady(n) ? INK.green : n.state === "failed" ? INK.red : INK.soft, "right");
        y += 44;
        // the title
        ctx.font = F.handB(38);
        const tl = wrap(ctx, n.title, cw).slice(0, 2);
        tl.forEach(l => { inkText(ctx, l, x0, y, F.handB(38), n.type === "bounty" ? "#6e1a0e" : INK.dark, "left"); y += 34; });
        y -= 6;
        inkText(ctx, "od: " + G.name + ", " + G.role, x0, y + 16, F.handB(20), INK.soft, "left");
        // what the lower part needs (the list, the pay, the term), so the text above takes only what is left
        const extras = !!n.gift || !!(n.die && T.api("TavernDice")), felix = n.giver === "feliks" && felixDebt() && n.state !== "done";
        const lower = 98 + n.req.length * 33 + (n.type === "bounty" ? 20 : 0) + (extras ? 24 : 0) + (felix ? 24 : 0);
        ctx.font = F.hand(22);
        const all = wrap(ctx, n.text, cw);
        const fit = quote => Math.floor((BUDGET - lower - (y + (quote ? 36 + 12 + 26 : 28 + 26)) + 23) / 23);
        const quote = fit(true) >= Math.min(3, all.length), room = clamp(fit(quote), 1, 5);   // (measured before y moves on)
        if (quote) {
            y += 36;
            inkText(ctx, "„" + G.line + "”", x0, y, F.hand(18), INK.faded, "left", 0.85);
            y += 12;
        } else y += 28;
        inkLine(ctx, x0, y, x1, y, INK.faded, 0.9, R);
        y += 26;
        // the text
        const lines = all.slice(0, room);
        if (all.length > room) lines[room - 1] = lines[room - 1].replace(/\s*\S*$/, "") + "…";
        lines.forEach(l => { inkText(ctx, l, x0, y, F.hand(22), INK.dark, "left"); y += 23; });
        y += 10;
        // what is wanted, with what the hero has
        ctx.font = F.caps(13); ctx.fillStyle = INK.soft; ctx.globalAlpha = 0.85;
        spaced(ctx, "POTRZEBA", x0, y, 2.2, "left");
        ctx.globalAlpha = 1;
        y += 8;
        for (const q of n.req) {
            const got = n.state === "done" ? q.n : Math.min(have(q), q.n), done = got >= q.n;
            const count = n.state === "open" && q.k !== "item" ? "0 / " + q.n : (n.state === "open" ? have(q) : got) + " / " + q.n;
            ctx.globalCompositeOperation = "source-over";
            drawReqIcon(ctx, A, q, x0, y + 3, 30);
            ctx.globalCompositeOperation = "multiply";
            const name = reqName(q) + (q.map ? " (" + placeName(q.map) + ")" : "");
            inkText(ctx, name, x0 + 40, y + 25, F.handB(22), INK.dark, "left");
            inkText(ctx, count, x1, y + 25, F.handB(24), n.state === "done" || done || (n.state === "open" && q.k === "item" && have(q) >= q.n) ? INK.green : INK.red, "right");
            y += 33;
        }
        if (n.req.some(q => q.k === "bounty")) {
            const q = n.req.find(r => r.k === "bounty"), B = D().BOUNTIES[q.key];
            inkText(ctx, "Większy i silniejszy od innych, grasuje " + B.hint + ".", x0, y + 12, F.hand(18), INK.soft, "left", 0.9);
            y += 20;
        }
        y += 18;
        // the pay
        ctx.font = F.caps(13); ctx.fillStyle = INK.soft; ctx.globalAlpha = 0.85;
        spaced(ctx, "NAGRODA", x0, y, 2.2, "left");
        ctx.globalAlpha = 1;
        y += 10;
        let x = x0;
        const parts = img(A.parts);
        ctx.globalCompositeOperation = "source-over";
        if (parts) ctx.drawImage(parts, PART.coin[0] + 18, PART.coin[1] + 18, 28, 28, x, y, 24, 24);
        ctx.globalCompositeOperation = "multiply";
        inkText(ctx, n.gold + " G", x + 30, y + 21, F.handB(26), INK.gold, "left");
        ctx.font = F.handB(26);
        x += 30 + ctx.measureText(n.gold + " G").width + 20;
        ctx.globalCompositeOperation = "source-over";
        star(ctx, x + 9, y + 12, 9, "#9a7cd0", "#4b2d7a", 1.2);
        ctx.globalCompositeOperation = "multiply";
        inkText(ctx, n.xp + " dośw.", x + 22, y + 20, F.handB(22), INK.purple, "left");
        ctx.font = F.handB(22);
        x += 22 + ctx.measureText(n.xp + " dośw.").width + 18;
        ctx.globalCompositeOperation = "source-over";
        star(ctx, x + 9, y + 12, 9, "#ffd23f", "#7a5a10", 1.2);
        ctx.globalCompositeOperation = "multiply";
        inkText(ctx, "sława +" + n.rep, x + 22, y + 20, F.handB(22), INK.gold, "left");
        y += 30;
        const extra = [];
        if (n.gift) extra.push(["gift", n.gift]);
        if (n.die && T.api("TavernDice")) extra.push(["die", n.die]);
        if (extra.length) {
            let ex = x0;
            for (const [k, v] of extra) {
                if (k === "gift") {
                    ctx.globalCompositeOperation = "source-over";
                    drawIcon(ctx, A.iconSet, iconOf(v[0]), ex, y - 2, 24);
                    ctx.globalCompositeOperation = "multiply";
                    const t = "i " + itemName(v[0]) + " ×" + v[1];
                    inkText(ctx, t, ex + 28, y + 16, F.hand(20), INK.dark, "left");
                    ctx.font = F.hand(20);
                    ex += 28 + ctx.measureText(t).width + 16;
                } else {
                    inkText(ctx, "i " + (dieName(v) || "kość do gry"), ex, y + 16, F.hand(20), INK.dark, "left");
                }
            }
            y += 24;
        }
        y += 4;
        // the term
        hourglass(ctx, x0, y, INK.soft);
        const termY = y;
        const term = n.state === "open" ? n.days + " " + dniWord(n.days) + " od przyjęcia" : n.state === "active" ? "do dnia " + n.due + " · " + daysText(n) : n.state === "done" ? "oddane w dniu " + n.doneDay : "termin minął w dniu " + n.due;
        inkText(ctx, term, x0 + 18, y + 13, F.handB(20), n.state === "active" && daysLeft(n) <= 1 ? INK.red : INK.soft, "left");
        y += 18;
        if (felix) {
            inkText(ctx, "Feliks może zaliczyć zapłatę od razu na poczet długu dziadka.", x0, y + 18, F.hand(18), INK.faded, "left", 0.9);
            y += 24;
        }
        // the signature, bottom right, above the buttons (a wax seal beside it for those who seal their notices)
        const sy = Math.max(y + 30, BUDGET - 8);
        if (sy > BUDGET) inkText(ctx, "— " + G.short, x1, termY + 14, F.handB(21), INK.soft, "right", 0.9);
        else {
            const sig = "— " + G.name;
            ctx.save();
            ctx.translate(x1, sy);
            ctx.rotate(-0.04);
            ctx.font = F.handB(28);
            const sw = ctx.measureText(sig).width;
            ctx.fillStyle = INK.soft;
            ctx.globalAlpha = 0.9;
            ctx.textAlign = "right";
            ctx.fillText(sig, 0, 0);
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = INK.soft;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(-sw + 10, 7); ctx.quadraticCurveTo(-sw / 2, 12, 4, 5); ctx.stroke();
            ctx.restore();
            if (String(G.pin).startsWith("seal")) {
                const parts = img(A.parts), [px, py] = PART[G.pin];
                ctx.globalCompositeOperation = "source-over";
                ctx.save();
                ctx.translate(x0 + 24, sy - 8);
                ctx.rotate(-0.18);
                if (parts) ctx.drawImage(parts, px + 8, py + 8, 48, 48, -24, -24, 48, 48);
                ctx.restore();
            }
        }
        ctx.restore();
        bmp._baseTexture.update();
        void scene;
    }

    P.art = { L, F, INK, TYPE_INK, U, PART, ASSETS, wrap, spaced, inkText, inkLine, flourish, star, hourglass, img, drawIcon, drawBeast, drawReqIcon,
        drawPaper, paperOutline, shadowBitmap, Sprite_QBCard, Sprite_QBTag, drawDetail };
})();
