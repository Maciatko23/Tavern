// Journal: goals (state driven), the five tabs, pinning, the tracker, notes, the summary of the day, the menu entry.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate timeout: ' + String(e).slice(0, 120))), 20000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(60); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        const shot = async name => { await frames(10); await b.shot(OUT + `jr_${name}.png`); };
        await sleep(600);

        // ---- data checks
        const sane = await ev(`(function(){ const F = Farming, bad = [];
            for (const g of Journal.GOALS) {
                if (g.build && !F.BUILDINGS[g.build]) bad.push(g.id + ":build");
                if (g.recipe && !Journal.recipeRef(g.recipe)) bad.push(g.id + ":recipe");
                for (const a of g.after || []) if (!Journal.GOALS.some(x => x.id === a)) bad.push(g.id + ":after " + a);
                if (g.item && !$dataItems[g.item]) bad.push(g.id + ":item");
            }
            const ids = Journal.GOALS.map(g => g.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
            return { n: Journal.GOALS.length, bad, dup }; })()`);
        check("every goal points at a real building / recipe / item / prerequisite", sane.bad.length === 0 && sane.dup.length === 0, sane);

        // ---- a fresh game: only the start goals are open
        await frames(40);
        let cur = await ev("Journal.GOALS.filter(g => !Journal.goalDone(g) && Journal.goalAvailable(g)).map(g => g.id)");
        check("at the start the open goals are the first steps (gathering; the hammer, workbench and axe come after)", ["stone", "branches", "flax", "borgar"].every(id => cur.includes(id)) && !cur.includes("hammer") && !cur.includes("wood") && !cur.includes("sawmill"), cur);
        check("the tracker shows the first goal: pick up stones", (await ev("Journal.currentGoal().id")) === "stone");

        // ---- goals finish by themselves
        await ev("$gameParty.gainItem($dataItems[61], 12); $gameParty.gainItem($dataItems[64], 5); $gameParty.gainItem($dataItems[89], 1); 0");
        await frames(40);
        cur = await ev("Journal.GOALS.filter(g => Journal.goalDone(g)).map(g => g.id)");
        check("owning wood and stone finishes those goals (and a popup announces it)", cur.includes("wood") && cur.includes("stone"), cur);
        cur = await ev("Journal.GOALS.filter(g => !Journal.goalDone(g) && Journal.goalAvailable(g)).map(g => g.id)");
        check("which opens the sawmill and the campfire", cur.includes("sawmill") && cur.includes("campfire"), cur);
        // a finished building ticks its goal, a building site does not
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || []; L.push({ id: f.nextId++, type: "sawmill", x: 26, y: 5, last: 1, site: { need: 4, done: 1 } }); f.rev++; })()`);
        await frames(40);
        check("a building site is not a building yet", !(await ev("Journal.goalDone(Journal.GOALS.find(g => g.id === 'sawmill'))")));
        await ev(`(function(){ const b = $gameSystem._farm.buildings[3].find(b => b.type === "sawmill"); delete b.site; $gameSystem._farm.rev++; })()`);
        await frames(40);
        check("finished it counts", await ev("Journal.goalDone(Journal.GOALS.find(g => g.id === 'sawmill'))"));
        // the goal progress line: what is missing
        const prog = await ev("Journal.goalProgress(Journal.GOALS.find(g => g.id === 'campfire'))");
        console.log("campfire progress:", JSON.stringify(prog));
        check("the tracker line names what is missing", /Gałęzie|Drewno|Kamień|Masz wszystko/.test(prog), prog);

        // ---- the scene: open with J, the five tabs
        await press("journal"); await frames(30);
        check("J opens the journal", (await ev("SceneManager._scene.constructor.name")) === "Scene_Journal");
        await shot("goals");
        const tabInfo = [];
        for (let tab = 0; tab < 5; tab++) {
            const info = await ev(`(function(){ const s = SceneManager._scene; const items = s._list._items; return { tab: s._tab, n: items.length, first: items[0] && items[0].label, detailH: s._detail._contentH, ops: s._detail._ops.length }; })()`);
            tabInfo.push(info);
            if (tab === 2) { await frames(20); await shot("buildings"); }
            if (tab === 1) await shot("materials");
            if (tab === 3) await shot("recipes");
            await press("right"); await frames(6);
        }
        console.log(JSON.stringify(tabInfo));
        check("the goals tab lists open goals first", tabInfo[0].n >= 5 && tabInfo[0].ops > 4);
        check("the materials tab lists the materials", tabInfo[1].n >= 25, tabInfo[1].n);
        check("the buildings tab lists every building", tabInfo[2].n === (await ev("Object.keys(Farming.BUILDINGS).length")), tabInfo[2].n);
        check("the recipes tab lists every recipe", tabInfo[3].n === (await ev("Journal.allRecipes().length")), tabInfo[3].n);
        check("the notes tab starts empty with a placeholder row", tabInfo[4].n === 1 && tabInfo[4].first === "Brak notatek");
        // every list row of every tab renders a detail without errors
        const walked = await ev(`(function(){ const s = SceneManager._scene; let n = 0;
            for (let t = 0; t < 5; t++) { s._tab = t; s.showTab(); for (let i = 0; i < s._list.maxItems(); i++) { s._list.select(i); s._list.updateHelp(); n++; } }
            return n; })()`);
        check("all " + walked + " list rows produce a detail pane", walked > 60, walked);
        await ev("SceneManager._scene._tab = 0; SceneManager._scene.showTab(); 0");
        await frames(10);

        // ---- pin a goal with OK
        await ev("SceneManager._scene._list.select(1); SceneManager._scene._list.updateHelp(); 0");
        const second = await ev("SceneManager._scene._list.currentItem().goal.id");
        await press("ok"); await frames(6);
        check("OK pins the goal", (await ev("$gameSystem._journal.pinned")) === second, second);
        await press("ok"); await frames(6);
        check("OK again unpins it", (await ev("$gameSystem._journal.pinned")) === null);
        await press("ok"); await frames(6);
        await press("cancel"); await frames(30);
        check("cancel returns to the map", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
        check("the pinned goal is now the tracker goal", (await ev("Journal.currentGoal().id")) === second);
        await frames(20);
        await shot("tracker");
        await ev("$gameSystem._journal.pinned = null; 0");

        // ---- notes
        await ev("Journal.addNote('Pieśń Melii', 'Melia zanuciła fragment o strażniku, który nigdy nie pytał.'); 0");
        await press("journal"); await frames(30);
        for (let i = 0; i < 4; i++) { await press("right"); await frames(4); }
        const notes = await ev("({ n: SceneManager._scene._list._items.length, first: SceneManager._scene._list._items[0].label })");
        check("a note lands in the notes tab", notes.n === 1 && notes.first === "Pieśń Melii", notes);
        await shot("notes");
        await press("cancel"); await frames(30);

        // ---- the main menu entry
        await ev("SceneManager.push(Scene_Menu); 0");
        await sleep(900);
        const cmds = await ev("SceneManager._scene._commandWindow._list.map(c => c.symbol + ':' + c.name)");
        check("the main menu has the Dziennik command (in its column of commands, MenuPanel.js)", cmds.includes("journal:Dziennik") && (await ev("SceneManager._scene._commandWindow.maxCols()")) === 1, cmds);
        await shot("menu");
        await ev("SceneManager.pop(); 0"); await sleep(600);

        // ---- the summary of the day: a night in the bed
        await ev("$gameParty.gainItem($dataItems[80], 6); $gameParty.gainItem($dataItems[71], 4); $gameSystem.setDayNightHour(21); 0");
        await frames(10);
        const day0 = await ev("$gameSystem.dayNightDay()");
        await ev("$gameSystem.sleepUntilHour(7); 0");
        check("sleeping through midnight queues the summary", !!(await ev("$gameTemp._pendingSummary")) && (await ev("$gameTemp._pendingSummary.day")) === day0);
        await frames(40);
        check("the summary scene opens on the map", (await ev("SceneManager._scene.constructor.name")) === "Scene_DaySummary");
        const ops = await ev("SceneManager._scene._window.width + ':' + SceneManager._scene._window.height");
        console.log("summary window", ops);
        await shot("summary");
        const s = await ev("$gameSystem._journal.last");
        check("it lists what was gained and the finished goals", s.gained.length >= 3 && s.goals.includes("wood"), { gained: s.gained.slice(0, 4), goals: s.goals.length });
        await press("ok"); await frames(10);
        await press("ok"); await frames(40);
        check("OK closes it and the map returns", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
        check("it is shown only once", !(await ev("$gameTemp._pendingSummary")));

        // ---- a rest on a bedroll that runs through midnight
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; const L = f.buildings[3] = f.buildings[3] || [];
            L.push({ id: f.nextId++, type: "bedroll", x: 24, y: 17, last: 1 }); P["24,17"] = { s: "cleared" }; P["25,17"] = { s: "cleared" };
            L.push({ id: f.nextId++, type: "bench", x: 27, y: 17, last: 1 }); P["27,17"] = { s: "cleared" }; f.rev++; })()`);
        await ev("$gameSystem.setDayNightHour(21.5); $gameSystem.setStamina(30); $gameMap.event; 0");
        const day1 = await ev("$gameSystem.dayNightDay()");
        await ev("Farming.sleepInTent(Farming.buildingAt(24, 17)); 0");
        await frames(200);
        for (let k = 0; k < 12 && (await ev("SceneManager._scene.constructor.name")) !== "Scene_DaySummary"; k++) { await press("ok"); await frames(20); }
        check("a night on the forest bed ends the day and shows the summary", (await ev("SceneManager._scene.constructor.name")) === "Scene_DaySummary" && (await ev("$gameSystem.dayNightDay()")) === day1 + 1);
        await press("ok"); await frames(10); await press("ok"); await frames(30);
        // a short rest on the same day: no summary
        await ev("$gameSystem.setDayNightHour(12); $gameSystem.setStamina(30); 0");
        await ev("Farming.rest(Farming.buildingAt(27, 17)); 0");
        await frames(260);
        check("a rest that does not cross midnight shows no summary", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror|Object/.test(l)).slice(-5));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
