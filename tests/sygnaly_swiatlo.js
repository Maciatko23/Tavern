// W19: the lighting pictures - the mill (both rooms at dawn / day / dusk / night) and the cove's night (the sea's light, the boat, the people, S4).
// Run: GAME_OVERLAY=tools/sygnaly/overlay GAME_OVERLAY_JS=1 CDP_PORT=9440 node tests/sygnaly_swiatlo.js
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join("..", "docs", "zadania_nowe", "sygnaly_gra");
kit.test({ port: 9440, overlay: process.env.GAME_OVERLAY || "tools/sygnaly/overlay", overlayJs: true, bootCheck: "gra się uruchamia", errorCheck: false }, async t => {
    const shot = n => t.shot(path.join(OUT, n));
    const pump = async (cond, secs = 40) => {
        const t0 = Date.now();
        while (Date.now() - t0 < secs * 1000) {
            if (await t.eval(cond).catch(() => false)) return true;
            if (await t.eval("$gameMessage.isBusy() && !(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)").catch(() => false)) await t.press("ok");
            await t.frames(8);
        }
        return false;
    };
    await t.newGame({ story: true, skipIntro: true, map: 217, x: 7, y: 13, dir: 8, day: 30, hour: 6.5, quiet: true, minimap: false });
    await t.eval("Mlyn.debugGo(1); Mlyn.stan().klucz = 1; Mlyn.stan().cz1.scena = 1; 0");
    for (const [h, n] of [[6.5, "dawn"], [12, "day"], [19.4, "dusk"], [23, "night"]]) {
        await t.setHour(h);
        await t.go(217, 7, 12, 8); await t.frames(90);
        await shot("mlyn_" + n + "_parter.png");
        await t.go(217, 21, 9, 4); await t.frames(90);
        await shot("mlyn_" + n + "_komora.png");
    }
    // the cove at night
    await t.eval("Mlyn.debugGo(5); Wyspa.forceTide('high'); Mlyn.stan().ch4.soj = 'sambor'; Mlyn.stan().kod.wzor = 2; Mlyn.stan().ch4.set = $gameSystem._dayNightDay; Mlyn.opts({ lat: 1 }); 0");
    await t.go(8, 97, 92, 8);
    await t.setDay((await t.eval("$gameSystem._dayNightDay")) + 1, 1.2);
    await t.go(125, 19, 66, 4); await t.frames(80);
    await shot("zatoczka_noc_przed.png");
    await t.setHour(1.55);
    await pump("Mlyn.stan().ch5.stan >= 2", 60);
    await t.frames(500);
    await pump("Mlyn.stan().ch5.stan >= 3", 40);
    await t.frames(60);
    await shot("lodz_dobija.png");
    await pump("(Mlyn.stan().ch5.stan >= 3) && $gameMessage.isBusy()", 40);
    await t.frames(150);
    await shot("s4_zasadzka.png");
    await pump("Mlyn.stan().koniec > 0 || (SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)", 60);
    await shot("wyjscie_szyper.png");
    console.log("done");
});
