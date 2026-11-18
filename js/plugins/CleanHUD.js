//=============================================================================
// CleanHUD.js
//=============================================================================
// "Czysty widok" (the user's choice, 2026-10-08: docs/ui_pomysly/POMYSLY.md, idea 4; mock-ups docs/ui_pomysly/pomysl_4_czysty_hud.png
// and pomysl_4_czysty_okno.png, made by tools/ui_pomysly/pomysl4_czysty.py): the map's HUD without panels - outlined text, thin
// bars, a soft shade at the top and bottom edges of the screen so the text reads on any ground.
//   top left      (2026-10-23) the goal followed in the corner (label, icon, title, the step, what it needs with the counts now);
//                 under it the needs as thin level bars one under another on a plate as wide as the goal's (health, stamina, food,
//                 water - the breath a fifth one in the combat mode), with their icons and numbers; under them "Tryb walki", the premia
//   top centre    the notices, the banners
//   bottom left   the map's name as one comes in ("Kinowy": the place's words, the name and a gold line as one ready picture -
//                 js/teksty/miejsca.txt, img/nazwy_map), shown whole and faded out
//   top right     a round clock with hands and the sun right beside the round goal compass (CleanHUD_Compass.js), both of one size;
//                 the compass's label under it, the day's line under them, the torch's gauge, the minimap only on M (hidden by
//                 default); the load (41 / 120 and the bag) is hidden for now (SHOW_LOAD)
//   bottom left   empty
//   over him      his thoughts and the "you need..." popups as outlined text, no plates, no bubble; no bars under him (the user,
//                 2026-10-08: the breath bar under his feet is not drawn - it is the fifth bar of the needs' plate)
//   bottom right  what he gains: text and icons, the older ones fading; the weapon in the combat mode
// No experience bar (the user: "pasek doświadczenia z dołu wywalić"): the level is in the P menu and Postać, a new level still has
// its "Poziom N!" banner at the top.
// The old HUD (SurvivalHUD, Needs, Survival, Journal's goal window, Minimap, Combat_UI's plates, SpeechBubbles' bubbles over the
// hero) keeps working (the same data, the same timing, the tests' hooks) and is only not drawn (renderable = false) - this plugin
// draws the same things its own way. One look (2026-10-28, docs/UI_JEDEN_WYGLAD.md): the colours are UITheme.js's palette
// (UIStyle.C - CleanHUD.C is that object); the option "Wygląd" (Grafit / Klasyczny) is gone. The old parts are drawn again only
// for a test (ConfigManager.uiClean = false - not an option, not saved) or on a map with the note <CleanHud:off>.
// Load order: after every plugin of the HUD (SurvivalHUD, Survival, Needs, Journal, Minimap, Combat_UI, SpeechBubbles, Dog...).
// CleanHUD_Compass.js and MenuRing.js come right after it.

