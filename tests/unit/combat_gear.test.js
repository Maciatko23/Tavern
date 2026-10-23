// The weapons and the armour in the fight without the game (Combat_Fight.js reading the items' notes with the numbers of Bron_Data.js;
// the parts worn: a fake Equipment): a weapon above the hero's level (weaker and dearer in breath, the lack stops at 45%), the gauntlets
// on the fists; the armour's pieces summed, capped at ZBROJA_MAX, their burden (breath, noise, walk) and a piece above the hero's level;
// the heavy gear's breath; the shields (none, the buckler's parry, a shield above the level); the old weapons' numbers and the order of
// [ ] after the notes are read; the Postać card's blows of a weapon.
// Mirrors tests/bron_dane_test.js (the steel sword at level 6: 30% weaker, the armour 28% / 48% / the cap 58%, the heavy armour's breath
// -10% and noise -0,31, the walk +2%, the buckler x1,5, the old weapons' numbers and order).
const unit = require("../lib/unit.js");

const FILES = ["TawernaCore", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI", "Bron_Data"];
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

unit.test(t => {
    function Game_System() {}
    let sys = null;
    const worn = {};   // what is on each part (Equipment.current)
    const globals = { Game_System, Equipment: { current: part => worn[part] || 0 }, $gameParty: { leader: () => null, numItems: () => 0 }, $dataItems: unit.data("Items") };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const C = w.Combat, F = w.Tawerna.api("Combat_parts").fight;
    // a fresh hero of a level (every attribute 5, rested) with these parts worn
    const fresh = (level, parts) => {
        sys = new Game_System();
        sys.staminaRatio = () => 1;
        C.hero().level = level;
        for (const k of Object.keys(worn)) delete worn[k];
        Object.assign(worn, parts || {});
        F.gearChanged();
        C.resetAct();
    };

    // ---- a weapon above the hero's level (Bron_Data.brak: 3% a level, at most 45%)
    fresh(6);
    const low = C.weaponNow(308);
    fresh(30);
    const full = C.weaponNow(308);
    t.check("the steel sword (level 16) at hero level 6: 30% weaker (31 -> 22, balance 26 -> 18), 30% dearer in breath (10 -> 13); at 30 the weapon itself",
        low.dmg === 22 && low.poise === 18 && low.cost === 13 && near(low.lack, 0.3) && full === F.MELEE[308] && full.dmg === 31 && !full.lack, { low: [low.dmg, low.poise, low.cost] });
    fresh(1);
    const zak = C.weaponNow(329), club = C.weaponNow(156);
    t.check("25 levels over the hero: the lack stops at 45% (the order's hammer 49 -> 27); an old level-1 weapon never lacks",
        near(zak.lack, 0.45) && zak.dmg === Math.round(F.MELEE[329].dmg * 0.55) && club === F.MELEE[156], { zak: zak.dmg });
    fresh(12, { hands: 397 });
    const fist12 = C.weaponNow(0);
    fresh(6, { hands: 397 });
    const fist6 = C.weaponNow(0);
    t.eq("the Iron Fist gauntlets (level 12) on the fists: 5 + 8 damage, 12 + 14 balance; at level 6 their part 18% weaker", [fist12.dmg, fist12.poise, fist6.dmg, fist6.poise], [13, 26, 12, 23]);

    // ---- the armour
    fresh(30, { torso: 353 });
    const one = C.armor().reduce;
    Object.assign(worn, { head: 346, hands: 362, legs: 368, feet: 372 });
    const iron = C.armor();
    Object.assign(worn, { head: 348, torso: 359, hands: 365, legs: 370, feet: 374 });
    const order = C.armor().reduce;
    t.check("armour: the mail alone 28%; the whole iron set 48% (5 pieces, the torso's piece named); the whole order's set 59% counts as 58% (ZBROJA_MAX)",
        near(one, 0.28) && near(iron.reduce, 0.48) && iron.pieces.length === 5 && iron.id === 353 && near(order, 0.58) && w.Bron_Data.ZBROJA_MAX === 0.58, { one, iron: iron.reduce, order });
    fresh(30, { head: 346, torso: 354, hands: 362, legs: 368, feet: 372 });
    const kara = C.armor().kara, heavy = [C.maxBreath()];
    worn.left = 379;
    F.gearChanged();
    heavy.push(C.maxBreath());
    t.check("the iron scale set's burden summed: breath -10% (100 -> 90; with the iron shield -15%: 85), noise +31%, the walk +2% (boots +6%, scale -3%, greaves -1%)",
        near(kara.oddech, 0.1) && near(kara.skradanie, 0.31) && near(kara.chod, 0.02) && heavy.join() === "90,85", { kara, heavy });
    fresh(1, { torso: 353 });
    const lacking = C.armor();
    t.check("the mail (level 11) at hero level 1: its part 30% weaker (28% -> 19.6%)", near(lacking.reduce, 0.196) && near(lacking.pieces[0].lack, 0.3), lacking.pieces);
    fresh(30);
    t.check("no armour worn: armor() is null, the breath not cut", C.armor() === null && C.maxBreath() === 100);

    // ---- the shields
    fresh(30);
    const p0 = C.parryWindow(), none = C.shield();
    worn.left = 377;
    const p1 = C.parryWindow(), buckler = C.shield();
    fresh(1, { left: 377 });
    const p2 = C.parryWindow();
    worn.left = 378;
    const kite = C.shield();
    t.check("the shield: none - null; the buckler parries x1.5 (8 -> 12 frames), at hero level 1 less (11); the kite shield (level 12) at level 1 blocks 82% x 0.67",
        none === null && p0 === 8 && p1 === 12 && buckler.id === 377 && near(buckler.reduce, 0.68) && p2 === 11 && near(kite.reduce, 0.82 * 0.67) && near(kite.lack, 0.33) &&
        near(kite.cover, 0.25), { p0, p1, p2, kite: kite.reduce });

    // ---- the old weapons keep their numbers when the gear is read from the notes; the order of [ ]
    C.refreshGear(true);
    const OLD = { 156: [13, 26, 1.45, 10], 115: [26, 30, 1.6, 16], 60: [17, 24, 1.55, 16], 154: [20, 16, 2.25, 12], 116: [30, 42, 1.45, 22], 63: [22, 36, 1.45, 22] };
    const old = Object.keys(OLD).filter(id => { const m = F.MELEE[id]; return !m || JSON.stringify([m.dmg, m.poise, m.reach, m.cost]) !== JSON.stringify(OLD[id]); });
    const fresh7 = F.MELEE_ORDER.slice(0, -7), tail = F.MELEE_ORDER.slice(-7);
    const ranked = fresh7.every((id, i) => !i || F.MELEE[fresh7[i - 1]].poziom > F.MELEE[id].poziom ||
        (F.MELEE[fresh7[i - 1]].poziom === F.MELEE[id].poziom && F.MELEE[fresh7[i - 1]].dmg >= F.MELEE[id].dmg));
    const melee = w.Bron_Data.PRZEDMIOTY.filter(p => p.typ === "bron" && !p.istnieje && !w.Bron_Data.staty(p).dystans).map(p => p.id);
    t.check("the gear read from the notes: every new melee weapon (" + melee.length + ") in MELEE with its series, the old weapons keep their numbers, " +
        "the old order stays last (115, 154, 60, 116, 63, 156, 59), the new ones before it by level, then blow",
        melee.every(id => F.MELEE[id] && F.MELEE[id].combo.length >= 2 && fresh7.includes(id)) && old.length === 0 && JSON.stringify(tail) === "[115,154,60,116,63,156,59]" && ranked,
        { old, tail, first: F.MELEE[F.MELEE_ORDER[0]].name });
    t.check("the shields and the armour from the notes: every new one in SHIELDS / ARMORS with its block or its part; the wooden shield and the jacket as before",
        w.Bron_Data.PRZEDMIOTY.filter(p => p.typ === "tarcza").every(p => F.SHIELDS[p.id] && F.SHIELDS[p.id].reduce === p.blok) &&
        w.Bron_Data.PRZEDMIOTY.filter(p => p.typ === "zbroja").every(p => F.ARMORS[p.id] && F.ARMORS[p.id].reduce === p.obrona) &&
        F.SHIELDS[155].reduce === 0.75 && F.SHIELDS[155].breath === 0.7 && F.ARMORS[171].reduce === 0.2);

    // ---- the Postać card's blows (MenuRing.js)
    fresh(10);
    const mi = C.meleeInfo(305);
    t.eq("the card's iron sword at Siła 5: 27 a blow, the series 27 / 30 / 39, charged 59-73, critical 43, balance 24 / 36 / 60, 11 breath",
        [mi.hit, mi.series, mi.heavy, mi.heavyFull, mi.crit, mi.poise, mi.poiseLast, mi.poiseHeavy, mi.breath], [27, [27, 30, 39], 59, 73, 43, 24, 36, 60, 11]);
});
