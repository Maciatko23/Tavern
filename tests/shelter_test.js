// The shelter (Wiata: Farming_Data + Farming.js + Farming_Render.js): a roof on posts over a table and benches - built with the hammer
// like any building; its benches: "Usiądź i odpocznij"; its table: up to 4 raw clay pots dry there under the roof, also in the rain
// (a day), drawn on the table (wet dark, then pale dry); taken dry -> dried pots; it cannot be taken down with pots on it.
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(40); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);

        const def = await J(`(function(){ const d = Farming.BUILDINGS.shelter; return d && { name: d.name, cost: d.cost, w: d.w, h: d.h, hits: d.hits, rest: d.rest, table: d.table, image: d.image }; })()`);
        check("Wiata: 4x2, built with the hammer from wood, planks, branches and 4 ropes, rests better than a bench (+50 an hour), a table for 4 pots", def && def.name === "Wiata" && def.w === 4 && def.h === 2 && def.hits > 0 && def.rest === 50 && def.table.slots === 4 && def.cost.some(([id, n]) => id === 93 && n === 4), def);
        const inQ = await J(`(function(){ const m = Farming.menuFor ? null : null; return Farming.BUILDINGS.shelter.instant ? "instant" : "site"; })()`);
        check("...a real building: a site and the hammer (not put down at once)", inQ === "site", inQ);

        // put one up (the F9 placer: finished at once) on open ground
        const spot = await J(`(function(){
            for (let y = 10; y < $gameMap.height() - 4; y++) for (let x = 3; x < $gameMap.width() - 6; x++) if (!Farming.whyNotBuild("shelter", x, y, false, true) && $gameMap.isPassable(x + 1, y + 1, 8)) return { x, y };
            return null; })()`);
        check("found a place for it", !!spot, spot);
        await ev(`(function(){ Farming.placeFree("shelter", ${spot.x}, ${spot.y}); $gamePlayer.locate(${spot.x + 1}, ${spot.y + 1}); $gamePlayer.setDirection(8); $gamePlayer.center(${spot.x + 1}, ${spot.y + 3}); $gameParty.gainItem($dataItems[165], 5); return 0; })()`);
        await frames(30);
        const m0 = await J(`(function(){ const m = Farming.menuFor(${spot.x + 1}, ${spot.y}); return { title: m.title, names: m.entries.map(e => e.name + (e.enabled === false ? "(x)" : "")) }; })()`);
        check("its menu: sit down and rest, put a pot on the table, take it down", m0.names[0] === "Usiądź i odpocznij" && m0.names.includes("Postaw garnek na stole") && m0.names.includes("Rozbierz"), m0);
        if (OUT) await b.shot(OUT + "shelter_empty.png");

        // rest on the benches: from below he sits on the front bench facing the table, from above on the back bench facing down
        const sit = async (py) => {
            await ev(`(function(){ $gamePlayer.locate(${spot.x + 2}, ${py}); $gamePlayer.setDirection(8); $gameSystem.setStamina(40); return 0; })()`);
            await frames(10);
            const from = await J("[$gamePlayer._realX, $gamePlayer._realY]");
            await ev(`(function(){ const m = Farming.menuFor(${spot.x + 1}, ${spot.y}); m.entries.find(e => e.name === "Usiądź i odpocznij").run(); return 0; })()`);
            await frames(45);
            const on = await J("({ ry: $gamePlayer._realY, d: $gamePlayer.direction(), kind: $gamePlayer._toolSwing && $gamePlayer._toolSwing._swingKind, lift: $gamePlayer._toolSwing && $gamePlayer._toolSwing.opts.lift })");
            for (let k = 0; k < 40 && (await ev("!!$gamePlayer._toolSwing")); k++) await frames(10);   // (sit down, rest till full: 60 at +50 a second, stand up)
            await frames(5);
            const after = await J("({ at: [$gamePlayer._realX, $gamePlayer._realY], swing: !!$gamePlayer._toolSwing, st: Math.round($gameSystem.stamina()) })");
            return { from, on, after };
        };
        const front = await sit(spot.y + 1);
        check("resting from below: he sits on the front bench (in front of the table, facing it), the sitting animation", front.on.kind === 11 && front.on.d === 8 && front.on.ry > spot.y && front.on.ry < spot.y + 0.5 && front.on.lift > 0, front.on);
        check("...rests (+50 an hour, an hour a second) till full, then stands up where he was", front.after.st === 100 && !front.after.swing && Math.abs(front.after.at[1] - front.from[1]) < 0.01 && Math.abs(front.after.at[0] - front.from[0]) < 0.01, front);
        const backSeat = await sit(spot.y - 2);
        check("resting from above: he sits on the back bench (behind the table, facing down)", backSeat.on.kind === 11 && backSeat.on.d === 2 && backSeat.on.ry < spot.y && backSeat.on.ry > spot.y - 1, backSeat.on);
        check("...and stands up back above the shelter", !backSeat.after.swing && Math.abs(backSeat.after.at[1] - backSeat.from[1]) < 0.01, backSeat.after);
        await ev(`(function(){ $gamePlayer.locate(${spot.x + 1}, ${spot.y + 1}); $gamePlayer.setDirection(8); return 0; })()`);
        await frames(10);

        // four pots on the table, not five
        for (let k = 0; k < 5; k++) { await ev(`(function(){ Farming.putPotOnTable(Farming.buildingAt(${spot.x + 1}, ${spot.y})); return 0; })()`); await frames(50); }
        const t4 = await J(`(function(){ const bb = Farming.buildingAt(${spot.x + 1}, ${spot.y}); const m = Farming.menuFor(${spot.x + 1}, ${spot.y});
            return { pots: (bb.pots || []).length, raw: $gameParty.numItems($dataItems[165]), status: m.status, put: m.entries.find(e => e.name === "Postaw garnek na stole").enabled }; })()`);
        check("four raw pots on the table - the fifth has no room (it stays in the bag)", t4.pots === 4 && t4.raw === 1 && t4.put === false && /4\/4/.test(t4.status.text) && /schną/.test(t4.status.right), t4);
        await frames(30);
        const drawn = () => J(`(function(){ const bs = SceneManager._scene._spriteset._buildingSprites; const e = bs._sprites.find(e => e.b.type === "shelter");
            return (e.tablePots || []).map(s => ({ img: s._img, x: Math.round(s.x - e.sprite.x), visible: s.visible !== false && !!s.parent })); })()`);
        const d0 = await drawn();
        check("...drawn on the table: four dark wet pots side by side", d0.length === 4 && d0.every(p => p.img === "Farm_Pot_Wet" && p.visible) && new Set(d0.map(p => p.x)).size === 4, d0);
        if (OUT) await b.shot(OUT + "shelter_wet.png");
        const block = await J(`(function(){ const m = Farming.menuFor(${spot.x + 1}, ${spot.y}); const e = m.entries.find(e => e.name === "Rozbierz"); return { enabled: e.enabled, help: e.help }; })()`);
        check("it cannot be taken down with pots on the table", block.enabled === false && /garnki/.test(block.help), block);

        // a rainy day: under the roof they dry anyway
        await ev(`(function(){ const plan0 = Survival.weatherPlan; Survival.weatherPlan = day => ({ type: "rain", start: 0, end: 24, power: 5 }); $gameSystem.advanceDayNight(24.2); Survival.weatherPlan = plan0; return 0; })()`);
        await frames(40);
        const t5 = await J(`(function(){ const bb = Farming.buildingAt(${spot.x + 1}, ${spot.y}); const m = Farming.menuFor(${spot.x + 1}, ${spot.y});
            return { dry: bb.pots.map(p => Farming.tablePotDry(bb, p)), status: m.status, names: m.entries.map(e => e.name) }; })()`);
        check("a day of rain later: under the roof all four dried", t5.dry.length === 4 && t5.dry.every(Boolean) && /wyschły/.test(t5.status.right) && t5.names.includes("Zabierz wysuszony garnek") && !t5.names.includes("Zabierz mokry garnek"), t5);
        const d1 = await drawn();
        check("...drawn pale and dry, as big as on the ground", d1.length === 4 && d1.every(p => p.img === "Farm_Pot_Dry") && (await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === "shelter"); return e.tablePots[0].scale.x; })()`)) === 1, d1);
        if (OUT) await b.shot(OUT + "shelter_dry.png");

        // one at a time: two dried ones off, two fresh ones on - then one dry and one wet taken, each alone
        for (let k = 0; k < 2; k++) { await ev(`(function(){ Farming.takeTablePot(Farming.buildingAt(${spot.x + 1}, ${spot.y}), true); return 0; })()`); await frames(50); }
        await ev("$gameParty.gainItem($dataItems[165], 2); 0");
        for (let k = 0; k < 2; k++) { await ev(`(function(){ Farming.putPotOnTable(Farming.buildingAt(${spot.x + 1}, ${spot.y})); return 0; })()`); await frames(50); }
        const mix = await J(`(function(){ const bb = Farming.buildingAt(${spot.x + 1}, ${spot.y}); const m = Farming.menuFor(${spot.x + 1}, ${spot.y});
            return { dry: bb.pots.filter(p => Farming.tablePotDry(bb, p)).length, wet: bb.pots.filter(p => !Farming.tablePotDry(bb, p)).length, dried: $gameParty.numItems($dataItems[166]), raw: $gameParty.numItems($dataItems[165]),
                names: m.entries.map(e => e.name + " " + (e.right || "")) }; })()`);
        check("one at a time: two dried ones taken, two fresh ones put - 2 dry and 2 wet on the table, both kinds offered", mix.dry === 2 && mix.wet === 2 && mix.dried === 2 && mix.names.some(n => /Zabierz wysuszony garnek ×2/.test(n)) && mix.names.some(n => /Zabierz mokry garnek ×2/.test(n)), mix);
        const one = await J(`(function(){ const bb = Farming.buildingAt(${spot.x + 1}, ${spot.y}); window.__d0 = $gameParty.numItems($dataItems[166]); window.__r0 = $gameParty.numItems($dataItems[165]); Farming.takeTablePot(bb, false); return 0; })()`);
        await frames(50);
        const afterWet = await J(`(function(){ const bb = Farming.buildingAt(${spot.x + 1}, ${spot.y}); return { pots: bb.pots.length, dried: $gameParty.numItems($dataItems[166]) - window.__d0, raw: $gameParty.numItems($dataItems[165]) - window.__r0 }; })()`);
        check("...a wet one taken alone: one raw pot back, the dried ones stay on the table", afterWet.pots === 3 && afterWet.raw === 1 && afterWet.dried === 0, afterWet);
        await ev(`(function(){ Farming.takeTablePot(Farming.buildingAt(${spot.x + 1}, ${spot.y}), true); return 0; })()`);
        await frames(50);
        const afterDry = await J(`(function(){ const bb = Farming.buildingAt(${spot.x + 1}, ${spot.y}); return { pots: bb.pots.length, dried: $gameParty.numItems($dataItems[166]) - window.__d0 }; })()`);
        check("...a dry one taken alone: one dried pot, two left on the table", afterDry.pots === 2 && afterDry.dried === 1, afterDry);
        await frames(20);
        check("...two drawn on the table now", (await drawn()).length === 2);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
