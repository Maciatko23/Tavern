// How long is the player locked after one blow on a rock (pickaxe) compared to a tree (axe)? Frames from start to each state change.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => b.evaluate(e);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); $gameParty.gainItem($dataItems[63], 1); $gameParty.gainItem($dataItems[60], 1); 0");
        await sleep(600);
        const trace = async (eid, px, py, d) => ev(`new Promise(res => {
            $gameSystem.setStamina(100); $gamePlayer.locate(${px}, ${py}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${px} - 13, ${py} - 7);
            const e = $gameMap.event(${eid});
            const t0 = Graphics.frameCount, log = {};
            const mark = (k, cond) => { if (log[k] === undefined && cond) log[k] = Graphics.frameCount - t0; };
            const h0 = e._treeHits || 0;
            setTimeout(() => { e.start();
                const iv = setInterval(() => {
                    mark("blowLanded", (e._treeHits || 0) !== h0);
                    mark("eventRunningEnds", log.blowLanded !== undefined && !$gameMap.isEventRunning());
                    mark("treeAnimatingEnds", log.blowLanded !== undefined && !e.isTreeAnimating());
                    mark("swingEnds", log.blowLanded !== undefined && !$gamePlayer.isToolSwinging());
                    mark("canMove", log.blowLanded !== undefined && $gamePlayer.canMove());
                    if (log.canMove !== undefined || Graphics.frameCount - t0 > 600) { clearInterval(iv); res(log); }
                }, 4);
            }, 30);
        })`);
        console.log("ore vein (pickaxe):", JSON.stringify(await trace(45, 33, 18, 2)));
        await sleep(2500);
        console.log("tree (axe):        ", JSON.stringify(await trace(1, 14, 10, 8)));
    } catch (e) { console.log("ERR", e.message); }
    await b.close();
    process.exit(0);
})();
