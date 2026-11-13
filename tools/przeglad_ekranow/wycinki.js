// Wycinki w pełnej skali (48 px/kratkę) z zaznaczonym miejscem: z pliku JSON listy {id, mapa, x, y, w, h}
//   LISTA=lista_wycinkow.json OUT=../../docs/przeglad_ekranow CDP_PORT=9780 node tools/przeglad_ekranow/wycinki.js
// -> OUT/<mapa>/<id>.png (czerwona ramka wokół kratek x..x+w-1, y..y+h-1; obraz = ramka + 5 kratek zapasu, min 15x9 kratek)
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const LISTA = JSON.parse(fs.readFileSync(path.resolve(process.env.LISTA || path.join(__dirname, "lista_wycinkow.json")), "utf8"));
const OUT = path.resolve(process.env.OUT || path.join(__dirname, "..", "..", "docs", "przeglad_ekranow"));
const PART = process.env.PART ? process.env.PART.split("/").map(Number) : [0, 1];   // 0/2: co druga mapa
const byMap = {};
for (const e of LISTA) (byMap[e.mapa] = byMap[e.mapa] || []).push(e);
const maps = Object.keys(byMap).map(Number).sort((a, b) => a - b).filter((m, i) => i % PART[1] === PART[0]);
kit.test({ port: Number(process.env.CDP_PORT) || 9780, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    beforeLoad: "window.WIDOK = false; window.POKOJE = false;" }, async t => {
    let n = 0;
    for (const id of maps) {
        const d = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "Map" + String(id).padStart(3, "0") + ".json"), "utf8"));
        const W = d.width, H = d.height;
        const dir = path.join(OUT, String(id)); fs.mkdirSync(dir, { recursive: true });
        await t.newGame({ map: id, x: 0, y: 0, day: 40, hour: 11, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); $gameScreen.clearZoom(); if (SceneManager._scene._spriteset) SceneManager._scene._spriteset.scale.set(1, 1); ConfigManager.moodVignette = false; 0");
        await t.frames(40);
        for (const e of byMap[id]) {
            const cw = Math.min(27, Math.max(15, e.w + 10)), ch = Math.min(15, Math.max(9, e.h + 6));
            let x0 = Math.round(e.x + e.w / 2 - cw / 2), y0 = Math.round(e.y + e.h / 2 - ch / 2);
            const small = W <= 27 && H <= 15;
            x0 = Math.max(0, Math.min(x0, Math.max(0, W - 26)));   // (the screen is 26.67 cells wide)
            y0 = Math.max(0, Math.min(y0, Math.max(0, H - 15)));
            const fx = e.x < W / 2 ? W - 1 : 0, fy = e.y < H / 2 ? H - 1 : 0;
            await t.eval(`(function(){ $gamePlayer.locate(${small ? W >> 1 : fx}, ${small ? H >> 1 : fy}); if (!${small}) $gameMap.setDisplayPos(${x0}, ${y0});
                const sp = SceneManager._scene; for (const k of ['_cleanLayer','_cleanTop','_windowLayer']) if (sp[k]) sp[k].visible = false;
                const ss = sp._spriteset; if (ss._cloudSprites) { for (const c of ss._cloudSprites) if (c.parent) c.parent.removeChild(c); ss._cloudSprites.length = 0; }
                for (const s of ss._characterSprites) { const c = s._character; if (!c || c === $gamePlayer) continue; const nm = c.characterName ? c.characterName() : "";
                    if (nm && nm[0] !== "!") c.setTransparent(true); }
                return 0; })()`);
            await t.frames(16);
            const url = await t.eval(`(function(){ const src = Graphics._canvas || document.querySelector("canvas");
                const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false;
                for (const c of sc._spriteset.children) if (/^(Sprite_CloudShadow|Weather|Sprite_StormSky|Sprite_StormLeaves|Sprite_SunRays)$/.test(c.constructor.name)) c.visible = false;
                if (Graphics._app && Graphics._app.renderer) Graphics._app.renderer.render(Graphics._app.stage);
                const dx = $gameMap.displayX(), dy = $gameMap.displayY();
                const cv = document.createElement("canvas"); cv.width = src.width; cv.height = src.height; const g = cv.getContext("2d"); g.drawImage(src, 0, 0);
                const rx = (${e.x} - dx) * 48, ry = (${e.y} - dy) * 48, rw = ${e.w} * 48, rh = ${e.h} * 48;
                g.lineWidth = 3; g.strokeStyle = "#ff1030"; g.strokeRect(rx - 3, ry - 3, rw + 6, rh + 6); g.lineWidth = 1; g.strokeStyle = "#ffffff"; g.strokeRect(rx - 6, ry - 6, rw + 12, rh + 12);
                // crop around the spot
                let cx = Math.max(0, Math.min(src.width - ${cw} * 48, rx + rw / 2 - ${cw} * 24)), cy = Math.max(0, Math.min(src.height - ${ch} * 48, ry + rh / 2 - ${ch} * 24));
                const out = document.createElement("canvas"); out.width = Math.min(src.width, ${cw} * 48); out.height = Math.min(src.height, ${ch} * 48);
                const go = out.getContext("2d"); go.drawImage(cv, cx, cy, out.width, out.height, 0, 0, out.width, out.height);
                go.font = "bold 14px monospace"; go.fillStyle = "rgba(0,0,0,0.75)"; go.fillRect(0, 0, 150, 18); go.fillStyle = "#ff0"; go.fillText("${id}  ${e.id}  (${e.x},${e.y})", 4, 14);
                return out.toDataURL("image/png"); })()`);
            fs.writeFileSync(path.join(dir, e.id + ".png"), Buffer.from(url.split(",")[1], "base64")); n++;
        }
        console.log("  mapa " + id + " wycinków " + byMap[id].length);
    }
    t.check("wycinki: " + n, true);
});
