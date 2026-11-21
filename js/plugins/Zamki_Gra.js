//=============================================================================
// Zamki_Gra.js
//=============================================================================
// (2026-11-19, the user: "a do wkradania i otwierania zamków może na ekranie jakaś mini gra mądra z zamkiem i wytrychem?" - chosen:
// "Zapadki" for the locks, and a mini-game of their own for the traps)
//   - THE LOCK (Zapadki): the lock cut open - its pins (a lock's level + 1: two in a simple one, six in the Order's), each a brass key
//     pin under a steel driver pin on a spring; the shear line between the plug and the body. A / D: the pick under the next pin;
//     W held: the pin goes up (let go: it drops); O: set it - right only with the gap between its two parts at the line AND it the
//     pin that binds now (they bind in their own order, the same every time for that lock - the binding one goes up stiffly, slower and
//     shaking; with a sharp eye - Percepcja 8 - it clicks too). A set too high or too low, or a pin that does not bind yet: strain on
//     the pick; full strain: the pick snaps (one lockpick gone, every pin down). All set: the lock gives. P: let go (the pins drop).
//     Higher locks: more pins, quicker, shaking more, a narrower line; Zręczność widens it and lessens the strain.
//   - THE TRAP: the spring plate and the jaws (Sprężyna) - the needle jerks with the spring, A / D hold it in the green while the bar
//     fills; out of the green the danger fills - full: the trap goes off. The tripwire (Linka) - the bells sway and go quiet now and
//     then: O cuts, right only in the quiet; two cuts in the ringing - the bells ring out (the trap is sprung).
//   - THE WORLD GOES ON: it is drawn over the map (not a scene of its own) - the people walk, look, may see him at it (Zamki's rules);
//     the hero does not move, the menu does not open, Tawerna.miniGameRunning() is true while it is up.
// Used by Zamki.js (begin) and Pulapki.js (the traps' task). API: window.ZamkiGra.

