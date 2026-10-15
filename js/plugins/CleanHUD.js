//=============================================================================
// CleanHUD.js
//=============================================================================
// "Czysty widok" (the user's choice, 2026-10-08: docs/ui_pomysly/POMYSLY.md, idea 4; mock-ups docs/ui_pomysly/pomysl_4_czysty_hud.png
// and pomysl_4_czysty_okno.png, made by tools/ui_pomysly/pomysl4_czysty.py): the map's HUD without panels - outlined text, thin
// bars, a soft shade at the top and bottom edges of the screen so the text reads on any ground.
//   top left      a round clock with hands and the sun; right of it the needs as thin level bars one under another (health,
//                 stamina, food, water - the breath a fifth one in the combat mode) with their icons and numbers (the user,
//                 2026-10-12; before: arcs round the clock); under the clock the goal ("CEL", icon, title), the day's line, "Tryb
//                 walki", the premia
//   top centre    the map's name as one comes in, the notices, the banners
//   top right     the round goal compass (CleanHUD_Compass.js) and its label; under it the load (41 / 120 and the bag), the torch's
//                 gauge, the minimap only on M (hidden by default)
//   bottom left   empty
//   over him      his thoughts and the "you need..." popups as outlined text, no plates, no bubble; no bars under him (the user,
//                 2026-10-08: the breath bar under his feet is not drawn - it is the fifth bar beside the clock)
//   bottom right  what he gains: text and icons, the older ones fading; the weapon in the combat mode
// No experience bar (the user: "pasek doświadczenia z dołu wywalić"): the level is in the P menu and Postać, a new level still has
// its "Poziom N!" banner at the top.
// The old look (SurvivalHUD, Needs, Survival, Journal's goal window, Minimap, Combat_UI's plates, SpeechBubbles' bubbles over the
// hero) stays as it is: in the clean look its parts keep working (the same data, the same timing, the tests' hooks) and are only
// not drawn (renderable = false) - this plugin draws the same things its own way. Options: "Wygląd: Grafit / Klasyczny"
// (ConfigManager.uiClean, saved in config; Grafit by default).
// Load order: after every plugin of the HUD (SurvivalHUD, Survival, Needs, Journal, Minimap, Combat_UI, SpeechBubbles, Dog...).
// CleanHUD_Compass.js and MenuRing.js come right after it.

