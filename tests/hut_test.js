// The hut: a house the player builds (one per game), a 5 x 2 room of its own (Map100) that can be furnished, doorway in and out.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(12); $gameScreen.clearWeather(); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const mapNow = () => ev("$gameMap.mapId()");
        const waitMap = async id => { for (let i = 0; i < 100; i++) { if ((await ev("!SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && SceneManager._scene.constructor.name === 'Scene_Map' && SceneManager._scene._spriteset && $gameScreen.brightness() >= 250").catch(() => false)) && (await mapNow()) === id) { await frames(20); return true; } await sleep(300); } return false; };
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const setN = async (id, n) => { await ev(`$gameParty.gainItem($dataItems[${id}], ${n} - $gameParty.numItems($dataItems[${id}])); 0`); };
        await ev("window.__pop = []; const o = $gameTemp.pushLootPopup.bind($gameTemp); $gameTemp.pushLootPopup = (i, t, c) => { window.__pop.push(t); return o(i, t, c); }; 0");
        const pops = () => J("window.__pop.splice(0)");
        const IT = { planks: 80, nails: 88, stone: 64, iron: 86, hammer: 89, wool: 111, wood: 61 };
        const stone = IT.stone;
        // the morning message after a night's sleep waits for a key
        const dismiss = async () => {
            const press = async k => { await ev(`Input._currentState.${k} = true; Input._latestButton = '${k}'; Input._pressedTime = 0; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
            let quiet = 0;
            for (let i = 0; i < 80 && quiet < 12; i++) {
                if (await ev("$gameMessage.isBusy()")) { quiet = 0; await press("ok"); }
                else if ((await ev("SceneManager._scene.constructor.name")) !== "Scene_Map") { quiet = 0; await press("cancel"); }   // the summary of the day
                else if (await ev("!!$gameTemp._farmMenuOpen")) { quiet = 0; await press("cancel"); }   // the last press of OK may have opened the menu of the tile in front
                else { quiet++; await frames(5); }
            }
            await frames(10);
        };
        // walks with a key until the map changes (or the frames run out)
        const walkUntilMap = async (key, from) => { await ev(`Input._currentState.${key} = true; 0`); for (let i = 0; i < 80 && (await mapNow()) === from; i++) await frames(3); await ev(`Input._currentState.${key} = false; 0`); };

        // ---------------------------------------------------------------- data
        const def = await J(`(function(){ const h = Farming.BUILDINGS.hut, B = Farming.BUILDINGS; return { w: h.w, h: h.h, door: h.door, single: h.single, cost: h.cost, image: h.image, hutMap: Farming.HUT_MAP,
            indoor: Object.keys(B).filter(k => B[k].indoor).sort(), indoorOnly: Object.keys(B).filter(k => B[k].indoorOnly).sort(), bed: { sleep: B.bed.sleep, w: B.bed.w, cost: B.bed.cost }, larder: { keeps: B.larder.keeps, slots: B.larder.slots, food: B.larder.foodOnly, w: B.larder.w } }; })()`);
        check("Chatka: 5 x 3 field, the doorway in column 3, only one, costs 30 planks + 40 nails + 20 stones + 6 iron",
            def.w === 5 && def.h === 3 && def.door.dx === 3 && def.single === true && JSON.stringify(def.cost) === JSON.stringify([[IT.planks, 30], [IT.nails, 40], [IT.stone, 20], [IT.iron, 6]]), def);
        check("furniture that may stand inside: bench, both chests, workbench, bedroll + the bed and the larder (only inside); the pantry stays outdoors",
            JSON.stringify(def.indoor) === JSON.stringify(["bed", "bedroll", "bench", "chest_l", "chest_s", "larder", "workbench"]) && JSON.stringify(def.indoorOnly) === JSON.stringify(["bed", "larder"]), { indoor: def.indoor, only: def.indoorOnly });
        check("bed: 2 wide, sleeps; larder: 1 tile, keeps food 5 x longer (0.2), 24 kinds, food only", def.bed.sleep === true && def.bed.w === 2 && def.larder.keeps === 0.2 && def.larder.slots === 24 && def.larder.food === true && def.larder.w === 1, def);
        const imgs = await ev(`Promise.all(["Farm_Hut_L", "Farm_Bed", "Farm_Larder"].map(n => new Promise(res => { const bm = ImageManager.loadSystem(n); bm.addLoadListener(() => res(bm.width + "x" + bm.height)); })))`);
        check("the pictures load: hut 266 x 137, bed 96 x 64, larder 61 x 101", JSON.stringify(imgs) === JSON.stringify(["266x137", "96x64", "61x101"]), imgs);
        const map = await ev(`fetch("data/Map100.json").then(r => r.json()).then(m => ({ w: m.width, h: m.height, ts: m.tilesetId, note: m.note, ev: m.events.filter(Boolean).length, name: m.displayName }))`);
        check("Map100: 7 x 6 tiles (a 5 x 2 floor), the cottage tileset, a dark interior with two windows and a lamp", map.w === 7 && map.h === 6 && map.ts === 8 && /<Dark:on>/.test(map.note) && map.ev === 3, map);

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
        const hx = bx + 1, hy = by + 4, dX = hx + 3, fY = hy + 1;   // the hut: cells hx..hx+4, hy-2..hy; the doorway (dX, hy); the tile in front of it (dX, fY)
        const stand = (x, y, dir) => ev(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${dir}); $gameMap.setDisplayPos(${bx} - 6, ${by} - 2); $gameSystem.setStamina(100); 0`);
        await stand(dX, fY + 1, 8);
        await frames(20);

        // ---------------------------------------------------------------- placing and building
        for (const id of [IT.planks, IT.nails, IT.stone, IT.iron, IT.hammer]) await setN(id, 0);
        check("without materials the placer says so (and the spot itself is fine)", (await ev(`Farming.placementProblem("hut", ${hx}, ${hy})`)) === "Brakuje materiałów." && (await ev(`Farming.whyNotBuild("hut", ${hx}, ${hy})`)) === null);
        await setN(IT.planks, 30); await setN(IT.nails, 40); await setN(IT.stone, 20); await setN(IT.iron, 6); await setN(IT.hammer, 1);
        check("with the materials it can be placed", (await ev(`Farming.placementProblem("hut", ${hx}, ${hy})`)) === null);
        // something in front of the door: refused
        await ev(`(function(){ const f = $gameSystem._farm; (f.buildings[3] = f.buildings[3] || []).push({ id: 9001, type: "chest_s", x: ${dX}, y: ${fY}, last: 1, v: 3 }); f.rev++; })(); 0`);
        check("something standing in front of the doorway: 'Przed drzwiami musi być wolne miejsce.'", (await ev(`Farming.whyNotBuild("hut", ${hx}, ${hy})`)) === "Przed drzwiami musi być wolne miejsce.");
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3]; L.splice(L.findIndex(b => b.id === 9001), 1); f.rev++; })(); 0`);
        await ev(`Farming.placeSite("hut", ${hx}, ${hy}); $gameTemp._buildMode = null; 0`);
        await frames(20);
        const site = await J(`(function(){ const b = Farming.buildingAt(${hx}, ${hy}); return b ? { type: b.type, v: b.v, need: b.site && b.site.need, done: b.site && b.site.done } : null; })()`);
        check("a building site appears (20 hammer blows of 2 stamina)", !!site && site.type === "hut" && site.v === 3 && site.need === 20 && site.done === 0, site);
        check("the materials are spent", (await count(IT.planks)) === 0 && (await count(IT.nails)) === 0 && (await count(stone)) === 0 && (await count(IT.iron)) === 0);
        check("a hut that is only a site cannot be entered yet", (await ev(`Farming.hutDoorAt(${dX}, ${hy})`)) === null);
        let blows = 0;
        for (let i = 0; i < 60; i++) {
            if (!(await ev(`!!Farming.buildingAt(${hx}, ${hy}).site`))) break;
            await ev(`$gameSystem.setStamina(100); (function(){ const b = Farming.buildingAt(${hx}, ${hy}); Farming.strikeSite(b, ${hx}, ${hy - 1}); })(); 0`);
            blows++;
            await frames(38);
        }
        check("hammer blows finish the hut", !(await ev(`!!Farming.buildingAt(${hx}, ${hy}).site`)), { blows });
        check("popup 'Gotowe: Chatka'", (await pops()).some(t => /Gotowe: Chatka/.test(t)));
        await frames(45);
        check("the journal goal 'Zbuduj chatkę' is done", await ev(`Journal.goalDone(Journal.GOALS.find(g => g.id === "hut"))`));

        // ---------------------------------------------------------------- the doorway and the walls
        const solid = await J(`(function(){ const at = (x, y) => Farming.solidAt(x, y) ? 1 : 0; return { door: at(${dX}, ${hy}), leftOfDoor: at(${dX - 1}, ${hy}), rightOfDoor: at(${dX + 1}, ${hy}), aboveDoor: at(${dX}, ${hy - 1}), corner: at(${hx}, ${hy}), far: at(${hx + 4}, ${hy - 2}), front: at(${dX}, ${fY}), doorIsHut: (Farming.buildingAt(${dX}, ${hy}) || {}).type }; })()`);
        check("only the doorway is open: the rest of the 5 x 3 field is solid", solid.door === 0 && solid.leftOfDoor === 1 && solid.rightOfDoor === 1 && solid.aboveDoor === 1 && solid.corner === 1 && solid.far === 1 && solid.front === 0 && solid.doorIsHut === "hut", solid);
        check("the doorway can be walked into (passable), the wall next to it cannot", (await ev(`$gameMap.isPassable(${dX}, ${hy}, 8)`)) === true && (await ev(`$gameMap.isPassable(${dX + 1}, ${hy}, 8)`)) === false);
        check("nothing may be built on the tile in front of the door", (await ev(`Farming.tileWhyNot(${dX}, ${fY})`)) === "Zostaw wejście do chatki.");
        check("a second hut is refused: 'Masz już chatkę.'", (await ev(`Farming.whyNotBuild("hut", ${bx + 1}, ${by + 6})`)) === "Masz już chatkę.");
        // the build menu (captured) lists it disabled
        await ev(`(function(){ const sc = SceneManager._scene; sc.__open = sc.openFarmMenu; sc.openFarmMenu = (title, entries) => { window.__menu = { title, entries: entries.map(e => ({ name: e.name, enabled: e.enabled !== false, help: e.help || "" })) }; }; })(); 0`);
        await ev(`(function(){ const m = Farming.menuFor(${bx}, ${by}); const e = m.entries.find(e => e.name === "Zbuduj..."); e.run(); })(); 0`);
        const bm = await J("window.__menu");
        const hutEntry = bm.entries.find(e => e.name === "Chatka");
        check("the build menu shows 'Chatka' greyed out (already built) and does not list the bed or the larder outdoors",
            !!hutEntry && hutEntry.enabled === false && /Masz już chatkę/.test(hutEntry.help) && !bm.entries.some(e => e.name === "Łóżko" || e.name === "Kredens") && bm.entries.some(e => e.name === "Spiżarnia"), { hut: hutEntry, names: bm.entries.map(e => e.name) });
        const wallMenu = await J(`(function(){ const m = Farming.menuFor(${hx}, ${hy}); return m.entries.map(e => [e.name, e.enabled !== false]); })()`);
        check("the hut's menu: 'Wejdź do środka' first, 'Rozbierz' possible (nothing inside)", wallMenu[0][0] === "Wejdź do środka" && wallMenu.some(e => e[0] === "Rozbierz" && e[1]), wallMenu);

        // ---------------------------------------------------------------- walking in
        await stand(dX, fY, 8);
        await frames(10);
        await walkUntilMap("up", 3);
        check("walking up into the doorway leaves the farm", (await mapNow()) === 100 || (await waitMap(100)));
        await waitMap(100);
        for (let i = 0; i < 40 && (await ev("$gameScreen.zoomScale()")) < 2.39; i++) await frames(10);
        const inside = await J("({ map: $gameMap.mapId(), w: $gameMap.width(), h: $gameMap.height(), px: $gamePlayer.x, py: $gamePlayer.y, dir: $gamePlayer.direction(), zoom: $gameScreen.zoomScale(), free: Farming.isHutInterior(), room: Farming.HUT_ROOM })");
        check("inside: Map100 (7 x 6), the player stands in front of the door facing the back wall, the view is zoomed in 2.4 x",
            inside.map === 100 && inside.w === 7 && inside.h === 6 && inside.px === 3 && inside.py === 4 && inside.dir === 8 && inside.zoom >= 2.39 && inside.free &&
            JSON.stringify(inside.room) === JSON.stringify({ x0: 1, x1: 5, y0: 3, y1: 4, doorX: 3, doorY: 5 }), inside);
        const pass = await J(`[[1,3],[2,3],[3,3],[4,3],[5,3],[1,4],[2,4],[3,4],[4,4],[5,4],[3,5]].map(c => $gameMap.isPassable(c[0], c[1], 2) || $gameMap.isPassable(c[0], c[1], 8))`);
        const walls = await J(`[[0,3],[6,3],[3,1],[3,2],[1,2],[5,2],[0,0],[6,5],[1,5],[2,5],[4,5]].map(c => $gameMap.isPassable(c[0], c[1], 2) || $gameMap.isPassable(c[0], c[1], 8))`);
        check("the 5 x 2 floor can be walked on (the door too), walls cannot", pass.every(Boolean) && walls.every(v => !v), { pass, walls });
        check("the floor is 'ground for furniture' (9 tiles), the tile in front of the door and the door are not", (await J(`[[1,3],[5,4],[2,4],[3,3],[4,4]].map(c => (Farming.plotAt(c[0], c[1]) || {}).s)`)).every(s => s === "floor") && (await ev("Farming.plotAt(3, 4)")) === null && (await ev("Farming.plotAt(3, 5)")) === null);
        check("nothing can be built in front of the door, on the door or in the walls (with the reasons)", (await ev("Farming.tileWhyNot(3, 4)")) === "Zostaw przejście do drzwi." && (await ev("Farming.tileWhyNot(3, 5)")) === "Zostaw przejście do drzwi." && (await ev("Farming.tileWhyNot(0, 3)")) === "Tu się nie zmieści." && (await ev("Farming.tileWhyNot(1, 5)")) === "Tu się nie zmieści." && (await ev("Farming.tileWhyNot(6, 4)")) === "Tu się nie zmieści.");
        check("the pantry, a kiln or a second hut cannot be put inside; the bed can", (await ev(`Farming.whyNotBuild("pantry", 1, 3)`)) === "Tego nie postawisz w chatce." && (await ev(`Farming.whyNotBuild("kiln", 1, 3)`)) === "Tego nie postawisz w chatce." && (await ev(`Farming.whyNotBuild("hut", 1, 3)`)) === "Masz już chatkę." && (await ev(`Farming.whyNotBuild("bed", 1, 3)`)) === null);

        // ---------------------------------------------------------------- furniture must never shut the player in
        await ev(`(function(){ const f = $gameSystem._farm; (f.buildings[100] = f.buildings[100] || []).push({ id: 9101, type: "larder", x: 2, y: 3, last: 1, v: 3 }); f.rev++; })(); 0`);
        await ev(`$gamePlayer.locate(1, 3); $gamePlayer.setDirection(2); 0`);
        check("standing in the corner (1,3) with a larder beside him, a chest below him would shut him in: 'Zablokowałbyś sobie wyjście.'", (await ev(`Farming.whyNotBuild("chest_s", 1, 4)`)) === "Zablokowałbyś sobie wyjście.");
        check("...but a chest on the far side (5,4) is fine, and the same chest is fine when the player stands in front of the door", (await ev(`Farming.whyNotBuild("chest_s", 5, 4)`)) === null && (await (async () => { await ev(`$gamePlayer.locate(3, 4); 0`); return ev(`Farming.whyNotBuild("chest_s", 1, 4)`); })()) === null);
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[100]; L.splice(L.findIndex(b => b.id === 9101), 1); f.rev++; })(); 0`);

        // ---------------------------------------------------------------- furniture of an older, smaller room goes back to the bag
        await setN(IT.planks, 0); await setN(71, 0);
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[100]; L.push({ id: 9102, type: "bench", x: 3, y: 5, last: 1, v: 3 }, { id: 9103, type: "chest_s", x: 3, y: 4, last: 1, v: 3, store: { i71: 5 } }); f.rev++; })(); 0`);
        await ev("Farming.hutSanitize(false); 0");
        check("furniture standing where the floor is not (the door, the tile in front of it) is sent back: the bench's 2 planks, the chest's 4 planks and its 5 potatoes",
            (await ev(`(f => f.buildings[100].length)($gameSystem._farm)`)) === 0 && (await count(IT.planks)) === 6 && (await count(71)) === 5, { planks: await count(IT.planks), potatoes: await count(71), left: await ev(`$gameSystem._farm.buildings[100].length`) });

        // ---------------------------------------------------------------- the menu of the empty floor
        await ev(`(function(){ const sc = SceneManager._scene; sc.__open = sc.openFarmMenu; sc.openFarmMenu = (title, entries) => { window.__menu = { title, entries: entries.map(e => ({ name: e.name, enabled: e.enabled !== false, help: e.help || "" })) }; }; })(); 0`);
        await ev(`$gamePlayer.locate(3, 4); 0`);
        const fm = await J(`(function(){ const m = Farming.menuFor(2, 3); return { title: m.title, names: m.entries.map(e => e.name) }; })()`);
        check("the empty floor offers what to put there (title 'Wyposaż chatkę'): bed, larder, workbench, chests, bench, bedroll - and nothing else",
            fm.title === "Wyposaż chatkę" && ["Łóżko", "Kredens", "Warsztat", "Mała skrzynia", "Duża skrzynia", "Ławka", "Leśne legowisko"].every(n => fm.names.includes(n)) &&
            !fm.names.some(n => ["Spiżarnia", "Piec ziemny", "Chatka", "Płot", "Kociołek", "Tartak", "Wiadro"].includes(n)) && fm.names[fm.names.length - 1] === "Zostaw", fm.names);
        check("the door and the tile in front of it give no menu", (await ev("Farming.menuFor(3, 5)")) === null && (await ev("Farming.menuFor(3, 4)")) === null);

        // ---------------------------------------------------------------- furnishing (a real site: hammer blows) and nothing stored in the soil
        await setN(IT.planks, 10); await setN(IT.hammer, 1);
        await ev(`$gamePlayer.locate(3, 4); $gamePlayer.setDirection(8); 0`);
        check("a bench can be placed at (1, 3)", (await ev(`Farming.placementProblem("bench", 1, 3)`)) === null);
        await ev(`Farming.placeSite("bench", 1, 3); $gameTemp._buildMode = null; 0`);
        await frames(20);
        for (let i = 0; i < 20 && (await ev(`!!(Farming.buildingAt(1, 3) || {}).site`)); i++) { await ev(`$gameSystem.setStamina(100); Farming.strikeSite(Farming.buildingAt(1, 3), 1, 2); 0`); await frames(38); }
        check("the bench stands inside after a few hammer blows", (await ev(`(Farming.buildingAt(1, 3) || {}).type`)) === "bench" && !(await ev(`!!Farming.buildingAt(1, 3).site`)));
        check("no soil was stored for the hut's floor (nothing to be drawn there)", (await ev(`Object.keys($gameSystem._farm.plots[100] || {}).length`)) === 0);
        check("the picture of the bench is in the room", (await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.some(e => e.b.type === "bench")`)) === true);
        // the rest of the furniture (bed, larder, workbench); the tile in front of the door stays free
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[100]; const add = (type, x, y) => L.push({ id: f.nextId++, type, x, y, last: 1, v: 3 }); add("bed", 2, 3); add("larder", 4, 3); add("workbench", 4, 4); f.rev++; })(); 0`);
        await frames(20);
        check("the furniture blocks its cells; the tile in front of the door and the door stay free", (await ev("Farming.solidAt(3, 3) ? 1 : 0")) === 1 && (await ev("$gameMap.isPassable(3, 4, 2) && $gameMap.isPassable(3, 4, 8) && $gameMap.isPassable(3, 5, 2)")) === true);
        // sleeping in the bedroll under the roof in winter: 60%, not 40%
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[100].push({ id: 9104, type: "bedroll", x: 1, y: 4, last: 1, v: 3 }); f.rev++; })(); 0`);
        await ev("$gameSystem._dayNightDay = 90; $gameSystem.setDayNightHour(21); 0");   // winter
        await ev("$gameSystem.setStamina(5); 0");
        const maxSt = await ev("$gameSystem.maxStamina()");
        await ev(`Farming.sleepInTent(Farming.buildingAt(1, 4)); 0`);
        await frames(220);
        await dismiss();
        const st = await ev("$gameSystem.stamina()");
        check("a night on the bedroll inside the hut in winter restores 60% (not the 40% of the cold outdoors)", Math.abs(st - Math.round(maxSt * 0.6)) <= 1, { st, maxSt });
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[100]; L.splice(L.findIndex(b => b.id === 9104), 1); f.rev++; })(); 0`);
        const bedB = await ev(`(function(){ const m = Farming.menuFor(2, 3); return m ? m.entries.find(e => e.name === "Prześpij noc") : null; })()`);
        check("the bed offers 'Prześpij noc' (until morning)", !!bedB);
        await ev("$gameSystem.setStamina(5); $gameSystem._dayNightDay = 90; $gameSystem.setDayNightHour(21); 0");
        await ev(`Farming.sleepInTent(Farming.buildingAt(2, 3)); 0`);
        await frames(220);
        await dismiss();
        check("a night in the bed restores everything", (await ev("$gameSystem.stamina()")) === maxSt, { st: await ev("$gameSystem.stamina()"), maxSt });
        // the larder keeps food (chest logic) and refuses non-food
        await setN(71, 5); await give(IT.stone, 3);
        const lardOk = await ev(`(function(){ const b = Farming.buildingAt(4, 3); return { food: Farming.whyNotMove(b, $dataItems[71], "put"), stone: Farming.whyNotMove(b, $dataItems[${IT.stone}], "put") }; })()`);
        check("the larder takes food and refuses a stone ('Tu trzyma się tylko jedzenie.')", lardOk.food === null && lardOk.stone === "Tu trzyma się tylko jedzenie.", lardOk);

        // ---------------------------------------------------------------- the way out: the door in the wall below
        await ev(`$gamePlayer.locate(3, 4); $gamePlayer.setDirection(2); 0`);
        await walkUntilMap("down", 100);
        await waitMap(3);
        const outside = await J("({ map: $gameMap.mapId(), px: $gamePlayer.x, py: $gamePlayer.y, dir: $gamePlayer.direction() })");
        check("stepping onto the door leads back out, in front of the hut's door, facing the viewer", outside.map === 3 && outside.px === dX && outside.py === fY && outside.dir === 2, outside);
        // "Wejdź do środka" from the menu does the same as walking in
        await ev(`(function(){ const m = Farming.menuFor(${hx}, ${hy}); m.entries.find(e => e.name === "Wejdź do środka").run(); })(); 0`);
        check("'Wejdź do środka' in the hut's menu also goes in", await waitMap(100));
        await ev(`$gamePlayer.locate(3, 4); $gamePlayer.setDirection(2); 0`);
        await walkUntilMap("down", 100);
        await waitMap(3);

        // ---------------------------------------------------------------- pulling the hut down
        await ev(`$gameMap.setDisplayPos(${bx} - 6, ${by} - 2); 0`);
        const block = await ev(`Farming.demolishBlock(Farming.buildingAt(${hx}, ${hy}))`);
        check("with furniture inside the hut cannot be pulled down ('Najpierw wynieś z chatki wszystkie meble.')", block === "Najpierw wynieś z chatki wszystkie meble.", block);
        const dm = await J(`Farming.menuFor(${hx}, ${hy}).entries.find(e => e.name === "Rozbierz")`);
        check("...and its menu line 'Rozbierz' is greyed out with that reason", dm.enabled === false && /wynieś z chatki/.test(dm.help), dm);
        // save and load keep everything
        const saved = await J(`(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); DataManager.extractSaveContents(JsonEx.parse(json)); const f = $gameSystem._farm; return { hut: !!Farming.hutOf(), inside: (f.buildings[100] || []).map(b => b.type).sort(), door: Farming.hutDoorAt(${dX}, ${hy}) ? 1 : 0 }; })()`);
        check("after save + load the hut and everything inside it are still there", saved.hut && saved.door === 1 && JSON.stringify(saved.inside) === JSON.stringify(["bed", "bench", "larder", "workbench"]), saved);
        // take everything out, then the hut comes down and gives back half of the materials
        await ev(`(function(){ const f = $gameSystem._farm; f.buildings[100] = []; f.rev++; })(); 0`);
        for (const id of [IT.planks, IT.nails, IT.stone, IT.iron]) await setN(id, 0);
        check("empty, it may be pulled down", (await ev(`Farming.demolishBlock(Farming.buildingAt(${hx}, ${hy}))`)) === null);
        await ev(`Farming.demolish(Farming.buildingAt(${hx}, ${hy})); 0`);
        await frames(10);
        check("it gives back half: 15 planks, 20 nails, 10 stones, 3 iron", (await count(IT.planks)) === 15 && (await count(IT.nails)) === 20 && (await count(IT.stone)) === 10 && (await count(IT.iron)) === 3, { planks: await count(IT.planks), nails: await count(IT.nails), stone: await count(IT.stone), iron: await count(IT.iron) });
        check("and a new one may be built again", (await ev(`Farming.whyNotBuild("hut", ${hx}, ${hy})`)) === null && (await ev("Farming.hutOf()")) === null);
        // the door of an orphaned room still leads somewhere: back to the farm
        await ev(`$gamePlayer.reserveTransfer(100, 3, 4, 2, 0); 0`);
        await waitMap(100);
        await walkUntilMap("down", 100);
        check("with no hut on the map the door leads back to the farm anyway", await waitMap(3));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
