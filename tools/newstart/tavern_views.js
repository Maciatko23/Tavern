// node tavern_views.js <outdir> [applied dir]  - pictures of the tavern's surroundings as the player sees them (1280x720, HUD and
// minimap hidden; set CDP_PORT). [applied dir] (python tools/apply_tavern_area.py --out DIR): its Map*.json are served instead of
// data/'s. Writes <outdir>/08_w_grze.png (in front of the tavern), 08_brama_otwiera_sie.png (the gate opening as he walks in),
// 08_wieczor.png (the same place at dusk) and 01_wyjscie_z_tawerny.png (inside, by the doorway out).
const { launch, sleep } = require("../../tests/cdp.js");
const fs = require("fs"), path = require("path");
const outdir = process.argv[2], dir = process.argv[3];
const over = {};
if (dir) for (const f of fs.readdirSync(dir)) if (/^(Map\d{3}|System)\.json$/.test(f)) over[f] = fs.readFileSync(path.join(dir, f), "utf8");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 5); })`);
    const onMap = m => ev(`$gameMap.mapId()===${m} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging()`).catch(() => false);
    const hide = hour => ev(`(function(){ const s = SceneManager._scene; s.startFadeIn(1, false); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false);
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
        $gameSystem.setDayNightHour(${hour}); $gameScreen.changeWeather("none", 0, 0); if (window.Survival && Survival.calmWeather) Survival.calmWeather();
        for (const c of s.children) if (c !== s._spriteset) c.visible = false;
        return 0; })()`);
    const go = async (m, x, y, d, hour) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${m}, ${x}, ${y}, ${d}, 2); return 0; })()`);
        for (let i = 0; i < 200; i++) { if (await onMap(m)) break; await sleep(100); }
        await sleep(1200);
        await hide(hour);
        await sleep(2500);
    };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ window.__over = ${JSON.stringify(over)}; const _load = DataManager.loadDataFile;
            DataManager.loadDataFile = function(name, src) { if (window.__over[src]) { window[name] = null; const t = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: t }, name, src, "data/" + src), 0); return; } return _load.call(this, name, src); };
            return 0; })()`);
        await ev(`(function(){ DataManager.setupNewGame(); $gameSystem._minimapHidden = true; $gamePlayer.reserveTransfer(8, 14, 11, 8, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await onMap(8)) break; await sleep(500); }
        await go(8, 14, 12, 8, 12);
        await b.shot(path.join(outdir, "08_w_grze.png"));
        await go(8, 14, 12, 8, 19.6);
        await b.shot(path.join(outdir, "08_wieczor.png"));
        // the gate opening: step up to it and walk in
        await go(8, 14, 10, 8, 12);
        await ev(`(function(){ Input.clear(); Input._currentState["up"] = true; return 0; })()`);
        for (let i = 0; i < 100; i++) { if (await ev(`(function(){ const g = $gameMap.events().find(e => e.characterName() === "!$Gate_Wood1"); return !!g && g.direction() === 6; })()`)) break; await sleep(15); }
        await b.shot(path.join(outdir, "08_brama_otwiera_sie.png"));
        await ev(`(function(){ Input._currentState["up"] = false; return 0; })()`);
        for (let i = 0; i < 200; i++) { if (await onMap(1)) break; await sleep(100); }
        await go(1, 8, 11, 2, 12);
        await b.shot(path.join(outdir, "01_wyjscie_z_tawerny.png"));
        console.log("saved in", outdir);
    } catch (e) { console.log("ERR", e.message); }
    console.log("page errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-5));
    await b.close();
    process.stdout.write("", () => process.exit(0));
})();
