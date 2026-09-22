// The Huta: a brick furnace (2x2) that smelts iron + charcoal into steel, needing iron tongs forged at
// the kuźnia first. Also checks the forge now offers "Wykuj szczypce".
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            for (let by = 2; by < $gameMap.height() - 5; by++) for (let bx = 2; bx < $gameMap.width() - 7; bx++) {
                let ok = true;
                for (let y = by; y < by + 3 && ok; y++) for (let x = bx; x < bx + 5; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) {
                    const plots = ($gameSystem._farm.plots[$gameMap.mapId()] = $gameSystem._farm.plots[$gameMap.mapId()] || {});
                    for (let y = by; y < by + 3; y++) for (let x = bx; x < bx + 5; x++) if (!plots[x + "," + y]) plots[x + "," + y] = { s: "cleared" };
                    $gameSystem._farm.rev++;
                    return { bx, by };
                }
            }
            return null; })()`);
        check("found a free patch", !!B, B);
        const { bx, by } = B;
        const gx = bx, gy = by + 2;   // the huta: 2x2, cols bx..bx+1, rows by+1..by+2

        // ---------------------------------------------------------------- data
        const def = await J(`(function(){ const h = Farming.BUILDINGS.huta, f = Farming.BUILDINGS.forge; return {
            hCost: h.cost, hSize: [h.w, h.h], hImage: h.image, hRecipes: h.recipes.map(r => ({ id: r.id, tool: r.tool, inputs: r.inputs, out: r.output })),
            forgeRecipes: f.recipes.map(r => r.id) }; })()`);
        const tongsId = await ev("Farming.ITEM.tongs");
        check("Huta exists: a 2x2 brick building with a 'steel' recipe needing iron tongs", def.hSize[0] === 2 && def.hSize[1] === 2 && def.hImage === "Farm_Huta_L" && def.hRecipes.some(r => r.id === "steel" && r.tool === tongsId), def);
        check("the forge offers 'Wykuj szczypce'", def.forgeRecipes.includes("tongs"), def.forgeRecipes);

        // ---------------------------------------------------------------- build the huta, try to smelt without tongs
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.brick], 10); $gameParty.gainItem($dataItems[Farming.ITEM.stone], 6); $gameParty.gainItem($dataItems[Farming.ITEM.hammer], 1); $gameSystem.setStamina(250); 0`);
        await ev(`$gamePlayer.locate(${bx + 2}, ${by}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${bx} - 4, ${by} - 3); 0`);
        await frames(10);
        const built = await ev(`Farming.build("huta", ${gx}, ${gy})`);
        await frames(30);
        check("the huta gets built", built === true && (await ev(`(Farming.buildingAt(${gx}, ${gy}) || {}).type`)) === "huta");
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.iron], 4); $gameParty.gainItem($dataItems[Farming.ITEM.charcoal], 4); 0`);
        const noTongs = await ev(`Farming.startJob(Farming.buildingAt(${gx}, ${gy}), "steel")`);
        check("without tongs, smelting steel is refused", noTongs === false, noTongs);
        const ironBefore = await ev(`$gameParty.numItems($dataItems[Farming.ITEM.iron])`);
        check("(and nothing was spent)", ironBefore === 4, ironBefore);

        // ---------------------------------------------------------------- forge the tongs, then smelt
        const fx = bx + 2, fy = by + 2;   // the forge: 3x2, cols bx+2..bx+4, rows by+1..by+2 - clear of the huta
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || []; L.push({ id: f.nextId++, type: "forge", x: ${fx}, y: ${fy}, last: 1, v: 3 }); f.rev++; })()`);
        await frames(6);
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.iron], 2); $gameParty.gainItem($dataItems[Farming.ITEM.wood], 1); 0`);
        const forged = await ev(`Farming.craftManual(Farming.buildingAt(${fx}, ${fy}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "tongs"))`);
        await frames(130);
        check("forged the tongs: 2 iron + 1 wood -> Żelazne szczypce", forged === true && (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.tongs])`)) === 1);
        const started = await ev(`Farming.startJob(Farming.buildingAt(${gx}, ${gy}), "steel")`);
        await frames(30);
        check("with tongs in hand, smelting starts", started === true && (await ev(`!!Farming.buildingAt(${gx}, ${gy}).job`)));
        check("2 iron and 2 charcoal were spent, the tongs stay in the bag (a tool, not consumed)",
            (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.iron])`)) === 2 && (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.charcoal])`)) === 2 && (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.tongs])`)) === 1);
        await ev(`$gameSystem.advanceDayNight(7); 0`);
        await frames(10);
        check("ready after the recipe's hours", await ev(`Farming.jobReady(Farming.buildingAt(${gx}, ${gy}))`));
        await ev(`Farming.collectJob(Farming.buildingAt(${gx}, ${gy})); 0`);
        await frames(20);
        check("collected: 1 steel in the bag", (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.steel])`)) === 1);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
