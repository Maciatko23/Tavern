// The hero's growth (Combat.js + Skills_Data.js) and where the P menu shows it: the numbers (level 100 at most, attributes up to 60,
// 3 attribute points and 1 skill point a level, 10 trees), a level's points, the P menu's Postać first with the points to give,
// the points given (Kondycja: +5 health a point), a skill learnt rank by rank, a skill's way (the level, the skill before it, an
// attribute), what one more point in each attribute does, the points and skills after a save and a load, level 100.
// (2026-10-28: the old Postać screen - Combat_UI's Scene_Hero in MenuPanel's panel - is gone; the P menu's Postać and Umiejętności
// pages are MenuRing.js's, walked by the keys in tests/menu_lista_test.js. Its numbers are checked here without a screen.)
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9468, errorCheck: "bez błędów w konsoli" }, async t => {
    t.check("a new game on grandpa's field (Map003)", await t.newGame({ map: 3, x: 22, y: 14, hour: 12, quiet: true }));
    const J = e => t.json(e);

    t.check("the numbers: level 100 at most, attributes up to 60, 3 attribute points and 1 skill point a level; 10 trees, ~100 skills",
        (await J("({ max: Combat.MAX_LEVEL, attr: Combat.ATTR_MAX, pts: Combat.POINTS_PER_LEVEL, trees: Combat.TREES.length, skills: Combat.SKILLS.length })")).max === 100 &&
        (await t.eval("Combat.ATTR_MAX")) === 60 && (await t.eval("Combat.TREES.length")) === 10 && (await t.eval("Combat.SKILLS.length")) >= 90);
    // level 2: 3 attribute points, 1 skill point
    await t.eval("Combat.gainXp(Combat.xpToNext(1), 'test'); 0");
    await t.frames(40);
    const h0 = await J("({ lv: Combat.hero().level, p: Combat.hero().points, s: Combat.hero().skillPoints, unspent: Combat.unspent() })");
    t.check("level 2 brings 3 attribute points and 1 skill point", h0.lv === 2 && h0.p === 3 && h0.s === 1 && h0.unspent === 4, h0);

    // ================= the P menu: Postać first, the points to give =================
    await t.eval("window.dispatchEvent(new Event('pointerdown')); SceneManager.push(Scene_Menu); 0");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging() && !!MenuRing.info()", 10);
    await t.frames(20);
    const menu = await J("(function(){ const i = MenuRing.info(); return { tabs: i.tabs, active: i.active, points: i.stats && i.stats.points, plus: i.stats && i.stats.plus, scene: !!Combat.Scene_Hero }; })()");
    t.check("the P menu opens on Postać (the first tab, then Ekwipunek, Umiejętności), 3 points to give; no old Postać screen", menu.tabs.slice(0, 3).join() === "hero,equip,skills" && menu.active === "hero"
        && menu.points === 3 && menu.plus === true && menu.scene === false, menu);
    await t.eval("SceneManager.goto(Scene_Map); 0");
    await t.until(t.onMap(3), 10);
    await t.frames(10);

    // ================= the points given: Kondycja +2 =================
    const mhp0 = await t.eval("$gameParty.leader().mhp");
    const given = await J("(function(){ const ok = Combat.spendPoints({ con: 2 }); const h = Combat.hero(), a = $gameParty.leader(); return { ok, con: h.attr.con, points: h.points, mhp: a.mhp, hp: a.hp }; })()");
    t.check("two points on Kondycja: 7, one point left, +10 health (5 a point), full", given.ok && given.con === 7 && given.points === 1 && given.mhp === mhp0 + 10 && given.hp === given.mhp, { mhp0, given });
    t.check("no more than the free points", (await t.eval("Combat.spendPoints({ str: 2 })")) === false && (await t.eval("Combat.hero().points")) === 1);

    // ================= a skill: learnt rank by rank =================
    const locked = await J("({ known: Combat.skillRank('charge'), why: Combat.skillBlock('charge'), learnt: Combat.learnSkill('charge') })");
    t.check("a closed skill (Rozpęd: Mocna ręka first, Siła 12, level 4): not learnt", locked.known === 0 && /Najpierw|Wymaga/.test(locked.why) && !locked.learnt, locked);
    const learnt = await J("({ ok: Combat.learnSkill('m_power'), rank: Combat.skillRank('m_power'), s: Combat.hero().skillPoints, perk: Combat.perk('melee.dmg'), unspent: Combat.unspent() })");
    t.check("Mocna ręka learnt: rank 1, the point spent, melee damage +5%", learnt.ok && learnt.rank === 1 && learnt.s === 0 && Math.abs(learnt.perk - 0.05) < 1e-9 && learnt.unspent === 1, learnt);
    t.check("no point left: the next rank is not given", (await t.eval("Combat.learnSkill('m_power')")) === false && (await t.eval("Combat.skillRank('m_power')")) === 1);

    // ================= a skill's way and its ranks =================
    const low = await J("({ lv: Combat.hero().level, why: Combat.skillBlock('riposte') })");
    t.check("at a low level the second rows are closed: Kontra wants level 10", low.why === "Wymaga poziomu 10.", low);
    await t.eval("while (Combat.hero().level < 12) Combat.gainXp(Combat.xpToNext(Combat.hero().level), 'test'); Combat.hero().skillPoints = 20; 0");
    const way = await J(`({ riposte: Combat.skillBlock('riposte'), combo: Combat.learnSkill('combo4'), riposte2: Combat.skillBlock('riposte'), deep: Combat.skillBlock('m_master') })`);
    t.check("the way (level 12): Kontra opens only after Płynne kombo, then wants Czujność 12; the deepest want level 48", /Najpierw: Płynne kombo/.test(way.riposte) && way.combo === true && way.riposte2 === "Wymaga: Czujność 12." && way.deep === "Wymaga poziomu 48.", way);
    const ranks = await J(`(function(){ const a = Combat.learnSkill('m_power'), b = Combat.learnSkill('m_power'), c = Combat.learnSkill('m_power'); return { a, b, c, rank: Combat.skillRank('m_power'), perk: Math.round(Combat.perk('melee.dmg') * 100) / 100,
        why: Combat.skillBlock('m_power') }; })()`);
    t.check("ranks: Mocna ręka up to 3 (+15% melee damage), no fourth", ranks.a && ranks.b && !ranks.c && ranks.rank === 3 && ranks.perk === 0.15 && /najwyższy/.test(ranks.why), ranks);

    // ================= what the points really do: one more point in each attribute =================
    const stats = () => J(`({ str: Combat.hero().attr.str, dex: Combat.hero().attr.dex, con: Combat.hero().attr.con, per: Combat.hero().attr.per, wil: Combat.hero().attr.wil,
        strMult: Math.round(Combat.strMult() * 1000) / 1000, poise: Math.round(Combat.poiseMult() * 1000) / 1000, carry: Combat.carryBonus(), cap: Survival.weightCap(),
        combo: Combat.comboWindow(), aim: Math.round(Combat.aimSteady() * 1000) / 1000,
        mhp: $gameParty.leader().mhp, breath: Combat.baseBreath(), down: Combat.knockdownAt(), crit: Math.round(Combat.critChance() * 1000) / 10 })`);
    await t.eval("Combat.gainXp(Combat.xpToNext(Combat.hero().level) + Combat.xpToNext(Combat.hero().level + 1), 'test'); 0");   // two levels: 6 more points
    await t.frames(30);
    const b0 = await stats();
    t.check("one point each on Siła, Zręczność, Kondycja, Czujność (as Postać's O gives them)", await t.eval("Combat.spendPoints({ str: 1, dex: 1, con: 1, per: 1 })"));
    const b1 = await stats();
    t.check("Siła, Zręczność, Kondycja, Czujność +1 (Hart ducha untouched)", b1.str === b0.str + 1 && b1.dex === b0.dex + 1 && b1.con === b0.con + 1 && b1.per === b0.per + 1 && b1.wil === b0.wil, { b0, b1 });
    t.check("Siła (small steps now, up to 60): blows +3.5%, balance +4.5%, 1 more carried", Math.abs(b1.strMult - b0.strMult - 0.035) < 0.002 && Math.abs(b1.poise - b0.poise - 0.045) < 0.002 && b1.carry === b0.carry + 1 && b1.cap === b0.cap + 1, { b0, b1 });
    t.check("Zręczność: 1 frame more for the series, aiming 1% quicker", b1.combo === b0.combo + 1 && Math.abs(b0.aim - b1.aim - 0.01) < 0.002, { b0, b1 });
    t.check("Kondycja: +5 health, +2 breath, knocked down only by a harder blow (+1.8)", b1.mhp === b0.mhp + 5 && b1.breath === b0.breath + 2 && b1.down - b0.down >= 1 && b1.down - b0.down <= 2, { b0, b1 });
    t.check("Czujność: criticals 0.7% likelier", Math.abs(b1.crit - b0.crit - 0.7) < 0.05, { b0, b1 });
    // they stay after a save and a load (and so do the skills)
    await t.eval("$gameSystem.onBeforeSave(); window.__save = JsonEx.stringify(DataManager.makeSaveContents()); 0");
    await t.eval("Combat.hero().attr.str = 5; Combat.hero().attr.con = 5; Combat.hero().skills = {}; 0");
    await t.eval("DataManager.extractSaveContents(JsonEx.parse(window.__save)); 0");
    await t.frames(5);
    const b2 = await stats();
    t.check("after saving and loading the points and the skills are still there", b2.str === b1.str && b2.con === b1.con && b2.mhp === b1.mhp && (await t.eval("Combat.skillRank('m_power')")) === 3
        && Math.abs((await t.eval("Combat.perk('melee.dmg')")) - 0.15) < 1e-9, { b1, b2 });

    // ================= level 100 =================
    await t.eval("(function(){ let n = 0; for (let L = 1; L < 100; L++) n += Combat.xpToNext(L); Combat.gainXp(n, 'test'); })(); 0");   // (all of it to 100)
    await t.frames(10);
    const top = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp, more: Combat.gainXp(100, 'x') })");
    t.check("level 100 is the top: no more experience after it", top.lv === 100 && top.xp === 0 && top.more === 0, top);
    const deep = await J("({ ok: Combat.skillBlock('m_master'), row: Combat.ROW_LEVEL })");
    t.check("the deepest skills ask for level 48 (rows: 1, 4, 10, 20, 32, 48)", JSON.stringify(deep.row) === "[1,4,10,20,32,48]", deep);
});
