// The shooting animation: whirling the sling, drawing the bow (Swing_Sling / Swing_Bow sheets), the shot leaves on the release frame.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); Hunting.auto(false); $gameScreen.clearWeather(); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 2); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(2); await ev(`Input._currentState.${k} = false; 0`); };
        await ev("window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0");

        // ---------------------------------------------------------------- the sheets
        const sheets = await ev(`new Promise(res => { const out = {}; let left = 2; for (const n of ["Swing_Sling", "Swing_Bow"]) { const bmp = ImageManager.loadSystem(n); bmp.addLoadListener(() => { out[n] = [bmp.width, bmp.height]; if (--left === 0) res(out); }); } })`);
        check("both sheets load: 13 frames of 96 x 96 in 4 rows", JSON.stringify(sheets) === JSON.stringify({ Swing_Sling: [1248, 384], Swing_Bow: [1248, 384] }), sheets);

        // an open lane
        const room = await ev(`(function(){
            for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 6; x < $gameMap.width() - 14; x++) {
                let ok = true;
                for (let dx = -2; dx < 12 && ok; dx++) for (let dy = -2; dy <= 2; dy++) { if (!$gameMap.checkPassage(x + dx, y + dy, 0x0f) || $gameMap.eventsXy(x + dx, y + dy).length > 0 || Farming.hasObjectTile(x + dx, y + dy)) { ok = false; break; } }
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found an open lane", !!room, room);
        const { x: lx, y: ly } = room;
        const standAt = (d) => ev(`$gamePlayer.locate(${lx}, ${ly}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${lx} - 8, ${ly} - 6); $gameSystem.setStamina(100); 0`);
        const cell = () => J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); const f = s && s._swingBody && s._swingBody.visible ? s._swingBody._frame : null; return f ? { col: Math.round(f.x / 96), row: Math.round(f.y / 96) } : null; })()`);
        const swinging = () => ev("$gamePlayer.isToolSwinging()");
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");   // the wild ones that grazed here before the test
        await standAt(6);
        await give(125, 1); await give(126, 1); await give(64, 12); await give(127, 6);

        // ---------------------------------------------------------------- the sling (a bow is in the bag, but without arrows the sling is used... arrows are given later)
        await ev("Hunting.animate(true); 0");
        // take the bow away for the sling part
        await ev("$gameParty.loseItem($dataItems[126], 1, false); $gameParty.loseItem($dataItems[127], 6, false); 0");
        const st0 = await ev("$gameSystem.stamina()");
        const stones0 = await count(64);
        await press("shoot");
        await frames(1);
        check("F starts a swing, not an instant shot: the player is busy, no stone has left yet",
            (await swinging()) && (await ev("Hunting.projectiles.length")) === 0 && (await ev("$gamePlayer.canMove()")) === false && (await ev("$gamePlayer._swingEvent._swingKind")) === 9);
        check("aiming costs nothing yet: the stone and the stamina are spent when the stone leaves", (await count(64)) === stones0 && (await ev("$gameSystem.stamina()")) === st0);
        // time the release
        let leftAt = -1, started = await ev("Graphics.frameCount");
        let sawBody = false;
        for (let i = 0; i < 90; i++) {
            await frames(1);
            if (!sawBody && (await cell())) sawBody = true;
            if (leftAt < 0 && ((await ev("Hunting.projectiles.length")) > 0)) leftAt = (await ev("Graphics.frameCount")) - started;
            if (!(await swinging())) break;
        }
        const endedAt = (await ev("Graphics.frameCount")) - started;
        check("the sling whirls and the stone leaves on the release frame (~40 game frames into the swing)", leftAt >= 34 && leftAt <= 48, { leftAt });
        check("...and then one stone and 2 stamina are spent", (await count(64)) === stones0 - 1 && (await ev("$gameSystem.stamina()")) === st0 - 2, { stones: await count(64), stones0 });
        check("the whole swing lasts ~60 frames, then the player can move again", endedAt >= 54 && endedAt <= 72 && (await ev("$gamePlayer.canMove()")) === true, { endedAt });
        check("the swing sheet (not the walking sprite) was drawn", sawBody);
        await frames(60);

        // ---------------------------------------------------------------- the frame shown at the release, per facing
        const rows = { 2: 0, 4: 1, 6: 2, 8: 3 }, slingHit = await J("ChoppableTree.swingKind(9).hit"), hits = { 2: slingHit[0], 4: slingHit[1], 6: slingHit[2], 8: slingHit[3] };   // (the sheet in use: the new hero's or the old)
        for (const d of [2, 4, 6, 8]) {
            await standAt(d);
            await press("shoot");
            let at = null;
            for (let i = 0; i < 60; i++) {
                await frames(1);
                const t = await ev("$gamePlayer._swingEvent ? $gamePlayer._swingEvent._swingT : -1");
                if (t >= 41 && t <= 43) { at = await cell(); break; }
            }
            check("sling, facing " + d + ": the release frame is column " + hits[d] + " of row " + rows[d], !!at && at.col === hits[d] && at.row === rows[d], at);
            while (await swinging()) await frames(2);
            await frames(50);
        }

        // ---------------------------------------------------------------- the shot really hits
        await standAt(6);
        await ev(`(function(){ const a = Hunting.spawn("rabbit", ${lx + 4}, ${ly}); a._frozen = true; })(); 0`);
        const car0 = await ev("Hunting.carcasses().length");
        await frames(20);
        await press("shoot");
        for (let i = 0; i < 150 && (await ev("Hunting.animals.length")) > 0; i++) await frames(2);
        check("the animated sling shot kills a rabbit 4 tiles away", (await ev("Hunting.animals.length")) === 0 && (await ev("Hunting.carcasses().length")) === car0 + 1,
            { animals: await ev("Hunting.animals.length"), carcass: (await ev("Hunting.carcasses().length")) - car0, projectiles: await ev("Hunting.projectiles.length"), stones: await count(64), cooldown: await ev("typeof Hunting.cooldown"), swinging: await swinging(), player: await J("[$gamePlayer.x, $gamePlayer.y, $gamePlayer._realX, $gamePlayer._realY, $gamePlayer.direction()]"), rabbit: await J("Hunting.animals.map(a => [a._x, a._y, a._realX, a._realY])") });

        // ---------------------------------------------------------------- pressing F again during the swing does nothing
        await standAt(6);
        await frames(40);
        const s1 = await count(64);
        await press("shoot"); await frames(10); await press("shoot"); await frames(10); await press("shoot");
        await frames(80);
        check("more presses during the swing waste no stones", (await count(64)) === s1 - 1, { before: s1, after: await count(64) });

        // ---------------------------------------------------------------- the bow
        await give(126, 1); await give(127, 8);
        await standAt(6);
        await frames(40);
        const a0 = await count(127);
        await press("shoot");
        await frames(1);
        check("bow: kind 10, nothing has left yet (the arrow is used when it flies)", (await ev("$gamePlayer._swingEvent._swingKind")) === 10 && (await count(127)) === a0 && (await ev("Hunting.projectiles.length")) === 0);
        await frames(14);
        await b.shot("shoot_bow_draw.png");
        let bowLeft = -1;
        for (let i = 0; i < 70; i++) {
            await frames(1);
            if (bowLeft < 0 && (await ev("Hunting.projectiles.length")) > 0) bowLeft = await ev("$gamePlayer._swingEvent ? $gamePlayer._swingEvent._swingT : -1");
            if (!(await swinging())) break;
        }
        check("the arrow leaves when the string is let go (~36 game frames into the swing)", bowLeft >= 30 && bowLeft <= 46 && (await count(127)) === a0 - 1, { bowLeft, arrows: await count(127) });
        while (await swinging()) await frames(2);
        await frames(50);   // the cooldown of the last shot
        const bowHit = await J("ChoppableTree.swingKind(10).hit");
        for (const d of [2, 4, 6, 8]) {
            await standAt(d);
            await press("shoot");
            let at = null;
            for (let i = 0; i < 60; i++) {
                await frames(1);
                const t = await ev("$gamePlayer._swingEvent ? $gamePlayer._swingEvent._swingT : -1");
                if (t >= 37 && t <= 39) {
                    at = await cell();
                    for (let k = 0; k < 3 && (!at || at.col !== bowHit[rows[d]]); k++) { await frames(1); at = await cell(); }   // the picture may trail the counter by a frame or two
                    break;
                }
            }
            check("bow, facing " + d + ": the release frame is column " + bowHit[rows[d]] + " of row " + rows[d], !!at && at.col === bowHit[rows[d]] && at.row === rows[d], at);
            if (d === 6) await b.shot("shoot_bow_release.png");
            while (await swinging()) await frames(2);
            await frames(40);
        }
        // pictures of the sling as well
        await ev("$gameParty.loseItem($dataItems[126], 1, false); 0");
        await standAt(6); await frames(20); await press("shoot"); await frames(24); await b.shot("shoot_sling_whirl.png");
        while (await swinging()) await frames(2);
        await standAt(2); await frames(20); await press("shoot"); await frames(24); await b.shot("shoot_sling_front.png");
        while (await swinging()) await frames(2);

        // ---------------------------------------------------------------- the animation can be switched off
        await ev("Hunting.animate(false); 0");
        await standAt(6); await frames(40);
        await ev("Hunting.shoot()");
        check("with the animation off the shot leaves at once and nobody swings", (await ev("Hunting.projectiles.length")) === 1 && !(await swinging()));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
