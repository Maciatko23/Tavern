// Hand crafting: "Wytwórz..." on a free plot opens a list of what can be made without a building (hammer, shovel, rake, hoe, knife, rope).
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 20000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        await sleep(600);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const names = t => ev(`Farming.menuFor(${t}).entries.map(e => e.name + (e.enabled === false ? "(x)" : ""))`);
        const menuNames = () => ev("SceneManager._scene._farmMenu._entries.map(e => e.name + (e.enabled === false ? '(x)' : ''))");

        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; P["24,16"] = { s: "cleared" }; f.rev++; })()`);
        await ev(`$gamePlayer.locate(24, 17); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(24 - 13, 16 - 6); 0`);
        await frames(20);

        // ---- the data
        check("a new game has no hammer, shovel, rake or hoe", (await count(89)) + (await count(62)) + (await count(65)) + (await count(66)) === 0);
        const sawmill = await ev("Farming.BUILDINGS.sawmill.recipes.map(r => r.id)");
        check("the sawmill only saws: planks, and planks with the real saw (tools moved to the workbench)", sawmill.join() === "planks,planks_saw", sawmill);
        const hand = await ev("Farming.HAND_RECIPES.map(r => r.id)");
        check("the hand recipes: hammer, forest bed, waterskin and rope (the other tools are made at the workbench)", hand.join() === "hammer,bough_bed,waterskin,rope", hand);

        // ---- the plot menu has ONE short entry, the list opens through the real UI
        let list = await names("24, 16");
        check("the menu of a cleared plot has 'Wytwórz...' and no separate 'Zrób młotek'", list.includes("Wytwórz...") && !list.some(n => n.startsWith("Zrób")), list);
        await press("ok"); await frames(20);
        let idx = await ev("SceneManager._scene._farmMenu._entries.findIndex(e => e.name === 'Wytwórz...')");
        for (let i = 0; i < idx; i++) await press("down");
        await frames(14);
        await b.shot(OUT + "hm_plot.png");
        await press("ok"); await frames(20);
        check("OK opens the hand menu with its own title", (await ev("SceneManager._scene._farmMenu._title")) === "Wytwarzanie ręczne");
        list = await menuNames();
        check("it lists everything makeable by hand, all dimmed without materials, plus 'Wróć'", list.length === 5 && list.slice(0, 4).every(n => n.endsWith("(x)")) && list[4] === "Wróć", list);
        await b.shot(OUT + "hm_hand.png");
        // Wróć goes back to the plot menu
        await press("down"); await press("down"); await press("down"); await press("down"); await frames(14);
        await press("ok"); await frames(20);
        check("'Wróć' returns to the plot menu", (await ev("SceneManager._scene._farmMenu._title")) !== "Wytwarzanie ręczne" && (await menuNames()).includes("Wytwórz..."));
        await press("cancel"); await frames(10);

        // ---- the build list still offers the hammer straight away
        await ev("$gameParty.gainItem($dataItems[80], 9); 0");
        const buildFirst = await ev(`(function(){ const e = Farming.menuFor(24, 16).entries.find(e => e.name === "Zbuduj..."); let opened = null; const scene = SceneManager._scene; const _o = scene.openFarmMenu; scene.openFarmMenu = function(t, en) { opened = en.map(x => x.name); }; e.run(); scene.openFarmMenu = _o; return opened; })()`);
        check("the build list starts with 'Zrób młotek' while there is no hammer", buildFirst && buildFirst[0] === "Zrób młotek", buildFirst && buildFirst.slice(0, 3));

        // ---- a site without the hammer: the same entry
        await ev("$gamePlayer.locate(24, 17); Farming.placeSite('bench', 24, 16); 0");
        await frames(10);
        const siteMenu = await names("24, 16");
        check("a site's menu offers 'Wytwórz...' before 'Zacznij budować'", siteMenu[0] === "Wytwórz..." && siteMenu.includes("Zacznij budować"), siteMenu);
        await ev("Farming.cancelSite(Farming.buildingAt(24, 16)); 0");
        await frames(6);

        // ---- make the hammer through the UI
        await ev("$gameParty.gainItem($dataItems[61], 12); $gameParty.gainItem($dataItems[77], 12); $gameParty.gainItem($dataItems[64], 12); $gameParty.gainItem($dataItems[92], 8); 0");
        await frames(10);
        await ev(`$gamePlayer.locate(24, 17); $gamePlayer.setDirection(8); 0`);
        await frames(10);
        await press("ok"); await frames(20);
        idx = await ev("SceneManager._scene._farmMenu._entries.findIndex(e => e.name === 'Wytwórz...')");
        for (let i = 0; i < idx; i++) await press("down");
        await press("ok"); await frames(20);
        list = await menuNames();
        check("with materials the recipes are enabled (the waterskin needs a raw hide, so it stays dimmed)", list.filter(n => !/bukłak/.test(n)).slice(0, 3).every(n => !n.endsWith("(x)")) && list[2] === "Zrób bukłak(x)", list);
        await press("ok"); await frames(200);   // the first entry: the hammer
        check("the hammer is made through the menu", (await count(89)) === 1);
        const spent = { wood: await count(61), branch: await count(77), stone: await count(64) };
        check("2 branches, 2 stones and 1 flax were used (no wood)", spent.wood === 12 && spent.branch === 10 && spent.stone === 10 && (await count(92)) === 7, spent);

        // ---- the other five, and the ones you already own stay on the list but dimmed
        for (const id of ["rope"]) {
            await ev("$gameSystem.setStamina(100); 0");
            const ok = await ev(`Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === "${id}"))`);
            await frames(130);
            check("hand recipe " + id + " works", ok === true);
        }
        const tools = { shovel: await count(62), rake: await count(65), hoe: await count(66), knife: await count(90), rope: await count(93), fibre: await count(92) };
        check("the rope is in the bag (4 flax became 1 rope), and no other tool came out of the hand menu", tools.shovel === 0 && tools.rake === 0 && tools.hoe === 0 && tools.knife === 0 && tools.rope === 1 && tools.fibre === 3, tools);
        const again = await ev(`Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === "hammer"))`);
        check("a second hammer is refused (unique)", again === false && (await count(89)) === 1);
        await ev("$gameParty.gainItem($dataItems[92], 4); $gamePlayer.locate(24, 17); $gamePlayer.setDirection(8); 0");
        await frames(10);
        await press("ok"); await frames(20);
        idx = await ev("SceneManager._scene._farmMenu._entries.findIndex(e => e.name === 'Wytwórz...')");
        for (let i = 0; i < idx; i++) await press("down");
        await press("ok"); await frames(20);
        list = await menuNames();
        check("owned tools stay on the list, dimmed; the rope (repeatable) stays enabled while there is flax", list[0] === "Zrób młotek(x)" && list[3] === "Skręć linę", list);
        await b.shot(OUT + "hm_hand_owned.png");
        await press("cancel"); await frames(10);

        // ---- with the hammer a building can be put up
        await ev("$gameSystem.setStamina(100); Farming.placeSite('bench', 24, 16); 0");
        await frames(10);
        const struck = await ev("Farming.strikeSite(Farming.buildingAt(24, 16), 24, 16)");
        await frames(60);
        check("with the hammer the first blow lands", struck === true && (await ev("Farming.buildingAt(24, 16).site.done")) === 1);
        // (a site that has been struck takes one blow per press and shows no menu: use a fresh one on another tile)
        await ev(`(function(){ const f = $gameSystem._farm; f.plots[3]["27,16"] = { s: "cleared" }; f.rev++; })()`);
        await ev("$gameParty.gainItem($dataItems[80], 9); Farming.placeSite('bench', 27, 16); 0");
        await frames(6);
        const siteMenu2 = await names("27, 16");
        check("with a hammer a fresh site's menu no longer offers 'Wytwórz...'", !siteMenu2.includes("Wytwórz..."), siteMenu2);

        // ---- the journal
        await frames(40);
        check("journal: the hammer goal is done", await ev("Journal.goalDone(Journal.GOALS.find(g => g.id === 'hammer'))"));
        const rec = await ev("Journal.allRecipes().filter(e => e.type === 'hand').map(e => e.r.name)");
        check("journal: the recipes tab lists the four hand recipes under 'Bez budynku'", rec.length === 4, rec);
        const src = await ev("Journal.sourceLines(93)");
        check("journal: the rope's source mentions hand crafting", src.some(t => /Wytwórz/.test(t)), src);
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
