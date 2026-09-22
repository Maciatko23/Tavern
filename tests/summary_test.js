// Two small additions: the Journal's 6th tab "Zapasy" (worn tools + soon-to-spoil food, with repair
// costs and a freshness note), and the save screen's new day / season / hut line (stashed into the
// save's own info at save time, so a slot always shows its own game's day).
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
        await sleep(2000);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const setN = async (id, n) => { await ev(`$gameParty.gainItem($dataItems[${id}], ${n} - $gameParty.numItems($dataItems[${id}])); 0`); };
        const key = async (code, hold = 3) => { await ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`); await frames(hold); await ev(`Input._onKeyUp({ keyCode: ${code} }); 0`); await frames(4); };

        // ---------------------------------------------------------------- Journal: the "Zapasy" tab
        // a worn stone axe (60): 70 life * FACTOR, use it down to under 40%, but keep enough branch+fibre to repair it
        await setN(60, 1); await setN(77, 5); await setN(92, 5);
        await ev(`(function(){ const life = Durability.lifeOf(60); $gameSystem._wear = $gameSystem._wear || { used: {}, warned: {} }; $gameSystem._wear.used[60] = Math.ceil(life * 0.7); return Durability.left(60); })()`);
        // bread (83) about to spoil: age it to leave only a few hours
        await setN(83, 1);
        await ev(`(function(){ const s = Spoilage.state(); const list = s.bag[83] || (s.bag[83] = []); list.length = 0; list.push({ n: 1, age: Spoilage.LIFE[83] - 2 }); return Spoilage.hoursLeft(83); })()`);
        await frames(6);
        await key(74);   // J opens the journal
        await frames(10);
        check("J opens the journal", await ev("SceneManager._scene.constructor.name === 'Scene_Journal'"));
        await ev("SceneManager._scene._tab = 5; SceneManager._scene.showTab(); 0");
        await frames(4);
        const st = await J(`(function(){ const sc = SceneManager._scene; return { tabName: ["Cele","Surowce","Budynki","Receptury","Notatki","Zapasy"][sc._tab],
            names: sc._list._items.map(i => i.label), rights: sc._list._items.map(i => i.right), marks: sc._list._items.map(i => i.mark) }; })()`);
        check("tab 5 is 'Zapasy'", st.tabName === "Zapasy", st.tabName);
        check("it lists the worn axe and the stale bread", st.names.includes("Kamienna siekiera") && st.names.includes("Chleb"), st.names);
        const axeIdx = st.names.indexOf("Kamienna siekiera"), breadIdx = st.names.indexOf("Chleb");
        check("the axe shows left/life and is marked (worn, but repairable: has branch+fibre)", /^\d+\/\d+$/.test(st.rights[axeIdx]) && st.marks[axeIdx] === "ready", { right: st.rights[axeIdx], mark: st.marks[axeIdx] });
        check("the bread is marked urgent (spoils within a day) with an hours estimate", st.marks[breadIdx] === "ready" && /godz/.test(st.rights[breadIdx]), { right: st.rights[breadIdx], mark: st.marks[breadIdx] });
        await ev(`SceneManager._scene._list.select(${axeIdx}); SceneManager._scene._list.updateHelp(); 0`);
        await frames(4);
        const axeOps = await J("SceneManager._scene._detail._ops");
        check("the axe's detail panel names it, shows its durability and the repair cost (branch + fibre)", axeOps.some(o => o.k === "title" && o.text === "Kamienna siekiera") && axeOps.some(o => o.k === "sub" && /^Wytrzymałość: \d+ z \d+/.test(o.text)) && axeOps.some(o => o.k === "h" && o.text === "Naprawa") && axeOps.some(o => o.k === "cost"), axeOps);
        check("...and says where to repair it (the workbench)", axeOps.some(o => /warsztacie/.test(o.text || "")), axeOps.map(o => o.text));
        await ev(`SceneManager._scene._list.select(${breadIdx}); SceneManager._scene._list.updateHelp(); 0`);
        await frames(4);
        const breadOps = await J("SceneManager._scene._detail._ops");
        check("the bread's detail panel shows a freshness line and the pantry tip", breadOps.some(o => o.k === "title" && o.text === "Chleb") && breadOps.some(o => o.k === "sub" && /zepsuje/.test(o.text)) && breadOps.some(o => /spiżarni/.test(o.text || "")), breadOps.map(o => o.text));
        await key(27); await frames(20);   // Esc: back to the map

        // an empty state: nothing worn, nothing perishable
        await ev(`(function(){ $gameSystem._wear = { used: {}, warned: {} }; $gameParty.gainItem($dataItems[60], -1); $gameParty.gainItem($dataItems[83], -1); 0; })()`);
        await key(74); await frames(10);
        await ev("SceneManager._scene._tab = 5; SceneManager._scene.showTab(); 0");
        await frames(4);
        const empty = await J("SceneManager._scene._list._items.map(i => ({ label: i.label, empty: !!i.empty }))");
        check("with nothing worn or spoiling, the tab shows the empty-state row, not a blank list", empty.length === 1 && empty[0].empty, empty);
        await key(27); await frames(20);

        // ---------------------------------------------------------------- the save screen's day / season / hut line
        const before = await J("({ day: $gameSystem.dayNightDay(), season: (window.Farming && Farming.seasonOf) ? Farming.seasonOf($gameSystem.dayNightDay()) : '', hut: !!(window.Farming && Farming.hutOf && Farming.hutOf()) })");
        await ev("DataManager.saveGame(1)");
        await frames(10);
        const info = await J("DataManager.savefileInfo(1)");
        check("saving stashes the day, season and hut-built flag into the save's own info", info.day === before.day && info.season === before.season && info.hutBuilt === before.hut, { before, info });
        // the save screen actually paints that line (spy on drawText instead of reading pixels; Window_SavefileStatus
        // itself is private to AltSaveScreen.js's closure, so spy on the true global Window_Base that it descends from)
        await ev(`window.__drawn = []; const _dt = Window_Base.prototype.drawText; Window_Base.prototype.drawText = function(text) { window.__drawn.push(text); return _dt.apply(this, arguments); }; 0`);
        await ev("SceneManager.push(Scene_Save); 0");
        await frames(20);
        check("the save scene opened without errors", await ev("SceneManager._scene.constructor.name === 'Scene_Save'"));
        // force slot 1 (the one just saved) to be the one drawn, whatever the cursor's default position is
        await ev("(function(){ const w = SceneManager._scene._listWindow.mzkp_statusWindow; w.setSavefileId(1); w.refresh(); })()");
        await frames(4);
        const drawn = await J("window.__drawn");
        const wantSubstr = "Dzień " + before.day + (before.season ? "  ·  " + before.season : "") + "  ·  " + (before.hut ? "chatka zbudowana" : "chatki jeszcze nie ma");
        check("...and paints 'Dzień N · sezon · chatka ...' on the used slot", drawn.includes(wantSubstr), { wanted: wantSubstr, drawn });
        await b.shot(require("path").join(__dirname, "save_card.png"));
        await ev("SceneManager.pop(); 0");
        await frames(20);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
