// Stage 1 fundamentals (the user's, 2026-09-27):
//  A. ONE food table (FoodTable in Farming_Data.js): Needs, Spoilage, Survival's eating and Dog.js read it, and every value is
//     the same as before (the old tables are copied here and compared item by item).
//  B. A job queue at the stations: ←/→ on a recipe change how many at once (×n, up to what the bag allows, at most 9), the inputs of
//     all are paid at once, they are made one after another, "Zbierz" takes what is finished; old jobs (no count) still work.
//  C. Building only on the grandfather's field (Map003) and in the hut (Map100), snares anywhere; elsewhere a popup says why.
//  D. The rain barrel (Beczka na deszczówkę): a rain vessel of 12 portions, built with the hammer from planks and nails.
//  E. A bigger waterskin: the tannery's "Powiększ bukłak" (4 -> 8 sips), no new item.
//  F. The last bit of strength: starving or parched, picking food costs nothing (drinking and eating never did).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 26, 17, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); Survival.calmWeather(); $gameScreen.clearWeather(); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); $gameSystem._minimapHidden = true; 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async (k, hold) => { await ev(`Input._currentState.${k} = true; 0`); await frames(hold || 3); await ev(`Input._currentState.${k} = false; 0`); await frames(4); };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        // popups over the player are caught here
        await ev(`(function(){ window.__pops = []; const p = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(icon, text, color){ window.__pops.push(String(text)); return p.apply(this, arguments); }; return 0; })()`);
        const pops = () => J("window.__pops.splice(0)");
        // a free spot for a building of this type near the player (the player's own rules, not F9's)
        const spotFor = type => J(`(function(){ const p = $gamePlayer; for (let r = 2; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = p.x + dx, y = p.y + dy; if (Farming.whyNotBuild(${JSON.stringify(type)}, x, y, false, false)) continue;
            const g = Farming.BUILDINGS[${JSON.stringify(type)}], fx = x + Math.floor(g.w / 2), fy = y + 1;
            if (!$gameMap.isValid(fx, fy) || !$gameMap.checkPassage(fx, fy, 0x0f) || Farming.buildingAt(fx, fy)) continue;
            return { x, y, fx, fy }; } return null; })()`);
        const putUp = (type, at) => J(`(function(){ const f = $gameSystem._farm, list = (f.buildings[3] = f.buildings[3] || []);
            const b = { id: f.nextId++, type: ${JSON.stringify(type)}, x: ${at.x}, y: ${at.y}, last: $gameSystem.dayNightDay(), v: 3 }; list.push(b); f.rev++; return b.id; })()`);

        // ================================================================== A. the food table
        const A = await J(`(function(){
            const OLD_FEED = { 71: [6, 0], 72: [8, 0], 73: [10, 0], 75: [6, 0], 76: [8, 0], 81: [5, 10], 83: [30, 0], 95: [45, 0], 99: [38, 0], 102: [8, 10], 103: [8, 0],
                105: [55, 0], 106: [48, 0], 107: [30, 0], 108: [35, 0], 109: [55, 20], 110: [6, 25], 123: [8, 30], 124: [32, 0] };
            const OLD_LIFE = { 94: 60, 95: 120, 98: 40, 99: 96, 101: 48, 102: 72, 103: 72, 104: 168, 105: 480, 106: 360, 107: 30, 108: 96, 109: 72, 110: 120,
                71: 480, 72: 360, 73: 480, 75: 240, 83: 120, 123: 48, 124: 720, 130: 96, 131: 96, 132: 60, 133: 72, 134: 48, 135: 240, 136: 96,
                149: 72, 150: 168, 151: 96, 153: 72, 157: 60, 158: 120, 159: 60, 160: 120, 161: 60, 162: 120,
                168: 60, 169: 120 };   // (+ the bear's meat, combat stage 2 - 2026-10-05: like the other meats)
            const OLD_DOG_EAT = { berries: 14, bush: 18, mushroom: 12, wildPotato: 20, wildCarrot: 16 };
            const OLD_MEATS = [94, 95, 157, 158, 159, 160, 161, 162, 105, 98, 99, 106, 168, 169], OLD_RAW = [94, 157, 159, 161, 168];   // (the bear's meat last: stage 2)
            const oldDog = id => OLD_RAW.includes(id) ? 40 : OLD_MEATS.includes(id) ? 45 : OLD_FEED[id] ? Math.max(8, Math.min(40, Math.round(OLD_FEED[id][0] * 1.5))) : 10;
            const oldNote = item => { const raw = item && item.meta && item.meta.Food; if (typeof raw !== "string") return null; const info = {};
                for (const pair of raw.split(",")) { const [k, v] = pair.split("=").map(s => s.trim()); info[k] = isNaN(Number(v)) ? v : Number(v); } return info; };
            const out = { table: !!window.FoodTable, diffs: window.FoodTable ? FoodTable.check() : ["no table"], info: [], fed: [], dog: [], life: null, eat: null, meats: null, feed: [] };
            for (const item of $dataItems) {
                if (!item) continue;
                const note = oldNote(item), now = Survival.foodInfo(item);
                if (!!note !== !!now) { out.info.push(item.id + " food? note " + !!note + " table " + !!now); continue; }
                if (note) {
                    for (const k of ["stamina", "buff", "hours", "buff2", "hours2"]) if (note[k] !== now[k]) out.info.push(item.id + " " + k + ": " + note[k] + " / " + now[k]);
                    const t = OLD_FEED[item.id] || [Math.round((note.stamina || 0) * 0.8), 0];
                    const old = [note.fed !== undefined ? note.fed : t[0], note.water !== undefined ? note.water : t[1]], got = Needs.foodValues(item, now);
                    if (old[0] !== got[0] || old[1] !== got[1]) out.fed.push(item.id + ": " + old + " / " + got);
                }
                if (oldDog(item.id) !== Dog.dogFoodValue(item.id)) out.dog.push(item.id + ": " + oldDog(item.id) + " / " + Dog.dogFoodValue(item.id));
            }
            const L = Spoilage.LIFE;
            out.life = Object.keys(OLD_LIFE).length === Object.keys(L).length && Object.keys(OLD_LIFE).every(k => L[k] === OLD_LIFE[k]);
            out.eat = JSON.stringify(Dog.DOG.eat) === JSON.stringify(Object.assign({}, ...Object.keys(Dog.DOG.eat).map(k => ({ [k]: OLD_DOG_EAT[k] })))) && Object.keys(Dog.DOG.eat).sort().join() === Object.keys(OLD_DOG_EAT).sort().join();
            out.meats = JSON.stringify(FoodTable.tameMeats()) === JSON.stringify(OLD_MEATS);
            for (const id of Object.keys(OLD_FEED)) if (!Needs.FEED[id] || Needs.FEED[id][0] !== OLD_FEED[id][0] || Needs.FEED[id][1] !== OLD_FEED[id][1]) out.feed.push(id);
            out.apple = FoodTable.get(139); out.raw = FoodTable.get(94); out.edibleRaw = FoodTable.edible(94); out.valueOf = FoodTable.valueOf($dataItems[102]);
            return out; })()`);
        check("A1 FoodTable exists and agrees with every item's <Food:> note (FoodTable.check: no differences)", A.table && A.diffs.length === 0, A.diffs.slice(0, 5));
        check("A2 Survival.foodInfo (eating) reads the table: stamina and buffs of every food exactly as the notes had them", A.info.length === 0, A.info.slice(0, 5));
        check("A3 Needs.foodValues: fullness and water of every food exactly as before (old FEED / notes / 80% of stamina)", A.fed.length === 0, A.fed.slice(0, 5));
        check("A4 Spoilage.LIFE is the old table, hour for hour", A.life === true);
        check("A5 the dog: the bowl value of every item as before; what it gets from food it finds (DOG.eat); the meats it is tamed with, in order", A.dog.length === 0 && A.eat && A.meats, { dog: A.dog.slice(0, 5), eat: A.eat, meats: A.meats });
        check("A6 Needs.FEED (kept for old readers) still has the old pairs", A.feed.length === 0, A.feed);
        check("A7 one row tells all: a wild apple fed 8 water 18 stamina 6, no spoiling; raw hare meat is raw, spoils in 60 h, not eaten as it is",
            A.apple && A.apple.fed === 8 && A.apple.water === 18 && A.apple.stamina === 6 && !A.apple.spoil && A.raw.raw === true && A.raw.spoil === 60 && A.edibleRaw === false && A.valueOf && A.valueOf.dog === 12,
            { apple: A.apple, raw: A.raw, valueOf: A.valueOf });
        // behaviour: eating an apple with hunger and thirst on
        const eatApple = await J(`(function(){ Needs.setEnabled(true); const n = Needs.state(); n.food = 50; n.water = 50; $gameSystem.setStamina(50);
            $gameParty.gainItem($dataItems[139], 1); $gameParty.leader().useItem($dataItems[139]); const r = { food: n.food, water: n.water, st: $gameSystem.stamina() }; Needs.setEnabled(false); return r; })()`);
        check("A8 eating a wild apple: fullness +8, water +18, strength +6 (as before)", eatApple.food === 58 && eatApple.water === 68 && eatApple.st === 56, eatApple);

        // ================================================================== B. the job queue (a kiln on the home field)
        const kAt = await spotFor("kiln");
        check("B0 room for a kiln on the home field", !!kAt, kAt);
        await putUp("kiln", kAt);
        const kiln = `Farming.buildingAt(${kAt.x}, ${kAt.y})`;
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.wood], 20); $gameParty.gainItem($dataItems[Farming.ITEM.soil], 7); $gamePlayer.locate(${kAt.fx}, ${kAt.fy}); $gamePlayer.setDirection(8); 0`);
        await frames(10);
        await press("ok"); await frames(20);
        const menuState = () => J(`(function(){ const s = SceneManager._scene, m = s._farmMenu, e = m.currentEntry(); return { open: !!$gameTemp._farmMenuOpen, tab: m._tab, name: e && e.name, qty: e && e.qty ? { n: e.qty.n, max: e.qty.max } : null,
            costs: e && e.costs ? e.costs.map(c => c[1]) : null, facts: e && e.facts, hint: s._farmTitle._tabHint || "" }; })()`);
        let ms = await menuState();
        check("B1 the kiln's menu opens on 'Przepis' at 'Wypal węgiel drzewny', which can be queued: up to 3 (18 of 20 wood, 6 of 7 soil); the tab hint says Q / E",
            ms.open && ms.tab === 0 && ms.name === "Wypal węgiel drzewny" && ms.qty && ms.qty.n === 1 && ms.qty.max === 3 && /Q/.test(ms.hint), ms);
        await press("right"); await press("right");
        ms = await menuState();
        check("B2 → twice: '×3' on the line, the costs ×3 (wood 18, soil 6), the popup says how many", ms.tab === 0 && /×3$/.test(ms.name) && ms.costs && ms.costs[0] === 18 && ms.costs[1] === 6 && (ms.facts || []).some(f => /×3/.test(f)), ms);
        await press("right");
        ms = await menuState();
        check("B3 → again: stays at ×3 (no more in the bag), still on 'Przepis'", /×3$/.test(ms.name) && ms.tab === 0, ms);
        await press("left");
        ms = await menuState();
        check("B4 ← goes down to ×2", /×2$/.test(ms.name) && ms.costs[0] === 12, ms);
        await press("right");
        await press("ok"); await frames(100);
        const started = await J(`(function(){ const b = ${kiln}; return { job: b.job, wood: $gameParty.numItems($dataItems[Farming.ITEM.wood]), soil: $gameParty.numItems($dataItems[Farming.ITEM.soil]), status: Farming.menuFor(b.x, b.y).status }; })()`);
        check("B5 OK: all three paid at once (wood 20 -> 2, soil 7 -> 1), one job of 3 by 6 h; the status line 'Trwa wypalanie 1/3'",
            started.job && started.job.count === 3 && started.wood === 2 && started.soil === 1 && Math.abs(started.job.hours - 18) < 1e-6 && started.status && /^Trwa wypalanie 1\/3: Węgiel drzewny ×3/.test(started.status.text), started);
        await ev(`$gameSystem.advanceDayNight(6.3); 0`);
        let mid = await J(`(function(){ const b = ${kiln}, m = Farming.menuFor(b.x, b.y), all = m.tabs[0].entries; return { status: m.status, first: all[0].name, firstOn: all[0].enabled !== false, recipeOn: all.find(e => /^Wypal węgiel/.test(e.name)).enabled !== false, collectable: Farming.jobCollectable(b), ready: Farming.jobReady(b),
            badge: SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b === b).badge.visible }; })()`);
        check("B6 after the first 6 h: 'Trwa wypalanie 2/3', 'Zbierz: Węgiel drzewny ×3' on top (the rest still firing: the recipes wait), the ready badge shows",
            /^Trwa wypalanie 2\/3/.test(mid.status.text) && mid.first === "Zbierz: Węgiel drzewny ×3" && mid.firstOn && !mid.recipeOn && mid.collectable === 1 && !mid.ready, mid);
        await frames(20);
        check("B6b the station's ready badge (the charcoal icon over it) shows while the other two still fire", await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b === ${kiln}).badge.visible`));
        const c0 = await count(79);
        await ev(`(function(){ const b = ${kiln}, m = Farming.menuFor(b.x, b.y); m.tabs[0].entries[0].run(); return 0; })()`);
        await frames(100);
        mid = await J(`(function(){ const b = ${kiln}; return { job: !!b.job, taken: b.job && b.job.taken, left: Farming.jobHoursLeft(b) }; })()`);
        check("B7 'Zbierz' takes the finished one (+3 charcoal); the other two keep firing", (await count(79)) === c0 + 3 && mid.job && mid.taken === 1 && mid.left > 11 && mid.left < 12, Object.assign({ c: await count(79) }, mid));
        await ev(`$gameSystem.advanceDayNight(12.5); 0`);
        const done = await J(`(function(){ const b = ${kiln}, m = Farming.menuFor(b.x, b.y); return { status: m.status, first: m.tabs[0].entries[0].name, ready: Farming.jobReady(b) }; })()`);
        check("B8 all done: 'Gotowe: Węgiel drzewny ×6' (ready), 'Zbierz: Węgiel drzewny ×6'", done.ready && done.status.text === "Gotowe: Węgiel drzewny ×6" && done.status.ready && done.first === "Zbierz: Węgiel drzewny ×6", done);
        await ev(`Farming.collectJob(${kiln}); 0`);
        await frames(100);
        check("B9 collected: +6, the kiln is free", (await count(79)) === c0 + 9 && !(await ev(`!!${kiln}.job`)), await count(79));
        // an old save's job (no count): works as it always did
        await ev(`(function(){ const b = ${kiln}; b.job = { recipe: "charcoal", start: Farming.clockHours() - 7, hours: 6, out: [79, 3] }; return 0; })()`);
        const old = await J(`(function(){ const b = ${kiln}, m = Farming.menuFor(b.x, b.y); return { ready: Farming.jobReady(b), n: Farming.jobCollectable(b), status: m.status.text, first: m.tabs[0].entries[0].name }; })()`);
        await ev(`Farming.collectJob(${kiln}); 0`);
        await frames(100);
        check("B10 an old job without a count: ready, 'Gotowe: Węgiel drzewny ×3', 'Zbierz' gives 3 and ends it", old.ready && old.n === 1 && old.status === "Gotowe: Węgiel drzewny ×3" && old.first === "Zbierz: Węgiel drzewny ×3" && (await count(79)) === c0 + 12 && !(await ev(`!!${kiln}.job`)), old);
        // a finished queue not collected yet: choosing a recipe takes it all into the bag first (takeReadyFirst), then starts
        await ev(`(function(){ const b = ${kiln}; b.job = { recipe: "charcoal", start: Farming.clockHours() - 13, hours: 12, each: 6, count: 2, taken: 0, out: [79, 3] }; $gameParty.gainItem($dataItems[Farming.ITEM.wood], 10); $gameParty.gainItem($dataItems[Farming.ITEM.soil], 4); return 0; })()`);
        await ev(`(function(){ const b = ${kiln}, m = Farming.menuFor(b.x, b.y); m.tabs[0].entries.find(e => /^Wypal węgiel/.test(e.name)).run(); return 0; })()`);
        await frames(100);
        const tr = await J(`(function(){ const b = ${kiln}; return { job: b.job, save: JSON.stringify(JsonEx.parse(JsonEx.stringify(b.job))) === JSON.stringify(b.job) }; })()`);
        check("B11 a finished queue of 2 waiting: a new recipe takes both (+6) first, then starts - with the last chosen count (×3) cut to what the bag pays for (×2); saved and loaded the same",
            (await count(79)) === c0 + 18 && tr.job && tr.job.count === 2 && tr.job.hours === 12 && tr.job.taken === 0 && tr.save, Object.assign({ c: await count(79) - c0 }, tr));
        await ev(`${kiln}.job = null; 0`);
        await press("cancel");
        // at a fire: only as many as its fuel lasts for; a roast on a stick (the campfire) is always one - he sits there with it
        const cAt = await spotFor("cauldron");
        const cq = await J(`(function(){ const f = $gameSystem._farm, list = f.buildings[3]; const b = { id: f.nextId++, type: "cauldron", x: ${cAt.x}, y: ${cAt.y}, last: 1, v: 3, fuel: 7, fuelSince: Farming.clockHours() }; list.push(b); f.rev++;
            for (const [id, n] of [[71, 10], [72, 10], [73, 10], [94, 10], [138, 1]]) $gameParty.gainItem($dataItems[id], n); Farming.setBagWater(6);
            const R = id => Farming.recipeOf(b, id), out = { soup: Farming.queueMax(b, R("soup")), stew: Farming.queueMax(b, R("stew")) };
            const e = Farming.menuFor(b.x, b.y).tabs[0].entries.find(e => e.name === "Ugotuj zupę"); out.soupQty = e && e.qty;
            list.splice(list.indexOf(b), 1);
            const c = { id: f.nextId++, type: "campfire", x: ${cAt.x}, y: ${cAt.y}, last: 1, v: 3, fuel: 7, fuelSince: Farming.clockHours() }; list.push(c); f.rev++;
            const r0 = Farming.menuFor(c.x, c.y).tabs[0].entries.find(e => e.name === "Upiecz mięso zająca"); out.stick = r0 ? { enabled: r0.enabled !== false, qty: !!r0.qty } : null;
            list.splice(list.indexOf(c), 1); f.rev++;
            for (const [id, n] of [[71, 10], [72, 10], [73, 10], [94, 10]]) $gameParty.loseItem($dataItems[id], n); Farming.setBagWater(0); return out; })()`);
        check("B12 at a fire (the cauldron) as many as its fuel lasts for: 7 h of fire -> soup (3 h) ×2, stew (4 h) ×1; roasting hare on a stick: no count",
            cq.soup === 2 && cq.stew === 1 && cq.soupQty && cq.soupQty.max === 2 && cq.stick && cq.stick.enabled && !cq.stick.qty, cq);

        // ================================================================== D. the rain barrel
        const D0 = await J(`(function(){ const d = Farming.BUILDINGS.barrel; return d && { name: d.name, cost: d.cost, rain: d.rain, image: d.image, full: d.imageFull, instant: !!d.instant, inQ: Farming.menuFor && true }; })()`);
        check("D1 'Beczka na deszczówkę': planks and nails, a rain vessel of 10-12 portions, built on a site with the hammer (not instant)",
            D0 && D0.name === "Beczka na deszczówkę" && D0.cost.some(c => c[0] === 80) && D0.cost.some(c => c[0] === 88) && D0.rain.max >= 10 && D0.rain.max <= 12 && !D0.instant, D0);
        await ev(`ImageManager.loadSystem("Farm_Barrel"); ImageManager.loadSystem("Farm_Barrel_Full"); 0`);
        await frames(30);
        const pics = await J(`[ImageManager.loadSystem("Farm_Barrel"), ImageManager.loadSystem("Farm_Barrel_Full")].map(p => ({ ok: p.isReady() && !p.isError(), w: p.width, h: p.height }))`);
        check("D2 both pictures load (empty and full)", pics.every(p => p.ok && p.w > 20 && p.h > 30), pics);
        await ev(`(function(){ for (const [id, n] of Farming.BUILDINGS.barrel.cost) $gameParty.gainItem($dataItems[id], n); $gameParty.gainItem($dataItems[Farming.ITEM.hammer], 1); $gamePlayer.locate(26, 17); return 0; })()`);
        await frames(5);
        const qList = await J(`(function(){ Farming.openBuildKeyMenu(); const m = SceneManager._scene._farmMenu; const e = m._entries.find(e => e.name === "Beczka na deszczówkę"); const r = e ? { enabled: e.enabled !== false } : null; SceneManager._scene.closeFarmMenu(); return r; })()`);
        check("D3 it is on the Q build list (enabled with the materials in the bag)", qList && qList.enabled, qList);
        const bAt = await spotFor("barrel");
        const site = await J(`(function(){ const p0 = $gameParty.numItems($dataItems[80]), n0 = $gameParty.numItems($dataItems[88]); const ok = Farming.placeSite("barrel", ${bAt.x}, ${bAt.y}); const b = Farming.buildingAt(${bAt.x}, ${bAt.y});
            return { ok, site: b && b.site, planks: p0 - $gameParty.numItems($dataItems[80]), nails: n0 - $gameParty.numItems($dataItems[88]) }; })()`);
        check("D4 a building site: the planks (8) and nails (6) are paid", site.ok && site.site && site.site.need >= 2 && site.planks === 8 && site.nails === 6, site);
        for (let i = 0; i < 40 && (await ev(`!!Farming.buildingAt(${bAt.x}, ${bAt.y}).site`)); i++) {
            await ev(`(function(){ $gameSystem.setStamina(100); const b = Farming.buildingAt(${bAt.x}, ${bAt.y}); if (!$gamePlayer.isToolSwinging()) Farming.strikeSite(b, ${bAt.x}, ${bAt.y}); return 0; })()`);
            await frames(30);
        }
        const barrel = `Farming.buildingAt(${bAt.x}, ${bAt.y})`;
        check("D5 struck with the hammer until it stands", !(await ev(`!!${barrel}.site`)));
        // the rain of the weather plan, also while nobody looks: a month of weather fills it to the top (12), no more
        const rain = await J(`(function(){ const b = ${barrel}; const now = Farming.clockHours(); b.water = 0; b.wt = now - 24 * 30; const n = Farming.bucketUnits(b);
            let day = $gameSystem.dayNightDay(), plan = null; for (let d = day + 1; d < day + 200; d++) { const p = Survival.weatherPlan(d); if (p && p.type === "rain" && p.end - p.start >= 4) { day = d; plan = p; break; } }
            return { full: n, day, plan }; })()`);
        check("D6 a month of the weather plan fills it, but only to 12", rain.full === 12, rain);
        const day0 = await ev("$gameSystem.dayNightDay()");
        const hour = await J(`(function(){ const b = ${barrel}; const d = ${rain.day}, p = ${JSON.stringify(rain.plan)}; $gameSystem._dayNightDay = d; $gameSystem.setDayNightHour(p.start + 4); b.water = 0; b.wt = d * 24 + p.start; return { units: Farming.bucketUnits(b), rate: Farming.BUILDINGS.barrel.rain.rate }; })()`);
        check("D7 four hours of rain: 4 × its rate (a wide mouth catches more than the bucket's one portion an hour)", hour.units === Math.floor(4 * hour.rate) && hour.rate > 1, hour);
        await ev(`(function(){ $gameSystem._dayNightDay = ${day0}; $gameSystem.setDayNightHour(12); const b = ${barrel}; b.water = 12; b.wt = Farming.clockHours(); Survival.calmWeather(); $gameScreen.clearWeather(); return 0; })()`);
        await frames(40);
        const bm = await J(`(function(){ const b = ${barrel}, m = Farming.menuFor(b.x, b.y); return { title: m.title, names: m.entries.map(e => e.name), pic: SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b === b).sprite.bitmap._url.split("/").pop() }; })()`);
        check("D8 its menu: 'Beczka na deszczówkę (12/12)', water in the barrel, drink, fill the waterskin / can / bucket, pour out; the full picture",
            bm.title === "Beczka na deszczówkę (12/12)" && ["Woda w beczce: 12/12", "Napij się", "Napełnij bukłak", "Napełnij konewkę", "Napełnij wiadro", "Wylej wodę"].every(n => bm.names.includes(n)) && bm.pic === "Farm_Barrel_Full.png", bm);
        await ev(`(function(){ Needs.setEnabled(true); const n = Needs.state(); n.water = 40; n.food = 80; const b = ${barrel}; Farming.menuFor(b.x, b.y).entries.find(e => e.name === "Napij się").run(); return 0; })()`);
        await frames(90);
        const drank = await J(`({ water: Needs.state().water, left: Farming.bucketUnits(${barrel}) })`);
        check("D9 'Napij się' at the barrel: +40 water, one portion less (11)", drank.water > 79.5 && drank.water <= 80 && drank.left === 11, drank);

        // ================================================================== E. the bigger waterskin
        const tAt = await spotFor("tannery");
        await putUp("tannery", tAt);
        const tannery = `Farming.buildingAt(${tAt.x}, ${tAt.y})`;
        const skinEntry = () => J(`(function(){ const b = ${tannery}, m = Farming.menuFor(b.x, b.y), e = m.tabs[0].entries.find(e => e.name === "Powiększ bukłak"); return e ? { enabled: e.enabled !== false, help: e.help } : null; })()`);
        await ev(`$gameParty.gainItem($dataItems[Farming.ITEM.hide], 2); $gameParty.gainItem($dataItems[Farming.ITEM.sinew], 4); 0`);
        let se = await skinEntry();
        check("E1 the tannery has 'Powiększ bukłak'; without a waterskin it is greyed out", se && !se.enabled && /Bukłak/.test(se.help), se);
        await ev(`$gameParty.gainItem($dataItems[129], 1); 0`);
        se = await skinEntry();
        const before = await J(`({ max: Needs.SKIN.max, hide: $gameParty.numItems($dataItems[Farming.ITEM.hide]), sinew: $gameParty.numItems($dataItems[Farming.ITEM.sinew]) })`);
        check("E2 with the waterskin it can be done; the waterskin holds 4", se && se.enabled && before.max === 4, { se, before });
        await ev(`(function(){ $gameSystem.setStamina(100); const b = ${tannery}; Farming.menuFor(b.x, b.y).tabs[0].entries.find(e => e.name === "Powiększ bukłak").run(); return 0; })()`);
        await frames(120);
        const after = await J(`({ max: Needs.SKIN.max, hide: $gameParty.numItems($dataItems[Farming.ITEM.hide]), sinew: $gameParty.numItems($dataItems[Farming.ITEM.sinew]), skin: $gameParty.numItems($dataItems[129]), big: Needs.skinBig() })`);
        check("E3 done: the waterskin holds 8 sips (the same item, no new one); a tanned hide and 2 sinews used", after.max === 8 && after.big && after.skin === 1 && after.hide === before.hide - 1 && after.sinew === before.sinew - 2, after);
        se = await skinEntry();
        check("E4 a second time: greyed out, it is already bigger", se && !se.enabled && /już/.test(se.help), se);
        await ev(`(function(){ Needs.state().skin = 0; const b = ${barrel}; Farming.menuFor(b.x, b.y).entries.find(e => e.name === "Napełnij bukłak").run(); return 0; })()`);
        await frames(90);
        const filled = await J(`({ skin: Needs.skinCharges(), left: Farming.bucketUnits(${barrel}) })`);
        check("E5 filled at the barrel: 8 sips (8 portions of 11 taken)", filled.skin === 8 && filled.left === 3, filled);
        await ev("Needs.state().water = 50; Needs.drinkFromSkin(); 0");
        check("E6 a sip from it: 7/8 left", (await ev("Needs.skinCharges()")) === 7);

        // ================================================================== F. the last bit of strength
        const food = await J(`(function(){ const p = $gamePlayer, out = [];
            for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) {
                const k = Farming.gatherAt(x, y); if (!k) continue;
                const item = k === "bush" ? (Farming.bushState(x, y) === "full" ? 102 : 0) : Farming.GATHER[k].item;
                if (item && FoodTable.edible(item)) out.push({ x, y, k, item });
            }
            let stone = null; for (let y = 1; y < $gameMap.height() - 1 && !stone; y++) for (let x = 1; x < $gameMap.width() - 1 && !stone; x++) if (Farming.gatherAt(x, y) === "stone") stone = { x, y };
            return { food: out.slice(0, 3), stone }; })()`);
        check("F0 food lying on the home field (berries on a bush, garlic, a wild vegetable...) and a stone", food.food.length >= 2 && !!food.stone, food);
        const pick = async (t, need) => {
            await ev(`(function(){ Needs.setEnabled(true); const n = Needs.state(); n.food = ${need.food}; n.water = ${need.water}; $gameSystem.setStamina(0); $gamePlayer.locate(${t.x}, ${t.y + 1}); $gamePlayer.setDirection(8); window.__pops.length = 0; return 0; })()`);
            await frames(4);
            const item = t.item || 64, n0 = await count(item);
            const ok = await ev(`Farming.pickGather(${t.x}, ${t.y})`);
            await frames(90);
            return { ok, got: (await count(item)) - n0, st: await ev("$gameSystem.stamina()"), pops: await pops() };
        };
        let r = await pick(food.food[0], { food: 10, water: 60 });
        check("F1 starving (fullness 10) at 0 strength: picking food works and costs nothing", r.ok && r.got > 0 && r.st === 0 && !r.pops.some(p => /zmęczony/.test(p)), r);
        r = await pick(food.food[1], { food: 60, water: 15 });
        check("F2 parched (water 15) at 0 strength: the same", r.ok && r.got > 0 && !r.pops.some(p => /zmęczony/.test(p)), r);
        r = await pick(food.stone, { food: 10, water: 10 });
        check("F3 ...but a stone still takes strength (only food is free)", !r.ok && r.got === 0 && r.pops.some(p => /zmęczony/.test(p)), r);
        const f3 = food.food[2] || food.food[0];
        await ev(`(function(){ const f = $gameSystem._farm; f.stones = f.stones || {}; f.stones[3] = f.stones[3] || {}; delete f.stones[3]["${f3.x},${f3.y}"]; f.bushes = f.bushes || {}; f.bushes[3] = f.bushes[3] || {}; delete f.bushes[3]["${f3.x},${f3.y}"]; return 0; })()`);
        r = await pick(f3, { food: 60, water: 60 });
        check("F4 fed and watered at 0 strength: picking food is work again (too tired)", !r.ok && r.pops.some(p => /zmęczony/.test(p)), r);
        // a ripe potato at 0 strength, starving
        const ripe = await J(`(function(){ const f = $gameSystem._farm, P = (f.plots[3] = f.plots[3] || {}); const p = $gamePlayer;
            for (let r = 1; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = p.x + dx, y = p.y + dy;
                const pl = Farming.plotAt(x, y); if (!pl || pl.s !== "cleared" || !pl.natural || Farming.gatherAt(x, y) || !$gameMap.checkPassage(x, y + 1, 0x0f)) continue;
                P[x + "," + y] = { s: "tilled", crop: "potato", day: $gameSystem.dayNightDay() - 20 }; f.rev++; return { x, y }; }
            return null; })()`);
        await ev(`(function(){ const n = Needs.state(); n.food = 5; n.water = 60; $gameSystem.setStamina(0); window.__pops.length = 0; return 0; })()`);
        const p0 = await count(71);
        const hv = await ev(`Farming.harvest(${ripe.x}, ${ripe.y})`);
        await frames(90);
        check("F5 starving at 0 strength: a ripe crop can be harvested", hv === true && (await count(71)) > p0, { hv, got: (await count(71)) - p0, pops: await pops() });
        const de = await J(`(function(){ $gameSystem.setStamina(0); const n = Needs.state(); n.food = 5; n.water = 5; $gameParty.gainItem($dataItems[102], 1); const can = $gameParty.canUse($dataItems[102]); $gameParty.leader().useItem($dataItems[102]); return { can, food: n.food, water: n.water }; })()`);
        check("F6 ...and eating (berries) works at 0 strength", de.can && de.food === 13 && de.water === 15, de);
        const w0 = await ev("Needs.state().water");
        await ev(`(function(){ $gameSystem.setStamina(0); const b = ${barrel}; b.water = 3; b.wt = Farming.clockHours(); Farming.menuFor(b.x, b.y).entries.find(e => e.name === "Napij się").run(); return 0; })()`);
        await frames(90);
        const w1 = await ev("Needs.state().water");
        check("F7 ...and drinking (at the barrel) too", w1 > w0 + 39.5, { w0, w1 });
        await ev("Needs.setEnabled(false); $gameSystem.setStamina(100); 0");

        // ================================================================== C. building only on the grandfather's field
        const home = await J(`({ here: Farming.mapAllowsBuilding(), hut: Farming.mapAllowsBuilding(100), meadow: Farming.mapAllowsBuilding(4), maps: Farming.BUILD_MAPS })`);
        check("C1 building is allowed on the home field (3) and in the hut (100), not on the meadow (4)", home.here && home.hut && !home.meadow, home);
        await ev(`$gamePlayer.reserveTransfer(4, 20, 20, 2, 0); 0`);
        for (let i = 0; i < 60; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !SceneManager.isSceneChanging() && $gameMap.mapId()===4 && !$gamePlayer.isTransferring()").catch(() => false)) break; await sleep(300); }
        await frames(30);
        await ev("SceneManager._scene.startFadeIn(1,false); Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
        const spot = await J(`(function(){ const p = $gamePlayer; for (let r = 0; r < 25; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = p.x + dx, y = p.y + dy;
            if (Farming.naturalFarmland(x, y) && Farming.naturalFarmland(x + 1, y) && Farming.naturalFarmland(x, y + 1) && !Farming.gatherAt(x, y) && !Farming.gatherAt(x + 1, y) && !Farming.gatherAt(x, y + 1)) return { x, y }; } return null; })()`);
        await ev(`$gamePlayer.locate(${spot.x}, ${spot.y + 1}); $gamePlayer.setDirection(8); 0`);
        await frames(10);
        const why = await J(`({ chest: Farming.whyNotBuild("chest_s", ${spot.x}, ${spot.y}), snare: Farming.whyNotBuild("snare", ${spot.x}, ${spot.y}), f9: Farming.whyNotBuild("chest_s", ${spot.x}, ${spot.y}, false, true), problem: Farming.placementProblem("chest_s", ${spot.x}, ${spot.y}) })`);
        check("C2 on the meadow a chest may not stand ('Budować możesz tylko na polu dziadka.'), a snare may; the F9 placer ignores the rule",
            why.chest === "Budować możesz tylko na polu dziadka." && why.snare === null && why.f9 === null && why.problem === why.chest, why);
        await ev("window.__pops.length = 0; $gameParty.gainItem($dataItems[Farming.ITEM.planks], 20); 0");
        await press("pageup"); await frames(15);
        const qm = await J(`(function(){ const m = SceneManager._scene._farmMenu; return { open: !!$gameTemp._farmMenuOpen, names: m._entries.map(e => e.name) }; })()`);
        const qp = await pops();
        check("C3 Q on the meadow: a popup over the player 'Budować możesz tylko na polu dziadka'; the list has only the snare", qp.some(p => /^Budować możesz tylko na polu dziadka/.test(p)) && qm.open && qm.names.includes("Pułapka") && !qm.names.includes("Mała skrzynia") && !qm.names.includes("Warsztat"), { qp, qm });
        await press("pageup"); await frames(10);
        await press("ok"); await frames(20);
        const gm = await J(`(function(){ const m = SceneManager._scene._farmMenu; return { open: !!$gameTemp._farmMenuOpen, names: m._entries.map(e => e.name) }; })()`);
        await ev("if ($gameTemp._farmMenuOpen) SceneManager._scene.closeFarmMenu(); 0");
        // (the user, 2026-09-27: the tent, the forest bed, the bucket and the clay pot may be put down anywhere - on the road too)
        const c4 = await J(`(function(){ const p = $gamePlayer, x = p.x, y = p.y - 2, w = t => Farming.whyNotBuild(t, x, y, false, false) || "";
            return { tent: w("tent"), bedroll: w("bedroll"), bucket: w("bucket"), pot: w("clay_pot"), workbench: w("workbench") }; })()`);
        check("C4 on the meadow the tent, the forest bed, the bucket and the clay pot may be put down (anywhere); a building may not", gm.names.includes("Postaw...") &&
            ["tent", "bedroll", "bucket", "pot"].every(k => !/tylko na polu/.test(c4[k])) && /tylko na polu/.test(c4.workbench), c4);
        await ev("if ($gameTemp._farmMenuOpen) SceneManager._scene.closeFarmMenu(); 0");
        const tag = await J(`(function(){ const n0 = $dataMap.note; $dataMap.note = n0 + " <Build:on>"; const on = Farming.mapAllowsBuilding(); $dataMap.note = n0 + " <Build: off>"; const off = Farming.mapAllowsBuilding(); $dataMap.note = n0; return { on, off, back: Farming.mapAllowsBuilding() }; })()`);
        check("C5 a map note <Build:on> / <Build:off> overrides the list (data-driven)", tag.on === true && tag.off === false && tag.back === false, tag);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
