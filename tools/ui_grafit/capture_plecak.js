// Zrzuty plecaka z inteligentnym porządkiem (MenuRing.js) do docs/ui_grafit/plecak_<porządek>.png.
//   CDP_PORT=9460 node tools/ui_grafit/capture_plecak.js
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_grafit");

kit.test({ port: 9486, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){ if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem.setDayNightHour(11.02);
        ConfigManager.uiClean = true; ConfigManager.bagSort = "groups"; window.dispatchEvent(new Event("pointerdown"));
        for (const [id, n] of [[171, 1], [155, 1], [112, 1], [95, 2], [99, 1], [83, 3], [129, 1], [81, 2], [67, 4], [69, 3], [111, 2], [127, 12]]) $gameParty.gainItem($dataItems[id], n);
        const Sp = window.Spoilage; if (Sp && Sp.state) { const st = Sp.state(); if (st.bag[95]) st.bag[95].forEach(b => b.age = 30); }
        $gamePlayer.locate(27, 9); $gamePlayer.center(27, 9); if (window.Hunting) Hunting.auto(false); if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        return 0; })()`);
    await t.frames(60);
    const shot = async name => { const f = await t.shot(path.join(OUT, name + ".png")); console.log("SHOT", f); };
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(50);
    await t.key("D"); await t.frames(20);   // (level 1: Plecak)
    await t.key("O"); await t.frames(8);    // (level 2: the categories)
    await t.key("O");                       // (level 3: the grid)
    await t.frames(24);
    for (const name of ["grupy", "nazwa", "ilosc", "najnowsze"]) {
        const b = (await t.json("MenuRing.info()")).bag;
        console.log("BAG", b.sort, JSON.stringify(b.heads.map(h => h.label + ":" + h.count)));
        await shot("plecak_" + name);
        await t.key("Tab");
        await t.frames(12);
    }
    t.check("zrzuty", true);
});
