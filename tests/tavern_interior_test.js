// The new tavern interior (Map001 101x84 ground floor, Map025/Map026 upper floors, tileset 8 flags): every room reachable
// from the entrance, the doors out to the yard (Map008) and back through the gate, the loose brick to the cellar (Map009)
// and back, the stairs up and down, the gameplay hook events, Borgar's talk with his bust, no console errors.
//   node tests/tavern_interior_test.js                    (after tools/apply_tavern_interior.py installed it)
//   GAME_OVERLAY=tools/tavern/staging/install_preview node tests/tavern_interior_test.js
//                                                           (before: the files the install would write, served over data/)
const { launch, sleep } = require("./cdp");
const fs = require("fs");
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

(async () => {
    const b = await launch();
    const ev = b.evaluate, J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const until = async (expr, tries = 60) => { for (let i = 0; i < tries; i++) { if (await ev(expr).catch(() => false)) return true; await sleep(300); } return false; };
    const onMap = id => `SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId()===${id}`;
    const quiet = "SceneManager._scene.startFadeIn(1,false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting && Hunting.auto) Hunting.auto(false); $gameSystem._minimapHidden = true; 0";
    const go = async (id, x, y, d) => {
        await ev(`$gamePlayer.reserveTransfer(${id}, ${x}, ${y}, ${d || 2}, 0); 0`);
        const ok = await until(onMap(id));
        await frames(20); await ev(quiet);
        return ok;
    };
    // the transfer an event would make (its first Transfer Player command, any page) - followed as the event would
    const transferOf = (eid) => J(`(function(){ const e = $dataMap.events[${eid}]; if (!e) return null; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0) return c.parameters; return null; })()`);
    const follow = async (eid) => { const t = await transferOf(eid); if (!t) return null; const ok = await go(t[1], t[2], t[3], t[4]); return { to: t.slice(1, 5), ok }; };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        const booted = await until("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')", 120);
        check("the game boots", booted);
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(8, 14, 10, 8, 0); SceneManager.goto(Scene_Map); return 0; })()`);
        await until(onMap(8), 80);
        await frames(30); await ev(quiet);

        // ---- in through the gate (Map008 event 7): the vestibule, facing up
        let r = await follow(7);
        const at = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), w: $dataMap.width, h: $dataMap.height })");
        check("the yard's gate (Map008 event 7) leads into the vestibule (Map001 50,82, facing up)", r && r.ok && at.map === 1 && at.x === LANDING[0] && at.y === LANDING[1] && at.d === 8 && at.w === 101 && at.h === 84, { r, at });

        // ---- every room reachable on foot from the entrance (tiles + blocking events, 4 ways)
        const reach = await J(`(function(){
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
        check("every room of the ground floor can be walked into from the entrance (at least a third of its floor open)", poor.length === 0 && reach.total > 3000, { poor, total: reach.total });
        check("...the loose brick's front, both staircases, the doorway, the landing from above and Borgar's counter too",
            reach.brick && reach.stairsW.every(Boolean) && reach.stairsE.every(Boolean) && reach.exits.every(Boolean) && reach.fromAbove.every(Boolean) && reach.counter, reach);

        // ---- the gameplay hooks (TavernLife / TavernDice / QuestBoard read them by their tag)
        const hooks = await J(`(function(){ const out = {}; for (const e of $dataMap.events) { if (!e) continue; for (const c of e.pages[0].list) { const m = c.code === 108 && /<Tavern:\\s*([A-Za-z]+)/.exec(c.parameters[0]); if (m) { (out[m[1]] = out[m[1]] || []).push([e.x, e.y]); break; } } } return out; })()`);
        const missing = HOOKS.filter(h => !hooks[h]);
        check("the hook events are all there: " + HOOKS.join(", "), missing.length === 0 && hooks.mealtable.length >= 4 && hooks.dice.length >= 2 && hooks.bath.length >= 2, { missing, counts: Object.fromEntries(Object.entries(hooks).map(([k, v]) => [k, v.length])) });

        // ---- Borgar: his talk with his bust
        await ev("$gamePlayer.locate(50, 64); $gamePlayer.setDirection(4); 0");
        await frames(10);
        const bust = await ev("window.SpeechBubbles && SpeechBubbles.bustOf ? SpeechBubbles.bustOf($gameMap.event(1)) : null");
        await ev("$gameMap.event(1).start(); 0");
        await frames(60);
        const talk = await J(`(function(){ const L = SceneManager._scene._talkBusts, R = L && L._sides && L._sides.right; return { running: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(), right: !!(R && R.sprite && R.sprite.visible), name: R && R.name || (R && R.sprite && R.sprite.bitmap && R.sprite.bitmap.url) || null }; })()`);
        check("talking to Borgar across the counter: a talk with his bust (People3_5)", bust === "People3_5" && talk.running && talk.msg && talk.right, { bust, talk });
        await b.shot(path.join(OUT, "test_borgar.png"));
        await ev("$gameMap._interpreter.clear(); $gameMessage.clear(); 0"); await frames(30);   // (the talk put away)

        // ---- out through the doorway (events 10..12) to the yard, and back in
        const outs = [];
        for (const eid of [10, 11, 12]) outs.push(await transferOf(eid));
        r = await follow(10);
        const yard = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, pass: $gameMap.isPassable($gamePlayer.x, $gamePlayer.y, 2) })");
        check("the doorway (events 10..12 at 49..51,83) leads out in front of the gate (Map008 13..15,10)", outs.every(t => t && t[1] === 8 && t[3] === 10) && yard.map === 8 && yard.x === 13 && yard.y === 10, { outs, yard });
        r = await follow(7);
        check("...and the gate leads back in", r && r.ok && (await ev("$gameMap.mapId()")) === 1, r);

        // ---- the loose brick (event 9) down to the cellar and back up in front of it
        const down = await transferOf(9);
        r = await follow(9);
        const cellar = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
        const up = await transferOf(1);
        check("the loose brick (event 9) leads down to the cellar (Map009 10,8)", down && down[1] === 9 && cellar.map === 9 && cellar.x === 10 && cellar.y === 8, { down, cellar });
        r = await follow(1);
        const back = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), brick: $gameMap.eventsXy(4, 3).some(e => e.eventId() === 9), free: $gameMap.isPassable(4, 4, 8) })");
        check("...and the cellar's stairs (Map009 event 1) back up in front of the brick (4,4), facing down", up && up[1] === 1 && up[2] === 4 && up[3] === 4 && back.map === 1 && back.x === 4 && back.y === 4 && back.brick && back.free, { up, back });

        // ---- the stairs: up from the vestibule to the guest rooms, down again below the east staircase
        const stairs = await J(`$gameMap.events().filter(e => /Schody/.test(e.event().name)).map(e => [e.eventId(), e.x, e.y])`);
        const upT = stairs.length ? await transferOf(stairs.find(s => s[1] === 62)[0]) : null;
        r = stairs.length ? await follow(stairs.find(s => s[1] === 62)[0]) : null;
        const upper = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, name: $gameMap.displayName(), w: $dataMap.width })");
        check("six stair events on the top steps (37..39 and 61..63, 76); up leads to Map025 (48,62)", stairs.length === 6 && upT && upT[1] === 25 && upper.map === 25 && upper.x === 48 && upper.y === 62, { stairs: stairs.length, upT, upper });
        const downs = await J(`(function(){ const out = []; for (const e of $dataMap.events) { if (!e) continue; for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] === 1) out.push([e.id, c.parameters.slice(2, 5)]); } return out; })()`);
        r = downs.length ? await follow(downs[0][0]) : null;
        const below = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
        check("...and Map025's stairs lead down below the east staircase (61..63,82), facing down", downs.length > 0 && downs.every(([id, t]) => t[0] >= 61 && t[0] <= 63 && t[1] === 82) && below.map === 1 && below.y === 82 && below.d === 2, { downs, below });
        await b.shot(path.join(OUT, "test_down.png"));
        // (Map026, the suites: it loads)
        const suites = await go(26, 40, 40, 2);
        check("Map026 (Apartamenty) loads", suites && (await ev("$dataMap.width")) > 0);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const errs = b.logs.filter(l => /EXC|Failed to load|rror/.test(l));
    check("no console errors", errs.length === 0, errs.slice(-5));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(results.every(Boolean) ? 0 : 1);
})();
