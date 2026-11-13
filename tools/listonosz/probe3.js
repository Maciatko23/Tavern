const kit = require("../../tests/lib/kit.js");
kit.test({ bootCheck: "boot", errorCheck: "bez bledow" }, async t => {
    await t.newGame({ map: 214, x: 5, y: 9, dir: 8, hour: 18.1, day: 20, quiet: true, minimap: false });
    await t.eval("TownQuests.state().flags.krukTame = 12; 0");
    await t.frames(130);
    await t.go(1, 52, 14, 8); await t.frames(40);
    console.log("PROBE", JSON.stringify(await t.json("({ map: $gameMap.mapId(), melia: !!TavernLife.npc('melia'), grum: !!TavernLife.npc('grum'), names: $gameMap.events().filter(e => /Melia|Grum|Borgar/i.test(e.event().name)).map(e => e.event().name + '@' + e.x + ',' + e.y + (e._transparent ? 't' : '')), hr: $gameSystem.dayNightHour(), day: $gameSystem._dayNightDay })")));
});
