// Zrzuty tła do makiet UI, runda 2 (docs/ui_pomysly2): obecna gra w „Czystym widoku”.
//   CDP_PORT=9482 node tools/ui_pomysly2/capture.js
// Zapis tests/fixtures/day40_farm (pole dziadka, lato, dzień 40), godzina 11, potrzeby włączone.
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "zrzuty");
fs.mkdirSync(OUT, { recursive: true });

kit.test({ port: 9482, errorCheck: false }, async t => {
    const ok = await t.loadFixture("day40_farm", {});
    t.check("zapis wczytany", ok);
    await t.eval(`(function(){
        ConfigManager.uiClean = true;
        if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
        $gameSystem.setDayNightHour(11);
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
        const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; }
        const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78));
        if ($gameSystem.setStamina) $gameSystem.setStamina(70);
        $gameSystem._combatMode = false;
        if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); }
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
    const info = await t.json(`({ clean: window.CleanHUD ? CleanHUD.isClean() : null, compass: window.CleanCompass && CleanCompass.info ? CleanCompass.info() : null,
        goal: window.CleanHUD && CleanHUD.goalInfo ? CleanHUD.goalInfo(SceneManager._scene) : null })`);
    console.log("INFO", JSON.stringify(info).slice(0, 600));
    fs.writeFileSync(path.join(OUT, "hud_info.json"), JSON.stringify(info, null, 1));
    await t.shot(path.join(OUT, "mapa_hud.png"));

    // bez HUD
    await t.eval(`(function(){ const s = SceneManager._scene; s.__hidden = [];
        for (const c of s.children) if (c !== s._spriteset && c.renderable) { c.renderable = false; s.__hidden.push(c); }
        s.__wins = (s._windowLayer ? s._windowLayer.children : []).filter(w => w.visible); for (const w of s.__wins) w.visible = false;
        return s.__hidden.length; })()`);
    await t.frames(4);
    await t.shot(path.join(OUT, "mapa_bez_hud.png"));
    // ten sam widok wieczorem (zegar z księżycem)
    await t.eval("$gameSystem.setDayNightHour(21.5); 0");
    await t.frames(30);
    await t.shot(path.join(OUT, "mapa_bez_hud_noc.png"));
    await t.eval("$gameSystem.setDayNightHour(11); 0");
    await t.frames(30);
    await t.eval(`(function(){ const s = SceneManager._scene; for (const c of s.__hidden) c.renderable = true; for (const w of s.__wins) w.visible = true; return 0; })()`);
    await t.frames(200);

    const waitScene = name => t.until(`SceneManager._scene && SceneManager._scene.constructor.name === ${JSON.stringify(name)} && !SceneManager.isSceneChanging()`, 15);
    // menu P (pierścień)
    await t.key("P");
    await waitScene("Scene_Menu");
    await t.frames(40);
    await t.shot(path.join(OUT, "menu_p.png"));
    const pushShot = async (expr, name, file, extra) => {
        await t.eval(`SceneManager.push(${expr}); 0`);
        await waitScene(name);
        await t.frames(30);
        if (extra) await extra();
        await t.shot(path.join(OUT, file));
        await t.eval("SceneManager.pop(); 0");
        await waitScene("Scene_Menu");
        await t.frames(10);
    };
    await pushShot("Scene_Item", "Scene_Item", "plecak.png", async () => { await t.press("down"); await t.press("down"); await t.frames(8); });
    await pushShot("Journal.Scene_Journal", "Scene_Journal", "dziennik.png");
    await pushShot("Scene_Options", "Scene_Options", "opcje.png");
    await pushShot("Scene_Save", "Scene_Save", "zapis.png");
    await pushShot("Tawerna.api('Combat_parts').ui.Scene_Hero", "Scene_Hero", "postac.png");
    t.check("zrzuty zrobione", true);
});
