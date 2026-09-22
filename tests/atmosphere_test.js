// Atmosphere: profiles, ambient beds, footsteps (rendered offline and analysed), birds, time-of-day music, autosave after sleeping.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(2500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setStamina(80); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        await frames(30);

        // ------------------------------------------------ places
        check("the meadow (Map003) is 'outdoor'", (await ev("Atmosphere.profileOf()")) === "outdoor");
        const profiles = await ev(`(function(){ const out = {}; const orig = $dataMap; for (const id of [1, 2, 9]) { /* look at the map notes and tilesets directly */ } return null; })()`);
        // the other maps: ask the plugin with a temporary $dataMap / $gameMap swap
        const otherProfiles = await ev(`(async function(){ const out = {};
            for (const id of [1, 2, 9]) { const data = await new Promise(res => { const xhr = new XMLHttpRequest(); xhr.open("GET", "data/Map" + String(id).padStart(3, "0") + ".json"); xhr.onload = () => res(JSON.parse(xhr.responseText)); xhr.send(); });
                const savedData = $dataMap, savedId = $gameMap.mapId, savedTs = $gameMap.tileset, savedTsId = $gameMap.tilesetId;
                $dataMap = data; $gameMap.mapId = () => id; $gameMap.tileset = () => $dataTilesets[data.tilesetId]; $gameMap.tilesetId = () => data.tilesetId;
                out[id] = Atmosphere.profileOf();
                $dataMap = savedData; $gameMap.mapId = savedId; $gameMap.tileset = savedTs; $gameMap.tilesetId = savedTsId; }
            return out; })()`);
        check("the tavern is 'tavern', the cabin 'interior', the cellar 'cave'", otherProfiles[1] === "tavern" && otherProfiles[2] === "interior" && otherProfiles[9] === "cave", otherProfiles);

        // ------------------------------------------------ the ambient bed follows time and weather
        const bed = async (hour, extra) => ev(`(function(){ $gameSystem.setDayNightHour(${hour}); ${extra || ""} return Atmosphere.desiredBed(); })()`);
        // a dry day (the daily weather plan rains on some days) and a spot far from the pond
        const dry = await ev("(function(){ for (let d = 1; d < 30; d++) if (!Survival.weatherPlan(d)) return d; return 1; })()");
        await ev(`$gameSystem._dayNightDay = ${dry}; $gamePlayer.locate(10, 13); $gameScreen.changeWeather('none', 0, 0); 0`);
        let d = await bed(12);
        check("midday, clear: a light wind", d && /^Wind[24]$/.test(d.name) && d.volume <= 30, d);
        d = await bed(22);
        check("at night: the night bed (crickets)", d && d.name === "Night", d);
        await ev("$gameScreen.changeWeather('rain', 3, 0); 0");
        d = await bed(12);
        check("light rain: Rain2", d && d.name === "Rain2", d);
        await ev("$gameScreen.changeWeather('rain', 5, 0); 0");
        d = await bed(22);
        check("downpour at night: Rain4 beats the night", d && d.name === "Rain4", d);
        await ev("$gameScreen.changeWeather('snow', 4, 0); 0");
        d = await bed(12);
        check("snow: Wind5", d && d.name === "Wind5", d);
        await ev("$gameScreen.changeWeather('none', 0, 0); 0");
        // beside the pond
        const pond = await ev(`(function(){ for (let y = 2; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 2; x++) if (Farming.isWaterTile(x, y) && Farming.isWaterTile(x + 1, y) && Farming.isWaterTile(x, y + 1) && Farming.isWaterTile(x - 1, y) && Farming.isWaterTile(x, y - 1)) return { x, y }; return null; })()`);
        await ev(`$gamePlayer.locate(${pond.x - 3}, ${pond.y}); 0`);
        d = await bed(12);
        check("next to water by day: the river bed", d && d.name === "River", d);
        await ev("$gamePlayer.locate(10, 13); 0");

        // ------------------------------------------------ the live bed: BGS really plays and changes with a fade
        const watch = async (n) => { const seen = []; for (let i = 0; i < n; i += 10) { await frames(10); const name = await ev("AudioManager._currentBgs ? AudioManager._currentBgs.name : null"); if (seen[seen.length - 1] !== name) seen.push(name); } return seen; };
        await ev("$gameSystem.setDayNightHour(12); 0");
        let seen = await watch(260);
        check("the map ends up playing a light wind (BGS)", /^Wind[24]$/.test(seen[seen.length - 1]), seen);
        await ev("$gameSystem.setDayNightHour(22); 0");
        seen = await watch(300);
        check("after nightfall the bed changes to 'Night' through a fade out (silence in between)", seen[seen.length - 1] === "Night" && seen.includes(null), seen);

        // ------------------------------------------------ music follows the hour on the meadow
        await ev("$gameSystem.setDayNightHour(12); 0");
        await frames(400);
        let bgm = await ev("AudioManager._currentBgm && AudioManager._currentBgm.name");
        check("day: Field1", bgm === "Field1", bgm);
        await ev("$gameSystem.setDayNightHour(18.5); 0");
        await frames(400);
        bgm = await ev("AudioManager._currentBgm && AudioManager._currentBgm.name");
        check("dusk: Field2", bgm === "Field2", bgm);
        await ev("$gameSystem.setDayNightHour(23); 0");
        await frames(400);
        bgm = await ev("AudioManager._currentBgm && AudioManager._currentBgm.name");
        check("night: Theme6", bgm === "Theme6", bgm);
        const vol = await ev("AudioManager._currentBgm.volume");
        check("the night music is quiet (volume <= 50)", vol <= 50, vol);
        // an event's own music is left alone
        await ev("AudioManager.playBgm({ name: 'Battle1', volume: 60, pitch: 100, pan: 0 }); 0");
        await ev("$gameSystem.setDayNightHour(12); 0");
        await frames(400);
        bgm = await ev("AudioManager._currentBgm && AudioManager._currentBgm.name");
        check("music started by an event (Battle1) is not replaced", bgm === "Battle1", bgm);
        await ev("AudioManager.stopBgm(); 0");

        // ------------------------------------------------ the ground
        const kinds = await ev(`(function(){ const out = {}; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { if (!$gameMap.isPassable(x, y, 2)) continue; const k = Atmosphere.groundKindAt(x, y); out[k] = (out[k] || 0) + 1; } return out; })()`);
        console.log("ground kinds on the meadow:", JSON.stringify(kinds));
        check("the meadow is mostly grass with paths of earth (and a little else)", kinds.grass > 100 && kinds.earth > 20, kinds);
        // winter turns grass and earth into snow
        await ev("$gameSystem._dayNightDay = 90; 0");
        const winter = await ev(`(function(){ let snow = 0, other = 0; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) { if (!$gameMap.isPassable(x, y, 2)) continue; const k = Atmosphere.groundKindAt(x, y); if (k === "snow") snow++; else if (k === "grass" || k === "earth") other++; } return { snow, other }; })()`);
        check("in winter grass and earth sound like snow", winter.snow > 100 && winter.other === 0, winter);
        await ev(`$gameSystem._dayNightDay = ${dry}; 0`);
        // a tilled field is soft
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; P["25,17"] = { s: "tilled" }; f.rev++; })()`);
        check("tilled soil: 'soil'", (await ev("Atmosphere.groundKindAt(25, 17)")) === "soil");
        // colours to kinds
        const ck = await ev(`[[80,140,60],[150,120,80],[130,130,135],[200,120,60],[240,240,250]].map(c => Atmosphere.kindFromColour({ r: c[0], g: c[1], b: c[2] }, false)).concat([Atmosphere.kindFromColour({ r: 190, g: 110, b: 50 }, true)])`);
        check("colour -> ground: green grass, brown earth, grey stone, sandy sand, white snow, orange planks indoors", ck.join() === "grass,earth,stone,sand,snow,wood", ck);

        // ------------------------------------------------ the footsteps sound (rendered offline and measured)
        const steps = await ev(`(async function(){ const out = {}; const fft = (re, im) => { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } } for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr; re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } };
            for (const kind of Object.keys(Atmosphere.STEP)) { const sr = 44100, oc = new OfflineAudioContext(1, sr * 0.7, sr); Atmosphere.footstep(oc, oc.destination, 0.02, kind, 1, false); const buf = await oc.startRendering(); const ch = buf.getChannelData(0);
                let peak = 0, sum = 0; for (let i = 0; i < ch.length; i++) { peak = Math.max(peak, Math.abs(ch[i])); sum += ch[i] * ch[i]; }
                // when does the sound die away (last sample above 3% of the peak)
                let last = 0; for (let i = 0; i < ch.length; i++) if (Math.abs(ch[i]) > peak * 0.03) last = i;
                const N = 4096, re = new Float64Array(N), im = new Float64Array(N); const start = Math.floor(sr * 0.02); for (let i = 0; i < N; i++) re[i] = (ch[start + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); fft(re, im);
                let m = 0, mw = 0; for (let k = 1; k < N / 2; k++) { const mag = Math.hypot(re[k], im[k]); m += mag; mw += mag * k * sr / N; }
                out[kind] = { peak: +peak.toFixed(2), rmsDb: +(10 * Math.log10(sum / ch.length + 1e-12)).toFixed(1), endMs: Math.round((last / sr - 0.02) * 1000), centroid: Math.round(mw / m) }; }
            return out; })()`);
        console.log("footstep analysis:", JSON.stringify(steps));
        const kindsOk = Object.keys(steps).length === 8;
        check("eight kinds of footsteps exist", kindsOk, Object.keys(steps));
        check("every step is audible but not clipping (peak 0.05 .. 1.0)", Object.values(steps).every(s => s.peak > 0.05 && s.peak <= 1.0), Object.fromEntries(Object.entries(steps).map(([k, s]) => [k, s.peak])));
        check("and short: each dies away within 0.6 s", Object.values(steps).every(s => s.endMs < 600), Object.fromEntries(Object.entries(steps).map(([k, s]) => [k, s.endMs])));
        check("stone is brighter than grass, wood and soil (spectral centroid)", steps.stone.centroid > steps.grass.centroid && steps.stone.centroid > steps.wood.centroid && steps.stone.centroid > steps.soil.centroid, { stone: steps.stone.centroid, grass: steps.grass.centroid, wood: steps.wood.centroid, soil: steps.soil.centroid });
        check("soil is the dullest, and snow / sand are hissy (bright)", steps.soil.centroid < steps.earth.centroid && steps.snow.centroid > steps.grass.centroid && steps.sand.centroid > steps.grass.centroid, { soil: steps.soil.centroid, earth: steps.earth.centroid, snow: steps.snow.centroid, sand: steps.sand.centroid });

        // ------------------------------------------------ walking makes steps, standing still does not
        await ev(`$gameSystem._dayNightDay = ${dry}; $gameSystem.setDayNightHour(12); Atmosphere.state.steps = 0; 0`);
        await ev("Atmosphere.state.lastX = $gamePlayer._realX; Atmosphere.state.lastY = $gamePlayer._realY; 0");
        await frames(20);
        const idle = await ev("Atmosphere.state.steps || 0");
        const lane = await ev(`(function(){ for (let y = 3; y < $gameMap.height() - 3; y++) for (let x = 2; x < $gameMap.width() - 12; x++) { let ok = true; for (let i = 0; i < 10 && ok; i++) if (!$gameMap.isPassable(x + i, y, 6) || $gameMap.eventsXy(x + i, y).length > 0 || Farming.isWaterTile(x + i, y)) ok = false; if (ok) return { x, y }; } return null; })()`);
        await ev(`$gamePlayer.locate(${lane.x}, ${lane.y}); Atmosphere.state.lastX = $gamePlayer._realX; Atmosphere.state.lastY = $gamePlayer._realY; Atmosphere.state.stepAcc = 0; Atmosphere.state.steps = 0; 0`);
        await frames(4);
        await ev("Input._currentState.right = true; 0");
        await frames(100);
        await ev("Input._currentState.right = false; 0");
        await frames(10);
        const walked = await ev("({ steps: Atmosphere.state.steps || 0, kind: Atmosphere.state.lastKind, moved: $gamePlayer._realX })");
        console.log("walk:", JSON.stringify(walked), "idle steps:", idle);
        check("standing still: no steps", idle === 0, idle);
        check("walking right for ~100 frames makes several steps (about one per tile)", walked.steps >= 3 && walked.steps <= 12, walked);

        // ------------------------------------------------ the birds
        const bird = await ev(`(async function(){ const out = {}; for (const kind of ["tsit", "trill", "whistle", "owl"]) { const sr = 44100, oc = new OfflineAudioContext(1, sr * 1.5, sr); Atmosphere.birdCall(oc, oc.destination, 0.02, kind, 0); const buf = await oc.startRendering(); const ch = buf.getChannelData(0); let peak = 0, sum = 0; for (let i = 0; i < ch.length; i++) { peak = Math.max(peak, Math.abs(ch[i])); sum += ch[i] * ch[i]; } out[kind] = { peak: +peak.toFixed(2), rmsDb: +(10 * Math.log10(sum / ch.length + 1e-12)).toFixed(1) }; } return out; })()`);
        check("the bird calls and the owl are audible", Object.values(bird).every(x => x.peak > 0.02 && x.peak <= 1), bird);

        // ------------------------------------------------ autosave after sleeping
        const before = await ev("DataManager.savefileInfo(0) ? DataManager.savefileInfo(0).timestamp : 0");
        await ev("$gameSystem.setDayNightHour(22); $gameSystem.sleepUntilHour(7); 0");
        check("sleeping in a bed asks for an autosave", (await ev("!!$gameTemp._atmoAutosave")) === true);
        await frames(120);
        check("the request is done (cleared)", (await ev("!!$gameTemp._atmoAutosave")) === false);
        await frames(60);
        const after = await ev("DataManager.savefileExists(0)");
        check("slot 0 (Autozapis) exists after it", after === true, after);
        // resting on a bench (1 hour) does not save, a bedroll (5 hours) does
        await ev("Atmosphere.afterRest({ restHours: 1 }); 0");
        check("a one hour rest does not", !(await ev("!!$gameTemp._atmoAutosave")));
        await ev("Atmosphere.afterRest({ restHours: 5 }); 0");
        check("a night on the bedroll (5 h) does", !!(await ev("!!$gameTemp._atmoAutosave")));
    } catch (e) { console.log("ERR", e.message); }
    console.log("console errors:", b.logs.filter(l => /EXC|rror/.test(l)).slice(-4));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
