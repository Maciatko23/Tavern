// A rabbit hops over what lies low in its way - a log, a bush, a stump, a berry bush (Hunting.js: hopOver, ChoppableTree.isLow);
// a deer does not, and a standing tree still stops a rabbit (the user's, 2026-09-25).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);

        // fell one pine (a stump is left), then look for one thing of each kind with a free tile before and behind it
        await ev(`(function(){ const t = $gameMap.events().find(e => ChoppableTree.isTree(e) && e.event().pages[0].image.characterName === "!$Pine_C" && !$gameSelfSwitches.value([3, e.eventId(), "A"]));
            if (t) { $gameSelfSwitches.setValue([3, t.eventId(), "A"], true); window.__stump = t.eventId(); } })(); 0`);
        await frames(10);
        const spots = await J(`(function(){
            const DIRS = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
            const clear = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.isPassable(x, y, 2) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y) && !($gamePlayer.x === x && $gamePlayer.y === y);
            const around = (ox, oy) => { for (const [d, dx, dy] of DIRS) { const f = { x: ox - dx, y: oy - dy }, l = { x: ox + dx, y: oy + dy }; if (clear(f.x, f.y) && clear(l.x, l.y) && $gameMap.isPassable(f.x, f.y, d)) return { d, from: f, land: l }; } return null; };
            const out = {};
            const blocking = (x, y) => $gameMap.eventsXy(x, y).filter(e => e.isNormalPriority() && !e.isThrough());
            for (const e of $gameMap.events()) {
                const kind = e.eventId() === window.__stump ? "stump" : /<Log/i.test(e.event().note) ? "log" : (/Bush/.test(e.characterName()) || /Bush/.test(e.event().pages[0].image.characterName)) ? "bush" : null;
                if (!kind || out[kind]) continue;
                const bl = blocking(e.x, e.y);
                if (!bl.length || !bl.every(o => ChoppableTree.isLow(o))) continue;
                const a = around(e.x, e.y); if (a) out[kind] = Object.assign({ ox: e.x, oy: e.y, id: e.eventId() }, a);
            }
            for (let y = 2; y < $gameMap.height() - 2 && !out.berry; y++) for (let x = 2; x < $gameMap.width() - 2 && !out.berry; x++) {
                if (!Farming.bushSolid(x, y, 3)) continue;
                const a = around(x, y); if (a) out.berry = Object.assign({ ox: x, oy: y }, a);
            }
            const tree = $gameMap.events().find(e => ChoppableTree.isTree(e) && !$gameSelfSwitches.value([3, e.eventId(), "A"]) && around(e.x, e.y));
            if (tree) out.tree = Object.assign({ ox: tree.x, oy: tree.y, id: tree.eventId() }, around(tree.x, tree.y));
            return out; })()`);
        check("found a log, a bush, a stump, a berry bush and a standing tree with room before and behind", ["log", "bush", "stump", "berry", "tree"].every(k => spots[k]), Object.keys(spots));

        const tryStep = async (kind, spot) => {
            await ev(`(function(){ Hunting.animals.slice().forEach(a => Hunting.removeAnimal(a)); const a = Hunting.spawn("${kind}", ${spot.from.x}, ${spot.from.y}); a._frozen = true; a.setDirection(${spot.d}); window.__a = a; })(); 0`);
            await frames(4);
            await ev(`__a.moveStraight(${spot.d}); 0`);
            const mid = await J("({ jumping: __a.isJumping(), x: __a._x, y: __a._y })");
            await frames(50);
            const end = await J("({ x: __a._x, y: __a._y, rx: __a._realX, ry: __a._realY, jumping: __a.isJumping() })");
            await ev("Hunting.removeAnimal(__a); 0");
            return { mid, end };
        };
        for (const k of ["log", "bush", "stump", "berry"]) {
            const s = spots[k];
            if (!s) continue;
            const r = await tryStep("rabbit", s);
            check("a rabbit before a " + k + ": it hops over it and lands on the tile behind it", r.mid.jumping && r.end.x === s.land.x && r.end.y === s.land.y && r.end.rx === s.land.x && r.end.ry === s.land.y && !r.end.jumping, { spot: s, r });
        }
        if (spots.log) {
            const r = await tryStep("deer", spots.log);
            check("a deer before the log: it does not hop (it stays)", !r.mid.jumping && r.end.x === spots.log.from.x && r.end.y === spots.log.from.y, r);
        }
        if (spots.tree) {
            const r = await tryStep("rabbit", spots.tree);
            check("a rabbit before a standing tree: no hop, it stays", !r.mid.jumping && r.end.x === spots.tree.from.x && r.end.y === spots.tree.from.y, r);
        }
        // a rabbit that runs away uses the hops too (a hop counts as a way out)
        if (spots.log) {
            const s = spots.log;
            const can = await ev(`(function(){ const a = Hunting.spawn("rabbit", ${s.from.x}, ${s.from.y}); a._frozen = true; const ok = !!a.hopOver(${s.from.x}, ${s.from.y}, ${s.d}); Hunting.removeAnimal(a); return ok; })()`);
            check("...a hop counts as a way to go when it picks where to run", can === true);
        }
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
