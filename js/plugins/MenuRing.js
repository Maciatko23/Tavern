//=============================================================================
// MenuRing.js
//=============================================================================
// The P menu - the game's one look (UITheme.js's palette, docs/UI_JEDEN_WYGLAD.md): the pages of the user's "Lista v2" (2026-10-22, docs/ui_proste/
// POMYSLY.md, the mock-ups docs/ui_proste/lista_v2_*.png and propozycja_1_lista_widok.png made by tools/ui_proste/lista_v2.py):
// "ma być prosty i przyciski O jako wejście i P jako wyjście" - "nie powinno być w postaci na sobie, tylko oddzielnie okno
// ekwipunku, ładnie całego" - in the frame of the menu before it (2026-10-23: "ogólnie ten widok, gdzie opcje główne były na
// górze, był ok ... trzeba połączyć jakoś z bieżącym", "tylko żeby nie było podzakładek").
//   At the top a row of eight tabs with icons: Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Opcje, Zapisz grę, Wyjdź (then any
//   other plugin's command - MenuPanel.addCommand: it opens its own screen); under it one panel the whole width with the chosen
//   tab's page. No second row: each tab is its page. Two levels: A / D (← / →) along the tabs - the page shows the chosen one at
//   once; O goes into the page (the tab turns brown, the others dim); P back to the tabs; P on the tabs closes the menu. Inside a
//   page one smaller step at most (the choice of a thing for an equipment place, the skills' tree, a question) - O in, P back. A
//   fixed bar of keys at the foot of every screen. No outlines round the layers: what is chosen is filled yellow. The mouse works
//   too (a tab: chosen and in; the right button: back); J on the map opens the menu on Dziennik.
//   - Postać: the bust (dressed - Ubior.js), the name, the level and its bar, the four needs, the purse, grandpa's debt (days), the
//     town's opinion (its word only: "Obcy"...), the fight (top right), the attributes and what keeps him whole (ODPORNOŚCI);
//     inside W / S along the attributes with a bubble beside the chosen one - what it gives now and with a point more (Combat.
//     attrInfo) -, O gives a point while there are points.
//   - Ekwipunek: the hero big (his own dressed walking sheet, 5 x; Tab turns him: front / side / back / side) between two grids of
//     places - "Ubiór" (głowa, tors, rękawice, pas, nogi, stopy) and "Okrycie i ręce" (płaszcz, plecy, prawa ręka, lewa ręka,
//     dodatek); W / S / A / D walk the places; a bubble beside the chosen one (the thing, its words from the game, what it gives,
//     its wear, its weight; empty: where to get one); the band RAZEM (armour, warmth, load, neatness, the walk - the real bonuses).
//     O on a place: what fits it from the bag and "Nic", under the figure, the chosen thing's bubble over the other grid - the
//     figure wears it at once (Ubior.tryOn); O puts it on, P back to the places; X takes off. The right hand is the combat mode's
//     weapon, the left the shield or the burning torch (Equipment.js).
//   - Umiejętności: the fields' row in the head (A / D), the field's tree (Combat_UI's way: boxes by the level they ask, the lines
//     of what opens what), O into the tree (W / S / A / D along it, O learns after a question), P back to the fields, P to the tabs.
//   - Plecak: one list with the groups' headings and the chosen thing's card; O uses - and a thing to wear (the clothes, the shield,
//     the backpack, a weapon of the combat mode) goes on, or comes off when it is on (a swap says what came off; what is worn has a
//     yellow plate "założone" / "w ręce"); X throws out (how many, then Tak / Nie - a bundle on the ground, Drops.js), Tab the order
//     (Grupy / Nazwa / Ilość / Najnowsze, kept in the config).
//   The whole menu is shown a little smaller than its places (UI.s, the user 2026-10-23: "całe menu trochę mniejsze"), the game
//   seen round it.
//   - Dziennik: A / D the section (the sections' row in the head), W / S the entries, O pins a goal; Shift + W / S scroll the words.
//   - Opcje: OptionEx's list (W / S, A / D a value). - Zapisz grę: the files and the chosen one's card, O saves (it asks before
//     writing over a file). - Wyjdź: to the title, out of the game, or back.
// It is the same Scene_Menu with the same command window (MenuPanel's commands), only hidden; it is the only P menu (2026-10-28: the
// old panel menu of MenuPanel.js and the option "Wygląd" are gone). The file screens (the title's "Kontynuuj", Scene_Save) and the
// title's "Opcje" (Scene_Options) are drawn in the same look. (The file keeps its old name - it held a ring of round buttons first -
// so the plugin list stays as it is.)

/*:
 * @target MZ
 * @plugindesc Menu P - zakładki u góry (Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Mapa, Opcje, Zapisz grę, Wyjdź), pod nimi widok; A/D zakładka, O wejdź, P wróć; ekrany plików i opcji z tytułu w tym samym wyglądzie. v4.2.0
 * @author Claude
 * @base CleanHUD
 * @orderAfter CleanHUD
 * @orderAfter MenuPanel
 * @orderAfter Journal
 * @orderAfter Combat_UI
 * @orderAfter Story
 * @orderAfter Durability
 * @orderAfter Dog
 * @orderAfter OptionEx
 *
 * @help
 * ============================================================================
 * MenuRing.js - menu P: zakładki u góry, widok pod nimi
 * ============================================================================
 * U góry 8 zakładek: Postać, Ekwipunek, Umiejętności, Plecak, Dziennik,
 * Opcje, Zapisz grę, Wyjdź (bez podzakładek). Pod nimi widok wybranej.
 *   A / D      po zakładkach (strzałki tak samo); w widoku: miejsce
 *              (Ekwipunek), dział (Dziennik), dziedzina (Umiejętności),
 *              wartość (Opcje)
 *   W / S      w widoku: wiersz / atrybut / miejsce / rzecz
 *   O / Enter  wejdź w widok, wybierz (załóż, użyj, przypnij, naucz się,
 *              zapisz...); w Umiejętnościach: wejdź w drzewko
 *   P / Esc    wróć poziom wyżej; na zakładkach zamyka menu
 *   X          zdejmij (Ekwipunek), wyrzuć (Plecak)
 *   Tab        obróć postać (Ekwipunek), porządek (Plecak)
 * Mysz też działa. Klawisz J otwiera menu od razu na Dzienniku.
 * Kolory: jedna paleta gry (UITheme.js, UIStyle.C).
 * ============================================================================
 */

