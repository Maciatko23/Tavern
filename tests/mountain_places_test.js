// The mountain world of W8 "Żelazna Pięść" (tools/mountains, docs/miasta_miejsca_zadan.md "Góry"; 2026-10-06) - maps, ways in and
// out, markers; no quest logic:
//   - the 3x3 board (2026-11-08, Swiat_Data.js): the town (Map008) north gate (x 24-26) leads on to the Lord's manor map (Map024, its
//     south edge); Map013 "Góry i kamieniołom" (the board's north-east corner, the old map sits 24 rows lower) is entered from Łąka pod
//     Gawrą (Map004, its north edge, x 2..60 -> Map013's south edge) and from the manor map (Map024's east edge -> Map013's west edge)
//   - Map013: the markers (12 keys), each reachable on foot from both ways in; the steps up both shelves; the quarry's things
//     (the raven in the wall, blocks, the crane, the dry pond: no water tile in the mountains - the sea only along the board's north
//     and east rim); the cave's mouth (44,31) -> Map014
//   - Map014 "Jaskinia": the camp (fire = a light, lanterns), the guard and diggers standing (no human enemies: <Humans:off>),
//     Marek at his marker facing the wall; the way out -> Map013 (44,8)
//   - the tunnel: closed while switch 15 is off (the rubble blocks, a popup, no transfer) on both sides - Map014 (3,9) and floor 50
//     Map149 (37,8); with the switch on the passages lead to each other
//   - since 2026-11-11 Map013's wooden gate (6,27) is gone (an ordinary passage) and the Osada Milczących stands on Łąka pod Gawrą
//     (Map004, Osada.js, ids 5300-5399): the palisade's gate (66,56) is closed while switch 16 is off (it blocks, a popup), with the
//     switch on the hero walks through; its 9 markers; the huts' doors to Map121-124
// Shots: docs/gory/ (gory_wejscie, kamieniolom, kamieniolom_znak, jaskinia_wejscie, oboz_kopaczy, marek, tunel_zawal, tunel_otwarty,
// pietro50_przekop, brama_milczacych, osada, osada_krag).
// CDP_PORT=9466 node tests/run.js mountain_places_test
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "gory");

const REACH = (x, y) => `(function(){
    const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[${x}, ${y}]];
    const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
    seen[${y} * W + ${x}] = 1;
    while (q.length) { const [x, y] = q.pop();
        for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) { const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
            if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
            seen[ny * W + nx] = 1; q.push([nx, ny]); } }
    window.__reach = seen; return seen.reduce((a, b) => a + b, 0); })()`;
const MARKERS = `(function(){ const o = {}; for (const e of $gameMap.events()) { const m = /^Miejsce:\\s*(\\S+)/.exec(e.event().name);
    if (m) o[m[1]] = [e.x, e.y, e.event().pages[0].image.direction, e.isThrough(), e._priorityType]; } return o; })()`;
const REACHED = keys => `(function(){ const M = ${MARKERS}, W = $gameMap.width(), out = {};
    for (const k of ${JSON.stringify(keys)}) { const m = M[k]; if (!m) { out[k] = "missing"; continue; }
        const at = (x, y) => x >= 0 && y >= 0 && x < W && y < $gameMap.height() && !!window.__reach[y * W + x];
        out[k] = at(m[0], m[1]) || at(m[0], m[1] + 1) || at(m[0], m[1] - 1) || at(m[0] - 1, m[1]) || at(m[0] + 1, m[1]); } return out; })()`;
