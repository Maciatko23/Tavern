// node tools/wzgorza/wejscia.js [mapa] [RAD] [FRAMES] [up]
const kit = require("../../tests/lib/kit.js"); const page = require("../../tests/lib/wzgorza_wejscia.js");
const [map, rad, fr, up] = process.argv.slice(2);
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 600000 }, async t => {
    await t.newGame({ map: Number(map || 990), x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    console.log(await t.eval(page(Number(rad || 3), Number(fr || 60), up === "up"), 600000));
});
