// The build (Q) and food (E) menus grow with their entries but, with the name above them, take at most half the screen; the rest
// scrolls. A short list is short.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const key = async code => { await ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`); await frames(3); await ev(`Input._onKeyUp({ keyCode: ${code} }); 0`); await frames(8); };
        const size = () => J(`(function(){ const s = SceneManager._scene, m = s._farmMenu, p = s._farmTitle; return { open: !!$gameTemp._farmMenuOpen, kind: s._farmKind, rows: m.maxItems(), shown: m.maxPageRows(), top: p.y, h: m.height + p.height, half: Graphics.boxHeight / 2, bottom: m.y + m.height }; })()`);
        await frames(300);

        // ---- the build menu: many entries -> half the screen, scrolling
        await key(81);   // Q
        const q = await size();
        check("Q (build): many entries, the menu with its name takes at most half the screen, the rest scrolls", q.open && q.kind === "build" && q.rows > q.shown && q.h <= q.half && q.h > q.half - 60 && q.bottom <= 720, q);
        await b.shot("menu_height_build.png");
        for (let i = 0; i < q.rows - 1; i++) await key(83);   // S (down) to the last entry: it scrolls
        const q2 = await J("({ index: SceneManager._scene._farmMenu.index(), top: SceneManager._scene._farmMenu.topRow() })");
        check("...down (S) reaches the last entries by scrolling", q2.top > 0 && q2.index === q.rows - 1, q2);
        await key(27);

        // ---- the food menu: few entries -> a short menu
        await ev("$gameParty.gainItem($dataItems[95], 1); $gameParty.gainItem($dataItems[98], 1); 0");
        await frames(10);
        await key(69);   // E
        const e = await size();
        check("E (food) with two dishes: a short menu (no empty rows)", e.open && e.kind === "food" && e.rows === e.shown && e.h < q.h, e);
        await b.shot("menu_height_food.png");
        await key(27);

        // ---- the campfire (a station with tabs, the fire's note, its recipes): half the screen too
        const F = await J(`(function(){ const x = $gamePlayer.x, y = $gamePlayer.y - 1; const f = $gameSystem._farm, L = f.buildings[3] = f.buildings[3] || []; L.push({ id: f.nextId++, type: "campfire", x, y, last: 1, v: 3 }); f.rev++; $gamePlayer.setDirection(8); return { x, y }; })()`);
        await frames(20);
        await key(13);   // Enter: the action button on the fire
        await frames(10);
        const c = await size();
        check("the campfire's menu: with its name, the note and the tabs, at most half the screen; the recipes scroll", c.open && c.h <= c.half && c.rows > c.shown, { ...c, fire: F });
        await b.shot("menu_height_fire.png");
        await key(27);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
