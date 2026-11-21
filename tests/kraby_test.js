// Małe kraby na plaży Słonego Brzegu (js/plugins/Kraby.js, 2026-11-19): za dnia 3-6 przy wodzie, w nocy żadnego; każdy krab (mały,
// olbrzym, kolos) innej wielkości i odcienia; od przodu pancerz zabiera: mały 10%, olbrzym 30%, kolos 50%; zabity liczy się na dziś.
//   CDP_PORT=9475 node tests/kraby_test.js        (ZRZUTY=folder: zrzut plaży)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9475, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    await t.newGame({ map: 219, day: 40, hour: 10, quiet: true, minimap: false });
    await t.frames(90);
    const c = await t.json(`(() => { const L = Kraby.crabsHere(); return { n: L.length, scales: L.map(c => +c._scale.toFixed(3)), tones: L.map(c => (c._tone || []).join()), shore: Kraby.shore().length,
        nearWater: L.every(c => Kraby.shore().some(p => Math.abs(p.x - c._x) + Math.abs(p.y - c._y) <= 2)), names: L.map(c => c.name()) }; })()`);
    t.check("za dnia na plaży 3-6 małych krabów, przy samej wodzie (chodzą - do 2 kratek od niej)", c.n >= 3 && c.n <= 6 && c.nearWater && c.shore > 20, c);
    t.check("każdy krab innej wielkości (0,27-0,47) i ma odcień", new Set(c.scales).size >= Math.min(3, c.n) && c.scales.every(s => s >= 0.26 && s <= 0.48) && c.tones.every(x => x.length > 0), c);
    if (SHOTS && c.n) {
        await t.eval(`(() => { const k = Kraby.crabsHere()[0]; $gamePlayer.locate(k._x + 3, k._y); $gameMap.setDisplayPos(k._x - 12, k._y - 7); return 0; })()`);
        await t.frames(30); await t.shot(SHOTS + "/kraby_plaza.png");
    }
    // the shell: the share of a frontal blow against one from behind, for the small, the giant and the giga crab
    const shell = await t.json(`(() => {
        const C = Creatures, out = {};
        const test = (kind) => {
            let c = Kraby.crabsHere()[0];
            if (kind !== "krab_maly") { const p = Kraby.shore()[5]; C.spawn(kind, p.x, p.y, { tag: "test", single: true, level: 1 }); c = C.creatures().filter(o => o._kind === kind).pop(); }
            if (!c) return null;
            $gamePlayer.locate(c._x + 1, c._y); c._hp = 9999; c._stoneStunned = false; c._stun = 0;
            const hx = c.centerX() + 1, hy = c.centerY();
            const hit = (toward) => { c._faceAng = toward ? Math.atan2(hy - c.centerY(), hx - c.centerX()) : Math.atan2(c.centerY() - hy, c.centerX() - hx); c._stoneStunned = false; const h0 = c._hp; C.hit(c, 40, "melee", {}); return h0 - c._hp; };
            const front = hit(true), back = hit(false);
            return { front, back, ratio: +(front / back).toFixed(3), scale: +c._scale.toFixed(3) };
        };
        out.maly = test("krab_maly"); out.olbrzym = test("krab_olbrzym"); out.kolos = test("krab_kolos");
        return out; })()`);
    t.check("od przodu: mały -10%, olbrzym -30%, kolos -50% (wobec ciosu w plecy x1,2 / x1,4)", shell.maly && Math.abs(shell.maly.ratio - 0.9 / 1.2) < 0.06 && Math.abs(shell.olbrzym.ratio - 0.7 / 1.4) < 0.06
        && Math.abs(shell.kolos.ratio - 0.5 / 1.4) < 0.06 && shell.maly.front > 0, shell);
    const sizes = await t.json(`(() => { const p = Kraby.shore()[9]; for (let i = 0; i < 6; i++) Creatures.spawn("krab_olbrzym", p.x, p.y, { tag: "test", single: true, level: 1 });
        return Creatures.creatures().filter(o => o._kind === "krab_olbrzym").map(o => +o._scale.toFixed(3)); })()`);
    t.check("kraby olbrzymy z morza też różnej wielkości (0,85-1,18)", new Set(sizes).size >= 3 && sizes.every(s => s >= 0.84 && s <= 1.19), sizes);
    // a kill counts for today
    const kill = await t.json(`(() => { const k0 = Kraby.state().killed, c = Kraby.crabsHere()[0]; c._hp = 1; Creatures.hit(c, 50, "melee", {}); return { k0, k1: Kraby.state().killed }; })()`);
    await t.frames(60);
    t.check("zabity mały krab liczy się na dziś (najwyżej 7 dziennie)", kill.k1 === kill.k0 + 1, kill);
    // (2026-11-19, the user: the dead crabs lay oddly - the drowned's dark puddle under them) a crab's remains: on its back, a soft shadow
    await t.frames(60);
    const rem = await t.json(`(() => { const L = (Creatures.drops ? Creatures.drops() : []).filter(d => d.look === "SeaCrab"); const d = L[L.length - 1];
        if (d) { $gamePlayer.locate(Math.floor(d.x) + 2, Math.floor(d.y)); $gameMap.setDisplayPos(Math.floor(d.x) - 8, Math.floor(d.y) - 5); }
        return { kinds: L.map(o => o.kind), scale: d ? d.scale : null }; })()`);
    if (SHOTS) { await t.frames(20); await t.shot(SHOTS + "/krab_martwy.png"); }
    t.check("martwy krab leży na grzbiecie bez kałuży (szczątki „crab”)", rem.kinds.length > 0 && rem.kinds.every(k => k === "crab"), rem);
    // at night: none on the beach
    await t.setDay(40, 23);
    await t.go(218, 30, 18); await t.go(219, 30, 30);
    await t.frames(60);
    t.check("w nocy na plaży nie ma małych krabów", (await t.json("Kraby.crabsHere().length")) === 0);
});
