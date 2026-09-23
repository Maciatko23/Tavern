// The keys of the map: WASD walk, Q opens the build menu (E the food menu), Q / E close and switch them, in the hut only the furniture,
// the food menu shows what each dish gives (popup facts), greys out what would do nothing, eats and stays open; Journal tabs on Q / E.
const { launch, sleep } = require("./cdp.js");
const path = require("path");
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
        const waitMap = async id => { for (let i = 0; i < 100; i++) { if ((await ev("!SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name === 'Scene_Map' && SceneManager._scene._spriteset && $gameScreen.brightness() >= 250 && $gameMap.mapId() === " + id).catch(() => false))) return true; await sleep(300); } return false; };
        const setN = async (id, n) => { await ev(`$gameParty.gainItem($dataItems[${id}], ${n} - $gameParty.numItems($dataItems[${id}])); 0`); };
        // a real key: the browser's key code goes through Input.keyMapper
        const down = code => ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
        const up = code => ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
        const key = async (code, hold = 3) => { await down(code); await frames(hold); await up(code); await frames(4); };
        const K = { W: 87, A: 65, S: 83, D: 68, Q: 81, E: 69, R: 82, OK: 13, ESC: 27, J: 74 };
        const pop = async () => J("window.__pop.slice()");
        await ev("window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0");
        const state = () => J(`(function(){ const sc = SceneManager._scene, m = sc._farmMenu; return { open: !!$gameTemp._farmMenuOpen, kind: sc._farmKind, title: m._title, names: (m._entries || []).map(e => e.name), enabled: (m._entries || []).map(e => e.enabled !== false), index: m.index(),
            build: $gameTemp._buildMode ? $gameTemp._buildMode.type : null, flip: $gameTemp._buildMode ? $gameTemp._buildMode.flip : null, tip: !!(sc._farmTip.visible && sc._farmTip._entry === m.currentEntry()) }; })()`);
        const clearFood = async () => { await ev("$dataItems.forEach(it => { if (it && Survival.foodInfo(it)) $gameParty.gainItem(it, -$gameParty.numItems(it)); }); 0"); };

        // ---------------------------------------------------------------- the key table
        const map = await J("[87, 65, 83, 68, 81, 69, 82].map(c => Input.keyMapper[c])");
        check("W A S D are up / left / down / right; Q and E are the page keys (pageup / pagedown); R is flip", JSON.stringify(map) === JSON.stringify(["up", "left", "down", "right", "pageup", "pagedown", "flip"]), map);

        // ---------------------------------------------------------------- a meadow and a full bag
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 7 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a meadow", !!B, B);
        const { bx, by } = B;
        const IT = { planks: 80, nails: 88, stone: 64, iron: 86, hammer: 89, rope: 93 };
        for (const [id, n] of [[IT.planks, 60], [IT.nails, 60], [IT.stone, 40], [IT.iron, 10], [IT.hammer, 1], [IT.rope, 4], [62, 1]]) await setN(id, n);
        await clearFood();
        await ev(`$gamePlayer.locate(${bx + 4}, ${by + 3}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 5, ${by} - 2); $gameSystem.setStamina(300); 0`);
        await frames(20);

        // ---------------------------------------------------------------- WASD walk
        const pos = () => J("({ x: $gamePlayer._realX, y: $gamePlayer._realY, d: $gamePlayer.direction() })");
        let p0 = await pos();
        await key(K.D, 16); let p1 = await pos();
        check("D walks right", p1.x - p0.x > 0.5 && Math.abs(p1.y - p0.y) < 0.1 && p1.d === 6, { p0, p1 });
        await key(K.A, 16); let p2 = await pos();
        check("A walks left", p1.x - p2.x > 0.5 && Math.abs(p2.y - p1.y) < 0.1 && p2.d === 4, { p1, p2 });
        await key(K.S, 16); let p3 = await pos();
        check("S walks down", p3.y - p2.y > 0.5 && Math.abs(p3.x - p2.x) < 0.1 && p3.d === 2, { p2, p3 });
        await key(K.W, 16); let p4 = await pos();
        check("W walks up", p3.y - p4.y > 0.5 && Math.abs(p4.x - p3.x) < 0.1 && p4.d === 8, { p3, p4 });
        await down(K.D); await down(K.W); await frames(20); await up(K.D); await up(K.W); await frames(4);
        const p5 = await pos();
        check("W + D together walk diagonally (free movement, 8 directions)", p5.x - p4.x > 0.4 && p4.y - p5.y > 0.4, { p4, p5 });
        await ev(`$gamePlayer.locate(${bx + 4}, ${by + 3}); $gamePlayer.setDirection(8); 0`); await frames(6);

        // ---------------------------------------------------------------- Q: the build menu
        await key(K.Q);
        let st = await state();
        const expectBuild = await J(`Object.keys(Farming.BUILDINGS).filter(t => !Farming.BUILDINGS[t].noBuild && !Farming.BUILDINGS[t].indoorOnly && !Farming.BUILDINGS[t].instant).map(t => Farming.BUILDINGS[t].name)`);
        check("Q opens the build menu ('Budowa') with every real outdoor building (not the instant ones: tent/bucket/bedroll) and no 'Wróć' line", st.open && st.kind === "build" && st.title === "Budowa" && JSON.stringify(st.names) === JSON.stringify(expectBuild) && !st.names.includes("Wróć"), { open: st.open, kind: st.kind, title: st.title, n: st.names.length, want: expectBuild.length });
        check("the popup with the description shows for the highlighted building", st.tip);
        const indoorOnly = await J(`Object.keys(Farming.BUILDINGS).filter(t => Farming.BUILDINGS[t].indoorOnly).map(t => Farming.BUILDINGS[t].name)`);
        check("the indoor-only furniture is not on the outdoor list", indoorOnly.length > 0 && indoorOnly.every(n => !st.names.includes(n)), { indoorOnly });
        await key(K.S);
        st = await state();
        check("S moves the cursor down in the menu (WASD in menus)", st.index === 1, st.index);
        await key(K.Q);
        st = await state();
        check("Q again closes the menu", !st.open && st.kind === "", { open: st.open, kind: st.kind });
        await frames(6);
        check("...and the player can walk again", await ev("$gamePlayer.canMove()"));

        // OK on a building: the placer starts at the tile in front of the player
        await key(K.Q);
        st = await state();
        const first = st.enabled.indexOf(true);
        for (let i = 0; i < first; i++) await key(K.S);
        await key(K.OK);
        await frames(8);
        st = await state();
        const cur = await J("({ x: $gameTemp._buildMode && $gameTemp._buildMode.x, y: $gameTemp._buildMode && $gameTemp._buildMode.y, tx: $gameMap.roundXWithDirection($gamePlayer.x, $gamePlayer.direction()), ty: $gameMap.roundYWithDirection($gamePlayer.y, $gamePlayer.direction()) })");
        check("choosing a building starts placing it, menu closed", !st.open && !!st.build, st);
        check("the placing cursor starts near the tile in front of the player", Math.abs(cur.x - cur.tx) <= 1 && Math.abs(cur.y - cur.ty) <= 1, cur);
        await ev("$gameTemp._buildMode.wait = 0; 0");
        const type = st.build;
        if (type !== "fence") {
            await key(K.Q);
            const f1 = await state();
            check("in placing mode Q mirrors the building (and opens no menu)", f1.flip === true && !f1.open, f1);
            await key(K.E);
            const f2 = await state();
            check("...and E mirrors it back", f2.flip === false && !f2.open, f2);
            await key(K.R);
            check("...R too", (await state()).flip === true);
        } else check("(the first building is a fence: no mirroring to test)", true);
        await key(K.ESC);
        await frames(8);
        st = await state();
        check("Esc leaves placing mode", st.build === null && !st.open, st);
        await frames(6);

        // ---------------------------------------------------------------- E with nothing to eat
        await ev("window.__pop.length = 0; 0");
        await key(K.E);
        st = await state();
        check("E with no food in the bag opens nothing and says so over the player", !st.open && (await pop()).includes("Nie masz nic do jedzenia"), await pop());

        // ---------------------------------------------------------------- the food menu
        // 71 potato, 83 bread (sated), 130 gulasz (sated + warm, fed + water), 81 beer (warm)
        const FOODS = [[71, 3], [81, 1], [83, 2], [130, 1]];
        for (const [id, n] of FOODS) await setN(id, n);
        await ev("Needs.setEnabled(true); Needs.state().food = 40; Needs.state().water = 60; $gameSystem.setStamina(40); 0");
        await frames(4);
        await key(K.E);
        st = await state();
        check("E opens the food menu ('Jedzenie') with the four dishes in the bag, in item order", st.open && st.kind === "food" && st.title === "Jedzenie" && JSON.stringify(st.names) === JSON.stringify(["Ziemniak", "Piwo", "Chleb", "Gulasz"]), st);
        check("the popup shows for the highlighted dish", st.tip);
        const rights = await J("SceneManager._scene._farmMenu._entries.map(e => e.right)");
        check("each line shows how many you have", JSON.stringify(rights) === JSON.stringify(["×3", "×1", "×2", "×1"]), rights);
        const gul = await J("(function(){ const m = SceneManager._scene._farmMenu; const e = m._entries.find(e => e.name === 'Gulasz'); return { facts: e.facts, tip: e.tip, icon: e.icon, enabled: e.enabled }; })()");
        check("Gulasz: stamina, fullness, water and both buffs are listed", gul.facts.includes("Wytrzymałość: +65") && gul.facts.includes("Sytość: +62") && gul.facts.includes("Nawodnienie: +14")
            && gul.facts.some(f => /^Najedzony \(7 godz\.\): prace kosztują 15% mniej sił$/.test(f)) && gul.facts.some(f => /^Rozgrzany \(4 godz\.\): /.test(f)), gul);
        check("...with the item's own description as the text and its icon", gul.tip.length > 10 && gul.icon === 392, { icon: gul.icon, tip: gul.tip });
        // the popup window really paints the facts
        for (let i = 0; i < 3; i++) await key(K.S);
        await frames(4);
        st = await state();
        const ops = await J("SceneManager._scene._farmTip._ops.map(o => o.kind + ':' + (o.text || ''))");
        check("the popup window paints the name, the description and the fact lines for the highlighted dish", st.index === 3 && ops[0] === "name:Gulasz" && ops.filter(o => o.startsWith("fact:")).length >= 4, ops);
        // a picture of it for the eyes
        await b.shot(path.join(__dirname, "keys_food.png"));
        for (let i = 0; i < 3; i++) await key(K.W);
        st = await state();
        check("W moves the cursor up", st.index === 0, st.index);

        // eating: potato (+6 stamina, +6 fullness), the menu stays open on the same line
        const before = await J("({ st: $gameSystem.stamina(), food: Needs.state().food, n: $gameParty.numItems($dataItems[71]), meals: Needs.state().meals || 0 })");
        await key(K.OK);
        await frames(4);
        st = await state();
        const after = await J("({ st: $gameSystem.stamina(), food: Needs.state().food, n: $gameParty.numItems($dataItems[71]), meals: Needs.state().meals || 0 })");
        check("OK eats the potato: one less, stamina and fullness up, one more meal", after.n === before.n - 1 && after.st === before.st + 6 && after.food > before.food && after.meals === before.meals + 1, { before, after });
        check("...the food menu stays open on the same line with the new count", st.open && st.kind === "food" && st.index === 0 && (await J("SceneManager._scene._farmMenu._entries[0].right")) === "×2", st);
        check("...and the popup over the player tells what happened ('Zjadłeś: Ziemniak')", (await pop()).some(t => /^Zjadłeś: Ziemniak/.test(t)), await pop());
        await key(K.OK); await key(K.OK);
        st = await state();
        check("the last potato eaten: its line is gone, the menu stays with the other dishes", st.open && !st.names.includes("Ziemniak") && st.names.length === 3, st);
        // the second line: eat the beer, index stays, the list shrinks
        await key(K.OK);
        st = await state();
        check("eating the only beer removes its line, the cursor stays in the list", st.open && !st.names.includes("Piwo") && st.index === 0 && st.names[0] === "Chleb", st);
        check("...it gave the 'Rozgrzany' buff", await ev("$gameSystem.hasBuff('warm')"));

        // greyed out when it would do nothing
        await ev("Needs.state().food = 100; Needs.state().water = 100; $gameSystem.setStamina($gameSystem.maxStamina()); $gameSystem.buffs().sated = 0; delete $gameSystem.buffs().sated; 0");
        await key(K.Q);   // switch to the build menu and back to refresh the list
        st = await state();
        check("Q while the food menu is open switches to the build menu", st.open && st.kind === "build", st.kind);
        await key(K.E);
        st = await state();
        check("E while the build menu is open switches back to the food menu", st.open && st.kind === "food", st.kind);
        await ev("$gameParty.gainItem($dataItems[71], 2); 0");
        await key(K.E); await frames(4);   // closes
        await key(K.E); await frames(4);   // opens fresh with the potato
        st = await state();
        const potato = await J("(function(){ const e = SceneManager._scene._farmMenu._entries.find(e => e.name === 'Ziemniak'); return e && { enabled: e.enabled, tip: e.tip, facts: e.facts }; })()");
        check("a potato at full strength, fed and not thirsty is greyed out and the popup says why", !!potato && potato.enabled === false && /Teraz nic by ci to nie dało: masz pełnię sił, nie jesteś głodny ani spragniony\./.test(potato.tip), potato);
        const bread = await J("(function(){ const e = SceneManager._scene._farmMenu._entries.find(e => e.name === 'Chleb'); return e && { enabled: e.enabled, tip: e.tip, facts: e.facts }; })()");
        check("bread (gives a buff) is still on offer at full strength", !!bread && bread.enabled === true && bread.facts.some(f => /^Najedzony \(3 godz\.\)/.test(f)), bread);
        // OK on a greyed line changes nothing
        const nBefore = await ev("$gameParty.numItems($dataItems[71])");
        await key(K.OK);
        check("OK on a greyed-out dish eats nothing", (await ev("$gameParty.numItems($dataItems[71])")) === nBefore && (await state()).open);
        // hunger makes it eatable again
        await ev("Needs.state().food = 30; 0");
        await key(K.E); await key(K.E);
        const potato2 = await J("(function(){ const e = SceneManager._scene._farmMenu._entries.find(e => e.name === 'Ziemniak'); return e && e.enabled; })()");
        check("...and when hunger asks for it, the potato is on again", potato2 === true);
        await key(K.E); await frames(4);
        check("E closes the food menu", !(await state()).open);

        // ---------------------------------------------------------------- other menus ignore Q and E
        await ev(`SceneManager._scene.openFarmMenu("Testowe menu", [{ name: "Jedno", run: null }, { name: "Drugie", run: null }]); 0`);
        await frames(4);
        await key(K.Q); await key(K.E);
        st = await state();
        check("a plot / station menu ignores Q and E (it stays open, unchanged)", st.open && st.title === "Testowe menu" && st.kind === "", st);
        await key(K.ESC); await frames(6);
        check("...and Esc closes it", !(await state()).open);

        // ---------------------------------------------------------------- blocked when the game is busy
        await ev("$gameMessage.add('Coś się dzieje.'); 0");
        await frames(3);
        await key(K.Q); await key(K.E);
        check("Q and E do nothing while a message is on", !(await state()).open);
        await ev("$gameMessage.clear(); 0");
        await frames(6);

        // ---------------------------------------------------------------- Journal: Q / E turn the tabs
        await key(K.J);
        await frames(10);
        check("J opens the journal", await ev("SceneManager._scene.constructor.name === 'Scene_Journal'"));
        const tab0 = await ev("SceneManager._scene._tab");
        await key(K.E);
        const tab1 = await ev("SceneManager._scene._tab");
        await key(K.Q);
        const tab2 = await ev("SceneManager._scene._tab");
        check("in the journal E goes to the next tab and Q back", tab1 === tab0 + 1 && tab2 === tab0, { tab0, tab1, tab2 });
        await key(K.ESC);
        await frames(20);
        check("back on the map", await ev("SceneManager._scene.constructor.name === 'Scene_Map'"));

        // ---------------------------------------------------------------- O = OK, P = cancel (instead of Z and X)
        const opz = await J("[79, 80, 90, 88, 13, 32, 27].map(c => Input.keyMapper[c] || null)");
        check("O is OK and P is cancel (escape); Z and X are free now; Enter, Space and Esc still work", JSON.stringify(opz) === JSON.stringify(["ok", "escape", null, null, "ok", "ok", "escape"]), opz);
        await key(88); await key(90);
        check("Z and X do nothing any more (no menu, nothing opened)", !(await state()).open);
        await key(K.Q);
        check("(Q opens the build menu)", (await state()).open);
        await key(80);
        check("P closes the menu (cancel)", !(await state()).open);
        await key(K.Q);
        let st2 = await state();
        const first2 = st2.enabled.indexOf(true);
        for (let i = 0; i < first2; i++) await key(K.S);
        await key(79);
        await frames(8);
        st2 = await state();
        check("O chooses the building (OK): placing starts", !st2.open && !!st2.build, st2);
        await ev("$gameTemp._buildMode.wait = 0; 0");
        await key(80);
        await frames(8);
        st2 = await state();
        check("P leaves placing mode (cancel)", st2.build === null && !st2.open, st2);
        await frames(6);
        // O on the map is the action button: with a food dish in the bag, E then O eats it
        await ev("$gameParty.gainItem($dataItems[71], 1); Needs.state().food = 30; 0");
        const potBefore = await ev("$gameParty.numItems($dataItems[71])");
        await key(K.E); await key(79);
        check("E then O eats the highlighted dish", (await ev("$gameParty.numItems($dataItems[71])")) === potBefore - 1);
        await key(80);
        check("...and P closes the food menu", !(await state()).open);

        // ---------------------------------------------------------------- the hut: only the furniture
        await ev(`$gamePlayer.reserveTransfer(100, 3, 4, 8, 0); 0`);
        check("(in the hut interior)", await waitMap(100));
        await frames(20);
        await key(K.Q);
        st = await state();
        const expectHut = await J(`Object.keys(Farming.BUILDINGS).filter(t => !Farming.BUILDINGS[t].noBuild && Farming.BUILDINGS[t].indoor).map(t => Farming.BUILDINGS[t].name)`);
        check("Q in the hut opens 'Wyposaż chatkę' with only the indoor things", st.open && st.kind === "build" && st.title === "Wyposaż chatkę" && JSON.stringify(st.names) === JSON.stringify(expectHut) && expectHut.length >= 2, { title: st.title, names: st.names, want: expectHut });
        await key(K.Q);
        check("...Q closes it", !(await state()).open);
        await ev(`$gamePlayer.reserveTransfer(3, ${bx + 4}, ${by + 3}, 8, 0); 0`);
        await waitMap(3);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
