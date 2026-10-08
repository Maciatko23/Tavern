//=============================================================================
// CleanHUD_Compass.js
//=============================================================================
// The goal compass of the clean look (CleanHUD.js): a round dial in the top right corner of the screen (the user, 2026-10-08, instead of
// the mock-up's strip at the top centre) - N E S W, north up as the map is - with a yellow arrow towards the goal and
// "Tawerna · 140 kroków" under it.
// The goal is the one the goal line shows (CleanHUD.goalInfo: a quest board contract, a town quest being followed, the journal's
// goal); where it is comes from a table "goal -> map and tile":
//   - a town quest (TownQuests.js): its current step knows a person (`to`: a TownLife resident - where its day's plan puts it now -,
//     the Lord, grandpa, the tavern's regulars) or a place (`spot`: TownQuests_Data's SPOTS, on its "Miejsce:" marker);
//   - a contract of the quest board, ready to hand in: the board in the tavern;
//   - a goal of the journal (Story.js's story goals among them): its own `where` ({ map, x, y, name } | { person } | { map, event }
//     | a function giving one), else WHERE below, else - building and crafting goals of a story game - grandpa's field, the
//     building itself when it stands there.
// A goal on another map: the diamond points at the exit that leads towards it - the shortest way over the maps' transfer events
// (every map's file is read once, in the background), "kroków" is that way's length in tiles. No goal: the compass alone.
// Map note <Compass:off>: no compass on that map.

