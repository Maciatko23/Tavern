// A station whose job is done and waits to be collected (the soil in the compost bin): its recipes stay usable - choosing one takes
// the finished thing into the bag first and starts the new job (the user's, 2026-09-26: "póki aktualnie wytworzonej nie zbierze, nie
// może użyć innych opcji budynku - i tak dla wszystkich budynków"). A running job still blocks; with no room in the bag nothing is
// lost; demolishing with a finished job takes it along.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 26, 17, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(10); $gameScreen.clearWeather(); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        // a compost bin by the player, 12 rotten food in the bag
        const at = await J(`(function(){ const f = $gameSystem._farm, list = (f.buildings[3] = f.buildings[3] || []), p = $gamePlayer;
            for (let r = 1; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                const x = p.x + dx, y = p.y + dy;
                if (Farming.whyNotBuild("compost", x, y, false, false)) continue;
                list.push({ id: f.nextId++, type: "compost", x, y, last: 1, v: 3 }); f.rev++;
                $gameParty.gainItem($dataItems[Spoilage.ROT], 12);
                return { x, y };
            }
            return null; })()`);
        check("a compost bin by the player", !!at, at);
        const bin = `Farming.buildingAt(${at.x}, ${at.y})`;
        const entries = `(function(){ const m = Farming.menuFor(${at.x}, ${at.y}); return (m.tabs ? m.tabs.reduce((a, t) => a.concat(t.entries), []) : m.entries).map(e => ({ name: e.name, enabled: e.enabled !== false, help: e.help || "" })); })()`;
        const recipe = "Kompostuj zepsute jedzenie";
        const rot = () => ev("$gameParty.numItems($dataItems[Spoilage.ROT])"), soil = () => ev("$gameParty.numItems($dataItems[Farming.ITEM.soil])");

        // a job running: the recipe waits
        await ev(`Farming.startJob(${bin}, "rot"); 0`);
        await frames(60);
        const running = await J(entries);
        const r1 = running.find(e => e.name === recipe);
        check("while it is still composting, the recipe is greyed out (the bin is busy)", (await ev(`!!${bin}.job`)) && r1 && !r1.enabled, r1);

        // done, not collected: the recipe is open; choosing it collects first and starts the next one
        await ev(`$gameSystem.advanceDayNight(Farming.jobHoursLeft(${bin}) + 0.5); 0`);
        await frames(10);
        const ready = await J(entries);
        const r2 = ready.find(e => e.name === recipe);
        check("done and waiting: 'Zbierz' first, and the recipe is open (its help says the soil goes into the bag first)",
            /^Zbierz/.test(ready[0].name) && r2 && r2.enabled && /Najpierw zabierasz gotowe/.test(r2.help), { first: ready[0].name, r2 });
        const s0 = await soil(), rot0 = await rot(), start0 = await ev(`${bin}.job.start`);
        await ev(`(function(){ const m = Farming.menuFor(${at.x}, ${at.y}); const all = m.tabs ? m.tabs.reduce((a, t) => a.concat(t.entries), []) : m.entries; all.find(e => e.name === "${recipe}").run(); return 0; })()`);
        await frames(60);
        const after = await J(`({ soil: $gameParty.numItems($dataItems[Farming.ITEM.soil]), rot: $gameParty.numItems($dataItems[Spoilage.ROT]), job: !!${bin}.job, ready: Farming.jobReady(${bin}), start: ${bin}.job && ${bin}.job.start })`);
        check("choosing it: the finished soil goes into the bag (+3) and the next composting starts (4 more rotten food used)",
            after.soil === s0 + 3 && after.rot === rot0 - 4 && after.job && !after.ready && after.start > start0, Object.assign({ s0, rot0 }, after));

        // no room in the bag for the finished soil: nothing is lost, the new job does not start
        await ev(`$gameSystem.advanceDayNight(Farming.jobHoursLeft(${bin}) + 0.5); $gameParty.gainItem($dataItems[Farming.ITEM.soil], 999); 0`);
        await frames(10);
        const rot1 = await rot();
        await ev(`(function(){ const m = Farming.menuFor(${at.x}, ${at.y}); const all = m.tabs ? m.tabs.reduce((a, t) => a.concat(t.entries), []) : m.entries; all.find(e => e.name === "${recipe}").run(); return 0; })()`);
        await frames(30);
        const full = await J(`({ ready: Farming.jobReady(${bin}), rot: $gameParty.numItems($dataItems[Spoilage.ROT]) })`);
        check("with the soil stack full: the finished soil stays in the bin (not lost) and no new job starts", full.ready && full.rot === rot1, Object.assign({ rot1 }, full));

        // demolishing with the finished job: it is taken along
        await ev("$gameParty.loseItem($dataItems[Farming.ITEM.soil], 999); 0");
        const block = await ev(`Farming.demolishBlock ? Farming.demolishBlock(${bin}) : null`);
        const gone = await ev(`Farming.demolish(${bin})`);
        await frames(20);
        check("demolishing it while the soil waits: allowed, the soil goes into the bag", !block && gone === true && (await soil()) === 3 && !(await ev(`!!${bin}`)), { block, gone, soil: await soil() });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
