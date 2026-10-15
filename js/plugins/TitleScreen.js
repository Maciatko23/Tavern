//=============================================================================
// TitleScreen.js
//=============================================================================
// The title screen "Kufel przy kominku" (the user's pick 2026-10-12, docs/ekran_tytulowy/tytul_02_kufel_przy_kominku.png): the picture
// img/titles1/Tawerna_Title_Kufel.png (no letters baked in) brought to life the way every light in the game is - fire: the hearth
// flickers and its light wavers on the wall and the table, sparks rise from the logs, the candle's flame trembles, steam rises
// over the cauldron and (faintly) over the tankard. The game's name, the line under it and the menu are drawn by the game, so
// they stay sharp: "Tawerna" in gold gothic letters, "Ciepły kąt na krańcu świata", then Nowa gra / Kontynuuj (the last save's
// day, season and place under it; grey and skipped without a save) / Opcje / Wyjdź - the graphite and copper look of the menu P.
// Keys as everywhere: W/S or the arrows, O or Enter, P or Esc; the mouse points and clicks.
// How: the engine's own Window_TitleCommand stays (its keys, mouse, handlers, the "busy" checks of Scene_Title) but draws
// nothing; the menu sprite reads its index. The picture, the effects and the letters are sprites of the scene. UITheme.js's
// older title (its titleImage and Sprite_TitleFx) is replaced while this plugin is on (it must stand below UITheme in the list).
// Tests: tests/title_test.js (TitleScreen.info()).

