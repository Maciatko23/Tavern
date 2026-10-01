// Trees throw shadows that follow the sun (user 2026-09-30, "na razie tylko dla drzew"): long to the left in the morning, short
// and down at noon, long to the right in the evening; none at night, a pale trace in the rain, fading under a passing cloud and
// with a felled tree. Also measures what the shadows cost a frame (update + render, CPU side). CDP_PORT=9434 by default.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "cienie");

kit.test({ port: 9434, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12, quiet: true, minimap: false });
    // a standing choppable tree in the middle of the screen, and the view on it
    const tree = await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character instanceof Game_Event && o.isTreeSprite && o.isTreeSprite() && !o._character._treeGone && o._character.y > 6 && o._character.x > 6 && o._character.x < $gameMap.width() - 6);
        return s ? { id: s._character.eventId(), x: s._character.x, y: s._character.y, pic: s._characterName } : null; })()`);
    t.check("a standing choppable tree on Map003", !!tree, tree);
    await t.eval(`(function(){ $gamePlayer.locate(${tree.x} + 3, ${tree.y} + 2); $gameMap.setDisplayPos(${tree.x} - 13, ${tree.y} - 9); return 0; })()`);
    const at = async hour => {
        await t.setHour(hour); await t.frames(8);
        return t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(${tree.id})), sh = s._treeShadow;
            if (!sh) return { none: true }; const m = sh._matrix, ph = s.patternHeight(), h = sh.bitmap._footRow + 1;
            // where the shadow starts vs the foot of the trunk on the screen (its lowest row, the middle of it)
            const footX = s.x + sh.bitmap._footX - s.patternWidth() / 2, footY = s.y - (ph - h);
            return { visible: sh.visible, alpha: +sh.alpha.toFixed(3), tipX: +(-m.c * h).toFixed(1), tipY: +(-m.d * h).toFixed(1), z: sh.parent ? sh.parent.z : null,
                startDx: +(m.tx - footX).toFixed(1), startDy: +(m.ty - footY).toFixed(1) }; })()`);
    };
    const noon = await at(12), morning = await at(7.5), evening = await at(18.5), night = await at(23);
    t.check("at noon the shadow is short and falls down, under the tree", noon.visible && noon.tipY > 0 && Math.abs(noon.tipX) < noon.tipY, noon);
    t.check("it comes straight out of the foot of the trunk (starts a few px inside it, where the tree hides its soft start), at any hour",
        [noon, morning, evening].every(r => Math.abs(r.startDx) < 0.01 && r.startDy <= 0 && r.startDy >= -6), [noon, morning, evening].map(r => [r.startDx, r.startDy]));
    t.check("in the morning it is long, to the left", morning.visible && morning.tipX < 0 && Math.abs(morning.tipX) > Math.hypot(noon.tipX, noon.tipY), morning);
    t.check("in the evening it is long, to the right", evening.visible && evening.tipX > 0 && Math.abs(evening.tipX) > Math.hypot(noon.tipX, noon.tipY), evening);
    t.check("at night there is none", !night.visible, night);
    t.check("it lies in the sun's shadow layer: under the characters (z below 3) and over the things on the ground (above 1.5)", noon.z > 1.5 && noon.z < 3, noon.z);

    // the rain: only a pale trace (the sun's light itself)
    await t.setHour(12); await t.frames(4);
    const rainNoon = await t.json(`(function(){ const S = Tawerna.api("Sun"); const wt = $gameScreen.weatherType, wp = $gameScreen.weatherPower;
        $gameScreen.weatherType = () => "rain"; $gameScreen.weatherPower = () => 5; const f = Graphics.frameCount; Graphics.frameCount++; const wet = S.now().light; Graphics.frameCount = f;
        $gameScreen.weatherType = wt; $gameScreen.weatherPower = wp; return { clear: +S.now().light.toFixed(3), wet: +wet.toFixed(3) }; })()`);
    t.check("in heavy rain the sun leaves only a pale trace (a fifth of its light)", rainNoon.wet > 0 && rainNoon.wet <= rainNoon.clear * 0.25, rainNoon);

    // a passing cloud: its middle covers the spot
    const cloud = await t.json(`(function(){ const R = Tawerna.api("ChoppableTree_parts").render, set = SceneManager._scene._spriteset, all = set._cloudSprites || [], c = all[0];
        if (!c) return null; set._cloudSprites = [c];   // (just this one cloud: the others drift anywhere)
        const out = { mid: +R.cloudCover(c._wx, c._wy).toFixed(2), far: +R.cloudCover(c._wx + c._radius * 3, c._wy).toFixed(2) }; set._cloudSprites = all; return out; })()`);
    t.check("a cloud's shadow covers the ground under its middle (the tree's shadow fades there), not far from it", !cloud || (cloud.mid > 0.5 && cloud.far === 0), cloud);

    // a felled tree: its shadow goes with it
    const gone = await t.json(`(function(){ const e = $gameMap.event(${tree.id}); e._treeGone = true; return 0; })()`);
    await t.frames(4);
    const goneShadow = await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(${tree.id})); const v = !!(s._treeShadow && s._treeShadow.visible); $gameMap.event(${tree.id})._treeGone = false; return v; })()`);
    t.check("a felled tree throws no shadow", goneShadow === false, { gone, goneShadow });

    // pictures
    for (const [hour, name] of [[7.5, "rano"], [12, "poludnie"], [18.5, "wieczor"]]) {
        await t.setHour(hour); await t.frames(20);
        await t.shot(path.join(SHOTS, "drzewa_" + name + ".png"));
    }

    // the cost: CPU time of a frame (update + render) with the tree shadows and without, the same view at noon
    await t.setHour(12); await t.frames(20);
    const cost = await t.eval(`new Promise(res => {
        const S = Tawerna.api("Sun"), app = Graphics._app, times = [];
        const um = SceneManager.updateMain, rr = app.render;
        let cur = 0;
        SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); cur += performance.now() - a; };
        app.render = function() { const a = performance.now(); rr.apply(this, arguments); cur += performance.now() - a; times.push(cur); cur = 0; };
        const measure = (on, n) => new Promise(done => { S.shadows = on; const from = times.length + 30; const iv = setInterval(() => { if (times.length >= from + n) { clearInterval(iv); const x = times.slice(from, from + n).sort((p, q) => p - q); done(x[Math.floor(n / 2)]); } }, 20); });
        (async () => {
            const offA = await measure(false, 240), onA = await measure(true, 240), offB = await measure(false, 240), onB = await measure(true, 240);
            SceneManager.updateMain = um; app.render = rr; S.shadows = true;
            const trees = SceneManager._scene._spriteset._characterSprites.filter(s => s._treeShadow && s._treeShadow.visible).length;
            res(JSON.stringify({ off: +((offA + offB) / 2).toFixed(3), on: +((onA + onB) / 2).toFixed(3), shadowsOnScreen: trees }));
        })();
    })`);
    const c = JSON.parse(cost);
    console.log("   frame cost (median ms, CPU side: update + render):", c);
    t.check("the shadows cost little: under 1 ms more per frame (" + c.shadowsOnScreen + " tree shadows on the screen)", c.shadowsOnScreen > 0 && c.on - c.off < 1, c);
});
