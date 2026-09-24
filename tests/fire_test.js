// The plain campfire: animated flames, steady smoke, a bigger glow; and its upgrade to the cauldron.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            // everything below is placed at by+2 .. by+7, bx .. bx+7 (8 wide, 6 tall) - that is the only part actually needed
            for (let by = 2; by < $gameMap.height() - 9; by++) for (let bx = 2; bx < $gameMap.width() - 9; bx++) {
                let ok = true;
                for (let y = by + 2; y < by + 8 && ok; y++) for (let x = bx; x < bx + 8; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) {
                    const plots = ($gameSystem._farm.plots[$gameMap.mapId()] = $gameSystem._farm.plots[$gameMap.mapId()] || {});
                    for (let y = by + 2; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) if (!plots[x + "," + y]) plots[x + "," + y] = { s: "cleared" };
                    $gameSystem._farm.rev++;
                    return { bx, by };
                }
            }
            return null; })()`);
        check("found an open ground", !!B, B);
        const { bx, by } = B;
        await ev(`$gamePlayer.locate(${bx + 4}, ${by + 7}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 6, ${by} - 3); $gameSystem.changeStamina(300); 0`);
        await ev(`window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0`);
        const pops = () => J("window.__pop.splice(0)");
        const add = (type, x, y, v, extra) => ev(`(function(){ const L = ($gameSystem._farm.buildings[$gameMap.mapId()] = $gameSystem._farm.buildings[$gameMap.mapId()] || []); const b = Object.assign({ id: ($gameSystem._farm.nextId++), type: "${type}", x: ${x}, y: ${y}, last: 1 }, ${v === undefined ? "{}" : "{ v: " + v + " }"}, ${extra || "{}"}); L.push(b); $gameSystem._farm.rev++; return b.id; })()`);
        const entryOf = type => J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "${type}"); return e ? { hasFlame: !!e.flame, flameShown: !!(e.flame && e.flame.visible), puffs: e.puffs ? e.puffs.length : 0, glowScale: e.glow ? e.glow.scale.x : 0, image: e.sprite.bitmap && e.sprite.bitmap._url } : null; })()`);

        // ---------------------------------------------------------------- data
        const def = await J(`(function(){ const c = Farming.BUILDINGS.campfire, k = Farming.BUILDINGS.cauldron; return { image: c.image, fire: c.fire, up: c.upgrade && c.upgrade.to, cost: c.upgrade && c.upgrade.cost, kImage: k.image, kFire: k.fire, kv2: k.v2 && k.v2.image, kRecipes: k.recipes.map(r => r.id) }; })()`);
        check("campfire: the ring picture, animated fire and an upgrade to the tripod",
            def.image === "Farm_Campfire_L" && def.fire && def.fire.smoke === true && def.fire.glow >= 1.5 && def.up === "tripod", def);
        const tdef = await J(`(function(){ const t = Farming.BUILDINGS.tripod, c = Farming.BUILDINGS.campfire; return { img: t.image, noBuild: t.noBuild, hang: t.hang, fire: !!t.fire, campCost: c.upgrade.cost, tripCost: t.upgrade.cost, tripTo: t.upgrade.to, tool: t.upgrade.tool, recipes: t.recipes.map(r => r.id) }; })()`);
        const IT = async n => ev(`Farming.ITEM.${n}`);
        check("the tripod costs 3 branches and a rope (no hammer); it is not in the build menu", JSON.stringify(tdef.campCost) === JSON.stringify([[await IT("branch"), 3], [await IT("rope"), 1]]) && tdef.noBuild === true && tdef.img === "Farm_Tripod_L" && !!tdef.hang && tdef.fire, tdef);
        check("the cauldron is hung on the tripod: it costs the Kociołek item (forged at the forge from 8 iron), no hammer needed", JSON.stringify(tdef.tripCost) === JSON.stringify([[await IT("cauldronItem"), 1]]) && tdef.tripTo === "cauldron" && !tdef.tool, tdef);
        check("the tripod roasts what the campfire roasts", ["roast_meat", "roast_fish", "potatoes", "eggs"].every(id => tdef.recipes.includes(id)), tdef.recipes);
        check("the tripod is marked noBuild (only ever made by upgrading a campfire)", (await ev("Farming.BUILDINGS.tripod.noBuild")) === true);
        check("the cauldron has only its own dishes (soup, stew, cabbage soup, mushroom soup, porridge, brew) and no roasting on a stick", ["soup", "stew", "cabbage_soup", "mushroom_soup", "porridge", "brew"].every(id => def.kRecipes.includes(id)) && !["roast_meat", "roast_fish", "potatoes", "eggs", "mushrooms", "cheese_baked"].some(id => def.kRecipes.includes(id)), def.kRecipes);

        // ---------------------------------------------------------------- the campfire on the map
        const fx = bx + 1, fy = by + 4;
        await add("campfire", fx, fy, 3);
        await frames(30);
        const cf = await entryOf("campfire");
        check("the campfire has flames, smoke puffs and a big glow", cf && cf.hasFlame && cf.puffs === 4 && cf.glowScale >= 1.5, cf);
        check("its picture is the new stone ring", cf && /Farm_Campfire_L[.]png/.test(cf.image || ""), cf && cf.image);
        const f1 = await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "campfire").flameFrame`);
        await frames(14);
        const f2 = await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "campfire").flameFrame`);
        check("the flames go through their frames", f1 !== f2, [f1, f2]);
        const smoke = await J(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "campfire").puffs.map(p => p.visible)`);
        check("the smoke rises all the time, with no job in the fire", smoke.every(v => v === true), smoke);
        const lit = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "campfire"); return { flameY: e.flame.y, spriteY: e.sprite.y, glowY: e.glow.y, puffY: e.puffs[0].y }; })()`);
        check("flames stand on the embers, the glow on the flames, the smoke above them", lit.flameY === lit.spriteY && lit.glowY < lit.spriteY && lit.glowY > lit.spriteY - 40, lit);
        await b.shot("fire_day.png");
        await ev("$gameSystem.setDayNightHour(22); 0");
        await frames(60);
        await b.shot("fire_night.png");
        await ev("$gameSystem.setDayNightHour(12); 0");

        // ---------------------------------------------------------------- the upgrade: campfire -> tripod -> cauldron
        // (the two old-look cauldrons below are added only after this whole sequence: alsoBuilt on the forge's
        // "Wykuj kociołek" recipe refuses to forge a second one while any cauldron already stands anywhere)
        await ev(`$gamePlayer.locate(${fx}, ${fy + 1}); $gamePlayer.setDirection(8); 0`);
        const menu = await J(`Farming.menuFor(${fx}, ${fy}).entries.map(e => e.name)`);
        check("the campfire's menu offers 'Dobuduj trójnóg' (and not the cauldron yet)", menu.includes("Dobuduj trójnóg") && !menu.includes("Zawieś kociołek"), menu);
        const id = n => ev(`Farming.ITEM.${n}`);
        const [iron, planks, stone, hammer, branch, rope] = [await id("iron"), await id("planks"), await id("stone"), await id("hammer"), await id("branch"), await id("rope")];
        const has = it => ev(`$gameParty.numItems($dataItems[${it}])`);
        const setN = async (it, n) => ev(`(function(){ $gameParty.gainItem($dataItems[${it}], ${n} - $gameParty.numItems($dataItems[${it}])); })(); 0`);
        const typeHere = () => ev(`Farming.buildingAt(${fx}, ${fy}).type`);
        // 1. the tripod
        await setN(branch, 0); await setN(rope, 0); await setN(hammer, 0);
        await ev(`Farming.upgradeBuilding(Farming.buildingAt(${fx}, ${fy}))`);
        check("no branches and rope: a popup says what is missing, nothing changes", (await pops()).some(t => /Potrzebujesz: /.test(t)) && (await typeHere()) === "campfire");
        await setN(branch, 3); await setN(rope, 1);
        await ev(`Farming.upgradeBuilding(Farming.buildingAt(${fx}, ${fy}))`);
        await frames(70);
        const tri = await J(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}); return { type: b.type, x: b.x, y: b.y, v: b.v, cells: Farming.cellsOfGeo(Farming.geoOf(b), b.x, b.y).length }; })()`);
        check("no hammer needed: the campfire became a tripod in the same place (1 tile)", tri.type === "tripod" && tri.x === fx && tri.y === fy && tri.v === 3 && tri.cells === 1, tri);
        check("3 branches and a rope were used, popup 'Dobudowano trójnóg'", (await has(branch)) === 0 && (await has(rope)) === 0 && (await pops()).some(t => /Dobudowano trójnóg/.test(t)));
        const te = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "tripod"); return e ? { flame: !!e.flame, puffs: e.puffs ? e.puffs.length : 0, glow: e.glow ? e.glow.scale.x : 0, meat: !!e.meatRaw, meatShown: !!(e.meatRaw && e.meatRaw.visible), image: e.sprite.bitmap._url.replace(/.*\\//, "") } : null; })()`);
        check("the tripod has the fire, smoke and glow of the campfire, its own picture, and no hanging food while nothing roasts", te && te.flame && te.puffs === 4 && te.glow >= 1.5 && te.meat && !te.meatShown && te.image === "Farm_Tripod_L.png", te);
        await b.shot("fire_tripod_day.png");
        const menu2 = await J(`Farming.menuFor(${fx}, ${fy}).entries.map(e => e.name)`);
        check("the tripod's menu: the roasting recipes, and 'Zawieś kociołek'", menu2.includes("Upiecz mięso zająca") && menu2.includes("Upiecz mięso dzika") && menu2.includes("Zawieś kociołek") && !menu2.includes("Dobuduj trójnóg"), menu2);
        // 2. the cauldron: hung from a Kociołek item, forged at a forge from 8 iron (not paid for in raw materials on the spot)
        const cauldronItem = await id("cauldronItem");
        await ev(`Farming.upgradeBuilding(Farming.buildingAt(${fx}, ${fy}))`);
        check("no materials: a popup says what is missing, nothing changes", (await pops()).some(t => /Potrzebujesz: /.test(t)) && (await typeHere()) === "tripod");
        const gx = bx + 2, gy = by + 7;   // a temporary forge, well clear of everything else in this small patch
        await add("forge", gx, gy, 3);
        await setN(iron, 8);
        const forged = await ev(`Farming.craftManual(Farming.buildingAt(${gx}, ${gy}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "cauldron_item"))`);
        await frames(130);
        check("(setup) forged a Kociołek at the forge: 8 iron -> the carryable item", forged === true && (await ev(`$gameParty.numItems($dataItems[${cauldronItem}])`)) === 1);
        await add("bench", fx - 1, fy);   // something in the way where the cauldron's left tile would be
        await ev(`Farming.upgradeBuilding(Farming.buildingAt(${fx}, ${fy}))`);
        check("no room: 'Za mało miejsca wokół ogniska'", (await pops()).some(t => /Za mało miejsca/.test(t)) && (await typeHere()) === "tripod");
        await ev(`(function(){ const L = $gameSystem._farm.buildings[$gameMap.mapId()]; const i = L.findIndex(b => b.type === "bench"); L.splice(i, 1); $gameSystem._farm.rev++; })(); 0`);
        await ev(`Farming.upgradeBuilding(Farming.buildingAt(${fx}, ${fy}))`);
        await frames(70);
        const after = await J(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}); return { type: b.type, x: b.x, y: b.y, v: b.v, tripods: $gameSystem._farm.buildings[$gameMap.mapId()].filter(b => b.type === "tripod").length }; })()`);
        check("the tripod became a cauldron built around the fire (3 x 2, the fire is the middle tile of the bottom row)",
            after.type === "cauldron" && after.x === fx - 1 && after.y === fy && after.v === 3 && after.tripods === 0, after);
        check("the Kociołek item was consumed", (await ev(`$gameParty.numItems($dataItems[${cauldronItem}])`)) === 0);
        check("all six tiles are the cauldron's", (await J(`[[${fx - 1},${fy}],[${fx},${fy}],[${fx + 1},${fy}],[${fx - 1},${fy - 1}],[${fx},${fy - 1}],[${fx + 1},${fy - 1}]].map(c => (Farming.buildingAt(c[0], c[1]) || {}).type)`)).every(t => t === "cauldron"));
        const xs = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "cauldron" && e.b.v === 3); return { spriteX: e.sprite.x, fireCentre: Math.round(($gameMap.adjustX(${fx}) + 0.5) * 48), flame: !!e.flame, image: e.sprite.bitmap._url.replace(/.*\\//, "") }; })()`);
        check("the new cauldron's fire ring sits exactly where the fire was (same centre line)", xs.spriteX === xs.fireCentre && xs.flame && xs.image === "Farm_Cauldron_XL.png", xs);
        check("popup 'Zawieszono kociołek'", (await pops()).some(t => /Zawieszono kociołek/.test(t)));

        // ---------------------------------------------------------------- old cauldrons keep their look
        await add("cauldron", bx + 5, by + 6, 2);   // first round
        await add("cauldron", bx + 5, by + 2);      // very old (2 x 1)
        await frames(20);
        const olds = await J(`SceneManager._scene._spriteset._buildingSprites._sprites.filter(e => e.b.type === "cauldron" && e.b.v !== 3).map(e => [e.b.v || 0, !!e.flame, e.sprite.bitmap._url.replace(/.*\\//, "")])`);
        check("cauldrons of the older rounds have no animated flames and keep their picture", JSON.stringify(olds) === JSON.stringify([[2, false, "Farm_Cauldron_L.png"], [0, false, "Farm_Cauldron.png"]]), olds);

        await frames(20);
        await b.shot("fire_cauldron_day.png");
        await ev("$gameSystem.setDayNightHour(22); 0");
        await frames(60);
        await b.shot("fire_cauldron_night.png");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
