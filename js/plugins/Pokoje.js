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
 * @help Działa na mapach z zestawem wnętrz (8) i podziemi (10, 12, 20); ściany bierze sama z mapy. <Widok:off> w notatce mapy ją pomija, window.POKOJE = false wyłącza.
 */
(() => {
    "use strict";
    const PLUGIN = "Pokoje";
    const T = window.Tawerna;
    // the tilesets it works on: the buildings' interiors (8); since 2026-11-19 (the user: "tak jak w tawernie nie widzi się, co jest za
    // ścianą... czemu tak samo nie ma w podziemiach") the underground's - the dungeon (10: floors 1-10, the tavern's cellar), the Order's
    // quarters (12: floors 11-100), the mine with rails (20) - their walls are unwalkable lower tiles as well
    const INTERIORS = [8, 10, 12, 20];
    const SEE_FULL = 12, SEE_END = 17; // tiles: seen fully up to here, fading to black by there
    const WALL_UP = 5;                 // a wall met from below shows this many tiles up at most
    const DOOR_NEAR = 1.6;             // tiles: a door blocks the view until he is this near
    const NARROW = 6;                  // tiles across: a doorway, not a room
    const RAYS = 360;
    const PX = 2;                      // the cover's pixels a tile
    // (2026-11-20, the user: "żeby ta linia cienia, jak postać się porusza, płynniej się zmieniała i szybciej": the rays go out
    // again almost every frame he walks - the edge glides instead of stepping - and what he stops seeing darkens quickly too, it
    // trailed behind him for a second; was CLEAR 0.2, SINK 0.05, MOVED 0.12)
    const CLEAR = 0.3, SINK = 0.18;    // a frame: how much of the way to the right darkness a pixel goes, when it clears / when it sinks
    const MOVED = 0.03;                // tiles he moves before the rays go out again
    const SCENE_EVERY = 6;             // frames between looks during a scene
    const on = () => window.POKOJE !== false;
    const here = () => !!window.$gameMap && !!window.$dataMap && on() && INTERIORS.includes($gameMap.tilesetId()) && !/<Widok:off>/i.test($dataMap.note || "");

    // ------------------------------------------------------------------
    // The walls of a map, its narrow ways, its doors
    // ------------------------------------------------------------------
    let memo = null;
    function build() {
        if (memo && memo.data === $dataMap) return memo;
        const W = $gameMap.width(), H = $gameMap.height(), flags = $gameMap.tilesetFlags(), floor = new Uint8Array(W * H), narrow = new Uint8Array(W * H);
        const top = new Uint8Array(W * H), rim = new Uint8Array(W * H), rock = new Uint8Array(W * H), face = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let free = false;
            for (const z of [1, 0]) {
                const t = $gameMap.tileId(x, y, z);
                if (!t) continue;
                const f = flags[t];
                if (f & 0x10) continue;
                free = (f & 0x0f) !== 0x0f;
                if (free && Tilemap.isWallTopTile(t)) { top[y * W + x] = 1; if (f & 0x0f) rim[y * W + x] = 1; }
                if (Tilemap.isTileA4(t) && !Tilemap.isWallTopTile(t)) face[y * W + x] = 1;   // (an A4 wall's face: it looks south)
                break;
            }
            floor[y * W + x] = free ? 1 : 0;
        }
        // the rock of the underground (2026-11-19, the user: "tu jest ściana, ale widać za nią"): wall tops shut only on their floor
        // side (the engine's one-way rim - nobody walks onto them) and open inside, so a thin side wall let the eye through. A patch of
        // wall tops with such a rim anywhere is rock, all of it; wall tops with no rim at all are a floor (the interiors' boards)
        for (let i = 0; i < W * H; i++) {
            if (top[i] !== 1) continue;
            const cells = [i];
            let isRock = false;
            top[i] = 2;
            for (let k = 0; k < cells.length; k++) {
                const c = cells[k], x = c % W;
                if (rim[c]) isRock = true;
                for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) {
                    if (n >= 0 && n < W * H && top[n] === 1) { top[n] = 2; cells.push(n); }
                }
            }
            if (isRock) for (const c of cells) { floor[c] = 0; rock[c] = 1; }
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
        memo = { data: $dataMap, W, H, floor, narrow, rock, face, doors, blocked: new Uint8Array(W * H), open: new Uint8Array(W * H) };
        return memo;
    }
    // what rises above a wall or a door met from below: more wall, or the narrow way behind a door; a wall with a room's floor on a side divides two other rooms: not part of it
    function riseOf(m, x, y) {
        const { W, floor, narrow, rock } = m;
        let k = 0;
        while (k < WALL_UP && y - k - 1 >= 0) {
            const up = (y - k - 1) * W + x;
            if (rock[up]) break;   // (the underground's rock over a wall face: the ceiling - nobody sees it from below, 2026-11-19 "od sufitu gracz nie widzi")
            if (floor[up]) { if (!narrow[up]) break; }
            else if ((x > 0 && floor[up - 1] && !narrow[up - 1]) || (x < W - 1 && floor[up + 1] && !narrow[up + 1])) break;
            k++;
        }
        return k;
    }

    // ------------------------------------------------------------------
    // One look: a path of everything seen from (ox, oy)
    // ------------------------------------------------------------------
    // (end: how far it goes, tiles; blocked: the doors that stop it)
    function cast(m, ox, oy, dx, dy, hit, end = SEE_END, blocked = m.blocked) {
        const { W, H, floor } = m;
        let x = Math.floor(ox), y = Math.floor(oy);
        const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, ax = dx !== 0 ? Math.abs(1 / dx) : Infinity, ay = dy !== 0 ? Math.abs(1 / dy) : Infinity;
        let nx = dx !== 0 ? (sx > 0 ? x + 1 - ox : ox - x) * ax : Infinity, ny = dy !== 0 ? (sy > 0 ? y + 1 - oy : oy - y) * ay : Infinity;
        for (;;) {
            let t, vertical;
            if (nx < ny) { t = nx; x += sx; nx += ax; vertical = false; } else { t = ny; y += sy; ny += ay; vertical = true; }
            if (t >= end) return end;
            if (x < 0 || y < 0 || x >= W || y >= H) return t;
            const c = y * W + x;
            if (!floor[c] || blocked[c]) {
                hit.c = c; hit.up = vertical && sy < 0; hit.side = !vertical;
                // the side of a narrow way, met from north of it: what is painted there is the face of the wall of the room south of it, turned away from him
                hit.back = !vertical && oy < y && !!m.narrow[y * W + x - sx];
                // (an A4 wall's face met from above - from north of it: its back, the face is the room's south of it)
                if (vertical && sy > 0 && m.face[c]) hit.back = true;
                return t;
            }
        }
    }
    // (the path in tiles; end, blocked: as cast's)
    function look(m, ox, oy, end, blocked) {
        const path = new Path2D(), walls = new Map(), hit = { c: -1, up: false };
        for (let i = 0; i < RAYS; i++) {
            const ang = i / RAYS * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang);
            hit.c = -1;
            const t = cast(m, ox, oy, dx, dy, hit, end, blocked), px = ox + dx * t, py = oy + dy * t;
            if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
            // (1: met from below, 2: from above; a wall met only from a side gets 0)
            if (hit.c >= 0 && !hit.back) walls.set(hit.c, (walls.get(hit.c) || 0) | (hit.up ? 1 : hit.side ? 0 : 2));
        }
        path.closePath();
        const shown = new Set(), show = (x, y0, n) => { for (let y = y0; y < y0 + n; y++) shown.add(y * m.W + x); };
        for (const [c, how] of walls) {
            // (the underground's rock is the ceiling over the walls: it stops the eye and the light, but nothing of it is seen or lit -
            // the eye and a flame see a wall up to the top of its face; 2026-11-19, the user: "światło pochodni powinno kończyć się na
            // krawędzi ściany, bo od sufitu gracz nie widzi")
            if (m.rock[c]) continue;
            const up = (how & 1) !== 0, x = c % m.W, y = (c - x) / m.W, k = up ? riseOf(m, x, y) : 0;
            path.rect(x, y - k, 1, k + 1);
            show(x, y - k, k + 1);
            // the walls on both sides of it, as high: a room's corners, no black notches where two walls meet (a door seen from behind brings none: they are the far room's)
            if (m.floor[c] && !up) continue;
            // (a wall met only from a side: its neighbours in that row are the way the eye came and what lies beyond it - a thick
            // wall's far half, the next hall's wall or edge: not seen; 2026-11-19, a hall's wall face showed through from the corridor)
            if (!how) continue;
            for (const sx of [x - 1, x + 1]) {
                if (sx < 0 || sx >= m.W) continue;
                let n = 0;
                const ok = i => !m.floor[i] && !m.rock[i] && (up || !m.face[i]);   // (no rock; beside a wall met from above no face's back)
                while (n <= k && y - n >= 0 && ok((y - n) * m.W + sx)) n++;
                if (n) { path.rect(sx, y - n + 1, 1, n); show(sx, y - n + 1, n); }
            }
        }
        // a room's corner no ray meets (2026-11-21, the far bottom corner of the hut was a black square): a wall with a wall shown beside
        // it and one shown above or below it is shown too (never the underground's rock)
        const corners = [];
        for (const c of shown) {
            const x = c % m.W, y = (c - x) / m.W;
            for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
                if (nx < 0 || ny < 0 || nx >= m.W || ny >= m.H) continue;
                const k = ny * m.W + nx;
                if (shown.has(k) || m.floor[k] || m.rock[k]) continue;
                const side = (nx > 0 && shown.has(k - 1)) || (nx < m.W - 1 && shown.has(k + 1)), vert = (ny > 0 && shown.has(k - m.W)) || (ny < m.H - 1 && shown.has(k + m.W));
                if (side && vert) corners.push(k);
            }
        }
        for (const k of corners) if (!shown.has(k)) { shown.add(k); path.rect(k % m.W, (k - k % m.W) / m.W, 1, 1); }
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
        // (a scene seen through the hero's own eyes - $gameTemp._sightHeroOnly, never saved; 2026-11-07: grandpa's first talk, the hero
        // in his bed and grandpa coming out of the dark - looks only from him)
        if (($gameMap.isEventRunning() || $gameMap.isScrolling()) && !(window.$gameTemp && $gameTemp._sightHeroOnly)) {
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
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, w, h);
        g.setTransform(PX, 0, 0, PX, 0, 0);   // (the looks are in tiles)
        for (const l of looks(v)) {
            const r = g.createRadialGradient(l.ox, l.oy, 0, l.ox, l.oy, SEE_END);
            r.addColorStop(0, "#000");
            r.addColorStop(SEE_FULL / SEE_END, "#000");
            r.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = r;
            g.fill(l.path);
        }
        g.setTransform(1, 0, 0, 1, 0, 0);
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
    // what a flame lights (RoomLighting.js, 2026-11-19, the user: "żeby światło pochodni nie przechodziło poza ściany"): the same rays
    // as the eye, from the flame (x, y in tiles) as far as `reach` tiles - a path in tiles, the walls it meets in it; doors do not stop
    // it. A flame inside a wall (a torch on a wall face, a fire in the wall) shines from the floor in front of it. null: walls unknown
    // here (not an interior or the underground, <Widok:off>, window.POKOJE false) or no floor beside the flame
    function lightArea(x, y, reach) {
        if (!here() || !$gameMap.width()) return null;
        const m = build(), floorAt = (cx, cy) => cx >= 0 && cy >= 0 && cx < m.W && cy < m.H && m.floor[cy * m.W + cx] === 1;
        let ox = x, oy = y;
        const fx = Math.floor(x), fy = Math.floor(y);
        if (!floorAt(fx, fy)) {
            // (the nearest floor cell round it - below first when as near: a torch hangs on a wall's face -, the flame from its nearest point)
            let best = null, bd = Infinity;
            for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1], [0, 2]]) {
                const cx = fx + dx, cy = fy + dy;
                if (!floorAt(cx, cy)) continue;
                const px = Math.min(cx + 0.95, Math.max(cx + 0.05, x)), py = Math.min(cy + 0.95, Math.max(cy + 0.05, y)), d = Math.hypot(px - x, py - y);
                if (d < bd - 1e-6) { bd = d; best = [px, py]; }
            }
            if (!best) return null;
            [ox, oy] = best;
        }
        return look(m, ox, oy, reach, m.open).path;
    }
    const api = {
        on,
        active: () => !!view(),
        // tests: how black a tile's middle is now, does he see it, did it settle, what a frame costs
        cover: (x, y) => { const v = view(); return v ? v.a[(y * PX + (PX >> 1)) * v.bm.width + x * PX + (PX >> 1)] / 255 : -1; },
        sees: (x, y) => { const v = view(); return v ? sees(v, x, y) : false; },
        settled: () => { const v = view(); return !!v && v.settled; },
        doors: () => { const v = view(); return v ? v.m.doors.map(d => [d.x, d.y, d.cells.length]) : []; },
        lightArea,
        // tests: the walls as it reads them (floor 1 = the eye goes through, rock 1 = the underground's rock)
        grid: () => { if (!here()) return null; const m = build(); return { W: m.W, H: m.H, floor: Array.from(m.floor), rock: Array.from(m.rock) }; },
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
