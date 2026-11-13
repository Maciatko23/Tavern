// Krok 4 (Map024 Posiadlosc Lorda), test w grze + zdjecia z gry przed / po.
//   MODE=before|after  OUT_DIR=<folder zdjec>  CDP_PORT=9684  node tools/poprawki_krok4/dwor/gra_test.js
// after = nakladka tools/poprawki_krok3/staging (GAME_OVERLAY), before = bez nakladki. Statyczny serwer na 8765 juz dziala.
// 1) mapy 13 i 125 laduja sie bez bledow w konsoli; BFS pieszo (kafle) z kratki startowej: liczby, kratki wazne (miejsca zadan, polki orla)
// 2) zdjecia z gry: dla kazdego miejsca ten sam kadr (kamera, bohater niewidzialny, pogoda brak, dzien 40, godzina 11), zszyte ekran po ekranie
const kit = require("../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, "tmp", "zdjecia"), MODE);
fs.mkdirSync(OUT, { recursive: true });
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SW = 1280 / 48, SH = 720 / 48, P = 32;
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const PLACES = [
    { id: "02a_morze_polnoc_zachod", map: 24, box: [0, 9, 40, 25] },
    { id: "02b_morze_polnoc_srodek", map: 24, box: [40, 9, 80, 25] },
    { id: "02c_morze_polnoc_wschod", map: 24, box: [80, 9, 119, 25] },
    { id: "04_05_bruk_i_droga", map: 24, box: [14, 86, 34, 116] },
    { id: "06_podworko_ze_studnia", map: 24, box: [44, 72, 64, 96] },
    { id: "07_plat_trawy", map: 24, box: [44, 50, 66, 84] },
    { id: "08_ruina", map: 24, box: [14, 54, 34, 72] },
    { id: "09_gaje", map: 24, box: [0, 28, 34, 48] },
    { id: "10_kwiaty", map: 24, box: [60, 56, 98, 88] },
];
const SPOTS = {
    24: { start: [27, 95], cells: { luka_gora: [27, 89], luka_gora2: [28, 89], luka_nad: [27, 88], luka_wew: [27, 91], lesniczowka_dol: [81, 65], pasnik: [79, 83], patrol_1: [33, 100], patrol_2: [50, 110], patrol_3: [73, 105], patrol_4: [91, 80],
        patrol_5: [81, 65], sidlo_1: [40, 106], sidlo_2: [65, 98], sidlo_3: [86, 72], rysiek: [66, 98], drzwi_dworu_przed: [40, 74], straz_1: [30, 79], straz_2: [39, 79], straz_3: [39, 88], pompa: [23, 81], feliks: [22, 80],
        kuba: [23, 79], skrzynia: [28, 85], oranzeria_wejscie: [27, 84], tylna_furtka: [25, 85], latarnia_dwor: [40, 83], dziedziniec_srodek: [40, 78], bruk_wschod: [48, 80], podworko_studnia: [53, 81], podworko_brama_pn: [55, 76],
        brama_poludnie_droga: [25, 112], wlaz_pn: [27, 70] },
        boxes: [[14, 28, 34, 118], [44, 50, 98, 96], [0, 28, 34, 48], [0, 9, 119, 25]] },
};
const BFS = (sx, sy, boxes) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  const B = ${JSON.stringify(boxes)}; let n = 0, out = 0; const inb = (x, y) => B.some(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (seen[y * W + x]) { n++; if (!inb(x, y)) out++; }
  window.__seen = seen; return { total: n, outside: out }; })()`;

kit.test({ port: +(process.env.CDP_PORT || 9684), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    const res = { mode: MODE, maps: {} };
    for (const mid of [24]) {
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
        if (ONLY && !ONLY.includes(pl.id)) continue;
        const [bx0, by0, bx1, by1] = pl.box;
        await t.newGame({ map: pl.map, x: bx0, y: by0, day: 40, hour: 11, quiet: true, minimap: false });
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
    t.check("mapa 24 przeszla (" + MODE + ")", res.maps[24].total > 5000, res);
});
