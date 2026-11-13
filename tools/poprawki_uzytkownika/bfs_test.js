// In-game BFS of the touched maps (hero's canPass over the whole map): reachable cells, reachable cells of the four edges (the seams), the named spots.
//   MODE=before|after CDP_PORT=977x node tools/poprawki_uzytkownika/bfs_test.js  -> tmp/bfs_<mode>.json
const kit = require("../../tests/lib/kit.js"); const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OV = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const START = { 3: [31, 5], 4: [42, 40], 20: [46, 47], 125: [60, 40] };
const SPOTS = { 3: { westGate: [[41, 47], [43, 47]], eastGate: [[78, 45], [76, 45]], topGate: [[70, 33], [70, 35]], bottomGate: [[50, 60], [50, 58]], springFront: [[40, 80]], inside: [[60, 50]] },
    4: { springFront: [[42, 29]], fenceYard: [[60, 70]] }, 20: { doorFront: [[46, 47]], gateBottom: [[46, 53]], field: [[51, 50]], leftYardGate: [[40, 47]], rightYardGate: [[52, 47]], leftYardInside: [[40, 45]], rightYardInside: [[52, 45]] },
    125: { szlaban: [[38, 18]], guardFront: [[33, 18]], sacks: [[27, 16]], cartSide: [[26, 22]], klifGate: [[101, 96]], lighthouse: [[92, 104]] } };
const out = {};
kit.test({ port: +(process.env.CDP_PORT || 9770), overlay: OV, overlayJs: !!OV, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    for (const mid of [3, 4, 20, 125]) {
        await t.newGame({ map: mid, x: START[mid][0], y: START[mid][1], day: 40, hour: 11, quiet: true, minimap: false });
        await t.frames(60);
        const r = await t.json(`(function(){ const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H); const sx = ${START[mid][0]}, sy = ${START[mid][1]};
            const q = [[sx, sy]]; seen[sy * W + sx] = 1; const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
            while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue; if (!$gamePlayer.canPass(x, y, d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
            let n = 0; const edge = { N: 0, S: 0, W: 0, E: 0 }; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (seen[y * W + x]) { n++; if (y === 0) edge.N++; if (y === H - 1) edge.S++; if (x === 0) edge.W++; if (x === W - 1) edge.E++; }
            const spots = ${JSON.stringify(SPOTS[mid])}, sp = {}; for (const k in spots) sp[k] = spots[k].every(([x, y]) => !!seen[y * W + x]);
            return { reachable: n, edge, spots: sp }; })()`);
        out[mid] = r; console.log(mid, JSON.stringify(r));
    }
    fs.writeFileSync(path.join(__dirname, "tmp", "bfs_" + MODE + ".json"), JSON.stringify(out, null, 1));
    t.check("bfs", true);
});
