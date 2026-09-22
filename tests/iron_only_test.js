// Player with ONLY the iron pickaxe / axe (no stone tool): can they work? Then the blow counts of stone vs iron on several objects.
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
        const stand = (eid, px, py, d) => ev(`$gameSystem.setStamina(100); $gamePlayer.locate(${px}, ${py}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${px} - 13, ${py} - 7); 0`);
        // presses until the object goes down; also returns the message (if the tool was refused) and the stamina spent per blow
        const work = async (eid, px, py, d) => {
            await stand(eid, px, py, d); await frames(6);
            const series = [], stam = [];
            let refused = "";
            for (let i = 0; i < 14; i++) {
                await idle(eid);
                await ev("$gameSystem.setStamina(100); 0");
                const before = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                await ev(`$gameMap.event(${eid}).start(); 0`);
                await ev(`new Promise(res => { let n = 0; const iv = setInterval(() => { const e = $gameMap.event(${eid}); n++; if ((e._treeHits || 0) !== ${before} || e._breakT >= 0 || e._treeFallT >= 0 || $gameMessage.hasText() || n > 300) { clearInterval(iv); res(); } }, 8); })`);
                if (await ev("$gameMessage.hasText()")) { refused = await ev("$gameMessage.allText()"); await ev("$gameMessage.clear(); $gameMap._interpreter.terminate(); 0"); break; }
                stam.push(Math.round(100 - (await ev("$gameSystem.stamina()"))));
                const hits = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                series.push(hits);
                if (hits === 0) break;
            }
            return { presses: series.length, series, refused, stamPerBlow: stam[0] };
        };
        // 1. only the iron pickaxe / axe: it has to work by itself
        await ev("$gameParty.gainItem($dataItems[116], 1); $gameParty.gainItem($dataItems[115], 1); 0");
        check("no stone pickaxe in the bag", (await ev("$gameParty.numItems($dataItems[63])")) === 0);
        const onlyIron = await work(45, 33, 18, 2);
        console.log("ore vein, only the iron pickaxe:", JSON.stringify(onlyIron));
        check("the iron pickaxe works on its own (no 'you need a pickaxe')", onlyIron.refused === "" && onlyIron.presses >= 1 && onlyIron.series[onlyIron.series.length - 1] === 0, onlyIron);
        const treeIron = await work(1, 14, 10, 8);
        console.log("tree, only the iron axe:        ", JSON.stringify(treeIron));
        check("the iron axe works on its own", treeIron.refused === "" && treeIron.series[treeIron.series.length - 1] === 0, treeIron);

        // 2. clearly better than the plain tools: same kind of object, both tools in the bag / only the plain one
        await ev("$gameParty.loseItem($dataItems[116], 1); $gameParty.loseItem($dataItems[115], 1); $gameParty.gainItem($dataItems[63], 1); $gameParty.gainItem($dataItems[60], 1); 0");
        const veinStone = await work(47, 32, 17, 2);
        await ev("$gameParty.gainItem($dataItems[116], 1); 0");
        const veinIron = await work(50, 30, 16, 2);
        console.log("vein blows/stamina  stone:", veinStone.presses, veinStone.stamPerBlow, " iron:", veinIron.presses, veinIron.stamPerBlow);
        check("ore vein: 4 blows with the stone pickaxe, 3 with the iron one", veinStone.presses === 4 && veinIron.presses === 3, { stone: veinStone.presses, iron: veinIron.presses });
        check("and each blow costs less stamina", veinIron.stamPerBlow < veinStone.stamPerBlow, { stone: veinStone.stamPerBlow, iron: veinIron.stamPerBlow });
        const rockStone = await work(83, 31, 22, 2);   // a huge rock (8 blows)
        console.log("huge rock stone pickaxe:", JSON.stringify(rockStone));
        await ev("$gameParty.loseItem($dataItems[116], 1); 0");
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
