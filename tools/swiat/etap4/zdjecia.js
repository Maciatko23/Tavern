// Etap 4: zdjęcia zakładki „Mapa” z gry. PRZED = obecna gra, PO = staging etapu 4 (GAME_OVERLAY_JS).
//   node tools/swiat/etap4/zdjecia.js przed     |     node tools/swiat/etap4/zdjecia.js po
// Port 9385. Wszystkie miejsca odwiedzone, bohater w miasteczku, kursor na wybranym miejscu, karta miejsca.
"use strict";
const path = require("path");
const kit = require("../../../tests/lib/kit.js");
const po = process.argv[2] === "po";
const OUT = path.join(__dirname, "..", "..", "..", "docs", "swiat_etap4");
const opts = { port: 9385, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" };
if (po) { opts.overlay = "tools/swiat/etap4/staging"; opts.overlayJs = true; }
kit.test(opts, async t => {
    t.check("nowa gra", await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true, minimap: false }));
    await t.eval("ConfigManager.uiClean = true; window.dispatchEvent(new Event('pointerdown')); 0");
    await t.frames(30);
    const ids = await t.json("MapaWyspy.PLACES.map(p => p.id)");
    await t.eval(`(function(){ const s = Tawerna.state("nazwaMapy"); for (const id of ${JSON.stringify(ids.filter(x => typeof x === "number"))}) s.odw[id] = 1; s.odw[10] = 1; return 0; })()`);
    await t.go(8, 50, 90, 6);
    await t.frames(30);
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(40);
    let m = await t.json("MenuRing.info()");
    for (let i = 0; i < 10 && m.active !== "mapa"; i++) { await t.key("D"); await t.frames(12); m = await t.json("MenuRing.info()"); }
    await t.shot(path.join(OUT, "mapa_" + (po ? "po" : "przed") + ".png"));
    await t.key("O"); await t.frames(8);
    await t.shot(path.join(OUT, "mapa_" + (po ? "po" : "przed") + "_kursor.png"));
    await t.key("O"); await t.frames(8);
    await t.shot(path.join(OUT, "mapa_" + (po ? "po" : "przed") + "_karta.png"));
});
