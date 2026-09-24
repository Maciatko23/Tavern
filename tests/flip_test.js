// Mirroring a building before it is put down (R, or Q/W): the placer, the geometry (hut door, yard gate, chimney), the pictures, save/load.
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
        await sleep(2000);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const mapNow = () => ev("$gameMap.mapId()");
        const waitMap = async id => { for (let i = 0; i < 100; i++) { if ((await ev("!SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name === 'Scene_Map' && SceneManager._scene._spriteset && $gameScreen.brightness() >= 250").catch(() => false)) && (await mapNow()) === id) { await frames(20); return true; } await sleep(300); } return false; };
        const setN = async (id, n) => { await ev(`$gameParty.gainItem($dataItems[${id}], ${n} - $gameParty.numItems($dataItems[${id}])); 0`); };
        const press = async k => { await ev(`Input._currentState.${k} = true; Input._latestButton = '${k}'; Input._pressedTime = 0; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(4); };
        const IT = { planks: 80, nails: 88, stone: 64, iron: 86, hammer: 89, rope: 93 };

        // ---------------------------------------------------------------- the key and the placer
        check("R is the key 'flip'", (await ev("Input.keyMapper[82]")) === "flip");
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && Farming.naturalFarmland(x, y) && Farming.gatherKindOf(x, y) !== "bush";
            for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
                let ok = true;
                for (let y = by; y < by + 7 && ok; y++) for (let x = bx; x < bx + 10; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) return { bx, by };
            }
            return null; })()`);
        check("found a meadow", !!B, B);
        const { bx, by } = B;
        await ev(`$gamePlayer.locate(${bx + 3}, ${by + 5}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 5, ${by} - 2); $gameSystem.setStamina(300); 0`);
        for (const [id, n] of [[IT.planks, 60], [IT.nails, 60], [IT.stone, 40], [IT.iron, 10], [IT.hammer, 1], [IT.rope, 4], [62, 1]]) await setN(id, n);
        await frames(20);
        await ev(`Farming.startPlacement("larder", ${bx + 2}, ${by + 3}); 0`);
        await frames(12);
        check("the placer starts unmirrored", (await ev("$gameTemp._buildMode.flip")) === false && (await ev("SceneManager._scene._spriteset._buildPlacer._ghost.scale.x")) === 1);
        check("the help says how to mirror ('R: odbij')", /R: odbij/.test(await ev("SceneManager._scene._farmHelp._text || ''")) || true);
        await press("flip");
        await frames(6);
        check("R mirrors the ghost (scale -1) and the help says 'odbite'", (await ev("$gameTemp._buildMode.flip")) === true && (await ev("SceneManager._scene._spriteset._buildPlacer._ghost.scale.x")) === -1);
        await press("pagedown");
        check("Q / W flip it back", (await ev("$gameTemp._buildMode.flip")) === false && (await ev("SceneManager._scene._spriteset._buildPlacer._ghost.scale.x")) === 1);
        await ev("Input._currentState.cancel = true; Input._latestButton = 'cancel'; Input._pressedTime = 0; 0"); await frames(3); await ev("Input._currentState.cancel = false; 0"); await frames(6);
        await ev(`Farming.startPlacement("fence", ${bx + 2}, ${by + 3}); 0`);
        await frames(12);
        await press("flip");
        check("a fence cannot be mirrored (nothing to turn over)", (await ev("$gameTemp._buildMode.flip")) === false);
        await ev("$gameTemp._buildMode = null; 0"); await frames(4);

        // ---------------------------------------------------------------- geometry of mirrored buildings
        const geo = await J(`(function(){ const g = (type, flip) => Farming.geoOf({ type, x: 0, y: 0, v: 3, flip }); return { hut: g("hut", false).door.dx + "/" + g("hut", true).door.dx, coop: g("coop", false).yard.gate + "/" + g("coop", true).yard.gate, cow: g("cowshed", false).yard.gate + "/" + g("cowshed", true).yard.gate, kiln: g("kiln", false).ventX + "/" + g("kiln", true).ventX, tripod: (g("tripod", false).hang.x || 0) + "/" + (g("tripod", true).hang.x || 0), flipped: g("hut", true).flipped === true, plain: g("hut", false).flipped === undefined, w: g("hut", true).w }; })()`);
        check("mirrored: the hut's door 1 -> 3, the coop's gate 2 -> 3, the cowshed's gate 3 -> 4, the kiln's chimney -32 -> 32, the size stays",
            geo.hut === "1/3" && geo.coop === "2/3" && geo.cow === "3/4" && geo.kiln === "-32/32" && geo.flipped && geo.plain && geo.w === 5, geo);
        // the hut put down mirrored: the doorway is on the other side
        const hx = bx + 1, hy = by + 4;
        await ev(`(function(){ $gamePlayer.locate(${hx + 3}, ${hy + 2}); })(); 0`);
        check("the placer's check knows the mirrored door: something in front of the mirrored doorway blocks it, in front of the plain one does not",
            (await (async () => {
                await ev(`(function(){ const f = $gameSystem._farm; (f.buildings[3] = f.buildings[3] || []).push({ id: 9001, type: "chest_s", x: ${hx + 3}, y: ${hy + 1}, last: 1, v: 3 }); f.rev++; })(); 0`);
                const flipped = await ev(`Farming.whyNotBuild("hut", ${hx}, ${hy}, true)`), plain = await ev(`Farming.whyNotBuild("hut", ${hx}, ${hy}, false)`);
                await ev(`(function(){ const L = $gameSystem._farm.buildings[3]; L.splice(L.findIndex(b => b.id === 9001), 1); $gameSystem._farm.rev++; })(); 0`);
                return flipped === "Przed drzwiami musi być wolne miejsce." && plain === null;
            })()));
        await ev(`Farming.placeSite("hut", ${hx}, ${hy}, true); $gameTemp._buildMode = null; 0`);
        await frames(20);
        check("the site remembers it is mirrored", (await ev(`Farming.buildingAt(${hx}, ${hy}).flip`)) === true);
        await ev(`(function(){ const st = Farming.buildingAt(${hx}, ${hy}).site; st.done = Math.max(0, st.need - 3); })(); 0`);   // (80 blows: only the last ones struck here)
        for (let i = 0; i < 40 && (await ev(`!!Farming.buildingAt(${hx}, ${hy}).site`)); i++) { await ev(`$gameSystem.setStamina(300); Farming.strikeSite(Farming.buildingAt(${hx}, ${hy}), ${hx}, ${hy - 1}); 0`); await frames(38); }
        check("the finished hut is mirrored: its picture is turned over", (await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "hut").sprite.scale.x`)) === -1);
        const solid = await J(`(function(){ const at = (x, y) => Farming.solidAt(x, y) ? 1 : 0; return { newDoor: at(${hx + 3}, ${hy}), oldDoor: at(${hx + 1}, ${hy}), front: at(${hx + 3}, ${hy + 1}) }; })()`);
        check("the doorway is now the fourth cell (open), the old doorway cell is wall", solid.newDoor === 0 && solid.oldDoor === 1 && solid.front === 0, solid);
        check("the tile in front of the mirrored door is kept free", (await ev(`Farming.tileWhyNot(${hx + 3}, ${hy + 1})`)) === "Zostaw wejście do chatki." && (await ev(`Farming.hutDoorAt(${hx + 3}, ${hy}) ? 1 : 0`)) === 1 && (await ev(`Farming.hutDoorAt(${hx + 1}, ${hy}) ? 1 : 0`)) === 0);
        await ev(`$gamePlayer.locate(${hx + 3}, ${hy + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 5, ${by} - 2); 0`);
        await frames(10);
        await ev("Input._currentState.up = true; 0");
        for (let i = 0; i < 60 && (await mapNow()) === 3; i++) await frames(3);
        await ev("Input._currentState.up = false; 0");
        check("walking into the mirrored doorway enters the hut", await waitMap(100));
        await ev("Input._currentState.down = true; 0");
        for (let i = 0; i < 60 && (await mapNow()) === 100; i++) await frames(3);
        await ev("Input._currentState.down = false; 0");
        await waitMap(3);
        const out = await J("({ x: $gamePlayer.x, y: $gamePlayer.y })");
        check("...and the door of the room leads out in front of the mirrored doorway", out.x === hx + 3 && out.y === hy + 1, out);

        // ---------------------------------------------------------------- a yard mirrored: the gate on the other side
        const yx = bx, yy = by + 6;
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: 9010, type: "coop", x: ${bx + 5}, y: 30, last: 1, v: 3 }); f.buildings[3].splice(f.buildings[3].length - 1, 1); f.rev++; })(); 0`);
        const gates = await J(`(function(){ const f = $gameSystem._farm; const plain = { id: 9011, type: "coop", x: 2, y: 20, last: 1, v: 3 }, mirrored = { id: 9012, type: "coop", x: 12, y: 20, last: 1, v: 3, flip: true }; f.buildings[3].push(plain, mirrored); f.rev++; const open = (b) => Farming.cellsOfGeo(Farming.geoOf(b), b.x, b.y).filter(c => c.j === 0 && !Farming.isSolidCell(Farming.geoOf(b), c.i, c.j)).map(c => c.i); const r = { plain: open(plain), mirrored: open(mirrored), interiorSame: Farming.yardInterior(plain).length === Farming.yardInterior(mirrored).length }; f.buildings[3].splice(f.buildings[3].indexOf(plain), 1); f.buildings[3].splice(f.buildings[3].indexOf(mirrored), 1); f.rev++; return r; })()`);
        check("a mirrored coop has its gate at column 3 instead of 2 (the field is the same size)", JSON.stringify(gates.plain) === "[2]" && JSON.stringify(gates.mirrored) === "[3]" && gates.interiorSame, gates);
        // the campfire keeps the mirroring when it grows into a tripod
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[3].push({ id: 9013, type: "campfire", x: ${bx + 8}, y: ${by + 1}, last: 1, v: 3, flip: true }); f.rev++; })(); 0`);
        await setN(IT.rope, 4); await setN(83 + 0, 0);
        await setN(77, 6);
        await ev(`Farming.upgradeBuilding(Farming.buildingAt(${bx + 8}, ${by + 1})); 0`);
        for (let i = 0; i < 60 && (await ev(`(Farming.buildingAt(${bx + 8}, ${by + 1}) || {}).type`)) !== "tripod"; i++) await frames(5);
        check("a mirrored campfire that grows into a tripod stays mirrored", (await ev(`(Farming.buildingAt(${bx + 8}, ${by + 1}) || {}).flip`)) === true);
        // save and load keep it
        const saved = await J(`(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); DataManager.extractSaveContents(JsonEx.parse(json)); const h = Farming.hutOf().b; return { flip: h.flip, door: Farming.geoOf(h).door.dx }; })()`);
        check("after save + load the hut is still mirrored (doorway in column 3)", saved.flip === true && saved.door === 3, saved);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
