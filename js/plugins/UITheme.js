//=============================================================================
// UITheme.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Spójny ciemny wygląd interfejsu (drewno i mosiądz): porządek w menu, listach i ekranie tytułowym. v1.0.0
 * @author Claude
 *
 * @param hideRpgCommands
 * @text Ukryj komendy z klasycznego RPG
 * @desc W menu głównym zostają: Przedmioty, Opcje, Zapisz, Zakończ grę. Znikają: Zdolność, Wyposażenie, Status, Formacja.
 * @type boolean
 * @default true
 *
 * @param survivalStatusCard
 * @text Karta postaci w menu (survival)
 * @desc Zamiast HP / MP / poziomu menu pokazuje dzień, porę roku, wytrzymałość, premie i narzędzia.
 * @type boolean
 * @default true
 *
 * @param hideEmptyCategories
 * @text Ukryj puste kategorie (Broń, Zbroja)
 * @desc Zakładki Broń i Zbroja pojawiają się dopiero, gdy masz takie przedmioty.
 * @type boolean
 * @default true
 *
 * @param countAsTimes
 * @text Ilość przedmiotów jako ×7
 * @desc Zamiast ": 7" lista przedmiotów pokazuje "×7".
 * @type boolean
 * @default true
 *
 * @param goldTitle
 * @text Złoty tytuł gry na ekranie tytułowym
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * UITheme.js
 * ============================================================================
 * Wygląd okien (ciemne drewno, mosiężna ramka, bursztynowe zaznaczenie)
 * pochodzi z grafiki img/system/Window.png. Czcionka (Alegreya Sans) jest
 * ustawiona w Baza danych > System 2. Ta wtyczka dopilnowuje reszty:
 *
 *  - Wszystkie nowe obrazki z tekstem (tabliczki HUD, dymki łupów, napisy na
 *    ekranie) używają tej samej czcionki co okna.
 *  - Menu główne bez komend z klasycznego RPG i z kartą postaci pod survival.
 *  - Lista przedmiotów: "×7" zamiast ": 7", puste zakładki Broń / Zbroja
 *    ukryte, zakładki równo rozłożone na całą szerokość.
 *  - Ekran tytułowy: złoty napis z ciemnym obrysem.
 *
 * Ustawienia okien są w wtyczce OptionEx: suwaki koloru okna są wyłączone
 * (przy stałej skórce psułyby wygląd), przezroczystość zostaje do wyboru.
 * Każdy z elementów wyżej można wyłączyć w parametrach tej wtyczki.
 *
 * Kolory tekstu (kremowy, mosiężne etykiety, zielony / czerwony) zapisane są
 * w tabeli barw na dole pliku Window.png (8 x 4 pól po 12 px), jak w każdym
 * standardowym pliku okna RPG Makera.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "UITheme";
    const params = PluginManager.parameters(pluginName);
    const flag = (v, d) => (v === undefined || v === "" ? d : v === "true");
    const HIDE_RPG = flag(params.hideRpgCommands, true);
    const STATUS_CARD = flag(params.survivalStatusCard, true);
    const HIDE_EMPTY = flag(params.hideEmptyCategories, true);
    const COUNT_TIMES = flag(params.countAsTimes, true);
    const GOLD_TITLE = flag(params.goldTitle, true);

    // ------------------------------------------------------------------
    // One font everywhere: bitmaps drawn by plugins (HUD, popups, labels) used to fall back to the
    // browser's default sans-serif, which did not match the windows.
    // ------------------------------------------------------------------
    const _Bitmap_initialize = Bitmap.prototype.initialize;
    Bitmap.prototype.initialize = function(width, height) {
        _Bitmap_initialize.call(this, width, height);
        if ($gameSystem && $dataSystem) this.fontFace = $gameSystem.mainFontFace();
    };

    // ------------------------------------------------------------------
    // Main menu: only what a survival game needs
    // ------------------------------------------------------------------
    if (HIDE_RPG) {
        const RPG_COMMANDS = ["skill", "equip", "status", "formation"];
        const _needsCommand = Window_MenuCommand.prototype.needsCommand;
        Window_MenuCommand.prototype.needsCommand = function(name) {
            if (RPG_COMMANDS.includes(name)) return false;
            return _needsCommand.call(this, name);
        };
        Window_MenuCommand.prototype.numVisibleRows = function() {
            return 1;
        };
        Scene_Menu.prototype.commandWindowHeight = function() {
            return this.calcWindowHeight(1, true);
        };
    }

    // ------------------------------------------------------------------
    // The name of the map fades in beside the clock instead of on top of it
    // ------------------------------------------------------------------
    const _mapNameWindowRect = Scene_Map.prototype.mapNameWindowRect;
    Scene_Map.prototype.mapNameWindowRect = function() {
        const rect = _mapNameWindowRect.call(this);
        rect.x = 132;
        return rect;
    };

    // ------------------------------------------------------------------
    // The character card in the menu
    // ------------------------------------------------------------------
    const SEASONS = ["Wiosna", "Lato", "Jesień", "Zima"];
    const hoursText = h => {
        const total = Math.max(1, Math.ceil(h));
        return total + " godz.";
    };

    function clockText() {
        const h = $gameSystem.dayNightHour();
        const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
        return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    }

    function weatherText() {
        const outdoors = /<(Clouds|Weather):\s*on\s*>/i.test(($dataMap && $dataMap.note) || "");
        if (!outdoors) return "pod dachem";
        const type = $gameScreen.weatherType(), active = ($gameScreen._weatherPowerTarget || 0) > 0;
        if (active && type === "rain") return "deszcz";
        if (active && type === "snow") return "śnieg";
        return "bezdeszczowo";
    }

    function drawKeyIcons(win, x, y, width) {
        const icons = $gameParty.items().filter(i => i.itypeId === 2).map(i => i.iconIndex);
        const step = ImageManager.iconWidth + 4;
        const perRow = Math.max(1, Math.floor(width / step));
        const rowH = ImageManager.iconHeight + 8;
        icons.slice(0, perRow * 2).forEach((icon, i) => {
            const sx = x + (i % perRow) * step, sy = y + Math.floor(i / perRow) * rowH;
            win.contents.fillRect(sx - 2, sy - 2, ImageManager.iconWidth + 4, ImageManager.iconHeight + 4, ColorManager.textColor(26));
            win.contents.fillRect(sx - 1, sy - 1, ImageManager.iconWidth + 2, ImageManager.iconHeight + 2, "rgba(58,42,28,1)");
            win.drawIcon(icon, sx, sy);
        });
        return Math.ceil(Math.min(icons.length, perRow * 2) / perRow) * rowH;
    }

    // A plain gauge (the engine's own gauges belong to sprites, not to windows)
    function drawBar(win, x, y, width, rate, color1, color2) {
        const h = 16, gy = y + Math.floor((win.lineHeight() - h) / 2) + 2;
        win.contents.fillRect(x, gy, width, h, ColorManager.gaugeBackColor());
        win.contents.fillRect(x, gy, width, 1, ColorManager.textColor(26));
        win.contents.gradientFillRect(x + 1, gy + 1, Math.max(0, Math.floor((width - 2) * Math.max(0, Math.min(1, rate)))), h - 2, color1, color2);
    }

    function drawSurvivalCard(win, index) {
        const actor = win.actor(index);
        const rect = win.itemRectWithPadding(index);
        const lh = win.lineHeight();
        const portraitW = Math.min(300, Math.floor(rect.width * 0.26));
        win.drawActorPicture(actor, rect.x, rect.y, portraitW, rect.height, true, true);
        const x = rect.x + portraitW + 36;
        const w = rect.width - portraitW - 36 - 12;
        let y = rect.y + 2;

        win.contents.fontSize = 36;
        win.changeTextColor(ColorManager.textColor(16));
        win.drawText(actor.name(), x, y, w);
        win.resetFontSettings();
        y += 46;
        win.contents.fillRect(x, y, w, 2, ColorManager.textColor(26));
        y += 12;

        if (index > 0) return;   // the survival figures belong to the whole party: only drawn once

        // day, season, time
        const day = $gameSystem.dayNightDay();
        const season = window.Farming && Farming.seasonIndex ? SEASONS[Farming.seasonIndex(day)] : "";
        win.changeTextColor(ColorManager.systemColor());
        win.drawText("Dzień", x, y, 120);
        win.resetTextColor();
        win.drawText(day + (season ? "  ·  " + season : "") + "  ·  " + clockText(), x + 130, y, w - 130);
        y += lh + 6;

        // stamina
        const ratio = typeof $gameSystem.staminaRatio === "function" ? $gameSystem.staminaRatio() : 1;
        const cur = Math.round($gameSystem.stamina ? $gameSystem.stamina() : 100), max = Math.round($gameSystem.maxStamina ? $gameSystem.maxStamina() : 100);
        win.changeTextColor(ColorManager.systemColor());
        win.drawText("Wytrzymałość", x, y, 200);
        win.resetTextColor();
        const gx = x + 210, gw = Math.min(300, w - 210 - 120);
        drawBar(win, gx, y, gw, ratio, ratio > 0.25 ? ColorManager.textColor(20) : ColorManager.textColor(17), ratio > 0.25 ? ColorManager.textColor(21) : ColorManager.textColor(18));
        win.drawText(cur + " / " + max, gx + gw + 14, y, 110);
        y += lh + 6;

        // hunger and thirst (Needs.js)
        if (window.Needs && Needs.enabled()) {
            const st = Needs.state();
            for (const [label, value, text, c1, c2] of [["Sytość", st.food, Needs.foodText(), "#e0b24a", "#c98a2c"], ["Nawodnienie", st.water, Needs.waterText(), "#62b6ee", "#4a94d6"]]) {
                win.changeTextColor(ColorManager.systemColor());
                win.drawText(label, x, y, 200);
                win.resetTextColor();
                drawBar(win, gx, y, gw, value / 100, c1, c2);
                if (text) win.changeTextColor(ColorManager.textColor(17));
                win.drawText(text || Math.round(value) + " / 100", gx + gw + 14, y, 200);
                win.resetTextColor();
                y += lh + 6;
            }
        }

        // place and weather
        win.changeTextColor(ColorManager.systemColor());
        win.drawText("Miejsce", x, y, 120);
        win.resetTextColor();
        win.drawText($gameMap.displayName() || ($dataMapInfos[$gameMap.mapId()] || {}).name || "", x + 130, y, w - 130);
        y += lh + 6;
        win.changeTextColor(ColorManager.systemColor());
        win.drawText("Pogoda", x, y, 120);
        win.resetTextColor();
        win.drawText(weatherText(), x + 130, y, w - 130);
        y += lh + 14;

        // effects
        win.changeTextColor(ColorManager.systemColor());
        win.drawText("Samopoczucie", x, y, 220);
        win.resetTextColor();
        const buffs = typeof $gameSystem.activeBuffs === "function" && window.Survival ? $gameSystem.activeBuffs() : [];
        const cold = typeof $gameSystem.isCold === "function" && $gameSystem.isCold();
        let by = y;
        if (buffs.length === 0 && !cold) {
            win.changeTextColor(ColorManager.textColor(7));
            win.drawText("w normie", x + 230, by, w - 230);
            win.resetTextColor();
            by += lh;
        }
        for (const b of buffs) {
            const def = Survival.BUFFS[b.name];
            win.drawIcon(def.icon, x + 230, by + 2);
            win.drawText(def.name + "  ·  jeszcze " + hoursText(b.left), x + 230 + 40, by, w - 230 - 40);
            by += lh;
        }
        if (cold) {
            win.changeTextColor(ColorManager.textColor(4));
            win.drawText("Zimno! Wytrzymałość kosztuje więcej", x + 230, by, w - 230);
            win.resetTextColor();
            by += lh;
        }
        y = by + 14;

        // tools and gear
        win.contents.fillRect(x, y, w, 2, ColorManager.textColor(26));
        y += 12;
        win.changeTextColor(ColorManager.systemColor());
        win.drawText("Narzędzia i wyposażenie", x, y, w);
        win.resetTextColor();
        y += lh + 2;
        drawKeyIcons(win, x, y, w);
    }

    if (STATUS_CARD) {
        const _drawItem = Window_MenuStatus.prototype.drawItem;
        Window_MenuStatus.prototype.drawItem = function(index) {
            if (this instanceof Window_MenuActor) return _drawItem.call(this, index);
            this.drawPendingItemBackground(index);
            drawSurvivalCard(this, index);
        };
        const _maxCols = Window_MenuStatus.prototype.maxCols;
        Window_MenuStatus.prototype.maxCols = function() {
            return this instanceof Window_MenuActor ? _maxCols.call(this) : 1;
        };
    }

    // ------------------------------------------------------------------
    // Item lists
    // ------------------------------------------------------------------
    if (COUNT_TIMES) {
        Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
            if (this.needsNumber()) {
                this.drawText("×" + $gameParty.numItems(item), x, y, width, "right");
            }
        };
    }

    if (HIDE_EMPTY) {
        const _needsCommand = Window_ItemCategory.prototype.needsCommand;
        Window_ItemCategory.prototype.needsCommand = function(name) {
            if (name === "weapon" && $gameParty.weapons().length === 0) return false;
            if (name === "armor" && $gameParty.armors().length === 0) return false;
            return _needsCommand.call(this, name);
        };
        // the tabs share the whole width, however many there are
        Window_ItemCategory.prototype.maxCols = function() {
            return this._list && this._list.length > 0 ? this._list.length : 4;
        };
    }

    // ------------------------------------------------------------------
    // The title screen: gold letters with a dark outline instead of plain white
    // ------------------------------------------------------------------
    if (GOLD_TITLE) {
        Scene_Title.prototype.drawGameTitle = function() {
            const x = 20;
            const y = Graphics.height / 4 - 24;
            const maxWidth = Graphics.width - x * 2;
            const bitmap = this._gameTitleSprite.bitmap;
            bitmap.fontFace = $gameSystem.mainFontFace();
            bitmap.fontSize = 92;
            bitmap.fontBold = true;
            bitmap.outlineColor = "rgba(14,8,4,0.95)";
            bitmap.outlineWidth = 12;
            bitmap.textColor = "#f2d68c";
            bitmap.drawText($dataSystem.gameTitle, x, y, maxWidth, 96, "center");
        };
    }
})();
