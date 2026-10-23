// People and animals throw shadows from the other lights too (user 2026-10-01: "zwierzęta i ludzie na zewnątrz jak i wewnątrz przy
// innych źródłach światła - piecyk u dziadka"): inside, from a hearth, a stove, a candle, a lamp (RoomLighting.js: cut out of the
// light hole in the room's darkness and out of its warm glow); outdoors at night from a <Light> event (the braziers by the Lord's gate,
// lit at night by the night layer of Farming_Render.js); the manor's lamps as pools of their own. What it costs a frame. CDP_PORT=9442.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "cienie");

kit.test({ port: 9442, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    // ---- grandpa's house (Map019) at night: the hearth (event 3, tile 9,4) always burns
    await t.newGame({ map: 19, x: 9, y: 7, day: 3, hour: 22, quiet: true, minimap: false });
    await t.frames(30);
    const hearth = side => t.json(`(function(){ const set = SceneManager._scene._spriteset, S = Tawerna.api("Sun");
        const hole = set.roomLightHoles().find(h => h.sprite._eventId === 3);
        if (!hole) return { hole: false };
        const hero = set._characterSprites.find(s => s._character === $gamePlayer)._occluder;
        const b = (hole._blockers || []).find(b => b.o === hero);
        if (!b) return { hole: true, blocked: false, hero: !!hero, n: (hole._blockers || []).length, height: hole.sprite._lightHeight };
        // the room's darkness (its alpha) 40 px beyond his feet along his shadow, and at the same spot mirrored round the hearth
        const ctx = set._darknessSprite.bitmap.context, k = 1 / set._darknessSprite.scale.x, at = (x, y) => ctx.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data[3];
        const px = hero.fx + 40 * b.ux, py = hero.fy + 40 * b.uy * S.FLAT, lx = hole.sprite.x, ly = hole.sprite.y;
        return { hole: true, blocked: true, ux: +b.ux.toFixed(2), uy: +b.uy.toFixed(2), len: Math.round(b.L), height: hole.sprite._lightHeight,
            darkInShadow: at(px, py), darkOpposite: at(2 * lx - px, 2 * ly - py) }; })()`);
    const below = await hearth();
    t.check("in grandpa's house at night, below the hearth, the hero throws a shadow away from it (down)", below.blocked && below.uy > 0.7, below);
    t.check("...cut out of the hearth's light: darker in his shadow than as far on the other side", below.darkInShadow > below.darkOpposite + 15, below);
    await t.shot(path.join(SHOTS, "dom_dziadka_palenisko.png"));
    await t.eval(`(function(){ $gamePlayer.locate(12, 5); return 0; })()`);
    await t.frames(10);
    const right = await hearth();
    t.check("standing to the right of it, his shadow runs to the right", right.blocked && right.ux > 0.7, right);
    await t.shot(path.join(SHOTS, "dom_dziadka_palenisko_bok.png"));
    // the others in the room are in the lights' way too (grandpa, the cat when it walks)
    const others = await t.json(`(function(){ const set = SceneManager._scene._spriteset;
        return set._characterSprites.filter(s => s._occluder && s._character !== $gamePlayer).map(s => s._characterName); })()`);
    t.check("grandpa and the animals in the house have their shapes for the lights too", others.length >= 1, others);
    // the cost of the room's darkness with the shadows and without
    const cost = JSON.parse(await t.eval(`new Promise(res => {
        const S = Tawerna.api("Sun"), set = SceneManager._scene._spriteset, rd = set.redrawDarkness, times = [];
        set.redrawDarkness = function() { this._darkKey = ""; const a = performance.now(); rd.apply(this, arguments); times.push(performance.now() - a); };
        const measure = (on, n) => new Promise(done => { S.shadows = on; const from = times.length + 10; const iv = setInterval(() => { if (times.length >= from + n) { clearInterval(iv); const x = times.slice(from, from + n).sort((p, q) => p - q); done(x[Math.floor(n / 2)]); } }, 20); });
        (async () => { const off = await measure(false, 120), on = await measure(true, 120); set.redrawDarkness = rd; S.shadows = true; res(JSON.stringify({ off: +off.toFixed(3), on: +on.toFixed(3) })); })();
    })`));
    console.log("   the room's darkness redrawn (median ms) without / with the shadows:", cost);
    t.check("the shadows in a room cost little (under 1 ms a frame more, the darkness redrawn every frame)", cost.on - cost.off < 1, cost);

    // ---- the town at night: a fire put on the map as an event (a <Light> with no <LightWhen> - since the town's rebuild the
    // braziers by the Lord's gate; the cauldron, event 75, is gone) lights the night and the hero two tiles left of it throws a shadow
    // away from it (to the left)
    await t.newGame({ map: 8, x: 98, y: 50, day: 3, hour: 23, quiet: true, minimap: false });   // (a new game: leaving the house is the story's door)
    const fire = await t.json(`(function(){ const e = $dataMap.events.find(e => e && /<Light:/i.test(e.note) && !/<LightWhen|<LightSoft|<LightCone/i.test(e.note));
        if (!e) return null; $gamePlayer.locate(e.x - 2, e.y); return { id: e.id, x: e.x, y: e.y }; })()`);
    await t.frames(30);
    const town = await t.json(`(function(){ const set = SceneManager._scene._spriteset, N = set._nightLight, S = Tawerna.api("Sun"), fire = ${JSON.stringify(fire)};
        const l = fire && N.lights().find(l => l.id === 6000 + fire.id);
        if (!l) return { fire, light: false, lights: N.lights().map(l => l.id) };
        const hero = set._characterSprites.find(s => s._character === $gamePlayer)._occluder;
        const b = S.lightBlockers(l, S.occluders(set), 0, 1).find(b => b.o === hero);
        return { fire, light: true, r: l.r, i: l.i, blocked: !!b, ux: b ? +b.ux.toFixed(2) : null }; })()`);
    t.check("in the town at night a fire event (a <Light>) lights the dark at full strength and reach, and the hero beside it throws a shadow away from it",
        town.light && town.i === 1 && town.r === 200 && town.blocked && town.ux < -0.7, town);
    await t.shot(path.join(SHOTS, "miasteczko_kosz_noc.png"));

    // ---- the manor's lamps at night (<Light:170,90,60,22><LightWhen:night>, 4 tiles apart): each a warm pool of its own, dark
    // between them - not one patch in the day's colours (2026-10-05: at a fire's full strength and reach they ran together)
    await t.newGame({ map: 24, x: 1, y: 15, dir: 6, hour: 22, quiet: true, minimap: false });
    await t.eval("$gameScreen.changeWeather('none', 0, 0); 0");
    await t.frames(20);
    // (2026-10-12: the author moved and took away manor lamps - the camera goes to the lamp the test looks at)
    const lampA = await t.eval(`(function(){ const N = SceneManager._scene._spriteset._nightLight;
        const ids = $gameMap.events().filter(e => /Latarnia/.test(e.event().name)).map(e => e.eventId()).filter(id => N.lights().some(l => l.id === 6000 + id && l.r < 200));
        const A = ids.includes(91) ? 91 : ids[0], e = $gameMap.event(A); $gameMap.setDisplayPos(Math.max(0, e.x - 13), Math.max(0, e.y - 7)); return A; })()`);
    await t.frames(40);
    const lamps = await t.json(`(function(){ const N = SceneManager._scene._spriteset._nightLight, ctx = N.bitmap.context, full = 0.9 * 255;
        const lit = (x, y) => Math.round(100 * (1 - ctx.getImageData(x >> 1, y >> 1, 1, 1).data[3] / full));   // (% of the night lifted)
        const at = id => { const e = $gameMap.event(id); return [e.screenX(), e.screenY() - 30]; };
        // (2026-10-12: the author took two of the four lamps away - the test takes the lamps there are: the first, its nearest
        // neighbour for "between", the diagonal one for "the middle of the four" only while there are four)
        const lampIds = N.lights().filter(l => l.id > 6000 && l.id !== 6088 && l.r < 200).map(l => l.id - 6000).filter(id => $gameMap.event(id) && /Latarnia/.test($gameMap.event(id).event().name));
        const A = ${lampA}, near = lampIds.filter(id => id !== A).sort((p, q) => { const d = id => Math.hypot($gameMap.event(id).x - $gameMap.event(A).x, $gameMap.event(id).y - $gameMap.event(A).y); return d(p) - d(q); });
        const l91 = N.lights().find(l => l.id === 6000 + A), l88 = N.lights().find(l => l.id === 6088);
        const [ax, ay] = at(A), [cx, cy] = near.length ? at(near[0]) : [ax + 192, ay], four = [91, 92, 93, 94].every(id => lampIds.includes(id)), [bx, by] = four ? at(94) : [ax, ay];   // (the old square of four)
        const gl = (x, y) => { const d = N._glow.bitmap.context.getImageData(x >> 1, y >> 1, 1, 1).data; return [d[0], d[1], d[2], d[3]]; };   // (rgb, and the alpha: how strong)
        const [fx, fy] = at(88), g = gl(ax, ay - 6), gf = gl(fx, fy - 6);
        return { lamps: lampIds, four, atLamp: lit(ax, ay), oneTile: lit(ax + 48, ay), twoTiles: lit(ax - 96, ay), between: near.length ? lit((ax + cx) >> 1, (ay + cy) >> 1) : 0, centre: four ? lit((ax + bx) >> 1, (ay + by) >> 1) : 0,
                 lamp: l91 && { r: Math.round(l91.r), i: +l91.i.toFixed(2) }, fire: l88 && { r: l88.r, i: l88.i }, glow: N._glow.visible ? g : null, fireGlow: N._glow.visible ? gf : null }; })()`);
    // (the brazier, event 88, may be out of the lamp's picture now: the camera goes to it for its glow)
    if (await t.eval("!!$gameMap.event(88)")) {
        await t.eval("(function(){ const e = $gameMap.event(88); $gameMap.setDisplayPos(Math.max(0, e.x - 13), Math.max(0, e.y - 7)); return 0; })()");
        await t.frames(30);
        lamps.fireGlow = await t.json(`(function(){ const N = SceneManager._scene._spriteset._nightLight, e = $gameMap.event(88);
            const d = N._glow.bitmap.context.getImageData(e.screenX() >> 1, (e.screenY() - 36) >> 1, 1, 1).data; return N._glow.visible ? [d[0], d[1], d[2], d[3]] : null; })()`);
    }
    t.check("a manor lamp: a clear pool by it (55-85% of the night lifted), a tile off still lit, nearly dark two tiles off",
        lamps.atLamp >= 55 && lamps.atLamp <= 85 && lamps.oneTile >= 25 && lamps.twoTiles <= 20, lamps);
    t.check("...dark between the lamps (no plateau): halfway between two under 40%, the middle of the four (if four) under 10%", lamps.lamps.length >= 1 && lamps.between < 40 && lamps.centre < 10, lamps);
    // every light is a flame (user 2026-10-05: no electricity in the game): a lamp and a brazier glow like a campfire, warm (red >
    // green > blue); the brazier's fire keeps its full strength and reach, the lamp's smaller flame glows less
    const warm = c => !!c && c[0] > c[1] && c[1] > c[2] && c[0] > 20;
    t.check("...a campfire's warm glow over the dark at the lamp and at the brazier (a fire: full strength and reach, a stronger glow)",
        warm(lamps.glow) && warm(lamps.fireGlow) && lamps.fireGlow[3] > lamps.glow[3] && lamps.fire && lamps.fire.i === 1 && lamps.fire.r === 200, lamps);
    await t.shot(path.join(SHOTS, "dwor_latarnie_noc.png"));

    // (2026-10-17) at night the outer ring of a fire basket's light over the WATER is warm to its edge (Farming_Render's night layer:
    // the world under the light multiplied by the firelight's colour - in full over water, a touch on land - and the darkness left in
    // the ring warm brown), not the pale blue halo it was
    await t.newGame({ map: 125, x: 20, y: 12, dir: 4, hour: 22, day: 5, quiet: true, minimap: false });
    await t.eval("$gameScreen.changeWeather('none', 0, 0); 0");
    await t.eval("(function(){ const e = $gameMap.event(25); $gamePlayer.locate(e.x + 3, e.y); $gamePlayer.updateScroll = function(){}; $gameMap.setDisplayPos(Math.max(0, e.x - 6), Math.max(0, e.y - 6)); return 0; })()");
    await t.frames(30);
    const ring = await t.json(`(function(){ const N = SceneManager._scene._spriteset._nightLight, l = N && N.lights().find(l => l.id === 6025);
        if (!l || !N._warm) return { light: !!l, warm: !!(N && N._warm) };
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        let at = null;
        for (let y = 0; y < $gameMap.height() && !at; y++) for (let x = 0; x < $gameMap.width() && !at; x++) {
            const sx = (($gameMap.adjustX(x) + 0.5) * tw), sy = (($gameMap.adjustY(y) + 0.5) * th), d = Math.hypot(sx - l.x, sy - l.y);
            if (d > 0.55 * l.r && d < 0.7 * l.r && sx > 0 && sy > 0 && sx < Graphics.width && sy < Graphics.height && Farming.isWaterTile(x, y)) at = [x, y, sx, sy, Math.round(d)];
        }
        if (!at) return { cell: null, r: l.r };
        const px = (c, sx, sy) => Array.from(c.getImageData(Math.round(sx / 2), Math.round(sy / 2), 1, 1).data);
        return { cell: at, r: l.r, visible: N._warm.visible, multiply: N._warm.blendMode === PIXI.BLEND_MODES.MULTIPLY,
            warm: px(N._warm.bitmap.context, at[2], at[3]), night: px(N.bitmap.context, at[2], at[3]) }; })()`);
    t.check("at night the fire basket's outer ring over the water is warm (firelight colour over the sea, the darkness there warm brown)",
        !!ring.cell && ring.visible && ring.multiply && ring.warm[3] > 100 && ring.warm[0] > ring.warm[1] && ring.warm[1] > ring.warm[2]
        && ring.night[3] > 0 && ring.night[0] >= ring.night[2], ring);   // (the night colour there no longer blue: was 3,7,24)
    await t.shot(path.join(SHOTS, "przystan_kosz_noc.png"));
});
