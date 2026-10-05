// The knights' garden (Map008 x2-10, y4-13) has a way in (2026-10-05): its iron gate (event 39 "Furtka ogrodu rycerzy",
// !$SF_Gate3 3x2 at 5-7,15-16, <Occupy:left=1,right=1,up=1>) is locked - a popup says so - until Ambroży gives the key (W2, flag
// gardenKey); then it opens (self-switch A, through, below the hero) and one walks up under the wall's top (region 3, 5-7,14) into
// the garden, which ticks W2's step "go into the knights' garden". Shot: docs/miasteczko/ogrod_rycerzy.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 8, x: 6, y: 17, dir: 8, day: 4, hour: 10, quiet: true, minimap: false });
    await t.frames(20);
    const gate = await t.json(`(function(){ const e = $gameMap.event(39); return { name: e.event().name, note: e.event().note, x: e.x, y: e.y, solid: e.isNormalPriority() && !e.isThrough(),
        blocksSides: [5, 7].every(x => $gameMap.eventsXyNt(x, 16).includes(e)), region: [5, 6, 7].map(x => $gameMap.regionId(x, 14)) }; })()`);
    t.check("the garden's gate is event 39 'Furtka ogrodu rycerzy', 3 cells wide and closed; the wall's top above it is region 3",
        gate.name === "Furtka ogrodu rycerzy" && gate.solid && gate.blocksSides && gate.region.every(r => r === 3), gate);

    // no key: locked
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(30);
    const pops = await t.popups({ clear: true });
    t.check("without Ambroży's key the action button says the gate is locked (a popup, no message window)",
        pops.some(p => /zamknięta na klucz/i.test(p)) && !(await t.json("$gameMessage.isBusy()")), pops);
    await t.hold("up", 40);
    const stay = await t.json("({ x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("...and it does not let anyone through (still in front of it)", stay.y >= 17, stay);

    // the key (W2's step 'Masz. Klucz do furtki...') and W2 at its garden step
    const w2 = await t.json(`(function(){ const q = TownQuests.QUESTS.find(q => q.id === "W2"), i = q.steps.findIndex(s => s.tick === "w2Garden");
        TownQuests.state().flags.gardenKey = 4; TownQuests.start("W2", i); return { i, rec: TownQuests.rec("W2") }; })()`);
    t.check("W2 has the step 'go into the knights' garden' before its pause", w2.i > 0 && w2.rec && w2.rec.step === w2.i, w2);
    await t.locate(6, 17, 8);
    await t.frames(5);
    await t.press("ok");
    await t.until("$gameSelfSwitches.value([8, 39, 'A'])", 10);
    await t.frames(30);
    const open = await t.json(`(function(){ const e = $gameMap.event(39); return { a: $gameSelfSwitches.value([8, 39, "A"]), through: e.isThrough(), below: e._priorityType === 0, dir: e.direction() }; })()`);
    t.check("with the key it opens (self-switch A): passable, under the hero, drawn open", open.a && open.through && open.below && open.dir === 8, open);

    // in through the gate, under the wall's top, into the garden
    await t.hold("up", 120);
    const inside = await t.json("({ x: $gamePlayer.x, y: $gamePlayer.y, map: $gameMap.mapId() })");
    t.check("walking up through the gate leads into the garden", inside.map === 8 && inside.y <= 13 && inside.x >= 2 && inside.x <= 10, inside);
    await t.frames(20);
    const after = await t.json(`(function(){ const r = TownQuests.rec("W2"), q = TownQuests.QUESTS.find(q => q.id === "W2"); return { step: r.step, type: q.steps[r.step].type }; })()`);
    t.check("...which ticks W2's step: now its pause (the statues and the order's archive come later)", after.step === w2.i + 1 && after.type === "pause", after);
    await t.locate(6, 12, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "ogrod_rycerzy.png"));
});
