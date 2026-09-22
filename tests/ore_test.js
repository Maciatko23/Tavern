// The iron ore rocks: the new pictures (6 sheets, 12 identical cells each), their profiles (ore, hits) and blocking, mined for real.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(2000);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const FORMS = [
            { name: "!$Rock_Ore_Iron", size: [48, 48], ev: 77, ore: [1, 2], solid: [] },
            { name: "!$Rock_Ore_Iron_Chunk", size: [48, 48], ev: 80, ore: [1, 2], solid: [] },
            { name: "!$Rock_Ore_Iron_Spire", size: [48, 96], ev: 81, ore: [2, 3], solid: [[0, -1]] },
            { name: "!$Rock_Ore_Iron_Cluster", size: [144, 48], ev: 82, ore: [2, 3], solid: [[1, 0]] },
            { name: "!$Rock_Ore_Iron_Twin", size: [144, 96], ev: 79, ore: [3, 4], solid: [[1, 0]] },
            { name: "!$Rock_Ore_Iron_Jagged", size: [144, 96], ev: 78, ore: [3, 5], solid: [[1, 0]] }
        ];
        // ---------------------------------------------------------------- the pictures
        for (const f of FORMS) {
            const info = await ev(`new Promise(res => { const bmp = ImageManager.loadCharacter(${JSON.stringify(f.name)}); bmp.addLoadListener(() => { const w = bmp.width / 3, h = bmp.height / 4; const cells = []; for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 3; cx++) { const d = bmp.context.getImageData(cx * w, cy * h, w, h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3]) % 1000003; cells.push(s); } let orange = 0; const c0 = bmp.context.getImageData(0, 0, w, h).data; for (let i = 0; i < c0.length; i += 4) if (c0[i + 3] > 200 && c0[i] > 120 && c0[i] > c0[i + 2] * 1.6 && c0[i] > c0[i + 1] * 1.2) orange++; res({ w, h, same: new Set(cells).size === 1, orange }); }); })`);
            check(f.name + ": a 3 x 4 sheet of 12 identical cells " + f.size.join("x") + ", with rusty ore in it", info.w === f.size[0] && info.h === f.size[1] && info.same && info.orange > 10, info);
        }
        // ---------------------------------------------------------------- the table of the plugin: profiles (ore, not stone) and blocking
        const fs = require("fs");
        const src = fs.readFileSync("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/js/plugins/ChoppableTree.js", "utf8");
        const entry = (table, name) => {   // the text of `"name": { ... }` inside the given table
            const t = src.indexOf(table), k = src.indexOf('"' + name + '": {', t);
            return k < 0 ? null : src.slice(k, src.indexOf("}", k) + 1);
        };
        for (const f of FORMS) {
            const prof = entry("const ROCK_PROFILES", f.name);
            const m = prof && /dropmin: (\d+), dropmax: (\d+)/.exec(prof);
            check(f.name + ": profile in ChoppableTree - iron ore (item 85), " + f.ore[0] + "-" + f.ore[1] + " pieces", !!prof && /drop: 85/.test(prof) && /Wydobyto rudę żelaza!/.test(prof) && !!m && +m[1] === f.ore[0] && +m[2] === f.ore[1], prof);
            const solid = entry("const SOLID_GRAPHICS", f.name);
            const want = f.solid.length ? (f.solid[0][1] ? "up: 1" : "right: 1") : null;
            check(f.name + ": blocking " + (want ? "like the plain rock of that shape (" + want + ")" : "just its own tile (no entry)"), want ? !!solid && solid.includes(want) : !solid, solid);
        }
        const minimap = fs.readFileSync("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/js/plugins/Minimap.js", "utf8");
        check("the minimap marks every Ore_Iron picture as ore (the pattern matches the new names)", /\/Ore_Iron\/\.test\(graphic\)/.test(minimap) && FORMS.every(f => /Ore_Iron/.test(f.name)));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
