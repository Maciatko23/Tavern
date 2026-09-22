// Three pieces of the "buildings" batch: (1) the cauldron is now forged at the forge as a carryable item and
// hung on the tripod from the backpack instead of paid for in raw materials on the spot; a forged one already
// hanging blocks forging a second; (2) a well now needs a 2x2 pit dug to the bottom (depth 3) under it, which
// also merges visually into one big pit; (3) an ordinary building only blocks its front row - the row(s)
// behind it, where the picture rises without anything actually built there, are open ground (the same idea
// as a tree's canopy over a walkable tile). Reuses one small 6x4 patch phase by phase to keep the area small.
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
        const clearBuildings = () => ev("$gameSystem._farm.buildings[3] = []; $gameSystem._farm.rev++; 0");

        // ---------------------------------------------------------------- a free 6x4 patch of natural ground
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            for (let by = 1; by < $gameMap.height() - 4; by++) for (let bx = 1; bx < $gameMap.width() - 6; bx++) {
                let ok = true;
                for (let y = by; y < by + 4 && ok; y++) for (let x = bx; x < bx + 6; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a 6x4 free patch", !!B, B);
        const { bx, by } = B;

        // ==================================================================================================
        // isSolidCell unit checks: ordinary buildings only block their front row (j=0); a house (def.door)
        // keeps its back rows solid; a yard's own ring/hut logic is untouched.
        // ==================================================================================================
        const solid = await J(`({
            ordinaryFront: Farming.isSolidCell({ w: 3, h: 2 }, 0, 0),
            ordinaryBack: Farming.isSolidCell({ w: 3, h: 2 }, 0, 1),
            singleTile: Farming.isSolidCell({ w: 1, h: 1 }, 0, 0),
            doorway: Farming.isSolidCell({ door: { dx: 1 }, w: 3, h: 2 }, 1, 0),
            doorFrontWall: Farming.isSolidCell({ door: { dx: 1 }, w: 3, h: 2 }, 0, 0),
            doorBackRowOpen: Farming.isSolidCell({ door: { dx: 1 }, w: 3, h: 2 }, 1, 1)
        })`);
        check("an ordinary building: front row solid, back row open", solid.ordinaryFront === true && solid.ordinaryBack === false, solid);
        check("a plain 1x1 building is unaffected (still solid)", solid.singleTile === true, solid);
        check("a house: front row solid but for its doorway, the rows behind (its roof) open just like any building", solid.doorway === false && solid.doorFrontWall === true && solid.doorBackRowOpen === false, solid);

        // ==================================================================================================
        // phase 1: a real kiln (w3 h2) - front row blocks movement, back row does not, both still count as
        // "the kiln is here" for placement purposes. Then clear it.
        // ==================================================================================================
        const kx = bx, ky = by + 3;   // front row ky, back row ky-1, cols kx..kx+2
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || []; L.push({ id: f.nextId++, type: "kiln", x: ${kx}, y: ${ky}, last: 1, v: 3 }); f.rev++; })()`);
        await frames(6);
        const pass = await J(`({ front: $gameMap.isPassable(${kx + 1}, ${ky}, 2), back: $gameMap.isPassable(${kx + 1}, ${ky - 1}, 2), stillIndexedFront: !!Farming.buildingAt(${kx + 1}, ${ky}), stillIndexedBack: !!Farming.buildingAt(${kx + 1}, ${ky - 1}) })`);
        check("the kiln's front row blocks movement, its back row does not, but both are still 'the kiln is here' for placement purposes",
            pass.front === false && pass.back === true && pass.stillIndexedFront && pass.stillIndexedBack, pass);
        await clearBuildings();

        // ==================================================================================================
        // phase 2: forge -> Kociołek (carryable, unique, alsoBuilt("cauldron")); tripod -> cauldron upgrade
        // now needs that item in the bag instead of raw materials, and consumes it.
        // ==================================================================================================
        const fx = bx, fy = by + 3;   // reuse the kiln's freed spot
        const tx = bx + 4, ty = by + 3;   // a lone tripod tile; upgrading it builds the cauldron at (tx-1..tx+1, ty/ty-1)
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || [];
            L.push({ id: f.nextId++, type: "forge", x: ${fx}, y: ${fy}, last: 1, v: 3 });
            L.push({ id: f.nextId++, type: "tripod", x: ${tx}, y: ${ty}, last: 1, v: 3 }); f.rev++; })()`);
        await frames(6);
        await ev("$gameParty.gainItem($dataItems[Farming.ITEM.iron], 3); $gameSystem.setStamina(200); 0");
        const forgeMenu = await J(`Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Wykuj kociołek")`);
        check("the forge offers 'Wykuj kociołek'", !!forgeMenu, forgeMenu);
        const madeCauldron = await ev(`Farming.craftManual(Farming.buildingAt(${fx}, ${fy}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "cauldron_item"))`);
        await frames(130);
        const afterForge = await J(`({ cauldronItems: $gameParty.numItems($dataItems[Farming.ITEM.cauldronItem]), iron: $gameParty.numItems($dataItems[Farming.ITEM.iron]) })`);
        check("forged: 3 iron -> a carryable Kociołek", madeCauldron === true && afterForge.cauldronItems === 1 && afterForge.iron === 0, afterForge);
        const secondAttempt = await ev(`Farming.craftManual(Farming.buildingAt(${fx}, ${fy}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "cauldron_item"))`);
        check("a second one is refused while you already have one", secondAttempt === false, secondAttempt);

        // prove the upgrade itself is refused without the item in the bag (a popup complains, per this project's
        // convention - missing tools/materials are always a popup, the menu entry itself is not greyed out)
        await ev(`$gameParty.loseItem($dataItems[Farming.ITEM.cauldronItem], 1, false); 0`);
        const upFailed = await ev(`Farming.upgradeBuilding(Farming.buildingAt(${tx}, ${ty}))`);
        check("upgrading is refused without the item", upFailed === false && (await ev(`Farming.buildingAt(${tx}, ${ty}).type`)) === "tripod");

        // forge a fresh one now that the bag is empty again, then attach it
        await ev("$gameParty.gainItem($dataItems[Farming.ITEM.iron], 3); 0");
        const remade = await ev(`Farming.craftManual(Farming.buildingAt(${fx}, ${fy}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "cauldron_item"))`);
        await frames(130);
        check("(setup) forged a Kociołek again, now that neither the bag nor a tripod holds one", remade === true && (await ev("$gameParty.numItems($dataItems[Farming.ITEM.cauldronItem])")) === 1);
        const upEntryReady = await J(`(function(){ const e = Farming.menuFor(${tx}, ${ty}).entries.find(e => e.name === "Zawieś kociołek"); return e ? { enabled: e.enabled, cost: e.help } : null; })()`);
        check("with one in the bag, 'Zawieś kociołek' is enabled and its cost is the item itself", !!upEntryReady && upEntryReady.enabled !== false && /Kociołek/.test(upEntryReady.cost), upEntryReady);
        const upOk = await ev(`Farming.upgradeBuilding(Farming.buildingAt(${tx}, ${ty}))`);
        await frames(60);
        const afterUpgrade = await J(`({ type: (Farming.buildingAt(${tx - 1}, ${ty}) || {}).type, cauldronItems: $gameParty.numItems($dataItems[Farming.ITEM.cauldronItem]) })`);
        check("attaching it: the tripod becomes a cauldron, the carried item is consumed", upOk === true && afterUpgrade.type === "cauldron" && afterUpgrade.cauldronItems === 0, afterUpgrade);
        const thirdAttempt = await ev(`Farming.craftManual(Farming.buildingAt(${fx}, ${fy}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "cauldron_item"))`);
        check("with one already hanging on the tripod, the forge still refuses to make another (alsoBuilt)", thirdAttempt === false, thirdAttempt);
        await clearBuildings();

        // ==================================================================================================
        // phase 3: the well - refused without a dug-out 2x2 pit at depth 3 under it, allowed once it is
        // there; the pit also merges visually into one big hole (four distinct quadrants, not four small ones)
        // ==================================================================================================
        const wx = bx, wy = by + 3;   // reuse the same spot again; the well is 2x2: front row wy cols wx..wx+1, back row wy-1
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.stone], 12); $gameParty.gainItem($dataItems[Farming.ITEM.planks], 3); $gameParty.gainItem($dataItems[Farming.ITEM.rope], 2); $gameParty.gainItem($dataItems[Farming.ITEM.bucket], 1); $gameParty.gainItem($dataItems[Farming.ITEM.shovel], 1); $gameSystem.setStamina(250); 0`);
        const whyBefore = await ev(`Farming.whyNotBuild("well", ${wx}, ${wy})`);
        check("without the pit, the well is refused with the new reason", /dół 2×2/.test(whyBefore || ""), whyBefore);
        const buildBefore = await ev(`Farming.build("well", ${wx}, ${wy})`);
        check("(and building it outright fails)", buildBefore === false);

        // dig a 2x2 to the bottom, inside the well's own footprint: columns wx,wx+1, rows wy and wy-1
        for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [1, -1]]) {
            for (let hit = 0; hit < 3; hit++) { await ev(`Farming.dig(${wx + dx}, ${wy + dy}); 0`); await frames(15); }
        }
        const dug = await J(`[[0,0],[1,0],[0,-1],[1,-1]].map(([dx,dy]) => (Farming.plotAt(${wx}+dx, ${wy}+dy) || {}).dug)`);
        check("(setup) all four tiles dug to depth 3", dug.every(d => d === 3), dug);
        const whyAfter = await ev(`Farming.whyNotBuild("well", ${wx}, ${wy})`);
        check("with the pit dug out, the well is no longer refused for that reason", whyAfter === null, whyAfter);
        const built = await ev(`Farming.build("well", ${wx}, ${wy})`);
        await frames(40);
        check("the well gets built", built === true && (await ev(`(Farming.buildingAt(${wx}, ${wy}) || {}).type`)) === "well");
        await clearBuildings();   // buildings gone; the plots (and their dug depth) stay, same as a real demolish would leave them

        // ==================================================================================================
        // phase 4: the same kind of 2x2 (now free of any building) merges into one big pit - four distinct
        // quadrants, not four separate small holes
        // ==================================================================================================
        const quads = await J(`(function(){
            const plots = Farming.farm().plots[3] || {};
            const covered = new Set();
            for (const bd of Farming.farm().buildings[3] || []) for (const c of Farming.cellsOfGeo(Farming.geoOf(bd), bd.x, bd.y)) covered.add(Farming.key(c.x, c.y));
            const dugK = Object.keys(plots).filter(k => !covered.has(k) && plots[k].dug === 3);
            const dugSet = new Set(dugK), consumed = new Set(), out = {};
            dugK.sort((a, c) => { const [ax, ay] = a.split(",").map(Number), [cx, cy] = c.split(",").map(Number); return ay - cy || ax - cx; });
            for (const k of dugK) {
                if (consumed.has(k)) continue;
                const [x, y] = k.split(",").map(Number);
                const corners = [k, Farming.key(x + 1, y), Farming.key(x, y + 1), Farming.key(x + 1, y + 1)];
                if (corners.every(kk => dugSet.has(kk) && !consumed.has(kk))) { ["tl", "tr", "bl", "br"].forEach((q, i) => out[corners[i]] = q); corners.forEach(kk => consumed.add(kk)); }
            }
            return out; })()`);
        const wanted = [`${wx},${wy - 1}`, `${wx + 1},${wy - 1}`, `${wx},${wy}`, `${wx + 1},${wy}`];
        check("the well's own 2x2 pit merges into one big pit (four distinct quadrants)",
            new Set(wanted.map(k => quads[k])).size === 4 && wanted.every(k => ["tl", "tr", "bl", "br"].includes(quads[k])), quads);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-6));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
