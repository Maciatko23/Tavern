// Dane i zrzuty do makiet widoku Postać (docs/ui_pomysly2/postac_*.png): zapis day40_farm, obecna gra (Grafit, MenuRing v3, Equipment).
//   CDP_PORT=9482 node tools/ui_pomysly2/dane_postac.js  ->  zrzuty/postac_dane.json, zrzuty/postac_bez_hud.png, zrzuty/postac_teraz.png
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
        const n = $gameSystem._needs; if (n) { n.food = 72; n.water = 70; }
        if (window.Hunting) { Hunting.auto(false); for (const x of Hunting.animals.slice()) Hunting.removeAnimal(x); }
        if (window.Birds && Birds.auto) Birds.auto(false);
        if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        $gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);
        return 0; })()`);
    await t.frames(60);
    await t.eval(`(function(){ const s = SceneManager._scene;
        for (const c of s.children) if (c !== s._spriteset) c.renderable = false;
        for (const w of (s._windowLayer ? s._windowLayer.children : [])) w.visible = false; return 0; })()`);
    await t.frames(3);
    await t.shot(path.join(OUT, "postac_bez_hud.png"));
    await t.eval(`(function(){ const s = SceneManager._scene; for (const c of s.children) c.renderable = true;
        for (const w of (s._windowLayer ? s._windowLayer.children : [])) w.visible = true; return 0; })()`);
    await t.frames(5);
    const d = await t.json(`(function(){
        const C = window.Combat, E = window.Equipment, R = window.MenuRing, out = {};
        out.name = $gameParty.leader().name();
        try { out.xp = R.heroXp(); } catch (e) { out.xp = String(e); }
        try { out.needs = R.needRows(); } catch (e) { out.needs = String(e); }
        try { out.goal = R.goalLine(); } catch (e) { out.goal = String(e); }
        try { out.debt = R.debtInfo(); } catch (e) { out.debt = String(e); }
        try { const h = C.hero(); out.level = h.level; out.points = h.points; out.skillPoints = h.skillPoints; } catch (e) {}
        try { out.attrs = ["str", "dex", "con", "per", "spi", "wil", "vig", "agi", "end", "mind"].map(id => C.attrInfo(id)).filter(Boolean); } catch (e) { out.attrs = String(e); }
        try { out.slots = E.slots(); } catch (e) { out.slots = String(e); }
        try { out.choices = {}; for (const s of E.SLOTS) out.choices[s.id] = E.choices(s.id); } catch (e) { out.choicesErr = String(e); }
        out.gold = $gameParty.gold(); out.dog = window.Dog && Dog.state ? Dog.state() : null;
        if (out.dog) out.dog = { tame: out.dog.tame, name: out.dog.name, hp: out.dog.hp, mhp: out.dog.mhp, level: out.dog.level };
        return out; })()`);
    fs.writeFileSync(path.join(OUT, "postac_dane.json"), JSON.stringify(d, null, 1));
    console.log(JSON.stringify(d).slice(0, 3000));
    // obecny widok Postać (dla porównania)
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    await t.eval(`(function(){ const s = SceneManager._scene; if (s.goTab) s.goTab("hero", 1); return 0; })()`);
    await t.frames(40);
    await t.shot(path.join(OUT, "postac_teraz.png"));
    console.log("MENU", JSON.stringify(await t.json("window.MenuRing && MenuRing.info ? MenuRing.info() : null")).slice(0, 500));
});
