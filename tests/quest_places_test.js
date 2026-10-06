// The places of the town's quest threads (tools/quest_places, docs/miasta_miejsca_zadan.md; 2026-10-05) - maps and ways in and out,
// no quest logic:
//   - the market well (Map008): "Studnia miejska: zejście" (25,34) refuses without 2x Lina (a popup over the hero, no message
//     window), with two asks and lets one down to Map118 "Dno studni" (7,6); the water ration events 241/242 stay; at the bottom
//     no water tile anywhere (the puddle is a picture), the markers lina / pierscionek / krata_kruk, the light of the shaft by
//     day; the rope takes one back up beside the well (26,34)
//   - the knights' garden slab (Map008 (6,12)): page 1 is nothing (walk over it, the action button does nothing); with its
//     self-switch A the opened slab leads down to Map119 "Archiwum zakonu" (2,4); there candles (every light a flame), the
//     markers kroniki / ksiega_sygnalow / schody; the stairs lead back up beside the slab (6,13)
//   - the manor (Map024): the orangery's markers standable and reachable from the road's end (1,15), the guard's round a loop of
//     reachable cells, the back gate closed (blocks) / open on self-switch A (passable), the orangery's door locked (a popup)
// Shots (docs/miejsca_zadan/): dno_studni_dzien/noc, zejscie_do_studni, plyta_otwarta, archiwum, archiwum_noc, oranzeria_dzien/noc.
// CDP_PORT=9461 node tests/quest_places_test.js
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miejsca_zadan");
const LINA = 93;

// the walking reach from a cell (tiles both ways + the blocking events, <Occupy> cells included through Game_Event.pos)
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
const AT = (x, y) => `!!window.__reach[${y} * $gameMap.width() + ${x}]`;
const MARKERS = `(function(){ const o = {}; for (const e of $gameMap.events()) { const m = /^Miejsce:\\s*(\\S+)/.exec(e.event().name);
    if (m) o[m[1]] = [e.x, e.y, e.event().pages[0].image.direction, e.isThrough(), e._priorityType, e.characterName(), e.list().length]; } return o; })()`;
