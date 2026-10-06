//=============================================================================
// Underground.js
//=============================================================================
// Load order: after TawernaCore and Underground_Data (anywhere below them; it only reads other plugins through Tawerna.api/call).
// The generator part (parseLibrary / generate / verify) is pure: tests/unit/underground.test.js runs it in Node.
// docs/PODZIEMIA.md describes the whole system.

/*:
 * @target MZ
 * @plugindesc Podziemia pod tawerną: 100 pięter - piętra składane z kawałków pokoi (stałe ziarno zapisu), co 10. piętro ręcznie, schody, winda, bossowie, łupy, pułapki, zapiski zakonu, Warstwa Prawdy, Komnata Serca i zakończenia. v2.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Underground_Data
 *
 * @command open
 * @text Otwórz zejście
 * @desc Otwiera starą kratę w piwnicy tawerny (przełącznik "Podziemia_Zejscie") - początek Aktu II.
 *
 * @command close
 * @text Zamknij zejście
 * @desc Zamyka kratę z powrotem (do testów).
 *
 * @command go
 * @text Idź na piętro
 * @desc Przenosi bohatera na wskazane piętro (0 = Ruiny Zamku, 1-99 = piętra, 100 = Komnata Serca).
 * @arg floor
 * @text Piętro
 * @type number
 * @min 0
 * @max 100
 * @default 1
 *
 * @command shortcut
 * @text Skrót z pieśni znany
 * @desc Włącza skrót "trzeci schodek pusty" (W3) na schodach w Ruinach Zamku.
 *
 * @help
 * ============================================================================
 * Underground.js - Podziemia (sto pięter pod tawerną)
 * ============================================================================
 * Pod tawerną leży sto pięter dawnej twierdzy, w pasmach:
 *   1-10 Piwnice zamku, 11-30 Kwatery i kaplica zakonu, 31-50 Jaskinie
 *   i podziemna rzeka, 51-75 Ruiny starsze niż zakon, 76-99 Warstwa Prawdy,
 *   100 Komnata Serca (Map011).
 *   - piętra pomiędzy składa gra z gotowych kawałków pokoi narysowanych na
 *     mapach „Podziemia: kawałki (pasmo N)” (Map130, Map141-144), łącząc je
 *     korytarzami; każdy zapis ma swoje ziarno, więc piętro wygląda tak samo
 *     po powrocie. Piętra 1-9 mają własne puste mapy (131-139), piętra 11-99
 *     nie mają plików - wczytują wspólną skorupę (Map145) jako mapa 1000+N;
 *   - co 10. piętro jest zrobione ręcznie (Map140, Map146-153, Map011):
 *     zapiski zakonu, boss (etap 4 walki), przystanek windy;
 *   - wejście: stara krata w piwnicy tawerny (Map009) - zamknięta, dopóki
 *     fabuła nie włączy przełącznika 11 „Podziemia_Zejscie” (Akt II);
 *     za nią Ruiny Zamku (Map010) ze schodami na piętro 1 i windą.
 *
 * PRZEŁĄCZNIKI: 11 zejście otwarte, 12 winda działa, 13 skrót z pieśni (W3),
 * 14 dziesiąta brama otwarta (strażnik przepuścił).
 *
 * KAWAŁKI (jak narysować nowy - docs/PODZIEMIA.md): zdarzenie „Kawałek: nazwa”
 * w lewym górnym rogu z notatką <Kawalek:w=14,h=11>, a w środku zdarzenia
 * z notatkami <Drzwi:N|S|E|W>, <Schody>, <Lup:rodzaj>, <Pochodnia>,
 * <Stwor:rodzaj>, <Pulapka:kolce>, <Zapiski>, <Losowo:50>, <Szept>, <Zjawa>.
 *
 * DLA INNYCH WTYCZEK: Tawerna.api("Underground") = window.Underground:
 *   floorOf(mapId), mapOf(piętro), info(), spawns(), registerCreature(rodzaj,
 *   build), bossDefeated(piętro), isOpen(), open(), deepest(), seed(),
 *   go(piętro), verify(piętro), locks(), truths(), ending().
 * Szyna: undergroundFloor { floor, mapId, spawns, first }, undergroundDeeper
 * { floor }, undergroundLoot, undergroundNote, undergroundTruth, undergroundBoss,
 * undergroundLift, undergroundLock, undergroundEnding.
 * Numery zdarzeń 860-899 są zarezerwowane dla stworów (etap 4 walki).
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "Underground";
    const T = window.Tawerna;
    if (!T) throw new Error("Underground.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const D = () => window.Underground_Data;
    const GEN_VERSION = 1;          // a change of the generator that moves things: old saves' floors are made again (see onLoad)

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
    // (width, height, data, events, note, displayName...) and the floor's facts (spots, rooms, spawns, loot).
    // ======================================================================================================================
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function bandOf(floor) {
        const d = D();
        return d ? d.BANDS.find(b => floor >= b.from && floor <= b.to) || null : null;
    }
    // how many rooms a generated floor has: the band's list (floor `from` first) or { min, max } growing with the depth
    function roomsOf(floor, band) {
        const r = band.rooms;
        if (Array.isArray(r)) return r[floor - band.from] || r[r.length - 1];
        if (r && typeof r === "object") {
            const k = band.to > band.from ? (floor - band.from) / (band.to - band.from) : 0;
            return Math.round(r.min + (r.max - r.min) * k);
        }
        return 6;
    }

    // the plan: which grid cells hold rooms, which chunk each, where, how they connect
    function planFloor(floor, band, chunks, r) {
        const n = Math.max(2, roomsOf(floor, band));
        const [cols, rows] = n <= 4 ? [3, 2] : n <= 6 ? [3, 3] : [4, 3];
        const key = (c, w) => c + "," + w;
        const start = [r.int(0, cols - 1), r.int(0, rows - 1)];
        const cells = new Map([[key(start[0], start[1]), start]]);
        for (let guard = 0; cells.size < Math.min(n, cols * rows) && guard < 5000; guard++) {
            const [c, w] = r.pick([...cells.values()]), [dx, dy] = r.pick(DIRS), nc = c + dx, nw = w + dy;
            if (nc < 0 || nw < 0 || nc >= cols || nw >= rows || cells.has(key(nc, nw))) continue;
            cells.set(key(nc, nw), [nc, nw]);
        }
        const list = [...cells.values()];
        // the corridors: a random spanning tree from the start (depth first), then a few loops
        const edges = [], inTree = new Set([key(start[0], start[1])]), stack = [start], has = new Set();
        const ek = (a, b) => [key(a[0], a[1]), key(b[0], b[1])].sort().join("|");
        while (stack.length) {
            const cur = stack[stack.length - 1];
            const next = r.shuffle(DIRS.slice()).map(([dx, dy]) => [cur[0] + dx, cur[1] + dy])
                .find(p => cells.has(key(p[0], p[1])) && !inTree.has(key(p[0], p[1])));
            if (!next) { stack.pop(); continue; }
            inTree.add(key(next[0], next[1]));
            edges.push([cur, next]); has.add(ek(cur, next));
            stack.push(next);
        }
        let loops = 0;
        for (const a of r.shuffle(list.slice())) {
            for (const [dx, dy] of DIRS) {
                const b = [a[0] + dx, a[1] + dy];
                if (loops >= 2 || !cells.has(key(b[0], b[1])) || has.has(ek(a, b))) continue;
                if (r.chance(0.3)) { edges.push([a, b]); has.add(ek(a, b)); loops++; }
            }
        }
        // the far room (most steps from the start) holds the stairs down
        const adj = new Map(list.map(p => [key(p[0], p[1]), []]));
        for (const [a, b] of edges) { adj.get(key(a[0], a[1])).push(b); adj.get(key(b[0], b[1])).push(a); }
        const dist = new Map([[key(start[0], start[1]), 0]]), q = [start];
        while (q.length) {
            const p = q.shift();
            for (const nb of adj.get(key(p[0], p[1]))) if (!dist.has(key(nb[0], nb[1]))) { dist.set(key(nb[0], nb[1]), dist.get(key(p[0], p[1])) + 1); q.push(nb); }
        }
        let end = list[0], best = -1;
        for (const p of list) { const d = dist.get(key(p[0], p[1])); if (d > best || (d === best && r.chance(0.5))) { best = d; end = p; } }
        // the chunks: by weight, each at most once while there are others; the stairs' rooms need a chunk with a stairs place
        const pool = chunks.filter(c => floor >= c.floors[0] && floor <= c.floors[1] && ["N", "S", "E", "W"].every(s => c.doors[s].length));
        if (!pool.length) throw new Error("Underground: no usable chunk for floor " + floor);
        const used = new Map();
        const choose = needStairs => {
            let cand = pool.filter(c => !needStairs || c.stairs.length >= 1);
            if (!cand.length) cand = pool;
            const fresh = cand.filter(c => !used.has(c.name));
            const c = r.weighted(fresh.length ? fresh : cand, o => o.weight / (1 + (used.get(o.name) || 0) * 3));
            used.set(c.name, (used.get(c.name) || 0) + 1);
            return c;
        };
        const rooms = list.map(p => ({ col: p[0], row: p[1], key: key(p[0], p[1]), start: p === start, end: p === end }));
        for (const rm of rooms.filter(o => o.start || o.end)) rm.chunk = choose(true);
        for (const rm of rooms.filter(o => !o.chunk)) rm.chunk = choose(false);
        // the positions: columns as wide as their widest room, rows as tall as their tallest, random gaps and offsets
        const M = 2, colW = [], rowH = [], gx = [], gy = [];
        for (let c = 0; c < cols; c++) colW[c] = Math.max(6, ...rooms.filter(o => o.col === c).map(o => o.chunk.w));
        for (let w = 0; w < rows; w++) rowH[w] = Math.max(6, ...rooms.filter(o => o.row === w).map(o => o.chunk.h));
        for (let c = 0; c < cols - 1; c++) gx[c] = r.int(5, 8);
        for (let w = 0; w < rows - 1; w++) gy[w] = r.int(7, 9);
        const colX = [M], rowY = [M];
        for (let c = 1; c < cols; c++) colX[c] = colX[c - 1] + colW[c - 1] + gx[c - 1];
        for (let w = 1; w < rows; w++) rowY[w] = rowY[w - 1] + rowH[w - 1] + gy[w - 1];
        for (const rm of rooms) {
            rm.x = colX[rm.col] + r.int(0, colW[rm.col] - rm.chunk.w);
            rm.y = rowY[rm.row] + r.int(0, rowH[rm.row] - rm.chunk.h);
        }
        const W = colX[cols - 1] + colW[cols - 1] + M, H = rowY[rows - 1] + rowH[rows - 1] + M;
        const byKey = new Map(rooms.map(o => [o.key, o]));
        return { W, H, rooms, edges: edges.map(([a, b]) => [byKey.get(key(a[0], a[1])), byKey.get(key(b[0], b[1]))]), cols, rows };
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

    function generate(floor, seed, chunks, opts) {
        const o = opts || {}, d = D(), band = bandOf(floor);
        if (!band || !chunks || !chunks.length) return null;
        const r = rng(hash(seed >>> 0, "floor", floor, band.id));
        const plan = planFloor(floor, band, chunks, r);
        const W = plan.W, H = plan.H, N = W * H;
        const data = new Array(N * 6).fill(0);
        const at = (z, x, y) => (z * H + y) * W + x;
        const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
        const rock = band.rock, cor = band.corridor;
        for (let i = 0; i < N; i++) data[i] = autoId(rock, 0);
        const dirty = new Uint8Array(N);
        const markDirty = (x, y, ring) => {
            for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) if (inside(x + dx, y + dy)) dirty[(y + dy) * W + x + dx] = 1;
        };
        // ---- the rooms: every layer of the chunk copied; its border (and the rock round it) shaped again later
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
        // ---- the corridors: a 2x2 brush along an L / Z path from door to door; only rock is cut, room floor stays
        const carved = new Set(), corridorCells = [];
        const carve = (x, y) => {
            for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
                const cx = x + dx, cy = y + dy;
                if (!inside(cx, cy) || cx < 1 || cy < 1 || cx >= W - 1 || cy >= H - 1) continue;
                if (!isWall(cx, cy)) continue;
                data[at(0, cx, cy)] = autoId(cor.floor, 0);
                for (let z = 1; z < 6; z++) if (z !== 4) data[at(z, cx, cy)] = 0;
                data[at(4, cx, cy)] = 0;
                const k = cy * W + cx;
                if (!carved.has(k)) { carved.add(k); corridorCells.push([cx, cy]); }
                markDirty(cx, cy, 2);
            }
        };
        const line = (x0, y0, x1, y1) => {
            const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
            let x = x0, y = y0;
            carve(x, y);
            while (x !== x1 || y !== y1) { if (x !== x1) x += sx; else y += sy; carve(x, y); }
        };
        const links = [];
        for (const [a0, b0] of plan.edges) {
            let a = a0, b = b0;
            if (a.row === b.row) {
                if (a.col > b.col) [a, b] = [b, a];
                const da = r.pick(a.chunk.doors.E), db = r.pick(b.chunk.doors.W);
                const ax = a.x + da[0], ay = a.y + da[1], bx = b.x + db[0], by = b.y + db[1];
                const lo = a.x + a.chunk.w, hi = Math.max(lo, b.x - 2), m = r.int(lo, hi);
                line(ax + 1, ay, m, ay); line(m, ay, m, by); line(m, by, bx - 1, by);
                links.push({ a: a.key, b: b.key, from: [ax, ay], to: [bx, by] });
            } else {
                if (a.row > b.row) [a, b] = [b, a];
                const da = r.pick(a.chunk.doors.S), db = r.pick(b.chunk.doors.N);
                const ax = a.x + da[0], ay = a.y + da[1], bx = b.x + db[0], by = b.y + db[1];
                const lo = a.y + a.chunk.h + 2, hi = Math.max(lo, b.y - 2), m = r.int(lo, hi);
                line(ax, ay + 1, ax, m); line(ax, m, bx, m); line(bx, m, bx, by - 1);
                links.push({ a: a.key, b: b.key, from: [ax, ay], to: [bx, by] });
            }
        }
        // ---- the corridors' north walls: a face two rows tall over every corridor cell that has rock above it
        const faceLow = [];
        for (const [x, y] of corridorCells) {
            if (!isTop(x, y - 1)) continue;
            data[at(0, x, y - 1)] = autoId(cor.side, 0);
            faceLow.push([x, y - 1]);
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
                const top = isA4Top(k);
                const same = (dx, dy) => {
                    const nx = x + dx, ny = y + dy;
                    if (!inside(nx, ny)) return true;
                    const nk = kindOf(data[at(z, nx, ny)]);
                    return top ? isA4Top(nk) : nk === k;
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
        // the stairs: up in the start room, down in the far room, each on one of the chunk's stairs places (a lower wall face
        // row; one lands on the floor cell below it, facing down)
        const pickStairs = (rm, avoid) => {
            const list = rm.chunk.stairs.filter(s => !avoid || s[0] !== avoid[0] || s[1] !== avoid[1]);
            const s = r.pick(list.length ? list : rm.chunk.stairs);
            return s ? [rm.x + s[0], rm.y + s[1]] : null;
        };
        const startRoom = plan.rooms.find(o => o.start), endRoom = plan.rooms.find(o => o.end);
        const up = pickStairs(startRoom);
        const down = pickStairs(endRoom, startRoom === endRoom && up ? [up[0] - endRoom.x, up[1] - endRoom.y] : null);
        if (up) {
            evd(d.TEXT.stairsUp, up[0], up[1], "", [page({ image: art(d.ART.stairsUp), priority: 1, trigger: 1,
                list: [seCmd("Move1", 80, 95), scriptCmd("Underground.stairs(\"up\")")] })]);
            spots.up = [up[0], up[1] + 1, 2];
        }
        if (down) {
            evd(d.TEXT.stairsDown, down[0], down[1], "", [page({ image: art(d.ART.stairsDown), priority: 1, trigger: 1,
                list: [seCmd("Move1", 80, 85), scriptCmd("Underground.stairs(\"down\")")] })]);
            spots.down = [down[0], down[1] + 1, 2];
        }
        // the chunks' own events (their tags read here)
        const noteRooms = [];
        for (const rm of plan.rooms) {
            for (const ce of rm.chunk.events) {
                const x = rm.x + ce.dx, y = rm.y + ce.dy, t = ce.tags;
                if (carved.has(y * W + x)) continue;   // (a corridor came through here)
                if (t.Losowo !== undefined && !r.chance((Number(t.Losowo) || 50) / 100)) continue;
                const src = ce.data;
                if (t.Stwor !== undefined) {
                    const kind = String(t.Stwor === true ? "dowolny" : t.Stwor).trim();
                    spawns.push({ x, y, kind, floor, room: rm.key });
                    evd("Miejsce: stwór", x, y, "<Stwor:" + kind + ">", [page({ through: true })]);
                    continue;
                }
                if (t.Szept) {   // (the Truth Layer: a voice from the dark comes from here)
                    const e = evd("Szept", x, y, "<Szept>", [page({ through: true })]);
                    whispers.push({ id: e.id, x, y });
                    continue;
                }
                if (t.Zjawa) {   // (the Truth Layer: someone is seen here for a moment)
                    const e = evd("Zjawa", x, y, "<Zjawa>", [page({ through: true, priority: 1 })]);
                    visions.push({ id: e.id, x, y });
                    continue;
                }
                if (t.Zapiski) { noteRooms.push({ rm, x, y, src }); continue; }
                if (t.Pochodnia) {
                    const lit = r.chance(band.roomTorchLit);
                    evd(lit ? "Pochodnia" : "Wypalona pochodnia", x, y, lit ? torchLight : "",
                        [page({ image: torchArt(lit), through: true, step: lit, list: [] })]);
                    continue;
                }
                if (t.Pulapka) {
                    if (!r.chance(band.trapOn)) continue;
                    const e = evd("Pułapka: kolce", x, y, "<Pulapka:kolce>", [page({ image: art(d.ART.spikes), through: true })]);
                    e.pages[0].image.direction = d.SPIKE_STEPS[0];
                    traps.push({ id: e.id, x, y, phase: r.int(0, d.SPIKES.period - 1) });
                    continue;
                }
                if (t.Lup) {
                    const kind = String(t.Lup).trim(), table = d.LOOT[kind];
                    if (!table) continue;
                    const full = r.chance(table.full !== undefined ? table.full : band.lootFull);
                    const got = [];
                    if (full) for (let i = 0; i < (table.picks || 1); i++) {
                        const pick = r.weighted(table.list, q => q.w || 1);
                        if (pick.gold) got.push({ gold: Math.round((r.int(pick.gold[0], pick.gold[1]) + Math.floor(floor / 3)) * (band.gold || 1)) });
                        else got.push({ item: pick.item, n: r.int(pick.n[0], pick.n[1]) });
                    }
                    const pages = src.pages.map(p => JSON.parse(JSON.stringify(p)));
                    // page 1 as drawn (closed), page 2 (self switch A: searched) the "open" picture if the type has one - or nothing at
                    // all for a thing that is taken away (mushrooms)
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
                    const e = evd(src.name || d.LOOT_NAMES[kind], x, y, "<Lup:" + kind + ">", [pages[0], second]);
                    loot[e.id] = { kind, got };
                    continue;
                }
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
            const e = evd("Zapiski: " + note.title, n.x, n.y, "<Zapiski:" + floor + ">", [pages[0]]);
            notes.push({ id: e.id, floor, x: n.x, y: n.y });
        }
        // the corridors' torches: on the lower row of their north walls, spaced out
        const placed = [];
        const minGap = band.torchEvery[0];
        for (const [x, y] of r.shuffle(faceLow.slice())) {
            if (placed.some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) < minGap)) continue;
            if (!inside(x, y + 1) || isWall(x, y + 1)) continue;
            if (events.some(e => e && e.x === x && e.y === y)) continue;
            placed.push([x, y]);
            const lit = r.chance(band.torchLit);
            evd(lit ? "Pochodnia" : "Wypalona pochodnia", x, y, lit ? torchLight : "",
                [page({ image: torchArt(lit), through: true, step: lit, list: [] })]);
            if (placed.length >= Math.ceil(corridorCells.length / (band.torchEvery[1] * 2))) break;
        }
        // ---- the map object (like $dataMap); a river's sound when a room has water (band 3), the band's own sound otherwise
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
            links, corridorCells: corridorCells.length, level };
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

    // ======================================================================================================================
    // In the game
    // ======================================================================================================================
    const inGame = typeof DataManager !== "undefined" && typeof Scene_Map !== "undefined" && typeof window.$plugins !== "undefined";
    const libs = {};            // chunk map id -> parsed chunks
    const cache = new Map();    // "seed:floor" -> { map, info }
    const creatures = {};       // kind -> build(spawn, ctx) -> event data
    const DATA_NAME = id => "$dataUndergroundChunks" + id;

    const store = T.state.define("underground", () => ({ seed: 0, deepest: 0, visited: {}, notes: {}, lib: {}, gold: 0, found: 0,
        lifts: {}, bosses: {}, locks: {}, forceLocks: {}, truths: {}, ending: null }), { version: 1, owner: PLUGIN });
    const state = () => {
        const s = store();
        // (saves from band 1's days: the newer parts)
        if (!s.lifts) s.lifts = {};
        if (!s.bosses) s.bosses = {};
        if (!s.locks) s.locks = {};
        if (!s.forceLocks) s.forceLocks = {};
        if (!s.truths) s.truths = {};
        if (s.ending === undefined) s.ending = null;
        return s;
    };
    function seedOf() {
        const s = state();
        if (!s.seed) s.seed = ((Math.random() * 0xFFFFFFFF) >>> 0) || 1;
        return s.seed >>> 0;
    }
    function library(band) {
        if (!band || !band.chunkMap) return null;
        if (!libs[band.chunkMap]) {
            const raw = window[DATA_NAME(band.chunkMap)];
            if (!raw) return null;
            libs[band.chunkMap] = parseLibrary(raw);
        }
        return libs[band.chunkMap];
    }
    function flags(band) {
        const b = band || bandOf(1);
        const ts = window.$dataTilesets && $dataTilesets[(b || {}).tileset || 10];
        return ts ? ts.flags : null;
    }
    function floorData(floor) {
        const band = bandOf(floor), chunks = library(band);
        if (!chunks || handmadeOf(floor)) return null;
        const seed = seedOf(), k = seed + ":" + floor;
        if (!cache.has(k)) cache.set(k, generate(floor, seed, chunks, { flags: flags(band) }));
        return cache.get(k);
    }

    if (inGame) {
        // the chunk maps load with the database (the boot waits for them)
        const _loadDatabase = DataManager.loadDatabase;
        DataManager.loadDatabase = function() {
            const d = D();
            for (const b of (d ? d.BANDS : [])) {
                if (!b.chunkMap) continue;
                if (!this._databaseFiles.some(f => f.name === DATA_NAME(b.chunkMap))) {
                    this._databaseFiles.push({ name: DATA_NAME(b.chunkMap), src: "Map" + String(b.chunkMap).padStart(3, "0") + ".json" });
                }
            }
            _loadDatabase.apply(this, arguments);
        };
        // floors 11-99 have no file of their own: map 1000+N loads the shared shell (the core still sees the map id 1000+N)
        const _loadDataFile = DataManager.loadDataFile;
        DataManager.loadDataFile = function(name, src) {
            if (name === "$dataMap" && D()) {
                const m = /^Map(\d+)\.json$/.exec(String(src));
                if (m && isVirtual(Number(m[1]))) src = "Map" + String(D().MAPS.shell).padStart(3, "0") + ".json";
            }
            return _loadDataFile.call(this, name, src);
        };
        // ...and a name in the map list for them (only in memory - the editor never sees these ids)
        const _onLoad = DataManager.onLoad;
        DataManager.onLoad = function(object) {
            _onLoad.call(this, object);
            if (object && object === window.$dataMapInfos && D()) {
                const d = D();
                for (const b of d.BANDS) {
                    if (!b.virtual) continue;
                    for (let f = b.from; f <= b.to; f++) {
                        const id = mapOf(f);
                        if (handmadeOf(f) || object[id]) continue;
                        object[id] = { id, expanded: false, name: d.TEXT.floorName(f), order: 10000 + f, parentId: d.MAPS.ruins, scrollX: 0, scrollY: 0 };
                    }
                }
            }
        };
        // a generated floor's map file is an empty shell: its data is made here as it loads (events the core put in stay);
        // on every underground map the creature makers fill their spawn places (ids 860-899)
        T.onMapData((data, mapId) => {
            if (!D()) return;
            if (isGenerated(mapId)) {
                const f = floorOf(mapId), got = floorData(f);
                if (!got) return;
                const m = got.map, keep = data.events || [];
                for (const k of Object.keys(m)) if (k !== "events") data[k] = Array.isArray(m[k]) ? m[k].slice() : m[k];
                const events = m.events.map(e => (e ? JSON.parse(JSON.stringify(e)) : null));
                for (let i = 1; i < keep.length; i++) if (keep[i] && i >= events.length) { while (events.length < i) events.push(null); events[i] = keep[i]; }
                addCreatures(events, got.info.spawns, f, mapId);
                data.events = events;
            } else if (isUnderground(mapId)) {
                // a hand-made map: its <Stwor:...> places (the markers "Stwór: ...") get the registered creatures too
                const f = floorOf(mapId), events = data.events || [];
                const spawns = events.filter(e => e && /^Stwór/.test(e.name || "") && /<Stwor:/.test(e.note || ""))
                    .map(e => ({ x: e.x, y: e.y, kind: String(tagsOf(e.note).Stwor || "dowolny").trim(), floor: f, room: "" }));
                addCreatures(events, spawns, f, mapId);
                if (mapId === D().MAPS.heart) heartData(events);
                data.events = events;
            } else return;
            if (DataManager.extractMetadata) {
                DataManager.extractMetadata(data);
                for (const e of data.events) if (e && typeof e.note === "string") DataManager.extractMetadata(e);
            }
        }, { owner: PLUGIN });
        T.inject.reserve(PLUGIN, D() ? D().IDS.creatures[0] : 860, D() ? D().IDS.creatures[1] : 899, "stwory podziemi (piętra 1-100)");
    }
    // the creatures (stage 4): one event per spawn place whose kind has a maker, ids 860-899
    function addCreatures(events, spawns, f, mapId) {
        const [from, to] = D().IDS.creatures;
        let next = from;
        while (next <= to && events[next]) next++;
        for (const sp of spawns) {
            const make = creatures[sp.kind] || (sp.kind === "dowolny" ? creatures["*"] : null);
            if (!make || next > to) continue;
            let ev = null;
            try { ev = make(Object.assign({}, sp), { floor: f, mapId, seed: seedOf(), rng: rng(hash(seedOf(), "spawn", f, sp.x, sp.y)) }); }
            catch (e) { console.error("[Underground] creature " + sp.kind, e); }
            if (!ev) continue;
            ev.id = next++; ev.x = ev.x === undefined ? sp.x : ev.x; ev.y = ev.y === undefined ? sp.y : ev.y;
            while (events.length < ev.id) events.push(null);
            events[ev.id] = ev;
        }
    }

    // ---- the save: a floor saved under another library or generator is made again (the hero goes to its stairs up)
    function sigNow(band) {
        const chunks = library(band);
        return chunks ? librarySig(chunks) : 0;
    }
    if (inGame) {
        T.on("load", () => {
            const s = state(), d = D();
            if (!d) return;
            if ($gameSwitches.value(d.SWITCHES.lift) && !Object.keys(s.lifts).length) s.lifts[10] = true;   // (a save from band 1's days)
            for (const b of d.BANDS) {
                const sig = sigNow(b);
                if (!sig) continue;
                const had = s.lib[b.id];
                s.lib[b.id] = sig;
                if (had === undefined || had === sig) continue;
                // the floors of this band changed: their searched containers and the hero's place there are forgotten
                for (let f = b.from; f <= b.to; f++) {
                    if (!isGenerated(mapOf(f))) continue;
                    const mid = mapOf(f);
                    for (const k of Object.keys($gameSelfSwitches._data)) if (k.split(",")[0] === String(mid)) delete $gameSelfSwitches._data[k];
                }
                if (isGenerated($gameMap.mapId()) && bandOf(floorOf($gameMap.mapId())) === b) {
                    const f = floorOf($gameMap.mapId());
                    cache.clear();
                    const got = floorData(f), sp = got && got.info.spots.up;
                    if (sp) { $gamePlayer.reserveTransfer($gameMap.mapId(), sp[0], sp[1], sp[2], 0); $gamePlayer.requestMapReload(); }
                }
            }
        }, { owner: PLUGIN });
        T.on("newGame", () => {
            const s = state(), d = D();
            for (const b of (d ? d.BANDS : [])) { const sig = sigNow(b); if (sig) s.lib[b.id] = sig; }
            cache.clear();
        }, { owner: PLUGIN });
    }

    // ---- back on a floor without a transfer (a menu closed, a save loaded): the map's events follow its data again - a creature
    // maker registered or dropped since (on any underground map), a library changed: the missing events come, the orphaned ones go
    if (inGame) {
        const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
        Scene_Map.prototype.onMapLoaded = function() {
            if (!this._transfer && window.$gameMap && window.$dataMap && D() && isUnderground($gameMap.mapId())) {
                const evs = $gameMap._events, data = $dataMap.events || [];
                for (let id = 1; id < Math.max(evs.length, data.length); id++) {
                    if (!data[id] && evs[id]) delete evs[id];
                    else if (data[id] && !evs[id]) evs[id] = new Game_Event($gameMap.mapId(), id);
                }
            }
            _Scene_Map_onMapLoaded.call(this);
            // a save from before the cellar was rebuilt (Map009 was one big floor then): a hero standing in what is now wall goes to
            // the foot of the stairs from the tavern (the same for the other hand-made maps)
            if (!this._transfer && window.$gameMap && D()) {
                const d = D(), id = $gameMap.mapId(), x = $gamePlayer.x, y = $gamePlayer.y;
                const f = floorOf(id), hm = !isGenerated(id) && d.FLOORS[f];
                const spot = { [d.MAPS.cellar]: [10, 8], [d.MAPS.ruins]: d.SPOTS.ruinsFromCellar }[id] || (hm ? hm.up : null);
                if (spot && ![2, 4, 6, 8].some(dir => $gameMap.isPassable(x, y, dir))) $gamePlayer.locate(spot[0], spot[1]);
            }
        };
    }

    // ---- arriving on a floor: the notice "Piętro N", the deepest floor, the first-visit line, the bus
    function infoOf(mapId) {
        const id = mapId === undefined ? $gameMap.mapId() : mapId, f = floorOf(id);
        if (!f) return null;
        if (isGenerated(id)) { const got = floorData(f); return got ? got.info : null; }
        const b = bandOf(f) || {};
        return { floor: f, band: b.id, bandName: b.name, handmade: true, spawns: spawnsOfMap(), spots: Object.assign({}, D().FLOORS[f] || {}),
            loot: {}, traps: [], notes: [], whispers: tagged("Szept"), visions: tagged("Zjawa") };
    }
    // the events of this map with a tag in the note (the ids kept per map: the Truth Layer asks every frame)
    const taggedCache = { mapId: -1, n: -1, lists: {} };
    function tagged(tag) {
        if (!window.$gameMap || !$gameMap.events) return [];
        if (taggedCache.mapId !== $gameMap.mapId() || taggedCache.n !== $gameMap._events.length) {
            taggedCache.mapId = $gameMap.mapId(); taggedCache.n = $gameMap._events.length; taggedCache.lists = {};
        }
        if (!taggedCache.lists[tag]) {
            const re = new RegExp("<" + tag + "[>:]");
            taggedCache.lists[tag] = $gameMap.events().filter(e => e.event() && re.test(e.event().note || "")).map(e => e.eventId());
        }
        return taggedCache.lists[tag].map(id => $gameMap.event(id)).filter(Boolean).map(e => ({ id: e.eventId(), x: e.x, y: e.y }));
    }
    function spawnsOfMap() {
        if (!window.$gameMap || !$gameMap.events) return [];
        return $gameMap.events().filter(e => e.event() && /<Stwor/.test(e.event().note || "") && !(e.eventId() >= D().IDS.creatures[0] && e.eventId() <= D().IDS.creatures[1]))
            .map(e => ({ x: e.x, y: e.y, kind: String((e.event().meta || {}).Stwor || "dowolny").trim(), floor: floorOf($gameMap.mapId()) }));
    }
    if (inGame) {
        T.on("mapReady", e => {
            const mapId = e.mapId, f = floorOf(mapId), d = D();
            truth.reset(mapId);
            if (!f || !d) return;
            if (mapId === d.MAPS.heart) syncDoor();
            const s = state(), band = bandOf(f), first = !s.visited[f];
            s.visited[f] = (s.visited[f] || 0) + 1;
            const deeper = f > (s.deepest || 0);
            if (deeper) s.deepest = f;
            if (e.transfer) {
                const hm = d.FLOORS[f] && !isGenerated(mapId) ? d.FLOORS[f].name : "";
                T.popup(d.TEXT.notice(f) + (hm ? " - " + hm : ""), { top: true, sub: d.TEXT.noticeSub(band.name, s.deepest) });
                if (first && d.TEXT.firstVisit[f]) T.call("SpeechBubbles", "say", $gamePlayer, d.TEXT.firstVisit[f], 260);
            }
            if (deeper) T.emit("undergroundDeeper", { floor: f });
            const info = infoOf(mapId);
            T.emit("undergroundFloor", { floor: f, mapId, spawns: info ? info.spawns : [], first });
        }, { owner: PLUGIN });
    }

    // ---- the stairs, the gate, the lift
    function landing(floor, side) {
        const d = D();
        if (floor <= 0) return [d.MAPS.ruins].concat(d.SPOTS.ruinsStairs);
        const mid = mapOf(floor);
        if (!mid) return null;
        if (!isGenerated(mid)) {
            const hm = d.FLOORS[floor] || {}, sp = (side === "down" ? hm.down : hm.up) || hm.up;
            return sp ? [mid].concat(sp) : null;
        }
        const got = floorData(floor), sp = got && got.info.spots[side];
        return sp ? [mid].concat(sp) : null;
    }
    function travel(to, se) {
        if (!to) return false;
        if (se) AudioManager.playSe({ name: se, volume: 80, pitch: 90, pan: 0 });
        $gamePlayer.reserveTransfer(to[0], to[1], to[2], to[3] || 2, 0);
        if (to[0] === $gameMap.mapId()) $gamePlayer.requestMapReload();   // (the same floor again - F9, a new seed: its events made anew)
        return true;
    }
    function stairs(dir) {
        const d = D(), mapId = $gameMap.mapId();
        if (mapId === d.MAPS.ruins) return dir === "down" ? travel(landing(1, "up")) : false;
        const f = floorOf(mapId);
        if (!f) return false;
        const nf = dir === "down" ? f + 1 : f - 1;
        if (nf > 0 && !bandOf(nf)) { popupHere(d.TEXT.noFloor); return false; }
        if (dir === "down" && !bossCleared(f)) {
            const b = d.BOSSES[f];
            popupHere(d.TEXT.bossBlocks(b ? b.name : "strażnik piętra"));
            return false;
        }
        return travel(landing(nf, dir === "down" ? "up" : "down"));
    }
    function say(key, extra) {
        const d = D(), text = typeof key === "string" && d.TEXT[key] !== undefined ? d.TEXT[key] : key;
        if (!text) return;
        $gameMessage.add(String(typeof text === "function" ? text(extra) : text));
    }
    function popupHere(text, icon) {
        T.popup(text, { icon: icon || 0, kind: "need" });
    }
    function go(floor) {
        const f = Math.max(0, Math.floor(Number(floor) || 0));
        if (f > 0 && !bandOf(f)) return false;
        return travel(landing(f, "up"));
    }
    const sw = (name, v) => {
        const id = D().SWITCHES[name];
        if (v === undefined) return !!$gameSwitches.value(id);
        $gameSwitches.setValue(id, !!v);
        return !!v;
    };

    // ---- the lift: a cage on every hand-made floor 10-90 and in Ruiny Zamku; a stop works once its windlass was turned
    function liftStops() {
        const s = state(), d = D();
        return d.LIFT.stops.filter(f => s.lifts[f] || (f === 10 && sw("lift") && !Object.keys(s.lifts).length));
    }
    function liftOn(floor) {
        const f = Number(floor) || 10, d = D(), s = state(), first = !s.lifts[f];
        s.lifts[f] = true;
        sw("lift", true);
        // (the windlass of this stop shows its lever down: its self switch A)
        if (window.$gameMap && floorOf($gameMap.mapId()) === f) {
            for (const ev of $gameMap.events()) if (ev.event() && ev.event().name === "Kołowrót windy") $gameSelfSwitches.setValue([$gameMap.mapId(), ev.eventId(), "A"], true);
        }
        T.popup(d.TEXT.liftOn(f), { top: true, sub: d.TEXT.liftSub });
        if (first) T.call("Combat", "discover", f === 10 ? "ug_lift" : "ug_lift_" + f, "winda kasztelana (piętro " + f + ")", 40);
        T.emit("undergroundLift", { on: true, floor: f });
        return true;
    }
    // the choices of the cage (from an event's script: Underground.liftMenu(this)); where one is now is left out
    function liftMenu(interp) {
        const d = D(), here = floorOf($gameMap.mapId());
        const dest = [];
        if ($gameMap.mapId() !== d.MAPS.ruins) dest.push({ label: d.TEXT.liftRuins, to: [d.MAPS.ruins].concat(d.SPOTS.ruinsLift) });
        for (const f of liftStops()) if (f !== here) {
            const hm = d.FLOORS[f];
            if (hm && hm.lift) dest.push({ label: d.TEXT.liftStop(f), to: [hm.map].concat(hm.lift) });
        }
        const names = dest.map(o => o.label).concat([d.TEXT.liftStay]);
        $gameMessage.add("\\SPK[0]" + d.TEXT.liftAsk);
        $gameMessage.setChoices(names, 0, names.length - 1);
        $gameMessage.setChoiceCallback(n => {
            const o = dest[n];
            if (!o) return;
            travel(o.to, "Chain");
            T.emit("undergroundLift", { ride: true, to: o.to[0] });
        });
        if (interp && interp.setWaitMode) interp.setWaitMode("message");
        return dest.length;
    }

    // the windlass of a stop (its event: Underground.windlass(this)) - turned once, the stop works for good
    function windlass(interp) {
        const d = D(), t = d.TEXT, f = floorOf($gameMap.mapId());
        if (liftStops().includes(f)) return runChild(interp, C.text(t.windlassOn, 0));
        const turn = C.se("Chain", 90, 90).concat([{ code: 225, indent: 0, parameters: [3, 5, 40, false] }], C.wait(40), C.se("Machine", 70, 70),
            C.text(t.windlassTurned, 0), C.script("Underground.liftOn(" + f + ")"));
        return runChild(interp, C.text(t.windlassLook, 0).concat(C.choice(t.windlassAsk, [t.windlassYes, t.windlassNo], [turn, []])));
    }
    // the cage of a stop or the shaft in Ruiny Zamku (Underground.cage(this)): the menu of the stops once this one works
    function cage(interp) {
        const d = D(), t = d.TEXT, ruins = $gameMap.mapId() === d.MAPS.ruins, f = floorOf($gameMap.mapId());
        const works = ruins ? liftStops().length > 0 : liftStops().includes(f);
        if (!works) return runChild(interp, C.text(ruins ? t.shaftEmpty : t.cageStuck, 0));
        return liftMenu(interp);
    }

    // ---- the bosses of the hand-made floors (stage 4): while a maker for "boss_NN" is registered, its stairs down wait for it
    function bossCleared(floor) {
        const d = D(), hm = d.FLOORS[floor];
        if (!hm || !hm.boss || isGenerated(mapOf(floor))) return true;
        return !creatures[hm.boss] || !!state().bosses[floor];
    }
    function bossDefeated(floor, v) {
        const f = Number(floor) || floorOf($gameMap.mapId()), d = D();
        if (!d.FLOORS[f] || !d.FLOORS[f].boss) return false;
        state().bosses[f] = v === undefined ? true : !!v;
        if (state().bosses[f]) {
            const b = d.BOSSES[f];
            if (b) T.popup(d.TEXT.bossDone(b.name), { top: true });
            T.emit("undergroundBoss", { floor: f, kind: d.FLOORS[f].boss });
        }
        return state().bosses[f];
    }

    // ---- searching a container: what the generator put in it (once; self switch A then shows it open)
    function search(eventId) {
        const d = D(), mapId = $gameMap.mapId(), info = infoOf(mapId), ev = $gameMap.event(eventId);
        const e = info && info.loot && info.loot[eventId];
        if (!e || !ev) return false;
        const key = [mapId, eventId, "A"];
        if ($gameSelfSwitches.value(key)) { if (d.TEXT.empty[e.kind]) $gameMessage.add(d.TEXT.empty[e.kind]); return false; }
        $gameSelfSwitches.setValue(key, true);
        if (!e.got.length) { if (d.TEXT.nothing[e.kind]) $gameMessage.add(d.TEXT.nothing[e.kind]); return false; }
        AudioManager.playSe({ name: e.kind === "skrzynia" || e.kind === "skrzynka" || e.kind === "relikwiarz" ? "Chest1" : "Item1", volume: 80, pitch: 100, pan: 0 });
        const s = state();
        for (const g of e.got) {
            if (g.gold) {
                $gameParty.gainGold(g.gold);
                s.gold += g.gold;
                T.popup(d.TEXT.gold(g.gold), { icon: d.GOLD_ICON, gain: true });
                T.emit("undergroundLoot", { kind: e.kind, gold: g.gold, floor: floorOf(mapId) });
            } else if (window.$dataItems && $dataItems[g.item]) {
                $gameParty.gainItem($dataItems[g.item], g.n);
                T.popup($dataItems[g.item].name + (g.n > 1 ? " ×" + g.n : ""), { icon: $dataItems[g.item].iconIndex, gain: true });
                T.emit("undergroundLoot", { kind: e.kind, item: g.item, n: g.n, floor: floorOf(mapId) });
            }
        }
        s.found++;
        return true;
    }
    // ---- an order's note: its text in the message window, kept in the journal the first time; a truth of the Truth Layer is
    // kept as a truth too (W9 ch. 6: the town's quests may let the hero tell it or keep it)
    // key: the floor (1-99) or a hand-made note ("10a"...)
    function read(key) {
        const d = D(), n = d.NOTES[key];
        if (!n) return false;
        const s = state(), floor = parseInt(key, 10) || floorOf($gameMap.mapId());
        $gameMessage.add("\\C[6]" + n.title + "\\C[0] (" + n.where + ")");
        for (const part of n.text.split("\n")) $gameMessage.add(part);
        if (!s.notes[key]) {
            s.notes[key] = true;
            const truthOf = n.who && n.who !== "straznik";
            T.call("Journal", "addNote", (truthOf ? "Warstwa Prawdy: " : "Zapiski zakonu: ") + n.title, n.text + "\n(Podziemia, piętro " + floor + ")");
            T.call("Combat", "discover", "ug_note_" + key, (truthOf ? "prawda (" : "zapiski zakonu (") + n.title + ")", truthOf ? 40 : 20);
            T.emit("undergroundNote", { key: String(key), floor, title: n.title });
            if (n.who) {
                s.truths[key] = { who: n.who, floor };
                T.emit("undergroundTruth", { key: String(key), who: n.who, name: d.TRUTH_WHO[n.who] || n.who, floor, text: n.text });
            }
        }
        return true;
    }

    // ---- floor 10: the guardian of the tenth gate (Map140's events call these)
    // stage 4 of the fighting can take the guardian over: Underground.onGuardian(fn(eventId) -> true when it handles him)
    let guardianHook = null;
    function guardianHandled(eventId) {
        if (typeof guardianHook !== "function") return false;
        try { return !!guardianHook(eventId); } catch (e) { console.error("[Underground] guardian hook", e); return false; }
    }
    // the armour's pose: sleep (asleep), wake (the eye slit glowing), strike (the sword up), spent (the fire out - he let one by)
    function guardianPose(eventId, pose) {
        const ev = $gameMap.event(eventId);
        if (!ev) return false;
        const f = { sleep: [2, 0], wake: [2, 2], strike: [4, 0], spent: [6, 0] }[pose] || [2, 0];
        ev._directionFix = false;
        ev.setDirection(f[0]);
        ev._directionFix = true;
        ev.setPattern(f[1]);
        ev._originalPattern = f[1];
        return true;
    }
    // the blow of the armour's sword: from the guardian toward the hero (a roll dodges it, the shield takes some - Combat's rules)
    function guardianStrike(damage) {
        const g = $gameMap.events().find(e => e.event() && /<Stwor:zbroja_straznik>/.test(e.event().note || ""));
        return hurt(damage, { poise: damage >= 12 ? 40 : 10, knock: damage >= 12 ? 1.2 : 0.8, name: "pusta zbroja",
            from: g ? { x: g.x, y: g.y } : null });
    }
    // stepping on the line in front of the gate: the guardian's own talk starts (once at a time; not after he let one by)
    function wake(eventId) {
        const ev = $gameMap.event(eventId);
        if (!ev || sw("gate10") || ev.isStarting()) return false;
        ev.start();
        return true;
    }
    function gate10Opened() {
        T.call("Combat", "discover", "ug_gate10", "dziesiąta brama", 80);
        T.emit("undergroundGate", { floor: 10 });
        return true;
    }
    // ---- a blow from the guardian armour or a trap: Combat's hit when it is there (rolls dodge it), else plain health
    function hurt(damage, opts) {
        const o = opts || {}, p = $gamePlayer;
        const res = T.call("Combat", "hitPlayer", { damage, poise: o.poise || 8, knock: o.knock !== undefined ? o.knock : 0.5,
            name: o.name || "", from: o.from || { x: p.x, y: p.y - 1 } });
        if (res !== undefined) return res;
        const a = $gameParty.leader();
        if (a) a.gainHp(-Math.max(1, Math.round(damage)));
        $gameScreen.startShake(5, 8, 12);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
        return "hit";
    }

    // ---- the spikes: up and down in their own rhythm; standing on them while they are up hurts (once a rise)
    if (inGame) {
        T.onMapUpdate(scene => {
            if (!isGenerated($gameMap.mapId())) return;
            const info = infoOf();
            if (!info || !info.traps.length) return;
            const d = D(), S = d.SPIKES, now = Graphics.frameCount;
            for (const tr of info.traps) {
                const ev = $gameMap.event(tr.id);
                if (!ev) continue;
                const t = (now + tr.phase) % S.period;
                // holes most of the time; a quick rise (6 frames a step), up for a moment, a slower fall
                const rise = S.period - S.up - 18;
                let step = 0;
                if (t >= rise && t < rise + 18) step = 1 + Math.floor((t - rise) / 6);
                else if (t >= rise + 18) step = t < S.period - 12 ? 3 : 2;
                const dir = d.SPIKE_STEPS[Math.min(3, step)];
                if (ev.direction() !== dir) { ev._directionFix = false; ev.setDirection(dir); ev._directionFix = true; }
                if (step === 1 && t === rise && Math.abs(ev.x - $gamePlayer.x) + Math.abs(ev.y - $gamePlayer.y) < 9) T.audio.se("Sword1", { volume: 30, pitch: 140 });
                if (step >= 2 && $gamePlayer.x === tr.x && $gamePlayer.y === tr.y && (tr.hitAt || -9999) < now - S.period / 2 && !$gamePlayer.isTransferring()) {
                    tr.hitAt = now;
                    hurt(S.damage + S.perFloor * info.floor, { poise: S.poise, knock: S.knock, name: d.TEXT.trapHit, from: { x: tr.x, y: tr.y + 0.4 } });
                }
            }
        }, { owner: PLUGIN, name: "spikes" });
    }

    // ---- water down here is seen, not drunk (the drought rule): the action button on a water tile says so - Farming's water menu
    // (drink, the waterskin, the can) never opens underground. A spring made drinkable on purpose is an event in front of the water.
    function waterAt(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; }
        return false;
    }
    if (inGame) {
        const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
        Game_Player.prototype.triggerButtonAction = function() {
            if (Input.isTriggered("ok") && D() && isUnderground($gameMap.mapId()) && !this.isInVehicle()) {
                const dir = this.direction(), x = $gameMap.roundXWithDirection(this.x, dir), y = $gameMap.roundYWithDirection(this.y, dir);
                const evThere = $gameMap.eventsXy(x, y).some(e => e.isNormalPriority() && e.isTriggerIn([0, 1, 2]));
                const evHere = $gameMap.eventsXy(this.x, this.y).some(e => e.isTriggerIn([0]) && e.page() && e.list().length > 1);
                if (waterAt(x, y) && !evThere && !evHere) {
                    popupHere(D().TEXT.water, 391);
                    return true;
                }
            }
            return _triggerButtonAction.call(this);
        };
    }

    // ======================================================================================================================
    // The Truth Layer (band 5): whispers from the dark, someone from up there seen for a moment, the world tinted wrong
    // ======================================================================================================================
    const truth = {
        on: false, next: 0, moment: 0, seen: new Set(), vision: null, mapId: 0,
        reset(mapId) {
            const f = floorOf(mapId), b = bandOf(f);
            this.on = !!(b && b.whispers);
            this.mapId = mapId;
            this.seen = new Set();
            this.vision = null;
            this.next = (window.Graphics ? Graphics.frameCount : 0) + 600;
            this.moment = (window.Graphics ? Graphics.frameCount : 0) + 1500;
            endMoment();
        }
    };
    function calm() {
        return !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gamePlayer.isTransferring();
    }
    // a whisper: from the nearest <Szept> place (within 9 tiles) or, failing that, over the hero
    function whisper(text) {
        const d = D(), r = rng(hash(seedOf(), "whisper", Graphics.frameCount));
        const line = text || r.pick(d.WHISPERS);
        const near = tagged("Szept").map(o => $gameMap.event(o.id)).filter(e => e && Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y) <= 9);
        const who = near.length ? r.pick(near) : $gamePlayer;
        T.call("SpeechBubbles", "say", who, line, 210);
        AudioManager.playSe({ name: "Darkness3", volume: 25, pitch: 150, pan: 0 });
        T.emit("undergroundWhisper", { text: line, from: who === $gamePlayer ? 0 : who.eventId() });
        return line;
    }
    // a moment: the screen goes cold and wrong for a breath (tint, a little shake, the colours turned round)
    let momentFilter = null, momentEnd = 0;
    function startMoment(frames) {
        const n = frames || 90;
        $gameScreen.startTint([-40, -70, 50, 110], 18);
        $gameScreen.startShake(2, 6, Math.min(40, n));
        AudioManager.playSe({ name: "Darkness5", volume: 30, pitch: 60, pan: 0 });
        momentEnd = Graphics.frameCount + n;
        try {
            const sp = SceneManager._scene && SceneManager._scene._spriteset;
            if (sp && window.PIXI && PIXI.filters && PIXI.filters.ColorMatrixFilter && !momentFilter) {
                momentFilter = new PIXI.filters.ColorMatrixFilter();
                sp.filters = (sp.filters || []).concat([momentFilter]);
            }
        } catch (e) { momentFilter = null; }
        return true;
    }
    function endMoment() {
        if (window.$gameScreen && momentEnd) $gameScreen.startTint([0, 0, 0, 0], 30);
        momentEnd = 0;
        try {
            const sp = SceneManager._scene && SceneManager._scene._spriteset;
            if (sp && momentFilter && sp.filters) sp.filters = sp.filters.filter(f => f !== momentFilter);
        } catch (e) { /* (the scene is gone) */ }
        momentFilter = null;
    }
    // someone from up there, at a <Zjawa> place: comes out of the dark, looks at the hero, says one thing, is gone
    function showVision(ev, who) {
        const d = D(), r = rng(hash(seedOf(), "vision", floorOf($gameMap.mapId()), ev.eventId()));
        const a = who || r.pick(d.APPARITIONS);
        ev.setImage(a.sheet, 0);
        ev.setOpacity(0);
        ev.setThrough(true);
        ev.turnTowardPlayer();
        truth.vision = { ev, a, t: 0 };
        truth.seen.add(ev.eventId());
        T.emit("undergroundVision", { name: a.name, sheet: a.sheet, id: ev.eventId() });
        return a;
    }
    if (inGame) {
        T.onMapUpdate(() => {
            const now = Graphics.frameCount;
            if (momentEnd && now >= momentEnd) endMoment();
            if (momentFilter) { try { momentFilter.hue(Math.sin(now / 9) * 35, false); } catch (e) { momentFilter = null; } }
            if (!truth.on || truth.mapId !== $gameMap.mapId()) return;
            // the vision's life: fade in, look, a word, fade out
            const v = truth.vision;
            if (v) {
                v.t++;
                const ev = v.ev;
                if (v.t <= 30) ev.setOpacity(Math.round(v.t / 30 * 210));
                if (v.t === 34) { T.call("SpeechBubbles", "say", ev, v.a.line, 150); startMoment(110); }
                if (v.t > 34 && v.t < 130) ev.turnTowardPlayer();
                if (v.t >= 140) ev.setOpacity(Math.max(0, 210 - Math.round((v.t - 140) / 26 * 210)));
                if (v.t >= 166) { ev.setImage("", 0); ev.setOpacity(255); truth.vision = null; }
                return;
            }
            if (!calm()) return;
            // a place of a vision within 6 tiles, not seen on this visit
            for (const o of tagged("Zjawa")) {
                if (truth.seen.has(o.id)) continue;
                if (Math.abs(o.x - $gamePlayer.x) + Math.abs(o.y - $gamePlayer.y) > 6) continue;
                const ev = $gameMap.event(o.id);
                if (ev) { showVision(ev); return; }
            }
            if (now >= truth.next) {
                whisper();
                truth.next = now + 1200 + (hash(seedOf(), now) % 1200);
            }
            if (now >= truth.moment) {
                startMoment(70);
                truth.moment = now + 2400 + (hash(seedOf(), "m", now) % 2400);
            }
        }, { owner: PLUGIN, name: "truthLayer" });
    }

    // ======================================================================================================================
    // Floor 100 - the Heart's chamber (Map011): the three locks, the Heart, the choice and the epilogue
    // ======================================================================================================================
    // the quest engine's state (TownQuests): W4 the castellan's key, W2 the signal "pytanie" (seven), W3 the song
    function questKnows(name) {
        const TQ = T.api("TownQuests");
        if (!TQ || !TQ.state) return false;
        let s = null;
        try { s = TQ.state(); } catch (e) { return false; }
        if (!s) return false;
        const fl = s.flags || {}, done = id => { try { return !!TQ.isDone(id); } catch (e) { return false; } };
        if (name === "key") {
            let n = 0;
            try { n = TQ.vcount ? TQ.vcount("klucz_kasztelana") : 0; } catch (e) { n = 0; }
            return n > 0 || done("W4");
        }
        if (name === "signal") {
            if (fl.signalBook || done("W2")) return true;
            const r = TQ.rec ? TQ.rec("W2") : null, q = TQ.Q && TQ.Q.W2;
            if (r && q && q.steps) {
                const ring = q.steps.findIndex(st => st.talk === "w2Ring");
                return ring >= 0 && (r.step || 0) >= ring;     // (the garden's shields told it: seven is the signal "pytanie")
            }
            return false;
        }
        if (name === "song") return !!fl.w3Shortcut || done("W3") || sw("song");
        return false;
    }
    function lockKnown(name) {
        const s = state();
        return !!s.forceLocks[name] || !!s.forceLocks.all || questKnows(name);
    }
    function locks() {
        const s = state(), d = D(), out = { open: 0 };
        for (const k of d.LOCKS.order) { out[k] = !!s.locks[k]; out[k + "Known"] = lockKnown(k); if (out[k]) out.open++; }
        out.door = out.open >= d.LOCKS.need;
        return out;
    }
    function forceLock(name, v) {
        const s = state();
        s.forceLocks[name || "all"] = v === undefined ? true : !!v;
        return s.forceLocks[name || "all"];
    }

    // event commands built in code, run as a child of the event's own interpreter (like a common event)
    const C = {
        text: (lines, spk) => [{ code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] }]
            .concat([].concat(lines).map((l, i) => ({ code: 401, indent: 0, parameters: [(i === 0 && spk !== undefined ? "\\SPK[" + spk + "]" : "") + l] }))),
        plain: line => [{ code: 101, indent: 0, parameters: ["", 0, 1, 1, ""] }, { code: 401, indent: 0, parameters: ["\\SPK[-1]" + line] }],
        script: code => [{ code: 355, indent: 0, parameters: [code] }],
        wait: n => [{ code: 230, indent: 0, parameters: [n] }],
        se: (name, vol, pitch) => [{ code: 250, indent: 0, parameters: [{ name, volume: vol || 80, pitch: pitch || 100, pan: 0 }] }],
        me: (name, vol) => [{ code: 249, indent: 0, parameters: [{ name, volume: vol || 80, pitch: 100, pan: 0 }] }],
        fadeOut: () => [{ code: 221, indent: 0, parameters: [] }],
        fadeIn: () => [{ code: 222, indent: 0, parameters: [] }],
        flash: (rgba, n) => [{ code: 224, indent: 0, parameters: [rgba, n, false] }],
        indent: (list, by) => list.map(c => Object.assign({}, c, { indent: (c.indent || 0) + by })),
        choice(question, options, branches, cancel) {
            let out = question ? C.text(question, 0) : [];
            out.push({ code: 102, indent: 0, parameters: [options, cancel === undefined ? options.length - 1 : cancel, 0, 2, 0] });
            options.forEach((o, i) => {
                out.push({ code: 402, indent: 0, parameters: [i, o] });
                out = out.concat(C.indent(branches[i] || [], 1));
                out.push({ code: 0, indent: 1, parameters: [] });
            });
            out.push({ code: 404, indent: 0, parameters: [] });
            return out;
        }
    };
    function runChild(interp, list) {
        if (!interp || !interp.setupChild) return false;
        interp.setupChild(list.concat([{ code: 0, indent: 0, parameters: [] }]), interp.eventId ? interp.eventId() : 0);
        return true;
    }
    // a lock of the door (Map011's lock events: Underground.lock("key", this))
    function lock(name, interp) {
        const d = D(), t = d.TEXT, s = state();
        let list = [];
        if (s.locks[name]) list = C.text(t[{ key: "lockKeyDone", signal: "lockSignalDone", song: "lockSongDone" }[name]], 0);
        else if (!lockKnown(name)) list = C.text(t[{ key: "lockKeyNo", signal: "lockSignalNo", song: "lockSongNo" }[name]], 0);
        else if (name === "key") list = C.se("Open5", 85, 70).concat(C.text(t.lockKeyYes, 0), C.script("Underground.openLock(\"key\")"));
        else if (name === "signal") {
            const ring = [];
            for (let i = 0; i < 7; i++) ring.push(...C.se("Bell1", 70, 70), ...C.wait(22));
            list = C.choice(t.lockSignalAsk, [t.lockSignalOpt, t.lockSignalLeave],
                [ring.concat(C.se("Bell3", 55, 50), C.text(t.lockSignalYes, 0), C.script("Underground.openLock(\"signal\")")), []]);
        } else if (name === "song") {
            list = C.choice(t.lockSongAsk, [t.lockSongOpt, t.lockSignalLeave],
                [C.me("Inn1", 70).concat(C.wait(40), C.text(t.lockSongYes, 0), C.script("Underground.openLock(\"song\")")), []]);
        }
        return runChild(interp, list);
    }
    function openLock(name) {
        const s = state(), d = D();
        if (s.locks[name]) return false;
        s.locks[name] = true;
        const l = locks();
        T.popup("Zamek otwarty: " + d.TEXT.lockNames[name], { top: true, sub: "Otwartych zamków: " + l.open + " z 3" });
        T.call("Combat", "discover", "ug_lock_" + name, "zamek Komnaty Serca (" + d.TEXT.lockNames[name] + ")", 60);
        T.emit("undergroundLock", { lock: name, open: l.open, door: l.door });
        syncDoor();
        return true;
    }
    // the door event of Map011 ("Drzwi Komnaty Serca"): its self switch A (the page with the door open) follows locks().door
    function syncDoor() {
        if (!window.$gameMap || $gameMap.mapId() !== D().MAPS.heart) return false;
        const open = locks().door;
        for (const ev of $gameMap.events()) {
            if (!ev.event() || !/^Drzwi Komnaty Serca/.test(ev.event().name || "")) continue;
            const key = [$gameMap.mapId(), ev.eventId(), "A"];
            if (!!$gameSelfSwitches.value(key) !== open) $gameSelfSwitches.setValue(key, open);
        }
        return open;
    }
    // the door: shut (how many locks are open) or open - the page with the door open shows when locks().door (the event's script)
    function door(interp) {
        const d = D(), l = locks();
        return runChild(interp, C.text(l.door ? d.TEXT.doorOpen : d.TEXT.doorShut(l.open), 0));
    }
    const doorOpen = () => locks().door;

    // the Heart: the look, then the choice of Act III (STORY.md) - or what is left of it after the ending
    function guardians() {
        const TQ = T.api("TownQuests"), fl = (TQ && TQ.state && TQ.state() && TQ.state().flags) || {}, s = state();
        return { borgar: !!fl.borgarSaying || !!s.forceLocks.all, ambrozy: !!fl.ambrozyChronicles || !!s.forceLocks.all };
    }
    function heart(interp) {
        const d = D(), t = d.TEXT, s = state();
        if (s.ending) return runChild(interp, C.text(t.heartAfter[s.ending.kind] || t.heartLook.slice(0, 1), 0));
        const kinds = ["zniszczyc", "straznik", "uwolnic", "zapieczetowac"];
        const confirm = kind => C.choice(t.heartConfirm, [t.heartYes, t.heartNo], [C.script("Underground.ending(\"" + kind + "\", \"hero\", this)"), []], 1);
        const g = guardians();
        const who = [["hero", t.guardianHero]].concat(g.borgar ? [["borgar", t.guardianBorgar]] : [], g.ambrozy ? [["ambrozy", t.guardianAmbrozy]] : []);
        const guardBranch = who.length > 1
            ? C.choice(t.guardianWho, who.map(w => w[1]).concat([t.heartNo]),
                who.map(w => C.choice(t.heartConfirm, [t.heartYes, t.heartNo], [C.script("Underground.ending(\"straznik\", \"" + w[0] + "\", this)"), []], 1)).concat([[]]))
            : confirm("straznik");
        const branches = kinds.map(k => (k === "straznik" ? guardBranch : confirm(k))).concat([[]]);
        const list = C.se("Magic3", 60, 60).concat(C.flash([255, 240, 200, 120], 30), C.text(t.heartLook, 0),
            C.choice(t.heartAsk, kinds.map(k => t.heartChoices[k]).concat([t.heartChoices.wait]), branches));
        return runChild(interp, list);
    }
    // the epilogue of an ending (lines of ENDINGS + EPILOGUE by what the town did), then "KONIEC" and the choice: back to the
    // game (the tavern, the hero wakes there) or the title screen
    function epilogueLines(kind, who) {
        const d = D(), e = d.ENDINGS[kind], ep = d.EPILOGUE, out = [];
        if (!e) return out;
        out.push(...(kind === "straznik" ? (e.guardian[who] || e.guardian.hero) : e.lines));
        const l = locks();
        if (l.open >= 3) out.push(ep.allLocks);
        const TQ = T.api("TownQuests");
        let op = null, fl = {};
        try { op = TQ && TQ.opinion ? TQ.opinion() : null; fl = (TQ && TQ.state && TQ.state().flags) || {}; } catch (er) { op = null; }
        if (op !== null && op >= 60) out.push(ep.opinionHigh);
        else if (op !== null && op < 20) out.push(ep.opinionLow);
        if (fl.sluiceHalf) out.push(ep.water);
        if (kind === "zapieczetowac" && (fl.ambrozyChronicles || fl.signalBook)) out.push(ep.ambrozyBook);
        return out;
    }
    function ending(kind, who, interp) {
        const d = D(), t = d.TEXT, s = state();
        if (!d.ENDINGS[kind] || s.ending) return false;
        const g = who || "hero";
        s.ending = { kind, guardian: kind === "straznik" ? g : null, locks: locks().open, day: T.call("Survival", "day") || 0 };
        T.call("Combat", "discover", "ug_ending", "Serce Twierdzy: " + d.ENDINGS[kind].title, 500);
        T.emit("undergroundEnding", Object.assign({}, s.ending));
        let list = C.se(kind === "zniszczyc" ? "Crash" : kind === "uwolnic" ? "Magic10" : "Magic3", 85, 70)
            .concat(C.flash([255, 255, 255, 255], 60), C.wait(30), C.fadeOut(), C.wait(30));
        for (const line of epilogueLines(kind, g)) list = list.concat(C.plain(line));
        list = list.concat(C.plain(t.endTitle + " - " + d.ENDINGS[kind].title));
        list = list.concat(C.choice(null, [t.endContinue, t.endTitleScreen],
            [C.script("Underground.afterEnding()"), C.script("SceneManager.goto(Scene_Title)")], 0));
        return runChild(interp, list);
    }
    // back to the game after an ending: the hero wakes in the tavern (the Heart's chamber keeps what was done)
    function afterEnding() {
        $gamePlayer.reserveTransfer(1, 9, 5, 2, 0);
        $gameScreen.startFadeIn(30);
        if (state().ending && state().ending.kind === "straznik" && state().ending.guardian === "hero") {
            T.call("SpeechBubbles", "say", $gamePlayer, "Strażnik może wyjść na górę raz w roku. Dziś jest ten dzień.", 300);
        }
        return true;
    }
    // the chamber after an ending: the Heart's light changes (the event "Serce Twierdzy (blask)" on Map011): dark shards (destroyed),
    // nothing (let out), a stone seal (sealed); it keeps shining over its new guardian
    function heartData(events) {
        const s = state();
        if (!s || !s.ending || s.ending.kind === "straznik") return;
        for (const e of events) {
            if (!e || e.name !== "Serce Twierdzy (blask)") continue;
            const img = e.pages[0].image;
            if (s.ending.kind === "zniszczyc") Object.assign(img, { characterName: "", tileId: 512 + 32 });   // (Dungeon D: crystal shards lying)
            else if (s.ending.kind === "uwolnic") Object.assign(img, { characterName: "", tileId: 0 });
            else if (s.ending.kind === "zapieczetowac") Object.assign(img, { characterName: "!Dungeon_Secrets", characterIndex: 0, direction: 2, pattern: 1 });
            e.pages[0].stepAnime = false;
            e.note = "";   // (no light any more)
        }
    }

    // ---- the debug / test helpers
    function verify(floor) {
        const got = floorData(floor);
        if (!got) return { ok: false, why: "no data" };
        return verifyMap(got.map, got.info, flags(bandOf(floor)));
    }
    function setSeed(n) {
        state().seed = (Number(n) >>> 0) || 1;
        cache.clear();
        return state().seed;
    }

    if (inGame) {
        PluginManager.registerCommand(PLUGIN, "open", () => sw("gate", true));
        PluginManager.registerCommand(PLUGIN, "close", () => sw("gate", false));
        PluginManager.registerCommand(PLUGIN, "go", args => go(Number(args.floor)));
        PluginManager.registerCommand(PLUGIN, "shortcut", () => sw("song", true));
    }

    const api = {
        GEN_VERSION, hash, rng, floorShape, wallShape, parseLibrary, librarySig, planFloor, generate, verifyMap, reachable, checkChunk, tagsOf,
        roomsOf, floorOf, mapOf, bandOf, handmadeOf, isGenerated, isVirtual, isUnderground, library, floorData, flags,
        info: infoOf, spawns: mapId => { const i = infoOf(mapId); return i ? i.spawns : spawnsOfMap(); },
        registerCreature(kind, build) { creatures[String(kind)] = build; cache.clear(); return true; },
        hasCreature: kind => !!creatures[kind],
        isOpen: () => sw("gate"), open: () => sw("gate", true), close: () => sw("gate", false),
        lift: v => sw("lift", v), shortcut: v => sw("song", v), gate10: v => sw("gate10", v),
        liftOn, liftMenu, liftStops, windlass, cage,
        deepest: () => state().deepest || 0, seed: seedOf, setSeed, state, stairs, search, read, say, hurt, go, landing, verify,
        guardianHandled, guardianPose, guardianStrike, wake, gate10Opened, onGuardian: fn => { guardianHook = fn; return true; },
        bossCleared, bossDefeated, bosses: () => Object.assign({}, state().bosses),
        locks, lockKnown, lock, openLock, forceLock, door, doorOpen, syncDoor, heart, ending, afterEnding, epilogueLines,
        truths: () => Object.assign({}, state().truths), whisper, startMoment, showVision: (id, i) => { const ev = $gameMap.event(id); return ev ? showVision(ev, i !== undefined ? D().APPARITIONS[i] : null) : null; },
        waterAt, clearCache: () => cache.clear()
    };
    window.Underground = T.register(PLUGIN, api);

    // the data part, when it is not on the plugin list (it must be listed right above this file - see docs/PODZIEMIA.md)
    if (inGame && !D() && PluginManager.loadScript) PluginManager.loadScript("Underground_Data");
})();
