// Krok 5 (Lapka pod Gawra): test w grze - Map004 laduje sie bez bledow w konsoli; BFS pieszo (isPassable obu kratek, jak gracz) od kratki (5,48):
// liczba osiagalnych kratek, osiagalne kratki krawedzi (pasma N/S/W) i miejsca (lizawka, zasiadka, zrzut poroza, szlaki, brama zagrody...).
//   MODE=before|after  CDP_PORT=9691  node tools/poprawki_krok5/gra_test.js      (after = nakladka tools/poprawki_krok5/staging)
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SPOTS = { lizawka: [73, 51], zasiadka: [70, 53], poroze: [74, 52], zachod_brama_1: [1, 16], zachod_brama_2: [1, 17], zachod_brama_3: [1, 48], zachod_brama_4: [1, 49], droga_poludnie: [12, 118],
    kapliczka: [66, 7], postoj: [60, 10], koszar: [52, 44], pastwisko: [46, 47], brama_zagrody: [34, 69], w_zagrodzie: [40, 68], polanka: [50, 98], glazy: [58, 85], gaj_polana: [80, 72], pole_kamieni: [25, 86], kepa2: [71, 105] };
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
  return { total: n, N, S, W: Wd, E, spots: o, pockets: lost.length, pocketCells: lost.reduce((s, c) => s + c[2], 0), events: $dataMap.events.filter(Boolean).length, pocketList: lost.slice(0, 12) }; })()`;
kit.test({ port: +(process.env.CDP_PORT || 9691), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 4, x: 5, y: 48, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(BFS(5, 48));
    console.log(MODE, JSON.stringify(r));
    fs.writeFileSync(path.join(__dirname, "tmp", "gra_" + MODE + ".json"), JSON.stringify(r, null, 1));
    t.check("Map004 laduje sie, BFS (" + MODE + ")", r.total > 8000, r);
});
