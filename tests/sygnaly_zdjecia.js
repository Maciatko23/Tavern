// W19: frame strips of the three animations (the sails turning B -> C, the shuttered lantern's K-D-K, the boat coming in) as separate pictures
// in docs/zadania_nowe/sygnaly_gra/anim_*/ (tools/sygnaly/paski.py puts them together into strips and GIFs).
// Run: GAME_OVERLAY=tools/sygnaly/overlay GAME_OVERLAY_JS=1 CDP_PORT=9440 node tests/sygnaly_zdjecia.js
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join("..", "docs", "zadania_nowe", "sygnaly_gra");
kit.test({ port: 9440, overlay: process.env.GAME_OVERLAY || "tools/sygnaly/overlay", overlayJs: true, bootCheck: "gra się uruchamia", errorCheck: false }, async t => {
    const shot = (dir, i) => t.shot(path.join(OUT, dir, "f" + String(i).padStart(2, "0") + ".png"));
    const pump = async (cond, secs = 40) => {
        const t0 = Date.now();
        while (Date.now() - t0 < secs * 1000) {
            if (await t.eval(cond).catch(() => false)) return true;
            if (await t.eval("$gameMessage.isBusy() && !(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)").catch(() => false)) await t.press("ok");
            await t.frames(8);
        }
        return false;
    };
    // ---- the sails turning B -> C (a quarter of a turn: 7 ticks a frame)
    await t.newGame({ story: true, skipIntro: true, map: 8, x: 97, y: 92, dir: 8, day: 28, hour: 19.6, quiet: true, minimap: false });
    await t.eval("Mlyn.debugGo(2); Mlyn.forced('B'); 0");
    await t.frames(60);
    await t.eval("$gameMap.startScroll(8, 4, 8); 0"); await t.frames(50);
    await shot("anim_skrzydla", 0);
    await t.eval("Mlyn.forced('D'); 0");
    for (let i = 1; i <= 12; i++) { await t.frames(6); await shot("anim_skrzydla", i); }
    await t.eval("$gameMap.startScroll(2, 4, 8); 0"); await t.frames(60);
    // ---- the shuttered lantern K-D-K (S2): the lookout's light flashes
    await t.eval("Mlyn.forced(null); Mlyn.debugGo(2); 0");
    await t.setDay(33, 22);
    await t.go(8, 113, 84, 8);
    await t.eval("Mlyn.forced(null); 0"); await t.frames(90);
    // (the flash is real-time and a picture takes longer than a short flash: the states of K D K are set one by one and shot)
    const seq = [0, 1, 0, 1, 1, 0, 1, 0];
    for (let i = 0; i < seq.length; i++) {
        await t.eval(seq[i] ? "(function(){ const e = $gameMap.event(2971); e.locate(112, 79); e.setTransparent(false); return 0; })()" : "(function(){ const e = $gameMap.event(2971); e.locate(-60, -60); e.setTransparent(true); return 0; })()");
        await t.frames(8);
        await shot("anim_latarnia", i);
    }
    await t.eval("Mlyn.sc(2, 1); 0"); await t.wait(500);
    // ---- the boat coming in (S3): every 50 frames while it sails
    await t.eval("Mlyn.debugGo(5); Wyspa.forceTide('high'); Mlyn.stan().ch4.soj = 'sambor'; Mlyn.stan().kod.wzor = 2; Mlyn.stan().ch4.set = $gameSystem._dayNightDay; 0");
    await t.setDay((await t.eval("$gameSystem._dayNightDay")) + 1, 1.55);
    await t.go(125, 19, 66, 4);
    await pump("(SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Latarnia')", 40);
    await t.eval("Mlyn.opts && 0; 0");
    await t.frames(200);
    await t.press("left"); await t.frames(4); await t.press("right"); await t.frames(4); await t.press("left"); await t.frames(4); await t.press("ok");
    await pump("Mlyn.stan().ch5.stan >= 2", 40);
    for (let i = 0; i < 10; i++) { await t.frames(50); await shot("anim_lodz", i); }
    console.log("frames done");
});
