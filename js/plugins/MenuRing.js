//=============================================================================
// MenuRing.js
//=============================================================================
// The P menu of the graphite look "Grafit i miedź" (CleanHUD.js, UITheme.js): ONE window with tabs at the top - Postać, Plecak,
// Dziennik, Opcje, Zapisz grę, Zakończ grę (then any other plugin's command) - each tab its own view inside it (the user's, 2026-10-08:
// "A. Karta bohatera", docs/ui_pomysly2/menu_p_A.png, "zakładki ... mają swoje nowe widoki"; later: six tabs, Umiejętności inside
// Postać - for now a part opened from the card: its button under the name, or U; Esc goes back to the card).
// (The file keeps its old name - it held the ring of round buttons first - so the plugin list stays as it is.)
//   Layers as in RPG Maker (the user's, 2026-10-12: "poruszanie się w UI niech będzie tylko A i D ... jak jesteś na jakimś tabie to go
//   aktywuj (O) i wtedy wchodzisz w podtab i tam dalej A i D, a jak dasz P to wracasz poziom wyżej"):
//     1 the tabs     A / D (← / →) choose a tab (its content shows dimmed), O / Enter goes in, P / Esc closes the menu;
//     2 the sub-tabs Postać: Statystyki / Ekwipunek / Umiejętności, Plecak: the categories, Dziennik: its sections - A / D, O in, P up;
//                    (Opcje, Zapisz grę, Zakończ grę have none: O goes straight to their list)
//     3 the content  a list as in RPG Maker: W / S, A / D where it is a grid or a value; O chooses / uses, P up a level; deeper parts
//                    (the choice for an equipment place, a skill tree, a question) the same: O in, P back.
//   The layer in charge is bright with a copper outline, the others dimmed. The mouse works too. J opens the menu on Dziennik's list.
//   - Plecak: the categories, a grid of tiles with the counts sorted by groups (or by name / count / the newest - Tab), the chosen
//     thing's card; Enter uses it (as the bag did).
//   - Dziennik: the journal's sections (←/→), the list, the detail (Shift + ↑/↓ or the wheel scroll it); Enter pins a goal.
//   - Postać (the user's mock-up "A", 2026-10-12): three parts (level 2: A / D) - Statystyki (who he is, ATRYBUTY with "+" only while there
//     are points, OBRAŻENIA of the weapon in hand, ODPORNOŚCI, the chosen attribute's words in a fixed panel), Ekwipunek (the figure
//     with its places - Equipment.js; Enter: choose, X: off), Umiejętności (Combat_UI's fields and trees); the goal / purse / debt bar.
//   - Opcje: the settings (OptionEx's list: the volumes, "Wygląd: Grafit / Klasyczny"...).
//   - Zapisz grę: the files with their day, place and time played; Enter saves.
//   - Zakończ grę: to the title, out of the game, or back.
// It is the same Scene_Menu with the same command window (MenuPanel's commands): the window is only hidden; the lists inside the
// views are the game's own windows (the bag's grid, the journal's list, the skill windows, the options, the save files), drawn flat
// on the graphite panels. The classic look (Opcje -> Wygląd: Klasyczny) keeps MenuPanel's panel and its separate screens.

