// Pokoje.js - the hero sees what he can see (user 2026-11-05: "nie dałoby rady tego zrobić naturalnie po ludzku? Jakiś zasięg widzenia i to co za ścianami to naturalnie czarne?").
// Rays go out from where the hero stands and stop at walls (the lower tile layers: furniture does not stop them) and at doors until he is next to one: their ends make one shape, the edges
// of what is hidden are straight lines like real shadows. A wall met from below shows up to its top, a door with its whole width and what rises above it. Further than SEE_FULL it fades, past SEE_END it is black.
// The cover is one small picture fixed to the map (PX pixels a tile, scaled up smoothly: a soft edge). Each pixel moves towards what it should be: what comes into view clears quickly, what goes
// out of view sinks slowly, so walking through a doorway never flashes black, and an edge stays where it is drawn. Standing still nothing is done. During a scene the running event's place and
// the screen's middle see too. Nothing is saved.
/*:
 * @target MZ
 * @plugindesc Zasięg widzenia we wnętrzach budynków: widać to, co bohater może zobaczyć; to, co za ścianami i daleko, jest czarne. v2.4.0
 * @author Claude
 * @help Działa na mapach z zestawem wnętrz (8); ściany bierze sama z mapy. <Widok:off> w notatce mapy ją pomija, window.POKOJE = false wyłącza.
 */
