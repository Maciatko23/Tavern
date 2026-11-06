// Widok.js - what the hero sees outdoors (user 2026-11-06: "robimy plener mądrze"; after the interiors' line of sight, Pokoje.js).
// Out in the open nothing is a wall, so the eye is stopped by degrees: a building or a fortress wall stops it, a tree lets some through (a few trees deep a forest is dark),
// a bush a little; a cliff face hides the hilltop from below, and from the top you see down. In the day he sees far, at night a few tiles - more with a torch in hand - and the
// places round a fire far off, if the way there is clear. Rain and storms shorten it.
// Fog of war: where he has never looked is fog; what he has seen stays, dimmed, while he is not looking - but people and animals are seen only while he sees them.
// During a scene everyone is seen. What he has seen is kept in the save, map by map, as runs of cells (small).
// The cover: one picture of one pixel a tile, scaled up smoothly over the map (soft by itself), each pixel easing to what it should be.
/*:
 * @target MZ
 * @plugindesc Widok na dworze: drzewa, budynki i skały zasłaniają, w nocy widać blisko (dalej z pochodnią i przy ogniu), mgła tam, gdzie jeszcze nie byłeś. v1.0.0
 * @author Claude
 * @help Działa na mapach pod gołym niebem (<Clouds:on>). <Widok:off> w notatce mapy ją pomija, window.WIDOK = false wyłącza.
 */
