// Zrzuty zakładki Postać (MenuRing.js, makieta „A”: Statystyki / Ekwipunek / Umiejętności na Z/C) do docs/ui_grafit/postac_*.png:
// statystyki z punktami do rozdania (opis Kondycji), bez punktów, ekwipunek z wyborem dla lewej ręki, umiejętności; obok makiety:
// tools/ui_grafit/porownanie.py (porownanie_postac_*.png).
//   CDP_PORT=9460 node tools/ui_grafit/capture_postac.js
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_grafit");

kit.test({ port: 9460, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){ if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem.setDayNightHour(11.02);
        ConfigManager.uiClean = true; window.dispatchEvent(new Event("pointerdown"));
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(true); const n = $gameSystem._needs; if (n) { n.food = 72; n.water = 70; }
        for (const id of [171, 155, 112, 113, 114, 156]) if (!$gameParty.numItems($dataItems[id])) $gameParty.gainItem($dataItems[id], 1);
        $gameParty.gainItem($dataItems[59], 3);
        const h = Combat.hero(); h.points = 15; h.skillPoints = 5;
        $gamePlayer.locate(27, 9); $gamePlayer.center(27, 9); if (window.Hunting) Hunting.auto(false); if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        return 0; })()`);
    await t.frames(60);
    const shot = async name => { const f = await t.shot(path.join(OUT, name + ".png")); console.log("SHOT", f); };
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(60);
    await t.key("O"); await t.frames(6);   // (level 2: the parts)
    await t.key("O"); await t.frames(10);  // (level 3: the attributes)
    await shot("postac_statystyki");
    await t.key("ArrowDown"); await t.key("ArrowDown");
    await t.frames(10);
    await shot("postac_dymek_kondycja");
    console.log("STATS", JSON.stringify((await t.json("MenuRing.info()")).stats));
    await t.eval("Combat.hero().points = 0; SceneManager._scene._view.refresh(); SceneManager._scene.drawKeys(); SceneManager._scene.drawSubBar(); 0");
    await t.frames(6);
    await shot("postac_bez_punktow");
    await t.key("P"); await t.frames(6);   // (level 2)
    await t.key("D"); await t.frames(20);  // (Ekwipunek)
    await t.key("O"); await t.frames(8);   // (level 3: the places)
    await t.eval(`(function(){ const v = SceneManager._scene._view; const idx = ["head","cloak","right","hands","legs","feet","back","torso","left","belt","extra"].indexOf("left"); v._cell = idx; v.draw(); return 0; })()`);
    await t.frames(4);
    await t.key("Enter");
    await t.frames(10);
    await shot("postac_ekwipunek");
    console.log("EQUIP", JSON.stringify((await t.json("MenuRing.info()")).equip));
    await t.key("Escape");
    await t.frames(6);
    await t.key("P"); await t.frames(6);   // (level 2)
    await t.key("D"); await t.frames(20);  // (Umiejętności)
    await t.key("O"); await t.frames(10);
    await shot("postac_umiejetnosci");
    t.check("zrzuty", true);
});
