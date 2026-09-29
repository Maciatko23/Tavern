// Does the iron pickaxe (item 116) save a blow on rocks? Compares the number of presses with and without it.
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
        await ev("$gameParty.gainItem($dataItems[63], 1); 0");   // the stone pickaxe: needed for every rock

        // stand next to the rock on any free side, facing it, then press OK until the hit counter resets
        const mine = async eid => {
            const spot = await ev(`(function(){
                const e = $gameMap.event(${eid});
                for (const [d, dx, dy] of [[8, 0, 1], [2, 0, -1], [4, 1, 0], [6, -1, 0]]) {   // stand at (x+dx, y+dy) and face d
                    const nx = e.x + dx, ny = e.y + dy;
                    if (!$gameMap.isValid(nx, ny)) continue;
                    if ($gameMap.eventsXy(nx, ny).some(o => !o.isThrough() && o.isNormalPriority())) continue;
                    if (!$gameMap.isPassable(nx, ny, d) && !$gameMap.isPassable(nx, ny, 10 - d)) continue;
                    return { nx, ny, d, name: e.event().name, g: e.event().pages[0].image.characterName };
                }
                return null; })()`);
            if (!spot) return { error: "no free side" };
            await ev(`$gameSystem.setStamina(100); $gamePlayer.locate(${spot.nx}, ${spot.ny}); $gamePlayer.setDirection(${spot.d}); $gameMap.setDisplayPos(${spot.nx} - 13, ${spot.ny} - 7); 0`);
            await frames(6);
            let presses = 0; const series = [];
            for (let i = 0; i < 40; i++) {
                // wait until the player can act again, then start the event exactly like the action button does
                await ev(`new Promise(res => { const iv = setInterval(() => { const e = $gameMap.event(${eid}); if (!$gameMap.isEventRunning() && !e.isTreeAnimating() && !$gamePlayer.isToolSwinging() && $gamePlayer.canMove()) { clearInterval(iv); res(); } }, 8); })`);
                await ev("$gameSystem.setStamina(100); 0");
                const hitsBefore = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                await ev(`$gameMap.event(${eid}).start(); 0`);
                presses++;
                // wait for the blow to land (the counter changes, or the vein is broken)
                await ev(`new Promise(res => { let n = 0; const iv = setInterval(() => { const e = $gameMap.event(${eid}); n++; if ((e._treeHits || 0) !== ${hitsBefore} || e._breakT >= 0 || n > 400) { clearInterval(iv); res(); } }, 8); })`);
                const hits = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                series.push(hits);
                if (hits === 0) break;
            }
            const broke = await ev(`$gameMap.event(${eid})._breakT >= 0 || $gameSelfSwitches.value([3, ${eid}, "A"])`);
            return { g: spot.g, presses, broke, series, at: [spot.nx, spot.ny, spot.d] };
        };
        const free = async ids => ev(`(function(){ return ${JSON.stringify(ids)}.filter(id => { const e = $gameMap.event(id);
            return [[8, 0, 1], [2, 0, -1], [4, 1, 0], [6, -1, 0]].some(([d, dx, dy]) => { const nx = e.x + dx, ny = e.y + dy;
                return $gameMap.isValid(nx, ny) && !$gameMap.eventsXy(nx, ny).some(o => !o.isThrough() && o.isNormalPriority()) && ($gameMap.isPassable(nx, ny, d) || $gameMap.isPassable(nx, ny, 10 - d)); }); }); })()`);
        const ores = await free([45, 46, 47, 48, 49, 50, 51, 57, 59, 141, 142]);
        const mounds = await free([79, 80, 81]);
        console.log("free ore veins:", JSON.stringify(ores), "free mounds:", JSON.stringify(mounds));
        const stone = await mine(ores[0]);
        await ev("$gameParty.gainItem($dataItems[116], 1); 0");
        const iron = await mine(ores[1]);
        console.log("ore vein:   stone pickaxe", JSON.stringify(stone), "| + iron pickaxe", JSON.stringify(iron));
        await ev("$gameParty.loseItem($dataItems[116], 1); 0");
        // (more rocks were placed around the mounds on Map003: only one of the three still has a free side. Then the same
        // mound is put back after the first run - self-switch A off, its picture again - and mined once more with the iron pickaxe)
        const restore = async eid => {
            await ev(`(function(){ const e = $gameMap.event(${eid}); e._treeHits = 0; e._breakT = -1; $gameSelfSwitches.setValue([3, ${eid}, "A"], false); return 0; })()`);
            await frames(8);
            return ev(`(function(){ const e = $gameMap.event(${eid}); return e._pageIndex === 0 && !!e.characterName() && e.opacity() === 255; })()`);
        };
        const stone2 = mounds.length ? await mine(mounds[0]) : { presses: 0 };
        await ev("$gameParty.gainItem($dataItems[116], 1); 0");
        const second = mounds.length > 1 ? mounds[1] : mounds.length && (await restore(mounds[0])) ? mounds[0] : 0;
        if (mounds.length < 2) console.log("one free mound: mined again after putting it back", JSON.stringify({ id: second }));
        const iron2 = second ? await mine(second) : { presses: 0 };
        console.log("mound:      stone pickaxe", JSON.stringify(stone2), "| + iron pickaxe", JSON.stringify(iron2));
        check("ore veins: the iron pickaxe needs a third fewer blows (x0.65)", stone.broke && iron.broke && iron.presses === Math.max(1, Math.round(stone.presses * 0.65)), { stone: stone.presses, iron: iron.presses });
        check("mounds: the iron pickaxe needs a third fewer blows (x0.65)", stone2.broke && iron2.broke && iron2.presses === Math.max(1, Math.round(stone2.presses * 0.65)), { stone: stone2.presses, iron: iron2.presses });
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
