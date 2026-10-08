//=============================================================================
// CleanHUD.js
//=============================================================================
// "Czysty widok" (the user's choice, 2026-10-08: docs/ui_pomysly/POMYSLY.md, idea 4; mock-ups docs/ui_pomysly/pomysl_4_czysty_hud.png
// and pomysl_4_czysty_okno.png, made by tools/ui_pomysly/pomysl4_czysty.py): the map's HUD without panels - outlined text, thin
// bars, a soft shade at the top and bottom edges of the screen so the text reads on any ground.
//   top left      the time and a small arc of the sun, the day's line (part of the day · day · season), the goal (icon, title, hint)
//   top centre    the map's name as one comes in, the notices, the banners
//   top right     the round goal compass (CleanHUD_Compass.js) and its label; under it the load (41 / 120 and the bag), the torch's
//                 gauge, the minimap only on M (hidden by default)
//   bottom left   thin bars: health, stamina, food, water - and the breath in the combat mode (the premia above them)
//   over him      his thoughts and the "you need..." popups as outlined text, no plates, no bubble; no bars under him (the user,
//                 2026-10-08: the breath bar under his feet is not drawn - it is the fifth bar at the bottom left)
//   bottom right  what he gains: text and icons, the older ones fading; the weapon in the combat mode
// No experience bar (the user: "pasek doświadczenia z dołu wywalić"): the level is in the P menu and Postać, a new level still has
// its "Poziom N!" banner at the top.
// The old look (SurvivalHUD, Needs, Survival, Journal's goal window, Minimap, Combat_UI's plates, SpeechBubbles' bubbles over the
// hero) stays as it is: in the clean look its parts keep working (the same data, the same timing, the tests' hooks) and are only
// not drawn (renderable = false) - this plugin draws the same things its own way. Options: "Wygląd: Czysty widok / Klasyczny"
// (ConfigManager.uiClean, saved in config; the clean look by default).
// Load order: after every plugin of the HUD (SurvivalHUD, Survival, Needs, Journal, Minimap, Combat_UI, SpeechBubbles, Dog...).
// CleanHUD_Compass.js and MenuRing.js come right after it.

