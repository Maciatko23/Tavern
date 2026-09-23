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
        const groundNames = await ev("SceneManager._scene._farmMenu._entries.map(e => e.name)");
        check("the ground menu (not grass): Wytwórz..., Wykop ziemię, Zagrab ziemię, Postaw... - no 'Zbuduj...', no 'Zostaw'", groundNames.join() === "Wytwórz...,Wykop ziemię,Zagrab ziemię,Postaw...", groundNames);
        // up from the first entry wraps to the last one ("Postaw..."): it has a description, so the popup stays
        await press("up"); await frames(10);
        st = await state();
        check("up wraps to the last entry, 'Postaw...', with its popup", st.sel === "Postaw..." && st.tip.vis && st.pointer, st);
        // "Postaw..." -> its list ends with "Wróć": nothing to describe there, the popup has to go away
        await press("ok"); await frames(20);
        await press("up"); await frames(10);
        st = await state();
        check("on 'Wróć' (nothing to describe) the popup and its pointer are hidden", st.sel === "Wróć" && !st.tip.vis && !st.pointer, st);
        await press("down"); await frames(10);
        st = await state();
        check("back on the first entry the popup returns", st.index === 0 && st.tip.vis && st.pointer);
        await press("cancel"); await frames(10);
        check("cancel closes the menu (there is no 'Zostaw' line any more)", !(await state()).open);
        // the long list: Q opens the build list (buildings are not on the ground menu any more); look at how the popup moves
        await frames(6);
        await press("pageup"); await frames(20);
        st = await state();
        check("Q opens the build list: longer than 8 rows and scrolls, still docked at the bottom", st.open && st.list.bottom === 712 - 16 && st.title.vis && (await ev("SceneManager._scene._farmMenu._entries.length")) > 8, st.list);
        const ys = [];
        for (let i = 0; i < 6; i++) { await press("down"); await frames(12); ys.push((await state()).tip.y); }
        check("the popup stays on the screen while moving down the list", ys.every(y => y >= 8) && (await state()).tip.bottom <= 712 - 8, ys);
        const tipText = await ev("SceneManager._scene._farmTip._ops.filter(o => o.kind === 'cost').map(o => o.cost.join('|'))");
        check("the popup lists the costs with stock (icon|need|have|name)", tipText.length > 0 && tipText[0].split("|").length === 4, tipText);
        // wrap up: escape closes everything
        await press("cancel"); await frames(10);
        st = await state();
        check("closing hides the list, the plate, the popup and the pointer", !st.open && !st.list.vis && !st.title.vis && !st.tip.vis && !st.pointer, st);
        check("the player can move again", await ev("$gamePlayer.canMove()"));
        // open again: everything fresh
        await frames(6);
        await press("ok"); await frames(20);
        st = await state();
        check("reopening works", st.open && st.tip.vis && st.pointer && st.index === 0);

        // ---------------------------------------------------------------- a station's menu: two tabs, "Akcja" and "Przepis"
        await press("cancel"); await frames(10);
        await ev(`(function(){ const f = $gameSystem._farm; (f.buildings[3] = f.buildings[3] || []).push({ id: f.nextId++, type: "campfire", x: 24, y: 16, last: 1, v: 3 }); f.rev++; })(); 0`);
        await frames(10);
        const tabState = () => ev(`(function(){ const s = SceneManager._scene, m = s._farmMenu, tt = s._farmTitle; return { open: !!$gameTemp._farmMenuOpen, tab: m._tab, tabs: m._tabs && m._tabs.map(t => t.name), names: m._entries.map(e => e.name), enabled: m._entries.map(e => e.enabled !== false), help: m._entries.map(e => e.help || ""), w: m.width, h: m.height, plateH: tt.height, twoLines: s.calcWindowHeight(2, false), index: m.index(), tip: s._farmTip.visible }; })()`);
        const RECIPES = ["Upiecz mięso", "Upiecz rybę", "Upiecz ziemniaki"];
        await press("ok"); await frames(20);
        let ts = await tabState();
        check("the campfire's menu has the tabs 'Akcja' and 'Przepis' and opens on 'Akcja'", ts.open && JSON.stringify(ts.tabs) === '["Akcja","Przepis"]' && ts.tab === 0 && ts.index === 0, ts);
        check("'Akcja': warming up, the tripod, demolishing - no recipes, no 'Zostaw'", ["Ogrzej się przy ogniu", "Dobuduj trójnóg", "Rozbierz"].every(n => ts.names.includes(n)) && !ts.names.includes("Zostaw") && !RECIPES.some(n => ts.names.includes(n)), ts.names);
        // "Dobuduj trójnóg" shows what it needs like a building does: costs with what is in the bag, dimmed with "Brakuje: ..." without them
        const up0 = await ev(`(function(){ const e = SceneManager._scene._farmMenu._entries.find(e => e.name === "Dobuduj trójnóg"); return { enabled: e.enabled !== false, help: e.help, costs: e.costs }; })()`);
        check("'Dobuduj trójnóg' without branches and rope: dimmed, 'Brakuje: ... (0/3)', cost rows icon|need|have|name", up0.enabled === false && /^Brakuje: .*\(0\/3\)/.test(up0.help) && up0.costs.length === 2 && up0.costs.every(c => c.length === 4) && up0.costs[0][1] === 3 && up0.costs[0][2] === 0, up0);
        await press("cancel"); await frames(10);
        await ev("$gameParty.gainItem($dataItems[Farming.BUILDINGS.campfire.upgrade.cost[0][0]], 2); 0");
        await press("ok"); await frames(20);
        const up1 = await ev(`(function(){ const e = SceneManager._scene._farmMenu._entries.find(e => e.name === "Dobuduj trójnóg"); return { enabled: e.enabled !== false, help: e.help, have: e.costs.map(c => c[2]) }; })()`);
        check("with 2 of 3 branches: still dimmed, says 2/3 and the popup counts 2 in the bag", up1.enabled === false && /\(2\/3\)/.test(up1.help) && up1.have[0] === 2, up1);
        await ev("$gameParty.loseItem($dataItems[Farming.BUILDINGS.campfire.upgrade.cost[0][0]], 2); 0");
        ts = await tabState();
        check("the title plate has a second line for the tabs", ts.plateH === ts.twoLines, { plateH: ts.plateH, twoLines: ts.twoLines });
        const size0 = { w: ts.w, h: ts.h };
        await press("right"); await frames(10);
        ts = await tabState();
        check("→ switches to 'Przepis': the recipes, nothing else, first row selected", ts.tab === 1 && ts.index === 0 && RECIPES.every(n => ts.names.includes(n)) && !ts.names.includes("Rozbierz") && !ts.names.includes("Zostaw"), ts.names);
        check("the window keeps its size when switching tabs", ts.w === size0.w && ts.h === size0.h, { size0, now: { w: ts.w, h: ts.h } });
        check("the popup follows the recipe row", ts.tip);
        await press("right"); await frames(10);
        check("→ on the last tab stays there", (await tabState()).tab === 1);
        await press("left"); await frames(10);
        check("← goes back to 'Akcja'", (await tabState()).tab === 0);
        await press("pagedown"); await frames(10);
        check("E (page down) also switches to the next tab", (await tabState()).tab === 1);
        await press("pageup"); await frames(10);
        check("Q (page up) goes back", (await tabState()).tab === 0);
        await press("down"); await frames(6);
        check("up / down still move along the list", (await tabState()).index === 1);
        await press("cancel"); await frames(10);
        check("cancel closes the tabbed menu", !(await tabState()).open);
        // while something roasts: its state is on "Akcja", the recipes stay on "Przepis", greyed out with the reason
        await ev(`(function(){ const b = Farming.buildingAt(24, 16); b.fuel = 10; b.fuelSince = Farming.clockHours(); b.job = { recipe: "roast_meat", start: Farming.clockHours(), hours: 3, out: [Farming.ITEM.roastMeat, 1], sit: false }; })(); 0`);
        await frames(6);
        await press("ok"); await frames(20);
        ts = await tabState();
        check("roasting: 'Akcja' shows 'Coś się piecze...'", ts.tab === 0 && ts.names.includes("Coś się piecze..."), ts.names);
        await press("right"); await frames(10);
        ts = await tabState();
        check("roasting: 'Przepis' still lists the recipes, all greyed out, saying why", ts.tab === 1 && RECIPES.every(n => ts.names.includes(n)) && ts.enabled.every(e => e === false) && ts.help.every(h => /piecze/.test(h)), { names: ts.names, enabled: ts.enabled, help: ts.help[0] });
        await press("cancel"); await frames(10);
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
