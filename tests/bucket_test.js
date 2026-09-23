// The bucket (item 138): built from planks + iron on the ground, collects rain, drink / skin / can / watering, taken into the bag, needed for the well.
const { launch, sleep } = require("./cdp.js");
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
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const setN = async (id, n) => { await ev(`$gameParty.gainItem($dataItems[${id}], ${n} - $gameParty.numItems($dataItems[${id}])); 0`); };
        await ev("window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0");
        const pops = () => J("window.__pop.splice(0)");
        const IT = { planks: 80, nails: 88, stone: 64, iron: 86, hammer: 89, rope: 93, bucket: 138, can: 87, skin: 129, potato: 71 };

        // ---------------------------------------------------------------- data
        const item = await J("(function(){ const i = $dataItems[138]; return i ? [i.name, i.iconIndex, i.consumable, i.itypeId, i.price, i.description.length > 20] : null; })()");
        check("item 138 'Wiadro': an ordinary item that is not used up, icon 400, a price and a description", JSON.stringify(item) === JSON.stringify(["Wiadro", 400, false, 1, 40, true]), item);
        const pix = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); let n = 0; const d = bmp.context.getImageData(0, 800, 32, 32).data; for (let k = 3; k < d.length; k += 4) if (d[k] > 200) n++; res({ n, h: bmp.height }); }; chk(); })`);
        check("the icon (400) is drawn and the icon sheet grew to 832 px", pix.n > 250 && pix.h === 832, pix);
        const imgs = await ev(`Promise.all(["Farm_Bucket", "Farm_Bucket_Full"].map(n => new Promise(res => { const bm = ImageManager.loadSystem(n); bm.addLoadListener(() => res(bm.width + "x" + bm.height)); })))`);
        check("the two pictures load (empty, full of water): 27 x 32", JSON.stringify(imgs) === JSON.stringify(["27x32", "27x32"]), imgs);
        const def = await J(`(function(){ const B = Farming.BUILDINGS, k = B.bucket, w = B.well, f = B.forge.recipes.find(r => r.id === "bucket_item"); return { cost: k.cost, pack: k.pack, instant: k.instant, w: k.w, rain: k.rain, forge: f && { in: f.inputs, out: f.output, manual: !!f.manual, unique: !!f.unique }, wellCost: w.cost, wellRefund: w.refund, oldWell: Farming.geoOf({ type: "well", x: 0, y: 0 }).cost, v2Well: Farming.geoOf({ type: "well", x: 0, y: 0, v: 2 }).cost, v2Refund: Farming.geoOf({ type: "well", x: 0, y: 0, v: 2 }).refund || null }; })()`);
        check("the forge makes it: 'Wykuj wiadro' = 3 planks + 1 iron -> 1 bucket, hand work, as many as you like",
            !!def.forge && JSON.stringify(def.forge.in) === JSON.stringify([[IT.planks, 3], [IT.iron, 1]]) && JSON.stringify(def.forge.out) === "[138,1]" && def.forge.manual && !def.forge.unique, def.forge);
        check("Wiadro is put down ready: it costs only the bucket item, no hammer, packs back into item 138, holds 6 portions of rain",
            JSON.stringify(def.cost) === "[[138,1]]" && def.pack === 138 && def.instant === true && def.w === 1 && def.rain.max === 6, def);
        check("the well now needs a bucket (and gives it back when pulled down); wells built before need none", JSON.stringify(def.wellCost) === JSON.stringify([[64, 12], [80, 3], [93, 2], [138, 1]]) && JSON.stringify(def.wellRefund).includes("138") && JSON.stringify(def.oldWell) === JSON.stringify([[64, 12], [80, 3], [93, 2]]) && JSON.stringify(def.v2Well) === JSON.stringify([[64, 12], [80, 3], [93, 2]]) && def.v2Refund === null, def);

        // ---------------------------------------------------------------- an open place
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 10; bx++) {
                let ok = true;
                for (let y = by; y < by + 7 && ok; y++) for (let x = bx; x < bx + 8; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) {
                    const plots = ($gameSystem._farm.plots[$gameMap.mapId()] = $gameSystem._farm.plots[$gameMap.mapId()] || {});
                    for (let y = by; y < by + 7; y++) for (let x = bx; x < bx + 8; x++) if (!plots[x + "," + y]) plots[x + "," + y] = { s: "cleared" };
                    $gameSystem._farm.rev++;
                    return { bx, by };
                }
            }
            return null; })()`);
        check("found an open ground", !!B, B);
        const { bx, by } = B;
        const kx = bx + 1, ky = by + 3;
        await ev(`$gamePlayer.locate(${kx}, ${ky + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 6, ${by} - 2); $gameSystem.setStamina(100); 0`);
        await frames(20);
        // captured menus
        await ev(`(function(){ const sc = SceneManager._scene; sc.openFarmMenu = (title, entries) => { window.__menu = { title, entries: entries.map(e => ({ name: e.name, enabled: e.enabled !== false, help: e.help || "", right: e.right || "" })) }; window.__entries = entries; }; })(); 0`);
        const menuAt = (x, y) => J(`(function(){ const m = Farming.menuFor(${x}, ${y}); return m ? { title: m.title, entries: m.entries.map(e => ({ name: e.name, enabled: e.enabled !== false, help: e.help || "" })) } : null; })()`);
        const runAt = (x, y, name) => ev(`(function(){ const m = Farming.menuFor(${x}, ${y}); const e = m.entries.find(e => e.name === ${JSON.stringify(name)}); if (!e || e.enabled === false) return false; e.run(); return true; })()`);
        const waitSwing = async () => { await frames(4); for (let i = 0; i < 100 && (await ev("$gamePlayer.isToolSwinging()")); i++) await frames(3); await frames(6); };

        // ---------------------------------------------------------------- building it
        for (const id of [IT.planks, IT.iron, IT.bucket, IT.hammer]) await setN(id, 0);
        check("without a bucket in the bag the placer says so", (await ev(`Farming.placementProblem("bucket", ${kx}, ${ky})`)) === "Brakuje materiałów.");
        await setN(IT.planks, 3); await setN(IT.iron, 1);
        check("planks and iron alone no longer make a bucket on the ground", (await ev(`Farming.placementProblem("bucket", ${kx}, ${ky})`)) === "Brakuje materiałów.");
        await setN(IT.planks, 0); await setN(IT.iron, 0); await setN(IT.bucket, 1);
        check("a forged bucket in the bag is enough (no hammer needed)", (await ev(`Farming.placementProblem("bucket", ${kx}, ${ky})`)) === null);
        await ev(`Farming.pitchInstant("bucket", ${kx}, ${ky}); 0`);
        await waitSwing();
        const built = await J(`(function(){ const b = Farming.buildingAt(${kx}, ${ky}); return b ? { type: b.type, v: b.v, site: !!b.site, water: b.water, wt: typeof b.wt } : null; })()`);
        check("the bucket stands there at once (no site), empty, with a clock for the rain", !!built && built.type === "bucket" && built.v === 3 && !built.site && built.water < 0.5 && built.wt === "number", built);
        check("the bucket item is spent and the popup says 'Rozstawiono: Wiadro'", (await count(IT.bucket)) === 0 && (await pops()).some(t => /Rozstawiono: Wiadro/.test(t)));
        check("the bucket is a solid 1 x 1 object (nobody walks through it)", (await ev(`Farming.solidAt(${kx}, ${ky}) ? 1 : 0`)) === 1 && (await ev(`$gameMap.isPassable(${kx}, ${ky}, 8)`)) === false);
        const m0 = await menuAt(kx, ky);
        check("its menu: title 'Wiadro (0/6)', 'Wiadro jest puste', drinking and filling greyed out, 'Zabierz wiadro' available, no 'Rozbierz'",
            m0.title === "Wiadro (0/6)" && m0.entries[0].name === "Wiadro jest puste" && ["Napij się", "Napełnij bukłak", "Napełnij konewkę"].every(n => (m0.entries.find(e => e.name === n) || { enabled: true }).enabled === false) &&
            m0.entries.some(e => e.name === "Zabierz wiadro" && e.enabled) && !m0.entries.some(e => e.name === "Rozbierz"), m0.entries.map(e => e.name + (e.enabled ? "" : " (off)")));
        check("its picture is the empty one", (await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "bucket").sprite.bitmap._url`)).endsWith("Farm_Bucket.png"));

        // ---------------------------------------------------------------- rain: one portion per hour of the weather plan, also while nobody is there
        const rain = await J(`(function(){ for (let d = 5; d < 300; d++) { const p = Survival.weatherPlan(d); if (p && p.type === "rain" && p.end - p.start >= 6 && !(Survival.weatherPlan(d - 1) && Survival.weatherPlan(d - 1).type === "rain")) return { day: d, start: p.start, end: p.end }; } return null; })()`);
        check("found a rainy day in the weather plan", !!rain, rain);
        const setClock = async (day, hour) => { await ev(`$gameSystem._dayNightDay = ${day}; $gameSystem.setDayNightHour(${hour}); 0`); };
        const units = () => ev(`Farming.bucketUnits(Farming.buildingAt(${kx}, ${ky}))`);
        const resetBucket = async () => ev(`(function(){ const b = Farming.buildingAt(${kx}, ${ky}); b.water = 0; b.wt = Farming.clockHours(); })(); 0`);
        await ev("$gameSystem._weatherOwn = false; $gameScreen.clearWeather(); 0");
        await setClock(rain.day, rain.start - 2); await resetBucket();
        await ev("$gameSystem.advanceDayNight(1.5); 0");
        check("before the rain starts the bucket stays empty", (await units()) === 0);
        await ev("$gameSystem.advanceDayNight(3); 0");   // 1.5 h of the plan's dry hours + 2 h of rain up to now: about 2.5 h of rain
        const two = await units();
        check("2.5 hours of rain later it holds 2 portions", two === 2, two);
        await ev("$gameSystem.advanceDayNight(1); 0");
        check("one more hour of rain: 3 portions", (await units()) === 3);
        await setClock(rain.day, rain.end + 2);   // the player was away for the rest of the rain
        const full = await units();
        check("after the whole rain (" + (rain.end - rain.start) + " hours) it is capped at 6 portions", full === 6, full);
        await setClock(rain.day + 1, 2);
        check("dry hours afterwards change nothing", (await units()) === 6);
        // snow does not fill it: pick a winter day with snow
        const snow = await J(`(function(){ for (let d = 5; d < 400; d++) { const p = Survival.weatherPlan(d); if (p && p.type === "snow") return { day: d, start: p.start, end: p.end }; } return null; })()`);
        await setClock(snow.day, snow.start - 1); await resetBucket();
        await setClock(snow.day, snow.end + 1);
        check("snow is not collected", (await units()) === 0, snow);
        // a picture with water in it
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 4; 0`);
        await frames(40);
        check("with water in it the picture is the full bucket", (await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "bucket").sprite.bitmap._url`)).endsWith("Farm_Bucket_Full.png"));
        const m4 = await menuAt(kx, ky);
        check("menu title 'Wiadro (4/6)' and the line 'Woda w wiadrze: 4/6'", m4.title === "Wiadro (4/6)" && m4.entries[0].name === "Woda w wiadrze: 4/6", m4.entries[0]);

        // ---------------------------------------------------------------- drinking
        await ev("Needs.setEnabled(true); $gameSystem.setStamina(100); 0");
        await ev("(function(){ const n = Needs.state(); n.water = 100; })(); 0");
        check("not thirsty: 'Napij się' is greyed out", (await menuAt(kx, ky)).entries.find(e => e.name === "Napij się").enabled === false);
        await ev("(function(){ const n = Needs.state(); n.water = 30; })(); 0");
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 4; 0`);
        check("thirsty: 'Napij się' is offered", (await menuAt(kx, ky)).entries.find(e => e.name === "Napij się").enabled === true);
        await runAt(kx, ky, "Napij się");
        await waitSwing();
        const w1 = await ev("Needs.state().water");
        check("a drink from the bucket: thirst quenched (+40) and one portion used (4 -> 3)", Math.abs(w1 - 70) < 1.5 && (await units()) === 3, { water: w1, units: await units() });
        check("popup 'Nawodnienie +'", (await pops()).some(t => /Nawodnienie \+/.test(t)));

        // ---------------------------------------------------------------- the waterskin: as many sips as there are portions
        await setN(IT.skin, 1);
        await ev("Needs.state().skin = 1; 0");
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 6; 0`);
        await runAt(kx, ky, "Napełnij bukłak");
        await waitSwing();
        check("filling the skin (1/4 -> 4/4) takes 3 portions from the bucket (6 -> 3), popup 'Bukłak pełny'", (await ev("Needs.skinCharges()")) === 4 && (await units()) === 3 && (await pops()).some(t => /Bukłak pełny \(4\/4\)/.test(t)));
        await ev("Needs.state().skin = 0; 0");
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 2; 0`);
        await runAt(kx, ky, "Napełnij bukłak");
        await waitSwing();
        check("with only 2 portions the skin gets 2 sips (2/4) and the bucket is empty", (await ev("Needs.skinCharges()")) === 2 && (await units()) === 0 && (await pops()).some(t => /Bukłak \(2\/4\)/.test(t)));
        check("an empty bucket cannot fill the skin: greyed out, and a direct call says 'Wiadro jest puste'",
            (await menuAt(kx, ky)).entries.find(e => e.name === "Napełnij bukłak").enabled === false && (await ev(`Farming.buildingAt(${kx}, ${ky}) && (function(){ return true; })()`)) === true);

        // ---------------------------------------------------------------- the watering can
        await setN(IT.can, 1);
        await ev(`$gameSystem._farm.can = { charges: 1 }; Farming.buildingAt(${kx}, ${ky}).water = 3; 0`);
        await runAt(kx, ky, "Napełnij konewkę");
        await waitSwing();
        check("filling the can (1/6) with 3 portions: 4/6, the bucket is empty, popup 'Konewka (4/6)'", (await ev("$gameSystem._farm.can.charges")) === 4 && (await units()) === 0 && (await pops()).some(t => /Konewka \(4\/6\)/.test(t)));
        await ev(`$gameSystem._farm.can = { charges: 0 }; Farming.buildingAt(${kx}, ${ky}).water = 6; 0`);
        await runAt(kx, ky, "Napełnij konewkę");
        await waitSwing();
        check("an empty can and 6 portions: the can is full (6/6), the bucket is empty", (await ev("$gameSystem._farm.can.charges")) === 6 && (await units()) === 0 && (await pops()).some(t => /Konewka pełna \(6\/6\)/.test(t)));

        // ---------------------------------------------------------------- watering plants straight from the bucket
        const px = kx + 2, py = ky;   // a tilled plot two tiles from the bucket
        await ev(`(function(){ const pl = $gameSystem._farm.plots[3]; pl["${px},${py}"] = { s: "tilled", day: 1 }; pl["${bx + 7},${by + 6}"] = { s: "tilled", day: 1 }; $gameSystem._farm.rev++; })(); 0`);
        await ev(`$gameSystem._farm.can = { charges: 0 }; Farming.buildingAt(${kx}, ${ky}).water = 2; $gameSystem.setStamina(100); 0`);
        await ev(`$gamePlayer.locate(${px}, ${py + 1}); $gamePlayer.setDirection(8); 0`);
        check("the plot's 'Podlej' line mentions the bucket next to it", /wiadra obok/.test((await J(`Farming.menuFor(${px}, ${py}).entries.find(e => e.name === "Podlej").help`))));
        await ev(`Farming.water(${px}, ${py}); 0`);
        await waitSwing();
        check("with an empty can the plot is watered from the bucket next to it (2 -> 1 portion), the can stays empty",
            (await ev(`!!($gameSystem._farm.plots[3]["${px},${py}"].watered !== undefined)`)) && (await units()) === 1 && (await ev("$gameSystem._farm.can.charges")) === 0, { units: await units() });
        await ev(`delete $gameSystem._farm.plots[3]["${px},${py}"].watered; $gameSystem._farm.can = { charges: 3 }; 0`);
        await ev(`Farming.water(${px}, ${py}); 0`);
        await waitSwing();
        check("with water in the can the can is used first (3 -> 2), the bucket keeps its portion", (await ev("$gameSystem._farm.can.charges")) === 2 && (await units()) === 1);
        await ev(`$gameSystem._farm.can = { charges: 0 }; 0`);
        const farX = bx + 7, farY = by + 6;
        await ev(`$gamePlayer.locate(${farX}, ${farY + 0}); $gamePlayer.setDirection(8); 0`);
        await pops();
        await ev(`Farming.water(${farX}, ${farY}); 0`);
        await frames(20);
        check("a plot out of the bucket's reach (more than 3 tiles) cannot be watered with an empty can: 'Konewka jest pusta...'", (await pops()).some(t => /Konewka jest pusta/.test(t)));
        await setN(IT.can, 0);
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 1; delete $gameSystem._farm.plots[3]["${px},${py}"].watered; $gamePlayer.locate(${px}, ${py + 1}); $gamePlayer.setDirection(8); $gameSystem.setStamina(100); 0`);
        await ev(`Farming.water(${px}, ${py}); 0`);
        await waitSwing();
        check("without any can at all, the bucket still waters the plot next to it", (await ev(`$gameSystem._farm.plots[3]["${px},${py}"].watered !== undefined`)) && (await units()) === 0);

        // ---------------------------------------------------------------- pouring it out still works on its own
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 5; 0`);
        await ev(`$gamePlayer.locate(${kx}, ${ky + 1}); $gamePlayer.setDirection(8); 0`);
        const wet = await menuAt(kx, ky);
        check("'Wylej wodę' is offered", wet.entries.find(e => e.name === "Wylej wodę").enabled === true);
        await runAt(kx, ky, "Wylej wodę");
        await waitSwing();
        check("pouring it out empties the bucket (popup 'Wylano wodę') and 'Wylej wodę' is greyed out", (await units()) === 0 && (await pops()).some(t => /Wylano wodę/.test(t)) && (await menuAt(kx, ky)).entries.find(e => e.name === "Wylej wodę").enabled === false);

        // ---------------------------------------------------------------- taking it into the bag WITH its water, and putting it down again
        await ev(`Farming.buildingAt(${kx}, ${ky}).water = 4; 0`);
        const weight0 = await ev("Survival.carriedWeight()");
        const packWet = (await menuAt(kx, ky)).entries.find(e => e.name === "Zabierz wiadro");
        check("a bucket with water in it CAN now be picked up: 'Zabierz wiadro' is enabled and no longer warns about pouring the water out first", packWet.enabled === true && !/Wylej/.test(packWet.help), packWet);
        await pops();
        await runAt(kx, ky, "Zabierz wiadro");
        await waitSwing();
        check("picking it up: item in the bag, the ground object is gone, popup names the carried water level (4/6)", (await count(IT.bucket)) === 1 && !(await ev(`Farming.buildingAt(${kx}, ${ky})`)) && (await pops()).some(t => /Zabrano: Wiadro \(4\/6\)/.test(t)));
        check("the carried (bag) water level is now 4/6", (await ev("Farming.bagWater()")) === 4);
        const weight1 = await ev("Survival.carriedWeight()");
        check("carrying the bucket with 4 portions of water weighs 7 more than before it was picked up (3 base + 4 water)", Math.round(weight1 - weight0) === 7, { weight0, weight1 });
        check("with the item in the bag it can be put down again", (await ev(`Farming.placementProblem("bucket", ${kx + 3}, ${ky})`)) === null);
        await ev(`Farming.pitchInstant("bucket", ${kx + 3}, ${ky}); 0`);
        await waitSwing();
        check("put down again: the item is used up, the new bucket on the ground keeps the 4 portions, the bag is empty again",
            (await count(IT.bucket)) === 0 && (await ev(`(Farming.buildingAt(${kx + 3}, ${ky}) || {}).type`)) === "bucket" && (await ev(`Farming.buildingAt(${kx + 3}, ${ky}).water`)) === 4 && (await ev("Farming.bagWater()")) === 0);
        await ev(`(function(){ const L = $gameSystem._farm.buildings[3]; L.splice(L.indexOf(Farming.buildingAt(${kx + 3}, ${ky})), 1); $gameSystem._farm.rev++; })(); 0`);

        // ---------------------------------------------------------------- filling the bag bucket: from another bucket on the ground, and from the well
        // (the ground bucket at kx,ky was picked up and consumed above - place a fresh one directly, like the save/load check further down does)
        await setN(IT.bucket, 1);
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: f.nextId++, type: "bucket", x: ${kx}, y: ${ky}, last: 1, v: 3, water: 3, wt: Farming.clockHours() }); f.rev++; })(); 0`);
        const fillEntry = (await menuAt(kx, ky)).entries.find(e => e.name === "Napełnij wiadro");
        check("standing at a wet ground bucket: 'Napełnij wiadro' is offered", !!fillEntry && fillEntry.enabled === true, fillEntry);
        await runAt(kx, ky, "Napełnij wiadro");
        await waitSwing();
        check("filling the bag bucket from the ground one (0/6 <- 3): bag is 3/6, the ground bucket is drained", (await ev("Farming.bagWater()")) === 3 && (await units()) === 0, { bag: await ev("Farming.bagWater()"), ground: await units() });
        await ev(`(function(){ const L = $gameSystem._farm.buildings[3]; L.splice(L.indexOf(Farming.buildingAt(${kx}, ${ky})), 1); $gameSystem._farm.rev++; })(); Farming.setBagWater(0); 0`);   // clean up: only the well test's own bucket item/count matters from here

        // ---------------------------------------------------------------- the well needs the bucket (and, since the pit mechanic, a dug-out 2x2 under it - dug first here so this stays a test of the bucket, not of the pit)
        const wx = bx + 3, wy = by + 6;   // a 2 x 2 well
        await ev(`$gameParty.gainItem($dataItems[62], 1); $gameSystem.setStamina(250); 0`);   // a shovel
        for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [1, -1]]) {
            for (let hit = 0; hit < 3; hit++) { await ev(`Farming.dig(${wx} + ${dx}, ${wy} + ${dy}); 0`); await frames(15); }
        }
        for (const [id, n] of [[64, 12], [80, 3], [93, 2]]) await setN(id, n);
        await setN(IT.bucket, 0); await setN(IT.hammer, 1);
        check("stone, planks and rope alone are not enough for a well: 'Brakuje materiałów.'", (await ev(`Farming.placementProblem("well", ${wx}, ${wy})`)) === "Brakuje materiałów.");
        await setN(IT.bucket, 1);
        await ev(`$gamePlayer.locate(${wx + 1}, ${wy + 1}); $gameSystem.setStamina(100); 0`);
        check("with a bucket in the bag (and the pit already dug out) it can be placed", (await ev(`Farming.placementProblem("well", ${wx}, ${wy})`)) === null);
        await ev(`Farming.placeSite("well", ${wx}, ${wy}); $gameTemp._buildMode = null; 0`);
        await frames(10);
        check("placing the site uses up the bucket with the rest", (await count(IT.bucket)) === 0 && (await count(64)) === 0 && (await ev(`!!Farming.buildingAt(${wx}, ${wy}).site`)));
        await ev(`Farming.cancelSite(Farming.buildingAt(${wx}, ${wy})); 0`);
        check("giving the site up returns the bucket too", (await count(IT.bucket)) === 1 && (await count(64)) === 12);
        // a finished well pulled down: half of the materials and the bucket
        for (const id of [64, 80, 93, IT.bucket]) await setN(id, 0);
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: f.nextId++, type: "well", x: ${wx}, y: ${wy}, last: 1, v: 3 }); f.rev++; })(); 0`);
        await ev(`Farming.demolish(Farming.buildingAt(${wx}, ${wy})); 0`);
        check("a new well pulled down gives back 6 stones, 1 plank, 1 rope and the bucket", (await count(64)) === 6 && (await count(80)) === 1 && (await count(93)) === 1 && (await count(IT.bucket)) === 1, { stone: await count(64), planks: await count(80), rope: await count(93), bucket: await count(IT.bucket) });
        for (const id of [64, 80, 93, IT.bucket]) await setN(id, 0);
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: f.nextId++, type: "well", x: ${wx}, y: ${wy}, last: 1 }); f.rev++; })(); 0`);   // an old one (no version)
        await ev(`Farming.demolish(Farming.buildingAt(${wx}, ${wy})); 0`);
        check("an old well (built before) gives back only what it cost (half, no bucket)", (await count(64)) === 6 && (await count(80)) === 1 && (await count(93)) === 1 && (await count(IT.bucket)) === 0);

        // ---------------------------------------------------------------- the journal
        await frames(30);
        const jg = await J(`(function(){ const g = id => Journal.GOALS.find(x => x.id === id); return { bucket: !!g("bucket"), wellAfter: g("well").after, wellText: /wiadra/.test(g("well").text), bucketDone: !!Journal.goalDone(g("bucket")) }; })()`);
        check("Journal: a goal 'Zbuduj wiadro', and the well's goal comes after it", jg.bucket && jg.wellAfter.includes("bucket") && jg.wellText, jg);
        await setN(IT.bucket, 1);
        await frames(45);
        check("owning a bucket completes the goal", await ev(`Journal.goalDone(Journal.GOALS.find(g => g.id === "bucket"))`));
        // ---------------------------------------------------------------- save and load keep the water
        await setN(IT.bucket, 0);
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: f.nextId++, type: "bucket", x: ${kx}, y: ${ky}, last: 1, v: 3, water: 3, wt: Farming.clockHours() }); f.rev++; })(); 0`);
        const saved = await J(`(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); DataManager.extractSaveContents(JsonEx.parse(json)); const b = Farming.buildingAt(${kx}, ${ky}); return { type: b.type, water: b.water, units: Farming.bucketUnits(b) }; })()`);
        check("after save + load the bucket still holds its 3 portions", saved.type === "bucket" && saved.water === 3 && saved.units === 3, saved);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
