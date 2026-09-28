//=============================================================================
// TavernShift.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Praca w tawernie „Pod Złotym Kuflem”: zmiana jako mini-gra w czterech częściach (sprzątanie i drewno, nalewanie piwa, kuchnia w rytm, obsługa sali). v1.0.0
 * @author Claude
 * @orderAfter UITheme
 *
 * @param hours
 * @text Godziny zmiany
 * @desc Ile godzin gry mija podczas jednej zmiany.
 * @type number
 * @decimals 1
 * @min 0
 * @default 4
 *
 * @param stamina
 * @text Koszt wytrzymałości
 * @desc Ile wytrzymałości zabiera cała zmiana.
 * @type number
 * @min 0
 * @default 30
 *
 * @param baseWage
 * @text Dniówka (G)
 * @desc Stała zapłata za zmianę; rośnie o 3 G z każdym poziomem trudności. Premie i napiwki dochodzą do niej.
 * @type number
 * @min 0
 * @default 15
 *
 * @param tipScale
 * @text Napiwki (%)
 * @desc Mnożnik napiwków gości (100 = jak w grze; mniej = biedniejsi goście).
 * @type number
 * @min 0
 * @default 100
 *
 * @param payVariable
 * @text Zmienna: zarobek
 * @desc Po zmianie trafia tu cały zarobek (zapłata + napiwki). 0 = żadna.
 * @type variable
 * @default 0
 *
 * @param gradeVariable
 * @text Zmienna: ocena
 * @desc Po zmianie trafia tu ocena 1-5 (0 = zmiana przerwana). 0 = żadna.
 * @type variable
 * @default 0
 *
 * @param endCommonEvent
 * @text Zdarzenie wspólne po zmianie
 * @desc Uruchamiane po powrocie na mapę. 0 = żadne.
 * @type common_event
 * @default 0
 *
 * @command start
 * @text Rozpocznij zmianę
 * @desc Zaczyna zmianę w tawernie (mini-gra). Po niej gra wraca na mapę, w to samo miejsce.
 *
 * @arg level
 * @text Trudność (0-5)
 * @desc Puste = według liczby przepracowanych zmian (każda kolejna jest trochę trudniejsza, do 5).
 * @type number
 * @min 0
 * @max 5
 * @default
 *
 * @help
 * ============================================================================
 * TavernShift.js - zmiana w tawernie jako mini-gra
 * ============================================================================
 * Bohater dorabia w tawernie „Pod Złotym Kuflem”. Jedna zmiana (ok. 4 minuty
 * gry) to cztery części, każda z krótką kartą z objaśnieniem:
 *
 *  1. Przed otwarciem - sprzątanie i drewno: lista zadań na czas. Przetrzyj
 *     brudne stoły (przytrzymaj O), przynieś polana ze stosu do kominka,
 *     wynieś worki ze śmieciami za drzwi.
 *  2. Beczka - nalewanie piwa: przytrzymaj O, puść, gdy piana dojdzie do
 *     żółtej kreski (piwo leci jeszcze chwilę po puszczeniu). Seria kufli.
 *  3. Kuchnia w rytm: kroki przepisu (kroić, mieszać, przyprawić, dorzucić,
 *     podać) przesuwają się do żółtej ramki; naciśnij właściwy klawisz
 *     (strzałki / WSAD, O) we właściwej chwili.
 *  4. Wieczór - obsługa sali: goście zamawiają (dymek z ikoną), bierzesz
 *     danie z lady (O) i zanosisz właściwemu gościowi (O). Szybko = napiwek;
 *     pomyłki i długie czekanie obniżają zapłatę. Po gościu przetrzyj stół,
 *     a gdy ogień przygasa, dorzuć drewna.
 *
 * Sterowanie: WSAD / strzałki - ruch, Shift - szybciej, O / Enter / Spacja -
 * akcja, P / Esc - pauza (można przerwać zmianę). Pad działa przez zwykłe
 * klawisze RPG Makera. W trakcie zmiany nie ma menu ani zapisu.
 *
 * Na koniec: zapłata (dniówka + premia za pracę - potrącenia), napiwki,
 * ocena 1-5 i to, co poszło dobrze i źle. Złoto trafia do sakiewki, mija
 * czas (parametr, 4 godziny) i schodzi wytrzymałość. Każda kolejna zmiana
 * jest trochę trudniejsza i lepiej płatna (poziom 0-5, zapisany w grze).
 * Części są ze sobą powiązane: drewno z pierwszej części pali się wieczorem
 * w kominku, a równo nalane piwo i dobrze ugotowane dania dają większe
 * napiwki na sali.
 *
 * Zarobek (zmierzony botem testowym, poziom 0): zmiana zawalona ok. 4 G,
 * niezła ok. 80 G, bezbłędna ok. 90 G; na poziomie 3-4 do ok. 140 G.
 * Dniówka i napiwki (%) są w parametrach.
 *
 * Dla fabuły (skrypt w zdarzeniu):
 *   TavernShift.start({ onEnd: function(wynik) { ... } });
 *   wynik = { pay, tips, total, grade (1-5), gradeName, score (0-100),
 *             level, shift, aborted, hours, stamina, good: [...], bad: [...],
 *             parts: { clean, beer, kitchen, serve } }
 * onEnd jest wołane po powrocie na mapę. Opcje start: level (0-5), parts
 * (np. ["beer", "serve"]), intro (tekst Borgara na pierwszej karcie).
 *   TavernShift.canStart()  - null albo powód, dla którego lepiej nie iść
 *   TavernShift.stats()     - { done, best, earned, last }
 * Bez skryptu: polecenie wtyczki „Rozpocznij zmianę” + zmienne z parametrów
 * (zarobek, ocena) i zdarzenie wspólne po zmianie.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "TavernShift";
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const HOURS = num(params.hours, 4);
    const STAMINA = num(params.stamina, 30);
    const BASE_WAGE = num(params.baseWage, 15);
    const TIP_SCALE = num(params.tipScale, 100) / 100;
    const PAY_VAR = num(params.payVariable, 0);
    const GRADE_VAR = num(params.gradeVariable, 0);
    const END_CE = num(params.endCommonEvent, 0);
    const TILESET_ID = 3;   // "Wewnątrz": the tavern's own tileset (Map001)
    const MAX_LEVEL = 5;
    const T = 48;           // tile

    // ==================================================================
    // Style: the game's black + bright yellow (UITheme.js's window.UIStyle), with a fallback
    // ==================================================================
    const FALLBACK = {
        fill: "rgba(11,12,15,0.9)", solid: "#0b0c0f", line: "#3a3e46", accent: "#ffd23f", accentDim: "#c9a12a",
        text: "#eceef0", muted: "#8a9099", trough: "#16181c",
        panel(ctx, x, y, w, h, o) {
            o = o || {};
            ctx.save(); ctx.fillStyle = o.fill || FALLBACK.fill; ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = o.line || FALLBACK.line; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.restore();
        },
        bar(ctx, x, y, w, h, r, c) {
            ctx.fillStyle = FALLBACK.line; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
            ctx.fillStyle = FALLBACK.trough; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = c; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, r))), h);
        }
    };
    const ST = () => window.UIStyle || FALLBACK;
    const GOOD = "#8ee08a", BAD = "#ff7b6b", WARN = "#ffb347", BLUE = "#8fc7ff", GOLD_ICON = 313;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const scoreColour = s => (s >= 85 ? ST().accent : s >= 60 ? GOOD : s >= 35 ? WARN : BAD);

    function makeRng(seed) {   // mulberry32
        let a = (seed >>> 0) || 1;
        return () => {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function shuffle(list, rng) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function se(name, volume, pitch) {
        if (name) AudioManager.playSe({ name, volume: volume || 80, pitch: pitch || 100, pan: 0 });
    }

    // ---- drawing on bitmaps
    function dirty(b) { if (b && b._baseTexture) b._baseTexture.update(); }
    function panel(b, x, y, w, h, o) { ST().panel(b.context, x, y, w, h, o); dirty(b); }
    function bar(b, x, y, w, h, r, c) { ST().bar(b.context, x, y, w, h, r, c); dirty(b); }
    function font(b, size, colour, bold, outline) {
        b.fontSize = size;
        b.textColor = colour || ST().text;
        b.fontBold = !!bold;
        b.outlineWidth = outline || 1;
        b.outlineColor = outline ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0)";
    }
    function txt(b, s, x, y, w, o) {
        o = o || {};
        const size = o.size || 22;
        font(b, size, o.color, o.bold, o.outline);
        b.drawText(String(s), x, y, w, o.lh || Math.round(size * 1.35), o.align || "left");
        b.fontBold = false;
    }
    function measure(b, s, size, bold) { font(b, size, null, bold); const w = b.measureTextWidth(String(s)); b.fontBold = false; return w; }
    function wrapLines(b, s, w, size, bold) {
        const out = [];
        for (const para of String(s).split("\n")) {
            let cur = "";
            for (const word of para.split(" ")) {
                const test = cur ? cur + " " + word : word;
                if (cur && measure(b, test, size, bold) > w) { out.push(cur); cur = word; } else cur = test;
            }
            out.push(cur);
        }
        return out;
    }
    function icon(b, index, x, y, size) {
        if (!(index > 0)) return;
        const set = ImageManager.loadSystem("IconSet"), pw = ImageManager.iconWidth, ph = ImageManager.iconHeight;
        b.context.imageSmoothingEnabled = false;
        b.blt(set, (index % 16) * pw, Math.floor(index / 16) * ph, pw, ph, x, y, size || pw, size || ph);
    }
    // an arrow: dir "left" | "up" | "right" | "down", centred on (cx, cy), s = its size
    function arrow(ctx, dir, cx, cy, s, colour) {
        const a = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir] || 0;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 0); ctx.lineTo(0, -s * 0.45); ctx.lineTo(0, -s * 0.17); ctx.lineTo(-s * 0.5, -s * 0.17);
        ctx.lineTo(-s * 0.5, s * 0.17); ctx.lineTo(0, s * 0.17); ctx.lineTo(0, s * 0.45); ctx.closePath();
        ctx.fillStyle = colour; ctx.fill();
        ctx.restore();
    }
    // a key cap: label = "O", "P", "Shift" or an arrow name; returns its width
    function keyCap(b, label, x, y, h, colour) {
        h = h || 26;
        const isArrow = ["left", "up", "right", "down"].includes(label);
        const size = Math.round(h * 0.6);
        const w = isArrow ? h : Math.max(h, Math.ceil(measure(b, label, size, true)) + 14);
        ST().panel(b.context, x, y, w, h, { cut: 3, fill: "rgba(28,30,36,0.96)", line: "#5d636e", accent: false });
        if (isArrow) arrow(b.context, label, x + w / 2, y + h / 2, h * 0.56, colour || ST().accent);
        dirty(b);
        if (!isArrow) txt(b, label, x, y + Math.round((h - size * 1.35) / 2), w, { size, color: colour || ST().accent, bold: true, align: "center" });
        return w;
    }
    // a row of hints: [[cap or [caps], text], ...]; returns the width used
    function keyHints(b, rows, x, y, h, size) {
        let cx = x;
        for (const [caps, text] of rows) {
            for (const c of [].concat(caps)) cx += keyCap(b, c, cx, y, h) + 3;
            cx += 5;
            txt(b, text, cx, y + Math.round((h - size * 1.35) / 2), 400, { size, color: ST().text });
            cx += Math.ceil(measure(b, text, size)) + 18;
        }
        return cx - x;
    }
    function shadowBitmap() {
        if (shadowBitmap._b) return shadowBitmap._b;
        const b = new Bitmap(30, 12), ctx = b.context;
        const g = ctx.createRadialGradient(15, 6, 1, 15, 6, 15);
        g.addColorStop(0, "rgba(0,0,0,0.42)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save(); ctx.scale(1, 0.4); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(15, 15, 15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        dirty(b);
        return (shadowBitmap._b = b);
    }
    // an empty canvas is not re-uploaded by Chromium (the old picture stays on screen), so an empty sprite is hidden instead
    function showIf(sprite, on) { sprite.visible = !!on; }
    function solidBitmap(colour) {
        const b = new Bitmap(4, 4);
        b.fillAll(colour);
        return b;
    }

    // ==================================================================
    // Data: dishes, recipes, steps, difficulty
    // ==================================================================
    const DISHES = {
        beer:   { name: "Piwo", item: 81, icon: 337, tip: 2, q: "beer", weight: 34 },
        bread:  { name: "Chleb", item: 83, icon: 339, tip: 1, weight: 16 },
        stew:   { name: "Gulasz", item: 130, icon: 392, tip: 3, q: "kitchen", weight: 20 },
        soup:   { name: "Zupa grzybowa", item: 132, icon: 394, tip: 3, q: "kitchen", weight: 16 },
        cheese: { name: "Ser", item: 124, icon: 384, tip: 2, weight: 9 },
        mead:   { name: "Miód pitny", item: 137, icon: 399, tip: 3, weight: 5 }
    };
    const MENU_ORDER = ["beer", "bread", "stew", "soup", "cheese", "mead"];
    function dishIcon(key) {
        const d = DISHES[key], it = d && window.$dataItems && $dataItems[d.item];
        return it && it.iconIndex ? it.iconIndex : d ? d.icon : 0;
    }
    const STEPS = {
        cut:   { key: "left",  name: "Kroić",      icon: 347, colour: "#ff8f7f", se: ["Slash1", 55, 140] },
        stir:  { key: "up",    name: "Mieszać",    icon: 403, colour: "#8fc7ff", se: ["Water2", 50, 130] },
        spice: { key: "right", name: "Przyprawić", icon: 413, colour: "#8ee08a", se: ["Sand", 60, 150] },
        add:   { key: "down",  name: "Dorzucić",   icon: 327, colour: "#ffb347", se: ["Water1", 50, 100] },
        serve: { key: "ok",    name: "Podać",      icon: 0,   colour: "#ffd23f", se: ["Item3", 60, 110] }
    };
    const STEP_ORDER = ["cut", "stir", "spice", "add", "serve"];
    const RECIPES = {
        stew:     { name: "Gulasz", icon: 392, add: 326, steps: "cut:0 cut:1 cut:2 add:3 stir:4 stir:5 spice:6 serve:8" },
        soup:     { name: "Zupa grzybowa", icon: 394, add: 359, steps: "cut:0 cut:1 add:2 add:3 stir:4 spice:5 stir:6 serve:8" },
        eggs:     { name: "Jajecznica", icon: 363, add: 330, steps: "add:0 stir:1 stir:2 spice:3 serve:5" },
        cabbage:  { name: "Kapuśniak", icon: 393, add: 328, steps: "cut:0 cut:0.5 cut:1 add:2 stir:3 stir:3.5 spice:4 serve:6" },
        potatoes: { name: "Pieczone ziemniaki", icon: 364, add: 326, steps: "add:0 cut:1 cut:1.5 cut:2 spice:3 add:4 serve:6" }
    };
    const PART_DEFS = {
        clean:   { title: "Przed otwarciem", sub: "sprzątanie i drewno", weight: 0.2, bonus: 8 },
        beer:    { title: "Beczka", sub: "nalewanie piwa na czas", weight: 0.2, bonus: 8 },
        kitchen: { title: "Kuchnia w rytm", sub: "gotowanie do taktu", weight: 0.2, bonus: 8 },
        serve:   { title: "Wieczór", sub: "obsługa sali", weight: 0.4, bonus: 16 }
    };
    const PART_ORDER = ["clean", "beer", "kitchen", "serve"];
    const GRADES = [
        null,
        { name: "Katastrofa", say: "Coś ty tu wyprawiał?! Masz parę groszy na chleb i idź się wyspać." },
        { name: "Słabiutko", say: "Oj, słabo. Goście narzekali, a ja sprzątałem po tobie. Jutro się popraw." },
        { name: "Da się wytrzymać", say: "Może być. Następnym razem żwawiej, dobra?" },
        { name: "Porządna robota", say: "Dobra robota! Parę drobiazgów, ale goście wyszli zadowoleni." },
        { name: "Mistrz kufla", say: "No, no! Tak się robi. Dorzucam coś ekstra - i jutro też cię biorę." }
    ];
    const gradeOf = s => (s >= 88 ? 5 : s >= 72 ? 4 : s >= 52 ? 3 : s >= 32 ? 2 : 1);

    function levelCfg(L) {
        return {
            clean: {
                time: Math.round((50 - 1.5 * L) * 60),
                tables: Math.min(6, 4 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0)),
                wood: 3,
                trash: Math.min(4, 2 + (L >= 3 ? 1 : 0)),
                wipe: 54
            },
            beer: { mugs: 6 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0), speed: 1 + 0.07 * L, pulseFrom: L >= 1 ? 3 : 4, pulseChance: 0.35 + 0.1 * L, wait: 420 },
            kitchen: {
                bpm: 84 + 6 * L,
                speed: 5.2 + 0.3 * L,
                dishes: L >= 4 ? ["stew", "cabbage", "potatoes", "soup"] : L >= 2 ? ["stew", "cabbage", "soup"] : ["stew", "soup", "eggs"]
            },
            serve: {
                time: 100 * 60,
                spawnEnd: 76 * 60,
                guests: 9 + 2 * L,
                patience: Math.round((26 - 1.5 * L) * 60),
                double: 0.1 + 0.06 * L,
                menu: ["beer", "bread", "stew", "soup"].concat(L >= 2 ? ["cheese"] : []).concat(L >= 4 ? ["mead"] : []),
                fireDecay: 1 / (26 * 60),
                eat: 240,
                wipe: 30
            }
        };
    }

    // ==================================================================
    // Tiles: the tavern tileset (the same pieces as Map001)
    // ==================================================================
    const SHEETS = { A1: 0, A2: 1, A3: 2, A4: 3, A5: 4, B: 5, C: 6, D: 7, E: 8 };
    const DEFAULT_SHEETS = ["Inside_A1", "Tawerna_A2", "", "Tawerna_A4", "Inside_A5", "Inside_B", "Inside_C", "Tawerna_D", ""];
    const tilesetNames = () => {
        const ts = window.$dataTilesets && $dataTilesets[TILESET_ID];
        return ts && ts.tilesetNames ? ts.tilesetNames : DEFAULT_SHEETS;
    };
    const sheet = k => tilesetNames()[SHEETS[k]] || DEFAULT_SHEETS[SHEETS[k]];
    const tB = (c, r) => (c >= 8 ? 128 : 0) + r * 8 + (c % 8);
    const tC = (c, r) => 256 + tB(c, r);
    const tD = (c, r) => 512 + tB(c, r);
    const FLOOR = 2863, PLANKS_H = 3247, WALL_IN = 6272;   // the tavern floor, horizontal boards (a counter top), the log wall's inside piece
    function tileSprite(k, col, row, cw, ch) {
        const s = new Sprite(ImageManager.loadTileset(sheet(k)));
        s.setFrame(col * T, row * T, (cw || 1) * T, (ch || 1) * T);
        return s;
    }
    // a Tilemap of cols x rows from ids(x, y) -> [layer0, layer1, layer2, layer3]
    function makeTilemap(cols, rows, ids) {
        const data = new Array(cols * rows * 6).fill(0);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const l = ids(x, y);
                for (let z = 0; z < 4; z++) data[(z * rows + y) * cols + x] = l[z] || 0;
            }
        }
        const tm = new Tilemap();
        tm.tileWidth = T;
        tm.tileHeight = T;
        tm.setData(cols, rows, data);
        tm.setBitmaps(tilesetNames().map(n => ImageManager.loadTileset(n)));
        const ts = window.$dataTilesets && $dataTilesets[TILESET_ID];
        tm.flags = ts ? ts.flags : [];
        tm.width = cols * T;
        tm.height = rows * T;
        tm.refresh();
        return tm;
    }

    // ==================================================================
    // Figures: the hero and the tavern people, drawn from their map sheets
    // ==================================================================
    const ROWS8 = { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 };
    const TO4 = { 1: 2, 2: 2, 3: 2, 4: 4, 5: 2, 6: 6, 7: 8, 8: 8, 9: 8 };
    function heroLook() {
        if (window.HeroLook && HeroLook.active && HeroLook.active()) return { name: "Hero_Walk", index: 0, eight: true };
        const a = $gameParty && $gameParty.leader();
        return { name: a ? a.characterName() : "Actor1", index: a ? a.characterIndex() : 0, eight: false };
    }
    const PEOPLE = {
        borgar: { name: "People3_Tall", index: 4 },
        melia: { name: "People2_Tall", index: 7 },
        // (not People2_Tall 4: that is Lord Zaleski of Story.js; People2_Tall 1 takes his place, so the shuffles stay as they were)
        guests: [
            { name: "Actor2_Tall", index: 4 }, { name: "People2_Tall", index: 0 }, { name: "People2_Tall", index: 1 },
            { name: "People2_Tall", index: 6 }, { name: "People2_Tall", index: 2 }, { name: "People2_Tall", index: 3 },
            { name: "People2_Tall", index: 5 }, { name: "People3_Tall", index: 5 }, { name: "People3_Tall", index: 6 },
            { name: "People3_Tall", index: 7 }, { name: "Actor2_Tall", index: 5 }, { name: "Actor2_Tall", index: 6 },
            { name: "Actor2_Tall", index: 7 }, { name: "People3_Tall", index: 3 }
        ]
    };
    class Figure extends Sprite {
        initialize(look) {
            super.initialize();
            this.look = look;
            this.shadow = new Sprite(shadowBitmap());
            this.shadow.anchor.set(0.5, 0.5);
            this.shadow.y = -3;
            this.addChild(this.shadow);
            this.body = new Sprite(ImageManager.loadCharacter(look.name));
            this.body.anchor.set(0.5, 1);
            this.addChild(this.body);
            this.dir = 2;
            this.step = 0;
            this.moving = false;
            this.refresh();
        }
        advance(dist) { this.step += dist / (this.look.eight ? 10.2 : 12); }
        refresh() {
            const b = this.body.bitmap;
            if (!b || !b.isReady()) return;
            if (this.look.eight) {
                const c = 64, cols = Math.max(2, Math.floor(b.width / c));
                const rows = (window.HeroLook && HeroLook.ROWS) || ROWS8;
                const col = this.moving ? 1 + (Math.floor(this.step) % (cols - 1)) : 0;
                this.body.setFrame(col * c, (rows[this.dir] || 0) * c, c, c);
            } else {
                const big = ImageManager.isBigCharacter(this.look.name);
                const pw = b.width / (big ? 3 : 12), ph = b.height / (big ? 4 : 8);
                const bx = big ? 0 : (this.look.index % 4) * 3, by = big ? 0 : Math.floor(this.look.index / 4) * 4;
                const pat = this.moving ? [1, 2, 1, 0][Math.floor(this.step) % 4] : 1;
                const row = ((TO4[this.dir] || 2) - 2) / 2;
                this.body.setFrame((bx + pat) * pw, (by + row) * ph, pw, ph);
            }
        }
    }
    function dirOf(dx, dy) {
        const sx = Math.sign(Math.round(dx * 100)), sy = Math.sign(Math.round(dy * 100));
        return { "-1,-1": 7, "0,-1": 8, "1,-1": 9, "-1,0": 4, "1,0": 6, "-1,1": 1, "0,1": 2, "1,1": 3 }[sx + "," + sy] || 2;
    }

    // ==================================================================
    // Small effects: floating words and particles (ticked, so they keep pace with the game logic)
    // ==================================================================
    class Floater extends Sprite {
        initialize(text, colour, size, iconIndex) {
            const tmp = new Bitmap(8, 8), s = size || 22;
            const w = Math.ceil(measure(tmp, text, s, true)) + 16 + (iconIndex ? 30 : 0);
            super.initialize(new Bitmap(w, s + 16));
            if (iconIndex) icon(this.bitmap, iconIndex, 4, Math.round((s + 16 - 26) / 2), 26);
            txt(this.bitmap, text, iconIndex ? 30 : 0, 2, w - (iconIndex ? 30 : 0), { size: s, color: colour || ST().text, bold: true, outline: 4, align: "center" });
            this.anchor.set(0.5, 1);
            this.life = 0;
            this.max = 64;
        }
        tick() {
            this.life++;
            this.y -= this.life < 20 ? 1.2 : 0.4;
            this.opacity = this.life > this.max - 18 ? 255 * (this.max - this.life) / 18 : 255;
            return this.life < this.max;
        }
    }
    class Particle extends Sprite {
        initialize(bitmap, vx, vy, life, grav) {
            super.initialize(bitmap);
            this.anchor.set(0.5, 0.5);
            this.vx = vx; this.vy = vy; this.life = 0; this.max = life; this.grav = grav || 0;
        }
        tick() {
            this.life++;
            this.x += this.vx; this.y += this.vy; this.vy += this.grav;
            this.opacity = 255 * (1 - this.life / this.max);
            return this.life < this.max;
        }
    }
    const DOT = {};
    const dotBitmap = colour => DOT[colour] || (DOT[colour] = solidBitmap(colour));

    // ==================================================================
    // Part: the common frame of the four parts
    // ==================================================================
    class Part {
        constructor(scene, id, cfg) {
            this.scene = scene;
            this.id = id;
            this.cfg = cfg;
            this.ctx = scene.ctx;
            this.rng = scene.rng;
            this.root = new Sprite();
            this.fxLayer = new Sprite();
            this.t = 0;
            this.done = false;
            this.result = null;
            this.good = [];
            this.bad = [];
            this.fx = [];
        }
        setup() { this.root.addChild(this.fxLayer); }
        tick() {}
        frame() {}
        hud() { return {}; }
        state() { return {}; }
        progress() { return 0; }
        tickFx() { this.fx = this.fx.filter(f => { const alive = f.tick(); if (!alive) { f.parent && f.parent.removeChild(f); f.destroy(); } return alive; }); }
        float(text, x, y, colour, size, iconIndex) {
            const f = new Floater(text, colour, size, iconIndex);
            f.x = x; f.y = y;
            this.fxLayer.addChild(f);
            this.fx.push(f);
        }
        burst(x, y, colour, n, spread, grav, parent) {
            for (let i = 0; i < n; i++) {
                const a = this.rng() * Math.PI * 2, v = (0.5 + this.rng()) * (spread || 1.5);
                const p = new Particle(dotBitmap(colour), Math.cos(a) * v, Math.sin(a) * v - (grav ? 1.5 : 0), 24 + Math.floor(this.rng() * 16), grav || 0);
                p.x = x; p.y = y;
                p.scale.set(0.75 + this.rng() * 0.6);
                (parent || this.fxLayer).addChild(p);
                this.fx.push(p);
            }
        }
        complete(score, data, good, bad) {
            if (this.done) return;
            this.done = true;
            this.result = Object.assign({ score: clamp(Math.round(score), 0, 100) }, data || {});
            this.good = good || [];
            this.bad = bad || [];
        }
        skip(score) { this.complete(score, this.skipData(score), [], []); }
        skipData() { return {}; }
    }

    // ==================================================================
    // The tavern hall: a room of 19 x 13 tiles drawn with the tavern's tileset, with tables, the bar, a fireplace
    // ==================================================================
    const RC = 19, RR = 13, ROOM_X = 16, ROOM_Y = 84;
    const DOOR_X0 = 8, DOOR_X1 = 10;
    const TABLES = [{ tx: 3, ty: 5 }, { tx: 8, ty: 5 }, { tx: 13, ty: 5 }, { tx: 3, ty: 9 }, { tx: 8, ty: 8 }, { tx: 13, ty: 9 }];
    const COUNTER_X0 = 1, COUNTER_X1 = 7, COUNTER_Y = 2;
    const SPOT = {
        borgar: { tx: 4, ty: 1 }, melia: { tx: 11, ty: 1 }, fire: { tx: 15, ty: 1 }, pile: { tx: 17, ty: 11 },
        door: { tx: 9, ty: 12 }, plant: { tx: 17, ty: 1 }, barrel: { tx: 17, ty: 7 }
    };
    const SACK_SPOTS = [{ tx: 8, ty: 2 }, { tx: 1, ty: 11 }, { tx: 17, ty: 3 }, { tx: 11, ty: 11 }];
    const REACH = 32;   // px from the hero's reach point (the middle of his tile) to a thing's tile: the tiles beside it, not the corners
    const cx = tx => tx * T + 24;
    const standPt = (tx, ty) => ({ x: tx * T + 24, y: ty * T + 36 });

    class Room {
        constructor(part, o) {
            this.part = part;
            this.o = o || {};
            this.root = new Sprite();
            this.root.x = ROOM_X;
            this.root.y = ROOM_Y;
            this.tables = TABLES.map((t, i) => ({
                i, tx: t.tx, ty: t.ty, dirty: 0, wipe: 0,
                seats: [{ tx: t.tx - 1, ty: t.ty, face: 6 }, { tx: t.tx + 2, ty: t.ty, face: 4 }]
            }));
            this.tables.forEach(tb => tb.seats.forEach((s, k) => { s.table = tb; s.k = k; s.guest = null; }));
            this.seats = [].concat(...this.tables.map(tb => tb.seats));
            this.furn = {};
            this.buildFurniture();
            this.tilemap = makeTilemap(RC, RR, (x, y) => [this.floorAt(x, y), this.furn[x + "," + y] || 0, 0, 0]);
            this.decor = new Sprite();
            this.chars = new Sprite();
            this.lights = new Sprite();
            this.over = new Sprite();
            this.root.addChild(this.tilemap);
            this.root.addChild(this.decor);
            this.root.addChild(this.chars);
            this.root.addChild(this.lights);
            this.root.addChild(this.over);
            this.buildDecor();
            this.borgar = this.addFigure(PEOPLE.borgar, SPOT.borgar.tx, SPOT.borgar.ty, 2);
            if (this.o.melia) this.melia = this.addFigure(PEOPLE.melia, SPOT.melia.tx, SPOT.melia.ty, 2);
            if (this.o.evening) this.buildEvening();
            this.tickFire(0);   // (the frames: before the first tick the sheets would show whole)
        }
        buildFurniture() {
            const put = (x, y, id) => { this.furn[x + "," + y] = id; };
            put(2, 0, tB(0, 10)); put(6, 0, tB(0, 10));             // red banners
            put(9, 0, tD(1, 0));                                     // the tavern's sign: a mug
            put(1, 1, tC(0, 7)); put(2, 1, tC(1, 7));                // kegs behind the bar
            put(3, 1, tB(9, 8)); put(5, 1, tB(8, 7)); put(6, 1, tB(8, 8)); put(7, 1, tD(0, 0));
            for (let x = COUNTER_X0; x < COUNTER_X1; x++) put(x, COUNTER_Y, tB(10, 9));
            put(COUNTER_X1, COUNTER_Y, tB(11, 9));                  // the bar's end: a board with a knife
            put(SPOT.fire.tx, 0, tB(11, 7)); put(SPOT.fire.tx, 1, tB(11, 8));   // the brick fireplace
            put(SPOT.plant.tx, SPOT.plant.ty, tC(7, 10));
            put(SPOT.barrel.tx, SPOT.barrel.ty, tB(12, 10));
            for (const tb of this.tables) {
                put(tb.tx, tb.ty, tB(0, 14)); put(tb.tx + 1, tb.ty, tB(1, 14));
                for (const s of tb.seats) put(s.tx, s.ty, tB(0, 15));
            }
        }
        floorAt(x, y) {   // Map001's own wall pieces around the floor, the door gap at the bottom
            if (y === 0) return x === 0 ? 6284 : x === RC - 1 ? 6281 : 6277;
            if (y === RR - 1) {
                if (x === 0) return 6278;
                if (x === RC - 1) return 6275;
                if (x >= DOOR_X0 && x <= DOOR_X1) return FLOOR;
                if (x === DOOR_X0 - 1) return 6273;
                if (x === DOOR_X1 + 1) return 6276;
                return 6277;
            }
            if (x === 0 || x === RC - 1) return 6282;
            return FLOOR;
        }
        // where the hero may stand
        walkable(tx, ty) {
            if (tx < 0 || ty < 0 || tx >= RC || ty >= RR) return false;
            if (ty === RR - 1) return tx >= DOOR_X0 && tx <= DOOR_X1;
            if (ty === 0 || tx === 0 || tx === RC - 1) return false;
            if (ty <= COUNTER_Y && tx >= COUNTER_X0 && tx <= COUNTER_X1) return false;
            for (const k of ["fire", "plant", "barrel", "pile"]) if (SPOT[k].tx === tx && SPOT[k].ty === ty) return false;
            if (this.o.melia && SPOT.melia.tx === tx && SPOT.melia.ty === ty) return false;
            for (const tb of this.tables) {
                if (ty === tb.ty && tx >= tb.tx - 1 && tx <= tb.tx + 2) return false;
            }
            return true;
        }
        // guests walk everywhere the hero does, and onto their own seat
        guestWalkable(tx, ty, seat) {
            if (seat && seat.tx === tx && seat.ty === ty) return true;
            return this.walkable(tx, ty);
        }
        buildDecor() {
            // the fire in the hearth (!Flame: the fourth set, rows big / small / smoke / medium)
            this.fire = new Sprite(ImageManager.loadCharacter("!Flame"));
            this.fire.anchor.set(0.5, 1);
            this.fire.x = cx(SPOT.fire.tx);
            this.fire.y = SPOT.fire.ty * T + 42;
            this.fire.scale.set(0.62);
            this.decor.addChild(this.fire);
            this.fireLevel = 0;
            this.setFire(0);
            // the wood pile: logs (icon 381) stacked in a heap
            const pb = new Bitmap(56, 50);
            for (const [x, y] of [[0, 20], [22, 20], [11, 7]]) icon(pb, 381, x, y, 34);
            this.pile = new Sprite(pb);
            this.pile.x = SPOT.pile.tx * T - 4;
            this.pile.y = SPOT.pile.ty * T - 2;
            this.decor.addChild(this.pile);
            // the stains of dirty tables (one bitmap per table, alpha = how dirty)
            for (const tb of this.tables) {
                const b = new Bitmap(96, 48), ctx = b.context;
                for (let i = 0; i < 7; i++) {
                    const x = 14 + ((i * 37 + tb.i * 13) % 68), y = 12 + ((i * 17 + tb.i * 7) % 20), r = 4 + ((i * 5 + tb.i) % 6);
                    ctx.fillStyle = i % 3 ? "rgba(96,58,24,0.55)" : "rgba(60,36,14,0.6)";
                    ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
                }
                ctx.fillStyle = "rgba(240,225,190,0.7)";
                for (let i = 0; i < 9; i++) ctx.fillRect(10 + ((i * 29 + tb.i * 11) % 76), 8 + ((i * 13) % 26), 2, 2);   // crumbs
                dirty(b);
                tb.stain = new Sprite(b);
                tb.stain.x = tb.tx * T;
                tb.stain.y = tb.ty * T - 4;
                tb.stain.opacity = 0;
                this.decor.addChild(tb.stain);
                tb.left = tileSprite("C", tb.i % 2 ? 3 : 2, 2);   // a mug left from the night before
                tb.left.scale.set(0.8);
                tb.left.x = tb.tx * T + (tb.i % 2 ? 50 : 22);
                tb.left.y = tb.ty * T - 14;
                tb.left.visible = false;
                this.decor.addChild(tb.left);
            }
        }
        setFire(level) {   // 0 = embers (smoke), 1 small, 2 medium, 3 big
            this.fireLevel = level;
            this._fireRow = [2, 1, 3, 0][clamp(Math.ceil(level - 0.001), 0, 3)];
            this.fire.opacity = level <= 0 ? 150 : 255;
            this.fire.setFrame(9 * T, this._fireRow * T, T, T);
        }
        tickFire(t) {
            const col = 9 + (Math.floor(t / 8) % 3);
            this.fire.setFrame(col * T, this._fireRow * T, T, T);
            if (this.glow) {
                const f = clamp(this.fireLevel / 3, 0, 1);
                this.glow.opacity = (110 + 90 * f) * (0.85 + 0.15 * Math.sin(t / 5) * Math.sin(t / 13));
            }
            if (this.candles) for (const c of this.candles) c.setFrame((3 + (Math.floor(t / 10 + c._ph) % 3)) * T, 0, T, T);
        }
        setDirty(tb, v) {
            tb.dirty = clamp(v, 0, 1);
            tb.stain.opacity = 255 * tb.dirty;
            tb.left.visible = tb.dirty > 0.5;
        }
        buildEvening() {
            // a dim blue dusk over the room with holes where the lamps, the candles and the fire light it, plus a warm glow
            const W = RC * T, H = RR * T;
            const dark = new Bitmap(W, H), ctx = dark.context;
            ctx.fillStyle = "rgba(10,10,32,0.42)";
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = "destination-out";
            const hole = (x, y, r, a) => {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, "rgba(0,0,0," + a + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
            };
            hole(cx(SPOT.fire.tx), 70, 230, 0.95);
            hole(cx(4), 110, 200, 0.85);
            for (const tb of this.tables) hole(tb.tx * T + 48, tb.ty * T + 16, 120, 0.7);
            hole(cx(9), H, 110, 0.5);
            ctx.globalCompositeOperation = "source-over";
            dirty(dark);
            this.lights.addChild(new Sprite(dark));
            const glowB = new Bitmap(W, H), g2 = glowB.context;
            const warm = (x, y, r, a) => {
                const g = g2.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, "rgba(255,150,60," + a + ")"); g.addColorStop(1, "rgba(255,120,40,0)");
                g2.fillStyle = g; g2.fillRect(x - r, y - r, r * 2, r * 2);
            };
            warm(cx(SPOT.fire.tx), 70, 200, 0.28);
            dirty(glowB);
            this.glow = new Sprite(glowB);
            this.glow.blendMode = PIXI.BLEND_MODES.ADD;
            this.lights.addChild(this.glow);
            // candles on the tables
            this.candles = [];
            for (const tb of this.tables) {
                const c = new Sprite(ImageManager.loadCharacter("!Flame"));
                c.setFrame(3 * T, 0, T, T);
                c.anchor.set(0.5, 1);
                c.scale.set(0.55);
                c.x = tb.tx * T + 48;
                c.y = tb.ty * T + 22;
                c._ph = tb.i;
                this.decor.addChild(c);
                this.candles.push(c);
            }
        }
        addFigure(look, tx, ty, dir) {
            const f = new Figure(look);
            const p = standPt(tx, ty);
            f.x = p.x;
            f.y = p.y + 4;
            f.dir = dir || 2;
            f.refresh();
            this.chars.addChild(f);
            return f;
        }
        sortChars() {
            this.chars.children.sort((a, b) => a.y - b.y || (a._sid || 0) - (b._sid || 0));
        }
        // the hero's feet box at (x, y) touches only walkable tiles
        free(x, y) {
            const x0 = Math.floor((x - 11) / T), x1 = Math.floor((x + 11) / T), y0 = Math.floor((y - 10) / T), y1 = Math.floor((y + 2) / T);
            for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!this.walkable(tx, ty)) return false;
            return true;
        }
        // moves the hero, sliding round corners (a few px of nudge, so he does not stick on a table's edge)
        move(h, dx, dy) {
            let moved = 0;
            if (dx) {
                if (this.free(h.x + dx, h.y)) { h.x += dx; moved += Math.abs(dx); } else if (!dy) {
                    for (let s = 1; s <= 14; s++) {
                        if (this.free(h.x + dx, h.y - s) && this.free(h.x, h.y - Math.min(2, s))) { h.y -= Math.min(2, s); moved += 1; break; }
                        if (this.free(h.x + dx, h.y + s) && this.free(h.x, h.y + Math.min(2, s))) { h.y += Math.min(2, s); moved += 1; break; }
                    }
                }
            }
            if (dy) {
                if (this.free(h.x, h.y + dy)) { h.y += dy; moved += Math.abs(dy); } else if (!dx) {
                    for (let s = 1; s <= 14; s++) {
                        if (this.free(h.x - s, h.y + dy) && this.free(h.x - Math.min(2, s), h.y)) { h.x -= Math.min(2, s); moved += 1; break; }
                        if (this.free(h.x + s, h.y + dy) && this.free(h.x + Math.min(2, s), h.y)) { h.x += Math.min(2, s); moved += 1; break; }
                    }
                }
            }
            return moved;
        }
        tileOf(x, y) { return { tx: Math.floor(x / T), ty: Math.floor((y - 6) / T) }; }
        // A* over the tiles (8 ways, no cutting corners); returns tile-centre points (room px) from start to goal
        path(fx, fy, gx, gy, walk) {
            walk = walk || ((x, y) => this.walkable(x, y));
            const s = this.tileOf(fx, fy), g = this.tileOf(gx, gy);
            const key = (x, y) => y * RC + x;
            const open = [{ x: s.tx, y: s.ty, g: 0, f: 0 }], from = {}, cost = { [key(s.tx, s.ty)]: 0 };
            const done = new Set();
            while (open.length) {
                let bi = 0;
                for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
                const n = open.splice(bi, 1)[0], nk = key(n.x, n.y);
                if (done.has(nk)) continue;
                done.add(nk);
                if (n.x === g.tx && n.y === g.ty) {
                    const pts = [];
                    let k = nk;
                    while (k !== undefined) { const x = k % RC, y = Math.floor(k / RC); pts.unshift(standPt(x, y)); k = from[k]; }
                    return pts;
                }
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        const x = n.x + dx, y = n.y + dy;
                        if (!walk(x, y)) continue;
                        if (dx && dy && (!walk(n.x + dx, n.y) || !walk(n.x, n.y + dy))) continue;
                        const c = n.g + (dx && dy ? 1.414 : 1), k = key(x, y);
                        if (cost[k] !== undefined && cost[k] <= c) continue;
                        cost[k] = c;
                        from[k] = nk;
                        open.push({ x, y, g: c, f: c + Math.hypot(g.tx - x, g.ty - y) });
                    }
                }
            }
            return null;
        }
        // walkable tiles next to the given tiles (4 ways), as stand points
        standsAround(tiles) {
            const out = [], seen = new Set(tiles.map(t => t.tx + "," + t.ty));
            for (const t of tiles) {
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const x = t.tx + dx, y = t.ty + dy, k = x + "," + y;
                    if (seen.has(k) || !this.walkable(x, y)) continue;
                    seen.add(k);
                    out.push(standPt(x, y));
                }
            }
            return out;
        }
        rectOf(tx, ty, w, h) { return { x: tx * T, y: ty * T, w: (w || 1) * T, h: (h || 1) * T }; }
        tableRect(tb) { return this.rectOf(tb.tx, tb.ty, 2, 1); }
        // distance from the hero's reach point to a rectangle
        reach(h, r) {
            const px = h.x, py = h.y - 12;
            const dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h));
            return Math.hypot(dx, dy);
        }
        nearest(h, targets) {
            let best = null, bd = REACH + 0.001;
            for (const tg of targets) {
                const d = this.reach(h, tg.rect);
                if (d < bd) { bd = d; best = tg; }
            }
            return best;
        }
        destroy() {}
    }

    // the hero walking in the room: keys -> move, facing, legs
    function heroWalk(room, hero, k) {
        const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
        const sp = k.shift ? 5.4 : 4.2, f = dx && dy ? Math.SQRT1_2 : 1;
        const moved = dx || dy ? room.move(hero, dx * sp * f, dy * sp * f) : 0;
        hero.fig.moving = moved > 0.1;
        if (dx || dy) hero.fig.dir = hero.fig.look.eight ? dirOf(dx, dy) : dirOf(dy ? 0 : dx, dy);
        hero.fig.advance(moved);
        hero.fig.x = hero.x;
        hero.fig.y = hero.y + 4;
        hero.fig.refresh();
    }

    // the "O: ..." plate over a target, with a ring for hold actions
    class Prompt extends Sprite {
        initialize() {
            super.initialize(new Bitmap(300, 44));
            this.anchor.set(0.5, 1);
            this._key = "";
        }
        show(label, x, y, ratio, dim) {
            const key = label + "|" + (ratio === undefined ? "" : Math.round(ratio * 20)) + "|" + !!dim;
            this.visible = true;
            this.x = Math.round(x);
            this.y = Math.round(y);
            if (key === this._key) return;
            this._key = key;
            const b = this.bitmap;
            b.clear();
            const size = 18, tw = Math.ceil(measure(b, label, size, true));
            const w = Math.min(296, tw + 48), x0 = Math.round((300 - w) / 2);
            panel(b, x0, 6, w, 32, { cut: 4, fill: "rgba(11,12,15,0.9)", accent: !dim });
            keyCap(b, "O", x0 + 6, 10, 24, dim ? ST().muted : ST().accent);
            if (ratio !== undefined) {
                const ctx = b.context;
                ctx.save(); ctx.strokeStyle = ST().accent; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(x0 + 18, 22, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(ratio, 0, 1)); ctx.stroke(); ctx.restore();
                dirty(b);
            }
            txt(b, label, x0 + 36, 8, w - 40, { size, color: dim ? ST().muted : ST().text, bold: true });
        }
        hide() { this.visible = false; }
    }

    // the side panel of the room parts (320 x 624 at the room's right)
    const SIDE = { x: ROOM_X + RC * T + 16, y: ROOM_Y, w: 1280 - (ROOM_X + RC * T + 16) - 16, h: RR * T };

    // ==================================================================
    // Part 1: before opening - clean the tables, bring wood to the fireplace, take the rubbish out
    // ==================================================================
    class PartClean extends Part {
        setup() {
            const c = this.cfg;
            this.limit = c.time;
            this.room = new Room(this, {});
            this.root.addChild(this.room.root);
            this.hero = { x: standPt(9, 10).x, y: standPt(9, 10).y };
            this.hero.fig = this.room.addFigure(heroLook(), 9, 10, 8);
            this.hero.fig._sid = 1;
            for (const i of shuffle([0, 1, 2, 3, 4, 5], this.rng).slice(0, c.tables)) this.room.setDirty(this.room.tables[i], 1);
            this.tablesTotal = c.tables;
            this.wood = { need: c.wood, done: 0 };
            this.room.setFire(0);
            this.sacks = shuffle(SACK_SPOTS, this.rng).slice(0, c.trash).map((s, i) => {
                const spr = i % 2 ? tileSprite("B", 11, 10) : tileSprite("B", 8, 15);   // a bucket of scraps / a sack of rubbish
                spr.x = s.tx * T; spr.y = s.ty * T - 6;
                spr.scale.set(0.9);
                this.room.decor.addChild(spr);
                return { tx: s.tx, ty: s.ty, state: "lying", spr, kind: i % 2 ? "bucket" : "sack" };
            });
            this.trashDone = 0;
            this.carry = null;
            this.carrySpr = new Sprite(new Bitmap(48, 48));
            this.carrySpr.anchor.set(0.5, 1);
            this.carrySpr.visible = false;
            this.room.over.addChild(this.carrySpr);
            this.prompt = new Prompt();
            this.room.over.addChild(this.prompt);
            this.endWait = -1;
            this.side = new Sprite(new Bitmap(SIDE.w, SIDE.h));
            this.side.x = SIDE.x; this.side.y = SIDE.y;
            this.root.addChild(this.side);
            this.fxLayer.x = ROOM_X; this.fxLayer.y = ROOM_Y;
            super.setup();
            this._sideKey = "";
        }
        units() { return { total: this.tablesTotal + this.wood.need + this.sacks.length, done: this.tablesClean() + this.wood.done + this.trashDone }; }
        tablesClean() { return this.tablesTotal - this.room.tables.filter(tb => tb.dirty > 0).length; }
        targets() {
            const r = this.room, list = [];
            for (const tb of r.tables) if (tb.dirty > 0) list.push({ kind: "wipe", table: tb, rect: r.tableRect(tb), hold: true, label: "Przetrzyj stół" });
            if (this.carry === "log") list.push({ kind: "fire", rect: r.rectOf(SPOT.fire.tx, SPOT.fire.ty), label: "Dorzuć do kominka" });
            else if (this.wood.done < this.wood.need) list.push({ kind: "log", rect: r.rectOf(SPOT.pile.tx, SPOT.pile.ty), label: "Weź polano", busy: !!this.carry });
            for (const s of this.sacks) if (s.state === "lying") list.push({ kind: "sack", sack: s, rect: r.rectOf(s.tx, s.ty), label: s.kind === "sack" ? "Weź worek śmieci" : "Weź kubeł z resztkami", busy: !!this.carry });
            if (this.carry === "trash") list.push({ kind: "door", rect: r.rectOf(DOOR_X0, RR - 1, 3, 1), label: "Wyrzuć za drzwi" });
            return list;
        }
        setCarry(what) {
            this.carry = what;
            const b = this.carrySpr.bitmap;
            showIf(this.carrySpr, what);
            if (!what) return;
            b.clear();
            if (what === "log") icon(b, 381, 6, 10, 36);
            else if (what === "trash") b.blt(ImageManager.loadTileset(sheet("B")), 8 * T, 15 * T, T, T, 4, 4, 40, 40);
        }
        tick(k, kt) {
            if (this.done) return;
            const r = this.room, h = this.hero;
            heroWalk(r, h, k);
            this.carrySpr.x = h.x;
            this.carrySpr.y = h.y - 56;
            const tg = r.nearest(h, this.targets());
            this.target = tg;
            if (tg && tg.hold) {
                const tb = tg.table;
                if (k.ok) {
                    tb.wipe++;
                    r.setDirty(tb, 1 - tb.wipe / this.cfg.wipe);
                    if (tb.wipe % 8 === 1) { se("Water1", 35, 150); this.burst(tb.tx * T + 48 + ROOM_X, tb.ty * T + 16 + ROOM_Y, "#dff6ff", 3, 1.6); }
                    if (tb.wipe >= this.cfg.wipe) {
                        r.setDirty(tb, 0);
                        se("Chime2", 50, 130);
                        this.float("Czysto!", ROOM_X + tb.tx * T + 48, ROOM_Y + tb.ty * T - 8, GOOD);
                        this.burst(tb.tx * T + 48 + ROOM_X, tb.ty * T + 16 + ROOM_Y, "#fff7c0", 10, 2.2);
                    }
                }
            } else if (tg && kt.ok) this.act(tg);
            // the prompt
            if (tg) {
                const ratio = tg.hold ? tg.table.wipe / this.cfg.wipe : undefined;
                const label = tg.busy ? "Masz zajęte ręce" : tg.label + (tg.hold ? " (przytrzymaj)" : "");
                this.prompt.show(label, tg.rect.x + tg.rect.w / 2, tg.rect.y - (tg.kind === "door" ? 4 : 6), ratio, tg.busy);
            } else this.prompt.hide();
            r.tickFire(this.t);
            r.sortChars();
            this.tickFx();
            this.t++;
            const u = this.units();
            if (u.done >= u.total && this.endWait < 0) { this.endWait = 50; se("Applause1", 45, 120); this.float("Wszystko zrobione!", ROOM_X + h.x, ROOM_Y + h.y - 70, ST().accent, 26); }
            if (this.endWait > 0 && --this.endWait === 0) this.finish();
            else if (this.t >= this.limit) this.finish();
        }
        act(tg) {
            const r = this.room, h = this.hero, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 64;
            if (tg.busy) { se("Buzzer1", 50); this.float("Najpierw odnieś to, co niesiesz", fx, fy, WARN, 18); return; }
            if (tg.kind === "log") { this.setCarry("log"); se("Equip1", 60, 90); }
            else if (tg.kind === "fire") {
                this.setCarry(null);
                this.wood.done++;
                r.setFire(this.wood.done);
                se("Fire1", 55, 110);
                this.burst(ROOM_X + cx(SPOT.fire.tx), ROOM_Y + SPOT.fire.ty * T + 20, "#ffb347", 10, 1.8, -0.02);
                this.float("Polano " + this.wood.done + "/" + this.wood.need, ROOM_X + cx(SPOT.fire.tx), ROOM_Y + SPOT.fire.ty * T - 10, ST().accent);
            } else if (tg.kind === "sack") {
                tg.sack.state = "carried";
                tg.sack.spr.visible = false;
                this.setCarry("trash");
                se("Equip2", 60, 90);
            } else if (tg.kind === "door") {
                const s = this.sacks.find(x => x.state === "carried");
                if (s) s.state = "out";
                this.trashDone++;
                this.setCarry(null);
                se("Door1", 55, 110);
                this.float("Wyniesione!", fx, fy, GOOD);
            }
        }
        finish() {
            const u = this.units(), left = Math.max(0, this.limit - this.t);
            let s = 90 * u.done / u.total;
            if (u.done >= u.total) s += 10 * Math.min(1, left / (this.limit * 0.35));
            this.ctx.fire = this.wood.done;
            const tables = this.tablesClean(), good = [], bad = [];
            if (u.done >= u.total) good.push("Sala wysprzątana na czas (" + Math.ceil(left / 60) + " s zapasu)");
            else {
                if (tables < this.tablesTotal) bad.push("Brudne stoły: " + (this.tablesTotal - tables));
                if (this.wood.done < this.wood.need) bad.push("Kominek bez drewna: " + (this.wood.need - this.wood.done) + " polana");
                if (this.trashDone < this.sacks.length) bad.push("Śmieci zostały w sali: " + (this.sacks.length - this.trashDone));
                if (u.done > 0 && tables === this.tablesTotal) good.push("Stoły lśnią");
            }
            this.complete(s, {
                done: u.done, total: u.total, timeLeft: Math.round(left / 60),
                tables: [tables, this.tablesTotal], wood: [this.wood.done, this.wood.need], trash: [this.trashDone, this.sacks.length]
            }, good, bad);
        }
        skipData(score) {
            this.ctx.fire = score >= 50 ? 3 : 1;
            return { done: 0, total: 0, skipped: true };
        }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() {
            const left = Math.max(0, this.limit - this.t), u = this.units();
            return { timer: left / this.limit, label: "Do otwarcia: " + fmtTime(left), right: "Zadania: " + u.done + " / " + u.total };
        }
        frame() {
            const u = this.units();
            const key = [this.tablesClean(), this.wood.done, this.trashDone, this.carry, u.done].join("|");
            if (key === this._sideKey) return;
            this._sideKey = key;
            const b = this.side.bitmap;
            b.clear();
            panel(b, 0, 0, SIDE.w, SIDE.h, { cut: 6 });
            txt(b, "Lista zadań", 20, 14, SIDE.w - 40, { size: 26, color: ST().accent, bold: true });
            txt(b, "zanim wpuścimy gości", 20, 46, SIDE.w - 40, { size: 17, color: ST().muted });
            const rows = [
                [400, "Przetrzyj stoły", this.tablesClean(), this.tablesTotal, "stań przy stole, przytrzymaj O"],
                [381, "Drewno do kominka", this.wood.done, this.wood.need, "polana ze stosu w rogu"],
                [338, "Wynieś śmieci", this.trashDone, this.sacks.length, "za drzwi wejściowe"]
            ];
            let y = 90;
            for (const [ic, name, d, n, hint] of rows) {
                const ok = d >= n;
                panel(b, 14, y, SIDE.w - 28, 92, { cut: 4, fill: ok ? "rgba(30,48,30,0.7)" : "rgba(22,24,29,0.9)", accent: false, line: ok ? "#4f8a4c" : ST().line });
                icon(b, ic, 26, y + 12, 32);
                txt(b, name, 68, y + 10, SIDE.w - 150, { size: 21, color: ok ? GOOD : ST().text, bold: true });
                txt(b, d + " / " + n, SIDE.w - 100, y + 10, 72, { size: 21, color: ok ? GOOD : ST().accent, bold: true, align: "right" });
                bar(b, 68, y + 46, SIDE.w - 110, 7, d / n, ok ? GOOD : ST().accent);
                txt(b, hint, 68, y + 58, SIDE.w - 96, { size: 15, color: ST().muted });
                y += 104;
            }
            txt(b, "W rękach:", 20, y + 6, 120, { size: 19, color: ST().muted });
            txt(b, this.carry === "log" ? "polano" : this.carry === "trash" ? "śmieci" : "nic", 120, y + 6, 180, { size: 19, color: this.carry ? ST().accent : ST().text, bold: true });
            drawLegend(b, 20, SIDE.h - 128, [[["up", "left", "down", "right"], "lub WSAD: chodzenie"], [["Shift"], "szybciej"], [["O"], "akcja"], [["P"], "pauza"]]);
        }
        state() {
            const r = this.room;
            return {
                hero: { x: this.hero.x, y: this.hero.y }, carry: this.carry, t: this.t, limit: this.limit,
                tables: r.tables.map(tb => ({ i: tb.i, dirty: tb.dirty, stands: r.standsAround([{ tx: tb.tx, ty: tb.ty }, { tx: tb.tx + 1, ty: tb.ty }]) })),
                wood: Object.assign({}, this.wood), pile: r.standsAround([SPOT.pile]), fire: r.standsAround([SPOT.fire]),
                sacks: this.sacks.map(s => ({ state: s.state, stands: r.standsAround([s]) })),
                door: standPt(9, RR - 2), target: this.target ? this.target.kind : null
            };
        }
    }
    function fmtTime(ticks) {
        const s = Math.ceil(ticks / 60);
        return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }
    function drawLegend(b, x, y, rows) {
        let yy = y;
        for (const [caps, text] of rows) {
            let xx = x;
            for (const c of caps) xx += keyCap(b, c, xx, yy, 24) + 3;
            txt(b, text, xx + 6, yy + 1, 240, { size: 17, color: ST().text });
            yy += 30;
        }
    }

    // ==================================================================
    // Part 2: the keg - hold O to pour, let go at the line (the tap keeps running a moment)
    // ==================================================================
    const PX = 3;   // the close-ups' pixel size (tiles and drawn props alike)
    const MUG = { w: 48, h: 64, in0: 7, in1: 56 };   // low-res mug canvas; the inside from y in0 (rim) to in1 (bottom)
    const CASK = { w: 80, h: 76, tipX: 40, tipY: 62 };
    function closeupWall(rows, extra) {
        // the log wall (inside pieces) with shelves; `extra(x, y)` adds layer-1 tiles
        return makeTilemap(9, rows, (x, y) => [WALL_IN, extra ? extra(x, y) : 0, 0, 0]);
    }
    function drawCask(b) {
        const c = b.context;
        c.clearRect(0, 0, CASK.w, CASK.h);
        const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
        // the cradle: two legs and a beam
        R(8, 54, 64, 5, "#5a3a1c"); R(8, 54, 64, 1, "#7c5530");
        for (const lx of [12, 58]) { R(lx, 58, 10, 16, "#4d3118"); R(lx, 58, 2, 16, "#6b4726"); R(lx - 3, 72, 16, 3, "#3a2410"); }
        // the cask's head: boards in a circle with iron hoops
        const cx0 = 40, cy0 = 32, rad = 29;
        for (let y = cy0 - rad; y <= cy0 + rad; y++) {
            for (let x = cx0 - rad; x <= cx0 + rad; x++) {
                const d = Math.hypot(x - cx0 + 0.5, y - cy0 + 0.5);
                if (d > rad) continue;
                let col;
                if (d > rad - 2.2) col = d > rad - 1 ? "#1d1d22" : "#4a4a52";                  // the outer hoop
                else if (d > rad - 3.4) col = "#2b1a0c";                                        // the chime's shadow
                else {
                    const board = Math.floor((x - (cx0 - rad) + 1) / 7);
                    const seam = (x - (cx0 - rad) + 1) % 7 === 0;
                    col = seam ? "#4a2c12" : board % 2 ? "#a4682e" : "#94592a";
                    if (!seam && (x - cx0) + (y - cy0) < -18) col = board % 2 ? "#b87a3a" : "#a86c32";   // light from the upper left
                    if (!seam && (x - cx0) + (y - cy0) > 20) col = board % 2 ? "#83501f" : "#764819";
                }
                R(x, y, 1, 1, col);
            }
        }
        // hoop highlight, a bung, the brand
        for (let a = 3.5; a < 4.6; a += 0.04) R(Math.round(cx0 + Math.cos(a) * (rad - 1.2)), Math.round(cy0 + Math.sin(a) * (rad - 1.2)), 1, 1, "#9a9aa6");
        R(38, 10, 5, 3, "#3a220e"); R(39, 11, 3, 1, "#5e3a1a");
        // the brass tap: a body out of the head, a key on top, the nozzle down
        R(34, 46, 13, 7, "#8a5f16"); R(35, 47, 11, 5, "#d6a13c"); R(35, 47, 11, 1, "#ffe08a");
        R(39, 40, 3, 7, "#8a5f16"); R(40, 40, 1, 6, "#e8b85a");
        R(34, 38, 13, 3, "#8a5f16"); R(35, 38, 11, 1, "#ffe08a");
        R(37, 53, 7, 9, "#8a5f16"); R(38, 53, 5, 8, "#c99632"); R(38, 53, 1, 8, "#ffe08a");
        R(37, 61, 7, 1, "#5e3f0c");
        dirty(b);
    }
    function drawMug(b, level, foam, line, spill, t) {
        const c = b.context, R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
        c.clearRect(0, 0, MUG.w, MUG.h);
        const x0 = 4, x1 = 33, top = 4, bot = 61, ih = MUG.in1 - MUG.in0;
        // the handle
        R(33, 14, 9, 3, "#2a2f38"); R(33, 44, 9, 3, "#2a2f38"); R(40, 16, 3, 29, "#2a2f38");
        R(34, 15, 7, 1, "#c9dde8"); R(41, 17, 1, 27, "#a9c2d0"); R(34, 45, 7, 1, "#8fa6b3");
        // the glass: back tint
        R(x0 + 1, top + 1, x1 - x0 - 1, bot - top - 1, "rgba(190,220,236,0.30)");
        // beer and foam (level = top of the foam, 0..1 of the inside)
        const yTop = Math.round(MUG.in1 - level * ih), yFoam = Math.round(MUG.in1 - Math.max(0, level - foam) * ih);
        if (level > 0.004) {
            for (let y = Math.max(MUG.in0, yFoam); y < MUG.in1; y++) R(x0 + 3, y, x1 - x0 - 5, 1, y > MUG.in1 - 6 ? "#b8691a" : y % 5 === 0 ? "#e6a12a" : "#dc921f");
            for (let i = 0; i < 6; i++) {   // rising bubbles
                const bx = x0 + 5 + ((i * 7 + 3) % 21), by = MUG.in1 - 2 - ((t * (1 + i % 3) + i * 11) % Math.max(1, MUG.in1 - yFoam));
                if (by > yFoam + 1) R(bx, by, 1, 1, "#ffd27a");
            }
            for (let y = Math.max(0, yTop); y < yFoam && y < MUG.in1; y++) R(x0 + 3, y, x1 - x0 - 5, 1, y === yFoam - 1 ? "#e8d7aa" : "#fff4da");
            for (let x = x0 + 3; x < x1 - 2; x++) if ((x * 7 + Math.floor(t / 6)) % 5 === 0 && yTop - 1 >= 0) R(x, yTop - 1, 1, 1, "#fff4da");   // a bumpy crown
        }
        if (spill) {   // foam over the rim and down the sides
            R(x0 - 1, top - 2, x1 - x0 + 3, 3, "#fff4da");
            for (const [x, len] of [[x0 - 1, 14 + (t % 4)], [x0 + 9, 6], [x1 + 1, 18 + (t % 3)], [x1 - 6, 9]]) R(x, top, 2, len, "#f3e2b4");
        }
        // the glass: outline, thick base, highlights
        R(x0, top, 1, bot - top, "#2a2f38"); R(x1, top, 1, bot - top, "#2a2f38"); R(x0, bot, x1 - x0 + 1, 1, "#2a2f38");
        R(x0 + 1, top, 2, bot - top, "#d8e8f0"); R(x1 - 2, top, 2, bot - top, "#9fb6c4");
        R(x0 + 1, MUG.in1, x1 - x0 - 1, bot - MUG.in1, "rgba(200,225,240,0.75)"); R(x0 + 1, MUG.in1, x1 - x0 - 1, 1, "#ffffff");
        R(x0 - 1, top - 1, x1 - x0 + 3, 2, "#2a2f38"); R(x0, top - 1, x1 - x0 + 1, 1, "#eef6fa");
        R(x0 + 5, top + 6, 1, 40, "rgba(255,255,255,0.65)"); R(x0 + 7, top + 10, 1, 18, "rgba(255,255,255,0.4)");
        // the line: yellow ticks either side and a dashed line across
        const yl = Math.round(MUG.in1 - line * ih);
        R(0, yl, 4, 1, "#ffd23f"); R(0, yl - 1, 2, 3, "#ffd23f");
        for (let x = x0 + 3; x < x1 - 1; x += 3) R(x, yl, 2, 1, "rgba(255,210,63,0.9)");
        R(x1 + 1, yl, 3, 1, "#ffd23f");
        dirty(b);
    }

    class PartBeer extends Part {
        setup() {
            const W = Graphics.width;
            // the back wall with shelves, a shelf plank for the cask, the bar top
            const wall = closeupWall(5, (x, y) => (y === 1 && (x === 0 || x === 8) ? tB(9, 8) : y === 1 && (x === 1 || x === 7) ? tB(8, 7) : 0));
            wall.scale.set(PX);
            wall.x = -8;
            wall.y = -60;
            this.root.addChild(wall);
            const shelf = new Sprite(new Bitmap(W, 26));
            shelf.bitmap.fillRect(0, 0, W, 26, "#4a2d14"); shelf.bitmap.fillRect(0, 0, W, 6, "#7a5028"); shelf.bitmap.fillRect(0, 22, W, 4, "#2a180a");
            shelf.y = 372;
            this.root.addChild(shelf);
            for (const [x, k] of [[150, 0], [300, 1], [900, 1], [1050, 0]]) {   // the other kegs
                const s = tileSprite("C", k, 7);
                s.scale.set(PX);
                s.x = x - 72; s.y = 372 - 138;
                this.root.addChild(s);
            }
            const counter = makeTilemap(9, 2, () => [PLANKS_H, 0, 0, 0]);
            counter.scale.set(PX);
            counter.x = -8;
            counter.y = 560;
            this.root.addChild(counter);
            const edge = new Sprite(new Bitmap(W, 12));
            edge.bitmap.fillRect(0, 0, W, 4, "#c98d4c"); edge.bitmap.fillRect(0, 4, W, 8, "rgba(0,0,0,0.35)");
            edge.y = 556;
            this.root.addChild(edge);
            // the cask and its tap
            this.cask = new Sprite(new Bitmap(CASK.w, CASK.h));
            drawCask(this.cask.bitmap);
            this.cask.scale.set(PX);
            this.cask.x = Math.round(W / 2 - CASK.tipX * PX);
            this.cask.y = 372 - (CASK.h - 2) * PX + 6 * PX;
            this.nozzle = { x: this.cask.x + CASK.tipX * PX + 1, y: this.cask.y + CASK.tipY * PX };
            // the stream (behind the cask's nozzle, in front of the mug)
            this.mug = new Sprite(new Bitmap(MUG.w, MUG.h));
            this.mug.scale.set(PX);
            this.mug.anchor.set(0.5, 1);
            this.mug.y = 566;
            this.stream = new Sprite(solidBitmap("#e2a02c"));
            this.stream.x = this.nozzle.x - 4;
            this.stream.y = this.nozzle.y;
            this.stream.scale.x = 8 / 4;
            this.stream.visible = false;
            this.root.addChild(this.mug);
            this.root.addChild(this.stream);
            this.root.addChild(this.cask);
            // side panels
            this.info = new Sprite(new Bitmap(330, 300));
            this.info.x = 30; this.info.y = 96;
            this.root.addChild(this.info);
            this.row = new Sprite(new Bitmap(W - 60, 84));
            this.row.x = 30; this.row.y = 620;
            this.root.addChild(this.row);
            this.tally = new Sprite(new Bitmap(330, 240));
            this.tally.x = W - 360; this.tally.y = 96;
            this.root.addChild(this.tally);
            super.setup();
            this.results = [];
            this.i = -1;
            this.nextMug();
        }
        nextMug() {
            this.i++;
            if (this.i >= this.cfg.mugs) { this.phase = "end"; this.pt = 0; return; }
            const r = this.rng;
            this.line = 0.66 + r() * 0.22;
            this.rate = 0.0068 * (0.85 + r() * 0.45) * this.cfg.speed;
            this.pulse = this.i >= this.cfg.pulseFrom && r() < this.cfg.pulseChance;
            this.level = 0;
            this.flow = 0;
            this.spilled = false;
            this.phase = "in";
            this.pt = 0;
            this.mugX = Graphics.width + 160;
            this.lastLabel = null;
        }
        flowNow() { return this.rate * (this.pulse ? 0.55 + 0.9 * (0.5 + 0.5 * Math.sin(this.pt / 6.5)) : 1); }
        // the foam's height at a level: grows with the pour
        foam() { return Math.min(0.1, 0.02 + this.level * 0.09); }
        afterRelease() { let f = this.flow, add = 0; for (let k = 0; k < 8; k++) { f *= 0.8; add += f; } return this.level + add; }
        tick(k, kt) {
            if (this.done) return;
            this.pt++;
            const cxm = Graphics.width / 2;
            switch (this.phase) {
                case "in":
                    this.mugX = lerp(Graphics.width + 160, cxm, ease(this.pt / 26));
                    if (this.pt >= 26) { this.phase = "ready"; this.pt = 0; }
                    break;
                case "ready":
                    if (kt.ok) { this.phase = "pour"; this.pt = 0; se("Liquid", 45, 110); }
                    else if (this.pt > this.cfg.wait) this.judge("timeout");
                    break;
                case "pour":
                    this.flow = this.flowNow();
                    this.level += this.flow;
                    if (this.pt % 24 === 0) se("Water1", 30, 70 + Math.floor(this.level * 40));
                    if (this.level >= 1) this.judge("spill");
                    else if (!k.ok) { this.phase = "lag"; this.lag = 0; }
                    break;
                case "lag":
                    this.flow *= 0.8;
                    this.level += this.flow;
                    this.lag++;
                    if (this.level >= 1) this.judge("spill");
                    else if (this.lag >= 8) this.judge();
                    break;
                case "judge":
                    if (this.pt >= 52) { this.phase = "out"; this.pt = 0; }
                    break;
                case "out":
                    this.mugX = lerp(cxm, -160, ease(this.pt / 22));
                    if (this.pt >= 22) this.nextMug();
                    break;
                case "end":
                    if (this.pt >= 30) this.finish();
                    break;
            }
            this.t++;
            this.tickFx();
        }
        judge(kind) {
            const d = this.level - this.line, ad = Math.abs(d);
            let score, label, colour, res;
            if (kind === "spill") { this.level = 1; this.spilled = true; score = 0; label = "Rozlane!"; colour = BAD; res = "spill"; se("Splash", 60, 110); }
            else if (kind === "timeout") { score = 0; label = "Gość się nie doczekał"; colour = BAD; res = "timeout"; se("Buzzer1", 50); }
            else if (ad <= 0.02) { score = 100; label = "Idealnie!"; colour = ST().accent; res = "perfect"; se("Chime2", 60, 120); }
            else if (ad <= 0.045) { score = 80; label = "Dobrze"; colour = GOOD; res = "good"; se("Decision2", 55, 110); }
            else if (ad <= 0.08) { score = 55; label = d < 0 ? "Trochę za mało" : "Trochę za dużo"; colour = ST().text; res = d < 0 ? "short" : "over"; se("Cursor2", 55); }
            else { score = Math.max(5, Math.round(40 - (ad - 0.08) * 250)); label = d < 0 ? "Za mało!" : "Za dużo piany!"; colour = WARN; res = d < 0 ? "short" : "over"; se("Buzzer2", 45); }
            this.flow = 0;
            this.results.push({ score, res, diff: Math.round(d * 1000) / 1000 });
            this.phase = "judge";
            this.pt = 0;
            this.float(label, Graphics.width / 2, 330, colour, 30);
            if (res === "spill") this.burst(Graphics.width / 2, 390, "#fff1c8", 18, 2.4, 0.18);
        }
        finish() {
            const n = this.results.length || 1;
            const avg = this.results.reduce((a, r) => a + r.score, 0) / n;
            const count = res => this.results.filter(r => r.res === res).length;
            const perfect = count("perfect"), good = count("good"), spilled = count("spill"), short = count("short"), timeout = count("timeout");
            this.ctx.beerQ = avg / 100;
            const g = [], b = [];
            if (perfect) g.push("Idealnie nalane kufle: " + perfect + " z " + this.results.length);
            if (spilled) b.push("Rozlane kufle: " + spilled);
            if (short) b.push("Za mało piwa w kuflach: " + short);
            if (timeout) b.push("Kufle, które czekały na próżno: " + timeout);
            this.complete(avg, { mugs: this.results.length, perfect, good, spilled, short, results: this.results.slice() }, g, b);
        }
        skipData(score) { this.ctx.beerQ = score / 100; return { mugs: 0, perfect: 0, good: 0, spilled: 0, short: 0, results: [], skipped: true }; }
        progress() { return clamp((this.i + (this.phase === "judge" || this.phase === "out" ? 1 : 0)) / this.cfg.mugs, 0, 1); }
        hud() {
            const i = Math.min(this.i + 1, this.cfg.mugs);
            return { dots: this.results.map(r => r.score), dotsTotal: this.cfg.mugs, label: "Kufel " + i + " z " + this.cfg.mugs, right: this.pulse && this.phase !== "end" ? "Uwaga: kran skacze!" : "" };
        }
        frame() {
            const flowing = this.phase === "pour" || (this.phase === "lag" && this.flow > 0.0006);
            drawMug(this.mug.bitmap, this.level, this.foam(), this.line, this.spilled, this.t);
            this.mug.x = Math.round(this.mugX);
            this.mug.visible = this.phase !== "end";
            this.stream.visible = flowing;
            if (flowing) {
                const surface = this.mug.y - (MUG.h - MUG.in1) * PX - this.level * (MUG.in1 - MUG.in0) * PX;
                this.stream.scale.y = Math.max(1, (surface - this.nozzle.y) / 4);
                this.stream.scale.x = (this.phase === "lag" ? Math.max(2, 8 * this.flow / this.rate) : 8 + (this.pulse ? 3 * Math.sin(this.pt / 3) : 0)) / 4;
                this.stream.x = Math.round(this.nozzle.x - this.stream.scale.x * 2);
            }
            // info (left)
            const key = [this.i, this.phase === "ready", this.pulse, this.results.length].join("|");
            if (key !== this._infoKey) {
                this._infoKey = key;
                const b = this.info.bitmap;
                b.clear();
                panel(b, 0, 0, 330, 300, { cut: 6 });
                txt(b, "Kufel " + Math.min(this.i + 1, this.cfg.mugs) + " z " + this.cfg.mugs, 18, 12, 294, { size: 28, color: ST().accent, bold: true });
                txt(b, this.pulse ? "Kran skacze: raz leje mocniej, raz słabiej!" : "Kran leje równo.", 18, 50, 294, { size: 18, color: this.pulse ? WARN : ST().muted });
                const lines = ["Przytrzymaj O - leje się piwo.", "Puść, gdy piana sięga żółtej kreski.", "Po puszczeniu piwo leci jeszcze chwilę: puść odrobinę wcześniej."];
                let y = 92;
                for (const l of lines) for (const w of wrapLines(b, l, 294, 18)) { txt(b, w, 18, y, 294, { size: 18 }); y += 25; }
                if (this.phase === "ready") txt(b, "Czekam na O...", 18, 256, 294, { size: 19, color: ST().accent, bold: true });
            }
            const tk = this.results.map(r => r.res).join(",");
            if (tk !== this._tallyKey) {
                this._tallyKey = tk;
                const b = this.tally.bitmap;
                b.clear();
                panel(b, 0, 0, 330, 240, { cut: 6 });
                txt(b, "Wynik", 18, 12, 294, { size: 26, color: ST().accent, bold: true });
                const count = res => this.results.filter(r => r.res === res).length;
                const rows = [["Idealnie", count("perfect"), ST().accent], ["Dobrze", count("good"), GOOD], ["Za mało / za dużo", count("short") + count("over"), ST().text], ["Rozlane", count("spill") + count("timeout"), BAD]];
                let y = 56;
                for (const [n, v, c] of rows) { txt(b, n, 18, y, 220, { size: 20 }); txt(b, String(v), 240, y, 70, { size: 20, color: c, bold: true, align: "right" }); y += 32; }
                const avg = this.results.length ? Math.round(this.results.reduce((a, r) => a + r.score, 0) / this.results.length) : 0;
                txt(b, "Średnio: " + avg + " / 100", 18, 194, 294, { size: 19, color: ST().muted });
                // the row of mugs at the bottom
                const rb = this.row.bitmap;
                rb.clear();
                const n = this.cfg.mugs, w = 70, x0 = Math.round((rb.width - n * (w + 10)) / 2);
                for (let i = 0; i < n; i++) {
                    const r = this.results[i], x = x0 + i * (w + 10);
                    panel(rb, x, 4, w, 76, { cut: 4, accent: false, fill: r ? "rgba(20,22,27,0.92)" : "rgba(12,13,16,0.7)", line: r ? scoreColour(r.score) : ST().line });
                    if (r) { icon(rb, 337, x + 19, 10, 32); txt(rb, r.res === "spill" ? "rozlane" : String(r.score), x, 46, w, { size: 17, color: scoreColour(r.score), bold: true, align: "center" }); }
                    else txt(rb, String(i + 1), x, 26, w, { size: 20, color: ST().muted, align: "center" });
                }
            }
        }
        state() {
            return { i: this.i, mugs: this.cfg.mugs, phase: this.phase, level: this.level, line: this.line, rate: this.rate, flow: this.flow,
                pulse: this.pulse, after: this.afterRelease(), results: this.results.map(r => r.res) };
        }
    }

    // ==================================================================
    // Part 3: the kitchen in rhythm - the steps slide to the yellow frame, press the right key there
    // ==================================================================
    const LANE = { x: 40, y: 92, w: 1200, h: 150, hitX: 190 };
    const WIN = { perfect: 5, good: 11 };
    class PartKitchen extends Part {
        setup() {
            const W = Graphics.width;
            const wall = closeupWall(4, (x, y) => (y === 1 && (x === 1 || x === 7) ? tB(8, 8) : y === 1 && (x === 2 || x === 6) ? tB(9, 8) : 0));
            wall.scale.set(PX);
            wall.x = -8;
            wall.y = -60;
            this.root.addChild(wall);
            const counter = makeTilemap(9, 3, (x, y) => (y === 0 ? [WALL_IN, [tB(8, 9), tB(9, 9), tB(10, 9), tB(10, 9), tB(11, 9), tB(10, 9), tB(10, 9), tB(9, 9), tB(8, 9)][x], 0, 0] : [FLOOR, 0, 0, 0]));
            counter.scale.set(PX);
            counter.x = -8;
            counter.y = 380;
            this.root.addChild(counter);
            // the lane
            this.lane = new Sprite(new Bitmap(LANE.w, LANE.h));
            this.lane.x = LANE.x; this.lane.y = LANE.y;
            this.root.addChild(this.lane);
            this.notesLayer = new Sprite();
            this.root.addChild(this.notesLayer);
            this.zone = new Sprite(new Bitmap(84, 84));
            this.zone.anchor.set(0.5, 0.5);
            this.zone.x = LANE.hitX; this.zone.y = LANE.y + LANE.h / 2 + 8;
            this.root.addChild(this.zone);
            this.drawZone();
            this.judgeSpr = new Sprite(new Bitmap(240, 34));
            this.judgeSpr.anchor.set(0.5, 0.5);
            this.judgeSpr.x = LANE.hitX + 40; this.judgeSpr.y = LANE.y + 20;
            this.judgeSpr.visible = false;
            this.root.addChild(this.judgeSpr);
            this.judgeT = 0;
            // the recipe card, the cook's hands, the finished dishes
            this.card = new Sprite(new Bitmap(560, 128));
            this.card.x = Math.round(W / 2 - 280); this.card.y = 256;
            this.root.addChild(this.card);
            this.tool = new Sprite(new Bitmap(32, 32));
            this.tool.anchor.set(0.5, 0.85);
            this.tool.scale.set(PX);
            this.tool.x = Math.round(W / 2); this.tool.y = 500;
            this.root.addChild(this.tool);
            this.plates = new Sprite(new Bitmap(W - 60, 96));
            this.plates.x = 30; this.plates.y = 612;
            this.root.addChild(this.plates);
            this.legend = new Sprite(new Bitmap(W - 60, 34));
            this.legend.x = 30; this.legend.y = 572;
            this.root.addChild(this.legend);
            super.setup();
            this.drawLegendRow();
            this.buildNotes();
        }
        buildNotes() {
            const beat = 3600 / this.cfg.bpm;
            this.beat = beat;
            this.travel = Math.round((LANE.w - (LANE.hitX - LANE.x) - 40) / this.cfg.speed);
            let t0 = this.travel + 40;
            this.notes = [];
            this.dishes = this.cfg.dishes.map((key, di) => {
                const rec = RECIPES[key];
                const steps = rec.steps.split(" ").map(s => { const [kind, b] = s.split(":"); return { kind, b: Number(b) }; });
                const start = t0;
                for (const s of steps) this.notes.push({ kind: s.kind, t: Math.round(start + s.b * beat), dish: di, res: null, spr: null });
                t0 += (steps[steps.length - 1].b + 3) * beat;
                return { key, name: rec.name, icon: rec.icon, add: rec.add, n: steps.length, start, res: null };
            });
            this.end = this.notes[this.notes.length - 1].t + 70;
            for (const n of this.notes) {
                n.spr = new Sprite(this.noteBitmap(n));
                n.spr.anchor.set(0.5, 0.5);
                n.spr.visible = false;
                this.notesLayer.addChild(n.spr);
            }
        }
        noteIcon(n) {
            const d = this.dishes[n.dish], st = STEPS[n.kind];
            return n.kind === "serve" ? d.icon : n.kind === "add" ? d.add : st.icon;
        }
        noteBitmap(n) {
            const b = new Bitmap(70, 86), st = STEPS[n.kind];
            panel(b, 3, 3, 64, 64, { cut: 6, fill: "rgba(14,15,19,0.95)", line: st.colour, accent: false });
            b.fillRect(5, 5, 60, 4, st.colour);
            icon(b, this.noteIcon(n), 15, 14, 40);
            keyCap(b, st.key === "ok" ? "O" : st.key, 22, 60, 26, st.colour);
            return b;
        }
        drawZone() {
            const b = this.zone.bitmap, c = b.context;
            b.clear();
            c.save();
            c.strokeStyle = ST().accent; c.lineWidth = 3;
            const L = 18;
            for (const [x, y, sx, sy] of [[3, 3, 1, 1], [81, 3, -1, 1], [3, 81, 1, -1], [81, 81, -1, -1]]) {
                c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke();
            }
            c.fillStyle = "rgba(255,210,63,0.10)"; c.fillRect(6, 6, 72, 72);
            c.restore();
            dirty(b);
        }
        drawLegendRow() {
            const b = this.legend.bitmap;
            b.clear();
            let x = 4;
            for (const k of STEP_ORDER) {
                const st = STEPS[k];
                x += keyCap(b, st.key === "ok" ? "O" : st.key, x, 4, 26, st.colour) + 6;
                txt(b, st.name, x, 5, 160, { size: 19, color: ST().text });
                x += Math.ceil(measure(b, st.name, 19)) + 22;
            }
            txt(b, "P - pauza", b.width - 160, 5, 156, { size: 17, color: ST().muted, align: "right" });
        }
        currentDish() {
            const n = this.notes.find(x => !x.res);
            return n ? n.dish : this.dishes.length - 1;
        }
        press(key) {
            const cands = this.notes.filter(n => !n.res && Math.abs(n.t - this.t) <= WIN.good);
            if (!cands.length) return;
            const n = cands[0], d = Math.abs(n.t - this.t);
            if (STEPS[n.kind].key === key) {
                n.res = d <= WIN.perfect ? "perfect" : "good";
                const st = STEPS[n.kind];
                se(st.se[0], st.se[1], st.se[2]);
                this.judge(n.res === "perfect" ? "Idealnie!" : "Dobrze", n.res === "perfect" ? ST().accent : GOOD);
                this.cook(n);
            } else {
                n.res = "wrong";
                se("Buzzer1", 45);
                this.judge("Nie ten krok!", BAD);
            }
            this.dishCheck(n.dish);
        }
        judge(text, colour) {
            const b = this.judgeSpr.bitmap;
            b.clear();
            txt(b, text, 0, 2, 240, { size: 24, color: colour, bold: true, outline: 4, align: "center" });
            this.judgeSpr.visible = true;
            this.judgeT = 0;
        }
        cook(n) {
            this.toolKind = n.kind;
            this.toolT = 0;
            const b = this.tool.bitmap;
            b.clear();
            icon(b, this.noteIcon(n), 0, 0, 32);
            const W = Graphics.width;
            if (n.kind === "spice") this.burst(W / 2, 470, "#b6f0a0", 8, 1.6, 0.12);
            if (n.kind === "stir") this.burst(W / 2, 470, "#ffffff", 5, 1.2, -0.03);
            if (n.kind === "cut") this.burst(W / 2, 500, "#ffcf9a", 5, 2.0, 0.15);
        }
        dishCheck(di) {
            const ns = this.notes.filter(n => n.dish === di);
            if (ns.some(n => !n.res)) return;
            const d = this.dishes[di];
            if (d.res) return;
            const score = ns.reduce((a, n) => a + (n.res === "perfect" ? 100 : n.res === "good" ? 65 : 0), 0) / ns.length;
            d.res = { score: Math.round(score), stars: score >= 90 ? 3 : score >= 65 ? 2 : score >= 35 ? 1 : 0 };
            this.float(d.name + ": " + ["spalone...", "jadalne", "smaczne", "wyborne!"][d.res.stars], Graphics.width / 2, 250, d.res.stars >= 2 ? ST().accent : WARN, 24, d.icon);
        }
        tick(k, kt) {
            if (this.done) return;
            for (const key of ["left", "up", "right", "down", "ok"]) if (kt[key]) this.press(key);
            for (const n of this.notes) {
                if (!n.res && this.t > n.t + WIN.good) {
                    n.res = "miss";
                    this.judge("Pudło", BAD);
                    this.dishCheck(n.dish);
                }
            }
            if (this.toolKind) this.toolT++;
            this.judgeT++;
            this.t++;
            this.tickFx();
            if (this.t >= this.end) this.finish();
        }
        finish() {
            const count = r => this.notes.filter(n => n.res === r).length;
            const perfect = count("perfect"), good = count("good"), miss = count("miss") + count("wrong");
            const score = this.notes.reduce((a, n) => a + (n.res === "perfect" ? 100 : n.res === "good" ? 65 : 0), 0) / this.notes.length;
            this.ctx.kitchenQ = score / 100;
            const g = [], b = [];
            if (perfect >= this.notes.length * 0.6) g.push("Kuchnia w punkt: " + perfect + " z " + this.notes.length + " kroków idealnie");
            const best = this.dishes.filter(d => d.res && d.res.stars === 3);
            if (best.length) g.push("Wyborne: " + best.map(d => d.name).join(", "));
            if (miss) b.push("Pomylone lub spóźnione kroki: " + miss);
            const burnt = this.dishes.filter(d => d.res && d.res.stars === 0);
            if (burnt.length) b.push("Nieudane: " + burnt.map(d => d.name).join(", "));
            this.complete(score, { notes: this.notes.length, perfect, good, miss, dishes: this.dishes.map(d => ({ name: d.name, score: d.res ? d.res.score : 0, stars: d.res ? d.res.stars : 0 })) }, g, b);
        }
        skipData(score) { this.ctx.kitchenQ = score / 100; return { notes: 0, perfect: 0, good: 0, miss: 0, dishes: [], skipped: true }; }
        progress() { return clamp(this.t / this.end, 0, 1); }
        hud() {
            const di = this.currentDish();
            return { timer: 1 - this.progress(), label: "Danie " + (di + 1) + " z " + this.dishes.length + ": " + this.dishes[di].name, right: "" };
        }
        frame() {
            // the lane and its beat
            const b = this.lane.bitmap;
            const beatPhase = ((this.t - (this.travel + 40)) % this.beat + this.beat) % this.beat;
            const pulse = Math.max(0, 1 - beatPhase / 10);
            if (this._laneKey !== Math.round(pulse * 10)) {
                this._laneKey = Math.round(pulse * 10);
                b.clear();
                panel(b, 0, 0, LANE.w, LANE.h, { cut: 8 });
                const y = LANE.h / 2 + 8;
                b.fillRect(20, y - 2, LANE.w - 40, 4, "rgba(255,255,255,0.08)");
                b.fillRect(LANE.hitX - LANE.x - 2, 20, 4, LANE.h - 30, "rgba(255,210,63," + (0.18 + 0.5 * pulse) + ")");
                txt(b, "Kroki przepisu", LANE.w - 316, 6, 300, { size: 16, color: ST().muted, align: "right" });
            }
            this.zone.scale.set(1 + 0.06 * pulse);
            this.judgeSpr.scale.set(1 + 0.25 * Math.max(0, 1 - this.judgeT / 6));
            this.judgeSpr.opacity = 255 * clamp(1 - (this.judgeT - 30) / 12, 0, 1);
            // notes
            for (const n of this.notes) {
                const x = LANE.hitX + (n.t - this.t) * this.cfg.speed;
                const show = x < LANE.x + LANE.w - 30 && (!n.res || this.t - n.t < 16);
                n.spr.visible = show && x > LANE.x - 40;
                if (!n.spr.visible) continue;
                n.spr.x = Math.round(x);
                n.spr.y = LANE.y + LANE.h / 2 + 18;
                if (n.res) {
                    const a = (this.t - n.t) / 16;
                    n.spr.opacity = 255 * (1 - clamp(a, 0, 1));
                    n.spr.scale.set(n.res === "perfect" || n.res === "good" ? 1 + 0.4 * clamp(a, 0, 1) : 1);
                    n.spr.setColorTone(n.res === "perfect" || n.res === "good" ? [40, 40, 0, 0] : [60, -60, -60, 120]);
                }
            }
            // the card of the current dish: its steps, done ones coloured
            const di = this.currentDish(), d = this.dishes[di];
            const ck = di + "|" + this.notes.filter(n => n.dish === di).map(n => n.res || "-").join("");
            if (ck !== this._cardKey) {
                this._cardKey = ck;
                const cb = this.card.bitmap;
                cb.clear();
                panel(cb, 0, 0, 560, 128, { cut: 6 });
                icon(cb, d.icon, 16, 14, 48);
                txt(cb, "Teraz: " + d.name, 76, 12, 460, { size: 26, color: ST().accent, bold: true });
                txt(cb, "danie " + (di + 1) + " z " + this.dishes.length, 76, 44, 300, { size: 16, color: ST().muted });
                const ns = this.notes.filter(n => n.dish === di);
                const w = 44, x0 = Math.round((560 - ns.length * w) / 2);
                ns.forEach((n, i) => {
                    const x = x0 + i * w, col = n.res === "perfect" ? ST().accent : n.res === "good" ? GOOD : n.res ? BAD : ST().line;
                    panel(cb, x + 2, 72, w - 4, 44, { cut: 3, accent: false, line: col, fill: n.res ? "rgba(30,32,38,0.95)" : "rgba(16,17,21,0.9)" });
                    icon(cb, this.noteIcon(n), x + 6, 78, 32);
                });
            }
            // the cook's hands: the last step's tool moving
            const tt = this.toolT || 0, kind = this.toolKind;
            this.tool.visible = !!kind && tt < 40;
            if (this.tool.visible) {
                this.tool.rotation = kind === "cut" ? -0.6 + 0.6 * Math.abs(Math.sin(tt / 4)) : kind === "stir" ? Math.sin(tt / 3) * 0.4 : 0;
                this.tool.y = 500 + (kind === "add" ? -40 + Math.min(40, tt * 3) : kind === "serve" ? 0 : 0);
                this.tool.x = Graphics.width / 2 + (kind === "serve" ? tt * 6 : kind === "spice" ? Math.sin(tt / 2) * 6 : 0);
                this.tool.opacity = 255 * (1 - clamp((tt - 26) / 14, 0, 1));
            }
            // the finished dishes
            const pk = this.dishes.map(x => (x.res ? x.res.stars : "-")).join("");
            if (pk !== this._platesKey) {
                this._platesKey = pk;
                const pb = this.plates.bitmap;
                pb.clear();
                panel(pb, 0, 0, pb.width, 96, { cut: 6 });
                txt(pb, "Gotowe na wieczór", 18, 8, 300, { size: 18, color: ST().muted });
                const w = 250, x0 = Math.max(220, Math.round((pb.width - this.dishes.length * w) / 2) + 90);
                this.dishes.forEach((x, i) => {
                    const px = x0 + i * w;
                    icon(pb, x.icon, px, 22, 48);
                    txt(pb, x.name, px + 56, 18, 190, { size: 19, color: x.res ? ST().text : ST().muted, bold: !!x.res });
                    const stars = x.res ? x.res.stars : 0;
                    for (let s = 0; s < 3; s++) drawStar(pb, px + 66 + s * 26, 62, 10, x.res && s < stars ? ST().accent : "#3a3e46");
                });
            }
        }
        state() {
            return { t: this.t, end: this.end, notes: this.notes.map(n => ({ kind: n.kind, key: STEPS[n.kind].key, t: n.t, res: n.res })), windows: WIN };
        }
    }
    function drawStar(b, x, y, r, colour) {
        const c = b.context;
        c.save();
        c.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
            c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        c.closePath();
        c.fillStyle = colour; c.fill();
        c.restore();
        dirty(b);
    }

    // ==================================================================
    // Part 4: the evening - guests order, take the dish from the bar, bring it to the right guest
    // ==================================================================
    const SEAT_FEET = 4;
    class PartServe extends Part {
        setup() {
            const c = this.cfg;
            this.room = new Room(this, { evening: true, melia: true });
            this.root.addChild(this.room.root);
            this.hero = { x: standPt(4, 3).x, y: standPt(4, 3).y };
            this.hero.fig = this.room.addFigure(heroLook(), 4, 3, 2);
            this.hero.fig._sid = 1;
            this.menu = MENU_ORDER.filter(k => c.menu.includes(k));
            // the bar: one spot per dish on the counter
            this.spots = this.menu.map((key, i) => {
                const tx = COUNTER_X0 + i, s = new Sprite(new Bitmap(40, 40));
                icon(s.bitmap, dishIcon(key), 4, 4, 32);
                s.x = tx * T + 4; s.y = COUNTER_Y * T - 6;
                this.room.decor.addChild(s);
                return { key, tx, ty: COUNTER_Y, spr: s };
            });
            this.fire = this.ctx.fire === undefined ? 3 : this.ctx.fire;
            this.room.setFire(this.fire);
            this.hands = [];
            this.handsSpr = new Sprite(new Bitmap(80, 40));
            this.handsSpr.anchor.set(0.5, 1);
            this.handsSpr.visible = false;
            this.room.over.addChild(this.handsSpr);
            this.prompt = new Prompt();
            this.room.over.addChild(this.prompt);
            this.guests = [];
            this.nextId = 1;
            this.schedule = [];
            const span = c.spawnEnd - 60;
            for (let i = 0; i < c.guests; i++) this.schedule.push(Math.round(60 + (i + 0.15 + this.rng() * 0.6) * span / c.guests));
            this.looks = shuffle(PEOPLE.guests, this.rng);
            this.stats = { guests: 0, orders: 0, served: 0, mistakes: 0, walkouts: 0, noSeat: 0, speed: 0, tips: 0, cold: 0 };
            this.tipsF = 0;
            this.side = new Sprite(new Bitmap(SIDE.w, SIDE.h));
            this.side.x = SIDE.x; this.side.y = SIDE.y;
            this.root.addChild(this.side);
            this.fxLayer.x = ROOM_X; this.fxLayer.y = ROOM_Y;
            this.notes = [];
            super.setup();
            this.limit = c.time;
            this.bgsOn = false;
        }
        // ---- guests
        freeSeat() {
            const free = this.room.seats.filter(s => !s.guest && s.table.dirty <= 0);
            return free.length ? free[Math.floor(this.rng() * free.length)] : null;
        }
        spawn() {
            const look = this.looks[(this.nextId - 1) % this.looks.length];
            const f = new Figure(look);
            f._sid = 10 + this.nextId;
            const door = standPt(9, RR - 1);
            const g = { id: this.nextId++, fig: f, x: door.x, y: door.y + 40, state: "queue", wait: 0, order: [], got: [], patience: 0, max: this.cfg.patience, tip: 0, seat: null, path: null, bubble: null, t: 0 };
            f.x = g.x; f.y = g.y; f.dir = 8; f.refresh();
            this.room.chars.addChild(f);
            this.guests.push(g);
            this.stats.guests++;
            se("Door2", 40, 110);
        }
        seatGuest(g, seat) {
            g.seat = seat;
            seat.guest = g;
            const goal = standPt(seat.tx, seat.ty);
            const door = standPt(9, RR - 1);
            g.path = this.room.path(door.x, door.y, goal.x, goal.y, (x, y) => this.room.guestWalkable(x, y, seat)) || [door, goal];
            g.state = "enter";
        }
        walkGuest(g, speed) {
            if (!g.path || !g.path.length) return true;
            const p = g.path[0], dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy);
            if (d <= speed) { g.x = p.x; g.y = p.y; g.path.shift(); g.fig.advance(d); }
            else { g.x += dx / d * speed; g.y += dy / d * speed; g.fig.advance(speed); g.fig.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : dy > 0 ? 2 : 8; }
            g.fig.moving = true;
            return !g.path.length;
        }
        makeOrder() {
            const pick = () => {
                const total = this.menu.reduce((a, k) => a + DISHES[k].weight, 0);
                let r = this.rng() * total;
                for (const k of this.menu) { r -= DISHES[k].weight; if (r <= 0) return k; }
                return this.menu[0];
            };
            const o = [pick()];
            if (this.rng() < this.cfg.double) { let k2 = pick(); if (k2 === o[0]) k2 = pick(); o.push(k2); }
            return o;
        }
        tickGuest(g) {
            g.t++;
            const f = g.fig;
            switch (g.state) {
                case "queue": {
                    const seat = this.freeSeat();
                    if (seat) this.seatGuest(g, seat);
                    else {
                        g.wait++;
                        if (g.wait === 1) this.bubble(g, "?");
                        if (g.wait > 600) { g.state = "leave"; this.stats.noSeat++; this.float("Nie ma gdzie usiąść...", ROOM_X + g.x, ROOM_Y + g.y - 70, WARN, 18); g.path = [{ x: g.x, y: g.y + 80 }]; }
                    }
                    break;
                }
                case "enter":
                    if (this.walkGuest(g, 2.4)) {
                        g.state = "think";
                        g.t = 0;
                        f.moving = false;
                        f.dir = g.seat.face;
                        g.x = standPt(g.seat.tx, g.seat.ty).x;
                        g.y = standPt(g.seat.tx, g.seat.ty).y - SEAT_FEET;
                    }
                    break;
                case "think":
                    if (g.t >= 70) {
                        g.state = "wait";
                        g.order = this.makeOrder();
                        g.patience = g.max;
                        g.t = 0;
                        this.stats.orders += g.order.length;
                        se("Cursor3", 45, 120);
                    }
                    break;
                case "wait":
                    g.patience -= this.fire <= 0 ? 1.5 : 1;
                    if (g.patience <= 0) {
                        g.state = "angry";
                        g.t = 0;
                        this.stats.walkouts++;
                        se("Buzzer2", 55);
                        this.float("Hmpf! Wychodzę!", ROOM_X + g.x, ROOM_Y + g.y - 80, BAD, 20);
                    }
                    break;
                case "eat":
                    if (g.t >= this.cfg.eat) {
                        g.state = "pay";
                        g.t = 0;
                        const tip = Math.round(g.tip);
                        this.ctx.tips += tip;
                        this.stats.tips += tip;
                        if (tip > 0) { se("Coin", 60); this.float("+" + tip + " G", ROOM_X + g.x, ROOM_Y + g.y - 76, ST().accent, 22, GOLD_ICON); }
                        else this.float("Dziękuję.", ROOM_X + g.x, ROOM_Y + g.y - 76, ST().text, 18);
                    }
                    break;
                case "pay":
                case "angry":
                    if (g.t >= 40) this.leave(g);
                    break;
                case "leave":
                    if (this.walkGuest(g, 2.6)) { g.state = "gone"; }
                    break;
            }
            f.x = g.x;
            f.y = g.y + 4;
            if (g.state !== "enter" && g.state !== "leave") f.moving = false;
            f.refresh();
        }
        leave(g) {
            const seat = g.seat;
            if (seat) {
                seat.guest = null;
                if (g.state === "pay") this.room.setDirty(seat.table, 1);
                seat.table.wipe = 0;
                g.x = standPt(seat.tx, seat.ty).x;
                const exit = standPt(9, RR - 1);
                g.path = (this.room.path(g.x, g.y, exit.x, exit.y, (x, y) => this.room.guestWalkable(x, y, seat)) || [exit]).concat([{ x: exit.x, y: exit.y + 60 }]);
                if (g.path.length && g.path[0].x === g.x) g.path.shift();
            }
            if (g.plate) { g.plate.parent && g.plate.parent.removeChild(g.plate); g.plate = null; }
            g.state = "leave";
        }
        bubble(g, mark) {
            g.mark = mark;
        }
        // ---- the hero's targets
        targets() {
            const r = this.room, list = [];
            for (const s of this.spots) {
                const holding = this.hands.includes(s.key);
                const full = this.hands.length >= 2 || this.hands.includes("log");
                list.push({ kind: "spot", spot: s, rect: r.rectOf(s.tx, s.ty), label: (full && holding ? "Odstaw: " : full ? "" : "Weź: ") + DISHES[s.key].name, busy: full && !holding, putBack: full && holding });
            }
            if (this.hands.length && !this.hands.includes("log")) list.push({ kind: "tray", rect: r.rectOf(COUNTER_X1, COUNTER_Y), label: "Odstaw wszystko na ladę" });
            for (const g of this.guests) {
                if (!g.seat || g.state !== "wait") continue;
                const want = g.order.filter((k, i) => !g.got[i]);
                const has = this.hands.find(k => want.includes(k));
                list.push({ kind: "guest", guest: g, rect: r.rectOf(g.seat.tx, g.seat.ty), label: has ? "Podaj: " + DISHES[has].name : this.hands.length ? "Chce: " + want.map(k => DISHES[k].name).join(", ") : "Chce: " + want.map(k => DISHES[k].name).join(", "), dim: !has && !this.hands.length, wrong: !has && this.hands.length > 0 && !this.hands.includes("log") });
            }
            for (const tb of r.tables) if (tb.dirty > 0 && !tb.seats.some(s => s.guest && s.guest.state !== "leave")) list.push({ kind: "wipe", table: tb, rect: r.tableRect(tb), hold: true, label: "Przetrzyj stół" });
            if (this.hands.includes("log")) list.push({ kind: "fire", rect: r.rectOf(SPOT.fire.tx, SPOT.fire.ty), label: "Dorzuć do kominka" });
            else list.push({ kind: "log", rect: r.rectOf(SPOT.pile.tx, SPOT.pile.ty), label: this.hands.length ? "Masz zajęte ręce" : "Weź polano", busy: this.hands.length > 0 });
            return list;
        }
        act(tg) {
            const h = this.hero, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 64;
            if (tg.kind === "spot") {
                const key = tg.spot.key, i = this.hands.indexOf(key);
                if (tg.putBack || (i >= 0 && this.hands.length >= 2)) { this.hands.splice(i, 1); se("Cancel1", 45); }
                else if (tg.busy) { se("Buzzer1", 45); this.float("Masz pełne ręce (dwie rzeczy)", fx, fy, WARN, 18); }
                else { this.hands.push(key); se("Equip1", 55, 110); }
                this.drawHands();
            } else if (tg.kind === "guest") {
                const g = tg.guest, want = g.order.map((k, i) => (g.got[i] ? null : k));
                const hi = this.hands.findIndex(k => want.includes(k));
                if (hi < 0) {
                    if (!this.hands.length || this.hands.includes("log")) return;
                    this.stats.mistakes++;
                    g.patience = Math.max(1, g.patience - g.max * 0.15);
                    g.shake = 20;
                    se("Buzzer1", 55);
                    this.float("To nie to, co zamawiałem!", ROOM_X + g.x, ROOM_Y + g.y - 84, BAD, 18);
                    return;
                }
                const key = this.hands.splice(hi, 1)[0];
                g.got[want.indexOf(key)] = true;
                const d = DISHES[key], ratio = clamp(g.patience / g.max, 0, 1);
                const q = d.q === "beer" ? 0.6 + 0.6 * (this.ctx.beerQ === undefined ? 0.7 : this.ctx.beerQ) : d.q === "kitchen" ? 0.6 + 0.6 * (this.ctx.kitchenQ === undefined ? 0.7 : this.ctx.kitchenQ) : 1;
                g.tip += d.tip * (0.4 + 0.8 * ratio) * q * TIP_SCALE;
                this.stats.served++;
                this.stats.speed += ratio;
                se("Decision2", 55, 110);
                this.drawHands();
                if (g.order.every((k, i) => g.got[i])) {
                    g.state = "eat";
                    g.t = 0;
                    this.float(ratio > 0.66 ? "Szybko! Dzięki!" : ratio > 0.33 ? "Dziękuję." : "Nareszcie...", ROOM_X + g.x, ROOM_Y + g.y - 80, ratio > 0.66 ? GOOD : ratio > 0.33 ? ST().text : WARN, 18);
                    const plate = new Sprite(new Bitmap(36, 36));
                    icon(plate.bitmap, dishIcon(g.order[0]), 2, 2, 32);
                    const tb = g.seat.table;
                    plate.x = g.seat.face === 6 ? tb.tx * T + 6 : (tb.tx + 1) * T + 6;
                    plate.y = tb.ty * T - 4;
                    this.room.decor.addChild(plate);
                    g.plate = plate;
                }
            } else if (tg.kind === "tray") {
                this.hands = [];
                se("Cancel1", 45);
                this.drawHands();
            } else if (tg.kind === "log") {
                if (tg.busy) { se("Buzzer1", 45); this.float("Najpierw odnieś to, co niesiesz", fx, fy, WARN, 18); return; }
                this.hands = ["log"];
                se("Equip1", 55, 90);
                this.drawHands();
            } else if (tg.kind === "fire") {
                this.hands = [];
                this.fire = Math.min(3, Math.floor(this.fire) + 1);
                this.room.setFire(this.fire);
                se("Fire1", 55, 110);
                this.burst(ROOM_X + cx(SPOT.fire.tx), ROOM_Y + SPOT.fire.ty * T + 20, "#ffb347", 10, 1.8, -0.02);
                this.drawHands();
            }
        }
        drawHands() {
            const b = this.handsSpr.bitmap;
            showIf(this.handsSpr, this.hands.length);
            if (!this.hands.length) return;
            b.clear();
            if (this.hands[0] === "log") { icon(b, 381, 22, 2, 36); return; }
            this.hands.forEach((k, i) => icon(b, dishIcon(k), (this.hands.length === 1 ? 22 : 4 + i * 38), 4, 34));
        }
        tick(k, kt) {
            if (this.done) return;
            if (!this.bgsOn) { this.bgsOn = true; AudioManager.playBgs({ name: "People1", volume: 30, pitch: 100, pan: 0 }); }
            const r = this.room, h = this.hero;
            heroWalk(r, h, k);
            this.handsSpr.x = h.x; this.handsSpr.y = h.y - 54;
            while (this.schedule.length && this.schedule[0] <= this.t) { this.schedule.shift(); this.spawn(); }
            for (const g of this.guests) this.tickGuest(g);
            for (const g of this.guests.filter(x => x.state === "gone")) { g.fig.parent && g.fig.parent.removeChild(g.fig); if (g.bspr) { g.bspr.parent && g.bspr.parent.removeChild(g.bspr); } }
            this.guests = this.guests.filter(x => x.state !== "gone");
            // the fire burns down
            if (this.fire > 0) {
                const before = Math.ceil(this.fire);
                this.fire = Math.max(0, this.fire - this.cfg.fireDecay);
                if (Math.ceil(this.fire) !== before) r.setFire(this.fire);
                if (this.fire <= 0) this.float("Kominek wygasł! Zimno...", ROOM_X + cx(SPOT.fire.tx), ROOM_Y + 70, BAD, 20);
            } else this.stats.cold++;
            // the hero's action
            const tg = r.nearest(h, this.targets());
            this.target = tg;
            if (tg && tg.hold) {
                const tb = tg.table;
                if (k.ok) {
                    tb.wipe++;
                    r.setDirty(tb, 1 - tb.wipe / this.cfg.wipe);
                    if (tb.wipe % 8 === 1) se("Water1", 30, 150);
                    if (tb.wipe >= this.cfg.wipe) { r.setDirty(tb, 0); tb.wipe = 0; se("Chime2", 45, 130); this.burst(ROOM_X + tb.tx * T + 48, ROOM_Y + tb.ty * T + 16, "#fff7c0", 8, 2); }
                }
            } else if (tg && kt.ok) this.act(tg);
            if (tg) {
                const label = tg.busy && tg.kind === "spot" ? "Masz pełne ręce" : tg.label + (tg.hold ? " (przytrzymaj)" : "");
                this.prompt.show(label, tg.rect.x + tg.rect.w / 2, tg.kind === "guest" ? tg.rect.y + tg.rect.h + 36 : tg.rect.y - 6, tg.hold ? tg.table.wipe / this.cfg.wipe : undefined, tg.busy || tg.dim);
            } else this.prompt.hide();
            // Melia plays
            if (r.melia) {
                r.melia.moving = true;
                r.melia.step = this.t / 16;
                r.melia.refresh();
                if (this.t % 50 === 0) this.float("♪", ROOM_X + r.melia.x + 14, ROOM_Y + r.melia.y - 58, ST().accent, 22);
            }
            r.tickFire(this.t);
            r.sortChars();
            this.tickFx();
            this.t++;
            const quiet = !this.schedule.length && this.guests.every(g => g.state === "leave" || g.state === "gone");
            if (this.t >= this.limit || (quiet && this.t > 600)) this.finish();
        }
        finish() {
            const s = this.stats;
            const unserved = this.guests.filter(g => g.state === "wait" || g.state === "think").reduce((a, g) => a + g.order.filter((k, i) => !g.got[i]).length, 0);
            const orders = Math.max(1, s.orders + (this.guests.filter(g => g.state === "think").length));
            const ratio = s.served / orders, speed = s.served ? s.speed / s.served : 0;
            let score = 100 * (0.65 * ratio + 0.35 * speed * ratio) - 5 * s.mistakes - 6 * s.walkouts - 3 * s.noSeat;
            // the ones who are still eating pay now
            for (const g of this.guests) if (g.state === "eat") { const tip = Math.round(g.tip); this.ctx.tips += tip; s.tips += tip; }
            const g = [], b = [];
            if (s.served >= orders && s.served > 0) g.push("Obsłużeni wszyscy goście (" + s.guests + ")");
            else if (s.served > 0) g.push("Podane zamówienia: " + s.served + " z " + orders);
            if (speed >= 0.6 && s.served >= 3) g.push("Szybka obsługa - napiwki: " + s.tips + " G");
            if (s.mistakes) b.push("Pomyłki przy stołach: " + s.mistakes);
            if (s.walkouts) b.push("Wyszli bez płacenia: " + s.walkouts);
            if (s.noSeat) b.push("Nie mieli gdzie usiąść (brudne stoły): " + s.noSeat);
            if (unserved) b.push("Nie podane do zamknięcia: " + unserved);
            if (s.cold > 600) b.push("Wygasły kominek - zmarznięci goście");
            if (this.bgsOn) AudioManager.fadeOutBgs(1);
            this.complete(score, { guests: s.guests, orders, served: s.served, mistakes: s.mistakes, walkouts: s.walkouts, noSeat: s.noSeat, unserved, tips: s.tips, speed: Math.round(speed * 100) / 100 }, g, b);
        }
        skipData(score) { const tip = Math.round(score / 4); this.ctx.tips += tip; return { guests: 0, orders: 0, served: 0, mistakes: 0, walkouts: 0, noSeat: 0, unserved: 0, tips: tip, skipped: true }; }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() {
            const left = Math.max(0, this.limit - this.t);
            return { timer: left / this.limit, label: "Do zamknięcia: " + fmtTime(left), right: "Obsłużone: " + this.stats.served };
        }
        frame() {
            // the order bubbles over the guests
            for (const g of this.guests) {
                const show = g.state === "wait" || g.state === "think" || (g.state === "queue" && g.wait > 0);
                if (!show) { if (g.bspr) g.bspr.visible = false; continue; }
                if (!g.bspr) {
                    g.bspr = new Sprite(new Bitmap(112, 70));
                    g.bspr.anchor.set(0.5, 1);
                    this.room.over.addChild(g.bspr);
                }
                g.bspr.visible = true;
                const shake = g.shake > 0 ? Math.sin(g.shake--) * 3 : 0;
                g.bspr.x = Math.round(g.x + shake);
                g.bspr.y = Math.round(g.y - 60);
                const ratio = g.state === "wait" ? clamp(g.patience / g.max, 0, 1) : 1;
                const key = g.state + "|" + g.order.map((k, i) => (g.got[i] ? "x" : k)).join(",") + "|" + Math.round(ratio * 30);
                if (key === g.bkey) continue;
                g.bkey = key;
                const b = g.bspr.bitmap;
                b.clear();
                const want = g.order.filter((k, i) => !g.got[i]);
                const w = g.state === "wait" ? Math.max(56, 12 + want.length * 38) : 48, x0 = Math.round((112 - w) / 2);
                drawBubble(b, x0, 4, w, 52, ratio);
                if (g.state === "wait") {
                    want.forEach((k, i) => icon(b, dishIcon(k), x0 + 8 + i * 38 + (want.length === 1 ? (w - 16 - 34) / 2 : 0), 8, 34));
                    const col = ratio > 0.5 ? GOOD : ratio > 0.25 ? WARN : BAD;
                    bar(b, x0 + 6, 46, w - 12, 5, ratio, col);
                } else txt(b, g.state === "queue" ? "?" : "...", x0, 8, w, { size: 26, color: ST().accent, bold: true, align: "center" });
            }
            // the side panel
            const waiting = this.guests.filter(g => g.state === "wait").sort((a, b) => a.patience - b.patience);
            const key = waiting.map(g => g.id + ":" + g.order.map((k, i) => (g.got[i] ? "x" : k)).join(",") + ":" + Math.round(g.patience / g.max * 20)).join("|") + "#" + this.hands.join(",") + "#" + Math.ceil(this.fire * 3) + "#" + this.stats.served + "#" + this.ctx.tips;
            if (key === this._sideKey) return;
            this._sideKey = key;
            const b = this.side.bitmap;
            b.clear();
            panel(b, 0, 0, SIDE.w, SIDE.h, { cut: 6 });
            txt(b, "Zamówienia", 20, 12, 200, { size: 25, color: ST().accent, bold: true });
            txt(b, waiting.length ? String(waiting.length) : "brak", SIDE.w - 120, 16, 100, { size: 18, color: ST().muted, align: "right" });
            let y = 52;
            for (const g of waiting.slice(0, 5)) {
                const want = g.order.filter((k, i) => !g.got[i]), ratio = clamp(g.patience / g.max, 0, 1);
                panel(b, 14, y, SIDE.w - 28, 52, { cut: 4, accent: false, fill: "rgba(22,24,29,0.9)", line: ratio < 0.25 ? BAD : ST().line });
                txt(b, "Stół " + (g.seat.table.i + 1), 24, y + 4, 90, { size: 17, color: ST().muted });
                want.forEach((k, i) => icon(b, dishIcon(k), 100 + i * 36, y + 9, 32));
                txt(b, want.map(k => DISHES[k].name).join(", "), 24, y + 24, 80, { size: 13, color: ST().text });
                bar(b, 186, y + 22, SIDE.w - 214, 7, ratio, ratio > 0.5 ? GOOD : ratio > 0.25 ? WARN : BAD);
                y += 58;
            }
            if (waiting.length > 5) txt(b, "+ " + (waiting.length - 5) + " więcej", 24, y, 200, { size: 16, color: ST().muted });
            y = 360;
            txt(b, "W rękach", 20, y, 200, { size: 19, color: ST().muted });
            for (let i = 0; i < 2; i++) {
                panel(b, 130 + i * 50, y - 4, 44, 44, { cut: 3, accent: false, fill: "rgba(22,24,29,0.9)" });
                const k = this.hands[i];
                if (k === "log") { if (i === 0) icon(b, 381, 136, y + 2, 32); }
                else if (k) icon(b, dishIcon(k), 136 + i * 50, y + 2, 32);
            }
            y += 54;
            txt(b, "Kominek", 20, y, 120, { size: 19, color: ST().muted });
            const fr = this.fire / 3;
            bar(b, 130, y + 9, SIDE.w - 160, 8, fr, fr > 0.34 ? WARN : BAD);
            if (fr <= 0.34) txt(b, fr <= 0 ? "Zgasł! Dorzuć drewna." : "Przygasa - dorzuć drewna.", 20, y + 22, SIDE.w - 40, { size: 16, color: BAD });
            y += 50;
            txt(b, "Napiwki: " + this.ctx.tips + " G", 20, y, SIDE.w - 40, { size: 20, color: ST().accent, bold: true });
            drawLegend(b, 20, SIDE.h - 98, [[["up", "left", "down", "right"], "lub WSAD"], [["O"], "weź / podaj (przytrzymaj: przetrzyj)"], [["P"], "pauza"]]);
        }
        state() {
            const r = this.room;
            return {
                t: this.t, limit: this.limit, hero: { x: this.hero.x, y: this.hero.y }, hands: this.hands.slice(), fire: this.fire,
                spots: this.spots.map(s => ({ key: s.key, stand: standPt(s.tx, s.ty + 1) })), tray: standPt(COUNTER_X1, COUNTER_Y + 1),
                guests: this.guests.map(g => ({ id: g.id, state: g.state, want: g.order.filter((k, i) => !g.got[i]), patience: g.patience / g.max,
                    table: g.seat ? g.seat.table.i : -1, stands: g.seat ? r.standsAround([g.seat]) : [] })),
                tables: r.tables.map(tb => ({ i: tb.i, dirty: tb.dirty, busy: tb.seats.some(s => s.guest), stands: r.standsAround([{ tx: tb.tx, ty: tb.ty }, { tx: tb.tx + 1, ty: tb.ty }]) })),
                pile: r.standsAround([SPOT.pile]), fireStand: r.standsAround([SPOT.fire]), stats: Object.assign({}, this.stats), target: this.target ? this.target.kind : null
            };
        }
    }
    function drawBubble(b, x, y, w, h, ratio) {
        const S = ST(), c = b.context;
        S.panel(c, x, y, w, h, { cut: 5, fill: "rgba(11,12,15,0.92)", line: ratio < 0.25 ? BAD : S.line });
        c.save();
        c.fillStyle = "rgba(11,12,15,0.92)";
        c.strokeStyle = ratio < 0.25 ? BAD : S.line;
        c.beginPath();
        const mx = x + w / 2;
        c.moveTo(mx - 7, y + h - 1); c.lineTo(mx, y + h + 9); c.lineTo(mx + 7, y + h - 1);
        c.fill();
        c.beginPath(); c.moveTo(mx - 7, y + h - 0.5); c.lineTo(mx, y + h + 9); c.lineTo(mx + 7, y + h - 0.5); c.stroke();
        c.restore();
        dirty(b);
    }

    const PART_CLASSES = { clean: PartClean, beer: PartBeer, kitchen: PartKitchen, serve: PartServe };

    // ==================================================================
    // Cards: the short explanation before each part (Borgar explains)
    // ==================================================================
    function cardSpec(id, cfg, scene) {
        const L = scene.level;
        if (id === "intro") {
            return {
                kicker: "ZMIANA NR " + scene.shiftNo + (L ? " · TRUDNOŚĆ " + L : ""),
                title: "Praca w tawernie",
                sub: "„Pod Złotym Kuflem”",
                say: scene.opts.intro || "Fartuch na grzbiet i do roboty! Uczciwie popracujesz - uczciwie zapłacę. Każdy grosz przybliża spłatę długu twojego dziadka.",
                lines: scene.partIds.map((p, i) => (i + 1) + ". " + PART_DEFS[p].title + " - " + PART_DEFS[p].sub),
                keys: [[["P"], "pauza w trakcie zmiany (można ją przerwać)"]]
            };
        }
        if (id === "clean") {
            return {
                kicker: "CZĘŚĆ " + (scene.partIndex + 1) + " Z " + scene.partIds.length, title: "Przed otwarciem", sub: "sprzątanie i drewno",
                say: "Sala po wczorajszym wieczorze to pobojowisko. Zanim wpuścimy gości, ogarnij ją. Masz " + Math.round(cfg.time / 60) + " sekund.",
                lines: ["Przetrzyj brudne stoły: stań przy stole i przytrzymaj O.", "Przynieś drewno ze stosu w rogu do kominka - po jednym polanie.", "Wynieś worki i kubły ze śmieciami za drzwi wejściowe.", "Za każde zadanie premia, za szybki koniec - ekstra."],
                keys: [[["up", "left", "down", "right"], "/ WSAD: chodzenie"], [["Shift"], "szybciej"], [["O"], "akcja"]]
            };
        }
        if (id === "beer") {
            return {
                kicker: "CZĘŚĆ " + (scene.partIndex + 1) + " Z " + scene.partIds.length, title: "Beczka", sub: "nalewanie piwa na czas",
                say: "Pokaż, czy umiesz nalać. " + cfg.mugs + " kufli, jeden po drugim.",
                lines: ["Przytrzymaj O: z kranu leje się piwo.", "Puść, gdy piana dojdzie do żółtej kreski.", "Piwo leci jeszcze chwilę po puszczeniu - puść odrobinę wcześniej.", "Za mało - goście marudzą, za dużo - rozlane. Równo nalane piwo = większe napiwki wieczorem."],
                keys: [[["O"], "przytrzymaj: lej"]]
            };
        }
        if (id === "kitchen") {
            return {
                kicker: "CZĘŚĆ " + (scene.partIndex + 1) + " Z " + scene.partIds.length, title: "Kuchnia w rytm", sub: "gotowanie do taktu",
                say: "Ja gotuję, ty pomagasz. Rób dokładnie to, co trzeba, i wtedy, kiedy trzeba!",
                lines: ["Kroki przepisu przesuwają się od prawej do lewej.", "Naciśnij właściwy klawisz, gdy krok jest w żółtej ramce.", "Im dokładniej, tym lepsze danie - i większe napiwki za gulasz i zupę."],
                keys: [[["left"], "kroić"], [["up"], "mieszać"], [["right"], "przyprawić"], [["down"], "dorzucić"], [["O"], "podać"]]
            };
        }
        return {
            kicker: "CZĘŚĆ " + (scene.partIndex + 1) + " Z " + scene.partIds.length, title: "Wieczór", sub: "obsługa sali",
            say: "Drzwi otwarte, goście schodzą się na kolację. Nie daj im czekać!",
            lines: ["Gość siada i zamawia: dymek pokazuje, co chce.", "Weź danie z lady (O przy ladzie) - uniesiesz dwie rzeczy - i zanieś właściwemu gościowi (O przy nim). Zbędne danie odstawisz na końcu lady.", "Szybko = napiwek. Pomyłka albo długie czekanie = mniejsza zapłata; zniecierpliwiony gość wychodzi bez płacenia.", "Po gościu przetrzyj stół (przytrzymaj O). Gdy ogień przygasa - dorzuć drewna."],
            keys: [[["up", "left", "down", "right"], "/ WSAD"], [["O"], "weź / podaj"], [["P"], "pauza"]]
        };
    }
    function drawCard(b, spec, foot) {
        const W = b.width, H = b.height, S = ST();
        b.clear();
        b.fillRect(0, 0, W, H, "rgba(0,0,0,0.6)");
        const pw = 980, ph = 540, px = Math.round((W - pw) / 2), py = Math.round((H - ph) / 2);
        panel(b, px, py, pw, ph, { cut: 10 });
        // Borgar's bust
        const bust = ImageManager.loadPicture("People3_5");
        if (bust.isReady() && bust.width) {
            const bw = 250, bh = Math.round(bust.height * bw / bust.width);
            b.context.imageSmoothingEnabled = true;
            b.blt(bust, 0, 0, bust.width, bust.height, px + 18, py + ph - bh - 60, bw, bh);
            b.fillRect(px + 18, py + ph - 60, bw, 2, S.accent);
        }
        txt(b, "Borgar", px + 18, py + ph - 52, 250, { size: 20, color: S.accent, bold: true, align: "center" });
        txt(b, "karczmarz", px + 18, py + ph - 28, 250, { size: 15, color: S.muted, align: "center" });
        const x = px + 296, w = pw - 296 - 30;
        let y = py + 24;
        txt(b, spec.kicker, x, y, w, { size: 16, color: S.muted, bold: true });
        y += 24;
        txt(b, spec.title, x, y, w, { size: 40, color: S.accent, bold: true });
        y += 52;
        txt(b, spec.sub, x, y, w, { size: 20, color: S.text });
        y += 38;
        // the quote
        const q = wrapLines(b, "„" + spec.say + "”", w - 20, 20);
        b.fillRect(x, y + 2, 3, q.length * 27 - 2, S.accentDim);
        for (const l of q) { txt(b, l, x + 14, y, w - 20, { size: 20, color: "#d8dde3" }); y += 27; }
        y += 12;
        for (const line of spec.lines) {
            const ls = wrapLines(b, line, w - 26, 19);
            drawDot(b, x + 6, y + 13, S.accent);
            for (const l of ls) { txt(b, l, x + 20, y, w - 26, { size: 19 }); y += 25; }
            y += 3;
        }
        // the keys and the foot
        const ky = py + ph - 96;
        b.fillRect(x, ky - 12, w, 1, S.line);
        keyHints(b, spec.keys, x, ky, 28, 18);
        txt(b, foot || "O - zaczynamy", x, py + ph - 48, w, { size: 22, color: S.accent, bold: true, align: "right" });
    }
    function drawDot(b, x, y, colour) { b.fillRect(x - 3, y - 3, 6, 6, colour); }

    // ==================================================================
    // The scene
    // ==================================================================
    let pendingOpts = null, running = null, pendingEnd = null;

    class Scene_TavernShift extends Scene_Base {
        initialize() {
            super.initialize();
            this.opts = pendingOpts || {};
            pendingOpts = null;
        }
        create() {
            super.create();
            const st = stats();
            this.shiftNo = st.done + 1;
            this.level = clamp(this.opts.level === undefined || this.opts.level === null || this.opts.level === "" ? Math.min(MAX_LEVEL, st.done) : Number(this.opts.level), 0, MAX_LEVEL);
            this.cfgs = levelCfg(this.level);
            const seed = this.opts.seed !== undefined ? Number(this.opts.seed) : (Date.now() ^ (st.done * 7919)) >>> 0;
            this.rng = makeRng(seed);
            this.ctx = { tips: 0 };
            this.partIds = (Array.isArray(this.opts.parts) && this.opts.parts.length ? this.opts.parts : PART_ORDER).filter(p => PART_DEFS[p]);
            this.turbo = clamp(Math.floor(this.opts.turbo || 1), 1, 20);
            this.cards = this.opts.cards !== false;
            this.startHour = window.$gameSystem && $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 17;
            // preload
            tilesetNames().forEach(n => ImageManager.loadTileset(n));
            [heroLook().name, "People2_Tall", "People3_Tall", "Actor2_Tall", "!Flame"].forEach(n => ImageManager.loadCharacter(n));
            ImageManager.loadSystem("IconSet");
            ImageManager.loadPicture("People3_5");
            this.createLayers();
        }
        createLayers() {
            const W = Graphics.width, H = Graphics.height;
            this.bg = new Sprite(solidBitmap("#060608"));
            this.bg.scale.set(W / 4, H / 4);
            this.addChild(this.bg);
            this.stage = new Sprite();
            this.addChild(this.stage);
            this.hudSpr = new Sprite(new Bitmap(W, 80));
            this.addChild(this.hudSpr);
            this.overlay = new Sprite(new Bitmap(W, H));
            this.addChild(this.overlay);
            this.black = new Sprite(solidBitmap("#000000"));
            this.black.scale.set(W / 4, H / 4);
            this.black.opacity = 0;
            this.addChild(this.black);
        }
        start() {
            super.start();
            running = this;
            this.bgs = AudioManager.saveBgs();
            this.keys = {};
            this.prev = {};
            this.trig = {};
            this.phase = "none";
            this.partIndex = -1;
            this.part = null;
            this.results = {};
            this.paused = false;
            this.pauseSel = 0;
            this.startFadeIn(this.fadeSpeed(), false);
            if (this.cards) this.showCard("intro");
            else this.nextPart();
        }
        update() {
            super.update();
            if (this.phase === "left") return;
            for (let i = 0; i < this.turbo; i++) {
                if (typeof TavernShift.onTick === "function") {
                    try { TavernShift.onTick(this); } catch (e) { console.error(e); TavernShift.onTick = null; }
                }
                this.readKeys();
                this.tick();
                if (this.phase === "leaving" || this.phase === "left") break;
            }
            this.frame();
        }
        readKeys() {
            const now = {
                ok: Input.isPressed("ok") || (this.phase !== "play" && TouchInput.isPressed()), cancel: Input.isPressed("cancel") || Input.isPressed("menu"), shift: Input.isPressed("shift"),
                up: Input.isPressed("up"), down: Input.isPressed("down"), left: Input.isPressed("left"), right: Input.isPressed("right")
            };
            for (const k in now) { this.trig[k] = now[k] && !this.prev[k]; this.prev[k] = now[k]; }
            this.keys = now;
        }
        tick() {
            this.phaseT = (this.phaseT || 0) + 1;
            if (this.trans) {
                const tr = this.trans;
                tr.t++;
                if (tr.t === tr.dur && tr.mid) tr.mid();
                this.black.opacity = 255 * (tr.t <= tr.dur ? tr.t / tr.dur : Math.max(0, 1 - (tr.t - tr.dur) / tr.dur));
                if (tr.t >= tr.dur * 2) { this.trans = null; this.black.opacity = 0; }
                if (!tr || tr.t <= tr.dur) return;
            }
            const k = this.keys, kt = this.trig;
            switch (this.phase) {
                case "card":
                    if (this.phaseT > 14 && kt.ok) {
                        se("Decision1", 60);
                        this.hideOverlay();
                        if (this.cardId === "intro") this.nextPart();
                        else { this.phase = "play"; this.phaseT = 0; }
                    }
                    break;
                case "play":
                    if (this.paused) { this.tickPause(kt); break; }
                    if (kt.cancel) { this.paused = true; this.pauseSel = 0; se("Cancel1", 60); this.drawPause(); break; }
                    this.part.tick(k, kt);
                    if (this.part.done) this.endPart();
                    break;
                case "banner":
                    if (this.phaseT > 20 && kt.ok) { se("Decision1", 60); this.hideOverlay(); this.nextPart(); }
                    break;
                case "summary":
                    if (this.phaseT > 30 && kt.ok) { se("Decision1", 60); this.leave(); }
                    break;
                case "leaving":
                    break;
            }
        }
        frame() {
            if (this.part && this.phase !== "summary" && this.phase !== "leaving") { this.part.frame(); this.drawHud(); }
            if (this.phase === "leaving" && !this.isFading() && !this._popped) {
                this._popped = true;
                this.phase = "left";
                SceneManager.pop();
            }
        }
        hideOverlay() { this.overlay.visible = false; }
        // ---- flow
        showCard(id) {
            this.cardId = id;
            this.phase = "card";
            this.phaseT = 0;
            drawCard(this.overlay.bitmap, cardSpec(id, this.part ? this.part.cfg : null, this), id === "intro" ? "O - zaczynamy" : "O - do roboty");
            this.overlay.visible = true;
        }
        nextPart() {
            this.partIndex++;
            if (this.partIndex >= this.partIds.length) { this.finishShift(false); return; }
            const go = () => {
                if (this.part) { this.stage.removeChild(this.part.root); this.part.root.destroy(); }
                const id = this.partIds[this.partIndex];
                this.part = new PART_CLASSES[id](this, id, this.cfgs[id]);
                this.part.setup();
                this.stage.addChild(this.part.root);
                this._hudKey = "";
                if (this.cards) this.showCard(id);
                else { this.phase = "play"; this.phaseT = 0; }
            };
            if (this.part || this.partIndex > 0) { this.phase = "trans"; this.trans = { t: 0, dur: 14, mid: go }; }
            else go();
        }
        endPart() {
            const p = this.part;
            this.results[p.id] = { result: p.result, good: p.good, bad: p.bad };
            if (this.cards) {
                this.phase = "banner";
                this.phaseT = 0;
                this.drawBanner(p);
            } else this.nextPart();
        }
        skipPart(score) {
            if (!this.part || this.part.done) return false;
            this.part.skip(clamp(Number(score) || 0, 0, 100));
            if (this.phase === "card") { this.hideOverlay(); this.phase = "play"; }
            if (this.phase === "play") this.endPart();
            return true;
        }
        abort() {
            this.paused = false;
            if (this.part && !this.part.done) this.part.done = true;
            if (this.part && this.part.id === "serve") AudioManager.fadeOutBgs(1);
            this.finishShift(true);
        }
        finishShift(aborted) {
            const res = this.computeResult(aborted);
            this.result = res;
            this.phase = "summary";
            this.phaseT = 0;
            this.drawSummary(res);
            if (res.grade >= 4 && !aborted) se("Applause1", 55);
        }
        leave() {
            const res = this.result;
            applyResult(res);
            const onEnd = this.opts.onEnd;
            const toMap = SceneManager._stack.length && SceneManager._stack[SceneManager._stack.length - 1] === Scene_Map;
            if (toMap) pendingEnd = { result: res, onEnd, ce: END_CE };
            else if (typeof onEnd === "function") { try { onEnd(res); } catch (e) { console.error(e); } }
            TavernShift.lastResult = res;
            this.phase = "leaving";
            this.startFadeOut(this.fadeSpeed(), false);
            AudioManager.replayBgs(this.bgs);
        }
        terminate() {
            super.terminate();
            Input.clear();
            if (running === this) running = null;
        }
        // ---- results
        computeResult(aborted) {
            const parts = {}, good = [], bad = [];
            let wsum = 0, ssum = 0, bonus = 0;
            for (const id of this.partIds) {
                const r = this.results[id];
                if (!r) continue;
                parts[id] = r.result;
                wsum += PART_DEFS[id].weight;
                ssum += PART_DEFS[id].weight * r.result.score;
                bonus += PART_DEFS[id].bonus * r.result.score / 100;
                good.push(...r.good);
                bad.push(...r.bad);
            }
            const played = Object.keys(parts).length, frac = played / this.partIds.length;
            const score = wsum ? Math.round(ssum / wsum) : 0;
            const tips = Math.max(0, Math.round(this.ctx.tips));
            const s = parts.serve || {}, b = parts.beer || {};
            const deduct = (s.walkouts || 0) * 3 + (s.mistakes || 0) + (b.spilled || 0);
            const wage = BASE_WAGE + 3 * this.level;
            const grade = aborted ? 0 : gradeOf(score), bonusR = Math.round(bonus), extra = grade === 5 ? 5 : 0;
            const raw = wage + bonusR - deduct + extra, pay = aborted ? 0 : Math.max(3, raw);
            const hours = Math.round(HOURS * (aborted ? Math.max(0.25, frac) : 1) * 10) / 10;
            const stamina = Math.round(STAMINA * (aborted ? Math.max(0.25, frac) : 1));
            if (aborted) bad.unshift("Zmiana przerwana - Borgar nie płaci za pół roboty");
            return {
                pay, tips, total: pay + tips, grade, gradeName: grade ? GRADES[grade].name : "Przerwana", score, level: this.level, shift: this.shiftNo,
                aborted: !!aborted, hours, stamina, wage: aborted ? 0 : wage, bonus: aborted ? 0 : bonusR, deduct: aborted ? 0 : deduct,
                extra: aborted ? 0 : extra, floor: aborted ? 0 : pay - raw, parts, good: good.slice(0, 5), bad: bad.slice(0, 5)
            };
        }
        // ---- drawing
        clockText(frac) {
            const h = this.startHour + HOURS * frac;
            const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60);
            return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
        }
        drawHud() {
            const p = this.part;
            if (!p) return;
            const info = p.hud();
            const frac = (this.partIndex + p.progress()) / this.partIds.length;
            const key = JSON.stringify(info) + "|" + this.clockText(frac) + "|" + this.ctx.tips + "|" + this.partIndex;
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.hudSpr.bitmap, S = ST(), W = b.width;
            b.clear();
            panel(b, 8, 6, W - 16, 66, { cut: 6 });
            const def = PART_DEFS[p.id];
            txt(b, "CZĘŚĆ " + (this.partIndex + 1) + " Z " + this.partIds.length, 26, 11, 300, { size: 15, color: S.muted, bold: true });
            txt(b, def.title + " · " + def.sub, 26, 30, 420, { size: 24, color: S.accent, bold: true });
            // the middle: a timer bar or dots for the mugs
            const mx = 460, mw = 380;
            if (info.label) txt(b, info.label, mx, 11, mw, { size: 17, align: "center" });
            if (info.timer !== undefined) {
                const r = clamp(info.timer, 0, 1);
                bar(b, mx, 44, mw, 10, r, r > 0.4 ? S.accent : r > 0.18 ? WARN : BAD);
            } else if (info.dotsTotal) {
                const n = info.dotsTotal, gap = 10, dw = Math.min(40, (mw - gap * (n - 1)) / n), x0 = mx + (mw - (n * dw + (n - 1) * gap)) / 2;
                for (let i = 0; i < n; i++) {
                    const sc = info.dots[i];
                    b.fillRect(Math.round(x0 + i * (dw + gap)), 44, Math.round(dw), 10, sc === undefined ? S.trough : scoreColour(sc));
                }
            }
            txt(b, "Napiwki: " + Math.round(this.ctx.tips) + " G", W - 380, 10, 356, { size: 20, color: S.accent, bold: true, align: "right" });
            txt(b, (info.right ? info.right + "   ·   " : "") + this.clockText(frac) + "  ·  zmiana nr " + this.shiftNo, W - 520, 38, 496, { size: 16, color: info.right && /Uwaga/.test(info.right) ? WARN : S.muted, align: "right" });
        }
        drawBanner(p) {
            const b = this.overlay.bitmap, S = ST(), W = b.width, H = b.height;
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, W, H, "rgba(0,0,0,0.5)");
            const pw = 620, lines = p.good.length + p.bad.length, ph = 190 + Math.max(1, lines) * 28, px = (W - pw) / 2, py = (H - ph) / 2;
            panel(b, px, py, pw, ph, { cut: 10 });
            const def = PART_DEFS[p.id], sc = p.result.score;
            txt(b, def.title + " - koniec", px + 26, py + 18, pw - 52, { size: 28, color: S.accent, bold: true });
            txt(b, "Wynik części", px + 26, py + 64, 300, { size: 19, color: S.muted });
            txt(b, sc + " / 100", px + pw - 200, py + 58, 174, { size: 28, color: scoreColour(sc), bold: true, align: "right" });
            bar(b, px + 26, py + 100, pw - 52, 10, sc / 100, scoreColour(sc));
            let y = py + 126;
            for (const g of p.good) { drawDot(b, px + 34, y + 13, GOOD); txt(b, g, px + 48, y, pw - 74, { size: 19, color: GOOD }); y += 28; }
            for (const g of p.bad) { drawDot(b, px + 34, y + 13, BAD); txt(b, g, px + 48, y, pw - 74, { size: 19, color: BAD }); y += 28; }
            if (!lines) { txt(b, sc >= 60 ? "Nieźle idzie." : "Mogło być lepiej.", px + 48, y, pw - 74, { size: 19 }); }
            txt(b, this.partIndex + 1 < this.partIds.length ? "O - dalej" : "O - koniec zmiany", px, py + ph - 42, pw - 26, { size: 20, color: S.accent, bold: true, align: "right" });
        }
        drawPause() {
            const b = this.overlay.bitmap, S = ST(), W = b.width, H = b.height;
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, W, H, "rgba(0,0,0,0.55)");
            const pw = 440, ph = 250, px = (W - pw) / 2, py = (H - ph) / 2;
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "Pauza", px + 26, py + 18, pw - 52, { size: 30, color: S.accent, bold: true });
            const opts = ["Wracam do pracy", "Przerwij zmianę (bez zapłaty)"];
            opts.forEach((o, i) => {
                const y = py + 80 + i * 52, sel = i === this.pauseSel;
                if (sel) b.fillRect(px + 20, y, pw - 40, 42, "rgba(255,210,63,0.16)");
                if (sel) b.fillRect(px + 20, y, 4, 42, S.accent);
                txt(b, o, px + 40, y + 7, pw - 70, { size: 21, color: sel ? S.accent : S.text, bold: sel });
            });
            txt(b, "O - wybierz · P - wróć", px, py + ph - 40, pw - 26, { size: 17, color: S.muted, align: "right" });
        }
        tickPause(kt) {
            if (kt.up || kt.down) { this.pauseSel = 1 - this.pauseSel; se("Cursor1", 55); this.drawPause(); }
            else if (kt.cancel || (kt.ok && this.pauseSel === 0)) { this.paused = false; this.hideOverlay(); se("Cancel1", 55); }
            else if (kt.ok && this.pauseSel === 1) { se("Decision1", 60); this.abort(); }
        }
        drawSummary(res) {
            const b = this.overlay.bitmap, S = ST(), W = b.width, H = b.height;
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, W, H, "rgba(0,0,0,0.72)");
            const pw = 1120, ph = 620, px = (W - pw) / 2, py = (H - ph) / 2;
            panel(b, px, py, pw, ph, { cut: 12 });
            // left: Borgar and his word
            const bust = ImageManager.loadPicture("People3_5");
            if (bust.isReady() && bust.width) {
                const bw = 230, bh = Math.round(bust.height * bw / bust.width);
                b.context.imageSmoothingEnabled = true;
                b.blt(bust, 0, 0, bust.width, bust.height, px + 24, py + 30, bw, bh);
                b.fillRect(px + 24, py + 30 + bh, bw, 2, S.accent);
            }
            const sayY = py + 30 + 250;
            const say = res.aborted ? "Zmywasz się w pół roboty? Za to nie płacę. Napiwki możesz zatrzymać." : GRADES[res.grade].say;
            let y = sayY + 8;
            for (const l of wrapLines(b, "„" + say + "”", 220, 19)) { txt(b, l, px + 30, y, 224, { size: 19, color: "#d8dde3" }); y += 26; }
            txt(b, "- Borgar", px + 30, y + 4, 220, { size: 17, color: S.accent, align: "right" });
            // right column
            const x = px + 290, w = pw - 290 - 30;
            txt(b, res.aborted ? "ZMIANA PRZERWANA" : "KONIEC ZMIANY NR " + res.shift, x, py + 22, w, { size: 16, color: S.muted, bold: true });
            txt(b, res.aborted ? "Przerwana" : res.gradeName, x, py + 42, w, { size: 40, color: res.aborted ? BAD : S.accent, bold: true });
            for (let i = 0; i < 5; i++) {   // the grade in mugs
                const ix = x + w - 5 * 42 + i * 42;
                if (i < res.grade) icon(b, 337, ix, py + 36, 38);
                else { b.context.globalAlpha = 0.22; icon(b, 337, ix, py + 36, 38); b.context.globalAlpha = 1; dirty(b); }
            }
            txt(b, "Ocena " + (res.grade || "-") + " / 5 · wynik " + res.score + " / 100" + (res.level ? " · trudność " + res.level : ""), x, py + 94, w, { size: 18, color: S.muted });
            // parts
            y = py + 132;
            for (const id of this.partIds) {
                const r = res.parts[id], def = PART_DEFS[id];
                txt(b, def.title, x, y, 170, { size: 19, color: r ? S.text : S.muted });
                if (r) {
                    bar(b, x + 176, y + 10, 230, 9, r.score / 100, scoreColour(r.score));
                    txt(b, String(r.score), x + 410, y, 60, { size: 19, color: scoreColour(r.score), bold: true, align: "right" });
                } else txt(b, "-", x + 176, y, 200, { size: 19, color: S.muted });
                y += 32;
            }
            // the money
            const mx = x + 506, mw = w - 506;
            let my = py + 128;
            const money = [["Dniówka", res.wage, S.text, ""], ["Premia za pracę", res.bonus, GOOD, "+"], ["Potrącenia", -res.deduct, res.deduct ? BAD : S.muted, res.deduct ? "" : ""]];
            if (res.extra) money.push(["Ekstra od Borgara", res.extra, S.accent, "+"]);
            if (res.floor > 0) money.push(["Na chleb od Borgara", res.floor, S.text, "+"]);
            money.push(["Napiwki", res.tips, S.accent, "+"]);
            panel(b, mx - 14, my - 10, mw + 14, 30 * money.length + 64, { cut: 6, accent: false, fill: "rgba(20,22,27,0.9)" });
            for (const [n, v, c, sign] of money) {
                txt(b, n, mx, my, mw - 100, { size: 18, color: S.muted });
                txt(b, sign + v + " G", mx + mw - 110, my, 96, { size: 18, color: c, bold: true, align: "right" });
                my += 30;
            }
            b.fillRect(mx, my + 2, mw - 14, 1, S.line);
            txt(b, "Razem", mx, my + 12, mw - 120, { size: 22, color: S.accent, bold: true });
            txt(b, res.total + " G", mx + mw - 150, my + 8, 136, { size: 28, color: S.accent, bold: true, align: "right" });
            y = Math.max(y, my + 70);
            // good and bad
            const colW = Math.floor((w - 20) / 2);
            txt(b, "Co poszło dobrze", x, y, colW, { size: 20, color: GOOD, bold: true });
            txt(b, "Co poszło źle", x + colW + 20, y, colW, { size: 20, color: BAD, bold: true });
            let gy = y + 34, by = y + 34;
            for (const g of res.good.length ? res.good : ["-"]) for (const l of wrapLines(b, g, colW - 20, 18)) { if (l === g || true) drawDot(b, x + 5, gy + 12, GOOD); txt(b, l, x + 18, gy, colW - 18, { size: 18 }); gy += 26; }
            for (const g of res.bad.length ? res.bad : ["nic - czysta robota"]) for (const l of wrapLines(b, g, colW - 20, 18)) { drawDot(b, x + colW + 25, by + 12, BAD); txt(b, l, x + colW + 38, by, colW - 18, { size: 18 }); by += 26; }
            // the foot
            const fy = py + ph - 50;
            b.fillRect(px + 24, fy - 10, pw - 48, 1, S.line);
            const end = (this.startHour + res.hours);
            const endH = String(Math.floor(end) % 24).padStart(2, "0") + ":" + String(Math.round((end % 1) * 60) % 60).padStart(2, "0");
            txt(b, "Czas: " + this.clockText(0) + " → " + endH + "   ·   wytrzymałość −" + res.stamina + "   ·   zarobek do sakiewki: " + res.total + " G", px + 30, fy, pw - 300, { size: 17, color: S.muted });
            txt(b, "O - wracam do tawerny", px, fy - 2, pw - 30, { size: 21, color: S.accent, bold: true, align: "right" });
        }
    }
    window.Scene_TavernShift = Scene_TavernShift;

    // ==================================================================
    // Rewards, stats, the return to the map
    // ==================================================================
    function stats() {
        const s = window.$gameSystem;
        if (!s) return { done: 0, best: 0, earned: 0, last: null };
        if (!s._tavernShift) s._tavernShift = { done: 0, best: 0, earned: 0, last: null };
        return s._tavernShift;
    }
    function applyResult(res) {
        if (res.total > 0) $gameParty.gainGold(res.total);
        if (res.hours > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(res.hours);
        if (res.stamina > 0 && typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-res.stamina);
        const st = stats();
        if (!res.aborted) st.done++;
        st.best = Math.max(st.best || 0, res.grade || 0);
        st.earned = (st.earned || 0) + res.total;
        st.last = { pay: res.pay, tips: res.tips, total: res.total, grade: res.grade, score: res.score, aborted: res.aborted, day: $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 0 };
        if (PAY_VAR > 0) $gameVariables.setValue(PAY_VAR, res.total);
        if (GRADE_VAR > 0) $gameVariables.setValue(GRADE_VAR, res.grade);
    }
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        const p = pendingEnd;
        if (!p) return;
        pendingEnd = null;
        if (p.ce > 0) $gameTemp.reserveCommonEvent(p.ce);
        if (typeof p.onEnd === "function") { try { p.onEnd(p.result); } catch (e) { console.error(e); } }
    };

    // ==================================================================
    // API
    // ==================================================================
    const TavernShift = {
        DISHES, RECIPES, STEPS, PART_ORDER, levelCfg, GRADES,
        onTick: null,
        lastResult: null,
        // starts a shift: opts { onEnd(result), level 0-5, parts [...], intro "text", seed, turbo (logic ticks a frame, tests), cards false }
        start(opts) {
            if (running || SceneManager.isSceneChanging()) return false;   // (one at a time; not in the middle of a scene change)
            pendingOpts = opts || {};
            if ($gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
            SceneManager.push(Scene_TavernShift);
            return true;
        },
        isRunning: () => !!running,
        scene: () => running,
        level: () => Math.min(MAX_LEVEL, stats().done),
        stats: () => Object.assign({}, stats()),
        // null when fine, otherwise why the hero had better not go (the story decides whether to insist)
        canStart() {
            if (window.$gameSystem && typeof $gameSystem.stamina === "function" && $gameSystem.stamina() < 15) return "Jesteś zbyt zmęczony na całą zmianę.";
            return null;
        },
        state() {
            const s = running;
            if (!s) return null;
            return { phase: s.phase, paused: !!s.paused, part: s.part ? s.part.id : null, partIndex: s.partIndex, parts: s.partIds.slice(), level: s.level,
                tips: s.ctx.tips, card: s.phase === "card" ? s.cardId : null, data: s.part && s.phase === "play" ? s.part.state() : null, result: s.result || null };
        },
        // ends the part being played at once with this score (0-100); tests and the debug menu
        skip(score) { return running ? running.skipPart(score === undefined ? 100 : score) : false; },
        abort() { if (running && (running.phase === "play" || running.phase === "card" || running.phase === "banner")) { running.abort(); return true; } return false; },
        // room paths for bots: room px -> list of room px points
        path(fx, fy, tx, ty) { const p = running && running.part && running.part.room; return p ? p.path(fx, fy, tx, ty) : null; }
    };
    window.TavernShift = TavernShift;

    PluginManager.registerCommand(PLUGIN, "start", function(args) {
        const level = args && args.level !== undefined && args.level !== "" ? Number(args.level) : undefined;
        TavernShift.start({ level });
    });
})();
