// People throw the sun's shadow too (user 2026-09-30, "najpierw 1"): their own silhouette from the feet - long to the left in the
// morning, short and down at noon, long to the right in the evening, none at night and under a roof (the soft spot under the feet
// stays); it walks with the steps and swings with a blow (the swing sheet's frame). All the sun's shadows share one layer made
// see-through together (overlapping shadows are not darker twice). CDP_PORT=9436 by default.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "cienie");

kit.test({ port: 9436, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12, quiet: true, minimap: false });
    // an open spot: a passable tile with no event within 2 tiles
    const spot = await t.json(`(function(){ for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 6; x < $gameMap.width() - 6; x++) {
            let ok = $gameMap.isPassable(x, y, 2) && $gameMap.isPassable(x + 1, y, 6) && $gameMap.isPassable(x + 2, y, 6);
            for (let yy = y - 2; yy <= y + 2 && ok; yy++) for (let xx = x - 2; xx <= x + 4; xx++) if ($gameMap.eventsXy(xx, yy).length) { ok = false; break; }
            if (ok) return { x, y }; } return null; })()`);
    t.check("an open spot on Map003", !!spot, spot);
    await t.eval(`(function(){ $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${spot.x} - 13, ${spot.y} - 7); return 0; })()`);
    const hero = `SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer)`;
    const info = () => t.json(`(function(){ const s = ${hero}, sh = s._sunShadow, g = s._groundShadow;
        if (!sh) return { none: true, ground: !!(g && g.visible) }; const m = sh._matrix, h = sh.bitmap ? sh.bitmap._footRow + 1 : 0, layer = sh.parent;
        return { visible: sh.visible, ground: !!(g && g.visible), tipX: +(-m.c * h).toFixed(1), tipY: +(-m.d * h).toFixed(1), startY: +(m.ty - s.y).toFixed(1), key: sh.bitmap ? sh.bitmap._key : "",
            alpha: +sh.alpha.toFixed(3), layerZ: layer ? layer.z : null, layerAlpha: layer && layer._shadowFilter ? +layer._shadowAlpha.toFixed(3) : null, light: +Tawerna.api("Sun").now().light.toFixed(3) }; })()`);
    const at = async hour => { await t.setHour(hour); await t.frames(8); return info(); };
    const noon = await at(12), morning = await at(7.5), evening = await at(18.5), night = await at(23);
    t.check("at noon the hero's shadow is short and falls down from his feet", noon.visible && noon.tipY > 0 && Math.abs(noon.tipX) < noon.tipY && noon.startY <= 0 && noon.startY > -12, noon);
    t.check("in the morning it is long, to the left", morning.visible && morning.tipX < 0 && Math.abs(morning.tipX) > Math.hypot(noon.tipX, noon.tipY), morning);
    t.check("in the evening it is long, to the right", evening.visible && evening.tipX > 0 && Math.abs(evening.tipX) > Math.hypot(noon.tipX, noon.tipY), evening);
    t.check("at night there is none - the soft spot under the feet stays", !night.visible && night.ground, night);
    // (its own alpha: 1, or less only under a passing cloud)
    await t.setHour(12); await t.frames(4);
    const shared = await t.json(`(function(){ const s = ${hero}, layer = s._sunShadow && s._sunShadow.parent;
        const tree = SceneManager._scene._spriteset._characterSprites.find(o => o._treeShadow && o._treeShadow.visible);
        const cloud = Tawerna.api("Sun").cloudCover(($gamePlayer._realX + 0.5) * 48, ($gamePlayer._realY + 1) * 48);
        return { sameLayer: !!tree && tree._treeShadow.parent === layer, expected: +(1 - 0.85 * cloud).toFixed(3) }; })()`);
    const noon2 = await info();
    t.check("it lies in the one layer of the sun's shadows with the trees', made see-through as a whole (0.36 x the light); its own alpha only for a cloud over it",
        shared.sameLayer && noon2.layerZ === 1.8 && Math.abs(noon2.layerAlpha - 0.36 * noon2.light) < 0.005 && noon2.alpha > 0.1 && noon2.alpha <= 1, { shared, noon2 });

    // it walks with him: the frames of the silhouette change with the steps
    await t.setHour(10); await t.frames(4);
    await t.eval(`(function(){ window.__keys = new Set(); const sc = SceneManager._scene, up = sc.update; window.__up = up;
        sc.update = function() { up.apply(this, arguments); const s = ${hero}; if (s._sunShadow && s._sunShadow.bitmap) window.__keys.add(s._sunShadow.bitmap._key); }; Input._currentState.right = true; return 0; })()`);
    await t.frames(40);
    const walked = await t.json(`(function(){ Input._currentState.right = false; SceneManager._scene.update = window.__up; return [...window.__keys]; })()`);
    t.check("walking, the shadow takes every step (several frames of the figure)", walked.length >= 2, walked);

    // a blow: the swing sheet's frame throws the shadow
    await t.frames(20);
    await t.eval(`(function(){ $gamePlayer.startToolSwing(3, null, null); return 0; })()`);
    await t.frames(12);
    const swing = await info();
    const sheet = await t.eval(`(function(){ const s = ${hero}; return s._swingBody && s._swingBody.visible ? s._swingBody.bitmap._url : ""; })()`);
    t.check("during a swing the shadow is the swing's frame (" + sheet.replace(/.*\//, "") + ")", !!sheet && swing.visible && swing.key.startsWith(sheet), { sheet, key: swing.key });
    await t.shot(path.join(SHOTS, "postac_zamach.png"));
    await t.frames(40);

    // pictures: the hero on the grass in the morning, at noon, in the evening
    for (const [hour, name] of [[7.5, "rano"], [12, "poludnie"], [18.5, "wieczor"]]) {
        await t.setHour(hour); await t.frames(10);
        await t.shot(path.join(SHOTS, "postac_" + name + ".png"));
    }

    // under a roof: grandpa's house - no sun, only the spot under the feet
    await t.go(19, 5, 6, 2);
    await t.setHour(12); await t.frames(10);
    const inside = await info();
    t.check("under a roof (grandpa's house) there is no sun's shadow; the spot under the feet is there", (inside.none || !inside.visible) && inside.ground, inside);
});
