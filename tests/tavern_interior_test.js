// The new tavern interior (Map001 101x84 ground floor, Map025/Map026 upper floors, tileset 8 flags): every room reachable
// from the entrance, the doors out to the yard (Map008) and back through the gate, the loose brick to the cellar (Map009)
// and back, the stairs up and down, the gameplay hook events, Borgar's talk with his bust, no console errors.
//   node tests/tavern_interior_test.js                    (after tools/apply_tavern_interior.py installed it)
//   GAME_OVERLAY=tools/tavern/staging/install_preview node tests/tavern_interior_test.js
//                                                           (before: the files the install would write, served over data/)
const kit = require("./lib/kit.js");
const path = require("path");
const OUT = path.join(__dirname, "..", "tools", "tavern", "staging", "renders");

// the rooms of the ground floor (tools/tavern/parter_layout.py ROOMS: floor rectangles)
const ROOMS = {
    "Stare mury": [1, 4, 10, 18], "Skład": [12, 4, 25, 18], "Browar": [27, 4, 44, 18], "Pokój służby": [46, 4, 55, 18],
    "Gabinet Borgara": [57, 4, 68, 18], "Magazyn": [70, 4, 84, 18], "Wędzarnia": [86, 4, 99, 18], "Korytarz": [1, 23, 99, 25],
    "Spiżarnia": [38, 30, 62, 37], "Kuchnia": [38, 42, 49, 57], "Piekarnia": [51, 42, 62, 57], "Pokój myśliwski": [1, 30, 15, 48],
    "Sala biesiadna": [17, 30, 36, 48], "Sala ze sceną": [64, 30, 83, 48], "Pokój gier": [85, 30, 99, 48], "Łaźnia": [1, 53, 15, 69],
    "Sala rzutek": [85, 53, 99, 69], "Wielka sala": [17, 62, 83, 73], "Jadalnia prywatna": [19, 74, 35, 82],
    "Palarnia i czytelnia": [65, 74, 81, 82], "Sień": [37, 78, 63, 82]
};
const LANDING = [50, 82];
const HOOKS = ["board", "dice", "darts", "arm", "bath", "stage", "meal", "mealtable", "attendant"];

