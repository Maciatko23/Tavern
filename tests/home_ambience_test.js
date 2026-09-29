// Grandpa's house comes alive (HomeAmbience.js + RoomLighting.js 1.2 <LightFlicker>): the hearth's light flickers (strength, reach
// and colour, by noise), the candles each on their own; sparks and steam over the hearth stay in their bounds and setSteam() thickens
// the steam; the four windows show the outside - the sky by the hour (pink dawn, blue day, orange dusk, deep blue night with stars,
// the moon), rain on the glass, snow and winter frost - with the flower pots still in front; a lightning strike (Storm.js) flashes the
// windows and the room; the warm grade is there only in the house; the sound beds (fire by distance, drips with Atmosphere's rain,
// the storm's wind) start and stop on the way in and out; the frame time with and without the plugin. (Loads HomeAmbience.js into
// the page when js/plugins.js does not have it; a new game is started on Map019 in the page - data/System.json may point elsewhere.)
// Screenshots: docs/dom_dziadka/zycie_*.png
//   CDP_PORT=9390 node tests/home_ambience_test.js
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "dom_dziadka");

(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const JP = async e => JSON.parse(await ev("(" + e + ").then(v => JSON.stringify(v))"));   // (a promise in the page)
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(250); } return false; };
    const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${id})`;
    // nothing else moving in the house: no needs, no animals; the story's intro heard, no deadline (the winter days are past day 60)
    const quiet = "(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); $gameSystem._minimapHidden = true; if (window.Story) { Story.skipIntro(); Story.setDeadlineOn(false); } return 0; })()";
    const toTitle = async () => {
        if (!(await ev("SceneManager._scene instanceof Scene_Title"))) await ev("SceneManager.goto(Scene_Title); 0");
        return until("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()", 30);
    };
    // a new game in grandpa's house (as the story starts it: 2,5 beside the hero's straw bed), then the hero put at (x, y)
    const newGame = async (x, y) => {
        await toTitle();
        await ev("(function(){ Object.assign($dataSystem, { startMapId: 19, startX: 2, startY: 5 }); DataManager.setupNewGame(); SceneManager.goto(Scene_Map); return 0; })()");
        const ok = await until(onMap(19), 40);
        await frames(10);
        await ev(quiet);
        if (x !== undefined) await ev(`(function(){ $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(8); return 0; })()`);
        await frames(20);
        return ok;
    };
    const go = async (map, x, y) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, 2, 0); return 0; })()`);
        const ok = await until(onMap(map), 40);
        await frames(20);
        await ev(quiet);
        return ok;
    };
    const setTime = (d, h) => ev(`(function(){ $gameSystem._dayNightDay = ${d}; $gameSystem.setDayNightHour(${h}); return 0; })()`);
    const put = (x, y) => ev(`(function(){ $gamePlayer.locate(${x}, ${y}); return 0; })()`);
    // the HUD, the map's name and the plates off for the pictures of the house
    const bare = on => ev(`(function(){ const s = SceneManager._scene; for (const k of ["_hudLayer", "_mapNameWindow", "_xpBar", "_weaponPlate", "_modeBadge", "_minimap"]) if (s[k]) { s[k].visible = ${!on}; s[k].opacity = ${on ? 0 : 255}; } return 0; })()`);
    // frame time: the whole tick (update + render, Graphics' FPS counter) and the spriteset's update alone
    const PERF_HOOK = `(function(){
        window.__pfGen = (window.__pfGen || 0) + 1; const gen = window.__pfGen;
        const up = Spriteset_Map.prototype.update;
        Spriteset_Map.prototype.update = function() { if (window.__pfGen !== gen) return up.call(this); const t = performance.now(); up.call(this); const p = window.__pf; if (p) p.set += performance.now() - t; };
        if (!window.__pfTick) { window.__pfTick = true; const fc = Graphics._fpsCounter, end = fc.endTick;
            fc.endTick = function() { end.call(this); const p = window.__pf; if (p) { p.n++; p.tick += this.duration; p.max = Math.max(p.max, this.duration); } }; }
        return 0; })()`;
    const perf = async n => {
        await ev("window.__pf = { n: 0, tick: 0, set: 0, max: 0 }; 0");
        await frames(n);
        return J("(function(){ const p = window.__pf; window.__pf = null; return { frames: p.n, tickMs: +(p.tick / p.n).toFixed(3), spritesetMs: +(p.set / p.n).toFixed(3), maxTickMs: +p.max.toFixed(2) }; })()");
    };
    fs.mkdirSync(SHOTS, { recursive: true });
    let logsFrom = 0;
    try {
        // ---- boot (a busy server sometimes leaves the page half-loaded: go again)
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            logsFrom = b.logs.length;
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) { booted = true; break; }
                await sleep(500);
            }
        }
        check("the game boots", booted);
        // the days to look at: a clear spring day, a rainy one, a snowy winter day, a clear winter day
        const D = await J(`(function(){ const out = {}; for (let d = 3; d < 200; d++) { const p = Survival.weatherPlan(d), s = Farming.seasonIndex(d);
            if (!out.clear && !p && s === 0) out.clear = d;
            if (!out.rain && p && p.type === 'rain' && !p.storm && s < 2 && p.power >= 4 && p.end - p.start >= 2) out.rain = [d, p.start + 0.6];
            if (!out.snow && p && p.type === 'snow' && p.power >= 4 && p.start <= 12 && p.end >= 13) out.snow = [d, Math.max(p.start + 0.6, 12)];
            if (!out.winter && !p && s === 3) out.winter = d; } return out; })()`);
        check("found a clear day, a rainy day, a snowy winter day and a clear winter day in the weather plan", D.clear && D.rain && D.snow && D.winter, D);

        // ================= 0. the house before the plugin: the frame time
        await ev(PERF_HOOK);
        const pre = await newGame(9, 6);
        const loadedBefore = await ev("!!window.HomeAmbience");
        await setTime(D.clear, 20.5);
        await frames(30);
        const perfBefore = await perf(240);
        console.log("INFO frame time before HomeAmbience", JSON.stringify(perfBefore), "(registered:", loadedBefore + ")");

        // ================= 1. the plugin (the core first: HomeAmbience.js is built on it - TawernaCore.js, TawernaUI.js put into the page
        // the way an unregistered plugin is)
        const core = await ev(`(async () => { const put = (f, has) => new Promise(res => { if (has()) return res(true); const s = document.createElement("script"); s.src = "js/plugins/" + f + ".js?" + Date.now();
            s.onload = () => res(has()); s.onerror = () => res(false); document.body.appendChild(s); });
            return (await put("TawernaCore", () => !!window.Tawerna)) && (await put("TawernaUI", () => !!(window.Tawerna && Tawerna.ui && Tawerna.ui.Scene_MiniGame))); })()`);
        const loaded = core && await ev(`new Promise(res => { if (window.HomeAmbience) return res(true); const s = document.createElement("script"); s.src = "js/plugins/HomeAmbience.js?" + Date.now(); s.onload = () => res(!!window.HomeAmbience); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("HomeAmbience.js loads into the page", loaded && pre);
        await ev(PERF_HOOK);
        const started = await newGame(9, 6);
        check("a new game starts in grandpa's house (Map019) with the house alive (HomeAmbience's layer made)", started && await ev("!!HomeAmbience.fx() && HomeAmbience.isActive()"));
        await setTime(D.clear, 20.5);
        await frames(30);
        const perfAfter = await perf(240);
        const own = await J("HomeAmbience.fx().perf");
        console.log("INFO frame time with HomeAmbience", JSON.stringify(perfAfter), "its own update", JSON.stringify({ ms: +own.ms.toFixed(3), max: +own.max.toFixed(2) }));
        check("the frame time in the house grows by little (spriteset update + at most 2.5 ms; HomeAmbience's own update under 1.5 ms)",
            perfAfter.spritesetMs <= perfBefore.spritesetMs + 2.5 && own.ms < 1.5, { before: perfBefore, after: perfAfter, own: +own.ms.toFixed(3) });

        // ---- the notes: in memory only
        const notes = await J(`(function(){ const E = $dataMap.events.filter(e => e); const hearth = E.find(e => /Palenisk/.test(e.name) && /<Light/.test(e.note));
            const candles = E.filter(e => /[ŚśSs]wieca/.test(e.name) && /<Light/.test(e.note)); const cones = E.filter(e => /<LightCone/.test(e.note));
            return { hearth: hearth && hearth.note, hearthId: hearth && hearth.id, candles: candles.map(c => c.note), candleIds: candles.map(c => c.id), cones: cones.map(c => c.note) }; })()`);
        const disk = await ev("fetch('data/Map019.json', { cache: 'no-store' }).then(r => r.text()).then(t => /LightFlicker/.test(t))");
        check("in memory the hearth flickers with an amber drift, each candle a little, the sun's dust is drawn by the plugin (dust=0); data/Map019.json untouched",
            /<LightFlicker:0\.16,132,84,20>/.test(notes.hearth) && notes.candles.length >= 3 && notes.candles.every(n => /<LightFlicker:0\.06>/.test(n)) &&
            notes.cones.length === 4 && notes.cones.every(n => /dust=0\b/.test(n)) && !disk, { hearth: notes.hearth, candles: notes.candles.length, disk });

        // ================= 2. the living fire
        const fl = await JP(`new Promise(res => { const set = SceneManager._scene._spriteset, holes = set.roomLightHoles(), L = holes.find(h => h.sprite._eventId === ${notes.hearthId}).sprite;
            const C = ${JSON.stringify(notes.candleIds)}.map(id => holes.find(h => h.sprite._eventId === id).sprite); const w = [], s = [], c = [], keys = new Set(), cand = [];
            let n = 0, last = -1; const iv = setInterval(() => { if (Graphics.frameCount - last < 2) return; last = Graphics.frameCount;
                w.push(L._weight); s.push(L._flicker.s); c.push(L._flicker.c); keys.add(set._darkKey); cand.push(C.map(x => +x._flicker.k.toFixed(3)).join(","));
                if (++n >= 60) { clearInterval(iv); res({ w, s, c, keys: keys.size, cand, amounts: C.map(x => x._flicker.amount), alt: !!L._altBitmap }); } }, 4); })`);
        const range = a => Math.max(...a) - Math.min(...a), distinct = a => new Set(a.map(v => v.toFixed(3))).size;
        const candDiffer = fl.cand.filter(row => new Set(row.split(",")).size > 1).length;
        check("the hearth's light flickers: its strength and reach change all the time (not a still light), within sensible bounds",
            distinct(fl.w) > 15 && range(fl.w) > 0.03 && range(fl.w) < 0.7 && distinct(fl.s) > 15 && range(fl.s) > 0.01 && Math.min(...fl.w) > 0.2, { wRange: +range(fl.w).toFixed(3), sRange: +range(fl.s).toFixed(3), distinctW: distinct(fl.w) });
        check("...its colour drifts between orange and amber (a second glow of the amber colour, mixed by a slow noise)", fl.alt && range(fl.c) > 0.02, { cRange: +range(fl.c).toFixed(3) });
        check("...the room's darkness is repainted with it (RoomLighting's key changes)", fl.keys > 10, { keys: fl.keys });
        check("the candles flicker subtly (0.06) and each on its own (their strengths differ at the same moment)", fl.amounts.every(a => a === 0.06) && candDiffer > fl.cand.length * 0.8, { candDiffer, of: fl.cand.length });

        // sparks and steam: there, and bounded (the sparks die before the top of the chimney). HomeLife.js (when registered) keeps
        // grandpa's soup steaming in the kettle (setSteam 0.55) from 8 to 22 till the hero takes it: here the soup is taken today, so
        // the kettle has only HomeAmbience's own gentle steam (at 20:30 grandpa smokes his pipe, nobody stirs) - put back afterwards
        const soupWas = await ev("window.HomeLife ? HomeLife.state().soupDay : null");
        await ev("(function(){ if (window.HomeLife) HomeLife.state().soupDay = $gameSystem.dayNightDay(); return 0; })()");
        await frames(200);   // (the thicker steam's puffs gone)
        let maxSparks = 0, maxPuffs = 0, highest = 0, spread = 0, seenSparks = 0, puffTop = 0, def = null, puffSum = 0, nS = 0;
        for (let i = 0; i < 40; i++) {
            const f = (await J("HomeAmbience.fires()"))[0];
            def = f;
            maxSparks = Math.max(maxSparks, f.sparks); maxPuffs = Math.max(maxPuffs, f.puffs); highest = Math.min(highest, f.highest); spread = Math.max(spread, f.spread);
            puffTop = Math.min(puffTop, f.puffTop); puffSum += f.puffs; nS++;
            if (f.sparks) seenSparks++;
            await frames(6);
        }
        check("sparks rise from the fire (seen almost all the time), at most 32, never higher than the chimney allows, never far sideways",
            seenSparks >= 30 && maxSparks > 0 && maxSparks <= 32 && highest >= def.fire - def.maxRise - 2 && spread <= 40, { seenSparks, maxSparks, highest, limit: def.fire - def.maxRise, spread });
        check("steam curls up from the cauldron (gentle by default), in its pool and bounds", maxPuffs > 0 && maxPuffs <= 18 && puffTop > -200 && Math.abs((await ev("HomeAmbience.steam()")) - 0.3) < 1e-6, { maxPuffs, puffTop });
        await ev("HomeAmbience.setSteam(1); 0");
        await frames(200);
        let puffSum2 = 0;
        for (let i = 0; i < 20; i++) { puffSum2 += (await J("HomeAmbience.fires()"))[0].puffs; await frames(6); }
        const steamSaved = await ev("$gameSystem._homeAmbience && $gameSystem._homeAmbience.steam");
        check("HomeAmbience.setSteam(1) (the soup cooking): more steam, kept in the save", puffSum2 / 20 > (puffSum / nS) * 1.3 && steamSaved === 1, { before: +(puffSum / nS).toFixed(1), after: +(puffSum2 / 20).toFixed(1) });
        await ev("HomeAmbience.setSteam(null); 0");
        check("...setSteam(null) goes back to the gentle default", Math.abs((await ev("HomeAmbience.steam()")) - 0.3) < 1e-6);
        await ev(`(function(){ if (window.HomeLife) HomeLife.state().soupDay = ${JSON.stringify(soupWas)}; return 0; })()`);
        await bare(true);
        await put(9, 5);
        await frames(40);
        await b.shot(path.join(SHOTS, "zycie_wieczor_ogien.png"));
        await bare(false);

        // ================= 3. the windows
        const W0 = await J("HomeAmbience.windows()");
        check("four windows found on the glass tiles (2,1) (7,1) (11,1) (16,1), each a view of about 30 x 31 px", W0.length === 4 && W0.map(w => w.x).join() === "2,7,11,16" &&
            W0.every(w => w.y === 1 && w.bbox[2] >= 20 && w.bbox[2] <= 40 && w.bbox[3] >= 20 && w.bbox[3] <= 40 && w.px > 300), W0.map(w => [w.x, w.y, w.bbox, w.px]));
        check("...the flower pots on the sills (windows 7 and 11) stay in front of the view, the other two have nothing in front",
            W0[1].occluded > 20 && W0[2].occluded > 20 && W0[0].occluded === 0 && W0[3].occluded === 0, W0.map(w => w.occluded));
        await put(9, 5);
        const sky = {};
        for (const [k, h] of [["dawn", 6.4], ["noon", 12], ["dusk", 18.5], ["night", 23]]) {
            await setTime(D.clear, h);
            await frames(14);
            sky[k] = (await J("HomeAmbience.windows()"))[3];
        }
        const lum = c => c[0] + c[1] + c[2];
        check("dawn: a pink sky over the horizon", sky.dawn.hor[0] > sky.dawn.hor[2] && sky.dawn.hor[0] > sky.dawn.hor[1] + 25, sky.dawn.hor);
        check("day: a blue sky", sky.noon.top[2] > sky.noon.top[0] + 40 && lum(sky.noon.top) > 330, sky.noon.top);
        check("dusk: an orange sky over the horizon", sky.dusk.hor[0] > sky.dusk.hor[2] + 60 && sky.dusk.hor[0] > sky.dusk.hor[1] + 20, sky.dusk.hor);
        check("night: a deep blue sky with stars", sky.night.top[2] > sky.night.top[0] + 12 && lum(sky.night.top) < 200 && sky.night.stars >= 4, { top: sky.night.top, stars: sky.night.stars });
        const tw = await JP(`new Promise(res => { const fx = HomeAmbience.fx(), w = fx.windows[3], out = []; let n = 0;
            const iv = setInterval(() => { const d = w.img.data; let s = 0; for (let k = 0; k < w.nStars; k++) { const p = w.starPos[k]; s += d[p * 4] + d[p * 4 + 1] + d[p * 4 + 2]; } out.push(s); if (++n >= 30) { clearInterval(iv); res(out); } }, 40); })`);
        check("...the stars twinkle (their brightness changes)", new Set(tw).size > 5, { values: new Set(tw).size });
        await ev("HomeAmbience.setMoon(true); 0");
        await frames(14);
        const moon = await J("HomeAmbience.windows().filter(w => w.moon).map(w => ({ x: w.x, bright: w.bright }))");
        check("the moon: some nights it crosses one of the windows (here asked for)", moon.length === 1 && moon[0].bright >= 4, moon);
        await bare(true);
        await put(9, 5);
        await frames(20);
        await b.shot(path.join(SHOTS, "zycie_noc_gwiazdy.png"));
        await bare(false);
        await ev("HomeAmbience.setMoon(null); 0");

        // rain: grey sky, streaks outside, drops running down the glass
        await setTime(D.rain[0], D.rain[1]);
        await frames(30);
        const rain = await J("HomeAmbience.windows()");
        const r3 = rain[3];
        check("rain: a grey sky, rain streaks and drops on every window", rain.every(w => w.rain >= 3 && w.drops >= 1) && Math.abs(r3.top[2] - r3.top[0]) < 45 && lum(r3.top) > 200, r3);
        const wet = await ev("HomeAmbience.fx().windows[3].wet.reduce((s, v) => s + (v > 0.05 ? 1 : 0), 0)");
        check("...the drops leave wet trails on the glass", wet > 0, { wet });
        const gain = await J("SceneManager._scene._spriteset.roomLightHoles().filter(h => h.shape === 'cone').map(h => +h.sprite._gain.toFixed(2))");
        check("...and the sun through the windows dims (RoomLighting's _gain)", gain.length === 4 && gain.every(g => g < 0.35), gain);
        await bare(true);
        await put(7, 4);
        await frames(40);
        await b.shot(path.join(SHOTS, "zycie_okno_deszcz.png"));
        await bare(false);

        // snow and winter frost
        await setTime(D.snow[0], D.snow[1]);
        await frames(30);
        const snow = await J("HomeAmbience.windows()");
        const env = await J("HomeAmbience.env()");
        check("snow: flakes drift past every window, winter frost on the panes", env.season === 3 && snow.every(w => w.flakes >= 5 && w.frost > 0 && w.rain === 0), snow.map(w => [w.flakes, w.frost]));
        await setTime(D.winter, 23);
        await frames(30);
        const frostNight = await J("HomeAmbience.windows()");
        check("...on a clear winter night the frost is thicker than at a snowy noon", frostNight.every((w, i) => w.frost > snow[i].frost) && frostNight[0].frost < frostNight[0].px * 0.8,
            { noon: snow.map(w => w.frost), night: frostNight.map(w => w.frost), px: frostNight.map(w => w.px) });
        await setTime(D.winter, 12.5);
        await frames(20);
        const fNoonClear = (await J("HomeAmbience.windows()"))[0].frost;
        // (the clock moved on without a jump - as time passing, not a sleep: the frost has to creep there)
        await ev("$gameSystem.setDayNightHour(21.5); HomeAmbience.env().lastHour = 21.5; 0");
        await frames(60);
        const fCreep = (await J("HomeAmbience.windows()"))[0].frost;
        const fTarget = await J("HomeAmbience.env()");
        check("...the frost creeps in slowly as the evening gets colder (not at once)", fCreep > fNoonClear && fTarget.frost < fTarget.frostT, { noon: fNoonClear, after60: fCreep, frost: +fTarget.frost.toFixed(3), target: fTarget.frostT });
        await setTime(D.winter, 7.6);
        await frames(20);
        await bare(true);
        await put(7, 4);
        await frames(30);
        await b.shot(path.join(SHOTS, "zycie_okno_szron.png"));
        await bare(false);

        // ================= 4. a storm: lightning flashes the windows and the room (Storm.js's strikes)
        await setTime(D.clear, 18);
        await ev("Survival.forceStorm(3); $gameSystem.setDayNightHour(18.95); 0");
        await frames(40);
        const lvl = await ev("Storm.level()");
        const s0 = await J("({ storm: Storm.state.strikes, own: HomeAmbience.fx().strikes || 0 })");
        await ev("Graphics._app.ticker.stop(); Storm.strike(0.1); for (let k = 0; k < 2; k++) SceneManager.updateMain(); Graphics._app.render(); 0");
        const fl1 = await J("({ flash: HomeAmbience.fx().flash, alpha: HomeAmbience.fx().flashSprite.alpha, win: HomeAmbience.windows()[3].top, storm: Storm.state.strikes, own: HomeAmbience.fx().strikes })");
        await bare(true);
        await ev("(function(){ for (let k = 0; k < 1; k++) SceneManager.updateMain(); Graphics._app.render(); return 0; })()");
        await b.shot(path.join(SHOTS, "zycie_burza_blysk.png"));
        await bare(false);
        await ev("Graphics._app.ticker.start(); 0");
        check("a storm is raging (Storm.level)", lvl > 0.5, { lvl });
        check("a lightning strike (Storm.js counts it under the roof too) flashes the windows white and the whole room", fl1.storm === s0.storm + 1 && fl1.own === s0.own + 1 && fl1.flash > 0.5 && fl1.alpha > 0.1 && lum(fl1.win) > 540, fl1);
        await frames(60);
        const fl2 = await J("({ flash: HomeAmbience.fx().flash, alpha: HomeAmbience.fx().flashSprite.alpha })");
        check("...and it is over in a moment", fl2.flash < 0.02 && fl2.alpha < 0.01, fl2);
        const bedsStorm = await J("HomeAmbience.beds()");
        const bed = (list, k) => list.find(x => x.key === k);
        check("the storm's wind howls round the house (a bed of its own, quiet: the file is loud), the rain's drips too", bed(bedsStorm, "wind").playing && bed(bedsStorm, "wind").vol > 1 && bed(bedsStorm, "wind").vol <= 3.6 && bed(bedsStorm, "drips").playing, bedsStorm);
        await ev("$gameSystem._stormForce = null; 0");

        // ================= 5. the grade, only in the house
        await setTime(D.clear, 9);
        await frames(20);
        const gMorning = await J("(function(){ const fx = HomeAmbience.fx(); return { mul: fx.gradeMul.visible && fx.gradeMul.blendMode === PIXI.BLEND_MODES.MULTIPLY, vig: fx.vignette.alpha, wash: fx.gradeWash.alpha, scale: fx.screenLayer.scale.x, zoom: SceneManager._scene._spriteset.scale.x, under: SceneManager._scene._spriteset.children.indexOf(fx.screenLayer) < SceneManager._scene._spriteset.children.indexOf(SceneManager._scene._spriteset._pictureContainer) }; })()");
        await bare(true);
        await put(9, 5);
        await setTime(D.clear, 8.5);
        await frames(90);
        await b.shot(path.join(SHOTS, "zycie_ranek_kurz.png"));
        const motes = await J("(function(){ const fx = HomeAmbience.fx(); return { shown: fx.motes.filter(m => m.spr.visible && m.spr.alpha > 0.05).length, all: fx.motes.length, overGlass: fx.motes.filter(m => m.spr.visible && fx.windows.some(w => m.spr.x >= w.sprite.x && m.spr.x < w.sprite.x + w.bw && m.spr.y >= w.sprite.y && m.spr.y < w.sprite.y + w.bh)).length }; })()");
        await bare(false);
        check("dust drifts in the morning sun shafts (a few specks per shaft, never over the window's view)", motes.all === 56 && motes.shown >= 12 && motes.overGlass === 0, motes);
        await setTime(D.clear, 20.5);
        await frames(20);
        const gEvening = await J("(function(){ const fx = HomeAmbience.fx(); return { vig: fx.vignette.alpha, wash: fx.gradeWash.alpha }; })()");
        check("the warm grade (a multiply tint, a warm wash, a vignette) is on in the house, over the lighting and under the pictures and the HUD, screen-sized",
            gMorning.mul && gMorning.under && Math.abs(gMorning.scale - 1 / gMorning.zoom) < 0.01, gMorning);   // (the map's own zoom: <Zoom:1> since 2026-09-28, 1.5 before)
        check("...stronger in the evening", gEvening.vig > gMorning.vig && gEvening.wash > gMorning.wash, { morning: gMorning, evening: gEvening });

        // ================= 6. sounds
        await put(9, 5);
        await frames(120);
        const bNear = await J("HomeAmbience.beds()");
        await put(2, 10);
        await frames(120);
        const bFar = await J("HomeAmbience.beds()");
        check("by the hearth the fire crackles (Fire1), across the room quieter and from the right", bed(bNear, "fire").playing && bed(bNear, "fire").vol > 12 && bed(bFar, "fire").playing &&
            bed(bFar, "fire").vol < bed(bNear, "fire").vol * 0.6 && bed(bFar, "fire").pan > 0.1, { near: bed(bNear, "fire"), far: bed(bFar, "fire") });
        check("...no clock in this house: no ticking; nothing louder than Atmosphere's bed (22)", !bed(bNear, "clock").playing && bNear.every(x => x.vol <= 22));
        await setTime(D.rain[0], D.rain[1]);
        await frames(150);
        const bRain = await J("HomeAmbience.beds()");
        const atmo = await J("({ bed: Atmosphere.state.bed, want: Atmosphere.desiredBed() })");
        check("rain: Atmosphere.js plays the rain on the roof, this adds only the drips (no second rain)", bed(bRain, "drips").playing && !bed(bRain, "rain").playing &&
            ((atmo.bed && /^Rain/.test(atmo.bed.name)) || (atmo.want && /^Rain/.test(atmo.want.name))), { drips: bed(bRain, "drips"), rain: bed(bRain, "rain"), atmo });
        // out of the house and back
        const out = await go(20, 15, 8);
        await frames(150);
        const bOut = await J("HomeAmbience.beds()");
        const outFx = await J("({ fx: !!HomeAmbience.fx(), active: HomeAmbience.isActive(), home: !!SceneManager._scene._spriteset._home })");
        check("out in the yard (Map020): no house layer, no grade", out && !outFx.fx && !outFx.active && !outFx.home, outFx);
        check("...and the house's sounds have stopped", bOut.every(x => !x.playing), bOut.filter(x => x.playing));
        const back = await go(19, 9, 11);
        await frames(120);
        const bBack = await J("HomeAmbience.beds()");
        check("back in the house: the layer and the fire's crackle again", back && (await ev("!!HomeAmbience.fx()")) && bed(bBack, "fire").playing && bed(bBack, "fire").vol > 1, bed(bBack, "fire"));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.slice(logsFrom).filter(l => /EXC|rror/.test(l));
    check("no errors in the console", !err.length, err.slice(-6));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
