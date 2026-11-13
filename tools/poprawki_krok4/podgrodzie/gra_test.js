// Krok 4, Map111 Podgrodzie: test w grze + zdjecia z gry przed / po.
//   MODE=before|after  CDP_PORT=9683  node tools/poprawki_krok4/podgrodzie/gra_test.js     (after = nakladka staging, before = bez)
const kit = require("../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, "tmp", "zdjecia"), MODE);
fs.mkdirSync(OUT, { recursive: true });
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SW = 1280 / 48, SH = 720 / 48, P = 32;
const PLACES = [
    { id: "03_wybieg_poludnie", map: 111, box: [28, 106, 60, 119] },
    { id: "04_fosa_poczatek", map: 111, box: [98, 28, 119, 56] },
    { id: "05_fosa_koniec", map: 111, box: [98, 94, 119, 112] },
    { id: "06_fosa_blota_trzciny_kamienie", map: 111, box: [104, 70, 119, 94] },
    { id: "07_fosa_pobocza", map: 111, box: [104, 54, 119, 72] },
    { id: "08a_szpaler_polnoc", map: 111, box: [10, 32, 30, 66] },
    { id: "08b_szpaler_poludnie", map: 111, box: [10, 66, 30, 100] },
    { id: "09_brzeg_morza", map: 111, box: [4, 28, 28, 70] },
    { id: "10_droga_polnoc", map: 111, box: [96, 0, 119, 40] },
    { id: "11_luzne_kawalki_plotu", map: 111, box: [28, 15, 52, 32] },
    { id: "12a_cienie_domow", map: 111, box: [24, 56, 56, 92] },
    { id: "12b_cienie_plotow", map: 111, box: [24, 38, 80, 50] },
];
const START = [105, 51];
const CHANGED = [[28, 106, 58, 119], [101, 0, 119, 108], [17, 33, 22, 100], [28, 14, 52, 32], [19, 33, 21, 100]];
const BFS = (sx, sy, boxes) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(); const seen = new Uint8Array(W * H); const q = [[${sx}, ${sy}]]; seen[${sy} * W + ${sx}] = 1;
  const dirs = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
  while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
      if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
  const B = ${JSON.stringify(boxes)}; let n = 0, out = 0; const inb = (x, y) => B.some(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (seen[y * W + x]) { n++; if (!inb(x, y)) out++; }
  window.__seen = seen; return { total: n, outside: out }; })()`;

kit.test({ port: +(process.env.CDP_PORT || 9671), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    const res = { mode: MODE };
    await t.newGame({ map: 111, x: START[0], y: START[1], day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(BFS(START[0], START[1], CHANGED));
    r.edges = await t.json(`(function(){ const S = window.__seen, W = $gameMap.width(), H = $gameMap.height(); let top = 0, bottom = 0, left = 0, right = 0;
        for (let x = 0; x < W; x++) { top += S[x]; bottom += S[(H - 1) * W + x]; } for (let y = 0; y < H; y++) { left += S[y * W]; right += S[y * W + W - 1]; }
        const c = {}; for (const [k, x, y] of [["N106", 106, 0], ["N107", 107, 0], ["N108", 108, 0], ["E50", 119, 50], ["E51", 119, 51], ["E106", 119, 106], ["E107", 119, 107], ["S35", 35, 119], ["S44", 44, 119], ["S54", 54, 119]]) c[k] = !!S[y * W + x];
        return { top, bottom, left, right, c }; })()`);
    r.spots = await t.json(`(function(){ const S = window.__seen, W = $gameMap.width(), o = {}, bad = [];
        for (const e of $dataMap.events) { if (!e) continue; const nm = e.name || ""; let cells = [];
            if (nm.indexOf("Miejsce:") === 0) cells = [[e.x, e.y]]; else if (nm.indexOf("Drzwi:") === 0) cells = [[e.x, e.y + 1]];
            for (const [x, y] of cells) { o[e.id + ":" + nm] = !!S[y * W + x]; if (!S[y * W + x]) bad.push(e.id + ":" + nm + "@" + x + "," + y); } }
        return { n: Object.keys(o).length, bad }; })()`);
    res.r = r; console.log(MODE, JSON.stringify(r));
    fs.writeFileSync(path.join(OUT, "..", "wynik_" + MODE + ".json"), JSON.stringify(res, null, 1));
    // pictures
    const cur = { id: 0 };
    for (const pl of PLACES) {
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
    t.check("Map111 przeszla (" + MODE + "): osiagalne > 5000, miejsca zadan osiagalne, szwy", res.r.total > 5000 && res.r.spots.bad.length === 0, res.r.spots.bad);
});
