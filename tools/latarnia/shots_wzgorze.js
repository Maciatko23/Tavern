// Zrzuty wzgorza latarni (2026-10-29, trzy pietra): docs/latarnia/wzgorze_dzien.png, wzgorze_noc.png, wzgorze_z_daleka.png
// Uruchom: CDP_PORT=9811 node tools/latarnia/shots_wzgorze.js
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "latarnia");
kit.test({ port: 9811, width: Number(process.env.SHOT_W || 1280), height: Number(process.env.SHOT_H || 720), bootCheck: "gra sie uruchamia", errorCheck: "bez bledow w konsoli" }, async t => {
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    const view = (x, y) => t.eval(`(function(){ $gameMap.setDisplayPos(${x}, ${y}); return 0; })()`);
    const shot = async name => { await t.frames(8); await t.shot(path.join(OUT, name)); console.log("zrzut " + name); };
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.go(159, 26, 17, 8);
    await settle(240);
    await t.eval("(function(){ TownQuests.state().flags.latarnikMet = 1; Latarnia.state().met = 1; if (window.CloudShadows && CloudShadows.setEnabled) CloudShadows.setEnabled(false); return 0; })()");
    await t.setDay(10, 15.6);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(26, 17, 8);
    await settle(200);
    await view(14, 3.2);
    await settle(30);
    await shot("wzgorze_dzien.png");
    await t.setDay(10, 23.2);
    await t.eval("TownLife.placeAll(); 0");
    await t.locate(22, 12, 8);
    await settle(90);
    await view(13.5, 0);
    await t.eval("Graphics.frameCount = Math.ceil(Graphics.frameCount / 1320) * 1320 + 150; 0");
    await settle(20);
    await shot("wzgorze_noc.png");
    if (process.env.SHOT_FAR) {   // two shots one above the other (rows 0-15 and 14-29), stitched by tools/latarnia/zszyj.py
        await t.setDay(10, 15.6);
        await t.eval("TownLife.placeAll(); 0");
        await t.locate(22, 28, 8);
        await settle(120);
        await view(7, 0);
        await settle(30);
        await shot("_far_a.png");
        await view(7, 14);
        await settle(30);
        await shot("_far_b.png");
    }
    await t.finish();
});
