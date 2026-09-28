// Tests the new progression in the real game: loose stones, hand crafting at the sawmill / forge, new costs, hand-pickable rubble.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(10); 0");
        await sleep(800);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const put = (x, y, d) => ev(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d || 2}); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); 0`);

        // ---------- data
        const costs = await ev("JSON.stringify(Object.fromEntries(Object.entries(Farming.BUILDINGS).map(([k,v])=>[k,v.cost.map(c=>c[0]+'x'+c[1]).join('+')])))");
        console.log("costs:", costs);
        const c = JSON.parse(costs);
        check("campfire and scarecrow still cost raw wood", c.campfire === "61x6+64x6" && c.scarecrow === "61x3", { campfire: c.campfire, scarecrow: c.scarecrow });
        check("the sawmill costs only raw materials (no planks: no chicken-and-egg)", c.sawmill === "61x10+64x3", c.sawmill);
        check("all other wooden buildings use planks (80), none uses wood (61)", ["fence", "bench", "coop", "hive", "chest_s", "chest_l", "compost", "brewery", "bakery", "brickworks", "forge"].every(k => c[k].includes("80x") && !/(^|\+)61x/.test(c[k])), c);
        check("nails (88) only in the big chest, the brewery, the animal yards (cowshed, coop, pen - the user's, 2026-09-26), the smokehouse, the hut with its bed and larder and the rain barrel (2026-09-27)", Object.entries(c).filter(([k, v]) => /88x/.test(v)).map(([k]) => k).sort().join() === "barrel,bed,brewery,chest_l,coop,cowshed,hut,larder,pen,smokehouse", Object.entries(c).filter(([k, v]) => /88x/.test(v)).map(([k]) => k).sort().join());
        check("the forge itself needs no nails or iron (bricks come first)", c.forge === "80x4+64x10+84x6", c.forge);
        check("nails item exists with its icon", await ev("$dataItems[88].name === 'Gwoździe' && $dataItems[88].iconIndex === 344"));
        check("the pickaxe is not in the start inventory and there is no tool chest any more", (await count(63)) === 0 && (await ev("!$dataMap.events.some(e => e && e.pages.some(p => p.list.some(c => c.code === 126 && [60, 62, 63, 65, 66].includes(c.parameters[0]))))")));

        // ---------- loose stones
        await ev("Farming; 0");
        const stones = await ev(`(function(){ let n = 0, list = []; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { const s = Farming.stoneSpot(x, y); if (s === undefined) return "wait"; if (Farming.stoneAt(x, y)) { n++; if (list.length < 3) list.push([x, y]); } } return { n, list }; })()`);
        check("loose stones lie on the map (about 5% of free grass)", stones !== "wait" && stones.n >= 15 && stones.n <= 120, stones);
        const [sx, sy] = stones.list[0];
        const layer = await ev("({entries: SceneManager._scene._spriteset._stoneLayer._entries.length})");
        const gatherAll = await ev(`(function(){ let n = 0; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) if (Farming.gatherAt(x, y)) n++; return n; })()`);
        check("every gatherable (stones, flax, herbs) is drawn, one sprite each", layer.entries === gatherAll, { layer, gatherAll });
        await ev("$gameSystem.changeStamina(100); 0");
        await put(sx - 1, sy, 6);
        const before = await count(64), st0 = await ev("$gameSystem.stamina()");
        await ev("Input._currentState.ok = true; 0"); await frames(2); await ev("Input._currentState.ok = false; 0");
        await frames(70);
        const after = await count(64);
        check("the action button picks up the stone in front (+1 Kamień, no tool needed)", after === before + 1, { before, after });
        check("picking costs a little stamina", (await ev("$gameSystem.stamina()")) < st0, { st0, now: await ev("$gameSystem.stamina()") });
        check("the picked stone is gone from the ground", (await ev(`Farming.stoneAt(${sx}, ${sy})`)) === false);
        await frames(4);
        const layer2 = await ev("SceneManager._scene._spriteset._stoneLayer._entries.length");
        check("and its sprite disappears", layer2 === gatherAll - 1, { layer2 });
        await ev("$gameSystem.advanceDayNight(24 * 4); 0");
        check("it comes back after 4 days", (await ev(`Farming.stoneAt(${sx}, ${sy})`)) === true);

        // ---------- the sawmill: hand sawing, pickaxe
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; const B = f.buildings[3] = f.buildings[3] || [];
            const add = (type, x, y) => { B.push({ id: f.nextId++, type, x, y, last: 1 }); for (let i = 0; i < Farming.BUILDINGS[type].w; i++) P[(x + i) + "," + y] = { s: "cleared" }; };
            add("sawmill", 26, 5); add("forge", 30, 5); add("workbench", 22, 5); f.rev++; })()`);
        await frames(4);
        const menu = await ev("JSON.stringify(Farming.menuFor(26, 5).entries.map(e => [e.name, e.enabled !== false]))");
        console.log("sawmill menu:", menu);
        check("sawmill menu offers sawing (plain and with the saw); the pickaxe moved to the workbench", /Piłuj deski/.test(menu) && /Piłuj deski piłą/.test(menu) && !/kilof/.test(menu), menu);
        await ev("$gameParty.gainItem($dataItems[61], 8); $gameParty.gainItem($dataItems[77], 3); $gameParty.gainItem($dataItems[64], 3); 0");
        const h0 = await ev("[$gameSystem.dayNightDay(), $gameSystem.dayNightHour()]"), stam0 = await ev("$gameSystem.stamina()");
        const ok1 = await ev("Farming.craftManual(Farming.buildingAt(26, 5), Farming.BUILDINGS.sawmill.recipes.find(r => r.id === 'planks'))");
        await frames(120);
        const w = await count(61), pl = await count(80);
        const h1 = await ev("[$gameSystem.dayNightDay(), $gameSystem.dayNightHour()]"), stam1 = await ev("$gameSystem.stamina()");
        check("sawing: 3 wood -> 2 planks", ok1 === true && pl === 2 && w === 5, { wood: w, planks: pl });
        check("sawing takes 2 game hours and 6 stamina (time passes in front of you)", Math.abs(((h1[0] * 24 + h1[1]) - (h0[0] * 24 + h0[1])) - 2) < 0.5 && Math.round(stam0 - stam1) === 6, { h0, h1, stam0, stam1 });
        // the fade must have finished and the player is free again
        check("player free again after sawing", (await ev("$gamePlayer.canMove() && $gameScreen.brightness() > 200")) === true, await ev("({b:$gameScreen.brightness(), can:$gamePlayer.canMove()})"));
        const ok2 = await ev("Farming.craftManual(Farming.buildingAt(22, 5), Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'pick_stone'))");
        await frames(120);
        check("pickaxe made from 2 wood + 3 branches + 3 stones", ok2 === true && (await count(63)) === 1 && (await count(77)) === 0 && (await count(64)) >= 0, { pick: await count(63), branches: await count(77), wood: await count(61) });
        const again = await ev("Farming.craftManual(Farming.buildingAt(22, 5), Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'pick_stone'))");
        check("a second pickaxe is refused", again === false && (await count(63)) === 1);

        // ---------- the forge: smelting runs by itself, nails are hand work and available while it burns
        await ev("$gameParty.gainItem($dataItems[85], 3); $gameParty.gainItem($dataItems[79], 2); $gameParty.gainItem($dataItems[86], 1); 0");
        const forge = "Farming.buildingAt(30, 5)";
        await ev(`Farming.startJob(${forge}, "iron"); 0`);
        await frames(90);
        const jobRunning = await ev(`!!${forge}.job`);
        const fmenu = await ev("(function(){ const m = Farming.menuFor(30, 5); return JSON.stringify({ status: m.status && m.status.text, entries: m.entries.map(e => [e.name, e.enabled !== false]) }); })()");
        console.log("forge menu while smelting:", fmenu);
        check("smelting started; the menu shows the running job (under its name) AND the anvil", jobRunning && /"status":"Trwa wytapianie: Żelazo/.test(fmenu) && /Wykuj gwoździe/.test(fmenu), fmenu);
        const okN = await ev(`Farming.craftManual(${forge}, Farming.BUILDINGS.forge.recipes.find(r => r.id === 'nails'))`);
        await frames(120);
        check("nails: 1 iron -> 10 nails, while the furnace still burns", okN === true && (await count(88)) === 10 && (await count(86)) === 0 && (await ev(`!!${forge}.job`)) === true, { nails: await count(88) });

        // ---------- hand-pickable rubble from the map (no pickaxe involved)
        await ev("$gameParty.loseItem($dataItems[63], 1); 0");
        const rub = await ev("(()=>{const e=$gameMap.events().find(e=>e.event().pages[0].image.characterName==='!$Rock_Rubble');return e?{x:e.x,y:e.y,id:e._eventId}:null})()");
        if (rub) {
            const s0 = await count(64);
            await put(rub.x - 1, rub.y, 6);
            await ev("Input._currentState.ok = true; 0"); await frames(2); await ev("Input._currentState.ok = false; 0");
            await frames(90);
            const s1 = await count(64);
            check("rubble on the map is picked up by hand without a pickaxe", s1 > s0, { s0, s1, rub });
        } else console.log("(no rubble event on this map to test)");
    } catch (e) { console.log("ERR", e.message); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