/*:
 * @target MZ
 * @plugindesc Czysty widok: okrągły kompas celu w prawym górnym rogu (kierunek do celu z dziennika lub zadania, także przez przejścia między mapami). v1.1.0
 * @author Claude
 * @base CleanHUD
 * @orderAfter CleanHUD
 * @orderAfter Journal
 * @orderAfter Story
 * @orderAfter TownLife
 * @orderAfter TownQuests
 * @orderAfter QuestBoard
 * @orderAfter TavernLife
 *
 * @help
 * ============================================================================
 * CleanHUD_Compass.js - kompas celu (Czysty widok)
 * ============================================================================
 * W prawym górnym rogu okrągły kompas (N E S W, północ u góry jak na
 * mapie). Żółta strzałka pokazuje kierunek do bieżącego celu, a pod tarczą
 * stoi nazwa celu i odległość w krokach, np. „Tawerna · 140 kroków”. Pod
 * kompasem: obciążenie plecaka, pochodnia, minimapa (M).
 * Cel to ten z lewego górnego rogu: śledzone zadanie z miasteczka (osoba
 * albo miejsce z jego kroku), zlecenie z tablicy (gdy gotowe do oddania)
 * albo cel z dziennika (fabuła: dziadek, pole, Borgar, Lord...).
 * Gdy cel jest na innej mapie, strzałka wskazuje przejście, które prowadzi
 * najkrótszą drogą w jego stronę. Bez celu widać sam kompas.
 * Notatka mapy <Compass:off> - bez kompasu na tej mapie.
 * Dla twórcy: cel dziennika może mieć pole where, np.
 *   where: { map: 8, x: 39, y: 10, name: "Staw" }
 *   where: { person: "kowal" }   (mieszkaniec, "lord", "grandpa", "borgar")
 *   where: { map: 1, event: "Borgar", name: "Borgar" }
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("CleanHUD_Compass.js: brak TawernaCore.js (the Tawerna core is missing)");
    const CH = T.api("CleanHUD");
    if (!CH) throw new Error("CleanHUD_Compass.js: musi być pod CleanHUD.js na liście wtyczek (CleanHUD is missing or below)");
    const PLUGIN = "CleanHUD_Compass";
    if (T.api(PLUGIN)) return;
    const C = CH.C, textOut = CH.textOut, measure = CH.measure;
    const DOOR = 2;          // tiles a transfer counts on the way (a door, a gate)
    const HERE_NEAR = 1.6;   // tiles: "tutaj"

    // ------------------------------------------------------------------
    // The maps' files: their exits (transfer events), their named events - read once, in the background, kept small
    // ------------------------------------------------------------------
    const DATA = {};   // mapId -> extract | "loading" | "missing"
    let queue = null;
    function extract(map) {
        const exits = [], events = [];
        for (const e of map.events || []) {
            if (!e) continue;
            const pages = (e.pages || []).map(p => {
                const c = (p.list || []).find(c => c.code === 201 && c.parameters && c.parameters[0] === 0);
                return c ? { map: c.parameters[1], x: c.parameters[2], y: c.parameters[3] } : null;
            });
            const first = pages.find(Boolean);
            if (first) exits.push({ id: e.id, x: e.x, y: e.y, to: first, pages });
            const p0 = e.pages && e.pages[0];
            const comments = p0 ? (p0.list || []).filter(c => c.code === 108 || c.code === 408).map(c => c.parameters[0]).join("\n") : "";
            events.push({ id: e.id, name: e.name || "", x: e.x, y: e.y, tags: (e.note || "") + "\n" + comments, trigger: p0 ? p0.trigger : 0 });
        }
        return { exits, events, displayName: map.displayName || "", width: map.width, height: map.height };
    }
    function fetchMap(id) {
        if (DATA[id]) return;
        DATA[id] = "loading";
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "data/Map" + String(id).padStart(3, "0") + ".json");
        xhr.overrideMimeType("application/json");
        xhr.onload = () => {
            let d = "missing";
            if (xhr.status < 400) { try { d = extract(JSON.parse(xhr.responseText)); } catch (e) { d = "missing"; } }
            DATA[id] = d;
            pump();
        };
        xhr.onerror = () => { DATA[id] = "missing"; pump(); };
        xhr.send();
    }
    const loadingCount = () => Object.values(DATA).filter(d => d === "loading").length;
    function pump() {
        if (!queue) return;
        while (queue.length && loadingCount() < 4) fetchMap(queue.shift());
    }
    function loadAll() {
        if (queue || !window.$dataMapInfos) return;
        queue = $dataMapInfos.filter(Boolean).map(i => i.id).filter(id => !DATA[id]);
        pump();
    }
    const allLoaded = () => !!queue && queue.length === 0 && loadingCount() === 0;
    // the current map: its own data (with the events other plugins put into it), read again for each map
    let hereSrc = null, hereData = null;
    function hereMap() {
        if (!window.$dataMap) return null;
        if (hereSrc !== $dataMap) { hereSrc = $dataMap; hereData = extract($dataMap); DATA[$gameMap.mapId()] = DATA[$gameMap.mapId()] || hereData; }
        return hereData;
    }
    const mapData = id => (id === ($gameMap && $gameMap.mapId()) ? hereMap() : DATA[id] && typeof DATA[id] === "object" ? DATA[id] : null);
    function mapName(id) {
        if ($gameMap && id === $gameMap.mapId() && $gameMap.displayName()) return $gameMap.displayName();
        const ST = T.api("Story");
        if (id === 3 && ST && ST.active && ST.active()) return "Pole dziadka";   // (Story renames the field in a story game)
        const d = mapData(id);
        if (d && d.displayName) return d.displayName;
        const info = window.$dataMapInfos && $dataMapInfos[id];
        return info ? info.name : "";
    }
    // an event of a map by its name (a regular expression or the start of the name) or by a tag of its note / first page
    function findEvent(mapId, by) {
        const d = mapData(mapId);
        if (!d) { fetchMap(mapId); return null; }
        const re = by instanceof RegExp ? by : new RegExp("^" + String(by).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return d.events.find(e => re.test(e.name) || (by instanceof RegExp && re.test(e.tags))) || null;
    }

    // ------------------------------------------------------------------
    // Where a goal is: { map, x?, y?, name } (no x / y: the map itself)
    // ------------------------------------------------------------------
    // goal id -> where, for goals that do not say it themselves (another plugin may fill it: CleanCompass.WHERE[id] = {...});
    // the story's goals (Story.js) and the journal's Borgar and cellar goals carry their own `where`
    const WHERE = {};
    const REGULARS = { borgar: /^Borgar\b/i, melia: /^Melia\b/i, ozzy: /Ozzy/i, grum: /^Grum\b/i };
    const REG_NAMES = { borgar: "Borgar", melia: "Melia", ozzy: "Dziadek Ozzy", grum: "Grum" };
    const TAVERN = 1;
    // a person by its key: a TownLife resident (live on this map, else where its plan puts it now), the Lord, grandpa, a regular
    function person(key) {
        const here = $gameMap.mapId(), ST = T.api("Story");
        if (key === "grandpa" && ST && ST.NPCS) {
            const n = ST.NPCS.grandpa, ev = here === n.map ? $gameMap.event(n.id) : null;
            return { map: n.map, x: ev ? ev.x : n.at ? n.at[0] : undefined, y: ev ? ev.y : n.at ? n.at[1] : undefined, name: "Dziadek Stach" };
        }
        if (key === "lord" && ST && ST.NPCS) {
            const n = ST.NPCS.lord, ev = here === n.map ? $gameMap.event(n.id) : null;
            if (ev && ev.page && ev.page() && !ev.isTransparent()) return { map: n.map, x: ev.x, y: ev.y, name: "Lord Zaleski" };
            const door = findEvent(n.map, /^Drzwi dworu/i);
            return { map: n.map, x: door ? door.x : undefined, y: door ? door.y : undefined, name: "Lord Zaleski" };
        }
        if (REGULARS[key]) {
            const TLf = T.api("TavernLife");
            const ev = here === TAVERN && TLf && TLf.npc ? TLf.npc(key) : null;
            if (ev) return { map: TAVERN, x: ev.x, y: ev.y, name: REG_NAMES[key] };
            const d = key === "borgar" ? findEvent(TAVERN, REGULARS[key]) : null;
            return { map: TAVERN, x: d ? d.x : undefined, y: d ? d.y : undefined, name: REG_NAMES[key] };
        }
        const TL = T.api("TownLife"), res = TL && TL.RESIDENTS ? TL.RESIDENTS.find(r => r.key === key) : null;
        if (!res || (TL.gone && TL.gone(key))) return null;
        const home = TL.homeOf ? TL.homeOf(res) : res.map || 8;
        if (here === home && TL.eventOf) {
            const ev = TL.eventOf(key);
            if (ev && !(ev._town && ev._town.hidden) && !ev.isTransparent()) return { map: home, x: ev.x, y: ev.y, name: res.name };
        }
        const e = TL.entryAt ? TL.entryAt(res, T.time.hour()) : null, spotKey = e ? (Array.isArray(e.where) ? e.where[0] : e.where) : null;
        const at = spotKey ? residentSpot(home, spotKey) : null;
        return { map: home, x: at ? at[0] : undefined, y: at ? at[1] : undefined, name: res.name };
    }
    // a spot of TownLife's plans on a map: the map's "Miejsce: <key>" event, else the data's default
    function residentSpot(mapId, key) {
        const TL = T.api("TownLife");
        if (mapId === $gameMap.mapId() && TL && TL.spot) return TL.spot(key);
        const ev = findEvent(mapId, new RegExp("^Miejsce:\\s*" + key + "\\s*$", "i"));
        if (ev) return [ev.x, ev.y];
        const D = window.TownLifeData;
        if (!D) return null;
        const base = mapId === (D.MAP || 8) ? D.SPOTS : (D.SPOTS_BY_MAP && D.SPOTS_BY_MAP[mapId]) || {};
        return base[key] || null;
    }
    // a place of the town's quests (TownQuests_Data's SPOTS): its event when it is on this map, its "Miejsce:" marker, its x / y
    function questSpot(key) {
        const D = window.TownQuestsData, s = D && D.SPOTS && D.SPOTS[key], TQ = T.api("TownQuests");
        if (!s) return null;
        const ev = TQ && TQ.spotEv ? TQ.spotEv(key) : null;
        if (ev) return { map: s.map, x: ev.x, y: ev.y, name: s.name };
        if (s.marker) {
            const m = findEvent(s.map, new RegExp("^Miejsce:\\s*" + s.marker + "\\s*$", "i"));
            if (m) return { map: s.map, x: m.x + (s.dx || 0), y: m.y + (s.dy || 0), name: s.name };
        }
        return { map: s.map, x: s.x, y: s.y, name: s.name };
    }
    // the current step of a town quest: a place, else a person
    function townPlace(id) {
        const TQ = T.api("TownQuests");
        if (!TQ || !TQ.Q || !TQ.rec) return null;
        const q = TQ.Q[id], r = TQ.rec(id), st = q && r ? q.steps[r.step] : null;
        if (!st) return null;
        if (st.spot) return questSpot(st.spot);
        if (st.to) return person(st.to);
        return null;
    }
    // a contract of the quest board ready to hand in: the board in the tavern
    function boardPlace(id) {
        const QB = T.api("QuestBoard");
        let ready = false;
        try { ready = !!(QB && QB.isReady && QB.isReady(id)); } catch (e) { ready = false; }
        if (!ready) return null;
        const ev = findEvent(TAVERN, /<Tavern:\s*board/i);
        return { map: TAVERN, x: ev ? ev.x : undefined, y: ev ? ev.y : undefined, name: "Tablica ogłoszeń" };
    }
    // a building of the field (Farming.js): where it stands; a building in the hut - the hut
    const FIELD = 3, HUT_MAP = 100;
    function buildingPlace(type) {
        const F = T.api("Farming"), farm = F && F.farm ? F.farm() : null, list = farm && farm.buildings ? farm.buildings : {};
        const def = F && F.BUILDINGS ? F.BUILDINGS[type] : null, name = def ? def.name : "";
        const on = id => (list[id] || []).find(b => b.type === type && !b.site) || null;
        const here = $gameMap.mapId();
        if (here === HUT_MAP && on(HUT_MAP)) { const b = on(HUT_MAP); return { map: HUT_MAP, x: b.x, y: b.y, name }; }
        const b = on(FIELD) || (on(HUT_MAP) ? (list[FIELD] || []).find(x => x.type === "hut" && !x.site) : null);
        if (!b) return null;
        const d = F.BUILDINGS[b.type] || {}, w = b.w || d.w || 1, h = b.h || d.h || 1;
        return { map: FIELD, x: b.x + (w - 1) / 2, y: b.y - (h - 1) / 2, name: b.type === type ? name : (d.name || "Chatka") };
    }
    // a goal of the journal: its own where, the table, else (a story game) a building or crafting goal - grandpa's field
    function goalPlace(g) {
        let w = g.where;
        if (typeof w === "function") { try { w = w(); } catch (e) { w = null; } }
        if (!w) w = WHERE[g.id];
        if (typeof w === "function") { try { w = w(); } catch (e) { w = null; } }
        if (!w) {
            const ST = T.api("Story");
            if (!(ST && ST.active && ST.active())) return null;
            if (g.recipe && g.recipe[0] !== "hand") return buildingPlace(g.recipe[0]) || { map: FIELD, name: "Pole dziadka" };
            if (g.build) return { map: FIELD, name: "Pole dziadka" };
            return null;
        }
        return resolve(w);
    }
    function resolve(w) {
        if (!w) return null;
        if (w.person) return person(w.person);
        if (w.building) return buildingPlace(w.building);
        if (w.spot) return questSpot(w.spot);
        if (w.map === undefined) return null;
        if (w.event !== undefined && w.x === undefined) {
            const ev = findEvent(w.map, w.event);
            return { map: w.map, x: ev ? ev.x : undefined, y: ev ? ev.y : undefined, name: w.name || (ev ? ev.name : mapName(w.map)) };
        }
        return { map: w.map, x: w.x, y: w.y, name: w.name || mapName(w.map) };
    }
    function targetOf(info) {
        if (!info) return null;
        let t = null;
        try {
            if (info.source === "town") t = townPlace(info.id);
            else if (info.source === "board") t = boardPlace(info.id);
            else if (info.source === "goal" && info.goal) t = goalPlace(info.goal);
            else if (info.where) t = resolve(typeof info.where === "function" ? info.where() : info.where);   // (another source's own place)
        } catch (e) { console.error("[CleanHUD_Compass] target:", e); t = null; }
        if (t && !t.name) t.name = mapName(t.map);
        return t;
    }

    // ------------------------------------------------------------------
    // The way: on this map straight to it; else over the exits - the shortest by tiles walked (Dijkstra over the transfer events)
    // ------------------------------------------------------------------
    // this map's exits as they are now: an event whose page now has no transfer (a door locked by a switch) does not count
    function exitsHere() {
        const d = hereMap();
        if (!d) return [];
        const out = [];
        for (const e of d.exits) {
            const ev = $gameMap.event(e.id);
            if (!ev) { out.push(e); continue; }
            const page = ev.page();
            if (!page) continue;
            const c = (page.list || []).find(c => c.code === 201 && c.parameters && c.parameters[0] === 0);
            if (c) out.push({ id: e.id, x: ev.x, y: ev.y, to: { map: c.parameters[1], x: c.parameters[2], y: c.parameters[3] } });
        }
        return out;
    }
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    function route(tgt) {
        if (!tgt || !$gameMap || !$gamePlayer) return null;
        const here = $gameMap.mapId(), px = $gamePlayer._realX, py = $gamePlayer._realY;
        if (tgt.map === here) {
            if (tgt.x === undefined || tgt.y === undefined) return { here: true };
            return { x: tgt.x, y: tgt.y, steps: dist(tgt.x, tgt.y, px, py), direct: true };
        }
        const open = [], done = new Set();
        let pending = false, best = null;
        for (const e of exitsHere()) open.push({ cost: dist(e.x, e.y, px, py) + DOOR, map: e.to.map, x: e.to.x, y: e.to.y, first: e, key: here + ":" + e.id });
        while (open.length) {
            let mi = 0;
            for (let i = 1; i < open.length; i++) if (open[i].cost < open[mi].cost) mi = i;
            const n = open.splice(mi, 1)[0];
            if (n.goal) { best = n; break; }
            if (done.has(n.key)) continue;
            done.add(n.key);
            if (n.map === tgt.map) {
                open.push({ goal: true, cost: n.cost + (tgt.x === undefined ? 0 : dist(tgt.x, tgt.y, n.x, n.y)), first: n.first, key: "goal" });
                continue;
            }
            if (n.map === here) continue;   // (back on this map: its exits were the start)
            const d = mapData(n.map);
            if (!d) {
                if (DATA[n.map] !== "missing") { pending = true; if (!DATA[n.map]) { loadAll(); fetchMap(n.map); } }
                continue;
            }
            for (const e of d.exits) {
                const k = n.map + ":" + e.id;
                if (!done.has(k)) open.push({ cost: n.cost + dist(e.x, e.y, n.x, n.y) + DOOR, map: e.to.map, x: e.to.x, y: e.to.y, first: n.first, key: k });
            }
        }
        if (!best) return pending ? { pending: true } : null;
        return { x: best.first.x, y: best.first.y, steps: best.cost, via: best.first.to.map, exit: best.first.id, pending: pending && !allLoaded() };
    }

    // ------------------------------------------------------------------
    // The dial (the user, 2026-10-08: "ten kompas trzeba zamienić na taki okrągły w prawym górnym rogu"): a thin ring with a dark
    // outline over a lightly darkened inside, N E S W (north up, as the map is), the goal's arrow from the middle to the rim, and the
    // label under the dial ("Tawerna · 151 kroków"); the load, the torch's gauge and the minimap stand under it (CleanHUD.js)
    // ------------------------------------------------------------------
    const DIAL = { R: 44, right: 18, top: 8, think: 15, labelGap: 8, labelH: 22, turn: 0.25 };
    const SIZE = DIAL.R * 2 + 30;
    function Sprite_CleanCompass() {
        this.initialize(...arguments);
    }
    Sprite_CleanCompass.prototype = Object.create(CH.Sprite_CleanPart.prototype);
    Sprite_CleanCompass.prototype.constructor = Sprite_CleanCompass;
    Sprite_CleanCompass.prototype.initialize = function() {
        CH.Sprite_CleanPart.prototype.initialize.call(this, SIZE, SIZE);
        this.anchor.set(0.5, 0.5);
        this.drawDial();
        this._needle = new Sprite(this.needleBitmap());
        this._needle.anchor.set(0.5, 0.5);
        this._needle.visible = false;
        this._dot = new Sprite(this.dotBitmap());
        this._dot.anchor.set(0.5, 0.5);
        this._label = new Sprite();
        this._label.anchor.set(0.5, 0);
        this._label.visible = false;
        this.addChild(this._needle);
        this.addChild(this._dot);
        this.addChild(this._label);
        this._t = 0;
        this._mapId = 0;
        this._off = false;
        this._target = null;
        this._route = null;
        this._angle = null;
        this._box = { x: SIZE / 2 - DIAL.R - 4, y: SIZE / 2 - DIAL.R - 4, w: DIAL.R * 2 + 8, h: DIAL.R * 2 + 8 };
    };
    Sprite_CleanCompass.prototype.drawDial = function() {
        const b = this.bitmap, ctx = b.context, c = SIZE / 2, R = DIAL.R;
        b.clear();
        ctx.save();
        const g = ctx.createRadialGradient(c, c, 0, c, c, R);
        g.addColorStop(0, "rgba(0,0,0,0.2)");
        g.addColorStop(1, "rgba(0,0,0,0.45)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();
        for (const [w, col] of [[3.2, "rgba(0,0,0,0.7)"], [1.2, "rgba(246,242,234,0.85)"]]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.stroke();
        }
        // ticks every 30 degrees between the letters
        for (let d = 0; d < 360; d += 30) {
            if (d % 90 === 0) continue;
            const a = (d - 90) * Math.PI / 180, x0 = c + Math.cos(a) * (R - 6), y0 = c + Math.sin(a) * (R - 6), x1 = c + Math.cos(a) * (R - 1), y1 = c + Math.sin(a) * (R - 1);
            for (const [w, col] of [[3, "rgba(0,0,0,0.6)"], [1, "rgba(220,224,214,0.85)"]]) {
                ctx.strokeStyle = col;
                ctx.lineWidth = w;
                ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
            }
        }
        ctx.restore();
        for (const [lab, d] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]]) {
            const a = (d - 90) * Math.PI / 180, x = c + Math.cos(a) * (R - 14), y = c + Math.sin(a) * (R - 14);
            textOut(b, lab, Math.round(x - 15), Math.round(y - 12), 30, 24, "center", { size: lab === "N" ? 17 : 14, color: lab === "N" ? C.accent : C.text, ow: 3 });
        }
        b._baseTexture.update();
    };
    // the goal's arrow, pointing up (turned to the goal): a thin line from the middle, the head on the ring
    Sprite_CleanCompass.prototype.needleBitmap = function() {
        const b = new Bitmap(SIZE, SIZE), ctx = b.context, c = SIZE / 2, R = DIAL.R;
        ctx.save();
        ctx.lineCap = "round";
        for (const [w, col] of [[4.5, "rgba(0,0,0,0.55)"], [2, "rgba(255,210,63,0.9)"]]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(c, c - 7); ctx.lineTo(c, c - R + 22); ctx.stroke();
        }
        const tip = c - R - 9, base = c - R + 6;
        ctx.beginPath(); ctx.moveTo(c, tip); ctx.lineTo(c + 7.5, base); ctx.lineTo(c, base - 3); ctx.lineTo(c - 7.5, base); ctx.closePath();
        ctx.fillStyle = C.accent;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        b._baseTexture.update();
        return b;
    };
    Sprite_CleanCompass.prototype.dotBitmap = function() {
        const b = new Bitmap(14, 14), ctx = b.context;
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath(); ctx.arc(7, 7, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.arc(7, 7, 3, 0, Math.PI * 2); ctx.fill();
        b._baseTexture.update();
        return b;
    };
    Sprite_CleanCompass.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if ($gameMap && $gameMap.mapId() !== this._mapId) { this._mapId = $gameMap.mapId(); this._off = T.mapFlag("Compass", true, "off") === false; this._t = 0; this._angle = null; }
        this.visible = CH.isClean() && !this._off && !!$gameSystem;
        if (!this.visible) return;
        this.x = Graphics.width - DIAL.right - DIAL.R;
        this.y = DIAL.top + DIAL.R + 4;
        if (this._t-- <= 0) {   // (the goal and the way: a few times a second)
            this._t = DIAL.think;
            this._target = targetOf(CH.goalInfo(SceneManager._scene));
            this._route = this._target ? route(this._target) : null;
        }
        this.updateNeedle();
    };
    // where the column under it goes on (the load, the torch, the minimap): the label's room is kept even without a label
    Sprite_CleanCompass.prototype.bottom = function() {
        return this.y + DIAL.R + DIAL.labelGap + DIAL.labelH + 6;
    };
    Sprite_CleanCompass.prototype.updateNeedle = function() {
        const t = this._target, r = this._route, n = this._needle, l = this._label;
        const show = !!(t && r && !r.here && r.x !== undefined), waiting = !!(t && r && r.pending && r.x === undefined);
        let text = null, near = false;
        if (show) {
            const px = $gamePlayer._realX, py = $gamePlayer._realY, dx = r.x - px, dy = r.y - py;
            near = !!r.direct && r.steps < HERE_NEAR;
            const want = Math.atan2(dx, -dy);   // (0 = north, up; clockwise)
            if (this._angle === null) this._angle = want;
            else {
                let d = want - this._angle;
                while (d > Math.PI) d -= Math.PI * 2;
                while (d < -Math.PI) d += Math.PI * 2;
                this._angle += d * DIAL.turn;
                if (this._angle > Math.PI) this._angle -= Math.PI * 2;   // (kept in -180..180: the shortest turn next time too)
                else if (this._angle <= -Math.PI) this._angle += Math.PI * 2;
            }
            n.rotation = this._angle;
            // (on another map: that map's name - "Tawerna · 140 kroków"; the goal line at the top left says who)
            const steps = Math.max(1, Math.round(r.steps)), name = r.direct ? t.name : mapName(t.map) || t.name;
            text = name + " · " + (near ? "tutaj" : steps + " " + CH.pl(steps, "krok", "kroki", "kroków") + (r.pending ? "?" : ""));
        } else if (waiting) text = (mapName(t.map) || t.name) + " · …";   // (the maps are still being read)
        else this._angle = null;
        n.visible = show && !near;
        const pulse = near ? 1.3 + 0.5 * Math.abs(Math.sin(Graphics.frameCount / 12)) : 1;
        this._dot.scale.set(pulse, pulse);
        l.visible = !!text;
        if (!text) return;
        if (l._text !== text) {
            l._text = text;
            const w = measure(text, 15) + 16, b = new Bitmap(w, DIAL.labelH);
            textOut(b, text, 0, 0, w, DIAL.labelH, "center", { size: 15, color: C.accent });
            l.bitmap = b;
            l._w = w;
        }
        // centred under the dial, kept inside the screen's right edge
        l.x = Math.round(Math.min(0, Graphics.width - 10 - this.x - (l._w || 0) / 2));
        l.y = DIAL.R + DIAL.labelGap;
    };
    Sprite_CleanCompass.prototype.hudRect = function() {
        if (!this.visible) return new PIXI.Rectangle(0, 0, 0, 0);
        let x0 = this.x - DIAL.R - 4, x1 = this.x + DIAL.R + 4;
        const y0 = this.y - DIAL.R - 4;
        let y1 = this.y + DIAL.R + 4;
        if (this._label.visible && this._label._w) {
            x0 = Math.min(x0, this.x + this._label.x - this._label._w / 2);
            x1 = Math.max(x1, this.x + this._label.x + this._label._w / 2);
            y1 = this.y + this._label.y + DIAL.labelH;
        }
        return new PIXI.Rectangle(x0, y0, x1 - x0, y1 - y0);
    };
    Sprite_CleanCompass.prototype.info = function() {
        const t = this._target, r = this._route, a = this._angle, n = this._needle;
        return { target: t ? { map: t.map, x: t.x, y: t.y, name: t.name } : null, route: r ? Object.assign({}, r) : null,
            centre: { x: Math.round(this.x), y: Math.round(this.y), r: DIAL.R },
            angle: n.visible && a !== null ? Math.round(a * 180 / Math.PI) : null,
            marker: n.visible && a !== null ? { x: Math.round(this.x + Math.sin(a) * DIAL.R), y: Math.round(this.y - Math.cos(a) * DIAL.R) } : null,
            label: this._label.visible ? this._label._text : null, bottom: Math.round(this.bottom()) };
    };

    const _createCleanHud = Scene_Map.prototype.createCleanHud;
    Scene_Map.prototype.createCleanHud = function() {
        _createCleanHud.call(this);
        if (!this._cleanLayer || this._cleanCompass) return;
        this._cleanCompass = new Sprite_CleanCompass();
        this._cleanLayer.addChild(this._cleanCompass);
    };

    window.CleanCompass = T.register(PLUGIN, {
        WHERE, DATA, loadAll, allLoaded, mapData, mapName, findEvent, person, questSpot, townPlace, boardPlace, buildingPlace, goalPlace,
        resolve, targetOf, route, exitsHere,
        target: () => targetOf(CH.goalInfo(SceneManager._scene)),
        info: () => { const s = SceneManager._scene && SceneManager._scene._cleanCompass; return s ? s.info() : null; },
        // (the tests: think again now)
        refresh: () => { const s = SceneManager._scene && SceneManager._scene._cleanCompass; if (s) s._t = 0; return !!s; }
    });
})();
