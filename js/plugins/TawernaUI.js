//=============================================================================
// TawernaUI.js
//=============================================================================
// Load order: after UITheme.js (window.UIStyle - read when drawing, so it may also come later) and TawernaCore.js; before the plugins
// that build on it (the mini-games). The pieces are the best of TavernDice.js (key caps, buttons, the banner, the coins, the busts),
// TavernLife.js (the blurred backdrop, the rules card, the pause) and QuestBoard.js (the parchment), made general; those plugins keep
// their own copies until stage 3 moves them here (docs/ARCHITEKTURA.md).

/*:
 * @target MZ
 * @plugindesc Zestaw interfejsu (Tawerna.ui): baza mini-gier Scene_MiniGame (O/P/strzałki/WASD/mysz, pauza z pomocą, pytanie przed wyjściem, turbo i ziarno dla testów, wynik onEnd) i elementy w stylu HUD: panel, przyciski, lista z ikonami, pergamin, podpowiedzi klawiszy, pasek, baner, lecące monety. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter UITheme
 *
 * @help
 * ============================================================================
 * TawernaUI.js - zestaw interfejsu (Tawerna.ui)
 * ============================================================================
 * KOLEJNOŚĆ: pod TawernaCore.js i pod UITheme.js, nad wtyczkami mini-gier.
 *
 * Scene_MiniGame - baza scen mini-gier. Nowa gra to podklasa z metodami:
 *   createGame()  - budowa (this.stage, this.fx, this.hud są gotowe)
 *   begin()       - start (np. karta z zasadami: this.showCard({...}))
 *   tick()        - jeden krok logiki (this.keys / this.trig / this.rep /
 *                   this.mouse; w teście turbo kilka kroków na klatkę)
 *   frame()       - rysowanie raz na klatkę
 *   state()       - co widzą testy
 *   helpLines()   - pomoc na karcie pauzy; quitResult() - wynik przy wyjściu
 * Otwieranie: Tawerna.ui.open(Scene_Klasa, { onEnd(wynik), seed, turbo })
 * Koniec: this.end(wynik) - wynik trafia do onEnd już na mapie.
 * P w grze = pauza (Gramy dalej / Wyjdź z gry); O = wybór; strzałki/WASD.
 *
 * Elementy (Tawerna.ui): Panel, ButtonRow, IconList, ParchmentCard,
 * KeyHints, TitleBar, Meter, Banner ("Pudło!" / "Wygrana!"), CoinFly
 * (+ coinBurst), Bust, Bubble; rysowanie na bitmapie: text, wrap, keyCap,
 * keyHints, button, brackets, drawCard, drawChoiceCard.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("TawernaUI.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (T.ui && T.ui.Scene_MiniGame) return;   // (put into the page twice)
    const ui = T.ui = Object.assign(T.ui || {}, { running: null, lastResult: null });
    const num = T.util.num;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const easeInOut = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    const easeBack = t => { t = clamp(t, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    ui.ease = { out: easeOut, inOut: easeInOut, back: easeBack };

    // ------------------------------------------------------------------
    // The style: UITheme.js's window.UIStyle (black + bright yellow), with a plain fallback
    // ------------------------------------------------------------------
    const FALLBACK = {
        fill: "rgba(11,12,15,0.9)", solid: "#0b0c0f", line: "#3a3e46", accent: "#ffd23f", accentDim: "#c9a12a",
        text: "#eceef0", muted: "#8a9099", trough: "#16181c", outline: "rgba(0,0,0,0.9)",
        panel(ctx, x, y, w, h, o) {
            o = o || {};
            ctx.save(); ctx.fillStyle = o.fill || FALLBACK.fill; ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = o.line || FALLBACK.line; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.restore();
        },
        bar(ctx, x, y, w, h, r, c) {
            ctx.fillStyle = FALLBACK.line; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
            ctx.fillStyle = FALLBACK.trough; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = c; ctx.fillRect(x, y, Math.round(w * clamp(r, 0, 1)), h);
        }
    };
    const ST = () => window.UIStyle || FALLBACK;
    ui.style = ST;
    ui.COLORS = { good: "#8ee08a", bad: "#ff7b6b", warn: "#ffb347", gold: "#ffe27a" };
    ui.COIN_ICON = 313;

    // ------------------------------------------------------------------
    // Drawing on a Bitmap (after raw canvas drawing the texture must be told: dirty)
    // ------------------------------------------------------------------
    function dirty(b) { if (b && b._baseTexture) b._baseTexture.update(); }
    function panel(b, x, y, w, h, o) { ST().panel(b.context, x, y, w, h, o); dirty(b); }
    function bar(b, x, y, w, h, r, c) { ST().bar(b.context, x, y, w, h, r, c); dirty(b); }
    function font(b, size, colour, bold, outline, face) {
        b.fontSize = size;
        b.textColor = colour || ST().text;
        b.fontBold = !!bold;
        b.outlineWidth = outline || 1;
        b.outlineColor = outline ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0)";
        if (face) b.fontFace = face; else if (window.$gameSystem) b.fontFace = $gameSystem.mainFontFace();
    }
    // o: { size (20), color, bold, outline, alpha, lh, align, face }
    function text(b, s, x, y, w, o) {
        o = o || {};
        const size = o.size || 20;
        font(b, size, o.color, o.bold, o.outline, o.face);
        if (o.alpha !== undefined) b.paintOpacity = Math.round(255 * o.alpha);
        b.drawText(String(s), Math.round(x), Math.round(y), Math.round(w), o.lh || Math.round(size * 1.35), o.align || "left");
        b.paintOpacity = 255;
        b.fontBold = false;
    }
    function measure(b, s, size, bold, face) { font(b, size, null, bold, 0, face); const w = b.measureTextWidth(String(s)); b.fontBold = false; return w; }
    function wrap(b, s, w, size, bold, face) {
        const out = [];
        for (const para of String(s).split("\n")) {
            let cur = "";
            for (const word of para.split(" ")) {
                const t = cur ? cur + " " + word : word;
                if (cur && measure(b, t, size, bold, face) > w) { out.push(cur); cur = word; } else cur = t;
            }
            out.push(cur);
        }
        return out;
    }
    function icon(b, index, x, y, size) {
        if (!(index > 0)) return false;
        const set = ImageManager.loadSystem("IconSet"), pw = ImageManager.iconWidth, ph = ImageManager.iconHeight;
        if (!set.isReady()) return false;
        b.context.imageSmoothingEnabled = false;
        b.blt(set, (index % 16) * pw, Math.floor(index / 16) * ph, pw, ph, Math.round(x), Math.round(y), size || pw, size || ph);
        b.context.imageSmoothingEnabled = true;
        return true;
    }
    // an arrow, dir "left" | "up" | "right" | "down", centred on (cx, cy), s its size
    function arrow(ctx, dir, cx, cy, s, colour) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir] || 0);
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 0); ctx.lineTo(0, -s * 0.45); ctx.lineTo(0, -s * 0.17); ctx.lineTo(-s * 0.5, -s * 0.17);
        ctx.lineTo(-s * 0.5, s * 0.17); ctx.lineTo(0, s * 0.17); ctx.lineTo(0, s * 0.45); ctx.closePath();
        ctx.fillStyle = colour; ctx.fill();
        ctx.restore();
    }
    const ARROWS = ["left", "up", "right", "down"];
    const capWidth = (b, label, h) => (ARROWS.includes(label) ? h : Math.max(h, Math.ceil(measure(b, label, Math.round(h * 0.6), true)) + 14));
    // a key cap: "O", "P", "Q/E" or an arrow's name; returns its width
    function keyCap(b, label, x, y, h, colour) {
        h = h || 26;
        const w = capWidth(b, label, h), c = colour || ST().accent;
        ST().panel(b.context, x, y, w, h, { cut: 3, fill: "rgba(28,30,36,0.96)", line: "#5d636e", accent: false });
        if (ARROWS.includes(label)) arrow(b.context, label, x + w / 2, y + h / 2, h * 0.56, c);
        dirty(b);
        if (!ARROWS.includes(label)) {
            const size = Math.round(h * 0.6);
            text(b, label, x, y + Math.round((h - size * 1.35) / 2), w, { size, color: c, bold: true, align: "center" });
        }
        return w;
    }
    // "↑↓←→" / "arrows" -> the four caps, "←→" -> two
    function capsOf(c) {
        if (Array.isArray(c)) return c;
        if (c === "↑↓←→" || c === "arrows" || c === "strzałki") return ["up", "down", "left", "right"];
        if (c === "←→") return ["left", "right"];
        if (c === "↑↓") return ["up", "down"];
        return [c];
    }
    // a row of hints: [[caps, text], ...]; returns the width (dry: only measured)
    function keyHints(b, rows, x, y, h, size, dry) {
        h = h || 26; size = size || 17;
        let cx = x;
        for (const [caps, label] of rows) {
            for (const c of capsOf(caps)) cx += (dry ? capWidth(b, c, h) : keyCap(b, c, cx, y, h)) + 3;
            cx += 5;
            if (!dry) text(b, label, cx, y + Math.round((h - size * 1.35) / 2), 400, { size, color: ST().text });
            cx += Math.ceil(measure(b, label, size)) + 20;
        }
        return cx - x - 20;
    }
    // a button: o { focus, disabled, primary, small }
    function button(b, x, y, w, h, label, o) {
        o = o || {};
        const S = ST(), ctx = b.context;
        if (o.disabled) S.panel(ctx, x, y, w, h, { cut: 5, fill: "rgba(16,17,21,0.88)", line: "#2c3037", accent: false });
        else if (o.focus) {
            S.panel(ctx, x, y, w, h, { cut: 5, fill: o.primary ? S.accent : "rgba(255,210,63,0.16)", line: S.accent, accent: !o.primary });
            if (o.primary) { ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(x + 5, y + 1, w - 10, 1); ctx.restore(); }
        } else S.panel(ctx, x, y, w, h, { cut: 5, fill: "rgba(20,22,27,0.94)", line: o.primary ? "#6b5a22" : S.line, accent: false });
        dirty(b);
        const colour = o.disabled ? "#565b64" : o.focus ? (o.primary ? "#16171b" : S.accent) : o.primary ? S.accent : S.text;
        const size = o.small ? 18 : 21;
        text(b, label, x, y + Math.round((h - size * 1.35) / 2), w, { size, color: colour, bold: !o.disabled && (o.focus || o.primary), align: "center" });
    }
    // four yellow corner brackets round a box (the keyboard's focus)
    function brackets(b, x, y, w, h, o) {
        o = o || {};
        const ctx = b.context, L = o.len || Math.min(16, w / 3, h / 3), x1 = x + w, y1 = y + h;
        const path = () => {
            ctx.beginPath();
            ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
            ctx.moveTo(x1 - L, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + L);
            ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
            ctx.moveTo(x + L, y1); ctx.lineTo(x, y1); ctx.lineTo(x, y1 - L);
        };
        ctx.save();
        ctx.lineCap = "square";
        path(); ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = (o.width || 3) + 3; ctx.stroke();
        path(); ctx.strokeStyle = o.color || ST().accent; ctx.lineWidth = o.width || 3; ctx.stroke();
        ctx.restore();
        dirty(b);
    }
    function dim(b, alpha) { b.fillRect(0, 0, b.width, b.height, "rgba(0,0,0," + (alpha === undefined ? 0.6 : alpha) + ")"); }
    Object.assign(ui, { dirty, panel, bar, font, text, measure, wrap, icon, arrow, keyCap, keyHints, button, brackets, dim });

    // ------------------------------------------------------------------
    // Pictures that must never stop the game (outside ImageManager's cache: a missing file stays empty, no "Failed to load")
    // ------------------------------------------------------------------
    const safeCache = new Map();
    ui.safeBitmap = function(url) {
        let b = safeCache.get(url);
        if (!b) { b = Bitmap.load(url); b.smooth = true; safeCache.set(url, b); }
        return b;
    };
    // (ui.bustFile, set by SpeechBubbles: the file drawn for a bust's name - the tavern regulars' old RTP names give their own
    // busts, 2026-10-07; without it the name is the file)
    ui.loadBust = name => ui.safeBitmap("img/pictures/" + Utils.encodeURI(ui.bustFile ? ui.bustFile(name) : name) + ".png");
    // the hero's bust (SpeechBubbles' choice: the new hero's Hero_Bust, else the leader's picture) and an event's
    ui.heroBust = function() {
        try { const n = T.call("SpeechBubbles", "heroBust"); if (n) return n; } catch (e) { /* (not known yet) */ }
        const HL = T.api("HeroLook");
        if (!HL || (HL.active && HL.active())) return "Hero_Bust";
        const a = window.$gameParty && $gameParty.leader();
        return (a && a.pictureName && a.pictureName()) || "Hero_Bust";
    };
    ui.bustOf = ev => { try { return T.call("SpeechBubbles", "bustOf", ev) || null; } catch (e) { return null; } };
    ui.bustHeight = () => { const SB = T.api("SpeechBubbles"); return (SB && SB.TALK && SB.TALK.height) || 273; };
    const img = bmp => (bmp && bmp.isReady && bmp.isReady() && !bmp.isError() ? bmp._canvas || bmp._image : null);

    // ------------------------------------------------------------------
    // Seeded randomness (the same seed, the same game: the tests)
    // ------------------------------------------------------------------
    ui.rng = function(seed) {
        let s = (Number(seed) >>> 0) || 1;
        const f = () => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), s | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        f.int = (a, b) => a + Math.floor(f() * (b - a + 1));
        f.pick = arr => arr[Math.floor(f() * arr.length)];
        f.chance = p => f() < p;
        return f;
    };

    // ------------------------------------------------------------------
    // The parchment's fonts and ink (QuestBoard.js's hand and small capitals)
    // ------------------------------------------------------------------
    ui.FONTS = { "QB Hand": "Caveat-Regular.ttf", "QB Hand Bold": "Caveat-Bold.ttf", "QB Caps": "AlegreyaSC-Bold.ttf" };
    ui.ensureFonts = function() {
        for (const fam of Object.keys(ui.FONTS)) if (!FontManager._states || !FontManager._states[fam]) FontManager.load(fam, ui.FONTS[fam]);
    };
    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function() {
        _Scene_Boot_loadGameFonts.call(this);
        ui.ensureFonts();
    };
    const mainFace = () => (window.$gameSystem ? $gameSystem.mainFontFace() : "sans-serif");
    ui.inkFont = { hand: s => s + 'px "QB Hand", ' + mainFace(), handBold: s => s + 'px "QB Hand Bold", ' + mainFace(), caps: s => s + 'px "QB Caps", ' + mainFace() };
    ui.INK = { dark: "#2a1a0d", soft: "#5b4128", faded: "#7a5f40", red: "#8e2417", green: "#2f5e22", gold: "#7a4c06", blue: "#27458f" };

    // ==================================================================
    // Sprites
    // ==================================================================
    // A plain panel: new Tawerna.ui.Panel(w, h, { cut, fill, line, accent, title }); panel.draw(fn(bitmap)) for the inside
    class Panel extends Sprite {
        initialize(w, h, opts) {
            super.initialize(new Bitmap(w, h));
            this.opts = opts || {};
            this.redraw();
        }
        redraw(fn) {
            const b = this.bitmap, o = this.opts;
            b.clear();
            panel(b, 0, 0, b.width, b.height, { cut: o.cut === undefined ? 6 : o.cut, fill: o.fill, line: o.line, accent: o.accent });
            if (o.title) text(b, o.title, 16, 8, b.width - 32, { size: o.titleSize || 22, color: ST().accent, bold: true });
            if (fn) fn(b);
            dirty(b);
            return this;
        }
    }

    // The title bar at the top of a mini-game: its name (yellow), a subtitle (grey), something on the right (the purse, the clock)
    class TitleBar extends Sprite {
        initialize(rect) {
            const r = rect || { x: 12, y: 8, w: Graphics.width - 24, h: 46 };
            super.initialize(new Bitmap(r.w, r.h));
            this.x = r.x; this.y = r.y;
            this._key = "";
        }
        set(title, sub, right, rightIcon) {
            const key = [title, sub, right, rightIcon].join("\u0001");
            if (key === this._key) return this;
            this._key = key;
            const b = this.bitmap, S = ST();
            b.clear();
            panel(b, 0, 0, b.width, b.height, { cut: 6 });
            const tw = Math.ceil(measure(b, title || "", 23, true));
            text(b, title || "", 16, 7, tw + 4, { size: 23, color: S.accent, bold: true });
            if (sub) text(b, sub, 16 + tw + 16, 11, b.width - tw - 260, { size: 17, color: S.muted });
            if (right !== undefined && right !== null && right !== "") {
                const rw = Math.ceil(measure(b, String(right), 19, true));
                text(b, String(right), b.width - 16 - rw, 10, rw + 2, { size: 19, color: ui.COLORS.gold, bold: true });
                if (rightIcon) icon(b, rightIcon, b.width - 16 - rw - 32, 7, 28);
            }
            dirty(b);
            return this;
        }
    }

    // The key-hint bar at the bottom: set([["O", "rzuć"], ["P", "pauza"], [["left", "right"], "wybór"]]) - centred, redrawn on a change
    class KeyHints extends Sprite {
        initialize(y, w) {
            super.initialize(new Bitmap(w || Graphics.width, 40));
            this.y = y === undefined ? Graphics.height - 42 : y;
            this._key = "";
        }
        set(rows, right) {
            const key = JSON.stringify([rows, right || ""]);
            if (key === this._key) return this;
            this._key = key;
            const b = this.bitmap, W = b.width;
            b.clear();
            if (!rows || !rows.length) return this;
            const width = keyHints(b, rows, 0, 0, 26, 17, true), x = Math.round((W - width) / 2);
            panel(b, x - 16, 1, width + 32, 36, { cut: 4, accent: false });
            keyHints(b, rows, x, 6, 26, 17, false);
            if (right) text(b, right, 0, 9, W - 16, { size: 16, color: ST().muted, align: "right" });
            dirty(b);
            return this;
        }
    }

    // A row of buttons: set([{ id, label, primary, disabled, small }], focus); move(-1 | 1) skips the disabled; hitAt(x, y) -> index
    class ButtonRow extends Sprite {
        initialize(w, h, opts) {
            super.initialize(new Bitmap(w, h || 44));
            this.opts = opts || {};
            this.items = [];
            this.index = 0;
            this.rects = [];
            this._key = "";
        }
        set(items, focus) {
            this.items = items || [];
            if (focus !== undefined) this.index = focus;
            this.index = clamp(this.index, 0, Math.max(0, this.items.length - 1));
            this.redraw();
            return this;
        }
        redraw() {
            const key = JSON.stringify([this.items, this.index]);
            if (key === this._key) return;
            this._key = key;
            const b = this.bitmap, gap = this.opts.gap || 12, n = this.items.length;
            b.clear();
            this.rects = [];
            if (!n) return;
            const widths = this.items.map(it => it.w || Math.max(this.opts.minW || 118, Math.ceil(measure(b, it.label, it.small ? 18 : 21, true)) + 40));
            let total = widths.reduce((a, c) => a + c, 0) + gap * (n - 1);
            const k = total > b.width ? b.width / total : 1;   // (shrunk to fit)
            total *= k;
            let x = Math.round((b.width - total) / 2);
            this.items.forEach((it, i) => {
                const w = Math.floor(widths[i] * k);
                button(b, x, 0, w, b.height, it.label, { focus: i === this.index, disabled: it.disabled, primary: it.primary, small: it.small });
                this.rects.push({ x, y: 0, w, h: b.height });
                x += w + Math.floor(gap * k);
            });
        }
        // the next button that way (the disabled ones skipped); at the end it stays, unless opts.wrap
        move(d) {
            const n = this.items.length;
            for (let s = 1; s < n; s++) {
                let i = this.index + d * s;
                if (this.opts.wrap) i = ((i % n) + n) % n; else if (i < 0 || i >= n) return false;
                if (!this.items[i].disabled) { this.index = i; this.redraw(); return true; }
            }
            return false;
        }
        current() { return this.items[this.index] || null; }
        hitAt(x, y) {
            const lx = x - this.x, ly = y - this.y;
            return this.rects.findIndex(r => lx >= r.x && lx < r.x + r.w && ly >= r.y && ly < r.y + r.h);
        }
    }

    // A list with icons (like the game's menus): set([{ icon, text, right, color, disabled }]); select(i); rows scroll; hitAt(x, y)
    class IconList extends Sprite {
        initialize(w, h, opts) {
            super.initialize(new Bitmap(w, h));
            this.opts = Object.assign({ row: 36, pad: 10, title: "" }, opts || {});
            this.items = [];
            this.index = 0;
            this.top = 0;
            this._key = "";
        }
        get rows() { return Math.max(1, Math.floor((this.bitmap.height - this.pad0() - 8) / this.opts.row)); }
        pad0() { return this.opts.title ? 40 : this.opts.pad; }
        set(items, index) {
            this.items = items || [];
            if (index !== undefined) this.index = index;
            this.select(this.index);
            return this;
        }
        select(i) {
            this.index = clamp(i, 0, Math.max(0, this.items.length - 1));
            if (this.index < this.top) this.top = this.index;
            if (this.index >= this.top + this.rows) this.top = this.index - this.rows + 1;
            this.redraw();
            return this;
        }
        move(d) { return this.select(this.index + d); }
        current() { return this.items[this.index] || null; }
        redraw() {
            const key = JSON.stringify([this.items, this.index, this.top]);
            if (key === this._key) return;
            this._key = key;
            const b = this.bitmap, S = ST(), R = this.opts.row, p = this.opts.pad, y0 = this.pad0();
            b.clear();
            panel(b, 0, 0, b.width, b.height, { cut: 6 });
            if (this.opts.title) text(b, this.opts.title, p + 6, 6, b.width - 2 * p, { size: 20, color: S.accent, bold: true });
            for (let r = 0; r < this.rows; r++) {
                const i = this.top + r, it = this.items[i];
                if (!it) break;
                const y = y0 + r * R, sel = i === this.index;
                if (sel) { b.fillRect(p, y, b.width - 2 * p, R - 2, "rgba(255,210,63,0.16)"); b.fillRect(p, y, 4, R - 2, S.accent); }
                const iconSize = Math.min(32, R - 4);
                let tx = p + 12;
                if (it.icon) { icon(b, it.icon, tx, y + Math.round((R - 2 - iconSize) / 2), iconSize); tx += iconSize + 8; }
                const colour = it.disabled ? "#565b64" : it.color || (sel ? S.accent : S.text);
                text(b, it.text, tx, y + Math.round((R - 2 - 25) / 2), b.width - tx - p - 90, { size: 18, color: colour, bold: sel });
                if (it.right !== undefined) text(b, String(it.right), p, y + Math.round((R - 2 - 23) / 2), b.width - 2 * p - 10, { size: 16, color: S.muted, align: "right" });
            }
            if (this.items.length > this.rows) {   // (a thin scroll bar)
                const h = b.height - y0 - 8, th = Math.max(16, h * this.rows / this.items.length), ty = y0 + (h - th) * this.top / (this.items.length - this.rows);
                b.fillRect(b.width - 5, y0, 2, h, S.line);
                b.fillRect(b.width - 5, ty, 2, th, S.accent);
            }
            dirty(b);
        }
        hitAt(x, y) {
            const lx = x - this.x, ly = y - this.y - this.pad0();
            if (lx < 0 || lx >= this.bitmap.width || ly < 0) return -1;
            const i = this.top + Math.floor(ly / this.opts.row);
            return i < this.items.length && Math.floor(ly / this.opts.row) < this.rows ? i : -1;
        }
    }

    // A meter: a label, a bar in the HUD's look (colours by thresholds), a value on the right
    class Meter extends Sprite {
        initialize(w, h, opts) {
            super.initialize(new Bitmap(w, h || 26));
            this.opts = Object.assign({ label: "", colour: ST().accent, labelW: 0, thresholds: null }, opts || {});
            this.ratio = -1;
            this._text = null;
        }
        colourOf(r) {
            for (const [lim, c] of this.opts.thresholds || []) if (r <= lim) return c;
            return this.opts.colour;
        }
        set(ratio, valueText) {
            const r = clamp(num(ratio, 0), 0, 1), t = valueText === undefined ? "" : String(valueText);
            if (Math.abs(r - this.ratio) < 0.002 && t === this._text) return this;
            this.ratio = r; this._text = t;
            const b = this.bitmap, S = ST(), lw = this.opts.label ? this.opts.labelW || Math.ceil(measure(b, this.opts.label, 15, true)) + 10 : 0;
            const vw = t ? Math.ceil(measure(b, t, 15, true)) + 10 : 0, bh = Math.min(10, b.height - 6);
            b.clear();
            if (this.opts.label) text(b, this.opts.label, 0, Math.round((b.height - 20) / 2), lw, { size: 15, color: S.muted, bold: true });
            bar(b, lw + 1, Math.round((b.height - bh) / 2), b.width - lw - vw - 2, bh, r, this.colourOf(r));
            if (t) text(b, t, b.width - vw + 6, Math.round((b.height - 20) / 2), vw, { size: 15, color: S.text, bold: true });
            return this;
        }
    }

    // A banner across the screen: show(kind, title, sub, life, y) - "Pudło!" (bust: it shakes), "Wygrana!" (win), "Przegrana" (lose),
    // "Twoja tura" (turn), "Gorące kości!" (hot); it pops in, stays, fades. y: this time lower or higher (else where it was made).
    // ticked = true: it moves only on tick() (a game's logic steps: turbo and a hurried rival speed it up alike), not every frame
    const BANNERS = {
        bust: { line: "#ff7b6b", text: "#ff8f7f", glow: "rgba(255,90,70,0.20)", size: 64 },
        hot: { line: "#ffb347", text: "#ffc861", glow: "rgba(255,150,40,0.24)", size: 60 },
        turn: { line: "#3a3e46", text: "#ffd23f", glow: "rgba(255,210,63,0.08)", size: 34 },
        win: { line: "#ffd23f", text: "#ffd23f", glow: "rgba(255,210,63,0.26)", size: 68 },
        lose: { line: "#8a9099", text: "#d4d8de", glow: "rgba(160,170,190,0.10)", size: 60 }
    };
    ui.BANNERS = BANNERS;
    class Banner extends Sprite {
        initialize(cx, cy, w) {
            super.initialize(new Bitmap(w || 900, 160));
            this.anchor.set(0.5, 0.5);
            this.cx = cx === undefined ? Graphics.width / 2 : cx;
            this.cy = cy === undefined ? Math.round(Graphics.height * 0.42) : cy;
            this.x = this.cx;
            this.y = this.cy;
            this.visible = false;
            this.ticked = false;
            this.t = 0; this.life = 0; this.kind = ""; this.title = "";
        }
        show(kind, title, sub, life, y) {
            const B = BANNERS[kind] || BANNERS.turn, b = this.bitmap, ctx = b.context, W = b.width, H = b.height;
            this.y = y === undefined || y === null ? this.cy : y;
            const small = kind === "turn", bh = small ? 64 : sub ? 128 : 104, by = (H - bh) / 2;
            b.clear();
            ctx.save();
            const g = ctx.createLinearGradient(0, 0, W, 0);
            g.addColorStop(0, "rgba(8,9,11,0)"); g.addColorStop(0.16, "rgba(8,9,11,0.9)"); g.addColorStop(0.84, "rgba(8,9,11,0.9)"); g.addColorStop(1, "rgba(8,9,11,0)");
            ctx.fillStyle = g; ctx.fillRect(0, by, W, bh);
            const gl = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.42);
            gl.addColorStop(0, B.glow); gl.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gl; ctx.fillRect(0, by, W, bh);
            const lg = ctx.createLinearGradient(0, 0, W, 0);
            lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(0.2, B.line); lg.addColorStop(0.8, B.line); lg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = lg; ctx.fillRect(0, by, W, 2); ctx.fillRect(0, by + bh - 2, W, 2);
            ctx.restore();
            dirty(b);
            text(b, title, 0, small ? by + 10 : by + (sub ? 14 : 18), W, { size: B.size, color: B.text, bold: true, align: "center", outline: 5 });
            if (sub) text(b, sub, 0, by + bh - 38, W, { size: 20, color: "#d8dde3", align: "center" });
            this.kind = kind;
            this.title = title;
            this.t = 0;
            this.life = life || (small ? 70 : 110);
            this.visible = true;
            return this;
        }
        update() {
            super.update();
            if (!this.ticked) this.tick();
        }
        tick() {
            if (!this.visible) return;
            this.t++;
            const t = this.t, fin = Math.min(1, t / 10), fout = clamp((this.life - t) / 14, 0, 1);
            this.opacity = Math.round(255 * Math.min(fin, fout));
            const s = this.kind === "turn" ? 0.94 + 0.06 * easeOut(t / 10) : 0.8 + 0.2 * easeBack(t / 14);
            this.scale.set(s, s);
            this.x = this.cx + (this.kind === "bust" && t < 18 ? Math.sin(t * 2.1) * (18 - t) * 0.6 : 0);
            if (t >= this.life) this.visible = false;
        }
        shown() { return this.visible; }
    }

    // A coin flying along a curve from a to b (the pot, the purse): opts { delay, duration, icon, bitmap (a picture of its own instead of
    // the icon), scale, arc, onArrive }. ticked = true: it flies only on tick() (-> false once it has landed), not every frame
    class CoinFly extends Sprite {
        initialize(a, b, opts) {
            const o = opts || {};
            super.initialize(o.bitmap || new Bitmap(32, 32));
            this.anchor.set(0.5, 0.5);
            this.iconIndex = o.icon || ui.COIN_ICON;
            this.s0 = o.scale || 0.9;
            this.a = a; this.b = b; this.delay = o.delay || 0; this.D = o.duration || 36; this.t = 0; this.onArrive = o.onArrive || null;
            this.cx = (a.x + b.x) / 2 + (b.y - a.y) * 0.15;
            this.cy = Math.min(a.y, b.y) - (o.arc === undefined ? 90 : o.arc);
            this.visible = false;
            this.done = false;
            this.ticked = false;
            this._drawn = !!o.bitmap;
        }
        update() {
            super.update();
            if (!this.ticked) this.tick();
        }
        tick() {
            if (this.done) return false;
            if (!this._drawn) this._drawn = icon(this.bitmap, this.iconIndex, 0, 0, 32);
            this.t++;
            const t = this.t - this.delay;
            if (t < 0) return true;
            this.visible = true;
            const u = easeInOut(t / this.D), iu = 1 - u, s = this.s0;
            this.x = iu * iu * this.a.x + 2 * iu * u * this.cx + u * u * this.b.x;
            this.y = iu * iu * this.a.y + 2 * iu * u * this.cy + u * u * this.b.y;
            this.scale.set(s * (0.9 + 0.3 * Math.sin(Math.PI * u)) * Math.abs(Math.cos(t * 0.3)) + 0.12, s * (0.9 + 0.3 * Math.sin(Math.PI * u)));
            if (t >= this.D) {
                this.done = true;
                this.visible = false;
                if (this.onArrive) this.onArrive(this);
                if (this.parent) this.parent.removeChild(this);
                return false;
            }
            return true;
        }
    }
    // n coins from a to b, one after another: onEach(i) as each lands (a counter goes up; a clink on every second), onDone at the end
    ui.coinBurst = function(parent, n, a, b, opts) {
        const o = opts || {}, count = Math.max(0, Math.floor(n)), list = [];
        let landed = 0;
        for (let i = 0; i < count; i++) {
            const c = new CoinFly({ x: a.x + (Math.random() - 0.5) * (o.spread || 16), y: a.y }, b, {
                delay: i * (o.gap || 4), duration: o.duration || 34, icon: o.icon, scale: o.scale, arc: o.arc,
                onArrive: () => {
                    landed++;
                    if (o.sound !== false && landed % 2 === 1) T.audio.se(o.se || "Coin", { volume: 45, pitch: 95 + Math.floor(Math.random() * 20) });
                    if (o.onEach) o.onEach(landed - 1, landed);
                    if (landed === count && o.onDone) o.onDone();
                }
            });
            parent.addChild(c);
            list.push(c);
        }
        if (!count && o.onDone) o.onDone();
        return list;
    };

    // A bust in a bottom corner: slides in from its side, dimmed while it is the other one's turn, a jolt, a hop.
    // ticked = true: it moves only on tick() (a game's logic steps), not every frame
    class Bust extends Sprite {
        initialize(side, height) {
            super.initialize();
            this.side = side === "right" ? "right" : "left";   // (the left one is mirrored to look right - the RTP busts face left)
            this.H = height || ui.bustHeight();
            this.anchor.set(0, 1);
            this.k = 0; this.want = false; this.light = 1; this.lightTo = 1; this.jolt = 0; this.hop = 0; this._blend = -1;
            this.name = "";
            this.visible = false;
            this.ticked = false;
        }
        setPicture(name) {
            if (name === this.name) return this;
            this.name = name || "";
            this.bitmap = name ? ui.loadBust(name) : null;
            return this;
        }
        show(on, name) { if (name !== undefined) this.setPicture(name); this.want = on !== false; return this; }
        dim(on) { this.lightTo = on ? 0.45 : 1; return this; }
        update() {
            super.update();
            if (!this.ticked) this.tick();
        }
        tick() {
            this.k = clamp(this.k + (this.want ? 1 : -1) / 14, 0, 1);
            this.light += clamp(this.lightTo - this.light, -0.05, 0.05);
            if (this.jolt > 0) this.jolt--;
            if (this.hop > 0) this.hop--;
            const b = this.bitmap, ready = b && b.isReady() && b.height > 0 && !b.isError();
            this.visible = !!ready && this.k > 0;
            if (!this.visible) return;
            const sc = this.H / b.height, w = b.width * sc, left = this.side === "left", e = easeOut(this.k);
            const x0 = left ? 0 : Graphics.width - w, slide = (1 - e) * (w + 20) * (left ? -1 : 1);
            const shake = this.jolt > 0 ? Math.sin(this.jolt * 1.7) * 3 : 0, hop = this.hop > 0 ? -Math.sin(Math.PI * this.hop / 16) * 7 : 0;
            this.scale.set(left ? -sc : sc, sc);
            this.x = Math.round(x0 + slide + (left ? w : 0) + shake);
            this.y = Graphics.height + Math.round(hop);
            this.opacity = Math.round(255 * Math.min(1, e * 1.4));
            const blend = Math.round((1 - this.light) * 255);
            if (blend !== this._blend) { this._blend = blend; this.setBlendColor([6, 6, 10, blend]); }
        }
        box() {
            const b = this.bitmap, w = b && b.isReady() && b.height ? Math.round(b.width * this.H / b.height) : 257;
            return { x: this.side === "left" ? 0 : Graphics.width - w, w, top: Graphics.height - this.H };
        }
    }

    // A speech bubble over a bust, its tail towards the speaker: say(text, frames)
    ui.bubbleBitmap = function(say, side) {
        const probe = new Bitmap(8, 8);
        const lines = wrap(probe, say, 300, 21), w = Math.min(340, Math.max.apply(null, lines.map(l => Math.ceil(measure(probe, l, 21))).concat([40])) + 32);
        const h = lines.length * 28 + 20, b = new Bitmap(w + 14, h + 16), ctx = b.context, S = ST(), ox = side === "left" ? 14 : 0;
        ctx.save();
        ctx.fillStyle = "rgba(11,12,15,0.9)";
        ctx.strokeStyle = S.line;
        ctx.beginPath();
        const x0 = ox + 0.5, y0 = 0.5, x1 = ox + w - 0.5, y1 = h - 0.5, c = 5;
        ctx.moveTo(x0 + c, y0); ctx.lineTo(x1 - c, y0); ctx.lineTo(x1, y0 + c); ctx.lineTo(x1, y1 - c); ctx.lineTo(x1 - c, y1);
        if (side === "right") { ctx.lineTo(x1 - 26, y1); ctx.lineTo(x1 - 6, y1 + 14); ctx.lineTo(x1 - 44, y1); }
        else { ctx.lineTo(x0 + 44, y1); ctx.lineTo(x0 + 6, y1 + 14); ctx.lineTo(x0 + 26, y1); }
        ctx.lineTo(x0 + c, y1); ctx.lineTo(x0, y1 - c); ctx.lineTo(x0, y0 + c); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 + 1, y0 + 14); ctx.lineTo(x0 + 1, y0 + c); ctx.lineTo(x0 + c, y0 + 1); ctx.lineTo(x0 + 14, y0 + 1); ctx.stroke();
        ctx.restore();
        lines.forEach((l, i) => text(b, l, ox + 16, 9 + i * 28, w - 30, { size: 21, color: S.text }));
        dirty(b);
        return b;
    };
    class Bubble extends Sprite {
        initialize(side) {
            super.initialize();
            this.side = side === "right" ? "right" : "left";
            this.anchor.set(this.side === "left" ? 0 : 1, 1);
            this.opacity = 0;
            this.life = 0; this.t = 0; this.text = "";
        }
        say(s, frames) {
            if (!s) return this;
            this.bitmap = ui.bubbleBitmap(s, this.side);
            this.text = s; this.life = frames || 150; this.t = 0; this._y = this.y;
            return this;
        }
        update() {
            super.update();
            if (!this.life) return;
            this.t++;
            this.opacity = Math.round(255 * Math.min(1, this.t / 8, (this.life - this.t) / 14));
            if (this.t >= this.life) { this.life = 0; this.opacity = 0; }
        }
        shown() { return this.life > 0; }
    }

    // ------------------------------------------------------------------
    // The parchment (QuestBoard's look): img/system/QuestBoard_Paper.png (four 512 px shades) + deckled edge, burnt rim, a fold;
    // the ink in the hand / small-caps fonts. new ParchmentCard(w, h, { seed, shade 0-3, torn 0-4, crease, title, lines, write(ctx, card) })
    // ------------------------------------------------------------------
    function paperOutline(w, h, R, torn) {
        const corners = [[1, 1], [w - 1, 1], [w - 1, h - 1], [1, h - 1]], poly = [];
        const ti = torn ? torn - 1 : -1, a = 24 + R.int(0, 16), b = 20 + R.int(0, 16);
        const towards = (p, q, d) => { const L2 = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + (q[0] - p[0]) * d / L2, p[1] + (q[1] - p[1]) * d / L2]; };
        let tear = null;
        for (let i = 0; i < 4; i++) {
            if (i === ti) {
                const A = towards(corners[i], corners[(i + 3) % 4], a), B = towards(corners[i], corners[(i + 1) % 4], b);
                poly.push({ p: A }, { p: B, tear: true });
                tear = [A, B];
            } else poly.push({ p: corners[i] });
        }
        const pts = [];
        for (let i = 0; i < poly.length; i++) {
            const P = poly[i].p, Q = poly[(i + 1) % poly.length].p, isTear = !!poly[(i + 1) % poly.length].tear;
            const len = Math.hypot(Q[0] - P[0], Q[1] - P[1]), n = Math.max(1, Math.round(len / (isTear ? 2.4 : 7)));
            const nx = -(Q[1] - P[1]) / len, ny = (Q[0] - P[0]) / len;
            for (let k = 0; k < n; k++) {
                const t = k / n, amp = isTear ? 2.4 : 0.65, off = k === 0 ? 0 : (R() - 0.5) * 2 * amp;
                pts.push([P[0] + (Q[0] - P[0]) * t + nx * off, P[1] + (Q[1] - P[1]) * t + ny * off, isTear && k > 0]);
            }
        }
        const path = new Path2D();
        pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
        path.closePath();
        return { path, pts, tear };
    }
    // opts: { seed, shade 0-3, torn 0-4, crease; rng: a stream of the caller's instead of the seed's (R() and R.int(a, b) - the caller
    // draws on with it); paper: the texture as a Bitmap the caller loaded; out: an object that gets the outline { path, pts, tear } }
    ui.paperOutline = paperOutline;
    ui.drawPaper = function(ctx, w, h, opts) {
        const o = opts || {}, R = o.rng || ui.rng(o.seed || 1), out = paperOutline(w, h, R, o.torn || 0);
        if (o.out) Object.assign(o.out, out);
        const paper = img(o.paper || ui.safeBitmap("img/system/QuestBoard_Paper.png")), shade = (o.shade || 0) % 4;
        ctx.save();
        ctx.clip(out.path);
        const qx = (shade % 2) * 512, qy = Math.floor(shade / 2) * 512;
        const sx = qx + R.int(0, Math.max(0, 512 - w)), sy = qy + R.int(0, Math.max(0, 512 - h));
        if (paper) ctx.drawImage(paper, sx, sy, Math.min(w, 512), Math.min(h, 512), 0, 0, w, h);
        else { ctx.fillStyle = "#eadcb8"; ctx.fillRect(0, 0, w, h); }
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(255,249,232,0.12)");
        g.addColorStop(1, "rgba(70,40,12,0.10)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (o.crease) {
            const y = Math.round(h * (0.42 + R() * 0.2));
            ctx.fillStyle = "rgba(255,250,236,0.35)"; ctx.fillRect(0, y, w, 1);
            ctx.fillStyle = "rgba(90,60,30,0.16)"; ctx.fillRect(0, y + 1, w, 1);
        }
        for (const [lw, a] of [[18, 0.09], [8, 0.11], [3, 0.2]]) { ctx.strokeStyle = "rgba(104,66,28," + a + ")"; ctx.lineWidth = lw; ctx.stroke(out.path); }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "rgba(56,36,16,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke(out.path);
        if (out.tear) {
            ctx.strokeStyle = "rgba(255,248,228,0.85)";
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            let started = false;
            for (const [x, y, t] of out.pts) { if (!t) { started = false; continue; } if (!started) { ctx.moveTo(x - 0.5, y - 0.5); started = true; } else ctx.lineTo(x - 0.5, y - 0.5); }
            ctx.stroke();
        }
        ctx.restore();
        return !!paper;
    };
    // ink on the paper (multiplied into it, a little uneven)
    ui.inkText = function(ctx, s, x, y, fontCss, colour, align, alpha) {
        ctx.save();
        ctx.font = fontCss;
        ctx.fillStyle = colour || ui.INK.dark;
        ctx.textAlign = align || "left";
        ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = alpha === undefined ? 0.92 : alpha;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillText(s, x, y);
        ctx.restore();
    };
    ui.inkWrap = function(ctx, s, maxW, fontCss) {
        ctx.save();
        ctx.font = fontCss;
        const out = [];
        for (const para of String(s).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const t = line ? line + " " + word : word;
                if (line && ctx.measureText(t).width > maxW) { out.push(line); line = word; } else line = t;
            }
            out.push(line);
        }
        ctx.restore();
        return out;
    };
    class ParchmentCard extends Sprite {
        initialize(w, h, opts) {
            super.initialize(new Bitmap(w, h));
            this.opts = opts || {};
            ui.ensureFonts();
            this.paper = ui.safeBitmap("img/system/QuestBoard_Paper.png");
            this._hadPaper = false;
            this.redraw();
        }
        set(opts) { Object.assign(this.opts, opts || {}); this.redraw(); return this; }
        redraw() {
            const b = this.bitmap, ctx = b.context, o = this.opts, W = b.width, H = b.height, F = ui.inkFont;
            b.clear();
            this._hadPaper = ui.drawPaper(ctx, W, H, { seed: o.seed || 7, shade: o.shade || 0, torn: o.torn || 0, crease: !!o.crease });
            let y = 44;
            if (o.title) {
                ui.inkText(ctx, o.title, W / 2, y, F.caps(o.titleSize || 28), o.titleInk || ui.INK.dark, "center");
                y += 14;
                ctx.save(); ctx.strokeStyle = ui.INK.soft; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.1;
                ctx.beginPath(); ctx.moveTo(W * 0.22, y); ctx.lineTo(W / 2 - 7, y); ctx.moveTo(W / 2 + 7, y); ctx.lineTo(W * 0.78, y); ctx.stroke();
                ctx.fillStyle = ui.INK.soft; ctx.beginPath(); ctx.moveTo(W / 2, y - 3.5); ctx.lineTo(W / 2 + 3.5, y); ctx.lineTo(W / 2, y + 3.5); ctx.lineTo(W / 2 - 3.5, y); ctx.closePath(); ctx.fill();
                ctx.restore();
                y += 30;
            }
            for (const line of o.lines || []) {
                const s = Array.isArray(line) ? line[0] : line, ink = Array.isArray(line) ? line[1] : ui.INK.dark;
                for (const l of ui.inkWrap(ctx, s, W - 56, F.hand(o.size || 24))) { ui.inkText(ctx, l, 28, y, F.hand(o.size || 24), ink); y += Math.round((o.size || 24) * 1.15); }
            }
            if (typeof o.write === "function") o.write(ctx, this, y);
            dirty(b);
        }
        update() {
            super.update();
            if (!this._hadPaper && this.paper.isReady() && !this.paper.isError()) this.redraw();   // (the texture came: again with it)
        }
    }

    // ------------------------------------------------------------------
    // Cards on the overlay: the rules / the result (with a bust), and a choice (the pause, "Przerwać grę?")
    // ------------------------------------------------------------------
    // spec: { w, h, dim, bust, who, whoSub, kicker, title, titleColor, sub, subColor, say, lines: [text | [text, colour]], keys, foot }
    ui.drawCard = function(b, spec) {
        const S = ST(), W = b.width, H = b.height;
        b.clear();
        dim(b, spec.dim === undefined ? 0.6 : spec.dim);
        const pw = spec.w || 960, ph = spec.h || 520, px = Math.round((W - pw) / 2), py = Math.round((H - ph) / 2);
        panel(b, px, py, pw, ph, { cut: 10 });
        const bust = spec.bust ? ui.loadBust(spec.bust) : null, withBust = !!spec.bust;
        if (bust && bust.isReady() && !bust.isError() && bust.width) {
            const bw = 250, bh = Math.round(bust.height * bw / bust.width);
            b.context.imageSmoothingEnabled = true;
            b.blt(bust, 0, 0, bust.width, bust.height, px + 18, py + ph - bh - 60, bw, bh);
            b.fillRect(px + 18, py + ph - 60, bw, 2, S.accent);
        }
        if (withBust) {
            text(b, spec.who || "", px + 18, py + ph - 52, 250, { size: 20, color: S.accent, bold: true, align: "center" });
            text(b, spec.whoSub || "", px + 18, py + ph - 28, 250, { size: 15, color: S.muted, align: "center" });
        }
        const x = px + (withBust ? 296 : 36), w = pw - (withBust ? 296 : 36) - 30;
        let y = py + 24;
        text(b, spec.kicker || "", x, y, w, { size: 16, color: S.muted, bold: true });
        y += 24;
        text(b, spec.title || "", x, y, w, { size: 40, color: spec.titleColor || S.accent, bold: true });
        y += 54;
        if (spec.sub) { text(b, spec.sub, x, y, w, { size: 21, color: spec.subColor || S.text }); y += 36; }
        if (spec.say) {
            const qs = wrap(b, "„" + spec.say + "”", w - 20, 20);
            b.fillRect(x, y + 2, 3, qs.length * 27 - 2, S.accentDim);
            for (const l of qs) { text(b, l, x + 14, y, w - 20, { size: 20, color: "#d8dde3" }); y += 27; }
            y += 12;
        }
        for (const line of spec.lines || []) {
            const colour = Array.isArray(line) ? line[1] : null, s = Array.isArray(line) ? line[0] : line;
            b.fillRect(x + 3, y + 10, 6, 6, colour || S.accent);
            for (const l of wrap(b, s, w - 26, 19)) { text(b, l, x + 20, y, w - 26, { size: 19, color: colour || S.text }); y += 25; }
            y += 3;
        }
        const ky = py + ph - 96;
        b.fillRect(x, ky - 12, w, 1, S.line);
        if (spec.keys) keyHints(b, spec.keys, x, ky, 26, 17);
        text(b, spec.foot || "O - dalej", x, py + ph - 48, w, { size: 22, color: S.accent, bold: true, align: "right" });
        dirty(b);
        return { x: px, y: py, w: pw, h: ph };
    };
    // spec: { title, lines, options: [labels], index, foot, w } -> the options' rectangles (the mouse)
    ui.drawChoiceCard = function(b, spec) {
        const S = ST(), W = b.width, H = b.height, pw = spec.w || 480;
        const lines = [];
        const probe = b;
        for (const l of spec.lines || []) for (const s of wrap(probe, l, pw - 56, 18)) lines.push(s);
        const n = (spec.options || []).length, ph = 76 + lines.length * 24 + (lines.length ? 12 : 0) + n * 52 + 44;
        const px = Math.round((W - pw) / 2), py = Math.round((H - ph) / 2);
        b.clear();
        dim(b, 0.55);
        panel(b, px, py, pw, ph, { cut: 10 });
        text(b, spec.title || "Pauza", px + 26, py + 18, pw - 52, { size: 30, color: S.accent, bold: true });
        let y = py + 70;
        for (const l of lines) { text(b, l, px + 28, y, pw - 56, { size: 18, color: S.text }); y += 24; }
        if (lines.length) y += 12;
        const rects = [];
        (spec.options || []).forEach((o, i) => {
            const sel = i === spec.index;
            if (sel) { b.fillRect(px + 20, y, pw - 40, 42, "rgba(255,210,63,0.16)"); b.fillRect(px + 20, y, 4, 42, S.accent); }
            text(b, o, px + 40, y + 7, pw - 70, { size: 21, color: sel ? S.accent : S.text, bold: sel });
            rects.push({ x: px + 20, y, w: pw - 40, h: 42 });
            y += 52;
        });
        text(b, spec.foot || "O - wybierz · P - wróć", px, py + ph - 38, pw - 26, { size: 17, color: S.muted, align: "right" });
        dirty(b);
        return rects;
    };

    Object.assign(ui, { Panel, TitleBar, KeyHints, ButtonRow, IconList, Meter, Banner, CoinFly, Bust, Bubble, ParchmentCard });

    // ==================================================================
    // Scene_MiniGame: the base of the mini-game scenes
    // ==================================================================
    // The standard UI sounds (the core's safe pool: a missing file stays silent)
    ui.SOUNDS = { cursor: ["Cursor1", 50, 100], ok: ["Decision1", 60, 100], cancel: ["Cancel1", 60, 100], buzzer: ["Buzzer1", 50, 100],
        coin: ["Coin", 50, 100], coins: ["Shop1", 55, 105], page: ["Book1", 55, 100], win: ["Item3", 45, 110], lose: ["Disappointment", 55, 100] };
    const KEYS = { ok: "ok", back: "cancel", up: "up", down: "down", left: "left", right: "right", pageup: "pageup", pagedown: "pagedown", shift: "shift" };
    const REPEAT_WAIT = 18, REPEAT_EVERY = 5;
    let pending = null;
    const pendingEnds = [];
    function deliver(done) {
        if (typeof done.onEnd === "function") {
            try { done.onEnd(done.result); } catch (e) { console.error("[Tawerna.ui] " + done.id + " onEnd:", e); }
        }
        T.emit("miniGameEnd", { id: done.id, result: done.result });
    }
    // the results of the mini-games go to their onEnd on the map (money and notices are shown where they can be seen)
    T.on("mapReady", () => { while (pendingEnds.length) deliver(pendingEnds.shift()); }, { owner: "TawernaUI" });

    class Scene_MiniGame extends Scene_Base {
        // Tawerna.ui.open(Scene_X, { onEnd, seed, turbo, ... }) -> false while another one is open or a scene is changing
        static open(SceneClass, opts) {
            if (ui.running || SceneManager.isSceneChanging()) return false;
            pending = { cls: SceneClass, opts: opts || {} };
            if (window.$gameTemp) $gameTemp.clearDestination();
            SceneManager.push(SceneClass);
            return true;
        }
        initialize() {
            super.initialize();
            this.opts = pending && pending.cls === this.constructor ? pending.opts : {};
            pending = null;
            this.gameId = this.opts.id || this.constructor.gameId || this.constructor.name;
            this.touchOk = !!this.opts.touchOk;
        }
        create() {
            super.create();
            this.seed = this.opts.seed !== undefined ? Number(this.opts.seed) >>> 0 : ((Date.now() ^ 0x5bd1e995) >>> 0);
            this.rng = ui.rng(this.seed);
            this.turbo = clamp(Math.floor(num(this.opts.turbo, 1)), 1, 40);
            this.createBackground();
            this.stage = new Sprite();
            this.addChild(this.stage);
            this.bustL = new Bust("left");
            this.bustR = new Bust("right");
            this.bubbleL = new Bubble("left");
            this.bubbleR = new Bubble("right");
            this.addChild(this.bustL, this.bustR);
            this.fx = new Sprite();
            this.addChild(this.fx);
            this.addChild(this.bubbleL, this.bubbleR);
            this.hud = new Sprite();
            this.addChild(this.hud);
            this.titleBar = new TitleBar();
            this.hints = new KeyHints();
            this.hud.addChild(this.titleBar, this.hints);
            this.banner = new Banner();
            this.fx.addChild(this.banner);
            this.overlay = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            this.overlay.visible = false;
            this.addChild(this.overlay);
            ImageManager.loadSystem("IconSet");
            this.createGame();
        }
        // behind it: the map it came from, blurred once into a picture of its own (a filter would blur it again every frame) and shaded
        createBackground() {
            const W = Graphics.width, H = Graphics.height, snap = SceneManager.backgroundBitmap();
            let pic = null;
            if (snap && snap.canvas && this.opts.backdrop !== "solid") {
                pic = new Bitmap(W, H);
                const c = pic.context;
                c.filter = "blur(5px)";
                c.drawImage(snap.canvas, -8, -8, W + 16, H + 16);
                c.filter = "none";
                dirty(pic);
            } else {
                pic = new Bitmap(W, H);
                pic.fillAll("#0b0c0f");
            }
            this.back = new Sprite(pic);
            this.addChild(this.back);
            const shade = new Bitmap(W, H), ctx = shade.context, g = ctx.createRadialGradient(W / 2, H * 0.46, 120, W / 2, H / 2, 760);
            g.addColorStop(0, "rgba(8,6,4,0.55)"); g.addColorStop(1, "rgba(4,3,2,0.9)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            dirty(shade);
            this.shade = new Sprite(shade);
            this.addChild(this.shade);
        }
        start() {
            super.start();
            ui.running = this;
            this.phase = "play";
            this.phaseT = 0;
            this.t = 0;
            this.keys = {};
            this.trig = {};
            this.rep = {};
            this.held = {};
            this.prev = {};
            for (const k of Object.keys(KEYS)) this.prev[k] = this.keyDown(k);   // (keys still held from the map do not count)
            this.mouse = { x: TouchInput.x, y: TouchInput.y, moved: false, click: false, cancel: false, down: false };
            this.card = null;
            this.leaving = false;
            this.startFadeIn(this.fadeSpeed(), false);
            T.emit("miniGameStart", { id: this.gameId, scene: this });
            this.begin();
        }
        update() {
            super.update();
            if (this._left) return;
            this.readMouse();
            const n = this.ticksThisFrame();
            for (let i = 0; i < n; i++) {
                const hook = this.testHook();
                if (typeof hook === "function") { try { hook(this); } catch (e) { console.error("[Tawerna.ui] onTick:", e); this.dropTestHook(); } }
                this.readKeys();
                this.t++;
                this.phaseT++;
                if (this.leaving) break;
                if (this.card) this.updateCard();
                else if (this.trig.back && this.onBack() !== false) { /* (P: the pause) */ }
                else this.tick();
                if (i === 0) { this.mouse.click = false; this.mouse.cancel = false; this.mouse.moved = false; }   // (once a frame)
                if (this.leaving) break;
            }
            this.frame();
            if (this.leaving && !this.isFading() && !this._left) {
                this._left = true;
                SceneManager.pop();
            }
        }
        // is the key k (ok, back, up, down, left, right, pageup, pagedown, shift) down now; touchOk: a press anywhere = O
        keyDown(k) {
            return Input.isPressed(KEYS[k]) || (k === "ok" && this.touchOk && TouchInput.isPressed());
        }
        readKeys() {
            for (const k of Object.keys(KEYS)) {
                const now = this.keyDown(k);
                this.trig[k] = now && !this.prev[k];
                this.held[k] = now ? (this.held[k] || 0) + 1 : 0;
                this.rep[k] = this.trig[k] || (this.held[k] > REPEAT_WAIT && (this.held[k] - REPEAT_WAIT) % REPEAT_EVERY === 0);
                this.prev[k] = now;
                this.keys[k] = now;
            }
        }
        readMouse() {
            const m = this.mouse, x = TouchInput.x, y = TouchInput.y;
            m.moved = x !== m.x || y !== m.y;
            m.x = x; m.y = y;
            m.click = TouchInput.isTriggered();
            m.cancel = TouchInput.isCancelled();
            m.down = TouchInput.isPressed();
        }
        setPhase(p) { this.phase = p; this.phaseT = 0; }
        // ---- for the subclasses
        createGame() {}
        begin() {}
        tick() {}
        frame() {}
        helpLines() { return []; }
        quitLabel() { return "Wyjdź z gry"; }
        quitResult() { return {}; }
        // logic steps this frame (turbo; a game may add its own - e.g. a rival hurried while O is held)
        ticksThisFrame() { return this.turbo; }
        // the tests' hook, called before every logic step with the scene (a game may keep its own, e.g. TavernDice.onTick)
        testHook() { return Scene_MiniGame.onTick; }
        dropTestHook() { Scene_MiniGame.onTick = null; }
        // pictures outside ImageManager (ui.loadBust, ui.safeBitmap) the scene waits for before it starts (a missing one: not waited for)
        preload(bitmap) {
            if (bitmap) (this._preloads = this._preloads || []).push(bitmap);
            return bitmap;
        }
        isReady() {
            return super.isReady() && (this._preloads || []).every(b => b.isReady() || b.isError());
        }
        state() {
            return { id: this.gameId, phase: this.phase, t: this.t, card: this.card ? this.card.kind : null, turbo: this.turbo, seed: this.seed,
                leaving: !!this.leaving, banner: this.banner.visible ? this.banner.title : null };
        }
        // P: the pause (go on / leave) - a subclass may take P for itself (return false to let it through to tick)
        onBack() {
            if (this.phase !== "play") return false;
            this.pause();
            return true;
        }
        se(key, volK, pitchAdd) {
            const s = ui.SOUNDS[key];
            if (s) T.audio.se(s[0], { volume: Math.round(s[1] * (volK === undefined ? 1 : volK)), pitch: s[2] + (pitchAdd || 0) });
            else T.audio.se(key, volK);
        }
        setTitle(title, sub, right, rightIcon) { this.titleBar.set(title, sub, right, rightIcon); }
        setHints(rows, right) { this.hints.set(rows, right); }
        showBusts(left, right) {
            if (left !== undefined) this.bustL.show(!!left, left || this.bustL.name);
            if (right !== undefined) this.bustR.show(!!right, right || this.bustR.name);
        }
        // ---- the cards on the overlay: info (O / a click closes it) and choice (up/down/left/right, O picks, P goes back)
        showCard(spec, onClose) {
            ui.drawCard(this.overlay.bitmap, spec);
            this.overlay.visible = true;
            this.card = { kind: "info", spec, onClose: onClose || spec.onClose || null, t: 0 };
        }
        showChoice(spec) {
            this.card = { kind: "choice", spec, index: spec.index || 0, t: 0, rects: [] };
            this.drawChoice();
            this.overlay.visible = true;
        }
        drawChoice() {
            const c = this.card;
            c.rects = ui.drawChoiceCard(this.overlay.bitmap, Object.assign({}, c.spec, { index: c.index }));
        }
        hideCard() {
            this.card = null;
            this.overlay.visible = false;
        }
        updateCard() {
            const c = this.card, m = this.mouse;
            c.t++;
            if (c.kind === "info") {
                if (c.t > 8 && (this.trig.ok || m.click)) {
                    this.se("ok");
                    const fn = c.onClose;
                    this.hideCard();
                    if (fn) fn.call(this);
                }
                return;
            }
            const n = (c.spec.options || []).length;
            if (m.moved || m.click) {
                const i = c.rects.findIndex(r => m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h);
                if (i >= 0 && i !== c.index) { c.index = i; this.se("cursor"); this.drawChoice(); }
                if (i >= 0 && m.click) return this.pickChoice(i);
            }
            if (this.rep.up || this.rep.left) { c.index = (c.index + n - 1) % n; this.se("cursor"); this.drawChoice(); }
            else if (this.rep.down || this.rep.right) { c.index = (c.index + 1) % n; this.se("cursor"); this.drawChoice(); }
            else if (this.trig.back || m.cancel) {
                this.se("cancel");
                const back = c.spec.cancel === undefined ? 0 : c.spec.cancel;
                if (back < 0) this.hideCard(); else this.pickChoice(back, true);
            } else if (c.t > 6 && this.trig.ok) this.pickChoice(c.index);
        }
        pickChoice(i, silent) {
            const c = this.card;
            if (!silent) this.se("ok");
            this.hideCard();
            if (c.spec.onPick) c.spec.onPick.call(this, i);
        }
        // the pause: the help of the game, go on or leave (the confirm-to-quit)
        pause() {
            this.se("cancel");
            this.showChoice({ title: "Pauza", lines: this.helpLines(), options: ["Gramy dalej", this.quitLabel()], cancel: 0,
                onPick: i => { if (i === 1) this.quit(); } });
        }
        askQuit(question) {
            this.showChoice({ title: question || "Przerwać grę?", options: ["Zostaję", "Wychodzę"], cancel: 0, onPick: i => { if (i === 1) this.quit(); } });
        }
        quit() { this.end(Object.assign({ aborted: true }, this.quitResult())); }
        // the end: the result to onEnd (on the map when the map is next, else at once), the scene fades out and goes
        end(result) {
            if (this.leaving) return;
            this.result = result || {};
            this.leaving = true;
            this.hideCard();
            ui.lastResult = this.result;
            const stack = SceneManager._stack, toMap = stack.length && stack[stack.length - 1] === Scene_Map;
            const done = { id: this.gameId, result: this.result, onEnd: this.opts.onEnd };
            if (toMap) pendingEnds.push(done); else deliver(done);
            this.startFadeOut(this.fadeSpeed(), false);
        }
        terminate() {
            super.terminate();
            Input.clear();
            TouchInput.clear();
            if (ui.running === this) ui.running = null;
        }
    }
    Scene_MiniGame.onTick = null;   // (tests: called every logic tick with the scene)
    window.Scene_MiniGame = Scene_MiniGame;
    ui.Scene_MiniGame = Scene_MiniGame;
    ui.open = (SceneClass, opts) => Scene_MiniGame.open(SceneClass, opts);
    ui.pendingResults = () => pendingEnds.length;
    T.register("TawernaUI", ui);
})();