(() => {
    "use strict";
    const CZESCI = window.Tawerna && window.Tawerna.api("MenuRing_parts");
    if (!CZESCI || !CZESCI.kit) throw new Error("MenuRing.js: musi być pod MenuRing_Rysunki.js na liście wtyczek (MenuRing_Rysunki.js is missing or below)");
    // (2026-11-07: its first part - lines 78-611 - is MenuRing_Rysunki.js, word for word)
    const { T, CH, PLUGIN, C, textOut, measure, W, H, ease, K, NEED_COL, L, RX, UI, uiOff, toLocal, toScreen, touchAt, ENTRIES, OWN,
        menuKeys, placeFill, placeOfSave, fillOldPlaces, plural, item, MP, num1, pctTxt, weightTxt, cap1, dayWords, placeName,
        heroXp, needRows, debtInfo, opinionInfo, wrapWords, rr, panelShadow, hl, vl, meter, done, tx, keycap, smallKeys,
        smallKeysWidth, heading, header, STRIP_TOP, tabStrip, inBox, tick, bubble, entryIcon, flatRows, fitRows, drawMore, View } = CZESCI.kit;
    if (!CZESCI.pages) throw new Error("MenuRing.js: musi być pod MenuRing_Strony.js na liście wtyczek (MenuRing_Strony.js is missing or below)");
    // (2026-11-07: MenuRing_Strony.js - menu P: strony Postać, Ekwipunek, Umiejętności, Plecak - word for word)
    const { PostacView, eqCells, totals, EquipView, SkillsView, SORTS, bagSort, GROUPS, groupOf, equipSlotOf, sortBag, BAGW, BagView } = CZESCI.pages;
    if (T.api(PLUGIN)) return;

    // (2026-11-07: the lines that stood here are MenuRing_Strony.js)

    // ==================================================================
    // Dziennik (lista_v2_dziennik.png): A / D the section, W / S the entries (Journal's list), the entry's words (Journal's detail)
    // ==================================================================
    const SK = { top: 104, row: 44, vis: 10, lw: 480 };   // (Dziennik's list: its top from RX().y0, a row, the rows seen, its width)
    // the journal's sections not shown in the menu for now (the user, 2026-10-23: "z dziennika ukryj na razie Receptury, Zapasy i Budynki");
    // they stay in Journal.js - taking a name out of this list shows the section again
    const JOURNAL_HIDDEN = ["Budynki", "Receptury", "Zapasy"];
    // the sections' order in the menu (the user, 2026-10-23); a section not named here comes after them, in Journal's order
    const JOURNAL_ORDER = ["Zadania", "Zlecenia", "Surowce", "Notatki", "Okolice", "Gablotka"];
    function JournalView(scene, def) {
        View.call(this, scene, def);
        const R = RX(), J = T.api("Journal");
        this.J = J;
        this._head = this.layer();
        this._tab = 0;
        this._detail = this.addWindow(new J.Window_JournalDetail(new Rectangle(R.lx + SK.lw + 46 - 12, R.y0 + 96, R.rx - (R.lx + SK.lw + 46) + 24, R.y1 - 12 - (R.y0 + 96))), false);
        const list = this._list = this.addWindow(new J.Window_JournalList(new Rectangle(R.lx - 8 - 12, R.y0 + SK.top - 12, SK.lw + 8 + 24, SK.vis * SK.row + 24)));
        list.itemHeight = () => SK.row;
        list.colSpacing = () => 0;
        list.rowSpacing = () => 0;
        list.drawItem = function(index) {
            const it = this._items[index];
            if (!it) return;
            const r = this.itemRect(index), c = this.contents, ctx = c.context, on = index === this.index(), act = this.active, ink = on && act ? K.sel : null;
            if (it.head) {   // (Zadania's group: its heading as in Plecak - yellow capitals, the count, a line)
                heading(c, r.x + 6, r.y + 14, it.label, r.x + r.width - 6, it.count);
                done(c);
                return;
            }
            if (on) rr(ctx, r.x, r.y, r.width, 40, 8, act ? K.acc : K.accDim);
            if (it.icon) CH.drawIcon(c, it.icon, r.x + 8, r.y + 4, 32);
            let right = r.x + r.width - 10;
            if (it.mark === "pin" || it.mark === "ready") {   // (pinned: a yellow diamond; can be done now: a dot)
                ctx.save();
                ctx.fillStyle = ink || K.acc;
                ctx.beginPath();
                const mx = right - 6, my = r.y + 20;
                if (it.mark === "pin") { ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 6, my); ctx.closePath(); }
                else ctx.arc(mx, my, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                right -= 20;
            }
            if (it.right) right -= tx(c, it.right, right, r.y + 20, 17, { align: "right", color: ink ? K.selMuted : K.muted }) + 10;
            tx(c, it.label, r.x + 50, r.y + 20, 22, { color: ink || (it.dim ? K.dim : K.text), max: right - (r.x + 50) });
            done(c);
        };
        flatRows(list, null);
        list._onSelect = it => this._detail.setDetail(J.detailFor(this._tab, it));
        list._onTab = dir => this.changeTab(dir);   // (A / D in the list: the section)
        list.setHandler("ok", () => this.onOk());
    }
    JournalView.prototype = Object.create(View.prototype);
    JournalView.prototype.constructor = JournalView;
    // (O: what the section's OK does - Zadania pins, Zlecenia follows; nothing in Surowce / Notatki)
    JournalView.prototype.keys = function() {
        const def = this.J.TAB_DEFS[this._tab], keys = [["A/D", "dział"], ["W/S", "wpis"]];
        if (def && def.ok) keys.push(["O", def.okWord || "śledź"]);
        return keys.concat([["P", "wróć"]]);
    };
    JournalView.prototype.refresh = function() {
        if (this.J.evaluateGoals) this.J.evaluateGoals();
        this.showTab(true);
    };
    JournalView.prototype.redraw = function() { this.drawHead(); };
    JournalView.prototype.activate = function() { this._list.activate(); };
    // the sections shown (their indexes in Journal's TABS)
    JournalView.prototype.shown = function() {
        const T_ = this.J.TABS, all = T_.map((n, i) => i), s = all.filter(i => !JOURNAL_HIDDEN.includes(T_[i]));
        const rank = i => { const k = JOURNAL_ORDER.indexOf(T_[i]); return k < 0 ? JOURNAL_ORDER.length + i : k; };
        return (s.length ? s : all).sort((a, b) => rank(a) - rank(b));
    };
    JournalView.prototype.showTab = function(keep) {
        const s = this.shown();
        if (!s.includes(this._tab)) { this._tab = s[0]; keep = false; }
        const idx = keep ? Math.max(0, this._list.index()) : 0;
        this._list.setItems(this.J.itemsForTab(this._tab));
        if (keep && idx < this._list.maxItems()) { this._list.select(idx); this._list.ensureCursorVisible(false); this._list.updateHelp(); }
        this.drawHead();
    };
    JournalView.prototype.changeTab = function(dir) {
        const s = this.shown(), n = s.length, k = Math.max(0, s.indexOf(this._tab));
        this._tab = s[(k + dir % n + n) % n];
        SoundManager.playCursor();
        this.showTab(false);
        if (this.inside) { this._list.activate(); this.scene.drawKeys(); }
    };
    JournalView.prototype.onOk = function() {
        const it = this._list.currentItem(), idx = this._list.index();
        if (this.J.listOk && this.J.listOk(this._tab, it)) {
            SoundManager.playOk();
            this._list.setItems(this.J.itemsForTab(this._tab));
            this._list.select(Math.min(idx, this._list.maxItems() - 1));
            this._list.ensureCursorVisible(false);
            this._list.updateHelp();
            this.drawHead();
        } else SoundManager.playBuzzer();
        this._list.activate();
    };
    JournalView.prototype.drawHead = function() {
        const b = this._head.bitmap, R = RX(), J = this.J, def = J.TAB_DEFS[this._tab];
        b.clear();
        header(b, null);   // (the head strip: the sections' row - the page's own, no second row of the frame)
        const s = this.shown();
        this._tabBoxes = tabStrip(b, s.map(i => J.TABS[i]), s.indexOf(this._tab), R.lx - 6, R.rx, R.y0 + STRIP_TOP, this._tabScroll || (this._tabScroll = {}));
        const legend = def && def.legend ? def.legend() : "";
        if (legend) tx(b, legend, R.lx, R.y1 - 32, 20, { top: true, color: K.muted, max: SK.lw });
        vl(b.context, R.lx + SK.lw + 22, R.y0 + 108, R.y1 - 24);
        done(b);
    };
    JournalView.prototype.touch = function(x, y) {
        const hit = (this._tabBoxes || []).find(q => inBox(q, x, y));
        const k = this.shown().indexOf(this._tab);   // (a tab's box: its place among the shown sections)
        if (hit && hit.dir) this.changeTab(hit.dir);
        else if (hit && hit.i !== k) this.changeTab(hit.i - k);
    };
    JournalView.prototype.info = function() {
        const J = this.J, d = J.data ? J.data() : {}, items = this._list._items || [], cur = this._list.currentItem();
        return { journal: { tab: this._tab, name: J.TABS[this._tab], tabs: this.shown().length, names: this.shown().map(i => J.TABS[i]), items: this._list.maxItems(), index: this._list.index(),
            scroll: this._detail.origin.y, pinned: d.pinned || null, pin: J.pinnedNow ? J.pinnedNow() : null,
            heads: items.filter(it => it.head).map(it => ({ label: it.label, count: it.count, index: items.indexOf(it) })),
            marks: items.filter(it => it.mark === "pin").map(it => it.label), legend: J.TAB_DEFS[this._tab] && J.TAB_DEFS[this._tab].legend ? J.TAB_DEFS[this._tab].legend() : "",
            item: cur ? cur.label : null, group: cur ? cur.group || null : null, kind: cur ? (cur.goal ? "goal" : cur.quest ? "quest" : cur.head ? "head" : "other") : null,
            id: cur ? (cur.goal ? cur.goal.id : cur.id || null) : null } };
    };

    // ==================================================================
    // Opcje: OptionEx's list of settings on the right panel (the graphics' quality, the picture's effects, the volumes...)
    // ==================================================================
    function OptionsView(scene, def) {
        View.call(this, scene, def);
        const R = RX();
        this._head = this.layer();
        const ow = Math.min(860, R.rx - R.lx + 40), ox = Math.round((R.x0 + R.x1 - ow) / 2);   // (the rows not wider than reads well: in the middle)
        this._win = this.addWindow(new Window_Options(new Rectangle(ox, R.y0 + 96, ow, R.y1 - 12 - (R.y0 + 96))));
        // (OptionEx's rows are two halves - the name, the value: the fill goes under both, the list drawn again on a change)
        flatRows(this._win, { on: K.accDim, off: null, repaint: true, rect: (w, i) => { const r = w.itemRect(i, false); if (!(w.isDefaultSymbol && w.isDefaultSymbol(w.commandSymbol(i)))) r.width *= 2; return r; } });
        fitRows(this._win);
    }
    OptionsView.prototype = Object.create(View.prototype);
    OptionsView.prototype.constructor = OptionsView;
    OptionsView.prototype.keys = function() { return [["W/S", "opcja"], ["A/D", "wartość"], ["O", "przełącz"], ["P", "wróć"]]; };
    OptionsView.prototype.refresh = function() { this._win.refresh(); this.redraw(); };
    OptionsView.prototype.redraw = function() {
        const b = this._head.bitmap;
        b.clear();
        header(b, "Opcje", "zmiany zapisują się same");
        drawMore(b, this._win, L.right.x + L.right.w / 2);
        this._sy = this._win.scrollY();
        done(b);
    };
    OptionsView.prototype.update = function() { if (this.root.visible && this._win.scrollY() !== this._sy) this.redraw(); };
    OptionsView.prototype.activate = function() { this._win.activate(); if (this._win.index() < 0) this._win.select(0); };
    OptionsView.prototype.leave = function() { ConfigManager.save(); };
    OptionsView.prototype.info = function() { return { options: { index: this._win.index(), symbol: this._win.currentSymbol() } }; };

    // ------------------------------------------------------------------
    // The save files - the P menu's "Zapisz grę" and the title's "Kontynuuj" (Scene_Load; Scene_Save too) alike
    // (the user, 2026-10-12): a row = the hero's bust in a small tile, "Plik N" (Autozapis) and the date, under them the day, the season,
    // the place and the time played; an empty file a dashed tile and "pusty". The card: the bust big, the day and the season, the place,
    // then the rows Czas gry, Poziom, Sakiewka, Dług dziadka, Chatka, Zapisano (what the save knows - an old one less).
    // ------------------------------------------------------------------
    const bustOf = info => (info && info.bust) || "Hero_Bust";
    // the bust cut to a rounded tile (k: its scale); false while the picture loads (onReady: called once it is in)
    function bustInTile(b, name, x, y, w, h, k, onReady) {
        const src = T.ui && T.ui.loadBust ? T.ui.loadBust(name) : ImageManager.loadPicture(name), ctx = b.context;
        CH.rpanel(ctx, x, y, w, h, 8, { fill: "rgba(36,38,43,1)", line: C.line, shadow: 0 });
        if (!src || (src.isError && src.isError())) return true;
        if (!src.isReady()) { if (onReady) src.addLoadListener(onReady); return false; }
        const img = src._canvas || src._image, bw = src.width * k, bh = src.height * k;
        ctx.save();
        CH.roundPath(ctx, x + 1, y + 1, w - 2, h - 2, 7);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        if (img) ctx.drawImage(img, 0, 0, src.width, src.height, x + (w - bw) / 2 - w * 0.04, y - h * 0.06, bw, bh);
        ctx.restore();
        return true;
    }
    function emptyTile(b, x, y, w, h) {
        const ctx = b.context;
        CH.rpanel(ctx, x, y, w, h, 8, { fill: "rgba(28,29,33,0.9)", line: "rgba(54,56,62,1)", shadow: 0 });
        ctx.save();
        ctx.strokeStyle = "rgba(90,92,100,1)";
        ctx.setLineDash([3, 3]);
        CH.roundPath(ctx, x + 8.5, y + 8.5, w - 17, h - 17, 5);
        ctx.stroke();
        ctx.restore();
    }
    const dayOf = info => (info && info.day !== undefined ? "Dzień " + info.day + (info.season ? " · " + String(info.season).toLowerCase() : "") : (info && info.title) || "Zapis");
    const stampOf = ts => { const mp = MP(); return mp && mp.stampText ? mp.stampText(ts) : new Date(ts).toLocaleString(); };
    Window_SavefileList.prototype.maxCols = function() { return 1; };   // (one file a row)
    Window_SavefileList.prototype.itemHeight = function() { return 66; };
    Window_SavefileList.prototype.drawItem = function(index) {
        const id = this.indexToSavefileId(index), info = DataManager.savefileInfo(id), r = this.itemRectWithPadding(index), c = this.contents;
        const tile = Math.min(56, r.height - 8), ty = r.y + Math.round((r.height - tile) / 2), tx0 = r.x + tile + 14, en = this.isEnabled(id);
        if (info) bustInTile(c, bustOf(info), r.x + 2, ty, tile, tile, tile * 0.0068, this._bustWait ? null : (this._bustWait = () => { this._bustWait = null; this.refresh(); }));
        else emptyTile(c, r.x + 2, ty, tile, tile);
        c.paintOpacity = en ? 255 : 150;
        textOut(c, id === 0 ? "Autozapis" : "Plik " + id, tx0, r.y + 6, 220, 26, "left", { size: 18, face: "bold", color: info ? C.text : C.muted, plain: true });
        if (info && info.timestamp) textOut(c, stampOf(info.timestamp), r.x, r.y + 6, r.width - 6, 26, "right", { size: 15, face: "regular", color: C.muted, plain: true });
        const line = info ? [dayOf(info), info.place].filter(Boolean).join(" · ") : "pusty";
        textOut(c, CH.fit(line, 16, r.width - tile - 110, "regular"), tx0, r.y + 31, r.width - tile - 100, 24, "left", { size: 16, face: "regular", color: info ? K.soft : C.dim, plain: true });
        if (info && info.playtime) textOut(c, info.playtime, r.x, r.y + 31, r.width - 6, 24, "right", { size: 16, color: C.muted, plain: true });
        c.paintOpacity = 255;
        c._baseTexture.update();
    };
    // the chosen file's card (x, y: its top-left; w its width); returns the y under it
    function drawSaveCard(b, x, y, w, id, onReady) {
        const info = DataManager.savefileInfo(id), big = 120, tx0 = x + big + 18;
        if (info) bustInTile(b, bustOf(info), x, y, big, big, 0.42, onReady);
        else emptyTile(b, x, y, big, big);
        CH.spaced(b, id === 0 ? "Autozapis" : "Plik " + id, tx0, y + 2, 20, { size: 15 });
        textOut(b, info ? dayOf(info) : "Pusty plik", tx0, y + 24, w - big - 18, 36, "left", { size: 26, face: "bold", color: info ? C.text : C.muted, plain: true });
        if (info && info.place) textOut(b, CH.fit(info.place, 17, w - big - 18, "regular"), tx0, y + 62, w - big - 18, 26, "left", { size: 17, face: "regular", color: K.acc, plain: true });
        if (!info) { textOut(b, "Nic tu jeszcze nie zapisano.", tx0, y + 62, w - big - 18, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true }); return y + big + 12; }
        const rows = [];
        if (info.playtime) rows.push(["Czas gry", info.playtime]);
        if (info.level) rows.push(["Poziom", String(info.level)]);
        if (info.gold !== undefined) rows.push(["Sakiewka", info.gold + " G"]);
        if (info.debt) rows.push([info.debt.lost ? "Odkup działki" : "Dług dziadka", info.debt.done ? (info.debt.lost ? "odkupiona" : "spłacony") : info.debt.paid + " / " + info.debt.debt + " G"]);
        if (info.hutBuilt !== undefined) rows.push(["Chatka", info.hutBuilt ? "zbudowana" : "jeszcze nie ma"]);
        if (info.timestamp) rows.push(["Zapisano", stampOf(info.timestamp)]);
        let yy = y + big + 30;
        for (const [lab, val] of rows) {
            textOut(b, lab, x, yy - 13, 200, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true });
            textOut(b, String(val), x + 140, yy - 13, w - 140, 26, "right", { size: 16, color: (lab === "Dług dziadka" || lab === "Odkup działki") && info.debt && info.debt.done ? K.good : C.text, plain: true });
            b.context.fillStyle = "rgba(44,46,52,1)";
            b.context.fillRect(x, yy + 14, w, 1);
            yy += 32;
        }
        return yy + 4;
    }

    // ---- the file screen itself (Scene_Load from the title's "Kontynuuj", Scene_Save from an event): the screen behind dimmed (the
    // title's fire), one panel - the title, the files on the left, the card on the right - and the keys under it: W / S choose, O loads /
    // saves, P back (the arrows, Enter, Esc and the mouse too).
    const FILEP = { x: 96, y: 76, w: 1088, h: 584, split: 548 };
    const _fileCreate = Scene_File.prototype.create;
    Scene_File.prototype.create = function() {
        _fileCreate.call(this);
        fillOldPlaces();   // (old files without a place: looked for once, if the boot did not get to it)
        this._filesOn = true;
        const P = FILEP, list = this._listWindow, st = list && list.mzkp_statusWindow, load = this.mode() !== "save";
        if (this._helpWindow) this._helpWindow.hide();
        if (st) { st.hide(); st.refresh = function() {}; }
        if (this._cancelButton) this._cancelButton.visible = false;
        const at = Math.max(0, this.children.indexOf(this._windowLayer));
        const bg = this._filesBg = new Sprite(new Bitmap(W(), H())), ctx = bg.bitmap.context;
        ctx.fillStyle = "rgba(10,10,12,0.55)";
        ctx.fillRect(0, 0, W(), H());
        CH.rpanel(ctx, P.x, P.y, P.w, P.h, 12, { fill: K.panel });
        textOut(bg.bitmap, load ? "Wczytaj grę" : "Zapisz grę", P.x + 24, P.y + 14, 400, 34, "left", { size: 26, face: "bold", plain: true });
        textOut(bg.bitmap, load ? "Wybierz zapis, od którego grasz dalej." : "Wybierz plik, w którym zapiszesz grę.", P.x + 24, P.y + 46, 600, 24, "left", { size: 15, face: "regular", color: C.muted, plain: true });
        ctx.fillStyle = C.line;
        ctx.fillRect(P.x + 20, P.y + 78, P.w - 40, 1);
        ctx.fillRect(P.x + P.split, P.y + 96, 1, P.h - 116);
        bg.bitmap._baseTexture.update();
        this.addChildAt(bg, at);
        this._filesCard = new Sprite(new Bitmap(W(), H()));
        this.addChildAt(this._filesCard, at + 1);
        this._filesKeys = new Sprite(new Bitmap(W(), 28));
        this._filesKeys.y = 684;
        const pairs = [["W/S", "wybierz"], ["O", load ? "wczytaj" : "zapisz tutaj"], ["P", "wróć"]];
        smallKeys(this._filesKeys.bitmap, Math.round(W() / 2 - smallKeysWidth(pairs) / 2), 2, pairs);
        this.addChildAt(this._filesKeys, at + 2);
        list.move(P.x + 8, P.y + 88, P.split - 20, P.h - 100);
        list.opacity = 0;
        list.frameVisible = false;
        list.createContents();
        list.refresh();
        list.refreshCursor();   // (its row's width: the new one)
        list.ensureCursorVisible(false);
        this._filesCardId = -1;
        this.drawFilesCard();
    };
    Scene_File.prototype.drawFilesCard = function() {
        const list = this._listWindow, id = list && list.savefileId ? list.savefileId() : 1, b = this._filesCard.bitmap, P = FILEP;
        this._filesCardId = id;
        b.clear();
        drawSaveCard(b, P.x + P.split + 24, P.y + 100, P.w - P.split - 48, id, () => { this._filesCardId = -1; });
        b._baseTexture.update();
    };
    const _fileUpdate = Scene_File.prototype.update;
    Scene_File.prototype.update = function() {
        _fileUpdate.call(this);
        if (this._filesOn && this._listWindow && this._listWindow.savefileId() !== this._filesCardId) this.drawFilesCard();
    };
    // (for the tests) what the file screen shows
    const filesInfo = () => {
        const s = SceneManager._scene;
        if (!(s instanceof Scene_File) || !s._filesOn) return null;
        const list = s._listWindow;
        return { mode: s.mode(), id: list.savefileId(), index: list.index(), active: list.active, card: s._filesCardId, latest: DataManager.latestSavefileId(),
            rect: { x: list.x, y: list.y, w: list.width, h: list.height }, oldPanel: !!(s._menuPanel && s._menuPanel.visible), status: !!(list.mzkp_statusWindow && list.mzkp_statusWindow.visible) };
    };

    // ---- the title's "Opcje" (Scene_Options) as the file screen: the title's picture dimmed, one panel - "Opcje", the list of settings
    // (the menu's Opcje page: the rows drawn the same, the chosen one filled), "▾ jeszcze N niżej" under it - and the keys under the panel
    const OPTP = { w: 900, y: 76, h: 584, top: 96 };
    const optPanel = () => ({ x: Math.round((W() - OPTP.w) / 2), y: OPTP.y, w: OPTP.w, h: OPTP.h });
    Scene_Options.prototype.optionsWindowRect = function() {
        const P = optPanel(), ow = Math.min(860, P.w - 40);
        return new Rectangle(Math.round(P.x + (P.w - ow) / 2), P.y + OPTP.top, ow, P.h - OPTP.top - 34);
    };
    const _optCreate = Scene_Options.prototype.create;
    Scene_Options.prototype.create = function() {
        _optCreate.call(this);
        const P = optPanel(), win = this._optionsWindow, at = Math.max(0, this.children.indexOf(this._windowLayer));
        if (this._cancelButton) this._cancelButton.visible = false;
        const bg = this._optBg = new Sprite(new Bitmap(W(), H())), ctx = bg.bitmap.context;
        ctx.fillStyle = "rgba(10,10,12,0.55)";
        ctx.fillRect(0, 0, W(), H());
        CH.rpanel(ctx, P.x, P.y, P.w, P.h, 12, { fill: K.panel });
        textOut(bg.bitmap, "Opcje", P.x + 24, P.y + 14, 400, 34, "left", { size: 26, face: "bold", plain: true });
        textOut(bg.bitmap, "Zmiany zapisują się same.", P.x + 24, P.y + 46, 600, 24, "left", { size: 15, face: "regular", color: C.muted, plain: true });
        ctx.fillStyle = C.line;
        ctx.fillRect(P.x + 20, P.y + 78, P.w - 40, 1);
        bg.bitmap._baseTexture.update();
        this.addChildAt(bg, at);
        this._optMore = new Sprite(new Bitmap(W(), H()));
        this.addChildAt(this._optMore, at + 1);
        this._optKeys = new Sprite(new Bitmap(W(), 28));
        this._optKeys.y = 684;
        const pairs = [["W/S", "opcja"], ["A/D", "wartość"], ["O", "przełącz"], ["P", "wróć"]];
        smallKeys(this._optKeys.bitmap, Math.round(W() / 2 - smallKeysWidth(pairs) / 2), 2, pairs);
        this.addChildAt(this._optKeys, at + 2);
        win.opacity = 0;
        win.frameVisible = false;
        win.updateArrows = function() { this.downArrowVisible = false; this.upArrowVisible = false; };   // ("jeszcze N niżej" says it)
        flatRows(win, { on: K.accDim, off: null, repaint: true, rect: (w, i) => { const r = w.itemRect(i, false); if (!(w.isDefaultSymbol && w.isDefaultSymbol(w.commandSymbol(i)))) r.width *= 2; return r; } });
        fitRows(win);
        win.refresh();
        this._optSy = -1;
    };
    const _optUpdate = Scene_Options.prototype.update;
    Scene_Options.prototype.update = function() {
        _optUpdate.call(this);
        const win = this._optionsWindow;
        if (!this._optMore || !win || win.scrollY() === this._optSy) return;
        this._optSy = win.scrollY();
        const b = this._optMore.bitmap;
        b.clear();
        drawMore(b, win, W() / 2);
        done(b);
    };

    // ==================================================================
    // Zapisz grę: the files (day, place, time played), the chosen one's card; O saves there (a question before writing over a file)
    // ==================================================================
    function SaveView(scene, def) {
        View.call(this, scene, def);
        const R = RX();
        this._card = this.layer();
        const list = this._list = this.addWindow(new Window_SavefileList(new Rectangle(R.x0 + 12, R.y0 + 96, BAGW.list, R.y1 - 12 - (R.y0 + 96))));
        list.setMode("save", false);
        flatRows(list, { on: K.accDim, off: "rgba(44,46,52,1)" });
        fitRows(list);
        list.setHandler("ok", () => this.save());
        const select = list.select;
        list.select = function(i) { select.call(this, i); if (scene._views.save) scene._views.save.drawCard(); };
        this._note = "";
        this._ask = null;
    }
    SaveView.prototype = Object.create(View.prototype);
    SaveView.prototype.constructor = SaveView;
    SaveView.prototype.keys = function() {
        if (this._ask) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", "nie"]];
        return [["W/S", "plik"], ["O", "zapisz"], ["P", "wróć"]];
    };
    SaveView.prototype.allowed = function() {
        const cw = this.scene._commandWindow, i = cw._list.findIndex(c => c.symbol === "save");
        return i >= 0 ? cw.isCommandEnabled(i) : $gameSystem.isSaveEnabled();
    };
    SaveView.prototype.refresh = function() {
        fillOldPlaces();
        this._list.refresh();
        if (this._list.index() < 0) this._list.selectSavefile(Math.max(1, $gameSystem.savefileId() || 1));
        this.drawCard();
    };
    SaveView.prototype.redraw = function() { this.drawCard(); };
    SaveView.prototype.activate = function() { this._list.activate(); };
    SaveView.prototype.leave = function() { this._note = ""; this._ask = null; };
    SaveView.prototype.drawCard = function() {
        const b = this._card.bitmap, R = RX(), x = R.x0 + BAGW.card, w = R.rx - x, id = this._list.savefileId ? this._list.savefileId() : 1;
        b.clear();
        header(b, "Zapisz grę", this.allowed() ? "dzień, miejsce, czas gry" : "tutaj nie można zapisać");
        vl(b.context, R.x0 + BAGW.line, R.y0 + 108, R.y1 - 24);
        drawMore(b, this._list, R.x0 + 12 + BAGW.list / 2);
        this._sy = this._list.scrollY();
        let y = drawSaveCard(b, x, R.y0 + 112, w, id, () => this.drawCard()) + 8;
        const now = this.allowed() ? "O zapisze tu to, co teraz: " + dayWords() + (placeName() ? ", " + placeName() : "") + "." : "Tutaj nie można zapisać gry.";
        for (const line of wrapWords(this._note || now, 19, w)) { tx(b, line, x, y, 19, { top: true, color: this._note ? K.good : this.allowed() ? K.soft : K.warn }); y += 26; }
        if (this._ask) this.drawAsk(b, id);
        done(b);
    };
    SaveView.prototype.drawAsk = function(b, id) {
        const ctx = b.context, R = RX(), x = R.x0 + BAGW.card, w = R.rx - x, y = R.y1 - 170, info = DataManager.savefileInfo(id);
        rr(ctx, x - 16, y, w + 32, 150, 12, "rgba(12,13,16,0.97)");
        tx(b, "Nadpisać " + (id === 0 ? "autozapis" : "plik " + id) + "?", x, y + 16, 22, { top: true, face: "bold" });
        tx(b, "Teraz: " + [dayOf(info), info && info.place].filter(Boolean).join(" · "), x, y + 48, 18, { top: true, color: K.muted, max: w });
        const bw = (w - 12) / 2;
        this._askBoxes = [];
        [["yes", "Tak"], ["no", "Nie"]].forEach(([act, lab], k) => {
            const bx = x + k * (bw + 12), on = (act === "yes") === this._ask.yes;
            rr(ctx, bx, y + 98, bw, 38, 8, on ? K.acc : K.cell);
            tx(b, lab, bx + bw / 2, y + 117, 21, { face: "bold", align: "center", color: on ? K.sel : K.text });
            this._askBoxes.push({ act, x0: bx, x1: bx + bw, y0: y + 98, y1: y + 136 });
        });
    };
    SaveView.prototype.save = function() {
        const list = this._list, id = list.savefileId();
        if (!this.allowed() || !list.isEnabled(id)) { SoundManager.playBuzzer(); list.activate(); return; }
        if (DataManager.savefileInfo(id) && !this._sure) {   // (a file with a game in it: asked first)
            this._ask = { yes: false, id };
            list.deactivate();
            this.drawCard();
            this.scene.drawKeys();
            return;
        }
        this._sure = false;
        $gameSystem.setSavefileId(id);
        $gameSystem.onBeforeSave();
        this._saving = true;
        DataManager.saveGame(id)
            .then(() => { SoundManager.playSave(); this._note = "Zapisano w pliku " + id + "."; this._saving = false; list.refresh(); this.drawCard(); if (this.inside) list.activate(); })
            .catch(() => { SoundManager.playBuzzer(); this._note = "Nie udało się zapisać."; this._saving = false; this.drawCard(); if (this.inside) list.activate(); });
    };
    SaveView.prototype.answer = function(yes) {
        this._ask = null;
        this.scene.drawKeys();
        if (yes) { this._sure = true; this.save(); return; }
        SoundManager.playCancel();
        this._list.activate();
        this.drawCard();
    };
    SaveView.prototype.update = function() {
        if (this.root.visible && this._list.scrollY() !== this._sy) this.drawCard();
        if (!this._ask || !this.ready()) return;
        if (Input.isRepeated("left") || Input.isRepeated("right")) { this._ask.yes = !this._ask.yes; SoundManager.playCursor(); this.drawCard(); }
        else if (Input.isTriggered("ok")) this.answer(this._ask.yes);
    };
    SaveView.prototype.cancel = function() {
        if (!this._ask) return false;
        this.answer(false);
        return true;
    };
    SaveView.prototype.touch = function(x, y) {
        if (!this._ask) return;
        const q = (this._askBoxes || []).find(q => inBox(q, x, y));
        if (q) this.answer(q.act === "yes");
    };
    SaveView.prototype.info = function() { return { save: { id: this._list.savefileId(), note: this._note, ask: !!this._ask, allowed: this.allowed() } }; };

    // ==================================================================
    // Wyjdź: to the title, out of the game, or back to the list
    // ==================================================================
    const END = [["title", "Do ekranu tytułowego"], ["exit", "Wyjdź z gry"], ["back", "Wróć"]];
    const ENDL = { y: 230, row: 58, w: 640 };
    function EndView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._sel = 0;
    }
    EndView.prototype = Object.create(View.prototype);
    EndView.prototype.constructor = EndView;
    EndView.prototype.keys = function() { return [["W/S", "wybierz"], ["O", "potwierdź"], ["P", "wróć"]]; };
    EndView.prototype.enter = function() { this._sel = 0; View.prototype.enter.call(this); };
    EndView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX();
        b.clear();
        header(b, "Wyjdź");
        tx(b, "Zakończyć grę?", R.lx, R.y0 + 116, 30, { top: true, face: "bold" });
        tx(b, "To, czego nie zapisałeś, przepadnie.", R.lx, R.y0 + 160, 21, { top: true, color: K.muted });
        END.forEach(([sym, label], i) => {
            const y = R.y0 + ENDL.y + i * ENDL.row, on = i === this._sel;
            rr(ctx, R.lx - 8, y, ENDL.w, 48, 10, on ? (this.inside ? K.acc : K.accDim) : K.cell);
            tx(b, label, R.lx + 14, y + 24, 24, { face: "bold", color: on && this.inside ? K.sel : K.text });
        });
        const id = DataManager.latestSavefileId(), info = id >= 0 ? DataManager.savefileInfo(id) : null;
        if (info) tx(b, "Ostatni zapis: " + (id === 0 ? "autozapis" : "plik " + id) + " · " + [dayOf(info), info.place].filter(Boolean).join(" · ") + (info.timestamp ? " · " + stampOf(info.timestamp) : ""),
            R.lx, R.y1 - 52, 19, { top: true, color: K.muted, max: R.rx - R.lx });
        done(b);
    };
    EndView.prototype.update = function() {
        if (!this.ready()) return;
        if (this.mouseMoved()) { const p = touchAt(), k = this.rowAt(p.x, p.y); if (k >= 0 && k !== this._sel) { this._sel = k; this.redraw(); } }
        if (Input.isRepeated("down") || Input.isRepeated("up")) {
            this._sel = (this._sel + (Input.isRepeated("down") ? 1 : END.length - 1)) % END.length;
            SoundManager.playCursor();
            this.redraw();
        } else if (Input.isTriggered("ok")) this.choose();
    };
    EndView.prototype.rowAt = function(x, y) {
        const R = RX();
        if (x < R.lx - 8 || x > R.lx - 8 + ENDL.w) return -1;
        return END.findIndex((e, i) => { const by = R.y0 + ENDL.y + i * ENDL.row; return y >= by && y <= by + 48; });
    };
    EndView.prototype.touch = function(x, y) {
        const k = this.rowAt(x, y);
        if (k < 0) return;
        if (k === this._sel) this.choose(); else { this._sel = k; SoundManager.playCursor(); this.redraw(); }
    };
    EndView.prototype.choose = function() {
        const sym = END[this._sel][0];
        if (sym === "back") { this.scene.leaveView(); return; }
        SoundManager.playOk();
        this.scene._closing = true;
        this.scene.fadeOutAll();
        if (sym === "title") SceneManager.goto(Scene_Title);
        else SceneManager.exit();
    };
    EndView.prototype.info = function() { return { end: { sel: END[this._sel][0] } }; };

    // ==================================================================
    // Another plugin's command (MenuPanel.addCommand - "Plan karczmy"): O opens its own screen
    // ==================================================================
    function ExtraView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
    }
    ExtraView.prototype = Object.create(View.prototype);
    ExtraView.prototype.constructor = ExtraView;
    ExtraView.prototype.redraw = function() {
        const b = this._bg.bitmap, R = RX();
        b.clear();
        header(b, this.def.label, "osobny ekran");
        tx(b, "O otwiera „" + this.def.label + "” na osobnym ekranie.", R.lx, R.y0 + 124, 22, { top: true, color: K.soft, max: R.rx - R.lx });
        tx(b, "P wraca stamtąd do tego menu.", R.lx, R.y0 + 158, 22, { top: true, color: K.muted });
        done(b);
    };

    // the settings' rows (the menu's Opcje and the title's options alike): the name in the text's colour, "Tak" / "Nie", the volumes
    // and the opacity as thin yellow bars with their value
    const _optDraw = Window_Options.prototype.drawItem;
    Window_Options.prototype.drawItem = function(index) {
        if (!this.itemLineRect) return _optDraw.call(this, index);
        const symbol = this.commandSymbol(index), title = this.commandName(index), r = this.itemLineRect(index, false), c = this.contents, en = this.isCommandEnabled(index);
        if (this.isDefaultSymbol && this.isDefaultSymbol(symbol)) { textOut(c, title, r.x, r.y, r.width, r.height, "center", { size: 17, color: K.acc, plain: true }); return; }
        textOut(c, title, r.x, r.y, r.width, r.height, "left", { size: 18, color: en ? C.text : C.dim, plain: true });
        const s = this.itemLineRect(index, true), status = this.statusText(index), value = this.getConfigValue(symbol);
        if (this.isGaugeSymbol && this.isGaugeSymbol(symbol)) {
            const rate = this.isVolumeSymbol(symbol) ? value / 100 : this.isToneSymbol && this.isToneSymbol(symbol) ? (value + 255) / 510 : value / 255;
            textOut(c, status, s.x, s.y, 56, s.height, "right", { size: 16, plain: true });
            meter(c.context, s.x + 66, s.y + Math.round(s.height / 2) - 2, s.width - 70, 4, rate, K.acc);
            c._baseTexture.update();
        } else {
            const text = value === true ? "Tak" : value === false ? "Nie" : status;
            textOut(c, text, s.x, s.y, s.width - 4, s.height, "right", { size: 17, color: value === false ? C.muted : K.acc, plain: true });
        }
    };

    // Mapa (2026-10-24): the page lives in MapaWyspy.js, built from this file's pieces (PARTS) when first shown; without the plugin - a note
    const PARTS = { View, RX, L, K, tx, header, heading, hl, vl, rr, bubble, wrapWords, done, keycap, smallKeys, tabStrip, inBox, touchAt, measure, textOut };
    function MapaView(scene, def) {
        const M = T.api("MapaWyspy"), V = M && M.menuView ? M.menuView(PARTS) : ExtraView;
        return new V(scene, def);
    }
    const VIEWS = { hero: PostacView, equip: EquipView, skills: SkillsView, item: BagView, journal: JournalView, mapa: MapaView, options: OptionsView, save: SaveView, gameEnd: EndView };

    // ==================================================================
    // The menu scene: the list, the page, the keys
    // ==================================================================
    const _create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _create.call(this);
        this.createLista();
    };
    const atLayer = scene => scene.children.indexOf(scene._windowLayer);
    Scene_Menu.prototype.createLista = function() {
        const cw = this._commandWindow;
        cw.hide();
        cw.deactivate();
        if (this._statusWindow) this._statusWindow.hide();
        if (this._goldWindow) this._goldWindow.hide();
        if (this._backgroundSprite) {
            this._blur = new PIXI.filters.BlurFilter();
            this._blur.blur = 0;
            this._backgroundSprite.filters = [this._blur];
            this._backgroundSprite.opacity = 255;
        }
        const add = s => { this.addChildAt(s, atLayer(this)); return s; };
        this._dim = add(new Sprite(new Bitmap(16, 16)));
        this._dim.bitmap.fillAll("rgb(10,10,12)");
        this._dim.scale.set(W() / 16, H() / 16);
        this._dim.opacity = 0;
        this._rightBg = add(new Sprite(new Bitmap(W(), H())));
        panelShadow(this._rightBg.bitmap.context, L.right.x, L.right.y, L.right.w, L.right.h);
        done(this._rightBg.bitmap);
        this._viewLayer = add(new Sprite());
        this._listSpr = add(new Sprite(new Bitmap(W(), H())));
        this._keys = add(new Sprite(new Bitmap(W(), L.keysH)));
        this._keys.y = L.keysY;
        this._overLayer = new Sprite();   // (over the windows: the bag's question and its plates)
        this.addChild(this._overLayer);
        // the menu shown smaller (UI.s) round the middle over the keys: the panel, the pages, the tabs, the windows, the questions
        const o = uiOff();
        for (const s of [this._rightBg, this._viewLayer, this._listSpr, this._windowLayer, this._overLayer]) { s.scale.set(UI.s, UI.s); s.position.set(o.x, o.y); }
        menuKeys(true);
        // the rows: the menu's own, then any other plugin's command (it opens its own screen, as before)
        this._entries = ENTRIES.slice();
        cw._list.forEach((c, i) => { if (!OWN.has(c.symbol) && c.symbol !== "skills") this._entries.push({ sym: c.symbol, label: c.name, extra: true, i }); });
        this._views = {};
        this._t = 0;
        let start = $gameTemp._menuTab || "hero";
        if (start === "hero" && ($gameTemp._heroSub === "equip" || $gameTemp._heroSub === "skills")) start = $gameTemp._heroSub;   // (the old way to ask for a part of Postać)
        const back = SceneManager._previousClass && SceneManager._previousClass !== Scene_Map;
        if (back && !$gameTemp._menuTab && $gameTemp._menuLast) start = $gameTemp._menuLast;   // (back from another plugin's screen: on its row)
        const inside = ($gameTemp._menuLevel || 1) >= 2;
        $gameTemp._menuTab = null;
        $gameTemp._menuLevel = null;
        $gameTemp._heroSub = null;
        $gameTemp._menuLast = null;
        if (back) this._t = 40;   // (no second entrance)
        this._sel = Math.max(0, this._entries.findIndex(e => e.sym === start));
        this._inside = false;
        this.showEntry(true);
        if (inside && !this._entries[this._sel].extra) this.enterView(true);
        this.drawList();
        this.drawKeys();
    };
    // the row of tabs over the panel (the menu's own eight, then the other plugins' commands): an icon and a word each, the chosen one a
    // yellow pill (dark yellow while its page has the keys, the others dimmed); a small count of the points to give on Postać and
    // Umiejętności; the day, the season, the hour and the place small over the row on the right. No second row: each tab is its page.
    Scene_Menu.prototype.drawList = function() {
        const b = this._listSpr.bitmap, ctx = b.context, inside = this._inside, xp = heroXp(), n = this._entries.length, T0 = L.tabs;
        b.clear();
        tx(b, dayWords() + "   ·   " + placeName(), L.right.x + L.right.w - 6, 8, 16, { top: true, align: "right", color: K.muted });
        const pad = 12, isz = 32, gap = 6, avail = L.right.w;
        let size = 19;
        const widthOf = (e, s) => pad * 2 + isz + 8 + measure(e.label, s, "bold");
        const totalOf = s => this._entries.reduce((a, e) => a + widthOf(e, s), 0) + gap * (n - 1);
        while (totalOf(size) > avail && size > 14) size--;
        let x = Math.round(L.right.x + (avail - totalOf(size)) / 2), ready = true;
        const y = T0.y, h = T0.h, cy = y + h / 2;
        this._rowBoxes = [];
        this._entries.forEach((e, i) => {
            const on = i === this._sel, w = widthOf(e, size);
            if (on) rr(ctx, x, y, w, h, 10, inside ? K.accDim : K.acc);
            const ic = entryIcon(e);
            if (ic) {
                b.paintOpacity = inside && !on ? 102 : 255;
                ctx.imageSmoothingEnabled = false;
                b.blt(ic, 0, 0, ic.width, ic.height, x + pad, Math.round(cy - isz / 2), isz, isz);
                b.paintOpacity = 255;
            } else if (e.icon) ready = false;
            const col = on ? (inside ? K.text : K.sel) : inside ? K.dim : K.soft;
            tx(b, e.label, x + pad + isz + 8, cy + 1, size, { face: on ? "bold" : null, color: col });
            // (points to give: a small yellow count on the tab's corner)
            const pts = !xp ? 0 : e.sym === "hero" ? xp.points : e.sym === "skills" ? xp.skillPoints : 0;
            if (pts > 0) {
                const bx = x + w - 6, by = y + 4;
                ctx.save(); ctx.fillStyle = on && !inside ? K.sel : K.acc; ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
                tx(b, String(pts), bx, by, 15, { face: "bold", align: "center", color: on && !inside ? K.acc : K.sel });
            }
            this._rowBoxes.push({ i, x0: x, x1: x + w, y0: y, y1: y + h });
            x += w + gap;
        });
        done(b);
        this._listReady = ready && CH.facesReady();
    };
    // the bar of keys at the foot: always the same pattern - the keys of what has them now
    Scene_Menu.prototype.keyPairs = function() {
        const v = this._view, e = this._entries[this._sel];
        if (this._inside && v) return v.keys();
        return [["A/D", "zakładka"], ["O", e && e.extra ? "otwórz" : "wybierz"], ["P", "wróć do gry"]];
    };
    Scene_Menu.prototype.drawKeys = function() {
        const b = this._keys.bitmap, ctx = b.context, pairs = this.keyPairs();
        b.clear();
        ctx.fillStyle = K.strip;
        ctx.fillRect(0, 0, W(), L.keysH);
        hl(ctx, 0, W(), 0);
        const KB = { h: 30, size: 19, text: 20, gap: 38 };   // (the bar's keys a little smaller too - the user, 2026-10-23)
        const widths = pairs.map(([k, t]) => Math.max(KB.h, measure(k, KB.size, "bold") + 16) + 9 + measure(t, KB.text)), gap = KB.gap;
        let x = Math.round((W() - (widths.reduce((a, w) => a + w, 0) + gap * (pairs.length - 1))) / 2);
        const cy = L.keysH / 2;
        pairs.forEach(([k, t], i) => {
            const kw = keycap(b, x, cy, k, { h: KB.h, size: KB.size });
            tx(b, t, x + kw + 9, cy + 1, KB.text);
            x += widths[i] + gap;
        });
        done(b);
    };
    Scene_Menu.prototype.view = function(e) {
        if (!e) return null;
        if (!this._views[e.sym]) {
            const V = e.extra ? ExtraView : VIEWS[e.sym];
            this._views[e.sym] = V ? new V(this, e) : null;
        }
        return this._views[e.sym];
    };
    // the chosen row's page shown (a short fade in)
    Scene_Menu.prototype.showEntry = function(quiet) {
        const v = this.view(this._entries[this._sel]);
        if (this._view && this._view !== v) this._view.hide();
        this._view = v;
        if (v) { v.show(); v.setAlpha(quiet ? 1 : 0); }
        this._fade = quiet ? null : { t: 0 };
    };
    Scene_Menu.prototype.moveSel = function(dir) { const n = this._entries.length; this.goEntry((this._sel + dir + n) % n); };
    Scene_Menu.prototype.goEntry = function(i) {
        if (i === this._sel || i < 0 || i >= this._entries.length) return;
        if (this._inside) this.leaveView(true);
        SoundManager.playCursor();
        this._sel = i;
        this.showEntry(false);
        this.drawList();
        this.drawKeys();
    };
    // O: into the page (another plugin's command: its own screen)
    Scene_Menu.prototype.enterView = function(quiet) {
        const e = this._entries[this._sel];
        this._levelT = Graphics.frameCount;
        if (!e) return;
        if (e.extra) {
            const cw = this._commandWindow;
            if (!cw.isCommandEnabled(e.i)) { SoundManager.playBuzzer(); return; }
            SoundManager.playOk();
            $gameTemp._menuLast = e.sym;
            cw.select(e.i);
            cw.callOkHandler();
            cw.deactivate();
            return;
        }
        const v = this._view;
        if (!v) return;
        if (!quiet) SoundManager.playOk();
        this._inside = true;
        v.enter();
        this.drawList();
        this.drawKeys();
    };
    // P: back to the list
    Scene_Menu.prototype.leaveView = function(quiet) {
        this._levelT = Graphics.frameCount;
        if (!quiet) SoundManager.playCancel();
        this._inside = false;
        if (this._view) this._view.exit();
        this.drawList();
        this.drawKeys();
    };
    // P in a page: its smaller step goes back first; else back to the list (heard: the window has played the sound already)
    Scene_Menu.prototype.onViewCancel = function(heard) {
        if (this._levelT === Graphics.frameCount) return;
        if (this._view && this._view.cancel()) { this._levelT = Graphics.frameCount; this.drawKeys(); return; }
        this.leaveView(!!heard);
    };
    Scene_Menu.prototype.closeMenu = function() {
        if (this._closing) return;
        this._closing = true;
        SoundManager.playCancel();
        if (this._views.options) ConfigManager.save();
        this.popScene();
    };
    Scene_Menu.prototype.inputReady = function() {
        return !SceneManager.isSceneChanging() && this.isActive() && !this._closing && this._t > 6;
    };
    Scene_Menu.prototype.rowAt = function(x, y) {
        const q = (this._rowBoxes || []).find(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y < r.y1);
        return q ? q.i : -1;
    };
    const _update = Scene_Menu.prototype.update;
    Scene_Menu.prototype.update = function() {
        _update.call(this);
        this._t++;
        const k = ease(this._t / 14), show = ease(this._t / 12);
        if (this._blur) this._blur.blur = 1.5 * k;
        this._dim.opacity = Math.round(255 * 0.68 * k);
        for (const s of [this._listSpr, this._rightBg, this._keys]) s.opacity = Math.round(255 * show);
        const v = this._view;
        let a = show;
        if (this._fade) { const f = ++this._fade.t; a *= ease(f / 8); if (f >= 8) this._fade = null; }
        if (v) v.setAlpha(a);
        if (!this._listReady && this._t % 5 === 0) this.drawList();
        if (v) v.update();
        if (!this.inputReady() || this._levelT === Graphics.frameCount) return;
        const back = Input.isTriggered("cancel") || TouchInput.isCancelled();
        if (!this._inside) {   // (the row of tabs: A / D - the arrows ← / → - choose, O in, P out of the menu)
            if (Input.isRepeated("right")) { this.moveSel(1); return; }
            if (Input.isRepeated("left")) { this.moveSel(-1); return; }
            if (Input.isTriggered("ok")) { this.enterView(); return; }
            if (back) { this.closeMenu(); return; }
        } else if (v && v.spriteInput() && back) { this.onViewCancel(); return; }
        if (TouchInput.isTriggered()) {
            const p = touchAt(), x = p.x, y = p.y, row = this.rowAt(x, y), R = L.right;   // (the menu's own places: shown smaller - UI.s)
            // the mouse: a tab - chosen and in; the page - in, then its own click
            if (row >= 0) {
                if (row !== this._sel) this.goEntry(row);
                if (!this._inside) this.enterView();
                return;
            }
            if (!this._inside) { if (x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h) this.enterView(); return; }
            if (v) v.touch(x, y);
        }
    };
    const _terminate = Scene_Menu.prototype.terminate;
    Scene_Menu.prototype.terminate = function() {
        menuKeys(false);
        if (this._views && this._views.options) ConfigManager.save();
        _terminate.call(this);
    };
    // (for the tests) what the menu shows
    Scene_Menu.prototype.menuInfo = function() {
        if (!this._entries) return null;
        const v = this._view, e = this._entries[this._sel], pairs = this.keyPairs();
        const out = { tabs: this._entries.map(x => x.sym), labels: this._entries.map(x => x.label), active: e ? e.sym : null, level: this._inside ? 2 : 1, inside: this._inside,
            fade: !!this._fade, window: { visible: this._commandWindow.visible, active: this._commandWindow.active }, keys: pairs.map(p => p[1]), keyCaps: pairs.map(p => p[0]),
            activeWindows: v ? v.windows.filter(w => w.active).map(w => w.constructor.name) : [], rows: (this._rowBoxes || []).map(r => ({ i: r.i, x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 })) };
        if (v) Object.assign(out, v.info());
        return out;
    };

    if (!(window.$plugins || []).some(p => p && p.name === "Equipment" && p.status) && !T.api("Equipment")) PluginManager.loadScript("Equipment");
    if (!(window.$plugins || []).some(p => p && p.name === "Drops") && !T.api("Drops")) PluginManager.loadScript("Drops");   // (the bundles - "Wyrzuć")

    window.MenuRing = T.register(PLUGIN, { files: filesInfo, drawSaveCard, fillOldPlaces, placeOfSave, placeFill, ENTRIES, TABS: ENTRIES, L, K, heroXp, needRows, debtInfo,
        opinionInfo, totals, eqCells, VIEWS, PARTS, SORTS, GROUPS, sortBag, groupOf, bagSort, equipSlotOf, UI: { s: UI.s, toScreen, toLocal },
        info: () => { const s = SceneManager._scene; return s instanceof Scene_Menu && s.menuInfo ? s.menuInfo() : null; } });
})();
