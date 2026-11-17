// Balans pięter 1-10 (2026-11-17, z graczem: „rób wszystko”): stwory o 2 poziomy niżej (LEVEL.base 2, piętro 10 <Poziom:7>), rana od
// ciosu stwora o połowę rzadsza na piętrach 1-10 i pełna od 20 (Creatures.woundAt), z raną życie odnawia się w połowie tempa (Survival),
// więcej PD za szczury, nietoperze i pająki (Combat.KILL_XP).
// Uruchom: node tests/run.js balans_podziemia --port 9477
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const xp = await J("({ s: Combat.KILL_XP.szczur, n: Combat.KILL_XP.nietoperz, p: Combat.KILL_XP.pajak, base: CreaturesData.LEVEL.base })");
    t.check("PD: szczur 8, nietoperz 8, pająk 30; poziom pięter od 2 (było 4)", xp.s === 8 && xp.n === 8 && xp.p === 30 && xp.base === 2, xp);

    // a spider on floor 1 and on floor 10 (the stairs' floor with its own <Poziom:7>)
    const spiderOn = async f => {
        const m = await t.eval(`Underground.mapOf(${f})`);
        await t.newGame({ map: m, x: 0, y: 0, hour: 12, quiet: true, minimap: false });
        await t.frames(30);
        return J(`(function(){ const p = $gamePlayer, out = { floor: Underground.floorOf($gameMap.mapId()), lv: [] };
            for (let i = 0; i < 12; i++) { const c = Creatures.spawnOne("pajak", p.x, p.y, { level: 0 }); if (c) { out.lv.push(c._level); out.hp = c._maxHp; c._dead = true; } }
            out.wound = +Creatures.woundAt(0.3).toFixed(3); return out; })()`);
    };
    const f1 = await spiderOn(1), f10 = await spiderOn(10);
    t.check("piętro 1: pająk poziomu 2-3 (było 4-5), rana z ugryzienia 15% (było 30%)", f1.floor === 1 && Math.min(...f1.lv) >= 2 && Math.max(...f1.lv) <= 3 && f1.wound === 0.15, f1);
    t.check("piętro 10: pająk poziomu 7-8 (stały <Poziom:7> piętra strażnika), rana wciąż 15%", f10.floor === 10 && Math.min(...f10.lv) >= 7 && Math.max(...f10.lv) <= 8 && f10.wound === 0.15, f10);
    const deep = await J(`(function(){ const was = Underground.floorOf; const out = {}; for (const f of [15, 20, 40]) { Underground.floorOf = () => f; out[f] = +Creatures.woundAt(0.3).toFixed(3); } Underground.floorOf = was; return out; })()`);
    t.check("głębiej rana rośnie: piętro 15 - 22,5%, od 20 pełne 30%", deep[15] === 0.225 && deep[20] === 0.3 && deep[40] === 0.3, deep);

    // wounded: the slow healing at half the pace (it stopped before)
    await t.newGame({ map: 218, x: 30, y: 20, hour: 9, quiet: true, minimap: false });
    const heal = await J(`(function(){ const a = $gameParty.leader(); const out = {};
        $gameSystem.healWound(); a.setHp(Math.round(a.mhp / 2)); let h0 = a.hp; $gameSystem.advanceDayNight(4); out.plain = a.hp - h0;
        a.setHp(Math.round(a.mhp / 2)); $gameSystem.injure(0); h0 = a.hp; $gameSystem.advanceDayNight(4); out.wounded = a.hp - h0; out.isW = $gameSystem.isWounded();
        $gameSystem.healWound(); return out; })()`);
    t.check("z raną życie odnawia się w połowie tempa (4 godz.: bez rany " + heal.plain + ", z raną " + heal.wounded + ")",
        heal.isW && heal.plain > 0 && heal.wounded > 0 && Math.abs(heal.wounded - heal.plain / 2) <= 2, heal);
});
