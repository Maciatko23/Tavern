// przejście wzdłuż krawędzi wzgórz: node tools/wzgorza/obwiednia.js 990 [krok]
const kit = require("../../tests/lib/kit.js"), ob = require("../../tests/lib/wzgorza_obwiednia.js");
const map = Number(process.argv[2]) || 990;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 900000 }, async t => {
    await t.newGame({ map, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    await t.frames(30);
    const r = await ob.sprawdz(t, { krok: Number(process.argv[3]) || 6 });
    console.log(JSON.stringify(r));
});
