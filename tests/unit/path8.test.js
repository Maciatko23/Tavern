// Hunting's way round what is in the way (Hunting_Path.js since 2026-09-29: path8 / A* over the map's grid) without the game: a fake map drawn in text. An animal
// walked step by step by path8 gets to its target through a gap, never through a wall or a blocking event and never past a
// corner on a slant; an enclosed target: as near as it can; `near`; the search budget of a frame; clearLine; the night raid chance.
const unit = require("../lib/unit.js");

const STEP = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };

// a map from text rows: "#" a wall, "." open; events: [[x, y], ...] that stand in the way
function fakeMap(rows, events, mapId) {
    const h = rows.length, w = rows[0].length;
    const open = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== "#";
    const evs = (events || []).map(([x, y]) => ({ _x: x, _y: y, isNormalPriority: () => true, isThrough: () => false }));
    return {
        width: () => w, height: () => h, mapId: () => mapId, isValid: (x, y) => x >= 0 && y >= 0 && x < w && y < h,
        isPassable: (x, y) => open(x, y), events: () => evs, open, blocked: (x, y) => evs.some(e => e._x === x && e._y === y)
    };
}

unit.test(t => {
    const G = { frameCount: 1 };
    const map = { cur: null };
    // (the plugin reads $gameMap and Graphics when it runs: the ones set here)
    const w = unit.load(["TawernaCore", "Hunting", "Hunting_Path"], { globals: { Graphics: G, get $gameMap() { return map.cur; } } });
    const H = w.Hunting;

    // walks an animal with path8 until it stands still; every step checked against the map
    function walk(m, from, to, opts) {
        map.cur = m;
        G.frameCount += 1000;   // (a new frame far on: the grid is built again for this map)
        const a = { _x: from[0], _y: from[1] }, steps = [], bad = [];
        for (let i = 0; i < 300; i++) {
            G.frameCount++;
            const r = H.path8(a, to[0], to[1], Object.assign({ animal: true, key: "test" }, opts || {}));
            if (!r.dir) break;
            const [dx, dy] = STEP[r.dir], nx = a._x + dx, ny = a._y + dy;
            if (!m.open(nx, ny) || m.blocked(nx, ny)) bad.push("into " + nx + "," + ny);
            if (dx && dy && (!m.open(a._x + dx, a._y) || !m.open(a._x, a._y + dy))) bad.push("past a corner at " + a._x + "," + a._y + " -> " + nx + "," + ny);
            a._x = nx; a._y = ny;
            steps.push(r.dir);
        }
        return { at: [a._x, a._y], steps: steps.length, bad };
    }

    // ---- the open field: the straight slant
    const open = fakeMap(["..........", "..........", "..........", "..........", "..........", "..........", "..........", ".........."], [], 1);
    let r = walk(open, [1, 1], [7, 6]);
    t.check("open ground: straight there (6 steps, 5 of them slanted), nothing wrong on the way", r.at.join() === "7,6" && r.steps === 6 && !r.bad.length, r);

    // ---- a wall with one gap far to the side
    const wall = fakeMap([
        "............",
        "............",
        "#########.##",
        "............",
        "............"
    ], [], 2);
    r = walk(wall, [1, 0], [1, 4]);
    t.check("a wall across: round through its only gap (9,2), never through the wall or past its corners", r.at.join() === "1,4" && !r.bad.length && r.steps >= 12, r);

    // ---- an event standing in the gap: the way is shut (as near as it gets)
    const shut = fakeMap([
        "............",
        "............",
        "#########.##",
        "............",
        "............"
    ], [[9, 2]], 3);
    r = walk(shut, [1, 0], [1, 4]);
    t.check("an event in the gap: it does not walk through it and stops at the wall, as near as it can get", !r.bad.length && r.at[1] === 1, r);

    // ---- an enclosed target
    const box = fakeMap([
        "..........",
        "...#####..",
        "...#...#..",
        "...#...#..",
        "...#####..",
        ".........."
    ], [], 4);
    const reachedEnclosed = (() => { map.cur = box; G.frameCount += 1000; return H.path8({ _x: 0, _y: 3 }, 5, 3, { animal: true, key: "in" }).reached; })();
    r = walk(box, [0, 3], [5, 3]);
    t.check("a target inside a closed box: not reached, it goes to the outside tile nearest to it (5,5, under the box)", reachedEnclosed === false && r.at.join() === "5,5" && !r.bad.length, { reachedEnclosed, r });

    // ---- near: beside the target will do
    r = walk(open, [0, 0], [8, 0], { near: 2 });
    t.check("near 2: it stops two tiles from the target", r.at.join() === "6,0" && !r.bad.length, r);

    // ---- the search budget: PATH.perFrame searches a frame, then a greedy step
    map.cur = wall;
    G.frameCount += 1000;
    const per = H.PATH.perFrame, got = [];
    for (let i = 0; i <= per; i++) got.push(!!H.path8({ _x: 1 + i, _y: 0 }, 1, 4, { animal: true, key: "b" + i }).greedy);
    t.check("the search budget: " + per + " searches in one frame, the next actor steps greedily", got.slice(0, per).every(g => !g) && got[per] === true, got);
    G.frameCount++;
    t.check("...and searches again in the next frame", !H.path8({ _x: 1, _y: 1 }, 1, 4, { animal: true, key: "c" }).greedy);

    // ---- clearLine: a straight 8-way line with every step open
    map.cur = wall;
    G.frameCount += 1000;
    const grid = H.pathGrid();
    t.eq("clearLine: open along a row, shut across the wall, open through the gap", [H.clearLine(grid, 0, 0, 11, 0, true), H.clearLine(grid, 1, 0, 1, 4, true), H.clearLine(grid, 9, 0, 9, 4, true)], [true, false, true]);

    // ---- the night raid chance (a pure rule): calm first days, full from day RAID.fullDay, halved by a fire
    const R = H.RAID, c = (d, f) => +H.raidChance(d, f).toFixed(5);
    t.eq("raid chance: " + (R.perHour * R.calm * 100).toFixed(1) + "%/h on days 1-" + R.calmDays + ", " + (R.perHour * 100) + "%/h from day " + R.fullDay + ", half by a fire",
        [c(1), c(R.calmDays), c(R.fullDay), c(R.fullDay + 20), c(R.fullDay, true)],
        [+(R.perHour * R.calm).toFixed(5), +(R.perHour * R.calm).toFixed(5), R.perHour, R.perHour, +(R.perHour * R.fire).toFixed(5)]);
    const mids = [4, 5, 6, 7, 8, 9].map(d => H.raidChance(d));
    t.check("...and it grows day by day in between", mids.every((v, i) => v > (i ? mids[i - 1] : H.raidChance(R.calmDays))) && mids[5] < R.perHour, mids);
});
