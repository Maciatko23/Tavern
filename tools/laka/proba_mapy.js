// Próba (2026-11-05): łąka i Ziemia na innych mapach, obrazki przed / po (window.LAKA / ZIEMIA wyłącza je na czas zrzutu „przed”).
//   GAME_OVERLAY=tools/laka/staging GAME_OVERLAY_JS=1 node tools/laka/proba_mapy.js    (MAPY=8,13: tylko te; wynik: docs/laka/mapy/Map<id>_przed.png, _po.png)
"use strict";
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "..", "docs", "laka", "mapy");
const SPOTS = JSON.parse(fs.readFileSync(path.join(__dirname, "miejsca.json"), "utf8"));
const LISTA = (process.env.MAPY || "").split(",").filter(Boolean).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9419, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 3, x: 25, y: 15, day: 12, hour: 11, quiet: true, minimap: false });
    for (const [mid, x, y] of SPOTS) {
        if (LISTA.length && !LISTA.includes(mid)) continue;
        for (const [nazwa, wl] of [["przed", false], ["po", true]]) {
            await t.eval(`window.LAKA = ${wl ? "undefined" : "{ off: true }"}; window.ZIEMIA = ${wl ? "undefined" : "{ off: true }"}; 0`);
            await t.go(mid, x, y, 2);
            await t.eval(`$gamePlayer.setTransparent(true); $gamePlayer.center(${x}, ${y}); (SceneManager._scene._spriteset._cloudSprites || []).forEach(c => { c.renderable = false; }); 0`);
            await t.frames(300);
            await t.shot(path.join(OUT, "Map" + mid + "_" + nazwa + ".png"));
        }
        t.check("Map" + mid + ": zrzuty", true);
    }
});
