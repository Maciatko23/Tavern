// Draws a test pattern of tile ids with the GAME's own tilemap (MZ's _addAutotile + FLOOR_AUTOTILE_TABLE) and saves a
// 1:1 screenshot of it, so a Python render of the same pattern can be compared pixel by pixel.  Nothing is saved to disk
// except the screenshot: the tile ids are written into the loaded map in memory only.
//   CDP_PORT=9353 node tools/tiles/autotile_ingame_check.js <pattern.json> <out.png>
// pattern.json: { "sheet": "<A2 name relative to img/tilesets, or null>", "map": 3, "x0": 2, "y0": 2,
//                 "layers": { "0": [[tileId, ...], ...], "1": [[...]] } }   (rows of equal length; layers 1-3 not given = 0)
const path = require("path");
const fs = require("fs");
const { launch, sleep } = require(path.join(__dirname, "..", "..", "tests", "cdp.js"));

(async () => {
    const [patFile, out] = process.argv.slice(2);
    const pat = JSON.parse(fs.readFileSync(patFile, "utf8"));
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout")), 25000))]);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        if (pat.sheet) await ev(`$dataTilesets[9].tilesetNames[1] = ${JSON.stringify(pat.sheet)}; 0`);
        await ev(`(function(){ DataManager.setupNewGame(); $gameMap.disableNameDisplay(); $gamePlayer.reserveTransfer(${pat.map}, ${pat.x0}, ${pat.y0}, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev(`!SceneManager.isSceneChanging() && SceneManager._scene.constructor.name === 'Scene_Map' && !!SceneManager._scene._spriteset && $gameMap.mapId() === ${pat.map}`).catch(() => false)) break; await sleep(300); }
        await sleep(2000);
        const res = await ev(`(function(){
            const pat = ${JSON.stringify(pat)};
            const sc = SceneManager._scene, sp = sc._spriteset, tm = sp._tilemap;
            sc.startFadeIn(1, false); $gameScreen._brightness = 255; $gameScreen._tone = [0, 0, 0, 0];
            if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(12);
            if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.changeWeather("none", 0, 0);
            const W = $dataMap.width, H = $dataMap.height, d = $dataMap.data;
            const rows = pat.layers["0"].length, cols = pat.layers["0"][0].length;
            for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) for (let z = 0; z < 4; z++) {
                const L = pat.layers[String(z)];
                d[(z * H + pat.y0 + y) * W + pat.x0 + x] = L ? L[y][x] : 0;
                d[(4 * H + pat.y0 + y) * W + pat.x0 + x] = 0;      // no shadows
            }
            $gamePlayer.locate(pat.x0 + cols + 3, pat.y0 + rows + 3);
            $gameMap.setDisplayPos(pat.x0, pat.y0);
            tm.refresh();
            return { W, H, rows, cols, tileset: $gameMap.tileset().tilesetNames[1] };
        })()`);
        // hide everything that is not the tile layers (characters, overlays, clouds, weather, HUD)
        for (let i = 0; i < 20; i++) {
            await ev(`(function(){ const sc = SceneManager._scene, sp = sc._spriteset, tm = sp._tilemap;
                $gameMap.setDisplayPos(${pat.x0}, ${pat.y0});
                // renderable, not visible: the sprites' own update() sets visible every frame
                tm.children.forEach(c => { if (!(c instanceof Tilemap.CombinedLayer)) c.renderable = false; });
                const fx = /Cloud|Weather|Storm|SunRays|NightLight|Smoulder|Timer/;
                sp.children.forEach(c => { if (fx.test(c.constructor.name)) c.renderable = false; });
                sc.children.forEach(c => { if (c !== sp) c.renderable = false; });
                return 0; })()`);
            await sleep(50);
        }
        await sleep(300);
        await b.shot(out);
        console.log("drawn", JSON.stringify(res), "->", out);
    } catch (e) { console.log("ERROR", e.message); }
    await b.close();
})();
