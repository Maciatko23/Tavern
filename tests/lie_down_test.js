// "Odpocznij na ziemi": a small rest on ordinary grass, no building needed. Sits down (the same sitting swing
// as a bench or campfire, kind 11) and stays seated for as long as the player likes: +1 stamina every
// REST_TICK_MINUTES of game time (a floating "+1"), until they move away or reach full stamina on their own.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const press = async () => { await ev(`Input._currentState.ok = true; Input._latestButton = 'ok'; Input._pressedTime = 0; 0`); await frames(4); await ev(`Input._currentState.ok = false; 0`); await frames(6); };

        // ---------------------------------------------------------------- a meadow (natural, untouched grass)
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            // a 1-tile margin all around, clear of any event at all: the action button can reach a tree/bush/rock
            // just past the tile it is on, which would hijack it from the menu
            for (let by = 3; by < $gameMap.height() - 7; by++) for (let bx = 3; bx < $gameMap.width() - 8; bx++) {
                let ok = true;
                for (let y = by - 1; y < by + 7 && ok; y++) for (let x = bx - 1; x < bx + 8 && ok; x++) {
                    if (!$gameMap.isValid(x, y) || $gameMap.eventsXy(x, y).length > 0) { ok = false; break; }
                }
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 7 && ok; x++) { if (!free(x, y)) ok = false; }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a meadow", !!B, B);
        const { bx, by } = B;
        await ev(`$gamePlayer.locate(${bx + 4}, ${by + 4}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${bx} - 5, ${by} - 2); $gameSystem.setStamina(60); 0`);
        await frames(20);

        // ---------------------------------------------------------------- the menu entry on natural grass
        await press();
        await frames(6);
        let st = await J(`(function(){ const m = SceneManager._scene._farmMenu; return { open: !!$gameTemp._farmMenuOpen, title: m._title, names: m._entries.map(e => e.name), entry: m._entries.find(e => e.name === "Odpocznij na ziemi") }; })()`);
        check("the natural-grass menu offers 'Odpocznij na ziemi' with +1/3min shown and enabled (not tired yet)", st.open && !!st.entry && st.entry.enabled !== false && st.entry.right === "+1/3min", st);
        check("the grass menu, in order: Odpocznij na ziemi, Wytwórz..., Wykop ziemię, Zagrab ziemię, Postaw... (no 'Zbuduj...', no 'Zostaw')", st.names.join() === "Odpocznij na ziemi,Wytwórz...,Wykop ziemię,Zagrab ziemię,Postaw...", st.names);
        // cancel out and check the same entry is NOT offered on raked ground (not natural)
        await ev(`Input._currentState.escape = true; 0`); await frames(3); await ev(`Input._currentState.escape = false; 0`); await frames(10);
        // the player at (bx+4, by+4) facing down (2) targets (bx+4, by+5), not their own standing tile
        await ev(`$gameParty.gainItem($dataItems[65], 1); $gameSystem.setStamina(200); Farming.rake(${bx + 4}, ${by + 5}); 0`);
        await frames(120);
        const rakedNow = await J(`Farming.plotAt(${bx + 4}, ${by + 5})`);
        check("(setup) the tile actually got raked", rakedNow && rakedNow.s === "raked", rakedNow);
        await press();
        await frames(6);
        const st2 = await J(`(function(){ const m = SceneManager._scene._farmMenu; return { title: m._title, names: m._entries.map(e => e.name) }; })()`);
        check("raked (no longer natural) ground does NOT offer it", st2.title === "Zagrabiona ziemia" && !st2.names.includes("Odpocznij na ziemi"), st2);
        check("the raked-ground menu: Wytwórz..., Wykop ziemię, Zaoraj ziemię, Postaw...", st2.names.join() === "Wytwórz...,Wykop ziemię,Zaoraj ziemię,Postaw...", st2.names);
        await ev(`Input._currentState.escape = true; 0`); await frames(3); await ev(`Input._currentState.escape = false; 0`); await frames(10);

        // ---------------------------------------------------------------- a fresh natural tile: actually sit down
        await ev(`$gamePlayer.locate(${bx + 5}, ${by + 4}); $gamePlayer.setDirection(2); $gameSystem.setStamina(60); 0`);
        await frames(10);
        const before = await J("({ st: $gameSystem.stamina() })");
        const brightnessBefore = await ev("$gameScreen.brightness()");
        await press();
        await frames(6);
        st = await J(`(function(){ const m = SceneManager._scene._farmMenu; const e = m._entries.find(e => e.name === "Odpocznij na ziemi"); return e ? { help: e.help } : null; })()`);
        check("the popup explains the new tick-based rest", !!st && /co 3 minuty gry/.test(st.help), st);
        await ev(`(function(){ SceneManager._scene._farmMenu.select(SceneManager._scene._farmMenu._entries.findIndex(e => e.name === "Odpocznij na ziemi")); })(); 0`);
        await press();   // choose it: the swing starts
        await frames(6);
        const started = await J(`({ swinging: !!$gamePlayer._toolSwing, kind: $gamePlayer._toolSwing ? $gamePlayer._toolSwing._swingKind : null, canMove: $gamePlayer.canMove() })`);
        check("the sitting swing starts (kind 11, the same as a bench/campfire), the player cannot walk away", started.swinging && started.kind === 11 && started.canMove === false, started);

        // wait past the sit-down animation into the open-ended hold; no picture, no screen dim, ticking stamina up
        await frames(60);
        const midNoDim = await J(`({ swinging: !!$gamePlayer._toolSwing, pictureShown: !!$gameScreen.picture(99), brightness: $gameScreen.brightness() })`);
        check("holding: still a swing (no separate picture), and the screen never dimmed", midNoDim.swinging && !midNoDim.pictureShown && midNoDim.brightness === 255, midNoDim);
        // sitting still: the same frame of the sheet the whole time (hands folded in the lap), no shifting between two poses
        const sheetFrame = () => J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); const body = s && s._swingBody; return { waiting: !!($gamePlayer._toolSwing && $gamePlayer._toolSwing._waiting), x: body && body.visible ? body._frame.x : null }; })()`);
        const poses = [];
        for (let i = 0; i < 4; i++) { poses.push(await sheetFrame()); await frames(17); }
        check("seated: one still pose (sheet frame 12, hands folded) for the whole wait", poses.every(p => p.waiting && p.x === 12 * 96), poses);
        await frames(260);   // ~4.3 s more: past one 3-game-minute tick (1 game-minute is about 1 real second at the default clock speed)
        const afterOneTick = await J("({ st: $gameSystem.stamina(), swinging: !!$gamePlayer._toolSwing })");
        check("at least one +1 tick landed while sitting still, still seated", afterOneTick.st > before.st && afterOneTick.swinging, { before, afterOneTick });

        // moving away ends the rest early: stands up, keeps whatever was already gained, control comes back
        const gainedSoFar = afterOneTick.st;
        await ev(`Input._currentState.right = true; 0`);
        await frames(30);
        await ev(`Input._currentState.right = false; 0`);
        for (let i = 0; i < 30; i++) { if (!(await ev("!!$gamePlayer._toolSwing"))) break; await frames(5); }
        await frames(10);
        const afterMove = await J("({ st: $gameSystem.stamina(), swinging: !!$gamePlayer._toolSwing, canMove: $gamePlayer.canMove() })");
        check("moving away stood the player back up, kept the stamina already gained, no fade ever happened", !afterMove.swinging && afterMove.canMove === true && afterMove.st >= gainedSoFar && brightnessBefore === 255 && (await ev("$gameScreen.brightness()")) === 255, { gainedSoFar, afterMove });

        // ---------------------------------------------------------------- reaching full stamina on its own stands the player up too
        // (3 below max, not 1: the menu itself greys the entry out already at 98% - it must start below that to be offered at all)
        await ev(`$gamePlayer.locate(${bx + 5}, ${by + 5}); $gamePlayer.setDirection(2); $gameSystem.setStamina($gameSystem.maxStamina() - 3); 0`);
        await frames(10);
        await press();
        await frames(6);
        const fullEntry = await J(`(function(){ const e = SceneManager._scene._farmMenu._entries.find(e => e.name === "Odpocznij na ziemi"); return { enabled: e.enabled !== false }; })()`);
        check("(setup) 3 below max is still under the 98% cutoff, so the entry is offered", fullEntry.enabled, fullEntry);
        await ev(`(function(){ SceneManager._scene._farmMenu.select(SceneManager._scene._farmMenu._entries.findIndex(e => e.name === "Odpocznij na ziemi")); })(); 0`);
        await press();
        await frames(60);
        // 3 points to make up, one every ~3 real seconds at the default clock speed: comfortable margin below
        for (let i = 0; i < 120; i++) { if (!(await ev("!!$gamePlayer._toolSwing"))) break; await frames(10); }
        await frames(10);
        const full = await J("({ st: $gameSystem.stamina(), max: $gameSystem.maxStamina(), swinging: !!$gamePlayer._toolSwing, canMove: $gamePlayer.canMove() })");
        check("resting to full stamina stands the player up by itself, no need to move", full.st === full.max && !full.swinging && full.canMove === true, full);

        // ---------------------------------------------------------------- at full stamina, it is offered but disabled
        await frames(10);
        await press();
        await frames(6);
        st = await J(`(function(){ const m = SceneManager._scene._farmMenu; const e = m._entries.find(e => e.name === "Odpocznij na ziemi"); return e ? { enabled: e.enabled, help: e.help } : null; })()`);
        check("at full stamina, the entry is greyed out with a reason", !!st && st.enabled === false && /Nie jesteś zmęczony/.test(st.help), st);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
