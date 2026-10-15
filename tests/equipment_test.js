// Equipment.js (the user's, 2026-10-08): the hero's parts - only what is worn works. An old save's things go on by themselves; the
// jacket (Combat_Fight ARMORS, Durability) and the shield (the block) only worn; the right hand = the weapon of the combat mode ([ ]);
// the burning torch in the left hand (the shield waits, comes back); the cloak (cold), the boots (speed), the backpack (load) only
// worn; taken off by hand stays off, a thing that leaves the bag leaves its part; the state in the save; Combat.attrInfo's numbers.
// CDP_PORT=9486.
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9486, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", plugins: ["CleanHUD", "CleanHUD_Compass", "MenuRing"] }, async t => {
    t.check("zapis wczytany (dzień 40)", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){ if (window.Hunting) Hunting.auto(false); if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); } if (window.Birds && Birds.auto) Birds.auto(false);
        if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem.setDayNightHour(11); return 0; })()`);
    t.check("Equipment.js wczytany", await t.until("!!window.Equipment && !!Tawerna.api('Equipment')", 10));
    // an old save: no state of the equipment, the things owned -> on by themselves
    await t.eval(`(function(){ delete $gameSystem._tw.equip; for (const id of [171, 155, 112, 113, 114, 156]) if (!$gameParty.numItems($dataItems[id])) $gameParty.gainItem($dataItems[id], 1);
        $gameParty.gainItem($dataItems[59], 2); if (Torch.isLit()) Torch.douse(""); return 0; })()`);
    const slot = () => t.json("(function(){ const o = {}; for (const s of Equipment.slots()) o[s.id] = s.item; return o; })()");
    let s = await slot();
    t.check("stary zapis: posiadane rzeczy zakładają się same (kurtka, tarcza, płaszcz, buty, plecak)", s.torso === 171 && s.left === 155 && s.cloak === 112 && s.feet === 113 && s.back === 114, s);
    t.check("części bez rzeczy w grze są puste (głowa, rękawice, pas, nogi, dodatek)", !s.head && !s.hands && !s.belt && !s.legs && !s.extra);
    t.check("Combat: kurtka i tarcza działają (założone)", await t.eval("!!Combat.armor() && Combat.armor().id === 171 && !!Combat.shield() && Combat.shield().id === 155"));

    // ---- the jacket: off -> the blow is not lessened and does not wear it; on -> a fifth off and the wear
    const blow = () => t.json(`(function(){ const a = $gameParty.leader(); a.recoverAll(); Combat.resetAct(); Combat.act.mode = "idle";
        const w0 = Durability.left(171); const r = Combat.hitPlayer({ damage: 50, poise: 0, from: { x: $gamePlayer._realX + 0.5, y: $gamePlayer._realY + 2 }, knock: 0 });
        return { lost: a.mhp - a.hp, worn: w0 - Durability.left(171) }; })()`);
    const on = await blow();
    t.check("Equipment.unequip('torso') zdejmuje kurtkę", await t.eval("Equipment.unequip('torso') && !Equipment.worn(171) && !Combat.armor()"));
    const off = await blow();
    t.check("bez kurtki cios jest mocniejszy, a kurtka się nie zużywa", off.lost > on.lost && on.worn === 1 && off.worn === 0, { on, off });
    t.check("zdjęta zostaje zdjęta (nie zakłada się sama)", !(await t.eval("Equipment.worn(171)")) && (await slot()).torso === 0);
    t.check("założona znowu działa", await t.eval("Equipment.equip('torso', 171) && Equipment.worn(171) && Combat.armor().id === 171"));

    // ---- the shield: only in the left hand
    t.check("tarcza zdjęta: brak bloku tarczą", await t.eval("Equipment.unequip('left') && !Combat.shield()"));
    t.check("tarcza z powrotem w lewej ręce", await t.eval("Equipment.equip('left', 155) && Combat.shield().id === 155"));

    // ---- the right hand = the weapon of the combat mode
    t.check("prawa ręka: pałka (Combat.hand = m156)", await t.eval("Equipment.equip('right', 156) && Combat.hand() === 'm156' && Equipment.current('right') === 156"));
    await t.eval("Combat.switchHand(1); 0");
    t.check("[ ] w trybie walki zmienia też prawą rękę na karcie", await t.eval("Equipment.current('right') !== 156 && ('m' + Equipment.current('right') === Combat.hand() || (Combat.hand() === 'ranged') || (Combat.hand() === 'm0' && Equipment.current('right') === 0))"),
        await t.eval("Combat.hand()"));
    t.check("zdjęcie broni z prawej ręki = pięści", await t.eval("Equipment.unequip('right') && Combat.hand() === 'm0' && Equipment.current('right') === 0"));

    // ---- the torch: lit from the card it goes into the left hand, the shield waits; as the weapon it is in the right hand
    const torches = await t.count(59);
    t.check("pochodnia z karty: zapala się (jedna mniej w plecaku) i jest w lewej ręce", await t.eval("Equipment.equip('left', 59) && Torch.isLit() && Equipment.current('left') === 59") && (await t.count(59)) === torches - 1);
    t.check("z pochodnią w lewej ręce tarcza nie blokuje", await t.eval("!Combat.shield() && !Equipment.worn(155)"));
    t.check("pochodnia jako broń (m59): w prawej ręce, a tarcza wraca do lewej", await t.eval("Combat.setHand('m59') && Equipment.current('right') === 59 && Equipment.current('left') === 155 && Combat.shield().id === 155"));
    await t.eval("Combat.setHand('m0'); 0");
    t.check("zdjęcie pochodni: wbita w ziemię albo zgaszona, tarcza wraca", await t.eval("Equipment.unequip('left') && !Torch.isLit() && Equipment.current('left') === 155 && Combat.shield().id === 155"));
    await t.eval("Equipment.equip('left', 59); 0");
    t.check("tarcza wybrana przy płonącej pochodni: pochodnia odchodzi (w ziemię / gaśnie), tarcza w ręce", await t.eval("Equipment.equip('left', 155) && !Torch.isLit() && Combat.shield().id === 155"));

    // ---- the cloak, the boots, the backpack
    const cold = await t.json(`(function(){ $gameSystem._dayNightDay = 86; const out = {}; out.on = $gameSystem.isCold(); Equipment.unequip('cloak'); out.off = $gameSystem.isCold(); Equipment.equip('cloak', 112);
        out.back = $gameSystem.isCold(); $gameSystem._dayNightDay = 40; return out; })()`);
    t.check("płaszcz: zimą na dworze bez płaszcza marzniesz, w płaszczu nie", cold.on === false && cold.off === true && cold.back === false, cold);
    const speed = await t.json(`(function(){ const a = $gamePlayer.distancePerFrame(); Equipment.unequip('feet'); const b = $gamePlayer.distancePerFrame(); Equipment.equip('feet', 113); return { on: a, off: b }; })()`);
    t.check("buty: założone - szybszy chód", speed.on > speed.off, speed);
    const cap = await t.json(`(function(){ const a = Survival.weightCap(); Equipment.unequip('back'); const b = Survival.weightCap(); Equipment.equip('back', 114); return { on: a, off: b }; })()`);
    t.check("plecak: założony - większy udźwig (+80)", cap.on - cap.off === 80, cap);

    // ---- a thing that leaves the bag leaves its part; back - on again
    t.check("kurtka znika z plecaka (podarta): część pusta", await t.eval("$gameParty.loseItem($dataItems[171], 9, true); !Equipment.worn(171) && Equipment.current('torso') === 0 && !Combat.armor()"));
    t.check("nowa kurtka zakłada się sama", await t.eval("$gameParty.gainItem($dataItems[171], 1); Equipment.worn(171) && Combat.armor().id === 171"));

    // ---- the state in the save
    await t.eval("Equipment.unequip('cloak'); Equipment.unequip('feet'); 0");
    t.check("zapis do pliku 3", await t.saveTo(3));
    await t.eval("Equipment.equip('cloak', 112); Equipment.equip('feet', 113); 0");
    t.check("wczytanie pliku 3", await t.loadFrom(3, {}));
    await t.until("!!window.Equipment", 5);
    s = await slot();
    t.check("po wczytaniu: zdjęte zostały zdjęte (płaszcz, buty), reszta założona", s.cloak === 0 && s.feet === 0 && s.torso === 171 && s.left === 155 && s.back === 114, s);

    // ---- what the attributes do (the card's bubble)
    const info = await t.json("Combat.attrInfo('str')");
    t.check("Combat.attrInfo: Siła - obrażenia, równowaga, udźwig, mniej uderzeń; teraz i +1", info && info.rows.length === 4 && info.rows.every(r => r.now && r.next && r.now !== r.next) && /Obrażenia/.test(info.rows[0].label), info);
    const con = await t.json("Combat.attrInfo('con')"), hp = await t.eval("$gameParty.leader().mhp");
    t.check("Kondycja: życie teraz = mhp bohatera, +1 pkt = +5", con && Number(con.rows[0].now) === hp && Number(con.rows[0].next) === hp + 5, { con: con && con.rows[0], hp });
    t.check("attrInfo nie zmienia atrybutów", await t.eval("Combat.attr('str') === Combat.hero().attr.str && Combat.attr('con') === Combat.hero().attr.con"));
});
