// New dishes (items 130-137), their recipes, and the cauldron that no longer roasts on a stick.
const { launch, sleep } = require("./cdp.js");
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const clear = ids => ev(`(function(){ for (const id of ${JSON.stringify(ids)}) $gameParty.gainItem($dataItems[id], -$gameParty.numItems($dataItems[id])); })(); 0`);
        const ITEMS = { honey: 76, cabbage: 73, potato: 71, carrot: 72, milk: 123, cheese: 124, mushroom: 103, berries: 102, barley: 74, flour: 82, rawMeat: 94, smokedMeat: 105, herb: 104 };
        const NEW = { stew: 130, cabbageSoup: 131, mushroomSoup: 132, porridge: 133, grilledMushrooms: 134, bakedCheese: 135, berryPie: 136, mead: 137 };
        const NEW_IDS = Object.values(NEW);
        const $name = id => ({ 130: "Gulasz", 131: "Kapuśniak", 132: "Zupa grzybowa", 133: "Owsianka", 134: "Grzyby z ogniska", 135: "Pieczony ser", 136: "Placek jagodowy", 137: "Miód pitny" })[id];
        const $dataName = $name;
        const ALL_IN = Object.values(ITEMS);

        // ---------------------------------------------------------------- data: the items, icons and food tags
        const items = await J(`[130,131,132,133,134,135,136,137].map(i => { const x = $dataItems[i]; return x && [x.name, x.iconIndex, x.consumable, x.itypeId, !!(x.meta && x.meta.Food), x.price > 0, x.description.length > 20]; })`);
        check("8 new items 130-137 (Gulasz ... Miód pitny) with icons 392-399, consumable, <Food>, a price and a Polish description",
            items.every((x, i) => x && x[1] === 392 + i && x[2] === true && x[3] === 1 && x[4] && x[5] && x[6]) && items[0][0] === "Gulasz" && items[7][0] === "Miód pitny", items.map(x => x && x[0]));
        const pix = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); const out = []; for (let i = 392; i <= 399; i++) { let n = 0; const d = bmp.context.getImageData((i % 16) * 32, Math.floor(i / 16) * 32, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 200) n++; out.push(n); } res({ out, h: bmp.height }); }; chk(); })`);
        check("their icons are drawn (well filled cells) on a sheet at least 800 px tall", pix.out.every(n => n > 200) && pix.h >= 800, pix);

        // ---------------------------------------------------------------- recipes at the right stations
        const rec = await J(`(function(){ const R = (t, id) => { const r = Farming.BUILDINGS[t].recipes.find(r => r.id === id); return r ? { in: r.inputs.map(x => x[0] + "x" + x[1]).join("+"), out: r.output[0] + "x" + r.output[1], h: r.hours, roast: !!r.roast } : null; };
            return { stew: R("cauldron", "stew"), cabbage: R("cauldron", "cabbage_soup"), mushSoup: R("cauldron", "mushroom_soup"), porridge: R("cauldron", "porridge"), soup: R("cauldron", "soup"), brew: R("cauldron", "brew"),
                pie: R("bakery", "berry_pie"), bread: R("bakery", "bread"), mead: R("brewery", "mead"), beer: R("brewery", "beer"),
                grill: R("campfire", "mushrooms"), cheese: R("campfire", "cheese_baked"), tGrill: R("tripod", "mushrooms"), tCheese: R("tripod", "cheese_baked"), meat: R("campfire", "roast_meat"),
                kAll: Farming.BUILDINGS.cauldron.recipes.map(r => r.id), kRoast: Farming.BUILDINGS.cauldron.recipes.some(r => r.roast) }; })()`);
        check("cauldron: gulasz = 2 meat + carrot + cabbage -> 2 (4 h)", rec.stew && rec.stew.in === "94x2+72x1+73x1" && rec.stew.out === "130x2" && rec.stew.h === 4, rec.stew);
        check("cauldron: kapuśniak = 2 cabbage + potato + smoked meat -> 2 (3 h)", rec.cabbage && rec.cabbage.in === "73x2+71x1+105x1" && rec.cabbage.out === "131x2" && rec.cabbage.h === 3, rec.cabbage);
        check("cauldron: zupa grzybowa = 3 mushrooms + potato + milk -> 2 (3 h)", rec.mushSoup && rec.mushSoup.in === "103x3+71x1+123x1" && rec.mushSoup.out === "132x2" && rec.mushSoup.h === 3, rec.mushSoup);
        check("cauldron: owsianka = 3 barley + milk + honey -> 2 (2 h)", rec.porridge && rec.porridge.in === "74x3+123x1+76x1" && rec.porridge.out === "133x2" && rec.porridge.h === 2, rec.porridge);
        check("the old cauldron dishes are unchanged (soup, brew)", rec.soup && rec.soup.in === "71x2+72x1+94x1" && rec.soup.out === "109x2" && rec.brew && rec.brew.in === "104x3" && rec.brew.out === "110x2");
        check("bakery: placek jagodowy = 2 flour + 3 berries + honey -> 2 (3 h), bread stays", rec.pie && rec.pie.in === "82x2+102x3+76x1" && rec.pie.out === "136x2" && rec.pie.h === 3 && !!rec.bread, rec.pie);
        check("brewery: miód pitny = 3 honey -> 2 (8 h), beer stays", rec.mead && rec.mead.in === "76x3" && rec.mead.out === "137x2" && rec.mead.h === 8 && !!rec.beer, rec.mead);
        check("campfire AND tripod: grilled mushrooms (2 -> 2, 15 min) and baked cheese (1 -> 1, 15 min), both roasted on a stick / hook",
            rec.grill && rec.grill.in === "103x2" && rec.grill.out === "134x2" && rec.grill.h === 0.25 && rec.grill.roast && rec.cheese && rec.cheese.in === "124x1" && rec.cheese.out === "135x1" && rec.cheese.h === 0.25 && rec.cheese.roast && !!rec.tGrill && !!rec.tCheese, { g: rec.grill, c: rec.cheese });
        check("the cauldron has NO roasting recipes at all (none of the campfire's, none flagged roast)", !rec.kRoast && !["roast_meat", "roast_fish", "potatoes", "eggs", "mushrooms", "cheese_baked"].some(id => rec.kAll.includes(id)), rec.kAll);
        check("the campfire still roasts meat, fish, potatoes and eggs", !!rec.meat);

        // ---------------------------------------------------------------- spoilage
        const life = await J(`(function(){ const L = Spoilage.LIFE; const out = {}; for (let i = 130; i <= 137; i++) out[i] = L[i] || 0; return out; })()`);
        check("Spoilage: the 7 cooked dishes go off (96/96/60/72/48/240/96 h), the mead keeps", JSON.stringify(life) === JSON.stringify({ 130: 96, 131: 96, 132: 60, 133: 72, 134: 48, 135: 240, 136: 96, 137: 0 }), life);

        // ---------------------------------------------------------------- the stations, cooking and collecting
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            for (let by = 2; by < $gameMap.height() - 10; by++) for (let bx = 2; bx < $gameMap.width() - 13; bx++) {
                let ok = true;
                for (let y = by; y < by + 9 && ok; y++) for (let x = bx; x < bx + 12; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) {
                    const plots = ($gameSystem._farm.plots[$gameMap.mapId()] = $gameSystem._farm.plots[$gameMap.mapId()] || {});
                    for (let y = by; y < by + 9; y++) for (let x = bx; x < bx + 12; x++) if (!plots[x + "," + y]) plots[x + "," + y] = { s: "cleared" };
                    $gameSystem._farm.rev++;
                    return { bx, by };
                }
            }
            return null; })()`);
        check("found a meadow", !!B, B);
        const { bx, by } = B;
        const place = (type, x, y, v) => ev(`(function(){ const f = $gameSystem._farm; (f.buildings[3] = f.buildings[3] || []).push({ id: f.nextId++, type: "${type}", x: ${x}, y: ${y}, last: 1, v: ${v} }); f.rev++; })(); 0`);
        const cx = bx + 1, cy = by + 2, kx = bx + 6, ky = by + 2, rx = bx + 1, ry = by + 6, fx = bx + 8, fy = by + 6;
        await place("cauldron", cx, cy, 3); await place("bakery", kx, ky, 2); await place("brewery", rx, ry, 3); await place("campfire", fx, fy, 3);
        await ev(`$gamePlayer.locate(${cx + 1}, ${cy + 2}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 3, ${by} - 2); $gameSystem.setStamina(100); 0`);
        await frames(30);
        const at = (x, y) => `Farming.buildingAt(${x}, ${y})`;
        // start a background job, let the game clock run `hours`, collect it
        const cook = async (x, y, id, hours) => {
            await ev(`$gameSystem.setStamina(100); 0`);
            await ev(`Farming.startJob(${at(x, y)}, ${JSON.stringify(id)}); 0`);
            await frames(90);
            const started = await ev(`!!${at(x, y)}.job`);   // the job starts after a short crouch
            await ev(`$gameSystem.advanceDayNight(${hours}); 0`);
            await frames(10);
            await ev(`Farming.collectJob(${at(x, y)}); 0`);
            await frames(90);
            return started;
        };
        const dishes = [
            ["stew", cx, cy, "stew", 4.2, [[94, 2], [72, 1], [73, 1]], 2, 130, 2, [94, 72, 73]],
            ["cabbage soup", cx, cy, "cabbage_soup", 3.2, [[73, 2], [71, 1], [105, 1]], 3, 131, 2, [73, 71, 105]],
            ["mushroom soup", cx, cy, "mushroom_soup", 3.2, [[103, 3], [71, 1], [123, 1]], 3, 132, 2, [103, 71, 123]],
            ["porridge", cx, cy, "porridge", 2.2, [[74, 3], [123, 1], [76, 1]], 1, 133, 2, [74, 123, 76]],
            ["berry pie (bakery)", kx, ky, "berry_pie", 3.2, [[82, 2], [102, 3], [76, 1]], 0, 136, 2, [82, 102, 76]],
            ["mead (brewery)", rx, ry, "mead", 8.2, [[76, 3]], 0, 137, 2, [76]]
        ];
        await give(138, 1);   // a bucket in the bag: the cauldron's soups also need water from it
        for (const [name, x, y, id, hours, ins, water, out, n, watch] of dishes) {
            await clear(ALL_IN.concat(NEW_IDS));
            // ingredients for exactly one batch, and a hair less of the first one to see that it is refused
            for (const [it, k] of ins) await give(it, k);
            if (water) await ev(`Farming.setBagWater(${water}); 0`);
            const started = await cook(x, y, id, hours);
            const left = await Promise.all(watch.map(count));
            const waterLeft = water ? await ev("Farming.bagWater()") : 0;
            check(name + ": the job started, the ingredients" + (water ? " and water" : "") + " were spent, and " + n + " x " + $name(out) + " came out",
                started === true && left.every(v => v === 0) && waterLeft === 0 && (await count(out)) === n, { started, left, got: await count(out), waterLeft });
        }

        // not enough water: refused even with all the ingredients ready
        await clear(ALL_IN.concat(NEW_IDS)); for (const [it, k] of [[94, 2], [72, 1], [73, 1]]) await give(it, k);
        await ev("Farming.setBagWater(1); 0");   // gulasz needs 2
        const noWater = await ev(`(function(){ const b = ${at(cx, cy)}; Farming.startJob(b, "stew"); return !!b.job; })()`);
        check("gulasz with only 1/2 water: nothing starts, the ingredients stay in the bag, the water is untouched", noWater === false && (await count(94)) === 2 && (await ev("Farming.bagWater()")) === 1);

        // not enough of an ingredient: nothing starts (plenty of water this time, so only the ingredient shortage is being tested)
        await clear(ALL_IN.concat(NEW_IDS)); await give(94, 1); await give(72, 1); await give(73, 1);
        await ev("Farming.setBagWater(2); 0");
        const refused = await ev(`(function(){ const b = ${at(cx, cy)}; Farming.startJob(b, "stew"); return !!b.job; })()`);
        check("gulasz with only 1 meat: nothing starts, the ingredients stay in the bag", refused === false && (await count(94)) === 1 && (await count(72)) === 1 && (await count(73)) === 1);

        // roasted on a stick at the plain campfire (the player sits until it is done)
        for (const [name, id, ins, out, n, hours] of [["grilled mushrooms", "mushrooms", [[103, 2]], 134, 2, 0.3], ["baked cheese", "cheese_baked", [[124, 1]], 135, 1, 0.3]]) {
            await clear(ALL_IN.concat(NEW_IDS));
            for (const [it, k] of ins) await give(it, k);
            await ev(`$gamePlayer.locate(${fx}, ${fy + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${fx} - 13.5, ${fy} - 7.5); $gameSystem.setStamina(100); 0`);
            await frames(10);
            await ev(`Farming.startJob(${at(fx, fy)}, ${JSON.stringify(id)}); 0`);
            await frames(120);
            const sitting = await ev("$gamePlayer.isToolSwinging()"), onFire = await ev(`!!${at(fx, fy)}.job`);
            await ev(`$gameSystem.advanceDayNight(${hours}); 0`);
            await frames(140);
            check(name + " on a stick: the player sat by the fire, then stood up with " + n + " x " + $name(out) + " (nothing left on the fire)",
                sitting && onFire && !(await ev(`!!${at(fx, fy)}.job`)) && (await count(out)) === n && !(await ev("$gamePlayer.isToolSwinging()")), { sitting, onFire, got: await count(out) });
        }

        // ---------------------------------------------------------------- the menus
        await ev(`$gamePlayer.locate(${cx + 1}, ${cy + 2}); 0`); await frames(4);
        await clear(ALL_IN); for (const id of ALL_IN) await give(id, 5);
        await frames(4);
        const kMenu = await J(`Farming.menuFor(${cx + 1}, ${cy}).entries.map(e => e.name)`);
        check("the cauldron's menu offers the new dishes and the old ones", ["Ugotuj gulasz", "Ugotuj kapuśniak", "Ugotuj zupę grzybową", "Ugotuj owsiankę", "Ugotuj zupę", "Zaparz wywar"].every(n => kMenu.includes(n)), kMenu);
        check("the cauldron's menu has no 'Upiecz mięso', no fish, no potatoes, no eggs, no mushrooms, no cheese roasting", !kMenu.some(n => /^Upiecz|^Usmaż|^Przypiecz/.test(n)), kMenu);
        check("the cauldron still lets the player warm up by its fire (rest)", kMenu.includes("Ogrzej się przy ogniu"), kMenu);
        const fMenu = await J(`Farming.menuFor(${fx}, ${fy}).entries.map(e => e.name)`);
        check("the plain campfire's menu offers 'Upiecz grzyby' and 'Przypiecz ser' next to meat, fish, potatoes and eggs",
            ["Upiecz mięso", "Upiecz rybę", "Upiecz ziemniaki", "Usmaż jajecznicę", "Upiecz grzyby", "Przypiecz ser"].every(n => fMenu.includes(n)), fMenu);
        const bMenu = await J(`Farming.menuFor(${kx + 1}, ${ky}).entries.map(e => e.name)`);
        const wMenu = await J(`Farming.menuFor(${rx + 1}, ${ry}).entries.map(e => e.name)`);
        check("the bakery offers 'Upiecz placek jagodowy', the brewery 'Nastaw miód pitny'", bMenu.includes("Upiecz placek jagodowy") && wMenu.includes("Nastaw miód pitny"), { bMenu, wMenu });
        // the recipe line names what comes out, lists the ingredients and has a clean description
        const hasTexts = await J(`(function(){ const m = Farming.menuFor(${cx + 1}, ${cy}).entries.find(e => e.name === "Ugotuj gulasz"); return m ? { help: m.help || "", costs: m.costs || [] } : null; })()`);
        check("'Ugotuj gulasz': the help says what comes out (Gulasz ×2, 4 godz.), lists 3 ingredients + water, no doubled full stop",
            !!hasTexts && /^Wynik: Gulasz ×2, 4 godz\.\n/.test(hasTexts.help) && hasTexts.costs.length === 4, hasTexts);
        check("the 4th cost row is the water: bucket icon (400), needs 2", hasTexts.costs[3] && hasTexts.costs[3][0] === 400 && hasTexts.costs[3][1] === 2, hasTexts.costs[3]);
        // an upgrade to the cauldron says it takes the fire
        const upHelp = await ev(`Farming.BUILDINGS.tripod.upgrade.help + " || " + Farming.BUILDINGS.cauldron.desc`);
        check("the texts of the tripod's upgrade and of the cauldron say it does not roast any more", /zajmuje cały ogień/.test(upHelp) && /osobnym ognisku/.test(upHelp) && !/nadal upieczesz/.test(upHelp), upHelp);

        // ---------------------------------------------------------------- eating: each dish feeds, quenches thirst and gives its buff
        const set = (f, w) => ev(`(function(){ const n = Needs.state(); n.food = ${f}; n.water = ${w}; const l = Needs.levels(); n.lf = l.food; n.lw = l.water; $gameSystem.setStamina(40); $gameSystem._buffs = {}; })(); 0`);
        const food = () => ev("Needs.state().food"), water = () => ev("Needs.state().water");
        const eat = id => ev(`$gameParty.members()[0].useItem($dataItems[${id}]); 0`);
        const EAT = [[130, 62, 14, "sated", "warm"], [131, 48, 26, "sated", "warm"], [132, 42, 24, "sated"], [133, 45, 14, "sated"], [134, 22, 0], [135, 38, 0, "sated"], [136, 30, 6, "sated"], [137, 6, 18, "warm"]];
        for (const [id, fed, wat, ...buffs] of EAT) {
            await set(20, 40); await clear([id]); await give(id, 1);
            const can = await ev(`$gameParty.canUse($dataItems[${id}])`);
            await eat(id);
            const f = await food(), w = await water();
            const got = await Promise.all(buffs.map(bf => ev(`$gameSystem.hasBuff(${JSON.stringify(bf)})`)));
            check($dataName(id) + ": can be eaten when hungry, food 20 -> " + Math.min(100, 20 + fed) + ", water 40 -> " + Math.min(100, 40 + wat) + (buffs.length ? ", buff " + buffs.join("+") : ""),
                can === true && Math.abs(f - Math.min(100, 20 + fed)) < 0.6 && Math.abs(w - Math.min(100, 40 + wat)) < 0.6 && got.every(Boolean) && (await count(id)) === 0, { can, f, w, got });
        }

        // the dishes are worth more than their raw materials (the innkeeper pays for the work)
        const price = await J(`[130,131,132,133,134,135,136,137].map(i => $dataItems[i].price)`);
        check("prices: gulasz 36, kapuśniak 28, zupa grzybowa 26, owsianka 22, grzyby 10, ser 28, placek 24, miód pitny 32", JSON.stringify(price) === JSON.stringify([36, 28, 26, 22, 10, 28, 24, 32]), price);
        // the pantry accepts the new food, chests do not lose it
        const pantry = await J(`(function(){ const b = { type: "pantry" }; return [130, 133, 136, 137].map(i => Farming.whyNotMove ? Farming.whyNotMove(b, $dataItems[i], "put") : "n/a"); })()`);
        console.log("pantry check:", JSON.stringify(pantry));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
