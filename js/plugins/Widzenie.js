//=============================================================================
// Widzenie.js
//=============================================================================
// (2026-11-19, the user: "czy da się zrobić, że jak postać wchodzi w tryb skradania, to widzi jakby zasięg widzenia innych postaci i
// wie, kiedy zostanie zauważona?") ONE rule of how people see the hero, and its picture while he sneaks (C):
//   - WHO: every person on the map - an event with a character picture that is no object ("!...") and no animal: the town's residents,
//     the travellers, the soldiers, the manor's guard. (The bandits - Humans.js - keep their own meter: their reach is drawn as a ring.)
//   - HOW: a cone in front of him (+-60 degrees) - FRONT tiles (sneaking: FRONT_SNEAK), shorter in the dark; right beside him (NEAR) from
//     any side; a hero who does not sneak is heard from HEAR tiles round. Walls, roofs, buildings and standing trees hide him (a grid of
//     what blocks the sight, made once a map and again every couple of seconds).
//   - THE METER: in someone's sight his meter fills (faster close by); out of it, it empties. "?" over the person from 0.3, "!" from 0.7
//     (Hunting.updateMark - the animals' marks); full = spotted (Widzenie.spotted(), the bus "widzenieSpotted").
//   - SNEAKING (Hunting.sneaking): the cones of the people near on the ground (yellow; red while that one is noticing him), the marks.
// The other systems ask here: Widzenie.sees(ev, x, y, o) - this one sees that cell now; Widzenie.seenBy(x, y) - who does.
// Performance: the cone's rays are worked out only when its owner moves or turns (a cache by the position); the drawing is redone
// only when a cone or its colour changes; outside the sneaking nothing is drawn and only the meters near the hero are counted.

