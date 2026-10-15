// Zrzuty każdej zakładki menu P w wyglądzie Grafit (MenuRing.js) do docs/ui_grafit/menu_<zakladka>.png.
//   CDP_PORT=9486 node tools/ui_grafit/capture_tabs.js
// Zapis tests/fixtures/day40_farm; menu otwierane klawiszem P (zakładka Postać), potem E po kolei przez wszystkie zakładki.
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_grafit");

kit.test({ port: 9486, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){ if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem.setDayNightHour(11.02);
        if (window.Needs) Needs.setEnabled(true); const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; }
        const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78)); $gameSystem.setStamina(70); ConfigManager.uiClean = true;
        $gamePlayer.locate(27, 9); $gamePlayer.center(27, 9); if (window.Hunting) Hunting.auto(false); if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        return 0; })()`);
    await t.frames(200);
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(50);
    const names = { item: "plecak", journal: "dziennik", hero: "postac", skills: "umiejetnosci", options: "opcje", save: "zapis", gameEnd: "koniec" };
    const sub = { hero: true, item: true, journal: true };
    for (let i = 0; i < 6; i++) {
        let info = await t.json("MenuRing.info()");
        const tab = info.active;
        await t.key("O"); await t.frames(10);                       // (in: level 2, or straight to the content)
        if (sub[tab]) { await t.key("O"); await t.frames(10); }   // (level 3: the content)
        info = await t.json("MenuRing.info()");
        await t.shot(path.join(OUT, "menu_" + (names[tab] || tab) + ".png"));
        console.log("TAB", tab, info.level, JSON.stringify(info.activeWindows), JSON.stringify(info.keys));
        await t.key("P"); await t.frames(8);
        if (sub[tab]) { await t.key("P"); await t.frames(8); }
        await t.key("D");
        await t.frames(24);
    }
    t.check("zrzuty", true);
});
