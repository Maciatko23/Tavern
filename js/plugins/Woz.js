//=============================================================================
// Woz.js
//=============================================================================
// "Szybka podróż wozem" (the user, 2026-10-24): the carter Wojciech (TownLife "woznica", K15's man by the south gate at night) carries
// the hero between the stops of his round by day - the town's south gate, Podgrodzie's square, the road by grandpa's field in Kruczy
// Jar, the forest road, the harbour (POSTOJE below: the map, the cart, where he stands, where the hero gets off). By a timetable
// (PLAN: 7:00-19:30 the cart stands at a stop or is on the road) the cart and the carter are at one stop at a time: on Map008 the
// TownLife resident walks to the cart (his plan's entry with the condition "wozMiasto"), on the other maps an event of this plugin
// stands in for him (ids 3000-3001, Tawerna.inject; hidden while the cart is elsewhere - the maps stay as they are).
// "Podwieź mnie" is a row of his menu (Tawerna.talk.option; the menu itself: a takeover at the "shop" band, so K15 and every other
// quest speak first - docs/ROZMOWY.md); the destination is chosen on the island's sketch (MapaWyspy.choose) among the stops he knows
// (the map visited) and may go to (grandpa's field shut by the Lord - Homes/Story.fieldLocked - is "zamknięte"); the fare grows with
// the road (CENA: 2 G + 2 G a map), the clock runs on (0.5 h a map - Needs run down as awake), the screen goes black and he gets off
// by the cart at the stop (a blocked tile: the nearest free one). Not at night, not with a beast or a man after him (Farming's
// restDanger), the dog / the eagle / the raven come along as on any transfer (their own performTransfer hooks).
// After a ride the cart stays at that stop an hour (the save: Tawerna.state("woz").ride), then the timetable goes on.
// Texts: js/teksty/woz.txt. Shortfalls (the hour, the money, a beast) are popups over the hero, never a message window.

