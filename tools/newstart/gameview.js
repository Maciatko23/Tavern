// node gameview.js <mapId> <x> <y> <out.png> [hour=12] [direction=2]  - the game screen (1280x720) as the player sees it
// standing on (x, y) of the map: zoom, lights, the hero; the HUD and the minimap are hidden. Set CDP_PORT.
const { launch, sleep } = require("../../tests/cdp.js");
const [mapId, x, y] = process.argv.slice(2, 5).map(Number), out = process.argv[5];
const hour = Number(process.argv[6] || 12), dir = Number(process.argv[7] || 2);
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        // OVERRIDE_DIR (env): Map003/Map008 from there instead of data/ (python tools/apply_newstart_maps.py --out DIR)
        const fs = require("fs"), path = require("path"), over = {}, od = process.env.OVERRIDE_DIR;
        if (od) for (const f of ["Map003.json", "Map008.json"]) if (fs.existsSync(path.join(od, f))) over[f] = fs.readFileSync(path.join(od, f), "utf8");
        await ev(`(function(){ window.__over = ${JSON.stringify(over)}; const _load = DataManager.loadDataFile;
            DataManager.loadDataFile = function(name, src) { if (window.__over[src]) { window[name] = null; const t = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: t }, name, src, "data/" + src), 0); return; } return _load.call(this, name, src); };
            return 0; })()`);
        await ev(`(function(){ DataManager.setupNewGame(); $gameSystem._minimapHidden = true; $gamePlayer.reserveTransfer(${mapId}, ${x}, ${y}, ${dir}, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===${mapId}`).catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ const s = SceneManager._scene; s.startFadeIn(1, false); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false);
            if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
            $gameSystem.setDayNightHour(${hour}); $gameScreen.changeWeather("none", 0, 0); if (window.Survival && Survival.calmWeather) Survival.calmWeather();
            for (const c of s.children) if (c !== s._spriteset) c.visible = false;
            return 0; })()`);
        await sleep(3000);
        const failed = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\s+/g, ' ') : ''; })()");
        if (failed) throw new Error("page error: " + failed);
        await b.shot(out);
        console.log("saved", out);
    } catch (e) { console.log("ERR", e.message); }
    console.log("errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-5));
    await b.close();
    process.exit(0);
})();
