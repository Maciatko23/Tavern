// Drives the real game headlessly and checks free movement. usage: node move_test.js
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
        await sleep(1000);
        await ev("SceneManager._scene.startFadeIn(1,false)");
        await sleep(800);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const hold = async (keys, n) => {
            await ev(`Input.clear(); ${keys.map(k => `Input._currentState.${k} = true;`).join(" ")}`);
            const f0 = await ev("Graphics.frameCount");
            await frames(n);
            const f1 = await ev("Graphics.frameCount");
            await ev("Input.clear()");
            await frames(3);
            return f1 - f0;
        };
        const pos = () => ev("({x:$gamePlayer._realX, y:$gamePlayer._realY, tx:$gamePlayer.x, ty:$gamePlayer.y, d:$gamePlayer.direction(), moving:$gamePlayer.isMoving()})");
        const put = (x, y) => ev(`$gamePlayer.locate(${x}, ${y}); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); 0`);

        check("plugin loaded", await ev("typeof Game_Player.prototype.freeStep === 'function' && $gamePlayer.isFreeMoving()"));

        // an open meadow: 9x7 tiles with no event and no blocking tile
        const B = await ev(`(function(){
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 10; bx++) {
                let ok = true;
                for (let y = by; y < by + 7 && ok; y++) for (let x = bx; x < bx + 9; x++) {
                    if ($gameMap.eventsXy(x, y).length || !$gameMap.checkPassage(x, y, 0x0f)) { ok = false; break; }
                }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found an open meadow for the tests", !!B, B);
        const { bx, by } = B;

        // 1. speeds: straight vs diagonal, per frame
        await put(bx + 1, by + 1);
        let p0 = await pos(); const nf = await hold(["right"], 40); let p1 = await pos();
        const straight = (p1.x - p0.x) * 48 / nf;
        check("walks right smoothly (px/frame ~2.5: the walk is a little slower than the engine's 3 - FreeMovement walkSlowdown 0.25)", straight > 2.3 && straight < 2.75, { pxPerFrame: +straight.toFixed(2), frames: nf, x: p1.x });
        check("facing right, idle afterwards", (await pos()).d === 6 && (await pos()).moving === false);
        await put(bx + 1, by + 1);
        p0 = await pos(); const nf2 = await hold(["right", "down"], 40); p1 = await pos();
        const dx = (p1.x - p0.x) * 48 / nf2, dy = (p1.y - p0.y) * 48 / nf2, diag = Math.hypot(dx, dy);
        check("diagonal moves on both axes, same total speed as straight", Math.abs(dx - dy) < 0.4 && Math.abs(diag - straight) < 0.35, { dx: +dx.toFixed(2), dy: +dy.toFixed(2), speed: +diag.toFixed(2), straight: +straight.toFixed(2) });
        check("diagonal facing is sideways (right)", (await pos()).d === 6, await pos());
        const p2 = await pos();
        check("position is whole pixels", Math.abs(p2.x * 48 - Math.round(p2.x * 48)) < 1e-6 && Math.abs(p2.y * 48 - Math.round(p2.y * 48)) < 1e-6, p2);
        await put(bx + 4, by + 4);
        await hold(["up"], 6);
        await hold(["up", "left"], 10);
        check("keeps facing up when going up-left", (await pos()).d === 8, await pos());
        await ev("ConfigManager.alwaysDash = true; 0");
        await put(bx + 1, by + 3);
        p0 = await pos(); const nf3 = await hold(["right"], 30); p1 = await pos();
        const dashSpeed = (p1.x - p0.x) * 48 / nf3;
        check("dash (always dash on) is faster", dashSpeed > straight * 1.6, { dashSpeed: +dashSpeed.toFixed(2), walk: +straight.toFixed(2) });
        await ev("ConfigManager.alwaysDash = false; 0");

        // 2. a solid touch-trigger event and a below-characters one, made on the fly
        await ev(`(function(){
            const cond = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
            const mk = (id, x, y, pri, sw) => ({ id, name: "T" + id, note: "", x, y, pages: [{ conditions: cond, directionFix: false, image: { tileId: 0, characterName: pri ? "!Door1" : "", direction: 2, pattern: 0, characterIndex: 0 },
                list: [{ code: 121, indent: 0, parameters: [sw, sw, 0] }, { code: 0, indent: 0, parameters: [] }], moveFrequency: 3, moveRoute: { list: [{ code: 0 }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: pri, stepAnime: false, through: false, trigger: 1, walkAnime: true }] });
            $dataMap.events[201] = mk(201, ${bx + 6}, ${by + 2}, 1, 15);
            $dataMap.events[202] = mk(202, ${bx + 4}, ${by + 5}, 0, 16);
            $gameMap._events[201] = new Game_Event($gameMap.mapId(), 201);
            $gameMap._events[202] = new Game_Event($gameMap.mapId(), 202);
            $gameSwitches.setValue(15, false); $gameSwitches.setValue(16, false);
            return 1; })()`);
        await put(bx + 1, by + 2);
        await hold(["right"], 160);
        p1 = await pos();
        check("solid touch event: player stops in front of it", p1.tx + 1 === bx + 6 && p1.x < bx + 6 - 0.6, p1);
        check("solid touch event: 'player touch' fired by walking into it", await ev("$gameSwitches.value(15)"));
        await ev("$gameMap._interpreter.clear(); 0");
        await put(bx + 1, by + 5);
        await hold(["right"], 80);
        check("below-characters touch event fires when the player steps onto its tile", await ev("$gameSwitches.value(16)"));

        await ev("$gameMap._events[201].erase(); $gameMap._events[202].erase(); 0");

        // 3. collision with a 1-tile object made on the fly: walk right along its row
        await ev(`(function(){
            const cond = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
            $dataMap.events[203] = { id: 203, name: "Blok", note: "", x: ${bx + 7}, y: ${by + 1}, pages: [{ conditions: cond, directionFix: false, image: { tileId: 0, characterName: "!Chest", direction: 2, pattern: 0, characterIndex: 0 }, list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3, moveRoute: { list: [{ code: 0 }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }] };
            $gameMap._events[203] = new Game_Event($gameMap.mapId(), 203); return 1; })()`);
        await put(bx + 1, by + 1);
        await hold(["right"], 200);
        p1 = await pos();
        check("stops in front of a 1-tile object (feet touch, no overlap)", p1.x < bx + 7 - 0.6 && p1.x > bx + 7 - 1.0 && p1.tx + 1 === bx + 7 && p1.d === 6, { x: p1.x, near: bx + 7 - 0.77, tx: p1.tx });

        // 4. corner assist: approach the same object 0.6 tile below its lane -> slides on and passes
        await ev(`$gamePlayer.locate(${bx + 1}, ${by + 1}); $gamePlayer._realY = ${by + 1.6}; 0`);
        await hold(["right"], 200);
        p1 = await pos();
        check("slides around the corner and gets past the object", p1.x > bx + 7.5, p1);
        await put(bx + 1, by + 1);
        await hold(["right"], 200);
        p1 = await pos();
        check("no bogus sliding when the lane is blocked", Math.abs(p1.y - (by + 1)) < 0.001 && p1.x < bx + 6.5, p1);

        // 5. the ends of the map
        await put(1, 1);
        await hold(["up", "left"], 120);
        p1 = await pos();
        check("cannot leave the map", p1.x >= -0.4 && p1.y >= -0.6 && p1.x < 1 && p1.y < 1, p1);

        // 6. a move-route step glides from where the player stands, then sits on a tile centre
        await put(bx + 1, by + 6);
        await ev(`$gamePlayer._realX = ${bx + 1.4}; $gamePlayer._x = ${bx + 1}; $gamePlayer.moveStraight(6); 0`);
        const mid = await pos();
        await frames(60);
        p1 = await pos();
        check("move-route step: glides (no jump) and ends on the next tile centre", mid.x > bx + 1.3 && mid.moving && p1.x === bx + 2 && p1.tx === bx + 2 && !p1.moving, { mid: mid.x, end: p1 });
        await hold(["right"], 10);
        check("free walking resumes after the glide", (await pos()).x > bx + 2.1);

        // 7. the action button works while walking: the farm menu opens on the tile in front
        await put(bx + 1, by + 3);
        await ev("Input.clear(); Input._currentState.right = true; 0");
        await frames(20);
        // a branch, stone or flax lying in front would be picked up instead of opening the menu: take them off the ground first
        await ev(`(function(){ const f = $gameSystem._farm; f.stones = f.stones || {}; const m = (f.stones[3] = f.stones[3] || {}); for (let dx = 0; dx <= 2; dx++) for (let dy = -1; dy <= 1; dy++) m[($gamePlayer.x + dx) + "," + ($gamePlayer.y + dy)] = $gameSystem.dayNightDay(); f.rev++; })()`);
        await ev("Input._currentState.ok = true; 0");
        await frames(2);
        await ev("Input._currentState.ok = false; 0");
        await frames(6);
        const menu = await ev("({menu:!!$gameTemp._farmMenuOpen, canMove:$gamePlayer.canMove(), x:$gamePlayer._realX})");
        check("action button pressed while walking opens the farm menu", menu.menu === true && menu.canMove === false, menu);
        await ev("Input.clear(); 0");
    } catch (e) { console.log("ERR", e.message); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
