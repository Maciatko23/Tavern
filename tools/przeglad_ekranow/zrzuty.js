// Przegląd ekran po ekranie: każda mapa z listy zdjęta kolejnymi ekranami (27x15 kratek po 48 px, zakładka 2 kratki),
// bohater niewidoczny, bez pogody, dzień 40 godz. 11 (wnętrza - ich własne światło). Etykieta z kratką lewego górnego rogu w rogu.
//   MAPY=8,111 CDP_PORT=9780 S=0.5 node tools/przeglad_ekranow/zrzuty.js      -> tools/przeglad_ekranow/zrzuty/<mapa>/<x>_<y>.png
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "zrzuty");
const MAPY = (process.env.MAPY || "3").split(",").map(Number);
const S = Number(process.env.S) || 0.5;
const SW = 27, SH = 15;
kit.test({ port: Number(process.env.CDP_PORT) || 9780, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    beforeLoad: "window.WIDOK = false; window.POKOJE = false;" }, async t => {
    for (const id of MAPY) {
        const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "Map" + String(id).padStart(3, "0") + ".json"), "utf8"));
        const W = d.width, H = d.height, t0 = Date.now();
        const dir = path.join(OUT, String(id)); fs.mkdirSync(dir, { recursive: true });
        await t.newGame({ map: id, x: 0, y: 0, day: 40, hour: 11, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); 0");
        await t.eval("ConfigManager.moodVignette = false; 0");
        await t.eval("$gameScreen.clearZoom(); if (SceneManager._scene._spriteset) SceneManager._scene._spriteset.scale.set(1, 1); 0");   // (small interiors zoom x1.5 by their <Zoom:1.5>: whole map wanted)
        await t.frames(60);
        const xs = [], ys = [];
        const stepx = SW - 2, stepy = SH - 2;
        for (let x = 0; ; x += stepx) { const xx = Math.max(0, Math.min(x, W - SW)); xs.push(xx); if (x + SW >= W) break; }
        for (let y = 0; ; y += stepy) { const yy = Math.max(0, Math.min(y, H - SH)); ys.push(yy); if (y + SH >= H) break; }
        let n = 0;
        for (const y of [...new Set(ys)]) for (const x of [...new Set(xs)]) {
            const small = W <= SW && H <= SH, near = !!process.env.HERO_NEAR, fx = near ? x + 13 : small ? (W >> 1) : x < W / 2 ? W - 1 : 0, fy = near ? y + 7 : small ? (H >> 1) : y < H / 2 ? H - 1 : 0;
            await t.eval(`(function(){ $gamePlayer.locate(${fx}, ${fy}); if (!${small}) $gameMap.setDisplayPos(${x}, ${y});
                const sp = SceneManager._scene; for (const k of ['_cleanLayer','_cleanTop','_windowLayer']) if (sp[k]) sp[k].visible = false;
                const ss = sp._spriteset; if (ss._cloudSprites) { for (const c of ss._cloudSprites) if (c.parent) c.parent.removeChild(c); ss._cloudSprites.length = 0; }
                for (const s of ss._characterSprites) { const c = s._character; if (!c || c === $gamePlayer) continue; const n = c.characterName ? c.characterName() : "";
                    if (n && n[0] !== "!") c.setTransparent(true); }
                return 0; })()`);
            await t.frames(20);
            const url = await t.eval(`(function(){ const src = Graphics._canvas || document.querySelector("canvas");
                const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false;
                for (const c of sc._spriteset.children) if (/^(Sprite_CloudShadow|Weather|Sprite_StormSky|Sprite_StormLeaves|Sprite_SunRays)$/.test(c.constructor.name)) c.visible = false;
                if (Graphics._app && Graphics._app.renderer) Graphics._app.renderer.render(Graphics._app.stage);
                const w = Math.round(src.width * ${S}), h = Math.round(src.height * ${S});
                const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d");
                g.drawImage(src, 0, 0, w, h);
                g.font = "bold 13px monospace"; g.fillStyle = "rgba(0,0,0,0.75)"; g.fillRect(0, 0, 92, 16); g.fillStyle = "#ff0"; g.fillText("${id} ${x},${y}", 3, 13);
                return cv.toDataURL("image/png"); })()`);
            fs.writeFileSync(path.join(dir, x + "_" + y + ".png"), Buffer.from(url.split(",")[1], "base64")); n++;
        }
        console.log("  mapa " + id + " " + W + "x" + H + " ekranów " + n + " " + Math.round((Date.now() - t0) / 1000) + " s");
    }
    t.check("zdjęte mapy: " + MAPY.length, true);
});
