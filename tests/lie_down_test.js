// "Odpocznij na ziemi": a small rest on ordinary grass, no building needed - shows the player lying
// down (a real picture, the player's own sprite hidden for the moment), +10 stamina, 30 minutes pass.
const { launch, sleep } = require("./cdp.js");
const path = require("path");
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

        // ---------------------------------------------------------------- the art (img/pictures/, loaded the same way $gameScreen.showPicture loads it)
        const artInfo = await ev(`new Promise(res => { const names = ["Lie_Down", "Lie_Down_Flip"]; const out = []; let left = names.length;
            names.forEach(n => { const bmp = ImageManager.loadPicture(n); bmp.addLoadListener(() => { out.push({ n, w: bmp.width, h: bmp.height }); if (--left === 0) res(out); }); }); })`);
        check("Lie_Down and Lie_Down_Flip both load with real pixels from img/pictures/", artInfo.every(a => a.w > 10 && a.h > 5), artInfo);

        // ---------------------------------------------------------------- a meadow (natural, untouched grass)
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 7 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!free(x, y)) { ok = false; break; } }
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
        await press();
        await frames(6);
        st = await J(`(function(){ const m = SceneManager._scene._farmMenu; const e = m._entries.find(e => e.name === "Odpocznij na ziemi"); return e ? { help: e.help } : null; })()`);
        check("the popup explains it (less than a bench/fire, no building)", !!st && /mniej niż/.test(st.help), st);
        await ev(`(function(){ SceneManager._scene._farmMenu.select(SceneManager._scene._farmMenu._entries.findIndex(e => e.name === "Odpocznij na ziemi")); })(); 0`);
        await press();   // choose it
        await frames(30);
        const mid = await J(`(function(){ const pic = $gameScreen.picture(99); const sprite = SceneManager._scene._spriteset._pictureContainer.children.find(c => c.picture && c.picture() === pic);
            return { transparent: $gamePlayer._transparent, pictureShown: !!pic, pictureName: pic ? pic.name() : null, bitmapReady: sprite && sprite.bitmap ? sprite.bitmap.isReady() : null }; })()`);
        check("while resting: the player's own sprite is hidden and the lying picture is shown (a real, loaded bitmap - img/pictures/, not img/system/)", mid.transparent === true && mid.pictureShown && mid.pictureName === "Lie_Down" && mid.bitmapReady === true, mid);
        await b.shot(path.join(__dirname, "lie_down.png"));
        for (let i = 0; i < 40; i++) { if (!(await ev("!!$gameScreen.picture(99)"))) break; await frames(4); }
        await frames(30);   // clear of $gameTemp._farmLock too, well past the 140-frame lock set at the start of lieDown()
        const after = await J("({ st: $gameSystem.stamina(), day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour() })");
        const done = await J(`(function(){ const pic = $gameScreen.picture(99); return { transparent: $gamePlayer._transparent, pictureShown: !!pic }; })()`);
        const elapsedMin = ((after.hour * 60 + after.day * 1440) - (before.hour * 60 + before.day * 1440));
        check("afterwards: +10 stamina, about half an hour passed (30 min from lieDown, plus whatever passively ticked by while waiting), the player is visible again and the picture is gone",
            after.st === before.st + 10 && elapsedMin >= 29 && elapsedMin <= 90 && done.transparent === false && !done.pictureShown,
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
