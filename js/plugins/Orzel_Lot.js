//=============================================================================
// Orzel_Lot.js
//=============================================================================
// Riding the white eagle (the user's: "można na niego wejść - kamera robi zoom out mapy i lata się nad wszystkim"; docs/orzel/KONCEPCJA.md
// point 5; the data: Orzel_Data.js FLY). Needs Orzel.js.
//   - the camera far out: the world drawn at scale 0.5 (high: the travel) or 1 (low: over the tree tops - the dive, the landing; Q
//     switches). How: Tawerna.view's scale (TawernaCore), Game_Map.screenTileX / Y divided by it (the engine's scrolling and centering, the
//     events "near the screen"), the tilemap as wide as the view, the whole Spriteset_Map drawn at the scale from (0, 0) through the
//     screen's zoom; the textures filtered linearly while far (at 0.5 each screen pixel is the mean of 2 x 2 - no shimmer). The layers the
//     size of the screen inside the spriteset (the night, the rain, the rays...) read Tawerna.view (TawernaCore + the plugins); the
//     weather and the storm's leaves and flash are drawn at 1/scale here. At scale 1 nothing changes anywhere.
//   - the flight: no walls, no events touched, nothing can hit him (an archer's arrow low down hits the eagle); the eagle and its rider
//     drawn at their own size (1 / scale) over the smaller world, its shadow on the ground by the sun and the height, clouds, a sea of
//     fog past the map's edges; over an edge with a way out (the map's own edge transfers) on to the next map through a white cloud
//   - the landing (L): a free square 4 x 4 (in the towns their squares - Orzel_Data TOWN_SQUARES, region 31) outdoors, never in
//     NO_LAND; the wing strength runs down (Shift faster, rain more) - tired or in a storm it comes down by itself
//   - Space low: the dive at a foe under it; Enter: the flight's menu (land here, higher / lower, "lot daleki" to a place landed on before)
//   - no saving in the air (the autosave of the transfers too); after the landing an autosave
// The flight's state lives in this file (module) and in Orzel's state (lands, flights).