/*:
 * @target MZ
 * @plugindesc Wóz Wojciecha: szybka podróż wozem między postojami (miasto, Podgrodzie, Kruczy Jar, Leśna droga, Przystań) za opłatą, z upływem czasu. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TownLife
 * @orderAfter MapaWyspy
 * @orderAfter Farming
 *
 * @help
 * ============================================================================
 * Woz.js - szybka podróż wozem
 * ============================================================================
 * Wojciech (woźnica z miasteczka) kursuje za dnia (7:00-19:30) między
 * postojami: brama południowa miasta, plac Podgrodzia, droga przy działce
 * w Kruczym Jarze, Leśna droga, Przystań. Gdy stoi przy wozie, w jego
 * rozmowie jest wiersz „Podwieź mnie”: cel wybierasz na mapie wyspy
 * (strzałki, O jedź, P wróć) spośród postojów, które już znasz.
 * Cena: 2 G + 2 G za każdą mapę drogi; czas: pół godziny za mapę.
 * Nie jeździ nocą, nie gdy goni cię zwierzę albo trwa walka, nie na
 * działkę zamkniętą przez Lorda. Pies, orzeł i kruk jadą z tobą.
 * Rozkład (PLAN w kodzie) i postoje (POSTOJE) można zmienić w tym pliku;
 * zdarzenie „Miejsce: woz_<postój>” na mapie przesuwa postój.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Woz.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Woz";
    if (T.api(PLUGIN)) return;
    const TX = window.Watki && Watki.teksty ? Watki.teksty("woz") : {};
    const wstaw = (t, v) => (window.Watki && Watki.wstaw ? Watki.wstaw(String(t || ""), v) : String(t || ""));
    const word = key => { let o = TX; for (const p of String(key).split(".")) { if (!o || typeof o !== "object") return ""; o = o[p]; } return typeof o === "string" ? o : ""; };
    const list = key => { let o = TX; for (const p of String(key).split(".")) { if (!o || typeof o !== "object") return []; o = o[p]; } return Array.isArray(o) ? o : []; };
    const CH = () => T.api("CleanHUD");
    const hm = h => { const c = CH(); return c && c.hm ? c.hm(h) : String(Math.floor(h)) + ":" + String(Math.round((h % 1) * 60)).padStart(2, "0"); };

    // ------------------------------------------------------------------ the stops and the round
    // key: { map, woz: [x, y] the cart (its event: the bottom middle of the picture), woznica: [x, y, dir] the carter, land: [x, y, dir]
    // the hero getting off }. "miasto": the TownLife spot woz_pld (54,90) - the carter is the resident himself there.
    const POSTOJE = {
        miasto: { map: 8, woz: [56, 90], woznica: [54, 90, 2], land: [52, 90, 6] },          // (the street along the wall, right of the gate's tower)
        podgrodzie: { map: 111, woz: [53, 37], woznica: [51, 37, 2], land: [50, 37, 6] },   // (the square, east of the dry well)
        jar: { map: 3, woz: [75, 12], woznica: [73, 12, 2], land: [72, 12, 6] },            // (the road in from Skraj lasu)
        lesna: { map: 21, woz: [7, 20], woznica: [5, 20, 2], land: [4, 20, 6] },             // (the road in from Polna droga)
        przystan: { map: 125, woz: [106, 17], woznica: [104, 17, 2], land: [103, 17, 6] }   // (the road in from Podgrodzie, before the trees)
    };
    const KEYS = Object.keys(POSTOJE);
    // the day: [hour, stop | null (on the road)] - the last entry at or before the hour holds; before the first: nothing (night)
    const PLAN = [[7, "miasto"], [8, null], [8.5, "podgrodzie"], [9, null], [9.5, "przystan"], [10.5, null], [11.5, "miasto"], [12.5, null],
        [13.5, "lesna"], [14.5, null], [16, "jar"], [17, null], [18.5, "miasto"], [19.5, null], [21.3, "miasto"], [22.7, null]];
    const GODZINY = [7, 19.5];           // when he takes passengers
    const CENA = { baza: 2, mapa: 2 };   // G: the base and each map of the road
    const GODZIN_NA_MAPE = 0.5;          // game hours a map of the road takes
    const POSTOJ_PO_JEZDZIE = 1;         // hours the cart stays where it brought him
    const IDS = { woz: 3000, woznica: 3001 };
    const SNAP_R = 4;

    const store = T.state.define("woz", () => ({ ride: null, rides: 0 }), { version: 1, owner: PLUGIN });
    const hour = () => T.time.hour(), day = () => T.time.day();
    const absNow = () => day() * 24 + hour();
    const stopOf = key => POSTOJE[key] || null;
    const stopOnMap = mapId => KEYS.find(k => POSTOJE[k].map === mapId) || null;
    const nameOf = key => word("postoj." + key) || key;
    // where the cart stands now (a stop's key) or null (on the road, the night); after a ride: at that stop for an hour
    let memo = { f: -1, v: null };
    function where() {
        if (!window.$gameSystem) return null;
        if (memo.f === Graphics.frameCount) return memo.v;
        let v = null;
        const r = store().ride, now = absNow();
        if (r && now >= r.from && now < r.until && POSTOJE[r.stop]) v = r.stop;
        else { const h = hour(); for (const [at, stop] of PLAN) if (at <= h) v = stop; }
        memo = { f: Graphics.frameCount, v };
        return v;
    }
    const inHours = h => { const x = h === undefined ? hour() : h; return x >= GODZINY[0] && x < GODZINY[1]; };
    // the stop the cart stands at on this map now (null: not here)
    const hereStop = () => { const k = where(); return k && window.$gameMap && POSTOJE[k].map === $gameMap.mapId() ? k : null; };
    // the hours a stop has the cart (the timetable, for the place's card): "7:00-8:00, 11:30-12:30"
    function hoursOf(key) {
        const out = [];
        for (let i = 0; i < PLAN.length; i++) {
            if (PLAN[i][1] !== key) continue;
            const from = PLAN[i][0], to = i + 1 < PLAN.length ? PLAN[i + 1][0] : 24;
            if (from >= GODZINY[1]) continue;
            out.push(hm(from) + "-" + hm(Math.min(to, GODZINY[1])));
        }
        return out;
    }

    // ------------------------------------------------------------------ the road: maps between two stops (MapaWyspy's roads), the fare, the time
    function hops(a, b) {
        const M = T.api("MapaWyspy"), from = String(POSTOJE[a].map), to = String(POSTOJE[b].map);
        if (!M || !M.neighbours) return 1;
        const seen = new Set([from]);
        let front = [from], n = 0;
        while (front.length && n < 20) {
            if (front.includes(to)) return n;
            n++;
            const next = [];
            for (const k of front) for (const q of M.neighbours(k)) if (!seen.has(q)) { seen.add(q); next.push(q); }
            front = next;
        }
        return n || 1;
    }
    const priceOf = n => CENA.baza + CENA.mapa * n;
    const timeOf = n => GODZIN_NA_MAPE * n;
    function timeWords(h) {
        const min = Math.round(h * 60), hh = Math.floor(min / 60), mm = min % 60, parts = [];
        if (hh > 0) parts.push(wstaw(word("czas.godz"), { h: hh }));
        if (mm > 0 || !parts.length) parts.push(wstaw(word("czas.min"), { m: mm }));
        return parts.join(" ");
    }
    // a stop shut by the story: grandpa's field taken by the Lord (Homes.js refuses the way in)
    function closed(key) {
        if (key !== "jar") return false;
        const H = T.api("Homes"), S = T.api("Story");
        try { if (H && H.held && H.held(3)) return true; if (S && S.fieldLocked && S.fieldLocked()) return true; } catch (e) { /* (open) */ }
        return false;
    }
    const known = key => { const M = T.api("MapaWyspy"); return !!M && M.discovered(POSTOJE[key].map); };
    // the stops he can be asked for from `from`: known, not this one; closed or too dear: with the reason (shown, not chosen)
    function destinations(from) {
        const out = [], gold = window.$gameParty ? $gameParty.gold() : 0, h = hour();
        for (const key of KEYS) {
            if (key === from || !known(key)) continue;
            const n = hops(from, key), cena = priceOf(n), czas = timeOf(n), arrive = (h + czas) % 24;
            const it = { id: POSTOJE[key].map, key, label: nameOf(key), cena, czas, hops: n,
                note: wstaw(word("scena.wiersz"), { cena, czas: timeWords(czas), godzina: hm(arrive) }), enabled: true, why: "" };
            if (closed(key)) { it.enabled = false; it.why = word("powod.zamkniete"); }
            else if (gold < cena) { it.enabled = false; it.why = wstaw(word("powod.brak"), { n: cena - gold }); }
            out.push(it);
        }
        return out;
    }
    // why he cannot take him now (null: he can): the hour, a beast or a man after the hero
    function cannot() {
        if (!inHours()) return word("odmowa.noc");
        const FP = T.api("Farming_parts"), build = FP && FP.build;
        let danger = "";
        try { danger = build && build.restDanger ? build.restDanger() : ""; } catch (e) { danger = ""; }
        if (danger) return wstaw(word("odmowa.zagrozenie"), { kto: danger });
        return null;
    }
    const popup = text => T.popup(text, { kind: "need" });

    // ------------------------------------------------------------------ the talk: "Podwieź mnie" and his menu (docs/ROZMOWY.md)
    const serving = () => !!hereStop() && inHours();
    let said = 0;
    function greet(ev) {
        const lines = list("wita"), text = lines.length ? lines[said++ % lines.length] : "";
        if (!text) return [];
        const out = [], LINE = 46, words = text.split(/\s+/), rows = [];
        let line = "";
        for (const w of words) { if (line && (line + " " + w).length > LINE) { rows.push(line); line = w; } else line = line ? line + " " + w : w; }
        if (line) rows.push(line);
        for (let i = 0; i < rows.length; i += 3) {
            out.push({ code: 101, indent: 0, parameters: ["", 0, 0, 2, word("zdarzenie.woznica").replace(/\s*\(.*$/, "") || "Wojciech"] });
            rows.slice(i, i + 3).forEach((l, j) => out.push({ code: 401, indent: 0, parameters: [(j === 0 ? "\\SPK[" + ev.eventId() + "]" : "") + l] }));
        }
        return out;
    }
    T.talk.option({ owner: PLUGIN, id: "podwoz", who: "woznica", when: () => serving(), label: () => word("menu.podwiez") || "Podwieź mnie",
        run: () => [{ code: 355, indent: 0, parameters: ["Woz.pick(this);"] }] });
    // his menu while he serves: a word of his, the rows (ours and anyone's), the farewell - under the quests (K15 first)
    T.talk.takeover({ owner: PLUGIN, who: "woznica", priority: T.talk.PRIORITY.shop + 5, run: ctx => {
        if (!serving() || !ctx.ev) return null;
        const rows = T.talk.rows("woznica", ctx, []);
        if (!rows.length) return null;
        const out = greet(ctx.ev);
        return T.talk.menu(out, rows, word("menu.bywaj") || "Bywaj.");
    } });
    // the row chosen: the choice of the stop on the island's sketch, then the ride (the interpreter waits: wait mode "woz")
    function pick(interp) {
        const from = hereStop();
        if (!from || !interp) return false;
        const why = cannot();
        if (why) { popup(why); return false; }
        const items = destinations(from);
        if (!items.some(i => i.enabled)) { popup(word("odmowa.nieznane")); return false; }
        const M = T.api("MapaWyspy");
        if (!M || !M.choose) return false;
        $gameTemp._wozPick = null;
        $gameTemp._wozFrom = from;
        const start = items.filter(i => i.enabled).sort((a, b) => a.hops - b.hops)[0];
        const ok = M.choose({ title: word("scena.tytul"), items, start: start ? start.id : undefined, okWord: word("scena.jedz") || undefined,
            onPick: id => { const it = items.find(i => String(i.id) === String(id)); $gameTemp._wozPick = it ? it.key : null; } });
        if (!ok) return false;
        interp.setWaitMode("woz");
        return true;
    }
    const _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "woz") {
            if (SceneManager.isSceneChanging() || !(SceneManager._scene instanceof Scene_Map)) return true;
            this._waitMode = "";
            const key = $gameTemp._wozPick, from = $gameTemp._wozFrom;
            $gameTemp._wozPick = null;
            $gameTemp._wozFrom = null;
            if (key && from && ride(this, from, key)) return true;
            return false;
        }
        return _updateWaitMode.call(this);
    };
    // the ride: the fare, the hours, the cart to the stop, the hero off by it (the companions follow by their own hooks)
    let pending = null;
    function ride(interp, from, key) {
        const to = stopOf(key), src = stopOf(from);
        if (!to || !src || closed(key)) return false;
        const n = hops(from, key), cena = priceOf(n), czas = timeOf(n);
        if ($gameParty.gold() < cena) { popup(wstaw(word("odmowa.pieniadze"), { cena })); return false; }
        $gameParty.loseGold(cena);
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(czas); else $gameSystem.setDayNightHour(hour() + czas);
        const s = store(), now = absNow();
        s.ride = { stop: key, from: now, until: now + POSTOJ_PO_JEZDZIE };
        s.rides = (s.rides || 0) + 1;
        memo.f = -1;
        pending = { key, from, cena, czas, n };
        $gamePlayer.reserveTransfer(to.map, to.land[0], to.land[1], to.land[2] || 2, 0);
        if (!$gamePlayer.isTransferring()) { pending = null; return false; }
        if (interp) interp.setWaitMode("transfer");
        T.emit("wozRide", { from, to: key, map: to.map, cena, godzin: czas, mapy: n });
        return true;
    }
    // off the cart: on a free tile (the hero's place may be taken), a word of where he is
    const free = (x, y) => $gameMap.isValid(x, y) && [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority());
    function arrive() {
        const p = pending;
        pending = null;
        if (!p || !window.$gameMap || $gameMap.mapId() !== POSTOJE[p.key].map) return;
        const x = $gamePlayer.x, y = $gamePlayer.y;
        if (!free(x, y)) {
            let best = null, bd = 1e9;
            for (let dy = -SNAP_R; dy <= SNAP_R; dy++) for (let dx = -SNAP_R; dx <= SNAP_R; dx++) {
                if (!free(x + dx, y + dy)) continue;
                const d = Math.hypot(dx, dy);
                if (d < bd) { bd = d; best = [x + dx, y + dy]; }
            }
            if (best) $gamePlayer.locate(best[0], best[1]);
        }
        refreshEvents();
        const text = wstaw(word("przyjazd"), { miejsce: nameOf(p.key), cena: p.cena, czas: timeWords(p.czas) });
        if (!T.popup(text, { kind: "info" })) setTimeout(() => { try { T.popup(text, { kind: "info" }); } catch (e) { /* (no popup) */ } }, 0);
        arrived = Object.assign({ at: Graphics.frameCount, text }, p);
    }
    let arrived = null;
    T.on("mapReady", () => { if (pending) arrive(); else refreshEvents(); }, { owner: PLUGIN });
    T.on("mapEnter", () => { memo.f = -1; refreshEvents(); }, { owner: PLUGIN });

    // ------------------------------------------------------------------ the cart (and the carter off Map008) on the stop maps
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const C = (code, params, indent) => ({ code, indent: indent || 0, parameters: params });
    function eventData(id, name, x, y, o) {
        const img = o.img || ["", 0, 2, 1];
        const page = { conditions: Object.assign({}, BLANK), directionFix: o.fix !== false, image: { tileId: 0, characterName: img[0], direction: img[2], pattern: img[3], characterIndex: img[1] },
            list: o.list, moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: !!o.walk };
        return { id, name, note: "<Woz:" + o.key + ">" + (o.note || ""), pages: [page], x, y };
    }
    // a map's "Miejsce: woz_<key>" event moves the cart (the carter and the landing keep their offsets)
    function spotOf(data, key) {
        const st = POSTOJE[key], m = (data.events || []).find(e => e && new RegExp("^Miejsce:\\s*woz_" + key + "\\s*$", "i").test(e.name || ""));
        if (!m) return st;
        const dx = m.x - st.woz[0], dy = m.y - st.woz[1];
        return { map: st.map, woz: [m.x, m.y], woznica: [st.woznica[0] + dx, st.woznica[1] + dy, st.woznica[2]], land: [st.land[0] + dx, st.land[1] + dy, st.land[2]] };
    }
    const live = {};   // key -> the stop as the map has it (its "Miejsce:" event)
    function build(data, mapId) {
        const key = stopOnMap(mapId);
        if (!key) return [];
        const st = live[key] = spotOf(data, key), out = [];
        out.push(eventData(IDS.woz, word("zdarzenie.woz") || "Wóz", st.woz[0], st.woz[1], { key: "woz", img: ["!$Lud_Woz", 0, 2, 1], note: "<Occupy:left=1,right=1,up=1>",
            list: [C(355, ["Woz.look(this);"]), C(0, [])] }));
        if (key !== "miasto") out.push(eventData(IDS.woznica, word("zdarzenie.woznica") || "Wojciech", st.woznica[0], st.woznica[1],
            { key: "woznica", img: ["$Npc_Woznica", 0, st.woznica[2] || 2, 1], list: [C(355, ["Woz.talk(this);"]), C(0, [])] }));
        return out;
    }
    T.inject("*", { ids: [IDS.woz, IDS.woznica], owner: PLUGIN, build });
    function setShown(ev, on) {
        if (!ev || ev._wozShown === on) return;
        ev._wozShown = on;
        ev.setTransparent(!on);
        ev.setThrough(!on);
        ev._priorityType = on ? 1 : 0;
    }
    function refreshEvents() {
        if (!window.$gameMap) return;
        const key = stopOnMap($gameMap.mapId());
        if (!key) return;
        const here = where() === key;
        setShown($gameMap.event(IDS.woz), here);
        setShown($gameMap.event(IDS.woznica), here);
    }
    T.onEventStart(ev => !!(ev && ev._wozShown === false), { owner: PLUGIN, priority: "hidden" });
    T.onMapUpdate(() => refreshEvents(), { owner: PLUGIN, name: "postoj", every: 20 });
    // the stand-in carter's talk off Map008: the core's service (the quests may take it; his usual lines else - TownLife's words)
    let own = 0;
    function ownLines(ev) {
        const TL = T.api("TownLife"), t = TL && TL.lines ? TL.lines("woznica") || {} : {}, h = hour();
        const rain = (() => { const w = $gameScreen.weatherType(); return (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0; })();
        const slot = rain && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const lines = t[slot] || t.day || [];
        if (!lines.length) return null;
        const text = lines[own++ % lines.length], out = [], rows = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) { if (line && (line + " " + w).length > 46) { rows.push(line); line = w; } else line = line ? line + " " + w : w; }
        if (line) rows.push(line);
        for (let i = 0; i < rows.length; i += 3) {
            out.push(C(101, ["", 0, 0, 2, "Wojciech"]));
            rows.slice(i, i + 3).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + ev.eventId() + "]" : "") + l])));
        }
        return out;
    }
    function talk(interp) {
        const ev = $gameMap.event(interp.eventId());
        if (!ev || ev._wozShown === false) return;
        T.talk.run(interp, "woznica", { ev, owner: PLUGIN, base: () => ownLines(ev) });
    }
    function look(interp) {
        const ev = $gameMap.event(interp.eventId()), lines = list("woz.ogladanie");
        if (!ev || !lines.length) return;
        const out = [C(101, ["", 0, 0, 2, ""])];
        let line = "", rows = [];
        for (const w of lines[0].split(/\s+/)) { if (line && (line + " " + w).length > 46) { rows.push(line); line = w; } else line = line ? line + " " + w : w; }
        if (line) rows.push(line);
        rows.slice(0, 3).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[0]" : "") + l])));
        interp.setupChild(out.concat([C(0, [])]), ev.eventId());
    }

    // ------------------------------------------------------------------ TownLife: the resident's plan on Map008 follows the cart
    (function townLife() {
        const TL = T.api("TownLife");
        if (!TL || !TL.addCondition) return;
        TL.addCondition("wozMiasto", () => where() === "miasto");
    })();

    // the place's card (MapaWyspy): the stop and its hours
    function stopInfo(placeId) {
        const key = KEYS.find(k => String(POSTOJE[k].map) === String(placeId));
        if (!key) return "";
        const h = hoursOf(key);
        return nameOf(key) + (h.length ? " · " + wstaw(word("postoj.godziny"), { godziny: h.join(", ") }) : "");
    }

    window.Woz = T.register(PLUGIN, {
        POSTOJE, PLAN, GODZINY, CENA, GODZIN_NA_MAPE, IDS, KEYS,
        where, hereStop, inHours, serving, hoursOf, hops, priceOf, timeOf, timeWords, closed, known, destinations, cannot, pick, ride, talk, look,
        stopInfo, nameOf, refreshEvents, state: () => store(), live: () => live, arrived: () => arrived, pending: () => pending,
        // (the tests) the ride without the talk: from the stop here to `key`
        go: key => { const from = hereStop(); return !!from && ride(null, from, key); }
    });
})();
