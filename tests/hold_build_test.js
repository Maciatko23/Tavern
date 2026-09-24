// Held O on a building site keeps striking (Farming.strikeSite + holdingOn); letting go stops it; Zręczność makes the hammer quicker
// (Combat.workSpeed: the swing's rate and the pause between blows).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const B = await J(`(function(){
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!Farming.naturalFarmland(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found an open meadow", !!B, B);
        const { bx, by } = B, sx = bx + 4, sy = by + 3;
        await ev(`$gameParty.gainItem($dataItems[89], 1); for (const [id, n] of Farming.BUILDINGS.workbench.cost) $gameParty.gainItem($dataItems[id], n); $gamePlayer.locate(${sx}, ${sy + 1}); $gamePlayer.setDirection(8); $gameSystem.setStamina(100); 0`);
        check("a workbench site (30 blows)", await ev(`Farming.placeSite("workbench", ${sx}, ${sy})`) === true && (await ev(`Farming.buildingAt(${sx}, ${sy}).site.need`)) === 30);
        await ev(`Farming.buildingAt(${sx}, ${sy}).site.done = 1; 0`);   // (begun: every press is a blow)
        await frames(10);
        const done = () => ev(`Farming.buildingAt(${sx}, ${sy}).site ? Farming.buildingAt(${sx}, ${sy}).site.done : -1`);

        // ---- held O: blow after blow
        const d0 = await done();
        await ev("Input._currentState.ok = true; 0");
        const f0 = await ev("Graphics.frameCount");
        await frames(200);
        const d1 = await done(), f1 = await ev("Graphics.frameCount");
        await ev("Input._currentState.ok = false; 0");
        await frames(60);
        const d2 = await done();
        const perBlow = (f1 - f0) / Math.max(1, d1 - d0);
        check("held O keeps striking: several blows without letting go", d1 - d0 >= 4, { d0, d1, perBlow: Math.round(perBlow) });
        check("let go: it stops (at most the blow already swinging lands)", d2 - d1 <= 1, { d1, d2 });
        await frames(40);
        const d3 = await done();
        check("...and nothing more after that", d3 === d2, { d2, d3 });

        // ---- Zręczność 45: quicker
        await ev("Combat.hero().attr.dex = 45; $gameSystem.setStamina(100); 0");
        const e0 = await done();
        await ev("Input._currentState.ok = true; 0");
        const g0 = await ev("Graphics.frameCount");
        await frames(200);
        const e1 = await done(), g1 = await ev("Graphics.frameCount");
        await ev("Input._currentState.ok = false; 0");
        await frames(60);
        const perBlowDex = (g1 - g0) / Math.max(1, e1 - e0);
        check("Zręczność 45 (+40% work speed): a blow comes clearly sooner", perBlowDex < perBlow * 0.8 && (await ev("Combat.workSpeed()")) === 1.4, { perBlow: Math.round(perBlow), perBlowDex: Math.round(perBlowDex), speed: await ev("Combat.workSpeed()") });

        // ---- out of strength: it stops by itself
        await ev("$gameSystem.setStamina(3); 0");
        const s0 = await done();
        await ev("Input._currentState.ok = true; 0");
        await frames(160);
        await ev("Input._currentState.ok = false; 0");
        await frames(40);
        const s1 = await done();
        check("tired out: after the blows the strength allowed, it stops (a popup says why)", s1 - s0 === 1, { s0, s1, stamina: await ev("$gameSystem.stamina()") });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    await ev("Input._currentState.ok = false; 0").catch(() => 0);
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
