// Bigger buildings (w x h footprints, legacy sizes) and the fenced yards with real animals (Farming.js + Livestock.js).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(11); 0");
        await sleep(600);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const give = type => ev(`(function(){ for (const [id, n] of Farming.BUILDINGS["${type}"].cost) $gameParty.gainItem($dataItems[id], n + 2); $gameSystem.changeStamina(200); })(); 0`);
        const built = async (type, x, y) => {
            await give(type);
            const ok = await ev(`Farming.build("${type}", ${x}, ${y})`);
            for (let i = 0; i < 80; i++) { if (await ev(`!!Farming.buildingAt(${x}, ${y})`)) break; await frames(5); }
            await frames(8);
            return ok;
        };
        const bldg = (x, y) => J(`(function(){ const b = Farming.buildingAt(${x}, ${y}); return b ? { id: b.id, type: b.type, x: b.x, y: b.y, v: b.v || 0 } : null; })()`);
        const clear = () => ev(`(function(){ $gameSystem._farm.buildings[$gameMap.mapId()] = []; $gameSystem._farm.rev++; if (window.Livestock) Livestock.animals.slice().forEach(a => Livestock.remove(a)); })(); 0`);

        // ---------------------------------------------------------------- geometry (no map needed)
        check("kiln: 3 x 2 now", (await J(`(function(){ const g = Farming.geoOf({ type: "kiln", v: 2 }); return [g.w, g.h, g.image]; })()`)).join() === "3,2,Farm_Kiln_L");
        check("kiln put up before (no v): keeps 2 x 1 and the old picture", (await J(`(function(){ const g = Farming.geoOf({ type: "kiln" }); return [g.w, g.h || 1, g.image, g.vent, g.ventX || 0]; })()`)).join() === "2,1,Farm_Kiln,50,0");
        check("the stations and the tent grew to 3 x 2 and have a legacy size; the workbench is 2 x 1 (a bit smaller); the brewery is 4 x 2 and the pantry 3 x 2 (checked below)",
            (await J(`["kiln","sawmill","bakery","brickworks","forge","smokehouse","tannery","dairy","cauldron","tent"].filter(t => { const d = Farming.BUILDINGS[t]; return !(d.w === 3 && d.h === 2 && d.legacy && d.legacy.w === 2); })`)).length === 0);
        check("the well shrank to a 2 x 2 footprint (same art) and still has a legacy size",
            (await J(`(function(){ const d = Farming.BUILDINGS.well; return d.w === 2 && d.h === 2 && d.legacy && d.legacy.w === 2; })()`)));
        check("yards: cowshed 8x5, sheep pen 6x5, coop 6x5; each with a gate in the bottom row and the hut inside",
            (await J(`["cowshed","pen","coop"].map(t => { const d = Farming.BUILDINGS[t]; return [d.w, d.h, d.yard.gate < d.w - 1 && d.yard.gate > 0, d.yard.hut.dx >= 1 && d.yard.hut.dx + d.yard.hut.w <= d.w - 1 && d.yard.hut.dy + d.yard.hut.h <= d.h - 1]; })`)).flat().join() === "8,5,true,true,6,5,true,true,6,5,true,true");
        const cow = "Farming.BUILDINGS.cowshed";
        check("solid cells of the cowshed: fence yes, gate no, open ground no, hut yes",
            (await J(`[Farming.isSolidCell(${cow}, 0, 0), Farming.isSolidCell(${cow}, 3, 0), Farming.isSolidCell(${cow}, 1, 1), Farming.isSolidCell(${cow}, 3, 2), Farming.isSolidCell(${cow}, 3, 3), Farming.isSolidCell(${cow}, 7, 2)]`)).join() === "true,false,false,false,true,true");
        check("cowshed: 40 cells, 22 fence + 4 hut + 14 open ground",
            (await J(`(function(){ const g = ${cow}; const c = Farming.cellsOfGeo(g, 10, 10); const ring = c.filter(k => k.i === 0 || k.j === 0 || k.i === g.w - 1 || k.j === g.h - 1).length; const solid = c.filter(k => Farming.isSolidCell(g, k.i, k.j)).length; return [c.length, ring, solid]; })()`)).join() === "40,22,25");

        // ---------------------------------------------------------------- an open meadow
        const B = await ev(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y);
            for (let by = 2; by < $gameMap.height() - 9; by++) for (let bx = 2; bx < $gameMap.width() - 10; bx++) {
                let ok = true;
                for (let y = by; y < by + 8 && ok; y++) for (let x = bx; x < bx + 9; x++) { if (!free(x, y)) { ok = false; break; } }
                if (ok) {
                    const plots = ($gameSystem._farm.plots[$gameMap.mapId()] = $gameSystem._farm.plots[$gameMap.mapId()] || {});
                    for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 9; x++) if (!plots[x + "," + y]) plots[x + "," + y] = { s: "cleared" };
                    $gameSystem._farm.rev++;
                    return { bx, by };
                }
            }
            return null; })()`);
        check("found an open ground 9 x 8 (marked as cleared land)", !!B, B);
        const { bx, by } = B;
        const px = bx + 3, py = by + 7;   // the player stands in the bottom row of the meadow
        await ev(`$gamePlayer.locate(${px}, ${py}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${bx} - 6, ${by} - 3); 0`);
        await frames(4);

        // ---------------------------------------------------------------- a kiln, 3 x 2
        const kx = bx + 1, ky = by + 5;   // bottom-left tile; the cells are x..x+2, y-1..y
        await give("kiln");
        check("kiln can be put up (the placement check covers all six tiles)", (await ev(`Farming.placementProblem("kiln", ${kx}, ${ky})`)) === null);
        await built("kiln", kx, ky);
        const all = [];
        for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) all.push(await bldg(kx + i, ky - j));
        check("the kiln stands on all six tiles", all.every(k => k && k.type === "kiln" && k.v === 3), all.map(k => k && k.type));
        check("nothing stands beside or above it", !(await bldg(kx + 3, ky)) && !(await bldg(kx, ky - 2)) && !(await bldg(kx - 1, ky)));
        const pass = c => ev(`$gameMap.isPassable(${c[0]}, ${c[1]}, 2)`);
        check("the player cannot walk through any of its tiles, but around it", !(await pass([kx + 1, ky - 1])) && !(await pass([kx + 2, ky])) && (await pass([kx + 3, ky])) && (await pass([kx, ky - 2])));
        check("the farm menu of every tile of the kiln is the kiln's", (await ev(`[[${kx},${ky}],[${kx + 2},${ky - 1}],[${kx + 1},${ky - 1}]].every(c => Farming.menuFor(c[0], c[1]).title === "Piec ziemny")`)) === true);
        check("a second kiln overlapping the first is refused", (await ev(`Farming.placementProblem("kiln", ${kx + 2}, ${ky - 1})`)) === "Tu już coś stoi.");
        const spr = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "kiln"); const tw = 48; return { image: e.sprite.bitmap._url || "", x: e.sprite.x, y: e.sprite.y, ex: Math.round(($gameMap.adjustX(${kx}) + 1.5) * tw), ey: Math.round(($gameMap.adjustY(${ky}) + 1) * tw) - 1, vent: Farming.geoOf(e.b).vent, ventX: Farming.geoOf(e.b).ventX }; })()`);
        check("the picture stands in the middle of the three tiles on the bottom row", spr.x === spr.ex && spr.y === spr.ey && /Farm_Kiln_L/.test(spr.image), spr);
        check("smoke rises from the chimney of the new picture", spr.vent === 91 && spr.ventX === -7, spr);
        // a building of the old game
        await ev(`(function(){ $gameSystem._farm.buildings[$gameMap.mapId()].push({ id: 900, type: "kiln", x: ${bx + 5}, y: ${by + 5}, last: 1 }); $gameSystem._farm.rev++; })(); 0`);
        await frames(4);
        check("an old kiln (no v) still covers 2 x 1", !!(await bldg(bx + 5, by + 5)) && !!(await bldg(bx + 6, by + 5)) && !(await bldg(bx + 7, by + 5)) && !(await bldg(bx + 5, by + 4)));
        const oldSprite = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.id === 900); return { x: e.sprite.x, ex: Math.round(($gameMap.adjustX(${bx + 5}) + 1) * 48), url: e.sprite.bitmap._url || "" }; })()`);
        check("...and keeps its old picture centred on the two tiles", oldSprite.x === oldSprite.ex && /Farm_Kiln\.png/.test(oldSprite.url), oldSprite);
        await frames(2);
        await b.shot("yard_kilns.png");
        await clear();
        await frames(4);

        // ---------------------------------------------------------------- the cowshed yard, 7 x 5
        const cx = bx, cy = by + 4;   // bottom-left; cells x..x+6, y-4..y ; gate at x+3 in the bottom row
        await give("cowshed");
        check("cowshed: the placement check covers its whole yard (free here, refused where a kiln stands)", (await ev(`Farming.placementProblem("cowshed", ${cx}, ${cy})`)) === null);
        await ev(`Farming.startPlacement("cowshed", ${cx}, ${cy}); 0`);
        await frames(12);
        await b.shot("yard_placer.png");
        const ghost = await J(`(function(){ const g = SceneManager._scene._spriteset._buildPlacer._ghost; return { x: g.x, y: g.y, ex: Math.round(($gameMap.adjustX(${cx}) + 2 + 2) * 48), ey: Math.round(($gameMap.adjustY(${cy} - 3) + 1) * 48) - 1, has: !!g.bitmap }; })()`);
        check("placing a yard shows its hut where it will stand", ghost.has && ghost.x === ghost.ex && ghost.y === ghost.ey, ghost);
        await ev(`Input._currentState.cancel = true; 0`); await frames(3); await ev(`Input._currentState.cancel = false; 0`); await frames(3);
        await built("cowshed", cx, cy);
        const cells = [];
        for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) cells.push(await bldg(cx + i, cy - j));
        check("the yard occupies all 40 tiles", cells.every(k => k && k.type === "cowshed" && k.v === 3), cells.filter(k => !k).length);
        const solidMap = await J(`(function(){ const out = []; for (let j = 4; j >= 0; j--) { let row = ""; for (let i = 0; i < 8; i++) row += $gameMap.isPassable(${cx} + i, ${cy} - j, 2) ? "." : "#"; out.push(row); } return out; })()`);
        console.log("walkable map of the yard (# = blocked):\n  " + solidMap.join("\n  "));
        check("fence all round, the hut against the far fence, the gate in the middle of the front, open ground inside",
            solidMap.join("|") === "########|#.####.#|#......#|#......#|###.####", solidMap);
        const fenceCount = await ev(`SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "cowshed").fences.length`);
        check("the fence has 21 posts (22 of the ring minus the gate)", fenceCount === 21, fenceCount);
        // walk in through the gate
        await ev(`$gamePlayer.locate(${cx + 3}, ${cy + 1}); $gamePlayer.setDirection(8); $gameMap.setDisplayPos(${cx} - 6, ${cy - 4} - 3); Input._currentState.up = true; 0`);
        await frames(70);
        await ev(`Input._currentState.up = false; 0`);
        const inside = await J(`({ x: $gamePlayer.x, y: $gamePlayer.y })`);
        check("the player walks in through the gate", inside.y <= cy - 1 && inside.y >= cy - 3 && inside.x === cx + 3, inside);
        await ev(`$gamePlayer.locate(${cx + 3}, ${cy + 2}); $gamePlayer.setDirection(8); 0`);
        await frames(2);
        // facing the fence from outside gives the yard menu; the open ground inside gives nothing
        check("the fence gives the yard's menu, the open ground inside gives none",
            (await ev(`Farming.menuFor(${cx}, ${cy}).title`)) === "Obora" && (await ev(`Farming.menuFor(${cx + 2}, ${cy - 2})`)) === null && (await ev(`Farming.menuFor(${cx + 3}, ${cy - 3}).title`)) === "Obora");
        check("nothing can be dug or sown inside: it is not a plot menu", (await ev(`Farming.tileWhyNot(${cx + 2}, ${cy - 2})`)) === "Tu już coś stoi.");

        // ---------------------------------------------------------------- the animals
        await ev(`Livestock.alwaysOut(true); Livestock.sync(); 0`);
        await frames(20);
        let n = await ev("Livestock.animals.length");
        check("two cows live in the cowshed", n === 2 && (await ev(`Livestock.animals.every(a => a.kind() === "cow")`)) === true, n);
        check("each has a picture on the map", (await ev(`Livestock.animals.every(a => a._sprite && a._sprite.parent === SceneManager._scene._spriteset._tilemap)`)) === true);
        await ev(`$gamePlayer.locate(${cx + 3}, ${cy + 3}); 0`);   // out of their way
        const seen = new Set(); let outside = 0, inHut = 0, together = 0;
        for (let t = 0; t < 70; t++) {
            await frames(24);
            const pos = await J(`Livestock.animals.map(a => [a._x, a._y, a.inYard(a._x, a._y), Math.round(a._realX), Math.round(a._realY)])`);
            for (const p of pos) { seen.add(p[0] + "," + p[1]); const ix = p[3] - cx, iy = cy - p[4]; if (!p[2] || ix < 1 || ix > 6 || iy < 1 || iy > 3 || (iy === 3 && ix >= 2 && ix <= 5)) outside++; }
            if (pos.length === 2 && pos[0][0] === pos[1][0] && pos[0][1] === pos[1][1]) together++;
        }
        check("in 28 s of walking the cows never left the open ground of the yard", outside === 0, { outside });
        check("...they really walk about (visited several tiles)", seen.size >= 4, seen.size);
        check("...and never share a tile", together === 0, together);
        await b.shot("yard_cows.png");
        // the night: they go to the shed
        await ev(`Livestock.alwaysOut(false); $gameSystem.setDayNightHour(22); Livestock.sync(); 0`);
        await frames(4);
        check("at night the cows are in the shed (not drawn)", (await ev(`Livestock.animals.every(a => a._transparent === true)`)) === true);
        await ev(`$gameSystem.setDayNightHour(11); Livestock.sync(); 0`);
        await frames(4);
        check("in the morning they are out again", (await ev(`Livestock.animals.every(a => a._transparent === false)`)) === true);
        // shy
        await ev(`Livestock.animals.forEach(a => { a._frozen = false; }); 0`);
        const shy = await J(`(function(){ const a = Livestock.animals[0]; const other = Livestock.animals[1]; other._frozen = true; a._wait = 999; return { x: a._x, y: a._y }; })()`);
        await ev(`$gamePlayer.locate(${shy.x}, ${Math.min(cy - 1, shy.y + 1)}); 0`);
        await frames(50);
        const shyD = await J(`(function(){ const a = Livestock.animals[0]; return Math.hypot(a._realX - $gamePlayer._realX, a._realY - $gamePlayer._realY); })()`);
        check("a cow steps aside when the player comes close", shyD >= 1, shyD);

        // ---------------------------------------------------------------- the scene is rebuilt (menu): animals keep their pictures
        await ev(`$gamePlayer.locate(${cx + 3}, ${cy + 2}); SceneManager.push(Scene_Menu); 0`);
        await frames(30);
        await ev(`SceneManager.pop(); 0`);
        for (let i = 0; i < 40; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !!SceneManager._scene._spriteset && !SceneManager.isSceneChanging()")) break; await frames(5); }
        await frames(30);
        check("after the menu the animals still have pictures in the new spriteset",
            (await ev(`Livestock.animals.length === 2 && Livestock.animals.every(a => a._sprite && a._sprite.parent === SceneManager._scene._spriteset._tilemap)`)) === true);
        await ev(`Livestock.animals.forEach(a => { a._frozen = false; a._wait = 0; }); 0`);   // undo what the "shy" check set up
        const before = await J(`Livestock.animals.map(a => [a._x, a._y])`);
        let moved = false;
        for (let t = 0; t < 12 && !moved; t++) {   // cows pause for up to ~4 s, so watch for 12 s
            await frames(60);
            moved = JSON.stringify(before) !== JSON.stringify(await J(`Livestock.animals.map(a => [a._x, a._y])`));
        }
        check("...and they keep walking", moved);

        // ---------------------------------------------------------------- leaving the map and coming back
        await ev(`$gamePlayer.reserveTransfer(4, 10, 10, 2, 0); SceneManager.goto(Scene_Map); 0`);
        for (let i = 0; i < 80; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !!SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===4").catch(() => false)) break; await sleep(300); }
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting) Hunting.auto(false); 0");
        await frames(60);
        check("on another map there are no yard animals", (await ev("Livestock.animals.length")) === 0);
        await ev(`$gamePlayer.reserveTransfer(3, ${cx + 3}, ${cy + 2}, 8, 0); SceneManager.goto(Scene_Map); 0`);
        for (let i = 0; i < 80; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && !!SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(300); }
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting) Hunting.auto(false); Livestock.alwaysOut(true); 0");
        await frames(90);
        check("back home the cows are in their yard again, with pictures",
            (await ev(`Livestock.animals.length === 2 && Livestock.animals.every(a => a._sprite && a._sprite.parent === SceneManager._scene._spriteset._tilemap && a.inYard(a._x, a._y))`)) === true);

        // ---------------------------------------------------------------- wild animals keep out of the yard
        const wild = await J(`(function(){
            const a = Hunting.spawn("rabbit", ${cx + 3}, ${cy + 1}); a._frozen = true;
            const out = { gate: a.canPass(${cx + 3}, ${cy + 1}, 8), free: a.canPass(${cx + 3}, ${cy + 1}, 2) };
            Hunting.removeAnimal(a);
            const b = Hunting.spawn("rabbit", ${cx - 1}, ${cy - 2}); b._frozen = true;
            out.fence = b.canPass(${cx - 1}, ${cy - 2}, 6);
            Hunting.removeAnimal(b);
            return out; })()`);
        check("a wild rabbit cannot go through the gate or the fence, but can walk on free ground", wild.gate === false && wild.fence === false && wild.free === true, wild);

        // ---------------------------------------------------------------- demolishing the yard sends the animals away
        const cowId = await ev(`Farming.buildingAt(${cx}, ${cy}).id`);
        await ev(`Farming.demolish(Farming.buildingAt(${cx}, ${cy})); 0`);
        await frames(60);
        check("the yard is gone: all tiles free, no animals left", !(await bldg(cx, cy)) && !(await bldg(cx + 3, cy - 2)) && (await ev("Livestock.animals.length")) === 0 && (await ev(`$gameMap.isPassable(${cx}, ${cy}, 2)`)) === true);

        // ---------------------------------------------------------------- an old cowshed (no v) is a plain 2 x 1 building without animals
        await ev(`(function(){ $gameSystem._farm.buildings[$gameMap.mapId()].push({ id: 901, type: "cowshed", x: ${cx}, y: ${cy}, last: 1 }); $gameSystem._farm.rev++; })(); 0`);
        await frames(40);
        check("an old cowshed covers 2 x 1, has no yard and no animals", !!(await bldg(cx + 1, cy)) && !(await bldg(cx + 2, cy)) && !(await bldg(cx, cy - 1)) && (await ev("Livestock.animals.length")) === 0);
        await clear(); await frames(4);

        // ---------------------------------------------------------------- buildings of the first round (v:2) keep the size they had
        await ev(`(function(){ const L = $gameSystem._farm.buildings[$gameMap.mapId()]; L.push({ id: 910, type: "pantry", x: ${bx}, y: ${by + 1}, last: 1, v: 2 }); L.push({ id: 911, type: "brewery", x: ${bx + 3}, y: ${by + 2}, last: 1, v: 2 }); L.push({ id: 912, type: "cowshed", x: ${bx}, y: ${by + 7}, last: 1, v: 2 }); $gameSystem._farm.rev++; })(); 0`);
        await frames(30);
        const v2 = await J(`(function(){ const cnt = id => { const b = $gameSystem._farm.buildings[$gameMap.mapId()].find(b => b.id === id); const g = Farming.geoOf(b); return [g.w, g.h || 1, g.image, g.yard ? g.yard.hut.w : 0, Farming.cellsOfGeo(g, b.x, b.y).length]; }; return [cnt(910), cnt(911), cnt(912)]; })()`);
        check("v2 pantry 2x1 (Farm_Pantry_L), v2 brewery 3x2 (Farm_Brewery_L), v2 cowshed 7x5 with a 3-wide hut and its own picture",
            JSON.stringify(v2) === JSON.stringify([[2, 1, "Farm_Pantry_L", 0, 2], [3, 2, "Farm_Brewery_L", 0, 6], [7, 5, "Farm_Cowshed_L", 3, 35]]), v2);
        check("new ones are the bigger ones: pantry 3x2, brewery 4x2, cowshed 8x5 with a 4-wide hut",
            (await J(`["pantry", "brewery", "cowshed"].map(t => { const d = Farming.geoOf({ type: t, v: 3 }); return [d.w, d.h, d.image, d.yard ? d.yard.hut.w : 0]; })`)).join("|") === "3,2,Farm_Pantry_XL,0|4,2,Farm_Brewery_XL,0|8,5,Farm_Cowshed_XL,4");
        await clear(); await frames(4);

        // ---------------------------------------------------------------- the sheep pen and the coop
        await ev(`Livestock.alwaysOut(true); 0`);
        for (const [type, kind, count] of [["pen", "sheep", 3], ["coop", "hen", 3]]) {
            const ok = await built(type, bx, by + 4);
            await ev("Livestock.sync(); 0");
            await frames(30);
            const info = await J(`(function(){ const b = Farming.buildingAt(${bx}, ${by + 4}); const g = Farming.geoOf(b); return { type: b.type, w: g.w, h: g.h, n: Livestock.animals.length, kinds: [...new Set(Livestock.animals.map(a => a.kind()))], inside: Livestock.animals.every(a => a.inYard(a._x, a._y)) }; })()`);
            check(type + ": a 6 x 5 yard with " + count + " " + kind, info.type === type && info.w === 6 && info.h === 5 && info.n === count && info.kinds.join() === kind && info.inside, info);
            for (let t = 0; t < 12; t++) { await frames(30); }
            check(type + ": the animals stay in", (await ev(`Livestock.animals.every(a => a.inYard(a._x, a._y))`)) === true);
            if (type === "coop") await b.shot("yard_coop.png"); else await b.shot("yard_pen.png");
            await ev(`Farming.demolish(Farming.buildingAt(${bx}, ${by + 4})); 0`);
            await frames(50);
        }

        // ---------------------------------------------------------------- every picture exists and every building has a cell layout that fits its picture
        const pics = await J(`Object.entries(Farming.BUILDINGS).filter(([k, d]) => d.image).map(([k, d]) => [k, d.image, d.legacy ? d.legacy.image : null])`);
        const missing = [];
        for (const [k, img, old] of pics) for (const name of [img, old].filter(Boolean)) {
            const ok = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("${name}"); bmp.addLoadListener(() => res(bmp.width > 0 && bmp.height > 0)); setTimeout(() => res(false), 4000); })`);
            if (!ok) missing.push(name);
        }
        check("all building pictures (new and legacy) load", missing.length === 0, missing);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