const byName = n => `$gameMap.events().find(e => e.event().name === ${JSON.stringify(n)})`;

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    // a choice on the screen (SpeechBubbles shows it beside the question): pick the one that starts with `label`
    const pick = async label => {
        const up = await t.until("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active && $gameMessage.isChoice())", 15);
        if (!up) return "no choice";
        return t.json(`(function(){ const cw = SceneManager._scene._choiceListWindow, labels = $gameMessage.choices();
            const i = labels.findIndex(l => l.indexOf(${JSON.stringify(label)}) === 0); if (i < 0) return labels;
            cw.select(i); cw.deactivate(); cw.callOkHandler(); return labels; })()`);
    };

    // ================================================================ the well
    await t.newGame({ map: 8, x: 26, y: 34, dir: 4, day: 3, hour: 11, quiet: true, minimap: false });
    const well = await t.json(`(function(){ const d = ${byName("Studnia miejska: zejście")};
        return { down: d && [d.eventId(), d.x, d.y, d._priorityType, d.isThrough()], rations: $gameMap.events().filter(e => e.event().name === "Studnia miejska").map(e => [e.eventId(), e.x, e.y, e.event().note]) }; })()`);
    t.check("the market well keeps its two ration events (241/242, <Studnia:2>) and has 'Studnia miejska: zejście' on its east stones (25,34)",
        well.down && well.down[1] === 25 && well.down[2] === 34 && well.down[0] < 355 && well.rations.length === 2 &&
        well.rations.every(r => r[2] === 35 && /<Studnia:2>/.test(r[3])), well);
    await t.eval(`$gameParty.loseItem($dataItems[${LINA}], 999); 0`);
    const refuse = async () => {
        await t.popups({ clear: true });
        await t.locate(26, 34, 4);
        await t.frames(5);
        await t.press("ok");
        await t.frames(40);
        return { pops: await t.popups({ clear: true }), map: await t.json("$gameMap.mapId()"), msg: await t.json("$gameMessage.isBusy()") };
    };
    const r0 = await refuse();
    t.check("without a rope: facing the well from the east, OK -> the popup 'Potrzebujesz 2× Lina...' over the hero, no message, still in town",
        r0.pops.some(p => /Potrzebujesz 2× Lina, żeby zejść do studni/.test(p)) && r0.map === 8 && !r0.msg, r0);
    await t.give(LINA, 1);
    const r1 = await refuse();
    t.check("...with one rope the same", r1.pops.some(p => /2× Lina/.test(p)) && r1.map === 8 && !r1.msg, r1);
    await t.give(LINA, 1);
    await t.frames(240);                                   // (the popups and the gain notes fade first: the picture)
    await t.locate(26, 34, 4);
    await t.frames(5);
    await t.press("ok");
    await t.until("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)", 15);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "zejscie_do_studni.png"));
    const q = await pick("Zejść");
    const down = await t.until(t.onMap(118), 20);
    await t.frames(30);
    const bottom = await t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, ropes: $gameParty.numItems($dataItems[${LINA}]),
        name: $dataMap.displayName, tileset: $gameMap.tilesetId() })`);
    t.check("with 2x Lina: a question with a choice ('Zejść' / 'Zostać'), then down to Map118 'Dno studni' below the rope (7,6)",
        Array.isArray(q) && q[0] === "Zejść" && down && bottom.map === 118 && bottom.x === 7 && bottom.y === 6 && bottom.name === "Dno studni", { q, bottom });
    await t.calm();
    const dry = await t.json(`(function(){ const W = $gameMap.width(), H = $gameMap.height(); let a1 = 0, wet = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { for (let z = 0; z < 4; z++) { const id = $gameMap.tileId(x, y, z); if (Tilemap.isTileA1(id) || Tilemap.isWaterTile(id)) a1++; }
            if (window.Farming && Farming.isWaterTile && Farming.isWaterTile(x, y)) wet++; }
        const wells = $gameMap.events().filter(e => /<Studnia/i.test(e.event().note)).length;
        const puddle = ${byName("Płytka kałuża")};
        return { a1, wet, wells, puddle: puddle && [puddle.x, puddle.y, puddle.characterName(), puddle._priorityType, puddle.list().length] }; })()`);
    t.check("at the bottom no water tile anywhere (nothing to drink or draw): the puddle is a picture under the hero, no <Studnia> event",
        dry.a1 === 0 && dry.wet === 0 && dry.wells === 0 && dry.puddle && dry.puddle[2] === "!Quest_Places" && dry.puddle[3] === 0 && dry.puddle[4] <= 1, dry);
    const m118 = await t.json(MARKERS);
    await t.eval(REACH(7, 6));
    const reach118 = await t.json(`({ ring: ${AT(5, 6)}, grate: ${AT(5, 4)}, rope: ${AT(7, 5)} })`);
    t.check("its markers: 'Miejsce: lina' (7,5) on the rope, 'pierscionek' (5,6) in the puddle, 'krata_kruk' (5,4) before the grate - invisible, through, empty",
        JSON.stringify(m118.lina.slice(0, 2)) === "[7,5]" && JSON.stringify(m118.pierscionek.slice(0, 2)) === "[5,6]" && JSON.stringify(m118.krata_kruk.slice(0, 3)) === "[5,4,8]" &&
        Object.values(m118).every(m => m[3] && m[4] === 0 && m[5] === "" && m[6] <= 1), m118);
    t.check("...the ring's and the grate's spots are reachable from where one lands; the rope's cell is the rope (blocked)",
        reach118.ring && reach118.grate && !reach118.rope, reach118);
    const light = await t.json(`(function(){ const ev = $gameMap.events().map(e => e.event().note).filter(n => /<Light/.test(n));
        const holes = SceneManager._scene._spriteset && SceneManager._scene._spriteset.roomLightHoles ? SceneManager._scene._spriteset.roomLightHoles().length : -1;
        return { notes: ev, holes, dark: /<Dark:on>/.test($dataMap.note), cave: /<Ambience:cave>/.test($dataMap.note), quiet: $dataMap.autoplayBgm && !$dataMap.bgm.name }; })()`);
    t.check("the shaft's light: a soft light by day, a cone with dust, a faint moon at night (<Dark:on> map); the town's music stops, the cave's drips",
        light.dark && light.notes.some(n => /<LightSoft><LightWhen:day>/.test(n)) && light.notes.some(n => /LightCone.*when=day/.test(n)) &&
        light.notes.some(n => /<LightWhen:night>/.test(n)) && light.holes > 0 && light.cave && light.quiet, light);
    await t.locate(5, 5, 2);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "dno_studni_dzien.png"));
    await t.setHour(23);
    await t.frames(60);
    await t.shot(path.join(SHOTS, "dno_studni_noc.png"));
    await t.setHour(11);
    // back up the rope
    await t.locate(7, 6, 8);
    await t.frames(5);
    await t.press("ok");
    const q2 = await pick("Wspiąć się");
    const up = await t.until(t.onMap(8), 20);
    await t.frames(20);
    const top = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("the rope: OK -> 'Wspiąć się po linie na górę?' -> back in town beside the well (26,34)",
        Array.isArray(q2) && q2[0] === "Wspiąć się" && up && top.map === 8 && top.x === 26 && top.y === 34, { q2, top });

    // ================================================================ the slab in the knights' garden
    await t.go(8, 6, 13, 8);
    await t.calm();
    const slab = await t.json(`(function(){ const e = ${byName("Płyta w ścieżce (ogród rycerzy)")}, m = ${byName("Miejsce: plyta")};
        return { id: e && e.eventId(), at: e && [e.x, e.y], page: e && e._pageIndex, pic: e && e.characterName(), through: e && e.isThrough(), prio: e && e._priorityType,
                 list: e && e.list().length, marker: m && [m.x, m.y] }; })()`);
    t.check("the slab (6,12) on page 1 is nothing: no picture, walk-through, under the hero, no commands; the marker 'Miejsce: plyta' on it",
        slab.id && slab.id < 355 && JSON.stringify(slab.at) === "[6,12]" && slab.page === 0 && slab.pic === "" && slab.through && slab.prio === 0 && slab.list <= 1 &&
        JSON.stringify(slab.marker) === "[6,12]", slab);
    await t.press("ok");
    await t.frames(30);
    await t.hold("up", 30);
    await t.frames(10);
    const over = await t.json("({ map: $gameMap.mapId(), y: $gamePlayer.y, run: $gameMap.isEventRunning() })");
    t.check("...the action button facing it does nothing, and one walks over it (still in the garden)", over.map === 8 && over.y <= 12 && !over.run, over);
    await t.eval(`$gameSelfSwitches.setValue([8, ${slab.id}, "A"], true); 0`);
    await t.locate(6, 13, 8);
    await t.frames(20);
    const open = await t.json(`(function(){ const e = $gameMap.event(${slab.id}); return { page: e._pageIndex, pic: e.characterName(), prio: e._priorityType, through: e.isThrough() }; })()`);
    t.check("with its self-switch A: the opened slab with the stairs down (!Quest_Places), standing like a thing (blocks)",
        open.page === 1 && open.pic === "!Quest_Places" && open.prio === 1 && !open.through, open);
    await t.locate(8, 12, 4);
    await t.eval("$gameMap.setDisplayPos(0, 4); 0");
    await t.frames(30);
    await t.shot(path.join(SHOTS, "plyta_otwarta.png"));
    await t.locate(6, 13, 8);
    await t.frames(5);
    await t.press("ok");
    const arch = await t.until(t.onMap(119), 20);
    await t.frames(30);
    const inArch = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, name: $dataMap.displayName })");
    t.check("...OK facing it: down the stairs into Map119 'Archiwum zakonu', at the bottom of the stairs (2,4)",
        arch && inArch.map === 119 && inArch.x === 2 && inArch.y === 4 && inArch.name === "Archiwum zakonu", inArch);
    await t.calm();
    const m119 = await t.json(MARKERS);
    await t.eval(REACH(2, 4));
    const reach119 = await t.json(`({ kroniki: ${AT(10, 5)}, ksiega: ${AT(6, 6)}, schody: ${AT(2, 4)} })`);
    t.check("its markers: 'kroniki' (10,5) before the chronicles, 'ksiega_sygnalow' (6,6) before the lectern, 'schody' (2,4) - all reachable",
        JSON.stringify(m119.kroniki.slice(0, 3)) === "[10,5,8]" && JSON.stringify(m119.ksiega_sygnalow.slice(0, 3)) === "[6,6,8]" && JSON.stringify(m119.schody.slice(0, 2)) === "[2,4]" &&
        reach119.kroniki && reach119.ksiega && reach119.schody, { m119, reach119 });
    await t.setHour(22);
    await t.frames(60);
    const lights = await t.json(`(function(){ const ls = $gameMap.events().filter(e => /<Light:/.test(e.event().note));
        const holes = SceneManager._scene._spriteset.roomLightHoles();
        return { n: ls.length, names: ls.map(e => e.event().name), holes: holes.length, flicker: !!(window.RoomLighting || true) }; })()`);
    t.check("the archive's lights are flames: the lectern's candles, two candelabras, the candles on the table and by the chests (5 lights, lit)",
        lights.n >= 5 && lights.holes >= 5 && lights.names.includes("Pulpit z Księgą sygnałów") && lights.names.filter(n => n === "Kandelabr").length === 2, lights);
    await t.locate(6, 7, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "archiwum_noc.png"));
    await t.setHour(12);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "archiwum.png"));
    // up the stairs: walking into them
    await t.locate(2, 4, 8);
    await t.frames(5);
    await t.hold("up", 20);
    const back = await t.until(t.onMap(8), 20);
    await t.frames(20);
    const garden = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("the stairs (walking into them) lead back up into the garden, beside the slab (6,13)", back && garden.map === 8 && garden.x === 6 && garden.y === 13, garden);
    await t.eval(`$gameSelfSwitches.setValue([8, ${slab.id}, "A"], false); 0`);

    // ================================================================ the orangery (Map024)
    await t.go(24, 1, 15, 6);
    await t.calm();
    const m24 = await t.json(MARKERS);
    await t.eval(REACH(1, 15));
    const want = ["oranzeria_wejscie", "pompa_oranzeria", "szuflada_ogrodnika", "woz_furtka", "straz_1", "straz_2", "straz_3", "straz_4"];
    const reach24 = {};
    for (const k of want) reach24[k] = m24[k] ? await t.json(AT(m24[k][0], m24[k][1])) : "missing";
    t.check("the orangery's markers stand on free cells reachable from the road's end (1,15): the door's front, the pump, the drawer, the cart outside the gate, the guard's four",
        want.every(k => reach24[k] === true) && !!m24.tylna_furtka, { reach24, m24 });
    const loop = await t.json(`(function(){ const pts = ${JSON.stringify(["straz_1", "straz_2", "straz_3", "straz_4"])}.map(k => (${MARKERS})[k]);
        const W = $gameMap.width(), blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
        // each leg a straight line of walkable cells (the guard can walk it with any path-finder, or straight)
        const legs = [];
        for (let i = 0; i < 4; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 4], d = ax === bx ? (by > ay ? 2 : 8) : (bx > ax ? 6 : 4);
            let x = ax, y = ay, ok = ax === bx || ay === by;
            while (ok && (x !== bx || y !== by)) { const nx = x + Math.sign(bx - x), ny = y + Math.sign(by - y);
                if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) ok = false; x = nx; y = ny; }
            legs.push(ok); }
        return { pts, legs }; })()`);
    t.check("the guard's round straz_1 -> 2 -> 3 -> 4 -> 1 is a loop of straight walkable legs round the west garden, past the orangery",
        loop.legs.length === 4 && loop.legs.every(Boolean), loop);
    const gate = await t.json(`(function(){ const e = ${byName("Tylna furtka")}; const shut = { through: e.isThrough(), prio: e._priorityType, pic: e.characterName() };
        $gameSelfSwitches.setValue([24, e.eventId(), "A"], true); e.refresh();
        const open = { through: e.isThrough(), prio: e._priorityType, page: e._pageIndex };
        $gameSelfSwitches.setValue([24, e.eventId(), "A"], false); e.refresh();
        return { at: [e.x, e.y], shut, open, gap: $gameMap.isPassable(5, 25, 4) && $gameMap.isPassable(5, 25, 6) }; })()`);
    t.check("the back gate in the west hedge (5,25): closed it blocks, on its self-switch A it opens (walk-through); the hedge has the gap",
        JSON.stringify(gate.at) === "[5,25]" && !gate.shut.through && gate.shut.prio === 1 && gate.open.through && gate.open.page === 1 && gate.gap, gate);
    await t.locate(7, 25, 2);
    await t.eval("$gameMap.setDisplayPos(0, 15); 0");
    await t.frames(60);
    await t.shot(path.join(SHOTS, "oranzeria_dzien.png"));
    await t.setHour(23);
    await t.frames(60);
    await t.shot(path.join(SHOTS, "oranzeria_noc.png"));
    await t.setHour(11);
    await t.popups({ clear: true });
    await t.locate(7, 24, 8);
    await t.frames(5);
    await t.press("ok");
    await t.frames(30);
    const door = await t.popups({ clear: true });
    t.check("the orangery's door is locked (OK in front of it: the popup 'Zamknięte.'); a lantern by it lights at night",
        door.some(p => /Zamknięte/.test(p)) && /<Light:.*<LightWhen:night>/.test(await t.json(`${byName("Drzwi oranżerii")}.event().note`)), door);
});
