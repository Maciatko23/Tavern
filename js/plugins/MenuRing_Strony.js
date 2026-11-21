//=============================================================================
// MenuRing_Strony.js
//=============================================================================
// Part of MenuRing.js (refactor 2026-11-07: a big file split - these lines moved here word for word, nothing changed). It gives
// MenuRing.js its names through Tawerna.api("MenuRing_parts").pages; it must stand just above MenuRing.js on the plugin list.

/*:
 * @target MZ
 * @plugindesc Menu P - strony Postać, Statystyki, Ekwipunek, Umiejętności i Plecak (część MenuRing.js). v1.4.0
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
        heading, header, STRIP_TOP, tabStrip, inBox, tick, bubble, View, fancyBox, selBar } = CZESCI.kit;
    if (T.api(PLUGIN)) return;

    // ==================================================================
    // Postać and Ekwipunek (the user, 2026-11-17 evening, for the next day): "w tabie Postać widok ekwipunku będzie wyrzucony do innego
    // tabu Ekwipunek"; "tab Ekwipunek podzielony na 3 równe części: lewa - opis aktualnie oglądanego przedmiotu, środkowa - sylwetka ze
    // slotami, prawa - lista rzeczy możliwych do założenia na ten dany slot"; "w tabie Postać ładnie z dużych liter nazwy atrybutów",
    // "ikonki przy życiu, kondycji, sytości usuń", "statystyki też z dużych liter"; "Postać będzie miała dwie kolumny: lewa - imię
    // postaci, tuż niżej poziom, niżej z dużych liter życie, kondycja..., a niżej sakiewka; prawa strona podzielona na górę i dół: góra
    // - atrybuty, dół - opis wybranego". Each page's columns are dark boxes of one width and one height side by side ("ładnie, równo,
    // profesjonalnie").
    // ==================================================================
    const attrIds = () => { const Cb = T.api("Combat"); return Cb && Cb.ATTRS ? Cb.ATTRS.map(a => a.id) : []; };
    // n even columns across the panel under its head strip (gap 20 between them); PAD: the words' margin inside a box
    function cols(n) {
        const R = RX(), gap = 20, top = R.y0 + 102, bot = R.y1 - 16, w = Math.floor((R.rx - R.lx - gap * (n - 1)) / n);
        return Array.from({ length: n }, (_, i) => { const x = R.lx + i * (w + gap); return { x, w, top, bot, cx: Math.round(x + w / 2) }; });
    }
    const PAD = 22;
    const boxOf = (ctx, c) => fancyBox(ctx, c.x, c.top, c.w, c.bot - c.top);

    // ---------------------------------------------------------------- Postać (the user, 2026-11-18): "na samej górze po lewej imię
    // postaci, obok poziom i obok pasek XP, i w tym samym elemencie poniżej życie, wytrzymałość itd. jako ładne ikonki i procent (jak na
    // ekranie gry, bez napisów)"; "niżej element z dwiema częściami: po lewej bardzo ładną, wyraźną czcionką nazwy atrybutów i ich
    // wartości, po prawej opis"; "na samym dole na środku sakiewka, ładnie". Three dark boxes: the head across the panel, the
    // attributes | the chosen one's words, the purse in the middle at the foot.
    const PL = () => {
        const R = RX(), x = R.lx, w = R.rx - R.lx, top = R.y0 + 102, bot = R.y1 - 16;
        const head = { x, w, top, bot: top + 104 }, purse = { w: 440, h: 52 };
        purse.x = Math.round(x + (w - purse.w) / 2);
        purse.top = bot - purse.h;
        const mid = { x, w, top: head.bot + 12, bot: purse.top - 10 };
        mid.split = x + Math.round(w * 0.38);   // (the attributes' part | the words' part)
        return { head, mid, purse };
    };
    const AT = { first: 60, row: 42 };   // (the attributes: the first row and the step from the middle box's top)
    const attrRowY = i => PL().mid.top + AT.first + i * AT.row;
    function PostacView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._focus = 0;   // (the attribute chosen)
    }
    PostacView.prototype = Object.create(View.prototype);
    PostacView.prototype.constructor = PostacView;
    PostacView.prototype.keys = function() {
        const xp = heroXp(), out = [["W/S", "atrybut"]];
        if (xp && xp.points > 0) out.push(["O", "dodaj punkt"]);
        out.push(["P", "wróć"]);
        return out;
    };
    function drawBust() { return true; }   // (no bust on the page any more: the name says who he is)
    PostacView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, xp = heroXp(), pts = xp ? xp.points : 0, P = PL();
        b.clear();
        header(b, "Postać", !this.inside ? "podgląd" : pts > 0 ? pts + " " + plural(pts, "punkt", "punkty", "punktów") + " do rozdania" : "");
        for (const c of [P.head, P.mid]) fancyBox(ctx, c.x, c.top, c.w, c.bot - c.top);
        this.drawHead(b, P.head, xp);
        this.drawAttrs(b, P.mid, xp);
        this.drawPurse(b, P.purse);
        done(b);
    };
    // the head: the name, the level beside it, the experience's bar beside that; under them the needs - icon and % (as on the map)
    PostacView.prototype.drawHead = function(b, c, xp) {
        const ctx = b.context, x = c.x + PAD, x1 = c.x + c.w - PAD, actor = $gameParty.leader(), name = actor ? actor.name() : "", cy = c.top + 30;
        const nw = tx(b, name, x, cy, 34, { face: "bold", max: 360 });
        let bx = x + Math.min(nw, 360) + 22;
        if (xp) {
            bx += tx(b, "POZIOM " + xp.level, bx, cy + 2, 22, { face: "sc", color: K.acc }) + 26;
            const label = xp.top ? "najwyższy poziom" : xp.xp + " / " + xp.need + " dośw.", lw = measure(label, 17) + 18;
            meter(ctx, bx, cy - 4, Math.max(80, x1 - lw - bx), 10, xp.ratio, K.acc);   // (the only bar on the page: the experience)
            tx(b, label, x1, cy + 1, 17, { align: "right", color: K.muted });
        }
        hl(ctx, x, x1, c.top + 56, "rgba(255,210,63,0.16)");
        // the needs: four even parts, each its icon (PixelLab - CleanHUD.drawNeed) and its percent
        const rows = needRows(), part = (x1 - x) / Math.max(1, rows.length), ny = c.top + 80;
        this._needs = [];
        rows.forEach(([key, lab, v, val], i) => {
            const vw = measure(val, 23, "bold"), gw = 32 + 10 + vw, gx = Math.round(x + part * i + (part - gw) / 2);
            if (!(CH.drawNeed && CH.drawNeed(b, key, gx, ny - 16, 32))) { const [icon, mode] = CH.NEED_ICONS[key]; CH.drawIcon(b, icon, gx, ny - 16, 32, mode); }
            tx(b, val, gx + 42, ny, 23, { face: "bold", color: v < 0.25 ? K.warn : K.text });
            this._needs.push(lab + ": " + val);
        });
    };
    // the middle: the attributes (a clear, big face; a "+" while there are points) | the chosen one's words
    PostacView.prototype.drawAttrs = function(b, c, xp) {
        const ctx = b.context, x = c.x + PAD, ax1 = c.split - PAD, Cb = T.api("Combat"), pts = xp ? xp.points : 0, ids = attrIds();
        heading(b, x, c.top + 18, "ATRYBUTY", ax1 - (pts > 0 ? 130 : 0));
        if (pts > 0) tx(b, pts + " do rozdania", ax1, c.top + 19, 17, { top: true, align: "right", color: K.acc });
        ids.forEach((id, i) => {
            const a = Cb.ATTRS[i], ry = attrRowY(i), on = this.inside && i === this._focus, mid = ry + AT.row / 2 - 4;
            if (on) selBar(ctx, x - 10, ry - 2, ax1 - x + 20, AT.row - 4, 9);
            tx(b, String(a.name).toUpperCase(), x, mid, 25, { face: "sc", color: on ? K.sel : K.text });
            tx(b, String(xp ? xp.attr[id] || 0 : 0), ax1, mid, 26, { face: "bold", align: "right", color: on ? K.sel : K.text });
            if (pts > 0 && (xp.attr[id] || 0) < (Cb.ATTR_MAX || 60)) {   // (a "+" while there are points to give)
                const px = ax1 - 58;
                rr(ctx, px, mid - 12, 24, 24, 6, on ? K.sel : K.accDim);
                tx(b, "+", px + 12, mid, 20, { face: "bold", align: "center", color: on ? K.acc : K.text });
            }
        });
        vl(ctx, c.split, c.top + 18, c.bot - 18);
        // (the words of the chosen attribute; with no keys yet: the first one's)
        this._popup = ids.length ? this.drawAttr(b, c.split + PAD, c.x + c.w - PAD - (c.split + PAD), c.top + 16, ids[this._focus] || ids[0], c.bot - 8) : null;
    };
    // the chosen attribute: what it gives now and with one point more - the same numbers the fight and the work use (Combat.attrInfo)
    PostacView.prototype.drawAttr = function(b, x, w, y, id, bottom) {
        const Cb = T.api("Combat"), info = Cb && Cb.attrInfo ? Cb.attrInfo(id) : null;
        if (!info) return null;
        const x1 = x + w, top = !info.rows.length || !info.rows[0].next, F = { desc: 23, line: 27, row: 21, rowH: 27 };
        tx(b, String(info.name).toUpperCase(), x, y, 28, { top: true, face: "sc", color: K.acc });
        tx(b, info.value + " / " + info.max, x1, y + 4, 21, { top: true, face: "bold", align: "right", color: K.muted });
        y += 36;
        // (its words big - the user: "czcionka opisująca atrybut większa" - as many lines as leave room for the table under them; more:
        // the last one ends with "…", never cut on a comma)
        const room = Math.max(2, Math.floor(((bottom || y + 300) - y - 6 - 26 - (Math.max(1, info.rows.length) - 1) * F.rowH - F.row - 4) / F.line));
        let desc = wrapWords(info.desc, F.desc, w, "regular");
        if (desc.length > room) { desc = desc.slice(0, room); desc[room - 1] = CH.fit(desc[room - 1].replace(/[,;:\s]+$/, "") + " …", F.desc, w, "regular"); }
        for (const line of desc) { tx(b, line, x, y, F.desc, { top: true, face: "regular", color: K.soft }); y += F.line; }
        y += 6;
        const cNow = x1 - 140, cNext = x1;
        tx(b, "TERAZ", cNow, y, 17, { top: true, face: "sc", color: K.muted, align: "right" });
        tx(b, top ? "NAJWYŻEJ" : "+1 PUNKT", cNext, y, 17, { top: true, face: "sc", color: K.acc, align: "right" });
        y += 26;
        const rows = [];
        for (const r of info.rows) {
            tx(b, r.label, x, y, F.row, { top: true, color: K.soft, max: cNow - 80 - x });
            tx(b, r.now, cNow, y, F.row, { top: true, face: "bold", align: "right" });
            tx(b, r.next || "—", cNext, y, F.row, { top: true, face: "bold", align: "right", color: r.next && r.next !== r.now ? K.acc : K.dim });
            rows.push(r.label + ": " + r.now + (r.next ? " -> " + r.next : ""));
            y += F.rowH;
        }
        return { attr: id, name: info.name, rows, lines: desc.length };
    };
    // the purse: in the middle at the foot, its coins' pictures (Monety.js draws "N G" so)
    PostacView.prototype.drawPurse = function(b, c) {
        const ctx = b.context, gold = $gameParty.gold(), money = gold + " G", label = "SAKIEWKA";
        rr(ctx, c.x, c.top, c.w, c.h, c.h / 2, K.panel2);
        ctx.save(); ctx.strokeStyle = K.accDim; ctx.lineWidth = 1.5; CH.roundPath(ctx, c.x + 0.75, c.top + 0.75, c.w - 1.5, c.h - 1.5, c.h / 2); ctx.stroke(); ctx.restore();
        const lw = measure(label, 18, "sc"), mw = measure(money, 28, "bold"), gap = 26, sx = Math.round(c.x + (c.w - lw - gap - mw) / 2), cy = c.top + c.h / 2;
        tx(b, label, sx, cy + 1, 18, { face: "sc", color: K.acc });
        tx(b, money, sx + lw + gap, cy, 28, { face: "bold" });
        this._purse = gold;
    };
    PostacView.prototype.update = function() {
        if (!this.ready()) return;
        if (this.mouseMoved()) { const p = touchAt(), k = this.rowAt(p.x, p.y); if (k >= 0 && k !== this._focus) { this._focus = k; this.redraw(); } }
        const n = attrIds().length;
        if (n && (Input.isRepeated("down") || Input.isRepeated("up"))) {
            this._focus = (this._focus + (Input.isRepeated("down") ? 1 : n - 1)) % n;
            SoundManager.playCursor();
            this.redraw();
        } else if (Input.isTriggered("ok")) this.spend();
    };
    PostacView.prototype.rowAt = function(x, y) {
        const c = PL().mid;
        if (x < c.x || x > c.split) return -1;
        for (let i = 0; i < attrIds().length; i++) { const ry = attrRowY(i); if (y >= ry - 2 && y < ry + AT.row - 2) return i; }
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
        return { stats: { focus: this.inside ? ids[this._focus] || null : null, points: xp ? xp.points : 0, plus: !!(xp && xp.points > 0), xp,
            needs: (this._needs || []).slice(), purse: this._purse, bust: drawBust(), popup: this.inside ? this._popup || null : null } };
    };

    // ---------------------------------------------------------------- Statystyki (the user, 2026-11-18: "potrzebne jest info - być może
    // nowy tab - gdzie są statystyki, czyli wartość obrażeń, zasięg, krytyk, odporności"; mock-up A2 chosen: "ładnie, równo, przejrzyście").
    // Six tiles of the main numbers at the top, three cards under them (Walka, Obrona, Przetrwanie i praca - nothing repeated), at the
    // foot "Skąd to się bierze": the chosen number cut into its parts (the weapon, the attribute, the skills, the traits, the penalty)
    // and what they make. Every number is worked out with the same functions the fight and the work use (Combat, Combat_Fight).
    const num1c = v => String(Math.round(v * 10) / 10).replace(".", ",");
    const pc1 = v => num1c(v * 100) + "%";
    const plusPc = v => (v < 0 ? "−" : "+") + pc1(Math.abs(v));
    const secs = f => (f / 60).toFixed(2).replace(".", ",") + " s";
    function statsModel() {
        const Cb = T.api("Combat"), P = T.api("Combat_parts"), f = P && P.fight, core = (P && P.core) || {}, S = T.api("Survival"), US = T.api("Ubior_Sklepy"), E = T.api("Equipment"), BD = T.api("Bron_Data");
        if (!Cb || !f || !Cb.fightInfo || !Cb.defenseInfo) return null;
        const A0 = core.ATTR_START || 5, at = id => (Cb.attr ? Cb.attr(id) : A0), perk = k => (Cb.perk ? Cb.perk(k) : 0), skill = k => !!(Cb.hasSkill && Cb.hasSkill(k));
        const worn = id => !!(E && E.worn && E.worn(id)), R = BD && typeof BD.ROZRZUT === "number" ? BD.ROZRZUT : 0.1, icon = id => (window.$dataItems && $dataItems[id] ? $dataItems[id].iconIndex : 0);
        const fi = Cb.fightInfo(), de = Cb.defenseInfo(), ranged = !!fi.ranged;
        const wid = ranged ? 0 : (fi.weapon && fi.weapon.id) || 0, base = f.MELEE[wid] || f.MELEE[0], wn = (Cb.weaponNow ? Cb.weaponNow(wid) : null) || base;
        const tr = f.cechy ? f.cechy(wid) || {} : {}, sm = Cb.strMult ? Cb.strMult() : 1, pk = perk("melee.dmg"), lack = wn.lack || 0;
        const span = (d, extra) => { const lo = Math.max(1, Math.round(d * (1 - R))) + (extra || 0), hi = Math.max(1, Math.round(d * (1 + R))) + (extra || 0); return lo === hi ? String(lo) : lo + "–" + hi; };
        const wIcon = ranged ? icon(fi.weapon.id) : wid ? icon(wid) : f.FIST_ICON || 0, wName = ranged ? fi.weapon.name : wid ? base.name : "Pięści";
        const chip = (name, val, cls, ic) => ({ name, val, cls: cls || "", icon: ic || 0 });
        const attrChip = (id, name, part, fmt) => chip(name + " " + at(id), fmt(part), Math.abs(part) < 1e-9 ? "dim" : part > 0 ? "good" : "bad");
        const out = {};
        // ---- the tiles
        if (!ranged) {
            const hit = wn.dmg * sm * (1 + pk), parts = [chip(wName, span(base.dmg), "", wIcon), attrChip("str", "Siła", sm - 1, plusPc)];
            if (wid === 0 && wn.dmg !== base.dmg && !lack) parts.push(chip("Rękawice", "+" + (wn.dmg - base.dmg), "good"));
            if (pk) parts.push(chip("Umiejętności", plusPc(pk), "good"));
            if (tr.obrazenia) parts.push(chip("Udane kucie", "+" + tr.obrazenia, "good"));
            if (lack) parts.push(chip("Kara: poziom " + (base.poziom || 1), "−" + pc1(lack), "bad"));
            out.dmg = { key: "dmg", label: "Obrażenia", tile: "OBRAŻENIA", value: span(hit, tr.obrazenia), icon: wIcon, chips: parts,
                desc: "Ile zabiera jeden zwykły cios (losowo ±" + Math.round(R * 100) + "%)." };
        } else {
            const dx = 0.02 * (at("dex") - A0), rp = perk("ranged.dmg"), shot = fi.weapon.shot || 0, b0 = Math.round(shot / Math.max(0.01, (1 + dx) * (1 + rp)));
            const parts = [chip(wName, span(b0), "", wIcon), attrChip("dex", "Zręczność", dx, plusPc)];
            if (rp) parts.push(chip("Umiejętności", plusPc(rp), "good"));
            out.dmg = { key: "dmg", label: "Obrażenia", tile: "OBRAŻENIA", value: span(shot), icon: wIcon, chips: parts, desc: "Ile zabiera jeden strzał (losowo ±" + Math.round(R * 100) + "%)." };
        }
        const shield = f.shield ? f.shield() : null, blockV = Math.min(0.9, (de.shield ? de.shield.reduce : de.bare) + (de.blockPerk || 0));
        const bParts = [de.shield ? chip(de.shield.name, pc1(de.shield.reduce), "", icon(de.shield.id)) : chip("Bez tarczy", pc1(de.bare), "dim")];
        if (de.blockPerk) bParts.push(chip("Umiejętności", plusPc(de.blockPerk), "good"));
        if (shield && shield.lack) bParts.push(chip("Kara: poziom " + (shield.poziom || 1), "−" + pc1(shield.lack), "bad"));
        out.block = { key: "block", label: "Blok", tile: "BLOK", value: pc1(blockV), icon: de.shield ? icon(de.shield.id) : 804, chips: bParts, desc: "Tyle ciosu zatrzymujesz, gdy blokujesz." };
        const armour = de.armor;
        out.armor = { key: "armor", label: "Zbroja", tile: "ZBROJA", value: armour ? "−" + pc1(armour.reduce) : "brak", cls: armour ? "" : "dim", icon: armour ? icon(armour.id) : 879,
            chips: armour ? [chip(armour.name, "−" + pc1(armour.reduce), "good", icon(armour.id))] : [chip("Nic na sobie", "brak", "dim")], desc: "O tyle słabiej trafia cię każdy cios." };
        const lvl = Cb.hero ? Cb.hero().level : 1, hpPk = perk("hp.max");
        const hParts = [chip("Podstawa", "100"), chip("Kondycja " + at("con"), "+" + 5 * (at("con") - A0), at("con") > A0 ? "good" : "dim"), chip("Poziom " + lvl, "+" + 3 * (lvl - 1), lvl > 1 ? "good" : "dim")];
        if (hpPk) hParts.push(chip("Umiejętności", "+" + hpPk, "good"));
        out.hp = { key: "hp", label: "Życie", tile: "ŻYCIE", value: String(de.mhp), need: "health", chips: hParts, desc: "Najwięcej życia, jakie możesz mieć." };
        out.breath = { key: "breath", label: "Oddech", tile: "ODDECH", value: String(de.breath), need: "breath",
            chips: [chip("Podstawa", "90"), chip("Kondycja " + at("con"), "+" + 2 * at("con"), "good")], desc: "Na ciosy, bloki i przewroty; wraca w odpoczynku. Głód i pragnienie go zmniejszają." };
        const cap = S && S.weightCap ? S.weightCap() : 0, bag = worn(114) ? (S && S.WEIGHT_CAP_BACKPACK) || 0 : 0, carry = Cb.carryBonus ? Cb.carryBonus() : 0, ub = US && US.udzwig ? US.udzwig() : 0;
        const cParts = [chip("Podstawa", String(cap - bag - carry))];
        if (bag) cParts.push(chip("Plecak", "+" + bag, "good", icon(114)));
        cParts.push(chip("Siła " + at("str"), "+" + (carry - ub), carry - ub > 0 ? "good" : "dim"));
        if (ub) cParts.push(chip("Ubiór", "+" + ub, "good"));
        out.carry = { key: "carry", label: "Udźwig", tile: "UDŹWIG", value: String(cap), icon: 763, chips: cParts, desc: "Ile możesz nieść w plecaku i przy sobie." };
        // ---- the cards
        const combo = f.maxCombo ? f.maxCombo(wn) : (wn.combo || []).length, H = f.HEAVY || { mult: 2.2, full: 2.7 };
        const critBase = 0.03, critPer = 0.007 * (at("per") - A0), critW = ranged ? 0 : wn.crit || 0, critPk = perk("melee.crit"), critMul = tr.krytyk_mocniej || 1.6;
        const cost = Math.round((wn.cost || 0) * (1 - perk("melee.breath")));
        const walka = [
            { key: "weapon", label: "Broń", value: wName, chips: [],
                about: { icon: wIcon, desc: (() => { const it = $dataItems[ranged ? fi.weapon.id : wid]; return wid || ranged ? String((it && it.description) || "").replace(/\s+/g, " ").trim() : "Gołe pięści: szybkie, ale słabe. Broń wybierzesz w Ekwipunku albo w trybie walki ([ ])."; })(),
                    tags: String(T.call("Bron_Cechy", "slowa", wid) || "").split(/\s+·\s+|,\s+/).filter(Boolean).map(t => cap1(t)) },
                desc: "Broń w prawej ręce - ta z trybu walki." },
            ranged ? { key: "range", label: "Zasięg strzału", value: (fi.weapon.range || 0) + " pól", chips: [chip(wName, (fi.weapon.range || 0) + " pól", "", wIcon)], desc: "Jak daleko doleci strzał." }
                : { key: "heavy", label: "Silny cios", value: span(wn.dmg * sm * (1 + pk) * H.mult, tr.obrazenia), chips: [chip("Zwykły cios", span(wn.dmg * sm * (1 + pk), tr.obrazenia)), chip("Naładowany", "× " + num1c(H.mult)), chip("Do pełna", "× " + num1c(H.full), "good")],
                    desc: "Przytrzymaj atak i puść: wolniejszy, a mocniej zbija równowagę." },
            { key: "crit", label: "Krytyk", value: pc1(critBase + critPer + critW + critPk) + " · × " + num1c(critMul),
                chips: [chip("Podstawa", pc1(critBase)), attrChip("per", "Czujność", critPer, plusPc)].concat(critW ? [chip("Broń", plusPc(critW), "good")] : [], critPk ? [chip("Umiejętności", plusPc(critPk), "good")] : [], tr.krytyk_mocniej ? [chip("Cecha: mocniej", "× " + num1c(critMul), "good")] : []),
                desc: "Szansa na cios, który trafia mocniej (× " + num1c(critMul) + ")." },
            ranged ? { key: "aim", label: "Czas celowania", value: pc1(Cb.aimSteady ? Cb.aimSteady() : 1), chips: [attrChip("dex", "Zręczność", -0.01 * (at("dex") - A0), plusPc)].concat(perk("aim.speed") ? [chip("Umiejętności", "−" + pc1(perk("aim.speed")), "good")] : []), desc: "Jak długo zwęża się koło celowania (100% - zwykle)." }
                : { key: "reach", label: "Zasięg", value: num1c(wn.reach) + " pola", chips: [chip(wName, num1c(base.reach) + " pola", "", wIcon)].concat(tr.zasieg ? [chip("Cecha: zasięg", "+" + num1c(tr.zasieg), "good")] : []), desc: "Jak daleko sięga cios." },
            { key: "combo", label: "Seria ciosów", value: String(combo), chips: [chip(wName, String((wn.combo || []).length))].concat(skill("combo4") ? [chip("Umiejętność: dłuższa seria", "+1", "good")] : []), desc: "Ile ciosów pod rząd w jednej serii; kolejne biją mocniej." },
            { key: "cost", label: "Oddech na cios", value: String(ranged ? fi.weapon.breath || 0 : cost),
                chips: (ranged ? [chip(wName, String(fi.weapon.breath || 0), "", wIcon)] : [chip(wName, String(base.cost), "", wIcon)].concat(lack ? [chip("Kara: poziom " + (base.poziom || 1), "+" + pc1(lack), "bad")] : [], tr.oddech ? [chip("Cecha: lżejsza", "−" + tr.oddech, "good")] : [], perk("melee.breath") ? [chip("Umiejętności", "−" + pc1(perk("melee.breath")), "good")] : [])),
                desc: "Ile oddechu kosztuje jeden cios." }
        ];
        const parryF = Cb.parryWindow ? Cb.parryWindow() : 0, wPar = (T.call("Bron_Cechy", "heldTrait", "parowanie") || 0), sPar = shield && shield.parry > 0 ? shield.parry : 0;
        const cold = de.cold || 0, cloakName = worn(112) ? ($dataItems[112] || {}).name : "";
        const obrona = [
            { key: "parry", label: "Okno parowania", value: secs(parryF), chips: [chip("Podstawa", secs(8)), attrChip("per", "Czujność", 0.25 * (at("per") - A0) / 60, v => (v < 0 ? "−" : "+") + (Math.abs(v)).toFixed(2).replace(".", ",") + " s")]
                .concat(skill("keen") ? [chip("Umiejętność: czujne oko", "× 1,5", "good")] : [], sPar ? [chip("Tarcza", plusPc(sPar), "good")] : [], wPar ? [chip("Broń: parowanie", plusPc(wPar), "good")] : []),
                desc: "Tyle masz czasu, żeby sparować cios (blok tuż przed trafieniem)." },
            { key: "wound", label: "Szansa na ranę", value: pc1(de.wound), chips: [chip("Zwykła", "100%"), attrChip("con", "Kondycja", -0.014 * (at("con") - A0), plusPc)].concat(skill("thickskin") ? [chip("Gruba skóra", "× 0,5", "good")] : []),
                desc: "Szansa, że cios zostawi ranę (krwawienie, wolniejsze leczenie)." },
            { key: "knock", label: "Próg przewrócenia", value: String(de.knock), chips: [chip("Podstawa", "60"), chip("Kondycja " + at("con"), "+" + num1c(1.8 * (at("con") - A0)), at("con") > A0 ? "good" : "dim")].concat(perk("knock.resist") ? [chip("Umiejętności", plusPc(perk("knock.resist")), "good")] : []),
                desc: "Ile siły ciosu wytrzymasz, zanim cię przewróci." },
            { key: "roll", label: "Przewrót", value: de.rollCost + " oddechu", chips: [chip("Podstawa", "24"), chip("Zręczność " + at("dex"), "−" + num1c(0.25 * (at("dex") - A0)), at("dex") > A0 ? "good" : "dim")], desc: "Ile oddechu kosztuje unik przewrotem." },
            { key: "mind", label: "Opór umysłu", value: pc1(de.mind), chips: [chip("Podstawa", "15%"), attrChip("wil", "Hart ducha", 0.03 * (at("wil") - A0), plusPc)].concat(perk("mind.resist") ? [chip("Umiejętności", plusPc(perk("mind.resist")), "good")] : []),
                desc: "Szansa, że strach albo „prawda” upiora cię nie złamie." },
            { key: "cold", label: "Ciepło", value: de.cloak ? "pełne" : cold > 0 ? "+" + pc1(Math.min(1, cold)) : "brak", cls: de.cloak || cold > 0 ? "good" : "dim",
                chips: de.cloak ? [chip(cloakName || "Płaszcz", "nie marzniesz", "good", icon(112))] : cold > 0 ? [chip("Ubiór", "marzniesz o " + pc1(Math.min(1, cold)) + " mniej", "good")] : [chip("Bez płaszcza", "marzniesz", "bad")],
                desc: "Zimą i w śniegu bez ciepłego ubrania marzniesz." }
        ];
        const walk = (US && US.predkosc ? US.predkosc() : 0) + (worn(113) && S && S.BOOTS_SPEED ? S.BOOTS_SPEED - 1 : 0), neat = US && US.schludnosc ? US.schludnosc() : 0;
        const dexW = Cb.dexWork ? Cb.dexWork() - 1 : 0, gather = Cb.gatherBonus ? Cb.gatherBonus() : 0, tired = !!(Cb.tired && Cb.tired()), restB = Cb.restBonus ? Cb.restBonus() : perk("sleep.rest");
        const praca = [
            { key: "walk", label: "Chód", value: walk > 0.001 ? "+" + pc1(walk) : "zwykły", cls: walk > 0.001 ? "good" : "dim",
                chips: [].concat(worn(113) && S && S.BOOTS_SPEED ? [chip(($dataItems[113] || {}).name || "Buty", "+" + pc1(S.BOOTS_SPEED - 1), "good", icon(113))] : [], US && US.predkosc && US.predkosc() ? [chip("Ubiór", "+" + pc1(US.predkosc()), "good")] : []).concat(walk > 0.001 ? [] : [chip("Boso", "zwykły", "dim")]),
                desc: "O tyle szybciej chodzisz i biegasz." },
            { key: "rest", label: "Odpoczynek", value: restB > 0.0001 ? "+" + pc1(restB) : "zwykły", cls: restB > 0.0001 ? "good" : "dim",
                chips: [attrChip("wil", "Hart ducha", (Cb.REST_PER_WIL || 0.02) * Math.max(0, at("wil") - A0), plusPc)].concat(perk("sleep.rest") ? [chip("Umiejętności (Twardy sen)", plusPc(perk("sleep.rest")), "good")] : []),
                desc: "O tyle szybciej wraca kondycja, gdy siedzisz, leżysz albo śpisz." },
            { key: "neat", label: "Schludność", value: neat ? "+" + neat : "brak", cls: neat ? "good" : "dim", chips: [chip("Ubiór", neat ? "+" + neat : "brak", neat ? "good" : "dim")], desc: "Schludnie ubrany płacisz mniej i lepiej cię słuchają w mieście." },
            { key: "work", label: "Szybkość pracy", value: (tired ? "× 0,5 · " : "") + plusPc(dexW), cls: tired ? "bad" : dexW > 0 ? "good" : "dim",
                chips: [attrChip("dex", "Zręczność", dexW, plusPc)].concat(tired ? [chip("Zmęczenie", "× 0,5", "bad")] : []), desc: "Budowa, rąbanie, kopanie i kucie idą o tyle szybciej." },
            { key: "gather", label: "Uderzeń przy zbieraniu", value: "−" + pc1(gather), cls: gather > 0 ? "good" : "dim", chips: [attrChip("str", "Siła", -gather, plusPc)], desc: "Tylu uderzeń mniej trzeba na drzewo, skałę i rudę." },
            { key: "aimS", label: "Czas celowania", value: pc1(Cb.aimSteady ? Cb.aimSteady() : 1), cls: "", chips: [attrChip("dex", "Zręczność", -0.01 * (at("dex") - A0), plusPc)].concat(perk("aim.speed") ? [chip("Umiejętności", "−" + pc1(perk("aim.speed")), "good")] : []),
                desc: "Łuk i proca: jak długo zwęża się koło celowania (100% - zwykle)." }
        ].filter(s => !(ranged && s.key === "aimS"));
        return { tiles: [out.dmg, out.block, out.armor, out.hp, out.breath, out.carry],
            cards: [{ title: "Walka", icon: wIcon, rows: walka }, { title: "Obrona", icon: 804, rows: obrona }, { title: "Przetrwanie i praca", icon: 763, rows: praca }] };
    }
    // the places: the tiles' row, the three cards, the box at the foot (local menu places)
    const SL = () => {
        const R = RX(), x = R.lx, w = R.rx - R.lx, top = R.y0 + 102, bot = R.y1 - 16, tg = 16, tw = (w - tg * 5) / 6, cg = 20, cw = (w - cg * 2) / 3;
        return { x, w, top, bot, tile: i => ({ x: Math.round(x + i * (tw + tg)), y: top, w: Math.round(tw), h: 76 }), card: i => ({ x: Math.round(x + i * (cw + cg)), y: top + 90, w: Math.round(cw), h: 246 }),
            foot: { x, y: top + 350, w, h: bot - top - 350 }, row: 32, rowsTop: 52 };
    };
    function headingMid(b, cx, y, text, x0, x1, o) {
        o = o || {};
        const ctx = b.context, tw = measure(text, 20, "sc"), ew = o.extra ? measure(o.extra, 20, "sc") + 8 : 0, iw = o.icon ? 34 : 0, gw = iw + tw + ew;
        const gx = Math.round(cx - gw / 2), cy = y + 12;
        if (o.icon) CH.drawIcon(b, o.icon, gx, cy - 14, 28);
        tx(b, text, gx + iw, y, 20, { top: true, face: "sc", color: K.acc });
        if (o.extra) tx(b, o.extra, gx + iw + tw + 8, y, 20, { top: true, face: "sc", color: K.text });
        ctx.save();
        for (const side of [-1, 1]) {
            const dx = side < 0 ? gx - 16 : gx + gw + 16, end = side < 0 ? x0 : x1;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = K.acc;
            ctx.beginPath(); ctx.moveTo(dx, cy - 4); ctx.lineTo(dx + 4, cy); ctx.lineTo(dx, cy + 4); ctx.lineTo(dx - 4, cy); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
            const a = dx + side * 10;
            if ((end - a) * side > 8) {
                const g = ctx.createLinearGradient(a, 0, end, 0);
                g.addColorStop(0, "rgba(255,210,63,0.5)");
                g.addColorStop(1, "rgba(255,210,63,0)");
                ctx.fillStyle = g;
                ctx.fillRect(Math.round(Math.min(a, end)), Math.round(cy), Math.round(Math.abs(end - a)), 1);
            }
        }
        ctx.restore();
    }
    function StatsView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._at = { zone: "tiles", i: 0 };   // (zone: "tiles" or the card's index 0..2; i: the tile or the row)
    }
    StatsView.prototype = Object.create(View.prototype);
    StatsView.prototype.constructor = StatsView;
    StatsView.prototype.keys = function() { return [["W/S/A/D", "liczba"], ["P", "wróć"]]; };
    StatsView.prototype.chosen = function(m) {
        if (!m) return null;
        const a = this._at;
        return a.zone === "tiles" ? m.tiles[a.i] : (m.cards[a.zone] || { rows: [] }).rows[a.i] || null;
    };
    StatsView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, L = SL(), m = statsModel();
        b.clear();
        header(b, "Statystyki", this.inside ? "liczby tak, jak liczy je walka" : "podgląd");
        this._m = m;
        if (!m) { tx(b, "Statystyki się wczytują...", L.x + L.w / 2, L.top + 200, 21, { align: "center", color: K.muted }); done(b); return; }
        const sel = this.inside ? this.chosen(m) : null;
        // the tiles
        m.tiles.forEach((s, i) => {
            const t = L.tile(i), on = sel === s;
            fancyBox(ctx, t.x, t.y, t.w, t.h, { corners: false });
            if (on) { ctx.save(); ctx.shadowColor = "rgba(255,210,63,0.5)"; ctx.shadowBlur = 16; ctx.strokeStyle = K.acc; ctx.lineWidth = 2.5; CH.roundPath(ctx, t.x + 1, t.y + 1, t.w - 2, t.h - 2, 11); ctx.stroke(); ctx.restore(); }
            const vw = measure(s.value, 27, "bold"), lw = measure(s.tile, 15, "sc"), gw = 36 + 14 + Math.max(vw, lw), gx = Math.round(t.x + (t.w - gw) / 2), cy = t.y + t.h / 2;
            if (s.need && CH.drawNeed) CH.drawNeed(b, s.need, gx, cy - 18, 36); else if (s.icon) CH.drawIcon(b, s.icon, gx, cy - 18, 36);
            tx(b, s.value, gx + 50, cy - 9, 27, { face: "bold", color: s.cls === "dim" ? K.dim : K.text, max: t.w - 60 });
            tx(b, s.tile, gx + 50, cy + 16, 15, { face: "sc", color: K.muted });
        });
        // the cards
        m.cards.forEach((c, ci) => {
            const r = L.card(ci), x = r.x + 26, x1 = r.x + r.w - 26;
            fancyBox(ctx, r.x, r.y, r.w, r.h);
            headingMid(b, r.x + r.w / 2, r.y + 17, c.title.toUpperCase(), x, x1, { icon: c.icon });
            c.rows.forEach((s, i) => {
                const ry = r.y + L.rowsTop + i * L.row, on = sel === s, cy = ry + L.row / 2;
                if (on) selBar(ctx, x - 10, ry + 2, x1 - x + 20, L.row - 4, 7);
                else if (i < c.rows.length - 1) hl(ctx, x, x1, ry + L.row, "rgba(255,255,255,0.055)");
                tx(b, s.label, x, cy, 20, { color: on ? K.sel : K.soft, max: x1 - x - 130 });
                const col = on ? K.sel : s.cls === "good" ? K.good : s.cls === "bad" ? K.warn : s.cls === "dim" ? K.dim : K.text;
                tx(b, s.value, x1, cy, 20, { face: "bold", align: "right", color: col, max: 200 });
            });
        });
        // the foot: where the chosen number comes from
        const F0 = L.foot, fx = F0.x + 26, fx1 = F0.x + F0.w - 26;
        fancyBox(ctx, F0.x, F0.y, F0.w, F0.h);
        const s = sel || m.tiles[0];
        // (the user: "SKĄD TO SIĘ BIERZE (ODDECH)" in the middle, under it what the number means, under that the reckoning; the weapon:
        // "O BRONI (its name)", its words from the game, its traits)
        const fcx = F0.x + F0.w / 2, title = s.about ? "O BRONI" : "SKĄD TO SIĘ BIERZE", extra = "(" + String(s.about ? s.value : s.label).toUpperCase() + ")";
        headingMid(b, fcx, F0.y + 14, title, fx, fx1, { extra });
        const words = s.about ? s.about.desc || "" : s.desc || "";
        if (s.about && s.about.icon) {
            const ww = Math.min(measure(words, 18, "regular"), fx1 - fx - 60), ix = Math.round(fcx - (ww + 40) / 2);
            CH.drawIcon(b, s.about.icon, ix, F0.y + 45, 28);
            tx(b, words, ix + 40, F0.y + 59, 18, { face: "regular", color: K.soft, max: fx1 - ix - 40 });
        } else tx(b, words, fcx, F0.y + 59, 18, { align: "center", face: "regular", color: K.soft, max: fx1 - fx });
        this._chips = s.about ? this.drawAbout(b, fx, fx1, F0.y + 80, s.about) : this.drawChips(b, fx, fx1, F0.y + 80, s);
        this._sel = s ? s.key : null;
        done(b);
    };
    // "O BRONI": its icon and its words (two lines at most) on the left, its traits as small tags on the right
    StatsView.prototype.drawAbout = function(b, x, x1, y, a) {
        const ctx = b.context, th = 34, tsz = 17, tags = (a.tags || []).map(t => ({ t, w: measure(t, tsz) + 26 })), gap = 10;
        const tagsW = tags.reduce((s, q) => s + q.w + gap, 0) - (tags.length ? gap : 0);
        if (!tags.length) { tx(b, "Bez cech szczególnych.", (x + x1) / 2, y + 20, 17, { align: "center", color: K.dim }); return [a.desc || ""]; }
        let cx = Math.round((x + x1 - tagsW) / 2);
        y -= 4;
        for (const q of tags) {
            rr(ctx, cx, y + 8, q.w, th, th / 2, "rgba(143,209,122,0.12)");
            ctx.save(); ctx.strokeStyle = "rgba(143,209,122,0.45)"; ctx.lineWidth = 1; CH.roundPath(ctx, cx + 0.5, y + 8.5, q.w - 1, th - 1, th / 2); ctx.stroke(); ctx.restore();
            tx(b, q.t, cx + q.w / 2, y + 8 + th / 2, tsz, { align: "center", color: K.good });
            cx += q.w + gap;
        }
        return [a.desc || ""].concat(tags.map(q => q.t));
    };
    // the chips of a number: [icon] name value, side by side, "=" and the number itself in gold at the end (smaller when they do not fit)
    StatsView.prototype.drawChips = function(b, x, x1, y, s) {
        const ctx = b.context, h = 40, all = (s.chips || []).slice(), res = { name: s.label, val: s.value, cls: "res" };
        let size = 18, gap = 10;
        const widthOf = (c, sz) => (c.icon ? 34 : 0) + measure(c.name, sz) + (c.val ? 9 + measure(c.val, sz, "bold") : 0) + 28;
        const total = sz => all.reduce((a, c) => a + widthOf(c, sz) + gap, 0) + 30 + widthOf(res, sz);
        while (total(size) > x1 - x && size > 14) size--;
        let cx = Math.max(x, Math.round((x + x1 - total(size)) / 2));
        const drawn = [];
        const one = (c, gold) => {
            const w = widthOf(c, size);
            rr(ctx, cx, y, w, h, 10, "#1b1d22");
            ctx.save(); ctx.strokeStyle = gold ? "rgba(255,210,63,0.55)" : "#2c2b28"; ctx.lineWidth = 1; CH.roundPath(ctx, cx + 0.5, y + 0.5, w - 1, h - 1, 10); ctx.stroke(); ctx.restore();
            let ix = cx + 14;
            if (c.icon) { CH.drawIcon(b, c.icon, ix, y + 7, 26); ix += 34; }
            ix += tx(b, c.name, ix, y + h / 2, size, { color: gold ? K.acc : K.muted }) + 9;
            if (c.val) tx(b, c.val, ix, y + h / 2, size, { face: "bold", color: gold ? K.acc : c.cls === "good" ? K.good : c.cls === "bad" ? K.warn : c.cls === "dim" ? K.dim : K.text });
            drawn.push(c.name + (c.val ? " " + c.val : ""));
            cx += w + gap;
        };
        for (const c of all) one(c);
        tx(b, "=", cx + 6, y + h / 2, 22, { face: "bold", color: K.dim });
        cx += 30;
        one(res, true);
        return drawn;
    };
    StatsView.prototype.update = function() {
        if (!this.ready()) return;
        for (const [k, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
            if (Input.isRepeated(k)) { this.move(dx, dy); return; }
        }
    };
    // W / S / A / D: along the tiles; down from a tile into the card under it; along a card's rows; across the cards on the same row;
    // up from a card's first row back to the tiles
    StatsView.prototype.move = function(dx, dy) {
        const m = this._m || statsModel(), a = this._at;
        if (!m) return;
        let z = a.zone, i = a.i;
        if (z === "tiles") {
            if (dx) i = Math.max(0, Math.min(m.tiles.length - 1, i + dx));
            else if (dy > 0) { z = Math.min(2, Math.floor(i / 2)); i = 0; }
        } else {
            const n = m.cards[z].rows.length;
            if (dy < 0) { if (i === 0) { i = Math.min(m.tiles.length - 1, z * 2); z = "tiles"; } else i--; }
            else if (dy > 0) i = Math.min(n - 1, i + 1);
            else { const nz = Math.max(0, Math.min(2, z + dx)); if (nz !== z) { z = nz; i = Math.min(i, m.cards[z].rows.length - 1); } }
        }
        if (z === a.zone && i === a.i) return;
        this._at = { zone: z, i };
        SoundManager.playCursor();
        this.redraw();
    };
    StatsView.prototype.touch = function(x, y) {
        const L = SL(), m = this._m;
        if (!m) return;
        for (let i = 0; i < m.tiles.length; i++) { const t = L.tile(i); if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { this._at = { zone: "tiles", i }; SoundManager.playCursor(); this.redraw(); return; } }
        for (let ci = 0; ci < 3; ci++) {
            const r = L.card(ci), k = Math.floor((y - r.y - L.rowsTop) / L.row);
            if (x >= r.x && x <= r.x + r.w && k >= 0 && k < m.cards[ci].rows.length) { this._at = { zone: ci, i: k }; SoundManager.playCursor(); this.redraw(); return; }
        }
    };
    StatsView.prototype.leave = function() { this._at = { zone: "tiles", i: 0 }; };
    StatsView.prototype.info = function() {
        const m = this._m;
        return { staty: m ? { sel: this.inside ? this._sel : null, at: Object.assign({}, this._at), tiles: m.tiles.map(s => s.tile + ": " + s.value),
            cards: m.cards.map(c => ({ title: c.title, rows: c.rows.map(s => s.label + ": " + s.value) })), chips: this.inside ? (this._chips || []).slice() : [] } : null };
    };

    // ---------------------------------------------------------------- Ekwipunek: the thing's card | the silhouette | what fits
    // the silhouette (the user: "postać może być bez ubrania, tylko sylwetka linia"): a man seen from the front drawn with one line -
    // its right half from the neck down round the arm and the leg to the crotch (x from the middle, y from the crown, SK x), the left
    // half its mirror; the head a ring over it
    const SIL = [[9, 50], [10, 60], [30, 66], [50, 72], [58, 86], [64, 130], [70, 175], [74, 192], [70, 206], [62, 204], [58, 180], [52, 135], [46, 100],
        [40, 130], [36, 160], [42, 190], [40, 240], [36, 290], [36, 318], [46, 330], [14, 332], [14, 318], [12, 270], [6, 210], [0, 202]];
    const SK = 1.3;
    const figPlace = () => { const c = cols(3)[1]; return { cx: c.cx, top: c.top + 34 }; };
    function silPath(ctx, cx, top) {
        const pts = SIL.map(([x, y]) => [cx + x * SK, top + y * SK]).concat(SIL.slice(0, -1).reverse().map(([x, y]) => [cx - x * SK, top + y * SK]));
        const n = pts.length, mid = (a, c) => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], m0 = mid(pts[n - 1], pts[0]);
        ctx.beginPath();
        ctx.moveTo(m0[0], m0[1]);
        for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
        ctx.closePath();
    }
    function drawSilhouette(ctx, cx, top) {
        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(205,200,188,0.5)";
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        silPath(ctx, cx, top);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, top + 26 * SK, 20 * SK, 25 * SK, 0, 0, Math.PI * 2);
        ctx.fillStyle = K.panel2;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    // the places on the silhouette: the middle of each box (SIL's units: x from the middle, y from the crown); the right hand on the
    // screen's right
    const SLOT_AT = { head: [0, 26], extra: [0, 80], torso: [0, 128], belt: [0, 176], legs: [0, 256], feet: [0, 322],
        cloak: [-46, 74], back: [46, 74], hands: [-64, 152], left: [-72, 202], right: [72, 202] };
    const ORDER = ["head", "extra", "torso", "belt", "legs", "feet", "cloak", "back", "hands", "left", "right"];
    const BOX = 46;
    function eqCells() {
        const fp = figPlace();
        return ORDER.map(id => { const [sx, sy] = SLOT_AT[id]; const mx = Math.round(fp.cx + sx * SK), my = Math.round(fp.top + sy * SK); return { id, g: 0, mx, my, x: mx - BOX / 2, y: my - BOX / 2 }; });
    }
    // each place's neighbour up / down / left / right, set by hand so the keys go where the eye does
    const NAV = {
        head: ["", "extra", "cloak", "back"], extra: ["head", "torso", "cloak", "back"], cloak: ["head", "hands", "", "extra"], back: ["head", "right", "extra", ""],
        torso: ["extra", "belt", "hands", "back"], hands: ["cloak", "left", "", "torso"], belt: ["torso", "legs", "left", "right"],
        left: ["hands", "legs", "", "belt"], right: ["back", "legs", "belt", ""], legs: ["belt", "feet", "left", "right"], feet: ["legs", "", "left", "right"]
    };
    const BARE = { head: "głowa zostaje odkryta", cloak: "bez płaszcza", torso: "bez niczego na grzbiecie", hands: "gołe ręce", belt: "bez pasa",
        legs: "bez spodni", feet: "boso", back: "nic na plecach", left: "wolna ręka", extra: "nic" };
    // what the worn things give, summed (kept for the callers - MenuRing.totals; not drawn on a page now)
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
    // a thing's bonuses, each its own line (the user: "każdy bonus w nowej linii"): its note cut at " · ", ", " and "; " (a key's hint -
    // "[ ] zmienia w trybie walki" - is no bonus: left out); a penalty is drawn red
    const bonusLines = note => String(note || "").split(/\s+·\s+|,\s+|;\s+/).map(s => cap1(s.trim().replace(/\.$/, ""))).filter(s => s && !/^\[/.test(s));
    const isMinus = l => /słabiej|wolniej o|^-|^−/.test(l) && !/pragnienie rośnie/.test(l);
    function EquipView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._cell = "head";
        this._mode = "cells";  // cells | list (what fits the chosen place)
        this._row = 0;
        this._rows = [];
        this._note = "";
    }
    EquipView.prototype = Object.create(View.prototype);
    EquipView.prototype.constructor = EquipView;
    EquipView.prototype.keys = function() {
        if (this._mode === "list") return [["W/S", "rzecz"], ["O", "załóż"], ["P", "wróć do miejsc"]];
        return [["W/S/A/D", "miejsce"], ["O", "wybierz rzecz"], ["X", "zdejmij"], ["P", "wróć"]];
    };
    EquipView.prototype.cur = function() { return eqCells().find(c => c.id === this._cell) || eqCells()[0]; };
    EquipView.prototype.slotDef = function(id) { const E = T.api("Equipment"); return E ? E.SLOTS.find(s => s.id === (id || this._cell)) || {} : {}; };
    // what the chosen place can take from the bag (worn marked), and "Nic" (the right hand: the fists are among them)
    EquipView.prototype.makeRows = function(slot) {
        const E = T.api("Equipment"), S = T.api("Survival");
        slot = slot || this._cell;
        if (!E) return [];
        const rows = E.choices(slot).map(c => Object.assign({ act: "on", weight: c.id && item(c.id) && S && S.itemWeight ? S.itemWeight(item(c.id)) : 0 }, c));
        if (slot !== "right" && (rows.length || E.current(slot))) {
            const torch = slot === "left" && E.current("left") === E.TORCH;
            rows.push({ act: "off", id: 0, name: "Nic", icon: 0, note: torch ? "pochodnię wbijesz w ziemię" : BARE[slot] || "nic", worn: !E.current(slot), weight: 0 });
        }
        return rows;
    };
    EquipView.prototype.refresh = function() { this._mode = "cells"; this._note = ""; this.redraw(); };
    EquipView.prototype.leave = function() { this._mode = "cells"; this._note = ""; this._mx = undefined; };
    EquipView.prototype.cancel = function() {
        if (this._mode !== "list") return false;
        SoundManager.playCancel();
        this._mode = "cells";
        this.redraw();
        return true;
    };
    EquipView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, [A, S, Lc] = cols(3), E = T.api("Equipment");
        b.clear();
        header(b, "Ekwipunek", !this.inside ? "podgląd" : this._mode === "list" ? "wybierasz, co założyć" : "działa tylko to, co założone");
        boxOf(ctx, A);
        boxOf(ctx, S);
        boxOf(ctx, Lc);
        const slots = {};
        if (E) for (const sl of E.slots()) slots[sl.id] = sl;
        this._slots = slots;
        if (this._mode !== "list") this._rows = this.makeRows();
        this.drawStage(b, S);
        this._card = this.drawCard(b, A);
        this.drawList(b, Lc);
        done(b);
    };
    // ---- the middle box: the silhouette and the places on it (a place: its thing's icon; the chosen one: a yellow frame)
    EquipView.prototype.drawStage = function(b, c) {
        const ctx = b.context, fp = figPlace(), slots = this._slots, list = this._mode === "list", row = list ? this._rows[this._row] : null;
        drawSilhouette(ctx, fp.cx, fp.top);
        if (!T.api("Equipment")) { tx(b, "Ekwipunek się wczytuje...", c.cx, c.top + 200, 21, { align: "center", color: K.muted }); return; }
        for (const q of eqCells()) {
            const sl = slots[q.id] || {}, on = this.inside && q.id === this._cell, has = !!sl.icon && !(q.id === "right" && sl.hand === "m0");
            ctx.save();
            if (on) { ctx.shadowColor = "rgba(255,210,63,0.55)"; ctx.shadowBlur = 12; }
            rr(ctx, q.x, q.y, BOX, BOX, 9, has ? K.cell : "rgb(17,18,21)");
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = on ? K.acc : has ? "rgba(205,200,188,0.55)" : "rgba(205,200,188,0.32)";
            ctx.lineWidth = on ? 3 : 1.5;
            CH.roundPath(ctx, q.x + 0.75, q.y + 0.75, BOX - 1.5, BOX - 1.5, 9);
            ctx.stroke();
            ctx.restore();
            const tryIcon = on && row && row.icon && !row.worn ? row.icon : 0;   // (the thing being chosen, on trial)
            if (tryIcon) CH.drawIcon(b, tryIcon, q.x + 5, q.y + 5, 36, null, 0.55);
            else if (has) CH.drawIcon(b, sl.icon, q.x + 5, q.y + 5, 36);
        }
    };
    // what a thing is and does: its words (up to 4 lines), its bonuses (each a line), the wear, the weight
    EquipView.prototype.thingWords = function(id, note, w, fists) {
        const D = T.api("Durability"), S = T.api("Survival"), it = id ? item(id) : null;
        const desc = it ? String(it.description || "").replace(/\s+/g, " ").trim() : fists ? "Gołe pięści: szybkie, ale słabe. Broń wybierasz też w trybie walki ([ ])." : "";
        let wear = null;
        if (id && D && D.TOOLS && D.TOOLS[id] && D.lifeOf) {
            const left = Math.max(0, Math.round(D.left(id))), life = D.lifeOf(id), unit = D.TOOLS[id].unit === "wear" ? "dni" : D.unitWord ? D.unitWord(id, left) : "";
            wear = { left, life, text: left + " / " + life + (unit ? " " + unit : "") };
        }
        return { desc: wrapWords(desc, 17, w, "regular").slice(0, 4), bonus: bonusLines(note), wear, weight: it && S && S.itemWeight ? S.itemWeight(it) : 0 };
    };
    // ---- the left box: the card of the thing looked at - on the chosen place, or the row chosen in the list
    // ---- the comparison (2026-11-18, mock-up C): each bonus of the thing chosen in the list against the same one of the thing on the
    // place - its number and the change (▲ better, ▼ worse; a cost, the breath, the weight: less is better); what only one of them has
    // stands as "nowe" / "traci"; the penalties (słabiej o...) red under them
    const CMP_RE = /^(.*?)\s*([+\-−]?\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*(%|s|pól|pola)?$/;
    const LESS_IS_BETTER = /oddech|waga|koszt/i;
    function parseBonus(l) {
        const m = CMP_RE.exec(l);
        if (!m || !m[1].trim()) return { label: l, key: l.toLowerCase(), text: true, shown: "" };
        const a = parseFloat(m[2].replace("−", "-").replace(",", ".")), z = m[3] ? parseFloat(m[3].replace(",", ".")) : null, label = m[1].trim();
        return { label: cap1(label), key: label.toLowerCase(), val: z !== null ? (a + z) / 2 : a, shown: l.slice(m[1].length).trim(), unit: m[4] || "" };
    }
    const numPl = v => String(Math.round(v * 10) / 10).replace(".", ",");
    // a small filled triangle (up: better, down: worse) - x its left, cy its middle
    function tri(ctx, x, cy, up, col, sz) {
        const s2 = (sz || 10) / 2;
        ctx.save();
        ctx.fillStyle = col;
        ctx.beginPath();
        if (up) { ctx.moveTo(x, cy + s2 * 0.8); ctx.lineTo(x + s2 * 2, cy + s2 * 0.8); ctx.lineTo(x + s2, cy - s2); }
        else { ctx.moveTo(x, cy - s2 * 0.8); ctx.lineTo(x + s2 * 2, cy - s2 * 0.8); ctx.lineTo(x + s2, cy + s2); }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    // a text that may start with "▲ " / "▼ ": the triangle drawn, then the rest; align "right" (x its right end) or "left"
    function arrowTx(b, text, x, cy, size, col, align, face) {
        const m = /^([▲▼])\s*(.*)$/.exec(String(text)), rest = m ? m[2] : String(text), tw = measure(rest, size, face || "bold"), tw2 = m ? tw + 15 : tw;
        const x0 = align === "right" ? x - tw2 : x;
        if (m) tri(b.context, x0, cy, m[1] === "▲", col, 10);
        tx(b, rest, x0 + (m ? 15 : 0), cy, size, { face: face || "bold", color: col });
    }
    // -> { rows: [{ label, shown, delta, cls }], minus: [penalty lines], score } or null (nothing to set it against: the same thing)
    EquipView.prototype.compare = function(r, sl) {
        const S = T.api("Survival"), weightOf = id => (id && item(id) && S && S.itemWeight ? S.itemWeight(item(id)) : 0);
        const mine = r.act === "off" ? [] : bonusLines(r.note), theirs = sl && sl.name ? bonusLines(sl.note) : [];
        const minus = mine.filter(isMinus), A = mine.filter(l => !isMinus(l)).map(parseBonus), B = theirs.filter(l => !isMinus(l)).map(parseBonus);
        const wA = r.act === "off" ? 0 : weightOf(r.id), wB = sl && sl.name ? weightOf(sl.item) : 0;
        if (wA || wB) { A.push({ label: "Waga", key: "waga", val: wA, shown: weightTxt(wA), unit: "" }); B.push({ label: "Waga", key: "waga", val: wB, shown: weightTxt(wB), unit: "" }); }
        const rows = [];
        let score = 0;
        for (const a of A) {
            const o = B.find(q => q.key === a.key);
            if (a.text || !o || o.text) { rows.push({ label: a.label, shown: a.shown, delta: o && o.text ? "=" : "nowe", cls: o && o.text ? "dim" : "good" }); if (!o) score++; continue; }
            const d = a.val - o.val, dir = LESS_IS_BETTER.test(a.key) ? -d : d;
            if (Math.abs(d) < 1e-9) { rows.push({ label: a.label, shown: a.shown, delta: "=", cls: "dim" }); continue; }
            rows.push({ label: a.label, shown: a.shown, delta: (dir > 0 ? "▲ " : "▼ ") + (d > 0 ? "+" : "−") + numPl(Math.abs(d)) + (a.unit === "%" ? "%" : ""), cls: dir > 0 ? "good" : "bad" });
            score += (dir > 0 ? 1 : -1) * (/obrażenia|strzał|blok|obrona|zbroja/.test(a.key) ? 2 : 1);
        }
        for (const o of B) if (!A.find(q => q.key === o.key)) { rows.push({ label: o.label, shown: "—", delta: "traci", cls: "bad" }); score--; }
        return { rows, minus, score };
    };
    EquipView.prototype.drawCard = function(b, c) {
        const ctx = b.context, x = c.x + PAD, w = c.w - PAD * 2, x1 = x + w, E = T.api("Equipment"), slot = this._cell, list = this._mode === "list";
        if (!this.inside) {   // (the preview: what the page is for)
            const lines = wrapWords("Wybierz miejsce na sylwetce: tu zobaczysz, co na nim jest, a po prawej - co możesz tam założyć.", 18, w);
            lines.forEach((l, i) => tx(b, l, x, c.top + 22 + i * 24, 18, { top: true, color: K.muted }));
            return null;
        }
        const sl = (this._slots || {})[slot] || {}, def = this.slotDef(), hand = slot === "right" || slot === "left";
        const worn = !!sl.name, fists = slot === "right" && sl.hand === "m0", r = list ? this._rows[this._row] : null;
        let y = c.top + 18;
        heading(b, x, y, (def.label || slot).toUpperCase(), x1 - 110);
        tx(b, list ? "WYBIERASZ" : worn ? (hand ? "W RĘCE" : "ZAŁOŻONE") : "PUSTO", x1, y + 1, 15, { top: true, face: "sc", align: "right", color: K.muted });
        y += 40;
        let name = "", icon = 0, words = null;
        if (list && r) {
            name = r.name; icon = r.icon || 0;
            words = r.act === "off" ? { desc: [], bonus: bonusLines(r.note), wear: null, weight: 0 } : this.thingWords(r.id || 0, r.note || "", w, false);
        } else if (worn) {
            name = sl.name; icon = sl.icon || 0;
            words = this.thingWords(sl.item || 0, sl.note || "", w, fists);
        }
        if (icon) CH.drawIcon(b, icon, x, y, 48);
        const nameLines = wrapWords(name || "pusto", 22, w - (icon ? 60 : 0), "bold").slice(0, 2);
        nameLines.forEach((l, i) => tx(b, l, x + (icon ? 60 : 0), y + (nameLines.length > 1 ? 12 + i * 24 : 24), 22, { face: "bold", color: name ? K.text : K.muted, max: w - (icon ? 60 : 0) }));
        y += 62;
        const out = { title: name || "pusto", lines: [], bonus: [], wear: "", weight: 0, note: this._note || "" };
        const cmp = list && r && !r.worn ? this.compare(r, sl) : null;
        if (cmp) {
            for (const l of words.desc.slice(0, 2)) { tx(b, l, x, y, 17, { top: true, face: "regular", color: K.soft }); y += 22; out.lines.push(l); }
            y += 10;
            heading(b, x, y, "PORÓWNANIE", x1);
            y += 30;
            tx(b, worn ? "z tym, co masz: " + sl.name : "teraz nic tu nie masz", x, y, 16, { top: true, color: K.muted, max: w });
            y += 26;
            out.compare = [];
            for (const q of cmp.rows.slice(0, 8)) {
                const col = q.cls === "good" ? K.good : q.cls === "bad" ? K.warn : K.dim;
                tx(b, q.label, x, y, 18, { top: true, color: K.soft, max: w - 170 });
                tx(b, q.shown, x1 - 92, y, 18, { top: true, face: "bold", align: "right", max: 90 });
                arrowTx(b, q.delta, x1, y + 10, 16, col, "right");
                y += 27;
                out.compare.push(q.label + ": " + q.shown + " " + q.delta);
            }
            for (const l of cmp.minus.slice(0, 2)) { y += 4; tx(b, l, x, y, 17, { top: true, color: K.warn, max: w }); y += 22; }
            out.bonus = words.bonus.slice();
        } else if (words) {
            for (const l of words.desc) { tx(b, l, x, y, 17, { top: true, face: "regular", color: K.soft }); y += 22; out.lines.push(l); }
            if (words.desc.length) y += 8;
            for (const l of words.bonus.slice(0, 8)) {
                const col = isMinus(l) ? K.warn : K.good, parts = wrapWords(l, 18, w - 16).slice(0, 2);
                rr(ctx, x + 2, y + 9, 6, 6, 3, col);
                parts.forEach((q, i) => tx(b, q, x + 16, y + i * 21, 18, { top: true, color: col, max: w - 16 }));
                y += 25 + (parts.length - 1) * 21;
                out.bonus.push(l);
                out.lines.push(l);
            }
            if (words.wear || words.weight) { y += 6; hl(ctx, x, x1, y); y += 10; }
            if (words.wear) {
                const k = words.wear.left / Math.max(1, words.wear.life);
                tx(b, "Zużycie", x, y, 17, { top: true, color: K.muted });
                tx(b, words.wear.text, x1, y, 17, { top: true, face: "bold", align: "right", color: k > 0.5 ? K.text : k > 0.2 ? K.amber : K.warn });
                y += 26;
                out.wear = words.wear.text;
            }
            if (words.weight) {
                tx(b, "Waga", x, y, 17, { top: true, color: K.muted });
                tx(b, weightTxt(words.weight), x1, y, 17, { top: true, face: "bold", align: "right" });
                y += 26;
                out.weight = words.weight;
            }
        } else {   // (nothing on the place: where to get a thing for it)
            const own = E ? E.choices(slot).filter(ch => !ch.worn).length : 0;
            const hint = own ? "Wybierz z listy po prawej (O)." : String(T.call("Ubior_Data", "podpowiedz", slot) || cap1(String(sl.note || "").replace(/Enter/g, "O")) || "Nic tu nie masz.");
            for (const l of wrapWords(hint, 17, w, "regular").slice(0, 4)) { tx(b, l, x, y, 17, { top: true, face: "regular", color: K.muted }); y += 22; out.lines.push(l); }
        }
        if (this._note) { y += 6; for (const l of wrapWords(this._note, 18, w).slice(0, 2)) { tx(b, l, x, y, 18, { top: true, color: K.warn }); y += 24; } }
        return out;
    };
    // ---- the right box: what fits the chosen place from the bag (W / S along it after O; "Nic" takes off)
    const LROW = 44;
    EquipView.prototype.drawList = function(b, c) {
        const ctx = b.context, x = c.x + PAD, w = c.w - PAD * 2, x1 = x + w, list = this._mode === "list", rows = this._rows, def = this.slotDef();
        const hand = this._cell === "right" || this._cell === "left";
        this._listBox = null;
        let y = c.top + 18;
        if (!this.inside) {   // (the preview: what the box will hold)
            heading(b, x, y, "DO ZAŁOŻENIA", x1);
            wrapWords("Rzeczy z plecaka, które pasują na wybrane miejsce.", 18, w).forEach((l, i) => tx(b, l, x, y + 40 + i * 24, 18, { top: true, color: K.muted }));
            return;
        }
        heading(b, x, y, "DO ZAŁOŻENIA", x1, rows.filter(q => q.act !== "off" && !q.worn).length);
        y += 40;
        if (!rows.length) {
            const why = def.items && !def.items.length && !def.hand ? "W grze nie ma jeszcze nic na tę część ciała." : "Nie masz w torbie nic, co tu pasuje.";
            for (const l of wrapWords(why, 17, w, "regular").slice(0, 3)) { tx(b, l, x, y, 17, { top: true, face: "regular", color: K.muted }); y += 22; }
            return;
        }
        const vis = Math.max(1, Math.floor((c.bot - 12 - y) / LROW)), n = rows.length, sl = (this._slots || {})[this._cell] || {};
        const top = list ? Math.max(0, Math.min(this._row - vis + 1, n - vis)) : 0;
        this._rowTop = top;
        this._listBox = { x: x - 10, w: w + 20, y, row: LROW, vis };
        rows.slice(top, top + vis).forEach((q, k) => {
            const i = top + k, ry = y + k * LROW, on = list && i === this._row, cy = ry + LROW / 2;
            if (on) selBar(ctx, x - 10, ry + 2, w + 20, LROW - 4, 8);
            if (q.icon) CH.drawIcon(b, q.icon, x, cy - 16, 32);
            else tx(b, "–", x + 16, cy, 22, { align: "center", color: on ? K.sel : K.dim });
            let mark = q.worn && q.act !== "off" ? (hand ? "w ręce" : "na sobie") : "", mcol = on ? K.selMuted : K.acc;
            if (!mark && q.act !== "off" && sl.name) {   // (against what is on the place: better or weaker, all told)
                const sc = this.compare(q, sl).score;
                if (sc > 0) { mark = "▲ lepiej"; mcol = on ? K.sel : K.good; } else if (sc < 0) { mark = "▼ słabiej"; mcol = on ? K.sel : K.warn; }
            }
            if (mark) {
                tx(b, q.name, x + 44, cy - 9, 18, { face: "bold", color: on ? K.sel : K.text, max: w - 44 });
                arrowTx(b, mark, x + 44, cy + 11, 15, mcol, "left", "regular");
            } else tx(b, q.name, x + 44, cy, 18, { face: "bold", color: on ? K.sel : list ? K.text : K.soft, max: w - 44 });
        });
        if (n > top + vis) tx(b, "▾ jeszcze " + (n - top - vis), x1, c.bot - 10, 15, { align: "right", color: K.muted });
    };
    EquipView.prototype.update = function() {
        if (!this.ready()) return;
        if (this.mouseMoved() && this._mode === "cells") {
            const p = touchAt(), q = this.cellAt(p.x, p.y);
            if (q && q.id !== this._cell) { this._cell = q.id; this._note = ""; this.redraw(); }
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
    };
    EquipView.prototype.cellAt = function(x, y) { return eqCells().find(q => x >= q.x - 4 && x <= q.x + BOX + 4 && y >= q.y - 4 && y <= q.y + BOX + 4) || null; };
    EquipView.prototype.move = function(dx, dy) {
        const to = (NAV[this._cell] || [])[dy < 0 ? 0 : dy > 0 ? 1 : dx < 0 ? 2 : 3];
        if (!to) return;
        this._cell = to;
        this._note = "";
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
        const lb = this._listBox;
        if (lb && x >= lb.x && x <= lb.x + lb.w && y >= lb.y && y < lb.y + lb.vis * lb.row) {   // (a row of the list: chosen, again - on)
            const i = (this._rowTop || 0) + Math.floor((y - lb.y) / lb.row);
            if (i < this._rows.length) {
                if (this._mode !== "list") { this.openList(); if (this._mode === "list") { this._row = i; this.redraw(); } return; }
                if (i === this._row) this.choose(); else { this._row = i; SoundManager.playCursor(); this.redraw(); }
            }
            return;
        }
        const q = this.cellAt(x, y);
        if (!q) return;
        if (this._mode === "list") { this._mode = "cells"; this._cell = q.id; SoundManager.playCancel(); this.redraw(); this.scene.drawKeys(); return; }
        if (q.id === this._cell) this.openList();
        else { this._cell = q.id; this._note = ""; SoundManager.playCursor(); this.redraw(); }
    };
    EquipView.prototype.info = function() {
        const E = T.api("Equipment");
        return { equip: { cell: this.inside ? this._cell : null, mode: this._mode, row: this._row, note: this._note,
            rows: this._rows.map(r => ({ act: r.act, id: r.id, name: r.name, worn: !!r.worn, weight: r.weight || 0 })), card: this.inside ? this._card || null : null,
            list: this._listBox ? { y: this._listBox.y, row: this._listBox.row, top: this._rowTop || 0, x: this._listBox.x + 80, vis: this._listBox.vis } : null,
            slots: E ? E.slots().map(s => ({ id: s.id, item: s.item, name: s.name, none: s.none })) : null, cells: eqCells().map(q => q.id) } };
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
            const addRecipe = r => { add(r.inputs); for (const g of r.any || []) add(g.ids.map(i => [i])); };   // (r.any: the string's flax or nettle)
            const F = T.api("Farming");
            if (F && F.BUILDINGS) for (const b of Object.values(F.BUILDINGS)) { add(b.cost); for (const r of b.recipes || []) addRecipe(r); }
            if (F && F.HAND_RECIPES) for (const r of F.HAND_RECIPES) addRecipe(r);
        }
        return useCount[id] || 0;
    }
    // what is sown or planted: the field crops' seeds (Farming.CROPS) and the planted trees' (Forestry: the apple pips)
    function isSeedItem(id) {
        const F = T.api("Farming"), Fo = T.api("Forestry");
        if (F && F.CROPS && Object.values(F.CROPS).some(c => c.seed === id)) return true;
        return !!(Fo && Fo.SPECIES && Object.values(Fo.SPECIES).some(s => s.seed === id && s.sown));
    }
    function groupOf(it, quest) {
        if (isKeep(it)) return "keep";
        const E = T.api("Equipment");
        if (it.itypeId === 2 || TOOL_LIKE.has(it.id) || (E && E.WEARABLE && E.WEARABLE[it.id])) return "tools";
        if ((it.meta && it.meta.Drink !== undefined) || DRINKS.has(it.id)) return "drink";
        if (isFoodItem(it) || perishable(it) || (it.meta && it.meta.Butcher !== undefined)) return "food";
        if (/^Nasiona/.test(it.name) || isSeedItem(it.id)) return "seed";   // (2026-11-19: Dymka cebuli, Ząbki czosnku, Pestki jabłoni too)
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
            if (on) { if (act) selBar(c.context, r.x, r.y, r.width, BAGL.row - 2, 8); else rr(c.context, r.x, r.y, r.width, BAGL.row - 2, 8, K.accDim); }
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

    CZESCI.pages = { PostacView, StatsView, statsModel, eqCells, totals, EquipView, SkillsView, SORTS, bagSort, GROUPS, groupOf, equipSlotOf, sortBag,
        BAGW, BagView };
})();
