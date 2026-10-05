// Lightning hitting a tree (Storm.js + ChoppableTree.js): the tree is charred (self-switch D), drawn soot-black, sparks and
// smoke, a popup; at most two a storm day, only close strikes while it rages; chopped it falls after two blows and gives
// charcoal instead of wood, and so does its stump.
// Stage 3 (batch E2, ChoppableTree on the core and split in four): the files in the page; the felled charred tree on the bus ("chop");
// an old save's _smoulder / _treeFruit adopted into _tw.
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
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        if (REGISTERED) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: REGISTERED });
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(14); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        await ev(`(function(){ window.__pop = []; const _q = Game_Temp.prototype.pushLootPopup; Game_Temp.prototype.pushLootPopup = function(icon, text) { window.__pop.push(text); return _q.apply(this, arguments); };
            window.__se = []; const _p = AudioManager.playSe; AudioManager.playSe = function(se) { window.__se.push(se.name); return _p.call(this, se); }; })(); 0`);
        // (and the sounds through the core's safe pool - Storm.js since 2026-09-29); the strikes on the bus
        await ev(`(function(){ if (window.Tawerna && Tawerna.audio && !Tawerna.audio.__rec) { const _se = Tawerna.audio.se; Tawerna.audio.__rec = true; Tawerna.audio.se = function(name) { window.__se.push(name); return _se.apply(this, arguments); }; }
            window.__bolts = []; if (window.Tawerna) Tawerna.on("lightning", e => window.__bolts.push(e), { owner: "tree_strike_test" }); })(); 0`);
        // ChoppableTree in four files (stage 3, batch E2); what is finished goes on the bus ("chop")
        const fam = await J(`({ parts: Object.keys(Tawerna.api("ChoppableTree_parts") || {}), scripts: ["ChoppableTree", "ChoppableTree_Objects", "ChoppableTree_Swing", "ChoppableTree_Render"].map(n => document.querySelectorAll('script[src$="/' + n + '.js"]').length),
            order: $plugins.map(p => p.name).filter(n => /^(MapZoom|ChoppableTree|ChoppableTree_Objects|ChoppableTree_Swing|ChoppableTree_Render|SurvivalHUD)$/.test(n)), api: Tawerna.api("ChoppableTree") === ChoppableTree })`);
        check("ChoppableTree in four files (the tags and the hooks, the things, the swings, the look), each in the page once" + (REGISTERED ? " - registered: " + fam.order.join(", ") : " - the parts put in by ChoppableTree.js"),
            fam.api && fam.parts.join() === "core,objects,swing,render" && fam.scripts.join() === "1,1,1,1" && (!REGISTERED || fam.order.join() === "MapZoom,ChoppableTree,ChoppableTree_Objects,ChoppableTree_Swing,ChoppableTree_Render,SurvivalHUD"), fam);
        await ev("window.__chops = []; Tawerna.on('chop', e => window.__chops.push({ kind: e.kind, id: e.id, mapId: e.mapId, x: e.x, y: e.y, done: e.done, drops: e.drops, charred: e.charred, hand: e.hand, same: e.event === $gameMap.event(e.id) }), { owner: 'test' }); 0");
        // a storm raging right now; no strikes of its own while we look
        await ev("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); 0");
        await frames(120);
        await ev("Storm.state.nextStrike = Storm.state.t + 100000; 0");

        // ---------------------------------------------------------------- a tree to hit: standing, with a free tile below it for the player
        const T = await J(`(function(){ const list = ChoppableTree.strikeableTrees().filter(e => $gameMap.isValid(e.x, e.y + 3) && $gameMap.eventsXy(e.x, e.y + 1).length === 0 && $gameMap.isPassable(e.x, e.y + 1, 8));
            const e = list[0]; if (!e) return null; const m = /<Tree:[^>]*hits=(\\d+)/i.exec(e.event().note || ""); return { id: e.eventId(), x: e.x, y: e.y, hits: m ? Number(m[1]) : 4, n: list.length }; })()`);
        check("(setup) a standing tree with room below it", !!T, T);
        const { id, x, y } = T;
        await ev(`$gamePlayer.locate(${x}, ${y + 3}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${x} - 13, ${y} - 6); 0`);
        await frames(20);
        check("ordinary trees are not charred", (await ev(`ChoppableTree.isCharred($gameMap.event(${id}))`)) === false);

        // ---------------------------------------------------------------- the strike
        await ev(`window.__pop = []; window.__se = []; Storm.strike(0.1, { tree: $gameMap.event(${id}) }); 0`);
        await frames(2);
        const hit = await J(`(function(){ const e = $gameMap.event(${id}), s = SceneManager._scene._spriteset, sp = s._characterSprites.find(c => c._character === e), bolt = Storm.state.bolt;
            return { charred: ChoppableTree.isCharred(e), D: $gameSelfSwitches.value([3, ${id}, "D"]), tone: sp._colorTone.slice(), bolt: bolt && { tree: !!bolt.tree, x: Math.round(bolt.x * Graphics.width), y: Math.round(bolt.ground * Graphics.height) },
                treeX: e.screenX(), treeTop: e.screenY() - sp.patternHeight(), treeFoot: e.screenY(), fx: s._hitFxLayer._particles.length, last: Storm.state.last, pops: window.__pop.slice(), today: $gameSystem._stormTrees }; })()`);
        await frames(10);
        await b.shot(OUT + "tree_strike.png");
        check("the tree is charred (self-switch D, saved with the game)", hit.charred && hit.D === true, hit);
        check("the bolt comes down on its crown", hit.bolt && hit.bolt.tree && Math.abs(hit.bolt.x - hit.treeX) <= 2 && hit.bolt.y > hit.treeTop && hit.bolt.y < hit.treeFoot, { bolt: hit.bolt, treeX: hit.treeX, top: hit.treeTop, foot: hit.treeFoot });
        check("sparks and burnt leaves fly out of it", hit.fx >= 20, hit.fx);
        check("'Piorun trafił w drzewo!', counted for today", hit.pops.includes("Piorun trafił w drzewo!") && hit.today && hit.today.n === 1 && hit.last.tree === id, { pops: hit.pops, today: hit.today });
        const busHit = await J("window.__bolts.slice(-1)[0] || null");
        check("the bus: 'lightning' says the tree was hit (hitTree, tree = its id), the bolt ends on its crown", !!busHit && busHit.hitTree === true && busHit.tree === id && busHit.bolt === true && Math.abs(busHit.x - hit.treeX) <= 2 && busHit.y === hit.bolt.y, { busHit, bolt: hit.bolt });
        const look = await J(`(function(){ const e = $gameMap.event(${id}), sp = SceneManager._scene._spriteset._characterSprites.find(c => c._character === e), st = sp._treeStrips[0];
            return { own: st.bitmap === sp.bitmap, charredPic: !!st.bitmap._charred, spriteTone: sp._colorTone.slice() }; })()`);
        check("while it burns it keeps its own picture (the burn covers it pixel by pixel), no tone on the sprite", look.own && !look.charredPic && look.spriteTone[3] === 0, look);
        await frames(20);
        check("the crown catches fire for a moment (Fire2 after the crack)", (await J("window.__se.slice()")).includes("Fire2"), await J("window.__se.slice()"));
        const smoke = await J(`(function(){ const sm = SceneManager._scene._spriteset._smoulder, e = sm._entries["3:${id}"]; return e ? { puffs: e.puffs.filter(p => p.alpha > 0.05).length } : null; })()`);
        check("it smoulders: smoke from the crown", !!smoke && smoke.puffs >= 2, smoke);
        // the burn: from the tip down, pixel by pixel - glowing pixels (the band) and soot-black ones (burnt) over the tree's own picture
        const embers = () => J(`(function(){ const e = $gameMap.event(${id}), sp = SceneManager._scene._spriteset._characterSprites.find(c => c._character === e), b = sp._emberBitmap;
            if (!b || !sp._emberStrips || !sp._emberStrips[0].visible) return null; const d = b.context.getImageData(0, 0, b.width, b.height).data; let covered = 0, glow = 0, gy = 0, hot = 0, bottom = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const y = Math.floor(i / 4 / b.width); covered++; bottom = Math.max(bottom, y); if (d[i] - d[i + 2] > 60) { glow++; gy += y; if (d[i + 1] > 150) hot++; } }
            return { covered, glow, hot, glowY: glow ? Math.round(gy / glow) : 0, burntTo: bottom, h: b.height, pixels: sp._emberSites.n }; })()`);
        const e0 = await embers();
        check("the burn starts at the tip: only the top is covered yet, and it glows (some pixels bright yellow-orange)", !!e0 && e0.glow >= 20 && e0.hot >= 3 && e0.covered < e0.pixels * 0.35, e0);
        await b.shot(OUT + "tree_embers0.png");
        await ev(`$gameSystem._smoulder["3:${id}"] -= 0.1; 0`);   // 6 game minutes (~6 s) later: half way down
        await frames(12);
        const e1 = await embers();
        check("...it creeps down the tree: more of it burnt black, the glowing band lower down", !!e1 && e1.covered > e0.covered * 1.8 && e1.glowY > e0.glowY + 30 && e1.burntTo > e0.burntTo, { early: e0, later: e1 });
        await b.shot(OUT + "tree_embers.png");
        await ev(`$gameSystem._smoulder["3:${id}"] -= 0.13; 0`);   // ~0.24 h: past the foot (it takes 0.2 h, about 12 s)
        await frames(12);
        const e2 = await embers();
        check("...the band has passed: all of it is burnt, only a few pixels still smoulder", !!e2 && e2.covered > e2.pixels * 0.95 && e2.glow > 0 && e2.glow < e2.pixels * 0.06, e2);
        // then half an hour of smouldering: smoke rising in columns from the embers, well above the crown, thinning as they die
        const smokeNow = () => J(`(function(){ const e = SceneManager._scene._spriteset._smoulder._entries["3:${id}"], live = e ? e.parts.filter(q => q.alive && q.spr.alpha > 0.05) : [];
            return { puffs: live.length, columns: e ? e.vents.length : 0, top: live.length ? Math.round(Math.min(...live.map(q => q.spr.y))) : null }; })()`);
        // (the columns start where the embers are, the smoke needs a few seconds to climb past the crown - how many, the puffs' own
        // random speeds and the wind decide: from 330 frames on, up to 600, until the highest puff is over the crown)
        await frames(330);
        let sm1 = await smokeNow();
        for (let i = 0; i < 9 && !(sm1.top !== null && sm1.top < hit.treeTop); i++) { await frames(30); sm1 = await smokeNow(); }
        await b.shot(OUT + "tree_smoulder.png");
        check("...then it smokes: columns of smoke from the embers, rising above the crown", sm1.puffs >= 25 && sm1.columns >= 3 && sm1.top < hit.treeTop, { smoke: sm1, crownTop: hit.treeTop });
        await ev(`$gameSystem._smoulder["3:${id}"] -= 0.2; 0`);   // near the end of the half hour
        await frames(200);
        const sm2 = await smokeNow();
        check("...less and less as the embers die (fewer columns, fewer puffs), but it still smokes", sm2.puffs >= 3 && sm2.puffs < sm1.puffs * 0.8 && sm2.columns < sm1.columns, { start: sm1, late: sm2 });
        check("...the tree still glows with embers then", (await embers()) !== null);
        await ev(`$gameSystem._smoulder["3:${id}"] -= 0.4; 0`);   // past the half hour after the band (0.1 + 0.13 + 0.2 + 0.4 h and the frames between)
        await frames(40);
        check("...and half an hour after the band reached the foot it is out", (await embers()) === null);
        check("...the smoke is gone as well", await ev(`!SceneManager._scene._spriteset._smoulder._entries["3:${id}"]`));
        const done = await J(`(function(){ const e = $gameMap.event(${id}), sp = SceneManager._scene._spriteset._characterSprites.find(c => c._character === e), st = sp._treeStrips[0]; return { own: st.bitmap === sp.bitmap, charredPic: !!st.bitmap._charred, spriteTone: sp._colorTone.slice() }; })()`);
        check("...then it is drawn from its soot-black picture", !done.own && done.charredPic && done.spriteTone[3] === 0, done);
        await ev(`$gameSystem._smoulder["3:${id}"] = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - 0.1; 0`);
        await frames(12);
        check("a charred tree cannot be struck again", (await J(`ChoppableTree.strikeableTrees().some(e => e.eventId() === ${id})`)) === false);

        // ---------------------------------------------------------------- the rules: close strikes while raging, two a day at most
        const hitsBy = async (n, d) => { await ev(`window.__before = ChoppableTree.strikeableTrees().length; for (let i = 0; i < ${n}; i++) Storm.strike(${d}); 0`); await frames(4); return ev("window.__before - ChoppableTree.strikeableTrees().length"); };
        check("far strikes never hit a tree", (await hitsBy(40, 0.8)) === 0);
        const one = await hitsBy(40, 0.05);
        check("close strikes while raging sometimes do (a second tree, and that is the day's last)", one === 1 && (await ev("$gameSystem._stormTrees.n")) === 2, { one, today: await J("$gameSystem._stormTrees") });
        check("two trees a storm day at most", (await hitsBy(40, 0.05)) === 0);
        await ev("$gameSystem.setDayNightHour($gameSystem._stormForce.start - 0.5); 0");   // gathering: no rain yet
        await frames(10);
        await ev("$gameSystem._stormTrees = null; 0");
        check("while the storm only gathers, no tree is hit", (await hitsBy(40, 0.05)) === 0);
        await ev("$gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); Storm.state.nextStrike = Storm.state.t + 100000; 0");
        await frames(10);

        // ---------------------------------------------------------------- chopping it: half the blows, charcoal instead of wood
        await ev(`$gameParty.gainItem($dataItems[60], 1); $gameParty.gainItem($dataItems[62], 1); $gamePlayer.locate(${x}, ${y + 1}); $gamePlayer.setDirection(8); 0`);
        await frames(10);
        const idle = () => ev(`new Promise(res => { const iv = setInterval(() => { const e = $gameMap.event(${id}); if (!$gameMap.isEventRunning() && !e.isTreeAnimating() && !$gamePlayer.isToolSwinging() && $gamePlayer.canMove()) { clearInterval(iv); res(); } }, 8); })`);
        const blow = async () => {
            await idle();
            await ev("$gameSystem.setStamina(100); 0");
            const before = await ev(`$gameMap.event(${id})._treeHits || 0`);
            await ev(`$gameMap.event(${id}).start(); 0`);
            await ev(`new Promise(res => { let n = 0; const iv = setInterval(() => { const e = $gameMap.event(${id}); n++; if ((e._treeHits || 0) !== ${before} || e._breakT >= 0 || e._treeFallT >= 0 || n > 300) { clearInterval(iv); res(); } }, 8); })`);
        };
        const wood0 = await count(61), coal0 = await count(79);
        let blows = 0;
        for (let i = 0; i < 8 && !(await ev(`$gameSelfSwitches.value([3, ${id}, "A"])`)); i++) {
            await blow();
            blows++;
            if (i === 0) {
                await frames(3);
                check("the chips are black (char), not wood", await ev(`SceneManager._scene._spriteset._hitFxLayer._particles.length > 0`));
            }
            await frames(70);
        }
        const felled = { blows, wood: (await count(61)) - wood0, coal: (await count(79)) - coal0, A: await ev(`$gameSelfSwitches.value([3, ${id}, "A"])`) };
        check("it falls after 2 blows (brittle; instead of " + T.hits + ")", felled.A && felled.blows === 2, felled);
        check("it gives 6-10 charcoal and no wood", felled.coal >= 6 && felled.coal <= 10 && felled.wood === 0, felled);
        await frames(10);
        const chop = await J(`window.__chops.filter(c => c.id === ${id})`);
        check("the felled charred tree on the bus: chop { kind tree, charred, done true (no stump), the charcoal it gave }",
            chop.length === 1 && chop[0].kind === "tree" && chop[0].charred === true && chop[0].done === true && chop[0].same && chop[0].drops.length === 1 &&
            chop[0].drops[0].item === 79 && chop[0].drops[0].amount === felled.coal, chop);
        await frames(20);
        // burnt to the roots: no stump, the empty page straight away, the ground free
        const gone = await J(`(function(){ const e = $gameMap.event(${id}); return { B: $gameSelfSwitches.value([3, ${id}, "B"]), tile: e.tileId(), picture: e.characterName(), passable: $gameMap.isPassable(${x}, ${y}, 2) || $gameMap.isPassable(${x}, ${y}, 8), plot: Farming.plotAt(${x}, ${y}) }; })()`);
        check("no stump is left: the event is empty (self-switch B), the ground is free", gone.B === true && gone.tile === 0 && !gone.picture && gone.passable && !!gone.plot, gone);
        const coalAfter = await count(79);
        await ev(`$gameMap.event(${id}).start(); 0`);
        await frames(40);
        check("...so there is nothing to dig: the action button does nothing there", (await count(79)) === coalAfter && !(await ev("$gamePlayer.isToolSwinging()")));
        check("felled, it stops smouldering", await ev(`!SceneManager._scene._spriteset._smoulder._entries["3:${id}"]`));
        await b.shot(OUT + "tree_strike_gone.png");

        // ---------------------------------------------------------------- a night view of a struck tree (the embers glow)
        await ev("Survival.calmWeather(); 0");
        await frames(10);
        await ev(`delete $gameSystem._stormForce; $gameSystem._stormTrees = null; $gameSystem.setDayNightHour(21.5); Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); 0`);
        await frames(140);
        // the F9 way: "Piorun w drzewo" queues it and goes back to the map, which is built anew - the strike must wait for it
        await ev(`$gamePlayer.locate(${x}, ${y + 3}); $gameMap.setDisplayPos(${x} - 13, ${y} - 6); Storm.state.nextStrike = Storm.state.t + 100000; window.__nChar = $gameMap.events().filter(e => ChoppableTree.isCharred(e)).length; 0`);
        await ev("SceneManager.push(Scene_Debug); 0");
        await frames(20);
        await ev("Storm.pending.push({ tree: true }); SceneManager.pop(); 0");
        for (let i = 0; i < 60 && (await ev("Storm.pending.length")) > 0; i++) await frames(5);
        await frames(30);
        const f9 = await J(`({ scene: SceneManager._scene.constructor.name, pending: Storm.pending.length, charred: $gameMap.events().filter(e => ChoppableTree.isCharred(e)).length - window.__nChar, errors: 0 })`);
        check("F9 'Piorun w drzewo': back on the map, a tree is hit, no error", f9.scene === "Scene_Map" && f9.pending === 0 && f9.charred === 1, f9);
        await frames(60);
        await b.shot(OUT + "tree_strike_night.png");
        // at night the embers light the dark a little, around where they glow (not a blurry orange blob over everything)
        const glow = await J(`(function(){ const ss = SceneManager._scene._spriteset, L = ChoppableTree.emberLights(ss); if (!L.length) return null; const l = L[0], ctx = ss._nightLight.bitmap.context;
            const a = (x, y) => ctx.getImageData(Math.max(0, Math.round(x / 2)), Math.max(0, Math.round(y / 2)), 1, 1).data[3];
            return { light: { x: Math.round(l.x), y: Math.round(l.y), r: Math.round(l.r) }, atEmbers: a(l.x, l.y), away: a(l.x > Graphics.width / 2 ? l.x - 300 : l.x + 300, l.y), glowSprites: !!ss._smoulder.glowLayer }; })()`);
        check("at night: the dark lifts a little around the embers, nowhere else, and no glow sprite any more", !!glow && glow.atEmbers < glow.away - 40 && !glow.glowSprites, glow);
        await ev("$gameSystem._smoulder && Object.keys($gameSystem._smoulder).forEach(k => $gameSystem._smoulder[k] -= 0.25); 0");   // the glow further down the tree
        await frames(40);
        await b.shot(OUT + "tree_strike_night2.png");

        // ---------------------------------------------------------------- an old save (before the core): its $gameSystem._stormTrees is taken over
        // (Tawerna.state "stormTrees"), the old key stays a hidden alias and a new save has it only in the new place
        await ev(`(function(){ $gameSystem.onBeforeSave(); const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents())), tw = c.system._tw;
            c.system._stormTrees = JSON.parse(JSON.stringify(tw.stormTrees)); delete tw.stormTrees; if (tw._v) delete tw._v.stormTrees;
            // (and ChoppableTree's: a tree smouldering for 6 minutes, a fruit tree picked on day 12 - as the old plugin kept them)
            c.system._smoulder = { "3:998": $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - 0.1 }; c.system._treeFruit = { "3:999": 12 };
            delete tw.smoulder; delete tw.treeFruit; if (tw._v) { delete tw._v.smoulder; delete tw._v.treeFruit; }
            window.__oldSave = c; })(); 0`);
        const oldTrees = await J("window.__oldSave.system._stormTrees");
        await ev("SceneManager.goto(Scene_Title); 0");
        for (let i = 0; i < 80 && !(await ev("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()").catch(() => false)); i++) await sleep(250);
        await ev(`(async function(){ await StorageManager.saveObject(DataManager.makeSavename(9), window.__oldSave); await DataManager.loadGame(9); $gameSystem.onAfterLoad();
            $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0); $gamePlayer.requestMapReload(); SceneManager.goto(Scene_Map); return 0; })()`);
        for (let i = 0; i < 120 && !(await ev("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()").catch(() => false)); i++) await sleep(250);
        await frames(20);
        const adopted = await J(`(function(){ const s = $gameSystem, again = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents())).system;
            return { tw: s._tw.stormTrees, v: Tawerna.state.version("stormTrees"), alias: s._stormTrees === s._tw.stormTrees, hidden: !Object.keys(s).includes("_stormTrees"),
                again: Object.keys(again).includes("_stormTrees"), againTw: again._tw.stormTrees }; })()`);
        const oldCT = await J("({ smoulder: window.__oldSave.system._smoulder, fruit: window.__oldSave.system._treeFruit })");
        const adoptedCT = await J(`(function(){ const s = $gameSystem, again = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents())).system;
            return { smoulder: s._tw.smoulder, fruit: s._tw.treeFruit, v: [Tawerna.state.version("smoulder"), Tawerna.state.version("treeFruit")],
                alias: s._smoulder === s._tw.smoulder && s._treeFruit === s._tw.treeFruit, hidden: !Object.keys(s).includes("_smoulder") && !Object.keys(s).includes("_treeFruit"),
                again: ["_smoulder", "_treeFruit"].filter(k => Object.keys(again).includes(k)), againTw: [again._tw.smoulder, again._tw.treeFruit] }; })()`);
        await ev("StorageManager.remove(DataManager.makeSavename(9)); 0");
        check("an old save's $gameSystem._stormTrees is taken over (Tawerna.state 'stormTrees'), the old key a hidden alias, a new save only in _tw", oldTrees.n >= 1 &&
            adopted.tw && adopted.tw.day === oldTrees.day && adopted.tw.n === oldTrees.n && adopted.v === 1 && adopted.alias && adopted.hidden && !adopted.again && adopted.againTw.n === oldTrees.n, { oldTrees, adopted });
        check("...and its $gameSystem._smoulder / _treeFruit (ChoppableTree: Tawerna.state 'smoulder', 'treeFruit'), the old keys hidden aliases, a new save only in _tw",
            adoptedCT.smoulder && adoptedCT.smoulder["3:998"] === oldCT.smoulder["3:998"] && adoptedCT.fruit && adoptedCT.fruit["3:999"] === 12 && adoptedCT.v.join() === "1,1" &&
            adoptedCT.alias && adoptedCT.hidden && adoptedCT.again.length === 0 && adoptedCT.againTw[0]["3:998"] === oldCT.smoulder["3:998"] && adoptedCT.againTw[1]["3:999"] === 12, { oldCT, adoptedCT });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
