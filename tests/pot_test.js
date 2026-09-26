// The clay pot (Farming.js + Farming_Data.js): "Ulep garnek" at the workbench (3 wet clay -> a raw pot), set down ("Postaw...") to dry:
// a day of dry weather (the hours of rain do not count), its picture turns from the dark wet pot to the pale dry one; taken when dry it is
// a dried pot (for the kiln), taken earlier a raw pot again. And the puddles (Puddles.js) start in the middle of a tile.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(8); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const n = id => ev(`$gameParty.numItems($dataItems[${id}])`);

        // the puddles start in the middle of a tile
        for (let i = 0; i < 20 && !(await ev("Puddles.candidates().length > 0")); i++) await frames(10);
        const mids = await J("Puddles.candidates().map(h => [h.cx % 1, h.cy % 1])");
        check("every puddle's middle is the middle of a tile (a new puddle sits in one tile, the marker's)", mids.length > 0 && mids.every(([a, c]) => a === 0.5 && c === 0.5), mids.slice(0, 4));
        const small = await J(`(function(){ Puddles.setLevel(1, 5); const h = Puddles.hollows()[0]; Puddles.setLevel(h.thr + 0.02, 5); const x = Math.floor(h.cx), y = Math.floor(h.cy);
            const wet = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Puddles.wetAt(x + dx, y + dy)) wet.push([dx, dy]); Puddles.setLevel(null); return wet; })()`);
        check("...just after the rain started: only that middle tile is wet", small.length === 1 && small[0][0] === 0 && small[0][1] === 0, small);

        // a workbench to shape the pot on, and clay
        const spot = await J(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 2) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y) && !Farming.gatherAt(x, y);
            for (let y = 8; y < $gameMap.height() - 4; y++) for (let x = 3; x < $gameMap.width() - 6; x++) {
                let ok = true; for (let j = 0; j < 3 && ok; j++) for (let i = 0; i < 5 && ok; i++) ok = free(x + i, y + j);
                if (ok) return { x, y };
            } return null; })()`);
        check("found free ground for the workbench and the pot", !!spot, spot);
        await ev(`(function(){ Farming.placeFree("workbench", ${spot.x}, ${spot.y}); $gamePlayer.locate(${spot.x}, ${spot.y + 1}); $gamePlayer.setDirection(8); $gameParty.gainItem($dataItems[164], 7); return 0; })()`);
        await frames(5);
        const wb = await J(`(function(){ const b = Farming.buildingAt(${spot.x}, ${spot.y}); const r = b && Farming.recipeOf(b, "pot"); return { type: b && b.type, r: r && { name: r.name, inputs: r.inputs, output: r.output } }; })()`);
        check("the workbench has \"Ulep garnek\": 3 wet clay -> a raw pot", wb.type === "workbench" && wb.r && wb.r.name === "Ulep garnek" && JSON.stringify(wb.r.inputs) === "[[164,3]]" && JSON.stringify(wb.r.output) === "[165,1]", wb);
        const c0 = await n(164);
        await ev(`(function(){ const b = Farming.buildingAt(${spot.x}, ${spot.y}); Farming.craftManual(b, Farming.recipeOf(b, "pot")); return 0; })()`);
        for (let i = 0; i < 60 && !(await n(165)); i++) await frames(10);
        check("...shaped: a raw pot in the bag, 3 clay used", (await n(165)) === 1 && c0 - (await n(164)) === 3, { raw: await n(165), clay: await n(164) });

        // set down to dry (the ground menu "Postaw...": an instant thing)
        const px = spot.x + 3, py = spot.y + 1;
        await ev(`window.__names = Farming.menuFor(${px}, ${py}).entries.map(e => e.name); window.__r = Farming.build("pot", ${px}, ${py}); 0`);
        await frames(60);   // (he crouches and sets it down)
        const put = await J(`(function(){ const b = Farming.buildingAt(${px}, ${py});
            return { names: window.__names, r: window.__r, type: b && b.type, site: b && !!b.site, raw: $gameParty.numItems($dataItems[165]) }; })()`);
        check("set down with \"Postaw...\": stands at once (no hammer), the raw pot leaves the bag", put.r && put.type === "pot" && !put.site && put.raw === 0 && put.names.includes("Postaw..."), put);
        await frames(40);
        const pic = () => J(`(function(){ const bs = SceneManager._scene._spriteset._buildingSprites;
            const e = bs && (bs._sprites || []).find(e => e.b && e.b.type === "pot"); return e && e.sprite.bitmap ? e.sprite.bitmap._url.split("/").pop() : null; })()`);
        check("...it shows the dark wet pot", /Farm_Pot_Wet/.test(await pic()), await pic());
        if (OUT) { await ev(`$gamePlayer.locate(${px}, ${py + 2}); $gamePlayer.center(${px}, ${py + 2}); 0`); await frames(10); await b.shot(OUT + "pot_wet.png"); }

        // drying: 12 dry hours = half; 6 hours of rain = nothing; 24 dry hours in all = dry
        const dry1 = await J(`(function(){ const b = Farming.buildingAt(${px}, ${py}); const d0 = Farming.potDryness(b);
            $gameSystem.advanceDayNight(12); const d12 = Farming.potDryness(b);
            const m = Farming.menuFor(${px}, ${py}); return { d0, d12, status: m.status, names: m.entries.map(e => e.name) }; })()`);
        check("drying: a fresh pot is wet; after 12 dry hours half dry, \"Schnie ... jeszcze ~12 godz.\"", dry1.d0 < 0.01 && Math.abs(dry1.d12 - 0.5) < 0.02 && /Schnie/.test(dry1.status.text) && /12/.test(dry1.status.right), dry1);
        check("...its menu: take it (no \"Rozbierz\" - nothing to give back)", dry1.names.includes("Zabierz garnek") && !dry1.names.includes("Rozbierz"), dry1.names);
        const rain = await J(`(function(){ const b = Farming.buildingAt(${px}, ${py}), plan0 = Survival.weatherPlan;
            const now = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(), d = Math.floor(now / 24), h = now - d * 24;
            Survival.weatherPlan = day => (day === d ? { type: "rain", start: h, end: Math.min(24, h + 6), power: 4 } : plan0(day));
            const before = Farming.potDryness(b); $gameSystem.advanceDayNight(Math.min(6, 24 - h - 0.01)); const after = Farming.potDryness(b);
            Survival.weatherPlan = plan0; return { before, after }; })()`);
        check("...in the rain it does not dry (the hours of rain do not count)", Math.abs(rain.after - rain.before) < 0.01, rain);
        await ev(`(function(){ const b = Farming.buildingAt(${px}, ${py}); const left = (1 - Farming.potDryness(b)) * 24; Survival.calmWeather && Survival.calmWeather(); $gameSystem.advanceDayNight(left + 0.5); return 0; })()`);
        await frames(40);
        const dry2 = await J(`(function(){ const b = Farming.buildingAt(${px}, ${py}); const m = Farming.menuFor(${px}, ${py});
            return { d: Farming.potDryness(b), status: m.status, names: m.entries.map(e => e.name) }; })()`);
        check("a day of dry weather in all: dry - \"Wysechł, gotowy do wypalenia\"", dry2.d >= 1 && /Wysechł/.test(dry2.status.text) && dry2.names.includes("Zabierz wysuszony garnek"), dry2);
        check("...the picture turns to the pale dry pot", /Farm_Pot_Dry/.test(await pic()), await pic());
        if (OUT) await b.shot(OUT + "pot_dry.png");
        await ev(`(function(){ Farming.takePot(Farming.buildingAt(${px}, ${py})); return 0; })()`);
        await frames(60);
        const taken = await J(`({ dried: $gameParty.numItems($dataItems[166]), raw: $gameParty.numItems($dataItems[165]), left: !!Farming.buildingAt(${px}, ${py}) })`);
        check("taken: a dried pot in the bag (for the kiln), nothing left on the ground", taken.dried === 1 && taken.raw === 0 && !taken.left, taken);

        // taken before it dried: the raw pot again
        await ev(`(function(){ $gameParty.gainItem($dataItems[165], 1); Farming.build("pot", ${px}, ${py}); return 0; })()`);
        await frames(60);
        await ev(`(function(){ const b = Farming.buildingAt(${px}, ${py}); Farming.potDryness(b); $gameSystem.advanceDayNight(5); Farming.takePot(b); return 0; })()`);
        await frames(60);
        const early = await J(`({ dried: $gameParty.numItems($dataItems[166]), raw: $gameParty.numItems($dataItems[165]) })`);
        check("taken too early: still the raw pot (it dries from the start when set down again)", early.raw === 1 && early.dried === 1, early);
        // firing: the dried pot in the earth kiln -> a clay pot that holds water
        const kiln = await J(`(function(){ const ks = Farming.BUILDINGS.kiln.recipes.filter(r => /pot/.test(r.id)).map(r => ({ id: r.id, name: r.name, inputs: r.inputs, output: r.output, hours: r.hours })); return ks; })()`);
        check("the earth kiln fires the pots: \"Wypal garnek\" (1 dried pot + 2 wood, 6 h) and \"Wypal 4 garnki\" (4 + 5 wood, 8 h)",
            kiln.length === 2 && JSON.stringify(kiln[0].inputs) === "[[166,1],[61,2]]" && JSON.stringify(kiln[0].output) === "[167,1]" && kiln[0].hours === 6 && JSON.stringify(kiln[1].inputs) === "[[166,4],[61,5]]" && JSON.stringify(kiln[1].output) === "[167,4]", kiln);
        const kspot = await J(`(function(){ for (let y = 6; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 4; x++) if (!Farming.whyNotBuild("kiln", x, y, false, true)) return { x, y }; return null; })()`);
        const kx = kspot.x, ky = kspot.y;
        const st = await J(`(function(){ const ok = Farming.placeFree("kiln", ${kx}, ${ky}); const b = Farming.buildingAt(${kx}, ${ky});
            $gameParty.gainItem($dataItems[61], 2); window.__d0 = $gameParty.numItems($dataItems[166]);
            return { ok, type: b && b.type, started: Farming.startJob(b, "fire_pot") }; })()`);
        await frames(90);   // (he loads the kiln first)
        const fired = await J(`(function(){ const b = Farming.buildingAt(${kx}, ${ky}); const used = window.__d0 - $gameParty.numItems($dataItems[166]); const running = !!b.job;
            $gameSystem.advanceDayNight(6.2); const ready = Farming.jobReady(b); window.__f0 = $gameParty.numItems($dataItems[167]); Farming.collectJob(b);
            return { type: b.type, running, used, ready }; })()`);
        await frames(90);   // (he takes it out)
        fired.started = st.started;
        fired.got = (await ev("$gameParty.numItems($dataItems[167])")) - (await ev("window.__f0"));
        check("...fired: the dried pot goes in, after 6 hours a clay pot comes out", fired.type === "kiln" && fired.started && fired.used === 1 && fired.ready && fired.got === 1, fired);
        const items = await J("[165, 166, 167].map(i => ({ name: $dataItems[i].name, icon: $dataItems[i].iconIndex }))");
        check("the items: Surowy garnek (icon 428), Wysuszony garnek (icon 429), Gliniany garnek (icon 430)", items[0].name === "Surowy garnek" && items[0].icon === 428 && items[1].name === "Wysuszony garnek" && items[1].icon === 429 && items[2].name === "Gliniany garnek" && items[2].icon === 430, items);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
