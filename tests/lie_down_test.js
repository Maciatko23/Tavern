// "Odpocznij na ziemi": a small rest on ordinary grass, no building needed. Now a real animated swing
// (Swing_LieDown, kind 14): the player's own walking sprite is replaced frame by frame, sinking down onto
// their side, resting a moment, then standing back up - the same mechanism as a tool swing, no picture
// overlay and no screen fade anywhere in the sequence. +10 stamina, about half an hour passes.
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

        // ---------------------------------------------------------------- the sheet (img/system/, loaded the same way every other swing sheet is)
        const sheetInfo = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("Swing_LieDown"); bmp.addLoadListener(() => res({ w: bmp.width, h: bmp.height })); })`);
        check("Swing_LieDown loads with real pixels (a proper multi-frame sheet, not a tiny picture)", sheetInfo.w > 500 && sheetInfo.h === 384, sheetInfo);

        // ---------------------------------------------------------------- a meadow (natural, untouched grass)
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            for (let by = 2; by < $gameMap.height() - 6; by++) for (let bx = 2; bx < $gameMap.width() - 7; bx++) {
                let ok = true;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 7; x++) { if (!free(x, y)) { ok = false; break; } }
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
        check("the natural-grass menu offers 'Odpocznij na ziemi' with +10 shown and enabled (not tired yet)", st.open && !!st.entry && st.entry.enabled !== false && st.entry.right === "+10", st);
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
        await ev(`Input._currentState.escape = true; 0`); await frames(3); await ev(`Input._currentState.escape = false; 0`); await frames(10);

        // ---------------------------------------------------------------- a fresh natural tile: actually lie down
        await ev(`$gamePlayer.locate(${bx + 5}, ${by + 4}); $gamePlayer.setDirection(2); $gameSystem.setStamina(60); 0`);
        await frames(10);
        const before = await J("({ st: $gameSystem.stamina(), day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour() })");
        const brightnessBefore = await ev("$gameScreen.brightness()");
        await press();
        await frames(6);
        st = await J(`(function(){ const m = SceneManager._scene._farmMenu; const e = m._entries.find(e => e.name === "Odpocznij na ziemi"); return e ? { help: e.help } : null; })()`);
        check("the popup explains it (less than a bench/fire, no building)", !!st && /mniej niż/.test(st.help), st);
        await ev(`(function(){ SceneManager._scene._farmMenu.select(SceneManager._scene._farmMenu._entries.findIndex(e => e.name === "Odpocznij na ziemi")); })(); 0`);
        await press();   // choose it: the swing starts
        await frames(6);
        const started = await J(`({ swinging: !!$gamePlayer._toolSwing, kind: $gamePlayer._toolSwing ? $gamePlayer._toolSwing._swingKind : null, canMove: $gamePlayer.canMove() })`);
        check("a real swing starts (kind 14, Swing_LieDown), the player cannot walk away mid-animation", started.swinging && started.kind === 14 && started.canMove === false, started);

        // partway through: still swinging, no picture involved, no screen dim
        await frames(20);
        const mid = await J(`({ swinging: !!$gamePlayer._toolSwing, pictureShown: !!$gameScreen.picture(99), brightness: $gameScreen.brightness() })`);
        check("mid-animation: still a swing (no separate picture), and the screen never dimmed", mid.swinging && !mid.pictureShown && mid.brightness === 255, mid);

        // let the whole sequence (lying down, resting, standing back up) finish
        for (let i = 0; i < 40; i++) { if (!(await ev("!!$gamePlayer._toolSwing"))) break; await frames(5); }
        await frames(20);
        const brightnessAfter = await ev("$gameScreen.brightness()");
        check("the screen brightness never moved from full (255) at any point in the sequence", brightnessBefore === 255 && brightnessAfter === 255, { brightnessBefore, brightnessAfter });
        const after = await J("({ st: $gameSystem.stamina(), day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour() })");
        const done = await J(`({ swinging: !!$gamePlayer._toolSwing, canMove: $gamePlayer.canMove() })`);
        const elapsedMin = ((after.hour * 60 + after.day * 1440) - (before.hour * 60 + before.day * 1440));
        check("afterwards: +10 stamina, about half an hour passed, the swing ended and the player can walk again",
            after.st === before.st + 10 && elapsedMin >= 29 && elapsedMin <= 90 && !done.swinging && done.canMove === true,
            { before, after, elapsedMin, done });

        // ---------------------------------------------------------------- at full stamina, it is offered but disabled
        await ev(`$gameSystem.setStamina($gameSystem.maxStamina()); 0`);
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
