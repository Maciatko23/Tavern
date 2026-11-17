//=============================================================================
// Wesele.js
//=============================================================================
// The thread W18 "Wesele w Złotym Kuflu" (docs/zadania_nowe/wesele.md) - the ENGINE; the data: Wesele_Data.js, the words:
// js/teksty/wesele.txt, the two mini-games (the table plan, the first dance): Wesele_Gry.js. What the data cannot do:
//   - the events of the wedding on the tavern's maps (Tawerna.inject, ids 3200-3239 i 3280-3299): the groom and the bride in Sunday clothes,
//     brother Kleofas, the 18 guests at the hall's four long tables (the seated figures are Przytulna's - they sit where the plan seats
//     them), the kitchen's counter, the plan board, ten places for wreaths and sashes, twelve candles, the seven places of the search
//   - the day 22 (the clock): the hall is the wedding's (Goscie_Sala's own guests stay out), the scenes S1 the wedding, S2 the toasts,
//     S3 the first dance (a mini-game), S4 the groom's gone, S5 the brawl and the four ways of ending it, the courses served from the
//     kitchen's counter, the mood of the hall (the food + the music + the decorations + the plan + the speeches + the dance)
//   - the search (23:00 - 4:00): seven places with a trace and a gag each, the groom on the terrace of the apartments (Map026)
//   - the morning on the terrace (day 23, 6-12) and the endings A-D, the rewards, the modest wedding (not taken: the thread fails)
// A scene = an interpreter's list (the hero is held): one script command per step - Wesele.krok(this, scene, i) - which says a bubble,
// moves an actor, plays a sound and then waits; P skips the rest (the steps' effects still happen).
// API: window.Wesele (Tawerna.api("Wesele")): stan(), sala(), nastroj(), iskry(), plan(), akcja(interp, key), krok, wymus(...) for the tests.

