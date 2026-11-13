// Kruczarnia (Map214): oświetlenie - oba pokoje o świcie, w dzień, o zmierzchu i w nocy (zdjęcia tests/poczta/sw_*.png), bez ostrych czarnych brył.
// GAME_OVERLAY=tools/listonosz/overlay GAME_OVERLAY_JS=1 node tests/run.js poczta_swiatlo_test --port 9925
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 214, x: 5, y: 9, dir: 8, hour: 12, day: 13, quiet: true, minimap: false });
    await t.eval("Poczta.stan().start = 13; 0");
    t.check("mapa 214 ma <Widok:off> i <LightEdges:soft>", await t.eval("/Widok:off/.test($dataMap.note) && /LightEdges:soft/.test($dataMap.note)"));
    for (const [h, n] of [[6.5, "switem"], [12, "dzien"], [19, "zmierzch"], [23, "noc"]]) {
        await t.setHour(h);
        for (const [room, x, y] of [["izba", 5, 9], ["wieza", 14, 8]]) {
            await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(8); 0`);
            await t.frames(90);
            await t.shot("poczta/sw_" + room + "_" + n + ".png");
        }
    }
});
