// The forest floor (Farming.js + Forestry.js): pine cones under the pines, wild herbs by season, what is made of them by hand,
// planting a pine from seed, the young tree growing day by day, coming back with the map, and going for good once dug out.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Birds) Birds.auto(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        await ev("window.__popups = []; const _pp = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__popups.push(t); return _pp.apply(this, arguments); }; 0");

        // ================= 1. the new things =================
        const items = await J("[147,148,149,150,151,152,153,154].map(id => ({ id, name: $dataItems[id] && $dataItems[id].name, icon: $dataItems[id] && $dataItems[id].iconIndex }))");
        check("items 147-154: Szyszki, Nasiona sosny, Pokrzywa, Krwawnik, Dziki czosnek, Opatrunek, Zupa pokrzywowa, Oszczep with icons 409-416",
            items.map(i => i.name).join() === "Szyszki,Nasiona sosny,Pokrzywa,Krwawnik,Dziki czosnek,Opatrunek,Zupa pokrzywowa,Oszczep" && items.every((i, k) => i.icon === 409 + k), items);
        const iconsDrawn = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); const out = []; for (let i = 409; i <= 416; i++) { let n = 0; const d = bmp.context.getImageData((i % 16) * 32, Math.floor(i / 16) * 32, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; out.push(n); } res(out); }; chk(); })`);
        check("the 8 new icons are drawn in the IconSet", iconsDrawn.every(n => n > 60), iconsDrawn);
        const recipes = await J(`({ hand: Farming.HAND_RECIPES.map(r => r.id), bench: Farming.BUILDINGS.workbench.recipes.map(r => r.id), pot: Farming.BUILDINGS.cauldron.recipes.map(r => r.id) })`);
        check("by hand: pine seeds, a bandage, nettle fibre; the workbench makes the spear; the cauldron cooks nettle soup",
            ["pine_seeds", "bandage", "nettle_fiber"].every(id => recipes.hand.includes(id)) && recipes.bench.includes("spear") && recipes.pot.includes("nettle_soup"), recipes);

        // ================= 2. cones under the pines, herbs by season =================
        const cones = await J(`(function(){
            const pines = $gameMap.events().filter(e => ChoppableTree.isPine(e) && ChoppableTree.isTree(e) && !$gameSelfSwitches.value([3, e.eventId(), "A"]));
            let near = 0, far = 0;
            for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) {
                if (Farming.gatherKindOf(x, y) !== "cone") continue;
                if (pines.some(p => Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 2)) near++; else far++;
            }
            return { pines: pines.length, near, far }; })()`);
        check("cones lie only within 2 tiles of a standing pine (and there are some)", cones.pines > 0 && cones.near > 0 && cones.far === 0, cones);
        const herbCount = () => J(`(function(){ const n = { nettle: 0, yarrow: 0, garlic: 0, cone: 0 }; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { const k = Farming.gatherAt(x, y); if (k in n) n[k]++; } return n; })()`);
        await ev("$gameSystem._dayNightDay = 5; 0");   // spring
        await frames(10);
        const spring = await herbCount();
        check("spring: nettles and wild garlic grow, yarrow not yet; cones lie on the ground", spring.nettle > 0 && spring.garlic > 0 && spring.yarrow === 0 && spring.cone > 0, spring);
        await ev("$gameSystem._dayNightDay = 35; 0");   // summer
        await frames(10);
        const summer = await herbCount();
        check("summer: yarrow is out as well", summer.yarrow > 0 && summer.nettle > 0, summer);

        // picking a nettle stings (one strength more, a word about it)
        const nettle = await J(`(function(){ for (let y = 2; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 2; x++) if (Farming.gatherAt(x, y) === "nettle" && $gameMap.isPassable(x, y + 1, 8) && !$gameMap.eventsXy(x, y + 1).length) return { x, y }; return null; })()`);
        check("found a nettle to pick", !!nettle, nettle);
        await ev(`$gamePlayer.locate(${nettle.x}, ${nettle.y + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${nettle.x} - 13, ${nettle.y} - 7); $gameSystem.setStamina(100); window.__popups.length = 0; 0`);
        const n0 = await count(149);
        await ev(`Farming.pickGather(${nettle.x}, ${nettle.y})`);
        await frames(90);
        const picked = await J(`({ n: $gameParty.numItems($dataItems[149]), st: Math.round($gameSystem.stamina()), pops: window.__popups.slice() })`);
        check("a nettle gives 2-3 leaves, costs 2 strength (1 more than other plants) and stings", picked.n - n0 >= 2 && picked.n - n0 <= 3 && picked.st === 98 && picked.pops.some(t => /parzy/.test(t)), picked);

        // ================= 3. made by hand =================
        const hand = id => `Farming.HAND_RECIPES.find(r => r.id === "${id}")`;
        await give(147, 2);
        const s0 = await count(148);
        check("two cones are shelled into pine seeds", await ev(`Farming.craftManual(null, ${hand("pine_seeds")})`));
        await frames(120);
        check("  +3 pine seeds, the cones used up", (await count(148)) === s0 + 3 && (await count(147)) === 0, { seeds: await count(148), cones: await count(147) });
        await give(150, 2); await give(92, 1);
        check("yarrow and flax make a bandage", await ev(`Farming.craftManual(null, ${hand("bandage")})`));
        await frames(120);
        check("  +1 bandage", (await count(152)) === 1);
        const f0 = await count(92);
        await give(149, 3);
        check("nettle stalks give fibre", await ev(`Farming.craftManual(null, ${hand("nettle_fiber")})`));
        await frames(120);
        check("  +2 fibre", (await count(92)) === f0 + 2);

        // ================= 4. planting =================
        await ev("$gameSystem._dayNightDay = 40; $gameSystem.setStamina(100); 0");
        const spot = await J(`(function(){ for (let y = 4; y < $gameMap.height() - 4; y++) for (let x = 4; x < $gameMap.width() - 4; x++) {
            if (Forestry.whyNot(x, y) || Farming.gatherAt(x, y)) continue;
            if (!$gameMap.isPassable(x, y + 1, 8) || $gameMap.eventsXy(x, y + 1).length || Farming.buildingAt(x, y + 1)) continue;
            return { x, y }; } return null; })()`);
        check("found a free patch of ground for a tree", !!spot, spot);
        const { x: tx, y: ty } = spot;
        await ev(`$gamePlayer.locate(${tx}, ${ty + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${tx} - 13, ${ty} - 7); 0`);
        const seeds = await count(148);
        await ev(`$gameParty.loseItem($dataItems[148], ${seeds}, false); 0`);
        const noSeeds = await J(`Farming.menuFor(${tx}, ${ty}).entries.map(e => e.name)`);
        check("without seeds the ground menu has no 'Posadź sosnę' (and keeps its order)", !noSeeds.includes("Posadź sosnę") && noSeeds[noSeeds.length - 1] === "Postaw...", noSeeds);
        await give(148, 3);
        const withSeeds = await J(`Farming.menuFor(${tx}, ${ty}).entries.map(e => ({ name: e.name, enabled: e.enabled !== false }))`);
        const plantRow = withSeeds.find(e => e.name === "Posadź sosnę");
        check("with seeds 'Posadź sosnę' is there, enabled, just before 'Postaw...'", !!plantRow && plantRow.enabled && withSeeds[withSeeds.length - 2].name === "Posadź sosnę", withSeeds);
        await ev(`Farming.menuFor(${tx}, ${ty}).entries.find(e => e.name === "Posadź sosnę").run(); 0`);
        await frames(90);
        const tree = await J(`(function(){ const e = $gameMap.eventsXy(${tx}, ${ty})[0]; if (!e) return null; const c = ChoppableTree.treeConfig(e); return { id: e.eventId(), tree: ChoppableTree.isTree(e), pic: e.characterName(), scale: c.scale, hits: c.hits, blocks: e.isNormalPriority(), growth: e._plantedGrowth }; })()`);
        check("a seedling now stands there: a tree event numbered from 1000 showing a heap of earth with a seedling (!$Sapling), 1 blow, no stump", !!tree && tree.id >= 1000 && tree.tree && tree.pic === "!$Sapling" && tree.scale === 1 && tree.hits === 1 && tree.blocks, tree);
        check("one seed used, the plant recorded in the save", (await count(148)) === 2 && (await ev("Forestry.treesOf(3).length")) === 1);
        const shown = await ev(`SceneManager._scene._spriteset._characterSprites.some(s => s._character === $gameMap.eventsXy(${tx}, ${ty})[0])`);
        check("it is drawn at once (a character sprite in the tilemap)", shown);
        const near = await ev(`Forestry.whyNot(${tx + 1}, ${ty})`);
        check("the next tile is refused: too close to another tree", /Za blisko/.test(near || ""), near);

        // ================= 5. growing: a little bigger every day for 10 days =================
        const look = () => J(`(function(){ const e = $gameMap.eventsXy(${tx}, ${ty})[0], c = ChoppableTree.treeConfig(e); return { pic: e.characterName(), data: e.event().pages[0].image.characterName, scale: c.scale, hits: c.hits, drop: c.drop, nostump: c.nostump, dropmin: c.dropmin, dropmax: c.dropmax, growth: e._plantedGrowth }; })()`);
        const toMap = async () => { for (let i = 0; i < 40; i++) { if (await ev("SceneManager._scene.constructor.name === 'Scene_Map' && !SceneManager.isSceneChanging()").catch(() => false)) break; await sleep(150); } };
        check("growDays is 10", (await ev("Forestry.GROW_DAYS")) === 10);
        const days = [await look()];
        // the first day passes with a night's sleep: the day summary is a scene of its own, the map's data is loaded again after it
        // while the tree on the map stays (the tree once kept its seedling picture for good this way)
        await ev("$gameSystem.setDayNightHour(22); $gameSystem.sleepUntilHour(7); 0");
        for (let i = 0; i < 60; i++) { if ((await ev("SceneManager._scene.constructor.name")) === "Scene_DaySummary") break; await frames(5); }
        const summary = await ev("SceneManager._scene.constructor.name");
        await ev("if (SceneManager._scene instanceof Journal.Scene_DaySummary) SceneManager._scene.popScene(); 0");
        await toMap();
        await frames(75);
        days.push(await look());
        check("after a night's sleep (through the day summary) the tree on the map shows the next picture, not only its data", summary === "Scene_DaySummary" && days[1].pic === "!$Sapling_2" && days[1].data === "!$Sapling_2", { summary, day1: days[1] });
        for (let d = 2; d <= 10; d++) {
            await ev("$gameSystem._dayNightDay += 1; 0");
            if (d % 3 === 0) { await ev("SceneManager.push(Scene_Menu); 0"); await frames(20); await ev("SceneManager._scene.popScene(); 0"); await toMap(); }   // (and a menu now and then)
            await frames(75);
            days.push(await look());
        }
        const want = [["!$Sapling", 1], ["!$Sapling_2", 1], ["!$Sapling_3", 1], ["Pine", 0.24], ["Pine", 0.32], ["Pine", 0.41], ["Pine", 0.51], ["Pine", 0.62], ["Pine", 0.74], ["Pine", 0.87], ["Pine", 1]];
        const got = days.map(t => [t.pic, t.scale]);
        check("days 0-9 after planting: ten pictures, each a little bigger (3 seedlings on the mound, then a pine 0.24 -> 0.87); day 10 a full pine",
            got.every((g, i) => (want[i][0] === "Pine" ? /Pine/.test(g[0]) : g[0] === want[i][0]) && g[1] === want[i][1]), got);
        check("the seedlings on the mound: one blow gives a branch, no stump", days.slice(0, 3).every(t => t.hits === 1 && t.drop === 77 && t.nostump === 1), days.slice(0, 3));
        check("5 days after planting: a small pine, half grown (2 blows, wood, a stump)", days[5].hits === 2 && days[5].drop === 61 && days[5].nostump === 0, days[5]);
        const full = days[10];
        check("10 days after planting: a full pine (scale 1, 4 blows, 2-4 wood)", full.scale === 1 && full.hits === 4 && full.dropmin === 2 && full.dropmax === 4 && full.growth === 1, full);
        await b.shot(OUT + "forest_grown.png");

        // ================= 6. with the map: it comes back, and once dug out it is gone =================
        await ev(`$gamePlayer.requestMapReload(); $gamePlayer.reserveTransfer(3, ${tx}, ${ty + 1}, 8, 2); 0`);
        await frames(90);
        for (let i = 0; i < 40; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()").catch(() => false)) break; await sleep(250); }
        await frames(30);
        const back = await J(`(function(){ const e = $gameMap.eventsXy(${tx}, ${ty})[0]; return e ? { id: e.eventId(), scale: ChoppableTree.treeConfig(e).scale, data: !!$dataMap.events[e.eventId()] } : null; })()`);
        check("the map loaded again: the planted pine is there, full size, its data put back into the map", !!back && back.id >= 1000 && back.scale === 1 && back.data, back);
        const id = back.id;
        await ev(`$gameSelfSwitches.setValue([3, ${id}, "A"], true); $gameSelfSwitches.setValue([3, ${id}, "B"], true); 0`);   // felled and the stump dug out
        // a menu opened and closed in between reloads the map's data but keeps its events: the gone tree must keep its data
        // until the map is really set up again (it once broke the minimap: "Cannot read property 'note' of null")
        await ev("SceneManager.push(Scene_Menu); 0");
        for (let i = 0; i < 40; i++) { if (await ev("SceneManager._scene.constructor.name === 'Scene_Menu' && !SceneManager.isSceneChanging()").catch(() => false)) break; await sleep(150); }
        await ev("SceneManager._scene.popScene(); 0");
        for (let i = 0; i < 40; i++) { if (await ev("SceneManager._scene.constructor.name === 'Scene_Map' && !SceneManager.isSceneChanging()").catch(() => false)) break; await sleep(150); }
        await frames(40);
        const kept = await J(`({ scene: SceneManager._scene.constructor.name, err: !!(Graphics._errorPrinter && Graphics._errorPrinter.innerText), data: !!$dataMap.events[${id}], ev: !!$gameMap.event(${id}) })`);
        check("a menu opened and closed with the felled tree still on the map: no error, its data is still there", kept.scene === "Scene_Map" && !kept.err && kept.data && kept.ev, kept);
        await ev(`$gamePlayer.requestMapReload(); $gamePlayer.reserveTransfer(3, ${tx}, ${ty + 1}, 8, 2); 0`);
        await frames(90);
        for (let i = 0; i < 40; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()").catch(() => false)) break; await sleep(250); }
        await frames(30);
        const gone = await J(`({ rec: Forestry.treesOf(3).length, ev: $gameMap.eventsXy(${tx}, ${ty}).length, sw: $gameSelfSwitches.value([3, ${id}, "B"]), free: Forestry.whyNot(${tx}, ${ty}) })`);
        check("felled and dug out: the record and the switches are dropped, the place is free to plant again", gone.rec === 0 && gone.ev === 0 && !gone.sw && gone.free === null, gone);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
