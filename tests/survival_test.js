// Tests the survival package in the real game: gathering, food, cooking, snares, butchering, water, fishing, gear, weather and cold.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(10); $gameSystem.changeStamina(100); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(2); await ev(`Input._currentState.${k} = false; 0`); await frames(2); };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);

        // ------------------------------------------------------------ data
        const data = await ev(`(function(){ const ids = []; for (let i = 90; i <= 116; i++) ids.push($dataItems[i] && $dataItems[i].name && $dataItems[i].iconIndex === i + 256); return { all: ids.every(Boolean), n: ids.length, foods: [71,72,73,75,76,81,83,95,99,102,103,105,106,107,108,109,110].every(i => $dataItems[i].consumable && $dataItems[i].meta.Food) }; })()`);
        check("27 new items with their icons, and the foods carry <Food> tags", data.all && data.foods, data);
        const sheet = await ev("(function(){ const b = ImageManager.loadSystem('IconSet'); return { w: b.width, h: b.height }; })()");
        check("icon sheet is tall enough for icon 372", sheet.h >= 24 * 32, sheet);
        const blds = await ev("Object.keys(Farming.BUILDINGS).filter(k => ['snare','smokehouse','tannery','well','cauldron','pen','bedroll'].includes(k)).join(',')");
        check("seven new buildings are defined", blds.split(",").length === 7, blds);
        const imgs = await ev(`Promise.all(['Snare','Smokehouse','Tannery','Well','Cauldron','Pen','Bedroll'].map(n => new Promise(res => { const bm = ImageManager.loadSystem('Farm_' + n); bm.addLoadListener(() => res(bm.width + 'x' + bm.height)); }))).then(a => a.join(','))`);
        check("their sprites all load", /^(96x\d+,?){7}$/.test(imgs), imgs);

        // ------------------------------------------------------------ gathering
        await sleep(1200);
        const scan = async () => ev(`(function(){ const c = {}; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { const s = Farming.gatherSpot(x, y); if (s === undefined) return "wait"; const k = Farming.gatherAt(x, y); if (k) c[k] = (c[k] || 0) + 1; } return c; })()`);
        let spring = await scan();
        console.log("spring:", JSON.stringify(spring));
        check("spring: stones, flax and herbs lie about, no berries on the ground, mushrooms only a few", spring !== "wait" && spring.stone > 10 && spring.fiber > 10 && spring.herb > 3 && !spring.berries && (spring.mushroom || 0) <= 3, spring);
        await ev("$gameSystem._dayNightDay = 40; 0");
        const summer = await scan();
        await ev("$gameSystem._dayNightDay = 65; 0");
        const autumn = await scan();
        console.log("summer:", JSON.stringify(summer), "autumn:", JSON.stringify(autumn));
        check("summer brings berries, autumn many more mushrooms", summer.berries > 3 && (summer.mushroom || 0) < autumn.mushroom && autumn.mushroom > 3 && autumn.berries > 3, { summer, autumn });
        await ev("$gameSystem._dayNightDay = 1; $gameSystem.setDayNightHour(10); 0");

        // pick flax with the action button
        const flax = await ev(`(function(){ for (let y = 2; y < $gameMap.height() - 2; y++) for (let x = 3; x < $gameMap.width() - 2; x++) { if (Farming.gatherAt(x, y) === "fiber" && Farming.naturalFarmland(x - 1, y)) return { x, y }; } return null; })()`);
        check("found a flax plant to pick", !!flax, flax);
        await ev(`$gamePlayer.locate(${flax.x - 1}, ${flax.y}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${flax.x - 1} - 13, ${flax.y} - 7); 0`);
        await frames(4);
        await press("ok"); await frames(70);
        check("the action button picks the flax (1-2 fibre)", (await count(92)) >= 1 && (await count(92)) <= 2, { fibre: await count(92) });

        // ------------------------------------------------------------ crafting chain: rope, knife, rod at a sawmill
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; const B = f.buildings[3] = f.buildings[3] || [];
            const add = (type, x, y) => { B.push({ id: f.nextId++, type, x, y, last: 1 }); for (let i = 0; i < Farming.BUILDINGS[type].w; i++) P[(x + i) + "," + y] = { s: "cleared" }; };
            add("sawmill", 26, 5); add("workbench", 22, 5); add("forge", 30, 5); add("campfire", 34, 5); add("smokehouse", 26, 8); add("tannery", 30, 8); add("cauldron", 34, 8); add("snare", 26, 11); add("pen", 30, 11); add("well", 34, 11); add("bedroll", 26, 14);
            f.rev++; })()`);
        await frames(6);
        await give(92, 6); await give(61, 6); await give(64, 6); await give(77, 4);
        const bld = (t, r) => `Farming.craftManual(Farming.buildingAt(${t}), Farming.BUILDINGS.${r})`;
        const sawRecipe = i => `Farming.BUILDINGS.sawmill.recipes[${i}]`;
        const recipeIndex = async (type, id) => ev(`Farming.BUILDINGS.${type}.recipes.findIndex(r => r.id === "${id}")`);
        const doHand = async id => { const ok = await ev(`Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === "${id}"))`); await frames(130); return ok; };
        const doManual = async (pos, type, id) => { const i = await recipeIndex(type, id); const ok = await ev(`Farming.craftManual(Farming.buildingAt(${pos}), Farming.BUILDINGS.${type}.recipes[${i}])`); await frames(130); return ok; };
        await ev("$gameSystem.changeStamina(100); 0");
        check("rope: 4 flax fibre -> 1 rope (hand work, no building)", (await doHand("rope")) === true && (await count(93)) === 1 && (await count(92)) >= 2 - 0, { rope: await count(93), fibre: await count(92) });
        await give(92, 4);
        await doHand("rope"); await give(92, 4); await doHand("rope");
        check("stone knife (workbench): 1 wood + 2 stone + 1 branch (unique)", (await doManual("22, 5", "workbench", "knife")) === true && (await count(90)) === 1 && (await doManual("22, 5", "workbench", "knife")) === false);
        check("fishing rod: 2 wood + 2 rope + 1 branch", (await doManual("22, 5", "workbench", "rod")) === true && (await count(100)) === 1, { rod: await count(100), rope: await count(93) });

        // ------------------------------------------------------------ the snare and butchering
        await ev("$gameSystem.advanceDayNight(24 * 2); 0");
        const ready1 = await ev("Farming.readyProduce(Farming.buildingAt(26, 11))");
        await ev("$gameSystem.advanceDayNight(24 * 6); 0");
        const ready = await ev("Farming.readyProduce(Farming.buildingAt(26, 11))");
        check("the snare catches 1 after 2 days and stops at the cap of 2", ready1 === 1 && ready === 2, { ready1, ready });
        const menuSnare = await ev("JSON.stringify(Farming.menuFor(26, 11).entries.map(e => e.name))");
        check("its menu offers to collect", /Zbierz: Zwierzyna/.test(menuSnare), menuSnare);
        await ev("Farming.collect(Farming.buildingAt(26, 11)); 0"); await frames(80);
        check("collected: 2 carcasses", (await count(101)) === 2, { carcass: await count(101) });
        check("butchering needs a knife: usable with the stone knife", (await ev("$gameParty.canUse($dataItems[101])")) === true);
        await ev("$gameParty.leader().useItem($dataItems[101]); 0");
        check("stone knife: carcass -> 2 meat + 1 hide", (await count(94)) === 2 && (await count(96)) === 1 && (await count(101)) === 1, { meat: await count(94), hide: await count(96) });
        await give(91, 1);
        await ev("$gameParty.leader().useItem($dataItems[101]); 0");
        check("iron knife: 3 meat + 1 hide more", (await count(94)) === 5 && (await count(96)) === 2 && (await count(101)) === 0, { meat: await count(94), hide: await count(96) });
        await ev("$gameParty.loseItem($dataItems[90], 1, false); $gameParty.loseItem($dataItems[91], 1, false); $gameParty.gainItem($dataItems[101], 1); 0");
        check("without a knife the carcass cannot be used", (await ev("$gameParty.canUse($dataItems[101])")) === false);

        // ------------------------------------------------------------ eating
        await ev("$gameSystem.setStamina(40); 0");
        await give(95, 1);
        check("roast meat is edible when tired", (await ev("$gameParty.canUse($dataItems[95])")) === true);
        await ev("$gameParty.leader().useItem($dataItems[95]); 0");
        const fed = await ev("({ st: $gameSystem.stamina(), sated: $gameSystem.hasBuff('sated'), left: $gameSystem.activeBuffs().map(b => [b.name, Math.round(b.left)]) })");
        check("eating: +40 stamina and 'Najedzony' for 3 hours", Math.round(fed.st) === 80 && fed.sated && fed.left[0][1] === 3, fed);
        const st1 = await ev("$gameSystem.stamina()");
        await ev("$gameSystem.trySpendStamina(10); 0");
        check("'sated' makes actions cost 15% less", Math.abs((st1 - (await ev("$gameSystem.stamina()"))) - 8.5) < 0.01);
        await ev("$gameSystem.setStamina(100); 0"); await give(71, 1);
        check("a plain potato is refused at full stamina, sated food too while the buff lasts", (await ev("$gameParty.canUse($dataItems[71])")) === false && (await ev("$gameParty.canUse($dataItems[95])")) === false);
        await ev("$gameSystem.advanceDayNight(4); 0");
        check("the buff runs out with game time", (await ev("$gameSystem.hasBuff('sated')")) === false);

        // ------------------------------------------------------------ cooking at the campfire (background job)
        await give(94, 0);
        const cf = "Farming.buildingAt(34, 5)";
        const ci = await recipeIndex("campfire", "roast_meat");
        await ev(`Farming.startJob(${cf}, "roast_meat"); 0`); await frames(120);
        check("the campfire is cooking (the player sits by it with the meat on a stick)", (await ev(`!!${cf}.job`)) && (await ev("$gamePlayer.isToolSwinging()")));
        await ev("$gameSystem.advanceDayNight(0.6); 0");   // half an hour of game time: the meat is done and the player gets up with it
        await frames(120);
        check("when it is done the player stands up with the roast meat (nothing left on the fire)", (await ev(`!${cf}.job`)) && (await count(95)) === 1 && (await count(94)) === 4 && !(await ev("$gamePlayer.isToolSwinging()")), { roast: await count(95), raw: await count(94) });
        check("the campfire still glows (its cooking must not switch its light off)", (await ev(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(s => s.b.type === 'campfire'); return e && e.glow ? e.glow.alpha : -1; })()`)) > 0.05);

        // ------------------------------------------------------------ the other stations: smokehouse, cauldron, tannery
        await give(98, 2); await give(61, 4); await give(71, 2); await give(72, 1); await give(104, 3); await give(77, 6);
        await ev(`Farming.startJob(Farming.buildingAt(26, 8), "smoke_meat"); 0`); await frames(100);
        await ev("$gameSystem.advanceDayNight(9); 0"); await ev("Farming.collectJob(Farming.buildingAt(26, 8)); 0"); await frames(100);
        check("smokehouse: 2 raw meat + 2 wood -> 2 smoked meat", (await count(105)) === 2, { smoked: await count(105) });
        await ev(`Farming.startJob(Farming.buildingAt(34, 8), "soup"); 0`); await frames(100);
        await ev("$gameSystem.advanceDayNight(4); 0"); await ev("Farming.collectJob(Farming.buildingAt(34, 8)); 0"); await frames(100);
        check("cauldron: potatoes + carrot + meat -> 2 soup", (await count(109)) === 2, { soup: await count(109) });
        await ev(`Farming.startJob(Farming.buildingAt(30, 8), "tan"); 0`); await frames(100);
        const tanMenu = await ev("JSON.stringify(Farming.menuFor(30, 8).entries.map(e => e.name))");
        check("tannery: a hide is tanning, hand recipes (boots, backpack, cloak) are offered at the same time", /Skóra się garbuje/.test(tanMenu) && /Zszyj buty/.test(tanMenu) && /Zszyj plecak/.test(tanMenu) && /Uszyj płaszcz/.test(tanMenu), tanMenu);
        await ev("$gameSystem.advanceDayNight(13); 0"); await ev("Farming.collectJob(Farming.buildingAt(30, 8)); 0"); await frames(100);
        check("tanned hide: 1 raw hide + 3 branches -> 1 hide", (await count(97)) === 1, { hide: await count(97) });

        // ------------------------------------------------------------ gear
        await give(97, 6); await give(93, 3); await give(111, 4);
        await doManual("30, 8", "tannery", "boots"); await doManual("30, 8", "tannery", "backpack");
        const gear = await ev("({ boots: $gameParty.hasItem($dataItems[113]), pack: $gameParty.hasItem($dataItems[114]), max: $gameParty.maxItems($dataItems[64]), maxKey: $gameParty.maxItems($dataItems[63]) })");
        check("boots and a backpack were sewn; the backpack raises the item limit (99 -> 150)", gear.boots && gear.pack && gear.max === 150 && gear.maxKey === 99, gear);
        const dpf = await ev("(function(){ const with_ = $gamePlayer.distancePerFrame(); $gameParty.loseItem($dataItems[113], 1, false); const without = $gamePlayer.distancePerFrame(); $gameParty.gainItem($dataItems[113], 1); return { ratio: with_ / without }; })()");
        const bootsParam = Number(await ev("PluginManager.parameters('Survival').bootsSpeed")) || 1.1;   // the user tunes it in the Plugin Manager (1.50 now)
        check("boots make the player faster by the plugin's bootsSpeed (" + bootsParam + ")", Math.abs(dpf.ratio - bootsParam) < 0.001, dpf);

        // ------------------------------------------------------------ water: the can, the well, the pond
        const pond = await ev(`(function(){ for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) { if (Farming.isWaterTile(x, y) && Farming.naturalFarmland(x - 1, y)) return { x, y }; } return null; })()`);
        check("found a pond tile with grass beside it", !!pond, pond);
        await give(86, 3); await give(80, 6);
        check("the watering can is forged: 1 iron + 2 planks", (await doManual("30, 5", "forge", "can")) === true && (await count(87)) === 1);
        check("a new can is full (6/6)", (await ev("Farming.canCharges()")) === 6);
        await ev(`(function(){ const P = $gameSystem._farm.plots[3]; P["20,3"] = { s: "tilled" }; $gameSystem._farm.rev++; })()`);
        for (let i = 0; i < 6; i++) { await ev("$gameSystem.setStamina(100); Farming.water(20, 3); 0"); await frames(60); }
        check("six waterings empty the can", (await ev("Farming.canCharges()")) === 0);
        const dry = await ev("Farming.water(20, 3)");
        check("an empty can refuses", dry === false);
        await ev(`$gamePlayer.locate(${pond.x - 1}, ${pond.y}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${pond.x - 1} - 13, ${pond.y} - 7); 0`);
        await frames(4);
        await press("ok"); await frames(6);
        const wm = await ev("JSON.stringify({ open: !!$gameTemp._farmMenuOpen, title: SceneManager._scene._farmMenu._title, entries: SceneManager._scene._farmMenu._entries.map(e => e.name) })");
        check("facing the pond the action button opens the water menu", /"open":true/.test(wm) && /Zarzuć wędkę/.test(wm) && /Napełnij konewkę/.test(wm) && /Napij się/.test(wm), wm);
        await press("cancel"); await frames(4);
        await ev("Farming.fillCan(); 0"); await frames(80);
        check("the can is refilled at the pond", (await ev("Farming.canCharges()")) === 6);
        await ev("$gameSystem.setStamina(50); 0");
        await ev("Farming.drink(); 0"); await frames(80);
        check("a drink gives +8 stamina", Math.round(await ev("$gameSystem.stamina()")) === 58);
        const wellMenu = await ev("JSON.stringify(Farming.menuFor(34, 11).entries.map(e => e.name))");
        check("the well offers the can and a drink", /Napełnij konewkę/.test(wellMenu) && /Napij się/.test(wellMenu), wellMenu);

        // ------------------------------------------------------------ fishing (Math.random stubbed for a sure catch)
        await ev("$gameSystem.setStamina(100); $gameSystem.setDayNightHour(6); window.__rand = Math.random; Math.random = () => 0.1; 0");
        const h0 = await ev("$gameSystem.dayNightHour()");
        await ev("Farming.goFishing(); 0");
        await frames(260);
        await ev("Math.random = window.__rand; 0");
        check("fishing at dawn with a good roll: fish caught (2), an hour passed, stamina spent", (await count(98)) >= 2 && (await ev("$gameSystem.stamina()")) < 100, { fish: await count(98) });
        const h1 = await ev("$gameSystem.dayNightHour()");
        check("fishing took about an hour of game time", h1 - h0 > 0.9 && h1 - h0 < 1.9, { h0, h1 });

        // ------------------------------------------------------------ legowisko
        await ev("$gameSystem.setStamina(30); 0");
        const dayHour0 = await ev("$gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()");
        const harsh = await ev(`["rain", "storm", "snow"].includes($gameScreen.weatherType()) || Farming.seasonIndex($gameSystem.dayNightDay()) === 3`);
        await ev("Farming.menuFor(26, 14).entries[0].run(); 0"); await frames(200);
        const dayHour1 = await ev("$gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()");
        check("the forest bed: a night's sleep to the morning, but only " + (harsh ? "40" : "60") + "% of the strength comes back", Math.round(await ev("$gameSystem.stamina()")) === (harsh ? 40 : 60) && dayHour1 > dayHour0 && (dayHour1 % 24) > 6.5 && (dayHour1 % 24) < 8.5, { dayHour0, dayHour1, harsh });
        for (let k = 0; k < 10 && (await ev("$gameMessage.isBusy()")); k++) { await press("ok"); await frames(15); }
        // a night that runs through midnight ends the day: the summary of the day (Journal.js) opens; close it
        for (let k = 0; k < 40 && (await ev("SceneManager._scene.constructor.name")) !== "Scene_DaySummary"; k++) await frames(6);
        if ((await ev("SceneManager._scene.constructor.name")) === "Scene_DaySummary") { await press("ok"); await frames(20); await press("ok"); await frames(30); }

        // ------------------------------------------------------------ weather and cold
        const days = await ev(`(function(){ const rain = [], snow = []; for (let d = 1; d <= 112; d++) { const p = Survival.weatherPlan(d); if (p && p.type === "rain") rain.push(d); if (p && p.type === "snow") snow.push(d); } return { rain: rain.length, snow: snow.length, firstRain: rain[0], firstSnow: snow[0] }; })()`);
        check("the year has rainy days (spring to autumn) and snowy winter days", days.rain > 10 && days.snow > 4 && days.firstSnow >= 85, days);
        const plan = await ev(`Survival.weatherPlan(${days.firstRain})`);
        await ev(`$gameSystem._farm.plots[3]["20,3"].watered = -5; $gameSystem._rainDay = 0; $gameSystem._dayNightDay = ${days.firstRain}; $gameSystem.setDayNightHour(${plan.start} + 0.5); 0`);
        await frames(80);
        const rainNow = await ev("({ type: $gameScreen.weatherType(), watered: $gameSystem._farm.plots[3]['20,3'].watered, today: $gameSystem.dayNightDay() })");
        check("rain falls in the planned hours and waters the tilled plots", rainNow.type === "rain" && rainNow.watered === rainNow.today, rainNow);
        await ev(`$gameSystem.setDayNightHour(${plan.end} + 0.5); 0`);
        await frames(130);   // the rain fades out over 90 frames
        check("and stops afterwards (the power target falls to 0)", (await ev("$gameScreen._weatherPowerTarget")) === 0, await ev("({ w: $gameScreen.weatherType(), h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay(), plan: Survival.weatherPlan($gameSystem.dayNightDay()), cur: Survival.currentWeather(), f: Graphics.frameCount })"));
        const rain2 = await ev(`(function(){ for (let d = ${days.firstRain} + 1; d <= 84; d++) { const p = Survival.weatherPlan(d); if (p && p.type === "rain") return { d, p }; } return null; })()`);
        await ev(`$gameSystem._dayNightDay = ${rain2.d}; $gameSystem.setDayNightHour(${rain2.p.start} + 0.5); 0`);
        await frames(70);
        check("and it rains again on the next rainy day (the type is stale after a fade)", (await ev("$gameScreen._weatherPowerTarget")) === rain2.p.power && (await ev("$gameScreen.weatherType()")) === "rain", rain2);
        const sp = await ev(`Survival.weatherPlan(${days.firstSnow})`);
        await ev(`$gameSystem._dayNightDay = ${days.firstSnow}; $gameSystem.setDayNightHour(${sp.start} + 0.5); 0`);
        await frames(80);
        check("snow in winter", (await ev("$gameScreen.weatherType()")) === "snow" && (await ev("$gameScreen._weatherPowerTarget")) > 0);
        await ev("$gameParty.loseItem($dataItems[112], 1, false); $gameSystem.buffs().warm = 0; $gamePlayer.locate(10, 3); 0");
        const cold = await ev("$gameSystem.isCold()");
        await ev("$gameSystem.setStamina(100); 0");
        await ev("$gameSystem.trySpendStamina(10); 0");
        const spentCold = 100 - (await ev("$gameSystem.stamina()"));
        check("winter outdoors without a cloak: cold, actions cost 25% more", cold === true && Math.abs(spentCold - 12.5) < 0.01, { cold, spentCold });
        await give(112, 1);
        check("a cloak keeps the cold out", (await ev("$gameSystem.isCold()")) === false);
        await ev("$gameParty.loseItem($dataItems[112], 1, false); $gameSystem.addBuff('warm', 3); 0");
        check("so does a warm meal (the 'warm' buff)", (await ev("$gameSystem.isCold()")) === false);
        await ev("$gameSystem.buffs().warm = 0; $gamePlayer.locate(35, 6); 0");
        check("and standing next to a campfire", (await ev("$gameSystem.isCold()")) === false);
        await ev("$gamePlayer.locate(10, 3); $gameSystem._dayNightDay = 1; $gameSystem.setDayNightHour(23); 0"); await frames(70);
        check("weather started by the plugin ends by itself outside its hours", (await ev("$gameScreen._weatherPowerTarget")) === 0);
        check("in spring the same spot is not cold", (await ev("$gameSystem.isCold()")) === false, await ev("({ w: $gameScreen.weatherType(), h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay(), cur: Survival.currentWeather() })"));
    } catch (e) { console.log("ERR", e.message); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
