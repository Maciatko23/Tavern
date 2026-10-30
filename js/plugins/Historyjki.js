//=============================================================================
// Historyjki.js
//=============================================================================
// The illustrated stories of the ferry's travellers (docs/PODROZNI.md 8.2, stage 7 - 2026-10-29) - the PLAYER and the journal's tab;
// the data: Historyjki_Data.js, the words: js/teksty/historyjki.txt. A small film after the pattern of the prologue (Prologue.js):
//   - a story = shots over painted boards (img/pictures/Hist_<id>_<n>.png, 1280x720): the camera drifts (pan and zoom), fog / rain /
//     embers / smoke / dust / candle flicker drift over it, the words come as the chronicle's captions (a line "@Name: ..." is a
//     speaker's, with his plate). A board that is not there: the sepia (a dark painted ground) - the words and the effects stay.
//   - the boards are loaded before the first shot (Bitmap.load - no cache, no error screen for a missing file) and let go at the end.
//   - keys (the keyboard only): O / Enter - the next line, short P / Esc - the next shot, P held ~1.2 s - the whole story.
//   - once a game each, asked twice a second on the calm map (T.isCalm, no talk, no mini-game): the data's `gdy`; a thought over the
//     hero first ("Urszula chce coś opowiedzieć"), the story ~2 s later. Seen ones land in the Dziennik, the tab "Wspomnienia"
//     (O - once more); the state: Tawerna.state "historyjki" (version 1).
// API: window.Historyjki: play(id, { replay, onEnd }), seen(id), list(), info() (tests). The bus: historyjkaObejrzana { id, replay, all }.

