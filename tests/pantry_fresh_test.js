// Food in a pantry (Farming Scene_Chest + Spoilage.chestFreshness): the pantry's list shows how long each food stays good in
// there - five times longer than in the bag or a plain chest - and its description says so (the user's, 2026-09-25).
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
        // a pantry and a plain chest put down on free ground near the player
        const spots = await J(`(function(){ const out = {};
            for (const type of ["pantry", "chest_s"]) {
                for (let y = 4; y < $gameMap.height() - 4 && !out[type]; y++) for (let x = 3; x < $gameMap.width() - 5 && !out[type]; x++)
                    if (Farming.whyNotBuild(type, x, y, false, true) === null) { Farming.placeFree(type, x, y, false); out[type] = { x, y }; }
            }
            return out; })()`);
        check("a pantry and a small chest stand", !!spots.pantry && !!spots.chest_s, spots);
        // raw hare meat (60 hours) and bread (120 hours) into both
        await ev(`(function(){ const P = Farming.buildingAt(${spots.pantry.x}, ${spots.pantry.y}), C = Farming.buildingAt(${spots.chest_s.x}, ${spots.chest_s.y});
            $gameParty.gainItem($dataItems[94], 5); $gameParty.gainItem($dataItems[83], 2);
            Farming.putInChest(P, $dataItems[94], 2); Farming.putInChest(P, $dataItems[83], 2); Farming.putInChest(C, $dataItems[94], 2);
            window.__P = P; window.__C = C; })(); 0`);
        const f = await J(`({ pMeat: Spoilage.chestFreshness(__P, 94), pBread: Spoilage.chestFreshness(__P, 83), cMeat: Spoilage.chestFreshness(__C, 94), bag: Spoilage.hoursLeft(94) })`);
        check("in the pantry raw meat keeps 5x longer: 300 h (13 days) against 60 h (3 days) in a plain chest or the bag", Math.round(f.pMeat.hours) === 300 && f.pMeat.text === "13 dni" && Math.round(f.cMeat.hours) === 60 && f.cMeat.text === "3 dni" && Math.round(f.bag) === 60, f);
        // a day later: less left
        await ev("$gameSystem.advanceDayNight(24); 0");
        await frames(20);
        const f2 = await J(`Spoilage.chestFreshness(__P, 94)`);
        check("a day later the pantry's meat has about a day less left (it ages there too, slowly; the clock also runs a little)", f2.hours <= 276.5 && f2.hours > 268, f2);

        // the pantry's screen: its list shows the time next to each food, the description says it
        await ev("Farming.openChest(__P); 0");
        for (let i = 0; i < 40 && (await ev("SceneManager._scene.constructor.name")) !== "Scene_Chest"; i++) await frames(5);
        await frames(20);
        const rows = await J(`(function(){ const w = SceneManager._scene._chestList, t = []; const d = w.drawText; w.drawText = function(s) { t.push(String(s)); return d.apply(this, arguments); }; w.refresh(); w.drawText = d; return t; })()`);
        check("the pantry's list: the meat's '11 dni' (a day later) and the bread's '24 dni' next to the items", rows.includes("11 dni") && rows.some(t => /^2[34] dni$/.test(t)), rows);
        await ev("SceneManager._scene.focus(SceneManager._scene._chestList); SceneManager._scene._chestList.select(0); SceneManager._scene._chestList.updateHelp(); 0");
        await frames(5);
        const help = await ev("SceneManager._scene._helpWindow._text");
        check("its description: food keeps longer here, the oldest goes bad in ...", /psuje się wolniej/.test(help) && /zepsuje się tu za/.test(help), help);
        await b.shot("pantry_fresh.png");
        const bagRows = await J(`(function(){ const w = SceneManager._scene._packList, t = []; const d = w.drawText; w.drawText = function(s) { t.push(String(s)); return d.apply(this, arguments); }; w.refresh(); w.drawText = d; return t; })()`);
        check("the bag's list is as before (no times; the one piece of meat left in it)", bagRows.some(s => /Surowe/.test(s)) && !bagRows.some(s => /dni$|godzin/.test(s)), bagRows);
        await ev("SceneManager.pop(); 0");
        await frames(20);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
