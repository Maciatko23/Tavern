//=============================================================================
// TavernShift.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Praca w tawernie „Pod Złotym Kuflem”: zmiana jako mini-gra w czterech częściach (sprzątanie i drewno, nalewanie piwa, kuchnia w rytm, obsługa sali). v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
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
 *
 * Stan w $gameSystem._tw.tavernShift (rdzeń TawernaCore; stare zapisy z
 * $gameSystem._tavernShift są przejmowane, stary klucz zostaje jako alias).
 * Scena stoi na Scene_MiniGame z TawernaUI (klawisze, pauza, karty, turbo).
 *
 * PLIKI (2026-09-29 podzielone): TavernShift.js (dane, scena, wynik, API -
 * ten), TavernShift_Hall.js (kafle, postacie, sala, rekwizyty),
 * TavernShift_Parts.js (cztery części). Kolejność na liście wtyczek:
 * TavernShift, TavernShift_Hall, TavernShift_Parts. Dopóki części nie są
 * wpisane, ten plik wczytuje je sam.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "TavernShift";
    const TW = window.Tawerna;   // (TW: T is the tile's size in the shift's files)
    if (!TW || !TW.ui || !TW.ui.Scene_MiniGame) throw new Error("TavernShift.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const ui = TW.ui;
    // the family's shared bag: this file (P.kit), TavernShift_Hall.js (P.hall), TavernShift_Parts.js (P.parts)
    const P = TW.api("TavernShift_parts") || TW.register("TavernShift_parts", {});
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

    // ==================================================================
    // Style and drawing: TawernaUI's (the game's black + bright yellow); a text is 22 px unless told
    // ==================================================================
    const ST = ui.style;
    const GOOD = "#8ee08a", BAD = "#ff7b6b", WARN = "#ffb347", GOLD_ICON = 313;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const scoreColour = s => (s >= 85 ? ST().accent : s >= 60 ? GOOD : s >= 35 ? WARN : BAD);
    function shuffle(list, rng) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    // the sounds: the core's safe pool (a file that does not load stays silent)
    function se(name, volume, pitch) {
        if (name) TW.audio.se(name, { volume: volume || 80, pitch: pitch || 100 });
    }
    const dirty = ui.dirty, panel = ui.panel, bar = ui.bar, measure = ui.measure, wrapLines = ui.wrap, keyCap = ui.keyCap, icon = ui.icon;
    const txt = (b, s, x, y, w, o) => ui.text(b, s, x, y, w, o && o.size ? o : Object.assign({}, o, { size: 22 }));
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
    // Cards: the short explanation before each part (Borgar explains; TawernaUI's card with his bust)
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
    function drawDot(b, x, y, colour) { b.fillRect(x - 3, y - 3, 6, 6, colour); }

    // ==================================================================
    // The scene: TawernaUI's Scene_MiniGame (the keys, turbo and the tests' hook, the cards, the pause, the result to onEnd on the map)
    // with the shift's own frame: the four parts (TavernShift_Parts.js), the HUD, the black between parts, a part's result, the summary
    // ==================================================================
    const hall = () => {
        if (!P.hall) throw new Error("TavernShift.js: brak TavernShift_Hall.js (the tavern's hall for the shift)");
        return P.hall;
    };
    const partClasses = () => {
        if (!P.parts) throw new Error("TavernShift.js: brak TavernShift_Parts.js (the four parts of a shift)");
        return P.parts.PART_CLASSES;
    };
    const BORGAR_BUST = "People3_5";

    class Scene_TavernShift extends ui.Scene_MiniGame {
        createGame() {
            this.opts = Object.assign({}, this.opts);   // (the caller's options stay as they were)
            const st = stats();
            this.shiftNo = st.done + 1;
            this.level = clamp(this.opts.level === undefined || this.opts.level === null || this.opts.level === "" ? Math.min(MAX_LEVEL, st.done) : Number(this.opts.level), 0, MAX_LEVEL);
            this.cfgs = levelCfg(this.level);
            this.ctx = { tips: 0 };
            this.partIds = (Array.isArray(this.opts.parts) && this.opts.parts.length ? this.opts.parts : PART_ORDER).filter(p => PART_DEFS[p]);
            this.turbo = clamp(Math.floor(this.opts.turbo || 1), 1, 20);
            this.cards = this.opts.cards !== false;
            this.startHour = TW.time.hour();
            // preload
            hall().tilesetNames().forEach(n => ImageManager.loadTileset(n));
            [hall().heroLook().name, "People2_Tall", "People3_Tall", "Actor2_Tall", "!Flame"].forEach(n => ImageManager.loadCharacter(n));
            this.preload(ui.loadBust(BORGAR_BUST));
            const W = Graphics.width, H = Graphics.height;
            this.hudSpr = new Sprite(new Bitmap(W, 80));
            this.hud.addChild(this.hudSpr);
            this.black = new Sprite(solidBitmap("#000000"));   // (over the cards too: the black between two parts)
            this.black.scale.set(W / 4, H / 4);
            this.black.opacity = 0;
            this.addChild(this.black);
        }
        // behind the shift: plain dark (its rooms and close-ups fill the screen)
        createBackground() {
            this.bg = new Sprite(solidBitmap("#060608"));
            this.bg.scale.set(Graphics.width / 4, Graphics.height / 4);
            this.addChild(this.bg);
        }
        begin() {
            this.bgs = AudioManager.saveBgs();
            this.setPhase("none");
            this.partIndex = -1;
            this.part = null;
            this.results = {};
            if (this.cards) this.openCard("intro");
            else this.nextPart();
        }
        // a press anywhere is O on the cards, never in the play itself; P is Esc and the pad's menu button too
        readKeys() {
            this.touchOk = this.phase !== "play";
            super.readKeys();
        }
        keyDown(k) { return super.keyDown(k) || (k === "back" && Input.isPressed("menu")); }
        testHook() { return TavernShift.onTick; }
        dropTestHook() { TavernShift.onTick = null; }
        tick() {
            if (this.trans && this.tickTrans()) return;
            const k = this.keys, kt = this.trig;
            switch (this.phase) {
                case "play":
                    this.part.tick(k, kt);
                    if (this.part.done) this.endPart();
                    break;
                case "banner":
                    if (this.phaseT > 20 && kt.ok) { se("Decision1", 60); this.hideOverlay(); this.nextPart(); }
                    break;
                case "summary":
                    if (this.phaseT > 30 && kt.ok) { se("Decision1", 60); this.leave(); }
                    break;
            }
        }
        // (the black fades out while the next part's card is up)
        updateCard() {
            if (this.trans && this.tickTrans()) return;
            super.updateCard();
        }
        // the black between two parts: in, the next part set up at its darkest, out; true while it is still coming in
        tickTrans() {
            const tr = this.trans;
            tr.t++;
            if (tr.t === tr.dur && tr.mid) tr.mid();
            this.black.opacity = 255 * (tr.t <= tr.dur ? tr.t / tr.dur : Math.max(0, 1 - (tr.t - tr.dur) / tr.dur));
            if (tr.t >= tr.dur * 2) { this.trans = null; this.black.opacity = 0; }
            return tr.t <= tr.dur;
        }
        frame() {
            if (this.part && this.phase !== "summary" && this.phase !== "leaving") { this.part.frame(); this.drawHud(); }
        }
        hideOverlay() { this.overlay.visible = false; }
        // P: the pause - back to work, or break the shift off (no pay)
        pause() {
            this.se("cancel");
            this.showChoice({ title: "Pauza", options: ["Wracam do pracy", "Przerwij zmianę (bez zapłaty)"], cancel: 0, w: 440, onPick: i => { if (i === 1) this.abort(); } });
        }
        // ---- flow
        // the card before the shift and before each part (Borgar explains): O starts it
        openCard(id) {
            this.cardId = id;
            this.setPhase("card");
            const spec = Object.assign(cardSpec(id, this.part ? this.part.cfg : null, this),
                { w: 980, h: 540, bust: BORGAR_BUST, who: "Borgar", whoSub: "karczmarz", foot: id === "intro" ? "O - zaczynamy" : "O - do roboty" });
            this.showCard(spec, () => {
                if (id === "intro") this.nextPart();
                else this.setPhase("play");
            });
        }
        nextPart() {
            this.partIndex++;
            if (this.partIndex >= this.partIds.length) { this.finishShift(false); return; }
            const go = () => {
                if (this.part) { this.stage.removeChild(this.part.root); this.part.root.destroy(); }
                const id = this.partIds[this.partIndex];
                this.part = new (partClasses()[id])(this, id, this.cfgs[id]);
                this.part.setup();
                this.stage.addChild(this.part.root);
                this._hudKey = "";
                if (this.cards) this.openCard(id);
                else this.setPhase("play");
            };
            if (this.part || this.partIndex > 0) { this.phase = "trans"; this.trans = { t: 0, dur: 14, mid: go }; }
            else go();
        }
        endPart() {
            const p = this.part;
            this.results[p.id] = { result: p.result, good: p.good, bad: p.bad };
            if (this.cards) {
                this.setPhase("banner");
                this.drawBanner(p);
            } else this.nextPart();
        }
        skipPart(score) {
            if (!this.part || this.part.done) return false;
            this.part.skip(clamp(Number(score) || 0, 0, 100));
            if (this.card) this.hideCard();
            if (this.phase === "card") this.phase = "play";
            if (this.phase === "play") this.endPart();
            return true;
        }
        abort() {
            if (this.card) this.hideCard();
            if (this.part && !this.part.done) this.part.done = true;
            if (this.part && this.part.id === "serve") AudioManager.fadeOutBgs(1);
            this.finishShift(true);
        }
        finishShift(aborted) {
            const res = this.computeResult(aborted);
            this.result = res;
            this.setPhase("summary");
            this.drawSummary(res);
            if (res.grade >= 4 && !aborted) se("Applause1", 55);
        }
        // back to the map: the pay, the time and the stamina now; the result to onEnd once the map is there (the parameters' common
        // event first)
        leave() {
            const res = this.result, onEnd = this.opts.onEnd;
            applyResult(res);
            TavernShift.lastResult = res;
            AudioManager.replayBgs(this.bgs);
            this.phase = "leaving";
            const stack = SceneManager._stack, toMap = stack.length && stack[stack.length - 1] === Scene_Map;
            this.opts.onEnd = r => {
                if (toMap && END_CE > 0) $gameTemp.reserveCommonEvent(END_CE);
                if (typeof onEnd === "function") onEnd(r);
            };
            this.end(res);
            this.overlay.visible = true;   // (the summary fades out with the scene)
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
        drawSummary(res) {
            const b = this.overlay.bitmap, S = ST(), W = b.width, H = b.height;
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, W, H, "rgba(0,0,0,0.72)");
            const pw = 1120, ph = 620, px = (W - pw) / 2, py = (H - ph) / 2;
            panel(b, px, py, pw, ph, { cut: 12 });
            // left: Borgar and his word
            const bust = ui.loadBust(BORGAR_BUST);
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
    Scene_TavernShift.gameId = "TavernShift";   // (the bus's miniGameStart / miniGameEnd)
    window.Scene_TavernShift = Scene_TavernShift;

    // ==================================================================
    // Rewards, stats: $gameSystem._tw.tavernShift (the core's saved state; an older save's _tavernShift taken over, the old key an alias)
    // ==================================================================
    const store = TW.state.define("tavernShift", () => ({ done: 0, best: 0, earned: 0, last: null }), { version: 1, adopt: "_tavernShift", owner: PLUGIN });
    const stats = () => store();
    function applyResult(res) {
        if (res.total > 0) $gameParty.gainGold(res.total);
        if (res.hours > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(res.hours);
        if (res.stamina > 0 && typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-res.stamina);
        const st = stats();
        if (!res.aborted) st.done++;
        st.best = Math.max(st.best || 0, res.grade || 0);
        st.earned = (st.earned || 0) + res.total;
        st.last = { pay: res.pay, tips: res.tips, total: res.total, grade: res.grade, score: res.score, aborted: res.aborted, day: TW.time.day() };
        if (PAY_VAR > 0) $gameVariables.setValue(PAY_VAR, res.total);
        if (GRADE_VAR > 0) $gameVariables.setValue(GRADE_VAR, res.grade);
        if (!res.aborted) TW.emit("shiftDone", { grade: res.grade, pay: res.pay, tips: res.tips, total: res.total, level: res.level, shift: res.shift, done: st.done });
    }

    // ==================================================================
    // API
    // ==================================================================
    const scene = () => (ui.running instanceof Scene_TavernShift ? ui.running : null);
    const TavernShift = {
        DISHES, RECIPES, STEPS, PART_ORDER, levelCfg, GRADES,
        onTick: null,
        lastResult: null,
        // starts a shift: opts { onEnd(result), level 0-5, parts [...], intro "text", seed, turbo (logic ticks a frame, tests), cards false }
        start(opts) {
            return ui.open(Scene_TavernShift, opts || {});   // (one at a time; not in the middle of a scene change)
        },
        isRunning: () => !!scene(),
        scene: () => scene(),
        level: () => Math.min(MAX_LEVEL, stats().done),
        stats: () => Object.assign({}, stats()),
        // null when fine, otherwise why the hero had better not go (the story decides whether to insist)
        canStart() {
            if (window.$gameSystem && typeof $gameSystem.stamina === "function" && $gameSystem.stamina() < 15) return "Jesteś zbyt zmęczony na całą zmianę.";
            return null;
        },
        state() {
            const s = scene();
            if (!s) return null;
            return { phase: s.phase, paused: !!(s.card && s.card.kind === "choice"), part: s.part ? s.part.id : null, partIndex: s.partIndex, parts: s.partIds.slice(), level: s.level,
                tips: s.ctx.tips, card: s.phase === "card" ? s.cardId : null, data: s.part && s.phase === "play" ? s.part.state() : null, result: s.result || null };
        },
        // ends the part being played at once with this score (0-100); tests and the debug menu
        skip(score) { const s = scene(); return s ? s.skipPart(score === undefined ? 100 : score) : false; },
        abort() { const s = scene(); if (s && (s.phase === "play" || s.phase === "card" || s.phase === "banner")) { s.abort(); return true; } return false; },
        // room paths for bots: room px -> list of room px points
        path(fx, fy, tx, ty) { const s = scene(), p = s && s.part && s.part.room; return p ? p.path(fx, fy, tx, ty) : null; }
    };
    window.TavernShift = TW.register(PLUGIN, TavernShift);

    PluginManager.registerCommand(PLUGIN, "start", function(args) {
        const level = args && args.level !== undefined && args.level !== "" ? Number(args.level) : undefined;
        TavernShift.start({ level });
    });

    // for TavernShift_Hall.js and TavernShift_Parts.js: the drawing, the sounds, the dishes and steps
    P.kit = { ST, GOOD, BAD, WARN, GOLD_ICON, clamp, lerp, ease, scoreColour, shuffle, se, dirty, panel, bar, txt, measure, wrapLines, icon, keyCap, showIf, solidBitmap,
        shadowBitmap, TILESET_ID, DISHES, MENU_ORDER, dishIcon, STEPS, STEP_ORDER, RECIPES, TIP_SCALE };
    // the parts not in js/plugins.js yet: put into the page here (after every plugin - classes only, no engine hooks)
    for (const part of ["TavernShift_Hall", "TavernShift_Parts"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
