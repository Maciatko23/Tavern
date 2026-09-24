// Tests the building placement mode (grid + see-through building) in the real game.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(11); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(2); await ev(`Input._currentState.${k} = false; 0`); await frames(2); };
        const mode = () => ev("JSON.stringify($gameTemp._buildMode ? { type: $gameTemp._buildMode.type, x: $gameTemp._buildMode.x, y: $gameTemp._buildMode.y } : null)").then(JSON.parse);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const B = await ev(`(function(){
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 10; x++) {
                    if (!Farming.naturalFarmland(x, y)) { ok = false; break; }
                }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found an open meadow", !!B, B);
        const { bx, by } = B;
        await ev(`$gamePlayer.locate(${bx + 2}, ${by + 3}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${bx + 2} - 13, ${by + 3} - 7); $gameParty.gainItem($dataItems[80], 12); $gameSystem.changeStamina(100); 0`);
        await frames(4);

        // the build menu no longer builds by itself: it starts the placer
        const menu = await ev("JSON.stringify(Farming.menuFor(" + (bx + 3) + ", " + (by + 3) + ").entries.map(e => e.name))");
        const qList = await ev(`(function(){ const scene = SceneManager._scene; let got = null; const _o = scene.openFarmMenu; scene.openFarmMenu = function(t, en) { got = en.map(x => x.name); }; Farming.openBuildKeyMenu(); scene.openFarmMenu = _o; return JSON.stringify(got); })()`);
        check("building is on Q (the ground menu has no 'Zbuduj...'): the Q list offers the bench", !/Zbuduj/.test(menu) && JSON.parse(qList).includes("Ławka"), { menu, qList });
        const qFlags = JSON.parse(await ev(`(function(){ const scene = SceneManager._scene; let got = null; const _o = scene.openFarmMenu; scene.openFarmMenu = function(t, en) { got = en.map(x => ({ name: x.name, ok: x.enabled !== false })); }; Farming.openBuildKeyMenu(); scene.openFarmMenu = _o; return JSON.stringify(got); })()`));
        const qBuild = qFlags.filter(e => e.name !== "Zrób młotek");   // (no hammer yet: making one stays on top, whatever it needs)
        const firstOff = qBuild.findIndex(e => !e.ok);
        check("the Q list puts what can be built now (materials in the bag) first, the rest after it", firstOff > 0 && qBuild.slice(firstOff).every(e => !e.ok) && qBuild.slice(0, firstOff).some(e => e.name === "Ławka"), qFlags.map(e => (e.ok ? "+" : "-") + e.name).join(" "));
        await ev(`Farming.startPlacement("bench", ${bx + 3}, ${by + 3}); Input._currentState.ok = true; 0`);   // the same press that would have chosen it
        await frames(2);
        await ev("Input._currentState.ok = false; 0");
        check("the OK press that chose the building does not place it at once", (await count(80)) === 12 && (await mode()) !== null);
        await frames(6);
        let m = await mode();
        check("placement mode starts at the tile in front of the player", m && m.type === "bench" && m.x === bx + 3 && m.y === by + 3, m);
        check("the player cannot walk while placing", (await ev("$gamePlayer.canMove()")) === false);
        const vis = await ev("({placer:SceneManager._scene._spriteset._buildPlacer.visible, ghost:SceneManager._scene._spriteset._buildPlacer._ghost.visible, hasTexture:!!SceneManager._scene._spriteset._buildPlacer._ghost.bitmap})");
        check("grid layer and the see-through building are shown", vis.placer && vis.ghost && vis.hasTexture, vis);

        // moving the cursor
        await press("right"); await press("right"); await press("down");
        m = await mode();
        check("arrows move the cursor tile by tile", m.x === bx + 5 && m.y === by + 4, m);
        for (let i = 0; i < 12; i++) await press("right");
        m = await mode();
        check("the cursor stays within 6 tiles of the player", m.x <= bx + 2 + 6, m);
        const far = await ev(`Farming.placementProblem("bench", ${m.x}, ${m.y})`);
        console.log("at the edge of the reach:", far);
        await ev(`$gameTemp._buildMode.x = ${bx + 2 + 7}; 0`);
        check("beyond the reach the reason is 'too far'", (await ev(`Farming.placementProblem("bench", ${bx + 2 + 7}, ${by + 4})`)) === "Za daleko od ciebie.");

        // place one
        await ev(`$gameTemp._buildMode.x = ${bx + 5}; $gameTemp._buildMode.y = ${by + 4}; 0`);
        await frames(3);
        const shot1 = "placer_valid.png";
        await b.shot(shot1);
        await press("ok");
        const walking = await ev(`({ walk: !!($gameTemp._buildMode && $gameTemp._buildMode.walk), built: !!Farming.buildingAt(${bx + 5}, ${by + 4}), planks: $gameParty.numItems($dataItems[80]), move: $gamePlayer.canMove() })`);
        check("OK far from the spot: he first walks up to it (nothing built yet, nothing taken, he may walk)", walking.walk && !walking.built && walking.planks === 12 && walking.move, walking);
        await frames(90);
        const placed = await ev(`!!Farming.buildingAt(${bx + 5}, ${by + 4})`);
        check("OK builds the bench exactly at the cursor", placed === true);
        const at = await ev(`({ x: $gamePlayer.x, y: $gamePlayer.y, dir: $gamePlayer.direction() })`);
        check("...once he stands right beside it (not at a corner), facing it", Math.abs(at.x - (bx + 5)) + Math.abs(at.y - (by + 4)) === 1 && at.dir === (at.x < bx + 5 ? 6 : at.x > bx + 5 ? 4 : at.y < by + 4 ? 2 : 8), at);
        check("the materials were taken (2 planks) and the mode ended", (await count(80)) === 10 && (await mode()) === null, { planks: await count(80) });
        check("the player can move again", (await ev("$gamePlayer.canMove()")) === true);

        // on the way a direction key stops him: back to choosing the spot, nothing built
        await ev(`$gameParty.gainItem($dataItems[80], 2); $gamePlayer.locate(${bx + 2}, ${by + 3}); Farming.startPlacement("bench", ${bx + 7}, ${by + 3}); 0`);
        await frames(8);
        await press("ok"); await frames(6);
        const from = await ev("$gamePlayer._realX");
        await press("left"); await frames(20);
        const stopped = await ev(`({ walk: !!($gameTemp._buildMode && $gameTemp._buildMode.walk), mode: !!$gameTemp._buildMode, built: !!Farming.buildingAt(${bx + 7}, ${by + 3}), move: $gamePlayer.canMove(), x: $gamePlayer._realX })`);
        check("an arrow on the way stops the walk; the placer stays, nothing built", !stopped.walk && stopped.mode && !stopped.built && !stopped.move && stopped.x <= from + 0.01, { from, stopped });
        await press("cancel"); await frames(4);
        await ev(`$gameParty.loseItem($dataItems[80], 2); 0`);

        // invalid: on top of the bench
        await ev(`Farming.startPlacement("bench", ${bx + 5}, ${by + 4}); 0`);
        await frames(8);
        m = await mode();
        const why = await ev(`Farming.placementProblem("bench", ${bx + 5}, ${by + 4})`);
        check("on an existing building the placer says so", why === "Tu już coś stoi.", why);
        await frames(3);
        await b.shot("placer_invalid.png");
        await press("ok");
        await frames(30);
        check("OK on a red tile builds nothing and keeps the mode", (await count(80)) === 10 && (await mode()) !== null);

        // the sawmill is 2 tiles wide: a second tile blocked by the bench makes the whole thing red
        await ev(`$gameTemp._buildMode.type = "sawmill"; $gameTemp._buildMode.x = ${bx + 4}; $gameTemp._buildMode.y = ${by + 4}; 0`);
        const why2 = await ev(`Farming.placementProblem("sawmill", ${bx + 4}, ${by + 4})`);
        check("a 2-tile building is refused when its second tile is taken", why2 === "Tu już coś stoi." || why2 === "Brakuje materiałów.", why2);

        // cancel
        await press("cancel");
        await frames(4);
        check("cancel leaves the mode without opening the main menu", (await mode()) === null && (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await ev("$gamePlayer.canMove()")) === true);

        // fences: the mode goes on after each one
        await ev(`$gameParty.gainItem($dataItems[80], 4); $gamePlayer.locate(${bx + 2}, ${by + 5}); $gamePlayer.setDirection(6); Farming.startPlacement("fence", ${bx + 3}, ${by + 5}); 0`);
        await frames(8);
        await press("ok"); await frames(80);
        const m1 = await mode();
        await press("right"); await press("ok"); await frames(80);
        const m2 = await mode();
        check("fences: two in a row, still placing", !!m1 && !!m2 && !!(await ev(`Farming.buildingAt(${bx + 3}, ${by + 5})`)) && !!(await ev(`Farming.buildingAt(${bx + 4}, ${by + 5})`)), { m1, m2 });
        await press("cancel"); await frames(4);

        // the mouse moves the cursor too
        await ev(`$gameParty.gainItem($dataItems[80], 4); Farming.startPlacement("hive", ${bx + 3}, ${by + 3}); 0`);
        await frames(8);
        const target = await ev(`({ x: ($gameMap.adjustX(${bx + 6}) + 0.5) * 48, y: ($gameMap.adjustY(${by + 2}) + 0.5) * 48 })`);
        await ev(`TouchInput._onHover(${Math.round(target.x)}, ${Math.round(target.y)}); 0`);
        await frames(4);
        m = await mode();
        check("the mouse pointer moves the cursor to its tile", m && m.x === bx + 6 && m.y === by + 2, { m });
    } catch (e) { console.log("ERR", e.message); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
