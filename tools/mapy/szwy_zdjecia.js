// Zdjęcia łączeń map z gry (gracz 2026-11-07: „przejścia pomiędzy mapami mają być super naturalne i płynne”; do obrazów przed / po
// tools/mapy/szwy_poprawki.py). Każda para to wspólna krawędź dwóch map świata (docs/mapy/swiat_uklad.json): z każdej strony pas
// GLEB kratek przy granicy, zdjęty ekran po ekranie w południe lata bez HUD, chmur, deszczu, winiety i linii wzroku, bez ludzi i
// zwierząt (jak tools/mapy/mapa_prawdziwa_zrzuty.js, ale tylko ekrany przy granicy), sklejony kratka w kratkę, P px na kratkę:
// <OUT_DIR>/<a>_<b>.png (a nad b albo a z lewej) i <a>_<b>.json (kierunek, długość, gdzie granica w obrazie).
//   PARY=111:917,13:8 OUT_DIR=<folder> [P=16] [GLEB=8] node tools/mapy/szwy_zdjecia.js
//   (GAME_OVERLAY=<folder z data/> - mapy z próby, np. tools/mapy/staging_szwy; GAME_OVERLAY_JS=1 i js/ z próby też)
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", "..");
if (!process.env.OUT_DIR || !process.env.PARY) { console.log("PARY=a:b,... OUT_DIR=<folder> [P=16] [GLEB=8] node tools/mapy/szwy_zdjecia.js"); process.exit(1); }
const OUT = path.resolve(process.env.OUT_DIR);
fs.mkdirSync(OUT, { recursive: true });
const uk = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), "utf8")).mapy;
const P = Number(process.env.P) || 16, D = Number(process.env.GLEB) || 8;
const SW = 1280 / 48, SH = 720 / 48;

// a pair's border: A on the top / the left, B below / on the right; the shared part in world tiles
function border(a, b) {
    for (const [A, B] of [[a, b], [b, a]]) {
        const ra = uk[A], rb = uk[B];
        if (ra.y0 + ra.wys === rb.y0) {
            const x0 = Math.max(ra.x0, rb.x0), x1 = Math.min(ra.x0 + ra.szer, rb.x0 + rb.szer);
            if (x1 - x0 >= 2) return { A: +A, B: +B, dir: "poziom", x0, x1, L: x1 - x0 };
        }
        if (ra.x0 + ra.szer === rb.x0) {
            const y0 = Math.max(ra.y0, rb.y0), y1 = Math.min(ra.y0 + ra.wys, rb.y0 + rb.wys);
            if (y1 - y0 >= 2) return { A: +A, B: +B, dir: "pion", y0, y1, L: y1 - y0 };
        }
    }
    throw new Error("mapy " + a + " i " + b + " się nie stykają");
}

kit.test({ port: Number(process.env.CDP_PORT) || 9510, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    beforeLoad: "window.WIDOK = false;" }, async t => {
    const pairs = process.env.PARY.split(",").map(s => s.split(":").map(Number));
    for (const [a, b] of pairs) {
        const s = border(a, b), t0 = Date.now();
        const horiz = s.dir === "poziom";
        const iw = horiz ? s.L * P : 2 * D * P, ih = horiz ? 2 * D * P : s.L * P;
        await t.eval(`window.__sz = document.createElement("canvas"); __sz.width = ${iw}; __sz.height = ${ih}; 0`);
        for (const [side, id] of [[0, s.A], [1, s.B]]) {
            const r = uk[id], W = r.szer, H = r.wys;
            await t.newGame({ map: id, x: 0, y: 0, day: 40, hour: 12, quiet: true, minimap: false });
            await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); ConfigManager.moodVignette = false; 0");
            await t.frames(60);
            // the strip on this map (local tiles) and where it goes in the picture
            let lx0, ly0, lw, lh, ox, oy;
            if (horiz) { lx0 = s.x0 - r.x0; lw = s.L; lh = D; ly0 = side === 0 ? H - D : 0; ox = 0; oy = side === 0 ? 0 : D; }
            else { ly0 = s.y0 - r.y0; lh = s.L; lw = D; lx0 = side === 0 ? W - D : 0; ox = side === 0 ? 0 : D; oy = 0; }
            // the screens: one row (or column) along the border, the strip's every tile from a screen's middle part (MX tiles off its sides
            // when the screen is not at the map's edge there)
            const MX = 1, MY = 1.5;
            const dyFix = horiz ? (side === 0 ? Math.max(0, H - SH) : 0) : null, dxFix = horiz ? null : (side === 0 ? Math.max(0, W - SW) : 0);
            const step = horiz ? Math.floor(SW - 2 * MX) : Math.floor(SH - 2 * MY);
            const along = [], first = horiz ? lx0 : ly0, last = first + s.L, span = horiz ? SW : SH, mapLen = horiz ? W : H;
            for (let v = first - (horiz ? MX : MY); v < last; v += step) along.push(Math.max(0, Math.min(v, mapLen - span)));
            for (const v of [...new Set(along)]) {
                const dx = horiz ? v : dxFix, dy = horiz ? dyFix : v;
                const fx = dx < W / 2 ? W - 1 : 0, fy = dy < H / 2 ? H - 1 : 0;
                await t.eval(`(function(){ $gamePlayer.locate(${fx}, ${fy}); $gameMap.setDisplayPos(${dx}, ${dy});
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
                    // (the screen's good part clipped to the strip, in local tiles)
                    const X0 = Math.max(dx + l, ${lx0}), X1 = Math.min(dx + ${SW} - r, ${lx0 + lw}), Y0 = Math.max(dy + u, ${ly0}), Y1 = Math.min(dy + ${SH} - b, ${ly0 + lh});
                    if (X1 <= X0 || Y1 <= Y0) return 0;
                    const x0 = Math.floor((X0 - ${lx0}) * ${P}), x1 = Math.ceil((X1 - ${lx0}) * ${P}), y0 = Math.floor((Y0 - ${ly0}) * ${P}), y1 = Math.ceil((Y1 - ${ly0}) * ${P});
                    __sz.getContext("2d").drawImage(src, (x0 / ${P} + ${lx0} - dx) * 48, (y0 / ${P} + ${ly0} - dy) * 48, (x1 - x0) / ${P} * 48, (y1 - y0) / ${P} * 48,
                        x0 + ${ox * P}, y0 + ${oy * P}, x1 - x0, y1 - y0);
                    return 0; })()`);
            }
        }
        const url = await t.eval("__sz.toDataURL('image/png')");
        fs.writeFileSync(path.join(OUT, s.A + "_" + s.B + ".png"), Buffer.from(url.split(",")[1], "base64"));
        fs.writeFileSync(path.join(OUT, s.A + "_" + s.B + ".json"), JSON.stringify(Object.assign({ P, GLEB: D }, s)));
        console.log("  " + s.A + " | " + s.B + " " + s.dir + " " + s.L + " kratek -> " + iw + "x" + ih + " px, " + Math.round((Date.now() - t0) / 1000) + " s");
    }
    t.check("zdjęte łączenia: " + pairs.length, true);
});
