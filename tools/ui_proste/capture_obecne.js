// Zrzuty OBECNEGO menu P (MenuRing.js, wygląd Grafit) z nowej gry + tło mapy i prawdziwe dane do makiet docs/ui_proste/.
//   CDP_PORT=9578 node tools/ui_proste/capture_obecne.js
// Nowa gra (historia, bez wstępu), dom dziadka; menu P: każda zakładka na poziomie 1 (pasek zakładek) i w środku (zawartość).
// Wynik: docs/ui_proste/obecne_<zakladka>.png (+ _poziom1), tools/ui_proste/zrzuty/tlo_*.png, tools/ui_proste/zrzuty/dane.json
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_proste");
const RAW = path.join(__dirname, "zrzuty");

kit.test({ port: 9578, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    fs.mkdirSync(RAW, { recursive: true });
    t.check("nowa gra", await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true, minimap: false }));
    await t.eval(`(function(){ ConfigManager.uiClean = true; window.dispatchEvent(new Event('pointerdown')); return 0; })()`);
    // (a few things from the first days, so the bag and the figure are not empty: stones, branches, food, tools, plain clothes)
    await t.eval(`(function(){ const give = [[64, 12], [77, 9], [61, 5], [92, 4], [102, 6], [103, 3], [139, 4], [149, 2], [129, 1], [90, 1], [60, 1],
            [260, 1], [270, 1], [275, 1], [277, 1]];
        for (const [id, n] of give) if ($dataItems[id]) $gameParty.gainItem($dataItems[id], n);
        $gameParty.gainGold(14); const n = $gameSystem._needs; if (n) { n.food = 72; n.water = 58; } if ($gameSystem.setStamina) $gameSystem.setStamina(84);
        return 0; })()`);
    await t.frames(420);
    // the map alone (no HUD) and with the HUD
    await t.shot(path.join(RAW, "tlo_hud.png"));
    await t.eval(`(function(){ const s = SceneManager._scene; s.__hid = [];
        for (const c of s.children) if (c !== s._spriteset && c.renderable) { c.renderable = false; s.__hid.push(c); }
        return 0; })()`);
    await t.frames(4);
    await t.shot(path.join(RAW, "tlo_mapa.png"));
    await t.eval(`(function(){ const s = SceneManager._scene; for (const c of s.__hid) c.renderable = true; return 0; })()`);
    await t.frames(4);

    // the real data for the mock-ups
    const d = await t.json(`(function(){
        const a = $gameParty.leader(), out = {};
        const safe = f => { try { return f(); } catch (e) { return "ERR " + e.message; } };
        out.name = a.name(); out.map = $gameMap.displayName(); out.mapId = $gameMap.mapId(); out.gold = $gameParty.gold();
        out.hp = [a.hp, a.mhp];
        out.day = safe(() => $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : null);
        out.hour = safe(() => $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : null);
        out.needs = safe(() => $gameSystem._needs ? { food: $gameSystem._needs.food, water: $gameSystem._needs.water } : null);
        out.stamina = safe(() => $gameSystem.stamina ? $gameSystem.stamina() : null);
        out.weight = safe(() => window.Survival && Survival.carriedWeight ? [Survival.carriedWeight(), Survival.weightCap()] : null);
        out.debt = safe(() => window.Story ? { left: Story.left(), days: Story.daysLeft ? Story.daysLeft() : null } : null);
        out.hero = safe(() => { const h = Combat.hero(); const o = {}; for (const k in h) { const v = h[k]; if (typeof v !== "function") o[k] = v; } return o; });
        out.items = $gameParty.allItems().map(it => ({ id: it.id, kind: DataManager.isItem(it) ? "i" : DataManager.isWeapon(it) ? "w" : "a", name: it.name, icon: it.iconIndex, n: $gameParty.numItems(it), desc: it.description }));
        out.goals = safe(() => Journal.itemsForTab(0).slice(0, 14).map(g => ({ label: g.label, icon: g.icon, mark: g.mark, right: g.right || "" })));
        out.goalsDone = safe(() => Journal.GOALS.filter(Journal.goalDone).length + " / " + Journal.GOALS.length);
        out.tracked = safe(() => { const g = Journal.tracked(); return g ? { title: g.title, line: g.line, icon: g.icon } : null; });
        out.journalTabs = safe(() => Journal.TABS.slice());
        out.slots = safe(() => Equipment.slots().map(s => ({ id: s.id, label: s.label, item: s.item, name: s.name, none: s.none })));
        out.trees = safe(() => SkillData.TREES.map(x => ({ id: x.id, name: x.name, desc: x.desc })));
        out.options = safe(() => { const w = new Window_Options(new Rectangle(0, 0, 600, 400)); return w._list.map(c => ({ name: c.name, symbol: c.symbol, value: w.statusText ? w.statusText(w._list.indexOf(c)) : "" })); });
        out.saves = safe(() => [1, 2, 3, 4].map(id => { const i = DataManager.savefileInfo(id); return i ? { id, title: i.title, playtime: i.playtime, day: i.day, place: i.place } : null; }));
        return out; })()`);
    fs.writeFileSync(path.join(RAW, "dane.json"), JSON.stringify(d, null, 1));
    console.log(JSON.stringify(d).slice(0, 1500));

    // the menu
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(60);
    const names = { item: "plecak", journal: "dziennik", hero: "postac", options: "opcje", save: "zapisz", gameEnd: "zakoncz" };
    const sub = { hero: true, item: true, journal: true };
    for (let i = 0; i < 6; i++) {
        let info = await t.json("MenuRing.info()");
        const tab = info.active, nm = names[tab] || tab;
        await t.frames(20);
        await t.shot(path.join(OUT, "obecne_" + nm + "_poziom1.png"));
        await t.key("O"); await t.frames(14);
        if (sub[tab]) { await t.key("O"); await t.frames(14); }
        info = await t.json("MenuRing.info()");
        await t.shot(path.join(OUT, "obecne_" + nm + ".png"));
        console.log("TAB", tab, "level", info.level, JSON.stringify(info.keys));
        if (tab === "hero") {   // Ekwipunek: P up to the sub-bar, D, O in
            await t.key("P"); await t.frames(10);
            await t.key("D"); await t.frames(14);
            await t.key("O"); await t.frames(14);
            await t.shot(path.join(OUT, "obecne_postac_ekwipunek.png"));
            info = await t.json("MenuRing.info()");
            console.log("EQ", info.level, info.sub, JSON.stringify(info.keys));
            await t.key("P"); await t.frames(10);
            await t.key("D"); await t.frames(14);
            await t.key("O"); await t.frames(14);
            await t.shot(path.join(OUT, "obecne_postac_umiejetnosci.png"));
            await t.key("P"); await t.frames(10);
            info = await t.json("MenuRing.info()");
            if (info.level === 3) { await t.key("P"); await t.frames(10); }
            await t.key("A"); await t.frames(10);
            await t.key("A"); await t.frames(10);
        } else if (sub[tab]) { await t.key("P"); await t.frames(10); }
        await t.key("P"); await t.frames(10);
        info = await t.json("MenuRing.info()");
        if (info.level !== 1) { await t.key("P"); await t.frames(10); }
        await t.key("D");
        await t.frames(24);
    }
    t.check("zrzuty", true);
});