(() => {
    "use strict";
    const PLUGIN = "Pokoje";
    const T = window.Tawerna;
    const INTERIOR = 8;                // the tileset of the buildings' interiors (the dungeon sets build their walls differently, and there the fights are)
    const SEE_FULL = 12, SEE_END = 17; // tiles: seen fully up to here, fading to black by there
    const WALL_UP = 5;                 // a wall met from below shows this many tiles up at most
    const DOOR_NEAR = 1.6;             // tiles: a door blocks the view until he is this near
    const NARROW = 6;                  // tiles across: a doorway, not a room
    const RAYS = 360;
    const PX = 2;                      // the cover's pixels a tile
    const CLEAR = 0.2, SINK = 0.05;    // a frame: how much of the way to the right darkness a pixel goes, when it clears / when it sinks
    const MOVED = 0.12;                // tiles he moves before the rays go out again
    const SCENE_EVERY = 6;             // frames between looks during a scene
    const on = () => window.POKOJE !== false;
    const here = () => !!window.$gameMap && !!window.$dataMap && on() && $gameMap.tilesetId() === INTERIOR && !/<Widok:off>/i.test($dataMap.note || "");

    // ------------------------------------------------------------------
    // The walls of a map, its narrow ways, its doors
    // ------------------------------------------------------------------
    let memo = null;
    function build() {
        if (memo && memo.data === $dataMap) return memo;
        const W = $gameMap.width(), H = $gameMap.height(), flags = $gameMap.tilesetFlags(), floor = new Uint8Array(W * H), narrow = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let free = false;
            for (const z of [1, 0]) {
                const t = $gameMap.tileId(x, y, z);
                if (!t) continue;
                const f = flags[t];
                if (f & 0x10) continue;
                free = (f & 0x0f) !== 0x0f;
                break;
            }
            floor[y * W + x] = free ? 1 : 0;
        }
        const runs = [];
        for (let y = 0; y < H; y++) {
            let x = 0;
            while (x < W) {
                if (!floor[y * W + x]) { x++; continue; }
                let e = x;
                while (e + 1 < W && floor[y * W + e + 1]) e++;
                if (e - x + 1 <= NARROW) { const cells = []; for (let i = x; i <= e; i++) { narrow[y * W + i] = 1; cells.push(y * W + i); } runs.push(cells); }
                x = e + 1;
            }
        }
        // a door you can see closes the whole narrow way it stands in, side to side (a door standing in a wall needs nothing: the wall closes it; a lattice gate is seen through)
        const doors = [];
        for (const e of $dataMap.events) {
            if (!e || !e.pages) continue;
            const pics = e.pages.map(p => p.image.characterName).join(" ").trim();
            if (!/door/i.test(pics) && !(pics && /^(Stare )?Drzwi/i.test(e.name || ""))) continue;
            const c = e.y * W + e.x;
            if (e.x < 0 || e.y < 0 || e.x >= W || e.y >= H || !floor[c]) continue;
            const run = runs.find(r => r.includes(c));   // (only in a narrow way: a bell rope or a floor hatch drawn on the doors' sheet stands in the open)
            if (run) doors.push({ id: e.id, x: e.x, y: e.y, cells: run });
        }
        memo = { data: $dataMap, W, H, floor, narrow, doors, blocked: new Uint8Array(W * H) };
        return memo;
    }
    // what rises above a wall or a door met from below: more wall, or the narrow way behind a door; a wall with a room's floor on a side divides two other rooms: not part of it
    function riseOf(m, x, y) {
        const { W, floor, narrow } = m;
        let k = 0;
        while (k < WALL_UP && y - k - 1 >= 0) {
            const up = (y - k - 1) * W + x;
            if (floor[up]) { if (!narrow[up]) break; }
            else if ((x > 0 && floor[up - 1] && !narrow[up - 1]) || (x < W - 1 && floor[up + 1] && !narrow[up + 1])) break;
            k++;
        }
        return k;
    }

    // ------------------------------------------------------------------
    // One look: a path of everything seen from (ox, oy)
    // ------------------------------------------------------------------
    function cast(m, ox, oy, dx, dy, hit) {
        const { W, H, floor, blocked } = m;
        let x = Math.floor(ox), y = Math.floor(oy);
        const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, ax = dx !== 0 ? Math.abs(1 / dx) : Infinity, ay = dy !== 0 ? Math.abs(1 / dy) : Infinity;
        let nx = dx !== 0 ? (sx > 0 ? x + 1 - ox : ox - x) * ax : Infinity, ny = dy !== 0 ? (sy > 0 ? y + 1 - oy : oy - y) * ay : Infinity;
        for (;;) {
            let t, vertical;
            if (nx < ny) { t = nx; x += sx; nx += ax; vertical = false; } else { t = ny; y += sy; ny += ay; vertical = true; }
            if (t >= SEE_END) return SEE_END;
            if (x < 0 || y < 0 || x >= W || y >= H) return t;
            const c = y * W + x;
            if (!floor[c] || blocked[c]) {
                hit.c = c; hit.up = vertical && sy < 0;
                // the side of a narrow way, met from north of it: what is painted there is the face of the wall of the room south of it, turned away from him
                hit.back = !vertical && oy < y && !!m.narrow[y * W + x - sx];
                return t;
            }
        }
    }
    function look(m, ox, oy) {
        const path = new Path2D(), walls = new Map(), hit = { c: -1, up: false };
        for (let i = 0; i < RAYS; i++) {
            const ang = i / RAYS * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang);
            hit.c = -1;
            const t = cast(m, ox, oy, dx, dy, hit), px = (ox + dx * t) * PX, py = (oy + dy * t) * PX;
            if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
            if (hit.c >= 0 && !hit.back) walls.set(hit.c, walls.get(hit.c) || hit.up);
        }
        path.closePath();
        for (const [c, up] of walls) {
            const x = c % m.W, y = (c - x) / m.W, k = up ? riseOf(m, x, y) : 0;
            path.rect(x * PX, (y - k) * PX, PX, (k + 1) * PX);
            // the walls on both sides of it, as high: a room's corners, no black notches where two walls meet (a door seen from behind brings none: they are the far room's)
            if (m.floor[c] && !up) continue;
            for (const sx of [x - 1, x + 1]) {
                if (sx < 0 || sx >= m.W) continue;
                let n = 0;
                while (n <= k && y - n >= 0 && !m.floor[(y - n) * m.W + sx]) n++;
                if (n) path.rect(sx * PX, (y - n + 1) * PX, PX, n * PX);
            }
        }
        return { path, ox, oy };
    }
    function looks(v) {
        const m = v.m, P = $gamePlayer, ox = P._realX + 0.5, oy = P._realY + 0.6, out = [];
        m.blocked.fill(0);
        for (const d of m.doors) {
            const ev = $gameMap.event(d.id), ax = d.x + 0.5 - ox, ay = d.y + 0.5 - oy;
            const shut = !!ev && ev.isNormalPriority() && !ev.isThrough() && !!ev.characterName();   // (a door that stops him stops the eye too, however near he stands)
            if (shut || ax * ax + ay * ay > DOOR_NEAR * DOOR_NEAR) for (const c of d.cells) m.blocked[c] = 1;
        }
        out.push(look(m, ox, oy));
        if ($gameMap.isEventRunning() || $gameMap.isScrolling()) {
            const keep = m.blocked.slice();
            m.blocked.fill(0);
            const id = $gameMap._interpreter.eventId(), ev = id > 0 ? $gameMap.event(id) : null;
            if (ev) out.push(look(m, ev._realX + 0.5, ev._realY + 0.6));
            out.push(look(m, $gameMap.displayX() + $gameMap.screenTileX() / 2, $gameMap.displayY() + $gameMap.screenTileY() / 2));
            m.blocked.set(keep);
        }
        return out;
    }

    // ------------------------------------------------------------------
    // The cover
    // ------------------------------------------------------------------
    // what each pixel should be (v.want: 0 seen .. 255 black)
    function aim(v) {
        const g = v.seen, w = v.bm.width, h = v.bm.height;
        g.clearRect(0, 0, w, h);
        for (const l of looks(v)) {
            const r = g.createRadialGradient(l.ox * PX, l.oy * PX, 0, l.ox * PX, l.oy * PX, SEE_END * PX);
            r.addColorStop(0, "#000");
            r.addColorStop(SEE_FULL / SEE_END, "#000");
            r.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = r;
            g.fill(l.path);
        }
        const d = g.getImageData(0, 0, w, h).data, want = v.want;
        for (let i = 0, n = want.length; i < n; i++) want[i] = 255 - d[i * 4 + 3];
    }
    function draw(v) {
        const a = v.a, px = v.img.data;
        for (let i = 0, n = a.length; i < n; i++) px[i * 4 + 3] = a[i];
        v.bm.context.putImageData(v.img, 0, 0);
        if (v.bm._baseTexture && v.bm._baseTexture.update) v.bm._baseTexture.update();
    }
    // a step of every pixel; false: all of them are there
    function step(v) {
        const a = v.a, want = v.want;
        let moved = false;
        for (let i = 0, n = a.length; i < n; i++) {
            const t = want[i], d = t - a[i];
            if (d === 0) continue;
            moved = true;
            a[i] = d > -2 && d < 2 ? t : a[i] + d * (d < 0 ? CLEAR : SINK);
        }
        if (moved) draw(v);
        return moved;
    }
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        this._pokoje = null;
        if (!here()) return;
        const m = build(), bm = new Bitmap(m.W * PX, m.H * PX), sp = new Sprite(bm), n = bm.width * bm.height;
        bm.smooth = true;
        sp.scale.set($gameMap.tileWidth() / PX, $gameMap.tileHeight() / PX);
        sp.update = function() {};
        this.addChild(sp);
        const cv = document.createElement("canvas");
        cv.width = bm.width; cv.height = bm.height;
        const v = this._pokoje = { sp, bm, m, a: new Float32Array(n), want: new Float32Array(n), img: bm.context.createImageData(bm.width, bm.height), seen: cv.getContext("2d", { willReadFrequently: true }),
            x: $gamePlayer._realX, y: $gamePlayer._realY, scene: false, settled: true };
        aim(v);
        v.a.set(v.want);
        draw(v);
    };
    function frame(v) {
        const P = $gamePlayer, scene = $gameMap.isEventRunning() || $gameMap.isScrolling();
        const dx = P._realX - v.x, dy = P._realY - v.y, d2 = dx * dx + dy * dy;
        if (d2 > 16) {                      // (a far jump - a transfer inside the map - is at once)
            v.x = P._realX; v.y = P._realY; v.scene = scene;
            aim(v); v.a.set(v.want); draw(v); v.settled = true;
            return;
        }
        if (d2 > MOVED * MOVED || (scene && Graphics.frameCount % SCENE_EVERY === 0) || (v.scene && !scene)) {
            v.x = P._realX; v.y = P._realY; v.scene = scene;
            aim(v);
            v.settled = false;
        }
        if (!v.settled && !step(v)) v.settled = true;
    }
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.call(this);
        const v = this._pokoje;
        if (!v) return;
        if (!on()) { v.sp.visible = false; return; }
        v.sp.visible = true;
        const tm = this._tilemap, base = this._baseSprite;   // (exactly over the tiles, whatever moves them)
        v.sp.x = (base ? base.x : 0) + tm.x - tm.origin.x;
        v.sp.y = (base ? base.y : 0) + tm.y - tm.origin.y;
        if (this._pokojeFrame === Graphics.frameCount) return;   // (a frame drawn again does not move it on)
        this._pokojeFrame = Graphics.frameCount;
        frame(v);
    };
    const view = () => (SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._pokoje) || null;
    // does he see that cell now?
    function sees(v, x, y) {
        const P = $gamePlayer, ox = P._realX + 0.5, oy = P._realY + 0.6, tx = x + 0.5 - ox, ty = y + 0.5 - oy, d = Math.hypot(tx, ty);
        if (d >= SEE_END) return false;
        if (d < 0.01) return true;
        return cast(v.m, ox, oy, tx / d, ty / d, { c: -1, up: false }) >= d - 0.5;
    }
    // someone he cannot see says nothing he could read over the black
    const covered = ev => { const v = view(); return !!v && !!ev && on() && !$gameMap.isEventRunning() && !sees(v, ev.x, ev.y); };
    let bubblesHooked = false;
    const _mapUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (!bubblesHooked) {
            const SB = T.api && T.api("SpeechBubbles");
            if (SB && SB.say) { const say = SB.say; SB.say = function(ev, text, ...rest) { if (covered(ev)) return false; return say.call(this, ev, text, ...rest); }; bubblesHooked = true; }
        }
        _mapUpdate.call(this);
    };
    const api = {
        on,
        active: () => !!view(),
        // tests: how black a tile's middle is now, does he see it, did it settle, what a frame costs
        cover: (x, y) => { const v = view(); return v ? v.a[(y * PX + (PX >> 1)) * v.bm.width + x * PX + (PX >> 1)] / 255 : -1; },
        sees: (x, y) => { const v = view(); return v ? sees(v, x, y) : false; },
        settled: () => { const v = view(); return !!v && v.settled; },
        doors: () => { const v = view(); return v ? v.m.doors.map(d => [d.x, d.y, d.cells.length]) : []; },
        cost(n) {
            const v = view(), t0 = performance.now();
            for (let i = 0; i < n; i++) aim(v);
            const rays = (performance.now() - t0) / n, t1 = performance.now();
            for (let i = 0; i < n; i++) { v.a[0] = i % 2 ? 0 : 255; v.want[0] = 128; step(v); }
            const paint = (performance.now() - t1) / n;
            v.settled = false;
            return { rays, paint };
        }
    };
    window.Pokoje = T.register(PLUGIN, api);
})();
