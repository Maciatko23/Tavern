// Krok 4 (Map125 Przystan), test w grze + zdjecia z gry przed / po.
//   MODE=before|after  OUT_DIR=<folder zdjec>  CDP_PORT=9682  node tools/poprawki_krok3/gra_test.js
// after = nakladka tools/poprawki_krok4/przystan/staging (GAME_OVERLAY), before = bez nakladki. Statyczny serwer na 8765 juz dziala.
// 1) mapy 13 i 125 laduja sie bez bledow w konsoli; BFS pieszo (kafle) z kratki startowej: liczby, kratki wazne (miejsca zadan, polki orla)
// 2) zdjecia z gry: dla kazdego miejsca ten sam kadr (kamera, bohater niewidzialny, pogoda brak, dzien 40, godzina 11), zszyte ekran po ekranie
const kit = require("../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, "tmp", "zdjecia"), MODE);
fs.mkdirSync(OUT, { recursive: true });
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SW = 1280 / 48, SH = 720 / 48, P = 32;
const PLACES = [
    { id: "01_wedzarnia_skala_kwiaty", map: 125, box: [24, 0, 40, 8] },
    { id: "03_kwiaty_wschod_i_skala", map: 125, box: [42, 0, 48, 5] },
    { id: "03b_kwiaty_95_100", map: 125, box: [90, 0, 102, 5] },
    { id: "05_deski_drewutnia_bez_zmian", map: 125, box: [82, 93, 92, 102] },
    { id: "06_polka_orla_a", map: 125, box: [91, 41, 104, 54] },
    { id: "07_polka_orla_b", map: 125, box: [100, 26, 112, 38] },
    { id: "08_nabrzeze_luki", map: 125, box: [15, 7, 24, 28] },
    { id: "09_plotki_dzialek", map: 125, box: [45, 18, 80, 31] },
    { id: "10_wozki_lampa_stos", map: 125, box: [70, 19, 80, 30] },
    { id: "13_naroznik_bruk", map: 125, box: [0, 0, 14, 8] },
    { id: "14_lodzie_z_gory", map: 125, box: [5, 2, 20, 28] },
    { id: "15_skrzynka_20_4", map: 125, box: [17, 1, 24, 8] },
    { id: "16_komora_celna", map: 125, box: [27, 11, 40, 20] },
];
const SPOTS = {
    125: { start: [30, 78], cells: {"janek_drzwi": [24, 6], "lodz": [9, 6], "na_morze": [7, 7], "pomost": [11, 7], "wedzarnia": [31, 6], "lawka": [18, 8], "sieci": [18, 5], "stol_ryb": [16, 4], "nabrzeze": [20, 16], "tawerna": [53, 19], "szopa_drzwi": [23, 25], "wrak": [18, 34], "pochylnia": [21, 27], "nabrzeze_rog": [20, 10], "beczka_ogien": [25, 26], "plaza": [21, 33], "molo": [13, 17], "molo_kontrola": [18, 16], "komora_drzwi": [32, 18], "komora_przed": [34, 19], "szlaban": [38, 17], "molo_wejscie": [21, 17], "d20_wrak": [18, 35], "izba": [79, 99], "izba_sen": [79, 99], "drewutnia": [83, 96], "laterna": [92, 103], "lat_oboz": [80, 108], "lat_napad": [81, 110], "lat_dzwon": [94, 103], "door2": [24, 6], "door4": [31, 6], "door5": [26, 14], "door7": [32, 18], "door8": [23, 25], "door54": [51, 26], "door55": [61, 26], "door56": [70, 26], "door120": [79, 99], "smokehouse_door": [31, 6], "quay_top": [20, 10], "quay_bottom": [20, 23], "pocket": [75, 23], "cartyard": [75, 26], "plot3_gate": [70, 30], "gate1": [51, 30], "gate2": [61, 30], "woodshed": [83, 96], "tower": [92, 103], "nw_grass": [6, 2], "lamp_cust": [31, 18]}, boxes: [[28, 0, 36, 7], [29, 0, 37, 5], [45, 19, 79, 30], [90, 40, 104, 53], [100, 27, 111, 37], [17, 8, 22, 25], [3, 0, 12, 4], [18, 3, 22, 5], [29, 15, 37, 18], [5, 2, 20, 28], [0, 0, 120, 6]] },
};
const BFS = (sx, sy, boxes) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  const B = ${JSON.stringify(boxes)}; let n = 0, out = 0; const inb = (x, y) => B.some(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (seen[y * W + x]) { n++; if (!inb(x, y)) out++; }
  window.__seen = seen; return { total: n, outside: out }; })()`;

kit.test({ port: +(process.env.CDP_PORT || 9682), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    const res = { mode: MODE, maps: {} };
    for (const mid of [125]) {
        await t.newGame({ map: mid, x: SPOTS[mid].start[0], y: SPOTS[mid].start[1], day: 40, hour: 11, quiet: true, minimap: false });
        await t.frames(30);
        const r = await t.json(BFS(SPOTS[mid].start[0], SPOTS[mid].start[1], SPOTS[mid].boxes));
        r.cells = await t.json(`(function(){ const S = window.__seen, W = $gameMap.width(), c = ${JSON.stringify(SPOTS[mid].cells)}, o = {}; for (const k in c) o[k] = !!S[c[k][1] * W + c[k][0]]; return o; })()`);
        res.maps[mid] = r;
        console.log(MODE, mid, JSON.stringify(r));
    }
    fs.writeFileSync(path.join(OUT, "..", "wynik_" + MODE + ".json"), JSON.stringify(res, null, 1));
    // pictures
    const cur = { id: 0 };
    for (const pl of PLACES) {
        const [bx0, by0, bx1, by1] = pl.box;
        await t.newGame({ map: pl.map, x: bx0, y: by0, day: 40, hour: 11, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); ConfigManager.moodVignette = false; 0");
        await t.eval("window.Przystan && Przystan.flags && (Przystan.flags().d20Gotowy = true); 0");
        await t.frames(90);
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
    t.check("mapa 125 przeszla (" + MODE + ")", res.maps[125].total > 5000, res);
});
