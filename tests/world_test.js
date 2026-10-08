// The ground: it comes back as it was after a bucket / tent / building is taken away, digging leaves a pit, crops stand in the middle of their tile,
// mushrooms come and go (many after rain, several looks), berry bushes (berries -> bare -> fibre -> grow back).
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
        await sleep(2500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); $gameSystem._weatherOwn = false; 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const setN = async (id, n) => { await ev(`$gameParty.gainItem($dataItems[${id}], ${n} - $gameParty.numItems($dataItems[${id}])); 0`); };
        await ev("window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0");
        const pops = () => J("window.__pop.splice(0)");
        const waitSwing = async () => { await frames(4); for (let i = 0; i < 100 && (await ev("$gamePlayer.isToolSwinging()")); i++) await frames(3); await frames(6); };
        const setDay = async d => { await ev(`$gameSystem._dayNightDay = ${d}; $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); 0`); await frames(4); };
        const plots = () => J(`($gameSystem._farm.plots[3] || {})`);
        const IT = { planks: 80, iron: 86, shovel: 62, soil: 78, rake: 65, berries: 102, mushroom: 103, fiber: 92, bucket: 138 };

        // ---------------------------------------------------------------- a meadow
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 10; bx++) {
                let ok = true;
                for (let y = by; y < by + 5 && ok; y++) for (let x = bx; x < bx + 8; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a meadow of natural grass (no bushes on it)", !!B, B);
        const { bx, by } = B;
        await ev(`$gamePlayer.locate(${bx + 1}, ${by + 3}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 6, ${by} - 3); $gameSystem.setStamina(100); 0`);
        await frames(20);

        // ---------------------------------------------------------------- the ground after a bucket is taken away
        await setN(IT.bucket, 1);   // the bucket is forged at the forge and put down ready from the bag
        const kx = bx + 2, ky = by + 2;
        await ev(`Farming.pitchInstant("bucket", ${kx}, ${ky}); 0`);
        await waitSwing();
        const withBucket = await plots();
        check("a bucket put on the grass marks its tile", Object.keys(withBucket).join() === kx + "," + ky, withBucket);
        await ev(`Farming.packUp(Farming.buildingAt(${kx}, ${ky})); 0`);
        await waitSwing();
        check("taken up again, the ground is exactly as it was (no brown patch left: no stored plot)", (await count(IT.bucket)) === 1 && Object.keys(await plots()).length === 0, await plots());
        check("...and the tile is natural ground again (grass you can rake)", (await ev(`(Farming.plotAt(${kx}, ${ky}) || {}).natural`)) === true);
        // a building taken down leaves the grass too; ground that was worked on stays worked
        await setN(IT.planks, 10);
        await ev(`(function(){ const f = $gameSystem._farm; const L = (f.buildings[3] = f.buildings[3] || []); const claimed = Farming.claimGround([{ x: ${kx}, y: ${ky} }, { x: ${kx + 1}, y: ${ky} }]); L.push({ id: f.nextId++, type: "chest_s", x: ${kx}, y: ${ky}, last: 1, v: 3, claimed }); L.push({ id: f.nextId++, type: "chest_s", x: ${kx + 1}, y: ${ky}, last: 1, v: 3, claimed: [] }); f.rev++; })(); 0`);
        await ev(`$gameSystem._farm.plots[3]["${kx + 1},${ky}"].s = "raked"; 0`);
        await ev(`Farming.demolish(Farming.buildingAt(${kx}, ${ky})); Farming.demolish(Farming.buildingAt(${kx + 1}, ${ky})); 0`);
        const after = await plots();
        check("demolishing gives back the grass under it (the tile that was raked meanwhile stays raked)", after[kx + "," + ky] === undefined && after[(kx + 1) + "," + ky] && after[(kx + 1) + "," + ky].s === "raked", after);
        await ev(`delete $gameSystem._farm.plots[3]["${kx + 1},${ky}"]; $gameSystem._farm.rev++; 0`);
        // b.fresh belongs to Spoilage (the freshness of what a chest holds): building a chest must not disturb it
        await ev(`(function(){ const f = $gameSystem._farm; const claimed = Farming.claimGround([{ x: ${kx}, y: ${ky} }]); f.buildings[3].push({ id: f.nextId++, type: "chest_s", x: ${kx}, y: ${ky}, last: 1, v: 3, claimed }); f.rev++; })(); 0`);
        await setN(71, 3);
        const moved = await ev(`(function(){ const c = Farming.buildingAt(${kx}, ${ky}); const r = Farming.putInChest(c, $dataItems[71], 3); return { moved: r, fresh: c.fresh && Object.keys(c.fresh).length, claimed: c.claimed }; })()`);
        check("a chest keeps the freshness of its food (b.fresh) apart from the remembered ground (b.claimed)", moved.moved === 3 && moved.fresh === 1 && JSON.stringify(moved.claimed) === JSON.stringify([kx + "," + ky]), moved);
        await ev(`(function(){ const c = Farming.buildingAt(${kx}, ${ky}); Farming.takeFromChest(c, $dataItems[71], 3); const L = $gameSystem._farm.buildings[3]; L.splice(L.indexOf(c), 1); delete $gameSystem._farm.plots[3]["${kx},${ky}"]; $gameSystem._farm.rev++; })(); 0`);

        // ---------------------------------------------------------------- digging leaves a pit
        await setN(IT.shovel, 1); await setN(IT.soil, 0);
        await ev(`$gamePlayer.locate(${kx}, ${ky + 1}); $gamePlayer.setDirection(8); $gameSystem.setStamina(100); 0`);
        await ev(`Farming.dig(${kx}, ${ky}); 0`); await waitSwing();
        let p = (await plots())[kx + "," + ky];
        check("digging on the grass turns the tile into a dug patch: a pit (dug 1), soil in the bag", !!p && p.s === "cleared" && p.dug === 1 && (await count(IT.soil)) >= 2, p);
        const entries = await ev(`SceneManager._scene._spriteset._farmLayer._entries.filter(e => e.x === ${kx} && e.y === ${ky}).length`);
        check("the ground shows it: the soil patch AND the pit are drawn on that tile", entries === 2, entries);
        await ev(`Farming.dig(${kx}, ${ky}); 0`); await waitSwing();
        await ev(`Farming.dig(${kx}, ${ky}); 0`); await waitSwing();
        await ev(`Farming.dig(${kx}, ${ky}); 0`); await waitSwing();
        p = (await plots())[kx + "," + ky];
        check("every shovelful makes it deeper, up to 3", p.dug === 3, p);
        check("nothing can be built on a pit ('Najpierw zagrab dół.')", (await ev(`Farming.whyNotBuild("chest_s", ${kx}, ${ky})`)) === "Najpierw zagrab dół.");
        await setN(IT.rake, 1);
        await ev(`Farming.rake(${kx}, ${ky}); 0`); await waitSwing();
        p = (await plots())[kx + "," + ky];
        check("raking levels the pit (raked ground, no pit)", p.s === "raked" && p.dug === undefined, p);
        await ev(`delete $gameSystem._farm.plots[3]["${kx},${ky}"]; $gameSystem._farm.rev++; 0`);

        // ---------------------------------------------------------------- crops stand in the middle of the tile
        await ev(`(function(){ const pl = $gameSystem._farm.plots[3] = $gameSystem._farm.plots[3] || {}; pl["${kx},${ky}"] = { s: "tilled", crop: "potato", day: 1 }; $gameSystem._farm.rev++; })(); 0`);
        await frames(20);
        const cy = await J(`(function(){ const e = SceneManager._scene._spriteset._farmLayer._entries.find(e => e.x === ${kx} && e.y === ${ky} && e.dy !== undefined); return e ? { dy: e.dy, y: e.sprite.y, tileY: Math.round($gameMap.adjustY(${ky}) * 48) } : null; })()`);
        check("a sown plant is drawn 8 px higher than the tile's top edge offset (it stood on the bottom edge)", !!cy && cy.dy === -8 && cy.y === cy.tileY - 8, cy);
        await ev(`delete $gameSystem._farm.plots[3]["${kx},${ky}"]; $gameSystem._farm.rev++; 0`);

        // ---------------------------------------------------------------- mushrooms
        const scan = kind => J(`(function(){ let n = 0; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) if (Farming.gatherAt(x, y) === ${JSON.stringify(kind)}) n++; return n; })()`);
        const rainy = await J(`(function(){ const p = n => { const w = Survival.weatherPlan(n); return w && w.type === "rain" ? 1 : 0; }; let wet = null, dry = null; for (let d = 60; d <= 84; d++) { const recent = p(d) + p(d - 1) + p(d - 2); if (!wet || recent > wet.r) wet = { d, r: recent }; if (!dry || recent < dry.r) dry = { d, r: recent }; } return { wet, dry }; })()`);
        await setDay(rainy.wet.d); const wetN = await scan("mushroom");
        await setDay(rainy.dry.d); const dryN = await scan("mushroom");
        check("mushrooms after rain are far more numerous than after dry days (autumn): " + wetN + " vs " + dryN, wetN >= 6 && wetN >= dryN * 2, { wet: rainy.wet, dry: rainy.dry, wetN, dryN });
        await setDay(1);
        check("in the first days of spring only a few grow", (await scan("mushroom")) <= 3);
        await setDay(100);
        check("in winter there are none", (await scan("mushroom")) === 0);
        await setDay(rainy.wet.d); await frames(30);
        const looks = await J(`(function(){ const layer = SceneManager._scene._spriteset._stoneLayer; const urls = new Set(); for (const e of layer._entries) { const u = e.sprite.bitmap._url || ""; if (/Gather_Mushroom_/.test(u)) urls.add(u); } return urls.size; })()`);
        check("the mushrooms come in several looks (at least 3 different pictures on the map at once)", looks >= 3, looks);
        // the plants bend in the wind (a mesh bent at the foot, a spring towards the gusts' push), pebbles, branches and cones lie
        // still; someone standing right beside a plant pushes it aside, away from them
        await ev(`(function(){ const l = SceneManager._scene._spriteset._stoneLayer, ox = $gameMap.displayX() * 48, oy = $gameMap.displayY() * 48;
            window.__plant = l._swaying.find(e => e.gx - ox > 60 && e.gx - ox < Graphics.width - 60 && e.gy - oy > 60 && e.gy - oy < Graphics.height - 60); return 0; })()`);
        const swayOf = `(function(){ const l = SceneManager._scene._spriteset._stoneLayer, p = window.__plant;
            const still = l._entries.filter(e => /Gather_(Stone|Branch|Cone)_/.test(e.sprite.bitmap._url || ""));
            return { n: l._swaying.length, mesh: !!(p && p.sprite.geometry), bend: p ? p.bend : null, max: p ? p.maxBend : 0,
                tip: p ? p.sprite.geometry.getBuffer("aVertexPosition").data[0] : null, foot: p ? p.sprite.geometry.getBuffer("aVertexPosition").data[24] : null,
                still: still.length, stillBent: still.filter(e => e.sprite.geometry || e.sprite.skew.x !== 0).length }; })()`;
        const sw1 = await J(swayOf); await frames(40); const sw2 = await J(swayOf);
        check("plants bend in the wind (the tip moves, the foot stays, within their limit); pebbles, branches and cones lie still",
            sw1.n > 0 && sw1.mesh && sw2.bend !== sw1.bend && sw2.tip !== sw1.tip && sw2.foot === 0 && Math.abs(sw2.bend) <= sw2.max * 1.6 && sw2.still > 0 && sw2.stillBent === 0, { sw1, sw2 });
        const pushed = async side => { await ev(`(function(){ const l = SceneManager._scene._spriteset._stoneLayer, p = window.__plant; l.__walk = l.swayWalkers;
            const ox = $gameMap.displayX() * 48, oy = $gameMap.displayY() * 48; l.swayWalkers = () => [{ x: p.gx - ox - ${side} * 5, y: p.gy - oy }]; return 0; })()`);
            await frames(60); const b = await ev("window.__plant.bend");
            await ev("(function(){ const l = SceneManager._scene._spriteset._stoneLayer; l.swayWalkers = l.__walk; return 0; })()"); await frames(60); return b; };
        const fromLeft = await pushed(1), fromRight = await pushed(-1);
        check("a walker beside a plant pushes it aside, away from them (from the left it leans right, from the right it leans left)", fromLeft > 2 && fromRight < fromLeft - 4, { fromLeft, fromRight });
        // picking one: it is gone; a mushroom born later may grow there again
        const spot = await J(`(function(){ for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { if (Farming.gatherAt(x, y) !== "mushroom") continue; for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if ($gameMap.isPassable(x + dx, y + dy, 2) && !Farming.gatherAt(x + dx, y + dy)) return { x, y, sx: x + dx, sy: y + dy }; } return null; })()`);
        await ev(`$gamePlayer.locate(${spot.sx}, ${spot.sy}); $gameSystem.setStamina(100); 0`);
        const m0 = await count(IT.mushroom);
        await ev(`Farming.pickGather(${spot.x}, ${spot.y}); 0`); await waitSwing();
        const got = (await count(IT.mushroom)) - m0;
        check("picking a mushroom gives 1-2 mushrooms and it is gone (that tile shows nothing now)", got >= 1 && got <= 2 && (await ev(`Farming.gatherAt(${spot.x}, ${spot.y})`)) === false, { got });
        // the same tile a few days on: a mushroom is there only when a new one was born after the picking
        let again = false;
        for (let d = rainy.wet.d + 1; d <= rainy.wet.d + 12; d++) { await setDay(d); if ((await ev(`Farming.gatherAt(${spot.x}, ${spot.y})`)) === "mushroom") { again = (await ev(`Farming.mushroomBirth(${spot.x}, ${spot.y})`)) > rainy.wet.d; break; } }
        console.log("   (a new mushroom on that tile within 12 days:", again, ")");
        check("mushrooms of the same tile live at most 3 days and never come back by themselves the same day", (await (async () => { await setDay(rainy.wet.d); return ev(`Farming.gatherAt(${spot.x}, ${spot.y})`); })()) === false);

        // ---------------------------------------------------------------- berry bushes
        await setDay(1);
        const bushes = await J(`(function(){ const out = []; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { if (Farming.gatherAt(x, y) !== "bush") continue; for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if ($gameMap.isPassable(x + dx, y + dy, 2) && !Farming.gatherAt(x + dx, y + dy)) { out.push({ x, y, sx: x + dx, sy: y + dy }); break; } } return out; })()`);
        check("the farm map has berry bushes (at least 8), all with berries in the first spring", bushes.length >= 8 && (await J(`${JSON.stringify(bushes.map(b => [b.x, b.y]))}.every(([x, y]) => Farming.bushState(x, y) === "full")`)), bushes.length);
        const bu = bushes[0];
        check("a bush keeps the player out and nothing can be raked, dug or built on it", (await ev(`$gameMap.isPassable(${bu.x}, ${bu.y}, 8) || $gameMap.isPassable(${bu.x}, ${bu.y}, 2)`)) === false && (await ev(`Farming.plotAt(${bu.x}, ${bu.y})`)) === null && (await ev(`Farming.whyNotBuild("chest_s", ${bu.x}, ${bu.y})`)) === "Trzeba oczyszczonej ziemi.");
        const bushPics = await J(`(function(){ const layer = SceneManager._scene._spriteset._stoneLayer; const list = layer._entries.filter(e => /Gather_Bush_/.test(e.sprite.bitmap._url || "")); return { n: list.length, full: list.filter(e => /Bush_[01]\.png/.test(e.sprite.bitmap._url)).length, size: list[0] && [list[0].sprite.bitmap.width, list[0].sprite.bitmap.height] }; })()`);
        check("the bushes are drawn from their pictures (45 x 44), all with berries in spring", bushPics.n >= 8 && bushPics.full === bushPics.n && bushPics.size[0] === 45 && bushPics.size[1] === 44, bushPics);
        await ev(`$gamePlayer.locate(${bu.sx}, ${bu.sy}); $gameSystem.setStamina(100); 0`);
        await setN(IT.berries, 0); await setN(IT.fiber, 0); await pops();
        await ev(`Farming.pickGather(${bu.x}, ${bu.y}); 0`); await waitSwing();
        const berries = await count(IT.berries);
        check("picking a bush with berries gives 2-4 berries, the bush stays but bare", berries >= 2 && berries <= 4 && (await ev(`Farming.bushState(${bu.x}, ${bu.y})`)) === "empty" && (await ev(`Farming.gatherAt(${bu.x}, ${bu.y})`)) === "bush", { berries });
        check("the bare bush still blocks the way", (await ev(`$gameMap.isPassable(${bu.x}, ${bu.y}, 8) || $gameMap.isPassable(${bu.x}, ${bu.y}, 2)`)) === false);
        await ev(`Farming.pickGather(${bu.x}, ${bu.y}); 0`); await waitSwing();
        const fibre = await count(IT.fiber);
        check("picking the bare bush gives 1-2 flax fibres ('Krzak poszedł na włókna') and the bush is gone", fibre >= 1 && fibre <= 2 && (await pops()).some(t => /Krzak poszedł na włókna/.test(t)) && (await ev(`Farming.bushState(${bu.x}, ${bu.y})`)) === "gone" && (await ev(`Farming.gatherAt(${bu.x}, ${bu.y})`)) === false, { fibre });
        check("...so the way is free and the ground can be used", (await ev(`$gameMap.isPassable(${bu.x}, ${bu.y}, 8)`)) === true && (await ev(`(Farming.plotAt(${bu.x}, ${bu.y}) || {}).natural`)) === true);
        await setDay(1 + 7);
        check("7 days later it is still gone", (await ev(`Farming.bushState(${bu.x}, ${bu.y})`)) === "gone");
        await setDay(1 + 8);
        check("8 days later a new bush with berries has grown", (await ev(`Farming.bushState(${bu.x}, ${bu.y})`)) === "full" && (await ev(`Farming.gatherAt(${bu.x}, ${bu.y})`)) === "bush");
        // a bare bush that is left alone fruits again after 4 days
        const bu2 = bushes[1];
        await ev(`$gamePlayer.locate(${bu2.sx}, ${bu2.sy}); $gameSystem.setStamina(100); 0`);
        await setDay(20);
        await ev(`Farming.pickGather(${bu2.x}, ${bu2.y}); 0`); await waitSwing();
        await setDay(23);
        check("a picked bush left alone is still bare after 3 days...", (await ev(`Farming.bushState(${bu2.x}, ${bu2.y})`)) === "empty");
        await setDay(24);
        check("...and has berries again after 4", (await ev(`Farming.bushState(${bu2.x}, ${bu2.y})`)) === "full");
        // winter: bare bushes, only fibre
        await setDay(100);
        const bu3 = bushes[2];
        check("in winter every bush is bare (no berries)", (await ev(`Farming.bushState(${bu3.x}, ${bu3.y})`)) === "empty");
        await ev(`$gamePlayer.locate(${bu3.sx}, ${bu3.sy}); $gameSystem.setStamina(100); 0`);
        await setN(IT.berries, 0); await setN(IT.fiber, 0);
        await ev(`Farming.pickGather(${bu3.x}, ${bu3.y}); 0`); await waitSwing();
        check("a bare bush in winter gives fibre, no berries", (await count(IT.fiber)) >= 1 && (await count(IT.berries)) === 0 && (await ev(`Farming.bushState(${bu3.x}, ${bu3.y})`)) === "gone");
        // berries quench thirst a little
        await ev("Needs.setEnabled(true); (function(){ Needs.state().water = 40; Needs.state().food = 40; })(); $gameSystem.setStamina(50); 0");
        await setN(IT.berries, 3);
        await ev(`$gameParty.members()[0].useItem($dataItems[${IT.berries}]); 0`);
        check("eating berries gives a little water (+10) and food (+8)", Math.abs((await ev("Needs.state().water")) - 50) < 1.5 && Math.abs((await ev("Needs.state().food")) - 48) < 1.5, { water: await ev("Needs.state().water"), food: await ev("Needs.state().food") });
        // save and load keep the bushes' state
        await setDay(30);
        const saved = await J(`(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); DataManager.extractSaveContents(JsonEx.parse(json)); return { rec: ($gameSystem._farm.bushes || {})[3] ? Object.keys($gameSystem._farm.bushes[3]).length : 0 }; })()`);
        check("after save + load the picked bushes are still remembered", saved.rec >= 3, saved);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
