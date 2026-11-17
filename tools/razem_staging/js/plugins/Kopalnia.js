//=============================================================================
// Kopalnia.js
//=============================================================================
// "Kopalnia pod Orlą Granią" (Map213; docs/questy_mapa/PLAN.md, 4 i 4a; tools/kopalnia/zbuduj.py): the way from the quarry (Map013) to the summit
// (Orla Grań, Map175) goes through a mine with rails. Two carts, one waiting at each end station; a ride is free; the cart runs along the rails'
// polyline (read from the map's marker events, not from tiles or collisions) at about four tiles a second, the camera on it; at the junction the
// lever's position decides the branch (the main line to the stairs, or the dead-end spur with the ore face); Esc brakes at the next station;
// at a station the hero steps out onto a free cell. No enemies, no saving during the ride (the save is simply refused), nothing to get stuck in:
// the whole mine is walkable on foot as well.
//
// The map's tags (notes of the events of Map213, written by tools/kopalnia/zbuduj.py):
//   <KopTor:main,N[,STOP]> / <KopTor:spur,N[,STOP]>  corner points of the cart's way (cell centres), in order; the spur starts at the junction J
//   <KopWysiadka:STOP,DIR>                           where the hero steps off at a station (the marker's cell) and the way he faces
//   <KopWagon:A|B|M|R>                               the parked carts of the ends (A, B), the moving cart (M), its front rim over the rider (R)
//   <KopDzwignia:1>                                  the lever of the junction
// Stops: A (the quarry's station), H (the halt before the junction), J (the junction itself), B (the station under the summit), S (the spur's end).
// The ride is one moving event (M) and a rim picture over the hero (R) - the hero himself stays the player (the cart carries his position).

