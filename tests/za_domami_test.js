// Za domami: dwa górne rzędy dachu chat (region 3) - bohater przechodzi za chatą, dach go zasłania; dolny rząd dachu i ściany blokują.
// CDP_PORT=9467 node tests/za_domami_test.js      Zrzut: docs/NOWY_SWIAT/zagrody/za_chata.png
const kit = require("./lib/kit.js");
const path = require("path");
kit.test({ port: Number(process.env.CDP_PORT) || 9467, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    // the shelter (przytułek, x 36..46, roof from y 46): walk along its top roof row from the west side to the east side
    await t.newGame({ map: 218, x: 35, y: 47, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(150);
    t.check("górne dwa rzędy dachu przechodnie, trzeci nie", await t.json("[46,47].every(y => $gameMap.isPassable(40, y, 6)) && !$gameMap.isPassable(40, 48, 6) && !$gameMap.isPassable(40, 48, 2)"),
        await t.json("[[40,46],[40,47],[40,48]].map(([x,y]) => [$gameMap.regionId(x,y), $gameMap.isPassable(x,y,6)])"));
    for (let i = 0; i < 80; i++) { await t.hold("right", 6); if ((await t.json("$gamePlayer._realX")) >= 47) break; }
    const p = await t.json("[$gamePlayer._realX, $gamePlayer._realY]");
    t.check("przejście za przytułkiem (górą dachu)", p[0] >= 46.5, p);
    await t.eval("$gamePlayer.locate(40, 47); $gamePlayer.center(40, 47); 0"); await t.frames(20);
    await t.shot(path.join(__dirname, "..", "docs", "NOWY_SWIAT", "zagrody", "za_chata.png"));
    await t.hold("down", 30);
    t.check("dalej w dół przez dach nie przejdzie", (await t.json("$gamePlayer._realY")) <= 47.6, await t.json("$gamePlayer._realY"));
});
