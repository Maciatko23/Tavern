// Podgrodzie (Map111) - the poor suburb between the town's west wall and the forest, rebuilt 2026-10-22 (docs/podgrodzie/NOWE_PODGRODZIE.md,
// tools/podgrodzie2): a settlement in a palisade with a little square, the old cabins moved in, new houses with interiors (Map201-212),
// the Chata pod lasem behind the palisade. The cells come from tools/podgrodzie2/budynki.json, wnetrza/meta.json and mapowanie.json
// (read when the test starts). CDP_PORT=9461 node tests/podgrodzie_test.js
//   - the west gate on Map008 (x 0-1, rows 50-51): its four cells free, the towers beside it closed, two exits; walking left through
//     it -> Map111 in the town wall's gate (mapowanie: the landing of Map008 ev237) facing left; walking right off Map111's east
//     edge -> back in the town's gate (1,51)
//   - on Map111, by the game's own walking rules ($gameMap.isPassable both ways, RegionLayers, events and <Occupy>; TownLife's
//     residents left out - they walk about): every door front of budynki.json, every "Miejsce: <key>" of mapowanie.json (once,
//     below the characters, walk-through) and every exit reached from the gate
//   - no water of its own: no water tile on the map (Farming.isWaterTile, the game's own test) - its well is dry, water is
//     carried from the town (the user 2026-10-05: water is in the town and the tavern)
//   - RegionLayers: the town wall and the palisade level with the hero, their gates free, the roofs closed, the washing lines over him
//   - MapInfos: the new interiors (wnetrza/meta.json) under Podgrodzie with their names
//   - every door with an interior (the old cabins Map112-117 and the new houses Map201-212): by day in (the interior's landing,
//     facing up; its residents' spots there) and out again (in front of the door, facing down); at 23:00 "Zamknięte." and no
//     way in - except the houses open at any hour (budynki.json: zawsze_otwarte - the refugees' house, the almshouse)
//   (the Chata pod lasem is Homes.js's house - closed till bought: tests/field_loss_test.js)
// Shots: docs/podgrodzie/gra_*.png
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");
const P2 = path.join(__dirname, "..", "tools", "podgrodzie2");
const SHOTS = path.join(__dirname, "..", "docs", "podgrodzie");
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));

