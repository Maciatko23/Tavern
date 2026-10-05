// The golden hour's sun rays and the morning mist (user 2026-10-01: "1 i 3"): shafts of warm light slanting in from the sun's side
// (from the upper right in the morning, the upper left in the evening), none at noon, in the rain or indoors; mist banks at dawn,
// thickest at sunrise, gone in the morning, never in the evening, not every morning (thicker after rain), drifting with the air; the
// F9 rows (dawn, sunset, a misty morning); what it costs a frame. CDP_PORT=9451.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "niebo");

kit.test({ port: 9451, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 34, y: 9, day: 1, hour: 12, quiet: true, minimap: false });   // (spring: sunrise 5:30, sunset 20:30)
    await t.eval(`(function(){ $gamePlayer.center(34, 9); Sky.forceMist(1, 1); return 0; })()`);
    const at = async h => { await t.setHour(h); await t.frames(8);
        return t.json(`(function(){ const s = SceneManager._scene._spriteset, fx = s._skyFx || {}, ray = s._rayLayer.children.find(c => c.visible), mist = s._mistLayer.children.find(c => c.visible);
            return { h: ${h}, rays: +(fx.rays || 0).toFixed(2), mist: +(fx.mist || 0).toFixed(2), rayLayer: s._rayLayer.visible, mistLayer: s._mistLayer.visible,
                tilt: ray ? +ray.rotation.toFixed(2) : null, rayAlpha: ray ? +ray.alpha.toFixed(3) : 0, mistX: mist ? mist._mist.wx : null }; })()`); };
    const blue = await at(5.0), sunrise = await at(5.9), later = await at(8.5), noon = await at(12), evening = await at(20.0);
    t.check("the blue hour: mist gathering, no rays yet (the sun below the horizon)", blue.mist > 0.3 && blue.rays === 0 && blue.mistLayer && !blue.rayLayer, blue);
    t.check("just after sunrise: thick mist and the rays, slanting from the upper right (the sun in the east)", sunrise.mist > 0.8 && sunrise.rays > 0.8 && sunrise.tilt > 0.4 && sunrise.rayAlpha > 0, sunrise);
    t.check("by 8:30 the mist is gone and the rays fade", later.mist === 0 && later.rays < 0.05, later);
    t.check("at noon neither", noon.rays === 0 && noon.mist === 0 && !noon.rayLayer && !noon.mistLayer, noon);
    t.check("in the evening the rays slant from the upper left, and there is no mist", evening.rays > 0.8 && evening.tilt < -0.4 && evening.mist === 0, evening);
    await t.setHour(20.0); await t.frames(10); await t.shot(path.join(SHOTS, "promienie_wieczor.png"));
    await t.setHour(5.4); await t.frames(10); await t.shot(path.join(SHOTS, "mgla_swit.png"));
    await t.setHour(5.9); await t.frames(10); await t.shot(path.join(SHOTS, "mgla_i_promienie.png"));
    // the mist drifts
    const x0 = (await at(5.9)).mistX; await t.frames(60); const x1 = (await t.json(`SceneManager._scene._spriteset._mistLayer.children[0]._mist.wx`));
    t.check("the mist drifts slowly with the air", x1 !== x0, { x0, x1 });
    // not every morning; after a wet evening thicker
    const days = await t.json(`(function(){ const out = []; for (let d = 2; d <= 60; d++) out.push(+Sky.mistOfDay(d).toFixed(2)); return out; })()`);
    const clear = days.filter(m => m === 0).length, thick = days.filter(m => m > 0.6).length;
    t.check("not every morning is misty: some clear, some thick (days 2-60)", clear >= 5 && thick >= 5, { clear, thick, n: days.length });
    const wet = await t.json(`(function(){ let d = null; for (let k = 2; k < 120 && d === null; k++) { const y = Survival.weatherPlan(k - 1); if (y && y.end >= 17 && !($gameSystem._mistForce && $gameSystem._mistForce.day === k)) d = k; } return d === null ? null : { d, m: +Sky.mistOfDay(d).toFixed(2) }; })()`);
    t.check("after a wet evening the morning is misty", !!wet && wet.m >= 0.45, wet);
    // in the rain: no rays
    await t.setHour(6);
    await t.eval(`(function(){ $gameScreen.changeWeather("rain", 5, 1); return 0; })()`);
    await t.frames(40);
    const rain = await t.json(`(function(){ const fx = SceneManager._scene._spriteset._skyFx; return { rays: +fx.rays.toFixed(2), mist: +fx.mist.toFixed(2) }; })()`);
    t.check("in heavy rain no rays (the mist only half)", rain.rays === 0 && rain.mist < 0.6, rain);
    await t.eval(`(function(){ $gameScreen.changeWeather("none", 0, 1); return 0; })()`);
    await t.frames(10);
    // the cost of the two layers a frame
    const cost = JSON.parse(await t.eval(`new Promise(res => { const s = SceneManager._scene._spriteset, up = s.updateSkyFx, times = [];
        s.updateSkyFx = function() { const a = performance.now(); up.apply(this, arguments); times.push(performance.now() - a); };
        const iv = setInterval(() => { if (times.length >= 120) { clearInterval(iv); s.updateSkyFx = up; const x = times.slice(10).sort((p, q) => p - q); res(JSON.stringify({ median: +x[Math.floor(x.length / 2)].toFixed(3) })); } }, 20); })`));
    console.log("   the rays and the mist (median ms a frame):", cost);
    t.check("they cost little (under 0.5 ms a frame)", cost.median < 0.5, cost);
    // F9: the dawn row sets the clock just before sunrise
    await t.eval(`(function(){ SceneManager.push(Scene_Debug); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Debug && !SceneManager.isSceneChanging()", 20);
    await t.eval(`(function(){ const s = SceneManager._scene; s.goTo(0, 0); const l = s._list, i = l._rows.findIndex(r => r.kind === "dawn"); l.select(i); s.onOk(); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20);
    const dawn = await t.json(`(function(){ const tt = Sky.sunTimes($gameSystem.dayNightDay()); return { hour: +$gameSystem.dayNightHour().toFixed(2), rise: +tt.rise.toFixed(2) }; })()`);
    t.check("F9 'Godzina: świt' sets the clock a little before sunrise", dawn.hour < dawn.rise && dawn.rise - dawn.hour < 0.8, dawn);
    // indoors: neither (the map back from the menu settled first: a new game started while it is still being made broke it)
    await t.frames(30);
    await t.newGame({ story: true, skipIntro: true, day: 1, hour: 5.9, quiet: true, minimap: false });
    await t.frames(20);
    const inside = await t.json(`(function(){ const fx = SceneManager._scene._spriteset._skyFx || { rays: 0, mist: 0 }; return { map: $gameMap.mapId(), rays: fx.rays, mist: fx.mist }; })()`);
    t.check("in grandpa's house: no rays, no mist", inside.map === 19 && inside.rays === 0 && inside.mist === 0, inside);
});
