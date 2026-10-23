// The foes' data without the game (Humans_Data.js + Humans.js, Creatures_Data.js + Creatures.js, Combat.js's KILL_XP): the four kinds of
// men and the eight creatures with sane numbers (life, balance, attributes and their growth, blows and their timings, loot of real items),
// their XP as Combat gives it, the night camps / raids / ambushes on real maps (never the town or grandpa's field), the raid's chance by
// the day, a fire, a camp and the map's note; a man's and a creature's life and balance at a level (the growth rates, a boss's slower),
// the creatures' depths (FIT: every floor 1-99 once, each band's kinds living there), the kind a marker of a generated floor gets, the
// bosses of floors 10-90 and the shadow's faces.
// Mirrors tests/humans_test.js (four kinds, the mercenary strongest, mercy, XP 30 / 30 / 60, the raid rare at first, more later, more by
// a fire, none in the town) and tests/creatures_test.js (eight kinds in order, XP 4 ... 2500).
const unit = require("../lib/unit.js");

const FILES = ["TawernaCore", "Hunting", "Hunting_Path", "Hunting_AI", "Hunting_Weapons", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI",
    "Humans_Data", "Humans", "Underground_Data", "Underground", "Creatures_Data", "Creatures"];
const ATTRS = ["str", "dex", "con", "per", "wil"];
const hourOk = h => Number.isInteger(h) && h >= 0 && h <= 23;
const pairOk = p => Array.isArray(p) && p[0] <= p[1] && p[0] >= 0;

