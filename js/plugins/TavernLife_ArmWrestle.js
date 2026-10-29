//=============================================================================
// TavernLife_ArmWrestle.js
//=============================================================================
// Arm-wrestling with Grum at the game room's table (<Tavern:arm>): the talk (the stake), the mini-game on Tawerna.ui.Scene_MiniGame
// (TawernaUI.js: the blurred tavern behind, the rules and result cards, the pause, the key hints, seed and turbo for the tests), and
// what its end does (TavernLife.js settles it on the map). The stakes are TavernLife's parameter "armStakes".

/*:
 * @target MZ
 * @plugindesc Siłowanie na rękę z Grumem (część TavernLife.js): rozmowa o stawkę, mini-gra ze wskazówką siły, wynik. Stawki ustawiasz w TavernLife. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @help
 * ============================================================================
 * TavernLife_ArmWrestle.js - siłowanie na rękę z Grumem
 * ============================================================================
 * Część TavernLife.js. Stół do siłowania to zdarzenie z komentarzem
 * <Tavern:arm>; O przy nim: Grum pyta o stawkę (parametr „Siłowanie:
 * stawki” w TavernLife), potem mini-gra.
 *
 * Trzy rundy: wskazówka SIŁY ma zostać w zielonym polu (przytrzymaj albo
 * stukaj O), a Grum co chwila szarpie. W polu twoja ręka zyskuje, poza nim
 * zyskuje Grum; kto pierwszy wygra dwie, bierze stawkę. Siła poszerza
 * zielone pole, Kondycja łagodzi szarpnięcia. Po każdej jego przegranej
 * Grum bierze się mocniej do roboty. P - pauza (grać dalej albo się poddać).
 *
 * KOLEJNOŚĆ: pod TavernLife.js. Obraz rąk:
 * img/pictures/Tav_Arms.png.
 * Dla testów: TavernLife.armWrestle({ stake, seed, turbo, level, onEnd }).
 * Inny przeciwnik (turniej na targu, TownQuests D6): opcja rival
 * { key, name, sub, bust, lines, level, kicker, with }.
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("silowanie");   // (the words of this file: js/teksty/silowanie.txt, kod.*)

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_ArmWrestle.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_ArmWrestle.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib, ui = T.ui;
    const { clamp, ease, hash, pick, U, GOOD, BAD, se, attr, gold, needGold, popup, bark, cached, dirty, dropBitmap, S, npc, bustOf, sayAs, choose } = lib;
    const ARM_STAKES = lib.config.ARM_STAKES;
    const ARM = { minutes: 15, stamina: 6, xpWin: 15, xpLose: 4, needStamina: 15 };
    const ARMS_PICTURE = "Tav_Arms";
    const W1 = 1280;
    // (the old cards' text: a line 1.4 times the size)
    const cardText = (b, s, x, y, w, size, colour, bold, align) => ui.text(b, s, x, y, w, { size, color: colour || U().text, bold, align, lh: Math.round(size * 1.4) });

    // ------------------------------------------------------------------
    // ARM WRESTLING with Grum: keep the needle of strength in the green field (hold or tap O) while Grum jerks now and then; in the
    // field your arm wins ground, out of it his does. Three rounds (two won ends it). Siła widens the field, Kondycja softens his jerks.
    // ------------------------------------------------------------------
    const AW = {
        pivot: { x: 640, y: 655 }, scale: 1.55, maxTilt: 0.46, slamTilt: 0.95,
        dial: { x: 640, y: 196, r: 118, a0: Math.PI + 0.3, a1: Math.PI * 2 - 0.3 },
        hold: 0.0024, tap: 0.012, gravity: 0.0014, damp: 0.93,
        gain: 0.0036, loss: 0.0022, roundTicks: 2400
    };
    const grumLines = {
    };
    Watki.scal(grumLines, "silowanie", "grum");   // (its words: js/teksty/silowanie.txt, grum)
    function armTableBitmaps() {
        return cached("armTable", () => {
            const top = new Bitmap(W1, 70), front = new Bitmap(W1, 130), t = top.context, f = front.context;
            t.imageSmoothingEnabled = false;
            const g = t.createLinearGradient(0, 0, 0, 70);
            g.addColorStop(0, "#6b4a2c"); g.addColorStop(1, "#4a321d");
            t.fillStyle = g; t.fillRect(0, 0, W1, 70);
            for (let x = 0; x < W1; x += 160) { t.fillStyle = "rgba(0,0,0,0.3)"; t.fillRect(x, 0, 2, 70); }
            for (let i = 0; i < 90; i++) { t.fillStyle = "rgba(30,18,8," + (0.15 + hash(i, 1) * 0.2).toFixed(2) + ")"; t.fillRect(Math.floor(hash(i, 2) * W1), Math.floor(hash(i, 3) * 66) + 2, 20 + Math.floor(hash(i, 4) * 60), 2); }
            t.fillStyle = "rgba(255,220,160,0.18)"; t.fillRect(0, 0, W1, 3);
            const g2 = f.createLinearGradient(0, 0, 0, 130);
            g2.addColorStop(0, "#3a2616"); g2.addColorStop(1, "#1d130b");
            f.fillStyle = g2; f.fillRect(0, 0, W1, 130);
            f.fillStyle = "#7a5634"; f.fillRect(0, 0, W1, 6);
            f.fillStyle = "#2a1a0e"; f.fillRect(0, 6, W1, 3);
            for (let x = 40; x < W1; x += 200) { f.fillStyle = "rgba(0,0,0,0.35)"; f.fillRect(x, 10, 3, 120); f.fillStyle = "#8a6a45"; f.fillRect(x - 1, 30, 5, 5); f.fillRect(x - 1, 96, 5, 5); }
            dirty(top); dirty(front);
            return { top, front };
        });
    }
    function dialBackBitmap() {
        return cached("dialBack", () => {
            const d = AW.dial, b = new Bitmap(360, 200), ctx = b.context, cx = 180, cy = 166, S0 = U();
            ctx.save();
            ctx.fillStyle = "rgba(11,12,15,0.9)";
            ctx.beginPath(); ctx.arc(cx, cy, d.r + 34, Math.PI, Math.PI * 2); ctx.lineTo(cx + d.r + 34, cy + 22); ctx.lineTo(cx - d.r - 34, cy + 22); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = S0.line; ctx.lineWidth = 1; ctx.stroke();
            ctx.lineCap = "butt";
            ctx.strokeStyle = "#1c1f25"; ctx.lineWidth = 22;
            ctx.beginPath(); ctx.arc(cx, cy, d.r, d.a0, d.a1); ctx.stroke();
            ctx.strokeStyle = "#2b2f37"; ctx.lineWidth = 1;
            for (let i = 0; i <= 20; i++) {
                const a = d.a0 + (d.a1 - d.a0) * i / 20, r0 = d.r + (i % 5 === 0 ? 14 : 12), r1 = d.r + 20;
                ctx.strokeStyle = i % 5 === 0 ? "#6d737d" : "#3d424b"; ctx.lineWidth = i % 5 === 0 ? 2 : 1;
                ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
            }
            ctx.restore();
            cardText(b, TK.kod.dialBackBitmap[0], cx - d.r - 32, cy - 2, 80, 14, S0.muted);
            cardText(b, TK.kod.dialBackBitmap[1], cx + d.r - 46, cy - 2, 80, 14, S0.muted, false, "right");
            cardText(b, TK.kod.dialBackBitmap[2], cx - 60, cy + 14, 120, 13, S0.muted, true, "center");
            dirty(b);
            return b;
        });
    }

    class Scene_ArmWrestle extends lib.gameScene() {
        createGame() {
            // (2026-10-06) another opponent than Grum (D6's tournament at the market): opts.rival { key, name, sub, bust, lines, level }
            const rv = this.opts.rival || null;
            this.rivalKey = rv ? rv.key || "rival" : "grum";
            this.rivalName = rv ? rv.name : "Grum";
            this.rivalSub = rv ? rv.sub || "" : TK.kod.createGame[0];
            this.rivalBust = rv ? rv.bust || bustOf("grum") : bustOf("grum");
            this.L = rv && rv.lines ? Object.assign({}, grumLines, rv.lines) : grumLines;
            this.level = clamp(this.opts.level !== undefined ? Number(this.opts.level) : rv && rv.level !== undefined ? Number(rv.level) : S().arm.level, 0, 6);
            this.str = attr("str");
            this.con = attr("con");
            this.zoneW = clamp(0.17 + 0.0035 * (this.str - 5), 0.17, 0.34) * (1 - 0.03 * this.level);
            this.first = !S().firsts.arm;
            const tb = armTableBitmaps();
            this.hero = new Sprite(this.pic(ui.heroBust()));
            this.hero.anchor.set(0.5, 1);
            this.hero.scale.set(-1.16, 1.16);
            this.hero.x = 300; this.hero.y = 628;
            this.grum = new Sprite(this.pic(this.rivalBust));
            this.grum.anchor.set(0.5, 1);
            this.grum.scale.set(1.16, 1.16);
            this.grum.x = 990; this.grum.y = 628;
            this.top = new Sprite(tb.top); this.top.y = 560;
            this.arms = new Sprite(this.pic(ARMS_PICTURE));
            this.arms.anchor.set(0.5, 244 / 256);
            this.arms.scale.set(AW.scale, AW.scale);
            this.arms.x = AW.pivot.x; this.arms.y = AW.pivot.y;
            this.front = new Sprite(tb.front); this.front.y = 616;
            this.dialBack = new Sprite(dialBackBitmap());
            this.dialBack.x = AW.dial.x - 180; this.dialBack.y = AW.dial.y - 166;
            this.dial = new Sprite(new Bitmap(360, 240));
            this.dial.x = this.dialBack.x; this.dial.y = this.dialBack.y;
            this.drops = [];
            for (const s of [this.hero, this.grum, this.arms, this.top, this.front, this.dialBack, this.dial]) this.root.addChild(s);
            this.bubbleL.move(60, 250);
            this.bubbleR.move(1220, 250);
            // the state
            this.round = 0; this.youWon = 0; this.heWon = 0; this.rounds = [];
            this.n = 0.12; this.v = 0; this.b = 0; this.zc = 0.5; this.zt = 0.5; this.zNext = 0; this.burstAt = 0; this.shake = 0;
            this.tilt = 0; this.inZone = false; this.ticks = 0; this.zoneTicks = 0;
        }
        begin() {
            const hello = this.L.hello[Math.min(this.level, this.L.hello.length - 1)];
            const rv = this.opts.rival, kick = rv && rv.kicker ? rv.kicker : Watki.wstaw(TK.kod.begin[1], { "1": this.level && !rv ? Watki.wstaw(TK.kod.begin[0], { level: this.level }) : "" });
            const card = { bust: this.rivalBust, who: this.rivalName, whoSub: this.rivalSub, kicker: kick,
                title: this.stake ? Watki.wstaw(TK.kod.begin[2], { stake: this.stake }) : TK.kod.begin[3], say: hello,
                lines: this.first ? [TK.kod.begin[4],
                    Watki.wstaw(TK.kod.begin[5], { rivalName: this.rivalName }),
                    TK.kod.begin[6]]
                    : [TK.kod.begin[7], TK.kod.begin[8]],
                keys: [["O", TK.kod.begin[9]], ["P", "pauza"]], foot: TK.kod.begin[10] };
            this.showCard(Object.assign(card, { wait: 16 }), () => this.nextRound());   // (O after 16 ticks: Decision, then the first round)
            this.setPhase("card");
        }
        tick() {
            switch (this.phase) {
                case "ready":
                    if (this.phaseT === 1) this.sayOver("bubbleR", pick(this.L.round, this.rng), 110);
                    if ([20, 50, 80].includes(this.phaseT)) se("Cursor2", 60, 90 + this.phaseT / 4);
                    if (this.phaseT >= 110) { se("Blow1", 70, 80); this.setPhase("pull"); }
                    break;
                case "pull":
                    this.pull();
                    break;
                case "slam":
                    if (this.phaseT >= 70) {
                        if (this.youWon >= 2 || this.heWon >= 2 || this.round >= 3) this.finish(false);
                        else this.nextRound();
                    }
                    break;
            }
        }
        canPause() { return this.phase === "pull"; }
        helpLines() {
            return [TK.kod.helpLines[0],
                Watki.wstaw(TK.kod.helpLines[1], { rivalName: this.rivalName })];
        }
        nextRound() {
            this.round++;
            this.n = 0.1; this.v = 0; this.b = 0; this.tilt = 0; this.ticks = 0;
            this.zc = 0.35 + this.rng() * 0.3; this.zt = this.zc; this.zNext = 60; this.burstAt = this.nextBurst();
            this.setPhase("ready");
        }
        nextBurst() { return Math.round((150 - 14 * this.level) + this.rng() * 90); }
        pull() {
            const k = this.keys, kt = this.trig, lo = () => this.zc - this.zoneW / 2, hi = () => this.zc + this.zoneW / 2;
            this.ticks++;
            // the needle: holding lifts it, a tap kicks it up, it sinks by itself
            if (k.ok) this.v += AW.hold;
            if (kt.ok) this.v += AW.tap;
            this.v -= AW.gravity;
            this.v *= AW.damp;
            this.n += this.v;
            if (this.n < 0) { this.n = 0; this.v = Math.max(0, this.v); }
            if (this.n > 1) { this.n = 1; this.v = Math.min(0, this.v); }
            // the field wanders; Grum's jerks knock the needle down and throw the field aside
            if (--this.zNext <= 0) { this.zt = this.zoneW / 2 + 0.06 + this.rng() * (1 - this.zoneW - 0.12); this.zNext = 70 + Math.floor(this.rng() * 90); }
            const speed = 0.004 + 0.0009 * this.level;
            this.zc += clamp(this.zt - this.zc, -speed, speed);
            if (--this.burstAt <= 0) {
                this.burstAt = this.nextBurst();
                this.v -= (0.05 + 0.008 * this.level) * clamp(1 - 0.01 * (this.con - 5), 0.6, 1);
                this.zt = clamp(this.zc + (this.rng() < 0.5 ? -1 : 1) * (0.12 + this.rng() * 0.08), this.zoneW / 2 + 0.04, 1 - this.zoneW / 2 - 0.04);
                this.shake = 14;
                this.sayOver("bubbleR", pick(this.L.burst, this.rng), 60);
                se("Blow1", 55, 70);
            }
            // who gains ground
            this.inZone = this.n >= lo() && this.n <= hi();
            if (this.inZone) { this.b += AW.gain * (1 + 0.004 * (this.str - 5)); this.zoneTicks++; }
            else { const dist = this.n < lo() ? lo() - this.n : this.n - hi(); this.b -= (AW.loss + 0.0005 * this.level) * (1 + dist * 4); }
            this.b = clamp(this.b, -1, 1);
            if (this.ticks % 150 === 75) {
                if (this.b < -0.45) this.sayOver("bubbleR", pick(this.L.winning, this.rng), 100);
                else if (this.b > 0.45) this.sayOver("bubbleR", pick(this.L.losing, this.rng), 100);
                else if (this.inZone && this.rng() < 0.4) this.sayOver("bubbleL", pick(["Nnngh!", TK.kod.pull[0], TK.kod.pull[1]], this.rng), 80);
            }
            if (this.b >= 1 || this.b <= -1 || this.ticks >= AW.roundTicks) this.endRound(this.b > 0 || (this.b === 0 && this.zoneTicks > this.ticks / 2));
        }
        endRound(you) {
            if (you) this.youWon++; else this.heWon++;
            this.rounds.push(you ? "you" : this.rivalKey);
            this.slamTo = you ? 1 : -1;
            se("Blow3", 85, you ? 100 : 80);
            se("Damage1", 45, 120);
            this.shake = 20;
            const last = this.youWon >= 2 || this.heWon >= 2 || this.round >= 3;
            if (!last) this.sayOver("bubbleR", pick(you ? this.L.roundYou : this.L.roundHe, this.rng), 110);
            this.setPhase("slam");
        }
        giveUp() {
            this.heWon = Math.max(this.heWon, 2);
            this.finish(true);
        }
        finish(gaveUp) {
            const won = !gaveUp && this.youWon > this.heWon;
            this.result = { game: "arm", won, stake: this.stake, rounds: this.rounds.slice(), you: this.youWon, grum: this.heWon, gaveUp: !!gaveUp,
                level: this.level, minutes: ARM.minutes, stamina: ARM.stamina, rival: this.opts.rival ? this.rivalKey : "" };
            const line = pick(won ? this.L.lost : this.L.won, this.rng);
            this.result.line = line;
            if (won) se("Applause1", 55);
            this.showCard({ wait: 30, bust: this.rivalBust, who: this.rivalName, whoSub: this.rivalSub, kicker: Watki.wstaw(TK.kod.finish[1], { "1": this.opts.rival && this.opts.rival.kicker ? this.opts.rival.kicker : TK.kod.finish[0] }), title: won ? "Wygrana!" : gaveUp ? TK.kod.finish[2] : "Przegrana",
                titleColor: won ? U().accent : BAD, sub: Watki.wstaw(TK.kod.finish[3], { youWon: this.youWon, heWon: this.heWon, "3": this.stake ? "   ·   " + (won ? "+" : "−") + this.stake + " G" : "" }), subColor: won ? GOOD : BAD,
                say: line, lines: [[Watki.wstaw(TK.kod.finish[4], { minutes: ARM.minutes, stamina: ARM.stamina }), U().muted], [this.opts.rival ? TK.kod.finish[5] : won ? TK.kod.finish[6] : TK.kod.finish[7], U().muted]],
                foot: TK.kod.finish[8], h: 440 }, () => this.leave());
            this.setPhase("summary");
        }
        frame() {
            // the arms: the balance tilts them (towards Grum when you win), a jerk shakes them, the end of a round slams them down
            let want = this.b * AW.maxTilt;
            if (this.phase === "slam") want = this.slamTo * AW.slamTilt * ease(this.phaseT / 10);
            if (this.phase === "ready" || this.phase === "card") want = 0;
            this.tilt += (want - this.tilt) * (this.phase === "slam" ? 0.5 : 0.18);
            const jitter = this.phase === "pull" ? (this.inZone ? 1.2 : 0.6) : 0;
            if (this.shake > 0) this.shake--;
            const sh = this.shake > 0 ? (this.shake % 2 ? 1 : -1) * this.shake * 0.35 : 0;
            this.arms.rotation = this.tilt + (Math.random() - 0.5) * 0.004 * jitter * 4;
            this.arms.x = AW.pivot.x + sh + (Math.random() - 0.5) * jitter;
            this.arms.y = AW.pivot.y + Math.abs(this.tilt) * 18;
            // the busts strain: the one losing leans in
            const strain = this.phase === "pull" ? 1 : 0;
            this.hero.x = 300 + (this.b < 0 ? this.b * 10 : this.b * 4) * strain + (strain ? (Math.random() - 0.5) * 1.5 : 0);
            this.grum.x = 990 + (this.b > 0 ? this.b * 10 : this.b * 4) * strain - sh;
            this.hero.setColorTone([Math.round(Math.max(0, -this.b) * 40 * strain), 0, 0, 0]);
            this.grum.setColorTone([Math.round(Math.max(0, this.b) * 40 * strain), 0, 0, 0]);
            if (strain && this.t % 40 === 0) this.addDrop(this.b < 0.3 ? 300 : 990);
            this.updateDrops();
            if (!this._grumFaded && this.grum.bitmap && this.grum.bitmap.isReady()) this.fadeGrum();
            this.drawDial();
            this.drawHud();
        }
        // the RTP bust ends at the picture's left edge (his raised fist is cut there): that edge fades into the dark
        fadeGrum() {
            const src = this.grum.bitmap, w = src.width, h = src.height, b = new Bitmap(w, h), ctx = b.context;
            b.blt(src, 0, 0, w, h, 0, 0);
            const g = ctx.createLinearGradient(0, 0, 70, 0);
            g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 70, h);
            ctx.globalCompositeOperation = "source-over";
            dirty(b);
            this.grum.bitmap = b;
            this._grumFaded = true;
        }
        addDrop(x) {
            const s = new Sprite(dropBitmap());
            s.scale.set(2, 2);
            s.x = x + (Math.random() - 0.5) * 60; s.y = 330 + Math.random() * 40;
            s._vy = 0.5;
            this.root.addChild(s);
            this.drops.push(s);
        }
        updateDrops() {
            for (let i = this.drops.length - 1; i >= 0; i--) {
                const s = this.drops[i];
                s._vy += 0.12; s.y += s._vy; s.opacity -= 6;
                if (s.opacity <= 0) { this.root.removeChild(s); this.drops.splice(i, 1); }
            }
        }
        drawDial() {
            const d = AW.dial, b = this.dial.bitmap, ctx = b.context, cx = 180, cy = 166, S0 = U(), ang = v => d.a0 + (d.a1 - d.a0) * clamp(v, 0, 1);
            b.clear();
            if (this.phase === "card" || this.phase === "summary") { dirty(b); return; }
            ctx.save();
            ctx.lineCap = "butt";
            const lo = this.zc - this.zoneW / 2, hi = this.zc + this.zoneW / 2, hot = this.inZone && this.phase === "pull";
            if (hot) { ctx.strokeStyle = "rgba(120,240,130,0.25)"; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(cx, cy, d.r, ang(lo), ang(hi)); ctx.stroke(); }
            ctx.strokeStyle = hot ? "#8ef08a" : "#3f9a49"; ctx.lineWidth = 20;
            ctx.beginPath(); ctx.arc(cx, cy, d.r, ang(lo), ang(hi)); ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, d.r + 9, ang(lo), ang(hi)); ctx.stroke();
            // the needle
            const a = ang(this.n), tipR = d.r + 16;
            ctx.lineCap = "round";
            ctx.strokeStyle = "rgba(8,9,11,0.9)"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR); ctx.stroke();
            ctx.strokeStyle = S0.accent; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR); ctx.stroke();
            ctx.fillStyle = "#15171b"; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = S0.accent; ctx.lineWidth = 2; ctx.stroke();
            // the ground: a bar under the dial - your side yellow, Grum's red
            const bw = 300, bx = cx - bw / 2, by = cy + 40;
            ctx.fillStyle = S0.line; ctx.fillRect(bx - 1, by - 1, bw + 2, 12);
            ctx.fillStyle = "#16181c"; ctx.fillRect(bx, by, bw, 10);
            const mid = bx + bw / 2, to = mid + this.b * bw / 2;
            ctx.fillStyle = this.b >= 0 ? S0.accent : "#e5484d";
            ctx.fillRect(Math.min(mid, to), by, Math.abs(to - mid), 10);
            ctx.fillStyle = "#eceef0"; ctx.fillRect(mid - 1, by - 3, 2, 16);
            ctx.restore();
            const lead = this.b > 0.05 ? TK.kod.drawDial[0] : this.b < -0.05 ? this._leadHe || (this._leadHe = Watki.wstaw(TK.kod.drawDial[1], { rivalName: this.rivalName })) : "remis";   // (every frame: the line made once)
            cardText(b, lead, cx - 150, by + 14, 300, 15, this.b > 0.05 ? S0.accent : this.b < -0.05 ? BAD : S0.muted, true, "center");
            if (this.phase === "ready") {
                const n = 3 - Math.floor(this.phaseT / 30);
                cardText(b, n > 0 ? String(n) : TK.kod.drawDial[2], cx - 150, cy - 96, 300, n > 0 ? 44 : 34, S0.accent, true, "center");
            }
            dirty(b);
        }
        // the round and the score at the top (the key hints are the UI kit's, at the bottom), none over a card
        drawHud() {
            const play = this.phase === "pull" || this.phase === "ready" || this.phase === "slam";
            this.showHud(play, [["O", TK.kod.drawHud[0]], ["P", "pauza"]]);
            this.dial.visible = play;
            const key = [this.round, this.youWon, this.heWon, play].join("|");
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.panels.bitmap, S0 = U();
            b.clear();
            if (!play) return;
            ui.panel(b, 20, 16, 380, 70, { cut: 6 });
            cardText(b, TK.kod.drawHud[1], 36, 22, 340, 15, S0.muted, true);
            cardText(b, (this.opts.rival ? this.opts.rival.with || "z: " + this.rivalName : TK.kod.drawHud[2]) + (this.stake ? Watki.wstaw(TK.kod.drawHud[3], { stake: this.stake }) : ""), 36, 42, 340, 22, S0.accent, true);
            ui.panel(b, W1 - 300, 16, 280, 70, { cut: 6 });
            cardText(b, Watki.wstaw(TK.kod.drawHud[4], { "1": Math.max(1, this.round) }), W1 - 284, 22, 250, 15, S0.muted, true);
            const pips = (x, y, n, colour, label) => {
                cardText(b, label, x, y - 2, 70, 18, S0.text);
                for (let i = 0; i < 2; i++) { b.fillRect(x + 64 + i * 22, y + 4, 14, 14, i < n ? colour : "#2a2e35"); }
            };
            pips(W1 - 284, 46, this.youWon, S0.accent, "Ty");
            pips(W1 - 150, 46, this.heWon, "#e5484d", this.rivalName.split(" ")[0]);
        }
        state() {
            return Object.assign(super.state(), { phase: this.phase, round: this.round, you: this.youWon, grum: this.heWon, n: this.n, lo: this.zc - this.zoneW / 2,
                hi: this.zc + this.zoneW / 2, zone: this.zoneW, b: this.b, inZone: this.inZone, level: this.level, paused: this.paused, result: this.result || null });
        }
    }
    Scene_ArmWrestle.gameId = "arm";
    window.Scene_ArmWrestle = Scene_ArmWrestle;

    // ------------------------------------------------------------------
    // The talk at the table: Grum asks for a stake; the game; back on the map the coins and a word from him (TavernLife.js)
    // ------------------------------------------------------------------
    function armTalk() {
        const o = [];
        if (!npc("grum")) { popup(0, TK.kod.armTalk[0], BAD); return null; }
        const tq = T.call("TownQuests", "armTable");   // (2026-10-06: the tournament's evening - D6 - the table is the tournament's)
        if (tq && tq.length) return tq;
        if (typeof $gameSystem.stamina === "function" && $gameSystem.stamina() < ARM.needStamina) {
            sayAs(o, "grum", TK.kod.armTalk[1]);
            return o;
        }
        const st = S().arm;
        sayAs(o, "grum", st.played === 0 ? TK.kod.armTalk[2]
            : st.won > st.lost ? TK.kod.armTalk[3] : TK.kod.armTalk[4]);
        choose(o, ARM_STAKES.map(n => ({ label: Watki.wstaw(TK.kod.armTalk[5], { n: n }), js: ["TavernLife.step(this, 'arm', " + n + ")", "TavernLife.step(this, 'gameAfter')"] }))
            .concat([{ label: TK.kod.armTalk[6], js: [] }]));
        return o;
    }
    lib.addKind("arm", () => armTalk());
    lib.addStep("arm", (interp, ev, arg) => {
        const stake = Number(arg) || 0;
        if (gold() < stake) { needGold(stake); bark(npc("grum"), TK.kod.glowna[0], 100); return; }
        if (lib.startGame(Scene_ArmWrestle, { stake })) lib.setGameAfter({ game: "arm", stake });
    });
    lib.defineGame("arm", {
        xpWin: ARM.xpWin, xpLose: ARM.xpLose, get reason() { return TK.kod.reason[0]; },   // (read when the XP is given: the words of the file)
        apply(st, res) {
            if (res.rival) return;   // (a bout of D6's tournament: Grum's own level and streak stay as they are)
            st.streak = res.won ? Math.max(1, st.streak + 1) : Math.min(-1, st.streak - 1);
            if (res.won) st.level = Math.min(6, st.level + 1);   // (Grum takes it harder after each loss of his)
        },
        note: () => [TK.kod.note[0], Watki.wstaw(TK.kod.note[1], { "1": ARM_STAKES.join(", ") })],
        who: () => npc("grum"),
        after(r, g, who) {
            bark(who, r.won ? pick([TK.kod.after[0], TK.kod.after[1], TK.kod.after[2]]) : pick([TK.kod.after[3], TK.kod.after[4]]), 120);
        }
    });

    Object.assign(TL, { ARM, AW, grumLines, armWrestle: opts => lib.startGame(Scene_ArmWrestle, opts) });
    TL.modules.TavernLife_ArmWrestle = true;
})();