const byName = n => `$gameMap.events().find(e => e.event().name === ${JSON.stringify(n)})`;
const where = "({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })";

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const walkOut = async (key, map, secs = 10) => {
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.until("$gamePlayer.isTransferring() || $gameMap.mapId() !== " + map, secs, 30);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
    };
    const bump = async (key, frames = 40) => {        // walk into something and stay (a blocked cell, a touch event)
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.frames(frames);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
        await t.frames(10);
    };
    const sw = (id, v) => t.eval(`(function(){ $gameSwitches.setValue(${id}, ${v}); $gameMap.requestRefresh(); return 0; })()`);
    const popups = async () => (await t.popups({ clear: true })).join(" | ");

    // ================================================================ the town (Map008) -> the manor map; Łąka (Map004) -> Góry (the board, Swiat_Data.js)
    await t.newGame({ map: 8, x: 25, y: 2, dir: 8, day: 3, hour: 10, quiet: true, minimap: false });
    await walkOut("up", 8);
    const in24 = await t.until(t.onMap(24), 15);
    const at24 = await t.json(where);
    t.check("walking up through the town's north gate (8: x 24-26) -> the Lord's manor map (Map024, its south edge, x 24-26), facing up", in24 && at24.x >= 24 && at24.x <= 26 && at24.y >= 118 && at24.d === 8, at24);
    await t.go(4, 41, 1, 8);
    await walkOut("up", 4);
    const in13 = await t.until(t.onMap(13), 15);
    const at13 = await t.json(where);
    t.check("walking up off Łąka pod Gawrą's north edge (Map004, x 41) -> Map013 'Góry i kamieniołom' (its south edge, x 40..42; the held key may have moved him a step), facing up", in13 && at13.x >= 40 && at13.x <= 42 && at13.y >= 118 && at13.d === 8, at13);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "gory_wejscie.png"));

    // ================================================================ Map013: markers, reach, water
    const keys13 = ["gory_wejscie", "grum_przewodnik_start", "gory_schody", "nocleg", "kamieniolom", "kamieniolom_znak", "blok_kruk", "dzwig",
        "staw_suchy", "kamieniolom_schody", "punkt_widokowy", "jaskinia_wejscie"];
    const n13 = await t.json(REACH(at13.x, at13.y));
    const r13 = await t.json(REACHED(keys13));
    const m13 = await t.json(MARKERS);
    t.check("Map013: all 12 markers 'Miejsce: <key>' are there (below the hero, through, no picture) and reachable on foot from the way in from Łąka (south edge)",
        keys13.every(k => m13[k] && m13[k][3] && m13[k][4] === 0 && r13[k] === true), { n13, r13 });
    const nW = await t.json(REACH(2, 63));
    const rW = await t.json(REACHED(keys13));
    t.check("...and from the way in from the manor map (the west edge, marker 'gory_wejscie' 1,63) as well", keys13.every(k => rW[k] === true), { nW, rW });
    const w13 = await t.json(`(function(){ let n = 0; for (let y = 32; y < $gameMap.height(); y++) for (let x = 0; x < 80; x++)
        for (let z = 0; z < 4; z++) if (Tilemap.isTileA1($gameMap.tileId(x, y, z))) n++; return n; })()`);
    t.check("Map013: no water tile in the mountains (x 0-79, y 32 down; the drought, the quarry pond is dry mud - the sea lies only along the board's north and east rim)", w13 === 0, w13);
    const q = await t.json(`({ raven: !!${byName("Kruk wykuty w ścianie kamieniołomu")}, crane: !!${byName("Ruina dźwigu")},
        blocks: $gameMap.events().filter(e => /^Ciosan/.test(e.event().name)).length, pond: !!${byName("Suchy staw w kamieniołomie")},
        ore: $gameMap.events().filter(e => /Rock_Ore_Iron/.test(e.characterName())).length,
        steps: [$gameMap.isPassable(22, 55, 8), $gameMap.isPassable(56, 41, 8)] })`);
    t.check("the quarry: the raven in the wall, the crane's ruin, cut blocks, the dry pond, iron ore to mine; both flights of steps walkable",
        q.raven && q.crane && q.blocks >= 6 && q.pond && q.ore >= 4 && q.steps.every(Boolean), q);
    await t.locate(40, 45, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "kamieniolom.png"));
    await t.locate(40, 42, 8);
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(20);
    const rv = await popups();
    t.check("before the raven in the quarry wall, OK -> a popup about the order's sign (no message window)", /Kruk wykuty w skale/.test(rv), rv);
    await t.shot(path.join(SHOTS, "kamieniolom_znak.png"));

    // ================================================================ the cave
    await t.locate(44, 32, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "jaskinia_wejscie.png"));
    await walkOut("up", 13);
    const in14 = await t.until(t.onMap(14), 15);
    const at14 = await t.json(where);
    t.check("into the cave's mouth (44,31) -> Map014 'Jaskinia' (20,27) facing up", in14 && at14.x === 20 && at14.y === 27 && at14.d === 8, at14);
    const keys14 = ["jaskinia_wyjscie", "oboz_kopaczy", "straz_obozu", "kopacz_przodek", "kopacz_ognisko", "kopacz_wozek", "marek", "namiot_dowodcy",
        "list_kryjowka", "tunel_wejscie", "tunel_brama"];
    await t.json(REACH(20, 27));
    const r14 = await t.json(REACHED(keys14));
    const camp = await t.json(`({ lights: $gameMap.events().filter(e => /<Light:/.test(e.event().note) && !/LightWhen:day/.test(e.event().note)).length,
        fire: !!${byName("Ognisko kopaczy")}, guard: (${byName("Strażnik obozu")} || {}).characterName ? ${byName("Strażnik obozu")}.characterName() : "",
        diggers: $gameMap.events().filter(e => e.event().name === "Kopacz" && e.characterName() === "$Npc_Kopacz").length,
        marek: (function(){ const m = ${byName("Marek")}; return m ? [m.x, m.y, m.direction(), m.characterName()] : null; })(),
        humans: window.Humans ? (Humans.list || []).length : 0 })`);
    t.check("Map014: the 11 markers reachable from the mouth", keys14.every(k => r14[k] === true), r14);
    t.check("the camp: a fire and lanterns (flames), the guard in the mercenary's look, 3 diggers ($Npc_Kopacz), Marek at his marker (30,5) facing the wall ($Npc_Marek), no human enemies",
        camp.fire && camp.lights >= 5 && camp.guard === "$Human_Merc" && camp.diggers === 3 && camp.marek && camp.marek[0] === 30 && camp.marek[1] === 5 &&
        camp.marek[2] === 8 && camp.marek[3] === "$Npc_Marek" && camp.humans === 0, camp);
    await t.locate(18, 18, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "oboz_kopaczy.png"));
    await t.locate(30, 7, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "marek.png"));

    // ================================================================ the tunnel (switch 15)
    await sw(15, false);
    await t.locate(3, 10, 8);
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(20);
    const pz = await popups();
    await bump("up", 40);
    const still14 = await t.json(where);
    t.check("switch 15 off: the tunnel's end is rubble - OK gives a popup, walking into it does nothing (still on Map014)",
        /Zawał/.test(pz) && still14.map === 14 && still14.y === 10, { pz, still14 });
    await t.shot(path.join(SHOTS, "tunel_zawal.png"));
    await sw(15, true);
    await t.frames(10);
    await t.shot(path.join(SHOTS, "tunel_otwarty.png"));
    await t.locate(3, 10, 8);
    await walkOut("up", 14);
    const in149 = await t.until(t.onMap(149), 20);
    const at149 = await t.json(where);
    t.check("switch 15 on: walking into the dug passage -> floor 50 Map149 (37,9) facing down", in149 && at149.x === 37 && at149.y === 9 && at149.d === 2, at149);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "pietro50_przekop.png"));
    await t.locate(37, 9, 8);
    await walkOut("up", 149);
    const back14 = await t.until(t.onMap(14), 20);
    const atb = await t.json(where);
    t.check("...and from floor 50 back up the passage -> Map014 (3,10)", back14 && atb.x === 3 && atb.y === 10, atb);
    await sw(15, false);
    await t.go(149, 37, 9, 8);
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(20);
    const pz50 = await popups();
    await bump("up", 40);
    const still149 = await t.json(where);
    t.check("switch 15 off on floor 50: its passage is rubble too (a popup, no way through)", /zasypany/.test(pz50) && still149.map === 149, { pz50, still149 });

    // ================================================================ out of the cave
    await t.go(14, 20, 27, 2);
    await walkOut("down", 14);
    const out13 = await t.until(t.onMap(13), 15);
    const ato = await t.json(where);
    t.check("out of the cave (the bottom edge) -> Map013 before the mouth (44,32) facing down", out13 && ato.x === 44 && ato.y === 32 && ato.d === 2, ato);

    // ================================================================ Map013 (6,27): the wooden gate is gone (2026-11-11), the gap is an ordinary passage
    const g13 = await t.json(`(function(){ return { gate: $gameMap.events().filter(e => /Brama Milcz/.test(e.event().name) || e.event().pages.some(p => p.list.some(c => c.code === 201 && c.parameters[1] === 120))).length,
        mark: !!${byName("Miejsce: osada_brama")}, open: [$gameMap.isPassable(6, 27, 2), $gameMap.isPassable(6, 27, 8), $gameMap.isPassable(6, 28, 8), $gameMap.isPassable(6, 26, 2)] }; })()`);
    t.check("Map013: no gate or posts at (6,27), no transfer to Map120 and no 'osada_brama' marker; the gap is walkable both ways",
        g13.gate === 0 && !g13.mark && g13.open.every(Boolean), g13);

    // ================================================================ the Osada on Łąka pod Gawrą (Map004; Osada.js injects ids 5300-5399), the gate (66,56) in the palisade (switch 16)
    await t.go(4, 66, 58, 8);
    await t.frames(30);
    await sw(16, false);
    await t.json(REACH(66, 58));
    const keys120 = ["osada_wejscie", "osada_krag", "osada_sciana", "osada_grum", "osada_starszy", "osada_dom_1", "osada_dom_2", "osada_dom_3", "osada_dom_4"];
    const m4 = await t.json(MARKERS);
    const shut = await t.json(REACHED(keys120));
    t.check("switch 16 off: from before the gate (66,58) the Osada's inside is not reachable (only the outside marker is); 'osada_brama' (66,57) is there; all 9 markers stand on Map004",
        shut.osada_wejscie === true && keys120.filter(k => k !== "osada_wejscie").every(k => shut[k] === false) && m4.osada_brama && m4.osada_brama[0] === 66 && m4.osada_brama[1] === 57
        && keys120.every(k => m4[k]), { shut, m4: Object.keys(m4).filter(k => /osada/.test(k)) });
    await t.locate(66, 57, 8);
    await t.frames(30);
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(20);
    const pg = await popups();
    await bump("up", 40);
    const gate = await t.json(`({ at: ${where}, blocked: ${byName("Brama Milczących")}.isNormalPriority(), xy: [${byName("Brama Milczących")}.x, ${byName("Brama Milczących")}.y] })`);
    t.check("...the gate (66,56) is closed - a popup, the hero stays before it", /Brama z pali/.test(pg) && gate.at.y === 57 && gate.blocked && gate.xy[0] === 66 && gate.xy[1] === 56, { pg, gate });
    await t.frames(20);
    await t.shot(path.join(SHOTS, "brama_milczacych.png"));
    await sw(16, true);
    await t.frames(10);
    await t.json(REACH(66, 58));
    const res = await t.json(`$gameMap.events().filter(e => /Milcz/.test(e.event().name)).map(e => e.characterName())`);
    const open = await t.json(REACHED(keys120));
    t.check("switch 16 on: through the open gate - the 9 markers reachable; the Silent standing there", keys120.every(k => open[k] === true) && res.length >= 4, { open, res });
    await t.locate(66, 57, 8);
    await bump("up", 100);
    t.check("...the hero walks through the gate (66,56) into the village", (await t.json(`$gamePlayer.y`)) <= 55, await t.json(where));
    await t.frames(30);
    await t.shot(path.join(SHOTS, "osada.png"));
    await t.locate(65, 51, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "osada_krag.png"));
    await sw(16, false);
    const doors = await t.json(`$gameMap.events().filter(e => /^Drzwi chaty/.test(e.event().name)).map(e => e.event().pages[0].list.find(c => c.code === 201)).map(c => c && c.parameters[1])`);
    t.check("the four huts' doors lead to the interiors Map121-124", JSON.stringify(doors.slice().sort()) === "[121,122,123,124]", doors);

    // ================================================================ back to Łąka
    await t.go(13, 41, 119, 2);
    await walkOut("down", 13);
    const in4 = await t.until(t.onMap(4), 15);
    const at4 = await t.json(where);
    t.check("walking down off Map013's south edge (x 40-42) -> Łąka pod Gawrą's north edge (Map004, x 40-42), facing down", in4 && at4.x >= 40 && at4.x <= 42 && at4.y <= 2 && at4.d === 2, at4);
});
