// Before/after screenshots of the ground with a different A2 sheet for tileset 9 (no data files touched).
// usage: CDP_PORT=9353 node shots_s2.js <outdir> <sheet|-> <tag> [map:x:y:name ...]
const path = require("path");
const { launch, sleep } = require("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tests/cdp.js");
const [outdir, sheet, tag, ...spots] = process.argv.slice(2);
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        if (sheet !== "-") await ev(`$dataTilesets[9].tilesetNames[1] = ${JSON.stringify(sheet)}; 0`);
        console.log("A2 =", await ev("$dataTilesets[9].tilesetNames[1]"));
        let first = true;
        for (const s of spots) {
            const [map, x, y, name] = s.split(":");
            if (first) {
                await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, 2, 0); SceneManager.goto(Scene_Map); })()`);
                first = false;
            } else {
                await ev(`$gamePlayer.reserveTransfer(${map}, ${x}, ${y}, 2, 0); 0`);
            }
            for (let i = 0; i < 120; i++) {
                if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId()===${map}`).catch(() => false)) break;
                await sleep(300);
            }
            await sleep(1500);
            await ev(`(function(){ const sc = SceneManager._scene; sc.startFadeIn(1, false); $gameScreen._brightness = 255; if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); if (window.Hunting && Hunting.auto) Hunting.auto(false); if (window.Livestock && Livestock.auto) Livestock.auto(false); if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); $gameScreen.clearTone && $gameScreen.clearTone(); $gamePlayer.setTransparent(false); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); return 0; })()`);
            await sleep(1200);
            // hide the HUD / windows so the ground is visible
            await ev(`(function(){ const sc = SceneManager._scene; if (sc._windowLayer) sc._windowLayer.visible = false; const ss = sc._spriteset; (ss._cloudSprites || []).forEach(c => ss.removeChild(c)); if (ss._weather) ss._weather.visible = false; for (const c of sc.children) { if (c !== sc._spriteset && c !== sc._windowLayer) c.visible = false; } return 0; })()`);
            await sleep(400);
            const file = path.join(outdir, `${name}_${tag}.png`);
            await b.shot(file);
            console.log("shot", file, JSON.stringify(await ev("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gameMap.displayX(), $gameMap.displayY()]")));
        }
        if (b.logs.length) console.log(b.logs.filter(l => /EXC|rror/.test(l)).slice(0, 10).join("\n"));
    } catch (e) { console.log("ERR", e.message); console.log(b.logs.slice(-20).join("\n")); }
    await b.close();
})();
