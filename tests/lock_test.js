// How long is the player locked after one blow on a rock (pickaxe) compared to a tree (axe)? Frames from the start to each state
// change, and PASS / FAIL (stage 6, 2026-09-29: it only printed the frames before - ore ~42-44 to the blow, tree ~32-34).
// The lock is the swing: the blow lands on the swing's impact frame and the player can move right after its last frame. Both come
// from the game (ChoppableTree.swingKind: the new hero's sheet timing; the rate: work speed x0.5 for rocks and standing trees).
// Recorded inside the game loop (a poll from outside can miss frames when the game runs at full speed).
const kit = require("./lib/kit.js");

kit.test({ width: 1280, height: 720 }, async t => {
    await t.newGame({ map: 3, x: 22, y: 14, hour: 12, quiet: true });
    await t.give(63, 1);   // the stone pickaxe
    await t.give(60, 1);   // the stone axe

    // the hero beside a thing on a free side, facing it
    const standBy = eid => t.json(`(function(){ const e = $gameMap.event(${eid});
        for (const [d, dx, dy] of [[8, 0, 1], [2, 0, -1], [4, 1, 0], [6, -1, 0]]) {
            const x = e.x + dx, y = e.y + dy;
            if (!$gameMap.isValid(x, y) || ![2, 4, 6, 8].some(k => $gameMap.isPassable(x, y, k))) continue;
            if ($gameMap.eventsXy(x, y).some(o => o !== e && o.isNormalPriority() && !o.isThrough())) continue;
            $gamePlayer.locate(x, y); $gamePlayer.setDirection(d); $gameMap.setDisplayPos(x - 10, y - 7); return [x, y, d];
        }
        return null; })()`);

    // one blow: the event started as the action button does, then every frame noted (after the whole update) until he can move
    const trace = async eid => {
        const at = await standBy(eid);
        await t.eval("$gameSystem.setStamina($gameSystem.maxStamina()); 0");
        await t.frames(10);
        const log = await t.json(`new Promise(res => {
            const e = $gameMap.event(${eid}), p = $gamePlayer, h0 = e._treeHits || 0, um = SceneManager.updateMain, log = { freeDuringSwing: 0 };
            let t0 = -1;
            const mark = (k, cond) => { if (log[k] === undefined && cond) log[k] = Graphics.frameCount - t0; };
            SceneManager.updateMain = function() {
                if (t0 < 0) { t0 = Graphics.frameCount; e.start(); }
                um.apply(this, arguments);
                if (log.rate === undefined && e._swingT >= 0) { log.rate = e._swingRate || 1; log.kind = e._swingKind; }
                mark("blowLanded", (e._treeHits || 0) !== h0);
                if (e._swingT >= 0 && p.canMove()) log.freeDuringSwing++;
                mark("swingEnds", log.blowLanded !== undefined && p._swingEvent !== e);
                mark("treeAnimatingEnds", log.blowLanded !== undefined && !e.isTreeAnimating());
                mark("eventRunningEnds", log.blowLanded !== undefined && !$gameMap.isEventRunning());
                mark("canMove", log.blowLanded !== undefined && p.canMove());
                if (log.canMove !== undefined || Graphics.frameCount - t0 > 600) { SceneManager.updateMain = um; res(log); }
            };
        })`, 30000);
        const def = await t.json(`(function(){ const d = ChoppableTree.swingKind(${log.kind === undefined ? -1 : log.kind}); return { sheet: d.sheet, impact: d.impact, frames: d.frames }; })()`);
        // the frames the swing takes at its rate (one step of _swingT a frame, the first on the frame it starts)
        log.expect = { blow: Math.ceil(def.impact / log.rate), end: Math.ceil(def.frames / log.rate), sheet: def.sheet };
        log.at = at;
        return log;
    };

    const ore = await trace(45);
    console.log("ore vein (pickaxe):", JSON.stringify(ore));
    await t.frames(60);
    const tree = await trace(1);
    console.log("tree (axe):        ", JSON.stringify(tree));

    for (const [name, r, kind] of [["ore vein (pickaxe)", ore, 1], ["tree (axe)", tree, 3]]) {
        const x = r.expect;
        t.check(`${name}: a ${kind === 1 ? "pickaxe" : "side axe"} swing at half speed`, !!r.at && r.kind === kind && Math.abs(r.rate - 0.5) < 1e-9, { at: r.at, kind: r.kind, rate: r.rate, sheet: x.sheet });
        t.check(`${name}: the blow lands on the swing's impact, ${x.blow} frames after the press`, r.blowLanded >= x.blow && r.blowLanded <= x.blow + 2, { blowLanded: r.blowLanded, expect: x.blow });
        t.check(`${name}: locked through the whole swing, free to move right after its end (${x.end} frames)`,
            r.freeDuringSwing === 0 && r.canMove >= x.end && r.canMove <= x.end + 3 && r.swingEnds <= r.canMove && r.eventRunningEnds <= r.canMove, r);
    }
    t.check("the pickaxe on a rock locks longer than the axe on a tree (to the blow and to moving again)", ore.blowLanded > tree.blowLanded && ore.canMove > tree.canMove,
        { ore: [ore.blowLanded, ore.canMove], tree: [tree.blowLanded, tree.canMove] });
});
