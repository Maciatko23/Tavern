// czas wypieku wszystkich skupień na mapie (natywnie): node tools/wzgorza/czas.js mapa [noextra]
const kit = require("../../tests/lib/kit.js");
const map = Number(process.argv[2]) || 13;
kit.test({ port: 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.eval(`window.WZGORZA = {}; window.WZGORZA_NOEXTRA = ${process.argv[3] === "noextra"}; 0`);
    await t.newGame({ map, x: 24, y: 59, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(300);
    console.log(JSON.stringify(await t.json("Wzgorza.stats()")));
});
