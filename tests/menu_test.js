// The docked farm menu: position, popup visibility per entry, pointer, closing, reopening.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(14); $gameParty.gainItem($dataItems[80], 30); $gameParty.gainItem($dataItems[64], 30); $gameParty.gainItem($dataItems[89], 1); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        const state = () => ev(`(function(){ const s = SceneManager._scene, m = s._farmMenu, t = s._farmTip, p = s._farmPointer, tt = s._farmTitle;
            return { open: !!$gameTemp._farmMenuOpen, list: { x: m.x, y: m.y, w: Math.round(m.width), h: m.height, bottom: m.y + m.height, vis: m.visible }, title: { vis: tt.visible, y: tt.y + tt.height }, tip: { vis: t.visible, x: Math.round(t.x), y: Math.round(t.y), h: t.height, bottom: t.y + t.height }, pointer: p.visible, sel: m.currentEntry() && m.currentEntry().name, index: m.index() }; })()`);
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; P["24,16"] = { s: "cleared" }; f.rev++; })()`);
        await ev(`$gamePlayer.locate(24, 17); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(24 - 13, 16 - 6); 0`);
        await frames(20);
        await press("ok"); await frames(20);
        let st = await state();
        console.log(JSON.stringify(st));
        check("the menu is open and docked at the bottom left corner", st.open && st.list.x === 16 && st.list.bottom === 712 - 16, st.list);
        check("the title plate sits right above the list", st.title.vis && Math.abs(st.title.y - st.list.y) <= 2, st.title);
        check("the first entry has a popup with a pointer, to the right of the list", st.tip.vis && st.pointer && st.tip.x > st.list.x + st.list.w, st.tip);
        // go to the last entry ("Zostaw"): no description there, the popup has to go away
        await press("up"); await frames(10);
        st = await state();
        check("on 'Zostaw' (nothing to describe) the popup and its pointer are hidden", st.sel === "Zostaw" && !st.tip.vis && !st.pointer, st);
        await press("down"); await frames(10);
        st = await state();
        check("back on the first entry the popup returns", st.index === 0 && st.tip.vis && st.pointer);
        // the popup follows the row: the third entry (Zbuduj...) opens the long build list; look at how the popup moves
        const bi = await ev("SceneManager._scene._farmMenu._entries.findIndex(e => e.name === 'Zbuduj...')");
        for (let k = 0; k < bi; k++) await press("down");
        await press("ok"); await frames(20);
        st = await state();
        check("the build list is longer than 8 rows and scrolls, still docked at the bottom", st.list.bottom === 712 - 16 && st.title.vis, st.list);
        const ys = [];
        for (let i = 0; i < 6; i++) { await press("down"); await frames(12); ys.push((await state()).tip.y); }
        check("the popup stays on the screen while moving down the list", ys.every(y => y >= 8) && (await state()).tip.bottom <= 712 - 8, ys);
        const tipText = await ev("SceneManager._scene._farmTip._ops.filter(o => o.kind === 'cost').map(o => o.cost.join('|'))");
        check("the popup lists the costs with stock (icon|need|have|name)", tipText.length > 0 && tipText[0].split("|").length === 4, tipText);
        // wrap up: escape closes everything
        await press("cancel"); await frames(8); await press("cancel"); await frames(10);
        st = await state();
        check("closing hides the list, the plate, the popup and the pointer", !st.open && !st.list.vis && !st.title.vis && !st.tip.vis && !st.pointer, st);
        check("the player can move again", await ev("$gamePlayer.canMove()"));
        // open again: everything fresh
        await frames(6);
        await press("ok"); await frames(20);
        st = await state();
        check("reopening works", st.open && st.tip.vis && st.pointer && st.index === 0);
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
