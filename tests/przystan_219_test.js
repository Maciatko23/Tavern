// Przystań na Słonym Brzegu (Map219, 2026-11-16): prom przy molo w dni promu, przewoźnik, kuter Rocha.
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const shown = name => `$gameMap.events().filter(e => e.event().name === ${JSON.stringify(name)}).map(e => !e.isTransparent())`;
    t.check("nowa gra", await t.newGame({ map: 219, x: 32, y: 47, dir: 4, hour: 10, quiet: true, minimap: false }));
    const ferryDay = await J("(function(){ for (let d = 1; d < 12; d++) if (TownQuests.isFerry(d)) return d; return 0; })()");
    await t.eval(`Tawerna.state("clock").day = ${ferryDay}; 0`); await t.setHour(10); await t.go(219, 32, 47, 4); await t.frames(90);
    const f = await J(`({ now: Przystan.ferryNow(), prom: ${shown("Prom")}, man: (function(){ const e = $gameMap.event(760); return e ? { x: e.x, y: e.y, hidden: e.isTransparent(), pass: $gameMap.checkPassage(e.x, e.y, 0x0f) } : null; })() })`);
    t.check("dzień promu, 10:00: prom stoi przy molo, przewoźnik na molo (21,48) na desce, nie w wodzie", f.now && f.prom.length === 1 && f.prom[0] && f.man && !f.man.hidden && f.man.x === 21 && f.man.y === 48 && f.man.pass, f);
    if (process.env.SHOT) { await t.eval("$gamePlayer.locate(27, 47); 0"); await t.frames(40); await t.shot(process.env.SHOT); }
    const talk = await t.talkTo("$gameMap.event(760)", [], { secs: 20 }).catch(e => ({ text: "ERR " + e.message }));
    t.check("przewoźnik odpowiada bohaterowi", !!talk.text && !/^ERR/.test(talk.text), String(talk.text).slice(0, 120));
    await t.eval(`Tawerna.state("clock").day = ${ferryDay + 1}; 0`); await t.setHour(10); await t.go(219, 32, 47, 4); await t.frames(90);
    const g = await J(`({ now: Przystan.ferryNow(), prom: ${shown("Prom")}, man: $gameMap.event(760) ? $gameMap.event(760).isTransparent() : null, kuter: Przystan.kuterState(), beach: ${shown("Kuter: wrak na plaży")}, slip: ${shown("Kuter: na pochylni")}, water: ${shown("Kuter: na wodzie")} })`);
    t.check("dzień bez promu: promu i przewoźnika nie widać", !g.now && g.prom[0] === false && g.man === true, g);
    t.check("kuter Rocha: na początku wrak na plaży, pozostałe stany ukryte", g.kuter === "beach" && g.beach[0] === true && g.slip[0] === false && g.water[0] === false, g);
});
