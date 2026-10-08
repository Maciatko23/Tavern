// Zrzuty "Czystego widoku" (CleanHUD.js, CleanHUD_Compass.js, MenuRing.js) do porównania z makietami docs/ui_pomysly/pomysl_4_*.png.
//   CDP_PORT=9486 node tools/ui_czysty/capture.js [nazwa...]
// Bez nazw: wszystkie ujęcia. Zrzuty idą do docs/ui_czysty/. Wtyczki są wstrzykiwane, gdy nie ma ich jeszcze w js/plugins.js.
// Ujęcia: hud (zapis day40_farm, godz. 11, potrzeby jak na makiecie), klasyczny (to samo w starym wyglądzie), menu (pierścień P),
// snieg, burza, noc, kamieniolom (jasne tła), walka (tryb walki, oddech jako piąty pasek), miasto (kompas do osoby w miasteczku).
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_czysty");
const PLUGINS = ["CleanHUD", "CleanHUD_Compass", "MenuRing"].filter(n => fs.existsSync(path.join(__dirname, "..", "..", "js", "plugins", n + ".js")));
const want = process.argv.slice(2);
const on = name => !want.length || want.includes(name);

const SETUP = `(function(){
    if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
    $gameSystem.setDayNightHour(11.08);
    if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
    const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; }
    const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78));
    if ($gameSystem.setStamina) $gameSystem.setStamina(70);
    $gameSystem._combatMode = false;
    $gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);
    if (window.Hunting) Hunting.auto(false);
    if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
    if (window.Birds && Birds.auto) Birds.auto(false);
    return 0; })()`;
const GAINS = `(function(){
    const give = (id, n) => { const it = $dataItems[id]; if (!it) return; $gameParty.gainItem(it, n); };
    give(61, 6); give(64, 4); give(77, 8);
    return 0; })()`;

kit.test({ port: 9486, errorCheck: false, plugins: PLUGINS }, async t => {
    console.log("plugins", JSON.stringify(t.plugins));
    const ok = await t.loadFixture("day40_farm", {});
    t.check("zapis wczytany", ok);
    await t.eval(SETUP);
    await t.frames(30);
    const shot = async name => { const f = await t.shot(path.join(OUT, name + ".png")); console.log("SHOT", f); };
    const look = clean => t.eval(`(function(){ if (window.CleanHUD) CleanHUD.setClean(${clean}); return 0; })()`);

    if (on("hud")) {
        await look(true);
        await t.eval(`(function(){ $gameSystem._minimapHidden = undefined; SceneManager._scene._mapNameWindow.open(); return 0; })()`);
        await t.eval(GAINS);
        await t.frames(40);
        // (the thought "Chce ci się pić" once: Needs says it itself on its next tick - the script must not push a second one)
        await t.eval(`(function(){ window.__kit.pops.length = 0; const n = $gameSystem._needs; if (n) { n.water = 41; n.lw = 0; } return 0; })()`);
        await t.frames(60);
        const thirst = (await t.popups()).filter(x => /pić/.test(x));
        console.log("THIRST", JSON.stringify(thirst), JSON.stringify(await t.json("SceneManager._scene._lootLayer.children.map(p => [p._data.text, !!p._cleanDone, Math.round(p.y)])")));
        await shot("czysty_hud");
        console.log("DEBUG", JSON.stringify(await t.json("CleanHUD.debug()"))); await t.frames(60); console.log("COMPASS", JSON.stringify(await t.json("window.CleanCompass ? CleanCompass.info() : null")));
    }
    if (on("klasyczny")) {
        await look(false);
        await t.frames(20);
        await shot("klasyczny_hud");
        await look(true);
        await t.frames(10);
    }
    if (on("snieg")) {
        await t.eval(`(function(){ $gameScreen.changeWeather("snow", 9, 0); return 0; })()`);
        await t.frames(90);
        await shot("czysty_snieg");
        await t.eval(`(function(){ $gameScreen.changeWeather("none", 0, 0); return 0; })()`);
    }
    if (on("noc")) {
        await t.eval(`$gameSystem.setDayNightHour(22.5); 0`);
        await t.frames(40);
        await shot("czysty_noc");
        await t.eval(`$gameSystem.setDayNightHour(11.08); 0`);
        await t.frames(20);
    }
    if (on("walka")) {
        await t.eval(`(function(){ if (window.Combat && Combat.setCombatMode) Combat.setCombatMode(true); else $gameSystem._combatMode = true; return 0; })()`);
        await t.frames(30);
        await t.eval(`(function(){ if (window.Combat && Combat.spendBreath) Combat.spendBreath(35); return 0; })()`);   // (the breath: the fifth bar)
        await t.frames(6);
        await shot("czysty_walka");
        await t.eval(`(function(){ if (window.Combat && Combat.setCombatMode) Combat.setCombatMode(false); else $gameSystem._combatMode = false; return 0; })()`);
        await t.frames(10);
    }
    if (on("burza")) {
        await t.eval(`(function(){ if (window.Storm && Storm.strike) Storm.strike(0); return 0; })()`);
        await t.frames(3);
        await shot("czysty_burza_blysk");
        console.log("SHADE", JSON.stringify(await t.json("CleanHUD.debug().shade")));
        await t.frames(60);
    }
    if (on("miasto")) {
        await t.eval(`(function(){ if (window.TownQuests) { TownQuests.start("K1"); TownQuests.track("K1"); } return 0; })()`);
        await t.go(8, 22, 44, 8);
        await t.eval(SETUP.replace("$gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);", "$gamePlayer.locate(22, 44); $gamePlayer.center(22, 44);"));
        await t.eval("CleanCompass.refresh(); 0");
        await t.frames(60);
        await shot("czysty_miasteczko");
        console.log("COMPASS", JSON.stringify(await t.json("CleanCompass.info()")), JSON.stringify(await t.json("CleanHUD.debug().shade")));
    }
    if (on("kamieniolom")) {
        await t.go(13, 30, 24, 2);
        await t.eval("$gameSystem.setDayNightHour(12); 0");
        await t.frames(60);
        await shot("czysty_kamieniolom");
        console.log("SHADE", JSON.stringify(await t.json("CleanHUD.debug().shade")));
    }
    if (on("menu") && PLUGINS.includes("MenuRing")) {
        await t.frames(200);
        await t.key("P");
        await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
        await t.frames(40);
        await shot("czysty_menu");
        await t.key("Escape");
        await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 10);
        await t.frames(20);
    }
    t.check("zrzuty zrobione", true);
});
