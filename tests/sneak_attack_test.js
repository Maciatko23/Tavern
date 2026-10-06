// Blows and shots from hiding (combat stage 2, docs/WALKA.md 11.2; Combat_Fight.js SNEAK, Hunting_Weapons.js shotHit): an animal
// that has not noticed the hero (no "!") takes x2.5 from a blow while he sneaks (C) or comes from behind it, x2 from a shot; an aware
// one, or one he faces openly, the plain damage; the word "Atak z ukrycia!" over it; Czujność, Zręczność and the skill Zasadzka raise
// it; the blow breaks the balance whole - even the bear reels.
// CDP_PORT=9464 node tests/sneak_attack_test.js        (SHOTS=1: a picture into docs/walka/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9464 }, async t => {
    t.check("a new game on the meadow (Map004), noon", await t.newGame({ map: 4, x: 20, y: 14, hour: 12, quiet: true }));
    await t.eval("Hunting.RAID.perHour = 0; $gameSystem.setStamina(100); 0");
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        for (let y = 5; y < $gameMap.height() - 5; y++) for (let x = 6; x < $gameMap.width() - 6; x++) {
            let ok = true;
            for (let dx = -2; dx <= 4 && ok; dx++) for (let dy = -1; dy <= 1; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok) return { x, y };
        }
        return null; })()`);
    t.check("an open strip on the meadow", !!room, room);
    const cx = room.x, cy = room.y;
    await t.give(156, 1);   // the club: 13 a blow, no combo multiplier on the first one
    // no crits in the sums (Math.random held at 0.5 while a blow lands), the animals blind (they never notice him by themselves)
    await t.eval("window.__rand = Math.random; for (const k of ['deer', 'bear', 'boar']) Hunting.SPECIES[k].sight = 0.01; Combat.hero().ready = true; 0");
    // one blow at an animal 1 tile to his right: { dmg, word ("Atak z ukrycia!" over it), sneaks (the blows from hiding counted) }
    const blowAt = async (kind, o = {}) => {
        await t.eval(`(function(){ for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Combat.resetAct(); Combat.act.sneaks = 0;
            $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); Hunting.setSneak(${!!o.sneak});
            const a = window.__a = Hunting.spawn("${kind}", ${cx + 1}, ${cy}); a._frozen = true; a.setDirection(${o.away ? 6 : 4}); a._aware = ${o.aware || 0}; ${o.engaged ? "a._engaged = true;" : ""}
            return 0; })()`);
        await t.frames(4);
        await t.eval("window.__hp0 = __a._hp; Tawerna.api('Combat_parts').fight.floaters.length = 0; Math.random = () => 0.5; Combat.pressAttack(); 0");
        await t.until("__a._hp < __hp0 || __a._dead", 4, 20);
        await t.eval("Math.random = window.__rand; 0");
        await t.frames(4);
        if (o.shot) await t.shot("../docs/walka/" + o.shot);
        return t.json("({ dmg: __hp0 - __a._hp, word: Tawerna.api('Combat_parts').fight.floaters.some(f => f.text === 'Atak z ukrycia!'), sneaks: Combat.act.sneaks || 0, stun: __a._stun, aware: Math.round(__a._aware * 100) / 100 })");
    };

    // ================= 1. the club at a deer =================
    const plain = await blowAt("deer");
    t.check("a deer that has not noticed him, but he walks up openly in front of it: the plain blow (13), no word", plain.dmg === 13 && !plain.word && plain.sneaks === 0, plain);
    const sneak = await blowAt("deer", { sneak: true, shot: SHOTS ? "atak_z_ukrycia.png" : "" });
    t.check("the same while he sneaks (C): x2.5 = 33, 'Atak z ukrycia!' over it", sneak.dmg === 33 && sneak.word && sneak.sneaks === 1, sneak);
    const behind = await blowAt("deer", { away: true });
    t.check("not sneaking, but from behind it (it faces away): from hiding too, 33", behind.dmg === 33 && behind.word, behind);
    const aware = await blowAt("deer", { sneak: true, aware: 1 });
    t.check("it has noticed him (the '!'): sneaking does not help - the plain 13", aware.dmg === 13 && !aware.word, aware);
    const fighting = await blowAt("deer", { away: true, engaged: true });
    t.check("one already fighting him: from behind or not, the plain 13", fighting.dmg === 13 && !fighting.word, fighting);

    // ================= 2. a shot from hiding: x2 =================
    await t.give(125, 1); await t.give(64, 10);
    const shotAt = async sneakOn => {
        await t.eval(`(function(){ for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Combat.resetAct(); Hunting.resetCooldown(); Hunting.animate(false);
            $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); Hunting.setSneak(${sneakOn}); Tawerna.api('Combat_parts').fight.floaters.length = 0;
            const a = window.__a = Hunting.spawn("deer", ${cx + 3}, ${cy}); a._frozen = true; a.setDirection(4); a._aware = 0; return 0; })()`);
        await t.frames(4);
        await t.eval("window.__hp0 = __a._hp; Math.random = () => 0.5; Hunting.shoot([1, 0], 'sling'); 0");
        await t.until("__a._hp < __hp0 || __a._dead || Hunting.projectiles.length === 0", 4, 20);
        await t.eval("Math.random = window.__rand; 0");
        return t.json("({ dmg: __hp0 - __a._hp, word: Tawerna.api('Combat_parts').fight.floaters.some(f => f.text === 'Atak z ukrycia!') })");
    };
    const s0 = await shotAt(false), s1 = await shotAt(true);
    t.check("a stone from the sling at an unaware deer: openly 14, sneaking x2 = 28 (with the word)", s0.dmg === 14 && !s0.word && s1.dmg === 28 && s1.word, { s0, s1 });

    // ================= 3. what raises it: Czujność, Zręczność (shots), the skill Zasadzka =================
    const mult = await t.json(`(function(){ const h = Combat.hero(), keep = Object.assign({}, h.attr), out = {};
        out.base = [Combat.sneakMult(false), Combat.sneakMult(true)];
        h.attr.per = 15; out.per = [Combat.sneakMult(false), Combat.sneakMult(true)]; h.attr.per = keep.per;
        h.attr.dex = 15; out.dex = [Combat.sneakMult(false), Combat.sneakMult(true)]; h.attr.dex = keep.dex;
        h.skills.h_ambush = 1; h.rev = (h.rev || 0) + 1; out.skill = [Combat.sneakMult(false), Combat.sneakMult(true)];
        const sk = Combat.SKILLS.find(s => s.id === "h_ambush"); out.where = sk ? [sk.tree, sk.row, sk.col, sk.name, Combat.skillText(sk, 1)] : null;
        delete h.skills.h_ambush; h.rev++; return out; })()`);
    const near = (a, b) => Math.abs(a - b) < 1e-9;
    t.check("x2.5 / x2 at the start; Czujność 15: +12% to both; Zręczność 15: +10% to the shot only; Zasadzka (Łowiectwo, rank 1): +25%",
        near(mult.base[0], 2.5) && near(mult.base[1], 2) && near(mult.per[0], 2.8) && near(mult.per[1], 2.24) && near(mult.dex[0], 2.5) && near(mult.dex[1], 2.2) &&
        near(mult.skill[0], 3.125) && near(mult.skill[1], 2.5) && mult.where && mult.where[0] === "hunting" && mult.where[3] === "Zasadzka" && /25%/.test(mult.where[4]), mult);

    // ================= 4. the balance broken whole: even the bear reels =================
    const plainBear = await blowAt("bear");
    t.check("the bear, met openly: a club blow hardly moves its balance, no reel", plainBear.dmg === 13 && plainBear.stun === 0, plainBear);
    const bear = await blowAt("bear", { sneak: true });
    t.check("the bear struck from hiding: 33 and it reels (the opening the hunter made for himself)", bear.dmg === 33 && bear.stun > 0 && bear.word, bear);
    await t.eval("Hunting.setSneak(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
});