/*:
 * @target MZ
 * @plugindesc [W18] Wesele w Złotym Kuflu - silnik: zdarzenia w tawernie, dzień wesela (ślub, toasty, taniec, zniknięcie pana młodego, bójka), noc poszukiwań, poranek, zakończenia A-D. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Wesele_Data
 * @orderAfter Dezerter
 * @orderAfter Goscie_Sala
 *
 * @help
 * ============================================================================
 * Wesele.js - wątek W18 „Wesele w Złotym Kuflu”
 * ============================================================================
 * Zlecenie od Borgara w dniach 19-20 (przy barze: „Borgarze, coś ci chodzi po
 * głowie?”). Wesele w dniu 22, o piętnastej. F9 → „Wyspa i fabuła” →
 * „Wątek W18”: skoki do rozdziałów.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.WeseleData;
    if (!T || !window.Watki || !D) throw new Error("Wesele.js: brak TawernaCore.js / Watki.js / Wesele_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Wesele";
    const w = D.watek, TXT = D.TX, M = D.MAP, G = D.GODZ;
    const fill = Watki.wstaw;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const SB = () => T.api("SpeechBubbles");
    const TQ = () => T.api("TownQuests");
    const TL = () => T.api("TownLife");
    const P = () => T.api("Podroznicy") || window.Podroznicy || null;
    const tx = k => w.tekst(k);
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    const report = (where, e) => console.error("[Wesele] " + where + ":", e);
    const COIN = 314;
    const mapNow = () => ($gameMap ? $gameMap.mapId() : 0);
    const evOf = id => ($gameMap ? $gameMap.event(id) : null);
    const spkOf = ev => ({ id: ev ? ev.eventId() : -1, name: ev && ev.event() ? String(ev.event().name || "") : "" });

    // ==================================================================
    // 1. The clock, the phases, the mood, the sparks
    // ==================================================================
    const aktywne = () => has() && S().z === 1;
    const dzienWesela = () => D.DNI.ceremonia;
    // the hall is the wedding's (Goscie_Sala keeps its guests out): from 14:00 of the day 22 to the morning of 23
    const sala = () => aktywne() && ((day() === D.DNI.ceremonia && hour() >= 14) || (day() === D.DNI.epilog && hour() < 8)) && !S().epilog;
    const weselnyDzien = () => aktywne() && day() === D.DNI.ceremonia;
    const kartaIdx = k => D.KARTY.findIndex(c => c.k === k);
    // the plan: card key -> seat (0-23): table = floor(s / 6), place = s % 6 (the first column of stools 0-2, the second 3-5)
    const miejsceXY = s => { const t = D.SALA.stoly[Math.floor(s / 6)], l = s % 6; return { x: t.x[l < 3 ? 0 : 1], y: D.SALA.wiersze[l % 3], stol: Math.floor(s / 6), strona: l < 3 ? 6 : 4 }; };
    // (the tables' seating when the hero left it to Borgar: the cards in the order of the list, round the tables - a fixed one)
    function planBorgara() {
        const out = {}, order = D.KARTY.map(c => c.k), seats = [];
        for (let i = 0; i < 24; i++) seats.push(i);
        // the first tables get the first cards, a few feuds therefore sit together - that is the point of the plan
        const perm = seats;
        order.forEach((k, i) => { out[k] = perm[i]; });
        return out;
    }
    const planAktualny = () => (S().planOk && Object.keys(S().plan).length ? S().plan : planBorgara());
    function iskry(plan) {
        const p = plan || planAktualny();
        let n = 0;
        for (const [a, b] of D.WASNIE) { if (p[a] !== undefined && p[b] !== undefined && Math.floor(p[a] / 6) === Math.floor(p[b] / 6)) n++; }
        return n;
    }
    function iskrySpis(plan) {
        const p = plan || planAktualny();
        return D.WASNIE.filter(([a, b]) => p[a] !== undefined && p[b] !== undefined && Math.floor(p[a] / 6) === Math.floor(p[b] / 6));
    }
    // two next to each other: the same table, the same side and the rows one apart, or across at the same row
    function obok(a, b) {
        if (a === undefined || b === undefined || Math.floor(a / 6) !== Math.floor(b / 6)) return false;
        const la = a % 6, lb = b % 6;
        return (Math.floor(la / 3) === Math.floor(lb / 3) && Math.abs(la % 3 - lb % 3) === 1) || (la % 3 === lb % 3 && la !== lb);
    }
    function nastroj() {
        const s = S(), N = D.NASTROJ, parts = {};
        parts.baza = N.baza;
        const podane = s.podane || [];
        parts.jedzenie = podane.reduce((a, p) => a + (p.v || 0) * N.danie, 0) + (podane.some(p => p.tort) ? N.tort : 0);
        parts.muzyka = (s.muzyka === 1 ? Object.keys(s.piesni).length : 0) * N.piesn;
        parts.ozdoby = Math.round(s.wiszace.filter(i => D.DEKOR[i] && D.DEKOR[i][2] === "wianek").length * N.wianek + s.wiszace.filter(i => D.DEKOR[i] && D.DEKOR[i][2] === "szarfa").length * N.szarfa + s.swiece.length * N.swieca);
        const n = s.iskry >= 0 ? s.iskry : iskry();
        parts.plan = N.plan0 + n * N.planIskra + (obok(planAktualny()[D.MILOSC[0]], planAktualny()[D.MILOSC[1]]) ? N.milosc : 0);
        parts.toast = s.przemowa ? N.toast[s.przemowa - 1] : 0;
        parts.taniec = s.taniec >= 6 ? N.taniec : s.taniec >= 0 ? 2 : 0;
        const sum = Object.values(parts).reduce((a, b) => a + b, 0);
        return { parts, n: Math.max(0, Math.min(100, Math.round(sum))) };
    }
    const nastrojLiczba = () => nastroj().n;

    // ==================================================================
    // 2. The events (Tawerna.inject, 3200-3239 i 3280-3299)
    // ==================================================================
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const C = (code, params) => ({ code, indent: 0, parameters: params || [] });
    // (a figure's event: image sheet / index / direction, the action's script, the note's tags)
    function evData(id, name, x, y, o) {
        o = o || {};
        const img = o.tile ? { tileId: o.tile, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }
            : { tileId: 0, characterName: o.sheet || "", direction: o.dir || 2, pattern: o.pattern === undefined ? 1 : o.pattern, characterIndex: o.index || 0 };
        return { id, name, note: "<Wesele:" + (o.key || id) + ">" + (o.note || ""), x, y, pages: [{ conditions: Object.assign({}, COND), directionFix: o.fix !== false && !o.walk,
            image: img, list: [C(355, ["Wesele.akcja(this, " + JSON.stringify(o.key || String(id)) + ");"]), C(0)],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: o.speed || 3, moveType: 0,
            priorityType: o.pri === undefined ? 1 : o.pri, stepAnime: !!o.step, through: !!o.through, trigger: o.trigger === undefined ? 0 : o.trigger, walkAnime: o.walk !== false }] };
    }
    const ID = { pan: 3200, panna: 3201, kleofas: 3202, kot: 3203, hanka: 3204, ozzy: 3205, wit: 3206, mietek: 3207, wojciechK: 3208, bartekK: 3209, gosc0: 3210,
        lada: 3228, tablica: 3229, tort: 3230, dekor0: 3280, swieca0: 3290, beczka: 3231, drzwi: 3232, platki: 3233 };
    const MIEJSCE_STAN = { gosc: 3210, kleofas: 3202 };
    // the groups of events that exist at a time (every event is a character sprite, and TownQuests' per-sprite markers make the cost grow with their number):
    // p the preparations (counter, board, the places still waiting), w the wedding (the couple, Kleofas, the 18 guests), k the bachelor's evening,
    // s the search, m the morning - the map is made again (reload) when the group changes while the hero is in the tavern
    function grp() {
        if (!has() || S().z !== 1) return "";
        const s = S(), d = day(), h = hour();
        const sz = s.szuka.t0 > 0 && !s.szuka.koniec;
        return [d <= D.DNI.ceremonia ? "p" : "", (d === D.DNI.ceremonia && h >= 12) || (d === D.DNI.epilog && !s.epilog && h < 8) ? "w" : "", d === 21 && h >= 19 ? "k" : "", sz ? "s" : "",
            d === D.DNI.epilog && !s.epilog && s.szuka.koniec > 0 ? "m" : ""].join("");
    }
    let builtGrp = "";
    function buildMap(data, mapId) {
        const out = [];
        const add = (...a) => out.push(evData(...a));
        const g = builtGrp = grp(), has_ = c => g.includes(c), s0 = S();
        if (mapId === M.karczma) {
            if (has_("w")) {
                add(ID.pan, "Wojciech", 13, 24, { sheet: D.POSTAC.pan, key: "pan", dir: 8 });
                add(ID.panna, "Dorota", 15, 24, { sheet: D.POSTAC.panna, key: "panna", dir: 8 });
                add(ID.kleofas, "Brat Kleofas", 14, 22, { sheet: D.POSTAC.kleofas, key: "kleofas", dir: 2 });
                D.KARTY.forEach((c, i) => { const m = miejsceXY(i); add(ID.gosc0 + i, c.imie, m.x, m.y, { sheet: "$Npc_" + c.cialo, key: "g:" + c.k, dir: m.strona, walk: true, step: false, fix: false, trigger: 0 }); });
            }
            if (has_("s")) {
                add(ID.kot, "Kot Borgara", 11, 15, { sheet: D.POSTAC.kot, key: "kot", dir: 2, trigger: -1 });
                add(ID.hanka, "Hanka Mączna", 9, 9, { sheet: "$Npc_Piekarka", key: "m:kuchnia", dir: 2 });
                add(ID.ozzy, "Dziadek Ozzy", 40, 35, { sheet: "$Npc_Ozzy", key: "m:gry", dir: 2 });
                add(ID.wit, "Kapral Wit", 30, 33, { sheet: "$Npc_Kapral", key: "m:palarnia", dir: 6 });
                add(ID.mietek, "Mietek Kwaśniak", 32, 33, { sheet: "$Npc_Kowal", index: 0, key: "m:palarnia2", dir: 4 });
                add(ID.beczka, "Beczka", D.MIEJSCA[0].x, D.MIEJSCA[0].y, { key: "m:beczka", sheet: "" });
            }
            if (has_("k")) {
                add(ID.wojciechK, "Wojciech", 38, 35, { sheet: "$Npc_Woznica", key: "kaw:wojciech", dir: 6, trigger: -1 });
                add(ID.bartekK, "Bartek", 40, 36, { sheet: "$Npc_Bartek", key: "kaw:bartek", dir: 4, trigger: -1 });
            }
            if (has_("p")) {
                add(ID.lada, "Lada weselna", D.LADA.x, D.LADA.y, { key: "lada", pri: 1, sheet: "" });
                add(ID.tablica, "Plan stołów", D.TABLICA.x, D.TABLICA.y, { sheet: "!$Wesele_Tablica", key: "tablica", dir: 2, pattern: 1, walk: false });
                if (s0.tort >= 2 && !(s0.podane || []).some(p => p.tort)) add(ID.tort, "Tort weselny", D.TORT_MIEJSCE.x, D.TORT_MIEJSCE.y, { sheet: "!$Wesele_Tort", key: "tort", dir: 2, walk: false, trigger: -1, note: "<Px:0,-16>" });
                D.DEKOR.forEach((d, i) => !s0.wiszace.includes(i) && add(ID.dekor0 + i, d[2] === "wianek" ? "Wieszak na wianek" : "Wieszak na szarfę", d[0], d[1], { sheet: "!$Wesele_Znak", key: "d:" + i, dir: 2, walk: false, pri: 2 }));
                D.SWIECE.forEach((c, i) => !s0.swiece.includes(i) && add(ID.swieca0 + i, "Świeca weselna", c[0], c[1], { sheet: "!$Wesele_Swieca", key: "s:" + i, dir: 2, walk: false, pri: 0, note: c[1] === 17 ? "<Px:0,-12>" : "<Px:0,-6>" }));
            }
        } else if (mapId === M.pietro) {
            if (has_("s")) {
                add(ID.drzwi, "Drzwi pokoju", D.MIEJSCA[4].x, D.MIEJSCA[4].y, { key: "m:drzwi", sheet: "" });
                add(ID.platki, "Płatki", D.MIEJSCA[5].x, D.MIEJSCA[5].y, { key: "m:platki", sheet: "!$Wesele_Platki", dir: 2, walk: false, pri: 0 });
            }
        } else if (mapId === M.apartamenty) {
            if (has_("s") || has_("m") || (s0.szuka.znal && !s0.epilog)) add(ID.pan, "Wojciech", D.MIEJSCA[6].x, D.MIEJSCA[6].y, { sheet: D.POSTAC.pan, key: "pan", dir: 2 });
            if (has_("m")) {
                add(ID.panna, "Dorota", D.MIEJSCA[6].x + 1, D.MIEJSCA[6].y, { sheet: D.POSTAC.panna, key: "panna", dir: 2 });
                add(ID.ozzy, "Dziadek Ozzy", D.MIEJSCA[6].x + 4, D.MIEJSCA[6].y, { sheet: "$Npc_Ozzy", key: "m:taras", dir: 4, trigger: -1 });
            }
        }
        return out;
    }
    // (the candles lit by the end of the lighting: light at map load only for lit ones - Tawerna lights are read once per map)
    // (the candles' glow: the table lights that stand there already - no light of ours, a light costs a frame's time)
    const swiecaNote = () => "";
    const wlaczone = () => has() && S().z === 1 && day() <= D.DNI.ostatni;
    // (two ranges: the ids above ~3300 make Game_Map.events() 17 times slower on the map - a sparse array in V8's slow mode - so the band is packed into free ids below that)
    for (const [lo, hi] of [[3200, 3239], [3280, 3299]]) T.inject([M.karczma, M.pietro, M.apartamenty], { ids: [lo, hi], owner: D.OWNER, when: () => wlaczone(), build: (data, mapId) => buildMap(data, mapId).filter(e => e.id >= lo && e.id <= hi) });


    // ==================================================================
    // 2b. The hall's decorations as ONE picture each: the hung wreaths and sashes (above the people), the lit candles (below them) - two sprites instead
    // of twenty-two events; events stay only for the places still waiting for the hero's O
    // ==================================================================
    let warstwa = null;
    class Warstwa {
        constructor(set) {
            this.set = set; this.list = [];
            this.img = ["!$Wesele_Wianek", "!$Wesele_Szarfa", "!$Wesele_Swieca"].map(n => ImageManager.loadCharacter(n));
            this.dirty = true; this.n = { wianki: 0, szarfy: 0, swiece: 0 };
        }
        // plain sprites (no Game_Event, no Sprite_Character) of the done places, the frame of the sheet cut out; rebuilt only when something changed
        paint() {
            if (!this.img.every(b => b.isReady())) return;
            const s = S();
            for (const o of this.list) { this.set._tilemap.removeChild(o.sp); o.sp.destroy(); }
            this.list = []; this.n = { wianki: 0, szarfy: 0, swiece: 0 };
            const add = (im, sx, sy, tx2, ty2, off, z) => {
                const sp = new Sprite(im); sp.setFrame(sx, sy, 48, 48); sp.anchor.set(0.5, 1); sp.z = z;
                this.set._tilemap.addChild(sp); this.list.push({ sp, x: tx2, y: ty2, off });
            };
            for (const i of s.wiszace) { const d = D.DEKOR[i]; if (!d) continue; add(d[2] === "wianek" ? this.img[0] : this.img[1], 48, 0, d[0], d[1], 0, 5); this.n[d[2] === "wianek" ? "wianki" : "szarfy"]++; }
            for (const i of s.swiece) { const c = D.SWIECE[i]; if (!c) continue; add(this.img[2], 48, 48, c[0], c[1], c[1] === 30 ? -12 : -6, 1); this.n.swiece++; }
            this.dirty = false;
        }
        update() {
            if (this.dirty) this.paint();
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            for (const o of this.list) { o.sp.x = Math.round(($gameMap.adjustX(o.x) + 0.5) * tw); o.sp.y = Math.round(($gameMap.adjustY(o.y) + 1) * th) + o.off; }
        }
    }
    const _createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _createCharacters.call(this);
        warstwa = null;
        if (has() && $gameMap.mapId() === M.karczma && wlaczone() && !(window.__wesX && window.__wesX.noLayer)) warstwa = new Warstwa(this);
    };
    const _smUpdate = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() { _smUpdate.call(this); if (warstwa && warstwa.set === this) warstwa.update(); };

    // ==================================================================
    // 3. Who is where now (presence of the events), per frame-light tick
    // ==================================================================
    const szukaTrwa = () => aktywne() && S().szuka.t0 > 0 && !S().szuka.koniec;
    const poranek = () => aktywne() && day() === D.DNI.epilog && hour() >= G.poranek[0] && hour() < G.poranek[1] && !S().epilog && S().szuka.koniec > 0;
    function naStole(i) { return !(window.__wesX && window.__wesX.noGuests) && sala() && day() === D.DNI.ceremonia && hour() >= 14.5 && !S().szuka.t0; }
    function stan(id) {   // should the event `id` be visible and live on this map now
        const s = S(), m = mapNow(), h = hour(), d = day();
        if (m === M.karczma) {
            if (id === ID.pan || id === ID.panna) return weselnyDzien() && h >= 14.5 && !s.scen.znik;
            if (id === ID.kleofas) return weselnyDzien() && h >= 14.5 && h < 17 && !s.scen.slubKoniec2;
            if (id >= ID.gosc0 && id < ID.gosc0 + D.KARTY.length) return naStole() && !fightersOut(id);
            if (id === ID.lada) return true;
            if (id === ID.tablica) return d <= D.DNI.ceremonia;
            if (id === ID.tort) return s.tort >= 2 && d <= D.DNI.ceremonia + 0 && !(s.podane || []).some(p => p.tort);
            if (id >= ID.dekor0 && id < ID.dekor0 + D.DEKOR.length) return true;
            if (id >= ID.swieca0 && id < ID.swieca0 + D.SWIECE.length) return true;
            if (id === ID.wojciechK || id === ID.bartekK) return d === 21 && h >= G.kawalerski[0] && h < G.kawalerski[1];
            if (id === ID.kot) return !!s.szuka.kot;
            if (id === ID.hanka || id === ID.ozzy || id === ID.wit || id === ID.mietek) return szukaTrwa() && !s.szuka.znal;
            if (id === ID.beczka) return szukaTrwa();
        } else if (m === M.pietro) {
            return szukaTrwa();
        } else if (m === M.apartamenty) {
            if (id === ID.pan) return (szukaTrwa() && !s.szuka.znal) || poranek() || (s.szuka.znal && !s.epilog && day() <= D.DNI.epilog);
            if (id === ID.panna) return poranek();
            if (id === ID.ozzy) return poranek();
        }
        return false;
    }
    function ukladStan(ev) {
        const id = ev.eventId(), on = !!stan(id), st = ev._wes || (ev._wes = {}), q = S();
        const sig = on + "|" + day() + "|" + q.wiszace.join(",") + "|" + q.swiece.join(",") + "|" + q.tort;
        if (st.sig === sig) return;
        st.sig = sig; st.on = on;
        const de = ev.event(), pg = de && de.pages[0];
        ev.setTransparent(!on);
        ev._trigger = on ? (pg ? pg.trigger : 0) : -1;
        ev.setThrough(on ? !!(pg && pg.through) : true);
        // (the places not done yet: the diamond / the unlit candle; the done ones are drawn by the hall's one picture layer, not by events)
        if (id >= ID.dekor0 && id < ID.dekor0 + D.DEKOR.length) { ev.setImage("!$Wesele_Znak", 0); ev.setDirectionFix(false); ev.setDirection(2); ev.setDirectionFix(true); ev.setPattern(1); if (on) { ev._trigger = 0; ev.setThrough(false); } }
        if (id >= ID.swieca0 && id < ID.swieca0 + D.SWIECE.length) { ev.setImage("!$Wesele_Swieca", 0); ev.setDirectionFix(false); ev.setDirection(2); ev.setDirectionFix(true); ev.setPattern(1); if (on) ev._trigger = 0; }
        if (id === ID.tort) { ev.setImage("!$Wesele_Tort", 0); ev.setPattern(1); }
    }
    let ticker = 0;
    function tick() {
        if (!has() || !wlaczone() || (window.__wesX && window.__wesX.noTick)) return;
        if (scena.next && !scena.on && !$gameMap.isEventRunning()) { const f = scena.next; scena.next = null; try { f(); } catch (e) { report("koniec sceny", e); } }
        if (!scena.on) fightTick();
        if (($gameMap._interpreter && $gameMap._interpreter.isRunning()) || ++ticker % 30) return;
        if (!SceneManager._scene || !(SceneManager._scene instanceof Scene_Map)) return;
        const m = mapNow();
        if (m !== M.karczma && m !== M.pietro && m !== M.apartamenty) return;
        // no scan of the map's events: only when the state of the wedding changed (one short signature every half second) the few events of ours are set again
        const q = S(), sig = m + "|" + JSON.stringify([q.z, q.scen, q.szuka, q.bojka.t0, q.bojka.koniec, q.epilog, q.tort, q.wiszace.length, q.swiece.length, q.plan, day(), Math.floor(hour() * 4)]);
        if (sig === sigLast && dataLast === $dataMap) return;
        sigLast = sig; dataLast = $dataMap;
        if (grp() !== builtGrp && !$gameTemp._wesPlan && !scena.on && !scena.next && T.isCalm && T.isCalm(SceneManager._scene)) { builtGrp = grp(); reload(); return; }
        if (idsOf !== $dataMap) { idsOf = $dataMap; ids = $dataMap.events.filter(e => e && e.id >= D.IDS[0] && e.id <= D.IDS[1]).map(e => e.id); }
        for (const id of ids) { const ev = evOf(id); if (ev) ukladStan(ev); }
        if (!$gameTemp._wesPlan) planSeats();
    }
    let sigLast = "", dataLast = null, idsOf = null, ids = [];

    // the guests of the plan: each card at its seat (a seated figure: Przytulna draws it when it stands on a chair)
    function planSeats() {
        if (mapNow() !== M.karczma || !naStole()) return;
        const p = planAktualny(), brawl = S().bojka.t0 && !S().bojka.koniec;
        D.KARTY.forEach((c, i) => {
            const ev = evOf(ID.gosc0 + i);
            if (!ev || ev._wes && ev._wes.walking) return;
            const s = p[c.k];
            if (s === undefined || brawl && fighters.has(ev.eventId())) return;
            const m = miejsceXY(s);
            if (ev.x !== m.x || ev.y !== m.y) { if (!ev.isMoving()) { ev.locate(m.x, m.y); } }
            ev.setDirection(m.strona);
        });
    }

    // ==================================================================
    // 4. Actions (the events' scripts)
    // ==================================================================
    const talk = (interp, name, ev, extra) => {
        const lista = w.rozmowa(name, Object.assign({ spk: spkOf(ev), ev }, extra || {}));
        Watki.mowa.uruchom(interp, lista);
    };
    // (a talk again at run time: the sad song sends Melia's question round once more - built at build time it would never end)
    function ponow(interp, name) { const ev = actor("melia"); Watki.mowa.uruchom(interp, w.rozmowa(name, { spk: spkOf(ev), ev })); }
    function akcja(interp, key) {
        if (!interp || !has()) return;
        const ev = evOf(interp.eventId());
        try {
            if (key === "lada") return talk(interp, "lada", ev);
            if (key === "tablica") return talk(interp, "tablica", ev);
            if (key === "pan") return panRozmowa(interp, ev);
            if (key === "panna") return pannaRozmowa(interp, ev);
            if (key === "kleofas") return say(ev, "scena.slub.kleofas.1");
            if (key.startsWith("d:")) return dekoruj(interp, Number(key.slice(2)), ev);
            if (key.startsWith("s:")) return swieca(interp, Number(key.slice(2)), ev);
            if (key.startsWith("g:")) return gosc(interp, key.slice(2), ev);
            if (key.startsWith("m:")) return miejsce(interp, key.slice(2), ev);
        } catch (e) { report("akcja " + key, e); }
    }
    function say(ev, key, frames) {
        const t = tx(key), SBb = SB();
        if (t && SBb && SBb.say && ev) SBb.say(ev, [].concat(t)[0], frames || 160);
    }
    function mowi(interp, ev, klucze) {
        const out = [];
        for (const k of listOf(klucze)) { const t = [].concat(tx(k) || []); Watki.mowa.linesTo(out, spkOf(ev), t, {}, 0, w.say || undefined); }
        Watki.mowa.uruchom(interp, out);
    }
    const popup = (text, o) => T.popup(text, o || {});
    function zloto(n) { if (n > 0) { $gameParty.gainGold(n); popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" }); } }
    const renoma = (n, why) => { const p = P(); if (p && p.renoma) p.renoma(n, why); };
    const opinia = n => T.call("TownQuests", "addOpinion", n, tx("zadania.W18.title"));
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdz = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const item = id => (window.$dataItems ? $dataItems[id] : null);
    const ile = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const reload = () => { try { $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 2); } catch (e) { report("reload", e); } };

    // ---------------------------------------------------------------- the ten places for wreaths and sashes, the twelve candles
    function dekoruj(interp, i, ev) {
        const s = S(), d = D.DEKOR[i];
        if (!d || s.wiszace.includes(i)) return;
        const wianek = d[2] === "wianek", ma = wianek ? s.wianki : s.szarfy;
        if (!(ma > 0)) { popup(fill(tx("napis.potrzeba"), { co: wianek ? "wianek (Halina)" : "szarfa (Dorota)" }), { kind: "need" }); return; }
        if (wianek) s.wianki--; else s.szarfy--;
        s.wiszace.push(i);
        T.audio.se("Cursor2", { volume: 70, pitch: 110 });
        if (ev) ev.erase();
        if (warstwa) warstwa.dirty = true;
        if (s.wiszace.length === D.DEKOR.length) {
            SB() && SB().say && SB().say($gamePlayer, tx("ozdoby.gotowe"), 200);
            popup(tx("ozdoby.gotowe"), { kind: "info" });
        }
        sprawdz();
    }
    const pochodniaPlonie = () => { const t = T.api("Torch") || window.Torch; try { return !!(t && t.isLit && t.isLit()); } catch (e) { return false; } };
    function swieca(interp, i, ev) {
        const s = S();
        if (s.swiece.includes(i)) return;
        if (!pochodniaPlonie()) { popup(tx("swieca.brak"), { kind: "need", icon: 436 }); return; }
        s.swiece.push(i);
        T.audio.se("Fire1", { volume: 50, pitch: 140 });
        if (ev) ev.erase();
        if (warstwa) warstwa.dirty = true;
        if (s.swiece.length === D.SWIECE.length) {
            popup(tx("swieca.gotowe"), { kind: "info" });
        }
        sprawdz();
    }

    // ---------------------------------------------------------------- the guests: a word, and during the brawl the menu
    const SLOWA_GOSCI = ["gosc.1", "gosc.2", "gosc.3", "gosc.4", "gosc.5", "gosc.6"];
    function gosc(interp, k, ev) {
        const s = S();
        if (s.bojka.t0 && !s.bojka.koniec) return talk(interp, "bojka", ev);
        const own = tx("gosc." + k);
        const lines = own ? own : tx(SLOWA_GOSCI[(kartaIdx(k) + day()) % SLOWA_GOSCI.length]);
        mowi(interp, ev, own ? "gosc." + k : SLOWA_GOSCI[(kartaIdx(k) + day()) % SLOWA_GOSCI.length]);
    }
    function pannaRozmowa(interp, ev) {
        if (poranek()) return talk(interp, "poranek", ev);
        mowi(interp, ev, "panna.slowo");
    }
    function panRozmowa(interp, ev) {
        if (mapNow() === M.apartamenty && szukaTrwa() && !S().szuka.znal) return talk(interp, "pan", ev);
        if (mapNow() === M.apartamenty && poranek()) return talk(interp, "poranek", ev);
        mowi(interp, ev, "pan.slowo");
    }

    // ==================================================================
    // 5. Scenes: an interpreter's list of single steps (the hero held; P skips the rest)
    // ==================================================================
    const scena = { on: false, id: "", steps: [], skip: false, wait: 0, next: null };
    const walkers = [];
    function idz(ev, x, y, o) {
        if (!ev) return;
        o = o || {};
        walkers.push({ ev, x, y, through: o.through === true, done: false, speed: o.speed || 4 });
        ev.setThrough(true);
        ev.setMoveSpeed(o.speed || 4);
    }
    function walkTick() {
        for (let i = walkers.length - 1; i >= 0; i--) {
            const k = walkers[i], ev = k.ev;
            if (!ev || ev._erased) { walkers.splice(i, 1); continue; }
            if (ev.isMoving()) continue;
            k.t = (k.t || 0) + 1;
            const dx = Math.abs(k.x - ev.x) < 0.45 ? 0 : Math.sign(k.x - ev.x), dy = Math.abs(k.y - ev.y) < 0.45 ? 0 : Math.sign(k.y - ev.y);
            if ((!dx && !dy) || k.t > 900) { if (k.t > 900) ev.locate(k.x, k.y); if (!k.through) ev.setThrough(false); ev._wes && (ev._wes.walking = false); walkers.splice(i, 1); continue; }
            ev._wes = ev._wes || {}; ev._wes.walking = true;
            ev.setDirectionFix(false);
            if (dx && dy) ev.moveDiagonally(dx > 0 ? 6 : 4, dy > 0 ? 2 : 8); else ev.moveStraight(dx > 0 ? 6 : dx < 0 ? 4 : dy > 0 ? 2 : 8);
        }
    }
    const idzie = () => walkers.length > 0;
    function actor(k) {
        if (k === "hero") return $gamePlayer;
        if (typeof k === "number") return evOf(k);
        if (k === "borgar") { const e = T.call("TavernLife", "npc", "borgar"); return e || evOf(1); }
        if (k === "melia") return T.call("TavernLife", "npc", "melia") || evOf(2);
        if (k === "grum") return T.call("TavernLife", "npc", "grum") || evOf(3);
        if (k === "ozzy") return T.call("TavernLife", "npc", "ozzy") || evOf(4);
        if (k && k.startsWith("g:")) return evOf(ID.gosc0 + kartaIdx(k.slice(2)));
        return evOf(ID[k]);
    }
    // the steps: { kto, tekst (key), emotka, dzwiek, czekaj, idz: [actor, x, y], twarz: [actor, dir], zrob, rozmowa, czekajChod }
    function krok(interp, id, i) {
        const st = scena.steps[i];
        if (!st) { return; }
        const skip = scena.skip;
        try {
            if (st.idz) for (const g of listOf(st.idz[0] && Array.isArray(st.idz[0]) ? st.idz : [st.idz])) { const a = actor(g[0]); if (a) { if (skip) { a.locate(g[1], g[2]); } else idz(a, g[1], g[2], { speed: g[3] }); } }
            if (st.twarz) for (const g of listOf(st.twarz[0] && Array.isArray(st.twarz[0]) ? st.twarz : [st.twarz])) { const a = actor(g[0]); if (a) a.setDirection(g[1]); }
            if (!skip) {
                if (st.tekst) { const a = actor(st.kto); if (a && SB() && SB().say) SB().say(a, [].concat(tx(st.tekst))[0], st.klatki || 150); }
                if (st.emotka) for (const k of listOf(st.emotka[0] !== undefined && Array.isArray(st.emotka[0]) ? st.emotka : [st.emotka])) { const a = actor(k[0]); if (a) $gameTemp.requestBalloon(a, k[1]); }
                if (st.dzwiek) T.audio.se(st.dzwiek[0], { volume: st.dzwiek[1] || 70, pitch: st.dzwiek[2] || 100 });
                if (st.skacz) for (const k of listOf(st.skacz)) { const a = actor(k); if (a) a.jump(0, 0); }
            }
            if (typeof st.zrob === "function") st.zrob(interp);
            if (st.rozmowa) { Watki.mowa.uruchom(interp, w.rozmowa(st.rozmowa, { spk: spkOf(actor(st.kto)) })); }
        } catch (e) { report("krok " + id + "/" + i, e); }
        const n = skip ? 1 : (st.czekaj || 30);
        interp.wait(n);
    }
    function graj(id, steps, o) {
        if (scena.on) return false;
        const I = $gameMap._interpreter;
        if (I.isRunning()) return false;
        o = o || {};
        // (the camera follows the hero: in the hall's scenes he is walked to the middle of the carpet, where all of it is seen)
        if (o.pasy !== false && mapNow() === M.karczma && Math.hypot($gamePlayer.x - 14, $gamePlayer.y - 38) > 2) steps = [{ idz: ["hero", 14, 38, 4], czekaj: 10, czekajChod: true }].concat(steps);
        scena.on = true; scena.id = id; scena.steps = steps; scena.skip = false;
        const list = [];
        if (o.pasy !== false) list.push(C(355, ["CleanHUD.sceneBars(true);"]));
        steps.forEach((st, i) => { list.push(C(355, ["Wesele.krok(this, " + JSON.stringify(id) + ", " + i + ");"])); if (st.czekajChod) list.push(C(355, ["Wesele.czekajChod(this);"])); });
        list.push(C(355, ["Wesele.koniecSceny(this, " + JSON.stringify(id) + ");"]));
        list.push(C(0));
        I.setup(list, 0);
        return true;
    }
    function czekajChod(interp) { scena.cw = (scena.cw || 0) + 1; if (idzie() && !scena.skip && scena.cw < 200) { interp._index -= 1; interp.wait(6); } else scena.cw = 0; }
    function koniecSceny(interp, id) {
        scena.on = false; scena.steps = []; scena.skip = false;
        walkers.length = 0;
        if (window.CleanHUD && CleanHUD.sceneBars) CleanHUD.sceneBars(false);
        const f = scenyKoniec[id]; if (f) scena.next = f;   // (run when the interpreter is idle: the next scene may begin)
        sprawdz();
    }
    const scenyKoniec = {};
    // P: skip - the rest of the scene runs at once
    const _upd = Game_Interpreter.prototype.update;
    Game_Interpreter.prototype.update = function() {
        if (scena.on && !scena.skip && Input.isTriggered("keyP") && this === $gameMap._interpreter) { scena.skip = true; this._waitCount = 0; }
        _upd.call(this);
    };

    // ---------------------------------------------------------------- S1 the wedding (22, 15:00)
    function sceneSlub() {
        const s = S();
        const kleo = s.kleo === 2 ? "soltys" : "kleofas";
        const ak = evOf(ID.kleofas);
        if (ak && kleo === "soltys") { ak.setImage("$Npc_Soltys", 0); }
        const pan = evOf(ID.pan), panna = evOf(ID.panna);
        const steps = [
            { zrob: () => { if (pan) pan.locate(13, 24); if (panna) panna.locate(15, 24); if (ak) ak.locate(14, 22); }, twarz: [[ID.pan, 8], [ID.panna, 8], [ID.kleofas, 2]], czekaj: 40 },
            { kto: ID.kleofas, tekst: "scena.slub.kleofas.1", czekaj: 170 },
            { kto: ID.kleofas, tekst: "scena.slub.kleofas.2", czekaj: 170 },
            { kto: "borgar", tekst: "scena.slub.borgar", emotka: ["borgar", 1], czekaj: 120 },
            { kto: ID.pan, tekst: "scena.slub.wojciech", emotka: [ID.pan, 6], czekaj: 150 },
            { kto: ID.panna, tekst: "scena.slub.dorota", czekaj: 150 },
            { kto: ID.kleofas, tekst: "scena.slub.kleofas.3", czekaj: 200 },
            { dzwiek: D.DZWIEK.dzwon, czekaj: 40 }, { dzwiek: D.DZWIEK.dzwon, czekaj: 40 }, { dzwiek: D.DZWIEK.dzwon, czekaj: 50 },
            { kto: "g:hanka", tekst: "scena.slub.hanka", emotka: [["g:hanka", 4], ["g:stefa", 4]], czekaj: 140 },
            { kto: "hero", tekst: "scena.slub.mysl", czekaj: 100 }
        ];
        s.scen.slub = 1;
        graj("slub", steps);
    }
    scenyKoniec.slub = () => { const s = S(); s.scen.slubKoniec = 1; note("notatki.slub"); const ak = evOf(ID.kleofas); if (ak) { s.scen.slubKoniec2 = 1; } };

    // ---------------------------------------------------------------- S2 the toasts (19:00)
    function sceneToast() {
        const s = S(), steps = [
            { kto: "borgar", tekst: "toast.borgar", czekaj: 200 },
            { kto: "grum", tekst: "toast.grum", emotka: ["grum", 1], czekaj: 90 },
            { kto: "g:ambrozy", tekst: "toast.ambrozy", dzwiek: ["Bell1", 60, 130], czekaj: 90 },
            { kto: "borgar", rozmowa: "toast", czekaj: 20 }
        ];
        s.scen.toast = 1;
        graj("toast", steps);
    }
    scenyKoniec.toast = () => { const s = S(); s.scen.toastKoniec = 1; if (!s.przemowa) s.przemowa = 3; const g = actor("grum"); const ev = actor("g:soltys"); T.audio.se("Applause1", { volume: 60 }); if (SB() && ev) SB().say(ev, tx("toast.tlum"), 120); };

    // ---------------------------------------------------------------- S3 the first dance (20:30) - Wesele_Gry.js's mini-game
    function sceneTaniec() {
        const s = S();
        const steps = [
            { kto: "melia", tekst: "taniec.melia", czekaj: 190 },
            { kto: ID.pan, tekst: "taniec.wojciech", emotka: [ID.pan, 6], czekaj: 110 },
            { kto: ID.panna, tekst: "taniec.dorota", czekaj: 130 },
            { zrob: interp => { s.scen.taniec = 1; $gameTemp._wesTaniec = true; }, czekaj: 10 }
        ];
        graj("taniec", steps);
    }
    scenyKoniec.taniec = () => {
        if (!$gameTemp._wesTaniec) return;
        $gameTemp._wesTaniec = false;
        const G2 = window.WeseleGry;
        if (!G2 || !G2.taniec) { S().taniec = 6; taniecWynik(6); return; }
        G2.taniec({ onEnd: r => taniecWynik(r && r.score !== undefined ? r.score : 4) });
    };
    function taniecWynik(n) {
        const s = S(); s.taniec = n; s.scen.taniecKoniec = 1;
        setTimeout(() => { const p = evOf(ID.panna); if (p && SB() && SB().say) SB().say(p, tx(n >= 6 ? "taniec.piekny" : "taniec.zly"), 200); T.audio.se("Applause1", { volume: 70 }); }, 400);
    }

    // ---------------------------------------------------------------- S4 the groom is gone (22:00), S5 the brawl
    function sceneZnik() {
        const s = S(), pan = evOf(ID.pan), panna = evOf(ID.panna);
        const steps = [
            { kto: ID.pan, tekst: "znik.wojciech", emotka: [ID.pan, 6], czekaj: 70 },
            { idz: [ID.pan, 14, 45, 4], czekaj: 40, czekajChod: true },
            { zrob: () => { const g = evOf(ID.pan); if (g) g.locate(14, 37); }, idz: [ID.pan, 14, 40, 4], czekaj: 20, czekajChod: true },
            { dzwiek: D.DZWIEK.drzwi, czekaj: 25 },
            { zrob: () => { const g = evOf(ID.pan); if (g) { g.setTransparent(true); g.locate(14, 41); } s.scen.znik = 1; }, dzwiek: D.DZWIEK.tlucze, czekaj: 30 },
            { kto: ID.panna, tekst: "znik.dorota", emotka: [ID.panna, 7], czekaj: 90 },
            { kto: "g:stefa", tekst: "znik.stefa", czekaj: 120 },
            { kto: "g:ignac", tekst: "znik.gosc.1", emotka: [["g:ignac", 2], ["g:lucjan", 1]], czekaj: 80 },
            { kto: "g:lucjan", tekst: "znik.gosc.2", czekaj: 80 },
            { kto: "borgar", tekst: "znik.borgar", czekaj: 100 }
        ];
        s.scen.znikStart = day() * 24 + hour();
        graj("znik", steps);
    }
    scenyKoniec.znik = () => {
        const s = S();
        s.scen.uczta = 1;   // (the feast is over: the chapter "Ślub i uczta")
        note("notatki.znik");
        const n = iskry();
        s.iskry = n;
        if (n === 0) { s.bojka.rozmiar = 0; s.bojka.koniec = day() * 24 + hour(); s.bojka.t0 = 0; startSzukania(); return; }
        s.bojka.rozmiar = n >= D.BOJKA.duza ? 2 : 1;
        startBojki();
    };
    const fighters = new Map();   // event id -> { cel, t, home }
    const fightersOut = id => !!(S().bojka.t0 && !S().bojka.koniec && fighters.has(id) && fighters.get(id).out);
    let bojkaSwiat = null;
    function startBojki() {
        const s = S();
        const spis = iskrySpis(), kto = [];
        for (const [a, b] of spis) { if (!kto.includes(a)) kto.push(a); if (!kto.includes(b)) kto.push(b); }
        const maks = s.bojka.rozmiar === 2 ? D.BOJKA.statysci[1] : D.BOJKA.statysci[0];
        const inni = D.KARTY.map(c => c.k).filter(k => !kto.includes(k));
        for (const k of inni) { if (kto.length >= maks) break; kto.push(k); }
        const lista = kto.slice(0, maks);
        fighters.clear();
        lista.forEach((k, i) => fighters.set(ID.gosc0 + kartaIdx(k), { k, t: 20 + i * 11, cel: null, out: true, home: miejsceXY(planAktualny()[k]) }));
        s.bojka.t0 = day() * 24 + hour();
        s.bojka.start = Graphics.frameCount;
        s.bojka.frames = 0;
        bojkaSwiat = { lista, spis };
        T.audio.se("Break", { volume: 80 }); T.audio.se("Blow3", { volume: 70, pitch: 60 });
        // (S5, the first seconds as a scene: the fighters up, the cries - then the hero's choice)
        const steps = [{ dzwiek: D.DZWIEK.stol, czekaj: 30, zrob: () => rise(lista) }];
        for (let i = 0; i < 4; i++) { const k = lista[i % lista.length]; steps.push({ kto: "g:" + k, tekst: "bojka.krzyk." + (1 + i), emotka: ["g:" + k, 5], skacz: ["g:" + k], czekaj: 55, dzwiek: D.DZWIEK.stol }); }
        steps.push({ kto: "borgar", czekaj: 10, rozmowa: "bojka" });
        graj("bojka", steps);
    }
    scenyKoniec.bojka = () => { /* the brawl goes on in real time if the hero did nothing (fightTick) */ };
    function rise(lista) {
        lista.forEach(k => {
            const ev = evOf(ID.gosc0 + kartaIdx(k)), f = fighters.get(ID.gosc0 + kartaIdx(k));
            if (!ev || !f) return;
            const m = f.home, i = lista.indexOf(k);
            f.out = true;
            ev.setThrough(true);
            // (the brawl is on the red carpet, where the hero stands and sees it)
            const spots = [[12, 20], [16, 20], [13, 22], [15, 22], [11, 23], [17, 23], [13, 18], [15, 18]];
            ev.locate(spots[i % spots.length][0], spots[i % spots.length][1]);
            ev.setDirectionFix(false);
            ev.setMoveSpeed(4);
        });
    }
    function fightTick() {
        const s = S();
        if (!s.bojka.t0 || s.bojka.koniec || !fighters.size || mapNow() !== M.karczma) return;
        if (scena.on) return;
        s.bojka.frames = (s.bojka.frames || 0) + 1;
        const list = [...fighters.entries()];
        for (const [id, f] of list) {
            const ev = evOf(id);
            if (!ev) continue;
            if (!f.out) continue;
            if (ev.isMoving()) continue;
            if (--f.t > 0) continue;
            f.t = 45 + Math.floor(Math.random() * 50);
            const other = list[Math.floor(Math.random() * list.length)];
            const oe = evOf(other[0]);
            if (oe && oe !== ev) { f.cel = oe; const dx = Math.sign(oe.x - ev.x), dy = Math.sign(oe.y - ev.y); if (dx || dy) { ev.setThrough(true); if (dx && dy) ev.moveDiagonally(dx > 0 ? 6 : 4, dy > 0 ? 2 : 8); else ev.moveStraight(dx > 0 ? 6 : dx < 0 ? 4 : dy > 0 ? 2 : 8); } }
            const r = Math.random();
            if (r < 0.3) { ev.jump(0, 0); T.audio.se("Blow2", { volume: 45, pitch: 80 + Math.floor(Math.random() * 40) }); }
            if (r < 0.3) $gameTemp.requestBalloon(ev, [1, 5, 7][Math.floor(Math.random() * 3)]);
            if (r > 0.93 && SB() && SB().say) SB().say(ev, [].concat(tx("bojka.krzyk." + (1 + Math.floor(Math.random() * 6))))[0], 100);
        }
        // nobody puts it out: Wit comes in after 120 s (7200 frames)
        if (s.bojka.frames > D.BOJKA.samaPo * 60) koniecBojki("wit");
    }
    function koniecBojki(sposob) {
        const s = S();
        if (s.bojka.koniec) return;
        s.bojka.sposob = sposob;
        s.bojka.koniec = day() * 24 + hour();
        const male = s.bojka.rozmiar === 1;
        const kw = { dzwonek: 1, piesn: 0.5, ryk: 1, prawda: 0.3, wit: 2 }[sposob] || 1;
        s.bojka.szkody = Math.round((D.BOJKA.szkodaStala * (male ? 1 : 1.5) + iskry() * D.BOJKA.szkodaIskra) * kw);
        // everyone back to their seats
        for (const [id, f] of fighters) { const ev = evOf(id); if (ev) { const m = f.home; ev.setThrough(false); ev.locate(m.x, m.y); ev.setDirection(m.strona); f.out = false; } }
        fighters.clear();
        const wit = { dzwonek: "bojka.dzwonek", piesn: "bojka.piesn.melia", ryk: "bojka.ryk.grum", prawda: "bojka.prawda.dorota", wit: "bojka.sama.wit" }[sposob];
        const who = { dzwonek: "borgar", piesn: "melia", ryk: "grum", prawda: "g:ambrozy", wit: "g:ambrozy" }[sposob];
        if (who && wit && has()) { const a = actor(who); if (a && SB() && SB().say) SB().say(a, [].concat(tx(wit))[0], 220); }
        if (sposob === "piesn") T.call("TavernLife", "addTrust", "melia", 2, tx("zadania.W18.title"));
        if (sposob === "ryk") T.call("TavernLife", "addTrust", "grum", 2, tx("zadania.W18.title"));
        popup(fill(tx("bojka.borgar"), { szkody: s.bojka.szkody }), { kind: "info" });
        startSzukania();
    }
    // the hero's choice
    function uspokoj(sposob) { koniecBojki(sposob); }

    // ==================================================================
    // 6. The search (23:00 - 4:00), the groom, the endings
    // ==================================================================
    function startSzukania() {
        const s = S();
        if (s.szuka.t0) return;
        s.szuka.t0 = Math.max(day() * 24 + hour(), D.DNI.ceremonia * 24 + G.noc);
        s.szuka.odw = []; s.szuka.znal = 0;
        s.szuka.wie = s.pierscien === "przegrany" ? 1 : 0;
        popup(tx("szuka.start"), { kind: "info" });
        // (the hall empties: the guests go to their rooms; the bride sits tight)
        sprawdz();
    }
    function miejsce(interp, k, ev) {
        const s = S();
        if (!szukaTrwa()) return;
        const key = k === "taras" ? "taras" : k === "palarnia2" ? "palarnia" : k;
        if (s.szuka.odw.includes(key) && key !== "taras") return;
        const spots = {
            beczka: () => { s.szuka.kot = 1; const kot = evOf(ID.kot); const stan2 = () => { if (kot) { kot.setTransparent(false); kot.locate(11, 15); kot.jump(0, 0); } };
                scenaMiejsce("beczka", [{ zrob: stan2, dzwiek: ["Cat", 70, 100], czekaj: 40 }, { kto: ID.kot, tekst: "miejsce.beczka.kot", emotka: [ID.kot, 3], czekaj: 90 }, { kto: "hero", tekst: "miejsce.beczka.1", czekaj: 160 }, { kto: "hero", tekst: "miejsce.beczka.mysl", czekaj: 80 }]); },
            kuchnia: () => scenaMiejsce("kuchnia", [{ kto: ID.hanka, tekst: "miejsce.kuchnia.hanka.1", emotka: [ID.hanka, 9], czekaj: 190 }, { kto: ID.hanka, tekst: "miejsce.kuchnia.hanka.2", czekaj: 170 }, { kto: "hero", tekst: "miejsce.kuchnia.mysl", czekaj: 80 }]),
            gry: () => scenaMiejsce("gry", [{ kto: ID.ozzy, tekst: "miejsce.gry.ozzy.1", emotka: [ID.ozzy, 10], czekaj: 190 }, { kto: ID.ozzy, tekst: "miejsce.gry.ozzy.2", czekaj: 190 }, { kto: "hero", tekst: "miejsce.gry.mysl", czekaj: 80 }]),
            palarnia: () => scenaMiejsce("palarnia", [{ kto: ID.wit, tekst: "miejsce.palarnia.wit", emotka: [ID.wit, 5], czekaj: 100 }, { kto: ID.mietek, tekst: "miejsce.palarnia.mietek", emotka: [ID.mietek, 5], czekaj: 100 }, { kto: "hero", tekst: "miejsce.palarnia.dym", czekaj: 130 }, { kto: "hero", tekst: "miejsce.palarnia.mysl", czekaj: 80 }]),
            drzwi: () => scenaMiejsce("drzwi", [{ dzwiek: ["Knock", 60, 100], czekaj: 30 }, { kto: ID.drzwi, tekst: "miejsce.drzwi.glos", czekaj: 150 }, { kto: "hero", tekst: "miejsce.drzwi.mysl", czekaj: 80 }]),
            platki: () => scenaMiejsce("platki", [{ kto: "hero", tekst: "miejsce.platki.1", czekaj: 170 }, { kto: "hero", tekst: "miejsce.platki.mysl", czekaj: 80 }]),
            taras: () => { if (s.szuka.znal) return mowi(interp, ev, "pan.slowo"); s.szuka.odw.includes("taras") || s.szuka.odw.push("taras"); talk(interp, "pan", ev); }
        };
        if (spots[key]) spots[key]();
    }
    function scenaMiejsce(key, steps) {
        const s = S();
        // (a trace: the place is marked at once, the scene never holds the hero for long)
        s.szuka.odw.push(key);
        graj("miejsce:" + key, steps, { pasy: false });
        scenyKoniec["miejsce:" + key] = () => { sprawdz(); };
    }
    function pierscienStracony() { return S().pierscien === "przegrany"; }
    function znaleziony() {
        const s = S();
        if (s.szuka.znal) return;
        s.szuka.znal = 1;
        s.szuka.koniec = day() * 24 + hour();
        popup(tx("miejsce.znal"), { kind: "info" });
        note("notatki.noc");
        sprawdz();
    }
    // 4:00: Borgar found him himself
    function szukanieCzas() {
        const s = S();
        if (!szukaTrwa()) return;
        if (day() > D.DNI.epilog || (day() === D.DNI.epilog && hour() >= G.nocDo)) {
            if (!s.szuka.znal) { s.szuka.koniec = day() * 24 + hour(); s.koniec = "D"; }
            s.szuka.znal = s.szuka.znal || 0;
            sprawdz();
        }
    }
    // the morning
    function koncowka() {
        const s = S();
        if (s.koniec === "D") return "D";
        const n = s.iskry >= 0 ? s.iskry : 0;
        if (nastrojLiczba() >= 80 && n === 0 && s.pierscien !== "przegrany") return "A";
        if (n >= D.BOJKA.duza && !s.bojka.sposob) return "C";
        if (n >= D.BOJKA.duza && s.bojka.sposob === "wit") return "C";
        return "B";
    }
    function poranekWybor(jak) {
        const s = S();
        s.epilog = 1;
        const k = koncowka();
        s.koniec = k;
        const N = D.NAGRODA, K = D.KONCOWKI[k];
        const dar = k === "D" ? 0 : (s.iskry === 0 ? N.para.gold + N.para.bonus : N.para.gold);
        const nap = nastrojLiczba() >= N.napiwki.prog && k !== "D" ? Math.round((nastrojLiczba() - N.napiwki.prog) / (100 - N.napiwki.prog) * N.napiwki.max) : 0;
        if (dar) { zloto(dar); }
        if (nap) { zloto(nap); popup(fill(tx("poranek.napiwki"), { n: nap }), { kind: "info" }); }
        // the cost of the brawl: out of the tips, then out of the groom's gift - never the hero's pocket (the document: the pool of Borgar)
        const rw = { gold: k === "D" ? 0 : N.borgar.gold, xp: k === "D" ? 0 : N.borgar.xp, opinion: K.opinia, trust: k === "D" ? {} : { melia: N.melia, grum: N.grum, ozzy: N.ozzy }, flag: "wesele" + k };
        if (K.renoma) renoma(K.renoma, "wesele" + k);
        const q = TQ();
        if (q && q.finish && w.active("W18")) { try { q.finish("W18", rw); } catch (e) { report("finish", e); } }
        s.nagroda = dar + nap + rw.gold;
        popup(tx("koniec." + k), { top: true, color: "#ffe27a", sub: "" });
        note("notatki.poranek");
        // after the wedding: the pair stays in the tavern of an evening (ending A, B: a flag the carter reads) - Wojciech's cart rides at half price
        T.emit("weseleKoniec", { koniec: k, nastroj: nastrojLiczba(), iskry: s.iskry });
        for (const key of ["woznica", "szwaczka", "opiekunka"]) { const L = TL(); if (L && L.setGone) L.setGone(key, false); }
    }
    // the morning scene S7: the ring on the finger
    function scenaPoranek(jak) { scena.next = () => scenaPoranek2(jak); }   // (the talk that chose it is still running: the scene waits for the interpreter)
    function scenaPoranek2(jak) {
        const s = S();
        const steps = [
            { kto: ID.panna, tekst: "poranek.pierscien", emotka: [ID.panna, 4], czekaj: 190 },
            { kto: ID.ozzy, tekst: "poranek.ozzy", czekaj: 170 },
            { kto: "borgar", tekst: "poranek.borgar", czekaj: 40, zrob: () => poranekWybor(jak) }
        ];
        s.scen.poranek = jak;
        graj("poranek", steps);
    }
    function zegar() {
        if (!has()) return;
        const s = S(), d = day(), h = hour();
        if (s.z === 0 && w.active("W18") && d > D.DNI.nieWziete && !(h < G.zlecenie[0])) { s.z = -1; const q = TQ(); if (q && q.fail) { try { q.fail("W18"); } catch (e) { report("fail", e); } } }
        if (s.z === 0 && !w.active("W18") && d >= D.DNI.ceremonia) { s.z = -1; }
        if (s.z !== 1) { for (const key of ["woznica", "szwaczka", "opiekunka"]) {/* the residents live their days */ } return; }
        // the carter and the seamstress are gone from the town the day of the wedding (back after it)
        const L = TL();
        if (L && L.setGone) {
            const gone = (d === D.DNI.ceremonia && h >= 12) || (d === D.DNI.epilog && !s.epilog);
            for (const key of ["woznica", "szwaczka", "opiekunka"]) {
                const g = L.gone ? L.gone(key) : false;
                if (gone && !g) L.setGone(key, D.DNI.epilog + 1);
            }
        }
        // the evening's visitors of the tavern (TownLife residents with indoor.tawerna) stay away from the wedding hall: gone from noon of the day 22
        // (not while the hero is in the tavern - nobody vanishes in sight), back after the morning
        if (L && L.setGone && window.TownLifeData) {
            const vis = (TownLifeData.RESIDENTS || []).filter(r => r.indoor && r.indoor.tawerna).map(r => r.key);
            s.schowani = s.schowani || [];
            if (((d === D.DNI.ceremonia && h >= 12) || (d === D.DNI.epilog && !s.epilog)) && mapNow() !== M.karczma) {
                for (const key of vis) if (!s.schowani.includes(key) && !(L.gone && L.gone(key))) { L.setGone(key, D.DNI.epilog + 1); s.schowani.push(key); }
            } else if (s.epilog && s.schowani.length) { for (const key of s.schowani) L.setGone(key, false); s.schowani = []; }
        }
        // Hanka's tart: ready the day after (the pickup at her)
        if (s.tort === 1 && d > s.tortDzien) s.tort = 1.5;
        // the pure clock: the scenes of the day 22 when the hero is in the hall
        if (mapNow() === M.karczma && !scena.on && T.isCalm && T.isCalm(SceneManager._scene) && !$gameMap.isEventRunning() && d === D.DNI.ceremonia) {
            if (!s.scen.slub && h >= G.ceremonia && h < G.ceremonia + 2) sceneSlub();
            else if (s.scen.slub && !s.scen.toast && h >= G.toast && h < G.toast + 1.5) sceneToast();
            else if (s.scen.toast && !s.scen.taniec && h >= G.taniec && h < G.taniec + 1) sceneTaniec();
            else if (!s.scen.znik && h >= (nastrojLiczba() < 50 ? G.bojkaWczesnie : G.znik)) sceneZnik();
        }
        // (a missed scene: the day goes on without it)
        if (d === D.DNI.ceremonia && h >= 16.5 && !s.scen.slub) s.scen.slub = -1;
        if (d === D.DNI.ceremonia && h >= 21 && !s.scen.toast) s.scen.toast = -1;
        if (d === D.DNI.ceremonia && h >= 21.8 && !s.scen.taniec) s.scen.taniec = -1;
        // the courses: Borgar serves his own after an hour
        if (d === D.DNI.ceremonia) {
            for (let i = 0; i < 3; i++) { const t0 = G.uczta[i]; if (h >= t0 + 1 && (s.podane || []).length <= i) podajBorgar(i); }
        }
        // (22:15 ... 22:00: after S4 nothing waits for the hero: the brawl goes on, then the search)
        if (d === D.DNI.ceremonia && h >= 23 && !s.scen.znik) { s.scen.znik = -1; s.iskry = iskry(); s.scen.uczta = 1; s.bojka.koniec = d * 24 + h; startSzukania(); }
        if (s.scen.znik === 1 && s.bojka.koniec && !s.szuka.t0 && (d * 24 + h) >= s.szuka.t0) startSzukania();
        if (s.szuka.t0 && !s.szuka.koniec) szukanieCzas();
        // the morning: the pair on the terrace; the hero did not come till noon -> the modest end
        if (d === D.DNI.epilog && h >= G.poranek[1] && !s.epilog && s.szuka.koniec) { s.epilog = 2; poranekWybor("sam"); }
        if (d > D.DNI.epilog && !s.epilog) { s.epilog = 2; if (!s.koniec) s.koniec = "D"; poranekWybor("sam"); }
    }
    function podajBorgar(i) {
        const s = S();
        s.podane = s.podane || [];
        s.podane.push({ v: 2, borgar: 1 });
    }

    // ==================================================================
    // 7. The hooks of the data
    // ==================================================================
    const GOTOWE = () => { const s = S(); return { jedzenie: s.dania.length >= 3 && s.tort >= 2, muzyka: Object.keys(s.piesni).length >= 3, ozdoby: s.wiszace.length >= D.DEKOR.length && s.swiece.length >= D.SWIECE.length, goscie: !!s.planOk, ksiadz: !!s.kleo }; };
    const stacNa = c => ({ struny: $gameParty.gold() >= D.STRUNY, wykup: $gameParty.gold() >= D.NAGRODA.wykup }[c] || false);
    const warunkiZlecenia = () => {
        try {
            const q = TQ(), p = P(), melia = T.call("TavernLife", "trust", "melia") || 0;
            const w1 = q && q.rec ? q.rec("W1") : null;
            const w1ok = !!w1 && (w1.s === "done" || (w1.step >= 3));
            return (q.opinion() >= D.WARUNKI.opinia) && ((p && p.renoma ? p.renoma(0) : 0) >= D.WARUNKI.renoma) && melia >= D.WARUNKI.melia && w1ok;
        } catch (e) { return false; }
    };
    w.haki({
        mowca: (ctx, key) => { const ev = evOf(ID[key]); return ev ? spkOf(ev) : null; },
        mozeZlecenie: () => { if (!has()) return false; const s = S(), d = day(), h = hour(); return s.z === 0 && d >= D.DNI.od && d <= D.DNI.nieWziete && h >= G.zlecenie[0] && h < G.zlecenie[1] && (!!s.zmus || warunkiZlecenia()); },
        zlecenieBierze: () => has() && S().z === 1,
        regularGdy: ctx => {
            if (!has()) return false;
            const s = S(), key = ctx && ctx.key;
            if (key === "melia") return s.z === 1 && day() <= D.DNI.ceremonia;
            if (key === "grum") return s.z === 1 && day() === 21 && hour() >= G.kawalerski[0] && hour() < G.kawalerski[1] && !s.kawalerski;
            return false;
        },
        meliaObrazona: () => S().muzyka === -1,
        piesniGotowe: () => Object.keys(S().piesni).length >= 3,
        struny: () => S().struny === 1 || w.done("K22"),
        stac: (ctx, c) => stacNa(c),
        piesnWybrana: (ctx, k) => Object.values(S().piesni).includes(k),
        poPrzygotowaniach: () => has() && S().z === 1 && (day() > D.DNI.ceremonia || (day() === D.DNI.ceremonia && hour() >= G.ceremonia)),
        hankaTort: () => has() && S().z === 1 && day() <= D.DNI.ceremonia && S().tort < 2,
        tortGotowy: () => S().tort === 1.5 || (S().tort === 1 && day() > S().tortDzien),
        tortZamowiony: () => S().tort === 1,
        tortSklad: () => ile(D.TORT.miod) >= D.TORT.ilosc[0] && ile(D.TORT.jagody) >= D.TORT.ilosc[1],
        halinaWianki: () => has() && S().z === 1 && day() <= D.DNI.ceremonia,
        wiankiSa: () => S().wianki + S().wiszace.filter(i => D.DEKOR[i][2] === "wianek").length >= D.ZIOLA_N,
        ziolaSa: () => ile(D.ZIOLA) >= D.ZIOLA_N,
        dorotaSzarfy: () => has() && S().z === 1 && day() <= D.DNI.ceremonia,
        szarfySa: () => S().szarfy + S().wiszace.filter(i => D.DEKOR[i][2] === "szarfa").length >= 4,
        plotkaDorota: () => !S().plotki.includes("szwaczka"),
        kleofasProsba: () => has() && S().z === 1 && S().kleo === 0 && day() <= D.DNI.ceremonia,
        soltysProsba: () => has() && S().z === 1 && S().kleo === 0 && day() >= D.DNI.ceremonia - 1 && day() <= D.DNI.ceremonia,
        plotkaStefa: () => plotkaMozna("opiekunka"), plotkaTadek: () => plotkaMozna("kowal"), plotkaWit: () => plotkaMozna("kapral"), plotkaBartek: () => plotkaMozna("bartek"),
        plotkaLinie: ctx => { const k = ctx && ctx.kto; return S().plotki.includes(k) ? [tx("plotka.znane")] : [].concat(tx("plotka." + k + ".1")); },
        ucztaTrwa: () => has() && weselnyDzien() && hour() >= 16.9 && hour() < 22 && S().scen.slub,
        meliaPiesn: () => T.call("TavernLife", "trust", "melia") >= 30 && S().muzyka === 1,
        grumRyk: () => T.call("TavernLife", "trust", "grum") >= 25,
        wieGdzie: () => S().szuka.wie === 1 || S().pierscien === "przegrany" || S().pierscien === "odzyskany",
        pierscienStracony: () => S().pierscien === "przegrany",
        w18Zm: () => zmienneKrokow(),
        // actions
        przyjmij: () => przyjmij(), odmow: () => odmow(), piesn: (ctx, kto, k) => piesn(kto, k), proba: () => proba(), kupStruny: () => kupStruny(),
        zamowTort: () => zamowTort(), odbierzTort: () => odbierzTort(),
        kleofas: (ctx, n) => { S().kleo = Number(n) || 1; sprawdz(); },
        plotka: (ctx, kto) => plotka(kto), planOkno: () => planOkno(),
        kawalerski: (ctx, jak) => { S().kawalerski = 1; },
        kosci: () => kosci(), odciagnij: () => { S().kawalerski = 1; S().cichy = 1; }, przegrany: () => { S().pierscien = "przegrany"; },
        rewanz: () => rewanz(), wykup: () => { $gameParty.loseGold(D.NAGRODA.wykup); S().pierscien = "odzyskany"; popup(tx("napis.pierscien"), { kind: "info" }); },
        znaleziony: () => znaleziony(), poranek: (ctx, jak) => scenaPoranek(jak),
        przemowa: (ctx, n) => { S().przemowa = Number(n) || 3; },
        uspokoj: (ctx, jak) => uspokoj(jak),
        ladaDanie: (ctx, id) => ladaDanie(Number(id)), ladaTort: () => ladaTort(), ladaPodaj: () => ladaPodaj(),
        // F9
        f9Zm: ctx => ({ n: ctx && ctx.row && ctx.row.co === "pierscien" ? (S().pierscien === "przegrany" ? "przegrany" : "zachowany") : (S().iskry >= 0 ? S().iskry : iskry()) }),
        f9Iskry: (ctx, delta) => { const s = S(); const v = [0, 3, 6]; const i = Math.max(0, v.indexOf(s.iskry >= 0 ? s.iskry : 0)); s.iskry = v[(i + (delta || 1) + 3) % 3]; s.fix = s.iskry; return true; },
        f9Pierscien: () => { const s = S(); s.pierscien = s.pierscien === "przegrany" ? "ma" : "przegrany"; return true; },
        f9Przygotuj: ctx => f9Przygotuj(Number(ctx.skok) || 1)
    });
    w.haki({ wiankiZrob: () => wianki(), szarfyZrob: () => szarfy() });

    function plotkaMozna(kto) { return has() && S().z === 1 && day() <= D.DNI.ceremonia && !S().plotki.includes(kto); }
    function plotka(kto) {
        const s = S();
        if (s.plotki.includes(kto)) return;
        s.plotki.push(kto);
        popup(fill(tx("napis.plotka"), { n: Math.min(s.plotki.length, 4) }), { kind: "info" });
        sprawdz();
    }
    function przyjmij() {
        const s = S();
        s.z = 1; s.zDzien = day();
        if (!s.pochodnie) { s.pochodnie = 1; if (item(D.POCHODNIA)) $gameParty.gainItem(item(D.POCHODNIA), D.POCHODNIE); }
        note("notatki.zlecenie");
        popup(tx("napis.wesele"), { top: true, color: "#ffe27a", sub: tx("zadania.W18.when") });
        sprawdz();
        setTimeout(() => { if ($gameMap && !$gameMap.isEventRunning() && $gameMap.mapId() === M.karczma) reload(); }, 900);
    }
    function odmow() { const s = S(); s.z = -1; const q = TQ(); if (q && q.fail) { try { q.fail("W18"); } catch (e) { report("odmow", e); } } }
    function piesn(kto, k) { const s = S(); s.piesni[kto] = k; }
    function proba() {
        const s = S();
        s.muzyka = 1;
        popup(tx("napis.piesni"), { kind: "info" });
        sprawdz();
    }
    function kupStruny() { const s = S(); if ($gameParty.gold() < D.STRUNY) return; $gameParty.loseGold(D.STRUNY); s.struny = 1; }
    function zamowTort() {
        const s = S(), t = D.TORT;
        if (item(t.miod)) $gameParty.loseItem(item(t.miod), t.ilosc[0]);
        if (item(t.jagody)) $gameParty.loseItem(item(t.jagody), t.ilosc[1]);
        s.tort = 1; s.tortDzien = day();
        popup(tx("napis.tort"), { kind: "info" });
    }
    function odbierzTort() { const s = S(); s.tort = 2; s.tortOdebrany = 1; popup(tx("napis.odebrany"), { kind: "info" }); sprawdz(); }
    function wianki() {
        const s = S(), n = D.ZIOLA_N;
        if (item(D.ZIOLA)) $gameParty.loseItem(item(D.ZIOLA), n);
        s.wianki += n; popup(tx("napis.wianki"), { kind: "info" }); sprawdz();
    }
    function szarfy() { const s = S(); s.szarfy += 4; popup(tx("napis.szarfy"), { kind: "info" }); sprawdz(); }
    function planOkno() {
        const G2 = window.WeseleGry;
        if (!G2 || !G2.plan) return;
        $gameTemp._wesPlan = true;
        const s = S();
        const znane = [];
        for (const [kto, spis] of Object.entries(D.PLOTKARZE)) if (s.plotki.includes(kto)) for (const i of spis) if (!znane.includes(i)) znane.push(i);
        if (s.plotki.length >= D.PLOTKI_POTRZEBA) for (let i = 0; i < D.WASNIE.length; i++) if (!znane.includes(i)) znane.push(i);
        setTimeout(() => G2.plan({ plan: Object.assign({}, s.plan), znane, onEnd: r => { $gameTemp._wesPlan = false; if (r && r.plan) { s.plan = r.plan; s.planOk = 1; s.iskry = iskry(r.plan); popup(fill(tx("napis.plan"), {}), { kind: "info" }); sprawdz(); } } }), 30);
    }
    function kosci() {
        const dice = T.api("TavernDice") || window.TavernDice;
        const s = S();
        s.kawalerski = 1;
        if (!dice || !dice.start) { s.pierscien = Math.random() < 0.5 ? "ma" : "przegrany"; return; }
        setTimeout(() => dice.start({ opponent: "bartek", stake: 10, onEnd: r => {
            const won = !!(r && (r.won || r.win || (r.result && r.result.won) || r.winner === "hero"));
            s.pierscien = won ? "wygrany" : "przegrany";
            popup(tx(won ? "kaw.wygrana" : "kaw.przegrana"), { kind: "info" });
        } }), 30);
    }
    function rewanz() {
        const dice = T.api("TavernDice") || window.TavernDice, s = S();
        if (!dice || !dice.start) { s.pierscien = "odzyskany"; znaleziony(); return; }
        setTimeout(() => dice.start({ opponent: "bartek", stake: 10, onEnd: r => {
            const won = !!(r && (r.won || r.win || (r.result && r.result.won) || r.winner === "hero"));
            if (won) { s.pierscien = "odzyskany"; popup(tx("napis.pierscien"), { kind: "info" }); }
            znaleziony();
        } }), 30);
    }
    // (the one list of the journal: the five points of Borgar's list, with ticks)
    function zmienneKrokow() {
        const s = S(), g = GOTOWE(), d = day();
        const tk = b => tx(b ? "kroki.tak" : "kroki.nie");
        const lista = [
            fill(tx("kroki.lista.jedzenie"), { dania: Math.min(3, s.dania.length), tort: s.tort >= 2 ? tx("kroki.tak") : s.tort >= 1 ? "w piekarni" : tx("kroki.nie") }),
            fill(tx("kroki.lista.muzyka"), { muzyka: tk(g.muzyka) }),
            fill(tx("kroki.lista.ozdoby"), { ozdoby: s.wiszace.length + "/" + D.DEKOR.length + ", świece " + s.swiece.length + "/" + D.SWIECE.length }),
            fill(tx("kroki.lista.goscie"), { plan: tk(g.goscie), plotki: Math.min(s.plotki.length, 4) }),
            fill(tx("kroki.lista.ksiadz"), { ksiadz: tk(g.ksiadz) })
        ].join("; ");
        const odw = s.szuka.odw || [];
        return { lista, dzien: d >= D.DNI.ceremonia ? tx("kroki.dzien.dzis") : fill(tx("kroki.dzien.za"), { n: D.DNI.ceremonia - d }), slady: odw.length ? odw.length + "/6" : "jeszcze żadnych" };
    }

    // ---------------------------------------------------------------- the counter: the dishes (3) and the tart; the courses
    function ladaDanie(id) {
        const s = S();
        if (s.dania.includes(id)) { popup(tx("lada.juz"), { kind: "info" }); return; }
        if (s.dania.length >= 3) { popup(tx("lada.zaduzo"), { kind: "info" }); return; }
        if (!(ile(id) > 0)) { popup(tx("lada.brakDania"), { kind: "need" }); return; }
        $gameParty.loseItem(item(id), 1);
        s.dania.push(id);
        popup(fill(tx("lada.polozone"), { nazwa: item(id).name }), { kind: "info" });
        sprawdz();
    }
    function ladaTort() {
        const s = S();
        if (s.tort >= 2) { popup(tx("lada.polozoneTort"), { kind: "info" }); return; }
        popup(tx("lada.brakTortu"), { kind: "need" });
    }
    function ladaPodaj() {
        const s = S(), h = hour();
        s.podane = s.podane || [];
        const i = s.podane.length;
        if (i >= 3) { popup(tx("lada.pusta"), { kind: "info" }); return; }
        if (h < G.uczta[i]) { popup(tx("lada.podajPora"), { kind: "info" }); return; }
        const id = s.dania[i], v = id ? D.DANIA[id] || 3 : 2;
        const ev = evOf(ID.lada);
        const rec = { v, id: id || 0, tort: i === 2 && s.tort >= 2 };
        s.podane.push(rec);
        T.audio.se("Heal2", { volume: 60, pitch: 110 });
        popup(fill(tx(id ? "lada.podaj" : "lada.podaj"), { nazwa: id ? item(id).name : "danie Borgara" }), { kind: "info" });
        if (rec.tort) popup(tx("lada.podajTort"), { kind: "info" });
        const hanka = actor("g:hanka");
        if (rec.tort && hanka) $gameTemp.requestBalloon(hanka, 4);
    }

    // ==================================================================
    // 8. F9: a jump prepares the state (the preparations done as far as the chapter needs)
    // ==================================================================
    function f9Przygotuj(k) {
        const s = S();
        const Q = TQ();
        const dzien = [19, 20, 21, 22, 22, 22, 23][k - 1] || 19;
        $gameSystem._dayNightDay = dzien;
        s.z = k === 1 ? 0 : 1; s.zmus = 1;
        if (k >= 2) { s.z = 1; s.pochodnie = 1; }
        if (k >= 3) { s.dania = [130, 131, 132]; s.tort = 2; s.piesni = { toast: "kufel", taniec: "mlyn", kolysanka: "wianek" }; s.muzyka = 1; s.struny = 1;
            s.wianki = 0; s.szarfy = 0; s.wiszace = D.DEKOR.map((d, i) => i); s.swiece = D.SWIECE.map((c, i) => i); s.kleo = 1; }
        if (k >= 4) { s.plan = Object.assign({}, planDobry()); s.planOk = 1; s.plotki = ["opiekunka", "kowal", "kapral", "bartek"]; }
        if (s.iskry < 0 || k === 4 || k === 5) s.iskry = s.fix !== undefined ? s.fix : iskry(s.plan);
        if (k >= 5) { s.scen.slub = 1; s.scen.toast = 1; s.scen.taniec = 1; s.taniec = 6; s.przemowa = 2; s.podane = [{ v: 8, id: 130 }, { v: 7, id: 131 }, { v: 7, id: 132, tort: true }]; }
        if (k === 5) { s.scen.znik = 0; }
        if (k >= 6) { s.scen.znik = 1; s.scen.uczta = 1; s.bojka = { rozmiar: 0, sposob: "dzwonek", szkody: 20, t0: 0, koniec: dzien * 24 + 22 }; s.szuka = { t0: 22 * 24 + 23, odw: [], znal: 0, wie: 0, koniec: 0 }; }
        if (k === 7) { s.szuka.znal = 1; s.szuka.koniec = 22 * 24 + 23.5; s.epilog = 0; }
        if (Q && Q.start && !w.active("W18") && !w.done("W18")) { try { Q.start("W18"); } catch (e) { report("start", e); } }
        // (the quest's step: the thread's chapter - the jump table's `krok` is moved to by TownQuests)
        sprawdz();
        $gamePlayer.requestMapReload && $gamePlayer.requestMapReload();
    }
    const planDobry = () => {
        const o = {}, order = D.KARTY.map(c => c.k);
        // two tables for the feuds' sides, the rest on the other two: no sparks
        const A = ["hanka", "tadek", "wit", "ignac", "halina", "rp1", "rp2", "soltys", "ambrozy"], B = order.filter(k => !A.includes(k));
        A.forEach((k, i) => { o[k] = (i < 6 ? 0 : 6) + (i < 6 ? i : i - 6); });
        B.forEach((k, i) => { o[k] = (i < 6 ? 12 : 18) + (i < 6 ? i : i - 6); });
        return o;
    };

    // ==================================================================
    // 9. API, the registration
    // ==================================================================
    T.onMapUpdate(() => { try { walkTick(); tick(); } catch (e) { report("tick", e); } }, { name: "wesele", owner: PLUGIN });
    let zegarT = 0;
    T.onMapUpdate(() => { if (++zegarT % 20 === 0) { try { zegar(); } catch (e) { report("zegar", e); } } }, { name: "wesele_zegar", owner: PLUGIN });
    T.on("mapReady", () => { if (has()) { $gameTemp._wesPlan = false; fighters.size && !S().bojka.t0 && fighters.clear(); } }, { owner: PLUGIN });

    window.Wesele = T.register(PLUGIN, {
        stan: () => S(), ponow, sala, warstwa: () => (warstwa ? Object.assign({}, warstwa.n) : null), nastroj, iskry, plan: planAktualny, akcja, krok, czekajChod, koniecSceny, koncowka, planDobry,
        miejsceXY, kartaIdx, ID, scena: () => scena, fighters: () => [...fighters.keys()],
        wymus: { slub: sceneSlub, toast: sceneToast, taniec: sceneTaniec, znik: sceneZnik, szukanie: startSzukania, koniecBojki, znaleziony, poranek: scenaPoranek, zegar,
            ladaDanie, ladaPodaj, taniecWynik, plotka, przyjmij, odmow, dekoruj, swieca, tick, ukladStan, planSeats },
        warunki: warunkiZlecenia
    });
})();
