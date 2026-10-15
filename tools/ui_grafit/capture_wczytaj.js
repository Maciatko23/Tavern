// Zrzuty listy zapisów (wczytywanie z ekranu tytułowego, „Kontynuuj”) w wyglądzie Grafit (MenuRing.js) do docs/ui_grafit/:
// wczytaj_z_tytulu.png (najnowszy zapis zaznaczony), wczytaj_z_tytulu_pusty.png (pusty plik) i menu_zapis.png dla porównania (menu P).
//   CDP_PORT=9460 node tools/ui_grafit/capture_wczytaj.js
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_grafit");

kit.test({ port: 9460, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval("ConfigManager.uiClean = true; window.dispatchEvent(new Event('pointerdown')); 0");
    await t.frames(20);
    t.check("zapis do pliku 2", await t.saveTo(2));
    await t.eval("$gameParty.gainGold(120); $gameSystem.setDayNightHour(18); 0");
    await t.frames(10);
    t.check("zapis do pliku 3 (najnowszy)", await t.saveTo(3));
    await t.toTitle();
    const onTitle = "(SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging())";
    await t.until(`${onTitle} && TitleScreen.info() && TitleScreen.info().ready`, 20);
    await t.frames(120);
    for (let i = 0; i < 4; i++) { const s = await t.json("TitleScreen.info()"); if (s.symbol === "continue") break; await t.key("S"); await t.frames(6); }
    await t.key("O");
    await t.until("SceneManager._scene instanceof Scene_Load && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    console.log("FILES", JSON.stringify(await t.json("MenuRing.files()")));
    console.log("SHOT", await t.shot(path.join(OUT, "wczytaj_z_tytulu.png")));
    for (let i = 0; i < 3; i++) { await t.key("S"); await t.frames(6); }
    console.log("FILES", JSON.stringify(await t.json("MenuRing.files()")));
    console.log("SHOT", await t.shot(path.join(OUT, "wczytaj_z_tytulu_pusty.png")));
    await t.key("P");
    t.check("P wraca na ekran tytułowy", await t.until(onTitle, 10));
    t.check("zrzuty", true);
});
