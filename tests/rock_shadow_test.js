// Rocks throw the sun's shadow too (user 2026-10-01: "cienie kamienie"; and the thickets of branches: "gąszcze gałęzi"): stones, boulders, ore rocks, bushes - in their own shape, short and
// down at noon, long to the left in the morning and to the right in the evening, none at night; the shadow painted in their picture
// is turned down to a soft shade right under them; and they stand in a fire's way at night. CDP_PORT=9447.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "cienie");

kit.test({ port: 9447, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12, quiet: true, minimap: false });
    // a rock with a painted shadow and an ore rock, both standing
    const pick = re => t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character instanceof Game_Event && ${re}.test(o._characterName || "") && o._character.x > 4 && o._character.y > 4);
        return s ? { id: s._character.eventId(), x: s._character.x, y: s._character.y, pic: s._characterName } : null; })()`);
    const rock = await pick("/^!\\$(Rock_(?!Ore)|Boulder)/"), ore = await pick("/^!\\$Rock_Ore/");
    t.check("a rock (painted shadow) and an ore rock on grandpa's field", !!rock && !!ore, { rock, ore });
    await t.eval(`(function(){ $gamePlayer.locate(${rock.x} + 3, ${rock.y} + 2); $gameMap.setDisplayPos(${rock.x} - 13, ${rock.y} - 8); return 0; })()`);
    const at = async (id, hour) => {
        await t.setHour(hour); await t.frames(8);
        return t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(${id})), sh = s._treeShadow;
            const out = { soft: !!(s.bitmap && s.bitmap._softShade), occluder: !!s._occluder };
            if (!sh) return Object.assign(out, { none: true }); const m = sh._matrix, h = sh.bitmap._footRow + 1;
            return Object.assign(out, { visible: sh.visible, tipX: +(-m.c * h).toFixed(1), tipY: +(-m.d * h).toFixed(1), layer: sh.parent && sh.parent.z }); })()`);
    };
    const noon = await at(rock.id, 12), morning = await at(rock.id, 7.5), evening = await at(rock.id, 18.5), night = await at(rock.id, 23);
    t.check("at noon the rock's shadow is short and falls down (in the sun's shadow layer)", noon.visible && noon.tipY > 0 && Math.abs(noon.tipX) < noon.tipY && noon.layer === 1.8, noon);
    t.check("in the morning long to the left, in the evening long to the right", morning.visible && morning.tipX < -5 && evening.visible && evening.tipX > 5, { morning, evening });
    t.check("at night none (the soft shade under it stays: its picture's painted shadow turned down)", !night.visible && night.soft, night);
    // the painted shadow turned down: its pixels kept at a third, the rock itself untouched
    const shade = await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(${rock.id}));
        const orig = ImageManager.loadCharacter(s._characterName), f = s._frame, a = orig.context.getImageData(f.x, f.y, f.width, f.height).data, b = s.bitmap.context.getImageData(f.x, f.y, f.width, f.height).data;
        let painted = 0, kept = 0, solidSame = 0, solid = 0;
        for (let i = 0; i < a.length; i += 4) { if (a[i + 3] >= 230) { solid++; if (b[i + 3] === a[i + 3]) solidSame++; } else if (a[i + 3] > 0 && a[i] + a[i + 1] + a[i + 2] < 240) { painted++; if (Math.abs(b[i + 3] - Math.round(a[i + 3] * 0.35)) <= 1) kept++; } }
        return { painted, kept, solid, solidSame }; })()`);
    t.check("its painted shadow is turned down to 35% (the rock's own pixels untouched)", shade.painted > 10 && shade.kept === shade.painted && shade.solidSame === shade.solid, shade);
    // the ore rock has none painted: it gets the sun's shadow all the same
    const oreNoon = await at(ore.id, 12);
    t.check("an ore rock (no painted shadow) throws one too", oreNoon.visible && oreNoon.tipY > 0, oreNoon);
    // a thicket of bare branches: a lacy shadow (the branches sharp in it, lighter: light comes through), its painted shadow turned down too
    const bush = await pick("/^!\\$Bush_Bare/");
    const bushMorning = bush ? await at(bush.id, 7.5) : null;
    const lace = bush ? await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(${bush.id})); return s._occluder ? +s._occluder.alpha.toFixed(2) : null; })()`) : null;
    t.check("a thicket of bare branches throws a lacy shadow too (morning: to the left; lighter - light comes through)", !!bush && bushMorning.visible && bushMorning.tipX < -5 && bushMorning.soft && lace > 0.8 && lace < 0.95, { bush, bushMorning, lace });

    // pictures: the rock in the morning and in the evening
    for (const [hour, name] of [[7.5, "rano"], [18.5, "wieczor"]]) {
        await t.setHour(hour); await t.frames(10);
        await t.shot(path.join(SHOTS, "kamienie_" + name + ".png"));
    }
    // a campfire beside the rock at night: the rock stands in its way
    await t.setHour(23);
    const fire = await t.json(`(function(){ const fx = ${rock.x} - 2, fy = ${rock.y}; const L = ($gameSystem._farm.buildings[3] = $gameSystem._farm.buildings[3] || []);
        L.push({ id: $gameSystem._farm.nextId++, type: "campfire", x: fx, y: fy, last: 1 }); $gameSystem._farm.rev++; return { fx, fy }; })()`);
    await t.frames(30);
    const blocked = await t.json(`(function(){ const set = SceneManager._scene._spriteset, N = set._nightLight, S = Tawerna.api("Sun"), l = N.lights().find(l => l.gy !== undefined);
        const s = set._characterSprites.find(o => o._character === $gameMap.event(${rock.id}));
        const b = l && s._occluder ? S.lightBlockers(l, S.occluders(set), 0, 1).find(b => b.o === s._occluder) : null;
        return { light: !!l, occluder: !!s._occluder, blocked: !!b, ux: b ? +b.ux.toFixed(2) : null }; })()`);
    t.check("at night a campfire beside it: the rock throws a shadow away from the fire", blocked.blocked && blocked.ux > 0.5, { fire, blocked });
    await t.shot(path.join(SHOTS, "kamien_ognisko.png"));
});
