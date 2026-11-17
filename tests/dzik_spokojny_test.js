// Dziki nie atakują ludzi, póki same nie zostaną zaatakowane (gracz 2026-11-16).
//   - dzik, którego nikt nie uderzył: zauważa bohatera, odwraca się i patrzy, ale nie ostrzega i nie szarżuje - nawet tuż obok;
//   - pierwszy cios (tu: oszczep) i dzik jest bestią jak dawniej: ostrzega / szarżuje;
//   - nieuderzony dzik nie rzuca się też na ludzi (bandytę) obok.
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    t.check("nowa gra", await t.newGame());
    await t.eval("window.__dzikiJakDawniej = false; 0");   // (the game's own rule: tests/cdp.js turns it off for the old fight tests)
    await t.setHour(6);   // (the boar's hours: dawn - at noon an ordinary one goes home)
    await t.go(219, 60, 36, 6);
    await t.frames(20);
    await t.eval("Hunting.animals.slice().forEach(a => Hunting.removeAnimal ? Hunting.removeAnimal(a) : 0); 0");
    const spot = await J("(function(){ for (let x = 63; x < 70; x++) if ($gameMap.isPassable(x, 36, 4) && !$gameMap.eventsXy(x, 36).length) return x; return 0; })()");
    await t.eval(`(function(){ const a = Hunting.spawn("boar", ${spot}, 36); a._wait = 9999; a._aware = 1; window.__dzik = a; return 0; })()`);
    const modes = new Set();
    for (let i = 0; i < 40; i++) { await t.frames(15); modes.add(await J("window.__dzik._mode")); }
    const calm = await J("({ mode: window.__dzik._mode, hp: window.__dzik._hp, max: window.__dzik._maxHp, heroHp: $gameActors.actor(1).hp, heroMax: $gameActors.actor(1).mhp, d: Math.round(window.__dzik.playerDistance()) })");
    t.check("dzik, którego nikt nie uderzył, widzi bohatera 10 sekund z bliska i nie robi nic: ani ostrzeżenia, ani szarży, bohater cały",
        [...modes].every(m => m === "roam") && calm.heroHp === calm.heroMax && !(await J("!!window.__dzik._dead")) && (await J("Hunting.animals.includes(window.__dzik)")), { modes: [...modes], calm });
    // right beside it
    await t.eval("(function(){ const a = window.__dzik; $gamePlayer.locate(a._x - 1, a._y); $gamePlayer.setDirection(6); return 0; })()");
    const near = new Set();
    for (let i = 0; i < 20; i++) { await t.frames(15); near.add(await J("window.__dzik._mode")); }
    t.check("...nawet gdy bohater stoi tuż obok", [...near].every(m => m === "roam") && (await J("$gameActors.actor(1).hp === $gameActors.actor(1).mhp")) && (await J("Hunting.animals.includes(window.__dzik)")), [...near]);
    // a bandit beside it: no clash
    const man = await J("(function(){ const a = window.__dzik; const h = window.Humans && Humans.spawn ? Humans.spawn('bandit', a._x + 2, a._y) : null; window.__chlop = h; return !!h; })()");
    if (man) {
        await t.frames(240);
        t.check("...i nie rzuca się na człowieka obok (bandyta)", await J("!window.__dzik._clash && window.__dzik._mode === 'roam'"), await J("({ clash: !!window.__dzik._clash, mode: window.__dzik._mode })"));
        await t.eval("Humans.clear(); 0");
    }
    // the first blow
    await t.eval("(function(){ const a = window.__dzik; $gamePlayer.locate(a._x - 3, a._y); $gamePlayer.setDirection(6); Hunting.hit(a, 10, 'arrow'); return 0; })()");
    const after = new Set();
    for (let i = 0; i < 24; i++) { await t.frames(10); after.add(await J("window.__dzik._mode")); }
    t.check("pierwszy cios kończy pokój: dzik ostrzega albo szarżuje jak dawniej", await J("window.__dzik._provoked === true") && [...after].some(m => m === "charge" || m === "warn" || m === "approach"), { after: [...after], st: await J("({ aware: window.__dzik._aware, prov: window.__dzik._provoked, wait: window.__dzik._wait, hp: window.__dzik._hp, stun: window.__dzik._stun, dead: !!window.__dzik._dead, d: window.__dzik.playerDistance(), frozen: !!window.__dzik._frozen, flag: window.__dzikiJakDawniej })") });
});
