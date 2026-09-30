// Trees fade a little while the hero stands behind them (user 2026-09-30): a choppable tree on grandpa's field (Map003) - its
// body fades to ~50% with the hero one tile behind the trunk, and is whole again with him in front; a decorative tree picture
// on an event in the town (Map008, e.g. !$Big_Trees_green) does the same with the whole sprite. CDP_PORT=9422 by default.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ port: 9422, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const alphaOf = (id, part) => t.eval(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(${id}));
        return s ? +(${part === "body" ? "s._treeBody ? s._treeBody.alpha : -1" : "s.alpha"}).toFixed(2) : -1; })()`);

    // ---- a choppable tree on grandpa's field
    await t.newGame({ map: 3, x: 5, y: 5, hour: 12, quiet: true });
    const tree = await t.json(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character instanceof Game_Event && o.isTreeSprite && o.isTreeSprite() && !o._character._treeGone && o._character.y > 3);
        return s ? { id: s._character.eventId(), x: s._character.x, y: s._character.y } : null; })()`);
    t.check("a standing choppable tree on Map003", !!tree, tree);
    await t.eval(`(function(){ $gamePlayer.locate(${tree.x}, ${tree.y - 1}); return 0; })()`);
    await t.frames(40);
    const behind = await alphaOf(tree.id, "body");
    await t.shot(path.join(SHOTS, "drzewo_za_korona.png"));
    await t.eval(`(function(){ $gamePlayer.locate(${tree.x}, ${tree.y + 1}); return 0; })()`);
    await t.frames(40);
    const front = await alphaOf(tree.id, "body");
    t.check("behind the choppable tree it fades to about half, in front of it it is whole again", Math.abs(behind - 0.5) < 0.05 && front === 1, { behind, front });

    // ---- a decorative tree in the town
    await t.go(8, 19, 14, 2);
    const deco = await t.json(`(function(){ const e = $gameMap.events().find(e => /^!.*tree/i.test(e.characterName()) && e.y > 3);
        return e ? { id: e.eventId(), x: e.x, y: e.y, pic: e.characterName() } : null; })()`);
    if (!deco) { t.check("(no decorative tree picture on Map008 - nothing to check)", true); return; }
    await t.eval(`(function(){ $gamePlayer.locate(${deco.x}, ${deco.y - 1}); return 0; })()`);
    await t.frames(40);
    const dBehind = await alphaOf(deco.id, "sprite");
    await t.eval(`(function(){ $gamePlayer.locate(${deco.x}, ${deco.y + 1}); return 0; })()`);
    await t.frames(40);
    const dFront = await alphaOf(deco.id, "sprite");
    t.check("behind a decorative tree in the town (" + deco.pic + ") it fades too, in front it is whole", Math.abs(dBehind - 0.5) < 0.05 && dFront === 1, { deco, dBehind, dFront });
});
