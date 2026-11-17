// Dorosły orzeł wlatuje na granie (gracz 2026-11-16: „dorosły orzeł może tam wlecieć”): Krucze Turnie -> Krucza Grań -> Orla Grań i z powrotem.
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    t.check("nowa gra", await t.newGame({ map: 222, x: 30, y: 45, dir: 8, hour: 11, quiet: true, minimap: false }));
    await t.frames(30);
    await t.eval(`(function(){ const s = Orzel.state(); s.have = true; s.stage = 5; s.name = "Śnieżny"; s.bond = 90; s.food = 100; s.water = 100; s.hp = Orzel.maxHp ? Orzel.maxHp() : 220; s.st = Orzel.maxSt(); s.map = $gameMap.mapId(); s.away = null; s.hurtUntil = 0;
        Orzel.removeEagle(); Orzel.spawnHere({ near: true }); return 0; })()`);
    await t.frames(30);
    const why = await J("OrzelLot.why()");
    t.check("dorosły orzeł przy bohaterze może wystartować", why === "", why);
    await t.eval("OrzelLot.mount(); 0"); await t.frames(90);
    t.check("lot nad Kruczymi Turniami", await J("OrzelLot.flying() && $gameMap.mapId() === 222"));
    const fly = async (dir, to) => {
        await t.eval(`(function(){ const p = $gamePlayer; p._realY = ${dir === "up" ? 3 : "$gameMap.height() - 4"}; p._realX = 40; Input._currentState.${dir} = true; return 0; })()`);
        const ok = await t.until(`$gameMap.mapId() === ${to}`, 20);
        await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(60);
        return { ok, st: await J("({ map: $gameMap.mapId(), on: OrzelLot.flying(), x: Math.round($gamePlayer._realX), y: Math.round($gamePlayer._realY), eMap: Orzel.state().map })") };
    };
    const a = await fly("up", 29);
    t.check("przez północną krawędź gór w górę: Krucza Grań (od południa, ta sama kolumna), dalej w locie", a.ok && a.st.on && a.st.eMap === 29 && a.st.y > 60 && Math.abs(a.st.x - 40) <= 3, a.st);
    const b = await fly("up", 30);
    t.check("...i jeszcze wyżej: Orla Grań", b.ok && b.st.on && b.st.eMap === 30 && b.st.y > 60, b.st);
    if (process.env.SHOT) await t.shot(process.env.SHOT);
    const c = await fly("down", 29);
    t.check("przez południową krawędź w dół: z Orlej Grani na Kruczą Grań (od północy)", c.ok && c.st.on && c.st.y < 20, c.st);
    const d = await fly("down", 222);
    t.check("...i z Kruczej Grani z powrotem nad Krucze Turnie", d.ok && d.st.on && d.st.y < 20, d.st);
});
