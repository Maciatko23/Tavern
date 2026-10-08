// Hunger and thirst: meters, decay, costs, ceiling, eating, drinking, the waterskin, the HUD, save / load.
const kit = require("./lib/kit.js");

kit.test({ width: 2560, height: 1440, dpr: 0.5, evalTimeout: 25000 }, async t => {
    // (Needs on - it is what is tested; no storm plan switched off either)
    await t.newGame({ map: 3, x: 22, y: 14, hour: 10, calm: false, needsOff: false });
    await t.eval("if (window.Hunting && Hunting.RAID) Hunting.RAID.perHour = 0; $gameScreen.clearWeather(); 0");
    const ev = e => t.eval(e);
    const near = (a, b2, tol) => Math.abs(a - b2) <= tol;
    // waits till no swing, lock, timer or fade is left
    const settle = async () => { await t.frames(6); const r = await ev(`new Promise(res => { let n = 0; const iv = setInterval(() => { n++; if (!$gamePlayer.isToolSwinging() && !($gameTemp._farmLock > 0) && !($gameTemp._farmTimers && $gameTemp._farmTimers.length) && $gameScreen.brightness() >= 250) { clearInterval(iv); res("ok"); } else if (n > 300) { clearInterval(iv); res(JSON.stringify({ sw: $gamePlayer.isToolSwinging(), lock: $gameTemp._farmLock, timers: ($gameTemp._farmTimers || []).length, bright: $gameScreen.brightness(), scene: SceneManager._scene.constructor.name, msg: $gameMessage.isBusy() })); } }, 20); })`); if (r !== "ok") console.log("SETTLE TIMEOUT", r); await t.frames(4); };
    const popups = () => t.popups({ gains: true });
    const clearPopups = () => t.popups({ clear: true });
    const set = (f, w) => ev(`(function(){ const n = Needs.state(); n.food = ${f}; n.water = ${w}; const l = Needs.levels(); n.lf = l.food; n.lw = l.water; $gameSystem.setStamina(100); })()`);
    const food = () => ev("Needs.state().food"), water = () => ev("Needs.state().water");
    // the stamina really taken from the bar by one action of nominal cost c (all other cost factors are off)
    const spend = async c => { await ev("$gameSystem._buffs = {}; 0"); const before = await ev("$gameSystem.stamina()"); await ev(`$gameSystem.trySpendStamina(${c})`); return before - (await ev("$gameSystem.stamina()")); };
    const drinkKey = async after => { await t.press("drink"); if (after) await t.frames(after); };
    await clearPopups();

    // ================= 1. data and HUD =================
    const item = await ev("(function(){ const i = $dataItems[129]; return i ? [i.name, i.iconIndex, i.itypeId, i.consumable, i.note] : null; })()");
    t.check("item 129 Bukłak: an ordinary item, not consumed, note <Drink:35>", JSON.stringify(item) === JSON.stringify(["Bukłak", 389, 1, false, "<Drink:35><Weight:2>"]), item);
    const icons = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); const out = []; for (const i of [389, 390, 391]) { let n = 0; const d = bmp.context.getImageData((i % 16) * 32, Math.floor(i / 16) * 32, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; out.push(n); } res(out); }; chk(); })`);
    t.check("icons 389 (flask), 390 (food), 391 (water drop) are drawn", icons.every(n => n > 200), icons);
    const st0 = await ev("Needs.state()");
    t.check("a new game starts at about 90 / 90", near(st0.food, 90, 1) && near(st0.water, 90, 1), st0);
    const hud = await ev("(function(){ const s = SceneManager._scene; const bars = s._needsBars; const buffs = s._buffIcons; return { bars: !!bars && !!bars.parent, dy: bars && buffs ? Math.round(buffs.y - bars.y) : null, visible: !!bars && bars.visible }; })()");
    t.check("two bars sit under the stamina gauge, the load under those, and the buff icons one row below that", hud.bars && hud.visible && hud.dy === 3 * 23, hud);   // (UIStyle.HUD.step)

    // ================= 2. the meters run down =================
    await set(100, 100);
    await ev("$gameSystem.advanceDayNight(10); 0");
    t.check("10 hours awake: food 100 -> 84, water 100 -> 75", near(await food(), 84, 0.5) && near(await water(), 75, 0.5), { f: await food(), w: await water() });
    await set(100, 100);
    await t.setHour(22);
    await ev("$gameSystem.sleepUntilHour(7); 0");
    await t.dismiss();   // the day summary of the night (2026-10-07: not OK presses - one pressed while the summary still waited for the
    // fade-in reached the map; with fewer things on the ground it opened the ground menu there, which blocked G and the drinks after)
    // (2026-10-08: under the full run's load the ground menu could still open a moment later - wait till the map is quiet: no summary,
    // no message, no ground menu, 20 frames in a row)
    await ev(`new Promise(res => { let calm = 0, n = 0; const iv = setInterval(() => { n++; const s = SceneManager._scene;
        if ($gameTemp._farmMenuOpen && s && s.closeFarmMenu) { s.closeFarmMenu(); calm = 0; }
        else if (!(s instanceof Scene_Map) || SceneManager.isSceneChanging() || $gameMessage.isBusy() || $gameTemp._pendingSummary) calm = 0;
        else calm++;
        if (calm >= 20 || n > 600) { clearInterval(iv); res(calm); } }, 16); })`);
    t.check("9 hours of sleep cost half: food -7.2, water -11.3", near(await food(), 92.8, 0.5) && near(await water(), 88.7, 0.5), { f: await food(), w: await water() });
    await set(100, 100);
    await ev("$gameSystem.trySpendStamina(10); 0");
    t.check("10 stamina of work: food -0.4 and water -0.7 on top", near(await food(), 99.6, 0.05) && near(await water(), 99.3, 0.05), { f: await food(), w: await water() });
    // the seasons
    const dryDay = await ev("(function(){ for (let d = 30; d < 56; d++) if (!Survival.weatherPlan(d)) return d; return 40; })()");   // a summer day without a rain plan
    await ev(`$gameSystem._dayNightDay = ${dryDay}; $gameSystem._weatherOwn = false; $gameScreen.clearWeather(); 0`); await t.frames(45);   // (Survival's weather plan of the old day must not start a rain now)
    await set(100, 100);   // summer
    await ev("$gameSystem.advanceDayNight(4); 0");
    t.check("summer: thirst grows 25% faster (4 h: -12.5)", near(await water(), 87.5, 0.5), await water());
    await ev("$gameSystem._dayNightDay = 90; $gameSystem._weatherOwn = false; $gameScreen.clearWeather(); 0"); await t.frames(45);
    await set(100, 100);   // winter
    await ev("$gameSystem.advanceDayNight(4); 0");
    t.check("winter: hunger grows 25% faster (4 h: -8)", near(await food(), 92, 0.5), await food());
    await t.setDay(3);
    // rain
    await set(50, 50);
    await ev("$gameSystem._weatherOwn = false; $gameScreen.changeWeather('rain', 5, 0); 0"); await t.frames(10);
    await ev("$gameSystem.advanceDayNight(4); 0");
    t.check("in the rain outdoors the water rises instead (4 h: +6)", near(await water(), 56, 0.6) && (await food()) < 50, { w: await water(), f: await food() });
    await ev("$gameScreen.clearWeather(); 0"); await t.frames(20);

    // ================= 3. what it costs =================
    await set(100, 100);
    const c0 = await spend(10);
    t.check("full: an action of 10 costs 10", near(c0, 10, 0.01), c0);
    await set(40, 100);
    t.check("Głodny (food 40): x1.15", near(await spend(10), 11.5, 0.05));
    await set(20, 100);
    t.check("Bardzo głodny (food 20): x1.35", near(await spend(10), 13.5, 0.05));
    await set(0, 100);
    t.check("Głodujesz (food 0): x1.6", near(await spend(10), 16, 0.05));
    await set(100, 40);
    t.check("Spragniony (water 40): x1.2", near(await spend(10), 12, 0.05));
    await set(100, 20);
    t.check("Odwodniony (water 20): x1.5", near(await spend(10), 15, 0.05));
    await set(100, 0);
    t.check("Wysuszony (water 0): x2", near(await spend(10), 20, 0.05));
    await set(40, 40);
    t.check("hungry AND thirsty multiply: 1.15 x 1.2 = 1.38", near(await spend(10), 13.8, 0.05));
    // the ceiling
    await set(100, 100);
    t.check("full meters: no ceiling (100)", (await ev("$gameSystem.stamina()")) === 100);
    await set(100, 20);
    t.check("Odwodniony: the stamina ceiling is 70", (await ev("$gameSystem.stamina()")) === 70 && (await ev("Math.round($gameSystem.staminaRatio() * 100)")) === 70);
    await ev("$gameSystem.setStamina(100); $gameSystem.changeStamina(15); 0");
    t.check("...and a rest cannot lift it above the ceiling", (await ev("$gameSystem.stamina()")) === 70);
    await set(100, 0);
    t.check("Wysuszony: ceiling 40", (await ev("$gameSystem.stamina()")) === 40);
    await set(0, 100);
    t.check("Głodujesz: ceiling 55", (await ev("$gameSystem.stamina()")) === 55);
    await set(100, 100);
    // starvation drains strength by the hour
    await set(0, 0);
    await ev("$gameSystem.setStamina(30); $gameSystem.setStamina(30); 0");
    const drainBefore = await ev("$gameSystem.stamina()");
    await ev("$gameSystem.advanceDayNight(2); 0");
    t.check("starving and parched: the stamina drains (2 h: -6)", near(drainBefore - (await ev("$gameSystem.stamina()")), 6, 0.6), { drainBefore, now: await ev("$gameSystem.stamina()") });
    // a sleeping night does not drain it (half the decay, no drain)
    await set(100, 100);

    // ================= 4. warnings =================
    await set(100, 100);
    await clearPopups();
    await ev("Needs.state().water = 52; 0");
    await ev("$gameSystem.advanceDayNight(2); 0"); await t.frames(6);
    t.check("crossing 50: popup 'Chce ci się pić' (water icon)", (await popups()).includes("Chce ci się pić"), await popups());
    await clearPopups();
    await ev("Needs.state().water = 27; 0");
    await ev("$gameSystem.advanceDayNight(2); 0"); await t.frames(6);
    t.check("crossing 25: 'Odwodnienie! Napij się wody'", (await popups()).some(p => /Odwodnienie/.test(p)), await popups());
    await clearPopups();
    await ev("Needs.state().water = 1; 0");
    await ev("$gameSystem.advanceDayNight(2); 0"); await t.frames(6);
    t.check("at 0: 'Umierasz z pragnienia!'", (await popups()).some(p => /Umierasz z pragnienia/.test(p)), await popups());
    await set(100, 100); await clearPopups();
    await ev("Needs.state().food = 27; 0");
    await ev("$gameSystem.advanceDayNight(2); 0"); await t.frames(6);
    t.check("hunger warns too: 'Bardzo głodny' below 25", (await popups()).some(p => /Bardzo głodny/.test(p)), await popups());
    await clearPopups();
    await ev("$gameSystem.advanceDayNight(0.1); 0"); await t.frames(6);
    t.check("the same warning is not repeated every tick", (await popups()).length === 0, await popups());

    // ================= 5. eating =================
    await set(30, 100);
    const can = await ev("$gameParty.gainItem($dataItems[95], 2); $gameParty.canUse($dataItems[95])");
    t.check("hungry with full stamina: a roast can be eaten (Survival alone would refuse)", can === true);
    await ev("$gameParty.members()[0].useItem($dataItems[95]); 0");
    t.check("roast meat: food 30 -> 75", near(await food(), 75, 0.01), await food());
    await set(100, 100);
    t.check("full stamina, food and water: it cannot be eaten", (await ev("$gameParty.canUse($dataItems[95])")) === false);
    await set(70, 60);
    await t.give(109, 1); await ev("$gameParty.members()[0].useItem($dataItems[109]); 0");
    t.check("soup gives food AND water (+55 / +20)", near(await food(), 100, 0.01) && near(await water(), 80, 0.01), { f: await food(), w: await water() });
    await set(50, 50); await t.give(123, 1);
    await ev("$gameParty.members()[0].useItem($dataItems[123]); 0");
    t.check("milk quenches thirst first (+30 water, +8 food)", near(await water(), 80, 0.01) && near(await food(), 58, 0.01), { f: await food(), w: await water() });
    await t.give(83, 1);

    // ================= 6. water: the pond, the well, the waterskin =================
    await set(100, 40);
    const menu = await ev("Farming.waterMenu().entries.map(e => e.name + (e.enabled === false ? '(x)' : ''))");
    t.check("the pond menu: fishing, drink, fill the flask, fill the can, fill the bucket", menu.join() === "Zarzuć wędkę(x),Napij się,Napełnij bukłak(x),Napełnij konewkę(x),Napełnij wiadro(x)", menu);
    await clearPopups();
    const dr = await ev("Farming.drink()");
    await settle();
    t.check("Napij się: water 40 -> 80", dr === true && near(await water(), 80, 0.6), await water());
    t.check("...with a popup 'Nawodnienie +40' (water icon)", (await popups()).some(p => /Nawodnienie \+40/.test(p)), await popups());
    await set(100, 100); await clearPopups();
    t.check("not thirsty and not tired: 'Nie chce ci się pić', nothing happens", (await ev("Farming.drink()")) === false && (await popups()).includes("Nie chce ci się pić") && (await water()) === 100);
    // no flask yet
    await clearPopups();
    await drinkKey();
    t.check("G without a flask: popup 'Potrzebujesz bukłaka'", (await popups()).includes("Potrzebujesz bukłaka"), await popups());
    // make it by hand: a tanned hide + 3 flax
    const rec = await ev("Farming.HAND_RECIPES.find(r => r.id === 'waterskin').inputs.map(([i, n]) => i + 'x' + n).join()");
    t.check("the hand menu makes a flask from a tanned hide and 3 flax", rec === "97x1,92x3", rec);
    await t.give(97, 1); await t.give(92, 3);
    await ev("$gameSystem.setStamina(100); 0");
    const made = await ev("Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === 'waterskin'))");
    await settle();
    t.check("made: the flask is in the bag, empty (0/4)", made === true && (await t.count(129)) === 1 && (await ev("Needs.skinCharges()")) === 0);
    t.check("a second flask is refused (unique)", (await ev("Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === 'waterskin'))")) === false);
    await set(100, 40); await clearPopups();
    await drinkKey();
    t.check("G with an empty flask: 'Bukłak jest pusty'", (await popups()).includes("Bukłak jest pusty"), await popups());
    const fill = await ev("Farming.fillSkin()");
    await settle();
    t.check("filled at the water: 4/4", fill === true && (await ev("Needs.skinCharges()")) === 4);
    const menu2 = await ev("Farming.waterMenu().entries.find(e => e.name === 'Napełnij bukłak')");
    t.check("a full flask cannot be filled again (the line is dimmed, shows 4/4)", menu2.enabled === false && menu2.right === "4/4", menu2);
    await drinkKey(3);
    t.check("G: a sip of 35 (water 40 -> 75), the flask 3/4", near(await water(), 75, 0.6) && (await ev("Needs.skinCharges()")) === 3, { w: await water(), c: await ev("Needs.skinCharges()") });
    await t.frames(30);
    await set(100, 100);
    await drinkKey(3);
    t.check("not thirsty: G does not waste a sip", (await ev("Needs.skinCharges()")) === 3);
    // from the item menu
    await set(100, 30);
    t.check("item menu: the flask can be used while thirsty", (await ev("$gameParty.canUse($dataItems[129])")) === true);
    await set(100, 100);
    t.check("...and not when the thirst is quenched", (await ev("$gameParty.canUse($dataItems[129])")) === false);
    await set(100, 30);
    await ev("$gameParty.members()[0].useItem($dataItems[129]); 0");
    t.check("used from the menu: water 30 -> 65, 2/4 left, the flask stays in the bag", near(await water(), 65, 0.01) && (await ev("Needs.skinCharges()")) === 2 && (await t.count(129)) === 1, { w: await water() });
    const drawn = await ev(`(function(){ const list = new Window_ItemList(new Rectangle(0, 0, 500, 300)); let seen = ""; list.drawText = function(s) { seen = s; }; list.drawItemNumber($dataItems[129], 0, 0, 200); const w = new Window_Help(new Rectangle(0, 0, 700, 130)); w.setItem($dataItems[129]); return [seen, w._text]; })()`);
    t.check("the item list shows '2/4' and the help says how many sips are left", drawn[0] === "2/4" && /Woda: 2 z 4 łyków/.test(drawn[1]), drawn);

    // ================= 7. switch off, journal, save =================
    await set(0, 0);
    await ev("Needs.setEnabled(false); $gameSystem.setStamina(100); 0");
    t.check("switched off: no cost factor and no ceiling (Survival.js as before)", near(await spend(10), 10, 0.01) && (await ev("$gameSystem.stamina()")) === 90);
    await ev("Needs.setEnabled(true); 0");
    const jr = await ev(`(function(){ const d = Journal.GOALS.find(g => g.id === "drink"), s = Journal.GOALS.find(g => g.id === "skin"); Journal.evaluateGoals(); return { drink: !!d, skin: !!s && !!Journal.recipeRef(s.recipe), doneDrink: !!$gameSystem._journal.done.drink, doneSkin: !!$gameSystem._journal.done.skin, unique: new Set(Journal.GOALS.map(g => g.id)).size === Journal.GOALS.length }; })()`);
    t.check("the journal: 'Napij się wody' and 'Zrób bukłak' exist (valid recipe) and are done after the above", jr.drink && jr.skin && jr.doneDrink && jr.doneSkin && jr.unique, jr);
    await set(63, 41);
    await ev("Needs.state().skin = 3; 0");
    const round = await ev(`(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); DataManager.createGameObjects(); DataManager.extractSaveContents(JsonEx.parse(json)); const n = $gameSystem._needs; return [Math.round(n.food), Math.round(n.water), n.skin]; })()`);
    t.check("the meters and the flask survive a save / load", JSON.stringify(round) === JSON.stringify([63, 41, 3]), round);

    // ================= 8. pictures =================
    await ev("$gamePlayer.reserveTransfer(3, 22, 14, 2, 0); 0");
    await set(38, 18);
    await ev("Needs.state().skin = 2; 0");
    await t.frames(60);
    await t.shot("needs/hud_low.png");
    await set(0, 0);
    await t.frames(50);
    await t.shot("needs/hud_empty.png");
    await set(63, 41);
    await ev("SceneManager.push(Scene_Menu); 0");
    await t.frames(40);
    await t.shot("needs/menu_card.png");
    // ---- the signals (2026-09-26): below 20 the hero says it (a bubble; not again within 2 game hours); below 10 he walks slower
    await ev("SceneManager.pop(); 0");
    await t.frames(40);
    const bubble = await t.json(`(function(){ Needs.setEnabled(true); const n = Needs.state(); n.food = 80; n.water = 15; n.nagAt = null; SpeechBubbles.barks.length = 0; Needs.nag();
        const first = SpeechBubbles.barks.map(b => b.text); Needs.nag(); const again = SpeechBubbles.barks.length;
        $gameSystem.advanceDayNight(2.2); Needs.state().water = 15; Needs.nag(); return { first, again, later: SpeechBubbles.barks.length }; })()`);
    t.check("thirsty below 20: he says so in a bubble ('Muszę się czegoś napić...'), not again at once, again after 2 hours",
        bubble.first.length === 1 && /napić/.test(bubble.first[0]) && bubble.again === 1 && bubble.later >= 2, bubble);
    const slow = await t.json(`(function(){ const n = Needs.state(); n.food = 80; n.water = 50; const d0 = $gamePlayer.distancePerFrame(); n.water = 5; const d1 = $gamePlayer.distancePerFrame(); n.nagAt = null; SpeechBubbles.barks.length = 0; Needs.nag(); return { ratio: +(d1 / d0).toFixed(3), text: SpeechBubbles.barks.map(b => b.text)[0] }; })()`);
    t.check("below 10: he walks slower (x0.85) and says his head is spinning", Math.abs(slow.ratio - 0.85) < 0.01 && /Kręci mi się w głowie/.test(slow.text || ""), slow);
    await t.frames(20);
    await t.shot("needs/needs_bubble.png");
    await set(63, 41);
});
