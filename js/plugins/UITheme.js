//=============================================================================
// UITheme.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Jeden wygląd interfejsu: paleta (czarne panele, jasnożółty akcent, jasny tekst, szare linie), czcionka, wspólne panele, paski i symbole, porządek w menu, listach i ekranie tytułowym. v3.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @param fontFile
 * @text Czcionka (plik w fonts/)
 * @desc Główna czcionka gry, ustawiana przy starcie (zamiast tej z Bazy danych > System 2). Puste = ta z Bazy danych.
 * @default AlegreyaSans-Medium.ttf
 *
 * @param fontSize
 * @text Rozmiar czcionki
 * @desc Rozmiar tekstu w oknach. 0 = ten z Bazy danych.
 * @type number
 * @min 0
 * @default 22
 *
 * @param hideRpgCommands
 * @text Ukryj komendy z klasycznego RPG
 * @desc W menu głównym zostają: Przedmioty, Opcje, Zapisz, Zakończ grę. Znikają: Zdolność, Wyposażenie, Status, Formacja.
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
 * @param titleImage
 * @text Obraz ekranu tytułowego
 * @desc Plik z img/titles1 (tawerna na ruinach zamku nocą), ożywiony: gwiazdy, dym z komina, światło w oknach, iskry z ogniska, świetliki. Puste = obraz z bazy danych, bez animacji.
 * @type file
 * @dir img/titles1
 * @default Tawerna_Title
 *
 * @param saveDayLine
 * @text Dzień i chatka w zapisie
 * @desc Zapis pamięta dzień, porę roku i to, czy chatka jest już zbudowana (pokazują je ekrany plików - MenuRing.js).
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * UITheme.js - jeden wygląd interfejsu
 * ============================================================================
 * Gra ma JEDEN wygląd (2026-10-28, docs/UI_JEDEN_WYGLAD.md): czarne panele,
 * jasnożółty akcent #ffd23f, jasny tekst, szare linie - jak menu P
 * (MenuRing.js) - w zaokrąglonych panelach z jedną cienką linią. Dawnego
 * wyglądu „Grafit i miedź” i wiersza „Wygląd” w Opcjach już nie ma.
 *
 *  - Paleta: window.UIStyle.C - jedyne miejsce z kolorami interfejsu. Czytają
 *    ją HUD (CleanHUD.js, CleanHUD_Compass.js), menu P (MenuRing.js),
 *    mini-gry (TawernaUI.js), dziennik, oznaczenia walki, prolog. Zmiana
 *    koloru = zmiana tutaj.
 *  - Wspólne rysowanie: UIStyle.panel(), bar(), glyph(), chip(), hudRow(),
 *    roundPath().
 *  - Okna (wiadomości, wybory, listy): img/system/Window.png w tych samych
 *    barwach (tools/ui_jeden_wyglad/make_skin.py), przyciski
 *    img/system/ButtonSet.png.
 *  - Czcionka: Alegreya Sans (fonts/AlegreyaSans-Medium.ttf, licencja SIL OFL
 *    w AlegreyaSans-OFL.txt) w rozmiarze 22 - parametry wyżej. Ustawiana przy
 *    starcie gry, więc edytor zapisujący System.json jej nie cofnie. Wszystkie
 *    nowe obrazki z tekstem używają tej samej czcionki co okna.
 *  - Menu główne bez komend z klasycznego RPG.
 *  - Lista przedmiotów: "×7" zamiast ": 7", puste zakładki Broń / Zbroja
 *    ukryte, zakładki równo rozłożone na całą szerokość.
 *  - Ekran tytułowy: jasnożółty napis z czarnym obrysem (gdy TitleScreen.js
 *    jest wyłączony).
 *
 * Ustawienia okien są w wtyczce OptionEx: suwaki koloru okna są wyłączone
 * (przy stałej skórce psułyby wygląd), przezroczystość zostaje do wyboru.
 * Kolory tekstu \C[n] są w tabeli barw na dole pliku Window.png (8 x 4 pól po
 * 12 px), jak w każdym standardowym pliku okna RPG Makera.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("UITheme.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const pluginName = "UITheme";
    const params = PluginManager.parameters(pluginName);
    const flag = (v, d) => (v === undefined || v === "" ? d : v === "true");
    const HIDE_RPG = flag(params.hideRpgCommands, true);
    const HIDE_EMPTY = flag(params.hideEmptyCategories, true);
    const COUNT_TIMES = flag(params.countAsTimes, true);
    const GOLD_TITLE = flag(params.goldTitle, true);
    const SAVE_DAY_LINE = flag(params.saveDayLine, true);
    const FONT_FILE = params.fontFile === undefined ? "AlegreyaSans-Medium.ttf" : params.fontFile;
    const FONT_SIZE = params.fontSize === undefined || params.fontSize === "" ? 22 : Number(params.fontSize) || 0;

    // ------------------------------------------------------------------
    // The font, set at start-up (so the editor saving System.json cannot undo it)
    // ------------------------------------------------------------------
    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function() {
        const advanced = $dataSystem.advanced;
        if (FONT_FILE) advanced.mainFontFilename = advanced.numberFontFilename = FONT_FILE;
        if (FONT_SIZE > 0) advanced.fontSize = FONT_SIZE;
        _Scene_Boot_loadGameFonts.call(this);
    };

    // ------------------------------------------------------------------
    // The palette: ONE look for the whole interface (2026-10-28, docs/UI_JEDEN_WYGLAD.md) - black panels, the bright yellow accent
    // #ffd23f, light text, grey lines: the colours the user took for the P menu (MenuRing.js, 2026-10-23: "a można kolory z klasycznego
    // wziąć?") in the rounded one-line shapes he sees since 2026-10-08. The copper "Grafit i miedź" and the option "Wygląd" are gone.
    // UIStyle.C is the only place with the interface's colours: the HUD (CleanHUD.C is this object), the P menu (MenuRing's K reads it),
    // the mini-games (TawernaUI), the journal, the fight's marks, the prologue; the windows' skin img/system/Window.png has the same
    // ones (tools/ui_jeden_wyglad/make_skin.py). Change a colour here.
    // ------------------------------------------------------------------
    const C = Object.freeze({
        // the text: light, a little softer, quiet, dim (what cannot be chosen)
        text: "#eceef0", soft: "#d4d6da", muted: "#8a9099", dim: "#62676f",
        // the accent; darker (a bar's end, a rule), very dark (a chosen row's fill), dark muted (a dimmed choice); the ink on it
        accent: "#ffd23f", accentDim: "#c9a12a", accentDark: "#5c4c18", accentMuted: "#58460c", onAccent: "#100e06",
        // panels: a window's (fill, solid), the menu's big one (panel), the HUD's see-through one (glass), a strip, the inner ones
        fill: "rgba(11,12,15,0.9)", solid: "#0b0c0f", panel: "rgba(11,12,15,0.93)", glass: "rgba(11,12,15,0.84)", strip: "rgba(6,6,8,0.92)",
        panel2: "#141519", cell: "#1e2025", empty: "#111216", track: "#26282e", trough: "#16181c",
        // the thin line; the text's outline where it stands on the map alone
        line: "#3a3e46", outline: "rgba(0,0,0,0.82)",
        // meanings: done / fresh, coins, a warning, heavy, the sun in the clock
        good: "#96cd82", gold: "#ffd660", warn: "#ff9f8f", amber: "#e8b64a", sun: "#f2c25a",
        // the needs' bars (the HUD, the P menu's Postać, the bag's "Po zjedzeniu"); the breath in the combat mode
        health: "#d8605a", stamina: "#94bf6e", food: "#dda650", water: "#62a6dc", breath: "#8fe3ff"
    });
    const UIStyle = Object.assign({ C }, C);
    // a palette colour (#rrggbb) with an alpha: UIStyle.rgba(C.cell, 0.94)
    UIStyle.rgba = function(hex, alpha) {
        const n = parseInt(String(hex).slice(1, 7), 16);
        return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + alpha + ")";
    };
    // a rounded rectangle's path (every panel, tile and track of the interface)
    UIStyle.roundPath = function(ctx, x, y, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };
    // a panel: rounded (the cut x 2, 4..12 px), the see-through fill, one thin line. opts: { cut (4), fill, line }
    UIStyle.panel = function(ctx, x, y, w, h, opts) {
        const o = opts || {}, c = o.cut === undefined ? 4 : o.cut, r = Math.max(4, Math.min(12, c * 2));
        ctx.save();
        UIStyle.roundPath(ctx, x, y, w, h, r);
        ctx.fillStyle = o.fill || C.fill;
        ctx.fill();
        UIStyle.roundPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
        ctx.strokeStyle = o.line || C.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    };
    // a bar: a rounded dark track, filled `ratio` (0..1) with a flat colour
    UIStyle.bar = function(ctx, x, y, w, h, ratio, colour) {
        const r = Math.min(h / 2, 3), fw = Math.round(w * Math.max(0, Math.min(1, ratio)));
        ctx.save();
        ctx.fillStyle = C.track;
        UIStyle.roundPath(ctx, x, y, w, h, r);
        ctx.fill();
        if (fw > 0 && colour) {
            ctx.fillStyle = colour;
            UIStyle.roundPath(ctx, x, y, Math.max(fw, Math.min(w, h)), h, r);
            ctx.fill();
        }
        ctx.restore();
    };
    // The HUD's symbols, one set in one style: flat shapes on a 20 x 20 grid, filled with `fill` (the yellow accent unless
    // told otherwise) inside a dark outline so they read on any ground. kind: stamina (a bolt), food (a drumstick), water (a
    // drop), weight (a kettlebell), sated (a fork and a knife), warm (a flame), cold (a snowflake), wound (three scratches), health (a heart).
    UIStyle.glyph = function(ctx, kind, x, y, size, fill, bare) {
        const col = fill || C.accent, dark = bare ? "rgba(0,0,0,0)" : "rgba(8,9,11,0.92)";   // bare: no outline (on a chip)
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 20, size / 20);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const solid = p => {   // an outlined, filled shape
            ctx.lineWidth = 3;
            ctx.strokeStyle = dark;
            ctx.stroke(p);
            ctx.fillStyle = col;
            ctx.fill(p);
        };
        const line = (p, w) => {   // an outlined stroke
            ctx.strokeStyle = dark;
            ctx.lineWidth = w + 3;
            ctx.stroke(p);
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            ctx.stroke(p);
        };
        const p = new Path2D();
        if (kind === "stamina") {
            p.moveTo(11.5, 1.5); p.lineTo(4, 11.5); p.lineTo(9.3, 11.5); p.lineTo(7.5, 18.5); p.lineTo(16, 8); p.lineTo(10.7, 8); p.lineTo(12.8, 1.5); p.closePath();
            solid(p);
        } else if (kind === "water") {
            p.moveTo(10, 1.8); p.bezierCurveTo(8, 5.5, 4, 9, 4, 12.6); p.arc(10, 12.6, 6, Math.PI, 0, true); p.bezierCurveTo(16, 9, 12, 5.5, 10, 1.8); p.closePath();
            solid(p);
            const shine = new Path2D();
            shine.arc(8, 13, 2.6, Math.PI * 0.6, Math.PI * 1.1);
            ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1.3; ctx.stroke(shine);
        } else if (kind === "food") {
            const bone = new Path2D();
            bone.moveTo(11.5, 11.5); bone.lineTo(16, 16);
            line(bone, 2.6);
            const knobs = new Path2D();
            knobs.arc(17.4, 15, 1.7, 0, Math.PI * 2); knobs.moveTo(16.7, 17.4); knobs.arc(15, 17.4, 1.7, 0, Math.PI * 2);
            solid(knobs);
            p.ellipse(8.2, 8.2, 6.6, 5.2, -Math.PI / 4, 0, Math.PI * 2);
            solid(p);
        } else if (kind === "weight") {
            const handle = new Path2D();
            handle.arc(10, 7.6, 4.2, Math.PI * 1.05, Math.PI * 1.95);
            line(handle, 2.4);
            p.moveTo(3.8, 13); p.arc(10, 12.6, 6.3, Math.PI * 1.05, Math.PI * 1.95); p.lineTo(16, 17.6); p.lineTo(4, 17.6); p.closePath();
            solid(p);
        } else if (kind === "sated") {
            const fork = new Path2D();
            fork.moveTo(6, 2.5); fork.lineTo(6, 7.5); fork.moveTo(8.5, 2.5); fork.lineTo(8.5, 7.5); fork.moveTo(3.5, 2.5); fork.lineTo(3.5, 7.5);
            fork.moveTo(3.5, 7.5); fork.quadraticCurveTo(6, 10.5, 8.5, 7.5); fork.moveTo(6, 9.5); fork.lineTo(6, 18);
            line(fork, 1.8);
            p.moveTo(14, 2); p.quadraticCurveTo(17.8, 6, 16.4, 10.5); p.lineTo(15.2, 10.5); p.lineTo(15.2, 18); p.lineTo(13.4, 18); p.lineTo(13.4, 2.4); p.closePath();
            solid(p);
        } else if (kind === "warm") {
            p.moveTo(10, 1.8); p.bezierCurveTo(12.5, 6, 16.5, 8, 15.6, 13); p.bezierCurveTo(15, 16.5, 12.5, 18.4, 10, 18.4); p.bezierCurveTo(7.5, 18.4, 4.6, 16.5, 4.4, 13);
            p.bezierCurveTo(4.2, 10, 6.5, 8.5, 7.2, 6.2); p.bezierCurveTo(8.2, 8, 8, 9.5, 8.8, 10); p.bezierCurveTo(9.8, 7.5, 10.8, 5.2, 10, 1.8); p.closePath();
            solid(p);
            const core = new Path2D();
            core.moveTo(10, 10.5); core.bezierCurveTo(11.8, 12.6, 12.8, 14, 12.2, 15.6); core.bezierCurveTo(11.6, 17, 8.4, 17, 7.8, 15.6); core.bezierCurveTo(7.3, 14, 8.6, 12.4, 10, 10.5); core.closePath();
            ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fill(core);
        } else if (kind === "health") {   // a heart
            p.moveTo(10, 17.5);
            p.bezierCurveTo(4.5, 13.5, 2, 10.5, 2, 7.2);
            p.bezierCurveTo(2, 4.2, 4.3, 2.3, 6.6, 2.3);
            p.bezierCurveTo(8.2, 2.3, 9.4, 3.2, 10, 4.6);
            p.bezierCurveTo(10.6, 3.2, 11.8, 2.3, 13.4, 2.3);
            p.bezierCurveTo(15.7, 2.3, 18, 4.2, 18, 7.2);
            p.bezierCurveTo(18, 10.5, 15.5, 13.5, 10, 17.5);
            p.closePath();
            solid(p);
            const shine = new Path2D();
            shine.arc(6.4, 6.6, 2.1, Math.PI * 1.05, Math.PI * 1.6);
            ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.2; ctx.stroke(shine);
        } else if (kind === "wound") {   // three torn scratches
            for (const [x0, y0, x1, y1] of [[4, 5, 9, 16], [8.5, 3, 13.5, 15], [13, 4.5, 17, 13]]) { p.moveTo(x0, y0); p.lineTo(x1, y1); }
            line(p, 2.4);
        } else if (kind === "cold") {
            for (let i = 0; i < 3; i++) {
                const a = i * Math.PI / 3, cx = Math.cos(a) * 8, cy = Math.sin(a) * 8;
                p.moveTo(10 - cx, 10 - cy); p.lineTo(10 + cx, 10 + cy);
                for (const s of [1, -1]) {   // the small branches near both ends
                    const ex = 10 + s * cx * 0.62, ey = 10 + s * cy * 0.62, b = 2.6;
                    p.moveTo(ex, ey); p.lineTo(ex + s * (Math.cos(a + 0.8) * b), ey + s * (Math.sin(a + 0.8) * b));
                    p.moveTo(ex, ey); p.lineTo(ex + s * (Math.cos(a - 0.8) * b), ey + s * (Math.sin(a - 0.8) * b));
                }
            }
            line(p, 1.8);
        }
        ctx.restore();
    };
    // One row of the HUD under the clock (stamina - SurvivalHUD.js, hunger and thirst - Needs.js): the symbol, then a flat
    // bar without numbers. The load and the premia (Survival.js) use the same row with text instead of the bar.
    UIStyle.HUD = { row: 20, step: 23, gap: 6, barW: 112, barH: 8 };
    // the symbol on a small dark plate with a thin line, so it reads on grass, snow or trees alike
    UIStyle.chip = function(ctx, kind, x, y, size, fill) {
        UIStyle.panel(ctx, x, y, size, size, { cut: 3, fill: "rgba(11,12,15,0.86)" });
        const inset = Math.round(size * 0.12);
        UIStyle.glyph(ctx, kind, x + inset, y + inset, size - inset * 2, fill, true);
    };
    UIStyle.hudRow = function(ctx, kind, x, y, ratio, colour) {
        const H = UIStyle.HUD;
        UIStyle.chip(ctx, kind, x, y, H.row);
        UIStyle.bar(ctx, x + H.row + H.gap, y + Math.round((H.row - H.barH) / 2), H.barW, H.barH, ratio, colour);
    };
    window.UIStyle = UIStyle;

    // the lists have no band behind each row: only the cursor marks the chosen one
    Window_Selectable.prototype.drawItemBackground = function() {};

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
        rect.x = 164;   // right of the HUD column (12 + 142 px wide: the time-of-day plate, the clock, the rows)
        return rect;
    };

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

    if (SAVE_DAY_LINE) {
        // stashed into the save's own info at save time, so a slot always shows its own game's day (not the one now running)
        const _makeSavefileInfo = DataManager.makeSavefileInfo;
        DataManager.makeSavefileInfo = function() {
            const info = _makeSavefileInfo.call(this);
            if ($gameSystem && typeof $gameSystem.dayNightDay === "function") {
                info.day = $gameSystem.dayNightDay();
                info.season = window.Farming && Farming.seasonOf ? Farming.seasonOf(info.day) : "";
                info.hutBuilt = !!(window.Farming && Farming.hutOf && Farming.hutOf());
            }
            return info;
        };
        // (the file screens - MenuRing.js - write it: "Dzień 40 · lato" on the row, Chatka on the card)
    }

    // ------------------------------------------------------------------
    // The title screen: its own picture (img/titles1/Tawerna_Title: the tavern on the castle ruins at night, pixel art at 2x)
    // brought to life - the stars twinkle, smoke rises from the chimney, the windows' light flickers, the campfire throws sparks,
    // fireflies drift over the grass. The commands sit in one row at the bottom so the tavern and the fire stay in view.
    // ------------------------------------------------------------------
    const TITLE_IMAGE = params.titleImage === undefined ? "Tawerna_Title" : params.titleImage;
    // (spots on the 1280 x 720 picture)
    const TITLE_SPOTS = {
        chimney: [789, 280], fire: [737, 540],
        windows: [[692, 407, 18, 20], [766, 412, 12, 16], [828, 414, 14, 19], [761, 474, 12, 19]],
        stars: [[539,21],[751,21],[311,23],[783,23],[591,29],[225,35],[635,41],[803,41],[405,43],[1153,43],[153,49],[431,51],[1191,51],[729,57],[1237,57],[885,71],[195,75],[1233,79],[301,81],[439,83],[809,87],[835,97],[883,115],[259,117],[417,121],[175,127],[357,137],[407,167],[219,169],[757,177],[375,181],[483,181],[527,183],[165,195],[1145,195],[339,203],[573,203],[427,207],[497,209],[609,209],[725,209],[265,215],[533,215],[943,215],[1115,223],[201,227],[741,227],[319,233],[655,235],[969,241],[1087,243],[593,247]],
        grass: [380, 560, 1000, 700]   // where the fireflies drift (x1, y1, x2, y2)
    };
    // small bitmaps drawn once: a soft round light, a pixel square, a smoke puff
    const titleBitmaps = {};
    function titleBitmap(kind) {
        if (titleBitmaps[kind]) return titleBitmaps[kind];
        let bmp;
        if (kind === "glow") {
            bmp = new Bitmap(64, 64);
            const ctx = bmp.context, g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, "rgba(255,200,110,0.9)"); g.addColorStop(0.4, "rgba(255,150,60,0.35)"); g.addColorStop(1, "rgba(255,120,40,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
        } else if (kind === "star") {   // a little cross of light, 2 px pixels
            bmp = new Bitmap(6, 6);
            bmp.fillRect(2, 0, 2, 6, "rgba(255,255,240,0.55)");
            bmp.fillRect(0, 2, 6, 2, "rgba(255,255,240,0.55)");
            bmp.fillRect(2, 2, 2, 2, "#ffffff");
        } else if (kind === "spark") {
            bmp = new Bitmap(2, 2);
            bmp.fillRect(0, 0, 2, 2, "#ffd27a");
        } else if (kind === "fly") {
            bmp = new Bitmap(12, 12);
            const ctx = bmp.context, g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
            g.addColorStop(0, "rgba(230,255,140,0.7)"); g.addColorStop(1, "rgba(200,255,120,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, 12, 12);
            bmp.fillRect(5, 5, 2, 2, "#f4ffb0");
        } else if (kind === "puff") {   // a blocky grey smoke puff, 2 px pixels, like the picture's own smoke
            bmp = new Bitmap(20, 16);
            const rows = ["...xxxx...", "..xxxxxx..", ".xxxxxxxx.", "xxxxxxxxxx", "xxxxxxxxxx", ".xxxxxxxx.", "..xxxxxx..", "...xxxx..."];
            rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === "x") bmp.fillRect(x * 2, y * 2, 2, 2, y < 3 ? "#9a9488" : "#7e786e"); });
        }
        bmp._baseTexture.update();
        return (titleBitmaps[kind] = bmp);
    }
    function Sprite_TitleFx() {
        this.initialize(...arguments);
    }
    Sprite_TitleFx.prototype = Object.create(Sprite.prototype);
    Sprite_TitleFx.prototype.constructor = Sprite_TitleFx;
    Sprite_TitleFx.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._t = 0;
        this._parts = [];
        const add = (kind, x, y, blend) => {
            const s = new Sprite(titleBitmap(kind));
            s.anchor.set(0.5, 0.5);
            s.x = x; s.y = y;
            if (blend) s.blendMode = PIXI.BLEND_MODES.ADD;
            this.addChild(s);
            return s;
        };
        this._stars = TITLE_SPOTS.stars.map(([x, y]) => Object.assign(add("star", x, y, true), { _phase: Math.random() * 6.3, _speed: 0.02 + Math.random() * 0.05 }));
        this._windows = TITLE_SPOTS.windows.map(([x, y, w, h]) => Object.assign(add("glow", x, y, true), { _w: w, _h: h, _phase: Math.random() * 6.3 }));
        for (const w of this._windows) { w.scale.x = w._w / 20; w.scale.y = w._h / 20; }
        this._fireGlow = add("glow", TITLE_SPOTS.fire[0], TITLE_SPOTS.fire[1] - 4, true);
        const [gx1, gy1, gx2, gy2] = TITLE_SPOTS.grass;
        this._flies = [];
        for (let i = 0; i < 9; i++) {
            const f = add("fly", gx1 + Math.random() * (gx2 - gx1), gy1 + Math.random() * (gy2 - gy1), true);
            Object.assign(f, { _vx: 0, _vy: 0, _phase: Math.random() * 6.3 });
            this._flies.push(f);
        }
    };
    // a particle that rises and fades: smoke from the chimney, sparks from the fire
    Sprite_TitleFx.prototype.spawnPart = function(kind, x, y, vx, vy, life, blend) {
        const s = new Sprite(titleBitmap(kind));
        s.anchor.set(0.5, 0.5);
        s.x = x; s.y = y;
        if (blend) s.blendMode = PIXI.BLEND_MODES.ADD;
        Object.assign(s, { _vx: vx, _vy: vy, _age: 0, _life: life, _kind: kind });
        this.addChildAt(s, 0);
        this._parts.push(s);
    };
    Sprite_TitleFx.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const t = ++this._t;
        for (const s of this._stars) {
            const k = 0.5 + 0.5 * Math.sin(t * s._speed + s._phase);
            s.opacity = Math.round(255 * k * k);
        }
        for (const w of this._windows) w.opacity = Math.round(150 + 60 * Math.sin(t * 0.07 + w._phase) + 30 * Math.sin(t * 0.23 + w._phase * 2));
        const flicker = 0.85 + 0.1 * Math.sin(t * 0.21) + 0.06 * Math.sin(t * 0.53);
        this._fireGlow.scale.set(2.4 * flicker, 1.9 * flicker);
        this._fireGlow.opacity = Math.round(200 * flicker);
        if (t % 26 === 0) this.spawnPart("puff", TITLE_SPOTS.chimney[0] + (Math.random() - 0.5) * 6, TITLE_SPOTS.chimney[1], 0.18 + Math.random() * 0.1, -0.32 - Math.random() * 0.1, 230);
        if (t % 5 === 0) this.spawnPart("spark", TITLE_SPOTS.fire[0] + (Math.random() - 0.5) * 14, TITLE_SPOTS.fire[1] - 6, (Math.random() - 0.5) * 0.5, -0.7 - Math.random() * 0.6, 45 + Math.floor(Math.random() * 45), true);
        const [gx1, gy1, gx2, gy2] = TITLE_SPOTS.grass;
        for (const f of this._flies) {   // slow wandering, pulsing light, kept over the grass
            f._vx = Math.max(-0.35, Math.min(0.35, f._vx + (Math.random() - 0.5) * 0.05));
            f._vy = Math.max(-0.25, Math.min(0.25, f._vy + (Math.random() - 0.5) * 0.04));
            f.x += f._vx; f.y += f._vy;
            if (f.x < gx1 || f.x > gx2) f._vx = -f._vx;
            if (f.y < gy1 || f.y > gy2) f._vy = -f._vy;
            f.opacity = Math.round(255 * Math.max(0, Math.sin(t * 0.04 + f._phase)));
        }
        for (const s of this._parts) {
            s._age++;
            const k = s._age / s._life;
            s.x += s._vx + (s._kind === "puff" ? Math.sin((s._age + s._life) * 0.03) * 0.15 : 0);
            s.y += s._vy;
            if (s._kind === "puff") { s.scale.set(0.6 + k * 1.3); s.opacity = Math.round(150 * (k < 0.1 ? k / 0.1 : 1 - k)); }
            else { s._vy *= 0.99; s.opacity = Math.round(255 * (1 - k)); }
        }
        for (const s of this._parts.filter(p => p._age >= p._life)) this.removeChild(s);
        this._parts = this._parts.filter(p => p._age < p._life);
    };
    if (TITLE_IMAGE) {
        const _Scene_Title_createBackground = Scene_Title.prototype.createBackground;
        Scene_Title.prototype.createBackground = function() {
            _Scene_Title_createBackground.call(this);
            this._backSprite1.bitmap = ImageManager.loadTitle1(TITLE_IMAGE);
            this._backSprite2.bitmap = new Bitmap(1, 1);
            this._titleFx = new Sprite_TitleFx();
            this.addChild(this._titleFx);
        };
        // the commands in one row at the bottom, clear of the tavern and the fire
        Scene_Title.prototype.commandWindowRect = function() {
            const ww = Math.min(640, Graphics.boxWidth - 80), wh = this.calcWindowHeight(1, true);
            return new Rectangle((Graphics.boxWidth - ww) / 2, Graphics.boxHeight - wh - 24, ww, wh);
        };
        Window_TitleCommand.prototype.maxCols = function() {
            return 3;
        };
        Window_TitleCommand.prototype.itemTextAlign = function() {
            return "center";
        };
    }

    // ------------------------------------------------------------------
    // The title screen: bright yellow letters with a black outline instead of plain white
    // ------------------------------------------------------------------
    if (GOLD_TITLE) {
        Scene_Title.prototype.drawGameTitle = function() {
            const x = 20;
            const y = TITLE_IMAGE ? 52 : Graphics.height / 4 - 24;   // (over the picture: high in the empty sky)
            const maxWidth = Graphics.width - x * 2;
            const bitmap = this._gameTitleSprite.bitmap;
            bitmap.fontFace = $gameSystem.mainFontFace();
            bitmap.fontSize = 92;
            bitmap.fontBold = true;
            bitmap.outlineColor = "rgba(0,0,0,0.95)";
            bitmap.outlineWidth = 12;
            bitmap.textColor = UIStyle.accent;
            bitmap.drawText($dataSystem.gameTitle, x, y, maxWidth, 96, "center");
        };
    }
})();
