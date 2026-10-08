//=============================================================================
// Underground.js
//=============================================================================
// Load order: after TawernaCore and Underground_Data (anywhere below them; it only reads other plugins through Tawerna.api/call).
// The generator part (parseLibrary / generate / verify) is pure: tests/unit/underground.test.js runs it in Node.
// docs/PODZIEMIA.md describes the whole system.

/*:
 * @target MZ
 * @plugindesc Podziemia pod tawerną: 100 pięter - piętra składane z kawałków pokoi (stałe ziarno zapisu), co 10. piętro ręcznie, schody, winda, bossowie, łupy, pułapki, zapiski zakonu, Warstwa Prawdy, Komnata Serca, Lord przy Sercu i zakończenia jako sceny. v2.1.0
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
        lifts: {}, bosses: {}, locks: {}, forceLocks: {}, truths: {}, ending: null, lord: null, forceWorld: null, forceLord: null }), { version: 1, owner: PLUGIN });
    const state = () => {
        const s = store();
        // (saves from band 1's days: the newer parts)
        if (!s.lifts) s.lifts = {};
        if (!s.bosses) s.bosses = {};
        if (!s.locks) s.locks = {};
        if (!s.forceLocks) s.forceLocks = {};
        if (!s.truths) s.truths = {};
        if (s.ending === undefined) s.ending = null;
        if (s.lord === undefined) s.lord = null;
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
            .concat([].concat(lines).map((l, i) => ({ code: 401, indent: 0, parameters: [(i === 0 && spk !== undefined ? "\\SPK[" + spk + "]" : "") + String(l).replace(/^> /, "")] }))),
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

    // ======================================================================================================================
    // Floor 100 (v2.1): the world the endings read, the Lord at the Heart (W7 ch. 7), the endings as scenes - in the chamber and
    // up above (the manor, the market, the camp, grandpa's house, the tavern) - then the epilogue; the game goes on in the tavern
    // ======================================================================================================================
    const H = () => D().HEART;
    // the town's quest flags (TownQuests' state; {} without it)
    function questFlags() {
        const TQ = T.api("TownQuests");
        try { return (TQ && TQ.state && TQ.state() && TQ.state().flags) || {}; } catch (e) { return {}; }
    }
    // "Borgar, Grum i Tadek" from the keys other plugins use
    function namesOf(keys) {
        const n = H().NAMES, list = [].concat(keys || []).filter(Boolean).map(k => n[k] || (String(k).charAt(0).toUpperCase() + String(k).slice(1)));
        return list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + " i " + list[list.length - 1];
    }
    // what the endings read, every plugin asked defensively (each may be missing): Story (the debt), TownQuests (Opinia, the flags of
    // W1-W9; W6's TownQuests.w6()), TownLife (who is gone), Act III (Act3.outcome() - null until the siege is over). F9 and the tests
    // can lay a world over it (state().forceWorld) and choose the Lord's stance (state().forceLord).
    function world() {
        const s = state(), fl = questFlags(), TQ = T.api("TownQuests");
        let op = null, w6 = null, siege = null, ss = null;
        try { op = TQ && TQ.opinion ? TQ.opinion() : null; if (typeof op !== "number") op = null; } catch (e) { op = null; }
        try { w6 = TQ && typeof TQ.w6 === "function" ? TQ.w6() : null; } catch (e) { w6 = null; }
        try { const A = T.api("Act3"); siege = A && typeof A.outcome === "function" ? A.outcome() : null; } catch (e) { siege = null; }
        try { const St = T.api("Story"); ss = St && St.state ? St.state() : null; } catch (e) { ss = null; }
        if (typeof siege === "string") siege = { result: siege };
        if (!siege || !siege.result) siege = fl.act3Held ? { result: "held" } : fl.act3Costly ? { result: "costly" } : fl.act3Fallen ? { result: "fallen" } : null;
        const gone = k => { try { return !!(window.TownLife && TownLife.gone && TownLife.gone(k)); } catch (e) { return false; } };
        const sg = siege && siege.grum;
        const w = {
            story: !!ss, debtPaid: !!ss && (ss.paid >= ss.debt || !!ss.done),
            opinion: op, locks: locks().open,
            borgar: !!fl.borgarSaying, ambrozy: !!fl.ambrozyChronicles, book: !!(fl.signalBook || fl.ambrozyChronicles),
            melia: fl.w3Sung ? "public" : fl.w3Borgar ? "borgar" : fl.w3Burned ? "burned" : null,
            grum: ["ally", "enemy", "ferry", "gone", "dead"].includes(sg) ? sg
                : fl.grumDead ? "dead" : fl.grumGone ? "gone" : fl.grumAlly ? "ally" : (fl.w8Faction || fl.w8Lost) ? "faction" : null,
            rafal: (siege && ["ally", "enemy", "gone", "taken", "dead"].includes(siege.rafal) && siege.rafal) || (w6 && w6.rafal) || (fl.rafalAlly ? "ally" : (fl.rafalGiven || fl.rafalEnemy) ? "enemy" : fl.rafalSmuggled ? "gone" : fl.rafalTaken ? "taken" : null),
            marek: !!((w6 && w6.marekSaved) || fl.marekSaved),
            camp: (w6 && w6.camp) || (fl.campInside ? "inside" : fl.campOutside ? "outside" : null),
            water: !!fl.sluiceHalf,
            feliks: fl.w1Revealed ? "arrested" : fl.lordAlly ? "sent" : fl.feliksPays ? "pays" : gone("feliks") ? "gone" : "here",
            lordFlags: { ally: !!fl.lordAlly, cold: !!(fl.w1Revealed || fl.lordCold), truth: !!fl.lordTruth },
            siege
        };
        const f = s.forceWorld;
        if (f && typeof f === "object") for (const k of Object.keys(f)) w[k] = JSON.parse(JSON.stringify(f[k]));
        if (w.siege) w.siege = Object.assign({}, w.siege, { names: { defenders: namesOf(w.siege.defenders), lost: namesOf(w.siege.lost) } });
        w.butler = w.feliks === "here" || w.feliks === "pays" ? "feliks" : "teodor";
        const L = s.lord || {};
        w.lord = { stance: L.stance || lordStance(w), choice: L.choice || null, told: L.told || null, cold: !!(w.lordFlags && w.lordFlags.cold) };
        return w;
    }
    // the Lord's stance at the Heart: ally (the quiet way of W1 - lordAlly - or his truth told, W9 ch. 6), rival (shamed at the market,
    // W1 a: "Mówiłem: najpierw do mnie"), absent (he never learnt the hero went down - or no story, or the debt not paid)
    function lordStance(w) {
        const f = state().forceLord;
        if (f === "ally" || f === "rival" || f === "absent") return f;
        if (!w.story || !w.debtPaid) return "absent";
        const lf = w.lordFlags || {};
        if (lf.ally || lf.truth) return "ally";
        if (lf.cold) return "rival";
        return "absent";
    }
    const plainWorld = w => JSON.parse(JSON.stringify(w));

    // ---- the cast: actor events on the chamber's map (always there, hidden till a scene needs them) and on the map of a scene up
    // above while it plays (film.next) - ids 800-827
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function actorEvent(id, key, x, y, dir, opts) {
        const o = opts || {}, a = H().ACTORS[key] || {}, name = a.name || key;
        const bust = o.bust !== undefined ? o.bust : a.bust;
        return { id, name, x, y, note: (bust ? "<Bust:" + bust + ">" : "") + "<BustName:" + name + "><Actor:" + key + ">",
            pages: [{ conditions: Object.assign({}, COND), directionFix: false,
                image: { tileId: 0, characterName: o.show ? (o.sheet || a.sheet || "") : "", characterIndex: 0, direction: dir || 2, pattern: 1 },
                list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                moveSpeed: o.speed || 3, moveType: 0, priorityType: 1, stepAnime: false, through: true, trigger: 0, walkAnime: true }] };
    }
    const film = { next: null, pending: null, speed: 1, cinema: false, hidden: [], bars: null, log: [] };
    function chamberCast() {
        const c = H().IDS.chamber, sp = H().SPOTS, s = state(), out = [];
        for (const key of Object.keys(c)) {
            if (key === "asker") { const ev = actorEvent(c.asker, "lord", sp.door[0], sp.door[1], 8, { bust: "" }); ev.note = "<Actor:asker>"; out.push(ev); continue; }
            const [x, y, dir] = sp[key] || [sp.door[0], sp.door[1], 2];
            // after the "guardian" ending Borgar or Ambroży sits on the bench before the Heart (the order's watch: they come and go)
            const sits = s.ending && s.ending.kind === "straznik" && s.ending.guardian === key;
            const ev = sits ? actorEvent(c[key], key, sp.bench[0], sp.bench[1], sp.bench[2], { show: true }) : actorEvent(c[key], key, x, y, dir);
            if (sits) ev.pages[0].list = [{ code: 355, indent: 0, parameters: ["Underground.heart(this)"] }, { code: 0, indent: 0, parameters: [] }];
            out.push(ev);
        }
        return out;
    }
    if (inGame && D() && D().HEART) {
        const [from, to] = [D().HEART.IDS.chamber.lord, D().HEART.IDS.shots[1]];
        T.inject(mapId => mapId === D().MAPS.heart || !!(film.next && film.next.map === mapId), { ids: [from, to], owner: PLUGIN, fixSaved: true,
            build(data, mapId) {
                if (film.next && film.next.map === mapId) {
                    return film.next.actors.map(a => actorEvent(a.id, a.key, a.x, a.y, a.dir, { show: true, bust: "none", sheet: a.sheet }));
                }
                return mapId === D().MAPS.heart ? chamberCast() : [];
            } });
    }

    // ---- the event commands of a scene (HEART's steps -> commands); cast: actor key -> event id on the map the steps play on
    const W = n => Math.max(1, Math.round(n * film.speed));
    const clean = l => String(l).replace(/^> /, "");
    const F = {
        narr: (line, mid) => [{ code: 101, indent: 0, parameters: ["", 0, 1, mid ? 1 : 2, ""] }, { code: 401, indent: 0, parameters: ["\\SPK[-1]" + clean(line)] }],
        wait: n => [{ code: 230, indent: 0, parameters: [W(n)] }],
        tint: (tone, n) => [{ code: 223, indent: 0, parameters: [tone, W(n), false] }],
        shake: (p, s, n) => [{ code: 225, indent: 0, parameters: [p, s, W(n), false] }],
        transfer: (mapId, x, y, dir) => [{ code: 201, indent: 0, parameters: [0, mapId, x, y, dir || 2, 2] }],
        bgsOut: secs => [{ code: 246, indent: 0, parameters: [secs] }],
        bgmOut: secs => [{ code: 242, indent: 0, parameters: [secs] }],
        call: (fn, args) => C.script("Underground.film." + fn + "(this" + (args && args.length ? ", " + args.map(a => JSON.stringify(a)).join(", ") : "") + ")")
    };
    // the Heart's light in a scene: the commands of each effect (the light itself: heartFx, drawn by the updater below)
    function fxList(name) {
        switch (name) {
            case "pulse": return F.call("fx", ["pulse"]);
            case "flare": return C.se("Magic3", 75, 70).concat(C.flash([255, 250, 230, 170], W(20)), F.call("fx", ["flare"]), F.wait(30));
            case "overflow": return C.se("Darkness5", 70, 60).concat(F.call("fx", ["flare"]), F.shake(4, 8, 50), F.tint([50, 40, 90, 60], 20),
                F.call("barks", [3]), F.wait(80));
            case "calm": return F.tint([0, 0, 0, 0], 30).concat(F.call("fx", [null]), F.wait(20));
            case "whispers": return F.call("fx", ["pulse"]).concat(F.call("barks", [3]), F.wait(110));
            case "crack": return C.se("Blow3", 90, 70).concat(C.se("Crash", 90, 60), C.flash([255, 255, 255, 255], W(30)), F.shake(9, 9, 45),
                F.call("fx", ["crack"]), F.wait(45));
            case "montage": return F.tint([200, 200, 200, 0], 10).concat(C.se("Magic10", 70, 120), F.call("montage", []), F.wait(170));
            case "dark": return C.se("Thunder9", 70, 50).concat(F.call("fx", ["shards"]), F.tint([-220, -220, -220, 0], 40), F.bgsOut(2), F.wait(70),
                F.tint([-90, -90, -80, 40], 90), F.wait(60));
            case "rise": return C.se("Magic10", 85, 70).concat(F.call("fx", ["rise"]), C.flash([255, 255, 240, 200], W(30)), F.wait(30),
                C.flash([255, 255, 240, 220], W(30)), F.tint([180, 180, 170, 0], 90), F.wait(100));
            case "seal": return F.call("fx", ["seal"]).concat(F.tint([-50, -50, -40, 30], 70), F.wait(80));
            case "warm": return C.se("Saint3", 60, 80).concat(F.call("fx", ["warm"]), F.tint([30, 15, -10, 0], 60), F.wait(50));
            case "light": return F.tint([0, 0, 0, 0], 40).concat(F.wait(30));
            default: return [];
        }
    }
    function idOf(who, cast) {
        if (who === "hero") return -1;
        return cast[who] || 0;
    }
    function stepsList(steps, cast, ctx) {
        let out = [];
        for (const st of [].concat(steps || [])) {
            if (!st) continue;
            if (Array.isArray(st)) {
                const [who, raw] = st, text = clean(typeof raw === "function" ? raw(ctx.w, ctx.e, ctx.has) : raw);
                if (!text) continue;
                film.log.length < 400 && film.log.push(text);
                if (who === null) out = out.concat(F.narr(text));
                else if (who === "hero") out = out.concat(C.text([text], 0));
                else if (cast[who]) out = out.concat(C.text([text], cast[who]));
                else out = out.concat(F.narr(((H().ACTORS[who] || {}).name || who) + ": „" + text + "”"));
                continue;
            }
            if (st.fx) out = out.concat(fxList(st.fx));
            else if (st.walk) out = out.concat(F.call("walk", [idOf(st.walk[0], cast), st.walk[1], st.walk[2], st.walk[3] || 0]));
            else if (st.appear) {
                const [who, x, y, dir] = st.appear, id = idOf(who, cast);
                if (id) out = out.concat(F.call("appear", [id, (H().ACTORS[who] || {}).sheet || "", x, y, dir || 2]));
            } else if (st.leave) { const id = idOf(st.leave, cast); if (id) out = out.concat(F.call("leave", [id])); }
            else if (st.face) out = out.concat(F.call("face", [idOf(st.face[0], cast), st.face[1]]));
            else if (st.balloon) out = out.concat(F.call("balloon", [idOf(st.balloon[0], cast), st.balloon[1]]), F.wait(50));
            else if (st.wait) out = out.concat(F.wait(st.wait));
            else if (st.se) out = out.concat(C.se(st.se[0], st.se[1], st.se[2]));
            else if (st.me) out = out.concat(C.me(st.me[0], st.me[1]));
            else if (st.shake) out = out.concat(F.shake(st.shake[0], st.shake[1], st.shake[2]));
            else if (st.notice) out = out.concat(F.call("notice", [st.notice]), F.wait(28));
            else if (st.caption) out = out.concat(F.call("caption", [st.caption, st.frames || 46]), F.wait((st.frames || 46) - 6));
            else if (st.card) {
                out = out.concat(C.fadeOut(), F.wait(20));
                for (const l of st.card) out = out.concat(F.narr(l, true));
                out = out.concat(F.wait(10), C.fadeIn());
            } else if (st.asker) {
                const a = H().ASKERS.find(k => { try { return k.when(ctx.w, ctx.e); } catch (e) { return false; } }) || H().ASKERS[H().ASKERS.length - 1];
                const id = H().IDS.chamber.asker, sp = H().SPOTS;
                out = out.concat(F.call("appear", [id, (H().ACTORS[a.who] || {}).sheet || "", sp.door[0], sp.door[1], 8, (H().ACTORS[a.who] || {}).name || ""]),
                    F.call("walk", [id, sp.asker[0], sp.asker[1], sp.asker[2]]),
                    stepsList(a.lines, Object.assign({}, cast, { asker: id }), ctx));
                film.asker = a.who;
            } else if (st.heroIn) out = out.concat(F.call("heroIn", st.heroIn));
        }
        return out;
    }
    const chamberIds = () => Object.assign({}, H().IDS.chamber);

    // ---- the Lord at the Heart: his arrival, the hero's choice (let him ask / refuse / ask for him - and what to tell him), he goes
    function lordList(stance, w) {
        const L = H().LORD, cast = chamberIds(), ctx = { w, e: null, has: {} };
        const set = (choice, told) => F.call("lord", [stance, choice, told || null]);
        const leave = stepsList(L.leave, cast, ctx);
        const tell = C.choice(null, [L.tellOpts.truth, L.tellOpts.mercy, L.tellOpts.silent],
            ["truth", "mercy", "silent"].map(k => set("askFor", k).concat(stepsList(L.told[k], cast, ctx))), 2);
        const branches = [
            set("allow").concat(stepsList(L.allow, cast, ctx), stepsList(L.allowAfter[stance], cast, ctx), leave),
            set("refuse").concat(stepsList(L.refuse[stance], cast, ctx), leave),
            set("askFor").concat(stepsList(L.askFor, cast, ctx), tell, stance === "rival" ? stepsList(L.askForRival, cast, ctx) : [], leave)
        ];
        return F.call("start", []).concat(F.call("place", []), stepsList(L.arrive[stance], cast, ctx),
            C.choice(L.ask, [L.opts.allow, stance === "rival" ? L.opts.refuseRival : L.opts.refuseAlly, L.opts.askFor], branches, 1), F.call("end", []));
    }
    // the Heart's look and the choice of Act III (STORY.md); "Zostać strażnikiem" asks who when Borgar (W4) or Ambroży (W2) may stay
    function guardians() {
        const fl = questFlags(), s = state(), w = s.forceWorld || {};
        return { borgar: !!fl.borgarSaying || !!w.borgar || !!s.forceLocks.all, ambrozy: !!fl.ambrozyChronicles || !!w.ambrozy || !!s.forceLocks.all };
    }
    function choiceList() {
        const t = D().TEXT, kinds = ["zniszczyc", "straznik", "uwolnic", "zapieczetowac"];
        const confirm = (kind, who) => C.choice(t.heartConfirm, [t.heartYes, t.heartNo], [C.script("Underground.ending(\"" + kind + "\", \"" + (who || "hero") + "\", this)"), []], 1);
        const g = guardians();
        const who = [["hero", t.guardianHero]].concat(g.borgar ? [["borgar", t.guardianBorgar]] : [], g.ambrozy ? [["ambrozy", t.guardianAmbrozy]] : []);
        const guardBranch = who.length > 1 ? C.choice(t.guardianWho, who.map(x => x[1]).concat([t.heartNo]), who.map(x => confirm("straznik", x[0])).concat([[]]))
            : confirm("straznik");
        const branches = kinds.map(k => (k === "straznik" ? guardBranch : confirm(k))).concat([[]]);
        return C.se("Magic3", 60, 60).concat(C.flash([255, 240, 200, 120], 30), C.text(t.heartLook, 0),
            C.choice(t.heartAsk, kinds.map(k => t.heartChoices[k]).concat([t.heartChoices.wait]), branches));
    }
    // the Heart (its event: Underground.heart(this)): after an ending what is left of it; else the Lord first (once, when he comes
    // down at all), then the look and the choice
    function heart(interp) {
        const t = D().TEXT, s = state();
        if (s.ending) {
            const g = s.ending.kind === "straznik" ? s.ending.guardian || "hero" : null, cast = chamberIds();
            if (g && t.heartAfterGuardian && t.heartAfterGuardian[g]) return runChild(interp, C.text(t.heartAfterGuardian[g], g === "hero" ? 0 : cast[g]));
            return runChild(interp, C.text(t.heartAfter[s.ending.kind] || t.heartLook.slice(0, 1), 0));
        }
        let list = [];
        if (!s.lord) {
            const w = world();
            if (w.lord.stance !== "absent") list = lordList(w.lord.stance, w);
        }
        return runChild(interp, list.concat(choiceList()));
    }

    // ---- an ending: the chamber, the black card, the scenes up above, the epilogue, KONIEC and the choice (the game goes on)
    function epilogueLines(kind, who) {
        const d = D(), e = d.ENDINGS[kind];
        if (!e) return [];
        return (kind === "straznik" ? (e.guardian[who] || e.guardian.hero) : e.lines).concat(epilogueExtras(kind));
    }
    function epilogueExtras(kind, w0) {
        const ep = D().EPILOGUE, out = [], w = w0 || world(), fl = questFlags();
        if (locks().open >= 3 || w.locks >= 3) out.push(ep.allLocks);
        if (w.opinion !== null && w.opinion >= 60) out.push(ep.opinionHigh);
        else if (w.opinion !== null && w.opinion < 20) out.push(ep.opinionLow);
        if (w.water) out.push(ep.water);
        if (kind === "zapieczetowac" && (w.book || fl.ambrozyChronicles || fl.signalBook)) out.push(ep.ambrozyBook);
        return out;
    }
    const valOf = (v, w) => (typeof v === "function" ? v(w) : v);
    // the scenes up above that play (HEART.SHOTS, each when its `when` holds), with their cast
    function shotsOf(w, e) {
        const out = [];
        let next = H().IDS.shots[0];
        for (const sh of H().SHOTS) {
            let ok = true;
            try { ok = !sh.when || !!sh.when(w, e); } catch (er) { ok = false; }
            if (!ok) continue;
            const map = valOf(sh.map, w), cam = valOf(sh.cam, w), cast = {}, actors = [];
            for (const a of sh.actors ? sh.actors(w, e) : []) {
                let [key, x, y, dir] = a;
                if (key === "butler") key = w.butler;
                if (next > H().IDS.shots[1] || cast[key]) continue;
                const id = next++;
                cast[key] = id;
                if (a[0] === "butler") cast.butler = id;
                actors.push({ id, key, x, y, dir, sheet: (H().ACTORS[key] || {}).sheet });
            }
            next = H().IDS.shots[0];   // (each scene its own map: the same ids again)
            out.push({ key: sh.key, map, cam, actors, cast, hero: sh.hero ? sh.hero(w, e) : null, last: !!sh.last, steps: sh.steps(w, e) });
        }
        return out;
    }
    function filmList(kind, who, w) {
        const d = D(), e = { kind, guardian: kind === "straznik" ? who : null }, has = { borgar: !!w.borgar, ambrozy: !!w.ambrozy };
        const ctx = { w, e, has }, cast = chamberIds(), sp = H().SPOTS;
        film.log = [];
        let list = F.call("start", []).concat(F.call("place", []));
        // who came down with the hero (W4 Borgar, W2 Ambroży)
        if (has.borgar || has.ambrozy) {
            list = list.concat(stepsList([H().COMPANIONS.arrive,
                has.borgar && { appear: ["borgar", sp.door[0], sp.door[1], 8] }, has.borgar && { walk: ["borgar"].concat(sp.borgar) },
                has.ambrozy && { appear: ["ambrozy", sp.door[0], sp.door[1] + 1, 8] }, has.ambrozy && { walk: ["ambrozy"].concat(sp.ambrozy) },
                has.borgar && H().COMPANIONS.borgar, has.ambrozy && H().COMPANIONS.ambrozy], cast, ctx));
        }
        list = list.concat(stepsList(H().CHAMBER[kind](w, e, has), cast, ctx));
        // the black card: the ending's own words, then up (or not: the hero who stays below sees the town in the Heart's light)
        const ends = d.ENDINGS[kind], words = kind === "straznik" ? (ends.guardian[who] || ends.guardian.hero) : ends.lines;
        list = list.concat(C.fadeOut(), F.wait(30), F.bgmOut(3), F.bgsOut(3));
        for (const l of words) list = list.concat(F.narr(l, true));
        film.log.push(...words);
        list = list.concat(F.narr(e.guardian === "hero" ? H().AFTER_GUARDIAN : H().AFTER, true), F.call("morning", []));
        // the scenes up above
        const shots = shotsOf(w, e);
        for (const sh of shots) {
            list = list.concat(F.call("prepare", [sh.key, sh.map, sh.actors]), F.transfer(sh.map, sh.cam[0], sh.cam[1], sh.hero ? sh.hero[2] : 2),
                F.call("arrive", [sh.key, sh.hero || null]), F.wait(10), C.fadeIn(), F.wait(24),
                stepsList(sh.steps, sh.cast, ctx), F.wait(40));
            if (!sh.last) list = list.concat(C.fadeOut(), F.wait(10));
        }
        // the epilogue (what the town did with the hero), KONIEC and the choice: the game goes on in the tavern, or the title screen
        const extras = epilogueExtras(kind, w);
        list = list.concat(F.tint([-110, -110, -110, 60], 60), F.wait(40));
        for (const l of extras) list = list.concat(F.narr(l, true));
        film.log.push(...extras);
        list = list.concat(C.me("Inn2", 60), F.narr(d.TEXT.endTitle + " - " + ends.title, true));
        list = list.concat(C.choice(null, [d.TEXT.endContinue, d.TEXT.endTitleScreen],
            [C.script("Underground.afterEnding()"), C.script("Underground.film.end(); SceneManager.goto(Scene_Title)")], 0));
        film.shots = shots.map(s => s.key);
        return list;
    }
    function ending(kind, who, interp) {
        const d = D(), s = state();
        if (!d.ENDINGS[kind] || s.ending) return false;
        const g = kind === "straznik" ? (who || "hero") : null, w = world();
        s.ending = { kind, guardian: g, locks: locks().open, day: T.call("Survival", "day") || T.time.day() || 0, lord: Object.assign({}, w.lord) };
        T.call("Combat", "discover", "ug_ending", "Serce Twierdzy: " + d.ENDINGS[kind].title, 500);
        T.emit("undergroundEnding", Object.assign({}, s.ending));
        const list = filmList(kind, g || "hero", w);
        s.ending.world = plainWorld(Object.assign({}, w, { shots: film.shots }));
        return runChild(interp, list);
    }
    // back to the game after an ending: the scenes' cast goes, the hero stands at the bar of the tavern (the chamber keeps the ending)
    function afterEnding() {
        film.end();
        $gamePlayer.setTransparent(false);
        $gamePlayer.reserveTransfer(1, 52, 31, 8, 0);
        $gamePlayer.requestMapReload();
        $gameScreen.startTint([0, 0, 0, 0], 1);
        $gameScreen.startFadeIn(30);
        return true;
    }
    // the chamber after an ending: the Heart's light changes (the event "Serce Twierdzy (blask)" on Map011): dark shards (destroyed),
    // nothing (let out), a stone seal (sealed); it keeps shining over its new guardian (Borgar / Ambroży sit on the bench - the cast)
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

    // ---- what the scenes' script calls do (Underground.film.*: `this` of the event's interpreter first)
    const charOf = id => (id < 0 ? $gamePlayer : id > 0 ? $gameMap.event(id) : null);
    const glowEvent = () => (window.$gameMap ? $gameMap.events().find(e => e.event() && e.event().name === "Serce Twierdzy (blask)") || null : null);
    const heartEvent = () => (window.$gameMap ? $gameMap.events().find(e => e.event() && e.event().name === "Serce Twierdzy") || null : null);
    // a path of 4-way steps on the map's passage (events left out: the cast walks through), [] when none
    function pathTo(sx, sy, tx, ty) {
        if (sx === tx && sy === ty) return [];
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
        }
        // (no way round: straight there, the route skips what blocks)
        const out = [];
        for (let i = 0; i < Math.abs(tx - sx); i++) out.push(tx > sx ? 6 : 4);
        for (let i = 0; i < Math.abs(ty - sy); i++) out.push(ty > sy ? 2 : 8);
        return out;
    }
    const MOVE = { 2: 1, 4: 2, 6: 3, 8: 4 }, TURN = { 2: 16, 4: 17, 6: 18, 8: 19 };
    // the Heart's light: an effect drawn by the map's updater (scale, light, shaking); shards / nothing / the seal when it ends
    const hfx = { mode: null, t: 0 };
    function heartFx(mode) {
        hfx.mode = mode || null;
        hfx.t = 0;
        const ev = glowEvent();
        if (!ev) return false;
        if (mode === "shards") { ev.setTileImage(512 + 32); ev.setStepAnime(false); ev.setOpacity(255); ev.setBlendMode(0); hfx.mode = null; }
        if (!mode) { ev.setOpacity(255); ev.setBlendMode(0); }
        return true;
    }
    function updateHeartFx() {
        if (!hfx.mode || !window.$gameMap || $gameMap.mapId() !== D().MAPS.heart) return;
        const ev = glowEvent(), sc = SceneManager._scene, set = sc && sc._spriteset;
        const sp = ev && set && set._characterSprites ? set._characterSprites.find(s => s._character === ev) : null;
        if (!ev || !sp) return;
        const t = ++hfx.t, m = hfx.mode;
        let scale = 1;
        if (m === "pulse") scale = 1 + 0.12 * Math.sin(t / 6);
        else if (m === "flare") { scale = 1 + Math.min(1, t / 20) * 0.6 + 0.06 * Math.sin(t / 3); ev.setBlendMode(1); }
        else if (m === "warm") { scale = 0.88 + 0.04 * Math.sin(t / 20); ev.setOpacity(Math.max(170, 255 - t * 2)); }
        else if (m === "crack") {
            scale = 1.2;
            sp.x += (t % 4 < 2 ? 3 : -3);
            ev.setOpacity(t % 6 < 3 ? 255 : 120);
            if (t >= 44) heartFx("shards");
        } else if (m === "rise") {
            scale = 1 + Math.min(1.5, t / 40);
            ev.setBlendMode(1);
            ev.setOpacity(Math.max(0, 255 - t * 3));
            sp.y -= Math.min(160, t * 2);
            if (t >= 90) { ev.setImage("", 0); hfx.mode = null; }
        } else if (m === "seal") {
            ev.setOpacity(Math.max(0, 255 - t * 5));
            scale = Math.max(0.3, 1 - t / 80);
            if (t >= 52) { ev.setImage("!Dungeon_Secrets", 0); ev.setDirection(2); ev.setPattern(1); ev.setStepAnime(false); ev.setOpacity(255); ev.setBlendMode(0); hfx.mode = null; }
        }
        if (hfx.mode) sp.scale.set(scale, scale);
        else sp.scale.set(1, 1);
    }
    // the cinema: black bars over the map and the HUD out of the way while an ending plays
    function updateCinema() {
        const sc = SceneManager._scene;
        if (!(sc instanceof Scene_Map)) return;
        if (film.cinema) {
            if (!film.bars || film.bars.parent !== sc) {
                const bars = new Sprite(), h = 54;
                for (const y of [0, Graphics.height - h]) {
                    const b = new Sprite(new Bitmap(Graphics.width, h));
                    b.bitmap.fillAll("#000000");
                    b.y = y;
                    bars.addChild(b);
                }
                bars.alpha = 0;
                const at = sc._spriteset ? sc.children.indexOf(sc._spriteset) + 1 : 0;
                sc.addChildAt(bars, Math.max(0, at));
                film.bars = bars;
            }
            film.bars.alpha = Math.min(1, film.bars.alpha + 0.06);
            for (const el of (sc.hudFadeElements ? sc.hudFadeElements() : [])) {
                if (!el) continue;
                if (el.visible && !film.hidden.includes(el)) film.hidden.push(el);
                el.visible = false;
            }
        }
        // a caption: a big line in the middle, rising a little as it fades in and out
        if (film.cap) {
            if (!film.capSprite || film.capSprite.parent !== sc) {
                const sp = new Sprite(new Bitmap(Graphics.width, 90));
                sc.addChildAt(sp, Math.max(0, sc._spriteset ? sc.children.indexOf(sc._spriteset) + 1 : 0));
                film.capSprite = sp;
            }
            const sp = film.capSprite, c = film.cap;
            if (sp._capText !== c.text) {
                const b = sp.bitmap;
                b.clear();
                b.fontFace = $gameSystem.mainFontFace();
                b.fontSize = 44;
                b.textColor = "#ffd866";
                b.outlineColor = "rgba(0, 0, 0, 0.85)";
                b.outlineWidth = 7;
                b.drawText(c.text, 0, 10, Graphics.width, 70, "center");
                sp._capText = c.text;
            }
            c.t++;
            const k = Math.max(1, Math.round(c.life / 4));
            sp.alpha = Math.max(0, Math.min(1, c.t / k, (c.life - c.t) / k));
            sp.y = Math.round(Graphics.height / 2 - 45 - c.t * 0.6);
            if (c.t >= c.life) { film.cap = null; sp.alpha = 0; }
        } else if (film.capSprite && film.capSprite.alpha) film.capSprite.alpha = 0;
        if (!film.cinema && film.bars) {
            if (film.bars.parent) film.bars.parent.removeChild(film.bars);
            film.bars = null;
            for (const el of film.hidden) el.visible = true;
            film.hidden = [];
        }
    }
    if (inGame) {
        T.onMapUpdate(() => {
            updateHeartFx();
            updateCinema();
            if (film.fades.length) {
                for (const f of film.fades) {
                    const ev = charOf(f.id);
                    if (!ev) { f.done = true; continue; }
                    if (f.wait) { if (ev.isMoveRouteForcing()) continue; f.wait = false; }
                    const o = Math.max(0, Math.min(255, ev.opacity() + f.step));
                    ev.setOpacity(o);
                    if ((f.step > 0 && o >= 255) || (f.step < 0 && o <= 0)) { f.done = true; if (f.step < 0) { ev.setImage("", 0); ev.setOpacity(255); } }
                }
                film.fades = film.fades.filter(f => !f.done);
            }
        }, { owner: PLUGIN, name: "heartFilm" });
        // no autosave while an ending plays (the engine saves after every transfer - a save in the middle of a scene would load
        // into half of it); the night's sleep before the town's scenes is saved once the game goes on (Atmosphere)
        const _shouldAutosave = Scene_Map.prototype.shouldAutosave;
        Scene_Map.prototype.shouldAutosave = function() {
            return film.cinema ? false : _shouldAutosave.call(this);
        };
        // a new game / a loaded save: nothing of a scene is left over
        for (const ev of ["newGame", "load"]) T.on(ev, () => { film.end(); film.pending = null; }, { owner: PLUGIN });
        // F9's jump to an ending: on the chamber's map the scene starts by itself
        T.on("mapReady", e => {
            if (!film.pending || !D() || e.mapId !== D().MAPS.heart) return;
            const p = film.pending;
            film.pending = null;
            const w = world(), h = heartEvent();
            const list = (w.lord.stance !== "absent" && !state().lord ? lordList(w.lord.stance, w) : []).concat(F.call("place", []),
                C.script("Underground.ending(" + JSON.stringify(p.kind) + ", " + JSON.stringify(p.who) + ", this)"));
            $gameMap._interpreter.setup(list.concat([{ code: 0, indent: 0, parameters: [] }]), h ? h.eventId() : 0);
        }, { owner: PLUGIN });
    }
    Object.assign(film, {
        fades: [], shots: [], asker: null,
        // the hero before the Heart, facing it (a scene starts from there)
        place() {
            if (!window.$gameMap || $gameMap.mapId() !== D().MAPS.heart) return false;
            const [x, y, dir] = H().SPOTS.hero;
            $gamePlayer.locate(x, y);
            $gamePlayer.setDirection(dir);
            return true;
        },
        start() { film.cinema = true; return true; },
        end() {
            film.cinema = false;
            film.next = null;
            hfx.mode = null;
            if (window.$gameScreen) $gameScreen.startTint([0, 0, 0, 0], 1);
            return true;
        },
        walk(interp, id, x, y, dir) {
            const ch = charOf(id);
            if (!ch) return false;
            const list = pathTo(ch.x, ch.y, x, y).map(d => ({ code: MOVE[d], indent: null }));
            if (id < 0) { list.unshift({ code: 37, indent: null }); list.push({ code: 38, indent: null }); }   // (the hero through the cast)
            if (dir && TURN[dir]) list.push({ code: TURN[dir], indent: null });
            list.push({ code: 0 });
            ch.forceMoveRoute({ list, repeat: false, skippable: true, wait: false });
            if (interp && interp.setWaitMode) { interp._characterId = id; interp.setWaitMode("route"); }
            return true;
        },
        appear(interp, id, sheet, x, y, dir, name) {
            const ev = charOf(id);
            if (!ev) return false;
            if (name && ev.event()) ev.event().name = name;   // (the asker: the plate in the talk shows who came)
            ev.locate(x, y);
            if (sheet) ev.setImage(sheet, 0);
            ev.setDirection(dir || 2);
            ev.setThrough(true);
            ev.setOpacity(0);
            film.fades.push({ id, step: 17 });
            AudioManager.playSe({ name: "Move1", volume: 45, pitch: 80, pan: 0 });
            return true;
        },
        leave(interp, id) {
            const ev = charOf(id);
            if (!ev || !ev.characterName()) return false;
            const [x, y] = H().SPOTS.door, onHeart = $gameMap.mapId() === D().MAPS.heart;
            const list = (onHeart ? pathTo(ev.x, ev.y, x, y) : []).map(d => ({ code: MOVE[d], indent: null }));
            list.push({ code: 0 });
            ev.forceMoveRoute({ list, repeat: false, skippable: true, wait: false });
            if (interp && interp.setWaitMode) { interp._characterId = id; interp.setWaitMode("route"); }
            film.fades = film.fades.filter(f => f.id !== id);
            film.fades.push({ id, step: -12, wait: true });   // (the fade-out waits till the walk is over)
            return true;
        },
        face(interp, id, dir) { const ch = charOf(id); if (ch) ch.setDirection(dir); return !!ch; },
        balloon(interp, id, n) { const ch = charOf(id); if (ch) $gameTemp.requestBalloon(ch, n); return !!ch; },
        notice(interp, text) { T.popup(text, { top: true }); return true; },
        caption(interp, text, frames) { film.cap = { text: String(text), t: 0, life: W(frames || 46) }; return true; },
        fx(interp, mode) { return heartFx(mode); },
        // voices from the dark around the Heart (the Truth Layer's whispers), over the Heart or the hero
        barks(interp, n) {
            const d = D(), r = rng(hash(seedOf(), "heartBarks", Graphics.frameCount)), who = heartEvent() || $gamePlayer;
            for (let i = 0; i < (n || 3); i++) {
                const line = r.pick(d.WHISPERS);
                setTimeout(() => T.call("SpeechBubbles", "say", i % 2 ? $gamePlayer : who, line, 70), Math.round(i * 450 * film.speed));
            }
            AudioManager.playSe({ name: "Darkness3", volume: 30, pitch: 140, pan: 0 });
            return true;
        },
        // "for one moment you know everything": the truths of the Truth Layer, one after another, over the hero
        montage() {
            const d = D(), lines = Object.keys(d.NOTES).filter(k => d.NOTES[k].who && d.NOTES[k].who !== "hero").map(k => d.NOTES[k].text.split("\n")[0]);
            const r = rng(hash(seedOf(), "montage"));
            for (let i = 0; i < 7 && lines.length; i++) {
                const l = lines.splice(Math.floor(r() * lines.length), 1)[0];
                setTimeout(() => T.call("SpeechBubbles", "say", $gamePlayer, l, 40), Math.round(i * 360 * film.speed));
            }
            return true;
        },
        // the next morning (the hero climbed a hundred floors and slept): 11:00 - after the market's first hours
        morning() {
            if ($gameSystem.sleepUntilHour) $gameSystem.sleepUntilHour(11);
            else if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(11);
            return true;
        },
        lord(interp, stance, choice, told) {
            const s = state();
            s.lord = { stance, choice, told: told || null, day: T.time.day() };
            T.emit("undergroundLord", Object.assign({}, s.lord));
            return true;
        },
        // a scene up above: its cast goes onto that map as it loads
        prepare(interp, key, map, actors) {
            film.next = { key, map, actors: actors || [] };
            if (map === $gameMap.mapId()) $gamePlayer.requestMapReload();   // (the same map again: its data and events made anew)
            return true;
        },
        // ...arrived: the interpreter belongs to this map now (commands about events work), who lives here steps aside for the scene,
        // the hero is the camera (unseen) - or stands in the scene
        arrive(interp, key, hero) {
            const id = $gameMap.mapId();
            if (interp) interp._mapId = id;
            if ($gameMap._interpreter) $gameMap._interpreter._mapId = id;
            const mine = new Set((film.next ? film.next.actors : []).map(a => a.id));
            for (const ev of $gameMap.events()) {
                const n = ev.eventId();
                if (mine.has(n)) continue;
                if ((id === 1 && n >= 1 && n <= 4) || (n >= 900 && n <= 949) || (n >= 951 && n <= 959)) ev.erase();
            }
            $gamePlayer.setTransparent(!hero);
            if (hero) { $gamePlayer.locate(hero[0], hero[1]); $gamePlayer.setDirection(hero[2] || 8); }
            $gamePlayer.refresh && $gamePlayer.refresh();
            film.at = key;
            return true;
        },
        heroIn(interp, x, y, dir) {
            $gamePlayer.setTransparent(false);
            $gamePlayer.locate(x, y);
            $gamePlayer.setDirection(dir || 8);
            AudioManager.playSe({ name: "Move1", volume: 50, pitch: 90, pan: 0 });
            return true;
        },
        // tests: how fast the scenes' waits go (1 = as written)
        setSpeed(v) { film.speed = Math.max(0.05, Number(v) || 1); return film.speed; }
    });

    // ---- F9: jump to an ending with a world chosen (Debug.js's menu; the rows are added here - Debug.js is not changed)
    function debugEnding(kind, who, worldKey, lordKey) {
        const d = D(), s = state(), dbg = H().DEBUG;
        if (!d.ENDINGS[kind]) return false;
        const wk = dbg.worlds.find(x => x.key === (worldKey || "")) || dbg.worlds[0];
        s.ending = null;
        s.lord = null;
        s.forceWorld = wk.world ? JSON.parse(JSON.stringify(wk.world)) : null;
        s.forceLord = lordKey || null;
        s.forceLocks.all = true;
        const n = wk.world && wk.world.locks ? wk.world.locks : 3;
        s.locks = {};
        for (const k of d.LOCKS.order.slice(0, Math.max(d.LOCKS.need, n))) s.locks[k] = true;
        film.end();
        film.pending = { kind, who: who || "hero" };
        const [x, y, dir] = H().SPOTS.hero;
        $gamePlayer.setTransparent(false);
        return travel([d.MAPS.heart, x, y, dir]);
    }
    let debugHooked = false;
    function hookDebug() {
        if (debugHooked || !inGame || !window.Scene_Debug || !D() || !D().HEART) return;
        debugHooked = true;
        const dbg = () => H().DEBUG, pick = { end: 0, world: 0, lord: 0 };
        const label = {
            heartEnd: () => { const [k, w] = dbg().endings[pick.end]; return "Serce: zakończenie „" + dbg().endingName(k, w) + "”   ←→ zmień, OK zagraj (świat i Lord z rzędów niżej)"; },
            heartWorld: () => "Serce: świat - " + dbg().worlds[pick.world].name + "   ←→",
            heartLord: () => "Serce: Lord przy Sercu - " + dbg().lords[pick.lord].name + "   ←→"
        };
        const ROWS = { heartEnd: "end", heartWorld: "world", heartLord: "lord" };
        const SIZE = { end: () => dbg().endings.length, world: () => dbg().worlds.length, lord: () => dbg().lords.length };
        const _create = Scene_Debug.prototype.create;
        Scene_Debug.prototype.create = function() {
            _create.call(this);
            const list = this._list;
            if (!list || !list._all) return;
            const at = list._all.findIndex(r => r.kind === "ugLifts");
            const rows = Object.keys(ROWS).map(kind => ({ tab: 0, kind, label: label[kind](), icon: kind === "heartEnd" ? 189 : 195 }));
            list._all.splice(at >= 0 ? at + 1 : list._all.length, 0, ...rows);
            const _change = list.changeQty;
            list.changeQty = function(delta) {
                const row = this.rowData();
                if (row && ROWS[row.kind]) {
                    const k = ROWS[row.kind];
                    pick[k] = (pick[k] + delta + SIZE[k]()) % SIZE[k]();
                    row.label = label[row.kind]();
                    SoundManager.playCursor();
                    this.redrawItem(this.index());
                    return;
                }
                return _change.call(this, delta);
            };
            if (this._tab === 0) list.setTab(0, list.index());
        };
        const _onOk = Scene_Debug.prototype.onOk;
        Scene_Debug.prototype.onOk = function() {
            const row = this._list.rowData();
            if (row && row.kind === "heartEnd") {
                const [k, w] = dbg().endings[pick.end];
                this.popScene();
                debugEnding(k, w, dbg().worlds[pick.world].key, dbg().lords[pick.lord].key);
                SoundManager.playOk();
                return;
            }
            if (row && (row.kind === "heartWorld" || row.kind === "heartLord")) { this._list.changeQty(1); this._list.activate(); return; }
            return _onOk.call(this);
        };
        Scene_Debug.prototype.heartPick = pick;
    }
    if (inGame) {
        const _Scene_Boot_start = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            _Scene_Boot_start.apply(this, arguments);
            hookDebug();
        };
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
        world, lordStance, film, heartFx, debugEnding, shotsOf: (kind, who) => shotsOf(world(), { kind, guardian: kind === "straznik" ? (who || "hero") : null }),
        filmLog: () => film.log.slice(), forceWorld: w => { state().forceWorld = w ? JSON.parse(JSON.stringify(w)) : null; return state().forceWorld; },
        forceLord: v => { state().forceLord = v || null; return state().forceLord; },
        truths: () => Object.assign({}, state().truths), whisper, startMoment, showVision: (id, i) => { const ev = $gameMap.event(id); return ev ? showVision(ev, i !== undefined ? D().APPARITIONS[i] : null) : null; },
        waterAt, clearCache: () => cache.clear()
    };
    window.Underground = T.register(PLUGIN, api);

    // the data part, when it is not on the plugin list (it must be listed right above this file - see docs/PODZIEMIA.md)
    if (inGame && !D() && PluginManager.loadScript) PluginManager.loadScript("Underground_Data");
})();
