// zrzut z wyłączoną nakładką (oryginalne kafle): node tools/wzgorza/off.js nazwa mapa x y
const kit = require("../../tests/lib/kit.js"), path = require("path");
const [nazwa, map, x, y] = process.argv.slice(2);
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.eval("window.WZGORZA = { off: true }; 0");
    await t.newGame({ map: +map, x: +x, y: +y, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(200);
    await t.eval(`$gamePlayer.setTransparent(true); $gameMap.setDisplayPos(${x} - $gameMap.screenTileX() / 2 + 0.5, ${y} - $gameMap.screenTileY() / 2 + 0.5); 0`);
    await t.frames(30);
    await t.shot(path.join(__dirname, "../../docs/wzgorza/runda2/orig_" + nazwa + ".png"));
});
