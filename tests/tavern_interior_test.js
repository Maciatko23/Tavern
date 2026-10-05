// The new tavern interior (Map001 101x84 ground floor, Map025/Map026 upper floors, tileset 8 flags): every room reachable
// from the entrance, the doors out to the yard (Map008) and back through the gate, the loose brick to the cellar (Map009)
// and back, the stairs up and down, the gameplay hook events, Borgar's talk with his bust, no console errors.
//   node tests/tavern_interior_test.js                    (after tools/apply_tavern_interior.py installed it)
//   GAME_OVERLAY=tools/tavern/staging/install_preview node tests/tavern_interior_test.js
//                                                           (before: the files the install would write, served over data/)
const kit = require("./lib/kit.js");
const path = require("path");
const OUT = path.join(__dirname, "..", "tools", "tavern", "staging", "renders");

// the rooms of the ground floor (tools/tavern/v2/v2layout.py ROOMS_MAP: floor rectangles; the second build, 2026-10-05: the old
// 101x84 frame's empty top 29 rows cut off, the map is 101x55)
const ROOMS = {
    "Stare mury": [5, 5, 13, 10], "Skład": [3, 14, 15, 22], "Browar": [17, 8, 27, 16], "Spiżarnia": [29, 8, 35, 16], "Kuchnia": [37, 8, 53, 16],
    "Piekarnia": [55, 8, 63, 16], "Wędzarnia": [65, 8, 71, 16], "Pokój służby": [73, 8, 83, 16], "Gabinet Borgara": [87, 5, 95, 10], "Magazyn": [85, 14, 97, 22],
    "Korytarz": [17, 20, 83, 22], "Pokój myśliwski": [3, 27, 15, 38], "Sala biesiadna": [17, 27, 35, 38], "Wielka sala": [37, 27, 63, 44], "Sala ze sceną": [65, 27, 83, 38],
    "Pokój gier": [85, 27, 97, 38], "Łaźnia": [3, 43, 23, 53], "Jadalnia prywatna": [25, 43, 35, 53], "Palarnia i czytelnia": [65, 43, 75, 53], "Sala rzutek": [77, 43, 97, 53],
    "Sień": [37, 49, 63, 53]
};
const LANDING = [50, 53];
const HOOKS = ["board", "dice", "darts", "arm", "bath", "stage", "meal", "mealtable", "attendant"];