unit.test(t => {
    const $dataItems = unit.data("Items"), infos = unit.data("MapInfos");
    function Game_System() {}
    let sys = new Game_System(), mapId = 21, note = "";
    const globals = { Game_System, $dataItems, $gameParty: { leader: () => null, numItems: () => 0 } };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    Object.defineProperty(globals, "$gameMap", { get: () => ({ mapId: () => mapId }), enumerable: true, configurable: true });
    Object.defineProperty(globals, "$dataMap", { get: () => ({ note }), enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const HD = w.HumansData, CD = w.CreaturesData, H = w.Humans, CR = w.Creatures, C = w.Combat;
    const real = id => !!($dataItems[id] && $dataItems[id].name);
    const lootOk = list => (list || []).every(([id, c, n]) => real(id) && c > 0 && c <= 1 && n >= 1);
    const attrOk = a => ATTRS.every(k => a.base[k] >= 1 && a.grow[k] >= 0) && Object.keys(a.base).length === 5;
    const moveOk = m => !(m.dmg < 0) && (m.windup === undefined ? m.dmg === undefined : m.windup > 0) && (m.hitAt === undefined || m.strike === undefined || m.hitAt < m.strike) && !(m.recover < 0) &&
        (m.cone === undefined || (m.cone > 0 && m.cone <= 1)) && !(m.wound < 0 || m.wound > 1) && !(m.knock < 0 || m.knock > 1.5);

    // ---- the men
    const K = HD.KINDS, men = Object.keys(K);
    t.check("four kinds of men: the bandit, the knife bandit, the archer, the mercenary (the strongest: most life and balance; the bandit more life than the archer); " +
        "their blows never kill (mercy) - the same table in Humans.KINDS", men.join() === "bandit,knifer,archer,mercenary" && K.mercenary.hp > K.bandit.hp && K.bandit.hp > K.archer.hp &&
        men.every(k => K.mercenary.poise >= K[k].poise && K[k].mercy) && H.KINDS === K && new Set(men.map(k => K[k].look)).size === 4);
    const manBad = men.filter(k => {
        const m = K[k], blows = ["blow", "bash", "heavy"].filter(b => m[b]).map(b => m[b]);
        return !(m.hp > 0 && m.poise > 0 && m.stun > 0 && m.radius > 0 && m.radius < 1 && m.speed < m.chase && m.sight > 0 && m.turn > 0) || !attrOk(m.attr) ||
            !blows.length || !blows.every(b => moveOk(b) && b.dmg > 0 && b.reach > 0) || !pairOk(m.gold) || !lootOk(m.loot) || (m.weapon && !(real(m.weapon[0]) && m.weapon[1] > 0)) ||
            !(m.surrender.at > 0 && m.surrender.at <= 0.5 && m.surrender.chance >= 0 && m.surrender.chance <= 1 && m.surrender.flee >= 0 && m.surrender.flee <= 1) ||
            (m.shot && !(m.shot.keepMin < m.shot.keepMax && m.shot.keepMax < m.shot.range && pairOk(m.shot.arrows) && m.shot.lockAt < m.shot.draw));
    });
    t.check("each man's numbers: life, balance, reel, body, walk slower than the chase, sight, turn; five attributes and their growth; his blows (a wind-up, the hit before " +
        "the end of the strike); gold, loot of real items, the weapon to take; begging under half of his life; the archer keeps his distance inside his range",
        manBad.length === 0, manBad);
    const xpHumans = men.map(k => [K[k].xp, C.KILL_XP[k]]), xpCreatures = Object.keys(CD.KINDS).map(k => [CD.KINDS[k].xp, C.KILL_XP[k]]).concat(Object.keys(CD.BOSSES).map(k => [CD.BOSSES[k].xp, C.KILL_XP[k]]));
    t.check("their XP is Combat's: bandit 30, knife 30, archer 30, mercenary 60; rat 4 ... stone sentinel 70, guardian 250, floor 20's boss 300 ... floor 90's 2500",
        xpHumans.concat(xpCreatures).every(([a, b]) => a === b) && men.map(k => C.KILL_XP[k]).join() === "30,30,30,60" &&
        ["szczur", "nietoperz", "pajak", "topielec", "zbroja", "upior", "cien", "kamiennik", "guardian", "boss_20", "boss_90"].map(k => C.KILL_XP[k]).join() === "4,4,25,35,45,50,50,70,250,300,2500",
        xpHumans.concat(xpCreatures).filter(([a, b]) => a !== b));
    const campMaps = Object.keys(HD.CAMP.maps).map(Number), missing = campMaps.filter(id => !infos[id]);
    t.check("the night camps, the raids, the ambush: on maps of the game (the removed Map005 / Map006 aside), never the town (8) or grandpa's field (3); chances in (0, 1], " +
        "hours of the day, sizes, a sack of real loot; the raid calm at first, full by its day, more by a fire and a camp",
        missing.every(id => id === 5 || id === 6) && campMaps.every(id => id !== 8 && id !== 3 && HD.CAMP.maps[id] > 0 && HD.CAMP.maps[id] <= 1) &&
        [HD.CAMP.from, HD.CAMP.to, HD.RAID.from, HD.RAID.to].every(hourOk) && HD.AMBUSH.hours.every(hourOk) &&
        [HD.CAMP.size, HD.CAMP.awake, HD.RAID.size, HD.AMBUSH.size, HD.BAND.gap].every(pairOk) && lootOk(HD.CAMP.sack.loot) && pairOk(HD.CAMP.sack.gold) &&
        HD.RAID.calm < 1 && HD.RAID.calmDays < HD.RAID.fullDay && HD.RAID.fire > 1 && HD.RAID.camp > 1 && ["gold", "food", "hp"].every(k => HD.ROBBED[k] > 0 && HD.ROBBED[k] < 1),
        { missing });

    // ---- the raid's chance (Humans.raidChance): Leśna droga (21) is a camp map
    const pct = v => Math.round(v * 10000) / 100;
    const raid = [pct(H.raidChance(1)), pct(H.raidChance(10)), pct(H.raidChance(15)), pct(H.raidChance(40)), pct(H.raidChance(40, true))];
    sys._tw.humans.camps[21] = { x: 1, y: 1 };
    raid.push(pct(H.raidChance(40)));
    sys = new Game_System();
    mapId = 8;
    raid.push(pct(H.raidChance(40)));
    note = "<Raid:0.1>";
    raid.push(pct(H.raidChance(40)));
    mapId = 21;
    note = "<Raid:off>";
    raid.push(pct(H.raidChance(40)));
    note = "<Humans:off>";
    raid.push(pct(H.raidRate()), pct(H.campChance()));
    note = "";
    t.eq("a raid on a sleeper, % an hour on the forest road: 0.4 the first days, 1.2 on day 10, 2 from day 15, 2.8 by a fire, 5 with a camp on the map; " +
        "none in the town - unless its note says <Raid:0.1> (10); <Raid:off> and <Humans:off> none", raid, [0.4, 1.2, 2, 2, 2.8, 5, 0, 10, 0, 0, 0]);

    // ---- a man at a level (Humans.Game_Human)
    const merc = new H.Game_Human("mercenary", 5, 5, { level: 4, gold: 0, loot: [] }), band = new H.Game_Human("bandit", 5, 5, { level: 1, gold: 0, loot: [] }),
        archer = new H.Game_Human("archer", 5, 5, { level: 2 });
    t.eq("a man at a level: the mercenary at 4 - attributes base + growth x 3 (12, 7, 12, 8, 9), life 130 x 1.36 + 4 x 7 = 205, balance 80 x 1.24 + 2 x 7 = 113; " +
        "the bandit at 1 his base (60, 34), no arrows; the archer carries 8-14 arrows and 3-13 coins", [merc._attr, merc._maxHp, merc._maxPoise, band._maxHp, band._maxPoise, band._arrows, merc._level, archer._arrows >= 8 && archer._arrows <= 14, archer._gold >= 3 && archer._gold <= 13],
        [{ str: 12, dex: 7, con: 12, per: 8, wil: 9 }, 205, 113, 60, 34, 0, 4, true, true]);

    // ---- the creatures
    const CK = CD.KINDS, kinds = Object.keys(CK);
    const crBad = kinds.filter(k => {
        const c = CK[k], f = c.floors;
        return !((f.length === 2 || f.length === 4) && f.every((v, i) => v >= 1 && v <= 99 && (!i || v > f[i - 1]))) || !(c.hp > 0 && c.poise > 0 && c.stun > 0 && c.radius > 0 &&
            c.speed < c.chase && c.sight > 0 && c.turn > 0) || !attrOk(c.attr) || !Object.values(c.moves).every(moveOk) || !lootOk(c.loot) || !(c.gold.length === 3 && pairOk(c.gold) &&
            c.gold[2] >= 0 && c.gold[2] <= 1) || !c.remains || (c.swarm && !(pairOk(c.swarm) && c.swarm[0] >= 2)) || CR.KINDS[k] !== c;
    });
    t.check("eight creatures in order (rats, spiders, empty armours, bats, the drowned, stone sentinels, wraiths, shadows): depths within floors 1-99, life, balance, " +
        "walk slower than the chase, five attributes, their blows' timings (a shadow's fright has none), loot of real items, remains; swarms only of rats and bats",
        kinds.join() === "szczur,pajak,zbroja,nietoperz,topielec,kamiennik,upior,cien" && crBad.length === 0 && kinds.filter(k => CK[k].swarm).join() === "szczur,nietoperz", crBad);
    const fit = CD.FIT, lives = (k, a, b) => { const f = CK[k].floors; return (a >= f[0] && b <= f[1]) || (f.length === 4 && a >= f[2] && b <= f[3]); };
    t.check("FIT: the bands cover floors 1-99 once, in order (1-10, 11-30, 31-50, 51-75, 76-99); each band's kinds live at that depth",
        fit[0][0] === 1 && fit[fit.length - 1][1] === 99 && fit.every(([a, b], i) => a <= b && (!i || a === fit[i - 1][1] + 1)) && fit.every(([a, b, list]) => list.every(k => CK[k] && lives(k, a, b))),
        fit.map(([a, b, list]) => a + "-" + b + ": " + list.filter(k => !(CK[k] && lives(k, a, b))).join()));
    const kf = [CR.kindFor("boss_30", 5), CR.kindFor("kamiennik", 5, true), CR.kindFor("szczur", 20, false), CR.kindFor("zbroja", 60, false), CR.kindFor("zbroja", 40, false, { x: 2, y: 1 }),
        CR.kindFor("upior", 5, false, { x: 1, y: 1 }), CR.kindFor("szczur", 60, false, { x: 3, y: 4 }), CR.kindFor("cien", 0, false)];
    t.eq("the kind of a generated floor's marker: a boss stays, a hand-made floor's marker stays, a kind at its depth stays (the armour's second range 51-75 too); " +
        "out of its depth the band's kind, the same every visit for one marker; floor 0 as it is", kf,
        ["boss_30", "kamiennik", "szczur", "zbroja", "nietoperz", "pajak", "kamiennik", "cien"]);

    // ---- the bosses
    const B = CD.BOSSES, bosses = Object.keys(B);
    const bossBad = bosses.filter(k => { const b = B[k]; return !CK[b.base] || !(b.hp > 0 && b.poise > 0 && b.dmg > 0 && b.scale >= 1) || !pairOk(b.gold) || !lootOk(b.loot) || !b.note || CR.BOSSES[k] !== b; });
    t.check("the bosses: the guardian of floor 10 and floors 20-90 (one each, the Underground's own list of them the same), each a known kind made big with its life, balance, " +
        "blows, sure loot of real items and gold", bosses.join() === "guardian,boss_20,boss_30,boss_40,boss_50,boss_60,boss_70,boss_80,boss_90" && bossBad.length === 0 &&
        bosses.map(k => B[k].floor).join() === "10,20,30,40,50,60,70,80,90" && bosses.slice(1).every(k => w.Underground_Data.BOSSES[B[k].floor] &&
        w.Underground_Data.BOSSES[B[k].floor].name === B[k].name) && B.boss_90.split > 0 && B.boss_90.split < 1 && B.boss_90.parts >= 2, bossBad);

    // ---- a creature at a level (Creatures.Game_Creature): a common one's life grows 10% a level, a boss's 4%
    const armour = new CR.Game_Creature("zbroja", 5, 5, { level: 10 }), queen = new CR.Game_Creature("boss_30", 5, 5, { level: 20 }), rat = new CR.Game_Creature("szczur", 5, 5, { level: 1 });
    t.eq("a creature at a level: the empty armour at 10 - Kondycja 12 + 1.2 x 9 = 23, life 120 x 1.9 + 4 x 18 = 300, balance 90 x 1.72 + 36 = 191, blows x1.45 x Siła; " +
        "the rat queen at 20 - life 600 x 1.76 + 20 = 1076 (a boss: 4% a level), balance 413; a rat at 1 its base life (14 - 8 for its frailty)",
        [armour._attr.con, armour._maxHp, armour._maxPoise, Math.round(armour.strK() * 1000) / 1000, queen._maxHp, queen._maxPoise, queen._boss === B.boss_30, rat._maxHp],
        [23, 300, 191, Math.round((1 + CD.GROW.str * (armour._attr.str - 5)) * (1 + CD.GROW.dmg * 9) * 1000) / 1000, 1076, 413, true, 6]);
    t.check("the shadow's faces (residents' 8-way sheets, their lines), the wraith's questions and truths, the mind's words", CD.FACES.length >= 5 &&
        CD.FACES.every(f => /^Npc_[A-Za-z]+_Walk8$/.test(f.sheet) && f.name && f.lines.length >= 1) && CD.QUESTIONS.length >= 5 && CD.TRUTHS.length >= 5 &&
        ["fear", "confuse", "resist", "grabbed", "free"].every(k => CD.MIND[k]) && CD.LEVEL.base >= 1 && CD.LEVEL.perFloors >= 1 && CD.RESPAWN_DAYS >= 1);
});
