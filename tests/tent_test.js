// The tent: sewn in the tannery, pitched at once without a hammer, a night's sleep in it (like the bed), packed up again.
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const OUT = __dirname + "/tent/";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(19); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const settle = async () => { await frames(6); await ev(`new Promise(res => { const iv = setInterval(() => { if (!$gamePlayer.isToolSwinging() && !($gameTemp._farmLock > 0) && !($gameTemp._farmTimers && $gameTemp._farmTimers.length) && $gameScreen.brightness() >= 250) { clearInterval(iv); res(1); } }, 20); })`); await frames(4); };
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const stamina = () => ev("$gameSystem.stamina()");

        // ================= 1. data =================
        const item = await ev("(function(){ const i = $dataItems[121]; return i ? [i.name, i.iconIndex, i.itypeId, i.price] : null; })()");
        check("item 121 Namiot: key item, icon 380", JSON.stringify(item) === JSON.stringify(["Namiot", 380, 2, 0]), item);
        const icon = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); let n = 0; const d = bmp.context.getImageData((380 % 16) * 32, Math.floor(380 / 16) * 32, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; res(n); }; chk(); })`);
        check("icon 380 is drawn", icon > 250, icon);
        const def = await ev("(function(){ const t = Farming.BUILDINGS.tent; return { instant: t.instant, pack: t.pack, sleep: t.sleep, w: t.w, h: t.h, image: t.image, cost: t.cost }; })()");
        check("the tent is an instant, packable, sleepable building costing the tent item", def.instant === true && def.pack === 121 && def.sleep === true && def.w === 3 && def.h === 2 && def.image === "Farm_Tent_L" && JSON.stringify(def.cost) === "[[121,1]]", def);
        const rec = await ev("Farming.BUILDINGS.tannery.recipes.find(r => r.id === 'tent')");
        check("the tannery sews it: 4 tanned hides + 3 rope + 4 wood, hand work, only one", !!rec && rec.manual === true && rec.unique === true && JSON.stringify(rec.inputs) === "[[97,4],[93,3],[61,4]]" && rec.output[0] === 121, rec);
        check("the tannery's description mentions the tent", /namiot/i.test(await ev("Farming.BUILDINGS.tannery.desc")));

        // ================= 2. the meadow, a tannery, sewing =================
        const B = await ev(`(function(){
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!Farming.naturalFarmland(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found an open meadow", !!B, B);
        const { bx, by } = B;
        const standAt = (x, y, d) => ev(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); $gameSystem.setStamina(100); 0`);
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; const L = f.buildings[3] = f.buildings[3] || [];
            L.push({ id: f.nextId++, type: "tannery", x: ${bx + 1}, y: ${by + 1}, last: 1 }); P["${bx + 1},${by + 1}"] = { s: "cleared" }; P["${bx + 2},${by + 1}"] = { s: "cleared" }; f.rev++; })()`);
        await frames(6);
        // the build list: the tent is there, dimmed, without a hammer
        await standAt(bx + 5, by + 4, 8);
        const list0 = await ev(`Farming.menuFor(${bx + 5}, ${by + 3}) && 0`).catch(() => 0);
        const buildList = await ev(`(function(){ const scene = SceneManager._scene; let got = null; const _o = scene.openFarmMenu; scene.openFarmMenu = function(t, en) { got = en.map(x => ({ name: x.name, enabled: x.enabled !== false, help: x.help })); }; const e = Farming.menuFor(${bx + 5}, ${by + 3}).entries.find(e => e.name === "Zbuduj..."); e.run(); scene.openFarmMenu = _o; return got; })()`);
        const tentRow = buildList && buildList.find(e => e.name === "Namiot");
        check("the build list has the tent, dimmed while there is none, and points at the tannery", !!tentRow && tentRow.enabled === false && /garbarni/.test(tentRow.help), tentRow);
        check("no hammer in the bag (the tent must not need one)", (await count(89)) === 0);
        // sewing
        await standAt(bx + 1, by + 2, 8);
        const noMat = await ev(`Farming.craftManual(Farming.buildingAt(${bx + 1}, ${by + 1}), Farming.BUILDINGS.tannery.recipes.find(r => r.id === "tent"))`);
        check("without hides, rope and wood there is no tent", noMat === false && (await count(121)) === 0);
        await give(97, 4); await give(93, 3); await give(61, 4);
        const menuT = JSON.parse(await ev(`JSON.stringify(Farming.menuFor(${bx + 1}, ${by + 1}).entries.map(e => e.name + (e.enabled === false ? "(x)" : "")))`));
        check("the tannery menu offers 'Zszyj namiot' (enabled with the materials)", menuT.includes("Zszyj namiot"), menuT);
        const sewn = await ev(`Farming.craftManual(Farming.buildingAt(${bx + 1}, ${by + 1}), Farming.BUILDINGS.tannery.recipes.find(r => r.id === "tent"))`);
        await settle();
        check("sewn: the tent is in the bag, the materials are gone", sewn === true && (await count(121)) === 1 && (await count(97)) === 0 && (await count(93)) === 0 && (await count(61)) === 0);
        await give(97, 4); await give(93, 3); await give(61, 4);
        check("a second tent is refused while you have one", (await ev(`Farming.craftManual(Farming.buildingAt(${bx + 1}, ${by + 1}), Farming.BUILDINGS.tannery.recipes.find(r => r.id === "tent"))`)) === false && (await count(121)) === 1);
        await ev("[97, 93, 61].forEach(i => $gameParty.loseItem($dataItems[i], 4, true)); 0");

        // ================= 3. pitching through the real placement UI =================
        await standAt(bx + 5, by + 4, 8);
        await frames(4);
        const st0 = await stamina();
        await ev(`Farming.startPlacement("tent", ${bx + 5}, ${by + 3}); 0`);
        await frames(8);
        await ev(`$gameTemp._buildMode.x = ${bx + 5}; $gameTemp._buildMode.y = ${by + 3}; 0`);
        await frames(4);
        await b.shot(OUT + "placement.png");
        await press("ok");
        await settle();
        const tentB = await ev(`(function(){ const q = Farming.buildingAt(${bx + 5}, ${by + 3}); return q ? { type: q.type, site: !!q.site } : null; })()`);
        check("the tent stands at once: no building site, no hammer blows", !!tentB && tentB.type === "tent" && tentB.site === false, tentB);
        check("the tent item went into it and pitching cost a little stamina", (await count(121)) === 0 && (await stamina()) < st0 && (await stamina()) >= st0 - 6, { st0, now: await stamina() });
        check("it blocks the way like a building", (await ev(`$gameMap.isPassable(${bx + 5}, ${by + 3}, 2)`)) === false || (await ev(`$gameMap.isPassable(${bx + 6}, ${by + 3}, 2)`)) === false);
        check("its picture Farm_Tent_L.png is drawn", await ev(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === 'tent'); return !!e && !!e.sprite.bitmap && e.sprite.bitmap.isReady() && e.sprite.bitmap.width === 144; })()`));
        await give(97, 4); await give(93, 3); await give(61, 4);
        check("with the tent pitched somewhere you cannot sew another", (await ev(`Farming.craftManual(Farming.buildingAt(${bx + 1}, ${by + 1}), Farming.BUILDINGS.tannery.recipes.find(r => r.id === "tent"))`)) === false && (await count(121)) === 0);
        await ev("[97, 93, 61].forEach(i => $gameParty.loseItem($dataItems[i], 4, true)); 0");
        await ev(`$gameMap.setDisplayPos(${bx + 5} - 13, ${by + 3} - 7); 0`);
        await frames(30);
        await b.shot(OUT + "tent_pitched.png");

        // ================= 4. the menu and a night's sleep =================
        await standAt(bx + 5, by + 4, 8);
        await frames(8);
        const m = JSON.parse(await ev(`JSON.stringify(Farming.menuFor(${bx + 5}, ${by + 3}).entries.map(e => e.name))`));
        check("the tent menu: 'Prześpij noc', 'Złóż namiot', 'Zostaw' - and no 'Rozbierz'", m.join() === "Prześpij noc,Złóż namiot,Zostaw", m);
        await ev("Journal.evaluateGoals(); 0");
        await press("ok"); await frames(24);
        check("the real action button facing the tent opens its menu", (await ev("$gameTemp._farmMenuOpen ? SceneManager._scene._farmMenu._title : ''")) === "Namiot");
        await b.shot(OUT + "tent_menu.png");
        // sleep at night with low strength and health
        await ev("$gameSystem.setDayNightHour(22.5); $gameSystem.setStamina(12); $gameParty.members()[0].setHp(1); 0");
        const day0 = await ev("$gameSystem.dayNightDay()");
        await press("ok");
        await frames(40);
        const dark = await ev("$gameScreen.brightness()");
        check("the screen never dims while you go to sleep (fades were removed everywhere)", dark === 255, dark);
        await frames(90);
        const woke = await ev(`({ day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), stamina: $gameSystem.stamina(), max: $gameSystem.maxStamina(), hp: $gameParty.members()[0].hp, mhp: $gameParty.members()[0].mhp, nights: $gameSystem._farm.tentNights, autosave: !!$gameTemp._atmoAutosave, summary: !!$gameTemp._pendingSummary })`);
        console.log("after the night:", JSON.stringify(woke));
        check("time jumped to the morning of the next day (the same hour as after a night in a bed)", woke.day === day0 + 1 && Math.abs(woke.hour - (await ev("Farming.wakeHour()"))) < 0.3, woke);
        check("strength and health are fully back", woke.stamina === woke.max && woke.hp === woke.mhp, woke);
        check("the night is counted (goal 'tentnight') and the day summary is queued", woke.nights === 1 && woke.summary === true, woke);
        check("the game saves itself (autosave flag set by the night)", woke.autosave === true || (await ev("DataManager.savefileExists(0)")) === true, woke.autosave);
        await frames(20);
        const msg = await ev("$gameMessage.hasText() ? $gameMessage.allText() : ''");
        check("a message greets the new day: 'Dzień N. ...' and 'Czujesz się wypoczęty.'", /Dzień \d+/.test(msg) && /Czujesz się wypoczęty/.test(msg), msg);
        await b.shot(OUT + "morning_message.png");
        // dismiss the message, then the day summary scene
        for (let i = 0; i < 14; i++) {
            const scene = await ev("SceneManager._scene.constructor.name");
            if (scene === "Scene_Map" && !(await ev("$gameMessage.isBusy()")) && !(await ev("!!$gameTemp._pendingSummary"))) break;
            if (scene === "Scene_DaySummary") await b.shot(OUT + "day_summary.png");
            await press("ok"); await frames(20);
        }
        await settle();
        check("back on the map with the player free to move", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await ev("$gamePlayer.canMove()")) === true, await ev("SceneManager._scene.constructor.name"));
        const goal = await ev(`(function(){ Journal.evaluateGoals(); return !!$gameSystem._journal.done.tentnight; })()`);
        check("the journal goal 'Prześpij noc w namiocie' is done", goal === true);
        check("the tent is still standing after the night", (await ev(`!!Farming.buildingAt(${bx + 5}, ${by + 3})`)) === true);

        // ================= 5. pack it up, pitch it somewhere else =================
        await standAt(bx + 5, by + 4, 8);
        await frames(8);
        const pack = await ev(`(function(){ const e = Farming.menuFor(${bx + 5}, ${by + 3}).entries.find(e => e.name === "Złóż namiot"); return e.run(); })()`);
        await settle();
        check("'Złóż namiot' folds it into the item again", pack === true && (await count(121)) === 1 && (await ev(`Farming.buildingAt(${bx + 5}, ${by + 3})`)) === null);
        check("the ground is free again", (await ev(`Farming.whyNotBuild("tent", ${bx + 5}, ${by + 3})`)) === null);
        await standAt(bx + 8, by + 4, 8);
        await frames(4);
        await ev(`Farming.startPlacement("tent", ${bx + 8}, ${by + 3}); 0`);
        await frames(8);
        await ev(`$gameTemp._buildMode.x = ${bx + 7}; $gameTemp._buildMode.y = ${by + 3}; 0`);
        await frames(3);
        await press("ok");
        await settle();
        check("it can be pitched again in another place", (await ev(`!!Farming.buildingAt(${bx + 7}, ${by + 3})`)) === true && (await count(121)) === 0);
        // ================= 6. journal =================
        const goals = await ev(`(function(){ const t = Journal.GOALS.find(g => g.id === "tent"), n = Journal.GOALS.find(g => g.id === "tentnight"); return { tent: !!t && !!Journal.recipeRef(t.recipe), night: !!n && n.after.join() === "tent", ids: new Set(Journal.GOALS.map(g => g.id)).size === Journal.GOALS.length }; })()`);
        check("the journal has the goals 'Uszyj namiot' (with a valid recipe) and 'Prześpij noc w namiocie'", goals.tent && goals.night && goals.ids, goals);
        console.log("console errors:", JSON.stringify(b.logs.filter(l => /EXC|rror/.test(l)).slice(-4)));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
