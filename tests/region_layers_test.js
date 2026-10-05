// RegionLayers.js (user 2026-10-04): region 1 under the hero (always walkable), 2 level with him (always blocked), 3 over him (the
// buildings' autotiles and the B-E pictures drawn over him, walkable as the ground says). On the town (Map008, first paint by
// tools/town/paint_layers.py): the hall's facade and its arcade are blocked, the hero walking up stops in front of the hall and goes
// in only through the gate (event 22). Regions 1 and 3 are tried on a facade cell set for the test; the F9 colours.
// Shots: docs/miasteczko/warstwy_region3.png, warstwy_f9.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const api = await t.json(`(function(){ const a = Tawerna.api("RegionLayers"); return a && { b: a.BELOW, l: a.LEVEL, a: a.ABOVE, win: window.RegionLayers === a }; })()`);
    t.check("RegionLayers is loaded (T.api and window.RegionLayers) with the regions 1 / 2 / 3", api && api.b === 1 && api.l === 2 && api.a === 3 && api.win, api);

    await t.newGame({ map: 8, x: 19, y: 18, dir: 8, hour: 12, quiet: true });
    const walk = "(x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))";
    const cells = await t.json(`(function(){ const k = (x, y) => RegionLayers.kindAt(x, y), p = ${walk};
        return { facade: [k(19, 15), p(19, 15)], arcade: [k(20, 9), p(20, 9)], street: [k(19, 18), p(19, 18)], gate: [k(24, 17), p(24, 17)] }; })()`);
    t.check("the hall's facade (19,15) and its arcade (20,9) are region 2 and blocked; the street (19,18) and the cell in front of the gate (24,17) are free",
        cells.facade[0] === "level" && !cells.facade[1] && cells.arcade[0] === "level" && !cells.arcade[1] && cells.street[0] === null && cells.street[1] && cells.gate[0] === null && cells.gate[1], cells);

    // walking up against the facade (FreeMovement's own steps): the hero stops on the street, before he walked 3 rows into the wall
    await t.locate(19, 18, 8);
    await t.hold("up", 90);
    const stop = await t.json("({ y: $gamePlayer.y, ry: +$gamePlayer._realY.toFixed(2), map: $gameMap.mapId() })");
    // (FreeMovement: the feet at the wall's foot = realY 16.5 on cell 17; before the paint he got to row 14)
    t.check("walking up at the hall's front the hero stops in front of it (row 17)", stop.map === 8 && stop.y === 17 && stop.ry >= 16.5, stop);

    // through the gate: walking up into it takes him into the tavern
    // (where it lands: the gate event's own transfer - Map001 50,53 since the tavern's v2 rebuild, 50,82 before)
    const to = await t.json("(function(){ const c = $dataMap.events[22].pages[0].list.find(c => c.code === 201); return c ? c.parameters.slice(1, 4) : null; })()");
    await t.locate(24, 17, 8);
    await t.hold("up", 40);
    const inside = await t.until(t.onMap(1), 10);
    const at1 = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("walking up into the gate (event 22 at 24,16) takes the hero into the tavern, where the gate's transfer says (Map001 " + (to ? to[1] + "," + to[2] : "?") + ")",
        inside && !!to && to[0] === 1 && at1.x === to[1] && at1.y === to[2], { at1, to });

    // regions 1 and 3 on a facade cell, set in the page for the test (the town has none of them yet)
    await t.go(8, 19, 17, 8);
    const setRegion = r => t.json(`(function(){ const W = $dataMap.width, H = $dataMap.height; $dataMap.data[5 * W * H + 15 * W + 20] = ${r};
        SceneManager._scene._spriteset._tilemap.refresh(); return 0; })()`);
    const layers = () => t.json(`(function(){ const tm = SceneManager._scene._spriteset._tilemap; return { lower: tm._lowerLayer.size(), upper: tm._upperLayer.size() }; })()`);
    const before = await layers();
    await setRegion(1);
    await t.frames(3);
    const r1 = await t.json(`(function(){ const p = ${walk}; return { kind: RegionLayers.kindAt(20, 15), walk: p(20, 15) }; })()`);
    t.check("region 1 on the facade cell (20,15): walkable", r1.kind === "below" && r1.walk, r1);
    await setRegion(3);
    await t.frames(3);
    const r3 = await t.json(`(function(){ const p = ${walk}; return { kind: RegionLayers.kindAt(20, 15), walk: p(20, 15) }; })()`);
    const lifted = await layers();
    t.check("region 3 on it: walkable (nothing but wall there), its wall tiles move from the lower layer to the one over the hero",
        r3.kind === "above" && r3.walk && lifted.upper > before.upper && lifted.lower < before.lower, { r3, before, lifted });
    await t.locate(20, 15, 2);
    await t.frames(10);
    await t.shot(path.join(SHOTS, "warstwy_region3.png"));
    await t.locate(19, 17, 8);   // (the same view as before: the layers hold only the tiles on the screen)
    await setRegion(2);
    await t.frames(3);
    const back = await layers();
    t.check("region 2 again: blocked, the layers as they were", back.upper === before.upper && back.lower === before.lower
        && !(await t.eval(`(${walk})(20, 15)`)), { before, back });

    // the colours over the map (F9 -> "Warstwy z regionów: pokaż kolory")
    await t.locate(19, 18, 8);
    await t.eval("RegionLayers.overlay = true; 0");
    await t.frames(10);
    const ov = await t.json(`(function(){ const s = SceneManager._scene._spriteset._layersOverlay; return s && { vis: s.visible, w: s.bitmap && s.bitmap.width, h: s.bitmap && s.bitmap.height, sx: s.scale.x }; })()`);
    t.check("the F9 colours: one pixel a cell (52x69) scaled to the tiles, shown over the map", ov && ov.vis && ov.w === 52 && ov.h === 69 && ov.sx === 48, ov);
    await t.shot(path.join(SHOTS, "warstwy_f9.png"));
    await t.eval("RegionLayers.overlay = false; 0");
    await t.frames(3);
    t.check("...and hidden again", !(await t.eval("SceneManager._scene._spriteset._layersOverlay.visible")));
});
