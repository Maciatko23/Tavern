// Zrzuty łuków potrzeb wokół zegara (CleanHUD.js, wariant A szkicu użytkownika) do docs/ui_grafit/luki_*.png.
//   CDP_PORT=9486 node tools/ui_grafit/capture_luki.js
// Zapis tests/fixtures/day40_farm, godz. 11, potrzeby jak na makiecie (życie 78%, kondycja 70%, sytość 64%, nawodnienie 41%);
// ujęcia: zwykły stan, niskie nawodnienie (12%, miga), tryb walki (oddech 55%), noc (księżyc). Porównanie: tools/ui_grafit/porownanie.py.
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_grafit");

const SETUP = `(function(){
    if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
    $gameSystem.setDayNightHour(11.02);
    if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
    const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; n.lw = 1; n.lf = 0; }
    const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78));
    if ($gameSystem.setStamina) $gameSystem.setStamina(70);
    $gameSystem._combatMode = false; ConfigManager.uiClean = true;
    $gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);
    if (window.Hunting) Hunting.auto(false);
    if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
    if (window.Birds && Birds.auto) Birds.auto(false);
    if ($gameSystem.activeBuffs) $gameSystem._buffs = [];
    return 0; })()`;

kit.test({ port: 9486, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(SETUP);
    await t.frames(200);   // (the map's name gone)
    const shot = async name => { const f = await t.shot(path.join(OUT, name + ".png")); console.log("SHOT", f); };
    await shot("luki_hud");
    console.log("ARCS", JSON.stringify((await t.json("CleanHUD.debug()")).arcs));
    // low water: red, pulsing - the shot on the bright beat
    await t.eval("$gameSystem._needs.water = 12; 0");
    await t.until("(function(){ const n = SceneManager._scene._cleanNeeds; return n._pulse < 20 && (n._arcs || []).some(a => a.low); })()", 5);
    await shot("luki_niska_woda");
    await t.eval("$gameSystem._needs.water = 41; 0");
    // the combat mode: the breath as the fifth arc, the pill under the goal
    await t.eval("$gameParty.gainItem($dataItems[60], 1); 0");
    await t.key("Tab");
    await t.frames(20);
    await t.eval("if (window.Combat && Combat.spendBreath) Combat.spendBreath(Combat.breath - Combat.maxBreath() * 0.5); 0");
    await t.frames(4);
    await shot("luki_walka");
    console.log("TEXT", JSON.stringify((await t.json("CleanHUD.debug()")).text));
    await t.key("Tab");
    await t.frames(10);
    await t.eval("$gameSystem.setDayNightHour(22.5); 0");
    await t.frames(30);
    await shot("luki_noc");
    t.check("zrzuty", true);
});
