// Every building x every system (2026-09-26: the dog asked the new well for its rain water and the game stopped - "reading 'leak'"):
// each kind of building is put up (finished, as with F9) by the player on map 3, and everything that goes over all buildings is run
// with it there - its menu (all tabs, every line's text), the water in it (bucketUnits), the dog looking for water and food, the
// birds' and the spoilage's rounds (a day of game time passes), the save data (JsonEx there and back), a few drawn frames, taking
// it down. Any exception, or the game's error screen, is a failure for that kind of building.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 26, 17, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(10); $gameScreen.clearWeather(); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        // a tame dog at work on this map (it looks for water and food among the buildings)
        await ev(`(function(){ const s = Dog.state(); s.tame = true; s.mode = "work"; s.map = 3; s.hp = 50; s.st = 50; s.food = 20; s.water = 20; s.x = 24; s.y = 18; Dog.removeDog(); Dog.sync(); return 0; })()`);
        const types = await J("Object.keys(Farming.BUILDINGS)");
        console.log("building kinds:", types.length);
        const failed = [];
        for (const type of types) {
            // put it up near the player (as F9 does: finished, no materials) - somewhere it fits, else right where he stands
            const r = await J(`(function(){
                const T = ${JSON.stringify(type)}, out = { type: T, errors: [] };
                const err = (where, e) => out.errors.push(where + ": " + String(e && e.message || e).slice(0, 160));
                try {
                    const f = $gameSystem._farm, list = (f.buildings[3] = f.buildings[3] || []), p = $gamePlayer;
                    let at = null;
                    for (let r = 2; r < 16 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r && !at; dx++) if (!Farming.whyNotBuild(T, p.x + dx, p.y + dy, false, true)) at = { x: p.x + dx, y: p.y + dy };
                    out.room = !!at;
                    at = at || { x: p.x, y: p.y - 3 };
                    const def = Farming.BUILDINGS[T];
                    const bld = Object.assign({ id: f.nextId++, type: T, x: at.x, y: at.y, last: 1, v: 3 }, def.rain ? { water: 1, wt: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() } : {});
                    list.push(bld); f.rev++;
                    window.__bld = bld;
                    // its menu: every line and tab
                    try { const m = Farming.menuFor(at.x, at.y); if (m) { for (const e of (m.tabs ? m.tabs.reduce((a, t) => a.concat(t.entries), []) : m.entries || [])) { String(e.name); String(e.help || ""); String(e.right || ""); } out.menu = (m.title || ""); } } catch (e) { err("menu", e); }
                    try { Farming.bucketUnits(bld); } catch (e) { err("bucketUnits", e); }
                    try { if (Dog.dog) { Dog.findWater(Dog.dog); Dog.findTile(Dog.dog, Object.keys(Dog.DOG.eat), null, 0, new Set(), true); } } catch (e) { err("dog", e); }
                    try { JsonEx.parse(JsonEx.stringify($gameSystem._farm)); } catch (e) { err("save data", e); }
                } catch (e) { err("setup", e); }
                return out; })()`);
            // a day of game time passes with it there (the dog, the birds, the spoilage, the weather plan...) and some frames are drawn
            try { await ev("Dog.dog && (Dog.dog._task = null); $gameSystem.advanceDayNight(26); $gameSystem.setDayNightHour(10); 0"); await frames(40); }
            catch (e) { r.errors.push("time/frames: " + e.message); }
            const screen = await ev("(document.getElementById('errorPrinter') || {}).innerText || ''");
            if (screen) r.errors.push("game error screen: " + screen.slice(0, 160));
            // down again
            const down = await J(`(function(){ const errs = []; try { const bl = window.__bld; if (bl.store) bl.store = {}; if (bl.job) bl.job = null; bl.pots = []; Farming.demolish(bl); } catch (e) { errs.push("demolish: " + String(e && e.message).slice(0, 160)); }
                const list = $gameSystem._farm.buildings[3]; const i = list.indexOf(window.__bld); if (i >= 0) list.splice(i, 1); $gameSystem._farm.rev++; return errs; })()`);
            r.errors.push(...down);
            await frames(10);
            if (r.errors.length) { failed.push(r); console.log("  " + type + ": " + r.errors.join(" | ")); if (screen) break; }
        }
        check("every kind of building (" + types.length + "): its menu, water, the dog, a day passing, the save data, drawing, taking it down - no error", failed.length === 0, failed.map(f => f.type + ": " + f.errors[0]));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
