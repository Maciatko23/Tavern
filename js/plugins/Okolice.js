//=============================================================================
// Okolice.js
//=============================================================================
// PAKIET 0 (docs/rozszerzenia/PLAN.md) - the shared engine of the four packages that fill the new terrain of the 21 enlarged maps.
// Nothing of the packages' own content is here; only what all of them use, so that none of them has to touch a shared file:
//   - the places: Okolice.registerSpots(pkg, [...]) - every object of a package (key, map, cells, mode); until a package registers
//     its own, the plan's places (OkoliceData.PLAN_SPOTS) stand for them. Okolice.checkMap() - the collision check of the map the hero
//     is on: each place inside the map, in the new terrain, free of other owners' events, passable, reached on foot (or NOT, for the
//     eagle's places), no two packages on one cell. Farming's random dry bushes are passable for it (they go under any event).
//   - the discoveries: Okolice.discoverable({ key, pkg, map, x, y, name, icon, text, xp, near, air, when }) and Okolice.discover(key);
//     a place found by walking close (near: tiles, default 1) or by the package itself; the journal's tab "Okolice" (Journal.addTab),
//     its places map by map, OK on one: the compass leads there (Journal.addTrackerSource); hint(key) / revealAll() for rumours and
//     the "Mapa okolic" (item 211, package C)
//   - the F9 rows of the packages: Okolice.f9.add({ owner, title, rows(), pick(row, delta), ok(row) }) - Debug.js shows them in the
//     tab "Wyspa i fabuła" (ok returns { go: [label, map, x, y, dir] } / { back: true } / { say, bad })
//   - the weather words: dryDaysAt(day), rainOn(day), snowOn(day), rainedRecently(day, n), hot(day) ("upał": summer and 6+ days
//     without rain), drought(day) ("susza": 10+ days without rain)
//   - the sun's shadow for any day and hour (the formula of Sky.js): shadowAt(day, hour, heightPx), underShadow(foot, cell, ...)
//   - the event builders for Tawerna.inject: page(), event(), script(), blank() (an event with no picture: it kills Farming's random
//     bush on its cell and does not stop the eagle's landing)
// The packages: A Zasoby, B Lowy, C Ludzie, D Zakon (their own files). Event ids of this core: 2000-2099 (none used yet).

