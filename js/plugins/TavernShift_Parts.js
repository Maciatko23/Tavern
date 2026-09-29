//=============================================================================
// TavernShift_Parts.js
//=============================================================================
// The four parts of a shift (split out of TavernShift.js, 2026-09-29): before opening (cleaning and wood), the keg (pouring beer),
// the kitchen in rhythm, the evening (serving the hall). Each one a Part (TavernShift_Hall.js) that the shift's scene
// (TavernShift.js) sets up, ticks and draws.

/*:
 * @target MZ
 * @plugindesc Cztery części zmiany w tawernie (TavernShift.js): sprzątanie i drewno, nalewanie piwa, kuchnia w rytm, obsługa sali. Sama nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TavernShift
 * @orderAfter TavernShift
 * @base TavernShift_Hall
 * @orderAfter TavernShift_Hall
 *
 * @help
 * ============================================================================
 * TavernShift_Parts.js - cztery części zmiany
 * ============================================================================
 * Część TavernShift.js (wydzielona z niego): mini-gry czterech części zmiany.
 * Parametry ma TavernShift.js.
 *
 * KOLEJNOŚĆ: TavernShift, TavernShift_Hall, TavernShift_Parts.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;   // (TW: T is the tile's size here)
    if (!TW) throw new Error("TavernShift_Parts.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = TW.api("TavernShift_parts") || TW.register("TavernShift_parts", {});
    if (P.parts) return;   // (put into the page twice: kept as it was)
    if (!P.kit || !P.hall) throw new Error("TavernShift_Parts.js: musi być pod TavernShift.js i TavernShift_Hall.js na liście wtyczek (one of them is missing or below)");
    const { ST, GOOD, BAD, WARN, GOLD_ICON, clamp, lerp, ease, scoreColour, shuffle, se, dirty, panel, bar, txt, measure, wrapLines, icon, keyCap, showIf, solidBitmap } = P.kit;
    const { DISHES, MENU_ORDER, dishIcon, STEPS, STEP_ORDER, RECIPES, TIP_SCALE } = P.kit;
    const { T, sheet, tB, FLOOR, PLANKS_H, WALL_IN, tileSprite, makeTilemap, heroLook, PEOPLE, Figure, Part, RR, ROOM_X, ROOM_Y, DOOR_X0,
        COUNTER_X0, COUNTER_X1, COUNTER_Y, SPOT, SACK_SPOTS, cx, standPt, Room, heroWalk, Prompt, SIDE, fmtTime, drawLegend, PX, MUG, CASK, closeupWall,
        drawCask, drawMug, drawStar, drawBubble } = P.hall;

    // ==================================================================
    // Part 1: before opening - clean the tables, bring wood to the fireplace, take the rubbish out
    // ==================================================================
    class PartClean extends Part {
        setup() {
            const c = this.cfg;
            this.limit = c.time;
            this.room = new Room(this, {});
            this.root.addChild(this.room.root);
            this.hero = { x: standPt(9, 10).x, y: standPt(9, 10).y };
            this.hero.fig = this.room.addFigure(heroLook(), 9, 10, 8);
            this.hero.fig._sid = 1;
            for (const i of shuffle([0, 1, 2, 3, 4, 5], this.rng).slice(0, c.tables)) this.room.setDirty(this.room.tables[i], 1);
            this.tablesTotal = c.tables;
            this.wood = { need: c.wood, done: 0 };
            this.room.setFire(0);
            this.sacks = shuffle(SACK_SPOTS, this.rng).slice(0, c.trash).map((s, i) => {
                const spr = i % 2 ? tileSprite("B", 11, 10) : tileSprite("B", 8, 15);   // a bucket of scraps / a sack of rubbish
                spr.x = s.tx * T; spr.y = s.ty * T - 6;
                spr.scale.set(0.9);
                this.room.decor.addChild(spr);
                return { tx: s.tx, ty: s.ty, state: "lying", spr, kind: i % 2 ? "bucket" : "sack" };
            });
            this.trashDone = 0;
            this.carry = null;
            this.carrySpr = new Sprite(new Bitmap(48, 48));
            this.carrySpr.anchor.set(0.5, 1);
            this.carrySpr.visible = false;
            this.room.over.addChild(this.carrySpr);
            this.prompt = new Prompt();
            this.room.over.addChild(this.prompt);
            this.endWait = -1;
            this.side = new Sprite(new Bitmap(SIDE.w, SIDE.h));
            this.side.x = SIDE.x; this.side.y = SIDE.y;
            this.root.addChild(this.side);
            this.fxLayer.x = ROOM_X; this.fxLayer.y = ROOM_Y;
            super.setup();
            this._sideKey = "";
        }
        units() { return { total: this.tablesTotal + this.wood.need + this.sacks.length, done: this.tablesClean() + this.wood.done + this.trashDone }; }
        tablesClean() { return this.tablesTotal - this.room.tables.filter(tb => tb.dirty > 0).length; }
        targets() {
            const r = this.room, list = [];
            for (const tb of r.tables) if (tb.dirty > 0) list.push({ kind: "wipe", table: tb, rect: r.tableRect(tb), hold: true, label: "Przetrzyj stół" });
            if (this.carry === "log") list.push({ kind: "fire", rect: r.rectOf(SPOT.fire.tx, SPOT.fire.ty), label: "Dorzuć do kominka" });
            else if (this.wood.done < this.wood.need) list.push({ kind: "log", rect: r.rectOf(SPOT.pile.tx, SPOT.pile.ty), label: "Weź polano", busy: !!this.carry });
            for (const s of this.sacks) if (s.state === "lying") list.push({ kind: "sack", sack: s, rect: r.rectOf(s.tx, s.ty), label: s.kind === "sack" ? "Weź worek śmieci" : "Weź kubeł z resztkami", busy: !!this.carry });
            if (this.carry === "trash") list.push({ kind: "door", rect: r.rectOf(DOOR_X0, RR - 1, 3, 1), label: "Wyrzuć za drzwi" });
            return list;
        }
        setCarry(what) {
            this.carry = what;
            const b = this.carrySpr.bitmap;
            showIf(this.carrySpr, what);
            if (!what) return;
            b.clear();
            if (what === "log") icon(b, 381, 6, 10, 36);
            else if (what === "trash") b.blt(ImageManager.loadTileset(sheet("B")), 8 * T, 15 * T, T, T, 4, 4, 40, 40);
        }
        tick(k, kt) {
            if (this.done) return;
            const r = this.room, h = this.hero;
            heroWalk(r, h, k);
            this.carrySpr.x = h.x;
            this.carrySpr.y = h.y - 56;
            const tg = r.nearest(h, this.targets());
            this.target = tg;
            if (tg && tg.hold) {
                const tb = tg.table;
                if (k.ok) {
                    tb.wipe++;
                    r.setDirty(tb, 1 - tb.wipe / this.cfg.wipe);
                    if (tb.wipe % 8 === 1) { se("Water1", 35, 150); this.burst(tb.tx * T + 48 + ROOM_X, tb.ty * T + 16 + ROOM_Y, "#dff6ff", 3, 1.6); }
                    if (tb.wipe >= this.cfg.wipe) {
                        r.setDirty(tb, 0);
                        se("Chime2", 50, 130);
                        this.float("Czysto!", ROOM_X + tb.tx * T + 48, ROOM_Y + tb.ty * T - 8, GOOD);
                        this.burst(tb.tx * T + 48 + ROOM_X, tb.ty * T + 16 + ROOM_Y, "#fff7c0", 10, 2.2);
                    }
                }
            } else if (tg && kt.ok) this.act(tg);
            // the prompt
            if (tg) {
                const ratio = tg.hold ? tg.table.wipe / this.cfg.wipe : undefined;
                const label = tg.busy ? "Masz zajęte ręce" : tg.label + (tg.hold ? " (przytrzymaj)" : "");
                this.prompt.show(label, tg.rect.x + tg.rect.w / 2, tg.rect.y - (tg.kind === "door" ? 4 : 6), ratio, tg.busy);
            } else this.prompt.hide();
            r.tickFire(this.t);
            r.sortChars();
            this.tickFx();
            this.t++;
            const u = this.units();
            if (u.done >= u.total && this.endWait < 0) { this.endWait = 50; se("Applause1", 45, 120); this.float("Wszystko zrobione!", ROOM_X + h.x, ROOM_Y + h.y - 70, ST().accent, 26); }
            if (this.endWait > 0 && --this.endWait === 0) this.finish();
            else if (this.t >= this.limit) this.finish();
        }
        act(tg) {
            const r = this.room, h = this.hero, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 64;
            if (tg.busy) { se("Buzzer1", 50); this.float("Najpierw odnieś to, co niesiesz", fx, fy, WARN, 18); return; }
            if (tg.kind === "log") { this.setCarry("log"); se("Equip1", 60, 90); }
            else if (tg.kind === "fire") {
                this.setCarry(null);
                this.wood.done++;
                r.setFire(this.wood.done);
                se("Fire1", 55, 110);
                this.burst(ROOM_X + cx(SPOT.fire.tx), ROOM_Y + SPOT.fire.ty * T + 20, "#ffb347", 10, 1.8, -0.02);
                this.float("Polano " + this.wood.done + "/" + this.wood.need, ROOM_X + cx(SPOT.fire.tx), ROOM_Y + SPOT.fire.ty * T - 10, ST().accent);
            } else if (tg.kind === "sack") {
                tg.sack.state = "carried";
                tg.sack.spr.visible = false;
                this.setCarry("trash");
                se("Equip2", 60, 90);
            } else if (tg.kind === "door") {
                const s = this.sacks.find(x => x.state === "carried");
                if (s) s.state = "out";
                this.trashDone++;
                this.setCarry(null);
                se("Door1", 55, 110);
                this.float("Wyniesione!", fx, fy, GOOD);
            }
        }
        finish() {
            const u = this.units(), left = Math.max(0, this.limit - this.t);
            let s = 90 * u.done / u.total;
            if (u.done >= u.total) s += 10 * Math.min(1, left / (this.limit * 0.35));
            this.ctx.fire = this.wood.done;
            const tables = this.tablesClean(), good = [], bad = [];
            if (u.done >= u.total) good.push("Sala wysprzątana na czas (" + Math.ceil(left / 60) + " s zapasu)");
            else {
                if (tables < this.tablesTotal) bad.push("Brudne stoły: " + (this.tablesTotal - tables));
                if (this.wood.done < this.wood.need) bad.push("Kominek bez drewna: " + (this.wood.need - this.wood.done) + " polana");
                if (this.trashDone < this.sacks.length) bad.push("Śmieci zostały w sali: " + (this.sacks.length - this.trashDone));
                if (u.done > 0 && tables === this.tablesTotal) good.push("Stoły lśnią");
            }
            this.complete(s, {
                done: u.done, total: u.total, timeLeft: Math.round(left / 60),
                tables: [tables, this.tablesTotal], wood: [this.wood.done, this.wood.need], trash: [this.trashDone, this.sacks.length]
            }, good, bad);
        }
        skipData(score) {
            this.ctx.fire = score >= 50 ? 3 : 1;
            return { done: 0, total: 0, skipped: true };
        }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() {
            const left = Math.max(0, this.limit - this.t), u = this.units();
            return { timer: left / this.limit, label: "Do otwarcia: " + fmtTime(left), right: "Zadania: " + u.done + " / " + u.total };
        }
        frame() {
            const u = this.units();
            const key = [this.tablesClean(), this.wood.done, this.trashDone, this.carry, u.done].join("|");
            if (key === this._sideKey) return;
            this._sideKey = key;
            const b = this.side.bitmap;
            b.clear();
            panel(b, 0, 0, SIDE.w, SIDE.h, { cut: 6 });
            txt(b, "Lista zadań", 20, 14, SIDE.w - 40, { size: 26, color: ST().accent, bold: true });
            txt(b, "zanim wpuścimy gości", 20, 46, SIDE.w - 40, { size: 17, color: ST().muted });
            const rows = [
                [400, "Przetrzyj stoły", this.tablesClean(), this.tablesTotal, "stań przy stole, przytrzymaj O"],
                [381, "Drewno do kominka", this.wood.done, this.wood.need, "polana ze stosu w rogu"],
                [338, "Wynieś śmieci", this.trashDone, this.sacks.length, "za drzwi wejściowe"]
            ];
            let y = 90;
            for (const [ic, name, d, n, hint] of rows) {
                const ok = d >= n;
                panel(b, 14, y, SIDE.w - 28, 92, { cut: 4, fill: ok ? "rgba(30,48,30,0.7)" : "rgba(22,24,29,0.9)", accent: false, line: ok ? "#4f8a4c" : ST().line });
                icon(b, ic, 26, y + 12, 32);
                txt(b, name, 68, y + 10, SIDE.w - 150, { size: 21, color: ok ? GOOD : ST().text, bold: true });
                txt(b, d + " / " + n, SIDE.w - 100, y + 10, 72, { size: 21, color: ok ? GOOD : ST().accent, bold: true, align: "right" });
                bar(b, 68, y + 46, SIDE.w - 110, 7, d / n, ok ? GOOD : ST().accent);
                txt(b, hint, 68, y + 58, SIDE.w - 96, { size: 15, color: ST().muted });
                y += 104;
            }
            txt(b, "W rękach:", 20, y + 6, 120, { size: 19, color: ST().muted });
            txt(b, this.carry === "log" ? "polano" : this.carry === "trash" ? "śmieci" : "nic", 120, y + 6, 180, { size: 19, color: this.carry ? ST().accent : ST().text, bold: true });
            drawLegend(b, 20, SIDE.h - 128, [[["up", "left", "down", "right"], "lub WSAD: chodzenie"], [["Shift"], "szybciej"], [["O"], "akcja"], [["P"], "pauza"]]);
        }
        state() {
            const r = this.room;
            return {
                hero: { x: this.hero.x, y: this.hero.y }, carry: this.carry, t: this.t, limit: this.limit,
                tables: r.tables.map(tb => ({ i: tb.i, dirty: tb.dirty, stands: r.standsAround([{ tx: tb.tx, ty: tb.ty }, { tx: tb.tx + 1, ty: tb.ty }]) })),
                wood: Object.assign({}, this.wood), pile: r.standsAround([SPOT.pile]), fire: r.standsAround([SPOT.fire]),
                sacks: this.sacks.map(s => ({ state: s.state, stands: r.standsAround([s]) })),
                door: standPt(9, RR - 2), target: this.target ? this.target.kind : null
            };
        }
    }

    // ==================================================================
    // Part 2: the keg - hold O to pour, let go at the line (the tap keeps running a moment)
    // ==================================================================
    class PartBeer extends Part {
        setup() {
            const W = Graphics.width;
            // the back wall with shelves, a shelf plank for the cask, the bar top
            const wall = closeupWall(5, (x, y) => (y === 1 && (x === 0 || x === 8) ? tB(9, 8) : y === 1 && (x === 1 || x === 7) ? tB(8, 7) : 0));
            wall.scale.set(PX);
            wall.x = -8;
            wall.y = -60;
            this.root.addChild(wall);
            const shelf = new Sprite(new Bitmap(W, 26));
            shelf.bitmap.fillRect(0, 0, W, 26, "#4a2d14"); shelf.bitmap.fillRect(0, 0, W, 6, "#7a5028"); shelf.bitmap.fillRect(0, 22, W, 4, "#2a180a");
            shelf.y = 372;
            this.root.addChild(shelf);
            for (const [x, k] of [[150, 0], [300, 1], [900, 1], [1050, 0]]) {   // the other kegs
                const s = tileSprite("C", k, 7);
                s.scale.set(PX);
                s.x = x - 72; s.y = 372 - 138;
                this.root.addChild(s);
            }
            const counter = makeTilemap(9, 2, () => [PLANKS_H, 0, 0, 0]);
            counter.scale.set(PX);
            counter.x = -8;
            counter.y = 560;
            this.root.addChild(counter);
            const edge = new Sprite(new Bitmap(W, 12));
            edge.bitmap.fillRect(0, 0, W, 4, "#c98d4c"); edge.bitmap.fillRect(0, 4, W, 8, "rgba(0,0,0,0.35)");
            edge.y = 556;
            this.root.addChild(edge);
            // the cask and its tap
            this.cask = new Sprite(new Bitmap(CASK.w, CASK.h));
            drawCask(this.cask.bitmap);
            this.cask.scale.set(PX);
            this.cask.x = Math.round(W / 2 - CASK.tipX * PX);
            this.cask.y = 372 - (CASK.h - 2) * PX + 6 * PX;
            this.nozzle = { x: this.cask.x + CASK.tipX * PX + 1, y: this.cask.y + CASK.tipY * PX };
            // the stream (behind the cask's nozzle, in front of the mug)
            this.mug = new Sprite(new Bitmap(MUG.w, MUG.h));
            this.mug.scale.set(PX);
            this.mug.anchor.set(0.5, 1);
            this.mug.y = 566;
            this.stream = new Sprite(solidBitmap("#e2a02c"));
            this.stream.x = this.nozzle.x - 4;
            this.stream.y = this.nozzle.y;
            this.stream.scale.x = 8 / 4;
            this.stream.visible = false;
            this.root.addChild(this.mug);
            this.root.addChild(this.stream);
            this.root.addChild(this.cask);
            // side panels
            this.info = new Sprite(new Bitmap(330, 300));
            this.info.x = 30; this.info.y = 96;
            this.root.addChild(this.info);
            this.row = new Sprite(new Bitmap(W - 60, 84));
            this.row.x = 30; this.row.y = 620;
            this.root.addChild(this.row);
            this.tally = new Sprite(new Bitmap(330, 240));
            this.tally.x = W - 360; this.tally.y = 96;
            this.root.addChild(this.tally);
            super.setup();
            this.results = [];
            this.i = -1;
            this.nextMug();
        }
        nextMug() {
            this.i++;
            if (this.i >= this.cfg.mugs) { this.phase = "end"; this.pt = 0; return; }
            const r = this.rng;
            this.line = 0.66 + r() * 0.22;
            this.rate = 0.0068 * (0.85 + r() * 0.45) * this.cfg.speed;
            this.pulse = this.i >= this.cfg.pulseFrom && r() < this.cfg.pulseChance;
            this.level = 0;
            this.flow = 0;
            this.spilled = false;
            this.phase = "in";
            this.pt = 0;
            this.mugX = Graphics.width + 160;
            this.lastLabel = null;
        }
        flowNow() { return this.rate * (this.pulse ? 0.55 + 0.9 * (0.5 + 0.5 * Math.sin(this.pt / 6.5)) : 1); }
        // the foam's height at a level: grows with the pour
        foam() { return Math.min(0.1, 0.02 + this.level * 0.09); }
        afterRelease() { let f = this.flow, add = 0; for (let k = 0; k < 8; k++) { f *= 0.8; add += f; } return this.level + add; }
        tick(k, kt) {
            if (this.done) return;
            this.pt++;
            const cxm = Graphics.width / 2;
            switch (this.phase) {
                case "in":
                    this.mugX = lerp(Graphics.width + 160, cxm, ease(this.pt / 26));
                    if (this.pt >= 26) { this.phase = "ready"; this.pt = 0; }
                    break;
                case "ready":
                    if (kt.ok) { this.phase = "pour"; this.pt = 0; se("Liquid", 45, 110); }
                    else if (this.pt > this.cfg.wait) this.judge("timeout");
                    break;
                case "pour":
                    this.flow = this.flowNow();
                    this.level += this.flow;
                    if (this.pt % 24 === 0) se("Water1", 30, 70 + Math.floor(this.level * 40));
                    if (this.level >= 1) this.judge("spill");
                    else if (!k.ok) { this.phase = "lag"; this.lag = 0; }
                    break;
                case "lag":
                    this.flow *= 0.8;
                    this.level += this.flow;
                    this.lag++;
                    if (this.level >= 1) this.judge("spill");
                    else if (this.lag >= 8) this.judge();
                    break;
                case "judge":
                    if (this.pt >= 52) { this.phase = "out"; this.pt = 0; }
                    break;
                case "out":
                    this.mugX = lerp(cxm, -160, ease(this.pt / 22));
                    if (this.pt >= 22) this.nextMug();
                    break;
                case "end":
                    if (this.pt >= 30) this.finish();
                    break;
            }
            this.t++;
            this.tickFx();
        }
        judge(kind) {
            const d = this.level - this.line, ad = Math.abs(d);
            let score, label, colour, res;
            if (kind === "spill") { this.level = 1; this.spilled = true; score = 0; label = "Rozlane!"; colour = BAD; res = "spill"; se("Splash", 60, 110); }
            else if (kind === "timeout") { score = 0; label = "Gość się nie doczekał"; colour = BAD; res = "timeout"; se("Buzzer1", 50); }
            else if (ad <= 0.02) { score = 100; label = "Idealnie!"; colour = ST().accent; res = "perfect"; se("Chime2", 60, 120); }
            else if (ad <= 0.045) { score = 80; label = "Dobrze"; colour = GOOD; res = "good"; se("Decision2", 55, 110); }
            else if (ad <= 0.08) { score = 55; label = d < 0 ? "Trochę za mało" : "Trochę za dużo"; colour = ST().text; res = d < 0 ? "short" : "over"; se("Cursor2", 55); }
            else { score = Math.max(5, Math.round(40 - (ad - 0.08) * 250)); label = d < 0 ? "Za mało!" : "Za dużo piany!"; colour = WARN; res = d < 0 ? "short" : "over"; se("Buzzer2", 45); }
            this.flow = 0;
            this.results.push({ score, res, diff: Math.round(d * 1000) / 1000 });
            this.phase = "judge";
            this.pt = 0;
            this.float(label, Graphics.width / 2, 330, colour, 30);
            if (res === "spill") this.burst(Graphics.width / 2, 390, "#fff1c8", 18, 2.4, 0.18);
        }
        finish() {
            const n = this.results.length || 1;
            const avg = this.results.reduce((a, r) => a + r.score, 0) / n;
            const count = res => this.results.filter(r => r.res === res).length;
            const perfect = count("perfect"), good = count("good"), spilled = count("spill"), short = count("short"), timeout = count("timeout");
            this.ctx.beerQ = avg / 100;
            const g = [], b = [];
            if (perfect) g.push("Idealnie nalane kufle: " + perfect + " z " + this.results.length);
            if (spilled) b.push("Rozlane kufle: " + spilled);
            if (short) b.push("Za mało piwa w kuflach: " + short);
            if (timeout) b.push("Kufle, które czekały na próżno: " + timeout);
            this.complete(avg, { mugs: this.results.length, perfect, good, spilled, short, results: this.results.slice() }, g, b);
        }
        skipData(score) { this.ctx.beerQ = score / 100; return { mugs: 0, perfect: 0, good: 0, spilled: 0, short: 0, results: [], skipped: true }; }
        progress() { return clamp((this.i + (this.phase === "judge" || this.phase === "out" ? 1 : 0)) / this.cfg.mugs, 0, 1); }
        hud() {
            const i = Math.min(this.i + 1, this.cfg.mugs);
            return { dots: this.results.map(r => r.score), dotsTotal: this.cfg.mugs, label: "Kufel " + i + " z " + this.cfg.mugs, right: this.pulse && this.phase !== "end" ? "Uwaga: kran skacze!" : "" };
        }
        frame() {
            const flowing = this.phase === "pour" || (this.phase === "lag" && this.flow > 0.0006);
            drawMug(this.mug.bitmap, this.level, this.foam(), this.line, this.spilled, this.t);
            this.mug.x = Math.round(this.mugX);
            this.mug.visible = this.phase !== "end";
            this.stream.visible = flowing;
            if (flowing) {
                const surface = this.mug.y - (MUG.h - MUG.in1) * PX - this.level * (MUG.in1 - MUG.in0) * PX;
                this.stream.scale.y = Math.max(1, (surface - this.nozzle.y) / 4);
                this.stream.scale.x = (this.phase === "lag" ? Math.max(2, 8 * this.flow / this.rate) : 8 + (this.pulse ? 3 * Math.sin(this.pt / 3) : 0)) / 4;
                this.stream.x = Math.round(this.nozzle.x - this.stream.scale.x * 2);
            }
            // info (left)
            const key = [this.i, this.phase === "ready", this.pulse, this.results.length].join("|");
            if (key !== this._infoKey) {
                this._infoKey = key;
                const b = this.info.bitmap;
                b.clear();
                panel(b, 0, 0, 330, 300, { cut: 6 });
                txt(b, "Kufel " + Math.min(this.i + 1, this.cfg.mugs) + " z " + this.cfg.mugs, 18, 12, 294, { size: 28, color: ST().accent, bold: true });
                txt(b, this.pulse ? "Kran skacze: raz leje mocniej, raz słabiej!" : "Kran leje równo.", 18, 50, 294, { size: 18, color: this.pulse ? WARN : ST().muted });
                const lines = ["Przytrzymaj O - leje się piwo.", "Puść, gdy piana sięga żółtej kreski.", "Po puszczeniu piwo leci jeszcze chwilę: puść odrobinę wcześniej."];
                let y = 92;
                for (const l of lines) for (const w of wrapLines(b, l, 294, 18)) { txt(b, w, 18, y, 294, { size: 18 }); y += 25; }
                if (this.phase === "ready") txt(b, "Czekam na O...", 18, 256, 294, { size: 19, color: ST().accent, bold: true });
            }
            const tk = this.results.map(r => r.res).join(",");
            if (tk !== this._tallyKey) {
                this._tallyKey = tk;
                const b = this.tally.bitmap;
                b.clear();
                panel(b, 0, 0, 330, 240, { cut: 6 });
                txt(b, "Wynik", 18, 12, 294, { size: 26, color: ST().accent, bold: true });
                const count = res => this.results.filter(r => r.res === res).length;
                const rows = [["Idealnie", count("perfect"), ST().accent], ["Dobrze", count("good"), GOOD], ["Za mało / za dużo", count("short") + count("over"), ST().text], ["Rozlane", count("spill") + count("timeout"), BAD]];
                let y = 56;
                for (const [n, v, c] of rows) { txt(b, n, 18, y, 220, { size: 20 }); txt(b, String(v), 240, y, 70, { size: 20, color: c, bold: true, align: "right" }); y += 32; }
                const avg = this.results.length ? Math.round(this.results.reduce((a, r) => a + r.score, 0) / this.results.length) : 0;
                txt(b, "Średnio: " + avg + " / 100", 18, 194, 294, { size: 19, color: ST().muted });
                // the row of mugs at the bottom
                const rb = this.row.bitmap;
                rb.clear();
                const n = this.cfg.mugs, w = 70, x0 = Math.round((rb.width - n * (w + 10)) / 2);
                for (let i = 0; i < n; i++) {
                    const r = this.results[i], x = x0 + i * (w + 10);
                    panel(rb, x, 4, w, 76, { cut: 4, accent: false, fill: r ? "rgba(20,22,27,0.92)" : "rgba(12,13,16,0.7)", line: r ? scoreColour(r.score) : ST().line });
                    if (r) { icon(rb, 337, x + 19, 10, 32); txt(rb, r.res === "spill" ? "rozlane" : String(r.score), x, 46, w, { size: 17, color: scoreColour(r.score), bold: true, align: "center" }); }
                    else txt(rb, String(i + 1), x, 26, w, { size: 20, color: ST().muted, align: "center" });
                }
            }
        }
        state() {
            return { i: this.i, mugs: this.cfg.mugs, phase: this.phase, level: this.level, line: this.line, rate: this.rate, flow: this.flow,
                pulse: this.pulse, after: this.afterRelease(), results: this.results.map(r => r.res) };
        }
    }

    // ==================================================================
    // Part 3: the kitchen in rhythm - the steps slide to the yellow frame, press the right key there
    // ==================================================================
    const LANE = { x: 40, y: 92, w: 1200, h: 150, hitX: 190 };
    const WIN = { perfect: 5, good: 11 };
    class PartKitchen extends Part {
        setup() {
            const W = Graphics.width;
            const wall = closeupWall(4, (x, y) => (y === 1 && (x === 1 || x === 7) ? tB(8, 8) : y === 1 && (x === 2 || x === 6) ? tB(9, 8) : 0));
            wall.scale.set(PX);
            wall.x = -8;
            wall.y = -60;
            this.root.addChild(wall);
            const counter = makeTilemap(9, 3, (x, y) => (y === 0 ? [WALL_IN, [tB(8, 9), tB(9, 9), tB(10, 9), tB(10, 9), tB(11, 9), tB(10, 9), tB(10, 9), tB(9, 9), tB(8, 9)][x], 0, 0] : [FLOOR, 0, 0, 0]));
            counter.scale.set(PX);
            counter.x = -8;
            counter.y = 380;
            this.root.addChild(counter);
            // the lane
            this.lane = new Sprite(new Bitmap(LANE.w, LANE.h));
            this.lane.x = LANE.x; this.lane.y = LANE.y;
            this.root.addChild(this.lane);
            this.notesLayer = new Sprite();
            this.root.addChild(this.notesLayer);
            this.zone = new Sprite(new Bitmap(84, 84));
            this.zone.anchor.set(0.5, 0.5);
            this.zone.x = LANE.hitX; this.zone.y = LANE.y + LANE.h / 2 + 8;
            this.root.addChild(this.zone);
            this.drawZone();
            this.judgeSpr = new Sprite(new Bitmap(240, 34));
            this.judgeSpr.anchor.set(0.5, 0.5);
            this.judgeSpr.x = LANE.hitX + 40; this.judgeSpr.y = LANE.y + 20;
            this.judgeSpr.visible = false;
            this.root.addChild(this.judgeSpr);
            this.judgeT = 0;
            // the recipe card, the cook's hands, the finished dishes
            this.card = new Sprite(new Bitmap(560, 128));
            this.card.x = Math.round(W / 2 - 280); this.card.y = 256;
            this.root.addChild(this.card);
            this.tool = new Sprite(new Bitmap(32, 32));
            this.tool.anchor.set(0.5, 0.85);
            this.tool.scale.set(PX);
            this.tool.x = Math.round(W / 2); this.tool.y = 500;
            this.root.addChild(this.tool);
            this.plates = new Sprite(new Bitmap(W - 60, 96));
            this.plates.x = 30; this.plates.y = 612;
            this.root.addChild(this.plates);
            this.legend = new Sprite(new Bitmap(W - 60, 34));
            this.legend.x = 30; this.legend.y = 572;
            this.root.addChild(this.legend);
            super.setup();
            this.drawLegendRow();
            this.buildNotes();
        }
        buildNotes() {
            const beat = 3600 / this.cfg.bpm;
            this.beat = beat;
            this.travel = Math.round((LANE.w - (LANE.hitX - LANE.x) - 40) / this.cfg.speed);
            let t0 = this.travel + 40;
            this.notes = [];
            this.dishes = this.cfg.dishes.map((key, di) => {
                const rec = RECIPES[key];
                const steps = rec.steps.split(" ").map(s => { const [kind, b] = s.split(":"); return { kind, b: Number(b) }; });
                const start = t0;
                for (const s of steps) this.notes.push({ kind: s.kind, t: Math.round(start + s.b * beat), dish: di, res: null, spr: null });
                t0 += (steps[steps.length - 1].b + 3) * beat;
                return { key, name: rec.name, icon: rec.icon, add: rec.add, n: steps.length, start, res: null };
            });
            this.end = this.notes[this.notes.length - 1].t + 70;
            for (const n of this.notes) {
                n.spr = new Sprite(this.noteBitmap(n));
                n.spr.anchor.set(0.5, 0.5);
                n.spr.visible = false;
                this.notesLayer.addChild(n.spr);
            }
        }
        noteIcon(n) {
            const d = this.dishes[n.dish], st = STEPS[n.kind];
            return n.kind === "serve" ? d.icon : n.kind === "add" ? d.add : st.icon;
        }
        noteBitmap(n) {
            const b = new Bitmap(70, 86), st = STEPS[n.kind];
            panel(b, 3, 3, 64, 64, { cut: 6, fill: "rgba(14,15,19,0.95)", line: st.colour, accent: false });
            b.fillRect(5, 5, 60, 4, st.colour);
            icon(b, this.noteIcon(n), 15, 14, 40);
            keyCap(b, st.key === "ok" ? "O" : st.key, 22, 60, 26, st.colour);
            return b;
        }
        drawZone() {
            const b = this.zone.bitmap, c = b.context;
            b.clear();
            c.save();
            c.strokeStyle = ST().accent; c.lineWidth = 3;
            const L = 18;
            for (const [x, y, sx, sy] of [[3, 3, 1, 1], [81, 3, -1, 1], [3, 81, 1, -1], [81, 81, -1, -1]]) {
                c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke();
            }
            c.fillStyle = "rgba(255,210,63,0.10)"; c.fillRect(6, 6, 72, 72);
            c.restore();
            dirty(b);
        }
        drawLegendRow() {
            const b = this.legend.bitmap;
            b.clear();
            let x = 4;
            for (const k of STEP_ORDER) {
                const st = STEPS[k];
                x += keyCap(b, st.key === "ok" ? "O" : st.key, x, 4, 26, st.colour) + 6;
                txt(b, st.name, x, 5, 160, { size: 19, color: ST().text });
                x += Math.ceil(measure(b, st.name, 19)) + 22;
            }
            txt(b, "P - pauza", b.width - 160, 5, 156, { size: 17, color: ST().muted, align: "right" });
        }
        currentDish() {
            const n = this.notes.find(x => !x.res);
            return n ? n.dish : this.dishes.length - 1;
        }
        press(key) {
            const cands = this.notes.filter(n => !n.res && Math.abs(n.t - this.t) <= WIN.good);
            if (!cands.length) return;
            const n = cands[0], d = Math.abs(n.t - this.t);
            if (STEPS[n.kind].key === key) {
                n.res = d <= WIN.perfect ? "perfect" : "good";
                const st = STEPS[n.kind];
                se(st.se[0], st.se[1], st.se[2]);
                this.judge(n.res === "perfect" ? "Idealnie!" : "Dobrze", n.res === "perfect" ? ST().accent : GOOD);
                this.cook(n);
            } else {
                n.res = "wrong";
                se("Buzzer1", 45);
                this.judge("Nie ten krok!", BAD);
            }
            this.dishCheck(n.dish);
        }
        judge(text, colour) {
            const b = this.judgeSpr.bitmap;
            b.clear();
            txt(b, text, 0, 2, 240, { size: 24, color: colour, bold: true, outline: 4, align: "center" });
            this.judgeSpr.visible = true;
            this.judgeT = 0;
        }
        cook(n) {
            this.toolKind = n.kind;
            this.toolT = 0;
            const b = this.tool.bitmap;
            b.clear();
            icon(b, this.noteIcon(n), 0, 0, 32);
            const W = Graphics.width;
            if (n.kind === "spice") this.burst(W / 2, 470, "#b6f0a0", 8, 1.6, 0.12);
            if (n.kind === "stir") this.burst(W / 2, 470, "#ffffff", 5, 1.2, -0.03);
            if (n.kind === "cut") this.burst(W / 2, 500, "#ffcf9a", 5, 2.0, 0.15);
        }
        dishCheck(di) {
            const ns = this.notes.filter(n => n.dish === di);
            if (ns.some(n => !n.res)) return;
            const d = this.dishes[di];
            if (d.res) return;
            const score = ns.reduce((a, n) => a + (n.res === "perfect" ? 100 : n.res === "good" ? 65 : 0), 0) / ns.length;
            d.res = { score: Math.round(score), stars: score >= 90 ? 3 : score >= 65 ? 2 : score >= 35 ? 1 : 0 };
            this.float(d.name + ": " + ["spalone...", "jadalne", "smaczne", "wyborne!"][d.res.stars], Graphics.width / 2, 250, d.res.stars >= 2 ? ST().accent : WARN, 24, d.icon);
        }
        tick(k, kt) {
            if (this.done) return;
            for (const key of ["left", "up", "right", "down", "ok"]) if (kt[key]) this.press(key);
            for (const n of this.notes) {
                if (!n.res && this.t > n.t + WIN.good) {
                    n.res = "miss";
                    this.judge("Pudło", BAD);
                    this.dishCheck(n.dish);
                }
            }
            if (this.toolKind) this.toolT++;
            this.judgeT++;
            this.t++;
            this.tickFx();
            if (this.t >= this.end) this.finish();
        }
        finish() {
            const count = r => this.notes.filter(n => n.res === r).length;
            const perfect = count("perfect"), good = count("good"), miss = count("miss") + count("wrong");
            const score = this.notes.reduce((a, n) => a + (n.res === "perfect" ? 100 : n.res === "good" ? 65 : 0), 0) / this.notes.length;
            this.ctx.kitchenQ = score / 100;
            const g = [], b = [];
            if (perfect >= this.notes.length * 0.6) g.push("Kuchnia w punkt: " + perfect + " z " + this.notes.length + " kroków idealnie");
            const best = this.dishes.filter(d => d.res && d.res.stars === 3);
            if (best.length) g.push("Wyborne: " + best.map(d => d.name).join(", "));
            if (miss) b.push("Pomylone lub spóźnione kroki: " + miss);
            const burnt = this.dishes.filter(d => d.res && d.res.stars === 0);
            if (burnt.length) b.push("Nieudane: " + burnt.map(d => d.name).join(", "));
            this.complete(score, { notes: this.notes.length, perfect, good, miss, dishes: this.dishes.map(d => ({ name: d.name, score: d.res ? d.res.score : 0, stars: d.res ? d.res.stars : 0 })) }, g, b);
        }
        skipData(score) { this.ctx.kitchenQ = score / 100; return { notes: 0, perfect: 0, good: 0, miss: 0, dishes: [], skipped: true }; }
        progress() { return clamp(this.t / this.end, 0, 1); }
        hud() {
            const di = this.currentDish();
            return { timer: 1 - this.progress(), label: "Danie " + (di + 1) + " z " + this.dishes.length + ": " + this.dishes[di].name, right: "" };
        }
        frame() {
            // the lane and its beat
            const b = this.lane.bitmap;
            const beatPhase = ((this.t - (this.travel + 40)) % this.beat + this.beat) % this.beat;
            const pulse = Math.max(0, 1 - beatPhase / 10);
            if (this._laneKey !== Math.round(pulse * 10)) {
                this._laneKey = Math.round(pulse * 10);
                b.clear();
                panel(b, 0, 0, LANE.w, LANE.h, { cut: 8 });
                const y = LANE.h / 2 + 8;
                b.fillRect(20, y - 2, LANE.w - 40, 4, "rgba(255,255,255,0.08)");
                b.fillRect(LANE.hitX - LANE.x - 2, 20, 4, LANE.h - 30, "rgba(255,210,63," + (0.18 + 0.5 * pulse) + ")");
                txt(b, "Kroki przepisu", LANE.w - 316, 6, 300, { size: 16, color: ST().muted, align: "right" });
            }
            this.zone.scale.set(1 + 0.06 * pulse);
            this.judgeSpr.scale.set(1 + 0.25 * Math.max(0, 1 - this.judgeT / 6));
            this.judgeSpr.opacity = 255 * clamp(1 - (this.judgeT - 30) / 12, 0, 1);
            // notes
            for (const n of this.notes) {
                const x = LANE.hitX + (n.t - this.t) * this.cfg.speed;
                const show = x < LANE.x + LANE.w - 30 && (!n.res || this.t - n.t < 16);
                n.spr.visible = show && x > LANE.x - 40;
                if (!n.spr.visible) continue;
                n.spr.x = Math.round(x);
                n.spr.y = LANE.y + LANE.h / 2 + 18;
                if (n.res) {
                    const a = (this.t - n.t) / 16;
                    n.spr.opacity = 255 * (1 - clamp(a, 0, 1));
                    n.spr.scale.set(n.res === "perfect" || n.res === "good" ? 1 + 0.4 * clamp(a, 0, 1) : 1);
                    n.spr.setColorTone(n.res === "perfect" || n.res === "good" ? [40, 40, 0, 0] : [60, -60, -60, 120]);
                }
            }
            // the card of the current dish: its steps, done ones coloured
            const di = this.currentDish(), d = this.dishes[di];
            const ck = di + "|" + this.notes.filter(n => n.dish === di).map(n => n.res || "-").join("");
            if (ck !== this._cardKey) {
                this._cardKey = ck;
                const cb = this.card.bitmap;
                cb.clear();
                panel(cb, 0, 0, 560, 128, { cut: 6 });
                icon(cb, d.icon, 16, 14, 48);
                txt(cb, "Teraz: " + d.name, 76, 12, 460, { size: 26, color: ST().accent, bold: true });
                txt(cb, "danie " + (di + 1) + " z " + this.dishes.length, 76, 44, 300, { size: 16, color: ST().muted });
                const ns = this.notes.filter(n => n.dish === di);
                const w = 44, x0 = Math.round((560 - ns.length * w) / 2);
                ns.forEach((n, i) => {
                    const x = x0 + i * w, col = n.res === "perfect" ? ST().accent : n.res === "good" ? GOOD : n.res ? BAD : ST().line;
                    panel(cb, x + 2, 72, w - 4, 44, { cut: 3, accent: false, line: col, fill: n.res ? "rgba(30,32,38,0.95)" : "rgba(16,17,21,0.9)" });
                    icon(cb, this.noteIcon(n), x + 6, 78, 32);
                });
            }
            // the cook's hands: the last step's tool moving
            const tt = this.toolT || 0, kind = this.toolKind;
            this.tool.visible = !!kind && tt < 40;
            if (this.tool.visible) {
                this.tool.rotation = kind === "cut" ? -0.6 + 0.6 * Math.abs(Math.sin(tt / 4)) : kind === "stir" ? Math.sin(tt / 3) * 0.4 : 0;
                this.tool.y = 500 + (kind === "add" ? -40 + Math.min(40, tt * 3) : kind === "serve" ? 0 : 0);
                this.tool.x = Graphics.width / 2 + (kind === "serve" ? tt * 6 : kind === "spice" ? Math.sin(tt / 2) * 6 : 0);
                this.tool.opacity = 255 * (1 - clamp((tt - 26) / 14, 0, 1));
            }
            // the finished dishes
            const pk = this.dishes.map(x => (x.res ? x.res.stars : "-")).join("");
            if (pk !== this._platesKey) {
                this._platesKey = pk;
                const pb = this.plates.bitmap;
                pb.clear();
                panel(pb, 0, 0, pb.width, 96, { cut: 6 });
                txt(pb, "Gotowe na wieczór", 18, 8, 300, { size: 18, color: ST().muted });
                const w = 250, x0 = Math.max(220, Math.round((pb.width - this.dishes.length * w) / 2) + 90);
                this.dishes.forEach((x, i) => {
                    const px = x0 + i * w;
                    icon(pb, x.icon, px, 22, 48);
                    txt(pb, x.name, px + 56, 18, 190, { size: 19, color: x.res ? ST().text : ST().muted, bold: !!x.res });
                    const stars = x.res ? x.res.stars : 0;
                    for (let s = 0; s < 3; s++) drawStar(pb, px + 66 + s * 26, 62, 10, x.res && s < stars ? ST().accent : "#3a3e46");
                });
            }
        }
        state() {
            return { t: this.t, end: this.end, notes: this.notes.map(n => ({ kind: n.kind, key: STEPS[n.kind].key, t: n.t, res: n.res })), windows: WIN };
        }
    }

    // ==================================================================
    // Part 4: the evening - guests order, take the dish from the bar, bring it to the right guest
    // ==================================================================
    const SEAT_FEET = 4;
    class PartServe extends Part {
        setup() {
            const c = this.cfg;
            this.room = new Room(this, { evening: true, melia: true });
            this.root.addChild(this.room.root);
            this.hero = { x: standPt(4, 3).x, y: standPt(4, 3).y };
            this.hero.fig = this.room.addFigure(heroLook(), 4, 3, 2);
            this.hero.fig._sid = 1;
            this.menu = MENU_ORDER.filter(k => c.menu.includes(k));
            // the bar: one spot per dish on the counter
            this.spots = this.menu.map((key, i) => {
                const tx = COUNTER_X0 + i, s = new Sprite(new Bitmap(40, 40));
                icon(s.bitmap, dishIcon(key), 4, 4, 32);
                s.x = tx * T + 4; s.y = COUNTER_Y * T - 6;
                this.room.decor.addChild(s);
                return { key, tx, ty: COUNTER_Y, spr: s };
            });
            this.fire = this.ctx.fire === undefined ? 3 : this.ctx.fire;
            this.room.setFire(this.fire);
            this.hands = [];
            this.handsSpr = new Sprite(new Bitmap(80, 40));
            this.handsSpr.anchor.set(0.5, 1);
            this.handsSpr.visible = false;
            this.room.over.addChild(this.handsSpr);
            this.prompt = new Prompt();
            this.room.over.addChild(this.prompt);
            this.guests = [];
            this.nextId = 1;
            this.schedule = [];
            const span = c.spawnEnd - 60;
            for (let i = 0; i < c.guests; i++) this.schedule.push(Math.round(60 + (i + 0.15 + this.rng() * 0.6) * span / c.guests));
            this.looks = shuffle(PEOPLE.guests, this.rng);
            this.stats = { guests: 0, orders: 0, served: 0, mistakes: 0, walkouts: 0, noSeat: 0, speed: 0, tips: 0, cold: 0 };
            this.tipsF = 0;
            this.side = new Sprite(new Bitmap(SIDE.w, SIDE.h));
            this.side.x = SIDE.x; this.side.y = SIDE.y;
            this.root.addChild(this.side);
            this.fxLayer.x = ROOM_X; this.fxLayer.y = ROOM_Y;
            this.notes = [];
            super.setup();
            this.limit = c.time;
            this.bgsOn = false;
        }
        // ---- guests
        freeSeat() {
            const free = this.room.seats.filter(s => !s.guest && s.table.dirty <= 0);
            return free.length ? free[Math.floor(this.rng() * free.length)] : null;
        }
        spawn() {
            const look = this.looks[(this.nextId - 1) % this.looks.length];
            const f = new Figure(look);
            f._sid = 10 + this.nextId;
            const door = standPt(9, RR - 1);
            const g = { id: this.nextId++, fig: f, x: door.x, y: door.y + 40, state: "queue", wait: 0, order: [], got: [], patience: 0, max: this.cfg.patience, tip: 0, seat: null, path: null, bubble: null, t: 0 };
            f.x = g.x; f.y = g.y; f.dir = 8; f.refresh();
            this.room.chars.addChild(f);
            this.guests.push(g);
            this.stats.guests++;
            se("Door2", 40, 110);
        }
        seatGuest(g, seat) {
            g.seat = seat;
            seat.guest = g;
            const goal = standPt(seat.tx, seat.ty);
            const door = standPt(9, RR - 1);
            g.path = this.room.path(door.x, door.y, goal.x, goal.y, (x, y) => this.room.guestWalkable(x, y, seat)) || [door, goal];
            g.state = "enter";
        }
        walkGuest(g, speed) {
            if (!g.path || !g.path.length) return true;
            const p = g.path[0], dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy);
            if (d <= speed) { g.x = p.x; g.y = p.y; g.path.shift(); g.fig.advance(d); }
            else { g.x += dx / d * speed; g.y += dy / d * speed; g.fig.advance(speed); g.fig.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : dy > 0 ? 2 : 8; }
            g.fig.moving = true;
            return !g.path.length;
        }
        makeOrder() {
            const pick = () => {
                const total = this.menu.reduce((a, k) => a + DISHES[k].weight, 0);
                let r = this.rng() * total;
                for (const k of this.menu) { r -= DISHES[k].weight; if (r <= 0) return k; }
                return this.menu[0];
            };
            const o = [pick()];
            if (this.rng() < this.cfg.double) { let k2 = pick(); if (k2 === o[0]) k2 = pick(); o.push(k2); }
            return o;
        }
        tickGuest(g) {
            g.t++;
            const f = g.fig;
            switch (g.state) {
                case "queue": {
                    const seat = this.freeSeat();
                    if (seat) this.seatGuest(g, seat);
                    else {
                        g.wait++;
                        if (g.wait === 1) this.bubble(g, "?");
                        if (g.wait > 600) { g.state = "leave"; this.stats.noSeat++; this.float("Nie ma gdzie usiąść...", ROOM_X + g.x, ROOM_Y + g.y - 70, WARN, 18); g.path = [{ x: g.x, y: g.y + 80 }]; }
                    }
                    break;
                }
                case "enter":
                    if (this.walkGuest(g, 2.4)) {
                        g.state = "think";
                        g.t = 0;
                        f.moving = false;
                        f.dir = g.seat.face;
                        g.x = standPt(g.seat.tx, g.seat.ty).x;
                        g.y = standPt(g.seat.tx, g.seat.ty).y - SEAT_FEET;
                    }
                    break;
                case "think":
                    if (g.t >= 70) {
                        g.state = "wait";
                        g.order = this.makeOrder();
                        g.patience = g.max;
                        g.t = 0;
                        this.stats.orders += g.order.length;
                        se("Cursor3", 45, 120);
                    }
                    break;
                case "wait":
                    g.patience -= this.fire <= 0 ? 1.5 : 1;
                    if (g.patience <= 0) {
                        g.state = "angry";
                        g.t = 0;
                        this.stats.walkouts++;
                        se("Buzzer2", 55);
                        this.float("Hmpf! Wychodzę!", ROOM_X + g.x, ROOM_Y + g.y - 80, BAD, 20);
                    }
                    break;
                case "eat":
                    if (g.t >= this.cfg.eat) {
                        g.state = "pay";
                        g.t = 0;
                        const tip = Math.round(g.tip);
                        this.ctx.tips += tip;
                        this.stats.tips += tip;
                        if (tip > 0) { se("Coin", 60); this.float("+" + tip + " G", ROOM_X + g.x, ROOM_Y + g.y - 76, ST().accent, 22, GOLD_ICON); }
                        else this.float("Dziękuję.", ROOM_X + g.x, ROOM_Y + g.y - 76, ST().text, 18);
                    }
                    break;
                case "pay":
                case "angry":
                    if (g.t >= 40) this.leave(g);
                    break;
                case "leave":
                    if (this.walkGuest(g, 2.6)) { g.state = "gone"; }
                    break;
            }
            f.x = g.x;
            f.y = g.y + 4;
            if (g.state !== "enter" && g.state !== "leave") f.moving = false;
            f.refresh();
        }
        leave(g) {
            const seat = g.seat;
            if (seat) {
                seat.guest = null;
                if (g.state === "pay") this.room.setDirty(seat.table, 1);
                seat.table.wipe = 0;
                g.x = standPt(seat.tx, seat.ty).x;
                const exit = standPt(9, RR - 1);
                g.path = (this.room.path(g.x, g.y, exit.x, exit.y, (x, y) => this.room.guestWalkable(x, y, seat)) || [exit]).concat([{ x: exit.x, y: exit.y + 60 }]);
                if (g.path.length && g.path[0].x === g.x) g.path.shift();
            }
            if (g.plate) { g.plate.parent && g.plate.parent.removeChild(g.plate); g.plate = null; }
            g.state = "leave";
        }
        bubble(g, mark) {
            g.mark = mark;
        }
        // ---- the hero's targets
        targets() {
            const r = this.room, list = [];
            for (const s of this.spots) {
                const holding = this.hands.includes(s.key);
                const full = this.hands.length >= 2 || this.hands.includes("log");
                list.push({ kind: "spot", spot: s, rect: r.rectOf(s.tx, s.ty), label: (full && holding ? "Odstaw: " : full ? "" : "Weź: ") + DISHES[s.key].name, busy: full && !holding, putBack: full && holding });
            }
            if (this.hands.length && !this.hands.includes("log")) list.push({ kind: "tray", rect: r.rectOf(COUNTER_X1, COUNTER_Y), label: "Odstaw wszystko na ladę" });
            for (const g of this.guests) {
                if (!g.seat || g.state !== "wait") continue;
                const want = g.order.filter((k, i) => !g.got[i]);
                const has = this.hands.find(k => want.includes(k));
                list.push({ kind: "guest", guest: g, rect: r.rectOf(g.seat.tx, g.seat.ty), label: has ? "Podaj: " + DISHES[has].name : this.hands.length ? "Chce: " + want.map(k => DISHES[k].name).join(", ") : "Chce: " + want.map(k => DISHES[k].name).join(", "), dim: !has && !this.hands.length, wrong: !has && this.hands.length > 0 && !this.hands.includes("log") });
            }
            for (const tb of r.tables) if (tb.dirty > 0 && !tb.seats.some(s => s.guest && s.guest.state !== "leave")) list.push({ kind: "wipe", table: tb, rect: r.tableRect(tb), hold: true, label: "Przetrzyj stół" });
            if (this.hands.includes("log")) list.push({ kind: "fire", rect: r.rectOf(SPOT.fire.tx, SPOT.fire.ty), label: "Dorzuć do kominka" });
            else list.push({ kind: "log", rect: r.rectOf(SPOT.pile.tx, SPOT.pile.ty), label: this.hands.length ? "Masz zajęte ręce" : "Weź polano", busy: this.hands.length > 0 });
            return list;
        }
        act(tg) {
            const h = this.hero, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 64;
            if (tg.kind === "spot") {
                const key = tg.spot.key, i = this.hands.indexOf(key);
                if (tg.putBack || (i >= 0 && this.hands.length >= 2)) { this.hands.splice(i, 1); se("Cancel1", 45); }
                else if (tg.busy) { se("Buzzer1", 45); this.float("Masz pełne ręce (dwie rzeczy)", fx, fy, WARN, 18); }
                else { this.hands.push(key); se("Equip1", 55, 110); }
                this.drawHands();
            } else if (tg.kind === "guest") {
                const g = tg.guest, want = g.order.map((k, i) => (g.got[i] ? null : k));
                const hi = this.hands.findIndex(k => want.includes(k));
                if (hi < 0) {
                    if (!this.hands.length || this.hands.includes("log")) return;
                    this.stats.mistakes++;
                    g.patience = Math.max(1, g.patience - g.max * 0.15);
                    g.shake = 20;
                    se("Buzzer1", 55);
                    this.float("To nie to, co zamawiałem!", ROOM_X + g.x, ROOM_Y + g.y - 84, BAD, 18);
                    return;
                }
                const key = this.hands.splice(hi, 1)[0];
                g.got[want.indexOf(key)] = true;
                const d = DISHES[key], ratio = clamp(g.patience / g.max, 0, 1);
                const q = d.q === "beer" ? 0.6 + 0.6 * (this.ctx.beerQ === undefined ? 0.7 : this.ctx.beerQ) : d.q === "kitchen" ? 0.6 + 0.6 * (this.ctx.kitchenQ === undefined ? 0.7 : this.ctx.kitchenQ) : 1;
                g.tip += d.tip * (0.4 + 0.8 * ratio) * q * TIP_SCALE;
                this.stats.served++;
                this.stats.speed += ratio;
                se("Decision2", 55, 110);
                this.drawHands();
                if (g.order.every((k, i) => g.got[i])) {
                    g.state = "eat";
                    g.t = 0;
                    this.float(ratio > 0.66 ? "Szybko! Dzięki!" : ratio > 0.33 ? "Dziękuję." : "Nareszcie...", ROOM_X + g.x, ROOM_Y + g.y - 80, ratio > 0.66 ? GOOD : ratio > 0.33 ? ST().text : WARN, 18);
                    const plate = new Sprite(new Bitmap(36, 36));
                    icon(plate.bitmap, dishIcon(g.order[0]), 2, 2, 32);
                    const tb = g.seat.table;
                    plate.x = g.seat.face === 6 ? tb.tx * T + 6 : (tb.tx + 1) * T + 6;
                    plate.y = tb.ty * T - 4;
                    this.room.decor.addChild(plate);
                    g.plate = plate;
                }
            } else if (tg.kind === "tray") {
                this.hands = [];
                se("Cancel1", 45);
                this.drawHands();
            } else if (tg.kind === "log") {
                if (tg.busy) { se("Buzzer1", 45); this.float("Najpierw odnieś to, co niesiesz", fx, fy, WARN, 18); return; }
                this.hands = ["log"];
                se("Equip1", 55, 90);
                this.drawHands();
            } else if (tg.kind === "fire") {
                this.hands = [];
                this.fire = Math.min(3, Math.floor(this.fire) + 1);
                this.room.setFire(this.fire);
                se("Fire1", 55, 110);
                this.burst(ROOM_X + cx(SPOT.fire.tx), ROOM_Y + SPOT.fire.ty * T + 20, "#ffb347", 10, 1.8, -0.02);
                this.drawHands();
            }
        }
        drawHands() {
            const b = this.handsSpr.bitmap;
            showIf(this.handsSpr, this.hands.length);
            if (!this.hands.length) return;
            b.clear();
            if (this.hands[0] === "log") { icon(b, 381, 22, 2, 36); return; }
            this.hands.forEach((k, i) => icon(b, dishIcon(k), (this.hands.length === 1 ? 22 : 4 + i * 38), 4, 34));
        }
        tick(k, kt) {
            if (this.done) return;
            if (!this.bgsOn) { this.bgsOn = true; AudioManager.playBgs({ name: "People1", volume: 30, pitch: 100, pan: 0 }); }
            const r = this.room, h = this.hero;
            heroWalk(r, h, k);
            this.handsSpr.x = h.x; this.handsSpr.y = h.y - 54;
            while (this.schedule.length && this.schedule[0] <= this.t) { this.schedule.shift(); this.spawn(); }
            for (const g of this.guests) this.tickGuest(g);
            for (const g of this.guests.filter(x => x.state === "gone")) { g.fig.parent && g.fig.parent.removeChild(g.fig); if (g.bspr) { g.bspr.parent && g.bspr.parent.removeChild(g.bspr); } }
            this.guests = this.guests.filter(x => x.state !== "gone");
            // the fire burns down
            if (this.fire > 0) {
                const before = Math.ceil(this.fire);
                this.fire = Math.max(0, this.fire - this.cfg.fireDecay);
                if (Math.ceil(this.fire) !== before) r.setFire(this.fire);
                if (this.fire <= 0) this.float("Kominek wygasł! Zimno...", ROOM_X + cx(SPOT.fire.tx), ROOM_Y + 70, BAD, 20);
            } else this.stats.cold++;
            // the hero's action
            const tg = r.nearest(h, this.targets());
            this.target = tg;
            if (tg && tg.hold) {
                const tb = tg.table;
                if (k.ok) {
                    tb.wipe++;
                    r.setDirty(tb, 1 - tb.wipe / this.cfg.wipe);
                    if (tb.wipe % 8 === 1) se("Water1", 30, 150);
                    if (tb.wipe >= this.cfg.wipe) { r.setDirty(tb, 0); tb.wipe = 0; se("Chime2", 45, 130); this.burst(ROOM_X + tb.tx * T + 48, ROOM_Y + tb.ty * T + 16, "#fff7c0", 8, 2); }
                }
            } else if (tg && kt.ok) this.act(tg);
            if (tg) {
                const label = tg.busy && tg.kind === "spot" ? "Masz pełne ręce" : tg.label + (tg.hold ? " (przytrzymaj)" : "");
                this.prompt.show(label, tg.rect.x + tg.rect.w / 2, tg.kind === "guest" ? tg.rect.y + tg.rect.h + 36 : tg.rect.y - 6, tg.hold ? tg.table.wipe / this.cfg.wipe : undefined, tg.busy || tg.dim);
            } else this.prompt.hide();
            // Melia plays
            if (r.melia) {
                r.melia.moving = true;
                r.melia.step = this.t / 16;
                r.melia.refresh();
                if (this.t % 50 === 0) this.float("♪", ROOM_X + r.melia.x + 14, ROOM_Y + r.melia.y - 58, ST().accent, 22);
            }
            r.tickFire(this.t);
            r.sortChars();
            this.tickFx();
            this.t++;
            const quiet = !this.schedule.length && this.guests.every(g => g.state === "leave" || g.state === "gone");
            if (this.t >= this.limit || (quiet && this.t > 600)) this.finish();
        }
        finish() {
            const s = this.stats;
            const unserved = this.guests.filter(g => g.state === "wait" || g.state === "think").reduce((a, g) => a + g.order.filter((k, i) => !g.got[i]).length, 0);
            const orders = Math.max(1, s.orders + (this.guests.filter(g => g.state === "think").length));
            const ratio = s.served / orders, speed = s.served ? s.speed / s.served : 0;
            let score = 100 * (0.65 * ratio + 0.35 * speed * ratio) - 5 * s.mistakes - 6 * s.walkouts - 3 * s.noSeat;
            // the ones who are still eating pay now
            for (const g of this.guests) if (g.state === "eat") { const tip = Math.round(g.tip); this.ctx.tips += tip; s.tips += tip; }
            const g = [], b = [];
            if (s.served >= orders && s.served > 0) g.push("Obsłużeni wszyscy goście (" + s.guests + ")");
            else if (s.served > 0) g.push("Podane zamówienia: " + s.served + " z " + orders);
            if (speed >= 0.6 && s.served >= 3) g.push("Szybka obsługa - napiwki: " + s.tips + " G");
            if (s.mistakes) b.push("Pomyłki przy stołach: " + s.mistakes);
            if (s.walkouts) b.push("Wyszli bez płacenia: " + s.walkouts);
            if (s.noSeat) b.push("Nie mieli gdzie usiąść (brudne stoły): " + s.noSeat);
            if (unserved) b.push("Nie podane do zamknięcia: " + unserved);
            if (s.cold > 600) b.push("Wygasły kominek - zmarznięci goście");
            if (this.bgsOn) AudioManager.fadeOutBgs(1);
            this.complete(score, { guests: s.guests, orders, served: s.served, mistakes: s.mistakes, walkouts: s.walkouts, noSeat: s.noSeat, unserved, tips: s.tips, speed: Math.round(speed * 100) / 100 }, g, b);
        }
        skipData(score) { const tip = Math.round(score / 4); this.ctx.tips += tip; return { guests: 0, orders: 0, served: 0, mistakes: 0, walkouts: 0, noSeat: 0, unserved: 0, tips: tip, skipped: true }; }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() {
            const left = Math.max(0, this.limit - this.t);
            return { timer: left / this.limit, label: "Do zamknięcia: " + fmtTime(left), right: "Obsłużone: " + this.stats.served };
        }
        frame() {
            // the order bubbles over the guests
            for (const g of this.guests) {
                const show = g.state === "wait" || g.state === "think" || (g.state === "queue" && g.wait > 0);
                if (!show) { if (g.bspr) g.bspr.visible = false; continue; }
                if (!g.bspr) {
                    g.bspr = new Sprite(new Bitmap(112, 70));
                    g.bspr.anchor.set(0.5, 1);
                    this.room.over.addChild(g.bspr);
                }
                g.bspr.visible = true;
                const shake = g.shake > 0 ? Math.sin(g.shake--) * 3 : 0;
                g.bspr.x = Math.round(g.x + shake);
                g.bspr.y = Math.round(g.y - 60);
                const ratio = g.state === "wait" ? clamp(g.patience / g.max, 0, 1) : 1;
                const key = g.state + "|" + g.order.map((k, i) => (g.got[i] ? "x" : k)).join(",") + "|" + Math.round(ratio * 30);
                if (key === g.bkey) continue;
                g.bkey = key;
                const b = g.bspr.bitmap;
                b.clear();
                const want = g.order.filter((k, i) => !g.got[i]);
                const w = g.state === "wait" ? Math.max(56, 12 + want.length * 38) : 48, x0 = Math.round((112 - w) / 2);
                drawBubble(b, x0, 4, w, 52, ratio);
                if (g.state === "wait") {
                    want.forEach((k, i) => icon(b, dishIcon(k), x0 + 8 + i * 38 + (want.length === 1 ? (w - 16 - 34) / 2 : 0), 8, 34));
                    const col = ratio > 0.5 ? GOOD : ratio > 0.25 ? WARN : BAD;
                    bar(b, x0 + 6, 46, w - 12, 5, ratio, col);
                } else txt(b, g.state === "queue" ? "?" : "...", x0, 8, w, { size: 26, color: ST().accent, bold: true, align: "center" });
            }
            // the side panel
            const waiting = this.guests.filter(g => g.state === "wait").sort((a, b) => a.patience - b.patience);
            const key = waiting.map(g => g.id + ":" + g.order.map((k, i) => (g.got[i] ? "x" : k)).join(",") + ":" + Math.round(g.patience / g.max * 20)).join("|") + "#" + this.hands.join(",") + "#" + Math.ceil(this.fire * 3) + "#" + this.stats.served + "#" + this.ctx.tips;
            if (key === this._sideKey) return;
            this._sideKey = key;
            const b = this.side.bitmap;
            b.clear();
            panel(b, 0, 0, SIDE.w, SIDE.h, { cut: 6 });
            txt(b, "Zamówienia", 20, 12, 200, { size: 25, color: ST().accent, bold: true });
            txt(b, waiting.length ? String(waiting.length) : "brak", SIDE.w - 120, 16, 100, { size: 18, color: ST().muted, align: "right" });
            let y = 52;
            for (const g of waiting.slice(0, 5)) {
                const want = g.order.filter((k, i) => !g.got[i]), ratio = clamp(g.patience / g.max, 0, 1);
                panel(b, 14, y, SIDE.w - 28, 52, { cut: 4, accent: false, fill: "rgba(22,24,29,0.9)", line: ratio < 0.25 ? BAD : ST().line });
                txt(b, "Stół " + (g.seat.table.i + 1), 24, y + 4, 90, { size: 17, color: ST().muted });
                want.forEach((k, i) => icon(b, dishIcon(k), 100 + i * 36, y + 9, 32));
                txt(b, want.map(k => DISHES[k].name).join(", "), 24, y + 24, 80, { size: 13, color: ST().text });
                bar(b, 186, y + 22, SIDE.w - 214, 7, ratio, ratio > 0.5 ? GOOD : ratio > 0.25 ? WARN : BAD);
                y += 58;
            }
            if (waiting.length > 5) txt(b, "+ " + (waiting.length - 5) + " więcej", 24, y, 200, { size: 16, color: ST().muted });
            y = 360;
            txt(b, "W rękach", 20, y, 200, { size: 19, color: ST().muted });
            for (let i = 0; i < 2; i++) {
                panel(b, 130 + i * 50, y - 4, 44, 44, { cut: 3, accent: false, fill: "rgba(22,24,29,0.9)" });
                const k = this.hands[i];
                if (k === "log") { if (i === 0) icon(b, 381, 136, y + 2, 32); }
                else if (k) icon(b, dishIcon(k), 136 + i * 50, y + 2, 32);
            }
            y += 54;
            txt(b, "Kominek", 20, y, 120, { size: 19, color: ST().muted });
            const fr = this.fire / 3;
            bar(b, 130, y + 9, SIDE.w - 160, 8, fr, fr > 0.34 ? WARN : BAD);
            if (fr <= 0.34) txt(b, fr <= 0 ? "Zgasł! Dorzuć drewna." : "Przygasa - dorzuć drewna.", 20, y + 22, SIDE.w - 40, { size: 16, color: BAD });
            y += 50;
            txt(b, "Napiwki: " + this.ctx.tips + " G", 20, y, SIDE.w - 40, { size: 20, color: ST().accent, bold: true });
            drawLegend(b, 20, SIDE.h - 98, [[["up", "left", "down", "right"], "lub WSAD"], [["O"], "weź / podaj (przytrzymaj: przetrzyj)"], [["P"], "pauza"]]);
        }
        state() {
            const r = this.room;
            return {
                t: this.t, limit: this.limit, hero: { x: this.hero.x, y: this.hero.y }, hands: this.hands.slice(), fire: this.fire,
                spots: this.spots.map(s => ({ key: s.key, stand: standPt(s.tx, s.ty + 1) })), tray: standPt(COUNTER_X1, COUNTER_Y + 1),
                guests: this.guests.map(g => ({ id: g.id, state: g.state, want: g.order.filter((k, i) => !g.got[i]), patience: g.patience / g.max,
                    table: g.seat ? g.seat.table.i : -1, stands: g.seat ? r.standsAround([g.seat]) : [] })),
                tables: r.tables.map(tb => ({ i: tb.i, dirty: tb.dirty, busy: tb.seats.some(s => s.guest), stands: r.standsAround([{ tx: tb.tx, ty: tb.ty }, { tx: tb.tx + 1, ty: tb.ty }]) })),
                pile: r.standsAround([SPOT.pile]), fireStand: r.standsAround([SPOT.fire]), stats: Object.assign({}, this.stats), target: this.target ? this.target.kind : null
            };
        }
    }

    const PART_CLASSES = { clean: PartClean, beer: PartBeer, kitchen: PartKitchen, serve: PartServe };

    P.parts = { PART_CLASSES, PartClean, PartBeer, PartKitchen, PartServe };
})();
