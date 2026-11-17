// The rebuilt tavern (tools/tawerna2): Map001 63x55 ground floor, Map025 63x55 guest floor, Map026 63x55 suites: every room reachable
// from the entrance (14,53), the doorway out to the yard (Map008) and back through the gate, the loose brick (ev9, pantry) to the cellar
// (Map009) and back, the stairs up and down, the hook events, Borgar's talk with his bust, no console errors.
//   GAME_OVERLAY=tools/tawerna2/staging GAME_OVERLAY_JS=1 node tests/tavern_interior_test.js     (before the install)
//   node tests/tavern_interior_test.js                                                          (after it)
// Coordinate-light: events are found by name / tag, rooms are loose rectangles (tools/tawerna2/uklad.txt).
let kit; try { kit = require("./lib/kit.js"); } catch (e) { kit = require("../../../../tests/lib/kit.js"); }

const ROOMS = {
    "Kuchnia": [0, 0, 18, 17], "Piekarnia": [18, 0, 28, 17], "Spiżarnia": [28, 0, 36, 17], "Pokój służby": [36, 0, 48, 17],
    "Pokój Borgara": [48, 0, 62, 11], "Magazyn": [48, 11, 62, 23], "Korytarz": [0, 17, 48, 23],
    "Wielka sala": [1, 27, 27, 44], "Scena": [29, 27, 47, 38], "Pokój gier": [48, 24, 62, 38], "Rzutki i palarnia": [28, 40, 62, 53]
};
const LANDING = [14, 53];
const HOOKS = ["board", "dice", "darts", "arm", "stage", "meal", "mealtable"];