(() => {
    "use strict";
    const PLUGIN = "Widok";
    const T = window.Tawerna;
    const INDOOR_SETS = new Set([8, 10, 12]);   // (the interiors and dungeons: Pokoje.js)
    const R_DAY = 19, R_NIGHT = 6.5, R_TORCH = 10.5, FADE = 4;   // tiles of sight; the last FADE of it fades out
    const MEM = 0.34, MEM_NIGHT = 0.2, FOG = 0.7, FOG_NIGHT = 0.22;   // the cover where he has seen before / where never (by day, and what the night adds)
    const COLOUR = [20, 24, 32];                    // the fog's colour
    const RAYS = 420;
    const CLEAR = 0.18, SINK = 0.05;               // a frame: how much of the way a cell goes, clearing / sinking
    const CLEAR2 = 1 - (1 - CLEAR) * (1 - CLEAR), SINK2 = 1 - (1 - SINK) * (1 - SINK);   // (two frames' worth: it is moved every other frame)
    const MOVED = 0.45, REFRESH = 24;               // tiles he moves / frames before the view is worked out again (people and trees change too)
    const LIGHT_REACH = 28, LIGHT_SCALE = 0.55;    // a fire this far off can be seen; what it lights, of its glow's reach
    const SEEN = 0.3;                              // seen this much: now known
    const MARGIN = 4;                              // tiles round the screen the cover keeps up to date
    // how much of the view a thing lets through (1 nothing in the way, 0 all of it stopped)
    const PASS = { roof: 0, wallSide: 0.25, wallHigh: 0.2, hillTop: 0.8, tall: 0.35, canopy: 0.85, bigTree: 0.5, pine: 0.55, tree: 0.65, bush: 0.88, rock: 0.9, thing: 0.8, house: 0.3, low: 0.85 };
    const store = T.state.define("widok", () => ({ maps: {} }), { version: 1, owner: PLUGIN });
    const on = () => window.WIDOK !== false;
    const here = () => !!window.$gameMap && !!window.$dataMap && on() && !INDOOR_SETS.has($gameMap.tilesetId()) && !!T.mapFlag("Clouds", false) && !/<Widok:off>/i.test($dataMap.note || "");

    // ------------------------------------------------------------------
    // The map: what lets the eye through, cell by cell
    // ------------------------------------------------------------------
    const kind = t => Math.floor((t - 2048) / 48);
    const isA3 = t => t >= 4352 && t < 5888, isA4 = t => t >= 5888 && t < 8192;
    const isRoof = t => isA3(t) && kind(t) % 16 < 8, isTop = t => isA4(t) && kind(t) % 16 < 8, isSide = t => (isA3(t) || isA4(t)) && kind(t) % 16 >= 8;
    let memo = null;
    function build() {
        if (memo && memo.data === $dataMap) return memo;
        const W = $gameMap.width(), H = $gameMap.height(), flags = $gameMap.tilesetFlags(), n = W * H;
        // ground: for one standing below, every way; north: only looking north (a cliff's face and a hilltop hide what is up there, looking down from them you see); high: for one on a hilltop
        const ground = new Float32Array(n).fill(1), north = new Float32Array(n).fill(1), high = new Float32Array(n).fill(1), top = new Uint8Array(n), roofs = [];
        const tile = (x, y, z) => $gameMap.tileId(x, y, z);
        const star = (x, y) => { if (y < 0) return false; for (const z of [2, 3]) { const t = tile(x, y, z); if (t > 0 && t < 1024 && (flags[t] & 0x10)) return true; } return false; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const c = y * W + x, ts = [tile(x, y, 0), tile(x, y, 1), tile(x, y, 2), tile(x, y, 3)], walk = $gameMap.checkPassage(x, y, 0x0f);
            let g = 1, h = 1, nn = 1;
            if (ts.some(isRoof)) { g = h = PASS.roof; roofs.push(c); }
            else if (ts.some(isSide)) nn = PASS.wallSide;
            else if (ts.some(isTop)) { if (walk) { top[c] = 1; nn = PASS.hillTop; } else g = h = PASS.wallHigh; }
            else {
                const solid = ts.some(t => t > 0 && t < 1024 && !(flags[t] & 0x10) && (flags[t] & 0x0f) === 0x0f);
                if (solid && (star(x, y) || star(x, y - 1) || star(x, y - 2))) g = h = PASS.tall;
                else if (walk && star(x, y)) g = h = PASS.canopy;
            }
            ground[c] = g; high[c] = h; north[c] = nn;
        }
        memo = { data: $dataMap, W, H, ground, north, high, top, roofs: Int32Array.from(roofs), things: new Float32Array(n).fill(1), thingsAt: -1 };
        return memo;
    }
    const occupyOf = ev => {
        if (ev._widokOcc !== undefined) return ev._widokOcc;
        const d = ev.event(), m = d && /<Occupy:([^>]*)>/i.exec(d.note || ""), o = { left: 0, right: 0, up: 0, down: 0 };
        if (m) for (const part of m[1].split(",")) { const [k, v] = part.split("=").map(s => s.trim()); if (k in o) o[k] = Number(v) || 0; }
        return (ev._widokOcc = m ? o : null);
    };
    function passOfPicture(name) {
        if (!name || name[0] !== "!") return 1;   // (people and animals do not hide what is behind them)
        if (/Big_Trees/i.test(name)) return PASS.bigTree;
        if (/Pine/i.test(name)) return PASS.pine;
        if (/Tree/i.test(name)) return PASS.tree;
        if (/Bush/i.test(name)) return PASS.bush;
        if (/Rock|Stone/i.test(name)) return PASS.rock;
        return name[1] === "$" ? PASS.thing : 1;
    }
    // the trees, rocks and big things standing as events, and the buildings he put up (they are cut down, put up, taken away: again now and then)
    function things(m) {
        const t = m.things, W = m.W, H = m.H;
        t.fill(1);
        const put = (x, y, p) => { if (x >= 0 && y >= 0 && x < W && y < H) { const c = y * W + x; if (p < t[c]) t[c] = p; } };
        for (const ev of $gameMap.events()) {
            if (ev._erased || ev.isTransparent() || ev.isThrough() || !ev.isNormalPriority()) continue;
            const p = passOfPicture(ev.characterName());
            if (p >= 1) continue;
            put(ev.x, ev.y, p);
            const o = occupyOf(ev);
            if (o) for (let dy = -o.up; dy <= o.down; dy++) for (let dx = -o.left; dx <= o.right; dx++) put(ev.x + dx, ev.y + dy, p);
        }
        const F = window.Farming;
        if (F && F.buildingsOf && F.geoOf && F.cellsOfGeo) {
            for (const b of F.buildingsOf($gameMap.mapId())) {
                if (b.site) continue;
                const g = F.geoOf(b), p = (g.h || 1) >= 2 ? PASS.house : PASS.low;
                for (const c of F.cellsOfGeo(g, b.x, b.y)) put(c.x, c.y, p);
            }
        }
    }

    // ------------------------------------------------------------------
    // What he knows of each map (saved as runs: "count,count,..." starting with unknown)
    // ------------------------------------------------------------------
    const known = new Map();
    function knownOf(mapId, n) {
        let k = known.get(mapId);
        if (k && k.length === n) return k;
        k = new Uint8Array(n);
        const s = store().maps[mapId];
        if (typeof s === "string" && s) {
            let i = 0, v = 0;
            for (const part of s.split(",")) { const len = parseInt(part, 36) || 0; if (v) k.fill(1, i, Math.min(n, i + len)); i += len; v ^= 1; }
        }
        known.set(mapId, k);
        return k;
    }
    function keep(mapId) {
        const k = known.get(mapId);
        if (!k) return;
        const out = [];
        let v = 0, run = 0;
        for (let i = 0; i < k.length; i++) { if (k[i] !== v) { out.push(run.toString(36)); run = 0; v ^= 1; } run++; }
        out.push(run.toString(36));
        store().maps[mapId] = out.join(",");
    }
    const _onBeforeSave = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        const v = view();
        if (v && v.dirty) { keep(v.mapId); v.dirty = false; }
        _onBeforeSave.call(this);
    };
    const _onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() { known.clear(); _onAfterLoad.call(this); };

    // ------------------------------------------------------------------
    // Seeing: rays out from a place, each carrying how much still gets through
    // ------------------------------------------------------------------
    const nightNow = () => { const S = T.api("Sun"); return S && S.sky && $gameSystem.dayNightHour ? S.sky($gameSystem.dayNightHour()).dark : 0; };
    function reachNow(dark) {
        let r = R_DAY + (R_NIGHT - R_DAY) * dark;
        const TO = window.Torch;
        if (TO && TO.isLit && TO.isLit()) r = Math.max(r, R_DAY + (R_TORCH - R_DAY) * dark);
        const w = $gameScreen.weatherType && $gameScreen.weatherType();
        if ((w === "rain" || w === "storm") && $gameScreen._weatherPowerTarget > 0) r *= w === "storm" ? 0.8 : 0.88;
        return r;
    }
    function cast(v, ox, oy, reach, strength, through, northToo) {
        const m = v.m, W = m.W, H = m.H, see = v.see, pass = through || m.ground, things = m.things, north = m.north;
        for (let i = 0; i < RAYS; i++) {
            const a = i / RAYS * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
            let x = Math.floor(ox), y = Math.floor(oy), left = strength, front = -1;   // front: how much got through to where the thing in the way begins
            const up = northToo && dy < 0, sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, ax = dx !== 0 ? Math.abs(1 / dx) : Infinity, ay = dy !== 0 ? Math.abs(1 / dy) : Infinity;
            let nx = dx !== 0 ? (sx > 0 ? x + 1 - ox : ox - x) * ax : Infinity, ny = dy !== 0 ? (sy > 0 ? y + 1 - oy : oy - y) * ay : Infinity;
            for (;;) {
                let t;
                if (nx < ny) { t = nx; x += sx; nx += ax; } else { t = ny; y += sy; ny += ay; }
                if (t >= reach || x < 0 || y < 0 || x >= W || y >= H) break;
                const c = y * W + x, p = pass[c] * things[c] * (up ? north[c] : 1);
                // a thing in the way is seen whole (a roof, a tree's crown, a hill seen from below: from above all of it shows), what is behind it is not
                if (p < 1) { if (front < 0) front = left; } else front = -1;
                const s = (front >= 0 ? front : left) * (t > reach - FADE ? (reach - t) / FADE : 1);
                if (s > see[c]) see[c] = s;
                left *= p;
                if (left < 0.04) break;
            }
        }
    }
    function look(v) {
        const m = v.m, P = $gamePlayer, ox = P._realX + 0.5, oy = P._realY + 0.6, see = v.see, W = m.W;
        see.fill(0);
        if (Graphics.frameCount - m.thingsAt >= REFRESH || m.thingsAt < 0) { things(m); m.thingsAt = Graphics.frameCount; }
        const dark = nightNow(), reach = reachNow(dark), hc = Math.floor(oy) * W + Math.floor(ox), up = !!m.top[hc];
        v.dark = dark;
        cast(v, ox, oy, reach, 1, up ? m.high : m.ground, !up);
        // the roofs: seen from above over whatever stands between (what is behind a house is not)
        for (const c of m.roofs) {
            const d = Math.hypot((c % W) + 0.5 - ox, Math.floor(c / W) + 0.5 - oy);
            if (d < reach) { const s = d > reach - FADE ? (reach - d) / FADE : 1; if (s > see[c]) see[c] = s; }
        }
        // close by he always sees (his own cell, the one he stands in front of)
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const x = Math.floor(ox) + i, y = Math.floor(oy) + j; if (x >= 0 && y >= 0 && x < W && y < m.H) see[y * W + x] = Math.max(see[y * W + x], 1); }
        // the fires at night: what one lights is seen from afar, if the fire itself is seen
        if (dark > 0.25 && v.lights) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            for (const l of v.lights) {
                const lx = l.x / tw + $gameMap.displayX(), ly = l.y / th + $gameMap.displayY(), d = Math.hypot(lx - ox, ly - oy);
                if (d > LIGHT_REACH || d < 1) continue;
                const c = Math.floor(ly) * W + Math.floor(lx);
                if (c < 0 || c >= see.length) continue;
                const seenFire = rayTo(m, ox, oy, lx, ly, up ? m.high : m.ground);
                if (seenFire < 0.15) continue;
                const r = Math.max(1.5, (l.r || 200) / tw * LIGHT_SCALE);
                castSmall(v, lx, ly, r, seenFire * Math.min(1, dark * 1.5) * (l.i || 1));
            }
        }
        // during a scene the camera may look elsewhere: from the middle of the screen too
        if ($gameMap.isEventRunning() || $gameMap.isScrolling()) cast(v, $gameMap.displayX() + $gameMap.screenTileX() / 2, $gameMap.displayY() + $gameMap.screenTileY() / 2, R_DAY, 1, m.ground, true);
        // what it should look like now
        const k = v.known, want = v.want, mem = MEM + MEM_NIGHT * dark, fog = FOG + FOG_NIGHT * dark;
        for (let c = 0, n = see.length; c < n; c++) {
            const s = see[c];
            if (s > SEEN && !k[c]) { k[c] = 1; v.dirty = true; }
            want[c] = (1 - s) * (k[c] ? mem : fog);
        }
    }
    function rayTo(m, ox, oy, tx, ty, pass) {
        const dx = tx - ox, dy = ty - oy, d = Math.hypot(dx, dy), n = Math.ceil(d * 2), W = m.W;
        let left = 1;
        for (let i = 1; i < n; i++) {
            const x = Math.floor(ox + dx * i / n), y = Math.floor(oy + dy * i / n), c = y * W + x;
            if (x === Math.floor(tx) && y === Math.floor(ty)) break;
            left *= Math.pow(pass[c] * m.things[c], 0.5);   // (two samples a tile)
            if (left < 0.04) return 0;
        }
        return left;
    }
    function castSmall(v, ox, oy, r, strength) {
        const m = v.m, W = m.W, H = m.H, see = v.see;
        for (let y = Math.max(0, Math.floor(oy - r)); y <= Math.min(H - 1, Math.ceil(oy + r)); y++) for (let x = Math.max(0, Math.floor(ox - r)); x <= Math.min(W - 1, Math.ceil(ox + r)); x++) {
            const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy);
            if (d > r) continue;
            const s = strength * (1 - d / r) * rayTo(m, ox, oy, x + 0.5, y + 0.5, m.ground), c = y * W + x;
            if (s > see[c]) see[c] = s;
        }
    }

    // ------------------------------------------------------------------
    // The cover
    // ------------------------------------------------------------------
    function region(v) {
        const x0 = Math.max(0, Math.floor($gameMap.displayX()) - MARGIN), y0 = Math.max(0, Math.floor($gameMap.displayY()) - MARGIN);
        const x1 = Math.min(v.m.W - 1, Math.ceil($gameMap.displayX() + $gameMap.screenTileX()) + MARGIN), y1 = Math.min(v.m.H - 1, Math.ceil($gameMap.displayY() + $gameMap.screenTileY()) + MARGIN);
        return [x0, y0, x1, y1];
    }
    function step(v, all) {
        const a = v.a, want = v.want, px = v.img.data, W = v.m.W;
        const [x0, y0, x1, y1] = all ? [0, 0, W - 1, v.m.H - 1] : region(v);
        let moved = false;
        for (let y = y0; y <= y1; y++) for (let x = x0, c = y * W + x0; x <= x1; x++, c++) {
            const t = want[c], d = t - a[c];
            if (d === 0) continue;
            moved = true;
            a[c] = all || (d > -0.016 && d < 0.016) ? t : a[c] + d * (d < 0 ? CLEAR2 : SINK2);
            px[c * 4 + 3] = a[c] * 255;
        }
        if (!moved) return false;
        v.bm.context.putImageData(v.img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
        if (v.bm._baseTexture && v.bm._baseTexture.update) v.bm._baseTexture.update();
        return true;
    }
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        this._widok = null;
        if (!here()) return;
        const m = build(), bm = new Bitmap(m.W, m.H), sp = new Sprite(bm), n = m.W * m.H, img = bm.context.createImageData(m.W, m.H);
        for (let i = 0; i < n; i++) { img.data[i * 4] = COLOUR[0]; img.data[i * 4 + 1] = COLOUR[1]; img.data[i * 4 + 2] = COLOUR[2]; }
        bm.smooth = true;
        sp.scale.set($gameMap.tileWidth(), $gameMap.tileHeight());
        sp.update = function() {};
        this.addChild(sp);
        const v = this._widok = { sp, bm, m, img, mapId: $gameMap.mapId(), a: new Float32Array(n), want: new Float32Array(n), see: new Float32Array(n), known: knownOf($gameMap.mapId(), n),
            x: $gamePlayer._realX, y: $gamePlayer._realY, at: Graphics.frameCount, scene: false, running: false, settled: false, dirty: false, dark: 0, lights: null, kept: Graphics.frameCount };
        m.thingsAt = -1;
        look(v);
        step(v, true);
    };
    function frame(set, v) {
        const P = $gamePlayer, scene = v.running;
        const dx = P._realX - v.x, dy = P._realY - v.y, d2 = dx * dx + dy * dy, now = Graphics.frameCount;
        if (d2 > MOVED * MOVED || now - v.at >= REFRESH || scene !== v.scene) {
            v.lights = v.dark > 0.2 && set._nightLight && set._nightLight.lights ? set._nightLight.lights() : null;   // (the fires: only when it is getting dark)
            look(v);
            v.x = P._realX; v.y = P._realY; v.at = now; v.scene = scene; v.settled = false;
            if (d2 > 16) { step(v, true); return; }   // (a far jump: at once)
        }
        if (!v.settled && (now & 1) === 0 && !step(v)) v.settled = true;   // (the cover's pixels move every other frame - twice the step)
        if (v.dirty && now - v.kept > 120) { keep(v.mapId); v.dirty = false; v.kept = now; }
    }
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        // (a scene on or not: asked once a frame, before the people's sprites are updated - the map's interpreter only: the engine's isEventRunning goes through every event of the map)
        if (this._widok) this._widok.running = $gameMap._interpreter.isRunning() || $gameMap.isScrolling();
        _update.call(this);
        const v = this._widok;
        if (!v) return;
        if (!on()) { v.sp.visible = false; return; }
        v.sp.visible = true;
        const tm = this._tilemap, base = this._baseSprite;
        v.sp.x = (base ? base.x : 0) + tm.x - tm.origin.x;
        v.sp.y = (base ? base.y : 0) + tm.y - tm.origin.y;
        if (this._widokFrame === Graphics.frameCount) return;   // (a frame drawn again does not move it on)
        this._widokFrame = Graphics.frameCount;
        frame(this, v);
    };
    const view = () => (SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._widok) || null;

    // ------------------------------------------------------------------
    // People and animals: seen only while he sees them (in the fog, in a dimmed place behind a house: not)
    // ------------------------------------------------------------------
    const seenOf = (v, ch) => { const x = Math.floor(ch._realX + 0.5), y = Math.floor(ch._realY + 0.5); return x < 0 || y < 0 || x >= v.m.W || y >= v.m.H ? 1 : v.see[y * v.m.W + x]; };
    // (asked once a character - and again when its page changes: only people and animals, not the hundreds of trees and stones)
    const living = ch => ch instanceof Game_Event && !!ch.characterName() && ch.characterName()[0] !== "!";
    T.sprite.hook({ owner: PLUGIN, method: "updateOther", when: s => living(s._character), after(s) {
        const v = view(), ch = s._character;
        if (!v || !on()) { if (s._widokF !== undefined) s._widokF = undefined; return; }
        const name = ch.characterName();
        if (!name || name[0] === "!") return;
        let want = 1;
        if (!v.running && Math.abs(ch.x - $gamePlayer.x) + Math.abs(ch.y - $gamePlayer.y) > 2) want = Math.max(0, Math.min(1, (seenOf(v, ch) - 0.15) / 0.35));
        const f = s._widokF === undefined ? want : s._widokF + (want - s._widokF) * 0.15;
        s._widokF = Math.abs(f - want) < 0.01 ? want : f;
        if (s._widokF < 1) s.opacity = Math.round(s.opacity * s._widokF);
    } });
    // someone he cannot see says nothing he could read
    let bubblesHooked = false;
    const _mapUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (!bubblesHooked) {
            const SB = T.api && T.api("SpeechBubbles");
            if (SB && SB.say) {
                const say = SB.say;
                SB.say = function(ev, text, ...rest) { const v = view(); if (v && on() && ev && ev.eventId && !$gameMap.isEventRunning() && seenOf(v, ev) < 0.15) return false; return say.call(this, ev, text, ...rest); };
                bubblesHooked = true;
            }
        }
        _mapUpdate.call(this);
    };

    const api = {
        on,
        active: () => !!view(),
        // tests: how covered a tile is now / will be, how much he sees of it, does he know it, what a look costs
        cover: (x, y) => { const v = view(); return v ? v.a[y * v.m.W + x] : -1; },
        want: (x, y) => { const v = view(); return v ? v.want[y * v.m.W + x] : -1; },
        sees: (x, y) => { const v = view(); return v ? v.see[y * v.m.W + x] : -1; },
        knows: (x, y) => { const v = view(); return v ? !!v.known[y * v.m.W + x] : false; },
        known: mapId => { const k = known.get(mapId); return k ? k.reduce((s, b) => s + b, 0) : 0; },
        settled: () => { const v = view(); return !!v && v.settled; },
        pass: (x, y) => { const v = view(); if (!v) return -1; const c = y * v.m.W + x; return [v.m.ground[c], v.m.north[c], v.m.high[c], v.m.things[c]]; },
        reach: () => reachNow(nightNow()),
        cost(n) {
            const v = view(), t0 = performance.now();
            for (let i = 0; i < n; i++) look(v);
            const looks = (performance.now() - t0) / n, t1 = performance.now();
            for (let i = 0; i < n; i++) { v.a[v.m.W * Math.floor($gamePlayer.y) + $gamePlayer.x] = i % 2; step(v); }
            return { look: looks, draw: (performance.now() - t1) / n };
        }
    };
    window.Widok = T.register(PLUGIN, api);
})();
