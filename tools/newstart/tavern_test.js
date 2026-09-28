// node tavern_test.js <spec.json> [dir]  - the tavern's surroundings in the real game (headless Edge, tests/cdp.js; set CDP_PORT).
// [dir] (python tools/apply_tavern_area.py --out DIR): its Map*.json / System.json are served instead of data/'s, so the maps
// can be tried before the apply script has run. The spec (made by tavern_test.py):
//   probes:    [{map, starts: [[x,y]...], need: [[x,y]...]}] - a flood fill over the engine's passability and every event that
//              blocks, from each start: are the needed tiles reached, which standable tiles are not (closed pockets), water tiles
//   transfers: [[fromMap, x, y, toMap, tx, ty, facing, kind, walk]] - the hero stands on the tile before (x, y), the arrow key
//              `walk` is held until the map changes (a door opens first), then the map, tile and facing are checked
const { launch, sleep } = require("../../tests/cdp.js");
const fs = require("fs"), path = require("path");
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const dir = process.argv[3];
const over = {};
if (dir) for (const f of fs.readdirSync(dir)) if (/^(Map\d{3}|System)\.json$/.test(f)) over[f] = fs.readFileSync(path.join(dir, f), "utf8");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    // (bounded: when a file fails to load the game stops counting frames, and the "Failed to load" check below ends the run)
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}, t0 = Date.now(); const iv = setInterval(() => { if (Graphics.frameCount >= t || Date.now() - t0 > 4000) { clearInterval(iv); res(Graphics.frameCount); } }, 5); })`);
    const loadError = async () => { const e = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\s+/g, ' ') : ''; })()").catch(() => ""); if (e) throw new Error("page error: " + e); };
    let fails = 0, done = 0;
    const onMap = (m, x, y) => ev(`$gameMap.mapId()===${m} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging()` + (x === undefined ? "" : ` && $gamePlayer.x===${x} && $gamePlayer.y===${y}`)).catch(() => false);
    const goto = async (m, x, y, d) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${m}, ${x}, ${y}, ${d}, 2); return 0; })()`);
        for (let i = 0; i < 200; i++) { if (await onMap(m, x, y)) break; if (i % 20 === 19) await loadError(); await sleep(100); }
        await loadError();
        await frames(20);
    };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        const failed = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\\s+/g, ' ') : ''; })()");
        if (failed) throw new Error("page error: " + failed);
        await ev(`(function(){
            window.__over = ${JSON.stringify(over)};
            const _load = DataManager.loadDataFile;
            DataManager.loadDataFile = function(name, src) {
                if (window.__over[src]) { window[name] = null; const text = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: text }, name, src, "data/" + src), 0); return; }
                return _load.call(this, name, src);
            };
            return 0; })()`);
        await ev(`(function(){ DataManager.setupNewGame(); $gameSystem._minimapHidden = true; $gamePlayer.reserveTransfer(${spec.probes[0].map}, ${spec.probes[0].starts[0][0]}, ${spec.probes[0].starts[0][1]}, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await onMap(spec.probes[0].map)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); return 0; })()`);
        // ---- walkability
        for (const p of spec.probes) {
            await goto(p.map, p.starts[0][0], p.starts[0][1], 2);
            const r = await J(`(function(){
                const W = $gameMap.width(), H = $gameMap.height(), out = { map: $gameMap.mapId(), size: W + "x" + H, tileset: $gameMap.tilesetId() };
                let water = 0;
                for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (window.Farming && Farming.isWaterTile(x, y)) water++;
                out.water = water;
                out.events = $gameMap.events().length;
                const solid = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough()) || (window.Farming && Farming.bushSolid && Farming.bushSolid(x, y));
                const ok = (x, y, d) => $gamePlayer.isMapPassable(x, y, d) && !solid($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d));
                const fill = (sx, sy) => { const seen = new Set([sx + "," + sy]), q = [[sx, sy]];
                    while (q.length) { const [x, y] = q.shift(); for (const d of [2, 4, 6, 8]) { const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d), k = nx + "," + ny;
                        if (!$gameMap.isValid(nx, ny) || seen.has(k) || !ok(x, y, d)) continue; seen.add(k); q.push([nx, ny]); } }
                    return seen; };
                const need = ${JSON.stringify(p.need)};
                out.starts = ${JSON.stringify(p.starts)}.map(([sx, sy]) => { const seen = fill(sx, sy);
                    const miss = need.filter(([x, y]) => !seen.has(x + "," + y)).map(c => c.join(","));
                    return { from: sx + "," + sy, reachable: seen.size, startSolid: solid(sx, sy), missing: miss }; });
                const all = fill(${p.starts[0][0]}, ${p.starts[0][1]});
                const pockets = [];
                for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                    if (all.has(x + "," + y) || solid(x, y)) continue;
                    if (![2, 4, 6, 8].some(d => $gamePlayer.isMapPassable(x, y, d))) continue;
                    pockets.push(x + "," + y);
                }
                out.pockets = pockets;
                return out; })()`);
            const bad = r.starts.some(s => s.missing.length || s.startSolid) || r.water || (p.noPockets && r.pockets.length);
            if (bad) fails++;
            console.log(`${bad ? "FAIL" : "ok  "} walk Map${String(r.map).padStart(3, "0")} ${r.size} tileset ${r.tileset}, ${r.events} events, water ${r.water}; ` +
                r.starts.map(s => `from ${s.from}: ${s.reachable} tiles` + (s.missing.length ? ` MISSING ${s.missing.join(" ")}` : "") + (s.startSolid ? " START SOLID" : "")).join("; ") +
                `; unreachable standable tiles: ${r.pockets.length ? r.pockets.join(" ") : "none"}`);
        }
        // ---- transfers
        const KEY = { 2: "down", 4: "left", 6: "right", 8: "up" }, STEP = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
        for (const t of spec.transfers) {
            const [fm, x, y, tm, tx, ty, d, kind, walk] = t;
            const [sx, sy] = [x - STEP[walk][0], y - STEP[walk][1]];
            await goto(fm, sx, sy, walk);
            await ev(`(function(){ if ($gameMessage.isBusy()) $gameMessage.clear(); Input.clear(); Input._currentState["${KEY[walk]}"] = true; return 0; })()`);
            let moved = false;
            for (let i = 0; i < 120; i++) { await sleep(60); if (await ev(`$gamePlayer.isTransferring() || $gameMap.mapId()!==${fm}`)) { moved = true; break; } }
            await ev(`(function(){ Input._currentState["${KEY[walk]}"] = false; return 0; })()`);
            for (let i = 0; i < 200; i++) { if (await onMap(tm)) break; await sleep(100); }
            await loadError();
            await frames(5);
            const r = await J(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })`);
            const ok = moved && r.map === tm && r.x === tx && r.y === ty && r.d === d;
            if (!ok) fails++;
            done++;
            console.log(`${ok ? "ok  " : "FAIL"} ${kind} Map${String(fm).padStart(3, "0")}(${x},${y}) walking ${KEY[walk]} -> Map${String(tm).padStart(3, "0")}(${tx},${ty}) facing ${KEY[d]}` + (ok ? "" : `  got ${JSON.stringify(r)} moved=${moved}`));
        }
    } catch (e) { console.log("ERR", e.message); fails++; }
    const errs = b.logs.filter(l => /EXC|rror/.test(l));
    if (errs.length) fails++;
    console.log("page errors:", errs.length ? errs.slice(-8) : "none");
    console.log(fails ? `FAILED ${fails}` : `all ok (${spec.probes.length} walk checks, ${done} transfers)`);
    await b.close();
    process.stdout.write("", () => process.exit(0));     // (a pipe on Windows loses what is not flushed yet)
})();
