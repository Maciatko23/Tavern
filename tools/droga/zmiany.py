# -*- coding: utf-8 -*-
"""Refaktor 2026-11-07, krok „jedno wspólne szukanie drogi” (gracz: „ok”): pięć wtyczek miało własną kopię szukania drogi po
kratkach - teraz jedna w TawernaCore (Tawerna.grid: astar8 i bfs), a każda wtyczka zostawia u siebie tylko swoje zasady (co jest
przejściem, co kosztuje więcej, gdzie cel). Drogi te same co do kratki (ta sama kolejność sąsiadów, te same remisy) - sprawdza
tests/droga_test.js (stare kopie słowo w słowo przeciw nowej na losowych planszach).
  - HomeLife.js findPath          dziadek i kot (A* 8 kierunków, drzwi +6, kot +3, do 2000 kroków)
  - TavernShift_Hall.js path      sala zmiany (A* 8 kierunków)
  - TavernLife.js pathTo          bohater sam do stołu / balii (BFS 4 kierunki, bez postaci, do 30 kroków)
  - Underground.js pathTo         postacie scen podziemi (BFS 4 kierunki, przez postacie, do 2500 kratek)
  - TavernLife_Plan.js planBfs    droga na planie karczmy (BFS 4 kierunki)
Ścieżka dla zwierząt, psa, ludzi, potworów (Hunting_Path.js path8) zostaje, jak jest - ma swoją siatkę mapy.
  python tools/droga/zmiany.py              (kopie do tools/droga/staging/js/plugins)
  python tools/droga/zmiany.py --wykonaj    (do js/plugins; kopie: tools/droga/kopie_zapasowe/<czas>)"""
import datetime, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging", "js", "plugins")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

