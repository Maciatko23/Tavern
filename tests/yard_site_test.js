// The player's path: a site for a yard, hammer blows, the finished yard with its fence and animals, then save + load.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); Livestock.alwaysOut(true); $gameSystem.setDayNightHour(11); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            for (let by = 2; by < $gameMap.height() - 9; by++) for (let bx = 2; bx < $gameMap.width() - 10; bx++) {
                let ok = true;
                for (let y = by; y < by + 8 && ok; y++) for (let x = bx; x < bx + 9; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) {
                    const plots = ($gameSystem._farm.plots[$gameMap.mapId()] = $gameSystem._farm.plots[$gameMap.mapId()] || {});
                    for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 9; x++) if (!plots[x + "," + y]) plots[x + "," + y] = { s: "cleared" };
                    $gameSystem._farm.rev++;
                    return { bx, by };
                }
            }
            return null; })()`);
        check("found an open ground", !!B, B);
        const { bx, by } = B;
        const cx = bx, cy = by + 4;   // a 6 x 5 coop: cells x..x+5, y-4..y
        await ev(`$gamePlayer.locate(${cx + 2}, ${cy + 2}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 6, ${by} - 3); $gameSystem.changeStamina(300); 0`);
        await ev(`(function(){ for (const [id, n] of Farming.BUILDINGS.coop.cost) $gameParty.gainItem($dataItems[id], n); $gameParty.gainItem($dataItems[Farming.ITEM.hammer], 1); })(); 0`);
        // the placer, then OK
        await ev(`Farming.startPlacement("coop", ${cx}, ${cy}); 0`);
        await frames(12);
        check("the placer accepts the coop's 6 x 5 yard", (await ev(`Farming.placementProblem("coop", ${cx}, ${cy})`)) === null);
        await ev(`Farming.placeSite("coop", ${cx}, ${cy}); $gameTemp._buildMode = null; 0`);
        await frames(20);
        const site = await J(`(function(){ const b = Farming.buildingAt(${cx}, ${cy}); return b ? { v: b.v, need: b.site && b.site.need, done: b.site && b.site.done } : null; })()`);
        check("a site appears (marked v3, with several blows needed)", !!site && site.v === 3 && site.need >= 2, site);
        const footTex = await ev(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "coop"); return e && e.foot ? [e.foot.bitmap.width, e.foot.bitmap.height] : null; })()`);
        check("the site foot marks the whole 6 x 5 field", !!footTex && footTex[0] === 288 && footTex[1] === 240, footTex);
        check("no animals yet, no fence yet", (await ev("Livestock.animals.length")) === 0 && (await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "coop").fences`)) === null);
        // hit the fence of the site from outside with the hammer, blow after blow (the same way the action button does)
        await ev(`$gamePlayer.locate(${cx - 1}, ${cy - 2}); $gamePlayer.setDirection(6); 0`);
        let blows = 0;
        for (let i = 0; i < 40; i++) {
            const still = await ev(`!!Farming.buildingAt(${cx}, ${cy}).site`);
            if (!still) break;
            // the first blow comes from the site menu ("Zacznij budować"), every next press of the action button is one blow
            await ev(`$gameSystem.changeStamina(100); (function(){ const b = Farming.buildingAt(${cx}, ${cy}); if (b.site.done === 0) Farming.strikeSite(b, ${cx}, ${cy - 2}); else Farming.menuFor(${cx}, ${cy - 2}); })(); 0`);
            blows++;
            await frames(40);
        }
        check("hammer blows finish the yard", !(await ev(`!!Farming.buildingAt(${cx}, ${cy}).site`)), { blows, need: site.need });
        await frames(40);
        const fences = await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "coop").fences.length`);
        check("the finished 6 x 5 yard has 17 fence posts (18 of the ring minus the gate)", fences === 17, fences);
        await ev("Livestock.sync(); 0");
        await frames(30);
        check("three hens live in it", (await ev(`Livestock.animals.length === 3 && Livestock.animals.every(a => a.kind() === "hen" && a.inYard(a._x, a._y))`)) === true);
        check("its menu offers eggs, and the open ground gives none",
            (await J(`Farming.menuFor(${cx}, ${cy}).entries.map(e => e.name)`)).some(n => /Zbierz/.test(n)) && (await ev(`Farming.menuFor(${cx + 2}, ${cy - 2})`)) === null);

        // ---------------------------------------------------------------- save and load keep the geometry
        const saved = await ev(`(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); DataManager.extractSaveContents(JsonEx.parse(json)); const b = Farming.buildingAt(${cx}, ${cy}); return { v: b.v, cells: Farming.cellsOfGeo(Farming.geoOf(b), b.x, b.y).length, herdCleared: Livestock.animals.length }; })()`);
        check("after save + load the yard is still 6 x 5 (30 cells) and the animals are re-created later", saved.v === 3 && saved.cells === 30 && saved.herdCleared === 0, saved);
        await ev("Livestock.alwaysOut(true); Livestock.sync(); 0");
        await frames(30);
        check("...they come back with the next sync", (await ev("Livestock.animals.length")) === 3);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
