// In-game pictures of the harbour (docs/przystan/w_grze_*.png): the whole map (stitched from 3 x 3 screens, the HUD hidden), the
// ferry day at the pier, the night with its flames, Janek's and Roch's first meetings, the customs officer, the three interiors.
// Run (the game served on 8765): CDP_PORT=9480 node tools/przystan/shots.js
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const kit = require("../../tests/lib/kit.js");

const OUT = path.join(__dirname, "..", "..", "docs", "przystan");
const TMP = path.join(__dirname, "staging", "shots");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    fs.mkdirSync(TMP, { recursive: true });
    // (the HUD and the windows off, and the moving cloud shadows too - else the 9 screens do not match at their seams)
    const hideHud = on => t.eval(`(function(){ const s = SceneManager._scene, ss = s._spriteset, on = ${on ? "true" : "false"};
        s.children.forEach(c => { if (c !== ss) c.visible = !on; });
        if (on) { ss._prKeep = ss.filters; ss.filters = null; } else if (ss._prKeep !== undefined) { ss.filters = ss._prKeep; }
        (ss._cloudSprites || []).forEach(c => { if (on) { c._prUpd = c.update; c.update = function(){}; c.visible = false; } else if (c._prUpd) { c.update = c._prUpd; } });
        return 0; })()`);
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };

    // ---------------------------------------------------------------- the whole map at noon on a ferry day
    await t.newGame({ map: 125, x: 30, y: 20, dir: 2, hour: 11.5, day: 4, quiet: true, minimap: false });
    await t.eval("$gamePlayer.setTransparent(true); 0");
    await settle(60);
    await hideHud(true);
    const W = 56, H = 40, SW = 1280 / 48, SH = 720 / 48;
    const xs = [0, 26, W - SW], ys = [0, 13, H - SH];
    const parts = [];
    for (const y of ys) for (const x of xs) {
        await t.eval(`$gameMap.setDisplayPos(${x}, ${y}); 0`);
        await t.frames(12);
        const f = path.join(TMP, `part_${x}_${y}.png`);
        await t.shot(f);
        parts.push([f, x, y]);
    }
    fs.writeFileSync(path.join(TMP, "parts.json"), JSON.stringify(parts));
    await hideHud(false);
    await t.eval("$gamePlayer.setTransparent(false); 0");

    // ---------------------------------------------------------------- the ferry day at the pier
    await t.locate(16, 17, 4);
    await t.eval("$gamePlayer.center($gamePlayer.x, $gamePlayer.y); 0");
    await settle(40);
    await t.shot(path.join(OUT, "w_grze_prom.png"));

    // ---------------------------------------------------------------- Janek's first meeting (13:30, at his nets)
    await t.setDay(5, 13.5);
    await t.eval("TownLife.placeAll(); 0");
    await settle(30);
    await t.eval(kit.DRIVER + "; 0");
    const talkShot = async (evExpr, file, lineN) => {
        await t.eval(`(function(){ const e = ${evExpr}; __standBy(e.eventId()); e.start(); return 0; })()`);
        await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 15);
        for (let i = 0; i < (lineN || 0); i++) { await t.frames(60); await t.press("ok"); }
        await t.frames(110);
        await t.shot(file);
        await t.finish(40);
        await t.frames(30);
    };
    await talkShot("TownLife.eventOf('janek')", path.join(OUT, "w_grze_janek.png"), 0);
    // ---------------------------------------------------------------- Roch's first meeting (by the slipway)
    await t.setHour(10);
    await t.eval("TownLife.placeAll(); 0");
    await settle(30);
    await talkShot("TownLife.eventOf('przemytnik')", path.join(OUT, "w_grze_roch.png"), 0);

    // ---------------------------------------------------------------- the night: the quay's lanterns, the fire baskets, the brazier
    await t.setHour(21.4);
    await t.locate(20, 12, 4);
    await t.eval("$gamePlayer.setTransparent(true); TownLife.placeAll(); 0");
    await settle(60);
    await t.eval("$gameMap.setDisplayPos(1, 3); 0");
    await t.frames(30);
    await t.shot(path.join(OUT, "w_grze_noc.png"));
    await t.eval("$gamePlayer.setTransparent(false); 0");

    // ---------------------------------------------------------------- the interiors by day, each with its own
    const inside = [[126, 6, 8, 23.2, "janek"], [127, 5, 7, 2.5, "przemytnik"], [128, 5, 7, 10.5, "celnik"]];
    for (const [map, x, y, h, key] of inside) {
        await t.setHour(h);
        await t.go(map, x, y, 8);
        await settle(40);
        await t.shot(path.join(TMP, "wnetrze_" + map + ".png"));
    }
    // the customs officer at his desk, spoken to
    await t.setHour(10.5);
    await settle(20);
    await talkShot("TownLife.eventOf('celnik')", path.join(OUT, "w_grze_celnik.png"), 0);

    // ---------------------------------------------------------------- the stitching (Python: PIL)
    execFileSync("python", [path.join(__dirname, "shots_stitch.py"), TMP, OUT], { stdio: "inherit" });
    t.check("the pictures are written", ["w_grze_mapa.png", "w_grze_prom.png", "w_grze_janek.png", "w_grze_roch.png", "w_grze_noc.png", "w_grze_wnetrza.png", "w_grze_celnik.png"]
        .every(f => fs.existsSync(path.join(OUT, f))));
});
