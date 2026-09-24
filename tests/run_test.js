// Running costs breath and strength; the walk is a little slower (FreeMovement walkSlowdown); walking to a clicked tile is walking.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); ConfigManager.alwaysDash = false; 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const keys = (on, ...ks) => ev(ks.map(k => `Input._currentState.${k} = ${on};`).join(" ") + " 0");
        // a free row of 16 tiles (no events) to run along
        const R = await J(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 6) && $gameMap.isPassable(x, y, 4) && $gameMap.isPassable(x, y, 2) && $gameMap.isPassable(x, y, 8) && $gameMap.eventsXy(x, y).length === 0 && !(Farming.buildingAt(x, y));
            for (let y = 3; y < $gameMap.height() - 3; y++) for (let x = 2; x < $gameMap.width() - 18; x++) {
                let ok = true;
                for (let i = 0; i < 16 && ok; i++) ok = free(x + i, y) && free(x + i, y - 1) && free(x + i, y + 1);
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found a free stretch to run along", !!R, R);
        await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); $gameMap.setDisplayPos(${R.x} - 4, ${R.y} - 7); window.__pops = []; const _p = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__pops.push(t); return _p.apply(this, arguments); }; 0`);
        await frames(20);
        const S = () => J(`({ x: $gamePlayer._realX, dash: $gamePlayer.isDashing(), speed: $gamePlayer.realMoveSpeed(), breath: Math.round(Combat.breath * 10) / 10, winded: Combat.winded, stamina: $gameSystem.stamina(), can: Combat.canRun() })`);

        // ---- the walk: a little slower than the engine's normal speed (4 -> 3.75: 84%)
        const s0 = await S();
        check("walking speed is 3.75 (the engine's normal 4, a little slower)", s0.speed === 3.75 && !s0.dash, s0);
        await keys(true, "right"); await frames(60); await keys(false, "right"); await frames(4);
        const w1 = await S();
        const walked = w1.x - s0.x;
        check("60 frames of walking: about 60 x 2^3.75/256 = 3.2 tiles, and no breath is used", Math.abs(walked - 60 * Math.pow(2, 3.75) / 256) < 0.35 && w1.breath === s0.breath, { walked, breath: w1.breath });

        // ---- running: fast, costs breath (and nothing comes back meanwhile)
        await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); 0`); await frames(4);
        const r0 = await S();
        await keys(true, "shift", "right"); await frames(60);
        const r1 = await S();
        await keys(false, "shift", "right"); await frames(4);
        const ran = r1.x - r0.x;
        check("Shift: running - twice the engine's speed (5), more than 2x the walk", r1.dash && r1.speed === 5 && ran > walked * 2, { ran, walked, r1 });
        check("running takes breath: 60 frames = about 15 of it", r0.breath - r1.breath >= 13 && r0.breath - r1.breath <= 16, { before: r0.breath, after: r1.breath });
        await frames(160);
        check("stopped: the breath comes back in a moment", (await S()).breath === r0.breath);

        // ---- strength: 1 for every 3 s of running (there and back along the stretch)
        await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); $gameSystem.setStamina(100); 0`); await frames(4);
        await keys(true, "shift", "right"); await frames(95); await keys(false, "right"); await keys(true, "left"); await frames(95); await keys(false, "shift", "left"); await frames(4);
        const st = await S();
        check("about 3 s of running cost 1 point of strength", st.stamina === 99, st);

        // ---- out of breath: winded - no running, a slower walk for a moment, "Brak tchu!"
        await frames(160);
        await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); Combat.spendBreath(Combat.breath - 5); window.__pops = []; 0`); await frames(4);
        await keys(true, "shift", "right"); await frames(40);
        const wd = await S();
        await keys(false, "shift", "right"); await frames(4);
        check("the breath runs out while running: winded, no running any more, walking slower (2.75)", wd.winded && !wd.dash && wd.speed === 2.75 && !wd.can, wd);
        check("...'Brak tchu!' over the player", (await J("window.__pops")).includes("Brak tchu!"), await J("window.__pops"));
        for (let i = 0; i < 40 && (await S()).winded; i++) await frames(10);
        check("after a breather he can run again", !(await S()).winded && (await S()).can);

        // ---- no strength: no running, and a popup says why
        await frames(150);
        await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); $gameSystem.setStamina(0); window.__pops = []; 0`); await frames(4);
        await keys(true, "shift", "right"); await frames(30);
        const tired = await S();
        await keys(false, "shift", "right"); await frames(4);
        check("with no strength left Shift does not run (he walks - tired out, at half the speed)", !tired.dash && tired.speed === 2.75 && !tired.can, tired);
        check("...'Jesteś zbyt zmęczony, żeby biec' over the player", (await J("window.__pops")).includes("Jesteś zbyt zmęczony, żeby biec"), await J("window.__pops"));
        await ev("$gameSystem.setStamina(100); 0");

        // ---- walking to a clicked tile (or to a building spot) is walking, not running
        await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y}); $gameTemp.setDestination(${R.x + 8}, ${R.y}); 0`); await frames(20);
        const dest = await S();
        check("walking to a clicked tile does not run (walking speed)", !dest.dash && dest.speed === 3.75 && dest.x > R.x + 1.3, dest);
        await ev("$gameTemp.clearDestination(); 0");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    await ev("['shift','right','left'].forEach(k => Input._currentState[k] = false); 0").catch(() => 0);
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
