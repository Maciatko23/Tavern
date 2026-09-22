// The F9 developer menu: grant any item in a chosen quantity, or skip the clock by 1 hour / 1 day.
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
        const F9 = 120, LEFT = 37, RIGHT = 39, OK = 13, ESC = 27, DOWN = 40;

        check("F9 is bound to 'debugmenu'", (await ev("Input.keyMapper[120]")) === "debugmenu");

        // ---------------------------------------------------------------- open it
        await key(F9);
        await frames(10);
        check("F9 opens Scene_Debug", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        const rows = await J(`SceneManager._scene._list._rows.slice(0, 6).map(r => ({ kind: r.kind, label: r.label, name: r.item && r.item.name, qty: r.qty }))`);
        check("the list starts with the two time rows, then items", rows[0].kind === "hour" && rows[1].kind === "day" && rows[2].kind === "item" && rows[2].qty === 1, rows);

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
        await key(DOWN);   // row 2: the first real item
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
