// (kopia z notatnika, Kruczogród faza 1: nakładka tools/miasto3/staging; OVERLAY=0 - gra bez nakładki)
// Prawdziwa mapa wyspy - zdjęcia map (gracz 2026-11-07: „a da się mapę prawdziwą zrobić, jakby oddaloną mocno, ale widać malutkie
// drzewa i inne rzeczy?”). Każda mapa z listy zdjęta ekran po ekranie w południe lata, bez HUD, chmur, deszczu, winiety i linii
// wzroku, bez ludzi i zwierząt (zostają drzewa, budynki, rzeczy); bohater niewidoczny i zawsze poza ekranem (drzewa nie
// przezroczyste). Każdy ekran zmniejszony od razu do P px na kratkę i wklejony w obraz całej mapy: tools/mapy/zrzuty_prawdziwa/<id>.png
//   MAPY=8,111,24 P=8 CDP_PORT=9510 node tools/mapy/mapa_prawdziwa_zrzuty.js      (MAPY=wszystkie: każda mapa świata)
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const ROOT = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna";
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(__dirname, "zrzuty_prawdziwa");   // (OUT_DIR: a trial elsewhere)
fs.mkdirSync(OUT, { recursive: true });
const uk = {};
const MAPY = [Number(process.env.MAPA)];
const P = Number(process.env.P || 16); const [RX0, RY0, RX1, RY1] = process.env.OBSZAR.split(",").map(Number);
kit.test({ port: Number(process.env.CDP_PORT || 9591), overlay: process.env.OVERLAY === "0" ? undefined : "tools/miasto3/staging", overlayJs: process.env.OVERLAY !== "0", lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 300000,
    beforeLoad: "window.WIDOK = false; window.BRZEG_ALL = true; window.LAKA_ALL = true;" }, async t => {
    for (const id of MAPY) {
        const d = JSON.parse(fs.readFileSync(path.join(process.env.OVERLAY === "0" ? ROOT + "/data" : ROOT + "/tools/miasto3/staging/data", "Map" + String(id).padStart(3, "0") + ".json"), "utf8"));
        const W = d.width, H = d.height, t0 = Date.now();
        await t.newGame({ map: id, x: 0, y: 0, day: 40, hour: 12, quiet: true, minimap: false });
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gamePlayer.setOpacity(0); $gameScreen.changeWeather('none', 0, 0); 0");
        await t.eval("ConfigManager.moodVignette = false; 0");   // (Mood.js's vignette darkens the screen's edges - the map's own edges came out dark)
        await t.frames(60);
        // the page draws the shots into one canvas of the whole map at P px a tile and gives it back as a PNG
        await t.eval(`window.__pm = document.createElement("canvas"); __pm.width = ${(RX1 - RX0) * P}; __pm.height = ${(RY1 - RY0) * P}; 0`);
        // (the screens overlap: of each only its middle is taken - a screen's edges are a little lighter or darker (the light, the
        // sky's shade) - but at the map's own edge all of it; MX / MY tiles cut from the sides / the top and the bottom)
        const SW = 1280 / 48, SH = 720 / 48, MX = 1, MY = 1.5, cw = Math.floor(SW - 2 * MX), ch = Math.floor(SH - 2 * MY);   // (whole tiles a step)
        const xs = [], ys = [];
        for (let x = RX0 - 1; x < RX1 - SW + cw + 1; x += cw) xs.push(Math.min(x, Math.max(0, W - SW)));
        for (let y = RY0 - 2; y < RY1 - SH + ch + 2; y += ch) ys.push(Math.min(y, Math.max(0, H - SH)));
        for (const y of [...new Set(ys)]) for (const x of [...new Set(xs)]) {
            const fx = 10, fy = 10;   // (the hero far from the screen: no tree fades for him)
            await t.eval(`(function(){ $gamePlayer.locate(${fx}, ${fy}); $gameMap.setDisplayPos(${x}, ${y});
                const sp = SceneManager._scene; for (const k of ['_cleanLayer','_cleanTop','_windowLayer']) if (sp[k]) sp[k].visible = false;
                const ss = sp._spriteset; if (ss._cloudSprites) { for (const c of ss._cloudSprites) if (c.parent) c.parent.removeChild(c); ss._cloudSprites.length = 0; }
                for (const s of ss._characterSprites) { const c = s._character; if (!c || c === $gamePlayer) continue; const n = c.characterName ? c.characterName() : "";
                    if (n && n[0] !== "!") c.setTransparent(true); }   // (people and animals - a "$" or a plain sheet; the "!" things stay)
                return 0; })()`);
            await t.frames(24);
            // (a WebGL canvas keeps its picture only within the frame that drew it: drawn again here and copied at once)
            await t.eval(`(function(){ const src = Graphics._canvas || document.querySelector("canvas"), dx = $gameMap.displayX(), dy = $gameMap.displayY();
                // (only the map itself: every layer over it hidden - one of them darkens the screen's top and bottom -, no cloud shadows,
                // weather, storm sky, sun rays on it)
                const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false;
                for (const c of sc._spriteset.children) if (/^(Sprite_CloudShadow|Weather|Sprite_StormSky|Sprite_StormLeaves|Sprite_SunRays)$/.test(c.constructor.name)) c.visible = false;
                if (Graphics._app && Graphics._app.renderer) Graphics._app.renderer.render(Graphics._app.stage);
                const l = dx <= 0.05 ? 0 : ${MX}, r = dx + ${SW} >= ${W} - 0.05 ? 0 : ${MX}, u = dy <= 0.05 ? 0 : ${MY}, b = dy + ${SH} >= ${H} - 0.05 ? 0 : ${MY};
                const x0 = Math.floor((dx + l) * ${P}), x1 = Math.ceil((dx + ${SW} - r) * ${P}), y0 = Math.floor((dy + u) * ${P}), y1 = Math.ceil((dy + ${SH} - b) * ${P});   // (a pixel over, never a gap)
                __pm.getContext("2d").drawImage(src, (x0 / ${P} - dx) * 48, (y0 / ${P} - dy) * 48, (x1 - x0) / ${P} * 48, (y1 - y0) / ${P} * 48, x0 - ${RX0 * P}, y0 - ${RY0 * P}, x1 - x0, y1 - y0); return 0; })()`);
        }
        const url = await t.eval("__pm.toDataURL('image/png')");
        fs.writeFileSync(process.env.PLIK, Buffer.from(url.split(",")[1], "base64"));
        console.log("  mapa " + id + " " + W + "x" + H + " -> " + W * P + "x" + H * P + " px, " + Math.round((Date.now() - t0) / 1000) + " s");
    }
    t.check("zdjęte mapy: " + MAPY.length, true);
});
