// The storm (Survival.js plans it, Storm.js shows it): storm days in the plan, the gathering / raging / passing level,
// the wind in the trees, clouds and leaves, lightning (flash, bolt, shake, thunder after the right delay), the night lit
// up by a flash, thunder muffled under a roof, the F9 "calm" - and a few screenshots to look at.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        // record sounds and popups
        await ev(`(function(){ window.__se = []; const _p = AudioManager.playSe; AudioManager.playSe = function(se) { window.__se.push({ name: se.name, volume: se.volume, pitch: se.pitch, f: Graphics.frameCount }); return _p.call(this, se); };
            window.__pop = []; const _q = Game_Temp.prototype.pushLootPopup; Game_Temp.prototype.pushLootPopup = function(icon, text) { window.__pop.push(text); return _q.apply(this, arguments); }; })(); 0`);

        // ---------------------------------------------------------------- the plan
        const plan = await J(`(function(){ const n = [0, 0, 0, 0], rainy = [0, 0, 0, 0], bad = []; let example = null;
            for (let d = 1; d <= 336; d++) { const s = Farming.seasonIndex(d), p = Survival.weatherPlan(d); if (!p) continue; rainy[s]++;
                if (p.storm) { n[s]++; if (!example) example = d;
                    if (p.type !== "rain" || p.storm.start < 14 || p.storm.end > 24 || p.storm.end - p.storm.start < 1.5 || p.start !== p.storm.start || p.end < p.storm.end) bad.push([d, p]); } }
            return { n, rainy, bad, example }; })()`);
        check("storm days: never in winter, most in summer, some in spring and autumn", plan.n[3] === 0 && plan.n[1] >= plan.n[0] && plan.n[1] >= plan.n[2] && plan.n[0] > 0 && plan.n[2] > 0, plan);
        check("a storm comes in the afternoon/evening, lasts 1.5-3 h, the rain starts with it and may go on after it", plan.bad.length === 0, plan.bad.slice(0, 3));
        const D = plan.example;
        const shape = await J(`(function(){ const p = Survival.weatherPlan(${D}), s = p.storm, L = h => Survival.stormLevel(${D}, h), P = h => Survival.stormPhase(${D}, h);
            return { s, before: L(s.start - 1.5), gather: L(s.start - 0.5), gatherPhase: P(s.start - 0.5), top: L(s.start + 0.6), ragePhase: P(s.start + 0.6), passPhase: P(s.end - 0.3), dying: L(s.end - 0.3), after: L(s.end + 0.5) }; })()`);
        check("its level: 0 before, gathering (0..0.55) the hour before the rain, raging near 1, dying away, 0 after", shape.before === 0 && shape.gather > 0 && shape.gather < 0.55 && shape.gatherPhase === "gather" && shape.top > 0.8 && shape.ragePhase === "rage" && shape.passPhase === "pass" && shape.dying < shape.top && shape.after === 0, shape);

        // how far the trees bend: the top strip against the bottom one, the largest over ~3 s, averaged over the trees on screen
        const bend = async () => {
            let best = [];
            for (let k = 0; k < 18; k++) {
                const now = await J(`SceneManager._scene._spriteset._characterSprites.filter(s => s._treeStrips && s._treeStrips.length > 2 && s.visible).map(s => { const st = s._treeStrips; return Math.abs(st[0].x - st[st.length - 1].x); })`);
                best = now.map((v, i) => Math.max(v, best[i] || 0));
                await frames(10);
            }
            return best.length ? best.reduce((a, v) => a + v, 0) / best.length : 0;
        };
        // ---------------------------------------------------------------- F9: a storm now (day)
        await ev("$gameSystem.setDayNightHour(14); 0");
        await frames(30);
        const calmClouds = await J("SceneManager._scene._spriteset._cloudSprites.map(c => c.opacity)");
        const calmBend = await bend();
        await ev("Survival.forceStorm(2); 0");
        await frames(70);
        const g = await J(`({ level: Storm.level(), phase: Storm.phase(), wind: Storm.wind(), weather: $gameScreen.weatherType(), target: $gameScreen._weatherPowerTarget || 0, pops: window.__pop.slice() })`);
        check("forced: it gathers - the level rises, wind picks up, no rain yet, 'Zbiera się na burzę'", g.phase === "gather" && g.level > 0.2 && g.wind > 0.2 && g.target === 0 && g.pops.includes("Zbiera się na burzę"), g);
        // jump into the raging part
        await ev("$gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); 0");
        await frames(130);
        const r = await J(`(function(){ const ss = SceneManager._scene._spriteset, w = ss._weather; const drop = w._sprites.find(s => s.bitmap === w._stormBitmap);
            return { level: Storm.level(), phase: Storm.phase(), wind: Storm.wind(), weather: $gameScreen.weatherType(), target: $gameScreen._weatherPowerTarget, rot: drop ? drop.rotation : null,
                leaves: ss._stormLeaves._leaves.filter(l => l.visible).length, clouds: ss._cloudSprites.map(c => c.opacity), tone: $gameScreen.tone().slice(), base: DayNightCycle.computeTone($gameSystem.dayNightHour()),
                pops: window.__pop.slice(), bgs: AudioManager._currentBgs && AudioManager._currentBgs.name }; })()`);
        check("raging: MZ 'storm' rain, hard (power 8-9), 'Burza!'", r.phase === "rage" && r.weather === "storm" && r.target >= 8 && r.pops.includes("Burza!"), { weather: r.weather, target: r.target, pops: r.pops });
        check("the rain slants with the wind, to the right (negative rotation)", r.rot !== null && r.rot < -0.2, r.rot);
        check("the wind is up (> 0.8) and leaves and twigs fly across the screen", r.wind > 0.8 && r.leaves >= 25, { wind: r.wind, leaves: r.leaves });
        check("the cloud shadows fade under the storm's one dark sky", r.clouds.length > 0 && r.clouds.every((o, i) => o < calmClouds[i] * 0.4), { calm: calmClouds.slice(0, 4), now: r.clouds.slice(0, 4) });
        check("the sky is darker than the hour's own tone (red/green down, grey up)", r.tone[0] < r.base[0] - 25 && r.tone[1] < r.base[1] - 25 && r.tone[3] > r.base[3] + 30, { tone: r.tone, base: r.base });
        const stormBend = await bend();
        check("the trees bend much further in the storm (at least 2.5 x)", calmBend > 0 && stormBend > calmBend * 2.5, { calmBend, stormBend });
        const c0 = await ev("Storm.clock()"); await frames(60); const c1 = await ev("Storm.clock()");
        check("the wind clock (the trees' sway) runs faster in the storm", c1 - c0 > 1.6, c1 - c0);
        let bgs = r.bgs;   // the bed may still be crossfading from the wind of the gathering storm
        for (let i = 0; i < 30 && bgs !== "Rain4"; i++) { await frames(10); bgs = await ev("AudioManager._currentBgs ? AudioManager._currentBgs.name : null"); }
        check("the ambient bed is the downpour (Rain4)", bgs === "Rain4", bgs);

        // ---------------------------------------------------------------- a strike right next to you
        await ev("window.__se = []; Storm.state.nextStrike = Storm.state.t + 100000; 0");   // no strikes of its own during the checks
        await ev("Storm.strike(0.05); 0");
        await frames(2);
        const near = await J(`(function(){ const sky = SceneManager._scene._spriteset._stormSky; return { flash: Storm.flash(), light: sky._light.alpha, bolt: sky._bolt.alpha, shake: $gameScreen._shakeDuration }; })()`);
        await b.shot(OUT + "storm_bolt.png");
        check("close: a bright flash, the bolt drawn, the screen shakes", near.flash > 0.7 && near.light > 0.2 && near.bolt > 0.5 && near.shake > 0, near);
        await frames(40);
        const nearSe = await J("window.__se.filter(s => /^Thunder/.test(s.name))");   // (a close strike may also hit a tree: Fire2 between them)
        check("close: the crack comes at once (a short, bright thunder), then a rumble", nearSe.length >= 2 && ["Thunder10", "Thunder8", "Thunder6"].includes(nearSe[0].name) && nearSe[0].volume >= 85 && ["Thunder9", "Thunder7", "Thunder11", "Thunder1", "Thunder4", "Thunder5"].includes(nearSe[1].name), nearSe);
        const after = await J("({ flash: Storm.flash(), bolt: SceneManager._scene._spriteset._stormSky._bolt.alpha })");
        check("...and the flash and the bolt are gone a moment later", after.flash < 0.05 && after.bolt === 0, after);
        // far away: a faint glow, no bolt, the rumble ~3 s later, low
        await ev("window.__se = []; window.__f0 = Graphics.frameCount; Storm.strike(0.95); 0");
        await frames(2);
        const far = await J("({ flash: Storm.flash(), bolt: SceneManager._scene._spriteset._stormSky._bolt.alpha })");
        check("far: only a faint flash, no bolt", far.flash > 0.05 && far.flash < 0.35 && far.bolt === 0, far);
        await frames(120);
        check("far: no thunder yet 2 s later (the sound is still on its way)", (await J("window.__se.filter(s => /^Thunder/.test(s.name)).length")) === 0);
        await frames(100);
        const farSe = await J("window.__se.filter(s => /^Thunder/.test(s.name)).map(s => ({ name: s.name, volume: s.volume, pitch: s.pitch, after: s.f - window.__f0 }))");
        check("far: then a quiet, low rumble", farSe.length === 1 && farSe[0].after >= 170 && farSe[0].volume <= 50 && farSe[0].pitch <= 75, farSe);
        // it strikes by itself while raging
        const n0 = await ev("Storm.state.strikes");
        await ev("Storm.state.nextStrike = Storm.state.t + 1; 0");
        await frames(20);
        check("while raging, lightning strikes by itself", (await ev("Storm.state.strikes")) > n0);

        // ---------------------------------------------------------------- under a roof: no flash, muffled thunder
        await ev("window.__se = []; window.__out = Survival.isOutdoors; Survival.isOutdoors = () => false; 0");
        await frames(80);
        await ev("Storm.state.nextStrike = Storm.state.t + 100000; Storm.strike(0.05); 0");
        await frames(30);
        const roof = await J("({ flash: Storm.flash(), wind: Storm.wind(), se: window.__se.slice() })");
        const crack = roof.se.find(s => ["Thunder10", "Thunder8", "Thunder6"].includes(s.name));
        check("under a roof: no flash, the wind is not felt, the crack is half as loud and duller", roof.flash === 0 && roof.wind < 0.1 && !!crack && crack.volume <= 50 && crack.pitch <= 96, roof);
        await ev("Survival.isOutdoors = window.__out; 0");
        await frames(80);

        // ---------------------------------------------------------------- the night lit up by a flash
        await ev("Survival.calmWeather(); $gameSystem.setDayNightHour(22); 0");
        await frames(20);
        await ev("delete $gameSystem._stormForce; Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); Storm.state.nextStrike = Storm.state.t + 100000; 0");
        await frames(140);
        const darkAt = () => ev("SceneManager._scene._spriteset._nightLight.bitmap.context.getImageData(20, 20, 1, 1).data[3]");
        const dark0 = await darkAt();
        await b.shot(OUT + "storm_night.png");
        const rain0 = await ev("SceneManager._scene._spriteset._weather.alpha");
        // strike and measure 2 frames later in one go (separate calls can land several frames late while the flash fades)
        const lit = JSON.parse(await ev(`new Promise(res => { Storm.strike(0.1); const t = Graphics.frameCount + 2; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv);
            const ss = SceneManager._scene._spriteset; res(JSON.stringify({ dark: ss._nightLight.bitmap.context.getImageData(20, 20, 1, 1).data[3], rain: ss._weather.alpha })); } }, 1); })`));
        const dark1 = lit.dark, rain1 = lit.rain;
        await b.shot(OUT + "storm_night_flash.png");
        check("at night a flash lifts the darkness for a moment", dark0 > 150 && dark1 < dark0 * 0.5, { dark0, dark1 });
        check("at night the rain is only a faint sheen (drawn over the dark), in the flash it lights up", rain0 < 0.5 && rain1 > 0.8, { rain0, rain1 });
        await frames(30);
        check("...and dims again after it", await ev("SceneManager._scene._spriteset._weather.alpha < 0.5"));
        await frames(50);
        check("...and the dark comes back", (await darkAt()) > dark0 * 0.9, await darkAt());

        // ---------------------------------------------------------------- F9 "calm": the weather goes, the wind dies down
        await ev("Survival.calmWeather(); 0");
        await frames(150);
        const calm = await J("({ level: Storm.level(), wind: Storm.wind(), target: $gameScreen._weatherPowerTarget || 0 })");
        check("calm: no storm, the wind has died down, the rain is fading out", calm.level === 0 && calm.wind < 0.05 && calm.target === 0, calm);
        check("the forced weather is in the save ($gameSystem)", await ev("!!$gameSystem._stormForce && $gameSystem._stormForce.off === true"));
        // a day-time screenshot of a raging storm
        await ev("delete $gameSystem._stormForce; $gameSystem.setDayNightHour(15); Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.7); Storm.state.nextStrike = Storm.state.t + 100000; 0");
        await frames(160);
        await b.shot(OUT + "storm_day.png");
        await ev("Storm.strike(0.1); 0");
        await frames(2);
        await b.shot(OUT + "storm_day_bolt.png");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
