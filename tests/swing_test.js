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
            return { t: e ? e._swingT : -1, visible: !!(b && b.visible), col: b ? Math.round(b._frame.x / 96) : -1, row: b ? Math.round(b._frame.y / 96) : -1, w: b && b.bitmap ? b.bitmap.width : 0,
                sheet: b && b.bitmap && b.bitmap._url ? b.bitmap._url.replace(/^.*\\/|\\.png$/g, "") : "" }; })()`);
        // frozen from inside the game loop, right after the update that reached swing frame T (a poll from outside can miss frames at
        // full speed). (MZ's Scene_Map updates the sprites before the game logic, so the body shows the sheet frame of T - 1)
        const freezeAt = T => ev(`new Promise(res => { const sc = SceneManager._scene, up = sc.update;
            sc.update = function() { up.apply(this, arguments); const e = $gamePlayer._swingEvent; if (!e || e._swingT >= ${T}) { sc.update = function(){}; res(e ? e._swingT : -1); } }; })`);
        const unfreeze = () => ev("delete SceneManager._scene.update; 0");
        // the sheet the hero swings for a kind: the new hero's (HeroLook.js, Hero_*) or the old Swing_* - its width, frames, hit frames
        const sheetOf = kind => ev(`new Promise(res => { const d = ChoppableTree.swingKind(${kind}), bm = ImageManager.loadSystem(d.sheet);
            bm.addLoadListener(() => res({ sheet: d.sheet, w: bm.width, frames: bm.width / 96, hit: d.hit.slice(), heroLook: !!(window.HeroLook && HeroLook.active()) })); })`);
        const crop = async (file) => {
            const p = await ev(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); const g = s.getGlobalPosition(); const r = Graphics.app.view.getBoundingClientRect(); const k = r.width / Graphics.app.view.width; return { x: r.left + g.x * k, y: r.top + g.y * k }; })()`);
            const r = await b.send("Page.captureScreenshot", { format: "png", clip: { x: p.x - 70, y: p.y - 100, width: 140, height: 130, scale: DPR * 16 } });
            fs.writeFileSync(file, Buffer.from(r.data, "base64"));
        };

        // ---- hammer, all four directions: sheet visible, right row, frames advance
        // (the sheet: the new hero's Hero_Hammer - 17 frames - since HeroLook.js, the old Swing_Hammer had 10; read from the game)
        const ROW = { 2: 0, 4: 1, 6: 2, 8: 3 };
        const HAM = await sheetOf(7), ROD = await sheetOf(8);
        const sheetOk = (sh, want) => sh === want.sheet && Number.isInteger(want.frames) && want.frames > 1 && (want.heroLook ? /^Hero_/ : /^Swing_/).test(want.sheet);
        console.log("sheets:", JSON.stringify({ hammer: HAM, rod: ROD }));
        for (const dir of [2, 4, 6, 8]) {
            await ev(`$gamePlayer.locate(24, 17); $gamePlayer.setDirection(${dir}); $gameMap.setDisplayPos(24 - 13, 16 - 6); 0`);
            await frames(10);
            await ev("window._hit = 0; $gamePlayer.startToolSwing(7, () => { window._hit = $gamePlayer._swingEvent._swingT; }); 0");
            const seen = new Set(); let rowOk = true, visOk = true, w = 0, sheet = "";
            for (const T of [4, 10, 16, 18, 22, 27]) {
                await freezeAt(T);
                const s = await bodyInfo();
                seen.add(s.col); rowOk = rowOk && s.row === ROW[dir]; visOk = visOk && s.visible; w = s.w; sheet = s.sheet;
                if ([4, 10, 18, 22].includes(T)) await crop(OUT + `hammer_${dir}_t${T}.png`);
                await unfreeze();
            }
            await frames(20);
            const after = await bodyInfo();
            check(`hammer dir ${dir}: sheet ${w}px wide (${HAM.frames} frames), sprite visible and on row ${ROW[dir]}`, visOk && rowOk && w === HAM.w && sheetOk(sheet, HAM), { sheet, w, rowOk, visOk });
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
        // (the old Swing_Rod held its last frame, col 10; the new hero's Hero_Rod holds its waiting pose - the hit frame of the row,
        // HeroLook.js: 14, 12 from behind - with the line out, and the last frames are never reached while fishing)
        const rodHeld = ROD.hit[ROW[2]];
        check(`the rod winds up across the sheet, then holds its waiting frame (col ${rodHeld}) while the line floats`, rodFrames[3][1] < rodHeld && rodFrames.slice(0, 4).every(([t, c], i, a) => i === 0 || c > a[i - 1][1]) && rodFrames.slice(4).every(([t, c]) => c === rodHeld), rodFrames);
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
            check(`rod dir ${dir}: sheet ${s.w}px wide (${ROD.frames} frames), row ${ROW[dir]}, pose held`, s.visible && s.row === ROW[dir] && s.w === ROD.w && sheetOk(s.sheet, ROD) && s.col === ROD.hit[ROW[dir]], s);
            await crop(OUT + `rod_${dir}_held.png`);
            await unfreeze();
            await frames(140);
        }
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
