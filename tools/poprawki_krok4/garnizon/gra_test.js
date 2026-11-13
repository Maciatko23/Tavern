// Krok 4 Garnizon (Map162): test w grze + zdjecia z gry przed / po.
//   MODE=before|after  CDP_PORT=9681  node tools/poprawki_krok4/garnizon/gra_test.js     (statyczny serwer na 8765 juz dziala)
// after = nakladka tools/poprawki_krok4/garnizon/staging (albo GAME_OVERLAY), before = bez nakladki. Zdjecia: tmp/zdjecia/<MODE>/<miejsce>.png (kadr: bohater niewidzialny, pogoda brak, dzien 40, godzina 11)
const kit = require("../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OUT = path.resolve(__dirname, "tmp", "zdjecia", MODE);
fs.mkdirSync(OUT, { recursive: true });
const OVERLAY = MODE === "after" ? (process.env.GAME_OVERLAY || path.join(__dirname, "staging")) : undefined;
const SW = 1280 / 48, SH = 720 / 48, P = 48;
const PLACES = [
    { id: "01_droga_i_brama_poludniowa", box: [52, 47, 64, 62] },
    { id: "02_brama_polnocna", box: [51, 29, 65, 39] },
    { id: "03_kamienny_budynek", box: [57, 33, 70, 44] },
    { id: "04_woz_i_beczki", box: [58, 40, 68, 52] },
    { id: "05_06_dom_z_czerwonym_dachem", box: [60, 43, 75, 57] },
    { id: "07_oboz_namiotowy", box: [44, 46, 59, 59] },
    { id: "08_manekiny_i_tarcze", box: [45, 41, 59, 51] },
    { id: "09_choinka_przy_kamiennym", box: [58, 37, 67, 45] },
    { id: "10_zerdz_w_obozie", box: [48, 48, 59, 56] },
    { id: "11_zatoka", box: [14, 18, 38, 36] },
    { id: "13_place_bruku", box: [98, 40, 118, 60] },
    { id: "16_sciezka_poludniowa", box: [96, 94, 116, 119] },
    { id: "17a_petle_gruntu", box: [76, 64, 104, 80] },
    { id: "17b_petla_gruntu", box: [108, 78, 119, 90] },
];
const CHANGED = [[55, 32, 61, 60], [65, 43, 71, 55], [44, 46, 57, 58], [58, 40, 65, 51], [47, 42, 56, 50], [98, 40, 119, 60], [100, 94, 112, 119], [76, 64, 104, 80], [108, 78, 119, 90], [58, 33, 67, 42]];
const BFS = (sx, sy) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gamePlayer.canPass(x, y, d) || !$gamePlayer.canPass(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  const B = ${JSON.stringify(CHANGED)}; let n = 0, out = 0; const inb = (x, y) => B.some(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (seen[y * W + x]) { n++; if (!inb(x, y)) out++; }
  window.__seen = seen;
  const spots = {}; for (const e of $dataMap.events) if (e && /^Miejsce: /.test(e.name)) spots[e.name.slice(9)] = [e.x, e.y, !!seen[e.y * W + e.x]];
  const cells = {}; for (const [k, x, y] of [["pn_58_34", 58, 34], ["pn_57_34", 57, 34], ["pn_59_34", 59, 34], ["pn_58_33", 58, 33], ["pd_58_57", 58, 57], ["pd_57_57", 57, 57], ["pd_59_57", 59, 57], ["pd_58_59", 58, 59], ["dom_drzwi_przed", 68, 55], ["fire_obok", 51, 52], ["sciezka_106_119", 106, 119], ["sciezka_107_105", 107, 105]]) cells[k] = !!seen[y * W + x];
  return { total: n, outside: out, spots, cells }; })()`;

kit.test({ port: +(process.env.CDP_PORT || 9681), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    await t.newGame({ map: 162, x: 58, y: 36, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(BFS(58, 36));
    console.log(MODE, JSON.stringify({ total: r.total, outside: r.outside, cells: r.cells }));
    fs.writeFileSync(path.join(OUT, "..", "wynik_" + MODE + ".json"), JSON.stringify(r, null, 1));
    const cur = { id: 0 };
    for (const pl of PLACES) {
        const [bx0, by0, bx1, by1] = pl.box;
        await t.newGame({ map: 162, x: bx0, y: by0, day: 40, hour: 11, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); ConfigManager.moodVignette = false; 0");
        await t.frames(40);
        const W = await t.eval("$gameMap.width()"), H = await t.eval("$gameMap.height()");
        const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, MX = 1, MY = 2;
        await t.eval(`window.__sz = document.createElement("canvas"); __sz.width = ${bw * P}; __sz.height = ${bh * P}; 0`);
        const xs = [], ys = [];
        for (let v = bx0 - MX; v < bx1 + 1; v += Math.floor(SW - 2 * MX)) xs.push(Math.max(0, Math.min(v, W - SW)));
        for (let v = by0 - MY; v < by1 + 1; v += Math.floor(SH - 2 * MY)) ys.push(Math.max(0, Math.min(v, H - SH)));
        for (const dy of [...new Set(ys)]) for (const dx of [...new Set(xs)]) {
            await t.eval(`(function(){ $gamePlayer.locate(${dx < W / 2 ? W - 1 : 0}, ${dy < H / 2 ? H - 1 : 0}); $gamePlayer.setOpacity(0); $gameMap.setDisplayPos(${dx}, ${dy});
                const sp = SceneManager._scene, ss = sp._spriteset;
                if (ss._cloudSprites) { for (const c of ss._cloudSprites) if (c.parent) c.parent.removeChild(c); ss._cloudSprites.length = 0; }
                for (const s of ss._characterSprites) { const c = s._character; if (!c || c === $gamePlayer) continue; const n = c.characterName ? c.characterName() : "";
                    if (n && n[0] !== "!") c.setTransparent(true); }
                return 0; })()`);
            await t.frames(24);
            await t.eval(`(function(){ const src = Graphics._canvas || document.querySelector("canvas"), dx = $gameMap.displayX(), dy = $gameMap.displayY();
                const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false;
                for (const c of sc._spriteset.children) if (/^(Sprite_CloudShadow|Weather|Sprite_StormSky|Sprite_StormLeaves|Sprite_SunRays)$/.test(c.constructor.name)) c.visible = false;
                if (Graphics._app && Graphics._app.renderer) Graphics._app.renderer.render(Graphics._app.stage);
                const l = dx <= 0.05 ? 0 : ${MX}, r = dx + ${SW} >= ${W} - 0.05 ? 0 : ${MX}, u = dy <= 0.05 ? 0 : ${MY}, b = dy + ${SH} >= ${H} - 0.05 ? 0 : ${MY};
                const X0 = Math.max(dx + l, ${bx0}), X1 = Math.min(dx + ${SW} - r, ${bx1 + 1}), Y0 = Math.max(dy + u, ${by0}), Y1 = Math.min(dy + ${SH} - b, ${by1 + 1});
                if (X1 <= X0 || Y1 <= Y0) return 0;
                const x0 = Math.floor((X0 - ${bx0}) * ${P}), x1 = Math.ceil((X1 - ${bx0}) * ${P}), y0 = Math.floor((Y0 - ${by0}) * ${P}), y1 = Math.ceil((Y1 - ${by0}) * ${P});
                __sz.getContext("2d").drawImage(src, (x0 / ${P} + ${bx0} - dx) * 48, (y0 / ${P} + ${by0} - dy) * 48, (x1 - x0) / ${P} * 48, (y1 - y0) / ${P} * 48, x0, y0, x1 - x0, y1 - y0);
                for (const c of sc.children) c.visible = true;
                return 0; })()`);
        }
        const url = await t.eval("__sz.toDataURL('image/png')");
        fs.writeFileSync(path.join(OUT, pl.id + ".png"), Buffer.from(url.split(",")[1], "base64"));
        console.log("  zdjecie " + pl.id);
    }
    t.check("Map162 laduje sie, BFS z (58,36) (" + MODE + ")", r.total > 3000, { total: r.total });
});
