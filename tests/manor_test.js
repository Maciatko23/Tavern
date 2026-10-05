// Lord Zaleski's manor (Map024) built from the town's tileset instead of one big picture (user 2026-10-04, tools/manor/build_manor.py):
// tileset 11, no !$Manor_Lord picture left, the door ("Drzwi dworu", Story.js finds it by name) on the cathedral gate at 20,12,
// from the road's end (1,15) the door, the forecourt and the garden's plaza reachable on foot; the towers, wings and the middle
// blocked (RegionLayers region 2 / the tileset's flags). Shots: docs/dwor/dwor_dzien.png, dwor_noc.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "dwor");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 24, x: 1, y: 15, dir: 6, hour: 11, quiet: true, minimap: false });
    const m = await t.json(`(function(){ const door = $gameMap.events().find(e => /^Drzwi dworu/.test(e.event().name));
        return { tileset: $gameMap.tilesetId(), old: $gameMap.events().filter(e => /Manor_Lord/.test(e.characterName())).length,
                 door: door && [door.x, door.y, door.characterName()] }; })()`);
    t.check("the manor is built from tileset 11, the old picture is gone, the door stands on the cathedral gate (20,12)",
        m.tileset === 11 && m.old === 0 && JSON.stringify(m.door) === '[20,12,"!$Gate_Cathedral1"]', m);

    // on foot from the road's end (tiles + blocking events, 4 ways)
    const reach = await t.json(`(function(){
        const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[1, 15]];
        const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
        seen[15 * W + 1] = 1;
        while (q.length) { const [x, y] = q.pop();
            for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) { const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
                if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
                seen[ny * W + nx] = 1; q.push([nx, ny]); } }
        const at = (x, y) => !!seen[y * W + x];
        return { doorFront: at(20, 13), lordSpots: at(21, 13) && at(19, 13), plaza: at(20, 26), east: at(36, 20),
                 intoWing: at(14, 11) || at(26, 11), intoTower: at(10, 10) || at(30, 10), intoMiddle: at(20, 8) }; })()`);
    t.check("on foot from the road: the door's front, the cells beside it (the Lord), the garden's plaza and the east lawn",
        reach.doorFront && reach.lordSpots && reach.plaza && reach.east, reach);
    t.check("...but not into the wings, the towers or the middle", !reach.intoWing && !reach.intoTower && !reach.intoMiddle, reach);

    // pictures: the manor and its forecourt
    await t.locate(20, 16, 8);
    await t.eval("$gameMap.setDisplayPos(6, 0); 0");
    await t.frames(30);
    await t.shot(path.join(SHOTS, "dwor_dzien.png"));
    await t.setHour(22);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "dwor_noc.png"));
});
