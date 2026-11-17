// Krosno i nowy ekwipunek (docs/ekwipunek/NOWE_80.md, 2026-11-17; Farming_Data.js BUILDINGS.loom / loom_wheel, Bron_Data.js PRZEPISY, SUROWCE,
// LUP.surowce, Bron.js; przedmioty w data/Items.json - tools/ekwipunek_nowy/instaluj.py). Sprawdza na działce dziadka (Map218):
//   - krosno: dane (koszt, 3 x 2, w chatce też, obrazek Farm_Loom_L), stawia się na działce dziadka (plac budowy, materiały zabrane), poza nią nie;
//   - tkanie: płótno z 6 włókien (3 h), sukno z 2 wełny (4 h) - praca idzie sama, potem odbiór;
//   - szycie przy krośnie: pikowane rękawice (nowa zbroja, 1 płótno + 1 wełna, z Nożycami - bez nich odmowa), wełniane rękawiczki (ubranie);
//   - kołowrotek: rozbudowa na miejscu (3 x 2 w 3 x 2), płótno z 4 włókien w 2 h, te same przepisy szycia;
//   - kuźnia: „Przetop monety” - 4 zaśniedziałe monety + węgiel -> sztabka brązu; nowy przepis (Brązowy hełm z nosalem, poziom 8) widać od
//     poziomu 4, nie wcześniej; stal zakonna tylko z Młotkiem majstra; kowal Tadek sprzedaje 2 sztabki brązu dziennie;
//   - surowce z łupów: nić pajęcza tylko na piętrach 31-50, bossowie 70 i 90 ze stalą zakonną; brak błędów w konsoli.
//   node tests/run.js krosno --port 9482
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9482, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    t.check("nowa gra na działce dziadka (Map218)", await t.newGame({ map: 218, x: 30, y: 20, dir: 8, hour: 9, quiet: true, minimap: false }));
    await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); Combat.hero().level = 1; Combat.hero().rev = (Combat.hero().rev || 0) + 1; $gameSystem.setStamina(250); 0");

    // ---------------------------------------------------------------- 1. the data
    const def = await J(`(function(){ const L = Farming.BUILDINGS.loom, W = Farming.BUILDINGS.loom_wheel, F = Farming.BUILDINGS.forge;
        return { name: L.name, cost: L.cost, w: L.w, h: L.h, indoor: !!L.indoor, image: L.image, up: L.upgrade && L.upgrade.to, upCost: L.upgrade && L.upgrade.cost,
            rec: L.recipes.filter(r => !r.bron).map(r => [r.id, r.inputs, r.output, r.hours]), wheel: W && { image: W.image, noBuild: !!W.noBuild, rec: W.recipes.filter(r => !r.bron).map(r => [r.id, r.inputs, r.output, r.hours]) },
            melt: (F.recipes.find(r => r.id === "melt_coins") || {}).inputs, items: [483, 484, 485, 486, 487, 488, 489, 490, 491, 284, 299, 419, 482].map(i => $dataItems[i] && $dataItems[i].name) }; })()`);
    t.check("krosno: 6 desek, 2 drewna, 4 sznurki, 4 gwoździe; 3 x 2; stoi też w chatce; własny obrazek (Farm_Loom_L, z kołowrotkiem Farm_LoomWheel_L); rozbudowa na krosno z kołowrotkiem (2 deski, sznurek, 2 gwoździe)",
        def.name === "Krosno" && JSON.stringify(def.cost) === "[[80,6],[61,2],[93,4],[88,4]]" && def.w === 3 && def.h === 2 && def.indoor && def.image === "Farm_Loom_L" && def.wheel && def.wheel.image === "Farm_LoomWheel_L" &&
        def.up === "loom_wheel" && JSON.stringify(def.upCost) === "[[80,2],[93,1],[88,2]]" && def.wheel && def.wheel.noBuild, def);
    t.check("tkanie: płótno z 6 włókien (3 h), sukno z 2 wełny (4 h); z kołowrotkiem płótno z 4 (2 h), sukno 3 h; kuźnia: przetop 4 monet + węgiel; nowe przedmioty w bazie",
        JSON.stringify(def.rec) === '[["weave_linen",[[92,6]],[483,1],3],["weave_wool",[[111,2]],[484,1],4]]' &&
        JSON.stringify(def.wheel.rec) === '[["weave_linen",[[92,4]],[483,1],2],["weave_wool",[[111,2]],[484,1],3]]' && JSON.stringify(def.melt) === "[[194,4],[79,1]]" &&
        def.items.every(Boolean), def);

    // ---------------------------------------------------------------- 2. built on grandpa's plot (the real rules), not off it
    const spot = await J(`(function(){ const m = $gameMap.mapId(), f = $gameSystem._farm, P = f.plots[m] = f.plots[m] || {};
        const clear = (x, y) => { for (let yy = y - 1; yy <= y; yy++) for (let xx = x; xx < x + 3; xx++) if (!P[xx + "," + yy]) P[xx + "," + yy] = { s: "cleared" }; f.rev++; };
        const ok = (x, y) => { for (let yy = y - 1; yy <= y; yy++) for (let xx = x; xx < x + 3; xx++) if (!$gameMap.isValid(xx, yy) || !$gameMap.checkPassage(xx, yy, 0x0f) || $gameMap.eventsXy(xx, yy).length || Farming.hasObjectTile(xx, yy) || Farming.buildingAt(xx, yy) || $gameMap.regionId(xx, yy) !== 8) return false; return true; };
        let at = null, off = null;
        for (let r = 0; r < 20 && !at; r++) for (let y = 14 - r; y <= 14 + r && !at; y++) for (let x = 26 - r; x <= 26 + r && !at; x++) {
            if (!ok(x, y)) continue;
            const before = JSON.stringify(P); clear(x, y);
            if (!Farming.whyNotBuild("loom", x, y)) at = { x, y }; else { for (const k of Object.keys(P)) if (before.indexOf('"' + k + '"') < 0) delete P[k]; }
        }
        for (let y = 2; y < $gameMap.height() - 2 && !off; y++) for (let x = 2; x < $gameMap.width() - 4 && !off; x++)
            if ($gameMap.regionId(x, y) !== 8 && $gameMap.checkPassage(x, y, 0x0f) && !Farming.buildingAt(x, y)) off = { x, y, why: Farming.whyNotBuild("loom", x, y) };
        return { at, off }; })()`);
    t.check("na działce dziadka (region 8) krosno da się postawić; poza działką - odmowa", !!spot.at && !!spot.off && !!spot.off.why, spot);
    if (!spot.at) return;
    const { x, y } = spot.at;
    await t.eval("[[80, 6], [61, 2], [93, 4], [88, 4], [89, 1]].forEach(([id, n]) => $gameParty.gainItem($dataItems[id], n)); 0");
    const ok0 = await t.eval(`Farming.build("loom", ${x}, ${y})`);
    await t.until(`!!Farming.buildingAt(${x}, ${y})`, 8, 50);   // (it goes up after the crouch)
    await t.frames(20);
    const built = await J(`(function(){ const b = Farming.buildingAt(${x}, ${y});
        return { ok: ${ok0}, type: b && b.type, at: b && [b.x, b.y], site: !!(b && b.site), left: [80, 61, 93, 88].map(i => $gameParty.numItems($dataItems[i])) }; })()`);
    t.check("Farming.build: krosno stoi na działce, materiały zabrane", built.ok === true && built.type === "loom" && JSON.stringify(built.at) === JSON.stringify([x, y]) && !built.site &&
        built.left.join() === "0,0,0,0", built);
    await t.eval(`$gamePlayer.locate(${x + 1}, ${y + 1}); $gamePlayer.setDirection(8); 0`);
    await t.frames(10);
    const menu = await J(`Farming.menuFor(${x + 1}, ${y}).entries.map(e => e.name)`);
    t.check("menu krosna: Utkaj płótno, Utkaj sukno, Uszyj..., Dobuduj kołowrotek", menu.some(n => /^Utkaj płótno/.test(n)) && menu.some(n => /^Utkaj sukno/.test(n)) &&
        menu.some(n => /^Uszyj: pikowane rękawice/.test(n)) && menu.some(n => /^Dobuduj kołowrotek/.test(n)), menu);

    // ---------------------------------------------------------------- 3. weaving: works by itself, collected after
    const weave = async (recipe, inputs, out, hours) => {
        for (const [id, n] of inputs) await t.give(id, n);
        const before = await t.count(out);
        const started = await t.eval(`Farming.startJob(Farming.buildingAt(${x}, ${y}), ${JSON.stringify(recipe)})`);
        await t.until(`!!Farming.buildingAt(${x}, ${y}).job`, 8, 50);   // (the job begins after the crouch)
        const spent = await J(JSON.stringify(inputs.map(([id]) => id)) + ".map(i => $gameParty.numItems($dataItems[i]))");
        const early = await t.eval(`Farming.jobReady(Farming.buildingAt(${x}, ${y}))`);
        await t.eval(`$gameSystem.advanceDayNight(${hours} + 0.05); 0`);
        const ready = await t.eval(`Farming.jobReady(Farming.buildingAt(${x}, ${y}))`);
        await t.eval(`Farming.collectJob(Farming.buildingAt(${x}, ${y})); 0`);
        await t.until(`$gameParty.numItems($dataItems[${out}]) > ${before}`, 8, 50);
        await t.frames(30);
        return { started, spent, early, ready, got: (await t.count(out)) - before };
    };
    const linen = await weave("weave_linen", [[92, 6]], 483, 3);
    t.check("utkane płótno: 6 włókien zużyte, po 3 godzinach gotowe, odebrane", linen.started === true && linen.spent.join() === "0" && !linen.early && linen.ready && linen.got === 1, linen);
    const wool = await weave("weave_wool", [[111, 2]], 484, 4);
    t.check("utkane sukno: 2 wełny zużyte, po 4 godzinach gotowe, odebrane", wool.started === true && wool.spent.join() === "0" && !wool.early && wool.ready && wool.got === 1, wool);

    // ---------------------------------------------------------------- 4. sewing a new thing at the loom (the shears in the bag)
    await t.eval("Bron.syncRecipes(); $gameParty.loseItem($dataItems[142], 9); $gameParty.gainItem($dataItems[111], 1); 0");
    const sewR = await J(`(function(){ const r = Farming.BUILDINGS.loom.recipes.find(r => r.id === "bron_435"); return r && { name: r.name, inputs: r.inputs, tool: r.tool, manual: r.manual }; })()`);
    const noShears = await t.eval(`Farming.craftManual(Farming.buildingAt(${x}, ${y}), Farming.BUILDINGS.loom.recipes.find(r => r.id === "bron_435"))`);
    await t.give(142, 1);
    const sewn = await t.eval(`Farming.craftManual(Farming.buildingAt(${x}, ${y}), Farming.BUILDINGS.loom.recipes.find(r => r.id === "bron_435"))`);
    await t.until("$gameParty.numItems($dataItems[435]) > 0", 8, 50);
    await t.frames(40);
    const after = await J(`({ n: [435, 483, 111, 142].map(i => $gameParty.numItems($dataItems[i])), armor: !!Tawerna.api("Combat_parts").fight.ARMORS[435], part: Equipment.WEARABLE[435] })`);
    t.check("uszyte pikowane rękawice (nowa zbroja): bez Nożyc odmowa, z nimi - płótno i wełna zużyte, Nożyce zostają; rękawice to zbroja na ręce",
        !!sewR && /^Uszyj: pikowane rękawice/.test(sewR.name) && sewR.tool === 142 && noShears === false && sewn === true && after.n.join() === "1,0,0,1" && after.armor && after.part === "hands",
        { sewR, noShears, sewn, after });
    await t.give(111, 2);
    const mitts = await t.eval(`Farming.craftManual(Farming.buildingAt(${x}, ${y}), Farming.BUILDINGS.loom.recipes.find(r => r.id === "bron_289"))`);
    await t.until("$gameParty.numItems($dataItems[289]) > 0", 8, 50);
    await t.frames(40);
    const m2 = await J("({ n: $gameParty.numItems($dataItems[289]), part: Equipment.WEARABLE[289], cloak: Equipment.WEARABLE[295] })");
    t.check("ubranie z krosna: wełniane rękawiczki z 2 wełny (bez poziomu); płaszcze na części „Płaszcz”", mitts === true && m2.n === 1 && m2.part === "hands" && m2.cloak === "cloak", m2);

    // ---------------------------------------------------------------- 5. the spinning wheel: grown in place
    await t.eval("[[80, 2], [93, 1], [88, 2]].forEach(([id, n]) => $gameParty.gainItem($dataItems[id], n)); $gameSystem.setStamina(250); 0");
    const up = await t.eval(`Farming.upgradeBuilding(Farming.buildingAt(${x}, ${y}))`);
    await t.until(`(Farming.buildingAt(${x}, ${y}) || {}).type === "loom_wheel"`, 8, 50);
    await t.frames(20);
    const wheel = await J(`(function(){ const b = Farming.buildingAt(${x}, ${y}); Bron.syncRecipes(); return { type: b && b.type, at: b && [b.x, b.y], left: [80, 93, 88].map(i => $gameParty.numItems($dataItems[i])),
        sew: Farming.BUILDINGS.loom_wheel.recipes.filter(r => r.bron).length, sewLoom: Farming.BUILDINGS.loom.recipes.filter(r => r.bron).length }; })()`);
    t.check("kołowrotek dobudowany w miejscu krosna (te same pola), materiały zabrane, szycie to samo co przy krośnie",
        up === true && wheel.type === "loom_wheel" && JSON.stringify(wheel.at) === JSON.stringify([x, y]) && wheel.left.join() === "0,0,0" && wheel.sew > 30 && wheel.sew === wheel.sewLoom, wheel);
    const linen2 = await weave("weave_linen", [[92, 4]], 483, 2);
    t.check("z kołowrotkiem: płótno z 4 włókien w 2 godziny", linen2.started === true && linen2.spent.join() === "0" && !linen2.early && linen2.ready && linen2.got === 1, linen2);

    // ---------------------------------------------------------------- 6. the forge: bronze from the coins, a new recipe at its level, the order's steel
    const forge = await J(`(function(){ const m = $gameMap.mapId(), f = $gameSystem._farm, P = f.plots[m] = f.plots[m] || {};
        for (let r = 0; r < 20; r++) for (let yy = 14 - r; yy <= 14 + r; yy++) for (let xx = 26 - r; xx <= 26 + r; xx++) {
            if (Math.abs(xx - ${x}) < 5 && Math.abs(yy - ${y}) < 4) continue;
            if (!Farming.whyNotBuild("forge", xx, yy, false, true) && Farming.placeFree("forge", xx, yy)) return { x: xx, y: yy };
        }
        return null; })()`);
    t.check("kuźnia na działce", !!forge, forge);
    if (forge) {
        await t.give(194, 4); await t.give(79, 1);
        const n0 = await t.count(485);
        const melt = await t.eval(`Farming.startJob(Farming.buildingAt(${forge.x}, ${forge.y}), "melt_coins")`);
        await t.until(`!!Farming.buildingAt(${forge.x}, ${forge.y}).job`, 8, 50);
        const used = await J("[194, 79].map(i => $gameParty.numItems($dataItems[i]))");
        await t.eval("$gameSystem.advanceDayNight(4.05); 0");
        await t.eval(`Farming.collectJob(Farming.buildingAt(${forge.x}, ${forge.y})); 0`);
        await t.until(`$gameParty.numItems($dataItems[485]) > ${n0}`, 8, 50);
        await t.frames(30);
        t.check("kuźnia: „Przetop monety” - 4 zaśniedziałe monety i węgiel dają sztabkę brązu", melt === true && used.join() === "0,0" && (await t.count(485)) === n0 + 1, { melt, used });
    }
    const lv = await J(`(function(){ const h = Combat.hero(), has = id => Farming.BUILDINGS.forge.recipes.some(r => r.bron && r.output[0] === id);
        h.level = 3; Bron.syncRecipes(); const at3 = has(421); h.level = 4; Bron.syncRecipes(); const at4 = has(421);
        h.level = 30; Bron.syncRecipes(); const order = Farming.BUILDINGS.forge.recipes.find(r => r.id === "bron_433");
        return { at3, at4, order: order && { tool: order.tool, inputs: order.inputs }, hammer: $dataItems[409] && $dataItems[409].name }; })()`);
    t.check("nowy przepis w kuźni (Brązowy hełm z nosalem, poziom 8): na poziomie 3 go nie ma, od poziomu 4 jest; zakonna kolczuga wymaga Młotka majstra i sztabek stali zakonnej",
        lv.at3 === false && lv.at4 === true && !!lv.order && lv.order.tool === 409 && lv.order.inputs[0][0] === 486 && lv.hammer === "Młotek majstra", lv);
    if (forge) {
        await t.give(486, 6); await t.give(79, 4); await t.give(97, 1);
        const noHammer = await t.eval(`(function(){ $gameParty.loseItem($dataItems[409], 9); return Farming.craftManual(Farming.buildingAt(${forge.x}, ${forge.y}), Farming.BUILDINGS.forge.recipes.find(r => r.id === "bron_433")); })()`);
        const kept = await t.count(486);
        t.check("bez Młotka majstra zakonnej kolczugi nie wykujesz (sztabki zostają)", noHammer === false && kept === 6, { noHammer, kept });
    }

    // ---------------------------------------------------------------- 7. Tadek's bronze ingots (two a day), the loot of the new materials
    await t.gold(500);
    const tadek = await J(`(function(){ const a = Bron.kup("kowal", 485), b = Bron.kup("kowal", 485), c = Bron.kup("kowal", 485);
        return { a: a.ok, b: b.ok, c: c.ok, why: c.why, row: Bron.oferta("kowal", "kup").some(r => r.id === 485) }; })()`);
    t.check("kowal Tadek: 2 sztabki brązu dziennie (15 G), trzecia - „Na dziś już nie ma”, znika z listy", tadek.a && tadek.b && !tadek.c && /Na dziś/.test(tadek.why) && !tadek.row, tadek);
    const loot = await J(`(function(){ const CD = CreaturesData; Bron.wire();
        return { spider: (CD.KINDS.pajak.loot || []).find(l => l[0] === 490), stone: (CD.KINDS.kamiennik.loot || []).filter(l => l[0] === 489 || l[0] === 491).length,
            b70: (CD.BOSSES.boss_70.loot || []).find(l => l[0] === 486), b90: (CD.BOSSES.boss_90.loot || []).find(l => l[0] === 486), b40: (CD.BOSSES.boss_40.loot || []).find(l => l[0] === 490),
            lord: DworData.GEAR.some(g => g[0] === 449) }; })()`);
    t.check("łupy: nić pajęcza u pająków (15%, piętra 31-50), kamienniki - szlachetny kamień i okruch, boss 70 - 1 sztabka stali zakonnej, boss 90 - 3, Matka pająków - 6 nici; pawęż w zbrojowni Lorda",
        !!loot.spider && loot.spider[1] === 0.15 && loot.spider[3] === 31 && loot.spider[4] === 50 && loot.stone === 2 && loot.b70 && loot.b70[2] === 1 && loot.b90 && loot.b90[2] === 3 &&
        loot.b40 && loot.b40[2] === 6 && loot.lord, loot);
});
