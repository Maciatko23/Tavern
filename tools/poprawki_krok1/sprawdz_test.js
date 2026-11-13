// Check of tools/poprawki_krok1/staging (overlay): Map003 field ring, gates, invisible walls; Map020 cottage; Map024 x98.
// CDP_PORT=9656 node tools/poprawki_krok1/sprawdz_test.js   (server: node tools/serve.js --port 8765)
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OVERLAY = path.join(__dirname, "staging");
const BFS = `(function(sx, sy, lim){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[sx, sy]]; seen[sy * W + sx] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
    if (lim && (nx < lim[0] || ny < lim[1] || nx > lim[2] || ny > lim[3])) continue;
    if (!$gamePlayer.canPass(x, y, d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  return seen; })`;
kit.test({ port: +(process.env.CDP_PORT || 9656), overlay: OVERLAY, bootCheck: "gra", errorCheck: "bez błędów w konsoli" }, async t => {
    // ------------------------------------------------ Map003
    await t.newGame({ map: 3, x: 31, y: 5, hour: 12, quiet: true, minimap: false });
    const r3 = await t.json(`(function(){
        const bfs = ${BFS}; const W = $gameMap.width(), H = $gameMap.height(); const seen = bfs(31, 5);
        let n = 0, outside = 0, cells = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Farming.fieldAllows(x, y)) { n++; if (x < 42 || x > 77 || y < 34 || y > 59) outside++; }
        const reach = (x, y) => !!seen[y * W + x];
        const gates = { top: [[68, 69, 70, 71], 34], bottom: [[48, 49, 50, 51], 59] };
        const res = { fieldCells: n, fieldOutside: outside };
        res.top = [68, 69, 70, 71].map(x => reach(x, 33) && reach(x, 35)); res.topBlockers = [68, 69, 70, 71].map(x => [33, 35].map(y => $gameMap.eventsXy(x, y).map(e => e.event().name).join()));
        res.bottom = [48, 49, 50, 51].map(x => reach(x, 60) && reach(x, 58));
        res.left = [46, 47, 48].map(y => reach(41, y) && reach(43, y));
        res.right = [43, 44, 45, 46].map(y => reach(78, y) && reach(76, y));
        res.inside = reach(60, 50) && reach(50, 45) && reach(72, 40);
        // every gate in turn: the BFS limited to the cells of the plot and one cell outside of this gate only
        const only = (lim) => { const s = bfs(lim.sx, lim.sy, lim.box); return s; };
        res.gateOnly = {};
        const box = { top: [41, 33, 78, 59], bottom: [41, 34, 78, 60], left: [41, 34, 78, 59], right: [42, 34, 78, 59] };
        for (const [g, sx, sy, tx, ty] of [["top", 70, 33, 60, 50], ["bottom", 50, 60, 60, 50], ["left", 41, 47, 60, 50], ["right", 78, 44, 60, 50]]) {
            const s = bfs(sx, sy, box[g]); res.gateOnly[g] = !!s[ty * W + tx];
        }
        // a walk across the old frames: x38-39 on row 20, y60 from x60
        res.cross38bad = []; res.cross38rows = [];
        for (const y of [3, 4, 5, 6, 8, 10, 11, 16, 17, 20, 25, 28, 29]) { const bad = [36, 37, 38, 39, 40].filter(x => !$gamePlayer.canPass(x, y, 6)); const ev = bad.map(x => [x, $gameMap.eventsXy(x, y).map(e => e.event().name).join()]); res.cross38rows.push(bad.length === 0); if (bad.length) res.cross38bad.push([y, ev]); }
        res.cross38 = [10, 20, 26].every(y => !!bfs(37, y, [37, y - 2, 41, y + 2])[y * W + 41]); res.cross38from = [37, 38, 39].map(x => $gamePlayer.canPass(x, 20, 6));
        res.row60 = [];
        for (let x = 51; x <= 77; x++) res.row60.push($gameMap.isPassable(x, 60, 2) || $gameMap.isPassable(x, 60, 4) ? 1 : 0);
        res.row60blocked = res.row60.filter(v => !v).length;
        res.stillBlocked = []; for (let y = 3; y <= 29; y++) for (let x = 36; x <= 41; x++) if (!$gameMap.isPassable(x, y, 2) && !$gameMap.isPassable(x, y, 4) && !$gameMap.isPassable(x, y, 6) && !$gameMap.isPassable(x, y, 8) && $gameMap.eventsXy(x, y).length === 0) res.stillBlocked.push([x, y, $gameMap.regionId(x, y), $gameMap.allTiles(x, y).join('/')]);
        res.reg2 = (function(){ let c = 0; for (let y = 3; y <= 29; y++) for (const x of [38, 39]) if ($gameMap.regionId(x, y) === 2) c++; return c; })();
        return res; })()`);
    console.log(JSON.stringify(r3));
    t.check("Map003: building ground only inside the plot (> 400 cells, none outside x42-77 y34-59)", r3.fieldCells > 400 && r3.fieldOutside === 0, r3);
    t.check("Map003: all four gates open from the town stairs (31,4)", [r3.top, r3.bottom, r3.left, r3.right].every(g => g.filter(Boolean).length >= 2) && r3.inside, r3);
    t.check("Map003: each gate alone leads into the plot", Object.values(r3.gateOnly).every(Boolean), r3.gateOnly);
    t.check("Map003: walks across x38-39 and the y60 row", r3.cross38 && r3.cross38from.every(Boolean) && r3.row60blocked === 0 && r3.reg2 === 0, r3);
    // ------------------------------------------------ Map020
    await t.go(20, 46, 47, 2);
    const r20 = await t.json(`(function(){
        const bfs = ${BFS}; const W = $gameMap.width(), H = $gameMap.height(); const seen = bfs(46, 47);
        const door = $gameMap.events().find(e => /Drzwi chaty/.test(e.event().name));
        const reach = (x, y) => !!seen[y * W + x];
        let edge = 0; for (let x = 0; x < W; x++) { if (seen[x]) edge++; if (seen[(H - 1) * W + x]) edge++; } for (let y = 0; y < H; y++) { if (seen[y * W]) edge++; if (seen[y * W + W - 1]) edge++; }
        let n = 0; for (let i = 0; i < W * H; i++) n += seen[i];
        return { door: door ? [door.x, door.y] : null, doorFront: reach(door.x, door.y + 1), road: reach(46, 56), road2: reach(30, 57), far: reach(90, 60), edgeCells: edge, reachable: n,
          gatePassable: [45, 46, 47].map(x => $gamePlayer.canPass(x, 52, 2) && $gamePlayer.canPass(x, 53, 2)) }; })()`);
    console.log(JSON.stringify(r20));
    t.check("Map020: the cottage door is reachable from the road and the map edges", r20.door && r20.doorFront && r20.road && r20.road2 && r20.far && r20.edgeCells > 5 && r20.gatePassable.every(Boolean), r20);
    // ------------------------------------------------ Map024
    await t.go(24, 96, 70, 6);
    const r24 = await t.json(`(function(){ const rows = [60, 62, 65, 70, 73, 80, 85, 89];
        return { x97to98: rows.map(y => $gamePlayer.canPass(99, y, 6)), reg2cells: (function(){ let c = 0; for (let y = 55; y < 95; y++) for (const x of [98, 99]) if ($gameMap.regionId(x, y) === 2) c++; return c; })() }; })()`);
    console.log(JSON.stringify(r24));
    t.check("Map024: x99 (was invisible-wall grass) can be walked into", r24.x97to98.filter(Boolean).length >= 6, r24);
});
