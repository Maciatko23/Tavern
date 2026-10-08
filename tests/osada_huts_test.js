// The four huts of Osada Milczących (Map120) and their interiors Map121-124 (tools/osada, docs/osada/CHATY.md; 2026-10-07):
//   - each hut's front door on Map120: walking into it -> the interior's landing (the floor cell over the doorway), facing up;
//     the landing passable and not a trap; every free floor cell of the hut reached from it by the game's own walking rules
//     (tile flags both ways, blocking events) - no closed pockets; every thing to look at and the resident reachable beside;
//     the doorway -> back on Map120 in front of the door, facing down
//   - the Silent keep hours (tools/osada/osada_data.py RESIDENTS): at 13:00 the elder stands at the circle and the other three are
//     at home (their figure in the hut, nobody at their place in the valley); at 23:00 all four at home, nobody outside
//   - pressing the action button by a resident: a gesture in popups ("Milczy. ..."), no message window; the watch's roll and the
//     carver's planks add a journal note once
//   - at night the hut is dark and its fire lights (hearth, fire pit, candles) shine - RoomLighting lights of the fire events
// Before the install: GAME_OVERLAY=tools/osada/staging/overlay (python tools/osada/build.py --overlay).
// CDP_PORT=9461 node tests/run.js osada_huts_test      Shots: docs/osada/gra_<id>.png (13:00), docs/osada/noc_<id>.png (23:00)
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");
const STAGING = path.join(__dirname, "..", "tools", "osada", "staging");
const SHOTS = path.join(__dirname, "..", "docs", "osada");
const META = id => JSON.parse(fs.readFileSync(path.join(STAGING, "Map" + id + "_meta.json"), "utf8"));

// the contract (tools/osada/osada_data.py): door on Map120, the cell in front, the resident outside / inside, home at 13:00
const HUTS = [
    { id: 121, name: "Wspólna izba", door: "Drzwi chaty 1", front: [8, 17], out: "Milcząca przy grządce", in: "Milcząca ogrodniczka", home13: true },
    { id: 122, name: "Chata tkaczki", door: "Drzwi chaty 2", front: [29, 15], out: "Milcząca przy ścianie", in: "Milcząca tkaczka", home13: true },
    { id: 123, name: "Chata Najstarszego", door: "Drzwi chaty 3", front: [29, 26], out: "Najstarszy z Milczących", in: "Najstarszy z Milczących", home13: false,
      note: "Rejestr straży" },
    { id: 124, name: "Chata rzeźbiarza", door: "Drzwi chaty 4", front: [8, 26], out: "Milczący przy ścianie", in: "Milczący rzeźbiarz", home13: true,
      note: "Deski rzeźbiarza" },
];
const where = "[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()]";
// a resident by name: shown (a figure, same as characters) or not
const SEEN = n => `(function(){ const e = $gameMap.events().find(e => e.event().name === ${JSON.stringify(n)}); if (!e) return "missing";
    return e.characterName() && e.isNormalPriority() && !e.isThrough() ? "here" : "gone"; })()`;
// every free cell from (x, y) by the game's rules
const REACH = (x, y) => `(function(){ const W = $gameMap.width(), H = $gameMap.height(), key = (x, y) => y * W + x;
    const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
    const seen = new Set([key(${x}, ${y})]), q = [[${x}, ${y}]];
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(key(nx, ny))) continue;
        if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
        seen.add(key(nx, ny)); q.push([nx, ny]); } }
    window.__seen = seen; return seen.size; })()`;
