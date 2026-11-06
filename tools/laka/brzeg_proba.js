// Próba (2026-11-05): zaokrąglony brzeg (CzerwonaWoda.js) na mapach spoza BRZEG_MAPS, obrazki przed / po - bez zmian w grze (window.BRZEG_ALL; mapom bez <Water:salt> dokładany na czas próby).
//   node tools/laka/brzeg_proba.js    (MAPY=21,20: tylko te; wynik: docs/laka/brzegi/Map<id>_przed.png, _po.png; czas pierwszego wejścia przy CPU 4x)
"use strict";
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "..", "docs", "laka", "brzegi");
const SPOTS = JSON.parse(fs.readFileSync(path.join(__dirname, "brzegi.json"), "utf8"));
const LISTA = (process.env.MAPY || "").split(",").filter(Boolean).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9419, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 180000 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 3, x: 25, y: 15, day: 12, hour: 11, quiet: true, minimap: false });
    await t.eval(`(() => { const ol = DataManager.onLoad; DataManager.onLoad = function(o) { ol.call(this, o); if (o === window.$dataMap && window.__SOL && !/<Water:\s*salt\s*>/i.test(o.note || "")) { o.note = (o.note || "") + " <Water:salt>"; } }; return 0; })()`);
    const czasy = [];
    for (const [mid, x, y] of SPOTS) {
        if (LISTA.length && !LISTA.includes(mid)) continue;
        for (const [nazwa, wl] of [["przed", false], ["po", true]]) {
            await t.go(3, 25, 15, 2); await t.frames(10);
            await t.eval(`window.BRZEG_ALL = ${wl}; window.__SOL = ${wl}; 0`);
            if (wl) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
            const t0 = Date.now();
            await t.go(mid, x, y, 2);
            if (wl) { czasy.push([mid, Date.now() - t0]); await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 }); }
            await t.eval(`$gamePlayer.setTransparent(true); $gamePlayer.center(${x}, ${y}); (SceneManager._scene._spriteset._cloudSprites || []).forEach(c => { c.renderable = false; }); 0`);
            await t.frames(wl ? 240 : 120);
            await t.shot(path.join(OUT, "Map" + mid + "_" + nazwa + ".png"));
        }
        t.check("Map" + mid + ": zrzuty", true);
    }
    console.log("   CZASY " + JSON.stringify(czasy));
});
