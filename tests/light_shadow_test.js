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
    await t.newGame({ map: 8, x: 46, y: 50, day: 3, hour: 23, quiet: true, minimap: false });   // (a new game: leaving the house is the story's door)
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
    await t.eval("$gameScreen.changeWeather('none', 0, 0); $gameMap.setDisplayPos(0, 6); 0");
    await t.frames(40);
    const lamps = await t.json(`(function(){ const N = SceneManager._scene._spriteset._nightLight, ctx = N.bitmap.context, full = 0.9 * 255;
        const lit = (x, y) => Math.round(100 * (1 - ctx.getImageData(x >> 1, y >> 1, 1, 1).data[3] / full));   // (% of the night lifted)
        const at = id => { const e = $gameMap.event(id); return [e.screenX(), e.screenY() - 30]; };
        const l91 = N.lights().find(l => l.id === 6091), l88 = N.lights().find(l => l.id === 6088);
        const [ax, ay] = at(91), [bx, by] = at(94), [cx, cy] = at(93);
        const gl = (x, y) => { const d = N._glow.bitmap.context.getImageData(x >> 1, y >> 1, 1, 1).data; return [d[0], d[1], d[2], d[3]]; };   // (rgb, and the alpha: how strong)
        const [fx, fy] = at(88), g = gl(ax, ay - 6), gf = gl(fx, fy - 6);
        return { atLamp: lit(ax, ay), oneTile: lit(ax + 48, ay), twoTiles: lit(ax - 96, ay), between: lit((ax + cx) >> 1, ay), centre: lit((ax + bx) >> 1, (ay + by) >> 1),
                 lamp: l91 && { r: Math.round(l91.r), i: +l91.i.toFixed(2) }, fire: l88 && { r: l88.r, i: l88.i }, glow: N._glow.visible ? g : null, fireGlow: N._glow.visible ? gf : null }; })()`);
    t.check("a manor lamp: a clear pool by it (55-85% of the night lifted), a tile off still lit, nearly dark two tiles off",
        lamps.atLamp >= 55 && lamps.atLamp <= 85 && lamps.oneTile >= 25 && lamps.twoTiles <= 20, lamps);
    t.check("...dark between the lamps (no plateau): halfway between two under 40%, the middle of the four under 10%", lamps.between < 40 && lamps.centre < 10, lamps);
    // every light is a flame (user 2026-10-05: no electricity in the game): a lamp and a brazier glow like a campfire, warm (red >
    // green > blue); the brazier's fire keeps its full strength and reach, the lamp's smaller flame glows less
    const warm = c => !!c && c[0] > c[1] && c[1] > c[2] && c[0] > 20;
    t.check("...a campfire's warm glow over the dark at the lamp and at the brazier (a fire: full strength and reach, a stronger glow)",
        warm(lamps.glow) && warm(lamps.fireGlow) && lamps.fireGlow[3] > lamps.glow[3] && lamps.fire && lamps.fire.i === 1 && lamps.fire.r === 200, lamps);
    await t.shot(path.join(SHOTS, "dwor_latarnie_noc.png"));
});
