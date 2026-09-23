// The forest bed: made in "Wytwórz..." from branches + flax, laid out like the tent, a night on it restores only part of the strength.
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const OUT = __dirname + "/bough/";
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(19); $gameSystem.setStamina(100); $gameScreen.clearWeather(); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const settle = async () => { await frames(6); await ev(`new Promise(res => { const iv = setInterval(() => { if (!$gamePlayer.isToolSwinging() && !($gameTemp._farmLock > 0) && !($gameTemp._farmTimers && $gameTemp._farmTimers.length) && $gameScreen.brightness() >= 250) { clearInterval(iv); res(1); } }, 20); })`); await frames(4); };
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const stamina = () => ev("Math.round($gameSystem.stamina())");
        // a night: sleep, then close every message and the day summary
        const night = async (b_, hour, stam) => {
            await ev(`$gameSystem.setDayNightHour(${hour}); $gameSystem.setStamina(${stam}); Journal.evaluateGoals(); 0`);
            await ev(`Farming.sleepInTent(${b_}); 0`);
            await frames(200);
            const text = await ev("$gameMessage.hasText() ? $gameMessage.allText() : ''");
            for (let k = 0; k < 14; k++) {
                const scene = await ev("SceneManager._scene.constructor.name");
                if (scene === "Scene_Map" && !(await ev("$gameMessage.isBusy()")) && !(await ev("!!$gameTemp._pendingSummary"))) break;
                await press("ok"); await frames(20);
            }
            await settle();
            return text;
        };

        // ================= 1. data =================
        const item = await ev("(function(){ const i = $dataItems[128]; return i ? [i.name, i.iconIndex, i.itypeId] : null; })()");
        check("item 128 Leśne legowisko: key item, icon 388", JSON.stringify(item) === JSON.stringify(["Leśne legowisko", 388, 2]), item);
        const icon = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); let n = 0; const d = bmp.context.getImageData((388 % 16) * 32, Math.floor(388 / 16) * 32, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; res(n); }; chk(); })`);
        check("icon 388 is drawn", icon > 300, icon);
        const def = await ev("(function(){ const t = Farming.BUILDINGS.bedroll; return { name: t.name, instant: t.instant, sleep: t.sleep, restore: t.sleepRestore, bad: t.sleepBad, cost: t.cost, rest: t.rest }; })()");
        check("the bedroll is now 'Leśne legowisko': laid out at once, sleeps a night, 60% (40% in bad weather), costs the item, no nap", def.name === "Leśne legowisko" && def.instant === true && def.sleep === true && def.restore === 0.6 && def.bad === 0.4 && JSON.stringify(def.cost) === "[[128,1]]" && def.rest === undefined, def);
        const hand = await ev("Farming.HAND_RECIPES.map(r => r.id)");
        check("the hand menu makes: hammer, forest bed, waterskin, rope", hand.join() === "hammer,bough_bed,waterskin,rope", hand);
        const inputs = await ev("Farming.HAND_RECIPES.find(r => r.id === 'bough_bed').inputs");
        check("the bed is made of branches (6) and flax (3) only", JSON.stringify(inputs) === "[[77,6],[92,3]]", inputs);
        check("its picture loads (96x64)", await ev(`new Promise(res => { const bm = ImageManager.loadSystem("Farm_Bedroll"); bm.addLoadListener(() => res(bm.width === 96 && bm.height === 64)); })`));
        const hint = await ev("Farming.menuFor(0, 0) === null ? '' : ''").catch(() => "");

        // ================= 2. the meadow, "Wytwórz..." =================
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
        await standAt(bx + 2, by + 4, 8);
        await frames(8);
        // the real menu: the plot menu > Wytwórz... > Zrób leśne legowisko
        const list0 = await ev(`Farming.menuFor(${bx + 2}, ${by + 3}).entries.map(e => e.name)`);
        check("the plot menu of a grass tile offers 'Wytwórz...'", list0.includes("Wytwórz..."), list0);
        await press("ok"); await frames(20);
        let idx = await ev("SceneManager._scene._farmMenu._entries.findIndex(e => e.name === 'Wytwórz...')");
        for (let i = 0; i < idx; i++) await press("down");
        await press("ok"); await frames(20);
        const handList = await ev("SceneManager._scene._farmMenu._entries.map(e => e.name + (e.enabled === false ? '(x)' : ''))");
        check("the hand menu lists 'Zrób leśne legowisko' (dimmed without branches and flax)", handList.includes("Zrób leśne legowisko(x)"), handList);
        await b.shot(OUT + "hand_menu.png");
        await press("cancel"); await frames(10); await press("cancel"); await frames(10);
        await give(77, 6); await give(92, 3);
        const made = await ev("Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === 'bough_bed'))");
        await settle();
        check("made: the bed is in the bag, 6 branches and 3 flax are gone", made === true && (await count(128)) === 1 && (await count(77)) === 0 && (await count(92)) === 0);
        await give(77, 6); await give(92, 3);
        check("a second one is refused while you have one", (await ev("Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === 'bough_bed'))")) === false && (await count(128)) === 1);
        await ev("[77, 92].forEach(i => $gameParty.loseItem($dataItems[i], 9, true)); 0");

        // ================= 3. laid out at once, no hammer =================
        check("no hammer in the bag", (await count(89)) === 0);
        await standAt(bx + 2, by + 4, 8);
        await ev(`Farming.startPlacement("bedroll", ${bx + 2}, ${by + 3}); 0`);
        await frames(8);
        await ev(`$gameTemp._buildMode.x = ${bx + 2}; $gameTemp._buildMode.y = ${by + 3}; 0`);
        await frames(4);
        await press("ok"); await settle();
        const bed = await ev(`(function(){ const q = Farming.buildingAt(${bx + 2}, ${by + 3}); return q ? { type: q.type, site: !!q.site } : null; })()`);
        check("the bed stands at once (no building site), the item went into it", !!bed && bed.type === "bedroll" && bed.site === false && (await count(128)) === 0, bed);
        await give(77, 6); await give(92, 3);
        check("with the bed standing you cannot make another", (await ev("Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === 'bough_bed'))")) === false);
        await ev("[77, 92].forEach(i => $gameParty.loseItem($dataItems[i], 9, true)); 0");
        await b.shot(OUT + "bed_pitched.png");
        const names = await ev(`Farming.menuFor(${bx + 2}, ${by + 3}).entries.map(e => e.name)`);
        check("its menu: 'Prześpij noc', 'Rozbierz' (no nap, no 'Zostaw')", names.join() === "Prześpij noc,Rozbierz", names);
        const helpLine = await ev(`Farming.menuFor(${bx + 2}, ${by + 3}).entries[0]`);
        check("the sleep line says it restores about 60% (40% in rain, snow and winter)", /60%/.test(helpLine.help) && /40%/.test(helpLine.help) && /60%/.test(helpLine.right), helpLine);
        await press("ok"); await frames(20);
        await b.shot(OUT + "bed_menu.png");
        await press("cancel"); await frames(10);

        // ================= 4. the nights =================
        const bedRef = `Farming.buildingAt(${bx + 2}, ${by + 3})`;
        const day0 = await ev("$gameSystem.dayNightDay()");
        const t1 = await night(bedRef, 22, 10);
        check("a fine night on the bed: stamina back to 60% only", (await stamina()) === 60, await stamina());
        check("...and the morning message says so", /Spałeś twardo/.test(t1), t1);
        check("time jumped to the morning of the next day", (await ev("$gameSystem.dayNightDay()")) === day0 + 1 && Math.abs((await ev("$gameSystem.dayNightHour()")) - 7) < 2);
        await ev("$gameScreen.changeWeather('rain', 5, 0); 0"); await frames(20);
        const t2 = await night(bedRef, 22, 10);
        check("a night in the rain: only 40%", (await stamina()) === 40, await stamina());
        check("...'Spałeś w zimnie i wilgoci'", /zimnie i wilgoci/.test(t2), t2);
        await ev("$gameScreen.clearWeather(); 0");
        await night(bedRef, 22, 90);
        check("a stronger sleeper keeps what he had (90 stays 90: sleep never takes strength away)", (await stamina()) === 90, await stamina());
        check("the nights on the bed are counted, not as tent nights", (await ev("$gameSystem._farm.bedNights")) === 3 && !(await ev("$gameSystem._farm.tentNights")));
        // the tent: everything, also in rain
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: f.nextId++, type: "tent", x: ${bx + 6}, y: ${by + 3}, last: 1 }); f.plots[3]["${bx + 6},${by + 3}"] = { s: "cleared" }; f.plots[3]["${bx + 7},${by + 3}"] = { s: "cleared" }; f.rev++; })()`);
        await ev("$gameScreen.changeWeather('rain', 5, 0); 0"); await frames(20);
        const t3 = await night(`Farming.buildingAt(${bx + 6}, ${by + 3})`, 22, 10);
        check("a night in the tent: full strength even in the rain", (await stamina()) === 100 && /Czujesz się wypoczęty/.test(t3), { s: await stamina(), t3 });
        check("tent nights are counted separately", (await ev("$gameSystem._farm.tentNights")) === 1);
        await ev("$gameScreen.clearWeather(); 0");
        // winter counts as harsh too
        await ev("$gameSystem._dayNightDay = 90; 0");
        await night(bedRef, 22, 10);
        check("in winter (day 90) the bed gives 40% as well", (await stamina()) === 40, await stamina());

        // ================= 5. taking it down, the journal =================
        await give(77, 0);
        const before = { br: await count(77), fi: await count(92) };
        await standAt(bx + 2, by + 4, 8);
        await ev(`Farming.menuFor(${bx + 2}, ${by + 3}).entries.find(e => e.name === "Rozbierz").run(); 0`);
        await frames(20);
        check("'Rozbierz' returns 3 branches and 1 flax and the bed is gone", (await count(77)) === before.br + 3 && (await count(92)) === before.fi + 1 && (await ev(`Farming.buildingAt(${bx + 2}, ${by + 3})`)) === null, { br: await count(77), fi: await count(92) });
        const jr = await ev(`(function(){ Journal.evaluateGoals(); const g = Journal.GOALS.find(x => x.id === "bough"), n = Journal.GOALS.find(x => x.id === "bednight"); return { bough: !!g && !!Journal.recipeRef(g.recipe), night: !!n && n.after.join() === "bough", doneNight: !!$gameSystem._journal.done.bednight, doneBough: !!$gameSystem._journal.done.bough, old: !Journal.GOALS.some(x => x.id === "bedroll"), unique: new Set(Journal.GOALS.map(x => x.id)).size === Journal.GOALS.length }; })()`);
        check("the journal: 'Zrób leśne legowisko' and 'Prześpij noc na legowisku' exist and are done; the old hide-bedroll goal is gone", jr.bough && jr.night && jr.doneNight && jr.doneBough && jr.old && jr.unique, jr);
        console.log("console errors:", JSON.stringify(b.logs.filter(l => /EXC|rror/.test(l)).slice(-4)));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