/*:
 * @target MZ
 * @plugindesc [etap 7] Historyjki podróżnych: odtwarzacz (plansze z ruchem kamery, mgła, deszcz, iskry, napisy kroniki) i zakładka Dziennika „Wspomnienia”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Historyjki_Data
 * @orderAfter Journal
 *
 * @help
 * ============================================================================
 * Historyjki.js - historyjki ilustrowane (docs/PODROZNI.md 8.2)
 * ============================================================================
 * O / Enter - następna kwestia, krótko P / Esc - następne ujęcie, przytrzymane
 * P - cała historyjka. Obejrzane wracają w Dzienniku, zakładka „Wspomnienia”
 * (O - obejrzyj jeszcze raz). Plansze: img/pictures/Hist_<H1|H2|H3|H5>_<n>.png;
 * bez planszy - sepia z napisami. Skrypt: Historyjki.play("H1"), .info().
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.HistoryjkiData;
    if (!T || !window.Watki || !D) throw new Error("Historyjki.js: brak TawernaCore.js / Watki.js / Historyjki_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Historyjki";
    const L = D.LOOK, TX = D.TX, fill = Watki.wstaw;
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const store = T.state.define("historyjki", () => ({ seen: {}, order: [], count: 0, pending: "" }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const day = () => T.time.day();
    const report = (where, e) => console.error("[" + PLUGIN + "] " + where + ":", e);
    const listOf = v => (Array.isArray(v) ? v : v === undefined || v === null || v === "" ? [] : [v]);
    const get = path => path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), TX);
    const tx = (path, vars) => { const v = get(path); return typeof v === "string" ? (vars ? fill(v, vars) : v) : ""; };
    const storyOf = id => D.STORIES.find(s => s.id === id) || null;
    const FONT = '"TwProSerif", "EB Garamond", Georgia, serif', FONT_B = '"TwProBold", "Alegreya Sans", sans-serif';
    const UIS = (window.UIStyle && window.UIStyle.C) || { accent: "#ffd23f" };
    // "@Name: words" -> { who, text }
    const parse = line => { const m = /^@([^:]{1,30}):\s*([\s\S]+)$/.exec(line); return m ? { who: m[1], text: m[2] } : { who: "", text: line }; };
    const linesOf = (st, i) => listOf(get(st.id + ".s" + (i + 1))).map(parse);
    const api = { running: null, last: null };

    // ==================================================================
    // 1. The scene
    // ==================================================================
    const rnd = (a, b) => a + Math.random() * (b - a);
    const ease = t => t * t * (3 - 2 * t);
    function dot(w, h, color) { const b = new Bitmap(w, h); b.fillRect(0, 0, w, h, color); return b; }
    // a soft blob (fog, smoke): a radial gradient bitmap
    function blob(w, h, rgb, a) {
        const b = new Bitmap(w, h), c = b.context, g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
        g.addColorStop(0, "rgba(" + rgb + "," + a + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)");
        c.save(); c.scale(1, h / w); c.fillStyle = g; c.fillRect(0, 0, w, w); c.restore();
        b._baseTexture.update();
        return b;
    }
    function sepiaBoard(W, H) {
        const b = new Bitmap(W, H), c = b.context, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, D.SEPIA[0]); g.addColorStop(0.55, D.SEPIA[1]); g.addColorStop(1, D.SEPIA[2]);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        const v = c.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62);
        v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.55)");
        c.fillStyle = v; c.fillRect(0, 0, W, H);
        b._baseTexture.update();
        return b;
    }
    function wrap(ctx, text, maxW) {
        const words = String(text).split(/\s+/), out = [];
        let cur = "";
        for (const w of words) {
            const t = cur ? cur + " " + w : w;
            if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
        }
        if (cur) out.push(cur);
        return out;
    }

    function Scene_Historyjka() { this.initialize(...arguments); }
    Scene_Historyjka.prototype = Object.create(Scene_Base.prototype);
    Scene_Historyjka.prototype.constructor = Scene_Historyjka;
    Scene_Historyjka.prototype.prepare = function(opts) { this._opts = opts || {}; this._story = storyOf(this._opts.id); };
    Scene_Historyjka.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        const W = this._W = Graphics.width, H = this._H = Graphics.height, st = this._story;
        // the boards: loaded now, all at once (a missing file = no board = the sepia)
        this._boards = {};
        for (let n = 1; n <= (st ? st.boards : 0); n++) {
            try { this._boards[n] = Bitmap.load("img/pictures/Hist_" + st.id + "_" + n + ".png"); } catch (e) { this._boards[n] = null; }
        }
        this._sepia = sepiaBoard(W, H);
        this._world = new Sprite();
        this._board = new Sprite();
        this._world.addChild(this._board);
        this.addChild(this._world);
        this._fxLayer = new Sprite();
        this.addChild(this._fxLayer);
        this._glow = new Sprite(dot(W, H, "#ffb050"));
        this._glow.opacity = 0;
        this.addChild(this._glow);
        const vg = new Bitmap(W, H), c = vg.context, g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.66);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.6)");
        c.fillStyle = g; c.fillRect(0, 0, W, H); vg._baseTexture.update();
        this.addChild(new Sprite(vg));
        this._text = new Sprite(new Bitmap(W, H));
        this.addChild(this._text);
        const bars = new Sprite(new Bitmap(W, H));
        bars.bitmap.fillRect(0, 0, W, L.BAR, "#000000");
        bars.bitmap.fillRect(0, H - L.BAR, W, L.BAR, "#000000");
        this.addChild(bars);
        this._skipSp = new Sprite(new Bitmap(360, L.BAR));
        this._skipSp.x = W - 360;
        this.addChild(this._skipSp);
        this._skipKey = "";
        this._black = new Sprite(dot(W, H, "#000000"));
        this.addChild(this._black);
        this._phase = "load";
        this._t = 0; this._holdT = 0; this._hintT = 0; this._ignore = 12; this._ending = false;
        this._log = [];
        this._shotI = -1;
    };
    Scene_Historyjka.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        try { AudioManager.playSe({ name: "Book1", volume: 70, pitch: 90, pan: 0 }); } catch (e) { /* no sound */ }
    };
    Scene_Historyjka.prototype.terminate = function() {
        Scene_Base.prototype.terminate.call(this);
        for (const n in this._boards) { const b = this._boards[n]; if (b && b.destroy) { try { b.destroy(); } catch (e) { /* gone */ } } }   // (let go of the boards)
        this._boards = {};
        if (this._sepia && this._sepia.destroy) this._sepia.destroy();
        api.running = null;
        const o = this._opts || {};
        api.last = { id: o.id, log: this._log.slice(), skipped: this._skipped || 0, all: !!this._skippedAll, sepia: this._usedSepia || 0, boards: this._usedBoard || 0 };
        try { T.emit("historyjkaObejrzana", { id: o.id, replay: !!o.replay, all: !!this._skippedAll }); } catch (e) { report("szyna", e); }
        if (typeof o.onEnd === "function") { try { o.onEnd(api.last); } catch (e) { report("onEnd", e); } }
    };
    // all boards either ready or failed (a bitmap that never answers: after 4 s the sepia)
    Scene_Historyjka.prototype.boardsSettled = function() {
        if (this._t > 240) return true;
        return Object.values(this._boards).every(b => !b || b.isReady() || b.isError());
    };
    Scene_Historyjka.prototype.boardOf = function(n) {
        const b = this._boards[n] || this._boards[1];
        return b && b.isReady() && !b.isError() ? b : null;
    };
    Scene_Historyjka.prototype.beginShot = function(i) {
        const st = this._story;
        this._fxLayer.removeChildren();
        this._fx = [];
        if (i >= st.shots.length) { this.finish(); return; }
        this._shotI = i;
        const sh = st.shots[i];
        this._log.push(i + 1);
        const real = this.boardOf(sh.board);
        if (real) this._usedBoard = (this._usedBoard || 0) + 1; else this._usedSepia = (this._usedSepia || 0) + 1;
        this._board.bitmap = real || this._sepia;
        this._cover = Math.max(this._W / this._board.bitmap.width, this._H / this._board.bitmap.height);
        this._lines = linesOf(st, i);
        if (!this._lines.length) this._lines = [{ who: "", text: "" }];
        this._lineI = 0;
        this._lineT = 0;
        this._lineLen = this.lineLen(this._lines[0]);
        this._shotT = 0;
        this._shotLen = Math.max(sh.len, this._lines.reduce((a, l) => a + this.lineLen(l), 0) + L.pause);
        this._out = 0;
        this._cardT = i === 0 ? 150 : 0;   // (the title card on the first shot)
        for (const kind of sh.fx || []) this.makeFx(kind);
        this.drawCaption();
        this.applyCam(0);
    };
    Scene_Historyjka.prototype.lineLen = function(l) { return Math.max(L.minLine, Math.round(String(l.text).length * L.perChar)); };
    // ---- the camera: [centre x, centre y (0-1), zoom] drifting between two; the board always covers the screen
    Scene_Historyjka.prototype.applyCam = function(k) {
        const sh = this._story.shots[this._shotI], a = sh.cam[0], b = sh.cam[1], e = ease(Math.max(0, Math.min(1, k)));
        const cx = a[0] + (b[0] - a[0]) * e, cy = a[1] + (b[1] - a[1]) * e, z = a[2] + (b[2] - a[2]) * e;
        const bm = this._board.bitmap, sc = this._cover * z, w = bm.width * sc, h = bm.height * sc;
        this._board.scale.set(sc, sc);
        this._board.x = Math.min(0, Math.max(this._W - w, this._W / 2 - cx * w));
        this._board.y = Math.min(0, Math.max(this._H - h, this._H / 2 - cy * h));
    };
    // ---- the effects (screen space; a handful of sprites each)
    Scene_Historyjka.prototype.makeFx = function(kind) {
        const W = this._W, H = this._H, add = (sp, d) => { Object.assign(sp, d); this._fxLayer.addChild(sp); this._fx.push(sp); return sp; };
        if (kind === "mist" || kind === "smoke") {
            const rgb = kind === "mist" ? "225,228,235" : "60,55,52", bmp = blob(520, 220, rgb, kind === "mist" ? 0.34 : 0.4);
            for (let i = 0; i < 7; i++) add(new Sprite(bmp), { x: rnd(-200, W), y: rnd(H * 0.35, H * 0.85), _kind: kind, _vx: rnd(0.12, 0.4) * (kind === "mist" ? 1 : 0.6), _vy: kind === "smoke" ? -rnd(0.1, 0.35) : 0, _ph: rnd(0, 6.28), opacity: 0 });
        } else if (kind === "rain") {
            const bmp = dot(2, 18, "rgba(190,205,225,0.55)");
            for (let i = 0; i < 80; i++) add(new Sprite(bmp), { x: rnd(0, W), y: rnd(0, H), _kind: "rain", _vx: -1.6, _vy: rnd(13, 19), rotation: 0.11 });
        } else if (kind === "embers") {
            const bmp = dot(3, 3, "#ffb04a");
            for (let i = 0; i < 36; i++) add(new Sprite(bmp), { x: rnd(0, W), y: rnd(H * 0.3, H), _kind: "embers", _vx: rnd(-0.3, 0.5), _vy: -rnd(0.5, 1.6), _ph: rnd(0, 6.28) });
        } else if (kind === "dust") {
            const bmp = dot(2, 2, "rgba(235,225,200,0.6)");
            for (let i = 0; i < 28; i++) add(new Sprite(bmp), { x: rnd(0, W), y: rnd(0, H), _kind: "dust", _vx: rnd(0.1, 0.5), _vy: rnd(-0.1, 0.2), _ph: rnd(0, 6.28) });
        } else if (kind === "candle") this._candle = true;
    };
    Scene_Historyjka.prototype.updateFx = function() {
        const W = this._W, H = this._H, t = this._t;
        for (const s of this._fx) {
            if (s._kind === "mist" || s._kind === "smoke") {
                s.x += s._vx; s.y += s._vy + Math.sin(t / 90 + s._ph) * 0.06;
                if (s.x > W) s.x = -520;
                if (s.y < H * 0.2) s.y = H * 0.85;
                s.opacity = Math.min(255, s.opacity + 3);
            } else if (s._kind === "rain") {
                s.x += s._vx; s.y += s._vy;
                if (s.y > H) { s.y = -20; s.x = rnd(0, W + 40); }
            } else if (s._kind === "embers") {
                s.x += s._vx + Math.sin(t / 30 + s._ph) * 0.4; s.y += s._vy;
                s.opacity = 140 + Math.sin(t / 8 + s._ph) * 100;
                if (s.y < -6) { s.y = H + 4; s.x = rnd(0, W); }
            } else if (s._kind === "dust") {
                s.x += s._vx; s.y += s._vy + Math.sin(t / 50 + s._ph) * 0.15;
                s.opacity = 120 + Math.sin(t / 25 + s._ph) * 80;
                if (s.x > W) s.x = 0;
            }
        }
        this._glow.opacity = this._candle ? 16 + Math.sin(t / 7) * 6 + Math.sin(t / 3.1) * 4 : 0;
    };
    // ---- the captions: a dark strip over the lower board, the speaker's plate, the chronicle's serif
    Scene_Historyjka.prototype.drawCaption = function() {
        const b = this._text.bitmap, c = b.context, W = this._W, H = this._H;
        b.clear();
        const l = this._lines[this._lineI];
        if (this._cardT > 0) {
            const st = this._story;
            c.save();
            c.textAlign = "center"; c.textBaseline = "middle";
            c.fillStyle = UIS.accent; c.font = "bold 44px " + FONT; c.shadowColor = "#000"; c.shadowBlur = 8;
            c.fillText(tx(st.id + ".title"), W / 2, H / 2 - 60);
            c.fillStyle = "#cfc6b4"; c.font = "24px " + FONT;
            c.fillText(tx("zakladka.opowiada", { kto: tx(st.id + ".who") }), W / 2, H / 2 - 10);
            c.restore();
        }
        if (l && l.text && this._cardT < 70) {
            c.save();
            c.font = "27px " + FONT;
            const maxW = W - 280, rows = wrap(c, l.text, maxW), lh = 36, ph = rows.length * lh + 30 + (l.who ? 26 : 0), py = H - L.BAR - 14 - ph;
            const g = c.createLinearGradient(0, py - 40, 0, py + ph);
            g.addColorStop(0, "rgba(8,6,4,0)"); g.addColorStop(0.35, "rgba(8,6,4,0.72)"); g.addColorStop(1, "rgba(8,6,4,0.85)");
            c.fillStyle = g; c.fillRect(0, py - 40, W, ph + 40);
            let y = py + 24;
            if (l.who) { c.font = "bold 22px " + FONT_B; c.fillStyle = UIS.accent; c.textAlign = "left"; c.fillText(l.who.toUpperCase(), 140, y); y += 28; }
            c.font = "27px " + FONT; c.fillStyle = "#ece6da"; c.textAlign = "left"; c.shadowColor = "#000"; c.shadowBlur = 4;
            for (const r of rows) { c.fillText(r, 140, y); y += lh; }
            c.restore();
        }
        b._baseTexture.update();
    };
    // ---- skipping (as the prologue's): O - next line, short P - next shot, P held - all
    Scene_Historyjka.prototype.updateSkip = function() {
        const held = Input.isPressed("escape") || Input.isPressed("cancel");
        if ((Input._latestButton && Input._pressedTime === 0) || TouchInput.isTriggered()) this._hintT = 180;
        if (this._hintT > 0) this._hintT--;
        if (this._ignore > 0) { this._ignore--; this._holdT = held ? L.hold + 1 : 0; return; }
        if (held) {
            this._holdT++;
            if (this._holdT === L.hold) this.skipAll();
        } else {
            if (this._holdT > 0 && this._holdT < L.hold) this.skipShot();
            this._holdT = 0;
        }
        if (TouchInput.isCancelled()) this.skipShot();
    };
    Scene_Historyjka.prototype.drawSkip = function() {
        const k = Math.min(1, this._holdT / L.hold), bright = this._hintT > 0 || this._holdT > 0, key = Math.round(k * 40) + "|" + bright;
        if (key === this._skipKey) return;
        this._skipKey = key;
        const b = this._skipSp.bitmap, c = b.context, cx = 330, cy = 28;
        b.clear();
        c.save();
        c.globalAlpha = bright ? 1 : 0.45;
        c.lineWidth = 2; c.strokeStyle = "rgba(90,92,100,0.9)"; c.beginPath(); c.arc(cx, cy, 11, 0, Math.PI * 2); c.stroke();
        if (k > 0) { c.strokeStyle = UIS.accent; c.beginPath(); c.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke(); }
        c.font = "bold 13px " + FONT_B; c.fillStyle = "#ece6da"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("P", cx, cy + 1);
        c.font = "15px " + FONT_B; c.fillStyle = "#b8b0a2"; c.textAlign = "right"; c.fillText(tx("odtwarzacz.pomin"), cx - 20, cy);
        c.restore();
        b._baseTexture.update();
    };
    Scene_Historyjka.prototype.skipShot = function() {
        if (this._ending || this._out || this._phase !== "play") return;
        SoundManager.playCursor();
        this._skipped = (this._skipped || 0) + 1;
        this._out = 1;
    };
    Scene_Historyjka.prototype.skipAll = function() {
        if (this._ending) return;
        SoundManager.playOk();
        this._skippedAll = true;
        this.finish();
    };
    Scene_Historyjka.prototype.finish = function() {
        if (this._ending) return;
        this._ending = true;
        this._endT = 0;
    };
    // O: the next line (or, on the last, the next shot)
    Scene_Historyjka.prototype.nextLine = function() {
        if (this._cardT > 70) { this._cardT = 70; this.drawCaption(); return; }
        if (this._lineI + 1 < this._lines.length) {
            this._lineI++; this._lineT = 0; this._lineLen = this.lineLen(this._lines[this._lineI]); this.drawCaption();
        } else if (!this._out) this._out = 1;
    };
    Scene_Historyjka.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        this._t++;
        if (this._ending) {   // fade to black, then back to the scene beneath
            this._black.opacity = Math.min(255, this._black.opacity + 255 / L.fadeOut);
            if (++this._endT > L.fadeOut + 4) SceneManager.pop();
            return;
        }
        this.updateSkip();
        this.drawSkip();
        if (this._phase === "load") {
            if (this._t > 4 && this.boardsSettled()) { this._phase = "play"; this.beginShot(0); }
            return;
        }
        this.updateFx();
        const ok = (Input.isTriggered("ok") || TouchInput.isTriggered()) && this._ignore <= 0;
        if (this._out) {   // leaving the shot: black in, then the next
            this._black.opacity = Math.min(255, this._black.opacity + 255 / L.fadeOut);
            if (this._black.opacity >= 255) this.beginShot(this._shotI + 1);
            return;
        }
        this._black.opacity = Math.max(0, this._black.opacity - 255 / L.fadeIn);
        this._shotT++;
        if (this._cardT > 0) { this._cardT--; if (this._cardT === 70 || this._cardT === 0) this.drawCaption(); }
        else {
            this._lineT++;
            if (ok && this._lineT > 20) this.nextLine();
            else if (this._lineT >= this._lineLen) {
                if (this._lineI + 1 < this._lines.length) this.nextLine();
                else if (this._lineT >= this._lineLen + L.pause) this._out = 1;
            }
        }
        if (ok && this._cardT > 70) this.nextLine();
        this.applyCam(this._shotT / this._shotLen);
    };
    Scene_Historyjka.prototype.isReady = function() { return Scene_Base.prototype.isReady.call(this); };

    // ==================================================================
    // 2. Playing: the state, the bus
    // ==================================================================
    function play(id, o) {
        const st = storyOf(id), opts = Object.assign({}, o || {});
        if (!st || !has() || !(SceneManager._scene instanceof Scene_Map || opts.from) || SceneManager.isSceneChanging() || api.running) return false;
        if (!opts.replay && S().seen[id]) return false;
        if (!opts.replay) {
            S().seen[id] = day();
            S().count++;
            (S().order = S().order || []).push(id);
            S().pending = "";
            T.popup(tx("napis.nowa", { tytul: tx(id + ".title") }), { top: true, color: "#ffe27a" });
        }
        api.running = id;
        SceneManager.push(Scene_Historyjka);
        SceneManager.prepareNextScene(Object.assign(opts, { id }));
        return true;
    }

    // ==================================================================
    // 3. The moments: asked twice a second on the calm map; once a game each
    // ==================================================================
    let ticks = 0;
    let auto = true;   // (the tests' quiet mode: no story begins by itself - Historyjki.auto(false))
    function tick() {
        if (!auto) return;
        if (!has() || api.running || !(SceneManager._scene instanceof Scene_Map)) return;
        const s = S();
        if (s.pending) {   // the thought was told: the story ~2 s after (when still calm)
            if (Graphics.frameCount < (api.dueAt || 0) || !T.isCalm(SceneManager._scene) || T.miniGameRunning()) return;
            const id = s.pending;
            if (!play(id)) s.pending = "";
            return;
        }
        if (!T.isCalm(SceneManager._scene) || T.miniGameRunning() || $gameMap.isEventRunning()) return;
        for (const st of D.STORIES) {
            if (s.seen[st.id]) continue;
            let go = false;
            try { go = !!st.gdy(); } catch (e) { report("wyzwalacz " + st.id, e); }
            if (!go) continue;
            s.pending = st.id;
            api.dueAt = Graphics.frameCount + 150;
            const m = tx(st.id + ".mysl");
            if (m) T.popup(m, { color: "#eceef0" });
            return;
        }
    }
    T.onMapUpdate(() => { if (++ticks % 30 === 0) { try { tick(); } catch (e) { report("tick", e); } } }, { owner: PLUGIN, name: "historyjki" });

    // ==================================================================
    // 4. The journal's tab "Wspomnienia"
    // ==================================================================
    function tabItems() {
        const seen = has() ? S().seen : {}, rows = D.STORIES.filter(st => seen[st.id]).sort((a, b) => (S().order || []).indexOf(b.id) - (S().order || []).indexOf(a.id))
            .map(st => ({ label: tx(st.id + ".title"), mark: "done", right: "dz. " + seen[st.id], story: st.id }));
        return rows.length ? rows : [{ label: tx("zakladka.pusto"), mark: "locked", dim: true, empty: true }];
    }
    function tabDetail(it) {
        if (!it || it.empty) return { ops: [{ k: "title", text: tx("zakladka.tytul") }, { k: "rule" }, { k: "p", text: tx("zakladka.puste") }] };
        const st = storyOf(it.story), ops = [{ k: "title", text: tx(st.id + ".title") },
            { k: "sub", text: tx("zakladka.opowiada", { kto: tx(st.id + ".who") }) + "  ·  " + tx("zakladka.dzien", { dzien: S().seen[st.id] }) }, { k: "rule" }];
        for (let i = 0; i < st.shots.length; i++) for (const l of linesOf(st, i)) ops.push({ k: "p", text: (l.who ? l.who + ": " : "") + l.text });
        ops.push({ k: "muted", text: tx("zakladka.powtorz") });
        return { ops };
    }
    function tabOk(it) {
        if (!it || !it.story) return false;
        return play(it.story, { replay: true, from: "journal" });
    }
    (function addTab() {
        const J = T.api("Journal") || window.Journal;
        if (!J || !J.addTab || (J.TABS || []).includes(D.TAB)) return;
        // (the words are read when drawn: the texts of js/teksty come in after the plugins)
        const def = { name: D.TAB, items: () => tabItems(), detail: it => tabDetail(it), ok: it => tabOk(it), okWord: "obejrzyj",
            legend: () => tx("zakladka.legenda", { n: Object.keys(has() ? S().seen : {}).length, m: D.STORIES.length }) };
        Object.defineProperty(def, "help", { get: () => tx("zakladka.pomoc"), enumerable: true });
        J.addTab(def);
    })();

    window.Historyjki = T.register(PLUGIN, Object.assign(api, {
        auto: on => { if (on !== undefined) auto = on !== false; return auto; },
        D, play, Scene_Historyjka, seen: id => (has() ? S().seen[id] || 0 : 0), list: () => D.STORIES.map(s => s.id), state: () => S(), tick,
        info: () => {
            const s = SceneManager._scene;
            if (!(s instanceof Scene_Historyjka)) return null;
            return { id: s._opts.id, phase: s._phase, shot: s._shotI, shots: s._story.shots.length, line: s._lineI, lines: s._lines ? s._lines.length : 0, card: s._cardT,
                sepia: s._board && s._board.bitmap === s._sepia, ending: !!s._ending, fx: s._fx ? s._fx.length : 0, hold: s._holdT, text: s._lines && s._lines[s._lineI] ? s._lines[s._lineI].text : "",
                cam: s._board ? [Math.round(s._board.x), Math.round(s._board.y), +s._board.scale.x.toFixed(3)] : null };
        }
    }));
})();
