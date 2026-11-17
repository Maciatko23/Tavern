//=============================================================================
// Underground_Gen.js
//=============================================================================
// Part of Underground.js (refactor 2026-11-07: a big file split - these lines moved here word for word, nothing changed). It gives
// Underground.js its names through Tawerna.api("Underground_parts").gen; it must stand above Underground_Data.js and Underground.js on the plugin list.

/*:
 * @target MZ
 * @plugindesc Generator pięter podziemi (część Underground.js): liczby losowe z ziarna zapisu, biblioteki kawałków pokoi, składanie piętra, labirynt, kontrola mapy - czyste funkcje, bez gry. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderBefore Underground
 *
 * @help
 * Underground_Gen.js - generator pięter podziemi: czyste funkcje (ziarno, kawałki pokoi, labirynt, kontrola)
 * Sama nic nie robi bez Underground.js; musi stać nad Underground_Data.js i Underground.js na liście wtyczek.
 */

(() => {
    "use strict";
    const TK = Watki.teksty("podziemia");   // (the words of this file: js/teksty/podziemia.txt, kod.*)

    const PLUGIN = "Underground";
    const T = window.Tawerna;
    if (!T) throw new Error("Underground.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const D = () => window.Underground_Data;
    // a change of the generator that moves things: old saves' floors are made again (see the "load" handler) - 2: the maze (2026-10-23)
    const GEN_VERSION = 2;

    // ======================================================================================================================
    // Small pure helpers: the random numbers (the save's seed -> the same floor every time), the editor's autotile shapes
    // ======================================================================================================================
    function hash() {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < arguments.length; i++) {
            const s = String(arguments[i]);
            for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619) >>> 0; }
            h ^= 0x9e; h = Math.imul(h, 16777619) >>> 0;
        }
        h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13;
        return h >>> 0;
    }
    function rng(seed) {   // mulberry32
        let a = seed >>> 0;
        const f = () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
        f.pick = list => list[Math.floor(f() * list.length)];
        f.chance = p => f() < p;
        f.shuffle = list => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
        f.weighted = (list, w) => {
            let sum = 0;
            for (const o of list) sum += Math.max(0, w(o));
            let x = f() * sum;
            for (const o of list) { x -= Math.max(0, w(o)); if (x < 0) return o; }
            return list[list.length - 1];
        };
        return f;
    }

    // Tilemap.FLOOR_AUTOTILE_TABLE (rmmz_core.js) - the quarter pieces of each of the 48 shapes; here to find a shape by its pieces
    const FLOOR_TABLE = [
        [[2,4],[1,4],[2,3],[1,3]],[[2,0],[1,4],[2,3],[1,3]],[[2,4],[3,0],[2,3],[1,3]],[[2,0],[3,0],[2,3],[1,3]],
        [[2,4],[1,4],[2,3],[3,1]],[[2,0],[1,4],[2,3],[3,1]],[[2,4],[3,0],[2,3],[3,1]],[[2,0],[3,0],[2,3],[3,1]],
        [[2,4],[1,4],[2,1],[1,3]],[[2,0],[1,4],[2,1],[1,3]],[[2,4],[3,0],[2,1],[1,3]],[[2,0],[3,0],[2,1],[1,3]],
        [[2,4],[1,4],[2,1],[3,1]],[[2,0],[1,4],[2,1],[3,1]],[[2,4],[3,0],[2,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],
        [[0,4],[1,4],[0,3],[1,3]],[[0,4],[3,0],[0,3],[1,3]],[[0,4],[1,4],[0,3],[3,1]],[[0,4],[3,0],[0,3],[3,1]],
        [[2,2],[1,2],[2,3],[1,3]],[[2,2],[1,2],[2,3],[3,1]],[[2,2],[1,2],[2,1],[1,3]],[[2,2],[1,2],[2,1],[3,1]],
        [[2,4],[3,4],[2,3],[3,3]],[[2,4],[3,4],[2,1],[3,3]],[[2,0],[3,4],[2,3],[3,3]],[[2,0],[3,4],[2,1],[3,3]],
        [[2,4],[1,4],[2,5],[1,5]],[[2,0],[1,4],[2,5],[1,5]],[[2,4],[3,0],[2,5],[1,5]],[[2,0],[3,0],[2,5],[1,5]],
        [[0,4],[3,4],[0,3],[3,3]],[[2,2],[1,2],[2,5],[1,5]],[[0,2],[1,2],[0,3],[1,3]],[[0,2],[1,2],[0,3],[3,1]],
        [[2,2],[3,2],[2,3],[3,3]],[[2,2],[3,2],[2,1],[3,3]],[[2,4],[3,4],[2,5],[3,5]],[[2,0],[3,4],[2,5],[3,5]],
        [[0,4],[1,4],[0,5],[1,5]],[[0,4],[3,0],[0,5],[1,5]],[[0,2],[3,2],[0,3],[3,3]],[[0,2],[1,2],[0,5],[1,5]],
        [[0,4],[3,4],[0,5],[3,5]],[[2,2],[3,2],[2,5],[3,5]],[[0,2],[3,2],[0,5],[3,5]],[[0,0],[1,0],[2,0],[3,0]]];
    const SHAPE_OF = new Map(FLOOR_TABLE.map((q, i) => [q.map(p => p.join(",")).join("|"), i]));
    // the editor's shape of a floor-type autotile from its eight neighbours (same(dx, dy): the same kind there)
    function floorShape(same) {
        const n = same(0, -1), s = same(0, 1), w = same(-1, 0), e = same(1, 0);
        const nw = same(-1, -1), ne = same(1, -1), sw = same(-1, 1), se = same(1, 1);
        const tl = n && w && nw ? "2,4" : n && w ? "2,0" : w ? "2,2" : n ? "0,4" : "0,2";
        const tr = n && e && ne ? "1,4" : n && e ? "3,0" : e ? "1,2" : n ? "3,4" : "3,2";
        const bl = s && w && sw ? "2,3" : s && w ? "2,1" : w ? "2,5" : s ? "0,3" : "0,5";
        const br = s && e && se ? "1,3" : s && e ? "3,1" : e ? "1,5" : s ? "3,3" : "3,5";
        const k = SHAPE_OF.get([tl, tr, bl, br].join("|"));
        return k === undefined ? 0 : k;
    }
    // A3 walls and A4 wall sides: bit 1 = an edge on the left, 2 = on top, 4 = on the right, 8 = at the bottom
    function wallShape(same) {
        return (same(-1, 0) ? 0 : 1) | (same(0, -1) ? 0 : 2) | (same(1, 0) ? 0 : 4) | (same(0, 1) ? 0 : 8);
    }
    const kindOf = id => (id >= 2048 ? ((id - 2048) / 48) | 0 : -1);
    const isA4Top = k => k >= 80 && ((k - 80) >> 3) % 2 === 0;
    const isA4Side = k => k >= 80 && ((k - 80) >> 3) % 2 === 1;
    const isWallKind = k => (k >= 48 && k < 80) || isA4Side(k);
    const isWaterKind = k => k >= 0 && k < 16 && k !== 2 && k !== 3;   // A1 water (kinds 2, 3 are its rocks)
    const isFallKind = k => k >= 5 && k < 16 && k % 2 === 1;            // A1 waterfalls (their 4 shapes: an edge left / right)
    const autoId = (kind, shape) => 2048 + kind * 48 + (shape || 0);

    // ======================================================================================================================
    // The chunk libraries: a map drawn in the editor per band (Map130 for band 1, Map141-144 for bands 2-5). Each chunk: an event
    // "Kawałek: <name>" at its top-left cell with <Kawalek:w=14,h=11[,waga=3][,pietra=1-9]>; everything in the rectangle (all
    // layers, the events) is the chunk.
    // ======================================================================================================================
    const TAG_RE = /<([^<>:\s]+)(?::([^>]*))?>/g;
    function tagsOf(note) {
        const out = {};
        let m;
        TAG_RE.lastIndex = 0;
        while ((m = TAG_RE.exec(note || ""))) out[m[1]] = m[2] === undefined ? true : m[2];
        return out;
    }
    function kvOf(text) {
        const out = {};
        for (const part of String(text || "").split(",")) {
            const [k, v] = part.split("=");
            if (k && v !== undefined) out[k.trim()] = v.trim();
        }
        return out;
    }
    function parseLibrary(map) {
        const W = map.width, H = map.height, chunks = [];
        const events = (map.events || []).filter(Boolean);
        for (const e of events) {
            const tg = tagsOf(e.note);
            if (tg.Kawalek === undefined) continue;
            const kv = kvOf(tg.Kawalek);
            const w = Number(kv.w), h = Number(kv.h);
            if (!(w > 2 && h > 2)) continue;
            const range = String(kv.pietra || "1-999").split("-").map(Number);
            const c = { name: String(e.name || "").replace(/^Kawałek:\s*/, ""), x: e.x, y: e.y, w, h, weight: Number(kv.waga) || 1,
                floors: [range[0] || 1, range[1] || range[0] || 999], tiles: [], events: [], doors: { N: [], S: [], E: [], W: [] }, stairs: [], water: 0 };
            for (let z = 0; z < 6; z++) {
                for (let dy = 0; dy < h; dy++) {
                    for (let dx = 0; dx < w; dx++) {
                        const x = e.x + dx, y = e.y + dy;
                        const id = x < W && y < H ? map.data[(z * H + y) * W + x] || 0 : 0;
                        c.tiles.push(id);
                        if (z < 2 && isWaterKind(kindOf(id))) c.water++;
                    }
                }
            }
            for (const o of events) {
                if (o === e || o.x < e.x || o.y < e.y || o.x >= e.x + w || o.y >= e.y + h) continue;
                const t = tagsOf(o.note), dx = o.x - e.x, dy = o.y - e.y;
                if (t.Kawalek !== undefined) continue;
                if (t.Drzwi) { const side = String(t.Drzwi).trim().toUpperCase(); if (c.doors[side]) c.doors[side].push([dx, dy]); continue; }
                if (t.Schody) { c.stairs.push([dx, dy]); continue; }
                c.events.push({ dx, dy, tags: t, data: o });
            }
            chunks.push(c);
        }
        return chunks;
    }
    // a signature of a library (its chunks' rectangles, tiles and events): a saved floor made from another one is made again
    function librarySig(chunks) {
        return hash(GEN_VERSION, chunks.map(c => [c.name, c.w, c.h, c.weight, c.floors.join("-"), hash(c.tiles.join(",")),
            c.events.length, c.doors.N.length + c.doors.S.length + c.doors.E.length + c.doors.W.length, c.stairs.length].join(":")).join(";"));
    }

    // ======================================================================================================================
    // The generator: one floor from the band's chunks and the save's seed. Pure: gives a map object like $dataMap
    // (width, height, data, events, note, displayName...) and the floor's facts (spots, rooms, spawns, loot, blind ends).
    //
    // Since 2026-10-23 (GEN_VERSION 2) a floor is a labyrinth as big as Kruczy Jar (grandpa's plot, Map003: 80x60 -
    // Underground_Data.MAZE): a lattice of junctions (a 2x2 floor every px tiles across and py tiles down - room between them for
    // a wall face two rows tall over every corridor and its top), the band's chunks put on it first as halls (the junctions under a
    // hall and round its frame left out), then a "growing tree" over the junctions and the halls (mostly the newest cell grows: long
    // winding corridors; now and then a random one: side branches); a hall's door joins the nearest junction by a short straight
    // cut. A few loops join far parts of the maze (no endless turning back). The ways that join the halls and go round the loops
    // are the main corridors, 2 tiles wide; the side branches that end blind are 1 tile wide, and every blind end holds something
    // (the band's `deadEnd`: a container, a guard a few steps back, spikes on the way, in the Truth Layer a whisper or a vision).
    // The stairs up are in a hall in one corner of the floor, the stairs down in a hall in the opposite one.
    // ======================================================================================================================
    function bandOf(floor) {
        const d = D();
        return d ? d.BANDS.find(b => floor >= b.from && floor <= b.to) || null : null;
    }
    // how many halls (chunks) a generated floor has: the band's list (floor `from` first) or { min, max } growing with the depth
    function roomsOf(floor, band) {
        const r = band.rooms;
        if (Array.isArray(r)) return r[floor - band.from] || r[r.length - 1];
        if (r && typeof r === "object") {
            const k = band.to > band.from ? (floor - band.from) / (band.to - band.from) : 0;
            return Math.round(r.min + (r.max - r.min) * k);
        }
        return 6;
    }
    // the maze's numbers (Underground_Data.MAZE, a band's own `maze` over them) and its lattice's size
    function mazeOf(band) {
        const d = D();
        const m = Object.assign({ width: 80, height: 60, x0: 3, y0: 4, px: 4, py: 5, newest: 0.72, straight: 0.35, loops: [5, 8], loopMin: 12,
            doorLoop: 0.35, narrow: true, torchMax: 40, tries: 12 }, (d && d.MAZE) || {}, (band && band.maze) || {});
        m.cols = Math.floor((m.width - 3 - m.x0) / m.px) + 1;
        m.rows = Math.floor((m.height - 3 - m.y0) / m.py) + 1;
        return m;
    }

    // the plan: where each hall stands (which chunk), the maze over the lattice (which junctions, which ways, how wide), the blind ends
    function planMaze(floor, band, chunks, r) {
        const M = mazeOf(band), W = M.width, H = M.height, cols = M.cols, rows = M.rows, N = cols * rows;
        const NX = k => M.x0 + k * M.px, NY = w => M.y0 + w * M.py;
        const pool = chunks.filter(c => floor >= c.floors[0] && floor <= c.floors[1] && ["N", "S", "E", "W"].every(s => c.doors[s].length));
        if (!pool.length) throw new Error("Underground: no usable chunk for floor " + floor);
        const want = Math.max(2, roomsOf(floor, band));
        const mod = (a, m) => ((a % m) + m) % m;
        // the junctions a hall at (x, y) keeps out: those under it and round its frame (a corridor beside it: its frame is the wall;
        // over it: its own rock row is the wall's top; under it: two rows more - the corridor's wall face and its top)
        const zoneOf = (x, y, c) => {
            const out = [];
            for (let w = 0; w < rows; w++) {
                const Y = NY(w);
                if (Y + 1 < y || Y > y + c.h + 1) continue;
                for (let k = 0; k < cols; k++) { const X = NX(k); if (X + 1 >= x && X <= x + c.w - 1) out.push(w * cols + k); }
            }
            return out;
        };
        // the doors that meet the lattice straight: N / S on a junction's column (or one beside it), W / E on its rows
        const fitX = (x, c) => c.doors.N.concat(c.doors.S).filter(([dx]) => { const m = mod(x + dx - M.x0, M.px); return m <= 1 || m === M.px - 1; }).length;
        const fitY = (y, c) => c.doors.W.concat(c.doors.E).filter(([, dy]) => mod(y + dy - M.y0, M.py) <= 1).length;
        const colAt = bx => { for (const X of [bx, bx - 1, bx + 1]) { const k = (X - M.x0) / M.px; if (Number.isInteger(k) && k >= 0 && k < cols) return k; } return -1; };
        const rowAt = by => { for (const Y of [by, by - 1]) { const w = (Y - M.y0) / M.py; if (Number.isInteger(w) && w >= 0 && w < rows) return w; } return -1; };
        const fails = [];   // (why a plan was tried again: "hall N" - no room for it, "cut" - a hall left out of the maze)
        for (let attempt = 0; attempt < M.tries; attempt++) {
            const n = Math.max(2, want - Math.floor(attempt / 4));   // (a very unlucky seed: a hall fewer after every four tries)
            // ---- the halls: the stairs' two first (a corner and the opposite one), the rest spread out; none touches another's zone
            const used = new Map();
            const choose = needStairs => {
                let cand = pool.filter(c => !needStairs || c.stairs.length >= 1);
                if (!cand.length) cand = pool;
                const fresh = cand.filter(c => !used.has(c.name));
                const c = r.weighted(fresh.length ? fresh : cand, o => o.weight / (1 + (used.get(o.name) || 0) * 3));
                used.set(c.name, (used.get(c.name) || 0) + 1);
                return c;
            };
            const rooms = [], taken = new Uint8Array(N), near = new Uint8Array(N);
            const q = r.int(0, 3), tx = q & 1 ? 0.8 : 0.2, ty = q & 2 ? 0.78 : 0.22;
            const targets = [[W * tx, H * ty], [W * (1 - tx), H * (1 - ty)]];
            let ok = true;
            for (let i = 0; i < n && ok; i++) {
                const c = choose(i < 2);
                let best = null;
                const tryAt = (x, y, fx, fy) => {
                    const zone = zoneOf(x, y, c);
                    if (zone.some(z => near[z])) return;
                    const cx = x + c.w / 2, cy = y + c.h / 2;
                    let score = (fx + fy) * 3 + r() * 2;
                    if (i < 2) score -= Math.hypot(cx - targets[i][0], cy - targets[i][1]) / 3;
                    else score += Math.min(...rooms.map(o => Math.hypot(cx - o.cx, (cy - o.cy) * 1.2))) / 5;
                    if (!best || score > best.score) best = { x, y, zone, score, cx, cy };
                };
                for (let t = 0; t < 70; t++) {
                    let x = r.int(2, W - 2 - c.w), y = r.int(2, H - 2 - c.h), fx = -1, fy = -1;
                    const x1 = x, y1 = y;
                    for (let s = 0; s < M.px && x1 + s + c.w <= W - 2; s++) { const f = fitX(x1 + s, c); if (f > fx) { fx = f; x = x1 + s; } }
                    for (let s = 0; s < M.py && y1 + s + c.h <= H - 2; s++) { const f = fitY(y1 + s, c); if (f > fy) { fy = f; y = y1 + s; } }
                    tryAt(x, y, fx, fy);
                }
                // (a crowded floor: every place looked at)
                if (!best) for (let y = 2; y + c.h <= H - 2; y++) for (let x = 2; x + c.w <= W - 2; x++) tryAt(x, y, fitX(x, c), fitY(y, c));
                if (!best) { ok = false; fails.push("hall " + i); break; }
                rooms.push({ key: String(i), idx: i, chunk: c, x: best.x, y: best.y, cx: best.cx, cy: best.cy, start: i === 0, end: i === 1 });
                for (const z of best.zone) {
                    taken[z] = 1;
                    const k = z % cols, w = (z / cols) | 0;
                    for (let dw = -1; dw <= 1; dw++) for (let dk = -1; dk <= 1; dk++) {
                        const kk = k + dk, ww = w + dw;
                        if (kk >= 0 && ww >= 0 && kk < cols && ww < rows) near[ww * cols + kk] = 1;
                    }
                }
            }
            if (!ok) continue;
            // ---- the ways: the lattice between free junctions, a hall's door to the nearest junction on its side
            const adj = Array.from({ length: N + rooms.length }, () => []);
            const link = (a, b, e) => { e.a = a; e.b = b; adj[a].push(e); adj[b].push(e); };
            const latEdges = [];
            for (let w = 0; w < rows; w++) for (let k = 0; k < cols; k++) {
                const a = w * cols + k;
                if (taken[a]) continue;
                if (k + 1 < cols && !taken[a + 1]) { const e = { kind: "lat", dir: "H" }; link(a, a + 1, e); latEdges.push(e); }
                if (w + 1 < rows && !taken[a + cols]) { const e = { kind: "lat", dir: "V" }; link(a, a + cols, e); latEdges.push(e); }
            }
            const doorEdges = [];
            for (const rm of rooms) {
                const c = rm.chunk, x = rm.x, y = rm.y, id = N + rm.idx;
                const add = (side, bx, by, k, w) => {
                    if (k < 0 || w < 0 || k >= cols || w >= rows || taken[w * cols + k]) return;
                    const e = { kind: "door", dir: side, side, door: [bx, by], room: rm };
                    link(id, w * cols + k, e);
                    doorEdges.push(e);
                };
                let wN = -1, wS = -1, kW = -1, kE = -1;
                for (let w = rows - 1; w >= 0 && wN < 0; w--) if (NY(w) + 1 <= y - 1) wN = w;
                for (let w = 0; w < rows && wS < 0; w++) if (NY(w) >= y + c.h + 2) wS = w;
                for (let k = cols - 1; k >= 0 && kW < 0; k--) if (NX(k) + 1 <= x - 1) kW = k;
                for (let k = 0; k < cols && kE < 0; k++) if (NX(k) >= x + c.w) kE = k;
                for (const [dx, dy] of c.doors.N) add("N", x + dx, y + dy, colAt(x + dx), wN);
                for (const [dx, dy] of c.doors.S) add("S", x + dx, y + dy, colAt(x + dx), wS);
                for (const [dx, dy] of c.doors.W) add("W", x + dx, y + dy, kW, rowAt(y + dy));
                for (const [dx, dy] of c.doors.E) add("E", x + dx, y + dy, kE, rowAt(y + dy));
            }
            // ---- the growing tree from the stairs-up hall: the newest cell mostly (long corridors), a random one now and then (branches)
            const V = N + rooms.length, seen = new Uint8Array(V), inTree = new Set(), lastDir = new Array(V).fill(null);
            const start = N + 0, active = [start];
            seen[start] = 1;
            const other = (e, v) => (e.a === v ? e.b : e.a);
            while (active.length) {
                const idx = r.chance(M.newest) ? active.length - 1 : r.int(0, active.length - 1), cur = active[idx];
                const opts = adj[cur].filter(e => !seen[other(e, cur)]);
                if (!opts.length) { active.splice(idx, 1); continue; }
                let e = null;
                if (lastDir[cur] && r.chance(M.straight)) e = opts.find(o => o.kind === "lat" && o.dir === lastDir[cur]) || null;   // (on: the way it came is behind)
                if (!e) e = r.pick(opts);
                const nx = other(e, cur);
                seen[nx] = 1;
                inTree.add(e);
                lastDir[nx] = e.kind === "lat" ? e.dir : null;
                active.push(nx);
            }
            if (rooms.some(rm => !seen[N + rm.idx])) { fails.push("cut"); continue; }   // (a hall cut off: another try)
            // ---- the loops: lattice ways between far parts of the tree (its depth from the start; far = many steps round), spread out
            const parent = new Int32Array(V).fill(-1), depth = new Int32Array(V).fill(-1);
            depth[start] = 0;
            const bfs = [start];
            for (let h = 0; h < bfs.length; h++) {
                const v = bfs[h];
                for (const e of adj[v]) {
                    if (!inTree.has(e)) continue;
                    const u = other(e, v);
                    if (depth[u] >= 0) continue;
                    depth[u] = depth[v] + 1; parent[u] = v; bfs.push(u);
                }
            }
            const treeDist = (a, b) => {
                let x = a, y = b, n2 = 0;
                while (x !== y) { if (depth[x] >= depth[y]) { x = parent[x]; n2++; } else { y = parent[y]; n2++; } if (x < 0 || y < 0) return 0; }
                return n2;
            };
            const cand = latEdges.filter(e => !inTree.has(e) && seen[e.a] && seen[e.b]).map(e => ({ e, d: treeDist(e.a, e.b) })).filter(o => o.d >= M.loopMin);
            const loops = [], wantLoops = r.int(M.loops[0], M.loops[1]);
            const cheb = (a, b) => Math.max(Math.abs((a % cols) - (b % cols)), Math.abs(((a / cols) | 0) - ((b / cols) | 0)));
            while (loops.length < wantLoops && cand.length) {
                const o = r.weighted(cand, c2 => c2.d);
                cand.splice(cand.indexOf(o), 1);
                if (loops.some(l => cheb(l.a, o.e.a) <= 2)) continue;
                loops.push(o.e);
            }
            // ...and a hall's spare door opened too now and then (a hall with more than one way in)
            const doorLoops = [];
            for (const rm of rooms) {
                const spare = adj[N + rm.idx].filter(e => !inTree.has(e) && seen[other(e, N + rm.idx)]);
                if (spare.length && r.chance(M.doorLoop)) doorLoops.push(r.pick(spare));
            }
            const edges = [...inTree].concat(loops, doorLoops);
            // ---- the main ways and the side branches: the leaves (a junction with one way) pruned again and again - what stays joins
            // the halls or goes round a loop (2 tiles wide), what went is a side branch (1 tile wide); a leaf behind a hall's door only
            // (a door into a blind end) is not dug at all
            const deg = new Int32Array(V), alive = new Uint8Array(V), live = new Set(edges);
            for (let v = 0; v < V; v++) alive[v] = seen[v];
            for (const e of edges) { deg[e.a]++; deg[e.b]++; }
            const edgesOf = v => adj[v].filter(e => live.has(e));
            let changed = true;
            while (changed) {
                changed = false;
                for (let v = 0; v < N; v++) {
                    if (!alive[v] || deg[v] !== 1) continue;
                    const e = edgesOf(v)[0];
                    if (e && e.kind === "door") { live.delete(e); deg[e.a]--; deg[e.b]--; alive[v] = 0; changed = true; }
                }
            }
            const main = new Uint8Array(V), d2 = Int32Array.from(deg), queue = [];
            for (let v = 0; v < V; v++) if (alive[v]) main[v] = 1;
            for (let v = 0; v < N; v++) if (alive[v] && d2[v] <= 1) queue.push(v);
            while (queue.length) {
                const v = queue.pop();
                if (!main[v] || v >= N) continue;
                main[v] = 0;
                for (const e of edgesOf(v)) { const u = other(e, v); if (main[u] && u < N && --d2[u] <= 1) queue.push(u); }
            }
            if (!M.narrow) for (let v = 0; v < N; v++) if (alive[v]) main[v] = 1;
            const deadEnds = [];
            for (let v = 0; v < N; v++) if (alive[v] && deg[v] === 1) deadEnds.push({ node: v, next: other(edgesOf(v)[0], v) });
            // the far hall gets the stairs down (the second hall stands in the opposite corner)
            const nodes = [];
            for (let v = 0; v < N; v++) if (alive[v]) nodes.push(v);
            return { W, H, M, cols, rows, NX, NY, N, rooms, edges: [...live], alive, main, deg, deadEnds, nodes, ox: M.narrow ? r.int(0, 1) : 0,
                loops: loops.length + doorLoops.filter(e => live.has(e)).length, attempt, fails };
        }
        throw new Error("Underground: no maze for floor " + floor);
    }

    // the tileset's passage flags as the engine reads them (Game_Map.checkPassage over the four layers, top first)
    function makePassage(W, H, data, flags) {
        return (x, y, bit) => {
            if (x < 0 || y < 0 || x >= W || y >= H) return false;
            for (let z = 3; z >= 0; z--) {
                const id = data[(z * H + y) * W + x];
                if (!id && z > 0) continue;
                const f = flags[id] || 0;
                if (f & 0x10) continue;
                if ((f & bit) === 0) return true;
                if ((f & bit) === bit) return false;
            }
            return false;
        };
    }
    // the place of a lift's stop on a generated floor (2026-11-17): in the stairs-up hall a few steps from the stairs (one coming down
    // sees it), best by its north wall - the cage's body hangs in front of the wall as on floor 10 (Map140), the windlass two cells
    // aside on the floor row under the wall -, else standing free in the hall; a hall too full for it (crates, tables, beds, doors on
    // every side): the nearest other hall. The hero lands in front of the cage. The cage and the windlass on bare floor (no event,
    // nothing drawn), over the cage's body and the lever's stick nothing drawn or standing (no torch, no window, no table), never in a
    // hall's doorway nor by the stairs, both reached from the hall's way in, and never a way closed: the open cells round each stay
    // one group (whatever went through the cell goes round it - nothing on the floor is cut off), every thing beside them that one
    // searches or reads keeps a side to stand at. Chosen without the floor's `r` (the rest of the floor stays as older saves have it);
    // salt: which side when both are as good. null: no such place on the floor.
    // where the windlass stands from the cage [dx, dy, worse]: two cells aside on the row above (floor 10), on its row (floor 20),
    // further, right beside it
    const LIFT_KEYS = [[2, -1, 0], [-2, -1, 0], [2, 0, 0.5], [-2, 0, 0.5], [3, -1, 1], [-3, -1, 1], [3, 0, 1.5], [-3, 0, 1.5], [1, 0, 2], [-1, 0, 2]];
    const LIFT_RING = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
    const LIFT_STEP = [[0, 1, 1, 8], [-1, 0, 2, 4], [1, 0, 4, 2], [0, -1, 8, 1]];
    function liftPlace(W, H, data, events, rooms, up, down, carved, isWall, flags, salt) {
        const N = W * H, [ux, uy] = up;
        const busy = new Uint8Array(N), blocked = new Uint8Array(N), things = [];
        for (const e of events) {
            if (!e) continue;
            busy[e.y * W + e.x] = 1;
            const p = e.pages[0];
            if (p.priorityType === 1 && !p.through) { blocked[e.y * W + e.x] = 1; things.push([e.x, e.y]); }
        }
        const pass = flags ? makePassage(W, H, data, flags) : null;
        const ins = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
        const bare = (x, y) => ins(x, y) && !busy[y * W + x] && !data[(2 * H + y) * W + x] && !data[(3 * H + y) * W + x];
        const openMemo = new Int8Array(N).fill(-1);
        const open = (x, y) => {
            if (!ins(x, y)) return false;
            const k = y * W + x;
            if (openMemo[k] < 0) openMemo[k] = !isWall(x, y) && !blocked[k] && (!pass || (pass(x, y, 1) && pass(x, y, 2) && pass(x, y, 4) && pass(x, y, 8))) ? 1 : 0;
            return openMemo[k] === 1;
        };
        const face = (x, y) => ins(x, y) && isWall(x, y) && bare(x, y);
        // a cell taken (the other one taken too) closes no way: its open neighbours (4 ways; a corner joins two sides) one group
        const ring = new Uint8Array(8);
        const loose = (x, y, ox, oy) => {
            for (let i = 0; i < 8; i++) { const nx = x + LIFT_RING[i][0], ny = y + LIFT_RING[i][1]; ring[i] = !(nx === ox && ny === oy) && open(nx, ny) ? 1 : 0; }
            let groups = 0;
            for (let i = 0; i < 8; i += 2) if (ring[i] && !(ring[(i + 6) % 8] && ring[(i + 7) % 8])) groups++;
            return groups <= 1;
        };
        // a thing one searches or reads beside the two cells still has a free side
        const served = (x, y, kx, ky, cx, cy) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            return !(nx === kx && ny === ky) && !(nx === cx && ny === cy) && open(nx, ny);
        });
        const stairsNear = (x, y, n) => (Math.abs(x - ux) < n && Math.abs(y - uy) < n) || (!!down && Math.abs(x - down[0]) < n && Math.abs(y - down[1]) < n);
        const prefer = salt & 1 ? 1 : -1;
        const centre = rm => [rm.x + rm.chunk.w / 2, rm.y + rm.chunk.h / 2];
        const order = rooms.slice().sort((a, b) => (b.start ? 1 : 0) - (a.start ? 1 : 0) ||
            Math.hypot(centre(a)[0] - ux, centre(a)[1] - uy) - Math.hypot(centre(b)[0] - ux, centre(b)[1] - uy));
        // the tries [hall, care]: the stairs-up hall with its doorways kept free two cells deep and a ring round (care 2), the same hall
        // with only a door's own cells and one more kept (1), the other halls nearest first (2), and - a floor whose halls are all too
        // full, one in some thousands - every hall once more with the cage's body allowed over a drawn thing, never over an event (0)
        const tries = [[0, 2], [0, 1]], reached = [];
        for (let rank = 1; rank < order.length; rank++) tries.push([rank, 2]);
        for (let rank = 0; rank < order.length; rank++) tries.push([rank, 0]);
        for (const [rank, care] of tries) {
            const room = order[rank], c = room.chunk, x0 = room.x, y0 = room.y, w = c.w, h = c.h;
            // the hall's floor reached from its way in (the stairs' landing; another hall: its doors - each reached from the stairs,
            // the floor's own check) without leaving the hall
            const known = reached[rank], reach = known || new Uint8Array(w * h), q = [];
            reached[rank] = reach;
            const seed = (x, y) => { if (x >= x0 && y >= y0 && x < x0 + w && y < y0 + h && !reach[(y - y0) * w + x - x0]) { reach[(y - y0) * w + x - x0] = 1; q.push([x, y]); } };
            if (known) { /* (this hall walked already) */ } else if (room.start) seed(ux, uy);
            else for (const side of ["N", "S", "E", "W"]) for (const [dx, dy] of c.doors[side]) { seed(x0 + dx, y0 + dy); seed(x0 + dx + (side === "N" || side === "S" ? 1 : 0), y0 + dy + (side === "W" || side === "E" ? 1 : 0)); }
            for (let i = 0; i < q.length; i++) {
                const [x, y] = q[i];
                for (const [dx, dy, out, back] of LIFT_STEP) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < x0 || ny < y0 || nx >= x0 + w || ny >= y0 + h || reach[(ny - y0) * w + nx - x0] || blocked[ny * W + nx]) continue;
                    if (pass ? !pass(x, y, out) || !pass(nx, ny, back) : !open(nx, ny)) continue;
                    reach[(ny - y0) * w + nx - x0] = 1; q.push([nx, ny]);
                }
            }
            const inside = (x, y) => x > x0 && y > y0 && x < x0 + w - 1 && y < y0 + h - 1;
            // the doorways: a door's mark stands on the hall's first floor cell inside its opening (two cells: N / S side by side, W / E
            // one over the other) - kept free: the way through the wall and `deep` cells into the hall, a ring of `g` round
            const doorway = new Set();
            const mark = (ax, ay, bx, by) => { for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) doorway.add(y * W + x); };
            const g = care === 2 ? 1 : 0, deep = care === 2 ? 2 : 1;
            for (const [dx, dy] of c.doors.N) mark(x0 + dx - g, y0 + dy - 3, x0 + dx + 1 + g, y0 + dy + deep);
            for (const [dx, dy] of c.doors.S) mark(x0 + dx - g, y0 + dy - deep, x0 + dx + 1 + g, y0 + dy + 3);
            for (const [dx, dy] of c.doors.W) mark(x0 + dx - 3, y0 + dy - g, x0 + dx + deep, y0 + dy + 1 + g);
            for (const [dx, dy] of c.doors.E) mark(x0 + dx - deep, y0 + dy - g, x0 + dx + 3, y0 + dy + 1 + g);
            const over = care ? bare : (x, y) => ins(x, y) && !busy[y * W + x];
            const ok = (x, y) => inside(x, y) && reach[(y - y0) * w + x - x0] && open(x, y) && !busy[y * W + x] && !carved.has(y * W + x) &&
                !doorway.has(y * W + x) && !stairsNear(x, y, 2);
            const [ax, ay] = room.start ? up : centre(room);
            let best = null;
            for (let cy = y0 + 2; cy < y0 + h - 2; cy++) for (let cx = x0 + 1; cx < x0 + w - 1; cx++) {
                // the cage: its shadow on bare floor, its body two and three cells higher over nothing, open floor under it and before it
                if (!bare(cx, cy) || !over(cx, cy - 2) || !over(cx, cy - 3) || stairsNear(cx, cy, 3)) continue;
                if (!ok(cx, cy) || !ok(cx, cy - 1) || !ok(cx, cy + 1)) continue;
                const far = Math.abs(cx - ax) + Math.abs(cy - ay), body = face(cx, cy - 2);
                for (const [ox, oy, worse] of LIFT_KEYS) {
                    const kx = cx + ox, ky = cy + oy, wall = body && face(kx, ky - 1);
                    const cost = Math.abs(far - (room.start ? 4 : 0)) + (wall ? 0 : 6) + worse + (Math.sign(ox) === prefer ? 0 : 0.25);
                    if (best && cost >= best.cost) continue;
                    if (!bare(kx, ky) || !over(kx, ky - 1) || !ok(kx, ky)) continue;
                    if (!loose(cx, cy, kx, ky) || !loose(kx, ky, cx, cy)) continue;
                    if (things.some(([x, y]) => Math.abs(x - cx) + Math.abs(y - cy) <= 1 || Math.abs(x - kx) + Math.abs(y - ky) <= 1 ? !served(x, y, kx, ky, cx, cy) : false)) continue;
                    best = { windlass: [kx, ky], cage: [cx, cy], wall, hall: rank, care, cost };
                }
            }
            if (best) { best.torch = liftLight(best); return best; }
        }
        return null;
        // (2026-11-17, the player: a torch by the lift) the fire beside the cage that always burns - the stop is seen on the dark floors
        // (75-95) too: a torch on the nearest wall face (a wall cell with open floor under it, nothing drawn or standing on it; up to
        // the row over the cage's top), never the cage's own column nor over the lever, the side away from the windlass first; or -
        // when it is nearer than any such wall (a cage standing free in the hall) - a fire basket on the floor beside the cage (nothing
        // drawn or standing on it and on the cell over it, out of the cage's landing and of the windlass's front, every way kept open
        // and every thing served, as for the cage itself). null: no place for either.
        function liftLight(best) {
            const [cx, cy] = best.cage, [kx, ky] = best.windlass, away = Math.sign(cx - kx) || 1;
            let at = null, low = Infinity;
            for (let ty = cy - 5; ty <= cy; ty++) for (let tx = cx - 3; tx <= cx + 3; tx++) {
                if (tx === cx || (tx === kx && ty >= ky - 2) || !ins(tx, ty + 1) || !isWall(tx, ty) || isWall(tx, ty + 1) || !bare(tx, ty)) continue;
                const cost = Math.abs(tx - cx) + Math.abs(ty - (cy - 2)) * 0.5 + (Math.sign(tx - cx) === away ? 0 : 1.5);
                if (cost < low) { low = cost; at = [tx, ty]; }
            }
            let kind = at ? "wall" : null;
            const room = order[best.hall], x0 = room.x, y0 = room.y, w = room.chunk.w, h = room.chunk.h, reach = reached[best.hall];
            blocked[cy * W + cx] = 1; blocked[ky * W + kx] = 1; openMemo.fill(-1);   // (the cage and the windlass stand now)
            for (let by = cy - 1; by <= cy + 1; by++) for (let bx = cx - 2; bx <= cx + 2; bx++) {
                if (bx === cx || (bx === kx && by >= ky - 1 && by <= ky + 1)) continue;
                if (bx <= x0 || by <= y0 || bx >= x0 + w - 1 || by >= y0 + h - 1 || !reach[(by - y0) * w + bx - x0]) continue;
                if (!bare(bx, by) || !bare(bx, by - 1) && !isWall(bx, by - 1) || !open(bx, by) || carved.has(by * W + bx) || stairsNear(bx, by, 2)) continue;
                const cost = 1 + Math.abs(bx - cx) + Math.abs(by - cy) * 0.5 + (Math.sign(bx - cx) === away ? 0 : 1.5);   // (a wall first)
                if (cost >= low || !loose(bx, by, -1, -1)) continue;
                if (!served(kx, ky, bx, by, -1, -1) || !served(cx, cy, bx, by, -1, -1)) continue;
                if (things.some(([x, y]) => Math.abs(x - bx) + Math.abs(y - by) <= 1 && !served(x, y, bx, by, -1, -1))) continue;
                low = cost; at = [bx, by]; kind = "fire";
            }
            blocked[cy * W + cx] = 0; blocked[ky * W + kx] = 0; openMemo.fill(-1);
            return at ? { kind, at } : null;
        }
    }
    // a chunk event of each container kind of a library (its pictures for the containers of the blind ends)
    const templatesOf = new WeakMap();
    function lootTemplates(chunks) {
        if (templatesOf.has(chunks)) return templatesOf.get(chunks);
        const out = {};
        for (const c of chunks) for (const ce of c.events) {
            const k = ce.tags.Lup ? String(ce.tags.Lup).trim() : "";
            if (k && !out[k] && ce.data && ce.data.pages && ce.data.pages.length) out[k] = ce.data;
        }
        templatesOf.set(chunks, out);
        return out;
    }

    function generate(floor, seed, chunks, opts) {
        const o = opts || {}, d = D(), band = bandOf(floor);
        if (!band || !chunks || !chunks.length) return null;
        const r = rng(hash(seed >>> 0, "floor", floor, band.id));
        const plan = planMaze(floor, band, chunks, r);
        const W = plan.W, H = plan.H, N = W * H, cols = plan.cols, NX = plan.NX, NY = plan.NY, ox = plan.ox;
        const data = new Array(N * 6).fill(0);
        const at = (z, x, y) => (z * H + y) * W + x;
        const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
        const rock = band.rock, cor = band.corridor;
        for (let i = 0; i < N; i++) data[i] = autoId(rock, 0);
        const dirty = new Uint8Array(N);
        const markDirty = (x, y, ring) => {
            for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) if (inside(x + dx, y + dy)) dirty[(y + dy) * W + x + dx] = 1;
        };
        // ---- the halls: every layer of the chunk copied; its border (and the rock round it) shaped again later
        for (const rm of plan.rooms) {
            const c = rm.chunk;
            for (let z = 0; z < 6; z++) for (let dy = 0; dy < c.h; dy++) for (let dx = 0; dx < c.w; dx++) {
                data[at(z, rm.x + dx, rm.y + dy)] = c.tiles[(z * c.h + dy) * c.w + dx];
            }
            for (let dx = -1; dx <= c.w; dx++) { markDirty(rm.x + dx, rm.y - 1, 0); markDirty(rm.x + dx, rm.y, 0); markDirty(rm.x + dx, rm.y + c.h - 1, 0); markDirty(rm.x + dx, rm.y + c.h, 0); }
            for (let dy = -1; dy <= c.h; dy++) { markDirty(rm.x - 1, rm.y + dy, 0); markDirty(rm.x, rm.y + dy, 0); markDirty(rm.x + c.w - 1, rm.y + dy, 0); markDirty(rm.x + c.w, rm.y + dy, 0); }
        }
        const k0 = (x, y) => kindOf(data[at(0, x, y)]);
        const isWall = (x, y) => { if (!inside(x, y)) return true; const k = k0(x, y); return k < 0 ? !data[at(0, x, y)] : (k >= 48 && k < 80) || k >= 80; };
        const isTop = (x, y) => inside(x, y) && isA4Top(k0(x, y));
        // ---- the corridors: rectangles of the lattice cut into the rock (the halls' floors stay); main 2 wide, side branches 1 wide
        const carved = new Set(), mainSet = new Set(), corridorCells = [];
        const carveRect = (x0, y0, x1, y1, main) => {   // (from the top-left to the bottom-right corner; an empty one cuts nothing)
            for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
                if (cx < 1 || cy < 1 || cx >= W - 1 || cy >= H - 1) continue;
                if (!isWall(cx, cy)) continue;
                data[at(0, cx, cy)] = autoId(cor.floor, 0);
                for (let z = 1; z < 6; z++) data[at(z, cx, cy)] = 0;
                const k = cy * W + cx;
                if (!carved.has(k)) { carved.add(k); corridorCells.push([cx, cy]); if (main) mainSet.add(k); }
                markDirty(cx, cy, 2);
            }
        };
        const main = v => !!plan.main[v];
        const kOf = v => v % cols, wOf = v => (v / cols) | 0;
        // a junction's own tiles: 2x2, or one (x0 + ox, its lower row) on a side branch
        const left = v => NX(kOf(v)) + (main(v) ? 0 : ox), right = v => NX(kOf(v)) + (main(v) ? 1 : ox), top = v => NY(wOf(v)) + (main(v) ? 0 : 1);
        for (const v of plan.nodes) carveRect(left(v), top(v), right(v), NY(wOf(v)) + 1, main(v));
        const links = [];
        for (const e of plan.edges) {
            if (e.kind === "lat") {
                const a = Math.min(e.a, e.b), b = Math.max(e.a, e.b), wide = main(a) && main(b);
                const X = NX(kOf(a)), Y = NY(wOf(a));
                if (b === a + 1) wide ? carveRect(X + 2, Y, X + 3, Y + 1, true) : carveRect(right(a) + 1, Y + 1, left(b) - 1, Y + 1, false);
                else wide ? carveRect(X, Y + 2, X + 1, Y + 4, true) : carveRect(X + ox, Y + 2, X + ox, top(b) - 1, false);
                continue;
            }
            // a hall's door: a straight cut 2 wide from the door through the hall's wall to its junction (which may be a branch's)
            // (W / E: the cut stays beside the junction's column - a branch's one tile joined on its own row only, so the cut's lower
            // row never eats the top of the wall over the corridor below)
            const v = e.a < plan.N ? e.a : e.b, [bx, by] = e.door, X = NX(kOf(v)), Y = NY(wOf(v));
            if (e.side === "N") carveRect(bx, main(v) ? Y : Y + 1, bx + 1, by - 1, true);
            else if (e.side === "S") carveRect(bx, by + 1, bx + 1, Y + 1, true);
            else if (e.side === "W") { carveRect(X + 2, by, bx - 1, by + 1, true); if (!main(v)) carveRect(X + ox + 1, Y + 1, X + 1, Y + 1, true); }
            else { carveRect(bx + 1, by, X - 1, by + 1, true); if (!main(v)) carveRect(X, Y + 1, X + ox - 1, Y + 1, true); }
            links.push({ a: e.room.key, b: kOf(v) + "," + wOf(v), side: e.side, from: [bx, by], to: [X, Y] });
        }
        // ---- the corridors' north walls: a face two rows tall over every corridor cell that has rock above it
        const faceLow = [];
        for (const [x, y] of corridorCells) {
            if (!isTop(x, y - 1)) continue;
            data[at(0, x, y - 1)] = autoId(cor.side, 0);
            faceLow.push([x, y - 1, mainSet.has(y * W + x)]);
            markDirty(x, y - 1, 1);
            if (isTop(x, y - 2) && inside(x, y - 3)) { data[at(0, x, y - 2)] = autoId(cor.side, 0); markDirty(x, y - 2, 1); }
        }
        // ---- the corridors' floor: a little dust here and there (layer 1)
        if (cor.film) {
            for (const [x, y] of corridorCells) if (r.chance(cor.filmChance || 0)) {
                for (const [dx, dy] of r.chance(0.3) ? [[0, 0], [1, 0]] : [[0, 0]]) {
                    const cx = x + dx, cy = y + dy;
                    if (carved.has(cy * W + cx)) data[at(1, cx, cy)] = autoId(cor.film, 0);
                }
            }
        }
        // ---- every changed cell shaped again like the editor would (rock tops of any kind join without a seam)
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!dirty[y * W + x]) continue;
            for (let z = 0; z < 2; z++) {
                const id = data[at(z, x, y)], k = kindOf(id);
                if (k < 0) continue;
                const topK = isA4Top(k);
                const same = (dx, dy) => {
                    const nx = x + dx, ny = y + dy;
                    if (!inside(nx, ny)) return true;
                    const nk = kindOf(data[at(z, nx, ny)]);
                    return topK ? isA4Top(nk) : nk === k;
                };
                data[at(z, x, y)] = autoId(k, isWallKind(k) ? wallShape(same) : isFallKind(k) ? (same(-1, 0) ? 0 : 1) | (same(1, 0) ? 0 : 2) : floorShape(same));
            }
            // the editor's wall shadow: the left half of a floor cell beside a wall
            if (!isWall(x, y)) data[at(4, x, y)] = isWall(x - 1, y) ? 5 : 0;
            else data[at(4, x, y)] = 0;
        }
        // ---- the events
        const events = [null], spawns = [], loot = {}, traps = [], notes = [], spots = {}, whispers = [], visions = [];
        const evd = (name, x, y, note, pages) => {
            const e = { id: events.length, name, note: note || "", pages, x, y };
            events.push(e);
            return e;
        };
        const art = a => ({ tileId: 0, characterName: a[0], characterIndex: a[1], direction: a[2], pattern: a[3] });
        const blankCond = () => ({ actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false,
            switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 });
        const page = p => ({ conditions: Object.assign(blankCond(), p.cond || {}), directionFix: p.fix !== false,
            image: p.image || { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 },
            list: (p.list || []).concat([{ code: 0, indent: 0, parameters: [] }]), moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: p.priority || 0, stepAnime: !!p.step, through: !!p.through, trigger: p.trigger || 0, walkAnime: false });
        const scriptCmd = code => ({ code: 355, indent: 0, parameters: [code] });
        const seCmd = (name, vol, pitch) => ({ code: 250, indent: 0, parameters: [{ name, volume: vol || 80, pitch: pitch || 100, pan: 0 }] });
        // the torches of this band: the warm flame (bands 1-4) or the Truth Layer's blue one
        const blue = band.torch === "blue";
        const torchArt = lit => art(blue ? (lit ? d.ART.blueLit : d.ART.blueOut) : (lit ? d.ART.torchLit : d.ART.torchOut));
        const torchLight = blue ? d.BLUE_LIGHT : d.TORCH_LIGHT;
        const addTorch = (x, y, lit) => evd(lit ? "Pochodnia" : TK.kod.addTorch[0], x, y, lit ? torchLight : "",
            [page({ image: torchArt(lit), through: true, step: lit, list: [] })]);
        const addSpawn = (x, y, kind, room) => {
            spawns.push({ x, y, kind, floor, room });
            evd("Miejsce: stwór", x, y, "<Stwor:" + kind + ">", [page({ through: true })]);
        };
        const addWhisper = (x, y) => { const e = evd("Szept", x, y, "<Szept>", [page({ through: true })]); whispers.push({ id: e.id, x, y }); };
        const addVision = (x, y) => { const e = evd("Zjawa", x, y, "<Zjawa>", [page({ through: true, priority: 1 })]); visions.push({ id: e.id, x, y }); };
        const addTrap = (x, y) => {
            const e = evd(TK.kod.addTrap[0], x, y, "<Pulapka:kolce>", [page({ image: art(d.ART.spikes), through: true })]);
            e.pages[0].image.direction = d.SPIKE_STEPS[0];
            traps.push({ id: e.id, x, y, phase: r.int(0, d.SPIKES.period - 1) });
        };
        // a container: what is in it rolled now (the save's seed - the same every time); page 2 (self switch A: searched) the "open"
        // picture if the kind has one - or nothing at all for a thing that is taken away (mushrooms)
        const addLoot = (kind, x, y, src) => {
            const table = d.LOOT[kind];
            if (!table) return null;
            const full = r.chance(table.full !== undefined ? table.full : band.lootFull);
            const got = [];
            if (full) for (let i = 0; i < (table.picks || 1); i++) {
                const pick = r.weighted(table.list, q2 => q2.w || 1);
                if (pick.gold) got.push({ gold: Math.round((r.int(pick.gold[0], pick.gold[1]) + Math.floor(floor / 3)) * (band.gold || 1)) });
                else got.push({ item: pick.item, n: r.int(pick.n[0], pick.n[1]) });
            }
            const plain = { skrzynia: d.ART.chest, skrzynka: d.ART.crate, beczka: d.ART.barrel }[kind];
            const pages = src ? src.pages.map(p => JSON.parse(JSON.stringify(p))) : plain ? [page({ image: art(plain), priority: 1 })] : null;
            if (!pages) return null;
            const openArt = { skrzynia: d.ART.chestOpen, skrzynka: d.ART.crateOpen, beczka: d.ART.barrelOpen }[kind];
            pages[0].list = [scriptCmd("Underground.search(this.eventId())"), { code: 0, indent: 0, parameters: [] }];
            pages[0].trigger = 0;
            const second = JSON.parse(JSON.stringify(pages[0]));
            second.conditions = Object.assign(blankCond(), { selfSwitchValid: true, selfSwitchCh: "A" });
            if (table.gone) {
                second.image = { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 };
                second.list = [{ code: 0, indent: 0, parameters: [] }];
                second.priorityType = 0; second.through = true;
            } else if (openArt && pages[0].image.characterName) second.image = art(openArt);
            const e = evd((src && src.name) || d.LOOT_NAMES[kind], x, y, "<Lup:" + kind + ">", [pages[0], second]);
            loot[e.id] = { kind, got };
            return e;
        };
        // the stairs: up in the start hall, down in the far one, each on one of the chunk's stairs places (a lower wall face
        // row; one lands on the floor cell below it, facing down)
        const pickStairs = (rm, avoid) => {
            const list = rm.chunk.stairs.filter(s => !avoid || s[0] !== avoid[0] || s[1] !== avoid[1]);
            const s = r.pick(list.length ? list : rm.chunk.stairs);
            return s ? [rm.x + s[0], rm.y + s[1]] : null;
        };
        const startRoom = plan.rooms.find(q2 => q2.start), endRoom = plan.rooms.find(q2 => q2.end);
        const up = pickStairs(startRoom);
        const down = pickStairs(endRoom, startRoom === endRoom && up ? [up[0] - endRoom.x, up[1] - endRoom.y] : null);
        if (up) {
            evd(d.TEXT.stairsUp, up[0], up[1], "<Minimap:exit>", [page({ image: art(d.ART.stairsUp), priority: 1, trigger: 1,
                list: [seCmd("Move1", 80, 95), scriptCmd("Underground.stairs(\"up\")")] })]);
            spots.up = [up[0], up[1] + 1, 2];
        }
        if (down) {
            evd(d.TEXT.stairsDown, down[0], down[1], "<Minimap:exit>", [page({ image: art(d.ART.stairsDown), priority: 1, trigger: 1,
                list: [seCmd("Move1", 80, 85), scriptCmd("Underground.stairs(\"down\")")] })]);
            spots.down = [down[0], down[1] + 1, 2];
        }
        const nearUp = (x, y, dist) => !!spots.up && Math.hypot(x - spots.up[0], y - spots.up[1]) < dist;
        // the chunks' own events (their tags read here)
        const noteRooms = [];
        for (const rm of plan.rooms) {
            for (const ce of rm.chunk.events) {
                const x = rm.x + ce.dx, y = rm.y + ce.dy, t = ce.tags;
                if (carved.has(y * W + x)) continue;   // (a corridor came through here)
                if (t.Losowo !== undefined && !r.chance((Number(t.Losowo) || 50) / 100)) continue;
                const src = ce.data;
                if (t.Stwor !== undefined) {
                    if (nearUp(x, y, 4.5)) continue;   // (not on the hero's head as he comes down the stairs)
                    addSpawn(x, y, String(t.Stwor === true ? "dowolny" : t.Stwor).trim(), rm.key);
                    continue;
                }
                if (t.Szept) { addWhisper(x, y); continue; }   // (the Truth Layer: a voice from the dark comes from here)
                if (t.Zjawa) { addVision(x, y); continue; }    // (the Truth Layer: someone is seen here for a moment)
                if (t.Zapiski) { noteRooms.push({ rm, x, y, src }); continue; }
                if (t.Pochodnia) { addTorch(x, y, r.chance(band.roomTorchLit)); continue; }
                if (t.Pulapka) { if (r.chance(band.trapOn)) addTrap(x, y); continue; }
                if (t.Lup) { addLoot(String(t.Lup).trim(), x, y, src); continue; }
                evd(src.name, x, y, src.note, JSON.parse(JSON.stringify(src.pages)));
            }
        }
        // the order's note of this floor: on one of the "Zapiski" places (the rest stay empty)
        const note = d.NOTES[floor];
        if (note && noteRooms.length) {
            const n = r.pick(noteRooms);
            const pages = JSON.parse(JSON.stringify(n.src.pages));
            pages[0].list = [scriptCmd("Underground.read(" + floor + ")"), { code: 0, indent: 0, parameters: [] }];
            pages[0].trigger = 0;
            const e = evd(Watki.wstaw(TK.kod.generate[0], { title: note.title }), n.x, n.y, "<Zapiski:" + floor + ">", [pages[0]]);
            notes.push({ id: e.id, floor, x: n.x, y: n.y });
        }
        // ---- the blind ends: each holds something - a container of the band's kinds at the end, a guard a few steps back (an ambush),
        // spikes on the way, in the Truth Layer a whisper or a vision; past the caps at least a lost guard's remains
        const de = band.deadEnd || {}, tpl = lootTemplates(chunks);
        const kinds = Object.keys(de.kinds || {}).filter(k => d.LOOT[k] && (tpl[k] || { skrzynia: 1, skrzynka: 1, beczka: 1 }[k]));
        const guards = Object.keys(de.guards || {});
        const occupied = new Set(events.filter(Boolean).map(e => e.y * W + e.x));
        const deadEnds = [];
        let lootN = 0, guardN = 0;
        for (const end of r.shuffle(plan.deadEnds.slice())) {
            const v = end.node, nv = end.next, X = NX(kOf(v)), Y = NY(wOf(v));
            const step = nv === v + 1 ? [1, 0] : nv === v - 1 ? [-1, 0] : nv > v ? [0, 1] : [0, -1];
            const back = [];   // (from the blind end back towards the junction it hangs on)
            for (let i = 0, x = X + (main(v) ? 0 : ox), y = Y + 1; i < 7 && carved.has(y * W + x); i++, x += step[0], y += step[1]) back.push([x, y]);
            if (!back.length) continue;
            const [ex, ey] = back[0], what = [];
            if (occupied.has(ey * W + ex)) continue;
            if (band.whispers && r.chance(de.whisper || 0)) { const w0 = back[1] || back[0]; addWhisper(w0[0], w0[1]); what.push("szept"); }
            if (band.whispers && back[3] && r.chance(de.vision || 0)) { addVision(back[3][0], back[3][1]); what.push("zjawa"); }
            let box = null;
            if (kinds.length && lootN < (de.maxLoot || 0) && (r.chance(de.loot || 0) || !what.length)) {
                const kind = r.weighted(kinds, k => de.kinds[k]);
                box = addLoot(kind, ex, ey, tpl[kind]);
                if (box) { lootN++; what.push(kind); }
            }
            let g = null;
            if (guards.length && floor >= (de.guardFrom || 1) && guardN < (de.maxGuards || 0) && (r.chance(de.guard || 0) || !what.length)) {
                g = box ? back[Math.min(back.length - 1, r.int(2, 3))] : back[0];
                if (g && (!box || back.length > 2)) { addSpawn(g[0], g[1], r.weighted(guards, k => de.guards[k]), "zaulek"); guardN++; what.push(TK.kod.generate[1]); }
                else g = null;
            }
            const spike = g === back[2] ? back[3] : back[2];   // (not on the guard's place)
            if (box && spike && back.length > 3 && r.chance((de.trap || 0) * (band.trapOn || 0) * 2)) { addTrap(spike[0], spike[1]); what.push("kolce"); }
            if (!what.length && tpl.kosci && addLoot("kosci", ex, ey, tpl.kosci)) what.push("kosci");
            if (what.length) deadEnds.push({ x: ex, y: ey, what });
        }
        // the creatures' places in a mixed order (the creature plugin fills them in this order up to its cap - spread over the floor)
        r.shuffle(spawns);
        // the corridors' torches: on the lower row of the main corridors' north walls, spaced out
        const placed = [];
        const minGap = band.torchEvery[1], most = Math.min(plan.M.torchMax, Math.ceil(mainSet.size / (band.torchEvery[1] * 3)));
        for (const [x, y] of r.shuffle(faceLow.filter(f => f[2]))) {
            if (placed.length >= most) break;
            if (placed.some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) < minGap)) continue;
            if (!inside(x, y + 1) || isWall(x, y + 1)) continue;
            if (events.some(e => e && e.x === x && e.y === y)) continue;
            placed.push([x, y]);
            addTorch(x, y, r.chance(band.torchLit));
        }
        // ---- a stop of the lift (Underground_Data.LIFT.stops - every 5th floor since 2026-11-17): the castellan's cage and its windlass
        const lift = d.LIFT && d.LIFT.stops.indexOf(floor) >= 0 && spots.up ? liftPlace(W, H, data, events, plan.rooms, spots.up, spots.down, carved, isWall, o.flags, hash(seed >>> 0, "lift", floor)) : null;
        if (lift) {
            const [kx, ky] = lift.windlass, [cx, cy] = lift.cage, turn = [scriptCmd("Underground.windlass(this)")];
            evd(TK.kod.liftOn[0], kx, ky, "", [page({ image: art(d.ART.windlass), priority: 1, list: turn }),
                page({ cond: { selfSwitchValid: true, selfSwitchCh: "A" }, image: art(d.ART.windlassOn), priority: 1, list: turn })]);
            evd(TK.kod.generate[2], cx, cy, "", [page({ image: art(d.ART.cage), priority: 1, list: [scriptCmd("Underground.cage(this)")] })]);
            spots.lift = [cx, cy + 1, 2];
            // (2026-11-17, the player: a torch by the lift) its fire that always burns (liftPlace's liftLight): a torch on the wall
            // beside the cage, or a fire basket on the floor (the Truth Layer: a blue candelabrum) by a cage that stands free
            const lt = lift.torch;
            if (lt && lt.kind === "wall") addTorch(lt.at[0], lt.at[1], true);
            else if (lt) evd(blue ? "Świecznik" : "Kosz z ogniem", lt.at[0], lt.at[1], blue ? d.BLUE_LIGHT : d.BRAZIER_LIGHT,
                [page({ image: art(blue ? d.ART.candelabrumBlue : d.ART.brazier), priority: 1, step: true })]);
        }
        // ---- the map object (like $dataMap); a river's sound when a hall has water (band 3), the band's own sound otherwise
        const level = band.level + Math.floor((floor - band.from) / 2);
        const water = plan.rooms.some(rm => rm.chunk.water > 0);
        const bgs = water && band.bgsWater ? band.bgsWater : band.bgs || null;
        const map = {
            autoplayBgm: true, autoplayBgs: !!bgs, battleback1Name: "", battleback2Name: "",
            bgm: { name: band.bgm || "", pan: 0, pitch: 100, volume: 70 },
            bgs: bgs ? { name: bgs.name, pan: 0, pitch: bgs.pitch || 100, volume: bgs.volume || 40 } : { name: "", pan: 0, pitch: 100, volume: 90 },
            disableDashing: false, displayName: d.TEXT.floorName(floor), encounterList: [], encounterStep: 30, height: H,
            note: d.FLOOR_NOTE.replace(/%DARK%/g, band.dark).replace("%LEVEL%", level), parallaxLoopX: false, parallaxLoopY: false,
            parallaxName: "", parallaxShow: true, parallaxSx: 0, parallaxSy: 0, scrollType: 0, specifyBattleback: false,
            tilesetId: band.tileset || 10, width: W, data, events
        };
        const info = { floor, band: band.id, bandName: band.name, seed: seed >>> 0, width: W, height: H, spots, spawns, loot, traps, notes,
            whispers, visions, water,
            rooms: plan.rooms.map(rm => ({ key: rm.key, chunk: rm.chunk.name, x: rm.x, y: rm.y, w: rm.chunk.w, h: rm.chunk.h, start: rm.start, end: rm.end })),
            links, corridorCells: corridorCells.length, level, deadEnds, lift,
            maze: { cols: plan.cols, rows: plan.rows, nodes: plan.nodes.length, main: mainSet.size, branch: corridorCells.length - mainSet.size,
                loops: plan.loops, torches: placed.length, tries: plan.attempt + 1 } };
        if (o.flags) info.check = verifyMap(map, info, o.flags);
        return { map, info };
    }

    // a walk from the landing of the stairs up to the landing of the stairs down (4 ways, tile flags + blocking events)
    function verifyMap(map, info, flags) {
        const W = map.width, H = map.height, pass = makePassage(W, H, map.data, flags);
        const blocked = new Set();
        for (const e of map.events) {
            if (!e) continue;
            const p = e.pages[0];
            if (p.priorityType === 1 && !p.through) blocked.add(e.y * W + e.x);
        }
        const a = info.spots.up, b = info.spots.down;
        if (!a || !b) return { ok: false, why: "no stairs" };
        const bit = d => (1 << (d / 2 - 1)) & 0x0f, rev = { 2: 8, 4: 6, 6: 4, 8: 2 }, step = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
        const seen = new Map([[a[1] * W + a[0], 0]]), q = [[a[0], a[1]]];
        let reached = 0;
        while (q.length) {
            const [x, y] = q.shift(), dd = seen.get(y * W + x);
            reached++;
            if (x === b[0] && y === b[1]) return { ok: true, steps: dd, reached };
            for (const d of [2, 4, 6, 8]) {
                const nx = x + step[d][0], ny = y + step[d][1], k = ny * W + nx;
                if (seen.has(k) || blocked.has(k)) continue;
                if (!pass(x, y, bit(d)) || !pass(nx, ny, bit(rev[d]))) continue;
                seen.set(k, dd + 1);
                q.push([nx, ny]);
            }
        }
        return { ok: false, why: "no way from " + a + " to " + b, reached };
    }
    // the cells reachable on foot from a cell of a map (tile flags + blocking events; one page of each event - the first)
    function reachable(map, from, flags) {
        const W = map.width, H = map.height, pass = makePassage(W, H, map.data, flags);
        const blocked = new Set();
        for (const e of map.events) { if (!e) continue; const p = e.pages[0]; if (p.priorityType === 1 && !p.through) blocked.add(e.y * W + e.x); }
        const bit = d => (1 << (d / 2 - 1)) & 0x0f, rev = { 2: 8, 4: 6, 6: 4, 8: 2 }, step = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
        const seen = new Set([from[1] * W + from[0]]), q = [[from[0], from[1]]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const d of [2, 4, 6, 8]) {
                const nx = x + step[d][0], ny = y + step[d][1], k = ny * W + nx;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || blocked.has(k)) continue;
                if (!pass(x, y, bit(d)) || !pass(nx, ny, bit(rev[d]))) continue;
                seen.add(k); q.push([nx, ny]);
            }
        }
        return seen;
    }

    // a chunk's own check: every door (both its cells), every stairs' landing and every container's front reachable inside the
    // chunk from each other (tile flags + blocking events) - what a corridor or the stairs bring the hero to must lead somewhere
    function checkChunk(c, flags) {
        const W = c.w, H = c.h, pass = makePassage(W, H, c.tiles, flags), out = [];
        const blocked = new Set();
        for (const e of c.events) { const p = e.data.pages[0]; if (p.priorityType === 1 && !p.through) blocked.add(e.dy * W + e.dx); }
        const targets = [];
        for (const side of ["N", "S", "E", "W"]) for (const [x, y] of c.doors[side]) {
            targets.push(["drzwi " + side, x, y]);
            targets.push(["drzwi " + side + " (drugie pole)", side === "N" || side === "S" ? x + 1 : x, side === "N" || side === "S" ? y : y + 1]);
        }
        for (const [x, y] of c.stairs) targets.push(["schody (miejsce przed nimi)", x, y + 1]);
        for (const t of targets) if (blocked.has(t[2] * W + t[1]) || ![1, 2, 4, 8].some(b => pass(t[1], t[2], b))) out.push(t[0] + " " + t[1] + "," + t[2] + " zastawione");
        if (!targets.length) return ["brak drzwi"];
        const bit = d => (1 << (d / 2 - 1)) & 0x0f, rev = { 2: 8, 4: 6, 6: 4, 8: 2 }, step = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
        const seen = new Set([targets[0][2] * W + targets[0][1]]), q = [[targets[0][1], targets[0][2]]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const d of [2, 4, 6, 8]) {
                const nx = x + step[d][0], ny = y + step[d][1], k = ny * W + nx;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || blocked.has(k)) continue;
                if (!pass(x, y, bit(d)) || !pass(nx, ny, bit(rev[d]))) continue;
                seen.add(k); q.push([nx, ny]);
            }
        }
        for (const t of targets) if (!seen.has(t[2] * W + t[1])) out.push(t[0] + " " + t[1] + "," + t[2] + " odcięte od " + targets[0][0]);
        // containers and notes: one of their four sides reachable (one stands beside them to search / read)
        for (const e of c.events) {
            if (!e.tags.Lup && !e.tags.Zapiski) continue;
            const near = [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]].some(([dx, dy]) => seen.has((e.dy + dy) * W + e.dx + dx) && !(dx === 0 && dy === 0 && blocked.has(e.dy * W + e.dx)));
            if (!near) out.push((e.tags.Lup ? "łup " + e.tags.Lup : "zapiski") + " " + e.dx + "," + e.dy + " nie do dojścia");
        }
        return out;
    }

    // ======================================================================================================================
    // Floors and maps (pure: only the data)
    // ======================================================================================================================
    function handmadeOf(floor) {
        const b = bandOf(floor);
        return b && b.handmade && b.handmade[floor] ? b.handmade[floor] : 0;
    }
    function mapOf(floor) {
        const b = bandOf(floor);
        if (!b) return 0;
        if (b.handmade && b.handmade[floor]) return b.handmade[floor];
        return (b.virtual ? D().MAPS.virtualBase : D().MAPS.floorBase) + floor;
    }
    function floorOf(mapId) {
        const d = D();
        if (!d || !(mapId > 0)) return 0;
        for (const b of d.BANDS) {
            for (const f of Object.keys(b.handmade || {})) if (b.handmade[f] === mapId) return Number(f);
            const f = mapId - (b.virtual ? d.MAPS.virtualBase : d.MAPS.floorBase);
            if (f >= b.from && f <= b.to && !(b.handmade && b.handmade[f]) && b.chunkMap) return f;
        }
        return 0;
    }
    const isGenerated = mapId => { const f = floorOf(mapId), b = bandOf(f); return !!f && !!b && !(b.handmade && b.handmade[f]); };
    const isVirtual = mapId => { const f = floorOf(mapId), b = bandOf(f); return isGenerated(mapId) && !!b.virtual; };
    const isUnderground = mapId => !!floorOf(mapId) || (D() && mapId === D().MAPS.ruins);

    const CZESCI = window.Tawerna.api("Underground_parts") || window.Tawerna.register("Underground_parts", {});
    CZESCI.gen = { TK, PLUGIN, T, D, GEN_VERSION, hash, rng, floorShape, wallShape, kindOf, tagsOf, parseLibrary, librarySig,
        bandOf, roomsOf, mazeOf, planMaze, generate, verifyMap, reachable, checkChunk, handmadeOf, mapOf, floorOf, isGenerated,
        isVirtual, isUnderground };
})();
