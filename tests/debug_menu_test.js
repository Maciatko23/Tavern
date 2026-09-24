// The F9 developer menu in three tabs (Q / E switch them): Zdarzenia (clock, weather, birds, boar), Budowanie (any building
// put down free and finished), Przedmioty (any item in a chosen quantity); it opens again on the tab and row it was left on.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); $gameSystem._dayNightDay = 1; 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const key = async (code, hold = 3) => {
            await ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
            await frames(hold);
            await ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
            await frames(4);
        };
        const F9 = 120, LEFT = 37, RIGHT = 39, OK = 13, ESC = 27, DOWN = 40, UP = 38, Q = 81, E = 69;
        const tabNow = () => J("({ tab: SceneManager._scene._tab, sel: SceneManager._scene._tabs.index(), kinds: [...new Set(SceneManager._scene._list._rows.map(r => r.kind))], n: SceneManager._scene._list._rows.length, index: SceneManager._scene._list.index(), help: SceneManager._scene._help.contents ? 1 : 0 })");

        check("F9 is bound to 'debugmenu'", (await ev("Input.keyMapper[120]")) === "debugmenu");

        // ---------------------------------------------------------------- open it
        await key(F9);
        await frames(10);
        check("F9 opens Scene_Debug", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        check("three tabs: Zdarzenia, Budowanie, Przedmioty", JSON.stringify(await J("SceneManager._scene._tabs._list.map(c => c.name)")) === '["Zdarzenia","Budowanie","Przedmioty"]');
        const rows = await J(`SceneManager._scene._list._rows.map(r => ({ kind: r.kind, label: r.label }))`);
        let t = await tabNow();
        check("it opens on 'Zdarzenia': the two time rows, the four weather rows (storm, a strike, a strike on a tree, calm), the two bird rows, the boar, a wolf pack, a deer, +200 XP - nothing else", t.tab === 0 && t.sel === 0 && rows.map(r => r.kind).join() === "hour,day,storm,strike,treestrike,calm,birds,raid,boar,wolves,deer,xp" && rows[0].label === "+1 godzina", rows.map(r => r.kind));
        await key(E); await frames(6);
        t = await tabNow();
        const builds = await J(`SceneManager._scene._list._rows.map(r => ({ kind: r.kind, type: r.type, label: r.label, icon: r.icon }))`);
        const nTypes = await ev("Object.keys(Farming.BUILDINGS).length");
        check("E: 'Budowanie' - one 'Postaw: ...' row for every building of Farming.js, each with an icon, and only those", t.tab === 1 && t.sel === 1 && builds.length === nTypes && builds.every(r => r.kind === "build" && /^Postaw: /.test(r.label) && r.icon > 0) && builds.some(r => r.label === "Postaw: Cegielnia"), { tab: t.tab, n: builds.length, nTypes, first: builds[0] });
        await key(E); await frames(6);
        t = await tabNow();
        check("E: 'Przedmioty' - every item, only items", t.tab === 2 && t.sel === 2 && t.kinds.join() === "item" && t.n === (await ev("$dataItems.filter(i => i && i.name).length")), t);
        await key(E); await frames(6);
        check("E on the last tab wraps round to 'Zdarzenia'", (await tabNow()).tab === 0);
        await key(Q); await frames(6);
        check("Q goes back (wrapping to 'Przedmioty')", (await tabNow()).tab === 2);
        await key(Q); await key(Q); await frames(6);
        check("Q, Q: back on 'Zdarzenia'", (await tabNow()).tab === 0);

        // ---------------------------------------------------------------- +1 hour / +1 day (set to noon, day 1: no hour rollover to worry about)
        await ev("$gameSystem.setDayNightHour(12); $gameSystem._dayNightDay = 1; 0");
        const before = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        await key(OK);   // row 0 is already selected: "+1 godzina"
        await frames(6);
        const afterHour = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        check("'+1 godzina' advances the clock by about one hour", afterHour.d === before.d && afterHour.h - before.h > 0.9 && afterHour.h - before.h < 1.1, { before, afterHour });
        check("the menu stays open after granting (so you can do several in a row)", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        await key(DOWN);
        await key(OK);   // row 1: "+1 dzień"
        await frames(6);
        const afterDay = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        check("'+1 dzień' advances the clock by 24 hours (a whole day later)", afterDay.d === afterHour.d + 1 && Math.abs(afterDay.h - afterHour.h) < 0.1, { afterHour, afterDay });

        // ---------------------------------------------------------------- pick an item, raise the quantity, grant it
        await key(Q); await frames(6);   // 'Przedmioty', on its first item
        const firstItemId = await ev("SceneManager._scene._list.rowData().item.id");
        const before139 = await ev(`$gameParty.numItems($dataItems[${firstItemId}])`);
        for (let i = 0; i < 4; i++) await key(RIGHT);
        const qty = await ev("SceneManager._scene._list.rowData().qty");
        check("→ four times raised the quantity to 5", qty === 5, qty);
        await key(LEFT);
        const qty2 = await ev("SceneManager._scene._list.rowData().qty");
        check("← lowers it back by one", qty2 === 4, qty2);
        await key(OK);
        await frames(6);
        const after139 = await ev(`$gameParty.numItems($dataItems[${firstItemId}])`);
        check("OK grants exactly that many of the highlighted item", after139 === before139 + 4, { before139, after139 });

        // ---------------------------------------------------------------- "Burza teraz": back to the map, the storm gathering
        await key(E); await frames(6);   // back to 'Zdarzenia': its cursor is where it was left (row 1, '+1 dzień')
        check("each tab remembers its row: 'Zdarzenia' is back on '+1 dzień'", (await tabNow()).tab === 0 && (await ev("SceneManager._scene._list.rowData().kind")) === "day");
        await key(DOWN);   // row 2
        check("row 2 is 'Burza teraz'", (await ev("SceneManager._scene._list.rowData().kind")) === "storm");
        await key(OK);
        await frames(20);
        check("'Burza teraz' goes back to the map and a storm gathers", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await ev("Storm.level()")) > 0 && (await ev("Storm.phase()")) === "gather");
        await key(F9); await frames(10);
        check("F9 opens again on the tab and row it was left on ('Zdarzenia', 'Burza teraz')", (await tabNow()).tab === 0 && (await ev("SceneManager._scene._list.rowData().kind")) === "storm");
        for (let i = 0; i < 3; i++) await key(DOWN);   // row 5: calm
        await key(OK);
        await frames(20);
        check("'Koniec pogody na dziś' ends it", (await ev("Storm.level()")) === 0);
        // ---------------------------------------------------------------- "Postaw: Cegielnia": the placer, free, the building finished at once
        await key(F9); await frames(10);
        const bagBefore = await J("({ stone: $gameParty.numItems($dataItems[Farming.ITEM.stone]), planks: $gameParty.numItems($dataItems[Farming.ITEM.planks]), stamina: Math.round($gameSystem.stamina()) })");
        await key(E); await frames(6);   // 'Budowanie'
        await ev("(function(){ const l = SceneManager._scene._list; l.select(l._rows.findIndex(r => r.type === 'brickworks')); })(); 0");
        await key(OK);
        for (let i = 0; i < 40 && !(await ev("!!$gameTemp._buildMode")); i++) await frames(5);
        const mode = await J("($gameTemp._buildMode ? { type: $gameTemp._buildMode.type, free: $gameTemp._buildMode.free, text: SceneManager._scene._farmHelp._text || '' } : null)");
        check("'Postaw: Cegielnia' goes back to the map in the placer, free (help: 'F9: za darmo')", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && mode && mode.type === "brickworks" && mode.free === true && /za darmo/.test(mode.text), mode);
        // a spot near the player where it can stand (uncleared grass is fine for the F9 placer)
        const spot = await J(`(function(){ const p = $gamePlayer; for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = p.x + dx, y = p.y + dy; if (!Farming.plotAt(x, y) && Farming.whyNotBuild("brickworks", x, y, false, true) === null && Farming.whyNotBuild("brickworks", x, y, false) !== null) return { x, y }; } return null; })()`);
        check("found a spot of uncleared ground where only the F9 placer may build", !!spot, spot);
        await ev(`(function(){ const m = $gameTemp._buildMode; m.x = ${spot.x}; m.y = ${spot.y}; })(); 0`);
        await frames(4);
        await key(OK);
        await frames(20);
        const put = await J(`(function(){ const b = Farming.buildingAt(${spot.x}, ${spot.y}); return b ? { type: b.type, site: !!b.site, v: b.v } : null; })()`);
        const bagAfter = await J("({ stone: $gameParty.numItems($dataItems[Farming.ITEM.stone]), planks: $gameParty.numItems($dataItems[Farming.ITEM.planks]), stamina: Math.round($gameSystem.stamina()) })");
        check("OK puts the brickworks down finished (no site), the placer closes", put && put.type === "brickworks" && !put.site && put.v === 3 && !(await ev("!!$gameTemp._buildMode")), put);
        check("...without taking materials or strength", JSON.stringify(bagBefore) === JSON.stringify(bagAfter), { bagBefore, bagAfter });
        check("...and its menu works at once (the brick recipe)", (await J(`Farming.menuFor(${spot.x}, ${spot.y}).entries.map(e => e.name)`)).includes("Wypal cegły"));
        // the F9 placer still refuses water, a tree, another building
        check("not on top of another building", /stoi/.test(await ev(`Farming.whyNotBuild("brickworks", ${spot.x}, ${spot.y}, false, true)`) || ""));
        // a yard put down free: finished, the animals come
        const yardSpot = await J(`(function(){ for (let y = 8; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 8; x++) if (Farming.whyNotBuild("coop", x, y, false, true) === null) return { x, y }; return null; })()`);
        await ev(`$gamePlayer.locate(${yardSpot.x} + 2, ${yardSpot.y} + 1); Farming.placeFree("coop", ${yardSpot.x}, ${yardSpot.y}, false); 0`);
        await frames(60);
        const hens = await ev("Livestock.animals.filter(a => a._kind === 'hen').length");
        check("a coop put down free stands finished and gets its hens", (await ev(`!Farming.buildingAt(${yardSpot.x}, ${yardSpot.y}).site`)) && hens > 0, { yardSpot, hens, all: await ev("Livestock.animals.length") });
        await key(F9); await frames(10);   // open again for the closing checks
        check("after putting a building down, F9 opens on 'Budowanie' with the same building chosen (to put another)", (await tabNow()).tab === 1 && (await ev("SceneManager._scene._list.rowData().type")) === "brickworks");

        // ---------------------------------------------------------------- closing
        await key(ESC);
        await frames(10);
        check("Esc closes the menu, back on the map", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
        await key(F9);
        await frames(10);
        check("F9 opens it again", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        await key(F9);
        await frames(10);
        check("F9 a second time closes it too", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
