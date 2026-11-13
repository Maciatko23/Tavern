const kit = require("../../../tests/lib/kit.js");
kit.test({ overlay: process.env.GAME_OVERLAY, port: Number(process.env.CDP_PORT) || 9830, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów w konsoli", evalTimeout: 120000, beforeLoad: "window.WIDOK = false; window.POKOJE = false;" }, async t => {
    await t.newGame({ map: Number(process.env.MAP), x: 0, y: 0, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.eval(process.env.EXPR);
    console.log("RESULT " + JSON.stringify(r));
});
