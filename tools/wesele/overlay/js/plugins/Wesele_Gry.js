//=============================================================================
// Wesele_Gry.js
//=============================================================================
// The two mini-games of the thread W18 "Wesele w Złotym Kuflu" (docs/zadania_nowe/wesele.md 3A and S3), on TawernaUI's Scene_MiniGame:
//   - the TABLE PLAN: eighteen cards of guests on the left, four tables of six stools on the right. Arrows move the cursor, O picks a
//     card up and sets it down (a taken stool: the two change places), P/X puts the card in the hand back (empty hand: the pause), Q shows
//     the feuds the hero knows of, "Zatwierdź" ends it. Result: { plan: { cardKey: stool 0-23 } } (the unseated cards are left to Borgar)
//   - the FIRST DANCE: eight arrows in turn, each pressed in time with the beat (a window of 0.6 s round it); six or more is "a beautiful
//     dance". Result: { score: 0-8 }.
// Opened by Wesele.js: WeseleGry.plan({ plan, znane, onEnd }), WeseleGry.taniec({ onEnd, bot }) (bot: the number of hits the tests' bot makes).

/*:
 * @target MZ
 * @plugindesc [W18] Mini-gry wesela: plan stołów (18 kart, 4 stoły) i pierwszy taniec (8 strzałek w rytm), na Scene_MiniGame. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaUI
 * @base TawernaUI
 * @base Wesele_Data
 *
 * @help
 * Plan stołów: strzałki, O (weź / połóż), P lub X (odłóż kartę z ręki), Q (znane waśnie), „Zatwierdź”.
 * Pierwszy taniec: strzałka pokazana na ekranie, w rytm.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.WeseleData;
    if (!T || !T.ui || !T.ui.Scene_MiniGame || !D) throw new Error("Wesele_Gry.js: brak TawernaCore.js / TawernaUI.js / Wesele_Data.js - muszą być wyżej na liście wtyczek");
    if (window.WeseleGry) return;
    const ui = T.ui, TK = D.TX;
    const W = () => Graphics.width, H = () => Graphics.height;
    const ST = () => ui.style();
    const short = c => {
        const n = c.imie.replace(/\s*\(.*\)/, "").split(",")[0].replace(/^(Kapral|Ciotka|Kuzynka|Wuj|Brat)\s+/, "");
        return n.split(" ")[0];
    };
    const fam = c => (c.k.startsWith("rp") ? "P" : c.k.startsWith("rm") ? "M" : "");

    // ==================================================================
    // The table plan
    // ==================================================================
    const TB = { x0: 392, y: 100, w: 202, gap: 10, h: 470, seatW: 70, seatH: 92, row0: 66, rowStep: 128 };
    class Scene_WeselePlan extends ui.Scene_MiniGame {
        createGame() {
            const o = this.opts;
            this.placed = Object.assign({}, o.plan || {});   // card key -> stool
            this.known = new Set(o.znane || []);
            this.carry = null;
            this.zone = "cards"; this.ci = 0; this.si = 0;
            this.g = new Sprite(new Bitmap(W(), H()));
            this.stage.addChild(this.g);
            this.dirty = true;
            this.gameId = "wesele_plan";
        }
        begin() {
            this.setTitle("Plan stołów", "Wesele Wojciecha i Doroty");
            this.setHints([["up", "wybór"], ["O", "weź / połóż"], ["Q", "waśnie"], ["P", "odłóż / pauza"]]);
            this.draw();
        }
        helpLines() { return ["Cztery stoły po sześć miejsc, osiemnaście kart gości.", "O bierze kartę i kładzie ją na miejscu; zajęte miejsce - zamiana.", "Q pokazuje waśnie, o których wiesz. Dwie zwaśnione osoby przy jednym stole to iskra."]; }
        quitLabel() { return "Wyjdź bez zapisu"; }
        quitResult() { return { aborted: true }; }
        cardOf(k) { return D.KARTY.find(c => c.k === k); }
        seatCard(s) { return Object.keys(this.placed).find(k => this.placed[k] === s) || null; }
        unplaced() { return D.KARTY.filter(c => this.placed[c.k] === undefined); }
        // the known feuds that are at one table now
        sparks() { return D.WASNIE.map((p, i) => ({ p, i })).filter(({ p }) => this.placed[p[0]] !== undefined && this.placed[p[1]] !== undefined && Math.floor(this.placed[p[0]] / 6) === Math.floor(this.placed[p[1]] / 6)); }
        pos(s) { const t = Math.floor(s / 6), l = s % 6, c = l < 3 ? 0 : 1, r = l % 3; return { t, c, r, x: TB.x0 + t * (TB.w + TB.gap) + (c ? TB.w - TB.seatW - 8 : 8), y: TB.y + TB.row0 + r * TB.rowStep }; }
        draw() {
            const b = this.g.bitmap, S = ST();
            b.clear();
            // the cards
            ui.panel(b, 24, 96, 350, 520, { cut: 6 });
            ui.text(b, "Karty gości", 40, 102, 300, { size: 20, bold: true, color: S.accent });
            D.KARTY.forEach((c, i) => {
                const y = 134 + i * 26, k = c.k, st = this.placed[k], focus = this.zone === "cards" && this.ci === i, hand = this.carry === k;
                if (focus) ui.panel(b, 32, y - 2, 334, 26, { cut: 3, fill: "rgba(255,210,63,0.16)", line: S.accent, accent: false });
                const known = D.WASNIE.some(([a, z], wi) => (a === k || z === k) && this.known.has(wi));
                ui.text(b, c.imie, 44, y, 250, { size: 17, color: hand ? S.accent : st !== undefined ? S.muted : S.text });
                if (known) ui.text(b, "⚔", 300, y, 24, { size: 16, color: "#ff8a7a" });
                if (st !== undefined) ui.text(b, "stół " + (Math.floor(st / 6) + 1), 318, y, 46, { size: 14, color: S.muted, align: "right" });
            });
            // the tables
            const sp = this.sparks(), spSet = new Set();
            for (const { p, i } of sp) if (this.known.has(i)) { spSet.add(p[0]); spSet.add(p[1]); }
            for (let t = 0; t < 4; t++) {
                const x = TB.x0 + t * (TB.w + TB.gap);
                ui.panel(b, x, TB.y, TB.w, TB.h, { cut: 6 });
                ui.text(b, "Stół " + (t + 1), x, TB.y + 6, TB.w, { size: 19, bold: true, color: S.accent, align: "center" });
                b.fillRect(x + 84, TB.y + 52, TB.w - 168, TB.h - 70, "#5b3b22");
                b.fillRect(x + 87, TB.y + 55, TB.w - 174, TB.h - 76, "#7a5230");
                for (let l = 0; l < 6; l++) {
                    const s = t * 6 + l, p = this.pos(s), k = this.seatCard(s), c = k ? this.cardOf(k) : null;
                    const focus = this.zone === "seats" && this.si === s;
                    const bad = k && spSet.has(k);
                    b.fillRect(p.x, p.y, TB.seatW, TB.seatH, focus ? "rgba(255,210,63,0.28)" : "rgba(20,20,24,0.8)");
                    ui.panel(b, p.x, p.y, TB.seatW, TB.seatH, { cut: 3, fill: "rgba(0,0,0,0)", line: focus ? S.accent : bad ? "#ff6b5b" : "#4a4e57", accent: false });
                    if (c) {
                        ui.text(b, short(c), p.x, p.y + 28, TB.seatW, { size: 17, bold: true, align: "center", color: bad ? "#ff9c8c" : S.text });
                        if (fam(c)) ui.text(b, fam(c) === "P" ? "panna" : "pan", p.x, p.y + 52, TB.seatW, { size: 13, align: "center", color: S.muted });
                    } else ui.text(b, "—", p.x, p.y + 32, TB.seatW, { size: 22, align: "center", color: "#4a4e57" });
                }
            }
            // the button and the sums
            ui.button(b, 24, 630, 350, 52, "Zatwierdź plan", { focus: this.zone === "ok", primary: this.zone === "ok" });
            const n = this.sparks().filter(({ i }) => this.known.has(i)).length, all = this.sparks().length;
            ui.text(b, "Znane waśnie przy jednym stole: " + n + (this.known.size ? "  (znasz " + this.known.size + " z 7)" : "  (nic nie wiesz: plotki!)") + "   Nieusadzonych: " + this.unplaced().length, 392, 590, 860, { size: 18, color: n ? "#ff9c8c" : ST().muted });
            if (this.carry) ui.text(b, "W ręku: " + this.cardOf(this.carry).imie, 392, 620, 860, { size: 18, color: S.accent });
            ui.dirty(b);
            this.dirty = false;
        }
        tick() {
            if (this.card) return;
            const r = this.rep, tg = this.trig;
            let ch = false;
            const z = this.zone;
            if (z === "cards") {
                if (r.up) { this.ci = (this.ci + 17) % 18; ch = true; }
                else if (r.down) { if (this.ci === 17) { this.zone = "ok"; } else this.ci++; ch = true; }
                else if (r.right) { this.zone = "seats"; this.si = Math.min(this.si, 23); ch = true; }
            } else if (z === "seats") {
                const p = this.pos(this.si);
                if (r.up) { if (p.r > 0) this.si--; ch = true; }
                else if (r.down) { if (p.r < 2) this.si++; else this.zone = "ok"; ch = true; }
                else if (r.left) { if (p.c === 1) this.si -= 3; else if (p.t > 0) this.si = (p.t - 1) * 6 + 3 + p.r; else this.zone = "cards"; ch = true; }
                else if (r.right) { if (p.c === 0) this.si += 3; else if (p.t < 3) this.si = (p.t + 1) * 6 + p.r; ch = true; }
            } else if (z === "ok") {
                if (r.up) { this.zone = this.ci === 17 ? "cards" : "seats"; if (this.zone === "seats") this.si = 5 + 0; ch = true; }
                else if (r.left) { this.zone = "cards"; ch = true; }
            }
            if (ch) { this.se("cursor"); this.dirty = true; }
            if (tg.pageup) { this.se("ok"); this.showKnown(); return; }
            if (tg.ok) this.press();
        }
        press() {
            this.dirty = true;
            if (this.zone === "ok") return this.confirm();
            if (this.zone === "cards") {
                const k = D.KARTY[this.ci].k;
                if (this.carry === k) { this.carry = null; this.se("cancel"); return; }
                if (this.carry) { this.se("buzzer"); return; }
                if (this.placed[k] !== undefined) delete this.placed[k];
                this.carry = k; this.se("ok");
                return;
            }
            const occ = this.seatCard(this.si);
            if (this.carry) {
                if (occ) { delete this.placed[occ]; }
                this.placed[this.carry] = this.si;
                this.carry = occ; this.se("ok");
            } else if (occ) { delete this.placed[occ]; this.carry = occ; this.se("ok"); }
        }
        onBack() {
            if (this.phase !== "play") return false;
            if (this.carry) { this.carry = null; this.dirty = true; this.se("cancel"); return true; }
            if (this.zone === "seats") { const occ = this.seatCard(this.si); if (occ) { delete this.placed[occ]; this.dirty = true; this.se("cancel"); return true; } }
            this.pause();
            return true;
        }
        showKnown() {
            const lines = [];
            D.WASNIE.forEach(([a, b], i) => { if (this.known.has(i)) lines.push(this.cardOf(a).imie + "  ⚔  " + this.cardOf(b).imie); });
            if (D.MILOSC) lines.push("");
            if (this.known.size >= 5) lines.push(this.cardOf(D.MILOSC[0]).imie + "  ♥  " + this.cardOf(D.MILOSC[1]).imie + " (obok siebie: nastrój w górę)");
            if (!this.known.size) lines.push("Nic jeszcze nie wiesz o waśniach. Pytaj ludzi: Stefa, Tadek, Wit, Bartek, Dorota, Hanka.");
            this.showCard({ title: "Znane waśnie", lines });
        }
        confirm() {
            const left = this.unplaced().length;
            const done = () => this.end({ plan: Object.assign({}, this.placed), znane: [...this.known] });
            if (!left) return done();
            this.showChoice({ title: "Nie wszyscy usadzeni", lines: ["Borgar posadzi resztę jak popadnie (" + left + ")."], options: ["Zatwierdzam", "Wracam do planu"], cancel: 1, onPick: i => { if (i === 0) { this.fillRest(); done(); } } });
        }
        // Borgar seats the rest in the free stools, in the order of the cards
        fillRest() {
            const free = []; for (let s = 0; s < 24; s++) if (!this.seatCard(s)) free.push(s);
            for (const c of this.unplaced()) this.placed[c.k] = free.shift();
        }
        frame() { if (this.dirty) this.draw(); }
        state() { return Object.assign(super.state(), { zone: this.zone, ci: this.ci, si: this.si, carry: this.carry, placed: Object.assign({}, this.placed), sparks: this.sparks().length }); }
    }

    // ==================================================================
    // The first dance
    // ==================================================================
    const ARR = ["left", "up", "right", "down"], KEY_OF = { left: "left", up: "up", right: "right", down: "down" };
    const BEAT = 70, START = 100, WINDOW = 18, N = 8, SHOW = 56;
    class Scene_WeseleTaniec extends ui.Scene_MiniGame {
        createGame() {
            this.score = 0; this.res = [];
            let a = (this.seed >>> 0) || 1;
            const nxt = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
            this.seq = Array.from({ length: N }, () => ARR[Math.floor(nxt() * 4)]);
            this.bot = this.opts.bot === undefined ? -1 : Number(this.opts.bot);
            this.g = new Sprite(new Bitmap(W(), H()));
            this.stage.addChild(this.g);
            this.imgA = ImageManager.loadCharacter(D.POSTAC.pan); this.imgB = ImageManager.loadCharacter(D.POSTAC.panna);
            this.cur = 0; this.flash = null; this.stumble = 0; this.gameId = "wesele_taniec";
        }
        begin() {
            this.setTitle("Pierwszy taniec", "Wojciech i Dorota");
            this.setHints([["up", "strzałka w rytm"], ["P", "pauza"]]);
            if (this.bot < 0) this.showCard({ title: "Pierwszy taniec", lines: ["Prowadzisz Dorotę, bo Wojciech jest zzbyt sztywny.".replace("zbyt", "zbyt"), "Naciśnij strzałkę pokazaną na ekranie, w rytm muzyki.", "Sześć trafień z ośmiu to piękny taniec."] });
        }
        helpLines() { return ["Strzałką pokazaną na ekranie, w rytm. Okno 0,6 s.", "Osiem strzałek, sześć trafień to piękny taniec."]; }
        quitLabel() { return "Przerwij taniec"; }
        quitResult() { return { score: this.score }; }
        t0() { return this.t - this.startT; }
        tick() {
            if (this.startT === undefined) this.startT = this.t;
            const t = this.t0(), i = this.cur;
            if (i >= N) { if (t > START + BEAT * N + 50) this.end({ score: this.score }); return; }
            const target = START + BEAT * i, dir = this.seq[i];
            // the tests' bot: presses on the beat (hits for the first `bot` beats)
            if (this.bot >= 0 && t === target) { if (i < this.bot) return this.hit(i); }
            const pressed = ARR.find(d => this.trig[KEY_OF[d]]);
            if (pressed && t >= target - WINDOW && t <= target + WINDOW) { if (pressed === dir) this.hit(i); else this.miss(i); return; }
            if (t > target + WINDOW) this.miss(i);
        }
        hit(i) { this.score++; this.res[i] = 1; this.cur++; this.flash = { t: 0, ok: true }; this.se("ok"); }
        miss(i) { this.res[i] = 0; this.cur++; this.flash = { t: 0, ok: false }; this.stumble = 24; this.se("buzzer", 0.6); }
        frame() {
            const b = this.g.bitmap, S = ST(), t = this.startT === undefined ? 0 : this.t0();
            b.clear();
            const cx = W() / 2, cy = 360;
            // the dancers: two frames of the sheet, swaying, scaled 4x (a stumble: a tilt)
            const sw = Math.sin(t / 14) * 10, bob = Math.abs(Math.sin(t / 14)) * 6, st = this.stumble > 0 ? this.stumble-- : 0;
            const ctx = b.context;
            ctx.imageSmoothingEnabled = false;
            for (const [img, dx, flip] of [[this.imgA, -90, false], [this.imgB, 90, true]]) {
                if (!img.isReady()) continue;
                const fw = img.width / 3, fh = img.height / 4, sx = fw * (1 + (Math.floor(t / 14) % 2 ? 1 : -1) * (flip ? 0 : 0)), sy = fh * 0;
                ctx.save();
                ctx.translate(cx + dx + sw * (flip ? -1 : 1), cy - bob + (st ? Math.sin(st) * 5 : 0));
                if (st) ctx.rotate((flip ? -1 : 1) * 0.12 * Math.sin(st));
                ctx.drawImage(img.canvas, sx, sy, fw, fh, -fw * 2.2, -fh * 4.2, fw * 4.4, fh * 4.4);
                ctx.restore();
            }
            ctx.imageSmoothingEnabled = true;
            // the arrows' row and the coming one
            const ax = cx - (N - 1) * 36;
            for (let i = 0; i < N; i++) {
                const x = ax + i * 72, col = this.res[i] === 1 ? "#8ee08a" : this.res[i] === 0 ? "#ff7b6b" : i === this.cur ? S.accent : "#3a3e46";
                ui.arrow(ctx, this.seq[i], x, 120, 34, col);
            }
            if (this.cur < N) {
                const target = START + BEAT * this.cur, d = target - t;
                if (d < SHOW && d > -WINDOW) {
                    const r = 12 + Math.max(0, d) * 1.4, x = ax + this.cur * 72;
                    ctx.strokeStyle = Math.abs(d) <= WINDOW ? "#8ee08a" : S.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, 120, r, 0, Math.PI * 2); ctx.stroke();
                }
                ui.arrow(ctx, this.seq[this.cur], cx, 190, 90, Math.abs(d) <= WINDOW ? "#8ee08a" : S.accent);
            }
            if (this.flash && this.flash.t++ < 40) ui.text(b, this.flash.ok ? "Dobrze!" : "Potknięcie!", 0, 240, W(), { size: 34, bold: true, align: "center", color: this.flash.ok ? "#8ee08a" : "#ff7b6b", alpha: 1 - this.flash.t / 40 });
            ui.text(b, "Trafienia: " + this.score + " / " + N, 0, 600, W(), { size: 24, align: "center", color: S.text });
            ui.dirty(b);
        }
        state() { return Object.assign(super.state(), { score: this.score, beat: this.cur, seq: this.seq.slice() }); }
    }

    window.WeseleGry = T.register("WeseleGry", {
        Scene_WeselePlan, Scene_WeseleTaniec, N, BEAT, START, WINDOW,
        plan: o => ui.open(Scene_WeselePlan, o || {}),
        taniec: o => ui.open(Scene_WeseleTaniec, o || {})
    });
})();
