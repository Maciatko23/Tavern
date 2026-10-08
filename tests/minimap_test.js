// Minimap in the top right corner, the goal window under it; M toggles; small maps have no minimap and the goal takes its place.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 20000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev("ConfigManager.uiClean = false; 0");   // (the classic look: this test checks the old panels' places - CleanHUD.js's clean look is tests/clean_hud_test.js)
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(2500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(80); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        await frames(60);
        const info = () => ev(`(function(){ const s = SceneManager._scene, m = s._minimap, t = s._goalTracker;
            return { mini: { visible: m.visible, x: m.x, y: m.y, scale: m._scale, painted: m._painted, w: m._map.bitmap && m._map.bitmap.width, h: m._map.bitmap && m._map.bitmap.height, panelH: m._panelH },
                goal: { visible: t.visible, x: t.x, y: t.y, w: t.bitmap.width }, rect: Minimap.rect(), menuBtn: s._menuButton ? { x: s._menuButton.x + s._windowLayer.x, y: s._menuButton.y + s._windowLayer.y, w: s._menuButton.width, h: s._menuButton.height, visible: s._menuButton.visible } : null }; })()`);
        let st = await info();
        console.log(JSON.stringify(st));
        check("the minimap is shown on the big meadow map (40x30), scale 5 -> 200x150", st.mini.visible && st.mini.scale === 5 && st.mini.w === 200 && st.mini.h === 150, st.mini);
        check("its terrain was painted", st.mini.painted);
        check("it sits in the top right corner", st.mini.x + 216 <= 1280 - 8 && st.mini.x > 1280 - 216 - 30 && st.mini.y <= 80, { x: st.mini.x, y: st.mini.y });
        check("it does not cover the menu button", !st.menuBtn || st.mini.y >= st.menuBtn.y + st.menuBtn.h - 2 || st.mini.x + 216 <= st.menuBtn.x, st.menuBtn);
        check("the goal window sits right under it, same left edge and width", st.goal.visible && st.goal.x === st.mini.x && st.goal.y === st.mini.y + st.mini.panelH + 6 && st.goal.w === 216, st.goal);
        // the terrain has more than one colour and the player marker is where the player is
        const px = await ev(`(function(){ const m = SceneManager._scene._minimap, ctx = m._terrain.context, w = m._terrain.width, h = m._terrain.height; const d = ctx.getImageData(0, 0, w, h).data; const seen = new Set(); for (let i = 0; i < d.length; i += 16) seen.add((d[i] >> 4) + "," + (d[i + 1] >> 4) + "," + (d[i + 2] >> 4)); return { colours: seen.size, marker: { x: m._me.x - m._map.x, y: m._me.y - m._map.y }, player: { x: $gamePlayer._realX * m._scale, y: $gamePlayer._realY * m._scale } }; })()`);
        check("the terrain shows many colours (grass, path, water, cliffs...)", px.colours >= 8, px.colours);
        check("the player marker is on the player", Math.abs(px.marker.x - (px.player.x + 2.5)) < 1.5 && Math.abs(px.marker.y - (px.player.y + 2.5)) < 1.5, px);
        await b.shot(OUT + "mm_map.png");

        // the trees and rocks appear as dots on top of the terrain
        const dots = await ev(`(function(){ const m = SceneManager._scene._minimap; const ctx = m._composite.context; const S = m._scale; let tree = 0, rock = 0;
            for (const e of $gameMap.events()) { if (e._erased) continue; const d = e.event(); const x = Math.round(e._realX * S) + 2, y = Math.round(e._realY * S) + 2; const p = ctx.getImageData(x, y, 1, 1).data; const hex = (p[0] << 16 | p[1] << 8 | p[2]);
                if (/Sosn|Drzew/.test(d.name) && hex === 0x1d5c34) tree++; if (/<Rock/.test(d.note || "") || /^!\\$(Rock_|Boulder_)/.test(e.characterName())) { if (hex === 0xa8a8ac || hex === 0xc8763a) rock++; } }
            return { tree, rock }; })()`);
        check("trees and rocks are drawn as dots", dots.tree >= 10 && dots.rock >= 5, dots);

        // a building appears after the refresh
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || []; L.push({ id: f.nextId++, type: "sawmill", x: 20, y: 6, last: 1 }); f.rev++; })()`);
        await frames(50);
        const bld = await ev(`(function(){ const m = SceneManager._scene._minimap; const p = m._composite.context.getImageData(20 * m._scale + 2, 6 * m._scale + 2, 1, 1).data; return [p[0], p[1], p[2]]; })()`);
        check("a new building shows up on the map (tan)", bld[0] > 180 && bld[1] > 130 && bld[2] < 140, bld);

        // the view frame follows the camera
        const v1 = await ev("SceneManager._scene._minimap._view.x");
        await ev("$gamePlayer.locate(8, 6); $gameMap.setDisplayPos(0, 0); 0");
        await frames(10);
        const v2 = await ev("SceneManager._scene._minimap._view.x");
        check("the frame of the visible area moves with the camera", v1 !== v2, { v1, v2 });
        await ev(`$gamePlayer.locate(22, 14); $gameMap.setDisplayPos(9, 7); 0`);
        await frames(20);

        // M hides it; the goal window moves up into its place
        await press("minimap"); await frames(10);
        st = await info();
        check("M hides the minimap", !st.mini.visible, st.mini.visible);
        check("and the goal window moves up to the top", st.goal.y === st.rect.y && st.goal.x === st.rect.x, { goal: st.goal, rect: st.rect });
        await b.shot(OUT + "mm_hidden.png");
        await press("minimap"); await frames(10);
        st = await info();
        check("M shows it again", st.mini.visible && st.goal.y === st.mini.y + st.mini.panelH + 6);

        // the big tavern (Map001, 101x55 since 2026-10-05) has a minimap like any big map
        await ev("$gamePlayer.reserveTransfer(1, 50, 53, 8, 0); 0");
        for (let i = 0; i < 40; i++) { if (await ev("$gameMap.mapId() === 1 && !SceneManager.isSceneChanging()")) break; await sleep(300); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); 0");
        await frames(60);
        st = await info();
        check("the big tavern (Map001) has its minimap", st.mini.visible, st.mini);
        await b.shot(OUT + "mm_tavern.png");
        // a map that fits the screen has no minimap: the hut (Map100, 7x6)
        await ev("$gamePlayer.reserveTransfer(100, 3, 3, 2, 0); 0");
        for (let i = 0; i < 40; i++) { if (await ev("$gameMap.mapId() === 100 && !SceneManager.isSceneChanging()")) break; await sleep(300); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); 0");
        await frames(60);
        st = await info();
        check("the small hut map has no minimap", !st.mini.visible, st.mini);
        check("and the goal window takes the top right place", st.goal.visible && st.goal.y === st.rect.y, st.goal);
        await b.shot(OUT + "mm_hut.png");
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
