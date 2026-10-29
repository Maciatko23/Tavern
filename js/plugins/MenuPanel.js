//=============================================================================
// MenuPanel.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Menu P - części wspólne: polecenia innych wtyczek w menu (addCommand), bez przycisków dotykowych, karta przedmiotu Plecaka (dane), pamiątki i rzeczy do zadań. Samo menu rysuje MenuRing.js. v2.0.0
 * @author Claude
 * @base TawernaCore
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
 * MENU P - CZĘŚCI WSPÓLNE
 * ============================================================================
 * Menu P (i Esc) z zakładkami, ekrany plików i opcji z ekranu tytułowego
 * rysuje MenuRing.js w jednym wyglądzie gry (docs/UI_JEDEN_WYGLAD.md). Dawne
 * menu-panel tej wtyczki (karta postaci, Plecak, Dziennik, Opcje, Zapisz,
 * Zakończ grę w panelu pośrodku) usunięto 2026-10-28 - nic go już nie
 * otwierało. Zostało to, czego używają inne wtyczki:
 *
 *  - Bez przycisków dotykowych w rogu ekranów menu i bez przycisku menu na
 *    mapie (P / Esc i klawisze robią wszystko).
 *  - Window_ItemDetail: okno karty przedmiotu w Plecaku (MenuRing.js rysuje
 *    kartę; okno zbiera opis i to, co dopisują inne wtyczki: zużycie, wodę
 *    w bukłaku, skutek zjedzenia).
 *  - Lista Plecaka „all”: wszystko, co się nosi (przedmioty i narzędzia),
 *    i rzeczy, o które proszą zadania (do porządku listy).
 *
 * DLA INNYCH WTYCZEK (niżej na liście; wołają przy wczytaniu):
 *  MenuPanel.addCommand({ symbol, label, owner, when, enabled, glyph,
 *      badge, ok }) - polecenie w menu P: MenuRing.js pokazuje je jako
 *      osobną zakładkę za swoimi, O otwiera jej ekran - ok(scena). when() -
 *      czy jest w menu tym razem. Tak dochodzi „Plan karczmy”
 *      (TavernLife_Plan).
 *  MenuPanel.addFoot({ owner, when, draw(bitmapa, miejsce) }) - napis
 *      w stopce dawnego menu-panelu. Zostaje, bo woła go Story.js, ale
 *      niczego już nie rysuje (dług dziadka pokazuje zakładka Postać).
 *  MenuPanel.isKeepsake(rzecz), questNeeds(), stampText(czas).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("MenuPanel.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    // ------------------------------------------------------------------
    // The other plugins' entries in the P menu (given at load time; the same symbol / owner again - the plugin put into the page
    // twice - replaces the old one; one that throws is told in the console and the menu goes on):
    //   addCommand({ symbol, label, owner, when(), enabled(), glyph(ctx, x, y, size, colour), badge(), ok(scene) })
    //     a command in the menu's command window (hidden: MenuRing.js shows it as a tab after its own; O on it calls ok(scene));
    //     when() false: not in the menu this time
    //   addFoot({ owner, when(), draw(bitmap, area) }) - the old panel's foot band (gone 2026-10-28): kept so Story.js's call stays
    //     valid; nothing draws these now (the debt is on the P menu's Postać page)
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
    // No touch buttons in the top right corner of any menu screen: neither the back arrow nor the page arrows (Esc / P and the
    // arrow keys do all of it). (Scene_Options: OptionEx.js asks for page buttons; Skill / Equip / Status: the engine does.)
    // ------------------------------------------------------------------
    Scene_MenuBase.prototype.needsCancelButton = function() { return false; };
    Scene_Map.prototype.createMenuButton = function() {};   // (nor the menu button on the map: P / Esc opens the menu)
    for (const S of [Scene_MenuBase, Scene_Options, Scene_Skill, Scene_Equip, Scene_Status]) S.prototype.needsPageButtons = function() { return false; };

    // ------------------------------------------------------------------
    // The bag's card window (MenuRing.js's Plecak draws the card into it - its refresh is set there): a Window_Help that keeps what
    // the item's description is (_desc) and what came after using it (_note); the other plugins' setItem hooks (Durability's wear,
    // Needs' water in the skin, Spoilage) add to the description as they did
    // ------------------------------------------------------------------
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
    Window_ItemDetail.prototype.refresh = function() {   // (the owner draws the card: MenuRing.js)
        if (this.contents) this.contents.clear();
    };

    // ------------------------------------------------------------------
    // The bag's list "all" (MenuRing.js's Plecak): the things and the tools; the items the active quests ask for are noted for the
    // list's order (_questIds)
    // ------------------------------------------------------------------
    // the items the active town quests (their current step) and the quest board's contracts ask for
    function questNeeds() {
        const ids = new Set();
        try {
            const TQ = T.api("TownQuests");
            if (TQ && TQ.QUESTS && TQ.rec) for (const q of TQ.QUESTS) {
                const r = TQ.rec(q.id), st = r && r.s === "active" ? q.steps[r.step] : null;
                for (const n of (st && st.need) || []) if (typeof n[0] === "number") ids.add(n[0]);
            }
        } catch (e) { /* (no quests: nothing) */ }
        try {
            const QB = T.api("QuestBoard");
            if (QB && QB.active) for (const n of QB.active()) for (const q of n.req || []) if (q.k === "item") ids.add(q.id);
        } catch (e) { /* (no board: nothing) */ }
        return ids;
    }
    const _ilMake = Window_ItemList.prototype.makeItemList;
    Window_ItemList.prototype.makeItemList = function() {
        this._questIds = this._category === "all" ? questNeeds() : null;
        _ilMake.call(this);
    };
    const _ilIncludes = Window_ItemList.prototype.includes;
    Window_ItemList.prototype.includes = function(item) {
        if (this._category !== "all") return _ilIncludes.call(this, item);
        return !!item && DataManager.isItem(item) && (item.itypeId === 1 || item.itypeId === 2);
    };
    // a keepsake (the user, 2026-10-14: "Pamiątki" - the story's things): the note tag <Pamiatka> (or <Pamiątka>), the prologue's pendant
    // (Story.PENDANT), and a key item that weighs nothing (<Weight:0> - every tool weighs something); never sold, never thrown away
    function isKeepsake(it) {
        if (!it || !DataManager.isItem(it)) return false;
        if (it.meta && (it.meta.Pamiatka !== undefined || it.meta["Pamiątka"] !== undefined)) return true;
        const ST = T.api("Story");
        if (it.id === (ST && ST.PENDANT ? ST.PENDANT : 172)) return true;
        return it.itypeId === 2 && !!it.meta && it.meta.Weight !== undefined && Number(it.meta.Weight) === 0;
    }
    // a save's time as the file lists write it: "28.10.2026, 16:38"
    function stampText(ts) {
        const d = new Date(ts), two = n => String(n).padStart(2, "0");
        return two(d.getDate()) + "." + two(d.getMonth() + 1) + "." + d.getFullYear() + ", " + two(d.getHours()) + ":" + two(d.getMinutes());
    }

    window.MenuPanel = T.register("MenuPanel", { Window_ItemDetail, addCommand, addFoot, commands: () => commands.map(c => c.symbol),
        feet: () => feet.map(f => f.owner || ""), commandOf, isKeepsake, questNeeds, stampText });
})();
