// Workbench redesign: no tool chest, stone tools named as such, branches on the ground, hammer by hand, workbench builds from ground stuff,
// every tool made there, the iron parts forged and mounted, the saw (blade -> saw -> better sawmill), journal goals.
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const OUT = __dirname + "/wb/";
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(9); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const settle = async () => { await frames(6); await ev(`new Promise(res => { const iv = setInterval(() => { if (!$gamePlayer.isToolSwinging() && !($gameTemp._farmLock > 0) && !($gameTemp._farmTimers && $gameTemp._farmTimers.length) && $gameScreen.brightness() >= 250) { clearInterval(iv); res(1); } }, 20); })`); await frames(4); };
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const take = (id, n) => ev(`$gameParty.loseItem($dataItems[${id}], ${n}, true); 0`);
        const stamina = () => ev("$gameSystem.stamina()");
        const hour = () => ev("$gameSystem.dayNightHour()");
        const NAMES = { 60: "Kamienna siekiera", 62: "Kamienna łopata", 63: "Kamienny kilof" };

        // ================= 1. data =================
        const names = await ev("[60, 62, 63].map(i => $dataItems[i].name)");
        check("the first tools are called stone ones: Kamienna siekiera / łopata, Kamienny kilof", names.join() === Object.values(NAMES).join(), names);
        const nw = await ev("[117, 118, 119, 120].map(i => { const it = $dataItems[i]; return it ? [it.name, it.iconIndex, it.itypeId] : null; })");
        check("saw blade, saw, axe head and pick head exist (materials are normal items, the saw is a key item)", JSON.stringify(nw) === JSON.stringify([["Ostrze piły", 373, 1], ["Piła", 374, 2], ["Głowica siekiery", 375, 1], ["Grot kilofa", 376, 1]]), nw);
        const iconsDrawn = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); const out = []; for (let i = 373; i <= 379; i++) { let n = 0; const d = bmp.context.getImageData((i % 16) * 32, Math.floor(i / 16) * 32, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; out.push(n); } res(out); }; chk(); })`);
        check("the seven new icons (373-379) are drawn in IconSet.png", iconsDrawn.every(n => n > 150), iconsDrawn);
        const start = await ev("[60, 62, 63, 65, 66, 89].map(i => $gameParty.numItems($dataItems[i]))");
        check("a new game starts with no tools at all", start.every(n => n === 0), start);
        const noChest = await ev(`(function(){ const ev = $dataMap.events; const bad = ev.filter(e => e && e.pages.some(p => p.list.some(c => c.code === 126 && [60, 62, 63, 65, 66].includes(c.parameters[0])))); return { chest52: ev[52] ? { name: ev[52].name, image: ev[52].pages[0].image } : null, giving: bad.map(e => ({ id: e.id, name: e.name, tools: true })) }; })()`);
        check("no chest or event gives an axe, shovel, pickaxe, rake or hoe any more (the user's own test crystal may give a hammer)", noChest.giving.every(g => !g.tools) && !(noChest.chest52 && /!Chest/.test(JSON.stringify(noChest.chest52.image))), noChest);
        const house = await ev(`fetch("/data/Map002.json").then(r => r.json()).then(m => { const e = m.events.find(e => e && /Skrzynia/.test(e.name)); return { name: e.name, items: e.pages[0].list.filter(c => c.code === 126).map(c => c.parameters[0]) }; })`);
        check("the chest in the house gives no tools either: only the torch and the seeds", house.items.join() === "59,67,68,69,70", house);
        check("hand recipes: the hammer, the forest bed, the waterskin, rope, pine seeds, a bandage, nettle fibre", (await ev("Farming.HAND_RECIPES.map(r => r.id)")).join() === "hammer,bough_bed,waterskin,rope,pine_seeds,bandage,nettle_fiber");
        const hammerInputs = await ev("Farming.HAND_RECIPES[0].inputs.map(([id]) => id)");
        check("the hammer needs only what lies on the ground (branches 77, stones 64, flax 92)", hammerInputs.sort().join() === "64,77,92", hammerInputs);
        const wbCost = await ev("Farming.BUILDINGS.workbench.cost.map(([id, n]) => id + 'x' + n)");
        check("the workbench costs only branches, stones and flax", wbCost.map(s => s.split("x")[0]).sort().join() === "64,77,92", wbCost);
        const wbRecipes = await ev("Farming.BUILDINGS.workbench.recipes.map(r => r.id)");
        check("the workbench makes every tool: axe, pickaxe, shovel, rake, hoe, knife, rod, saw, the two iron tools - and the hunting weapons (arrows also with feathers, the spear)", wbRecipes.join() === "axe_stone,pick_stone,shovel,rake,hoe,knife,rod,saw,axe_iron,pick_iron,sling,bow,arrows,arrows_feather,spear", wbRecipes);
        check("the sawmill only saws: planks and planks with the saw", (await ev("Farming.BUILDINGS.sawmill.recipes.map(r => r.id)")).join() === "planks,planks_saw");
        const forgeRecipes = await ev("Farming.BUILDINGS.forge.recipes.map(r => r.id)");
        check("the forge forges parts: iron, iron knife, axe head, pick head, saw blade, can, the bucket, nails, the cauldron, shears, tongs", forgeRecipes.join() === "iron,knife_iron,head_axe,head_pick,blade_saw,can,bucket_item,nails,cauldron_item,shears,tongs", forgeRecipes);
        check("BUILDINGS lists the workbench first (first entry of the build menu)", (await ev("Farming.BUILDING_IDS ? Farming.BUILDING_IDS[0] : Object.keys(Farming.BUILDINGS)[0]")) === "workbench");

        // ================= 2. branches lie on the ground =================
        await frames(30);
        const kinds = await ev(`(function(){ const n = {}; let loading = 0; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { const k = Farming.gatherSpot(x, y); if (k === undefined) loading++; else if (k) n[k] = (n[k] || 0) + 1; } return { n, loading }; })()`);
        console.log("things on the ground:", JSON.stringify(kinds));
        check("Map003 has plenty of branches, stones and flax on the ground", kinds.n.branch >= 15 && kinds.n.stone >= 15 && kinds.n.fiber >= 10, kinds);
        const spot = await ev(`(function(){ for (let y = 3; y < $gameMap.height() - 3; y++) for (let x = 3; x < $gameMap.width() - 3; x++) { if (Farming.gatherAt(x, y) === "branch" && $gameMap.checkPassage(x, y + 1, 0x0f) && !$gameMap.eventsXy(x, y + 1).length) return { x, y }; } return null; })()`);
        check("found a branch on the grass", !!spot, spot);
        await ev(`$gamePlayer.locate(${spot.x}, ${spot.y + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${spot.x} - 13, ${spot.y} - 7); 0`);
        await frames(20);
        await b.shot(OUT + "ground_branch.png");
        const st0 = await stamina();
        await press("ok");
        await settle();
        const gotBranch = await count(77);
        check("the action button picks the branch up (1-2 branches, a little stamina)", gotBranch >= 1 && gotBranch <= 2 && (await stamina()) < st0, { gotBranch });
        check("that spot is empty afterwards", (await ev(`Farming.gatherAt(${spot.x}, ${spot.y})`)) === false);
        await take(77, gotBranch);

        // ================= 3. journal at the start =================
        const first = await ev(`(function(){ Journal.evaluateGoals(); return Journal.GOALS.filter(g => Journal.goalAvailable(g) && !$gameSystem._journal.done[g.id]).map(g => g.id); })()`);
        check("at the start the open goals need no tool: stones, flax, a drink of water (the branch is done above), and the story one", first.join() === "stone,flax,drink,borgar" && (await ev("!!$gameSystem._journal.done.branches")), first);
        const refs = await ev(`Journal.GOALS.filter(g => g.recipe && !Journal.recipeRef(g.recipe)).map(g => g.id).concat(Journal.GOALS.filter(g => g.build && !Farming.BUILDINGS[g.build]).map(g => g.id))`);
        check("every goal with a recipe or a building points at something that exists", refs.length === 0, refs);
        const ids = await ev("Journal.GOALS.map(g => g.id)");
        check("no goal id is used twice", new Set(ids).size === ids.length, ids);

        // ================= 4. hammer by hand =================
        const hand0 = await ev("Farming.craftManual(null, Farming.HAND_RECIPES[0])");
        check("no materials: no hammer", hand0 === false && (await count(89)) === 0);
        await give(77, 2); await give(64, 2); await give(92, 1);
        check("branches 2, stones 2, flax 1 make the hammer (no wood, no axe)", (await ev("Farming.craftManual(null, Farming.HAND_RECIPES[0])")) === true);
        await settle();
        check("the hammer is in the bag and the materials are used up", (await count(89)) === 1 && (await count(77)) === 0 && (await count(64)) === 0 && (await count(92)) === 0);

        // ================= 5. the workbench =================
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
        const buildAt = async (type, x, y) => {
            const cost = await ev(`Farming.BUILDINGS.${type}.cost`);
            for (const [id, n] of cost) await give(id, n);
            await standAt(x + 1, y + 2, 8);
            const placed = await ev(`Farming.placeSite("${type}", ${x}, ${y})`);
            if (!placed) return false;
            for (let i = 0; i < 12; i++) {
                const bld = await ev(`Farming.buildingAt(${x}, ${y})`);
                if (!bld || !bld.site) break;
                await ev("$gameSystem.setStamina(100); 0");
                await ev(`Farming.strikeSite(Farming.buildingAt(${x}, ${y}), ${x}, ${y})`);
                await settle();
            }
            const done = await ev(`(function(){ const q = Farming.buildingAt(${x}, ${y}); return !!q && !q.site; })()`);
            return done;
        };
        await give(89, 0);
        const cost0 = await ev("Farming.BUILDINGS.workbench.cost");
        await ev(`(function(){ for (const [id, n] of Farming.BUILDINGS.workbench.cost) $gameParty.gainItem($dataItems[id], n - 1); })()`);
        await standAt(bx + 2, by + 3, 8);
        check("one piece short: the workbench cannot be placed", (await ev(`Farming.placeSite("workbench", ${bx + 1}, ${by + 1})`)) === false);
        await give(cost0[0][0], 1);
        await ev(`(function(){ const c = Farming.BUILDINGS.workbench.cost; for (const [id, n] of c) if (id !== ${cost0[0][0]}) $gameParty.gainItem($dataItems[id], 1); })()`);
        const wbBuilt = await (async () => {
            const placed = await ev(`Farming.placeSite("workbench", ${bx + 1}, ${by + 1})`);
            if (!placed) return false;
            for (let i = 0; i < 12; i++) {
                const q = await ev(`Farming.buildingAt(${bx + 1}, ${by + 1})`);
                if (!q || !q.site) break;
                await ev("$gameSystem.setStamina(100); 0");
                await ev(`Farming.strikeSite(Farming.buildingAt(${bx + 1}, ${by + 1}), ${bx + 1}, ${by + 1})`);
                await settle();
            }
            return await ev(`(function(){ const q = Farming.buildingAt(${bx + 1}, ${by + 1}); return !!q && !q.site; })()`);
        })();
        check("the workbench is built with the hammer (materials taken, then blows)", wbBuilt === true && (await count(77)) === 0 && (await count(64)) === 0 && (await count(92)) === 0);
        const wbSprite = await ev(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === 'workbench'); return e ? { w: e.sprite.width || (e.sprite.bitmap && e.sprite.bitmap.width), ready: !!(e.sprite.bitmap && e.sprite.bitmap.isReady()) } : null; })()`);
        check("its picture Farm_Workbench_L.png (112 px, a bit smaller) is on the map", !!wbSprite && wbSprite.ready && wbSprite.w === 112, wbSprite);

        // ---- the menu of the workbench
        await standAt(bx + 1, by + 2, 8);
        await frames(10);
        const menu0 = await ev(`JSON.stringify(Farming.menuFor(${bx + 1}, ${by + 1}).entries.map(e => e.name + (e.enabled === false ? "(x)" : "")))`);
        console.log("workbench menu:", menu0);
        const m0 = JSON.parse(menu0);
        check("the workbench menu lists the ten tools, four weapons and the feathered arrows, all dimmed without materials, then Rozbierz (no 'Zostaw')", m0.filter(n => !/^Napraw/.test(n)).length === 16 && m0.slice(0, 15).every(n => n.endsWith("(x)")) && m0[m0.length - 1] === "Rozbierz" && !m0.includes("Zostaw"), m0);
        await press("ok"); await frames(24);
        await b.shot(OUT + "workbench_menu.png");
        const realTitle = await ev("$gameTemp._farmMenuOpen ? SceneManager._scene._farmMenu._title : ''");
        check("the real action button facing the workbench opens its menu", realTitle === "Warsztat", realTitle);
        for (let i = 0; i < 7; i++) await press("down");
        await frames(12);
        await b.shot(OUT + "workbench_menu_2.png");
        await press("cancel"); await frames(10);
        const W = await ev(`(function(){ const q = Farming.buildingAt(${bx + 1}, ${by + 1}); return q.id; })()`);
        const wbB = () => ev(`Farming.buildingAt(${bx + 1}, ${by + 1})`);
        const craftAt = async (typeKey, id) => {
            await settle();
            await ev("$gameSystem.setStamina(100); 0");
            return await ev(`(function(){ const bl = Farming.buildingAt(${typeKey === "wb" ? bx + 1 : typeKey.x}, ${typeKey === "wb" ? by + 1 : typeKey.y}); const r = Farming.BUILDINGS[bl.type].recipes.find(r => r.id === "${id}"); return Farming.craftManual(bl, r); })()`);
        };
        const recipeOf = (type, id) => ev(`Farming.BUILDINGS.${type}.recipes.find(r => r.id === "${id}").inputs`);
        const makeAtWorkbench = async (id, out) => {
            const inputs = await recipeOf("workbench", id);
            for (const [i, n] of inputs) await give(i, n);
            const before = await count(out);
            const ok = await craftAt("wb", id);
            await settle();
            const after = await count(out);
            const left = [];
            for (const [i] of inputs) left.push(await count(i));
            return { ok, gained: after - before, left };
        };

        // ---- the stone axe: from what lies on the ground
        const axe = await makeAtWorkbench("axe_stone", 60);
        check("stone axe: made from branches, stones and flax", axe.ok === true && axe.gained === 1 && axe.left.every(n => n === 0), axe);
        await give(77, 2); await give(64, 2); await give(92, 2);
        check("a second stone axe is refused (Masz już)", (await craftAt("wb", "axe_stone")) === false && (await count(60)) === 1);
        await take(77, 2); await take(64, 2); await take(92, 2);

        // ---- all the other stone / wooden tools
        for (const [id, out, label] of [["pick_stone", 63, "stone pickaxe"], ["shovel", 62, "stone shovel"], ["rake", 65, "rake"], ["hoe", 66, "hoe"], ["knife", 90, "stone knife"], ["rod", 100, "fishing rod"]]) {
            const r = await makeAtWorkbench(id, out);
            check(label + ": made at the workbench, materials used up", r.ok === true && r.gained === 1 && r.left.every(n => n === 0), r);
        }
        check("the six tools are in the bag: axe, pickaxe, shovel, rake, hoe, rod", (await ev("[60, 63, 62, 65, 66, 100].every(i => $gameParty.numItems($dataItems[i]) === 1)")) === true);
        const menu1 = JSON.parse(await ev(`JSON.stringify(Farming.menuFor(${bx + 1}, ${by + 1}).entries.map(e => e.name + (e.enabled === false ? "(x)" : "")))`));
        check("made tools stay on the list, dimmed (owned); the saw and iron tools wait for parts", menu1.slice(0, 7).every(n => n.endsWith("(x)")) && menu1[7].endsWith("(x)"), menu1);

        // ---- the axe really works (and without it the game says where to make it)
        await take(60, 1);
        const idle = eid => ev(`new Promise(res => { const iv = setInterval(() => { const e = $gameMap.event(${eid}); if (!$gameMap.isEventRunning() && !e.isTreeAnimating() && !$gamePlayer.isToolSwinging() && $gamePlayer.canMove()) { clearInterval(iv); res(1); } }, 30); })`);
        await ev("window.__popups = []; const _pp = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__popups.push({ icon: i, text: t, color: c }); return _pp.apply(this, arguments); }; 0");
        const needed = () => ev("window.__popups.filter(p => /Potrzebujesz|zmęczony/.test(p.text)).pop() || null");
        const chopTree = async (eid, px, py, d) => {
            await standAt(px, py, d); await frames(6);
            await ev("window.__popups.length = 0; 0");
            const series = []; let refused = "";
            for (let i = 0; i < 14; i++) {
                await idle(eid);
                await ev("$gameSystem.setStamina(100); 0");
                const before = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                await ev(`$gameMap.event(${eid}).start(); 0`);
                await ev(`new Promise(res => { let n = 0; const iv = setInterval(() => { const e = $gameMap.event(${eid}); n++; if ((e._treeHits || 0) !== ${before} || e._breakT >= 0 || e._treeFallT >= 0 || window.__popups.some(p => /Potrzebujesz|zmęczony/.test(p.text)) || $gameMessage.hasText() || n > 300) { clearInterval(iv); res(1); } }, 20); })`);
                const need = await needed();
                if (need) { refused = need; break; }
                const hits = await ev(`$gameMap.event(${eid})._treeHits || 0`);
                series.push(hits);
                if (hits === 0) break;
            }
            return { series, refused, window: await ev("$gameMessage.hasText()") };
        };
        const noAxe = await chopTree(1, 14, 10, 8);
        check("without an axe the tree refuses with a POPUP: the stone axe icon and just 'Potrzebujesz siekiery' (no word about where to make it), no message window", !!noAxe.refused && noAxe.refused.text === "Potrzebujesz siekiery" && noAxe.refused.icon === 377 && noAxe.refused.color === "#ff9f8f" && noAxe.window === false, noAxe);
        // the same for a missing shovel and pickaxe, and for tiredness
        const stump = await ev("(function(){ const e = $gameMap.events().find(e => e.event().note && /<Stump>/.test(e.event().note)); return e ? e._eventId : 0; })()").catch(() => 0);
        await ev("window.__popups.length = 0; 0");
        await take(63, 1);
        await ev("(function(){ const e = $gameMap.event(45); $gameSystem.setStamina(100); $gamePlayer.locate(33, 18); $gamePlayer.setDirection(2); e.start(); })()");
        await frames(20);
        const pickNeed = await needed();
        check("without a pickaxe: a popup with the stone pickaxe icon and just 'Potrzebujesz kilofa'", !!pickNeed && pickNeed.text === "Potrzebujesz kilofa" && pickNeed.icon === 378 && (await ev("$gameMessage.hasText()")) === false, pickNeed);
        await give(63, 1);
        await ev("window.__popups.length = 0; $gameParty.gainItem($dataItems[60], 1); $gameSystem.setStamina(0); $gameMap.event(1).start(); 0");
        await frames(20);
        const tired = await needed();
        check("too tired: a popup (not the message window)", !!tired && /zmęczony/.test(tired.text) && (await ev("$gameMessage.hasText()")) === false, tired);
        await ev("$gameParty.loseItem($dataItems[60], 1, true); $gameSystem.setStamina(100); 0");
        await give(60, 1);
        const withAxe = await chopTree(1, 14, 10, 8);
        check("with the stone axe the tree comes down", withAxe.refused === "" && withAxe.series.length >= 2 && withAxe.series[withAxe.series.length - 1] === 0, withAxe);
        await b.shot(OUT + "tree_cut.png");
        await idle(1); await frames(90); await settle();
        check("and it gave wood", (await count(61)) >= 1, await count(61));
        await take(61, await count(61));

        // ================= 6. the iron chain: forge parts -> workbench =================
        const ok = await buildAt("sawmill", bx + 5, by + 1);
        check("sawmill built (10 wood + 3 stones)", ok === true);
        const okF = await buildAt("forge", bx + 5, by + 3);
        check("forge built", okF === true);
        const forge = { x: bx + 5, y: by + 3 }, saw = { x: bx + 5, y: by + 1 };
        await give(86, 8);
        const parts = [];
        for (const [id, out] of [["head_axe", 119], ["head_pick", 120], ["blade_saw", 117]]) {
            const before = await count(out);
            const r = await craftAt(forge, id);
            await settle();
            parts.push([id, r, (await count(out)) - before]);
        }
        check("the forge makes the axe head, pick head and saw blade from iron (3 + 3 + 2)", parts.every(p => p[1] === true && p[2] === 1) && (await count(86)) === 0, parts);
        await give(86, 3);
        check("a second axe head is refused while one is in the bag", (await craftAt(forge, "head_axe")) === false && (await count(119)) === 1);
        await take(86, 3);
        check("the finished iron tools are not on the forge list any more", !(await ev("Farming.BUILDINGS.forge.recipes.some(r => r.id === 'axe_iron' || r.id === 'pick_iron')")));

        // assemble
        await give(93, 1); await give(61, 2); await give(80, 2);
        const asm = [];
        for (const [id, out] of [["saw", 118], ["axe_iron", 115], ["pick_iron", 116]]) {
            const before = await count(out);
            const r = await craftAt("wb", id);
            await settle();
            asm.push([id, r, (await count(out)) - before]);
        }
        check("the workbench mounts the saw, the iron axe and the iron pickaxe from the forged parts", asm.every(p => p[1] === true && p[2] === 1), asm);
        check("parts and handles were used up", (await ev("[117, 119, 120, 93, 61, 80].map(i => $gameParty.numItems($dataItems[i]))")).every(n => n === 0));
        check("an iron axe in the bag makes another stone axe pointless (refused)", await (async () => { await take(60, 1); await give(77, 2); await give(64, 2); await give(92, 2); const r = await craftAt("wb", "axe_stone"); await take(77, 2); await take(64, 2); await take(92, 2); return r === false && (await count(60)) === 0; })());
        await give(60, 1);

        // ================= 7. the saw in the sawmill =================
        await take(118, 1);
        await give(61, 6);
        const sawMenu = JSON.parse(await ev(`JSON.stringify(Farming.menuFor(${saw.x}, ${saw.y}).entries.map(e => e.name + (e.enabled === false ? "(x)" : "")))`));
        console.log("sawmill menu without the saw:", JSON.stringify(sawMenu));
        check("without the saw 'Piłuj deski piłą' is dimmed, the plain sawing works", sawMenu.some(n => n === "Piłuj deski piłą(x)") && sawMenu.includes("Piłuj deski"), sawMenu);
        const helpNoSaw = await ev(`Farming.menuFor(${saw.x}, ${saw.y}).entries.find(e => e.name === "Piłuj deski piłą").help`);
        check("its help says what is missing", /Piła/.test(helpNoSaw), helpNoSaw);
        check("refused when forced without the saw", (await craftAt(saw, "planks_saw")) === false && (await count(61)) === 6 && (await count(80)) === 0);
        await ev("$gameSystem.setDayNightHour(9); 0");
        const s1 = await stamina();
        const p1 = await craftAt(saw, "planks");
        await settle();
        const plain = { ok: p1, planks: await count(80), wood: await count(61), hours: (await hour()) - 9, spent: Math.round(100 - (await stamina())) };
        check("by hand: 3 wood -> 2 planks, 2 hours, 6 stamina", plain.ok && plain.planks === 2 && plain.wood === 3 && Math.abs(plain.hours - 2) < 0.2 && plain.spent === 6, plain);
        await give(118, 1);
        await ev("$gameSystem.setDayNightHour(9); 0");
        const p2 = await craftAt(saw, "planks_saw");
        await settle();
        const withSaw = { ok: p2, planks: (await count(80)) - 2, wood: await count(61), hours: (await hour()) - 9, spent: Math.round(100 - (await stamina())) };
        check("with the saw: 3 wood -> 3 planks, 1 hour, 4 stamina", withSaw.ok && withSaw.planks === 3 && withSaw.wood === 0 && Math.abs(withSaw.hours - 1) < 0.2 && withSaw.spent === 4, withSaw);
        const sawMenu2 = JSON.parse(await ev(`JSON.stringify(Farming.menuFor(${saw.x}, ${saw.y}).entries.map(e => e.name + (e.enabled === false ? "(x)" : "")))`));
        check("with the saw the entry is enabled once there is wood (it is dimmed only for lack of wood now)", sawMenu2.includes("Piłuj deski piłą(x)") && (await ev(`Farming.menuFor(${saw.x}, ${saw.y}).entries.find(e => e.name === "Piłuj deski piłą").help`)).startsWith("Brakuje"));
        await give(61, 3);
        check("...and enabled with wood in the bag", (await ev(`Farming.menuFor(${saw.x}, ${saw.y}).entries.find(e => e.name === "Piłuj deski piłą").enabled`)) === true);
        // the detail line the journal shows
        const detail = await ev(`(function(){ const e = Journal.allRecipes().find(x => x.r.id === "planks_saw"); return Journal.detailFor(3, { entry: e, tab: 3 }).ops.map(o => o.text || "").join(" | "); })()`);
        check("the recipe book says the saw is needed in the bag", /Potrzebujesz w plecaku: Piła/.test(detail), detail);

        // ================= 8. screenshots =================
        await standAt(bx + 3, by + 4, 8);
        await ev(`$gameMap.setDisplayPos(${bx} - 6, ${by} - 4); 0`);
        await frames(30);
        await b.shot(OUT + "buildings.png");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
