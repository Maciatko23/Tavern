// Podgrodzie (Map111) - the poor quarter outside the town's west wall (user 2026-10-05: "wyjście z mapy na zachód ... mapa z
// domkami drewnianymi i wnętrzami i mieszkańcami"; tools/podgrodzie, tools/town/west_gate.py). CDP_PORT=9461 node tests/podgrodzie_test.js
//   - the west gate on Map008 (by the smithy, between two towers): its four cells free, the towers beside it closed, two exits;
//     walking left through it -> Map111 (44,17) facing left; walking right off Map111's east edge -> back in the gate (1,51)
//   - on Map111, by the game's own walking rules ($gameMap.isPassable both ways, RegionLayers, events and <Occupy>; TownLife's
//     residents left out - they walk about): every door front, every "Miejsce: <key>" spot and both exits reached from the gate
//   - no water of its own: no water tile on the map (Farming.isWaterTile, the game's own test) - its well is dry, water is
//     carried from the town (the user 2026-10-05: water is in the town and the tavern)
//   - RegionLayers: the town wall level with the hero (closed), the gate free, the washing line over the hero
//   - the six doors: by day in (the interior's landing, facing up; its resident spots there) and out again (the front, facing
//     down); at 23:00 "Zamknięte." and no way in - except the refugees' house, open at any hour
// Shots: docs/podgrodzie/gra_*.png
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");
const STAGING = path.join(__dirname, "..", "tools", "podgrodzie", "staging");
const SHOTS = path.join(__dirname, "..", "docs", "podgrodzie");

const meta = JSON.parse(fs.readFileSync(path.join(STAGING, "Map111_meta.json"), "utf8"));
const inner = [112, 113, 114, 115, 116, 117].map(id => JSON.parse(fs.readFileSync(path.join(STAGING, "Map" + id + "_meta.json"), "utf8")));
const doors = [];
for (const m of inner) for (const ex of m.exits) {
    const b = meta.buildings.find(bb => bb.event_id === ex.door);
    doors.push({ map: m.id, name: m.display, door: ex.door, town: ex.town, landing: ex.landing, exit: [ex.x, ex.y], always: !b.hours, residents: m.residents });
}
const SPOT_KEYS = ["brama_zach", "plac", "studnia_sucha", "kapliczka", "pranie", "drewutnia", "kram", "ziola", "namioty", "zebrak", "zebrak_noc",
    "zabawa", "skraj_lasu", "praczka_drzwi", "drwal_drzwi", "klusownik_drzwi", "znachorka_drzwi", "szmaciarz_drzwi", "uchodzcy_drzwi"];
const DOOR_NAMES = ["Drzwi: Chata praczki", "Drzwi: Chata drwala", "Drzwi: Chata kłusownika", "Drzwi: Izba znachorki", "Drzwi: Kram starzyzny", "Drzwi: Dom uchodźców"];

// TownLife's residents walk about: out of the way for the checks (erased on this map until it loads again)
const RESIDENTS_OFF = "(function(){ const TL = window.TownLife; if (TL && TL.residents) for (const e of TL.residents()) e.erase(); return 0; })()";

