// Sleep and danger (the user's, 2026-09-26: "wilki lub dzik atakują gracza, gracz idzie spać - co się dzieje rano?"):
// no sleeping with a boar or a wolf after him (greyed out, it says why); in the wolves' hours a pack may find the sleeper - he wakes
// at that hour with part of the rest and they are there (further off when the tame dog heard them first); never in the hut; with no
// raid a whole night as before; at dawn the wolves stop the hunt and run off into the forest.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); if (window.Birds) Birds.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameScreen.clearWeather(); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const clear = () => ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
        // a forest bedroll by the player
        const bed = await J(`(function(){ const f = $gameSystem._farm, list = (f.buildings[3] = f.buildings[3] || []), p = $gamePlayer;
            for (let r = 1; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                const x = p.x + dx, y = p.y + dy;
                if (Farming.whyNotBuild("bedroll", x, y, false, true)) continue;
                list.push({ id: f.nextId++, type: "bedroll", x, y, last: 1, v: 3 }); f.rev++; return { x, y };
            }
            return null; })()`);
        check("a forest bedroll by the player", !!bed, bed);
        const B = `Farming.buildingAt(${bed.x}, ${bed.y})`;
        const sleepEntry = `(function(){ const m = Farming.menuFor(${bed.x}, ${bed.y}); const e = m.entries.find(e => e.name === "Prześpij noc"); return e ? { enabled: e.enabled !== false, help: e.help } : null; })()`;
        // (a night that ran past midnight ends on the day's summary: closed with OK)
        const waitSleep = async () => { for (let i = 0; i < 60; i++) { await frames(10); await ev("if (SceneManager._scene.constructor.name === 'Scene_DaySummary' && !SceneManager.isSceneChanging()) SceneManager.pop(); 0"); if (await ev("SceneManager._scene.constructor.name !== 'Scene_Map'")) continue; if (await ev("!$gameScreen._fadeSign && $gameScreen.brightness() >= 250 && !$gameTemp._farmLock")) break; } await frames(20); };
        // (the distance of the pack when it comes: they run in at once)
        await ev("(function(){ const o = Hunting.raidPack; Hunting.raidPack = function() { const p = o.apply(this, arguments); window.__raidD = p ? p.members.map(m => +Math.hypot(m.x - $gamePlayer.x, m.y - $gamePlayer.y).toFixed(1)) : []; return p; }; })(); 0");
        const lieDown = () => ev(`(function(){ const m = Farming.menuFor(${bed.x}, ${bed.y}); return String(m.entries.find(e => e.name === "Prześpij noc").run()); })()`);

        // 1. a boar after him: no sleep
        await ev(`$gameSystem.setDayNightHour(21); (function(){ const a = Hunting.spawn("boar", $gamePlayer.x + 3, $gamePlayer.y); a._frozen = true; a.setMode("alert", 600); window.__boar = a; })(); 0`);
        await frames(5);
        const e1 = await J(sleepEntry);
        const h1 = await ev("$gameSystem.dayNightHour()");
        const r1 = await lieDown();
        await frames(20);
        check("a boar after him (3 tiles off): 'Prześpij noc' greyed out ('Nie zaśniesz - w pobliżu Dzik!') and the night does not pass",
            e1 && !e1.enabled && /Nie zaśniesz - w pobliżu Dzik/.test(e1.help) && r1 === "false" && Math.abs((await ev("$gameSystem.dayNightHour()")) - h1) < 0.2, { e1, r1 });
        await clear();

        // 1b. the first days are calm: x0.1 of the chance till day 3, up evenly to the full 6%/hour on day 10 (half by a fire)
        const calm = await J(`(function(){ const c = (d, f) => +(Hunting.raidChance(d, f) * 100).toFixed(2); return { d1: c(1), d3: c(3), d5: c(5), d10: c(10), d40: c(40), fire1: c(1, true), fire40: c(40, true),
            night1: +(100 * (1 - Math.pow(1 - Hunting.raidChance(1), 6))).toFixed(1), night10: +(100 * (1 - Math.pow(1 - Hunting.raidChance(10), 6))).toFixed(1) }; })()`);
        check("the first days are calm: 0.6%/hour on days 1-3 (a 22-6 night ~3.5%), growing to the full 6%/hour from day 10 (~31%), a fire halves it",
            calm.d1 === 0.6 && calm.d3 === 0.6 && calm.d5 > 0.6 && calm.d5 < 6 && calm.d10 === 6 && calm.d40 === 6 && calm.fire1 === 0.3 && calm.fire40 === 3 && calm.night1 < 4 && calm.night10 > 30, calm);

        // 2. the wolves come in the night: woken at that hour, part of the rest, the pack there (the calm first days off here)
        await ev(`Hunting.RAID.perHour = 1; Hunting.RAID.calm = 1; $gameSystem.setDayNightHour(21.5); $gameSystem.setStamina(10); 0`);
        await lieDown();
        await waitSleep();
        const raid = await J(`({ hour: +$gameSystem.dayNightHour().toFixed(2), st: Math.round($gameSystem.stamina()), max: $gameSystem.maxStamina(), came: window.__raidD,
            wolves: Hunting.animals.filter(a => a.kind() === "wolf").map(a => ({ d: +Math.hypot(a.x - $gamePlayer.x, a.y - $gamePlayer.y).toFixed(1), engaged: !!a._engaged, mode: a._mode })) })`);
        check("in the wolves' hours a pack finds him: he wakes at 22:00 (the first hour), with part of the rest, 2-4 wolves some 9 tiles off, after him",
            Math.abs(raid.hour - 22) < 0.1 && raid.st >= 10 && raid.st < raid.max * 0.6 && raid.came.length >= 2 && raid.came.every(d => d >= 7 && d <= 12) && raid.wolves.every(w => w.engaged), raid);
        await b.shot(require("path").join(__dirname, "..", "sleep_wolves.png"));
        await clear();

        // 3. the tame dog hears them first: the pack further off
        await ev(`(function(){ const s = Dog.state(); s.tame = true; s.mode = "stay"; s.map = 3; s.x = $gamePlayer.x + 1; s.y = $gamePlayer.y + 1; s.hp = 50; s.st = 50; s.food = 90; s.water = 90; Dog.removeDog(); Dog.sync(); $gameSystem.setDayNightHour(21.5); return 0; })()`);
        await frames(10);
        await lieDown();
        await waitSleep();
        const dogRaid = await J(`({ came: window.__raidD })`);
        check("the tame dog barks first: the pack is further off (about 13 tiles)", dogRaid.came.length >= 2 && dogRaid.came.every(d => d >= 11), dogRaid);
        await clear();
        await ev("Dog.state().tame = false; Dog.removeDog(); 0");

        // 4. no raid: a whole night, to the morning
        await ev(`Hunting.RAID.perHour = 0; $gameSystem.setDayNightHour(21.5); $gameSystem.setStamina(10); 0`);
        const day0 = await ev("$gameSystem.dayNightDay()");
        await lieDown();
        await waitSleep();
        const quiet = await J("({ hour: $gameSystem.dayNightHour(), day: $gameSystem.dayNightDay(), wolves: Hunting.animals.filter(a => a.kind() === 'wolf').length })");
        check("no pack: the whole night, up at 7:00 the next day, no wolves", Math.abs(quiet.hour - 7) < 0.2 && quiet.day === day0 + 1 && quiet.wolves === 0, quiet);

        // 5. dawn: a pack still after him stops the hunt and runs off
        for (let i = 0; i < 20 && (await ev("SceneManager._scene.constructor.name")) !== "Scene_Map"; i++) { await ev("if (!SceneManager.isSceneChanging()) SceneManager.pop(); 0"); await frames(15); }   // (the day's summary closed)
        await ev(`$gameSystem.setDayNightHour(4.9); (function(){ const p = Hunting.spawnPack($gamePlayer.x + 5, $gamePlayer.y, 3); Hunting.wolfEngage(p.members[0]); window.__pack = p; })(); 0`);
        await frames(30);
        const before = await J("__pack.members.map(m => m._mode)");
        await ev("$gameSystem.setDayNightHour(5.6); 0");
        await frames(90);
        const dawn = await J("({ modes: __pack.members.filter(m => !m._dead && Hunting.animals.includes(m)).map(m => m._mode), left: __pack.members.filter(m => Hunting.animals.includes(m)).length, engaged: !!__pack.engaged })");
        check("dawn (5:30): the wolves stop the hunt and run off (fleeing, the pack no longer engaged)", !dawn.engaged && dawn.modes.every(m => m === "flee"), { before, dawn });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