/*:
 * @target MZ
 * @plugindesc Mini-gry wytrycha: zapadki zamka (A/D, W, O), rozbrajanie pułapek (sprężyna: wskazówka w zielonym; linka: cięcie w ciszy dzwonków). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Zamki
 *
 * @help
 * ============================================================================
 * Zamki_Gra.js - mini-gry wytrycha i rozbrajania
 * ============================================================================
 * Zamek: A/D - wybór zapadki, W (trzymaj) - podważ, O - osadź na linii,
 * P - puść. Zapadki trzeba osadzać w ich kolejności: ta, która blokuje,
 * idzie ciężko i drży. Pomyłka napina wytrych, za mocno napięty pęka.
 * Pułapka (kolce, wnyk): A/D trzymaj wskazówkę w zielonym polu.
 * Linka z dzwonkami: O - przetnij, gdy dzwonki ucichną.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Zamki_Gra";
    const T = window.Tawerna;
    if (!T) throw new Error("Zamki_Gra.js: brak TawernaCore.js (the Tawerna core is missing)");

    const W = 560, H = 300, S = 2;   // (the panel; the pictures at 2x, as the game's tiles and sprites)
    // the sheet img/system/Zamki_Gra.png (PixelLab, tools/art/zamki/atlas.py): the parts' rectangles; geo - the lock's lines in the body's
    // own pixels: chamberTop (the springs hang from), line (the shear line), keyTop (the keyway's top), firstCx / seg (the chambers)
    const ART = {"rects": {"bodyL": [0, 0, 59, 80], "bodySeg": [0, 82, 20, 80], "bodyR": [0, 164, 29, 80], "keyTop": [0, 246, 6, 3], "keyMid": [0, 251, 6, 1], "keyTip": [0, 254, 6, 7], "driver": [0, 263, 8, 19], "spring": [0, 284, 8, 36], "pickHandle": [0, 322, 43, 12], "pickShaft": [0, 336, 1, 12], "pickTip": [0, 350, 11, 12], "wrench": [0, 364, 31, 13], "gauge": [0, 379, 52, 52], "bell": [0, 433, 21, 35]}, "geo": {"top": 15, "chamberTop": 20, "line": 56, "keyTop": 72, "firstCx": 49.0, "seg": 20, "cut1": 59, "chamberW": 11, "gaugeHub": [26, 26]}};
    const C = { yel: 0xffd23f, ink: 0x000000, body: 0x5a4320, bodyHi: 0x7a5c2c, plug: 0xb08d3c, plugHi: 0xd2ad55, steel: 0x9aa4ad, steelHi: 0xd4dbe0,
        brass: 0xc9a046, brassHi: 0xeccb72, slot: 0x1a130b, good: 0x7fd36a, bad: 0xff6a50, green: 0x3f8f3a, greenHi: 0x7fd36a };
    const LOCK = {
        win: { 1: 4.5, 2: 3.8, 3: 3.2, 4: 2.7, 5: 2.3 },       // the line's half-width (px), Zręczność 5
        rise: { 1: 0.42, 2: 0.5, 3: 0.58, 4: 0.66, 5: 0.74 },  // px a frame while W is held
        shake: { 1: 0, 2: 0.4, 3: 0.8, 4: 1.2, 5: 1.6 },       // px the binding pin trembles going up
        cost: { 1: 0.24, 2: 0.28, 3: 0.32, 4: 0.36, 5: 0.4 },  // strain a miss (half for a pin that does not bind yet)
        stiff: 0.6, fall: 1.4, decay: 0.0012, over: 10, perHint: 8
    };
    const TRAP = { zone: 0.26, push: 0.0045, damp: 0.92, jerk: [0.035, 0.07], jerkGap: [18, 46], dangerIn: 1 / 70, dangerOut: 1 / 240 };
    const BELL = { ring: [80, 150], quiet: [26, 44], misses: 2 };
    const TXT = {
        help: "A/D zapadka   W (trzymaj) podważ   O osadź   P puść",
        helpTrap: "A/D trzymaj wskazówkę w zielonym   P puść",
        helpBell: "O przetnij, gdy dzwonki ucichną   P puść",
        high: "Za wysoko!", low: "Za nisko!", notBinding: "Nie trzyma - blokuje inna.", set: "Osadzona.", snap: "Wytrych pękł!",
        strain: "Napięcie", picks: "Wytrychy: {n}", misses: "Pomyłki", progress: "Postęp", danger: "Pęknie", quiet: "cisza", ringing: "dzwonią"
    };
    const rndIn = (a, b) => a + Math.random() * (b - a);
    function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; }
    const se = (n, v, p) => T.audio.se(n, { volume: v, pitch: p });
    const keyHeld = k => Input.isPressed(k), keyHit = k => Input.isRepeated(k);

    let game = null, enabled = true;

    // ==================================================================
    // The lock: the pins
    // ==================================================================
    class LockGame {
        constructor(o) {
            this.o = o; this.kind = "lock"; this.t = 0;
            this.level = Math.max(1, Math.min(5, o.level || 1)); this.n = this.level + 1;
            const r = rng(hashStr(String(o.seed || "zamek")));
            this.order = [...Array(this.n).keys()];
            for (let i = this.n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [this.order[i], this.order[j]] = [this.order[j], this.order[i]]; }
            this.pins = [...Array(this.n)].map(() => ({ len: 10 + Math.floor(r() * 4), y: 0, set: false, shake: 0 }));   // (len: the key pin, the picture's px; need = 2 x (18 - len))
            this.k = 0; this.sel = 0; this.strain = 0; this.msg = ""; this.msgT = 0; this.msgGood = false; this.done = false;
            const dx = (o.dex || 5) - 5;
            this.win = Math.max(1.6, LOCK.win[this.level] + 0.22 * dx);
            this.cost = LOCK.cost[this.level] * Math.max(0.6, 1 - 0.03 * dx);
        }
        need(i) { return S * (ART.geo.keyTop + 2 - ART.geo.line - this.pins[i].len); }   // (screen px: the gap's way up to the line)
        binding() { return this.order[this.k]; }
        say(m, good) { this.msg = m; this.msgT = 70; this.msgGood = !!good; }
        // the pin at the line: set if it binds; a miss otherwise
        trySet() {
            const i = this.sel, p = this.pins[i];
            if (p.set || this.done) return "none";
            const d = (p.y + p.shake) - this.need(i);
            if (Math.abs(d) <= this.win && i === this.binding()) {
                p.set = true; p.y = this.need(i); p.shake = 0; this.k++;
                se("Cursor2", 60, 150); this.say(TXT.set, true);
                if (this.o.onClick) this.o.onClick();
                if (this.k >= this.n) { this.done = true; se("Open1", 70, 130); this.o.onDone(); }
                return "set";
            }
            const binds = Math.abs(d) <= this.win;
            this.strain += this.cost * (binds ? 0.5 : 1);
            this.say(binds ? TXT.notBinding : d > 0 ? TXT.high : TXT.low);
            se("Cursor1", 50, 70);
            if (this.o.onClick) this.o.onClick();
            if (this.strain >= 1) this.snap();
            return "miss";
        }
        snap() {
            this.strain = 0; this.k = 0;
            for (const p of this.pins) { p.set = false; p.y = 0; p.shake = 0; }
            this.say(TXT.snap);
            se("Hammer", 60, 150);
            if (!this.o.onBreak()) close("broke");
        }
        update() {
            this.t++;
            if (this.msgT > 0) this.msgT--;
            this.strain = Math.max(0, this.strain - LOCK.decay);
            if (this.done) return;
            const ready = this.t > 3;   // (the key that opened the game is not taken as a move in it)
            if (ready && keyHit("left")) { this.sel = (this.sel + this.n - 1) % this.n; se("Cursor1", 25, 140); }
            if (ready && keyHit("right")) { this.sel = (this.sel + 1) % this.n; se("Cursor1", 25, 140); }
            const up = ready && keyHeld("up");
            this.pins.forEach((p, i) => {
                if (p.set) return;
                const stiff = i === this.binding();
                if (up && i === this.sel) {
                    p.y = Math.min(this.need(i) + LOCK.over + 8, p.y + LOCK.rise[this.level] * (stiff ? LOCK.stiff : 1));
                    p.shake = stiff ? Math.sin(this.t * 0.9) * LOCK.shake[this.level] : 0;
                    if (stiff && (this.o.per || 5) >= LOCK.perHint && Math.abs(p.y - this.need(i)) < 0.6) se("Cursor3", 18, 180);   // (a sharp ear: it clicks)
                } else { p.y = Math.max(0, p.y - LOCK.fall); p.shake = 0; }
            });
            if (ready && Input.isTriggered("ok")) this.trySet();
            if (ready && (Input.isTriggered("escape") || Input.isTriggered("cancel"))) close("quit");
        }
        // the tests: the binding pin put at its line
        cheatLift(i) { const p = this.pins[i]; p.y = this.need(i); p.shake = 0; this.sel = i; }
    }

    // ==================================================================
    // The traps: the spring (needle in the green), the bells (cut in the quiet)
    // ==================================================================
    class SpringGame {
        constructor(o) {
            this.o = o; this.kind = "spring"; this.t = 0;
            const dx = (o.dex || 5) - 5, deep = Math.max(1, o.depth || 1);
            this.zone = Math.max(0.14, TRAP.zone + 0.012 * dx - 0.002 * Math.min(40, deep));
            this.jerk = [TRAP.jerk[0] * (1 + deep / 60), TRAP.jerk[1] * (1 + deep / 60)];
            this.x = 0; this.v = 0; this.next = 30; this.prog = 0; this.danger = 0; this.done = false;
            this.secs = Math.max(1.5, o.secs || 3);
        }
        update() {
            this.t++;
            if (this.done) return;
            const ready = this.t > 3;
            if (--this.next <= 0) { this.v += (Math.random() < 0.5 ? -1 : 1) * rndIn(this.jerk[0], this.jerk[1]); this.next = Math.round(rndIn(TRAP.jerkGap[0], TRAP.jerkGap[1])); se("Cursor1", 15, 60); }
            if (ready && keyHeld("left")) this.v -= TRAP.push;
            if (ready && keyHeld("right")) this.v += TRAP.push;
            this.v *= TRAP.damp;
            this.x = Math.max(-1, Math.min(1, this.x + this.v));
            if (Math.abs(this.x) >= 1) this.v = 0;
            if (Math.abs(this.x) <= this.zone) { this.prog += 1 / (this.secs * 60); this.danger = Math.max(0, this.danger - TRAP.dangerOut); }
            else this.danger += TRAP.dangerIn;
            if (this.prog >= 1) { this.done = true; this.o.onDone(); return; }
            if (this.danger >= 1) { this.done = true; this.o.onFail(); return; }
            if (ready && (Input.isTriggered("escape") || Input.isTriggered("cancel"))) close("quit");
        }
    }
    class BellGame {
        constructor(o) {
            this.o = o; this.kind = "bells"; this.t = 0;
            this.phase = "ring"; this.left = Math.round(rndIn(BELL.ring[0], BELL.ring[1])); this.misses = 0; this.done = false; this.amp = 1;
            const dx = (o.dex || 5) - 5;
            this.quietLen = BELL.quiet.map(v => Math.max(16, v + 2 * dx));
        }
        update() {
            this.t++;
            if (this.done) return;
            if (--this.left <= 0) {
                this.phase = this.phase === "ring" ? "quiet" : "ring";
                this.left = Math.round(this.phase === "ring" ? rndIn(BELL.ring[0], BELL.ring[1]) : rndIn(this.quietLen[0], this.quietLen[1]));
            }
            this.amp += ((this.phase === "ring" ? 1 : 0) - this.amp) * 0.12;
            if (this.phase === "ring" && this.t % 26 === 0) se("Bell1", 14, 170 + Math.floor(Math.random() * 20));
            const ready = this.t > 3;
            if (ready && Input.isTriggered("ok")) {
                if (this.amp < 0.25) { this.done = true; se("Sword1", 60, 140); this.o.onDone(); return; }
                this.misses++;
                se("Bell2", 60, 150);
                if (this.o.onNoise) this.o.onNoise();
                if (this.misses >= BELL.misses) { this.done = true; this.o.onFail(); return; }
            }
            if (ready && (Input.isTriggered("escape") || Input.isTriggered("cancel"))) close("quit");
        }
    }

    // ==================================================================
    // The panel over the map
    // ==================================================================
    function textBitmap() { const b = new Bitmap(W, H); b.fontFace = $gameSystem.mainFontFace(); return b; }
    const sheet = () => ImageManager.loadSystem("Zamki_Gra");
    function part(name, x, y, ax, ay) {
        const r = ART.rects[name], sp = new Sprite(sheet());
        sp.setFrame(r[0], r[1], r[2], r[3]);
        sp.anchor.set(ax || 0, ay || 0);
        sp.x = x || 0; sp.y = y || 0;
        return sp;
    }
    class Panel extends PIXI.Container {
        constructor() {
            super();
            this.bg = new PIXI.Graphics(); this.addChild(this.bg);
            this.art = new PIXI.Container(); this.art.scale.set(S, S); this.addChild(this.art);   // (the pictures, at 2x)
            this.fx = new PIXI.Graphics(); this.addChild(this.fx);                                // (the marks over them, at 1x)
            this.txt = new Sprite(textBitmap()); this.addChild(this.txt);
            this.sig = ""; this.built = null;
            const g = this.bg;
            g.beginFill(0x0b0806, 1); g.drawRect(0, 0, W, H); g.endFill();
            g.lineStyle(3, C.yel, 1); g.drawRect(1.5, 1.5, W - 3, H - 3); g.lineStyle(0);
            g.lineStyle(1, C.yel, 0.35); g.drawRect(6.5, 6.5, W - 13, H - 13); g.lineStyle(0);
        }
        place() { this.x = Math.round((Graphics.width - W) / 2); this.y = Math.round(Graphics.height - H - 84); }
        // the pictures of a game, made once when it opens
        build(s) {
            this.built = s;
            this.art.removeChildren().forEach(c => c.destroy && c.destroy());
            this.parts = {};
            if (s.kind === "lock") this.buildLock(s); else if (s.kind === "spring") this.buildSpring(s); else this.buildBells(s);
        }
        buildLock(s) {
            const G0 = ART.geo, n = s.n, lockW = ART.rects.bodyL[2] + G0.seg * (n - 1) + ART.rects.bodyR[2];
            const handleW = ART.rects.pickHandle[2], left = Math.round((W / S - (handleW + 8 + lockW)) / 2) + handleW + 8, top = 30;
            const a = this.art;
            a.x = left * S; a.y = top * S - G0.top * 0;   // (the body's own y 0 is its top)
            a.addChild(part("bodyL", 0, 0));
            for (let j = 0; j < n - 1; j++) a.addChild(part("bodySeg", ART.rects.bodyL[2] + G0.seg * j, 0));
            a.addChild(part("bodyR", ART.rects.bodyL[2] + G0.seg * (n - 1), 0));
            const ch = G0.chamberTop - G0.top, line = G0.line - G0.top, key = G0.keyTop - G0.top;
            this.geo = { ch, line, key, lockW, cx: i => G0.firstCx + G0.seg * i };
            this.pins = s.pins.map((p, i) => {
                const cx = this.geo.cx(i), spring = part("spring", cx - 4, ch), driver = part("driver", cx - 4, 0),
                    kTop = part("keyTop", cx - 3, 0), kMid = part("keyMid", cx - 3, 0), kTip = part("keyTip", cx - 3, 0);
                [spring, driver, kTop, kMid, kTip].forEach(x => a.addChild(x));
                return { spring, driver, kTop, kMid, kTip };
            });
            // the wrench in the keyway's mouth, the pick: its handle left of the lock, a shaft to the chosen pin, the hook under it
            a.addChild(part("wrench", -ART.rects.wrench[2] + 10, key + 3));
            this.handle = part("pickHandle", -handleW - 6, 0); this.shaft = part("pickShaft", 0, 0); this.tip = part("pickTip", 0, 0);
            a.addChild(this.shaft); a.addChild(this.handle); a.addChild(this.tip);
        }
        buildSpring(s) {
            const a = this.art;
            a.x = 40; a.y = 52;
            a.addChild(part("gauge", 0, 0));
            const pic = s.o.pic === "kolce" ? null : "wnyk";
            // the trap itself between the gauge and the bars, shaking with the spring
            if (pic) { const w = new Sprite(ImageManager.loadSystem("Pulapka_Wnyk")); w.setFrame(0, 0, 48, 48); w.x = 70; w.y = 4; a.addChild(w); this.parts.trap = w; }
            else { const k = new Sprite(ImageManager.loadCharacter("!Fantasy_dungeon_traps")); k.setFrame(2 * 144 + 48, 3 * 96 + 40, 48, 56); k.x = 70; k.y = -4; a.addChild(k); this.parts.trap = k; }
        }
        buildBells(s) {
            const a = this.art;
            a.x = 0; a.y = 0;
            this.bells = [0, 1, 2].map(i => { const b = part("bell", 0, 0, 0.5, 0); a.addChild(b); return b; });
        }
        update() {
            if (!game) { this.visible = false; this.built = null; return; }
            this.visible = true;
            this.place();
            if (this.built !== game) this.build(game);
            const g = this.fx;
            g.clear();
            if (game.kind === "lock") this.drawLock(g, game); else if (game.kind === "spring") this.drawSpring(g, game); else this.drawBells(g, game);
            this.drawText(game);
        }
        bar(g, x, y, w, v, col) {
            g.beginFill(0x1e1a14, 1); g.drawRect(x, y, w, 10); g.endFill();
            g.beginFill(col, 1); g.drawRect(x + 1, y + 1, Math.round((w - 2) * Math.max(0, Math.min(1, v))), 8); g.endFill();
            g.beginFill(0xffffff, 0.18); g.drawRect(x + 1, y + 1, Math.round((w - 2) * Math.max(0, Math.min(1, v))), 2); g.endFill();
            g.lineStyle(1, C.yel, 0.7); g.drawRect(x - 0.5, y - 0.5, w + 1, 11); g.lineStyle(0);
        }
        drawLock(g, s) {
            const G1 = this.geo, a = this.art;
            s.pins.forEach((p, i) => {
                const sp = this.pins[i], lift = (p.y + p.shake) / S, cx = G1.cx(i);
                const kTopY = G1.key + 2 - p.len - lift, dTop = kTopY - ART.rects.driver[3];
                sp.kTop.y = kTopY; sp.kMid.y = kTopY + 3; sp.kMid.scale.y = Math.max(0, p.len - 10); sp.kTip.y = kTopY + p.len - 7;
                sp.driver.y = dTop;
                sp.spring.y = G1.ch; sp.spring.scale.y = Math.max(0.15, (dTop - G1.ch) / ART.rects.spring[3]);
                const tone = p.set ? [-10, 55, -10, 0] : [0, 0, 0, 0];   // (a set pin: a soft green cast, not a glow)
                for (const x of [sp.driver, sp.kTop, sp.kMid, sp.kTip]) x.setColorTone(tone);
                if (i === s.sel) {   // the chosen chamber: the HUD's yellow corners
                    g.lineStyle(2, C.yel, 1);
                    const L = 8, x0 = a.x + (cx - 9) * S, x1 = a.x + (cx + 9) * S, y0 = a.y + (G1.ch - 3) * S, y1 = a.y + (G1.key + 4) * S;
                    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { g.moveTo(x + dx * L, y); g.lineTo(x, y); g.lineTo(x, y + dy * L); }
                    g.lineStyle(0);
                }
            });
            // the shear line: a fine yellow line with a soft glow over the seam
            const ly = a.y + G1.line * S + 1, lx0 = a.x + (ART.rects.bodyL[2] - 16) * S, lx1 = a.x + (G1.lockW - 12) * S;
            g.beginFill(C.yel, 0.22); g.drawRect(lx0, ly - 2, lx1 - lx0, 5); g.endFill();
            g.beginFill(C.yel, 0.95); g.drawRect(lx0, ly, lx1 - lx0, 1); g.endFill();
            // the pick: the hook under the chosen pin's foot, the shaft back to the handle
            const sp = s.pins[s.sel], lift = Math.min(6, (sp.y + sp.shake) / S), cx = G1.cx(s.sel), tipR = ART.rects.pickTip;
            const py = G1.key + 1 - lift;
            this.tip.x = cx - tipR[2] + 2; this.tip.y = py;
            this.handle.y = py;
            const sx = this.handle.x + ART.rects.pickHandle[2];
            this.shaft.x = sx; this.shaft.y = py; this.shaft.scale.x = Math.max(1, this.tip.x - sx);
            this.bar(g, 24, H - 54, 170, s.strain, s.strain > 0.66 ? C.bad : C.yel);
        }
        drawSpring(g, s) {
            const a = this.art, hub = ART.geo.gaugeHub, hx = a.x + hub[0] * S, hy = a.y + hub[1] * S, R = 19 * S;
            // the green arc on the dial (the zone the needle must stay in), the needle by the spring's pull
            const span = Math.PI / 3, z = s.zone * span;
            g.lineStyle(7, C.green, 0.75); g.arc(hx, hy, R - 6, -Math.PI / 2 - z, -Math.PI / 2 + z); g.lineStyle(0);
            const ang = -Math.PI / 2 + s.x * span, inZone = Math.abs(s.x) <= s.zone;
            const nx = hx + Math.cos(ang) * (R - 2), ny = hy + Math.sin(ang) * (R - 2);
            g.lineStyle(4, 0x1c1208, 1); g.moveTo(hx, hy); g.lineTo(nx, ny); g.lineStyle(0);
            g.lineStyle(2, inZone ? 0x2b2b2b : C.bad, 1); g.moveTo(hx, hy); g.lineTo(nx, ny); g.lineStyle(0);
            g.beginFill(0x8a6a28, 1); g.drawCircle(hx, hy, 5); g.endFill();
            g.beginFill(C.brassHi, 1); g.drawCircle(hx - 1, hy - 1, 2); g.endFill();
            // the trap shakes with the spring
            if (this.parts.trap) this.parts.trap.x = 70 + Math.round(s.v * 40);
            this.bar(g, 300, 120, 220, s.prog, C.good);
            this.bar(g, 300, 166, 220, s.danger, C.bad);
        }
        drawBells(g, s) {
            const X0 = 70, X1 = W - 70, y = 96;
            // the stakes and the wire (twine brown, a light thread on top)
            for (const x of [X0 - 6, X1 + 6]) { g.beginFill(0x1c1208, 1); g.drawRect(x - 6, y - 22, 12, 46); g.endFill(); g.beginFill(0x6b4a2a, 1); g.drawRect(x - 4, y - 20, 8, 42); g.endFill(); g.beginFill(0x8a6a42, 1); g.drawRect(x - 4, y - 20, 2, 42); g.endFill(); }
            g.lineStyle(3, 0x1c1208, 1); g.moveTo(X0, y); g.lineTo(X1, y); g.lineStyle(0);
            g.lineStyle(1, 0xb08a5a, 1); g.moveTo(X0, y - 0.5); g.lineTo(X1, y - 0.5); g.lineStyle(0);
            this.bells.forEach((b, i) => {
                const bx = X0 + (X1 - X0) * (i + 1) / 4;
                b.x = bx / S; b.y = (y - 4) / S;
                b.rotation = s.amp * 0.55 * Math.sin(s.t * 0.32 + i * 1.7);
            });
            const quiet = s.amp < 0.25;
            g.beginFill(0x1c1208, 1); g.drawCircle(W / 2 - 60, 206, 12); g.endFill();
            g.beginFill(quiet ? C.good : C.bad, 1); g.drawCircle(W / 2 - 60, 206, 9); g.endFill();
            g.beginFill(0xffffff, 0.35); g.drawCircle(W / 2 - 63, 203, 3); g.endFill();
            for (let i = 0; i < BELL.misses; i++) { g.beginFill(0x1c1208, 1); g.drawRect(W - 70 + i * 22, H - 58, 16, 16); g.endFill(); g.beginFill(i < s.misses ? C.bad : 0x3a332a, 1); g.drawRect(W - 68 + i * 22, H - 56, 12, 12); g.endFill(); }
        }
        drawText(s) {
            const sig = [s.kind, s.o.title, s.o.picks ? s.o.picks() : "", s.msgT > 0 ? s.msg : "", s.kind === "bells" ? (s.amp < 0.25) : ""].join("|");
            if (sig === this.sig) return;
            this.sig = sig;
            const b = this.txt.bitmap;
            b.clear();
            b.outlineWidth = 3; b.outlineColor = "rgba(0,0,0,0.9)";
            b.fontSize = 24; b.textColor = "#ffd23f"; b.drawText(s.o.title || "", 18, 10, W - 36, 28, "left");
            b.fontSize = 19; b.textColor = "#ffffff";
            if (s.kind === "lock") {
                b.drawText(TXT.picks.replace("{n}", s.o.picks ? s.o.picks() : 0), 18, 10, W - 36, 28, "right");
                b.drawText(TXT.strain, 202, H - 63, 140, 24, "left");
                if (s.msgT > 0) { b.textColor = s.msgGood ? "#9ff0a8" : "#ff9f8f"; b.drawText(s.msg, 18, H - 64, W - 36, 28, "right"); }
                b.fontSize = 17; b.textColor = "#d8d0c0"; b.drawText(TXT.help, 18, H - 32, W - 36, 24, "center");
            } else if (s.kind === "spring") {
                b.drawText(TXT.progress, 300, 92, 220, 24, "left");
                b.drawText(TXT.danger, 300, 138, 220, 24, "left");
                b.fontSize = 17; b.textColor = "#d8d0c0"; b.drawText(TXT.helpTrap, 18, H - 32, W - 36, 24, "center");
            } else {
                b.drawText(s.amp < 0.25 ? TXT.quiet : TXT.ringing, W / 2 - 40, 194, 160, 24, "left");
                b.drawText(TXT.misses, W - 240, H - 60, 160, 24, "right");
                b.fontSize = 17; b.textColor = "#d8d0c0"; b.drawText(TXT.helpBell, 18, H - 32, W - 36, 24, "center");
            }
        }
    }
    function sceneOk() { return SceneManager._scene instanceof Scene_Map; }
    function panel() {
        const sc = SceneManager._scene;
        if (!sc) return null;
        if (!sc._zamkiPanel) { sc._zamkiPanel = new Panel(); sc.addChild(sc._zamkiPanel); }
        return sc._zamkiPanel;
    }
    function open(kind, o) {
        if (!enabled || !sceneOk()) return null;
        game = kind === "lock" ? new LockGame(o) : kind === "bells" ? new BellGame(o) : new SpringGame(o);
        panel();
        T.emit("zamkiGra", { on: true, kind });
        return game;
    }
    function close(why) {
        const g = game;
        if (!g) return;
        game = null;
        Input.clear();
        if (why === "quit" && g.o.onQuit) g.o.onQuit();
        T.emit("zamkiGra", { on: false, kind: g.kind, why: why || "" });
    }

    // ---- while it is up: the game's frame; the hero stays, the menu stays shut, the core counts it as a mini-game
    T.onMapUpdate(() => { if (game) { if (!sceneOk()) close("scene"); else game.update(); } }, { owner: PLUGIN, name: "gra" });
    const _canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() { return game ? false : _canMove.call(this); };
    const _isMenuCalled = Scene_Map.prototype.isMenuCalled;
    Scene_Map.prototype.isMenuCalled = function() { return game ? false : _isMenuCalled.call(this); };
    const _running = T.miniGameRunning;
    T.miniGameRunning = function() { return !!game || _running.call(T); };
    // (the panel is the scene's child: Scene_Base.updateChildren updates it every frame)
    T.on("mapReady", () => { if (game) close("map"); }, { owner: PLUGIN });

    window.ZamkiGra = T.register(PLUGIN, {
        LOCK, TRAP, BELL, open, close, current: () => game, running: () => !!game,
        enabled: v => { if (v !== undefined) enabled = !!v; return enabled; }
    });
})();