/*:
 * @target MZ
 * @plugindesc Widzenie ludzi: jedna zasada (stożek przed sobą, blisko z każdej strony, słuch gdy się nie skradasz, ściany zasłaniają), pasek zauważenia ?/!, a w skradaniu (C) stożki wzroku na ziemi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Hunting
 * @orderAfter Humans
 *
 * @help
 * ============================================================================
 * Widzenie.js - kto widzi bohatera
 * ============================================================================
 * Ludzie widzą stożkiem przed sobą, tuż obok - z każdej strony, a gdy się nie
 * skradasz - słyszą cię z kilku kratek. Ściany, budynki i drzewa zasłaniają.
 * W czyimś wzroku rośnie jego pasek: „?”, potem „!”, pełny = zauważony.
 * W skradaniu (C) widać na ziemi stożki wzroku ludzi obok (żółte; czerwone,
 * gdy ktoś cię właśnie zauważa) i kręgi, z których usłyszą cię bandyci.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Widzenie";
    const T = window.Tawerna;
    if (!T) throw new Error("Widzenie.js: brak TawernaCore.js (the Tawerna core is missing)");

    // the numbers (tiles)
    const CFG = {
        front: 6, frontSneak: 3.5,    // the cone's reach: walking / sneaking
        half: 60,                     // the cone's half angle (degrees)
        near: 1.6,                    // felt from any side
        hear: 4,                      // heard from any side while he does not sneak (and moves)
        night: 0.7,                   // the dark shortens the cone (not with a lit torch in his hand)
        reach: 12,                    // people further off are not counted at all
        rays: 15                      // the cone's rays (drawing)
    };
    const TILE = 48;
    const sneaking = () => !!T.call("Hunting", "sneaking");
    const hour = () => T.time.hour();
    const dark = () => { const h = hour(); return h < 6 || h >= 20; };
    const torchLit = () => !!T.call("Torch", "isLit");
    const hero = () => ({ x: $gamePlayer._realX + 0.5, y: $gamePlayer._realY + 0.5 });

    // ---- who is a person
    const objectNames = new Map();
    const isObjectName = n => { let v = objectNames.get(n); if (v === undefined) objectNames.set(n, (v = !!ImageManager.isObjectCharacter(n))); return v; };
    function isPerson(ev) {
        if (!ev || !(ev instanceof Game_Event) || ev._erased || ev._transparent || ev._opacity === 0) return false;
        if (ev._town && ev._town.hidden) return false;
        if (ev._garn && ev._garn.hidden) return false;
        const n = ev.characterName();
        if (!n || ev.tileId() > 0 || isObjectName(n) || /Animal|Ptak|Bird|Kot|Cat|Dog|Pies/i.test(n)) return false;
        return true;
    }
    function watchers() {
        const h = hero(), out = [];
        for (const ev of $gameMap.events()) {
            if (Math.abs(ev._realX + 0.5 - h.x) > CFG.reach || Math.abs(ev._realY + 0.5 - h.y) > CFG.reach) continue;
            if (isPerson(ev)) out.push(ev);
        }
        return out;
    }

    // ---- what hides: walls, roofs, buildings, standing trees (a grid, made again every 2 s and on a change of map)
    let grid = null, gridMap = 0, gridAt = -1e9;
    function buildGrid() {
        const W = $gameMap.width(), H = $gameMap.height(), g = new Uint8Array(W * H), F = T.api("Farming"), CT = T.api("ChoppableTree");
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            for (let z = 0; z < 4; z++) {
                const id = $gameMap.tileId(x, y, z);
                if (id > 0 && (Tilemap.isWallTopTile(id) || Tilemap.isWallSideTile(id) || Tilemap.isRoofTile(id))) { g[y * W + x] = 1; break; }
            }
        }
        if (F && F.farm) {
            for (const b of (F.farm().buildings || {})[$gameMap.mapId()] || []) {
                if (b.site || b.type === "fence") continue;
                const geo = F.geoOf(b);
                if (!geo || geo.yard) continue;
                for (let j = 0; j < (geo.h || 1); j++) for (let i = 0; i < geo.w; i++) { const x = b.x + i, y = b.y - j; if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = 1; }
            }
        }
        if (CT && CT.isTree) for (const e of $gameMap.events()) {
            if (!CT.isTree(e) || e.tileId() > 0 || !e.characterName() || (CT.isLow && CT.isLow(e))) continue;
            if (e.x >= 0 && e.y >= 0 && e.x < W && e.y < H) g[e.y * W + e.x] = 1;
        }
        grid = g; gridMap = $gameMap.mapId(); gridAt = Graphics.frameCount;
    }
    function blocked(x, y) {
        if (!grid || gridMap !== $gameMap.mapId() || Graphics.frameCount - gridAt > 120) buildGrid();
        const W = $gameMap.width();
        if (x < 0 || y < 0 || x >= W || y >= $gameMap.height()) return true;
        return grid[y * W + x] === 1;
    }
    // nothing hides the line between the two points (tile centres in tiles); the watcher's own tile and the target's are not counted
    function clearLine(ax, ay, bx, by) {
        const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 0.35);
        const sx = Math.floor(ax), sy = Math.floor(ay), tx = Math.floor(bx), ty = Math.floor(by);
        for (let i = 1; i < n; i++) {
            const x = Math.floor(ax + (bx - ax) * i / n), y = Math.floor(ay + (by - ay) * i / n);
            if ((x === sx && y === sy) || (x === tx && y === ty)) continue;
            if (blocked(x, y)) return false;
        }
        return true;
    }

    // ---- the rule
    const FACE = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    function reachOf(o) {
        const sneak = o && o.sneak !== undefined ? o.sneak : sneaking();
        let front = sneak ? CFG.frontSneak : CFG.front;
        if (dark() && !torchLit()) front *= CFG.night;
        return { front: front + ((o && o.bonus) || 0), near: CFG.near, hear: sneak ? 0 : CFG.hear, sneak };
    }
    // does this person see the point (x, y in tiles, the centre: x + 0.5) now? o: { sneak, bonus (a sharper watch: tiles more) }
    function seesPoint(ev, px, py, o) {
        const ex = ev._realX + 0.5, ey = ev._realY + 0.5, dx = px - ex, dy = py - ey, d = Math.hypot(dx, dy), r = reachOf(o);
        if (d < r.near) return true;
        const f = FACE[ev.direction()] || FACE[2];
        const ahead = (dx * f[0] + dy * f[1]) / Math.max(0.01, d);
        const inCone = ahead >= Math.cos(CFG.half * Math.PI / 180) && d <= r.front;
        const heard = r.hear > 0 && d <= r.hear;
        if (!inCone && !heard) return false;
        return clearLine(ex, ey, px, py) || (heard && d <= r.hear * 0.6);   // (heard close by through a thin wall)
    }
    const sees = (ev, x, y, o) => seesPoint(ev, x + 0.5, y + 0.5, o);
    const seesHero = (ev, o) => { const h = hero(); return seesPoint(ev, h.x, h.y, o); };
    const seenBy = (x, y, o) => watchers().filter(ev => sees(ev, x, y, o));

    // ---- the meters (on the events: ev._wid = { aware })
    let illicit = 0;   // (frames left of "something forbidden is being done" - the meters run even without sneaking)
    const meter = ev => ev._wid || (ev._wid = { aware: 0, spotted: false });
    function updateMeters() {
        const sneak = sneaking(), active = sneak || illicit > 0, h = hero();
        if (illicit > 0) illicit--;
        for (const ev of $gameMap.events()) {
            const m = ev._wid;
            if (!active) { if (m && m.aware > 0) m.aware = Math.max(0, m.aware - 0.02); continue; }
            if (!isPerson(ev) || Math.abs(ev._realX + 0.5 - h.x) > CFG.reach || Math.abs(ev._realY + 0.5 - h.y) > CFG.reach) { if (m) m.aware = Math.max(0, m.aware - 0.02); continue; }
            const w = meter(ev), r = reachOf({ sneak }), d = Math.hypot(ev._realX + 0.5 - h.x, ev._realY + 0.5 - h.y);
            if (seesPoint(ev, h.x, h.y, { sneak })) {
                const range = Math.max(r.front, r.near, r.hear), k = Math.max(0, 1 - d / range);
                w.aware = Math.min(1, w.aware + 0.02 + 0.06 * k);
            } else w.aware = Math.max(0, w.aware - 0.012);
            if (w.aware >= 1 && !w.spotted) { w.spotted = true; T.emit("widzenieSpotted", { ev, mapId: $gameMap.mapId(), id: ev.eventId() }); }
            if (w.aware < 0.5) w.spotted = false;
        }
    }
    const spotted = () => watchers().filter(ev => ev._wid && ev._wid.aware >= 1);

    // ---- the picture: the cones on the ground and the marks (only while sneaking)
    function coneOf(ev, r) {
        const key = ev._realX + "," + ev._realY + "," + ev.direction() + "," + r.front.toFixed(2) + "," + (grid ? gridAt : 0);
        if (ev._widCone && ev._widCone.key === key) return ev._widCone.pts;
        const ex = ev._realX + 0.5, ey = ev._realY + 0.5, f = FACE[ev.direction()] || FACE[2], base = Math.atan2(f[1], f[0]), half = CFG.half * Math.PI / 180;
        const pts = [ex, ey];
        for (let i = 0; i <= CFG.rays; i++) {
            const a = base - half + (2 * half) * i / CFG.rays, cx = Math.cos(a), cy = Math.sin(a);
            let t = 0;
            for (; t < r.front; t += 0.25) {
                const x = Math.floor(ex + cx * (t + 0.25)), y = Math.floor(ey + cy * (t + 0.25));
                if (!(x === Math.floor(ex) && y === Math.floor(ey)) && blocked(x, y)) break;
            }
            pts.push(ex + cx * Math.min(t, r.front), ey + cy * Math.min(t, r.front));
        }
        ev._widCone = { key, pts };
        return pts;
    }
    // a bandit's reach as Hunting.noticeRate counts it (asleep he hears less; the dark, standing still and sneaking shorten it)
    function banditRing(h) {
        const k = h._mode === "sleep" ? 0.22 : h._mode === "sit" ? 0.75 : 1, moving = $gamePlayer.isMoving();
        return h.sight() * k * (sneaking() ? 0.45 : 1) * (moving ? 1 : 0.6) * (dark() ? 0.8 : 1);
    }
    function Sprite_Widzenie() { this.initialize(...arguments); }
    Sprite_Widzenie.prototype = Object.create(PIXI.Container.prototype);
    Sprite_Widzenie.prototype.constructor = Sprite_Widzenie;
    Sprite_Widzenie.prototype.initialize = function() {
        PIXI.Container.call(this);
        this.z = 1;   // (on the ground: over the floor tiles, under the characters)
        this._g = new PIXI.Graphics();
        this.addChild(this._g);
        this._sig = "";
    };
    Sprite_Widzenie.prototype.update = function() {
        const on = sneaking() && !$gameMessage.isBusy();
        this.visible = on;
        this.x = -Math.round($gameMap.displayX() * TILE);
        this.y = -Math.round($gameMap.displayY() * TILE);
        if (!on) { if (this._sig) { this._g.clear(); this._sig = ""; } return; }
        if (Graphics.frameCount % 3 !== 0) return;
        const r = reachOf({ sneak: true }), list = watchers(), H = T.api("Humans"), bandits = H && H.humans ? H.humans().filter(h => !h._dead && h._def && !h._surrendered) : [];
        const shapes = list.map(ev => ({ pts: coneOf(ev, r), ex: ev._realX + 0.5, ey: ev._realY + 0.5, hot: ev._wid && ev._wid.aware > 0.05, aw: ev._wid ? ev._wid.aware : 0 }));
        const rings = bandits.map(h => ({ x: h.centerX(), y: h.centerY(), r: banditRing(h), hot: (h._aware || 0) > 0.05 }));
        const sig = shapes.map(s => s.pts.length + ":" + s.pts[0] + "," + s.pts[1] + "," + s.pts[4] + (s.hot ? "h" + Math.round(s.aw * 10) : "")).join("|") + "#" + rings.map(o => o.x.toFixed(1) + o.y.toFixed(1) + o.r.toFixed(1) + o.hot).join("|");
        if (sig === this._sig) return;
        this._sig = sig;
        const g = this._g;
        g.clear();
        for (const s of shapes) {
            const col = s.hot ? 0xff5040 : 0xffd23f, a = s.hot ? 0.16 + 0.14 * s.aw : 0.13;
            g.lineStyle(1, col, 0.45);
            g.beginFill(col, a);
            g.moveTo(s.pts[0] * TILE, s.pts[1] * TILE);
            for (let i = 2; i < s.pts.length; i += 2) g.lineTo(s.pts[i] * TILE, s.pts[i + 1] * TILE);
            g.closePath();
            g.endFill();
            g.lineStyle(0);
            g.beginFill(col, a * 0.8);
            g.drawCircle(s.ex * TILE, s.ey * TILE, CFG.near * TILE);
            g.endFill();
        }
        for (const o of rings) {
            const col = o.hot ? 0xff5040 : 0xffd23f;
            g.lineStyle(2, col, 0.5);
            g.beginFill(col, 0.06);
            g.drawCircle(o.x * TILE, o.y * TILE, o.r * TILE);
            g.endFill();
        }
        g.lineStyle(0);
    };
    // the marks over the people (only while sneaking): Hunting's "?" / "!"
    function updateMarks(set) {
        const Hn = T.api("Hunting");
        if (!Hn || !Hn.updateMark || !set || !set._characterSprites) return;
        const on = sneaking();
        for (const sp of set._characterSprites) {
            const ev = sp._character;
            if (!(ev instanceof Game_Event) || (!ev._wid && !ev._markSprite)) continue;
            const aware = on && ev._wid && isPerson(ev) ? ev._wid.aware : 0;
            Hn.updateMark(ev, sp, -((sp.patternHeight && sp.patternHeight()) || 48) - 4, aware);
        }
    }

    const _createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLowerLayer.call(this);
        this._widzenie = new Sprite_Widzenie();
        this._tilemap.addChild(this._widzenie);
    };
    const _updateSpriteset = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _updateSpriteset.call(this);
        if (this._widzenie) { this._widzenie.update(); updateMarks(this); }
    };
    T.onMapUpdate(() => updateMeters(), { owner: PLUGIN, name: "meters" });
    T.on("mapEnter", () => { grid = null; }, { owner: PLUGIN });

    window.Widzenie = T.register(PLUGIN, {
        CFG, isPerson, watchers, sees, seesHero, seenBy, spotted, reachOf, blocked, clearLine,
        illicit: frames => { illicit = Math.max(illicit, frames === undefined ? 30 : frames); },
        aware: ev => (ev && ev._wid ? ev._wid.aware : 0),
        rebuild: () => { grid = null; }
    });
})();