CORE_AFTER = """    T.util = { num, flag, clamp01, warnOnce, clamp, pick, rand, lerp, smooth, easeOut, dist, distXY, hash, hash01 };
"""
CORE_NEW = CORE_AFTER + """
    // ------------------------------------------------------------------
    // Searching a way over a grid of cells (2026-11-07, "jedno wspólne szukanie drogi"): the plugins that walk by rules of their own -
    // grandpa and the cat (HomeLife), the hall of the shift (TavernShift_Hall), the hero to a table (TavernLife), the cast of the
    // underground's scenes (Underground), the way on the tavern's plan (TavernLife_Plan) - keep only their rules; the search is here.
    // (The animals, the dog, the people of the town and the creatures go by Hunting_Path.js's path8: its own grid of the map.)
    // Both give exactly the ways those plugins' own copies gave: the same order of the neighbours, the same ties.
    // ------------------------------------------------------------------
    T.grid = (() => {
        let seen = new Int32Array(0), closed = new Int32Array(0), from = new Int32Array(0), cost = new Float64Array(0), via = new Int8Array(0), stamp = 0;
        function room(n) {   // (the buffers, kept from one search to the next: a stamp tells this search's marks from the old ones)
            if (seen.length < n) { seen = new Int32Array(n); closed = new Int32Array(n); from = new Int32Array(n); cost = new Float64Array(n); via = new Int8Array(n); stamp = 0; }
            if (++stamp > 2e9) { seen.fill(0); closed.fill(0); stamp = 1; }
        }
        function trail(end, start) {   // (the cells from the start to the end)
            const out = [];
            for (let i = end; i !== start; i = from[i]) out.push(i);
            out.push(start);
            return out.reverse();
        }
        // A* in 8 ways, no cutting a corner (a slant only where both straight cells beside it are open). o: w, h, sx, sy (the start,
        // inside), open(x, y) (a cell one may step on; asked only inside), cost(x, y, nx, ny, slant) (a step's cost; default 1 and
        // 1.414), goal(x, y), est(x, y) (the estimate of the way left), cap (cells taken from the list at most, the ones taken again counted too).
        // own: a cell's steps count from the cost it was put on the list with (the hall's old way), not from the least one known (a
        // cost a hair lower - the same steps added in another order - with the same estimate then leaves the first one taken first).
        // The list gives the least estimate first, of equal ones the one put on it first. The neighbours: the row above, its own, the
        // row below, each from the left. Returns the cells (y * w + x) from the start to the goal, or null.
        function astar8(o) {
            const w = o.w, open = o.open, goal = o.goal, est = o.est, cap = o.cap || Infinity;
            const step = o.cost || ((x, y, nx, ny, slant) => (slant ? 1.414 : 1));
            const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < o.h;
            room(w * o.h);
            const HI = [], HF = [], HS = [], HG = [], own = !!o.own;
            let hn = 0, order = 0, popG = 0;
            const before = (fa, sa, fb, sb) => fa < fb || (fa === fb && sa < sb);
            const push = (i, f, g) => {
                let k = hn++;
                const s = order++;
                while (k > 0) {
                    const p = (k - 1) >> 1;
                    if (!before(f, s, HF[p], HS[p])) break;
                    HI[k] = HI[p]; HF[k] = HF[p]; HS[k] = HS[p]; HG[k] = HG[p]; k = p;
                }
                HI[k] = i; HF[k] = f; HS[k] = s; HG[k] = g;
            };
            const pop = () => {
                const top = HI[0], n = --hn, li = HI[n], lf = HF[n], ls = HS[n], lg = HG[n];
                popG = HG[0];
                let k = 0;
                for (;;) {
                    let c = 2 * k + 1;
                    if (c >= n) break;
                    if (c + 1 < n && before(HF[c + 1], HS[c + 1], HF[c], HS[c])) c++;
                    if (!before(HF[c], HS[c], lf, ls)) break;
                    HI[k] = HI[c]; HF[k] = HF[c]; HS[k] = HS[c]; HG[k] = HG[c]; k = c;
                }
                HI[k] = li; HF[k] = lf; HS[k] = ls; HG[k] = lg;
                return top;
            };
            const start = o.sy * w + o.sx;
            seen[start] = stamp; cost[start] = 0; from[start] = -1;
            push(start, est(o.sx, o.sy), 0);
            let count = 0;
            while (hn > 0 && count++ < cap) {
                const i = pop();
                if (closed[i] === stamp) continue;
                closed[i] = stamp;
                const x = i % w, y = (i - x) / w, gi = own ? popG : cost[i];
                if (goal(x, y)) return trail(i, start);
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    const nx = x + dx, ny = y + dy;
                    if (!inside(nx, ny) || !open(nx, ny)) continue;
                    if (dx && dy && (!inside(x + dx, y) || !open(x + dx, y) || !inside(x, y + dy) || !open(x, y + dy))) continue;
                    const j = ny * w + nx, g = gi + step(x, y, nx, ny, !!(dx && dy));
                    if (seen[j] === stamp && !(g < cost[j])) continue;
                    seen[j] = stamp; cost[j] = g; from[j] = i;
                    push(j, g + est(nx, ny), g);
                }
            }
            return null;
        }
        // Breadth first in the given ways (o.dirs: [dx, dy, d] in the order tried). o: w, h, sx, sy (the start, inside),
        // can(x, y, nx, ny, d) (the step goes; asked only inside, not for a cell already reached), goal(x, y), atFind (the goal looked
        // for when a cell is first reached - not at the start; else when it is taken from the queue, the start too), depth (the steps
        // of a way at most), seen (the cells reached at most: none taken from the queue once that many). Returns { cells: from the
        // start to the goal, dirs: the d of each step } or null.
        function bfs(o) {
            const w = o.w, h = o.h, can = o.can, goal = o.goal, dirs = o.dirs, atFind = !!o.atFind;
            const maxD = o.depth === undefined ? Infinity : o.depth, maxSeen = o.seen || Infinity;
            room(w * h);
            const start = o.sy * w + o.sx, q = [start];
            const way = end => { const cells = trail(end, start); return { cells, dirs: cells.slice(1).map(c => via[c]) }; };
            seen[start] = stamp; from[start] = -1; cost[start] = 0;
            let reached = 1;
            for (let qh = 0; qh < q.length && reached < maxSeen; qh++) {
                const i = q[qh], x = i % w, y = (i - x) / w;
                if (!atFind && goal(x, y)) return way(i);
                if (cost[i] >= maxD) continue;
                for (const [dx, dy, d] of dirs) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const j = ny * w + nx;
                    if (seen[j] === stamp || !can(x, y, nx, ny, d)) continue;
                    seen[j] = stamp; from[j] = i; via[j] = d; cost[j] = cost[i] + 1; reached++;
                    if (atFind && goal(nx, ny)) return way(j);
                    q.push(j);
                }
            }
            return null;
        }
        return { astar8, bfs };
    })();
"""

