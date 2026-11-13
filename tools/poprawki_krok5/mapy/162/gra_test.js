// Krok 5 (Map162 Garnizon): test w grze - mapa laduje sie bez bledow w konsoli; BFS pieszo (isPassable obu kratek, jak gracz) od (58,64):
// liczba osiagalnych kratek, krawedzie, miejsca (strzelnica, patrol, drewno z brzegu, droga, wybieg, polana), kieszenie; zapis siatki osiagalnosci.
//   MODE=before|after  CDP_PORT=9703  node tools/poprawki_krok5/mapy/162/gra_test.js      (after = nakladka staging)
const kit = require("../../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SPOTS = { strzelnica_stoisko: [96, 77], strzelnica_stojak: [95, 74], zolnierz_1: [97, 74], zolnierz_2: [97, 78], tarcza_1: [101, 75], tarcza_2: [103, 77], tarcza_3: [104, 75],
    patrol_1: [82, 69], patrol_2: [113, 69], patrol_3: [117, 89], patrol_4: [87, 94], drewno_1: [24, 71], drewno_2: [24, 74], drewno_3: [24, 86],
    droga_pd_gora: [107, 99], droga_pd_dol: [107, 116], brama_pn_sciezka: [58, 62], wybieg_brama: [101, 92], wybieg_wnetrze: [101, 87], wybieg_stog: [108, 88],
    polana_zachod: [22, 80], klepisko: [91, 102], wschod_x118_y70: [118, 70], wschod_x118_y90: [118, 90], pd_y118_x20: [20, 118], pd_y118_x110: [110, 118],
    prog_kamien: [58, 66], pomost_1: [36, 50], pomost_2: [34, 51], pomost_3: [36, 51], brzeg_miejsce: [39, 46], ladowanie: [27, 51], pn_droga_zach: [38, 36], ne_droga: [115, 40], ne_polana: [100, 44], kepa_pd: [66, 107], kepa_pd2: [100, 108], zach_x16_y90: [16, 90] };
const BFS = (sx, sy) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  let n = 0, E = 0, S = 0; for (let i = 0; i < W * H; i++) n += seen[i];
  for (let x = 0; x < W; x++) S += seen[(H - 1) * W + x]; for (let y = 0; y < H; y++) E += seen[y * W + W - 1];
  const sp = ${JSON.stringify(SPOTS)}, o = {}; for (const k in sp) o[k] = !!seen[sp[k][1] * W + sp[k][0]];
  const free = c => $gameMap.isPassable(c[0], c[1], 2) || $gameMap.isPassable(c[0], c[1], 4) || $gameMap.isPassable(c[0], c[1], 6) || $gameMap.isPassable(c[0], c[1], 8);
  const lost = []; const mark = new Uint8Array(W * H);
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { if (seen[y * W + x] || mark[y * W + x] || !free([x, y])) continue;
      const st = [[x, y]]; mark[y * W + x] = 1; let cnt = 0; while (st.length) { const [a, b] = st.pop(); cnt++; for (const [d, dx, dy] of dirs) { const nx = a + dx, ny = b + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || mark[ny * W + nx]) continue;
          if (!$gameMap.isPassable(a, b, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; mark[ny * W + nx] = 1; st.push([nx, ny]); } }
      if (cnt >= 4) lost.push([x, y, cnt]); }
  let grid = []; for (let y = 0; y < H; y++) { let r = ""; for (let x = 0; x < W; x++) r += seen[y * W + x] ? "1" : "0"; grid.push(r); }
  return { total: n, E, S, spots: o, pockets: lost.length, pocketCells: lost.reduce((s, c) => s + c[2], 0), events: $dataMap.events.filter(Boolean).length, pocketList: lost.slice(0, 20), grid }; })()`;
kit.test({ port: +(process.env.CDP_PORT || 9703), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 162, x: 58, y: 64, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(BFS(58, 64));
    const g = r.grid; delete r.grid;
    console.log(MODE, JSON.stringify(r));
    fs.mkdirSync(path.join(__dirname, "tmp"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, "tmp", "gra_" + MODE + ".json"), JSON.stringify(Object.assign({}, r, { grid: g })));
    t.check("Map162 laduje sie, BFS (" + MODE + ")", r.total > 8000, r.total);
});
