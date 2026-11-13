// zdjęcia potworów obok bohatera (docs/zadania_nowe/potwory_gra/): uruchom z nakładką jak morze_test.js
const kit = require("./lib/kit.js");
const SHOTS = "../docs/zadania_nowe/potwory_gra/";
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9950 }, async t => {
    await t.newGame({ map: 125, x: 60, y: 70, hour: 19.4, day: 12 });
    await t.eval(`(function(){ Creatures.clear("morze"); const kinds = ["topielec_morski", "krab_olbrzym", "rybolak", "mglak", "wiedzma"]; const hx = $gamePlayer.x, hy = $gamePlayer.y;
        kinds.forEach((k, i) => { Creatures.spawn(k, hx - 4 + i * 2, hy - 2, { tag: "morze", engaged: false, level: 1, single: true }); });
        Creatures.creatures().forEach(c => { c._frozen = true; c._hidden = false; c._opacity = 255; c.setDirection(2); }); $gamePlayer.setDirection(8); return 0; })()`);
    await t.frames(60);
    await t.shot(SHOTS + "00_potwory_obok_bohatera.png");
    for (const dir of [6, 4, 8]) {
        await t.eval(`Creatures.creatures().forEach(c => c.setDirection(${dir})); 0`);
        await t.frames(30);
        await t.shot(SHOTS + "00_potwory_kierunek_" + dir + ".png");
    }
});
