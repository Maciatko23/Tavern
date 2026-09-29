// Combat.js split in three (Combat.js, Combat_Fight.js, Combat_UI.js - stage 3, batch C3) without the game: window.Combat keeps
// every name it had before the split (Combat.perk(key) is asked by every system; TavernLife and the tests put their own over
// perk / gainXp); the parts are in the family's bag and refuse the wrong order with a readable error; an older save's
// $gameSystem._hero (level 6 as in day40_farm) is adopted into _tw.hero with everything kept, and its _combatMode / _combatHand move
// into _tw.combat on loading (the old names still lead there, none of them saved again); the skills' perks; levels and a kill
// (the bus: "levelUp" per level, the XP of Hunting's "kill").
const unit = require("../lib/unit.js");

// window.Combat before the split (Combat.js 2026-09-28): the names other plugins and the tests use
const OLD_API = ["ATTRS", "SKILLS", "TREES", "MELEE", "SHIELDS", "MAX_LEVEL", "ATTR_MAX", "POINTS_PER_LEVEL", "XP", "KILL_XP",
    "hero", "attr", "hasSkill", "skillRank", "perk", "perkRoll", "skillText", "ROW_LEVEL", "xpToNext", "gainXp", "killXp", "skillBlock", "learnSkill",
    "spendPoints", "discover", "placeLevel", "levelColor", "combatMode", "setCombatMode", "maxBreath", "breathNow", "spendBreath", "breath", "winded", "RUN",
    "canRun", "hand", "handMelee", "switchHand", "shield", "pressAttack", "pressDodge", "hitPlayer", "enemyHurtFx", "hitstop", "numberAt", "sparksAt",
    "shovePlayer", "strMult", "poiseMult", "critChance", "rollCost", "rollIFrames", "parryWindow", "knockdownAt", "carryBonus", "gatherBonus", "workSpeed",
    "dexWork", "tired", "TIRED_AT", "heroMhp", "comboWindow", "aimSteady", "baseBreath", "mapFreePlay", "act", "stopFrames", "ROLL_KIND", "KNOCK_KIND",
    "resetAct", "Scene_Hero", "unspent"];
const FILES = ["TawernaCore", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI"];

// a save as the game stores it, read back: plain fields of a Game_System (what JsonEx gives)
function oldSave(Game_System) {
    const sys = JSON.parse(JSON.stringify({
        _hero: { level: 6, xp: 890, attr: { str: 5, dex: 5, con: 5, per: 5, wil: 5 }, points: 15, skillPoints: 5, skills: { m_power: 2, combo4: true },
            firsts: { i60: true }, seen: { m3: true, m19: true }, ready: true },
        _combatMode: true, _combatHand: "m154", _other: 1 }));
    Object.setPrototypeOf(sys, Game_System.prototype);
    return sys;
}

unit.test(t => {
    function Game_System() {}
    let sys = null;
    const globals = { Game_System };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const C = w.Combat, TW = w.Tawerna, parts = TW.api("Combat_parts");

    // ---- the API and the parts
    t.eq("window.Combat has every name it had before the split (and no other)", Object.keys(C).sort(), OLD_API.slice().sort());
    t.check("... it is the core's Combat (Tawerna.api) and the parts are in the bag: core, fight, ui",
        TW.api("Combat") === C && !!(parts && parts.core && parts.fight && parts.ui), parts && Object.keys(parts));
    const writable = ["perk", "gainXp", "hitPlayer", "hero"].every(k => Object.getOwnPropertyDescriptor(C, k).writable);
    t.check("... perk, gainXp, hitPlayer, hero are plain fields (TavernLife puts its own over Combat.perk, the tests over gainXp)", writable);
    t.check("... the fight's names lead to Combat_Fight.js (act, MELEE, the functions), the Postać screen to Combat_UI.js",
        C.act === parts.fight.act && C.MELEE === parts.fight.MELEE && C.MELEE[154].name === "Oszczep" && typeof C.hitPlayer === "function" &&
        C.Scene_Hero === parts.ui.Scene_Hero && typeof C.Scene_Hero === "function");
    let err = "";
    try { unit.load(["TawernaCore", "Skills_Data", "Combat", "Combat_UI"]); } catch (e) { err = String(e.message); }
    t.check("Combat_UI.js without Combat_Fight.js above it: a readable error", /Combat_UI\.js: musi być pod Combat\.js i Combat_Fight\.js/.test(err), err);

    // ---- an older save: _hero adopted, _combatMode / _combatHand moved in on loading
    sys = oldSave(Game_System);
    const h = C.hero();
    t.check("the old save's hero is adopted: _tw.hero, level 6, 890 XP, the attributes, 15 + 5 points, the skills",
        h === sys._tw.hero && h.level === 6 && h.xp === 890 && h.attr.con === 5 && h.points === 15 && h.skillPoints === 5 && h.skills.m_power === 2 && h.firsts.i60 && h.ready,
        { tw: Object.keys(sys._tw || {}), level: h.level, xp: h.xp });
    t.check("... the old name $gameSystem._hero is a hidden way to it", sys._hero === h && !Object.keys(sys).includes("_hero"));
    TW.emit("load", {});
    const saved = JSON.parse(JSON.stringify(sys));
    t.check("on loading _combatMode / _combatHand move into _tw.combat (the mode on, the spear in hand); the old names read them",
        sys._tw.combat.mode === true && sys._tw.combat.hand === "m154" && sys._combatMode === true && sys._combatHand === "m154" && C.combatMode() === true, sys._tw.combat);
    t.check("... saved again: only _tw (hero, combat with versions), none of the old names; the rest as it was",
        !("_hero" in saved) && !("_combatMode" in saved) && !("_combatHand" in saved) && saved._other === 1 && saved._tw.hero.level === 6 && saved._tw._v.hero === 1 &&
        saved._tw._v.combat === 1, Object.keys(saved));
    sys._combatMode = false;
    sys._combatHand = "m60";
    t.check("... writing the old names writes the new place (the kit's quiet mode, the tests)", sys._tw.combat.mode === false && sys._tw.combat.hand === "m60" && C.combatMode() === false);

    // ---- the skills' perks (a stage-1 `true` is rank 1)
    t.check("perks: Mocna ręka rank 2 = +10% melee damage; Płynne kombo saved as true = rank 1; nothing else",
        Math.abs(C.perk("melee.dmg") - 0.1) < 1e-9 && C.skillRank("combo4") === 1 && C.hasSkill("combo4") && C.perk("hp.max") === 0 && C.skillRank("d_body") === 0);

    // ---- levels and the bus
    const bus = [];
    TW.on("levelUp", e => bus.push(e.level), { owner: "CombatUnit" });
    const need = C.xpToNext(6) - 890 + C.xpToNext(7);
    const got = C.gainXp(need, "test");
    t.check("XP to level 8 (1200 - 890 + 1500): two levels, +6 attribute points, +2 skill points; the bus says levelUp 7 and 8",
        got === need && h.level === 8 && h.xp === 0 && h.points === 21 && h.skillPoints === 7 && bus.join() === "7,8", { got, level: h.level, xp: h.xp, bus });
    TW.emit("kill", { kind: "boar", by: "hero", how: "melee", level: 3 });
    t.eq("Hunting's kill on the bus: its XP (a level-3 boar for a level-8 hero: 20 x 1.4 x 0.25 = 7)", h.xp, 7);
});
