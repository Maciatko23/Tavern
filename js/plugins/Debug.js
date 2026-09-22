/*:
 * @target MZ
 * @plugindesc Menu deweloperskie (F9): dodaje graczowi wybrany przedmiot w wybranej ilości, albo przesuwa czas o 1 godzinę / 1 dzień. v1.0.0
 * @author Tawerna
 *
 * @help
 * Klawisz F9 (poza wiadomościami i innymi menu) otwiera prosty ekran:
 *   - "+1 godzina" / "+1 dzień": przesuwa zegar gry (tak jak w Farming.js).
 *   - lista wszystkich przedmiotów: strzałki w lewo/prawo zmieniają ilość
 *     przy podświetlonej pozycji, OK dodaje ją do plecaka.
 * Esc zamyka. Tylko do testowania - nie ma go w żadnym menu gry.
 */
(() => {
    "use strict";

    Input.keyMapper[120] = "debugmenu";   // F9

    function canOpen() {
        return !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode &&
            !($gamePlayer && $gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging());
    }

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (Input.isTriggered("debugmenu") && canOpen()) SceneManager.push(Scene_Debug);
    };

    // ---- the list: two time rows on top, then every item
    function Window_DebugList(rect) {
        this.initialize(rect);
    }
    Window_DebugList.prototype = Object.create(Window_Selectable.prototype);
    Window_DebugList.prototype.constructor = Window_DebugList;

    Window_DebugList.prototype.initialize = function(rect) {
        // built before the base class's own initialize (below) is even called: Window_Selectable's constructor
        // already deactivates/reselects itself, which touches maxItems() and the row data right away
        this._rows = [
            { kind: "hour", label: "+1 godzina", icon: 240 },
            { kind: "day", label: "+1 dzień", icon: 241 }
        ];
        for (const item of $dataItems) {
            if (item && item.name) this._rows.push({ kind: "item", item, qty: 1 });
        }
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
        this.select(0);
        this.activate();
    };

    Window_DebugList.prototype.maxItems = function() {
        return this._rows.length;
    };

    // named rowData, not row: Window_Selectable already has its own row(index) (a scroll-position helper,
    // index / maxCols) that the engine calls internally - overwriting it crashed ensureCursorVisible
    Window_DebugList.prototype.rowData = function(index) {
        return this._rows[index >= 0 ? index : this.index()];
    };

    Window_DebugList.prototype.drawItem = function(index) {
        const row = this._rows[index], rect = this.itemLineRect(index);
        this.drawIcon(row.icon || (row.item && row.item.iconIndex) || 0, rect.x, rect.y + 2);
        const textX = rect.x + ImageManager.iconWidth + 4;
        this.drawText(row.label || row.item.name, textX, rect.y, rect.width - ImageManager.iconWidth - 4, "left");
        if (row.kind === "item") {
            const label = "×" + row.qty, w = this.textWidth(label) + 6;
            this.drawText(label, rect.x + rect.width - w, rect.y, w, "right");
        }
    };

    // left/right change the quantity of the highlighted item instead of moving the cursor
    Window_DebugList.prototype.cursorRight = function() {
        this.changeQty(1);
    };
    Window_DebugList.prototype.cursorLeft = function() {
        this.changeQty(-1);
    };
    Window_DebugList.prototype.changeQty = function(delta) {
        const row = this.rowData();
        if (!row || row.kind !== "item") return;
        row.qty = Math.max(1, Math.min(999, row.qty + delta));
        SoundManager.playCursor();
        this.redrawItem(this.index());
    };

    // ---- the scene: one window, a short help line, F9/Esc close it
    function Scene_Debug() {
        this.initialize(...arguments);
    }
    Scene_Debug.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Debug.prototype.constructor = Scene_Debug;

    Scene_Debug.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const top = this.mainAreaTop(), helpH = this.calcWindowHeight(1, false);
        this._help = new Window_Base(new Rectangle(0, top, Graphics.boxWidth, helpH));
        this._help.drawText("↑↓ wybierz  ←→ ilość  OK dodaj  Esc zamknij", 0, 0, this._help.innerWidth, "center");
        this.addWindow(this._help);
        this._list = new Window_DebugList(new Rectangle(0, top + helpH, Graphics.boxWidth, this.mainAreaHeight() - helpH));
        this._list.setHandler("ok", this.onOk.bind(this));
        this._list.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._list);
    };

    Scene_Debug.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (Input.isTriggered("debugmenu")) this.popScene();   // F9 closes it too
    };

    Scene_Debug.prototype.onOk = function() {
        const row = this._list.rowData();
        if (row.kind === "hour" || row.kind === "day") {
            $gameSystem.advanceDayNight(row.kind === "day" ? 24 : 1);
            $gameTemp.pushLootPopup(row.icon, row.label, "#9ff0a8");
        } else {
            $gameParty.gainItem(row.item, row.qty);
            $gameTemp.pushLootPopup(row.item.iconIndex, row.item.name + " ×" + row.qty, "#f3e0a0");
        }
        SoundManager.playOk();
        this._list.activate();
    };

    window.Scene_Debug = Scene_Debug;
})();
