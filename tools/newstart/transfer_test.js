// node transfer_test.js <transfers.json> [applied dir]  - walks every transfer of the new start in the real game (headless Edge):
// the hero stands on the tile before the exit, the arrow key is held until the map changes, then the map, tile and facing
// are checked. With [applied dir] (python tools/apply_newstart_maps.py --out DIR) the game gets that dir's Map003/Map008/System
// instead of data/'s, so the ends on the existing maps can be tried before the apply script has run. Also starts a new game
// (the start map from that System.json). Set CDP_PORT.
const { launch, sleep } = require("../../tests/cdp.js");
const fs = require("fs"), path = require("path");
const list = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const dir = process.argv[3];
const over = {};
if (dir) for (const f of ["Map003.json", "Map008.json", "System.json"]) if (fs.existsSync(path.join(dir, f))) over[f] = fs.readFileSync(path.join(dir, f), "utf8");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 5); })`);
    const results = [];
    let fails = 0;
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        const failed = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText : ''; })()");
        if (failed) throw new Error("page error: " + failed);
        // the changed existing files, served instead of data/'s
        await ev(`(function(){
            window.__over = ${JSON.stringify(over)};
            const _load = DataManager.loadDataFile;
            DataManager.loadDataFile = function(name, src) {
                if (window.__over[src]) { window[name] = null; const text = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: text }, name, src, "data/" + src), 0); return; }
                return _load.call(this, name, src);
            };
            if (window.__over["System.json"]) { const s = JSON.parse(window.__over["System.json"]); Object.assign($dataSystem, { startMapId: s.startMapId, startX: s.startX, startY: s.startY }); }
            return 0; })()`);
        // a new game: where does it start?
        await ev(`(function(){ DataManager.setupNewGame(); $gameSystem._minimapHidden = true; SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()`).catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); return 0; })()`);
        const start = await J(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, name: $gameMap.displayName() })`);
        console.log("new game starts at", JSON.stringify(start));
        // (a story game opens with grandpa's talk - no transfer happens while it runs: skipped, as tests/lib/kit.js does)
        await ev(`(function(){ if (window.Story && Story.skipIntro) Story.skipIntro(); $gameMap._interpreter.clear(); $gameMessage.clear(); return 0; })()`);
        await frames(30);
        const KEY = { 2: "down", 4: "left", 6: "right", 8: "up" }, STEP = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
        for (const t of list) {
            const [fm, x, y, tm, tx, ty, d, kind, walk] = t;
            const [sx, sy] = [x - STEP[walk][0], y - STEP[walk][1]];
            // go to the tile before the exit
            await ev(`(function(){ $gamePlayer.reserveTransfer(${fm}, ${sx}, ${sy}, ${walk}, 2); return 0; })()`);
            for (let i = 0; i < 200; i++) { if (await ev(`$gameMap.mapId()===${fm} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && $gamePlayer.x===${sx} && $gamePlayer.y===${sy}`).catch(() => false)) break; await sleep(100); }
            await frames(20);
            await ev(`(function(){ if ($gameMessage.isBusy()) $gameMessage.clear(); Input.clear(); Input._currentState["${KEY[walk]}"] = true; return 0; })()`);
            let moved = false;
            for (let i = 0; i < 100; i++) { await sleep(60); if (await ev(`$gamePlayer.isTransferring() || $gameMap.mapId()!==${fm}`)) { moved = true; break; } }
            await ev(`(function(){ Input._currentState["${KEY[walk]}"] = false; return 0; })()`);
            for (let i = 0; i < 200; i++) { if (await ev(`!$gamePlayer.isTransferring() && SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && $gameMap.mapId()===${tm}`).catch(() => false)) break; await sleep(100); }
            await frames(5);
            const r = await J(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })`);
            const ok = moved && r.map === tm && r.x === tx && r.y === ty && r.d === d;
            if (!ok) fails++;
            const line = `${ok ? "ok  " : "FAIL"} ${kind} Map${String(fm).padStart(3, "0")}(${x},${y}) walking ${KEY[walk]} -> Map${String(tm).padStart(3, "0")}(${tx},${ty}) facing ${KEY[d]}` + (ok ? "" : `  got ${JSON.stringify(r)} moved=${moved}`);
            results.push(line);
            console.log(line);
        }
    } catch (e) { console.log("ERR", e.message); fails++; }
    const errs = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("page errors:", errs.slice(-5));
    console.log(fails ? `FAILED ${fails}` : `all ${results.length} transfers ok`);
    await b.close();
    process.exit(0);
})();