/*:
 * @target MZ
 * @plugindesc Grafit: menu P jako jedno okno z zakładkami (Postać, Plecak, Dziennik, Opcje, Zapis, Zakończ grę); poziomy jak w RPG Makerze: A/D, O wejdź, P wróć. v3.3.0
 * @author Claude
 * @base CleanHUD
 * @orderAfter CleanHUD
 * @orderAfter MenuPanel
 * @orderAfter Journal
 * @orderAfter Combat_UI
 * @orderAfter Story
 * @orderAfter Durability
 * @orderAfter Dog
 * @orderAfter OptionEx
 *
 * @help
 * ============================================================================
 * MenuRing.js - menu P w wyglądzie Grafit: jedno okno z zakładkami
 * ============================================================================
 * Zakładki u góry: Postać, Plecak, Dziennik, Opcje, Zapisz grę, Zakończ
 * grę. Każda ma swój widok w tym samym oknie. Postać ma trzy części:
 * Statystyki, Ekwipunek, Umiejętności. Poziomy jak w RPG Makerze:
 * zakładki -> podzakładki (Postać, kategorie Plecaka, działy Dziennika)
 * -> zawartość; O wchodzi poziom niżej, P wraca poziom wyżej.
 * Plecak: Tab zmienia porządek - Grupy / Nazwa / Ilość / Najnowsze.
 *   A / D      zakładka (na pasku zakładek), podzakładka, poziomo w liście
 *   W / S      w górę / w dół w liście (strzałki działają tak samo)
 *   O / Enter  wejdź poziom niżej, wybierz (użyj rzeczy, przypnij cel,
 *              rozdaj punkt, naucz się, zapisz...)
 *   P / Esc    wróć poziom wyżej; na pasku zakładek zamyka menu
 * Klawisz J otwiera menu od razu na liście Dziennika.
 * W wyglądzie Klasycznym (Opcje → Wygląd) menu jest panelem jak dotąd.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("MenuRing.js: brak TawernaCore.js (the Tawerna core is missing)");
    const CH = T.api("CleanHUD");
    if (!CH) throw new Error("MenuRing.js: musi być pod CleanHUD.js na liście wtyczek (CleanHUD is missing or below)");
    const PLUGIN = "MenuRing";
    if (T.api(PLUGIN)) return;
    const C = CH.C, textOut = CH.textOut, measure = CH.measure;
    const W = () => Graphics.width, H = () => Graphics.height;
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
    const ease = k => 1 - Math.pow(1 - clamp01(k), 3);
    const useMenu = () => CH.isClean();

    // the tabs, in this order; the other plugins' commands come after them
    const TABS = [
        { sym: "hero", label: "Postać", icon: "hero" },
        { sym: "item", label: "Plecak", icon: [209, "green"] },
        { sym: "journal", label: "Dziennik", icon: [121, "dark"] },
        { sym: "options", label: "Opcje", icon: [83, "dark"] },
        { sym: "save", label: "Zapisz grę", icon: [246, "green"] },
        { sym: "gameEnd", label: "Zakończ grę", icon: [197, "green"] }
    ];
    const OWN = new Set(TABS.map(t => t.sym).concat(["skills"]));   // (the skills: inside Postać, not a tab)
    // X: take off (the equipment) - only while the menu is open (X stays free on the map, keys_test)
    const MENU_KEYS = { 88: "takeOff" }, keysSet = {};
    function menuKeys(on) {
        for (const code in MENU_KEYS) {
            if (on && !Input.keyMapper[code]) { Input.keyMapper[code] = MENU_KEYS[code]; keysSet[code] = true; }
            else if (!on && keysSet[code]) { if (Input.keyMapper[code] === MENU_KEYS[code]) delete Input.keyMapper[code]; delete keysSet[code]; }
        }
    }
    // what the card's right side shows
    const WEAPONS = [125, 126, 154, 156, 59];   // proca, łuk, oszczep, pałka, pochodnia
    const WEAR = [[171, "Kurtka", "garbarnia"], [155, "Tarcza", "warsztat"]];
    const L = {   // the places (1280 x 720)
        tabsY: 26, lineY: 80, keysY: 684,
        cx: 640, cy: 360, R: 190, ring: 178, clip: 176,
        left: { x: 96, y: 112, w: 300 }, right: { x: 884, y: 112, w: 300, h: 488 }, bottom: { x: 96, y: 618, w: 1088, h: 48 },
        panel: { x: 96, y: 100, w: 1088, h: 560 }
    };
    const ATT = { y0: 56, step: 37 };
    const GREEN_OK = "#9fd08a", WARN = "#e8806a", GOLD = "#e8c87a", CARD_HI = "rgba(44,46,52,1)";

    // ------------------------------------------------------------------
    // The picture behind the menu is the map alone (the HUD, the cries, the plates left out; the map's own effects stay); J opens the
    // menu on the journal's tab
    // ------------------------------------------------------------------
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (SceneManager.isNextScene(Scene_Menu) && useMenu()) {
            for (const c of this.children) if (c !== this._spriteset && c !== this._mindVeil) c.renderable = false;
        }
        _Scene_Map_terminate.call(this);
    };
    const _push = SceneManager.push;
    SceneManager.push = function(sceneClass) {
        const J = T.api("Journal");
        if (useMenu() && J && sceneClass === J.Scene_Journal && this._scene instanceof Scene_Map) {
            $gameTemp._menuTab = "journal";
            $gameTemp._menuLevel = 3;
            return _push.call(this, Scene_Menu);
        }
        return _push.call(this, sceneClass);
    };
    // the save files remember the place (the Zapisz grę tab shows it)
    const _makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function() {
        const info = _makeSavefileInfo.call(this);
        try { if (window.$gameMap && $gameMap.displayName) info.place = $gameMap.displayName() || ($dataMapInfos[$gameMap.mapId()] || {}).name || ""; } catch (e) { /* (no place) */ }
        // (the file lists' card: the level, the purse, grandpa's debt, the hero's bust)
        try { const xp = heroXp(); if (xp) info.level = xp.level; } catch (e) { /* (no level) */ }
        try { if (window.$gameParty) info.gold = $gameParty.gold(); } catch (e) { /* (no purse) */ }
        try { const d = debtInfo(); if (d) info.debt = { paid: d.paid, debt: d.debt, done: d.done, lost: !!d.lost }; } catch (e) { /* (no debt) */ }
        try { info.bust = T.ui && T.ui.heroBust ? T.ui.heroBust() : "Hero_Bust"; } catch (e) { info.bust = "Hero_Bust"; }
        return info;
    };
    // (2026-10-17) the saves made before the place was kept: the place read once from the file itself (its map: the name the game
    // shows - Story's "Pole dziadka" in a story game, else the map's display name, else its name in the editor), written into the
    // file list (global info) for good; the lists on the screen are drawn again. A file that cannot be read keeps no place - the
    // lists then show only the day (never a "-").
    const placeFill = { tried: new Set(), busy: 0 };
    function mapDisplayName(mapId) {
        return new Promise(res => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", "data/Map" + String(mapId).padStart(3, "0") + ".json");
                xhr.overrideMimeType("application/json");
                xhr.onload = () => { try { res(xhr.status < 400 ? String(JSON.parse(xhr.responseText).displayName || "") : ""); } catch (e) { res(""); } };
                xhr.onerror = () => res("");
                xhr.send();
            } catch (e) { res(""); }
        });
    }
    function placeOfSave(contents) {
        const mapId = contents && contents.map && Number(contents.map._mapId);
        if (!mapId) return Promise.resolve("");
        const sys = contents.system || {}, st = (sys._tw && sys._tw.story) || sys._story, ST = T.api("Story");
        const field = ST && ST.MAP && ST.MAP.field !== undefined ? ST.MAP.field : 3;
        if (st && typeof st === "object" && st.debt !== undefined && !st.pending && mapId === field) return Promise.resolve("Pole dziadka");
        const editor = String((window.$dataMapInfos && $dataMapInfos[mapId] && $dataMapInfos[mapId].name) || "").replace(/#\d+$/, "").trim();
        return mapDisplayName(mapId).then(name => name || editor);
    }
    function refreshFileLists() {
        const s = SceneManager._scene;
        if (!s) return;
        if (s instanceof Scene_File && s._listWindow) { s._listWindow.refresh(); s._filesCardId = -1; }
        const v = s._views && s._views.save;
        if (v && v._list) { v._list.refresh(); v.drawCard(); }
        const tm = s._tsMenu, id = DataManager.latestSavefileId(), info = DataManager.savefileInfo(id);   // (the title's "Kontynuuj" line)
        if (tm && tm._save && tm._save.ok && tm._save.id === id && info && info.place && !String(tm._save.text).includes(info.place)) {
            tm._save.text = tm._save.text + " · " + info.place;
            tm._key = "";
        }
    }
    function fillOldPlaces() {
        const g = DataManager._globalInfo;
        if (!Array.isArray(g) || !window.$dataMapInfos) return;
        g.forEach((info, id) => {
            if (!info || info.place || placeFill.tried.has(id)) return;
            placeFill.tried.add(id);
            placeFill.busy++;
            StorageManager.loadObject(DataManager.makeSavename(id))
                .then(placeOfSave)
                .then(place => {
                    if (!place || DataManager._globalInfo[id] !== info || info.place) return;
                    info.place = place;
                    DataManager.saveGlobalInfo();
                    refreshFileLists();
                })
                .catch(() => { /* (the file cannot be read: no place) */ })
                .then(() => { placeFill.busy--; });
        });
    }
    const _loadGlobalInfo = DataManager.loadGlobalInfo;
    DataManager.loadGlobalInfo = function() {
        _loadGlobalInfo.call(this);
        // (the info comes in a moment; the old files' places are looked for as soon as the database (the map names) is there too)
        let n = 0;
        const iv = setInterval(() => {
            if (++n > 600) { clearInterval(iv); return; }
            if (!this.isGlobalInfoLoaded() || !this.isDatabaseLoaded()) return;
            clearInterval(iv);
            fillOldPlaces();
        }, 50);
    };

    // ------------------------------------------------------------------
    // Small pieces
    // ------------------------------------------------------------------
    const plural = (n, a, b, c) => CH.pl(n, a, b, c);
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const has = id => !!item(id) && $gameParty.numItems(item(id)) > 0;
    const MP = () => T.api("MenuPanel");
    // the hero's figure for the "Postać" tab: the standing frame of his walking sheet (HeroLook.js: 64 x 64 cells), head and shoulders
    function heroIcon(size) {
        const HL = window.HeroLook, look = HL && HL.active && HL.active();
        const name = look ? "Hero_Walk" : $gamePlayer.characterName(), idx = $gamePlayer.characterIndex(), src = ImageManager.loadCharacter(name);
        if (!src.isReady()) return null;
        const b = new Bitmap(size, size);
        b.context.imageSmoothingEnabled = false;
        if (/^Hero_/.test(name)) b.blt(src, 16, 4, 32, 32, 0, 0, size, size);
        else {
            const big = ImageManager.isBigCharacter(name), pw = src.width / (big ? 3 : 12), ph = src.height / (big ? 4 : 8);
            const sx = (big ? 0 : (idx % 4) * 3) * pw + pw, sy = (big ? 0 : Math.floor(idx / 4) * 4) * ph;
            b.blt(src, sx + pw * 0.15, sy, pw * 0.7, ph * 0.7, 0, 0, size, size);
        }
        return b;
    }
    // the skills' tab: a little tree of three copper knots
    let skillsIconCache = null;
    function skillsIcon() {
        if (skillsIconCache) return skillsIconCache;
        const b = new Bitmap(32, 32), ctx = b.context;
        ctx.strokeStyle = "rgba(8,9,11,0.9)"; ctx.lineWidth = 4;
        const lines = () => { ctx.beginPath(); ctx.moveTo(16, 24); ctx.lineTo(16, 16); ctx.lineTo(9, 9); ctx.moveTo(16, 16); ctx.lineTo(23, 9); ctx.stroke(); };
        lines();
        ctx.strokeStyle = C.text; ctx.lineWidth = 2; lines();
        for (const [x, y, col] of [[16, 25, C.text], [9, 8, C.accent], [23, 8, C.accent]]) {
            ctx.fillStyle = "rgba(8,9,11,0.9)"; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        b._baseTexture.update();
        return (skillsIconCache = b);
    }
    function tabIcon(def) {
        if (def.icon === "hero") return heroIcon(32);
        if (def.icon === "skills") return skillsIcon();
        if (Array.isArray(def.icon)) return CH.iconBitmap(def.icon[0], def.icon[1]);
        return null;
    }
    function bar(ctx, x, y, w, h, ratio, colour) {
        ctx.save();
        ctx.fillStyle = "rgba(52,54,60,1)";
        CH.roundPath(ctx, x, y, w, h, h / 2);
        ctx.fill();
        if (ratio > 0) {
            ctx.fillStyle = colour;
            CH.roundPath(ctx, x, y, Math.max(h, Math.round(w * clamp01(ratio))), h, h / 2);
            ctx.fill();
        }
        ctx.restore();
    }
    // keycaps and their labels in a row; returns the x where they end
    function keycaps(b, x, y, pairs) {
        for (const [k, lab] of pairs) {
            const kw = Math.max(24, measure(k, 15) + 14);
            CH.rpanel(b.context, x, y, kw, 24, 5, { fill: "rgba(28,29,33,0.92)", shadow: 0 });
            textOut(b, k, x, y, kw, 24, "center", { size: 15, plain: true });
            if (lab) textOut(b, lab, x + kw + 7, y, measure(lab, 15) + 8, 24, "left", { size: 15, color: "#d8d2c6", plain: true });
            x += kw + (lab ? measure(lab, 15) + 26 : 8);
        }
        return x;
    }
    const keycapsWidth = pairs => pairs.reduce((a, [k, lab]) => a + Math.max(24, measure(k, 15) + 14) + (lab ? measure(lab, 15) + 26 : 8), 0) - 26;
    function dayWords() {
        const d = T.time.day(), h = T.time.hour();
        return "Dzień " + d + " · " + T.time.seasonName(d).toLowerCase() + " · " + CH.hm(h);
    }

    // the data the card shows
    function heroXp() {
        const Cb = T.api("Combat");
        if (!Cb || !Cb.hero) return null;
        const h = Cb.hero(), top = Cb.MAX_LEVEL && h.level >= Cb.MAX_LEVEL, need = top ? 1 : Cb.xpToNext ? Cb.xpToNext(h.level) : 100;
        return { level: h.level, xp: h.xp, need, ratio: top ? 1 : clamp01(h.xp / Math.max(1, need)), points: h.points || 0, skillPoints: h.skillPoints || 0, attr: h.attr || {}, top };
    }
    function needRows() {
        const v = CH.needValues(), rows = [["health", "Życie", v.health, Math.round(v.health * 100) + "%"]];
        rows.push(["stamina", "Kondycja", v.stamina, String(Math.round($gameSystem.stamina ? $gameSystem.stamina() : 0))]);
        const N = T.api("Needs");
        if (v.food !== undefined && N) {
            const n = N.state();
            rows.push(["food", "Sytość", v.food, String(Math.round(n.food))]);
            rows.push(["water", "Nawodnienie", v.water, String(Math.round(n.water))]);
        }
        return rows;
    }
    function toolList() {
        const D = T.api("Durability"), skip = new Set(WEAPONS.concat(WEAR.map(w => w[0])));
        return $gameParty.items().filter(i => i && i.itypeId === 2 && !skip.has(i.id) && !isKeep(i)).map(i => {
            const d = D && D.TOOLS && D.TOOLS[i.id] && D.lifeOf ? { left: D.left(i.id), life: D.lifeOf(i.id) } : null;
            return { id: i.id, name: i.name, icon: i.iconIndex, wear: d ? clamp01(d.left / Math.max(1, d.life)) : null, d };
        });
    }
    function goalLine() {
        const g = CH.goalInfo(SceneManager._scene), CC = T.api("CleanHUD_Compass");
        if (!g) return null;
        let where = "";
        try {
            const t = CC && CC.targetOf ? CC.targetOf(g) : null, r = t && CC.route ? CC.route(t) : null;
            if (t && r && r.x !== undefined) {
                const n = Math.max(1, Math.round(r.steps)), name = r.direct ? t.name : CC.mapName(t.map) || t.name;
                where = r.direct && r.steps < 1.6 ? name + ", tutaj" : name + ", " + n + " " + plural(n, "krok", "kroki", "kroków");
            }
        } catch (e) { where = ""; }
        return { icon: g.icon, title: g.title, where };
    }
    function debtInfo() {
        const ST = T.api("Story"), s = ST && ST.state ? ST.state() : null;
        if (!s || s.debt === undefined || s.pending) return null;
        // (2026-10-15) the field lost: the buyback instead of the debt (no deadline; the days left to carry things off the field)
        if (s.lost && s.buy) return { paid: Math.min(s.buy.paid, s.buy.price), debt: s.buy.price, done: !!s.buy.done, days: ST.carryLeft ? ST.carryLeft() : 0, lost: true };
        return { paid: Math.min(s.paid, s.debt), debt: s.debt, done: !!(s.done || s.paid >= s.debt), days: ST.daysLeft ? ST.daysLeft() : 0 };
    }

    // ==================================================================
    // A view: one tab's content - its own sprites (in `root`) and the game's windows it uses (flat, on its panel). The scene moves
    // and fades the whole view when the tab changes.
    // ==================================================================
    function View(scene, def) {
        this.scene = scene;
        this.def = def;
        this.root = new Sprite();
        this.root.visible = false;
        this.windows = [];
        scene._viewLayer.addChild(this.root);
    }
    View.prototype.addSprite = function(s) { this.root.addChild(s); return s; };
    View.prototype.addWindow = function(w, main) {
        w.opacity = 0;
        w.frameVisible = false;
        w._baseX = w.x;
        w.hide();
        w.deactivate();
        this.scene.addWindow(w);
        this.windows.push(w);
        // every list of a tab: P / Esc goes up a level (the menu's layers)
        if (w.setHandler && main !== false) w.setHandler("cancel", () => this.scene.onViewCancel());
        return w;
    };
    View.prototype.show = function() {   // (the focus: the scene's layer - Scene_Menu.focusLevel)
        this.root.visible = true;
        for (const w of this.windows) if (!w._viewHidden) w.show();
        this.refresh();
    };
    View.prototype.hide = function() {
        this.root.visible = false;
        for (const w of this.windows) { w.hide(); w.deactivate(); }
        this.leave();
    };
    View.prototype.place = function(dx, a) {
        this._dx = dx;
        this._a = a;
        const k = this._dimK === undefined ? 1 : this._dimK, ks = this._subK === undefined ? 1 : this._subK;
        this.root.alpha = a * k;
        for (const w of this.windows) { w.x = w._baseX + dx; w.contentsOpacity = Math.round(255 * a * (w._sub ? ks : k)); }
    };
    // the layers' look: the one in charge bright, the others dimmed (the content shows dimmed while the tabs or the sub-tabs choose)
    View.prototype.look = function(level) {
        this._dimK = level >= 3 ? 1 : 0.5;
        this._subK = level === 2 ? 1 : 0.6;
        this.place(this._dx || 0, this._a === undefined ? 1 : this._a);
    };
    View.prototype.blur = function() { for (const w of this.windows) w.deactivate(); };
    View.prototype.subFocus = function() { this.blur(); };   // (level 2 in the view's own window: the bag's categories, the journal's sections)
    View.prototype.refresh = function() {};
    View.prototype.activate = function() {};
    View.prototype.leave = function() {};
    View.prototype.update = function() {};
    View.prototype.keys = function() { return [["P", "wróć"]]; };
    View.prototype.cancel = function() { return false; };   // (true: it went back a level itself)
    View.prototype.spriteInput = function() { return !this.windows.some(w => w.active); };   // (no window has the keys: the scene and update() do)
    View.prototype.touch = function() {};
    // a window that is a level of its own (the bag's categories, the journal's sections): while it is in charge a copper outline round
    // the chosen one
    function outlineWhenActive(w) {
        const draw = w.drawItem, act = w.activate, deact = w.deactivate;
        w.drawItem = function(index) {
            draw.call(this, index);
            if (!this.active || index !== this.index()) return;
            const r = this.itemRect(index);
            CH.rpanel(this.contents.context, r.x - 10, r.y + 2, r.width + 18, r.height - 8, 8, { fill: null, line: C.accent, shadow: 0, lw: 1.5 });
            this.contents._baseTexture.update();
        };
        w.activate = function() { const was = this.active; act.call(this); if (!was && this.contents) this.refresh(); };
        w.deactivate = function() { const was = this.active; deact.call(this); if (was && this.contents) this.refresh(); };
    }
    // a graphite panel in a bitmap of the screen's size
    function panelSprite(view, x, y, w, h) {
        const s = view.addSprite(new Sprite(new Bitmap(W(), H())));
        CH.rpanel(s.bitmap.context, x, y, w, h, 12, { fill: "rgba(20,21,24,0.92)" });
        s.bitmap._baseTexture.update();
        return s;
    }

    // ------------------------------------------------------------------
    // Postać - the user's choice of the three mock-ups (2026-10-12): "A", docs/ui_pomysly2/postac_A.png, postac_A_ekwipunek.png,
    // postac_A_umiejetnosci.png (tools/ui_pomysly2/postac_grafit.py). Three parts under the tabs (level 2 of the layers: A / D between them, O in):
    //   Statystyki    - who he is (bust, level, the four needs), ATRYBUTY ("+" only while there are points), OBRAŻENIA (the weapon in
    //                   his right hand: the blow, the series, the charged blow, the crit, the knock, the breath), ODPORNOŚCI (health,
    //                   breath, the armour and the shield worn, the wound, the fall, the cold, the mind), and the chosen attribute's
    //                   words in a fixed panel at the foot (now / +1 point) - nothing pops up, nothing covers the figure;
    //   Ekwipunek     - the hero's figure with the places round it (Equipment.js), what fits the chosen place (Enter: choose, X: off),
    //                   the chosen thing's words;
    //   Umiejętności  - the fields, the tree, the chosen skill (Combat_UI's windows).
    // The bar Cel / Sakiewka / Dług dziadka under all three.
    // ------------------------------------------------------------------
    const HERO_SUBS = [["stats", "Statystyki"], ["equip", "Ekwipunek"], ["skills", "Umiejętności"]];
    const HA = {
        head: { x: 96, y: 138, w: 1088, h: 62 },
        attrs: { x: 96, y: 212, w: 324, h: 244 }, dmg: { x: 432, y: 212, w: 376, h: 244 }, def: { x: 820, y: 212, w: 364, h: 244 },
        desc: { x: 96, y: 468, w: 1088, h: 136 },
        fig: { x: 96, y: 138, w: 544, h: 466 }, list: { x: 652, y: 138, w: 532, h: 262 }, item: { x: 652, y: 412, w: 532, h: 192 },
        dom: { x: 96, y: 138, w: 264, h: 466 }, tree: { x: 372, y: 138, w: 464, h: 466 }, skill: { x: 848, y: 138, w: 336, h: 466 },
        rowStep: 38, attrX: 114, attrY: 262, attrW: 288
    };
    const SOFT = "#cfc9bd", DIMT = "#77736b";
    function wrapWords(text, size, w, kind) {
        const out = [];
        let line = "";
        for (const word of String(text || "").split(/\s+/)) {
            const t = line ? line + " " + word : word;
            if (line && measure(t, size, kind) > w) { out.push(line); line = word; } else line = t;
        }
        if (line) out.push(line);
        return out;
    }
    // a graphite panel with its small-capital title (and a copper word on the right)
    function apanel(b, r, title, right) {
        CH.rpanel(b.context, r.x, r.y, r.w, r.h, 12, { fill: "rgba(20,21,24,0.92)" });
        if (title) CH.spaced(b, title, r.x + 18, r.y + 9, 20, { size: 13 });
        if (right) textOut(b, right, r.x + r.w - 238, r.y + 9, 220, 22, "right", { size: 14, color: C.accent, plain: true });
    }
    // a row: the label on the left, the value on the right (at the middle line cy)
    function kvRow(b, x, cy, w, label, value, o) {
        o = o || {};
        textOut(b, CH.fit(label, o.size || 16, w - (o.valueW || 120), "regular"), x, cy - 13, w - (o.valueW || 110), 26, "left", { size: o.size || 16, face: "regular", color: o.dim ? DIMT : o.labelColor || SOFT, plain: true });
        textOut(b, value, x + w - 230, cy - 13, 230, 26, "right", { size: o.size || 16, color: o.dim ? DIMT : o.color || C.text, plain: true });
    }
    const num1 = v => String(Math.round(v * 10) / 10).replace(".", ",");
    const pctTxt = (v, d) => num1(Math.round(v * 100 * Math.pow(10, d || 0)) / Math.pow(10, d || 0)) + "%";
    const secTxt = f => (f / 60).toFixed(2).replace(".", ",") + " s";
    // the bar under the three parts: the goal, the purse, grandpa's debt
    function drawHeroFoot(b) {
        const x0 = L.bottom.x, y0 = L.bottom.y, w = L.bottom.w, ctx = b.context, g = goalLine(), debt = debtInfo();
        CH.rpanel(ctx, x0, y0, w, L.bottom.h, 12);
        if (g) {
            if (g.icon > 0) CH.drawIcon(b, g.icon, x0 + 14, y0 + 8, 32);
            CH.spaced(b, "Cel", x0 + 54, y0 + 2, 18, { size: 12 });
            textOut(b, CH.fit(g.title + (g.where ? " · " + g.where : ""), 16, 470), x0 + 54, y0 + 20, 480, 26, "left", { size: 16, plain: true });
        } else textOut(b, "Cel: wszystko zrobione", x0 + 20, y0 + 12, 400, 26, "left", { size: 16, color: C.muted, plain: true });
        ctx.fillStyle = C.line;
        ctx.fillRect(x0 + 544, y0 + 10, 1, 28);
        ctx.fillRect(x0 + 754, y0 + 10, 1, 28);
        CH.spaced(b, "Sakiewka", x0 + 564, y0 + 2, 18, { size: 12 });
        textOut(b, $gameParty.gold() + " G", x0 + 564, y0 + 20, 180, 26, "left", { size: 16, color: GOLD, plain: true });
        CH.spaced(b, debt && debt.lost ? "Odkup pola" : "Dług dziadka", x0 + 774, y0 + 2, 18, { size: 12 });
        if (debt && debt.lost && !debt.done) {
            textOut(b, debt.paid + " / " + debt.debt + " G", x0 + 774, y0 + 20, 130, 26, "left", { size: 16, plain: true });
            bar(ctx, x0 + 894, y0 + 30, 110, 4, debt.paid / Math.max(1, debt.debt), C.accent);
            const n = debt.days, left = n > 1 ? "wynieś: " + n + " " + plural(n, "dzień", "dni", "dni") : n === 1 ? "wynieś: dziś" : "bez terminu";
            textOut(b, left, x0 + w - 120, y0 + 20, 104, 26, "right", { size: 16, color: n >= 1 ? WARN : C.text, plain: true });
        } else if (debt) {
            if (debt.done) textOut(b, debt.lost ? "odkupione" : "spłacony", x0 + 774, y0 + 20, 200, 26, "left", { size: 16, color: GREEN_OK, plain: true });
            else {
                textOut(b, debt.paid + " / " + debt.debt + " G", x0 + 774, y0 + 20, 130, 26, "left", { size: 16, plain: true });
                bar(ctx, x0 + 894, y0 + 30, 110, 4, debt.paid / Math.max(1, debt.debt), C.accent);
                const n = debt.days, left = n > 1 ? n + " " + plural(n, "dzień", "dni", "dni") : n === 1 ? "dziś termin" : "do świtu";
                textOut(b, left, x0 + w - 120, y0 + 20, 104, 26, "right", { size: 16, color: n <= 5 ? WARN : C.text, plain: true });
            }
        } else textOut(b, "-", x0 + 774, y0 + 20, 100, 26, "left", { size: 16, color: C.muted, plain: true });
    }
    // the bust in a small rounded tile (the head of Statystyki)
    function bustTile(b, x, y, w, h) {
        const name = T.ui && T.ui.heroBust ? T.ui.heroBust() : "Hero_Bust", src = T.ui && T.ui.loadBust ? T.ui.loadBust(name) : ImageManager.loadPicture(name), ctx = b.context;
        CH.rpanel(ctx, x, y, w, h, 8, { fill: "rgba(36,38,43,1)", shadow: 0 });
        if (!src || !src.isReady() || (src.isError && src.isError())) return false;
        const img = src._canvas || src._image, k = 0.34, bw = src.width * k, bh = src.height * k;
        ctx.save();
        CH.roundPath(ctx, x, y, w, h, 8);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        if (img) ctx.drawImage(img, 0, 0, src.width, src.height, x + (w - bw) / 2 - 2, y - 3, bw, bh);
        ctx.restore();
        return true;
    }

    // ================================================================== Statystyki
    function StatsView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.addSprite(new Sprite(new Bitmap(W(), H())));
        this._focus = 0;
    }
    StatsView.prototype = Object.create(View.prototype);
    StatsView.prototype.constructor = StatsView;
    StatsView.prototype.keys = function() {
        const xp = heroXp(), out = [["W/S", "atrybut"]];
        if (xp && xp.points > 0) out.push(["O", "rozdaj punkt"]);
        out.push(["P", "wróć"]);
        return out;
    };
    StatsView.prototype.attrIds = function() { const Cb = T.api("Combat"); return Cb && Cb.ATTRS ? Cb.ATTRS.map(a => a.id) : []; };
    StatsView.prototype.refresh = function() { this.draw(); };
    StatsView.prototype.draw = function() {
        const b = this._bg.bitmap, xp = heroXp(), Cb = T.api("Combat");
        b.clear();
        // ---- who he is
        const hd = HA.head;
        apanel(b, hd);
        this._bustOk = bustTile(b, hd.x + 10, hd.y + 6, 50, 50);
        const actor = $gameParty.leader();
        textOut(b, actor ? actor.name() : "", hd.x + 72, hd.y + 6, 220, 30, "left", { size: 22, face: "bold", plain: true });
        if (xp) {
            const lv = "Poziom " + xp.level + (xp.top ? "" : " · " + xp.xp + " / " + xp.need + " dośw."), lw = measure(lv, 14, "regular");
            textOut(b, lv, hd.x + 72, hd.y + 32, lw + 8, 22, "left", { size: 14, face: "regular", color: C.accent, plain: true });
            bar(b.context, hd.x + 72 + lw + 14, hd.y + 41, Math.max(40, 330 - lw), 4, xp.ratio, C.accent);
        }
        needRows().forEach(([k, lab, v, val], i) => {
            const x = 500 + i * 172, [icon, mode] = CH.NEED_ICONS[k];
            CH.drawIcon(b, icon, x, hd.y + 15, 32, mode);
            textOut(b, lab, x + 38, hd.y + 12, 110, 24, "left", { size: 15, face: "regular", plain: true });
            textOut(b, val, x + 92, hd.y + 12, 60, 24, "right", { size: 15, color: v < 0.25 ? WARN : C.text, plain: true });
            bar(b.context, x + 38, hd.y + 39, 114, 3, v, C[k]);
        });
        // ---- the attributes
        const pts = xp ? xp.points : 0, ids = this.attrIds();
        apanel(b, HA.attrs, "Atrybuty", pts > 0 ? pts + " pkt do rozdania" : "");
        ids.forEach((id, i) => {
            const a = Cb.ATTRS[i], y = HA.attrY + i * HA.rowStep, on = i === this._focus, x0 = HA.attrX, w = HA.attrW;
            if (on) {
                CH.rpanel(b.context, x0 - 8, y - 15, w + 16, 32, 6, { fill: CARD_HI, line: null, shadow: 0 });
                b.context.fillStyle = C.accent;
                b.context.fillRect(x0 - 8, y - 8, 2, 18);
            }
            textOut(b, a.name, x0 + 4, y - 14, 180, 28, "left", { size: 17, face: on ? "bold" : null, plain: true });
            textOut(b, String(xp ? xp.attr[id] || 0 : 0), x0 + w - 34 - 60, y - 14, 60, 28, "right", { size: 18, face: "bold", plain: true });
            if (pts > 0) {
                const can = (xp.attr[id] || 0) < (Cb.ATTR_MAX || 60);
                CH.rpanel(b.context, x0 + w - 24, y - 11, 22, 22, 5, { fill: null, line: on && can ? C.accent : C.line, shadow: 0 });
                textOut(b, "+", x0 + w - 24, y - 13, 22, 26, "center", { size: 16, face: "bold", color: can ? (on ? C.accent : C.muted) : C.dim, plain: true });
            }
        });
        // ---- the blows: the weapon in the right hand
        apanel(b, HA.dmg, "Obrażenia");
        const fi = Cb && Cb.fightInfo ? Cb.fightInfo() : null, dx = HA.dmg.x + 20, dw = HA.dmg.w - 40;
        this._fight = [];
        if (fi) {
            const wp = fi.weapon, E = T.api("Equipment"), sl = E ? E.slots().find(s => s.id === "right") : null;
            if (sl && sl.icon) CH.drawIcon(b, sl.icon, dx - 4, HA.dmg.y + 26, 32);
            textOut(b, wp.name, dx + 34, HA.dmg.y + 22, dw - 34, 26, "left", { size: 18, face: "bold", plain: true });
            textOut(b, "prawa ręka · [ ] zmienia w trybie walki", dx + 34, HA.dmg.y + 44, dw - 34, 20, "left", { size: 14, face: "regular", color: C.muted, plain: true });
            const rows = fi.ranged
                ? [["Strzał", String(wp.shot)], ["Zasięg", wp.range + " pól"], ["Celowanie", pctTxt(wp.aim) + " czasu"], ["Amunicja", String(wp.ammoLeft)], ["Krytyk (wręcz)", pctTxt(fi.critChance, 1)]]
                : [["Cios", String(wp.hit)], ["Seria", wp.series.join(" / ")], ["Ciężki cios", wp.heavy + "  (pełny " + wp.heavyFull + ")"],
                    ["Krytyk", pctTxt(fi.critChance, 1) + "  ×1,6 = " + wp.crit], ["Zbijanie równowagi", wp.poise + "  (ostatni " + wp.poiseLast + ", ciężki " + wp.poiseHeavy + ")"],
                    ["Oddech na cios", String(wp.breath)]];
            rows.forEach(([lab, val], i) => kvRow(b, dx, HA.dmg.y + 80 + i * 26, dw, lab, val, { valueW: 150 }));
            this._fight = rows;
            const foot = fi.ranged ? "Wręcz bez broni: cios " + fi.fists.hit : wp.id === 0 ? "Bez broni. Broń: Ekwipunek → Prawa ręka" : "Bez broni: cios " + fi.fists.hit + ", seria " + fi.fists.series.join(" / ") + (wp.fire ? " · podpala (+" + wp.fireBonus + ")" : "");
            textOut(b, foot, dx, HA.dmg.y + HA.dmg.h - 22, dw, 20, "left", { size: 13, face: "regular", color: C.muted, plain: true });
        }
        // ---- what keeps him whole
        apanel(b, HA.def, "Odporności");
        const de = Cb && Cb.defenseInfo ? Cb.defenseInfo() : null, fx = HA.def.x + 18, fw = HA.def.w - 36;
        this._defense = [];
        if (de) {
            const rows = [["Życie (najwięcej)", String(de.mhp)], ["Oddech", String(de.breath)],
                de.armor ? ["Zbroja · " + de.armor.name, "−" + pctTxt(de.armor.reduce) + " obrażeń"] : ["Zbroja", "brak"],
                de.shield ? ["Blok · " + de.shield.name, "zatrzymuje " + pctTxt(Math.min(0.9, de.shield.reduce + de.blockPerk))] : ["Blok · bez tarczy", "zatrzymuje " + pctTxt(Math.min(0.9, de.bare + de.blockPerk))],
                ["Szansa na ranę", pctTxt(de.wound) + " zwykłej"], ["Próg przewrócenia", String(de.knock)],
                de.cloak ? ["Zimno · Płaszcz", "nie marzniesz"] : ["Zimno", de.cold > 0 ? "marzniesz słabiej (−" + pctTxt(Math.min(1, de.cold)) + ")" : "bez płaszcza marzniesz"],
                ["Strach i „prawdy”", "opór " + pctTxt(de.mind)]];
            rows.forEach(([lab, val], i) => kvRow(b, fx, HA.def.y + 36 + i * 26, fw, lab, val, { valueW: 140 }));
            this._defense = rows;
            textOut(b, "+ parowanie " + secTxt(de.parry) + " · przewrót " + de.rollCost + " oddechu", fx, HA.def.y + HA.def.h - 22, fw, 20, "left", { size: 13, face: "regular", color: C.muted, plain: true });
        }
        // ---- the chosen attribute's words (a fixed panel: now / +1 point)
        apanel(b, HA.desc, "Opis zaznaczonego");
        const info = Cb && Cb.attrInfo && ids[this._focus] ? Cb.attrInfo(ids[this._focus]) : null;
        this._info = info;
        if (info) {
            const x0 = HA.desc.x + 20, y0 = HA.desc.y + 26, w = HA.desc.w - 40, nw = measure(info.name, 22, "bold");
            textOut(b, info.name, x0, y0, nw + 8, 32, "left", { size: 22, face: "bold", plain: true });
            textOut(b, info.value + " / " + info.max, x0 + nw + 12, y0 + 4, 120, 26, "left", { size: 15, color: C.accent, plain: true });
            let y = y0 + 34;
            for (const line of wrapWords(info.desc, 16, Math.round(w * 0.46), "regular")) { textOut(b, line, x0, y, Math.round(w * 0.46) + 10, 22, "left", { size: 16, face: "regular", color: "#d8d2c6", plain: true }); y += 22; }
            const tx = x0 + Math.round(w * 0.5), tw = w - Math.round(w * 0.5), cNow = tx + tw - 150, cNext = tx + tw;
            CH.spaced(b, "teraz", cNow, HA.desc.y + 8, 18, { size: 12, color: C.muted, align: "right" });
            CH.spaced(b, info.rows.length && info.rows[0].next ? "+1 pkt" : "maks.", cNext, HA.desc.y + 8, 18, { size: 12, align: "right" });
            info.rows.slice(0, 5).forEach((r, i) => {
                const yy = HA.desc.y + 30 + i * 21;
                textOut(b, CH.fit(r.label, 15, tw - 240, "regular"), tx, yy, tw - 230, 22, "left", { size: 15, face: "regular", color: "#d8d2c6", plain: true });
                textOut(b, r.now, cNow - 100, yy, 100, 22, "right", { size: 15, plain: true });
                textOut(b, r.next || "—", cNext - 100, yy, 100, 22, "right", { size: 15, color: r.next && r.next !== r.now ? C.accent : C.dim, plain: true });
            });
        }
        drawHeroFoot(b);
        b._baseTexture.update();
    };
    StatsView.prototype.update = function() {
        if (!this._bustOk) { const t = (this._bustT = (this._bustT || 0) + 1); if (t % 10 === 0) this.draw(); }   // (the bust still loading)
        if (!this.scene.inputReady() || this.scene._slide || this.scene._level !== 3) return;
        const n = this.attrIds().length;
        // the mouse over a row chooses it (only when the mouse moves)
        const mx = TouchInput.x, my = TouchInput.y;
        if (mx !== this._mx || my !== this._my) {
            const first = this._mx === undefined;
            this._mx = mx; this._my = my;
            const k = first ? -1 : this.rowAt(mx, my);
            if (k >= 0 && k !== this._focus) { this._focus = k; this.draw(); }
        }
        if (n && (Input.isRepeated("down") || Input.isRepeated("up"))) {
            this._focus = (this._focus + (Input.isRepeated("down") ? 1 : n - 1)) % n;
            SoundManager.playCursor();
            this.draw();
        } else if (Input.isTriggered("ok")) this.spend();
    };
    StatsView.prototype.rowAt = function(x, y) {
        if (x < HA.attrX - 8 || x > HA.attrX + HA.attrW + 8) return -1;
        const n = this.attrIds().length;
        for (let i = 0; i < n; i++) { const cy = HA.attrY + i * HA.rowStep; if (y >= cy - 17 && y <= cy + 17) return i; }
        return -1;
    };
    // Enter (or a click on "+"): a point to the chosen attribute, while there are points
    StatsView.prototype.spend = function() {
        const Cb = T.api("Combat"), xp = heroXp(), id = this.attrIds()[this._focus], add = {};
        if (!id) return;
        add[id] = 1;
        if (Cb && xp && xp.points > 0 && Cb.spendPoints && Cb.spendPoints(add)) {
            AudioManager.playSe({ name: "Item3", volume: 70, pitch: 110, pan: 0 });
            this.draw();
            this.scene.drawKeys();
            this.scene.drawSubBar();
        } else SoundManager.playBuzzer();
    };
    StatsView.prototype.touch = function(x, y) {
        const k = this.rowAt(x, y);
        if (k < 0) return;
        const plus = x >= HA.attrX + HA.attrW - 28;
        if (k !== this._focus) { this._focus = k; SoundManager.playCursor(); this.draw(); }
        if (plus || this._clickT === k) this.spend();
        this._clickT = k;
    };

    // ================================================================== Ekwipunek
    // the figure (the hero's walking sheet, the first frame, 4 x) with the places round it: the left column his right side
    const EQF = { cx: 368, cy: 372, cell: 48, spread: 120, step: 66,
        left: ["head", "cloak", "right", "hands", "legs", "feet"], right: ["back", "torso", "left", "belt", "extra"],
        anchor: { head: [0, -100], cloak: [-22, -40], torso: [8, -30], back: [26, -50], right: [-44, 6], left: [44, 6], hands: [-40, 20], belt: [0, 12],
            legs: [10, 60], feet: [-10, 112], extra: [30, 30] } };
    function eqCells() {
        const out = [], { cx, cy, cell, spread, step } = EQF;
        EQF.left.forEach((id, i) => out.push({ id, col: 0, row: i, x: cx - spread - cell, y: cy - (EQF.left.length * step) / 2 + i * step }));
        EQF.right.forEach((id, i) => out.push({ id, col: 1, row: i, x: cx + spread, y: cy - (EQF.right.length * step) / 2 + i * step }));
        return out;
    }
    const ITEM_HINT = { left: "Pochodnia w lewej ręce odkłada tarczę na plecy, dopóki płonie.", right: "Ta sama broń, co w trybie walki ([ ]).",
        torso: "Każdy cios, który do niego dojdzie, ją zużywa.", cloak: "Zimą i w śniegu bez płaszcza marzniesz.", feet: "Bez butów chodzisz wolniej.",
        back: "Bez plecaka mniej uniesiesz.", head: "W grze nie ma jeszcze nic na głowę.", hands: "W grze nie ma jeszcze rękawic.", belt: "W grze nie ma jeszcze pasa.",
        legs: "W grze nie ma jeszcze nic na nogi.", extra: "W grze nie ma jeszcze dodatków." };
    function EquipView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.addSprite(new Sprite(new Bitmap(W(), H())));
        this._fig = this.addSprite(new Sprite());
        this._fg = this.addSprite(new Sprite(new Bitmap(W(), H())));
        this._cell = eqCells().findIndex(c => c.id === "right");
        this._mode = "cells";
        this._row = 0;
        this._note = "";
    }
    EquipView.prototype = Object.create(View.prototype);
    EquipView.prototype.constructor = EquipView;
    EquipView.prototype.keys = function() {
        if (this._mode === "list") return [["W/S", "rzecz"], ["O", "załóż"], ["P", "wróć"]];
        return [["W/S A/D", "komórka"], ["O", "wybierz"], ["X", "zdejmij"], ["P", "wróć"]];
    };
    EquipView.prototype.cur = function() { return eqCells()[this._cell] || eqCells()[0]; };
    // what the chosen place can take: the things in the bag (worn marked), the ones not had yet (grey: where they are made), "Zdejmij"
    EquipView.prototype.rows = function() {
        const E = T.api("Equipment"), slot = this.cur().id, def = E ? E.SLOTS.find(s => s.id === slot) : null;
        if (!E || !def) return [];
        const rows = E.choices(slot).map(c => Object.assign({ act: "on" }, c)), had = new Set(rows.map(r => r.id));
        for (const id of def.items) {
            if (had.has(id) || !$dataItems[id]) continue;
            const torch = id === E.TORCH;
            rows.push({ act: "ghost", id, name: $dataItems[id].name + (torch ? " · zapal" : ""), icon: $dataItems[id].iconIndex,
                note: torch ? "gdy masz pochodnię: świeci i płoszy zwierzęta" : "nie masz · zrobisz: " + (def.from || "?") });
        }
        const now = E.current(slot);
        if (now && slot !== "right") rows.push({ act: "off", name: slot === "left" && now === E.TORCH ? "Zdejmij - wbijesz ją w ziemię" : "Zdejmij", icon: 0, note: "" });
        return rows;
    };
    EquipView.prototype.refresh = function() { this._mode = "cells"; this._note = ""; this.draw(); };
    EquipView.prototype.leave = function() { this._mode = "cells"; this._note = ""; };
    EquipView.prototype.cancel = function() {
        if (this._mode !== "list") return false;
        SoundManager.playCancel();
        this._mode = "cells";
        this.draw();
        this.scene.drawKeys();
        return true;
    };
    EquipView.prototype.drawFigure = function() {
        const src = ImageManager.loadCharacter("Hero_Walk"), s = this._fig;
        if (!src.isReady()) { this._figOk = false; return; }
        if (this._figOk) return;
        const b = new Bitmap(100, 240), ctx = b.context, img = src._canvas || src._image;
        ctx.imageSmoothingEnabled = false;
        if (img) ctx.drawImage(img, 20, 2, 25, 60, 0, 0, 100, 240);
        b._baseTexture.update();
        s.bitmap = b;
        s.x = EQF.cx - 50;
        s.y = EQF.cy - 120;
        this._figOk = true;
    };
    EquipView.prototype.draw = function() {
        const b = this._bg.bitmap, f = this._fg.bitmap, ctx = b.context, E = T.api("Equipment");
        b.clear(); f.clear();
        const D = T.api("Dog");
        let dog = "";
        try { const st = D && D.state ? D.state() : null; if (st && st.tame) dog = "towarzysz: pies"; } catch (e) { dog = ""; }
        apanel(b, HA.fig, "Ekwipunek", dog);
        apanel(b, HA.list);
        apanel(b, HA.item, "Opis zaznaczonego");
        this.drawFigure();
        if (!E) { textOut(b, "Ekwipunek się wczytuje...", HA.fig.x + 20, HA.fig.y + 50, 300, 24, "left", { size: 15, color: C.muted, plain: true }); b._baseTexture.update(); return; }
        const slots = {}, cells = eqCells(), cur = this.cur(), { cx, cy, cell } = EQF;
        for (const sl of E.slots()) slots[sl.id] = sl;
        // the shadow under the figure
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.ellipse(cx, cy + 116, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // the lines from the places to the body (over the figure: the front layer)
        const fc = f.context;
        for (const c of cells) {
            const on = c.id === cur.id, [ax, ay] = EQF.anchor[c.id], bx = cx + ax, by = cy + ay, sx = c.col === 0 ? c.x + cell : c.x, sy = c.y + cell / 2, mx = (sx + bx) / 2;
            fc.save();
            fc.strokeStyle = on ? "rgba(208,138,90,0.85)" : "rgba(90,92,100,0.55)";
            fc.lineWidth = 1;
            fc.beginPath(); fc.moveTo(sx, sy + 0.5); fc.lineTo(mx, sy + 0.5); fc.lineTo(bx + 0.5, by + 0.5); fc.stroke();
            fc.fillStyle = on ? C.accent : "rgba(150,150,160,0.8)";
            fc.beginPath(); fc.arc(bx + 0.5, by + 0.5, 2, 0, Math.PI * 2); fc.fill();
            fc.restore();
        }
        for (const c of cells) {
            const sl = slots[c.id] || {}, on = c.id === cur.id, has = !!sl.icon;
            if (on) { fc.save(); fc.shadowColor = "rgba(208,138,90,0.6)"; fc.shadowBlur = 10; CH.rpanel(fc, c.x, c.y, cell, cell, 8, { fill: "rgba(40,42,47,1)", line: null, shadow: 0 }); fc.restore(); }
            CH.rpanel(fc, c.x, c.y, cell, cell, 8, { fill: has ? "rgba(40,42,47,1)" : "rgba(28,29,33,0.86)", line: on ? C.accent : has ? C.line : "rgba(54,56,62,1)", shadow: 0, lw: on ? 2 : 1 });
            if (has) {
                CH.drawIcon(f, sl.icon, c.x + 8, c.y + 8 - (sl.wear ? 3 : 0), 32);
                if (sl.wear) { const r = sl.wear.left / Math.max(1, sl.wear.life); bar(fc, c.x + 6, c.y + cell - 7, cell - 12, 3, r, r > 0.5 ? GREEN_OK : r > 0.2 ? "#dda650" : WARN); }
            } else { fc.fillStyle = "rgba(80,82,90,1)"; fc.fillRect(c.x + cell / 2 - 7, c.y + cell / 2, 14, 1); }
            textOut(f, sl.label || c.id, c.x - 20, c.y + cell + 1, cell + 40, 16, "center", { size: 13, face: "regular", color: on ? C.text : has ? C.muted : DIMT, plain: true });
        }
        // the choice for the chosen place
        const rows = this.rows(), L0 = HA.list, x0 = L0.x + 20, w = L0.w - 40, def = E.SLOTS.find(s => s.id === cur.id) || {};
        CH.spaced(b, (def.label || "") + " · wybierz", x0, L0.y + 9, 20, { size: 13 });
        const vis = 4, top = this._mode === "list" ? Math.max(0, Math.min(this._row - vis + 1, rows.length - vis)) : 0;
        this._rowTop = top;
        rows.slice(top, top + vis + 1).forEach((r, k) => {
            const i = top + k, y = L0.y + 38 + k * 46, on = this._mode === "list" && i === this._row, ghost = r.act === "ghost";
            if (y + 40 > L0.y + L0.h) return;
            if (on) { CH.rpanel(ctx, x0 - 8, y - 4, w + 16, 44, 6, { fill: CARD_HI, line: null, shadow: 0 }); ctx.fillStyle = C.accent; ctx.fillRect(x0 - 8, y + 3, 2, 30); }
            if (r.icon) CH.drawIcon(b, r.icon, x0, y + 2, 32, null, ghost ? 0.45 : 1);
            const tx = r.icon ? x0 + 42 : x0 + 42;
            textOut(b, CH.fit(r.name, 17, w - 150), tx, y + (r.note ? 0 : 8), w - 140, 24, "left", { size: 17, face: on ? "bold" : null, color: ghost || r.act === "off" ? (r.act === "off" ? C.muted : DIMT) : C.text, plain: true });
            if (r.note) textOut(b, CH.fit(r.note, 14, w - 60, "regular"), tx, y + 20, w - 50, 20, "left", { size: 14, face: "regular", color: ghost ? DIMT : C.muted, plain: true });
            if (r.worn) textOut(b, "założone", x0 + w - 100, y + 2, 100, 22, "right", { size: 14, color: C.accent, plain: true });
        });
        if (!rows.length) textOut(b, def.items && !def.items.length && !def.hand ? "W grze nie ma jeszcze nic na tę część ciała." : "Nie masz nic do założenia tutaj.", x0, L0.y + 44, w, 24, "left", { size: 15, face: "regular", color: C.muted, plain: true });
        if (rows.length > vis + 1 || top > 0) textOut(b, (top + 1) + "–" + Math.min(rows.length, top + vis + 1) + " z " + rows.length, x0, L0.y + L0.h - 24, w, 20, "right", { size: 13, color: C.muted, plain: true });
        this._rowsNow = rows;
        // the chosen thing's words
        this.drawItem(b, rows);
        drawHeroFoot(b);
        b._baseTexture.update();
        f._baseTexture.update();
    };
    // the description: the thing on the chosen place (or the row chosen in the list)
    EquipView.prototype.drawItem = function(b, rows) {
        const E = T.api("Equipment"), Cb = T.api("Combat"), R = HA.item, x0 = R.x + 20, w = R.w - 40, cur = this.cur(), def = E.SLOTS.find(s => s.id === cur.id) || {};
        const sl = E.slots().find(s => s.id === cur.id) || {}, row = this._mode === "list" ? rows[this._row] : null;
        let id = row ? (row.act === "off" ? 0 : row.id) : sl.item, worn = row ? !!row.worn : !!sl.item, name = row ? row.name : sl.name;
        if (row && row.act === "off") name = "";
        const icon = row ? row.icon : sl.icon;
        if (cur.id === "right" && !row && sl.hand === "m0") { id = 0; name = "Pięści"; }
        if (icon) CH.drawIcon(b, icon, x0, R.y + 32, 48, null, row && row.act === "ghost" ? 0.5 : 1);
        const tx = icon ? x0 + 62 : x0;
        textOut(b, CH.fit(name || (def.label + ": pusto"), 21, 220, "bold"), tx, R.y + 30, 230, 30, "left", { size: 21, face: "bold", color: name ? C.text : C.muted, plain: true });
        const state = row ? (row.act === "ghost" ? "nie masz" : row.worn ? "założone" : row.act === "off" ? "zdejmij" : "w plecaku") : name ? (cur.id === "right" ? "w ręce" : "założone") : sl.none ? "brak w grze" : "pusto";
        textOut(b, (def.label || "") + " · " + state, tx, R.y + 58, 230, 22, "left", { size: 15, face: "regular", color: C.accent, plain: true });
        // the numbers of the thing
        const rowsKV = [], F = T.api("Combat_parts"), fight = F && F.fight ? F.fight : null, D = T.api("Durability"), S = T.api("Survival");
        const wearRow = () => { if (D && D.TOOLS && D.TOOLS[id] && D.left && D.lifeOf) rowsKV.push(["Zużycie", D.left(id) + " / " + D.lifeOf(id)]); };
        if (id === 155 && fight) { const sh = fight.SHIELDS[155]; rowsKV.push(["Blok zatrzymuje", pctTxt(sh.reduce) + " ciosu"], ["Oddech na blok", "×" + num1(sh.breath)], ["Bez tarczy", "blok " + pctTxt(fight.NO_SHIELD.reduce)]); wearRow(); }
        else if (id === 171 && fight) { rowsKV.push(["Cios słabszy o", pctTxt(fight.ARMORS[171].reduce)]); wearRow(); }
        else if (id === 112) rowsKV.push(["Zimno", "nie marzniesz"]);
        else if (id === 113) rowsKV.push(["Chód", "+" + Math.round(((S && S.BOOTS_SPEED) || 1.1) * 100 - 100) + "% szybciej"]);
        else if (id === 114) rowsKV.push(["Udźwig", "+" + ((S && S.WEIGHT_CAP_BACKPACK) || 80)], ["Stosy", "+" + ((S && S.BACKPACK_BONUS) || 51) + " sztuk"]);
        else if (id === 59) { const Tr = T.api("Torch"), r = Tr && Tr.ratio ? Tr.ratio() : 0, hrs = Tr && Tr.TORCH ? Tr.TORCH.hours : 3; if (Tr && Tr.isLit && Tr.isLit()) rowsKV.push(["Płonie jeszcze", "ok. " + Math.max(1, Math.round(r * hrs * 60)) + " min"]); rowsKV.push(["Świeci", "płoszy zwierzęta"]); }
        if (cur.id === "right" && Cb && Cb.meleeInfo && (id === 0 || (fight && fight.MELEE[id]))) {
            const m = Cb.meleeInfo(id || 0);
            rowsKV.push(["Cios", String(m.hit)], ["Zasięg", num1(m.reach)], ["Oddech na cios", String(m.breath)]);
            if (id) wearRow();
        } else if (cur.id === "right" && (id === 125 || id === 126) && Cb && Cb.fightInfo) {
            const fi = Cb.fightInfo();
            if (fi.ranged) rowsKV.push(["Strzał", String(fi.weapon.shot)], ["Zasięg", fi.weapon.range + " pól"], ["Amunicja", String(fi.weapon.ammoLeft)]);
            wearRow();
        }
        rowsKV.slice(0, 4).forEach(([lab, val], i) => kvRow(b, R.x + 248, R.y + 44 + i * 26, R.w - 268, lab, val, { size: 15, valueW: 110 }));
        const note = this._note || "Działa tylko to, co założone." + (ITEM_HINT[cur.id] ? " " + ITEM_HINT[cur.id] : "");
        wrapWords(note, 14, w, "regular").slice(0, 2).forEach((line, i) => textOut(b, line, x0, R.y + R.h - 50 + i * 20, w, 20, "left", { size: 14, face: "regular", color: this._note ? WARN : C.muted, plain: true }));
    };
    EquipView.prototype.update = function() {
        if (!this._figOk) this.drawFigure();
        if (!this.scene.inputReady() || this.scene._slide || this.scene._level !== 3) return;
        const mx = TouchInput.x, my = TouchInput.y;
        if (mx !== this._mx || my !== this._my) {
            const first = this._mx === undefined;
            this._mx = mx; this._my = my;
            const k = first || this._mode === "list" ? -1 : this.cellAt(mx, my);
            if (k >= 0 && k !== this._cell) { this._cell = k; this._note = ""; this.draw(); }
        }
        if (this._mode === "list") {
            const rows = this._rowsNow || this.rows();
            if (Input.isRepeated("down") || Input.isRepeated("up")) {
                const n = rows.length, d = Input.isRepeated("down") ? 1 : -1;
                let i = this._row;
                for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (rows[i].act !== "ghost") break; }
                this._row = i;
                SoundManager.playCursor();
                this.draw();
            } else if (Input.isTriggered("ok")) this.choose();
            return;
        }
        for (const [key, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
            if (Input.isRepeated(key)) { this.move(dx, dy); return; }
        }
        if (Input.isTriggered("ok")) this.openList();
        else if (Input.isTriggered("takeOff")) this.takeOff();
    };
    EquipView.prototype.cellAt = function(x, y) {
        return eqCells().findIndex(c => x >= c.x - 4 && x <= c.x + EQF.cell + 4 && y >= c.y - 2 && y <= c.y + EQF.cell + 16);
    };
    // the arrows: up / down in the column (round), left / right to the other column at about the same height
    EquipView.prototype.move = function(dx, dy) {
        const cells = eqCells(), cur = this.cur();
        let next = -1;
        if (dy) {
            const col = cells.filter(c => c.col === cur.col), i = col.findIndex(c => c.id === cur.id), to = col[(i + dy + col.length) % col.length];
            next = cells.findIndex(c => c.id === to.id);
        } else {
            const other = cells.filter(c => c.col !== cur.col);
            let best = Infinity;
            for (const c of other) { const d = Math.abs(c.y - cur.y); if (d < best) { best = d; next = cells.indexOf(c); } }
        }
        if (next < 0 || next === this._cell) return;
        this._cell = next;
        this._note = "";
        SoundManager.playCursor();
        this.draw();
    };
    EquipView.prototype.openList = function() {
        const rows = this.rows(), i = rows.findIndex(r => r.worn), first = rows.findIndex(r => r.act !== "ghost");
        if (first < 0) {
            SoundManager.playBuzzer();
            const def = (T.api("Equipment").SLOTS.find(s => s.id === this.cur().id)) || {};
            this._note = def.items && !def.items.length && !def.hand ? "W grze nie ma jeszcze nic na tę część ciała." : "Nie masz nic do założenia tutaj.";
            this.draw();
            return;
        }
        SoundManager.playOk();
        this._mode = "list";
        this._row = i >= 0 ? i : first;
        this._note = "";
        this.draw();
        this.scene.drawKeys();
    };
    EquipView.prototype.choose = function() {
        const E = T.api("Equipment"), rows = this._rowsNow || this.rows(), r = rows[this._row], slot = this.cur().id;
        if (!r || r.act === "ghost" || !E) { SoundManager.playBuzzer(); return; }
        const ok = r.act === "off" ? E.unequip(slot) : r.worn ? true : E.equip(slot, r.id, r.hand);
        if (ok) { if (!r.worn) SoundManager.playEquip(); this._mode = "cells"; this._note = ""; }
        else { SoundManager.playBuzzer(); this._note = "Tego nie da się teraz założyć."; this._mode = "cells"; }
        this.draw();
        this.scene.drawKeys();
    };
    // X: what is on the chosen place comes off
    EquipView.prototype.takeOff = function() {
        const E = T.api("Equipment"), slot = this.cur().id;
        if (E && E.current(slot) && E.unequip(slot)) { SoundManager.playEquip(); this._note = ""; }
        else { SoundManager.playBuzzer(); this._note = "Tu nic nie ma do zdjęcia."; }
        this.draw();
    };
    EquipView.prototype.touch = function(x, y) {
        if (this._mode === "list") {
            const L0 = HA.list, k = Math.floor((y - L0.y - 34) / 46), i = (this._rowTop || 0) + k, rows = this._rowsNow || [];
            if (x >= L0.x && x <= L0.x + L0.w && k >= 0 && i < rows.length && rows[i].act !== "ghost") {
                if (i === this._row) this.choose(); else { this._row = i; SoundManager.playCursor(); this.draw(); }
            } else if (!(x >= L0.x && x <= L0.x + L0.w && y >= L0.y && y <= L0.y + L0.h)) this.cancel();
            return;
        }
        const k = this.cellAt(x, y);
        if (k >= 0) {
            if (k === this._cell) this.openList();
            else { this._cell = k; this._note = ""; SoundManager.playCursor(); this.draw(); }
            return;
        }
        const L0 = HA.list;
        if (x >= L0.x && x <= L0.x + L0.w && y >= L0.y + 30 && y <= L0.y + L0.h) this.openList();
    };

    // ------------------------------------------------------------------
    // Plecak: the categories (↑ from the grid's top row; ←/→ there, ↓ / Enter / Esc back), the grid, the chosen thing's card; Enter uses
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    // The bag's order (the user, 2026-10-08): "Grupy" by default - Narzędzia i broń (what he wears / holds first, marked), Jedzenie
    // (what spoils soonest first - Spoilage.js), Picie, Materiały (the most used in the recipes and the buildings first), Nasiona, Do
    // zadań (what the active quests ask for), Inne - each group under its own small heading, starting a new row; or "Nazwa", "Ilość",
    // "Najnowsze" (what came into the bag last first). Tab or a click on the foot switches it; kept in the config (ConfigManager.bagSort).
    // The tiles: a copper corner on what is worn, a wear bar on the tools, a freshness bar on what spoils.
    // ------------------------------------------------------------------
    const SORTS = [["groups", "Grupy"], ["name", "Nazwa"], ["count", "Ilość"], ["new", "Najnowsze"]];
    if (ConfigManager.bagSort === undefined) ConfigManager.bagSort = "groups";
    const _cfgMake = ConfigManager.makeData;
    ConfigManager.makeData = function() { const c = _cfgMake.call(this); c.bagSort = this.bagSort || "groups"; return c; };
    const _cfgApply = ConfigManager.applyData;
    ConfigManager.applyData = function(c) { _cfgApply.call(this, c); this.bagSort = c && SORTS.some(s => s[0] === c.bagSort) ? c.bagSort : "groups"; };
    const bagSort = () => (SORTS.some(s => s[0] === ConfigManager.bagSort) ? ConfigManager.bagSort : "groups");
    // when each thing last came into the bag (for "Najnowsze")
    const bagNew = T.state.define("bagNew", () => ({ seq: 0, at: {} }), { version: 1, owner: PLUGIN });
    const _gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(it, amount, includeEquip) {
        _gainItem.call(this, it, amount, includeEquip);
        if (amount > 0 && it && DataManager.isItem(it) && window.$gameSystem && this === $gameParty) { const s = bagNew(); s.at[it.id] = ++s.seq; }
    };
    const GROUPS = [["tools", "Narzędzia i broń"], ["food", "Jedzenie"], ["drink", "Picie"], ["mat", "Materiały"], ["seed", "Nasiona"], ["quest", "Do zadań"], ["other", "Inne"], ["keep", "Pamiątki"]];
    // the story's keepsakes (MenuPanel.isKeepsake: the tag <Pamiatka>, the prologue's pendant, a key item weighing nothing): their own group
    // at the end, never with the tools, never to wear
    const isKeep = it => { const mp = MP(); return !!(mp && mp.isKeepsake && mp.isKeepsake(it)); };
    const TOOL_LIKE = new Set([59, 127, 138, 141, 142, 144]);   // pochodnia, strzały, wiadro, kociołek, nożyce, szczypce (kept as items, used as tools)
    const DRINKS = new Set([81, 123, 137]);                      // piwo, mleko, miód pitny (and anything <Drink>: the waterskin)
    const isFoodItem = it => !!(it && it.meta && it.meta.Food !== undefined);
    const perishable = it => { const Sp = T.api("Spoilage"); return !!(Sp && Sp.isPerishable && Sp.isPerishable(it)); };
    let useCount = null;   // item id -> how many recipes and buildings take it
    function usesOf(id) {
        if (!useCount) {
            useCount = {};
            const add = list => { for (const [i] of list || []) useCount[i] = (useCount[i] || 0) + 1; };
            const F = T.api("Farming");
            if (F && F.BUILDINGS) for (const b of Object.values(F.BUILDINGS)) { add(b.cost); for (const r of b.recipes || []) add(r.inputs); }
            if (F && F.HAND_RECIPES) for (const r of F.HAND_RECIPES) add(r.inputs);
        }
        return useCount[id] || 0;
    }
    function groupOf(it, quest) {
        if (isKeep(it)) return "keep";
        if (it.itypeId === 2 || TOOL_LIKE.has(it.id)) return "tools";
        if ((it.meta && it.meta.Drink !== undefined) || DRINKS.has(it.id)) return "drink";
        if (isFoodItem(it) || perishable(it) || (it.meta && it.meta.Butcher !== undefined)) return "food";
        if (/^Nasiona/.test(it.name)) return "seed";
        if (quest && quest.has(it.id)) return "quest";
        if (it.itypeId === 1 && it.occasion === 3) return "mat";
        return "other";
    }
    const wornNow = id => { const E = T.api("Equipment"); return !!(E && E.worn && E.worn(id)); };
    const WEAPON_RANK = id => { const F = T.api("Combat_parts"), o = F && F.fight ? F.fight.MELEE_ORDER : []; const k = o.indexOf(id); return k >= 0 ? k : id === 125 || id === 126 || id === 127 ? 20 : -1; };
    function hoursLeft(id) { const Sp = T.api("Spoilage"); const h = Sp && Sp.hoursLeft ? Sp.hoursLeft(id) : null; return h === null || h === undefined ? Infinity : h; }
    const byName = (a, b) => a.name.localeCompare(b.name, "pl");
    // the sorted list: { data (items, null = an empty place ending a group's row), heads: [{ key, label, index, count }] }
    function sortBag(items, mode, quest) {
        items = items.filter(Boolean);
        if (mode === "name") return { data: items.sort(byName), heads: [] };
        if (mode === "count") return { data: items.sort((a, b) => $gameParty.numItems(b) - $gameParty.numItems(a) || byName(a, b)), heads: [] };
        if (mode === "new") { const at = bagNew().at; return { data: items.sort((a, b) => (at[b.id] || 0) - (at[a.id] || 0) || b.id - a.id), heads: [] }; }
        const by = {};
        for (const it of items) (by[groupOf(it, quest)] = by[groupOf(it, quest)] || []).push(it);
        const order = {
            tools: (a, b) => (wornNow(b.id) - wornNow(a.id)) || (kindRank(a) - kindRank(b)) || (WEAPON_RANK(a.id) - WEAPON_RANK(b.id)) || a.id - b.id,
            food: (a, b) => (hoursLeft(a.id) - hoursLeft(b.id)) || a.id - b.id,
            mat: (a, b) => (usesOf(b.id) - usesOf(a.id)) || a.id - b.id,
            quest: byName,
            keep: byName
        };
        const data = [], heads = [], cols = 8;
        for (const [key, label] of GROUPS) {
            const list = by[key];
            if (!list || !list.length) continue;
            list.sort(order[key] || ((a, b) => a.id - b.id));
            while (data.length % cols) data.push(null);   // (a group starts a row of its own)
            heads.push({ key, label, index: data.length, count: list.length });
            data.push(...list);
        }
        return { data, heads };
    }
    // tools first, then the weapons, the arrows, then what is worn (the clothes, the shield)
    function kindRank(it) {
        const E = T.api("Equipment");
        if (E && E.WEARABLE && E.WEARABLE[it.id]) return 3;
        if (it.id === 127) return 2;
        return WEAPON_RANK(it.id) >= 0 ? 1 : 0;
    }
    // the bag's grid with the group headings: each heading a strip above its group's first row; the rects, the scroll, the mouse and
    // the arrows all go by that layout (an empty place ending a group is skipped)
    const BAG = { head: 26, cell: 64 };
    function groupedGrid(list, view) {
        const make = list.makeItemList;
        list.makeItemList = function() {
            make.call(this);
            const s = sortBag(this._data, bagSort(), this._questIds || questIds());
            this._data = s.data;
            this._heads = s.heads;
            const rows = Math.ceil(this._data.length / this.maxCols()), firstRows = new Set(s.heads.map(h => Math.floor(h.index / this.maxCols())));
            this._rowY = [];
            let y = 0;
            for (let r = 0; r <= rows; r++) { if (firstRows.has(r)) y += BAG.head; this._rowY.push(y); y += BAG.cell; }
            this._firstRows = firstRows;
        };
        const rowY = (w, r) => (w._rowY && w._rowY[r] !== undefined ? w._rowY[r] : r * BAG.cell);
        list.itemRect = function(index) {
            const cols = this.maxCols(), c = index % cols, r = Math.floor(index / cols), g = this.colSpacing() / 2;
            return new Rectangle(c * BAG.cell + g - this.scrollBaseX(), rowY(this, r) + g - this.scrollBaseY(), BAG.cell - g * 2, BAG.cell - g * 2);
        };
        list.overallHeight = function() {
            const rows = Math.ceil(this.maxItems() / this.maxCols());
            return Math.max(this.innerHeight, rowY(this, rows));
        };
        list.ensureCursorVisible = function(smooth) {
            const i = this.index();
            if (i < 0 || this.innerHeight <= 0) return;
            const r = Math.floor(i / this.maxCols()), top = rowY(this, r) - (this._firstRows && this._firstRows.has(r) ? BAG.head : 0), bottom = rowY(this, r) + BAG.cell;
            const sy = this.scrollY();
            const go = y => (smooth ? this.smoothScrollTo(0, y) : this.scrollTo(0, y));
            if (top < sy) go(top);
            else if (bottom > sy + this.innerHeight) go(bottom - this.innerHeight);
        };
        list.hitTest = function(x, y) {
            if (!this.innerRect.contains(x, y)) return -1;
            const cx = this.origin.x + x - this.padding, cy = this.origin.y + y - this.padding;
            for (let i = 0; i < this.maxItems(); i++) if (this._data[i] && this.itemRect(i).contains(cx, cy)) return i;
            return -1;
        };
        list.drawAllItems = function() {
            const c = this.contents, top = this.scrollBaseY(), bottom = top + this.innerHeight + BAG.cell * 2;
            for (const h of this._heads || []) {
                const y = rowY(this, Math.floor(h.index / this.maxCols())) - BAG.head - this.scrollBaseY();
                if (y < -BAG.head || y > this.innerHeight + BAG.cell) continue;
                CH.spaced(c, h.label, 4, y + 6, 18, { size: 12 });
                const lw = CH.spacedWidth(h.label, 12, 2) + 12;
                textOut(c, String(h.count), 4 + lw, y + 5, 40, 20, "left", { size: 13, color: C.muted, plain: true });
                c.context.fillStyle = "rgba(64,66,74,0.9)";
                c.context.fillRect(4 + lw + 28, y + 15, this.innerWidth - lw - 40, 1);
                c._baseTexture.update();
            }
            for (let i = 0; i < this.maxItems(); i++) {
                const r = Math.floor(i / this.maxCols()), y = rowY(this, r);
                if (y + BAG.cell < top || y > bottom) continue;
                if (this._data[i]) this.drawItem(i);
            }
            if (!this.maxItems()) textOut(c, "Pusto.", 4, 10, 300, 26, "left", { size: 16, color: C.muted, plain: true });
        };
        // the tiles' marks: worn (a copper corner), the wear (tools), the freshness (what spoils)
        const tile = list.drawItem;
        list.drawItem = function(index) {
            const it = this.itemAt(index);
            if (!it) { const e = this.itemRect(index); this.contents.clearRect(e.x - 2, e.y - 2, e.width + 4, e.height + 4); return; }   // (an empty place ending a group)
            tile.call(this, index);
            const r = this.itemRect(index), ctx = this.contents.context, D = T.api("Durability"), Sp = T.api("Spoilage");
            if (wornNow(it.id)) {
                ctx.save();
                ctx.fillStyle = C.accent;
                ctx.beginPath(); ctx.moveTo(r.x + 2, r.y + 2); ctx.lineTo(r.x + 16, r.y + 2); ctx.lineTo(r.x + 2, r.y + 16); ctx.closePath(); ctx.fill();
                ctx.restore();
            }
            let ratio = null, col = null;
            if (D && D.TOOLS && D.TOOLS[it.id] && D.left && D.lifeOf) { ratio = D.left(it.id) / Math.max(1, D.lifeOf(it.id)); col = ratio > 0.5 ? GREEN_OK : ratio > 0.2 ? "#dda650" : WARN; }
            else if (Sp && Sp.isPerishable && Sp.isPerishable(it) && Sp.LIFE && Sp.state) {
                const st = Sp.state(), b = st && st.bag && (st.bag[it.id] || []).find(x => x.n > 0);
                ratio = b ? Math.max(0, 1 - b.age / Sp.LIFE[it.id]) : 1;
                col = ratio > 0.5 ? "#9fd08a" : ratio > 0.2 ? "#dda650" : WARN;
            }
            if (ratio !== null) bar(ctx, r.x + 8, r.y + r.height - 6, r.width - 16, 3, ratio, col);
            this.contents._baseTexture.update();
        };
        // the categories go by the same groups (the torch, the bucket, the arrows are with the tools, the drinks with the food), so a
        // "Materiały" list never shows the heading "Narzędzia i broń"
        const incl = list.includes;
        list.includes = function(it) {
            const cat = this._category;
            if ((cat !== "mat" && cat !== "food" && cat !== "tool") || !it || !DataManager.isItem(it)) return incl.call(this, it);
            if (it.itypeId !== 1 && it.itypeId !== 2) return false;
            const g = groupOf(it, null);
            return cat === "tool" ? g === "tools" : cat === "food" ? g === "food" || g === "drink" : g === "mat" || g === "seed";
        };
        // after a new list (a category, the order): never on an empty place
        const refresh = list.refresh;
        list.refresh = function() {
            refresh.call(this);
            let i = Math.min(this.index(), this.maxItems() - 1);
            while (i > 0 && !this._data[i]) i--;
            if (i !== this.index() && i >= 0) this.select(i);
        };
        // the arrows: an empty place ending a group is passed over
        const fix = (w, back) => {
            let i = w.index();
            if (i < 0 || w._data[i]) return;
            if (back) { while (i > 0 && !w._data[i]) i--; }
            else { const j = i; while (i < w.maxItems() && !w._data[i]) i++; if (i >= w.maxItems()) { i = j; while (i > 0 && !w._data[i]) i--; } }
            w.select(i);
            w.ensureCursorVisible(false);
        };
        for (const [name, back] of [["cursorDown", true], ["cursorUp", true], ["cursorLeft", true], ["cursorRight", false]]) {
            const f = list[name];
            list[name] = function(wrap) { f.call(this, wrap); fix(this, back); };
        }
    }
    const questIds = () => { const mp = MP(); return mp && mp.questNeeds ? mp.questNeeds() : new Set(); };

    function BagView(scene, def) {
        View.call(this, scene, def);
        const P = L.panel, mp = MP();
        this._panel = panelSprite(this, P.x, P.y, P.w, P.h);
        this._head = this.addSprite(new Sprite(new Bitmap(W(), H())));
        this._detail = this.addWindow(new mp.Window_ItemDetail(new Rectangle(P.x + 584, P.y + 60, P.w - 600, P.h - 104)), false);
        this._list = this.addWindow(new Window_ItemList(new Rectangle(P.x + 4, P.y + 60, 8 * 64 + 24, P.h - 104)));
        this._cats = this.addWindow(new Window_ItemCategory(new Rectangle(P.x + 4, P.y + 2, 640, 64)), false);
        mp.makeGrid(this._list);
        this._list.setHelpWindow(this._detail);
        this._cats.setItemWindow(this._list);
        this._cats.deactivate();
        this._cats.select(0);
        this._list.setCategory(this._cats.currentSymbol());
        const list = this._list, cats = this._cats;
        list.setHandler("ok", () => this.use());
        const up = list.cursorUp;
        list.cursorUp = function(wrap) {   // ↑ from the top row: the categories
            if (this.index() < this.maxCols()) { this._toCats = true; return; }
            up.call(this, wrap);
        };
        const handle = list.processCursorMove;
        list.processCursorMove = function() {
            handle.call(this);
            if (this._toCats) { this._toCats = false; scene._views.item.focusCats(); }
        };
        cats._sub = true;
        cats.setHandler("ok", () => { SoundManager.playOk(); scene.setLevel(3); });
        cats.setHandler("cancel", () => scene.levelUp());
        cats.cursorDown = () => scene.setLevel(3);
        outlineWhenActive(cats);
        const catSelect = cats.select;
        cats.select = function(i) {   // (the list takes the category at once - not through update(), which reads the keys again)
            catSelect.call(this, i);
            if (this._itemWindow && this.currentSymbol()) this._itemWindow.setCategory(this.currentSymbol());
            if (scene._views.item) { scene._views.item._detail.setItem(scene._views.item._list.item()); scene._views.item.drawHead(); }
        };
        groupedGrid(list, this);   // (the groups' headings, the order, the marks on the tiles)
        this._sortBoxes = [];
        // "Wyrzuć" (X): the question over the bag and the little plate that says why not - over the windows, so on the scene itself
        this._drop = null;
        this._dropBoxes = [];
        this._over = new Sprite(new Bitmap(W(), H()));
        this._toast = new Sprite();
        this._toast.visible = false;
        this._toastText = "";
        scene.addChild(this._over);
        scene.addChild(this._toast);
        // (Enter on something that cannot be used: why - the classic bag's words)
        list.playBuzzerSound = function() {
            const help = scene._views.item ? scene._views.item._detail : null;
            if (help) help._note = "";
            Window_ItemList.prototype.playBuzzerSound.call(this);
            const it = this.item();
            if (help && it && !help._note) help.setText(it.itypeId === 2 ? "Tego się nie używa z plecaka: narzędzie działa samo, kiedy jest potrzebne." : "Tego nie da się zjeść ani użyć: to materiał do budowania i wytwarzania.");
        };
    }
    BagView.prototype = Object.create(View.prototype);
    BagView.prototype.constructor = BagView;
    BagView.prototype.keys = function() {
        const d = this._drop;
        if (d && d.step === "qty") return [["A/D", "±1"], ["W/S", "±10"], ["Tab", "wszystko"], ["O", "dalej"], ["P", "anuluj"]];
        if (d) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", d.max > 1 ? "ile" : "anuluj"]];
        return [["W/S A/D", "rzecz"], ["O", "użyj"], ["X", "wyrzuć"], ["Tab", "porządek"], ["P", "kategorie"]];
    };
    // the order: Tab (the next one) or a click on its word in the foot; the chosen thing stays chosen
    BagView.prototype.setSort = function(mode) {
        if (!SORTS.some(x => x[0] === mode) || mode === bagSort()) return;
        const list = this._list, it = list.item();
        ConfigManager.bagSort = mode;
        try { ConfigManager.save(); } catch (e) { /* (no config file: kept for now) */ }
        SoundManager.playCursor();
        list.refresh();
        const i = it ? list._data.indexOf(it) : -1;
        list.select(i >= 0 ? i : list._data.findIndex(Boolean));
        list.ensureCursorVisible(false);
        this._detail.setItem(list.item());
        this.drawHead();
    };
    BagView.prototype.update = function() {
        this.updateToast();
        if (!this.scene.inputReady() || this.scene._slide || this.scene._level !== 3) return;
        if (this._drop) { this.updateDrop(); return; }
        if (this._list.active && Input.isTriggered("takeOff")) { this.askDrop(); return; }
        if (Input.isTriggered("tab")) { const k = SORTS.findIndex(x => x[0] === bagSort()); this.setSort(SORTS[(k + 1) % SORTS.length][0]); }
    };
    BagView.prototype.touch = function(x, y) {
        if (this._drop) {
            const q = this._dropBoxes.find(q => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
            if (q) this.dropAct(q.act);
            return;
        }
        const b = this._sortBoxes.find(q => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
        if (b) this.setSort(b.mode);
    };
    // P while asking: from Tak / Nie back to how many, from how many out
    BagView.prototype.cancel = function() {
        if (!this._drop) return false;
        SoundManager.playCancel();
        if (this._drop.step === "ask" && this._drop.max > 1) { this._drop.step = "qty"; this.drawDrop(); this.scene.drawKeys(); }
        else this.closeDrop();
        return true;
    };
    BagView.prototype.refresh = function() {
        this._list.refresh();
        if (this._list.index() >= this._list.maxItems()) this._list.select(Math.max(0, this._list.maxItems() - 1));
        if (this._list.index() < 0 && this._list.maxItems()) this._list.select(0);
        this._detail.setItem(this._list.item());
        this._cats.refresh();
        this.drawHead();
    };
    BagView.prototype.activate = function() {
        this.scene._helpWindow = this._detail;   // (what eating says - Survival's feedback - goes under the card)
        this.focusGrid(true);
    };
    BagView.prototype.leave = function() {
        if (this.scene._helpWindow === this._detail) this.scene._helpWindow = null;
        if (this._drop) { this._drop = null; this.drawDrop(); }
        this._toast.visible = false;
        this._toastText = "";
    };
    BagView.prototype.focusCats = function() {   // (↑ from the grid's top row: up to the categories - level 2)
        SoundManager.playCursor();
        this.scene.setLevel(2);
    };
    BagView.prototype.subFocus = function() {
        this._list.deactivate();
        this._cats.activate();
    };
    BagView.prototype.focusGrid = function(quiet) {
        this._cats.deactivate();
        this._list.activate();
        if (this._list.index() < 0 && this._list.maxItems()) this._list.select(0);
        this._detail.setItem(this._list.item());
        if (!quiet) SoundManager.playCursor();
        this.scene.drawKeys();
    };
    // the head of the panel: the load as a thin copper bar; the foot: the things and the coins
    BagView.prototype.drawHead = function() {
        const b = this._head.bitmap, P = L.panel, S = T.api("Survival");
        b.clear();
        if (S && S.carriedWeight && S.weightCap) {
            const load = S.carriedWeight(), cap = S.weightCap(), text = Math.round(load) + " / " + cap, tw = measure(text, 17);
            textOut(b, text, P.x + P.w - 24 - tw - 4, P.y + 16, tw + 8, 28, "left", { size: 17, plain: true, color: load > cap ? WARN : C.text });
            const bx = P.x + P.w - 24 - tw - 14 - 90;
            bar(b.context, bx, P.y + 29, 90, 4, Math.min(1, load / Math.max(1, cap)), C.accent);
            CH.spaced(b, "Obciążenie", bx - 16, P.y + 20, 20, { size: 13, color: C.muted, align: "right" });
        }
        b.context.fillStyle = C.line;
        b.context.fillRect(P.x + 570, P.y + 64, 1, P.h - 112);
        b.context.fillRect(P.x + 24, P.y + P.h - 44, P.w - 48, 1);
        const n = $gameParty.items().length;
        textOut(b, n + " " + (n === 1 ? "rzecz" : "rzeczy") + " · " + $gameParty.gold() + " monet", P.x + 24, P.y + P.h - 38, P.w - 48, 28, "right", { size: 16, color: C.accent, plain: true });
        // the foot's left: the order - its four words, the chosen one in copper, Tab
        let x = P.x + 24;
        const fy = P.y + P.h - 38;
        CH.spaced(b, "Porządek", x, fy + 5, 18, { size: 12, color: C.muted });
        x += CH.spacedWidth("Porządek", 12, 2) + 14;
        this._sortBoxes = [];
        for (const [mode, label] of SORTS) {
            const on = mode === bagSort(), tw = measure(label, 16, on ? "bold" : null);
            textOut(b, label, x, fy, tw + 6, 28, "left", { size: 16, face: on ? "bold" : null, color: on ? C.accent : C.muted, plain: true });
            if (on) { b.context.fillStyle = C.accent; b.context.fillRect(x, fy + 26, tw, 2); }
            this._sortBoxes.push({ mode, x0: x - 4, x1: x + tw + 4, y0: fy, y1: fy + 30 });
            x += tw + 18;
        }
        keycaps(b, x + 4, fy + 2, [["Tab", ""]]);
        b._baseTexture.update();
    };
    // Enter on a thing: used on the hero at once (one hero), as the bag did
    BagView.prototype.use = function() {
        const list = this._list, it = list.item(), actor = $gameParty.leader(), help = this._detail;
        if (!it || !actor) { list.activate(); return; }
        const action = new Game_Action(actor);
        action.setItemObject(it);
        const ok = $gameParty.canUse(it) && actor.canUse(it) && (!action.isForFriend() || action.testApply(actor));
        if (!ok) { list.playBuzzerSound(); list.activate(); return; }
        help._note = "";
        SoundManager.playUseItem();
        actor.useItem(it);
        for (let i = 0; i < action.numRepeats(); i++) action.apply(actor);
        action.applyGlobal();
        if ($gameTemp.isCommonEventReserved()) { SceneManager.goto(Scene_Map); return; }
        const note = help._note;
        list.refresh();
        if (list.index() >= list.maxItems()) list.select(Math.max(0, list.maxItems() - 1));
        help.setItem(list.item());
        if (note) help.setText(note);
        this.drawHead();
        list.activate();
    };
    // ---- "Wyrzuć" (X on a thing, the user 2026-10-14): how many (A / D by one, W / S by ten, Tab all), then Tak / Nie; it goes into a
    // bundle on the ground in front of him (Drops.js). What cannot go (a keepsake, what a quest asks for) - a plate over the thing.
    const DROP = { w: 540, h: 292 };
    BagView.prototype.askDrop = function() {
        const list = this._list, it = list.item(), D = T.api("Drops");
        if (!it || !D) { SoundManager.playBuzzer(); return; }
        const why = D.refuse(it);
        if (why) { SoundManager.playBuzzer(); this.toast(it.iconIndex, why); return; }
        const have = $gameParty.numItems(it), max = D.maxDrop(it);
        this._drop = { it, have, max, n: 1, step: max > 1 ? "qty" : "ask", yes: true, need: have - max };
        list.deactivate();
        SoundManager.playOk();
        this.drawDrop();
        this.scene.drawKeys();
    };
    BagView.prototype.closeDrop = function() {
        this._drop = null;
        this.drawDrop();
        this._list.activate();
        this.scene.drawKeys();
    };
    BagView.prototype.setDropN = function(n) {
        const d = this._drop, v = Math.max(1, Math.min(d.max, n));
        if (v === d.n) return;
        d.n = v;
        SoundManager.playCursor();
        this.drawDrop();
    };
    BagView.prototype.updateDrop = function() {
        const d = this._drop;
        if (d.step === "qty") {
            if (Input.isRepeated("right")) this.setDropN(d.n + 1);
            else if (Input.isRepeated("left")) this.setDropN(d.n - 1);
            else if (Input.isRepeated("up")) this.setDropN(d.n + 10);
            else if (Input.isRepeated("down")) this.setDropN(d.n - 10);
            else if (Input.isTriggered("tab")) this.dropAct("all");
            else if (Input.isTriggered("ok")) this.dropAct("next");
            return;
        }
        if (Input.isRepeated("left") || Input.isRepeated("right")) { d.yes = !d.yes; SoundManager.playCursor(); this.drawDrop(); }
        else if (Input.isTriggered("ok")) this.dropAct(d.yes ? "yes" : "no");
    };
    BagView.prototype.dropAct = function(act) {
        const d = this._drop;
        if (!d) return;
        if (act === "minus") this.setDropN(d.n - 1);
        else if (act === "plus") this.setDropN(d.n + 1);
        else if (act === "all") this.setDropN(d.n === d.max ? 1 : d.max);
        else if (act === "next") { SoundManager.playOk(); d.step = "ask"; d.yes = true; this.drawDrop(); this.scene.drawKeys(); }
        else if (act === "no") { SoundManager.playCancel(); this.closeDrop(); }
        else if (act === "yes") this.doDrop();
    };
    BagView.prototype.doDrop = function() {
        const d = this._drop, D = T.api("Drops"), list = this._list, it = d.it, n = d.n;
        const b = D ? D.drop(it.id, n) : null;
        this._drop = null;
        this.drawDrop();
        list.refresh();
        let i = Math.min(list.index(), list.maxItems() - 1);
        while (i > 0 && !list._data[i]) i--;
        if (i >= 0 && list.maxItems()) list.select(i);
        list.ensureCursorVisible(false);
        this._detail.setItem(list.item());
        this.drawHead();
        list.activate();
        this.scene.drawKeys();
        if (!b) { SoundManager.playBuzzer(); this.toast(it.iconIndex, (D && D.refuse(it)) || "Tego nie wyrzucę."); return; }
        AudioManager.playSe({ name: "Equip2", volume: 70, pitch: 80, pan: 0 });
        const here = b.x === $gamePlayer.x && b.y === $gamePlayer.y;
        this.toast(it.iconIndex, "Wyrzucone: " + it.name + (n > 1 ? " ×" + n : "") + (here ? " · pod tobą" : " · przed tobą"), C.text, true);
    };
    BagView.prototype.dropRect = function() { const P = L.panel; return { x: Math.round(P.x + (P.w - DROP.w) / 2), y: Math.round(P.y + 64 + (P.h - 108 - DROP.h) / 2) }; };
    BagView.prototype.drawDrop = function() {
        const b = this._over.bitmap, d = this._drop;
        b.clear();
        this._dropBoxes = [];
        if (!d) { b._baseTexture.update(); return; }
        const P = L.panel, r = this.dropRect(), ctx = b.context, it = d.it, w = DROP.w, x0 = r.x + 28, iw = w - 56;
        const box = (act, x, y, bw, bh) => this._dropBoxes.push({ act, x0: x, x1: x + bw, y0: y, y1: y + bh });
        ctx.save();
        ctx.fillStyle = "rgba(8,9,11,0.55)";   // (the bag under the question: dimmed)
        CH.roundPath(ctx, P.x, P.y, P.w, P.h, 12);
        ctx.fill();
        ctx.restore();
        CH.rpanel(ctx, r.x, r.y, w, DROP.h, 12, { fill: "rgba(20,21,24,0.97)", line: C.line });
        CH.spaced(b, "Wyrzuć", x0, r.y + 18, 18, { size: 13, color: C.accent });
        CH.drawIcon(b, it.iconIndex, x0, r.y + 44, 48);
        textOut(b, it.name, x0 + 62, r.y + 44, iw - 62, 30, "left", { size: 22, face: "bold", plain: true });
        textOut(b, "w plecaku " + d.have + (d.need > 0 ? " · " + d.need + " zostaje do zadania" : ""), x0 + 62, r.y + 72, iw - 62, 24, "left", { size: 16, color: C.muted, plain: true });
        if (d.step === "qty") {
            const cx = r.x + w / 2, y = r.y + 112;
            for (const [act, sx, glyph] of [["minus", cx - 150, "−"], ["plus", cx + 106, "+"]]) {
                const off = act === "minus" ? d.n <= 1 : d.n >= d.max;
                CH.rpanel(ctx, sx, y + 6, 44, 44, 8, { fill: "rgba(30,32,36,1)", line: off ? C.line : C.accent, shadow: 0, lw: off ? 1 : 1.5 });
                textOut(b, glyph, sx, y + 6, 44, 44, "center", { size: 26, face: "bold", color: off ? C.dim : C.text, plain: true });
                box(act, sx, y + 6, 44, 44);
            }
            textOut(b, String(d.n), cx - 90, y, 180, 56, "center", { size: 42, face: "bold", plain: true });
            textOut(b, "z " + d.max, cx - 90, y + 52, 180, 22, "center", { size: 15, color: C.muted, plain: true });
            bar(ctx, x0, y + 86, iw, 4, d.n / Math.max(1, d.max), C.accent);
            box("next", cx - 90, y, 180, 74);
            const ky = r.y + DROP.h - 46, all = [["Tab", "wszystko (" + d.max + ")"]];
            keycaps(b, x0, ky, all);
            box("all", x0, ky, keycapsWidth(all) + 8, 24);
            keycaps(b, r.x + w - 28 - keycapsWidth([["O", "dalej"]]), ky, [["O", "dalej"]]);
            box("next", r.x + w - 28 - keycapsWidth([["O", "dalej"]]), ky, keycapsWidth([["O", "dalej"]]) + 8, 24);
        } else {
            const D = T.api("Drops"), s = D ? D.spot() : null, here = s && s.x === $gamePlayer.x && s.y === $gamePlayer.y;
            const pile = s && D.at($gameMap.mapId(), s.x, s.y);
            let y = r.y + 110;
            textOut(b, "Wyrzucić " + (d.n === d.have ? "wszystko (" + d.n + ")" : d.n + " z " + d.have) + "?", x0, y, iw, 30, "left", { size: 21, face: "bold", plain: true });
            y += 34;
            textOut(b, (pile ? "Dołożysz do tobołka " : "Zostanie w tobołku ") + (here ? "pod tobą." : "przed tobą."), x0, y, iw, 24, "left", { size: 16, color: C.muted, plain: true });
            y += 24;
            textOut(b, "O na tobołku zabierze to z powrotem.", x0, y, iw, 24, "left", { size: 16, color: C.muted, plain: true });
            y += 24;
            if (D && D.wornLast(it, d.n)) textOut(b, "Masz to na sobie: najpierw to zdejmiesz.", x0, y, iw, 24, "left", { size: 16, color: WARN, plain: true });
            const by = r.y + DROP.h - 66, bw = (iw - 16) / 2;
            [["yes", "Tak"], ["no", "Nie"]].forEach(([act, label], k) => {
                const bx = x0 + k * (bw + 16), on = (act === "yes") === d.yes;
                CH.rpanel(ctx, bx, by, bw, 46, 8, { fill: on ? CARD_HI : "rgba(30,32,36,1)", line: on ? C.accent : C.line, shadow: 0, lw: on ? 2 : 1 });
                textOut(b, label, bx, by + 2, bw, 42, "center", { size: 18, face: on ? "bold" : null, color: on ? C.text : C.muted, plain: true });
                box(act, bx, by, bw, 46);
            });
        }
        b._baseTexture.update();
    };
    // a plate over the chosen thing (as the popups over the hero on the map): why it cannot go, or what went; it rises and fades
    BagView.prototype.toast = function(icon, text, color, quiet) {
        const s = this._toast, size = 18, pad = 10, iw = icon ? 32 + 8 : 0, tw = Math.ceil(measure(text, size)), w = pad * 2 + iw + tw + 6, h = 40;
        const b = new Bitmap(w, h);
        CH.rpanel(b.context, 0, 0, w, h, 6, { fill: "rgba(11,12,15,0.94)", line: quiet ? C.line : WARN, shadow: 0 });
        if (icon) CH.drawIcon(b, icon, pad, 4, 32);
        textOut(b, text, pad + iw, 0, tw + 6, h, "left", { size, color: color || (T.popup.COLORS ? T.popup.COLORS.need : WARN), plain: true });
        b._baseTexture.update();
        s.bitmap = b;
        const list = this._list, i = list.index(), rr = i >= 0 ? list.itemRect(i) : new Rectangle(0, 0, 0, 0), P = L.panel;
        s._x0 = Math.round(Math.max(P.x + 8, Math.min(P.x + P.w - w - 8, list.x + list.padding + rr.x + rr.width / 2 - w / 2)));
        s._y0 = Math.round(Math.max(P.y + 8, list.y + list.padding + rr.y - h - 2));
        s._age = 0;
        s.x = s._x0;
        s.y = s._y0;
        s.opacity = 0;
        s.visible = true;
        this._toastText = text;
    };
    BagView.prototype.updateToast = function() {
        const s = this._toast;
        if (!s.visible) return;
        const k = ++s._age;
        s.y = Math.round(s._y0 - 16 * ease(k / 40));
        s.opacity = Math.round(255 * Math.max(0, Math.min(1, k / 6, (120 - k) / 25)));
        if (k >= 120) { s.visible = false; this._toastText = ""; }
    };

    // ------------------------------------------------------------------
    // Dziennik: the sections (←/→), the list, the detail (Shift + ↑/↓ or the wheel scroll it); Enter pins a goal (follows a quest)
    // ------------------------------------------------------------------
    function JournalView(scene, def) {
        View.call(this, scene, def);
        const P = L.panel, J = T.api("Journal");
        this.J = J;
        this._panel = panelSprite(this, P.x, P.y, P.w, P.h);
        this._head = this.addSprite(new Sprite(new Bitmap(W(), H())));
        this._tab = 0;
        const tabs = this._tabs = this.addWindow(new Window_Command(new Rectangle(P.x + 4, P.y + 2, P.w - 8, 64)), false);
        tabs.maxCols = () => J.TABS.length;
        tabs.makeCommandList = function() { J.TABS.forEach(t => this.addCommand(t, "tab")); };
        tabs.refresh();
        tabs.deactivate();
        J.grafitTabs(tabs);
        tabs._sub = true;
        const view = this, tabSelect = tabs.select;
        tabs.select = function(i) {   // (A / D on the sections: the list shows the chosen one at once)
            tabSelect.call(this, i);
            if (i >= 0 && view._list && view._tab !== i) { view._tab = i; view.showTab(false); }
        };
        tabs.setHandler("tab", () => { SoundManager.playOk(); scene.setLevel(3); });
        tabs.setHandler("ok", () => { SoundManager.playOk(); scene.setLevel(3); });
        tabs.setHandler("cancel", () => scene.levelUp());
        outlineWhenActive(tabs);
        this._detail = this.addWindow(new J.Window_JournalDetail(new Rectangle(P.x + 500, P.y + 60, P.w - 516, P.h - 104)), false);
        const list = this._list = this.addWindow(new J.Window_JournalList(new Rectangle(P.x + 4, P.y + 60, 484, P.h - 104)));
        list._onSelect = it => this._detail.setDetail(J.detailFor(this._tab, it));
        list._onTab = null;   // (the sections: level 2 - A / D there, not in the list)
        list.setHandler("ok", () => this.onOk());
        const move = list.processCursorMove;
        list.processCursorMove = function() { if (!Input.isPressed("shift")) move.call(this); };   // (Shift + ↑/↓ scroll the detail)
    }
    JournalView.prototype = Object.create(View.prototype);
    JournalView.prototype.constructor = JournalView;
    JournalView.prototype.keys = function() { return [["W/S", "wpis"], ["Shift W/S", "przewiń opis"], ["O", "przypnij"], ["P", "działy"]]; };
    JournalView.prototype.subFocus = function() {
        this._list.deactivate();
        this._tabs.activate();
    };
    JournalView.prototype.refresh = function() {
        if (this.J.evaluateGoals) this.J.evaluateGoals();
        this.showTab(true);
    };
    JournalView.prototype.activate = function() { this._list.activate(); };
    JournalView.prototype.showTab = function(keep) {
        const idx = keep ? Math.max(0, this._list.index()) : 0;
        this._tabs.select(this._tab);
        this._list.setItems(this.J.itemsForTab(this._tab));
        if (keep && idx < this._list.maxItems()) { this._list.select(idx); this._list.updateHelp(); }
        this.drawHead();
    };
    JournalView.prototype.changeTab = function(dir) {
        const n = this.J.TABS.length;
        this._tab = (this._tab + dir + n) % n;
        SoundManager.playCursor();
        this.showTab(false);
        this._list.activate();
    };
    JournalView.prototype.onOk = function() {
        const it = this._list.currentItem(), idx = this._list.index();
        if (this.J.listOk && this.J.listOk(this._tab, it)) {
            SoundManager.playOk();
            this._list.setItems(this.J.itemsForTab(this._tab));
            this._list.select(Math.min(idx, this._list.maxItems() - 1));
            this._list.updateHelp();
            this.drawHead();
        } else SoundManager.playBuzzer();
        this._list.activate();
    };
    JournalView.prototype.drawHead = function() {
        const b = this._head.bitmap, P = L.panel, def = this.J.TAB_DEFS[this._tab];
        b.clear();
        textOut(b, dayWords(), P.x + P.w - 340, P.y + 14, 316, 28, "right", { size: 16, face: "regular", color: C.muted, plain: true });
        b.context.fillStyle = C.line;
        b.context.fillRect(P.x + 494, P.y + 64, 1, P.h - 112);
        b.context.fillRect(P.x + 24, P.y + P.h - 44, P.w - 48, 1);
        const legend = def && def.legend ? def.legend() : "";
        if (legend) textOut(b, legend, P.x + 24, P.y + P.h - 38, P.w - 48, 28, "right", { size: 16, color: C.accent, plain: true });
        b._baseTexture.update();
    };
    JournalView.prototype.update = function() {
        // Shift + ↑/↓: the detail scrolls (as the wheel does)
        if (!this._list.active || !Input.isPressed("shift")) return;
        const d = this._detail, max = Math.max(0, d.contentsHeight() - d.innerHeight);
        if (Input.isRepeated("down")) d.origin.y = Math.min(max, d.origin.y + 40);
        else if (Input.isRepeated("up")) d.origin.y = Math.max(0, d.origin.y - 40);
    };

    // ------------------------------------------------------------------
    // Umiejętności: Combat_UI's skill windows (the fields, the tree) and its Postać screen's ways with them, on this tab
    // ------------------------------------------------------------------
    function SkillsView(scene, def) {
        View.call(this, scene, def);
        const parts = T.api("Combat_parts"), UIp = parts && parts.ui, SH = UIp ? UIp.Scene_Hero.prototype : null, D = HA.dom, R = HA.tree, S = HA.skill;
        this._ok = !!(UIp && SH);
        this._head = this.addSprite(new Sprite(new Bitmap(W(), H())));
        if (!this._ok) return;
        // (the windows ask their "scene" for these: this view is it)
        this._tab = 1;
        this._focus = "domains";
        this._plan = {};
        this._treeLast = 0;
        for (const fn of ["showDomain", "enterTree", "focusDomains", "currentSkill", "refreshDetail", "onOk", "ask", "closeAsk", "onConfirm", "onConfirmNo", "pageWindow"]) this[fn] = SH[fn];
        this._detail = this.addWindow(new Window_Base(new Rectangle(S.x + 6, S.y + 30, S.w - 12, S.h - 36)), false);
        this._domains = this.addWindow(new UIp.Window_SkillDomains(new Rectangle(D.x + 2, D.y + 30, D.w - 4, D.h - 38), this));
        this._tree = this.addWindow(new UIp.Window_SkillTree(new Rectangle(R.x + 2, R.y + 4, R.w - 4, R.h - 8), this), false);
        this._domains.setHandler("ok", () => this.enterTree());
        this._tree.setHandler("ok", () => this.onOk());
        this._tree.setHandler("cancel", () => { this.focusDomains(); this.scene.drawKeys(); });
        const enter = this.enterTree;
        this.enterTree = function() { enter.call(this); this.scene.drawKeys(); };
        // the question before a point is spent
        const cw = 520, ch = 200, cf = this._confirm = new Window_Command(new Rectangle(Math.round((W() - cw) / 2), Math.round((H() - ch) / 2), cw, ch));
        cf._lines = [];
        cf.makeCommandList = function() { this.addCommand("Tak", "yes"); this.addCommand("Nie", "no"); };
        cf.maxCols = () => 2;
        cf.itemTextAlign = () => "center";
        cf.itemRect = function(index) { const rr = Window_Command.prototype.itemRect.call(this, index); rr.y = this.innerHeight - rr.height; return rr; };
        cf.drawAllItems = function() {
            this._lines.forEach((line, i) => textOut(this.contents, line, 4, i === 0 ? 0 : 8 + i * 28, this.innerWidth - 8, 28, "left", { size: i === 0 ? 22 : 17, face: i === 0 ? "bold" : "regular", color: i === 0 ? C.accent : C.text, plain: true }));
            Window_Command.prototype.drawAllItems.call(this);
        };
        cf.setHandler("yes", () => this.onConfirm());
        cf.setHandler("no", () => this.onConfirmNo());
        cf.setHandler("cancel", () => this.onConfirmNo());
        this.scene.addWindow(cf);
        cf.hide();
        cf.deactivate();
        this._domains.select(0);
    }
    SkillsView.prototype = Object.create(View.prototype);
    SkillsView.prototype.constructor = SkillsView;
    SkillsView.prototype.keys = function() {
        if (this._confirm && this._confirm.active) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", "nie"]];
        if (this._focus === "tree") return [["W/S A/D", "umiejętność"], ["O", "naucz się"], ["P", "dziedziny"]];
        return [["W/S", "dziedzina"], ["O / D", "drzewko"], ["P", "wróć"]];
    };
    SkillsView.prototype.refreshAll = function() {
        if (!this._ok) return;
        this._domains.refresh();
        this._tree.refresh();
        this.refreshDetail();
        this.drawHead();
    };
    SkillsView.prototype.refresh = function() {
        if (!this._ok) { this.drawHead(); return; }
        this._focus = "domains";
        this._tree.select(-1);
        this.showDomain(Math.max(0, this._domains.index()));
        this.refreshAll();
    };
    SkillsView.prototype.activate = function() { if (this._ok) (this._focus === "tree" ? this._tree : this._domains).activate(); };
    SkillsView.prototype.leave = function() { if (this._confirm) { this._confirm.hide(); this._confirm.deactivate(); } };
    SkillsView.prototype.drawHead = function() {
        const b = this._head.bitmap, xp = heroXp();
        b.clear();
        apanel(b, HA.dom, "Dziedziny", xp && xp.skillPoints > 0 ? xp.skillPoints + " pkt" : "");
        apanel(b, HA.tree);
        apanel(b, HA.skill, "Opis zaznaczonego");
        if (!this._ok) textOut(b, "Drzewka umiejętności nie są dostępne.", HA.tree.x + 24, HA.tree.y + 24, 400, 28, "left", { size: 17, color: C.muted, plain: true });
        drawHeroFoot(b);
        b._baseTexture.update();
    };
    // (Combat_UI's ask / closeAsk show and hide the question over the tree; the keys under it follow)
    SkillsView.prototype.update = function() {
        if (this._confirm && this._confirm.active !== this._askWas) { this._askWas = this._confirm.active; this.scene.drawKeys(); }
    };

    // ------------------------------------------------------------------
    // Opcje: OptionEx's list of settings on a graphite panel (the volumes, Wygląd: Grafit / Klasyczny...)
    // ------------------------------------------------------------------
    function OptionsView(scene, def) {
        View.call(this, scene, def);
        const w = 760, x = Math.round((W() - w) / 2), P = L.panel;
        this._panel = panelSprite(this, x, P.y, w, P.h);
        this._win = this.addWindow(new Window_Options(new Rectangle(x + 20, P.y + 16, w - 40, P.h - 32)));
    }
    OptionsView.prototype = Object.create(View.prototype);
    OptionsView.prototype.constructor = OptionsView;
    OptionsView.prototype.keys = function() { return [["W/S", "wiersz"], ["A/D", "zmień"], ["O", "przełącz"], ["P", "wróć"]]; };
    OptionsView.prototype.refresh = function() { this._win.refresh(); };
    OptionsView.prototype.activate = function() { this._win.activate(); if (this._win.index() < 0) this._win.select(0); };
    OptionsView.prototype.leave = function() { ConfigManager.save(); };

    // ------------------------------------------------------------------
    // The save files in the graphite look - the P menu's "Zapisz grę" and the title's "Kontynuuj" (Scene_Load; Scene_Save too) alike
    // (the user, 2026-10-12): a row = the hero's bust in a small tile, "Plik N" (Autozapis) and the date, under them the day, the season,
    // the place and the time played; an empty file a dashed tile and "pusty". The card: the bust big, the day and the season, the place,
    // then the rows Czas gry, Poziom, Sakiewka, Dług dziadka, Chatka, Zapisano (what the save knows - an old one less).
    // ------------------------------------------------------------------
    const bustOf = info => (info && info.bust) || "Hero_Bust";
    // the bust cut to a rounded tile (k: its scale); false while the picture loads (onReady: called once it is in)
    function bustInTile(b, name, x, y, w, h, k, onReady) {
        const src = T.ui && T.ui.loadBust ? T.ui.loadBust(name) : ImageManager.loadPicture(name), ctx = b.context;
        CH.rpanel(ctx, x, y, w, h, 8, { fill: "rgba(36,38,43,1)", line: C.line, shadow: 0 });
        if (!src || (src.isError && src.isError())) return true;
        if (!src.isReady()) { if (onReady) src.addLoadListener(onReady); return false; }
        const img = src._canvas || src._image, bw = src.width * k, bh = src.height * k;
        ctx.save();
        CH.roundPath(ctx, x + 1, y + 1, w - 2, h - 2, 7);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        if (img) ctx.drawImage(img, 0, 0, src.width, src.height, x + (w - bw) / 2 - w * 0.04, y - h * 0.06, bw, bh);
        ctx.restore();
        return true;
    }
    function emptyTile(b, x, y, w, h) {
        const ctx = b.context;
        CH.rpanel(ctx, x, y, w, h, 8, { fill: "rgba(28,29,33,0.9)", line: "rgba(54,56,62,1)", shadow: 0 });
        ctx.save();
        ctx.strokeStyle = "rgba(90,92,100,1)";
        ctx.setLineDash([3, 3]);
        CH.roundPath(ctx, x + 8.5, y + 8.5, w - 17, h - 17, 5);
        ctx.stroke();
        ctx.restore();
    }
    const dayOf = info => (info && info.day !== undefined ? "Dzień " + info.day + (info.season ? " · " + String(info.season).toLowerCase() : "") : (info && info.title) || "Zapis");
    const stampOf = ts => { const mp = MP(); return mp && mp.stampText ? mp.stampText(ts) : new Date(ts).toLocaleString(); };
    const _fileDraw = Window_SavefileList.prototype.drawItem;
    Window_SavefileList.prototype.drawItem = function(index) {
        if (!useMenu()) return _fileDraw.call(this, index);
        const id = this.indexToSavefileId(index), info = DataManager.savefileInfo(id), r = this.itemRectWithPadding(index), c = this.contents;
        const tile = Math.min(56, r.height - 8), ty = r.y + Math.round((r.height - tile) / 2), tx = r.x + tile + 14, en = this.isEnabled(id);
        if (info) bustInTile(c, bustOf(info), r.x + 2, ty, tile, tile, tile * 0.0068, this._bustWait ? null : (this._bustWait = () => { this._bustWait = null; this.refresh(); }));
        else emptyTile(c, r.x + 2, ty, tile, tile);
        c.paintOpacity = en ? 255 : 150;
        textOut(c, id === 0 ? "Autozapis" : "Plik " + id, tx, r.y + 6, 220, 26, "left", { size: 18, face: "bold", color: info ? C.text : C.muted, plain: true });
        if (info && info.timestamp) textOut(c, stampOf(info.timestamp), r.x, r.y + 6, r.width - 6, 26, "right", { size: 14, face: "regular", color: C.muted, plain: true });
        const line = info ? [dayOf(info), info.place].filter(Boolean).join(" · ") : "pusty";
        textOut(c, CH.fit(line, 15, r.width - tile - 110, "regular"), tx, r.y + 31, r.width - tile - 100, 24, "left", { size: 15, face: "regular", color: info ? "#cfc9bd" : C.dim, plain: true });
        if (info && info.playtime) textOut(c, info.playtime, r.x, r.y + 31, r.width - 6, 24, "right", { size: 15, color: C.muted, plain: true });
        c.paintOpacity = 255;
        c._baseTexture.update();
    };
    // the chosen file's card (x, y: its top-left; w its width); returns the y under it
    function drawSaveCard(b, x, y, w, id, onReady) {
        const info = DataManager.savefileInfo(id), big = 120, tx = x + big + 18;
        if (info) bustInTile(b, bustOf(info), x, y, big, big, 0.42, onReady);
        else emptyTile(b, x, y, big, big);
        CH.spaced(b, id === 0 ? "Autozapis" : "Plik " + id, tx, y + 2, 20, { size: 13 });
        textOut(b, info ? dayOf(info) : "Pusty plik", tx, y + 24, w - big - 18, 36, "left", { size: 26, face: "bold", color: info ? C.text : C.muted, plain: true });
        if (info && info.place) textOut(b, CH.fit(info.place, 17, w - big - 18, "regular"), tx, y + 62, w - big - 18, 26, "left", { size: 17, face: "regular", color: C.accent, plain: true });
        if (!info) { textOut(b, "Nic tu jeszcze nie zapisano.", tx, y + 62, w - big - 18, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true }); return y + big + 12; }
        const rows = [];
        if (info.playtime) rows.push(["Czas gry", info.playtime]);
        if (info.level) rows.push(["Poziom", String(info.level)]);
        if (info.gold !== undefined) rows.push(["Sakiewka", info.gold + " G"]);
        if (info.debt) rows.push([info.debt.lost ? "Odkup pola" : "Dług dziadka", info.debt.done ? (info.debt.lost ? "odkupione" : "spłacony") : info.debt.paid + " / " + info.debt.debt + " G"]);
        if (info.hutBuilt !== undefined) rows.push(["Chatka", info.hutBuilt ? "zbudowana" : "jeszcze nie ma"]);
        if (info.timestamp) rows.push(["Zapisano", stampOf(info.timestamp)]);
        let yy = y + big + 30;
        for (const [lab, val] of rows) {
            textOut(b, lab, x, yy - 13, 200, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true });
            textOut(b, String(val), x + 140, yy - 13, w - 140, 26, "right", { size: 16, color: (lab === "Dług dziadka" || lab === "Odkup pola") && info.debt && info.debt.done ? GREEN_OK : C.text, plain: true });
            b.context.fillStyle = "rgba(44,46,52,1)";
            b.context.fillRect(x, yy + 14, w, 1);
            yy += 32;
        }
        return yy + 4;
    }

    // ---- the file screen itself (Scene_Load from the title's "Kontynuuj", Scene_Save from an event) in the graphite look: the screen
    // behind dimmed (the title's fire), one graphite panel - the title, the files on the left, the card on the right - and the keys under
    // it: W / S choose, O loads / saves, P back (the arrows, Enter, Esc and the mouse too). The classic look keeps MenuPanel's panel.
    const FILEP = { x: 96, y: 76, w: 1088, h: 584, split: 548 };
    const _fileCreate = Scene_File.prototype.create;
    Scene_File.prototype.create = function() {
        _fileCreate.call(this);
        fillOldPlaces();   // (old files without a place: looked for once, if the boot did not get to it)
        if (!useMenu()) return;
        this._grafitFiles = true;
        const P = FILEP, list = this._listWindow, st = list && list.mzkp_statusWindow, load = this.mode() !== "save";
        if (this._menuPanel) this._menuPanel.visible = false;
        if (this._helpWindow) this._helpWindow.hide();
        if (st) { st.hide(); st.refresh = function() {}; }
        if (this._cancelButton) this._cancelButton.visible = false;
        const at = Math.max(0, this.children.indexOf(this._windowLayer));
        const bg = this._filesBg = new Sprite(new Bitmap(W(), H())), ctx = bg.bitmap.context;
        ctx.fillStyle = "rgba(10,10,12,0.55)";
        ctx.fillRect(0, 0, W(), H());
        CH.rpanel(ctx, P.x, P.y, P.w, P.h, 12, { fill: "rgba(20,21,24,0.92)" });
        textOut(bg.bitmap, load ? "Wczytaj grę" : "Zapisz grę", P.x + 24, P.y + 14, 400, 34, "left", { size: 26, face: "bold", plain: true });
        textOut(bg.bitmap, load ? "Wybierz zapis, od którego grasz dalej." : "Wybierz plik, w którym zapiszesz grę.", P.x + 24, P.y + 46, 600, 24, "left", { size: 15, face: "regular", color: C.muted, plain: true });
        ctx.fillStyle = C.line;
        ctx.fillRect(P.x + 20, P.y + 78, P.w - 40, 1);
        ctx.fillRect(P.x + P.split, P.y + 96, 1, P.h - 116);
        bg.bitmap._baseTexture.update();
        this.addChildAt(bg, at);
        this._filesCard = new Sprite(new Bitmap(W(), H()));
        this.addChildAt(this._filesCard, at + 1);
        this._filesKeys = new Sprite(new Bitmap(W(), 28));
        this._filesKeys.y = L.keysY;
        const pairs = [["W/S", "wybierz"], ["O", load ? "wczytaj" : "zapisz tutaj"], ["P", "wróć"]];
        keycaps(this._filesKeys.bitmap, Math.round(W() / 2 - keycapsWidth(pairs) / 2), 2, pairs);
        this.addChildAt(this._filesKeys, at + 2);
        list.move(P.x + 8, P.y + 88, P.split - 20, P.h - 100);
        list.opacity = 0;
        list.frameVisible = false;
        list.createContents();
        list.refresh();
        list.refreshCursor();   // (its row's width: the new one)
        list.ensureCursorVisible(false);
        this._filesCardId = -1;
        this.drawFilesCard();
    };
    Scene_File.prototype.drawFilesCard = function() {
        const list = this._listWindow, id = list && list.savefileId ? list.savefileId() : 1, b = this._filesCard.bitmap, P = FILEP;
        this._filesCardId = id;
        b.clear();
        drawSaveCard(b, P.x + P.split + 24, P.y + 100, P.w - P.split - 48, id, () => { this._filesCardId = -1; });
        b._baseTexture.update();
    };
    const _fileUpdate = Scene_File.prototype.update;
    Scene_File.prototype.update = function() {
        _fileUpdate.call(this);
        if (this._grafitFiles && this._listWindow && this._listWindow.savefileId() !== this._filesCardId) this.drawFilesCard();
    };
    // (for the tests) what the file screen shows
    const filesInfo = () => {
        const s = SceneManager._scene;
        if (!(s instanceof Scene_File) || !s._grafitFiles) return null;
        const list = s._listWindow;
        return { mode: s.mode(), id: list.savefileId(), index: list.index(), active: list.active, card: s._filesCardId, latest: DataManager.latestSavefileId(),
            rect: { x: list.x, y: list.y, w: list.width, h: list.height }, oldPanel: !!(s._menuPanel && s._menuPanel.visible), status: !!(list.mzkp_statusWindow && list.mzkp_statusWindow.visible) };
    };

    // ------------------------------------------------------------------
    // Zapisz grę: the files (day, place, time played), the chosen one's card; Enter saves there
    // ------------------------------------------------------------------
    function SaveView(scene, def) {
        View.call(this, scene, def);
        const P = L.panel;
        this._panel = panelSprite(this, P.x, P.y, P.w, P.h);
        this._card = this.addSprite(new Sprite(new Bitmap(W(), H())));
        const list = this._list = this.addWindow(new Window_SavefileList(new Rectangle(P.x + 4, P.y + 12, 500, P.h - 60)));
        list.setMode("save", false);
        list.setHandler("ok", () => this.save());
        const select = list.select;
        list.select = function(i) { select.call(this, i); if (scene._views.save) scene._views.save.drawCard(); };
        this._note = "";
    }
    SaveView.prototype = Object.create(View.prototype);
    SaveView.prototype.constructor = SaveView;
    SaveView.prototype.keys = function() { return [["W/S", "plik"], ["O", "zapisz tutaj"], ["P", "wróć"]]; };
    SaveView.prototype.allowed = function() {
        const cw = this.scene._commandWindow, i = cw._list.findIndex(c => c.symbol === "save");
        return i >= 0 ? cw.isCommandEnabled(i) : $gameSystem.isSaveEnabled();
    };
    SaveView.prototype.refresh = function() {
        fillOldPlaces();
        this._list.refresh();
        if (this._list.index() < 0) this._list.selectSavefile(Math.max(1, $gameSystem.savefileId() || 1));
        this.drawCard();
    };
    SaveView.prototype.activate = function() { this._list.activate(); };
    SaveView.prototype.drawCard = function() {
        const b = this._card.bitmap, P = L.panel, x = P.x + 540, w = P.w - 564, id = this._list.savefileId ? this._list.savefileId() : 1;
        b.clear();
        b.context.fillStyle = C.line;
        b.context.fillRect(P.x + 516, P.y + 24, 1, P.h - 48);
        let y = drawSaveCard(b, x, P.y + 24, w, id, () => this.drawCard()) + 8;
        const now = this.allowed() ? "O zapisze tu to, co teraz: " + dayWords() + (window.$gameMap && $gameMap.displayName() ? ", " + $gameMap.displayName() : "") + "."
            : "Tutaj nie można zapisać gry.";
        for (const line of this.wrap(this._note || now, w)) { textOut(b, line, x, y, w, 26, "left", { size: 17, face: "regular", color: this._note ? GREEN_OK : this.allowed() ? C.text : WARN, plain: true }); y += 26; }
        b._baseTexture.update();
    };
    SaveView.prototype.wrap = function(text, w) {
        const out = [];
        let line = "";
        for (const word of String(text).split(" ")) {
            const t = line ? line + " " + word : word;
            if (line && measure(t, 17) > w) { out.push(line); line = word; } else line = t;
        }
        if (line) out.push(line);
        return out;
    };
    SaveView.prototype.save = function() {
        const list = this._list, id = list.savefileId();
        if (!this.allowed() || !list.isEnabled(id)) { SoundManager.playBuzzer(); list.activate(); return; }
        $gameSystem.setSavefileId(id);
        $gameSystem.onBeforeSave();
        this._saving = true;
        DataManager.saveGame(id)
            .then(() => { SoundManager.playSave(); this._note = "Zapisano w pliku " + id + "."; this._saving = false; list.refresh(); this.drawCard(); list.activate(); })
            .catch(() => { SoundManager.playBuzzer(); this._note = "Nie udało się zapisać."; this._saving = false; this.drawCard(); list.activate(); });
    };
    SaveView.prototype.leave = function() { this._note = ""; };

    // ------------------------------------------------------------------
    // Zakończ grę: to the title, out of the game, or back
    // ------------------------------------------------------------------
    const END = [["title", "Do ekranu tytułowego"], ["exit", "Wyjdź z gry"], ["back", "Anuluj"]];
    const END_BOX = { w: 520, h: 300 };
    function EndView(scene, def) {
        View.call(this, scene, def);
        this._box = this.addSprite(new Sprite(new Bitmap(W(), H())));
        this._sel = 0;
    }
    EndView.prototype = Object.create(View.prototype);
    EndView.prototype.constructor = EndView;
    EndView.prototype.keys = function() { return [["W/S", "wybierz"], ["O", "potwierdź"], ["P", "wróć"]]; };
    EndView.prototype.rect = function() { return { x: Math.round((W() - END_BOX.w) / 2), y: 180 }; };
    EndView.prototype.refresh = function() {
        const b = this._box.bitmap, r = this.rect(), ctx = b.context;
        b.clear();
        CH.rpanel(ctx, r.x, r.y, END_BOX.w, END_BOX.h, 12, { fill: "rgba(20,21,24,0.94)" });
        textOut(b, "Zakończyć grę?", r.x + 28, r.y + 18, END_BOX.w - 56, 38, "left", { size: 26, face: "bold", plain: true });
        textOut(b, "To, czego nie zapisałeś, przepadnie.", r.x + 28, r.y + 56, END_BOX.w - 56, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true });
        END.forEach(([sym, label], i) => {
            const y = r.y + 104 + i * 58, on = i === this._sel;
            CH.rpanel(ctx, r.x + 28, y, END_BOX.w - 56, 46, 8, { fill: on ? CARD_HI : "rgba(30,32,36,1)", line: on ? C.accent : C.line, shadow: 0, lw: on ? 2 : 1 });
            textOut(b, label, r.x + 28, y + 2, END_BOX.w - 56, 42, "center", { size: 18, face: on ? "bold" : null, color: on ? C.text : C.muted, plain: true });
        });
        b._baseTexture.update();
    };
    EndView.prototype.update = function() {
        if (!this.scene.inputReady() || this.scene._level !== 3) return;
        if (Input.isRepeated("down") || Input.isRepeated("up")) {
            this._sel = (this._sel + (Input.isRepeated("down") ? 1 : END.length - 1)) % END.length;
            SoundManager.playCursor();
            this.refresh();
        } else if (Input.isTriggered("ok")) this.choose();
    };
    EndView.prototype.touch = function(x, y) {
        const r = this.rect();
        END.forEach((e, i) => {
            const by = r.y + 104 + i * 58;
            if (x >= r.x + 28 && x <= r.x + END_BOX.w - 28 && y >= by && y <= by + 46) {
                if (this._sel === i) this.choose(); else { this._sel = i; SoundManager.playCursor(); this.refresh(); }
            }
        });
    };
    EndView.prototype.choose = function() {
        const sym = END[this._sel][0];
        if (sym === "back") { SoundManager.playCancel(); this.scene.setLevel(1); return; }
        SoundManager.playOk();
        this.scene._closing = true;
        this.scene.fadeOutAll();
        if (sym === "title") SceneManager.goto(Scene_Title);
        else SceneManager.exit();
    };
    EndView.prototype.enter = function() { this._sel = 0; };

    // the settings' rows in the graphite look (the menu's tab and the title's options alike): the name in the text's colour, "Tak" /
    // "Nie", the volumes and the opacity as thin copper bars with their value
    const _optDraw = Window_Options.prototype.drawItem;
    Window_Options.prototype.drawItem = function(index) {
        if (!useMenu() || !this.itemLineRect) return _optDraw.call(this, index);
        const symbol = this.commandSymbol(index), title = this.commandName(index), r = this.itemLineRect(index, false), c = this.contents, en = this.isCommandEnabled(index);
        if (this.isDefaultSymbol && this.isDefaultSymbol(symbol)) { textOut(c, title, r.x, r.y, r.width, r.height, "center", { size: 17, color: C.accent, plain: true }); return; }
        textOut(c, title, r.x, r.y, r.width, r.height, "left", { size: 18, color: en ? C.text : C.dim, plain: true });
        const s = this.itemLineRect(index, true), status = this.statusText(index), value = this.getConfigValue(symbol);
        if (this.isGaugeSymbol && this.isGaugeSymbol(symbol)) {
            const rate = this.isVolumeSymbol(symbol) ? value / 100 : this.isToneSymbol && this.isToneSymbol(symbol) ? (value + 255) / 510 : value / 255;
            textOut(c, status, s.x, s.y, 56, s.height, "right", { size: 16, plain: true });
            bar(c.context, s.x + 66, s.y + Math.round(s.height / 2) - 2, s.width - 70, 4, rate, C.accent);
            c._baseTexture.update();
        } else {
            const text = symbol !== "uiClean" && value === true ? "Tak" : symbol !== "uiClean" && value === false ? "Nie" : status;
            textOut(c, text, s.x, s.y, s.width - 4, s.height, "right", { size: 17, color: value === false ? C.muted : C.accent, plain: true });
        }
    };

    const VIEWS = { stats: StatsView, equip: EquipView, skills: SkillsView, item: BagView, journal: JournalView, options: OptionsView, save: SaveView, gameEnd: EndView };

    // ==================================================================
    // The menu scene in the graphite look
    // ==================================================================
    const _create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _create.call(this);
        this._grafit = useMenu();
        this._cardOn = this._grafit;   // (an older name the tests used)
        if (this._grafit) this.createGrafit();
    };
    const atLayer = scene => scene.children.indexOf(scene._windowLayer);
    Scene_Menu.prototype.createGrafit = function() {
        const cw = this._commandWindow;
        cw.hide();
        cw.deactivate();
        if (this._statusWindow) this._statusWindow.hide();
        if (this._goldWindow) this._goldWindow.hide();
        if (this._menuPanel) this._menuPanel.visible = false;
        if (this._backgroundSprite) {
            this._blur = new PIXI.filters.BlurFilter();
            this._blur.blur = 0;
            this._backgroundSprite.filters = [this._blur];
            this._backgroundSprite.opacity = 255;
        }
        this._dim = new Sprite(new Bitmap(16, 16));
        this._dim.bitmap.fillAll("rgb(10,10,12)");
        this._dim.scale.set(W() / 16, H() / 16);
        this._dim.opacity = 0;
        this.addChildAt(this._dim, atLayer(this));
        this._viewLayer = new Sprite();
        this.addChildAt(this._viewLayer, atLayer(this));
        this._tabBar = new Sprite(new Bitmap(W(), 86));
        this.addChildAt(this._tabBar, atLayer(this));
        this._under = new Sprite(new Bitmap(8, 2));
        this._under.bitmap.fillAll(C.accent);
        this.addChildAt(this._under, atLayer(this));
        this._keys = new Sprite(new Bitmap(W(), 28));
        this._keys.y = L.keysY;
        this.addChildAt(this._keys, atLayer(this));
        this._subBar = new Sprite(new Bitmap(W(), 44));
        this._subBar.y = 88;
        this.addChildAt(this._subBar, atLayer(this));
        this._heroSub = Math.max(0, HERO_SUBS.findIndex(x => x[0] === $gameTemp._heroSub));
        menuKeys(true);
        $gameTemp._heroSub = null;
        this._level = $gameTemp._menuLevel || 1;   // (1 the tabs, 2 the sub-tabs, 3 the content)
        $gameTemp._menuLevel = null;
        // the tabs: the menu's own, then any other plugin's command (it opens its own screen, as before)
        this._tabDefs = TABS.slice();
        cw._list.forEach((c, i) => { if (!OWN.has(c.symbol)) this._tabDefs.push({ sym: c.symbol, label: c.name, extra: true, i }); });
        this._views = {};
        this._t = 0;
        const start = $gameTemp._menuTab || "hero", back = SceneManager._previousClass && SceneManager._previousClass !== Scene_Map;
        $gameTemp._menuTab = null;
        if (back) this._t = 40;   // (back from another plugin's screen: no second entrance)
        this._tabIdx = Math.max(0, this._tabDefs.findIndex(t => t.sym === start));
        this.drawTabs();
        this.openView(this._tabDefs[this._tabIdx].sym, 0, !back);
        this._underX = this._underTX;
        this._underW = this._underTW;
    };
    Scene_Menu.prototype.tabEnabled = function(def) {
        if (def.extra) return this._commandWindow.isCommandEnabled(def.i);
        return true;   // (Zapisz grę: its tab says when saving is not allowed here)
    };
    Scene_Menu.prototype.drawTabs = function() {
        const b = this._tabBar.bitmap, ctx = b.context, act = this._tabDefs[this._tabIdx];
        b.clear();
        const widths = this._tabDefs.map(t => 32 + 8 + measure(t.label, 18, t === act ? "bold" : null)), gap = 26;
        const total = widths.reduce((a, c) => a + c, 0) + gap * (this._tabDefs.length - 1);
        let x = Math.round(W() / 2 - total / 2);
        const lv1 = this._level === 1;
        if (lv1) keycaps(b, x - 48, L.tabsY + 4, [["A", ""]]);
        this._tabBoxes = [];
        let ready = true;
        this._tabDefs.forEach((t, i) => {
            const on = t === act, en = this.tabEnabled(t), ic = tabIcon(t);
            if (ic) {
                b.paintOpacity = on ? 255 : en ? 140 : 70;
                ctx.imageSmoothingEnabled = false;
                b.blt(ic, 0, 0, ic.width, ic.height, x, L.tabsY, 32, 32);
                b.paintOpacity = 255;
            } else if (t.icon) ready = false;
            textOut(b, t.label, x + 40, L.tabsY + 2, widths[i] - 36, 30, "left", { size: 18, face: on ? "bold" : null, color: on ? C.text : en ? C.muted : C.dim, plain: true });
            this._tabBoxes.push({ i, x0: x - 6, x1: x + widths[i] + 6 });
            if (on) { this._underTX = x - 6; this._underTW = widths[i] + 12; }
            if (on && lv1) CH.rpanel(ctx, x - 10, L.tabsY - 6, widths[i] + 20, 44, 10, { fill: null, line: C.accent, shadow: 0, lw: 1.5 });   // (the tabs in charge)
            x += widths[i] + gap;
        });
        if (lv1) keycaps(b, x - gap + 16, L.tabsY + 4, [["D", ""]]);
        ctx.fillStyle = C.line;
        ctx.fillRect(60, L.lineY, W() - 120, 1);
        b._baseTexture.update();
        this._tabsReady = ready && CH.facesReady();
    };
    // the keys of the layer in charge
    Scene_Menu.prototype.levelKeys = function() {
        const v = this._view, sym = this._tabDefs[this._tabIdx] ? this._tabDefs[this._tabIdx].sym : "";
        if (this._level === 1) return [["A/D", "zakładka"], ["O", "wybierz"], ["P", "wróć do gry"]];
        if (this._level === 2) return [["A/D", sym === "item" ? "kategoria" : sym === "journal" ? "dział" : "podzakładka"], ["O", "wybierz"], ["P", "wróć"]];
        return v ? v.keys() : [];
    };
    Scene_Menu.prototype.drawKeys = function() {
        const b = this._keys.bitmap, pairs = this.levelKeys();
        b.clear();
        keycaps(b, Math.round(W() / 2 - keycapsWidth(pairs) / 2), 2, pairs);
    };
    Scene_Menu.prototype.view = function(sym) {
        if (!this._views[sym]) {
            const def = this._tabDefs.find(t => t.sym === sym) || this._tabDefs.find(t => t.sym === "hero"), V = VIEWS[sym];
            this._views[sym] = V ? new V(this, def) : null;
        }
        return this._views[sym];
    };
    // the parts of Postać: the bar under the tabs (level 2: A / D, a click), the chosen part's view
    const heroTab = scene => scene._tabDefs && scene._tabDefs[scene._tabIdx] && scene._tabDefs[scene._tabIdx].sym === "hero";
    Scene_Menu.prototype.drawSubBar = function() {
        const b = this._subBar.bitmap, ctx = b.context, xp = heroXp();
        b.clear();
        this._subBoxes = [];
        if (!heroTab(this)) { this._subBar.visible = false; return; }
        this._subBar.visible = true;
        const widths = HERO_SUBS.map(([, n]) => measure(n, 17) + 40), total = widths.reduce((a, c) => a + c, 0) + 16, y = 4;
        let x = Math.round(W() / 2 - total / 2);
        const lv2 = this._level === 2;
        CH.rpanel(ctx, x - 6, y, total + 12, 34, 17, { fill: "rgba(24,25,29,0.86)", line: lv2 ? C.accent : C.line, shadow: 0.16, lw: lv2 ? 1.5 : 1 });
        if (lv2) keycaps(b, x - 54, y + 5, [["A", ""]]);
        HERO_SUBS.forEach(([sym, name], i) => {
            const on = i === this._heroSub;
            if (on) CH.rpanel(ctx, x, y + 4, widths[i], 26, 13, { fill: "rgba(52,54,60,1)", line: lv2 ? C.accent : "rgba(110,112,120,1)", shadow: 0 });
            textOut(b, name, x, y + 4, widths[i], 26, "center", { size: 17, face: on ? "bold" : null, color: on ? C.text : C.muted, plain: true });
            if (sym === "skills" && xp && xp.skillPoints > 0) textOut(b, String(xp.skillPoints), x + widths[i] - 19, y + 2, 18, 14, "center", { size: 12, face: "bold", color: C.accent, plain: true });
            if (sym === "stats" && xp && xp.points > 0) textOut(b, String(xp.points), x + widths[i] - 19, y + 2, 18, 14, "center", { size: 12, face: "bold", color: C.accent, plain: true });
            this._subBoxes.push({ i, x0: x, x1: x + widths[i] });
            x += widths[i] + 8;
        });
        if (lv2) keycaps(b, x + 22 - 8, y + 5, [["D", ""]]);
        b._baseTexture.update();
    };
    Scene_Menu.prototype.goSub = function(i, dir) {
        if (!heroTab(this) || i === this._heroSub || i < 0 || i >= HERO_SUBS.length) return;
        SoundManager.playCursor();
        const way = dir || (i > this._heroSub ? 1 : -1);
        this._heroSub = i;
        this.drawSubBar();
        this.openView("hero", way, false);
    };
    Scene_Menu.prototype.switchSub = function(dir) {
        if (!heroTab(this)) return;
        this.goSub((this._heroSub + dir + HERO_SUBS.length) % HERO_SUBS.length, dir);
    };
    // a tab's view in: the one before out, this one slides in from the way the tab lies (dir), the copper line glides (Postać: its part)
    Scene_Menu.prototype.openView = function(sym, dir, entrance) {
        if (sym === "hero") sym = HERO_SUBS[this._heroSub || 0][0];
        const old = this._view, v = this.view(sym);
        if (!v) return;
        if (old && old !== v) old.hide();
        this._view = v;
        v.show();
        if (v.enter && (entrance || v instanceof EndView)) v.enter();
        this._slide = { t: 0, dir: dir || 0 };
        this.focusLevel();
        v.place(dir ? dir * 48 : 0, dir ? 0 : 1);
    };
    // the layers (the user's, 2026-10-12): 1 the tabs, 2 the sub-tabs (Postać's bar, the bag's categories, the journal's sections), 3 the
    // content. O goes a layer down, P a layer up (from the tabs: out of the menu); the layer in charge bright, the others dimmed.
    Scene_Menu.prototype.tabHasSub = function() {
        const d = this._tabDefs[this._tabIdx], sym = d ? d.sym : "";
        return sym === "hero" || sym === "item" || sym === "journal";
    };
    Scene_Menu.prototype.focusLevel = function() {
        const v = this._view;
        if (this._level === 2 && !this.tabHasSub()) this._level = 1;
        if (v) {
            if (this._level === 1) v.blur();
            else if (this._level === 2) v.subFocus();
            else v.activate();
            v.look(this._level);
        }
        this.drawTabs();
        this.drawSubBar();
        this.drawKeys();
    };
    Scene_Menu.prototype.setLevel = function(n) {
        this._levelT = Graphics.frameCount;   // (one key, one step: the scene does not read the same key again this frame)
        this._level = Math.max(1, Math.min(3, n));
        this.focusLevel();
    };
    Scene_Menu.prototype.enterLevel = function() {
        const def = this._tabDefs[this._tabIdx];
        if (def && def.extra) {   // (another plugin's command: its own screen, as before)
            if (!this._commandWindow.isCommandEnabled(def.i)) { SoundManager.playBuzzer(); return; }
            SoundManager.playOk();
            const cw = this._commandWindow;
            cw.select(def.i);
            cw.callOkHandler();
            cw.deactivate();
            return;
        }
        SoundManager.playOk();
        this.setLevel(this._level === 1 && this.tabHasSub() ? 2 : 3);
    };
    Scene_Menu.prototype.levelUp = function() {
        if (this._level <= 1) { this.closeMenu(); return; }
        SoundManager.playCancel();
        this.setLevel(this._level === 3 && this.tabHasSub() ? 2 : 1);
    };
    Scene_Menu.prototype.switchTab = function(dir) {
        const n = this._tabDefs.length;
        let i = this._tabIdx;
        for (let k = 0; k < n; k++) {
            i = (i + dir + n) % n;
            if (this.tabEnabled(this._tabDefs[i])) break;
        }
        this.goTabIndex(i, dir);
    };
    Scene_Menu.prototype.goTab = function(sym, dir) {
        const i = this._tabDefs.findIndex(t => t.sym === sym);
        if (i >= 0) this.goTabIndex(i, dir);
    };
    Scene_Menu.prototype.goTabIndex = function(i, dir) {
        const def = this._tabDefs[i];
        if (!def) return;
        if (def.extra) {   // (another plugin's command: chosen here, opened with O - its own screen)
            SoundManager.playCursor();
            this._tabIdx = i;
            if (this._view) { this._view.hide(); this._view = null; }
            this.focusLevel();
            return;
        }
        if (i === this._tabIdx) { this.reactivateView(); return; }
        SoundManager.playCursor();
        this._tabIdx = i;
        this.drawTabs();
        this.openView(def.sym, dir || 1, false);
    };
    Scene_Menu.prototype.reactivateView = function() { this.focusLevel(); };
    // P / Esc in the content: a view's smaller part goes back first; else a layer up
    Scene_Menu.prototype.onViewCancel = function() {
        if (this._view && this._view.cancel()) return;
        this.levelUp();
    };
    Scene_Menu.prototype.closeMenu = function() {
        if (this._closing) return;
        this._closing = true;
        SoundManager.playCancel();
        if (this._views.options) ConfigManager.save();
        this.popScene();
    };
    Scene_Menu.prototype.inputReady = function() {
        return !SceneManager.isSceneChanging() && this.isActive() && !this._closing && this._t > 6 && (!this._slide || this._slide.t > 4);
    };
    const _update = Scene_Menu.prototype.update;
    Scene_Menu.prototype.update = function() {
        _update.call(this);
        if (!this._grafit) return;
        if (!useMenu() && !this._closing) { this.closeMenu(); return; }   // (Wygląd switched to the classic look: the map, then the old menu)
        this._t++;
        const k = ease(this._t / 14);
        if (this._blur) this._blur.blur = 3 * k;
        this._dim.opacity = Math.round(255 * 0.6 * k);
        const show = Math.round(255 * ease(this._t / 12));
        this._keys.opacity = show;
        this._tabBar.opacity = Math.round(show * (this._level === 1 ? 1 : 0.62));   // (the layer in charge bright, the others dimmed)
        this._subBar.opacity = Math.round(show * (this._level === 2 ? 1 : 0.62));
        if (!this._tabsReady) this.drawTabs();
        // the copper line under the tabs glides to the chosen one
        this._underX += (this._underTX - this._underX) * 0.3;
        this._underW += (this._underTW - this._underW) * 0.3;
        this._under.x = Math.round(this._underX);
        this._under.y = 72;
        this._under.scale.x = this._underW / 8;
        this._under.opacity = this._tabBar.opacity;
        // the view slides in
        const v = this._view;
        if (v && this._slide) {
            const s = this._slide, e = ease(++s.t / 12);
            v.place(s.dir * 48 * (1 - e), s.dir ? e : 1);
            if (s.t >= 12) { v.place(0, 1); this._slide = null; }
        }
        if (v) v.update();
        if (!this.inputReady()) return;
        // the layers: 1 the tabs (A / D, O, P), 2 Postać's sub-tabs (A / D, O, P - the bag's and the journal's are their windows),
        // 3 the content (its windows; a view drawn without them - Statystyki, Ekwipunek, Zakończ grę - gets P here)
        const back = Input.isTriggered("cancel") || TouchInput.isCancelled();
        if (this._levelT === Graphics.frameCount) return;   // (a view or a window changed the layer this frame with this very key)
        if (this._level === 1) {
            if (Input.isRepeated("left")) { this.switchTab(-1); return; }
            if (Input.isRepeated("right")) { this.switchTab(1); return; }
            if (Input.isTriggered("ok")) { this.enterLevel(); return; }
            if (back) { this.closeMenu(); return; }
        } else if (this._level === 2 && heroTab(this)) {
            if (Input.isRepeated("left")) { this.switchSub(-1); return; }
            if (Input.isRepeated("right")) { this.switchSub(1); return; }
            if (Input.isTriggered("ok")) { this.enterLevel(); return; }
            if (back) { this.levelUp(); return; }
        } else if (v && v.spriteInput() && back) { this.onViewCancel(); return; }
        if (TouchInput.isTriggered()) {
            const x = TouchInput.x, y = TouchInput.y;
            // the mouse: a tab - chosen and in; a sub-tab - chosen and in; the content - its layer, then the click
            if (y < L.lineY && this._tabBoxes) {
                const t = this._tabBoxes.find(t => x >= t.x0 && x <= t.x1);
                if (t) {
                    if (t.i !== this._tabIdx) { this._level = 1; this.goTabIndex(t.i, t.i > this._tabIdx ? 1 : -1); }
                    this.enterLevel();
                }
                return;
            }
            if (heroTab(this) && y >= 92 && y <= 126 && this._subBoxes) {
                const t = this._subBoxes.find(t => x >= t.x0 && x <= t.x1);
                if (t) { if (t.i !== this._heroSub) { this._level = 2; this.goSub(t.i, t.i > this._heroSub ? 1 : -1); } this.setLevel(3); }
                return;
            }
            if (!v) return;
            if (this._level < 3) { this.setLevel(3); return; }
            v.touch(x, y);
        }
    };
    const _terminate = Scene_Menu.prototype.terminate;
    Scene_Menu.prototype.terminate = function() {
        if (this._grafit) menuKeys(false);
        if (this._grafit && this._views && this._views.options) ConfigManager.save();
        _terminate.call(this);
    };
    // (for the tests) what the menu shows
    Scene_Menu.prototype.menuInfo = function() {
        if (!this._grafit) return null;
        const v = this._view, out = { tabs: this._tabDefs.map(t => t.sym), active: this._tabDefs[this._tabIdx].sym, sub: heroTab(this) ? HERO_SUBS[this._heroSub][0] : null, level: this._level, slide: !!this._slide,
            window: { visible: this._commandWindow.visible, active: this._commandWindow.active }, keys: this.levelKeys().map(k => k[1]), keyCaps: this.levelKeys().map(k => k[0]) };
        out.activeWindows = v ? v.windows.filter(w => w.active).map(w => w.constructor.name) : [];
        if (v instanceof StatsView) {
            const ids = v.attrIds();
            out.stats = { focus: ids[v._focus] || null, plus: !!(heroXp() && heroXp().points > 0), xp: heroXp(), desc: v._info ? { attr: v._info.id, rows: v._info.rows } : null,
                fight: (v._fight || []).map(r => r[0] + ": " + r[1]), defense: (v._defense || []).map(r => r[0] + ": " + r[1]), popups: v.root.children.filter(c => c !== v._bg && c.visible).length };
        }
        if (v instanceof EquipView) {
            const E = T.api("Equipment"), rows = v._rowsNow || [];
            out.equip = { cell: v.cur().id, mode: v._mode, row: v._row, note: v._note, rows: rows.map(r => ({ act: r.act, id: r.id, name: r.name, worn: !!r.worn })),
                slots: E ? E.slots().map(x => ({ id: x.id, item: x.item, name: x.name, none: x.none })) : null, cells: eqCells().map(c => c.id) };
        }
        if (v instanceof BagView) out.bag = { category: v._cats.currentSymbol(), items: v._list.maxItems(), index: v._list.index(), item: v._list.item() ? v._list.item().id : null, cats: v._cats.active,
            sort: bagSort(), heads: (v._list._heads || []).map(h => ({ key: h.key, label: h.label, index: h.index, count: h.count })), data: v._list._data.map(it => (it ? it.id : 0)),
            drop: v._drop ? { step: v._drop.step, n: v._drop.n, max: v._drop.max, have: v._drop.have, item: v._drop.it.id, yes: v._drop.yes } : null, toast: v._toastText || "", active: v._list.active };
        if (v instanceof JournalView) out.journal = { tab: v._tab, items: v._list.maxItems(), index: v._list.index(), scroll: v._detail.origin.y };
        if (v instanceof SkillsView) out.skills = { focus: v._focus, domain: v._domains ? v._domains.index() : -1, node: v._tree ? v._tree.index() : -1, ask: !!(v._confirm && v._confirm.active) };
        if (v instanceof OptionsView) out.options = { index: v._win.index(), symbol: v._win.currentSymbol() };
        if (v instanceof SaveView) out.save = { id: v._list.savefileId(), note: v._note };
        if (v instanceof EndView) out.end = { sel: END[v._sel][0] };
        return out;
    };

    if (!(window.$plugins || []).some(p => p && p.name === "Equipment" && p.status) && !T.api("Equipment")) PluginManager.loadScript("Equipment");
    if (!(window.$plugins || []).some(p => p && p.name === "Drops") && !T.api("Drops")) PluginManager.loadScript("Drops");   // (the bundles - "Wyrzuć")

    window.MenuRing = T.register(PLUGIN, { files: filesInfo, drawSaveCard, fillOldPlaces, placeOfSave, placeFill, TABS, HERO_SUBS, WEAPONS, WEAR, L, HA, heroXp, needRows, toolList, goalLine, debtInfo, VIEWS, SORTS, GROUPS, sortBag, groupOf, bagSort,
        info: () => { const s = SceneManager._scene; return s instanceof Scene_Menu && s.menuInfo ? s.menuInfo() : null; } });
})();
