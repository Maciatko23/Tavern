// node mapshot.js <mapId> <out.png> [hour]  - the whole map in one picture, from the game itself (tiles + events, no HUD).
// Set CDP_PORT; OVERRIDE_DIR shows Map003/Map008 as the apply script would leave them (its --out DIR).
const { launch, sleep } = require("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tests/cdp.js");
const fs = require("fs");
const mapId = Number(process.argv[2] || 3), out = process.argv[3], hour = Number(process.argv[4] || 12);
(async () => {
    const data = JSON.parse(fs.readFileSync(`C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/data/Map${String(mapId).padStart(3, "0")}.json`, "utf8"));
    const W = data.width * 48, H = data.height * 48;
    const b = await launch({ width: W, height: H, dpr: 1 });
    const ev = e => b.evaluate(e);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        // OVERRIDE_DIR (env): Map003/Map008 from there instead of data/ (python tools/apply_newstart_maps.py --out DIR)
        const path = require("path"), over = {}, od = process.env.OVERRIDE_DIR;
        if (od) for (const f of ["Map003.json", "Map008.json"]) if (fs.existsSync(path.join(od, f))) over[f] = fs.readFileSync(path.join(od, f), "utf8");
        await ev(`(function(){ window.__over = ${JSON.stringify(over)}; const _load = DataManager.loadDataFile;
            DataManager.loadDataFile = function(name, src) { if (window.__over[src]) { window[name] = null; const t = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: t }, name, src, "data/" + src), 0); return; } return _load.call(this, name, src); };
            return 0; })()`);
        await ev(`(function(){ Graphics.resize(${W}, ${H}); Graphics.boxWidth = ${W}; Graphics.boxHeight = ${H}; DataManager.setupNewGame(); $gamePlayer.reserveTransfer(${mapId}, 0, 0, 2, 0); $gamePlayer.setTransparent(true); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===${mapId}`).catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ const s = SceneManager._scene; s.startFadeIn(1, false); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false);
            $gameSystem.setDayNightHour(${hour}); $gameScreen.changeWeather("none", 0, 0); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gamePlayer.setTransparent(true);
            $gameMap._displayX = 0; $gameMap._displayY = 0; $gamePlayer.center = () => {};
            for (const c of s.children) if (c !== s._spriteset) c.visible = false;
            return 0; })()`);
        await sleep(2500);
        const failed = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\s+/g, ' ') : ''; })()");
        if (failed) throw new Error("page error: " + failed);
        await b.shot(out);
        console.log("saved", out, W, H);
    } catch (e) { console.log("ERR", e.message); }
    console.log("errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-5));
    await b.close();
    process.exit(0);
})();
