// Page-side brute force (2026-11-01): from every walkable lower-ground spot near a hill, walk in the 8 directions (the game's own player update, a held key for N
// frames, sliding along the edge included): the hero must never end (or pass) on the plateau beyond the strip. Returns the failures.
// Parameters: MAP, RAD (cells around the hill's bounding box), FRAMES, UP (true: start on the plateau and try to get down).
module.exports = (RAD, FRAMES, UP) => `(() => {
    const W = window.Wzgorza, g = W.geo(), P = $gamePlayer, TW = 48;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) if (g.hin[y * g.W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const near = new Uint8Array(g.W * g.H);   // cells within RAD of any hill cell (the map's other parts are not the question)
    for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) if (g.hin[y * g.W + x]) for (let dy = -${RAD}; dy <= ${RAD}; dy++) for (let dx = -${RAD}; dx <= ${RAD}; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < g.W && Y < g.H) near[Y * g.W + X] = 1; }
    const DIRS = { 1: ["left", "down"], 2: ["down"], 3: ["right", "down"], 4: ["left"], 6: ["right"], 7: ["left", "up"], 8: ["up"], 9: ["right", "up"] };
    const STAIR = new Set([24, 25, 26, 27, 32, 33, 34, 35]);
    // the stairs are the one way up: a feet point deeper than the strip is allowed only in a column with a stair tile within 4 rows below (or 1 above)
    const stairCol = (x, y) => { const cx = Math.floor(x / TW), cy = Math.floor(y / TW); for (let k = -1; k <= 4; k++) { const yy = cy + k; if (cx < 0 || cx >= g.W || yy < 0 || yy >= g.H) continue; if (STAIR.has(g.n0[yy * g.W + cx])) return true; } return false; };
    const offStairs = (px, py) => W.feetPts(px, py).some(([x, y]) => { const st = W.edgeState(x, y); return st.inn && !(st.d <= st.lim) && !stairCol(x, y); });
    let uncoveredOk = false;   // (the player's rule 4: a hero in the strip is always covered - here: the body can be covered; a start already in such a spot is not counted)
    const keys = ["left", "right", "up", "down"];
    const fails = [], seen = new Set(); let runs = 0, starts = 0, movedRuns = 0;
    const um = SceneManager.updateMain;
    const release = () => { for (const k of keys) Input._currentState[k] = false; };
    const pos = () => [Math.round(P._realX * TW), Math.round(P._realY * TW)];
    const feetIn = (fx, fy) => { const st = W.standing(fx, fy); return st; };
    for (let ty = Math.max(0, y0 - ${RAD}); ty <= Math.min(g.H - 1, y1 + ${RAD}); ty++) for (let tx = Math.max(0, x0 - ${RAD}); tx <= Math.min(g.W - 1, x1 + ${RAD}); tx++) for (const [ox, oy] of [[0, 0], [24, 0], [0, 24], [24, 24]]) {
        if (!near[ty * g.W + tx]) continue;
        const fx = tx * TW + ox, fy = ty * TW + oy;
        const st0 = W.standing(fx, fy);
        if (${UP ? "st0 !== 2" : "st0 !== 0"} || (${UP ? "false" : "W.bodyBad(fx, fy)"})) continue;
        P.setTransparent(false); P._wzUp = ${UP ? "true" : "false"};
        P._realX = fx / TW; P._realY = fy / TW; P._x = Math.round(P._realX); P._y = Math.round(P._realY);
        if (P.freeBlocker && P.freeBlocker(fx, fy, fx, fy)) continue;
        starts++;
        for (const d of Object.keys(DIRS)) {
            P._wzUp = ${UP ? "true" : "false"}; P._realX = fx / TW; P._realY = fy / TW; P._x = Math.round(P._realX); P._y = Math.round(P._realY); P._moveRoute = null;
            release(); for (const k of DIRS[d]) Input._currentState[k] = true; Input._updateDirection();
            runs++;
            let bad = null; const [sx0, sy0] = pos();
            for (let f = 0; f < ${FRAMES}; f++) {
                Input._updateDirection(); P.update(true);
                const [px, py] = pos(); const st = W.standing(px, py);
                if (${UP ? "st === 0" : "(st === 2 && offStairs(px, py)) || (st === 1 && W.bodyBad(px, py) && !uncoveredOk)"}) { bad = [px, py, st, f]; break; }
            }
            release(); { const [ex, ey] = pos(); if (Math.abs(ex - sx0) + Math.abs(ey - sy0) > 20) movedRuns++; }
            if (bad) { const key = tx + "," + ty + "," + ox + "," + oy; if (!seen.has(key)) { seen.add(key); fails.push({ from: [tx, ty, ox, oy], dir: d, at: bad }); } }
        }
    }
    release();
    return JSON.stringify({ starts, runs, movedRuns, fails: fails.length, sample: fails.slice(0, 12) });
})()`;