/*:
 * @target MZ
 * @plugindesc Kopalnia pod Orlą Granią: wagoniki po torach (jazda bezpłatna, zwrotnica z dźwignią, ślepa odnoga z rudą), Esc hamuje na stacji. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Orzel_Lot
 *
 * @help
 * ============================================================================
 * Kopalnia.js - sztolnia z torami (Map213)
 * ============================================================================
 * Z kamieniołomu (Góry, Map013) wchodzi się sztolnią do kopalni; z jej drugiego
 * końca schody prowadzą na Orlą Grań. Po torach jeżdżą dwa wagoniki (po jednym
 * na końcu linii), jazda jest bezpłatna.
 *
 *  - O przy wagoniku: menu „Jedź / Zostań”; bohater wsiada, wagonik jedzie po
 *    torach ok. 4 kratek na sekundę, kamera za nim. Esc hamuje na najbliższej
 *    stacji (stacja przy zwrotnicy leży na trasie).
 *  - Zwrotnica: dźwignia przy torach (O) przestawia rozjazd. Z kamieniołomu wagonik
 *    jedzie albo linią główną na stację pod schodami, albo w ślepą odnogę
 *    z rudą (żyły do wykucia kilofem jak wszędzie); z odnogi wagonik sam zawraca,
 *    gdy bohater od niego odejdzie.
 *  - Na końcu jazdy bohater wysiada na wolną kratkę przy stacji. Zapisu w trakcie
 *    jazdy nie ma. Nic nie goni po kopalni, można też przejść ją piechotą.
 * Mapa i znaczniki: tools/kopalnia/zbuduj.py. API: window.Kopalnia (board, lever,
 * riding, state, model, ride - do testów).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Kopalnia.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Kopalnia";
    if (T.api(PLUGIN)) return;

    const MAP = 213;
    const SPEED = 4.0;            // tiles a second at full speed
    const ACCEL = 5.0;            // tiles a second squared
    const DECEL = 4.0;            // the usual braking (a Cancel late in the way brakes harder)
    const RIDE_LIFT = 15;         // pixels the hero stands higher in the cart (the front rim covers his legs)
    const RECALL_DIST = 4.5;       // the spur: the cart rolls back when the hero is this far from it
    const RECALL_WAIT = 90;       // ... for this many frames
    const SETTLE_DIST = 13;       // a resting cart goes back to its end when the hero is this far
    const CLACK_EVERY = 1;        // a clack of the wheels every N tiles
    const NAMES = { A: "Stacja przy kamieniołomie", H: "Mijanka przy zwrotnicy", B: "Stacja pod szczytem", S: "Koniec odnogi z rudą" };
    const TX = {
        ask: "Wagonik górniczy stoi na torach.",
        lever: ["Zwrotnica: linia na szczyt.", "Zwrotnica: odnoga z rudą."],
        goTop: "Jedź na szczyt", goSpur: "Jedź w odnogę z rudą", goBack: "Jedź do kamieniołomu", goOn: "Jedź dalej", stay: "Zostań",
        brake: "Esc - zahamuj na najbliższej stacji.",
        arrive: s => "Stacja: " + (NAMES[s] || s) + ".",
        danger: "Coś cię goni - nie ma czasu na jazdę.",
        busy: "Wagonik jedzie.",
        leverBusy: "Dźwignia stoi w miejscu - wagonik jedzie.",
        noCart: "Nie ma tu wagonika."
    };

    const store = T.state.define("kopalnia", () => ({ lever: 0, rides: 0 }), { version: 1, owner: PLUGIN });
    const popup = (text, kind) => { try { T.popup(text, { kind: kind || "info" }); } catch (e) { /* no popup */ } };

    // ------------------------------------------------------------------ the model (from the map's tags)
    let model = null;
    const num = v => parseInt(v, 10);
    function readModel() {
        const events = ($dataMap && $dataMap.events) || [];
        const m = { main: [], spur: [], exits: {}, carts: {}, lever: null };
        for (const e of events) {
            if (!e) continue;
            const note = e.note || "";
            let r;
            if ((r = /<KopTor:(main|spur),(\d+)(?:,(\w+))?>/.exec(note))) m[r[1]][num(r[2])] = { x: e.x, y: e.y, stop: r[3] || "" };
            if ((r = /<KopWysiadka:(\w+),(\d+)>/.exec(note))) m.exits[r[1]] = { x: e.x, y: e.y, dir: num(r[2]) };
            if ((r = /<KopWagon:(\w)>/.exec(note))) m.carts[r[1]] = e.id;
            if (/<KopDzwignia:1>/.test(note)) m.lever = e.id;
        }
        m.main = m.main.filter(Boolean); m.spur = m.spur.filter(Boolean);
        m.at = {};                                  // stop -> { line, index, x, y }
        m.main.forEach((p, i) => { if (p.stop) m.at[p.stop] = { line: "main", index: i, x: p.x, y: p.y }; });
        m.spur.forEach((p, i) => { if (p.stop && p.stop !== "J") m.at[p.stop] = { line: "spur", index: i, x: p.x, y: p.y }; });
        return m;
    }
    const jIndex = m => m.main.findIndex(p => p.stop === "J");
    // the corner points of the way from one stop to another (null: no such way)
    function route(m, from, to) {
        const a = m.at[from], b = m.at[to];
        if (!a || !b || from === to) return null;
        const J = jIndex(m);
        const mainSlice = (i, j) => (i <= j ? m.main.slice(i, j + 1) : m.main.slice(j, i + 1).reverse());
        let pts;
        if (a.line === "main" && b.line === "main") pts = mainSlice(a.index, b.index);
        else if (a.line === "main" && b.line === "spur") pts = mainSlice(a.index, J).concat(m.spur.slice(1));
        else if (a.line === "spur" && b.line === "main") pts = m.spur.slice().reverse().concat(mainSlice(J, b.index).slice(1));
        else return null;
        const out = [];
        for (const p of pts) { const q = out[out.length - 1]; if (!q || q.x !== p.x || q.y !== p.y) out.push(p); }
        return out;
    }

    // ------------------------------------------------------------------ the path: lines and quarter arcs of 0.5 tile (like the rail tiles)
    const unit = (ax, ay, bx, by) => { const dx = Math.sign(bx - ax), dy = Math.sign(by - ay); return [dx, dy]; };
    const dirOf = (dx, dy) => (dx > 0 ? 6 : dx < 0 ? 4 : dy > 0 ? 2 : 8);
    function buildPath(points) {
        const elems = [], stops = [];
        let cx = points[0].x, cy = points[0].y, s = 0;
        if (points[0].stop) stops.push({ s: 0, name: points[0].stop });
        const line = (x, y) => { const len = Math.abs(x - cx) + Math.abs(y - cy); if (len > 1e-9) elems.push({ t: "line", s0: s, len, ax: cx, ay: cy, bx: x, by: y, dir: dirOf(Math.sign(x - cx), Math.sign(y - cy)) }); s += len; cx = x; cy = y; };
        for (let i = 1; i < points.length; i++) {
            const P = points[i], din = unit(points[i - 1].x, points[i - 1].y, P.x, P.y);
            const nxt = points[i + 1], dout = nxt ? unit(P.x, P.y, nxt.x, nxt.y) : null;
            if (dout && (dout[0] !== din[0] || dout[1] !== din[1])) {
                line(P.x - 0.5 * din[0], P.y - 0.5 * din[1]);
                const ex = cx, ey = cy, xx = P.x + 0.5 * dout[0], xy = P.y + 0.5 * dout[1];
                const ccx = ex + 0.5 * dout[0], ccy = ey + 0.5 * dout[1];
                const a0 = Math.atan2(ey - ccy, ex - ccx);
                let a1 = Math.atan2(xy - ccy, xx - ccx), da = a1 - a0;
                while (da > Math.PI) da -= 2 * Math.PI;
                while (da < -Math.PI) da += 2 * Math.PI;
                const len = 0.5 * Math.abs(da);
                elems.push({ t: "arc", s0: s, len, cx: ccx, cy: ccy, r: 0.5, a0, da, d0: dirOf(din[0], din[1]), d1: dirOf(dout[0], dout[1]) });
                if (P.stop) stops.push({ s: s + len / 2, name: P.stop });
                s += len; cx = xx; cy = xy;
            } else {
                line(P.x, P.y);
                if (P.stop) stops.push({ s, name: P.stop });
            }
        }
        return { elems, total: s, stops };
    }
    function at(path, s) {
        s = Math.max(0, Math.min(path.total, s));
        let el = path.elems[path.elems.length - 1];
        for (const e of path.elems) if (s <= e.s0 + e.len + 1e-9) { el = e; break; }
        const k = el.len > 0 ? Math.max(0, Math.min(1, (s - el.s0) / el.len)) : 1;
        if (el.t === "line") return { x: el.ax + (el.bx - el.ax) * k, y: el.ay + (el.by - el.ay) * k, dir: el.dir };
        const a = el.a0 + el.da * k;
        return { x: el.cx + el.r * Math.cos(a), y: el.cy + el.r * Math.sin(a), dir: k < 0.5 ? el.d0 : el.d1 };
    }

    // ------------------------------------------------------------------ the events
    let ref = null;      // { A, B, M, R, lever } game events of this map (and the events array they came from)
    function refs() {
        if (!window.$gameMap || $gameMap.mapId() !== MAP || !window.$dataMap || !$gameMap._events) return null;
        if (ref && ref._ev === $gameMap._events) return ref;
        const m = model = readModel();
        const r = { _ev: $gameMap._events, A: $gameMap.event(m.carts.A), B: $gameMap.event(m.carts.B), M: $gameMap.event(m.carts.M), R: $gameMap.event(m.carts.R),
            lever: m.lever ? $gameMap.event(m.lever) : null };
        if (!r.M || !r.R || !r.A || !r.B) { ref = null; return null; }
        ref = r;
        initState(r);
        return r;
    }
    const hide = ev => { if (!ev) return; ev._kopDrive = false; if (!ev._erased) ev.erase(); };
    const show = ev => { if (ev && ev._erased) { ev._erased = false; ev.refresh(); } };
    function place(ev, x, y, dir) {
        ev._x = Math.round(x); ev._y = Math.round(y); ev._realX = x; ev._realY = y;
        if (dir) ev._direction = dir;
    }
    const _evUpdate = Game_Event.prototype.update;
    Game_Event.prototype.update = function() { if (this._kopDrive) return; _evUpdate.call(this); };

    // ------------------------------------------------------------------ the state of the mine on the map
    // at rest: the parked carts of the ends are there, M and R are away; after a ride M stands where it stopped (rest = { stop, origin })
    let ride = null;          // the ride in progress { path, s, v, ..., hero: bool }
    let rest = null;          // M standing at a station { stop, origin, quiet: frames the hero was far from it }

    function syncLever() {
        const r = ref;
        if (r && r.lever) r.lever._direction = store().lever ? 2 : 6;
    }
    // a map just set up (entered, or loaded from a save): the ends' carts parked, the moving cart and the rim away, nobody riding
    function initState(r) {
        ride = null; rest = null;
        for (const ev of [r.A, r.B]) { ev._kopDrive = false; show(ev); }
        for (const ev of [r.M, r.R]) hide(ev);
        if (window.$gamePlayer) $gamePlayer._kopRiding = false;
        syncLever();
    }
    T.on("mapLeave", () => { if (ride && ride.hero) endRideNow(); ref = null; model = null; ride = null; rest = null; }, { owner: PLUGIN });
    T.on("load", () => { ref = null; model = null; ride = null; rest = null; if (window.$gamePlayer) $gamePlayer._kopRiding = false; }, { owner: PLUGIN });

    // ------------------------------------------------------------------ the hero in the cart
    const _canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() { if (this._kopRiding) return false; return _canMove.call(this); };
    const _shiftY = Game_CharacterBase.prototype.shiftY;
    Game_CharacterBase.prototype.shiftY = function() { return _shiftY.call(this) + (this._kopRiding ? RIDE_LIFT : 0); };
    const _isSaveEnabled = Game_System.prototype.isSaveEnabled;
    Game_System.prototype.isSaveEnabled = function() { if (ride && ride.hero) return false; return _isSaveEnabled.call(this); };
    const _isMenuCalled = Scene_Map.prototype.isMenuCalled;
    Scene_Map.prototype.isMenuCalled = function() { if (ride && ride.hero) return false; return _isMenuCalled.call(this); };
    if (Scene_Map.prototype.canUseKeyMenu) {
        const _canUseKeyMenu = Scene_Map.prototype.canUseKeyMenu;
        Scene_Map.prototype.canUseKeyMenu = function() { if (ride && ride.hero) return false; return _canUseKeyMenu.call(this); };
    }
    for (const k of ["checkEventTriggerHere", "checkEventTriggerThere", "checkEventTriggerTouch", "startMapEvent"]) {
        const orig = Game_Player.prototype[k];
        if (orig) Game_Player.prototype[k] = function() { if (this._kopRiding) return false; return orig.apply(this, arguments); };
    }
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    const danger = () => {
        try {
            const FP = T.api("Farming_parts"), b = FP && FP.build;
            return b && b.restDanger ? b.restDanger() : "";
        } catch (e) { return ""; }
    };

    // ------------------------------------------------------------------ riding
    function startRide(from, to, o) {
        const r = refs(), m = model;
        const pts = m ? route(m, from, to) : null;
        if (!r || !pts) return false;
        const hero = !(o && o.empty);
        const path = buildPath(pts);
        const M = r.M;
        // the cart: from the parked one of its end (or where it stands now); the destination end's parked cart goes away for the ride
        if (!rest || rest.stop !== from) {
            const parked = r[from];
            if (parked) hide(parked);
        }
        rest = null;
        if (to === "A" || to === "B") hide(r[to]);
        show(M);
        M._kopDrive = true;
        M._through = true; M._priorityType = hero ? 0 : 1; M._directionFix = true;
        M._moveType = 0; M._stepAnime = false;
        const p0 = at(path, 0);
        place(M, p0.x, p0.y, p0.dir);
        M._pattern = 1; M._originalPattern = 1;
        ride = { from, to, path, s: 0, v: 0, hero, brake: false, clack: 0, dir: p0.dir, frames: 0 };
        if (hero) {
            const p = $gamePlayer, R = r.R;
            ride.pThrough = p._through;
            p._kopRiding = true;
            p.setThrough(true);
            p._walkAnime = false; p._stepAnime = false; p._pattern = 1;
            p._realX = p0.x; p._realY = p0.y; p._x = Math.round(p0.x); p._y = Math.round(p0.y);
            p._direction = p0.dir;
            show(R);
            R._kopDrive = true; R._through = true; R._priorityType = 2; R._directionFix = true;
            place(R, p0.x, p0.y, p0.dir);
            R._pattern = 1;
            p.center(p0.x, p0.y);
            store().rides = (store().rides || 0) + 1;
            if (store().rides <= 3) popup(TX.brake);
            T.audio.se("Machine", { volume: 24, pitch: 60 });
        }
        return true;
    }
    function nextStationAfter(s) {
        const st = ride.path.stops.filter(x => x.name !== "J" && x.s > s + 0.05).sort((a, b) => a.s - b.s)[0];
        return st ? st.s : ride.path.total;
    }
    function stepRide() {
        const r = refs();
        if (!r || !ride) return;
        if (SceneManager._scene && !(SceneManager._scene instanceof Scene_Map)) return;
        if ($gameMessage.isBusy()) return;
        const dt = 1 / 60;
        ride.frames++;
        if (ride.hero && !ride.brake && (Input.isTriggered("cancel") || Input.isTriggered("escape"))) { ride.brake = true; ride.brakeAt = nextStationAfter(ride.s); T.audio.se("Cursor1", { volume: 40, pitch: 90 }); }
        const stopS = ride.brake ? ride.brakeAt : ride.path.total;
        const left = stopS - ride.s;
        let vt = Math.min(SPEED, Math.sqrt(2 * DECEL * Math.max(0, left)) + 0.25);
        if (left <= 0.02) vt = 0;
        if (ride.v < vt) ride.v = Math.min(vt, ride.v + ACCEL * dt);
        else ride.v = Math.max(vt, ride.v - Math.max(DECEL, ride.v * ride.v / (2 * Math.max(left, 0.1))) * dt);
        ride.s += ride.v * dt;
        let arrived = false;
        if (ride.s >= stopS - 0.015 && (left <= 0.12 || ride.s >= stopS)) { ride.s = stopS; ride.v = 0; arrived = true; }
        const pos = at(ride.path, ride.s);
        const M = r.M;
        const pat = Math.floor(ride.s * 3) % 3;
        place(M, pos.x, pos.y, pos.dir); M._pattern = pat;
        if (ride.hero) {
            const p = $gamePlayer, R = r.R;
            p._realX = pos.x; p._realY = pos.y; p._x = Math.round(pos.x); p._y = Math.round(pos.y);
            p._direction = pos.dir; p._pattern = 1; p._pixelMoved = false;
            place(R, pos.x, pos.y, pos.dir); R._pattern = pat;
            p.center(pos.x, pos.y);
            const tile = Math.floor(ride.s);
            if (tile !== ride.clack) {
                ride.clack = tile;
                if (tile % CLACK_EVERY === 0 && ride.v > 0.5) T.audio.se("Knock", { volume: 20, pitch: 44 + (tile % 3) * 5 });
                if (tile % 11 === 0 && ride.v > 0.5) T.audio.se("Machine", { volume: 14, pitch: 55 });
            }
        }
        if (arrived) {
            // (where it stopped: the station at that distance - the halt when Esc braked it - else the destination)
            const hit = ride.path.stops.find(x => x.name !== "J" && Math.abs(x.s - ride.s) < 0.2);
            finishRide(pos, hit ? hit.name : ride.to);
        }
    }
    function heroOff(station) {
        const p = $gamePlayer, ex = model.exits[station] || { x: Math.round(p._realX), y: Math.round(p._realY), dir: 2 };
        const free = (x, y) => $gameMap.isValid(x, y) && [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e._erased);
        let best = [ex.x, ex.y];
        if (!free(ex.x, ex.y)) {
            let bd = 1e9;
            for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
                if (!free(ex.x + dx, ex.y + dy)) continue;
                const d = Math.hypot(dx, dy);
                if (d < bd) { bd = d; best = [ex.x + dx, ex.y + dy]; }
            }
        }
        p._kopRiding = false;
        p.setThrough(!!ride.pThrough);
        p.locate(best[0], best[1]);
        p._direction = ex.dir; p._pattern = 1;
        p.center(best[0], best[1]);
    }
    function finishRide(pos, to) {
        const r = refs(), hero = ride.hero;
        const M = r.M;
        M._kopDrive = false;
        M._priorityType = 1; M._through = false; M._directionFix = true;
        place(M, Math.round(pos.x), Math.round(pos.y), M._direction);
        M._pattern = 1;
        M.locate(Math.round(pos.x), Math.round(pos.y));
        if (hero) {
            heroOff(to);
            hide(r.R);
            popup(TX.arrive(to));
            T.emit("kopalniaRide", { from: ride.from, to });
        }
        const origin = ride.from, recalled = ride.recall;
        ride = null;
        if (recalled) { settle(); return; }
        rest = { stop: to, origin, quiet: 0, far: 0 };
        // the cart waits at the station it came to: on an end station it is that end's cart (the parked one is hidden)
        if (to === "A" || to === "B") hide(r[to]);
    }
    function endRideNow() {
        // a map left / a game loaded in the middle of a ride: the hero is put back as he was (no stuck state)
        const p = window.$gamePlayer;
        if (p) { p._kopRiding = false; if (ride) p.setThrough(!!ride.pThrough); }
        const r = refs();
        if (r) { for (const ev of [r.M, r.R]) ev._kopDrive = false; }
    }
    // the cart rolls back to its end (nobody in it): from the spur when the hero walks away, from anywhere when he is far
    function recall() {
        if (!rest) return;
        const r = refs(), to = rest.origin === "H" || !rest.origin ? "A" : rest.origin, from = rest.stop;
        if (!r || (from === to)) { settle(); return; }
        const hd = dist($gamePlayer._realX, $gamePlayer._realY, r.M._realX, r.M._realY);
        if (hd > 20 || !route(model, from, to)) { settle(); return; }
        const was = rest;
        rest = null;
        if (!startRide(from, to, { empty: true })) { rest = was; settle(); return; }
        ride.recall = true;
    }
    function settle() {
        const r = refs();
        if (!r) return;
        for (const ev of [r.A, r.B]) show(ev);
        hide(r.M); hide(r.R);
        r.M._kopDrive = false; r.R._kopDrive = false;
        rest = null;
    }

    // ------------------------------------------------------------------ the frame
    function update() {
        if (!window.$gameMap || $gameMap.mapId() !== MAP || !window.$gamePlayer) return;
        if (!refs()) return;
        if (ride) {
            try { stepRide(); } catch (e) { endRideNow(); ride = null; settle(); throw e; }
            return;
        }
        if (rest) {
            const r = refs(), hd = dist($gamePlayer._realX, $gamePlayer._realY, r.M._realX, r.M._realY);
            if (rest.stop === "S") {                            // the spur: the empty cart rolls back by itself once the hero leaves it alone
                rest.quiet = hd > RECALL_DIST ? rest.quiet + 1 : 0;
                if (rest.quiet > RECALL_WAIT) recall();
            } else if (hd > SETTLE_DIST) { rest.far++; if (rest.far > 120) settle(); } else rest.far = 0;
        }
    }
    T.onMapUpdate(update, { owner: PLUGIN, name: "mine", priority: 6 });

    // ------------------------------------------------------------------ the player's actions
    function destinations(stop) {
        const lever = store().lever ? "S" : "B";
        const out = [];
        if (stop === "A") out.push({ label: lever === "S" ? TX.goSpur : TX.goTop, to: lever });
        else if (stop === "H") { out.push({ label: lever === "S" ? TX.goSpur : TX.goTop, to: lever }); out.push({ label: TX.goBack, to: "A" }); }
        else if (stop === "B" || stop === "S") out.push({ label: TX.goBack, to: "A" });
        return out;
    }
    // where a parked / resting cart of this map stands: the stop its cell is
    function stopOfCart(ev) {
        const m = model || (model = readModel());
        for (const k of Object.keys(m.at)) if (m.at[k].x === ev._x && m.at[k].y === ev._y && k !== "J") return k;
        return null;
    }
    function board(interp) {
        const r = refs();
        if (!r) return false;
        if (ride) { popup(TX.busy); return false; }
        const ev = interp && interp.eventId ? $gameMap.event(interp.eventId()) : r.M;
        const stop = ev ? stopOfCart(ev) : null;
        if (!stop) { popup(TX.noCart); return false; }
        const d = danger();
        if (d) { popup(TX.danger, "need"); return false; }
        const opts = destinations(stop);
        if (!opts.length) return false;
        const names = opts.map(o => o.label).concat([TX.stay]);
        $gameMessage.add(TX.ask + ((stop === "A" || stop === "H") ? " " + TX.lever[store().lever ? 1 : 0] : ""));
        $gameMessage.setChoices(names, 0, names.length - 1);
        $gameMessage.setChoiceCallback(n => {
            const o = opts[n];
            if (!o) return;
            // (a resting cart on this stop is the one that goes; else the parked cart's end)
            ride = null;
            const ok = startRide(stop, o.to);
            if (!ok) popup(TX.noCart);
        });
        if (interp && interp.setWaitMode) interp.setWaitMode("message");
        return true;
    }
    function lever() {
        const r = refs();
        if (!r) return false;
        if (ride) { popup(TX.leverBusy); return false; }
        const s = store();
        s.lever = s.lever ? 0 : 1;
        syncLever();
        T.audio.se("Switch2", { volume: 70, pitch: 80 });
        T.audio.se("Chain", { volume: 40, pitch: 70 });
        popup(TX.lever[s.lever]);
        T.emit("kopalniaLever", { branch: s.lever ? "spur" : "main" });
        return true;
    }

    const api = {
        board, lever,
        riding: () => !!(ride && ride.hero),
        state: () => ({ lever: store().lever, ride: ride ? { from: ride.from, to: ride.to, s: ride.s, v: ride.v, hero: ride.hero, brake: ride.brake, total: ride.path.total, frames: ride.frames } : null,
            rest: rest ? { stop: rest.stop, origin: rest.origin } : null }),
        model: () => model || (model = readModel()),
        // for tests and debugging: start a ride from a stop to a stop without the menu
        ride: (from, to) => { if (!refs()) return false; if (ride) return false; return startRide(from, to); },
        brake: () => { if (ride && !ride.brake) { ride.brake = true; ride.brakeAt = nextStationAfter(ride.s); } },
        path: (from, to) => { const m = model || (model = readModel()), p = route(m, from, to); return p ? buildPath(p) : null; },
        constants: { SPEED, ACCEL, DECEL, RIDE_LIFT }
    };
    window.Kopalnia = T.register(PLUGIN, api);
})();
