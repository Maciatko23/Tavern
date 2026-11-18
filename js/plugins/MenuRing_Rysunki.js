//=============================================================================
// MenuRing_Rysunki.js
//=============================================================================
// Part of MenuRing.js (refactor 2026-11-07: a big file split - these lines moved here word for word, nothing changed). It gives
// MenuRing.js its names through Tawerna.api("MenuRing_parts").kit; it must stand just above MenuRing.js on the plugin list.

/*:
 * @target MZ
 * @plugindesc Menu P - wspólne części (część MenuRing.js): obraz mapy pod menu, dane stron, rysowanie paneli, pasków i klawiszy, podstawa strony. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderBefore MenuRing
 *
 * @help
 * MenuRing_Rysunki.js - menu P: obraz pod menu, dane stron, rysowanie, podstawa strony
 * Sama nic nie robi bez MenuRing.js; musi stać tuż nad nim na liście wtyczek.
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
    const ease = T.util.easeOut;

    // ---- the mock-ups' look (tools/ui_proste/kit.py): the colours and the places on the 1280 x 720 screen
    // (2026-10-23, the user: "układ jest ok, a można kolory z klasycznego wziąć?" - black panels, the bright yellow accent #ffd23f, light
    // text, grey lines; since 2026-10-28 the game's one palette: UITheme.js's UIStyle.C, the same object as CleanHUD.C). K: the
    // menu's short names for it.
    const K = {
        text: C.text, muted: C.muted, dim: C.dim, line: C.line, soft: C.soft,
        panel: C.panel, panel2: C.panel2, cell: C.cell, empty: C.empty, track: C.track,
        acc: C.accent, accDim: C.accentDark, sel: C.onAccent, selMuted: C.accentMuted, good: C.good,
        gold: C.gold, warn: C.warn, amber: C.amber, cap: C.text, strip: C.strip
    };
    const NEED_COL = { health: C.health, stamina: C.stamina, food: C.food, water: C.water };
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
        { sym: "stats", label: "Statystyki", icon: [921, "plain"] },   // (2026-11-18: the numbers of the fight and the work, where each comes from)
        { sym: "equip", label: "Ekwipunek", icon: [435, "plain"] },   // (2026-11-18: its own tab again - the card, the silhouette, the list)
        { sym: "skills", label: "Umiejętności", icon: [89, "dark"] },
        { sym: "item", label: "Plecak", icon: [370, "plain"] },
        { sym: "journal", label: "Dziennik", icon: [499, "plain"] },
        { sym: "mapa", label: "Mapa", icon: "mapa" },   // (2026-10-24: the island's sketch - MapaWyspy.js draws the page)
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
        if (SceneManager.isNextScene(Scene_Menu)) {
            for (const c of this.children) if (c !== this._spriteset && c !== this._mindVeil) c.renderable = false;
        }
        _Scene_Map_terminate.call(this);
    };
    // (a test with the old HUD parts - ConfigManager.uiClean = false, CleanHUD.js - still gets Journal's own screen)
    const _push = SceneManager.push;
    SceneManager.push = function(sceneClass) {
        const J = T.api("Journal");
        if (CH.isClean() && J && sceneClass === J.Scene_Journal && this._scene instanceof Scene_Map) {
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
    // the four needs: [key, word, 0..1, the number shown] - all in percent (the user, 2026-11-17: "zamiast pasków sytości, wody itd.
    // niech będą tylko wartości procentowe")
    function needRows() {
        const v = CH.needValues(), pc = x => Math.round(clamp01(x) * 100) + "%", rows = [["health", "Życie", v.health, pc(v.health)]];
        rows.push(["stamina", "Kondycja", v.stamina, pc(v.stamina)]);
        if (v.food !== undefined && T.api("Needs")) {
            rows.push(["food", "Sytość", v.food, pc(v.food)]);
            rows.push(["water", "Nawodnienie", v.water, pc(v.water)]);
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
        // (2026-11-18, the new look on every page: a thin warm edge, a faint light along the top)
        ctx.shadowColor = "rgba(0,0,0,0)";
        ctx.strokeStyle = "rgba(255,210,63,0.14)";
        ctx.lineWidth = 1;
        CH.roundPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 14);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath(); ctx.moveTo(x + 16, y + 1.5); ctx.lineTo(x + w - 16, y + 1.5); ctx.stroke();
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
            if (lab) textOut(b, lab, x + kw + 7, y, measure(lab, 16) + 8, 24, "left", { size: 16, color: K.soft, plain: true });
            x += kw + (lab ? measure(lab, 16) + 26 : 8);
        }
        return x;
    }
    const smallKeysWidth = pairs => pairs.reduce((a, [k, lab]) => a + Math.max(24, measure(k, 16) + 14) + (lab ? measure(lab, 16) + 26 : 8), 0) - 26;
    // a group's heading: yellow capitals, a count, a thin line to x1; returns the x where the line starts
    // (2026-11-18, the player: "upiększyć czcionki, elementy okna i ogólnie UI") the line starts with a small gold diamond and fades out
    // to the right
    function heading(b, x, y, s, x1, n) {
        let x2 = x + tx(b, s, x, y, 20, { top: true, face: "sc", color: K.acc }) + 10;
        if (n !== undefined && n !== null && n !== "") x2 += tx(b, String(n), x2, y + 1, 19, { top: true, color: K.muted }) + 12;
        if (x1 && x1 > x2 + 16) {
            const ctx = b.context, cy = y + 12;
            ctx.save();
            ctx.fillStyle = K.acc;
            ctx.globalAlpha = 0.85;
            ctx.beginPath(); ctx.moveTo(x2 + 4, cy - 4); ctx.lineTo(x2 + 8, cy); ctx.lineTo(x2 + 4, cy + 4); ctx.lineTo(x2, cy); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
            const g = ctx.createLinearGradient(x2 + 12, 0, x1, 0);
            g.addColorStop(0, "rgba(255,210,63,0.5)");
            g.addColorStop(1, "rgba(255,210,63,0)");
            ctx.fillStyle = g;
            ctx.fillRect(Math.round(x2 + 12), Math.round(cy), Math.round(x1 - x2 - 12), 1);
            ctx.restore();
        } else if (x1 && x1 > x2) hl(b.context, x2, x1, y + 12);
        return x2;
    }
    // a box of a page (2026-11-18): the dark fill lit faintly at the top, a thin warm edge, a light line along its top, small gold
    // corner brackets
    function fancyBox(ctx, x, y, w, h, o) {
        o = o || {};
        const r = o.r === undefined ? 12 : o.r;
        ctx.save();
        ctx.fillStyle = K.panel2;
        CH.roundPath(ctx, x, y, w, h, r);
        ctx.fill();
        const g = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 220));
        g.addColorStop(0, "rgba(255,255,255,0.05)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,210,63,0.18)";
        ctx.lineWidth = 1;
        CH.roundPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath(); ctx.moveTo(x + r, y + 1.5); ctx.lineTo(x + w - r, y + 1.5); ctx.stroke();
        if (o.corners !== false) {
            const L = 14, k = 5;
            ctx.strokeStyle = K.acc;
            ctx.globalAlpha = 0.8;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            for (const [cx, cy, sx, sy] of [[x + k, y + k, 1, 1], [x + w - k, y + k, -1, 1], [x + k, y + h - k, 1, -1], [x + w - k, y + h - k, -1, -1]]) {
                ctx.beginPath(); ctx.moveTo(cx, cy + sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * L, cy); ctx.stroke();
            }
        }
        ctx.restore();
    }
    // the chosen row (2026-11-18): a gold bar lit from above, a soft glow round it, a light line along its top
    function selBar(ctx, x, y, w, h, r) {
        r = r === undefined ? 8 : r;
        ctx.save();
        ctx.shadowColor = "rgba(255,200,60,0.45)";
        ctx.shadowBlur = 14;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, "#ffe27e");
        g.addColorStop(0.5, "#ffd23f");
        g.addColorStop(1, "#e8b21c");
        ctx.fillStyle = g;
        CH.roundPath(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(Math.round(x + r), Math.round(y + 1), Math.round(w - r * 2), 1);
        ctx.restore();
    }
    // the page's head strip (under the tabs): its word in yellow capitals on the left (none: the page puts its own things there), a word
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
    // chosen one yellow; what does not fit is hidden behind "‹" / "›" and the row slides along with A / D (st.first: the first tab
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
    // a yellow edge, a small arrow to what it speaks of. arrow: { side: "left" | "right" | "up" | "down", at: x or y of its tip's line }
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
        if (tri) {   // (the arrow: filled, its two outer sides yellow, the edge under its base covered)
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
        if (e.icon === "mapa") { const M = T.api("MapaWyspy"); return M && M.tabIcon ? M.tabIcon(32) : CH.iconBitmap(499, "plain"); }
        if (Array.isArray(e.icon)) return CH.iconBitmap(e.icon[0], e.icon[1]);
        return null;
    }
    // a list window drawn flat: no cursor frame, no scroll arrows - the chosen row is painted (bg: { on, off } the fill when it has the
    // keys / not; rect(w, i) the row's whole rect when itemRect is only a part of it; repaint: the whole list drawn again on a change)
    function flatRows(w, bg) {
        w.refreshCursor = function() { this.setCursorRect(0, 0, 0, 0); };
        w.refreshCursor();   // (the frame its first select() put there - the right half of the options' first row - goes too)
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

    const CZESCI = window.Tawerna.api("MenuRing_parts") || window.Tawerna.register("MenuRing_parts", {});
    CZESCI.kit = { T, CH, PLUGIN, C, textOut, measure, W, H, ease, K, NEED_COL, L, RX, UI, uiOff, toLocal, toScreen, touchAt,
        ENTRIES, OWN, menuKeys, placeFill, placeOfSave, fillOldPlaces, plural, item, MP, num1, pctTxt, weightTxt, cap1, dayWords,
        placeName, heroXp, needRows, debtInfo, opinionInfo, wrapWords, rr, panelShadow, hl, vl, meter, done, tx, keycap, smallKeys,
        smallKeysWidth, heading, header, STRIP_TOP, tabStrip, inBox, tick, bubble, entryIcon, flatRows, fitRows, drawMore, View, fancyBox, selBar };
})();
