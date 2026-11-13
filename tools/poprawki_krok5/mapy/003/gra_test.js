// Map003 (Kruczy Jar): BFS pieszo (isPassable obu kratek) od (62,45); zapis osiagalnych kratek i miejsc.  MODE=before|after CDP_PORT=9705
const kit = require("../../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SPOTS = { dzialka: [62, 45], brama_dr: [49, 62], droga_zach: [9, 63], polana: [33, 77], martwe_drzewo: [59, 77], kepa_b: [75, 81], gaj_polana: [100, 79], skaly_zach: [14, 81], pd_laka: [60, 84],
    ul_1: [66, 38], zach_szew: [1, 20], zach_szew2: [1, 60], zach_szew3: [1, 90], wsch_szew: [118, 30], wsch_szew2: [118, 70], pn_szew: [60, 1], dalekie_ne: [112, 66], dalekie_se: [112, 86], dalekie_sw: [6, 86] };
const BFS = (sx, sy) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  let n = 0, N = 0, S = 0, Wd = 0, E = 0; for (let i = 0; i < W * H; i++) n += seen[i];
  for (let x = 0; x < W; x++) { N += seen[x]; S += seen[(H - 1) * W + x]; } for (let y = 0; y < H; y++) { Wd += seen[y * W]; E += seen[y * W + W - 1]; }
  const sp = ${JSON.stringify(SPOTS)}, o = {}; for (const k in sp) o[k] = !!seen[sp[k][1] * W + sp[k][0]];
  const free = c => $gameMap.isPassable(c[0], c[1], 2) || $gameMap.isPassable(c[0], c[1], 4) || $gameMap.isPassable(c[0], c[1], 6) || $gameMap.isPassable(c[0], c[1], 8);
  const lost = []; const mark = new Uint8Array(W * H);
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { if (seen[y * W + x] || mark[y * W + x] || !free([x, y])) continue;
      const st = [[x, y]]; mark[y * W + x] = 1; let cnt = 0; while (st.length) { const [a, b] = st.pop(); cnt++; for (const [d, dx, dy] of dirs) { const nx = a + dx, ny = b + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || mark[ny * W + nx]) continue;
          if (!$gameMap.isPassable(a, b, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; mark[ny * W + nx] = 1; st.push([nx, ny]); } }
      if (cnt >= 4) lost.push([x, y, cnt]); }
  const cells = []; for (let i = 0; i < W * H; i++) if (seen[i]) cells.push(i);
  return { total: n, N, S, W: Wd, E, spots: o, pockets: lost.length, pocketCells: lost.reduce((s, c) => s + c[2], 0), events: $dataMap.events.filter(Boolean).length, pocketList: lost.slice(0, 12), cells }; })()`;
kit.test({ port: +(process.env.CDP_PORT || 9705), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 3, x: 62, y: 45, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(BFS(62, 45));
    const c = r.cells; delete r.cells;
    console.log(MODE, JSON.stringify(r));
    fs.mkdirSync(path.join(__dirname, "tmp"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, "tmp", "gra_" + MODE + ".json"), JSON.stringify(Object.assign({ cells: c }, r)));
    t.check("Map003 laduje sie, BFS (" + MODE + ")", r.total > 8000, r);
});
