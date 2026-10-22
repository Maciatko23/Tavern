// Chodzik do pomiarów (wstrzykiwany do strony przez CDP, NIE wtyczka gry): droga po polach (Dijkstra, 8 kierunków tam, gdzie oba
// rogi wolne - jak autopilot tests/autopilot/ap.js), chodzenie prawdziwymi klawiszami (Input._currentState) w Scene_Map.update.
// window.WALK.dist(tx, ty)          -> długość drogi w polach (skos = 1.414) z miejsca bohatera albo null
// window.WALK.go(tx, ty, run)       -> zaczyna iść; WALK.state(): { busy, done, ok, frames, ms, tiles }
(function() {
    if (window.WALK) return "same";
    const W = window.WALK = { busy: false, gen: null, res: null };
    const P = () => $gamePlayer;
    function key(k, on) { Input._currentState[k] = on; }
    function setMove(keys) { for (const k of ["left", "right", "up", "down"]) key(k, keys.includes(k)); }
    function passStep(x, y, dx, dy) {
        const p = P();
        if (dx && dy) {
            const h = dx > 0 ? 6 : 4, v = dy > 0 ? 2 : 8;
            return p.canPass(x, y, h) && p.canPass(x + dx, y, v) && p.canPass(x, y, v) && p.canPass(x, y + dy, h);
        }
        return p.canPass(x, y, dx > 0 ? 6 : dx < 0 ? 4 : dy > 0 ? 2 : 8);
    }
    const STEPS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    function exitTiles(tx, ty) {
        const out = new Set(), w = $gameMap.width();
        for (const e of $gameMap.events()) {
            const pg = e.page();
            if (pg && (pg.trigger === 1 || pg.trigger === 2) && pg.list.some(c => c.code === 201) && !(e.x === tx && e.y === ty)) out.add(e.y * w + e.x);
        }
        return out;
    }
    // the target tile itself may be a transfer (touch) or blocked (a door event): it is reached from a neighbour
    function field(sx, sy, tx, ty) {
        const w = $gameMap.width(), h = $gameMap.height(), n = w * h, avoid = exitTiles(tx, ty);
        const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), heap = [];
        const push = (d, i) => { heap.push([d, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
        const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
        dist[sy * w + sx] = 0; push(0, sy * w + sx);
        while (heap.length) {
            const [d, i] = pop();
            if (d > dist[i]) continue;
            const x = i % w, y = (i / w) | 0;
            if (x === tx && y === ty) break;
            for (const [dx, dy, c] of STEPS) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                const j = ny * w + nx, nd = d + c;
                if (nd >= dist[j] || avoid.has(j)) continue;
                const isT = nx === tx && ny === ty;
                if (!passStep(x, y, dx, dy) && !(isT && !dx !== !dy)) continue;   // (the target: a straight step into it is enough)
                dist[j] = nd; prev[j] = i; push(nd, j);
            }
        }
        return { dist, prev, w };
    }
    function path(sx, sy, tx, ty) {
        const f = field(sx, sy, tx, ty), i0 = ty * f.w + tx;
        if (!isFinite(f.dist[i0])) return null;
        const out = []; let i = i0;
        while (i !== -1) { out.unshift([i % f.w, (i / f.w) | 0]); i = f.prev[i]; }
        return { len: f.dist[i0], tiles: out };
    }
    W.dist = (tx, ty, sx, sy) => { const p = path(sx === undefined ? P().x : sx, sy === undefined ? P().y : sy, tx, ty); return p ? Math.round(p.len * 100) / 100 : null; };
    function segments(t) {
        const segs = [];
        for (let k = 1; k < t.length; k++) {
            const dx = t[k][0] - t[k - 1][0], dy = t[k][1] - t[k - 1][1], last = segs[segs.length - 1];
            if (last && last.dx === dx && last.dy === dy) { last.x = t[k][0]; last.y = t[k][1]; }
            else segs.push({ dx, dy, x: t[k][0], y: t[k][1] });
        }
        return segs;
    }
    const TOL = 0.07;
    function* followSeg(s, startMap) {
        let last = "", still = 0;
        for (let n = 0; n < 3000; n++) {
            if ($gameMap.mapId() !== startMap || P().isTransferring()) return true;
            const rx = P()._realX, ry = P()._realY;
            const needX = s.dx !== 0 && (s.x - rx) * s.dx > TOL, needY = s.dy !== 0 && (s.y - ry) * s.dy > TOL;
            if (!needX && !needY) return true;
            const keys = [];
            if (needX) keys.push(s.dx > 0 ? "right" : "left");
            if (needY) keys.push(s.dy > 0 ? "down" : "up");
            setMove(keys);
            const k = rx.toFixed(3) + "," + ry.toFixed(3);
            still = k === last && P().canMove() ? still + 1 : 0;
            last = k;
            if (still > 30) { setMove([]); return false; }
            yield;
        }
        return false;
    }
    function* walk(tx, ty, run) {
        const startMap = $gameMap.mapId(), t0 = performance.now(), f0 = Graphics.frameCount, h0 = $gameSystem.dayNightHour();
        let stuck = 0, plen = null;
        for (let attempt = 0; attempt < 6; attempt++) {
            const p = path(P().x, P().y, tx, ty);
            if (!p) { W.res = { ok: false, why: "no path", from: [P().x, P().y] }; return; }
            if (plen === null) plen = p.len;
            key("shift", !!run);
            let bad = false;
            for (const s of segments(p.tiles)) { if (!(yield* followSeg(s, startMap))) { bad = true; break; } if ($gameMap.mapId() !== startMap || P().isTransferring()) break; }
            setMove([]);
            if ($gameMap.mapId() !== startMap || P().isTransferring() || (P().x === tx && P().y === ty)) break;
            if (bad) stuck++;
            for (let i = 0; i < 4; i++) yield;
        }
        key("shift", false); setMove([]);
        const transferred = $gameMap.mapId() !== startMap || P().isTransferring();
        W.res = { ok: transferred || (P().x === tx && P().y === ty), transferred, plen: plen && Math.round(plen * 100) / 100, frames: Graphics.frameCount - f0,
            ms: Math.round(performance.now() - t0), hours: Math.round(($gameSystem.dayNightHour() - h0) * 1000) / 1000, stuck, at: [P().x, P().y] };
    }
    W.go = function(tx, ty, run) { W.res = null; W.gen = walk(tx, ty, run); W.busy = true; return true; };
    W.state = () => ({ busy: W.busy, res: W.res });
    W.stop = () => { W.gen = null; W.busy = false; setMove([]); key("shift", false); };
    const _update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (W.gen) {
            try { const r = W.gen.next(); if (r.done) { W.gen = null; W.busy = false; } }
            catch (e) { W.res = { ok: false, why: String(e && e.message) }; W.gen = null; W.busy = false; setMove([]); }
        }
        _update.call(this);
    };
    return "ok";
})();
