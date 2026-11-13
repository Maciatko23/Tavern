// shoots a meal at each of the 4 seats (overlay: GAME_OVERLAY=tools/tawerna_zycie/staging GAME_OVERLAY_JS=1, CDP_PORT 9470-9479)
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
    await ev("Story.skipIntro(); Story.setDeadlineOn(false); $gameSystem._story.flags.hired = true; $gameSystem._story.flags.field = true; 0");
    await ev("$gamePlayer.reserveTransfer(1, 14, 31, 8, 0); 0");
    await until("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !$gamePlayer.isTransferring() && $gameMap.mapId()===1", 40);
    await sleep(1500);
    await ev("if (window.Needs) Needs.setEnabled(false); $gameSystem._minimapHidden = true; $gameSystem._dayNightDay = 3; $gameSystem._dayNightHour = " + (process.env.HOUR || 12) + "; $gameParty.gainGold(500); 0");
    if (process.env.GUESTS) { await ev("GoscieSala.layOut(); 0"); await sleep(2500); }
    const seats = await J("TavernLife.spots('mealtable').map(s => ({ id: s.id, x: s.x, y: s.y, d: s.a.dir }))");
    console.log(JSON.stringify(seats));
    for (const s of seats) {
        // put the hero next to that seat so it is the nearest free one
        await ev(`$gamePlayer.locate(${s.x + (s.d == 6 ? -1 : 1)}, ${s.y + 1}); 0`);
        await sleep(300);
        await ev("TavernLife.meal('gulasz'); 0");
        const ok = await until("TavernLife.fx.some(f => f.kind === 'plate') && $gamePlayer._toolSwing && $gamePlayer._toolSwing._waiting", 40);
        await sleep(800);
        const info = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, plate: TavernLife.fx.filter(f => f.kind === 'plate').map(f => [f.x, f.y]) })");
        console.log(s.id, ok, JSON.stringify(info));
        await b.shot(path.join(OUT, "posilek_" + (process.env.GUESTS ? "goscie_" : "miejsce_") + s.id + ".png"));
        await until("!TavernLife.busy() && !$gameMap.isEventRunning()", 60);
        await sleep(500);
    }
    await b.close(); process.exit(0);
})();
