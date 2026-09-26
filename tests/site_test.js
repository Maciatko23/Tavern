// Tests building sites: the marked place, walking up with a hammer, one blow per press, stamina, cancel.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(11); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(2); await ev(`Input._currentState.${k} = false; 0`); await frames(2); };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const stamina = () => ev("$gameSystem.stamina()");
        // after OK in the placer he walks up to the spot first (Farming: walk-to-place); this waits until he is there
        const arrive = async () => { for (let i = 0; i < 80; i++) { if (await ev("!($gameTemp._buildMode && $gameTemp._buildMode.walk)")) break; await frames(5); } await frames(3); };
        const B = await ev(`(function(){
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!Farming.naturalFarmland(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found an open meadow", !!B, B);
        const { bx, by } = B;
        await ev(`$gamePlayer.locate(${bx + 2}, ${by + 3}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${bx + 2} - 13, ${by + 3} - 7); $gameParty.gainItem($dataItems[80], 12); $gameSystem.changeStamina(100); 0`);
        await frames(4);

        // ---- the tool chest gives a hammer
        check("the hammer exists (item 89, key item, icon 345) (the chest of Domek - Wnętrze gives it; the one on the meadow was edited by the user)", await ev("$dataItems[89].name === 'Młotek' && $dataItems[89].itypeId === 2 && $dataItems[89].iconIndex === 345 && true"));

        // ---- choose a place: it becomes a marked building site, no crouching
        await ev(`Farming.startPlacement("bench", ${bx + 3}, ${by + 3}); 0`);
        await frames(8);
        await ev(`$gameTemp._buildMode.x = ${bx + 5}; $gameTemp._buildMode.y = ${by + 3}; 0`);
        await frames(2);
        await press("ok");
        await arrive();
        const swing = await ev("({ swinging: $gamePlayer.isToolSwinging(), kind: $gamePlayer._toolSwing && $gamePlayer._toolSwing._swingKind, mode: !!$gameTemp._buildMode, can: $gamePlayer.canMove() })");
        check("placing the site does not crouch or swing anything", swing.swinging === false && swing.mode === false && swing.can === true, swing);
        const site = await ev(`(function(){ const b = Farming.buildingAt(${bx + 5}, ${by + 3}); return b ? { type: b.type, site: b.site } : null; })()`);
        check("a site is marked at the chosen tile with the hits it needs", !!site && site.type === "bench" && site.site.done === 0 && site.site.need === 5, site);   // (the bench: 5 blows, the user's number)
        check("the materials were delivered at once (2 planks)", (await count(80)) === 10);
        check("the site blocks the way like a building", (await ev(`$gameMap.isPassable(${bx + 5}, ${by + 3}, 4)`)) === false);
        const spr = await ev("(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === 'bench'); return e ? { blueprint: e.sprite.opacity, hasSolid: !!e.solid, hasFoot: !!e.foot, solidVisible: e.solid.visible } : null; })()");
        check("it is drawn: faint blueprint, marked ground, nothing built yet", !!spr && spr.blueprint < 120 && spr.hasFoot && spr.hasSolid && spr.solidVisible === false, spr);
        await b.shot("site_marked.png");

        // ---- walking up is required: from far away the action button does nothing to the site
        await ev(`$gamePlayer.locate(${bx + 1}, ${by + 3}); $gamePlayer.setDirection(6); 0`);
        await press("ok");
        await frames(6);
        const distantTitle = await ev("$gameTemp._farmMenuOpen ? SceneManager._scene._farmMenu._title : ''");
        check("from a distance the action button does not touch the site", (await ev(`Farming.buildingAt(${bx + 5}, ${by + 3}).site.done`)) === 0 && !/Plac budowy/.test(distantTitle), distantTitle);
        await press("cancel"); await frames(4);

        // ---- next to it, but without a hammer
        await ev(`$gamePlayer.locate(${bx + 4}, ${by + 3}); $gamePlayer.setDirection(6); $gameParty.loseItem($dataItems[89], 1, true); 0`);
        await frames(2);
        check("no hammer in the inventory now", (await count(89)) === 0);
        const menuNoHammer = await ev(`JSON.stringify(Farming.menuFor(${bx + 5}, ${by + 3}).entries.map(e => e.name))`);
        console.log("site menu:", menuNoHammer);
        check("the site menu offers start / give up", /Zacznij budować/.test(menuNoHammer) && /Zrezygnuj/.test(menuNoHammer), menuNoHammer);
        const st0 = await stamina();
        const noHammer = await ev(`Farming.strikeSite(Farming.buildingAt(${bx + 5}, ${by + 3}), ${bx + 5}, ${by + 3})`);
        await frames(40);
        check("without a hammer no blow lands and no stamina is spent", noHammer === false && (await ev(`Farming.buildingAt(${bx + 5}, ${by + 3}).site.done`)) === 0 && (await stamina()) === st0, { st0 });

        // ---- with the hammer: the real button flow (menu first, then a blow per press)
        await ev("$gameParty.gainItem($dataItems[89], 1); 0");
        await press("ok");
        await frames(6);
        check("the first press on the site opens its menu", (await ev("!!$gameTemp._farmMenuOpen")) === true);
        const s1 = await stamina();
        await press("ok");   // "Zacznij budować"
        await frames(6);
        const during = await ev("({ swinging: $gamePlayer.isToolSwinging(), kind: $gamePlayer._toolSwing && $gamePlayer._toolSwing._swingKind })");
        check("the hammer swing (kind 7) plays, not the crouch (kind 6)", during.swinging === true && during.kind === 7, during);
        await b.shot("site_hammer_swing.png");
        await frames(40);
        check("one blow was struck: 1/5 done, -2 stamina", (await ev(`Farming.buildingAt(${bx + 5}, ${by + 3}).site.done`)) === 1 && Math.round(s1 - (await stamina())) === 2, { done: 1, stamina: await stamina() });
        await b.shot("site_1of3.png");
        const grow = await ev("(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === 'bench'); return { visible: e.solid.visible, shown: e.shown }; })()");
        check("a fifth of the bench stands now (grows from the ground up)", grow.visible === true && grow.shown > 0, grow);
        // ---- begun: a tap of O opens the site's menu - go on, or take it down (the user's, 2026-09-25)
        await press("ok"); await frames(6);
        const again = await ev("JSON.stringify({ open: !!$gameTemp._farmMenuOpen, names: (SceneManager._scene._farmMenu._entries || []).map(e => e.name), sel: SceneManager._scene._farmMenu.index() })");
        const ag = JSON.parse(again);
        check("begun (1/5): a tap of O opens its menu - 'Buduj dalej' chosen, 'Rozbierz plac budowy' under it", ag.open && ag.names[ag.sel] === "Buduj dalej" && ag.names.includes("Rozbierz plac budowy"), ag);
        await press("ok"); await frames(40);   // "Buduj dalej"
        check("'Buduj dalej': the second blow", (await ev(`Farming.buildingAt(${bx + 5}, ${by + 3}).site.done`)) === 2 && (await ev("!!$gameTemp._farmMenuOpen")) === false);

        // ---- O held on: the menu chooses 'Buduj dalej' by itself and the blows go on until it is finished
        await ev("Input._currentState.ok = true; 0");
        for (let i = 0; i < 80 && (await ev(`!!(Farming.buildingAt(${bx + 5}, ${by + 3}) || {}).site`)); i++) await frames(10);
        await ev("Input._currentState.ok = false; 0");
        await frames(60);
        const fin = await ev(`(function(){ const b = Farming.buildingAt(${bx + 5}, ${by + 3}); return { there: !!b, stillSite: !!(b && b.site) }; })()`);
        check("O held on the site: it builds on by itself, the fifth blow finishes the bench - a real building now", fin.there && !fin.stillSite, fin);
        check("the whole job cost 5 blows x 2 stamina", Math.round(s1 - (await stamina())) === 10, { spent: s1 - (await stamina()) });
        await b.shot("site_done.png");

        // ---- giving up before any blow returns the materials
        await ev(`Farming.startPlacement("bench", ${bx + 3}, ${by + 5}); 0`);
        await frames(8); await press("ok"); await arrive();
        check("a second site was marked (materials taken again)", (await count(80)) === 8 && !!(await ev(`Farming.buildingAt(${bx + 3}, ${by + 5})`)));
        await ev(`$gamePlayer.locate(${bx + 2}, ${by + 5}); $gamePlayer.setDirection(6); 0`);
        await frames(2);
        await press("ok"); await frames(6);
        // choose the second entry, "Zrezygnuj"
        await press("down"); await press("ok"); await frames(6);
        check("giving up returns everything and clears the ground", (await count(80)) === 10 && !(await ev(`Farming.buildingAt(${bx + 3}, ${by + 5})`)));

        // ---- a half-built site taken down: part of the materials back (the further it got, the less - half just before the end)
        await ev(`Farming.startPlacement("bench", ${bx + 3}, ${by + 5}); 0`);
        await frames(8); await press("ok"); await arrive();
        const planks0 = await count(80);
        await ev(`Farming.buildingAt(${bx + 3}, ${by + 5}).site.done = 3; 0`);   // (3 of 5 blows)
        await ev(`$gamePlayer.locate(${bx + 2}, ${by + 5}); $gamePlayer.setDirection(6); 0`);
        await frames(2);
        await press("ok"); await frames(6);
        const tm = JSON.parse(await ev("JSON.stringify((SceneManager._scene._farmMenu._entries || []).map(e => e.name + ': ' + (e.help || '')))"));
        await press("down"); await press("ok"); await frames(10);   // "Rozbierz plac budowy"
        const cost = await ev(`Farming.BUILDINGS.bench.cost.find(c => c[0] === 80)[1]`);
        const got = (await count(80)) - planks0, want = Math.round(cost * (1 - 0.5 * 3 / 5));
        check("a site 3/5 built taken down ('Rozbierz plac budowy'): gone, " + want + " of " + cost + " planks back (70%)", !(await ev(`Farming.buildingAt(${bx + 3}, ${by + 5})`)) && got === want, { got, want, menu: tm });

        // ---- the sites are saved
        await ev(`Farming.startPlacement("hive", ${bx + 6}, ${by + 4}); 0`);
        await frames(8); await press("ok"); await arrive();
        const saved = await ev(`JSON.stringify(JsonEx.parse(JsonEx.stringify($gameSystem._farm)).buildings[3].filter(x => x.site))`);
        check("an unfinished site is part of the saved data", /"need":5/.test(saved), saved);
    } catch (e) { console.log("ERR", e.message); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
