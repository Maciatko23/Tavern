// Full-body hammer and fishing-rod swings: the sheet is used in all four directions, frames advance, the pose is held during fishing.
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const OUT = __dirname + "/swing/";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const DPR = 0.5;
    const b = await launch({ width: 2560, height: 1440, dpr: DPR });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 20000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameMap.setDisplayPos(24 - 13, 16 - 6); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); $gameParty.gainItem($dataItems[100], 1); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        await sleep(600);

        // player sprite state: which sheet cell the body sprite shows
        const bodyInfo = () => ev(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); const b = s && s._swingBody; const e = $gamePlayer._swingEvent;
            return { t: e ? e._swingT : -1, visible: !!(b && b.visible), col: b ? Math.round(b._frame.x / 96) : -1, row: b ? Math.round(b._frame.y / 96) : -1, w: b && b.bitmap ? b.bitmap.width : 0 }; })()`);
        const freezeAt = T => ev(`new Promise(res => { const iv = setInterval(() => { const e = $gamePlayer._swingEvent; if (!e || e._swingT >= ${T}) { clearInterval(iv); SceneManager._scene.update = function(){}; res(e ? e._swingT : -1); } }, 1); })`);
        const unfreeze = () => ev("delete SceneManager._scene.update; 0");
        const crop = async (file) => {
            const p = await ev(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); const g = s.getGlobalPosition(); const r = Graphics.app.view.getBoundingClientRect(); const k = r.width / Graphics.app.view.width; return { x: r.left + g.x * k, y: r.top + g.y * k }; })()`);
            const r = await b.send("Page.captureScreenshot", { format: "png", clip: { x: p.x - 70, y: p.y - 100, width: 140, height: 130, scale: DPR * 16 } });
            fs.writeFileSync(file, Buffer.from(r.data, "base64"));
        };

        // ---- hammer, all four directions: sheet visible, right row, frames run 0..9
        const ROW = { 2: 0, 4: 1, 6: 2, 8: 3 };
        for (const dir of [2, 4, 6, 8]) {
            await ev(`$gamePlayer.locate(24, 17); $gamePlayer.setDirection(${dir}); $gameMap.setDisplayPos(24 - 13, 16 - 6); 0`);
            await frames(10);
            await ev("window._hit = 0; $gamePlayer.startToolSwing(7, () => { window._hit = $gamePlayer._swingEvent._swingT; }); 0");
            const seen = new Set(); let rowOk = true, visOk = true, w = 0;
            for (const T of [4, 10, 16, 18, 22, 27]) {
                await freezeAt(T);
                const s = await bodyInfo();
                seen.add(s.col); rowOk = rowOk && s.row === ROW[dir]; visOk = visOk && s.visible; w = s.w;
                if ([4, 10, 18, 22].includes(T)) await crop(OUT + `hammer_${dir}_t${T}.png`);
                await unfreeze();
            }
            await frames(20);
            const after = await bodyInfo();
            check(`hammer dir ${dir}: sheet ${w}px wide (10 frames), sprite visible and on row ${ROW[dir]}`, visOk && rowOk && w === 960, { w, rowOk, visOk });
            check(`hammer dir ${dir}: the frames advance (${[...seen].join(",")}) and the hit fires on frame 18`, seen.size >= 5 && (await ev("window._hit")) === 18, [...seen]);
            check(`hammer dir ${dir}: the swing ends and the body sprite hides`, after.t === -1 && !after.visible, after);
        }

        // ---- fishing: the swing has to cover the whole time the line floats
        await ev(`$gamePlayer.locate(24, 17); $gamePlayer.setDirection(2); $gameSystem.setStamina(100); 0`);
        await frames(10);
        const started = await ev("Farming.goFishing()");
        check("goFishing starts", started === true);
        const rodFrames = [];
        let heldFrom = -1, heldTo = -1;
        for (const T of [3, 8, 14, 20, 24, 40, 80, 118]) {
            await freezeAt(T);
            const s = await bodyInfo();
            rodFrames.push([s.t, s.col]);
            if ([8, 14, 24, 80].includes(T)) await crop(OUT + `rod_2_t${T}.png`);
            await unfreeze();
        }
        console.log("rod frames [t, col]:", JSON.stringify(rodFrames));
        check("the rod winds up across the sheet, then holds its last frame (col 10) while the line floats", rodFrames[3][1] < 10 && rodFrames.slice(4).every(([t, c]) => c === 10), rodFrames);
        const busy = await ev("$gamePlayer._toolSwing ? $gamePlayer._toolSwing._swingT : -1");
        await frames(45);
        const fin = await bodyInfo();
        check("after the fishing is over the swing is released and the player can move again", fin.t === -1 && !fin.visible && (await ev("$gamePlayer.canMove()")), fin);
        for (const dir of [4, 6, 8]) {
            await ev(`$gamePlayer.setDirection(${dir}); $gameSystem.setStamina(100); 0`);
            await frames(6);
            await ev("Farming.goFishing()");
            await freezeAt(30);
            const s = await bodyInfo();
            check(`rod dir ${dir}: sheet ${s.w}px wide (11 frames), row ${ROW[dir]}, pose held`, s.visible && s.row === ROW[dir] && s.w === 1056 && s.col === 10, s);
            await crop(OUT + `rod_${dir}_held.png`);
            await unfreeze();
            await frames(140);
        }
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
