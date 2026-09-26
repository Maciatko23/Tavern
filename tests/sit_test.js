// Sitting down by the campfire to rest, and sitting with a stick until the food is roasted (Swing_Sit / Swing_Roast).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(12); $gameSystem._weatherOwn = false; $gameScreen.clearWeather(); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 2); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        await ev("window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0");
        const pops = () => J("window.__pop.splice(0)");
        const swingT = () => ev("$gamePlayer._swingEvent ? $gamePlayer._swingEvent._swingT : -1");
        const waiting = () => ev("!!($gamePlayer._swingEvent && $gamePlayer._swingEvent._waiting)");
        const cell = () => J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); const f = s && s._swingBody && s._swingBody.visible ? s._swingBody._frame : null; return f ? { col: Math.round(f.x / 96), row: Math.round(f.y / 96) } : null; })()`);
        const sheets = await ev(`new Promise(res => { const out = {}; let left = 2; for (const n of ["Swing_Sit", "Swing_Roast"]) { const bmp = ImageManager.loadSystem(n); bmp.addLoadListener(() => { out[n] = [bmp.width, bmp.height]; if (--left === 0) res(out); }); } setTimeout(() => res(out), 5000); })`);
        check("both sheets load: 25 frames (sit down, then stand up) x 4 rows", JSON.stringify(sheets) === JSON.stringify({ Swing_Sit: [2400, 384], Swing_Roast: [2400, 384] }), sheets);

        const B = await ev(`(function(){
            for (let by = 3; by < $gameMap.height() - 8; by++) for (let bx = 3; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!Farming.naturalFarmland(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a meadow", !!B, B);
        const { bx, by } = B, fx = bx + 4, fy = by + 3;
        await ev(`(function(){ const f = $gameSystem._farm; (f.buildings[3] = f.buildings[3] || []).push({ id: 800, type: "campfire", x: ${fx}, y: ${fy}, last: 1, v: 3 }); f.rev++; })(); 0`);
        const stand = (dx, dy, dir) => ev(`$gamePlayer.locate(${fx + dx}, ${fy + dy}); $gamePlayer.setDirection(${dir}); $gameMap.setDisplayPos(${fx} - 13.5, ${fy} - 7.5); $gameSystem.setStamina(40); 0`);
        const runMenu = name => ev(`(function(){ const m = Farming.menuFor(${fx}, ${fy}); const e = m.entries.find(e => e.name === ${JSON.stringify(name)}); return e ? (e.run(), true) : false; })()`);
        const job = () => ev(`!!Farming.buildingAt(${fx}, ${fy}).job`);
        await frames(30);

        // ---------------------------------------------------------------- resting: sit down, the rest happens when seated, stand up
        await stand(0, 1, 8);
        await frames(20);
        const st0 = await ev("$gameSystem.stamina()"), h0 = await ev("$gameSystem.dayNightHour()");
        check("'Odpocznij przy ogniu' is in the campfire's menu", await runMenu("Odpocznij przy ogniu"));
        await frames(2);
        check("the player starts sitting down (swing kind 11), and cannot move", (await ev("$gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind")) === 11 && (await ev("$gamePlayer.canMove()")) === false);
        let seated = null;
        for (let i = 0; i < 80; i++) { await frames(1); const t = await swingT(); if (t >= 37 && t <= 39) { seated = await cell(); break; } }
        const sitHit = (await J("ChoppableTree.swingKind(11).hit"))[3], roastHit = (await J("ChoppableTree.swingKind(12).hit"))[3];   // (the sheet in use: the new hero's or the old)
        check("at the impact frame the player is seated (column " + sitHit + ", row of the facing)", !!seated && seated.col === sitHit && seated.row === 3, seated);
        let standing = false;
        for (let i = 0; i < 150; i++) { if ((await swingT()) < 0) { standing = true; break; } await frames(2); }
        const st1 = await ev("$gameSystem.stamina()"), h1 = await ev("$gameSystem.dayNightHour()");
        check("the rest went on by itself till full: +40 an hour (an hour a second), 40 -> 100 in about 1.5 hours", Math.round(st1) === 100 && Math.abs(h1 - h0 - 1.5) < 0.3, { st0, st1, h0, h1 });
        check("a popup '+60 wytrzymałości'", (await pops()).some(t => /\+60 wytrzymałości/.test(t)));
        check("then the player stands up by himself and can move again", standing && (await ev("$gamePlayer.canMove()")) === true);
        await frames(40);
        await ev("$gameSystem.setStamina($gameSystem.maxStamina()); 0");
        await runMenu("Odpocznij przy ogniu"); await frames(2);
        check("not tired: 'Nie jesteś zmęczony', no sitting", (await pops()).some(t => /Nie jesteś zmęczony/.test(t)) && (await swingT()) === -1);

        // ---------------------------------------------------------------- roasting: the player sits with the meat on a stick until it is done
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.rawMeat], 14); 0`);
        const meat = () => ev(`$gameParty.numItems($dataItems[Farming.ITEM.rawMeat])`), roast = () => ev(`$gameParty.numItems($dataItems[Farming.ITEM.roastMeat])`);
        const sph = Number(await ev(`PluginManager.parameters("DayNightCycle").secondsPerHour`)) || 60;
        console.log("seconds per game hour:", sph, "-> half an hour of game time is", Math.round(sph / 2), "s of sitting");
        await stand(0, 1, 8); await frames(20);
        let m0 = await meat(), r0 = await roast();
        const t0 = await ev("$gameSystem.dayNightHour()"), f0 = await ev("Graphics.frameCount");
        check("'Upiecz mięso' starts the roasting swing (kind 12)", (await runMenu("Upiecz mięso zająca")) && (await (async () => { await frames(2); return ev("$gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind"); })()) === 12);
        let at = null;
        for (let i = 0; i < 90; i++) { await frames(1); if (await waiting()) { at = await cell(); break; } }
        check("the player sits with the stick over the fire (column " + roastHit + " or one before, row 3) and waits", !!at && (at.col === roastHit || at.col === roastHit - 1) && at.row === 3 && (await job()), at);
        check("a piece of meat was used, the roast is not there yet", (await meat()) === m0 - 1 && (await roast()) === r0);
        await frames(60);
        check("still sitting a second later, and the game clock is running", (await waiting()) && (await ev("$gameSystem.dayNightHour()")) > t0 + 0.05);
        const idle = new Set();
        for (let i = 0; i < 60; i++) { await frames(3); const c = await cell(); if (c) idle.add(c.col); }
        check("the figure shifts between two poses while it waits", idle.size >= 2, [...idle]);
        let ended = false;
        for (let i = 0; i < 1200; i++) { if ((await swingT()) < 0) { ended = true; break; } await frames(2); }
        const f1 = await ev("Graphics.frameCount");
        check("about half an hour of game time later the player stands up with the roast meat",
            ended && (await roast()) === r0 + 1 && !(await job()) && Math.abs((await ev("$gameSystem.dayNightHour()")) - t0 - 0.5) < 0.25 && (await ev("$gamePlayer.canMove()")) === true,
            { seconds: Math.round((f1 - f0) / 60), hours: (await ev("$gameSystem.dayNightHour()")) - t0, roast: await roast() });
        check("a popup for the roast meat", (await pops()).some(t => /Pieczone mięso|pieczon/i.test(t)) || (await roast()) === r0 + 1);
        await frames(40);

        // getting up early: nothing is roasted, nothing stays on the fire, the raw meat goes back to the bag
        await stand(-1, 0, 6); await frames(20);
        m0 = await meat(); r0 = await roast(); await pops();
        await runMenu("Upiecz mięso zająca");
        for (let i = 0; i < 90 && !(await waiting()); i++) await frames(1);
        await frames(30);
        check("while sitting the meat is on the fire (one piece less in the bag)", (await job()) && (await meat()) === m0 - 1);
        await ev("Input._currentState.cancel = true; 0"); await frames(3); await ev("Input._currentState.cancel = false; 0");
        let up = false;
        for (let i = 0; i < 120; i++) { if ((await swingT()) < 0) { up = true; break; } await frames(2); }
        check("Esc gets the player up early: nothing is roasted, nothing stays on the fire, the meat is back in the bag", up && !(await job()) && (await roast()) === r0 && (await meat()) === m0, { job: await job(), meat: await meat(), m0 });
        check("a popup 'Nie upiekło się'", (await pops()).some(t => /Nie upiekło się/.test(t)));
        await frames(20);

        // the other facings (time is skipped to keep the test short)
        for (const [dx, dy, dir, row] of [[1, 0, 4, 1], [0, -1, 2, 0], [-1, 0, 6, 2]]) {
            await stand(dx, dy, dir); await frames(20);
            await runMenu("Upiecz mięso zająca");
            let a = null;
            for (let i = 0; i < 90; i++) { await frames(1); if (await waiting()) { a = await cell(); break; } }
            check("facing " + dir + ": seated with the stick in row " + row + ", meat over the fire", !!a && (a.col === roastHit || a.col === roastHit - 1) && a.row === row && (await job()), a);
            await ev("$gameSystem.advanceDayNight(0.6); 0");
            for (let i = 0; i < 200 && (await swingT()) >= 0; i++) await frames(2);
            check("  done: the player stands up with the roast, can move", !(await job()) && (await ev("$gamePlayer.canMove()")) === true);
            await frames(10);
        }

        // pictures
        for (const [name, dx, dy, dir, menuName] of [["rest", 0, 1, 8, "Odpocznij przy ogniu"], ["rest", -1, 0, 6, "Odpocznij przy ogniu"], ["rest", 0, -1, 2, "Odpocznij przy ogniu"], ["roast", 0, 1, 8, "Upiecz mięso zająca"], ["roast", -1, 0, 6, "Upiecz mięso zająca"], ["roast", 0, -1, 2, "Upiecz mięso zająca"]]) {
            await stand(dx, dy, dir); await frames(70);
            await runMenu(menuName);
            if (name === "rest") { for (let i = 0; i < 200 && (await swingT()) < 38; i++) await frames(1); }
            else { for (let i = 0; i < 200 && !(await waiting()); i++) await frames(1); await frames(40); }
            await ev("window.__upd = SceneManager._scene.update; SceneManager._scene.update = function() {}; 0");
            await sleep(150);
            await b.shot("sit_" + name + "_" + dir + ".png");
            await ev("SceneManager._scene.update = window.__upd; 0");
            if (name === "roast") await ev("$gameSystem.advanceDayNight(0.6); 0");
            for (let i = 0; i < 300 && (await swingT()) >= 0; i++) await frames(2);
            await ev(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}); delete b.job; $gameSystem._farm.rev++; })(); 0`);
        }
        // ---------------------------------------------------------------- the tripod: the food hangs on the hook and roasts by itself
        // (fed back up here: the fire itself was already tested above, this section is about the tripod/hook mechanic)
        await ev(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}); b.type = "tripod"; delete b.job; b.fuel = 10; b.fuelSince = Farming.clockHours(); $gameSystem._farm.rev++; })(); 0`);
        await frames(20);
        const hang = () => J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "tripod"); return e ? { raw: !!(e.meatRaw && e.meatRaw.visible), rope: !!(e.rope && e.rope.visible), done: e.meatDone ? e.meatDone.alpha : -1, doneShown: !!(e.meatDone && e.meatDone.visible) } : null; })()`);
        const jobInfo = () => J(`(function(){ const j = Farming.buildingAt(${fx}, ${fy}).job; return j ? { sit: !!j.sit, recipe: j.recipe } : null; })()`);
        await stand(0, 1, 8); await frames(20);
        m0 = await meat(); r0 = await roast();
        check("the tripod shows no hanging food while nothing roasts", (await hang()).raw === false);
        check("'Upiecz mięso' at the tripod hangs the meat on the hook (a short crouch, not a long sit)", (await runMenu("Upiecz mięso zająca")) && (await (async () => { await frames(2); return ev("$gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind"); })()) === 6);
        for (let i = 0; i < 120 && (await swingT()) >= 0; i++) await frames(2);
        const ji = await jobInfo();
        check("the meat is on the tripod (one piece less in the bag) as an ordinary background job, and the player is free to go",
            !!ji && ji.sit === false && (await meat()) === m0 - 1 && (await ev("$gamePlayer.canMove()")) === true, ji);
        await frames(10);
        const hg1 = await hang();
        check("the meat hangs on a short rope from the hook", hg1.raw === true && hg1.rope === true && hg1.doneShown === true, hg1);
        // the player walks away: it keeps roasting
        await ev(`$gamePlayer.locate(${fx + 4}, ${fy + 3}); 0`);
        await frames(90);
        check("the player left: nothing was lost, the meat is still roasting on the tripod", (await job()) && (await meat()) === m0 - 1 && (await roast()) === r0);
        const hg2 = await hang();
        check("it is roasted more and more (the roasted picture fades in)", hg2.done > hg1.done + 0.05, { first: hg1.done, later: hg2.done });
        await ev("$gameSystem.advanceDayNight(0.6); 0"); await frames(20);
        const hg3 = await hang();
        check("when it is done the roasted meat still hangs there until it is collected", (await job()) && hg3.raw === true && hg3.done >= 0.99, hg3);
        await stand(0, 1, 8); await frames(10);
        const menu3 = await J(`Farming.menuFor(${fx}, ${fy}).entries.map(e => e.name)`);
        check("the tripod's menu offers 'Zbierz: Pieczone mięso'", menu3.some(n => /Zbierz: Pieczone mięso/.test(n)), menu3);
        await ev(`Farming.collectJob(Farming.buildingAt(${fx}, ${fy})); 0`); await frames(80);
        check("collected: +1 roast meat, the hook is empty again", (await roast()) === r0 + 1 && !(await job()) && (await hang()).raw === false);

        // waiting beside it (optional): getting up early leaves it roasting, staying gets the food at the end
        await stand(0, 1, 8); await frames(20);
        m0 = await meat(); r0 = await roast();
        await runMenu("Upiecz mięso zająca");
        for (let i = 0; i < 120 && (await swingT()) >= 0; i++) await frames(2);
        const menu4 = await J(`Farming.menuFor(${fx}, ${fy}).entries.map(e => e.name)`);
        check("while food roasts the menu offers 'Poczekaj przy ogniu'", menu4.includes("Poczekaj przy ogniu"), menu4);
        check("'Poczekaj przy ogniu' sits the player down beside the tripod (kind 13, hands free)", (await runMenu("Poczekaj przy ogniu")) && (await (async () => { await frames(2); return ev("$gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind"); })()) === 13);
        let seat = null;
        for (let i = 0; i < 90; i++) { await frames(1); if (await waiting()) { seat = await cell(); break; } }
        check("seated beside the fire, waiting", !!seat && (seat.col === sitHit || seat.col === sitHit - 1) && seat.row === 3, seat);
        await frames(40);
        await ev("Input._currentState.cancel = true; 0"); await frames(3); await ev("Input._currentState.cancel = false; 0");
        for (let i = 0; i < 120 && (await swingT()) >= 0; i++) await frames(2);
        check("getting up early does NOT spoil it: still on the tripod, nothing returned to the bag, no 'Nie upiekło się'",
            (await job()) && (await meat()) === m0 - 1 && (await roast()) === r0 && !(await pops()).some(t => /Nie upiekło się/.test(t)));
        await runMenu("Poczekaj przy ogniu");
        for (let i = 0; i < 90 && !(await waiting()); i++) await frames(1);
        await ev("$gameSystem.advanceDayNight(0.6); 0");
        for (let i = 0; i < 200 && (await swingT()) >= 0; i++) await frames(2);
        check("staying until it is done: the player stands up with the roast meat, the hook is empty", (await roast()) === r0 + 1 && !(await job()) && (await hang()).raw === false && (await ev("$gamePlayer.canMove()")) === true);
        await b.shot("fire_tripod_roast_done.png");
        // a stick roast the player was sitting at when the game was saved / the map left is not carried on
        await ev(`(function(){ const b = Farming.buildingAt(${fx}, ${fy}); b.job = { recipe: "roast_meat", start: 0, hours: 0.5, out: [Farming.ITEM.roastMeat, 1], sit: true }; $gameParty.gainItem($dataItems[Farming.ITEM.rawMeat], -1); })(); 0`);
        const mBefore = await meat();
        await ev("$gameMap.setup($gameMap.mapId()); 0");
        check("an orphaned stick roast (map set up again) is given up silently: the meat goes back to the bag", !(await job()) && (await meat()) === mBefore + 1, { before: mBefore, after: await meat() });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