kit.test({ bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    await t.newGame({ map: 8, x: 14, y: 10, dir: 8, quiet: true });
    // the transfer an event would make (its first Transfer Player command, any page) - followed as the event would
    const transferOf = eid => t.json(`(function(){ const e = $dataMap.events[${eid}]; if (!e) return null; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0) return c.parameters; return null; })()`);
    const follow = async eid => { const tr = await transferOf(eid); if (!tr) return null; const ok = await t.go(tr[1], tr[2], tr[3], tr[4]); return { to: tr.slice(1, 5), ok }; };

    // ---- in through the gate (Map008 event 7): the vestibule, facing up
    let r = await follow(7);
    const at = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), w: $dataMap.width, h: $dataMap.height })");
    t.check("the yard's gate (Map008 event 7) leads into the vestibule (Map001 50,82, facing up)", r && r.ok && at.map === 1 && at.x === LANDING[0] && at.y === LANDING[1] && at.d === 8 && at.w === 101 && at.h === 84, { r, at });

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
        return { rooms: out, total: seen.reduce((a, v) => a + v, 0), brick: cell(4, 4), stairsW: [37, 38, 39].map(x => cell(x, 77)), stairsE: [61, 62, 63].map(x => cell(x, 77)),
            exits: [49, 50, 51].map(x => cell(x, 83)), fromAbove: [61, 62, 63].map(x => cell(x, 82)), counter: cell(50, 64) && cell(50, 65) };
    })()`);
    const poor = Object.entries(reach.rooms).filter(([n, [c, all]]) => c < all * 0.35).map(([n, v]) => n + " " + v.join("/"));
    t.check("every room of the ground floor can be walked into from the entrance (at least a third of its floor open)", poor.length === 0 && reach.total > 3000, { poor, total: reach.total });
    t.check("...the loose brick's front, both staircases, the doorway, the landing from above and Borgar's counter too",
        reach.brick && reach.stairsW.every(Boolean) && reach.stairsE.every(Boolean) && reach.exits.every(Boolean) && reach.fromAbove.every(Boolean) && reach.counter, reach);

    // ---- the gameplay hooks (TavernLife / TavernDice / QuestBoard read them by their tag)
    const hooks = await t.json(`(function(){ const out = {}; for (const e of $dataMap.events) { if (!e) continue; for (const c of e.pages[0].list) { const m = c.code === 108 && /<Tavern:\\s*([A-Za-z]+)/.exec(c.parameters[0]); if (m) { (out[m[1]] = out[m[1]] || []).push([e.x, e.y]); break; } } } return out; })()`);
    const missing = HOOKS.filter(h => !hooks[h]);
    t.check("the hook events are all there: " + HOOKS.join(", "), missing.length === 0 && hooks.mealtable.length >= 4 && hooks.dice.length >= 2 && hooks.bath.length >= 2, { missing, counts: Object.fromEntries(Object.entries(hooks).map(([k, v]) => [k, v.length])) });

    // ---- Borgar: his talk with his bust
    await t.locate(50, 64, 4);
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
    t.check("the doorway (events 10..12 at 49..51,83) leads out in front of the gate (Map008 13..15,10)", outs.every(o => o && o[1] === 8 && o[3] === 10) && yard.map === 8 && yard.x === 13 && yard.y === 10, { outs, yard });
    r = await follow(7);
    t.check("...and the gate leads back in", r && r.ok && (await t.eval("$gameMap.mapId()")) === 1, r);

    // ---- the loose brick (event 9) down to the cellar and back up in front of it
    const down = await transferOf(9);
    r = await follow(9);
    const cellar = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    const up = await transferOf(1);
    t.check("the loose brick (event 9) leads down to the cellar (Map009 10,8)", down && down[1] === 9 && cellar.map === 9 && cellar.x === 10 && cellar.y === 8, { down, cellar });
    r = await follow(1);
    const back = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), brick: $gameMap.eventsXy(4, 3).some(e => e.eventId() === 9), free: $gameMap.isPassable(4, 4, 8) })");
    t.check("...and the cellar's stairs (Map009 event 1) back up in front of the brick (4,4), facing down", up && up[1] === 1 && up[2] === 4 && up[3] === 4 && back.map === 1 && back.x === 4 && back.y === 4 && back.brick && back.free, { up, back });

    // ---- the stairs: up from the vestibule to the guest rooms, down again below the east staircase
    const stairs = await t.json(`$gameMap.events().filter(e => /Schody/.test(e.event().name)).map(e => [e.eventId(), e.x, e.y])`);
    const upT = stairs.length ? await transferOf(stairs.find(s => s[1] === 62)[0]) : null;
    r = stairs.length ? await follow(stairs.find(s => s[1] === 62)[0]) : null;
    const upper = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, name: $gameMap.displayName(), w: $dataMap.width })");
    t.check("six stair events on the top steps (37..39 and 61..63, 76); up leads to Map025 (48,62)", stairs.length === 6 && upT && upT[1] === 25 && upper.map === 25 && upper.x === 48 && upper.y === 62, { stairs: stairs.length, upT, upper });
    const downs = await t.json(`(function(){ const out = []; for (const e of $dataMap.events) { if (!e) continue; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] === 1) out.push([e.id, c.parameters.slice(2, 5)]); } return out; })()`);
    r = downs.length ? await follow(downs[0][0]) : null;
    const below = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("...and Map025's stairs lead down below the east staircase (61..63,82), facing down", downs.length > 0 && downs.every(([id, d]) => d[0] >= 61 && d[0] <= 63 && d[1] === 82) && below.map === 1 && below.y === 82 && below.d === 2, { downs, below });
    await t.shot(path.join(OUT, "test_down.png"));
    // (Map026, the suites: it loads)
    const suites = await t.go(26, 40, 40, 2);
    t.check("Map026 (Apartamenty) loads", suites && (await t.eval("$dataMap.width")) > 0);
});
