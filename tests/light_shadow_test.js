// People and animals throw shadows from the other lights too (user 2026-10-01: "zwierzęta i ludzie na zewnątrz jak i wewnątrz przy
// innych źródłach światła - piecyk u dziadka"): inside, from a hearth, a stove, a candle, a lamp (RoomLighting.js: cut out of the
// light hole in the room's darkness and out of its warm glow); outdoors at night from a <Light> event (the town's cauldron over a fire,
// now lit at night by the night layer of Farming_Render.js). What it costs a frame. CDP_PORT=9442.
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

    // ---- the town at night: the cauldron over a fire (event 75, a <Light>) lights the night and the hero beside it throws a shadow
    await t.newGame({ map: 8, x: 9, y: 19, day: 3, hour: 23, quiet: true, minimap: false });   // (a new game: leaving the house is the story's door)
    await t.frames(30);
    const town = await t.json(`(function(){ const set = SceneManager._scene._spriteset, N = set._nightLight, S = Tawerna.api("Sun"), l = N.lights().find(l => l.id === 6075);
        if (!l) return { light: false, lights: N.lights().map(l => l.id) };
        const hero = set._characterSprites.find(s => s._character === $gamePlayer)._occluder;
        const b = S.lightBlockers(l, S.occluders(set), 0, 1).find(b => b.o === hero);
        return { light: true, r: l.r, blocked: !!b, ux: b ? +b.ux.toFixed(2) : null }; })()`);
    t.check("in the town at night the cauldron's fire lights the dark (a <Light> event outdoors) and the hero beside it throws a shadow away from it", town.light && town.blocked && town.ux > 0.7, town);
    await t.shot(path.join(SHOTS, "miasteczko_kociolek_noc.png"));
});