/*:
 * @target MZ
 * @plugindesc Grafit i miedź: HUD na mapie (zegar, obok poziome paski potrzeb, pod nim cel, okrągły kompas). W Opcjach: Wygląd - Grafit / Klasyczny. v1.3.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter SurvivalHUD
 * @orderAfter Survival
 * @orderAfter UITheme
 * @orderAfter Journal
 * @orderAfter Minimap
 * @orderAfter Needs
 * @orderAfter Dog
 * @orderAfter Combat_UI
 * @orderAfter SpeechBubbles
 * @orderAfter MenuPanel
 * @orderAfter Act3
 *
 * @help
 * ============================================================================
 * CleanHUD.js - Grafit i miedź (Czysty widok)
 * ============================================================================
 * Interfejs na mapie bez ciężkich paneli: tekst z ciemnym obrysem, grafitowe
 * pigułki i lekkie przyciemnienie przy górnej i dolnej krawędzi ekranu
 * (mocniejsze na jasnym tle: śnieg, piasek, błysk burzy).
 *  - Lewy górny róg: okrągły zegar ze wskazówkami i słońcem, po prawej od
 *    niego poziome paski potrzeb jeden pod drugim (życie, kondycja, sytość,
 *    nawodnienie; w trybie walki oddech jako piąty pasek) z ikonkami
 *    i liczbami, a pod zegarem cel (ikona, tytuł), pora dnia, dzień i pora
 *    roku, plakietka „Tryb walki” i premie. Niska wartość: pasek czerwony,
 *    miga.
 *  - Góra, środek: nazwa miejsca, która gaśnie po wejściu, i komunikaty
 *    (doświadczenie, cele, „Poziom N!”, powitanie dnia).
 *  - Prawy górny róg: okrągły kompas celu (CleanHUD_Compass.js), pod nim
 *    obciążenie plecaka, pochodnia i minimapa (klawisz M; w czystym widoku
 *    domyślnie ukryta).
 *  - Lewy dolny róg: pusty. Pod bohaterem nie ma żadnych pasków.
 *  - Myśli bohatera i komunikaty o brakach - tekst z obrysem nad nim.
 *  - Prawy dolny róg: zdobycze (starsze bledną) i broń w trybie walki.
 *  - Bez paska doświadczenia: poziom widać w menu P i w Postaci.
 * Gdy bohater wejdzie pod któryś element, ten robi się prawie przezroczysty
 * (jak w klasycznym wyglądzie).
 * Opcje: „Wygląd” - Grafit / Klasyczny (stary wygląd z panelami).
 * Notatka mapy <CleanHud:off> - na tej mapie zawsze klasyczny wygląd.
 * Skrypt: CleanHUD.isClean(), CleanHUD.setClean(true / false).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("CleanHUD.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "CleanHUD";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)

    // ------------------------------------------------------------------
    // The look: Opcje -> "Wygląd" (Czysty widok / Klasyczny), kept in the config file; the clean one unless it says otherwise
    // ------------------------------------------------------------------
    if (ConfigManager.uiClean === undefined) ConfigManager.uiClean = true;
    const _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _makeData.call(this);
        config.uiClean = this.uiClean !== false;
        return config;
    };
    const _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _applyData.call(this, config);
        this.uiClean = !config || config.uiClean === undefined ? true : !!config.uiClean;
    };
    const LOOK_SYMBOL = "uiClean";
    const _addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        this.addCommand("Wygląd", LOOK_SYMBOL);
        _addGeneralOptions.call(this);
    };
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        if (this.commandSymbol(index) === LOOK_SYMBOL) return this.getConfigValue(LOOK_SYMBOL) !== false ? "Grafit" : "Klasyczny";
        return _statusText.call(this, index);
    };
    const _statusWidth = Window_Options.prototype.statusWidth;
    Window_Options.prototype.statusWidth = function() {
        return Math.max(_statusWidth.call(this), 150);   // ("Klasyczny" is the longest value)
    };
    const _getConfigValue = Window_Options.prototype.getConfigValue;
    Window_Options.prototype.getConfigValue = function(symbol) {
        if (symbol === LOOK_SYMBOL) return ConfigManager.uiClean !== false;
        return _getConfigValue.call(this, symbol);
    };

    const lookClean = () => ConfigManager.uiClean !== false;
    // the clean look on the map now: the option, and the map does not ask for the old one (<CleanHud:off>)
    function isClean() {
        if (!lookClean()) return false;
        return !(window.$dataMap && T.mapFlag("CleanHud", true, "off") === false);
    }

    // ------------------------------------------------------------------
    // The palette and the drawing helpers. "Grafit i miedź" (the user's choice 2026-10-08, round 2 of the mock-ups:
    // docs/ui_pomysly2/POMYSLY.md idea 3, tools/ui_pomysly2/p3_grafit.py): graphite see-through panels rounded 8-12 px, one thin line,
    // one copper accent, spaced small capitals as labels; text with a dark outline where it stands on the map alone.
    // ------------------------------------------------------------------
    const C = {
        text: "#ece6da", muted: "#9a958c", dim: "#5e5a54", accent: "#d08a5a", copper2: "#8a5a3a", outline: "rgba(0,0,0,0.82)",
        panel: "rgba(22,23,26,0.84)", panel2: "rgba(30,32,36,0.92)", line: "#40424a", sun: "#f2c25a",
        health: "#d8605a", stamina: "#94bf6e", food: "#dda650", water: "#62a6dc", breath: "#8fe3ff"
    };
    const NEED_KEYS = ["health", "stamina", "food", "water", "breath"];
    const NEED_ICONS = { health: [84, "dark"], stamina: [82, "bare"], food: [390, "plain"], water: [391, "plain"] };
    const BAG_ICON = 370;
    const W = () => Graphics.width, H = () => Graphics.height;
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

    // the faces of the graphite look (fonts/: Alegreya Sans Regular and Bold, Alegreya Sans SC for the spaced small capitals - OFL, the
    // Alegreya Sans project like the Medium the game already uses): loaded once without FontManager (a missing file must not stop the
    // game); a part drawn before they are ready draws again (its key has facesReady())
    const FACES = { regular: ["TwAlegreyaSansReg", "AlegreyaSans-Regular.ttf"], bold: ["TwAlegreyaSansBold", "AlegreyaSans-Bold.ttf"], sc: ["TwAlegreyaSansSC", "AlegreyaSansSC-Medium.ttf"] };
    const faceState = {};
    function loadFaces() {
        for (const k in FACES) {
            if (faceState[k]) continue;
            faceState[k] = "loading";
            try {
                const f = new FontFace(FACES[k][0], "url(fonts/" + FACES[k][1] + ")");
                f.load().then(() => { document.fonts.add(f); faceState[k] = "ok"; }, () => { faceState[k] = "error"; });
            } catch (e) { faceState[k] = "error"; }
        }
    }
    loadFaces();
    const facesReady = () => Object.keys(FACES).every(k => faceState[k] === "ok" || faceState[k] === "error");
    function face(kind) {   // a font-family list: the face, then the game's main font
        const main = window.$gameSystem && $gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "rmmz-mainfont";
        return kind && FACES[kind] && faceState[kind] === "ok" ? FACES[kind][0] + ", " + main : main;
    }

    let probe = null;
    function measure(text, size, kind) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontFace = face(kind);
        probe.fontSize = size;
        return Math.ceil(probe.measureTextWidth(String(text)));
    }
    // text with the dark outline and a soft shadow round it (reads on grass, snow, trees); o.face: "regular" | "bold" | "sc"; o.plain:
    // no outline nor shadow (on a panel). (Bitmap.drawText always strokes the outline fully opaque, so a fainter text is a fainter
    // sprite, not an option here.)
    function textOut(bmp, text, x, y, w, h, align, o) {
        o = o || {};
        const ctx = bmp.context, main = bmp.fontFace;
        bmp.fontFace = face(o.face);
        bmp.fontSize = o.size || 18;
        bmp.fontBold = !!o.bold;
        bmp.textColor = o.color || C.text;
        bmp.outlineColor = o.plain ? "rgba(0,0,0,0)" : o.outline || C.outline;   // (a canvas ignores a line width of 0: no colour instead)
        bmp.outlineWidth = o.plain ? 1 : o.ow !== undefined ? o.ow : 4;
        ctx.save();
        if (!o.plain) {
            ctx.shadowColor = "rgba(0,0,0," + (o.shadow !== undefined ? o.shadow : 0.55) + ")";
            ctx.shadowBlur = o.blur !== undefined ? o.blur : 5;
            ctx.shadowOffsetY = 1;
        }
        bmp.drawText(String(text), x, y, w, h, align || "left");
        ctx.restore();
        bmp.fontBold = false;
        bmp.fontFace = main;
    }
    // spaced small capitals ("CEL", "SKĄD WZIĄĆ"): the SC face, letter by letter with `sp` px between; x by `align` (left / center /
    // right); y: the line's top, h its height; returns the width
    function spaced(bmp, text, x, y, h, o) {
        o = o || {};
        const size = o.size || 13, sp = o.sp === undefined ? 2 : o.sp, s = String(text).toLowerCase(), kind = o.face || "sc";
        const ws = Array.from(s).map(ch => (ch === " " ? measure("n", size, kind) : measure(ch, size, kind)));
        const total = ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, ws.length - 1);
        let cx = o.align === "center" ? x - total / 2 : o.align === "right" ? x - total : x;
        Array.from(s).forEach((ch, i) => {
            if (ch !== " ") textOut(bmp, ch, Math.round(cx), y, ws[i] + 6, h, "left", { size, face: kind, color: o.color || C.accent, plain: !o.outline, ow: o.ow });
            cx += ws[i] + sp;
        });
        return total;
    }
    function spacedWidth(text, size, sp, kind) {
        const s = String(text).toLowerCase(), k = kind || "sc";
        return Array.from(s).reduce((a, ch) => a + (ch === " " ? measure("n", size, k) : measure(ch, size, k)), 0) + (sp === undefined ? 2 : sp) * Math.max(0, s.length - 1);
    }
    // a rounded rectangle's path
    function roundPath(ctx, x, y, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    // a graphite panel: a soft shadow, the see-through fill, one thin line (the mock-ups' rpanel)
    function rpanel(ctx, x, y, w, h, r, o) {
        o = o || {};
        ctx.save();
        if (o.shadow !== 0) {
            ctx.fillStyle = "rgba(0,0,0," + (o.shadow === undefined ? 0.16 : o.shadow) + ")";
            roundPath(ctx, x + 1, y + 3, w, h + 1, r);
            ctx.fill();
        }
        if (o.fill !== null) {
            ctx.fillStyle = o.fill || C.panel;
            roundPath(ctx, x, y, w, h, r);
            ctx.fill();
        }
        if (o.line !== null) {
            ctx.strokeStyle = o.line || C.line;
            ctx.lineWidth = o.lw || 1;
            roundPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
            ctx.stroke();
        }
        ctx.restore();
    }
    const mix = (a, b, k) => {   // two #rrggbb colours mixed (k of b)
        const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b);
        return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",") + ")";
    };
    // shortened with "…" to fit `max` px
    function fit(text, size, max, kind) {
        text = String(text || "");
        if (measure(text, size, kind) <= max) return text;
        while (text.length > 1 && measure(text + "…", size, kind) > max) text = text.slice(0, -1);
        return text.replace(/[\s,.;:·-]+$/, "") + "…";
    }

    // An IconSet icon as a 32 x 32 bitmap; mode "plain" as it is, "bare" (the dark / grey RTP frame and plate flooded away from the
    // edges) or "green" / "dark" / "purple" (a key icon: its coloured plate flooded from inside its frame, the frame cut off), with a
    // 1 px dark outline round what is left - the mock-ups' uikit.icon_bare / icon_key. null while the sheet is loading.
    const cutCache = {};
    function iconBitmap(index, mode) {
        mode = mode || "plain";
        const key = index + ":" + mode;
        if (cutCache[key]) return cutCache[key];
        const set = ImageManager.loadSystem("IconSet");
        if (!set.isReady() || !(index > 0)) return null;
        const b = new Bitmap(32, 32);
        b.blt(set, (index % 16) * 32, Math.floor(index / 16) * 32, 32, 32, 0, 0);
        if (mode !== "plain") {
            try { cutFrame(b, mode); } catch (e) { /* (a tainted canvas: the icon as it is) */ }
        }
        cutCache[key] = b;
        return b;
    }
    function cutFrame(b, mode) {
        const N = 32, ctx = b.context, img = ctx.getImageData(0, 0, N, N), d = img.data;
        const bg = new Uint8Array(N * N), seen = new Uint8Array(N * N), keep = new Uint8Array(N * N);
        for (let i = 0; i < N * N; i++) {
            const r = d[i * 4], g = d[i * 4 + 1], bl = d[i * 4 + 2], a = d[i * 4 + 3], mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
            if (mode === "bare") bg[i] = a < 40 || mx < 95 || (mx - mn) / Math.max(mx, 1) < 0.28 ? 1 : 0;
            else if (mode === "green") bg[i] = g > r + 18 && g > bl + 8 ? 1 : 0;
            else if (mode === "purple") bg[i] = bl > g + 25 && r > g + 10 ? 1 : 0;
            else bg[i] = mx < 110 || (bl > r + 30 && bl > g + 10 && bl < 200) ? 1 : 0;
        }
        const m = mode === "bare" ? 0 : 3, stack = [];
        for (let y = m; y < N - m; y++) stack.push(y * N + m, y * N + (N - 1 - m));
        for (let x = m; x < N - m; x++) stack.push(m * N + x, (N - 1 - m) * N + x);
        while (stack.length) {
            const i = stack.pop();
            if (seen[i] || !bg[i]) continue;
            const x = i % N, y = (i / N) | 0;
            if (x < m || y < m || x >= N - m || y >= N - m) continue;
            seen[i] = 1;
            if (x > 0) stack.push(i - 1);
            if (x < N - 1) stack.push(i + 1);
            if (y > 0) stack.push(i - N);
            if (y < N - 1) stack.push(i + N);
        }
        for (let i = 0; i < N * N; i++) {
            const x = i % N, y = (i / N) | 0;
            keep[i] = !seen[i] && d[i * 4 + 3] > 40 && x >= 3 && y >= 3 && x < N - 3 && y < N - 3 ? 1 : 0;
        }
        const out = ctx.createImageData(N, N), o = out.data;
        for (let i = 0; i < N * N; i++) {
            const x = i % N, y = (i / N) | 0;
            if (keep[i]) { for (let k = 0; k < 4; k++) o[i * 4 + k] = d[i * 4 + k]; continue; }
            const edge = (x > 0 && keep[i - 1]) || (x < N - 1 && keep[i + 1]) || (y > 0 && keep[i - N]) || (y < N - 1 && keep[i + N]);
            if (edge) { o[i * 4] = 20; o[i * 4 + 1] = 16; o[i * 4 + 2] = 12; o[i * 4 + 3] = 255; }
        }
        ctx.putImageData(out, 0, 0);
        b._baseTexture.update();
    }
    // an icon onto a bitmap (size: the drawn size); false while the sheet is loading
    function drawIcon(bmp, index, x, y, size, mode, alpha) {
        const ib = iconBitmap(index, mode);
        if (!ib) return false;
        const s = size || 32;
        if (alpha !== undefined && alpha < 1) bmp.paintOpacity = Math.round(255 * alpha);
        bmp.context.imageSmoothingEnabled = false;
        bmp.blt(ib, 0, 0, 32, 32, Math.round(x), Math.round(y), s, s);
        bmp.paintOpacity = 255;
        return true;
    }
    const iconsReady = () => ImageManager.loadSystem("IconSet").isReady();

    // a thin bar without a frame: a dark trough, a faint light inside, the colour (the mock-ups' thin_bar)
    function thinBar(ctx, x, y, w, h, ratio, colour, alpha) {
        const a = alpha === undefined ? 1 : alpha;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(x, y, w, h);
        const fw = Math.round(w * clamp01(ratio));
        if (fw > 0) {
            ctx.fillStyle = colour;
            ctx.fillRect(x, y, fw, h);
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.fillRect(x, y, fw, 1);
        }
        ctx.restore();
    }
    const pl = (n, one, few, many) => {   // Polish plurals: 1 krok, 2 kroki, 5 kroków
        const a = Math.abs(n), t = a % 100, u = a % 10;
        return a === 1 ? one : u >= 2 && u <= 4 && (t < 12 || t > 14) ? few : many;
    };

    // ------------------------------------------------------------------
    // What the HUD shows: the time, the needs, the goal of the goal window, the load
    // ------------------------------------------------------------------
    const hm = h => { const t = Math.floor(h * 60 + 1e-6), HH = Math.floor(t / 60) % 24, M = t % 60; return HH + ":" + (M < 10 ? "0" : "") + M; };
    function needValues() {
        const out = {};
        const hp = typeof $gameSystem.healthRatio === "function" ? $gameSystem.healthRatio() : 1;
        out.health = clamp01(hp);
        out.stamina = typeof $gameSystem.staminaRatio === "function" ? clamp01($gameSystem.staminaRatio()) : 1;
        const N = T.api("Needs");
        if (N && N.enabled && N.enabled()) {
            const n = N.state();
            out.food = clamp01(n.food / 100);
            out.water = clamp01(n.water / 100);
        }
        const Cb = T.api("Combat");   // (the breath: only in the combat mode - Tab - where the roll and the guard live on it)
        if (Cb && Cb.combatMode && Cb.combatMode() && typeof Cb.maxBreath === "function") {
            out.breath = clamp01(Cb.breath / Math.max(1, Cb.maxBreath()));
            out.winded = !!Cb.winded;
        }
        return out;
    }
    // low enough to draw the eye (a pulsing frame round its bar): the old HUD's thresholds
    function needLow(key, v) {
        const N = T.api("Needs"), urgent = N && N.URGENT ? N.URGENT / 100 : 0.2;
        if (key === "breath") { const Cb = T.api("Combat"); return !!(Cb && Cb.winded); }
        return key === "health" ? v <= 0.25 : key === "stamina" ? v <= 0.15 : v < urgent;
    }
    function itemIcon(id) { const it = window.$dataItems && $dataItems[id]; return it ? it.iconIndex : 0; }
    // The goal of the goal window (Journal.js): Journal.tracked() - a contract of the quest board or a town quest being followed
    // ({ source: "board" | "town", id, icon, title, line }), else the journal's goal ({ source: "goal", goal, ... }). (A journal
    // without tracked(): its own goal only.)
    function goalInfo(scene) {
        const J = T.api("Journal");
        if (!J || !window.$gameSystem) return null;
        if (typeof J.tracked === "function") {
            try { return J.tracked(); } catch (e) { return null; }
        }
        let g = null;
        try { g = J.currentGoal(); } catch (e) { g = null; }
        if (!g) return null;
        let line = "";
        try { line = J.goalProgress ? J.goalProgress(g) : ""; } catch (e) { line = ""; }
        return { source: "goal", label: "CEL", goal: g, title: g.title, line, icon: g.item ? itemIcon(g.item) : g.icon || 0, id: g.id };
    }
    function loadInfo() {
        const S = T.api("Survival");
        if (!S || !S.carriedWeight || !S.weightCap) return null;
        const carried = Math.round(S.carriedWeight()), cap = Math.max(1, S.weightCap());
        return { carried, cap, full: carried / cap };
    }

    // ------------------------------------------------------------------
    // A part of the clean HUD: a sprite in the HUD layer that knows its box on the screen (SurvivalHUD's fade under the hero)
    // ------------------------------------------------------------------
    function Sprite_CleanPart() {
        this.initialize(...arguments);
    }
    Sprite_CleanPart.prototype = Object.create(Sprite.prototype);
    Sprite_CleanPart.prototype.constructor = Sprite_CleanPart;
    Sprite_CleanPart.prototype.initialize = function(w, h) {
        Sprite.prototype.initialize.call(this, w ? new Bitmap(w, h) : null);
        this._key = null;
        this._box = null;   // { x, y, w, h } in the bitmap: what is drawn (the rest is empty)
        this.visible = false;
    };
    Sprite_CleanPart.prototype.hudRect = function() {
        if (!this._box || !this.visible) return new PIXI.Rectangle(0, 0, 0, 0);
        const b = this._box, s = this.scale;
        return new PIXI.Rectangle(this.x - this.anchor.x * (this.bitmap ? this.bitmap.width : 0) * s.x + b.x * s.x,
            this.y - this.anchor.y * (this.bitmap ? this.bitmap.height : 0) * s.y + b.y * s.y, b.w * s.x, b.h * s.y);
    };

    // ---- the shade at the top and bottom edges: stronger on bright ground (snow, sand, stone), in a flash of the storm, in snowfall
    const SHADE = { top: 96, bottom: 84, base: 0.2, bright: 0.3, flash: 0.32, snow: 0.08, max: 0.75 };   // (lighter: the graphite panels hold their own text)
    function Sprite_CleanShade() {
        this.initialize(...arguments);
    }
    Sprite_CleanShade.prototype = Object.create(Sprite.prototype);
    Sprite_CleanShade.prototype.constructor = Sprite_CleanShade;
    Sprite_CleanShade.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._top = new Sprite(this.gradient(SHADE.top, false));
        this._bottom = new Sprite(this.gradient(SHADE.bottom, true));
        this.addChild(this._top);
        this.addChild(this._bottom);
        this._level = SHADE.base;
        this._bright = { top: 0.4, bottom: 0.4 };
        this._t = 0;
        this.visible = false;
    };
    Sprite_CleanShade.prototype.gradient = function(h, up) {
        const b = new Bitmap(16, h), ctx = b.context;
        for (let y = 0; y < h; y++) {
            const k = Math.pow(1 - y / h, 1.6);
            ctx.fillStyle = "rgba(0,0,0," + k.toFixed(3) + ")";
            ctx.fillRect(0, up ? h - 1 - y : y, 16, 1);
        }
        b._baseTexture.update();
        return b;
    };
    // the mean lightness (0..1) of the ground under a band of the screen: the tiles' own colours (Minimap.groundColourAt)
    Sprite_CleanShade.prototype.sample = function(fromY, toY) {
        const M = T.api("Minimap");
        if (!M || !M.groundColourAt || !$gameMap) return null;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), z = $gameScreen.zoomScale() || 1;
        let sum = 0, n = 0;
        for (let sy = fromY; sy <= toY; sy += th * z * 0.8) {
            for (let sx = 24; sx < W(); sx += 96) {
                const mx = Math.floor($gameMap.displayX() + sx / z / tw), my = Math.floor($gameMap.displayY() + sy / z / th);
                const c = M.groundColourAt($gameMap.roundX(mx), $gameMap.roundY(my));
                if (!c) continue;
                sum += (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
                n++;
            }
        }
        return n ? sum / n : null;
    };
    Sprite_CleanShade.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = isClean();
        if (!this.visible) return;
        this._top.scale.x = this._bottom.scale.x = W() / 16;
        this._bottom.y = H() - SHADE.bottom;
        if (this._t++ % 20 === 0) {
            const top = this.sample(4, SHADE.top), bottom = this.sample(H() - SHADE.bottom, H() - 6);
            if (top !== null) this._bright.top = top;
            if (bottom !== null) this._bright.bottom = bottom;
        }
        const day = T.time && T.time.isNight() ? 0.45 : 1;
        const lit = k => clamp01((this._bright[k] * day - 0.32) / 0.4);
        const S = T.api("Storm"), flash = S && S.flash ? S.flash() || 0 : 0;
        const snow = $gameScreen.weatherType() === "snow" ? clamp01($gameScreen.weatherPower() / 9) : 0;
        for (const [k, s] of [["top", this._top], ["bottom", this._bottom]]) {
            const want = Math.min(SHADE.max, SHADE.base + SHADE.bright * lit(k) + SHADE.snow * snow + SHADE.flash * flash);
            s._lv = s._lv === undefined ? want : want > s._lv + 0.05 ? want : s._lv + (want - s._lv) * 0.08;   // (up at once in a flash, down slowly)
            s.opacity = Math.round(255 * s._lv);
        }
    };
    Sprite_CleanShade.prototype.levels = function() {
        return { top: this._top.opacity / 255, bottom: this._bottom.opacity / 255, groundTop: this._bright.top, groundBottom: this._bright.bottom };
    };

    // ---- top left (the user, 2026-10-12: "paski zdrowia wytrzymałości itd. niech będą poziome i po prawo od zegara, a pod zegarem
    // aktywne zadanie"): a round clock with hands (the sun inside it at the hour of a 24 h day, noon at the top - the moon at night);
    // right of it the needs as thin level bars one under another on a light graphite plate (health, stamina, food, water - the breath a
    // fifth one in the combat mode), each with its small icon and its number; under the clock the goal followed ("CEL", its icon and
    // title), the day's line ("Południe · dzień 40 · lato"), the pills ("Tryb walki", the premia). The bottom left corner stays empty.
    // Two sprites: Sprite_CleanClock (the clock and the text) and Sprite_CleanNeeds (the bars); they fade as one.
    const CLK = { cx: 58, cy: 56, r: 40 };
    // the bars' plate: gap from the clock; a row every `step` px (centred on the clock's middle); inside: padX, the icon, the bar, the number
    const BARS = { gap: 12, step: 18, padX: 10, icon: 20, barW: 128, barH: 6, valW: 40, pad: 4 };
    BARS.w = BARS.padX + BARS.icon + 6 + BARS.barW + 8 + BARS.valW + BARS.padX;
    const GOAL = { x: 14, gap: 8, maxW: 400, titleSize: 19, lineSize: 14, line: "#b4aea2", pillH: 24 };
    const LOW_COLOUR = "#ff6f5e";
    // the day's line: the part of the day (DayNightCycle), the day, the season
    function dayLine(hour) {
        const t = T.time, p = t.period ? t.period(hour) : null, d = t.day();
        return (p ? p.name + " · " : "") + "dzień " + d + " · " + String(t.seasonName(d) || "").toLowerCase();
    }
    // the premia (Survival.js: sated, warm, wounded - and TavernLife's) with the hours they have left, and the cold
    function buffList() {
        const S = T.api("Survival"), out = [];
        if (!S || typeof $gameSystem.activeBuffs !== "function") return out;
        for (const b of $gameSystem.activeBuffs()) {
            const def = S.BUFFS && S.BUFFS[b.name];
            if (def) out.push({ icon: def.icon, text: Math.max(1, Math.ceil(b.left)) + " h", bad: !!def.bad });
        }
        if (typeof $gameSystem.isCold === "function" && $gameSystem.isCold()) out.push({ glyph: "cold", text: "Zimno!", colour: "#bfe0ff" });
        return out;
    }
    const combatOn = () => { const Cb = T.api("Combat"); return !!(Cb && Cb.combatMode && Cb.combatMode()); };

    // the corner fades as one (the clock, the text, the bars): the box of each is the box of both
    function cornerRect() {
        const scene = SceneManager._scene;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of scene ? [scene._cleanClock, scene._cleanNeeds] : []) {
            if (!p || !p.visible || !p._box) continue;
            const r = Sprite_CleanPart.prototype.hudRect.call(p);
            if (!(r.width > 0)) continue;
            x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height);
        }
        return x1 > x0 ? new PIXI.Rectangle(x0, y0, x1 - x0, y1 - y0) : new PIXI.Rectangle(0, 0, 0, 0);
    }

    function Sprite_CleanClock() {
        this.initialize(...arguments);
    }
    Sprite_CleanClock.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanClock.prototype.constructor = Sprite_CleanClock;
    Sprite_CleanClock.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 640, 240);
        this._mapId = 0;
        this._showClock = true;
    };
    Sprite_CleanClock.prototype.ownRect = Sprite_CleanPart.prototype.hudRect;
    Sprite_CleanClock.prototype.hudRect = function() {
        return this.visible ? cornerRect() : new PIXI.Rectangle(0, 0, 0, 0);
    };
    Sprite_CleanClock.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = isClean();
        if (!this.visible || !$gameSystem) return;
        if ($gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._showClock = T.mapFlag("Clock", true, "off"); }
        const hour = T.time.hour(), scene = SceneManager._scene, shown = this.goalShown();
        // (the goal: a few times a second - the old goal window still works it out every frame for its own text)
        if (!shown) { this._goal = null; this._goalT = 0; }
        else if (!(this._goalT-- > 0)) { this._goal = goalInfo(scene); this._goalT = 10; }
        const goal = this._goal, gy = this.textY(scene), combat = shown && combatOn(), buffs = shown ? buffList() : [];
        const day = shown && this._showClock ? dayLine(hour) : "";
        // (the hands move every game minute; the sun's place with them)
        const key = [this._showClock ? Math.floor(hour * 60) : "", goal ? goal.title + "|" + goal.icon : "", gy, day, combat,
            buffs.map(f => (f.icon || f.glyph) + f.text).join(","), iconsReady(), facesReady()].join("#");
        if (key === this._key) return;
        this._key = key;
        this.redraw(hour, goal, gy, day, combat, buffs);
    };
    // the goal, the day's line and the pills hide while a message is up (as the old goal window did)
    Sprite_CleanClock.prototype.goalShown = function() {
        return !$gameMessage.isBusy();
    };
    // the text's top: under the clock and under the bars beside it (the combat mode's fifth bar reaches a little lower)
    Sprite_CleanClock.prototype.textY = function(scene) {
        const needs = scene && scene._cleanNeeds, under = needs && needs.bottom ? needs.bottom() : 0;
        return Math.round(Math.max(this._showClock ? CLK.cy + CLK.r : 4, under) + GOAL.gap);
    };
    Sprite_CleanClock.prototype.redraw = function(hour, goal, gy, day, combat, buffs) {
        const b = this.bitmap, ctx = b.context, clock = this._showClock, gx = GOAL.x, tx = gx + 32;
        b.clear();
        let right = 0, bottom = 0;
        if (clock) {
            drawClock(ctx, CLK.cx, CLK.cy, CLK.r, hour);
            right = CLK.cx + CLK.r + 2;
            bottom = CLK.cy + CLK.r + 2;
        }
        let y = gy;
        if (goal) {
            spaced(b, "Cel", gx + 2, y - 2, 16, { size: 12, outline: true, ow: 3 });
            if (goal.icon > 0) drawIcon(b, goal.icon, gx - 2, y + 13, 28);
            else drawGoalMark(b, gx + 12, y + 27);
            const title = fit(goal.title, GOAL.titleSize, GOAL.maxW);
            textOut(b, title, tx, y + 13, GOAL.maxW + 10, 28, "left", { size: GOAL.titleSize, ow: 4, outline: "rgba(0,0,0,0.62)", shadow: 0.45, blur: 4 });
            right = Math.max(right, tx + measure(title, GOAL.titleSize) + 8);
            y += 41;
            bottom = Math.max(bottom, y);
        }
        if (day) {   // (no goal: the day's line right under the clock)
            textOut(b, day, goal ? tx : gx, y, GOAL.maxW, 22, "left", { size: GOAL.lineSize, color: GOAL.line, ow: 3, outline: "rgba(0,0,0,0.6)", shadow: 0.4, blur: 4 });
            right = Math.max(right, (goal ? tx : gx) + measure(day, GOAL.lineSize) + 8);
            y += 24;
            bottom = Math.max(bottom, y);
        }
        // the pills under the day's line: "Tryb walki", then the premia
        let px = goal ? tx : gx;
        const x0 = px, py = y + 2, ph = GOAL.pillH;
        if (combat) {
            const w = Math.max(112, measure("Tryb walki", 15) + 28);
            rpanel(ctx, px, py, w, ph, ph / 2, { fill: "rgba(30,32,36,0.86)", line: "#e8806a", shadow: 0 });
            textOut(b, "Tryb walki", px, py, w, ph, "center", { size: 15, color: "#f0b0a0", plain: true });
            px += w + 8;
        }
        for (const f of buffs) {
            const tw = measure(f.text, 15), w = 28 + tw + 10;
            rpanel(ctx, px, py, w, ph, ph / 2, { shadow: 0.12 });
            if (f.glyph && window.UIStyle && UIStyle.glyph) UIStyle.glyph(ctx, f.glyph, px + 6, py + 3, 18, f.colour);
            else if (f.icon) drawIcon(b, f.icon, px + 4, py + 2, 20);
            textOut(b, f.text, px + 27, py, tw + 6, ph, "left", { size: 15, color: f.colour || (f.bad ? "#e88e80" : C.text), plain: true });
            px += w + 6;
        }
        if (px > x0) { right = Math.max(right, px); bottom = Math.max(bottom, py + ph + 2); }
        b._baseTexture.update();
        this._text = { x: tx, y: gy, goal: !!goal, day, combat, buffs: buffs.length, pillY: py };   // (the tests read what is drawn)
        this._box = right > 0 ? { x: 0, y: 0, w: right, h: bottom + 2 } : null;
    };
    // no icon of its own: a small copper diamond
    function drawGoalMark(b, cx, cy) {
        const ctx = b.context;
        ctx.save();
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 7, cy); ctx.closePath(); ctx.fill();
        ctx.restore();
        b._baseTexture.update();
    }
    // the clock: a graphite face with a copper ring inside, 12 dots (the four quarters bigger, light), the sun inside on a 24 h day
    // (noon at the top; the moon there at night), the hour hand in the text's colour, the copper minute hand, a copper hub
    function drawClock(ctx, cx, cy, r, hour) {
        const dot = (x, y, rr, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); };
        const at = (rr, deg) => [cx + Math.sin(deg * Math.PI / 180) * rr, cy - Math.cos(deg * Math.PI / 180) * rr];
        ctx.save();
        dot(cx, cy, r + 1, "rgba(8,9,11,0.67)");
        dot(cx, cy, r, "rgba(30,32,36,0.94)");
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgb(64,66,72)";
        ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = C.copper2;
        ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 12; k++) {
            const [x, y] = at(r - 8, k * 30);
            if (k % 3 === 0) dot(x, y, 1.4, C.text);
            else dot(x, y, 0.8, "#8a857c");
        }
        const [sx, sy] = at(r * 0.5, ((((hour - 12) % 24) + 24) % 24) * 15), sr = Math.max(2.5, r * 0.11);
        if (T.time.isNight(hour)) {   // the moon: pale, a bite of the face taken out of it
            dot(sx, sy, sr, "#dfe6ff");
            dot(sx + sr * 0.45, sy - sr * 0.3, sr * 0.8, "rgb(30,32,36)");
        } else dot(sx, sy, sr, C.sun);
        ctx.lineCap = "round";
        const hand = (deg, len, w, col) => {
            const [x, y] = at(len, deg);
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        };
        hand((hour % 12) * 30, r * 0.48, 3, C.text);
        hand((hour % 1) * 360, r * 0.74, 2, C.accent);
        dot(cx, cy, 2.6, C.accent);
        ctx.restore();
    }

    // ---- top right, under the compass and its label: the load - "41 / 120" and the bag (copper when heavy, red when full)
    function Sprite_CleanLoad() {
        this.initialize(...arguments);
    }
    Sprite_CleanLoad.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanLoad.prototype.constructor = Sprite_CleanLoad;
    Sprite_CleanLoad.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 220, 40);
    };
    Sprite_CleanLoad.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const L = isClean() && $gameSystem ? loadInfo() : null;
        this.visible = !!L;
        if (!L) return;
        const scene = SceneManager._scene, c = scene && scene._cleanCompass;
        this.x = W() - this.bitmap.width;
        this.y = c && c.visible && c.bottom ? c.bottom() + 2 : 4;   // (under the compass and its label)
        const key = L.carried + "/" + L.cap + "/" + iconsReady() + facesReady();
        if (key === this._key) return;
        this._key = key;
        const b = this.bitmap, text = L.carried + " / " + L.cap;
        b.clear();
        drawIcon(b, BAG_ICON, 178, 4, 32);
        const colour = L.full >= 0.95 ? "#e0705a" : L.full >= 0.75 ? C.accent : C.text;
        textOut(b, text, 0, 6, 172, 28, "right", { size: 16, color: colour, ow: 3, shadow: 0.4 });
        const tw = measure(text, 16);
        this._box = { x: 168 - tw, y: 2, w: tw + 48, h: 36 };
    };
    Sprite_CleanLoad.prototype.bottom = function() {
        const scene = SceneManager._scene, c = scene && scene._cleanCompass, top = c && c.visible && c.bottom ? c.bottom() : 8;
        return this.visible ? this.y + 40 : top;
    };

    // ---- the needs' bars right of the clock (top left, see Sprite_CleanClock): on a light graphite plate, one row each - the small
    // icon, a thin dark track with the need's colour as far as it is full, the number (health in %, the others as the game counts them);
    // low: red, pulsing, the number red. The breath (no icon of its own) a small pixel sign of gusts, only in the combat mode.
    function Sprite_CleanNeeds() {
        this.initialize(...arguments);
    }
    Sprite_CleanNeeds.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanNeeds.prototype.constructor = Sprite_CleanNeeds;
    Sprite_CleanNeeds.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 400, 140);
        this._pulse = 0;
        this._mapId = 0;
        this._show = true;
        this._rings = [];
        this._bars = [];
        this._bottom = 0;
    };
    Sprite_CleanNeeds.prototype.ownRect = Sprite_CleanPart.prototype.hudRect;
    Sprite_CleanNeeds.prototype.hudRect = function() {
        return this.visible ? cornerRect() : new PIXI.Rectangle(0, 0, 0, 0);
    };
    // the plate's bottom edge (the corner's text starts under it and under the clock); 0 when no bar is drawn
    Sprite_CleanNeeds.prototype.bottom = function() {
        return this.visible && this._rings.length ? this._bottom : 0;
    };
    Sprite_CleanNeeds.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if ($gameMap && $gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._show = T.mapFlag("Stamina", true, "off"); }
        this.visible = isClean() && this._show && !!$gameSystem;
        if (!this.visible) return;
        this.x = 0;
        this.y = 0;
        const v = needValues(), scene = SceneManager._scene, clock = !!(scene && scene._cleanClock && scene._cleanClock._showClock);
        this._pulse = (this._pulse + 1) % 60;
        const low = NEED_KEYS.filter(k => v[k] !== undefined && needLow(k, v[k]));
        const blink = low.length ? (this._pulse < 30 ? "a" : "b") : "-";
        const key = NEED_KEYS.map(k => (v[k] === undefined ? "x" : needNumber(k, v[k]) + ":" + Math.round(v[k] * 300))).join(",") + "|" + low.join(",") + blink + "|" + clock + iconsReady() + facesReady();
        if (key === this._key) return;
        this._key = key;
        this.redraw(v, low, blink === "a", clock);
    };
    // the number by a bar: health in % of the most, the stamina, the food and the water as the game counts them, the breath in %
    function needNumber(k, v) {
        if (k === "stamina" && typeof $gameSystem.stamina === "function") return String(Math.round($gameSystem.stamina()));
        const N = T.api("Needs");
        if ((k === "food" || k === "water") && N && N.state) return String(Math.round(N.state()[k]));
        return Math.round(v * 100) + "%";
    }
    Sprite_CleanNeeds.prototype.redraw = function(v, low, blinkOn, clock) {
        const b = this.bitmap, ctx = b.context, keys = NEED_KEYS.filter(k => v[k] !== undefined);
        b.clear();
        this._rings = keys;
        this._bars = [];
        if (!keys.length) { this._box = null; this._bottom = 0; return; }
        const n = keys.length, x0 = clock ? CLK.cx + CLK.r + BARS.gap : 12, ys = keys.map((k, i) => CLK.cy - (n - 1) * BARS.step / 2 + i * BARS.step);
        const top = Math.max(2, ys[0] - BARS.step / 2 - BARS.pad), bottom = ys[n - 1] + BARS.step / 2 + BARS.pad;
        rpanel(ctx, x0, top, BARS.w, bottom - top, 10, { fill: "rgba(20,21,24,0.62)", line: "rgba(64,66,74,0.75)", shadow: 0.14 });
        const ix = x0 + BARS.padX, bx = ix + BARS.icon + 6, vx = bx + BARS.barW + 8;
        keys.forEach((k, i) => {
            const y = ys[i], isLow = low.includes(k), col = isLow ? LOW_COLOUR : C[k], ratio = clamp01(v[k]), by = Math.round(y - BARS.barH / 2);
            if (k === "breath") drawBreathGlyph(ctx, ix + BARS.icon / 2, y, isLow ? LOW_COLOUR : C.breath, 2);
            else { const [icon, mode] = NEED_ICONS[k]; drawIcon(b, icon, ix, y - BARS.icon / 2, BARS.icon, mode); }
            ctx.save();
            ctx.fillStyle = "rgba(8,9,11,0.8)";   // the track: a dark edge, the dark inside
            roundPath(ctx, bx - 1, by - 1, BARS.barW + 2, BARS.barH + 2, (BARS.barH + 2) / 2);
            ctx.fill();
            ctx.fillStyle = "rgba(52,54,60,0.95)";
            roundPath(ctx, bx, by, BARS.barW, BARS.barH, BARS.barH / 2);
            ctx.fill();
            const fw = Math.round(BARS.barW * ratio);
            if (fw > 0) {
                if (isLow && blinkOn) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
                ctx.globalAlpha = isLow && !blinkOn ? 0.6 : 1;
                ctx.fillStyle = col;
                roundPath(ctx, bx, by, Math.max(BARS.barH, fw), BARS.barH, BARS.barH / 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
                ctx.fillStyle = "rgba(255,255,255,0.22)";   // a faint light on its top edge
                ctx.fillRect(bx + 2, by, Math.max(0, Math.max(BARS.barH, fw) - 4), 1);
            }
            ctx.restore();
            textOut(b, needNumber(k, v[k]), vx, y - 10, BARS.valW, 20, "right", { size: 14, color: isLow ? LOW_COLOUR : C.text, plain: true });
            this._bars.push({ key: k, x: bx, y, w: BARS.barW, h: BARS.barH, ratio: +ratio.toFixed(3), fill: fw, colour: col, low: isLow, number: needNumber(k, v[k]) });
        });
        b._baseTexture.update();
        this._slices = keys.filter(k => k !== "breath").length;   // (the tests read what is drawn)
        this._breathBand = keys.includes("breath");
        this._bottom = bottom;
        this._box = { x: x0, y: top, w: BARS.w, h: bottom - top };
    };
    // the breath's sign (no icon of its own): three gusts of air - a 7 x 6 pixel sign drawn `scale` x (3 by default), outlined
    const BREATH_GLYPH = ["#####..", ".....#.", "######.", ".......", "####...", "....#.."];
    function drawBreathGlyph(ctx, cx, cy, colour, scale) {
        const s = scale || 3, g = BREATH_GLYPH, h = g.length, w = g[0].length;
        const x0 = Math.round(cx - (w + 2) * s / 2), y0 = Math.round(cy - (h + 2) * s / 2);
        const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && g[y][x] === "#";
        ctx.save();
        ctx.fillStyle = "rgba(10,10,12,0.9)";
        for (let y = -1; y <= h; y++) {
            for (let x = -1; x <= w; x++) if (on(x, y) || on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) ctx.fillRect(x0 + (x + 1) * s, y0 + (y + 1) * s, s, s);
        }
        ctx.fillStyle = colour;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) ctx.fillRect(x0 + (x + 1) * s, y0 + (y + 1) * s, s, s);
        ctx.restore();
    }

    // the hero's feet on the screen (his sprite's anchor, the map's zoom included) - MenuRing.js centres its ring on him
    function heroFeet() {
        const scene = SceneManager._scene, set = scene && scene._spriteset;
        if (!set || !set._characterSprites) return null;
        let s = scene._cleanHeroSprite;
        if (!s || s._character !== $gamePlayer || !s.parent) {
            s = set._characterSprites.find(c => c._character === $gamePlayer) || null;
            scene._cleanHeroSprite = s;
        }
        if (!s) return null;
        const p = s.getGlobalPosition(new PIXI.Point());
        return { x: p.x, y: p.y };
    }

    // ---- bottom right: what was gained (SurvivalHUD's list, its plates read as they are) - graphite pills with the icon and the text,
    // the newest at the bottom, the older ones fading
    const GAINS = { right: 10, row: 38, size: 18, bottom: 40, h: 32, ages: [1, 0.85, 0.7, 0.55, 0.45, 0.38, 0.32] };
    // a pill: icon (or none) and text on a graphite panel rounded to its half height
    function pillBitmap(text, icon, colour, extra) {
        const tw = measure(text, GAINS.size), xw = extra ? measure(extra, 15) + 10 : 0, w = (icon > 0 ? 44 : 14) + tw + 12 + xw, b = new Bitmap(w + 2, GAINS.h + 4);
        rpanel(b.context, 0, 0, w, GAINS.h, GAINS.h / 2);
        if (icon > 0) drawIcon(b, icon, 6, 0, 32);
        textOut(b, text, icon > 0 ? 44 : 14, 1, tw + 6, GAINS.h - 2, "left", { size: GAINS.size, color: colour || C.text, plain: true });
        if (extra) textOut(b, extra, w - xw - 2, 2, xw, GAINS.h - 4, "left", { size: 15, color: C.muted, plain: true });
        b._baseTexture.update();
        return b;
    }
    function Sprite_CleanGains() {
        this.initialize(...arguments);
    }
    Sprite_CleanGains.prototype = Object.create(Sprite.prototype);
    Sprite_CleanGains.prototype.constructor = Sprite_CleanGains;
    Sprite_CleanGains.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._rows = new Map();   // plate -> row sprite
        this.visible = false;
    };
    Sprite_CleanGains.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene, feed = scene && scene._gainFeed;
        this.visible = isClean() && !!feed && !bottomCovered();
        const plates = feed ? feed.children.slice() : [];
        for (const [p, row] of this._rows) if (!plates.includes(p)) { this.removeChild(row); this._rows.delete(p); }
        if (!this.visible) return;
        let y = H() - GAINS.bottom - (scene._cleanWeapon && scene._cleanWeapon.visible ? GAINS.row : 0);
        for (let i = plates.length - 1, rank = 0; i >= 0; i--, rank++) {
            const p = plates[i], text = typeof p.text === "function" ? p.text() : (p._data && p._data.text) || "";
            let row = this._rows.get(p);
            const key = text + "|" + iconsReady() + facesReady();
            if (!row) { row = new Sprite(); row.anchor.set(1, 0); this.addChild(row); this._rows.set(p, row); }
            if (row._key !== key) { row._key = key; row.bitmap = pillBitmap(text, p._data ? p._data.iconIndex : 0, p._data && p._data.color !== "#ffffff" ? p._data.color : C.text); }
            row.x = W() - GAINS.right + 2 + (p._slideX || 0);
            row.y = row._placed && Math.abs(row.y - y) > 0.5 ? row.y + (y - row.y) * 0.25 : y;
            row._placed = true;
            row.opacity = Math.round((p.opacity === undefined ? 255 : p.opacity) * (GAINS.ages[rank] || 0.3));
            y -= GAINS.row;
        }
    };
    Sprite_CleanGains.prototype.hudRect = function() {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const row of this.children) {
            if (!row.bitmap || row.opacity <= 0) continue;
            x0 = Math.min(x0, row.x - row.bitmap.width); x1 = Math.max(x1, row.x);
            y0 = Math.min(y0, row.y); y1 = Math.max(y1, row.y + row.bitmap.height);
        }
        return x1 > x0 && this.visible ? new PIXI.Rectangle(x0, y0, x1 - x0, y1 - y0) : new PIXI.Rectangle(0, 0, 0, 0);
    };

    // ---- the combat mode: the weapon in hand at the bottom right (a pill like the gains, "[ ]" muted), the sneaking at the bottom centre
    function Sprite_CleanWeapon() {
        this.initialize(...arguments);
    }
    Sprite_CleanWeapon.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanWeapon.prototype.constructor = Sprite_CleanWeapon;
    Sprite_CleanWeapon.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 8, 8);
        this.anchor.set(1, 0);
    };
    Sprite_CleanWeapon.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene, plate = scene && scene._weaponPlate, Cb = T.api("Combat");
        this.visible = isClean() && !!plate && plate.visible && !!Cb && !bottomCovered();
        if (!this.visible) return;
        this.x = W() - GAINS.right + 2;
        this.y = H() - GAINS.bottom;
        const h = Cb.hand ? Cb.hand() : null;
        const key = h + "|" + iconsReady() + facesReady();
        if (!h || key === this._key) return;
        this._key = key;
        const P = T.api("Combat_parts"), melee = h[0] === "m" ? (Cb.MELEE || {})[Number(h.slice(1))] : null;
        const name = melee ? melee.name : "Łuk / proca", icon = P && P.fight && P.fight.handIcon ? P.fight.handIcon(h) : 0;
        this.bitmap = pillBitmap(name, icon, C.text, "[ ]");
        this._box = { x: 0, y: 0, w: this.bitmap.width, h: GAINS.h + 2 };
    };

    function Sprite_CleanSneak() {
        this.initialize(...arguments);
    }
    Sprite_CleanSneak.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanSneak.prototype.constructor = Sprite_CleanSneak;
    Sprite_CleanSneak.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 240, 30);
        this.anchor.set(0.5, 0);
        textOut(this.bitmap, "Skradanie  ·  C", 0, 2, 240, 26, "center", { size: 17 });
        const tw = measure("Skradanie  ·  C", 17);
        this._box = { x: 120 - tw / 2 - 6, y: 0, w: tw + 12, h: 30 };
    };
    Sprite_CleanSneak.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene, badge = scene && scene._sneakBadge;
        this.visible = isClean() && !!badge && badge.visible;
        this.x = W() / 2;
        this.y = H() - 44;
    };

    // ---- the top centre: the map's name as one comes in, the dog's stockpile strip, the level banner, the day's greeting, the
    // notices ("Tryb walki" is a pill in the top left corner, under the goal) - one under another, each sliding to its place (their timing is the old parts')
    const TOP = { gap: 4, slide: 0.25, nameSize: 40 };
    function Sprite_CleanTop() {
        this.initialize(...arguments);
    }
    Sprite_CleanTop.prototype = Object.create(Sprite.prototype);
    Sprite_CleanTop.prototype.constructor = Sprite_CleanTop;
    Sprite_CleanTop.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._items = {};
        for (const k of ["name", "dog", "level", "day", "notice"]) {
            const s = new Sprite();
            s.anchor.set(0.5, 0);
            s.visible = false;
            s._key = null;
            this._items[k] = s;
            this.addChild(s);
        }
        this.visible = false;
    };
    // where the stack starts: the top of the screen (the compass is in the top right corner)
    Sprite_CleanTop.prototype.startY = function() {
        return 8;
    };
    Sprite_CleanTop.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene;
        this.visible = isClean() && !!scene;
        if (!this.visible) return;
        const I = this._items;
        this.updateName(scene, I.name);
        this.updateDog(scene, I.dog);
        this.updateLevel(scene, I.level);
        this.updateDay(scene, I.day);
        this.updateNotice(scene, I.notice);
        // the stack: each shown one under the one before
        let y = this.startY();
        const place = (s, h) => {
            s._ty = y;
            s.y = s._placed && Math.abs(s.y - y) > 0.5 ? s.y + (y - s.y) * TOP.slide : y;
            s._placed = true;
            s.x = W() / 2;
            y += h + TOP.gap;
        };
        for (const k of ["name", "dog", "level", "day", "notice"]) if (I[k].visible && I[k].bitmap) place(I[k], I[k]._h || I[k].bitmap.height);
        for (const k in I) if (!I[k].visible) I[k]._placed = false;
    };
    // the dog's stockpile (Dog.js; the old strip is a panel): "Składowisko" and what lies there, icons and counts
    Sprite_CleanTop.prototype.updateDog = function(scene, s) {
        const strip = scene._dogStock, D = T.api("Dog");
        let pile = null;
        try { pile = strip && strip.visible && D && D.stockpile ? D.stockpile() : null; } catch (e) { pile = null; }
        s.visible = !!pile;
        if (!pile) return;
        const stacks = Object.keys(pile.store || {}).filter(k => k[0] === "i" && pile.store[k] > 0).map(k => ({ id: Number(k.slice(1)), n: pile.store[k] }))
            .filter(q => window.$dataItems && $dataItems[q.id]).sort((a, b) => a.id - b.id);
        const key = stacks.map(q => q.id + ":" + q.n).join(",") + "|" + iconsReady();
        if (key === s._key) return;
        s._key = key;
        const per = 12, cell = 54, label = "Składowisko", lw = measure(label, 17) + 14, rows = Math.max(1, Math.ceil(stacks.length / per));
        const cols = Math.min(per, stacks.length), w = lw + Math.max(cols * cell, stacks.length ? 0 : measure("pusto", 15) + 8) + 8, b = new Bitmap(w, 6 + rows * 30);
        textOut(b, label, 0, 3, lw, 26, "left", { size: 17, color: C.accent });
        if (!stacks.length) textOut(b, "pusto", lw, 4, 80, 26, "left", { size: 15, color: C.muted });
        stacks.forEach((q, i) => {
            const x = lw + (i % per) * cell, y = 3 + Math.floor(i / per) * 30;
            drawIcon(b, $dataItems[q.id].iconIndex, x, y + 1, 24);
            textOut(b, String(q.n), x + 26, y, 28, 26, "left", { size: 15 });
        });
        s.bitmap = b;
        s._h = b.height;
        s._box = { w, h: b.height };
    };
    // the map's name: as the old name window shows it (its fade), big, with thin lines either side; "M: pokaż mapę" under it when
    // the map has a minimap and it is hidden
    Sprite_CleanTop.prototype.updateName = function(scene, s) {
        const win = scene._mapNameWindow, name = $gameMap.displayName ? $gameMap.displayName() : "";
        const a = win && name ? (win.contentsOpacity !== undefined ? win.contentsOpacity : 0) / 255 : 0;
        s.visible = a > 0.01;
        if (!s.visible) return;
        s.opacity = Math.round(255 * a);
        const hint = minimapHint(scene), key = name + "|" + hint + "|" + facesReady();
        if (key === s._key) return;
        s._key = key;
        // spaced capitals (the medium face, 4 px apart) with thin copper lines either side - no panel
        const size = 24, sp = 4, caps = name.toLocaleUpperCase("pl"), letters = Array.from(caps);
        const ws = letters.map(ch => (ch === " " ? measure("n", size) : measure(ch, size)));
        const tot = ws.reduce((x, y) => x + y, 0) + sp * Math.max(0, letters.length - 1);
        const w = Math.ceil(tot) + 180, b = new Bitmap(w, hint ? 56 : 40), ctx = b.context;
        let x = (w - tot) / 2;
        letters.forEach((ch, i) => {
            if (ch !== " ") textOut(b, ch, Math.round(x) - 3, 0, ws[i] + 8, 32, "left", { size, ow: 3, outline: "rgba(0,0,0,0.6)", shadow: 0.4, blur: 4 });
            x += ws[i] + sp;
        });
        ctx.save();
        ctx.strokeStyle = "rgba(208,138,90,0.86)";
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
            const x0 = w / 2 + side * (tot / 2 + 14);
            ctx.beginPath(); ctx.moveTo(x0, 16.5); ctx.lineTo(x0 + side * 60, 16.5); ctx.stroke();
        }
        ctx.restore();
        if (hint) spaced(b, hint, w / 2, 34, 18, { size: 12, color: C.muted, align: "center", outline: true, ow: 3 });
        b._baseTexture.update();
        s.bitmap = b;
        s._h = b.height;
        s._box = { w: tot + 160, h: b.height };
    };

    Sprite_CleanTop.prototype.updateLevel = function(scene, s) {
        const lb = scene._levelBanner;
        s.visible = !!lb && lb.opacity > 0 && lb._shown > 0;
        if (!s.visible) return;
        s.opacity = lb.opacity;
        const key = String(lb._shown);
        if (key === s._key) return;
        s._key = key;
        const Cb = T.api("Combat"), sub = Cb ? "+" + (Cb.POINTS_PER_LEVEL || 2) + " punkty atrybutów  ·  menu P → Postać" : "";
        const b = new Bitmap(620, 72);
        textOut(b, "Poziom " + lb._shown + "!", 0, 0, 620, 44, "center", { size: 34, color: C.accent });
        if (sub) textOut(b, sub, 0, 42, 620, 26, "center", { size: 17 });
        s.bitmap = b;
        s._h = 72;
        s._box = { w: 420, h: 72 };
    };
    Sprite_CleanTop.prototype.updateDay = function(scene, s) {
        const db = scene._dayBanner;
        s.visible = !!db && db.visible && db.opacity > 0 && !!db._cleanData;
        if (!s.visible) return;
        s.opacity = db.opacity;
        const d = db._cleanData, key = d.title + "|" + d.text;
        if (key === s._key) return;
        s._key = key;
        const w = Math.max(measure(d.title, 22), d.text ? measure(d.text, 17) : 0) + 60, b = new Bitmap(w, d.text ? 54 : 30);
        textOut(b, d.title, 0, 0, w, 30, "center", { size: 22, color: C.accent });
        if (d.text) textOut(b, d.text, 0, 28, w, 24, "center", { size: 17 });
        s.bitmap = b;
        s._h = b.height;
        s._box = { w: w - 40, h: b.height };
    };
    Sprite_CleanTop.prototype.updateNotice = function(scene, s) {
        const n = scene._topNotice, d = n && n._data;
        s.visible = !!n && n.visible && n.opacity > 0 && !!d;
        if (!s.visible) return;
        s.opacity = n.opacity;
        const key = d.text + "|" + (d.sub || "") + "|" + (d.color || "") + "|" + (d.subColor || "");
        if (key === s._key) return;
        s._key = key;
        const w = Math.max(measure(d.text, 20), d.sub ? measure(d.sub, 17) : 0) + 60, b = new Bitmap(w, d.sub ? 52 : 30);
        textOut(b, d.text, 0, 0, w, 30, "center", { size: 20, color: d.color || C.text });
        if (d.sub) textOut(b, d.sub, 0, 27, w, 24, "center", { size: 17, color: d.subColor || C.text });
        s.bitmap = b;
        s._h = b.height;
        s._box = { w: w - 40, h: b.height };
    };
    // the box of what the stack shows (the fade under the hero)
    Sprite_CleanTop.prototype.hudRect = function() {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const k in this._items) {
            const s = this._items[k];
            if (!s.visible || !s.bitmap || !s._box) continue;
            x0 = Math.min(x0, s.x - s._box.w / 2); x1 = Math.max(x1, s.x + s._box.w / 2);
            y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y + s._box.h);
        }
        return x1 > x0 && this.visible ? new PIXI.Rectangle(x0, y0, x1 - x0, y1 - y0) : new PIXI.Rectangle(0, 0, 0, 0);
    };
    // the minimap's key under the map's name: only where the map has one and it is hidden
    function minimapHint(scene) {
        const m = scene && scene._minimap;
        if (!m || !m._wanted || (window.$gameSystem && $gameSystem._minimapHidden === false)) return "";
        return "M: pokaż mapę";
    }

    // the bottom of the screen is taken: a message, a farm menu (bottom left), the build mode's help, the talk's busts (the corners)
    function bottomCovered(feetOnly) {
        if (!window.$gameMessage) return true;
        if ($gameMessage.isBusy() && !feetOnly) return true;
        if ($gameTemp._farmMenuOpen || ($gameTemp._buildMode && !feetOnly)) return true;
        const scene = SceneManager._scene, busts = scene && scene._talkBusts;
        return !feetOnly && !!(busts && busts.isShown && busts.isShown());
    }

    // ------------------------------------------------------------------
    // Over the hero: the popups ("Chce ci się pić", "Potrzebujesz siekiery") and his own cries as outlined text - no plates, no bubble
    // ------------------------------------------------------------------
    function restylePopup(p) {
        const d = p._data;
        if (!d) return;
        const size = 20, tw = measure(d.text, size), icon = d.iconIndex > 0, w = (icon ? 38 : 0) + tw + 12, b = new Bitmap(w, 38);
        if (icon && !drawIcon(b, d.iconIndex, 2, 3, 32)) return;   // (the sheet still loading: next frame)
        textOut(b, d.text, icon ? 40 : 4, 3, tw + 8, 32, "left", { size, color: d.color && d.color !== "#ffffff" ? d.color : C.text });
        p.bitmap = b;
        p._cleanDone = true;
    }
    function restyleCry(s) {
        if (!s.bitmap || !s._off) return;
        const b = new Bitmap(s.bitmap.width, s.bitmap.height);
        textOut(b, s._cleanText, s._off.ox, s._off.oy, s._w, s._h, "center", { size: 20, color: "#e9f2ff" });
        s.bitmap = b;
        s._cleanKey = s._key;
    }
    function restyleOverHero(scene) {
        const layer = scene._lootLayer;
        if (layer) for (const p of layer.children) if (!p._cleanDone && p._data) restylePopup(p);
        const barks = scene._barks, SB = T.api("SpeechBubbles");
        if (barks && barks._shown && SB) {
            for (const [bark, s] of barks._shown) {
                if (bark.ch !== $gamePlayer || !s.bitmap || s._cleanKey === s._key) continue;
                s._cleanText = bark.text;
                restyleCry(s);
            }
        }
    }

    // ------------------------------------------------------------------
    // The map scene: the parts in the HUD layer; each frame the old parts are hidden (not drawn) in the clean look and shown again
    // in the classic one; the minimap starts hidden in the clean look and stands under the load
    // ------------------------------------------------------------------
    const OLD = ["_survivalHud", "_goalTracker", "_xpBar", "_weaponPlate", "_modeBadge", "_levelBanner", "_gainFeed", "_topNotice", "_dayBanner", "_sneakBadge", "_dogStock"];
    const _createSurvivalHud = Scene_Map.prototype.createSurvivalHud;
    if (!_createSurvivalHud) throw new Error("CleanHUD.js: musi być pod SurvivalHUD.js na liście wtyczek (SurvivalHUD is missing or below)");
    Scene_Map.prototype.createSurvivalHud = function() {
        _createSurvivalHud.call(this);
        this.createCleanHud();
    };
    Scene_Map.prototype.createCleanHud = function() {
        const layer = this._hudLayer;
        if (!layer || this._cleanLayer) return;
        this._cleanShade = new Sprite_CleanShade();
        layer.addChildAt(this._cleanShade, 0);   // (under everything of the HUD)
        this._cleanLayer = new Sprite();
        layer.addChild(this._cleanLayer);
        this._cleanClock = new Sprite_CleanClock();
        this._cleanLoad = new Sprite_CleanLoad();
        this._cleanNeeds = new Sprite_CleanNeeds();
        this._cleanGains = new Sprite_CleanGains();
        this._cleanWeapon = new Sprite_CleanWeapon();
        this._cleanSneak = new Sprite_CleanSneak();
        this._cleanTop = new Sprite_CleanTop();
        for (const s of [this._cleanClock, this._cleanLoad, this._cleanNeeds, this._cleanWeapon, this._cleanGains, this._cleanSneak, this._cleanTop]) {
            this._cleanLayer.addChild(s);
        }
        const db = this._dayBanner;
        if (db && !db._cleanWatched) {   // (the greeting's text, kept as it is shown)
            db._cleanWatched = true;
            const show = db.show;
            db.show = function(data) { this._cleanData = data ? { title: data.title || "", text: data.text || "" } : null; return show.apply(this, arguments); };
        }
    };
    // the parts of the clean look (another plugin's - the compass - adds itself here)
    Scene_Map.prototype.cleanHudParts = function() {
        return [this._cleanClock, this._cleanLoad, this._cleanNeeds, this._cleanGains, this._cleanWeapon, this._cleanSneak, this._cleanTop, this._cleanCompass];
    };
    Scene_Map.prototype.updateCleanHud = function() {
        if (!this._cleanLayer) return;
        const clean = isClean();
        for (const k of OLD) {
            const el = this[k];
            if (!el) continue;
            if (clean) { if (el.renderable) { el.renderable = false; el._cleanHid = true; } }
            else if (el._cleanHid) { el.renderable = true; el._cleanHid = false; }
        }
        const win = this._mapNameWindow;
        if (win) {
            if (clean) { if (win.visible) { win.visible = false; win._cleanHid = true; } }
            else if (win._cleanHid) { win.visible = true; win._cleanHid = false; }
        }
        const set = this._spriteset, breath = set && set._combatLayer && set._combatLayer._breath;
        if (breath) {   // (no bar under the hero: the breath is the fifth bar at the bottom left, in the combat mode)
            if (clean) { if (breath.renderable) { breath.renderable = false; breath._cleanHid = true; } }
            else if (breath._cleanHid) { breath.renderable = true; breath._cleanHid = false; }
        }
        // the top right column: the compass, its label, the load, the torch's gauge (RoomLighting), the minimap (M)
        let y = this._cleanLoad ? this._cleanLoad.bottom() + 2 : 8;
        const torch = set && set._torchGauge;
        if (torch) {
            if (clean) { if (torch._cleanY === undefined) torch._cleanY = torch.y; torch.y = y; y += 36; }
            else if (torch._cleanY !== undefined) { torch.y = torch._cleanY; torch._cleanY = undefined; }
        }
        const mm = this._minimap;
        if (mm) {
            if (clean) {
                if ($gameSystem._minimapHidden === undefined) $gameSystem._minimapHidden = true;   // (the clean look: hidden till M)
                if (mm._cleanY === undefined) mm._cleanY = mm.y;
                mm.y = y;
            } else if (mm._cleanY !== undefined) { mm.y = mm._cleanY; mm._cleanY = undefined; }
        }
        if (clean) restyleOverHero(this);
    };
    const _update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _update.call(this);
        this.updateCleanHud();
    };
    // the fade under the hero: the clean parts too
    const _hudFadeElements = Scene_Map.prototype.hudFadeElements;
    if (_hudFadeElements) {
        Scene_Map.prototype.hudFadeElements = function() {
            const list = _hudFadeElements.call(this);
            return isClean() ? list.concat(this.cleanHudParts().filter(p => !!p)) : list;
        };
    }
    // the map's name window opens as one comes in: in the clean look it is not drawn, the stack shows the name from its fade
    // (SurvivalHUD hides it in the fade list: fine, it is not drawn)

    // ------------------------------------------------------------------
    // For the tests and the other parts: where everything is
    // ------------------------------------------------------------------
    function rectOf(s) {
        if (!s) return null;
        const r = s.ownRect ? s.ownRect() : s.hudRect ? s.hudRect() : s.getBounds();
        return { visible: !!s.visible, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), alpha: +(s.alpha * (s.opacity / 255)).toFixed(3) };
    }
    function debug() {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || !scene._cleanLayer) return null;
        const out = { clean: isClean(), parts: {} };
        for (const k of ["Clock", "Load", "Needs", "Gains", "Weapon", "Sneak", "Top", "Compass"]) out.parts[k.toLowerCase()] = rectOf(scene["_clean" + k]);
        out.corner = rectOf({ visible: true, alpha: 1, opacity: 255, hudRect: cornerRect });   // (the top left corner as one: its fade)
        const nd = scene._cleanNeeds, ck = scene._cleanClock;
        out.bars = nd && nd.visible ? (nd._bars || []).slice() : [];
        out.text = ck && ck._text ? Object.assign({}, ck._text) : null;
        out.shade = scene._cleanShade ? scene._cleanShade.levels() : null;
        out.old = {};
        for (const k of OLD) if (scene[k]) out.old[k.slice(1)] = !!scene[k].renderable;
        out.goal = goalInfo(scene);
        if (out.goal) out.goal = { source: out.goal.source, title: out.goal.title, line: out.goal.line, icon: out.goal.icon, id: out.goal.id };
        const top = scene._cleanTop;
        out.top = top ? Object.keys(top._items).filter(k => top._items[k].visible).map(k => ({ k, y: Math.round(top._items[k].y) })) : [];
        if (scene._minimap) out.minimap = { visible: !!scene._minimap.visible, y: scene._minimap.y, hidden: $gameSystem._minimapHidden };
        return out;
    }

    window.CleanHUD = T.register(PLUGIN, {
        isClean, lookClean, setClean(on) { ConfigManager.uiClean = !!on; return ConfigManager.uiClean; },
        C, textOut, measure, fit, iconBitmap, drawIcon, thinBar, pl, hm, goalInfo, needValues, loadInfo, heroFeet, bottomCovered, debug,
        Sprite_CleanPart, NEED_KEYS, NEED_ICONS,
        // (the graphite look's pieces for the other parts and windows: MenuRing, CleanHUD_Compass)
        face, facesReady, spaced, spacedWidth, roundPath, rpanel, mix, drawClock
    });
})();
