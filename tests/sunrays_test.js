// Sun rays after a storm (Storm.js): none while it rages, soft warm shafts as it passes and for about 1.5 h after, gone later; none
// at night.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const look = () => J(`(function(){ const r = SceneManager._scene._spriteset._sunRays; return { rays: Math.round(Storm.rays() * 100) / 100, visible: r.visible, shown: Math.round(r._shown * 100) / 100, opacity: Math.max(0, ...r._shafts.filter(s => s.visible).map(s => s.opacity)), shafts: r._shafts.filter(s => s.visible).length }; })()`);

        await ev("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); 0");
        await frames(60);
        const rage = await look();
        check("while the storm rages: no sun rays", rage.rays === 0 && !rage.visible, rage);
        await ev("$gameSystem.setDayNightHour($gameSystem._stormForce.end + 0.3); 0");
        await frames(140);
        const pass = await look();
        check("just after the storm (by day): the sun breaks through - warm shafts on the screen", pass.rays === 1 && pass.visible && pass.shafts >= 3 && pass.opacity > 20, pass);
        await b.shot("sunrays.png");
        // they lie on the map: scrolled 3 tiles right, every shaft is 3 tiles (144 px) further left on the screen
        const at = () => J("SceneManager._scene._spriteset._sunRays._shafts.map(s => ({ x: s.x, y: s.y, v: s.visible }))");
        const x0 = await at();
        await ev("$gameMap.setDisplayPos($gameMap.displayX() + 3, $gameMap.displayY()); 0");
        await frames(2);
        const x1 = await at();
        const both = x0.map((p, i) => [p, x1[i]]).filter(([p, q]) => p.v && q.v), moved = both.map(([p, q]) => Math.round(q.x - p.x));
        check("the shafts lie on the map: the view moved 3 tiles right, they moved 144 px left (only their slow drift apart)", moved.length >= 2 && moved.every(d => Math.abs(d + 144) <= 3) && both.every(([p, q]) => q.y === p.y), moved);
        await ev("$gameSystem.setDayNightHour($gameSystem._stormForce.end + 1.3); 0");
        await frames(20);
        const late = await look();
        check("an hour later they are fading", late.rays > 0 && late.rays < 0.5, late);
        await ev("$gameSystem.setDayNightHour($gameSystem._stormForce.end + 1.8); 0");
        await frames(160);
        const gone = await look();
        check("after about 1.5 h they are gone", gone.rays === 0 && !gone.visible, gone);
        const night = await ev("(function(){ const d = $gameSystem.dayNightDay(); $gameSystem._stormForce = { day: d, start: 20.35, end: 22.35 }; return Storm.raysAt(d, 22.6); })()");
        check("a storm that ends at night: no rays", night === 0, night);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
