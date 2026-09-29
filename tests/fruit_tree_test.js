// Wild apple / pear trees (ChoppableTree.js): sway like any other tree, fruit while in season,
// picking fruit (not chopping) is the only thing the action button does while it has fruit, chopping
// only works once it is bare, fruit regrows after enough days back in season, out-of-season trees
// start bare. Also the new items (139 apples, 140 pears) and their art.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const setDay = day => ev(`(function(){ $gameSystem._dayNightDay = ${day}; $gameSystem.setDayNightHour(12); $gameMap.events().forEach(e => e.refresh()); return $gameSystem.dayNightDay(); })()`);
        const seasonOf = day => ev(`Farming.seasonOf(${day})`);
        const press = async () => { await ev(`Input._currentState.ok = true; Input._latestButton = 'ok'; Input._pressedTime = 0; 0`); await frames(4); await ev(`Input._currentState.ok = false; 0`); await frames(6); };
        // the real O key through the browser (normal mode: O is the action key - Combat.js maps it to "ok")
        const keyO = async () => {
            const k = { windowsVirtualKeyCode: 79, nativeVirtualKeyCode: 79, code: "KeyO", key: "o" };
            await b.send("Input.dispatchKeyEvent", Object.assign({ type: "rawKeyDown" }, k)); await frames(4);
            await b.send("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, k)); await frames(6);
        };
        const treeState = id => J(`(function(){ const e = $gameMap.event(${id}); const page = e._pageIndex; const on = ch => $gameSelfSwitches.value([3, ${id}, ch]);
            return { page, name: e.characterName ? e.characterName() : "", C: on("C"), A: on("A"), B: on("B") }; })()`);
        // the hero on a free tile beside the tree, facing it (below it first). The trees were moved on Map003 (by 2026-09-23: apple
        // 8,13 -> 20,15, pear 9,13 -> 19,16) and the old fixed spot (8,14) faced nothing, so the press started no event.
        const standBy = id => J(`(function(){ const e = $gameMap.event(${id});
            for (const [dx, dy, d] of [[0, 1, 8], [-1, 0, 6], [1, 0, 4], [0, -1, 2]]) {
                const x = e.x + dx, y = e.y + dy;
                if (!$gameMap.isValid(x, y) || ![2, 4, 6, 8].some(k => $gameMap.isPassable(x, y, k))) continue;
                if ($gameMap.eventsXy(x, y).some(o => o !== e && o.isNormalPriority() && !o.isThrough())) continue;
                $gamePlayer.locate(x, y); $gamePlayer.setDirection(d); $gameMap.setDisplayPos(x - 10, y - 7); return [x, y, d];
            }
            return null; })()`);

        // ---------------------------------------------------------------- 1. the items and their art
        const items = await J("[139, 140].map(id => { const it = $dataItems[id]; return [it.name, it.iconIndex, it.note]; })");
        check("139 Dzikie jabłka / 140 Dzikie gruszki exist with <Food> notes and their own icons", items[0][0] === "Dzikie jabłka" && items[0][1] === 401 && /water=18/.test(items[0][2]) && items[1][0] === "Dzikie gruszki" && items[1][1] === 402 && /water=20/.test(items[1][2]), items);
        for (const name of ["!$Tree_Apple", "!$Tree_Pear", "!$Tree_FruitBare"]) {
            const info = await ev(`new Promise(res => { const bmp = ImageManager.loadCharacter(${JSON.stringify(name)}); bmp.addLoadListener(() => { const w = bmp.width/3, h = bmp.height/4; const cells = []; for (let cy=0; cy<4; cy++) for (let cx=0; cx<3; cx++) { const d = bmp.context.getImageData(cx*w, cy*h, w, h).data; let s=0; for (let i=0;i<d.length;i+=4) s=(s*31+d[i]+d[i+1]*3+d[i+2]*7+d[i+3])%1000003; cells.push(s); } res({ w, h, same: new Set(cells).size===1, hasPixels: d0(bmp) }); function d0(bmp){ const d=bmp.context.getImageData(0,0,bmp.width,bmp.height).data; for(let i=3;i<d.length;i+=4) if(d[i]>0) return true; return false; } }); })`);
            check(name + ": a 3x4 sheet of 12 identical cells with real pixels", info.same && info.hasPixels, info);
        }
        // ---------------------------------------------------------------- 2. in season: starts fruiting, picking gives fruit and bares it
        // a day that lands in the configured fruiting window (Lato=1..Jesień=2, i.e. day 29-84 with 28-day seasons)
        await setDay(40);
        const seasonNow = await seasonOf(40);
        check("day 40 falls in the fruiting season (Lato or Jesień)", seasonNow === "Lato" || seasonNow === "Jesień", seasonNow);
        await ev(`$gameSystem.setStamina(300); 0`);
        let st = await treeState(143);
        check("apple tree (in season, never picked): starts on the fruiting page", st.page === 0 && !st.C, st);
        const before139 = await count(139);
        const appleSpot = await standBy(143); await frames(6);
        if (!appleSpot) console.log("NOTE no free tile beside the apple tree");
        await press();
        await frames(10);
        const after139 = await count(139);
        st = await treeState(143);
        check("action button on a fruiting tree picks fruit (2-4 apples), not chop: no swing happened", after139 > before139 && after139 - before139 <= 4 && st.C === true && st.page === 1, { before139, after139, st });

        // ---------------------------------------------------------------- 3. once bare, the SAME action now chops it like an ordinary tree
        await ev(`$gameSystem.gainItem ? null : null; $gameParty.gainItem($dataItems[89], 1); $gameParty.gainItem($dataItems[60], 1); 0`);   // hammer irrelevant; give a stone axe (60)
        const beforeHits = await ev("$gameMap.event(143)._treeHits || 0");
        await press();
        for (let i = 0; i < 90; i++) { if (!(await ev("$gameMap.event(143).isTreeAnimating()"))) break; await frames(2); }
        const afterHits = await ev("$gameMap.event(143)._treeHits || 0");
        check("bare, the action button now swings the axe at it (a normal tree hit landed)", afterHits >= 1 || (await ev("!!$gameSelfSwitches.value([3,143,'A'])")), { beforeHits, afterHits });

        // ---------------------------------------------------------------- 4. out of season: a never-picked tree starts bare, not fruiting
        await setDay(90);   // Zima with a 28-day season length (day 85-112) - outside the fruiting window
        const seasonWinter = await seasonOf(90);
        st = await treeState(144);
        check("out of season (" + seasonWinter + "), the pear tree (never picked) sits on the bare page, not fruiting", seasonWinter !== "Lato" && seasonWinter !== "Jesień" && st.page === 1 && st.C === true, { seasonWinter, st });

        // ---------------------------------------------------------------- 5. regrowth: pick, wait past the regrow window, back in season -> fruits again
        await setDay(41);   // back in season
        st = await treeState(144);
        check("back in season, the never-picked pear is fruiting again", st.page === 0 && !st.C, st);
        const beforePear = await count(140);
        const pearSpot = await standBy(144); await frames(6);
        if (!pearSpot) console.log("NOTE no free tile beside the pear tree");
        await keyO(); await frames(10);   // (this one with the real O key)
        check("picked the pear (bare now)", (await count(140)) > beforePear && (await treeState(144)).C === true);
        await setDay(43);   // only 2 days later: too soon (regrow is 5 days)
        st = await treeState(144);
        check("2 days later: still bare (not enough time to regrow)", st.page === 1 && st.C === true, st);
        await setDay(47);   // 6 days after picking, still in season
        st = await treeState(144);
        check("6 days after picking, back in season: fruiting again", st.page === 0 && !st.C, st);

        await b.shot(path.join(__dirname, "fruit_trees.png"));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
