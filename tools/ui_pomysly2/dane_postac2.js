// Dane do makiet zakładki POSTAĆ (statystyki, obrażenia, odporności, ekwipunek, umiejętności) - zapis day40_farm, w grze (bez zmiany
// kodu) założone: kurtka 171, tarcza 155, płaszcz 112, plecak 114, buty 113.
//   CDP_PORT=9482 node tools/ui_pomysly2/dane_postac2.js  ->  zrzuty/postac2_dane.json, zrzuty/postac2_teraz.png
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
        for (const id of [171, 155, 112, 114, 113]) if (!$gameParty.numItems($dataItems[id])) $gameParty.gainItem($dataItems[id], 1);
        const E = window.Equipment;
        if (E) { E.equip("torso", 171); E.equip("left", 155); E.equip("cloak", 112); E.equip("back", 114); E.equip("feet", 113); }
        return 0; })()`);
    await t.frames(40);
    const d = await t.json(`(function(){
        const C = window.Combat, E = window.Equipment, R = window.MenuRing, F = Tawerna.api("Combat_parts").fight, SD = window.SkillData, out = {};
        const tryf = (k, f) => { try { out[k] = f(); } catch (e) { out[k] = "ERR " + e.message; } };
        tryf("name", () => $gameParty.leader().name());
        tryf("xp", () => R.heroXp());
        tryf("needs", () => R.needRows());
        tryf("goal", () => R.goalLine());
        tryf("debt", () => R.debtInfo());
        tryf("hero", () => { const h = C.hero(); return { level: h.level, xp: h.xp, points: h.points, skillPoints: h.skillPoints, skills: h.skills, attr: h.attr }; });
        tryf("attrs", () => ["str", "dex", "con", "per", "wil"].map(id => C.attrInfo(id)));
        tryf("slots", () => E.slots());
        tryf("choices", () => { const o = {}; for (const s of E.SLOTS) o[s.id] = E.choices(s.id); return o; });
        tryf("fight", () => {
            const sl = E.slots().find(s => s.id === "right");
            const h = sl.hand || "m0", id = h === "m0" ? 0 : Number(String(h).slice(1)) || 0;
            const w = F.MELEE[id] || F.MELEE[0], fists = F.MELEE[0];
            const perk = k => (C.perk ? C.perk(k) : 0) || 0;
            const s = C.strMult() * (1 + perk("melee.dmg")), pz = C.poiseMult() * (1 + perk("melee.poise"));
            const COMBO = [1, 1.1, 1.45, 1.6];
            const n = w.combo.length + (C.hasSkill && C.hasSkill("combo4") ? 1 : 0);
            const one = wp => ({ name: wp.name, dmg: wp.dmg, hit: Math.round(wp.dmg * s), series: Array.from({ length: wp.combo.length + (C.hasSkill && C.hasSkill("combo4") ? 1 : 0) }, (_, i) => Math.round(wp.dmg * COMBO[Math.min(i, 3)] * s)),
                heavy: Math.round(wp.dmg * 2.2 * s), heavyFull: Math.round(wp.dmg * 2.7 * s), crit: Math.round(wp.dmg * 1.6 * s), poise: Math.round(wp.poise * pz),
                poiseLast: Math.round(wp.poise * pz * 1.5), poiseHeavy: Math.round(wp.poise * pz * 2.5), breath: Math.round(wp.cost * (1 - perk("melee.breath"))), reach: wp.reach, sweep: !!wp.sweep });
            return { hand: h, weaponId: id, weapon: one(w), fists: one(fists), critChance: C.critChance(), critMul: 1.6 };
        });
        tryf("defense", () => {
            const sh = E.worn(155) ? F.SHIELDS[155] : null, ar = E.worn(171) ? F.ARMORS[171] : null;
            return { mhp: C.heroMhp ? C.heroMhp() : $gameParty.leader().mhp, breath: C.baseBreath ? C.baseBreath() : null, armor: ar ? ar.reduce : 0, armorName: ar ? ar.name : "",
                block: sh ? sh.reduce : 0.45, blockName: sh ? sh.name : "bez tarczy", blockBreath: sh ? sh.breath : 1, wound: typeof C.woundChance === "function" ? C.woundChance(1) : null, knock: typeof C.knockdownAt === "function" ? C.knockdownAt() : null,
                parry: typeof C.parryWindow === "function" ? C.parryWindow() : null, rollCost: typeof C.rollCost === "function" ? C.rollCost() : null, rollIFrames: typeof C.rollIFrames === "function" ? C.rollIFrames() : null,
                cloak: E.worn(112), boots: E.worn(113), backpack: E.worn(114), coldPerk: C.perk ? C.perk("cold") : 0, mind: typeof C.mindResist === "function" ? C.mindResist() : null };
        });
        tryf("trees", () => SD.TREES);
        tryf("skills", () => SD.SKILLS.map(k => ({ id: k.id, tree: k.tree, row: k.row, col: k.col, name: k.name, text: k.text, ranks: k.ranks, from: k.from, attr: k.attr, fx: k.fx })));
        tryf("rowLevel", () => SD.ROW_LEVEL);
        tryf("gold", () => $gameParty.gold());
        tryf("weight", () => [Survival.carriedWeight(), Survival.weightCap()]);
        return out; })()`);
    fs.writeFileSync(path.join(OUT, "postac2_dane.json"), JSON.stringify(d, null, 1));
    console.log(JSON.stringify({ defense: d.defense, choices: d.choices }).slice(0, 3000));
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    await t.eval(`(function(){ const s = SceneManager._scene; if (s.goTab) s.goTab("hero", 1); return 0; })()`);
    await t.frames(40);
    await t.shot(path.join(OUT, "postac2_teraz.png"));
    await t.eval(`(function(){ const s = SceneManager._scene; if (s.goTab) s.goTab("skills", 1); return 0; })()`);
    await t.frames(40);
    await t.shot(path.join(OUT, "postac2_umiejetnosci_teraz.png"));
});