const BUD = readJson(path.join(P2, "budynki.json")).budynki;
const META = readJson(path.join(P2, "wnetrza", "meta.json")).mapy;
const MAPOWANIE = readJson(path.join(P2, "mapowanie.json"));
const point = what => {
    const p = MAPOWANIE.c_miejsca.punkty_wtyczek.find(q => q.co.indexOf(what) >= 0);
    if (!p) throw new Error("tools/podgrodzie2/mapowanie.json: brak punktu " + what);
    return p.nowe;
};
const IN_GATE = point("Map008 ev237"), IN_GATE2 = point("Map008 ev238");
const WALL = MAPOWANIE.d_strefy.mur_miasta, PAL = MAPOWANIE.d_strefy.palisada;
const SPOT_KEYS = Object.keys(MAPOWANIE.c_miejsca.stare_miejsca).concat(Object.keys(MAPOWANIE.c_miejsca.nowe_miejsca));
// the old cabins' residents: their "Miejsce: <key>_wnetrze" inside (data/Map112-117)
const OLD_RESIDENTS = { 112: ["praczka", "franek"], 113: ["drwal"], 114: ["klusownik"], 115: ["znachorka"], 116: ["szmaciarz"], 117: ["uchodzca"] };
const doors = BUD.filter(b => b.wnetrze && b.klucz !== "chata_pod_lasem").map(b => {
    const m = META[String(b.wnetrze)];
    const residents = m ? Object.entries(m.miejsca || {}).map(([k, v]) => ({ n: "Miejsce: " + k, x: v.x, y: v.y }))
        : (OLD_RESIDENTS[b.wnetrze] || []).map(k => ({ n: "Miejsce: " + k + "_wnetrze" }));
    return { map: b.wnetrze, name: b.nazwa, door: b.drzwi_id, at: b.drzwi, town: b.przed_drzwiami, landing: b.wnetrze_xy,
        always: !!b.zawsze_otwarte || !b.godziny, residents };
});

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
    const atSpot = async (key, d) => { const s = await t.json(`TownLife.spot(${JSON.stringify(key)})`); if (s) await t.locate(s[0], s[1], d); return !!s; };
    fs.mkdirSync(SHOTS, { recursive: true });
    t.check(`tools/podgrodzie2: ${doors.length} doors with interiors (budynki.json), ${SPOT_KEYS.length} spots (mapowanie.json)`, doors.length >= 18 && SPOT_KEYS.length > 19,
        doors.map(d => d.map));
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
    t.check(`walking left through the gate leads to Podgrodzie (Map111 ${IN_GATE}, the town wall's gate, facing left)`,
        out && at111.x === IN_GATE[0] && at111.y === IN_GATE[1] && at111.d === 4, at111);
    await t.eval(RESIDENTS_OFF);
    await atSpot("brama_zach", 4);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_brama_od_podgrodzia.png"));

    // ---- the whole suburb, by the game's own rules (residents left out)
    const R = await t.json(`(function(){ const w = $gameMap.width(), h = $gameMap.height(), key = (x, y) => x + "," + y;
        const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && e.eventId() < 900);
        const step = (x, y, d) => { const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d);
            if (!$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) return null; return [nx, ny]; };
        const start = ${JSON.stringify(IN_GATE)}, seen = new Set([key(start[0], start[1])]), todo = [start.slice(0, 2)];
        while (todo.length) { const [x, y] = todo.pop(); for (const d of [2, 4, 6, 8]) { const n = step(x, y, d); if (n && !seen.has(key(...n))) { seen.add(key(...n)); todo.push(n); } } }
        const spots = {}; for (const e of $gameMap.events()) { const m = /^Miejsce: (\\S+)$/.exec(e.event().name); if (m) spots[m[1]] = { x: e.x, y: e.y, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through, n: (spots[m[1]] ? spots[m[1]].n : 0) + 1 }; }
        const doors = ${JSON.stringify(BUD.map(b => ({ n: b.nazwa, id: b.drzwi_id, at: b.drzwi, front: b.przed_drzwiami })))}.map(b => {
            const e = $gameMap.event(b.id);
            return { n: b.n, id: b.id, ok: !!e && e.x === b.at[0] && e.y === b.at[1] && /^Drzwi/.test(e.event().name), front: seen.has(key(b.front[0], b.front[1])) }; });
        const exits = $gameMap.events().filter(e => /^Przejście/.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y, reached: seen.has(key(e.x, e.y)) }));
        let water = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Farming.isWaterTile && Farming.isWaterTile(x, y)) water++;
        const RL = window.RegionLayers, WALL = ${JSON.stringify(WALL)}, PAL = ${JSON.stringify(PAL)}, drwal = ${JSON.stringify((BUD.find(b => b.klucz === "drwal") || BUD[0]).drzwi)};
        let lines = 0, linesAbove = 0;
        if (RL) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ($gameMap.regionId(x, y) === 3) { lines++; if (RL.kindAt(x, y) === "above") linesAbove++; }
        return { reached: seen.size, spots, doors, exits, water,
                 spotReached: Object.fromEntries(Object.entries(spots).map(([k, s]) => [k, seen.has(key(s.x, s.y))])),
                 regions: RL ? { wall: RL.kindAt(WALL.x[0], 5), gate: RL.kindAt(WALL.brama[0][0], WALL.brama[0][1]), palisade: RL.kindAt(PAL.pierscien[0], 10),
                                 palGate: RL.kindAt(PAL.bramy.zach[1][0], PAL.bramy.zach[1][1]), roof: RL.kindAt(drwal[0], drwal[1] - 2), lines, linesAbove } : null }; })()`);
    t.check(`Podgrodzie has no water tile of its own (Farming.isWaterTile) - ${R.reached} cells walkable from the gate`, R.water === 0, R.water);
    t.check("every exit (to the town, to the harbour) reached from the gate", R.exits.length >= 3 && R.exits.every(e => e.reached), R.exits);
    const missingSpots = SPOT_KEYS.filter(k => !R.spots[k] || R.spots[k].n !== 1 || R.spots[k].prio !== 0 || !R.spots[k].through);
    t.check(`all ${SPOT_KEYS.length} TownLife spots are there once, below the characters and walk-through`, missingSpots.length === 0, missingSpots);
    const farSpots = SPOT_KEYS.filter(k => R.spots[k] && !R.spotReached[k]);
    t.check("every spot can be walked to from the gate", farSpots.length === 0, farSpots);
    const badDoors = R.doors.filter(d => !d.ok || !d.front);
    t.check(`the ${R.doors.length} doors of budynki.json stand where it says and their fronts are reached`, badDoors.length === 0, badDoors);
    t.check("RegionLayers: the town wall and the palisade level with the hero, their gates free, the roofs closed, the washing lines over him",
        R.regions && R.regions.wall === "level" && R.regions.gate === null && R.regions.palisade === "level" && R.regions.palGate === null &&
        R.regions.roof === "level" && R.regions.lines > 0 && R.regions.linesAbove === R.regions.lines, R.regions);

    // ---- the new interiors in MapInfos
    const infos = await t.json(`(function(){ const o = {}; for (const id of ${JSON.stringify(Object.keys(META).map(Number))}) { const m = $dataMapInfos[id]; o[id] = m ? [m.name, m.parentId] : null; } return o; })()`);
    const badInfos = Object.keys(META).filter(id => !infos[id] || infos[id][0] !== META[id].nazwa || infos[id][1] !== 111);
    t.check(`MapInfos: the ${Object.keys(META).length} new interiors under Podgrodzie (111) with the names of wnetrza/meta.json`, badInfos.length === 0, { badInfos, infos });

    // ---- back into the town over the east edge
    await t.locate(IN_GATE2[0], IN_GATE2[1], 6);
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
            if (d.residents.length) {
                const spots = await t.json(`$gameMap.events().filter(e => /^Miejsce: /.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through }))`);
                t.check(`${d.name}: the residents' spots ${d.residents.map(w => w.n.slice(9)).join(", ")}`,
                    d.residents.every(w => spots.some(s => s.n === w.n && (w.x === undefined || (s.x === w.x && s.y === w.y)) && s.prio === 0 && s.through)), { want: d.residents, spots });
            }
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

    // ---- shots of the square, the woodcutter's yard and the laundry by day
    if (!(await t.eval(t.onMap(111)))) await toPod(IN_GATE[0], IN_GATE[1], 4);
    await t.eval(RESIDENTS_OFF);
    await atSpot("plac", 4); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_plac.png"));
    await atSpot("drewutnia", 2); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_drwal.png"));
    await atSpot("pranie", 8); await t.frames(20);
    await t.shot(path.join(SHOTS, "gra_pranie.png"));

    // ---- at night (23:00): closed, the houses open at any hour open
    await t.setHour(23);
    await t.frames(20);
    await t.dismiss();
    await atSpot("namioty", 8); await t.frames(30);
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