/*:
 * @target MZ
 * @plugindesc Lot na białym orle: oddalona kamera (x0,5 / x1), lot nad wszystkim, przeloty krawędziami map, lądowanie, nurkowanie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Orzel
 * @orderAfter MapZoom
 * @orderAfter FreeMovement
 * @orderAfter Farming_Render
 *
 * @help
 * ============================================================================
 * Orzel_Lot.js - lot na białym orle
 * ============================================================================
 * Dorosły orzeł (więź 60+): „Leć!” w jego menu (L albo przycisk akcji).
 * W locie: WASD / strzałki - lot, Shift - szybciej, Q - wyżej / niżej,
 * Spacja - nurkowanie (nisko), L - lądowanie, Enter - menu lotu (lot daleki).
 * Musi stać pod Orzel.js, MapZoom.js, FreeMovement.js i Farming_Render.js.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.OrzelData;
    if (!T || !D) throw new Error("Orzel_Lot.js: brak TawernaCore.js / Orzel_Data.js (the core or the eagle's data is missing)");
    if (T.api("Orzel_Lot")) return;
    const PLUGIN = "Orzel_Lot";
    const O = () => T.api("Orzel");
    const FLY = D.FLY, TX = D.TX;
    const TILE = 48;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const ease = t => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
    const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const S = () => O().state();
    const V = extra => Object.assign({ imie: O().nameOf() }, extra || {});
    const pop = (text, opts) => T.popup(fill(text, V(opts && opts.vars)), Object.assign({ icon: D.ICON.orzel, color: "#f3e8c8" }, opts || {}));

    let lot = null;   // the flight now: { on, phase, t, level, z, angle, speed, from, to, ... }
    const flying = () => !!(lot && lot.on);

    // ------------------------------------------------------------------
    // The camera: the view's scale (Tawerna.view), the engine's screen in tiles, the tilemap's size, the spriteset's zoom
    // ------------------------------------------------------------------
    const _screenTileX = Game_Map.prototype.screenTileX;
    Game_Map.prototype.screenTileX = function() {
        const s = T.view.scale();
        return s === 1 ? _screenTileX.call(this) : Math.round((_screenTileX.call(this) / s) * 16) / 16;
    };
    const _screenTileY = Game_Map.prototype.screenTileY;
    Game_Map.prototype.screenTileY = function() {
        const s = T.view.scale();
        return s === 1 ? _screenTileY.call(this) : Math.round((_screenTileY.call(this) / s) * 16) / 16;
    };
    let filterMode = 0;   // 0 nearest (the game's own), 1 linear (far out)
    function setFilter(linear) {
        const mode = linear ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST;
        const r = Graphics._app && Graphics._app.renderer && Graphics._app.renderer.plugins ? Graphics._app.renderer.plugins.rpgtilemap : null;
        if (r && r._internalTextures) for (const t of r._internalTextures) t.scaleMode = mode;
        const sc = SceneManager._scene, tm = sc && sc._spriteset && sc._spriteset._tilemap;
        if (tm) for (const ch of tm.children) { const bt = ch && ch.texture && ch.texture.baseTexture; if (bt && bt.scaleMode !== mode && !(ch === lotRing)) bt.scaleMode = mode; }
        filterMode = linear ? 1 : 0;
    }
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        const s = T.view.scale();
        const tm = this._tilemap;
        if (tm) {
            const w = Math.ceil(Graphics.width / s), h = Math.ceil(Graphics.height / s);
            if (tm.width !== w || tm.height !== h) { tm.width = w; tm.height = h; tm._needsRepaint = true; }
        }
        if (s !== 1 || this._orzelScaled) {
            const sc = $gameScreen;
            sc._zoomScale = s; sc._zoomScaleTarget = s; sc._zoomDuration = 0; sc._zoomX = 0; sc._zoomY = 0;
            this._orzelScaled = s !== 1;
        }
        _Spriteset_Map_update.call(this);
        // what is drawn the size of the screen, inside the spriteset: the weather, the storm's leaves and flash
        for (const k of ["_weather", "_stormLeaves", "_stormSky"]) { const sp = this[k]; if (sp && sp.scale.x !== 1 / s) sp.scale.set(1 / s, 1 / s); }
        if (flying()) updateWorldFx(this);
    };
    function applyScale(s) {
        const was = T.view.scale();
        T.view.setScale(s);
        if ((s < 1) !== (filterMode === 1)) setFilter(s < 1);
        if (s !== was && $gamePlayer) $gamePlayer.center($gamePlayer._realX, $gamePlayer._realY);
    }

    // ------------------------------------------------------------------
    // The hero in the air: no walls, no events, nobody's blow (an arrow low down: the eagle takes it)
    // ------------------------------------------------------------------
    // (in the air the hero cannot do anything on the ground: canMove is false for every system - the tools, the blows, the roll; the
    // flight itself is moved from this file's own frame)
    const _canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() { if (flying()) return false; return _canMove.call(this); };
    const airCalm = () => !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !($gameTemp && $gameTemp._farmMenuOpen) && !SceneManager.isSceneChanging();
    for (const k of ["checkEventTriggerHere", "checkEventTriggerThere", "checkEventTriggerTouch", "startMapEvent"]) {
        const orig = Game_Player.prototype[k];
        if (orig) Game_Player.prototype[k] = function() { if (flying()) return false; return orig.apply(this, arguments); };
    }
    const _isCollided = Game_Player.prototype.isCollided;
    Game_Player.prototype.isCollided = function(x, y) { if (flying()) return false; return _isCollided.call(this, x, y); };
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (flying()) { if (Input.isTriggered("ok") && lot.phase === "fly") flightMenu(); return true; }
        return _triggerButtonAction.call(this);
    };
    const _canUseKeyMenu = Scene_Map.prototype.canUseKeyMenu;
    Scene_Map.prototype.canUseKeyMenu = function() { if (flying()) return false; return _canUseKeyMenu ? _canUseKeyMenu.call(this) : true; };
    const _isSaveEnabled = Game_System.prototype.isSaveEnabled;
    Game_System.prototype.isSaveEnabled = function() { if (flying()) return false; return _isSaveEnabled.call(this); };
    function guardHits() {
        const C = T.api("Combat");
        if (!C || !C.hitPlayer || C.hitPlayer._orzel) return;
        const orig = C.hitPlayer;
        C.hitPlayer = function(opts) {
            if (!flying()) return orig.apply(this, arguments);
            // (2026-10-18: nothing reaches him up there - the archers shoot at the bird itself: Orzel.js, its body as their mark)
            return "miss";
        };
        C.hitPlayer._orzel = true;
        if (C.feel && C.feel.holdAuto) C.feel.holdAuto(() => flying());
    }

    // ------------------------------------------------------------------
    // Can it take off now: "" or why not
    // ------------------------------------------------------------------
    function stormNow() { const St = T.api("Storm"); return !!(St && St.level && St.level() > 0.35); }
    function why() {
        const s = S(), e = O().eagle;
        if (!s.have || s.stage < 4) return fill(TX.cannotFly, V());   // (the user: the fourth stage carries him too)
        if (s.bond < FLY.bond) return fill(TX.bondLow, V({ b: s.bond, n: FLY.bond }));
        if (s.st < O().maxSt() * FLY.minStart) return fill(TX.tooTired, V({ p: Math.round(100 * s.st / O().maxSt()) }));
        if (stormNow()) return fill(TX.storm, V());
        if (!e || e.ridden) return fill(TX.outside, V());
        const Sv = T.api("Survival");
        if ((Sv && Sv.isOutdoors && !Sv.isOutdoors()) || D.NO_LAND.includes($gameMap.mapId())) return fill(TX.notHere, V());
        return "";
    }

    // ------------------------------------------------------------------
    // Mounting: the hero on its back, up, the camera far out
    // ------------------------------------------------------------------
    function mount() {
        const w = why();
        if (w) { T.popup.need(D.ICON.orzel, w); return false; }
        const e = O().eagle, s = S(), p = $gamePlayer;
        if (e.overhead) { e.x = p._realX + 0.5; e.y = p._realY + 0.9; e.overhead = false; }   // (up over him: it comes down to him, not he to it)
        e.restAway = null; e.descending = false;
        // (the user 2026-10-18: "leć" takes off into the low flight - over the tree tops, the camera as on foot; Q takes it up high)
        lot = { on: true, phase: "takeoff", t: 0, level: "low", z: 0, angle: e.angle || -Math.PI / 2, speed: 0, sFrom: 1, sTo: FLY.low, warned: 0, said: {} };
        e.ridden = true;
        e.state = "fly";
        e.perched = null;
        e.foe = null;
        p._realX = e.x - 0.5; p._realY = e.y - 0.9; p._x = Math.round(p._realX); p._y = Math.round(p._realY);
        p.setTransparent(true);
        p.setThrough(true);
        if (p.followers) p.followers().hide();
        p.refresh();
        // the dog does not follow into the sky: back to its kennel (or it stays)
        const Dg = T.api("Dog");
        try { if (Dg && Dg.state && Dg.state().tame && Dg.state().mode === "follow") { if (Dg.kennel && Dg.setMode) Dg.setMode("work"); } } catch (x) { /* (no dog) */ }
        if ($gameSystem._combatMode) $gameSystem._combatMode = false;
        T.audio.se("Wind7", { volume: 70, pitch: 90 });
        T.audio.se("Evasion1", { volume: 50, pitch: 70 });
        pop(TX.mount, { color: "#9ff0a8" });
        s.flights = (s.flights || 0) + 1;
        if (s.flyDay !== T.time.day()) { s.flyDay = T.time.day(); O().addBond(D.CARE.bond.fly); }
        O().setFlag("orzelLot");
        O().autoChecks();
        T.emit("orzelMount", { map: $gameMap.mapId() });
        return true;
    }

    // ------------------------------------------------------------------
    // One frame of flight
    // ------------------------------------------------------------------
    function inputVec() {
        const d = Input.dir8;
        let x = 0, y = 0;
        if (d === 1 || d === 4 || d === 7) x = -1; else if (d === 3 || d === 6 || d === 9) x = 1;
        if (d === 7 || d === 8 || d === 9) y = -1; else if (d === 1 || d === 2 || d === 3) y = 1;
        return { x, y };
    }
    function flyStep() {
        if (lot.phase !== "fly") return;
        const p = $gamePlayer, s = S(), iv = inputVec(), fast = Input.isPressed("shift") && s.st > 2;
        const max = (fast ? FLY.speed.fast : lot.level === "high" ? FLY.speed.high : FLY.speed.low) / TILE;
        if (iv.x || iv.y) {
            const want = Math.atan2(iv.y, iv.x);
            let da = want - lot.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            lot.angle += clamp(da, -FLY.turn, FLY.turn);
            lot.speed = Math.min(max, lot.speed + FLY.accel / TILE);
            lot.input = true;
        } else { lot.speed *= FLY.drag; lot.input = false; }
        if (lot.speed > max) lot.speed = Math.max(max, lot.speed * 0.97);
        let nx = p._realX + Math.cos(lot.angle) * lot.speed, ny = p._realY + Math.sin(lot.angle) * lot.speed;
        const W = $gameMap.width(), H = $gameMap.height();
        const side = nx < -0.2 ? "W" : nx > W - 0.8 ? "E" : ny < -0.2 ? "N" : ny > H - 0.8 ? "S" : "";
        if (side) {
            const exit = exitOn(side, side === "N" || side === "S" ? nx : ny);
            if (exit) { startEdge(exit, side, nx, ny); return; }
            if (Graphics.frameCount - (lot.edgeSaid || -999) > 180) { lot.edgeSaid = Graphics.frameCount; pop(edgeText()); }
            nx = clamp(nx, 0, W - 1); ny = clamp(ny, 0, H - 1);
            lot.speed *= 0.5;
        }
        p._realX = nx; p._realY = ny; p._x = clamp(Math.round(nx), 0, W - 1); p._y = clamp(Math.round(ny), 0, H - 1);
        const dirs = { 0: 6, 1: 2, 2: 2, 3: 4, 4: 4, "-1": 8, "-2": 8, "-3": 4, "-4": 4 };
        p._direction = dirs[Math.round(lot.angle / (Math.PI / 4))] || p._direction;
        // the wing strength
        const k = fast ? FLY.cost.fast : FLY.cost.cruise;
        const wet = $gameScreen.weatherType && $gameScreen.weatherType() === "rain" ? FLY.cost.rain : 1;
        s.st = Math.max(0, s.st - (k * wet) / 60);
        lot.flapping = lot.input || lot.speed < max * 0.5;
    }
    function edgeText() {
        const note = String(($dataMap && $dataMap.note) || "");
        if (/<Water:salt>/i.test(note)) return TX.edgeSea;
        if ($gameMap.mapId() === D.GORY || $gameMap.mapId() === D.MAP) return TX.edgeMountain;
        return TX.edgeFog;
    }

    // ------------------------------------------------------------------
    // The edges: the map's own edge transfers (also the injected ones) - a side with a way out leads on, the rest is fog or sea
    // ------------------------------------------------------------------
    let exitsOf = { map: 0, data: null, list: null };
    function exits() {
        if (exitsOf.data === $dataMap && exitsOf.list) return exitsOf.list;
        const W = $dataMap.width, H = $dataMap.height, out = { N: [], S: [], W: [], E: [] };
        for (const ev of $dataMap.events || []) {
            if (!ev || !ev.pages) continue;
            const side = ev.y === 0 ? "N" : ev.y === H - 1 ? "S" : ev.x === 0 ? "W" : ev.x === W - 1 ? "E" : "";
            if (!side) continue;
            for (const pg of ev.pages) {
                const c = (pg.list || []).find(l => l && l.code === 201 && l.parameters && l.parameters[0] === 0);
                if (c) { out[side].push({ x: ev.x, y: ev.y, map: c.parameters[1], tx: c.parameters[2], ty: c.parameters[3], dir: c.parameters[4] }); break; }
            }
        }
        exitsOf = { map: $gameMap.mapId(), data: $dataMap, list: out };
        return out;
    }
    function exitOn(side, along) {
        const list = exits()[side];
        if (!list || !list.length) return null;
        let best = null, bd = Infinity;
        for (const x of list) { const d = Math.abs((side === "N" || side === "S" ? x.x : x.y) - along); if (d < bd) { bd = d; best = x; } }
        return best;
    }
    function startEdge(exit, side, nx, ny) {
        const along = side === "N" || side === "S" ? nx - exit.x : ny - exit.y;
        const tx = side === "N" || side === "S" ? exit.tx + along : exit.tx, ty = side === "N" || side === "S" ? exit.ty : exit.ty + along;
        lot.phase = "edge"; lot.t = 0;
        lot.edge = { map: exit.map, x: tx, y: ty, side };
        T.audio.se("Wind8", { volume: 55, pitch: 100 });
    }
    function updateEdge() {
        const e = lot.edge;
        lot.t++;
        fog.alpha = ease(lot.t / FLY.edgeFog);
        if (lot.t === FLY.edgeFog) {
            const p = $gamePlayer;
            lot.arrive = { x: e.x, y: e.y, side: e.side, angle: lot.angle };
            p.reserveTransfer(e.map, clamp(Math.round(e.x), 0, 999), clamp(Math.round(e.y), 0, 999), p.direction(), 2);
        }
    }
    // the new map: in the air again, two tiles in from the side it came in, the fog clears
    function arrive() {
        const a = lot.arrive, p = $gamePlayer;
        if (!a) return;
        lot.arrive = null;
        const W = $gameMap.width(), H = $gameMap.height(), inset = 2;
        let x = clamp(a.x, inset, W - 1 - inset), y = clamp(a.y, inset, H - 1 - inset);
        p._realX = x; p._realY = y; p._x = Math.round(x); p._y = Math.round(y);
        p.setTransparent(true);
        p.setThrough(true);
        lot.phase = "fogout"; lot.t = 0;
        S().map = $gameMap.mapId();
        exitsOf = { map: 0, data: null, list: null };
        ensureEagle();
        p.center(p._realX, p._realY);
    }
    function ensureEagle() {
        const Or = O(), p = $gamePlayer;
        let e = Or.eagle;
        if (!e) { S().map = $gameMap.mapId(); e = Or.spawnHere({}); }
        if (!e.ridden) {
            e.x = p._realX + 0.5; e.y = p._realY + 0.9;
            e.ridden = true; e.state = "fly"; e.z = lot.z; e.angle = lot.angle; e.perched = null; e.target = null; e.foe = null;
        }
        S().map = $gameMap.mapId();
        return e;
    }

    // ------------------------------------------------------------------
    // Altitude (Q), the dive (Space), the landing (L), the flight's menu (Enter), "lot daleki"
    // ------------------------------------------------------------------
    function setLevel(level) {
        if (!flying() || lot.phase !== "fly" || lot.level === level) return;
        lot.phase = "climb"; lot.t = 0;
        lot.sFrom = T.view.scale(); lot.sTo = level === "high" ? FLY.high : FLY.low;
        lot.zFrom = lot.z; lot.zTo = level === "high" ? FLY.highZ : FLY.lowZ;
        lot.level = level;
        T.audio.se("Wind7", { volume: 45, pitch: level === "high" ? 110 : 80 });
    }
    function dive() {
        const s = S(), cfg = (D.FIGHT[s.stage] || {}).dive, e = O().eagle;
        if (!flying() || lot.phase !== "fly" || !e) return;
        if (!cfg) { pop(TX.diveYoung); return; }   // (the fourth stage carries him, but dives only the adult)
        if (lot.level === "high") { pop(TX.diveHigh); return; }
        if (s.st < cfg.cost) { pop(TX.diveTired); return; }
        if (e.cool > 0) { pop(TX.diveWait); return; }
        const foe = O().pickFoe(e);
        if (!foe) { pop("Nie ma na kogo nurkować"); return; }
        lot.phase = "dive"; lot.t = 0; lot.foe = foe;
        e.diving = true;
    }
    function updateDive() {
        const e = O().eagle, foe = lot.foe, p = $gamePlayer;
        lot.t++;
        if (!e || !foe || !O().foeOk(foe)) { e && (e.diving = false); lot.phase = "rise"; lot.t = 0; return; }
        const fx = foe._realX, fy = foe._realY, dx = fx - p._realX, dy = fy - p._realY, d = Math.hypot(dx, dy);
        const step = Math.min(d, 11 / TILE);
        if (d > 0.01) { p._realX += dx / d * step; p._realY += dy / d * step; lot.angle = Math.atan2(dy, dx); }
        lot.z = Math.max(8, lot.z - 6);
        if ((d < 0.6 && lot.z <= 12) || lot.t > 50) {
            e.diving = false;
            e.cool = 0;
            O().diveHit && O().diveHit(e, foe);
            e.anim = null; e.state = "fly"; e.z = lot.z;
            lot.phase = "rise"; lot.t = 0;
        }
    }
    function updateRise() {
        lot.t++;
        lot.z += (FLY.lowZ - lot.z) * 0.1;
        if (lot.t > 30) { lot.phase = "fly"; lot.z = FLY.lowZ; }
    }
    // where it would come down: a square of open ground under it (the towns: their squares) - { x, y } | { why }
    function landingSpot() {
        const p = $gamePlayer, mapId = $gameMap.mapId(), cx = p._realX + 0.5, cy = p._realY + 0.9;
        if (D.NO_LAND.includes(mapId)) return { why: TX.landWhyMap };
        const Sv = T.api("Survival");
        if (Sv && Sv.isOutdoors && !Sv.isOutdoors()) return { why: TX.landWhyMap };
        const sq = D.TOWN_SQUARES[mapId];
        const town = !!sq || /<Farm:off>/.test(String(($dataMap && $dataMap.note) || "")) && mapId === 8;
        if (town) {
            const inSq = (sq || []).some(r => cx >= r[0] && cx <= r[2] + 1 && cy >= r[1] && cy <= r[3] + 1) || $gameMap.regionId(Math.floor(cx), Math.floor(cy)) === D.LAND_REGION;
            if (!inSq) return { why: TX.landWhyTown };
            const spot = O().openSquare(cx, cy, Math.min(FLY.landSquareTown, landSize()), 3);
            return spot || { why: TX.landWhyTrees };
        }
        const Fm = T.api("Farming");
        if (Fm && Fm.plotAt) { const pl = Fm.plotAt(Math.floor(cx), Math.floor(cy)); if (pl && pl.crop) return { why: TX.landWhyCrops }; }
        if (Fm && Fm.isWaterTile && Fm.isWaterTile(Math.floor(cx), Math.floor(cy))) return { why: TX.landWhyWater };
        const spot = O().openSquare(cx, cy, landSize(), 2);
        return spot || { why: TX.landWhyTrees };
    }
    // the open square it needs: the adult 4 x 4, the fourth stage 3 x 3
    function landSize() { return Math.min(FLY.landSquare, Math.max(1, Math.ceil((O().stageDef().land || FLY.landSquare)))); }
    function tryLand(force) {
        if (!flying() || (lot.phase !== "fly" && !force)) return false;
        let spot = landingSpot();
        if (spot.why && force) {
            const p = $gamePlayer;
            spot = O().openSquare(p._realX + 0.5, p._realY + 0.9, 2, 14) || O().openSquare(p._realX + 0.5, p._realY + 0.9, 1, 20) || { x: p._realX + 0.5, y: p._realY + 0.9 };
        }
        if (spot.why) { T.popup.need(D.ICON.orzel, spot.why); return false; }
        lot.phase = "land"; lot.t = 0;
        lot.spot = spot;
        lot.sFrom = T.view.scale(); lot.sTo = 1;
        lot.zFrom = lot.z;
        lot.pFrom = { x: $gamePlayer._realX, y: $gamePlayer._realY };
        T.audio.se("Wind7", { volume: 55, pitch: 70 });
        return true;
    }
    function forceLand(why) {
        if (!flying()) return;
        if (why === "storm") pop(TX.stormLand, { color: "#ffd0a0" });
        else if (why === "tired") pop(TX.forced, { color: "#ffd0a0" });
        tryLand(true);
    }
    function updateLand() {
        const p = $gamePlayer, e = O().eagle, sp = lot.spot;
        lot.t++;
        const k = ease(lot.t / FLY.zoomFrames);
        applyScale(lot.sFrom + (lot.sTo - lot.sFrom) * k);
        lot.z = lot.zFrom * (1 - k);
        p._realX = lot.pFrom.x + (sp.x - 0.5 - lot.pFrom.x) * k;
        p._realY = lot.pFrom.y + (sp.y - 0.9 - lot.pFrom.y) * k;
        p._x = Math.round(p._realX); p._y = Math.round(p._realY);
        if (lot.t >= FLY.zoomFrames) dismount(sp);
    }
    function dismount(sp) {
        const p = $gamePlayer, s = S(), Or = O(), e = Or.eagle;
        applyScale(1);
        if (e) { e.ridden = false; e.state = "stand"; e.z = 0; e.x = sp.x; e.y = sp.y; e.diving = false; dropRider(e); }
        // the hero beside it (left, else right, else below)
        const tiles = (Or.stageDef().tiles || 4) / 2 + 0.6;
        const tries = [[-tiles, 0], [tiles, 0], [0, 1.2], [-tiles, 1], [tiles, 1]];
        let put = null;
        for (const [dx, dy] of tries) { const x = Math.round(sp.x + dx - 0.5), y = Math.round(sp.y + dy - 0.9); if (Or.freeTile(x, y)) { put = { x, y }; break; } }
        if (!put) put = { x: Math.round(sp.x - 0.5), y: Math.round(sp.y + 0.1) };
        p.locate(put.x, put.y);
        p.setTransparent(false);
        p.setThrough(false);
        if (p.followers) p.followers().show();
        p.refresh();
        s.mode = "follow";
        s.map = $gameMap.mapId();
        s.lands = s.lands || {};
        s.lands[$gameMap.mapId()] = { x: sp.x, y: sp.y, name: $gameMap.displayName() || ("Mapa " + $gameMap.mapId()) };
        lot = null;
        fog.alpha = 0;
        T.emit("orzelLand", { map: $gameMap.mapId() });
        if (Or.afterLand) Or.afterLand();   // (hurt on the way down: off to its nest)
        const sc = SceneManager._scene;
        if (sc && sc.requestAutosave) sc.requestAutosave();
    }
    function flightMenu() {
        const sc = SceneManager._scene, s = S();
        if (!sc || !sc.openFarmMenu) return;
        const spot = landingSpot(), entries = [];
        entries.push({ name: "Ląduj tutaj", icon: D.ICON.orzel, enabled: !spot.why, right: spot.why || "", help: "Orzeł siada na otwartej ziemi (4 × 4 pola, w miastach na placu).", run: () => tryLand() });
        entries.push({ name: lot.level === "high" ? "Zniż lot" : "Wznieś się", icon: D.ICON.orzel, help: "Wysoko lecisz szybciej i widzisz więcej. Nisko orzeł nurkuje i ląduje (to samo: Q).", run: () => setLevel(lot.level === "high" ? "low" : "high") });
        const lands = s.lands || {};
        for (const id of Object.keys(lands)) {
            if (Number(id) === $gameMap.mapId()) continue;
            const L = lands[id];
            entries.push({ name: TX.farTitle + ": " + L.name, icon: 190, enabled: s.st >= FLY.far.cost && !stormNow(), right: FLY.far.cost + "% sił",
                help: fill(TX.farHelp, { c: FLY.far.cost }), run: () => farFly(Number(id), L) });
        }
        if (entries.length === 2) entries.push({ name: TX.farTitle, icon: 190, enabled: false, help: TX.farNone });
        sc.openFarmMenu(fill(TX.panelTitle, V()), entries, undefined, undefined, undefined, undefined, Math.round(s.st) + " / " + O().maxSt() + " sił skrzydeł");
    }
    function farFly(mapId, L) {
        const s = S();
        if (!flying() || s.st < FLY.far.cost) return;
        s.st -= FLY.far.cost;
        lot.phase = "edge"; lot.t = 0;
        lot.edge = { map: mapId, x: L.x - 0.5, y: L.y - 0.9, side: "far" };
        if (lot.level !== "high") { lot.level = "high"; lot.z = FLY.highZ; applyScale(FLY.high); }
    }

    // ------------------------------------------------------------------
    // The frame: the phases, the keys, the eagle and its rider, the panel, the clouds, the fog
    // ------------------------------------------------------------------
    function update(scene) {
        if (!flying()) { if (T.view.scale() !== 1 && !lot) applyScale(1); return; }
        const s = S(), e = ensureEagle(), p = $gamePlayer;
        guardHits();
        if (lot.phase === "takeoff") {
            lot.t++;
            const k = ease(lot.t / FLY.zoomFrames);
            applyScale(1 + (lot.sTo - 1) * k);
            const topZ = lot.level === "high" ? FLY.highZ : FLY.lowZ;
            lot.z = topZ * k;
            if (lot.t >= FLY.zoomFrames) { lot.phase = "fly"; lot.z = topZ; }
        } else if (lot.phase === "climb") {
            lot.t++;
            const k = ease(lot.t / FLY.zoomFrames);
            applyScale(lot.sFrom + (lot.sTo - lot.sFrom) * k);
            lot.z = lot.zFrom + (lot.zTo - lot.zFrom) * k;
            if (lot.t >= FLY.zoomFrames) lot.phase = "fly";
        } else if (lot.phase === "edge") updateEdge();
        else if (lot.phase === "fogout") { lot.t++; fog.alpha = 1 - ease(lot.t / 24); if (lot.t >= 24) { lot.phase = "fly"; fog.alpha = 0; } }
        else if (lot.phase === "land") updateLand();
        else if (lot.phase === "dive") updateDive();
        else if (lot.phase === "rise") updateRise();
        if (!flying()) return;
        if (lot.phase === "fly" && airCalm()) flyStep();
        // the keys (the map scene, nothing else open)
        if (lot.phase === "fly" && T.isCalm(scene, { only: ["onMap", "event", "farmMenu"] })) {
            if (Input.isTriggered("pageup")) setLevel(lot.level === "high" ? "low" : "high");
            else if (Input.isTriggered("dodge")) dive();
        }
        // tired, a storm, flown off: down
        if (lot.phase === "fly") {
            if (s.st <= 0) forceLand("tired");
            else if (stormNow()) forceLand("storm");
            else if (s.st < O().maxSt() * FLY.warnAt && Graphics.frameCount - (lot.warned || 0) > 600) { lot.warned = Graphics.frameCount; pop(TX.tiredAir, { color: "#ffd0a0" }); }
        }
        // the eagle under him
        e.x = p._realX + 0.5; e.y = p._realY + 0.9; e.z = lot.z; e.angle = lot.angle;
        e.flapT += lot.flapping || lot.phase !== "fly" ? 1 : 0;
        if (!lot.flapping && lot.phase === "fly") e.glideNow = true; else e.glideNow = false;
        p.center(p._realX, p._realY);
        ensureRider(e);
        updatePanel(scene);
    }
    T.onMapUpdate(update, { owner: PLUGIN, name: "flight", priority: 5 });
    T.on("mapReady", () => { if (flying() && lot.arrive) arrive(); }, { owner: PLUGIN });
    // (a transfer while flying: MapZoom resets the zoom on Game_Map.setup - the view's scale stays; the spriteset puts it back each frame)
    T.on("load", () => { lot = null; T.view.setScale(1); filterMode = 0; }, { owner: PLUGIN });
    T.on("newGame", () => { lot = null; T.view.setScale(1); }, { owner: PLUGIN });

    // ---- the rider: the hero from behind (his walking sheet's north row, the top of it) on the eagle's back, turning with it
    let riderBmp = null;
    function ensureRider(e) {
        if (!e.air) return;
        if (!e.rider || e.rider.parent !== e.air) {
            if (!riderBmp) riderBmp = ImageManager.loadCharacter("Hero_Walk");
            e.rider = new Sprite(riderBmp);
            e.rider.anchor.set(0.5, 1);
            e.air.addChild(e.rider);
        }
        const a = D.AIR[S().stage] || D.AIR[5], cell = a.cell, sad = a.saddle || [cell / 2, cell / 2];
        e.rider.setFrame(16, 4 * 64 + 2, 32, 36);
        e.rider.scale.set(1 / (a.scale || 1));   // (a smaller bird drawn smaller: the hero keeps his size)
        e.rider.x = sad[0] - cell / 2;
        e.rider.y = sad[1] - cell / 2 + 22 + Math.sin(Graphics.frameCount / 18) * 0.6;
        e.rider.visible = true;
    }
    function dropRider(e) { if (e && e.rider && e.rider.parent) e.rider.parent.removeChild(e.rider); if (e) e.rider = null; }

    // ---- the fog between two maps (over everything on the map scene), the panel, the landing ring, the clouds, the sea of fog past the edges
    const fog = { alpha: 0, sprite: null };
    let panel = null, lotRing = null;
    const _createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _createSpriteset.call(this);
        const f = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        f.bitmap.fillAll("#f2f4f6");
        f.alpha = fog.alpha;
        fog.sprite = f;
        this.addChild(f);
        panel = new Sprite(new Bitmap(640, 70));
        panel.x = Math.round((Graphics.width - 640) / 2);
        panel.y = Graphics.height - 82;
        panel.visible = false;
        panel._key = "";
        this.addChild(panel);
        if (flying()) setFilter(T.view.scale() < 1);
    };
    function updatePanel(scene) {
        if (fog.sprite) fog.sprite.alpha = fog.alpha;
        if (!panel) return;
        panel.visible = flying() && lot.phase !== "land";
        if (!panel.visible) return;
        const s = S(), spot = lot.phase === "fly" ? landingSpot() : null;
        const key = [Math.round(s.st), lot.level, spot && spot.why || "ok", O().nameOf()].join("|");
        if (panel._key === key) return;
        panel._key = key;
        const bm = panel.bitmap, ctx = bm.context, U = window.UIStyle;
        bm.clear();
        if (U && U.panel) U.panel(ctx, 0.5, 0.5, 639, 69); else bm.fillRect(0, 0, 640, 70, "rgba(11,12,15,0.86)");
        bm._baseTexture.update();
        const accent = (U && U.accent) || "#ffd23f";
        bm.fontSize = 22; bm.textColor = accent;
        bm.drawText(fill(TX.panelTitle, V()), 14, 4, 220, 28, "left");
        bm.fontSize = 16; bm.textColor = "#e8e2d2";
        bm.drawText(TX.panelStrength, 200, 6, 110, 24, "left");
        const r = clamp(s.st / O().maxSt(), 0, 1);
        bm.fillRect(300, 13, 160, 10, "#16181c");
        bm.fillRect(301, 14, Math.round(158 * r), 8, r < FLY.warnAt ? "#ff8a6a" : "#eef2fa");
        bm.drawText(Math.round(100 * r) + "%   " + (lot.level === "high" ? TX.high : TX.low), 470, 6, 160, 24, "left");
        bm.fontSize = 15;
        bm.textColor = spot && !spot.why ? "#9ff0a8" : "#c8c0b0";
        const landLine = lot.level === "high" ? "" : spot && !spot.why ? TX.landOk + "   " : spot ? TX.landNo + ": " + spot.why + "   " : "";
        bm.drawText(landLine + "WASD: lot  Shift: szybciej  Q: wyżej/niżej  Spacja: nurkuj  L: ląduj  Enter: menu", 14, 38, 612, 24, "left");
    }
    let clouds = [], fogBands = [];
    let solidBmp = null;
    function solidBitmap() {
        if (solidBmp) return solidBmp;
        solidBmp = new Bitmap(4, 4);
        solidBmp.fillAll("rgba(236,240,244,0.96)");
        return solidBmp;
    }
    function cloudBitmap(seed) {
        const w = 360, h = 200, b = new Bitmap(w, h), c = b.context;
        let r = seed * 9301 + 49297;
        const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
        for (let i = 0; i < 10; i++) {
            const rw = w * (0.12 + rnd() * 0.1), rh = h * (0.16 + rnd() * 0.12), x = w * (0.3 + rnd() * 0.4), y = h * (0.32 + rnd() * 0.36);
            const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rw, rh));
            g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.6, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
            c.fillStyle = g;
            c.beginPath(); c.ellipse(x, y, rw * 1.6, rh * 1.6, 0, 0, Math.PI * 2); c.fill();
        }
        b._baseTexture.update();
        return b;
    }
    function bandBitmap(vertical) {
        const w = vertical ? 64 : 4, h = vertical ? 4 : 64, b = new Bitmap(w, h), c = b.context;
        const g = vertical ? c.createLinearGradient(0, 0, w, 0) : c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(236,240,244,0.96)"); g.addColorStop(1, "rgba(236,240,244,0)");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        b._baseTexture.update();
        return b;
    }
    function updateWorldFx(set) {
        const tm = set._tilemap;
        if (!tm) return;
        const s = T.view.scale(), far = clamp((1 - s) / (1 - FLY.high), 0, 1), tw = TILE, th = TILE;
        // the landing ring under the eagle (low, flying): green - it may land, red - not
        if (!lotRing || lotRing.parent !== tm) {
            lotRing = new Sprite(new Bitmap(4 * tw + 16, 2 * th + 16));
            lotRing.anchor.set(0.5, 0.5);
            lotRing.z = 1.5;
            tm.addChild(lotRing);
            lotRing._ok = null;
        }
        const show = lot.phase === "fly" && lot.level === "low";
        lotRing.visible = show;
        if (show) {
            const spot = landingSpot(), ok = !spot.why;
            if (lotRing._ok !== ok) {
                lotRing._ok = ok;
                const b = lotRing.bitmap, c = b.context;
                b.clear();
                c.lineWidth = 3; c.strokeStyle = ok ? "rgba(140,235,140,0.85)" : "rgba(235,120,110,0.75)";
                c.beginPath(); c.ellipse(b.width / 2, b.height / 2, b.width / 2 - 6, b.height / 2 - 6, 0, 0, Math.PI * 2); c.stroke();
                b._baseTexture.update();
            }
            const p = $gamePlayer;
            lotRing.x = Math.round($gameMap.adjustX(p._realX + 0.5) * tw);
            lotRing.y = Math.round($gameMap.adjustY(p._realY + 0.6) * th);
        }
        // the clouds over the clouds' shadows (CloudShadows: _wx, _wy, _radius in the world's px), seen far out
        const shadows = (set._cloudSprites || []).slice(0, FLY.clouds);
        while (clouds.length < shadows.length) clouds.push(null);
        shadows.forEach((cs, i) => {
            let c = clouds[i];
            if (!c || c.parent !== tm) { c = clouds[i] = new Sprite(cloudBitmap(i + 3)); c.anchor.set(0.5, 0.5); c.z = 8.6; tm.addChild(c); }
            const sun = T.call("Sun", "now"), off = 140 * far;
            c.x = cs.x - (sun ? sun.dx : 0) * off;
            c.y = cs.y - (sun ? sun.dy : 1) * off * 0.5 - 60 * far;
            const k = (cs._radius || 160) / 120;
            c.scale.set(k, k * 0.8);
            c.alpha = 0.62 * far * (1 - 0.4 * (window.Storm ? Storm.level() : 0));
            c.visible = far > 0.02;
        });
        // the sea of fog past the map's edges (a map smaller than the view: no black - clouds): on each side a solid part from far out up
        // to a tile outside the edge, then a soft band from there 3 tiles into the map
        if (fogBands.length !== 8 || fogBands.some(b => b.parent !== tm)) {
            for (const b of fogBands) if (b.parent) b.parent.removeChild(b);
            fogBands = [];
            for (let i = 0; i < 4; i++) fogBands.push(new Sprite(solidBitmap()));
            fogBands.push(new Sprite(bandBitmap(false)), new Sprite(bandBitmap(false)), new Sprite(bandBitmap(true)), new Sprite(bandBitmap(true)));
            for (const b of fogBands) { b.z = 8.8; tm.addChild(b); }
        }
        const W = $gameMap.width() * tw, H = $gameMap.height() * th, ox = -$gameMap.displayX() * tw, oy = -$gameMap.displayY() * th;
        const band = 4 * tw, big = 4000;
        const [sT, sB, sL, sR, bT, bB, bL, bR] = fogBands;
        // the solid parts (4 x 4 px bitmap stretched): above, below (full width), left, right (between them)
        sT.x = ox - big; sT.y = oy - tw - big; sT.scale.set((W + 2 * big) / 4, big / 4);
        sB.x = ox - big; sB.y = oy + H + tw; sB.scale.set((W + 2 * big) / 4, big / 4);
        sL.x = ox - tw - big; sL.y = oy - tw; sL.scale.set(big / 4, (H + 2 * tw) / 4);
        sR.x = ox + W + tw; sR.y = oy - tw; sR.scale.set(big / 4, (H + 2 * tw) / 4);
        // the soft bands (the gradient: opaque at its start, clear at its end): from a tile outside the edge, `band` long, inwards
        bT.x = ox - tw; bT.y = oy - tw; bT.scale.set((W + 2 * tw) / 4, band / 64);
        bB.x = ox - tw; bB.y = oy + H + tw; bB.scale.set((W + 2 * tw) / 4, -band / 64);
        bL.x = ox - tw; bL.y = oy - tw; bL.scale.set(band / 64, (H + 2 * tw) / 4);
        bR.x = ox + W + tw; bR.y = oy - tw; bR.scale.set(-band / 64, (H + 2 * tw) / 4);
        for (const b of fogBands) { b.alpha = far; b.visible = far > 0.02; }
    }

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    window.OrzelLot = T.register(PLUGIN, {
        flying, why, mount, tryLand, forceLand, setLevel, dive, landingSpot, exits, applyScale, flightMenu, farFly,
        get lot() { return lot; }, state: () => lot, update
    });
})();
