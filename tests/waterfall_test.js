// The town's waterfall made alive (user 2026-10-04): the waterfall in the pond's colour (tileset 11 uses the recoloured copy of the
// A1 sheet, tools/town/water_colours.py), the author's foam and shining lip (tools/town/waterfall_fx.py), WaterFx.js's splash
// (spray, mist, rings, waves) and what the current carries (flecks of foam, glints) on the stream and the pond; drinking at the pond's shore still works.
// Frames for a GIF: <tmp>/waterfall_frames/f00.png.. plus the waterfall's place on them in frames.json (tools: see below).
const path = require("path"), os = require("os"), fs = require("fs");
const kit = require("./lib/kit.js");
const FRAMES = path.join(os.tmpdir(), "waterfall_frames");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 8, x: 39, y: 11, dir: 6, hour: 12, quiet: true, minimap: false });
    const set = await t.json(`({ a1: $gameMap.tileset().tilesetNames[0], fx: WaterFx.effects().map(f => f.constructor.name) })`);
    t.check("the town's tileset uses the recoloured water sheet", /A1_green_town$/.test(set.a1), set);
    t.check("four water effects on the map: the falling water, the splash and two currents", JSON.stringify(set.fx.slice().sort()) === '["Fall","Flow","Flow","Splash"]', set);

    await t.frames(30);
    // (a glint comes and goes at random - one frame may show none on a current: the most seen over a second counts)
    await t.eval(`(function(){ window.__gl = [0, 0]; const fl = WaterFx.effects().filter(f => f.constructor.name === "Flow");
        let n = 0; const iv = setInterval(() => { fl.forEach((f, i) => { window.__gl[i] = Math.max(window.__gl[i], f.items.filter(p => p.glint).length); }); if (++n >= 60) clearInterval(iv); }, 16); return 0; })()`);
    await t.frames(60);
    const live = await t.json(`(function(){ const fx = WaterFx.effects(); const s = fx.find(f => f.constructor.name === "Splash");
        const flows = fx.filter(f => f.constructor.name === "Flow");
        return { drops: s.items.filter(p => p.kind === "drop").length, mist: s.items.filter(p => p.kind === "mist").length, rings: s.rings.length, waves: s.waves.length,
                 flecks: flows.map(f => f.items.filter(p => !p.glint).length), glints: flows.map((f, i) => Math.max(f.items.filter(p => p.glint).length, (window.__gl || [])[i] || 0)),
                 visible: fx.every(f => f.sprites().every(sp => sp.visible)),
                 foam: $gameMap.events().filter(e => /^Wodospad:/.test(e.event().name)).map(e => e.characterName() + ":" + e.characterIndex()) }; })()`);
    t.check("after a moment the splash throws drops, raises mist, churns little rings and sends out waves; both currents carry flecks of foam and glints (no streaks)",
        live.drops > 3 && live.mist > 3 && live.rings > 1 && live.waves >= 1 && live.flecks.every(n => n > 3) && live.glints.every(n => n >= 1) && live.visible, live);
    t.check("the author's foam and lip pictures on the waterfall (4 pieces)", live.foam.length === 4 && live.foam.every(s => s.startsWith("!waterfall_animation")), live.foam);

    const fall = await t.json(`(function(){ const f = WaterFx.effects().find(e => e.constructor.name === "Fall"); const a = f && f.ready && f.back.tilePosition.y;
        return new Promise(res => setTimeout(() => res({ ready: !!(f && f.ready), w: f && f.back.width, h: f && f.back.height, moved: f && f.ready ? f.back.tilePosition.y - a : 0,
            frontFaster: f && f.ready && f.front.tilePosition.y > f.back.tilePosition.y }), 250)); })()`);
    t.check("the falling water slides down smoothly (a little every frame, the front layer faster) over the 2x4 cells inside the rock rims",
        fall.ready && fall.w === 96 - 14 && fall.h === 192 && fall.moved > 5 && fall.moved < 40 && fall.frontFaster, fall);

    const drink = await t.json(`({ water: !!Tawerna.call("Farming", "isWaterTile", 40, 11), events: $gameMap.eventsXy(40, 11).length })`);
    t.check("the pond by the shore is still water to drink from, with no event in the way", drink.water && drink.events === 0, drink);

    // frames for a GIF of the waterfall
    fs.mkdirSync(FRAMES, { recursive: true });
    await t.eval("$gameMap.setDisplayPos(31, 0); 0");   // (the camera on the whole stream, fall and pond; it stays while the hero stands)
    await t.frames(5);
    const box = await t.json(`({ x: $gameMap.adjustX(40) * 48, y: $gameMap.adjustY(0) * 48, w: 9 * 48, h: 15 * 48, gw: Graphics.width })`);
    for (let i = 0; i < 40; i++) {
        await t.frames(4);
        await t.shot(path.join(FRAMES, "f" + String(i).padStart(2, "0") + ".png"));
    }
    fs.writeFileSync(path.join(FRAMES, "frames.json"), JSON.stringify(box));
});
