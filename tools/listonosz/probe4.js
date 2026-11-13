const kit = require("../../tests/lib/kit.js");
kit.test({ bootCheck: "boot", errorCheck: "bez bledow" }, async t => {
    await t.newGame({ map: 8, x: 112, y: 15, dir: 8, hour: 2.6, day: 41, quiet: true, minimap: false });
    await t.eval("TownQuests.state().flags.krukTame = 12; 0"); await t.frames(130);
    await t.eval("Poczta.stan().start = 13; PocztaData.watek.skocz(5); 0"); await t.frames(30);
    await t.go(214, 5, 9, 8); await t.frames(40);
    await t.eval("window.__e=[]; window.addEventListener('error',e=>__e.push(e.message)); Poczta.scenaPrawda(); 0");
    for (let i = 0; i < 6; i++) { await t.frames(120); console.log("PROBE", i, JSON.stringify(await t.json("({ step: Poczta.stepNow(), fin: Poczta.stan().finale, ev: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(), c: (function(){const a=$gameMap.event(4403); return a?[a.x,a.y,a._transparent]:null})(), hr: $gameSystem.dayNightHour(), err: __e })"))); }
});