/*:
 * @target MZ
 * @plugindesc Czysty widok: HUD na mapie bez paneli (tekst z obrysem, cienkie paski, okrągły kompas). W Opcjach: Wygląd - Czysty widok / Klasyczny. v1.1.0
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
 * CleanHUD.js - Czysty widok
 * ============================================================================
 * Interfejs na mapie bez paneli: sam tekst z ciemnym obrysem i lekkie
 * przyciemnienie przy górnej i dolnej krawędzi ekranu (mocniejsze na jasnym
 * tle: śnieg, piasek, błysk burzy).
 *  - Lewy górny róg: godzina z małym łukiem słońca, pora dnia, dzień i pora
 *    roku, a pod nimi bieżący cel (ikona, tytuł, podpowiedź).
 *  - Góra, środek: nazwa miejsca, która gaśnie po wejściu, i komunikaty
 *    (doświadczenie, cele, „Tryb walki”, „Poziom N!”, powitanie dnia).
 *  - Prawy górny róg: okrągły kompas celu (CleanHUD_Compass.js), pod nim
 *    obciążenie plecaka, pochodnia i minimapa (klawisz M; w czystym widoku
 *    domyślnie ukryta).
 *  - Lewy dolny róg: cienkie paski zdrowia, kondycji, sytości i nawodnienia,
 *    a w trybie walki także oddechu. Pod bohaterem nie ma żadnych pasków.
 *  - Myśli bohatera i komunikaty o brakach - tekst z obrysem nad nim.
 *  - Prawy dolny róg: zdobycze (starsze bledną) i broń w trybie walki.
 *  - Bez paska doświadczenia: poziom widać w menu P i w Postaci.
 * Gdy bohater wejdzie pod któryś element, ten robi się prawie przezroczysty
 * (jak w klasycznym wyglądzie).
 * Opcje: „Wygląd” - Czysty widok / Klasyczny (stary wygląd z panelami).
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
        if (this.commandSymbol(index) === LOOK_SYMBOL) return this.getConfigValue(LOOK_SYMBOL) !== false ? "Czysty widok" : "Klasyczny";
        return _statusText.call(this, index);
    };
    const _statusWidth = Window_Options.prototype.statusWidth;
    Window_Options.prototype.statusWidth = function() {
        return Math.max(_statusWidth.call(this), 150);   // ("Czysty widok" is the longest value)
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
    // The palette and the drawing helpers (the mock-ups' uikit.py: text with a dark outline, icons without the RTP frames)
    // ------------------------------------------------------------------
    const C = {
        text: "#f6f2ea", muted: "#d0ccc2", accent: "#ffd23f", outline: "rgba(0,0,0,0.82)",
        health: "#ff6b5e", stamina: "#8fe06a", food: "#ffb84a", water: "#5ab8ff", breath: "#8fe3ff"
    };
    const NEED_KEYS = ["health", "stamina", "food", "water", "breath"];
    const NEED_ICONS = { health: [84, "dark"], stamina: [82, "bare"], food: [390, "plain"], water: [391, "plain"] };
    const BAG_ICON = 370;
    const W = () => Graphics.width, H = () => Graphics.height;
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

    let probe = null;
    function measure(text, size) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontSize = size;
        return Math.ceil(probe.measureTextWidth(String(text)));
    }
    // text with the dark outline and a soft shadow round it (reads on grass, snow, trees). (Bitmap.drawText always strokes the outline
    // fully opaque, so a fainter text is a fainter sprite, not an option here.)
    function textOut(bmp, text, x, y, w, h, align, o) {
        o = o || {};
        const ctx = bmp.context;
        bmp.fontSize = o.size || 18;
        bmp.fontBold = !!o.bold;
        bmp.textColor = o.color || C.text;
        bmp.outlineColor = o.outline || C.outline;
        bmp.outlineWidth = o.ow !== undefined ? o.ow : 4;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0," + (o.shadow !== undefined ? o.shadow : 0.55) + ")";
        ctx.shadowBlur = o.blur !== undefined ? o.blur : 5;
        ctx.shadowOffsetY = 1;
        bmp.drawText(String(text), x, y, w, h, align || "left");
        ctx.restore();
        bmp.fontBold = false;
    }
    // shortened with "…" to fit `max` px
    function fit(text, size, max) {
        text = String(text || "");
        if (measure(text, size) <= max) return text;
        while (text.length > 1 && measure(text + "…", size) > max) text = text.slice(0, -1);
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
    const SHADE = { top: 96, bottom: 84, base: 0.34, bright: 0.34, flash: 0.32, snow: 0.08, max: 0.8 };
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

    // ---- top left: the time, the sun's arc, the day's line, the goal
    const CLOCK = { x: 20, timeY: 6, timeSize: 34, arcX: 112, arcY: 16, arcW: 74, dayY: 50, daySize: 17, goalY: 76, iconX: 14, titleX: 50, titleSize: 19, maxW: 430 };
    function Sprite_CleanClock() {
        this.initialize(...arguments);
    }
    Sprite_CleanClock.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanClock.prototype.constructor = Sprite_CleanClock;
    Sprite_CleanClock.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 520, 134);
        this._mapId = 0;
        this._showClock = true;
    };
    Sprite_CleanClock.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = isClean();
        if (!this.visible || !$gameSystem) return;
        if ($gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._showClock = T.mapFlag("Clock", true, "off"); }
        const hour = T.time.hour(), period = T.time.period(hour), scene = SceneManager._scene;
        // (the goal: a few times a second - the old goal window still works it out every frame for its own text)
        if (!this.goalShown()) { this._goal = null; this._goalT = 0; }
        else if (!(this._goalT-- > 0)) { this._goal = goalInfo(scene); this._goalT = 10; }
        const goal = this._goal;
        const key = [this._showClock ? hm(hour) : "", period.name, T.time.day(), goal ? goal.title + "|" + goal.icon : "", iconsReady()].join("#");
        if (key === this._key) return;
        this._key = key;
        this.redraw(hour, period, goal);
    };
    // the goal hides while a message is up (as the old goal window did)
    Sprite_CleanClock.prototype.goalShown = function() {
        return !$gameMessage.isBusy();
    };
    Sprite_CleanClock.prototype.redraw = function(hour, period, goal) {
        const b = this.bitmap;
        b.clear();
        let right = 0, bottom = 0;
        if (this._showClock) {
            const time = hm(hour);
            textOut(b, time, CLOCK.x, CLOCK.timeY, 120, 44, "left", { size: CLOCK.timeSize });
            this.drawSunArc(b, CLOCK.arcX, CLOCK.arcY, CLOCK.arcW, hour);
            const day = period.name + " · dzień " + T.time.day() + " · " + T.time.seasonName().toLowerCase();
            textOut(b, day, CLOCK.x, CLOCK.dayY, 360, 24, "left", { size: CLOCK.daySize, color: C.muted });
            right = Math.max(CLOCK.arcX + CLOCK.arcW + 8, CLOCK.x + measure(day, CLOCK.daySize) + 4);
            bottom = CLOCK.dayY + 24;
        }
        if (goal) {
            const y = this._showClock ? CLOCK.goalY : 6;
            if (goal.icon > 0) drawIcon(b, goal.icon, CLOCK.iconX, y + 2, 32);
            else this.drawGoalMark(b, CLOCK.iconX + 16, y + 18);
            // (its title only - the user, 2026-10-08: what it is about stays in the journal)
            const title = fit(goal.title, CLOCK.titleSize, CLOCK.maxW);
            textOut(b, title, CLOCK.titleX, y + 6, CLOCK.maxW + 10, 26, "left", { size: CLOCK.titleSize, color: C.accent });
            right = Math.max(right, CLOCK.titleX + measure(title, CLOCK.titleSize) + 4);
            bottom = y + 36;
        }
        this._box = right > 0 ? { x: 8, y: 4, w: right - 4, h: bottom - 2 } : null;
    };
    // no icon of its own: a small yellow diamond
    Sprite_CleanClock.prototype.drawGoalMark = function(b, cx, cy) {
        const ctx = b.context;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.beginPath(); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 9, cy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx, cy + 6); ctx.lineTo(cx - 6, cy); ctx.closePath(); ctx.fill();
        ctx.restore();
        b._baseTexture.update();
    };
    // a flat half-ellipse from sunrise (5) to sunset (20) with the sun on it; at night the moon goes along it (20 -> 5)
    Sprite_CleanClock.prototype.drawSunArc = function(b, x, y, w, hour) {
        const ctx = b.context, r = w / 2, cx = x + r, cy = y + r, ry = r * 0.55;
        ctx.save();
        ctx.lineWidth = 1;
        for (const [dx, dy, col] of [[1, 1, "rgba(0,0,0,0.8)"], [0, 0, "rgba(246,242,234,0.8)"]]) {
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.ellipse(cx + dx, cy + dy - 0.5, r, ry, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - 4 + dx, cy + dy + 0.5); ctx.lineTo(x + w + 4 + dx, cy + dy + 0.5);
            ctx.stroke();
        }
        const night = hour >= 20 || hour < 5;
        const frac = night ? ((hour - 20 + 24) % 24) / 9 : (hour - 5) / 15;
        const a = Math.PI + Math.PI * clamp01(frac), sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * ry;
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath(); ctx.arc(sx, sy, 6.5, 0, Math.PI * 2); ctx.fill();
        if (night) {
            ctx.fillStyle = "#dfe6ff";
            ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(20,24,34,0.95)";
            ctx.beginPath(); ctx.arc(sx + 2.2, sy - 1.5, 4.2, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = C.accent;
            ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff6c8";
            ctx.beginPath(); ctx.arc(sx - 1.5, sy - 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        b._baseTexture.update();
    };

    // ---- top right: the load, "41 / 120" and the bag (amber when heavy, red when full - as the old row)
    function Sprite_CleanLoad() {
        this.initialize(...arguments);
    }
    Sprite_CleanLoad.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanLoad.prototype.constructor = Sprite_CleanLoad;
    Sprite_CleanLoad.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 220, 44);
    };
    Sprite_CleanLoad.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const L = isClean() && $gameSystem ? loadInfo() : null;
        this.visible = !!L;
        if (!L) return;
        const scene = SceneManager._scene, c = scene && scene._cleanCompass;
        this.x = W() - this.bitmap.width;
        this.y = c && c.visible && c.bottom ? c.bottom() - 6 : 0;   // (under the compass and its label)
        const key = L.carried + "/" + L.cap + "/" + iconsReady();
        if (key === this._key) return;
        this._key = key;
        const b = this.bitmap, bw = b.width, text = L.carried + " / " + L.cap;
        b.clear();
        drawIcon(b, BAG_ICON, bw - 58, 8, 32);
        const colour = L.full >= 0.95 ? "#ff7a6a" : L.full >= 0.75 ? "#ffb84a" : C.text;
        textOut(b, text, bw - 66 - 140, 10, 140, 30, "right", { size: 17, color: colour });
        const tw = measure(text, 17);
        this._box = { x: bw - 70 - tw, y: 6, w: tw + 48, h: 36 };
    };
    Sprite_CleanLoad.prototype.bottom = function() {
        const scene = SceneManager._scene, c = scene && scene._cleanCompass, top = c && c.visible && c.bottom ? c.bottom() : 8;
        return this.visible ? this.y + 44 : top;
    };

    // ---- bottom left: thin bars of the four needs (and the premia over them)
    const NEEDS = { x: 18, step: 128, iconY: 60, barX: 36, barY: 75, barW: 80, barH: 5, buffY: 24, height: 110 };
    function Sprite_CleanNeeds() {
        this.initialize(...arguments);
    }
    Sprite_CleanNeeds.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanNeeds.prototype.constructor = Sprite_CleanNeeds;
    Sprite_CleanNeeds.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 600, NEEDS.height);
        this._pulse = 0;
        this._mapId = 0;
        this._show = true;
    };
    Sprite_CleanNeeds.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if ($gameMap && $gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._show = T.mapFlag("Stamina", true, "off"); }
        this.visible = isClean() && this._show && !!$gameSystem && !bottomCovered();
        if (!this.visible) return;
        this.x = 0;
        this.y = H() - NEEDS.height;
        const v = needValues();
        this._pulse = (this._pulse + 1) % 60;
        const low = NEED_KEYS.filter(k => v[k] !== undefined && needLow(k, v[k]));
        const blink = low.length ? (this._pulse < 30 ? "a" : "b") : "-";
        const buffs = this.buffList();
        const key = NEED_KEYS.map(k => (v[k] === undefined ? "x" : Math.round(v[k] * 200))).join(",") + (v.winded ? "w" : "") + "|" + low.join(",") + blink + "|" + buffs.map(b => b.text).join(",") + "|" + iconsReady();
        if (key === this._key) return;
        this._key = key;
        this.redraw(v, low, blink === "a", buffs);
    };
    // the breath's symbol (no icon of its own): three gusts of air in its colour, outlined
    function drawBreathMark(ctx, x, y) {
        ctx.save();
        ctx.lineCap = "round";
        const gust = (lw, col) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.beginPath(); ctx.moveTo(x + 2, y + 6); ctx.lineTo(x + 15, y + 6); ctx.quadraticCurveTo(x + 22, y + 6, x + 20, y + 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 2, y + 12); ctx.lineTo(x + 22, y + 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 2, y + 18); ctx.lineTo(x + 13, y + 18); ctx.quadraticCurveTo(x + 20, y + 18, x + 18, y + 23); ctx.stroke();
        };
        gust(5, "rgba(8,9,11,0.9)");
        gust(2.4, C.breath);
        ctx.restore();
    }
    // the premia (Survival.js: sated, warm, wounded - and TavernLife's) with the hours they have left, and the cold
    Sprite_CleanNeeds.prototype.buffList = function() {
        const S = T.api("Survival"), out = [];
        if (!S || typeof $gameSystem.activeBuffs !== "function") return out;
        for (const b of $gameSystem.activeBuffs()) {
            const def = S.BUFFS && S.BUFFS[b.name];
            if (def) out.push({ icon: def.icon, text: Math.max(1, Math.ceil(b.left)) + " h", bad: !!def.bad });
        }
        if (typeof $gameSystem.isCold === "function" && $gameSystem.isCold()) out.push({ glyph: "cold", text: "Zimno!", colour: "#bfe0ff" });
        return out;
    };
    Sprite_CleanNeeds.prototype.redraw = function(v, low, blinkOn, buffs) {
        const b = this.bitmap, ctx = b.context;
        b.clear();
        let i = 0, right = 0;
        for (const k of NEED_KEYS) {
            if (v[k] === undefined) continue;
            const x = NEEDS.x + i * NEEDS.step, [icon, mode] = NEED_ICONS[k] || [0, "plain"];
            if (low.includes(k)) {   // low: a thin frame of its colour round it, pulsing
                ctx.save();
                ctx.strokeStyle = C[k];
                ctx.globalAlpha = blinkOn ? 0.9 : 0.35;
                ctx.lineWidth = 1;
                ctx.strokeRect(x - 3.5, NEEDS.iconY - 2.5, 121, 38);
                ctx.restore();
            }
            if (k === "breath") drawBreathMark(ctx, x + 4, NEEDS.iconY + 4);
            else drawIcon(b, icon, x, NEEDS.iconY, 32, mode);
            thinBar(ctx, x + NEEDS.barX, NEEDS.barY, NEEDS.barW, NEEDS.barH, v[k], k === "breath" && v.winded ? (blinkOn ? C.health : "#a0443a") : C[k]);
            right = x + 120;
            i++;
        }
        // the premia over the bars: their icon and the hours left; the cold
        let x = NEEDS.x;
        for (const f of buffs) {
            if (f.glyph && window.UIStyle && UIStyle.glyph) UIStyle.glyph(ctx, f.glyph, x + 2, NEEDS.buffY + 2, 20, f.colour);
            else if (f.icon) drawIcon(b, f.icon, x, NEEDS.buffY, 24);
            textOut(b, f.text, x + 28, NEEDS.buffY - 1, 90, 26, "left", { size: 15, color: f.colour || (f.bad ? "#ff9f8f" : C.text) });
            x += 28 + measure(f.text, 15) + 16;
        }
        b._baseTexture.update();
        const top = buffs.length ? NEEDS.buffY - 2 : NEEDS.iconY - 4;
        this._box = right > 0 ? { x: NEEDS.x - 6, y: top, w: Math.max(right, x) - NEEDS.x + 10, h: NEEDS.iconY + 40 - top } : null;
    };

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

    // ---- bottom right: what was gained (SurvivalHUD's list, its plates read as they are), text and icons, the older ones fading
    const GAINS = { right: 18, row: 30, size: 20, bottom: 50, ages: [1, 0.8, 0.6, 0.45, 0.36, 0.3, 0.26] };
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
    Sprite_CleanGains.prototype.rowBitmap = function(text, icon, colour) {
        const tw = measure(text, GAINS.size), w = tw + 52, b = new Bitmap(w, 36);
        if (icon > 0) drawIcon(b, icon, 4, 2, 32);
        textOut(b, text, 44, 2, tw + 6, 32, "left", { size: GAINS.size, color: colour || C.text });
        return b;
    };
    Sprite_CleanGains.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene, feed = scene && scene._gainFeed;
        this.visible = isClean() && !!feed && !bottomCovered();
        const plates = feed ? feed.children.slice() : [];
        for (const [p, row] of this._rows) if (!plates.includes(p)) { this.removeChild(row); this._rows.delete(p); }
        if (!this.visible) return;
        let y = H() - GAINS.bottom - (scene._cleanWeapon && scene._cleanWeapon.visible ? 32 : 0);
        for (let i = plates.length - 1, rank = 0; i >= 0; i--, rank++) {
            const p = plates[i], text = typeof p.text === "function" ? p.text() : (p._data && p._data.text) || "";
            let row = this._rows.get(p);
            const key = text + "|" + iconsReady();
            if (!row) { row = new Sprite(); row.anchor.set(1, 0); this.addChild(row); this._rows.set(p, row); }
            if (row._key !== key) { row._key = key; row.bitmap = this.rowBitmap(text, p._data ? p._data.iconIndex : 0, p._data && p._data.color !== "#ffffff" ? p._data.color : C.text); }
            row.x = W() - GAINS.right + (p._slideX || 0);
            row.y = row._placed && Math.abs(row.y - y) > 0.5 ? row.y + (y - row.y) * 0.25 : y;
            row._placed = true;
            row.opacity = Math.round((p.opacity === undefined ? 255 : p.opacity) * (GAINS.ages[rank] || 0.25));
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

    // ---- the combat mode: the weapon in hand at the bottom right (text and icon), the sneaking at the bottom centre
    function Sprite_CleanWeapon() {
        this.initialize(...arguments);
    }
    Sprite_CleanWeapon.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanWeapon.prototype.constructor = Sprite_CleanWeapon;
    Sprite_CleanWeapon.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 320, 36);
        this.anchor.set(1, 0);
    };
    Sprite_CleanWeapon.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene, plate = scene && scene._weaponPlate, Cb = T.api("Combat");
        this.visible = isClean() && !!plate && plate.visible && !!Cb && !bottomCovered();
        if (!this.visible) return;
        this.x = W() - GAINS.right;
        this.y = H() - GAINS.bottom;
        const h = Cb.hand ? Cb.hand() : null;
        const key = h + "|" + iconsReady();
        if (!h || key === this._key) return;
        this._key = key;
        const P = T.api("Combat_parts"), melee = h[0] === "m" ? (Cb.MELEE || {})[Number(h.slice(1))] : null;
        const name = melee ? melee.name : "Łuk / proca", icon = P && P.fight && P.fight.handIcon ? P.fight.handIcon(h) : 0;
        const b = this.bitmap, bw = b.width, keys = "[ ]", kw = measure(keys, 16), nw = measure(name, 18);
        b.clear();
        textOut(b, keys, bw - kw - 4, 4, kw + 4, 28, "left", { size: 16, color: C.muted });
        textOut(b, name, bw - kw - 14 - nw, 4, nw + 4, 28, "left", { size: 18 });
        if (icon) drawIcon(b, icon, bw - kw - 14 - nw - 38, 2, 32);
        this._box = { x: bw - kw - nw - 56, y: 0, w: kw + nw + 56, h: 36 };
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

    // ---- the top centre, under the compass: the map's name as one comes in, the "Tryb walki" label, the dog's stockpile strip, the
    // level banner, the day's greeting, the notices - one under another, each sliding to its place (their timing is the old parts')
    const TOP = { gap: 4, slide: 0.25, nameSize: 40 };
    function Sprite_CleanTop() {
        this.initialize(...arguments);
    }
    Sprite_CleanTop.prototype = Object.create(Sprite.prototype);
    Sprite_CleanTop.prototype.constructor = Sprite_CleanTop;
    Sprite_CleanTop.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._items = {};
        for (const k of ["name", "mode", "dog", "level", "day", "notice"]) {
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
        this.updateMode(scene, I.mode);
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
        for (const k of ["name", "mode", "dog", "level", "day", "notice"]) if (I[k].visible && I[k].bitmap) place(I[k], I[k]._h || I[k].bitmap.height);
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
        s.opacity = Math.round(235 * a);
        const hint = minimapHint(scene), key = name + "|" + hint;
        if (key === s._key) return;
        s._key = key;
        const size = TOP.nameSize, tw = measure(name, size), w = Math.max(tw + 220, 360), b = new Bitmap(w, hint ? 66 : 50), ctx = b.context;
        textOut(b, name, 0, 0, w, 48, "center", { size });
        ctx.save();
        for (const side of [-1, 1]) {
            for (let k = 0; k < 90; k++) {
                const x = w / 2 + side * (tw / 2 + 16 + k);
                ctx.fillStyle = "rgba(0,0,0," + (0.5 * (1 - k / 90)).toFixed(3) + ")";
                ctx.fillRect(x, 28, 1, 1);
                ctx.fillStyle = "rgba(246,242,234," + (0.7 * (1 - k / 90)).toFixed(3) + ")";
                ctx.fillRect(x, 27, 1, 1);
            }
        }
        ctx.restore();
        if (hint) textOut(b, hint, 0, 46, w, 18, "center", { size: 13, color: C.muted, ow: 3 });
        b._baseTexture.update();
        s.bitmap = b;
        s._h = b.height;
        s._box = { w: tw + 40, h: b.height };
    };
    Sprite_CleanTop.prototype.updateMode = function(scene, s) {
        const badge = scene._modeBadge;
        s.visible = !!badge && badge.visible;
        if (!s.visible) return;
        s.opacity = Math.round(150 + 105 * (badge.opacity - 75) / 180);   // (its beat, but never as faint: text alone has no plate to hold it)
        if (!s.bitmap) {
            const b = new Bitmap(240, 28);
            textOut(b, "Tryb walki", 0, 0, 240, 28, "center", { size: 18, color: "#ffb07f" });
            s.bitmap = b;
            s._h = 28;
            s._box = { w: measure("Tryb walki", 18) + 12, h: 28 };
        }
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
        const r = s.hudRect ? s.hudRect() : s.getBounds();
        return { visible: !!s.visible, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), alpha: +(s.alpha * (s.opacity / 255)).toFixed(3) };
    }
    function debug() {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || !scene._cleanLayer) return null;
        const out = { clean: isClean(), parts: {} };
        for (const k of ["Clock", "Load", "Needs", "Gains", "Weapon", "Sneak", "Top", "Compass"]) out.parts[k.toLowerCase()] = rectOf(scene["_clean" + k]);
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
        Sprite_CleanPart, NEED_KEYS, NEED_ICONS
    });
})();
