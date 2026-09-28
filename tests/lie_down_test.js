// Resting on the grass (no building): "Odpocznij" on natural grass - he sits down (the sitting swing, kind 11, hands folded, still)
// and rests on: every second of real time an hour of the day goes by and +20 stamina comes back (+10 in the rain), until full (he
// gets up by himself), until the player gets up (a direction key, O), until a boar or wolves come at him, or at the hunger ceiling.
// The need of sleep: awake 16 hours, a rest brings the strength back only to 50% - a night's sleep resets it.
// The ladder an hour: grass 20, bench 30, campfire (tripod, cauldron) 40, shelter 50.
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
        await sleep(2000);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting && Hunting.RAID) Hunting.RAID.perHour = 0; if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Livestock) Livestock.auto(false); Survival.calmWeather(); $gameSystem.setDayNightHour(8); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const clock = () => ev("$gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()");
        const waitSwing = async (max = 120) => { for (let i = 0; i < max; i++) { if (!(await ev("!!$gamePlayer._toolSwing"))) break; await frames(5); } await frames(5); };
        const state = () => J("({ st: Math.round($gameSystem.stamina()), sitting: !!$gamePlayer._toolSwing, kind: $gamePlayer._toolSwing && $gamePlayer._toolSwing._swingKind, still: !!($gamePlayer._toolSwing && $gamePlayer._toolSwing.opts && $gamePlayer._toolSwing.opts.still), canMove: $gamePlayer.canMove() })");

        // a meadow (natural, untouched grass, nothing lying around)
        const B = await J(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush" && !(window.Puddles && Puddles.wetAt(x, y));
            for (let by = 3; by < $gameMap.height() - 7; by++) for (let bx = 3; bx < $gameMap.width() - 8; bx++) {
                let ok = true;
                for (let y = by - 1; y < by + 7 && ok; y++) for (let x = bx - 1; x < bx + 8 && ok; x++) if (!$gameMap.isValid(x, y) || $gameMap.eventsXy(x, y).length > 0) ok = false;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 7 && ok; x++) if (!free(x, y)) ok = false;
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a meadow", !!B, B);
        const { bx, by } = B;
        const tx = bx + 4, ty = by + 4;
        await ev(`$gamePlayer.locate(${tx}, ${ty - 1}); $gamePlayer.setDirection(2); $gameSystem._lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(); $gameSystem.setStamina(40); 0`);
        await frames(15);
        const menu = () => J(`(function(){ const m = Farming.menuFor(${tx}, ${ty}); return { title: m.title, entries: m.entries.map(e => ({ name: e.name, right: e.right, enabled: e.enabled !== false, help: e.help })) }; })()`);
        const runRest = () => ev(`(function(){ const m = Farming.menuFor(${tx}, ${ty}); m.entries.find(e => e.name === "Odpocznij").run(); return 0; })()`);

        // the menu on the grass: one entry
        const m0 = await menu();
        check("the grass menu: 'Odpocznij' (+20/godz.) first, then Wytwórz..., Wykop ziemię, Zagrab ziemię, Postaw...",
            m0.entries.map(e => e.name).join() === "Odpocznij,Wytwórz...,Wykop ziemię,Zagrab ziemię,Postaw..." && m0.entries[0].right === "+20/godz." && m0.entries[0].enabled, m0.entries.map(e => e.name + " " + e.right));
        check("...its help says how it works (an hour a second, gets up when rested or when you like)", /co sekundę mija godzina/.test(m0.entries[0].help) && /Wstajesz sam/.test(m0.entries[0].help), m0.entries[0].help);

        // resting: sits (kind 11, still), about +20 and an hour a second, gets up by himself at full
        const h0 = await clock();
        await runRest();
        await frames(40);
        const s1 = await state();
        check("'Odpocznij': he sits down (the sitting swing, still), cannot walk off meanwhile", s1.kind === 11 && s1.still && !s1.canMove, s1);
        const t1 = await clock(), st1 = await ev("$gameSystem.stamina()");
        await frames(60);
        const t2 = await clock(), st2 = await ev("$gameSystem.stamina()");
        check("...a second of sitting: about an hour goes by and about +20 comes back", Math.abs(t2 - t1 - 1) < 0.15 && Math.abs(st2 - st1 - 20) < 3, { hours: +(t2 - t1).toFixed(2), gain: +(st2 - st1).toFixed(1) });
        await waitSwing();
        const s2 = await state(), h2 = await clock();
        check("...at full strength he gets up by himself: 40 -> 100 in about 3 hours", s2.st === 100 && !s2.sitting && s2.canMove && Math.abs(h2 - h0 - 3) < 0.25, { s2, hours: +(h2 - h0).toFixed(2) });
        const m1 = await menu();
        check("at full strength it is greyed out: 'Nie jesteś zmęczony.'", !m1.entries[0].enabled && /Nie jesteś zmęczony/.test(m1.entries[0].help), m1.entries[0]);

        // the player gets up whenever he likes: a direction key, O
        for (const [label, keyName] of [["a direction key", "down"], ["O", "ok"]]) {
            await ev("$gameSystem.setStamina(30); 0");
            await runRest();
            await frames(70);
            await ev(`Input._currentState["${keyName}"] = true; 0`);
            await frames(3);
            await ev(`Input._currentState["${keyName}"] = false; 0`);
            await waitSwing();
            const s = await state();
            check("he gets up when the player presses " + label + " (part rested, standing)", s.st > 30 && s.st < 90 && !s.sitting && s.canMove, s);
        }

        // rain: +10 an hour
        await ev("window.__cw = Survival.currentWeather; Survival.currentWeather = () => ({ type: 'rain', start: 0, end: 48, power: 4 }); $gameSystem.setStamina(40); 0");
        const wet = await menu();
        check("in the rain the wet grass gives +10 an hour (said so)", wet.entries[0].right === "+10/godz." && /deszczu/.test(wet.entries[0].help), wet.entries[0]);
        await runRest();
        await frames(40);
        const w1 = await ev("$gameSystem.stamina()");
        await frames(60);
        const w2 = await ev("$gameSystem.stamina()");
        check("...and sitting in it gives about +10 a second", Math.abs(w2 - w1 - 10) < 2, +(w2 - w1).toFixed(1));
        await ev("Input._currentState.down = true; 0"); await frames(3); await ev("Input._currentState.down = false; Survival.currentWeather = window.__cw; 0");
        await waitSwing();

        // danger: a boar coming at him - he gets up
        await ev("$gameSystem.setStamina(30); 0");
        await runRest();
        await frames(60);
        await ev(`(function(){ const bo = Hunting.spawn("boar", ${tx} + 5, ${ty - 1}); bo.setMode("warn", 60); window.__boar = bo; return 0; })()`);
        await frames(20);
        await waitSwing();
        const d = await state();
        check("a boar coming at him: he gets up before it is on him", !d.sitting && d.st < 100, d);
        await ev("Hunting.removeAnimal(__boar); 0");

        // hunger and thirst: the strength stops lower - the rest ends there (and does not sit on forever)
        await ev("Needs.setEnabled(true); const n = Needs.state(); n.food = 5; n.water = 5; $gameSystem.setStamina(10); 0");
        const cap = await ev("Math.round($gameSystem.maxStamina() * Needs.capRatio())");
        await runRest();
        await waitSwing(200);
        const hc = await state(), capNow = await ev("Math.round($gameSystem.maxStamina() * Needs.capRatio())");
        check("starving and parched: he gets up at the lower ceiling (it sinks while the hours go by: " + cap + " -> " + capNow + "), not sitting on", !hc.sitting && Math.abs(hc.st - capNow) <= 1 && capNow < 100, { hc, cap, capNow });
        const hm = await menu();
        check("...then the grass says why: eat and drink", !hm.entries[0].enabled && /zjedz i napij się/.test(hm.entries[0].help), hm.entries[0]);
        await ev("const n2 = Needs.state(); n2.food = 100; n2.water = 100; Needs.setEnabled(false); 0");

        // the need of sleep: awake 16 hours -> rests stop at 50% (15 hours: not yet)
        await ev(`$gameSystem._lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - 15; $gameSystem.setStamina(30); 0`);
        const notYet = await J("({ cap: Farming.restCap(), help: Farming.menuFor(" + tx + ", " + ty + ").entries[0].help })");
        check("awake 15 hours: no cap yet (rests to full), the menu says nothing about sleep", notYet.cap === 100 && !/Nie spałeś/.test(notYet.help), notYet);
        await ev(`$gameSystem._lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - 17; $gameSystem.setStamina(30); 0`);
        const tired = await menu();
        check("awake 17 hours: the menu says so (no sleep: at most 50%)", /Nie spałeś od 17 godz/.test(tired.entries[0].help) && /50%/.test(tired.entries[0].help), tired.entries[0]);
        await runRest();
        await waitSwing();
        const capped = await J("({ st: Math.round($gameSystem.stamina()), cap: Farming.restCap() })");
        check("...resting stops at 50 (of 100)", capped.st === 50 && capped.cap === 50, capped);
        const m2 = await menu();
        check("...then it is greyed out: sleep first", !m2.entries[0].enabled && /Prześpij się/.test(m2.entries[0].help), m2.entries[0]);
        await ev("$gameSystem.sleepUntilHour(7); 0");
        const after = await J("({ awake: Farming.awakeHours(), cap: Farming.restCap() })");
        check("a night's sleep: awake 0 hours again, rests to full again", after.awake < 0.1 && after.cap === 100, after);

        // the ladder
        const ladder = await J("({ campfire: Farming.BUILDINGS.campfire.rest, tripod: Farming.BUILDINGS.tripod.rest, cauldron: Farming.BUILDINGS.cauldron.rest, bench: Farming.BUILDINGS.bench.rest, shelter: Farming.BUILDINGS.shelter.rest })");
        check("the ladder an hour: grass 20, bench 30, campfire (tripod, cauldron) 40, shelter 50", ladder.bench === 30 && ladder.campfire === 40 && ladder.tripod === 40 && ladder.cauldron === 40 && ladder.shelter === 50, ladder);
        // raked ground: no resting there
        await ev(`$gameParty.gainItem($dataItems[65], 1); $gameSystem.setStamina(100); Farming.rake(${bx + 5}, ${by + 4}); 0`);
        await frames(120);
        const raked = await J(`(function(){ const m = Farming.menuFor(${bx + 5}, ${by + 4}); return { title: m.title, names: m.entries.map(e => e.name) }; })()`);
        check("raked (no longer natural) ground offers no rest", raked.title === "Zagrabiona ziemia" && !raked.names.some(n => /Odpocznij/.test(n)), raked);

        // saved while sitting, then loaded: the rest is not taken over from the file (its callbacks do not survive it - loading
        // such a save threw "opts.holdWhile is not a function" every frame and the game stood still)
        await ev(`$gameSystem.setStamina(30); 0`);
        await runRest();
        await frames(20);
        const sat = await ev("!!$gamePlayer._toolSwing");
        await ev("DataManager.saveGame(1).then(() => DataManager.loadGame(1)).then(() => { $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, 2, 0); $gamePlayer.requestMapReload(); SceneManager.goto(Scene_Map); }); 0");
        for (let i = 0; i < 60; i++) { await sleep(250); if (await ev("SceneManager._scene.constructor.name === 'Scene_Map' && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()")) break; }
        const f0 = await ev("Graphics.frameCount");
        await sleep(1000);
        const loaded = await J("({ swing: !!$gamePlayer._toolSwing, frames: Graphics.frameCount, canMove: $gamePlayer.canMove(), err: (document.getElementById('errorPrinter') || {}).innerText || '' })");
        check("saved while sitting and loaded: the game runs on, he is no longer sitting and can walk", sat && !loaded.swing && loaded.frames > f0 + 20 && loaded.canMove && !loaded.err, Object.assign({ sat, f0 }, loaded));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
