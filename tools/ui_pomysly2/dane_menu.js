// Prawdziwe dane do makiet menu P (Grafit): zapis day40_farm, to samo co capture.js.
//   CDP_PORT=9482 node tools/ui_pomysly2/dane_menu.js   ->  tools/ui_pomysly2/zrzuty/menu_dane.json
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");

kit.test({ port: 9482, errorCheck: false }, async t => {
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){ $gameSystem.setDayNightHour(11); const n = $gameSystem._needs; if (n) { n.food = 64; n.water = 41; }
        const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78)); if ($gameSystem.setStamina) $gameSystem.setStamina(70); return 0; })()`);
    await t.frames(20);
    const d = await t.json(`(function(){
        const a = $gameParty.leader(), out = {};
        out.name = a.name(); out.day = $gameSystem.dayNightDay(); out.gold = $gameParty.gold();
        out.items = $gameParty.items().length; out.allItems = $gameParty.allItems().length;
        out.weight = window.Survival && Survival.carriedWeight ? [Survival.carriedWeight(), Survival.weightCap()] : null;
        try { const S = window.Story; out.debt = S ? { left: S.left(), days: S.daysLeft ? S.daysLeft() : null } : null; } catch (e) { out.debt = String(e); }
        try { const h = Combat.hero(); out.hero = { level: h.level, xp: h.xp, next: h.next || h.xpNext || null, attrs: h.attrs || h.attributes || null, points: h.points, skillPoints: h.skillPoints }; } catch (e) { out.hero = String(e); }
        try { out.goal = Journal.tracked ? Journal.tracked() : null; if (out.goal) delete out.goal.goal; } catch (e) {}
        try { const D = window.Journal && Journal.data ? Journal.data() : null; out.done = D ? Object.keys(D.done || {}).length : null; out.goals = Journal.GOALS.length; } catch (e) {}
        try { out.tools = (window.Durability ? Object.keys(Durability.TOOLS).map(Number) : []).map(id => $dataItems[id] && $gameParty.numItems($dataItems[id]) ? { id, name: $dataItems[id].name, icon: $dataItems[id].iconIndex, left: Durability.left(id), life: Durability.lifeOf(id) } : null).filter(Boolean); } catch (e) { out.tools = String(e); }
        out.weapons = $gameParty.weapons().map(w => [w.name, w.iconIndex]); out.armors = $gameParty.armors().map(w => [w.name, w.iconIndex]);
        out.equips = a.equips().map(e => e ? [e.name, e.iconIndex] : null);
        out.mapName = $gameMap.displayName(); out.dog = window.Dog && Dog.state ? !!Dog.state().tame : null;
        return out; })()`);
    fs.writeFileSync(path.join(__dirname, "zrzuty", "menu_dane.json"), JSON.stringify(d, null, 1));
    console.log(JSON.stringify(d).slice(0, 2500));
});
