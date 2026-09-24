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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
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
        // just gone out, it smoulders for half an hour: thin smoke from the embers, thinning out
        await ev(`$gameSystem.advanceDayNight(${f0} + 0.1); 0`);
        await frames(40);
        const smoulder = () => J(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}), e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b === b), on = e.puffs.filter(p => p.visible);
            return { s: Math.round(Farming.smoulderOf(b) * 100) / 100, flame: e.flame.visible, glow: e.glow.alpha, n: on.length, low: on.every(p => p.y >= e.sprite.y - 65), alpha: Math.max(0, ...on.map(p => p.alpha)) }; })()`);
        const sm1 = await smoulder();
        check("6 minutes after it went out: no flame, no glow, but thin smoke still rises from the embers", !sm1.flame && sm1.glow === 0 && sm1.s > 0.7 && sm1.s < 0.9 && sm1.n >= 1 && sm1.n < 4 && sm1.low && sm1.alpha < 0.6, sm1);
        await b.shot("fire_smoulder.png");
        await ev(`$gameSystem.advanceDayNight(0.3); 0`);
        await frames(40);
        const sm2 = await smoulder();
        check("24 minutes after: still a wisp, fainter", sm2.s > 0 && sm2.s < 0.3 && sm2.n === 1 && sm2.alpha < sm1.alpha, sm2);
        await ev(`$gameSystem.advanceDayNight(0.6); 0`);
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
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.wood], 3); $gameParty.gainItem($dataItems[Farming.ITEM.branch], 3); $gameParty.gainItem($dataItems[Farming.ITEM.cone], 1); 0`);
        const before = await ev(`$gameParty.numItems($dataItems[Farming.ITEM.wood])`);
        const branchesBefore = await ev(`$gameParty.numItems($dataItems[Farming.ITEM.branch])`);
        const feedEntry = await J(`(function(){ const e = Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć drewna"); return e ? { enabled: e.enabled !== false, help: e.help } : null; })()`);
        check("'Dorzuć drewna' is offered and mentions the fire is out and the kindling", !!feedEntry && feedEntry.enabled && /wygasł/.test(feedEntry.help) && /rozpałk/.test(feedEntry.help), feedEntry);
        await ev(`(function(){ Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć drewna").run(); })()`);
        await frames(5);
        const afterWood = await fuel();
        check("one piece of wood is spent and adds fuel", (await ev(`$gameParty.numItems($dataItems[Farming.ITEM.wood])`)) === before - 1 && afterWood > 0, { before, afterWood });
        const kindled = await J(`({ cones: $gameParty.numItems($dataItems[Farming.ITEM.cone]), branches: $gameParty.numItems($dataItems[Farming.ITEM.branch]) })`);
        check("lighting the dead fire used the pine cone as kindling (the branches stay)", kindled.cones === 0 && kindled.branches === branchesBefore, { kindled, branchesBefore });
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

        // ---------------------------------------------------------------- food kept it going: it goes out (and smoulders) when the food comes off
        await ev(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}), now = Farming.clockHours(); b.fuel = 1; b.fuelSince = now - 3; delete b.outAt; b.job = { recipe: "roast_meat", start: now - 1, hours: 0.5, out: [Farming.ITEM.roastMeat, 1] }; })()`);
        await frames(5);
        const held = await J(`({ lit: Farming.fireLit(Farming.buildingAt(${fx}, ${fy})), s: Farming.smoulderOf(Farming.buildingAt(${fx}, ${fy})) })`);
        check("fuel gone 2 h ago, but the roast still on it keeps it lit (no smouldering yet)", held.lit && held.s === 0, held);
        await ev(`Farming.collectJob(Farming.buildingAt(${fx}, ${fy})); 0`);
        await frames(90);
        const off = await smoulder();
        check("the roast taken off: the fire goes out now and smoulders from this moment", !off.flame && off.s > 0.95 && off.n === 3, off);

        // ---------------------------------------------------------------- rain puts it out: no flames, only smoke; nothing burns or roasts meanwhile
        const B0 = `Farming.buildingAt(${fx}, ${fy})`;
        await ev(`(function(){ const b = ${B0}, now = Farming.clockHours(); b.fuel = 5; b.fuelSince = now; b.rainSeen = now; delete b.outAt; b.job = { recipe: "roast_meat", start: now, hours: 2, out: [Farming.ITEM.roastMeat, 1], sit: false }; Survival.forceStorm(2); })()`);
        await frames(5);
        check("before the rain it burns", await ev(`Farming.fireLit(${B0})`));
        await ev(`$gameSystem.advanceDayNight(0.5); 0`);
        await frames(40);
        const wet = await J(`(function(){ const b = ${B0}; return { lit: Farming.fireLit(b), fuel: Farming.fuelLeft(b), soaked: Math.round(b.soaked * 100) / 100, paused: Farming.jobPaused(b), left: Math.round(Farming.jobHoursLeft(b) * 100) / 100, raining: Farming.rainingHere(), note: Farming.menuFor(${fx}, ${fy}).note }; })()`);
        const wetLook = await smoulder();
        check("rain: the fire is put out at once - no flame, no glow, but smoke rises", !wet.lit && wet.raining && !wetLook.flame && wetLook.glow === 0 && wetLook.n === 3 && wetLook.s === 1, { wet, wetLook });
        check("...the wood left in it is not burnt but soaked (5 h - 0.35 h before the rain)", wet.fuel === 0 && Math.abs(wet.soaked - 4.65) < 0.05, wet);
        check("...the roast stands (paused at 1.65 h left)", wet.paused && Math.abs(wet.left - 1.65) < 0.05, wet);
        check("under the name: 'Deszcz przygasił ogień'", wet.note === "Deszcz przygasił ogień", wet.note);
        await b.shot("fire_rain.png");
        const wetMenu = await J(`(function(){ const m = Farming.menuFor(${fx}, ${fy}); const f = m.entries.find(e => e.name === "Dorzuć drewna"), w = m.entries.find(e => e.name === "Ogrzej się przy ogniu"); return { feed: f && f.enabled !== false, feedHelp: f && f.help, warm: w && w.enabled !== false, status: m.status && m.status.text, wait: m.entries.some(e => e.name === "Poczekaj przy ogniu") }; })()`);
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.wood], 2); $gameParty.gainItem($dataItems[Farming.ITEM.cone], 1); 0`);
        check("in the rain it cannot be fed or lit, nor warmed at; the roast says it stands", !wetMenu.feed && /Pada deszcz/.test(wetMenu.feedHelp) && wetMenu.warm === false && /^Stoi bez ognia/.test(wetMenu.status), wetMenu);
        check("rest() refuses too", (await ev(`Farming.rest(${B0})`)) === false);
        await ev(`$gameSystem.advanceDayNight(3); 0`);   // the rain (forced: 0.35 h from then, 2 h of storm + 1 h of rain) has stopped 0.15 h ago
        await frames(40);
        const after = await J(`(function(){ const b = ${B0}; return { lit: Farming.fireLit(b), raining: Farming.rainingHere(), paused: Farming.jobPaused(b), left: Math.round(Farming.jobHoursLeft(b) * 100) / 100, note: Farming.menuFor(${fx}, ${fy}).note }; })()`);
        const afterLook = await smoulder();
        check("after the rain it stays out ('Deszcz zgasił ogień'), the roast still stands", !after.lit && !after.raining && after.paused && Math.abs(after.left - 1.65) < 0.05 && after.note === "Deszcz zgasił ogień", after);
        check("...and smokes for half an hour after the rain, thinning", !afterLook.flame && afterLook.s > 0.6 && afterLook.s < 0.8, afterLook);
        const cone0 = await ev(`$gameParty.numItems($dataItems[Farming.ITEM.cone])`);
        await ev(`(function(){ Farming.menuFor(${fx}, ${fy}).entries.find(e => e.name === "Dorzuć drewna").run(); })()`);
        await frames(20);
        const relit2 = await J(`(function(){ const b = ${B0}; return { lit: Farming.fireLit(b), fuel: Math.round(Farming.fuelLeft(b) * 100) / 100, paused: Farming.jobPaused(b), left: Math.round(Farming.jobHoursLeft(b) * 100) / 100, cones: $gameParty.numItems($dataItems[Farming.ITEM.cone]), note: Farming.menuFor(${fx}, ${fy}).note }; })()`);
        check("lit again with kindling: it burns, the soaked wood too (4.65 + 3 h), the roast goes on from 1.65 h", relit2.lit && relit2.cones === cone0 - 1 && Math.abs(relit2.fuel - 7.65) < 0.05 && !relit2.paused && Math.abs(relit2.left - 1.65) < 0.05 && /^Zgaśnie za 7 godz\. 40 min$/.test(relit2.note), relit2);

        // ---------------------------------------------------------------- roasting on a stick when the rain comes: he gets up, the raw meat back in the bag
        await ev(`(function(){ const b = ${B0}; delete b.job; $gameParty.gainItem($dataItems[Farming.ITEM.rawMeat], 1); $gamePlayer.locate(${fx}, ${fy + 1}); $gamePlayer.setDirection(8); })()`);
        await frames(5);
        const raw0 = await ev(`$gameParty.numItems($dataItems[Farming.ITEM.rawMeat])`);
        await ev(`Farming.startJob(${B0}, "roast_meat"); Survival.forceStorm(1); 0`);
        let sitting = null;
        for (let i = 0; i < 30; i++) { await frames(2); sitting = await J(`({ job: !!${B0}.job, sit: !!(${B0}.job && ${B0}.job.sit), swing: $gamePlayer.isToolSwinging() })`); if (sitting.sit) break; }
        let rained = null;
        for (let i = 0; i < 60; i++) { await frames(10); rained = await J(`({ job: !!${B0}.job, swing: $gamePlayer.isToolSwinging(), lit: Farming.fireLit(${B0}), raw: $gameParty.numItems($dataItems[Farming.ITEM.rawMeat]), done: $gameParty.numItems($dataItems[Farming.ITEM.roastMeat]) })`); if (!rained.job && !rained.swing) break; }
        check("on a stick: the rain comes before it is done - he gets up, nothing roasted, the raw meat back, the fire out", sitting.sit && !rained.job && !rained.swing && !rained.lit && rained.raw === raw0, { sitting, rained, raw0 });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
