//=============================================================================
// MenuPanel.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Menu gry (P / Esc) i wszystkie jego zakładki w jednym zgrabnym panelu pośrodku ekranu, w stylu HUD (czerń i żółć). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaCore
 * @orderAfter UITheme
 * @orderAfter TawernaUI
 * @orderAfter Journal
 * @orderAfter AltMenuScreen
 * @orderAfter AltSaveScreen
 * @orderAfter OptionEx
 * @orderAfter Survival
 *
 * @help
 * ============================================================================
 * MENU W PANELU
 * ============================================================================
 * Menu pod P (i Esc) nie zasłania już całego ekranu: to jeden panel pośrodku,
 * a dookoła widać przyciemnioną mapę. Każda zakładka wygląda tak samo:
 * nagłówek z tytułem, treść, a na dole podpowiedzi klawiszy.
 *
 *  - Menu (P): po lewej lista (Postać, Plecak, Dziennik, Opcje, Zapisz grę,
 *    Zakończ grę), po prawej karta: portret, imię i poziom, pogoda, zdrowie,
 *    wytrzymałość, sytość, nawodnienie, samopoczucie, narzędzia (z paskiem
 *    zużycia), obciążenie i monety. W nagłówku imię, dzień, pora roku, godzina.
 *  - Plecak: zakładki Przedmioty / Narzędzia (←/→), lista po lewej, po prawej
 *    opis wybranej rzeczy (ile masz, waga, świeżość). Enter używa przedmiotu
 *    od razu - bohater jest jeden, więc bez wybierania postaci; wynik (np.
 *    "Zjadłeś...") pojawia się pod opisem.
 *  - Dziennik (także J): zakładki, lista i opis w tym samym panelu.
 *  - Postać (Combat.js): poziom, atrybuty i umiejętności; przy komendzie
 *    żółta liczba, gdy są punkty do rozdania.
 *  - Opcje, Zapisz / Wczytaj grę, Zakończ grę: ten sam wygląd.
 *
 * Wtyczka zmienia tylko wygląd i układ okien, nie zasady gry. Musi być
 * wczytana po TawernaCore, UITheme, TawernaUI, Journal, AltMenuScreen,
 * AltSaveScreen i OptionEx.
 *
 * DLA INNYCH WTYCZEK (niżej na liście; wołają przy wczytaniu):
 *  MenuPanel.addCommand({ symbol, label, owner, when, enabled, glyph,
 *      badge, ok }) - komenda w menu P (za Postacią, Plecakiem i Dziennikiem,
 *      przed Opcjami). when() - czy jest w menu tym razem; glyph(ctx, x, y,
 *      rozmiar, kolor) - mały rysunek; badge() - żółta liczba z prawej;
 *      ok(scena) - Enter. Tak dochodzi „Plan karczmy” (TavernLife_Plan).
 *  MenuPanel.addFoot({ owner, when, draw(bitmapa, miejsce) }) - napis
 *      z prawej na dole menu P, obok klawiszy; miejsce: { x, y, right, room,
 *      rect }. Tak dochodzi dług dziadka (Story).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("MenuPanel.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const ui = T.ui;
    if (!ui || !ui.panel) throw new Error("MenuPanel.js: brak TawernaUI.js - musi być wyżej na liście wtyczek (the UI kit is missing)");

    const UI = () => ui.style();   // (UITheme.js's UIStyle: black + bright yellow)
    const HEAD = 58, FOOT = 42, TABS = 60;   // px: the head band (title), the tab band under it, the foot band (keys)
    const SIZES = { menu: [900, 504], wide: [1000, 604], options: [720, 572], dialog: [480, 282] };
    function panelRect(kind) {
        const [w, h] = SIZES[kind];
        return new Rectangle(Math.round((Graphics.boxWidth - w) / 2), Math.round((Graphics.boxHeight - h) / 2), w, h);
    }
    // the windows sit on the panel: no frame or background of their own, only their text and the selection
    function flat(...wins) {
        for (const w of wins) if (w) { w.opacity = 0; w.frameVisible = false; }
    }
    function dayLine() {
        if (!$gameSystem || typeof $gameSystem.dayNightDay !== "function") return "";
        const day = T.time.day(), h = T.time.hour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
        const season = T.has("Farming") ? T.time.seasonName(day) : "";   // (Farming.js's seasons)
        return "Dzień " + day + (season ? "  ·  " + season : "") + "  ·  " + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    }
    const fmt = n => (Math.round(n * 10) / 10).toString().replace(".", ",");

    // ------------------------------------------------------------------
    // The other plugins' entries in the P menu (given at load time; the same symbol / owner again - the plugin put into the page
    // twice - replaces the old one; one that throws is told in the console and the menu goes on):
    //   addCommand({ symbol, label, owner, when(), enabled(), glyph(ctx, x, y, size, colour), badge(), ok(scene) })
    //     a command after the ones added the old way (Journal's, Combat's), before Opcje - then sorted: Postać, Plecak, Dziennik
    //     first; when() false: not in the list this time
    //   addFoot({ owner, when(), draw(bitmap, area) }) - on the right of the P menu's foot band, beside the keys;
    //     area: { x (where the keys end), y (their line), right (the edge to keep to), room (right - x), rect (the panel) }
    // ------------------------------------------------------------------
    const commands = [], feet = [];
    function safe(entry, what, fn, ...args) {
        try { return fn(...args); }
        catch (e) { console.error("[MenuPanel] " + (entry.owner || entry.symbol || "?") + " " + what + ":", e); return undefined; }
    }
    function addCommand(spec) {
        if (!spec || !spec.symbol) throw new Error("MenuPanel.addCommand: a symbol is needed");
        if (typeof spec.ok !== "function") throw new Error("MenuPanel.addCommand('" + spec.symbol + "'): ok(scene) is needed");
        const i = commands.findIndex(c => c.symbol === spec.symbol);
        if (i >= 0) commands.splice(i, 1, spec); else commands.push(spec);
        return spec;
    }
    function addFoot(spec) {
        if (!spec || typeof spec.draw !== "function") throw new Error("MenuPanel.addFoot: draw(bitmap, area) is needed");
        const i = spec.owner ? feet.findIndex(f => f.owner === spec.owner) : -1;
        if (i >= 0) feet.splice(i, 1, spec); else feet.push(spec);
        return spec;
    }
    const commandOf = sym => commands.find(c => c.symbol === sym) || null;
    const isOn = c => (typeof c.enabled === "function" ? !!safe(c, "enabled", c.enabled) : c.enabled !== false);
    const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        for (const c of commands) if (!c.when || safe(c, "when", c.when)) this.addCommand(c.label || c.symbol, c.symbol, isOn(c));
    };
    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        for (const c of commands) {
            this._commandWindow.setHandler(c.symbol, () => {
                try { c.ok(this); }
                catch (e) { console.error("[MenuPanel] " + (c.owner || c.symbol) + " ok:", e); this._commandWindow.activate(); }
            });
        }
    };

    // ------------------------------------------------------------------
    // The panel: drawn once behind the windows of a menu scene. spec: { rect, title, subtitle, tabs (a band for tabs under the
    // head), splits (x of vertical lines, from the panel's left), body (lines of text under the head), hints ([[key, what]...]),
    // foot (a foot band without hints: a window fills it), feet (the other plugins' lines beside the hints: addFoot - the P menu) }
    // (the head and the key hints stay the menu's own: TawernaUI's TitleBar / KeyHints are the mini-games' look - bold yellow caps,
    // drawn arrows, a bar of their own - and the menu's look was agreed as it is; the panels and bars are the kit's ui.panel / ui.bar)
    // ------------------------------------------------------------------
    function Sprite_MenuPanel() {
        this.initialize(...arguments);
    }
    Sprite_MenuPanel.prototype = Object.create(Sprite.prototype);
    Sprite_MenuPanel.prototype.constructor = Sprite_MenuPanel;
    Sprite_MenuPanel.prototype.initialize = function(spec) {
        Sprite.prototype.initialize.call(this, new Bitmap(Graphics.width, Graphics.height));
        this._spec = spec;
        this.redraw();
    };
    Sprite_MenuPanel.prototype.set = function(changes) {
        Object.assign(this._spec, changes);
        this.redraw();
    };
    Sprite_MenuPanel.prototype.redraw = function() {
        const b = this.bitmap, ctx = b.context, s = this._spec, r = s.rect, U = UI();
        const hline = (x1, x2, y, colour) => { ctx.fillStyle = colour || U.line; ctx.fillRect(x1, y, x2 - x1, 1); };
        b.clear();
        ctx.save();
        ctx.fillStyle = "rgba(3,4,6,0.45)";   // the map around, a little darker
        ctx.fillRect(0, 0, b.width, b.height);
        for (let i = 1; i <= 8; i++) {        // a soft shadow under the panel
            ctx.fillStyle = "rgba(0,0,0," + (0.06 * (9 - i) / 8).toFixed(3) + ")";
            ctx.fillRect(r.x - i + 3, r.y - i + 7, r.width + i * 2, r.height + i * 2);
        }
        ctx.restore();
        ui.panel(b, r.x, r.y, r.width, r.height, { cut: 8, fill: "rgba(12,13,17,0.97)" });
        // the head: the title with a short yellow line under it, the subtitle on the right
        b.fontSize = 28;
        b.textColor = U.accent;
        b.drawText(s.title || "", r.x + 26, r.y + 9, r.width - 52, 38, "left");
        const tw = Math.min(180, Math.ceil(b.measureTextWidth(s.title || "")));
        ctx.fillStyle = U.accent;
        ctx.fillRect(r.x + 26, r.y + 47, tw, 2);
        if (s.subtitle) {
            b.fontSize = 20;
            b.textColor = U.muted;
            b.drawText(s.subtitle, r.x + 26, r.y + 12, r.width - 52 - (s.buttonRoom || 0), 34, "right");
        }
        hline(r.x + 14, r.x + r.width - 14, r.y + HEAD);
        let top = r.y + HEAD;
        if (s.tabs) {
            top += TABS;
            hline(r.x + 14, r.x + r.width - 14, top);
        }
        if (s.body) {
            b.fontSize = 22;
            b.textColor = U.text;
            s.body.forEach((line, i) => {
                b.textColor = i === 0 ? U.text : U.muted;
                b.fontSize = i === 0 ? 22 : 20;
                b.drawText(line, r.x + 26, top + 14 + i * 30, r.width - 52, 30, "left");
            });
        }
        const bottom = r.y + r.height - (s.hints || s.foot ? FOOT : 0);
        for (const sx of s.splits || []) {
            ctx.fillStyle = U.line;
            ctx.fillRect(r.x + sx, top + 12, 1, bottom - top - 24);
        }
        if (s.hints || s.foot) hline(r.x + 14, r.x + r.width - 14, bottom);
        if (s.hints) {
            const end = drawHints(b, r.x + 24, bottom + 9, s.hints), right = r.x + r.width - 26;
            if (s.feet) {
                for (const f of feet) {
                    if (!f.when || safe(f, "when", f.when)) safe(f, "draw", f.draw, b, { x: end, y: bottom + 9, right, room: right - end, rect: r });
                }
            }
        }
        b.fontSize = 22;
    };
    // the keys in the foot: a small key cap, then what it does; returns the x where they end (with the gap after the last one)
    function drawHints(b, x, y, hints) {
        const U = UI();
        for (const [key, what] of hints) {
            b.fontSize = 16;
            const kw = Math.max(26, Math.ceil(b.measureTextWidth(key)) + 14);
            ui.panel(b, x, y + 1, kw, 22, { cut: 3, fill: "#1b1d23", accent: false });
            b.textColor = U.text;
            b.drawText(key, x, y, kw, 24, "center");
            x += kw + 8;
            b.fontSize = 18;
            b.textColor = U.muted;
            b.drawText(what, x, y - 1, 300, 26, "left");
            x += Math.ceil(b.measureTextWidth(what)) + 24;
        }
        return x;
    }
    // No touch buttons in the top right corner of any menu screen: neither the back arrow nor the page arrows (Esc / P and the
    // arrow keys do all of it). (Scene_Options: OptionEx.js asks for page buttons; Skill / Equip / Status: the engine does.)
    Scene_MenuBase.prototype.needsCancelButton = function() { return false; };
    Scene_Map.prototype.createMenuButton = function() {};   // (nor the menu button on the map: P / Esc opens the menu)
    for (const S of [Scene_MenuBase, Scene_Options, Scene_Skill, Scene_Equip, Scene_Status]) S.prototype.needsPageButtons = function() { return false; };
    // (should one be there after all - another plugin's scene - it goes into the head, on the right; returns the room they take)
    function placeButtons(scene, r) {
        let x = r.x + r.width - 14;
        for (const btn of [scene._cancelButton, scene._pagedownButton, scene._pageupButton]) {
            if (!btn) continue;
            x -= btn.width;
            btn.x = x;
            btn.y = r.y + Math.round((HEAD - btn.height) / 2);
            x -= 6;
        }
        return r.x + r.width - 14 - x;
    }
    function addPanel(scene, spec) {
        spec.buttonRoom = placeButtons(scene, spec.rect);
        const panel = new Sprite_MenuPanel(spec);
        const i = scene.children.indexOf(scene._windowLayer);
        scene.addChildAt(panel, i >= 0 ? i : scene.children.length);
        scene._menuPanel = panel;
        return panel;
    }

    // ------------------------------------------------------------------
    // Little line drawings for the menu's commands (20 x 20, in one colour)
    // ------------------------------------------------------------------
    function commandGlyph(ctx, kind, x, y, size, colour) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 20, size / 20);
        ctx.strokeStyle = colour;
        ctx.fillStyle = colour;
        ctx.lineWidth = 1.7;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const path = draw => { ctx.beginPath(); draw(); ctx.stroke(); };
        if (kind === "item") {            // a backpack
            path(() => { ctx.moveTo(4.5, 17.5); ctx.lineTo(4.5, 9); ctx.quadraticCurveTo(4.5, 5, 10, 5); ctx.quadraticCurveTo(15.5, 5, 15.5, 9); ctx.lineTo(15.5, 17.5); ctx.closePath(); });
            path(() => { ctx.moveTo(8, 5.2); ctx.lineTo(8, 3); ctx.lineTo(12, 3); ctx.lineTo(12, 5.2); });
            path(() => { ctx.rect(7.2, 11.5, 5.6, 3.6); });
        } else if (kind === "journal") {  // an open book
            path(() => { ctx.moveTo(10, 5.5); ctx.quadraticCurveTo(6.5, 3.6, 2.5, 4.6); ctx.lineTo(2.5, 16); ctx.quadraticCurveTo(6.5, 15, 10, 16.8);
                ctx.quadraticCurveTo(13.5, 15, 17.5, 16); ctx.lineTo(17.5, 4.6); ctx.quadraticCurveTo(13.5, 3.6, 10, 5.5); ctx.lineTo(10, 16.8); });
        } else if (kind === "options") {  // a cog
            path(() => { ctx.arc(10, 10, 5.3, 0, Math.PI * 2); });
            path(() => { ctx.arc(10, 10, 2, 0, Math.PI * 2); });
            path(() => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.moveTo(10 + Math.cos(a) * 5.3, 10 + Math.sin(a) * 5.3); ctx.lineTo(10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8); } });
        } else if (kind === "save") {     // a quill over a page
            path(() => { ctx.moveTo(3.5, 3.5); ctx.lineTo(12, 3.5); ctx.lineTo(12, 17); ctx.lineTo(3.5, 17); ctx.closePath(); });
            path(() => { ctx.moveTo(5.8, 7.5); ctx.lineTo(9.5, 7.5); ctx.moveTo(5.8, 10.5); ctx.lineTo(9.5, 10.5); });
            path(() => { ctx.moveTo(17.5, 2.5); ctx.quadraticCurveTo(12, 6, 9.5, 14.5); ctx.moveTo(17.5, 2.5); ctx.quadraticCurveTo(17, 8, 11.5, 11.5); });
        } else if (kind === "hero") {     // a figure with a small star: the hero growing
            path(() => { ctx.arc(8.5, 5.5, 2.8, 0, Math.PI * 2); });
            path(() => { ctx.moveTo(3, 17.5); ctx.lineTo(3, 14); ctx.quadraticCurveTo(3, 10, 8.5, 10); ctx.quadraticCurveTo(14, 10, 14, 14); ctx.lineTo(14, 17.5); });
            path(() => { ctx.moveTo(16.5, 2.5); ctx.lineTo(16.5, 7.5); ctx.moveTo(14, 5); ctx.lineTo(19, 5); });
        } else if (kind === "gameEnd") {  // a door, the way out
            path(() => { ctx.moveTo(11, 3); ctx.lineTo(4, 3); ctx.lineTo(4, 17); ctx.lineTo(11, 17); });
            path(() => { ctx.moveTo(8, 10); ctx.lineTo(17, 10); ctx.moveTo(14, 7); ctx.lineTo(17, 10); ctx.lineTo(14, 13); });
        }
        ctx.restore();
    }

    // ==================================================================
    // P: the character and the commands
    // ==================================================================
    const COMMAND_LABELS = { item: "Plecak", journal: "Dziennik", hero: "Postać", options: "Opcje", save: "Zapisz grę", gameEnd: "Zakończ grę" };
    const MENU_SPLIT = 262;   // px from the panel's left: the commands | the card
    // the order from the top (the user's, 2026-09-25): Postać, Plecak, Dziennik, then the rest as the plugins add them
    const COMMAND_ORDER = ["hero", "item", "journal"];
    // the yellow count on the right: Postać's points to give out (Combat.js), an added command's badge()
    const BADGES = { hero: () => T.call("Combat", "unspent") || 0 };
    function badgeOf(sym) {
        const c = commandOf(sym), f = (c && c.badge) || BADGES[sym];
        return f ? Number(safe(c || { symbol: sym }, "badge", f)) || 0 : 0;
    }
    const _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
    Window_MenuCommand.prototype.makeCommandList = function() {
        _Window_MenuCommand_makeCommandList.call(this);
        const rank = c => { const i = COMMAND_ORDER.indexOf(c.symbol); return i < 0 ? COMMAND_ORDER.length : i; };
        this._list = this._list.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map(o => o.c);
    };
    Window_MenuCommand.prototype.maxCols = function() { return 1; };
    Window_MenuCommand.prototype.numVisibleRows = function() { return Math.max(1, this.maxItems()); };
    Window_MenuCommand.prototype.itemHeight = function() { return 50; };
    Window_MenuCommand.prototype.drawItem = function(index) {
        const r = this.itemLineRect(index), sym = this.commandSymbol(index), on = this.isCommandEnabled(index), U = UI();
        const added = commandOf(sym), gx = r.x + 4, gy = r.y + Math.round((r.height - 22) / 2), colour = on ? U.accent : U.muted;
        if (added && added.glyph) safe(added, "glyph", added.glyph, this.contents.context, gx, gy, 22, colour);
        else commandGlyph(this.contents.context, sym, gx, gy, 22, colour);
        this.resetTextColor();
        this.changePaintOpacity(on);
        this.drawText(COMMAND_LABELS[sym] || this.commandName(index), r.x + 40, r.y, r.width - 40, "left");
        const points = badgeOf(sym);
        if (points > 0) {   // points to give out: a small yellow count on the right
            this.contents.fontSize = 16;
            const bw = Math.max(24, Math.ceil(this.textWidth(String(points))) + 12), bx = r.x + r.width - bw - 4, by = r.y + Math.round((r.height - 22) / 2);
            ui.panel(this.contents, bx, by, bw, 22, { cut: 3, fill: U.accent, accent: false });
            this.changeTextColor("#101216");
            this.drawText(String(points), bx, by - 7, bw, "center");
            this.resetFontSettings();
        }
        this.changePaintOpacity(true);
    };
    Scene_Menu.prototype.commandWindowRect = function() {
        const r = panelRect("menu");
        return new Rectangle(r.x + 12, r.y + HEAD + 12, MENU_SPLIT - 24, r.height - HEAD - FOOT - 24);
    };
    Scene_Menu.prototype.statusWindowRect = function() {
        const r = panelRect("menu");
        return new Rectangle(r.x + MENU_SPLIT + 8, r.y + HEAD + 6, r.width - MENU_SPLIT - 20, r.height - HEAD - FOOT - 12);
    };
    Scene_Menu.prototype.goldWindowRect = function() {
        return new Rectangle(0, 0, 32, 32);   // (hidden: the coins are on the card)
    };
    const _Scene_Menu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _Scene_Menu_create.call(this);
        this._goldWindow.hide();
        this._statusWindow.deselect();
        flat(this._commandWindow, this._statusWindow);
        const actor = $gameParty.leader();
        addPanel(this, { rect: panelRect("menu"), title: actor ? actor.name() : "Postać", subtitle: dayLine(), splits: [MENU_SPLIT],
            hints: [["↑↓", "wybierz"], ["Enter", "otwórz"], ["Esc", "zamknij"]], feet: true });
    };

    // the card: the portrait, where and how, the four needs, the mood, the tools, the load and the coins
    Window_MenuStatus.prototype.maxCols = function() { return 1; };
    Window_MenuStatus.prototype.numVisibleRows = function() { return 1; };
    Window_MenuStatus.prototype.itemHeight = function() { return this.innerHeight; };
    const _Window_MenuStatus_drawItem = Window_MenuStatus.prototype.drawItem;
    Window_MenuStatus.prototype.drawItem = function(index) {
        if (this instanceof Window_MenuActor) return _Window_MenuStatus_drawItem.call(this, index);
        if (index === 0) drawCard(this);
    };
    Window_MenuStatus.prototype.drawItemBackground = function() {};
    const PORTRAIT = { w: 184, h: 238 };
    function drawPortrait(win, actor, x, y) {
        ui.panel(win.contents, x, y, PORTRAIT.w, PORTRAIT.h, { cut: 6, fill: "#101216", accent: false });
        const name = actor.pictureName ? actor.pictureName() : "";
        if (!name) { win.drawActorFace(actor, x + (PORTRAIT.w - 144) / 2, y + 40); return; }
        const bmp = ImageManager.loadPicture(name);
        if (!bmp.isReady()) { bmp.addLoadListener(() => win.refresh()); return; }
        // the bust out of the whole picture (ActorPictures.js: its centre and offset), shrunk into the frame
        const bw = bmp.width, sw = Math.min(bw, 300), sh = Math.round(sw * (PORTRAIT.h - 8) / (PORTRAIT.w - 8));
        const cx = (ImageManager.centerX && ImageManager.centerX(name)) || bw / 2, oy = (ImageManager.offsetY && ImageManager.offsetY(name)) || 0;
        const sx = Math.max(0, Math.min(bw - sw, Math.round(cx - sw / 2)));
        win.contents.blt(bmp, sx, oy, sw, Math.min(sh, bmp.height - oy), x + 4, y + 4, PORTRAIT.w - 8, Math.round((PORTRAIT.w - 8) * Math.min(sh, bmp.height - oy) / sw));
    }
    function statRow(win, x, y, w, kind, label, ratio, colour, value, warn) {
        const U = UI(), ctx = win.contents.context, bx = x + 168, bw = w - 168 - 92;
        U.chip(ctx, kind, x, y + 7, 22);
        win.contents.fontSize = 20;
        win.changeTextColor(U.text);
        win.drawText(label, x + 32, y, 136);
        ui.bar(win.contents, bx, y + 13, bw, 10, ratio, colour);
        win.changeTextColor(warn ? "#ff9f8f" : U.text);
        win.drawText(value, bx + bw + 6, y, 86, "right");
        win.resetFontSettings();
    }
    function sectionLabel(win, text, x, y, w) {
        win.contents.fontSize = 16;
        win.changeTextColor(UI().muted);
        win.drawText(text.toUpperCase(), x, y, w);
        win.resetFontSettings();
    }
    function weatherText() {
        const S = T.api("Survival"), outdoors = S && S.isOutdoors ? S.isOutdoors() : T.mapFlag("Clouds", false) || T.mapFlag("Weather", false);
        if (!outdoors) return "pod dachem";
        const type = $gameScreen.weatherType(), active = ($gameScreen._weatherPowerTarget || 0) > 0;
        return active && type === "storm" ? "burza" : active && type === "rain" ? "deszcz" : active && type === "snow" ? "śnieg" : "bezdeszczowo";
    }
    function drawCard(win) {
        const actor = $gameParty.leader();
        if (!actor) return;
        const U = UI(), W = win.innerWidth, ctx = win.contents.context;
        drawPortrait(win, actor, 0, 0);
        const x = PORTRAIT.w + 24, w = W - x;
        // who (the name and the level - Combat.js - where the map's name was, the user's, 2026-09-25) and the weather
        win.contents.fontSize = 22;
        win.changeTextColor(U.text);
        const hero = T.call("Combat", "hero"), name = actor.name(), level = hero ? hero.level : actor.level;
        win.drawText(name, x, 0, w - 150);
        win.changeTextColor(U.accent);
        win.drawText("Poziom " + level, x + Math.ceil(win.textWidth(name)) + 14, 0, w - 150);
        win.changeTextColor(U.muted);
        win.drawText(weatherText(), x, 0, w, "right");
        win.resetFontSettings();
        ctx.fillStyle = U.line;
        ctx.fillRect(x, 40, w, 1);
        // the four needs
        let y = 50;
        const hp = typeof $gameSystem.healthRatio === "function" ? $gameSystem.healthRatio() : actor.mhp > 0 ? actor.hp / actor.mhp : 1;
        statRow(win, x, y, w, "health", "Zdrowie", hp, "#e5484d", Math.round(hp * 100) + "%", hp < 0.3);
        y += 36;
        const st = typeof $gameSystem.staminaRatio === "function" ? $gameSystem.staminaRatio() : 1;
        const cur = Math.round($gameSystem.stamina ? $gameSystem.stamina() : 100), max = Math.round($gameSystem.maxStamina ? $gameSystem.maxStamina() : 100);
        statRow(win, x, y, w, "stamina", "Wytrzymałość", st, st > 0.25 ? "#62c66a" : "#e0a040", cur + " / " + max, st <= 0.25);
        y += 36;
        const N = T.api("Needs");
        if (N && N.enabled()) {
            const n = N.state(), ft = N.foodText(), wt = N.waterText();
            statRow(win, x, y, w, "food", "Sytość", n.food / 100, "#e0b24a", ft || Math.round(n.food) + " / 100", !!ft);
            y += 36;
            statRow(win, x, y, w, "water", "Nawodnienie", n.water / 100, "#62b6ee", wt || Math.round(n.water) + " / 100", !!wt);
            y += 36;
        }
        // the mood: what works on the hero now
        y += 4;
        sectionLabel(win, "Samopoczucie", x, y, w);
        y += 28;
        const S = T.api("Survival"), buffs = typeof $gameSystem.activeBuffs === "function" && S ? $gameSystem.activeBuffs() : [];
        const cold = typeof $gameSystem.isCold === "function" && $gameSystem.isCold();
        let bx = x;
        const chip = (icon, text, colour) => {
            win.contents.fontSize = 18;
            const tw = Math.ceil(win.textWidth(text)), cw = (icon ? 30 : 12) + tw + 12;
            if (bx + cw > x + w) return;
            ui.panel(win.contents, bx, y, cw, 28, { cut: 4, fill: "#171a1f", accent: false });
            if (icon) win.drawIcon(icon, bx + 1, y - 2);
            win.changeTextColor(colour || U.text);
            win.contents.drawText(text, bx + (icon ? 32 : 8), y, tw + 4, 28);
            bx += cw + 8;
            win.resetFontSettings();
        };
        if (buffs.length === 0 && !cold) chip(0, "w normie", U.muted);
        for (const b of buffs) {
            const def = S.BUFFS[b.name];
            if (def) chip(def.icon, def.name + " · " + Math.max(1, Math.ceil(b.left)) + " godz.", def.bad ? "#ff9f8f" : U.text);
        }
        if (cold) chip(0, "Zimno: praca męczy bardziej", "#9fd0ff");
        // the tools (with how worn they are), the load, the coins - under the portrait and the mood, whichever ends lower
        y = Math.max(PORTRAIT.h, y + 28) + 12;
        ctx.fillStyle = U.line;
        ctx.fillRect(0, y, W, 1);
        y += 10;
        sectionLabel(win, "Narzędzia i wyposażenie", 0, y, W - 260);
        sectionLabel(win, "Obciążenie", W - 240, y, 120);
        sectionLabel(win, "Monety", W - 110, y, 110);
        y += 30;
        const tools = $gameParty.items().filter(i => i.itypeId === 2), slot = 40, room = Math.floor((W - 260) / (slot + 6));
        if (tools.length === 0) {
            win.contents.fontSize = 18;
            win.changeTextColor(U.muted);
            win.drawText("jeszcze nic", 0, y, 200);
            win.resetFontSettings();
        }
        tools.slice(0, room).forEach((item, i) => {
            const sx = i * (slot + 6);
            ui.panel(win.contents, sx, y, slot, slot, { cut: 4, fill: "#15171c", accent: false });
            win.drawIcon(item.iconIndex, sx + 4, y + 4);
            const D = T.api("Durability");
            if (D && D.TOOLS && D.TOOLS[item.id] && D.lifeOf) {
                const ratio = Math.max(0, Math.min(1, D.left(item.id) / D.lifeOf(item.id)));
                ui.bar(win.contents, sx + 4, y + slot - 5, slot - 8, 2, ratio, ratio <= 0.2 ? "#e5484d" : ratio <= 0.4 ? "#e0a040" : "#62c66a");
            }
        });
        win.contents.fontSize = 22;
        if (S && S.carriedWeight && S.weightCap) {
            const load = S.carriedWeight(), cap = S.weightCap();
            win.changeTextColor(load > cap ? "#ff9f8f" : U.text);
            win.drawText(fmt(load) + " / " + fmt(cap), W - 240, y + 2, 120);
        }
        win.changeTextColor(U.accent);
        win.drawText(String($gameParty.gold()), W - 110, y + 2, 110);
        win.resetFontSettings();
    }

    // ==================================================================
    // Plecak (Scene_Item): the tabs, the list, what the chosen thing is
    // ==================================================================
    const ITEM_SPLIT = 560;
    const CATEGORY_LABELS = { item: "Przedmioty", keyItem: "Narzędzia", weapon: "Broń", armor: "Pancerz" };
    Window_ItemCategory.prototype.makeCommandList = function() {
        for (const sym of ["item", "keyItem", "weapon", "armor"]) {
            if (this.needsCommand(sym)) this.addCommand(CATEGORY_LABELS[sym], sym);
        }
    };
    const bodyTop = (r, tabs) => r.y + HEAD + (tabs ? TABS : 0);
    const bodyHeight = (r, tabs) => r.height - HEAD - (tabs ? TABS : 0) - FOOT;
    Scene_Item.prototype.categoryWindowRect = function() {
        const r = panelRect("wide");
        return new Rectangle(r.x + 14, r.y + HEAD - 4, r.width - 28, 68);
    };
    Scene_Item.prototype.itemWindowRect = function() {
        const r = panelRect("wide");
        return new Rectangle(r.x + 10, bodyTop(r, true) + 6, ITEM_SPLIT - 18, bodyHeight(r, true) - 12);
    };
    Scene_Item.prototype.helpWindowRect = function() {
        const r = panelRect("wide");
        return new Rectangle(r.x + ITEM_SPLIT + 8, bodyTop(r, true) + 6, r.width - ITEM_SPLIT - 18, bodyHeight(r, true) - 12);
    };
    Scene_Item.prototype.actorWindowRect = function() {   // (only with more than one hero)
        const r = panelRect("wide");
        return new Rectangle(r.x + 120, r.y + 160, r.width - 240, 180);
    };
    Scene_Item.prototype.createHelpWindow = function() {
        this._helpWindow = new Window_ItemDetail(this.helpWindowRect());
        this.addWindow(this._helpWindow);
    };
    function loadLine() {
        const S = T.api("Survival");
        return S && S.carriedWeight && S.weightCap ? "Obciążenie  " + fmt(S.carriedWeight()) + " / " + fmt(S.weightCap()) : "";
    }
    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function() {
        _Scene_Item_create.call(this);
        const iw = this._itemWindow, cw = this._categoryWindow, help = this._helpWindow;
        iw.maxCols = () => 1;
        // everything in the bag in full colour; what cannot be used still says why when Enter is pressed on it
        iw.changePaintOpacity = function() { Window_Base.prototype.changePaintOpacity.call(this, true); };
        iw.playBuzzerSound = function() {
            help._note = "";
            Window_ItemList.prototype.playBuzzerSound.call(this);   // (Survival.js puts its reason under the description)
            const item = this.item();
            if (item && !help._note) help.setText(item.itypeId === 2 ? "Tego się nie używa z plecaka: narzędzie działa samo, kiedy jest potrzebne." : "Tego nie da się zjeść ani użyć: to materiał do budowania i wytwarzania.");
        };
        iw.refresh();
        flat(cw, iw, help);
        addPanel(this, { rect: panelRect("wide"), title: "Plecak", subtitle: loadLine(), tabs: true, splits: [ITEM_SPLIT],
            hints: [["↑↓", "wybierz"], ["←→", "zakładka"], ["Enter", "użyj"], ["Esc", "wróć"]] });
        // straight into the list; the tabs change with ← / → (and page up / down), cancel closes the bag
        cw.deactivate();
        cw.update();   // (hands its category to the list now, so the first item is described at once)
        iw.setHandler("cancel", this.popScene.bind(this));
        iw.setHandler("pageup", () => this.shiftCategory(-1));
        iw.setHandler("pagedown", () => this.shiftCategory(1));
        iw.cursorLeft = () => this.shiftCategory(-1);
        iw.cursorRight = () => this.shiftCategory(1);
        this.onCategoryOk();
    };
    Scene_Item.prototype.shiftCategory = function(dir) {
        const cw = this._categoryWindow, iw = this._itemWindow, n = cw.maxItems();
        if (n < 2) return;
        cw.select((cw.index() + dir + n) % n);
        cw.update();   // (it hands the category to the list)
        SoundManager.playCursor();
        iw.activate();
        iw.select(iw.maxItems() > 0 ? 0 : -1);
        if (iw.maxItems() === 0) this._helpWindow.clear();
    };
    // one hero: nobody to choose - Enter uses the item on him at once (the message goes under the description)
    const _Scene_Item_determineItem = Scene_Item.prototype.determineItem;
    Scene_Item.prototype.determineItem = function() {
        this._solo = $gameParty.members().length === 1;
        this._soloUse = false;
        _Scene_Item_determineItem.call(this);
        this._solo = false;
        if (!this._soloUse) return;
        this._soloUse = false;
        const help = this._helpWindow, setText = help.setText;
        let said = null;
        help.setText = function(text) { said = text; setText.call(this, text); };
        if (this.canUse()) this.useItem(); else SoundManager.playBuzzer();
        help.setText = setText;
        this.activateItemWindow();
        if (said) help.setText(said);
    };
    const _Scene_Item_showActorWindow = Scene_Item.prototype.showActorWindow;
    Scene_Item.prototype.showActorWindow = function() {
        if (!this._solo) return _Scene_Item_showActorWindow.call(this);
        this._soloUse = true;   // (the actor window is left hidden; determineItem uses the item right after)
    };
    const _Scene_Item_useItem = Scene_Item.prototype.useItem;
    Scene_Item.prototype.useItem = function() {
        _Scene_Item_useItem.call(this);
        if (this._menuPanel) this._menuPanel.set({ subtitle: loadLine() });
    };

    // the right half of the bag: a big icon, the name, how many and how heavy, freshness, then the description; a message
    // (what eating it did, why it cannot be used) in a green box under it
    function Window_ItemDetail() {
        this.initialize(...arguments);
    }
    Window_ItemDetail.prototype = Object.create(Window_Help.prototype);
    Window_ItemDetail.prototype.constructor = Window_ItemDetail;
    Window_ItemDetail.prototype.initialize = function(rect) {
        this._item = null;
        this._desc = "";
        this._note = "";
        this._inSetItem = false;
        Window_Help.prototype.initialize.call(this, rect);
    };
    Window_ItemDetail.prototype.setItem = function(item) {
        this._item = item || null;
        this._desc = "";
        this._note = "";
        this._inSetItem = true;
        Window_Help.prototype.setItem.call(this, item);   // (with what other plugins add: wear, the water in the skin...)
        this._inSetItem = false;
        this.refresh();
    };
    Window_ItemDetail.prototype.setText = function(text) {
        if (this._inSetItem) this._desc = text || "";
        else this._note = text || "";
        if (!this._inSetItem) this.refresh();
    };
    Window_ItemDetail.prototype.clear = function() {
        this._item = null;
        this._desc = "";
        this._note = "";
        this.refresh();
    };
    function wrapLines(win, text, width) {
        const out = [];
        for (const para of String(text || "").split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const next = line ? line + " " + word : word;
                if (line && win.textSizeEx(next).width > width) { out.push(line); line = word; } else line = next;
            }
            out.push(line);
        }
        while (out.length && !out[out.length - 1]) out.pop();
        return out;
    }
    Window_ItemDetail.prototype.refresh = function() {
        if (!this.contents) return;
        this.contents.clear();
        const item = this._item, U = UI(), W = this.innerWidth, ctx = this.contents.context;
        if (!item) { if (this._note) this.drawNote(0); return; }
        const S = 64;
        ui.panel(this.contents, 0, 0, S + 12, S + 12, { cut: 5, fill: "#15171c", accent: false });
        const set = ImageManager.loadSystem("IconSet"), pw = ImageManager.iconWidth, ph = ImageManager.iconHeight;
        this.contents.blt(set, (item.iconIndex % 16) * pw, Math.floor(item.iconIndex / 16) * ph, pw, ph, 6, 6, S, S);
        this.contents.fontSize = 26;
        this.changeTextColor(U.accent);
        this.drawText(item.name, S + 26, 0, W - S - 26);
        this.contents.fontSize = 18;
        this.changeTextColor(U.muted);
        const facts = [], n = $gameParty.numItems(item);
        if (n > 0) facts.push("Masz: " + n);
        const w = T.call("Survival", "itemWeight", item);
        if (w) facts.push("Waga: " + fmt(w));
        this.drawText(facts.join("     "), S + 26, 32, W - S - 26);
        const fresh = T.call("Spoilage", "freshnessText", item.id) || "";
        if (fresh) {
            this.changeTextColor("#cfe6a8");
            this.drawText(fresh, S + 26, 54, W - S - 26);
        }
        this.resetFontSettings();
        ctx.fillStyle = U.line;
        ctx.fillRect(0, S + 24, W, 1);
        let y = S + 34;
        this.contents.fontSize = 20;
        const desc = fresh ? this._desc.replace(fresh, "").trim() : this._desc;   // (the freshness is up by the name already)
        for (const line of wrapLines(this, desc, W)) {
            this.drawTextEx("\\FS[20]" + line, 0, y, W);
            y += 30;
        }
        this.resetFontSettings();
        if (this._note) this.drawNote(y + 12);
    };
    Window_ItemDetail.prototype.drawNote = function(y) {
        const U = UI(), W = this.innerWidth;
        this.contents.fontSize = 20;
        const lines = wrapLines(this, this._note, W - 24), h = lines.length * 28 + 18, top = Math.max(0, Math.min(y, this.innerHeight - h));
        ui.panel(this.contents, 0, top, W, h, { cut: 4, fill: "rgba(60,96,52,0.35)", line: "#4c6b45", accent: false });
        this.changeTextColor("#b9f0b0");
        lines.forEach((l, i) => this.drawText(l, 12, top + 7 + i * 28, W - 24));
        this.resetFontSettings();
    };

    // ==================================================================
    // Dziennik (Journal.js, also J): its tabs, list, detail and legend in the panel
    // ==================================================================
    const JOURNAL_SPLIT = 420;
    const JN = T.api("Journal");
    if (JN && JN.Scene_Journal) {
        const SJ = JN.Scene_Journal;
        SJ.prototype.journalRects = function() {
            const r = panelRect("wide"), top = bodyTop(r, true), h = bodyHeight(r, true);
            return { tabs: new Rectangle(r.x + 14, r.y + HEAD - 4, r.width - 28, 68), list: new Rectangle(r.x + 10, top + 6, JOURNAL_SPLIT - 18, h - 12),
                detail: new Rectangle(r.x + JOURNAL_SPLIT + 8, top + 6, r.width - JOURNAL_SPLIT - 18, h - 12),
                legend: new Rectangle(r.x + 12, r.y + r.height - FOOT - 9, r.width - 24, 60) };
        };
        const _SJ_create = SJ.prototype.create;
        SJ.prototype.create = function() {
            _SJ_create.call(this);
            flat(this._tabs, this._list, this._detail, this._legend);
            addPanel(this, { rect: panelRect("wide"), title: "Dziennik", subtitle: dayLine(), tabs: true, splits: [JOURNAL_SPLIT], foot: true });
        };
    }

    // ==================================================================
    // Opcje
    // ==================================================================
    Scene_Options.prototype.optionsWindowRect = function() {
        const r = panelRect("options");
        return new Rectangle(r.x + 16, r.y + HEAD + 8, r.width - 32, r.height - HEAD - FOOT - 16);
    };
    const _Scene_Options_create = Scene_Options.prototype.create;
    Scene_Options.prototype.create = function() {
        _Scene_Options_create.call(this);
        flat(this._optionsWindow);
        addPanel(this, { rect: panelRect("options"), title: "Opcje", hints: [["↑↓", "wybierz"], ["←→", "zmień"], ["Esc", "wróć"]] });
    };

    // ==================================================================
    // Zapisz / Wczytaj grę: the files on the left (one to a row), the chosen one on the right
    // ==================================================================
    const FILE_SPLIT = 430;
    Window_SavefileList.prototype.maxCols = function() { return 1; };
    Window_SavefileList.prototype.itemHeight = function() { return 66; };
    Window_SavefileList.prototype.drawItem = function(index) {
        const id = this.indexToSavefileId(index), info = DataManager.savefileInfo(id), r = this.itemRectWithPadding(index), U = UI();
        this.resetTextColor();
        this.changePaintOpacity(this.isEnabled(id));
        this.contents.fontSize = 22;
        this.changeTextColor(info ? U.text : U.muted);
        this.drawText(id === 0 ? TextManager.autosave : TextManager.file + " " + id, r.x + 4, r.y + 2, r.width - 8);
        this.contents.fontSize = 18;
        this.changeTextColor(U.muted);
        const second = !info ? "pusty" : (info.day !== undefined ? "Dzień " + info.day + (info.season ? " · " + info.season : "") : info.title || "") + (info.playtime ? "     " + info.playtime : "");
        this.drawText(second, r.x + 4, r.y + 30, r.width - 8);
        if (info && info.timestamp) this.drawText(stampText(info.timestamp), r.x + 4, r.y + 2, r.width - 8, "right");
        this.resetFontSettings();
        this.changePaintOpacity(true);
    };
    function stampText(ts) {
        const d = new Date(ts), two = n => String(n).padStart(2, "0");
        return two(d.getDate()) + "." + two(d.getMonth() + 1) + "." + d.getFullYear() + ", " + two(d.getHours()) + ":" + two(d.getMinutes());
    }
    function drawSaveDetail(win, id) {
        const U = UI(), W = win.innerWidth, ctx = win.contents.context, info = DataManager.savefileInfo(id);
        win.contents.clear();
        win.contents.fontSize = 26;
        win.changeTextColor(U.accent);
        win.drawText(id === 0 ? TextManager.autosave : TextManager.file + " " + id, 0, 0, W);
        win.resetFontSettings();
        ctx.fillStyle = U.line;
        ctx.fillRect(0, 44, W, 1);
        if (!info) {
            win.changeTextColor(U.muted);
            win.drawText("Pusty plik.", 0, 58, W);
            win.resetFontSettings();
            return;
        }
        const F = 144;
        ui.panel(win.contents, 0, 58, F + 12, F + 12, { cut: 6, fill: "#101216", accent: false });
        const face = info.faces && info.faces[0];
        if (face) {
            const bmp = ImageManager.loadFace(face[0]);
            if (!bmp.isReady()) bmp.addLoadListener(() => drawSaveDetail(win, id));
            else win.drawFace(face[0], face[1], 6, 64, F, F);
        }
        const x = F + 30, w = W - x, rows = [];
        if (info.day !== undefined) rows.push(["Dzień", info.day + (info.season ? "  ·  " + info.season : "")]);
        if (info.hutBuilt !== undefined) rows.push(["Chatka", info.hutBuilt ? "zbudowana" : "jeszcze nie ma"]);
        if (info.playtime) rows.push(["Czas gry", info.playtime]);
        if (info.timestamp) rows.push(["Zapisano", stampText(info.timestamp)]);
        rows.forEach(([label, value], i) => {
            const y = 60 + i * 38;
            win.contents.fontSize = 18;
            win.changeTextColor(U.muted);
            win.drawText(label, x, y, 110);
            win.contents.fontSize = 22;
            win.changeTextColor(U.text);
            win.drawText(String(value), x + 110, y, w - 110);
        });
        win.resetFontSettings();
    }
    Scene_File.prototype.listWindowRect = function() {
        const r = panelRect("wide");
        return new Rectangle(r.x + 10, bodyTop(r, false) + 8, FILE_SPLIT - 18, bodyHeight(r, false) - 16);
    };
    const _Scene_File_create = Scene_File.prototype.create;
    Scene_File.prototype.create = function() {
        _Scene_File_create.call(this);   // (AltSaveScreen.js has made its status window by now)
        const r = panelRect("wide"), top = bodyTop(r, false) + 8, h = bodyHeight(r, false) - 16;
        if (this._helpWindow) this._helpWindow.hide();
        const lr = this.listWindowRect(), list = this._listWindow;   // (AltSaveScreen.js cut the list to three rows: back to the panel's)
        list.move(lr.x, lr.y, lr.width, lr.height);
        list.createContents();
        list.refresh();
        const st = list.mzkp_statusWindow;
        if (st) {
            st.move(r.x + FILE_SPLIT + 8, top, r.width - FILE_SPLIT - 18, h);
            st.createContents();
            st.refresh = function() { drawSaveDetail(this, this._savefileId); };
            st.refresh();
        }
        flat(this._listWindow, st);
        const saving = this.mode() === "save";
        addPanel(this, { rect: r, title: saving ? "Zapisz grę" : "Wczytaj grę", subtitle: this.helpWindowText(), splits: [FILE_SPLIT],
            hints: [["↑↓", "wybierz"], ["Enter", saving ? "zapisz tutaj" : "wczytaj"], ["Esc", "wróć"]] });
    };

    // ==================================================================
    // Zakończ grę: a small question
    // ==================================================================
    Scene_GameEnd.prototype.commandWindowRect = function() {
        const r = panelRect("dialog"), h = this.calcWindowHeight(2, true);
        return new Rectangle(r.x + 24, r.y + r.height - FOOT - h - 8, r.width - 48, h);
    };
    Window_GameEnd.prototype.itemTextAlign = function() { return "left"; };
    const _Scene_GameEnd_create = Scene_GameEnd.prototype.create;
    Scene_GameEnd.prototype.create = function() {
        _Scene_GameEnd_create.call(this);
        flat(this._commandWindow);
        addPanel(this, { rect: panelRect("dialog"), title: "Zakończ grę", body: ["Wrócić do ekranu tytułowego?", "To, czego nie zapisałeś, przepadnie."],
            hints: [["↑↓", "wybierz"], ["Enter", "potwierdź"], ["Esc", "wróć"]] });
    };

    window.MenuPanel = T.register("MenuPanel", { panelRect, SIZES, HEAD, FOOT, TABS, Sprite_MenuPanel, Window_ItemDetail, addCommand, addFoot,
        commands: () => commands.map(c => c.symbol) });
})();