async function knock(t, d) {
    await t.locate(d.town[0], d.town[1], 8);
    await t.until("!SceneManager._scene.isFading() && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 10, 100);
    for (let i = 0; i < 3; i++) {
        await t.locate(d.town[0], d.town[1], 8);
        await t.frames(3);
        await t.eval("window.__doorRan = false; 0");
        await t.hold("up", 20);
        if (await t.until(`window.__doorRan || $gameMap.isEventRunning() || $gamePlayer.isTransferring() || !${t.onMap(111)}`, 2, 50)) return true;
    }
    return false;
}

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const walkOut = async (key, map) => {
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.until("$gamePlayer.isTransferring() || $gameMap.mapId() !== " + map, 10, 30);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
    };
    const toPod = async (x, y, d) => { const ok = await t.go(111, x, y, d); await t.eval(RESIDENTS_OFF); return ok; };
    fs.mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 8, x: 5, y: 50, dir: 4, hour: 12, quiet: true, minimap: false });
    await t.eval(`(function(){ const _s = Game_Event.prototype.start; Game_Event.prototype.start = function() { if (/^Drzwi/.test(this.event().name)) window.__doorRan = true; return _s.apply(this, arguments); }; return 0; })()`);

    // ---- the west gate on the town map
    const gate = await t.json(`(function(){ const p = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
        return { gate: [p(0, 50), p(1, 50), p(0, 51), p(1, 51), p(2, 50), p(2, 51)], towers: [p(0, 49), p(1, 49), p(0, 52), p(1, 52)],
                 exits: $gameMap.events().filter(e => /Podgrodzie/.test(e.event().name)).map(e => [e.x, e.y]),
                 sign: $gameMap.events().filter(e => /Drogowskaz \\(brama zachodnia\\)/.test(e.event().name)).length }; })()`);
    t.check("Map008's west gate: its cells and the street before it free, the towers beside it closed", gate.gate.every(Boolean) && !gate.towers.some(Boolean), gate);
    t.check("two exits at the town's west edge (0,50..51) and the signpost", JSON.stringify(gate.exits) === "[[0,50],[0,51]]" && gate.sign === 1, gate);
    await t.locate(4, 51, 4);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_brama_od_miasta.png"));

    // ---- out through the gate on foot
    await t.locate(2, 50, 4);
    await walkOut("left", 8);
    const out = await t.until(t.onMap(111), 10);
    const at111 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("walking left through the gate leads to Podgrodzie (Map111 44,17, facing left)", out && at111.x === 44 && at111.y === 17 && at111.d === 4, at111);
    await t.eval(RESIDENTS_OFF);
    await t.locate(41, 17, 6);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_brama_od_podgrodzia.png"));

    // ---- the whole quarter, by the game's own rules (residents left out)
    const R = await t.json(`(function(){ const w = $gameMap.width(), h = $gameMap.height(), key = (x, y) => x + "," + y;
        const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && e.eventId() < 900);
        const step = (x, y, d) => { const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d);
            if (!$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) return null; return [nx, ny]; };
        const seen = new Set([key(44, 17)]), todo = [[44, 17]];
        while (todo.length) { const [x, y] = todo.pop(); for (const d of [2, 4, 6, 8]) { const n = step(x, y, d); if (n && !seen.has(key(...n))) { seen.add(key(...n)); todo.push(n); } } }
        const spots = {}; for (const e of $gameMap.events()) { const m = /^Miejsce: (\\S+)$/.exec(e.event().name); if (m) spots[m[1]] = { x: e.x, y: e.y, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through, n: (spots[m[1]] ? spots[m[1]].n : 0) + 1 }; }
        const doorEvs = $gameMap.events().filter(e => /^Drzwi: /.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y, front: seen.has(key(e.x, e.y + 1)) }));
        let water = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Farming.isWaterTile && Farming.isWaterTile(x, y)) water++;
        const RL = window.RegionLayers;
        return { reached: seen.size, spots, doorEvs, water, exits: [seen.has(key(45, 17)), seen.has(key(45, 18))],
                 spotReached: Object.fromEntries(Object.entries(spots).map(([k, s]) => [k, seen.has(key(s.x, s.y))])),
                 regions: RL ? { wall: RL.kindAt(44, 5), tower: RL.kindAt(45, 12), gate: RL.kindAt(44, 17), line: RL.kindAt(31, 28), roof: RL.kindAt(6, 4) } : null }; })()`);
    t.check(`Podgrodzie has no water tile of its own (Farming.isWaterTile) - ${R.reached} cells walkable from the gate`, R.water === 0, R.water);
    t.check("both exits reached from the gate", R.exits.every(Boolean), R.exits);
    const missingSpots = SPOT_KEYS.filter(k => !R.spots[k] || R.spots[k].n !== 1 || R.spots[k].prio !== 0 || !R.spots[k].through);
    t.check(`all ${SPOT_KEYS.length} TownLife spots are there once, below the characters and walk-through`, missingSpots.length === 0, missingSpots);
    const farSpots = SPOT_KEYS.filter(k => R.spots[k] && !R.spotReached[k]);
    t.check("every spot can be walked to from the gate", farSpots.length === 0, farSpots);
    t.check("the six doors with interiors are named as agreed and their fronts are reached", DOOR_NAMES.every(n => R.doorEvs.some(e => e.n === n && e.front)), R.doorEvs);
    t.check("RegionLayers: the wall and its tower level with the hero, the gate free, the washing line over him, the roofs closed",
        R.regions && R.regions.wall === "level" && R.regions.tower === "level" && R.regions.gate === null && R.regions.line === "above" && R.regions.roof === "level", R.regions);

    // ---- back into the town over the east edge
    await t.locate(43, 18, 6);
    await walkOut("right", 111);
    const back = await t.until(t.onMap(8), 10);
    const at8 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("walking right off Podgrodzie's east edge lands in the town's west gate (Map008 1,51, facing right)", back && at8.x === 1 && at8.y === 51 && at8.d === 6, at8);

    // ---- the doors by day: in and out
    const shot = {};
    for (const d of doors) {
        if (!(await t.eval(t.onMap(111)))) await toPod(d.town[0], d.town[1], 8);
        await t.eval(RESIDENTS_OFF);
        await t.setHour(13);
        const knocked = await knock(t, d);
        const inOk = await t.until(t.onMap(d.map), 20);
        await t.frames(10);
        const at = await t.json("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), $gameMap.mapId()]");
        t.check(`${d.name}: its door by day -> Map${d.map} on the landing ${d.landing.slice(0, 2)} facing up`,
            inOk && at[0] === d.landing[0] && at[1] === d.landing[1] && at[2] === 8, { at, want: d.landing, knocked });
        if (!inOk) continue;
        if (!shot[d.map]) {
            shot[d.map] = true;
            const spots = await t.json(`$gameMap.events().filter(e => /^Miejsce: /.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through }))`);
            const want = d.residents.map(r => ({ n: "Miejsce: " + r.key + "_wnetrze", x: r.x, y: r.y }));
            t.check(`${d.name}: the residents' spots ${want.map(w => w.n.slice(9)).join(", ")}`, want.length > 0 && want.every(w => spots.some(s => s.n === w.n && s.x === w.x && s.y === w.y && s.prio === 0 && s.through)), { want, spots });
            await t.frames(20);
            await t.shot(path.join(SHOTS, "gra_" + d.map + ".png"));
        }
        await t.locate(d.landing[0], d.landing[1], 2);
        await t.frames(2);
        await t.hold("down", 40);
        const outOk = await t.until(t.onMap(111), 20);
        await t.frames(10);
        const b = await t.json("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()]");
        t.check(`${d.name}: out through the doorway -> in front of its door ${d.town} facing down`, outOk && b[0] === d.town[0] && b[1] === d.town[1] && b[2] === 2, { b, want: d.town });
    }

    // ---- a shot of the square and the refugees' camp by day
    if (!(await t.eval(t.onMap(111)))) await toPod(26, 19, 4);
    await t.eval(RESIDENTS_OFF);
    await t.locate(25, 19, 4); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_plac.png"));
    await t.locate(9, 12, 2); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_drwal.png"));
    await t.locate(34, 30, 8); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_pranie.png"));

    // ---- at night (23:00): closed, the refugees' house open
    await t.setHour(23);
    await t.frames(20);
    await t.dismiss();
    await t.locate(39, 12, 8); await t.frames(30);
    await t.shot(path.join(SHOTS, "gra_noc_obozowisko.png"));
    for (const d of doors) {
        if (!(await t.eval(t.onMap(111)))) await toPod(d.town[0], d.town[1], 2);
        await t.eval(RESIDENTS_OFF);
        await t.popups({ clear: true });
        await knock(t, d);
        if (d.always) {
            const ok = await t.until(t.onMap(d.map), 20);
            t.check(`${d.name} is open at night too`, ok);
            await toPod(d.town[0], d.town[1], 2);
        } else {
            await t.frames(40);
            const pops = await t.popups();
            const still = await t.json("[$gameMap.mapId(), $gamePlayer.isTransferring()]");
            t.check(`${d.name} at 23:00: "Zamknięte." and no way in`, still[0] === 111 && !still[1] && pops.some(p => /Zamknięte/.test(p)), { still, pops });
        }
    }
});
