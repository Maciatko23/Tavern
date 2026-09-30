// node tools/town/shot_town.js <A|B|C> <out dir> [hour=11]   (CDP_PORT, default 9412; the game served at 127.0.0.1:8765)
// Daytime game screens of a staged town concept in the real game: the concept's overlay (python tools/town/make_overlay.py:
// data/Map008.json + data/Tilesets.json + the missing character sheets) is served in place of the game's files through the
// harness's GAME_OVERLAY (tests/cdp.js) - data/ and img/ are never written. For every spot in the concept's
// staging/Map008_<X>_meta.json "shots" (or the tavern door, the square, the south gate) the hero is put there and the screen
// (1280x720, the map's own zoom, HUD and minimap hidden) is saved as <out dir>/koncepcja_<X>_gra_<n>.png. Also checks the
// game's own view of the map: its size, the tavern door (event 7) and that the hero can stand on each spot.
const path = require("path");
const fs = require("fs");
const kit = require(path.join(__dirname, "..", "..", "tests", "lib", "kit.js"));
const concept = process.argv[2] || "A";
const outDir = path.resolve(process.argv[3] || path.join(__dirname, "..", "..", "docs", "miasteczko"));
const hour = Number(process.argv[4] || 11);
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "staging", `Map008_${concept}_meta.json`), "utf8"));
const spots = meta.shots || [];
process.env.CDP_PORT = process.env.CDP_PORT || "9412";

kit.test({ port: 9412, overlay: `tools/town/staging/overlay_${concept}`, bootCheck: "the game boots" }, async t => {
    const [dx, dy] = meta.door;
    const ok = await t.newGame({ map: 8, x: dx, y: dy + 2, dir: 8, hour, quiet: true, minimap: false });
    t.check(`the staged Map008 (${concept}) comes up`, ok);
    const info = await t.json("({ w: $dataMap.width, h: $dataMap.height, door: (function(){ const e = $gameMap.event(7); return e ? [e.x, e.y, e.event().name] : null; })() })");
    t.check(`its size is ${meta.width}x${meta.height} and event 7 is the tavern door at ${dx},${dy}`, info.w === meta.width && info.h === meta.height && info.door && info.door[0] === dx && info.door[1] === dy, info);
    fs.mkdirSync(outDir, { recursive: true });
    let n = 0;
    for (const s of spots) {
        n++;
        await t.eval(`(function(){ $gamePlayer.locate(${s[0]}, ${s[1]}); $gamePlayer.setDirection(${s[2] || 2}); $gameSystem.setDayNightHour(${hour});
            if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.changeWeather("none", 0, 0);
            const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; return 0; })()`);
        await t.frames(40);
        const stand = await t.eval(`$gameMap.isPassable(${s[0]}, ${s[1]}, 2) || $gameMap.isPassable(${s[0]}, ${s[1]}, 8) || $gameMap.isPassable(${s[0]}, ${s[1]}, 4) || $gameMap.isPassable(${s[0]}, ${s[1]}, 6)`);
        t.check(`spot ${n} (${s[0]},${s[1]}) ${s[3] || ""}: the hero can stand there`, stand);
        const f = await t.shot(path.join(outDir, `koncepcja_${concept}_gra_${n}.png`));
        console.log("saved", f);
    }
});
