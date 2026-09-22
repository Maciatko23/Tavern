// A campfire (and what grows from it) slowly burns down: it starts lit, goes dark once its fuel runs out
// (no flame, no glow, no light at night, cooking and warming refused with a popup), and Wood/Gałąź feed it
// back up via new "Dorzuć drewna" / "Dorzuć gałąź" menu entries, capped at a maximum.
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
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            for (let by = 2; by < $gameMap.height() - 4; by++) for (let bx = 2; bx < $gameMap.width() - 4; bx++) {
                let ok = true;
                for (let y = by; y < by + 3 && ok; y++) for (let x = bx; x < bx + 3; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a free patch", !!B, B);
        const { bx, by } = B;
        const fx = bx + 1, fy = by + 1;
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || []; L.push({ id: f.nextId++, type: "campfire", x: ${fx}, y: ${fy}, last: 1, v: 3 }); f.rev++; })()`);
        await ev(`$gamePlayer.locate(${fx}, ${fy + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 4, ${by} - 3); $gameSystem.setStamina(200); 0`);
        await frames(20);
        const entry = () => J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "campfire"); return e ? { flame: e.flame.visible, glow: e.glow.alpha, puffs: e.puffs.map(p => p.visible) } : null; })()`);
        const fuel = () => ev(`Farming.fuelLeft(Farming.buildingAt(${fx}, ${fy}))`);

        // ---------------------------------------------------------------- freshly built: lit, with starting fuel
        const f0 = await fuel();
        check("a freshly built campfire starts with some hours of fuel (not already run down)", f0 > 0 && f0 <= 10, f0);
        const lit = await entry();
        check("lit: flame shown, glow on, smoke rising", lit.flame && lit.glow > 0 && lit.puffs.every(v => v), lit);

        // ---------------------------------------------------------------- burns down and goes dark
        await ev(`$gameSystem.advanceDayNight(${f0} + 1); 0`);
        await frames(10);
        const f1 = await fuel();
        check("fuel reaches 0 once that many hours pass", f1 === 0, f1);
        const dark = await entry();
        check("out of fuel: no flame, no glow, no smoke", !dark.flame && dark.glow === 0 && dark.puffs.every(v => !v), dark);
        const menuOut = await J(`Farming.menuFor(${fx}, ${fy}).entries.map(e => ({ name: e.name, enabled: e.enabled !== false }))`);
        const warm = menuOut.find(e => e.name === "Ogrzej się przy ogniu");
        check("'Ogrzej się przy ogniu' is greyed out while the fire is out", !!warm && warm.enabled === false, menuOut);
        const restBlocked = await ev(`Farming.rest(Farming.buildingAt(${fx}, ${fy}))`);
        check("rest() itself also refuses (defence in depth, not just the menu)", restBlocked === false, restBlocked);
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.rawMeat], 1); $gameParty.gainItem($dataItems[Farming.ITEM.branch], 1); 0`);
        const jobBlocked = await ev(`Farming.startJob(Farming.buildingAt(${fx}, ${fy}), "roast_meat")`);
        check("cooking is refused too, with the fire out", jobBlocked === false, jobBlocked);

        // ---------------------------------------------------------------- feeding it: wood and branches both work
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.wood], 3); $gameParty.gainItem($dataItems[Farming.ITEM.branch], 3); 0`);
        const before = await ev(`$gameParty.numItems($dataItems[Farming.ITEM.wood])`);
        const feedEntry = await J(`(function(){ const e = Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć drewna"); return e ? { enabled: e.enabled !== false, help: e.help } : null; })()`);
        check("'Dorzuć drewna' is offered and mentions the fire is out", !!feedEntry && feedEntry.enabled && /wygasł/.test(feedEntry.help), feedEntry);
        await ev(`(function(){ Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć drewna").run(); })()`);
        await frames(5);
        const afterWood = await fuel();
        check("one piece of wood is spent and adds fuel", (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.wood])`)) === before - 1 && afterWood > 0, { before, afterWood });
        const relit = await entry();
        check("relit: the flame, glow and smoke come back", relit.flame && relit.glow > 0 && relit.puffs.every(v => v), relit);
        const beforeBranch = afterWood;
        await ev(`(function(){ Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć gałąź").run(); })()`);
        await frames(5);
        const afterBranch = await fuel();
        check("a branch adds fuel too, less than wood does", afterBranch > beforeBranch && afterBranch - beforeBranch < 3, { beforeBranch, afterBranch });

        // ---------------------------------------------------------------- capped at a maximum, not stockpiled without limit
        for (let i = 0; i < 8; i++) await ev(`(function(){ Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć drewna").run(); })()`);
        await frames(5);
        const capped = await fuel();
        check("fuel is capped, not endlessly stackable", capped > afterBranch && capped <= 10, capped);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
