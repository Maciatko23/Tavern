// Zrzuty wyglądu "Grafit i miedź" (UITheme.js, MenuPanel.js, Journal.js, CleanHUD*.js, MenuRing.js) do docs/ui_grafit/.
//   CDP_PORT=9486 node tools/ui_grafit/capture.js [ujęcie...]
// Ujęcia: hud, menu (menu P), plecak, dziennik, postac, opcje, zapis, rozmowa (dymek i wybór), budowa (menu Q), noc, walka.
// Zapis tests/fixtures/day40_farm, godz. 11, potrzeby jak na makietach.
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_grafit");
const want = process.argv.slice(2);
const on = name => !want.length || want.includes(name);

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
    return 0; })()`;

kit.test({ port: 9486, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(SETUP);
    await t.frames(30);
    const shot = async name => { const f = await t.shot(path.join(OUT, name + ".png")); console.log("SHOT", f); };
    const scene = (cls, push) => t.eval(`(function(){ SceneManager.push(${push}); return 0; })()`).then(() => t.until(`SceneManager._scene && SceneManager._scene.constructor.name === "${cls}" && !SceneManager.isSceneChanging()`, 15));
    const back = async () => { await t.eval("SceneManager.goto(Scene_Map); 0"); await t.until(t.onMap(), 15); await t.frames(20); };

    if (on("hud")) {
        await t.eval(`(function(){ $gameSystem._minimapHidden = undefined; SceneManager._scene._mapNameWindow.open(); const give = (id, n) => $gameParty.gainItem($dataItems[id], n); give(61, 6); give(64, 4); give(77, 8); return 0; })()`);
        await t.frames(50);
        await shot("grafit_hud");
    }
    if (on("menu")) {
        await t.frames(200);
        await t.key("P");
        await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
        await t.frames(60);
        await shot("grafit_menu_p");
        await back();
    }
    for (const [name, cls, push, after] of [["plecak", "Scene_Item", "Scene_Item", "ArrowRight"], ["dziennik", "Scene_Journal", "Journal.Scene_Journal", null],
        ["postac", "Scene_Hero", "Combat.Scene_Hero", null], ["opcje", "Scene_Options", "Scene_Options", null], ["zapis", "Scene_Save", "Scene_Save", null]]) {
        if (!on(name)) continue;
        await t.eval("SceneManager.snapForBackground(); 0");
        const ok = await scene(cls, push);
        await t.frames(30);
        if (after) { await t.key(after); await t.frames(10); }
        await shot("grafit_" + name);
        console.log(name, ok);
        await back();
    }
    if (on("rozmowa")) {
        await t.run(t.cmd.text(null, ["Tu jest dymek nad bohaterem: myśli i pytania."]).concat(t.cmd.choice(["Tak", "Nie"]), t.cmd.end()));
        await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.openness >= 255", 10);
        await t.frames(30);
        await shot("grafit_rozmowa");
        await t.finish();
        await t.frames(10);
    }
    if (on("budowa")) {
        await t.key("Q");
        await t.frames(30);
        await shot("grafit_budowa");
        await t.key("Q");
        await t.frames(10);
    }
    if (on("walka")) {
        await t.eval(`(function(){ if (window.Combat && Combat.setCombatMode) Combat.setCombatMode(true); else $gameSystem._combatMode = true; return 0; })()`);
        await t.frames(30);
        await t.eval(`(function(){ if (window.Combat && Combat.spendBreath) Combat.spendBreath(35); return 0; })()`);
        await t.frames(6);
        await shot("grafit_walka");
        await t.eval(`(function(){ if (window.Combat && Combat.setCombatMode) Combat.setCombatMode(false); else $gameSystem._combatMode = false; return 0; })()`);
    }
    t.check("zrzuty", true);
});
