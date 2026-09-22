// An iron axe saves one blow on the same kind of tree (ChoppableTree.toolBonus).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(2); await ev(`Input._currentState.${k} = false; 0`); await frames(2); };
        await ev("$gameParty.gainItem($dataItems[60], 1); $gameParty.gainItem($dataItems[63], 1); 0");

        // count the presses that finish a tree / rock: the hit counter resets to 0 when the last blow lands
        const chop = async (eid, dir) => {
            const e = await ev(`(function(){ const e = $gameMap.event(${eid}); return { x: e.x, y: e.y, name: e.event().name }; })()`);
            const d = { 2: [0, -1], 8: [0, 1], 4: [1, 0], 6: [-1, 0] }[dir];   // the player stands on the side opposite to the facing direction
            const px = e.x + d[0], py = e.y + d[1];
            await ev(`$gameSystem.setStamina(100); $gamePlayer.locate(${px}, ${py}); $gamePlayer.setDirection(${dir}); $gameMap.setDisplayPos(${px} - 13, ${py} - 7); 0`);
            await frames(6);
            let swings = 0, peak = 0;
            for (let i = 0; i < 14; i++) {
                await press("ok");
                await frames(75);
                await ev("$gameSystem.setStamina(100); 0");
                const hits = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                swings++;
                if (hits === 0) break;
                peak = hits;
            }
            return { name: e.name, swings, peak };
        };
        const noIron = await chop(35, 2);   // stands below the tree, faces up
        await ev("$gameParty.gainItem($dataItems[115], 1); 0");
        const withIron = await chop(36, 2);
        console.log("without:", JSON.stringify(noIron), "with iron axe:", JSON.stringify(withIron));
        check("both trees of the same kind fall", noIron.swings < 14 && withIron.swings < 14 && noIron.name === withIron.name);
        check("the iron axe needs exactly one blow less", withIron.swings === noIron.swings - 1);
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
