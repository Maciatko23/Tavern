/*:
 * @target MZ
 * @plugindesc Menu deweloperskie (F9) w trzech zakładkach: zdarzenia (czas, pogoda, ptaki, dzik), budowanie (każda budowla za darmo) i przedmioty (dowolna ilość). v1.3.0
 * @author Tawerna
 *
 * @param enabled
 * @text Włączone
 * @type boolean
 * @default true
 * @desc Wyłącz (false) przed wydaniem gry, żeby F9 nie działało u gracza. Włączone domyślnie na czas developmentu/testów.
 *
 * @help
 * Klawisz F9 (poza wiadomościami i innymi menu) otwiera prosty ekran z trzema zakładkami;
 * Q / E przełączają zakładki (jak w dzienniku), góra / dół wybierają:
 *   1. Zdarzenia:
 *      - "+1 godzina" / "+1 dzień": przesuwa zegar gry (tak jak w Farming.js).
 *      - "Burza teraz", "Piorun tuż obok", "Piorun w drzewo", "Koniec pogody na dziś": pogoda (Survival.js / Storm.js).
 *      - "Stadko ptaków na ziemi", "Nalot ptaków na pole": ptaki (Birds.js) - nalot tylko, gdy na mapie coś rośnie
 *        poza zasięgiem stracha na wróble.
 *      - "Dzik w pobliżu", "Wataha wilków (3)" (Hunting.js), "+200 doświadczenia" (Combat.js).
 *   2. Budowanie: "Postaw: ..." (każda budowla z Farming.js): wraca na mapę w zwykłym trybie stawiania (strzałki,
 *      R / Q / E odbija, OK stawia, Anuluj wraca), ale za darmo: bez materiałów, bez sił, bez placu budowy
 *      i młotka - budynek od razu stoi gotowy (zagroda od razu ze zwierzętami). Nie trzeba oczyszczać
 *      ziemi, ale nie stanie na wodzie, drzewie, skale ani na innym budynku. Płoty stawia się jeden po drugim.
 *   3. Przedmioty: lista wszystkich przedmiotów; strzałki w lewo/prawo zmieniają ilość
 *      przy podświetlonej pozycji, OK dodaje ją do plecaka.
 * F9 otwiera się na tej zakładce i pozycji, na których ostatnio był. Esc (albo F9) zamyka.
 * Tylko do testowania - przed wydaniem gry ustaw parametr "Włączone" na false.
 */
