// Held O at a tree (ChoppableTree: updateHoldStrike): blow after blow until it falls; letting go stops; Zręczność makes the blows come
// sooner (Combat.workSpeed: the swing's rate and the pause).
// Stage 3 (batch E2, ChoppableTree on the core and split in four): the files in the page; the felled tree on the bus ("chop").
const { launch, sleep } = require("./cdp.js");
// REGISTERED=1: ChoppableTree_Objects, ChoppableTree_Swing and ChoppableTree_Render put into the page's plugin list right under
// ChoppableTree, as the plugin manager will list them (js/plugins.js itself is not touched); without it ChoppableTree.js puts them in itself
const PARTS = ["ChoppableTree_Objects", "ChoppableTree_Swing", "ChoppableTree_Render"];
const REGISTERED = process.env.REGISTERED ? `(function(){
    let real;
    const mk = name => ({ name, status: true, description: "", parameters: {} });
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const list = v.filter(p => !${JSON.stringify(PARTS)}.includes(p.name)), at = list.findIndex(p => p.name === "ChoppableTree");
        list.splice(at + 1, 0, ...${JSON.stringify(PARTS)}.map(mk));
        real = list;
    } });
})();` : null;
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        if (REGISTERED) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: REGISTERED });
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); $gameParty.gainItem($dataItems[60], 1); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        // ChoppableTree in four files (stage 3, batch E2); what is finished goes on the bus ("chop")
        const fam = await J(`({ parts: Object.keys(Tawerna.api("ChoppableTree_parts") || {}), scripts: ["ChoppableTree", "ChoppableTree_Objects", "ChoppableTree_Swing", "ChoppableTree_Render"].map(n => document.querySelectorAll('script[src$="/' + n + '.js"]').length),
            order: $plugins.map(p => p.name).filter(n => /^(MapZoom|ChoppableTree|ChoppableTree_Objects|ChoppableTree_Swing|ChoppableTree_Render|SurvivalHUD)$/.test(n)), api: Tawerna.api("ChoppableTree") === ChoppableTree })`);
        check("ChoppableTree in four files (the tags and the hooks, the things, the swings, the look), each in the page once" + (REGISTERED ? " - registered: " + fam.order.join(", ") : " - the parts put in by ChoppableTree.js"),
            fam.api && fam.parts.join() === "core,objects,swing,render" && fam.scripts.join() === "1,1,1,1" && (!REGISTERED || fam.order.join() === "MapZoom,ChoppableTree,ChoppableTree_Objects,ChoppableTree_Swing,ChoppableTree_Render,SurvivalHUD"), fam);
        await ev("window.__chops = []; Tawerna.on('chop', e => window.__chops.push({ kind: e.kind, id: e.id, mapId: e.mapId, x: e.x, y: e.y, done: e.done, drops: e.drops, charred: e.charred, hand: e.hand, same: e.event === $gameMap.event(e.id) }), { owner: 'test' }); 0");
        // standing trees of the same kind (a free tile below each: stand there, face up)
        const trees = await J(`$gameMap.events().filter(e => ChoppableTree.isTree(e) && !$gameSelfSwitches.value([3, e.eventId(), "A"]) && e.event().pages[0].image.characterName === "!$Pine_B" && $gameMap.isPassable(e.x, e.y + 1, 8)).map(e => ({ id: e.eventId(), x: e.x, y: e.y, hits: ChoppableTree.treeConfig(e).hits }))`);
        check("found standing pines (Sosna średnia, 16 blows) to chop", trees.length >= 3 && trees[0].hits === 16, trees.slice(0, 3));
        const stand = t => ev(`$gamePlayer.locate(${t.x}, ${t.y + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${t.x} - 13, ${t.y} - 7); $gameSystem.setStamina(100); 0`);
        const hits = id => ev(`$gameMap.event(${id})._treeHits || 0`);
        const fallen = id => ev(`$gameSelfSwitches.value([3, ${id}, "A"]) || $gameMap.event(${id})._treeFallT >= 0`);

        // ---- held O: blow after blow
        const T1 = trees[0];
        await stand(T1); await frames(10);
        await ev("Input._currentState.ok = true; 0");
        const f0 = await ev("Graphics.frameCount");
        await frames(240);
        const h1 = await hits(T1.id), f1 = await ev("Graphics.frameCount");
        await ev("Input._currentState.ok = false; 0");
        await frames(80);
        const h2 = await hits(T1.id);
        const perBlow = (f1 - f0) / Math.max(1, h1);
        check("held O at the tree: blow after blow without letting go", h1 >= 3, { h1, perBlow: Math.round(perBlow) });
        check("chopping a tree goes at half the speed: about 48 frames a blow (was 24)", perBlow >= 42 && perBlow <= 56, Math.round(perBlow));
        check("let go: it stops (at most the swing already begun lands)", h2 - h1 <= 1, { h1, h2 });
        await frames(60);
        check("...and nothing more after that", (await hits(T1.id)) === h2);

        // ---- held until it falls
        await ev("$gameSystem.setStamina(100); Input._currentState.ok = true; 0");
        for (let i = 0; i < 60 && !(await fallen(T1.id)); i++) await frames(20);
        await ev("Input._currentState.ok = false; 0");
        check("held on, the tree comes down (then it stops by itself)", await fallen(T1.id));
        await frames(120);
        const chop = await J(`window.__chops.filter(c => c.id === ${T1.id})`);
        check("the felled pine on the bus: chop { kind tree, its id and tile, done false (its stump is left), the wood it gave }",
            chop.length === 1 && chop[0].kind === "tree" && chop[0].mapId === 3 && chop[0].x === T1.x && chop[0].y === T1.y && chop[0].done === false && chop[0].same &&
            chop[0].drops.some(d => d.item === 61 && d.amount > 0) && !chop[0].charred && !chop[0].hand, chop);

        // ---- Zręczność 45: quicker
        const T2 = trees[1];
        await ev("Combat.hero().attr.dex = 45; 0");
        await stand(T2); await frames(10);
        await ev("Input._currentState.ok = true; 0");
        const g0 = await ev("Graphics.frameCount");
        await frames(240);
        const k1 = await hits(T2.id), g1 = await ev("Graphics.frameCount");
        await ev("Input._currentState.ok = false; 0");
        await frames(60);
        const perBlowDex = (g1 - g0) / Math.max(1, k1);
        check("Zręczność 45 (+40% work speed): the blows come clearly sooner", perBlowDex < perBlow * 0.85, { perBlow: Math.round(perBlow), perBlowDex: Math.round(perBlowDex) });

        // ---- moved away: no more blows
        const T3 = trees[2];
        await ev("Combat.hero().attr.dex = 5; 0");
        await stand(T3); await frames(10);
        await ev("Input._currentState.ok = true; 0");
        await frames(20);
        await ev(`$gamePlayer.locate(${T3.x + 3}, ${T3.y + 1}); 0`);   // (stepped away while holding)
        await frames(120);
        await ev("Input._currentState.ok = false; 0");
        check("stepped away while holding: only the first blow landed", (await hits(T3.id)) === 1, await hits(T3.id));

        // ---- the pickaxe at a rock: held O works the same, and at half the speed like the axe
        await ev("$gameParty.gainItem($dataItems[63], 1); 0");   // (the stone pickaxe)
        const rock = await J(`(function(){
            const e = $gameMap.events().find(o => /^!\\$Rock_Ore_Iron$/.test(o.event().pages[0].image.characterName));
            if (!e) return null;
            for (const [d, dx, dy] of [[8, 0, 1], [2, 0, -1], [4, 1, 0], [6, -1, 0]]) {
                const nx = e.x + dx, ny = e.y + dy;
                if (!$gameMap.isValid(nx, ny) || $gameMap.eventsXy(nx, ny).some(o => !o.isThrough() && o.isNormalPriority())) continue;
                if (!$gameMap.isPassable(nx, ny, d) && !$gameMap.isPassable(nx, ny, 10 - d)) continue;
                return { id: e.eventId(), nx, ny, d };
            }
            return null; })()`);
        await ev(`$gamePlayer.locate(${rock.nx}, ${rock.ny}); $gamePlayer.setDirection(${rock.d}); $gameMap.setDisplayPos(${rock.nx} - 13, ${rock.ny} - 7); $gameSystem.setStamina(100); 0`);
        await frames(10);
        await ev("Input._currentState.ok = true; 0");
        const r0 = await ev("Graphics.frameCount");
        await frames(240);
        const rh = await hits(rock.id), r1 = await ev("Graphics.frameCount");
        const rate = await ev(`$gameMap.event(${rock.id})._swingRate`);
        await ev("Input._currentState.ok = false; 0");
        await frames(60);
        const perRock = (r1 - r0) / Math.max(1, rh);
        // (the rock at the front tile has company: a wide bush reaching over it - one press strikes only the rock, not in turn each)
        const others = await J(`$gameMap.eventsXy($gameMap.event(${rock.id}).x, $gameMap.event(${rock.id}).y).filter(e => e.eventId() !== ${rock.id}).map(e => ({ id: e.eventId(), name: e.event().name, hits: e._treeHits || 0 }))`);
        check("where a wide bush reaches over the rock, one press and held O strike only the rock", others.length > 0 && others.every(o => o.hits === 0), others);
        const expect = perBlow * (34 + 12) / (26 + 12);   // (the pickaxe swing is 34 frames, the side axe 26; both + the pause of 12, both halved)
        check("held O at an ore rock with the pickaxe: blow after blow", rh >= 3, { hits: rh, perBlow: Math.round(perRock) });
        check("the pickaxe goes at half the speed like the axe (swing rate 0.5, ~" + Math.round(expect) + " frames a blow)", rate === 0.5 && Math.abs(perRock - expect) <= expect * 0.2, { rate, perRock: Math.round(perRock), perChop: Math.round(perBlow) });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    await ev("Input._currentState.ok = false; 0").catch(() => 0);
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
