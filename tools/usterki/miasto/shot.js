// Usterki/miasto: targeted in-game shots. MAP=8 CAMS="x,y;x,y" OUT=dir TAG=name [OVERLAY=tools/usterki/miasto/staging] [S=1] CDP_PORT=9800 node shot.js
// MAP=8 ALL=1 -> every screen (27x15 step 25x13) like tools/przeglad_ekranow/zrzuty.js. Files OUT/<TAG>_<x>_<y>.png
const kit = require("../../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", "..", "..");
const MAP = Number(process.env.MAP || 8), S = Number(process.env.S) || 1, OUT = process.env.OUT, TAG = process.env.TAG || "s";
const SW = 27, SH = 15;
kit.test({ port: Number(process.env.CDP_PORT) || 9800, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    overlay: process.env.OVERLAY || undefined,
    beforeLoad: "window.WIDOK = false; window.POKOJE = false; window.KLIMAT_ZIEMIA = { off: true };" }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, process.env.OVERLAY ? path.join(process.env.OVERLAY, "data") : "data", "Map" + String(MAP).padStart(3, "0") + ".json"), "utf8"));
    const W = d.width, H = d.height;
    await t.newGame({ map: MAP, x: 0, y: 0, day: Number(process.env.DAY || 40), hour: Number(process.env.HOUR || 11), quiet: true, minimap: false });
    await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); 0");
    await t.eval("ConfigManager.moodVignette = false; $gameScreen.clearZoom(); if (SceneManager._scene._spriteset) SceneManager._scene._spriteset.scale.set(1, 1); 0");
    await t.frames(60);
    let cams = [];
    if (process.env.ALL) {
        const xs = [], ys = [];
        for (let x = 0; ; x += SW - 2) { xs.push(Math.max(0, Math.min(x, W - SW))); if (x + SW >= W) break; }
        for (let y = 0; ; y += SH - 2) { ys.push(Math.max(0, Math.min(y, H - SH))); if (y + SH >= H) break; }
        for (const y of [...new Set(ys)]) for (const x of [...new Set(xs)]) cams.push([x, y]);
    } else cams = process.env.CAMS.split(";").map(s => s.split(",").map(Number));
    for (const [x, y] of cams) {
        await t.eval(`(function(){ $gamePlayer.locate(${x < W / 2 ? W - 1 : 0}, ${y < H / 2 ? H - 1 : 0}); $gameMap.setDisplayPos(${x}, ${y});
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
            g.font = "bold 13px monospace"; g.fillStyle = "rgba(0,0,0,0.75)"; g.fillRect(0, 0, 92, 16); g.fillStyle = "#ff0"; g.fillText("${MAP} ${x},${y}", 3, 13);
            return cv.toDataURL("image/png"); })()`);
        fs.writeFileSync(path.join(OUT, TAG + "_" + x + "_" + y + ".png"), Buffer.from(url.split(",")[1], "base64"));
    }
    t.check("shots " + cams.length, true);
});
