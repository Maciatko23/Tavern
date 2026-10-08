// The game menu (P) and its tabs in one panel in the middle of the screen (MenuPanel.js): walked through with the keys -
// the card, the bag (use at once, reasons, tabs), the journal, saving, the end-of-game question, back to the map.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const press = async (k, wait = 12) => { await ev(`Input._currentState["${k}"] = true; 0`); await frames(3); await ev(`Input._currentState["${k}"] = false; 0`); await frames(wait); };
    const scene = () => ev("SceneManager._scene.constructor.name");
    const settle = async name => { for (let i = 0; i < 60; i++) { if ((await scene()) === name && !(await ev("SceneManager.isSceneChanging()"))) return true; await frames(5); } return false; };
    // every window of the scene that shows something lies inside its panel; the panel leaves the map in view around it
    const layout = () => J(`(function(){ const s = SceneManager._scene, p = s._menuPanel; if (!p) return null; const r = p._spec.rect;
        const wins = s._windowLayer.children.filter(w => w.visible && w.isOpen && w.isOpen() && w.contents);
        const out = wins.filter(w => w.x < r.x - 1 || w.y < r.y - 6 || w.x + w.width > r.x + r.width + 1 || w.y + w.height > r.y + r.height + 10).map(w => w.constructor.name);
        return { rect: [r.x, r.y, r.width, r.height], outside: out, framed: wins.filter(w => w.opacity > 0).map(w => w.constructor.name), title: p._spec.title }; })()`);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && window.Utils)").catch(() => false)) break; await sleep(500); }
        await ev("ConfigManager.uiClean = false; 0");   // (the classic look: this test checks the old panels' places - CleanHUD.js's clean look is tests/clean_hud_test.js)
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`SceneManager._scene.startFadeIn(1,false); if (window.Birds) Birds.auto(false); Hunting.auto(false); Survival.calmWeather(); $gameSystem.setDayNightHour(11);
            $gameParty.gainItem($dataItems[102], 3); $gameParty.gainItem($dataItems[61], 3); $gameParty.gainItem($dataItems[60], 1); $gameSystem.setStamina(50); 0`);
        await frames(20);

        // ---------------------------------------------------------------- P: the character and the commands
        await press("escape", 30);
        check("P opens the menu", await settle("Scene_Menu"));
        await frames(20);
        const m = await layout();
        check("one panel in the middle, smaller than the screen, every window inside it and without a frame of its own", !!m && m.rect[2] < 1280 - 200 && m.rect[3] < 720 - 120 && m.outside.length === 0 && m.framed.length === 0, m);
        const cmds = await J("SceneManager._scene._commandWindow._list.map(c => c.symbol)");
        check("the commands in one column, from the top: Postać, Plecak, Dziennik, then options, saving, the end", cmds.slice(0, 3).join() === "hero,item,journal" && ["options", "save", "gameEnd"].every(c => cmds.includes(c)), cmds);
        const head = await J("(function(){ const w = SceneManager._scene._statusWindow, t = []; const d = w.drawText; w.drawText = function(s) { t.push(String(s)); return d.apply(this, arguments); }; w.refresh(); w.drawText = d; return t.slice(0, 3); })()");
        check("the card's head: the hero's name and 'Poziom N' (not the map's name)", head[0] === (await ev("$gameParty.leader().name()")) && head[1] === "Poziom " + (await ev("Combat.hero().level")), head);
        check("the coins window is gone (the coins are on the card), the title is the hero's name", !(await ev("SceneManager._scene._goldWindow.visible")) && m.title === (await ev("$gameParty.leader().name()")), m.title);
        await b.shot(OUT + "menu_panel_card.png");

        // ---------------------------------------------------------------- the bag
        await ev("SceneManager._scene._commandWindow.selectSymbol('item'); 0");
        await press("ok", 30);
        check("Enter on 'Plecak' opens the bag", await settle("Scene_Item"));
        await frames(20);
        const bag = await layout();
        check("the bag in the same kind of panel ('Plecak'), everything inside it", !!bag && bag.title === "Plecak" && bag.outside.length === 0, bag);
        const st0 = await J(`(function(){ const s = SceneManager._scene; return { listActive: s._itemWindow.active, catActive: s._categoryWindow.active, cat: s._categoryWindow.currentSymbol(), item: s._helpWindow._item && s._helpWindow._item.name, cols: s._itemWindow.maxCols() }; })()`);
        check("straight into the list (one column), the first thing described on the right", st0.listActive && !st0.catActive && st0.cat === "item" && !!st0.item && st0.cols === 1, st0);
        const pick = name => ev(`(function(){ const w = SceneManager._scene._itemWindow, i = w._data.findIndex(it => it && it.name === "${name}"); w.select(i); return i; })()`);
        const berries0 = await ev("$gameParty.numItems($dataItems[102])");
        await pick("Jagody");
        await press("ok", 30);
        const ate = await J(`(function(){ const s = SceneManager._scene; return { n: $gameParty.numItems($dataItems[102]), note: s._helpWindow._note, actor: s._actorWindow.visible && s._actorWindow.active, list: s._itemWindow.active }; })()`);
        check("Enter on the berries eats them at once (no choosing the hero), what it did shows under the description", ate.n === berries0 - 1 && /Zjadłeś/.test(ate.note) && !ate.actor && ate.list, ate);
        await b.shot(OUT + "menu_panel_bag.png");
        await pick("Drewno");
        await press("ok", 20);
        const wood = await J(`({ n: $gameParty.numItems($dataItems[61]), note: SceneManager._scene._helpWindow._note })`);
        check("Enter on wood: nothing used, it says it is a material", wood.n === 3 && /materiał/.test(wood.note), wood);
        await press("right", 12);
        const tools = await J(`(function(){ const s = SceneManager._scene; return { cat: s._categoryWindow.currentSymbol(), items: s._itemWindow._data.map(i => i && i.name), item: s._helpWindow._item && s._helpWindow._item.name }; })()`);
        check("→ switches to 'Narzędzia': the axe, described", tools.cat === "keyItem" && tools.items.length >= 1 && !!tools.item, tools);
        await press("left", 12);
        check("← back to 'Przedmioty'", (await ev("SceneManager._scene._categoryWindow.currentSymbol()")) === "item");
        await press("escape", 30);
        check("Esc closes the bag, back on the card", await settle("Scene_Menu"));

        // ---------------------------------------------------------------- the journal
        await ev("SceneManager._scene._commandWindow.selectSymbol('journal'); 0");
        await press("ok", 30);
        check("'Dziennik' opens the journal", await settle("Scene_Journal"));
        await frames(20);
        const jr = await layout();
        check("the journal in the panel: tabs, list, detail and legend inside it", !!jr && jr.title === "Dziennik" && jr.outside.length === 0 && jr.framed.length === 0, jr);
        await b.shot(OUT + "menu_panel_journal.png");
        await press("escape", 30);
        await settle("Scene_Menu");

        // ---------------------------------------------------------------- saving
        await ev("SceneManager._scene._commandWindow.selectSymbol('save'); 0");
        await press("ok", 30);
        check("'Zapisz grę' opens the files", await settle("Scene_Save"));
        await frames(20);
        const sv = await layout();
        const rows = await J(`(function(){ const w = SceneManager._scene._listWindow; return { cols: w.maxCols(), visible: w.maxVisibleItems ? w.maxVisibleItems() : 0, h: w.height }; })()`);
        check("the files in the panel, one to a row, with the chosen one described beside them", !!sv && sv.outside.length === 0 && rows.cols === 1 && rows.h > 300, { sv, rows });
        await ev("SceneManager._scene._listWindow.select(1); 0");
        await press("ok", 60);
        for (let i = 0; i < 40 && (await scene()) !== "Scene_Menu"; i++) await frames(10);
        const saved = await J("(function(){ const i = DataManager.savefileInfo(1); return i ? { day: i.day, season: i.season } : null; })()");
        check("saved into file 1 (its day and season kept for the list)", !!saved && saved.day >= 1, saved);
        await ev("SceneManager._scene._commandWindow.selectSymbol('save'); 0");
        await press("ok", 30);
        await settle("Scene_Save");
        await frames(30);
        await b.shot(OUT + "menu_panel_save.png");
        await press("escape", 30);
        await settle("Scene_Menu");

        // ---------------------------------------------------------------- the end-of-game question: cancel
        await ev("SceneManager._scene._commandWindow.selectSymbol('gameEnd'); 0");
        await press("ok", 30);
        check("'Zakończ grę' asks first, in a small panel", (await settle("Scene_GameEnd")) && ((await layout()) || {}).rect[2] < 600);
        await ev("SceneManager._scene._commandWindow.selectSymbol('cancel'); 0");
        await press("ok", 30);
        check("'Anuluj' goes back to the card", await settle("Scene_Menu"));
        await press("escape", 30);
        check("Esc closes the menu: back on the map", await settle("Scene_Map"));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
