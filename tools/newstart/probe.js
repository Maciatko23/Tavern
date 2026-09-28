// node probe.js <mapId> <startX> <startY> [exits JSON [[x,y],...]] [--edges]
// Loads the map in the real game (headless Edge, tests/cdp.js; set CDP_PORT) and walks it the way the player can:
// a flood fill over the engine's passability plus every event that blocks. Prints the reachable tile count, whether each
// given exit tile is reached, the standable tiles that cannot be reached (closed pockets), and with --edges the reachable
// tiles on the map border (where a new entrance could go).
const { launch, sleep } = require("../../tests/cdp.js");
const args = process.argv.slice(2);
const [mapId, sx, sy] = args.slice(0, 3).map(Number);
const exits = JSON.parse(args[3] && !args[3].startsWith("--") ? args[3] : "[]");
const edges = args.includes("--edges");
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
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(${mapId}, ${sx}, ${sy}, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===${mapId}`).catch(() => false)) break; await sleep(500); }
        await sleep(2000);
        const failed = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\s+/g, ' ') : ''; })()");
        if (failed) throw new Error("page error: " + failed);
        const r = await ev(`JSON.stringify((function(){
            const W = $gameMap.width(), H = $gameMap.height(), out = { size: W + "x" + H, outdoors: window.Survival ? Survival.isOutdoors() : null };
            let water = 0;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (window.Farming && Farming.isWaterTile(x, y)) water++;
            out.water = water;
            const evs = $gameMap.events();
            out.events = evs.length;
            out.trees = evs.filter(e => window.ChoppableTree && ChoppableTree.isTree(e)).length;
            out.bushes = evs.filter(e => e.characterName().startsWith("!$Bush_")).length;
            out.rocks = evs.filter(e => e.characterName().startsWith("!$Rock_") || e.characterName().startsWith("!$Boulder_")).length;
            const gather = {};
            let farm = 0;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                if (window.Farming && Farming.naturalFarmland(x, y)) farm++;
                const g = window.Farming && Farming.gatherAt(x, y); if (g) gather[g] = (gather[g] || 0) + 1; }
            out.farmland = farm; out.gather = gather;
            const solid = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough()) || (window.Farming && Farming.bushSolid && Farming.bushSolid(x, y));
            const ok = (x, y, d) => $gamePlayer.isMapPassable(x, y, d) && !solid($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d));
            const seen = new Set(["${sx},${sy}"]), queue = [[${sx}, ${sy}]];
            while (queue.length) { const [x, y] = queue.shift(); for (const d of [2, 4, 6, 8]) { const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d), k = nx + "," + ny;
                if (!$gameMap.isValid(nx, ny) || seen.has(k) || !ok(x, y, d)) continue; seen.add(k); queue.push([nx, ny]); } }
            out.reachable = seen.size;
            out.startSolid = solid(${sx}, ${sy});
            out.exits = ${JSON.stringify(exits)}.map(([x, y]) => x + "," + y + (seen.has(x + "," + y) ? " ok" : " CLOSED") + (solid(x, y) ? " SOLID" : ""));
            const pockets = [];
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                if (seen.has(x + "," + y)) continue;
                if (window.Farming && Farming.isWaterTile(x, y) && !$gameMap.isPassable(x, y, 2)) continue;
                if (solid(x, y)) continue;
                if (![2, 4, 6, 8].some(d => $gamePlayer.isMapPassable(x, y, d))) continue;
                pockets.push(x + "," + y);
            }
            out.pockets = pockets;
            if (${edges}) out.edges = [...seen].map(k => k.split(",").map(Number)).filter(([x, y]) => x <= 1 || y <= 1 || x >= W - 2 || y >= H - 2).map(c => c.join(",")).sort();
            out.transfers = evs.filter(e => e.list().some(c => c.code === 201)).map(e => { const c = e.list().find(c => c.code === 201); return e.eventId() + "@" + e.x + "," + e.y + "->" + c.parameters.slice(1, 4).join(",") + (seen.has(e.x + "," + e.y) ? "" : " UNREACHED"); });
            return out; })())`);
        console.log(r);
    } catch (e) { console.log("ERR", e.message); }
    console.log("errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-5));
    await b.close();
    process.exit(0);
})();
