// scouting: pictures + a few probes of the tavern's floors (CDP_PORT 9470-9479)
process.env.CDP_PORT = process.env.CDP_PORT || "9471";
const { launch, sleep } = require("../../tests/cdp.js");
const path = require("path");
const OUT = path.join(__dirname, "..", "..", "docs", "tawerna_zycie");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(200); } return false; };
    await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
    await until("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)", 90);
    await ev("Object.assign($dataSystem, { startMapId: 19, startX: 2, startY: 5 }); DataManager.setupNewGame(); SceneManager.goto(Scene_Map); 0");
    await until("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && $gameMap.mapId()===19", 40);
    await ev("Story.skipIntro(); Story.setDeadlineOn(false); 0");
    const go = async (m, x, y, d) => { await ev(`$gamePlayer.reserveTransfer(${m},${x},${y},${d||2},0); 0`); await until(`SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !$gamePlayer.isTransferring() && $gameMap.mapId()===${m}`, 40); await sleep(1500); await ev("if (window.Needs) Needs.setEnabled(false); $gameSystem._minimapHidden = true; 0"); };
    const spots = JSON.parse(process.env.SPOTS || "[]");
    for (const [m, x, y, d, name] of spots) { await go(m, x, y, d); await b.shot(path.join(OUT, "zwiad_" + name + ".png")); console.log(name, JSON.stringify(await J("({m:$gameMap.mapId(),x:$gamePlayer.x,y:$gamePlayer.y})"))); }
    if (process.env.EVAL) { console.log(JSON.stringify(await J(process.env.EVAL))); await sleep(1500); await b.shot(path.join(OUT, "zwiad_eval.png")); }
    await b.close();
    process.exit(0);
})();
