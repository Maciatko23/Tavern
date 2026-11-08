//=============================================================================
// MenuRing_Strony.js
//=============================================================================
// Part of MenuRing.js (refactor 2026-11-07: a big file split - these lines moved here word for word, nothing changed). It gives
// MenuRing.js its names through Tawerna.api("MenuRing_parts").pages; it must stand just above MenuRing.js on the plugin list.

/*:
 * @target MZ
 * @plugindesc Menu P - strony Postać, Ekwipunek, Umiejętności i Plecak (część MenuRing.js). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderBefore MenuRing
 *
 * @help
 * MenuRing_Strony.js - menu P: strony Postać, Ekwipunek, Umiejętności, Plecak
 * Sama nic nie robi bez MenuRing.js; musi stać tuż nad nim na liście wtyczek.
 */

(() => {
    "use strict";
    const CZESCI = window.Tawerna && window.Tawerna.api("MenuRing_parts");
    if (!CZESCI || !CZESCI.kit) throw new Error("MenuRing_Strony.js: musi być pod MenuRing_Rysunki.js na liście wtyczek (an earlier part is missing or below)");
    const { T, CH, PLUGIN, C, textOut, measure, W, H, ease, K, NEED_COL, L, RX, touchAt, plural, item, MP, num1, pctTxt, weightTxt,
        cap1, heroXp, needRows, debtInfo, opinionInfo, wrapWords, rr, hl, vl, meter, done, tx, keycap, smallKeys, smallKeysWidth,
        heading, header, STRIP_TOP, tabStrip, inBox, tick, bubble, View } = CZESCI.kit;
    if (T.api(PLUGIN)) return;

    // ==================================================================
    // Postać (lista_v2_glowne.png): the bust, the name, the level, the needs, the purse, the debt, the opinion; the attributes, the fight
    // ==================================================================
    function PostacView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._focus = 0;
    }
    PostacView.prototype = Object.create(View.prototype);
    PostacView.prototype.constructor = PostacView;
    const attrIds = () => { const Cb = T.api("Combat"); return Cb && Cb.ATTRS ? Cb.ATTRS.map(a => a.id) : []; };
    // the places of Postać on the wide panel: the bust, beside it who he is (iw wide), the fight on the right; under them the attributes
    // (cw2 wide) and what keeps him whole (ODPORNOŚCI) - the chosen attribute's bubble lies over the latter
    const PA = () => {
        const R = RX(), ya = R.y0 + 392, cx = R.lx + 256, iw = Math.min(560, R.rx - cx - 320), cw2 = Math.min(440, Math.floor((R.rx - R.lx - 50) / 2));
        return { ya, cw2, cx, iw, fx: cx + iw + 40, dx: R.lx + cw2 + 60, rowY: i => ya + 32 + i * 30 };
    };
    PostacView.prototype.keys = function() {
        const xp = heroXp(), out = [["W/S", "atrybut"]];
        if (xp && xp.points > 0) out.push(["O", "dodaj punkt"]);
        out.push(["P", "wróć"]);
        return out;
    };
    function drawBust(b, x, y, w, h) {
        const name = T.ui && T.ui.heroBust ? T.ui.heroBust() : "Hero_Bust", src = T.ui && T.ui.loadBust ? T.ui.loadBust(name) : ImageManager.loadPicture(name), ctx = b.context;
        if (!src || (src.isError && src.isError())) return true;
        if (!src.isReady()) return false;
        const img = src._canvas || src._image, k = h / src.height, bw = src.width * k;
        ctx.save();
        CH.roundPath(ctx, x, y, w, h, 12);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        if (img) ctx.drawImage(img, 0, 0, src.width, src.height, x + (w - bw) / 2, y, bw, h);
        ctx.restore();
        return true;
    }
    PostacView.prototype.fightRows = function() {
        const Cb = T.api("Combat"), fi = Cb && Cb.fightInfo ? Cb.fightInfo() : null, de = Cb && Cb.defenseInfo ? Cb.defenseInfo() : null;
        if (!fi || !de) return [];
        const wp = fi.weapon, block = Math.min(0.9, (de.shield ? de.shield.reduce : de.bare) + de.blockPerk);
        return [["Broń", fi.ranged ? wp.name : wp.id ? wp.name : "pięści"], fi.ranged ? ["Strzał", String(wp.shot)] : ["Cios", String(wp.hit)],
            ["Zasięg", fi.ranged ? wp.range + " pól" : num1(wp.reach)], ["Zbroja", de.armor ? "−" + pctTxt(de.armor.reduce) : "brak"], ["Blok", pctTxt(block)]];
    };
    // what keeps him whole (Combat.defenseInfo - only what is worn counts)
    PostacView.prototype.defenseRows = function() {
        const Cb = T.api("Combat"), de = Cb && Cb.defenseInfo ? Cb.defenseInfo() : null;
        if (!de) return [];
        return [["Życie (najwięcej)", String(de.mhp)], ["Oddech", String(de.breath)], ["Szansa na ranę", pctTxt(de.wound) + " zwykłej"],
            ["Próg przewrócenia", String(de.knock)], ["Zimno", de.cloak ? "płaszcz: nie marzniesz" : de.cold > 0 ? "marzniesz słabiej (−" + pctTxt(Math.min(1, de.cold)) + ")" : "bez płaszcza marzniesz"]];
    };
    PostacView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX(), xp = heroXp(), Cb = T.api("Combat"), pts = xp ? xp.points : 0;
        b.clear();
        header(b, "Postać", this.inside ? (pts > 0 ? pts + " " + plural(pts, "punkt", "punkty", "punktów") + " do rozdania" : "") : "podgląd");
        // ---- the bust
        const lx = R.lx, bw = 230, bh = 262, by = R.y0 + 106;
        rr(ctx, lx, by, bw, bh, 12, K.panel2);
        this._bustOk = drawBust(b, lx, by, bw, bh);
        // ---- the name, the level and its bar
        const pa = PA(), cx = pa.cx, w = pa.iw, actor = $gameParty.leader(), name = actor ? actor.name() : "";
        let y = R.y0 + 108;
        tx(b, name, cx, y, 34, { top: true, face: "bold" });
        if (xp) tx(b, "Poziom " + xp.level, cx + measure(name, 34, "bold") + 14, y + 11, 22, { top: true, face: "bold", color: K.acc });
        y += 48;
        if (xp) {
            meter(ctx, cx, y, w - 150, 8, xp.ratio, K.acc);
            tx(b, xp.top ? "najwyższy poziom" : xp.xp + " / " + xp.need + " dośw.", cx + w, y + 4, 19, { align: "right", color: K.muted });
        }
        y += 22 + 12;
        // ---- the four needs, two by two
        const cw = (w - 28) / 2;
        needRows().forEach(([key, lab, v, val], k) => {
            const nx = cx + (k % 2) * (cw + 28), ny = y + Math.floor(k / 2) * 48, [icon, mode] = CH.NEED_ICONS[key];
            CH.drawIcon(b, icon, nx - 4, ny - 4, 32, mode);
            tx(b, lab, nx + 34, ny + 4, 21, { top: true });
            tx(b, val, nx + cw, ny + 4, 21, { top: true, face: "bold", align: "right", color: v < 0.25 ? K.warn : K.text });
            meter(ctx, nx + 34, ny + 30, cw - 34, 6, v, NEED_COL[key]);
        });
        y += 96 + 10;
        // ---- the purse, grandpa's debt, the town's opinion
        const d = debtInfo(), op = opinionInfo(), cw3 = w / 3;
        let dLab = "Dług dziadka", dVal = "-", dSub = "", dWarn = false;
        if (d && d.lost) {
            dLab = "Odkup działki";
            dVal = d.done ? "odkupiona" : (d.debt - d.paid) + " G";
            dSub = d.done ? "" : d.days > 1 ? "wynieś: " + d.days + " dni" : d.days === 1 ? "wynieś: dziś" : "bez terminu";
            dWarn = !d.done && d.days >= 1;
        } else if (d) {
            dVal = d.done ? "spłacony" : (d.debt - d.paid) + " G";
            dSub = d.done ? "" : d.days > 1 ? "zostało " + d.days + " " + plural(d.days, "dzień", "dni", "dni") : d.days === 1 ? "dziś termin" : "do świtu";
            dWarn = !d.done && d.days <= 5;
        }
        // (the opinion: only its word - "Obcy", "Bywalec"... - the user, 2026-10-23: "wystarczy napis Obcy")
        const cols = [["Sakiewka", $gameParty.gold() + " G", K.gold, ""], [dLab, dVal, d && d.done ? K.good : K.text, dSub],
            ["Opinia", op ? op.tier || String(op.value) : "-", K.text, ""]];
        cols.forEach(([lab, val, col, sub], k) => {
            const xx = cx + k * cw3;
            tx(b, lab, xx, y, 19, { top: true, color: K.muted });
            tx(b, val, xx, y + 24, 24, { top: true, face: "bold", color: col, max: cw3 - 8 });
            if (sub) tx(b, sub, xx, y + 54, 18, { top: true, color: k === 1 && dWarn ? K.warn : K.muted, max: cw3 - 6 });
        });
        // ---- the attributes, the fight (top right), what keeps him whole
        hl(ctx, R.x0 + 30, R.x1 - 30, pa.ya - 12);
        heading(b, lx, pa.ya, "ATRYBUTY", lx + pa.cw2 - (pts > 0 ? 120 : 0));
        if (pts > 0) tx(b, pts + " do rozdania", lx + pa.cw2, pa.ya, 19, { top: true, align: "right", color: K.acc });
        const ids = attrIds();
        ids.forEach((id, i) => {
            const a = Cb.ATTRS[i], ry = pa.rowY(i), on = this.inside && i === this._focus;
            if (on) rr(ctx, lx - 8, ry - 4, pa.cw2 + 16, 30, 8, K.acc);
            tx(b, a.name, lx, ry, 23, { top: true, color: on ? K.sel : K.text });
            tx(b, String(xp ? xp.attr[id] || 0 : 0), lx + pa.cw2, ry, 23, { top: true, face: "bold", align: "right", color: on ? K.sel : K.text });
            if (pts > 0 && (xp.attr[id] || 0) < (Cb.ATTR_MAX || 60)) {   // (a "+" while there are points to give)
                const px = lx + pa.cw2 - 52;
                rr(ctx, px, ry, 22, 22, 5, on ? K.sel : K.accDim);
                tx(b, "+", px + 11, ry + 11, 19, { face: "bold", align: "center", color: on ? K.acc : K.text });
            }
        });
        const fx = pa.fx, fw = R.rx - fx, fy = R.y0 + 108;
        heading(b, fx, fy, "WALKA", R.rx);
        this._fight = this.fightRows();
        this._fight.forEach(([lab, val], i) => {
            const ry = fy + 32 + i * 30;
            tx(b, lab, fx, ry, 22, { top: true, color: K.muted });
            tx(b, val, R.rx, ry, 22, { top: true, face: "bold", align: "right", max: fw - 90 });
        });
        const dx = pa.dx, dw = Math.min(560, R.rx - dx);
        heading(b, dx, pa.ya, "ODPORNOŚCI", dx + dw);
        this._defense = this.defenseRows();
        this._defense.forEach(([lab, val], i) => {
            const ry = pa.rowY(i);
            tx(b, lab, dx, ry, 22, { top: true, color: K.muted, max: dw - 200 });
            tx(b, val, dx + dw, ry, 22, { top: true, face: "bold", align: "right", max: 260 });
        });
        this._popup = this.inside && ids[this._focus] ? this.drawPopup(b, ids[this._focus], pa.rowY(this._focus) + 11) : null;
        done(b);
    };
    // the chosen attribute's bubble beside its row (over the fight's column): what it gives now and with one point more - the same
    // numbers the fight and the work use (Combat.attrInfo)
    PostacView.prototype.drawPopup = function(b, id, rowCy) {
        const Cb = T.api("Combat"), info = Cb && Cb.attrInfo ? Cb.attrInfo(id) : null;
        if (!info) return null;
        const R = RX(), pa = PA(), ctx = b.context, x = R.lx + pa.cw2 + 26, w = Math.min(600, R.rx + 10 - x), pad = 14, iw = w - pad * 2;
        const desc = wrapWords(info.desc, 17, iw, "regular").slice(0, 2), top = !info.rows.length || !info.rows[0].next;
        const h = pad + 28 + desc.length * 21 + 8 + 20 + info.rows.length * 23 + 10;
        // (in the lower half only: the purse, the debt and the opinion over it stay seen)
        const y = Math.max(Math.min(pa.ya - 20, R.y1 - 8 - h), Math.min(R.y1 - 8 - h, Math.round(rowCy - h / 2)));
        bubble(ctx, x, y, w, h, { side: "left", at: rowCy });
        let yy = y + pad;
        const nw = tx(b, info.name, x + pad, yy, 22, { top: true, face: "bold" });
        tx(b, info.value + " / " + info.max, x + pad + nw + 12, yy + 4, 18, { top: true, color: K.acc });
        yy += 28;
        for (const line of desc) { tx(b, line, x + pad, yy, 17, { top: true, face: "regular", color: K.muted }); yy += 21; }
        yy += 8;
        const cNow = x + w - pad - 120, cNext = x + w - pad;
        tx(b, "TERAZ", cNow, yy, 16, { top: true, face: "sc", color: K.muted, align: "right" });
        tx(b, top ? "NAJWYŻEJ" : "+1 PUNKT", cNext, yy, 16, { top: true, face: "sc", color: K.acc, align: "right" });
        yy += 20;
        const rows = [];
        for (const r of info.rows) {
            tx(b, r.label, x + pad, yy, 18, { top: true, color: K.soft, max: cNow - 70 - (x + pad) });
            tx(b, r.now, cNow, yy, 18, { top: true, face: "bold", align: "right" });
            tx(b, r.next || "—", cNext, yy, 18, { top: true, face: "bold", align: "right", color: r.next && r.next !== r.now ? K.acc : K.dim });
            rows.push(r.label + ": " + r.now + (r.next ? " -> " + r.next : ""));
            yy += 23;
        }
        return { attr: id, name: info.name, x, y, w, h, rows };
    };
    PostacView.prototype.update = function() {
        if (!this._bustOk && this.root.visible && ++this._bustT % 10 === 0) this.redraw();   // (the bust still loading)
        if (!this.ready()) return;
        const n = attrIds().length;
        if (this.mouseMoved()) { const p = touchAt(), k = this.rowAt(p.x, p.y); if (k >= 0 && k !== this._focus) { this._focus = k; this.redraw(); } }
        if (n && (Input.isRepeated("down") || Input.isRepeated("up"))) {
            this._focus = (this._focus + (Input.isRepeated("down") ? 1 : n - 1)) % n;
            SoundManager.playCursor();
            this.redraw();
        } else if (Input.isTriggered("ok")) this.spend();
    };
    PostacView.prototype._bustT = 0;
    PostacView.prototype.rowAt = function(x, y) {
        const R = RX(), pa = PA();
        if (x < R.lx - 8 || x > R.lx + pa.cw2 + 8) return -1;
        for (let i = 0; i < attrIds().length; i++) { const ry = pa.rowY(i); if (y >= ry - 4 && y < ry + 26) return i; }
        return -1;
    };
    // O (or a click on the chosen one): a point to the chosen attribute, while there are points
    PostacView.prototype.spend = function() {
        const Cb = T.api("Combat"), xp = heroXp(), id = attrIds()[this._focus], add = {};
        if (!id) return;
        add[id] = 1;
        if (Cb && xp && xp.points > 0 && Cb.spendPoints && Cb.spendPoints(add)) {
            AudioManager.playSe({ name: "Item3", volume: 70, pitch: 110, pan: 0 });
            this.redraw();
            this.scene.drawKeys();
            this.scene.drawList();
        } else SoundManager.playBuzzer();
    };
    PostacView.prototype.touch = function(x, y) {
        const k = this.rowAt(x, y);
        if (k < 0) return;
        if (k !== this._focus) { this._focus = k; SoundManager.playCursor(); this.redraw(); }
        else this.spend();
    };
    PostacView.prototype.leave = function() { this._mx = undefined; };
    PostacView.prototype.info = function() {
        const ids = attrIds(), xp = heroXp();
        const op = opinionInfo();
        return { stats: { focus: this.inside ? ids[this._focus] || null : null, points: xp ? xp.points : 0, plus: !!(xp && xp.points > 0), xp,
            fight: (this._fight || []).map(r => r[0] + ": " + r[1]), defense: (this._defense || []).map(r => r[0] + ": " + r[1]), bust: !!this._bustOk,
            popup: this._popup || null, opinion: op ? op.tier : null } };
    };

    // ==================================================================
    // Ekwipunek (lista_v2_ekwipunek.png, _wybor.png): the hero big between two grids of places, the chosen place's card, RAZEM
    // ==================================================================
    const GRID_L = [["head", "torso"], ["hands", "belt"], ["legs", "feet"]];
    const GRID_R = [["cloak", "back"], ["right", "left"], ["extra", null]];
    const EQ = { cell: 72, px: 88, py: 100, gy: 134 };
    const SLOT_PLACE = { head: "glowa", torso: "tors", legs: "nogi", feet: "stopy", belt: "pas", hands: "rece", back: "plecy" };
    const BARE = { head: "głowa zostaje odkryta", cloak: "bez płaszcza", torso: "bez niczego na grzbiecie", hands: "gołe ręce", belt: "bez pasa",
        legs: "bez spodni", feet: "boso", back: "nic na plecach", left: "wolna ręka", extra: "nic" };
    const TURN = [["przód", 0], ["bok", 2], ["tył", 4], ["bok", 6]];   // (Hero_Walk's rows: S, W, N, E)
    function eqCells() {
        const R = RX(), gy = R.y0 + EQ.gy, gxR = R.rx - (2 * EQ.cell + 16), out = [];
        GRID_L.forEach((row, r) => row.forEach((id, c) => { if (id) out.push({ id, g: 0, r, c, x: R.lx + c * EQ.px, y: gy + r * EQ.py }); }));
        GRID_R.forEach((row, r) => row.forEach((id, c) => { if (id) out.push({ id, g: 1, r, c, x: gxR + c * EQ.px, y: gy + r * EQ.py }); }));
        return out;
    }
    // the figure: the sheet's 64 x 64 cell 5 x (2026-10-23: the card under it gone - its words are in the bubbles now - the hero bigger)
    // (head: the rows over the cell where a helmet's crown goes - Ubior.js's strip over the head, 2026-10-23; the figure's bitmap is
    // that much taller upward, the feet stay where they were)
    const FIG = { scale: 5, size: 320, feet: 61, head: 12 };
    const figPlace = () => { const R = RX(), gy = R.y0 + EQ.gy; return { cx: Math.round((R.lx + 2 * EQ.cell + 16 + R.rx - (2 * EQ.cell + 16)) / 2), top: gy - 42 }; };
    const EQB = { w: 330, band: 56 };   // (the bubble's width; RAZEM's band at the foot)
    // what the worn things give, summed (Combat_Fight's armour, the cloak, Ubior_Sklepy's clothes, the backpack, the boots)
    function totals() {
        const Cb = T.api("Combat"), US = T.api("Ubior_Sklepy"), E = T.api("Equipment"), S = T.api("Survival");
        const worn = id => !!(E && E.worn && E.worn(id));
        const ar = Cb && Cb.armor ? Cb.armor() : null;
        const cold = US && US.bonus ? US.bonus("cold") : 0;
        const load = (US && US.udzwig ? US.udzwig() : 0) + (worn(114) ? (S && S.WEIGHT_CAP_BACKPACK) || 80 : 0);
        const neat = US && US.schludnosc ? US.schludnosc() : 0;
        const walk = (US && US.predkosc ? US.predkosc() : 0) + (worn(113) && S && S.BOOTS_SPEED ? S.BOOTS_SPEED - 1 : 0);
        return [["Zbroja", ar ? "−" + pctTxt(ar.reduce) : "brak"], ["Ciepło", worn(112) ? "pełne" : cold > 0 ? "+" + pctTxt(cold) : "brak"],
            ["Udźwig", load ? "+" + load : "brak"], ["Schludność", neat ? "+" + neat : "brak"], ["Chód", walk > 0.001 ? "+" + pctTxt(walk) : "brak"]];
    }
    function EquipView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._fig = new Sprite(new Bitmap(FIG.size, FIG.size + FIG.head * FIG.scale));
        this._fig.bitmap.smooth = false;
        this.root.addChild(this._fig);
        this._cell = "head";
        this._mode = "cells";
        this._row = 0;
        this._rows = [];
        this._dir = 0;
        this._note = "";
        this._figKey = "";
        this._pv = { key: "", bmp: null, ok: false };
    }
    EquipView.prototype = Object.create(View.prototype);
    EquipView.prototype.constructor = EquipView;
    EquipView.prototype.keys = function() {
        if (this._mode === "list") return [["W/S", "rzecz"], ["O", "załóż"], ["P", "wróć do miejsc"]];
        return [["W/S/A/D", "miejsce"], ["O", "wybierz"], ["X", "zdejmij"], ["Tab", "obróć"], ["P", "wróć"]];
    };
    EquipView.prototype.cur = function() { return eqCells().find(c => c.id === this._cell) || eqCells()[0]; };
    EquipView.prototype.slotDef = function(id) { const E = T.api("Equipment"); return E ? E.SLOTS.find(s => s.id === (id || this._cell)) || {} : {}; };
    // what the chosen place can take from the bag (worn marked), and "Nic" (the right hand: the fists are among them)
    EquipView.prototype.makeRows = function() {
        const E = T.api("Equipment"), S = T.api("Survival"), slot = this._cell;
        if (!E) return [];
        const rows = E.choices(slot).map(c => Object.assign({ act: "on", weight: c.id && item(c.id) && S && S.itemWeight ? S.itemWeight(item(c.id)) : 0 }, c));
        if (slot !== "right") {
            const torch = slot === "left" && E.current("left") === E.TORCH;
            rows.push({ act: "off", id: 0, name: "Nic", icon: 0, note: torch ? "pochodnię wbijesz w ziemię" : BARE[slot] || "nic", worn: !E.current(slot), weight: 0 });
        }
        return rows;
    };
    // the look the figure shows: the row chosen in the list tried on (the thing's pattern on its place; "Nic" - that place bare)
    EquipView.prototype.previewOver = function() {
        if (this._mode !== "list") return null;
        const r = this._rows[this._row], place = SLOT_PLACE[this._cell], U = window.Ubior;
        if (!r || !place || !U || !U.itemLook) return null;
        if (r.act === "off") return { [place]: "" };
        const look = r.id ? U.itemLook(r.id) : null;
        return look ? { [look.miejsce || place]: look.wzor } : null;
    };
    EquipView.prototype.turnIndex = function() { return this._mode === "list" && this._cell === "back" ? 2 : this._dir; };   // (Plecy: from behind)
    EquipView.prototype.refresh = function() { this._mode = "cells"; this._note = ""; this.redraw(); };
    EquipView.prototype.leave = function() { this._mode = "cells"; this._note = ""; this._mx = undefined; };
    EquipView.prototype.cancel = function() {
        if (this._mode !== "list") return false;
        SoundManager.playCancel();
        this._mode = "cells";
        this.redraw();
        return true;
    };
    // the figure: the cell of his walking sheet (dressed live by Ubior.js, or the look tried on) copied 4 x into its own bitmap
    EquipView.prototype.updateFigure = function(force) {
        const s = this._fig, U = window.Ubior, HL = window.HeroLook, hero = !HL || !HL.active || HL.active(), row = TURN[this.turnIndex()][1], fp = figPlace(), S = FIG.size;
        const H0 = FIG.head * FIG.scale;   // (over the cell: the helmet's crown)
        s.x = fp.cx - S / 2;
        s.y = fp.top - H0;
        let src = null, key = "", srcBmp = null;
        const over = hero ? this.previewOver() : null;
        if (over && U && U.tryOn) {
            const pk = JSON.stringify(over);
            if (this._pv.key !== pk || !this._pv.ok) {
                const cv = U.tryOn("Hero_Walk", over);
                this._pv.key = pk;
                this._pv.ok = !!cv;
                this._pv.cv = cv;
            }
            if (this._pv.ok) { src = this._pv.cv; key = "p:" + pk; }
        }
        if (!src) {
            const name = hero ? "Hero_Walk" : $gamePlayer.characterName(), bmp = ImageManager.loadCharacter(name);
            if (!bmp.isReady()) { this._figKey = ""; return; }
            src = bmp._canvas || bmp._image;
            srcBmp = bmp;
            key = "l:" + name + ":" + (U && U.liveKey ? U.liveKey(name) : "") + ":" + (bmp._ubiorDressed ? 1 : 0);
            if (!hero) {   // (the old hero: his character's standing frame, as big as fits)
                const big = ImageManager.isBigCharacter(name), idx = $gamePlayer.characterIndex(), pw = bmp.width / (big ? 3 : 12), ph = bmp.height / (big ? 4 : 8);
                const sx = (big ? 0 : (idx % 4) * 3) * pw + pw, sy = (big ? 0 : Math.floor(idx / 4) * 4) * ph + [0, 1, 3, 2][this._dir] * ph;
                key += ":" + this._dir;
                if (!force && key === this._figKey) return;
                const b = s.bitmap, ctx = b.context, k = Math.min(S / pw, S / ph);
                b.clear();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(src, sx, sy, pw, ph, (S - pw * k) / 2, H0 + S - ph * k, pw * k, ph * k);
                done(b);
                this._figKey = key;
                return;
            }
        }
        key += ":" + row;
        if (!force && key === this._figKey) return;
        const b = s.bitmap, ctx = b.context;
        b.clear();
        ctx.imageSmoothingEnabled = false;
        // (with what is over his head: Ubior.cellWithHead - the cell and the strip over it)
        const whole = src && U && U.cellWithHead ? U.cellWithHead(srcBmp || src, "Hero_Walk", 0, row) : null;
        if (whole) ctx.drawImage(whole, 0, 0, whole.width, whole.height, 0, H0 - (whole.height - 64) * FIG.scale, S, whole.height * FIG.scale);
        else if (src) ctx.drawImage(src, 0, row * 64, 64, 64, 0, H0, S, S);
        done(b);
        this._figKey = key;
    };
    EquipView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX(), E = T.api("Equipment");
        b.clear();
        const list = this._mode === "list";
        header(b, "Ekwipunek", list ? "podgląd: tak będziesz wyglądać" : "działa tylko to, co założone");
        if (!E) { tx(b, "Ekwipunek się wczytuje...", R.lx, R.y0 + 130, 21, { top: true, color: K.muted }); done(b); return; }
        const slots = {};
        for (const sl of E.slots()) slots[sl.id] = sl;
        this._slots = slots;
        if (list) this._rows = this.makeRows();
        const row = list ? this._rows[this._row] : null, focus = this.inside && !list;
        // ---- the two grids
        const cells = eqCells(), gy = R.y0 + EQ.gy, gxR = R.rx - (2 * EQ.cell + 16);
        tx(b, "UBIÓR", R.lx, gy - 34, 20, { top: true, face: "sc", color: K.acc });
        tx(b, "OKRYCIE I RĘCE", gxR + 2 * EQ.cell + 16, gy - 34, 20, { top: true, face: "sc", color: K.acc, align: "right" });
        for (const c of cells) {
            const sl = slots[c.id] || {}, on = c.id === this._cell, has = !!sl.icon && !(c.id === "right" && sl.hand === "m0");
            const fill = on ? (focus ? K.acc : this.inside || list ? K.accDim : K.accDim) : has ? K.cell : K.empty;
            rr(ctx, c.x, c.y, EQ.cell, EQ.cell, 11, fill);
            const tryIcon = on && row && row.icon && !row.worn ? row.icon : 0;
            if (tryIcon) CH.drawIcon(b, tryIcon, c.x + 4, c.y + 4, 64, null, 0.55);   // (the thing being chosen, on trial)
            else if (has) CH.drawIcon(b, sl.icon, c.x + 4, c.y + 4, 64);
            else if (on && row && row.act === "off") { /* ("Nic": the place stays empty) */ }
            else tx(b, "–", c.x + EQ.cell / 2, c.y + EQ.cell / 2, 26, { align: "center", color: on && focus ? K.sel : K.dim });
            tx(b, sl.label || c.id, c.x + EQ.cell / 2, c.y + EQ.cell + 12, 19, { align: "center", face: on ? "bold" : null, color: on ? K.acc : has ? K.text : K.muted });
        }
        // ---- the figure, its shadow, the turn's dots (and, among the places, its word)
        const fp = figPlace(), feet = fp.top + FIG.feet * FIG.scale;
        rr(ctx, fp.cx - 72, feet - 6, 144, 18, 9, "rgba(0,0,0,0.35)");
        this.updateFigure(true);
        const ti = this.turnIndex(), py = feet + 28;
        for (let k = 0; k < 4; k++) rr(ctx, fp.cx - 33 + k * 22 - 5, py - 5, 10, 10, 5, k === ti ? K.acc : "rgb(70,72,78)");
        if (!list) tx(b, TURN[ti][0], fp.cx, py + 22, 19, { align: "center", color: K.muted });
        // ---- the band RAZEM at the foot and the bubble of the chosen place; or the list of what fits it with the chosen thing's bubble
        this._bubble = null;
        if (list) this.drawRows(b, py + 30);
        else {
            this.drawTotals(b, R.y1 - EQB.band);
            if (this.inside) this._bubble = this.drawSlotBubble(b, slots[this._cell] || {});
        }
        done(b);
    };
    // what a thing is and does, for its bubble: [{ t: text, c: colour, f: face, s: size }] lines, the wear, the weight
    EquipView.prototype.thingWords = function(id, sl, row, bw) {
        const D = T.api("Durability"), S = T.api("Survival"), it = id ? item(id) : null, iw = (bw || EQB.w) - 32, out = [];
        const desc = it ? String(it.description || "").replace(/\s+/g, " ").trim() : sl && sl.hand === "m0" ? "Gołe pięści: szybkie, ale słabe. Broń wybierasz też w trybie walki ([ ])." : "";
        for (const line of wrapWords(desc, 17, iw, "regular").slice(0, 4)) out.push({ t: line, c: K.soft, f: "regular", s: 17 });
        const does = cap1(row ? row.note || "" : (sl && sl.note) || "");
        if (does) for (const line of wrapWords(does, 18, iw).slice(0, 3)) out.push({ t: line, c: K.good, s: 18 });
        let wear = null;
        if (id && D && D.TOOLS && D.TOOLS[id] && D.lifeOf) {
            const left = Math.max(0, Math.round(D.left(id))), life = D.lifeOf(id), unit = D.TOOLS[id].unit === "wear" ? "dni" : D.unitWord ? D.unitWord(id, left) : "";
            wear = { left, life, text: left + " / " + life + (unit ? " " + unit : "") };
        }
        const weight = it && S && S.itemWeight ? S.itemWeight(it) : 0;
        return { lines: out, wear, weight };
    };
    // the bubble: a caption, the icon and the name, the lines, the wear (a bar) and the weight; o: { x, w, arrow, place (y) }
    function thingBubble(b, o, cap, icon, name, words, note) {
        const ctx = b.context, pad = 16, iw = o.w - pad * 2;
        const lines = words.lines.slice(), noteLines = note ? wrapWords(note, 18, iw).slice(0, 2) : [];
        const h = pad + 22 + 38 + lines.reduce((a, l) => a + (l.s || 18) + 5, 0) + (words.wear ? 42 : 0) + (words.weight ? 26 : 0) + noteLines.length * 23 + pad - 2;
        const y = o.place(h), x = o.x;
        bubble(ctx, x, y, o.w, h, o.arrow(y, h));
        let yy = y + pad;
        tx(b, cap, x + pad, yy, 16, { top: true, face: "sc", color: K.acc, max: iw });
        yy += 22;
        if (icon) CH.drawIcon(b, icon, x + pad, yy, 32);
        tx(b, name, x + pad + (icon ? 42 : 0), yy + 16, 22, { face: "bold", color: icon ? K.text : K.muted, max: iw - (icon ? 42 : 0) });
        yy += 38;
        for (const l of lines) { tx(b, l.t, x + pad, yy, l.s || 18, { top: true, face: l.f || null, color: l.c || K.text }); yy += (l.s || 18) + 5; }
        if (words.wear) {
            yy += 4;
            tx(b, "Zużycie", x + pad, yy, 17, { top: true, color: K.muted });
            tx(b, words.wear.text, x + o.w - pad, yy, 17, { top: true, face: "bold", align: "right" });
            const r = words.wear.left / Math.max(1, words.wear.life);
            meter(ctx, x + pad, yy + 24, iw, 6, r, r > 0.5 ? K.good : r > 0.2 ? K.amber : K.warn);
            yy += 38;
        }
        if (words.weight) {
            tx(b, "Waga", x + pad, yy, 17, { top: true, color: K.muted });
            tx(b, weightTxt(words.weight), x + o.w - pad, yy, 17, { top: true, face: "bold", align: "right" });
            yy += 26;
        }
        for (const l of noteLines) { tx(b, l, x + pad, yy, 18, { top: true, color: K.warn }); yy += 23; }
        return { x, y, w: o.w, h, title: name, lines: lines.map(l => l.t), wear: words.wear ? words.wear.text : "", weight: words.weight || 0, note: note || "" };
    }
    // the chosen place's bubble: beside its cell, between its grid and the hero (on a narrow panel: under the cell, above it at the
    // foot, on the grid's outer side) - the hero stays clear
    EquipView.prototype.drawSlotBubble = function(b, sl) {
        const R = RX(), c = this.cur(), E = T.api("Equipment"), slot = this._cell, hand = slot === "right" || slot === "left";
        const fp = figPlace(), body = 84, gl = R.lx + 2 * EQ.cell + 16, gxR = R.rx - (2 * EQ.cell + 16), bottomMax = R.y1 - EQB.band - 8;
        const sideW = Math.min(EQB.w, c.g === 0 ? fp.cx - body - 12 - (gl + 14) : gxR - 14 - (fp.cx + body + 12));
        const has = !!sl.name, id = sl.item || 0, bw = sideW >= 250 ? sideW : EQB.w;
        let words;
        if (has) words = this.thingWords(id, sl, null, bw);
        else {
            const own = E ? E.choices(slot).filter(ch => !ch.worn).map(ch => ch.name) : [];
            const hint = own.length ? "W torbie: " + own.join(", ") + ". O: wybierz." : cap1(String(sl.note || "").replace(/Enter/g, "O")) || "Nic tu nie masz.";
            const more = !own.length ? String(T.call("Ubior_Data", "podpowiedz", slot) || "") : "";
            const lines = wrapWords(hint, 18, bw - 32).slice(0, 3).map(t => ({ t, c: own.length ? K.soft : K.muted }));
            for (const t of wrapWords(more, 17, bw - 32, "regular").slice(0, 3)) lines.push({ t, c: K.muted, f: "regular", s: 17 });
            words = { lines, wear: null, weight: 0 };
        }
        const cap = (sl.label || "").toUpperCase() + "  ·  " + (has ? (hand ? "W RĘCE" : "NA SOBIE") : "PUSTO");
        const name = has ? sl.name : "pusto", icon = sl.icon || 0;
        if (sideW >= 250) {   // (beside the cell, the arrow at its middle)
            const x = c.g === 0 ? gl + 14 : gxR - 14 - sideW, cy = c.y + EQ.cell / 2;
            return thingBubble(b, { x, w: sideW, place: h => Math.max(R.y0 + 96, Math.min(bottomMax - h, Math.round(cy - h / 2))),
                arrow: () => ({ side: c.g === 0 ? "left" : "right", at: cy }) }, cap, icon, name, words, this._note);
        }
        const x = c.g === 0 ? R.lx - 8 : R.rx + 8 - EQB.w, ax = c.x + EQ.cell / 2;
        let below = true;
        return thingBubble(b, { x, w: EQB.w,
            place: h => { const yb = c.y + EQ.cell + 30; if (yb + h <= bottomMax) return yb; below = false; return Math.max(R.y0 + 96, c.y - 12 - h); },
            arrow: () => ({ side: below ? "up" : "down", at: ax }) }, cap, icon, name, words, this._note);
    };
    EquipView.prototype.drawTotals = function(b, y) {
        const ctx = b.context, R = RX(), lx = R.lx, rx = R.rx, items = totals();
        rr(ctx, lx - 8, y, rx - lx + 16, 50, 10, K.panel2);
        tx(b, "RAZEM", lx + 6, y + 25, 19, { face: "sc", color: K.acc });
        const widths = items.map(([a, v]) => measure(a, 20) + 8 + measure(v, 22, "bold"));
        let x = lx + 96;
        const gap = (rx - 10 - x - widths.reduce((s, w) => s + w, 0)) / (items.length - 1);
        items.forEach(([lab, val], i) => {
            tx(b, lab, x, y + 26, 20, { color: K.muted });
            tx(b, val, x + measure(lab, 20) + 8, y + 26, 22, { face: "bold", color: val === "brak" ? K.dim : K.text });
            x += widths[i] + gap;
        });
        this._totals = items;
    };
    // the list under the figure: what fits the chosen place (3 rows seen, more scroll); the chosen thing's bubble over the other grid
    // (the one the chosen place is not in), its arrow down to the list
    const EQL = { vis: 3, row: 36, head: 30 };
    EquipView.prototype.drawRows = function(b, yl) {
        const ctx = b.context, R = RX(), lx = R.lx, rx = R.rx, rows = this._rows, label = (this.slotDef().label || "").toUpperCase();
        const more = rows.length > EQL.vis;
        this._listY = yl;
        heading(b, lx, yl, label + "  ·  Z TORBY", more ? rx - 80 : rx);
        const top = Math.max(0, Math.min(this._row - EQL.vis + 1, rows.length - EQL.vis));
        this._rowTop = top;
        if (more) tx(b, (top + 1) + "–" + Math.min(rows.length, top + EQL.vis) + " z " + rows.length, rx, yl, 17, { top: true, align: "right", color: K.muted });
        rows.slice(top, top + EQL.vis).forEach((r, k) => {
            const i = top + k, y = yl + EQL.head + k * EQL.row, on = i === this._row, cy = y + 17;
            if (on) rr(ctx, lx - 8, y, rx - lx + 16, 34, 8, K.acc);
            if (r.icon) CH.drawIcon(b, r.icon, lx, y + 1, 32);
            else tx(b, "–", lx + 16, cy, 24, { align: "center", color: on ? K.sel : K.dim });
            tx(b, r.name, lx + 44, cy, 21, { face: "bold", color: on ? K.sel : K.text, max: 300 });
            const note = (r.worn && r.act !== "off" ? "założone · " : "") + (r.note || "");
            tx(b, note, lx + 360, cy, 19, { color: on ? K.selMuted : K.muted, max: rx - 90 - (lx + 360) });
            if (r.weight) tx(b, "waga " + weightTxt(r.weight), rx, cy, 19, { align: "right", color: on ? K.selMuted : K.muted });
        });
        const r = rows[this._row];
        if (!r || !this.inside) return;
        const c = this.cur(), x = c.g === 0 ? R.rx + 8 - EQB.w : R.lx - 8;
        const words = r.act === "off" ? { lines: [{ t: cap1(r.note || ""), c: K.soft }], wear: null, weight: 0 } : this.thingWords(r.id, null, r);
        const cap = label + "  ·  " + (r.act === "off" ? "NIC" : r.worn ? "NA SOBIE" : "Z TORBY");
        this._bubble = thingBubble(b, { x, w: EQB.w, place: h => Math.max(R.y0 + 96, yl - 14 - h),
            arrow: () => ({ side: "down", at: c.g === 0 ? x + EQB.w - 60 : x + 60 }) }, cap, r.icon || 0, r.name, words, this._note);
    };
    EquipView.prototype.update = function() {
        if (this.root.visible && (Graphics.frameCount % 6 === 0 || !this._figKey)) this.updateFigure(false);
        if (!this.ready()) return;
        if (this.mouseMoved() && this._mode === "cells") {
            const p = touchAt(), c = this.cellAt(p.x, p.y);
            if (c && c.id !== this._cell) { this._cell = c.id; this._note = ""; this.redraw(); }
        }
        if (this._mode === "list") {
            const n = this._rows.length;
            if (n && (Input.isRepeated("down") || Input.isRepeated("up"))) {
                this._row = (this._row + (Input.isRepeated("down") ? 1 : n - 1)) % n;
                SoundManager.playCursor();
                this.redraw();
            } else if (Input.isTriggered("ok")) this.choose();
            return;
        }
        for (const [k, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
            if (Input.isRepeated(k)) { this.move(dx, dy); return; }
        }
        if (Input.isTriggered("ok")) this.openList();
        else if (Input.isTriggered("takeOff")) this.takeOff();
        else if (Input.isTriggered("tab")) this.turn();
    };
    EquipView.prototype.cellAt = function(x, y) { return eqCells().find(c => x >= c.x - 6 && x <= c.x + EQ.cell + 6 && y >= c.y - 4 && y <= c.y + EQ.cell + 24) || null; };
    // W / S in the grid's column, A / D across it - and from one grid to the other on the same row
    EquipView.prototype.move = function(dx, dy) {
        const cells = eqCells(), cur = this.cur();
        let to = null;
        if (dy) to = cells.find(c => c.g === cur.g && c.c === cur.c && c.r === cur.r + dy);
        else {
            let g = cur.g, c = cur.c + dx;
            if (c > 1) { g++; c = 0; } else if (c < 0) { g--; c = 1; }
            if (g === 0 || g === 1) to = cells.find(x => x.g === g && x.c === c && x.r === cur.r);
        }
        if (!to) return;
        this._cell = to.id;
        this._note = "";
        SoundManager.playCursor();
        this.redraw();
    };
    EquipView.prototype.turn = function() {
        this._dir = (this._dir + 1) % TURN.length;
        SoundManager.playCursor();
        this.redraw();
    };
    EquipView.prototype.openList = function() {
        const E = T.api("Equipment"), rows = this.makeRows(), things = rows.filter(r => r.act !== "off");
        if (!E || (!things.length && !E.current(this._cell))) {
            SoundManager.playBuzzer();
            const def = this.slotDef();
            this._note = def.items && !def.items.length && !def.hand ? "W grze nie ma jeszcze nic na tę część ciała." : "Nie masz w torbie nic, co tu pasuje.";
            this.redraw();
            return;
        }
        SoundManager.playOk();
        this._mode = "list";
        this._rows = rows;
        const worn = rows.findIndex(r => r.worn && r.act !== "off");
        this._row = worn >= 0 ? worn : 0;
        this._note = "";
        this.redraw();
        this.scene.drawKeys();
    };
    EquipView.prototype.choose = function() {
        const E = T.api("Equipment"), r = this._rows[this._row], slot = this._cell;
        if (!r || !E) { SoundManager.playBuzzer(); return; }
        let ok = true;
        if (r.act === "off") ok = E.current(slot) ? E.unequip(slot) : true;
        else if (!r.worn) ok = E.equip(slot, r.id, r.hand);
        if (ok) { if (!r.worn || r.act === "off") SoundManager.playEquip(); else SoundManager.playOk(); this._note = ""; }
        else { SoundManager.playBuzzer(); this._note = "Tego nie da się teraz założyć."; }
        this._mode = "cells";
        this.redraw();
        this.scene.drawKeys();
    };
    // X: what is on the chosen place comes off (the right hand: back to the fists)
    EquipView.prototype.takeOff = function() {
        const E = T.api("Equipment"), slot = this._cell, now = E ? E.current(slot) : 0;
        if (E && now && E.unequip(slot)) { SoundManager.playEquip(); this._note = ""; }
        else { SoundManager.playBuzzer(); this._note = "Tu nic nie ma do zdjęcia."; }
        this.redraw();
    };
    EquipView.prototype.touch = function(x, y) {
        const R = RX(), yl = this._listY || 0;
        if (this._mode === "list") {
            const k = Math.floor((y - (yl + EQL.head)) / EQL.row), i = (this._rowTop || 0) + k;
            if (x >= R.lx - 8 && x <= R.rx + 8 && k >= 0 && k < EQL.vis && i < this._rows.length) {
                if (i === this._row) this.choose(); else { this._row = i; SoundManager.playCursor(); this.redraw(); }
                return;
            }
            const c = this.cellAt(x, y);
            if (c) { this._mode = "cells"; this._cell = c.id; SoundManager.playCancel(); this.redraw(); this.scene.drawKeys(); }
            return;
        }
        const c = this.cellAt(x, y);
        if (c) {
            if (c.id === this._cell) this.openList();
            else { this._cell = c.id; this._note = ""; SoundManager.playCursor(); this.redraw(); }
            return;
        }
        const fp = figPlace();
        if (x >= fp.cx - 100 && x <= fp.cx + 100 && y >= fp.top && y <= fp.top + FIG.size) this.turn();   // (a click on the figure turns him)
    };
    EquipView.prototype.info = function() {
        const E = T.api("Equipment");
        return { equip: { cell: this._cell, mode: this._mode, row: this._row, note: this._note, dir: this._dir, turn: TURN[this.turnIndex()][0],
            rows: this._mode === "list" ? this._rows.map(r => ({ act: r.act, id: r.id, name: r.name, worn: !!r.worn, weight: r.weight || 0 })) : [],
            preview: this.previewOver(), figKey: this._figKey, totals: (this._totals || []).map(t => t.join(": ")), bubble: this._bubble || null,
            list: this._mode === "list" ? { y: (this._listY || 0) + EQL.head, row: EQL.row, top: this._rowTop || 0, x: RX().lx + 200 } : null,
            slots: E ? E.slots().map(x => ({ id: x.id, item: x.item, name: x.name, none: x.none })) : null, cells: eqCells().map(c => c.id) } };
    };

    // ==================================================================
    // Umiejętności (the user, 2026-10-23: "umiejętności bym zrobił drzewko jak w oryginalnym podejściu" - Combat_UI's Window_SkillTree,
    // the old Postać -> Umiejętności): the fields' row in the head strip (A / D), the chosen field's tree - boxes in rows by the level
    // they ask ("poz. 1 / 4 / 10..." on the left), joined by the lines of what opens what -, the words on the right. Two steps, O in and
    // P back: O from the tabs - the fields' row has the keys (the tree a preview, the words about the field); O again - into the tree
    // (W / S / A / D along the boxes, O learns after a question); P - back to the fields' row; P again - back to the tabs.
    // A box: yellow filled - known (at the top rank), dark yellow with a yellow edge - learnt in part, a yellow edge - can be learnt, dim -
    // closed; its small bars are the ranks. The rows, the columns and the boxes come from the trees' data (Combat.SKILLS / TREES).
    // ==================================================================
    function skillState(Cb, s) {
        const rank = Cb.skillRank(s.id), block = Cb.skillBlock(s.id);
        if (rank >= s.ranks) return "full";
        if (rank > 0) return "part";
        return !block || block === "Brak punktów umiejętności." ? "open" : "locked";
    }
    const SKT = { label: 56, padX: 16, nodeH: 56 };
    function SkillsView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._tree = 0;
        this._zone = "fields";
        this._node = 0;
        this._last = {};   // (the box chosen last in each field)
        this._ask = null;
        this._tabBoxes = null;
    }
    SkillsView.prototype = Object.create(View.prototype);
    SkillsView.prototype.constructor = SkillsView;
    SkillsView.prototype.trees = function() { const Cb = T.api("Combat"); return Cb && Cb.TREES ? Cb.TREES : []; };
    SkillsView.prototype.list = function() {
        const Cb = T.api("Combat"), t = this.trees()[this._tree];
        if (!Cb || !t) return [];
        return Cb.SKILLS.filter(s => s.tree === t.id).slice().sort((a, b) => a.row - b.row || a.col - b.col);
    };
    // the grid every tree shares (the most rows and columns of all), so a field's tree never jumps in size
    SkillsView.prototype.grid = function() {
        const Cb = T.api("Combat"), all = Cb && Cb.SKILLS ? Cb.SKILLS : [];
        const rows = Math.max(1, (Cb && Cb.ROW_LEVEL ? Cb.ROW_LEVEL.length : 0), ...all.map(s => s.row + 1));
        return { rows, cols: Math.max(1, ...all.map(s => s.col + 1)) };
    };
    // the places: the tree on the left (56% of the page), the words on the right
    SkillsView.prototype.geom = function() {
        const R = RX(), tw = Math.round((R.rx - R.lx) * 0.56), top = R.y0 + 100, dx = R.lx + tw + 34;
        return { x0: R.lx, w: tw, top, h: R.y1 - 14 - top, dx, dw: R.rx - dx };
    };
    SkillsView.prototype.cell = function(g, row, col) {
        const G = this.grid(), pitchX = (g.w - SKT.label) / G.cols, pitchY = g.h / G.rows;
        const w = Math.round(Math.min(126, pitchX - SKT.padX)), h = Math.round(Math.min(SKT.nodeH, pitchY - 18));
        return { x: Math.round(g.x0 + SKT.label + col * pitchX + (pitchX - w) / 2), y: Math.round(g.top + row * pitchY + (pitchY - h) / 2), w, h };
    };
    SkillsView.prototype.keys = function() {
        if (this._ask) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", "nie"]];
        if (this._zone === "tree") return [["W/S/A/D", "umiejętność"], ["O", "naucz się"], ["P", "wróć"]];
        return [["A/D", "dziedzina"], ["O", "drzewko"], ["P", "wróć"]];
    };
    SkillsView.prototype.enter = function() { this._zone = "fields"; this._ask = null; View.prototype.enter.call(this); };
    SkillsView.prototype.leave = function() { this._ask = null; this._zone = "fields"; this._mx = undefined; };
    // P: the question first, then out of the tree onto the fields' row; on the row - not here (back to the tabs)
    SkillsView.prototype.cancel = function() {
        if (this._ask) { SoundManager.playCancel(); this._ask = null; this.redraw(); return true; }
        if (this._zone === "tree") {
            SoundManager.playCancel();
            this._last[this._tree] = this._node;
            this._zone = "fields";
            this.redraw();
            return true;
        }
        return false;
    };
    SkillsView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX(), Cb = T.api("Combat"), trees = this.trees(), t = trees[this._tree];
        b.clear();
        header(b, null);   // (the head strip: the fields' row - the page's own, no second row of the frame)
        if (!Cb || !t) { tx(b, "Drzewka umiejętności nie są dostępne.", R.lx, R.y0 + 130, 21, { top: true, color: K.muted }); done(b); return; }
        const h = Cb.hero(), pw = measure("Punkty: " + h.skillPoints, 19, "bold") + 30;
        this._tabBoxes = tabStrip(b, trees.map(x => x.name), this._tree, R.lx - 6, R.rx - pw, R.y0 + STRIP_TOP, this._tabScroll || (this._tabScroll = {}));
        tx(b, "Punkty: " + h.skillPoints, R.rx, R.y0 + 55, 19, { top: true, face: "bold", align: "right", color: h.skillPoints > 0 ? K.acc : K.muted });
        const g = this.geom(), list = this.list();
        this._node = Math.max(0, Math.min(this._node, list.length - 1));
        this.drawTree(b, g, list);
        vl(ctx, g.dx - 17, R.y0 + 108, R.y1 - 24);
        const sk = this._zone === "tree" ? list[this._node] : null;
        if (sk) this.drawDetail(b, sk, t, g); else this.drawField(b, t, g, list);
        if (this._ask && sk) this.drawAsk(b, sk, g);
        done(b);
    };
    SkillsView.prototype.drawTree = function(b, g, list) {
        const ctx = b.context, Cb = T.api("Combat"), h = Cb.hero(), G = this.grid(), focus = this.inside && this._zone === "tree";
        // the level each row asks, on the left
        for (let r = 0; r < G.rows; r++) {
            const c = this.cell(g, r, 0), cy = c.y + c.h / 2, lv = (Cb.ROW_LEVEL && Cb.ROW_LEVEL[r]) || 1, ok = h.level >= lv;
            tx(b, "poz.", g.x0 + SKT.label - 12, cy - 10, 16, { align: "right", color: ok ? K.muted : "#8a5a52" });
            tx(b, String(lv), g.x0 + SKT.label - 12, cy + 9, 18, { align: "right", face: "bold", color: ok ? K.text : "#c47a6e" });
        }
        // the lines from what opens to what is opened (right angles, the turn just above the box it leads to)
        const r0 = this.cell(g, 0, 0), r1 = this.cell(g, Math.min(1, G.rows - 1), 0), half = Math.max(4, Math.round((r1.y - (r0.y + r0.h)) / 2));
        ctx.save();
        ctx.lineWidth = 2;
        for (const s of list) {
            for (const f of s.from || []) {
                const p = list.find(n => n.id === f);
                if (!p) continue;
                const a = this.cell(g, p.row, p.col), c = this.cell(g, s.row, s.col), open = Cb.skillRank(f) > 0;
                ctx.strokeStyle = open && Cb.skillRank(s.id) > 0 ? K.acc : open ? "rgba(236,230,218,0.55)" : "rgba(90,95,105,0.75)";
                const x1 = Math.round(a.x + a.w / 2) + 0.5, y1 = a.y + a.h, x2 = Math.round(c.x + c.w / 2) + 0.5, my = c.y - half + 0.5;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, my); ctx.lineTo(x2, my); ctx.lineTo(x2, c.y); ctx.stroke();
            }
        }
        ctx.restore();
        // the boxes
        this._cells = [];
        list.forEach((s, i) => {
            const c = this.cell(g, s.row, s.col), st = skillState(Cb, s), rank = Cb.skillRank(s.id), on = focus && i === this._node;
            if (on) { ctx.save(); ctx.strokeStyle = K.cap; ctx.lineWidth = 3; CH.roundPath(ctx, c.x - 4.5, c.y - 4.5, c.w + 9, c.h + 9, 11); ctx.stroke(); ctx.restore(); }
            rr(ctx, c.x, c.y, c.w, c.h, 8, st === "full" ? K.acc : st === "part" ? K.accDim : st === "open" ? K.cell : K.empty);
            if (st !== "full") {
                ctx.save();
                ctx.strokeStyle = st === "locked" ? K.line : K.acc;
                ctx.lineWidth = st === "open" ? 2 : st === "part" ? 1.5 : 1;
                CH.roundPath(ctx, c.x + 0.75, c.y + 0.75, c.w - 1.5, c.h - 1.5, 8);
                ctx.stroke();
                ctx.restore();
            }
            const ink = st === "full" ? K.sel : st === "locked" ? K.dim : K.text, lines = wrapWords(s.name, 16, c.w - 8).slice(0, 2);
            const ty = c.y + (c.h - 8) / 2 - (lines.length - 1) * 8.5;
            lines.forEach((line, k) => tx(b, line, c.x + c.w / 2, ty + k * 17, 16, { align: "center", face: on ? "bold" : null, color: ink, max: c.w - 6 }));
            const pw = 9, gap = 3, total = s.ranks * pw + (s.ranks - 1) * gap, px = c.x + Math.round((c.w - total) / 2), py = c.y + c.h - 8;
            for (let k = 0; k < s.ranks; k++) {
                ctx.fillStyle = k < rank ? (st === "full" ? K.sel : K.acc) : st === "locked" ? "#2a2d33" : "#4a4e57";
                ctx.fillRect(px + k * (pw + gap), py, pw, 4);
            }
            this._cells.push({ i, id: s.id, x0: c.x, x1: c.x + c.w, y0: c.y, y1: c.y + c.h });
        });
    };
    // the words of the field (on the fields' row): its name, the ranks taken, what it is about, what is known in it
    SkillsView.prototype.drawField = function(b, t, g, list) {
        const R = RX(), Cb = T.api("Combat"), dx = g.dx, dw = g.dw, trees = this.trees();
        const spent = list.reduce((a, s) => a + Cb.skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
        tx(b, "DZIEDZINA " + (this._tree + 1) + " Z " + trees.length, dx, R.y0 + 110, 18, { top: true, face: "sc", color: K.acc });
        tx(b, t.name, dx, R.y0 + 134, 28, { top: true, face: "bold", max: dw });
        tx(b, "stopni " + spent + " / " + total, dx, R.y0 + 172, 19, { top: true, color: K.muted });
        let y = R.y0 + 208;
        for (const line of wrapWords(t.desc || "", 20, dw, "regular").slice(0, 5)) { tx(b, line, dx, y, 20, { top: true, face: "regular" }); y += 27; }
        y += 14;
        heading(b, dx, y, "UMIESZ", dx + dw);
        y += 32;
        const known = list.filter(s => Cb.skillRank(s.id) > 0);
        if (!known.length) { tx(b, "Jeszcze nic z tej dziedziny.", dx, y, 19, { top: true, color: K.muted }); y += 28; }
        for (const s of known.slice(0, 6)) {
            tx(b, s.name, dx, y, 19, { top: true, color: K.acc, max: dw - 60 });
            tx(b, s.ranks > 1 ? Cb.skillRank(s.id) + "/" + s.ranks : "znasz", dx + dw, y, 19, { top: true, align: "right", color: K.muted });
            y += 27;
        }
        const open = list.filter(s => !Cb.skillBlock(s.id) && Cb.skillRank(s.id) < s.ranks).length;
        tx(b, open ? "Możesz się teraz nauczyć: " + open + "." : "Teraz nic tu do nauki.", dx, R.y1 - 70, 19, { top: true, color: open ? K.acc : K.muted, max: dw });
        if (this.inside) tx(b, "O: wejdź w drzewko", dx, R.y1 - 42, 19, { top: true, face: "bold", color: K.soft });
    };
    // the words of the chosen box: its name, its rank, what it does now and at the next rank, what it asks (✓ / ×)
    SkillsView.prototype.drawDetail = function(b, sk, t, g) {
        const ctx = b.context, R = RX(), Cb = T.api("Combat"), h = Cb.hero(), dx = g.dx, dw = g.dw;
        const rank = Cb.skillRank(sk.id), st = skillState(Cb, sk), full = rank >= sk.ranks, lv = (Cb.ROW_LEVEL && Cb.ROW_LEVEL[sk.row]) || 1, block = Cb.skillBlock(sk.id);
        const word = st === "full" ? (sk.ranks > 1 ? "stopień " + rank + " z " + sk.ranks : "znasz") : st === "part" ? "stopień " + rank + " z " + sk.ranks : st === "open" ? "do nauki" : "zamknięta";
        tx(b, (t.name + "  ·  " + word).toUpperCase(), dx, R.y0 + 110, 18, { top: true, face: "sc", color: K.acc, max: dw });
        let y = R.y0 + 134;
        wrapWords(sk.name, 26, dw, "bold").slice(0, 2).forEach(line => { tx(b, line, dx, y, 26, { top: true, face: "bold" }); y += 30; });
        y += 10;
        const para = (text, col, max) => { for (const line of wrapWords(text, 20, dw, "regular").slice(0, max || 6)) { tx(b, line, dx, y, 20, { top: true, face: "regular", color: col || K.text }); y += 27; } };
        heading(b, dx, y, rank > 0 ? "TERAZ" : sk.ranks > 1 ? "PIERWSZY STOPIEŃ" : "CO DAJE", dx + dw);
        y += 30;
        para(Cb.skillText(sk, Math.max(1, rank)), K.text, 5);
        if (rank > 0 && !full) {
            y += 8;
            heading(b, dx, y, "NASTĘPNY STOPIEŃ", dx + dw);
            y += 30;
            para(Cb.skillText(sk, rank + 1), K.acc, 3);
        }
        y += 10;
        if (y < R.y1 - 140) {
            heading(b, dx, y, "WYMAGANIA", dx + dw);
            y += 30;
            const rows = [];
            if (lv > 1) rows.push([h.level >= lv, "Poziom " + lv + " (masz " + h.level + ")"]);
            if (sk.from && sk.from.length) rows.push([sk.from.some(f => Cb.skillRank(f) > 0), "Najpierw: " + sk.from.map(f => (Cb.SKILLS.find(x => x.id === f) || { name: f }).name).join(" albo ")]);
            for (const a of Cb.ATTRS) if (sk.attr && sk.attr[a.id]) rows.push([(h.attr[a.id] || 0) >= sk.attr[a.id], a.name + " " + sk.attr[a.id] + " (masz " + (h.attr[a.id] || 0) + ")"]);
            if (!full) rows.push([h.skillPoints >= 1, "1 punkt umiejętności (masz " + h.skillPoints + ")"]);
            if (!rows.length) rows.push([true, "brak"]);
            for (const [ok, text] of rows) {
                if (y > R.y1 - 74) break;
                tick(ctx, dx + 2, y + 10, ok);
                tx(b, text, dx + 24, y + 10, 19, { color: ok ? K.text : K.muted, max: dw - 24 });
                y += 27;
            }
        }
        const hint = full ? (sk.ranks > 1 ? "Masz najwyższy stopień - działa zawsze." : "Znasz ją - działa zawsze, bez żadnego klawisza.")
            : block ? block : "O: " + (rank ? "następny stopień" : "naucz się") + " (1 punkt)";
        tx(b, hint, dx, R.y1 - 42, 19, { top: true, face: full || !block ? "bold" : null, color: full || !block ? K.acc : K.muted, max: dw });
    };
    SkillsView.prototype.drawAsk = function(b, sk, g) {
        const ctx = b.context, R = RX(), dx = g.dx, dw = g.dw, Cb = T.api("Combat"), y = R.y1 - 176, rank = Cb.skillRank(sk.id);
        rr(ctx, dx - 16, y, dw + 32, 152, 12, "rgba(12,13,16,0.97)");
        const q = (rank ? "Następny stopień: " : "Nauczyć się: ") + sk.name + (sk.ranks > 1 ? " (" + (rank + 1) + "/" + sk.ranks + ")" : "") + "?";
        let yy = y + 16;
        wrapWords(q, 22, dw, "bold").slice(0, 2).forEach(line => { tx(b, line, dx, yy, 22, { top: true, face: "bold" }); yy += 27; });
        tx(b, "Kosztuje 1 punkt. Tego nie da się cofnąć.", dx, y + 74, 18, { top: true, color: K.muted, max: dw });
        const bw = (dw - 12) / 2;
        this._askBoxes = [];
        [["yes", "Tak"], ["no", "Nie"]].forEach(([act, lab], k) => {
            const bx = dx + k * (bw + 12), on = (act === "yes") === this._ask.yes;
            rr(ctx, bx, y + 104, bw, 36, 8, on ? K.acc : K.cell);
            tx(b, lab, bx + bw / 2, y + 122, 21, { face: "bold", align: "center", color: on ? K.sel : K.text });
            this._askBoxes.push({ act, x0: bx, x1: bx + bw, y0: y + 104, y1: y + 140 });
        });
    };
    SkillsView.prototype.changeTree = function(dir) {
        const n = this.trees().length;
        if (!n || !dir) return;
        if (this._zone === "tree") this._last[this._tree] = this._node;
        this._tree = ((this._tree + dir) % n + n) % n;
        this._zone = "fields";
        this._node = this._last[this._tree] || 0;
        SoundManager.playCursor();
        this.redraw();
        this.scene.drawKeys();
    };
    // O on the fields' row: into the tree (on the box chosen last there, else the first that can be learnt, else the first)
    SkillsView.prototype.enterTree = function(at) {
        const Cb = T.api("Combat"), list = this.list();
        if (!list.length) { SoundManager.playBuzzer(); return; }
        const learn = list.findIndex(s => !Cb.skillBlock(s.id) && Cb.skillRank(s.id) < s.ranks);
        this._node = at !== undefined ? at : this._last[this._tree] !== undefined ? this._last[this._tree] : Math.max(0, learn);
        this._zone = "tree";
        SoundManager.playOk();
        this.redraw();
        this.scene.drawKeys();
    };
    // W / S / A / D in the tree: the nearest box that way (the nearest row first going up / down, the nearest column going sideways)
    SkillsView.prototype.moveTo = function(dx, dy) {
        const list = this.list(), cur = list[this._node];
        if (!cur) return;
        let best = -1, bestD = Infinity;
        list.forEach((s, i) => {
            const ddx = s.col - cur.col, ddy = s.row - cur.row;
            if (i === this._node || (dx && Math.sign(ddx) !== dx) || (dy && Math.sign(ddy) !== dy)) return;
            const d = dx ? Math.abs(ddx) + Math.abs(ddy) * 3 : Math.abs(ddy) * 3 + Math.abs(ddx);
            if (d < bestD) { bestD = d; best = i; }
        });
        if (best < 0) return;
        this._node = best;
        SoundManager.playCursor();
        this.redraw();
    };
    SkillsView.prototype.update = function() {
        if (!this.ready()) return;
        if (this._ask) {
            if (Input.isRepeated("left") || Input.isRepeated("right")) { this._ask.yes = !this._ask.yes; SoundManager.playCursor(); this.redraw(); }
            else if (Input.isTriggered("ok")) this.answer(this._ask.yes);
            return;
        }
        if (this._zone === "fields") {
            if (Input.isRepeated("left")) this.changeTree(-1);
            else if (Input.isRepeated("right")) this.changeTree(1);
            else if (Input.isTriggered("ok")) this.enterTree();
            return;
        }
        if (this.mouseMoved()) { const p = touchAt(), k = this.nodeAt(p.x, p.y); if (k >= 0 && k !== this._node) { this._node = k; this.redraw(); } }
        for (const [k, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
            if (Input.isRepeated(k)) { this.moveTo(dx, dy); return; }
        }
        if (Input.isTriggered("ok")) this.askLearn();
    };
    SkillsView.prototype.nodeAt = function(x, y) { const q = (this._cells || []).find(c => inBox(c, x, y)); return q ? q.i : -1; };
    SkillsView.prototype.askLearn = function() {
        const Cb = T.api("Combat"), sk = this.list()[this._node];
        if (!Cb || !sk || Cb.skillBlock(sk.id) || Cb.skillRank(sk.id) >= sk.ranks) { SoundManager.playBuzzer(); return; }
        SoundManager.playOk();
        this._ask = { yes: true, id: sk.id };
        this.redraw();
        this.scene.drawKeys();
    };
    SkillsView.prototype.answer = function(yes) {
        const Cb = T.api("Combat"), sk = this.list()[this._node];
        this._ask = null;
        if (yes && sk) {
            const ok = !!Cb.learnSkill(sk.id);
            AudioManager.playSe({ name: ok ? "Up4" : "Buzzer1", volume: 70, pitch: ok ? 115 : 100, pan: 0 });
            this.scene.drawList();
        } else SoundManager.playCancel();
        this.redraw();
        this.scene.drawKeys();
    };
    // the mouse: a field's tab - that field; a box - chosen (from the fields' row: into the tree on it), clicked again - the question
    SkillsView.prototype.touch = function(x, y) {
        if (this._ask) { const q = (this._askBoxes || []).find(q => inBox(q, x, y)); if (q) this.answer(q.act === "yes"); return; }
        const tab = (this._tabBoxes || []).find(q => inBox(q, x, y));
        if (tab) { this.changeTree(tab.dir || tab.i - this._tree); return; }
        const k = this.nodeAt(x, y);
        if (k < 0) return;
        if (this._zone !== "tree") { this.enterTree(k); return; }
        if (k !== this._node) { this._node = k; SoundManager.playCursor(); this.redraw(); }
        else this.askLearn();
    };
    SkillsView.prototype.info = function() {
        const t = this.trees()[this._tree], list = this.list(), sk = this._zone === "tree" ? list[this._node] : null;
        return { skills: { tree: this._tree, treeId: t ? t.id : null, trees: this.trees().length, zone: this._zone, node: this._node, id: sk ? sk.id : null,
            count: list.length, ask: !!this._ask, cells: (this._cells || []).map(c => ({ i: c.i, id: c.id, x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 })) } };
    };

    // ==================================================================
    // Plecak (propozycja_1_lista_widok.png): one list with the groups' headings, the chosen thing's card; O uses, X throws out, Tab
    // the order
    // ==================================================================
    // The bag's order (the user, 2026-10-08): "Grupy" by default - Narzędzia i ubiór (what he wears / holds first), Jedzenie (what
    // spoils soonest first - Spoilage.js), Picie, Materiały (the most used in the recipes and the buildings first), Nasiona, Do zadań
    // (what the active quests ask for), Inne, Pamiątki - each group under its own heading; or "Nazwa", "Ilość", "Najnowsze" (what came
    // into the bag last first). Tab switches it; kept in the config (ConfigManager.bagSort).
    const SORTS = [["groups", "Grupy"], ["name", "Nazwa"], ["count", "Ilość"], ["new", "Najnowsze"]];
    if (ConfigManager.bagSort === undefined) ConfigManager.bagSort = "groups";
    const _cfgMake = ConfigManager.makeData;
    ConfigManager.makeData = function() { const c = _cfgMake.call(this); c.bagSort = this.bagSort || "groups"; return c; };
    const _cfgApply = ConfigManager.applyData;
    ConfigManager.applyData = function(c) { _cfgApply.call(this, c); this.bagSort = c && SORTS.some(s => s[0] === c.bagSort) ? c.bagSort : "groups"; };
    const bagSort = () => (SORTS.some(s => s[0] === ConfigManager.bagSort) ? ConfigManager.bagSort : "groups");
    // when each thing last came into the bag (for "Najnowsze")
    const bagNew = T.state.define("bagNew", () => ({ seq: 0, at: {} }), { version: 1, owner: PLUGIN });
    const _gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(it, amount, includeEquip) {
        _gainItem.call(this, it, amount, includeEquip);
        if (amount > 0 && it && DataManager.isItem(it) && window.$gameSystem && this === $gameParty) { const s = bagNew(); s.at[it.id] = ++s.seq; }
    };
    const GROUPS = [["tools", "Narzędzia i ubiór"], ["food", "Jedzenie"], ["drink", "Picie"], ["mat", "Materiały"], ["seed", "Nasiona"], ["quest", "Do zadań"], ["other", "Inne"], ["keep", "Pamiątki"]];
    const KIND_WORD = { tools: "Narzędzie", food: "Jedzenie", drink: "Picie", mat: "Materiał", seed: "Nasiona", quest: "Do zadania", other: "Rzecz", keep: "Pamiątka" };
    // the story's keepsakes (MenuPanel.isKeepsake: the tag <Pamiatka>, the prologue's pendant, a key item weighing nothing): their own group
    // at the end, never with the tools, never to wear
    const isKeep = it => { const mp = MP(); return !!(mp && mp.isKeepsake && mp.isKeepsake(it)); };
    const TOOL_LIKE = new Set([59, 127, 138, 141, 142, 144]);   // pochodnia, strzały, wiadro, kociołek, nożyce, szczypce (kept as items, used as tools)
    const DRINKS = new Set([81, 123, 137]);                      // piwo, mleko, miód pitny (and anything <Drink>: the waterskin)
    const isFoodItem = it => !!(it && it.meta && it.meta.Food !== undefined);
    const perishable = it => { const Sp = T.api("Spoilage"); return !!(Sp && Sp.isPerishable && Sp.isPerishable(it)); };
    let useCount = null;   // item id -> how many recipes and buildings take it
    function usesOf(id) {
        if (!useCount) {
            useCount = {};
            const add = list => { for (const [i] of list || []) useCount[i] = (useCount[i] || 0) + 1; };
            const F = T.api("Farming");
            if (F && F.BUILDINGS) for (const b of Object.values(F.BUILDINGS)) { add(b.cost); for (const r of b.recipes || []) add(r.inputs); }
            if (F && F.HAND_RECIPES) for (const r of F.HAND_RECIPES) add(r.inputs);
        }
        return useCount[id] || 0;
    }
    function groupOf(it, quest) {
        if (isKeep(it)) return "keep";
        const E = T.api("Equipment");
        if (it.itypeId === 2 || TOOL_LIKE.has(it.id) || (E && E.WEARABLE && E.WEARABLE[it.id])) return "tools";
        if ((it.meta && it.meta.Drink !== undefined) || DRINKS.has(it.id)) return "drink";
        if (isFoodItem(it) || perishable(it) || (it.meta && it.meta.Butcher !== undefined)) return "food";
        if (/^Nasiona/.test(it.name)) return "seed";
        if (quest && quest.has(it.id)) return "quest";
        if (it.itypeId === 1 && it.occasion === 3) return "mat";
        return "other";
    }
    const wornNow = id => { const E = T.api("Equipment"); return !!(E && E.worn && E.worn(id)); };
    // what of the bag can be put on from it (the user, 2026-10-23: "w plecaku też można wybrany przedmiot ekwipunku ... zakładać i
    // zdejmować"): the part it goes on - Equipment.WEARABLE (the clothes <Ubior:...>, the shield, the cloak, the boots, the backpack),
    // or the right hand for a weapon of the combat mode (Combat.handChoices, as in Ekwipunek); the torch stays the torch's own business
    function equipSlotOf(it) {
        const E = T.api("Equipment");
        if (!E || !it || !DataManager.isItem(it) || it.id === E.TORCH || isKeep(it)) return null;
        if (E.readNotes) E.readNotes();
        if (E.WEARABLE && E.WEARABLE[it.id]) return E.WEARABLE[it.id];
        const Cb = T.api("Combat"), hands = Cb && Cb.handChoices ? Cb.handChoices() : [];
        if (hands.includes("m" + it.id) || ((it.id === 125 || it.id === 126 || !!T.call("Bron", "isRanged", it.id)) && hands.includes("ranged"))) return "right";
        return null;
    }
    const slotLabel = slot => { const E = T.api("Equipment"), d = E && E.SLOTS ? E.SLOTS.find(s => s.id === slot) : null; return d ? d.label : String(slot || ""); };
    const wornWord = slot => (slot === "right" || slot === "left" ? "w ręce" : "założone");
    const WEAPON_RANK = id => { const F = T.api("Combat_parts"), o = F && F.fight ? F.fight.MELEE_ORDER : []; const k = o.indexOf(id); return k >= 0 ? k : id === 125 || id === 126 || id === 127 ? 20 : -1; };
    function hoursLeft(id) { const Sp = T.api("Spoilage"); const h = Sp && Sp.hoursLeft ? Sp.hoursLeft(id) : null; return h === null || h === undefined ? Infinity : h; }
    const byName = (a, b) => a.name.localeCompare(b.name, "pl");
    // tools first, then the weapons, the arrows, then what is worn (the clothes, the shield)
    function kindRank(it) {
        const E = T.api("Equipment");
        if (E && E.WEARABLE && E.WEARABLE[it.id]) return 3;
        if (it.id === 127) return 2;
        return WEAPON_RANK(it.id) >= 0 ? 1 : 0;
    }
    // the sorted list: { data (items), heads: [{ key, label, index, count }] }; cols > 1: a group starts a row of its own (null places)
    function sortBag(items, mode, quest, cols) {
        items = items.filter(Boolean);
        cols = cols || 1;
        if (mode === "name") return { data: items.sort(byName), heads: [] };
        if (mode === "count") return { data: items.sort((a, b) => $gameParty.numItems(b) - $gameParty.numItems(a) || byName(a, b)), heads: [] };
        if (mode === "new") { const at = bagNew().at; return { data: items.sort((a, b) => (at[b.id] || 0) - (at[a.id] || 0) || b.id - a.id), heads: [] }; }
        const by = {};
        for (const it of items) (by[groupOf(it, quest)] = by[groupOf(it, quest)] || []).push(it);
        const order = {
            tools: (a, b) => (wornNow(b.id) - wornNow(a.id)) || (kindRank(a) - kindRank(b)) || (WEAPON_RANK(a.id) - WEAPON_RANK(b.id)) || a.id - b.id,
            food: (a, b) => (hoursLeft(a.id) - hoursLeft(b.id)) || a.id - b.id,
            mat: (a, b) => (usesOf(b.id) - usesOf(a.id)) || a.id - b.id,
            quest: byName,
            keep: byName
        };
        const data = [], heads = [];
        for (const [key, label] of GROUPS) {
            const list = by[key];
            if (!list || !list.length) continue;
            list.sort(order[key] || ((a, b) => a.id - b.id));
            while (data.length % cols) data.push(null);
            heads.push({ key, label, index: data.length, count: list.length });
            data.push(...list);
        }
        return { data, heads };
    }
    const questIds = () => { const mp = MP(); return mp && mp.questNeeds ? mp.questNeeds() : new Set(); };
    // the bag's list: a row a thing, a heading over each group's first row; the rects, the scroll, the mouse and the arrows all go by
    // that layout
    const BAGL = { head: 34, gap: 8, row: 42 };
    // the bag's and the save files' page: the list window's width, the line after it, the card's left edge (from the panel's left)
    const BAGW = { list: 520, line: 544, card: 572 };
    function groupedList(list) {
        list.maxCols = () => 1;
        list.colSpacing = () => 0;
        list.rowSpacing = () => 0;
        list.itemHeight = () => BAGL.row;
        const make = list.makeItemList;
        list.makeItemList = function() {
            make.call(this);
            const s = sortBag(this._data, bagSort(), this._questIds || questIds(), 1);
            this._data = s.data;
            this._heads = s.heads;
            const first = new Set(s.heads.map(h => h.index));
            this._rowY = [];
            let y = 0;
            for (let i = 0; i <= this._data.length; i++) {
                if (first.has(i)) y += (i > 0 ? BAGL.gap : 0) + BAGL.head;
                this._rowY.push(y);
                y += BAGL.row;
            }
            this._firstRows = first;
        };
        const rowY = (w, i) => (w._rowY && w._rowY[i] !== undefined ? w._rowY[i] : i * BAGL.row);
        list.itemRect = function(index) { return new Rectangle(-this.scrollBaseX(), rowY(this, index) - this.scrollBaseY(), this.innerWidth, BAGL.row - 2); };
        list.overallHeight = function() { return Math.max(this.innerHeight, rowY(this, this.maxItems()) + 4); };
        list.ensureCursorVisible = function(smooth) {
            const i = this.index();
            if (i < 0 || this.innerHeight <= 0) return;
            const startOf = k => rowY(this, k) - (this._firstRows && this._firstRows.has(k) ? BAGL.head : 0);
            const top = startOf(i), bottom = rowY(this, i) + BAGL.row, sy = this.scrollY();
            const go = y => (smooth ? this.smoothScrollTo(0, y) : this.scrollTo(0, y));
            if (top < sy) go(top);
            else if (bottom > sy + this.innerHeight) {   // (the list's top edge on a row or a heading, never through one)
                const want = bottom - this.innerHeight;
                let y = want;
                for (let k = 0; k <= i; k++) { const s = startOf(k); if (s >= want) { y = s; break; } }
                go(y);
            }
        };
        list.hitTest = function(x, y) {
            if (!this.innerRect.contains(x, y)) return -1;
            const cx = this.origin.x + x - this.padding, cy = this.origin.y + y - this.padding;
            for (let i = 0; i < this.maxItems(); i++) if (this._data[i] && this.itemRect(i).contains(cx, cy)) return i;
            return -1;
        };
        list.drawAllItems = function() {
            const c = this.contents, top = this.scrollBaseY(), bottom = top + this.innerHeight + BAGL.row;
            for (const h of this._heads || []) {
                const y = rowY(this, h.index) - BAGL.head - top;
                if (y < -BAGL.head || y + BAGL.head > this.scrollY() - top + this.innerHeight) continue;
                heading(c, 6, y + 2, h.label.toUpperCase(), this.innerWidth - 6, h.count);
            }
            for (let i = 0; i < this.maxItems(); i++) {
                const y = rowY(this, i);
                if (y + BAGL.row < top || y > bottom) continue;
                if (this._data[i]) this.drawItem(i);
            }
            if (!this.maxItems()) tx(c, "Plecak jest pusty.", 10, 22, 22, { color: K.muted });
            done(c);
        };
        list.drawItemBackground = function() {};
        list.refreshCursor = function() { this.setCursorRect(0, 0, 0, 0); };
        list.drawItem = function(index) {
            const it = this.itemAt(index);
            if (!it) return;
            const r = this.itemRect(index), c = this.contents, on = index === this.index(), act = this.active, ink = on && act ? K.sel : null;
            if (r.y + r.height > this.scrollY() - this.scrollBaseY() + this.innerHeight + 1) return;   // (a row cut by the foot: not drawn - "jeszcze N niżej" says it is there; the contents start at the scroll's base, shown from the scroll itself)
            if (on) rr(c.context, r.x, r.y, r.width, BAGL.row - 2, 8, act ? K.acc : K.accDim);
            CH.drawIcon(c, it.iconIndex, r.x + 10, r.y + 4, 32);
            const n = $gameParty.numItems(it);
            let rw = 0, x1 = r.x + r.width - 12;
            if (wornNow(it.id)) {   // (what is worn: a small yellow plate "założone" / "w ręce" - the user, 2026-10-23)
                const word = it.id === 59 ? "w ręce" : wornWord(equipSlotOf(it)), pw = measure(word, 17, "bold") + 16;
                rr(c.context, x1 - pw, r.y + 9, pw, 23, 6, ink ? K.sel : K.acc);
                tx(c, word, x1 - pw / 2, r.y + 21, 17, { face: "bold", align: "center", color: ink ? K.acc : K.sel });
                rw = pw + 12;
                x1 -= rw;
            }
            if (n > 1) rw += tx(c, "×" + n, x1, r.y + 21, 22, { align: "right", face: "bold", color: ink || K.text }) + 14;
            tx(c, it.name, r.x + 54, r.y + 21, 24, { color: ink || K.text, max: r.width - 70 - rw });
            done(c);
        };
        const sel = list.select;
        list.select = function(i) {
            const was = this.index();
            sel.call(this, i);
            if (was === i || !this.contents) return;
            for (const k of [was, i]) if (k >= 0 && k < this.maxItems()) this.redrawItem(k);
        };
        const act = list.activate, deact = list.deactivate;
        list.activate = function() { const was = this.active; act.call(this); if (!was && this.contents && this.index() >= 0 && this.index() < this.maxItems()) this.redrawItem(this.index()); };
        list.deactivate = function() { const was = this.active; deact.call(this); if (was && this.contents && this.index() >= 0 && this.index() < this.maxItems()) this.redrawItem(this.index()); };
        // (a redrawn row: its old picture cleared - the row's own rect)
        list.clearItem = function(index) { const r = this.itemRect(index); this.contents.clearRect(r.x, r.y, r.width, r.height + 2); };
        const refresh = list.refresh;
        list.refresh = function() {
            refresh.call(this);
            if (this.index() >= this.maxItems()) this.select(Math.max(0, this.maxItems() - 1));
        };
    }
    // the card of the chosen thing (the mock-up's item_detail): drawn into the bag's Window_ItemDetail (its _desc and _note are what
    // the other plugins add - the wear, the water in the skin, what eating it did)
    function bagCard(win) {
        const it = win._item, c = win.contents, ctx = c.context, Wd = win.innerWidth, Hd = win.innerHeight;
        c.clear();
        if (!it) { if (win._note) noteBox(win, 0); done(c); return; }
        rr(ctx, 0, 0, 84, 84, 10, K.cell);
        CH.drawIcon(c, it.iconIndex, 10, 10, 64);
        const slot = equipSlotOf(it), worn = wornNow(it.id);
        win._cap = worn && slot ? (wornWord(slot) === "w ręce" ? "W RĘCE" : "ZAŁOŻONE") + "  ·  " + slotLabel(slot).toUpperCase() : (KIND_WORD[groupOf(it, null)] || "Rzecz").toUpperCase();
        tx(c, win._cap, 104, 6, 20, { top: true, face: "sc", color: K.acc, max: Wd - 104 });
        // the name on one line, smaller when long; two lines when even that does not fit
        let ns = 34;
        while (ns > 24 && measure(it.name, ns, "bold") > Wd - 104) ns -= 2;
        const nameLines = measure(it.name, ns, "bold") > Wd - 104 ? wrapWords(it.name, 24, Wd - 104, "bold").slice(0, 2) : [it.name];
        if (nameLines.length > 1) nameLines.forEach((line, i) => tx(c, line, 104, 30 + i * 26, 24, { top: true, face: "bold", max: Wd - 104 }));
        else tx(c, it.name, 104, 30 + (34 - ns) / 2, ns, { top: true, face: "bold", max: Wd - 104 });
        const rows = [["Masz", String($gameParty.numItems(it))]], S = T.api("Survival"), D = T.api("Durability");
        const w = S && S.itemWeight ? S.itemWeight(it) : 0;
        if (w) rows.push(["Waga", weightTxt(w) + " za sztukę"]);
        const fresh = T.call("Spoilage", "freshnessText", it.id) || "";
        if (fresh) rows.push(["Świeżość", fresh.replace(/^Świeżość:\s*/i, "").replace(/^Najstarsza sztuka\s+/i, "").replace(/\.$/, ""), K.good]);
        if (D && D.TOOLS && D.TOOLS[it.id] && D.lifeOf) rows.push(["Zużycie", Math.round(D.left(it.id)) + " / " + D.lifeOf(it.id)]);
        if (slot) rows.push(["Miejsce", slotLabel(slot) + (worn ? " · " + wornWord(slot) : ""), worn ? K.acc : null]);
        let y = 106;
        for (const [lab, val, col] of rows) {
            tx(c, lab, 0, y, 22, { top: true, color: K.muted });
            tx(c, val, Wd, y, 22, { top: true, face: "bold", align: "right", color: col || K.text, max: Wd - 110 });
            y += 32;
            hl(ctx, 0, Wd, y - 4);
        }
        y += 10;
        if (isKeep(it)) { tx(c, "Pamiątka: nie do sprzedania ani wyrzucenia.", 0, y, 20, { top: true, color: K.acc, max: Wd }); y += 30; }
        const desc = fresh ? String(win._desc || "").replace(fresh, "").trim() : String(win._desc || "");
        const S2 = T.api("Survival"), N = T.api("Needs"), food = S2 && S2.foodInfo ? S2.foodInfo(it) : null, fw = food && N && N.foodValues ? N.foodValues(it, food) : [0, 0];
        const gains = [];
        if (food) {
            if (food.stamina) gains.push(["stamina", "Kondycja", food.stamina]);
            if (fw[0]) gains.push(["food", "Sytość", Math.round(fw[0])]);
            if (fw[1]) gains.push(["water", "Nawodnienie", Math.round(fw[1])]);
        }
        const canUse = $gameParty.canUse(it) || !!slot, bottom = Hd - (canUse ? 48 : 0) - (gains.length ? 46 + gains.length * 30 : 0) - (win._note ? 70 : 0);
        for (const line of wrapWords(desc, 21, Wd, "regular")) {
            if (y + 28 > bottom) { tx(c, "…", 0, y - 6, 21, { top: true, color: K.muted }); break; }
            tx(c, line, 0, y, 21, { top: true, face: "regular" });
            y += 28;
        }
        if (gains.length) {
            y = Math.max(y + 8, Math.min(y + 14, bottom + 10));
            heading(c, 0, y, "PO ZJEDZENIU");
            y += 32;
            for (const [k, lab, v] of gains) {
                rr(ctx, 2, y + 6, 10, 10, 5, NEED_COL[k]);
                tx(c, lab, 22, y, 21, { top: true });
                tx(c, (v > 0 ? "+" : "") + v, Wd, y, 21, { top: true, face: "bold", align: "right" });
                y += 30;
            }
        }
        if (win._note) noteBox(win, Math.min(y + 8, Hd - (canUse ? 48 : 0) - 66));
        if (canUse) {
            const drink = groupOf(it, null) === "drink", verb = slot ? (worn ? "Zdejmij" : "Załóż") : food ? (drink ? "Wypij" : "Zjedz") : drink ? "Wypij" : "Użyj";
            const kw = keycap(c, 0, Hd - 20, "O");
            tx(c, verb, kw + 10, Hd - 19, 24, { face: "bold" });
        }
        done(c);
    }
    function noteBox(win, y) {
        const c = win.contents, Wd = win.innerWidth, lines = wrapWords(win._note, 19, Wd - 24, "regular").slice(0, 3), h = lines.length * 24 + 16;
        rr(c.context, 0, y, Wd, h, 8, "rgba(60,96,52,0.45)");
        lines.forEach((l, i) => tx(c, l, 12, y + 8 + i * 24, 19, { top: true, face: "regular", color: "#c9f0c0" }));
    }

    function BagView(scene, def) {
        View.call(this, scene, def);
        const R = RX(), mp = MP();
        this._head = this.layer();
        this._detail = this.addWindow(new mp.Window_ItemDetail(new Rectangle(R.x0 + BAGW.card - 12, R.y0 + 100, R.x1 - 22 - (R.x0 + BAGW.card - 12), R.y1 - 12 - (R.y0 + 100))), false);
        this._detail.refresh = function() { if (this.contents) bagCard(this); };
        const list = this._list = this.addWindow(new Window_ItemList(new Rectangle(R.x0 + 12, R.y0 + 96, BAGW.list, R.y1 - 10 - (R.y0 + 96))));
        groupedList(list);
        list.setHelpWindow(this._detail);
        list.setCategory("all");
        list.setHandler("ok", () => this.use());
        const enabled = list.isEnabled;   // (O on a thing to put on: it goes on / comes off - not "it cannot be used")
        list.isEnabled = function(it) { return enabled.call(this, it) || !!equipSlotOf(it); };
        // "Wyrzuć" (X): the question over the bag and the little plate that says why not - over the windows (the scene's top layer)
        this._drop = null;
        this._dropBoxes = [];
        this._over = new Sprite(new Bitmap(W(), H()));
        this._toast = new Sprite();
        this._toast.visible = false;
        this._toastText = "";
        scene._overLayer.addChild(this._over);
        scene._overLayer.addChild(this._toast);
        // (O on something that cannot be used: why - the classic bag's words)
        list.playBuzzerSound = function() {
            const help = scene._views.item ? scene._views.item._detail : null;
            if (help) help._note = "";
            Window_ItemList.prototype.playBuzzerSound.call(this);
            const it = this.item();
            if (help && it && !help._note) help.setText(it.itypeId === 2 ? "Tego się nie używa z plecaka: narzędzie działa samo, kiedy jest potrzebne." : "Tego nie da się zjeść ani użyć: to materiał do budowania i wytwarzania.");
        };
    }
    BagView.prototype = Object.create(View.prototype);
    BagView.prototype.constructor = BagView;
    BagView.prototype.keys = function() {
        const d = this._drop;
        if (d && d.step === "qty") return [["A/D", "±1"], ["W/S", "±10"], ["Tab", "wszystko"], ["O", "dalej"], ["P", "anuluj"]];
        if (d) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", d.max > 1 ? "ile" : "anuluj"]];
        const it = this._list.item(), slot = equipSlotOf(it);
        return [["W/S", "rzecz"], ["O", slot ? (wornNow(it.id) ? "zdejmij" : "załóż") : "użyj"], ["X", "wyrzuć"], ["Tab", "porządek"], ["P", "wróć"]];
    };
    // the keys' word for O follows the chosen thing (to put on, to take off, to use)
    BagView.prototype.keysKey = function() { const it = this._list.item(); return (it ? it.id : 0) + ":" + (it && wornNow(it.id) ? 1 : 0) + ":" + (this._drop ? this._drop.step : ""); };
    // O on a thing to put on: on its part (what was there comes off - said on the plate over it), or off when it is on
    BagView.prototype.toggleWear = function(it, slot) {
        const E = T.api("Equipment"), list = this._list, help = this._detail;
        let ok, text;
        if (E.worn(it.id)) {
            ok = !!E.unequip(slot);
            text = ok ? "Zdjęte: " + it.name + (slot === "right" ? " · w ręce: pięści" : "") : "Tego nie da się teraz zdjąć.";
        } else {
            const prev = E.current(slot), prevName = prev && prev !== it.id && item(prev) ? item(prev).name : "";
            ok = !!E.equip(slot, it.id);
            text = ok ? "Założone: " + it.name + (prevName ? " · zdjęte: " + prevName : "") : "Tego nie da się teraz założyć.";
        }
        if (ok) SoundManager.playEquip(); else SoundManager.playBuzzer();
        list.refresh();   // (the worn go first in their group: the thing may move - it stays chosen)
        const i = list._data.indexOf(it);
        if (i >= 0) list.select(i);
        list.ensureCursorVisible(false);
        help._note = "";
        help.setItem(list.item());
        this.drawHead();
        list.activate();
        this.toast(it.iconIndex, text, ok ? K.text : null, ok);
        this._wearText = text;
        this.scene.drawKeys();
        this.scene.drawList();
    };
    // the order: Tab (the next one); the chosen thing stays chosen
    BagView.prototype.setSort = function(mode) {
        if (!SORTS.some(x => x[0] === mode) || mode === bagSort()) return;
        const list = this._list, it = list.item();
        ConfigManager.bagSort = mode;
        try { ConfigManager.save(); } catch (e) { /* (no config file: kept for now) */ }
        SoundManager.playCursor();
        list.refresh();
        const i = it ? list._data.indexOf(it) : -1;
        list.select(i >= 0 ? i : list._data.findIndex(Boolean));
        list.ensureCursorVisible(false);
        this._detail.setItem(list.item());
        this.drawHead();
    };
    BagView.prototype.update = function() {
        this.updateToast();
        if (this.root.visible && this._list.scrollY() !== this._scrollWas) { this._list.paint(); this.drawHead(); }   // (the rows at the foot: whole ones only)
        if (this.inside && this.keysKey() !== this._keysWas) { this._keysWas = this.keysKey(); this.scene.drawKeys(); }
        if (!this.ready()) return;
        if (this._drop) { this.updateDrop(); return; }
        if (this._list.active && Input.isTriggered("takeOff")) { this.askDrop(); return; }
        if (this._list.active && Input.isTriggered("tab")) { const k = SORTS.findIndex(x => x[0] === bagSort()); this.setSort(SORTS[(k + 1) % SORTS.length][0]); }
    };
    BagView.prototype.touch = function(x, y) {
        if (this._drop) {
            const q = this._dropBoxes.find(q => inBox(q, x, y));
            if (q) this.dropAct(q.act);
            return;
        }
        const b = (this._sortBoxes || []).find(q => inBox(q, x, y));
        if (b) { const k = SORTS.findIndex(s => s[0] === bagSort()); this.setSort(SORTS[(k + 1) % SORTS.length][0]); }
    };
    // P while asking: from Tak / Nie back to how many, from how many out
    BagView.prototype.cancel = function() {
        if (!this._drop) return false;
        SoundManager.playCancel();
        if (this._drop.step === "ask" && this._drop.max > 1) { this._drop.step = "qty"; this.drawDrop(); this.scene.drawKeys(); }
        else this.closeDrop();
        return true;
    };
    BagView.prototype.refresh = function() {
        this._list.refresh();
        if (this._list.index() >= this._list.maxItems()) this._list.select(Math.max(0, this._list.maxItems() - 1));
        if (this._list.index() < 0 && this._list.maxItems()) this._list.select(0);
        this._list.ensureCursorVisible(false);
        this._detail.setItem(this._list.item());
        this.drawHead();
    };
    BagView.prototype.redraw = function() { this._list.refresh(); this._detail.setItem(this._list.item()); this.drawHead(); };
    BagView.prototype.activate = function() {
        this.scene._helpWindow = this._detail;   // (what eating says - Survival's feedback - goes onto the card)
        this._list.activate();
        if (this._list.index() < 0 && this._list.maxItems()) this._list.select(0);
        this._detail.setItem(this._list.item());
    };
    BagView.prototype.leave = function() {
        if (this.scene._helpWindow === this._detail) this.scene._helpWindow = null;
        if (this._drop) { this._drop = null; this.drawDrop(); }
        this._toast.visible = false;
        this._toastText = "";
    };
    // the head: the title, the order, the load as a yellow bar; the line between the list and the card; "jeszcze N niżej"
    BagView.prototype.drawHead = function() {
        const b = this._head.bitmap, ctx = b.context, R = RX(), S = T.api("Survival");
        b.clear();
        header(b, "Plecak");
        const order = SORTS.find(s => s[0] === bagSort()), ox = R.lx;   // (no view name before it any more: header())
        const ow = tx(b, "porządek: " + order[1].toLowerCase(), ox, R.y0 + 55, 18, { top: true, color: K.dim });
        this._sortBoxes = [{ x0: ox - 8, x1: ox + ow + 8, y0: R.y0 + 44, y1: R.y0 + 84 }];
        if (S && S.carriedWeight && S.weightCap) {
            const load = S.carriedWeight(), cap = S.weightCap();
            tx(b, "OBCIĄŻENIE", R.x1 - 330, R.y0 + 46, 18, { top: true, face: "sc", color: K.muted });
            tx(b, weightTxt(Math.round(load * 10) / 10) + " / " + cap, R.rx, R.y0 + 43, 22, { top: true, face: "bold", align: "right", color: load > cap ? K.warn : K.text });
            meter(ctx, R.x1 - 330, R.y0 + 72, 296, 7, Math.min(1, load / Math.max(1, cap)), load > cap ? K.warn : K.acc);
        }
        vl(ctx, R.x0 + BAGW.line, R.y0 + 108, R.y1 - 24);
        // what is below the list's bottom edge
        const list = this._list, sy = list.scrollY(), ih = list.innerHeight;
        let more = 0;
        for (let i = 0; i < list.maxItems(); i++) { const r = list._rowY ? list._rowY[i] : i * BAGL.row; if (r + BAGL.row > sy + ih + 2) more++; }
        if (more) tx(b, "▾  jeszcze " + more + " niżej", R.x0 + 12 + BAGW.list / 2, R.y1 - 14, 19, { align: "center", color: K.muted });
        this._scrollWas = sy;
        done(b);
    };
    // O on a thing: used on the hero at once (one hero), as the bag did
    BagView.prototype.use = function() {
        const list = this._list, it = list.item(), actor = $gameParty.leader(), help = this._detail;
        if (!it || !actor) { list.activate(); return; }
        const slot = equipSlotOf(it);
        if (slot) { this.toggleWear(it, slot); return; }
        const action = new Game_Action(actor);
        action.setItemObject(it);
        const ok = $gameParty.canUse(it) && actor.canUse(it) && (!action.isForFriend() || action.testApply(actor));
        if (!ok) { list.playBuzzerSound(); list.activate(); return; }
        help._note = "";
        SoundManager.playUseItem();
        actor.useItem(it);
        for (let i = 0; i < action.numRepeats(); i++) action.apply(actor);
        action.applyGlobal();
        if ($gameTemp.isCommonEventReserved()) { SceneManager.goto(Scene_Map); return; }
        const note = help._note;
        list.refresh();
        if (list.index() >= list.maxItems()) list.select(Math.max(0, list.maxItems() - 1));
        help.setItem(list.item());
        if (note) help.setText(note);
        this.drawHead();
        list.activate();
        this.scene.drawList();
    };
    // ---- "Wyrzuć" (X on a thing, the user 2026-10-14): how many (A / D by one, W / S by ten, Tab all), then Tak / Nie; it goes into a
    // bundle on the ground in front of him (Drops.js). What cannot go (a keepsake, what a quest asks for) - a plate over the thing.
    const DROP = { w: 540, h: 292 };
    BagView.prototype.askDrop = function() {
        const list = this._list, it = list.item(), D = T.api("Drops");
        if (!it || !D) { SoundManager.playBuzzer(); return; }
        const why = D.refuse(it);
        if (why) { SoundManager.playBuzzer(); this.toast(it.iconIndex, why); return; }
        const have = $gameParty.numItems(it), max = D.maxDrop(it);
        this._drop = { it, have, max, n: 1, step: max > 1 ? "qty" : "ask", yes: true, need: have - max };
        list.deactivate();
        SoundManager.playOk();
        this.drawDrop();
        this.scene.drawKeys();
    };
    BagView.prototype.closeDrop = function() {
        this._drop = null;
        this.drawDrop();
        this._list.activate();
        this.scene.drawKeys();
    };
    BagView.prototype.setDropN = function(n) {
        const d = this._drop, v = Math.max(1, Math.min(d.max, n));
        if (v === d.n) return;
        d.n = v;
        SoundManager.playCursor();
        this.drawDrop();
    };
    BagView.prototype.updateDrop = function() {
        const d = this._drop;
        if (d.step === "qty") {
            if (Input.isRepeated("right")) this.setDropN(d.n + 1);
            else if (Input.isRepeated("left")) this.setDropN(d.n - 1);
            else if (Input.isRepeated("up")) this.setDropN(d.n + 10);
            else if (Input.isRepeated("down")) this.setDropN(d.n - 10);
            else if (Input.isTriggered("tab")) this.dropAct("all");
            else if (Input.isTriggered("ok")) this.dropAct("next");
            return;
        }
        if (Input.isRepeated("left") || Input.isRepeated("right")) { d.yes = !d.yes; SoundManager.playCursor(); this.drawDrop(); }
        else if (Input.isTriggered("ok")) this.dropAct(d.yes ? "yes" : "no");
    };
    BagView.prototype.dropAct = function(act) {
        const d = this._drop;
        if (!d) return;
        if (act === "minus") this.setDropN(d.n - 1);
        else if (act === "plus") this.setDropN(d.n + 1);
        else if (act === "all") this.setDropN(d.n === d.max ? 1 : d.max);
        else if (act === "next") { SoundManager.playOk(); d.step = "ask"; d.yes = true; this.drawDrop(); this.scene.drawKeys(); }
        else if (act === "no") { SoundManager.playCancel(); this.closeDrop(); }
        else if (act === "yes") this.doDrop();
    };
    BagView.prototype.doDrop = function() {
        const d = this._drop, D = T.api("Drops"), list = this._list, it = d.it, n = d.n;
        const b = D ? D.drop(it.id, n) : null;
        this._drop = null;
        this.drawDrop();
        list.refresh();
        if (list.index() >= list.maxItems()) list.select(Math.max(0, list.maxItems() - 1));
        list.ensureCursorVisible(false);
        this._detail.setItem(list.item());
        this.drawHead();
        list.activate();
        this.scene.drawKeys();
        if (!b) { SoundManager.playBuzzer(); this.toast(it.iconIndex, (D && D.refuse(it)) || "Tego nie wyrzucę."); return; }
        AudioManager.playSe({ name: "Equip2", volume: 70, pitch: 80, pan: 0 });
        const here = b.x === $gamePlayer.x && b.y === $gamePlayer.y;
        this.toast(it.iconIndex, "Wyrzucone: " + it.name + (n > 1 ? " ×" + n : "") + (here ? " · pod tobą" : " · przed tobą"), C.text, true);
    };
    BagView.prototype.dropRect = function() { const P = L.right; return { x: Math.round(P.x + (P.w - DROP.w) / 2), y: Math.round(P.y + 100 + (P.h - 100 - DROP.h) / 2) }; };
    BagView.prototype.drawDrop = function() {
        const b = this._over.bitmap, d = this._drop;
        b.clear();
        this._dropBoxes = [];
        if (!d) { done(b); return; }
        const P = L.right, r = this.dropRect(), ctx = b.context, it = d.it, w = DROP.w, x0 = r.x + 28, iw = w - 56;
        const box = (act, x, y, bw, bh) => this._dropBoxes.push({ act, x0: x, x1: x + bw, y0: y, y1: y + bh });
        ctx.save();
        ctx.fillStyle = "rgba(8,9,11,0.55)";   // (the bag under the question: dimmed)
        CH.roundPath(ctx, P.x, P.y, P.w, P.h, 14);
        ctx.fill();
        ctx.restore();
        rr(ctx, r.x, r.y, w, DROP.h, 12, "rgba(20,21,24,0.98)");
        tx(b, "WYRZUĆ", x0, r.y + 18, 18, { top: true, face: "sc", color: K.acc });
        CH.drawIcon(b, it.iconIndex, x0, r.y + 44, 48);
        tx(b, it.name, x0 + 62, r.y + 46, 24, { top: true, face: "bold", max: iw - 62 });
        tx(b, "w plecaku " + d.have + (d.need > 0 ? " · " + d.need + " zostaje do zadania" : ""), x0 + 62, r.y + 76, 18, { top: true, color: K.muted, max: iw - 62 });
        if (d.step === "qty") {
            const cx = r.x + w / 2, y = r.y + 112;
            for (const [act, sx, glyph] of [["minus", cx - 150, "−"], ["plus", cx + 106, "+"]]) {
                const off = act === "minus" ? d.n <= 1 : d.n >= d.max;
                rr(ctx, sx, y + 6, 44, 44, 8, off ? K.empty : K.cell);
                textOut(b, glyph, sx, y + 6, 44, 44, "center", { size: 26, face: "bold", color: off ? K.dim : K.text, plain: true });
                box(act, sx, y + 6, 44, 44);
            }
            textOut(b, String(d.n), cx - 90, y, 180, 56, "center", { size: 42, face: "bold", plain: true });
            textOut(b, "z " + d.max, cx - 90, y + 52, 180, 22, "center", { size: 17, color: C.muted, plain: true });
            meter(ctx, x0, y + 86, iw, 4, d.n / Math.max(1, d.max), K.acc);
            box("next", cx - 90, y, 180, 74);
            const ky = r.y + DROP.h - 46, all = [["Tab", "wszystko (" + d.max + ")"]];
            smallKeys(b, x0, ky, all);
            box("all", x0, ky, smallKeysWidth(all) + 8, 24);
            smallKeys(b, r.x + w - 28 - smallKeysWidth([["O", "dalej"]]), ky, [["O", "dalej"]]);
            box("next", r.x + w - 28 - smallKeysWidth([["O", "dalej"]]), ky, smallKeysWidth([["O", "dalej"]]) + 8, 24);
        } else {
            const D = T.api("Drops"), s = D ? D.spot() : null, here = s && s.x === $gamePlayer.x && s.y === $gamePlayer.y;
            const pile = s && D.at($gameMap.mapId(), s.x, s.y);
            let y = r.y + 112;
            tx(b, "Wyrzucić " + (d.n === d.have ? "wszystko (" + d.n + ")" : d.n + " z " + d.have) + "?", x0, y, 22, { top: true, face: "bold", max: iw });
            y += 34;
            tx(b, (pile ? "Dołożysz do tobołka " : "Zostanie w tobołku ") + (here ? "pod tobą." : "przed tobą."), x0, y, 18, { top: true, color: K.muted, max: iw });
            y += 24;
            tx(b, "O na tobołku zabierze to z powrotem.", x0, y, 18, { top: true, color: K.muted, max: iw });
            y += 24;
            if (D && D.wornLast(it, d.n)) tx(b, "Masz to na sobie: najpierw to zdejmiesz.", x0, y, 18, { top: true, color: K.warn, max: iw });
            const by = r.y + DROP.h - 66, bw = (iw - 16) / 2;
            [["yes", "Tak"], ["no", "Nie"]].forEach(([act, label], k) => {
                const bx = x0 + k * (bw + 16), on = (act === "yes") === d.yes;
                rr(ctx, bx, by, bw, 46, 8, on ? K.acc : K.cell);
                tx(b, label, bx + bw / 2, by + 23, 21, { face: "bold", align: "center", color: on ? K.sel : K.text });
                box(act, bx, by, bw, 46);
            });
        }
        done(b);
    };
    // a plate over the chosen thing (as the popups over the hero on the map): why it cannot go, or what went; it rises and fades
    BagView.prototype.toast = function(icon, text, color, quiet) {
        const s = this._toast, size = 18, pad = 10, iw = icon ? 32 + 8 : 0, tw = Math.ceil(measure(text, size)), w = pad * 2 + iw + tw + 6, h = 40;
        const b = new Bitmap(w, h);
        CH.rpanel(b.context, 0, 0, w, h, 6, { fill: "rgba(11,12,15,0.94)", line: quiet ? C.line : K.warn, shadow: 0 });
        if (icon) CH.drawIcon(b, icon, pad, 4, 32);
        textOut(b, text, pad + iw, 0, tw + 6, h, "left", { size, color: color || (T.popup.COLORS ? T.popup.COLORS.need : K.warn), plain: true });
        done(b);
        s.bitmap = b;
        const list = this._list, i = list.index(), rr0 = i >= 0 ? list.itemRect(i) : new Rectangle(0, 0, 0, 0), P = L.right;
        s._x0 = Math.round(Math.max(P.x + 8, Math.min(P.x + P.w - w - 8, list.x + list.padding + rr0.x + rr0.width / 2 - w / 2)));
        s._y0 = Math.round(Math.max(P.y + 8, list.y + list.padding + rr0.y - h - 2));
        s._age = 0;
        s.x = s._x0;
        s.y = s._y0;
        s.opacity = 0;
        s.visible = true;
        this._toastText = text;
    };
    BagView.prototype.updateToast = function() {
        const s = this._toast;
        if (!s.visible) return;
        const k = ++s._age;
        s.y = Math.round(s._y0 - 16 * ease(k / 40));
        s.opacity = Math.round(255 * Math.max(0, Math.min(1, k / 6, (120 - k) / 25)));
        if (k >= 120) { s.visible = false; this._toastText = ""; }
    };
    BagView.prototype.info = function() {
        const l = this._list;
        return { bag: { category: "all", items: l.maxItems(), index: l.index(), item: l.item() ? l.item().id : null, sort: bagSort(),
            heads: (l._heads || []).map(h => ({ key: h.key, label: h.label, index: h.index, count: h.count })), data: l._data.map(it => (it ? it.id : 0)),
            drop: this._drop ? { step: this._drop.step, n: this._drop.n, max: this._drop.max, have: this._drop.have, item: this._drop.it.id, yes: this._drop.yes } : null,
            toast: this._toastText || "", active: l.active, card: this._detail._item ? this._detail._item.id : null, note: this._detail._note || "",
            cardCap: this._detail._cap || "", worn: l._data.filter(it => it && wornNow(it.id)).map(it => it.id), wear: this._wearText || "" } };
    };

    CZESCI.pages = { PostacView, eqCells, totals, EquipView, SkillsView, SORTS, bagSort, GROUPS, groupOf, equipSlotOf, sortBag,
        BAGW, BagView };
})();
