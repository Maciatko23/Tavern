// Trees are drawn in strips cut out of their sheet. A fruit tree swaps its bare sheet for the fruiting one when the season comes
// (the same size): the strips must be cut out again - they once kept the whole sheet as their frame and each tree was drawn over
// and over down the screen.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); Hunting.auto(false); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        // every tree sprite: are all its strips cut to one strip of one cell (not the whole sheet)?
        const strips = () => J(`SceneManager._scene._spriteset._characterSprites.filter(s => s._treeStrips && s._treeStrips.length && s.bitmap && s.bitmap.isReady()).map(s => ({ id: s._character.eventId(), pic: s._character.characterName(),
            bad: s._treeStrips.filter(st => st._frame.width !== s.patternWidth() || st._frame.height > 6).length }))`);
        const trees = await J("$gameMap.events().filter(e => /fruit=/.test((e.event() || {}).note || '')).map(e => ({ id: e.eventId(), x: e.x, y: e.y }))");
        check("there are wild fruit trees on the map", trees.length > 0, trees.length);
        await ev(`$gamePlayer.locate(${trees[0].x - 2}, ${trees[0].y + 1}); $gamePlayer.center(${trees[0].x}, ${trees[0].y}); $gameSystem._dayNightDay = 28; $gameSystem.setDayNightHour(23.5); 0`);
        await frames(40);
        const before = await strips();
        check("spring, bare: every tree's strips are cut to one strip of its cell", before.length > 0 && before.every(t => t.bad === 0), before.filter(t => t.bad));
        await ev("$gameSystem.advanceDayNight(12.5); 0");   // day 29, noon: summer, the fruit trees fruit
        await frames(80);
        const fruit = await J("$gameMap.events().filter(e => /fruit=/.test((e.event() || {}).note || '')).map(e => e.characterName())");
        check("summer: the fruit trees show their fruiting picture", fruit.every(n => /Apple|Pear/.test(n)), fruit);
        const after = await strips();
        check("...and their strips were cut out again from the new picture (no tree drawn over and over)", after.length > 0 && after.every(t => t.bad === 0), after.filter(t => t.bad));
        await b.shot(OUT + "tree_frames_summer.png");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