/*:
 * @target MZ
 * @plugindesc [pakiet 0] Rdzeń rozszerzeń nowego terenu: odkrycia i zakładka dziennika „Okolice”, kompas, wiersze F9 paczek, upał i susza, cień słońca, test kolizji miejsc. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Orzel_Lot
 *
 * @help
 * ============================================================================
 * Okolice.js - wspólny rdzeń paczek nowego terenu (pakiet 0)
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md. Dane: Okolice_Data.js.
 *
 * Dla paczek (A Zasoby, B Lowy, C Ludzie, D Zakon):
 *   Okolice.registerSpots("A", [{ key, map, x, y, w, h, mode, name }])
 *   Okolice.discoverable({ key, pkg, map, x, y, name, text, xp, near })
 *   Okolice.discover(key)            - odkrycie (dymek u góry, PD, zakładka)
 *   Okolice.track(key, { ifNone })   - kompas prowadzi do miejsca (null: przestań)
 *   Okolice.f9.add({ owner, title, rows, pick, ok })   - wiersze F9
 *   Okolice.hot(dzień), drought(dzień), rainOn(dzień), dryDaysAt(dzień)
 *   Okolice.shadowAt(dzień, godzina, wysokośćPx)        - cień słońca
 *   Okolice.blank(id, x, y)          - pusty znacznik (gasi losowy krzak)
 *   Okolice.checkMap()               - kolizje miejsc na tej mapie
 *
 * Zakładka dziennika „Okolice”: znalezione miejsca, mapa po mapie;
 * OK prowadzi kompasem. F9 (zakładka „Wyspa i fabuła”): miejsca planu,
 * kolizje na tej mapie, odkryj wszystko / zapomnij, pogoda dziś.
 * Woda: nic tu nie daje wody.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "Okolice";
    const T = window.Tawerna;
    if (!T) throw new Error("Okolice.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const D = window.OkoliceData;
    if (!D) throw new Error("Okolice.js: Okolice_Data.js musi stać wyżej na liście wtyczek");

    const store = T.state.define("okolice", () => ({ found: {}, hinted: {}, track: null, revealed: false }), { version: 1, owner: PLUGIN });
    const day = () => T.time.day();
    const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m));
    const smooth = t => t * t * (3 - 2 * t);
    const mapName = id => { const m = window.$dataMapInfos && $dataMapInfos[id]; return m ? m.name : "Mapa " + id; };
    const OWNERS = new Set(["Okolice"].concat(Object.keys(D.PACKAGES).map(k => D.PACKAGES[k].owner)));
    const ownerOfPkg = pkg => (pkg === "0" ? "Okolice" : (D.PACKAGES[pkg] || {}).owner || "");
    const warn = m => { try { console.warn("Okolice: " + m); } catch (e) { /* (no console) */ } };

    // ------------------------------------------------------------------
    // The places of the packages (and, until a package registers its own, the plan's)
    // ------------------------------------------------------------------
    const MODES = ["reach", "soft", "eagle", "wall", "dive", "tide", "zone"];
    const registered = [];
    function cellsOf(s) {
        if (Array.isArray(s.cells)) return s.cells.map(c => [c[0], c[1]]);
        const out = [];
        for (let y = s.y; y < s.y + (s.h || 1); y++) for (let x = s.x; x < s.x + (s.w || 1); x++) out.push([x, y]);
        return out;
    }
    function registerSpots(pkg, list) {
        if (pkg !== "0" && !D.PACKAGES[pkg]) { warn("registerSpots: nie ma paczki " + pkg); return 0; }
        let n = 0;
        for (const s of [].concat(list || [])) {
            if (!s || !s.key || !(s.map > 0) || !(Array.isArray(s.cells) || s.x >= 0)) { warn("registerSpots(" + pkg + "): złe miejsce " + JSON.stringify(s)); continue; }
            const e = Object.assign({ mode: "reach", kind: "", name: s.key }, s, { pkg });
            if (!MODES.includes(e.mode)) { warn("registerSpots(" + pkg + "): nieznany tryb " + e.mode + " (" + e.key + ")"); continue; }
            const i = registered.findIndex(o => o.key === e.key);
            if (i >= 0) registered.splice(i, 1, e); else registered.push(e);
            n++;
        }
        return n;
    }
    // a package that registered anything stands for all its places (its plan places drop out)
    function spots(mapId) {
        const pkgs = new Set(registered.map(s => s.pkg));
        const all = registered.concat(D.PLAN_SPOTS.filter(s => !pkgs.has(s.pkg)));
        return mapId === undefined ? all.slice() : all.filter(s => s.map === mapId);
    }

    // ------------------------------------------------------------------
    // The collision check of the map the hero is on (the packages' tests and the F9 row)
    // ------------------------------------------------------------------
    const IGNORE_OWNERS = new Set(["TownLife", "Forestry"]);   // (the residents walk about; the planted pines are the player's)
    const DIRS = [[2, 0, 1, 8], [4, -1, 0, 6], [6, 1, 0, 4], [8, 0, -1, 2]];
    function bushAt(x, y) {
        const F = T.api("Farming");
        try { return !!(F && F.gatherKindOf && F.gatherKindOf(x, y) === "bush"); } catch (e) { return false; }
    }
    const passDir = (x, y, d) => $gameMap.isPassable(x, y, d) || bushAt(x, y);
    const ownerOf = id => { const e = window.$dataMap && $dataMap.events[id]; return e ? e._twOwner || "" : ""; };
    function blockingAt(x, y) {
        return $gameMap.eventsXyNt(x, y).some(e => {
            const o = ownerOf(e.eventId());
            if (OWNERS.has(o) || IGNORE_OWNERS.has(o)) return false;   // (the packages' own objects stand on their own places)
            return e.isNormalPriority() && !e.isThrough() && !e._erased;
        });
    }
    // every cell one walks to from (x, y): 4 directions, the tiles' passage both ways, the events in the way (not the packages')
    function walk(from) {
        const seen = new Set();
        if (!from || !$gameMap.isValid(from[0], from[1])) return seen;
        const q = [[from[0], from[1]]];
        seen.add(from[0] + "," + from[1]);
        while (q.length) {
            const [x, y] = q.pop();
            for (const [d, dx, dy, r] of DIRS) {
                const nx = x + dx, ny = y + dy, k = nx + "," + ny;
                if (seen.has(k) || !$gameMap.isValid(nx, ny)) continue;
                if (!passDir(x, y, d) || !passDir(nx, ny, r) || blockingAt(nx, ny)) continue;
                seen.add(k);
                q.push([nx, ny]);
            }
        }
        return seen;
    }
    function tideLow() {
        const W = T.api("Wyspa") || window.Wyspa;
        try { return !!(W && W.tide && W.tide().low); } catch (e) { return true; }
    }
    function checkMap() {
        const mapId = $gameMap.mapId(), list = spots(mapId), problems = [], bushes = [];
        const entry = D.ENTRY[mapId], reach = entry ? walk(entry) : null, old = D.OLD[mapId], low = tideLow();
        const taken = new Map();
        for (const s of list) {
            const owner = ownerOfPkg(s.pkg), seedReach = s.mode === "eagle" && s.seed ? walk(s.seed) : null;
            for (const [x, y] of cellsOf(s)) {
                const k = x + "," + y, where = s.key + " (" + x + "," + y + ")";
                if (!$gameMap.isValid(x, y)) { problems.push(where + ": poza mapą"); continue; }
                if (old && !s.allowOld && x < old[0] && y < old[1]) problems.push(where + ": w starej części mapy");
                if (s.mode !== "zone" && s.pkg !== "0") {
                    const o = taken.get(k);
                    if (o && o.pkg !== s.pkg) problems.push(where + ": nachodzi na " + o.key + " (paczka " + o.pkg + ")");
                    else if (!o) taken.set(k, s);
                }
                if (s.mode === "zone") continue;
                // (2026-10-22) another owner's event on the cell; pakiet 0's places (the cove, the shoals) are ground the packages build on -
                // their objects there are expected (package D's pieces of the wreck lie on the shoals, plan 7.10)
                const foreign = ($dataMap.events || []).filter(e => {
                    if (!e || e.x !== x || e.y !== y) return false;
                    const o = e._twOwner || "";
                    if (IGNORE_OWNERS.has(o) || o === owner) return false;
                    return !(s.pkg === "0" && OWNERS.has(o));
                });
                if (s.mode !== "wall" && s.mode !== "dive" && foreign.length) problems.push(where + ": zdarzenie " + foreign.map(e => (e._twOwner || "edytor") + " " + e.id + " " + e.name).join(", "));
                const pass = [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)), bush = bushAt(x, y);
                if (bush) bushes.push(where);
                if (s.mode === "wall") { if (pass && !bush) problems.push(where + ": przechodnie (ma być ściana)"); continue; }
                if (s.mode === "dive") {
                    if (pass) problems.push(where + ": przechodnie (ma być w wodzie przy klifie)");
                    if (reach && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has((x + dx) + "," + (y + dy)))) problems.push(where + ": obok pola dostępnego pieszo");
                    continue;
                }
                if (s.mode === "tide" && !low) continue;   // (at high tide the shoals are under water - checked at low tide)
                if (!pass && !bush) { problems.push(where + ": nieprzechodnie"); continue; }
                if (s.mode === "eagle") {
                    if (reach && reach.has(k)) problems.push(where + ": dostępne pieszo (ma być tylko z orła)");
                    if (seedReach && !seedReach.has(k)) problems.push(where + ": poza swoim odciętym kawałkiem");
                    continue;
                }
                if (reach && !reach.has(k)) problems.push(where + ": nie da się dojść pieszo");
            }
        }
        return { map: mapId, spots: list.length, problems, bushes, tide: mapId === 165 ? (low ? "odpływ" : "przypływ") : "" };
    }

    // ------------------------------------------------------------------
    // The weather words of the plan (Survival's day plan): rain, snow, days without rain, "upał", "susza"
    // ------------------------------------------------------------------
    function planOf(d) {
        const S = T.api("Survival") || window.Survival;
        try { return S && S.weatherPlan ? S.weatherPlan(d) : null; } catch (e) { return null; }
    }
    const rainOn = d => { const p = planOf(d); return !!p && p.type === "rain"; };
    const snowOn = d => { const p = planOf(d); return !!p && p.type === "snow"; };
    // the days before day d without rain (0 when it rains on d itself)
    function dryDaysAt(d) {
        const at = d === undefined ? day() : d;
        if (rainOn(at)) return 0;
        let n = 0;
        for (let k = at - 1; k >= 1 && n < D.WEATHER.lookBack; k--) { if (rainOn(k)) break; n++; }
        return n;
    }
    function rainedRecently(d, n) {
        const at = d === undefined ? day() : d;
        for (let k = at - (n === undefined ? 1 : n); k <= at; k++) if (k >= 1 && rainOn(k)) return true;
        return false;
    }
    const hot = d => { const at = d === undefined ? day() : d; return T.time.season(at) === D.WEATHER.hotSeason && dryDaysAt(at) >= D.WEATHER.hotDays; };
    const drought = d => dryDaysAt(d) >= D.WEATHER.droughtDays;

    // ------------------------------------------------------------------
    // The sun's shadow for any day and hour (Sky.js: sunElev, sunNow, shadowMatrix): direction by the share of the day gone (p), length
    // by the sun's height. dx, dy in pixels for an object hPx tall (dy already flattened like the drawn shadow); ux, uy: the direction
    // as Sky.now() gives it (dx, dy unflattened); light: how strong it is drawn without weather
    // ------------------------------------------------------------------
    function shadowAt(d, h, hPx) {
        const Sky = T.api("Sun") || window.Sky;
        if (!Sky || !Sky.elevation) return null;
        const at = d === undefined ? day() : d, hour = h === undefined ? T.time.hour() : h;
        const { elev, p } = Sky.elevation(hour, T.time.season(at));
        if (!(p > 0 && p < 1)) return null;
        const phi = (p - 0.5) * Math.PI * 0.92, len = Math.min(2.4, 0.6 / Math.tan((Math.max(5, elev) * Math.PI) / 180));
        const L = len * (hPx || 96), flat = Sky.FLAT || 0.55;
        const light = smooth(Math.min(1, elev / 3)) * (0.22 + 0.78 * smooth(Math.max(0, Math.min(1, (elev - 4) / 18))));
        return { p, elev, phi, len, ux: Math.sin(phi), uy: Math.cos(phi), dx: L * Math.sin(phi), dy: flat * L * Math.cos(phi), light };
    }
    // does the shadow of an object standing on tile foot {x, y} (hPx tall) cover the middle of tile cell {x, y} within tol tiles?
    function underShadow(foot, cell, d, h, hPx, tol) {
        const s = shadowAt(d, h, hPx);
        if (!s) return false;
        const T48 = 48, ax = (foot.x + 0.5) * T48, ay = (foot.y + 0.9) * T48, bx = ax + s.dx, by = ay + s.dy;
        const px = (cell.x + 0.5) * T48, py = (cell.y + 0.5) * T48, vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
        return Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) <= (tol === undefined ? 0.5 : tol) * T48;
    }

    // ------------------------------------------------------------------
    // The event builders for Tawerna.inject
    // ------------------------------------------------------------------
    const BLANK_COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const script = js => [{ code: 355, indent: 0, parameters: [String(js)] }];
    // page({ image, list, priority (0 below, 1 same, 2 above; default 1), through, trigger, cond, directionFix, stepAnime, walkAnime })
    function page(o) {
        const q = o || {};
        return { conditions: Object.assign({}, BLANK_COND, q.cond || {}), directionFix: !!q.directionFix,
            image: Object.assign({ tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, q.image || {}),
            list: (q.list || []).concat([{ code: 0, indent: 0, parameters: [] }]),
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: q.priority === undefined ? 1 : q.priority, stepAnime: !!q.stepAnime, through: !!q.through, trigger: q.trigger || 0,
            walkAnime: q.walkAnime !== undefined ? !!q.walkAnime : false };
    }
    const event = (id, name, x, y, pages, note) => ({ id, name: String(name || ""), note: note || "", x, y, pages: [].concat(pages || [{}]).map(p => (p && p.conditions ? p : page(p))) });
    const blank = (id, x, y, name) => event(id, name || "Znacznik (Okolice)", x, y, [page({ priority: 0, through: true })], "<Okolice:znacznik>");

    // ------------------------------------------------------------------
    // The discoveries, the journal's tab "Okolice", the compass
    // ------------------------------------------------------------------
    const DISC = new Map();
    function discoverable(def) {
        if (!def || !def.key || !(def.map > 0)) { warn("discoverable: złe miejsce " + JSON.stringify(def)); return null; }
        const e = Object.assign({ xp: 25, near: 1, icon: D.ICONS.odkrycie, text: "", air: false }, def);
        DISC.set(e.key, e);
        return e.key;
    }
    const isFound = key => !!store().found[key];
    function discover(key, quiet) {
        const d = DISC.get(key), s = store();
        if (!d || s.found[key]) return false;
        s.found[key] = day();
        const C = T.api("Combat") || window.Combat;
        if (C && C.gainXp && d.xp > 0) C.gainXp(d.xp, D.TEXT.discovered + ": " + d.name, true);
        if (!quiet) {
            T.popup(d.name, { icon: d.icon, top: true, sub: D.TEXT.discovered + "  ·  " + mapName(d.map) + (d.xp > 0 ? "  ·  +" + d.xp + " dośw." : "") });
            T.audio && T.audio.se && T.audio.se("Item3", { volume: 70, pitch: 110 });
        }
        T.emit("okoliceDiscover", { key, pkg: d.pkg, map: d.map });
        return true;
    }
    const hint = key => { if (DISC.has(key) && !isFound(key)) { store().hinted[key] = day(); return true; } return false; };
    const revealAll = () => { store().revealed = true; };
    const forget = () => { const s = store(); s.found = {}; s.hinted = {}; s.track = null; s.revealed = false; };
    // the compass of "Okolice": track(key) leads to a place (found, hinted or revealed), track(null) stops, track() says where it leads;
    // { ifNone: true } - only when it leads nowhere yet (a package's hint must not take the player's own choice away)
    function track(key, opts) {
        const s = store();
        if (key === undefined) return s.track || null;
        if (key === null) { s.track = null; return true; }
        if (!DISC.has(key) || !(isFound(key) || known(key))) return false;
        if (opts && opts.ifNone && s.track && s.track !== key) return false;
        s.track = key;
        return true;
    }
    const discoverAll = () => { for (const k of DISC.keys()) discover(k, true); };
    const known = key => isFound(key) || !!store().hinted[key] || store().revealed;
    // walking close finds a place (every half second, on a calm map)
    T.onMapUpdate(() => {
        if (!window.$gameMap || !$gamePlayer) return;
        const mapId = $gameMap.mapId(), px = $gamePlayer.x, py = $gamePlayer.y;
        for (const d of DISC.values()) {
            if (d.map !== mapId || d.near < 0 || isFound(d.key)) continue;
            if (Math.max(Math.abs(px - d.x), Math.abs(py - d.y)) > d.near) continue;
            let ok = true;
            if (typeof d.when === "function") { try { ok = !!d.when(); } catch (e) { ok = false; } }
            if (ok) discover(d.key);
        }
    }, { owner: PLUGIN, name: "discover", every: 30, calm: true });

    function tabItems() {
        const list = Array.from(DISC.values()).sort((a, b) => (mapName(a.map) + a.name).localeCompare(mapName(b.map) + b.name, "pl"));
        if (!list.length) return [{ label: D.TEXT.tab, icon: D.ICONS.okolice, mark: "todo", empty: true }];
        const s = store();
        return list.map(d => {
            const f = isFound(d.key), k = known(d.key);
            return { label: f || k ? d.name : D.TEXT.unknown, icon: f ? d.icon : 0, mark: s.track === d.key ? "pin" : f ? "done" : "todo",
                right: mapName(d.map), dim: !f, okolice: d.key };
        });
    }
    function tabDetail(it) {
        if (!it || it.empty) return { ops: [{ k: "title", text: D.TEXT.tab }, { k: "rule" }, { k: "p", text: D.TEXT.emptyTab }] };
        const d = DISC.get(it.okolice), s = store();
        if (!d) return { ops: [] };
        const f = isFound(d.key);
        const ops = [{ k: "title", text: f || known(d.key) ? d.name : D.TEXT.unknown }, { k: "sub", text: mapName(d.map) + (f ? "  ·  znalezione dnia " + s.found[d.key] : s.hinted[d.key] ? "  ·  " + D.TEXT.hinted : "") }, { k: "rule" }];
        ops.push({ k: "p", text: f ? d.text || d.name : "Jeszcze tego nie znalazłeś." });
        if (d.air) ops.push({ k: "muted", text: D.TEXT.airOnly });
        if (f || known(d.key)) ops.push({ k: "muted", text: s.track === d.key ? "OK: przestań prowadzić" : "OK: kompas prowadzi tutaj" });
        return { ops };
    }
    function tabOk(it) {
        const d = it && DISC.get(it.okolice), s = store();
        if (!d || !(isFound(d.key) || known(d.key))) return;
        if (s.track === d.key) { track(null); T.popup(D.TEXT.trackOff, { kind: "info", menu: true }); }
        else {
            const J = T.api("Journal");   // (one thing followed at a time: the journal lets go of its pinned goal / quest / contract)
            if (J && J.unpinOthers) J.unpinOthers("okolice");
            if (track(d.key)) T.popup(fill(D.TEXT.trackOn, { name: d.name }), { kind: "info", menu: true });
        }
    }
    (function addTab() {
        const J = T.api("Journal") || window.Journal;
        if (!J || !J.addTab || (J.TABS || []).includes(D.TEXT.tab)) return;
        J.addTab({ name: D.TEXT.tab, items: () => tabItems(), detail: it => tabDetail(it), ok: it => tabOk(it),
            legend: () => fill(D.TEXT.legend, { n: Array.from(DISC.keys()).filter(isFound).length, m: DISC.size }), help: D.TEXT.tabHelp });
        if (J.addTrackerSource) J.addTrackerSource(() => {
            const s = window.$gameSystem ? store() : null, d = s && s.track ? DISC.get(s.track) : null;
            if (!d) return null;
            return { label: "OKOLICE", title: d.name, line: mapName(d.map), key: "okolice:" + d.key, icon: d.icon, where: { map: d.map, x: d.x, y: d.y, name: d.name } };
        }, { owner: "okolice", pinned: () => (window.$gameSystem ? store().track || null : null), unpin: () => { if (window.$gameSystem) store().track = null; } });
    })();

    // ------------------------------------------------------------------
    // F9: the packages' rows (Debug.js shows them in the tab "Wyspa i fabuła") and the core's own
    // ------------------------------------------------------------------
    const F9 = [];
    const ORDER = { Okolice: 0, Zasoby: 1, Lowy: 2, Ludzie: 3, Zakon: 4 };
    const f9 = {
        add(def) {
            if (!def || !def.owner || typeof def.rows !== "function") return false;
            const i = F9.findIndex(s => s.owner === def.owner);
            if (i >= 0) F9.splice(i, 1, def); else F9.push(def);
            F9.sort((a, b) => (ORDER[a.owner] === undefined ? 9 : ORDER[a.owner]) - (ORDER[b.owner] === undefined ? 9 : ORDER[b.owner]));
            return true;
        },
        sections() {
            return F9.map(s => {
                let rows = [];
                try { rows = s.rows() || []; } catch (e) { warn("F9 " + s.owner + ": " + (e.message || e)); }
                return { owner: s.owner, title: s.title || s.owner, rows };
            });
        },
        pick(row, delta) {
            const s = F9.find(x => x.owner === row.owner);
            if (s && s.pick) { try { s.pick(row, delta); } catch (e) { warn("F9 " + s.owner + ": " + (e.message || e)); } }
        },
        ok(row) {
            const s = F9.find(x => x.owner === row.owner);
            if (!s || !s.ok) return { say: "Brak obsługi tego wiersza", bad: true };
            try { return s.ok(row) || null; } catch (e) { return { say: String(e.message || e), bad: true }; }
        }
    };
    let lastSpot = 0;
    const spotLabel = i => { const all = spots(), s = all[i]; return s ? "Miejsce " + (i + 1) + "/" + all.length + ": " + s.name + " (mapa " + s.map + ")   ←→" : "Brak miejsc"; };
    f9.add({ owner: PLUGIN, title: "Nowy teren (pakiet 0: Okolice):",
        rows: () => [
            { label: spotLabel(lastSpot), icon: D.ICONS.f9, desc: "←→ wybierz miejsce z planu (docs/rozszerzenia/PLAN.md), OK przenosi na nie.", what: "spot", pick: lastSpot },
            { label: "Kolizje miejsc na tej mapie", icon: D.ICONS.f9, desc: "Sprawdza miejsca paczek na tej mapie: wolne, przechodnie, dojście pieszo (orle: bez dojścia), bez nakładania.", what: "check" },
            { label: "Odkryj wszystkie miejsca", icon: D.ICONS.odkrycie, desc: "Wszystkie miejsca zarejestrowane przez paczki trafiają do zakładki „Okolice” (bez dymków).", what: "all" },
            { label: "Zapomnij odkrycia", icon: D.ICONS.odkrycie, desc: "Czyści zakładkę „Okolice”, podpowiedzi i kompas.", what: "forget" },
            { label: "Pogoda dziś (upał, susza, deszcz)", icon: 70, desc: "Pokazuje: dni bez deszczu, upał, susza, deszcz dziś i wczoraj.", what: "weather" }
        ],
        pick(row, delta) {
            if (row.what !== "spot") return;
            const n = spots().length || 1;
            lastSpot = row.pick = ((row.pick || 0) + delta + n) % n;
            row.label = spotLabel(row.pick);
        },
        ok(row) {
            if (row.what === "spot") {
                const s = spots()[row.pick || 0];
                if (!s) return { say: "Brak miejsc", bad: true };
                const c = cellsOf(s)[0];
                return { go: [s.name, s.map, c[0], c[1], 2] };
            }
            if (row.what === "check") {
                const r = checkMap();
                if (r.problems.length) { for (const p of r.problems.slice(0, 20)) warn(p); }
                return { say: "Kolizje: " + r.problems.length + " (miejsc " + r.spots + ", losowych krzaków " + r.bushes.length + ")" + (r.problems.length ? " - szczegóły w konsoli" : ""), bad: r.problems.length > 0 };
            }
            if (row.what === "all") { discoverAll(); return { say: "Odkryte: " + DISC.size }; }
            if (row.what === "forget") { forget(); return { say: "Odkrycia wyczyszczone" }; }
            if (row.what === "weather") {
                const d = day();
                return { say: "Dni bez deszczu: " + dryDaysAt(d) + (hot(d) ? ", upał" : "") + (drought(d) ? ", susza" : "") + (rainOn(d) ? ", deszcz dziś" : "") + (rainOn(d - 1) ? ", deszcz wczoraj" : "") };
            }
            return null;
        } });

    const item = name => (window.$dataItems ? $dataItems[D.ITEMS[name]] || null : null);

    window.Okolice = T.register(PLUGIN, { VERSION: D.VERSION, registerSpots, spots, cellsOf, checkMap, walk, bushAt,
        discoverable, discover, isFound, hint, revealAll, forget, discoverAll, known, track, discoverables: () => Array.from(DISC.values()),
        dryDaysAt, rainOn, snowOn, rainedRecently, hot, drought, shadowAt, underShadow,
        page, event, script, blank, f9, item, mapName });
})();
