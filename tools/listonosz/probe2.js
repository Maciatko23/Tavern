const kit = require("../../tests/lib/kit.js");
kit.test({ bootCheck: "boot", errorCheck: "bez bledow" }, async t => {
    await t.newGame({ map: 1, x: 52, y: 14, dir: 8, hour: 20.3, day: 20, quiet: true, minimap: false });
    await t.eval("TownQuests.state().flags.krukTame = 12; 0");
    await t.frames(130);
    await t.eval("Poczta.stan().start = 13; WatkiProbe = 1; PocztaData.watek.skocz(2); Poczta.stan().bag = ['l2_melia']; 0");
    await t.frames(60);
    console.log("PROBE rec", JSON.stringify(await t.json("TownQuests.rec('W20')")), JSON.stringify(await t.json("({ npc: !!TavernLife.npc('melia'), away: TavernLife.meliaAway ? TavernLife.meliaAway() : null, hr: $gameSystem.dayNightHour() })")));
    const r = await t.talkTo("TavernLife.npc('melia')", ["Bywaj."], { secs: 40 });
    console.log("PROBE talk", JSON.stringify(r.text).slice(0, 400), JSON.stringify(await t.json("Poczta.stan().done")));
});