/*:
 * @target MZ
 * @plugindesc HUD na mapie w jednym wyglądzie gry (paleta UITheme.js): zegar, poziome paski potrzeb, cel, okrągły kompas, nazwa miejsca, zdobycze. v2.0.0
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
 * CleanHUD.js - HUD na mapie (czysty widok)
 * ============================================================================
 * Interfejs na mapie bez ciężkich paneli: tekst z ciemnym obrysem, ciemne
 * pigułki i lekkie przyciemnienie przy górnej i dolnej krawędzi ekranu
 * (mocniejsze na jasnym tle: śnieg, piasek, błysk burzy). Kolory z jednej
 * palety gry (UITheme.js, UIStyle.C): czerń, jasnożółty akcent, jasny tekst.
 *  - Lewy górny róg: śledzony cel lub zadanie (ikona, tytuł, bieżący krok
 *    i potrzebne rzeczy z ilościami „mam/potrzeba”), pod nim okno z poziomymi
 *    paskami potrzeb (życie, kondycja, sytość, nawodnienie; w trybie walki
 *    oddech jako piąty pasek) z ikonkami i liczbami, a pod nim plakietka
 *    „Tryb walki” i premie. Bez celu paski stoją w samym rogu. Niska
 *    wartość: pasek czerwony, miga.
 *  - Lewy dolny róg: nazwa miejsca po wejściu (podpis, nazwa i złota kreska
 *    jako jeden gotowy obrazek z img/nazwy_map - teksty w js/teksty/miejsca.txt;
 *    we wnętrzach mniejsza, w podziemiach „Piętro N” i nazwa pasma).
 *  - Góra, środek: komunikaty (doświadczenie, cele, „Poziom N!”, powitanie dnia).
 *    Notatka mapy <NazwaMapy:wnetrze> / <NazwaMapy:miejsce> - mała albo
 *    pełna nazwa mimo zestawu kafli; <NazwaMapy:off> - bez nazwy.
 *  - Prawy górny róg: okrągły zegar ze wskazówkami i słońcem tuż obok
 *    okrągłego kompasu celu (CleanHUD_Compass.js), oba tej samej wielkości;
 *    pod kompasem jego podpis, pod nimi pora dnia, dzień i pora roku, dalej
 *    pochodnia i minimapa (klawisz M; w czystym widoku domyślnie ukryta).
 *    Obciążenie plecaka na razie ukryte.
 *  - Lewy dolny róg: pusty. Pod bohaterem nie ma żadnych pasków.
 *  - Myśli bohatera i komunikaty o brakach - tekst z obrysem nad nim.
 *  - Prawy dolny róg: zdobycze (starsze bledną) i broń w trybie walki.
 *  - Bez paska doświadczenia: poziom widać w menu P i w Postaci.
 * Gdy bohater wejdzie pod któryś element, ten robi się prawie przezroczysty.
 * Notatka mapy <CleanHud:off> - na tej mapie stare części HUD-u (z paskami
 * pod zegarem). Skrypt (testy): CleanHUD.isClean(), CleanHUD.setClean(false)
 * - stare części na chwilę, nie zapisuje się w ustawieniach.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("CleanHUD.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "CleanHUD";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)

    // ------------------------------------------------------------------
    // One look (2026-10-28): no option any more - an old config's "uiClean" (Grafit / Klasyczny) is not read, every game starts with
    // this HUD. ConfigManager.uiClean = false is left for the tests only (the old parts drawn again; never written to the config).
    // ------------------------------------------------------------------
    ConfigManager.uiClean = true;
    const lookClean = () => ConfigManager.uiClean !== false;
    // this HUD on the map now: not switched off for a test, and the map does not ask for the old parts (<CleanHud:off>)
    function isClean() {
        if (!lookClean()) return false;
        return !(window.$dataMap && T.mapFlag("CleanHud", true, "off") === false);
    }

    // ------------------------------------------------------------------
    // The palette and the drawing helpers: the game's one palette (UITheme.js, UIStyle.C - black, the bright yellow accent, light
    // text, grey lines, the needs' colours); see-through panels rounded 8-12 px with one thin line (C.glass), spaced small capitals as
    // labels, text with a dark outline where it stands on the map alone (the HUD's shapes since 2026-10-08).
    // ------------------------------------------------------------------
    const US = window.UIStyle;
    if (!US || !US.C) throw new Error("CleanHUD.js: brak UITheme.js (paleta UIStyle.C) - musi być wyżej na liście wtyczek (UITheme is missing or below)");
    const C = US.C;
    const NEED_KEYS = ["health", "stamina", "food", "water", "breath"];
    const NEED_ICONS = { health: [84, "dark"], stamina: [82, "bare"], food: [390, "plain"], water: [391, "plain"] };
    const BAG_ICON = 370;
    const W = () => Graphics.width, H = () => Graphics.height;
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

    // the HUD's faces (fonts/: Alegreya Sans Regular and Bold, Alegreya Sans SC for the spaced small capitals - OFL, the
    // Alegreya Sans project like the Medium the game already uses): loaded once without FontManager (a missing file must not stop the
    // game); a part drawn before they are ready draws again (its key has facesReady()). The map's name (below): Alegreya
    // SC Bold (OFL, fonts/ - the game's FontManager does not load it under a name of its own: TawernaUI's "QB Caps" is the same file)
    const FACES = { regular: ["TwAlegreyaSansReg", "AlegreyaSans-Regular.ttf"], bold: ["TwAlegreyaSansBold", "AlegreyaSans-Bold.ttf"], sc: ["TwAlegreyaSansSC", "AlegreyaSansSC-Medium.ttf"],
        caps: ["TwAlegreyaSCBold", "AlegreyaSC-Bold.ttf"] };
    const faceState = {};
    function loadFaces() {
        for (const k in FACES) {
            if (faceState[k]) continue;
            faceState[k] = "loading";
            try {
                const f = new FontFace(FACES[k][0], "url(fonts/" + FACES[k][1] + ")", FACES[k][2] || {});
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
    // a rounded rectangle's path (UITheme.js)
    const roundPath = US.roundPath;
    // a HUD panel: a soft shadow, the see-through fill, one thin line (the mock-ups' rpanel)
    function rpanel(ctx, x, y, w, h, r, o) {
        o = o || {};
        ctx.save();
        if (o.shadow !== 0) {
            ctx.fillStyle = "rgba(0,0,0," + (o.shadow === undefined ? 0.16 : o.shadow) + ")";
            roundPath(ctx, x + 1, y + 3, w, h + 1, r);
            ctx.fill();
        }
        if (o.fill !== null) {
            ctx.fillStyle = o.fill || C.glass;
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
    // the needs' own icons (2026-11-18, the player: "ikony niech zostaną profesjonalnie, szczegółowo zrobione w PixelLab"):
    // img/system/Potrzeby.png - 32 x 32 each: life, stamina, food, water, breath (tools/potrzeby/zrob_potrzeby.py); the HUD's row and
    // the menu's Postać draw them; until the sheet is loaded the IconSet's old ones (NEED_ICONS)
    const NEED_AT = { health: 0, stamina: 1, food: 2, water: 3, breath: 4 };
    const needSheet = () => ImageManager.loadSystem("Potrzeby");
    const _bootSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {   // (loaded with the game's own system pictures: ready before the first map)
        _bootSystemImages.call(this);
        needSheet();
    };
    function drawNeed(bmp, key, x, y, size) {
        const sh = needSheet(), s = size || 32, at = NEED_AT[key];
        if (at === undefined) return false;
        if (sh.isReady() && !(sh.isError && sh.isError())) {
            bmp.context.imageSmoothingEnabled = s < 32;
            bmp.blt(sh, at * 32, 0, 32, 32, Math.round(x), Math.round(y), s, s);
            bmp.context.imageSmoothingEnabled = false;
            return true;
        }
        const old = NEED_ICONS[key];
        return old ? drawIcon(bmp, old[0], x, y, s, old[1]) : false;
    }
    const iconsReady = () => ImageManager.loadSystem("IconSet").isReady() && needSheet().isReady();

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
    const SHADE = { top: 96, bottom: 84, base: 0.2, bright: 0.3, flash: 0.32, snow: 0.08, max: 0.75 };   // (lighter: the dark panels hold their own text)
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

    // ---- the layout (the user, 2026-10-23: "okno z celem w lewo u góry w kącie, ładnie; zegar tuż przy kompasie po prawej stronie
    // (niech obydwa są tej samej wielkości), a okno z paskami stanu gracza pod oknem celu"):
    //   top left    (2026-10-23, the user: "zmieniamy tylko okno celu z oknem pasków", "wyłączyć u nich ramki i tła, ale żeby
    //               zawartość była dobrze widoczna") the needs' bars in the corner - health, stamina, food, water, the breath in the
    //               combat mode - as wide as the goal (Sprite_CleanNeeds), the pills ("Tryb walki", the premia) under them; under all
    //               that the goal followed (Sprite_CleanGoal). No plates behind the two: the words and the icons have a dark outline and
    //               a shadow, the bars their own dark tracks. The two fade as one.
    //   top right   the round clock with hands (the sun inside it at the hour of a 24 h day, noon at the top - the moon at night) right
    //               beside the compass, both of one size in one line (CleanHUD_Compass.js: the compass in the corner, its label under it);
    //               the day's line ("Południe · dzień 40 · lato") under them, right-aligned; the load (hidden for now), the torch's
    //               gauge and the minimap under that.
    // EDGE: the HUD's margin from the screen's edges (the compass's too). CLK.r: the compass's DIAL.R - one size.
    const EDGE = 12;
    const CLK = { r: 44, gap: 10 };
    // the needs' numbers (the user, 2026-11-17: "zamiast pasków sytości, wody itd. niech będą tylko wartości procentowe - to samo dla
    // elementów na ekranie podczas gry"): one row in the corner, each need its icon and its percent side by side - step px apart
    const NUMS = { step: 76, icon: 22, gap: 5, size: 18, h: 26, pad: 4 };
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

    // the left column fades as one (the goal, the bars and the pills): the box of each is the box of both
    function columnRect() {
        const scene = SceneManager._scene;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of scene ? [scene._cleanGoal, scene._cleanNeeds] : []) {
            if (!p || !p.visible || !p._box) continue;
            const r = Sprite_CleanPart.prototype.hudRect.call(p);
            if (!(r.width > 0)) continue;
            x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height);
        }
        return x1 > x0 ? new PIXI.Rectangle(x0, y0, x1 - x0, y1 - y0) : new PIXI.Rectangle(0, 0, 0, 0);
    }

    // ---- top right: the clock beside the compass and the day's line under them
    function Sprite_CleanClock() {
        this.initialize(...arguments);
    }
    Sprite_CleanClock.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanClock.prototype.constructor = Sprite_CleanClock;
    Sprite_CleanClock.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 460, 200);
        this._mapId = 0;
        this._showClock = true;
        this._layout = null;
    };
    Sprite_CleanClock.prototype.ownRect = Sprite_CleanPart.prototype.hudRect;
    // where it goes (on the screen): left of the compass, its middle on the compass's line (no compass on this map: in the corner);
    // the day's line right under the two - under the compass's label while it has one (a long label reaches under the clock)
    Sprite_CleanClock.prototype.layout = function() {
        const scene = SceneManager._scene, cmp = scene && scene._cleanCompass, R = CLK.r, on = !!(cmp && cmp.visible);
        const cx = on ? cmp.x - R - CLK.gap - R : W() - EDGE - R, cy = on ? cmp.y : EDGE + R;
        const label = on && cmp._label && cmp._label.visible && cmp.bottom;
        const dayY = label ? cmp.bottom() + 2 : cy + R + 8;
        return { cx: Math.round(cx), cy: Math.round(cy), dayY: Math.round(dayY) };
    };
    Sprite_CleanClock.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = isClean();
        if (!this.visible || !$gameSystem) return;
        if ($gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._showClock = T.mapFlag("Clock", true, "off"); }
        this.x = W() - this.bitmap.width;
        this.y = 0;
        const hour = T.time.hour(), L = this._layout = this.layout();
        const day = this.goalShown() && this._showClock ? dayLine(hour) : "";
        // (the hands move every game minute; the sun's place with them)
        const key = [this._showClock ? Math.floor(hour * 60) : "", day, L.cx, L.cy, L.dayY, W(), iconsReady(), facesReady()].join("#");
        if (key === this._key) return;
        this._key = key;
        this.redraw(hour, day, L);
    };
    // the day's line hides while a message is up (as the old goal window did)
    Sprite_CleanClock.prototype.goalShown = function() {
        return !$gameMessage.isBusy();
    };
    Sprite_CleanClock.prototype.redraw = function(hour, day, L) {
        const b = this.bitmap, ctx = b.context, clock = this._showClock, ox = this.x, R = CLK.r;
        b.clear();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        const grow = (a, c, d, e) => { x0 = Math.min(x0, a); y0 = Math.min(y0, c); x1 = Math.max(x1, d); y1 = Math.max(y1, e); };
        if (clock) {
            drawClock(ctx, L.cx - ox, L.cy, R, hour);
            grow(L.cx - ox - R - 2, L.cy - R - 2, L.cx - ox + R + 3, L.cy + R + 4);
        }
        let dayX = 0;
        if (day) {   // (right-aligned to the HUD's edge, under the clock and the compass)
            const tw = measure(day, GOAL.lineSize), right = b.width - EDGE;
            textOut(b, day, right - tw - 8, L.dayY, tw + 10, 22, "left", { size: GOAL.lineSize, color: GOAL.line, ow: 3, outline: "rgba(0,0,0,0.6)", shadow: 0.4, blur: 4 });
            grow(right - tw - 8, L.dayY, right + 2, L.dayY + 22);
            dayX = ox + right - tw - 8;
        }
        b._baseTexture.update();
        // (the tests read what is drawn: the day's line, the clock's middle and size)
        this._text = { x: Math.round(dayX), y: L.dayY, day, goal: false, clock: clock ? { x: L.cx, y: L.cy, r: R } : null };
        this._box = x1 > x0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
    };
    // where the right column goes on under it (the load, the torch's gauge, the minimap)
    Sprite_CleanClock.prototype.bottom = function() {
        const L = this._layout || this.layout(), scene = SceneManager._scene, cmp = scene && scene._cleanCompass;
        const under = cmp && cmp.visible && cmp.bottom ? cmp.bottom() : 8;
        if (!this.visible) return under;
        return this._text && this._text.day ? Math.max(under, L.dayY + 22) : this._showClock ? Math.max(under, L.cy + CLK.r + 4) : under;
    };
    // no icon of its own: a small yellow diamond
    function drawGoalMark(b, cx, cy) {
        const ctx = b.context;
        ctx.save();
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 7, cy); ctx.closePath(); ctx.fill();
        ctx.restore();
        b._baseTexture.update();
    }
    // the clock: a dark face with a dark yellow ring inside, 12 dots (the four quarters bigger, light), the sun inside on a 24 h day
    // (noon at the top; the moon there at night), the hour hand in the text's colour, the yellow minute hand, a yellow hub
    function drawClock(ctx, cx, cy, r, hour) {
        const dot = (x, y, rr, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); };
        const at = (rr, deg) => [cx + Math.sin(deg * Math.PI / 180) * rr, cy - Math.cos(deg * Math.PI / 180) * rr];
        ctx.save();
        dot(cx, cy, r + 1, "rgba(8,9,11,0.67)");
        dot(cx, cy, r, US.rgba(C.cell, 0.94));
        ctx.lineWidth = 1;
        ctx.strokeStyle = C.line;
        ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = C.accentDark;
        ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 12; k++) {
            const [x, y] = at(r - 8, k * 30);
            if (k % 3 === 0) dot(x, y, 1.4, C.text);
            else dot(x, y, 0.8, C.muted);
        }
        const [sx, sy] = at(r * 0.5, ((((hour - 12) % 24) + 24) % 24) * 15), sr = Math.max(2.5, r * 0.11);
        if (T.time.isNight(hour)) {   // the moon: pale, a bite of the face taken out of it
            dot(sx, sy, sr, "#dfe6ff");
            dot(sx + sr * 0.45, sy - sr * 0.3, sr * 0.8, C.cell);
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

    // ---- top right, under the compass and its label: the load - "41 / 120" and the bag (yellow when heavy, red when full)
    // SHOW_LOAD: hidden for now (the user, 2026-10-23: "udźwig można usunąć z ekranu na razie") - true brings it back; the load itself
    // works as before (Survival.js) and the P menu's Plecak still shows it
    const SHOW_LOAD = false;
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
        const L = SHOW_LOAD && isClean() && $gameSystem ? loadInfo() : null;
        this.visible = !!L;
        if (!L) return;
        const scene = SceneManager._scene, ck = scene && scene._cleanClock;
        this.x = W() - EDGE + 6 - this.bitmap.width;
        this.y = (ck && ck.bottom ? ck.bottom() : 136) + 2;   // (under the clock, the compass and the day's line)
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
        const scene = SceneManager._scene, ck = scene && scene._cleanClock, top = ck && ck.bottom ? ck.bottom() : 136;
        return this.visible ? this.y + 40 : top;
    };

    // ---- top left, in the corner (the user, 2026-10-23: first "czy Cel można dać na prawo pod kompasem?", then "okno z celem w lewo
    // u góry w kącie, ładnie"): the goal followed, "widzieć nie tylko nazwę zadania, ale też potrzebne i aktualne składniki". On a
    // dark plate: its label (CEL, WĄTEK, MIASTECZKO, ZLECENIE...), the icon and the title, the step / the line under it, then what it
    // needs with the counts as they are now ("Gałąź 2/5": a done row green with a tick, a missing one yellow), "+N" past the rows, where
    // it is made, a bar for a goal that counts (the debt). All of it from Journal.tracked() (its sources' needs / sub, Journal.goalNeeds).
    const GBOX = { pad: 10, minW: 236, maxW: 340, rows: 5, row: 24, titleSize: 17, subSize: 14, rowSize: 15, ok: "#9fdc8a", lack: "#f2c25a", list: 8, listRow: 22 };
    function Sprite_CleanGoal() {
        this.initialize(...arguments);
    }
    Sprite_CleanGoal.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanGoal.prototype.constructor = Sprite_CleanGoal;
    Sprite_CleanGoal.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, GBOX.maxW + 4, 440);
        this._goal = null;
        this._t = 0;
        this._drawn = null;
    };
    Sprite_CleanGoal.prototype.update = function() {
        Sprite.prototype.update.call(this);
        // (hidden while a message is up, as the old goal window; the goal a few times a second - the counts follow what he picks up)
        const on = isClean() && !!$gameSystem && !$gameMessage.isBusy();
        if (!on) { this.visible = false; this._goal = null; this._t = 0; return; }
        if (!(this._t-- > 0)) { this._goal = goalInfo(SceneManager._scene); this._t = 10; }
        const g = this._goal;
        this.visible = !!g;
        if (!g) return;
        const nd = SceneManager._scene && SceneManager._scene._cleanNeeds, nb = nd && nd.fullBottom ? nd.fullBottom() : 0;
        this.x = EDGE;
        this.y = nb > 0 ? nb + GOAL.gap : EDGE;
        const key = [g.label, g.title, g.icon, g.sub || "", g.line || "", g.at || "", g.atOk, g.count ? g.count.have + "/" + g.count.need : "",
            (g.needs || []).map(n => n.icon + n.name + n.have + "/" + n.need).join(","), (g.list || []).map(l => l.name + (l.done ? "+" : "-")).join(","),
            iconsReady(), facesReady()].join("#");
        if (key === this._key) return;
        this._key = key;
        this.redraw(g);
    };
    // the left column: the goal and the bars under it fade as one
    Sprite_CleanGoal.prototype.ownRect = Sprite_CleanPart.prototype.hudRect;
    Sprite_CleanGoal.prototype.hudRect = function() {
        return this.visible ? columnRect() : new PIXI.Rectangle(0, 0, 0, 0);
    };
    // the goal's bottom edge on the screen (nothing under it now: the bars are above it)
    Sprite_CleanGoal.prototype.bottom = function() {
        return this.visible && this._box ? this.y + this._box.h : 0;
    };
    // a text in up to `lines` lines of `max` px (the last one shortened with "…")
    function wrapLines(text, size, max, lines) {
        const words = String(text || "").split(/\s+/).filter(Boolean), out = [];
        let cur = "";
        for (let i = 0; i < words.length; i++) {
            const t = cur ? cur + " " + words[i] : words[i];
            if (measure(t, size) <= max || !cur) { cur = t; continue; }
            out.push(cur);
            cur = words[i];
            if (out.length === lines - 1) { cur = words.slice(i).join(" "); break; }
        }
        if (cur) out.push(cur);
        return out.slice(0, lines).map((l, i) => (i === lines - 1 ? fit(l, size, max) : l));
    }
    Sprite_CleanGoal.prototype.redraw = function(g) {
        const b = this.bitmap, ctx = b.context, P = GBOX.pad, S = GBOX;
        const needs = (g.needs || []).filter(n => n && n.name && n.need > 0);
        const rows = needs.slice(0, needs.length > S.rows ? S.rows - 1 : S.rows), more = needs.length - rows.length;
        // (2026-10-24, the user: "jak są questy typu roznieś 4 chleby, to niech w celu będzie wylistowane: chleb do tej osoby i czy
        // oddany - wszystkie cztery widoczne") a step with several people or places: each one a row, a tick when done, a ring when not
        const list = (g.list || []).filter(l => l && l.name).slice(0, S.list);
        const label = String(g.label || "Cel"), cnt = g.count && g.count.need > 0 ? g.count : null;
        const sub = g.sub || (!needs.length && !cnt ? g.line || "" : "");
        const num = n => Math.min(n.have, n.need) + "/" + n.need;
        const cntText = cnt ? Math.min(cnt.have, cnt.need) + " / " + cnt.need + (cnt.unit ? " " + cnt.unit : "") : "";
        // the width: what it holds, within minW..maxW
        let want = Math.max(spacedWidth(label, 12), 30 + measure(g.title, S.titleSize), cnt ? measure(cntText, S.rowSize, "bold") + 40 : 0, g.at ? measure(g.at, S.subSize) : 0);
        for (const n of rows) want = Math.max(want, 26 + measure(n.name, S.rowSize) + 16 + 16 + measure(num(n), S.rowSize, "bold"));
        for (const l of list) want = Math.max(want, 26 + measure(l.name, S.rowSize) + 6);
        if (sub) want = Math.max(want, Math.min(measure(sub, S.subSize), S.maxW));
        const w = Math.round(Math.max(S.minW, Math.min(S.maxW, want + P * 2))), iw = w - P * 2;
        const subLines = sub ? wrapLines(sub, S.subSize, iw, 2) : [];
        const h = P - 2 + 16 + 28 + subLines.length * 18 + (list.length ? 4 + list.length * S.listRow : 0) + (rows.length ? 4 + rows.length * S.row : 0) + (more ? 18 : 0) + (g.at && needs.length ? 20 : 0) + (cnt ? 30 : 0) + P;
        const x0 = 0;
        b.clear();   // (no plate behind it: outlined words, the user 2026-10-23)
        let y = P - 2;
        spaced(b, label, x0 + P, y, 16, { size: 12, outline: true, ow: 3 });
        y += 16;
        if (g.icon > 0) drawIcon(b, g.icon, x0 + P - 2, y + 2, 24);
        else drawGoalMark(b, x0 + P + 10, y + 14);
        const title = fit(g.title, S.titleSize, iw - 30);
        textOut(b, title, x0 + P + 30, y, iw - 26, 28, "left", { size: S.titleSize });
        y += 28;
        for (const l of subLines) { textOut(b, l, x0 + P, y, iw + 4, 18, "left", { size: S.subSize, color: GOAL.line, ow: 3 }); y += 18; }
        if (list.length) y += 4;
        for (const l of list) {
            if (l.done) goalTick(ctx, x0 + P + 3, y + S.listRow / 2, S.ok);
            else goalRing(ctx, x0 + P + 9, y + S.listRow / 2, S.lack);
            textOut(b, fit(l.name, S.rowSize, iw - 26), x0 + P + 26, y, iw - 26, S.listRow, "left", { size: S.rowSize, color: l.done ? GOAL.line : C.text });
            y += S.listRow;
        }
        if (rows.length) y += 4;
        for (const n of rows) {
            const ok = n.have >= n.need, t = num(n), tw = measure(t, S.rowSize, "bold");
            if (n.icon > 0) drawIcon(b, n.icon, x0 + P, y + 2, 20);
            textOut(b, t, x0 + w - P - tw - 4, y, tw + 6, S.row, "left", { size: S.rowSize, face: "bold", color: ok ? S.ok : S.lack });
            if (ok) goalTick(ctx, x0 + w - P - tw - 20, y + S.row / 2, S.ok);
            textOut(b, fit(n.name, S.rowSize, iw - 26 - tw - 26), x0 + P + 26, y, iw - 26, S.row, "left", { size: S.rowSize, color: ok ? GOAL.line : C.text });
            y += S.row;
        }
        if (more) { textOut(b, "+" + more + " więcej", x0 + P + 26, y, iw, 18, "left", { size: S.subSize, color: GOAL.line, ow: 3 }); y += 18; }
        if (g.at && needs.length) { textOut(b, fit(g.at, S.subSize, iw), x0 + P, y + 2, iw + 4, 18, "left", { size: S.subSize, color: g.atOk === false ? S.lack : GOAL.line, ow: 3 }); y += 20; }
        if (cnt) {
            const ok = cnt.have >= cnt.need, tw = measure(cntText, S.rowSize, "bold");
            textOut(b, cntText, x0 + w - P - tw - 4, y, tw + 6, 20, "left", { size: S.rowSize, face: "bold", color: ok ? S.ok : S.lack });
            thinBar(ctx, x0 + P, y + 23, iw, 4, cnt.have / cnt.need, ok ? S.ok : C.accent);
            y += 30;
        }
        b._baseTexture.update();
        this._box = { x: x0, y: 0, w, h };
        // (the tests read what is drawn)
        this._drawn = { label, title: g.title, sub: subLines.join(" "), list: list.map(l => ({ name: l.name, done: !!l.done })), needs: rows.map(n => ({ name: n.name, have: Math.min(n.have, n.need), need: n.need, ok: n.have >= n.need, tool: !!n.tool })),
            more, at: g.at && needs.length ? g.at : "", count: cntText, w, h };
    };
    // a small ring: a row of the list not done yet
    function goalRing(ctx, cx, cy, colour) {
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = colour;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
    // a small tick (the font has no ✓)
    function goalTick(ctx, x, cy, colour) {
        ctx.save();
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.strokeStyle = colour;
        ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + 4, cy + 4); ctx.lineTo(x + 11, cy - 5); ctx.stroke();
        ctx.restore();
    }

    // ---- the needs' bars under the goal (top left, see the layout above; no goal: in the corner): on a light plate as wide as
    // the goal's, one row each - the small icon, a thin dark track with the need's colour as far as it is full, the number (health in %,
    // the others as the game counts them); low: red, pulsing, the number red. The breath (no icon of its own) a small pixel sign of
    // gusts, only in the combat mode. Under the plate the pills: "Tryb walki", the premia (hidden while a message is up).
    function Sprite_CleanNeeds() {
        this.initialize(...arguments);
    }
    Sprite_CleanNeeds.prototype = Object.create(Sprite_CleanPart.prototype);
    Sprite_CleanNeeds.prototype.constructor = Sprite_CleanNeeds;
    Sprite_CleanNeeds.prototype.initialize = function() {
        Sprite_CleanPart.prototype.initialize.call(this, 440, 220);
        this._pulse = 0;
        this._mapId = 0;
        this._show = true;
        this._rings = [];
        this._bars = [];
        this._bottom = 0;
        this._pills = null;
        this._rowSprites = [];
        this._rowKeys = [];
    };
    Sprite_CleanNeeds.prototype.ownRect = Sprite_CleanPart.prototype.hudRect;
    Sprite_CleanNeeds.prototype.hudRect = function() {
        return this.visible ? columnRect() : new PIXI.Rectangle(0, 0, 0, 0);
    };
    // the plate's bottom edge on the screen; 0 when no bar is drawn
    Sprite_CleanNeeds.prototype.bottom = function() {
        return this.visible && this._rings.length ? this.y + this._bottom : 0;
    };
    // the bottom of all of it - the bars and the pills under them (the goal goes under this); 0 when nothing is drawn
    Sprite_CleanNeeds.prototype.fullBottom = function() {
        return this.visible && this._box ? this.y + this._box.h : 0;
    };
    Sprite_CleanNeeds.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if ($gameMap && $gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._show = T.mapFlag("Stamina", true, "off"); }
        this.visible = isClean() && !!$gameSystem;
        if (!this.visible) return;
        // in the corner, over the goal
        this.x = EDGE;
        this.y = EDGE;
        const v = this._show ? needValues() : {}, shown = !$gameMessage.isBusy(), combat = shown && combatOn(), buffs = shown ? buffList() : [];
        this._pulse = (this._pulse + 1) % 60;
        const low = NEED_KEYS.filter(k => v[k] !== undefined && needLow(k, v[k]));
        const blinkOn = low.length > 0 && this._pulse < 30;
        // (2026-11-12, wydajność) the row is drawn whole only when its make-up changes - which needs, the pills; each need (its icon
        // and its number) is a picture of its own, drawn again only when its number changes. The stamina and the breath change nearly
        // every frame in a fight and while resting after a run.
        const keys = NEED_KEYS.filter(k => v[k] !== undefined);
        const key = keys.join(",") + "|" + this.y + "|" + combat + "|" + buffs.map(f => (f.icon || f.glyph) + f.text).join(",") + "|" + iconsReady() + facesReady();
        if (key !== this._key) {
            this._key = key;
            this.redraw(v, low, blinkOn, combat, buffs);
            return;
        }
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (needRowKey(k, v, low, blinkOn) !== this._rowKeys[i]) this.drawRow(i, k, v, low, blinkOn);
            else if (this._bars[i]) this._bars[i].ratio = +clamp01(v[k]).toFixed(3);
        }
    };
    // a need's picture: its icon and its number, with room round them for the low glow and the number's shadow
    const ROW_PAD = 12;
    // what a need shows: its number, low (and the blink's phase while low)
    function needRowKey(k, v, low, blinkOn) {
        const isLow = low.includes(k);
        return needNumber(k, v[k]) + ":" + (isLow ? (blinkOn ? "A" : "B") : "-");
    }
    // every need in % of its most (the stamina: of the most the level gives; the food and the water count to 100 anyway)
    function needNumber(k, v) {
        return Math.round(clamp01(v) * 100) + "%";
    }
    Sprite_CleanNeeds.prototype.redraw = function(v, low, blinkOn, combat, buffs) {
        const b = this.bitmap, ctx = b.context, keys = NEED_KEYS.filter(k => v[k] !== undefined);
        b.clear();
        this._rings = keys;
        this._bars = [];
        this._rowKeys = [];
        const rows = this._rowSprites;
        while (rows.length > keys.length) { const s = rows.pop(); this.removeChild(s); s.bitmap.destroy(); }
        let right = 0, bottom = 0;
        if (keys.length) {
            const n = keys.length;
            bottom = NUMS.h + NUMS.pad * 2;
            // (no plate behind: the user, 2026-10-23 - the icons and the numbers outlined)
            for (let i = 0; i < n; i++) {
                if (!rows[i]) { rows[i] = new Sprite(new Bitmap(NUMS.step + 12, NUMS.h + ROW_PAD * 2)); this.addChild(rows[i]); }
                rows[i].x = i * NUMS.step;
                rows[i].y = NUMS.pad - ROW_PAD;
                this.drawRow(i, keys[i], v, low, blinkOn);
            }
            right = n * NUMS.step - 10;
        }
        // the pills under the plate: "Tryb walki", then the premia
        let px = 0;
        const py = keys.length ? bottom + 6 : 0, ph = GOAL.pillH;
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
        const pills = px > 0;
        b._baseTexture.update();
        this._slices = keys.filter(k => k !== "breath").length;
        this._breathBand = keys.includes("breath");
        this._bottom = bottom;
        this._pills = { pillY: this.y + py, combat: !!combat, buffs: buffs.length };
        const h = Math.max(bottom, pills ? py + ph + 2 : 0), w = Math.max(right, px);
        this._box = h > 0 && w > 0 ? { x: 0, y: 0, w, h } : null;
    };
    // one need on its own picture: the icon (the breath: its sign) and the percent; low: the number red, glowing in the blink
    Sprite_CleanNeeds.prototype.drawRow = function(i, k, v, low, blinkOn) {
        const s = this._rowSprites[i], b = s.bitmap, ctx = b.context, y = ROW_PAD + NUMS.h / 2, isLow = low.includes(k), num = needNumber(k, v[k]);
        const ix = 2, nx = ix + NUMS.icon + NUMS.gap;
        b.clear();
        if (!drawNeed(b, k, ix, y - NUMS.icon / 2, NUMS.icon) && k === "breath") drawBreathGlyph(ctx, ix + NUMS.icon / 2, y, isLow ? LOW_COLOUR : C.breath, 2);
        const o = { size: NUMS.size, face: "bold", color: isLow ? (blinkOn ? LOW_COLOUR : "#c0675c") : C.text, ow: 3 };
        if (isLow && blinkOn) { o.shadow = 0.9; o.blur = 9; }
        textOut(b, num, nx, y - 13, b.width - nx, 26, "left", o);
        b._baseTexture.update();
        this._rowKeys[i] = needRowKey(k, v, low, blinkOn);
        // (the tests read what is drawn - on the screen)
        this._bars[i] = { key: k, x: this.x + s.x + nx, y: this.y + s.y + y, ratio: +clamp01(v[k]).toFixed(3), low: isLow, number: num };
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

    // ---- bottom right: what was gained (SurvivalHUD's list, its plates read as they are) - dark pills with the icon and the text,
    // the newest at the bottom, the older ones fading
    const GAINS = { right: 10, row: 38, size: 18, bottom: 40, h: 32, ages: [1, 0.85, 0.7, 0.55, 0.45, 0.38, 0.32] };
    // a pill: icon (or none) and text on a dark panel rounded to its half height
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

    // ---- the map's name as one comes in (the look: "Kinowy", further down). Which show: a room (<NazwaMapy:wnetrze>, else Atmosphere's
    // profile "interior" / "tavern") its own, smaller one; any other place the same small one on every visit; the underground: a
    // generated floor is "Piętro N" with its band's name as the words, a hand-made one its hall's name with "piętro N · band", every
    // 10th floor (the guardians) red. Night outdoors: a warmer gold with a faint glow. It goes at once when he leaves the map and fades
    // out early when a message comes or the map's name is turned off (as the old window closed then).
    // The words: js/teksty/miejsca.txt (mapa.<id>.pod); a map without them: its name and the line.
    // The visits: Tawerna.state("nazwaMapy") - { odw: { mapId: visits }, pasma: { band: true }, gotowe }; an older save counts as
    // visited what the game already remembers (Combat's discoveries "odkrycie", Underground's floors, the raven's places, the map
    // he stands on).
    const TXM = window.Watki && Watki.teksty ? Watki.teksty("miejsca") : {};
    const placeWord = key => { let o = TXM; for (const p of String(key).split(".")) { if (!o || typeof o !== "object") return ""; o = o[p]; } return typeof o === "string" ? o : ""; };
    const rgbOf = c => "rgb(" + c.join(",") + ")";

    // the visits (the save): a new game has nothing to take over; an older save takes what the game already remembers
    const visits = T.state.define("nazwaMapy", () => ({ odw: {}, pasma: {}, gotowe: false }), { version: 1, owner: PLUGIN });
    T.on("newGame", () => { visits().gotowe = true; }, { owner: PLUGIN });
    T.on("load", () => importVisits(), { owner: PLUGIN });
    function importVisits() {
        const s = visits();
        if (s.gotowe) return;
        s.gotowe = true;
        const mark = id => { if (Number(id) > 0) s.odw[id] = s.odw[id] || 1; };
        try {
            const hero = T.state.spec("hero") ? T.state("hero") : null;   // (Combat: "odkrycie" of every map entered since it is there)
            for (const k of Object.keys((hero && hero.seen) || {})) if (/^m\d+$/.test(k)) mark(k.slice(1));
            const U = T.api("Underground"), us = U && T.state.spec("underground") ? T.state("underground") : null;
            for (const f of Object.keys((us && us.visited) || {})) {
                const n = Number(f), b = U.bandOf(n);
                mark(U.mapOf(n));
                if (b) s.pasma[b.id] = true;
            }
            const kr = T.state.spec("kruk") ? T.state("kruk") : null;   // (the raven: the outdoor places he has been to)
            for (const k of Object.keys((kr && kr.visited) || {})) mark(k);
            if (window.$gameMap) mark($gameMap.mapId());
        } catch (e) { console.error("[CleanHUD] nazwa mapy: odwiedzone miejsca ze starego zapisu", e); }
    }
    // what kind of place this map is: <NazwaMapy:wnetrze|miejsce>, else a room by Atmosphere's profile (the tileset, <Ambience>)
    function placeKind() {
        const tag = T.mapTag("NazwaMapy"), raw = tag && tag.raw ? String(tag.raw).trim().toLowerCase() : "";
        if (/^wn[eę]trze$/.test(raw)) return "inside";
        if (/^(miejsce|pe[lł]na)$/.test(raw)) return "place";
        const A = T.api("Atmosphere");
        if (A && A.profileOf) { const p = A.profileOf(); return p === "interior" || p === "tavern" ? "inside" : "place"; }
        const ts = $gameMap.tileset(), name = (ts && ts.name) || "";
        return /Wewn|Inside|Interior/i.test(name) && !/cave/i.test(String((T.mapTag("Ambience") || {}).raw || "")) ? "inside" : "place";
    }
    // what the map's name shows on this map now (before the visit is counted): { id, kind, title, sub, opis, first, floor, boss, band }
    function placeInfo() {
        const id = $gameMap.mapId(), s = visits(), first = !s.odw[id];
        const U = T.api("Underground"), UD = window.Underground_Data, f = U && U.floorOf && UD ? U.floorOf(id) : 0;
        if (f) {
            const band = U.bandOf(f) || {}, bandName = String(band.name || "").toLocaleLowerCase("pl"), gen = U.isGenerated(id);
            const floorWord = UD.TEXT && UD.TEXT.notice ? UD.TEXT.notice(f) : "Piętro " + f, hall = !gen && UD.FLOORS && UD.FLOORS[f] ? UD.FLOORS[f].name : "";
            const bandFirst = !!band.id && !s.pasma[band.id];
            return { id, kind: "place", floor: f, band: band.id || 0, boss: f % 10 === 0, deepest: U.deepest ? U.deepest() : 0, title: hall || floorWord,
                sub: placeWord("mapa." + id + ".pod") || (hall ? floorWord.toLocaleLowerCase("pl") + " · " : "") + bandName,
                opis: gen ? (bandFirst ? placeWord("pasmo." + band.id + ".opis") : "") : first ? placeWord("mapa." + id + ".opis") : "",
                first: gen ? bandFirst : first };
        }
        const kind = placeKind();
        return { id, kind, floor: 0, band: 0, boss: false, deepest: 0, title: $gameMap.displayName() || "", sub: placeWord("mapa." + id + ".pod"),
            opis: kind === "place" && first ? placeWord("mapa." + id + ".opis") : "", first };
    }
    // the map's name to show now: the old window's condition (a name, the name display on) and no <NazwaMapy:off>
    function nameShown() {
        return !!window.$gameMap && !!$gameMap.displayName() && $gameMap.isNameDisplayEnabled() && T.mapFlag("NazwaMapy", true, "off") !== false;
    }
    // a map entered: the visit counted (in either look), the map's name started (the clean look draws it)
    function startPlaceName(scene) {
        if (!window.$gameSystem || !nameShown()) return;
        let info;
        try {
            if (!visits().gotowe) importVisits();
            info = placeInfo();
        } catch (e) { console.error("[CleanHUD] nazwa mapy", e); return; }
        const s = visits();
        s.odw[info.id] = (s.odw[info.id] || 0) + 1;
        if (info.band) s.pasma[info.band] = true;
        const name = scene && scene._cleanCinema;
        if (name && name.start) name.start(info);
    }
    const _nameOpen = Window_MapName.prototype.open;
    Window_MapName.prototype.open = function() {
        _nameOpen.call(this);
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map && scene._mapNameWindow === this)) return;
        if (window.$gameTemp && $gameTemp._hudScene) { nameWaits = $gameMap.mapId(); return; }   // (a scene's bars are in: after the scene)
        startPlaceName(scene);
    };
    // ---- a scene's black bars (2026-11-07, the user: grandpa's first talk - "wyłączyć HUD i dać paski kinowe"): a plugin's scene turns
    // them on and off (CleanHUD.sceneBars(on)); while on, the HUD goes (SurvivalHUD's fade reads $gameTemp._hudScene - Game_Temp, never
    // saved), the top stack's notices stay on the bar, and the map's name waits for the end of the scene. Two plain black bars of
    // SCENE_BAR px, faded in and out (alpha only); a scene that begins as the map is made has them at once.
    const SCENE_BAR = 64, SCENE_FADE = 12;
    let nameWaits = 0;
    function sceneBars(on) {
        if (!window.$gameTemp) return false;
        $gameTemp._hudScene = !!on;
        if (!on && nameWaits) {
            const scene = SceneManager._scene, was = nameWaits;
            nameWaits = 0;
            if (scene instanceof Scene_Map && $gameMap.mapId() === was) startPlaceName(scene);
        }
        return !!on;
    }
    function Sprite_CleanBars() {
        this.initialize(...arguments);
    }
    Sprite_CleanBars.prototype = Object.create(Sprite.prototype);
    Sprite_CleanBars.prototype.constructor = Sprite_CleanBars;
    Sprite_CleanBars.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        const bm = new Bitmap(4, 4);
        bm.fillAll("rgba(0,0,0,0.94)");
        this._top = new Sprite(bm);
        this._bottom = new Sprite(bm);
        for (const s of [this._top, this._bottom]) { s.scale.x = W() / 4; s.scale.y = SCENE_BAR / 4; this.addChild(s); }
        this._bottom.y = H() - SCENE_BAR;
        this.alpha = window.$gameTemp && $gameTemp._hudScene ? 1 : 0;   // (on as the map is made: there at once, the screen fades in anyway)
        this.visible = this.alpha > 0;
    };
    Sprite_CleanBars.prototype.update = function() {
        const want = window.$gameTemp && $gameTemp._hudScene ? 1 : 0;
        if (this.alpha !== want) this.alpha = want > this.alpha ? Math.min(1, this.alpha + 1 / SCENE_FADE) : Math.max(0, this.alpha - 1 / SCENE_FADE);
        this.visible = this.alpha > 0;
    };
    // Underground.js asks: does the map's name say the floor (and its band) here? Then no notice "Piętro N" under it
    const saysFloor = () => isClean() && nameShown();
    // one letter of the name: the glow (night), the soft shadow, the dark outline, the fill - `fill` a colour, or [top, foot]: the
    // capitals' top to the line (o.fillOnly: the fill alone - the glint and the red laid over the letter)
    // (o.into = { bmp, x, y }: drawn straight into that picture with its box's top left at x, y - no picture of its own; returns the box)
    function letterBox(ch, size) {
        const pad = Math.ceil(size * 0.25) + 6;
        return { pad, w: Math.ceil(measure(ch, size, "caps")) + pad * 2, h: Math.ceil(size * 1.34) + pad * 2 };
    }
    function kronikaLetter(ch, size, fill, o) {
        o = o || {};
        const box = letterBox(ch, size), pad = box.pad, into = o.into;
        const b = into ? into.bmp : new Bitmap(box.w, box.h), ctx = b.context, base = pad + Math.round(size * 1.02);
        const ow = Math.max(3, Math.round(size / 11));
        ctx.save();
        if (into) ctx.translate(into.x, into.y);
        ctx.font = size + "px " + face("caps");
        ctx.textBaseline = "alphabetic";
        ctx.lineJoin = "round";
        if (!o.fillOnly) {
            if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = Math.round(size * 0.4); ctx.fillStyle = o.glow; ctx.fillText(ch, pad, base); }
            ctx.shadowColor = "rgba(0,0,0,0.72)"; ctx.shadowBlur = Math.max(3, Math.round(size / 8)); ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
            ctx.strokeStyle = "rgba(0,0,0,0.78)"; ctx.lineWidth = ow * 2;
            ctx.strokeText(ch, pad, base);
            ctx.shadowColor = "rgba(0,0,0,0)"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
            ctx.strokeText(ch, pad, base);
        }
        if (typeof fill === "string") ctx.fillStyle = fill;
        else {
            const g = ctx.createLinearGradient(0, base - size * 0.7, 0, base);
            g.addColorStop(0, rgbOf(fill[0]));
            g.addColorStop(1, rgbOf(fill[1]));
            ctx.fillStyle = g;
        }
        ctx.fillText(ch, pad, base);
        ctx.restore();
        if (into) return box;
        b._baseTexture.update();
        b._pad = pad;
        return b;
    }
    // the place's words: spaced capitals in the main face, smaller when wider than maxW (capsFit measures - the picture's size -,
    // capsDraw draws it into a picture at ox, oy)
    function capsFit(text, size, sp, maxW) {
        const s = String(text).toLocaleUpperCase("pl");
        let letters = Array.from(s), ws = [], tot = 0;
        for (let i = 0; i < 8; i++) {
            ws = letters.map(ch => (ch === " " ? measure("n", size) * 0.8 : measure(ch, size)));
            tot = ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, letters.length - 1);
            if (tot <= maxW || size <= 13) break;
            size--;
            if (i % 2) sp = Math.max(1, sp - 1);
        }
        return { letters, ws, tot, size, sp, w: Math.ceil(tot) + 24, h: size + 14 };
    }
    function capsDraw(b, f, colour, ox, oy) {
        let x = 12;
        f.letters.forEach((ch, i) => {
            if (ch !== " ") textOut(b, ch, ox + Math.round(x) - 3, oy, f.ws[i] + 8, f.h, "left", { size: f.size, color: colour, ow: 4, outline: "rgba(0,0,0,0.8)", shadow: 0.6, blur: 4 });
            x += f.ws[i] + f.sp;
        });
    }
    // ---- the map's name as one comes in, "Kinowy" (the user 2026-10-23: "możemy przejść z kroniki na kinowy?"; 2026-11-06: "napis mapy
    // po prostu w całości się pojawia i przy końcu zanika, bez zbędnych animacji, wydajność ważniejsza", "po prostu miej gotowe obrazki",
    // "niech zawsze będzie ten mniejszy opis, taki jak przy drugim wejściu", "niech przy opisie nie będzie tego »pokaż mapę«"): in the
    // bottom left corner the place's words in gold capitals, its name (44 px; a room's 32 px) and a gold line, as ONE picture made ahead
    // by tools/nazwa_mapy/obrazki.js (img/nazwy_map/<key>.png, listed in spis.json), shown whole from its first frame and faded out at the
    // end - only its alpha moves. No file for it (a new map, a changed text): drawn here once, into one picture, by the same code the
    // tool draws with. Under it only the underground's "najgłębiej: piętro N". (2026-11-07: the old "Kronika" at the top centre and the
    // long first visit with the black bars and the sentence taken out - a scene's bars are CleanHUD.sceneBars now.)
    const cinemaMode = info => (info.kind === "inside" ? "inside" : "again");
    const KN = {
        left: 70, foot: 22,
        again: { size: 44, sp: 2, tag: 15, tagSp: 4, line: 90 },
        inside: { size: 32, sp: 2, tag: 14, tagSp: 3, line: 64 },
        cream: [[252, 247, 234], [214, 204, 182]], night: [[255, 236, 200], [236, 170, 92]], red: [[255, 182, 156], [178, 30, 24]],
        glow: "rgba(255,146,52,0.5)", line: [255, 210, 63], redLine: [226, 86, 58], tagColour: "#ffd23f",
        // frames: hold - when it starts to go, out - how long it goes
        times: { again: { hold: 156, out: 24 }, inside: { hold: 126, out: 24 } }
    };
    // the pictures made ahead: their folder, the look's version (a new one when the drawing below changes: every picture made again)
    const PIC = { dir: "img/nazwy_map/", ver: "kn1" };
    let picList = null;   // spis.json: { key: [x, y, w, h, hintY, wide, top0, count, size, tot, blockH] }
    (function loadPicList() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", PIC.dir + "spis.json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => { try { picList = xhr.status < 400 ? JSON.parse(xhr.responseText).obrazki || {} : {}; } catch (e) { picList = {}; } };
            xhr.onerror = () => { picList = {}; };
            xhr.send();
        } catch (e) { picList = {}; }
    })();
    // the picture's key: what it shows (its texts, the look, night, red) - a changed text has no file, so it is drawn here (the last
    // field was the sentence of the long first visit: kept empty, so the pictures made keep their keys)
    function picKey(info, mode, night) {
        const s = [PIC.ver, W(), H(), mode, night ? 1 : 0, info.boss ? 1 : 0, info.title || "", info.sub || "", ""].join("\u0001");
        let a = 0x811c9dc5, b = 0x5bd1e995;
        for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 13); }
        return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
    }
    // where each part goes on the screen (measured only, nothing drawn): the words, the letters, the gold line
    function cinemaLayout(info, mode, night) {
        const L = KN[mode], Wd = W(), Hd = H(), maxW = Wd - 2 * KN.left;
        // the name: smaller when it does not fit
        const caps = Array.from(String(info.title));
        let size = L.size, ws = [], tot = 0;
        for (let i = 0; i < 5; i++) {
            ws = caps.map(ch => measure(ch, size, "caps"));
            tot = ws.reduce((a, b) => a + b, 0) + L.sp * Math.max(0, caps.length - 1);
            if (tot <= maxW || size <= 20) break;
            size = Math.max(20, Math.floor(size * maxW / tot));
        }
        // the block from its foot up: the small line (always room for it), the gold line, the name, the words
        const tagH = info.sub ? L.tag + 10 : 0, nameH = Math.round(size * 1.28);
        const foot = Hd - KN.foot, blockH = tagH + nameH + 14 + 20;
        let y = foot - blockH;
        const lay = { size, tot, top0: y, blockH, night: !!night, parts: [], rects: {}, count: 0, tagW: 0 };
        const put = (p, px, py, w, h) => { Object.assign(p, { x: px, y: py, w, h }); lay.parts.push(p); return { x: px, y: py, w, h }; };
        if (info.sub) {
            const f = capsFit(info.sub, L.tag, L.tagSp, maxW);
            lay.rects.tag = put({ k: "tag", f }, KN.left - 12, y - 4, f.w, f.h);
            lay.tagW = Math.ceil(f.tot);
            y += tagH;
        }
        const fill = info.boss ? KN.cream : night ? KN.night : KN.cream;
        let x = KN.left, n0 = Infinity, n1 = -Infinity, nh = 0;
        caps.forEach((ch, i) => {
            if (ch.trim()) {
                const bx = letterBox(ch, size), p = bx.pad, lx = Math.round(x) - p;
                put({ k: "letter", ch, fill }, lx, y - p, bx.w, bx.h);
                if (info.boss) put({ k: "red", ch }, lx, y - p, bx.w, bx.h);   // (the guardians' floors: the fill red)
                n0 = Math.min(n0, lx + p);
                n1 = Math.max(n1, lx + bx.w - p);
                nh = Math.max(nh, bx.h - 2 * p);
                lay.count++;
            }
            x += ws[i] + L.sp;
        });
        if (lay.count) lay.rects.letters = { x: n0, y, w: n1 - n0, h: nh };
        y += nameH + 4;
        lay.rects.line = put({ k: "line", colour: info.boss ? KN.redLine : KN.line }, KN.left, y, L.line, 3);
        y += 10;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of lay.parts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.h); }
        return Object.assign(lay, { x: x0, y: y0, w: Math.max(1, Math.ceil(x1 - x0)), h: Math.max(1, Math.ceil(y1 - y0)), hintY: y, wide: Math.max(tot, lay.tagW) });
    }
    // the picture: every part straight into one canvas (no picture of its own for each letter)
    function cinemaDraw(lay) {
        const b = new Bitmap(lay.w, lay.h), glow = lay.night ? KN.glow : null;
        for (const p of lay.parts) {
            const x = p.x - lay.x, y = p.y - lay.y;
            if (p.k === "tag") capsDraw(b, p.f, KN.tagColour, x, y);
            else if (p.k === "letter") kronikaLetter(p.ch, lay.size, p.fill, { glow, into: { bmp: b, x, y } });
            else if (p.k === "red") kronikaLetter(p.ch, lay.size, KN.red, { fillOnly: true, into: { bmp: b, x, y } });
            else if (p.k === "line") {
                const c = b.context;
                c.fillStyle = rgbOf(p.colour);
                c.fillRect(x, y, p.w, 2);
                c.fillStyle = "rgba(0,0,0,0.5)";
                c.fillRect(x, y + 2, p.w, 1);
            }
        }
        b._baseTexture.update();
        return b;
    }
    // what spis.json keeps of a layout: the picture's place and what the HUD needs of it (nothing measured when it comes from a file)
    const r2 = v => Math.round(v * 100) / 100;
    const picMeta = lay => [lay.x, lay.y, lay.w, lay.h, lay.hintY, r2(lay.wide), lay.top0, lay.count, lay.size, r2(lay.tot), lay.blockH];
    const metaLay = m => ({ x: m[0], y: m[1], w: m[2], h: m[3], hintY: m[4], wide: m[5], top0: m[6], count: m[7], size: m[8], tot: m[9], blockH: m[10] });
    // the shade under it and the small line: drawn once each and kept between the shows (a few kinds only)
    const kept = { shade: new Map(), hint: new Map() };
    function keptBitmap(map, key, make) {
        let b = map.get(key);
        if (b) return b;
        if (map.size >= 10) { const [k0, b0] = map.entries().next().value; map.delete(k0); b0.destroy(); }
        b = make();
        map.set(key, b);
        return b;
    }
    // (a soft corner: a quarter circle reaching exactly the picture's edges, stretched sideways)
    function cinemaShade(shadeH) {
        return keptBitmap(kept.shade, "c" + shadeH, () => {
            const sh = new Bitmap(shadeH, shadeH), cx = sh.context, g = cx.createRadialGradient(0, shadeH, 0, 0, shadeH, shadeH);
            g.addColorStop(0, "rgba(0,0,0,0.5)");
            g.addColorStop(1, "rgba(0,0,0,0)");
            cx.fillStyle = g;
            cx.fillRect(0, 0, sh.width, shadeH);
            sh._baseTexture.update();
            return sh;
        });
    }
    function cinemaHint(text) {
        return keptBitmap(kept.hint, text, () => {
            const b = new Bitmap(Math.ceil(measure(text, 12)) + 30, 18);
            textOut(b, text, 0, 0, b.width, 18, "left", { size: 12, color: C.muted, ow: 3 });
            return b;
        });
    }
    let lastShow = null;   // (the tests read how the last one went: its map, mode, frames, why it ended)
    function Sprite_CleanCinema() {
        this.initialize(...arguments);
    }
    Sprite_CleanCinema.prototype = Object.create(Sprite.prototype);
    Sprite_CleanCinema.prototype.constructor = Sprite_CleanCinema;
    Sprite_CleanCinema.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._info = null;
        this._t = -1;        // the frame of its show; -1: nothing shown
        this._parts = null;  // its sprites, made on its first frame (the faces and its file ready)
        this._bitmaps = [];
        this._h = 0;
        this._box = null;
        this.visible = false;
    };
    // (its look decided as it starts - night, the key -, its file asked for at once: it loads while the map fades in)
    Sprite_CleanCinema.prototype.start = function(info) {
        this.clear("new");
        this._info = info;
        this._mode = cinemaMode(info);
        this._T = KN.times[this._mode];
        this._mapId = $gameMap.mapId();
        this._t = 0;
        this._cut = Infinity;   // (a message, the name turned off: it fades from that frame)
        this._wait = 0;
        const S = T.api("Survival"), outdoors = !S || !S.isOutdoors || S.isOutdoors();
        this._night = this._mode !== "inside" && !info.floor && outdoors && !!(T.time && T.time.isNight());
        this._key = picKey(info, this._mode, this._night);
        const m = picList && picList[this._key];
        this._file = m ? { meta: m, bmp: this.keep(Bitmap.load(PIC.dir + this._key + ".png")), dec: 0 } : null;
    };
    Sprite_CleanCinema.prototype.duration = function() {
        return this._T ? this._T.hold + this._T.out : 0;
    };
    Sprite_CleanCinema.prototype.clear = function(why) {
        if (this._t >= 0 && this._info) lastShow = { mapId: this._mapId, title: this._info.title, mode: this._mode, frames: this._t, why: why || "" };
        this.removeChildren();
        for (const b of this._bitmaps) b.destroy();
        this._bitmaps = [];
        this._parts = null;
        this._file = null;
        this._t = -1;
        this._h = 0;
        this._box = null;
        this.visible = false;
    };
    Sprite_CleanCinema.prototype.keep = function(b) {
        this._bitmaps.push(b);
        return b;
    };
    Sprite_CleanCinema.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (this._t < 0) return;
        // it goes at once when he leaves the map (a transfer, another scene - the menu too) or the look is the classic one
        if (!isClean()) { this.clear("look"); return; }
        if ($gameMap.mapId() !== this._mapId || $gamePlayer.isTransferring() || SceneManager.isSceneChanging()) { this.clear("map"); return; }
        const tl = this._T;
        if (this._cut === Infinity && ($gameMessage.isBusy() || !nameShown())) this._cut = Math.min(this._t, tl.hold);
        if (!this._parts) {
            if (!this.ready() && this._wait++ < 90) return;   // (the faces, its file still loading: it waits for them, 1.5 s at most)
            this.build();
        }
        const hint = this.hintText();
        if (hint !== this._parts.hintText) this.buildHint(hint);
        this.visible = true;
        this.animate(this._t);
        if (++this._t >= Math.min(tl.hold, this._cut) + tl.out) this.clear("end");
    };
    // ready: the faces (the small line) and its file loaded and decoded off the main thread (a file that fails: drawn here instead)
    Sprite_CleanCinema.prototype.ready = function() {
        const f = this._file;
        if (f && f.dec < 2) {
            const b = f.bmp, img = b._image;
            if (b.isError()) f.dec = 2;
            else if (b.isReady() && f.dec === 0) {
                if (!img || !img.decode) f.dec = 2;
                else { f.dec = 1; img.decode().then(() => { f.dec = 2; }, () => { f.dec = 2; }); }
            }
        }
        return facesReady() && (!f || f.dec === 2);
    };
    Sprite_CleanCinema.prototype.build = function() {
        const info = this._info, mode = this._mode, Wd = W(), Hd = H(), night = this._night;
        const f = this._file && this._file.bmp.isReady() ? this._file : null;
        const lay = f ? metaLay(f.meta) : cinemaLayout(info, mode, night);
        const P = this._parts = { hintText: null, night, lay: f ? null : lay, file: !!f, count: lay.count, size: lay.size, w: lay.tot,
            top0: lay.top0, hintY: lay.hintY, wide: lay.wide };
        this.x = this.y = 0;
        const shadeH = lay.blockH + 120, sh = cinemaShade(shadeH);
        P.shade = new Sprite(sh);
        P.shade.scale.x = Math.min(Wd, Math.round(lay.tot + 260)) / sh.width;
        P.shade.y = Hd - shadeH;
        this.addChild(P.shade);
        // the picture: the file made ahead, or drawn here once
        P.pic = new Sprite(f ? f.bmp : this.keep(cinemaDraw(lay)));
        P.pic.x = lay.x;
        P.pic.y = lay.y;
        this.addChild(P.pic);
        this.buildHint(this.hintText());
    };
    // the small line under it: only the deepest floor (the underground)
    Sprite_CleanCinema.prototype.hintText = function() {
        const i = this._info;
        return i.floor > 0 && i.deepest > i.floor ? "najgłębiej: piętro " + i.deepest : "";
    };
    Sprite_CleanCinema.prototype.buildHint = function(text) {
        const P = this._parts;
        if (P.hint) { this.removeChild(P.hint); P.hint = null; }
        P.hintText = text;
        if (text) {
            P.hint = new Sprite(cinemaHint(text));
            P.hint.x = KN.left;
            P.hint.y = P.hintY;
            this.addChild(P.hint);
        }
        this._h = 0;
        this._box = { w: Math.round(P.wide + 8), h: Math.round(P.hintY + 20 - P.top0) };
    };
    // the parts' boxes on the screen (the tests): measured again when the picture came from a file
    Sprite_CleanCinema.prototype.rects = function() {
        const P = this._parts;
        if (!P) return null;
        if (!P.lay) P.lay = cinemaLayout(this._info, this._mode, P.night);
        return P.lay.rects;
    };
    // whole from its first frame; at the end all of it fades as one - the only thing that moves
    Sprite_CleanCinema.prototype.animate = function(t) {
        const tl = this._T, cut = Math.min(tl.hold, this._cut);
        this.opacity = t < cut ? 255 : Math.round(255 * clamp01(1 - (t - cut) / tl.out));
    };
    // what it shows now (the tests, the F9)
    Sprite_CleanCinema.prototype.info = function() {
        const i = this._info, P = this._parts;
        if (!i || this._t < 0) return null;
        const n = P ? P.count : 0;   // (all its letters there from its first frame)
        return { style: "kinowy", mapId: this._mapId, title: i.title, sub: i.sub, opis: "", hint: P ? P.hintText : "", mode: this._mode, kind: i.kind,
            first: !!i.first, floor: i.floor, boss: !!i.boss, night: !!(P && P.night), t: this._t, dur: this.duration(), visible: !!this.visible,
            size: P ? P.size : 0, w: P ? Math.round(P.w) : 0, h: this._h, y: Math.round(this.y), opacity: this.opacity,
            letters: n, lettersIn: n, red: P && i.boss ? 1 : 0, file: !!(P && P.file), key: this._key,
            box: this._box ? { x: Math.round(this.x - this._box.w / 2), y: Math.round(this.y), w: this._box.w, h: this._box.h } : null };
    };
    // (for tools/nazwa_mapy/obrazki.js and the tests: the same layout, drawing and key as on the map)
    const nameArt = { dir: PIC.dir, ver: PIC.ver, mode: cinemaMode, key: picKey, layout: cinemaLayout, draw: cinemaDraw, meta: picMeta, list: () => picList, times: KN.times };

    // ---- the top centre: the dog's stockpile strip, the level banner, the day's greeting, the
    // notices ("Tryb walki" is a pill in the top left corner, under the goal) - one under another, each sliding to its place (their timing is the old parts')
    const TOP = { gap: 4, slide: 0.25 };
    function Sprite_CleanTop() {
        this.initialize(...arguments);
    }
    Sprite_CleanTop.prototype = Object.create(Sprite.prototype);
    Sprite_CleanTop.prototype.constructor = Sprite_CleanTop;
    Sprite_CleanTop.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._items = {};
        for (const k of ["dog", "level", "day", "notice"]) {
            const s = new Sprite();   // (one picture each)
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
        for (const k of ["dog", "level", "day", "notice"]) if (I[k].visible && I[k].bitmap) place(I[k], I[k].bitmap.height);
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
            if (!s.visible || !(s.bitmap || s._h) || !s._box) continue;
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
        this._cleanGoal = new Sprite_CleanGoal();
        this._cleanNeeds = new Sprite_CleanNeeds();
        this._cleanGains = new Sprite_CleanGains();
        this._cleanWeapon = new Sprite_CleanWeapon();
        this._cleanSneak = new Sprite_CleanSneak();
        this._cleanTop = new Sprite_CleanTop();
        this._cleanTop._cinemaKeep = true;   // (its notices stay while a scene's bars hide the rest)
        this._cleanCinema = new Sprite_CleanCinema();   // (the map's name, "Kinowy": over all of it, not in the fade under the hero)
        this._cleanBars = new Sprite_CleanBars();   // (a scene's black bars - CleanHUD.sceneBars)
        // (the top stack over a scene's bars: its notices are on the bar, not under it)
        for (const s of [this._cleanClock, this._cleanLoad, this._cleanGoal, this._cleanNeeds, this._cleanWeapon, this._cleanGains, this._cleanSneak, this._cleanCinema, this._cleanBars, this._cleanTop]) {
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
        return [this._cleanClock, this._cleanLoad, this._cleanGoal, this._cleanNeeds, this._cleanGains, this._cleanWeapon, this._cleanSneak, this._cleanTop, this._cleanCompass];
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
        // the top right column: the clock and the compass, the compass's label, the day's line, the load (hidden for now), the torch's
        // gauge (RoomLighting), the minimap (M)
        let y = this._cleanLoad ? this._cleanLoad.bottom() + 4 : this._cleanClock ? this._cleanClock.bottom() + 4 : 8;
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
    // the map's name window opens as one comes in: in the clean look it is not drawn, the name in the bottom left corner starts then
    // (Window_MapName.open, above) and runs on its own (SurvivalHUD hides the window in the fade list: fine, it is not drawn)

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
        for (const k of ["Clock", "Load", "Goal", "Needs", "Gains", "Weapon", "Sneak", "Top", "Compass"]) out.parts[k.toLowerCase()] = rectOf(scene["_clean" + k]);
        out.goalBox = scene._cleanGoal && scene._cleanGoal.visible && scene._cleanGoal._drawn ? JSON.parse(JSON.stringify(scene._cleanGoal._drawn)) : null;
        out.corner = rectOf({ visible: true, alpha: 1, opacity: 255, hudRect: columnRect });   // (the top left column as one: its fade)
        const nd = scene._cleanNeeds, ck = scene._cleanClock;
        out.bars = nd && nd.visible ? (nd._bars || []).slice() : [];
        out.text = ck && ck._text ? Object.assign({}, ck._text, nd && nd.visible && nd._pills ? nd._pills : {}) : null;
        out.shade = scene._cleanShade ? scene._cleanShade.levels() : null;
        out.old = {};
        for (const k of OLD) if (scene[k]) out.old[k.slice(1)] = !!scene[k].renderable;
        out.goal = goalInfo(scene);
        if (out.goal) out.goal = { source: out.goal.source, title: out.goal.title, line: out.goal.line, icon: out.goal.icon, id: out.goal.id, sub: out.goal.sub || "",
            needs: (out.goal.needs || []).map(n => ({ name: n.name, have: n.have, need: n.need })), at: out.goal.at || "", count: out.goal.count || null };
        const top = scene._cleanTop;
        out.top = top ? Object.keys(top._items).filter(k => top._items[k].visible).map(k => ({ k, y: Math.round(top._items[k].y) })) : [];
        const nameSprite = scene._cleanCinema;
        out.name = nameSprite && nameSprite.info ? nameSprite.info() : null;   // (the map's name now: Sprite_CleanCinema.info)
        out.nameLast = lastShow ? Object.assign({}, lastShow) : null;
        if (scene._minimap) out.minimap = { visible: !!scene._minimap.visible, y: scene._minimap.y, hidden: $gameSystem._minimapHidden };
        return out;
    }

    window.CleanHUD = T.register(PLUGIN, {
        isClean, lookClean, setClean(on) { ConfigManager.uiClean = !!on; return ConfigManager.uiClean; },
        C, textOut, measure, fit, iconBitmap, drawIcon, thinBar, pl, hm, goalInfo, needValues, loadInfo, heroFeet, bottomCovered, debug,
        // (the map's name: what it would show here, the visits kept in the save, whether it says the floor - Underground.js asks)
        placeInfo: () => (window.$gameMap && $gameMap.mapId() ? placeInfo() : null), visits: () => visits(), saysFloor, nameArt, sceneBars,
        Sprite_CleanPart, NEED_KEYS, NEED_ICONS, drawNeed,
        // (the HUD's pieces for the other parts and windows: MenuRing, CleanHUD_Compass)
        face, facesReady, spaced, spacedWidth, roundPath, rpanel, mix, drawClock
    });
})();
