// "Gra zapisana" is said at the top centre of the screen (a small plate), not over the player; under the day's greeting or the
// "Tryb walki" badge when one of those is shown.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        await frames(400);   // (the popups of the start fade away)
        const state = () => J(`(function(){ const s = SceneManager._scene, n = s._topNotice, d = s._dayBanner, m = s._modeBadge; return { said: $gameTemp._lastTopNotice || null, visible: !!(n && n.visible), x: n && Math.round(n.x), y: n && Math.round(n.y), w: Graphics.width, popups: ($gameTemp._lootPopups || []).map(p => p.text), day: !!(d && d.visible), dayBottom: d && d.bitmap ? Math.round(d.y + d.bitmap.height) : 0, badge: !!(m && m.visible), badgeBottom: m && m.bitmap ? Math.round(m.y + m.bitmap.height) : 0 }; })()`);

        // ---- a plain autosave
        await ev("SceneManager._scene.onAutosaveSuccess(); 0");
        await frames(30);
        const s1 = await state();
        check("the autosave says 'Gra zapisana (autozapis)' at the top centre", s1.said === "Gra zapisana (autozapis)" && s1.visible && s1.x === s1.w / 2 && s1.y >= 8 && s1.y <= 14, s1);
        check("...and no longer over the player", !s1.popups.some(t => /zapisana/.test(t)), s1.popups);
        await b.shot("save_notice.png");
        await frames(200);
        check("it fades away after a few seconds", !(await state()).visible);

        // ---- with the day's greeting shown: under it
        await ev(`$gameTemp.queueDayBanner("Czujesz się wypoczęty."); 0`);
        await frames(30);
        await ev("SceneManager._scene.onAutosaveSuccess(); 0");
        await frames(30);
        const s2 = await state();
        check("with the day's greeting at the top, the notice sits under it", s2.day && s2.visible && s2.y >= s2.dayBottom && s2.y <= s2.dayBottom + 12, s2);
        await b.shot("save_notice_day.png");
        await frames(300);

        // ---- in the combat mode: under the "Tryb walki" badge
        await ev("Combat.setCombatMode(true); 0");
        await frames(20);
        await ev("SceneManager._scene.onAutosaveSuccess(); 0");
        await frames(30);
        const s3 = await state();
        check("in the combat mode the notice sits under the 'Tryb walki' badge", s3.badge && s3.visible && s3.y >= s3.badgeBottom && s3.y <= s3.badgeBottom + 12, s3);
        await b.shot("save_notice_combat.png");
        await ev("Combat.setCombatMode(false); 0");
        await ev("SceneManager._scene.onAutosaveFailure(); 0");
        await frames(30);
        check("a failed autosave is said there too", (await state()).said === "Autozapis nie powiódł się");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
