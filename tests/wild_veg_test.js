// Wild potatoes and carrots (Farming GATHER wildPotato / wildCarrot): a few on the maps from the start, dug out by hand they give
// the vegetable and sometimes its seeds; they come back after 12 days (the user's, 2026-09-25).
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
        const find = () => J(`(function(){ const out = { wildPotato: [], wildCarrot: [], free: 0 };
            for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { const k = Farming.gatherAt(x, y); if (out[k]) out[k].push([x, y]); }
            return out; })()`);
        await frames(30);
        const w = await find();
        check("day 1 (spring): a few wild potatoes and wild carrots on the meadow, seldom", w.wildPotato.length >= 1 && w.wildCarrot.length >= 1 && w.wildPotato.length + w.wildCarrot.length <= 16, { potatoes: w.wildPotato, carrots: w.wildCarrot });
        check("...the journal says where to find them (the potato's and the carrot's sources)", /dziko/.test(await ev("Journal.sourceLines(71).join(' ')")) && /dziko/.test(await ev("Journal.sourceLines(72).join(' ')")));

        // stand next to one and look at it
        const [px, py] = w.wildPotato[0];
        await ev(`$gamePlayer.locate(${px}, ${py + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${px} - 13, ${py} - 7); 0`);
        await frames(20);
        await b.shot("wild_potato.png");
        const [cx, cy] = w.wildCarrot[0];
        await ev(`$gamePlayer.locate(${cx}, ${cy + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7); 0`);
        await frames(20);
        await b.shot("wild_carrot.png");

        // dig them out by hand (the seeds' chance forced: yes for the potato, no for the carrot)
        const bag = () => J("[71, 67, 72, 68].map(i => $gameParty.numItems($dataItems[i]))");
        const b0 = await bag();
        await ev(`$gameSystem.setStamina(100); window.__rnd = Math.random; Math.random = () => 0.1; Farming.pickGather(${px}, ${py}); 0`);
        await frames(60);
        await ev("Math.random = window.__rnd; 0");
        const b1 = await bag();
        check("a wild potato dug out: potatoes and (this time) its seeds", b1[0] - b0[0] >= 1 && b1[0] - b0[0] <= 2 && b1[1] - b0[1] >= 1, { before: b0, after: b1 });
        await ev(`$gameSystem.setStamina(100); window.__rnd = Math.random; Math.random = () => 0.9; Farming.pickGather(${cx}, ${cy}); 0`);
        await frames(60);
        await ev("Math.random = window.__rnd; 0");
        const b2 = await bag();
        check("a wild carrot dug out: carrots (no seeds this time - half the time only)", b2[2] - b1[2] >= 1 && b2[2] - b1[2] <= 2 && b2[3] === b1[3], { before: b1, after: b2 });
        check("...both gone from their tiles", (await ev(`Farming.gatherAt(${px}, ${py})`)) === false && (await ev(`Farming.gatherAt(${cx}, ${cy})`)) === false);
        // they come back after 12 days (in a growing season)
        await ev("$gameSystem.advanceDayNight(24 * 11); 0");
        await frames(10);
        const after11 = await ev(`Farming.gatherAt(${px}, ${py})`);
        await ev("$gameSystem.advanceDayNight(24); 0");
        await frames(10);
        const after12 = await ev(`Farming.gatherAt(${px}, ${py})`);
        check("the potato is back after 12 days (not after 11)", after11 === false && after12 === "wildPotato", { after11, after12, day: await ev("$gameSystem.dayNightDay()") });
        // not in winter
        for (let i = 0; i < 200 && (await ev("Farming.seasonIndex(Farming.today())")) !== 3; i++) await ev("$gameSystem.advanceDayNight(24); 0");
        await frames(10);
        const winter = await J(`({ season: Farming.seasonIndex(Farming.today()), any: (function(){ for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { const k = Farming.gatherAt(x, y); if (k === "wildPotato" || k === "wildCarrot") return true; } return false; })() })`);
        check("none in winter", winter.season === 3 && winter.any === false, winter);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
