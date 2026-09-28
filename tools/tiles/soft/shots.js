// In-game before / after shots of a new A2 sheet, in ONE boot of the game: for every spot the map is
// shown with the Winlu sheet (before), then the sheet is swapped in memory and the same frame is shot
// again (after). Nothing on disk changes: $dataTilesets[9].tilesetNames[1] and (for --remap) the
// loaded map's tile ids are only changed in the page. The game is frozen between the two shots, so
// animals, bushes and puddles stand still and the pair differs only in the ground.
//
//   CDP_PORT=9352 node tools/tiles/soft/shots.js <sheet> <outDir> <spots.json | map:x:y:name ...> [--remap 39:23,...]
//
// <sheet>: the image name in img/tilesets without .png (e.g. Soft_Test_A2). Each spot: the player
// stands on (x, y), the view is centred on him (or { name, map, x, y, dx, dy } in a JSON file).
// --remap 39:23 draws every layer-1 cell of kind 39 with kind 23 (to try a ground no map uses yet).
// Writes <outDir>/<name>_before.png and <name>_after.png (1280x720, 1:1, noon, no weather, no HUD).
// The game server must be running (http://127.0.0.1:8765); one CDP port per agent. A boot that goes
// wrong now and then (a library that fails to load) is retried with a fresh browser, up to 3 times.
const path = require("path");
const fs = require("fs");
const { launch, sleep } = require(path.join(__dirname, "..", "..", "..", "tests", "cdp.js"));

function parseArgs(argv) {
    const out = { spots: [], remap: {} };
    const rest = [];
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--remap") {
            for (const pair of argv[++i].split(",")) { const [a, b] = pair.split(":").map(Number); out.remap[a] = b; }
        } else rest.push(argv[i]);
    }
    [out.sheet, out.outDir, ...out.spotArgs] = rest;
    for (const s of out.spotArgs) {
        if (s.endsWith(".json")) out.spots.push(...JSON.parse(fs.readFileSync(s, "utf8")));
        else { const [map, x, y, name] = s.split(":"); out.spots.push({ map: +map, x: +x, y: +y, name: name || `m${map}_${x}_${y}` }); }
    }
    return out;
}

const HELPERS = orig => `window.__soft = {
    orig: ${JSON.stringify(orig)},
    swap(name) { $dataTilesets[9].tilesetNames[1] = name; SceneManager._scene._spriteset.loadTileset(); return 0; },
    ready() { const t = SceneManager._scene._spriteset._tilemap; return t._bitmaps.every(b => b.isReady()) && !t._needsBitmapsUpdate; },
    remap(map, undo) {
        const d = $dataMap.data, W = $dataMap.width, H = $dataMap.height;
        if (undo) { if (this._saved) { for (const [i, v] of this._saved) d[i] = v; this._saved = null; } }
        else {
            this._saved = [];
            for (let i = W * H; i < 2 * W * H; i++) {
                const t = d[i]; if (t < 2816 || t >= 4352) continue;
                const k = Math.floor((t - 2048) / 48), shape = (t - 2048) % 48;
                if (map[k] !== undefined) { this._saved.push([i, t]); d[i] = 2048 + map[k] * 48 + shape; }
            }
        }
        SceneManager._scene._spriteset._tilemap.refresh();
        return this._saved ? this._saved.length : 0;
    }
}; 0`;