kit.test({ bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    await t.newGame({ map: 8, x: 24, y: 17, dir: 8, quiet: true });   // (in front of the tavern's gate, the hall since 2026-10-04)
    // the transfer an event would make (its first Transfer Player command, any page) - followed as the event would
    const transferOf = eid => t.json(`(function(){ const e = $dataMap.events[${eid}]; if (!e) return null; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0) return c.parameters; return null; })()`);
    const follow = async eid => { const tr = await transferOf(eid); if (!tr) return null; const ok = await t.go(tr[1], tr[2], tr[3], tr[4]); return { to: tr.slice(1, 5), ok }; };

    // ---- in through the gate (Map008 event 22): the vestibule, facing up
    let r = await follow(22);
    const at = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), w: $dataMap.width, h: $dataMap.height })");
    t.check("the yard's gate (Map008 event 22) leads into the vestibule (Map001 50,53, facing up)", r && r.ok && at.map === 1 && at.x === LANDING[0] && at.y === LANDING[1] && at.d === 8 && at.w === 101 && at.h === 55, { r, at });

    // ---- every room reachable on foot from the entrance (tiles + blocking events, 4 ways)
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
        return { rooms: out, total: seen.reduce((a, v) => a + v, 0), brick: cell(9, 5), stairsW: [37, 38, 39].map(x => cell(x, 48)), stairsE: [61, 62, 63].map(x => cell(x, 48)),
            exits: [49, 50, 51].map(x => cell(x, 54)), fromAbove: [61, 62, 63].map(x => cell(x, 53)), counter: cell(52, 31) && cell(48, 31) };
    })()`);
    const poor = Object.entries(reach.rooms).filter(([n, [c, all]]) => c < all * 0.35).map(([n, v]) => n + " " + v.join("/"));
    t.check("every room of the ground floor can be walked into from the entrance (at least a third of its floor open)", poor.length === 0 && reach.total > 2000, { poor, total: reach.total });
    t.check("...the loose brick's front, both staircases, the doorway, the landing from above and both sides of Borgar's counter (his talk, a meal)",
        reach.brick && reach.stairsW.every(Boolean) && reach.stairsE.every(Boolean) && reach.exits.every(Boolean) && reach.fromAbove.every(Boolean) && reach.counter, reach);

    // ---- the gameplay hooks (TavernLife / TavernDice / QuestBoard read them by their tag)
    const hooks = await t.json(`(function(){ const out = {}; for (const e of $dataMap.events) { if (!e) continue; for (const c of e.pages[0].list) { const m = c.code === 108 && /<Tavern:\\s*([A-Za-z]+)/.exec(c.parameters[0]); if (m) { (out[m[1]] = out[m[1]] || []).push([e.x, e.y]); break; } } } return out; })()`);
    const missing = HOOKS.filter(h => !hooks[h]);
    t.check("the hook events are all there: " + HOOKS.join(", "), missing.length === 0 && hooks.mealtable.length >= 4 && hooks.dice.length >= 2 && hooks.bath.length >= 2, { missing, counts: Object.fromEntries(Object.entries(hooks).map(([k, v]) => [k, v.length])) });

    // ---- Borgar: his talk with his bust
    await t.locate(52, 31, 8);
    await t.frames(10);
    const bust = await t.eval("window.SpeechBubbles && SpeechBubbles.bustOf ? SpeechBubbles.bustOf($gameMap.event(1)) : null");
    await t.eval("$gameMap.event(1).start(); 0");
    await t.frames(60);
    // (his bust in the other speaker's corner, SpeechBubbles.NPC_SIDE - an older plugin without it: the right one)
    const talk = await t.json(`(function(){ const L = SceneManager._scene._talkBusts, side = (window.SpeechBubbles && SpeechBubbles.NPC_SIDE) || "right", R = L && L._sides && L._sides[side]; return { running: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(), side, shown: !!(R && R.sprite && R.sprite.visible), name: R && R.name || (R && R.sprite && R.sprite.bitmap && R.sprite.bitmap.url) || null }; })()`);
    t.check("talking to Borgar across the counter: a talk with his bust (People3_5)", bust === "People3_5" && talk.running && talk.msg && talk.shown, { bust, talk });
    await t.shot(path.join(OUT, "test_borgar.png"));
    await t.eval("$gameMap._interpreter.clear(); $gameMessage.clear(); 0"); await t.frames(30);   // (the talk put away)

    // ---- out through the doorway (events 10..12) to the yard, and back in
    const outs = [];
    for (const eid of [10, 11, 12]) outs.push(await transferOf(eid));
    r = await follow(10);
    const yard = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, pass: $gameMap.isPassable($gamePlayer.x, $gamePlayer.y, 2) })");
    t.check("the doorway (events 10..12 at 49..51,54) leads out in front of the gate (Map008 23..25,17)", outs.every(o => o && o[1] === 8 && o[3] === 17) && yard.map === 8 && yard.x === 23 && yard.y === 17, { outs, yard });
    r = await follow(22);
    t.check("...and the gate leads back in", r && r.ok && (await t.eval("$gameMap.mapId()")) === 1, r);

    // ---- the loose brick (event 9) down to the cellar and back up in front of it
    const down = await transferOf(9);
    r = await follow(9);
    const cellar = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    const up = await transferOf(1);
    t.check("the loose brick (event 9) leads down to the cellar (Map009 10,8)", down && down[1] === 9 && cellar.map === 9 && cellar.x === 10 && cellar.y === 8, { down, cellar });
    r = await follow(1);
    const back = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), brick: $gameMap.eventsXy(9, 4).some(e => e.eventId() === 9), free: $gameMap.isPassable(9, 5, 8) })");
    t.check("...and the cellar's stairs (Map009 event 1) back up in front of the brick (9,5), facing down", up && up[1] === 1 && up[2] === 9 && up[3] === 5 && back.map === 1 && back.x === 9 && back.y === 5 && back.brick && back.free, { up, back });

    // ---- the stairs: up from the vestibule to the guest rooms, down again below the east staircase
    const stairs = await t.json(`$gameMap.events().filter(e => /Schody/.test(e.event().name)).map(e => [e.eventId(), e.x, e.y])`);
    const upT = stairs.length ? await transferOf(stairs.find(s => s[1] === 62)[0]) : null;
    r = stairs.length ? await follow(stairs.find(s => s[1] === 62)[0]) : null;
    const upper = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, name: $gameMap.displayName(), w: $dataMap.width })");
    t.check("six stair events on the top steps (37..39 and 61..63, 47); up leads to Map025 (48,62)", stairs.length === 6 && upT && upT[1] === 25 && upper.map === 25 && upper.x === 48 && upper.y === 62, { stairs: stairs.length, upT, upper });
    const downs = await t.json(`(function(){ const out = []; for (const e of $dataMap.events) { if (!e) continue; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] === 1) out.push([e.id, c.parameters.slice(2, 5)]); } return out; })()`);
    r = downs.length ? await follow(downs[0][0]) : null;
    const below = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("...and Map025's stairs lead down below the east staircase (61..63,53), facing down", downs.length > 0 && downs.every(([id, d]) => d[0] >= 61 && d[0] <= 63 && d[1] === 53) && below.map === 1 && below.y === 53 && below.d === 2, { downs, below });
    await t.shot(path.join(OUT, "test_down.png"));
    // (Map026, the suites: it loads)
    const suites = await t.go(26, 40, 40, 2);
    t.check("Map026 (Apartamenty) loads", suites && (await t.eval("$dataMap.width")) > 0);
});
