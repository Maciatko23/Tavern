// Jedno wspólne szukanie drogi (refaktor 2026-11-07, tools/droga/zmiany.py): Tawerna.grid.astar8 / bfs daje DOKŁADNIE te drogi, co
// pięć dawnych kopii (HomeLife findPath, TavernShift_Hall path, TavernLife pathTo, Underground pathTo, TavernLife_Plan planBfs) -
// stare kopie są tu słowo w słowo (tylko plansza z losowania zamiast mapy gry), nowe wywołania jak w wtyczkach. Losowe plansze
// (ziarno stałe), przeszkody, strony przejścia, cele (też nieosiągalne i na starcie), strefa drzwi i kot. Do tego czas: stary
// i nowy A* dziadka na planszy bez wyjścia (2000 kroków).
//   node tests/droga_test.js         (przed instalacją: GAME_OVERLAY=tools/droga/staging GAME_OVERLAY_JS=1)
const kit = require("./lib/kit.js");

const PAGE = function(TRIALS) {
    const G = window.Tawerna.grid;
    let s = 20261107;
    const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const board = () => {
        const W = ri(6, 40), H = ri(5, 30), dens = 0.05 + rnd() * 0.4, open = [];
        for (let i = 0; i < W * H; i++) open.push(rnd() > dens);
        const side = [];   // (4-way passage of each side: 2 4 6 8)
        for (let i = 0; i < W * H; i++) side.push({ 2: rnd() > dens * 0.6, 4: rnd() > dens * 0.6, 6: rnd() > dens * 0.6, 8: rnd() > dens * 0.6 });
        return { W, H, open, side, cell: () => [ri(0, W - 1), ri(0, H - 1)], ok: (x, y) => x >= 0 && y >= 0 && x < W && y < H && open[y * W + x] };
    };
    const res = { home: 0, hall: 0, tl: 0, ug: 0, plan: 0, found: { home: 0, hall: 0, tl: 0, ug: 0, plan: 0 }, miss: { home: 0, hall: 0, tl: 0, ug: 0, plan: 0 }, bad: [] };
    const same = (kind, a, b, info) => {
        res[kind]++;
        if (a) res.found[kind]++;
        if (JSON.stringify(a) === JSON.stringify(b)) return;
        if (++res.miss[kind] <= 3) res.bad.push(kind + " " + JSON.stringify(info) + " old " + JSON.stringify(a) + " new " + JSON.stringify(b));   // (three of each kind shown)
    };

    // ---- 1. HomeLife findPath (the old one word for word: L.ok -> B.ok, doorZone / the cat from the draw)
    function oldHome(B, sx, sy, goals, isCat, doorZone, kit, hero, gpa) {
        const W = B.W;
        const blocked = (x, y) => {
            if (!B.ok(x, y)) return true;
            if (isCat && doorZone(x, y)) return true;
            if (hero.has(x + "," + y)) return true;
            if (isCat && gpa && gpa.x === x && gpa.y === y) return true;
            return false;
        };
        const goal = new Set(goals.map(([x, y]) => x + "," + y));
        const hdist = (x, y) => Math.min(...goals.map(([gx, gy]) => { const dx = Math.abs(gx - x), dy = Math.abs(gy - y); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); }));
        const key = (x, y) => y * W + x, start = key(sx, sy);
        const gs = new Map([[start, 0]]), from = new Map(), open = [[hdist(sx, sy), sx, sy]], closed = new Set();
        let n = 0;
        while (open.length && n++ < 2000) {
            let bi = 0;
            for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
            const [, x, y] = open.splice(bi, 1)[0], k = key(x, y);
            if (closed.has(k)) continue;
            closed.add(k);
            if (goal.has(x + "," + y)) {
                const out = [];
                for (let c = k; c !== start; c = from.get(c)) out.unshift([c % W, Math.floor(c / W)]);
                return out;
            }
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                const nx = x + dx, ny = y + dy;
                if (blocked(nx, ny)) continue;
                if (dx && dy && (blocked(x + dx, y) || blocked(x, y + dy))) continue;
                const cost = (dx && dy ? 1.414 : 1) + (!isCat && doorZone(nx, ny) ? 6 : 0) + (!isCat && kit && kit.x === nx && kit.y === ny ? 3 : 0);
                const ng = gs.get(k) + cost, nk = key(nx, ny);
                if (ng < (gs.has(nk) ? gs.get(nk) : Infinity)) { gs.set(nk, ng); from.set(nk, k); open.push([ng + hdist(nx, ny), nx, ny]); }
            }
        }
        return null;
    }
    function newHome(B, sx, sy, goals, isCat, doorZone, kit, hero, gpa) {
        const W = B.W, H = B.H;
        const blocked = (x, y) => {
            if (!B.ok(x, y)) return true;
            if (isCat && doorZone(x, y)) return true;
            if (hero.has(x + "," + y)) return true;
            if (isCat && gpa && gpa.x === x && gpa.y === y) return true;
            return false;
        };
        const goal = new Set(goals.map(([x, y]) => x + "," + y));
        const hdist = (x, y) => Math.min(...goals.map(([gx, gy]) => { const dx = Math.abs(gx - x), dy = Math.abs(gy - y); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); }));
        const cells = G.astar8({ w: W, h: H, sx, sy, cap: 2000, open: (x, y) => !blocked(x, y), goal: (x, y) => goal.has(x + "," + y), est: hdist,
            cost: (x, y, nx, ny, slant) => (slant ? 1.414 : 1) + (!isCat && doorZone(nx, ny) ? 6 : 0) + (!isCat && kit && kit.x === nx && kit.y === ny ? 3 : 0) });
        return cells && cells.slice(1).map(c => [c % W, Math.floor(c / W)]);
    }
    for (let k = 0; k < TRIALS; k++) {
        const B = board(), [sx, sy] = B.cell(), goals = [];
        for (let g = ri(1, 4); g > 0; g--) goals.push(rnd() < 0.08 ? [sx, sy] : B.cell());
        const [dx0, dy0] = B.cell(), doorZone = (x, y) => Math.abs(x - dx0) <= 1 && y >= dy0 - 2 && y <= dy0;
        const isCat = rnd() < 0.4, kitC = rnd() < 0.7 ? { x: ri(0, B.W - 1), y: ri(0, B.H - 1) } : null, gpa = { x: ri(0, B.W - 1), y: ri(0, B.H - 1) };
        const hero = new Set(rnd() < 0.5 ? [ri(0, B.W - 1) + "," + ri(0, B.H - 1)] : []);
        same("home", oldHome(B, sx, sy, goals, isCat, doorZone, kitC, hero, gpa), newHome(B, sx, sy, goals, isCat, doorZone, kitC, hero, gpa), [k, sx, sy, goals]);
    }

    // ---- 2. TavernShift_Hall path (tiles instead of the stand points)
    function oldHall(RC, s, g, walk) {
        const key = (x, y) => y * RC + x;
        const open = [{ x: s.tx, y: s.ty, g: 0, f: 0 }], from = {}, cost = { [key(s.tx, s.ty)]: 0 };
        const done = new Set();
        while (open.length) {
            let bi = 0;
            for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
            const n = open.splice(bi, 1)[0], nk = key(n.x, n.y);
            if (done.has(nk)) continue;
            done.add(nk);
            if (n.x === g.tx && n.y === g.ty) {
                const pts = [];
                let k = nk;
                while (k !== undefined) { const x = k % RC, y = Math.floor(k / RC); pts.unshift([x, y]); k = from[k]; }
                return pts;
            }
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    const x = n.x + dx, y = n.y + dy;
                    if (!walk(x, y)) continue;
                    if (dx && dy && (!walk(n.x + dx, n.y) || !walk(n.x, n.y + dy))) continue;
                    const c = n.g + (dx && dy ? 1.414 : 1), k = key(x, y);
                    if (cost[k] !== undefined && cost[k] <= c) continue;
                    cost[k] = c;
                    from[k] = nk;
                    open.push({ x, y, g: c, f: c + Math.hypot(g.tx - x, g.ty - y) });
                }
            }
        }
        return null;
    }
    const newHall = (RC, RR, s, g, walk) => {
        const cells = G.astar8({ w: RC, h: RR, sx: s.tx, sy: s.ty, own: true, open: walk, goal: (x, y) => x === g.tx && y === g.ty, est: (x, y) => Math.hypot(g.tx - x, g.ty - y) });
        return cells && cells.map(c => [c % RC, Math.floor(c / RC)]);
    };
    for (let k = 0; k < TRIALS; k++) {
        const B = board(), [sx, sy] = B.cell(), [gx, gy] = rnd() < 0.05 ? [sx, sy] : B.cell(), seat = rnd() < 0.5 ? { tx: gx, ty: gy } : null;
        const walk = (x, y) => (seat && seat.tx === x && seat.ty === y) || B.ok(x, y);   // (as guestWalkable: the seat always)
        same("hall", oldHall(B.W, { tx: sx, ty: sy }, { tx: gx, ty: gy }, walk), newHall(B.W, B.H, { tx: sx, ty: sy }, { tx: gx, ty: gy }, walk), [k, sx, sy, gx, gy]);
    }

    // ---- 3. TavernLife pathTo ($gameMap: isValid -> bounds, isPassable -> the sides, events -> blocked cells)
    const DIRS = [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]];
    function oldTL(B, x0, y0, tx, ty, maxLen, ev) {
        const isValid = (x, y) => x >= 0 && y >= 0 && x < B.W && y < B.H, isPassable = (x, y, d) => isValid(x, y) && B.side[y * B.W + x][d];
        const blockedByEvent = (x, y) => ev.has(x + "," + y);
        const key = (x, y) => x + "," + y, prev = new Map([[key(x0, y0), null]]);
        const goal = (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1;
        if (goal(x0, y0)) return [];
        let front = [[x0, y0]], found = null;
        for (let depth = 0; depth < (maxLen || 30) && front.length && !found; depth++) {
            const next = [];
            for (const [x, y] of front) {
                for (const [dx, dy, d] of DIRS) {
                    const nx = x + dx, ny = y + dy, k = key(nx, ny);
                    if (prev.has(k) || !isValid(nx, ny) || !isPassable(x, y, d) || !isPassable(nx, ny, 10 - d) || blockedByEvent(nx, ny)) continue;
                    prev.set(k, { x, y, d, nx, ny });
                    if (goal(nx, ny)) { found = k; break; }
                    next.push([nx, ny]);
                }
                if (found) break;
            }
            front = next;
        }
        if (!found) return null;
        const out = [];
        for (let k = found; prev.get(k); ) { const p = prev.get(k); out.unshift({ x: p.nx, y: p.ny, d: p.d }); k = key(p.x, p.y); }
        return out;
    }
    function newTL(B, x0, y0, tx, ty, maxLen, ev) {
        const isPassable = (x, y, d) => B.side[y * B.W + x][d], blockedByEvent = (x, y) => ev.has(x + "," + y), w = B.W;
        const goal = (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1;
        if (goal(x0, y0)) return [];
        const r = G.bfs({ w, h: B.H, sx: x0, sy: y0, dirs: DIRS, atFind: true, depth: maxLen || 30, goal,
            can: (x, y, nx, ny, d) => isPassable(x, y, d) && isPassable(nx, ny, 10 - d) && !blockedByEvent(nx, ny) });
        return r && r.cells.slice(1).map((c, k) => ({ x: c % w, y: Math.floor(c / w), d: r.dirs[k] }));
    }
    for (let k = 0; k < TRIALS; k++) {
        const B = board(), [sx, sy] = B.cell(), [tx, ty] = B.cell(), maxLen = rnd() < 0.3 ? undefined : ri(2, 40), ev = new Set();
        for (let e = ri(0, 8); e > 0; e--) ev.add(ri(0, B.W - 1) + "," + ri(0, B.H - 1));
        same("tl", oldTL(B, sx, sy, tx, ty, maxLen, ev), newTL(B, sx, sy, tx, ty, maxLen, ev), [k, sx, sy, tx, ty, maxLen]);
    }

    // ---- 4. Underground pathTo
    function oldUG(B, sx, sy, tx, ty) {
        const isValid = (x, y) => x >= 0 && y >= 0 && x < B.W && y < B.H, isPassable = (x, y, d) => isValid(x, y) && B.side[y * B.W + x][d];
        if (sx === tx && sy === ty) return [];
        const key = (x, y) => x + "," + y, prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
        const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
        while (q.length && prev.size < 2500) {
            const [x, y] = q.shift();
            for (const [d, dx, dy] of DIRS) {
                const nx = x + dx, ny = y + dy, k = key(nx, ny);
                if (prev.has(k) || !isValid(nx, ny)) continue;
                if (!(nx === tx && ny === ty) && !isPassable(x, y, d)) continue;
                prev.set(k, [x, y, d]);
                if (nx === tx && ny === ty) {
                    const out = [];
                    for (let c = prev.get(k); c; c = prev.get(key(c[0], c[1]))) out.unshift(c[2]);
                    return out;
                }
                q.push([nx, ny]);
            }
        }
        const out = [];
        for (let i = 0; i < Math.abs(tx - sx); i++) out.push(tx > sx ? 6 : 4);
        for (let i = 0; i < Math.abs(ty - sy); i++) out.push(ty > sy ? 2 : 8);
        return out;
    }
    function newUG(B, sx, sy, tx, ty) {
        const isPassable = (x, y, d) => B.side[y * B.W + x][d];
        if (sx === tx && sy === ty) return [];
        const r = G.bfs({ w: B.W, h: B.H, sx, sy, dirs: [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]], atFind: true, seen: 2500,
            goal: (x, y) => x === tx && y === ty, can: (x, y, nx, ny, d) => (nx === tx && ny === ty) || isPassable(x, y, d) });
        if (r) return r.dirs;
        const out = [];
        for (let i = 0; i < Math.abs(tx - sx); i++) out.push(tx > sx ? 6 : 4);
        for (let i = 0; i < Math.abs(ty - sy); i++) out.push(ty > sy ? 2 : 8);
        return out;
    }
    for (let k = 0; k < TRIALS; k++) {
        const B = board(), [sx, sy] = B.cell(), [tx, ty] = rnd() < 0.05 ? [sx, sy] : B.cell();
        same("ug", oldUG(B, sx, sy, tx, ty), newUG(B, sx, sy, tx, ty), [k, sx, sy, tx, ty]);
    }
    {   // (a big one: the 2500 cells' cap reached)
        const W = 80, H = 60, B = { W, H, side: Array.from({ length: W * H }, () => ({ 2: true, 4: true, 6: true, 8: true })) };
        same("ug", oldUG(B, 1, 1, 78, 58), newUG(B, 1, 1, 78, 58), ["cap"]);
    }

    // ---- 5. TavernLife_Plan planBfs (clamp of the start as in the plugin)
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function oldPlan(W0, H0, walk, from, goal) {
        const idx = (x, y) => y * W0 + x, prev = new Int32Array(W0 * H0).fill(-1);
        const sx = clamp(Math.floor(from[0]), 0, W0 - 1), sy = clamp(Math.floor(from[1]), 0, H0 - 1), start = idx(sx, sy);
        const q = [start];
        prev[start] = start;
        for (let h = 0; h < q.length; h++) {
            const c = q[h], x = c % W0, y = (c - x) / W0;
            if (goal(x, y)) {
                const path = [];
                for (let k = c; ; k = prev[k]) { path.push([k % W0, Math.floor(k / W0)]); if (k === start) break; }
                return path.reverse();
            }
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W0 || ny >= H0) continue;
                const n = idx(nx, ny);
                if (prev[n] >= 0 || !walk[n]) continue;
                prev[n] = c;
                q.push(n);
            }
        }
        return null;
    }
    function newPlan(W0, H0, walk, from, goal) {
        const sx = clamp(Math.floor(from[0]), 0, W0 - 1), sy = clamp(Math.floor(from[1]), 0, H0 - 1);
        const r = G.bfs({ w: W0, h: H0, sx, sy, dirs: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]], goal, can: (x, y, nx, ny) => !!walk[ny * W0 + nx] });
        return r && r.cells.map(c => [c % W0, Math.floor(c / W0)]);
    }
    for (let k = 0; k < TRIALS; k++) {
        const B = board(), walk = B.open.map(v => (v ? 1 : 0)), from = [rnd() * (B.W + 4) - 2, rnd() * (B.H + 4) - 2];
        const x0 = ri(0, B.W - 1), y0 = ri(0, B.H - 1), x1 = x0 + ri(0, 3), y1 = y0 + ri(0, 2), goal = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
        same("plan", oldPlan(B.W, B.H, walk, from, goal), newPlan(B.W, B.H, walk, from, goal), [k, from, x0, y0, x1, y1]);
    }

    // ---- the time: grandpa's search with no way out (the 2000 steps), old against new, interleaved
    {
        const W = 60, H = 40, open = Array.from({ length: W * H }, (v, i) => !(i % W === 45)), B = { W, H, ok: (x, y) => x >= 0 && y >= 0 && x < W && y < H && open[y * W + x] };
        const args = [B, 2, 2, [[55, 30]], false, () => false, null, new Set(), null];
        let tOld = 0, tNew = 0;
        for (let r = 0; r < 6; r++) {
            let t0 = performance.now(); oldHome(...args); tOld += performance.now() - t0;
            t0 = performance.now(); newHome(...args); tNew += performance.now() - t0;
        }
        res.time = { old: +(tOld / 6).toFixed(2), new: +(tNew / 6).toFixed(2) };
    }
    return JSON.stringify(res);
};

kit.test({ port: Number(process.env.CDP_PORT) || 9506, lightGpu: true, bootCheck: "gra", evalTimeout: 300000 }, async t => {
    const r = JSON.parse(await t.eval("(" + PAGE.toString() + ")(2500)"));
    for (const k of ["home", "hall", "tl", "ug", "plan"]) {
        const bad = r.bad.filter(b => b.startsWith(k + " "));
        t.check(`${k}: ${r[k]} losowych dróg (znalezionych ${r.found[k]}) - stara kopia i Tawerna.grid dają to samo`, r.miss[k] === 0, r.miss[k] + " różnych: " + bad.join("\n"));
    }
    t.check(`czas A* dziadka bez wyjścia: stary ${r.time.old} ms, nowy ${r.time.new} ms`, r.time.new <= r.time.old, JSON.stringify(r.time));
});