(() => {
    "use strict";

    const enabled = PluginManager.parameters("Debug").enabled !== "false";
    if (!enabled) return;

    Input.keyMapper[120] = "debugmenu";   // F9

    function canOpen() {
        return !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode &&
            !($gamePlayer && $gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging());
    }

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (Input.isTriggered("debugmenu") && canOpen()) SceneManager.push(Scene_Debug);
        // a building chosen in the menu: placed once the map is back (Farming.js's placer, free and finished at once)
        if ($gameTemp._debugBuild && this === SceneManager._scene && !SceneManager.isSceneChanging() && !$gameTemp._buildMode && !$gameMessage.isBusy()) {
            const type = $gameTemp._debugBuild;
            $gameTemp._debugBuild = null;
            Farming.startFreePlacement(type);
        }
    };

    // the three tabs: their names and the key help shown over the list
    const TABS = [
        { name: "Zdarzenia", help: "↑↓ wybierz   OK wykonaj   Q / E zakładka   Esc zamknij" },
        { name: "Budowanie", help: "↑↓ wybierz   OK postaw (za darmo, od razu gotowe)   Q / E zakładka   Esc zamknij" },
        { name: "Przedmioty", help: "↑↓ wybierz   ←→ ilość   OK dodaj   Q / E zakładka   Esc zamknij" }
    ];
    // where the menu was last time (the tab and the row in each tab): F9 opens there again
    const last = { tab: 0, index: [0, 0, 0] };

    // every row of the menu, each with its tab: 0 the events, 1 the buildings, 2 the items
    function allRows() {
        const rows = [
            { tab: 0, kind: "hour", label: "+1 godzina", icon: 240 },
            { tab: 0, kind: "day", label: "+1 dzień", icon: 241 }
        ];
        if (window.Survival && Survival.forceStorm) {   // the weather (Survival.js plans it, Storm.js shows it)
            rows.push({ tab: 0, kind: "storm", label: "Burza teraz (2 godziny)", icon: 66 },
                { tab: 0, kind: "strike", label: "Piorun tuż obok", icon: 66 },
                { tab: 0, kind: "treestrike", label: "Piorun w drzewo (na ekranie)", icon: 66 },
                { tab: 0, kind: "calm", label: "Koniec pogody na dziś", icon: 70 });
        }
        if (window.Birds) {   // the birds (Birds.js): a flock landing near the player, a raid on the sown fields
            rows.push({ tab: 0, kind: "birds", label: "Stadko ptaków na ziemi", icon: 407 },
                { tab: 0, kind: "raid", label: "Nalot ptaków na pole", icon: 408 });
        }
        if (window.Hunting && Hunting.SPECIES.boar) rows.push({ tab: 0, kind: "boar", label: "Dzik w pobliżu", icon: 416 });   // Hunting.js: one boar a few tiles away
        if (window.Hunting && Hunting.SPECIES.wolf) rows.push({ tab: 0, kind: "wolves", label: "Wataha wilków (3)", icon: 416 });   // Hunting.js: a pack a few tiles away
        if (window.Hunting && Hunting.SPECIES.deer) rows.push({ tab: 0, kind: "deer", label: "Jeleń w pobliżu", icon: 420 });   // Hunting.js: a deer a few tiles away (any hour)
        if (window.Combat) rows.push({ tab: 0, kind: "xp", label: "+200 doświadczenia", icon: 87 });   // Combat.js: to try the levels
        if (window.Farming && Farming.startFreePlacement) {   // every building of Farming.js, put down free and finished
            for (const [type, def] of Object.entries(Farming.BUILDINGS)) {
                const iconItem = Farming.itemOf(def.pack || def.cost[0][0]);
                rows.push({ tab: 1, kind: "build", type, label: "Postaw: " + def.name, icon: iconItem ? iconItem.iconIndex : 0 });
            }
        }
        for (const item of $dataItems) {
            if (item && item.name) rows.push({ tab: 2, kind: "item", item, qty: 1 });
        }
        return rows;
    }

    // ---- the list: the rows of one tab
    function Window_DebugList(rect) {
        this.initialize(rect);
    }
    Window_DebugList.prototype = Object.create(Window_Selectable.prototype);
    Window_DebugList.prototype.constructor = Window_DebugList;

    Window_DebugList.prototype.initialize = function(rect) {
        // built before the base class's own initialize (below) is even called: Window_Selectable's constructor
        // already deactivates/reselects itself, which touches maxItems() and the row data right away
        this._all = allRows();
        this._tab = 0;
        this._rows = this._all.filter(r => r.tab === 0);
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
        this.select(0);
        this.activate();
    };

    // show the rows of tab `tab`, the cursor on row `index`
    Window_DebugList.prototype.setTab = function(tab, index) {
        this._tab = tab;
        this._rows = this._all.filter(r => r.tab === tab);
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, this._rows.length - 1)));
        this.ensureCursorVisible(true);
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

    // ---- the scene: the key help, the tab band, the list; Q / E switch the tabs, F9/Esc close it
    function Scene_Debug() {
        this.initialize(...arguments);
    }
    Scene_Debug.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Debug.prototype.constructor = Scene_Debug;

    Scene_Debug.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const top = this.mainAreaTop(), helpH = this.calcWindowHeight(1, false), tabsH = this.calcWindowHeight(1, true);
        this._help = new Window_Base(new Rectangle(0, top, Graphics.boxWidth, helpH));
        this.addWindow(this._help);
        this._tabs = new Window_Command(new Rectangle(0, top + helpH, Graphics.boxWidth, tabsH));
        this._tabs.maxCols = () => TABS.length;
        this._tabs.makeCommandList = function() { TABS.forEach(t => this.addCommand(t.name, "tab")); };
        this._tabs.itemTextAlign = () => "center";
        this._tabs.refresh();
        this._tabs.deactivate();
        this.addWindow(this._tabs);
        this._list = new Window_DebugList(new Rectangle(0, top + helpH + tabsH, Graphics.boxWidth, this.mainAreaHeight() - helpH - tabsH));
        this._list.setHandler("ok", this.onOk.bind(this));
        this._list.setHandler("cancel", this.popScene.bind(this));
        this._list.setHandler("pagedown", () => this.changeTab(1));
        this._list.setHandler("pageup", () => this.changeTab(-1));
        this.addWindow(this._list);
        this.showTab(last.tab);
    };

    Scene_Debug.prototype.showTab = function(tab) {
        this._tab = tab;
        last.tab = tab;
        this._tabs.select(tab);
        this._list.setTab(tab, last.index[tab]);
        this._list.activate();
        this._help.contents.clear();
        this._help.drawText(TABS[tab].help, 0, 0, this._help.innerWidth, "center");
    };
    Scene_Debug.prototype.changeTab = function(dir) {
        last.index[this._tab] = this._list.index();
        SoundManager.playCursor();
        this.showTab((this._tab + dir + TABS.length) % TABS.length);
    };

    Scene_Debug.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (Input.isTriggered("debugmenu")) this.popScene();   // F9 closes it too
    };
    Scene_Debug.prototype.terminate = function() {
        Scene_MenuBase.prototype.terminate.call(this);
        last.index[this._tab] = this._list.index();   // open here again next time
    };

    Scene_Debug.prototype.onOk = function() {
        const row = this._list.rowData();
        if (row.kind === "hour" || row.kind === "day") {
            $gameSystem.advanceDayNight(row.kind === "day" ? 24 : 1);
            $gameTemp.pushLootPopup(row.icon, row.label, "#9ff0a8");
        } else if (row.kind === "storm" || row.kind === "calm") {
            if (row.kind === "storm") Survival.forceStorm(2);
            else Survival.calmWeather();
            this.popScene();   // back to the map to watch it
        } else if (row.kind === "birds" || row.kind === "raid") {
            this.popScene();   // started once the map is back (Birds.js needs its sprites)
            Birds.pending = row.kind;
        } else if (row.kind === "boar" || row.kind === "wolves" || row.kind === "deer") {
            this.popScene();   // spawned once the map is back
            Hunting.pending = row.kind;
        } else if (row.kind === "xp") {
            Combat.gainXp(200, "F9");
        } else if (row.kind === "build") {
            $gameTemp._debugBuild = row.type;   // the placer starts once the map is back
            this.popScene();
        } else if (row.kind === "strike" || row.kind === "treestrike") {
            // struck once the map runs again (Storm.js)
            if (window.Storm) Storm.pending.push(row.kind === "treestrike" ? { tree: true } : {});
            this.popScene();
        } else {
            $gameParty.gainItem(row.item, row.qty);
            $gameTemp.pushLootPopup(row.item.iconIndex, row.item.name + " ×" + row.qty, "#f3e0a0");
        }
        SoundManager.playOk();
        this._list.activate();
    };

    window.Scene_Debug = Scene_Debug;
})();
