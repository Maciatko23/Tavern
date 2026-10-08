// Zrzuty tła do makiet UI (docs/ui_pomysly): mapa w dzień z HUD, ta sama bez HUD, menu P, plecak, dziennik.
//   CDP_PORT=9482 node tools/ui_pomysly/capture.js
// Gra z zapisu tests/fixtures/day40_farm (pole dziadka, lato, dzień 40), godzina 11, potrzeby włączone, minimapa widoczna.
"use strict";
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "zrzuty");

kit.test({ port: 9482, errorCheck: false }, async t => {
    const ok = await t.loadFixture("day40_farm", {});
    t.check("zapis wczytany", ok);
    await t.eval(`(function(){
        if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
        $gameSystem.setDayNightHour(11);
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
        const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; }
        const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78));
        if ($gameSystem.setStamina) $gameSystem.setStamina(Math.round($gameSystem.maxStamina ? $gameSystem.maxStamina() * 0.7 : 70));
        $gameSystem._minimapHidden = false; $gameSystem._combatMode = false;
        $gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);
        if (window.Hunting) Hunting.auto(false);
        if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        return 0; })()`);
    await t.frames(30);
    // kilka zdobyczy w liście (prawy dół)
    await t.eval(`(function(){
        $gameParty.gainItem($dataItems[1] || $dataItems[2], 0);
        const give = (id, n) => { const it = $dataItems[id]; if (!it) return; $gameParty.gainItem(it, n);
            $gameTemp.pushLootPopup(it.iconIndex, "+" + n + " " + it.name, "#ffffff", { gain: { key: "item:" + id, amount: n, name: it.name } }); };
        give(61, 3); give(64, 2); give(77, 4);
        return 0; })()`);
    await t.frames(70);
    const info = await t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, hour: $gameSystem.dayNightHour(), names: [61,64,77].map(i => $dataItems[i] && $dataItems[i].name),
        hud: SceneManager._scene.hudFadeElements().map(e => !!e), needs: $gameSystem._needs })`);
    console.log("INFO", JSON.stringify(info));
    await t.shot(path.join(OUT, "mapa_hud.png"));

    // bez HUD: warstwa HUD, okna i wszystko poza spritesetem ukryte
    await t.eval(`(function(){ const s = SceneManager._scene; s.__hidden = [];
        for (const c of s.children) if (c !== s._spriteset && c.renderable) { c.renderable = false; s.__hidden.push(c); }
        s.__wins = (s._windowLayer ? s._windowLayer.children : []).filter(w => w.visible); for (const w of s.__wins) w.visible = false;
        return s.__hidden.length; })()`);
    await t.frames(4);
    await t.shot(path.join(OUT, "mapa_bez_hud.png"));
    await t.eval(`(function(){ const s = SceneManager._scene; for (const c of s.__hidden) c.renderable = true; for (const w of s.__wins) w.visible = true; return 0; })()`);
    await t.frames(200);   // (zdobycze znikną, zanim zrobi się zdjęcie pod menu)

    // menu P
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    await t.shot(path.join(OUT, "menu_p.png"));
    // plecak
    await t.eval("SceneManager.push(Scene_Item); 0");
    await t.until("SceneManager._scene instanceof Scene_Item && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    await t.press("down"); await t.press("down");
    await t.frames(10);
    await t.shot(path.join(OUT, "plecak.png"));
    await t.eval("SceneManager.pop(); 0");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(10);
    // dziennik
    await t.eval("SceneManager.push(Journal.Scene_Journal); 0");
    await t.until("SceneManager._scene instanceof Journal.Scene_Journal && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    await t.shot(path.join(OUT, "dziennik.png"));
    const bag = await t.json(`$gameParty.items().slice(0, 40).map(i => [i.id, i.name, i.iconIndex, $gameParty.numItems(i), i.description])`);
    require("fs").writeFileSync(path.join(OUT, "plecak_dane.json"), JSON.stringify(bag, null, 1));
    const card = await t.json(`({ name: $gameParty.leader().name(), level: window.Combat && Combat.hero ? Combat.hero().level : null, day: $gameSystem.dayNightDay(),
        gold: $gameParty.gold(), weight: window.Survival && Survival.carriedWeight ? [Survival.carriedWeight(), Survival.weightCap()] : null,
        goals: window.Journal && Journal.GOALS ? Journal.GOALS.slice(0, 60).map(g => [g.id, g.name || g.title, g.chapter]) : null })`);
    require("fs").writeFileSync(path.join(OUT, "karta_dane.json"), JSON.stringify(card, null, 1));
    t.check("zrzuty zrobione", true);
});
