// The fired clay pot set down (Farming_Data "clay_pot" + Farming.js): it stands at once ("Postaw..."), collects rain (a portion an hour
// of rain, up to 3), seeps (a portion a day), a drink from it +25; taken into the bag with its water, set down it has it back; after
// 30 uses (drinks, fillings) it cracks.
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(8); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);

        const def = await J(`(function(){ const d = Farming.BUILDINGS.clay_pot; return d && { name: d.name, cost: d.cost, instant: d.instant, rain: d.rain, pack: d.pack }; })()`);
        check("Gliniany garnek: put down at once from the bag, 3 portions, seeps 1 a day, a drink +25, 30 uses", def && def.instant && JSON.stringify(def.cost) === "[[167,1]]" && def.rain.max === 3 && def.rain.leak === 1 && def.rain.drink === 25 && def.rain.wear === 30 && def.pack === 167, def);

        const spot = await J(`(function(){ for (let y = 10; y < $gameMap.height() - 3; y++) for (let x = 4; x < $gameMap.width() - 4; x++) if (!Farming.whyNotBuild("clay_pot", x, y) && !Farming.gatherAt(x, y) && $gameMap.isPassable(x, y + 1, 8)) return { x, y }; return null; })()`);
        await ev(`(function(){ $gameParty.gainItem($dataItems[167], 1); $gamePlayer.locate(${spot.x}, ${spot.y + 1}); $gamePlayer.setDirection(8); $gamePlayer.center(${spot.x}, ${spot.y}); window.__r = Farming.build("clay_pot", ${spot.x}, ${spot.y}); return 0; })()`);
        await frames(60);
        const put = await J(`(function(){ const bb = Farming.buildingAt(${spot.x}, ${spot.y}); return { r: window.__r, type: bb && bb.type, bag: $gameParty.numItems($dataItems[167]), n: bb && Farming.bucketUnits(bb) }; })()`);
        check("set down: it stands, the pot leaves the bag, empty", put.r && put.type === "clay_pot" && put.bag === 0 && put.n === 0, put);
        const pic = () => J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "clay_pot"); return e && e.sprite.bitmap ? e.sprite.bitmap._url.split("/").pop() : null; })()`);
        await frames(20);
        check("...drawn as the empty terracotta pot", (await pic()) === "Farm_Pot_Fired.png", await pic());

        // four hours of rain: full (3, not 4)
        const rain = await J(`(function(){ const bb = Farming.buildingAt(${spot.x}, ${spot.y}), plan0 = Survival.weatherPlan, d = $gameSystem.dayNightDay();
            Farming.bucketUnits(bb);
            Survival.weatherPlan = day => (day === d ? { type: "rain", start: 8, end: 12.5, power: 4 } : null);
            $gameSystem.advanceDayNight(4.2); const n = Farming.bucketUnits(bb); Survival.weatherPlan = plan0; return n; })()`);
        check("four hours of rain: it holds 3 portions (full, no more)", rain === 3, rain);
        await frames(40);
        check("...drawn with water in it", (await pic()) === "Farm_Pot_Fired_Full.png", await pic());
        if (OUT) await b.shot(OUT + "claypot_full.png");
        const leak = await J(`(function(){ const bb = Farming.buildingAt(${spot.x}, ${spot.y}), plan0 = Survival.weatherPlan; Survival.weatherPlan = () => null;
            $gameSystem.advanceDayNight(24); const n = Farming.bucketUnits(bb); Survival.weatherPlan = plan0; return n; })()`);
        check("a dry day later: one portion seeped away (2 left)", leak === 2, leak);

        // its menu, a drink (+25)
        const menu = await J(`(function(){ const m = Farming.menuFor(${spot.x}, ${spot.y}); return m.entries.map(e => e.name); })()`);
        check("its menu: the water in it, drink, fill the waterskin / can / bucket, pour out, take it", menu[0] === "Woda w garnku: 2/3" && ["Napij się", "Napełnij bukłak", "Napełnij konewkę", "Wylej wodę", "Zabierz garnek"].every(n => menu.includes(n)) && !menu.includes("Rozbierz"), menu);
        await ev("Needs.setEnabled(true); Needs.state().water = 30; 0");
        const w0 = await ev("Needs.state().water");
        await ev(`(function(){ const m = Farming.menuFor(${spot.x}, ${spot.y}); m.entries.find(e => e.name === "Napij się").run(); return 0; })()`);
        await frames(60);
        const drank = await J(`(function(){ const bb = Farming.buildingAt(${spot.x}, ${spot.y}); return { water: Needs.state().water, n: Farming.bucketUnits(bb), uses: bb.uses }; })()`);
        check("a drink: +25 water, one portion used, one use of it", Math.round(drank.water - w0) === 25 && drank.n === 1 && drank.uses === 1, { w0, ...drank });

        // taken with its water, set down again with it
        await ev(`(function(){ const m = Farming.menuFor(${spot.x}, ${spot.y}); m.entries.find(e => e.name === "Zabierz garnek").run(); return 0; })()`);
        await frames(60);
        const bag = await J(`({ pot: $gameParty.numItems($dataItems[167]), left: !!Farming.buildingAt(${spot.x}, ${spot.y}), kept: $gameSystem._vesselBag && $gameSystem._vesselBag.clay_pot })`);
        check("taken: back in the bag, its water (and wear) kept for it", bag.pot === 1 && !bag.left && bag.kept.length === 1 && Math.round(bag.kept[0].water) === 1 && bag.kept[0].uses === 1, bag);
        await ev(`(function(){ Farming.build("clay_pot", ${spot.x}, ${spot.y}); return 0; })()`);
        await frames(60);
        const back = await J(`(function(){ const bb = Farming.buildingAt(${spot.x}, ${spot.y}); return { n: bb && Farming.bucketUnits(bb), uses: bb && bb.uses }; })()`);
        check("...set down again: the same water in it", back.n === 1 && back.uses === 1, back);

        // worn out: the 30th use cracks it
        await ev(`(function(){ const bb = Farming.buildingAt(${spot.x}, ${spot.y}); bb.uses = 29; Needs.state().water = 30; const m = Farming.menuFor(${spot.x}, ${spot.y}); m.entries.find(e => e.name === "Napij się").run(); return 0; })()`);
        await frames(90);
        const cracked = await J(`({ left: !!Farming.buildingAt(${spot.x}, ${spot.y}), bag: $gameParty.numItems($dataItems[167]) })`);
        check("the 30th use: it cracks - gone from the ground, not in the bag", !cracked.left && cracked.bag === 0, cracked);
        await ev("Needs.setEnabled(false); 0");
        const item = await J("({ name: $dataItems[167].name, icon: $dataItems[167].iconIndex })");
        check("the item: Gliniany garnek (icon 430)", item.name === "Gliniany garnek" && item.icon === 430, item);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
