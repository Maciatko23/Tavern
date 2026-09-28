// Screenshots of outdoor maps with another A2 sheet in tileset 9, without touching data/*.json:
// the sheet is swapped in memory ($dataTilesets[9].tilesetNames[1]) before each map loads.
//   CDP_PORT=9353 node tools/tiles/shoot_tileset.js <sheet|orig> <outDir> <prefix> [spots.json]
// <sheet> is the image name relative to img/tilesets without .png ("orig" keeps the Winlu sheet).
// Each spot: { name, map, x, y, dx, dy } - the player stands on (x, y), the screen's top-left tile is (dx, dy).
// Shots are 1280x720 at 1:1 (48 px tiles), noon, clear weather, HUD and message windows hidden.
const path = require("path");
const fs = require("fs");
const { launch, sleep } = require(path.join(__dirname, "..", "..", "tests", "cdp.js"));

const DEFAULT_SPOTS = [
    { name: "m3_field", map: 3, x: 13, y: 12, dx: 3, dy: 6 },
    { name: "m3_path", map: 3, x: 26, y: 16, dx: 13, dy: 8 },
    { name: "m3_south", map: 3, x: 12, y: 20, dx: 1, dy: 14 },
    { name: "m4_meadow", map: 4, x: 12, y: 13, dx: 0, dy: 3 },
    { name: "m20_yard", map: 20, x: 15, y: 12, dx: 2, dy: 3 },
];

(async () => {
    const [sheet, outDir, prefix, spotsFile] = process.argv.slice(2);
    if (!sheet || !outDir) { console.log("usage: shoot_tileset.js <sheet|orig> <outDir> <prefix> [spots.json]"); process.exit(1); }
    const spots = spotsFile ? JSON.parse(fs.readFileSync(spotsFile, "utf8")) : DEFAULT_SPOTS;
    fs.mkdirSync(outDir, { recursive: true });
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        if (sheet !== "orig") await ev(`$dataTilesets[9].tilesetNames[1] = ${JSON.stringify(sheet)}; 0`);
        const names = await ev("JSON.stringify($dataTilesets[9].tilesetNames[1])");
        console.log("A2 sheet:", names);
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(${spots[0].map}, ${spots[0].x}, ${spots[0].y}, 2, 0); SceneManager.goto(Scene_Map); })()`);
        const waitMap = async id => { for (let i = 0; i < 120; i++) { if ((await ev("!SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name === 'Scene_Map' && SceneManager._scene._spriteset && $gameMap.mapId() === " + id).catch(() => false))) return true; await sleep(300); } return false; };
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        for (const s of spots) {
            if (!(await ev(`$gameMap.mapId() === ${s.map}`))) {
                await ev(`$gamePlayer.reserveTransfer(${s.map}, ${s.x}, ${s.y}, 2, 0); 0`);
            }
            if (!(await waitMap(s.map))) { console.log("FAIL map", s.map); continue; }
            await sleep(1500);
            await ev(`(function(){ const sc = SceneManager._scene; sc.startFadeIn(1, false); $gameScreen._brightness = 255;
                if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false);
                if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(12); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.changeWeather("none", 0, 0); $gameSystem._minimapHidden = true;
                $gameMessage.clear(); if ($gameMap._interpreter) $gameMap._interpreter.clear();
                $gamePlayer.locate(${s.x}, ${s.y}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${s.dx}, ${s.dy}); return 0; })()`);
            await frames(30);
            await ev(`(function(){ const sc = SceneManager._scene; $gameMap.setDisplayPos(${s.dx}, ${s.dy});
                if (sc._hudLayer) sc._hudLayer.visible = false; if (sc._windowLayer) sc._windowLayer.visible = false; if (sc._xpBar && sc._xpBar.parent) sc._xpBar.parent.removeChild(sc._xpBar);
                const sp = sc._spriteset; (sp._cloudSprites || []).forEach(c => { if (c.parent) c.parent.removeChild(c); }); if (sp._weather) sp._weather.visible = false; return 0; })()`);
            await frames(6);
            const file = path.join(outDir, `${prefix}_${s.name}.png`);
            await b.shot(file);
            const info = JSON.parse(await ev(`JSON.stringify({ map: $gameMap.mapId(), dx: $gameMap.displayX(), dy: $gameMap.displayY(), sheet: $gameMap.tileset().tilesetNames[1] })`));
            console.log("shot", file, JSON.stringify(info));
        }
        const exc = b.logs.filter(l => l.startsWith("EXC")); if (exc.length) console.log("page exceptions:", exc.slice(0, 5));
    } catch (e) { console.log("ERROR", e.message); }
    await b.close();
})();
