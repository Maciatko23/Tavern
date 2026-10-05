// The town's east gate to the Lord's manor (user 2026-10-04, tools/town/east_gate.py): on the crafts terrace, between two towers,
// the light path through it to the map's edge; the fire baskets' pillars blocked (RegionLayers region 2), the gate cells free;
// walking right through it -> Map024 (1,14), walking left off the manor road's third row -> back in the gate (50,51).
// Shots: docs/miasteczko/brama_lorda.png (noon), brama_lorda_noc.png (night).
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    // a key held until the transfer starts, then let go (held on, the hero walks on past the landing on the new map)
    const walkOut = async (key, map) => {
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.until("$gamePlayer.isTransferring() || $gameMap.mapId() !== " + map, 10, 30);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
    };
    await t.newGame({ map: 8, x: 46, y: 50, dir: 6, hour: 12, quiet: true });
    const cells = await t.json(`(function(){ const p = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
        return { gate: [p(50, 50), p(51, 50), p(50, 51), p(51, 51)], pillars: [p(49, 49), p(49, 53)], towers: [p(50, 49), p(50, 52)],
                 exits: $gameMap.events().filter(e => /Posiadłość Lorda/.test(e.event().name)).map(e => [e.x, e.y]),
                 banners: $gameMap.events().filter(e => /Chorągiew Lorda/.test(e.event().name)).length }; })()`);
    t.check("the gate's four cells are free, the fire baskets' pillars and the towers beside it are not", cells.gate.every(Boolean) && !cells.pillars.some(Boolean) && !cells.towers.some(Boolean), cells);
    t.check("two exits at the map's edge (51,50..51) and the Lord's two banners on the tower", JSON.stringify(cells.exits) === "[[51,50],[51,51]]" && cells.banners === 2, cells);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "brama_lorda.png"));
    await t.setHour(22);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "brama_lorda_noc.png"));
    await t.setHour(12);

    // through the gate on foot
    await t.locate(48, 50, 6);
    await walkOut("right", 8);
    const out = await t.until(t.onMap(24), 10);
    const at24 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("walking right through the gate takes the hero to the Lord's manor road (Map024 1,14, facing right)", out && at24.x === 1 && at24.y === 14 && at24.d === 6, at24);

    // back from the manor road's third row
    await t.locate(2, 16, 4);
    await walkOut("left", 24);
    const back = await t.until(t.onMap(8), 10);
    const at8 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })");
    t.check("walking left off the road's third row lands in the gate (Map008 50,51, facing left)", back && at8.x === 50 && at8.y === 51 && at8.d === 4, at8);
});
