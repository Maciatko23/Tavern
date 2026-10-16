// node tools/kruk/probe_bez_nakladki.js - the game WITHOUT package B's map (data/Map157.json still the stub): no errors anywhere
const kit = require("../../tests/lib/kit.js");
kit.test({ port: 9502, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    t.check("mapa 157 to szkielet: Kruk nie zgłasza miejsca", (await t.eval("Kruk.built()")) === false && (await t.eval("Wyspa.isReady(157)")) === false);
    await t.setDay(9, 5.5);
    await t.go(125, 15, 30, 2);
    await t.frames(120);
    t.check("przystań o świcie: brak kruka (Urwisko niegotowe), bez błędów", (await t.eval("!Kruk.pet")) === true);
    await t.go(157, 10, 10, 2);
    await t.frames(120);
    await t.go(3, 20, 14, 2);
    await t.frames(60);
    t.check("szkielet mapy 157 i pole: nic się nie sypie", (await t.eval("$gameMap.mapId()")) === 3);
});
