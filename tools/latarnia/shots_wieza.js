// Zrzuty wiezy latarni (2026-10-29, wieza 2x): docs/latarnia/<prefix>_dzien.png, <prefix>_noc.png (ogien zapalony).
// Uruchom: CDP_PORT=9811 SHOT_PREFIX=wieza_po node tools/latarnia/shots_wieza.js
// (zrzut "przed": GAME_OVERLAY=<folder ze starymi plikami> GAME_OVERLAY_JS=1 SHOT_PREFIX=wieza_przed ...)
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "latarnia");
const PREFIX = process.env.SHOT_PREFIX || "wieza_po";
const AT = process.env.SHOT_AT ? process.env.SHOT_AT.split(",").map(Number) : [22, 14];   // where the hero stands

kit.test({ port: 9811, bootCheck: "gra sie uruchamia", errorCheck: "bez bledow w konsoli" }, async t => {
    require("fs").mkdirSync(OUT, { recursive: true });
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    const view = (x, y) => t.eval(`(function(){ $gameMap.setDisplayPos(${x}, ${y}); return 0; })()`);
    const shot = async name => { await t.frames(8); await t.shot(path.join(OUT, name)); console.log("zrzut " + name); };
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.go(159, AT[0], AT[1], 8);
    await settle(240);
    await t.eval("(function(){ TownQuests.state().flags.latarnikMet = 1; Latarnia.state().met = 1; if (window.CloudShadows && CloudShadows.setEnabled) CloudShadows.setEnabled(false); return 0; })()");
    await t.setDay(10, 15.6);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(AT[0], AT[1], 8);
    await settle(200);
    const vy = Number(process.env.SHOT_VY || 0);
    await view(Number(process.env.SHOT_VX || 14), vy);
    await settle(30);
    await shot(PREFIX + "_dzien.png");
    if (process.env.SHOT_ONLY === "day") { await t.finish(); return; }
    await t.setDay(10, 23.2);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(AT[0], AT[1], 8);
    await settle(90);
    await view(22.5 - 8.5, vy);
    await t.eval("Graphics.frameCount = Math.ceil(Graphics.frameCount / 1320) * 1320 + 150; 0");
    await settle(20);
    await shot(PREFIX + "_noc.png");
    await t.finish();
});
