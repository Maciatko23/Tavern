// node shot_installed.js [out.png] [hour]   (CDP_PORT=9376) - a new story game in the installed cottage (data/ as it is; only the
// start is set in the page to Map019 (2,5) - data/System.json may point elsewhere while the user tests), grandpa's intro
// skipped, the evening hour set, the real game screen (HUD on, minimap hidden) at the map's zoom 1.5.
const path = require("path");
const { launch, sleep } = require(path.join(__dirname, "..", "..", "tests", "cdp.js"));
const out = process.argv[2] || path.join(__dirname, "..", "..", "docs", "dom_dziadka", "zainstalowane.png");
const hour = Number(process.argv[3] || 19.5);
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const until = async (cond, secs) => { for (let i = 0; i < secs * 10; i++) { if (await ev(cond).catch(() => false)) return true; await sleep(100); } return false; };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(0); } }, 5); })`);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        if (!await until("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')", 60)) throw new Error("no title");
        await ev(`(function(){ Object.assign($dataSystem, { startMapId: 19, startX: 2, startY: 5 }); DataManager.setupNewGame(); $gameSystem._minimapHidden = true; SceneManager.goto(Scene_Map); return 0; })()`);
        await until("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId()===19", 40);
        await ev(`(function(){ if (window.Story && Story.skipIntro) Story.skipIntro(); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
            $gameSystem.setDayNightHour(${hour}); $gamePlayer.setDirection(4); return 0; })()`);
        await frames(20);
        await ev(`(function(){ $gameMap._interpreter.clear(); $gameMessage.clear(); return 0; })()`);
        await frames(160);
        const st = await ev(`JSON.stringify({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, g: $gameMap.event(901) && [$gameMap.event(901).x, $gameMap.event(901).y], hour: $gameSystem.dayNightHour().toFixed(1) })`);
        await b.shot(out);
        console.log("saved", out, st);
    } catch (e) { console.log("ERR", e.message); }
    console.log("page errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-5));
    await b.close();
    process.exit(0);
})();
