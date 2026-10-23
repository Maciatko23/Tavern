// Combat's numbers without the game (Combat.js, Combat_Fight.js, Skills_Data.js): the XP curve to level 100 and its top, the XP of a
// kill by the enemy's level against the hero's, the colours of an enemy's level, a discovery once; what the five attributes give (at
// the start, at 25, at the caps of 60) and the skills that add to it; the breath (Kondycja, tired, wounded), spending it and being
// winded; the blow from hiding and the series; the Postać card's rows of an attribute. The things tests/unit/combat.test.js already
// checks (the API, the old save, levels by the bus) are not repeated here; the gear in the fight is tests/unit/combat_gear.test.js.
// Mirrors tests/combat_test.js (the curve 500 ... 2100, life 113 and breath 104 at Kondycja 7) and tests/creatures_test.js (Hart ducha
// 15% at 5, 90% at 30, less against a stronger one).
const unit = require("../lib/unit.js");

const FILES = ["TawernaCore", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI"];
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);
const round = a => a.map(v => Math.round(v * 1000) / 1000);

unit.test(t => {
    // the world the formulas read: a Game_System (the hero's state, the strength left, a wound) and the party
    function Game_System() {}
    let sys = null;
    const world = { stamina: 1, wounded: false };
    const globals = { Game_System, $gameParty: { leader: () => null, numItems: () => 0 }, $dataItems: [] };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const C = w.Combat, F = w.Tawerna.api("Combat_parts").fight;
    // a fresh hero: level, every attribute (all), some attributes, skills; the breath full again
    const fresh = (o = {}) => {
        sys = new Game_System();
        sys.staminaRatio = () => world.stamina;
        sys.stamina = () => world.stamina * 100;
        sys.isWounded = () => world.wounded;
        const h = C.hero();
        h.level = o.level || 1;
        for (const a of Object.keys(h.attr)) h.attr[a] = o.all || 5;
        Object.assign(h.attr, o.attr || {});
        h.skills = Object.assign({}, o.skills || {});
        world.stamina = 1;
        world.wounded = false;
        C.resetAct();
        return h;
    };

    // ---- experience
    t.eq("XP to the next level: 500, 600, 700, 900, 1000, 1200 (levels 1-6), 2100 (9 -> 10), 13 300 (19 -> 20), 82 400 (29 -> 30)",
        [1, 2, 3, 4, 5, 6, 9, 19, 29].map(C.xpToNext), [500, 600, 700, 900, 1000, 1200, 2100, 13300, 82400]);
    const curve = Array.from({ length: 99 }, (_, i) => C.xpToNext(i + 1));
    t.check("... the curve never falls and is a whole hundred at every level (1-99)", curve.every((v, i) => v % 100 === 0 && v >= 100 && (!i || v >= curve[i - 1])));
    let h = fresh({ level: 99 });
    const top = C.gainXp(C.xpToNext(99) + 777, "test");
    t.check("level 99 -> 100 (MAX_LEVEL): the rest of the XP is dropped (xp 0), +3 attribute points, +1 skill point; no XP after that",
        C.MAX_LEVEL === 100 && h.level === 100 && h.xp === 0 && h.points === 3 && h.skillPoints === 1 && top > 0 && C.gainXp(500) === 0, { level: h.level, xp: h.xp });
    h = fresh();
    t.eq("gainXp rounds (2.6 -> 3) and gives nothing for 0 or less", [C.gainXp(2.6), h.xp, C.gainXp(0), C.gainXp(-5), h.xp], [3, 3, 0, 0, 3]);
    t.eq("a discovery: +40 XP once (XP.discovery), the same id again nothing, another with its own XP",
        [C.discover("grota", "Grota"), h.xp, C.discover("grota", "Grota"), C.discover("wieza", "Wieża", 70), h.xp], [true, 43, false, true, 113]);

    // ---- a kill's XP: base x (1 + 20% a level of the enemy), x0.6 when 3-4 levels under the hero, x0.25 when 5+ under
    fresh({ level: 1 });
    const k1 = [C.killXp("wolf", 1), C.killXp("wolf", 5), C.killXp("bear", 3), C.killXp("nikt", 1), C.killXp("boss_90", 1)];
    fresh({ level: 10 });
    const k10 = [C.killXp("wolf", 5), C.killXp("wolf", 7), C.killXp("wolf", 8), C.killXp("wolf", 6), C.killXp("rabbit", 1)];
    t.eq("killXp at hero level 1: wolf 15 / level 5 27, bear level 3 84, unknown kind 10, the last guard 2500; at 10: wolf 5 -> 7 (x0.25), 7 -> 20 (x0.6), " +
        "8 -> 36, 6 -> 18 (x0.6), rabbit 1 -> 1", [k1, k10], [[15, 27, 84, 10, 2500], [7, 20, 36, 18, 1]]);
    fresh({ level: 10 });
    t.eq("an enemy's level colour: 4+ under grey, up to 1 over white, 2-3 over orange, more red",
        [6, 7, 11, 12, 13, 14].map(C.levelColor), ["#8b9097", "#eceef0", "#eceef0", "#ffa64a", "#ffa64a", "#ff4b3e"]);

    // ---- what the attributes give
    const stats = () => [C.strMult(), C.poiseMult(), C.critChance(), C.rollCost(), C.rollIFrames(), C.parryWindow(), C.knockdownAt(), C.woundChance(0.3),
        C.carryBonus(), C.gatherBonus(), C.dexWork(), C.comboWindow(), C.aimSteady(), C.baseBreath(), C.heroMhp(), C.mindResist(0), C.mindTime(100)];
    fresh();
    t.eq("every attribute 5 (the start): nothing added - x1, x1, crit 3%, roll 24 breath / 13 frames safe, parry 8 frames, knocked down at 60, wound 30% of 30%, " +
        "no carry, work x1, combo window 8, aim x1, breath 100, life 100, mind 15%, fear 100 frames", round(stats()),
        [1, 1, 0.03, 24, 13, 8, 60, 0.3, 0, 0, 1, 8, 1, 100, 100, 0.15, 100]);
    fresh({ all: 25 });
    t.eq("every attribute 25: blows x1.7, balance x1.9, crit 17%, roll 19 / 17 frames, parry 13, knocked down at 96, wound 21.6%, carry +18, gather -10%, " +
        "work x1.2, combo 24, aim x0.8, breath 140, life 200, mind 75%, fear 70 frames", round(stats()),
        [1.7, 1.9, 0.17, 19, 17, 13, 96, 0.216, 18, 0.1, 1.2, 24, 0.8, 140, 200, 0.75, 70]);
    fresh({ all: 60 });
    t.eq("the caps at 60: roll at least 10 breath, at most 24 safe frames, a wound at least a quarter of its chance, the aim at least x0.3 (here x0.45), " +
        "the mind 95% at most, fear 35% of its time", [C.rollCost(), C.rollIFrames(), near(C.woundChance(1), 0.25), near(C.aimSteady(), 0.45), C.mindResist(0), C.mindTime(100)],
        [10, 24, true, true, 0.95, 35]);
    fresh({ attr: { wil: 30 } });
    const r30 = C.mindResist(0), strong = C.mindResist(0, C.hero().level + 8);
    fresh();
    t.check("Hart ducha: 15% to resist at 5, 90% at 30, less against a stronger one (8 levels over: -16%); the source's power takes off its share, never under 5%",
        near(C.mindResist(0), 0.15) && near(r30, 0.9) && near(strong, 0.74) && near(C.mindResist(0.1), 0.05) && C.mindResist(0.5, 30) === 0.05, { r30, strong });
    fresh({ attr: { con: 7 }, level: 2 });
    t.eq("Kondycja 7 at level 2: life 113 (100 + 2 x 5 + 3), breath 104 (tests/combat_test.js)", [C.heroMhp(), C.maxBreath()], [113, 104]);

    // ---- the skills on top of the attributes
    fresh({ skills: { m_crit: 2, keen: 1, d_knock: 2, thickskin: 1, s_carry: 3, d_body: 3, d_roll: 2, d_will: 3, r_aim: 3, r_eagle: 2 } });
    t.eq("skills: Oko rzeźnika 2 crit +6%, Czujne oko parry x1.5, Twarde nogi 2 knock x1.4, Gruba skóra wounds halved, Juczny 3 carry +12, Hart ciała 3 life +36, " +
        "Unik mistrza 2 roll +6 frames, Spokojna głowa 3 mind +24% / fear -30%, Pewna ręka 3 + Sokole oko 2 aim x0.56 (at Zręczność 60 the floor x0.3)",
        [round([C.critChance()])[0], C.parryWindow(), C.knockdownAt(), C.woundChance(0.3), C.carryBonus(), C.heroMhp(), C.rollIFrames(), round([C.mindResist(0)])[0],
            C.mindTime(100), round([C.aimSteady()])[0], (fresh({ all: 60, skills: { r_aim: 3, r_eagle: 2 } }), C.aimSteady())],
        [0.09, 12, 84, 0.15, 12, 136, 19, 0.39, 70, 0.56, 0.3]);

    // ---- the breath: tired, wounded; spending it, winded, back after resetAct
    fresh();
    const b = [C.maxBreath()];
    world.stamina = 0;
    b.push(C.maxBreath());
    world.stamina = 1;
    world.wounded = true;
    b.push(C.maxBreath());
    t.eq("breath: 100 rested, 65 with no strength left, 85 wounded", b, [100, 65, 85]);
    fresh();
    const spent = [C.spendBreath(30), C.breathNow(), C.spendBreath(80), C.breathNow(), C.winded, C.spendBreath(1), C.canRun()];
    C.resetAct();
    t.eq("spending breath: 30 of 100 -> 70; 80 more -> 0 and winded; winded: no blow and no running; resetAct: full again", spent.concat([C.breathNow(), C.winded]),
        [true, 70, true, 0, true, false, false, 100, false]);
    t.eq("breath drained from outside (a drowned one's grip): what is left, at least 0, then winded", [C.drainBreath(40), C.drainBreath(500), C.winded], [60, 0, true]);
    C.resetAct();

    // ---- the blow from hiding, the series
    fresh();
    const s0 = [C.sneakMult(false), C.sneakMult(true)];
    fresh({ attr: { per: 15, dex: 15 }, skills: { h_ambush: 2 } });
    const s1 = [C.sneakMult(false), C.sneakMult(true)];
    t.eq("a blow from hiding x2.5, a shot x2; with Czujność 15, Zręczność 15 and Zasadzka 2: x4.2 and x3.66", round(s0.concat(s1)), [2.5, 2, 4.2, 3.66]);
    fresh();
    const series = [F.maxCombo(F.MELEE[156]), F.maxCombo(F.MELEE[116])];
    fresh({ skills: { combo4: true } });
    t.eq("the series: the club 3 blows, the iron pick 2; Płynne kombo (a stage-1 `true`) one more", series.concat([F.maxCombo(F.MELEE[156]), F.maxCombo(F.MELEE[116])]), [3, 2, 4, 3]);

    // ---- the Postać card (MenuRing.js): an attribute's rows now and with one point more
    fresh();
    const ai = C.attrInfo("str");
    fresh({ attr: { str: 60 } });
    const topRows = C.attrInfo("str").rows;
    t.check("attrInfo: Siła's rows now and with one point more (blows +0% -> +3,5%); at the top (60) no next", ai.value === 5 && ai.rows[0].now === "+0%" &&
        ai.rows[0].next === "+3,5%" && topRows.length === ai.rows.length && topRows.every(r => r.next === "") && C.attr("str") === 60, ai.rows[0]);
});
