// At night a fire makes the things around throw shadows (user 2026-09-30): away from the flame, cut out of its light (in a shadow
// the night stays as dark as around); walking round the fire the shadow goes round too; by day the sun wins. A lightning flash is
// a sun for a moment: everything throws a long shadow away from the bolt, also at night. And what it costs a frame. CDP_PORT=9438.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "cienie");

kit.test({ port: 9438, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 23, quiet: true, minimap: false });
    // open ground: 9 x 5 tiles with no event
    const B = await t.json(`(function(){ for (let y = 5; y < $gameMap.height() - 6; y++) for (let x = 5; x < $gameMap.width() - 10; x++) {
            let ok = true; for (let yy = y - 2; yy <= y + 2 && ok; yy++) for (let xx = x - 4; xx <= x + 4; xx++) if (!$gameMap.isPassable(xx, yy, 2) || $gameMap.eventsXy(xx, yy).length || Farming.buildingAt(xx, yy)) { ok = false; break; }
            if (ok) return { x, y }; } return null; })()`);
    t.check("open ground for a campfire", !!B, B);
    await t.eval(`(function(){ const L = ($gameSystem._farm.buildings[$gameMap.mapId()] = $gameSystem._farm.buildings[$gameMap.mapId()] || []);
        L.push({ id: $gameSystem._farm.nextId++, type: "campfire", x: ${B.x}, y: ${B.y}, last: 1 }); $gameSystem._farm.rev++;
        $gamePlayer.locate(${B.x} + 2, ${B.y}); $gamePlayer.setDirection(4); $gameMap.setDisplayPos(${B.x} - 13, ${B.y} - 7); return 0; })()`);
    await t.frames(40);
    const night = `SceneManager._scene._spriteset._nightLight`;
    // the fire's light and the hero standing in it: his shadow from it
    const probe = () => t.json(`(function(){ const N = ${night}, S = Tawerna.api("Sun"), l = N.lights().find(l => l.gy !== undefined);
        if (!l) return { light: false, visible: N.visible };
        const hero = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer)._occluder;
        const bl = N.blockers(l, S.occluders(SceneManager._scene._spriteset), S, 1).find(b => b.o === hero);
        if (!bl) return { light: true, visible: N.visible, hero: !!hero, blocked: false };
        const h = hero.bmp._footRow + 1, tipX = bl.m.c * -h, tipY = bl.m.d * -h;
        // the dark of the night layer (its alpha, 0..255) in the hero's shadow and at the same distance from the fire on the other side
        const ctx = N.bitmap.context, at = (x, y) => ctx.getImageData(Math.round(x / 2), Math.round(y / 2), 1, 1).data[3];
        const px = hero.fx + tipX * 0.5, py = hero.fy + tipY * 0.5, mx = 2 * l.gx - px, my = 2 * l.gy - py;
        return { light: true, visible: N.visible, blocked: true, tipX: +tipX.toFixed(1), tipY: +tipY.toFixed(1), fire: [l.gx, l.gy], foot: [+hero.fx.toFixed(1), +hero.fy.toFixed(1)],
            darkInShadow: at(px, py), darkOpposite: at(mx, my) }; })()`);
    const right = await probe();
    t.check("at night the hero beside the fire throws a shadow away from it (he stands to the right: it runs right)", right.visible && right.blocked && right.tipX > 20, right);
    t.check("the shadow is cut out of the fire's light: darker there than as far from the fire on the other side", right.darkInShadow > right.darkOpposite + 20, right);
    await t.shot(path.join(SHOTS, "ognisko_noc.png"));
    await t.eval(`(function(){ $gamePlayer.locate(${B.x} - 2, ${B.y}); $gamePlayer.setDirection(6); return 0; })()`);
    await t.frames(10);
    const left = await probe();
    t.check("walking round to the other side, the shadow turns with him (to the left now)", left.blocked && left.tipX < -20, left);
    await t.eval(`(function(){ $gamePlayer.locate(${B.x}, ${B.y} + 2); $gamePlayer.setDirection(8); return 0; })()`);
    await t.frames(10);
    const below = await probe();
    t.check("in front of the fire it runs towards the viewer (down)", below.blocked && below.tipY > 10, below);
    await t.shot(path.join(SHOTS, "ognisko_noc_przod.png"));
    // further down, still well inside the light's circle on the screen: the shadow is there (the distance over the ground - up and
    // down the screen it is shortened - used to cut it off halfway to the edge: "cień nagle znika")
    await t.eval(`(function(){ $gamePlayer.locate(${B.x}, ${B.y} + 4); return 0; })()`);
    await t.frames(10);
    const far = await probe(), farAt = await t.json(`(function(){ const l = ${night}.lights().find(l => l.gy !== undefined), o = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer)._occluder;
        return { screen: Math.round(Math.hypot(o.fx - l.x, o.fy - l.y)), r: l.r }; })()`);
    t.check("4 tiles below the fire, still in its light (" + farAt.screen + " of " + farAt.r + " px on the screen), he still throws a shadow", farAt.screen < farAt.r && far.blocked && far.tipY > 10, { far, farAt });

    // the cost at night by the fire: with the shadows and without (Sun.shadows off: no occluders for the night layer either)
    await t.eval(`(function(){ $gamePlayer.locate(${B.x} + 2, ${B.y}); return 0; })()`);
    await t.frames(10);
    const cost = JSON.parse(await t.eval(`new Promise(res => {
        const S = Tawerna.api("Sun"), N = ${night}, up = N.update, times = [];
        N.update = function() { const a = performance.now(); up.apply(this, arguments); times.push(performance.now() - a); };
        const measure = (on, n) => new Promise(done => { S.shadows = on; const from = times.length + 10; const iv = setInterval(() => { if (times.length >= from + n) { clearInterval(iv); const x = times.slice(from, from + n).sort((p, q) => p - q); done(x[Math.floor(n / 2)]); } }, 20); });
        (async () => { const off = await measure(false, 120), on = await measure(true, 120); N.update = up; S.shadows = true; res(JSON.stringify({ off: +off.toFixed(3), on: +on.toFixed(3) })); })();
    })`));
    console.log("   the night layer's update (median ms) without / with the fire's shadows:", cost);
    t.check("the fire's shadows cost little (under 1 ms a frame more)", cost.on - cost.off < 1, cost);

    // by day the sun wins: no night layer, no fire shadows
    await t.setHour(12); await t.frames(10);
    const day = await probe();
    t.check("by day there is no night layer and so no fire shadow", !day.visible, day);

    // a tree by the fire throws a shadow from it too (the people's code used to wipe the trees' occluders every frame)
    const tf = await t.json(`(function(){ const trees = SceneManager._scene._spriteset._characterSprites.filter(o => o._character instanceof Game_Event && o.isTreeSprite && o.isTreeSprite() && !o._character._treeGone).map(o => o._character);
        for (const e of trees) { const fx = e.x - 2, fy = e.y; let ok = true;
            for (let yy = fy - 1; yy <= fy + 1 && ok; yy++) for (let xx = fx - 1; xx <= fx; xx++) if (!$gameMap.isPassable(xx, yy, 2) || $gameMap.eventsXy(xx, yy).length || Farming.buildingAt(xx, yy)) ok = false;
            if (ok) return { id: e.eventId(), fx, fy }; } return null; })()`);
    t.check("a tree with room for a campfire two tiles beside it", !!tf, tf);
    await t.setHour(23);
    await t.eval(`(function(){ const L = $gameSystem._farm.buildings[$gameMap.mapId()]; L.length = 0; L.push({ id: $gameSystem._farm.nextId++, type: "campfire", x: ${tf.fx}, y: ${tf.fy}, last: 1 }); $gameSystem._farm.rev++;
        $gamePlayer.locate(${tf.fx} - 3, ${tf.fy} + 3); $gameMap.setDisplayPos(${tf.fx} - 12, ${tf.fy} - 8); return 0; })()`);
    await t.frames(30);
    const treeShadow = await t.json(`(function(){ const N = ${night}, S = Tawerna.api("Sun"), l = N.lights().find(l => l.gy !== undefined);
        const tree = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gameMap.event(${tf.id})), o = tree._occluder;
        const bl = o && N.blockers(l, S.occluders(SceneManager._scene._spriteset), S, 1).find(b => b.o === o);
        if (!bl) return { occluder: !!o, blocked: false };
        const ctx = N.bitmap.context, at = (x, y) => ctx.getImageData(Math.round(x / 2), Math.round(y / 2), 1, 1).data[3];
        const px = o.fx + 60 * bl.ux, py = o.fy + 60 * bl.uy * S.FLAT, mx = 2 * l.gx - px, my = 2 * l.gy - py;   // 60 px beyond its foot, and the same spot mirrored
        return { occluder: true, blocked: true, runsRight: bl.ux > 0.8, darkBehind: at(px, py), darkOpposite: at(mx, my) }; })()`);
    t.check("a tree beside the fire throws a shadow away from it: darker behind the tree than as far on the other side", treeShadow.blocked && treeShadow.runsRight && treeShadow.darkBehind > treeShadow.darkOpposite + 15, treeShadow);
    await t.shot(path.join(SHOTS, "ognisko_drzewo.png"));

    // a lightning flash at night: a sun for a moment - the hero's shadow runs away from the bolt, long
    await t.setHour(23); await t.frames(10);
    const flash = await t.json(`new Promise(res => { Storm.strike(0.05); let n = 0; const iv = setInterval(() => { const sun = Tawerna.api("Sun").now(), s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer)._sunShadow;
        if (sun.flash && s && s.visible) { clearInterval(iv); const h = s.bitmap._footRow + 1; res({ flash: true, light: +sun.light.toFixed(2), dx: +sun.dx.toFixed(2), dy: +sun.dy.toFixed(2), tipX: +(-s._matrix.c * h).toFixed(1), tipY: +(-s._matrix.d * h).toFixed(1) }); }
        if (++n > 150) { clearInterval(iv); res({ flash: false, light: +sun.light.toFixed(2) }); } }, 5); })`);
    t.check("a lightning flash at night: for a moment the hero throws a long shadow away from the bolt", flash.flash && flash.light > 0.3 && Math.hypot(flash.tipX, flash.tipY) > 25, flash);
    await t.frames(60);
    const after = await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer)._sunShadow; return { flash: !!Tawerna.api("Sun").now().flash, visible: !!(s && s.visible) }; })()`);
    t.check("...and it is gone with the flash", !after.flash && !after.visible, after);
});
