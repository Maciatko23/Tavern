// From the forge to the rock: forge the iron pickaxe, then mine an ore vein; the first blow announces what it saves.
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
        const idle = eid => ev(`new Promise(res => { const iv = setInterval(() => { const e = $gameMap.event(${eid}); if (!$gameMap.isEventRunning() && !e.isTreeAnimating() && !$gamePlayer.isToolSwinging() && $gamePlayer.canMove()) { clearInterval(iv); res(); } }, 8); })`);

        // a forge on the meadow, materials for the pickaxe
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; const L = f.buildings[3] = f.buildings[3] || [];
            L.push({ id: f.nextId++, type: "forge", x: 20, y: 15, last: 1 }); P["20,15"] = { s: "cleared" }; P["21,15"] = { s: "cleared" };
            L.push({ id: f.nextId++, type: "workbench", x: 23, y: 15, last: 1 }); P["23,15"] = { s: "cleared" }; P["24,15"] = { s: "cleared" }; f.rev++; })()`);
        await frames(6);
        await ev("$gameParty.gainItem($dataItems[86], 3); $gameParty.gainItem($dataItems[80], 1); $gameSystem.setStamina(100); 0");
        const fmenu = await ev("JSON.stringify(Farming.menuFor(20, 15).entries.filter(e => /kilofa|siekiery/.test(e.name)).map(e => [e.name, e.enabled !== false, e.help]))");
        console.log("forge entries:", fmenu);
        check("the forge offers the pick head (Grot kilofa) and the axe head", /Wykuj grot kilofa/.test(fmenu) && /Wykuj głowicę siekiery/.test(fmenu));
        const okHead = await ev("Farming.craftManual(Farming.buildingAt(20, 15), Farming.BUILDINGS.forge.recipes.find(r => r.id === 'head_pick'))");
        await frames(130);
        check("forged: 3 iron -> Grot kilofa", okHead === true && (await ev("$gameParty.numItems($dataItems[120])")) === 1 && (await ev("$gameParty.numItems($dataItems[86])")) === 0);
        const menu = await ev("JSON.stringify(Farming.menuFor(23, 15).entries.filter(e => /kilof|siekier/.test(e.name)).map(e => [e.name, e.enabled !== false, e.help]))");
        console.log("workbench entries:", menu);
        check("the workbench offers the iron pickaxe with a clear description", /Zmontuj żelazny kilof/.test(menu) && /Zastępuje kamienny kilof/.test(await ev("Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'pick_iron').desc")));
        const ok = await ev("Farming.craftManual(Farming.buildingAt(23, 15), Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'pick_iron'))");
        await frames(130);
        check("mounted: pick head + 1 plank -> Żelazny kilof", ok === true && (await ev("$gameParty.numItems($dataItems[116])")) === 1 && (await ev("$gameParty.numItems($dataItems[120])")) === 0 && (await ev("$gameParty.numItems($dataItems[80])")) === 0);
        check("the stone pickaxe is not needed (none in the bag)", (await ev("$gameParty.numItems($dataItems[63])")) === 0);

        // mine a vein, recording the popups
        await ev("window.__popups = []; const _p = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__popups.push(t); return _p.apply(this, arguments); }; 0");
        await ev("$gameSystem.setStamina(100); $gamePlayer.locate(33, 18); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(33 - 13, 18 - 7); 0");
        await frames(6);
        const series = [];
        for (let i = 0; i < 8; i++) {
            await idle(45);
            await ev("$gameSystem.setStamina(100); 0");
            const before = await ev("$gameMap.event(45)._treeHits || 0");
            await ev("$gameMap.event(45).start(); 0");
            await ev(`new Promise(res => { let n = 0; const iv = setInterval(() => { const e = $gameMap.event(45); n++; if ((e._treeHits || 0) !== ${before} || e._breakT >= 0 || n > 300) { clearInterval(iv); res(); } }, 8); })`);
            const hits = await ev("$gameMap.event(45)._treeHits || 0");
            series.push(hits);
            if (hits === 0) break;
        }
        const popups = await ev("window.__popups.filter(t => /kilof/i.test(t))");
        console.log("blows:", JSON.stringify(series), "popups:", JSON.stringify(popups));
        check("3 blows break a vein (4 without the iron pickaxe)", series.length === 3 && series[2] === 0, series);
        check("the first blow announces it, once", popups.length === 1 && /Żelazny kilof: 3 uderzenia zamiast 4/.test(popups[0]), popups);
        const gained = await ev("$gameParty.numItems($dataItems[85])");
        await frames(90);
        check("the ore drops as usual", (await ev("$gameParty.numItems($dataItems[85])")) >= 1, { ore: await ev("$gameParty.numItems($dataItems[85])") });
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