EDITS = {
    "TawernaCore.js": [(CORE_AFTER, CORE_NEW)],
    "HomeLife.js": [("""        const goal = new Set(goals.map(([x, y]) => x + "," + y));
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
                const cost = (dx && dy ? 1.414 : 1) + (!isCat && L.doorZone(nx, ny) ? 6 : 0) + (!isCat && kit && kit.x === nx && kit.y === ny ? 3 : 0);   // (round the cat when he can)
                const ng = gs.get(k) + cost, nk = key(nx, ny);
                if (ng < (gs.has(nk) ? gs.get(nk) : Infinity)) { gs.set(nk, ng); from.set(nk, k); open.push([ng + hdist(nx, ny), nx, ny]); }
            }
        }
        return null;
    }""", """        const goal = new Set(goals.map(([x, y]) => x + "," + y));
        const hdist = (x, y) => Math.min(...goals.map(([gx, gy]) => { const dx = Math.abs(gx - x), dy = Math.abs(gy - y); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); }));
        // (the search: Tawerna.grid.astar8 - 2026-11-07, one for all; here only his rules)
        const cells = T.grid.astar8({ w: W, h: H, sx, sy, cap: 2000, open: (x, y) => !blocked(x, y), goal: (x, y) => goal.has(x + "," + y), est: hdist,
            cost: (x, y, nx, ny, slant) => (slant ? 1.414 : 1) + (!isCat && L.doorZone(nx, ny) ? 6 : 0) + (!isCat && kit && kit.x === nx && kit.y === ny ? 3 : 0) });   // (round the cat when he can)
        return cells && cells.slice(1).map(c => [c % W, Math.floor(c / W)]);
    }""")],
    "TavernShift_Hall.js": [("""            const s = this.tileOf(fx, fy), g = this.tileOf(gx, gy);
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
                    while (k !== undefined) { const x = k % RC, y = Math.floor(k / RC); pts.unshift(standPt(x, y)); k = from[k]; }
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
        }""", """            const s = this.tileOf(fx, fy), g = this.tileOf(gx, gy);
            // (the search: Tawerna.grid.astar8 - 2026-11-07, one for all; the start is always a cell of the room)
            const cells = window.Tawerna.grid.astar8({ w: RC, h: RR, sx: s.tx, sy: s.ty, own: true, open: walk, goal: (x, y) => x === g.tx && y === g.ty, est: (x, y) => Math.hypot(g.tx - x, g.ty - y) });
            return cells && cells.map(c => standPt(c % RC, Math.floor(c / RC)));
        }""")],
    "TavernLife.js": [("""    function pathTo(tx, ty, maxLen) {
        const x0 = $gamePlayer.x, y0 = $gamePlayer.y, key = (x, y) => x + "," + y, prev = new Map([[key(x0, y0), null]]);
        const goal = (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1;
        if (goal(x0, y0)) return [];
        let front = [[x0, y0]], found = null;
        for (let depth = 0; depth < (maxLen || 30) && front.length && !found; depth++) {
            const next = [];
            for (const [x, y] of front) {
                for (const [dx, dy, d] of DIRS) {
                    const nx = x + dx, ny = y + dy, k = key(nx, ny);
                    if (prev.has(k) || !$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blockedByEvent(nx, ny)) continue;
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
    }""", """    function pathTo(tx, ty, maxLen) {
        const x0 = $gamePlayer.x, y0 = $gamePlayer.y, w = $gameMap.width();
        const goal = (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1;
        if (goal(x0, y0)) return [];
        // (the search: Tawerna.grid.bfs - 2026-11-07, one for all; here only his rules)
        const r = T.grid.bfs({ w, h: $gameMap.height(), sx: x0, sy: y0, dirs: DIRS, atFind: true, depth: maxLen || 30, goal,
            can: (x, y, nx, ny, d) => $gameMap.isPassable(x, y, d) && $gameMap.isPassable(nx, ny, 10 - d) && !blockedByEvent(nx, ny) });
        return r && r.cells.slice(1).map((c, k) => ({ x: c % w, y: Math.floor(c / w), d: r.dirs[k] }));
    }""")],
    "Underground.js": [("""        if (sx === tx && sy === ty) return [];
        const key = (x, y) => x + "," + y, prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
        const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
        while (q.length && prev.size < 2500) {
            const [x, y] = q.shift();
            for (const [d, dx, dy] of DIRS) {
                const nx = x + dx, ny = y + dy, k = key(nx, ny);
                if (prev.has(k) || !$gameMap.isValid(nx, ny)) continue;
                if (!(nx === tx && ny === ty) && !$gameMap.isPassable(x, y, d)) continue;
                prev.set(k, [x, y, d]);
                if (nx === tx && ny === ty) {
                    const out = [];
                    for (let c = prev.get(k); c; c = prev.get(key(c[0], c[1]))) out.unshift(c[2]);
                    return out;
                }
                q.push([nx, ny]);
            }
        }""", """        if (sx === tx && sy === ty) return [];
        // (the search: Tawerna.grid.bfs - 2026-11-07, one for all; the goal's own cell needs no passage)
        const r = T.grid.bfs({ w: $gameMap.width(), h: $gameMap.height(), sx, sy, dirs: [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]], atFind: true, seen: 2500,
            goal: (x, y) => x === tx && y === ty, can: (x, y, nx, ny, d) => (nx === tx && ny === ty) || $gameMap.isPassable(x, y, d) });
        if (r) return r.dirs;""")],
    "TavernLife_Plan.js": [("""        const f = PLAN_DATA.floors[fi], W0 = f.w, H0 = f.h, walk = planWalk(fi);
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
    }""", """        const f = PLAN_DATA.floors[fi], W0 = f.w, H0 = f.h, walk = planWalk(fi);
        const sx = clamp(Math.floor(from[0]), 0, W0 - 1), sy = clamp(Math.floor(from[1]), 0, H0 - 1);
        // (the search: Tawerna.grid.bfs - 2026-11-07, one for all)
        const r = T.grid.bfs({ w: W0, h: H0, sx, sy, dirs: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]], goal, can: (x, y, nx, ny) => !!walk[ny * W0 + nx] });
        return r && r.cells.map(c => [c % W0, Math.floor(c / W0)]);
    }""")],
}

if "T.grid = " in open(os.path.join(PLUG, "TawernaCore.js"), "rb").read().decode("utf-8"):
    raise SystemExit("już zrobione: TawernaCore.js ma Tawerna.grid (zainstalowane 2026-11-07, kopie: tools/droga/kopie_zapasowe)")
out_dir = PLUG if "--wykonaj" in sys.argv else STG
os.makedirs(out_dir, exist_ok=True)
kop = None
if out_dir == PLUG:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
for name, pairs in EDITS.items():
    p = os.path.join(PLUG, name)
    raw = open(p, "rb").read()
    if b"\r\n" in raw: raise SystemExit(name + ": CRLF")
    s = raw.decode("utf-8")
    before = s.count("\n")
    for old, new in pairs:
        if s.count(old) != 1: raise SystemExit("%s: fragment nie znaleziony dokładnie raz (%d)" % (name, s.count(old)))
        s = s.replace(old, new)
    if kop: shutil.copy(p, kop)
    open(os.path.join(out_dir, name), "wb").write(s.encode("utf-8"))
    print("  %-22s %5d -> %5d linii" % (name, before, s.count("\n")))
print("zapisane w", out_dir, ("(kopie: %s)" % kop) if kop else "")
