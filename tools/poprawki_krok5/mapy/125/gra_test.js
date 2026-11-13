// Krok 5 (Map125 Przystan): test w grze - Map004 laduje sie bez bledow w konsoli; BFS pieszo (isPassable obu kratek, jak gracz) od kratki (5,48):
// liczba osiagalnych kratek, osiagalne kratki krawedzi (pasma N/S/W) i miejsca (lizawka, zasiadka, zrzut poroza, szlaki, brama zagrody...).
//   MODE=before|after  CDP_PORT=9691  node tools/poprawki_krok5/gra_test.js      (after = nakladka tools/poprawki_krok5/staging)
const kit = require("../../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SPOTS = { patrol_60_70: [60, 70], patrol_55_84: [55, 84], patrol_75_62: [75, 62], patrol_88_80: [88, 80], patrol_70_88: [70, 88], zatoczka: [17, 66], zatoczka2: [18, 65],
    brama_zagrody: [41, 58], w_zagrodzie: [43, 66], polana_kepy: [36, 72], glazy: [32, 50], poletka: [57, 41], siano_1: [51, 58], siano_2: [57, 62], ulica: [50, 31],
    kepa_ze: [29, 65], latarnia: [79, 101], wrak: [18, 36], tawerna_53_19: [53, 19], wejscie_27_20: [27, 20], orzel_a_dol: [81, 68], pustka_30_50: [30, 50], pustka_55_70: [56, 72] };
const BFS = (sx, sy) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  let n = 0, N = 0, S = 0, Wd = 0, E = 0; for (let i = 0; i < W * H; i++) n += seen[i];
  for (let x = 0; x < W; x++) { N += seen[x]; S += seen[(H - 1) * W + x]; } for (let y = 0; y < H; y++) { Wd += seen[y * W]; E += seen[y * W + W - 1]; }
  const sp = ${JSON.stringify(SPOTS)}, o = {}; for (const k in sp) o[k] = !!seen[sp[k][1] * W + sp[k][0]];
  // zamkniete kieszenie: kratki przechodnie (stoi) nieosiagalne, w skladowych >= 4
  const free = c => $gameMap.isPassable(c[0], c[1], 2) || $gameMap.isPassable(c[0], c[1], 4) || $gameMap.isPassable(c[0], c[1], 6) || $gameMap.isPassable(c[0], c[1], 8);
  const lost = []; const mark = new Uint8Array(W * H);
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { if (seen[y * W + x] || mark[y * W + x] || !free([x, y]) || $gameMap.eventsXy(x, y).length && false) continue;
      const st = [[x, y]]; mark[y * W + x] = 1; let cnt = 0; while (st.length) { const [a, b] = st.pop(); cnt++; for (const [d, dx, dy] of dirs) { const nx = a + dx, ny = b + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || mark[ny * W + nx]) continue;
          if (!$gameMap.isPassable(a, b, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; mark[ny * W + nx] = 1; st.push([nx, ny]); } }
      if (cnt >= 4) lost.push([x, y, cnt]); }
  let zone = 0, zoneFree = 0; for (let y = 38; y <= 76; y++) for (let x = 26; x <= 62; x++) { zone += seen[y * W + x]; if (free([x, y])) zoneFree++; }
  return { zone, zoneFree, total: n, N, S, W: Wd, E, spots: o, pockets: lost.length, pocketCells: lost.reduce((s, c) => s + c[2], 0), events: $dataMap.events.filter(Boolean).length, pocketList: lost.slice(0, 12) }; })()`;
kit.test({ port: +(process.env.CDP_PORT || 9704), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 125, x: 27, y: 20, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(BFS(27, 20));
    console.log(MODE, JSON.stringify(r));
    fs.writeFileSync(path.join(__dirname, "tmp", "gra_" + MODE + ".json"), JSON.stringify(r, null, 1));
    t.check("Map125 laduje sie, BFS (" + MODE + ")", r.total > 5000, r);
});
