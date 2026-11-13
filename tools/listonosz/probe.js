// Szybka sonda: node tests/run.js nie jest potrzebne - GAME_OVERLAY=tools/listonosz/overlay GAME_OVERLAY_JS=1 CDP_PORT=9921 node tools/listonosz/probe.js "<wyrazenie JS>" [map x y]
const kit = require("../../tests/lib/kit.js");
kit.test({ bootCheck: "boot", errorCheck: "bez bledow" }, async t => {
    await t.newGame({ map: 214, x: 5, y: 9, dir: 8, hour: 10, day: 13, quiet: true, minimap: false });
    await t.frames(20);
    await t.eval("TownQuests.state().flags.krukTame = 12; 0");
    await t.frames(130);
    const code = process.argv[2] || "1";
    console.log("PROBE", JSON.stringify(await t.json(code)));
});
