// Krok 5 (Lapka pod Gawra, pilot krajobrazu): zdjecia Z GRY, ten sam kadr przed (bez nakladki) i po (nakladka staging).
//   MODE=before|after  PLACES=<plik json [{id,box:[x0,y0,x1,y1],p?}]>  OUT_DIR=<folder>  CDP_PORT=9691  node tools/poprawki_krok5/zdjecia.js
// bohater niewidzialny, pogoda brak, dzien 40, godzina 11, bez chmur; zszyte ekran po ekranie (p = pikseli na kratke w obrazie, domyslnie 32).
const kit = require("../../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, "tmp", "zdjecia"), MODE);
fs.mkdirSync(OUT, { recursive: true });
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const SW = 1280 / 48, SH = 720 / 48;
const PLACES = JSON.parse(fs.readFileSync(process.env.PLACES, "utf8"));
const MAP = +(process.env.MAP || 125);
kit.test({ port: +(process.env.CDP_PORT || 9704), overlay: OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    await t.newGame({ map: MAP, x: 27, y: 20, day: 40, hour: 11, quiet: true, minimap: false });
    for (const pl of PLACES) {
        if (process.env.ONLY && !process.env.ONLY.split(",").includes(pl.id)) continue;
        const P = pl.p || 32;
        const [bx0, by0, bx1, by1] = pl.box;
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); ConfigManager.moodVignette = false; 0");
        const W = await t.eval("$gameMap.width()"), H = await t.eval("$gameMap.height()");
        const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, MX = 1, MY = 2;
        await t.eval(`window.__sz = document.createElement("canvas"); __sz.width = ${Math.round(bw * P)}; __sz.height = ${Math.round(bh * P)}; 0`);
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
                const P = ${P}, x0 = Math.floor((X0 - ${bx0}) * P), x1 = Math.ceil((X1 - ${bx0}) * P), y0 = Math.floor((Y0 - ${by0}) * P), y1 = Math.ceil((Y1 - ${by0}) * P);
                __sz.getContext("2d").drawImage(src, (x0 / P + ${bx0} - dx) * 48, (y0 / P + ${by0} - dy) * 48, (x1 - x0) / P * 48, (y1 - y0) / P * 48, x0, y0, x1 - x0, y1 - y0);
                for (const c of sc.children) c.visible = true;
                return 0; })()`);
        }
        const url = await t.eval("__sz.toDataURL('image/png')");
        fs.writeFileSync(path.join(OUT, pl.id + ".png"), Buffer.from(url.split(",")[1], "base64"));
        console.log("  zdjecie " + pl.id);
    }
    t.check("zdjecia (" + MODE + ")", true);
});