async function session(a, spots) {
    const failed = [];
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 80))), 30000))]);
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(0); } }, 4); })`);
    const bad = () => b.logs.some(l => /Failed to load|^EXC/.test(l));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        let title = false;
        for (let i = 0; i < 120 && !title; i++) {
            title = await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Title' && window.$dataTilesets && $dataTilesets[9])").catch(() => false);
            if (!title) await sleep(500);
        }
        if (!title || bad()) throw new Error("boot failed: " + b.logs.filter(l => /Failed|EXC/.test(l)).slice(0, 2).join(" | "));
        await ev(HELPERS(await ev("$dataTilesets[9].tilesetNames[1]")));
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(${spots[0].map}, ${spots[0].x}, ${spots[0].y}, 2, 0); SceneManager.goto(Scene_Map); return 0; })()`);
        let first = true;
        for (const s of spots) {
            if (!first) await ev(`$gamePlayer.reserveTransfer(${s.map}, ${s.x}, ${s.y}, 2, 0); 0`);
            first = false;
            let ok = false;
            for (let i = 0; i < 100 && !ok; i++) {
                ok = await ev(`SceneManager._scene.constructor.name === 'Scene_Map' && !!SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${s.map}`).catch(() => false);
                if (!ok) await sleep(300);
            }
            if (!ok || bad()) { console.log("FAIL map", s.map, s.name); failed.push(s); continue; }
            await sleep(1200);
            const dx = s.dx !== undefined ? s.dx : s.x - 13, dy = s.dy !== undefined ? s.dy : s.y - 7;
            await ev(`(function(){ const sc = SceneManager._scene; sc.startFadeIn(1, false); $gameScreen._brightness = 255;
                if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); if (window.Hunting && Hunting.auto) Hunting.auto(false); if (window.Livestock && Livestock.auto) Livestock.auto(false);
                if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(12); if (window.Survival && Survival.calmWeather) Survival.calmWeather();
                $gameScreen.changeWeather("none", 0, 0); if ($gameScreen.clearTone) $gameScreen.clearTone(); $gameSystem._minimapHidden = true;
                $gameMessage.clear(); if ($gameMap._interpreter) $gameMap._interpreter.clear();
                $gamePlayer.locate(${s.x}, ${s.y}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${dx}, ${dy}); return 0; })()`);
            await frames(40);
            // freeze the world, hide HUD / windows / weather / clouds
            await ev(`(function(){ const sc = SceneManager._scene; $gameMap.setDisplayPos(${dx}, ${dy});
                sc.__frozen = sc.updateMain; sc.updateMain = function() {};
                sc.__hidden = [];
                // (both flags: the window layer only looks at 'visible', some HUD sprites set 'visible' again every frame)
                for (const c of sc.children) if (c !== sc._spriteset) { sc.__hidden.push([c, c.visible, c.renderable]); c.visible = false; c.renderable = false; }
                const sp = sc._spriteset; (sp._cloudSprites || []).forEach(c => c.visible = false); if (sp._weather) sp._weather.visible = false;
                return 0; })()`);
            await frames(8);
            await b.shot(path.join(a.outDir, `${s.name}_before.png`));
            await ev(`__soft.swap(${JSON.stringify(a.sheet)})`);
            for (let i = 0; i < 100 && !(await ev("__soft.ready()")); i++) await sleep(100);
            let n = 0;
            if (Object.keys(a.remap).length) n = await ev(`__soft.remap(${JSON.stringify(a.remap)}, false)`);
            await frames(8);
            await b.shot(path.join(a.outDir, `${s.name}_after.png`));
            const info = await ev(`JSON.stringify({ map: $gameMap.mapId(), dx: $gameMap.displayX(), dy: $gameMap.displayY(), sheet: $gameMap.tileset().tilesetNames[1] })`);
            console.log("shot", s.name, info, n ? "remapped " + n + " cells" : "");
            // back to the Winlu sheet (and the map's own tiles) for the next spot, unfreeze
            if (Object.keys(a.remap).length) await ev(`__soft.remap(null, true)`);
            await ev(`__soft.swap(__soft.orig)`);
            for (let i = 0; i < 100 && !(await ev("__soft.ready()")); i++) await sleep(100);
            await ev(`(function(){ const sc = SceneManager._scene; sc.updateMain = sc.__frozen; delete sc.__frozen;
                for (const [c, v, r] of sc.__hidden) { c.visible = v; c.renderable = r; } delete sc.__hidden; return 0; })()`);
        }
    } catch (e) {
        console.log("ERROR", e.message);
        for (const s of spots) if (!fs.existsSync(path.join(a.outDir, `${s.name}_after.png`)) && !failed.includes(s)) failed.push(s);
    }
    await b.close();
    return failed;
}

(async () => {
    const a = parseArgs(process.argv.slice(2));
    if (!a.sheet || !a.outDir || !a.spots.length) {
        console.log("usage: node shots.js <sheet> <outDir> <spots.json | map:x:y:name ...> [--remap 39:23]");
        process.exit(1);
    }
    fs.mkdirSync(a.outDir, { recursive: true });
    for (const s of a.spots) for (const k of ["before", "after"]) { const f = path.join(a.outDir, `${s.name}_${k}.png`); if (fs.existsSync(f)) fs.unlinkSync(f); }
    let todo = a.spots;
    for (let attempt = 1; attempt <= 3 && todo.length; attempt++) {
        if (attempt > 1) console.log("retry", todo.map(s => s.name).join(", "));
        todo = await session(a, todo);
    }
    if (todo.length) { console.log("gave up:", todo.map(s => s.name).join(", ")); process.exit(2); }
})();
