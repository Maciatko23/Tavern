// A beaten boar (under 15% of its life) runs away from the hero - but no longer forever: far from him (beyond its sight) it limps
// off to one far spot by the map's edge, round what is in the way (it used to dither left and right against a wall or a building -
// the user saw it by the kiln - and then stood as if frozen); out of sight or at the edge it goes into the forest and counts as
// taken today on the map, so no fresh boar takes its place before dawn.
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
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Survival.calmWeather(); $gameSystem.setDayNightHour(8); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        // open ground: a row with 12 free tiles
        const S = await J(`(function(){
            const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y);
            for (let y = 7; y < $gameMap.height() - 7; y++) for (let x = 6; x < $gameMap.width() - 16; x++) {   // (away from the edges: at the edge it leaves the map)
                let all = true; for (let k = 0; k < 10 && all; k++) if (!ok(x + k, y)) all = false;
                if (all) return { x, y };
            }
            return null; })()`);
        check("found open ground", !!S, S);
        const boar = () => J("(function(){ const a = Hunting.animals.find(a => a.kind() === 'boar'); return a ? { mode: a._mode, x: +a._realX.toFixed(2), y: +a._realY.toFixed(2), d: +a.playerDistance().toFixed(1), hp: a._hp } : null; })()");
        await ev(`(function(){ $gamePlayer.locate(${S.x}, ${S.y}); const bo = Hunting.spawn("boar", ${S.x + 3}, ${S.y}); bo._hp = Math.floor(bo._maxHp * 0.1); bo.setMode("flee"); window.__boar = bo; return 0; })()`);
        await frames(90);
        const b1 = await boar();
        check("badly hurt near the hero it runs away (flee, getting further)", b1 && b1.mode === "flee" && b1.d > 3.5, b1);
        // far away (beyond its sight, still on screen): it limps off - it does not stand as if frozen, nor dither
        await ev(`(function(){ __boar.locate(${S.x + 8}, ${S.y}); return 0; })()`);
        await frames(20);
        const p0 = await boar();
        const pos = [];
        for (let i = 0; i < 12; i++) { await frames(15); const q = await boar(); if (!q) break; pos.push(q); }
        let flips = 0;
        for (let i = 2; i < pos.length; i++) { const a = pos[i - 1].x - pos[i - 2].x, c = pos[i].x - pos[i - 1].x; if (a * c < -0.01) flips++; }
        const last = pos[pos.length - 1];
        const went = last ? Math.hypot(last.x - p0.x, last.y - p0.y) : 99;
        check("far from him (beyond its sight): it walks off (it does not stand as if frozen), no running left and right", p0 && p0.d > 7 && went > 1.5 && flips <= 1, { p0, last, went: +went.toFixed(1), flips, n: pos.length });
        const speed = await ev("__boar._moveSpeed");
        check("...walking, slower than its flight (4.6)", speed === 3, speed);
        // he comes closer: it runs again
        if (!(await boar())) await ev(`(function(){ const bo = Hunting.spawn("boar", ${S.x + 8}, ${S.y}); bo._hp = Math.floor(bo._maxHp * 0.1); bo.setMode("flee"); window.__boar = bo; return 0; })()`);
        const pb = await boar();
        await ev(`(function(){ $gamePlayer.locate(Math.max(1, __boar.x - 4), __boar.y); return 0; })()`);
        await frames(60);
        const b2 = await boar();
        check("he comes closer: it runs (not limps) away from him", b2 && b2.mode === "flee" && b2.d > 4, { pb, b2 });
        // out of sight: gone into the forest, counted for today (no fresh boar before dawn)
        const t0 = await ev("Hunting.killedToday ? Hunting.killedToday(3, 'boar') : ($gameSystem._hunt && $gameSystem._hunt.killed && $gameSystem._hunt.killed[3] ? ($gameSystem._hunt.killed[3].boar || 0) : 0)");
        await ev(`(function(){ __boar.locate(${S.x + 9}, ${S.y}); $gamePlayer.locate(${S.x}, ${S.y}); $gamePlayer.reserveTransfer(3, ${S.x}, ${S.y}, 2, 2); return 0; })()`);
        await ev(`(function(){ const far = [[3, 3], [$gameMap.width() - 4, 3], [3, $gameMap.height() - 4], [$gameMap.width() - 4, $gameMap.height() - 4]].sort((a, b) => Math.hypot(b[0] - __boar.x, b[1] - __boar.y) - Math.hypot(a[0] - __boar.x, a[1] - __boar.y))[0];
            $gamePlayer.locate(far[0], far[1]); $gamePlayer.center(far[0], far[1]); return 0; })()`);
        for (let i = 0; i < 40 && (await ev("Hunting.animals.some(a => a.kind() === 'boar')")); i++) await frames(15);
        const gone = await J("({ left: Hunting.animals.filter(a => a.kind() === 'boar').length, kills: Object.assign({}, ($gameSystem._hunt || {}).kills) })");
        const counted = await J("(function(){ const h = $gameSystem._hunt || {}; const r = h.killed && h.killed[3]; return r ? r.boar || 0 : 0; })()");
        check("out of sight it goes into the forest (removed) and counts for today on the map - not as a kill", gone.left === 0 && counted >= 1 && !(gone.kills && gone.kills.boar), { gone, counted });
        await ev("Hunting.populate && Hunting.populate(); 0");
        await frames(10);
        const again = await ev("Hunting.animals.filter(a => a.kind() === 'boar').length");
        check("...and no fresh boar takes its place before dawn", again === 0, again);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
