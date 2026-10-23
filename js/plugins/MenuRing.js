//=============================================================================
// MenuRing.js
//=============================================================================
// The P menu of the graphite look "Grafit i miedź" (CleanHUD.js): the pages of the user's "Lista v2" (2026-10-22, docs/ui_proste/
// POMYSLY.md, the mock-ups docs/ui_proste/lista_v2_*.png and propozycja_1_lista_widok.png made by tools/ui_proste/lista_v2.py):
// "ma być prosty i przyciski O jako wejście i P jako wyjście" - "nie powinno być w postaci na sobie, tylko oddzielnie okno
// ekwipunku, ładnie całego" - in the frame of the menu before it (2026-10-23: "ogólnie ten widok, gdzie opcje główne były na
// górze, był ok ... trzeba połączyć jakoś z bieżącym", "tylko żeby nie było podzakładek").
//   At the top a row of eight tabs with icons: Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Opcje, Zapisz grę, Wyjdź (then any
//   other plugin's command - MenuPanel.addCommand: it opens its own screen); under it one panel the whole width with the chosen
//   tab's page. No second row: each tab is its page. Two levels: A / D (← / →) along the tabs - the page shows the chosen one at
//   once; O goes into the page (the tab turns brown, the others dim); P back to the tabs; P on the tabs closes the menu. Inside a
//   page one smaller step at most (the choice of a thing for an equipment place, the skills' tree, a question) - O in, P back. A
//   fixed bar of keys at the foot of every screen. No outlines round the layers: what is chosen is filled copper. The mouse works
//   too (a tab: chosen and in; the right button: back); J on the map opens the menu on Dziennik.
//   - Postać: the bust (dressed - Ubior.js), the name, the level and its bar, the four needs, the purse, grandpa's debt (days), the
//     town's opinion (its word only: "Obcy"...), the fight (top right), the attributes and what keeps him whole (ODPORNOŚCI);
//     inside W / S along the attributes with a bubble beside the chosen one - what it gives now and with a point more (Combat.
//     attrInfo) -, O gives a point while there are points.
//   - Ekwipunek: the hero big (his own dressed walking sheet, 5 x; Tab turns him: front / side / back / side) between two grids of
//     places - "Ubiór" (głowa, tors, rękawice, pas, nogi, stopy) and "Okrycie i ręce" (płaszcz, plecy, prawa ręka, lewa ręka,
//     dodatek); W / S / A / D walk the places; a bubble beside the chosen one (the thing, its words from the game, what it gives,
//     its wear, its weight; empty: where to get one); the band RAZEM (armour, warmth, load, neatness, the walk - the real bonuses).
//     O on a place: what fits it from the bag and "Nic", under the figure, the chosen thing's bubble over the other grid - the
//     figure wears it at once (Ubior.tryOn); O puts it on, P back to the places; X takes off. The right hand is the combat mode's
//     weapon, the left the shield or the burning torch (Equipment.js).
//   - Umiejętności: the fields' row in the head (A / D), the field's tree (Combat_UI's way: boxes by the level they ask, the lines
//     of what opens what), O into the tree (W / S / A / D along it, O learns after a question), P back to the fields, P to the tabs.
//   - Plecak: one list with the groups' headings and the chosen thing's card; O uses - and a thing to wear (the clothes, the shield,
//     the backpack, a weapon of the combat mode) goes on, or comes off when it is on (a swap says what came off; what is worn has a
//     yellow plate "założone" / "w ręce"); X throws out (how many, then Tak / Nie - a bundle on the ground, Drops.js), Tab the order
//     (Grupy / Nazwa / Ilość / Najnowsze, kept in the config).
//   The whole menu is shown a little smaller than its places (UI.s, the user 2026-10-23: "całe menu trochę mniejsze"), the game
//   seen round it.
//   - Dziennik: A / D the section (the sections' row in the head), W / S the entries, O pins a goal; Shift + W / S scroll the words.
//   - Opcje: OptionEx's list (W / S, A / D a value). - Zapisz grę: the files and the chosen one's card, O saves (it asks before
//     writing over a file). - Wyjdź: to the title, out of the game, or back.
// It is the same Scene_Menu with the same command window (MenuPanel's commands), only hidden. The classic look (Opcje -> Wygląd:
// Klasyczny) keeps MenuPanel's panel and its separate screens. (The file keeps its old name - it held a ring of round buttons
// first - so the plugin list stays as it is.)