/*:
 * @target MZ
 * @plugindesc Ekran tytułowy „Kufel przy kominku”: żywy ogień, iskry, świeca i para; napis i menu w stylu Grafit i miedź. v1.0.0
 * @author Claude
 * @orderAfter UITheme
 * @orderAfter TawernaUI
 * @orderAfter MenuRing
 *
 * @param image
 * @text Obraz tła
 * @type file
 * @dir img/titles1
 * @default Tawerna_Title_Kufel
 * @desc Tło ekranu tytułowego (img/titles1). Puste = wtyczka wyłączona (wraca stary ekran z UITheme).
 *
 * @param subtitle
 * @text Podtytuł
 * @type string
 * @default Ciepły kąt na krańcu świata
 *
 * @help
 * ============================================================================
 * TitleScreen.js - ekran tytułowy „Kufel przy kominku”
 * ============================================================================
 * KOLEJNOŚĆ: pod UITheme.js (zastępuje jego ekran tytułowy).
 *
 * Tło: img/titles1/Tawerna_Title_Kufel.png (bez napisów). Ruch: blask
 * kominka i jego światło na ścianie i stole, iskry z paleniska, drgający
 * płomień świecy, para nad kociołkiem i kuflem; napis i menu wyłaniają się
 * z ciemności.
 *
 * Menu: Nowa gra, Kontynuuj (pod spodem ostatni zapis: dzień, pora roku,
 * miejsce; bez zapisu szare i pomijane - otwiera listę zapisów z
 * zaznaczonym najnowszym), Opcje, Wyjdź (zamyka grę).
 * Klawisze: W/S lub strzałki, O lub Enter wybiera; mysz.
 *
 * Czcionki (fonts/, licencja OFL): PirataOne-Regular.ttf (napis),
 * EBGaramond-Variable.ttf (podtytuł), AlegreyaSans-Bold/Regular (menu).
 * data/System.json nie jest zmieniany (tło podmienia wtyczka).
 * Skrypt: TitleScreen.info() - stan ekranu (dla testów).
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "TitleScreen";
    const params = PluginManager.parameters(PLUGIN);
    const IMAGE = params.image === undefined ? "Tawerna_Title_Kufel" : String(params.image || "");
    const SUBTITLE = params.subtitle === undefined ? "Ciepły kąt na krańcu świata" : String(params.subtitle);
    const T = window.Tawerna;
    const api = { IMAGE, info: () => null };
    window.TitleScreen = T && T.register ? T.register(PLUGIN, api) : api;
    if (!IMAGE) return;

    // ------------------------------------------------------------------
    // Places on the 1280 x 720 picture (measured on the picture: tools/ekran_tytulowy)
    // ------------------------------------------------------------------
    const SPOT = {
        fire: { x: 1082, y: 382 },                       // the hearth's flames
        sparks: { x1: 1000, x2: 1170, y1: 392, y2: 426, top: 170, left: 900, right: 1200 },   // where sparks start / die (the arch)
        candle: { x: 996, y: 393 },                       // the candle flame's foot
        cauldron: { x: 1082, y: 232, w: 26 },             // the cauldron's rim
        mug: { x: 800, y: 360, w: 70 },                   // the foam's top
        room: { x: 1050, y: 440 }                         // the middle of the fire's light on the wall and the table
    };
    const L = { titleX: 64, titleY: 132, ruleY: 196, ruleX1: 70, ruleX2: 400, subY: 222, menuX: 88, rows: [340, 388, 454, 500], saveY: 412, keysY: 692 };
    const C = {
        text: "#ece6da", muted: "#b8b0a2", off: "#6a645c", accent: "#e0a43a", sub: "#e8d4b0", rule: "#c99a3a",
        gold: ["#fff0b8", "#f0cc6a", "#c99a3a", "#f0cc6a", "#8a6420"], outline: "#1a0e06"
    };

    // ------------------------------------------------------------------
    // Fonts: own faces, loaded once without FontManager (a missing file must not stop the game; the letters wait for them a moment)
    // ------------------------------------------------------------------
    const FACES = {
        gothic: ["TwTitleGothic", "PirataOne-Regular.ttf", {}],
        serif: ["TwTitleSerif", "EBGaramond-Variable.ttf", { weight: "400 800" }],
        bold: ["TwTitleSansBold", "AlegreyaSans-Bold.ttf", {}],
        sans: ["TwTitleSans", "AlegreyaSans-Regular.ttf", {}]
    };
    const faceState = {};
    function loadFaces() {
        for (const k in FACES) {
            if (faceState[k]) continue;
            faceState[k] = "loading";
            try {
                const f = new FontFace(FACES[k][0], "url(fonts/" + FACES[k][1] + ")", FACES[k][2]);
                f.load().then(() => { document.fonts.add(f); faceState[k] = "ok"; }, () => { faceState[k] = "error"; });
            } catch (e) { faceState[k] = "error"; }
        }
    }
    loadFaces();
    const facesReady = () => Object.keys(FACES).every(k => faceState[k] === "ok" || faceState[k] === "error");
    const mainFace = () => (window.$gameSystem && $gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "rmmz-mainfont");
    const face = kind => (faceState[kind] === "ok" ? '"' + FACES[kind][0] + '", ' : "") + mainFace();

    // ------------------------------------------------------------------
    // Small pictures drawn once (kept for the whole game: the scene never destroys them)
    // ------------------------------------------------------------------
    const pics = {};
    function pic(kind) {
        if (pics[kind]) return pics[kind];
        let b;
        const radial = (size, stops) => {
            b = new Bitmap(size, size);
            const ctx = b.context, r = size / 2, g = ctx.createRadialGradient(r, r, 0, r, r, r);
            for (const [at, col] of stops) g.addColorStop(at, col);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, size, size);
        };
        if (kind === "glow") radial(128, [[0, "rgba(255,190,100,0.95)"], [0.35, "rgba(255,140,50,0.45)"], [1, "rgba(255,110,30,0)"]]);
        else if (kind === "room") radial(256, [[0, "rgba(255,150,60,0.55)"], [0.5, "rgba(255,120,40,0.22)"], [1, "rgba(255,100,30,0)"]]);
        else if (kind === "candle") radial(96, [[0, "rgba(255,220,140,0.9)"], [0.3, "rgba(255,170,70,0.4)"], [1, "rgba(255,140,50,0)"]]);
        else if (kind === "steam") radial(48, [[0, "rgba(255,246,236,0.55)"], [0.6, "rgba(255,240,226,0.2)"], [1, "rgba(255,236,220,0)"]]);
        else if (kind === "flame") {   // a soft teardrop over the painted flame (it brightens and trembles; the picture's flame stays the shape)
            b = new Bitmap(16, 32);
            const ctx = b.context, g = ctx.createRadialGradient(8, 22, 1, 8, 20, 14);
            g.addColorStop(0, "rgba(255,250,220,0.95)"); g.addColorStop(0.45, "rgba(255,200,90,0.6)"); g.addColorStop(1, "rgba(255,140,40,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(8, 1);
            ctx.bezierCurveTo(13, 12, 15, 20, 8, 31);
            ctx.bezierCurveTo(1, 20, 3, 12, 8, 1);
            ctx.fill();
        } else if (kind === "spark" || kind === "spark2" || kind === "spark3") {
            const s = kind === "spark3" ? 3 : 2;
            b = new Bitmap(s, s);
            b.fillRect(0, 0, s, s, kind === "spark2" ? "#ff9a3a" : "#ffd27a");
        }
        b._baseTexture.update();
        return (pics[kind] = b);
    }

    // smooth wavering 0..1 (sum of slow sines, no two alike): the light of a fire
    const waver = (t, a, b, c) => 0.5 + 0.22 * Math.sin(t * 0.071 + a) + 0.14 * Math.sin(t * 0.193 + b) + 0.09 * Math.sin(t * 0.47 + c) + 0.05 * Math.sin(t * 1.13 + a * 2);
    const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
    const rnd = (a, b) => a + Math.random() * (b - a);

    // ------------------------------------------------------------------
    // The living picture: the fire's light, sparks, the candle, steam
    // ------------------------------------------------------------------
    function Sprite_TitleHearth() {
        this.initialize(...arguments);
    }
    Sprite_TitleHearth.prototype = Object.create(Sprite.prototype);
    Sprite_TitleHearth.prototype.constructor = Sprite_TitleHearth;
    Sprite_TitleHearth.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._t = 0;
        this._sparks = [];
        this._steam = [];
        this._back = new Sprite();   // steam under the lights
        this.addChild(this._back);
        const add = (kind, x, y, ax, ay) => {
            const s = new Sprite(pic(kind));
            s.anchor.set(ax === undefined ? 0.5 : ax, ay === undefined ? 0.5 : ay);
            s.x = x; s.y = y;
            s.blendMode = PIXI.BLEND_MODES.ADD;
            this.addChild(s);
            return s;
        };
        this._room = add("room", SPOT.room.x, SPOT.room.y);
        this._fire = add("glow", SPOT.fire.x, SPOT.fire.y);
        this._candleGlow = add("candle", SPOT.candle.x, SPOT.candle.y - 14);
        this._flame = add("flame", SPOT.candle.x, SPOT.candle.y, 0.5, 1);
        this._front = new Sprite();  // sparks over the lights
        this.addChild(this._front);
        this.update();
    };
    Sprite_TitleHearth.prototype.spawn = function(layer, kind, o) {
        const s = new Sprite(pic(kind));
        s.anchor.set(0.5, 0.5);
        s.blendMode = kind === "steam" ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.ADD;
        Object.assign(s, o, { _age: 0 });
        s.x = o._x; s.y = o._y;
        layer.addChild(s);
        return s;
    };
    Sprite_TitleHearth.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const t = ++this._t;
        // the hearth: its glow and the light it throws on the wall and the table waver together, the candle on its own, quicker
        const f = waver(t, 0.3, 1.7, 4.1);
        this._fire.scale.set(3.3 + 0.35 * f, 2.3 + 0.3 * f);
        this._fire.opacity = Math.round(95 + 95 * f);
        this._room.scale.set(5.2, 3.4);
        this._room.opacity = Math.round(26 + 34 * waver(t * 0.8, 2.2, 0.4, 3.3));
        const c = waver(t * 1.9, 5.1, 2.6, 0.9);
        this._candleGlow.opacity = Math.round(110 + 90 * c);
        this._candleGlow.scale.set(1.05 + 0.15 * c);
        this._flame.opacity = Math.round(120 + 90 * c);
        this._flame.scale.set(0.92 + 0.12 * Math.sin(t * 0.37 + c), 0.9 + 0.2 * c);
        this._flame.x = SPOT.candle.x + Math.round(Math.sin(t * 0.11) * 0.8 + (c - 0.5));
        // sparks from the logs: up the arch, wobbling, fading
        const S = SPOT.sparks;
        if (this._sparks.length < 48 && Math.random() < 0.32 + 0.25 * f) {
            const kind = Math.random() < 0.12 ? "spark3" : Math.random() < 0.45 ? "spark2" : "spark";
            this._sparks.push(this.spawn(this._front, kind, { _x: rnd(S.x1, S.x2), _y: rnd(S.y1, S.y2), _vx: rnd(-0.25, 0.25), _vy: -rnd(0.8, 1.9), _life: Math.round(rnd(45, 110)), _ph: rnd(0, 6.3) }));
        }
        for (const s of this._sparks) {
            s._age++;
            s._vy *= 0.991;
            s.x += s._vx + Math.sin(s._age * 0.14 + s._ph) * 0.35;
            s.y += s._vy;
            const k = s._age / s._life;
            s.opacity = Math.round(255 * Math.pow(Math.max(0, 1 - k), 0.7) * (0.75 + 0.25 * Math.sin(s._age * 0.6 + s._ph)));
        }
        this._sparks = this.drop(this._sparks, s => s._age >= s._life || s.y < S.top || s.x < S.left || s.x > S.right);
        // steam: over the cauldron (in the fire's draught), very faint over the tankard
        if (t % 16 === 0 && this._steam.length < 24) {
            const P = SPOT.cauldron;
            this._steam.push(this.spawn(this._back, "steam", { _x: P.x + rnd(-P.w, P.w), _y: P.y, _vx: rnd(-0.12, 0.12), _vy: -rnd(0.32, 0.5), _life: Math.round(rnd(140, 200)), _ph: rnd(0, 6.3), _max: rnd(60, 95), _grow: rnd(0.9, 1.5) }));
        }
        if (t % 34 === 0 && this._steam.length < 24) {
            const P = SPOT.mug;
            this._steam.push(this.spawn(this._back, "steam", { _x: P.x + rnd(-P.w, P.w), _y: P.y, _vx: rnd(-0.08, 0.08), _vy: -rnd(0.18, 0.3), _life: Math.round(rnd(120, 170)), _ph: rnd(0, 6.3), _max: rnd(22, 36), _grow: rnd(0.8, 1.2) }));
        }
        for (const s of this._steam) {
            s._age++;
            const k = s._age / s._life;
            s.x += s._vx + Math.sin(s._age * 0.035 + s._ph) * 0.22;
            s.y += s._vy;
            s.scale.set(0.5 + k * s._grow);
            s.opacity = Math.round(s._max * (k < 0.2 ? k / 0.2 : (1 - k) / 0.8));
        }
        this._steam = this.drop(this._steam, s => s._age >= s._life);
    };
    Sprite_TitleHearth.prototype.drop = function(list, gone) {
        const keep = [];
        for (const s of list) {
            if (gone(s)) s.parent.removeChild(s);
            else keep.push(s);
        }
        return keep;
    };

    // ------------------------------------------------------------------
    // The letters: "Tawerna" in gold gothic, the rule, the line under it (drawn when the fonts are there)
    // ------------------------------------------------------------------
    function Sprite_TitleName() {
        this.initialize(...arguments);
    }
    Sprite_TitleName.prototype = Object.create(Sprite.prototype);
    Sprite_TitleName.prototype.constructor = Sprite_TitleName;
    Sprite_TitleName.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(640, 280));
        this._drawn = false;
        this._waited = 0;
        this.y = 0;
        this.redraw();
    };
    Sprite_TitleName.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!this._drawn && (facesReady() || ++this._waited > 120)) this.redraw();
    };
    Sprite_TitleName.prototype.redraw = function() {
        const b = this.bitmap, ctx = b.context;
        b.clear();
        if (!facesReady() && this._waited <= 120) return;
        this._drawn = true;
        const name = ($dataSystem && $dataSystem.gameTitle) || "Tawerna";
        const x = L.titleX, y = L.titleY;
        ctx.save();
        ctx.font = '120px ' + face("gothic");
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";
        const m = ctx.measureText(name), top = y - 52, bottom = y + 44;
        // the fire's glow round the letters, then the dark edge, the gold, a light edge on top of each letter
        ctx.shadowColor = "rgba(255,176,80,0.55)";
        ctx.shadowBlur = 26;
        ctx.fillStyle = "#6a4a14";
        ctx.fillText(name, x, y);
        ctx.shadowColor = "rgba(0,0,0,0)";
        ctx.shadowBlur = 0;
        ctx.strokeStyle = C.outline;
        ctx.lineWidth = 6;
        ctx.strokeText(name, x, y);
        const g = ctx.createLinearGradient(0, top, 0, bottom);
        [0, 0.18, 0.5, 0.62, 1].forEach((at, i) => g.addColorStop(at, C.gold[i]));
        ctx.fillStyle = g;
        ctx.fillText(name, x, y);
        const edge = document.createElement("canvas");
        edge.width = b.width; edge.height = b.height;
        const e = edge.getContext("2d");
        e.font = ctx.font; e.textBaseline = "middle";
        e.fillStyle = C.gold[0];
        e.fillText(name, x, y);
        e.globalCompositeOperation = "destination-out";
        e.fillText(name, x, y + 2);
        ctx.globalAlpha = 0.65;
        ctx.drawImage(edge, 0, 0);
        ctx.globalAlpha = 1;
        // the rule with a little diamond at its end
        const rx2 = Math.max(L.ruleX2, x + m.width - 30);
        ctx.fillStyle = C.rule;
        ctx.fillRect(L.ruleX1, L.ruleY, rx2 - L.ruleX1, 1);
        ctx.beginPath();
        ctx.moveTo(rx2 + 10, L.ruleY - 5); ctx.lineTo(rx2 + 15, L.ruleY); ctx.lineTo(rx2 + 10, L.ruleY + 5); ctx.lineTo(rx2 + 5, L.ruleY);
        ctx.closePath();
        ctx.fill();
        // the line under it
        ctx.font = '22px ' + face("serif");
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.strokeText(SUBTITLE, L.ruleX1, L.subY);
        ctx.fillStyle = C.sub;
        ctx.fillText(SUBTITLE, L.ruleX1, L.subY);
        ctx.restore();
        b._baseTexture.update();
    };

    // ------------------------------------------------------------------
    // The menu: four rows drawn from the (invisible) command window; a copper bar glides to the chosen one
    // ------------------------------------------------------------------
    function saveLine() {
        if (!DataManager.isAnySavefileExists()) return { text: "brak zapisanej gry", ok: false };
        const id = DataManager.latestSavefileId(), info = DataManager.savefileInfo(id) || {};
        const parts = [];
        if (info.day) parts.push("Dzień " + info.day);
        if (info.season) parts.push(String(info.season).toLowerCase());
        if (info.place) parts.push(info.place);
        if (!parts.length && info.playtime) parts.push("czas gry " + info.playtime);
        return { text: parts.join(" · ") || "zapisana gra", ok: true, id };
    }
    function Sprite_TitleMenu() {
        this.initialize(...arguments);
    }
    Sprite_TitleMenu.prototype = Object.create(Sprite.prototype);
    Sprite_TitleMenu.prototype.constructor = Sprite_TitleMenu;
    Sprite_TitleMenu.prototype.initialize = function(win) {
        Sprite.prototype.initialize.call(this);
        this._win = win;
        this._save = saveLine();
        this._key = "";
        this._rows = new Sprite(new Bitmap(520, 220));
        this._rows.x = L.menuX - 28; this._rows.y = L.rows[0] - 40;
        this._bar = new Sprite(new Bitmap(4, 24));
        this._bar.bitmap.fillRect(0, 0, 3, 24, C.accent);
        this._bar.anchor.set(0, 0.5);
        this._bar.x = L.menuX - 18;
        this._barY = L.rows[Math.max(0, win.index())];
        this._bar.y = this._barY;
        this._keys = new Sprite(new Bitmap(420, 30));
        this._keys.x = L.ruleX1; this._keys.y = L.keysY - 15;
        this.addChild(this._rows);
        this.addChild(this._bar);
        this.addChild(this._keys);
        this.drawKeys();
    };
    Sprite_TitleMenu.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const w = this._win, i = w.index();
        const key = [i, (w._list || []).map(c => c.enabled ? 1 : 0).join(""), facesReady() ? 1 : 0].join("|");
        if (key !== this._key) { this._key = key; this.redraw(); }
        const to = L.rows[Math.max(0, i)] || L.rows[0];
        this._barY += (to - this._barY) * 0.32;
        if (Math.abs(to - this._barY) < 0.5) this._barY = to;
        this._bar.y = Math.round(this._barY);
        this._bar.visible = i >= 0;
    };
    Sprite_TitleMenu.prototype.redraw = function() {
        const b = this._rows.bitmap, ctx = b.context, w = this._win, ox = this._rows.x, oy = this._rows.y;
        b.clear();
        ctx.save();
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";
        (w._list || []).forEach((cmd, k) => {
            const on = k === w.index(), x = L.menuX - ox, y = L.rows[k] - oy;
            ctx.font = (on ? "26px " + face("bold") : "24px " + face("sans"));
            ctx.lineWidth = 4;
            ctx.strokeStyle = "rgba(0,0,0,0.55)";
            ctx.strokeText(cmd.name, x, y);
            ctx.fillStyle = !cmd.enabled ? C.off : on ? C.text : C.muted;
            ctx.fillText(cmd.name, x, y);
            if (cmd.symbol === "continue") {
                ctx.font = "15px " + face("sans");
                ctx.lineWidth = 3;
                ctx.strokeText(this._save.text, x, L.saveY - oy);
                ctx.fillStyle = cmd.enabled ? C.accent : C.off;
                ctx.fillText(this._save.text, x, L.saveY - oy);
            }
        });
        ctx.restore();
        b._baseTexture.update();
    };
    // the keys' hints: [W/S] wybierz  [O] zatwierdź
    Sprite_TitleMenu.prototype.drawKeys = function() {
        const b = this._keys.bitmap, ctx = b.context;
        b.clear();
        ctx.save();
        ctx.textBaseline = "middle";
        ctx.font = "14px " + face("sans");
        let x = 0;
        for (const [k, label] of [["W/S", "wybierz"], ["O", "zatwierdź"]]) {
            const kw = Math.max(22, Math.ceil(ctx.measureText(k).width) + 12);
            ctx.fillStyle = "rgba(20,21,24,0.67)";
            ctx.strokeStyle = "rgba(90,92,100,0.8)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x + 0.5, 4.5, kw, 22, 4); else ctx.rect(x + 0.5, 4.5, kw, 22);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = C.text;
            ctx.textAlign = "center";
            ctx.fillText(k, x + kw / 2 + 0.5, 16);
            ctx.textAlign = "left";
            ctx.fillStyle = C.muted;
            ctx.fillText(label, x + kw + 6, 16);
            x += kw + 6 + Math.ceil(ctx.measureText(label).width) + 18;
        }
        ctx.restore();
        b._baseTexture.update();
    };

    // ------------------------------------------------------------------
    // The scene
    // ------------------------------------------------------------------
    Scene_Title.prototype.createBackground = function() {
        this._backSprite1 = new Sprite(ImageManager.loadTitle1(IMAGE));
        this._backSprite2 = new Sprite(new Bitmap(1, 1));
        this.addChild(this._backSprite1);
        this.addChild(this._backSprite2);
        this._tsHearth = new Sprite_TitleHearth();
        this.addChild(this._tsHearth);
    };
    Scene_Title.prototype.createForeground = function() {
        this._gameTitleSprite = new Sprite_TitleName();
        this.addChild(this._gameTitleSprite);
    };
    Scene_Title.prototype.commandWindowRect = function() {
        // the rows' area, in the window layer's coordinates (the layer may sit a few pixels in from the screen's edge)
        const lx = (Graphics.width - Graphics.boxWidth) / 2, ly = (Graphics.height - Graphics.boxHeight) / 2;
        return new Rectangle(L.menuX - 30 - lx, L.rows[0] - 26 - ly, 440, L.rows[3] - L.rows[0] + 52);
    };
    const _createCommandWindow = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function() {
        _createCommandWindow.call(this);
        const w = this._commandWindow;
        w.setHandler("exit", this.commandExit.bind(this));
        w.opacity = 0;
        w.backOpacity = 0;
        w.contentsOpacity = 0;
        w.frameVisible = false;
        w.cursorVisible = false;
        this._tsMenu = new Sprite_TitleMenu(w);
        this.addChild(this._tsMenu);
        // back from the save list or the options: everything is there at once; the first time it all comes out of the dark
        this._tsIntro = SceneManager.isPreviousScene(Scene_Load) || SceneManager.isPreviousScene(Scene_Options) ? 999 : 0;
        this.updateIntro();
    };
    Scene_Title.prototype.commandExit = function() {
        this._commandWindow.close();
        this.fadeOutAll();
        this._tsExiting = true;
    };
    const _update = Scene_Title.prototype.update;
    Scene_Title.prototype.update = function() {
        _update.call(this);
        this.updateIntro();
        if (this._tsExiting && !this.isFading()) {
            this._tsExiting = false;
            SceneManager.exit();
        }
    };
    // the letters and the menu come out of the dark after the picture: the name rises a little, the rows slide in one by one
    Scene_Title.prototype.updateIntro = function() {
        const t = this._tsIntro = (this._tsIntro || 0) + 1;
        const name = this._gameTitleSprite, menu = this._tsMenu;
        const k = ease((t - 12) / 50);
        if (name) { name.opacity = Math.round(255 * k); name.y = Math.round(10 * (1 - k)); }
        if (menu) {
            const km = ease((t - 40) / 34);
            menu.opacity = Math.round(255 * km);
            menu.x = Math.round(-14 * (1 - km));
            menu._keys.opacity = Math.round(255 * ease((t - 80) / 30));
        }
    };

    // ------------------------------------------------------------------
    // The command window: four commands, draws nothing (the menu sprite does), its rows where the sprite draws them; the grey
    // "Kontynuuj" (no save yet) is skipped by the keys and the mouse
    // ------------------------------------------------------------------
    Window_TitleCommand.prototype.makeCommandList = function() {
        this.addCommand("Nowa gra", "newGame");
        this.addCommand("Kontynuuj", "continue", this.isContinueEnabled());
        this.addCommand("Opcje", "options");
        this.addCommand("Wyjdź", "exit");
    };
    Window_TitleCommand.prototype.maxCols = function() {
        return 1;
    };
    Window_TitleCommand.prototype.updatePadding = function() {
        this.padding = 0;
    };
    // (the window's top is at L.rows[0] - 26 on the screen - commandWindowRect; "Kontynuuj" takes its save line in too)
    Window_TitleCommand.prototype.itemRect = function(index) {
        const cy = L.rows[index] !== undefined ? L.rows[index] : L.rows[0];
        return new Rectangle(0, cy - 22 - (L.rows[0] - 26), this.innerWidth, index === 1 ? 56 : 44);
    };
    Window_TitleCommand.prototype.drawItem = function() {};
    Window_TitleCommand.prototype.drawAllItems = function() {};
    const usable = (w, i) => !!(w._list && w._list[i] && w._list[i].enabled);
    const _select = Window_TitleCommand.prototype.select;
    Window_TitleCommand.prototype.select = function(index) {
        if (this._list && index >= 0 && !usable(this, index) && this.index() >= 0) return;   // (the grey one is passed over)
        _select.call(this, index);
    };
    function step(w, dir) {
        const n = w.maxItems();
        let i = w.index();
        for (let k = 0; k < n; k++) {
            i = (i + dir + n) % n;
            if (usable(w, i)) { w.smoothSelect(i); return; }
        }
    }
    Window_TitleCommand.prototype.cursorDown = function() { step(this, 1); };
    Window_TitleCommand.prototype.cursorUp = function() { step(this, -1); };
    Window_TitleCommand.prototype.cursorRight = function() {};
    Window_TitleCommand.prototype.cursorLeft = function() {};

    // ------------------------------------------------------------------
    // For tests: what the title shows
    // ------------------------------------------------------------------
    api.info = function() {
        const s = SceneManager._scene;
        if (!(s instanceof Scene_Title) || !s._tsMenu) return null;
        const w = s._commandWindow, bg = s._backSprite1.bitmap, h = s._tsHearth;
        return {
            image: bg ? bg._url : null, ready: !!(bg && bg.isReady()), size: bg && bg.isReady() ? [bg.width, bg.height] : null,
            items: (w._list || []).map(c => ({ label: c.name, symbol: c.symbol, enabled: !!c.enabled })),
            index: w.index(), symbol: w.currentSymbol(), open: w.isOpen(), active: w.active,
            save: s._tsMenu._save, fonts: Object.assign({}, faceState), named: !!s._gameTitleSprite._drawn,
            t: h._t, sparks: h._sparks.length, steam: h._steam.length,
            fire: h._fire.opacity, room: h._room.opacity, candle: { opacity: h._flame.opacity, sy: +h._flame.scale.y.toFixed(3), x: h._flame.x },
            intro: s._tsIntro, nameOpacity: s._gameTitleSprite.opacity, menuOpacity: s._tsMenu.opacity, barY: s._tsMenu._bar.y,
            rows: L.rows.slice(), exiting: !!s._tsExiting
        };
    };
})();
