// Zrzuty HUD-u z poziomymi paskami potrzeb po prawej od zegara i celem pod zegarem (CleanHUD.js, polecenie użytkownika 2026-10-12)
// do docs/ui_grafit/: hud_paski_poziome.png (dzień), hud_paski_walka.png (tryb walki: oddech jako 5. pasek), hud_paski_niska_woda.png,
// hud_paski_nazwa_mapy.png (długa nazwa miejsca u góry - czy nic się nie nakłada), hud_paski_zblizenie.png (lewy górny róg x2).
//   CDP_PORT=9460 node tools/ui_grafit/capture_paski.js
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
    window.dispatchEvent(new Event("pointerdown"));
    return 0; })()`;

kit.test({ port: 9460, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(SETUP);
    await t.frames(200);   // (the map's name gone)
    const shot = async name => { const f = await t.shot(path.join(OUT, name + ".png")); console.log("SHOT", f); return f; };
    const day = await shot("hud_paski_poziome");
    console.log("BARS", JSON.stringify((await t.json("CleanHUD.debug()")).bars.map(b => [b.key, b.number, b.y])));
    await t.eval("$gameSystem._needs.water = 12; 0");
    await t.until("(function(){ const n = SceneManager._scene._cleanNeeds; return n._pulse < 20 && (n._bars || []).some(a => a.low); })()", 5);
    const low = await shot("hud_paski_niska_woda");
    await t.eval("$gameSystem._needs.water = 41; 0");
    await t.eval("$gameParty.gainItem($dataItems[60], 1); 0");
    await t.key("Tab");
    await t.frames(20);
    await t.eval("if (window.Combat && Combat.spendBreath) Combat.spendBreath(Combat.breath - Combat.maxBreath() * 0.5); 0");
    await t.frames(4);
    const fight = await shot("hud_paski_walka");
    console.log("TEXT", JSON.stringify((await t.json("CleanHUD.debug()")).text));
    await t.key("Tab");
    await t.frames(10);
    // a long map name at the top: its copper lines and the bars' plate
    await t.eval(`(function(){ $gameMap.displayName = () => "Leśna droga do miasteczka"; SceneManager._scene._mapNameWindow.open(); return 0; })()`);
    await t.frames(30);
    await shot("hud_paski_nazwa_mapy");
    fs.writeFileSync(path.join(OUT, "_paski.json"), JSON.stringify({ day, low, fight }));
    t.check("zrzuty", true);
});