const SEEN_AT = "(function(x, y){ return window.__seen.has(y * $gameMap.width() + x); })";

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    fs.mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 120, x: 20, y: 31, dir: 8, day: 3, hour: 13, quiet: true, minimap: false });
    await t.frames(70);
    const out13 = {};
    for (const h of HUTS) out13[h.out] = await t.json(SEEN(h.out));
    t.check("13:00 in the valley: the elder at the circle, the other three not at their places (at home)",
        out13["Najstarszy z Milczących"] === "here" && HUTS.filter(h => h.home13).every(h => out13[h.out] === "gone"), out13);
    const doors = await t.json(`$gameMap.events().filter(e => /^Drzwi chaty \\d$/.test(e.event().name)).map(e => [e.event().name, e.x, e.y,
        e.event().pages[0].trigger, (e.event().pages[0].list.find(c => c.code === 201) || {}).parameters])`);
    t.check("Map120: four hut doors, touched -> Map121-124", doors.length === 4 && HUTS.every(h => doors.some(d => d[0] === h.door && d[3] === 1 && d[4] && d[4][1] === h.id)), doors);
    const side = await t.json(`$gameMap.events().filter(e => /^Boczne drzwi/.test(e.event().name)).map(e => e.event().pages[0].list.some(c => c.code === 201))`);
    t.check("hut 3's side door stays shut (no transfer)", side.length === 1 && side[0] === false, side);

    for (const h of HUTS) {
        const m = META(h.id), land = m.exits[0].landing, exitXY = [m.exits[0].x, m.exits[0].y];
        t.check(`${h.name}: its staged exit goes back before ${h.door} (${h.front})`, JSON.stringify(m.exits[0].town) === JSON.stringify(h.front), m.exits[0]);
        // ---- in through the door (walk into it)
        if (!(await t.eval(t.onMap(120)))) await t.go(120, h.front[0], h.front[1], 8);
        await t.setHour(13);
        await t.locate(h.front[0], h.front[1], 8);
        await t.until("!SceneManager._scene.isFading() && !$gameMap.isEventRunning()", 10, 100);
        await t.hold("up", 24);
        const inOk = await t.until(t.onMap(h.id), 20);
        await t.until("!$gamePlayer.isTransferring() && !$gameMap.isEventRunning()", 10, 100);
        await t.frames(70);
        const at = await t.json(where);
        t.check(`${h.name}: walking into the door -> Map${h.id} on its landing (${land[0]},${land[1]}) facing up`,
            inOk && at[0] === h.id && at[1] === land[0] && at[2] === land[1] && at[3] === 8, { at, land });
        if (!inOk) continue;
        await t.calm();
        // ---- walking: the landing, the pockets, the things, the resident
        const n = await t.json(REACH(land[0], land[1]));
        const W = await t.json(`(function(){ const S = ${SEEN_AT}, free = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) &&
                !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
            const floor = ${JSON.stringify(m.floor.map(c => [c[0], c[1]]))}, looks = ${JSON.stringify(m.looks)};
            const near = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => S(x + dx, y + dy));
            return { landingOut: [2, 4, 6].filter(d => $gameMap.isPassable(${land[0]}, ${land[1]}, d)).length,
                     pockets: floor.filter(([x, y]) => free(x, y) && !S(x, y)), exit: S(${exitXY[0]}, ${exitXY[1]}),
                     looks: looks.filter(([x, y]) => !near(x, y)).map(l => l[2]),
                     resident: ${JSON.stringify(m.residents.map(r => [r.x, r.y]))}.every(([x, y]) => near(x, y)) }; })()`);
        t.check(`${h.name}: ${n} cells walkable from the landing; the landing leads on, no closed pocket, the doorway reached`,
            W.landingOut >= 1 && W.pockets.length === 0 && W.exit, W);
        t.check(`${h.name}: every thing to look at (${m.looks.length}) and the resident can be stood beside`, W.looks.length === 0 && W.resident, W);
        // ---- the resident at 13:00
        const res = await t.json(SEEN(h.in));
        t.check(`${h.name}: at 13:00 '${h.in}' is ${h.home13 ? "at home" : "out (at the circle)"}`, res === (h.home13 ? "here" : "gone"), res);
        if (h.home13) {
            const r = m.residents[0];
            const spot = [[0, 1, 8], [-1, 0, 6], [1, 0, 4], [0, -1, 2]].map(([dx, dy, d]) => [r.x + dx, r.y + dy, d]);
            const okSpot = await t.json(`${JSON.stringify(spot)}.find(([x, y]) => (${SEEN_AT})(x, y)) || null`);
            await t.popups({ clear: true });
            await t.locate(okSpot[0], okSpot[1], okSpot[2]);
            await t.frames(3);
            await t.press("ok");
            await t.until("!$gameMap.isEventRunning()", 5, 50);
            await t.frames(10);
            const pp = await t.popups({ clear: true });
            const msg = await t.json("$gameMessage.isBusy()");
            t.check(`${h.name}: the action button by '${h.in}' - a silent gesture in popups, no message window`,
                pp.length >= 1 && /^Milczy\./.test(pp[0]) && !msg, { pp, msg });
        }
        await t.locate(land[0], land[1], 8);
        await t.frames(30);
        await t.shot(path.join(SHOTS, "gra_" + h.id + ".png"));
        // ---- a journal note (the elder's roll, the carver's planks)
        if (h.note) {
            const lk = m.looks.find(l => l[2] === (h.id === 123 ? "Rejestr straży" : "Deski ze znakami"));
            const st = await t.json(`[[0, 1, 8], [-1, 0, 6], [1, 0, 4]].map(([dx, dy, d]) => [${lk[0]} + dx, ${lk[1]} + dy, d]).find(([x, y]) => (${SEEN_AT})(x, y))`);
            const before = await t.json("(window.Journal ? Journal.data().notes.length : -1)");
            await t.locate(st[0], st[1], st[2]);
            await t.frames(3);
            await t.press("ok");
            await t.until("!$gameMap.isEventRunning()", 5, 50);
            await t.press("ok");          // (the second look: only the short line, no new note)
            await t.until("!$gameMap.isEventRunning()", 5, 50);
            const notes = await t.json("(window.Journal ? Journal.data().notes.map(n => n.title) : [])");
            t.check(`${h.name}: looking at '${lk[2]}' adds the journal note '${h.note}' once`,
                notes.filter(x => x === h.note).length === 1 && notes.length === before + 1, { notes, before });
        }
        // ---- the night: everyone at home, the fire lights
        await t.setHour(23);
        await t.frames(90);
        const night = await t.json(`(function(){ const set = SceneManager._scene._spriteset, holes = set.roomLightHoles ? set.roomLightHoles() : [];
            const ids = holes.map(h => h.sprite._eventId);
            const fires = $gameMap.events().filter(e => /<Light:/.test(e.event().note) && !/LightWhen:day|LightCone/.test(e.event().note));
            return { holes: holes.length, fires: fires.map(e => [e.event().name, ids.includes(e.eventId())]), dark: $gameMap.isDarkMap ? $gameMap.isDarkMap() : null,
                     note: /<Dark:on>/.test($dataMap.note) }; })()`);
        const hearth = night.fires.filter(f => /Palenisko|Kominek/.test(f[0]));
        t.check(`${h.name}: at 23:00 dark, and its fires shine (${night.fires.length} flames: ${night.fires.map(f => f[0]).join(", ")})`,
            night.note && hearth.length >= 1 && hearth.every(f => f[1]) && night.fires.filter(f => f[1]).length >= 1, night);
        const res23 = await t.json(SEEN(h.in));
        t.check(`${h.name}: at 23:00 '${h.in}' is at home`, res23 === "here", res23);
        await t.locate(land[0], land[1], 8);
        await t.frames(30);
        await t.shot(path.join(SHOTS, "noc_" + h.id + ".png"));
        // ---- out through the doorway
        await t.setHour(13);
        await t.locate(land[0], land[1], 2);
        await t.frames(2);
        await t.hold("down", 40);
        const outOk = await t.until(t.onMap(120), 20);
        await t.until("!$gamePlayer.isTransferring()", 10, 100);
        await t.frames(10);
        const b = await t.json(where);
        t.check(`${h.name}: out through the doorway -> Map120 before ${h.door} (${h.front}) facing down`,
            outOk && b[1] === h.front[0] && b[2] === h.front[1] && b[3] === 2, { b, want: h.front });
        await t.calm();
    }

    // ---- 23:00 in the valley: nobody outside
    if (!(await t.eval(t.onMap(120)))) await t.go(120, 20, 31, 8);
    await t.setHour(23);
    await t.frames(90);
    const out23 = {};
    for (const h of HUTS) out23[h.out] = await t.json(SEEN(h.out));
    t.check("23:00 in the valley: all four Silent gone home", HUTS.every(h => out23[h.out] === "gone"), out23);
    await t.setHour(13);
    await t.frames(90);
    t.check("...and at 13:00 the elder is back at the circle", (await t.json(SEEN("Najstarszy z Milczących"))) === "here");
    await t.locate(29, 26, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "gra_osada_chata3.png"));
});
