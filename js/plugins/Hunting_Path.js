//=============================================================================
// Hunting_Path.js
//=============================================================================
// The way round what is in the way, in 8 directions (split out of Hunting.js, 2026-09-29): a grid of the map kept for some frames,
// A* over it (path8), the searches' budget of a frame, the tiles an actor keeps off, the stuck watch, the hero's field on foot and the
// far spots by the map's edge a runner goes to. For the wild animals (Hunting_AI.js) and the dog (Dog.js, through Hunting.path8).
// Functions only: Hunting.js holds every engine hook.

/*:
 * @target MZ
 * @plugindesc Droga w 8 kierunkach (część Hunting.js): zwierzęta i pies obchodzą drzewa, krzaki, budynki i ściany, nie utykają. Sama nic nie robi - parametry i haki ma Hunting.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting
 *
 * @help
 * ============================================================================
 * Hunting_Path.js - droga w 8 kierunkach
 * ============================================================================
 * Część Hunting.js (wydzielona z niego): jak dzikie zwierzęta i pies znajdują
 * drogę dookoła tego, co stoi na przeszkodzie (A* po siatce mapy), i jak
 * poznają, że utknęły. Sama nic nie robi: woła ją Hunting.js (i przez niego
 * Dog.js). Parametry ma Hunting.js.
 *
 * KOLEJNOŚĆ: Hunting, Hunting_Path, Hunting_AI, Hunting_Weapons. Dopóki nie
 * jest wpisana na listę wtyczek, Hunting.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Hunting_Path.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Hunting_parts") || T.register("Hunting_parts", {});
    if (P.path) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("Hunting_Path.js: musi być pod Hunting.js na liście wtyczek (Hunting.js is missing or below)");
    const { DIRS8, DIAGONAL, STEP, VEC_DIR, EDGE, roamingCanStep, roamingStep } = P.core;

    // ------------------------------------------------------------------
    // Path8: the way round what is in the way, in 8 directions, for the wild animals and the dog (Dog.js). The engine's
    // findDirectionTo walks only the four ways, looks 12 steps ahead and asks every event of the map about every tile it tries (in a
    // wood that stalled the game once). Here: A* over a grid of the map kept for some frames (the tiles' passage, the events in the
    // way, the buildings); a slant only where both straight ways round its corner are open too (no cutting past a tree); a cap on the
    // nodes of a search and on the searches in a frame; a path found is followed for a while.
    // ------------------------------------------------------------------
    // nodes: a search's cap; perFrame: the searches in one frame (past it an actor follows its old path or steps greedily); keep: the
    // frames a path is followed before it is searched again; tiles / events: the frames the grid's parts are kept
    const PATH = { nodes: 1600, perFrame: 4, keep: 24, tiles: 600, events: 20 };
    const PBIT = { 2: 1, 4: 2, 6: 4, 8: 8 };
    const DX8 = [0, -1, 1, 0, -1, 1, -1, 1], DY8 = [1, 0, 0, -1, 1, 1, -1, -1], SB8 = [1, 2, 4, 8];   // (DIRS8 as steps; the bits of the straight ones)
    // per tile: pass - the map's passage of its four sides; ev - an event in the way stands there; bld - a building; s4a / s4d - the
    // straight steps (bits of PBIT) that go from it, for a wild animal (all of a building keeps it out: Game_Animal.isMapPassable)
    // and for the dog (only a building's solid cells, the map's passage of Farming.js)
    const pgrid = { mapId: -1, w: 0, h: 0, pass: null, ev: null, bld: null, s4a: null, s4d: null, tilesAt: -1e9, eventsAt: -1e9, rev: -1 };
    function pathGrid() {
        const now = Graphics.frameCount, w = $gameMap.width(), h = $gameMap.height(), mapId = $gameMap.mapId(), G = pgrid, n = w * h;
        if (G.mapId !== mapId || G.w !== w || G.h !== h) {
            Object.assign(G, { mapId, w, h, pass: new Uint8Array(n), ev: new Uint8Array(n), bld: new Uint8Array(n), s4a: new Uint8Array(n), s4d: new Uint8Array(n), tilesAt: -1e9, eventsAt: -1e9, rev: -1 });
        }
        const F = T.api("Farming"), rev = F && F.farm ? F.farm().rev : 0;
        let changed = false;
        if (now - G.tilesAt > PATH.tiles || now < G.tilesAt || (rev !== G.rev && now - G.tilesAt > 30)) {   // (the farm changed - a building put up or taken down: soon)
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const i = y * w + x;
                G.pass[i] = ($gameMap.isPassable(x, y, 2) ? 1 : 0) | ($gameMap.isPassable(x, y, 4) ? 2 : 0) | ($gameMap.isPassable(x, y, 6) ? 4 : 0) | ($gameMap.isPassable(x, y, 8) ? 8 : 0);
                G.bld[i] = F && F.buildingAt(x, y) ? 1 : 0;
            }
            G.tilesAt = now;
            G.rev = rev;
            changed = true;
        }
        if (now - G.eventsAt > PATH.events || now < G.eventsAt) {   // (the events that keep a character out: Game_Map.eventsXyNt)
            G.ev.fill(0);
            for (const e of $gameMap.events()) if (e.isNormalPriority() && !e.isThrough() && $gameMap.isValid(e._x, e._y)) G.ev[e._y * w + e._x] = 1;
            G.eventsAt = now;
            changed = true;
        }
        if (changed) {
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const i = y * w + x, p = G.pass[i];
                let a = 0, dg = 0;
                if (p) for (let k = 0; k < 4; k++) {
                    const x2 = x + DX8[k], y2 = y + DY8[k], j = y2 * w + x2;
                    if (!(p & SB8[k]) || x2 < 0 || y2 < 0 || x2 >= w || y2 >= h || !(G.pass[j] & SB8[3 - k]) || G.ev[j]) continue;   // (3 - k: the side it comes in by)
                    dg |= SB8[k];
                    if (!G.bld[j]) a |= SB8[k];
                }
                G.s4a[i] = a;
                G.s4d[i] = dg;
            }
        }
        return G;
    }
    // one step from (x, y) the straight way d, as the grid sees it (Game_Character.canPass); animal: see pgrid
    function gridStep(G, x, y, d, animal) {
        return x >= 0 && y >= 0 && x < G.w && y < G.h && ((animal ? G.s4a : G.s4d)[y * G.w + x] & PBIT[d]) !== 0;
    }
    // any of the 8 ways: a slant only when both straight ways round its corner go as well (no cutting past a tree's corner)
    function gridStep8(G, x, y, d, animal) {
        const diag = DIAGONAL[d];
        if (!diag) return gridStep(G, x, y, d, animal);
        const [hd, vd] = diag, [sx, sy] = STEP[d];
        return gridStep(G, x, y, hd, animal) && gridStep(G, x, y, vd, animal) && gridStep(G, x + sx, y, vd, animal) && gridStep(G, x, y + sy, hd, animal);
    }
    // a tile it may stand on
    const gridOpen = (G, x, y, animal) => x >= 0 && y >= 0 && x < G.w && y < G.h && G.pass[y * G.w + x] !== 0 && !G.ev[y * G.w + x] && !(animal && G.bld[y * G.w + x]);
    // the 8-way steps of the straight line from tile (x0, y0) to (x1, y1) (Bresenham): does every one of them go? The last one (into
    // the hero's tile: he stands there) is not asked unless toEnd
    function clearLine(G, x0, y0, x1, y1, animal, toEnd) {
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
        let x = x0, y = y0, err = dx - dy;
        while (x !== x1 || y !== y1) {
            const e2 = 2 * err;
            let mx = 0, my = 0;
            if (e2 > -dy) { err -= dy; mx = sx; }
            if (e2 < dx) { err += dx; my = sy; }
            const last = x + mx === x1 && y + my === y1;
            if ((!last || toEnd) && !gridStep8(G, x, y, VEC_DIR[mx + "," + my], animal)) return false;
            x += mx;
            y += my;
        }
        return true;
    }
    // the first step of that line (numpad; 0 when it is there)
    function lineDir(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), e2 = 2 * (dx - dy);
        return VEC_DIR[(e2 > -dy ? Math.sign(x1 - x0) : 0) + "," + (e2 < dx ? Math.sign(y1 - y0) : 0)] || 0;
    }
    // the straight 8-way line (vx, vy) from (x, y): its next n steps all go
    function rayClear(G, x, y, vx, vy, n, animal) {
        const d = VEC_DIR[vx + "," + vy];
        for (let k = 0; k < n; k++) {
            if (!d || !gridStep8(G, x, y, d, animal)) return false;
            x += vx;
            y += vy;
        }
        return true;
    }
    // the search's buffers, kept from one search to the next (a stamp tells this search's marks from the old ones)
    let pCost = null, pFrom = null, pSeen = null, pClosed = null, pHeapI = null, pHeapF = null, pStamp = 0, pHeapN = 0;
    function pathBuffers(n) {
        if (pCost && pCost.length >= n) return;
        pCost = new Float32Array(n); pFrom = new Int32Array(n); pSeen = new Int32Array(n); pClosed = new Int32Array(n);
        pHeapI = new Int32Array(n * 8 + 8); pHeapF = new Float32Array(n * 8 + 8); pStamp = 0;
    }
    function heapPush(i, f) {
        let k = pHeapN++;
        while (k > 0) {
            const p = (k - 1) >> 1;
            if (pHeapF[p] <= f) break;
            pHeapI[k] = pHeapI[p]; pHeapF[k] = pHeapF[p]; k = p;
        }
        pHeapI[k] = i; pHeapF[k] = f;
    }
    function heapPop() {
        const top = pHeapI[0], n = --pHeapN, li = pHeapI[n], lf = pHeapF[n];
        let k = 0;
        for (;;) {
            let c = 2 * k + 1;
            if (c >= n) break;
            if (c + 1 < n && pHeapF[c + 1] < pHeapF[c]) c++;
            if (pHeapF[c] >= lf) break;
            pHeapI[k] = pHeapI[c]; pHeapF[k] = pHeapF[c]; k = c;
        }
        pHeapI[k] = li; pHeapF[k] = lf;
        return top;
    }
    // A* from tile (sx, sy) towards (tx, ty). opts: animal (see gridStep), near (tiles: that close to (tx, ty) will do - "beside"),
    // goal(x, y) (any tile it likes will do, the nearest one: then (tx, ty) is not aimed at), avoid (tile indices to keep off),
    // nodes (the cap). Returns { path: tile indices, the first step first, reached } - when the goal cannot be reached (or not within
    // the cap), the way to the tile nearest to (tx, ty) it found
    function search8(G, sx, sy, tx, ty, opts) {
        const w = G.w, animal = !!opts.animal, near = opts.near || 0, goal = opts.goal || null, avoid = opts.avoid || null, cap = opts.nodes || PATH.nodes;
        pathBuffers(w * G.h);
        if (++pStamp > 2e9) { pSeen.fill(0); pClosed.fill(0); pStamp = 1; }
        const oct = (x, y) => { const ax = Math.abs(x - tx), ay = Math.abs(y - ty); return Math.max(ax, ay) + 0.4142 * Math.min(ax, ay); };
        const hOf = goal ? () => 0 : (x, y) => Math.max(0, oct(x, y) - near);
        const isGoal = goal || ((x, y) => (near > 0 ? Math.hypot(x - tx, y - ty) <= near + 1e-6 : x === tx && y === ty));
        const start = sy * w + sx;
        pHeapN = 0;
        pCost[start] = 0; pFrom[start] = -1; pSeen[start] = pStamp;
        heapPush(start, hOf(sx, sy));
        const S4 = animal ? G.s4a : G.s4d;   // (gridStep8 by the bits: the straight steps of the tile, and of the two beside a slant)
        let best = start, bestD = oct(sx, sy), found = -1, count = 0;
        while (pHeapN > 0 && count < cap) {
            const i = heapPop();
            if (pClosed[i] === pStamp) continue;
            pClosed[i] = pStamp;
            count++;
            const x = i % w, y = (i - x) / w, m = S4[i];
            if (isGoal(x, y)) { found = i; break; }
            const dd = oct(x, y);
            if (dd < bestD) { bestD = dd; best = i; }
            for (let k = 0; k < 8; k++) {
                const ox = DX8[k], oy = DY8[k];
                if (k < 4) { if (!(m & SB8[k])) continue; }
                else {
                    const hb = ox < 0 ? 2 : 4, vb = oy < 0 ? 8 : 1;
                    if (!(m & hb) || !(m & vb) || !(S4[i + ox] & vb) || !(S4[i + oy * w] & hb)) continue;
                }
                const j = i + oy * w + ox;
                if (pClosed[j] === pStamp || (avoid && avoid.includes(j))) continue;
                const g = pCost[i] + (k < 4 ? 1 : 1.4142);
                if (pSeen[j] === pStamp && g >= pCost[j]) continue;
                pSeen[j] = pStamp; pCost[j] = g; pFrom[j] = i;
                heapPush(j, g + hOf(x + ox, y + oy));
            }
        }
        const end = found >= 0 ? found : best, path = [];
        for (let i = end; i !== start; i = pFrom[i]) path.push(i);
        path.reverse();
        return { path, reached: found >= 0 };
    }
    // the searches of this frame (PATH.perFrame at most): true when one more may run
    let pFrame = -1, pSearches = 0;
    function searchBudget() {
        if (pFrame !== Graphics.frameCount) { pFrame = Graphics.frameCount; pSearches = 0; }
        if (pSearches >= PATH.perFrame) return false;
        pSearches++;
        return true;
    }
    // no search this frame: the open way (of 8) that ends nearest to the target, when nearer than here
    function greedyDir(G, x, y, tx, ty, animal) {
        let best = 0, bestD = Math.hypot(tx - x, ty - y) - 0.01;
        for (const d of DIRS8) {
            if (!gridStep8(G, x, y, d, animal)) continue;
            const [ox, oy] = STEP[d], nd = Math.hypot(tx - x - ox, ty - y - oy);
            if (nd < bestD) { bestD = nd; best = d; }
        }
        return best;
    }
    // tiles an actor keeps off a while (a step that did not go, a way it got nowhere on): actor._avoid = [{ i, until }]
    function avoidTile(actor, x, y, frames) {
        const G = pathGrid();
        if (x < 0 || y < 0 || x >= G.w || y >= G.h) return;
        const now = Graphics.frameCount, i = y * G.w + x;
        actor._avoid = (actor._avoid || []).filter(a => a.until > now && a.i !== i).concat([{ i, until: now + (frames || 90) }]).slice(-6);
        actor._p8 = null;
    }
    function avoidList(actor) {
        const now = Graphics.frameCount, list = (actor._avoid || []).filter(a => a.until > now).map(a => a.i);
        return list.length ? list : null;
    }
    // The next of the 8 ways (numpad; 0: nowhere nearer to go) from the actor's tile towards (tx, ty), along a path it keeps for
    // PATH.keep frames while it stands on it and the next step still goes. opts: as search8, plus key (what the walk is for).
    // Returns { dir, reached, to: the tile the path ends at, steps: how many steps it still is, greedy: no search this frame (the greedy
    // step) }
    function path8(actor, tx, ty, opts) {
        opts = opts || {};
        const G = pathGrid(), w = G.w, now = Graphics.frameCount, here = actor._y * w + actor._x, animal = !!opts.animal;
        const key = (opts.key || "") + ":" + tx + "," + ty + ":" + (opts.near || 0), P = actor._p8;
        const dirTo = i => { const nx = i % w, ny = (i - nx) / w; return VEC_DIR[(nx - actor._x) + "," + (ny - actor._y)] || 0; };
        if (P && P.key === key && P.map === G.mapId && now - P.t <= (opts.keep || PATH.keep)) {
            const at = P.start === here ? 0 : P.path.indexOf(here) + 1;
            if (at > 0 || P.start === here) {
                if (at >= P.path.length) return { dir: 0, reached: P.reached, to: P.to, steps: 0 };
                const d = dirTo(P.path[at]);
                if (d && gridStep8(G, actor._x, actor._y, d, animal)) return { dir: d, reached: P.reached, to: P.to, steps: P.path.length - at };
            }
        }
        if (!searchBudget()) return { dir: greedyDir(G, actor._x, actor._y, tx, ty, animal), reached: false, greedy: true, to: { x: tx, y: ty } };
        const res = search8(G, actor._x, actor._y, tx, ty, Object.assign({}, opts, { avoid: avoidList(actor) }));
        const last = res.path.length ? res.path[res.path.length - 1] : here, to = { x: last % w, y: Math.floor(last / w) };
        actor._p8 = { key, map: G.mapId, t: now, start: here, path: res.path, reached: res.reached, to };
        return { dir: res.path.length ? dirTo(res.path[0]) : 0, reached: res.reached, to, steps: res.path.length };
    }
    // the actor takes that step (numpad) when it still goes (the grid may be some frames old); when not, that tile is kept off a
    // moment and false
    function takeStep(actor, d) {
        if (!d) return false;
        if (roamingCanStep(actor, actor._x, actor._y, d)) { roamingStep(actor, d); return true; }
        const [ox, oy] = STEP[d];
        avoidTile(actor, actor._x + ox, actor._y + oy, 60);
        return false;
    }
    // A purposeful walk (a chase, a way round, a place on the ring, a flight, a walk to a place): stalled() is true once it has gone
    // STUCK.frames (longer for a slow walker) with its score (lower = better: the distance to its goal, or minus the distance from
    // what it runs from) not getting STUCK.gain better and without setting foot on a tile new to this walk - to and fro between two
    // tiles is no progress. key: what the walk is for; (gx, gy): its goal - a new key, or the goal moved off by more than
    // STUCK.drift tiles, starts a new watch; arrived: a score that means it is there (no progress wanted); unstick: the frames between
    // two looks whether it stands where it cannot take a step at all (Game_Animal.unstick)
    const STUCK = { frames: 45, gain: 0.5, seen: 24, gap: 60, drift: 3, unstick: 20 };
    function stalled(actor, key, score, arrived, gx, gy) {
        const now = Graphics.frameCount, tile = actor._y * 100000 + actor._x, perTile = 1 / Math.max(0.005, actor.distancePerFrame());
        gx = gx || 0;
        gy = gy || 0;
        let w = actor._stall;
        if (!w || w.key !== key || now - w.last > Math.max(STUCK.gap, perTile * 1.5) || Math.abs(w.gx - gx) + Math.abs(w.gy - gy) > STUCK.drift) {
            w = actor._stall = { key, gx, gy, best: score, t: now, seen: [tile], last: now };
        }
        w.last = now;
        if (score < w.best - STUCK.gain || (arrived !== undefined && score <= arrived)) { w.best = Math.min(w.best, score); w.t = now; }
        if (!w.seen.includes(tile)) { w.seen.push(tile); if (w.seen.length > STUCK.seen) w.seen.shift(); w.t = now; }
        if (now - w.t <= Math.max(STUCK.frames, perTile * 1.6)) return false;
        w.t = now;   // (said once: the walker does something about it, and the watch goes on)
        return true;
    }
    // the way to a place near him that goes a long way round (round a whole wall, out along the map's edge and back): not worth it
    const detour = (steps, x0, y0, x1, y1) => steps > 2 * Math.hypot(x1 - x0, y1 - y0) + 6;
    // How far each tile near the hero is from him on foot (for a wild animal; tiles further than `reach` steps are Infinity): a search
    // out from the tiles round him (his own may be no floor - he can stand half on a wall), kept while he stays on his tile, for some
    // frames. A place "round him" across a wall, out on the map's edge behind it, is far from him on foot.
    const heroFieldCache = { key: "", t: -1e9, dist: null };
    function heroField(reach) {
        const G = pathGrid(), hx = $gamePlayer.x, hy = $gamePlayer.y, now = Graphics.frameCount, key = G.mapId + ":" + hx + "," + hy + ":" + reach;
        const F = heroFieldCache;
        if (F.key === key && now - F.t < 30 && now >= F.t && F.dist && F.dist.length === G.w * G.h) return F.dist;
        const n = G.w * G.h, dist = F.dist && F.dist.length === n ? F.dist : new Float32Array(n), S4 = G.s4a, open = [];
        dist.fill(Infinity);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const x = hx + dx, y = hy + dy;
            if (!gridOpen(G, x, y, true)) continue;
            dist[y * G.w + x] = Math.hypot(dx, dy);
            open.push(y * G.w + x);
        }
        while (open.length) {   // (a small field: a plain list, the nearest taken each time)
            let k = 0;
            for (let j = 1; j < open.length; j++) if (dist[open[j]] < dist[open[k]]) k = j;
            const i = open[k], x = i % G.w, y = (i - x) / G.w, m = S4[i];
            open[k] = open[open.length - 1];
            open.pop();
            for (let s = 0; s < 8; s++) {
                const ox = DX8[s], oy = DY8[s];
                if (s < 4) { if (!(m & SB8[s])) continue; }
                else { const hb = ox < 0 ? 2 : 4, vb = oy < 0 ? 8 : 1; if (!(m & hb) || !(m & vb) || !(S4[i + ox] & vb) || !(S4[i + oy * G.w] & hb)) continue; }
                const j = i + oy * G.w + ox, c = dist[i] + (s < 4 ? 1 : 1.4142);
                if (c >= dist[j] || c > reach) continue;
                if (dist[j] === Infinity) open.push(j);
                dist[j] = c;
            }
        }
        F.key = key;
        F.t = now;
        F.dist = dist;
        return dist;
    }
    // stalled: the next tile of its path is kept off a while, and the way is searched again
    function unstall(actor, frames) {
        const P = actor._p8, G = pathGrid();
        if (P && P.map === G.mapId && P.path.length) {
            const here = actor._y * G.w + actor._x, at = Math.min(P.path.length - 1, P.start === here ? 0 : P.path.indexOf(here) + 1), next = P.path[at];
            avoidTile(actor, next % G.w, Math.floor(next / G.w), frames || 90);
        }
        actor._p8 = null;
    }
    // a far spot to run to, away from (fx, fy): one of the points by the map's edge (the corners, the middles of the sides) - far from
    // it and not far for the runner, on the side away from it; not `tried`
    function escapeSpot(actor, fx, fy, tried) {
        const w = $gameMap.width(), h = $gameMap.height(), spots = [];
        for (const kx of [0, 0.5, 1]) for (const ky of [0, 0.5, 1]) {
            if (kx === 0.5 && ky === 0.5) continue;
            spots.push({ x: Math.round(EDGE + kx * (w - 1 - 2 * EDGE)), y: Math.round(EDGE + ky * (h - 1 - 2 * EDGE)) });
        }
        const score = q => Math.hypot(q.x - fx, q.y - fy) - 0.6 * Math.hypot(q.x - actor._x, q.y - actor._y)   // far from it, not far for the runner
            + (((q.x - actor._x) * (actor._x - fx) + (q.y - actor._y) * (actor._y - fy)) > 0 ? 6 : 0);          // on the side away from it
        return spots.filter(q => !tried || q.x !== tried.x || q.y !== tried.y).sort((a, b) => score(b) - score(a))[0];
    }

    P.path = { PATH, STUCK, pathGrid, resetGrid: () => { pgrid.mapId = -1; }, gridStep8, gridOpen, clearLine, lineDir, rayClear, search8, searchBudget,
        costAt: i => pCost[i], greedyDir, avoidTile, avoidList, path8, takeStep, stalled, detour, heroField, unstall, escapeSpot };
})();
