// Zrzuty do makiety „paski jako łuki wokół zegara” (docs/ui_pomysly2/luki_zegar_*.png): obecna gra (HUD Grafit), z HUD i bez.
//   CDP_PORT=9482 node tools/ui_pomysly2/capture_luki.js
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "zrzuty");

kit.test({ port: 9482, errorCheck: false }, async t => {
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){
        ConfigManager.uiClean = true;
        if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
        $gameSystem.setDayNightHour(11);
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
        const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; }
        const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78));
        if ($gameSystem.setStamina) $gameSystem.setStamina(70);
        $gameSystem._combatMode = false;
        if (window.Hunting) { Hunting.auto(false); for (const x of Hunting.animals.slice()) Hunting.removeAnimal(x); }
        if (window.Birds && Birds.auto) Birds.auto(false);
        if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        $gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);
        return 0; })()`);
    await t.frames(40);
    await t.eval(`(function(){
        const give = (id, n) => { const it = $dataItems[id]; $gameParty.gainItem(it, n);
            $gameTemp.pushLootPopup(it.iconIndex, "+" + n + " " + it.name, "#ffffff", { gain: { key: "item:" + id, amount: n, name: it.name } }); };
        give(61, 3); give(64, 2); give(77, 4);
        return 0; })()`);
    await t.frames(70);
    await t.shot(path.join(OUT, "luki_hud.png"));
    await t.eval(`(function(){ const s = SceneManager._scene; s.__hidden = [];
        for (const c of s.children) if (c !== s._spriteset && c.renderable) { c.renderable = false; s.__hidden.push(c); }
        s.__wins = (s._windowLayer ? s._windowLayer.children : []).filter(w => w.visible); for (const w of s.__wins) w.visible = false;
        return 0; })()`);
    await t.frames(3);
    await t.shot(path.join(OUT, "luki_bez_hud.png"));
    t.check("zrzuty", fs.existsSync(path.join(OUT, "luki_bez_hud.png")));
});
