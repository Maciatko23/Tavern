//=============================================================================
// TavernDice_Scene.js
//=============================================================================
// The dice table's scene (split out of TavernDice.js, 2026-09-29): the lobby (who sits at the table, the stake, the hero's six), a
// game played out (the cup, the throws, setting dice aside, busts, hot dice, the rival's head and his talk, Ozzy's visions), leaving,
// the end of a game. On TawernaUI's Scene_MiniGame: the keys and the mouse, turbo and the tests' hook, the busts, the banner, the
// flying coins, the result to onEnd on the map. Its pictures and panels are TavernDice_Art.js's.

/*:
 * @target MZ
 * @plugindesc Scena stołu do kości (TavernDice.js): lobby, partia (kubek, rzuty, odkładanie, pudła, gorące kości, rywal i jego gadanie), odejście od stołu, koniec partii. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
 * @base TavernDice
 * @orderAfter TavernDice
 * @base TavernDice_Art
 * @orderAfter TavernDice_Art
 *
 * @help
 * ============================================================================
 * TavernDice_Scene.js - scena stołu do kości
 * ============================================================================
 * Część TavernDice.js (wydzielona z niego): sama gra przy stole. Otwiera ją
 * zdarzenie z <Tavern:dice>, TavernDice.start(...) albo polecenie wtyczki.
 * Parametry ma TavernDice.js.
 *
 * KOLEJNOŚĆ: TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW || !TW.ui || !TW.ui.Scene_MiniGame) throw new Error("TavernDice_Scene.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const ui = TW.ui;
    const P = TW.api("TavernDice_parts") || TW.register("TavernDice_parts", {});
    if (P.Scene) return;   // (put into the page twice: kept as it was)
    if (!P.core || !P.data || !P.art) throw new Error("TavernDice_Scene.js: musi być pod TavernDice.js, TavernDice_Data.js i TavernDice_Art.js na liście wtyczek (one of them is missing or below)");
    const { MIN_BASE, MIN_TURN, BIG_POT, VISIONS, RESULT_VAR, XP_BASE, XP_PER_G, clamp, gold, makeRng, streams, pickOf, score, best, decide, Match, setupGame,
        store, dayNow, hourNow, vsOf, ownedCount, heroSet, giveDie, present, locked, fame, targetFor, visionText } = P.core;
    const { DIE_TYPES, SPECIAL_ORDER, OPPONENTS, MERCHANT_HINT, OPP_ORDER, HERO_LINES, AUTO_AI } = P.data;
    const { ST, dirty, solidBitmap, paintTable, glowBitmap, candleBitmap, flameBitmap, moteBitmap, focusBitmap, sparkBitmap, dustBitmap, coinBitmap,
        TBL, FELT, ZONE, POT, HERO_COL, OPP_COL, DieSprite, CupSprite, BubbleSprite, FloatText, Particle, se, snd, BUST_H, HEADER, SIDE_L, SIDE_R, BAR, HINT,
        BTN, DicePanels } = P.art;
    const api = () => TW.api("TavernDice");

    // ==================================================================
    // The scene
    // ==================================================================
    class Scene_TavernDice extends ui.Scene_MiniGame {
        createGame() {
            this.opts = Object.assign({}, this.opts);   // (the caller's options stay as they were)
            if (this.opts.seed === undefined) { this.seed = (Date.now() ^ (store().games * 7919 + 17)) >>> 0; this.rng = ui.rng(this.seed); }
            this.fxRng = makeRng(this.seed ^ 0x5bd1e995);
            this.results = [];
            this.rewards = { xp: 0, notes: [], notices: [] };
            this.phase = "none";
            this.co = null; this.wait = 0; this.waitFn = null;
            this.dice = [];
            this.aside = [[], []];
            this.fxList = [];
            this.focus = { row: "btn", i: 1 };
            this.heroAct = null;
            this.waitHero = null;
            this.game = null;
            this.shown = [0, 0];
            this.countHold = [0, 0];
            this.talkLog = [];
            this.gameNo = 0;
            [ui.heroBust()].concat(OPP_ORDER.map(k => OPPONENTS[k].bust)).forEach(n => ui.loadBust(n));
            this.createLayers();
        }
        // behind the table: the map it came from, blurred, under a warm shade and a vignette
        createBackground() {
            const W = Graphics.width, H = Graphics.height;
            const snap = SceneManager.backgroundBitmap();
            this.bg = new Sprite(snap || solidBitmap("#15100b"));
            if (!snap) this.bg.scale.set(W / 4, H / 4);
            else { const f = new PIXI.filters.BlurFilter(); f.blur = 6; this.bg.filters = [f]; }
            this.addChild(this.bg);
            const shade = new Bitmap(W, H), sc = shade.context;
            sc.fillStyle = "rgba(9,7,5,0.62)"; sc.fillRect(0, 0, W, H);
            const vg = sc.createRadialGradient(W / 2, H * 0.47, 160, W / 2, H * 0.47, W * 0.66);
            vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.72)");
            sc.fillStyle = vg; sc.fillRect(0, 0, W, H);
            dirty(shade);
            this.addChild(new Sprite(shade));
        }
        // the table and all on it into the stage; the banner, the busts, the HUD in TawernaUI's layers, as the table always had them
        createLayers() {
            const S = this.stage;
            const tb = new Bitmap(TBL.w + 60, TBL.h + 60);
            tb.smooth = true;
            const at = paintTable(tb);
            this.table = new Sprite(tb);
            this.table.x = at.x; this.table.y = at.y;
            S.addChild(this.table);
            // candlelight on the cloth (added light, flickering)
            this.lights = new Sprite();
            this.lights.blendMode = PIXI.BLEND_MODES.ADD;
            S.addChild(this.lights);
            this.candleSpots = [{ x: TBL.x + 12, y: TBL.y + 142 }, { x: TBL.x + TBL.w - 12, y: TBL.y + 142 }];
            this.glows = this.candleSpots.map(p => {
                const g = new Sprite(glowBitmap());
                g.anchor.set(0.5, 0.5); g.x = p.x; g.y = p.y - 30; g.scale.set(2.1); g.blendMode = PIXI.BLEND_MODES.ADD;
                this.lights.addChild(g);
                return g;
            });
            this.centreGlow = new Sprite(glowBitmap());
            this.centreGlow.anchor.set(0.5, 0.5); this.centreGlow.x = POT.x; this.centreGlow.y = POT.y; this.centreGlow.scale.set(3.4, 2.6); this.centreGlow.opacity = 70;
            this.centreGlow.blendMode = PIXI.BLEND_MODES.ADD;
            this.lights.addChild(this.centreGlow);
            // the pot and its label, the labels on the cloth
            this.potSpr = new Sprite();
            this.potSpr.anchor.set(0.5, 150 / 180); this.potSpr.scale.set(0.5); this.potSpr.x = POT.x; this.potSpr.y = POT.y + 22;
            S.addChild(this.potSpr);
            this.feltText = new Sprite(new Bitmap(FELT.w, FELT.h));
            this.feltText.x = FELT.x; this.feltText.y = FELT.y;
            S.addChild(this.feltText);
            // the dice, the cup, the keyboard's brackets
            this.diceLayer = new Sprite();
            S.addChild(this.diceLayer);
            this.cup = new CupSprite();
            S.addChild(this.cup);
            this.focusSpr = new Sprite(focusBitmap());
            this.focusSpr.anchor.set(0.5, 0.5); this.focusSpr.visible = false;
            S.addChild(this.focusSpr);
            // the candles (on the rim)
            this.flames = [];
            for (const p of this.candleSpots) {
                const c = new Sprite(candleBitmap());
                c.anchor.set(0.5, 104 / 120); c.scale.set(0.5); c.x = p.x; c.y = p.y;
                S.addChild(c);
                const f = new Sprite(flameBitmap());
                f.anchor.set(0.5, 0.9); f.scale.set(0.5); f.x = p.x; f.y = p.y - 32; f.blendMode = PIXI.BLEND_MODES.ADD;
                S.addChild(f);
                this.flames.push(f);
            }
            // warm specks drifting in the candlelight over the table
            this.motes = [];
            const moteLayer = new Sprite();
            moteLayer.blendMode = PIXI.BLEND_MODES.ADD;
            S.addChild(moteLayer);
            for (let i = 0; i < 18; i++) {
                const s = new Sprite(moteBitmap());
                s.anchor.set(0.5, 0.5);
                s.blendMode = PIXI.BLEND_MODES.ADD;
                moteLayer.addChild(s);
                this.motes.push({ s, x: TBL.x + Math.random() * TBL.w, y: TBL.y + Math.random() * TBL.h, vy: -(0.08 + Math.random() * 0.18), ph: Math.random() * 6.3, k: 0.5 + Math.random() * 0.7 });
            }
            this.fxLayer = new Sprite();
            S.addChild(this.fxLayer);
            // the banner across the table (TawernaUI's, moving with the game's steps)
            this.fx.removeChild(this.banner);
            this.banner = new ui.Banner(TBL.x + TBL.w / 2, POT.y, TBL.w - 40);
            this.banner.ticked = true;
            this.fx.addChild(this.banner);
            // the HUD
            this.header = new Sprite(new Bitmap(HEADER.w, HEADER.h)); this.header.x = HEADER.x; this.header.y = HEADER.y;
            this.panelL = new Sprite(new Bitmap(SIDE_L.w, SIDE_L.h)); this.panelL.x = SIDE_L.x; this.panelL.y = SIDE_L.y;
            this.panelR = new Sprite(new Bitmap(SIDE_R.w, SIDE_R.h)); this.panelR.x = SIDE_R.x; this.panelR.y = SIDE_R.y;
            this.bar = new Sprite(new Bitmap(BAR.w, BAR.h)); this.bar.x = BAR.x; this.bar.y = BAR.y;
            this.hint = new Sprite(new Bitmap(HINT.w, HINT.h)); this.hint.x = HINT.x; this.hint.y = HINT.y;
            for (const s of [this.header, this.panelL, this.panelR, this.bar, this.hint]) this.hud.addChild(s);
            // the busts (TawernaUI's, BUST_H high, moving with the game's steps) and the table's own speech bubbles over them
            for (const s of [this.fx, this.hud, this.bustL, this.bustR, this.bubbleL, this.bubbleR]) this.removeChild(s);
            this.bustL = new ui.Bust("left", BUST_H);
            this.bustR = new ui.Bust("right", BUST_H);
            this.bustL.ticked = this.bustR.ticked = true;
            this.bubbleL = new BubbleSprite("left");
            this.bubbleR = new BubbleSprite("right");
            this.topFx = new Sprite();   // (coins fly over the panels)
            // (the order the table has: its banner, the HUD, the busts, the bubbles, the coins - under the panels over it all)
            for (const s of [this.fx, this.hud, this.bustL, this.bustR, this.bubbleL, this.bubbleR, this.topFx]) this.addChildAt(s, this.getChildIndex(this.overlay));
            this.bustL.setPicture(ui.heroBust());
        }
        begin() {
            if (this.opts.opponent && OPPONENTS[this.opts.opponent] && this.opts.stake) this.beginGame(this.opts.opponent, Number(this.opts.stake));
            else this.openLobby();
            if (!store().rulesSeen && this.opts.rules !== false) this.showRules();
        }
        // ---- the loop (TawernaUI's): logic ticks - turbo of them a frame, 3x as many while O is held in the rival's turn - then the pictures
        ticksThisFrame() { return this.turbo * (this.hurry() ? 3 : 1); }
        testHook() { return api().onTick; }
        dropTestHook() { api().onTick = null; }
        onBack() { return false; }   // (P is the table's own: leave the lobby, ask before leaving a game, close a panel)
        keyDown(k) { return super.keyDown(k) || (k === "back" && Input.isPressed("menu")); }
        hurry() {   // O held while the rival plays: his moves go 3x as fast
            return this.phase === "play" && !this.waitHero && !!this.game && this.game.match.cur === 1 && !this.opts.auto && Input.isPressed("ok");
        }
        // the mouse: a click (once a frame) and where it moved to
        readKeys() {
            super.readKeys();
            const m = this.mouse;
            this.click = m.click ? { x: m.x, y: m.y } : null;
            this.hover = m.moved && m.x > 0 && m.y > 0 ? { x: m.x, y: m.y } : null;
        }
        tick() {
            this.tickSprites();
            switch (this.phase) {
                case "lobby": this.lobbyInput(); break;
                case "rules": this.rulesInput(); break;
                case "confirm": this.confirmInput(); break;
                case "end": this.endInput(); break;
                case "play":
                    if (this.trig.back) { this.askLeave(); break; }
                    this.runCo();
                    if (this.phase === "play" && this.waitHero) this.heroInput();
                    else if (this.phase === "play" && this.click) this.sideButtons();
                    break;
            }
        }
        tickSprites() {
            for (const d of this.dice) d.tick();
            for (const side of this.aside) for (const d of side) d.tick();
            this.cup.tick();
            this.banner.tick();
            this.bustL.tick(); this.bustR.tick();
            this.bubbleL.tick(); this.bubbleR.tick();
            this.fxList = this.fxList.filter(f => { const alive = f.tick(); if (!alive) { if (f.parent) f.parent.removeChild(f); f.destroy(); } return alive; });
            // the scores count up to what is written down
            if (this.game) {
                const m = this.game.match;
                for (let i = 0; i < 2; i++) {
                    if (this.countHold[i] > 0) { this.countHold[i]--; continue; }
                    const want = m.players[i].total;
                    if (this.shown[i] < want) {
                        this.shown[i] = Math.min(want, this.shown[i] + Math.max(5, Math.ceil((want - this.shown[i]) / 9)));
                        if (this.phaseT % 3 === 0) snd("tick");
                    }
                }
            }
        }
        runCo() {
            if (!this.co) return;
            if (this.wait > 0) { this.wait--; return; }
            if (this.waitFn) { if (!this.waitFn()) return; this.waitFn = null; }
            for (let guard = 0; guard < 60 && this.co; guard++) {
                const r = this.co.next();
                if (r.done) { this.co = null; return; }
                const v = r.value;
                if (typeof v === "number") { if (v > 1) { this.wait = v - 1; return; } if (v === 1) return; continue; }
                if (typeof v === "function") { if (!v()) { this.waitFn = v; return; } continue; }
                return;
            }
        }
        // ---- pictures (every frame)
        frame() {
            const t = Graphics.frameCount;
            this.flames.forEach((f, i) => {
                const n = Math.sin(t * 0.21 + i * 2.1) * 0.5 + Math.sin(t * 0.47 + i) * 0.3 + Math.sin(t * 1.3 + i * 4) * 0.2;
                f.scale.set(0.5 * (1 + n * 0.04), 0.5 * (1 + n * 0.1));
                f.skew.x = Math.sin(t * 0.13 + i) * 0.06;
                this.glows[i].opacity = Math.round(150 + n * 40);
                this.glows[i].scale.set(2.1 + n * 0.05);
            });
            this.centreGlow.opacity = Math.round(62 + Math.sin(t * 0.05) * 8);
            for (const m of this.motes) {
                m.y += m.vy; m.x += Math.sin(t * 0.013 + m.ph) * 0.12;
                if (m.y < TBL.y - 10) { m.y = TBL.y + TBL.h; m.x = TBL.x + Math.random() * TBL.w; }
                m.s.x = m.x; m.s.y = m.y;
                m.s.scale.set(m.k);
                // (brighter near the candles)
                const near = Math.min(...this.candleSpots.map(c => Math.hypot(c.x - m.x, c.y - 30 - m.y)));
                m.s.opacity = Math.round((40 + 30 * Math.sin(t * 0.04 + m.ph)) * (1 + Math.max(0, 1 - near / 260) * 1.6));
            }
            this.diceLayer.children.sort((a, b) => a.ty - b.ty);
            this.placeFocus();
            this.placeBubbles();
            this.drawHeader();
            this.drawSides();
            this.drawBar();
            this.drawHint();
            this.drawFelt();
            this.drawPot();
            this.drawOverlay();
        }
        placeBubbles() {
            const place = (bub, bust, cx) => {
                const top = Graphics.height - BUST_H + 16;
                bub.x = cx;
                bub.y = top + (bub.oy || 0);
            };
            place(this.bubbleL, this.bustL, SIDE_L.x + SIDE_L.w / 2);
            place(this.bubbleR, this.bustR, SIDE_R.x + SIDE_R.w / 2);
        }

        // ==============================================================
        // Starting a game: the stake goes into the pot, the dice are set, the flow begins
        // ==============================================================
        beginGame(key, stake) {
            const opp = OPPONENTS[key];
            if (!opp || !(stake > 0) || $gameParty.gold() < stake) { snd("buzzer"); return false; }
            this.gameNo++;
            const seed = (this.seed + (this.gameNo - 1) * 101) >>> 0, R = streams(seed), setup = setupGame(key, R.start);
            const heroDice = Array.isArray(this.opts.heroDice) && this.opts.heroDice.length === 6 ? this.opts.heroDice.slice() : heroSet();
            const match = new Match({
                target: this.opts.target || targetFor(stake, key), rng: R.dice, first: setup.first,
                players: [{ key: "hero", name: "Ty", dice: heroDice }, { key, name: opp.short, dice: setup.dice }]
            });
            if (Array.isArray(this.opts.script)) match.forced = this.opts.script.map(a => a.slice());
            $gameParty.loseGold(stake);
            this.game = {
                key, opp, stake, pot: stake * 2, seed, R, setup, match, potShown: 0, visions: 0, lastChat: -9, gift: null, done: false, left: false, started: false,
                heads: [this.opts.auto ? (AUTO_AI[this.opts.auto] || OPPONENTS[this.opts.auto] && OPPONENTS[this.opts.auto].ai || AUTO_AI.steady) : null, opp.ai],
                hour: hourNow(), day: dayNow()
            };
            this.shown = [0, 0];
            this.countHold = [0, 0];
            this.clearTable(true);
            this.bustR.setPicture(opp.bust);
            this.bustL.setPicture(ui.heroBust());
            this.bustL.want = this.bustR.want = true;
            this.bustL.lightTo = this.bustR.lightTo = 1;
            this.phase = "play";
            this.phaseT = 0;
            this.overlay.visible = false;
            this.co = this.gameFlow();
            this.wait = 0; this.waitFn = null;
            return true;
        }
        clearTable(all) {
            for (const d of this.dice) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
            this.dice = [];
            if (all) {
                for (const side of this.aside) for (const d of side) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
                this.aside = [[], []];
                for (const f of this.fxList) { if (f.parent) f.parent.removeChild(f); f.destroy(); }
                this.fxList = [];
            }
        }
        newDie(type, face) {
            const d = new DieSprite(type, face, this.fxRng);
            d.onImpact = (die, n) => this.dieImpact(die, n);
            this.diceLayer.addChild(d);
            return d;
        }
        dieImpact(die, n) {
            const r = this.fxRng;
            if (n === 0) { se("Knock", 50, 135 + Math.floor(r() * 25)); se("Switch1", 34, 115 + Math.floor(r() * 30)); }
            else if (n === 1) se("Switch1", 26, 135 + Math.floor(r() * 30));
            if (n <= 1) for (let i = 0; i < (n ? 2 : 4); i++) {   // a puff of the cloth's nap
                const a = r() * Math.PI * 2, v = 0.4 + r() * 0.8;
                this.addFx(new Particle(dustBitmap(), Math.cos(a) * v, Math.sin(a) * v * 0.6, 18 + Math.floor(r() * 10), 0), die.tx, die.ty + 6);
            }
        }
        addFx(s, x, y, top) {
            if (x !== undefined) { s.x = x; s.y = y; }
            (top || s instanceof ui.CoinFly ? this.topFx : this.fxLayer).addChild(s);
            this.fxList.push(s);
            return s;
        }
        // a coin flying along a curve from a to b (TawernaUI's, with the table's painted coin, moving with the game's steps)
        coinFly(a, b, delay, D, onArrive) {
            const c = new ui.CoinFly(a, b, { delay, duration: D, bitmap: coinBitmap(), scale: 0.5, onArrive });
            c.ticked = true;
            return c;
        }
        float(text, sub, x, y, colour, size) { return this.addFx(new FloatText(text, sub, colour, size), x, y); }
        sparks(x, y, n, colour) {
            const r = this.fxRng;
            for (let i = 0; i < n; i++) {
                const a = -Math.PI / 2 + (r() - 0.5) * 2.2, v = 1 + r() * 2.6;
                this.addFx(new Particle(sparkBitmap(), Math.cos(a) * v, Math.sin(a) * v, 26 + Math.floor(r() * 20), 0.03, true), x + (r() - 0.5) * 30, y + (r() - 0.5) * 16);
            }
        }
        // a line of a speaker (1 the rival, 0 the hero) from its list key; chance: said only sometimes
        say(who, key, chance, force) {
            const g = this.game;
            if (!g) return false;
            const lines = who ? g.opp.lines[key] : HERO_LINES[key];
            if (!lines || !lines.length) return false;
            if (chance !== undefined && g.R.talk() >= chance) return false;
            return this.sayText(who, pickOf(g.R.talk, lines), force);
        }
        sayText(who, text, force) {
            const bub = who ? this.bubbleR : this.bubbleL;
            if (!force && bub.shown() && bub.t < 40) return false;
            bub.say(text);
            if (who) this.bustR.hop = 16; else this.bustL.hop = 16;
            this.talkLog.push({ who, text });
            if (this.talkLog.length > 40) this.talkLog.shift();
            return true;
        }

        // ==============================================================
        // The flow of a game (a generator: yield n = wait n ticks, yield fn = wait till fn() is true)
        // ==============================================================
        *gameFlow() {
            const g = this.game, m = g.match;
            yield 12;
            this.say(1, "greet", undefined, true);
            if (g.setup.special) { yield 70; this.say(1, "lucky", undefined, true); }
            yield* this.potIn();
            yield* this.rollOffFlow();
            while (!m.over) yield* this.turnFlow();
            yield* this.endFlow();
        }
        // both stakes fly into the pot
        *potIn() {
            const g = this.game, n = clamp(Math.ceil(g.stake / 5), 2, 8);
            let arrived = 0;
            for (let side = 0; side < 2; side++) {
                const from = side ? { x: SIDE_R.x + 40, y: SIDE_R.y + 24 } : { x: SIDE_L.x + 60, y: SIDE_L.y + 46 };
                for (let i = 0; i < n; i++) {
                    const to = { x: POT.x + (this.fxRng() - 0.5) * 30, y: POT.y + 4 + (this.fxRng() - 0.5) * 12 };
                    this.addFx(this.coinFly(from, to, i * 5 + side * 3, 30, () => {
                        arrived++;
                        g.potShown = Math.round(g.pot * arrived / (n * 2));
                        se("Coin", 38, 90 + Math.floor(this.fxRng() * 30));
                    }));
                }
            }
            yield () => arrived >= n * 2;
            g.potShown = g.pot;
            snd("coins", 0.8);
            yield 16;
        }
        // who starts: each throws one die, the higher starts (a tie: again)
        *rollOffFlow() {
            const g = this.game;
            this.banner.show("turn", "Kto zaczyna?", null, 42);
            yield 36;
            for (const [a, b] of g.setup.rolls) {
                const da = this.newDie(g.match.players[0].dice[0], a), db = this.newDie("std", b);
                da.fly({ sx: ZONE.x + 20, sy: POT.y + 60, h0: 30, ex: POT.x - 110, ey: POT.y + 40, D: 44, spin: 8.5, rot1: -0.12, face: a });
                db.fly({ sx: ZONE.x + ZONE.w - 20, sy: POT.y - 70, h0: 30, ex: POT.x + 110, ey: POT.y - 40, D: 46, spin: -8, rot1: 0.14, face: b });
                this.dice = [da, db];
                yield () => !da.busy() && !db.busy();
                yield 20;
                if (a === b) { this.banner.show("turn", "Remis! Jeszcze raz.", null, 56); yield 40; }
                else { (a > b ? da : db).liftTo = 1; snd("on"); yield 26; }
                for (const d of [da, db]) d.fadeOut(12);
                yield 14;
                this.clearTable();
            }
            const heroFirst = g.match.cur === 0;
            this.banner.show("turn", heroFirst ? "Zaczynasz ty" : "Zaczyna " + g.opp.short, null, 64);
            this.say(1, heroFirst ? "heroFirst" : "meFirst", 0.8);
            yield 40;
        }
        *turnFlow() {
            const g = this.game, m = g.match, me = m.cur, hero = me === 0, auto = hero && !!this.opts.auto;
            g.started = true;
            this.setActive(me);
            this.shown[me] = m.players[me].total;
            this.banner.show("turn", hero ? "Twoja tura" : "Tura: " + g.opp.short, null, 58);
            if (!hero && !this.hinted && MERCHANT_HINT[g.key] && m.turnNo >= 2 && locked(hourNow(), dayNow()).includes("kupiec")) { this.hinted = true; g.lastChat = m.turnNo; this.sayText(1, MERCHANT_HINT[g.key], true); }
            else if (!hero && g.opp.lines.chat && m.turnNo - g.lastChat >= 3 && g.R.talk() < (g.opp.stories ? 0.3 : 0.14)) { g.lastChat = m.turnNo; this.say(1, "chat", undefined, true); }
            yield 24;
            let first = true;
            for (;;) {
                if (first) {
                    if (hero && !auto) { this.askHero("throw"); yield () => !!this.heroAct; this.heroAct = null; this.waitHero = null; }
                    else yield 12;
                }
                if (m.hotNext) yield* this.hotFlow();
                else if (!first) yield* this.gatherLeft();
                const r = m.roll();
                const vision = hero ? this.maybeVision(r) : null;
                yield* this.throwFlow(r.dice);
                if (vision) yield* this.visionAfter();
                if (r.bust) { yield* this.bustFlow(); break; }
                let act;
                if (hero && !auto) {
                    this.askHero("choose");
                    yield () => !!this.heroAct;
                    act = this.heroAct; this.heroAct = null; this.waitHero = null;
                } else act = yield* this.aiChooseFlow();
                const res = m.take(act.idx);
                if (!res) { act = { idx: best(m.context().faces).idx, bank: act.bank }; }   // (never: the choice was checked)
                const took = res || m.take(act.idx);
                yield* this.takeFlow(took.group);
                if (act.bank) { yield* this.bankFlow(); break; }
                first = false;
            }
            this.clearTable();
            if (!m.over) m.endTurn();
        }
        setActive(me) {
            this.bustL.lightTo = me === 0 ? 1 : 0.55;
            this.bustR.lightTo = me === 1 ? 1 : 0.55;
        }
        askHero(kind) {
            this.waitHero = kind;
            this.heroAct = null;
            if (kind === "throw") this.focus = { row: "btn", i: 1 };
            else {
                const order = this.dice.map((d, i) => i).sort((a, b) => this.dice[a].tx - this.dice[b].tx);
                this.focus = order.length ? { row: "die", i: order[0] } : { row: "btn", i: 1 };
            }
        }
        // the dice left on the table after a choice go back into the cup
        *gatherLeft() {
            const hero = this.game.match.cur === 0, cx = hero ? ZONE.x + 64 : ZONE.x + ZONE.w - 64, cy = hero ? POT.y + 118 : POT.y - 70;
            const left = this.dice.slice();
            left.forEach((d, i) => { d.liftTo = 0; d.moveTo(cx, cy, 14 + i * 2, 0.7, 10); });
            yield 10;
            left.forEach(d => d.fadeOut(8));
            yield 8;
            this.clearTable();
        }
        // the cup comes in, is shaken, tips; the dice fly out, bounce and settle
        *throwFlow(dice) {
            const g = this.game, hero = g.match.cur === 0, side = hero ? 1 : -1;
            const cx = hero ? ZONE.x + 64 : ZONE.x + ZONE.w - 64, cy = hero ? POT.y + 118 : POT.y - 70;
            this.clearTable();
            this.cup.enter(cx, cy, side);
            yield () => this.cup.mode === "ready";
            this.cup.onRattle = env => {
                const r = this.fxRng;
                se("Switch1", Math.round(24 + env * 26), 128 + Math.floor(r() * 40));
                if (r() < 0.45) se("Knock", Math.round(14 + env * 16), 150 + Math.floor(r() * 30));
            };
            this.cup.shake(hero ? 40 : 34);
            yield () => this.cup.mode === "ready";
            const spots = this.landingSpots(dice.length, hero);
            this.dice = dice.map(d => { const s = this.newDie(d.type, d.face); s.visible = false; s.tx = cx; s.ty = cy; s.model = d; return s; });
            let released = false;
            this.cup.onRelease = () => {
                released = true;
                const mo = this.cup.mouth(), r = this.fxRng;
                this.dice.forEach((s, i) => {
                    const sp = spots[i];
                    s.fly({ sx: mo.x, sy: mo.y + 20, h0: mo.h + 8, ex: sp.x, ey: sp.y, D: 44 + Math.floor(r() * 16) + i * 2, spin: side * (5 + r() * 7) * (r() < 0.25 ? -1 : 1), rot1: (r() - 0.5) * 0.5, face: dice[i].face, delay: i * 2 });
                });
            };
            this.cup.pour();
            yield () => released;
            yield () => this.dice.every(d => !d.busy());
            this.cup.leave();
            yield 8;
        }
        // where the dice come to rest: apart from each other, off the pot, on the far side from the cup
        landingSpots(n, hero) {
            const r = this.fxRng, out = [];
            const x0 = hero ? ZONE.x + 150 : ZONE.x + 40, x1 = hero ? ZONE.x + ZONE.w - 40 : ZONE.x + ZONE.w - 150;
            const y0 = ZONE.y + 46, y1 = ZONE.y + ZONE.h - 58;
            for (let tries = 0; out.length < n && tries < 2000; tries++) {
                const p = { x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0) };
                const ex = (p.x - POT.x) / 112, ey = (p.y - (POT.y + 20)) / 94;   // (off the coins and their label)
                if (ex * ex + ey * ey < 1) continue;
                if (out.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 80)) continue;
                out.push(p);
            }
            for (let i = out.length; i < n; i++) out.push({ x: x0 + 40 + (i % 3) * 90, y: y0 + Math.floor(i / 3) * 100 });   // (never: room enough)
            return out;
        }
        // the rival (or the hero on autopilot) looks, picks the dice one by one, then says what he does
        *aiChooseFlow() {
            const g = this.game, m = g.match, me = m.cur, d = decide(m.context(), g.heads[me] || AUTO_AI.steady, g.R.ai);
            yield 26 + Math.floor(this.fxRng() * 12);
            for (const i of d.idx) { if (this.dice[i]) this.dice[i].liftTo = 1; snd("on", 0.8); yield 9; }
            yield 14;
            if (me === 1) {
                const left = (m.turn.free.length - d.idx.length) || 6, pts = m.turn.pts + score(d.idx.map(i => m.thrown[i].face)).points;
                if (!d.bank && (d.reckless || (pts >= 350 && left <= 3))) this.say(1, "push", d.reckless ? 0.9 : 0.5);
            }
            return d;
        }
        // the chosen dice go to their owner's column; the points and the name of the throw float up
        *takeFlow(group) {
            const g = this.game, m = g.match, me = m.cur, col = me === 0 ? HERO_COL : OPP_COL;
            const sprites = this.dice.filter(s => group.dice.includes(s.model));
            const cx = sprites.reduce((a, s) => a + s.tx, 0) / Math.max(1, sprites.length), cy = sprites.reduce((a, s) => a + s.ty, 0) / Math.max(1, sprites.length);
            const big = group.points >= 500 || group.combos.some(c => c.kind === "straight" || (c.kind === "kind" && c.n >= 4));
            this.float("+" + group.points, group.name, cx, cy - 34, big ? ST().accent : "#fff2b8", big ? 44 : 34);
            if (big) { snd("big"); this.sparks(cx, cy - 20, 14); } else snd("combo");
            yield 10;
            sprites.forEach((s, i) => {
                const slot = this.aside[me].length;
                this.aside[me].push(s);
                this.dice.splice(this.dice.indexOf(s), 1);
                s.liftTo = 0;
                s.moveTo(col, FELT.y + 62 + slot * 58, 18 + i * 3, 0.78, 16, 0);
            });
            yield 24;
            if (big) {
                if (me === 0) { this.say(1, "heroBig", 0.6); }
                else { this.say(1, "myBig", 0.75); this.bustR.hop = 16; }
            }
        }
        *bankFlow() {
            const g = this.game, m = g.match, me = m.cur, res = m.bank();
            snd("bank");
            const col = me === 0 ? HERO_COL : OPP_COL, side = me === 0 ? SIDE_L : SIDE_R;
            this.countHold[me] = 22;
            const f = this.float("+" + res.points, null, col, FELT.y + 70 + this.aside[me].length * 29, ST().accent, 40);
            f.vy = 0;
            f.target = { x: side.x + side.w / 2, y: side.y + 110 };
            f.tickBase = f.tick;
            f.tick = function() { const alive = this.tickBase(); if (this.life > 12) { this.x += (this.target.x - this.x) * 0.12; this.y += (this.target.y - this.y) * 0.12; } return alive && this.life < 44; };
            for (const s of this.aside[me]) s.liftTo = 1;
            yield 16;
            for (const s of this.aside[me]) s.fadeOut(14);
            if (me === 0) { if (res.points < 350 && !res.won) this.say(1, "heroSmall", 0.35); }
            else if (!res.won) this.say(1, "bank", 0.45);
            yield 30;
            for (const s of this.aside[me]) { if (s.parent) s.parent.removeChild(s); s.destroy({ children: true }); }
            this.aside[me] = [];
            yield () => this.shown[me] >= m.players[me].total;
            yield 10;
        }
        *bustFlow() {
            const g = this.game, m = g.match, me = m.cur, lost = m.turn.lost;
            snd("bust");
            for (const d of this.dice) d.dimTo = 1;
            for (const d of this.aside[me]) d.dimTo = 1;
            this.banner.show("bust", "Pudło!", lost > 0 ? "Tura przepada: −" + lost : "Żadna kość nie punktuje", 104);
            if (me === 0) {
                const said = this.say(1, "heroBust", 0.75);
                if (said && g.key === "grum" && g.R.talk() < 0.4) snd("laugh");
                this.bustL.jolt = 18;
            } else { this.say(1, "myBust", 0.8); this.bustR.jolt = 18; }
            yield 100;
            for (const d of this.dice.concat(this.aside[me])) d.fadeOut(14);
            yield 16;
            for (const d of this.aside[me]) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
            this.aside[me] = [];
        }
        *hotFlow() {
            const g = this.game, m = g.match, me = m.cur, hero = me === 0;
            const cx = hero ? ZONE.x + 64 : ZONE.x + ZONE.w - 64, cy = hero ? POT.y + 118 : POT.y - 70;
            snd("hot"); snd("hot2");
            this.banner.show("hot", "Gorące kości!", "Wszystkie sześć odłożone — rzut całą szóstką, punkty zostają", 110);
            for (const d of this.aside[me]) { d.liftTo = 1; this.sparks(d.tx, d.ty - 10, 5); }
            if (hero) this.say(1, "heroHot", 0.7); else this.say(1, "myHot", 0.8);
            yield 40;
            this.clearTable();
            this.aside[me].forEach((d, i) => { d.liftTo = 0; d.moveTo(cx, cy, 16 + i * 2, 0.7, 24); });
            yield 20;
            for (const d of this.aside[me]) d.fadeOut(8);
            yield 10;
            for (const d of this.aside[me]) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
            this.aside[me] = [];
            yield 24;
        }
        // Dziadek Ozzy sometimes mutters what the hero's throw will show - and he is right (the dice are already thrown)
        maybeVision(r) {
            const g = this.game;
            const forced = this.opts.visions !== undefined;   // (tests: the chance given)
            if (!VISIONS || !g.opp.visions || g.visions >= 1 || (!forced && g.match.turnNo < 3) || g.R.talk() >= (forced ? Number(this.opts.visions) : 0.2)) return null;
            g.visions++;
            const text = visionText(r.dice.map(d => d.face), g.opp.lines.vision, g.R.talk);
            this.sayText(1, text, true);
            return text;
        }
        *visionAfter() {
            const g = this.game;
            yield 26;
            snd("vision");
            this.sayText(1, pickOf(g.R.talk, g.opp.lines.vision.after), true);
            yield 50;
            this.say(0, "vision", undefined, true);
            const st = store();
            st.visions = (st.visions || 0) + 1;
            if (st.visions === 1) this.rewards.notes.push(["Dziadek Ozzy i kości", "Grałem z Dziadkiem Ozzym w kości. Zanim kości wypadły z kubka, wymamrotał, co pokażą. Zgadzało się co do oczka.\nPijacki fart? Ozzy mówi czasem rzeczy, których nie mógłby wiedzieć..."]);
            yield 40;
        }
        *endFlow() {
            const g = this.game, m = g.match, won = m.winner === 0;
            this.waitHero = null;
            yield 20;
            this.shown = m.players.map(p => p.total);
            this.bustL.lightTo = this.bustR.lightTo = 1;
            this.banner.show(won ? "win" : "lose", won ? "Wygrana!" : "Przegrana", won ? "Pula " + gold(g.pot) + " jest twoja" : g.opp.short + " zgarnia pulę", 170, FELT.y + 118);
            if (won) { AudioManager.playMe({ name: "Item", volume: 70, pitch: 100, pan: 0 }); this.bustL.hop = 16; this.sparks(POT.x, POT.y, 24); }
            else { snd("lose"); this.bustR.hop = 16; }
            // the coins fly to the winner
            const to = won ? { x: SIDE_L.x + 60, y: SIDE_L.y + 46 } : { x: SIDE_R.x + 40, y: SIDE_R.y + 24 };
            const n = clamp(Math.ceil(g.pot / 5), 3, 14);
            let arrived = 0;
            yield 30;
            for (let i = 0; i < n; i++) {
                const from = { x: POT.x + (this.fxRng() - 0.5) * 40, y: POT.y + (this.fxRng() - 0.5) * 14 };
                this.addFx(this.coinFly(from, to, i * 4, 34, () => { arrived++; g.potShown = Math.round(g.pot * (1 - arrived / n)); se("Coin", 40, 95 + Math.floor(this.fxRng() * 25)); }));
            }
            yield () => arrived >= n;
            g.potShown = 0;
            this.finishGame(won ? "won" : "lost");
            this.say(1, g.gift ? "give" : g.giftGold ? "giveGold" : won ? "lose" : "win", undefined, true);
            g.closing = this.bubbleR.text;
            yield 70;
            this.openEnd();
        }

        // ==============================================================
        // The hero's hands: the dice and the buttons (keys and the mouse)
        // ==============================================================
        selection() {
            const idx = [];
            this.dice.forEach((d, i) => { if (d.liftTo > 0) idx.push(i); });
            const m = this.game && this.game.match;
            if (!idx.length || !m || !m.thrown) return { idx, n: 0, valid: false, points: 0, name: "" };
            const s = score(idx.map(i => m.thrown[i].face));
            return { idx, n: idx.length, valid: s.valid, points: s.points, name: s.name };
        }
        buttons() {
            const m = this.game && this.game.match, w = this.waitHero, sel = w === "choose" ? this.selection() : null;
            const left = m && sel ? (m.turn.free.length - sel.n) : 0;
            return BTN.map(b => {
                const o = Object.assign({}, b, { y: 0, h: BAR.h });
                if (b.id === "roll") {
                    o.label = w === "choose" ? (sel.valid && left === 0 ? "Rzuć wszystkimi (6)" : "Rzuć dalej" + (sel.valid ? " (" + left + ")" : "")) : "Rzuć kośćmi";
                    o.enabled = w === "throw" || (w === "choose" && sel.valid);
                } else if (b.id === "bank") {
                    o.label = w === "choose" && sel.valid ? "Zapisz " + (m.turn.pts + sel.points) : "Zapisz punkty";
                    o.enabled = w === "choose" && sel.valid;
                } else o.enabled = this.phase === "play";
                return o;
            });
        }
        heroInput() {
            const t = this.trig, btns = this.buttons();
            // the mouse: hovering moves the focus, a click acts
            const at = p => {
                if (!p) return null;
                if (this.waitHero === "choose") for (let i = this.dice.length - 1; i >= 0; i--) if (this.dice[i].hit(p.x, p.y)) return { row: "die", i };
                for (let i = 0; i < btns.length; i++) { const b = btns[i]; if (p.x >= BAR.x + b.x && p.x < BAR.x + b.x + b.w && p.y >= BAR.y && p.y < BAR.y + BAR.h) return { row: "btn", i }; }
                return null;
            };
            const hov = at(this.hover);
            if (hov && (hov.row !== this.focus.row || hov.i !== this.focus.i)) this.focus = hov;
            const clk = at(this.click);
            if (clk) { this.focus = clk; this.activate(btns); return; }
            if (t.left || t.right || t.up || t.down) this.moveFocus(t, btns);
            else if (t.ok) this.activate(btns);
        }
        moveFocus(t, btns) {
            const f = this.focus, dirs = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
            const [dx, dy] = dirs[t.left ? "left" : t.right ? "right" : t.up ? "up" : "down"];
            const dice = this.waitHero === "choose" ? this.dice : [];
            if (f.row === "die" && dice[f.i]) {
                const bestI = this.nextDie(f.i, dx, dy);
                if (bestI >= 0) this.focus = { row: "die", i: bestI };
                else if (dy > 0) this.focus = { row: "btn", i: btns[1].enabled ? 1 : btns[2].enabled ? 2 : 1 };
                else return;
            } else {
                if (dx) {
                    let i = f.row === "btn" ? f.i : 1;
                    for (let k = 0; k < btns.length; k++) { i = (i + dx + btns.length) % btns.length; if (btns[i].enabled) break; }
                    this.focus = { row: "btn", i };
                } else if (dy < 0 && dice.length) {
                    const bx = BAR.x + btns[f.i].x + btns[f.i].w / 2;
                    let bi = 0;
                    dice.forEach((d, i) => { if (Math.abs(d.tx - bx) + (BAR.y - d.ty) * 0.3 < Math.abs(dice[bi].tx - bx) + (BAR.y - dice[bi].ty) * 0.3) bi = i; });
                    this.focus = { row: "die", i: bi };
                } else return;
            }
            snd("cursor");
        }
        // while the hero only watches: "Zasady" and "Odejdź" still take a click
        sideButtons() {
            const p = this.click;
            for (const x of this.buttons()) {
                if (!x.enabled || (x.id !== "rules" && x.id !== "leave")) continue;
                if (p.x >= BAR.x + x.x && p.x < BAR.x + x.x + x.w && p.y >= BAR.y && p.y < BAR.y + BAR.h) {
                    if (x.id === "rules") { snd("decide"); this.showRules(); } else this.askLeave();
                    return;
                }
            }
        }
        // the die an arrow leads to from die i (dx, dy: the arrow), or -1: the nearest one that way, sideways distance counting more
        nextDie(i, dx, dy) {
            const dice = this.dice, me = dice[i];
            let bestI = -1, bestD = Infinity;
            if (!me) return -1;
            dice.forEach((d, j) => {
                if (j === i) return;
                const ax = d.tx - me.tx, ay = d.ty - me.ty, along = ax * dx + ay * dy, across = Math.abs(ax * dy - ay * dx);
                if (along <= 8) return;
                const dist = along + across * 1.6;
                if (dist < bestD) { bestD = dist; bestI = j; }
            });
            return bestI;
        }
        activate(btns) {
            const f = this.focus;
            if (f.row === "die") {
                const d = this.dice[f.i];
                if (!d || this.waitHero !== "choose") return;
                d.liftTo = d.liftTo > 0 ? 0 : 1;
                snd(d.liftTo ? "on" : "off");
                return;
            }
            const b = btns[f.i];
            if (!b) return;
            if (!b.enabled) { snd("buzzer"); this.pillFlash = 40; return; }
            if (b.id === "rules") { snd("decide"); this.showRules(); return; }
            if (b.id === "leave") { this.askLeave(); return; }
            if (b.id === "roll" && this.waitHero === "throw") { snd("decide"); this.heroAct = { kind: "throw" }; return; }
            const sel = this.selection();
            if (!sel.valid) { snd("buzzer"); this.pillFlash = 40; return; }
            snd("decide");
            this.heroAct = { idx: sel.idx, bank: b.id === "bank" };
        }
        placeFocus() {
            const f = this.focus, s = this.focusSpr;
            const show = this.phase === "play" && this.waitHero === "choose" && f.row === "die" && this.dice[f.i] && !this.dice[f.i].busy();
            s.visible = !!show;
            if (!show) return;
            const d = this.dice[f.i], pulse = 1 + Math.sin(Graphics.frameCount / 9) * 0.035;
            s.x = d.x; s.y = d.y + d.body.y;
            s.scale.set(pulse * (1 + d.lift * 0.06));
        }

        // ==============================================================
        // The table's lobby: who sits there, the stake, the hero's six dice
        // ==============================================================
        openLobby() {
            this.phase = "lobby";
            this.phaseT = 0;
            this.game = null;
            this.co = null;
            this.waitHero = null;
            this.clearTable(true);
            this.bustL.want = this.bustR.want = false;
            this.bubbleL.hide(); this.bubbleR.hide();
            const list = this.opts.opponent && OPPONENTS[this.opts.opponent] ? [{ key: this.opts.opponent, tired: false }] : present(hourNow(), dayNow(), this.opts.only);
            const cards = list.map(p => ({ key: p.key, tired: p.tired, afford: $gameParty.gold() >= OPPONENTS[p.key].stakes[0] }));
            const L = this.lobby = { cards, sel: 0, row: "cards", i: 0, stakeI: 0, slot: 0, btn: 1, hint: this.opts.opponent ? "" : this.fameHint() };
            const ok = cards.findIndex(c => !c.tired && c.afford);
            L.sel = L.i = ok >= 0 ? ok : 0;
            if (this.lastPick) { const j = cards.findIndex(c => c.key === this.lastPick.key); if (j >= 0 && !cards[j].tired) { L.sel = L.i = j; } }
            this.fixStake(this.lastPick ? this.lastPick.stake : 0);
            if (!cards.length) { L.row = "buttons"; L.btn = 2; }
            else if (!this.canPlay()) { L.row = "buttons"; L.btn = 2; }
        }
        lobbyCard() { const L = this.lobby; return L && L.cards[L.sel] ? L.cards[L.sel] : null; }
        // who is in the hall but does not play with the hero yet: the words for the lobby
        fameHint() {
            const lk = locked(hourNow(), dayNow());
            if (lk.includes("kupiec")) return "Przy oknie siedzi bogaty kupiec z miasta, ale gra tylko z ludźmi, których zna.";
            if (lk.includes("nieznajomy") && (fame() || 0) >= 60) return "W kącie ktoś w kapturze przygląda się stołom. Podobno gra tylko z chlubą tawerny.";
            return "";
        }
        stakesOf(card) { return card ? OPPONENTS[card.key].stakes : []; }
        fixStake(want) {
            const L = this.lobby, st = this.stakesOf(this.lobbyCard()), g = $gameParty.gold();
            if (!st.length) { L.stakeI = 0; return; }
            let i = want ? st.indexOf(want) : -1;
            if (i < 0 || st[i] > g) { i = 0; for (let k = 0; k < st.length; k++) if (st[k] <= g) { i = k; break; } }
            L.stakeI = i;
        }
        lobbyStake() { const st = this.stakesOf(this.lobbyCard()); return st[this.lobby.stakeI] || 0; }
        canPlay() {
            const c = this.lobbyCard();
            return !!c && !c.tired && $gameParty.gold() >= this.lobbyStake() && this.lobbyStake() > 0;
        }
        hasSpecials() { return SPECIAL_ORDER.some(k => ownedCount(k) > 0); }
        lobbyRows() {
            const rows = [];
            if (this.lobby.cards.length) rows.push("cards", "stake");
            if (this.hasSpecials()) rows.push("dice");
            rows.push("buttons");
            return rows;
        }
        lobbyInput() {
            const t = this.trig, L = this.lobby;
            const hit = this.hitAt(this.click) || null, hov = this.hitAt(this.hover);
            if (hov) this.lobbyFocus(hov, false);
            if (hit) { this.lobbyFocus(hit, true); this.lobbyOk(hit); return; }
            if (t.back) { snd("cancel"); this.leave(); return; }
            const rows = this.lobbyRows(), r = rows.indexOf(L.row);
            if (t.up || t.down) {
                const nr = clamp(r + (t.down ? 1 : -1), 0, rows.length - 1);
                if (nr !== r) { L.row = rows[nr]; if (L.row === "buttons") L.btn = this.canPlay() ? 1 : 2; snd("cursor"); }
                return;
            }
            if (t.left || t.right) {
                const d = t.right ? 1 : -1;
                if (L.row === "cards" && L.cards.length) { const i = clamp(L.i + d, 0, L.cards.length - 1); if (i !== L.i) { L.i = L.sel = i; this.fixStake(this.lobbyStake()); snd("cursor"); } }
                else if (L.row === "stake") this.cycleStake(d);
                else if (L.row === "dice") { L.slot = (L.slot + d + 6) % 6; snd("cursor"); }
                else if (L.row === "buttons") { L.btn = (L.btn + d + 3) % 3; snd("cursor"); }
                return;
            }
            if (t.ok) this.lobbyOk({ row: L.row, i: L.row === "cards" ? L.i : L.row === "dice" ? L.slot : L.btn });
        }
        lobbyFocus(h, quiet) {
            const L = this.lobby;
            if (h.row === "cards") { if (L.row !== "cards" || L.i !== h.i) { L.row = "cards"; L.i = L.sel = h.i; this.fixStake(this.lobbyStake()); } }
            else if (h.row === "stake") L.row = "stake";
            else if (h.row === "dice") { L.row = "dice"; L.slot = h.i; }
            else if (h.row === "buttons") { L.row = "buttons"; L.btn = h.i; }
        }
        lobbyOk(h) {
            const L = this.lobby;
            if (h.row === "cards") {
                const c = L.cards[h.i];
                if (!c || c.tired || !c.afford) { snd("buzzer"); return; }
                L.row = "stake"; snd("decide");
            } else if (h.row === "stake") {
                if (h.dir) { this.cycleStake(h.dir); return; }
                L.row = "buttons"; L.btn = this.canPlay() ? 1 : 2; snd("decide");
            } else if (h.row === "dice") this.cycleSlot(h.i);
            else if (h.row === "buttons") {
                if (h.i === 0) { snd("decide"); this.showRules(); }
                else if (h.i === 1) {
                    if (!this.canPlay()) { snd("buzzer"); return; }
                    snd("decide");
                    const c = this.lobbyCard(), stake = this.lobbyStake();
                    this.lastPick = { key: c.key, stake };
                    this.beginGame(c.key, stake);
                } else { snd("cancel"); this.leave(); }
            }
        }
        cycleStake(d) {
            const L = this.lobby, st = this.stakesOf(this.lobbyCard()), g = $gameParty.gold();
            for (let k = 1; k <= st.length; k++) {
                const i = (L.stakeI + d * k + st.length * 4) % st.length;
                if (st[i] <= g) { if (i !== L.stakeI) { L.stakeI = i; snd("cursor"); } return; }
            }
            snd("buzzer");
        }
        // O on a die of the set: the next kind the hero has (plain ones always)
        cycleSlot(i) {
            const st = store(), kinds = ["std"].concat(SPECIAL_ORDER.filter(k => ownedCount(k) > 0));
            if (kinds.length < 2) { snd("buzzer"); return; }
            const set = heroSet(), cur = kinds.indexOf(set[i]);
            for (let k = 1; k <= kinds.length; k++) {
                const next = kinds[(cur + k) % kinds.length];
                const used = set.filter((x, j) => j !== i && x === next).length;
                if (next === "std" || used < ownedCount(next)) { set[i] = next; st.set = set; snd("on"); return; }
            }
        }
        hitAt(p) {
            if (!p || !this.hits) return null;
            for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (p.x >= h.x && p.x < h.x + h.w && p.y >= h.y && p.y < h.y + h.h) return h; }
            return null;
        }

        // ==============================================================
        // The rules card, leaving, the end of a game
        // ==============================================================
        showRules() {
            if (this.phase === "rules") return;
            this.rulesBack = this.phase === "none" ? "lobby" : this.phase;
            this.phase = "rules";
            this.phaseT = 0;
        }
        rulesInput() {
            const t = this.trig;
            if (this.phaseT > 8 && (t.ok || t.back || this.click)) {
                snd(t.back ? "cancel" : "decide");
                store().rulesSeen = true;
                this.phase = this.rulesBack || "lobby";
                this.phaseT = 0;
            }
        }
        askLeave() {
            const g = this.game;
            if (!g || g.done) { this.leave(); return; }
            snd("cancel");
            this.confirmSel = 0;
            this.phase = "confirm";
            this.phaseT = 0;
        }
        confirmInput() {
            const t = this.trig, h = this.hitAt(this.click), hov = this.hitAt(this.hover);
            if (hov && hov.row === "confirm") this.confirmSel = hov.i;
            if (h && h.row === "confirm") { this.confirmSel = h.i; t.ok = true; }
            if (t.left || t.right) { this.confirmSel = 1 - this.confirmSel; snd("cursor"); }
            else if (t.back || (t.ok && this.confirmSel === 0)) { snd("cancel"); this.phase = "play"; this.phaseT = 0; }
            else if (t.ok && this.confirmSel === 1) { snd("decide"); this.forfeit(); }
        }
        forfeit() {
            const g = this.game;
            if (g && !g.done) {
                g.left = true;
                this.finishGame("left");
            }
            this.leave();
        }
        // the game is over: the pot, the records, a gift, what the map shows afterwards, the time it took
        finishGame(outcome) {
            const g = this.game, m = g.match, st = store(), v = vsOf(g.key);
            if (g.done) return;
            g.done = true;
            const won = outcome === "won", left = outcome === "left";
            st.games++; v.games++;
            if (won) {
                st.wins++; v.wins++; v.lostToday++;
                st.net += g.stake;
                st.biggestPot = Math.max(st.biggestPot || 0, g.pot);
                $gameParty.gainGold(g.pot);
            } else {
                if (left) st.left++; else st.losses++;
                v.losses++;
                st.net -= g.stake;
            }
            const hb = m.players[0].best;
            if (hb && (!st.bestThrow || hb.points > st.bestThrow.points)) st.bestThrow = { points: hb.points, name: hb.name, faces: hb.faces.slice(), day: dayNow(), vs: g.key };
            if (won && g.opp.die && !v.given) {
                const d = g.opp.die;
                if (d.giveOnce && d.orGold && ownedCount(d.key) > 0) {   // (he would give his die, but the hero has one: gold)
                    v.given = true; v.gift = "gold";
                    g.giftGold = d.orGold;
                    $gameParty.gainGold(d.orGold);
                    st.net += d.orGold;
                    this.rewards.notices.push(["Sakiewka od: " + g.opp.name + " (+" + gold(d.orGold) + ")", ST().accent, null]);
                } else if (d.giveOnce || (d.giveAfter && v.wins >= d.giveAfter) || (d.giveAtStake && g.stake >= d.giveAtStake)) {
                    v.given = true; v.gift = d.key;
                    giveDie(d.key);
                    g.gift = d.key;
                    const T = DIE_TYPES[d.key];
                    this.rewards.notes.push(["Nowa kość: " + T.name, "Dostałem ją od: " + g.opp.name + ".\n" + T.desc + "\n" + T.effect + "\nPrzy stole do kości mogę ją wybrać do swojej szóstki."]);
                    this.rewards.notices.push(["Nowa kość do gry: " + T.name, ST().accent, T.effect]);
                }
            }
            if (won) {
                g.xp = Math.round(XP_BASE + g.stake * XP_PER_G);
                this.rewards.xp += g.xp;
                if (!st.firstWin) {
                    st.firstWin = true;
                    this.rewards.notes.push(["Pierwsza wygrana w kości", "Wygrałem pierwszą partię kości w tawernie „Pod Złotym Kuflem”. Rywal: " + g.opp.name + ", pula " + gold(g.pot) + ".\nSzczęście? Może. Ale odłożyć właściwe kości też trzeba umieć."]);
                }
                if (g.pot >= BIG_POT) this.rewards.notices.push(["Wielka wygrana w kości: +" + gold(g.pot) + "!", ST().accent, "Pula od: " + g.opp.name]);
            }
            const minutes = Math.round(MIN_BASE + MIN_TURN * m.turnNo);
            if (window.$gameSystem && typeof $gameSystem.advanceDayNight === "function" && minutes > 0) $gameSystem.advanceDayNight(minutes / 60);
            const rec = {
                opponent: g.key, stake: g.stake, pot: g.pot, won, left, hero: m.players[0].total, rival: m.players[1].total, target: m.target,
                turns: m.turnNo, busts: m.players[0].busts, hot: m.players[0].hot, best: hb ? { points: hb.points, name: hb.name } : null,
                gift: g.gift, giftGold: g.giftGold || 0, xp: g.xp || 0, minutes, day: dayNow()
            };
            st.last = rec;
            this.results.push(rec);
            if (RESULT_VAR > 0 && window.$gameVariables) $gameVariables.setValue(RESULT_VAR, won ? 1 : left ? 3 : 2);
            api().lastGame = rec;
            TW.emit(won ? "diceWin" : "diceLose", { rival: g.key, name: g.opp.name, stake: g.stake, pot: g.pot, net: won ? g.stake : -g.stake, left });
        }
        // what "Jeszcze raz" would do, or why not: null when fine
        againBlock() {
            const g = this.game;
            if (!g) return "—";
            if (this.opts.once) return "Tylko jedna partia.";
            if (vsOf(g.key).lostToday >= g.opp.perDay) return g.opp.short + " już dziś nie zagra.";
            if (!this.opts.opponent && !present(hourNow(), dayNow()).some(p => p.key === g.key)) return "Robi się późno — " + g.opp.short + " odchodzi od stołu.";
            if ($gameParty.gold() < g.stake) return "Za mało złota na tę stawkę.";
            return null;
        }
        openEnd() {
            this.bubbleR.hide();
            this.phase = "end";
            this.phaseT = 0;
            this.waitHero = null;
            const again = !this.againBlock(), lobby = !this.opts.opponent;
            this.endBtns = [
                { id: "again", label: "Jeszcze raz", enabled: again, primary: true },
                { id: "lobby", label: "Inna gra", enabled: lobby },
                { id: "leave", label: "Odchodzę", enabled: true }
            ];
            this.endSel = again ? 0 : 2;
        }
        endInput() {
            const t = this.trig, h = this.hitAt(this.click), hov = this.hitAt(this.hover);
            if (hov && hov.row === "end" && this.endBtns[hov.i].enabled) this.endSel = hov.i;
            if (h && h.row === "end") { this.endSel = h.i; t.ok = true; }
            if (this.phaseT < 20) return;
            if (t.left || t.right) {
                const d = t.right ? 1 : -1;
                for (let k = 1; k <= 3; k++) { const i = (this.endSel + d * k + 9) % 3; if (this.endBtns[i].enabled) { this.endSel = i; break; } }
                snd("cursor");
            } else if (t.back) { snd("cancel"); this.leave(); }
            else if (t.ok) {
                const b = this.endBtns[this.endSel];
                if (!b.enabled) { snd("buzzer"); return; }
                snd("decide");
                if (b.id === "again") { const g = this.game; this.bubbleR.hide(); this.beginGame(g.key, g.stake); }
                else if (b.id === "lobby") { this.lastPick = { key: this.game.key, stake: this.game.stake }; this.openLobby(); }
                else this.leave();
            }
        }
        // back to the map: the result for onEnd, the rewards shown there (TawernaUI hands them over once the map is back)
        leave() {
            if (this.phase === "leaving" || this.phase === "left") return;
            const res = this.summary(), onEnd = this.opts.onEnd, rewards = this.rewards;
            api().lastResult = res;
            this.co = null;
            this.waitHero = null;
            this.phase = "leaving";
            this.opts.onEnd = r => P.core.applyRewards({ result: r, onEnd, rewards });
            this.end(res);
        }
        summary() {
            const r = this.results, net = r.reduce((a, x) => a + (x.won ? x.stake : -x.stake), 0);
            return { played: r.length, won: r.filter(x => x.won).length, lost: r.filter(x => !x.won && !x.left).length, left: r.filter(x => x.left).length, net, games: r.slice(), last: r.length ? r[r.length - 1] : null };
        }
    }
    // the HUD and the panels over the table (TavernDice_Art.js)
    for (const k of Object.getOwnPropertyNames(DicePanels.prototype)) {
        if (k !== "constructor") Object.defineProperty(Scene_TavernDice.prototype, k, Object.getOwnPropertyDescriptor(DicePanels.prototype, k));
    }
    Scene_TavernDice.gameId = "TavernDice";   // (the bus's miniGameStart / miniGameEnd)
    P.Scene = Scene_TavernDice;
    window.Scene_TavernDice = Scene_TavernDice;
})();