kit.test({ bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    await t.newGame({ map: 8, x: 51, y: 17, dir: 8, quiet: true });   // (in front of the tavern's gate)
    const transferOf = eid => t.json(`(function(){ const e = $dataMap.events[${eid}]; if (!e) return null; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0) return c.parameters; return null; })()`);
    const follow = async eid => { const tr = await transferOf(eid); if (!tr) return null; const ok = await t.go(tr[1], tr[2], tr[3], tr[4]); return { to: tr.slice(1, 5), ok }; };
    const byName = re => t.json(`$dataMap.events.filter(e => e && ${re}.test(e.name)).map(e => [e.id, e.x, e.y])`);

    // ---- in through the gate (Map008 event 22): the vestibule, facing up
    let r = await follow(22);
    const at = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), w: $dataMap.width, h: $dataMap.height })");
    t.check("the yard's gate (Map008 event 22) leads into the vestibule (Map001 14,53, facing up; map 63x55)", r && r.ok && at.map === 1 && at.x === LANDING[0] && at.y === LANDING[1] && at.d === 8 && at.w === 63 && at.h === 55, { r, at });

    // ---- the places the walk must reach: the events found by name / tag
    const brick = (await byName("/Luźna cegła/"))[0], stairs = await byName("/^Schody/"), exits = await byName("/^Wyjście/");
    const reach = await t.json(`(function(){
        const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[${LANDING[0]}, ${LANDING[1]}]];
        const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
        seen[${LANDING[1]} * W + ${LANDING[0]}] = 1;
        while (q.length) { const [x, y] = q.pop();
            for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) { const nx = x + dx, ny = y + dy;
                if (!$gameMap.isValid(nx, ny) || seen[ny * W + nx]) continue;
                if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
                seen[ny * W + nx] = 1; q.push([nx, ny]); } }
        const rooms = ${JSON.stringify(ROOMS)}, out = {};
        for (const n in rooms) { const [x0, y0, x1, y1] = rooms[n]; let c = 0, all = 0;
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { all++; if (seen[y * W + x]) c++; } out[n] = [c, all]; }
        const cell = (x, y) => !!seen[y * W + x];
        // a place is reached when it or a tile beside it is (an event in a wall, a counter, a door)
        const near = (x, y) => cell(x, y) || cell(x - 1, y) || cell(x + 1, y) || cell(x, y - 1) || cell(x, y + 1);
        return { rooms: out, total: seen.reduce((a, v) => a + v, 0),
            brick: near(${brick ? brick[1] : 0}, ${brick ? brick[2] : 0}),
            stairs: ${JSON.stringify(stairs)}.map(s => near(s[1], s[2])), exits: ${JSON.stringify(exits)}.map(s => near(s[1], s[2])) };
    })()`);
    const poor = Object.entries(reach.rooms).filter(([n, [c, all]]) => c < all * 0.2).map(([n, v]) => n + " " + v.join("/"));
    t.check("every room of the ground floor can be walked into from the entrance (at least a fifth of its rectangle open)", poor.length === 0 && reach.total > 800, { poor, rooms: reach.rooms, total: reach.total });
    t.check("...the loose brick, all six stair events and the three doorway events are reachable", !!brick && reach.brick && stairs.length === 6 && reach.stairs.every(Boolean) && exits.length === 3 && reach.exits.every(Boolean), { brick, stairs, exits, reach });

    // ---- the gameplay hooks (TavernLife / TavernDice / QuestBoard read them by their tag)
    const hooks = await t.json(`(function(){ const out = {}; for (const e of $dataMap.events) { if (!e) continue; for (const c of e.pages[0].list) { const m = c.code === 108 && /<Tavern:\\s*([A-Za-z]+)/.exec(c.parameters[0]); if (m) { (out[m[1]] = out[m[1]] || []).push([e.x, e.y]); break; } } } return out; })()`);
    const missing = HOOKS.filter(h => !hooks[h]);
    t.check("the hook events are all there: " + HOOKS.join(", "), missing.length === 0 && hooks.mealtable.length >= 4 && hooks.dice.length >= 2, { missing, counts: Object.fromEntries(Object.entries(hooks).map(([k, v]) => [k, v.length])) });

    // ---- Borgar: his talk with his bust (event 1, across the counter)
    const bx = await t.json("(function(){ const e = $gameMap.event(1); return e ? [e.x, e.y] : null; })()");
    t.check("Borgar (event 1) stands in the hall", !!bx && bx[1] >= 24, bx);
    await t.locate(bx[0], bx[1] + 1, 8);
    await t.frames(10);
    const bust = await t.eval("window.SpeechBubbles && SpeechBubbles.bustOf ? SpeechBubbles.bustOf($gameMap.event(1)) : null");
    await t.eval("$gameMap.event(1).start(); 0");
    await t.frames(60);
    const talk = await t.json(`(function(){ const L = SceneManager._scene._talkBusts, side = (window.SpeechBubbles && SpeechBubbles.NPC_SIDE) || "right", R = L && L._sides && L._sides[side]; return { running: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(), side, shown: !!(R && R.sprite && R.sprite.visible) }; })()`);
    t.check("talking to Borgar: a talk with his bust (People3_5)", bust === "People3_5" && talk.running && talk.msg && talk.shown, { bust, talk });
    await t.eval("$gameMap._interpreter.clear(); $gameMessage.clear(); 0"); await t.frames(30);

    // ---- out through the doorway (3 events in the south wall) to the yard, and back in
    const outs = [];
    for (const e of exits) outs.push(await transferOf(e[0]));
    r = await follow(exits[0][0]);
    const yard = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("the doorway (3 events at y=54) leads out in front of the gate (Map008 y=17)", outs.every(o => o && o[1] === 8 && o[3] === 17) && yard.map === 8 && yard.y === 17, { outs, yard });
    r = await follow(22);
    t.check("...and the gate leads back in", r && r.ok && (await t.eval("$gameMap.mapId()")) === 1, r);

    // ---- the loose brick (ev9, in the pantry) down to the cellar and back
    const down = await transferOf(brick[0]);
    r = await follow(brick[0]);
    const cellar = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("the loose brick leads down to the cellar (Map009 10,8)", down && down[1] === 9 && cellar.map === 9 && cellar.x === 10 && cellar.y === 8, { down, cellar });
    const upEv = await t.json("$dataMap.events.filter(e => e && /Schody do tawerny|Wejście do piwnicy/i.test(e.name)).map(e => e.id)");
    let up = null; for (const id of upEv) { const tr = await transferOf(id); if (tr && tr[1] === 1) { up = tr; await t.go(tr[1], tr[2], tr[3], tr[4]); break; } }
    const back = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("...and the cellar's stairs lead back up in the pantry below the brick, facing down", !!up && back.map === 1 && back.x === brick[1] && back.y === brick[2] + 1 && back.d === 2, { up, back, brick });

    // ---- the stairs: up from the ground floor to Map025, and down again
    const s0 = stairs[0], upT = await transferOf(s0[0]);
    r = await follow(s0[0]);
    const upper = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, w: $dataMap.width, h: $dataMap.height })");
    t.check("six stair events; up leads to Map025 (63x55)", stairs.length === 6 && upT && upT[1] === 25 && upper.map === 25 && upper.w === 63 && upper.h === 55, { stairs: stairs.length, upT, upper });
    const downs = await byName("/^Schody -> Tawerna/");
    const dT = downs.length ? await transferOf(downs[0][0]) : null;
    r = downs.length ? await follow(downs[0][0]) : null;
    const below = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("...and Map025's stairs lead down to the ground floor (east staircase y=53), facing down", downs.length === 3 && dT && dT[1] === 1 && below.map === 1 && below.y === 53 && below.d === 2, { downs: downs.length, dT, below });
    // ---- Map025 -> Map026 and back; Map026 loads
    r = await follow(stairs[0][0]);   // (back up: Map025 at the west stairs box (1,53))
    const gateEv = (await byName("/Złota krata/"))[0];
    const gateNear = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    const gShut = await t.json("[0,1,2,3,4].every(x => $gameMap.eventsXyNt(x, 49).some(e => e.isNormalPriority() && !e.isThrough()))");
    t.check("the golden gate (Map025 ev " + (gateEv && gateEv[0]) + " at 2,49) blocks the whole width x0..4 while shut", !!gateEv && gShut === true, { gateEv, gShut, gateNear });
    await t.eval("Tawerna.api('TavernLife').addGatePass(() => true)");   // (the gate's own pass hook: what renown 80 would do)
    await t.wait(300);
    const gOpen = await t.json("[0,1,2,3,4].map(x => !$gameMap.eventsXyNt(x, 49).some(e => e.isNormalPriority() && !e.isThrough()))");
    t.check("...and opens (TavernLife's gate pass, as at renown 80)", gOpen.every(Boolean), { gOpen });
    await t.go(25, 2, 48, 8);
    const ups = await byName("/^Schody -> Apartamenty/");
    const aT = ups.length ? await transferOf(ups[0][0]) : null;
    r = ups.length ? await follow(ups[0][0]) : null;
    const suites = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, w: $dataMap.width, h: $dataMap.height })");
    t.check("Map025's west stairs go up through the open gate to Map026 (63x55, 53 row), which loads", ups.length === 3 && aT && aT[1] === 26 && aT[3] === 53 && suites.map === 26 && suites.w === 63 && suites.h === 55, { ups: ups.length, aT, suites });
    const s26 = await byName("/^Schody -> Pokoje/");
    r = s26.length ? await follow(s26[0][0]) : null;
    t.check("...and Map026's stairs lead back down to Map025 (x,53 facing down)", s26.length === 6 && r && r.ok && (await t.eval("$gameMap.mapId()")) === 25, { n: s26.length, r });
});