/*:
 * @target MZ
 * @plugindesc Grafit: menu P - zakładki u góry (Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Opcje, Zapisz grę, Wyjdź), pod nimi widok; A/D zakładka, O wejdź, P wróć. v4.1.0
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
 * MenuRing.js - menu P w wyglądzie Grafit: zakładki u góry, widok pod nimi
 * ============================================================================
 * U góry 8 zakładek: Postać, Ekwipunek, Umiejętności, Plecak, Dziennik,
 * Opcje, Zapisz grę, Wyjdź (bez podzakładek). Pod nimi widok wybranej.
 *   A / D      po zakładkach (strzałki tak samo); w widoku: miejsce
 *              (Ekwipunek), dział (Dziennik), dziedzina (Umiejętności),
 *              wartość (Opcje)
 *   W / S      w widoku: wiersz / atrybut / miejsce / rzecz
 *   O / Enter  wejdź w widok, wybierz (załóż, użyj, przypnij, naucz się,
 *              zapisz...); w Umiejętnościach: wejdź w drzewko
 *   P / Esc    wróć poziom wyżej; na zakładkach zamyka menu
 *   X          zdejmij (Ekwipunek), wyrzuć (Plecak)
 *   Tab        obróć postać (Ekwipunek), porządek (Plecak)
 * Mysz też działa. Klawisz J otwiera menu od razu na Dzienniku.
 * W wyglądzie Klasycznym (Opcje -> Wygląd) menu jest panelem jak dotąd.
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

    // ---- the mock-ups' look (tools/ui_proste/kit.py): the colours and the places on the 1280 x 720 screen
    // (2026-10-23, the user: "układ jest ok, a można kolory z klasycznego wziąć?" - the classic look's palette, UITheme.js "klasyczny":
    // black panels, the bright yellow accent #ffd23f, light text, grey lines; the copper graphite one was: acc rgb(214,142,88) ...)
    const K = {
        text: "rgb(236,238,240)", muted: "rgb(138,144,153)", dim: "rgb(98,103,111)", line: "rgb(58,62,70)", soft: "rgb(212,214,218)",
        panel: "rgba(11,12,15,0.93)", panel2: "rgb(20,21,25)", cell: "rgb(30,32,37)", empty: "rgb(17,18,22)", track: "rgb(38,40,46)",
        acc: "rgb(255,210,63)", accDim: "rgb(92,76,24)", sel: "rgb(16,14,6)", selMuted: "rgb(88,70,12)", good: "rgb(150,205,130)",
        gold: "rgb(255,214,96)", warn: "#ff9f8f", amber: "#e8b64a", cap: "rgb(236,238,240)", strip: "rgba(6,6,8,0.92)"
    };
    const NEED_COL = { health: "rgb(216,96,90)", stamina: "rgb(148,191,110)", food: "rgb(221,166,80)", water: "rgb(98,166,220)" };
    // (the user, 2026-10-23: "ogólnie ten widok, gdzie opcje główne były na górze, był ok ... trzeba połączyć jakoś z bieżącym": the eight
    // as a row of tabs across the top - as the menu before the list - and under them one panel the whole width, the pages of the list
    // in it). The panel's own head (a strip with the page's word, its section tabs, the bag's load) is 54 px; RX().y0 lies 36 px over
    // the panel's top, so the pages' places count from the same point as the list's panel did (its title gone: the tab names it).
    const L = { tabs: { y: 32, h: 40 }, right: { x: 40, y: 84, w: 1200, h: 568 }, head: 36, keysY: 672, keysH: 48 };
    const RX = () => { const r = L.right, y0 = r.y - L.head; return { x0: r.x, y0, x1: r.x + r.w, y1: r.y + r.h, lx: r.x + 34, rx: r.x + r.w - 34, top: r.y }; };
    // (the user, 2026-10-23: "całe menu trochę mniejsze, czcionka trochę mniejsza; rozmiar, wysokość i długość trochę mniejsze") the
    // whole menu - the tabs, the panel, its windows, the bubbles and the questions - is laid out at the places above and shown at UI.s
    // of that size, in the middle of the screen over the bar of keys (one number for every place and every font: the game is seen round
    // it). The mouse is read back through touchAt(); MenuRing.UI.toScreen() gives a place on the screen (the tests).
    const UI = { s: 0.91, top: 8 };   // (top: the highest thing drawn - the day over the tabs)
    const uiOff = () => ({ x: Math.round((W() / 2) * (1 - UI.s)), y: Math.round((L.keysY - (L.right.y + L.right.h - UI.top) * UI.s) / 2 - UI.top * UI.s) });
    const toLocal = (x, y) => { const o = uiOff(); return { x: (x - o.x) / UI.s, y: (y - o.y) / UI.s }; };
    const toScreen = (x, y) => { const o = uiOff(); return { x: o.x + x * UI.s, y: o.y + y * UI.s }; };
    const touchAt = () => toLocal(TouchInput.x, TouchInput.y);

    // the list, in this order; the other plugins' commands come after it
    const ENTRIES = [
        { sym: "hero", label: "Postać", icon: "hero" },
        { sym: "equip", label: "Ekwipunek", icon: [435, "plain"] },
        { sym: "skills", label: "Umiejętności", icon: [89, "dark"] },
        { sym: "item", label: "Plecak", icon: [370, "plain"] },
        { sym: "journal", label: "Dziennik", icon: [499, "plain"] },
        { sym: "options", label: "Opcje", icon: [83, "dark"] },
        { sym: "save", label: "Zapisz grę", icon: [455, "plain"] },
        { sym: "gameEnd", label: "Wyjdź", icon: [197, "green"] }
    ];
    const OWN = new Set(ENTRIES.map(e => e.sym));
    // X: take off (Ekwipunek), throw out (Plecak) - only while the menu is open (X stays free on the map, keys_test)
    const MENU_KEYS = { 88: "takeOff" }, keysSet = {};
    function menuKeys(on) {
        for (const code in MENU_KEYS) {
            if (on && !Input.keyMapper[code]) { Input.keyMapper[code] = MENU_KEYS[code]; keysSet[code] = true; }
            else if (!on && keysSet[code]) { if (Input.keyMapper[code] === MENU_KEYS[code]) delete Input.keyMapper[code]; delete keysSet[code]; }
        }
    }

    // ------------------------------------------------------------------
    // The picture behind the menu is the map alone (the HUD, the cries, the plates left out; the map's own effects stay); J opens the
    // menu on Dziennik, inside
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
            $gameTemp._menuLevel = 2;
            return _push.call(this, Scene_Menu);
        }
        return _push.call(this, sceneClass);
    };
    // the save files remember the place (Zapisz grę shows it)
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
    // shows - Story's "Kruczy Jar" in a story game, else the map's display name, else its name in the editor), written into the
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
        if (st && typeof st === "object" && st.debt !== undefined && !st.pending && mapId === field) return Promise.resolve("Kruczy Jar");
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
    // Small pieces: the data the pages show
    // ------------------------------------------------------------------
    const plural = (n, a, b, c) => CH.pl(n, a, b, c);
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const MP = () => T.api("MenuPanel");
    const num1 = v => String(Math.round(v * 10) / 10).replace(".", ",");
    const pctTxt = v => String(Math.round(v * 100)) + "%";
    const weightTxt = w => (Number.isInteger(w) ? String(w) : String(Math.round(w * 10) / 10).replace(".", ","));
    const cap1 = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");
    function dayWords() {
        const d = T.time.day(), h = T.time.hour();
        return "Dzień " + d + " · " + T.time.seasonName(d).toLowerCase() + " · " + CH.hm(h);
    }
    function placeName() {
        try {
            const n = $gameMap.displayName();
            if (n) return n;
            return String(($dataMapInfos[$gameMap.mapId()] || {}).name || "").replace(/#\d+$/, "").trim();
        } catch (e) { return ""; }
    }
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
    function debtInfo() {
        const ST = T.api("Story"), s = ST && ST.state ? ST.state() : null;
        if (!s || s.debt === undefined || s.pending) return null;
        // (2026-10-15) the field lost: the buyback instead of the debt (no deadline; the days left to carry things off the field)
        if (s.lost && s.buy) return { paid: Math.min(s.buy.paid, s.buy.price), debt: s.buy.price, done: !!s.buy.done, days: ST.carryLeft ? ST.carryLeft() : 0, lost: true };
        return { paid: Math.min(s.paid, s.debt), debt: s.debt, done: !!(s.done || s.paid >= s.debt), days: ST.daysLeft ? ST.daysLeft() : 0 };
    }
    function opinionInfo() {
        const TQ = T.api("TownQuests");
        if (!TQ || !TQ.opinion) return null;
        try { return { value: Math.round(TQ.opinion()), tier: TQ.tierName ? TQ.tierName() : "" }; } catch (e) { return null; }
    }
    function wrapWords(text, size, w, kind) {
        const out = [];
        for (const para of String(text || "").split(/\r?\n/)) {
            let line = "";
            for (const word of para.split(/\s+/)) {
                if (!word) continue;
                const t = line ? line + " " + word : word;
                if (line && measure(t, size, kind) > w) { out.push(line); line = word; } else line = t;
            }
            out.push(line);
        }
        while (out.length && !out[out.length - 1]) out.pop();
        return out;
    }

    // ------------------------------------------------------------------
    // Drawing helpers (the mock-ups' kit.py in canvas words)
    // ------------------------------------------------------------------
    function rr(ctx, x, y, w, h, r, fill) {
        ctx.save();
        ctx.fillStyle = fill;
        CH.roundPath(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.restore();
    }
    function panelShadow(ctx, x, y, w, h) {   // the big panels: a soft shadow under them (blur 10, 6 px down)
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.47)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = K.panel;
        CH.roundPath(ctx, x, y, w, h, 14);
        ctx.fill();
        ctx.restore();
    }
    function hl(ctx, x0, x1, y, col) { ctx.fillStyle = col || K.line; ctx.fillRect(Math.round(x0), Math.round(y), Math.round(x1 - x0), 1); }
    function vl(ctx, x, y0, y1, col) { ctx.fillStyle = col || K.line; ctx.fillRect(Math.round(x), Math.round(y0), 1, Math.round(y1 - y0)); }
    function meter(ctx, x, y, w, h, ratio, col) {
        rr(ctx, x, y, w, h, h / 2, K.track);
        if (ratio > 0) rr(ctx, x, y, Math.max(h, Math.round(w * clamp01(ratio))), h, h / 2, col);
    }
    const done = b => b._baseTexture.update();
    // text at a mock-up's point: y is the middle of the line ("lm"), or with o.top the top of its letters ("la"); o.align left /
    // right / center at x; o.face bold / regular / sc (none: the game's Medium); o.max: shortened with "…" to fit. Returns its width.
    function tx(b, text, x, y, size, o) {
        o = o || {};
        const kind = o.face || null;
        text = o.max ? CH.fit(String(text), size, o.max, kind) : String(text);
        const h = Math.ceil(size * 1.5), cy = o.top ? y + size * 0.45 : y, w = measure(text, size, kind), align = o.align || "left";
        const bx = align === "right" ? x - w - 8 : align === "center" ? x - (w + 8) / 2 : x;
        textOut(b, text, Math.round(bx), Math.round(cy - h / 2), w + 8, h, align === "left" ? "left" : align === "right" ? "right" : "center",
            { size, face: kind, color: o.color || K.text, plain: true });
        return w;
    }
    // a key: a light rounded cap with its letter (x its left, cy its middle); returns its width
    function keycap(b, x, cy, label, o) {
        o = o || {};
        const h = o.h || 34, size = o.size || 22, w = Math.max(h, measure(label, size, "bold") + 18);
        rr(b.context, x, cy - h / 2, w, h, o.r || 7, o.fill || K.cap);
        textOut(b, label, Math.round(x), Math.round(cy - h / 2 + 1), w, h, "center", { size, face: "bold", color: o.ink || K.sel, plain: true });
        return w;
    }
    // small keycaps in a row (the bag's question): returns the x where they end
    function smallKeys(b, x, y, pairs) {
        for (const [k, lab] of pairs) {
            const kw = Math.max(24, measure(k, 16) + 14);
            CH.rpanel(b.context, x, y, kw, 24, 5, { fill: "rgba(28,29,33,0.92)", shadow: 0 });
            textOut(b, k, x, y, kw, 24, "center", { size: 16, plain: true });
            if (lab) textOut(b, lab, x + kw + 7, y, measure(lab, 16) + 8, 24, "left", { size: 16, color: "#d8d2c6", plain: true });
            x += kw + (lab ? measure(lab, 16) + 26 : 8);
        }
        return x;
    }
    const smallKeysWidth = pairs => pairs.reduce((a, [k, lab]) => a + Math.max(24, measure(k, 16) + 14) + (lab ? measure(lab, 16) + 26 : 8), 0) - 26;
    // a group's heading: copper capitals, a count, a thin line to x1; returns the x where the line starts
    function heading(b, x, y, s, x1, n) {
        let x2 = x + tx(b, s, x, y, 20, { top: true, face: "sc", color: K.acc }) + 10;
        if (n !== undefined && n !== null && n !== "") x2 += tx(b, String(n), x2, y + 1, 19, { top: true, color: K.muted }) + 12;
        if (x1 && x1 > x2) hl(b.context, x2, x1, y + 12);
        return x2;
    }
    // the page's head strip (under the tabs): its word in copper capitals on the left (none: the page puts its own things there), a word
    // on the right, the line under them
    // (the view's name is not written: the tab above already says it - the user, 2026-10-23; title kept for the callers' clarity)
    function header(b, title, note) {
        const R = RX();
        if (note) tx(b, note, R.rx, R.y0 + 54, 19, { top: true, align: "right", color: K.dim });
        hl(b.context, R.x0 + 30, R.x1 - 30, R.y0 + 90);
    }
    const STRIP_TOP = 39;   // (tabStrip's top in the head strip, from RX().y0)
    // the sections' names as tabs in ONE row in the head, right of the title (the user, 2026-10-22: "przy dzienniku niech widać nazwy
    // tych zakładek i można je w lewo i prawo", then "niech to będzie jeden wiersz, część będzie niewidoczna, ale się przewija"): the
    // chosen one copper; what does not fit is hidden behind "‹" / "›" and the row slides along with A / D (st.first: the first tab
    // shown, kept between the draws so the row moves only as far as needed). Returns the boxes for the mouse: { i } a tab, { dir } an arrow.
    function tabStrip(b, names, cur, x0, x1, top, st) {
        const gap = 6, pad = 13, size = 18, h = 30, aw = 22, y = top + 9, n = names.length;
        const w = names.map((s, i) => measure(s, size, i === cur ? "bold" : null) + pad * 2);
        const sum = (a, z) => { let s = 0; for (let i = a; i <= z; i++) s += w[i] + (i > a ? gap : 0); return s; };
        let first = 0, last = n - 1, left = x0, room = x1 - x0;
        if (sum(0, n - 1) > room) {
            room -= aw * 2;
            left = x0 + aw;
            first = Math.max(0, Math.min(st && st.first || 0, cur, n - 1));
            while (first < cur && sum(first, cur) > room) first++;
            last = first;
            while (last + 1 < n && sum(first, last + 1) <= room) last++;
            // (room left at the end: show more from the front instead)
            while (first > 0 && sum(first - 1, last) <= room) first--;
        }
        if (st) st.first = first;
        const boxes = [], cy = y + h / 2;
        let x = left;
        for (let i = first; i <= last; i++) {
            const on = i === cur;
            rr(b.context, x, y, w[i], h, 7, on ? K.acc : K.cell);
            tx(b, names[i], x + w[i] / 2, cy + 1, size, { align: "center", face: on ? "bold" : null, color: on ? K.sel : K.muted });
            boxes.push({ i, x0: x, x1: x + w[i], y0: y, y1: y + h });
            x += w[i] + gap;
        }
        if (first > 0) {
            tx(b, "‹", x0 + aw / 2, cy, 26, { align: "center", face: "bold", color: K.acc });
            boxes.push({ dir: -1, x0: x0, x1: x0 + aw, y0: y, y1: y + h });
        }
        if (last < n - 1) {
            tx(b, "›", x1 - aw / 2, cy, 26, { align: "center", face: "bold", color: K.acc });
            boxes.push({ dir: 1, x0: x1 - aw, x1: x1, y0: y, y1: y + h });
        }
        return boxes;
    }
    const inBox = (q, x, y) => !!q && x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1;
    // a tick / a cross (the font has no ✓)
    function tick(ctx, x, cy, ok) {
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = ok ? K.good : K.warn;
        ctx.beginPath();
        if (ok) { ctx.moveTo(x, cy); ctx.lineTo(x + 4, cy + 5); ctx.lineTo(x + 12, cy - 5); }
        else { ctx.moveTo(x + 1, cy - 5); ctx.lineTo(x + 11, cy + 5); ctx.moveTo(x + 11, cy - 5); ctx.lineTo(x + 1, cy + 5); }
        ctx.stroke();
        ctx.restore();
    }
    // a speech-bubble of the menu (the user, 2026-10-23: "popup ... co dokładnie daje", "w ekwipunku też popup z opisem"): a dark panel,
    // a copper edge, a small arrow to what it speaks of. arrow: { side: "left" | "right" | "up" | "down", at: x or y of its tip's line }
    function bubble(ctx, x, y, w, h, arrow) {
        const fill = "rgba(14,15,18,0.98)", r = 10, a = 10, s = 9;
        let tri = null;
        if (arrow) {
            const at = Math.max((arrow.side === "left" || arrow.side === "right" ? y : x) + r + s, Math.min((arrow.side === "left" || arrow.side === "right" ? y + h : x + w) - r - s, arrow.at));
            if (arrow.side === "left") tri = [[x, at - s], [x - a, at], [x, at + s]];
            else if (arrow.side === "right") tri = [[x + w, at - s], [x + w + a, at], [x + w, at + s]];
            else if (arrow.side === "up") tri = [[at - s, y], [at, y - a], [at + s, y]];
            else tri = [[at - s, y + h], [at, y + h + a], [at + s, y + h]];
        }
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = fill;
        CH.roundPath(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.shadowColor = "rgba(0,0,0,0)";
        ctx.strokeStyle = K.acc;
        ctx.lineWidth = 1.5;
        CH.roundPath(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
        ctx.stroke();
        if (tri) {   // (the arrow: filled, its two outer sides copper, the edge under its base covered)
            ctx.beginPath(); ctx.moveTo(tri[0][0], tri[0][1]); ctx.lineTo(tri[1][0], tri[1][1]); ctx.lineTo(tri[2][0], tri[2][1]); ctx.closePath();
            ctx.fill();
            ctx.beginPath(); ctx.moveTo(tri[0][0], tri[0][1]); ctx.lineTo(tri[1][0], tri[1][1]); ctx.lineTo(tri[2][0], tri[2][1]);
            ctx.stroke();
            const [p, q] = [tri[0], tri[2]];
            if (p[0] === q[0]) ctx.fillRect(p[0] + (arrow.side === "left" ? -0.5 : -2), p[1] + 1.5, 2.5, q[1] - p[1] - 3);
            else ctx.fillRect(p[0] + 1.5, p[1] + (arrow.side === "up" ? -0.5 : -2), q[0] - p[0] - 3, 2.5);
        }
        ctx.restore();
    }
    // the hero's head and shoulders for "Postać" (his dressed walking sheet - HeroLook.js, Ubior.js: 64 x 64 cells)
    let heroIconKept = { key: "", bmp: null };
    function heroIcon(size) {
        const HL = window.HeroLook, look = HL && HL.active && HL.active();
        const name = look ? "Hero_Walk" : $gamePlayer.characterName(), idx = $gamePlayer.characterIndex(), src = ImageManager.loadCharacter(name);
        if (!src.isReady()) return null;
        const U = window.Ubior, key = name + ":" + idx + ":" + size + ":" + (U && U.liveKey ? U.liveKey(name) : "");
        if (heroIconKept.key === key && heroIconKept.bmp) return heroIconKept.bmp;   // (drawn again only when the outfit changes)
        const b = new Bitmap(size, size);
        heroIconKept = { key, bmp: b };
        b.context.imageSmoothingEnabled = false;
        if (/^Hero_/.test(name)) b.blt(src, 16, 2, 32, 32, 0, 0, size, size);
        else {
            const big = ImageManager.isBigCharacter(name), pw = src.width / (big ? 3 : 12), ph = src.height / (big ? 4 : 8);
            const sx = (big ? 0 : (idx % 4) * 3) * pw + pw, sy = (big ? 0 : Math.floor(idx / 4) * 4) * ph;
            b.blt(src, sx + pw * 0.15, sy, pw * 0.7, ph * 0.7, 0, 0, size, size);
        }
        return b;
    }
    function entryIcon(e) {
        if (e.icon === "hero") return heroIcon(32);
        if (Array.isArray(e.icon)) return CH.iconBitmap(e.icon[0], e.icon[1]);
        return null;
    }
    // a list window drawn flat: no cursor frame, no scroll arrows - the chosen row is painted (bg: { on, off } the fill when it has the
    // keys / not; rect(w, i) the row's whole rect when itemRect is only a part of it; repaint: the whole list drawn again on a change)
    function flatRows(w, bg) {
        w.refreshCursor = function() { this.setCursorRect(0, 0, 0, 0); };
        w.drawItemBackground = function(i) {
            if (!bg || i !== this.index()) return;
            const fill = this.active ? bg.on : bg.off;
            if (!fill) return;
            const r = bg.rect ? bg.rect(this, i) : this.itemRect(i);
            rr(this.contents.context, r.x, r.y + 1, r.width, r.height - 2, 8, fill);
            done(this.contents);
        };
        const again = (win, was, now) => {
            if (!win.contents) return;
            if (bg && bg.repaint) { win.paint(); return; }
            for (const k of [was, now]) if (k >= 0 && k < win.maxItems()) win.redrawItem(k);
        };
        const sel = w.select;
        w.select = function(i) {
            const was = this.index();
            sel.call(this, i);
            if (was !== i) again(this, was, i);
        };
        const act = w.activate, deact = w.deactivate;
        w.activate = function() { const was = this.active; act.call(this); if (!was) again(this, -1, this.index()); };
        w.deactivate = function() { const was = this.active; deact.call(this); if (was) again(this, -1, this.index()); };
    }

    // a list window only as tall as its whole rows (no row cut in half at the foot)
    function fitRows(win) {
        const ih = win.itemHeight(), inner = win.height - win.padding * 2, n = Math.max(1, Math.floor(inner / ih));
        if (n * ih === inner) return;
        win.move(win.x, win.y, win.width, n * ih + win.padding * 2);
        win.createContents();
    }
    // how many rows of a list lie below its bottom edge; "▾ jeszcze N niżej" under it
    function moreBelow(win) {
        const ih = win.itemHeight(), vis = Math.floor(win.innerHeight / ih), top = Math.floor((win.scrollY() + 1) / ih);
        return Math.max(0, win.maxItems() - top - vis);
    }
    function drawMore(b, win, cx) {
        const n = moreBelow(win);
        if (n) tx(b, "▾  jeszcze " + n + " niżej", cx, win.y + win.height + 4, 19, { align: "center", color: K.muted });
    }

    // ==================================================================
    // A page: its own sprites (in `root`) and the game's windows it uses (flat, on the right panel). Outside (the list has the keys)
    // it is a preview; inside it has the keys.
    // ==================================================================
    function View(scene, def) {
        this.scene = scene;
        this.def = def;
        this.inside = false;
        this.root = new Sprite();
        this.root.visible = false;
        this.windows = [];
        scene._viewLayer.addChild(this.root);
    }
    View.prototype.layer = function() { const s = new Sprite(new Bitmap(W(), H())); this.root.addChild(s); return s; };
    View.prototype.addWindow = function(w, main) {
        w.opacity = 0;
        w.frameVisible = false;
        w.updateArrows = function() { this.downArrowVisible = false; this.upArrowVisible = false; };   // (the page says what is below)
        // (the window's inner clip in the screen's pixels: RMMZ takes it unscaled - the menu is shown at UI.s, so the clip is scaled too,
        // else a row under the list's foot shows through)
        w._updateFilterArea = function() {
            const wt = this._clientArea.worldTransform, pos = wt.apply(new Point(0, 0)), f = this._clientArea.filterArea;
            f.x = pos.x + this.origin.x * wt.a;
            f.y = pos.y + this.origin.y * wt.d;
            f.width = this.innerWidth * wt.a;
            f.height = this.innerHeight * wt.d;
        };
        w.hide();
        w.deactivate();
        this.scene.addWindow(w);
        this.windows.push(w);
        // P in a page's list: back to the menu's list (the window has played the sound)
        if (w.setHandler && main !== false) w.setHandler("cancel", () => this.scene.onViewCancel(true));
        return w;
    };
    View.prototype.show = function() {
        this.root.visible = true;
        for (const w of this.windows) if (!w._viewHidden) w.show();
        this.refresh();
    };
    View.prototype.hide = function() {
        if (this.inside) this.exit(true);
        this.root.visible = false;
        for (const w of this.windows) { w.hide(); w.deactivate(); }
        this.leave();
    };
    View.prototype.setAlpha = function(a) {
        this.root.alpha = a;
        for (const w of this.windows) w.contentsOpacity = Math.round(255 * a);
    };
    View.prototype.enter = function() { this.inside = true; this.activate(); this.redraw(); };
    View.prototype.exit = function(quiet) { this.inside = false; this.leave(); this.blur(); if (!quiet) this.redraw(); };
    View.prototype.blur = function() { for (const w of this.windows) w.deactivate(); };
    View.prototype.refresh = function() { this.redraw(); };
    View.prototype.redraw = function() {};
    View.prototype.activate = function() {};
    View.prototype.leave = function() {};
    View.prototype.update = function() {};
    View.prototype.keys = function() { return [["P", "wróć"]]; };
    View.prototype.cancel = function() { return false; };   // (true: a smaller step of the page went back itself)
    View.prototype.spriteInput = function() { return !this.windows.some(w => w.active); };   // (no window has the keys: the scene's P)
    View.prototype.touch = function() {};
    View.prototype.info = function() { return {}; };
    View.prototype.ready = function() { return this.inside && this.root.visible && this.scene.inputReady() && this.scene._levelT !== Graphics.frameCount; };
    // the mouse moved since the last look (a row under it gets chosen only then)
    View.prototype.mouseMoved = function() {
        const mx = TouchInput.x, my = TouchInput.y, first = this._mx === undefined, moved = mx !== this._mx || my !== this._my;
        this._mx = mx;
        this._my = my;
        return moved && !first;
    };

    // ==================================================================
    // Postać (lista_v2_glowne.png): the bust, the name, the level, the needs, the purse, the debt, the opinion; the attributes, the fight
    // ==================================================================
    function PostacView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._focus = 0;
    }
    PostacView.prototype = Object.create(View.prototype);
    PostacView.prototype.constructor = PostacView;
    const attrIds = () => { const Cb = T.api("Combat"); return Cb && Cb.ATTRS ? Cb.ATTRS.map(a => a.id) : []; };
    // the places of Postać on the wide panel: the bust, beside it who he is (iw wide), the fight on the right; under them the attributes
    // (cw2 wide) and what keeps him whole (ODPORNOŚCI) - the chosen attribute's bubble lies over the latter
    const PA = () => {
        const R = RX(), ya = R.y0 + 392, cx = R.lx + 256, iw = Math.min(560, R.rx - cx - 320), cw2 = Math.min(440, Math.floor((R.rx - R.lx - 50) / 2));
        return { ya, cw2, cx, iw, fx: cx + iw + 40, dx: R.lx + cw2 + 60, rowY: i => ya + 32 + i * 30 };
    };
    PostacView.prototype.keys = function() {
        const xp = heroXp(), out = [["W/S", "atrybut"]];
        if (xp && xp.points > 0) out.push(["O", "dodaj punkt"]);
        out.push(["P", "wróć"]);
        return out;
    };
    function drawBust(b, x, y, w, h) {
        const name = T.ui && T.ui.heroBust ? T.ui.heroBust() : "Hero_Bust", src = T.ui && T.ui.loadBust ? T.ui.loadBust(name) : ImageManager.loadPicture(name), ctx = b.context;
        if (!src || (src.isError && src.isError())) return true;
        if (!src.isReady()) return false;
        const img = src._canvas || src._image, k = h / src.height, bw = src.width * k;
        ctx.save();
        CH.roundPath(ctx, x, y, w, h, 12);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        if (img) ctx.drawImage(img, 0, 0, src.width, src.height, x + (w - bw) / 2, y, bw, h);
        ctx.restore();
        return true;
    }
    PostacView.prototype.fightRows = function() {
        const Cb = T.api("Combat"), fi = Cb && Cb.fightInfo ? Cb.fightInfo() : null, de = Cb && Cb.defenseInfo ? Cb.defenseInfo() : null;
        if (!fi || !de) return [];
        const wp = fi.weapon, block = Math.min(0.9, (de.shield ? de.shield.reduce : de.bare) + de.blockPerk);
        return [["Broń", fi.ranged ? wp.name : wp.id ? wp.name : "pięści"], fi.ranged ? ["Strzał", String(wp.shot)] : ["Cios", String(wp.hit)],
            ["Zasięg", fi.ranged ? wp.range + " pól" : num1(wp.reach)], ["Zbroja", de.armor ? "−" + pctTxt(de.armor.reduce) : "brak"], ["Blok", pctTxt(block)]];
    };
    // what keeps him whole (Combat.defenseInfo - only what is worn counts)
    PostacView.prototype.defenseRows = function() {
        const Cb = T.api("Combat"), de = Cb && Cb.defenseInfo ? Cb.defenseInfo() : null;
        if (!de) return [];
        return [["Życie (najwięcej)", String(de.mhp)], ["Oddech", String(de.breath)], ["Szansa na ranę", pctTxt(de.wound) + " zwykłej"],
            ["Próg przewrócenia", String(de.knock)], ["Zimno", de.cloak ? "płaszcz: nie marzniesz" : de.cold > 0 ? "marzniesz słabiej (−" + pctTxt(Math.min(1, de.cold)) + ")" : "bez płaszcza marzniesz"]];
    };
    PostacView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX(), xp = heroXp(), Cb = T.api("Combat"), pts = xp ? xp.points : 0;
        b.clear();
        header(b, "Postać", this.inside ? (pts > 0 ? pts + " " + plural(pts, "punkt", "punkty", "punktów") + " do rozdania" : "") : "podgląd");
        // ---- the bust
        const lx = R.lx, bw = 230, bh = 262, by = R.y0 + 106;
        rr(ctx, lx, by, bw, bh, 12, K.panel2);
        this._bustOk = drawBust(b, lx, by, bw, bh);
        // ---- the name, the level and its bar
        const pa = PA(), cx = pa.cx, w = pa.iw, actor = $gameParty.leader(), name = actor ? actor.name() : "";
        let y = R.y0 + 108;
        tx(b, name, cx, y, 34, { top: true, face: "bold" });
        if (xp) tx(b, "Poziom " + xp.level, cx + measure(name, 34, "bold") + 14, y + 11, 22, { top: true, face: "bold", color: K.acc });
        y += 48;
        if (xp) {
            meter(ctx, cx, y, w - 150, 8, xp.ratio, K.acc);
            tx(b, xp.top ? "najwyższy poziom" : xp.xp + " / " + xp.need + " dośw.", cx + w, y + 4, 19, { align: "right", color: K.muted });
        }
        y += 22 + 12;
        // ---- the four needs, two by two
        const cw = (w - 28) / 2;
        needRows().forEach(([key, lab, v, val], k) => {
            const nx = cx + (k % 2) * (cw + 28), ny = y + Math.floor(k / 2) * 48, [icon, mode] = CH.NEED_ICONS[key];
            CH.drawIcon(b, icon, nx - 4, ny - 4, 32, mode);
            tx(b, lab, nx + 34, ny + 4, 21, { top: true });
            tx(b, val, nx + cw, ny + 4, 21, { top: true, face: "bold", align: "right", color: v < 0.25 ? K.warn : K.text });
            meter(ctx, nx + 34, ny + 30, cw - 34, 6, v, NEED_COL[key]);
        });
        y += 96 + 10;
        // ---- the purse, grandpa's debt, the town's opinion
        const d = debtInfo(), op = opinionInfo(), cw3 = w / 3;
        let dLab = "Dług dziadka", dVal = "-", dSub = "", dWarn = false;
        if (d && d.lost) {
            dLab = "Odkup działki";
            dVal = d.done ? "odkupiona" : (d.debt - d.paid) + " G";
            dSub = d.done ? "" : d.days > 1 ? "wynieś: " + d.days + " dni" : d.days === 1 ? "wynieś: dziś" : "bez terminu";
            dWarn = !d.done && d.days >= 1;
        } else if (d) {
            dVal = d.done ? "spłacony" : (d.debt - d.paid) + " G";
            dSub = d.done ? "" : d.days > 1 ? "zostało " + d.days + " " + plural(d.days, "dzień", "dni", "dni") : d.days === 1 ? "dziś termin" : "do świtu";
            dWarn = !d.done && d.days <= 5;
        }
        // (the opinion: only its word - "Obcy", "Bywalec"... - the user, 2026-10-23: "wystarczy napis Obcy")
        const cols = [["Sakiewka", $gameParty.gold() + " G", K.gold, ""], [dLab, dVal, d && d.done ? K.good : K.text, dSub],
            ["Opinia", op ? op.tier || String(op.value) : "-", K.text, ""]];
        cols.forEach(([lab, val, col, sub], k) => {
            const xx = cx + k * cw3;
            tx(b, lab, xx, y, 19, { top: true, color: K.muted });
            tx(b, val, xx, y + 24, 24, { top: true, face: "bold", color: col, max: cw3 - 8 });
            if (sub) tx(b, sub, xx, y + 54, 18, { top: true, color: k === 1 && dWarn ? K.warn : K.muted, max: cw3 - 6 });
        });
        // ---- the attributes, the fight (top right), what keeps him whole
        hl(ctx, R.x0 + 30, R.x1 - 30, pa.ya - 12);
        heading(b, lx, pa.ya, "ATRYBUTY", lx + pa.cw2 - (pts > 0 ? 120 : 0));
        if (pts > 0) tx(b, pts + " do rozdania", lx + pa.cw2, pa.ya, 19, { top: true, align: "right", color: K.acc });
        const ids = attrIds();
        ids.forEach((id, i) => {
            const a = Cb.ATTRS[i], ry = pa.rowY(i), on = this.inside && i === this._focus;
            if (on) rr(ctx, lx - 8, ry - 4, pa.cw2 + 16, 30, 8, K.acc);
            tx(b, a.name, lx, ry, 23, { top: true, color: on ? K.sel : K.text });
            tx(b, String(xp ? xp.attr[id] || 0 : 0), lx + pa.cw2, ry, 23, { top: true, face: "bold", align: "right", color: on ? K.sel : K.text });
            if (pts > 0 && (xp.attr[id] || 0) < (Cb.ATTR_MAX || 60)) {   // (a "+" while there are points to give)
                const px = lx + pa.cw2 - 52;
                rr(ctx, px, ry, 22, 22, 5, on ? K.sel : K.accDim);
                tx(b, "+", px + 11, ry + 11, 19, { face: "bold", align: "center", color: on ? K.acc : K.text });
            }
        });
        const fx = pa.fx, fw = R.rx - fx, fy = R.y0 + 108;
        heading(b, fx, fy, "WALKA", R.rx);
        this._fight = this.fightRows();
        this._fight.forEach(([lab, val], i) => {
            const ry = fy + 32 + i * 30;
            tx(b, lab, fx, ry, 22, { top: true, color: K.muted });
            tx(b, val, R.rx, ry, 22, { top: true, face: "bold", align: "right", max: fw - 90 });
        });
        const dx = pa.dx, dw = Math.min(560, R.rx - dx);
        heading(b, dx, pa.ya, "ODPORNOŚCI", dx + dw);
        this._defense = this.defenseRows();
        this._defense.forEach(([lab, val], i) => {
            const ry = pa.rowY(i);
            tx(b, lab, dx, ry, 22, { top: true, color: K.muted, max: dw - 200 });
            tx(b, val, dx + dw, ry, 22, { top: true, face: "bold", align: "right", max: 260 });
        });
        this._popup = this.inside && ids[this._focus] ? this.drawPopup(b, ids[this._focus], pa.rowY(this._focus) + 11) : null;
        done(b);
    };
    // the chosen attribute's bubble beside its row (over the fight's column): what it gives now and with one point more - the same
    // numbers the fight and the work use (Combat.attrInfo)
    PostacView.prototype.drawPopup = function(b, id, rowCy) {
        const Cb = T.api("Combat"), info = Cb && Cb.attrInfo ? Cb.attrInfo(id) : null;
        if (!info) return null;
        const R = RX(), pa = PA(), ctx = b.context, x = R.lx + pa.cw2 + 26, w = Math.min(600, R.rx + 10 - x), pad = 14, iw = w - pad * 2;
        const desc = wrapWords(info.desc, 17, iw, "regular").slice(0, 2), top = !info.rows.length || !info.rows[0].next;
        const h = pad + 28 + desc.length * 21 + 8 + 20 + info.rows.length * 23 + 10;
        // (in the lower half only: the purse, the debt and the opinion over it stay seen)
        const y = Math.max(Math.min(pa.ya - 20, R.y1 - 8 - h), Math.min(R.y1 - 8 - h, Math.round(rowCy - h / 2)));
        bubble(ctx, x, y, w, h, { side: "left", at: rowCy });
        let yy = y + pad;
        const nw = tx(b, info.name, x + pad, yy, 22, { top: true, face: "bold" });
        tx(b, info.value + " / " + info.max, x + pad + nw + 12, yy + 4, 18, { top: true, color: K.acc });
        yy += 28;
        for (const line of desc) { tx(b, line, x + pad, yy, 17, { top: true, face: "regular", color: K.muted }); yy += 21; }
        yy += 8;
        const cNow = x + w - pad - 120, cNext = x + w - pad;
        tx(b, "TERAZ", cNow, yy, 16, { top: true, face: "sc", color: K.muted, align: "right" });
        tx(b, top ? "NAJWYŻEJ" : "+1 PUNKT", cNext, yy, 16, { top: true, face: "sc", color: K.acc, align: "right" });
        yy += 20;
        const rows = [];
        for (const r of info.rows) {
            tx(b, r.label, x + pad, yy, 18, { top: true, color: K.soft, max: cNow - 70 - (x + pad) });
            tx(b, r.now, cNow, yy, 18, { top: true, face: "bold", align: "right" });
            tx(b, r.next || "—", cNext, yy, 18, { top: true, face: "bold", align: "right", color: r.next && r.next !== r.now ? K.acc : K.dim });
            rows.push(r.label + ": " + r.now + (r.next ? " -> " + r.next : ""));
            yy += 23;
        }
        return { attr: id, name: info.name, x, y, w, h, rows };
    };
    PostacView.prototype.update = function() {
        if (!this._bustOk && this.root.visible && ++this._bustT % 10 === 0) this.redraw();   // (the bust still loading)
        if (!this.ready()) return;
        const n = attrIds().length;
        if (this.mouseMoved()) { const p = touchAt(), k = this.rowAt(p.x, p.y); if (k >= 0 && k !== this._focus) { this._focus = k; this.redraw(); } }
        if (n && (Input.isRepeated("down") || Input.isRepeated("up"))) {
            this._focus = (this._focus + (Input.isRepeated("down") ? 1 : n - 1)) % n;
            SoundManager.playCursor();
            this.redraw();
        } else if (Input.isTriggered("ok")) this.spend();
    };
    PostacView.prototype._bustT = 0;
    PostacView.prototype.rowAt = function(x, y) {
        const R = RX(), pa = PA();
        if (x < R.lx - 8 || x > R.lx + pa.cw2 + 8) return -1;
        for (let i = 0; i < attrIds().length; i++) { const ry = pa.rowY(i); if (y >= ry - 4 && y < ry + 26) return i; }
        return -1;
    };
    // O (or a click on the chosen one): a point to the chosen attribute, while there are points
    PostacView.prototype.spend = function() {
        const Cb = T.api("Combat"), xp = heroXp(), id = attrIds()[this._focus], add = {};
        if (!id) return;
        add[id] = 1;
        if (Cb && xp && xp.points > 0 && Cb.spendPoints && Cb.spendPoints(add)) {
            AudioManager.playSe({ name: "Item3", volume: 70, pitch: 110, pan: 0 });
            this.redraw();
            this.scene.drawKeys();
            this.scene.drawList();
        } else SoundManager.playBuzzer();
    };
    PostacView.prototype.touch = function(x, y) {
        const k = this.rowAt(x, y);
        if (k < 0) return;
        if (k !== this._focus) { this._focus = k; SoundManager.playCursor(); this.redraw(); }
        else this.spend();
    };
    PostacView.prototype.leave = function() { this._mx = undefined; };
    PostacView.prototype.info = function() {
        const ids = attrIds(), xp = heroXp();
        const op = opinionInfo();
        return { stats: { focus: this.inside ? ids[this._focus] || null : null, points: xp ? xp.points : 0, plus: !!(xp && xp.points > 0), xp,
            fight: (this._fight || []).map(r => r[0] + ": " + r[1]), defense: (this._defense || []).map(r => r[0] + ": " + r[1]), bust: !!this._bustOk,
            popup: this._popup || null, opinion: op ? op.tier : null } };
    };

    // ==================================================================
    // Ekwipunek (lista_v2_ekwipunek.png, _wybor.png): the hero big between two grids of places, the chosen place's card, RAZEM
    // ==================================================================
    const GRID_L = [["head", "torso"], ["hands", "belt"], ["legs", "feet"]];
    const GRID_R = [["cloak", "back"], ["right", "left"], ["extra", null]];
    const EQ = { cell: 72, px: 88, py: 100, gy: 134 };
    const SLOT_PLACE = { head: "glowa", torso: "tors", legs: "nogi", feet: "stopy", belt: "pas", hands: "rece", back: "plecy" };
    const BARE = { head: "głowa zostaje odkryta", cloak: "bez płaszcza", torso: "bez niczego na grzbiecie", hands: "gołe ręce", belt: "bez pasa",
        legs: "bez spodni", feet: "boso", back: "nic na plecach", left: "wolna ręka", extra: "nic" };
    const TURN = [["przód", 0], ["bok", 2], ["tył", 4], ["bok", 6]];   // (Hero_Walk's rows: S, W, N, E)
    function eqCells() {
        const R = RX(), gy = R.y0 + EQ.gy, gxR = R.rx - (2 * EQ.cell + 16), out = [];
        GRID_L.forEach((row, r) => row.forEach((id, c) => { if (id) out.push({ id, g: 0, r, c, x: R.lx + c * EQ.px, y: gy + r * EQ.py }); }));
        GRID_R.forEach((row, r) => row.forEach((id, c) => { if (id) out.push({ id, g: 1, r, c, x: gxR + c * EQ.px, y: gy + r * EQ.py }); }));
        return out;
    }
    // the figure: the sheet's 64 x 64 cell 5 x (2026-10-23: the card under it gone - its words are in the bubbles now - the hero bigger)
    // (head: the rows over the cell where a helmet's crown goes - Ubior.js's strip over the head, 2026-10-23; the figure's bitmap is
    // that much taller upward, the feet stay where they were)
    const FIG = { scale: 5, size: 320, feet: 61, head: 12 };
    const figPlace = () => { const R = RX(), gy = R.y0 + EQ.gy; return { cx: Math.round((R.lx + 2 * EQ.cell + 16 + R.rx - (2 * EQ.cell + 16)) / 2), top: gy - 42 }; };
    const EQB = { w: 330, band: 56 };   // (the bubble's width; RAZEM's band at the foot)
    // what the worn things give, summed (Combat_Fight's armour, the cloak, Ubior_Sklepy's clothes, the backpack, the boots)
    function totals() {
        const Cb = T.api("Combat"), US = T.api("Ubior_Sklepy"), E = T.api("Equipment"), S = T.api("Survival");
        const worn = id => !!(E && E.worn && E.worn(id));
        const ar = Cb && Cb.armor ? Cb.armor() : null;
        const cold = US && US.bonus ? US.bonus("cold") : 0;
        const load = (US && US.udzwig ? US.udzwig() : 0) + (worn(114) ? (S && S.WEIGHT_CAP_BACKPACK) || 80 : 0);
        const neat = US && US.schludnosc ? US.schludnosc() : 0;
        const walk = (US && US.predkosc ? US.predkosc() : 0) + (worn(113) && S && S.BOOTS_SPEED ? S.BOOTS_SPEED - 1 : 0);
        return [["Zbroja", ar ? "−" + pctTxt(ar.reduce) : "brak"], ["Ciepło", worn(112) ? "pełne" : cold > 0 ? "+" + pctTxt(cold) : "brak"],
            ["Udźwig", load ? "+" + load : "brak"], ["Schludność", neat ? "+" + neat : "brak"], ["Chód", walk > 0.001 ? "+" + pctTxt(walk) : "brak"]];
    }
    function EquipView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._fig = new Sprite(new Bitmap(FIG.size, FIG.size + FIG.head * FIG.scale));
        this._fig.bitmap.smooth = false;
        this.root.addChild(this._fig);
        this._cell = "head";
        this._mode = "cells";
        this._row = 0;
        this._rows = [];
        this._dir = 0;
        this._note = "";
        this._figKey = "";
        this._pv = { key: "", bmp: null, ok: false };
    }
    EquipView.prototype = Object.create(View.prototype);
    EquipView.prototype.constructor = EquipView;
    EquipView.prototype.keys = function() {
        if (this._mode === "list") return [["W/S", "rzecz"], ["O", "załóż"], ["P", "wróć do miejsc"]];
        return [["W/S/A/D", "miejsce"], ["O", "wybierz"], ["X", "zdejmij"], ["Tab", "obróć"], ["P", "wróć"]];
    };
    EquipView.prototype.cur = function() { return eqCells().find(c => c.id === this._cell) || eqCells()[0]; };
    EquipView.prototype.slotDef = function(id) { const E = T.api("Equipment"); return E ? E.SLOTS.find(s => s.id === (id || this._cell)) || {} : {}; };
    // what the chosen place can take from the bag (worn marked), and "Nic" (the right hand: the fists are among them)
    EquipView.prototype.makeRows = function() {
        const E = T.api("Equipment"), S = T.api("Survival"), slot = this._cell;
        if (!E) return [];
        const rows = E.choices(slot).map(c => Object.assign({ act: "on", weight: c.id && item(c.id) && S && S.itemWeight ? S.itemWeight(item(c.id)) : 0 }, c));
        if (slot !== "right") {
            const torch = slot === "left" && E.current("left") === E.TORCH;
            rows.push({ act: "off", id: 0, name: "Nic", icon: 0, note: torch ? "pochodnię wbijesz w ziemię" : BARE[slot] || "nic", worn: !E.current(slot), weight: 0 });
        }
        return rows;
    };
    // the look the figure shows: the row chosen in the list tried on (the thing's pattern on its place; "Nic" - that place bare)
    EquipView.prototype.previewOver = function() {
        if (this._mode !== "list") return null;
        const r = this._rows[this._row], place = SLOT_PLACE[this._cell], U = window.Ubior;
        if (!r || !place || !U || !U.itemLook) return null;
        if (r.act === "off") return { [place]: "" };
        const look = r.id ? U.itemLook(r.id) : null;
        return look ? { [look.miejsce || place]: look.wzor } : null;
    };
    EquipView.prototype.turnIndex = function() { return this._mode === "list" && this._cell === "back" ? 2 : this._dir; };   // (Plecy: from behind)
    EquipView.prototype.refresh = function() { this._mode = "cells"; this._note = ""; this.redraw(); };
    EquipView.prototype.leave = function() { this._mode = "cells"; this._note = ""; this._mx = undefined; };
    EquipView.prototype.cancel = function() {
        if (this._mode !== "list") return false;
        SoundManager.playCancel();
        this._mode = "cells";
        this.redraw();
        return true;
    };
    // the figure: the cell of his walking sheet (dressed live by Ubior.js, or the look tried on) copied 4 x into its own bitmap
    EquipView.prototype.updateFigure = function(force) {
        const s = this._fig, U = window.Ubior, HL = window.HeroLook, hero = !HL || !HL.active || HL.active(), row = TURN[this.turnIndex()][1], fp = figPlace(), S = FIG.size;
        const H0 = FIG.head * FIG.scale;   // (over the cell: the helmet's crown)
        s.x = fp.cx - S / 2;
        s.y = fp.top - H0;
        let src = null, key = "", srcBmp = null;
        const over = hero ? this.previewOver() : null;
        if (over && U && U.tryOn) {
            const pk = JSON.stringify(over);
            if (this._pv.key !== pk || !this._pv.ok) {
                const cv = U.tryOn("Hero_Walk", over);
                this._pv.key = pk;
                this._pv.ok = !!cv;
                this._pv.cv = cv;
            }
            if (this._pv.ok) { src = this._pv.cv; key = "p:" + pk; }
        }
        if (!src) {
            const name = hero ? "Hero_Walk" : $gamePlayer.characterName(), bmp = ImageManager.loadCharacter(name);
            if (!bmp.isReady()) { this._figKey = ""; return; }
            src = bmp._canvas || bmp._image;
            srcBmp = bmp;
            key = "l:" + name + ":" + (U && U.liveKey ? U.liveKey(name) : "") + ":" + (bmp._ubiorDressed ? 1 : 0);
            if (!hero) {   // (the old hero: his character's standing frame, as big as fits)
                const big = ImageManager.isBigCharacter(name), idx = $gamePlayer.characterIndex(), pw = bmp.width / (big ? 3 : 12), ph = bmp.height / (big ? 4 : 8);
                const sx = (big ? 0 : (idx % 4) * 3) * pw + pw, sy = (big ? 0 : Math.floor(idx / 4) * 4) * ph + [0, 1, 3, 2][this._dir] * ph;
                key += ":" + this._dir;
                if (!force && key === this._figKey) return;
                const b = s.bitmap, ctx = b.context, k = Math.min(S / pw, S / ph);
                b.clear();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(src, sx, sy, pw, ph, (S - pw * k) / 2, H0 + S - ph * k, pw * k, ph * k);
                done(b);
                this._figKey = key;
                return;
            }
        }
        key += ":" + row;
        if (!force && key === this._figKey) return;
        const b = s.bitmap, ctx = b.context;
        b.clear();
        ctx.imageSmoothingEnabled = false;
        // (with what is over his head: Ubior.cellWithHead - the cell and the strip over it)
        const whole = src && U && U.cellWithHead ? U.cellWithHead(srcBmp || src, "Hero_Walk", 0, row) : null;
        if (whole) ctx.drawImage(whole, 0, 0, whole.width, whole.height, 0, H0 - (whole.height - 64) * FIG.scale, S, whole.height * FIG.scale);
        else if (src) ctx.drawImage(src, 0, row * 64, 64, 64, 0, H0, S, S);
        done(b);
        this._figKey = key;
    };
    EquipView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX(), E = T.api("Equipment");
        b.clear();
        const list = this._mode === "list";
        header(b, "Ekwipunek", list ? "podgląd: tak będziesz wyglądać" : "działa tylko to, co założone");
        if (!E) { tx(b, "Ekwipunek się wczytuje...", R.lx, R.y0 + 130, 21, { top: true, color: K.muted }); done(b); return; }
        const slots = {};
        for (const sl of E.slots()) slots[sl.id] = sl;
        this._slots = slots;
        if (list) this._rows = this.makeRows();
        const row = list ? this._rows[this._row] : null, focus = this.inside && !list;
        // ---- the two grids
        const cells = eqCells(), gy = R.y0 + EQ.gy, gxR = R.rx - (2 * EQ.cell + 16);
        tx(b, "UBIÓR", R.lx, gy - 34, 20, { top: true, face: "sc", color: K.acc });
        tx(b, "OKRYCIE I RĘCE", gxR + 2 * EQ.cell + 16, gy - 34, 20, { top: true, face: "sc", color: K.acc, align: "right" });
        for (const c of cells) {
            const sl = slots[c.id] || {}, on = c.id === this._cell, has = !!sl.icon && !(c.id === "right" && sl.hand === "m0");
            const fill = on ? (focus ? K.acc : this.inside || list ? K.accDim : K.accDim) : has ? K.cell : K.empty;
            rr(ctx, c.x, c.y, EQ.cell, EQ.cell, 11, fill);
            const tryIcon = on && row && row.icon && !row.worn ? row.icon : 0;
            if (tryIcon) CH.drawIcon(b, tryIcon, c.x + 4, c.y + 4, 64, null, 0.55);   // (the thing being chosen, on trial)
            else if (has) CH.drawIcon(b, sl.icon, c.x + 4, c.y + 4, 64);
            else if (on && row && row.act === "off") { /* ("Nic": the place stays empty) */ }
            else tx(b, "–", c.x + EQ.cell / 2, c.y + EQ.cell / 2, 26, { align: "center", color: on && focus ? K.sel : K.dim });
            tx(b, sl.label || c.id, c.x + EQ.cell / 2, c.y + EQ.cell + 12, 19, { align: "center", face: on ? "bold" : null, color: on ? K.acc : has ? K.text : K.muted });
        }
        // ---- the figure, its shadow, the turn's dots (and, among the places, its word)
        const fp = figPlace(), feet = fp.top + FIG.feet * FIG.scale;
        rr(ctx, fp.cx - 72, feet - 6, 144, 18, 9, "rgba(0,0,0,0.35)");
        this.updateFigure(true);
        const ti = this.turnIndex(), py = feet + 28;
        for (let k = 0; k < 4; k++) rr(ctx, fp.cx - 33 + k * 22 - 5, py - 5, 10, 10, 5, k === ti ? K.acc : "rgb(70,72,78)");
        if (!list) tx(b, TURN[ti][0], fp.cx, py + 22, 19, { align: "center", color: K.muted });
        // ---- the band RAZEM at the foot and the bubble of the chosen place; or the list of what fits it with the chosen thing's bubble
        this._bubble = null;
        if (list) this.drawRows(b, py + 30);
        else {
            this.drawTotals(b, R.y1 - EQB.band);
            if (this.inside) this._bubble = this.drawSlotBubble(b, slots[this._cell] || {});
        }
        done(b);
    };
    // what a thing is and does, for its bubble: [{ t: text, c: colour, f: face, s: size }] lines, the wear, the weight
    EquipView.prototype.thingWords = function(id, sl, row, bw) {
        const D = T.api("Durability"), S = T.api("Survival"), it = id ? item(id) : null, iw = (bw || EQB.w) - 32, out = [];
        const desc = it ? String(it.description || "").replace(/\s+/g, " ").trim() : sl && sl.hand === "m0" ? "Gołe pięści: szybkie, ale słabe. Broń wybierasz też w trybie walki ([ ])." : "";
        for (const line of wrapWords(desc, 17, iw, "regular").slice(0, 4)) out.push({ t: line, c: K.soft, f: "regular", s: 17 });
        const does = cap1(row ? row.note || "" : (sl && sl.note) || "");
        if (does) for (const line of wrapWords(does, 18, iw).slice(0, 3)) out.push({ t: line, c: K.good, s: 18 });
        let wear = null;
        if (id && D && D.TOOLS && D.TOOLS[id] && D.lifeOf) {
            const left = Math.max(0, Math.round(D.left(id))), life = D.lifeOf(id), unit = D.TOOLS[id].unit === "wear" ? "dni" : D.unitWord ? D.unitWord(id, left) : "";
            wear = { left, life, text: left + " / " + life + (unit ? " " + unit : "") };
        }
        const weight = it && S && S.itemWeight ? S.itemWeight(it) : 0;
        return { lines: out, wear, weight };
    };
    // the bubble: a caption, the icon and the name, the lines, the wear (a bar) and the weight; o: { x, w, arrow, place (y) }
    function thingBubble(b, o, cap, icon, name, words, note) {
        const ctx = b.context, pad = 16, iw = o.w - pad * 2;
        const lines = words.lines.slice(), noteLines = note ? wrapWords(note, 18, iw).slice(0, 2) : [];
        const h = pad + 22 + 38 + lines.reduce((a, l) => a + (l.s || 18) + 5, 0) + (words.wear ? 42 : 0) + (words.weight ? 26 : 0) + noteLines.length * 23 + pad - 2;
        const y = o.place(h), x = o.x;
        bubble(ctx, x, y, o.w, h, o.arrow(y, h));
        let yy = y + pad;
        tx(b, cap, x + pad, yy, 16, { top: true, face: "sc", color: K.acc, max: iw });
        yy += 22;
        if (icon) CH.drawIcon(b, icon, x + pad, yy, 32);
        tx(b, name, x + pad + (icon ? 42 : 0), yy + 16, 22, { face: "bold", color: icon ? K.text : K.muted, max: iw - (icon ? 42 : 0) });
        yy += 38;
        for (const l of lines) { tx(b, l.t, x + pad, yy, l.s || 18, { top: true, face: l.f || null, color: l.c || K.text }); yy += (l.s || 18) + 5; }
        if (words.wear) {
            yy += 4;
            tx(b, "Zużycie", x + pad, yy, 17, { top: true, color: K.muted });
            tx(b, words.wear.text, x + o.w - pad, yy, 17, { top: true, face: "bold", align: "right" });
            const r = words.wear.left / Math.max(1, words.wear.life);
            meter(ctx, x + pad, yy + 24, iw, 6, r, r > 0.5 ? K.good : r > 0.2 ? K.amber : K.warn);
            yy += 38;
        }
        if (words.weight) {
            tx(b, "Waga", x + pad, yy, 17, { top: true, color: K.muted });
            tx(b, weightTxt(words.weight), x + o.w - pad, yy, 17, { top: true, face: "bold", align: "right" });
            yy += 26;
        }
        for (const l of noteLines) { tx(b, l, x + pad, yy, 18, { top: true, color: K.warn }); yy += 23; }
        return { x, y, w: o.w, h, title: name, lines: lines.map(l => l.t), wear: words.wear ? words.wear.text : "", weight: words.weight || 0, note: note || "" };
    }
    // the chosen place's bubble: beside its cell, between its grid and the hero (on a narrow panel: under the cell, above it at the
    // foot, on the grid's outer side) - the hero stays clear
    EquipView.prototype.drawSlotBubble = function(b, sl) {
        const R = RX(), c = this.cur(), E = T.api("Equipment"), slot = this._cell, hand = slot === "right" || slot === "left";
        const fp = figPlace(), body = 84, gl = R.lx + 2 * EQ.cell + 16, gxR = R.rx - (2 * EQ.cell + 16), bottomMax = R.y1 - EQB.band - 8;
        const sideW = Math.min(EQB.w, c.g === 0 ? fp.cx - body - 12 - (gl + 14) : gxR - 14 - (fp.cx + body + 12));
        const has = !!sl.name, id = sl.item || 0, bw = sideW >= 250 ? sideW : EQB.w;
        let words;
        if (has) words = this.thingWords(id, sl, null, bw);
        else {
            const own = E ? E.choices(slot).filter(ch => !ch.worn).map(ch => ch.name) : [];
            const hint = own.length ? "W torbie: " + own.join(", ") + ". O: wybierz." : cap1(String(sl.note || "").replace(/Enter/g, "O")) || "Nic tu nie masz.";
            const more = !own.length ? String(T.call("Ubior_Data", "podpowiedz", slot) || "") : "";
            const lines = wrapWords(hint, 18, bw - 32).slice(0, 3).map(t => ({ t, c: own.length ? K.soft : K.muted }));
            for (const t of wrapWords(more, 17, bw - 32, "regular").slice(0, 3)) lines.push({ t, c: K.muted, f: "regular", s: 17 });
            words = { lines, wear: null, weight: 0 };
        }
        const cap = (sl.label || "").toUpperCase() + "  ·  " + (has ? (hand ? "W RĘCE" : "NA SOBIE") : "PUSTO");
        const name = has ? sl.name : "pusto", icon = sl.icon || 0;
        if (sideW >= 250) {   // (beside the cell, the arrow at its middle)
            const x = c.g === 0 ? gl + 14 : gxR - 14 - sideW, cy = c.y + EQ.cell / 2;
            return thingBubble(b, { x, w: sideW, place: h => Math.max(R.y0 + 96, Math.min(bottomMax - h, Math.round(cy - h / 2))),
                arrow: () => ({ side: c.g === 0 ? "left" : "right", at: cy }) }, cap, icon, name, words, this._note);
        }
        const x = c.g === 0 ? R.lx - 8 : R.rx + 8 - EQB.w, ax = c.x + EQ.cell / 2;
        let below = true;
        return thingBubble(b, { x, w: EQB.w,
            place: h => { const yb = c.y + EQ.cell + 30; if (yb + h <= bottomMax) return yb; below = false; return Math.max(R.y0 + 96, c.y - 12 - h); },
            arrow: () => ({ side: below ? "up" : "down", at: ax }) }, cap, icon, name, words, this._note);
    };
    EquipView.prototype.drawTotals = function(b, y) {
        const ctx = b.context, R = RX(), lx = R.lx, rx = R.rx, items = totals();
        rr(ctx, lx - 8, y, rx - lx + 16, 50, 10, K.panel2);
        tx(b, "RAZEM", lx + 6, y + 25, 19, { face: "sc", color: K.acc });
        const widths = items.map(([a, v]) => measure(a, 20) + 8 + measure(v, 22, "bold"));
        let x = lx + 96;
        const gap = (rx - 10 - x - widths.reduce((s, w) => s + w, 0)) / (items.length - 1);
        items.forEach(([lab, val], i) => {
            tx(b, lab, x, y + 26, 20, { color: K.muted });
            tx(b, val, x + measure(lab, 20) + 8, y + 26, 22, { face: "bold", color: val === "brak" ? K.dim : K.text });
            x += widths[i] + gap;
        });
        this._totals = items;
    };
    // the list under the figure: what fits the chosen place (3 rows seen, more scroll); the chosen thing's bubble over the other grid
    // (the one the chosen place is not in), its arrow down to the list
    const EQL = { vis: 3, row: 36, head: 30 };
    EquipView.prototype.drawRows = function(b, yl) {
        const ctx = b.context, R = RX(), lx = R.lx, rx = R.rx, rows = this._rows, label = (this.slotDef().label || "").toUpperCase();
        const more = rows.length > EQL.vis;
        this._listY = yl;
        heading(b, lx, yl, label + "  ·  Z TORBY", more ? rx - 80 : rx);
        const top = Math.max(0, Math.min(this._row - EQL.vis + 1, rows.length - EQL.vis));
        this._rowTop = top;
        if (more) tx(b, (top + 1) + "–" + Math.min(rows.length, top + EQL.vis) + " z " + rows.length, rx, yl, 17, { top: true, align: "right", color: K.muted });
        rows.slice(top, top + EQL.vis).forEach((r, k) => {
            const i = top + k, y = yl + EQL.head + k * EQL.row, on = i === this._row, cy = y + 17;
            if (on) rr(ctx, lx - 8, y, rx - lx + 16, 34, 8, K.acc);
            if (r.icon) CH.drawIcon(b, r.icon, lx, y + 1, 32);
            else tx(b, "–", lx + 16, cy, 24, { align: "center", color: on ? K.sel : K.dim });
            tx(b, r.name, lx + 44, cy, 21, { face: "bold", color: on ? K.sel : K.text, max: 300 });
            const note = (r.worn && r.act !== "off" ? "założone · " : "") + (r.note || "");
            tx(b, note, lx + 360, cy, 19, { color: on ? K.selMuted : K.muted, max: rx - 90 - (lx + 360) });
            if (r.weight) tx(b, "waga " + weightTxt(r.weight), rx, cy, 19, { align: "right", color: on ? K.selMuted : K.muted });
        });
        const r = rows[this._row];
        if (!r || !this.inside) return;
        const c = this.cur(), x = c.g === 0 ? R.rx + 8 - EQB.w : R.lx - 8;
        const words = r.act === "off" ? { lines: [{ t: cap1(r.note || ""), c: K.soft }], wear: null, weight: 0 } : this.thingWords(r.id, null, r);
        const cap = label + "  ·  " + (r.act === "off" ? "NIC" : r.worn ? "NA SOBIE" : "Z TORBY");
        this._bubble = thingBubble(b, { x, w: EQB.w, place: h => Math.max(R.y0 + 96, yl - 14 - h),
            arrow: () => ({ side: "down", at: c.g === 0 ? x + EQB.w - 60 : x + 60 }) }, cap, r.icon || 0, r.name, words, this._note);
    };
    EquipView.prototype.update = function() {
        if (this.root.visible && (Graphics.frameCount % 6 === 0 || !this._figKey)) this.updateFigure(false);
        if (!this.ready()) return;
        if (this.mouseMoved() && this._mode === "cells") {
            const p = touchAt(), c = this.cellAt(p.x, p.y);
            if (c && c.id !== this._cell) { this._cell = c.id; this._note = ""; this.redraw(); }
        }
        if (this._mode === "list") {
            const n = this._rows.length;
            if (n && (Input.isRepeated("down") || Input.isRepeated("up"))) {
                this._row = (this._row + (Input.isRepeated("down") ? 1 : n - 1)) % n;
                SoundManager.playCursor();
                this.redraw();
            } else if (Input.isTriggered("ok")) this.choose();
            return;
        }
        for (const [k, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
            if (Input.isRepeated(k)) { this.move(dx, dy); return; }
        }
        if (Input.isTriggered("ok")) this.openList();
        else if (Input.isTriggered("takeOff")) this.takeOff();
        else if (Input.isTriggered("tab")) this.turn();
    };
    EquipView.prototype.cellAt = function(x, y) { return eqCells().find(c => x >= c.x - 6 && x <= c.x + EQ.cell + 6 && y >= c.y - 4 && y <= c.y + EQ.cell + 24) || null; };
    // W / S in the grid's column, A / D across it - and from one grid to the other on the same row
    EquipView.prototype.move = function(dx, dy) {
        const cells = eqCells(), cur = this.cur();
        let to = null;
        if (dy) to = cells.find(c => c.g === cur.g && c.c === cur.c && c.r === cur.r + dy);
        else {
            let g = cur.g, c = cur.c + dx;
            if (c > 1) { g++; c = 0; } else if (c < 0) { g--; c = 1; }
            if (g === 0 || g === 1) to = cells.find(x => x.g === g && x.c === c && x.r === cur.r);
        }
        if (!to) return;
        this._cell = to.id;
        this._note = "";
        SoundManager.playCursor();
        this.redraw();
    };
    EquipView.prototype.turn = function() {
        this._dir = (this._dir + 1) % TURN.length;
        SoundManager.playCursor();
        this.redraw();
    };
    EquipView.prototype.openList = function() {
        const E = T.api("Equipment"), rows = this.makeRows(), things = rows.filter(r => r.act !== "off");
        if (!E || (!things.length && !E.current(this._cell))) {
            SoundManager.playBuzzer();
            const def = this.slotDef();
            this._note = def.items && !def.items.length && !def.hand ? "W grze nie ma jeszcze nic na tę część ciała." : "Nie masz w torbie nic, co tu pasuje.";
            this.redraw();
            return;
        }
        SoundManager.playOk();
        this._mode = "list";
        this._rows = rows;
        const worn = rows.findIndex(r => r.worn && r.act !== "off");
        this._row = worn >= 0 ? worn : 0;
        this._note = "";
        this.redraw();
        this.scene.drawKeys();
    };
    EquipView.prototype.choose = function() {
        const E = T.api("Equipment"), r = this._rows[this._row], slot = this._cell;
        if (!r || !E) { SoundManager.playBuzzer(); return; }
        let ok = true;
        if (r.act === "off") ok = E.current(slot) ? E.unequip(slot) : true;
        else if (!r.worn) ok = E.equip(slot, r.id, r.hand);
        if (ok) { if (!r.worn || r.act === "off") SoundManager.playEquip(); else SoundManager.playOk(); this._note = ""; }
        else { SoundManager.playBuzzer(); this._note = "Tego nie da się teraz założyć."; }
        this._mode = "cells";
        this.redraw();
        this.scene.drawKeys();
    };
    // X: what is on the chosen place comes off (the right hand: back to the fists)
    EquipView.prototype.takeOff = function() {
        const E = T.api("Equipment"), slot = this._cell, now = E ? E.current(slot) : 0;
        if (E && now && E.unequip(slot)) { SoundManager.playEquip(); this._note = ""; }
        else { SoundManager.playBuzzer(); this._note = "Tu nic nie ma do zdjęcia."; }
        this.redraw();
    };
    EquipView.prototype.touch = function(x, y) {
        const R = RX(), yl = this._listY || 0;
        if (this._mode === "list") {
            const k = Math.floor((y - (yl + EQL.head)) / EQL.row), i = (this._rowTop || 0) + k;
            if (x >= R.lx - 8 && x <= R.rx + 8 && k >= 0 && k < EQL.vis && i < this._rows.length) {
                if (i === this._row) this.choose(); else { this._row = i; SoundManager.playCursor(); this.redraw(); }
                return;
            }
            const c = this.cellAt(x, y);
            if (c) { this._mode = "cells"; this._cell = c.id; SoundManager.playCancel(); this.redraw(); this.scene.drawKeys(); }
            return;
        }
        const c = this.cellAt(x, y);
        if (c) {
            if (c.id === this._cell) this.openList();
            else { this._cell = c.id; this._note = ""; SoundManager.playCursor(); this.redraw(); }
            return;
        }
        const fp = figPlace();
        if (x >= fp.cx - 100 && x <= fp.cx + 100 && y >= fp.top && y <= fp.top + FIG.size) this.turn();   // (a click on the figure turns him)
    };
    EquipView.prototype.info = function() {
        const E = T.api("Equipment");
        return { equip: { cell: this._cell, mode: this._mode, row: this._row, note: this._note, dir: this._dir, turn: TURN[this.turnIndex()][0],
            rows: this._mode === "list" ? this._rows.map(r => ({ act: r.act, id: r.id, name: r.name, worn: !!r.worn, weight: r.weight || 0 })) : [],
            preview: this.previewOver(), figKey: this._figKey, totals: (this._totals || []).map(t => t.join(": ")), bubble: this._bubble || null,
            list: this._mode === "list" ? { y: (this._listY || 0) + EQL.head, row: EQL.row, top: this._rowTop || 0, x: RX().lx + 200 } : null,
            slots: E ? E.slots().map(x => ({ id: x.id, item: x.item, name: x.name, none: x.none })) : null, cells: eqCells().map(c => c.id) } };
    };

    // ==================================================================
    // Umiejętności (the user, 2026-10-23: "umiejętności bym zrobił drzewko jak w oryginalnym podejściu" - Combat_UI's Window_SkillTree,
    // the old Postać -> Umiejętności): the fields' row in the head strip (A / D), the chosen field's tree - boxes in rows by the level
    // they ask ("poz. 1 / 4 / 10..." on the left), joined by the lines of what opens what -, the words on the right. Two steps, O in and
    // P back: O from the tabs - the fields' row has the keys (the tree a preview, the words about the field); O again - into the tree
    // (W / S / A / D along the boxes, O learns after a question); P - back to the fields' row; P again - back to the tabs.
    // A box: copper filled - known (at the top rank), brown with a copper edge - learnt in part, a copper edge - can be learnt, dim -
    // closed; its small bars are the ranks. The rows, the columns and the boxes come from the trees' data (Combat.SKILLS / TREES).
    // ==================================================================
    function skillState(Cb, s) {
        const rank = Cb.skillRank(s.id), block = Cb.skillBlock(s.id);
        if (rank >= s.ranks) return "full";
        if (rank > 0) return "part";
        return !block || block === "Brak punktów umiejętności." ? "open" : "locked";
    }
    const SKT = { label: 56, padX: 16, nodeH: 56 };
    function SkillsView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._tree = 0;
        this._zone = "fields";
        this._node = 0;
        this._last = {};   // (the box chosen last in each field)
        this._ask = null;
        this._tabBoxes = null;
    }
    SkillsView.prototype = Object.create(View.prototype);
    SkillsView.prototype.constructor = SkillsView;
    SkillsView.prototype.trees = function() { const Cb = T.api("Combat"); return Cb && Cb.TREES ? Cb.TREES : []; };
    SkillsView.prototype.list = function() {
        const Cb = T.api("Combat"), t = this.trees()[this._tree];
        if (!Cb || !t) return [];
        return Cb.SKILLS.filter(s => s.tree === t.id).slice().sort((a, b) => a.row - b.row || a.col - b.col);
    };
    // the grid every tree shares (the most rows and columns of all), so a field's tree never jumps in size
    SkillsView.prototype.grid = function() {
        const Cb = T.api("Combat"), all = Cb && Cb.SKILLS ? Cb.SKILLS : [];
        const rows = Math.max(1, (Cb && Cb.ROW_LEVEL ? Cb.ROW_LEVEL.length : 0), ...all.map(s => s.row + 1));
        return { rows, cols: Math.max(1, ...all.map(s => s.col + 1)) };
    };
    // the places: the tree on the left (56% of the page), the words on the right
    SkillsView.prototype.geom = function() {
        const R = RX(), tw = Math.round((R.rx - R.lx) * 0.56), top = R.y0 + 100, dx = R.lx + tw + 34;
        return { x0: R.lx, w: tw, top, h: R.y1 - 14 - top, dx, dw: R.rx - dx };
    };
    SkillsView.prototype.cell = function(g, row, col) {
        const G = this.grid(), pitchX = (g.w - SKT.label) / G.cols, pitchY = g.h / G.rows;
        const w = Math.round(Math.min(126, pitchX - SKT.padX)), h = Math.round(Math.min(SKT.nodeH, pitchY - 18));
        return { x: Math.round(g.x0 + SKT.label + col * pitchX + (pitchX - w) / 2), y: Math.round(g.top + row * pitchY + (pitchY - h) / 2), w, h };
    };
    SkillsView.prototype.keys = function() {
        if (this._ask) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", "nie"]];
        if (this._zone === "tree") return [["W/S/A/D", "umiejętność"], ["O", "naucz się"], ["P", "wróć"]];
        return [["A/D", "dziedzina"], ["O", "drzewko"], ["P", "wróć"]];
    };
    SkillsView.prototype.enter = function() { this._zone = "fields"; this._ask = null; View.prototype.enter.call(this); };
    SkillsView.prototype.leave = function() { this._ask = null; this._zone = "fields"; this._mx = undefined; };
    // P: the question first, then out of the tree onto the fields' row; on the row - not here (back to the tabs)
    SkillsView.prototype.cancel = function() {
        if (this._ask) { SoundManager.playCancel(); this._ask = null; this.redraw(); return true; }
        if (this._zone === "tree") {
            SoundManager.playCancel();
            this._last[this._tree] = this._node;
            this._zone = "fields";
            this.redraw();
            return true;
        }
        return false;
    };
    SkillsView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX(), Cb = T.api("Combat"), trees = this.trees(), t = trees[this._tree];
        b.clear();
        header(b, null);   // (the head strip: the fields' row - the page's own, no second row of the frame)
        if (!Cb || !t) { tx(b, "Drzewka umiejętności nie są dostępne.", R.lx, R.y0 + 130, 21, { top: true, color: K.muted }); done(b); return; }
        const h = Cb.hero(), pw = measure("Punkty: " + h.skillPoints, 19, "bold") + 30;
        this._tabBoxes = tabStrip(b, trees.map(x => x.name), this._tree, R.lx - 6, R.rx - pw, R.y0 + STRIP_TOP, this._tabScroll || (this._tabScroll = {}));
        tx(b, "Punkty: " + h.skillPoints, R.rx, R.y0 + 55, 19, { top: true, face: "bold", align: "right", color: h.skillPoints > 0 ? K.acc : K.muted });
        const g = this.geom(), list = this.list();
        this._node = Math.max(0, Math.min(this._node, list.length - 1));
        this.drawTree(b, g, list);
        vl(ctx, g.dx - 17, R.y0 + 108, R.y1 - 24);
        const sk = this._zone === "tree" ? list[this._node] : null;
        if (sk) this.drawDetail(b, sk, t, g); else this.drawField(b, t, g, list);
        if (this._ask && sk) this.drawAsk(b, sk, g);
        done(b);
    };
    SkillsView.prototype.drawTree = function(b, g, list) {
        const ctx = b.context, Cb = T.api("Combat"), h = Cb.hero(), G = this.grid(), focus = this.inside && this._zone === "tree";
        // the level each row asks, on the left
        for (let r = 0; r < G.rows; r++) {
            const c = this.cell(g, r, 0), cy = c.y + c.h / 2, lv = (Cb.ROW_LEVEL && Cb.ROW_LEVEL[r]) || 1, ok = h.level >= lv;
            tx(b, "poz.", g.x0 + SKT.label - 12, cy - 10, 16, { align: "right", color: ok ? K.muted : "#8a5a52" });
            tx(b, String(lv), g.x0 + SKT.label - 12, cy + 9, 18, { align: "right", face: "bold", color: ok ? K.text : "#c47a6e" });
        }
        // the lines from what opens to what is opened (right angles, the turn just above the box it leads to)
        const r0 = this.cell(g, 0, 0), r1 = this.cell(g, Math.min(1, G.rows - 1), 0), half = Math.max(4, Math.round((r1.y - (r0.y + r0.h)) / 2));
        ctx.save();
        ctx.lineWidth = 2;
        for (const s of list) {
            for (const f of s.from || []) {
                const p = list.find(n => n.id === f);
                if (!p) continue;
                const a = this.cell(g, p.row, p.col), c = this.cell(g, s.row, s.col), open = Cb.skillRank(f) > 0;
                ctx.strokeStyle = open && Cb.skillRank(s.id) > 0 ? K.acc : open ? "rgba(236,230,218,0.55)" : "rgba(90,95,105,0.75)";
                const x1 = Math.round(a.x + a.w / 2) + 0.5, y1 = a.y + a.h, x2 = Math.round(c.x + c.w / 2) + 0.5, my = c.y - half + 0.5;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, my); ctx.lineTo(x2, my); ctx.lineTo(x2, c.y); ctx.stroke();
            }
        }
        ctx.restore();
        // the boxes
        this._cells = [];
        list.forEach((s, i) => {
            const c = this.cell(g, s.row, s.col), st = skillState(Cb, s), rank = Cb.skillRank(s.id), on = focus && i === this._node;
            if (on) { ctx.save(); ctx.strokeStyle = K.cap; ctx.lineWidth = 3; CH.roundPath(ctx, c.x - 4.5, c.y - 4.5, c.w + 9, c.h + 9, 11); ctx.stroke(); ctx.restore(); }
            rr(ctx, c.x, c.y, c.w, c.h, 8, st === "full" ? K.acc : st === "part" ? K.accDim : st === "open" ? K.cell : K.empty);
            if (st !== "full") {
                ctx.save();
                ctx.strokeStyle = st === "locked" ? K.line : K.acc;
                ctx.lineWidth = st === "open" ? 2 : st === "part" ? 1.5 : 1;
                CH.roundPath(ctx, c.x + 0.75, c.y + 0.75, c.w - 1.5, c.h - 1.5, 8);
                ctx.stroke();
                ctx.restore();
            }
            const ink = st === "full" ? K.sel : st === "locked" ? K.dim : K.text, lines = wrapWords(s.name, 16, c.w - 8).slice(0, 2);
            const ty = c.y + (c.h - 8) / 2 - (lines.length - 1) * 8.5;
            lines.forEach((line, k) => tx(b, line, c.x + c.w / 2, ty + k * 17, 16, { align: "center", face: on ? "bold" : null, color: ink, max: c.w - 6 }));
            const pw = 9, gap = 3, total = s.ranks * pw + (s.ranks - 1) * gap, px = c.x + Math.round((c.w - total) / 2), py = c.y + c.h - 8;
            for (let k = 0; k < s.ranks; k++) {
                ctx.fillStyle = k < rank ? (st === "full" ? K.sel : K.acc) : st === "locked" ? "#2a2d33" : "#4a4e57";
                ctx.fillRect(px + k * (pw + gap), py, pw, 4);
            }
            this._cells.push({ i, id: s.id, x0: c.x, x1: c.x + c.w, y0: c.y, y1: c.y + c.h });
        });
    };
    // the words of the field (on the fields' row): its name, the ranks taken, what it is about, what is known in it
    SkillsView.prototype.drawField = function(b, t, g, list) {
        const R = RX(), Cb = T.api("Combat"), dx = g.dx, dw = g.dw, trees = this.trees();
        const spent = list.reduce((a, s) => a + Cb.skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
        tx(b, "DZIEDZINA " + (this._tree + 1) + " Z " + trees.length, dx, R.y0 + 110, 18, { top: true, face: "sc", color: K.acc });
        tx(b, t.name, dx, R.y0 + 134, 28, { top: true, face: "bold", max: dw });
        tx(b, "stopni " + spent + " / " + total, dx, R.y0 + 172, 19, { top: true, color: K.muted });
        let y = R.y0 + 208;
        for (const line of wrapWords(t.desc || "", 20, dw, "regular").slice(0, 5)) { tx(b, line, dx, y, 20, { top: true, face: "regular" }); y += 27; }
        y += 14;
        heading(b, dx, y, "UMIESZ", dx + dw);
        y += 32;
        const known = list.filter(s => Cb.skillRank(s.id) > 0);
        if (!known.length) { tx(b, "Jeszcze nic z tej dziedziny.", dx, y, 19, { top: true, color: K.muted }); y += 28; }
        for (const s of known.slice(0, 6)) {
            tx(b, s.name, dx, y, 19, { top: true, color: K.acc, max: dw - 60 });
            tx(b, s.ranks > 1 ? Cb.skillRank(s.id) + "/" + s.ranks : "znasz", dx + dw, y, 19, { top: true, align: "right", color: K.muted });
            y += 27;
        }
        const open = list.filter(s => !Cb.skillBlock(s.id) && Cb.skillRank(s.id) < s.ranks).length;
        tx(b, open ? "Możesz się teraz nauczyć: " + open + "." : "Teraz nic tu do nauki.", dx, R.y1 - 70, 19, { top: true, color: open ? K.acc : K.muted, max: dw });
        if (this.inside) tx(b, "O: wejdź w drzewko", dx, R.y1 - 42, 19, { top: true, face: "bold", color: K.soft });
    };
    // the words of the chosen box: its name, its rank, what it does now and at the next rank, what it asks (✓ / ×)
    SkillsView.prototype.drawDetail = function(b, sk, t, g) {
        const ctx = b.context, R = RX(), Cb = T.api("Combat"), h = Cb.hero(), dx = g.dx, dw = g.dw;
        const rank = Cb.skillRank(sk.id), st = skillState(Cb, sk), full = rank >= sk.ranks, lv = (Cb.ROW_LEVEL && Cb.ROW_LEVEL[sk.row]) || 1, block = Cb.skillBlock(sk.id);
        const word = st === "full" ? (sk.ranks > 1 ? "stopień " + rank + " z " + sk.ranks : "znasz") : st === "part" ? "stopień " + rank + " z " + sk.ranks : st === "open" ? "do nauki" : "zamknięta";
        tx(b, (t.name + "  ·  " + word).toUpperCase(), dx, R.y0 + 110, 18, { top: true, face: "sc", color: K.acc, max: dw });
        let y = R.y0 + 134;
        wrapWords(sk.name, 26, dw, "bold").slice(0, 2).forEach(line => { tx(b, line, dx, y, 26, { top: true, face: "bold" }); y += 30; });
        y += 10;
        const para = (text, col, max) => { for (const line of wrapWords(text, 20, dw, "regular").slice(0, max || 6)) { tx(b, line, dx, y, 20, { top: true, face: "regular", color: col || K.text }); y += 27; } };
        heading(b, dx, y, rank > 0 ? "TERAZ" : sk.ranks > 1 ? "PIERWSZY STOPIEŃ" : "CO DAJE", dx + dw);
        y += 30;
        para(Cb.skillText(sk, Math.max(1, rank)), K.text, 5);
        if (rank > 0 && !full) {
            y += 8;
            heading(b, dx, y, "NASTĘPNY STOPIEŃ", dx + dw);
            y += 30;
            para(Cb.skillText(sk, rank + 1), K.acc, 3);
        }
        y += 10;
        if (y < R.y1 - 140) {
            heading(b, dx, y, "WYMAGANIA", dx + dw);
            y += 30;
            const rows = [];
            if (lv > 1) rows.push([h.level >= lv, "Poziom " + lv + " (masz " + h.level + ")"]);
            if (sk.from && sk.from.length) rows.push([sk.from.some(f => Cb.skillRank(f) > 0), "Najpierw: " + sk.from.map(f => (Cb.SKILLS.find(x => x.id === f) || { name: f }).name).join(" albo ")]);
            for (const a of Cb.ATTRS) if (sk.attr && sk.attr[a.id]) rows.push([(h.attr[a.id] || 0) >= sk.attr[a.id], a.name + " " + sk.attr[a.id] + " (masz " + (h.attr[a.id] || 0) + ")"]);
            if (!full) rows.push([h.skillPoints >= 1, "1 punkt umiejętności (masz " + h.skillPoints + ")"]);
            if (!rows.length) rows.push([true, "brak"]);
            for (const [ok, text] of rows) {
                if (y > R.y1 - 74) break;
                tick(ctx, dx + 2, y + 10, ok);
                tx(b, text, dx + 24, y + 10, 19, { color: ok ? K.text : K.muted, max: dw - 24 });
                y += 27;
            }
        }
        const hint = full ? (sk.ranks > 1 ? "Masz najwyższy stopień - działa zawsze." : "Znasz ją - działa zawsze, bez żadnego klawisza.")
            : block ? block : "O: " + (rank ? "następny stopień" : "naucz się") + " (1 punkt)";
        tx(b, hint, dx, R.y1 - 42, 19, { top: true, face: full || !block ? "bold" : null, color: full || !block ? K.acc : K.muted, max: dw });
    };
    SkillsView.prototype.drawAsk = function(b, sk, g) {
        const ctx = b.context, R = RX(), dx = g.dx, dw = g.dw, Cb = T.api("Combat"), y = R.y1 - 176, rank = Cb.skillRank(sk.id);
        rr(ctx, dx - 16, y, dw + 32, 152, 12, "rgba(12,13,16,0.97)");
        const q = (rank ? "Następny stopień: " : "Nauczyć się: ") + sk.name + (sk.ranks > 1 ? " (" + (rank + 1) + "/" + sk.ranks + ")" : "") + "?";
        let yy = y + 16;
        wrapWords(q, 22, dw, "bold").slice(0, 2).forEach(line => { tx(b, line, dx, yy, 22, { top: true, face: "bold" }); yy += 27; });
        tx(b, "Kosztuje 1 punkt. Tego nie da się cofnąć.", dx, y + 74, 18, { top: true, color: K.muted, max: dw });
        const bw = (dw - 12) / 2;
        this._askBoxes = [];
        [["yes", "Tak"], ["no", "Nie"]].forEach(([act, lab], k) => {
            const bx = dx + k * (bw + 12), on = (act === "yes") === this._ask.yes;
            rr(ctx, bx, y + 104, bw, 36, 8, on ? K.acc : K.cell);
            tx(b, lab, bx + bw / 2, y + 122, 21, { face: "bold", align: "center", color: on ? K.sel : K.text });
            this._askBoxes.push({ act, x0: bx, x1: bx + bw, y0: y + 104, y1: y + 140 });
        });
    };
    SkillsView.prototype.changeTree = function(dir) {
        const n = this.trees().length;
        if (!n || !dir) return;
        if (this._zone === "tree") this._last[this._tree] = this._node;
        this._tree = ((this._tree + dir) % n + n) % n;
        this._zone = "fields";
        this._node = this._last[this._tree] || 0;
        SoundManager.playCursor();
        this.redraw();
        this.scene.drawKeys();
    };
    // O on the fields' row: into the tree (on the box chosen last there, else the first that can be learnt, else the first)
    SkillsView.prototype.enterTree = function(at) {
        const Cb = T.api("Combat"), list = this.list();
        if (!list.length) { SoundManager.playBuzzer(); return; }
        const learn = list.findIndex(s => !Cb.skillBlock(s.id) && Cb.skillRank(s.id) < s.ranks);
        this._node = at !== undefined ? at : this._last[this._tree] !== undefined ? this._last[this._tree] : Math.max(0, learn);
        this._zone = "tree";
        SoundManager.playOk();
        this.redraw();
        this.scene.drawKeys();
    };
    // W / S / A / D in the tree: the nearest box that way (the nearest row first going up / down, the nearest column going sideways)
    SkillsView.prototype.moveTo = function(dx, dy) {
        const list = this.list(), cur = list[this._node];
        if (!cur) return;
        let best = -1, bestD = Infinity;
        list.forEach((s, i) => {
            const ddx = s.col - cur.col, ddy = s.row - cur.row;
            if (i === this._node || (dx && Math.sign(ddx) !== dx) || (dy && Math.sign(ddy) !== dy)) return;
            const d = dx ? Math.abs(ddx) + Math.abs(ddy) * 3 : Math.abs(ddy) * 3 + Math.abs(ddx);
            if (d < bestD) { bestD = d; best = i; }
        });
        if (best < 0) return;
        this._node = best;
        SoundManager.playCursor();
        this.redraw();
    };
    SkillsView.prototype.update = function() {
        if (!this.ready()) return;
        if (this._ask) {
            if (Input.isRepeated("left") || Input.isRepeated("right")) { this._ask.yes = !this._ask.yes; SoundManager.playCursor(); this.redraw(); }
            else if (Input.isTriggered("ok")) this.answer(this._ask.yes);
            return;
        }
        if (this._zone === "fields") {
            if (Input.isRepeated("left")) this.changeTree(-1);
            else if (Input.isRepeated("right")) this.changeTree(1);
            else if (Input.isTriggered("ok")) this.enterTree();
            return;
        }
        if (this.mouseMoved()) { const p = touchAt(), k = this.nodeAt(p.x, p.y); if (k >= 0 && k !== this._node) { this._node = k; this.redraw(); } }
        for (const [k, dx, dy] of [["up", 0, -1], ["down", 0, 1], ["left", -1, 0], ["right", 1, 0]]) {
            if (Input.isRepeated(k)) { this.moveTo(dx, dy); return; }
        }
        if (Input.isTriggered("ok")) this.askLearn();
    };
    SkillsView.prototype.nodeAt = function(x, y) { const q = (this._cells || []).find(c => inBox(c, x, y)); return q ? q.i : -1; };
    SkillsView.prototype.askLearn = function() {
        const Cb = T.api("Combat"), sk = this.list()[this._node];
        if (!Cb || !sk || Cb.skillBlock(sk.id) || Cb.skillRank(sk.id) >= sk.ranks) { SoundManager.playBuzzer(); return; }
        SoundManager.playOk();
        this._ask = { yes: true, id: sk.id };
        this.redraw();
        this.scene.drawKeys();
    };
    SkillsView.prototype.answer = function(yes) {
        const Cb = T.api("Combat"), sk = this.list()[this._node];
        this._ask = null;
        if (yes && sk) {
            const ok = !!Cb.learnSkill(sk.id);
            AudioManager.playSe({ name: ok ? "Up4" : "Buzzer1", volume: 70, pitch: ok ? 115 : 100, pan: 0 });
            this.scene.drawList();
        } else SoundManager.playCancel();
        this.redraw();
        this.scene.drawKeys();
    };
    // the mouse: a field's tab - that field; a box - chosen (from the fields' row: into the tree on it), clicked again - the question
    SkillsView.prototype.touch = function(x, y) {
        if (this._ask) { const q = (this._askBoxes || []).find(q => inBox(q, x, y)); if (q) this.answer(q.act === "yes"); return; }
        const tab = (this._tabBoxes || []).find(q => inBox(q, x, y));
        if (tab) { this.changeTree(tab.dir || tab.i - this._tree); return; }
        const k = this.nodeAt(x, y);
        if (k < 0) return;
        if (this._zone !== "tree") { this.enterTree(k); return; }
        if (k !== this._node) { this._node = k; SoundManager.playCursor(); this.redraw(); }
        else this.askLearn();
    };
    SkillsView.prototype.info = function() {
        const t = this.trees()[this._tree], list = this.list(), sk = this._zone === "tree" ? list[this._node] : null;
        return { skills: { tree: this._tree, treeId: t ? t.id : null, trees: this.trees().length, zone: this._zone, node: this._node, id: sk ? sk.id : null,
            count: list.length, ask: !!this._ask, cells: (this._cells || []).map(c => ({ i: c.i, id: c.id, x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 })) } };
    };

    // ==================================================================
    // Plecak (propozycja_1_lista_widok.png): one list with the groups' headings, the chosen thing's card; O uses, X throws out, Tab
    // the order
    // ==================================================================
    // The bag's order (the user, 2026-10-08): "Grupy" by default - Narzędzia i ubiór (what he wears / holds first), Jedzenie (what
    // spoils soonest first - Spoilage.js), Picie, Materiały (the most used in the recipes and the buildings first), Nasiona, Do zadań
    // (what the active quests ask for), Inne, Pamiątki - each group under its own heading; or "Nazwa", "Ilość", "Najnowsze" (what came
    // into the bag last first). Tab switches it; kept in the config (ConfigManager.bagSort).
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
    const GROUPS = [["tools", "Narzędzia i ubiór"], ["food", "Jedzenie"], ["drink", "Picie"], ["mat", "Materiały"], ["seed", "Nasiona"], ["quest", "Do zadań"], ["other", "Inne"], ["keep", "Pamiątki"]];
    const KIND_WORD = { tools: "Narzędzie", food: "Jedzenie", drink: "Picie", mat: "Materiał", seed: "Nasiona", quest: "Do zadania", other: "Rzecz", keep: "Pamiątka" };
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
        const E = T.api("Equipment");
        if (it.itypeId === 2 || TOOL_LIKE.has(it.id) || (E && E.WEARABLE && E.WEARABLE[it.id])) return "tools";
        if ((it.meta && it.meta.Drink !== undefined) || DRINKS.has(it.id)) return "drink";
        if (isFoodItem(it) || perishable(it) || (it.meta && it.meta.Butcher !== undefined)) return "food";
        if (/^Nasiona/.test(it.name)) return "seed";
        if (quest && quest.has(it.id)) return "quest";
        if (it.itypeId === 1 && it.occasion === 3) return "mat";
        return "other";
    }
    const wornNow = id => { const E = T.api("Equipment"); return !!(E && E.worn && E.worn(id)); };
    // what of the bag can be put on from it (the user, 2026-10-23: "w plecaku też można wybrany przedmiot ekwipunku ... zakładać i
    // zdejmować"): the part it goes on - Equipment.WEARABLE (the clothes <Ubior:...>, the shield, the cloak, the boots, the backpack),
    // or the right hand for a weapon of the combat mode (Combat.handChoices, as in Ekwipunek); the torch stays the torch's own business
    function equipSlotOf(it) {
        const E = T.api("Equipment");
        if (!E || !it || !DataManager.isItem(it) || it.id === E.TORCH || isKeep(it)) return null;
        if (E.readNotes) E.readNotes();
        if (E.WEARABLE && E.WEARABLE[it.id]) return E.WEARABLE[it.id];
        const Cb = T.api("Combat"), hands = Cb && Cb.handChoices ? Cb.handChoices() : [];
        if (hands.includes("m" + it.id) || ((it.id === 125 || it.id === 126 || !!T.call("Bron", "isRanged", it.id)) && hands.includes("ranged"))) return "right";
        return null;
    }
    const slotLabel = slot => { const E = T.api("Equipment"), d = E && E.SLOTS ? E.SLOTS.find(s => s.id === slot) : null; return d ? d.label : String(slot || ""); };
    const wornWord = slot => (slot === "right" || slot === "left" ? "w ręce" : "założone");
    const WEAPON_RANK = id => { const F = T.api("Combat_parts"), o = F && F.fight ? F.fight.MELEE_ORDER : []; const k = o.indexOf(id); return k >= 0 ? k : id === 125 || id === 126 || id === 127 ? 20 : -1; };
    function hoursLeft(id) { const Sp = T.api("Spoilage"); const h = Sp && Sp.hoursLeft ? Sp.hoursLeft(id) : null; return h === null || h === undefined ? Infinity : h; }
    const byName = (a, b) => a.name.localeCompare(b.name, "pl");
    // tools first, then the weapons, the arrows, then what is worn (the clothes, the shield)
    function kindRank(it) {
        const E = T.api("Equipment");
        if (E && E.WEARABLE && E.WEARABLE[it.id]) return 3;
        if (it.id === 127) return 2;
        return WEAPON_RANK(it.id) >= 0 ? 1 : 0;
    }
    // the sorted list: { data (items), heads: [{ key, label, index, count }] }; cols > 1: a group starts a row of its own (null places)
    function sortBag(items, mode, quest, cols) {
        items = items.filter(Boolean);
        cols = cols || 1;
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
        const data = [], heads = [];
        for (const [key, label] of GROUPS) {
            const list = by[key];
            if (!list || !list.length) continue;
            list.sort(order[key] || ((a, b) => a.id - b.id));
            while (data.length % cols) data.push(null);
            heads.push({ key, label, index: data.length, count: list.length });
            data.push(...list);
        }
        return { data, heads };
    }
    const questIds = () => { const mp = MP(); return mp && mp.questNeeds ? mp.questNeeds() : new Set(); };
    // the bag's list: a row a thing, a heading over each group's first row; the rects, the scroll, the mouse and the arrows all go by
    // that layout
    const BAGL = { head: 34, gap: 8, row: 42 };
    // the bag's and the save files' page: the list window's width, the line after it, the card's left edge (from the panel's left)
    const BAGW = { list: 520, line: 544, card: 572 };
    function groupedList(list) {
        list.maxCols = () => 1;
        list.colSpacing = () => 0;
        list.rowSpacing = () => 0;
        list.itemHeight = () => BAGL.row;
        const make = list.makeItemList;
        list.makeItemList = function() {
            make.call(this);
            const s = sortBag(this._data, bagSort(), this._questIds || questIds(), 1);
            this._data = s.data;
            this._heads = s.heads;
            const first = new Set(s.heads.map(h => h.index));
            this._rowY = [];
            let y = 0;
            for (let i = 0; i <= this._data.length; i++) {
                if (first.has(i)) y += (i > 0 ? BAGL.gap : 0) + BAGL.head;
                this._rowY.push(y);
                y += BAGL.row;
            }
            this._firstRows = first;
        };
        const rowY = (w, i) => (w._rowY && w._rowY[i] !== undefined ? w._rowY[i] : i * BAGL.row);
        list.itemRect = function(index) { return new Rectangle(-this.scrollBaseX(), rowY(this, index) - this.scrollBaseY(), this.innerWidth, BAGL.row - 2); };
        list.overallHeight = function() { return Math.max(this.innerHeight, rowY(this, this.maxItems()) + 4); };
        list.ensureCursorVisible = function(smooth) {
            const i = this.index();
            if (i < 0 || this.innerHeight <= 0) return;
            const startOf = k => rowY(this, k) - (this._firstRows && this._firstRows.has(k) ? BAGL.head : 0);
            const top = startOf(i), bottom = rowY(this, i) + BAGL.row, sy = this.scrollY();
            const go = y => (smooth ? this.smoothScrollTo(0, y) : this.scrollTo(0, y));
            if (top < sy) go(top);
            else if (bottom > sy + this.innerHeight) {   // (the list's top edge on a row or a heading, never through one)
                const want = bottom - this.innerHeight;
                let y = want;
                for (let k = 0; k <= i; k++) { const s = startOf(k); if (s >= want) { y = s; break; } }
                go(y);
            }
        };
        list.hitTest = function(x, y) {
            if (!this.innerRect.contains(x, y)) return -1;
            const cx = this.origin.x + x - this.padding, cy = this.origin.y + y - this.padding;
            for (let i = 0; i < this.maxItems(); i++) if (this._data[i] && this.itemRect(i).contains(cx, cy)) return i;
            return -1;
        };
        list.drawAllItems = function() {
            const c = this.contents, top = this.scrollBaseY(), bottom = top + this.innerHeight + BAGL.row;
            for (const h of this._heads || []) {
                const y = rowY(this, h.index) - BAGL.head - top;
                if (y < -BAGL.head || y + BAGL.head > this.scrollY() - top + this.innerHeight) continue;
                heading(c, 6, y + 2, h.label.toUpperCase(), this.innerWidth - 6, h.count);
            }
            for (let i = 0; i < this.maxItems(); i++) {
                const y = rowY(this, i);
                if (y + BAGL.row < top || y > bottom) continue;
                if (this._data[i]) this.drawItem(i);
            }
            if (!this.maxItems()) tx(c, "Plecak jest pusty.", 10, 22, 22, { color: K.muted });
            done(c);
        };
        list.drawItemBackground = function() {};
        list.refreshCursor = function() { this.setCursorRect(0, 0, 0, 0); };
        list.drawItem = function(index) {
            const it = this.itemAt(index);
            if (!it) return;
            const r = this.itemRect(index), c = this.contents, on = index === this.index(), act = this.active, ink = on && act ? K.sel : null;
            if (r.y + r.height > this.scrollY() - this.scrollBaseY() + this.innerHeight + 1) return;   // (a row cut by the foot: not drawn - "jeszcze N niżej" says it is there; the contents start at the scroll's base, shown from the scroll itself)
            if (on) rr(c.context, r.x, r.y, r.width, BAGL.row - 2, 8, act ? K.acc : K.accDim);
            CH.drawIcon(c, it.iconIndex, r.x + 10, r.y + 4, 32);
            const n = $gameParty.numItems(it);
            let rw = 0, x1 = r.x + r.width - 12;
            if (wornNow(it.id)) {   // (what is worn: a small yellow plate "założone" / "w ręce" - the user, 2026-10-23)
                const word = it.id === 59 ? "w ręce" : wornWord(equipSlotOf(it)), pw = measure(word, 17, "bold") + 16;
                rr(c.context, x1 - pw, r.y + 9, pw, 23, 6, ink ? K.sel : K.acc);
                tx(c, word, x1 - pw / 2, r.y + 21, 17, { face: "bold", align: "center", color: ink ? K.acc : K.sel });
                rw = pw + 12;
                x1 -= rw;
            }
            if (n > 1) rw += tx(c, "×" + n, x1, r.y + 21, 22, { align: "right", face: "bold", color: ink || K.text }) + 14;
            tx(c, it.name, r.x + 54, r.y + 21, 24, { color: ink || K.text, max: r.width - 70 - rw });
            done(c);
        };
        const sel = list.select;
        list.select = function(i) {
            const was = this.index();
            sel.call(this, i);
            if (was === i || !this.contents) return;
            for (const k of [was, i]) if (k >= 0 && k < this.maxItems()) this.redrawItem(k);
        };
        const act = list.activate, deact = list.deactivate;
        list.activate = function() { const was = this.active; act.call(this); if (!was && this.contents && this.index() >= 0 && this.index() < this.maxItems()) this.redrawItem(this.index()); };
        list.deactivate = function() { const was = this.active; deact.call(this); if (was && this.contents && this.index() >= 0 && this.index() < this.maxItems()) this.redrawItem(this.index()); };
        // (a redrawn row: its old picture cleared - the row's own rect)
        list.clearItem = function(index) { const r = this.itemRect(index); this.contents.clearRect(r.x, r.y, r.width, r.height + 2); };
        const refresh = list.refresh;
        list.refresh = function() {
            refresh.call(this);
            if (this.index() >= this.maxItems()) this.select(Math.max(0, this.maxItems() - 1));
        };
    }
    // the card of the chosen thing (the mock-up's item_detail): drawn into the bag's Window_ItemDetail (its _desc and _note are what
    // the other plugins add - the wear, the water in the skin, what eating it did)
    function bagCard(win) {
        const it = win._item, c = win.contents, ctx = c.context, Wd = win.innerWidth, Hd = win.innerHeight;
        c.clear();
        if (!it) { if (win._note) noteBox(win, 0); done(c); return; }
        rr(ctx, 0, 0, 84, 84, 10, K.cell);
        CH.drawIcon(c, it.iconIndex, 10, 10, 64);
        const slot = equipSlotOf(it), worn = wornNow(it.id);
        win._cap = worn && slot ? (wornWord(slot) === "w ręce" ? "W RĘCE" : "ZAŁOŻONE") + "  ·  " + slotLabel(slot).toUpperCase() : (KIND_WORD[groupOf(it, null)] || "Rzecz").toUpperCase();
        tx(c, win._cap, 104, 6, 20, { top: true, face: "sc", color: K.acc, max: Wd - 104 });
        // the name on one line, smaller when long; two lines when even that does not fit
        let ns = 34;
        while (ns > 24 && measure(it.name, ns, "bold") > Wd - 104) ns -= 2;
        const nameLines = measure(it.name, ns, "bold") > Wd - 104 ? wrapWords(it.name, 24, Wd - 104, "bold").slice(0, 2) : [it.name];
        if (nameLines.length > 1) nameLines.forEach((line, i) => tx(c, line, 104, 30 + i * 26, 24, { top: true, face: "bold", max: Wd - 104 }));
        else tx(c, it.name, 104, 30 + (34 - ns) / 2, ns, { top: true, face: "bold", max: Wd - 104 });
        const rows = [["Masz", String($gameParty.numItems(it))]], S = T.api("Survival"), D = T.api("Durability");
        const w = S && S.itemWeight ? S.itemWeight(it) : 0;
        if (w) rows.push(["Waga", weightTxt(w) + " za sztukę"]);
        const fresh = T.call("Spoilage", "freshnessText", it.id) || "";
        if (fresh) rows.push(["Świeżość", fresh.replace(/^Świeżość:\s*/i, "").replace(/^Najstarsza sztuka\s+/i, "").replace(/\.$/, ""), K.good]);
        if (D && D.TOOLS && D.TOOLS[it.id] && D.lifeOf) rows.push(["Zużycie", Math.round(D.left(it.id)) + " / " + D.lifeOf(it.id)]);
        if (slot) rows.push(["Miejsce", slotLabel(slot) + (worn ? " · " + wornWord(slot) : ""), worn ? K.acc : null]);
        let y = 106;
        for (const [lab, val, col] of rows) {
            tx(c, lab, 0, y, 22, { top: true, color: K.muted });
            tx(c, val, Wd, y, 22, { top: true, face: "bold", align: "right", color: col || K.text, max: Wd - 110 });
            y += 32;
            hl(ctx, 0, Wd, y - 4);
        }
        y += 10;
        if (isKeep(it)) { tx(c, "Pamiątka: nie do sprzedania ani wyrzucenia.", 0, y, 20, { top: true, color: K.acc, max: Wd }); y += 30; }
        const desc = fresh ? String(win._desc || "").replace(fresh, "").trim() : String(win._desc || "");
        const S2 = T.api("Survival"), N = T.api("Needs"), food = S2 && S2.foodInfo ? S2.foodInfo(it) : null, fw = food && N && N.foodValues ? N.foodValues(it, food) : [0, 0];
        const gains = [];
        if (food) {
            if (food.stamina) gains.push(["stamina", "Kondycja", food.stamina]);
            if (fw[0]) gains.push(["food", "Sytość", Math.round(fw[0])]);
            if (fw[1]) gains.push(["water", "Nawodnienie", Math.round(fw[1])]);
        }
        const canUse = $gameParty.canUse(it) || !!slot, bottom = Hd - (canUse ? 48 : 0) - (gains.length ? 46 + gains.length * 30 : 0) - (win._note ? 70 : 0);
        for (const line of wrapWords(desc, 21, Wd, "regular")) {
            if (y + 28 > bottom) { tx(c, "…", 0, y - 6, 21, { top: true, color: K.muted }); break; }
            tx(c, line, 0, y, 21, { top: true, face: "regular" });
            y += 28;
        }
        if (gains.length) {
            y = Math.max(y + 8, Math.min(y + 14, bottom + 10));
            heading(c, 0, y, "PO ZJEDZENIU");
            y += 32;
            for (const [k, lab, v] of gains) {
                rr(ctx, 2, y + 6, 10, 10, 5, NEED_COL[k]);
                tx(c, lab, 22, y, 21, { top: true });
                tx(c, (v > 0 ? "+" : "") + v, Wd, y, 21, { top: true, face: "bold", align: "right" });
                y += 30;
            }
        }
        if (win._note) noteBox(win, Math.min(y + 8, Hd - (canUse ? 48 : 0) - 66));
        if (canUse) {
            const drink = groupOf(it, null) === "drink", verb = slot ? (worn ? "Zdejmij" : "Załóż") : food ? (drink ? "Wypij" : "Zjedz") : drink ? "Wypij" : "Użyj";
            const kw = keycap(c, 0, Hd - 20, "O");
            tx(c, verb, kw + 10, Hd - 19, 24, { face: "bold" });
        }
        done(c);
    }
    function noteBox(win, y) {
        const c = win.contents, Wd = win.innerWidth, lines = wrapWords(win._note, 19, Wd - 24, "regular").slice(0, 3), h = lines.length * 24 + 16;
        rr(c.context, 0, y, Wd, h, 8, "rgba(60,96,52,0.45)");
        lines.forEach((l, i) => tx(c, l, 12, y + 8 + i * 24, 19, { top: true, face: "regular", color: "#c9f0c0" }));
    }

    function BagView(scene, def) {
        View.call(this, scene, def);
        const R = RX(), mp = MP();
        this._head = this.layer();
        this._detail = this.addWindow(new mp.Window_ItemDetail(new Rectangle(R.x0 + BAGW.card - 12, R.y0 + 100, R.x1 - 22 - (R.x0 + BAGW.card - 12), R.y1 - 12 - (R.y0 + 100))), false);
        this._detail.refresh = function() { if (this.contents) bagCard(this); };
        const list = this._list = this.addWindow(new Window_ItemList(new Rectangle(R.x0 + 12, R.y0 + 96, BAGW.list, R.y1 - 10 - (R.y0 + 96))));
        groupedList(list);
        list.setHelpWindow(this._detail);
        list.setCategory("all");
        list.setHandler("ok", () => this.use());
        const enabled = list.isEnabled;   // (O on a thing to put on: it goes on / comes off - not "it cannot be used")
        list.isEnabled = function(it) { return enabled.call(this, it) || !!equipSlotOf(it); };
        // "Wyrzuć" (X): the question over the bag and the little plate that says why not - over the windows (the scene's top layer)
        this._drop = null;
        this._dropBoxes = [];
        this._over = new Sprite(new Bitmap(W(), H()));
        this._toast = new Sprite();
        this._toast.visible = false;
        this._toastText = "";
        scene._overLayer.addChild(this._over);
        scene._overLayer.addChild(this._toast);
        // (O on something that cannot be used: why - the classic bag's words)
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
        const it = this._list.item(), slot = equipSlotOf(it);
        return [["W/S", "rzecz"], ["O", slot ? (wornNow(it.id) ? "zdejmij" : "załóż") : "użyj"], ["X", "wyrzuć"], ["Tab", "porządek"], ["P", "wróć"]];
    };
    // the keys' word for O follows the chosen thing (to put on, to take off, to use)
    BagView.prototype.keysKey = function() { const it = this._list.item(); return (it ? it.id : 0) + ":" + (it && wornNow(it.id) ? 1 : 0) + ":" + (this._drop ? this._drop.step : ""); };
    // O on a thing to put on: on its part (what was there comes off - said on the plate over it), or off when it is on
    BagView.prototype.toggleWear = function(it, slot) {
        const E = T.api("Equipment"), list = this._list, help = this._detail;
        let ok, text;
        if (E.worn(it.id)) {
            ok = !!E.unequip(slot);
            text = ok ? "Zdjęte: " + it.name + (slot === "right" ? " · w ręce: pięści" : "") : "Tego nie da się teraz zdjąć.";
        } else {
            const prev = E.current(slot), prevName = prev && prev !== it.id && item(prev) ? item(prev).name : "";
            ok = !!E.equip(slot, it.id);
            text = ok ? "Założone: " + it.name + (prevName ? " · zdjęte: " + prevName : "") : "Tego nie da się teraz założyć.";
        }
        if (ok) SoundManager.playEquip(); else SoundManager.playBuzzer();
        list.refresh();   // (the worn go first in their group: the thing may move - it stays chosen)
        const i = list._data.indexOf(it);
        if (i >= 0) list.select(i);
        list.ensureCursorVisible(false);
        help._note = "";
        help.setItem(list.item());
        this.drawHead();
        list.activate();
        this.toast(it.iconIndex, text, ok ? K.text : null, ok);
        this._wearText = text;
        this.scene.drawKeys();
        this.scene.drawList();
    };
    // the order: Tab (the next one); the chosen thing stays chosen
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
        if (this.root.visible && this._list.scrollY() !== this._scrollWas) { this._list.paint(); this.drawHead(); }   // (the rows at the foot: whole ones only)
        if (this.inside && this.keysKey() !== this._keysWas) { this._keysWas = this.keysKey(); this.scene.drawKeys(); }
        if (!this.ready()) return;
        if (this._drop) { this.updateDrop(); return; }
        if (this._list.active && Input.isTriggered("takeOff")) { this.askDrop(); return; }
        if (this._list.active && Input.isTriggered("tab")) { const k = SORTS.findIndex(x => x[0] === bagSort()); this.setSort(SORTS[(k + 1) % SORTS.length][0]); }
    };
    BagView.prototype.touch = function(x, y) {
        if (this._drop) {
            const q = this._dropBoxes.find(q => inBox(q, x, y));
            if (q) this.dropAct(q.act);
            return;
        }
        const b = (this._sortBoxes || []).find(q => inBox(q, x, y));
        if (b) { const k = SORTS.findIndex(s => s[0] === bagSort()); this.setSort(SORTS[(k + 1) % SORTS.length][0]); }
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
        this._list.ensureCursorVisible(false);
        this._detail.setItem(this._list.item());
        this.drawHead();
    };
    BagView.prototype.redraw = function() { this._list.refresh(); this._detail.setItem(this._list.item()); this.drawHead(); };
    BagView.prototype.activate = function() {
        this.scene._helpWindow = this._detail;   // (what eating says - Survival's feedback - goes onto the card)
        this._list.activate();
        if (this._list.index() < 0 && this._list.maxItems()) this._list.select(0);
        this._detail.setItem(this._list.item());
    };
    BagView.prototype.leave = function() {
        if (this.scene._helpWindow === this._detail) this.scene._helpWindow = null;
        if (this._drop) { this._drop = null; this.drawDrop(); }
        this._toast.visible = false;
        this._toastText = "";
    };
    // the head: the title, the order, the load as a copper bar; the line between the list and the card; "jeszcze N niżej"
    BagView.prototype.drawHead = function() {
        const b = this._head.bitmap, ctx = b.context, R = RX(), S = T.api("Survival");
        b.clear();
        header(b, "Plecak");
        const order = SORTS.find(s => s[0] === bagSort()), ox = R.lx;   // (no view name before it any more: header())
        const ow = tx(b, "porządek: " + order[1].toLowerCase(), ox, R.y0 + 55, 18, { top: true, color: K.dim });
        this._sortBoxes = [{ x0: ox - 8, x1: ox + ow + 8, y0: R.y0 + 44, y1: R.y0 + 84 }];
        if (S && S.carriedWeight && S.weightCap) {
            const load = S.carriedWeight(), cap = S.weightCap();
            tx(b, "OBCIĄŻENIE", R.x1 - 330, R.y0 + 46, 18, { top: true, face: "sc", color: K.muted });
            tx(b, weightTxt(Math.round(load * 10) / 10) + " / " + cap, R.rx, R.y0 + 43, 22, { top: true, face: "bold", align: "right", color: load > cap ? K.warn : K.text });
            meter(ctx, R.x1 - 330, R.y0 + 72, 296, 7, Math.min(1, load / Math.max(1, cap)), load > cap ? K.warn : K.acc);
        }
        vl(ctx, R.x0 + BAGW.line, R.y0 + 108, R.y1 - 24);
        // what is below the list's bottom edge
        const list = this._list, sy = list.scrollY(), ih = list.innerHeight;
        let more = 0;
        for (let i = 0; i < list.maxItems(); i++) { const r = list._rowY ? list._rowY[i] : i * BAGL.row; if (r + BAGL.row > sy + ih + 2) more++; }
        if (more) tx(b, "▾  jeszcze " + more + " niżej", R.x0 + 12 + BAGW.list / 2, R.y1 - 14, 19, { align: "center", color: K.muted });
        this._scrollWas = sy;
        done(b);
    };
    // O on a thing: used on the hero at once (one hero), as the bag did
    BagView.prototype.use = function() {
        const list = this._list, it = list.item(), actor = $gameParty.leader(), help = this._detail;
        if (!it || !actor) { list.activate(); return; }
        const slot = equipSlotOf(it);
        if (slot) { this.toggleWear(it, slot); return; }
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
        this.scene.drawList();
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
        if (list.index() >= list.maxItems()) list.select(Math.max(0, list.maxItems() - 1));
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
    BagView.prototype.dropRect = function() { const P = L.right; return { x: Math.round(P.x + (P.w - DROP.w) / 2), y: Math.round(P.y + 100 + (P.h - 100 - DROP.h) / 2) }; };
    BagView.prototype.drawDrop = function() {
        const b = this._over.bitmap, d = this._drop;
        b.clear();
        this._dropBoxes = [];
        if (!d) { done(b); return; }
        const P = L.right, r = this.dropRect(), ctx = b.context, it = d.it, w = DROP.w, x0 = r.x + 28, iw = w - 56;
        const box = (act, x, y, bw, bh) => this._dropBoxes.push({ act, x0: x, x1: x + bw, y0: y, y1: y + bh });
        ctx.save();
        ctx.fillStyle = "rgba(8,9,11,0.55)";   // (the bag under the question: dimmed)
        CH.roundPath(ctx, P.x, P.y, P.w, P.h, 14);
        ctx.fill();
        ctx.restore();
        rr(ctx, r.x, r.y, w, DROP.h, 12, "rgba(20,21,24,0.98)");
        tx(b, "WYRZUĆ", x0, r.y + 18, 18, { top: true, face: "sc", color: K.acc });
        CH.drawIcon(b, it.iconIndex, x0, r.y + 44, 48);
        tx(b, it.name, x0 + 62, r.y + 46, 24, { top: true, face: "bold", max: iw - 62 });
        tx(b, "w plecaku " + d.have + (d.need > 0 ? " · " + d.need + " zostaje do zadania" : ""), x0 + 62, r.y + 76, 18, { top: true, color: K.muted, max: iw - 62 });
        if (d.step === "qty") {
            const cx = r.x + w / 2, y = r.y + 112;
            for (const [act, sx, glyph] of [["minus", cx - 150, "−"], ["plus", cx + 106, "+"]]) {
                const off = act === "minus" ? d.n <= 1 : d.n >= d.max;
                rr(ctx, sx, y + 6, 44, 44, 8, off ? K.empty : K.cell);
                textOut(b, glyph, sx, y + 6, 44, 44, "center", { size: 26, face: "bold", color: off ? K.dim : K.text, plain: true });
                box(act, sx, y + 6, 44, 44);
            }
            textOut(b, String(d.n), cx - 90, y, 180, 56, "center", { size: 42, face: "bold", plain: true });
            textOut(b, "z " + d.max, cx - 90, y + 52, 180, 22, "center", { size: 17, color: C.muted, plain: true });
            meter(ctx, x0, y + 86, iw, 4, d.n / Math.max(1, d.max), K.acc);
            box("next", cx - 90, y, 180, 74);
            const ky = r.y + DROP.h - 46, all = [["Tab", "wszystko (" + d.max + ")"]];
            smallKeys(b, x0, ky, all);
            box("all", x0, ky, smallKeysWidth(all) + 8, 24);
            smallKeys(b, r.x + w - 28 - smallKeysWidth([["O", "dalej"]]), ky, [["O", "dalej"]]);
            box("next", r.x + w - 28 - smallKeysWidth([["O", "dalej"]]), ky, smallKeysWidth([["O", "dalej"]]) + 8, 24);
        } else {
            const D = T.api("Drops"), s = D ? D.spot() : null, here = s && s.x === $gamePlayer.x && s.y === $gamePlayer.y;
            const pile = s && D.at($gameMap.mapId(), s.x, s.y);
            let y = r.y + 112;
            tx(b, "Wyrzucić " + (d.n === d.have ? "wszystko (" + d.n + ")" : d.n + " z " + d.have) + "?", x0, y, 22, { top: true, face: "bold", max: iw });
            y += 34;
            tx(b, (pile ? "Dołożysz do tobołka " : "Zostanie w tobołku ") + (here ? "pod tobą." : "przed tobą."), x0, y, 18, { top: true, color: K.muted, max: iw });
            y += 24;
            tx(b, "O na tobołku zabierze to z powrotem.", x0, y, 18, { top: true, color: K.muted, max: iw });
            y += 24;
            if (D && D.wornLast(it, d.n)) tx(b, "Masz to na sobie: najpierw to zdejmiesz.", x0, y, 18, { top: true, color: K.warn, max: iw });
            const by = r.y + DROP.h - 66, bw = (iw - 16) / 2;
            [["yes", "Tak"], ["no", "Nie"]].forEach(([act, label], k) => {
                const bx = x0 + k * (bw + 16), on = (act === "yes") === d.yes;
                rr(ctx, bx, by, bw, 46, 8, on ? K.acc : K.cell);
                tx(b, label, bx + bw / 2, by + 23, 21, { face: "bold", align: "center", color: on ? K.sel : K.text });
                box(act, bx, by, bw, 46);
            });
        }
        done(b);
    };
    // a plate over the chosen thing (as the popups over the hero on the map): why it cannot go, or what went; it rises and fades
    BagView.prototype.toast = function(icon, text, color, quiet) {
        const s = this._toast, size = 18, pad = 10, iw = icon ? 32 + 8 : 0, tw = Math.ceil(measure(text, size)), w = pad * 2 + iw + tw + 6, h = 40;
        const b = new Bitmap(w, h);
        CH.rpanel(b.context, 0, 0, w, h, 6, { fill: "rgba(11,12,15,0.94)", line: quiet ? C.line : K.warn, shadow: 0 });
        if (icon) CH.drawIcon(b, icon, pad, 4, 32);
        textOut(b, text, pad + iw, 0, tw + 6, h, "left", { size, color: color || (T.popup.COLORS ? T.popup.COLORS.need : K.warn), plain: true });
        done(b);
        s.bitmap = b;
        const list = this._list, i = list.index(), rr0 = i >= 0 ? list.itemRect(i) : new Rectangle(0, 0, 0, 0), P = L.right;
        s._x0 = Math.round(Math.max(P.x + 8, Math.min(P.x + P.w - w - 8, list.x + list.padding + rr0.x + rr0.width / 2 - w / 2)));
        s._y0 = Math.round(Math.max(P.y + 8, list.y + list.padding + rr0.y - h - 2));
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
    BagView.prototype.info = function() {
        const l = this._list;
        return { bag: { category: "all", items: l.maxItems(), index: l.index(), item: l.item() ? l.item().id : null, sort: bagSort(),
            heads: (l._heads || []).map(h => ({ key: h.key, label: h.label, index: h.index, count: h.count })), data: l._data.map(it => (it ? it.id : 0)),
            drop: this._drop ? { step: this._drop.step, n: this._drop.n, max: this._drop.max, have: this._drop.have, item: this._drop.it.id, yes: this._drop.yes } : null,
            toast: this._toastText || "", active: l.active, card: this._detail._item ? this._detail._item.id : null, note: this._detail._note || "",
            cardCap: this._detail._cap || "", worn: l._data.filter(it => it && wornNow(it.id)).map(it => it.id), wear: this._wearText || "" } };
    };

    // ==================================================================
    // Dziennik (lista_v2_dziennik.png): A / D the section, W / S the entries (Journal's list), the entry's words (Journal's detail)
    // ==================================================================
    const SK = { top: 104, row: 44, vis: 10, lw: 480 };   // (Dziennik's list: its top from RX().y0, a row, the rows seen, its width)
    // the journal's sections not shown in the menu for now (the user, 2026-10-23: "z dziennika ukryj na razie Receptury, Zapasy i Budynki");
    // they stay in Journal.js - taking a name out of this list shows the section again
    const JOURNAL_HIDDEN = ["Budynki", "Receptury", "Zapasy"];
    // the sections' order in the menu (the user, 2026-10-23); a section not named here comes after them, in Journal's order
    const JOURNAL_ORDER = ["Zadania", "Zlecenia", "Surowce", "Notatki", "Okolice", "Gablotka"];
    function JournalView(scene, def) {
        View.call(this, scene, def);
        const R = RX(), J = T.api("Journal");
        this.J = J;
        this._head = this.layer();
        this._tab = 0;
        this._detail = this.addWindow(new J.Window_JournalDetail(new Rectangle(R.lx + SK.lw + 46 - 12, R.y0 + 96, R.rx - (R.lx + SK.lw + 46) + 24, R.y1 - 12 - (R.y0 + 96))), false);
        const list = this._list = this.addWindow(new J.Window_JournalList(new Rectangle(R.lx - 8 - 12, R.y0 + SK.top - 12, SK.lw + 8 + 24, SK.vis * SK.row + 24)));
        list.itemHeight = () => SK.row;
        list.colSpacing = () => 0;
        list.rowSpacing = () => 0;
        list.drawItem = function(index) {
            const it = this._items[index];
            if (!it) return;
            const r = this.itemRect(index), c = this.contents, ctx = c.context, on = index === this.index(), act = this.active, ink = on && act ? K.sel : null;
            if (it.head) {   // (Zadania's group: its heading as in Plecak - copper capitals, the count, a line)
                heading(c, r.x + 6, r.y + 14, it.label, r.x + r.width - 6, it.count);
                done(c);
                return;
            }
            if (on) rr(ctx, r.x, r.y, r.width, 40, 8, act ? K.acc : K.accDim);
            if (it.icon) CH.drawIcon(c, it.icon, r.x + 8, r.y + 4, 32);
            let right = r.x + r.width - 10;
            if (it.mark === "pin" || it.mark === "ready") {   // (pinned: a copper diamond; can be done now: a dot)
                ctx.save();
                ctx.fillStyle = ink || K.acc;
                ctx.beginPath();
                const mx = right - 6, my = r.y + 20;
                if (it.mark === "pin") { ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 6, my); ctx.closePath(); }
                else ctx.arc(mx, my, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                right -= 20;
            }
            if (it.right) right -= tx(c, it.right, right, r.y + 20, 17, { align: "right", color: ink ? K.selMuted : K.muted }) + 10;
            tx(c, it.label, r.x + 50, r.y + 20, 22, { color: ink || (it.dim ? K.dim : K.text), max: right - (r.x + 50) });
            done(c);
        };
        flatRows(list, null);
        list._onSelect = it => this._detail.setDetail(J.detailFor(this._tab, it));
        list._onTab = dir => this.changeTab(dir);   // (A / D in the list: the section)
        list.setHandler("ok", () => this.onOk());
    }
    JournalView.prototype = Object.create(View.prototype);
    JournalView.prototype.constructor = JournalView;
    // (O: what the section's OK does - Zadania pins, Zlecenia follows; nothing in Surowce / Notatki)
    JournalView.prototype.keys = function() {
        const def = this.J.TAB_DEFS[this._tab], keys = [["A/D", "dział"], ["W/S", "wpis"]];
        if (def && def.ok) keys.push(["O", def.okWord || "śledź"]);
        return keys.concat([["P", "wróć"]]);
    };
    JournalView.prototype.refresh = function() {
        if (this.J.evaluateGoals) this.J.evaluateGoals();
        this.showTab(true);
    };
    JournalView.prototype.redraw = function() { this.drawHead(); };
    JournalView.prototype.activate = function() { this._list.activate(); };
    // the sections shown (their indexes in Journal's TABS)
    JournalView.prototype.shown = function() {
        const T_ = this.J.TABS, all = T_.map((n, i) => i), s = all.filter(i => !JOURNAL_HIDDEN.includes(T_[i]));
        const rank = i => { const k = JOURNAL_ORDER.indexOf(T_[i]); return k < 0 ? JOURNAL_ORDER.length + i : k; };
        return (s.length ? s : all).sort((a, b) => rank(a) - rank(b));
    };
    JournalView.prototype.showTab = function(keep) {
        const s = this.shown();
        if (!s.includes(this._tab)) { this._tab = s[0]; keep = false; }
        const idx = keep ? Math.max(0, this._list.index()) : 0;
        this._list.setItems(this.J.itemsForTab(this._tab));
        if (keep && idx < this._list.maxItems()) { this._list.select(idx); this._list.ensureCursorVisible(false); this._list.updateHelp(); }
        this.drawHead();
    };
    JournalView.prototype.changeTab = function(dir) {
        const s = this.shown(), n = s.length, k = Math.max(0, s.indexOf(this._tab));
        this._tab = s[(k + dir % n + n) % n];
        SoundManager.playCursor();
        this.showTab(false);
        if (this.inside) { this._list.activate(); this.scene.drawKeys(); }
    };
    JournalView.prototype.onOk = function() {
        const it = this._list.currentItem(), idx = this._list.index();
        if (this.J.listOk && this.J.listOk(this._tab, it)) {
            SoundManager.playOk();
            this._list.setItems(this.J.itemsForTab(this._tab));
            this._list.select(Math.min(idx, this._list.maxItems() - 1));
            this._list.ensureCursorVisible(false);
            this._list.updateHelp();
            this.drawHead();
        } else SoundManager.playBuzzer();
        this._list.activate();
    };
    JournalView.prototype.drawHead = function() {
        const b = this._head.bitmap, R = RX(), J = this.J, def = J.TAB_DEFS[this._tab];
        b.clear();
        header(b, null);   // (the head strip: the sections' row - the page's own, no second row of the frame)
        const s = this.shown();
        this._tabBoxes = tabStrip(b, s.map(i => J.TABS[i]), s.indexOf(this._tab), R.lx - 6, R.rx, R.y0 + STRIP_TOP, this._tabScroll || (this._tabScroll = {}));
        const legend = def && def.legend ? def.legend() : "";
        if (legend) tx(b, legend, R.lx, R.y1 - 32, 20, { top: true, color: K.muted, max: SK.lw });
        vl(b.context, R.lx + SK.lw + 22, R.y0 + 108, R.y1 - 24);
        done(b);
    };
    JournalView.prototype.touch = function(x, y) {
        const hit = (this._tabBoxes || []).find(q => inBox(q, x, y));
        const k = this.shown().indexOf(this._tab);   // (a tab's box: its place among the shown sections)
        if (hit && hit.dir) this.changeTab(hit.dir);
        else if (hit && hit.i !== k) this.changeTab(hit.i - k);
    };
    JournalView.prototype.info = function() {
        const J = this.J, d = J.data ? J.data() : {}, items = this._list._items || [], cur = this._list.currentItem();
        return { journal: { tab: this._tab, name: J.TABS[this._tab], tabs: this.shown().length, names: this.shown().map(i => J.TABS[i]), items: this._list.maxItems(), index: this._list.index(),
            scroll: this._detail.origin.y, pinned: d.pinned || null, pin: J.pinnedNow ? J.pinnedNow() : null,
            heads: items.filter(it => it.head).map(it => ({ label: it.label, count: it.count, index: items.indexOf(it) })),
            marks: items.filter(it => it.mark === "pin").map(it => it.label), legend: J.TAB_DEFS[this._tab] && J.TAB_DEFS[this._tab].legend ? J.TAB_DEFS[this._tab].legend() : "",
            item: cur ? cur.label : null, group: cur ? cur.group || null : null, kind: cur ? (cur.goal ? "goal" : cur.quest ? "quest" : cur.head ? "head" : "other") : null,
            id: cur ? (cur.goal ? cur.goal.id : cur.id || null) : null } };
    };

    // ==================================================================
    // Opcje: OptionEx's list of settings on the right panel (the volumes, Wygląd: Grafit / Klasyczny...)
    // ==================================================================
    function OptionsView(scene, def) {
        View.call(this, scene, def);
        const R = RX();
        this._head = this.layer();
        const ow = Math.min(860, R.rx - R.lx + 40), ox = Math.round((R.x0 + R.x1 - ow) / 2);   // (the rows not wider than reads well: in the middle)
        this._win = this.addWindow(new Window_Options(new Rectangle(ox, R.y0 + 96, ow, R.y1 - 12 - (R.y0 + 96))));
        // (OptionEx's rows are two halves - the name, the value: the fill goes under both, the list drawn again on a change)
        flatRows(this._win, { on: K.accDim, off: null, repaint: true, rect: (w, i) => { const r = w.itemRect(i, false); if (!(w.isDefaultSymbol && w.isDefaultSymbol(w.commandSymbol(i)))) r.width *= 2; return r; } });
        fitRows(this._win);
    }
    OptionsView.prototype = Object.create(View.prototype);
    OptionsView.prototype.constructor = OptionsView;
    OptionsView.prototype.keys = function() { return [["W/S", "opcja"], ["A/D", "wartość"], ["O", "przełącz"], ["P", "wróć"]]; };
    OptionsView.prototype.refresh = function() { this._win.refresh(); this.redraw(); };
    OptionsView.prototype.redraw = function() {
        const b = this._head.bitmap;
        b.clear();
        header(b, "Opcje", "zmiany zapisują się same");
        drawMore(b, this._win, L.right.x + L.right.w / 2);
        this._sy = this._win.scrollY();
        done(b);
    };
    OptionsView.prototype.update = function() { if (this.root.visible && this._win.scrollY() !== this._sy) this.redraw(); };
    OptionsView.prototype.activate = function() { this._win.activate(); if (this._win.index() < 0) this._win.select(0); };
    OptionsView.prototype.leave = function() { ConfigManager.save(); };
    OptionsView.prototype.info = function() { return { options: { index: this._win.index(), symbol: this._win.currentSymbol() } }; };

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
        const tile = Math.min(56, r.height - 8), ty = r.y + Math.round((r.height - tile) / 2), tx0 = r.x + tile + 14, en = this.isEnabled(id);
        if (info) bustInTile(c, bustOf(info), r.x + 2, ty, tile, tile, tile * 0.0068, this._bustWait ? null : (this._bustWait = () => { this._bustWait = null; this.refresh(); }));
        else emptyTile(c, r.x + 2, ty, tile, tile);
        c.paintOpacity = en ? 255 : 150;
        textOut(c, id === 0 ? "Autozapis" : "Plik " + id, tx0, r.y + 6, 220, 26, "left", { size: 18, face: "bold", color: info ? C.text : C.muted, plain: true });
        if (info && info.timestamp) textOut(c, stampOf(info.timestamp), r.x, r.y + 6, r.width - 6, 26, "right", { size: 15, face: "regular", color: C.muted, plain: true });
        const line = info ? [dayOf(info), info.place].filter(Boolean).join(" · ") : "pusty";
        textOut(c, CH.fit(line, 16, r.width - tile - 110, "regular"), tx0, r.y + 31, r.width - tile - 100, 24, "left", { size: 16, face: "regular", color: info ? "#cfc9bd" : C.dim, plain: true });
        if (info && info.playtime) textOut(c, info.playtime, r.x, r.y + 31, r.width - 6, 24, "right", { size: 16, color: C.muted, plain: true });
        c.paintOpacity = 255;
        c._baseTexture.update();
    };
    // the chosen file's card (x, y: its top-left; w its width); returns the y under it
    function drawSaveCard(b, x, y, w, id, onReady) {
        const info = DataManager.savefileInfo(id), big = 120, tx0 = x + big + 18;
        if (info) bustInTile(b, bustOf(info), x, y, big, big, 0.42, onReady);
        else emptyTile(b, x, y, big, big);
        CH.spaced(b, id === 0 ? "Autozapis" : "Plik " + id, tx0, y + 2, 20, { size: 15 });
        textOut(b, info ? dayOf(info) : "Pusty plik", tx0, y + 24, w - big - 18, 36, "left", { size: 26, face: "bold", color: info ? C.text : C.muted, plain: true });
        if (info && info.place) textOut(b, CH.fit(info.place, 17, w - big - 18, "regular"), tx0, y + 62, w - big - 18, 26, "left", { size: 17, face: "regular", color: K.acc, plain: true });
        if (!info) { textOut(b, "Nic tu jeszcze nie zapisano.", tx0, y + 62, w - big - 18, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true }); return y + big + 12; }
        const rows = [];
        if (info.playtime) rows.push(["Czas gry", info.playtime]);
        if (info.level) rows.push(["Poziom", String(info.level)]);
        if (info.gold !== undefined) rows.push(["Sakiewka", info.gold + " G"]);
        if (info.debt) rows.push([info.debt.lost ? "Odkup działki" : "Dług dziadka", info.debt.done ? (info.debt.lost ? "odkupiona" : "spłacony") : info.debt.paid + " / " + info.debt.debt + " G"]);
        if (info.hutBuilt !== undefined) rows.push(["Chatka", info.hutBuilt ? "zbudowana" : "jeszcze nie ma"]);
        if (info.timestamp) rows.push(["Zapisano", stampOf(info.timestamp)]);
        let yy = y + big + 30;
        for (const [lab, val] of rows) {
            textOut(b, lab, x, yy - 13, 200, 26, "left", { size: 16, face: "regular", color: C.muted, plain: true });
            textOut(b, String(val), x + 140, yy - 13, w - 140, 26, "right", { size: 16, color: (lab === "Dług dziadka" || lab === "Odkup działki") && info.debt && info.debt.done ? K.good : C.text, plain: true });
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
        this._filesKeys.y = 684;
        const pairs = [["W/S", "wybierz"], ["O", load ? "wczytaj" : "zapisz tutaj"], ["P", "wróć"]];
        smallKeys(this._filesKeys.bitmap, Math.round(W() / 2 - smallKeysWidth(pairs) / 2), 2, pairs);
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

    // ==================================================================
    // Zapisz grę: the files (day, place, time played), the chosen one's card; O saves there (a question before writing over a file)
    // ==================================================================
    function SaveView(scene, def) {
        View.call(this, scene, def);
        const R = RX();
        this._card = this.layer();
        const list = this._list = this.addWindow(new Window_SavefileList(new Rectangle(R.x0 + 12, R.y0 + 96, BAGW.list, R.y1 - 12 - (R.y0 + 96))));
        list.setMode("save", false);
        flatRows(list, { on: K.accDim, off: "rgba(44,46,52,1)" });
        fitRows(list);
        list.setHandler("ok", () => this.save());
        const select = list.select;
        list.select = function(i) { select.call(this, i); if (scene._views.save) scene._views.save.drawCard(); };
        this._note = "";
        this._ask = null;
    }
    SaveView.prototype = Object.create(View.prototype);
    SaveView.prototype.constructor = SaveView;
    SaveView.prototype.keys = function() {
        if (this._ask) return [["A/D", "wybierz"], ["O", "potwierdź"], ["P", "nie"]];
        return [["W/S", "plik"], ["O", "zapisz"], ["P", "wróć"]];
    };
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
    SaveView.prototype.redraw = function() { this.drawCard(); };
    SaveView.prototype.activate = function() { this._list.activate(); };
    SaveView.prototype.leave = function() { this._note = ""; this._ask = null; };
    SaveView.prototype.drawCard = function() {
        const b = this._card.bitmap, R = RX(), x = R.x0 + BAGW.card, w = R.rx - x, id = this._list.savefileId ? this._list.savefileId() : 1;
        b.clear();
        header(b, "Zapisz grę", this.allowed() ? "dzień, miejsce, czas gry" : "tutaj nie można zapisać");
        vl(b.context, R.x0 + BAGW.line, R.y0 + 108, R.y1 - 24);
        drawMore(b, this._list, R.x0 + 12 + BAGW.list / 2);
        this._sy = this._list.scrollY();
        let y = drawSaveCard(b, x, R.y0 + 112, w, id, () => this.drawCard()) + 8;
        const now = this.allowed() ? "O zapisze tu to, co teraz: " + dayWords() + (placeName() ? ", " + placeName() : "") + "." : "Tutaj nie można zapisać gry.";
        for (const line of wrapWords(this._note || now, 19, w)) { tx(b, line, x, y, 19, { top: true, color: this._note ? K.good : this.allowed() ? K.soft : K.warn }); y += 26; }
        if (this._ask) this.drawAsk(b, id);
        done(b);
    };
    SaveView.prototype.drawAsk = function(b, id) {
        const ctx = b.context, R = RX(), x = R.x0 + BAGW.card, w = R.rx - x, y = R.y1 - 170, info = DataManager.savefileInfo(id);
        rr(ctx, x - 16, y, w + 32, 150, 12, "rgba(12,13,16,0.97)");
        tx(b, "Nadpisać " + (id === 0 ? "autozapis" : "plik " + id) + "?", x, y + 16, 22, { top: true, face: "bold" });
        tx(b, "Teraz: " + [dayOf(info), info && info.place].filter(Boolean).join(" · "), x, y + 48, 18, { top: true, color: K.muted, max: w });
        const bw = (w - 12) / 2;
        this._askBoxes = [];
        [["yes", "Tak"], ["no", "Nie"]].forEach(([act, lab], k) => {
            const bx = x + k * (bw + 12), on = (act === "yes") === this._ask.yes;
            rr(ctx, bx, y + 98, bw, 38, 8, on ? K.acc : K.cell);
            tx(b, lab, bx + bw / 2, y + 117, 21, { face: "bold", align: "center", color: on ? K.sel : K.text });
            this._askBoxes.push({ act, x0: bx, x1: bx + bw, y0: y + 98, y1: y + 136 });
        });
    };
    SaveView.prototype.save = function() {
        const list = this._list, id = list.savefileId();
        if (!this.allowed() || !list.isEnabled(id)) { SoundManager.playBuzzer(); list.activate(); return; }
        if (DataManager.savefileInfo(id) && !this._sure) {   // (a file with a game in it: asked first)
            this._ask = { yes: false, id };
            list.deactivate();
            this.drawCard();
            this.scene.drawKeys();
            return;
        }
        this._sure = false;
        $gameSystem.setSavefileId(id);
        $gameSystem.onBeforeSave();
        this._saving = true;
        DataManager.saveGame(id)
            .then(() => { SoundManager.playSave(); this._note = "Zapisano w pliku " + id + "."; this._saving = false; list.refresh(); this.drawCard(); if (this.inside) list.activate(); })
            .catch(() => { SoundManager.playBuzzer(); this._note = "Nie udało się zapisać."; this._saving = false; this.drawCard(); if (this.inside) list.activate(); });
    };
    SaveView.prototype.answer = function(yes) {
        this._ask = null;
        this.scene.drawKeys();
        if (yes) { this._sure = true; this.save(); return; }
        SoundManager.playCancel();
        this._list.activate();
        this.drawCard();
    };
    SaveView.prototype.update = function() {
        if (this.root.visible && this._list.scrollY() !== this._sy) this.drawCard();
        if (!this._ask || !this.ready()) return;
        if (Input.isRepeated("left") || Input.isRepeated("right")) { this._ask.yes = !this._ask.yes; SoundManager.playCursor(); this.drawCard(); }
        else if (Input.isTriggered("ok")) this.answer(this._ask.yes);
    };
    SaveView.prototype.cancel = function() {
        if (!this._ask) return false;
        this.answer(false);
        return true;
    };
    SaveView.prototype.touch = function(x, y) {
        if (!this._ask) return;
        const q = (this._askBoxes || []).find(q => inBox(q, x, y));
        if (q) this.answer(q.act === "yes");
    };
    SaveView.prototype.info = function() { return { save: { id: this._list.savefileId(), note: this._note, ask: !!this._ask, allowed: this.allowed() } }; };

    // ==================================================================
    // Wyjdź: to the title, out of the game, or back to the list
    // ==================================================================
    const END = [["title", "Do ekranu tytułowego"], ["exit", "Wyjdź z gry"], ["back", "Wróć"]];
    const ENDL = { y: 230, row: 58, w: 640 };
    function EndView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
        this._sel = 0;
    }
    EndView.prototype = Object.create(View.prototype);
    EndView.prototype.constructor = EndView;
    EndView.prototype.keys = function() { return [["W/S", "wybierz"], ["O", "potwierdź"], ["P", "wróć"]]; };
    EndView.prototype.enter = function() { this._sel = 0; View.prototype.enter.call(this); };
    EndView.prototype.redraw = function() {
        const b = this._bg.bitmap, ctx = b.context, R = RX();
        b.clear();
        header(b, "Wyjdź");
        tx(b, "Zakończyć grę?", R.lx, R.y0 + 116, 30, { top: true, face: "bold" });
        tx(b, "To, czego nie zapisałeś, przepadnie.", R.lx, R.y0 + 160, 21, { top: true, color: K.muted });
        END.forEach(([sym, label], i) => {
            const y = R.y0 + ENDL.y + i * ENDL.row, on = i === this._sel;
            rr(ctx, R.lx - 8, y, ENDL.w, 48, 10, on ? (this.inside ? K.acc : K.accDim) : K.cell);
            tx(b, label, R.lx + 14, y + 24, 24, { face: "bold", color: on && this.inside ? K.sel : K.text });
        });
        const id = DataManager.latestSavefileId(), info = id >= 0 ? DataManager.savefileInfo(id) : null;
        if (info) tx(b, "Ostatni zapis: " + (id === 0 ? "autozapis" : "plik " + id) + " · " + [dayOf(info), info.place].filter(Boolean).join(" · ") + (info.timestamp ? " · " + stampOf(info.timestamp) : ""),
            R.lx, R.y1 - 52, 19, { top: true, color: K.muted, max: R.rx - R.lx });
        done(b);
    };
    EndView.prototype.update = function() {
        if (!this.ready()) return;
        if (this.mouseMoved()) { const p = touchAt(), k = this.rowAt(p.x, p.y); if (k >= 0 && k !== this._sel) { this._sel = k; this.redraw(); } }
        if (Input.isRepeated("down") || Input.isRepeated("up")) {
            this._sel = (this._sel + (Input.isRepeated("down") ? 1 : END.length - 1)) % END.length;
            SoundManager.playCursor();
            this.redraw();
        } else if (Input.isTriggered("ok")) this.choose();
    };
    EndView.prototype.rowAt = function(x, y) {
        const R = RX();
        if (x < R.lx - 8 || x > R.lx - 8 + ENDL.w) return -1;
        return END.findIndex((e, i) => { const by = R.y0 + ENDL.y + i * ENDL.row; return y >= by && y <= by + 48; });
    };
    EndView.prototype.touch = function(x, y) {
        const k = this.rowAt(x, y);
        if (k < 0) return;
        if (k === this._sel) this.choose(); else { this._sel = k; SoundManager.playCursor(); this.redraw(); }
    };
    EndView.prototype.choose = function() {
        const sym = END[this._sel][0];
        if (sym === "back") { this.scene.leaveView(); return; }
        SoundManager.playOk();
        this.scene._closing = true;
        this.scene.fadeOutAll();
        if (sym === "title") SceneManager.goto(Scene_Title);
        else SceneManager.exit();
    };
    EndView.prototype.info = function() { return { end: { sel: END[this._sel][0] } }; };

    // ==================================================================
    // Another plugin's command (MenuPanel.addCommand - "Plan karczmy"): O opens its own screen
    // ==================================================================
    function ExtraView(scene, def) {
        View.call(this, scene, def);
        this._bg = this.layer();
    }
    ExtraView.prototype = Object.create(View.prototype);
    ExtraView.prototype.constructor = ExtraView;
    ExtraView.prototype.redraw = function() {
        const b = this._bg.bitmap, R = RX();
        b.clear();
        header(b, this.def.label, "osobny ekran");
        tx(b, "O otwiera „" + this.def.label + "” na osobnym ekranie.", R.lx, R.y0 + 124, 22, { top: true, color: K.soft, max: R.rx - R.lx });
        tx(b, "P wraca stamtąd do tego menu.", R.lx, R.y0 + 158, 22, { top: true, color: K.muted });
        done(b);
    };

    // the settings' rows in the graphite look (the menu's Opcje and the title's options alike): the name in the text's colour, "Tak" /
    // "Nie", the volumes and the opacity as thin copper bars with their value
    const _optDraw = Window_Options.prototype.drawItem;
    Window_Options.prototype.drawItem = function(index) {
        if (!useMenu() || !this.itemLineRect) return _optDraw.call(this, index);
        const symbol = this.commandSymbol(index), title = this.commandName(index), r = this.itemLineRect(index, false), c = this.contents, en = this.isCommandEnabled(index);
        if (this.isDefaultSymbol && this.isDefaultSymbol(symbol)) { textOut(c, title, r.x, r.y, r.width, r.height, "center", { size: 17, color: K.acc, plain: true }); return; }
        textOut(c, title, r.x, r.y, r.width, r.height, "left", { size: 18, color: en ? C.text : C.dim, plain: true });
        const s = this.itemLineRect(index, true), status = this.statusText(index), value = this.getConfigValue(symbol);
        if (this.isGaugeSymbol && this.isGaugeSymbol(symbol)) {
            const rate = this.isVolumeSymbol(symbol) ? value / 100 : this.isToneSymbol && this.isToneSymbol(symbol) ? (value + 255) / 510 : value / 255;
            textOut(c, status, s.x, s.y, 56, s.height, "right", { size: 16, plain: true });
            meter(c.context, s.x + 66, s.y + Math.round(s.height / 2) - 2, s.width - 70, 4, rate, K.acc);
            c._baseTexture.update();
        } else {
            const text = symbol !== "uiClean" && value === true ? "Tak" : symbol !== "uiClean" && value === false ? "Nie" : status;
            textOut(c, text, s.x, s.y, s.width - 4, s.height, "right", { size: 17, color: value === false ? C.muted : K.acc, plain: true });
        }
    };

    const VIEWS = { hero: PostacView, equip: EquipView, skills: SkillsView, item: BagView, journal: JournalView, options: OptionsView, save: SaveView, gameEnd: EndView };

    // ==================================================================
    // The menu scene in the graphite look: the list, the page, the keys
    // ==================================================================
    const _create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _create.call(this);
        this._grafit = useMenu();
        this._cardOn = this._grafit;   // (an older name the tests used)
        if (this._grafit) this.createLista();
    };
    const atLayer = scene => scene.children.indexOf(scene._windowLayer);
    Scene_Menu.prototype.createLista = function() {
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
        const add = s => { this.addChildAt(s, atLayer(this)); return s; };
        this._dim = add(new Sprite(new Bitmap(16, 16)));
        this._dim.bitmap.fillAll("rgb(10,10,12)");
        this._dim.scale.set(W() / 16, H() / 16);
        this._dim.opacity = 0;
        this._rightBg = add(new Sprite(new Bitmap(W(), H())));
        panelShadow(this._rightBg.bitmap.context, L.right.x, L.right.y, L.right.w, L.right.h);
        done(this._rightBg.bitmap);
        this._viewLayer = add(new Sprite());
        this._listSpr = add(new Sprite(new Bitmap(W(), H())));
        this._keys = add(new Sprite(new Bitmap(W(), L.keysH)));
        this._keys.y = L.keysY;
        this._overLayer = new Sprite();   // (over the windows: the bag's question and its plates)
        this.addChild(this._overLayer);
        // the menu shown smaller (UI.s) round the middle over the keys: the panel, the pages, the tabs, the windows, the questions
        const o = uiOff();
        for (const s of [this._rightBg, this._viewLayer, this._listSpr, this._windowLayer, this._overLayer]) { s.scale.set(UI.s, UI.s); s.position.set(o.x, o.y); }
        menuKeys(true);
        // the rows: the menu's own, then any other plugin's command (it opens its own screen, as before)
        this._entries = ENTRIES.slice();
        cw._list.forEach((c, i) => { if (!OWN.has(c.symbol) && c.symbol !== "skills") this._entries.push({ sym: c.symbol, label: c.name, extra: true, i }); });
        this._views = {};
        this._t = 0;
        let start = $gameTemp._menuTab || "hero";
        if (start === "hero" && ($gameTemp._heroSub === "equip" || $gameTemp._heroSub === "skills")) start = $gameTemp._heroSub;   // (the old way to ask for a part of Postać)
        const back = SceneManager._previousClass && SceneManager._previousClass !== Scene_Map;
        if (back && !$gameTemp._menuTab && $gameTemp._menuLast) start = $gameTemp._menuLast;   // (back from another plugin's screen: on its row)
        const inside = ($gameTemp._menuLevel || 1) >= 2;
        $gameTemp._menuTab = null;
        $gameTemp._menuLevel = null;
        $gameTemp._heroSub = null;
        $gameTemp._menuLast = null;
        if (back) this._t = 40;   // (no second entrance)
        this._sel = Math.max(0, this._entries.findIndex(e => e.sym === start));
        this._inside = false;
        this.showEntry(true);
        if (inside && !this._entries[this._sel].extra) this.enterView(true);
        this.drawList();
        this.drawKeys();
    };
    // the row of tabs over the panel (the menu's own eight, then the other plugins' commands): an icon and a word each, the chosen one a
    // copper pill (brown while its page has the keys, the others dimmed); a small count of the points to give on Postać and
    // Umiejętności; the day, the season, the hour and the place small over the row on the right. No second row: each tab is its page.
    Scene_Menu.prototype.drawList = function() {
        const b = this._listSpr.bitmap, ctx = b.context, inside = this._inside, xp = heroXp(), n = this._entries.length, T0 = L.tabs;
        b.clear();
        tx(b, dayWords() + "   ·   " + placeName(), L.right.x + L.right.w - 6, 8, 16, { top: true, align: "right", color: K.muted });
        const pad = 12, isz = 32, gap = 6, avail = L.right.w;
        let size = 19;
        const widthOf = (e, s) => pad * 2 + isz + 8 + measure(e.label, s, "bold");
        const totalOf = s => this._entries.reduce((a, e) => a + widthOf(e, s), 0) + gap * (n - 1);
        while (totalOf(size) > avail && size > 14) size--;
        let x = Math.round(L.right.x + (avail - totalOf(size)) / 2), ready = true;
        const y = T0.y, h = T0.h, cy = y + h / 2;
        this._rowBoxes = [];
        this._entries.forEach((e, i) => {
            const on = i === this._sel, w = widthOf(e, size);
            if (on) rr(ctx, x, y, w, h, 10, inside ? K.accDim : K.acc);
            const ic = entryIcon(e);
            if (ic) {
                b.paintOpacity = inside && !on ? 102 : 255;
                ctx.imageSmoothingEnabled = false;
                b.blt(ic, 0, 0, ic.width, ic.height, x + pad, Math.round(cy - isz / 2), isz, isz);
                b.paintOpacity = 255;
            } else if (e.icon) ready = false;
            const col = on ? (inside ? K.text : K.sel) : inside ? K.dim : K.soft;
            tx(b, e.label, x + pad + isz + 8, cy + 1, size, { face: on ? "bold" : null, color: col });
            // (points to give: a small copper count on the tab's corner)
            const pts = !xp ? 0 : e.sym === "hero" ? xp.points : e.sym === "skills" ? xp.skillPoints : 0;
            if (pts > 0) {
                const bx = x + w - 6, by = y + 4;
                ctx.save(); ctx.fillStyle = on && !inside ? K.sel : K.acc; ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
                tx(b, String(pts), bx, by, 15, { face: "bold", align: "center", color: on && !inside ? K.acc : K.sel });
            }
            this._rowBoxes.push({ i, x0: x, x1: x + w, y0: y, y1: y + h });
            x += w + gap;
        });
        done(b);
        this._listReady = ready && CH.facesReady();
    };
    // the bar of keys at the foot: always the same pattern - the keys of what has them now
    Scene_Menu.prototype.keyPairs = function() {
        const v = this._view, e = this._entries[this._sel];
        if (this._inside && v) return v.keys();
        return [["A/D", "zakładka"], ["O", e && e.extra ? "otwórz" : "wybierz"], ["P", "wróć do gry"]];
    };
    Scene_Menu.prototype.drawKeys = function() {
        const b = this._keys.bitmap, ctx = b.context, pairs = this.keyPairs();
        b.clear();
        ctx.fillStyle = K.strip;
        ctx.fillRect(0, 0, W(), L.keysH);
        hl(ctx, 0, W(), 0);
        const KB = { h: 30, size: 19, text: 20, gap: 38 };   // (the bar's keys a little smaller too - the user, 2026-10-23)
        const widths = pairs.map(([k, t]) => Math.max(KB.h, measure(k, KB.size, "bold") + 16) + 9 + measure(t, KB.text)), gap = KB.gap;
        let x = Math.round((W() - (widths.reduce((a, w) => a + w, 0) + gap * (pairs.length - 1))) / 2);
        const cy = L.keysH / 2;
        pairs.forEach(([k, t], i) => {
            const kw = keycap(b, x, cy, k, { h: KB.h, size: KB.size });
            tx(b, t, x + kw + 9, cy + 1, KB.text);
            x += widths[i] + gap;
        });
        done(b);
    };
    Scene_Menu.prototype.view = function(e) {
        if (!e) return null;
        if (!this._views[e.sym]) {
            const V = e.extra ? ExtraView : VIEWS[e.sym];
            this._views[e.sym] = V ? new V(this, e) : null;
        }
        return this._views[e.sym];
    };
    // the chosen row's page shown (a short fade in)
    Scene_Menu.prototype.showEntry = function(quiet) {
        const v = this.view(this._entries[this._sel]);
        if (this._view && this._view !== v) this._view.hide();
        this._view = v;
        if (v) { v.show(); v.setAlpha(quiet ? 1 : 0); }
        this._fade = quiet ? null : { t: 0 };
    };
    Scene_Menu.prototype.moveSel = function(dir) { const n = this._entries.length; this.goEntry((this._sel + dir + n) % n); };
    Scene_Menu.prototype.goEntry = function(i) {
        if (i === this._sel || i < 0 || i >= this._entries.length) return;
        if (this._inside) this.leaveView(true);
        SoundManager.playCursor();
        this._sel = i;
        this.showEntry(false);
        this.drawList();
        this.drawKeys();
    };
    // O: into the page (another plugin's command: its own screen)
    Scene_Menu.prototype.enterView = function(quiet) {
        const e = this._entries[this._sel];
        this._levelT = Graphics.frameCount;
        if (!e) return;
        if (e.extra) {
            const cw = this._commandWindow;
            if (!cw.isCommandEnabled(e.i)) { SoundManager.playBuzzer(); return; }
            SoundManager.playOk();
            $gameTemp._menuLast = e.sym;
            cw.select(e.i);
            cw.callOkHandler();
            cw.deactivate();
            return;
        }
        const v = this._view;
        if (!v) return;
        if (!quiet) SoundManager.playOk();
        this._inside = true;
        v.enter();
        this.drawList();
        this.drawKeys();
    };
    // P: back to the list
    Scene_Menu.prototype.leaveView = function(quiet) {
        this._levelT = Graphics.frameCount;
        if (!quiet) SoundManager.playCancel();
        this._inside = false;
        if (this._view) this._view.exit();
        this.drawList();
        this.drawKeys();
    };
    // P in a page: its smaller step goes back first; else back to the list (heard: the window has played the sound already)
    Scene_Menu.prototype.onViewCancel = function(heard) {
        if (this._levelT === Graphics.frameCount) return;
        if (this._view && this._view.cancel()) { this._levelT = Graphics.frameCount; this.drawKeys(); return; }
        this.leaveView(!!heard);
    };
    Scene_Menu.prototype.closeMenu = function() {
        if (this._closing) return;
        this._closing = true;
        SoundManager.playCancel();
        if (this._views.options) ConfigManager.save();
        this.popScene();
    };
    Scene_Menu.prototype.inputReady = function() {
        return !SceneManager.isSceneChanging() && this.isActive() && !this._closing && this._t > 6;
    };
    Scene_Menu.prototype.rowAt = function(x, y) {
        const q = (this._rowBoxes || []).find(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y < r.y1);
        return q ? q.i : -1;
    };
    const _update = Scene_Menu.prototype.update;
    Scene_Menu.prototype.update = function() {
        _update.call(this);
        if (!this._grafit) return;
        if (!useMenu() && !this._closing) { this.closeMenu(); return; }   // (Wygląd switched to the classic look: the map, then the old menu)
        this._t++;
        const k = ease(this._t / 14), show = ease(this._t / 12);
        if (this._blur) this._blur.blur = 1.5 * k;
        this._dim.opacity = Math.round(255 * 0.68 * k);
        for (const s of [this._listSpr, this._rightBg, this._keys]) s.opacity = Math.round(255 * show);
        const v = this._view;
        let a = show;
        if (this._fade) { const f = ++this._fade.t; a *= ease(f / 8); if (f >= 8) this._fade = null; }
        if (v) v.setAlpha(a);
        if (!this._listReady && this._t % 5 === 0) this.drawList();
        if (v) v.update();
        if (!this.inputReady() || this._levelT === Graphics.frameCount) return;
        const back = Input.isTriggered("cancel") || TouchInput.isCancelled();
        if (!this._inside) {   // (the row of tabs: A / D - the arrows ← / → - choose, O in, P out of the menu)
            if (Input.isRepeated("right")) { this.moveSel(1); return; }
            if (Input.isRepeated("left")) { this.moveSel(-1); return; }
            if (Input.isTriggered("ok")) { this.enterView(); return; }
            if (back) { this.closeMenu(); return; }
        } else if (v && v.spriteInput() && back) { this.onViewCancel(); return; }
        if (TouchInput.isTriggered()) {
            const p = touchAt(), x = p.x, y = p.y, row = this.rowAt(x, y), R = L.right;   // (the menu's own places: shown smaller - UI.s)
            // the mouse: a tab - chosen and in; the page - in, then its own click
            if (row >= 0) {
                if (row !== this._sel) this.goEntry(row);
                if (!this._inside) this.enterView();
                return;
            }
            if (!this._inside) { if (x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h) this.enterView(); return; }
            if (v) v.touch(x, y);
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
        const v = this._view, e = this._entries[this._sel], pairs = this.keyPairs();
        const out = { tabs: this._entries.map(x => x.sym), labels: this._entries.map(x => x.label), active: e ? e.sym : null, level: this._inside ? 2 : 1, inside: this._inside,
            fade: !!this._fade, window: { visible: this._commandWindow.visible, active: this._commandWindow.active }, keys: pairs.map(p => p[1]), keyCaps: pairs.map(p => p[0]),
            activeWindows: v ? v.windows.filter(w => w.active).map(w => w.constructor.name) : [], rows: (this._rowBoxes || []).map(r => ({ i: r.i, x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 })) };
        if (v) Object.assign(out, v.info());
        return out;
    };

    if (!(window.$plugins || []).some(p => p && p.name === "Equipment" && p.status) && !T.api("Equipment")) PluginManager.loadScript("Equipment");
    if (!(window.$plugins || []).some(p => p && p.name === "Drops") && !T.api("Drops")) PluginManager.loadScript("Drops");   // (the bundles - "Wyrzuć")

    window.MenuRing = T.register(PLUGIN, { files: filesInfo, drawSaveCard, fillOldPlaces, placeOfSave, placeFill, ENTRIES, TABS: ENTRIES, L, K, heroXp, needRows, debtInfo,
        opinionInfo, totals, eqCells, VIEWS, SORTS, GROUPS, sortBag, groupOf, bagSort, equipSlotOf, UI: { s: UI.s, toScreen, toLocal },
        info: () => { const s = SceneManager._scene; return s instanceof Scene_Menu && s.menuInfo ? s.menuInfo() : null; } });
})();
