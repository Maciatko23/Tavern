// zrzut z bohaterem w zadanej pozycji (piksele lewego górnego rogu sprite'a): node tools/wzgorza/pos.js mapa fx fy nazwa  -> docs/wzgorza/runda3/pos_<nazwa>.png
const kit = require("../../tests/lib/kit.js"), path = require("path");
const [map, fx, fy, nazwa] = [Number(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]), process.argv[5] || "x"];
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map, x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._realX = ${fx} / 48; $gamePlayer._realY = ${fy} / 48; $gamePlayer._x = Math.round(${fx}/48); $gamePlayer._y = Math.round(${fy}/48); $gameMap.setDisplayPos((${fx} - 640) / 48, (${fy} - 360) / 48); 0`);
    await t.frames(10);
    const o = await t.json("(() => { const sp = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); return { x: Math.round(sp.x), y: Math.round(sp.y) }; })()");
    console.log(JSON.stringify(o));
    await t.shot(path.join(__dirname, "../../docs/wzgorza/runda3/pos_" + nazwa + ".png"));
});
