// Check of tools/poprawki_krok2/staging (overlay): the 9 board maps load without console errors; BFS-reachable cells and reachable edge cells
// (seams / gates) from a fixed open cell. Run twice and compare:  MODE=before (no overlay)  /  MODE=after (overlay)
//   MODE=after CDP_PORT=9661 node tools/poprawki_krok2/sprawdz_test.js        (static server on 8765 already running)
const path = require("path"), fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const MODE = process.env.MODE || "after";
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const MAPS = [162, 24, 13, 111, 8, 4, 125, 3, 20];
const BFS = `(function(){ const W = $gameMap.width(), H = $gameMap.height();
  let sx = -1, sy = -1; const cx = W >> 1, cy = H >> 1;
  outer: for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = cx + dx, y = cy + dy;
      if ($gameMap.isPassable(x, y, 2) && $gameMap.isPassable(x, y, 6) && $gameMap.isPassable(x, y, 4) && $gameMap.isPassable(x, y, 8) && $gameMap.eventsXy(x, y).length === 0) { sx = x; sy = y; break outer; } }
  const seen = new Uint8Array(W * H); const q = [[sx, sy]]; seen[sy * W + sx] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  let n = 0, top = 0, bottom = 0, left = 0, right = 0;
  for (let i = 0; i < W * H; i++) n += seen[i];
  for (let x = 0; x < W; x++) { top += seen[x]; bottom += seen[(H - 1) * W + x]; } for (let y = 0; y < H; y++) { left += seen[y * W]; right += seen[y * W + W - 1]; }
  return { start: [sx, sy], reach: n, top, bottom, left, right }; })()`;
kit.test({ port: +(process.env.CDP_PORT || 9661), overlay: OVERLAY, bootCheck: "gra", errorCheck: "bez błędów w konsoli" }, async t => {
    const res = {};
    await t.newGame({ map: 3, x: 31, y: 5, hour: 12, quiet: true, minimap: false });
    for (const id of MAPS) {
        await t.go(id, 60, 60, 2);
        res[id] = await t.json(BFS);
        console.log(MODE, id, JSON.stringify(res[id]));
    }
    fs.writeFileSync(path.join(__dirname, "wynik_" + MODE + ".json"), JSON.stringify(res));
    t.check("all 9 maps loaded and walked (" + MODE + ")", MAPS.every(id => res[id] && res[id].reach > 500), res);
});
